#!/usr/bin/env python3
"""Lint the ACLS bedtime scripts before spending an hour of TTS on them.

The shared linter's two checks — every sentence ends in a real predicate, every
chapter's method is recited at least three times inside the core tier — are the
right checks here too. Its test for a predicate is not: it looks for Nepali verb
endings, and would call every English sentence in this voyage a fragment.

So `is_finite` is replaced with one that asks the question in whichever language
the sentence is written in, and three checks that only this course needs are
added on top:

  * **Script purity.** A span read by the Nepali voice must be Devanagari and a
    span read by the English voice must not be. Getting this wrong is not a
    typo you can hear as a typo: an en-IN voice hands back *no audio at all* for
    Devanagari, and a ne-NP voice reads a Latin sentence by guessing at the
    spelling. Both fail quietly, hours into a render.

  * **Unspelled acronyms.** Any capitalised run of letters the English voice
    will meet that acls_words.py does not know about. "SVT" said as a word is
    the one thing this course cannot afford, because the whole reason it is in
    English is to protect the terms.

  * **Unit abbreviations.** The scripts write "one hundred and twenty
    milliseconds", never "120 ms". An abbreviation is a pronunciation problem
    that the prose can simply decline to have, and the only way that rule stays
    true across twenty-six chapters is if something checks.

Usage:  python3 check_bedtime.py [--verbose]
"""
import importlib.util
import os
import re
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
profile = _load(os.path.join(HERE, "build_bedtime.py"), "acls_bedtime_profile")
B = profile.E
C = _load(os.path.join(profile.ENGINE_DIR, "check_bedtime.py"),
          "acls_bedtime_check")
acls_words = profile.acls_words

DEVANAGARI = re.compile(r"[ऀ-ॿ]")

# ---------------------------------------------------------------------------
# Does this English sentence have a predicate?
# ---------------------------------------------------------------------------
#
# There is no suffix rule for English the way there is for Nepali — "-s" is the
# third person singular and also the plural of every noun in the vocabulary
# ("beats", "leads", "boxes", "complexes"), so a suffix test would pass every
# noun phrase in the course. What is left is a list, and a list is honest about
# what it is: these are the finite forms and bare forms this prose actually
# uses, and the linter complaining about a verb that is missing from it is the
# correct way to find out that it is missing.
AUX = {
    "am", "is", "are", "was", "were", "be", "been", "being",
    "has", "have", "had",
    "do", "does", "did",
    "will", "would", "shall", "should", "can", "could", "may", "might",
    "must", "ought", "cannot",
    "isn't", "aren't", "wasn't", "weren't", "hasn't", "haven't", "hadn't",
    "doesn't", "don't", "didn't", "won't", "can't", "couldn't", "shouldn't",
    "wouldn't", "mustn't", "let's", "there's", "it's", "that's", "here's",
    "what's", "he's", "she's", "you're", "they're", "we're", "i'm", "you'll",
    "you've", "i've",
}

# Bare form and third person singular and past, together. Grouped by what they
# are for, so the list can be argued with rather than trusted.
_STEMS = """
    look listen watch see hear feel notice find lose keep hold take give put
    set get let make made do go come sit stand walk run stop start begin end
    turn move drop rise fall wait rest sleep breathe close open think know
    learn remember forget imagine picture ask answer tell say speak explain
    point show draw trace read write count measure mark name call follow lead
    check compare judge decide choose pick treat shock press pace push pull
    carry travel spread reach return repeat vary differ agree depend belong
    happen matter work change stay live die help mean want need arrive leave
    appear disappear become widen narrow lengthen shorten slow quicken march
    conduct block fire beat pump fill empty squeeze relax settle wake wander
    climb sink drift hang land sound stretch shrink split join swap sweep
    scan skip pause resume finish miss catch bring send jump race collapse
    fail recover survive practise practice
    wire deliver cover divide multiply add subtract equal contain include
    remain continue remove replace produce cause suggest indicate confirm
    exclude rule allow prevent protect damage injure starve feed supply
    delay hurry rush quicken halve double triple print tear lay slide press
    tap touch lift lower raise fill empty squeeze grip relax reset spark leak
    build creep crawl race twist flip invert bury hide reveal vanish last
    cost gain save kill breathe cough sigh shift hum beep sound seem
    stay hand pass borrow lend teach train drill test prove disprove
    argue insist accept refuse forgive apologise deserve earn owe
    count march step walk trot amble wobble jerk shake tremble shiver
    settle steady balance align stack gather scatter spread thin thicken
    sharpen blunt smooth flatten curve bend straighten
    guess assume expect predict trust doubt wonder worry fear panic calm
    arrive depart enter exit approach retreat wait linger hesitate
    open shut lock unlock switch flick dim brighten
    wash clean wipe dry warm cool freeze burn melt
    describe define explain repeat rehearse recite memorise
    identify recognise recognize name label mark note record chart write
    order request prescribe give administer draw push infuse titrate
    monitor observe assess evaluate reassess review revisit
    ventilate compress defibrillate cardiovert intubate cannulate
    resuscitate stabilise stabilize transfer admit discharge
    """.split()

