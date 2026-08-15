#!/usr/bin/env python3
"""Prove a finished bedtime build actually plays, before anyone deploys it.

The build already exits non-zero when a clip fails to synthesize, but that is
not the whole risk. A segment can be *written* and still be unplayable: an
interrupted run, or two runs racing on the same output directory, leave an
.opus that ffmpeg cannot decode. The build will not notice, because it measured
the file at the moment it wrote it. The listener notices, as silence.

Two checks, both against the manifest the site is actually served:

  1. Every segment it names exists and decodes end to end — samples counted,
     headers not trusted, because a truncated opus still has a valid header.

  2. The chapter offsets it promises are the ones the files add up to. The
     player seeks with `starts`, so this is what a listener experiences: pick
     chapter 12 and land where chapter 12 begins. The relationship is exact,

         starts[i+1] - starts[i] == sum(durations of chapter i's segments)
                                     - overlap * (number of those segments)

     because consecutive segments are crossfaded by `overlap`. There is no
     tolerance to tune here beyond opus's own frame padding: if this drifts,
     the build's arithmetic and its audio disagree, and every chapter mark
     after the drift is wrong.

    python3 shared/verify_bedtime_render.py                    # every build
    python3 shared/verify_bedtime_render.py DSA_tool/data/bedtime
"""
import glob
import json
import multiprocessing.pool
import os
import re
import subprocess
import sys

import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SR = 24000

# Opus codes in 20ms frames and pads to a frame boundary, so a few tens of
# milliseconds of disagreement is the container, not a defect. A real drift is
# a missing or truncated segment and is orders of magnitude bigger.
TOLERANCE_S = 0.25

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Every course with a rendered voyage. A bare run has to cover all of them —
# this list went stale twice while new voyages shipped unverified, so it is
# discovered rather than typed: any data/bedtime with a manifest counts.
DEFAULT_DIRS = sorted(set(
    os.path.relpath(os.path.dirname(p), REPO)
    for p in glob.glob(os.path.join(REPO, "*", "data", "bedtime", "manifest*.json"))
))


def editions(build_dir):
    """Every manifest in one build directory, oldest naming first.

    One directory can hold more than one edition of the same voyage — the DSA
    voyage ships as manifest.json (Nepali) and manifest-en.json (English), same
    story, different language, different audio. Globbing for exactly
    "manifest.json" verified the Nepali edition and walked silently past 93 MB
    of English, which is the failure this whole script exists to prevent.
    """
    return sorted(glob.glob(os.path.join(build_dir, "manifest*.json")))

# ch07-medium.opus -> ("07", "medium")
_SEG = re.compile(r"^ch(\d+)-([a-z]+)\.opus$")


def duration(path):
    """Real length, from decoded samples. Raises if the file will not decode."""
    pcm = subprocess.run(
        [FFMPEG, "-v", "error", "-i", path, "-f", "s16le", "-ac", "1",
         "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return len(pcm) / 2.0 / SR


def measure(job):
    """(key, duration or None, complaint or None)"""
    key, path = job
    if not os.path.exists(path):
        return key, None, f"MISSING  {key} — named in the manifest, not on disk"
    try:
        return key, duration(path), None
    except subprocess.CalledProcessError:
        return key, None, f"CORRUPT  {key} — will not decode"


def verify(path):
    build_dir = os.path.dirname(path)
    label = os.path.relpath(path, REPO)
    if not os.path.exists(path):
        print(f"{label}: no manifest — nothing built here")
        return True
    with open(path, encoding="utf-8") as f:
        man = json.load(f)

    overlap = man.get("overlap", 0.0)
    # Where this edition's audio actually lives. The manifest says so itself —
    # "data/bedtime/audio-en/" for the English edition — and assuming "audio"
    # would have measured the Nepali files against the English manifest and
    # reported drift on every chapter.
    audio = os.path.join(build_dir,
                         os.path.basename(os.path.normpath(man.get("dir") or "audio")))

    jobs = []
    for mode, block in (man.get("modes") or {}).items():
        for name in block.get("segments", {}):
            jobs.append(((mode, name), os.path.join(audio, mode, name)))

    with multiprocessing.pool.ThreadPool(min(8, os.cpu_count() or 4)) as pool:
        measured = pool.map(measure, jobs)

    durs = {k: d for k, d, _ in measured if d is not None}
    problems = [c for _, _, c in measured if c]

    # The tiers are cumulative — "long" plays a chapter's core, medium and long
    # segments in that order — so a chapter's parts in a tier are every segment
    # whose own tier appears at or before this one in the tier list.
    for mode, block in (man.get("modes") or {}).items():
        order = list(block.get("tiers", {}))
        by_chapter = {}
        for name in block.get("segments", {}):
            m = _SEG.match(name)
            if m:
                by_chapter.setdefault(m.group(1), {})[m.group(2)] = name

        for ti, tier in enumerate(order):
            allowed = set(order[:ti + 1])
            starts = block["tiers"][tier].get("starts") or {}
            chapters = sorted(starts)
            for i, ch in enumerate(chapters[:-1]):
                parts = [n for t, n in sorted(by_chapter.get(ch, {}).items())
                         if t in allowed and (mode, n) in durs]
                if not parts:
                    continue
                played = sum(durs[(mode, n)] for n in parts) - overlap * len(parts)
                promised = starts[chapters[i + 1]] - starts[ch]
                if abs(played - promised) > TOLERANCE_S:
                    problems.append(
                        f"DRIFT    {mode}/{tier} chapter {ch} — manifest spaces "
                        f"it {promised:.2f}s, its {len(parts)} file(s) play "
                        f"{played:.2f}s")

    for p in sorted(set(problems)):
        print(f"  ✗ {p}")
    hours = sum(durs.values()) / 3600.0
    print(f"{label}: {len(jobs)} segments, {hours:.2f} h of audio, "
          + (f"{len(set(problems))} PROBLEM(S)" if problems else "all play, "
             "all offsets agree. clean."))
    return not problems


def main():
    ok = True
    for d in (sys.argv[1:] or DEFAULT_DIRS):
        d = d if os.path.isabs(d) else os.path.join(REPO, d)
        found = editions(d)
        if not found:
            print(f"{os.path.relpath(d, REPO)}: no manifest — nothing built here")
            continue
        for path in found:
            ok &= verify(path)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
