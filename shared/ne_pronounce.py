#!/usr/bin/env python3
"""Devanagari spellings for the English technical vocabulary in Nepali narration.

The Nepali neural voice does not refuse Latin script — it guesses at it, and the
guess is wrong often enough to be distracting: "array", "heap", "queue" and
"backtracking" come out as something between an English word and a Nepali one.
Handing the engine Devanagari removes the guess. "एरे" is pronounced exactly one
way, and it is the way a Nepali speaker actually says the word.

This is deliberately transliteration, not translation. The listener is learning
vocabulary they will later read in English and type into an editor, so "स्ट्याक"
(the English word, said the Nepali way) is right and "थुप्रो" (the Nepali word
for a heap of things) is wrong — the story already supplies the Nepali metaphor
around it.

Each generator applies these after its own Big-O and acronym passes and before
its single-letter pass, so the layers do not fight:

    O(n) -> बिग ओ अफ एन        (the generator's _BIGO table)
    BFS  -> बी एफ एस           (its _ACRO table)
    heap -> हिप                (here)
    n    -> एन                 (its single-letter table, whatever is left)

Adding a term: put it in WORDS. Run `python3 ne_pronounce.py <file>...` to list
Latin tokens in a script that nothing here covers yet.
"""

import re

# Hyphenated and multi-word terms, applied before WORDS so the hyphen does not
# survive as an audible stumble. Order matters only in that longer keys are
# tried first, which the builder below arranges.
PHRASES = {
    "Big-O": "बिग ओ",
    "Union-Find": "युनियन फाइन्ड",
    "Top-K": "टप के",
    "Binary Search Tree": "बाइनरी सर्च ट्री",
    "Binary Search": "बाइनरी सर्च",
    "Hash Map": "ह्यास म्याप",
    "Linked List": "लिङ्क्ड लिस्ट",
    "Dynamic Programming": "डाइनामिक प्रोग्रामिङ",
    "Sliding Window": "स्लाइडिङ विन्डो",
    "Two Pointers": "टु पोइन्टर्स",
    "Merge Intervals": "मर्ज इन्टरभल",
    "Bit Manipulation": "बिट म्यानिपुलेसन",
    "Prefix Sum": "प्रिफिक्स सम",
    "Monotonic Stack": "मोनोटोनिक स्ट्याक",
    "Topological Sort": "टोपोलोजिकल सर्ट",
    # Added with the conversational rewrite: the crew now argue about cost out
    # loud, so the phrases they argue in have to be sayable.
    "Least Recently Used": "लिस्ट रिसेन्ट्ली युज्ड",
    "Divide and Conquer": "डिभाइड एन्ड कन्कर",
    "Time Complexity": "टाइम कम्प्लेक्सिटी",
    "Space Complexity": "स्पेस कम्प्लेक्सिटी",
    "Priority Queue": "प्रायोरिटी क्यू",
    "Adjacency List": "एड्जासेन्सी लिस्ट",
    "Level Order": "लेभल अर्डर",
    "Brute Force": "ब्रुट फोर्स",
    "Call Stack": "कल स्ट्याक",
    "Base Case": "बेस केस",
    "Edge Case": "एज केस",
    "In Place": "इन प्लेस",
    "Min Heap": "मिन हिप",
    "Max Heap": "म्याक्स हिप",
}

