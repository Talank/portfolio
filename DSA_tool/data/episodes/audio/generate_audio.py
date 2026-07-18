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

# --- Voice casting: character -> (voice, rate, pitch) ------------------------
VOICES = {
    "luffy":   ("en-US-GuyNeural",         "+13%", "+12Hz"),
    "nami":    ("en-US-JennyNeural",       "+4%",  "+9Hz"),
    "usopp":   ("en-US-BrianNeural",       "+7%",  "+22Hz"),
    "zoro":    ("en-US-ChristopherNeural", "-5%",  "-12Hz"),
    "robin":   ("en-GB-SoniaNeural",       "-8%",  "-5Hz"),
    "chopper": ("en-US-AnaNeural",         "+6%",  "+0Hz"),
    "brook":   ("en-GB-ThomasNeural",      "-3%",  "-14Hz"),
    # Fallback narrator for any unmapped speaker.
    "_default": ("en-US-AriaNeural",       "+0%",  "+0Hz"),
}

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


def _apply_lookaround(text, mapping):
    for key in sorted(mapping, key=len, reverse=True):
        pat = re.compile(r"(?<![A-Za-z])" + re.escape(key) + r"(?![A-Za-z])")
        text = pat.sub(mapping[key], text)
    return text


def to_speakable(text):
    for a, b in _BIGO:
        text = text.replace(a, b)
    text = _apply_lookaround(text, _ACRO)
    return re.sub(r"\s{2,}", " ", text).strip()


# ---------------------------------------------------------------------------

def voice_for(speaker):
    return VOICES.get(speaker, VOICES["_default"])


async def synth_line(sem, ep_id, idx, speaker, text, result):
    async with sem:
        out_mp3 = os.path.join(OUT_DIR, f"{ep_id}-{idx}.mp3")
        voice, rate, pitch = voice_for(speaker)
        spoken = to_speakable(text)
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                comm = edge_tts.Communicate(spoken, voice, rate=rate, pitch=pitch)
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


async def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(NARR) as f:
        narrations = json.load(f)

    print(f"Casting {len(VOICES) - 1} character voices; building episode audio.")
    result = {ep: [None] * len(steps) for ep, steps in narrations.items()}
    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = []
    for ep_id, steps in narrations.items():
        for idx, step in enumerate(steps):
            tasks.append(synth_line(sem, ep_id, idx, step["speaker"], step["line"], result))
    await asyncio.gather(*tasks)

    manifest = {
        "voices": {k: {"voice": v[0], "rate": v[1], "pitch": v[2]}
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
