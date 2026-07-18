#!/usr/bin/env python3
"""Generate one MP3 per episode dialogue line with edge-tts, using a distinct
neural voice per Straw Hat so each character actually SOUNDS like themselves —
replacing the robotic browser speech synthesizer the episodes used before.

Voice casting (edge-tts neural voices, tuned with rate/pitch to fit personality):
    luffy   -> en-US-GuyNeural        bright, fast, excitable  (the reckless captain)
    nami    -> en-US-JennyNeural      warm, playful, confident (the flirty navigator)
    usopp   -> en-US-BrianNeural      high, jittery, nasal-ish (the cowardly braggart)
    zoro    -> en-US-ChristopherNeural deep, slow, gruff        (the stoic swordsman)
    robin   -> en-GB-SoniaNeural      calm, elegant, measured   (the mysterious scholar)
    chopper -> en-US-AnaNeural        small child voice, cute   (the reindeer doctor)
    brook   -> en-GB-ThomasNeural     deep, theatrical, old     (the skeleton musician)

Two-step build (run from this dir):
    node extract_narrations.js          # episodes.js -> narrations.json
    pip install --user edge-tts
    python3 generate_audio.py           # narrations.json -> *.mp3 + manifest.*

Output: data/episodes/audio/<episode-id>-<step-index>.mp3 and manifest.js
(window.EPISODE_AUDIO) mapping each episode to its per-step clip + duration.

DISPLAY vs SPOKEN: the on-screen dialogue keeps its original text; before
synthesis each line is passed through to_speakable(), which rewrites tokens the
voice mishandles — Big-O notation (O(n)), acronyms (BFS, XOR) and bare single
letters (n, K, i used as variable names) — into forms it pronounces correctly.
"""
import asyncio
import json
import os
import re
import sys

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
NARR = os.path.join(HERE, "narrations.json")
OUT_DIR = HERE

CONCURRENCY = 4
MAX_RETRIES = 4

# Only re-render these speakers (comma list in ONLY_SPEAKERS env), merging the
# result into the existing manifest so the other characters' clips are kept as
# they are. Empty = render everything from scratch.
ONLY_SPEAKERS = {s.strip() for s in os.environ.get("ONLY_SPEAKERS", "").split(",") if s.strip()}

# --- Voice casting: character -> (voice, rate, pitch, volume) ----------------
# volume ("+0%" default) lets a line pull back (fear) or lean in (excitement)
# without changing who is speaking.
VOICES = {
    "luffy":   ("en-US-GuyNeural",         "+13%", "+12Hz", "+0%"),
    "nami":    ("en-US-JennyNeural",       "+4%",  "+9Hz",  "+0%"),
    "usopp":   ("en-US-BrianNeural",       "+7%",  "+22Hz", "+0%"),
    "zoro":    ("en-US-ChristopherNeural", "-5%",  "-12Hz", "+0%"),
    "robin":   ("en-GB-SoniaNeural",       "-8%",  "-5Hz",  "+0%"),
    "chopper": ("en-US-AnaNeural",         "+6%",  "+0Hz",  "+0%"),
    "brook":   ("en-GB-ThomasNeural",      "-3%",  "-14Hz", "+0%"),
    # Fallback narrator for any unmapped speaker.
    "_default": ("en-US-AriaNeural",       "+0%",  "+0Hz",  "+0%"),
}

# --- Per-line emotion -------------------------------------------------------
# Nami is written to FEAR the problem (the brute-force danger) and get EXCITED
# by the solution. One flat voice flattens that arc, so each of her lines is
# classified from its own words and the voice is re-tuned line by line: fear =
# higher, quicker, pulled-back (anxious); excitement = higher, quicker, leaning
# in (thrilled). Neutral lines keep her base tuning. Deltas are ABSOLUTE tunings
# (they replace the base rate/pitch/volume), not additive.
EMOTION_TUNING = {
    "nami": {
        "fear":    ("+7%",  "+19Hz", "-7%"),
        "excited": ("+17%", "+24Hz", "+12%"),
    },
}