# Single words. Matched case-insensitively — the scripts capitalise the same
# term inconsistently ("array"/"Array", "heap"/"Heap") and both must sound alike.
WORDS = {
    # The listener asked for these three by name: a direction, a shape and its
    # adjective are all easier in English than in Nepali even inside Nepali
    # narration. Same rule as left/right, which were already here.
    "arrow": "एरो",
    "arrows": "एरोहरू",
    "circle": "सर्कल",
    "circular": "सर्कुलर",
    "array": "एरे",
    "subarray": "सब एरे",
    "string": "स्ट्रिङ",
    "substring": "सब स्ट्रिङ",
    "stack": "स्ट्याक",
    "queue": "क्यू",
    "deque": "डेक",
    "heap": "हिप",
    "hash": "ह्यास",
    "map": "म्याप",
    "list": "लिस्ट",
    "linked": "लिङ्क्ड",
    "tree": "ट्री",
    "trie": "ट्राई",
    "graph": "ग्राफ",
    "graphs": "ग्राफ",
    "set": "सेट",
    "pointer": "पोइन्टर",
    "pointers": "पोइन्टर्स",
    "binary": "बाइनरी",
    "search": "सर्च",
    "sort": "सर्ट",
    "sum": "सम",
    "prefix": "प्रिफिक्स",
    "pattern": "प्याटर्न",
    "recursion": "रिकर्सन",
    "backtracking": "ब्याकट्र्याकिङ",
    "memoization": "मेमोआइजेसन",
    "tabulation": "ट्याबुलेसन",
    "pruning": "प्रुनिङ",
    "dynamic": "डाइनामिक",
    "programming": "प्रोग्रामिङ",
    "greedy": "ग्रिडी",
    "monotonic": "मोनोटोनिक",
    "topological": "टोपोलोजिकल",
    "intervals": "इन्टरभल",
    "merge": "मर्ज",
    "window": "विन्डो",
    # Technical nouns the rewritten chapters lean on. Deliberately nouns only:
    # ordinary words the story uses as story ("half", "back", "step") stay
    # Nepali, or the narration turns into a word list. See the note at the top
    # about transliteration rather than translation.
    "input": "इनपुट",
    "output": "आउटपुट",
    "cache": "क्यास",
    "reverse": "रिभर्स",
    "reversed": "रिभर्स्ड",
    "data": "डाटा",
    "size": "साइज",
    "level": "लेभल",
    "levels": "लेभलहरू",
    "path": "पाथ",
    "paths": "पाथहरू",
    "cycle": "साइकल",
    "cycles": "साइकलहरू",
    "visit": "भिजिट",
    "visited": "भिजिटेड",
    "edge": "एज",
    "edges": "एजहरू",
    "vertex": "भर्टेक्स",
    "vertices": "भर्टिसेज",
    "leaf": "लिफ",
    "leaves": "लिभ्स",
    "parent": "प्यारेन्ट",
    "child": "चाइल्ड",
    "children": "चिल्ड्रेन",
    "swap": "स्वाप",
    "insert": "इन्सर्ट",
    "delete": "डिलिट",
    "update": "अपडेट",
    "loop": "लुप",
    "loops": "लुपहरू",
    "offset": "अफसेट",
    "boundary": "बाउन्ड्री",
    "capacity": "क्यापासिटी",
    "mask": "मास्क",
    "bucket": "बकेट",
    "buckets": "बकेटहरू",
    "target": "टार्गेट",
    "matrix": "म्याट्रिक्स",
    "grid": "ग्रिड",
    "cell": "सेल",
    "cells": "सेलहरू",
    "pop": "पप",
    "push": "पुस",
    "peek": "पिक",
    "null": "नल",
    "flag": "फ्ल्याग",
    "range": "रेन्ज",
    "example": "एक्जाम्पल",
    "morris": "मोरिस",
    "sliding": "स्लाइडिङ",
    "knapsack": "न्यापस्याक",
    "inorder": "इन अर्डर",
    "preorder": "प्रि अर्डर",
    "postorder": "पोस्ट अर्डर",
    "overflow": "ओभरफ्लो",
    "manipulation": "म्यानिपुलेसन",
    "bit": "बिट",
    "log": "लग",
    "base": "बेस",
    "case": "केस",
    "dummy": "डमी",
    "fast": "फास्ट",
    "slow": "स्लो",
    "two": "टु",
    "listen": "लिसन",
    "silent": "साइलेन्ट",
    # Added when the scripts stopped using a Nepali coinage as the working noun
    # for a structure the listener will later type in English. The story keeps
    # its metaphor as a simile — "साङ्लो जस्तो", "थुप्रो जस्तै" — and the noun
    # itself is now the English term, said the Nepali way.
    "node": "नोड",
    "nodes": "नोड",
    "key": "की",
    "keys": "की",
    "value": "भ्यालु",
    "values": "भ्यालु",
    "row": "रो",
    "rows": "रो",
    "column": "कोलम",
    "columns": "कोलम",
    "table": "टेबल",
    "tables": "टेबल",
    "sequence": "सिक्वेन्स",
    "subsequence": "सब सिक्वेन्स",
    # Second pass, on the vocabulary *around* the structures. These are the
    # words where the Nepali was formal — विधि, कोष्ठक, ठेगाना, गहिराइ — and the
    # English is both the simpler word and the one that appears in the code.
    # Same rule as above: the story keeps the Nepali metaphor, the noun is
    # English, and the postposition attaches to it (`indexबाट`, `countले`).
    "rule": "रुल",
    "rules": "रुल",
    "bracket": "ब्र्याकेट",
    "brackets": "ब्र्याकेट",
    "open": "ओपन",
    "close": "क्लोज",
    "index": "इन्डेक्स",
    "indexes": "इन्डेक्स",
    "top": "टप",
    # The four directions a structure is read in, and the three words the story
    # uses for the work itself. Nepali has perfectly good words for all of these
    # — बायाँ, दायाँ, समस्या, तरिका — but a learner reads `left child` and
    # `problem` in every book and every interview, so the story says what they
    # will meet, and the Nepali sentence around it stays Nepali.
    "left": "लेफ्ट",
    "right": "राइट",
    # Same argument, carried further. These were the Sanskritised Nepali words
    # the scripts reached for -- ऋणात्मक, उपसमूह, क्रमचय, उत्तराधिकारी,
    # सन्तुलित, विकर्ण, अद्वितीय, आयत -- and every one of them is a word the
    # listener will never meet again outside a Nepali maths textbook. The
    # English is what is written in the book they will study from and spoken in
    # the interview they will sit, and it is the shorter word besides. The
    # sentence around it still runs in Nepali, and the suffix still attaches:
    # "subsetको", "diagonalमा".
    "negative": "नेगेटिभ",
    "positive": "पोजिटिभ",
    "subset": "सबसेट",
    "subsets": "सबसेट",
    "permutation": "पर्मुटेसन",
    "permutations": "पर्मुटेसन",
    "successor": "सक्सेसर",
    "diagonal": "डायगोनल",
    "diagonals": "डायगोनल",
    "balanced": "ब्यालेन्स्ड",
    "unique": "युनिक",
    "rectangle": "रेक्ट्याङ्गल",
    "rectangles": "रेक्ट्याङ्गल",
    "expression": "एक्सप्रेसन",
    "square": "स्क्वायर",
    "root": "रुट",
    "bottom": "बटम",
    "problem": "प्रोब्लम",
    "problems": "प्रोब्लम",
    "trick": "ट्रिक",
    "tricks": "ट्रिक",
    "approach": "एप्रोच",
    "count": "काउन्ट",
    "counts": "काउन्ट",
    "limit": "लिमिट",
    "limits": "लिमिट",
    "depth": "डेप्थ",
    "distance": "डिस्टेन्स",
    "weight": "वेट",
    "weights": "वेट",
    "condition": "कन्डिसन",
    "conditions": "कन्डिसन",
    "check": "चेक",
    "group": "ग्रुप",
    "groups": "ग्रुप",
    "collection": "कलेक्सन",
    "collections": "कलेक्सन",
    "state": "स्टेट",
    "special": "स्पेसल",
    "shared": "सेयर्ड",
    # सङ्ख्या was the last big holdout. It became `number` only where it means
    # a numeric *value*; where it means "how many of a thing" it is still
    # सङ्ख्या, because "बाकसको numberसँगै" reads as the box's identifier rather
    # than the count of boxes. One word per sense, which the Nepali alone did
    # not give us.
    "number": "नम्बर",
    "numbers": "नम्बर",
}


