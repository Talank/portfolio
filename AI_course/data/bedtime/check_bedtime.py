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
profile = _load(os.path.join(HERE, "build_bedtime.py"), "ai_bedtime_profile")
C = _load(os.path.join(profile.ENGINE_DIR, "check_bedtime.py"),
          "ai_bedtime_check")

# The same two gaps the Java voyage found, for the same reason: Robin and Nami
# do most of the explaining here too, so the third-person feminine past and the
# honorific plural past are on nearly every page. Both are listed as words
# rather than loosened into the regex, so the list stays something somebody
# chose.
C._FEM_PAST |= {
    "गरिन्", "भनिन्", "हेरिन्", "सुनिन्", "सोधिन्", "राखिन्", "लेखिन्",
    "बनाइन्", "ल्याइन्", "खोलिन्", "हाँसिन्", "मुस्कुराइन्", "फर्किन्",
    "उठिन्", "बसिन्", "गइन्", "आइन्", "भइन्", "निकालिन्", "थपिन्",
    "चिम्लिन्", "पल्टाइन्", "देखाइन्", "दिइन्", "लिइन्", "तानिन्",
    "समातिन्", "पढिन्", "बोलिन्", "जाँचिन्", "गनिन्", "छानिन्",
    "कोरिन्", "मिलाइन्", "जोडिन्", "नापिन्", "छाडिन्", "फेरिन्",
    "थालिन्", "लागिन्", "पल्टिन्", "झुकिन्", "टेकिन्", "बटुलिन्",
}

_HON_PAST = {
    "भने", "राखे", "गरे", "पारे", "बसे", "हेरे", "सुने", "सोधे", "थपे",
    "निकाले", "खोले", "हाँसे", "फर्के", "उठे", "हाले", "छाडे", "बोले",
    "लेखे", "पढे", "जोडे", "छाने", "गने", "समाते", "झारे", "थुने",
    "फुकाए", "काटे", "बाँधे", "पन्छाए", "बिर्से", "सम्झे", "भेटे",
    "खोजे", "रोके", "हिँडे", "पसे", "घोटे", "पल्टाए", "नापे", "फेरे",
    "पिए", "दिए", "लिए", "गए", "आए", "भए", "निस्के", "चढे", "थाके",
    "लागे", "पुगे", "परे", "रहे", "चले", "सके", "देखे", "बुझे", "ठाने",
    "मिलाए", "बटुले", "उठाए", "घुमाए", "छुट्याए", "गनाए", "जँचाए",
}

_orig_tail_is_verb = C._tail_is_verb


def _tail_is_verb(chunk):
    """As the shared check, but the honorific past is consulted first.

    Before particle stripping, deliberately: "भने" is both the past of "to say"
    and the conditional particle, and the shared walk pops it as a particle and
    then finds only the ergative subject in front of it. Asking the verb
    question first is what tells "रोबिनले भने।" from "…भयो भने"।
    """
    words = C._TRAIL.sub("", chunk).split()
    if words and words[-1] in _HON_PAST:
        return True
    return _orig_tail_is_verb(chunk)


C._tail_is_verb = _tail_is_verb

if __name__ == "__main__":
    sys.exit(C.main())
