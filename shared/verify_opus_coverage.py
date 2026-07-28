#!/usr/bin/env python3
"""Prove every served .mp3 has a working .opus twin before the mp3s are dropped.

The site serves .opus and keeps .mp3 only as a fallback for browsers that can't
play Ogg Opus. Dropping the fallbacks is worth ~330MB, but only if every opus
actually plays — a missing or truncated one would become silent audio on a live
page rather than a visible error.

So this decodes both files and compares real durations. It never deletes
anything; it prints a verdict and exits non-zero if any clip would be lost.

    python3 shared/verify_opus_coverage.py            # check everything
    python3 shared/verify_opus_coverage.py --list-ok  # print the safe-to-delete list
"""

import argparse
import multiprocessing.pool
import os
import subprocess
import sys

SR = 24000
# mp3 carries encoder padding that opus doesn't, so the two decode slightly
# differently even when both are intact. Anything beyond this is a real defect.
TOLERANCE_S = 0.40

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", "__pycache__", "parts"}


def ffmpeg_exe():
    from shutil import which
    exe = which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg not found. pip install --user imageio-ffmpeg")


FFMPEG = ffmpeg_exe()


def decoded_seconds(path):
    """Length counted from decoded samples. Returns None if it won't decode."""
    res = subprocess.run(
        [FFMPEG, "-v", "error", "-i", path, "-f", "s16le", "-ac", "1",
         "-ar", str(SR), "-"], capture_output=True)
    if res.returncode != 0:
        return None
    return len(res.stdout) / 2 / SR


def iter_mp3s(base):
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in sorted(filenames):
            if name.endswith(".mp3"):
                yield os.path.join(dirpath, name)


def check(mp3):
    """Return (mp3, opus, status, detail). status is 'ok' or a failure reason."""
    opus = mp3[:-4] + ".opus"
    if not os.path.exists(opus):
        return mp3, opus, "missing", "no .opus sibling"
    if os.path.getsize(opus) == 0:
        return mp3, opus, "empty", "0 bytes"

    o = decoded_seconds(opus)
    if o is None:
        return mp3, opus, "undecodable", "opus failed to decode"
    if o <= 0:
        return mp3, opus, "silent", "opus decodes to 0 samples"

    m = decoded_seconds(mp3)
    if m is None:
        # The mp3 is the broken one; the opus is fine, so dropping it is safe.
        return mp3, opus, "ok", "mp3 unreadable, opus fine"
    if abs(m - o) > TOLERANCE_S:
        return mp3, opus, "truncated", f"mp3 {m:.2f}s vs opus {o:.2f}s"
    return mp3, opus, "ok", f"{o:.2f}s"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("subtree", nargs="?", default=ROOT)
    ap.add_argument("--list-ok", action="store_true",
                    help="print verified-safe mp3 paths, one per line, to stdout")
    args = ap.parse_args()

    files = list(iter_mp3s(os.path.abspath(args.subtree)))
    if not files:
        sys.exit("no .mp3 files found")

    bad, ok = [], []
    with multiprocessing.pool.ThreadPool(max(os.cpu_count() or 4, 4)) as pool:
        for i, (mp3, opus, status, detail) in enumerate(
                pool.imap_unordered(check, files, chunksize=4), 1):
            (ok if status == "ok" else bad).append((mp3, status, detail))
            if not args.list_ok and (i % 200 == 0 or i == len(files)):
                print(f"  checked {i}/{len(files)}", file=sys.stderr, flush=True)

    if args.list_ok:
        for path, _, _ in sorted(ok):
            print(path)

    print(f"\nverified OK : {len(ok)}", file=sys.stderr)
    print(f"problems    : {len(bad)}", file=sys.stderr)
    for path, status, detail in sorted(bad):
        print(f"  [{status}] {path} — {detail}", file=sys.stderr)

    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
