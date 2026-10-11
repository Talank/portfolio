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
    # Not " three sum ": every voice runs it together into "threesome"
    # (Whisper hears exactly that, in every spelling tried).
    ("3Sum",       " three-number sum "),
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
    "LFU": "L F U", "GCD": "G C D",
    # FIFO and LIFO *are* words, and the note above used to conclude from that
    # they could be left alone. They cannot: left alone the voice says
    # "FIH-foh" and "LIFF-oh", and the field says "FY-foh" and "LY-foh".
    # Respelled into two real English words each, so the vowels are not a
    # guess — "fie" is /faɪ/ and "foe" is /foʊ/, which is exactly FIFO.
    "FIFO": "fie-foe", "LIFO": "lie-foe",
}

# Names the voice gets wrong. Usopp is "OO-sop" (Japanese uso, a lie); the
# voice reads the spelling as "YOO-sop", which Whisper writes "You stop".
# Respelled "Oosop", Whisper writes it back as "Usopp".
NAMES = {"Usopp": "Oosop",
         # Same trouble with two terms. deque is said "deck" (the Python docs
         # say so); the voice reads it "deek". inorder as one word comes out
         # as something like "innater" — Whisper's spelling of it.
         "deque": "deck", "deques": "decks", "Deque": "Deck",
         "inorder": "in-order", "preorder": "pre-order", "postorder": "post-order",
         # trie is said "try" here, as the Nepali edition says ट्राई. Read
         # "tree", "a tree like that is called a trie" says the same word twice.
         "trie": "try", "Trie": "Try"}
_NAMES = re.compile(r"\b(" + "|".join(NAMES) + r")\b")

_ACRO = re.compile(r"\b(" + "|".join(sorted(SPELL_OUT, key=len, reverse=True))
                   + r")\b")


_BIG_O_ANY = re.compile(r"\bO\(([^()]*)\)")
_BIG_O_SYMBOLS = (("²", " squared"), ("³", " cubed"), ("ⁿ", " to the n"),
                  ("^2", " squared"), ("·", " times "), ("×", " times "),
                  ("+", " plus "))


def _big_o_any(m):
    """Any O(...) the list above does not name, e.g. O(K) or O(n³), which the
    voice otherwise reads as a bracketed letter."""
    inner = m.group(1)
    for a, b in _BIG_O_SYMBOLS:
        inner = inner.replace(a, b)
    return " big oh of " + re.sub(r"\s+", " ", inner).strip() + " "


def to_spoken(text):
    for a, b in BIG_O:
        text = text.replace(a, b)
    text = _BIG_O_ANY.sub(_big_o_any, text)
    text = _ACRO.sub(lambda m: SPELL_OUT[m.group(1)], text)
    return _NAMES.sub(lambda m: NAMES[m.group(1)], text)


def all_keys():
    return set(k for k, _ in BIG_O) | set(SPELL_OUT)
