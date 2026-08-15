"""How the English narrator says the notation.

The engine's own pronunciation table respells everything into Devanagari for a
Nepali voice. An English voice needs the opposite service: it already knows the
words, and only the *notation* has to be turned into words, because "O(n log n)"
read literally comes out as a bracket.

Ordered longest-first. "O(n log n)" has to be matched before "O(n)", or the
tail of it is left behind as a stray "log n)".
"""
import re

BIG_O = [
    ("O(n log K)", " big oh of n log k "),
    ("O(n log n)", " big oh of n log n "),
    ("O(V + E)",   " big oh of v plus e "),
    ("O(log n)",   " big oh of log n "),
    ("O(n²)",      " big oh of n squared "),
    ("O(n^2)",     " big oh of n squared "),
    ("O(2ⁿ)",      " big oh of two to the n "),
    ("O(n·m)",     " big oh of n times m "),
    ("O(n)",       " big oh of n "),
    ("O(1)",       " big oh of one "),
    ("O(k)",       " big oh of k "),
    ("O(m)",       " big oh of m "),
    ("3Sum",       " three sum "),
    ("n-1",        " n minus one "),
    ("n+1",        " n plus one "),
    ("i+1",        " i plus one "),
    ("n-2",        " n minus two "),
]

# Acronyms an English voice would otherwise try to pronounce as a word. Only the
# ones where it actually gets it wrong: it says "API" letter by letter without
# help, but it says "BFS" as a word-shaped noise, and "DAG" and "FIFO" *are*
# words and should stay that way.
SPELL_OUT = {
    "BFS": "B F S", "DFS": "D F S", "BST": "B S T", "DP": "D P",
    "XOR": "ex or", "LRU": "L R U", "AVL": "A V L", "LIS": "L I S",
}

_ACRO = re.compile(r"\b(" + "|".join(sorted(SPELL_OUT, key=len, reverse=True))
                   + r")\b")


def to_spoken(text):
    for a, b in BIG_O:
        text = text.replace(a, b)
    text = _ACRO.sub(lambda m: SPELL_OUT[m.group(1)], text)
    return text


def all_keys():
    return set(k for k, _ in BIG_O) | set(SPELL_OUT)
