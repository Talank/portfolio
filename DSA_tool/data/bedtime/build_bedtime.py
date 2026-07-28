#!/usr/bin/env python3
"""Build "निद्राको ग्रैंड लाइन" — one long Nepali bedtime audio that teaches the
whole DSA syllabus through a single continuous One Piece voyage.

Design goals (this is meant to be played while ASLEEP):
  * slow, low, soft delivery — rate/pitch/volume well below the site's decks
  * generous silence between paragraphs, longer silence between chapters, so
    the ear is never dragged along
  * a continuous, very quiet brown-noise surf bed under the whole thing, so
    chapter joins never land as an abrupt cut into digital silence
  * sibilance shelved off, gentle compression — nothing sharp enough to wake

Source of truth is script/*.txt, one file per chapter, sorted by filename:
    # <chapter title in Nepali>      <- first line
    <blank>
    <paragraph>                      <- paragraphs separated by blank lines
    <blank>
    <paragraph>
Each paragraph becomes one edge-tts clip; silence is inserted between them.

Build (from this directory):
    pip install --user edge-tts imageio-ffmpeg
    python3 build_bedtime.py                 # incremental; reuses cached parts
    python3 build_bedtime.py --force         # re-synthesize everything
    python3 build_bedtime.py --only 03,04    # rebuild just those chapters
    python3 build_bedtime.py --stitch-only   # re-mix from cached parts

Outputs (in this directory):
    dsa-nidra-full.opus    the single ~2.5h file to play at bedtime, ~28 MB.
                           An mp3 master is written first and then dropped once
                           the transcode is verified — the site plays only the
                           opus, so shipping both doubled the download for
                           nothing. Pass --keep-mp3 to hold on to the master.
    chapters.txt           human-readable chapter timestamps
    dsa-nidra-full.cue     CUE sheet, for players that show track markers
    manifest.json          chapter/paragraph offsets, for a future player page

DISPLAY vs SPOKEN: as in data/<lang>/audio/generate_audio.py, each paragraph is
passed through to_speakable() before synthesis so bare Latin letters, Big-O
notation and acronyms are pronounced correctly by the Nepali voice.
"""
import argparse
import asyncio
import json
import os
import re
import subprocess
import sys

import soundscape

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT_DIR = os.path.join(HERE, "script")
PARTS_DIR = os.path.join(HERE, "parts")

# Soothing profile. The site's decks run ne-NP-HemkalaNeural at -8%/-2Hz; this
# is deliberately slower, lower and quieter — it is competing with sleep, not
# with a lecture hall.
VOICE = "ne-NP-HemkalaNeural"
RATE = "-22%"
PITCH = "-6Hz"
VOLUME = "-12%"

GAP_PARA = 2.4          # seconds of silence between paragraphs
GAP_CHAPTER = 7.0       # seconds of silence between chapters
LEAD_IN = 3.0           # silence before the first word
TAIL = 25.0             # surf-only runout at the end, fading to nothing

CONCURRENCY = 4
MAX_RETRIES = 4

SR = 24000              # match edge-tts output: 24 kHz mono
BITRATE = "48k"

# Surf-bed level. At 0.16 the bed measures ~-48 dB mean against a ~-25 dB mean
# narration — audible enough in a dark room to keep the gaps from reading as
# dead air, far too quiet to compete with the voice. Turn it down if it
# intrudes; the bed is the one thing playing during the long silences.
AMBIENT_GAIN = 0.16


def ffmpeg_exe():
    import shutil
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg not found. Install it, or: pip install --user imageio-ffmpeg")


FFMPEG = ffmpeg_exe()


def run(args):
    subprocess.run([FFMPEG, "-y", "-loglevel", "error"] + args, check=True)


# ---------------------------------------------------------------------------
# Spoken-text normalization (Nepali half of data/<lang>/audio/generate_audio.py)
# ---------------------------------------------------------------------------

