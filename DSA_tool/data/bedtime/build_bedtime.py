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

Paragraphs may be marked `@tier medium` or `@tier long`; everything above such
a line belongs to the shorter story. The three lengths are therefore selections
over one render — see plan_segments().

Build (from this directory):
    pip install --user edge-tts imageio-ffmpeg
    python3 build_bedtime.py                 # incremental; reuses cached parts
    python3 build_bedtime.py --force         # re-synthesize everything
    python3 build_bedtime.py --only 03,04    # rebuild just those chapters
    python3 build_bedtime.py --stitch-only   # re-mix from cached parts

Outputs (in this directory):
    audio/chNN-<tier>.opus  one file per chapter per tier, plus outro.opus.
                            This is what the site plays: bedtime.html fetches
                            the segment it is about to need, so opening the
                            page costs nothing and a short-story listener never
                            downloads the long story's extras.
    chapters.txt            human-readable chapter timestamps, per length
    manifest.json / .js     playlists and chapter offsets for bedtime.html

    --monolith additionally writes dsa-nidra-full.opus and its CUE sheet, one
    continuous file at --tier, for offline players. An mp3 master is written
    first and dropped once the transcode is verified; --keep-mp3 holds onto it.

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
sys.path.insert(0, os.path.join(HERE, *[".."] * 3, "shared"))
import ne_pronounce  # noqa: E402  — needs the path set above

SCRIPT_DIR = os.path.join(HERE, "script")
PARTS_DIR = os.path.join(HERE, "parts")

# Soothing profile. The site's decks run ne-NP-HemkalaNeural at -8%/-2Hz; this
# is deliberately slower, lower and quieter — it is competing with sleep, not
# with a lecture hall.
VOICE = "ne-NP-HemkalaNeural"
RATE = "-22%"
PITCH = "-6Hz"
VOLUME = "-12%"

# Story lengths. Every paragraph belongs to one of these; a tier plays its own
# paragraphs plus every shorter tier's, so the three lengths are selections over
# one render rather than three renders. See split_tiers().
TIERS = ("core", "medium", "long")
TIER_RANK = {t: i for i, t in enumerate(TIERS)}

GAP_PARA = 2.4          # seconds of silence between paragraphs
GAP_CHAPTER = 7.0       # seconds of silence between chapters
# Ambience-only tail on every segment. The player starts the next segment this
# far before the current one ends and equal-power crossfades between them, so
# the joins between chapter files are inaudible instead of being a gap in the
# bed. It always lands inside a chapter or paragraph gap, never over speech.
OVERLAP = 1.5
# Silence between sentences within a paragraph. This has to be inserted as
# audio: measured on ne-NP-HemkalaNeural, once a sentence already ends in "।"
# no punctuation added after it lengthens the gap at all (danda, "।…", "। …",
# "।।" and a newline all produced byte-identical timing), so the only way to
# slow the reading down is to synthesize each sentence and space the clips.
GAP_SENT = 0.75
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

# What the voice goes through before it meets the bed. The high shelf takes the
# sibilance off (an "s" is what wakes people); the compressor keeps any one
# phrase from jumping; aecho at these delays is a small room rather than an
# effect — enough for the voice to have somewhere to decay into, short enough
# that Nepali stays crisp.
VOICE_CHAIN = ("highshelf=f=5200:g=-5,"
               "acompressor=threshold=-20dB:ratio=3:attack=25:release=350,"
               "aecho=0.86:0.85:29|47|71:0.11|0.07|0.04,"
               "volume=1.22")


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
    # Respell whole English words before the single-letter pass: that pass only
    # matches isolated letters, so without this "array" and "heap" reach the
    # Nepali voice as raw Latin and it has to guess at them.
    text = ne_pronounce.to_devanagari(text)
    text = _apply_lookaround(text, _LETTERS)
    # Give enumerations room to land. Six crew members introduced across five
    # commas arrive in about four seconds otherwise.
    text = ne_pronounce.space_out_lists(text)
    return re.sub(r"\s{2,}", " ", text).strip()


# ---------------------------------------------------------------------------
# Script loading
# ---------------------------------------------------------------------------

_SENT_END = re.compile(r"(?<=[।?!…])\s+")
# Below this many characters a fragment reads as clipped when it stands alone,
# so it keeps the sentence before it company instead of becoming its own clip.
MIN_SENT_CHARS = 14


