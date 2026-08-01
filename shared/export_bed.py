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


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--src", required=True, help="dir holding the full loops")
    ap.add_argument("--out", required=True, help="dir to write bed assets to")
    ap.add_argument("--bitrate", default=BITRATE)
    args = ap.parse_args()

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

    with open(os.path.join(args.out, "bed.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))

    decoded = sum(LOOP_SECONDS[l["name"]] for l in meta["layers"]) * SR * 4
    print(f"\n  {len(meta['layers'])} layers   "
          f"{total_in / 1e6:.2f} MB -> {total_out / 1e6:.2f} MB on the wire   "
          f"{decoded / 1e6:.0f} MB decoded if every layer is resident")


if __name__ == "__main__":
    main()