_FEAR_WORDS = [
    "trap", "danger", "dangerous", "stuck", "lost", "scary", "scared", "afraid",
    "worried", "worry", "panic", "run out", "running out", "forever", "too many",
    "too slow", "brute", "every pair", "every single", "explode", "overflow",
    "drown", "sink", "doom", "nightmare", "trouble", "uh oh", "oh no", "help",
    "can't", "cannot", "impossible", "waste", "wasting", "endless", "never finish",
    "all day", "all night", "give up", "hopeless", "grind", "crawl", "wrong",
    "miss", "fail", "swamped", "buried", "pile up", "piling", "storm", "sinking",
]
_EXCITED_WORDS = [
    "got it", "that's it", "that's the", "exactly", "solved", "it works", "works",
    "clever", "brilliant", "genius", "perfect", "yes", "found it", "found", "trick",
    "easy", "only once", "just one", "one pass", "beautiful", "nice", "amazing",
    "wow", "love", "sorted", "done", "finally", "saved", "treasure", "berries",
    "profit", "rich", "gold", "shortcut", "smart", "one glance", "instantly",
    "in a flash", "so simple", "no sweat", "cracked it", "there it is",
]


def classify_emotion(text):
    """Return 'fear', 'excited', or None from the words in a single line."""
    low = " " + text.lower() + " "
    fear = sum(1 for w in _FEAR_WORDS if w in low)
    exc = sum(1 for w in _EXCITED_WORDS if w in low)
    if exc > fear:
        return "excited"
    if fear > exc:
        return "fear"
    return None

# --- Spoken-text normalization (English) ------------------------------------
_BIGO = [
    ("O(n log K)", " big O of n log K "),
    ("O(n log n)", " big O of n log n "),
    ("O(n log m)", " big O of n log m "),
    ("O(n times k)", " big O of n times k "),
    ("O(log n)", " big O of log n "),
    ("O(n²)", " big O of n squared "),
    ("O(2ⁿ)", " big O of two to the n "),
    ("O(n)", " big O of n "),
    ("O(1)", " big O of one "),
    ("O(k)", " big O of k "),
    ("0xFFFFFFFF", " hex F F F F F F F F "),
    ("3Sum", " three sum "),
    ("n-1", " n minus one "),
    ("n+1", " n plus one "),
    ("n-2", " n minus two "),
]
_ACRO = {"BFS": "B F S", "DFS": "D F S", "BST": "B S T",
         "XOR": "ex or", "DAG": "dag", "LCA": "L C A"}

# Luffy's laugh. "SHISHISHI" spelled out is read as a flat, robotic
# "shish-ishi" — not a laugh at all. Rewrite any run of it into a real,
# open-mouthed carefree laugh that keeps his signature "shi" onset, then breaks
# into staccato giggle/belly-laugh syllables (each as its own token so the voice
# renders separate bursts) with the exclamation energy of the captain.
_LAUGH_RE = re.compile(r"(?<![A-Za-z])sh+i(?:sh+i)+(?![A-Za-z])", re.IGNORECASE)
_LAUGH_TEXT = "Shi hi hi hi ha ha ha!"


def _laughs(text):
    text = _LAUGH_RE.sub(_LAUGH_TEXT, text)
    # The laugh ends in "!"; fold any punctuation the original left right after
    # it ("!!", "!,", "!.") back into a single clean exclamation.
    return re.sub(r"!\s*[!,.]+", "! ", text)


def _apply_lookaround(text, mapping):
    for key in sorted(mapping, key=len, reverse=True):
        pat = re.compile(r"(?<![A-Za-z])" + re.escape(key) + r"(?![A-Za-z])")
        text = pat.sub(mapping[key], text)
    return text


def to_speakable(text):
    text = _laughs(text)
    for a, b in _BIGO:
        text = text.replace(a, b)
    text = _apply_lookaround(text, _ACRO)
    return re.sub(r"\s{2,}", " ", text).strip()


# ---------------------------------------------------------------------------

def voice_for(speaker, text=""):
    """Return (voice, rate, pitch, volume) for a line, applying per-line emotion
    tuning where the character has it (currently Nami's fear/excitement arc)."""
    base = VOICES.get(speaker, VOICES["_default"])
    voice, rate, pitch, volume = base
    emo_map = EMOTION_TUNING.get(speaker)
    if emo_map:
        emo = classify_emotion(text)
        if emo in emo_map:
            rate, pitch, volume = emo_map[emo]
    return voice, rate, pitch, volume


