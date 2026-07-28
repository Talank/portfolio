#!/usr/bin/env python3
"""Shrink the site's audio to the smallest size that still sounds the same.

Every narration clip exists twice on disk: a .opus that all modern browsers
get, and a .mp3 fallback for the handful that can't play Ogg Opus. edge-tts
hands back ~62 kb/s mp3, which is generous for a file almost nobody fetches —
so this re-encodes the fallbacks down and fills in any missing .opus siblings.

Both jobs are idempotent: a clip already at or below the target bitrate, or an
.opus already newer than its .mp3, is left alone. Run it after any audio build.

    python3 shared/shrink_audio.py              # whole portfolio, in place
    python3 shared/shrink_audio.py --dry-run    # report savings, touch nothing
    python3 shared/shrink_audio.py DSA_tool     # limit to one subtree

Re-encoding is lossy-on-lossy, but the mp3 was never the master: rerunning the
course's generate_audio.py re-fetches it from edge-tts. Size wins here.
"""

import argparse
import multiprocessing.pool
import os
import re
import subprocess
import sys

# The fallback only has to be intelligible, not pretty — opus is what actually
# gets served. 32k mono is ~half of edge-tts's 62k and still clean for speech.
MP3_BITRATE = 32
OPUS_BITRATE = 16
SAMPLE_RATE = 24000

# Below this there is nothing to win, and re-encoding would only add a
# generation of loss. Anything already this small was done on a previous run.
MP3_SKIP_UNDER = MP3_BITRATE * 1.15

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def ffmpeg_exe():
    """Prefer a system ffmpeg; fall back to the imageio-ffmpeg wheel."""
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


def run(args):
    return subprocess.run([FFMPEG, "-v", "error", "-y"] + args,
                          capture_output=True, text=True)


def probe_seconds(path):
    """Decoded length, counted from samples rather than the container header.

    Headers lie often enough on re-encoded mp3 that a header-based check would
    pass files this script had actually truncated. Counting PCM cannot. This
    costs a full decode, so it is only used to verify a re-encode, never to
    decide whether one is needed — see header_kbps for that.
    """
    out = subprocess.run(
        [FFMPEG, "-v", "error", "-i", path, "-f", "s16le", "-ac", "1",
         "-ar", str(SAMPLE_RATE), "-"],
        capture_output=True).stdout
    return len(out) / 2 / SAMPLE_RATE


_BITRATE_RE = re.compile(r"bitrate:\s*(\d+)\s*kb/s")


def header_kbps(path):
    """Container-reported bitrate. Approximate, but reading it costs no decode.

    Only ever used for the "is this already small enough to skip?" decision,
    where being a few kb/s off changes nothing.
    """
    res = subprocess.run([FFMPEG, "-i", path], capture_output=True, text=True)
    m = _BITRATE_RE.search(res.stderr)
    return float(m.group(1)) if m else 0.0


# parts/ is build_bedtime.py's per-clip TTS cache: a rebuild re-stitches the
# finished audio straight out of it. Shrinking those would quietly bake a
# second generation of loss into the next rebuild, so the cache is left at
# full quality and kept out of git instead (see .gitignore).
SKIP_DIRS = {".git", "__pycache__", "parts"}


def iter_mp3s(base):
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in sorted(filenames):
            if name.endswith(".mp3"):
                yield os.path.join(dirpath, name)


def shrink_mp3(path, dry_run):
    """Re-encode one fallback in place. Returns (bytes_before, bytes_after)."""
    before = os.path.getsize(path)
    rate = header_kbps(path)
    if rate < MP3_SKIP_UNDER:
        return before, before

    if dry_run:
        return before, int(before * MP3_BITRATE / max(rate, 1))

    src_stat = os.stat(path)
    src_secs = probe_seconds(path)
    tmp = path + ".shrink.tmp.mp3"
    res = run(["-i", path, "-c:a", "libmp3lame", "-b:a", f"{MP3_BITRATE}k",
               "-ac", "1", "-ar", str(SAMPLE_RATE), tmp])
    if res.returncode != 0 or not os.path.exists(tmp):
        if os.path.exists(tmp):
            os.remove(tmp)
        print(f"  ! encode failed, kept original: {path}\n    {res.stderr.strip()}")
        return before, before

    # Never let a bad encode replace a good file: the re-encode has to still
    # contain the whole clip. mp3 frame padding moves the length a little, so
    # allow a small tolerance rather than demanding an exact match.
    new_secs = probe_seconds(tmp)
    if abs(new_secs - src_secs) > 0.35:
        os.remove(tmp)
        print(f"  ! length drift {src_secs:.2f}s -> {new_secs:.2f}s, kept: {path}")
        return before, before

    after = os.path.getsize(tmp)
    if after >= before:            # already efficient; the re-encode is a loss
        os.remove(tmp)
        return before, before

    os.replace(tmp, path)
    # Restore the original mtime. The speech is unchanged — only its encoding —
    # and ensure_opus treats "mp3 newer than opus" as "content was resynthesized,
    # rebuild the opus". Without this, a second run would see every freshly
    # shrunk mp3 as new and rebuild all the .opus files from the reduced copy,
    # putting two generations of loss into the format users actually hear.
    os.utime(path, (src_stat.st_atime, src_stat.st_mtime))
    return before, after