def split_sentences(para):
    """Split a paragraph into the units that get their own clip and pause."""
    parts = [p.strip() for p in _SENT_END.split(para) if p.strip()]
    merged = []
    for p in parts:
        if merged and len(p) < MIN_SENT_CHARS:
            merged[-1] += " " + p
        else:
            merged.append(p)
    return merged or [para.strip()]


def split_tiers(body, where):
    """Split a chapter body into (paragraph, tier) pairs.

    A line reading `@tier medium` sets the tier of everything after it until the
    next such line; `@tier core` switches back. Paragraphs before any directive
    are core, so an untagged script is a valid all-core script and nothing had
    to change when tiers were introduced.

    The returned pairs are stably sorted core -> medium -> long. Grouping the
    extras at the end of the chapter is what lets each tier be a playlist over
    the same segment files rather than its own render: short plays the core
    segment, long plays all three, and every one of them concatenates without a
    join in the middle of a scene.
    """
    paras, tier = [], "core"
    for block in re.split(r"\n\s*\n", body):
        block = block.strip()
        if not block:
            continue
        m = re.fullmatch(r"@tier\s+(\w+)", block)
        if m:
            if m.group(1) not in TIER_RANK:
                sys.exit(f"{where}: unknown tier {m.group(1)!r}; "
                         f"expected one of {', '.join(TIERS)}")
            tier = m.group(1)
            continue
        # A directive may also sit on the first line of a paragraph block.
        first, _, rest = block.partition("\n")
        m = re.fullmatch(r"@tier\s+(\w+)", first.strip())
        if m and rest.strip():
            if m.group(1) not in TIER_RANK:
                sys.exit(f"{where}: unknown tier {m.group(1)!r}")
            tier = m.group(1)
            block = rest.strip()
        paras.append((block, tier))

    ordered = sorted(paras, key=lambda p: TIER_RANK[p[1]])
    if [t for _, t in paras] != [t for _, t in ordered]:
        print(f"  ! {where}: tiers were interleaved, so the extra paragraphs "
              f"have been moved to the end of the chapter. Check that the "
              f"prose still reads in order.")
    return ordered


