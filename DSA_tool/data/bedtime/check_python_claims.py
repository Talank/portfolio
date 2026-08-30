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
import random
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


# --- chapter 21: the stone game, where the table disappears ------------------
#
# The passage at the end of the twenty-first island claims things about a game,
# not about the interpreter, and a linter can see the truth of those exactly as
# well as it can see the truth of the rest of this file — not at all. A wrong
# number read aloud at night is still a wrong number, so they are run too.


def _stone_brute(row):
    """Play it exactly as the rules say, on the literal row. The oracle."""
    @functools.lru_cache(maxsize=None)
    def go(arr):
        if len(arr) == 1:
            return 0
        return max(sum(arr[:x]) - go((sum(arr[:x]),) + arr[x:])
                   for x in range(2, len(arr) + 1))
    return go(tuple(row))


def _stone_fast(row):
    """The one walk backwards down the row: O(n) time, one number of room."""
    n = len(row)
    pre = [0] * (n + 1)
    for i, v in enumerate(row):
        pre[i + 1] = pre[i] + v
    f = pre[n]
    for j in range(n - 2, 0, -1):
        f = max(pre[j + 1] - f, f)
    return f


def _stone_rows(seed, n_lo, n_hi, v_lo, v_hi, count):
    rng = random.Random(seed)
    return [[rng.randint(v_lo, v_hi) for _ in range(rng.randint(n_lo, n_hi))]
            for _ in range(count)]


@claim("21", "the one walk backwards agrees with playing the game out in full")
def _stone_matches_oracle():
    return all(_stone_fast(r) == _stone_brute(r)
               for r in _stone_rows(1872, 2, 8, -8, 8, 300))


@claim("21", "three stones of minus four leave the first player four ahead")
def _stone_all_debts():
    return _stone_brute([-4, -4, -4]) == 4 and sum([-4, -4, -4]) == -12


@claim("21", "if every stone is worth having, taking the lot is the whole answer")
def _stone_all_positive():
    return all(_stone_fast(r) == sum(r)
               for r in _stone_rows(23, 2, 40, 1, 50, 400))


@claim("21", "after any move the front stone is the running total, and the tail is untouched")
def _stone_state_collapses():
    for row in _stone_rows(7, 2, 8, -9, 9, 300):
        pre = [0] * (len(row) + 1)
        for i, v in enumerate(row):
            pre[i + 1] = pre[i] + v
        rng = random.Random(len(row))
        board, j = list(row), 1
        while len(board) > 1:
            y = rng.randint(2, len(board))
            board, j = [sum(board[:y])] + board[y:], j + y - 1
            if board[0] != pre[j] or board[1:] != row[j:]:
                return False
    return True


@claim("21", "the two-way weighing equals the full maximum over every later place")
def _stone_telescopes():
    def full(row):
        n = len(row)
        pre = [0] * (n + 1)
        for i, v in enumerate(row):
            pre[i + 1] = pre[i] + v
        f = [0] * (n + 1)
        for j in range(n - 1, 0, -1):
            f[j] = max(pre[k] - f[k] for k in range(j + 1, n + 1))
        return f[1]
    return all(full(r) == _stone_fast(r) for r in _stone_rows(11, 2, 9, -9, 9, 300))


@claim("21", "letting the walk run one step further changes about one row in eight")
def _stone_off_by_one():
    def too_far(row):
        n = len(row)
        pre = [0] * (n + 1)
        for i, v in enumerate(row):
            pre[i + 1] = pre[i] + v
        f = pre[n]
        for j in range(n - 2, -1, -1):
            f = max(pre[j + 1] - f, f)
        return f
    rows = _stone_rows(13, 2, 9, -9, 9, 600)
    wrong = sum(too_far(r) != _stone_fast(r) for r in rows)
    return 0.05 < wrong / len(rows) < 0.25


@claim("21", "writing the totals over the stones eats the caller's row")
def _stone_in_place_mutates():
    def in_place(stones):
        n = len(stones)
        for i in range(1, n):
            stones[i] += stones[i - 1]
        f = stones[n - 1]
        for j in range(n - 2, 0, -1):
            f = max(stones[j] - f, f)
        return f
    mine = [-1, 2, -3, 4, -5]
    answer = in_place(mine)
    return answer == 5 and mine == [-1, 1, -2, 2, -3]


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
