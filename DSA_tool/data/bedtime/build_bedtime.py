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
import hashlib
import json
import math
import os
import re
import subprocess
import sys
import zlib

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

# ---------------------------------------------------------------------------
# Listening modes
# ---------------------------------------------------------------------------
#
# The same script, read two different ways.
#
# "bedtime" is the original: every sentence is its own clip with a measured
# silence between, because the point is that the ear is never dragged along.
# That deliberate evenness is also why it does not work awake — a clip boundary
# resets the voice to neutral, so the engine never carries a phrase across two
# sentences and the pauses are all identical to the millisecond.
#
# "drive" fixes exactly that, for listening in a car instead of music. The clip
# is the whole paragraph, so edge-tts produces its own prosody across the whole
# thing: its own comma pauses, its own sentence cadence, its own inter-word
# timing, none of it uniform. On top of that the rate and pitch drift slowly
# from paragraph to paragraph the way a real narrator's does (see drift()), and
# the gaps between paragraphs vary instead of being a constant.
#
# SSML is not an option for finer control: edge-tts escapes the text it is
# given, so <prosody> and <emphasis> arrive at the engine as literal characters.
# Everything here is done with the three per-clip parameters, the clip
# boundaries, and punctuation.
MODES = ("bedtime", "drive")

MODE_PROFILE = {
    "bedtime": {
        "rate": "-22%", "pitch": "-6Hz", "volume": "-12%",
        "unit": "sentence",
        "gap_sent": 0.75, "gap_para": 2.4, "gap_chapter": 7.0,
        "lead_in": 3.0, "tail": 25.0,
        "space_lists": True,     # commas in enumerations become full breaths
        "drift_rate": 0.0, "drift_pitch": 0.0, "gap_jitter": 0.0,
        "bed": 1.00, "swell_db": 6.0,
        "label": "सुत्दै", "label_en": "Bedtime",
    },
    "drive": {
        # Just under conversational. An audiobook read at the engine's default
        # rate is a shade brisk for technical material in a moving car.
        "rate": "-6%", "pitch": "+0Hz", "volume": "+0%",
        "unit": "paragraph",
        "gap_sent": 0.0, "gap_para": 1.15, "gap_chapter": 3.2,
        "lead_in": 1.2, "tail": 6.0,
        "space_lists": False,    # a list read at driving pace wants commas
        "drift_rate": 4.0,       # ±4% around the base rate, slowly
        "drift_pitch": 2.0,      # ±2 Hz
        "gap_jitter": 0.45,      # ±0.45s on every inter-paragraph gap
        "bed": 0.55,             # road noise buries a bed set for a dark room
        "swell_db": 3.0,         # smaller: in a car the swell just adds mush
        "label": "गाडीमा", "label_en": "Driving",
    },
}

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


# The bed breathing. When the narration stops, the scene comes up; when it
# starts again, the scene settles back. That is what makes it read like a novel
# rather than a lecture over a loop — the ship gets louder in the pause after
# the sentence about the ship.
#
# This is done with an envelope rather than a sidechain compressor, because we
# are not guessing where the pauses are: this script *places* every one of them.
# A compressor has to infer the gaps from the signal, and tuning its threshold
# against a bed 40 dB down turned out to give about 2 dB of movement where 6 was
# wanted. Knowing the gap boundaries exactly makes the whole thing arithmetic.
SWELL_DB = 6.0          # how far the bed rises into a full-length pause
SWELL_RAMP = 2.0        # seconds to rise and to fall again
SWELL_MIN_GAP = 1.5     # shorter pauses than this are left alone entirely


def swell_expr(gaps, swell_db=SWELL_DB, ramp=SWELL_RAMP):
    """An ffmpeg volume expression that lifts the bed during `gaps`.

    Each gap contributes a triangle that rises over `ramp` and falls over
    `ramp`, clamped at 1. The clamp is what makes the response depend on how
    long the pause is, which is the behaviour worth having: a 7-second chapter
    gap reaches the full lift, a 2.4-second paragraph gap gets about 60% of it,
    and the 0.75-second gap between two sentences never even qualifies. So the
    bed breathes on the scale of scenes and paragraphs, and the reading itself
    is not chopped into swells.
    """
    lift = 10 ** (swell_db / 20.0) - 1.0
    terms = []
    for a, b in gaps:
        if b - a < SWELL_MIN_GAP:
            continue
        terms.append(f"min(1,max(0,min((t-{a:.2f})/{ramp:.2f},"
                     f"({b:.2f}-t)/{ramp:.2f})))")
    if not terms:
        return None
    return f"1+{lift:.4f}*min(1,{'+'.join(terms)})"


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


