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
}

# Single words. Matched case-insensitively — the scripts capitalise the same
# term inconsistently ("array"/"Array", "heap"/"Heap") and both must sound alike.
WORDS = {
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
}


def _compile(mapping, flags=0):
    """One alternation over the whole mapping, longest key first.

    Separate per-key passes would let an earlier replacement's Devanagari be
    re-scanned by a later key; a single pass over the original string cannot.
    """
    keys = sorted(mapping, key=len, reverse=True)
    pat = re.compile(r"(?<![A-Za-z])(" + "|".join(re.escape(k) for k in keys)
                     + r")(?![A-Za-z])", flags)
    return pat


_PHRASE_RE = _compile(PHRASES)
_WORD_RE = _compile(WORDS, re.IGNORECASE)


def to_devanagari(text):
    """Respell known English technical terms in Devanagari."""
    text = _PHRASE_RE.sub(lambda m: PHRASES[m.group(1)], text)
    return _WORD_RE.sub(lambda m: WORDS[m.group(1).lower()], text)


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
