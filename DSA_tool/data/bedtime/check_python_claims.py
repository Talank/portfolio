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


# --- the third linked problem in each pattern chapter (2026-10) ---------------
#
# One medium or hard problem per pattern chapter, in the long tier. Each one is
# solved here the way the passage describes it, and every example the passage
# says out loud is asserted against that solution — a wrong number spoken at
# night is still a wrong number.

def _first_missing_positive(a):
    a, n = list(a), len(a)
    for i in range(n):
        while 1 <= a[i] <= n and a[a[i] - 1] != a[i]:
            j = a[i] - 1
            a[i], a[j] = a[j], a[i]
    return next((i + 1 for i in range(n) if a[i] != i + 1), n + 1)


@claim("03", "three, four, minus one, one: the first missing positive is two")
def _fmp():
    return (_first_missing_positive([3, 4, -1, 1]) == 2
            and _first_missing_positive([7, 8, 9, 11, 12]) == 1
            and _first_missing_positive([1, 2, 3]) == 4)


class _RandomizedSet:
    def __init__(self):
        self.where, self.row = {}, []

    def insert(self, x):
        if x in self.where:
            return False
        self.where[x] = len(self.row)
        self.row.append(x)
        return True

    def remove(self, x):
        if x not in self.where:
            return False
        i, last = self.where[x], self.row[-1]
        self.row[i], self.where[last] = last, i
        self.row.pop()
        del self.where[x]
        return True

    def pick(self):
        return random.choice(self.row)


@claim("04", "delete by moving the last one into the hole, then pop the end")
def _randomized_set():
    s = _RandomizedSet()
    ok = s.insert(5) and s.insert(7) and s.insert(9) and not s.insert(7)
    ok = ok and s.remove(5) and not s.remove(5)
    return ok and sorted(s.row) == [7, 9] and all(s.row[s.where[x]] == x for x in s.row) \
        and s.pick() in (7, 9)


def _boats(people, limit):
    people = sorted(people)
    i, j, boats = 0, len(people) - 1, 0
    while i <= j:
        if people[i] + people[j] <= limit:
            i += 1
        j -= 1
        boats += 1
    return boats


@claim("05", "weights three, five, three, four with a limit of five need four boats")
def _boats_claim():
    return _boats([3, 5, 3, 4], 5) == 4 and _boats([3, 2, 2, 1], 3) == 3