def drift(i, amp, seed=0.0):
    """A slow, non-repeating wander in [-amp, +amp], indexed by paragraph.

    Two sines at incommensurable rates, so the value moves smoothly from one
    paragraph to the next and the sequence never actually repeats. That is the
    difference between variation and randomness: a narrator's pace wanders, it
    does not jump, and a per-paragraph random draw would sound like someone
    being handed a new script every minute.
    """
    if amp <= 0:
        return 0.0
    return amp * 0.5 * (math.sin(i * 0.7913 + seed)
                        + math.sin(i * 0.2371 + seed * 1.7))


def jitter(key, amp):
    """A fixed offset in [-amp, +amp] derived from `key`.

    Used for pause lengths, where smoothness is not wanted — the point is that
    no two gaps are the same. CRC of the text rather than hash(), which Python
    salts per process and would reshuffle every pause on every run.
    """
    if amp <= 0:
        return 0.0
    return (zlib.crc32(key.encode("utf-8")) / 2 ** 32 * 2 - 1) * amp


def to_speakable(text, space_lists=True):
    for a, b in _BIGO:
        text = text.replace(a, b)
    text = _apply_lookaround(text, _ACRO)
    # Respell whole English words before the single-letter pass: that pass only
    # matches isolated letters, so without this "array" and "heap" reach the
    # Nepali voice as raw Latin and it has to guess at them.
    text = ne_pronounce.to_devanagari(text)
    text = _apply_lookaround(text, _LETTERS)
    # Give enumerations room to land. Six crew members introduced across five
    # commas arrive in about four seconds otherwise. Only for the bedtime read:
    # at driving pace a list wants to sound like a list, not like six separate
    # thoughts, and the engine's own comma is already long enough to separate
    # two words there.
    if space_lists:
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

def clip_path(mode, num, pi, si=None):
    """Where one clip lives. The two modes cut the script differently, so they
    cannot share a cache — but they can share a directory, and keeping the
    bedtime names exactly as they were means adding driving mode did not
    invalidate a single one of the clips already synthesized for it."""
    if mode == "bedtime":
        return os.path.join(PARTS_DIR, f"ch{num}-p{pi:02d}-s{si:02d}.mp3")
    return os.path.join(PARTS_DIR, f"{mode}-ch{num}-p{pi:02d}.mp3")


def _pct(base, delta):
    """edge-tts wants a signed percentage string, e.g. "-18%"."""
    return f"{int(round(float(base.rstrip('%')) + delta)):+d}%"


def _hz(base, delta):
    return f"{int(round(float(base.rstrip('Hz')) + delta)):+d}Hz"


# Clip cache index: clip filename -> hash of exactly what was sent to the
# engine. Staleness used to be "is the clip older than the script file?", which
# meant editing one paragraph re-synthesized every clip in the chapter. Keying on
# the spoken text means an edit costs only the clips whose words actually
# changed — and it also catches changes that do not touch the script at all,
# like a new entry in the pronunciation table or a different voice profile.
INDEX_PATH = os.path.join(PARTS_DIR, "_index.json")
_index = {}


def load_index():
    global _index
    try:
        with open(INDEX_PATH, encoding="utf-8") as f:
            _index = json.load(f)
    except (OSError, ValueError):
        _index = {}


def save_index():
    os.makedirs(PARTS_DIR, exist_ok=True)
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(_index, f, indent=0, sort_keys=True)


def clip_key(spoken, rate, pitch, volume):
    return hashlib.sha1(
        "\x1f".join([VOICE, rate, pitch, volume, spoken]).encode("utf-8")
    ).hexdigest()[:16]