def load_chapters(only=None, tier="long"):
    """Chapters, keeping paragraphs up to and including `tier`.

    A tier is cumulative: medium plays the core paragraphs and the medium ones,
    long plays all three. Because the extras are grouped at the end of each
    chapter, dropping a tier just truncates each chapter rather than punching
    holes in it.
    """
    if tier not in TIER_RANK:
        sys.exit(f"unknown tier {tier!r}; expected one of {', '.join(TIERS)}")
    keep = TIER_RANK[tier]
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
        pairs = [pt for pt in split_tiers(body, name)
                 if TIER_RANK[pt[1]] <= keep]
        paras = [p for p, _ in pairs]
        chapters.append({"num": num, "file": name, "path": path, "title": title,
                         "paras": paras,
                         "tiers": [t for _, t in pairs],
                         "sents": [split_sentences(p) for p in paras]})
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
        for i, sents in enumerate(ch["sents"]):
            for j, sent in enumerate(sents):
                label = f"ch{ch['num']}-p{i:02d}-s{j:02d}"
                out = os.path.join(PARTS_DIR, label + ".mp3")
                stale = (os.path.exists(out)
                         and os.path.getmtime(out) < src_mtime)
                tasks.append(synth(sem, out, sent, label, force or stale))
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
        for i, sents in enumerate(ch["sents"]):
            if i:
                add(silence(GAP_PARA))
            for j, _ in enumerate(sents):
                if j:
                    add(silence(GAP_SENT))
                add(os.path.join(PARTS_DIR,
                                 f"ch{ch['num']}-p{i:02d}-s{j:02d}.mp3"))
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
    which read as a recording rather than a place. soundscape.py builds five
    layers instead — waves, foam, wind, leaves and water, each a real field
    recording when fetch_ambience.py has been run — and automates their levels
    per chapter, so the sea chapters sound like sea and the tree chapters sound
    like forest. An earlier revision also had gulls and a low drone; both were
    audibly synthetic and were removed.

    The voice gets a high-shelf cut (sibilance is what wakes people), gentle
    compression so no phrase jumps in level, and a short reverb so it sits in
    the same space as the ambience instead of floating dry on top of it.
    """
    inputs, chunks, labels = soundscape.build(marks, total, SR, LEAD_IN, TAIL)
    graph = (f"[0:a]{VOICE_CHAIN},apad=whole_dur={total:.2f}[v];"
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


# ---------------------------------------------------------------------------
# Segmented output: one opus file per (chapter, tier)
# ---------------------------------------------------------------------------
#
# The site does not ship one two-and-a-half-hour file any more. Every chapter
# is cut into up to three files — its core paragraphs, its medium extras, its
# long extras — and each story length is a playlist over those files:
#
#     short   ch00-core, ch01-core, ... ch26-core, outro
#     medium  ch00-core, ch00-medium, ch01-core, ch01-medium, ...
#     long    every segment
#
# Two things fall out of this. The three lengths cost one render between them
# instead of three, because the long story's files *are* the short story's plus
# extras; and opening the page downloads nothing, because the player fetches
# the chapter it is about to play rather than a hundred megabytes of voyage the
# listener will be asleep for.

AUDIO_DIR = os.path.join(HERE, "audio")

TIER_LABELS = {"core": "छोटो", "medium": "मध्यम", "long": "लामो"}
TIER_LABELS_EN = {"core": "Short", "medium": "Medium", "long": "Long"}


def plan_segments(chapters):
    """Every (chapter, tier) file to render, in playback order.

    `chapters` must have been loaded at the long tier: the paragraph indices in
    the clip cache are then the same whichever length is being played, because
    split_tiers() sorts the extras to the end of the chapter, so one cache of
    synthesized clips serves all three.
    """
    segs = []
    prev_scene = None
    for ci, ch in enumerate(chapters):
        scene = soundscape._scene(ch["num"])
        first_of_chapter = True
        for tier in TIERS:
            idx = [i for i, t in enumerate(ch["tiers"]) if t == tier]
            if not idx:
                continue
            if first_of_chapter:
                lead = LEAD_IN if ci == 0 else GAP_CHAPTER
                # only a chapter's opening segment carries the scene change;
                # see soundscape._seg_envelope for why it sits at the head
                before = prev_scene
            else:
                lead, before = GAP_PARA, scene
            segs.append({
                "name": f"ch{ch['num']}-{tier}",
                "num": ch["num"], "title": ch["title"], "tier": tier,
                "scene": scene, "prev_scene": before, "lead": lead,
                "paras": idx, "sents": [ch["sents"][i] for i in idx],
                "first": first_of_chapter,
            })
            first_of_chapter = False
        prev_scene = scene
    return segs


def segment_narration(seg, out_wav):
    """Concatenate one segment's clips and silences into PCM. Returns length."""
    seq, t = [], 0.0

    def add(path):
        nonlocal t
        seq.append(path)
        t += duration(path)

    add(silence(seg["lead"]))
    for k, (pi, sents) in enumerate(zip(seg["paras"], seg["sents"])):
        if k:
            add(silence(GAP_PARA))
        for j in range(len(sents)):
            if j:
                add(silence(GAP_SENT))
            add(os.path.join(PARTS_DIR, f"ch{seg['num']}-p{pi:02d}-s{j:02d}.mp3"))

    listfile = os.path.join(PARTS_DIR, f"_concat-{seg['name']}.txt")
    with open(listfile, "w", encoding="utf-8") as f:
        for p in seq:
            f.write("file '" + p.replace("'", "'\\''") + "'\n")
    run(["-f", "concat", "-safe", "0", "-i", listfile,
         "-c:a", "pcm_s16le", "-ar", str(SR), "-ac", "1", out_wav])
    os.remove(listfile)
    return t


def render_segment(seg, index, ambient=True):
    """Mix and encode one segment. Returns its exact duration in seconds."""
    out = os.path.join(AUDIO_DIR, seg["name"] + ".opus")
    wav = os.path.join(PARTS_DIR, f"_seg-{seg['name']}.wav")
    speech = segment_narration(seg, wav)
    total = speech + OVERLAP

    if not ambient:
        run(["-i", wav, "-af", f"apad=whole_dur={total:.2f}",
             "-c:a", "libopus", "-b:a", "28k", "-ac", "1", out])
    else:
        # 17.3 is just a stride that does not divide any loop length, so
        # consecutive segments enter the loops at unrelated points.
        phase = (index * 17.3) % 60.0
        inputs, chunks, labels = soundscape.build_segment(
            seg["scene"], seg["prev_scene"], total, SR, phase=phase,
            fade_in=LEAD_IN + 5 if seg["prev_scene"] is None else 0.0)
        graph = (f"[0:a]{VOICE_CHAIN},apad=whole_dur={total:.2f}[v];"
                 + ";".join(chunks) + ";"
                 + "[v]" + "".join(labels)
                 + f"amix=inputs={len(labels) + 1}:duration=first:normalize=0,"
                 + "alimiter=limit=0.92[out]")
        run(["-i", wav] + inputs +
            ["-filter_complex", graph, "-map", "[out]",
             "-ac", "1", "-ar", str(SR), "-c:a", "libopus", "-b:a", "28k",
             "-metadata", f"title={seg['num']} {seg['title']}",
             "-metadata", "artist=Talank Baral",
             "-metadata", "album=निद्राको ग्रैंड लाइन", out])
    os.remove(wav)
    return duration(out)


