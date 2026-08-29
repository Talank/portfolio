#!/usr/bin/env python3
"""Execute every checkable claim the Pythonic passages make about Python.

Each pattern chapter now ends its `@tier medium` block with a passage saying how
that night's idea would actually be written — the idioms, and more importantly
the traps. Those passages assert things: that `pop(0)` is O(n), that `heapq` has
no max-heap, that `[[0]*m]*n` is one row with many names, that a negative number
shifted right never reaches zero. Every one of those is falsifiable, and none of
them is checked by the linters, which only ever look at the *shape* of a
sentence and never at whether it is true.

They are also the claims most likely to rot. `int.bit_count()` did not exist
before 3.10 and `functools.cache` did not exist before 3.9; dictionaries did not
promise insertion order before 3.7. A listener who types what they heard into an
older interpreter deserves to be told, and the only way to know is to run it.

So this file states each claim as an assertion and runs it. It is deliberately
written the way the passages talk — one line per claim, named after the chapter
that says it — so that a failure names the chapter whose script has to change.

    python3 check_python_claims.py           # all claims
    python3 check_python_claims.py -v        # print each as it passes
"""

import bisect
import collections
import functools
import heapq
import itertools
import sys
import timeit

CLAIMS = []


def claim(chapters, text):
    """Register one falsifiable sentence from the scripts."""
    def wrap(fn):
        CLAIMS.append((chapters, text, fn))
        return fn
    return wrap


# --- chapter 1: variables, loops, functions ---------------------------------

@claim("01", "a fallback list is made once, when the function is born")
def _default_arg():
    def f(x, seen=[]):
        seen.append(x)
        return seen
    f(1)
    return f(2) == [1, 2]


@claim("01 05 09 21", "the whole right side is worked out before anything is written")
def _tuple_assignment():
    a, b = 1, 2
    a, b = b, a
    return (a, b) == (2, 1)


@claim("01", "an empty list, empty text and zero all count as false by themselves")
def _falsiness():
    return not any([[], "", 0])


# --- chapter 2: big-O, and the language's own prices -------------------------

@claim("02 11 13 18", "the front of a row costs a walk; the back is free")
def _list_ends():
    front = timeit.timeit("l.pop(0)", "l=list(range(200_000))", number=20_000)
    back = timeit.timeit("l.pop()", "l=list(range(200_000))", number=20_000)
    return front > back * 3


@claim("02 03 26", "text cannot be edited once made, so adding to it copies")
def _str_immutable():
    try:
        "abc"[0] = "z"          # noqa: F821 — the point is that this raises
    except TypeError:
        return True
    return False


# --- chapter 3: arrays and strings ------------------------------------------

@claim("03 19 26", "a slice is a copy, which is why it is not free")
def _slice_copies():
    a = [1, 2, 3]
    b = a[:]
    b[0] = 9
    return a[0] == 1


@claim("03", "zero times n builds a row of n zeros")
def _repeat_row():
    return [0] * 5 == [0, 0, 0, 0, 0]


# --- chapter 4: the hash map -------------------------------------------------

@claim("04 20", "a list cannot be a heading; a tuple can")
def _hashability():
    try:
        {}[[1, 2]] = 1
    except TypeError:
        return hash((1, 2)) is not None
    return False


@claim("04", "a dictionary remembers the order things were put into it")
def _dict_order():
    return list({"b": 1, "a": 2}) == ["b", "a"]


@claim("04 06", "the language keeps a ready-made counter")
def _counter():
    return collections.Counter("aab")["a"] == 2


# --- chapter 5: two pointers -------------------------------------------------

@claim("05", "sorting in place hands back nothing at all")
def _sort_returns_none():
    return [3, 1, 2].sort() is None and sorted([3, 1, 2]) == [1, 2, 3]


@claim("05", "pairing two rows stops at the shorter one, silently")
def _zip_stops_short():
    return list(zip([1, 2, 3], [4, 5])) == [(1, 4), (2, 5)]


# --- chapter 7: prefix sums --------------------------------------------------

@claim("07", "there is a word that hands back the running totals")
def _accumulate():
    return list(itertools.accumulate([1, 2, 3])) == [1, 3, 6]


# --- chapter 8: binary search ------------------------------------------------

@claim("08", "the two halving tools bracket every copy of a value")
def _bisect_pair():
    row = [1, 2, 2, 3]
    return bisect.bisect_left(row, 2) == 1 and bisect.bisect_right(row, 2) == 3


@claim("08 25", "a whole number has no ceiling, so nothing can overflow")
def _unbounded_int():
    big = 2 ** 200
    return big + big > 0


@claim("08", "halving throws the fraction downwards, not towards zero")
def _floor_division():
    return -3 // 2 == -2