_IRREGULAR = {
    "go": ("goes", "went", "gone"),
    "come": ("comes", "came"),
    "see": ("sees", "saw", "seen"),
    "do": ("does", "did", "done"),
    "make": ("makes", "made"),
    "take": ("takes", "took", "taken"),
    "give": ("gives", "gave", "given"),
    "get": ("gets", "got"),
    "put": ("puts",),
    "set": ("sets",),
    "let": ("lets",),
    "hold": ("holds", "held"),
    "keep": ("keeps", "kept"),
    "find": ("finds", "found"),
    "lose": ("loses", "lost"),
    "feel": ("feels", "felt"),
    "hear": ("hears", "heard"),
    "tell": ("tells", "told"),
    "say": ("says", "said"),
    "speak": ("speaks", "spoke", "spoken"),
    "think": ("thinks", "thought"),
    "know": ("knows", "knew", "known"),
    "forget": ("forgets", "forgot", "forgotten"),
    "read": ("reads",),
    "write": ("writes", "wrote", "written"),
    "draw": ("draws", "drew", "drawn"),
    "run": ("runs", "ran"),
    "begin": ("begins", "began", "begun"),
    "rise": ("rises", "rose", "risen"),
    "fall": ("falls", "fell", "fallen"),
    "stand": ("stands", "stood"),
    "sit": ("sits", "sat"),
    "leave": ("leaves", "left"),
    "become": ("becomes", "became"),
    "mean": ("means", "meant"),
    "bring": ("brings", "brought"),
    "send": ("sends", "sent"),
    "catch": ("catches", "caught"),
    "sink": ("sinks", "sank", "sunk"),
    "sweep": ("sweeps", "swept"),
    "split": ("splits",),
    "shrink": ("shrinks", "shrank"),
    "choose": ("chooses", "chose", "chosen"),
    "lead": ("leads", "led"),
    "die": ("dies", "died"),
    "carry": ("carries", "carried"),
    "vary": ("varies", "varied"),
    "try": ("tries", "tried"),
    "hang": ("hangs", "hung"),
}


def _forms(stem):
    """Every finite form of a regular verb: bare, third singular, past."""
    out = {stem}
    if stem in _IRREGULAR:
        out.update(_IRREGULAR[stem])
        return out
    if stem.endswith(("s", "x", "z", "ch", "sh")):
        out.add(stem + "es")
    elif stem.endswith("y") and stem[-2:-1] not in "aeiou":
        out.add(stem[:-1] + "ies")
    else:
        out.add(stem + "s")
    if stem.endswith("e"):
        out.add(stem + "d")
    elif stem.endswith("y") and stem[-2:-1] not in "aeiou":
        out.add(stem[:-1] + "ied")
    else:
        out.add(stem + "ed")
    return out


VERBS = set(AUX)
for _s in _STEMS:
    VERBS |= _forms(_s)
for _s, _f in _IRREGULAR.items():
    VERBS.add(_s)
    VERBS.update(_f)
