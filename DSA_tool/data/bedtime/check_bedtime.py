#!/usr/bin/env python3
"""Lint the Nepali bedtime scripts before spending an hour of TTS on them.

Two things go wrong in a script that is *read aloud in the dark*, and neither is
visible when you read it on screen:

1. **Fragments.** On the page "एउटा ढाँचा।" reads as deliberate emphasis. Spoken
   in bedtime mode it is its own clip with silence on both sides, and a clause
   with no finite verb lands as a sentence that got cut off. Every sentence in
   these scripts therefore has to end in a real predicate. Genuine exceptions —
   the counted breaths in the prologue, a character calling a name — go in
   script/_fragments-ok.txt, one sentence per line, so they stay a short list
   somebody chose rather than a category the linter quietly stopped checking.

2. **The method said once.** A chapter can explain a method beautifully and
   still leave nothing behind, because it was said once, in the middle, to a
   listener already half asleep. The @algo/@recall mechanism in build_bedtime.py
   exists to make the same words come back; this checks that they do, at least
   MIN_RECITALS times, *within the core tier* — the short story is the one most
   likely to be played to the end, so it cannot be the one that skips repeats.

Usage:  python3 check_bedtime.py [--verbose]
"""
import os
import re
import sys

import build_bedtime as B

OK_PATH = os.path.join(B.SCRIPT_DIR, "_fragments-ok.txt")

# A Nepali sentence is finite if its last word carries one of these endings.
# Grouped by what they are, so the list can be argued with rather than trusted.
_VERB_END = re.compile(
    r"("
    # copula, present, and its negatives
    r"छ|छन्|छु|छौं|छौ|छस्|छे|छिन्|छैन|छैनन्|छैनौ|छैनौं|"
    r"हो|हौं|होस्|होऊन्|होइन|होइनन्|हुन्|हुँ|"
    # past copula
    r"थियो|थिए|थिएन|थिएनन्|थिइन्|थिइन|"
    # simple present / habitual …न्छ …ँछ …्छ, and the negative …दैन
    r"न्छ|न्छन्|ँछ|ँछन्|्छ|्छन्|दैन|दैनन्|ँदैन|ँदैनन्|्दैन|"
    # past tense …यो …ए …ई …इन्, and its negative …एन / …ेन (परेन, भएन)
    r"यो|ए|ई|इन्|एन|एनन्|ेन|ेनन्|हे|"
    # first person past and past habitual: सिकें, सक्थें, गरेँ
    r"ें|एँ|थें|थेँ|"
    # negative of the -हुन्छ family: हुन्न, गन्दिन, सक्दिनँ, बिर्सनुहुन्न
    r"हुन्न|न्न|दिनँ|न्दिन|दिनन्|"
    # imperative and polite request
    r"नुहोस्|नुहुन्छ|नुभयो|नुहुन्थ्यो|नुस्|"
    # hortative, optative
    r"ौं|औं|ूँ|उँ|ाऊँ|ाऊन्|ऊन्|ोस्|ओस्|"
    # habitual past, future, presumptive
    r"न्थ्यो|न्थे|न्थिन्|थे|नेछ|नेछन्|नेछौं|होला|लान्|ला|"
    # low imperative in -ऊ (बनाऊ, देऊ), and the -नू optative (हेर्नू)
    r"ाऊ|ेऊ|नू"
    r")$"
)

_TRAIL = re.compile(r"[\"'\)\]।?!…»”\s—-]+$")
_TIER_LINE = re.compile(r"@tier\s+(\w+)\s*$")
_ALGO_LINE = re.compile(r"@algo\s+([\w-]+)\s*$")
_RECALL_LINE = re.compile(r"@recall\s+([\w-]+)")


def load_allowed():
    if not os.path.exists(OK_PATH):
        return set()
    with open(OK_PATH, encoding="utf-8") as f:
        return {l.strip() for l in f if l.strip() and not l.startswith("#")}


# The plain feminine past ends in a bare ी — but so does half the vocabulary
# ("नामी", "टोकरी"), so it cannot be a suffix rule. The forms the crew actually
# use are listed instead; add to it rather than loosening the regex.
_FEM_PAST = {
    "भनी", "बसी", "हेरी", "सोधी", "गई", "आई", "भई", "गरी", "निकाली", "खोली",
    "राखी", "उठी", "हाली", "दिई", "लिई", "मुस्कुराई", "हाँसी", "फर्की",
    "पट्याई", "हल्लाई", "तानी", "समाती", "कोरी", "सुनी", "पढी", "देखी",
    "सारी", "चम्काई", "बनाई", "ल्याई", "छाडी", "थपी", "गनी",
    "बढी", "लेखी", "चिम्ली", "पाई", "सकी", "रोकी", "हिँडी", "उभिई",
    "पसी", "भेटी", "फ्याँकी", "दिइन", "गइन", "भइन", "पल्टाई", "ओढाइदिई",
    "रोकी", "बोली", "टाँसी", "झारी", "पारी", "खोजी", "छानी", "जाँची",
}

# Bare stems used for the low imperative, which have no suffix to match on.
_IMPERATIVE = {
    "टिप", "हेर", "सुन", "भन", "गर", "जा", "राख", "छाड", "बुझ", "सम्झ",
    "गन", "पख", "ल", "सोध", "खोल", "बना", "पठा", "लेख", "फर्क", "हिँड",
    "हाल", "निकाल", "जोड", "गनी", "उठ", "बस", "थप", "नाप", "बिर्स",
    "मिला", "साट", "तान", "घटा", "बढा", "छान", "पछ्या", "सोच", "दे",
    "खोज", "पर्ख", "टेक", "काट", "छुट्टया", "गन्",
}