def render_outro(scene, ambient=True):
    """The runout every length ends on: ambience alone, fading to nothing.

    Kept as its own file because where the story stops depends on the length
    being played, and a tail baked into the last chapter's core segment would
    sit in the middle of the medium and long versions.
    """
    out = os.path.join(AUDIO_DIR, "outro.opus")
    if not ambient:
        run(["-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono", "-t", str(TAIL),
             "-c:a", "libopus", "-b:a", "28k", "-ac", "1", out])
        return duration(out)
    inputs, chunks, labels = soundscape.build_segment(
        scene, scene, TAIL, SR, phase=31.0, fade_out=TAIL - 2.0)
    graph = (";".join(chunks) + ";" + "".join(labels)
             + f"amix=inputs={len(labels)}:duration=first:normalize=0[out]")
    run(inputs + ["-filter_complex", graph, "-map", "[out]",
                  "-ac", "1", "-ar", str(SR),
                  "-c:a", "libopus", "-b:a", "28k", out])
    return duration(out)


def build_segments(chapters, only=None, ambient=True):
    """Render the segments and return the manifest.

    `chapters` is always the whole script even under --only, because a
    chapter's ambience depends on the scene of the chapter before it and the
    manifest has to describe the complete voyage either way. --only narrows
    what gets re-rendered, not what gets planned.
    """
    os.makedirs(AUDIO_DIR, exist_ok=True)
    segs = plan_segments(chapters)
    todo = sum(1 for s in segs if not only or s["num"] in only)
    print(f"\nRendering {todo}/{len(segs)} segments into audio/…")
    for i, seg in enumerate(segs):
        path = os.path.join(AUDIO_DIR, seg["name"] + ".opus")
        if only and seg["num"] not in only and os.path.exists(path):
            seg["dur"] = duration(path)
            continue
        seg["dur"] = render_segment(seg, i, ambient=ambient)
        print(f"  {seg['name']:16s} {seg['tier']:6s} {hms(seg['dur'])}  "
              f"{os.path.getsize(path) / 1024:6.0f} KB")
    outro = os.path.join(AUDIO_DIR, "outro.opus")
    if only and os.path.exists(outro):
        outro_dur = duration(outro)
    else:
        outro_dur = render_outro(soundscape._scene(chapters[-1]["num"]),
                                 ambient=ambient)
        print(f"  {'outro':16s} {'all':6s} {hms(outro_dur)}")

    # Only safe on a full build: under --only the segments for the chapters we
    # skipped are still current, and this list is the whole script anyway.
    seen = {s["name"] + ".opus" for s in segs} | {"outro.opus"}
    for stale in sorted(os.listdir(AUDIO_DIR)):
        if stale.endswith(".opus") and stale not in seen:
            os.remove(os.path.join(AUDIO_DIR, stale))
            print(f"  - dropped stale {stale}")

    manifest = {
        "voice": VOICE, "rate": RATE, "pitch": PITCH, "volume": VOLUME,
        "overlap": OVERLAP, "dir": "data/bedtime/audio/",
        "chapters": [{"num": c["num"], "title": c["title"]} for c in chapters],
        "tiers": {},
    }
    for tier in TIERS:
        keep = TIER_RANK[tier]
        playlist, starts, t = [], {}, 0.0
        for seg in segs:
            if TIER_RANK[seg["tier"]] > keep:
                continue
            if seg["first"]:
                starts[seg["num"]] = round(t, 2)
            playlist.append({"f": seg["name"] + ".opus",
                             "d": round(seg["dur"], 2), "c": seg["num"]})
            # each join overlaps, so the timeline is shorter than the sum
            t += seg["dur"] - OVERLAP
        playlist.append({"f": "outro.opus", "d": round(outro_dur, 2), "c": None})
        t += outro_dur
        size = sum(os.path.getsize(os.path.join(AUDIO_DIR, p["f"]))
                   for p in playlist)
        manifest["tiers"][tier] = {
            "label": TIER_LABELS[tier], "label_en": TIER_LABELS_EN[tier],
            "duration": round(t, 2), "bytes": size,
            "starts": starts, "playlist": playlist,
        }
        print(f"  {tier:6s} {hms(t)}  {size / 1e6:5.1f} MB  "
              f"{len(playlist)} files")
    return manifest