# ---------------------------------------------------------------------------
# The dropped final vowel
# ---------------------------------------------------------------------------
#
# ne-NP-HemkalaNeural drops the inherent अ off the end of some bare
# imperatives, so "सुन" ("listen") lands as "sun" — clipped, and on exactly the
# lines a story leans on ("अन्तिम कुरा सुन।"). A visarga puts the vowel back.
#
# Deliberately a list of words rather than a rule about final consonants,
# because it is not true of all of them. Auditioned side by side, the listener's
# verdict was सुनः yes, गरः yes, हेर already correct as it stands — and the
# difference tracks the vowel before the final consonant: ग carries the
# inherent अ and loses it, हे carries े and keeps it. Add a word here only
# after hearing it; the ones not yet auditioned are listed in task #29.
#
# Only the *bare* imperative. सुन्नुहोस्, सुनेर and सुन्दर are different words
# and the boundaries below leave them alone — including a following danda,
# which is in the Devanagari block but is punctuation, not a letter.
FINAL_VOWEL = {
    "सुन": "सुनः",
    "गर": "गरः",
}

_DEVA_LETTER = r"[ऀ-ॣ०-ॿ]"
_FINAL_VOWEL_RE = re.compile(
    rf"(?<!{_DEVA_LETTER})(" + "|".join(FINAL_VOWEL) + rf")(?!{_DEVA_LETTER})")


