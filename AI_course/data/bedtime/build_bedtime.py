#!/usr/bin/env python3
"""Build "निद्राको पोनेग्लिफ" — the AI Engineer course's Nepali bedtime voyage.

Robin spends the whole series reading stones nobody else can read. That is what
this course is about — teaching a machine to read meaning out of marks — so the
voyage is named for the Poneglyphs, and the chapters walk the syllabus in order:
the arrows and the arithmetic first, then learning from data, then the network,
then attention, then the models themselves, and finally the agents built on top.

Everything that makes a bedtime render work — the tiers, the @algo/@recall
repetition, the silences, the split ambience bed, the manifest — lives in the
DSA course's build_bedtime.py. This file is only the parts that are this
course's own: where its script lives, what voice reads it, which words it says
that no other voyage says, and where each chapter happens.

Build (from this directory):
    python3 check_bedtime.py                 # always first — it is free
    python3 build_bedtime.py --split-bed     # incremental; reuses cached parts
    python3 build_bedtime.py --only 03,04    # rebuild just those chapters

See ../../../DSA_tool/data/bedtime/build_bedtime.py for every flag.
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

    Two of the files here share a name with the engine's, so anything that makes
    this directory win an import is a trap: `import check_bedtime` would then
    find the wrapper instead of the linter it wraps.
    """
    spec = importlib.util.spec_from_file_location(
        "ai_bedtime_" + name, os.path.join(HERE, name + ".py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


ai_words = _sibling("ai_words")

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

E.TITLE = "निद्राको पोनेग्लिफ"
E.SUBTITLE = "AI Engineer Bedtime Voyage"
E.MONOLITH_NAME = "ai-nidra-full"

# ---------------------------------------------------------------------------
# The voice
# ---------------------------------------------------------------------------
#
# Hemkala, as in the DSA voyage, rather than Sagar as in the Java one. This
# course leans on the same long mathematical passages the DSA story does —
# gradients, entropy, attention — and that reading was tuned against her.
E.VOICE = "ne-NP-HemkalaNeural"
E.RATE = "-22%"
E.PITCH = "-6Hz"
E.VOLUME = "-12%"

E.MODE_PROFILE["bedtime"].update(rate=E.RATE, pitch=E.PITCH, volume=E.VOLUME)
E.MODE_PROFILE["drive"].update(rate="-6%", pitch="+0Hz", volume="+0%")

# ---------------------------------------------------------------------------
# Vocabulary
# ---------------------------------------------------------------------------
#
# The engine's to_speakable() runs the shared table (ne_pronounce) over every
# clip. This course's own words go in *first*, so that where both tables know a
# term — "value" is a hash-map value in the DSA voyage and an expected value
# here — this course's spelling wins.
_engine_to_speakable = E.to_speakable


def to_speakable(text, space_lists=True):
    return _engine_to_speakable(ai_words.to_devanagari(text),
                                space_lists=space_lists)


E.to_speakable = to_speakable

# ---------------------------------------------------------------------------
# Where each chapter happens
# ---------------------------------------------------------------------------
#
# Keyed by the NN in script/NN-slug.txt, and every value has to be one of the
# twelve scene names the shared bed knows — bed.json carries the per-scene layer
# gains, and a name it has never heard of would come out silent in the browser.
#
# The shape of the voyage: the mathematics is read under the open sky and on the
# cliffs, where things are still; learning from data happens on deck and at the
# workbench, where things are made; the network chapters go below and into the
# dark; and the last stretch — retrieval, then agents, then the Poneglyph
# itself — comes back through the cave to the harbour.
soundscape.SCENES = {
    0:  "harbour_night",   # प्रस्तावना — the map: AI, ML, DL, LLM, agents
    1:  "night_sky",       # vectors, dot product, cosine — arrows among stars
    2:  "workshop",        # matrices as machines that bend space
    3:  "cliff",           # eigenvectors — the one direction that does not turn
    4:  "island_shore",    # calculus, chain rule, gradient descent — downhill
    5:  "open_sea",        # probability — the weather
    6:  "cabin",           # statistics and MLE — Nami's chart table
    7:  "night_sky",       # information theory — surprise, entropy, perplexity
    8:  "deck",            # learning vs memorising, bias and variance
    9:  "workshop",        # linear regression from scratch
    10: "workshop",        # logistic regression and classification
    11: "ship_hold",       # text as numbers — bag of words, TF-IDF
    12: "forest",          # k-NN, decision trees, random forests
    13: "island_shore",    # k-means and PCA — grouping with no labels
    14: "cabin",           # evaluation — precision, recall, F1, ROC
    15: "workshop",        # perceptron to MLP
    16: "cave",            # backpropagation — walking the blame backwards
    17: "open_sea",        # training dynamics — optimizers, batches, dropout
    18: "workshop",        # PyTorch — tensors, autograd, the loop
    19: "forest",          # CNNs and RNNs, and why sequences broke everything
    20: "ship_hold",       # tokenization — words into pieces
    21: "night_sky",       # embeddings — the geometry of meaning
    22: "deck",            # seq2seq and the birth of attention
    23: "cliff",           # self-attention — Q, K, V, the full math
    24: "cabin",           # the transformer, layer by layer; BERT vs GPT
    25: "workshop",        # building a mini-GPT
    26: "open_sea",        # pretraining, scaling laws, distributed training
    27: "workshop",        # fine-tuning — SFT, LoRA, QLoRA
    28: "harbour_day",     # alignment — RLHF, reward models, DPO
    29: "deck",            # inference — sampling, KV cache, quantization
    30: "cave",            # embeddings, vector databases, RAG — the archive
    31: "island_shore",    # agents — tools, ReAct, memory, guardrails
    32: "harbour_night",   # system design, and goodnight
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
# the page — AI_course/bedtime.html — not against this directory.
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
