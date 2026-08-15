#!/usr/bin/env python3
"""Lint the English edition of the bedtime voyage before spending TTS on it.

The Nepali linter beside this one cannot be reused: its whole fragment test is
a table of Nepali verb endings, and its purity check wants Devanagari to be
present. This one asks the same two questions in the other language.

  1. **Fragments.** A verbless clause given its own clip, with silence on both
     sides, can land as a sentence that got cut off. In Nepali that is always
     wrong. In English it often is not — "Squares." "Now up." — because a
     clipped phrase is an ordinary beat in written prose and reads as
     deliberate. So English is judged two ways: a verbless sentence *opening
     with a subordinator* is always reported, because that is what a dropped
     main clause looks like; everything else is counted against a density
     budget per chapter.

  2. **The method said once.** Same as the Nepali edition, and the engine's own
     recital counter does the work.

It also checks the two things specific to having two editions in one directory:
that no Devanagari survived the translation, and that the two editions are
structurally parallel — same chapters, same @algo ids in the same order — since
a tier that exists in one edition and not the other would silently give the two
languages different chapter lists.

Usage:  python3 check_bedtime_en.py [--verbose]
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


# Loading the profile is what points the engine at script-en/. It has to happen
# before anything reads B.SCRIPT_DIR.
profile = _load(os.path.join(HERE, "build_bedtime_en.py"), "dsa_bedtime_en_profile")
B = profile.E

DEVANAGARI = re.compile(r"[ऀ-ॿ]")

# ---------------------------------------------------------------------------
# Does this English sentence have a predicate?
# ---------------------------------------------------------------------------
#
# A word list rather than a parser. It only has to be good enough to tell a
# sentence from a noun phrase, and a parser would be a dependency for a check
# that runs in half a second.
AUX = {
    "is", "are", "was", "were", "be", "been", "being", "am",
    "do", "does", "did", "have", "has", "had", "having",
    "can", "could", "will", "would", "shall", "should", "may", "might", "must",
    "cannot", "let", "there's", "it's", "that's", "here's", "what's",
}

# Stems that actually occur in these scripts, in the sense they occur in.
_STEMS = """
ask answer add arrive begin break bring build call carry change check choose
close come compare cost count cover cut decide depend divide do draw drop end
enter fall feel fill find finish fit fix follow forget get give go grow hand
hang happen have hear help hide hold join jump keep know land learn leave lift
listen live look lose make mark match matter mean measure meet move name need
note notice open pass pick place play point pull push put reach read remember
remove repeat return rise run say search see seem sell send set shift show shut
sink sit sleep sort sound speak spend split spread stand start stay step stop
take talk teach tell think throw touch try turn understand use wait walk want
watch win work write
appear apply arrange believe belong climb collect connect continue create
describe disappear exist expect explain fail feed form gather guess imagine
include increase insert judge last list load lock merge mix offer order pay
prefer prepare press produce prove raise reduce refuse remain repair replace
require rest save scatter settle share shine skip solve spill stick store
stretch suggest support sway swap sweep switch tie trust visit wake wash waste
wear wonder worry wrap
""".split()

_IRREGULAR = {
    "begin": ("begins", "began", "begun"), "break": ("breaks", "broke", "broken"),
    "bring": ("brings", "brought"), "build": ("builds", "built"),
    "buy": ("buys", "bought"), "catch": ("catches", "caught"),
    "choose": ("chooses", "chose", "chosen"), "come": ("comes", "came"),
    "cut": ("cuts",), "do": ("does", "did", "done"), "draw": ("draws", "drew"),
    "drop": ("drops", "dropped"), "fall": ("falls", "fell", "fallen"),
    "feel": ("feels", "felt"), "find": ("finds", "found"),
    "forget": ("forgets", "forgot", "forgotten"), "get": ("gets", "got"),
    "give": ("gives", "gave", "given"), "go": ("goes", "went", "gone"),
    "grow": ("grows", "grew", "grown"), "hang": ("hangs", "hung"),
    "have": ("has", "had"), "hear": ("hears", "heard"), "hide": ("hides", "hid"),
    "hold": ("holds", "held"), "keep": ("keeps", "kept"),
    "know": ("knows", "knew", "known"), "lead": ("leads", "led"),
    "leave": ("leaves", "left"), "lose": ("loses", "lost"),
    "make": ("makes", "made"), "mean": ("means", "meant"),
    "meet": ("meets", "met"), "put": ("puts",), "read": ("reads",),
    "rise": ("rises", "rose", "risen"), "run": ("runs", "ran"),
    "say": ("says", "said"), "see": ("sees", "saw", "seen"),
    "sell": ("sells", "sold"), "send": ("sends", "sent"), "set": ("sets",),
    "shut": ("shuts",), "sink": ("sinks", "sank", "sunk"), "sit": ("sits", "sat"),
    "sleep": ("sleeps", "slept"), "speak": ("speaks", "spoke", "spoken"),
    "spend": ("spends", "spent"), "split": ("splits",), "spread": ("spreads",),
    "stand": ("stands", "stood"), "stop": ("stops", "stopped"),
    "take": ("takes", "took", "taken"), "teach": ("teaches", "taught"),
    "tell": ("tells", "told"), "think": ("thinks", "thought"),
    "throw": ("throws", "threw", "thrown"),
    "understand": ("understands", "understood"),
    "win": ("wins", "won"), "write": ("writes", "wrote", "written"),
    "carry": ("carries", "carried"), "try": ("tries", "tried"),
}


def _forms(stem):
    """Every finite form of a regular verb: bare, third singular, past."""
    if stem in _IRREGULAR:
        return {stem} | set(_IRREGULAR[stem])
    out = {stem}
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

_WORD = re.compile(r"[A-Za-z][A-Za-z'’]*")

# Words that can only open a subordinate clause. A verbless English sentence
# starting with one of these is the accident this is looking for: a clause that
# was meant to hang off the sentence before it and lost its main verb in an edit.
SUBORDINATORS = {
    "because", "although", "though", "while", "whereas", "since", "unless",
    "until", "whenever", "wherever", "when", "after", "before",
    "which", "who", "whom", "whose", "whether",
}


def _has_verb(sent):
    words = {w.lower().replace("’", "'") for w in _WORD.findall(sent)}
    return bool(words & VERBS)


def is_finite(sent):
    if _has_verb(sent):
        return True
    first = (_WORD.search(sent) or [""])[0].lower()
    return first not in SUBORDINATORS


# Share of a chapter's sentences that may be verbless before the chapter stops
# reading like a story and starts reading like notes.
FRAGMENT_BUDGET = 0.14

# The crew who actually speak in this edition, plus the engine's delivery
# registers. A span naming anything else is a typo that would be read in the
# narrator's voice without any warning.
CAST = {"luffy", "zoro", "nami", "usopp", "sanji", "chopper", "robin", "franky",
        "brook"}
REGISTERS = {"narrator", "steady", "teach", "hush", "whisper", "aside", "warm",
             "lift", "wonder", "slow"}


def main():
    verbose = "--verbose" in sys.argv
    chapters = B.load_chapters(tier="long")
    problems_total = 0
    density = []

    for ch in chapters:
        problems = []
        n_sent = n_frag = 0

        for raw in ch["paras"]:
            para = B.strip_marks(raw)
            if DEVANAGARI.search(para):
                problems.append(("devanagari", para[:120]))
            for sent in B.split_sentences(para):
                n_sent += 1
                if not _has_verb(sent):
                    n_frag += 1
                if not is_finite(sent):
                    problems.append(("dropped-clause", sent))
            if (para.count('"') % 2) or (para.count("“") != para.count("”")):
                problems.append(("open-quote", para[:120]))

        for spans in ch["spans"]:
            for _, style in spans:
                base = style.split(":")[0]
                if base not in CAST and base not in REGISTERS:
                    problems.append(("uncast-voice", base))

        counts = C_recitals(ch["path"])
        if not counts:
            problems.append(("no-algo", "chapter defines no @algo block"))
        for name, tiers in sorted(counts.items()):
            core = tiers.get("core", 0)
            if core < B.MIN_RECITALS:
                problems.append(
                    ("thin", f"@algo {name}: {core} recital(s) in the core tier, "
                             f"wanted {B.MIN_RECITALS}"))

        if n_sent:
            density.append((n_frag / n_sent, n_frag, n_sent, ch["file"]))

        if problems:
            problems_total += len(problems)
            print(f"\n{ch['file']}  — {len(problems)} problem(s)")
            shown = problems if verbose else problems[:12]
            for kind, text in shown:
                print(f"  [{kind}] {text[:160]}")
            if len(shown) < len(problems):
                print(f"  … and {len(problems) - len(shown)} more (--verbose)")

    over = [d for d in density if d[0] > FRAGMENT_BUDGET]
    for share, n_frag, n_sent, name in sorted(over, reverse=True):
        problems_total += 1
        print(f"\n{name}: {share:.0%} of sentences are verbless "
              f"({n_frag}/{n_sent}), budget {FRAGMENT_BUDGET:.0%}")

    styles = {}
    for ch in chapters:
        for spans in ch["spans"]:
            for _, style in spans:
                styles[style] = styles.get(style, 0) + 1
    voiced = {k: v for k, v in styles.items() if k not in ("narrator", "steady")}
    if voiced:
        print("\nperformance marks: "
              + "  ".join(f"{k} {v}" for k, v in sorted(voiced.items(),
                                                        key=lambda kv: -kv[1])))

    n_sent = sum(len(B.split_sentences(B.strip_marks(p)))
                 for ch in chapters for p in ch["paras"])
    print(f"\n{len(chapters)} chapters, {n_sent} sentences.")

    # The two editions have to stay parallel: same chapters, same @algo ids in
    # the same order. A tier marker that exists in one and not the other would
    # give the two languages different chapter lists for the same tier.
    ne_dir = os.path.join(HERE, "script")
    for ch in chapters:
        twin = os.path.join(ne_dir, os.path.basename(ch["path"]))
        if not os.path.exists(twin):
            problems_total += 1
            print(f"no Nepali twin for {ch['file']}")
            continue
        a = re.findall(r"@(algo|recall|tier) (\S+)", open(twin, encoding="utf-8").read())
        b = re.findall(r"@(algo|recall|tier) (\S+)",
                       open(ch["path"], encoding="utf-8").read())
        if a != b:
            problems_total += 1
            print(f"structure differs from the Nepali edition: {ch['file']}")

    print("clean." if not problems_total
          else f"\n{problems_total} problem(s).")
    return 1 if problems_total else 0


def C_recitals(path):
    """Recitals of each @algo per tier — the engine's own rule, restated.

    Not imported from the Nepali linter because importing that module would
    read its own _fragments-ok.txt against this edition's script directory.
    """
    tier = "core"
    counts = {}
    for line in open(path, encoding="utf-8"):
        s = line.strip()
        if s.startswith("@tier "):
            tier = s.split(None, 1)[1].strip()
        elif s.startswith("@algo "):
            name = s.split(None, 1)[1].strip()
            counts.setdefault(name, {}).setdefault(tier, 0)
            counts[name][tier] += 1
        elif s.startswith("@recall "):
            name = s.split(None, 1)[1].strip()
            counts.setdefault(name, {}).setdefault(tier, 0)
            counts[name][tier] += 1
    return counts


if __name__ == "__main__":
    sys.exit(main())