def restore_final_vowel(text):
    return _FINAL_VOWEL_RE.sub(lambda m: FINAL_VOWEL[m.group(1)], text)


def _compile(mapping, flags=0):
    """One alternation over the whole mapping, longest key first.

    Separate per-key passes would let an earlier replacement's Devanagari be
    re-scanned by a later key; a single pass over the original string cannot.
    """
    keys = sorted(mapping, key=len, reverse=True)
    pat = re.compile(r"(?<![A-Za-z])(" + "|".join(re.escape(k) for k in keys)
                     + r")(?![A-Za-z])", flags)
    return pat


# WORDS is matched case-insensitively and looked up with .lower(), so a key
# with a capital in it compiles into the pattern, matches, and then raises
# KeyError on the lookup. That is a crash at the first chapter that happens to
# use the word — forty minutes into a render, if the word is rare. Checked at
# import instead.
_bad = sorted(k for k in WORDS if k != k.lower())
assert not _bad, f"WORDS keys must be lowercase: {_bad}"

_PHRASE_RE = _compile(PHRASES)
_WORD_RE = _compile(WORDS, re.IGNORECASE)


def to_devanagari(text):
    """Respell known English technical terms in Devanagari."""
    text = _PHRASE_RE.sub(lambda m: PHRASES[m.group(1)], text)
    text = _WORD_RE.sub(lambda m: WORDS[m.group(1).lower()], text)
    return restore_final_vowel(text)


# A comma is a very short breath — fine mid-sentence, far too short when a
# sentence is introducing a list of things the listener is meant to take in one
# at a time. Measured on ne-NP-HemkalaNeural: a comma adds nothing, an ellipsis
# adds ~0.90s. Only sentences carrying a real series get the upgrade, so
# ordinary single-comma prose keeps its normal rhythm.
LIST_MIN_COMMAS = 2

_SENT_SPLIT = re.compile(r"(?<=[।?!])\s+")


def space_out_lists(text, min_commas=LIST_MIN_COMMAS):
    """Turn the commas of an enumeration into full breaths."""
    out = []
    for sent in _SENT_SPLIT.split(text):
        if sent.count(",") >= min_commas:
            sent = re.sub(r"\s*,\s*", "… ", sent)
        out.append(sent)
    return " ".join(out)


def unknown_latin(text):
    """Latin tokens still left after conversion — i.e. terms nothing covers.

    Single letters are excluded: every caller runs a letter-name pass of its own
    afterwards, so a lone "n" is already handled and is not a gap here.
    """
    return {t for t in re.findall(r"[A-Za-z][A-Za-z'’-]*", to_devanagari(text))
            if len(t) > 1}


if __name__ == "__main__":
    import sys
    from collections import Counter
    missing = Counter()
    for path in sys.argv[1:]:
        with open(path, encoding="utf-8") as f:
            missing.update(unknown_latin(f.read()))
    if not missing:
        print("no uncovered Latin terms")
    for term, n in missing.most_common():
        print(f"{n:5d}  {term}")