def write_segment_sidecars(manifest):
    with open(os.path.join(HERE, "chapters.txt"), "w", encoding="utf-8") as f:
        f.write("निद्राको ग्रैंड लाइन — अध्याय सूची\n\n")
        for tier in TIERS:
            ti = manifest["tiers"][tier]
            f.write(f"— {ti['label']} ({ti['label_en']}): {hms(ti['duration'])}, "
                    f"{ti['bytes'] / 1e6:.1f} MB —\n")
            for ch in manifest["chapters"]:
                if ch["num"] in ti["starts"]:
                    f.write(f"{hms(ti['starts'][ch['num']])}  {ch['num']}  "
                            f"{ch['title']}\n")
            f.write("\n")

    with open(os.path.join(HERE, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    with open(os.path.join(HERE, "manifest.js"), "w", encoding="utf-8") as f:
        f.write("/* Auto-generated by build_bedtime.py. Segment playlists and\n")
        f.write("   chapter offsets for bedtime.html. Do not edit by hand. */\n")
        f.write("window.BEDTIME_MANIFEST = ")
        json.dump(manifest, f, ensure_ascii=False)
        f.write(";\n")


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

    # No manifest here: the site plays the segments, and manifest.json/.js are
    # written by write_segment_sidecars(). This path only produces the offline
    # single file and the CUE sheet that indexes it.


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="re-synthesize every clip")
    ap.add_argument("--only", default="", help="comma-separated chapter numbers")
    ap.add_argument("--stitch-only", action="store_true", help="skip synthesis")
    ap.add_argument("--synth-only", action="store_true",
                    help="fill the clip cache and stop, without stitching")
    ap.add_argument("--no-ambient", action="store_true", help="skip the surf bed")
    ap.add_argument("--monolith", action="store_true",
                    help="also write the old single-file voyage plus its CUE "
                         "sheet, at --tier, for offline players")
    ap.add_argument("--tier", default="core", choices=TIERS,
                    help="which story length --monolith renders: core is the "
                         "short version, medium and long add the extra "
                         "paragraphs marked @tier in the script (cumulative). "
                         "The segmented build always renders all three.")
    ap.add_argument("--keep-mp3", action="store_true",
                    help="keep the mp3 master instead of dropping it once the "
                         "opus is verified (the site only ever plays the opus)")
    args = ap.parse_args()

    only = set(x.strip() for x in args.only.split(",") if x.strip())
    # Always load every tier: the segments are what the site plays, and the
    # clip cache is shared across lengths, so there is nothing to gain by
    # synthesizing less than the whole script.
    everything = load_chapters(None, tier="long")
    chapters = [c for c in everything if not only or c["num"] in only]
    if not chapters:
        sys.exit(f"--only {args.only}: no such chapter")
    n_para = sum(len(c["paras"]) for c in everything)
    n_chars = sum(len(p) for c in everything for p in c["paras"])
    per_tier = {t: sum(c["tiers"].count(t) for c in everything) for t in TIERS}
    print(f"{len(everything)} chapters, {n_para} paragraphs, {n_chars} chars "
          + " ".join(f"({t} {per_tier[t]})" for t in TIERS))
    print(f"Voice {VOICE}  rate {RATE}  pitch {PITCH}  volume {VOLUME}\n")

    if not args.stitch_only:
        asyncio.run(synth_all(chapters, args.force))
    if args.synth_only:
        print("\nClips cached; skipping stitch (--synth-only).")
        return

    manifest = build_segments(everything, only=only,
                              ambient=not args.no_ambient)
    write_segment_sidecars(manifest)
    print("\n✓ audio/ + chapters.txt + manifest.json/.js")
    if not args.monolith:
        return

    chapters = load_chapters(only or None, tier=args.tier)
    print(f"\nAlso building the single-file {args.tier} voyage…")
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
    print(f"✓ {os.path.basename(out_mp3)[:-4]}.cue")


if __name__ == "__main__":
    main()
