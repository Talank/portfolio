#!/usr/bin/env python3
"""Build the English edition of "निद्राको पोनेग्लिफ" — the AI Engineer voyage.

Same voyage as the Nepali one: the same thirty-three chapters in the same order,
the same @algo method repeated three times, the same tiers, the same twelve
scenes. What differs is the language, and — because English gives it to us for
free — the cast.

**The Nepali edition is not touched by this file.** It keeps script/, parts/,
audio/, manifest.json and chapters.txt; this one writes script-en/, parts-en/,
audio-en/, manifest-en.json and chapters-en.txt. The two cannot share a
manifest, because English runs shorter than Nepali for the same paragraph and
that moves every chapter offset, so bedtime.html loads both and toggles.

The voice cast, the rate, and the reasoning behind both are the DSA English
edition's — see DSA_tool/data/bedtime/build_bedtime_en.py for the measurements.
Importing them rather than restating them is deliberate: a listener who plays
the DSA voyage and then this one should not meet a different Robin.

Build (from this directory):
    python3 check_bedtime_en.py                  # always first — it is free
    python3 build_bedtime_en.py --split-bed
"""
import importlib.util
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, *[".."] * 3))
ENGINE_DIR = os.path.join(ROOT, "DSA_tool", "data", "bedtime")

sys.path.insert(0, ENGINE_DIR)


def _load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# The Nepali profile first, for everything that is this *course's* rather than
# this *language's*: the scene map, the bed, the engine paths. It rebinds the
# engine's globals as a side effect, and the English overrides below then land
# on top of an engine that is already pointed at this course.
_ne = _load(os.path.join(HERE, "build_bedtime.py"), "ai_bedtime_ne_profile")
E = _ne.E

# The DSA English profile, for everything that is this *language's*: the nine
# voices, their per-character offsets, the rate, and the English sentence
# splitter. Loading it also repoints the engine at the DSA directories, so every
# path this course needs is set again afterwards — order matters here.
_dsa_en = _load(os.path.join(ENGINE_DIR, "build_bedtime_en.py"), "dsa_bedtime_en_profile")

ai_words_en = _load(os.path.join(HERE, "ai_words_en.py"), "ai_words_en")

# ---------------------------------------------------------------------------
# Where this edition keeps its things
# ---------------------------------------------------------------------------
#
# Set last, because loading the DSA English profile above pointed all of these
# at DSA_tool/data/bedtime. Every one has a Nepali counterpart in this same
# directory, and the whole point is that nothing here overwrites one of those.
E.HERE = HERE
E.SCRIPT_DIR = os.path.join(HERE, "script-en")
E.PARTS_DIR = os.path.join(HERE, "parts-en")
E.AUDIO_DIR = os.path.join(HERE, "audio-en")
E.INDEX_PATH = os.path.join(E.PARTS_DIR, "_index.json")

E.MANIFEST_STEM = "manifest-en"
E.CHAPTERS_TXT = "chapters-en.txt"
E.MANIFEST_GLOBAL = "BEDTIME_MANIFEST_EN"
E.AUDIO_URL = "data/bedtime/audio-en/"

E.TITLE = "The Poneglyph of Sleep"
E.SUBTITLE = "AI Engineer Bedtime Voyage — English"
E.MONOLITH_NAME = "ai-bedtime-en-full"
E.CHAPTERS_HEADING = "Chapter list"

# The mode and tier labels the engine ships are Nepali, with an English label_en
# beside each. This edition is read in English and the player prints `label`, so
# the two are collapsed — otherwise the toggle gives English chapter titles under
# Nepali tier buttons, which is worse than either language alone.
E.MODE_PROFILE["bedtime"]["label"] = E.MODE_PROFILE["bedtime"]["label_en"]
E.MODE_PROFILE["drive"]["label"] = E.MODE_PROFILE["drive"]["label_en"]
E.TIER_LABELS = dict(E.TIER_LABELS_EN)

# ---------------------------------------------------------------------------
# Pronunciation
# ---------------------------------------------------------------------------
#
# Replaces the Nepali profile's version outright. That one runs the whole AI
# vocabulary through ai_words.to_devanagari() for a Nepali voice, and there is
# no Nepali voice in this edition. All that is left is turning the acronyms an
# English voice mangles into letters.
def to_speakable(text, space_lists=True):
    text = ai_words_en.to_spoken(text)
    for mark, punct in E.BEATS.items():
        text = text.replace(mark, punct)
    return re.sub(r"\s{2,}", " ", text).strip()


E.to_speakable = to_speakable

# The sentence splitter, the voices and the rate stay exactly as the DSA English
# profile set them; nothing here should differ, and anything that did would be a
# second cast for the same crew.

if __name__ == "__main__":
    E.main()
