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

A chapter's method is written once inside `@algo NAME … @end` and replayed by
`@recall NAME`, verbatim, two more times — see expand_recalls(). Something heard
once at 2 a.m. is something you heard; the same words three times, spaced across
a chapter, is something you can recite. Run check_bedtime.py before building:
it enforces both that (three recitals in the core tier) and that every sentence
ends in a real predicate, which is what a bedtime read actually needs.

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
import bedcodec  # noqa: E402

SCRIPT_DIR = os.path.join(HERE, "script")
PARTS_DIR = os.path.join(HERE, "parts")

# What this voyage is called, wherever a name is written into a file rather
# than spoken: audio tags, the CUE sheet, the head of chapters.txt. They are
# module-level rather than inline because another course's bedtime build
# imports this file as its engine and rebinds them — see
# full_stack_java/data/bedtime/build_bedtime.py.
TITLE = "निद्राको ग्रैंड लाइन"
SUBTITLE = "DSA Bedtime Voyage"
MONOLITH_NAME = "dsa-nidra-full"
# Heading of chapters.txt. Separate from TITLE because an all-English voyage
# rebinds this one and keeps its own title: ACLS_tool had a story with no Nepali
# word left in it and a chapter list headed "अध्याय सूची".
CHAPTERS_HEADING = "अध्याय सूची"

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
        # A performance mark can hand the sentence over to a character
        # mid-clause ("…र भन्यो — [franky]"यो array जस्तो होइन।"). That is a
        # hand-off, not a stop: the narrator has to still be mid-breath, so the
        # boundary gets a fifth of a normal sentence pause.
        "gap_hand": 0.18,
        "lead_in": 3.0, "tail": 25.0,
        "space_lists": True,     # commas in enumerations become full breaths
        # Both were 0.0, which made the bedtime read exact and therefore a
        # recital. Gentler than the driving read's ±4%/±2Hz because this one is
        # heard lying still in the dark, where a change you can *notice* is a
        # change that wakes you: ±2.5% of rate is about a fifth of a second on
        # a ten-second sentence, and ±1.8Hz is a mood, not a different person.
        # The method blocks opt out of it entirely — see STYLES["steady"].
        "drift_rate": 2.5, "drift_pitch": 1.8,
        # A fraction of each pause rather than a number of seconds — see
        # gap_for(). Was 0.0, which is why the reading was even to the
        # millisecond; this costs nothing, because the gaps are cached silence
        # rather than synthesis.
        "gap_jitter": 0.18,
        "bed": 1.00, "swell_db": 6.0,
        "label": "सुत्दै", "label_en": "Bedtime",
    },
    "drive": {
        # Just under conversational. An audiobook read at the engine's default
        # rate is a shade brisk for technical material in a moving car.
        "rate": "-6%", "pitch": "+0Hz", "volume": "+0%",
        "unit": "paragraph",
        # gap_sent is what falls between two *spans* here, not two sentences:
        # the clip is still the whole paragraph unless a performance mark cuts
        # it, and a cut at a sentence end wants a real beat where a cut
        # mid-sentence (gap_hand) must be almost nothing.
        "gap_sent": 0.35, "gap_hand": 0.12,
        "gap_para": 1.15, "gap_chapter": 3.2,
        "lead_in": 1.2, "tail": 6.0,
        "space_lists": False,    # a list read at driving pace wants commas
        "drift_rate": 4.0,       # ±4% around the base rate, slowly
        "drift_pitch": 2.0,      # ±2 Hz
        "gap_jitter": 0.32,      # ±32% on every pause; see gap_for()
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

# Percentage points taken off the mode's rate for a paragraph marked `@slow`.
#
# The scripts name a structure in English at the moment they introduce it, and
# that is the one moment the listener has to actually catch the word. Measured on
# ne-NP-HemkalaNeural, an English term inside Nepali prose is not spoken fast —
# "एरे" takes 0.34s against 0.30-0.53s for the Nepali words around it — so the
# problem is not speed but that the word arrives with no air around it and is
# gone. SSML is not available (see to_speakable), and punctuation buys only
# ~0.13s per comma, so the lever that is left is the per-clip rate: read the
# teaching paragraph slower and the term lands.
SLOW_DELTA = -8.0


# ---------------------------------------------------------------------------
# Performance marks: reading it like a novel instead of reciting it
# ---------------------------------------------------------------------------
#
# An even voice at an even pace with an even pause after every sentence is a
# machine reading a document. A person reading a story to someone drops their
# voice for the quiet part, leans on the surprise, hands the sentence over to
# the character who is speaking, and — most of all — pauses for different
# lengths depending on what just happened. None of that was in this build.
#
# The script can now say so, in two kinds of mark:
#
#   [franky]"यो array जस्तो होइन।"[/]   a span read in some other register;
#                                       `[/]` hands it back to the narrator
#   भन्यो[..]अनि ऊ हाँस्यो।             a beat inside a sentence
#
# A paragraph with no marks in it produces exactly the clips it produced
# before, byte for byte, so adding this cost nothing already synthesized.
#
# HOW EACH ONE IS ACTUALLY MADE. edge-tts escapes the text it is handed, so
# <prosody> and <emphasis> arrive at the engine as literal angle brackets;
# there are three parameters and that is all. Measured on ne-NP-HemkalaNeural
# at the bedtime profile:
#
#   rate    the strong lever. -34% runs 118% as long as -22%, -12% runs 89%.
#   pitch   changes colour without changing length: ±20Hz is a different
#           person, ±6Hz is the same person in a different mood.
#   volume  nearly useless *on its own*. -45% against -12% measures -4.0 dB
#           raw, but only -1.8 dB after VOICE_CHAIN, because the compressor
#           that keeps any one phrase from jumping in level while you are
#           asleep is equally happy to flatten a whisper you meant. So level
#           is not done here at all: `gain` below is applied to the mixed
#           narration *after* the compressor, by voice_chain(). The compressor
#           still evens out what it should — within a clip — and deliberate
#           dynamics survive it.
#
# `rate` is in percentage points off the mode's rate, `pitch` in Hz off the
# mode's pitch, `gain` in dB of post-compressor level. `voice` swaps the engine
# voice outright and is deliberately left unset: a narrator reading a novel does
# the crew in their own voice, and cutting to a second speaker mid-paragraph
# sounds like a radio play, not a bedtime story.
STYLES = {
    "narrator": {},
    # The method blocks. No offsets and, crucially, no drift: `steady` is the
    # one register that is guaranteed to come out identical every time it is
    # spoken, which is the whole point of saying a method three times. See
    # expand_recalls().
    "steady":  {"steady": True},
    # Delivery, not character. These are the ones that make a paragraph sound
    # read rather than recited.
    #
    # `teach` is the register of the paragraph that first names a structure. It
    # used to be SLOW_DELTA — eight points off the rate — and it dragged: the
    # listener's report was that the narrator "becomes slow", which is exactly
    # what eleven per cent of extra length sounds like over a whole paragraph.
    # The original measurement had already said why that was the wrong lever:
    # the English term is not spoken fast, it just arrives with no air around
    # it. Air is now available as a beat (see BEATS), so this holds still and
    # sits a shade lower instead, and the term gets the pause it needed.
    "teach":   {"rate": -2.0, "pitch": -1.0, "gain": +0.5, "steady": True},
    "hush":    {"rate": -6.0, "pitch": -4.0, "gain": -3.5},
    "whisper": {"rate": -10.0, "pitch": -8.0, "gain": -7.0},
    "aside":   {"rate": -2.0, "pitch": -5.0, "gain": -4.0},   # confiding
    "warm":    {"rate": -4.0, "pitch": -2.0, "gain": -1.0},
    "lift":    {"rate": +5.0, "pitch": +3.0, "gain": +2.0},   # the reveal
    "wonder":  {"rate": -5.0, "pitch": +5.0, "gain": +0.5},
    # The crew. Kept inside ±16Hz on purpose: this is a story read at bedtime,
    # so a character is a shading of the narrator's voice, not an impression.
    # Chopper at +20Hz was tried and is funny, which is the wrong thing to be
    # at two in the morning.
    "luffy":   {"rate": +6.0, "pitch": +11.0, "gain": +1.5},
    "zoro":    {"rate": -4.0, "pitch": -13.0, "gain": +0.0},
    "nami":    {"rate": +4.0, "pitch": +6.0, "gain": +0.5},
    "usopp":   {"rate": +7.0, "pitch": +13.0, "gain": +1.0},
    "sanji":   {"rate": +1.0, "pitch": +2.0, "gain": +0.5},
    "chopper": {"rate": +8.0, "pitch": +16.0, "gain": -0.5},
    "robin":   {"rate": -6.0, "pitch": -5.0, "gain": -1.5},
    "franky":  {"rate": +3.0, "pitch": -11.0, "gain": +2.0},
    "brook":   {"rate": -5.0, "pitch": +14.0, "gain": -1.0},
}

# `slow` was the original spelling of the teaching register, and 68 paragraphs
# across the two voyages are marked with it. Kept as an alias so those scripts
# keep working rather than being rewritten for a rename.
STYLES["slow"] = STYLES["teach"]


# What the same person sounds like in a different mood, added on top of
# whichever register they are being read in: `[luffy:excited]`, `[robin:sad]`.
#
# Composed rather than enumerated. A character is a voice and a mood is
# something that happens to a voice, so nine crew members and eleven moods are
# twenty rows here instead of ninety-nine rows of luffy_excited, luffy_sad,
# luffy_angry. It also means a mood can be applied to the narrator, which is
# what the questions in these scripts want — the reader asks them, not a
# character.
#
# The numbers are small on purpose. This is still a bedtime story: `angry` is
# somebody speaking firmly with the pitch pressed down, not shouting, and
# `excited` is Luffy being Luffy at two in the morning rather than at noon.
EMOTIONS = {
    # inferred from the sentence itself — see shade()
    "asking":  {"rate": +1.0, "pitch": +3.5},
    "bright":  {"rate": +4.0, "pitch": +4.0, "gain": +1.5},
    # written by hand, where the story has a beat
    "excited": {"rate": +7.0, "pitch": +7.0, "gain": +2.5},
    "angry":   {"rate": +5.0, "pitch": -3.0, "gain": +3.0},
    "sad":     {"rate": -6.0, "pitch": -5.0, "gain": -2.5},
    "afraid":  {"rate": +8.0, "pitch": +7.0, "gain": -1.0},
    "gentle":  {"rate": -3.0, "pitch": -1.0, "gain": -2.0},
    "firm":    {"rate": -2.0, "pitch": -4.0, "gain": +1.5},
    "amused":  {"rate": +3.0, "pitch": +5.0, "gain": +0.5},
    "tired":   {"rate": -7.0, "pitch": -4.0, "gain": -2.0},
    "awed":    {"rate": -4.0, "pitch": +4.0, "gain": -0.5},
}

_FIELDS = ("rate", "pitch", "gain")
_RESOLVED = {}


def resolve(spec):
    """The parameters for a style spec, which may be `name` or `name:emotion`.

    Deltas add: Luffy is already +6 rate and +11 pitch, and excited puts him at
    +13 and +18. That compounding is deliberate — an excited Luffy should be
    further from the narrator than an excited Robin, because he starts further
    away.
    """
    if spec in _RESOLVED:
        return _RESOLVED[spec]
    base, _, mood = spec.partition(":")
    out = dict(STYLES[base])
    if mood:
        for k, v in EMOTIONS[mood].items():
            out[k] = out.get(k, 0.0) + v
    # A mood is a departure, so it overrides the register's stillness: a
    # `steady` block read in some mood is no longer the same recording twice,
    # and should not pretend to be.
    if mood:
        out.pop("steady", None)
    _RESOLVED[spec] = out
    return out


def valid_style(spec):
    base, _, mood = spec.partition(":")
    return base in STYLES and (not mood or mood in EMOTIONS)


# Moods the sentence itself asks for, when the script has not asked for one.
#
# Only what the punctuation actually states. The scripts attribute their
# dialogue plainly — 71 भनी, 43 भन्यो, 22 सोध्यो, and almost no emotional
# adverbs — so anything richer than this would be a mood invented for a line
# that never claimed to have one. A question rises, an exclamation brightens,
# everything else is read as written.
def shade(text, spec):
    if ":" in spec:
        return spec                      # the script was explicit; leave it
    end = text.rstrip().rstrip(_CLOSERS)[-1:]
    if end == "?":
        return spec + ":asking"
    if end == "!":
        return spec + ":bright"
    return spec

# A mid-sentence beat, spelled as the punctuation that actually produces it.
# Measured at the bedtime profile: a comma inside a sentence is worth +0.14s, an
# em-dash +0.26s, an ellipsis +1.08s — and doubling any of them buys nothing at
# all ("उठायो, , , र" times identically to "उठायो, र"), which is why these are
# three named lengths rather than a number the script gets to pick.
#
# They are written as marks rather than as the punctuation itself for two
# reasons: `…` in the source would split the sentence in split_sentences() and
# turn one flowing clip into two with silence between, and a beat is a
# performance instruction that should be visible as one when the prose is read
# on screen.
BEATS = {"[...]": "…", "[..]": " — ", "[.]": ", "}
# What a beat looks like to the linter. `…` would read as a sentence end there
# too, so the long beat is lowered to a dash: is_finite() splits its chunks on
# both `,` and `—`, so either mark tells it the same true thing about where the
# clause boundaries are.
BEATS_FLAT = {"[...]": " — ", "[..]": " — ", "[.]": ", "}

_STYLE_MARK = re.compile(r"\[(/|[a-z][a-z0-9_]*(?::[a-z]+)?)\]")

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
#
# Split in two so the reading's own dynamics can be inserted between them: the
# compressor has to come first (it is doing its job on what the engine
# produced) and the level the story wants has to come after it (or the
# compressor simply takes it back out again). See voice_chain().
VOICE_PRE = ("highshelf=f=5200:g=-5,"
             "acompressor=threshold=-20dB:ratio=3:attack=25:release=350")
VOICE_POST = ("aecho=0.86:0.85:29|47|71:0.11|0.07|0.04,"
              "volume=1.22")
VOICE_CHAIN = VOICE_PRE + "," + VOICE_POST


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
# What one voice costs once the bed is not baked in behind it. 28k was sized
# for speech *plus* continuous broadband ambience; a single speaker over silence
# needs far less. Measured on ch05-core against the 28k mixed file: 16k is 49%
# of it (bedtime) and 52% (drive), 12k is 35%/38%. 16k is the conservative pick
# — it halves the payload with headroom left, rather than chasing the last
# megabyte and finding out on a phone speaker that the voice went papery.
NARRATION_BITRATE = "16k"

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
    # Beats last, and deliberately after space_out_lists: that pass upgrades the
    # commas of an enumeration to full breaths, and a beat written as a comma
    # would otherwise be swept up with them and come out four times its length.
    for mark, punct in BEATS.items():
        text = text.replace(mark, punct)
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


def strip_marks(text):
    """The paragraph as prose: performance marks gone, beats down to commas.

    This is what the linter reads and what anything counting sentences should
    read. Beats become the punctuation nearest to what they mean rather than
    vanishing, because is_finite() decides where a clause ends by splitting on
    `,` and `—`, and a beat is exactly a clause boundary.
    """
    text = _STYLE_MARK.sub("", text)
    for mark, punct in BEATS_FLAT.items():
        text = text.replace(mark, punct)
    return re.sub(r"\s{2,}", " ", text).strip()


def parse_spans(para, where=""):
    """Cut one paragraph into [(text, style)] at its performance marks.

    `[name]` opens a span, `[/]` closes it and returns to whatever was being
    read before. A paragraph with no marks comes back as a single narrator
    span, which is the case that must stay exactly as cheap as it was.

    Beats are left alone here: they are punctuation, not structure, and cutting
    the clip at one would replace the pause with a *silence*, which sounds like
    the sentence ended rather than like the narrator waited.
    """
    parts = _STYLE_MARK.split(para)
    spans, style, stack = [], "narrator", []

    def push(text):
        text = text.strip()
        if not text:
            return
        if spans and spans[-1][1] == style:
            spans[-1] = (spans[-1][0] + " " + text, style)
        else:
            spans.append((text, style))

    push(parts[0])
    for i in range(1, len(parts), 2):
        mark, text = parts[i], parts[i + 1]
        if mark == "/":
            if not stack:
                sys.exit(f"{where}: [/] with nothing open: {para[:80]!r}")
            style = stack.pop()
        else:
            if not valid_style(mark):
                sys.exit(f"{where}: unknown performance mark [{mark}]; "
                         f"expected NAME or NAME:MOOD, where NAME is one of "
                         f"{', '.join(sorted(STYLES))} and MOOD is one of "
                         f"{', '.join(sorted(EMOTIONS))}")
            stack.append(style)
            style = mark
        push(text)
    if stack:
        sys.exit(f"{where}: [{style}] was never closed with [/]: {para[:80]!r}")
    return _merge_bare(spans) or [(para.strip(), "narrator")]


def _has_word(text):
    """Is there anything here for a voice to say?

    Deliberately `isalnum` and not a Devanagari character range. The danda —
    the Nepali full stop — is U+0964, which sits *inside* the Devanagari block
    between the letters and the digits, so `[ऀ-ॿ]` counts the punctuation as a
    word and lets a bare "।" through as though it were speech. Unicode's own
    categories know the difference; a hand-written range does not.
    """
    return any(c.isalnum() for c in text)


def _merge_bare(chunks):
    """Fold chunks holding no word into their neighbour.

    Two things produce one. Two quotations separated by nothing but a comma —
    ``[nami]"…"[/], [nami]"…"[/]`` — leave a *span* whose entire text is ",".
    And a quotation whose sentence-ending danda falls outside the closing quote
    — ``…हुन्छ — [aside]"…छ"[/]। किनभने…`` — leaves a bare "।" once the
    following span is cut into *sentences*.

    edge-tts refuses both ("No audio was received"), and neither should be its
    own clip in any case: the punctuation belongs to the line it follows, and
    attaching it there is also what makes the quotation end on a full stop
    instead of a dangling quote.
    """
    out = []
    for text, style, *rest in chunks:
        if not _has_word(text):
            if out:
                out[-1] = (out[-1][0] + text, *out[-1][1:])
            elif len(chunks) > 1:
                continue          # leading stray; the next chunk absorbs it
            else:
                out.append((text, style, *rest))
            continue
        out.append((text, style, *rest))
    return out


# How long the silence after a chunk of speech is, as a multiple of the mode's
# base pause. This is the difference between a reading and a recital, and it
# costs nothing: the gaps are cached silence files, not synthesis.
#
# The rules are all about what the listener has just heard. A question wants to
# hang there. An exclamation wants to be caught up with, not sat on. A line of
# dialogue closing is a small scene ending, so the room settles before the
# narrator comes back; and a narrator running up to a quotation ("…र भन्यो —")
# must not stop at all, because the sentence is not over, someone is about to
# speak in it.
GAP_AFTER = (("…", 1.55), ("?", 1.30), ("!", 0.80))
_CLOSERS = "\"”'»)"


def gap_for(prev, nxt, prof, kind, key):
    """Seconds of silence between two clips.

    `kind` is "sentence" when the break falls where a sentence ended and "hand"
    when a performance mark cut into the middle of one.
    """
    base = prof["gap_hand"] if kind == "hand" else prof["gap_sent"]
    p, n = prev.rstrip(), nxt.lstrip()
    quoted_out = p[-1:] in _CLOSERS
    p = p.rstrip(_CLOSERS)
    scale = 1.0
    for chars, mult in GAP_AFTER:
        if p[-1:] in chars:
            scale = mult
            break
    if p.endswith(("—", "-", ":")):
        # an attribution handing over to the line it introduces
        scale = 0.35
    elif quoted_out:
        scale *= 1.25          # the room after somebody stops speaking
    if n[:1] in "\"“":
        scale *= 1.20          # a beat before a voice that is not the reader's
    # Jitter is a fraction of the pause, not a fixed number of milliseconds: a
    # ±0.3s wobble is right on a paragraph break and absurd on the sixteenth of
    # a second between "…र भन्यो —" and the line it introduces, where it would
    # be five times the gap it was supposed to vary.
    gap = base * scale
    return max(0.05, min(3.0, gap * (1.0 + jitter(key, prof["gap_jitter"]))))


_ALGO_OPEN = re.compile(r"@algo\s+([\w-]+)\s*$")
_ALGO_END = re.compile(r"@end\s*$")
_RECALL = re.compile(r"@recall\s+([\w-]+)\s*(?:\|\s*(.*\S))?\s*$")

# How many times a chapter's core method has to be spoken before the linter is
# satisfied. Said once, a method is something you heard; said three times across
# a chapter, with the story in between, it is something you can recite.
MIN_RECITALS = 3


def _steady(text):
    """Wrap each paragraph of a method block in the `steady` register.

    Per paragraph rather than around the whole block, because spans do not
    survive a blank line — parse_spans works on one paragraph at a time — and a
    method written as two paragraphs is perfectly ordinary.
    """
    return "\n\n".join("[steady]" + p.strip() + "[/]"
                       for p in re.split(r"\n\s*\n", text) if p.strip())


def expand_recalls(body, where):
    """Expand `@algo NAME … @end` definitions and their `@recall NAME` repeats.

    The point of the whole mechanism is that the *same words* come back. A
    method paraphrased three different ways is three things to learn; the same
    six sentences three times, spaced across a chapter, is one thing learned. So
    the steps are written once and replayed verbatim, and only the sentence that
    introduces them changes:

        @algo reverse
        साङ्लो उल्टाउने विधि यस्तो छ। …
        @end
        …story…
        @recall reverse | अब फेरि एकपटक, बिस्तारै।

    Verbatim also makes the repeats nearly free. Clips are cached by the hash of
    what was spoken (see clip_key), so the second and third recital of a block
    are cache hits — they cost playing time and no synthesis at all.

    That is also why every block comes back wrapped in `[steady]`. Everywhere
    else the voice now wanders a little from paragraph to paragraph, because a
    reading that does not is a recital; but a method that wanders is three
    slightly different recordings, and "the same words three times" was the
    thing worth having. The method blocks hold still. The story moves.

    Returns (expanded_body, {name: recital_count}).
    """
    algos, counts = {}, {}
    out, cur, name = [], None, None
    for line in body.split("\n"):
        m = _ALGO_OPEN.match(line.strip())
        if m:
            if cur is not None:
                sys.exit(f"{where}: @algo {m.group(1)} inside @algo {name}")
            name, cur = m.group(1), []
            if name in algos:
                sys.exit(f"{where}: @algo {name} defined twice")
            continue
        if cur is not None:
            if _ALGO_END.match(line.strip()):
                text = "\n".join(cur).strip()
                if not text:
                    sys.exit(f"{where}: @algo {name} is empty")
                algos[name] = _steady(text)
                counts[name] = 1
                out.append(algos[name])
                cur, name = None, None
                continue
            if line.strip().startswith("@"):
                sys.exit(f"{where}: {line.strip()!r} is not allowed inside @algo")
            cur.append(line)
            continue
        m = _RECALL.match(line.strip())
        if m:
            key, lead = m.group(1), m.group(2)
            if key not in algos:
                sys.exit(f"{where}: @recall {key} before any @algo {key}")
            counts[key] += 1
            out.append((lead + "\n\n" if lead else "") + algos[key])
            continue
        out.append(line)
    if cur is not None:
        sys.exit(f"{where}: @algo {name} was never closed with @end")
    return "\n".join(out), counts


_READ = re.compile(r"@(?:slow|read\s+([a-z][a-z0-9_]*(?::[a-z]+)?))")


def _read_style(line):
    """The style a `@slow` / `@read NAME` directive line asks for, or None."""
    m = re.fullmatch(_READ, line.strip())
    if not m:
        return None
    return m.group(1) or "slow"


def split_tiers(body, where):
    """Split a chapter body into (paragraph, tier, style) triples.

    A line reading `@tier medium` sets the tier of everything after it until the
    next such line; `@tier core` switches back. Paragraphs before any directive
    are core, so an untagged script is a valid all-core script and nothing had
    to change when tiers were introduced.

    A line reading `@read NAME` sets the register of the *next paragraph only*
    — `@slow` is the original spelling of `@read slow` and still works. One-shot
    rather than a run because a register somebody forgot to close would quietly
    recolour the rest of a chapter. Marks *inside* a paragraph (see parse_spans)
    are the finer instrument; this is for a whole paragraph that is quiet, or
    bright, or being taught rather than told.

    The returned triples are stably sorted core -> medium -> long. Grouping the
    extras at the end of the chapter is what lets each tier be a playlist over
    the same segment files rather than its own render: short plays the core
    segment, long plays all three, and every one of them concatenates without a
    join in the middle of a scene.
    """
    paras, tier, style = [], "core", "narrator"

    def want(name):
        if not valid_style(name):
            sys.exit(f"{where}: unknown reading style @read {name}; "
                     f"expected NAME or NAME:MOOD, where NAME is one of "
                     f"{', '.join(sorted(STYLES))} and MOOD is one of "
                     f"{', '.join(sorted(EMOTIONS))}")
        return name

    for block in re.split(r"\n\s*\n", body):
        block = block.strip()
        if not block:
            continue
        s = _read_style(block)
        if s:
            style = want(s)
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
        s = _read_style(first)
        if s and rest.strip():
            style, block = want(s), rest.strip()
            first, _, rest = block.partition("\n")
        m = re.fullmatch(r"@tier\s+(\w+)", first.strip())
        if m and rest.strip():
            if m.group(1) not in TIER_RANK:
                sys.exit(f"{where}: unknown tier {m.group(1)!r}")
            tier = m.group(1)
            block = rest.strip()
        paras.append((block, tier, style))
        style = "narrator"

    ordered = sorted(paras, key=lambda p: TIER_RANK[p[1]])
    if [t for _, t, _ in paras] != [t for _, t, _ in ordered]:
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
        # A leading underscore marks a sidecar the linter owns, not a chapter.
        if not name.endswith(".txt") or name.startswith("_"):
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
        body, recitals = expand_recalls(body, name)
        pairs = [pt for pt in split_tiers(body, name)
                 if TIER_RANK[pt[1]] <= keep]
        paras = [p for p, _, _ in pairs]
        # A paragraph-level `@read` is the register everything in the paragraph
        # that is not otherwise marked gets read in; an inner `[luffy]` still
        # wins inside its own span, and `[/]` returns to the paragraph's
        # register rather than to the plain narrator.
        spans = [[(t, base if s == "narrator" else s)
                  for t, s in parse_spans(p, name)]
                 for p, (_, _, base) in zip(paras, pairs)]
        chapters.append({"num": num, "file": name, "path": path, "title": title,
                         "paras": paras, "recitals": recitals,
                         "tiers": [t for _, t, _ in pairs],
                         "styles": [s for _, _, s in pairs], "spans": spans,
                         "sents": [split_sentences(strip_marks(p))
                                   for p in paras]})
    if not chapters:
        sys.exit("no chapter .txt files found in script/")
    return chapters


# ---------------------------------------------------------------------------
# Synthesis
# ---------------------------------------------------------------------------

def units(spans, mode):
    """[(text, style, kind)] — the clips one paragraph becomes in one mode.

    `kind` is what falls *before* this clip: "sentence" where a sentence ended,
    "hand" where a performance mark cut into the middle of one. gap_for() turns
    that into a length. The first unit's kind is never used.

    A paragraph with no marks comes back as one narrator span here, which for
    the driving read is one clip exactly as before and for the bedtime read is
    its sentences exactly as before.
    """
    out = []
    by_para = MODE_PROFILE[mode]["unit"] == "paragraph"
    for si, (text, style) in enumerate(spans):
        # Whether the previous span stopped at a sentence end decides whether
        # the narrator is allowed to stop with it.
        kind = "sentence" if not si or out and _ends_sentence(out[-1][0]) \
            else "hand"
        if by_para:
            out.append((text, style, kind))
            continue
        for j, sent in enumerate(split_sentences(text)):
            out.append((sent, style, "sentence" if j else kind))
    # Again here and not only over the spans: splitting a span into sentences
    # can strand a lone danda that the span itself did not have. Shading comes
    # after, so a unit is read for its mood in the form it will be spoken in.
    return [(text, shade(text, style), kind)
            for text, style, kind in _merge_bare(out)]


def _ends_sentence(text):
    return text.rstrip().rstrip(_CLOSERS)[-1:] in "।?!…"


def clip_path(mode, num, pi, si=None):
    """Where one clip lives. The two modes cut the script differently, so they
    cannot share a cache — but they can share a directory, and keeping the
    bedtime names exactly as they were means adding driving mode did not
    invalidate a single one of the clips already synthesized for it.

    `si` is the clip's index within the paragraph. In the driving read that is
    None for an unmarked paragraph — one span, one clip, the name it has always
    had — and an index once a performance mark has cut the paragraph up.
    """
    if mode == "bedtime":
        return os.path.join(PARTS_DIR, f"ch{num}-p{pi:02d}-s{si:02d}.mp3")
    if si is None:
        return os.path.join(PARTS_DIR, f"{mode}-ch{num}-p{pi:02d}.mp3")
    return os.path.join(PARTS_DIR, f"{mode}-ch{num}-p{pi:02d}-x{si:02d}.mp3")


def clip_paths(mode, num, pi, n_units):
    """Where every clip of one paragraph lives, in order."""
    if MODE_PROFILE[mode]["unit"] == "paragraph" and n_units == 1:
        return [clip_path(mode, num, pi)]
    return [clip_path(mode, num, pi, j) for j in range(n_units)]


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


def clip_key(spoken, voice, rate, pitch, volume):
    return hashlib.sha1(
        "\x1f".join([voice, rate, pitch, volume, spoken]).encode("utf-8")
    ).hexdigest()[:16]


def clip_params(mode, index, style):
    """(voice, rate, pitch, volume) for one clip.

    One function rather than two so the plan and the synthesis can never
    disagree about what a clip is — they used to compute this separately, and a
    mismatch would silently re-synthesize every repeat instead of copying it.

    `index` is the clip's (chapter, paragraph) position, and is what stops the
    reading being metronomic: rate and pitch wander with drift() so the voice
    slowly speeds up and slows down across the hours the way a person does.
    A `steady` style suppresses that — see expand_recalls(), where the method
    blocks want to be the same recording every time they come back.
    """
    prof, st = MODE_PROFILE[mode], resolve(style)
    wander = 0.0 if st.get("steady") else 1.0
    rate = _pct(prof["rate"],
                drift(index, prof["drift_rate"]) * wander + st.get("rate", 0.0))
    pitch = _hz(prof["pitch"],
                drift(index, prof["drift_pitch"], seed=1.4) * wander
                + st.get("pitch", 0.0))
    return st.get("voice", VOICE), rate, pitch, prof["volume"]


async def synth(sem, out_path, text, label, force, mode="bedtime", index=0,
                style="narrator"):
    """Synthesize one clip, unless a fresh cached one already exists."""
    prof = MODE_PROFILE[mode]
    name = os.path.basename(out_path)
    spoken = to_speakable(text, space_lists=prof["space_lists"])
    voice, rate, pitch, volume = clip_params(mode, index, style)
    key = clip_key(spoken, voice, rate, pitch, volume)
    async with sem:
        if (not force and _index.get(name) == key
                and os.path.exists(out_path) and os.path.getsize(out_path) > 0):
            return True
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                comm = edge_tts.Communicate(spoken, voice, rate=rate,
                                            pitch=pitch, volume=volume)
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


def _plan_clips(chapters, mode):
    """[(out_path, text, drift_index, style)] for every clip this mode needs."""
    plan = []
    for ci, ch in enumerate(chapters):
        for i, spans in enumerate(ch["spans"]):
            us = units(spans, mode)
            paths = clip_paths(mode, ch["num"], i, len(us))
            for out, (text, style, _) in zip(paths, us):
                plan.append((out, text, ci * 97 + i, style))
    return plan


async def synth_all(chapters, force, mode="bedtime"):
    """Synthesize every clip this mode needs, once per distinct sound.

    @recall replays a method's exact words two or three times a chapter, so the
    script now contains large blocks that are byte-identical. In bedtime mode the
    voice parameters do not drift, which makes those repeats identical *clips* —
    so they are synthesized once and the file is copied to the other positions.
    That is not just a saving: it guarantees the listener hears literally the
    same recording each time, which is the point of repeating it at all.
    (Driving mode drifts rate and pitch per paragraph, so its repeats differ
    slightly and each is synthesized on its own. That is also the point there.)
    """
    os.makedirs(PARTS_DIR, exist_ok=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    load_index()
    prof = MODE_PROFILE[mode]

    plan = _plan_clips(chapters, mode)
    first, copies = {}, []
    for out, text, idx, style in plan:
        spoken = to_speakable(text, space_lists=prof["space_lists"])
        key = clip_key(spoken, *clip_params(mode, idx, style))
        if key in first:
            copies.append((first[key], out, key))
        else:
            first[key] = out
    if copies:
        print(f"  · {len(copies)} repeated clip(s) will be copied, not re-synthesized")

    # One clip for the whole paragraph, or one per sentence. That single choice
    # is most of what separates the two reads: inside one clip the engine
    # carries prosody across sentence boundaries and puts its own uneven pauses
    # at the commas, which is exactly what the sentence-per-clip bedtime read
    # gives up on purpose.
    #
    # The drift index is (chapter, paragraph), not a running count. A running
    # count would shift for every clip after any inserted paragraph, changing
    # its rate and pitch and so invalidating the whole rest of the voyage in the
    # cache. Keyed this way, adding a paragraph costs exactly that paragraph.
    # 97 is just a stride bigger than any chapter, so the drift still wanders
    # across chapter boundaries instead of restarting at each one.
    originals = set(first.values())
    tasks, meta = [], []
    for out, unit, idx, style in plan:
        if out not in originals:
            continue
        tasks.append(synth(sem, out, unit, os.path.basename(out)[:-4], force,
                           mode=mode, index=idx, style=style))
        meta.append(out)
    results = await asyncio.gather(*tasks)

    # Before the copies, not after: a clip that failed to synthesize may still
    # be the *source* one, and reading it then reports a missing parts/ file
    # dozens of lines away from the ✗ that explains why it is missing.
    failed = [m for m, ok in zip(meta, results) if not ok]
    if failed:
        names = ", ".join(os.path.basename(m)[:-4] for m in failed[:8])
        sys.exit(f"\n{len(failed)} clip(s) failed: {names}"
                 + (" …" if len(failed) > 8 else ""))

    for src, dst, key in copies:
        if force or _index.get(os.path.basename(dst)) != key or not os.path.exists(dst):
            with open(src, "rb") as f:
                data = f.read()
            with open(dst, "wb") as f:
                f.write(data)
            _index[os.path.basename(dst)] = key

    save_index()
    failed = [m for m, ok in zip(meta, results) if not ok]
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
    prof = MODE_PROFILE["bedtime"]
    seq, marks, levels = [], [], []
    t = 0.0

    def add(path, gain=0.0):
        nonlocal t
        seq.append(path)
        d = duration(path)
        if gain:
            levels.append((t, t + d, gain))
        t += d

    add(silence(LEAD_IN))
    for ci, ch in enumerate(chapters):
        marks.append({"num": ch["num"], "title": ch["title"], "start": round(t, 2)})
        for i, spans in enumerate(ch["spans"]):
            if i:
                add(silence(GAP_PARA * (1.0 + jitter(
                    f"mono{ch['num']}p{i}", prof["gap_jitter"]))))
            us = units(spans, "bedtime")
            paths = clip_paths("bedtime", ch["num"], i, len(us))
            for j, ((text, style, kind), path) in enumerate(zip(us, paths)):
                if j:
                    add(silence(gap_for(us[j - 1][0], text, prof, kind,
                                        f"mono{ch['num']}p{i}s{j}")))
                add(path, gain=resolve(style).get("gain", 0.0))
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
    return narration, marks, speech_end, levels


def mix(narration, total, out_mp3, marks, levels=()):
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
    graph = (f"[0:a]{voice_chain(levels)},apad=whole_dur={total:.2f}[v];"
             + ";".join(chunks) + ";"
             + "[v]" + "".join(labels)
             + f"amix=inputs={len(labels) + 1}:duration=first:normalize=0,"
             + "alimiter=limit=0.92[out]")

    run(["-i", narration] + inputs +
        ["-filter_complex", graph,
         "-map", "[out]", "-ac", "1", "-ar", str(SR),
         "-c:a", "libmp3lame", "-b:a", "64k",
         "-metadata", f"title={TITLE} — {SUBTITLE}",
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
                "paras": idx, "spans": [ch["spans"][i] for i in idx],
                "first": first_of_chapter, "mode": mode,
            })
            first_of_chapter = False
        prev_scene = scene
    return segs


def segment_gaps(seg):
    """The pause windows of a segment, without touching the encoder.

    Same walk as segment_narration(), minus the concat: it only adds up clip
    durations, all of which are already on disk in the cache. Split-bed builds
    need the gaps for every segment including the ones they are reusing, and
    re-encoding six hours of audio to find out where the silences are would be
    an absurd way to answer a question this script already knows the answer to.
    """
    return _narration_plan(seg)[2]


def level_expr(levels, ramp=0.20):
    """An ffmpeg volume expression that reads each clip at its own loudness.

    Why this exists at all: the whole point of a whisper is that it is quieter,
    and edge-tts's volume parameter cannot deliver that here. Measured, -45%
    against -12% is -4.0 dB at the engine but only -1.8 dB after VOICE_CHAIN,
    because the compressor keeping any one phrase from jumping in level while
    you are asleep flattens a deliberate hush just as happily. So the level is
    applied *after* the compressor instead, from the clip plan, which knows
    exactly where every clip starts and ends.

    Same shape as swell_expr: a trapezoid per clip, summed. The ramps sit in
    the silence on either side of the clip, so nothing steps mid-word, and the
    sum is clamped in case two ramps overlap.
    """
    if not levels:
        return None
    terms = []
    for a, b, db in levels:
        m = 10 ** (db / 20.0) - 1.0
        terms.append(f"({m:+.4f})*min(1,max(0,min((t-{a - ramp:.2f})/{ramp:.2f},"
                     f"({b + ramp:.2f}-t)/{ramp:.2f})))")
    return "max(0.15,min(2.20,1+" + "+".join(terms) + "))"


def voice_chain(levels=()):
    """The voice's processing, with the reading's dynamics inside it.

    The envelope goes after the compressor — otherwise the compressor undoes it
    — and before the reverb, so a line that was spoken loudly still decays into
    the room loudly. With nothing marked this returns VOICE_CHAIN unchanged,
    which is what keeps an unmarked segment byte-identical to the one that was
    rendered before any of this existed.
    """
    expr = level_expr(list(levels))
    if not expr:
        return VOICE_CHAIN
    return (f"{VOICE_PRE},volume=volume='{soundscape._esc(expr)}':eval=frame,"
            f"{VOICE_POST}")


def _narration_plan(seg):
    """(sequence of files, total length, gaps, levels) for one segment.

    Split out of segment_narration so the gaps can be had without the render.
    `levels` is [(start, end, dB)] for the clips whose register asks to be read
    at some other loudness; render_segment turns it into an envelope applied
    after the compressor, which is the only place it survives. See
    voice_chain().
    """
    mode = seg.get("mode", "bedtime")
    prof = MODE_PROFILE[mode]
    seq, t, gaps, levels = [], 0.0, [], []

    def add(path, is_gap=False, gain=0.0):
        nonlocal t
        seq.append(path)
        d = duration(path)
        if is_gap:
            gaps.append((t, t + d))
        elif gain:
            levels.append((t, t + d, gain))
        t += d

    add(silence(seg["lead"]), is_gap=True)
    for k, (pi, spans) in enumerate(zip(seg["paras"], seg["spans"])):
        if k:
            # Every gap a slightly different length. A constant is what makes a
            # long reading feel mechanical, and the ear notices the regularity
            # long before it notices the duration.
            add(silence(prof["gap_para"] * (1.0 + jitter(
                f"{mode}{seg['num']}p{pi}", prof["gap_jitter"]))), is_gap=True)
        us = units(spans, mode)
        paths = clip_paths(mode, seg["num"], pi, len(us))
        for j, ((text, style, kind), path) in enumerate(zip(us, paths)):
            if j:
                add(silence(gap_for(us[j - 1][0], text, prof, kind,
                                    f"{mode}{seg['num']}p{pi}s{j}")),
                    is_gap=True)
            add(path, gain=resolve(style).get("gain", 0.0))

    # The runout past the last word is a pause too, and the longest one there
    # is: the bed should be rising as the segment hands over to the next.
    gaps.append((t, t + OVERLAP))
    return seq, t, gaps, levels


def segment_narration(seg, out_wav):
    """Concatenate one segment's clips and silences into PCM.

    Returns (length, gaps, levels), where gaps are the (start, end) windows in
    which nothing is being said. The mix uses them to swell the ambience — see
    swell_expr() — which is only possible because they are known exactly here
    rather than detected later from the audio.
    """
    mode = seg.get("mode", "bedtime")
    seq, t, gaps, levels = _narration_plan(seg)
    listfile = os.path.join(PARTS_DIR, f"_concat-{mode}-{seg['name']}.txt")
    with open(listfile, "w", encoding="utf-8") as f:
        for p in seq:
            f.write("file '" + p.replace("'", "'\\''") + "'\n")
    run(["-f", "concat", "-safe", "0", "-i", listfile,
         "-c:a", "pcm_s16le", "-ar", str(SR), "-ac", "1", out_wav])
    os.remove(listfile)
    return t, gaps, levels


def mode_dir(mode):
    return os.path.join(AUDIO_DIR, mode)


def render_segment(seg, index, ambient=True, split=False):
    """Mix and encode one segment. Returns (duration, gaps).

    `split` renders the narration alone and leaves the bed to the browser (see
    shared/bed-engine.js). That is not a quality compromise, it is where the
    bits were going: opus at 28 kbps was spending most of its budget
    re-describing surf that never changes, and the same voice at the same
    quality fits in 16 kbps once the surf is gone. Measured on ch05-core,
    narration-only at 16k is 49% of the mixed file in bedtime mode and 52% in
    drive mode. The bed comes back as seven loops totalling 0.61 MB for the
    entire site rather than a share of all 11.87 hours.

    The gaps are returned either way, because in split mode they are the only
    record of where the pauses are and the player needs them to breathe the bed.
    """
    mode = seg.get("mode", "bedtime")
    prof = MODE_PROFILE[mode]
    out = os.path.join(mode_dir(mode), seg["name"] + ".opus")
    wav = os.path.join(PARTS_DIR, f"_seg-{mode}-{seg['name']}.wav")
    speech, gaps, levels = segment_narration(seg, wav)
    chain = voice_chain(levels)
    total = speech + OVERLAP

    if split:
        # VOICE_CHAIN still applies: it is what the voice is supposed to sound
        # like, and none of it is bed. `-application voip` tells opus this is a
        # single speaker, which is worth several kbps at this bitrate.
        run(["-i", wav, "-af", f"{chain},apad=whole_dur={total:.2f}",
             "-c:a", "libopus", "-b:a", NARRATION_BITRATE, "-ac", "1",
             "-application", "voip", "-vbr", "on",
             "-metadata", f"title={seg['num']} {seg['title']}",
             "-metadata", "artist=Talank Baral",
             "-metadata", f"album={TITLE}", out])
        os.remove(wav)
        return duration(out), gaps

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
        graph = (f"[0:a]{chain},apad=whole_dur={total:.2f}[v];"
                 + ";".join(chunks) + ";"
                 + "".join(labels) + bed + "[bed];"
                 + "[v][bed]amix=inputs=2:duration=first:normalize=0,"
                 + "alimiter=limit=0.92[out]")
        run(["-i", wav] + inputs +
            ["-filter_complex", graph, "-map", "[out]",
             "-ac", "1", "-ar", str(SR), "-c:a", "libopus", "-b:a", "28k",
             "-metadata", f"title={seg['num']} {seg['title']}",
             "-metadata", "artist=Talank Baral",
             "-metadata", f"album={TITLE}", out])
    os.remove(wav)
    return duration(out), gaps


def render_outro_silent(mode="bedtime"):
    """The runout, in split-bed mode: silence of the right length.

    There is nothing to say here — the outro was always pure bed — so in split
    mode the file carries no signal at all and the browser simply holds the bed
    up through it. It still has to exist and still has to be exactly `tail`
    seconds long, because the player's virtual timeline is built from the
    playlist's durations and every length ends on this file.

    Opus spends almost nothing on digital silence: 25 seconds costs about 2 KB.
    """
    tail = MODE_PROFILE[mode]["tail"]
    out = os.path.join(mode_dir(mode), "outro.opus")
    run(["-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono", "-t", str(tail),
         "-c:a", "libopus", "-b:a", "6k", "-ac", "1", out])
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
    # first_input=0: the outro is pure bed, so the ambience files are inputs
    # 0..n here rather than sitting behind a narration track at input 0.
    inputs, chunks, labels = soundscape.build_segment(
        scene, scene, tail, SR, phase=31.0, fade_out=tail - 2.0,
        bed=prof["bed"] * 10 ** (prof["swell_db"] / 20.0), first_input=0)
    graph = (";".join(chunks) + ";" + "".join(labels)
             + f"amix=inputs={len(labels)}:duration=first:normalize=0[out]")
    run(inputs + ["-filter_complex", graph, "-map", "[out]",
                  "-ac", "1", "-ar", str(SR),
                  "-c:a", "libopus", "-b:a", "28k", out])
    return duration(out)


def prior_single_file():
    """The single-file edition the previous manifest described, if its audio is
    still on disk.

    Rewriting manifest.json is what used to lose this: the segmented manifest
    replaced the monolith one wholesale, so the only record of the one file that
    was actually deployed disappeared with it. Read it back out and carry it
    forward instead.
    """
    path = os.path.join(HERE, "manifest.json")
    try:
        with open(path, encoding="utf-8") as f:
            old = json.load(f)
    except (OSError, ValueError):
        return None
    spare = old.get("fallback") if old.get("modes") else old
    if not isinstance(spare, dict):
        return None
    name, dur = spare.get("file"), spare.get("duration")
    if not name or not dur:
        return None
    full = os.path.join(HERE, name)
    if not os.path.exists(full):
        return None
    return {
        "file": name, "duration": dur, "bytes": os.path.getsize(full),
        "voice": spare.get("voice", VOICE),
        "rate": spare.get("rate"), "pitch": spare.get("pitch"),
        "chapters": [{"num": c["num"], "title": c["title"],
                      "start": c.get("start", 0)}
                     for c in spare.get("chapters", [])],
    }


def bed_manifest_block():
    """The scene/layer model the browser needs, read back from the exported bed.

    Read rather than recomputed: shared/export_bed.py writes bed.json from
    soundscape.py, so taking it from there means the manifest can never claim a
    layer the bed directory does not actually contain.
    """
    path = os.path.join(HERE, "bed", "bed.json")
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        meta = json.load(f)
    return {"dir": "data/bedtime/bed/",
            "layers": [layer["name"] for layer in meta["layers"]]}


def build_segments(chapters, only=None, ambient=True, modes=MODES, reuse=False,
                   split=False):
    """Render every segment of every mode and return one manifest for all of it.

    `chapters` is always the whole script even under --only, because a chapter's
    ambience depends on the scene of the chapter before it and the manifest has
    to describe the complete voyage either way. --only narrows what gets
    re-rendered, not what gets planned.

    `reuse` keeps any .opus already on disk and only measures it. The manifest
    has to describe every mode at once, so a run that died partway cannot be
    resumed by narrowing the modes — that would write a manifest naming only the
    modes it rendered. Reuse lets the second run pick up where the first stopped
    and still emit the whole thing.
    """
    manifest = {
        "overlap": OVERLAP, "dir": "data/bedtime/audio/", "voice": VOICE,
        "chapters": [{"num": c["num"], "title": c["title"]} for c in chapters],
        "defaultMode": "bedtime",
        "modes": {},
    }
    if split:
        bed = bed_manifest_block()
        if not bed:
            sys.exit("--split-bed needs bed/bed.json — run "
                     "shared/export_bed.py --src ambience --out bed first")
        manifest["bed"] = bed
    spare = prior_single_file()
    if spare:
        # audio/ and manifest.js deploy separately, and audio/ is by far the
        # heavier of the two. If the manifest lands on the server first the
        # player has nothing to play, so hand it the single-file edition to
        # retreat to — that one is small enough to already be up there.
        manifest["fallback"] = spare
        print(f"  fallback: {spare['file']} ({spare['duration'] / 3600:.2f} h)")
    for mode in modes:
        prof = MODE_PROFILE[mode]
        os.makedirs(mode_dir(mode), exist_ok=True)
        segs = plan_segments(chapters, mode=mode)
        todo = sum(1 for x in segs if not only or x["num"] in only)
        print(f"\n[{mode}] rendering {todo}/{len(segs)} segments "
              f"into audio/{mode}/…")
        for i, seg in enumerate(segs):
            path = os.path.join(mode_dir(mode), seg["name"] + ".opus")
            if os.path.exists(path) and (reuse or
                                         (only and seg["num"] not in only)):
                seg["dur"] = duration(path)
                # The gaps live only in the manifest now, so a reused segment
                # still has to have them recomputed. That is cheap — it reads
                # clip durations out of the cache, it does not re-encode.
                if split:
                    seg["gaps"] = segment_gaps(seg)
                continue
            seg["dur"], seg["gaps"] = render_segment(seg, i, ambient=ambient,
                                                     split=split)
            print(f"  {seg['name']:16s} {seg['tier']:6s} {hms(seg['dur'])}  "
                  f"{os.path.getsize(path) / 1024:6.0f} KB")

        outro = os.path.join(mode_dir(mode), "outro.opus")
        if os.path.exists(outro) and (reuse or only):
            outro_dur = duration(outro)
        elif split:
            outro_dur = render_outro_silent(mode=mode)
            print(f"  {'outro':16s} {'all':6s} {hms(outro_dur)}  (silent, "
                  f"bed only)")
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
        if split:
            # Keyed by file, not listed per tier: core segments appear in all
            # three playlists, and their pause windows are the same in each.
            # Repeating them per tier would treble the one part of the manifest
            # that is not tiny.
            entry["bed"] = {"gain": prof["bed"], "swellDb": prof["swell_db"]}
            entry["segments"] = {
                seg["name"] + ".opus": {
                    "s": seg["scene"],
                    "g": bedcodec.encode(seg.get("gaps") or []),
                }
                for seg in segs
            }
            # The outro is silence; the bed simply holds through it, at the
            # scene the voyage ended in.
            entry["segments"]["outro.opus"] = {
                "s": soundscape._scene(chapters[-1]["num"]), "g": "",
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
        f.write(f"{TITLE} — {CHAPTERS_HEADING}\n\n")
        for mode, mi in manifest["modes"].items():
            # A course that collapsed its labels to English has label == label_en,
            # and "Bedtime / Bedtime" reads like a bug rather than a translation.
            both = (f"{mi['label']} / {mi['label_en']}"
                    if mi["label"] != mi["label_en"] else mi["label"])
            f.write(f"=== {both} ===\n\n")
            for tier in TIERS:
                ti = mi["tiers"][tier]
                name = (f"{ti['label']} ({ti['label_en']})"
                        if ti["label"] != ti["label_en"] else ti["label"])
                f.write(f"— {name}: "
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
        f.write(f'TITLE "{TITLE}"\n')
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


_LOCK_FH = None


def _take_lock():
    """One build per output directory, enforced rather than remembered.

    Two builds pointed at the same audio/ do not merely race, they corrupt each
    other silently: both encode the same segment to the same path, one reads
    the half-written file and dies decoding it, the other dies removing an
    intermediate the first already cleaned up. Neither traceback names the real
    cause, and the log is unreadable because both processes write to it at
    independent offsets. A build takes hours, which is exactly the window in
    which someone starts a second one.

    Held for the life of the process; the kernel drops it if the build is
    killed, so a stale lock cannot outlive its owner and need never be cleared
    by hand.
    """
    global _LOCK_FH
    import fcntl
    os.makedirs(PARTS_DIR, exist_ok=True)
    _LOCK_FH = open(os.path.join(PARTS_DIR, ".build.lock"), "w")
    try:
        fcntl.flock(_LOCK_FH, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        sys.exit(f"another build is already running in {HERE}\n"
                 f"(wait for it, or kill it — do not run two at once)")
    _LOCK_FH.write(str(os.getpid()))
    _LOCK_FH.flush()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="re-synthesize every clip")
    ap.add_argument("--only", default="", help="comma-separated chapter numbers")
    ap.add_argument("--stitch-only", action="store_true", help="skip synthesis")
    ap.add_argument("--synth-only", action="store_true",
                    help="fill the clip cache and stop, without stitching")
    ap.add_argument("--no-ambient", action="store_true", help="skip the surf bed")
    ap.add_argument("--split-bed", action="store_true",
                    help="render narration only and let the browser rebuild "
                         "the ambience (about half the bytes; needs bed/ from "
                         "shared/export_bed.py)")
    ap.add_argument("--reuse", action="store_true",
                    help="keep segments already rendered; only make what is "
                         "missing (resumes an interrupted build)")
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
    _take_lock()

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
                              ambient=not args.no_ambient, modes=modes,
                              reuse=args.reuse, split=args.split_bed)
    write_segment_sidecars(manifest)
    print("\n✓ audio/ + chapters.txt + manifest.json/.js")
    if not args.monolith:
        return

    chapters = load_chapters(only or None, tier=args.tier)
    print(f"\nAlso building the single-file {args.tier} voyage…")
    narration, marks, speech_end, levels = stitch(chapters)
    total = speech_end + TAIL

    out_mp3 = os.path.join(HERE, MONOLITH_NAME + ".mp3")
    if args.no_ambient:
        # Deliberately raw, as it always was — this path exists to hear the
        # reading without anything done to it. The dynamics are part of the
        # reading rather than part of the processing, so they do come along.
        expr = level_expr(levels)
        af = (f"volume=volume='{soundscape._esc(expr)}':eval=frame," if expr
              else "")
        run(["-i", narration, "-af", f"{af}apad=whole_dur={total:.2f}",
             "-c:a", "libmp3lame", "-b:a", "64k", out_mp3])
    else:
        mix(narration, total, out_mp3, marks, levels)

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