# Extras that no stem rule produces, and a few one-off past forms.
VERBS |= {"stopped", "dropped", "slowed", "settled", "married", "beat",
          "spread", "cost", "hit", "shut", "cut", "let", "read", "put", "set",
          "run", "won", "meant", "held", "kept", "told", "said", "made",
          "matters", "mattered", "counts", "counted"}

_WORD = re.compile(r"[A-Za-z][A-Za-z'’]*")


def _english_is_finite(sent):
    words = {w.lower().replace("’", "'") for w in _WORD.findall(sent)}
    return bool(words & VERBS)


_orig_is_finite = C.is_finite

# Words that can only open a subordinate clause. A verbless English sentence
# beginning with one of these is the accident the check is looking for: a
# clause that was meant to be attached to the sentence before it and lost its
# main verb somewhere in an edit.
SUBORDINATORS = {
    "because", "although", "though", "while", "whereas", "since", "unless",
    "until", "whenever", "wherever", "when", "after", "before", "as",
    "which", "who", "whom", "whose", "whether", "so",
}


def is_finite(sent):
    """Ask the predicate question in the language the sentence is written in.

    The shared check exists because a verbless Nepali clause, given its own
    clip and silence on both sides, lands as a sentence that got cut off. That
    is true of Nepali and it is *not* true of English, where a clipped phrase is
    an ordinary rhetorical unit and reads as deliberate — "Squares." "Now up."
    "Slower, and slower." Written prose does this constantly, and a bedtime
    reading wants it: the short beat is what stops a chapter of explanation from
    sounding like a document.

    So the English half of this voyage is judged two ways instead of one. A
    verbless sentence that opens with a subordinator is reported here, always,
    because that is what a dropped main clause looks like. Everything else is
    allowed to pass one at a time and is counted instead — see fragment_density
    below, which is the check that actually holds the prose to account.

    The Nepali spans keep the strict rule unchanged. The reason it was written
    still applies to them.
    """
    if DEVANAGARI.search(sent):
        return _orig_is_finite(sent)
    if _english_is_finite(sent):
        return True
    first = (_WORD.search(sent) or [""])[0].lower()
    return first not in SUBORDINATORS


C.is_finite = is_finite

# Share of a chapter's English sentences that may be verbless before the
# chapter stops reading like a story and starts reading like notes. Measured
# against the chapters that were written before this check existed: the prologue
# runs at 4%, the two teaching-heavy chapters at 9% and 11%, and a chapter that
# had drifted into bullet points came out above 20%.
FRAGMENT_BUDGET = 0.14


def fragment_density(chapters):
    """Chapters leaning on the short beat harder than prose can carry."""
    over = []
    for ch in chapters:
        # Distinct sentences, because load_chapters has already expanded the
        # @recall blocks and a method spoken three times is one decision the
        # author made, not three. Counting the repeats would make any chapter
        # whose method ends on a short mnemonic look like notes.
        seen, frags, total = set(), [], 0
        for raw in ch["paras"]:
            for sent in B.split_sentences(B.strip_marks(raw)):
                if DEVANAGARI.search(sent) or sent in seen:
                    continue
                seen.add(sent)
                total += 1
                if not _english_is_finite(sent):
                    frags.append(sent)
        if total and len(frags) / total > FRAGMENT_BUDGET:
            over.append((ch["file"], len(frags), total, frags))
    return over

# ---------------------------------------------------------------------------
# The checks that are only this course's
# ---------------------------------------------------------------------------

NE_STYLES = {"ne", "ne_hush", "ne_steady"}

# Abbreviations the prose is not allowed to use, because a voice reading them
# aloud is a coin toss. The replacement is always the same: write the words.
BANNED_UNITS = re.compile(
    r"(?<![A-Za-z])(ms|mV|mm|cm|sec|secs|min|mins|bpm|mg|mcg|kg|mmHg|mA"
    # J is joules, except in "J point", which is the corner where the QRS ends
    # and is spelled that way in every textbook the listener will ever open.
    r"|J(?! point))(?![A-Za-z])")