def _char_replacement(s, k):
    count, best, left, top = collections.Counter(), 0, 0, 0
    for right, c in enumerate(s):
        count[c] += 1
        top = max(top, count[c])
        if right - left + 1 - top > k:
            count[s[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best


@claim("06", "A A B A B B A with one repaint allowed: the longest run is four")
def _replacement():
    return _char_replacement("AABABBA", 1) == 4 and _char_replacement("ABAB", 2) == 4


def _even_vowels(s):
    first, mask, best = {0: -1}, 0, 0
    for i, c in enumerate(s):
        k = "aeiou".find(c)
        if k >= 0:
            mask ^= 1 << k
        if mask in first:
            best = max(best, i - first[mask])
        else:
            first[mask] = i
    return best


@claim("07", "five switches; the same pattern twice means every vowel was even between")
def _vowels():
    return (_even_vowels("eleetminicoworoep") == 13
            and _even_vowels("bcbcbc") == 6 and _even_vowels("leetcodeisgreat") == 5)


def _median_two(a, b):
    if len(a) > len(b):
        a, b = b, a
    m, n = len(a), len(b)
    lo, hi, half = 0, m, (m + n + 1) // 2
    while lo <= hi:
        i = (lo + hi) // 2
        j = half - i
        a_left = a[i - 1] if i else float("-inf")
        a_right = a[i] if i < m else float("inf")
        b_left = b[j - 1] if j else float("-inf")
        b_right = b[j] if j < n else float("inf")
        if a_left <= b_right and b_left <= a_right:
            if (m + n) % 2:
                return max(a_left, b_left)
            return (max(a_left, b_left) + min(a_right, b_right)) / 2
        if a_left > b_right:
            hi = i - 1
        else:
            lo = i + 1


@claim("08", "one and three with two: the middle is two; one, two with three, four: two and a half")
def _median():
    return _median_two([1, 3], [2]) == 2 and _median_two([1, 2], [3, 4]) == 2.5 \
        and _median_two([], [1]) == 1


class _RNode:
    def __init__(self, val, nxt=None, rnd=None):
        self.val, self.next, self.random = val, nxt, rnd


def _copy_random_list(head):
    node = head
    while node:                                  # weave: A A' B B' ...
        node.next = _RNode(node.val, node.next)
        node = node.next.next
    node = head
    while node:                                  # the copy's random is one step past the original's
        if node.random:
            node.next.random = node.random.next
        node = node.next.next
    dummy, tail, node = _RNode(0), None, head
    tail = dummy
    while node:                                  # unweave
        copy = node.next
        node.next = copy.next
        tail.next, tail = copy, copy
        node = node.next
    return dummy.next


@claim("09", "weave the copies between the originals, then a copy's random is one step past")
def _copy_random():
    a, b, c = _RNode(1), _RNode(2), _RNode(3)
    a.next, b.next = b, c
    a.random, b.random, c.random = c, a, c
    new = _copy_random_list(a)
    vals = []
    node = new
    while node:
        vals.append((node.val, node.random.val if node.random else None))
        assert node not in (a, b, c)
        node = node.next
    original_intact = a.next is b and b.next is c and c.next is None
    return vals == [(1, 3), (2, 1), (3, 3)] and original_intact


def _circular_loop(nums):
    n = len(nums)
    step = lambda i: (i + nums[i]) % n
    for start in range(n):
        if nums[start] == 0:
            continue
        forward = nums[start] > 0
        slow = fast = start
        while True:
            for _ in range(2):
                nxt = step(fast)
                if (nums[fast] > 0) != forward or (nums[nxt] > 0) != forward or nxt == fast \
                        or nums[nxt] == 0:
                    break
                fast = nxt
            else:
                slow = step(slow)
                if slow == fast:
                    return True
                continue
            break
        i = start                                     # this road is dead: zero it out
        while nums[i] != 0 and (nums[i] > 0) == forward:
            nxt = step(i)
            nums[i] = 0
            i = nxt
    return False


@claim("10", "two, minus one, one, two, two has a loop; a single step onto yourself is not one")
def _circular():
    return (_circular_loop([2, -1, 1, 2, 2]) is True
            and _circular_loop([-1, -2, -3, -4, -5, 6]) is False
            and _circular_loop([1, -1, 5, 1, 4]) is True
            and _circular_loop([-2, 1, -1, -2, -2]) is False)


def _decode(s):
    stack, cur, k = [], "", 0
    for c in s:
        if c.isdigit():
            k = k * 10 + int(c)
        elif c == "[":
            stack.append((cur, k))
            cur, k = "", 0
        elif c == "]":
            before, times = stack.pop()
            cur = before + cur * times
        else:
            cur += c
    return cur


@claim("11", "three of a, with two of c inside: a c c, three times over")
def _decode_claim():
    return _decode("3[a2[c]]") == "accaccacc" and _decode("2[abc]3[cd]ef") == "abcabccdcdcdef"


def _largest_histogram(h):
    stack, best = [], 0
    for i, x in enumerate(h + [0]):
        start = i
        while stack and stack[-1][1] >= x:
            start, height = stack.pop()
            best = max(best, height * (i - start))
        stack.append((start, x))
    return best


def _maximal_rectangle(grid):
    heights, best = [0] * len(grid[0]), 0
    for row in grid:
        heights = [h + 1 if c == "1" else 0 for h, c in zip(heights, row)]
        best = max(best, _largest_histogram(heights))
    return best


@claim("12", "a zero resets the post; each row is the histogram problem again")
def _maximal():
    g = ["10100", "10111", "11111", "10010"]
    return _maximal_rectangle(g) == 6 and _maximal_rectangle(["0"]) == 0


def _longest_within_limit(a, limit):
    hi, lo = collections.deque(), collections.deque()
    left = best = 0
    for right, x in enumerate(a):
        while hi and hi[-1] < x:
            hi.pop()
        hi.append(x)
        while lo and lo[-1] > x:
            lo.pop()
        lo.append(x)
        while hi[0] - lo[0] > limit:
            if a[left] == hi[0]:
                hi.popleft()
            if a[left] == lo[0]:
                lo.popleft()
            left += 1
        best = max(best, right - left + 1)
    return best


@claim("13", "eight, two, four, seven with a limit of four: the longest calm stretch is two")
def _limit():
    return (_longest_within_limit([8, 2, 4, 7], 4) == 2
            and _longest_within_limit([10, 1, 2, 4, 7, 2], 5) == 4
            and _longest_within_limit([4, 2, 2, 2, 4, 4, 2, 2], 0) == 3)


def _distance_k(edges, target, k):
    graph = collections.defaultdict(list)
    for parent, child in edges:                 # a parent note turns the tree into a web
        graph[parent].append(child)
        graph[child].append(parent)
    seen, ring = {target}, [target]
    for _ in range(k):
        ring = [v for u in ring for v in graph[u] if v not in seen and not seen.add(v)]
    return sorted(ring)


@claim("14", "two steps from five reach seven, four and one")
def _distance():
    edges = [(3, 5), (3, 1), (5, 6), (5, 2), (1, 0), (1, 8), (2, 7), (2, 4)]
    return _distance_k(edges, 5, 2) == [1, 4, 7] and _distance_k(edges, 5, 0) == [5]


class _TNode:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right


class _BSTIterator:
    def __init__(self, root):
        self.stack = []
        self._push_left(root)

    def _push_left(self, node):
        while node:
            self.stack.append(node)
            node = node.left

    def next(self):
        node = self.stack.pop()
        self._push_left(node.right)
        return node.val

    def has_next(self):
        return bool(self.stack)


@claim("15", "the stack holds the left edge; every node goes on once and comes off once")
def _bst_iter():
    root = _TNode(7, _TNode(3), _TNode(15, _TNode(9), _TNode(20)))
    it, out, peak = _BSTIterator(root), [], 0
    while it.has_next():
        peak = max(peak, len(it.stack))
        out.append(it.next())
    return out == [3, 7, 9, 15, 20] and peak <= 3


def _ipo(k, w, profits, capital):
    projects = sorted(zip(capital, profits))
    heap, i = [], 0
    for _ in range(k):
        while i < len(projects) and projects[i][0] <= w:
            heapq.heappush(heap, -projects[i][1])     # heapq has no max-heap: store the negative
            i += 1
        if not heap:
            break
        w -= heapq.heappop(heap)
    return w


@claim("16", "heapq keeps the smallest on top, so the largest profit is stored as its negative")
def _ipo_claim():
    h = []
    for p in (1, 3, 2):
        heapq.heappush(h, -p)
    return (-h[0] == 3 and _ipo(2, 0, [1, 2, 3], [0, 1, 1]) == 4
            and _ipo(3, 0, [1, 2, 3], [0, 1, 2]) == 6)


def _shortest_with_breaks(grid, k):
    rows, cols = len(grid), len(grid[0])
    start = (0, 0, k)
    seen, queue = {start}, collections.deque([(0, 0, k, 0)])
    while queue:
        r, c, left, steps = queue.popleft()
        if (r, c) == (rows - 1, cols - 1):
            return steps
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                nl = left - grid[nr][nc]
                if nl >= 0 and (nr, nc, nl) not in seen:
                    seen.add((nr, nc, nl))
                    queue.append((nr, nc, nl, steps + 1))
    return -1


@claim("17", "the case is the cell plus the walls still allowed; BFS over that is still shortest")
def _breaks():
    g = [[0, 0, 0], [1, 1, 0], [0, 0, 0], [0, 1, 1], [0, 0, 0]]
    g2 = [[0, 1, 1], [1, 1, 1], [1, 0, 0]]
    return _shortest_with_breaks(g, 1) == 6 and _shortest_with_breaks(g2, 1) == -1


def _alien_order(words):
    letters = {c for w in words for c in w}
    after, need = {c: set() for c in letters}, {c: 0 for c in letters}
    for a, b in zip(words, words[1:]):
        for x, y in zip(a, b):
            if x != y:
                if y not in after[x]:
                    after[x].add(y)
                    need[y] += 1
                break
        else:
            if len(a) > len(b):                  # a word before its own beginning
                return ""
    queue = collections.deque(sorted(c for c in letters if need[c] == 0))
    out = []
    while queue:
        c = queue.popleft()
        out.append(c)
        for d in sorted(after[c]):
            need[d] -= 1
            if need[d] == 0:
                queue.append(d)
    return "".join(out) if len(out) == len(letters) else ""


@claim("18", "only the first differing letter teaches anything; a word before its own prefix is a lie")
def _alien():
    return (_alien_order(["wrt", "wrf", "er", "ett", "rftt"]) == "wertf"
            and _alien_order(["abc", "ab"]) == ""
            and _alien_order(["z", "x", "z"]) == "")


def _combination_sum(nums, target):
    nums, out = sorted(nums), []

    def walk(start, left, path):
        if left == 0:
            out.append(path[:])
            return
        for i in range(start, len(nums)):
            if nums[i] > left:
                break                            # sorted, so every later one is too big as well
            path.append(nums[i])
            walk(i, left - nums[i], path)        # i, not i + 1: the same coin may be used again
            path.pop()

    walk(0, target, [])
    return out


@claim("19", "two, three, six, seven to make seven: two two three, or seven alone")
def _comb():
    return _combination_sum([2, 3, 6, 7], 7) == [[2, 2, 3], [7]] \
        and _combination_sum([2], 1) == []


def _word_break(s, words):
    words = set(words)
    ok = [True] + [False] * len(s)
    for end in range(1, len(s) + 1):
        ok[end] = any(ok[start] and s[start:end] in words for start in range(end))
    return ok[-1]


@claim("20", "apple pen apple breaks; cats and dog does not")
def _wb():
    return (_word_break("applepenapple", ["apple", "pen"]) is True
            and _word_break("catsandog", ["cats", "dog", "sand", "and", "cat"]) is False)


def _burst(nums):
    a = [1] + nums + [1]
    n = len(a)
    best = [[0] * n for _ in range(n)]
    for width in range(2, n):
        for left in range(n - width):
            right = left + width
            best[left][right] = max(
                a[left] * a[last] * a[right] + best[left][last] + best[last][right]
                for last in range(left + 1, right))
    return best[0][n - 1]


@claim("21", "three, one, five, eight: the best is one hundred and sixty-seven")
def _balloons():
    return _burst([3, 1, 5, 8]) == 167 and _burst([1, 5]) == 10


def _valid_star(s):
    low = high = 0
    for c in s:
        low += 1 if c == "(" else -1
        high += 1 if c != ")" else -1
        if high < 0:
            return False
        low = max(low, 0)
    return low == 0


@claim("22", "keep only the fewest and the most open brackets there could be")
def _star():
    return (_valid_star("(*))") and _valid_star("(*)") and _valid_star("()")
            and not _valid_star(")(") and not _valid_star("((*"))


class _Calendar:
    def __init__(self):
        self.starts, self.ends = [], []

    def book(self, start, end):
        i = bisect.bisect_right(self.starts, start)
        if i and self.ends[i - 1] > start:
            return False
        if i < len(self.starts) and self.starts[i] < end:
            return False
        self.starts.insert(i, start)
        self.ends.insert(i, end)
        return True


@claim("23", "ten to twenty, then fifteen to twenty-five clashes, twenty to thirty fits")
def _calendar():
    c = _Calendar()
    return c.book(10, 20) and not c.book(15, 25) and c.book(20, 30) and c.book(5, 10)


def _suggestions(products, word):
    products, out = sorted(products), []
    for i in range(1, len(word) + 1):
        prefix = word[:i]
        j = bisect.bisect_left(products, prefix)
        out.append([p for p in products[j:j + 3] if p.startswith(prefix)])
    return out


@claim("24", "sorted once, the three after the first match are the three smallest")
def _suggest():
    got = _suggestions(["mobile", "mouse", "moneypot", "monitor", "mousepad"], "mouse")
    return got[0] == ["mobile", "moneypot", "monitor"] and got[2] == ["mouse", "mousepad"] \
        and got[4] == ["mouse", "mousepad"]


def _add(a, b):
    mask = 0xFFFFFFFF
    while b & mask:
        a, b = (a ^ b) & mask, ((a & b) << 1) & mask
    a &= mask
    return a if a < 2 ** 31 else ~(a ^ mask)


@claim("25", "XOR adds without carrying, AND shifted left is the carry; Python needs the mask")
def _add_claim():
    ok = _add(2, 3) == 5 and _add(-2, 3) == 1 and _add(-5, -7) == -12 and _add(0, 0) == 0
    # without the mask, minus one plus one never runs out of carry
    a, b, rounds = -1, 1, 0
    while b and rounds < 200:
        a, b, rounds = a ^ b, (a & b) << 1, rounds + 1
    return ok and rounds == 200


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
