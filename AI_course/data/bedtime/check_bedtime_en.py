#!/usr/bin/env python3
"""Lint the English edition of this course's bedtime voyage.

The checks are the DSA course's check_bedtime_en.py — does every English
sentence have a predicate, is the method recited three times, did any Devanagari
survive the translation, and are the two editions structurally parallel. None of
that is specific to this course, so none of it is restated here.

What *is* specific is which script directory gets checked, and that is the whole
job of this file. The load order below is the delicate part and is not
rearrangeable:

  1. The DSA linter is imported first. Importing it loads the DSA English
     profile as a side effect, which points the shared engine at DSA_tool.
  2. This course's English profile is loaded second, which points that same
     engine module at this directory. Both files rebind globals on one shared
     module object, so the last one to run wins.
  3. The linter's own HERE is rebound, because it uses it to find the Nepali
     twin of each chapter for the parity check. Left alone it would compare this
     course's English against the DSA course's Nepali and report that every
     chapter differs.

Doing it the other way round — profile first, linter second — silently checks
the DSA voyage twice and never looks at this course at all.

Usage:  python3 check_bedtime_en.py [--verbose]
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, *[".."] * 3))
ENGINE_DIR = os.path.join(ROOT, "DSA_tool", "data", "bedtime")

sys.path.insert(0, ENGINE_DIR)


def _load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


L = _load(os.path.join(ENGINE_DIR, "check_bedtime_en.py"), "dsa_check_en")
_load(os.path.join(HERE, "build_bedtime_en.py"), "ai_bedtime_en_profile")
L.HERE = HERE

if __name__ == "__main__":
    sys.exit(L.main())