# --- chapters 14, 17, 20: the ceiling on depth -------------------------------

@claim("14 17 20", "a function may call itself about a thousand deep")
def _recursion_limit():
    return 900 <= sys.getrecursionlimit() <= 1100


# --- chapter 13: the two-ended line ------------------------------------------

@claim("13 18", "both ends of the two-ended line are free")
def _deque_ends():
    d = collections.deque([1, 2])
    return d.popleft() == 1 and d.pop() == 2


@claim("13", "it can be told how long it is allowed to be")
def _deque_maxlen():
    d = collections.deque([1, 2], maxlen=2)
    d.append(3)
    return list(d) == [2, 3]


# --- chapter 16: the heap ----------------------------------------------------

@claim("16", "it is a smallest-first heap, and there is no largest-first one")
def _min_heap_only():
    h = [5, 1, 3]
    heapq.heapify(h)
    return heapq.heappop(h) == 1 and not hasattr(heapq, "heappop_max")


@claim("16", "tied first parts force a comparison that can stop the program")
def _heap_tie_crash():
    h = []
    try:
        heapq.heappush(h, (1, object()))
        heapq.heappush(h, (1, object()))
    except TypeError:
        return True
    return False


@claim("16", "the biggest K can be asked for directly")
def _nlargest():
    return heapq.nlargest(2, [1, 9, 5]) == [9, 5]


# --- chapter 20: memoisation is one line -------------------------------------

@claim("20", "one line above the function makes the naive recursion linear")
def _cache_linearises():
    calls = [0]

    @functools.cache
    def fib(n):
        calls[0] += 1
        return n if n < 2 else fib(n - 1) + fib(n - 2)

    fib(20)
    return calls[0] == 21


@claim("20", "the remembered headings must be things that cannot change")
def _cache_needs_hashable():
    @functools.cache
    def f(x):
        return x
    try:
        f([1])
    except TypeError:
        return True
    return False


# --- chapter 21: the worst trap in the language ------------------------------

@claim("21", "repeating a row makes one row with many names")
def _row_aliasing():
    grid = [[0] * 2] * 3
    grid[0][0] = 9
    return grid[1][0] == 9


@claim("21", "saying it once per row makes rows that are genuinely separate")
def _rows_are_real():
    grid = [[0] * 2 for _ in range(3)]
    grid[0][0] = 9
    return grid[1][0] == 0


# --- chapter 22: greedy sorts ------------------------------------------------

@claim("22", "things tied under the rule come out in the order they went in")
def _sort_is_stable():
    data = [("b", 1), ("a", 1), ("c", 0)]
    return [x[0] for x in sorted(data, key=lambda t: t[1])] == ["c", "b", "a"]


@claim("22", "a genuine two-sided comparison can be turned into a rule")
def _cmp_to_key():
    return sorted([3, 1, 2], key=functools.cmp_to_key(lambda a, b: a - b)) == [1, 2, 3]


# --- chapter 24: the trie ----------------------------------------------------

@claim("24", "asking for a page and making it are one word")
def _setdefault_walk():
    node = {}
    node.setdefault("c", {}).setdefault("a", {})
    return "a" in node["c"]


@claim("24", "a notebook whose missing pages are notebooks of the same kind")
def _self_describing_trie():
    Trie = lambda: collections.defaultdict(Trie)   # noqa: E731 — the whole point
    t = Trie()
    t["c"]["a"]["r"]
    return "r" in t["c"]["a"]


# --- chapter 25: zero and one ------------------------------------------------

@claim("25", "joining a number with its own negative leaves the lowest one alone")
def _lowest_set_bit():
    return 12 & -12 == 4


@claim("25", "how many ones a number carries can be asked of the number itself")
def _bit_count():
    return (5).bit_count() == 2


@claim("25", "a negative shifted right never reaches zero")
def _negative_shift():
    return (-1) >> 1 == -1


@claim("25", "masking is what draws the thirty-two-place edge yourself")
def _masking():
    return (-1) & 0xFFFFFFFF == 4294967295


def main():
    verbose = "-v" in sys.argv or "--verbose" in sys.argv
    failed = []
    for chapters, text, fn in CLAIMS:
        try:
            ok = fn()
        except Exception as exc:                      # noqa: BLE001
            ok, text = False, f"{text}  [raised {exc!r}]"
        if ok:
            if verbose:
                print(f"  ok   ch{chapters}: {text}")
        else:
            failed.append((chapters, text))
    print()
    for chapters, text in failed:
        print(f"  FAILED ch{chapters}: {text}")
    print(f"{len(CLAIMS)} claims checked on Python "
          f"{'.'.join(str(v) for v in sys.version_info[:3])}, {len(failed)} failed.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