async def synth(sem, out_path, text, label, force, mode="bedtime", index=0):
    """Synthesize one clip, unless a fresh cached one already exists.

    `index` is the clip's position in the whole voyage, and is what makes the
    driving read stop sounding metronomic: rate and pitch are nudged by drift()
    per clip, so the narration slowly speeds up and slows down across the hours
    the way a person does. In bedtime mode both drift amplitudes are zero and
    the parameters come out exactly as before.
    """
    prof = MODE_PROFILE[mode]
    name = os.path.basename(out_path)
    spoken = to_speakable(text, space_lists=prof["space_lists"])
    rate = _pct(prof["rate"], drift(index, prof["drift_rate"]))
    pitch = _hz(prof["pitch"], drift(index, prof["drift_pitch"], seed=1.4))
    key = clip_key(spoken, rate, pitch, prof["volume"])
    async with sem:
        if (not force and _index.get(name) == key
                and os.path.exists(out_path) and os.path.getsize(out_path) > 0):
            return True
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                comm = edge_tts.Communicate(spoken, VOICE, rate=rate,
                                            pitch=pitch, volume=prof["volume"])
                audio = bytearray()
                async for chunk in comm.stream():
                    if chunk["type"] == "audio":
                        audio.extend(chunk["data"])
                if not audio:
                    raise RuntimeError("no audio bytes")
                with open(out_path, "wb") as f:
                    f.write(audio)
                _index[name] = key
                print(f"  ✓ {label}  ({len(text)} chars, {len(audio)//1024}KB)")
                return True
            except Exception as e:  # noqa: BLE001 — retry anything transient
                if attempt == MAX_RETRIES:
                    print(f"  ✗ {label} FAILED: {e}")
                    return False
                await asyncio.sleep(1.5 * attempt)


async def synth_all(chapters, force, mode="bedtime"):
    os.makedirs(PARTS_DIR, exist_ok=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    by_para = MODE_PROFILE[mode]["unit"] == "paragraph"
    load_index()
    tasks, meta = [], []
    for ci, ch in enumerate(chapters):
        for i, sents in enumerate(ch["sents"]):
            # One clip for the whole paragraph, or one per sentence. This single
            # choice is most of what separates the two reads: inside one clip
            # the engine carries prosody across sentence boundaries and puts its
            # own uneven pauses at the commas, which is exactly what the
            # sentence-per-clip bedtime read gives up on purpose.
            units = [" ".join(sents)] if by_para else sents
            for j, unit in enumerate(units):
                out = clip_path(mode, ch["num"], i, None if by_para else j)
                label = os.path.basename(out)[:-4]
                # Drift index is (chapter, paragraph), not a running count.
                # A running count would shift for every clip after any inserted
                # paragraph, changing its rate and pitch and so invalidating the
                # whole rest of the voyage in the cache. Keyed this way, adding
                # a paragraph to the end of a chapter costs exactly that
                # paragraph. 97 is just a stride bigger than any chapter, so the
                # drift still wanders across chapter boundaries instead of
                # restarting at each one.
                tasks.append(synth(sem, out, unit, label, force,
                                   mode=mode, index=ci * 97 + i))
                meta.append((ch, i, out))
    results = await asyncio.gather(*tasks)
    save_index()
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
    """A cached silent MP3 of the given length, matching the clip format.

    Quantized to 50 ms so that jittered pause lengths still land on a handful of
    cached files instead of one per gap. 50 ms is well under what anyone can
    hear as a difference in a pause this long.
    """
    seconds = max(0.05, round(seconds / 0.05) * 0.05)
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


def plan_segments(chapters, mode="bedtime"):
    """Every (chapter, tier) file to render, in playback order.

    `chapters` must have been loaded at the long tier: the paragraph indices in
    the clip cache are then the same whichever length is being played, because
    split_tiers() sorts the extras to the end of the chapter, so one cache of
    synthesized clips serves all three.
    """
    prof = MODE_PROFILE[mode]
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
                lead = prof["lead_in"] if ci == 0 else prof["gap_chapter"]
                # only a chapter's opening segment carries the scene change;
                # see soundscape._seg_envelope for why it sits at the head
                before = prev_scene
            else:
                lead, before = prof["gap_para"], scene
            segs.append({
                "name": f"ch{ch['num']}-{tier}",
                "num": ch["num"], "title": ch["title"], "tier": tier,
                "scene": scene, "prev_scene": before, "lead": lead,
                "paras": idx, "sents": [ch["sents"][i] for i in idx],
                "first": first_of_chapter, "mode": mode,
            })
            first_of_chapter = False
        prev_scene = scene
    return segs


def segment_narration(seg, out_wav):
    """Concatenate one segment's clips and silences into PCM.

    Returns (length, gaps), where gaps are the (start, end) windows in which
    nothing is being said. The mix uses them to swell the ambience — see
    swell_expr() — which is only possible because they are known exactly here
    rather than detected later from the audio.
    """
    mode = seg.get("mode", "bedtime")
    prof = MODE_PROFILE[mode]
    by_para = prof["unit"] == "paragraph"
    seq, t, gaps = [], 0.0, []

    def add(path, is_gap=False):
        nonlocal t
        seq.append(path)
        d = duration(path)
        if is_gap:
            gaps.append((t, t + d))
        t += d

    add(silence(seg["lead"]), is_gap=True)
    for k, (pi, sents) in enumerate(zip(seg["paras"], seg["sents"])):
        if k:
            # Every gap a slightly different length. A constant is what makes a
            # long reading feel mechanical, and the ear notices the regularity
            # long before it notices the duration.
            add(silence(prof["gap_para"]
                        + jitter(f"{mode}{seg['num']}p{pi}", prof["gap_jitter"])),
                is_gap=True)
        if by_para:
            add(clip_path(mode, seg["num"], pi))
            continue
        for j in range(len(sents)):
            if j:
                add(silence(prof["gap_sent"]), is_gap=True)
            add(clip_path(mode, seg["num"], pi, j))

    listfile = os.path.join(PARTS_DIR, f"_concat-{mode}-{seg['name']}.txt")
    with open(listfile, "w", encoding="utf-8") as f:
        for p in seq:
            f.write("file '" + p.replace("'", "'\\''") + "'\n")
    run(["-f", "concat", "-safe", "0", "-i", listfile,
         "-c:a", "pcm_s16le", "-ar", str(SR), "-ac", "1", out_wav])
    os.remove(listfile)
    # The runout past the last word is a pause too, and the longest one there
    # is: the bed should be rising as the segment hands over to the next.
    gaps.append((t, t + OVERLAP))
    return t, gaps


def mode_dir(mode):
    return os.path.join(AUDIO_DIR, mode)


def render_segment(seg, index, ambient=True):
    """Mix and encode one segment. Returns its exact duration in seconds."""
    mode = seg.get("mode", "bedtime")
    prof = MODE_PROFILE[mode]
    out = os.path.join(mode_dir(mode), seg["name"] + ".opus")
    wav = os.path.join(PARTS_DIR, f"_seg-{mode}-{seg['name']}.wav")
    speech, gaps = segment_narration(seg, wav)
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
            fade_in=prof["lead_in"] + 5 if seg["prev_scene"] is None else 0.0,
            bed=prof["bed"])
        # Sum the layers first, then breathe the whole scene at once: one
        # envelope for the bed rather than one per layer, and the per-scene
        # balance inside it is left exactly as tuned.
        swell = swell_expr(gaps, MODE_PROFILE[mode]["swell_db"])
        bed = (f"amix=inputs={len(labels)}:duration=first:normalize=0"
               + (f",volume=volume='{soundscape._esc(swell)}':eval=frame"
                  if swell else ""))
        graph = (f"[0:a]{VOICE_CHAIN},apad=whole_dur={total:.2f}[v];"
                 + ";".join(chunks) + ";"
                 + "".join(labels) + bed + "[bed];"
                 + "[v][bed]amix=inputs=2:duration=first:normalize=0,"
                 + "alimiter=limit=0.92[out]")
        run(["-i", wav] + inputs +
            ["-filter_complex", graph, "-map", "[out]",
             "-ac", "1", "-ar", str(SR), "-c:a", "libopus", "-b:a", "28k",
             "-metadata", f"title={seg['num']} {seg['title']}",
             "-metadata", "artist=Talank Baral",
             "-metadata", "album=निद्राको ग्रैंड लाइन", out])
    os.remove(wav)
    return duration(out)


