#!/usr/bin/env python3
"""Build "The Quiet Monitor" — the ACLS course's bedtime voyage.

Twenty-six chapters on one subject: how to read an ECG. Not the algorithms, not
the drug doses — the tool tab already drills those. This is the thing the drills
assume you can already do, taught slowly, in the dark, in the order a strip
actually gives it up: paper, then waves, then intervals, then a method, then
every rhythm the method has to survive, then a twelve-lead.

**This voyage is in English, and that is the point.** The other two on this site
are Nepali prose with the technical words respelled in Devanagari, which works
for `HashMap` and for `garbage collection` because those are names of ideas the
listener will meet again in writing. An ECG vocabulary is not like that. There
is no Nepali for a QRS complex, the exam is in English, the handover is in
English, and a listener who learns the sound "क्यू आर एस" without ever hearing an
English voice say "QRS complex" has learned a syllable rather than a word. So
the terms stay in English and an English voice says them.

The Nepali does not disappear; it changes job. It is what the listener is told
between the teaching — settle down, do not try to hold on to this, here is the
one sentence that matters — and it is marked `[ne]…[/]` and read by a Nepali
voice. Roughly one line in six. See STYLES below.

Like full_stack_java, this is a *course profile* and not an engine. The two
listening modes, the three cumulative lengths, the sentence-per-clip bedtime
read, the clip cache, the @algo/@recall repetition and the split-bed render all
live in DSA_tool/data/bedtime/build_bedtime.py and are imported. What is
course-specific is here, and it is four things: the voices, the sentence
splitter, the pronunciation table, and which scene each chapter happens in.

Three overrides are load-bearing and none of them existed for the Nepali
voyages:

  * `split_sentences` — the engine splits on the danda. English sentences end in
    a full stop, and a bedtime read that never breaks a sentence is one enormous
    clip per paragraph with no pauses in it at all.
  * `to_speakable` — the engine respells English *into* Devanagari. Here it must
    do almost the opposite, and only for the Nepali spans.
  * `_ends_sentence` — the engine asks this before deciding whether a pause is a
    stop or a hand-off, and it has never seen a full stop either.

All three are module attributes on the engine, so rebinding them here is enough:
Python resolves a global at call time, so the engine's own internal calls pick
these up. That is the same mechanism full_stack_java uses for `to_speakable`,
and it is why the engine has no plugin system.

Usage, from this directory:

    python3 check_bedtime.py                  # lint first, always
    python3 build_bedtime.py --split-bed      # full render, both modes
    python3 build_bedtime.py --split-bed --only 07,08
    python3 build_bedtime.py --split-bed --reuse   # resume an interrupted run
"""
import importlib.util
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, *[".."] * 3))
ENGINE_DIR = os.path.join(ROOT, "DSA_tool", "data", "bedtime")

# Ahead of everything else, so `import soundscape` *inside* the engine resolves
# to the engine's own module, and so a script run from *this* directory still
# gets the engine's build_bedtime rather than the same-named file beside it.
sys.path.insert(0, ENGINE_DIR)
import build_bedtime as E  # noqa: E402  — needs the path set above
import soundscape  # noqa: E402


