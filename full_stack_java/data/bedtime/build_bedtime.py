#!/usr/bin/env python3
"""Build "निद्राको लग पोज" — the Java course's Nepali bedtime voyage.

Twenty-eight chapters that carry the whole full-stack Java syllabus, in order,
from `javac` to the LogPose capstone, told as one continuous night at sea.

This file is a *course profile*, not an engine. Everything about how the audio
is made — the two listening modes, the three cumulative story lengths, the
sentence-per-clip bedtime read against the paragraph-per-clip driving read, the
clip cache keyed on spoken text, the @algo/@recall repetition, the split-bed
render — already exists in DSA_tool/data/bedtime/build_bedtime.py and is
imported here rather than copied. What is course-specific is small and all of
it is below: the voice, the reading profile for that voice, which place each
chapter happens in, and the Java vocabulary.

Two deliberate departures from the DSA voyage:

  * **A male voice.** ne-NP-SagarNeural, at -20% / -3Hz rather than -22% / -6Hz.
    Sagar starts lower than Hemkala, so the DSA pitch offset applied on top of
    him lands boomy — low enough that consonants start to smear, which is the
    one thing a technical bedtime read cannot afford.

  * **The bed is not rendered again.** The seven ambience loops under the DSA
    voyage are 0.61 MB and never change, so this course points at them instead
    of shipping its own copy. A listener who plays both courses downloads them
    once. See bed_manifest_block() below.

Usage is the engine's, from this directory:

    python3 check_bedtime.py                  # lint first, always
    python3 build_bedtime.py --split-bed      # full render, both modes
    python3 build_bedtime.py --split-bed --only 07,08
    python3 build_bedtime.py --split-bed --reuse   # resume an interrupted run
"""
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, *[".."] * 3))
ENGINE_DIR = os.path.join(ROOT, "DSA_tool", "data", "bedtime")

# Ahead of everything else, so `import soundscape` *inside* the engine resolves
# to the engine's own soundscape module — and so that a script run from *this*
# directory still gets the engine's `build_bedtime` and `check_bedtime` rather
# than the same-named files sitting next to it.
sys.path.insert(0, ENGINE_DIR)
import build_bedtime as E  # noqa: E402  — needs the path set above
import soundscape  # noqa: E402