# A capitalised run the English voice will have to say. Two letters minimum:
# a lone "P" or "T" is a wave name and is read correctly as a letter anyway.
CAPS = re.compile(r"(?<![A-Za-z])([A-Z][A-Za-z]*[A-Z][A-Za-z0-9]*)(?![a-z])")

# Capitalised words that are simply words — the start of a sentence, a name, a
# mnemonic spelled in capitals for the page rather than for the voice.
CAPS_OK = {"I", "A", "OK", "CPR", "AND", "OR", "NOT", "BE", "FAST", "MONA",
           "ANOM", "HS", "TS"}


def script_checks(chapters):
    """Script purity, unspelled acronyms, banned unit abbreviations."""
    problems = []
    for ch in chapters:
        for spans in ch["spans"]:
            for text, style in spans:
                base = style.partition(":")[0]
                has_dev = bool(DEVANAGARI.search(text))
                if base in NE_STYLES and not has_dev:
                    problems.append((ch["file"], "no-nepali-in-ne-span", text))
                if base in NE_STYLES:
                    # Latin is allowed inside a Nepali line only where
                    # acls_words.NE_TERMS knows how to respell it — anything
                    # else reaches a Nepali voice as letters it cannot read.
                    rest = acls_words.to_nepali_terms(text)
                    stray = re.findall(r"[A-Za-z]{2,}", rest)
                    if stray:
                        problems.append((ch["file"], "untranslated-term",
                                         ", ".join(sorted(set(stray)))
                                         + "  in: " + text[:90]))
                if base not in NE_STYLES and has_dev:
                    problems.append((ch["file"], "devanagari-in-english", text))
                if base in NE_STYLES:
                    continue
                for m in BANNED_UNITS.finditer(text):
                    problems.append((ch["file"], "abbreviated-unit",
                                     m.group(0) + "  in: " + text[:90]))
                for m in CAPS.finditer(text):
                    tok = m.group(1)
                    if tok in CAPS_OK or tok in acls_words.all_keys():
                        continue
                    problems.append((ch["file"], "unspelled-acronym",
                                     tok + "  in: " + text[:90]))
    return problems


def table_check():
    """Entries in acls_words.py that no script uses any more."""
    return sorted(acls_words.all_keys() - acls_words.used())


def main():
    verbose = "--verbose" in sys.argv
    rc = C.main()

    chapters = B.load_chapters(tier="long")

    heavy = fragment_density(chapters)
    if heavy:
        print(f"\nfragment density — {len(heavy)} chapter(s) over "
              f"{FRAGMENT_BUDGET:.0%}")
        for f, n, total, frags in heavy:
            print(f"  {f}  {n}/{total} sentences have no verb "
                  f"({100.0 * n / total:.0f}%)")
            for s in (frags if verbose else frags[:8]):
                print(f"      {s[:110]}")
        rc = 1

    problems = script_checks(chapters)
    if problems:
        print(f"\nACLS-specific — {len(problems)} problem(s)")
        shown = problems if verbose else problems[:20]
        for f, kind, text in shown:
            print(f"  {f}  [{kind}] {text[:150]}")
        if len(shown) < len(problems):
            print(f"  … and {len(problems) - len(shown)} more (--verbose)")
        rc = 1

    # After load_chapters, so to_speakable has run over every clip and the
    # table knows which of its entries were reached.
    for ch in chapters:
        for spans in ch["spans"]:
            for text, style in spans:
                B.to_speakable(text)
    stale = table_check()
    if stale:
        print(f"\nacls_words.py: {len(stale)} entry(ies) no script uses — "
              f"delete them or start using them:")
        print("  " + ", ".join(stale))

    ne = sum(1 for ch in chapters for spans in ch["spans"]
             for _, s in spans if s.partition(":")[0] in NE_STYLES)
    total = sum(len(spans) for ch in chapters for spans in ch["spans"])
    if total:
        print(f"\nlanguage mix: {ne} of {total} spans are Nepali "
              f"({100.0 * ne / total:.0f}%).")
    return rc


if __name__ == "__main__":
    sys.exit(main())