def render_outro(scene, mode="bedtime", ambient=True):
    """The runout every length ends on: ambience alone, fading to nothing.

    Kept as its own file because where the story stops depends on the length
    being played, and a tail baked into the last chapter's core segment would
    sit in the middle of the medium and long versions.

    Nothing is speaking here, so this is the bed at its full undicked level —
    the swell the pauses have been hinting at, held and then let go.
    """
    prof = MODE_PROFILE[mode]
    tail = prof["tail"]
    out = os.path.join(mode_dir(mode), "outro.opus")
    if not ambient:
        run(["-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono", "-t", str(tail),
             "-c:a", "libopus", "-b:a", "28k", "-ac", "1", out])
        return duration(out)
    inputs, chunks, labels = soundscape.build_segment(
        scene, scene, tail, SR, phase=31.0, fade_out=tail - 2.0,
        bed=prof["bed"] * 10 ** (prof["swell_db"] / 20.0))
    graph = (";".join(chunks) + ";" + "".join(labels)
             + f"amix=inputs={len(labels)}:duration=first:normalize=0[out]")
    run(inputs + ["-filter_complex", graph, "-map", "[out]",
                  "-ac", "1", "-ar", str(SR),
                  "-c:a", "libopus", "-b:a", "28k", out])
    return duration(out)


