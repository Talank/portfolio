#!/usr/bin/env python3
"""Cut the ambience loops down into deployable bed assets.

The old pipeline baked the bed into every rendered segment, which is why those
segments needed 28 kbps: opus was spending most of its budget describing surf
that never changes. Narration alone fits in 16 kbps at the same quality (49% of
the file — measured, not guessed). So the bed stops being audio-per-hour and
becomes audio-per-site: seven short loops, downloaded once, layered live by
shared/bed-engine.js.

Two things this has to get right.

**Seamlessness.** fetch_ambience.py already produced loops that join cleanly at
their own length; slicing a shorter piece out of one breaks that. Each output is
therefore built as body + a crossfade of its own tail back over its own head, so
the last CROSSFADE seconds fade into what the first CROSSFADE seconds fade out
of, and the join is inaudible however many times it repeats.

**Not sounding like a loop.** A 30-second wave loop is obvious within a minute.
Three things fight that: every layer gets a different, near-coprime length, so
the composite pattern is the lowest common multiple of seven odd numbers rather
than any one of them; the engine enters each layer at a random phase; and it
detunes each by a fraction of a percent, which slides them apart continuously.
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

FFMPEG = ("/home/tbaral/.local/lib/python3.10/site-packages/imageio_ffmpeg/"
          "binaries/ffmpeg-linux-x86_64-v7.0.2")

# Deliberately near-coprime, and none a multiple of another. Seven layers at
# these lengths realign every ~4.6e10 seconds, which is to say never.
LOOP_SECONDS = {
    "waves":  41,
    "wind":   37,
    "creak":  43,
    "water":  31,
    "foam":   29,
    "leaves": 23,
    "gulls":  19,
}

# The bed plays in its own 24 kHz context: it is surf, wind and timber, none of
# which has anything above 12 kHz worth spending bits on, and halving the rate
# halves the decoded footprint on a phone.
SR = 24000
XFADE = 2.0     # seconds of loop-closing crossfade
BITRATE = "24k"

# --- the background bed -----------------------------------------------------
# Everything above is mixed live by shared/bed-engine.js, which needs an
# AudioContext, and a phone browser suspends the AudioContext the moment the
# page stops being visible. The narration survives that because it plays through
# an <audio> element and the browser treats it as media; the bed does not.
#
# So there is one more file: a single pre-mixed loop that an <audio> element can
# play natively, which the engine fades in whenever it catches the context
# frozen. It is not per scene on purpose. It plays only when the screen is off
# or the browser is behind something else, when the whole point is that nothing
# changes and nothing wakes you, and one file is a tenth of the bytes of twelve.
#
# Its mix is the average of the twelve scenes weighted by how many chapters use
# each, so it sounds like the voyage rather than like any one place in it.
NIGHT_SECONDS = 47
NIGHT_BITRATE = "16k"   # a bed heard through a pocket, under a voice


def read_pcm(path, sr):
    """Decode to mono float32 at `sr`."""
    out = subprocess.run(
        [FFMPEG, "-v", "error", "-i", path,
         "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"],
        check=True, stdout=subprocess.PIPE).stdout
    return np.frombuffer(out, dtype="<f4").copy()


def write_opus(samples, path, sr, bitrate):
    p = subprocess.Popen(
        [FFMPEG, "-y", "-v", "error",
         "-f", "f32le", "-ac", "1", "-ar", str(sr), "-i", "-",
         "-c:a", "libopus", "-b:a", bitrate, "-ac", "1",
         "-application", "audio", "-vbr", "on", path],
        stdin=subprocess.PIPE)
    p.communicate(samples.astype("<f4").tobytes())
    if p.returncode:
        raise RuntimeError(f"encode failed for {path}")


def close_loop(x, sr, seconds, xfade):
    """Return `seconds` of x that joins seamlessly to itself.

    Takes body = x[0 : L] and tail = x[L : L+X], then crossfades the tail back
    over the head of the body. The result's last X seconds and its first X
    seconds are two halves of the same continuous stretch of the recording, so
    playing it end to end has no discontinuity in level or in phase.
    """
    n = int(seconds * sr)
    nx = int(xfade * sr)
    if len(x) < n + nx:
        # Recording shorter than asked for: repeat it until it is long enough.
        # It already loops at its own length, so this adds no new seam.
        reps = int(np.ceil((n + nx) / len(x)))
        x = np.tile(x, reps)
    body = x[:n].copy()
    tail = x[n:n + nx]
    ramp = np.linspace(0.0, 1.0, nx, dtype="f4")
    # equal-power, so the sum holds a constant level through the join rather
    # than dipping in the middle the way a linear crossfade does
    body[:nx] = body[:nx] * np.sqrt(ramp) + tail * np.sqrt(1.0 - ramp)
    return body


def night_gains(soundscape):
    """One gain per layer: the scene mix averaged over the whole voyage.

    Weighted by chapter count rather than by scene, so six chapters at open sea
    pull the blend six times as hard as the one in the cave. The result is a
    quiet night at sea with a little timber and wind in it, which is what most
    of the book sounds like anyway.
    """
    counts = {}
    for scene in soundscape.SCENES.values():
        counts[scene] = counts.get(scene, 0) + 1
    total = float(sum(counts.values())) or 1.0
    gains = []
    for i, name in enumerate(soundscape.LAYER_NAMES):
        mean = sum(soundscape.SCENE_GAINS[s][i] * n for s, n in counts.items()) / total
        # Bake the ceiling in too: the engine applies scene x ceiling to each
        # live layer, so a file carrying both plays back at the same level the
        # live bed sits at, and the element's own volume can stay the master.
        gains.append(mean * soundscape.LAYER_CEILING[name])
    return gains


def build_night(src, out, soundscape, bitrate):
    """Mix the layers down to one self-closing loop for background playback."""
    gains = night_gains(soundscape)
    mix = np.zeros(int(NIGHT_SECONDS * SR), dtype="f4")
    used = 0
    for i, name in enumerate(soundscape.LAYER_NAMES):
        path = os.path.join(src, name + ".opus")
        if gains[i] <= 0 or not os.path.exists(path):
            continue
        x = read_pcm(path, SR)
        # Enter each layer at a different point in its recording. The sources
        # already loop at their own length, so rotating one is seamless, and it
        # keeps this file from being the first 47 seconds of everything at once.
        off = int((i * 11 * SR) % len(x))
        if off:
            x = np.concatenate([x[off:], x[:off]])
        mix += close_loop(x, SR, NIGHT_SECONDS, XFADE) * gains[i]
        used += 1
        print(f"  {name:8s} x {gains[i]:.4f}")

    peak = float(np.max(np.abs(mix))) if used else 0.0
    if peak > 0.95:
        mix *= 0.95 / peak
        print(f"  peak {peak:.2f} -> trimmed to 0.95")
    dst = os.path.join(out, "night.opus")
    write_opus(mix, dst, SR, bitrate)
    size = os.path.getsize(dst)
    print(f"  night    {used} layers  {NIGHT_SECONDS}s  peak {peak:.3f}  "
          f"{size / 1024:.0f} KB")
    return {"file": "night", "seconds": NIGHT_SECONDS}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--src", required=True, help="dir holding the full loops")
    ap.add_argument("--out", required=True, help="dir to write bed assets to")
    ap.add_argument("--bitrate", default=BITRATE)
    ap.add_argument("--night-bitrate", default=NIGHT_BITRATE)
    ap.add_argument("--night-only", action="store_true",
                    help="rebuild only the background loop, and patch the "
                         "existing bed.json instead of rewriting it")
    args = ap.parse_args()

    if args.night_only:
        sys.path.insert(0, os.path.abspath(args.src + "/.."))
        import soundscape  # noqa: E402
        meta_path = os.path.join(args.out, "bed.json")
        with open(meta_path, encoding="utf-8") as f:
            meta = json.load(f)
        meta["fallback"] = build_night(args.src, args.out, soundscape,
                                       args.night_bitrate)
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))
        return

    os.makedirs(args.out, exist_ok=True)
    # soundscape.py owns the scene/layer model; import it so there is exactly
    # one definition of what the bed is and the engine cannot drift from it.
    sys.path.insert(0, os.path.abspath(args.src + "/.."))
    import soundscape  # noqa: E402

    meta = {
        "sr": SR,
        "crossfade": soundscape.CROSSFADE,
        "layers": [],
        "scenes": {k: list(v) for k, v in soundscape.SCENE_GAINS.items()},
        "ceiling": dict(soundscape.LAYER_CEILING),
        "chapterScene": {str(k): v for k, v in soundscape.SCENES.items()},
    }

    total_in = total_out = 0
    for name in soundscape.LAYER_NAMES:
        src = os.path.join(args.src, name + ".opus")
        if not os.path.exists(src):
            print(f"  {name:8s} no recording, engine will skip this layer")
            continue
        total_in += os.path.getsize(src)
        x = read_pcm(src, SR)
        secs = LOOP_SECONDS[name]
        loop = close_loop(x, SR, secs, XFADE)
        dst = os.path.join(args.out, name + ".opus")
        write_opus(loop, dst, SR, args.bitrate)
        size = os.path.getsize(dst)
        total_out += size
        meta["layers"].append({"name": name, "seconds": secs})
        print(f"  {name:8s} {len(x) / SR:6.1f}s -> {secs:3d}s   "
              f"{os.path.getsize(src) / 1024:6.0f} KB -> {size / 1024:5.0f} KB")

    meta["fallback"] = build_night(args.src, args.out, soundscape,
                                   args.night_bitrate)

    with open(os.path.join(args.out, "bed.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))

    decoded = sum(LOOP_SECONDS[l["name"]] for l in meta["layers"]) * SR * 4
    print(f"\n  {len(meta['layers'])} layers   "
          f"{total_in / 1e6:.2f} MB -> {total_out / 1e6:.2f} MB on the wire   "
          f"{decoded / 1e6:.0f} MB decoded if every layer is resident")


if __name__ == "__main__":
    main()