# Particles that sit *after* the verb without changing that there is one:
# "…जान्छ भने", "…गर्छ नि", "…हो त". Stripped before the ending is inspected.
_PARTICLES = {"भने", "नि", "त", "पो", "रे", "क्यारे", "कि", "र"}


def _tail_is_verb(chunk):
    words = _TRAIL.sub("", chunk).split()
    while words and words[-1] in _PARTICLES:
        words.pop()
    if not words:
        return False
    last = words[-1]
    return (last in _FEM_PAST or last in _IMPERATIVE
            or bool(_VERB_END.search(last)))


def is_finite(sent):
    """True if `sent` ends in something a listener hears as a finished clause.

    Nepali lets a finished clause be followed by an afterthought — an adverb
    after a comma, an apposition after a dash — and the verb is then not the
    last word:  "टोली डेकमा बसेको छ, चुपचाप।"  So when the final chunk carries no
    verb, the chunk before the comma or dash is asked instead. That is only
    allowed once; two verbless chunks in a row is a fragment however you read it.
    """
    core = _TRAIL.sub("", sent)
    # A sentence whose last thing is direct speech is judged on the speech: the
    # narration's verb came before the quote, and the quote is what you hear
    # last.  …भन्यो — "पहिले भोलि टिप।"
    m = re.search(r"[\"“]([^\"“”]+)[\"”]\s*[।?!…]?\s*$", sent)
    if m:
        core = _TRAIL.sub("", m.group(1))
    if not core.split():
        return True
    if _tail_is_verb(core):
        return True
    # Walk back through the comma/dash chunks looking for the predicate. It
    # counts only if everything after it is short enough to be an afterthought
    # or a listed apposition — "…तिनका नाम हुन् — पछाडि, अहिले, र भोलि।" is a
    # whole sentence; four verbless clauses in a row is a fragment.
    chunks = [c.strip() for c in re.split(r"[,—]", core) if c.strip()]
    for i in range(len(chunks) - 2, -1, -1):
        if not _tail_is_verb(chunks[i]):
            continue
        return all(len(c.split()) <= 4 for c in chunks[i + 1:])
    return False


def recitals_by_tier(path):
    """{algo name: {tier: times spoken}} read straight off the raw file.

    Counting here rather than after expansion is what lets the check be "three
    times *in the core tier*": once expanded, a recall is indistinguishable from
    the prose around it.
    """
    counts, tier = {}, "core"
    with open(path, encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            m = _TIER_LINE.match(s)
            if m:
                tier = m.group(1)
                continue
            m = _ALGO_LINE.match(s)
            if m:
                counts.setdefault(m.group(1), {})
                counts[m.group(1)][tier] = counts[m.group(1)].get(tier, 0) + 1
                continue
            m = _RECALL_LINE.match(s)
            if m:
                d = counts.setdefault(m.group(1), {})
                d[tier] = d.get(tier, 0) + 1
    return counts


def main():
    verbose = "--verbose" in sys.argv
    allowed = load_allowed()
    chapters = B.load_chapters(tier="long")
    problems_total = 0
    used_ok = set()

    for ch in chapters:
        problems = []

        for para in ch["paras"]:
            for sent in B.split_sentences(para):
                if sent in allowed:
                    used_ok.add(sent)
                elif not is_finite(sent):
                    problems.append(("fragment", sent))
            # Quotes are checked per paragraph, not per sentence: a quotation
            # that runs over three sentences is split across three clips, and
            # that is fine — quote marks are not pronounced. An unbalanced
            # *paragraph* is a typo.
            if (para.count('"') % 2) or (para.count("“") != para.count("”")):
                problems.append(("open-quote", para[:120]))

        counts = recitals_by_tier(ch["path"])
        if not counts:
            problems.append(("no-algo", "chapter defines no @algo block"))
        for name, tiers in sorted(counts.items()):
            core = tiers.get("core", 0)
            if core < B.MIN_RECITALS:
                problems.append(
                    ("thin", f"@algo {name}: {core} recital(s) in the core tier, "
                             f"wanted {B.MIN_RECITALS}"))

        if problems:
            problems_total += len(problems)
            print(f"\n{ch['file']}  — {len(problems)} problem(s)")
            shown = problems if verbose else problems[:12]
            for kind, text in shown:
                print(f"  [{kind}] {text[:160]}")
            if len(shown) < len(problems):
                print(f"  … and {len(problems) - len(shown)} more (--verbose)")

    stale = allowed - used_ok
    if stale:
        print(f"\n_fragments-ok.txt: {len(stale)} entry(ies) no longer appear in "
              f"any script — delete them:")
        for s in sorted(stale):
            print(f"  {s}")

    n_sent = sum(len(B.split_sentences(p)) for ch in chapters for p in ch["paras"])
    print(f"\n{len(chapters)} chapters, {n_sent} sentences, "
          f"{len(allowed)} allowed fragment(s).")
    if problems_total or stale:
        print(f"FAIL — {problems_total + len(stale)} problem(s).")
        return 1
    print("clean.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
