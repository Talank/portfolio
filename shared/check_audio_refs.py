#!/usr/bin/env python3
"""Every clip any manifest in this repo names, checked to exist on disk.

Cheap and repo-wide: it opens no audio, it only resolves paths, so it runs in
under a second and is the right first question after any audio build — "is
anything the site asks for simply not there".

The three manifest shapes need three different path rules, which is the whole
reason this file exists rather than a one-line glob:

  bedtime   `dir` is relative to the *course* root, not to the manifest, and
            the mode ("bedtime"/"drive") is a directory between it and the
            filename. A naive join finds nothing and reports every one of a
            course's segments missing.
  dojo      `f` is a bare hash with no extension; the file is `<hash>.opus`.
  decks     `f` names a `.mp3`, and the engines swap to `.opus` at play time
            (see js/presentation-engine.js). Either satisfies the reference.

Getting any of those wrong produces a confident, wholly false "2348 missing".

Usage:  python3 shared/check_audio_refs.py        # from the repo root
"""
import glob
import json
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _refs_bedtime(d, man):
    course = os.path.relpath(man, REPO).split(os.sep)[0]
    root = os.path.join(REPO, course, d["dir"])
    for mode, mv in d["modes"].items():
        for tier in mv["tiers"].values():
            for e in tier["playlist"]:
                yield e["f"], [os.path.join(root, mode, e["f"])]


def _walk(o, key=("f", "file")):
    if isinstance(o, dict):
        for k, v in o.items():
            if k in key and isinstance(v, str):
                yield v
            else:
                yield from _walk(v, key)
    elif isinstance(o, list):
        for v in o:
            yield from _walk(v, key)


def _refs_other(d, man, dojo):
    base = os.path.dirname(man)
    for f in _walk(d):
        if dojo:
            yield f, [os.path.join(base, f + e) for e in (".opus", ".mp3", "")]
        else:
            cands = [os.path.join(base, f)]
            if f.lower().endswith(".mp3"):
                cands.append(os.path.join(base, f[:-4] + ".opus"))
            yield f, cands


def main():
    total = missing_total = 0
    bad = False
    # Both extensions, and the .js one is not optional: bedtime.html loads
    # `<script src="data/bedtime/manifest.js">` and reads window.BEDTIME_MANIFEST,
    # so the .js is what actually plays and the .json is the readable copy. They
    # are written together by build_bedtime.py and can drift when a manifest is
    # edited by hand — which happened when the drive mode was removed, leaving
    # three courses with a dead toggle that every .json-only check called clean.
    pattern = os.path.join(REPO, "*", "data", "**", "manifest*.js*")
    for man in sorted(glob.glob(pattern, recursive=True)):
        with open(man, encoding="utf-8") as fh:
            raw = fh.read()
        if man.endswith(".js"):
            raw = re.sub(r"^.*?window\.[A-Z_]+\s*=\s*", "", raw, flags=re.S)
            raw = raw.rstrip().rstrip(";")
        d = json.loads(raw)
        if "modes" in d and "dir" in d:
            refs = _refs_bedtime(d, man)
        else:
            refs = _refs_other(d, man, dojo="problems" in d)
        n = miss = 0
        first = []
        for name, cands in refs:
            n += 1
            if not any(os.path.exists(c) for c in cands):
                miss += 1
                if len(first) < 3:
                    first.append(name)
        total += n
        missing_total += miss
        rel = os.path.relpath(man, REPO)
        note = f"** {miss} MISSING  e.g. {first}" if miss else "ok"
        if miss:
            bad = True
        print(f"  {rel:56s} {n:5d} refs  {note}")
    print(f"\n{total} referenced clips, {missing_total} missing")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