_BIGO = [
    ("O(n log K)", " बिग ओ अफ एन लग के "),
    ("O(n log n)", " बिग ओ अफ एन लग एन "),
    ("O(V + E)", " बिग ओ अफ भी प्लस ई "),
    ("O(log n)", " बिग ओ अफ लग एन "),
    ("O(n²)", " बिग ओ अफ एन स्क्वायर्ड "),
    ("O(n^2)", " बिग ओ अफ एन स्क्वायर्ड "),
    ("O(2ⁿ)", " बिग ओ अफ टु द पावर एन "),
    ("O(n·m)", " बिग ओ अफ एन गुणा एम "),
    ("O(n)", " बिग ओ अफ एन "),
    ("O(1)", " बिग ओ अफ वन "),
    ("O(k)", " बिग ओ अफ के "),
    ("O(m)", " बिग ओ अफ एम "),
    ("3Sum", " थ्री सम "),
    ("n-1", " एन माइनस वन "),
    ("n+1", " एन प्लस वन "),
    ("i+1", " आई प्लस वन "),
    ("n-2", " एन माइनस टु "),
]
_ACRO = {
    "BFS": "बी एफ एस", "DFS": "डी एफ एस", "BST": "बी एस टी", "DP": "डी पी",
    "XOR": "एक्स ओ आर", "AND": "एण्ड", "OR": "ओ आर", "NOT": "नट",
    "LRU": "एल आर यू", "AVL": "ए भी एल", "DAG": "ड्याग", "LIS": "एल आई एस",
    "FIFO": "फिफो", "LIFO": "लाइफो", "API": "ए पी आई",
}
_LETTER_SOUND = {
    "a": "ए", "b": "बी", "c": "सी", "d": "डी", "e": "ई", "f": "एफ", "g": "जी",
    "h": "एच", "i": "आई", "j": "जे", "k": "के", "l": "एल", "m": "एम", "n": "एन",
    "o": "ओ", "p": "पी", "q": "क्यू", "r": "आर", "s": "एस", "t": "टी", "u": "यू",
    "v": "भी", "w": "डब्ल्यू", "x": "एक्स", "y": "वाई", "z": "जेड",
}
_LETTERS = {}
for _c, _snd in _LETTER_SOUND.items():
    _LETTERS[_c] = " " + _snd + " "
    _LETTERS[_c.upper()] = " " + _snd + " "


def _apply_lookaround(text, mapping):
    for key in sorted(mapping, key=len, reverse=True):
        pat = re.compile(r"(?<![A-Za-z])" + re.escape(key) + r"(?![A-Za-z])")
        text = pat.sub(mapping[key], text)
    return text


def to_speakable(text):
    for a, b in _BIGO:
        text = text.replace(a, b)
    text = _apply_lookaround(text, _ACRO)
    text = _apply_lookaround(text, _LETTERS)
    return re.sub(r"\s{2,}", " ", text).strip()


# ---------------------------------------------------------------------------
# Script loading
# ---------------------------------------------------------------------------

def load_chapters(only=None):
    if not os.path.isdir(SCRIPT_DIR):
        sys.exit(f"no script directory at {SCRIPT_DIR}")
    chapters = []
    for name in sorted(os.listdir(SCRIPT_DIR)):
        if not name.endswith(".txt"):
            continue
        num = name.split("-")[0]
        if only and num not in only:
            continue
        path = os.path.join(SCRIPT_DIR, name)
        with open(path, encoding="utf-8") as f:
            raw = f.read().strip()
        lines = raw.split("\n")
        title = lines[0].lstrip("#").strip() if lines[0].startswith("#") else name
        body = "\n".join(lines[1:]) if lines[0].startswith("#") else raw
        paras = [p.strip() for p in re.split(r"\n\s*\n", body) if p.strip()]
        chapters.append({"num": num, "file": name, "path": path,
                         "title": title, "paras": paras})
    if not chapters:
        sys.exit("no chapter .txt files found in script/")
    return chapters


# ---------------------------------------------------------------------------
# Synthesis
# ---------------------------------------------------------------------------