def ensure_opus(path, dry_run, bitrate=OPUS_BITRATE, only_if_missing=False):
    """Create the .opus sibling if it's missing, or stale against the mp3.

    only_if_missing is what the maintenance CLI uses. Re-encoding an .opus that
    already exists is never a win there: the clip is unchanged, and each course
    picked its own opus bitrate (16k decks, 24k for DSA_tool's multi-voice
    episodes) that a repo-wide sweep has no way to know. Rebuilding on staleness
    is only correct in the generator flow, where a newer mp3 really does mean
    the line was resynthesized — and that caller passes the course's bitrate.
    """
    dst = path[:-4] + ".opus"
    if os.path.exists(dst) and (only_if_missing
                                or os.path.getmtime(dst) >= os.path.getmtime(path)):
        return 0
    if dry_run:
        return 0
    res = run(["-i", path, "-c:a", "libopus", "-b:a", f"{bitrate}k",
               "-ac", "1", dst])
    if res.returncode != 0:
        print(f"  ! opus failed: {path}\n    {res.stderr.strip()}")
        return 0
    return 1


def process_dir(out_dir, quiet=False, opus_bitrate=OPUS_BITRATE, drop_mp3=True):
    """Convert a freshly synthesized directory to the opus-only form the site serves.

    This is the entry point each course's generate_audio.py calls once it has
    finished synthesizing. The TTS step writes .mp3; the site plays .opus and
    nothing else, so each clip is transcoded and then the mp3 is removed —
    keeping both formats cost ~330MB of duplicate audio for browsers older than
    Safari 17.5, which now fall back to the browser's speech synthesizer.

    An mp3 is only ever deleted after its .opus has been decoded and checked
    against it, so a failed transcode leaves the source in place rather than
    silently losing a clip. Safe to call repeatedly.

    opus_bitrate stays a parameter because it is the format users actually
    hear: the decks ship 16k, DSA_tool's multi-voice episodes 24k.
    """
    files = list(iter_mp3s(out_dir))
    if not files:
        return 0, 0

    def process(path):
        made = ensure_opus(path, False, opus_bitrate)
        opus = path[:-4] + ".opus"
        if drop_mp3:
            if _opus_matches(path, opus):
                freed = os.path.getsize(path)
                os.remove(path)
                return freed, made, None
            return 0, made, f"opus check failed, kept mp3: {path}"
        before, after = shrink_mp3(path, False)
        return before - after, made, None

    freed = made = 0
    problems = []
    with multiprocessing.pool.ThreadPool(max(os.cpu_count() or 4, 4)) as pool:
        for f, m, err in pool.imap_unordered(process, files, chunksize=4):
            freed += f
            made += m
            if err:
                problems.append(err)
    if not quiet:
        verb = "dropped after transcode" if drop_mp3 else "trimmed"
        print(f"audio: {made} opus built, {freed/1048576:.1f}MB of mp3 {verb}")
        for p in problems:
            print(f"  ! {p}")
    return made, freed


def _opus_matches(mp3, opus):
    """True when the .opus is a complete stand-in for the .mp3.

    Checked by decoding both and comparing real lengths — a truncated or
    unplayable opus would otherwise become silence on a live page, with the
    only copy of the audio already deleted.
    """
    if not os.path.exists(opus) or os.path.getsize(opus) == 0:
        return False
    o = probe_seconds(opus)
    if o <= 0:
        return False
    m = probe_seconds(mp3)
    if m <= 0:
        return True          # mp3 itself is unreadable; the opus is the good copy
    return abs(m - o) <= 0.40


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("subtree", nargs="?", default=ROOT,
                    help="directory to process (default: whole portfolio)")
    ap.add_argument("--dry-run", action="store_true",
                    help="report what would change without writing")
    ap.add_argument("--no-opus", action="store_true",
                    help="only shrink mp3s; don't build missing .opus siblings")
    ap.add_argument("-j", "--jobs", type=int, default=max(os.cpu_count() or 4, 4),
                    help="parallel ffmpeg processes (default: one per core)")
    args = ap.parse_args()

    base = os.path.abspath(args.subtree)
    files = list(iter_mp3s(base))
    if not files:
        sys.exit(f"no .mp3 files under {base}")

    print(f"{len(files)} mp3 files under {base}")
    print(f"target: mp3 {MP3_BITRATE}k mono, opus {OPUS_BITRATE}k"
          + ("  [DRY RUN]" if args.dry_run else ""))

    def process(path):
        # Opus first, always — see process_dir for why the order matters.
        made = 0 if args.no_opus else ensure_opus(path, args.dry_run,
                                                  only_if_missing=True)
        before, after = shrink_mp3(path, args.dry_run)
        return before, after, made

    # ffmpeg on one short clip barely uses a core, so the wall-clock cost here
    # is process startup times ~4000 invocations. A pool turns ~20 minutes of
    # serial work into a couple of minutes.
    total_before = total_after = 0
    shrunk = opus_made = 0
    workers = min(args.jobs, len(files))
    with multiprocessing.pool.ThreadPool(workers) as pool:
        for i, (before, after, made) in enumerate(
                pool.imap_unordered(process, files, chunksize=4), 1):
            total_before += before
            total_after += after
            opus_made += made
            if after < before:
                shrunk += 1
            if i % 200 == 0 or i == len(files):
                print(f"  [{i}/{len(files)}] {total_before/1048576:.0f}MB -> "
                      f"{total_after/1048576:.0f}MB, {opus_made} opus built",
                      flush=True)

    saved = total_before - total_after
    print(f"\nmp3: {total_before/1048576:.1f}MB -> {total_after/1048576:.1f}MB "
          f"({saved/1048576:.1f}MB saved, {100*saved/max(total_before,1):.0f}%) "
          f"across {shrunk} files")
    if not args.no_opus:
        print(f"opus siblings built: {opus_made}")


if __name__ == "__main__":
    main()