def build_segments(chapters, only=None, ambient=True, modes=MODES):
    """Render every segment of every mode and return one manifest for all of it.

    `chapters` is always the whole script even under --only, because a chapter's
    ambience depends on the scene of the chapter before it and the manifest has
    to describe the complete voyage either way. --only narrows what gets
    re-rendered, not what gets planned.
    """
    manifest = {
        "overlap": OVERLAP, "dir": "data/bedtime/audio/", "voice": VOICE,
        "chapters": [{"num": c["num"], "title": c["title"]} for c in chapters],
        "defaultMode": "bedtime",
        "modes": {},
    }
    for mode in modes:
        prof = MODE_PROFILE[mode]
        os.makedirs(mode_dir(mode), exist_ok=True)
        segs = plan_segments(chapters, mode=mode)
        todo = sum(1 for x in segs if not only or x["num"] in only)
        print(f"\n[{mode}] rendering {todo}/{len(segs)} segments "
              f"into audio/{mode}/…")
        for i, seg in enumerate(segs):
            path = os.path.join(mode_dir(mode), seg["name"] + ".opus")
            if only and seg["num"] not in only and os.path.exists(path):
                seg["dur"] = duration(path)
                continue
            seg["dur"] = render_segment(seg, i, ambient=ambient)
            print(f"  {seg['name']:16s} {seg['tier']:6s} {hms(seg['dur'])}  "
                  f"{os.path.getsize(path) / 1024:6.0f} KB")

        outro = os.path.join(mode_dir(mode), "outro.opus")
        if only and os.path.exists(outro):
            outro_dur = duration(outro)
        else:
            outro_dur = render_outro(soundscape._scene(chapters[-1]["num"]),
                                     mode=mode, ambient=ambient)
            print(f"  {'outro':16s} {'all':6s} {hms(outro_dur)}")

        # Only safe on a full build: under --only the segments for the chapters
        # we skipped are still current, and this list is the whole script anyway.
        seen = {x["name"] + ".opus" for x in segs} | {"outro.opus"}
        for stale in sorted(os.listdir(mode_dir(mode))):
            if stale.endswith(".opus") and stale not in seen:
                os.remove(os.path.join(mode_dir(mode), stale))
                print(f"  - dropped stale {stale}")

        entry = {
            "label": prof["label"], "label_en": prof["label_en"],
            "dir": mode + "/", "rate": prof["rate"], "pitch": prof["pitch"],
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
            playlist.append({"f": "outro.opus", "d": round(outro_dur, 2),
                             "c": None})
            t += outro_dur
            size = sum(os.path.getsize(os.path.join(mode_dir(mode), x["f"]))
                       for x in playlist)
            entry["tiers"][tier] = {
                "label": TIER_LABELS[tier], "label_en": TIER_LABELS_EN[tier],
                "duration": round(t, 2), "bytes": size,
                "starts": starts, "playlist": playlist,
            }
            print(f"  {tier:6s} {hms(t)}  {size / 1e6:5.1f} MB  "
                  f"{len(playlist)} files")
        manifest["modes"][mode] = entry
    return manifest


def write_segment_sidecars(manifest):
    with open(os.path.join(HERE, "chapters.txt"), "w", encoding="utf-8") as f:
        f.write("निद्राको ग्रैंड लाइन — अध्याय सूची\n\n")
        for mode, mi in manifest["modes"].items():
            f.write(f"=== {mi['label']} / {mi['label_en']} ===\n\n")
            for tier in TIERS:
                ti = mi["tiers"][tier]
                f.write(f"— {ti['label']} ({ti['label_en']}): "
                        f"{hms(ti['duration'])}, {ti['bytes'] / 1e6:.1f} MB —\n")
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
    ap.add_argument("--modes", default=",".join(MODES),
                    help="comma-separated listening modes to build: "
                         + ", ".join(MODES))
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

    modes = [m.strip() for m in args.modes.split(",") if m.strip()]
    bad = [m for m in modes if m not in MODE_PROFILE]
    if bad:
        sys.exit(f"unknown mode(s) {', '.join(bad)}; expected {', '.join(MODES)}")

    if not args.stitch_only:
        for mode in modes:
            prof = MODE_PROFILE[mode]
            print(f"[{mode}] {prof['label_en']}: rate {prof['rate']} "
                  f"pitch {prof['pitch']}, one clip per {prof['unit']}")
            asyncio.run(synth_all(chapters, args.force, mode=mode))
    if args.synth_only:
        print("\nClips cached; skipping stitch (--synth-only).")
        return

    manifest = build_segments(everything, only=only,
                              ambient=not args.no_ambient, modes=modes)
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
