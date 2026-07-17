#!/usr/bin/env python3
"""Generate one MP3 per slide narration with edge-tts, plus manifest.json /
manifest.js mapping each slide to its audio file and per-sentence start times
(media seconds) for the read-along transcript highlight.

The language is auto-detected from this file's location:
    data/nepali/audio/  -> Nepali  (ne-NP-HemkalaNeural)
    data/english/audio/ -> English (en-US-AvaMultilingualNeural)
so the identical script lives in both audio dirs.

Two-step build (run from the audio dir you want to build):
    node extract_narrations.js      # decks -> narrations.json
    pip install --user edge-tts
    python3 generate_audio.py       # narrations.json -> *.mp3 + manifest.*

DISPLAY vs SPOKEN: the transcript shows the original narration text, but before
synthesis each sentence is passed through to_speakable(), which rewrites tokens
the TTS voice mishandles — bare letters (n, K, i), Big-O notation (O(n)) and
acronyms (BFS, XOR) — into forms it pronounces correctly. This never adds/removes
sentence terminators (।!?/.!?), so the spoken sentence count still matches the
displayed one and the timing map stays aligned.

Sentence splitting mirrors the JS engine. Per-sentence start times come from
edge-tts SentenceBoundary events (1:1 with our split); a proportional-by-length
fallback covers the rare merge mismatch.
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
LANG_DIR = os.path.basename(os.path.dirname(HERE))   # "nepali" or "english"

CONCURRENCY = 4
MAX_RETRIES = 4

# Split on sentence terminators of either script (।!? plus Latin .!?). Latin '.'
# is intentionally NOT a splitter here — abbreviations shouldn't fragment a
# sentence — matching the JS engine's /[^।!?]+[।!?]*/ for Devanagari; for English
# we add . ! ? below.
if LANG_DIR == "english":
    SENT_RE = re.compile(r"[^.!?]+[.!?]*")
else:
    SENT_RE = re.compile(r"[^।!?]+[।!?]*")
STRIP_RE = re.compile(r"[\s।!?,.‍‌]+")


# ---------------------------------------------------------------------------
# Spoken-text normalization
# ---------------------------------------------------------------------------

def _apply_lookaround(text, mapping):
    """Replace each key as a standalone Latin token (not glued to other Latin
    letters), longest key first."""
    for key in sorted(mapping, key=len, reverse=True):
        pat = re.compile(r"(?<![A-Za-z])" + re.escape(key) + r"(?![A-Za-z])")
        text = pat.sub(mapping[key], text)
    return text


# Big-O and other exact literals, replaced first (longest first via ordering).
_BIGO_NE = [
    ("O(n log K)", " बिग ओ अफ एन लग के "),
    ("O(n log n)", " बिग ओ अफ एन लग एन "),
    ("O(n times k)", " बिग ओ अफ एन गुणा के "),
    ("O(log n)", " बिग ओ अफ लग एन "),
    ("O(n²)", " बिग ओ अफ एन स्क्वायर्ड "),
    ("O(2ⁿ)", " बिग ओ अफ टु द पावर एन "),
    ("O(n)", " बिग ओ अफ एन "),
    ("O(1)", " बिग ओ अफ वन "),
    ("O(k)", " बिग ओ अफ के "),
    ("0xFFFFFFFF", " हेक्स को आठवटा एफ "),
    ("3Sum", " थ्री सम "),
    ("n-1", " एन माइनस वन "),
    ("n+1", " एन प्लस वन "),
    ("n-2", " एन माइनस टु "),
]
_ACRO_NE = {
    "BFS": "बी एफ एस", "DFS": "डी एफ एस", "BST": "बी एस टी", "DP": "डी पी",
    "XOR": "एक्स ओ आर", "AND": "एण्ड", "OR": "ओ आर", "NOT": "नट",
    "LRU": "एल आर यू", "AVL": "ए भी एल", "TSP": "टी एस पी", "DAG": "ड्याग",
    "IP": "आई पी", "VIP": "भी आई पी",
}
_LETTER_NE = {
    "n": "एन", "N": "एन", "K": "के", "k": "के", "i": "आई", "j": "जे",
    "x": "एक्स", "X": "एक्स", "m": "एम", "P": "पी", "T": "टी", "V": "भी",
    "u": "यू", "v": "भी", "w": "डब्ल्यू", "b": "बी", "E": "ई",
}

_BIGO_EN = [
    ("O(n log K)", " big O of n log K "),
    ("O(n log n)", " big O of n log n "),
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
_ACRO_EN = {"XOR": "ex or", "DAG": "dag"}


def to_speakable(text):
    if LANG_DIR == "english":
        for a, b in _BIGO_EN:
            text = text.replace(a, b)
        text = _apply_lookaround(text, _ACRO_EN)
    else:
        for a, b in _BIGO_NE:
            text = text.replace(a, b)
        text = _apply_lookaround(text, _ACRO_NE)
        text = _apply_lookaround(text, _LETTER_NE)
    return re.sub(r"\s{2,}", " ", text).strip()


# ---------------------------------------------------------------------------

VOICES = {
    "nepali": ("ne-NP-HemkalaNeural", "-8%", "-2Hz"),
    "english": ("en-US-AvaMultilingualNeural", "-6%", "+0Hz"),
}
VOICE, RATE, PITCH = VOICES[LANG_DIR]
AUDIO_VAR = "ENGLISH_AUDIO" if LANG_DIR == "english" else "NEPALI_AUDIO"


def split_sentences(text):
    return [s.strip() for s in SENT_RE.findall(text) if s.strip()]


def norm_len(s):
    return len(STRIP_RE.sub("", s))


async def synth_slide(sem, deck_id, idx, text, result):
    async with sem:
        out_mp3 = os.path.join(OUT_DIR, f"{deck_id}-{idx}.mp3")
        spoken = to_speakable(text)
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                comm = edge_tts.Communicate(spoken, VOICE, rate=RATE, pitch=PITCH)
                audio = bytearray()
                bounds = []  # (offset_sec, end_sec) per TTS sentence, in order
                async for chunk in comm.stream():
                    if chunk["type"] == "audio":
                        audio.extend(chunk["data"])
                    elif chunk["type"] in ("SentenceBoundary", "WordBoundary"):
                        off = chunk["offset"] / 10_000_000.0
                        dur = chunk.get("duration", 0) / 10_000_000.0
                        bounds.append((off, off + dur))
                if not audio:
                    raise RuntimeError("no audio bytes")
                with open(out_mp3, "wb") as f:
                    f.write(audio)

                sents = split_sentences(text)   # timings map to DISPLAY sentences
                total_dur = bounds[-1][1] if bounds else 0.0

                if len(bounds) == len(sents) and bounds:
                    starts = [round(b[0], 3) for b in bounds]
                else:
                    lens = [max(1, norm_len(s)) for s in sents]
                    tot = sum(lens)
                    acc = 0
                    starts = []
                    for L in lens:
                        starts.append(round(total_dur * acc / tot, 3))
                        acc += L

                result[deck_id][idx] = {
                    "file": f"{deck_id}-{idx}.mp3",
                    "dur": round(total_dur, 3),
                    "sentences": starts,
                }
                tag = "1:1" if len(bounds) == len(sents) else f"FALLBACK {len(bounds)}vs{len(sents)}"
                sys.stdout.write(f"  ✓ {deck_id}-{idx}  ({len(sents)} sentences, {tag}, {len(audio)//1024}KB)\n")
                sys.stdout.flush()
                return
            except Exception as e:  # noqa
                if attempt == MAX_RETRIES:
                    sys.stdout.write(f"  ✗ {deck_id}-{idx} FAILED: {e}\n")
                    sys.stdout.flush()
                    result[deck_id][idx] = {"file": None, "sentences": []}
                    return
                await asyncio.sleep(1.5 * attempt)


async def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(NARR) as f:
        narrations = json.load(f)

    print(f"Building {LANG_DIR} audio with {VOICE} (rate {RATE}, pitch {PITCH})")
    result = {deck: [None] * len(slides) for deck, slides in narrations.items()}
    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = []
    for deck_id, slides in narrations.items():
        for idx, text in enumerate(slides):
            tasks.append(synth_slide(sem, deck_id, idx, text, result))
    await asyncio.gather(*tasks)

    manifest = {"voice": VOICE, "rate": RATE, "pitch": PITCH, "decks": result}
    with open(os.path.join(OUT_DIR, "manifest.json"), "w") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)

    # Script-loadable form so the page works without fetch()/CORS (mirrors how
    # the deck files are loaded via <script> injection).
    with open(os.path.join(OUT_DIR, "manifest.js"), "w") as f:
        f.write("/* Auto-generated by generate_audio.py. Maps each deck+slide to its\n")
        f.write("   pre-rendered narration MP3 and per-sentence start times (media\n")
        f.write("   seconds) for read-along highlighting. Do not edit by hand. */\n")
        f.write(f"window.{AUDIO_VAR} = ")
        json.dump(manifest, f, ensure_ascii=False)
        f.write(";\n")

    total = sum(len(s) for s in result.values())
    failed = sum(1 for s in result.values() for x in s if not x or not x["file"])
    print(f"\nDone: {total} slides, {failed} failed. Manifest -> {OUT_DIR}/manifest.json")


if __name__ == "__main__":
    asyncio.run(main())