async def synth_line(sem, ep_id, idx, speaker, text, result):
    async with sem:
        out_mp3 = os.path.join(OUT_DIR, f"{ep_id}-{idx}.mp3")
        voice, rate, pitch, volume = voice_for(speaker, text)
        spoken = to_speakable(text)
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                comm = edge_tts.Communicate(spoken, voice, rate=rate, pitch=pitch, volume=volume)
                audio = bytearray()
                last_end = 0.0
                async for chunk in comm.stream():
                    if chunk["type"] == "audio":
                        audio.extend(chunk["data"])
                    elif chunk["type"] in ("SentenceBoundary", "WordBoundary"):
                        off = chunk["offset"] / 10_000_000.0
                        dur = chunk.get("duration", 0) / 10_000_000.0
                        last_end = off + dur
                if not audio:
                    raise RuntimeError("no audio bytes")
                with open(out_mp3, "wb") as f:
                    f.write(audio)
                result[ep_id][idx] = {
                    "file": f"{ep_id}-{idx}.mp3",
                    "speaker": speaker,
                    "voice": voice,
                    "dur": round(last_end, 3),
                }
                sys.stdout.write(f"  ✓ {ep_id}-{idx}  [{speaker}/{voice.split('-')[-1]}]  {len(audio)//1024}KB\n")
                sys.stdout.flush()
                return
            except Exception as e:  # noqa
                if attempt == MAX_RETRIES:
                    sys.stdout.write(f"  ✗ {ep_id}-{idx} FAILED: {e}\n")
                    sys.stdout.flush()
                    result[ep_id][idx] = {"file": None, "speaker": speaker}
                    return
                await asyncio.sleep(1.5 * attempt)


def _load_existing_decks():
    path = os.path.join(OUT_DIR, "manifest.json")
    if not os.path.exists(path):
        return {}
    try:
        with open(path) as f:
            return json.load(f).get("decks", {})
    except Exception:
        return {}


async def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(NARR) as f:
        narrations = json.load(f)

    # In merge mode, start from the existing decks and only re-render the
    # requested speakers; otherwise render everything.
    existing = _load_existing_decks() if ONLY_SPEAKERS else {}
    if ONLY_SPEAKERS:
        print(f"Merge mode: re-rendering only {sorted(ONLY_SPEAKERS)}; keeping the rest.")
    else:
        print(f"Casting {len(VOICES) - 1} character voices; building episode audio.")

    result = {ep: [None] * len(steps) for ep, steps in narrations.items()}
    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = []
    kept = 0
    for ep_id, steps in narrations.items():
        for idx, step in enumerate(steps):
            speaker = step["speaker"]
            if ONLY_SPEAKERS and speaker not in ONLY_SPEAKERS:
                prev = (existing.get(ep_id) or [None] * len(steps))
                entry = prev[idx] if idx < len(prev) else None
                mp3_ok = entry and entry.get("file") and \
                    os.path.exists(os.path.join(OUT_DIR, entry["file"]))
                if mp3_ok:
                    result[ep_id][idx] = entry
                    kept += 1
                    continue
                # No usable prior clip — fall through and render it.
            tasks.append(synth_line(sem, ep_id, idx, speaker, step["line"], result))
    if ONLY_SPEAKERS:
        print(f"Keeping {kept} existing clips; re-rendering {len(tasks)}.")
    await asyncio.gather(*tasks)

    manifest = {
        "voices": {k: {"voice": v[0], "rate": v[1], "pitch": v[2], "volume": v[3]}
                   for k, v in VOICES.items() if k != "_default"},
        "decks": result,
    }
    with open(os.path.join(OUT_DIR, "manifest.json"), "w") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)

    with open(os.path.join(OUT_DIR, "manifest.js"), "w") as f:
        f.write("/* Auto-generated by generate_audio.py. Maps each episode+step to its\n")
        f.write("   pre-rendered, character-voiced narration MP3. Do not edit by hand. */\n")
        f.write("window.EPISODE_AUDIO = ")
        json.dump(manifest, f, ensure_ascii=False)
        f.write(";\n")

    total = sum(len(s) for s in result.values())
    failed = sum(1 for s in result.values() for x in s if not x or not x["file"])
    print(f"\nDone: {total} lines, {failed} failed. Manifest -> {OUT_DIR}/manifest.json")


if __name__ == "__main__":
    asyncio.run(main())
