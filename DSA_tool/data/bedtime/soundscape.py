#!/usr/bin/env python3
"""A scene-following ambient bed for the bedtime voyage.

The first version of this audio was a single brown-noise surf loop under a dry
voice, which read as "someone reading in a quiet room" rather than a place. This
builds an actual soundscape instead: seven synthesized layers whose levels move
with the story, so the chapters set at sea sound like the sea, the tree chapters
sound like a forest, and the labyrinth sounds like a cave.

Each layer is a real field recording when one is available. `fetch_ambience.py`
downloads CC0/CC-BY recordings of surf, wind, leaves and streams, screens out
anything containing speech, music or sudden events, and cuts each into a short
seamless loop under ambience/. If those loops are absent the layers fall back to
the filtered-noise synthesis below, so the build still works with no network and
no API key — it just sounds less like a real beach.

The loops are build inputs only. The site serves one file, and its size is set
by the opus encoder, not by where the bed came from.

The layers:
    waves   brown noise under a low-pass; two detuned tremolos beat against each
            other so the swell never lands on an obvious loop
    foam    band-passed hiss, the break at the top of a wave
    wind    low, wide noise with slow gusts
    leaves  brighter noise, quicker irregular rustle
    water   mid-band burble for streams, drips and hull-lapping

There is deliberately no tonal layer. An earlier version added a chord of quiet
detuned sines for body, and FM-synthesized gull cries; both were audibly
manufactured — a sustained low sine bed is exactly the "alpha wave" texture this
audio should not have. Every layer here is either a recording of the real thing
or filtered noise, which is what surf, wind, rain and rustling leaves physically
are, so nothing is imitating a pitch it does not have.

Level automation is done with one `volume` expression per layer rather than by
crossfading 27 rendered segments: adjacent chapter windows ramp linearly and
overlap exactly, so they sum to a constant and the scene changes are seamless.
"""
import os

# Seconds of overlap between one chapter's ambience and the next. Long, because
# a scene change you can notice is a scene change that wakes you up.
CROSSFADE = 20.0

# Which place each chapter happens in. Keyed by the NN in script/NN-slug.txt.
SCENES = {
    0:  "harbour_night",   # प्रस्तावना — settling in, ship at anchor
    1:  "workshop",        # programming basics — Usopp's bench
    2:  "open_sea",        # Big-O — the map and the long crossing
    3:  "ship_hold",       # arrays & strings — the storeroom
    4:  "cabin",           # hash map — Nami's notebook
    5:  "deck",            # two pointers — two swords on deck
    6:  "open_sea",        # sliding window
    7:  "open_sea",        # prefix sum
    8:  "island_shore",    # binary search — halving the island
    9:  "deck",            # linked list — the rigging
    10: "open_sea",        # fast & slow pointers
    11: "ship_hold",       # stack
    12: "ship_hold",       # monotonic stack
    13: "deck",            # queue & deque
    14: "forest",          # tree DFS/BFS
    15: "forest",          # BST
    16: "cliff",           # heap — the crow's nest, the highest pearl
    17: "island_shore",    # graphs — the web of islands
    18: "open_sea",        # topological sort
    19: "cave",            # backtracking — the labyrinth
    20: "cabin",           # DP part 1 — the power of memory
    21: "cabin",           # DP part 2
    22: "harbour_day",     # greedy — the market, choosing now
    23: "open_sea",        # merge intervals
    24: "forest",          # trie — the tree of letters
    25: "night_sky",       # bit manipulation — zeros and ones, very still
    26: "harbour_night",   # recap and goodnight
}

# Per-scene mix. Values are relative gains, 0..1, applied to each layer.
SCENE_GAINS = {
    #                 waves foam  wind  leaves water
    "harbour_night": (0.50, 0.12, 0.26, 0.00, 0.34),
    "harbour_day":   (0.55, 0.22, 0.32, 0.10, 0.28),
    "open_sea":      (1.00, 0.50, 0.50, 0.00, 0.00),
    "deck":          (0.80, 0.34, 0.46, 0.00, 0.00),
    "ship_hold":     (0.34, 0.05, 0.16, 0.00, 0.30),
    "cabin":         (0.26, 0.00, 0.18, 0.00, 0.24),
    "island_shore":  (0.70, 0.48, 0.34, 0.20, 0.20),
    "forest":        (0.00, 0.00, 0.52, 0.60, 0.26),
    "cliff":         (0.40, 0.15, 0.90, 0.10, 0.00),
    "cave":          (0.16, 0.00, 0.24, 0.00, 0.56),
    "night_sky":     (0.22, 0.00, 0.34, 0.14, 0.12),
    "workshop":      (0.30, 0.00, 0.26, 0.14, 0.14),
}

LAYER_NAMES = ("waves", "foam", "wind", "leaves", "water")

# Absolute ceiling for each layer once its scene gain is applied. These are what
# actually keep the bed under the voice; the scene gains only shape the balance.
LAYER_CEILING = {
    "waves":  0.150,
    "foam":   0.035,
    "wind":   0.095,
    "leaves": 0.050,
    "water":  0.065,
}


AMB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ambience")


def _loop(name):
    """Path to this layer's field-recording loop, or None to fall back."""
    p = os.path.join(AMB_DIR, f"{name}.opus")
    return p if os.path.exists(p) else None


