#!/usr/bin/env python3
"""Generate English narration audio for the presentation's English track using
Kokoro-82M (a local neural TTS) — noticeably more natural than edge-tts, and
fully offline (no text leaves the machine).

Kokoro emits no sentence-boundary timestamps, so we synthesize each sentence
separately, measure its exact duration, and stitch the clips together with a
short pause. This yields precise per-sentence start times for the read-along
transcript highlight (better than estimated boundaries).

Two-step build (run from this directory):
    node extract_narrations.js       # decks -> narrations.json
    pip install --user kokoro-onnx soundfile misaki
    python3 generate_audio.py        # narrations.json -> *.mp3 + manifest.*

Model files (~350 MB) are cached in ~/.local/share/kokoro and auto-downloaded
on first run. DISPLAY vs SPOKEN: the transcript shows the original text, but
before synthesis each sentence is passed through to_speakable() so Big-O and
acronyms are pronounced correctly. This never changes the sentence count, so
timings stay aligned.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
NARR = os.path.join(HERE, "narrations.json")
OUT_DIR = HERE

MODEL_DIR = os.path.expanduser("~/.local/share/kokoro")
MODEL = os.path.join(MODEL_DIR, "kokoro-v1.0.onnx")
VOICES = os.path.join(MODEL_DIR, "voices-v1.0.bin")
MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"

VOICE = "af_heart"     # warm, natural (user-chosen)
SPEED = 0.9            # calm baseline; UI Speed slider adjusts playbackRate live
LANG = "en-us"
SR = 24000
GAP = 0.28            # seconds of silence between sentences
AUDIO_VAR = "ENGLISH_AUDIO"

SENT_RE = re.compile(r"[^.!?]+[.!?]*")

# --- spoken-text normalization (English) ---
_BIGO = [
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
_ACRO = {"XOR": "ex or", "DAG": "dag"}


def to_speakable(text):
    for a, b in _BIGO:
        text = text.replace(a, b)
    for k in sorted(_ACRO, key=len, reverse=True):
        text = re.sub(r"(?<![A-Za-z])" + re.escape(k) + r"(?![A-Za-z])", _ACRO[k], text)
    return re.sub(r"\s{2,}", " ", text).strip()


def split_sentences(text):
    return [s.strip() for s in SENT_RE.findall(text) if s.strip()]


def ensure_model():
    os.makedirs(MODEL_DIR, exist_ok=True)
    for path, url in ((MODEL, MODEL_URL), (VOICES, VOICES_URL)):
        if not os.path.exists(path):
            sys.stdout.write(f"downloading {os.path.basename(path)} ...\n")
            sys.stdout.flush()
            urllib.request.urlretrieve(url, path)


def main():
    ensure_model()
    from kokoro_onnx import Kokoro
    kok = Kokoro(MODEL, VOICES)

    with open(NARR) as f:
        narrations = json.load(f)

    silence = np.zeros(int(GAP * SR), dtype=np.float32)
    result = {}
    total = failed = 0

    print(f"Building english audio with Kokoro {VOICE} (speed {SPEED})")
    for deck_id, slides in narrations.items():
        result[deck_id] = []
        for idx, narration in enumerate(slides):
            total += 1
            sents = split_sentences(narration)
            try:
                parts, starts, t = [], [], 0.0
                for i, s in enumerate(sents):
                    samples, sr = kok.create(to_speakable(s), voice=VOICE, speed=SPEED, lang=LANG)
                    samples = np.asarray(samples, dtype=np.float32)
                    starts.append(round(t, 3))
                    parts.append(samples)
                    t += len(samples) / sr
                    if i < len(sents) - 1:
                        parts.append(silence)
                        t += GAP
                full = np.concatenate(parts) if parts else np.zeros(1, dtype=np.float32)
                out = os.path.join(OUT_DIR, f"{deck_id}-{idx}.mp3")
                sf.write(out, full, SR, format="MP3")
                result[deck_id].append({
                    "file": f"{deck_id}-{idx}.mp3",
                    "dur": round(len(full) / SR, 3),
                    "sentences": starts,
                })
                sys.stdout.write(f"  ✓ {deck_id}-{idx}  ({len(sents)} sentences, {round(len(full)/SR,1)}s)\n")
                sys.stdout.flush()
            except Exception as e:  # noqa
                failed += 1
                result[deck_id].append({"file": None, "sentences": []})
                sys.stdout.write(f"  ✗ {deck_id}-{idx} FAILED: {e}\n")
                sys.stdout.flush()

    manifest = {"voice": f"kokoro:{VOICE}", "speed": SPEED, "decks": result}
    with open(os.path.join(OUT_DIR, "manifest.json"), "w") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT_DIR, "manifest.js"), "w") as f:
        f.write("/* Auto-generated by generate_audio.py (Kokoro). Maps each deck+slide\n")
        f.write("   to its pre-rendered narration MP3 and per-sentence start times (media\n")
        f.write("   seconds) for read-along highlighting. Do not edit by hand. */\n")
        f.write(f"window.{AUDIO_VAR} = ")
        json.dump(manifest, f, ensure_ascii=False)
        f.write(";\n")

    build_opus_siblings(OUT_DIR)
    print(f"\nDone: {total} slides, {failed} failed. Manifest -> {OUT_DIR}/manifest.json")


def build_opus_siblings(out_dir):
    """The site serves each clip as .opus (~55% smaller) to browsers that can
    play it, falling back to the MP3 otherwise — so every clip must exist in
    both formats. Requires ffmpeg with libopus; skips already-up-to-date files."""
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        print("WARNING: ffmpeg not found — .opus siblings not built; "
              "browsers will fall back to the larger MP3s.")
        return
    n = 0
    for name in sorted(os.listdir(out_dir)):
        if not name.endswith(".mp3"):
            continue
        src = os.path.join(out_dir, name)
        dst = src[:-4] + ".opus"
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
            continue
        subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", src,
                        "-c:a", "libopus", "-b:a", "24k", "-ac", "1", dst], check=True)
        n += 1
    print(f"opus siblings: {n} (re)encoded")


if __name__ == "__main__":
    main()