async def synth(sem, out_path, text, label, force):
    """Synthesize one paragraph, unless a fresh cached clip already exists."""
    async with sem:
        if not force and os.path.exists(out_path) and os.path.getsize(out_path) > 0:
            return True
        spoken = to_speakable(text)
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                comm = edge_tts.Communicate(spoken, VOICE, rate=RATE,
                                            pitch=PITCH, volume=VOLUME)
                audio = bytearray()
                async for chunk in comm.stream():
                    if chunk["type"] == "audio":
                        audio.extend(chunk["data"])
                if not audio:
                    raise RuntimeError("no audio bytes")
                with open(out_path, "wb") as f:
                    f.write(audio)
                print(f"  ✓ {label}  ({len(text)} chars, {len(audio)//1024}KB)")
                return True
            except Exception as e:  # noqa: BLE001 — retry anything transient
                if attempt == MAX_RETRIES:
                    print(f"  ✗ {label} FAILED: {e}")
                    return False
                await asyncio.sleep(1.5 * attempt)


async def synth_all(chapters, force):
    os.makedirs(PARTS_DIR, exist_ok=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    tasks, meta = [], []
    for ch in chapters:
        src_mtime = os.path.getmtime(ch["path"])
        for i, para in enumerate(ch["paras"]):
            out = os.path.join(PARTS_DIR, f"ch{ch['num']}-p{i:02d}.mp3")
            stale = (os.path.exists(out)
                     and os.path.getmtime(out) < src_mtime)
            tasks.append(synth(sem, out, para, f"ch{ch['num']}-p{i:02d}",
                               force or stale))
            meta.append((ch, i, out))
    results = await asyncio.gather(*tasks)
    failed = [m[2] for m, ok in zip(meta, results) if not ok]
    if failed:
        sys.exit(f"\n{len(failed)} clip(s) failed; fix the network and re-run.")


# ---------------------------------------------------------------------------
# Duration + stitching
# ---------------------------------------------------------------------------

_DUR_CACHE = {}


def duration(path):
    """Decoded length in seconds, counted from actual samples.

    Both the MP3 'Duration:' header and ffmpeg's throttled progress output are
    approximations. Summing either across the ~700 segments in this build drifted
    the chapter marks ~23s late by the end of the file, which is enough to make
    the CUE/chapters.txt offsets land mid-sentence. Decoding and counting samples
    is exact, and matches what the concat step actually produces.
    """
    key = (path, os.path.getmtime(path))
    if key not in _DUR_CACHE:
        pcm = subprocess.run(
            [FFMPEG, "-v", "error", "-i", path,
             "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
            capture_output=True, check=True).stdout
        _DUR_CACHE[key] = len(pcm) / 2 / SR
    return _DUR_CACHE[key]


def silence(seconds):
    """A cached silent MP3 of the given length, matching the clip format."""
    path = os.path.join(PARTS_DIR, f"_sil-{seconds:g}.mp3")
    if not os.path.exists(path):
        run(["-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono",
             "-t", str(seconds), "-c:a", "libmp3lame", "-b:a", BITRATE, path])
    return path


def stitch(chapters):
    """Concatenate every clip with its silences, tracking chapter start times.

    Offsets accumulate measured decoded lengths — including the silences, whose
    MP3 encoding is not exactly the nominal length either — and the concat is
    decoded to PCM rather than stream-copied, so the written timeline is exactly
    the sum being accumulated here.
    """
    seq, marks = [], []
    t = 0.0

    def add(path):
        nonlocal t
        seq.append(path)
        t += duration(path)

    add(silence(LEAD_IN))
    for ci, ch in enumerate(chapters):
        marks.append({"num": ch["num"], "title": ch["title"], "start": round(t, 2)})
        for i, _ in enumerate(ch["paras"]):
            if i:
                add(silence(GAP_PARA))
            add(os.path.join(PARTS_DIR, f"ch{ch['num']}-p{i:02d}.mp3"))
        if ci != len(chapters) - 1:
            add(silence(GAP_CHAPTER))
    speech_end = t

    listfile = os.path.join(PARTS_DIR, "_concat.txt")
    with open(listfile, "w", encoding="utf-8") as f:
        for p in seq:
            f.write("file '" + p.replace("'", "'\\''") + "'\n")

    narration = os.path.join(PARTS_DIR, "_narration.wav")
    run(["-f", "concat", "-safe", "0", "-i", listfile,
         "-c:a", "pcm_s16le", "-ar", str(SR), "-ac", "1", narration])
    return narration, marks, speech_end


def mix(narration, total, out_mp3, marks):
    """Lay the narration into a soundscape that follows where the story is.

    The first version of this was one brown-noise surf loop under a dry voice,
    which read as a recording rather than a place. soundscape.py builds seven
    synthesized layers instead — waves, foam, wind, leaves, water, gulls and a
    quiet drone — and automates their levels per chapter, so the sea chapters
    sound like sea and the tree chapters sound like forest.

    The voice gets a high-shelf cut (sibilance is what wakes people), gentle
    compression so no phrase jumps in level, and a short reverb so it sits in
    the same space as the ambience instead of floating dry on top of it.
    """
    inputs, chunks, labels = soundscape.build(marks, total, SR, LEAD_IN, TAIL)

    # aecho at these delays is a small room, not an effect: enough for the voice
    # to have somewhere to decay into, short enough that Nepali stays crisp.
    voice = ("highshelf=f=5200:g=-5,"
             "acompressor=threshold=-20dB:ratio=3:attack=25:release=350,"
             "aecho=0.86:0.85:29|47|71:0.11|0.07|0.04,"
             "volume=1.22")

    graph = (f"[0:a]{voice},apad=whole_dur={total:.2f}[v];"
             + ";".join(chunks) + ";"
             + "[v]" + "".join(labels)
             + f"amix=inputs={len(labels) + 1}:duration=first:normalize=0,"
             + "alimiter=limit=0.92[out]")

    run(["-i", narration] + inputs +
        ["-filter_complex", graph,
         "-map", "[out]", "-ac", "1", "-ar", str(SR),
         "-c:a", "libmp3lame", "-b:a", "64k",
         "-metadata", "title=निद्राको ग्रैंड लाइन — DSA Bedtime Voyage",
         "-metadata", "artist=Talank Baral",
         "-metadata", "album=DSA Crash Course",
         out_mp3])


def hms(sec):
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    return f"{h:02d}:{m:02d}:{s:05.2f}"


def write_sidecars(marks, total, out_mp3, keep_mp3=False):
    base = os.path.splitext(os.path.basename(out_mp3))[0]
    # The CUE sheet is for desktop players, so it has to name a file that will
    # still be on disk after main() drops the master.
    audio_file, cue_kind = ((base + ".mp3", "MP3") if keep_mp3
                            else (base + ".opus", "WAVE"))

    with open(os.path.join(HERE, "chapters.txt"), "w", encoding="utf-8") as f:
        f.write("निद्राको ग्रैंड लाइन — अध्याय सूची\n")
        f.write(f"कुल लम्बाइ: {hms(total)}\n\n")
        for m in marks:
            f.write(f"{hms(m['start'])}  {m['num']}  {m['title']}\n")

    with open(os.path.join(HERE, base + ".cue"), "w", encoding="utf-8") as f:
        f.write('TITLE "निद्राको ग्रैंड लाइन"\n')
        f.write('PERFORMER "Talank Baral"\n')
        f.write(f'FILE "{audio_file}" {cue_kind}\n')
        for i, m in enumerate(marks, 1):
            mm, ss = divmod(m["start"], 60)
            frames = int((ss % 1) * 75)
            f.write(f"  TRACK {i:02d} AUDIO\n")
            f.write(f'    TITLE "{m["title"]}"\n')
            f.write(f"    INDEX 01 {int(mm):02d}:{int(ss):02d}:{frames:02d}\n")

    manifest = {"voice": VOICE, "rate": RATE, "pitch": PITCH,
                "volume": VOLUME, "duration": round(total, 2),
                "file": audio_file, "chapters": marks}
    with open(os.path.join(HERE, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)

    # Script-loadable twin, so bedtime.html can read the chapter list over
    # file:// too (fetch() of a local .json is blocked there). Same trick the
    # deck/audio manifests use elsewhere in the site.
    with open(os.path.join(HERE, "manifest.js"), "w", encoding="utf-8") as f:
        f.write("/* Auto-generated by build_bedtime.py. Chapter offsets for\n")
        f.write("   bedtime.html. Do not edit by hand. */\n")
        f.write("window.BEDTIME_MANIFEST = ")
        json.dump(manifest, f, ensure_ascii=False)
        f.write(";\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="re-synthesize every clip")
    ap.add_argument("--only", default="", help="comma-separated chapter numbers")
    ap.add_argument("--stitch-only", action="store_true", help="skip synthesis")
    ap.add_argument("--synth-only", action="store_true",
                    help="fill the clip cache and stop, without stitching")
    ap.add_argument("--no-ambient", action="store_true", help="skip the surf bed")
    ap.add_argument("--keep-mp3", action="store_true",
                    help="keep the mp3 master instead of dropping it once the "
                         "opus is verified (the site only ever plays the opus)")
    args = ap.parse_args()

    only = set(x.strip() for x in args.only.split(",") if x.strip())
    chapters = load_chapters(only or None)
    n_para = sum(len(c["paras"]) for c in chapters)
    n_chars = sum(len(p) for c in chapters for p in c["paras"])
    print(f"{len(chapters)} chapters, {n_para} paragraphs, {n_chars} chars")
    print(f"Voice {VOICE}  rate {RATE}  pitch {PITCH}  volume {VOLUME}\n")

    if not args.stitch_only:
        asyncio.run(synth_all(chapters, args.force))
    if args.synth_only:
        print("\nClips cached; skipping stitch (--synth-only).")
        return

    print("\nStitching…")
    narration, marks, speech_end = stitch(chapters)
    total = speech_end + TAIL

    out_mp3 = os.path.join(HERE, "dsa-nidra-full.mp3")
    if args.no_ambient:
        run(["-i", narration, "-af", f"apad=whole_dur={total:.2f}",
             "-c:a", "libmp3lame", "-b:a", "64k", out_mp3])
    else:
        mix(narration, total, out_mp3, marks)

    out_opus = out_mp3[:-4] + ".opus"
    run(["-i", out_mp3, "-c:a", "libopus", "-b:a", "28k", "-ac", "1", out_opus])

    write_sidecars(marks, total, out_mp3, keep_mp3=args.keep_mp3)

    # The intermediate PCM is ~400 MB; the clip cache in parts/ is what makes
    # re-runs cheap, so only this one gets dropped.
    if os.path.exists(narration):
        os.remove(narration)

    mb = os.path.getsize(out_mp3) / 1e6
    ob = os.path.getsize(out_opus) / 1e6
    print(f"\n✓ {out_opus}  {ob:.1f} MB  {hms(total)}")

    # bedtime.html plays the opus and nothing else, so the mp3 master is a ~63 MB
    # build intermediate that would otherwise ship. Drop it — but only after
    # decoding both and confirming the opus really is the whole voyage. A
    # truncated transcode that silently replaced the master would be unrecoverable
    # without a full rebuild.
    if not args.keep_mp3:
        d_mp3, d_opus = duration(out_mp3), duration(out_opus)
        if abs(d_mp3 - d_opus) <= 0.40:
            os.remove(out_mp3)
            print(f"✓ dropped the {mb:.1f} MB mp3 master "
                  f"(opus verified at {hms(d_opus)})")
        else:
            print(f"! opus is {hms(d_opus)} but the mp3 is {hms(d_mp3)} — "
                  f"keeping both, the transcode looks truncated")
    print(f"✓ chapters.txt / manifest.json / {os.path.basename(out_mp3)[:-4]}.cue")
    for m in marks:
        print(f"   {hms(m['start'])}  {m['title']}")


if __name__ == "__main__":
    main()