def recordings_available():
    """How many layers have a real recording behind them."""
    return sum(1 for n in LAYER_NAMES if _loop(n))


def _esc(expr):
    """Escape an ffmpeg expression for use inside a filtergraph argument.

    Commas separate filters in a graph, so any comma belonging to a function
    call has to be escaped or ffmpeg splits the filter in the wrong place.
    """
    return expr.replace(",", "\\,")


def _sources(sr):
    """The lavfi source string for each layer, before level automation."""
    # Two tremolos at close rates beat together: the swell peaks drift instead of
    # arriving every N seconds, which is what makes a loop audible.
    waves = (f"anoisesrc=c=brown:r={sr}:a=0.85,"
             "lowpass=f=380,highpass=f=38,"
             "tremolo=f=0.1:d=0.62,tremolo=f=0.13:d=0.34")

    foam = (f"anoisesrc=c=white:r={sr}:a=0.55,"
            "highpass=f=1400,lowpass=f=6200,"
            "tremolo=f=0.11:d=0.72,tremolo=f=0.17:d=0.42")

    wind = (f"anoisesrc=c=brown:r={sr}:a=0.80,"
            "lowpass=f=720,highpass=f=70,"
            "tremolo=f=0.1:d=0.55,tremolo=f=0.14:d=0.30")

    leaves = (f"anoisesrc=c=white:r={sr}:a=0.45,"
              "highpass=f=900,lowpass=f=4200,"
              "tremolo=f=0.3:d=0.6,tremolo=f=0.73:d=0.35")

    water = (f"anoisesrc=c=pink:r={sr}:a=0.55,"
             "highpass=f=280,lowpass=f=2400,"
             "tremolo=f=0.25:d=0.38,tremolo=f=0.41:d=0.22")

    return {"waves": waves, "foam": foam, "wind": wind, "leaves": leaves,
            "water": water}


def _runs(marks, total):
    """Merge consecutive chapters that share a scene into (start, end, scene)."""
    spans = []
    for i, m in enumerate(marks):
        start = m["start"]
        end = marks[i + 1]["start"] if i + 1 < len(marks) else total
        scene = SCENES.get(int(m["num"]), "open_sea")
        if spans and spans[-1][2] == scene:
            spans[-1] = (spans[-1][0], end, scene)
        else:
            spans.append((start, end, scene))
    return spans


def _envelope(layer_idx, spans, total):
    """A volume expression tracking this layer's gain across the whole voyage.

    Each span contributes a trapezoid that ramps up over CROSSFADE centred on
    its start and down over CROSSFADE centred on its end. Neighbouring spans
    share a boundary, so their ramps overlap exactly and sum to 1 — the level
    slides from one scene's gain to the next with no seam and no dip.
    """
    half = CROSSFADE / 2.0
    terms = []
    for start, end, scene in spans:
        gain = SCENE_GAINS[scene][layer_idx]
        if gain <= 0:
            continue
        a, b = start - half, end + half
        # Parenthesise the offsets: the first span starts before t=0, and an
        # unparenthesised negative would render as "t--10.00".
        up = f"min(1,max(0,(t-({a:.2f}))/{CROSSFADE:.2f}))"
        down = f"min(1,max(0,(({b:.2f})-t)/{CROSSFADE:.2f}))"
        terms.append(f"{gain:.3f}*{up}*{down}")
    if not terms:
        return "0"
    return "min(1," + "+".join(terms) + ")"


def build(marks, total, sr, lead_in, tail):
    """Return (input_args, filter_chunks, mix_labels) for the ambience layers.

    The caller adds its narration input first, so layer inputs start at index 1.
    """
    spans = _runs(marks, total)
    srcs = _sources(sr)

    inputs, chunks, labels = [], [], []
    for i, name in enumerate(LAYER_NAMES):
        loop = _loop(name)
        if loop:
            # -stream_loop repeats the loop for as long as the mix needs. Each
            # layer's loop is a different prime length, so the five of them
            # never realign and the bed has no audible period.
            inputs += ["-stream_loop", "-1", "-t", f"{total:.2f}", "-i", loop]
        else:
            # Decided per layer rather than all-or-nothing: if one layer has no
            # usable recording, synthesizing just that one is far better than
            # throwing away the four real ones. fetch_ambience.py normalizes
            # every loop to the RMS of the noise it replaces, so the two kinds
            # sit at the same level and the scene gains stay valid either way.
            inputs += ["-f", "lavfi", "-t", f"{total:.2f}", "-i", srcs[name]]
        env = _envelope(i, spans, total)
        ceiling = LAYER_CEILING[name]
        # eval=frame so the expression is re-evaluated as time advances; the
        # default (eval=once) would freeze every layer at its t=0 level.
        # opus always decodes at 48 kHz whatever it was encoded at, so resample
        # explicitly rather than relying on amix's auto-negotiation.
        chunks.append(
            f"[{i + 1}:a]aformat=sample_fmts=fltp:sample_rates={sr}:"
            f"channel_layouts=mono,"
            f"volume=volume='{_esc(env)}':eval=frame,"
            f"volume={ceiling:.3f},"
            f"afade=t=in:st=0:d={lead_in + 5:.2f},"
            f"afade=t=out:st={max(0.0, total - tail):.2f}:d={tail:.2f}"
            f"[a{i}]"
        )
        labels.append(f"[a{i}]")

    return inputs, chunks, labels
