#!/usr/bin/env python3
"""Build "निद्राको कम्पाइलर टापु" — the Compilers & Program Analysis Bedtime Voyage.

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
        "cmp_bedtime_" + name, os.path.join(HERE, name + ".py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


words = _sibling("compiler_words")

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

E.TITLE = "निद्राको कम्पाइलर टापु"
E.SUBTITLE = "Compilers & Program Analysis Bedtime Voyage"
E.MONOLITH_NAME = "compilers-nidra-full"

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
# clip. This course's six hundred compiler and analysis words go in *first*, so
# that where both tables know a word this course's spelling wins.
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
# The shape of the voyage: the pipeline chapters are ashore in the workshop and
# on the quay, the three AST chapters are in the forests and the srcML cave,
# lowering comes back to harbour, the IR chapters go below decks, the theory
# chapters run from open sea (dataflow) to the clifftop (abstract
# interpretation), and the analyzers are met on deck before the capstone's
# lighthouse cliff and the night harbour of the goodbye.
soundscape.SCENES = {
    0: "harbour_night",   # prologue
    1: "workshop",        # compiler pipeline
    2: "harbour_day",     # lexing, parsing, precedence climbing
    3: "forest",          # Python ast
    4: "forest",          # Java AST tools
    5: "cave",            # srcML and XPath
    6: "harbour_day",     # three-address code, basic blocks, CFG
    7: "island_shore",    # SSA
    8: "workshop",        # Soot, SootUp, Jimple
    9: "open_sea",        # dataflow and the worklist
    10: "cliff",          # abstract interpretation and widening
    11: "ship_hold",      # pointer analysis and call graphs
    12: "cave",           # taint analysis
    13: "deck",           # Java static analyzers
    14: "deck",           # Python static analyzers
    15: "cliff",          # capstone mini analyzer
    16: "harbour_night",  # goodnight summary
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
