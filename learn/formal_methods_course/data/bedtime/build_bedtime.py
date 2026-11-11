#!/usr/bin/env python3
"""Build "निद्राको प्रमाण टापु" — the Formal Methods & Solvers Bedtime Voyage.

A course profile over the DSA engine (DSA_tool/data/bedtime/build_bedtime.py),
modelled on full_stack_java/data/bedtime/build_bedtime.py. Male narrator
(ne-NP-SagarNeural), shared DSA ambience bed.

    python3 check_bedtime.py                # lint first
    python3 build_bedtime.py --split-bed    # render
"""
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, *[".."] * 4))
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
        "fml_bedtime_" + name, os.path.join(HERE, name + ".py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


words = _sibling("formal_words")

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

E.TITLE = "निद्राको प्रमाण टापु"
E.SUBTITLE = "Formal Methods & Solvers Bedtime Voyage"
E.MONOLITH_NAME = "formal-nidra-full"

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
    return _engine_to_speakable(words.to_devanagari(text),
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
# The shape of the voyage: logic foundations on shores and lantern-lit
# villages, the Z3 chapters up the wizard's tower and down into its cellars,
# program verification in forest, temple and workshop, Lean up the mountain,
# and the last stretch back through a busy harbour to the open deck.
soundscape.SCENES = {
    # FILLED IN PER CHAPTER — keys are the NN of script/NN-slug.txt; values must be
    # one of: harbour_night, workshop, deck, cabin, open_sea, ship_hold,
    # island_shore, harbour_day, cave, forest, cliff
    0: "harbour_night",    # prologue on deck, the map spread out
    1: "island_shore",     # the two paths up from the beach
    2: "harbour_night",    # the village of lanterns at dusk
    3: "open_sea",         # where the two rivers meet the sea
    4: "cliff",            # the wizard's tower
    5: "cave",             # the deep rooms under the tower
    6: "forest",           # the forest whose path keeps forking
    7: "cliff",            # the old temple and its doors
    8: "island_shore",     # the clock-tower island
    9: "workshop",         # Franky's workshop (Dafny)
    10: "cliff",           # the Lean mountain
    11: "forest",          # climbing tools on the mountain path
    12: "island_shore",    # the necklace island (lists, induction)
    13: "harbour_day",     # the great harbour (industry, LLMs)
    14: "deck",            # the last rest, open sea, goodnight
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
BED_DIR = "../../DSA_tool/data/bedtime/bed/"


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
