#!/usr/bin/env python3
"""Build "The Quiet Monitor" — the ACLS course's bedtime voyage.

Twenty-six chapters on one subject: how to read an ECG. Not the algorithms, not
the drug doses — the tool tab already drills those. This is the thing the drills
assume you can already do, taught slowly, in the dark, in the order a strip
actually gives it up: paper, then waves, then intervals, then a method, then
every rhythm the method has to survive, then a twelve-lead.

**This voyage is entirely in English, and that is the point.** The other two on
this site are Nepali prose with the technical words respelled in Devanagari,
which works for `HashMap` and for `garbage collection` because those are names
of ideas the listener will meet again in writing. An ECG vocabulary is not like
that. There is no Nepali for a QRS complex, the exam is in English, the handover
is in English, and a listener who learns the sound "क्यू आर एस" without ever
hearing an English voice say "QRS complex" has learned a syllable rather than a
word.

The first edition kept one line in six in Nepali, read by a Nepali voice, for
the lines that only settle the listener down. That is gone, on the user's
instruction and for a good reason: a Nepali sentence in the middle of an English
chapter is a switch of language *and* of accent, and both of them wake somebody
who was nearly asleep. Everything is now English, written plainly enough for a
listener whose first language is not English, and every voice on the ward is
American — see the cast below.

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
    not touch the text at all except to space out the acronyms.
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
E.MONOLITH_NAME = "acls-quiet-monitor-full"   # nidra is Nepali; nothing here is
E.CHAPTERS_HEADING = "Chapter list"      # the engine's default is Nepali

# ---------------------------------------------------------------------------
# The voices
# ---------------------------------------------------------------------------
#
# Everyone on this ward is American, and every one of them was chosen by
# measurement rather than by reading the marketing adjectives. The two numbers
# that matter for a story somebody listens to while falling asleep are the
# median fundamental — how low the voice sits — and the ratio of its 95th
# percentile to that median, which is how far it leaps when it gets interested.
# A voice with a calm median and a wide spread is a voice that will suddenly
# raise itself at three in the morning, and the listener will be awake and will
# not know why. Measured on one paragraph of this script, at this rate:
#
#     en-IN-Prabhat (the old narrator)  118 Hz   1.64x     en-US-Guy    148 Hz
#     en-US-Christopher                 105 Hz   1.55x     en-US-Roger  135 Hz
#     en-US-Eric                        102 Hz   1.60x     en-US-Andrew 107 Hz  1.84x
#     en-US-Brian                       117 Hz   1.32x     en-IN-Neerja 239 Hz
#     en-US-Jenny                       175 Hz   1.55x     en-US-Aria   198 Hz
#     en-US-Michelle                    176 Hz   1.56x
#
# Christopher narrates: thirteen hertz below the voice he replaces, a slightly
# narrower spread, and a voice the service classifies for novels rather than for
# conversation, which is what thirteen hours of prose asks for. Andrew is warmer
# and was the obvious pick until the spread came back at 1.84 — the widest of
# the whole set, and disqualifying here for exactly the reason above.
#
# Rate needed recalibrating and this is the part that is easy to get wrong. The
# pace of this voyage was tuned by ear and approved; the American voices are
# simply quicker at the same setting, so keeping -18% would have sped the whole
# story up without anybody choosing to. Measured in words per minute on the same
# sentence: Prabhat at -18% reads 123, Christopher at -18% reads 149. -32% puts
# Christopher back on 123. The drive mode is the same arithmetic from -4% to
# -21%, which preserves its 144.
E.VOICE = "en-US-ChristopherNeural"
E.RATE = "-32%"
E.PITCH = "-4Hz"
E.VOLUME = "-12%"

# The cast, in the order the listener meets them.
#
# Nurse Maya — the senior nurse, eleven years of night shifts, and the person
# who does nearly all of the teaching. A separate actor rather than a shading of
# the narrator, which the engine normally refuses: half asleep, a woman's voice
# is instantly separable from the narrator's, and almost every chapter of this
# course is somebody being shown something. Jenny is 64 Hz below the voice she
# replaces, which is most of what "do not startle anybody" means here.
MAYA_VOICE = "en-US-JennyNeural"
# Nurse Laura — the other nurse on the shift, and the one who ends the night.
# Her lines were the Nepali sign-offs in the first edition: stop working, this
# will still be here tomorrow, go to sleep. Those were always a person talking
# rather than narration, so now they are one.
LAURA_VOICE = "en-US-MichelleNeural"
# Dr. Ellis — the resident, who appears when a monitor changes and somebody has
# to decide something. Brian has the narrowest pitch spread of every voice
# measured, 1.32x, so the one character who turns up in the frightening chapters
# is the one least able to startle anybody.
ELLIS_VOICE = "en-US-BrianNeural"

E.MODE_PROFILE["bedtime"].update(rate=E.RATE, pitch=E.PITCH, volume=E.VOLUME,
                                 space_lists=False)
E.MODE_PROFILE["drive"].update(rate="-21%", pitch="+0Hz", volume="+0%")

# The engine's mode and tier labels are Nepali, with an English label_en beside
# them; every other voyage shows the Nepali one. This page is English, so the
# two are collapsed. bedtime.html still reads label_en first as a safety net.
E.MODE_PROFILE["bedtime"]["label"] = E.MODE_PROFILE["bedtime"]["label_en"]
E.MODE_PROFILE["drive"]["label"] = E.MODE_PROFILE["drive"]["label_en"]
E.TIER_LABELS = dict(E.TIER_LABELS_EN)

# The cast, added to the engine's registers. `steady`, `teach`, `hush` and the
# rest of the delivery marks are the engine's and are used unchanged; the One
# Piece crew is left in place and simply never referenced by these scripts.
#
# Every rate here is an offset in percentage points from the mode's own rate, so
# `+2.0` on Maya means she reads at -30% while the narrator reads at -32%. The
# offsets are small on purpose. The characters are separated by *who they are* —
# three different people, measured 60 Hz apart — and not by being pitched and
# stretched away from each other, which is what makes a cast sound like one
# person doing voices.
# This voyage has its own characters and never uses the engine's One Piece
# crew — but those styles still carry the Nepali voices the engine assigns
# them, and an English render must not have a Nepali voice defined anywhere in
# its cast. Dropping them is what makes check_cast_language() pass honestly
# rather than by exception.
E.unset_crew_voices()

E.STYLES.update({
    # Nurse Maya. Two percentage points quicker than the narrator because she is
    # answering a question rather than telling a story, and half a decibel up
    # because she is the one saying the thing worth hearing.
    "maya":  {"voice": MAYA_VOICE, "rate": +2.0, "gain": +0.5},
    # Nurse Laura, who only ever appears to say that it is time to stop. Slower
    # than the narrator, a little lower, and quieter: she is the last voice in a
    # chapter and should be the softest thing in it.
    "laura": {"voice": LAURA_VOICE, "rate": -2.0, "pitch": -1.0, "gain": -1.5},
    # Dr. Ellis. Flat, unhurried, faintly bored — the register of somebody who
    # has done this before and is not going to raise their voice about it.
    "ellis": {"voice": ELLIS_VOICE, "rate": -1.0, "pitch": -2.0, "gain": +0.5},
})
# resolve() memoises per style name, and this file rewrites styles the engine
# has already defined. Nothing resolves at import time today, so the stale
# entry never surfaced -- but a cached 'sage' from the engine's Nepali cast is
# exactly the kind of thing that reaches a render as one paragraph in the
# wrong language. Cheap to drop.
E._RESOLVED.clear()
# There is deliberately no `patient` register. The first edition defined one and
# no chapter ever used it, which the linter now reports as a cast member who
# never speaks. The patient in bed four sleeps through all twenty-six nights;
# that is the point of the ward being quiet, and a voice nobody hears is not a
# character, it is an unused variable with a name.

# ---------------------------------------------------------------------------
# Sentences
# ---------------------------------------------------------------------------
#
# The engine splits on `।`, which no longer appears in this script at all. Every
# sentence here ends in a full stop, and the bedtime read *is* the split: one
# clip per sentence, with a measured silence after it. Without this the whole
# paragraph is one clip, read at conversational pace, with no pauses anywhere in
# it — which is exactly the reading this voyage exists to avoid.
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
_NEXT = r'(?=[A-Z"“(\[])'
_SENT_SPLIT = re.compile(
    r'(?<=[.?!…])\s+' + _NEXT +
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
    return text.rstrip().rstrip(E._CLOSERS)[-1:] in "?!….“"


E.split_sentences = split_sentences
E._ends_sentence = _ends_sentence

# ---------------------------------------------------------------------------
# Pronunciation
# ---------------------------------------------------------------------------
#
# The engine's own to_speakable respells English terms *into* Devanagari for a
# Nepali voice. There is no Nepali voice here any more, so that whole path is
# unreachable and this replaces rather than wraps it: an English line goes to an
# English engine, and the only thing done to it is spacing out the acronyms so
# that "SVT" is three letters rather than a word.
#
# The Devanagari guard that used to stand here is gone with the Nepali. What
# replaces it is a check in check_bedtime.py that there is no Devanagari left
# anywhere — an assertion about the whole script rather than a branch taken one
# line at a time.
def to_speakable(text, space_lists=True):
    text = acls_words.to_spoken(text)
    # Beats are the engine's, and are punctuation.
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