def _sibling(name):
    """Import a module from this directory without putting it on sys.path."""
    spec = importlib.util.spec_from_file_location(
        "acls_bedtime_" + name, os.path.join(HERE, name + ".py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


acls_words = _sibling("acls_words")

# ---------------------------------------------------------------------------
# Where this course keeps its things
# ---------------------------------------------------------------------------
E.HERE = HERE
E.SCRIPT_DIR = os.path.join(HERE, "script")
E.PARTS_DIR = os.path.join(HERE, "parts")
E.AUDIO_DIR = os.path.join(HERE, "audio")
E.INDEX_PATH = os.path.join(E.PARTS_DIR, "_index.json")

E.TITLE = "The Quiet Monitor"
E.SUBTITLE = "ACLS — Reading the ECG at night"
E.MONOLITH_NAME = "acls-nidra-full"

# ---------------------------------------------------------------------------
# The voices
# ---------------------------------------------------------------------------
#
# Two languages means two engines; there is no voice on this service that reads
# both scripts well. Measured, on one paragraph of English and one of Nepali:
# the en-IN and en-US voices return *no audio at all* for Devanagari, and the
# ne-NP voices read a Latin sentence twenty per cent faster than an English
# voice reads the same words, which is what a voice sounds like when it is
# guessing at spelling rather than saying words.
#
# So: Prabhat narrates, and Sagar says the Nepali. Both male, close in register,
# on purpose — this should sound like one person who slips into Nepali when he
# wants you to actually rest, not like two presenters taking turns.
#
# Slower and lower than this course's other pages, for the usual reason: it is
# competing with sleep. -18% rather than the Nepali voyages' -22%, because
# English at -22% on this voice starts to sound laboured rather than calm.
E.VOICE = "en-IN-PrabhatNeural"
E.RATE = "-18%"
E.PITCH = "-4Hz"
E.VOLUME = "-12%"

NE_VOICE = "ne-NP-SagarNeural"
# The teaching voice in the story: the senior nurse who has read ten thousand
# strips. A second actor rather than a shading of the narrator, which the engine
# normally refuses — but half asleep, a female voice is instantly separable from
# the narrator's, and this course has more dialogue than the other two because
# nearly every chapter is somebody being shown something.
SISTER_VOICE = "en-IN-NeerjaNeural"
NE_SISTER_VOICE = "ne-NP-HemkalaNeural"

E.MODE_PROFILE["bedtime"].update(rate=E.RATE, pitch=E.PITCH, volume=E.VOLUME,
                                 space_lists=False)
E.MODE_PROFILE["drive"].update(rate="-4%", pitch="+0Hz", volume="+0%")

# The engine's mode and tier labels are Nepali, with an English label_en beside
# them; every other voyage shows the Nepali one. This page is English, so the
# two are collapsed. bedtime.html still reads label_en first as a safety net.
E.MODE_PROFILE["bedtime"]["label"] = E.MODE_PROFILE["bedtime"]["label_en"]
E.MODE_PROFILE["drive"]["label"] = E.MODE_PROFILE["drive"]["label_en"]
E.TIER_LABELS = dict(E.TIER_LABELS_EN)

# The cast, added to the engine's registers. `steady` and `teach` and the rest
# of the delivery marks are the engine's and are used unchanged; the One Piece
# crew is left in place and simply never referenced by these scripts.
E.STYLES.update({
    # A Nepali line. The voice change is the whole style — no rate or pitch
    # offset, because Sagar is already a different person and shading him as
    # well would make the switch theatrical.
    "ne":      {"voice": NE_VOICE},
    # The same, said quietly, for the lines that are only there to settle
    # somebody down.
    "ne_hush": {"voice": NE_VOICE, "rate": -6.0, "pitch": -3.0, "gain": -3.5},
    # A Nepali line inside a method block: still the one recording every time.
    "ne_steady": {"voice": NE_VOICE, "steady": True},
    # The senior nurse, in each of her two languages. She teaches in English
    # because the terms are English; she reassures in Nepali because that is
    # what anybody does at four in the morning.
    "sister":  {"voice": SISTER_VOICE, "rate": -2.0, "gain": +0.5},
    "ne_sister": {"voice": NE_SISTER_VOICE, "rate": -2.0, "gain": +0.5},
    # The registrar, and the patient's own voice on the rare occasion there is
    # one. Shadings of the narrator, as the engine intends.
    "doc":     {"rate": -3.0, "pitch": -6.0, "gain": +0.5},
    "patient": {"rate": -8.0, "pitch": -2.0, "gain": -4.0},
})

# ---------------------------------------------------------------------------
# Sentences
# ---------------------------------------------------------------------------
#
# The engine splits on `।`, which appears in this script only inside the Nepali
# spans. Everything else ends in a full stop, and the bedtime read *is* the
# split: one clip per sentence, with a measured silence after it. Without this
# the whole paragraph is one clip, read at conversational pace, with no pauses
# anywhere in it — which is exactly the reading this voyage exists to avoid.
#
# Written as four alternatives rather than one because Python's lookbehind has
# to be fixed width, and "ends in a full stop" and "ends in a full stop inside a
# quotation" are different widths.
#
# A decimal point needs no special case: `0.12` has no space after the point, and
# every alternative here requires whitespace. Initials would need one — but the
# scripts have none, and the obvious guard (`(?<![A-Z]\.)`) would refuse to split
# after any sentence ending in an acronym, which is a sentence this course writes
# constantly.
_NEXT = r'(?=[A-Z"“(\[ऀ-ॿ])'
_SENT_SPLIT = re.compile(
    r'(?<=[।?!…])\s+'
    r'|(?<=[.?!…])\s+' + _NEXT +
    r'|(?<=[.?!…]")\s+' + _NEXT +
    r'|(?<=[.?!…]”)\s+' + _NEXT
)


def split_sentences(para):
    parts = [p.strip() for p in _SENT_SPLIT.split(para) if p and p.strip()]
    merged = []
    for p in parts:
        if merged and len(p) < E.MIN_SENT_CHARS:
            merged[-1] += " " + p
        else:
            merged.append(p)
    return merged or [para.strip()]


def _ends_sentence(text):
    return text.rstrip().rstrip(E._CLOSERS)[-1:] in "।?!….“"


E.split_sentences = split_sentences
E._ends_sentence = _ends_sentence

# ---------------------------------------------------------------------------
# Pronunciation
# ---------------------------------------------------------------------------
#
# Two paths, chosen by script, because the two voices need opposite treatment.
# A Latin line is going to an English engine and must not be touched by
# ne_pronounce at all; a Devanagari line is going to a Nepali engine and needs
# exactly what the other two voyages do to it.
#
# The engine's own to_speakable is what handles the Nepali side — including the
# single-letter pass that turns a stray "P" into "पी", which is why NE_TERMS in
# acls_words.py only has to carry the multi-word terms.
_DEVANAGARI = re.compile(r"[ऀ-ॿ]")
_engine_to_speakable = E.to_speakable


def to_speakable(text, space_lists=True):
    if _DEVANAGARI.search(text):
        return _engine_to_speakable(acls_words.to_nepali_terms(text),
                                    space_lists=space_lists)
    text = acls_words.to_spoken(text)
    # Beats are the engine's, and are punctuation in either language.
    for mark, punct in E.BEATS.items():
        text = text.replace(mark, punct)
    return re.sub(r"\s{2,}", " ", text).strip()


E.to_speakable = to_speakable

# ---------------------------------------------------------------------------
# Where each chapter happens
# ---------------------------------------------------------------------------
#
# The bed is the shared one — surf, wind, ship timber — and this course is set
# in a hospital, so the scenes are chosen for what they *sound* like rather than
# for what they are named. `cabin` and `ship_hold` are a small quiet room with a
# little creak in it, which is a ward at four in the morning. `night_sky` is the
# thinnest of them, for the chapters that are mostly one idea held still.
# `cave` has water in it, and belongs to the chapters about things dripping away
# — fine VF, asystole. The arrest chapters go out to `open_sea` and `cliff`,
# where the bed has weight, because those are the two chapters where the story
# is not calm and pretending otherwise would be a lie the listener can hear.
soundscape.SCENES = {
    0:  "harbour_night",   # the ward at night, and why a strip is only paper
    1:  "cabin",           # the paper and the grid
    2:  "workshop",        # where the electricity comes from
    3:  "cabin",           # P, Q, R, S, T
    4:  "cabin",           # the intervals
    5:  "night_sky",       # the six-step method
    6:  "workshop",        # rate
    7:  "workshop",        # regularity
    8:  "harbour_night",   # normal sinus rhythm
    9:  "cabin",           # sinus brady and sinus tach
    10: "night_sky",       # narrow against wide
    11: "deck",            # SVT
    12: "island_shore",    # atrial fibrillation
    13: "island_shore",    # atrial flutter
    14: "open_sea",        # monomorphic VT
    15: "cliff",           # torsades
    16: "open_sea",        # VF, coarse and fine
    17: "cave",            # asystole, and the flat line that is not one
    18: "cave",            # PEA
    19: "cabin",           # first-degree block
    20: "ship_hold",       # Mobitz I
    21: "ship_hold",       # Mobitz II and complete block
    22: "deck",            # the twelve-lead: where each lead looks
    23: "cliff",           # ST elevation and depression
    24: "forest",          # artifact, and the traps
    25: "harbour_night",   # three strips, read start to finish, and goodnight
}


# ---------------------------------------------------------------------------
# The bed
# ---------------------------------------------------------------------------
#
# Not rendered again. The seven ambience loops under the DSA voyage are 0.61 MB
# and never change, so this course points at them; a listener who plays two
# courses downloads them once. The path is written the way bedtime.html consumes
# it — that page passes anything starting `../` through untouched, so it
# resolves against ACLS_tool/bedtime.html rather than against this directory.
BED_DIR = "../DSA_tool/data/bedtime/bed/"


def bed_manifest_block():
    path = os.path.join(ENGINE_DIR, "bed", "bed.json")
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        meta = json.load(f)
    return {"dir": BED_DIR, "layers": [layer["name"] for layer in meta["layers"]]}


E.bed_manifest_block = bed_manifest_block

# Ambience source loops, for the rare non-split render. Same directory, same
# reason: there is one set of recordings on this site.
soundscape.AMB_DIR = os.path.join(ENGINE_DIR, "ambience")


if __name__ == "__main__":
    E.main()
