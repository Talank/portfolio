#!/usr/bin/env python3
"""Build the English edition of the DSA bedtime voyage.

Same voyage as the Nepali one: same twenty-seven chapters in the same order,
the same @algo methods repeated three times each, the same tiers. What differs
is the language and, because English gives it to us for free, the cast.

**The Nepali edition is not touched by this file.** It keeps script/, parts/,
audio/, manifest.json and chapters.txt; this one writes script-en/, parts-en/,
audio-en/, manifest-en.json and chapters-en.txt. They cannot share a manifest —
English runs shorter than Nepali for the same paragraph, which moves every
chapter offset and every tier byte count — so bedtime.html loads both and
switches between them.

**On the cast.** The Nepali edition shades one voice: a character there is
Hemkala at a different pitch, kept inside ±16 Hz on the stated grounds that an
impression at two in the morning is a wrong note. That constraint existed
because there was one usable Nepali voice. In English there are seventeen, so a
character can be an actually different person — which is *less* startling than
a pitch-shifted narrator, not more, because a shifted voice sounds like an
effect and a different speaker just sounds like someone else in the room.

The voices are not modelled on the English dub. That was asked for and is not
something to do: the dub is copyrighted, and its performances are the work of
named actors whose voices are not ours to reproduce. What is matched instead is
each character's *register* — where their voice sits and how much it moves —
which is what a listener half-asleep actually recognises.

Chosen by measurement on one line of this script (median F0, and p95/median as
the excursion — the second is what wakes people):

    en-US-BrianNeural        121 Hz  spread 1.18   narrator  ← flattest measured
    en-US-EricNeural         102 Hz  spread 1.50   Zoro
    en-US-ChristopherNeural  108 Hz  spread 1.53   Sanji
    en-US-SteffanNeural      120 Hz  spread 1.48   Franky
    en-US-RogerNeural        135 Hz  spread 1.63   Usopp
    en-US-GuyNeural          144 Hz  spread 1.60   Luffy
    en-US-MichelleNeural     180 Hz  spread 1.31   Robin
    en-US-AriaNeural         203 Hz  spread 1.47   Nami
    en-US-AnaNeural          291 Hz  spread 1.28   Chopper

en-US-AndrewNeural is the warm, obvious narrator and is not used at all: its
spread of 2.01 was the widest of the seventeen, which is a voice that will lift
sharply in the middle of a sentence at three in the morning.

**Rate.** English voices are quicker than Nepali ones at the same setting, so
the Nepali profile's rate would speed the whole story up. Measured on a whole
paragraph, Brian reads 145.7 wpm at -20%, 134.7 at -26%, 127.5 at -30% and
120.3 at -34%. **-32% is 123 wpm**, the pace the ACLS English voyage settled
on. Driving mode is -21%, by the same measurement.

Usage, from this directory:

    python3 check_bedtime_en.py                  # lint first, always
    python3 build_bedtime_en.py --split-bed      # full render, both modes
    python3 build_bedtime_en.py --split-bed --reuse
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import build_bedtime as E      # noqa: E402  — the engine, in this same directory
import dsa_words_en            # noqa: E402

# ---------------------------------------------------------------------------
# Where this edition keeps its things
# ---------------------------------------------------------------------------
#
# Every one of these has a Nepali counterpart in the same directory, and the
# whole point is that nothing here overwrites one of those.
E.SCRIPT_DIR = os.path.join(HERE, "script-en")
E.PARTS_DIR = os.path.join(HERE, "parts-en")
E.AUDIO_DIR = os.path.join(HERE, "audio-en")
E.INDEX_PATH = os.path.join(E.PARTS_DIR, "_index.json")

E.MANIFEST_STEM = "manifest-en"
E.CHAPTERS_TXT = "chapters-en.txt"
E.MANIFEST_GLOBAL = "BEDTIME_MANIFEST_EN"
E.AUDIO_URL = "data/bedtime/audio-en/"

E.TITLE = "The Grand Line of Sleep"
E.SUBTITLE = "DSA Bedtime Voyage — English"
E.MONOLITH_NAME = "dsa-bedtime-en-full"
E.CHAPTERS_HEADING = "Chapter list"

# ---------------------------------------------------------------------------
# The voices
# ---------------------------------------------------------------------------
NARRATOR = "en-US-BrianNeural"

E.VOICE = NARRATOR
E.RATE = "-32%"
E.PITCH = "-2Hz"
E.VOLUME = "-12%"

E.MODE_PROFILE["bedtime"].update(rate=E.RATE, pitch=E.PITCH, volume=E.VOLUME,
                                 space_lists=False)
E.MODE_PROFILE["drive"].update(rate="-21%", pitch="+0Hz", volume="+0%")

# The engine's mode and tier labels are Nepali, with an English label_en beside
# each. This edition is read in English and the player prints `label`, so the
# two are collapsed — otherwise switching to English gave English chapter titles
# under Nepali tier buttons, which is worse than either language alone.
E.MODE_PROFILE["bedtime"]["label"] = E.MODE_PROFILE["bedtime"]["label_en"]
E.MODE_PROFILE["drive"]["label"] = E.MODE_PROFILE["drive"]["label_en"]
E.TIER_LABELS = dict(E.TIER_LABELS_EN)

# The crew. `rate` and `pitch` here are offsets in percentage points and Hz on
# top of whichever mode is being rendered, so `+5.0` on Luffy means he reads at
# -27% while the narrator reads at -32%.
#
# The offsets are small, and deliberately much smaller than the Nepali
# edition's ±16 Hz, because they are no longer doing the work of telling the
# characters apart — the voices themselves are already 100 Hz apart end to end.
# What the offsets do here is fix the two things a stock voice gets wrong for a
# character: how fast they talk, and how much room they take up.
E.STYLES.update({
    # Loud, fast, uncomplicated. The only crew member who is allowed to be
    # louder than the narrator.
    "luffy":   {"voice": "en-US-GuyNeural",
                "rate": +5.0, "pitch": +3.0, "gain": +1.0},
    # Lowest voice on the ship, and the slowest: Zoro's lines here are all
    # short and flat, and the pauses are the character.
    "zoro":    {"voice": "en-US-EricNeural",
                "rate": -4.0, "pitch": -2.0, "gain": +0.0},
    # Brisk and bright. Pushed down and quietened a little, because Aria is the
    # highest adult voice in the cast and Nami has twenty-six lines.
    "nami":    {"voice": "en-US-AriaNeural",
                "rate": +3.0, "pitch": -3.0, "gain": -0.5},
    # Animated, always slightly over-selling it.
    "usopp":   {"voice": "en-US-RogerNeural",
                "rate": +5.0, "pitch": +4.0, "gain": +0.5},
    # Smooth and unhurried — the one who is never in a rush.
    "sanji":   {"voice": "en-US-ChristopherNeural",
                "rate": -1.0, "pitch": +0.0, "gain": +0.5},
    # Big and boxy. Steffan is a mid voice pushed well down and up in level,
    # which is the shape of somebody built out of scrap metal.
    "franky":  {"voice": "en-US-SteffanNeural",
                "rate": +2.0, "pitch": -8.0, "gain": +2.0},
    # Calm, low, and the most-heard character in the story at fifty lines. The
    # flattest female voice measured, pushed lower still.
    "robin":   {"voice": "en-US-MichelleNeural",
                "rate": -5.0, "pitch": -6.0, "gain": -1.5},
    # Ana is a child voice at 291 Hz, which is the right character and the
    # wrong thing to have happen suddenly at two in the morning. Damped hard —
    # 25 Hz down and four decibels quiet — and it is three lines in the whole
    # voyage. This is the one casting choice to check by ear.
    "chopper": {"voice": "en-US-AnaNeural",
                "rate": -2.0, "pitch": -25.0, "gain": -4.0},
})

# ---------------------------------------------------------------------------
# Sentences
# ---------------------------------------------------------------------------
#
# The engine splits on the danda. English sentences end in a full stop, and
# without this the whole paragraph is one clip with no pauses in it — which is
# the reading this voyage exists to avoid. Same three overrides as the ACLS
# profile, and for the same reasons; see its docstring.
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
# Replaces rather than wraps the engine's version: that one respells English
# into Devanagari, and there is no Nepali voice in this edition. All that is
# left to do is turn notation into words.
def to_speakable(text, space_lists=True):
    text = dsa_words_en.to_spoken(text)
    for mark, punct in E.BEATS.items():
        text = text.replace(mark, punct)
    return re.sub(r"\s{2,}", " ", text).strip()


E.to_speakable = to_speakable

# The bed and the scenes are the Nepali edition's, unchanged: same story, same
# islands, same seven ambience loops. A listener who plays both editions
# downloads the bed once.

if __name__ == "__main__":
    E.main()
