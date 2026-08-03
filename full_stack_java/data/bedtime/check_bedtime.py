#!/usr/bin/env python3
"""Lint this course's bedtime scripts before spending an hour of TTS on them.

The checks themselves — every sentence must end in a real predicate, every
chapter's method must be recited at least three times inside the core tier,
quotes must balance — live in the DSA course's check_bedtime.py. This wrapper
exists only to point that linter at this course's script directory and this
course's voice, which is what importing the profile beside it does.

Usage:  python3 check_bedtime.py [--verbose]
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def _load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# Loading the profile is what rebinds the engine's SCRIPT_DIR, so it has to
# happen before the linter is imported: the linter reads B.SCRIPT_DIR at import
# time to find _fragments-ok.txt.
profile = _load(os.path.join(HERE, "build_bedtime.py"), "fsj_bedtime_profile")
C = _load(os.path.join(profile.ENGINE_DIR, "check_bedtime.py"),
          "fsj_bedtime_check")

# Nepali the DSA voyage never had to say. Each of these is a real finite form
# the shared linter's ending table does not cover yet; they are listed here
# rather than loosened into the regex so the list stays something somebody
# chose.
C._IMPERATIVE |= {"पल्टा", "झार", "ओछ्या", "पुछ", "थुन", "फुका", "ताछ",
                  "जोड्", "नाप्", "गन्ती", "जँचा", "मिच", "बटार"}

# Third-person feminine past in -िन्: गरिन्, भनिन्, सुनिन्. The shared table has
# the independent-vowel spelling इन् (थिइन्, गइन्) but not the dependent ि, and
# these are ordinary forms — Nami and Robin do most of the explaining on this
# voyage, so they turn up in every other chapter.
C._FEM_PAST |= {
    "गरिन्", "भनिन्", "हेरिन्", "सुनिन्", "सोधिन्", "राखिन्", "लेखिन्",
    "बनाइन्", "ल्याइन्", "खोलिन्", "हाँसिन्", "मुस्कुराइन्", "फर्किन्",
    "उठिन्", "बसिन्", "गइन्", "आइन्", "भइन्", "निकालिन्", "थपिन्",
    "चिम्लिन्", "पल्टाइन्", "ओछ्याइन्", "देखाइन्", "दिइन्", "लिइन्",
    "तानिन्", "समातिन्", "पढिन्", "बोलिन्", "जाँचिन्", "गनिन्", "छानिन्",
    "थुनिन्", "फुकाइन्", "कोरिन्", "टेकिन्", "मिलाइन्", "हल्लाइन्",
    "झारिन्", "पट्याइन्", "जोडिन्", "नापिन्", "बटारिन्", "घोटिन्",
    "फ्याँकिन्", "छाडिन्", "समातिन्", "बाँधिन्", "फेरिन्", "पन्छाइन्",
}

# Honorific and plural past in a consonant + े: "उसप्पले भने", "तिनले राखे".
# The shared table's ए alternative already covers the forms built on a long
# आ — बनाए, पठाए, देखाए — but not these, and they are the natural way to
# report what an older or respected character did. Usopp, Sanji, Robin and
# Franky are all spoken about this way here, so the form is on nearly every
# page and rewriting around it would flatten the Nepali, which is the one
# thing this voyage was asked to do better than the last one.
_HON_PAST = {
    "भने", "राखे", "गरे", "पारे", "बसे", "हेरे", "सुने", "सोधे", "थपे",
    "निकाले", "खोले", "टेके", "हाँसे", "फर्के", "उठे", "हाले", "छाडे",
    "बोले", "लेखे", "पढे", "जोडे", "छाने", "गने", "समाते", "तिने", "झारे",
    "पुछे", "थुने", "फुकाए", "मिचे", "काटे", "बाँधे", "फ्याँके", "पन्छाए",
    "बिर्से", "सम्झे", "भेटे", "खोजे", "रोके", "हिँडे", "पसे", "टाँसे",
    "घोटे", "ताछे", "पल्टाए", "ओछ्याए", "जँचाए", "नापे", "बटारे",
    "फेरे", "पिए", "दिए", "लिए", "गए", "आए", "भए", "निस्के", "चढे",
    "थाके", "लागे", "पुगे", "परे", "रहे", "चले", "सके", "देखे", "बुझे", "ठाने",
    "ओर्ले", "टाँसे", "मिलाए", "बटुले", "उठाए", "घुमाए", "छुट्याए",
}

_orig_tail_is_verb = C._tail_is_verb


def _tail_is_verb(chunk):
    """As the shared check, but the honorific past is consulted first.

    Before particle stripping, deliberately: "भने" is both the past of "to
    say" and the conditional particle, and the shared walk pops it as a
    particle and then finds only the ergative subject in front of it. Asking
    the verb question first is what tells "उसप्पले भने।" from "…गयो भने"।
    """
    words = C._TRAIL.sub("", chunk).split()
    if words and words[-1] in _HON_PAST:
        return True
    return _orig_tail_is_verb(chunk)


C._tail_is_verb = _tail_is_verb

if __name__ == "__main__":
    sys.exit(C.main())