def _sibling(name):
    """Import a module from this directory without putting it on sys.path.

    Two of the four files here share a name with the engine's, so anything that
    makes this directory win an import is a trap: `import check_bedtime` would
    then find the wrapper instead of the linter it wraps.
    """
    spec = importlib.util.spec_from_file_location(
        "fsj_bedtime_" + name, os.path.join(HERE, name + ".py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


java_words = _sibling("java_words")

# ---------------------------------------------------------------------------
# Where this course keeps its things
# ---------------------------------------------------------------------------
#
# The engine derives all of these from its own HERE at import time, so they are
# rebound here before anything reads them. Nothing else in it holds a path.
E.HERE = HERE
E.SCRIPT_DIR = os.path.join(HERE, "script")
E.PARTS_DIR = os.path.join(HERE, "parts")
E.AUDIO_DIR = os.path.join(HERE, "audio")
E.INDEX_PATH = os.path.join(E.PARTS_DIR, "_index.json")

E.TITLE = "निद्राको लग पोज"
E.SUBTITLE = "Full-Stack Java Bedtime Voyage"
E.MONOLITH_NAME = "java-nidra-full"

# ---------------------------------------------------------------------------
# The voice
# ---------------------------------------------------------------------------
E.VOICE = "ne-NP-SagarNeural"
# This voyage narrates in the male Nepali voice, so it gives back the engine's
# crew casting: casting the male crew on the voice already reading the
# narration would make Luffy, Zoro, Usopp and Sanji into the narrator at a
# different pitch. Without this they are shaded off Sagar, which is what this
# voyage has always sounded like — every character here has always fallen back
# to E.VOICE.
#
# Worth revisiting: Nami and Robin could be cast on Hemkala, which would give
# this voyage a genuine second speaker the way the DSA one now has. That is a
# re-render, so it is not done here.
E.unset_crew_voices()
E.RATE = "-20%"
E.PITCH = "-3Hz"
E.VOLUME = "-12%"

E.MODE_PROFILE["bedtime"].update(rate=E.RATE, pitch=E.PITCH, volume=E.VOLUME)
# Driving mode keeps the engine's timings; only the pitch floor moves, for the
# same reason as above.
E.MODE_PROFILE["drive"].update(rate="-6%", pitch="+0Hz", volume="+0%")

# ---------------------------------------------------------------------------
# Vocabulary
# ---------------------------------------------------------------------------
#
# The engine's to_speakable() runs the shared table (ne_pronounce) over every
# clip. Java's two hundred extra words go in *first*, so that where both tables
# know a word — "map" is a Hash Map in the DSA voyage and also `Map`,
# `HashMap` and `.map()` here — this course's spelling wins.
_engine_to_speakable = E.to_speakable


def to_speakable(text, space_lists=True):
    return _engine_to_speakable(java_words.to_devanagari(text),
                                space_lists=space_lists)


E.to_speakable = to_speakable

# ---------------------------------------------------------------------------
# Where each chapter happens
# ---------------------------------------------------------------------------
#
# Keyed by the NN in script/NN-slug.txt, and every value has to be a scene name
# the shared bed knows — bed.json carries the per-scene layer gains, and a name
# it has never heard of would come out silent in the browser.
#
# The shape of the voyage: the language chapters are aboard the ship, the JVM
# chapters are below decks in the engine room, the collections chapters are in
# the hold and the cabin where things are kept and found, concurrency is up on
# deck where many hands work at once, and the last stretch — search, then the
# Log Pose itself — comes back to harbour.
soundscape.SCENES = {
    0:  "harbour_night",   # प्रस्तावना — the ship at anchor, settling in
    1:  "workshop",        # JDK, JRE, JVM and the first program
    2:  "workshop",        # types and variables
    3:  "deck",            # control flow and methods
    4:  "workshop",        # classes and objects
    5:  "cabin",           # inheritance and polymorphism
    6:  "cabin",           # interfaces
    7:  "open_sea",        # exceptions — the storm
    8:  "ship_hold",       # strings, equals and hashCode
    9:  "ship_hold",       # JVM architecture — the engine room
    10: "ship_hold",       # memory and garbage collection
    11: "workshop",        # the toolbox: javap, JFR, profiling
    12: "cabin",           # generics
    13: "ship_hold",       # lists and the collections framework
    14: "cabin",           # maps — Nami's chart table
    15: "deck",            # sets, queues and deques
    16: "deck",            # lambdas
    17: "open_sea",        # streams — the current
    18: "cabin",           # records, sealed types, pattern matching, java.time
    19: "deck",            # threads
    20: "deck",            # executors, futures, virtual threads
    21: "workshop",        # Maven
    22: "workshop",        # testing
    23: "ship_hold",       # SQL, JDBC, JPA
    24: "island_shore",    # HTTP, REST and Spring
    25: "harbour_day",     # frontend, JavaFX, packaging
    26: "cave",            # search — Lucene and embeddings
    27: "harbour_night",   # LogPose, and goodnight
}


# ---------------------------------------------------------------------------
# The bed
# ---------------------------------------------------------------------------
#
# Rendered ambience is not shipped at all (--split-bed), so the only thing this
# course needs from the bed is its manifest block: the loop names and where the
# browser can fetch them. Both come from the DSA build's exported bed, which is
# the one copy of those seven files on the site.
#
# The path is written the way bedtime.html consumes it. That page prefixes
# `data/bedtime/` and strips that same prefix if the manifest already carries
# it, so a path starting `../` is passed through untouched and resolves against
# the page — full_stack_java/bedtime.html — not against this directory.
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
