/* Whole Cake Island — heaps.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['ipo'] = {
    id: 'ipo',
    epNumber: 80,
    title: 'The Tea Party Investments',
    arc: 'Whole Cake Island',
    patternId: 'heaps-top-k',
    scene: 'colosseum',
    leetcode: { name: 'IPO', number: 502, difficulty: 'Hard', url: 'https://leetcode.com/problems/ipo/' },
    problem: 'You start with capital w and may complete at most k projects. Each project needs a minimum capital to start and pays a profit that is added to your capital. Maximise your final capital.',
    example: 'k = 2, w = 0, profits = [1,2,3], capital = [0,1,1]  →  answer: 4  (take project 0 for +1, then project 2 for +3)',

    h: 210,
    props: [
      { id: 'j0', emoji: '🍰', label: 'need 0 → +1', x: 20, y: 30 },
      { id: 'j1', emoji: '🍰', label: 'need 1 → +2', x: 50, y: 30 },
      { id: 'j2', emoji: '🍰', label: 'need 1 → +3', x: 80, y: 30 }
    ],
    ledger: [
      { id: 'W', x: 20, y: 62 },
      { id: 'A', x: 50, y: 62 },
      { id: 'P', x: 80, y: 62 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "Big Mom is auctioning contracts. Each one needs a certain amount of Berries up front, and each pays out when it's done. We can take two — and every payout goes straight back into our purse for the next bid.",
        p: { j0: 'lit', j1: 'lit', j2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "So take the biggest payout first! Three Berries profit, obviously.",
        p: { j2: 'lit' },
        sfx: null
      },
      {
        speaker: 'nami', pos: 'left',
        line: "We can't. That one needs one Berry to start and we're holding zero. The only contract we can afford right now is the one that needs nothing.",
        p: { j2: 'bad', j0: 'good' }, l: { W: 'purse: 0' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So there are two questions here, not one: which contracts can we afford, and among those, which pays best. Different questions, different structures.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Sort the contracts by what they REQUIRE. Then as our purse grows, we sweep a pointer forward and everything it passes has become affordable — permanently, because our purse never shrinks.",
        p: { A: 'lit' }, l: { A: 'affordable pool' },
        sfx: null
      },
      {
        speaker: 'nami', pos: 'left',
        line: "And the affordable ones go into a max-heap by profit. Then choosing is just taking the top.",
        p: { P: 'lit' }, l: { P: 'max by profit' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Purse is zero. Only the first contract is affordable, so it goes in the heap. Take it: purse becomes one.",
        p: { j0: 'good' }, l: { W: 'purse: 1' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Now with one Berry, BOTH remaining contracts become affordable. Both go into the heap — and the heap hands us the three, not the two.",
        p: { j1: 'lit', j2: 'good' }, l: { W: 'purse: 4', P: 'took +3' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Four Berries, in two contracts. Note that we never removed anything from the pool when we could not afford it — the pointer only moves forward, so each contract is considered exactly once.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "What if at some point nothing at all is affordable?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then stop. Our purse cannot grow without completing a contract, so if nothing is affordable now, nothing ever will be. Breaking out early is not an optimisation — it is the termination condition.",
        p: { P: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'When a choice is gated by one quantity and scored by another, sort by the gate and heap by the score — the sorted pointer only moves forward, so each candidate enters the pool exactly once.',
    complexity: '<b>Time O(n log n + k log n)</b> — the sort, plus heap operations. <b>Space O(n)</b> for the heap in the worst case. Re-scanning all projects on each of the k rounds would be O(k · n).',
    pitfall: 'Greedily taking the largest profit without checking affordability, or re-sorting on every round. Also: if the heap is empty you must stop — the capital cannot grow, so no later round can succeed.',
    solution: `import heapq

def find_maximized_capital(k, w, profits, capital):
    # Sort by the gate (capital required), heap by the score (profit).
    projects = sorted(zip(capital, profits))
    heap = []
    i = 0
    for _ in range(k):
        # Everything now affordable joins the pool — permanently.
        while i < len(projects) and projects[i][0] <= w:
            heapq.heappush(heap, -projects[i][1])   # negate for a max-heap
            i += 1
        if not heap:
            break            # capital cannot grow, so nothing later can help
        w -= heapq.heappop(heap)
    return w`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different auction, same pairing: Franky can install upgrades, each needing a minimum hull strength and each ADDING to that strength, and he wants the strongest ship after 5 installs. What structures?",
        options: [
          'Sort upgrades by required strength; push everything affordable into a max-heap keyed by the strength they add',
          'Sort by strength added, and take the top five',
          'A min-heap keyed by required strength, popping five times',
          'Sort by the ratio of added strength to required strength'
        ],
        correct: 0,
        explain: 'Identical structure with the words changed: gate on requirement, score on gain. Taking the top five by gain ignores whether he can install them, and a min-heap on requirement would hand him the cheapest upgrade rather than the best affordable one.',
        hint: 'Which quantity decides what is allowed, and which decides what is best?'
      },
      {
        tag: 'PITFALL',
        q: "Usopp writes the loop so that when the heap is empty he simply continues to the next round instead of breaking. What is the consequence?",
        options: [
          'The remaining rounds spin doing nothing — harmless but pointless, since capital cannot change without completing a project',
          'It returns a capital that is too high',
          'It crashes on the empty heap',
          'It silently skips affordable projects'
        ],
        correct: 0,
        explain: 'Worth being precise: this is not a correctness bug. Capital only changes when a project completes, so once nothing is affordable the state is frozen and the extra rounds are no-ops. Breaking out states that reasoning in the code and saves the work — and if he popped without checking, THAT would crash.',
        hint: 'Can the purse change during a round where no project is taken?'
      },
      {
        tag: 'TWEAK',
        q: "The rules change: profits are now paid at the END rather than added to capital as you go. Does the same algorithm still apply?",
        options: [
          'No — capital never grows, so the affordable set is fixed from the start and it becomes "pick the k largest profits among initially affordable projects"',
          'Yes, unchanged',
          'Yes, but the heap must become a min-heap',
          'No, and it becomes a knapsack problem'
        ],
        correct: 0,
        explain: 'The whole reason for the sorted pointer and the growing pool is that completing a project unlocks others. Remove that feedback and the problem collapses: filter once by affordability, then take the k largest — a single selection, no interleaving needed.',
        hint: 'What was the pointer advancing in response to?'
      }
    ]
  };

  E['k-pairs-smallest-sums'] = {
    id: 'k-pairs-smallest-sums',
    epNumber: 81,
    title: 'The Smallest Slices of Two Cakes',
    arc: 'Whole Cake Island',
    patternId: 'heaps-top-k',
    scene: 'colosseum',
    leetcode: { name: 'Find K Pairs with Smallest Sums', number: 373, difficulty: 'Medium', url: 'https://leetcode.com/problems/find-k-pairs-with-smallest-sums/' },
    problem: 'Given two sorted arrays and an integer k, return the k pairs (one element from each array) with the smallest sums.',
    example: 'nums1 = [1,7,11], nums2 = [2,4,6], k = 3  →  [[1,2],[1,4],[1,6]]',

    h: 210,
    props: [
      { id: 'a0', emoji: '🍓', label: '1', x: 18, y: 26 },
      { id: 'a1', emoji: '🍓', label: '7', x: 40, y: 26 },
      { id: 'a2', emoji: '🍓', label: '11', x: 62, y: 26 },
      { id: 'b0', emoji: '🍫', label: '2', x: 18, y: 56 },
      { id: 'b1', emoji: '🍫', label: '4', x: 40, y: 56 },
      { id: 'b2', emoji: '🍫', label: '6', x: 62, y: 56 }
    ],
    ledger: [
      { id: 'H', x: 88, y: 40 },
      { id: 'O', x: 88, y: 78 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "Two cakes, each already cut and laid out smallest slice first. We need the three cheapest combinations — one slice from each.",
        p: { a0: 'lit', a1: 'lit', a2: 'lit', b0: 'lit', b1: 'lit', b2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Make every combination, sort them, take three. Nine pairs here — but with a thousand slices each that's a million pairs to build and sort, for three answers.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "We only need three, so we should only ever build a handful. Picture the pairs as a grid: rows from the first cake, columns from the second. Both cakes are sorted, so sums increase as you go right and as you go down.",
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "So the very smallest pair is the top-left corner. One and two — three Berries.",
        p: { a0: 'good', b0: 'good' }, l: { O: '[1,2]' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And the next smallest must be adjacent to something already taken — either one step right, or one step down. So keep a heap of the frontier: the cheapest untaken pairs on the border of what we've claimed.",
        p: { H: 'lit' }, l: { H: 'frontier heap' },
        sfx: null
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Start with the whole first column in the heap: one-and-two, seven-and-two, eleven-and-two. Pop the smallest — one and two. Then push only its right-hand neighbour, one and four.",
        p: { b1: 'lit' }, l: { O: '[1,2] [1,4]' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Pop again: one and four beats seven and two, five against nine. Push one and six. Pop again: one and six, seven Berries, still beats nine.",
        p: { b2: 'good' }, l: { O: '[1,2] [1,4] [1,6] ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Three pops, and the heap never held more than a few entries. We never built the other six pairs at all.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Why push only the right-hand neighbour and not the one below as well?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Because the entire first column went in at the start, so every downward move is already accounted for. Push both and the same pair arrives twice — the classic duplicate bug in this pattern. Seed a column, then only ever walk right.",
        p: { H: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'When the answer is the k smallest of an implicit sorted grid, keep a heap of the frontier rather than materialising the grid — and seed one full row or column so that each cell has exactly one way to be discovered.',
    complexity: '<b>Time O(k log k)</b> — at most k pops, each pushing one successor, with the heap bounded by the seeded column. <b>Space O(min(k, m))</b>. Generating all pairs is O(m · n log(m · n)).',
    pitfall: 'Pushing both the right and the down neighbour after each pop, which enqueues the same pair by two different routes. Seed a column and advance only along rows — or keep a visited set, which costs more.',
    solution: `import heapq

def k_smallest_pairs(nums1, nums2, k):
    if not nums1 or not nums2:
        return []

    # Seed with the first column: (sum, i, j) for every i against nums2[0].
    heap = [(nums1[i] + nums2[0], i, 0) for i in range(min(k, len(nums1)))]
    heapq.heapify(heap)

    out = []
    while heap and len(out) < k:
        _, i, j = heapq.heappop(heap)
        out.append([nums1[i], nums2[j]])
        # Only ever step right — downward moves were seeded already, so
        # every pair has exactly one path into the heap.
        if j + 1 < len(nums2):
            heapq.heappush(heap, (nums1[i] + nums2[j + 1], i, j + 1))
    return out`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different galley, same grid: Sanji has a sorted list of prep times and a sorted list of cook times, and needs the 10 fastest dish combinations. Why is a frontier heap better than building all combinations?",
        options: [
          'The work becomes proportional to k rather than to the full product of the two lists',
          'The heap sorts the two lists as a side effect',
          'Building all combinations gives wrong answers',
          'The heap uses less memory per element'
        ],
        correct: 0,
        explain: 'Both approaches are correct; only the cost differs. With 1,000 items each, all-pairs is a million constructions to answer a question about ten. The frontier heap exploits the sortedness so that the k-th answer is reachable after k pops.',
        hint: 'How many combinations does each method actually construct?'
      },
      {
        tag: 'PITFALL',
        q: "Robin seeds the heap with only the single pair (0, 0) and, after each pop of (i, j), pushes both (i+1, j) and (i, j+1). What goes wrong?",
        options: [
          'Pairs get pushed twice — (1,1) arrives from both (0,1) and (1,0) — so duplicates appear unless a visited set is added',
          'Some pairs are never reachable',
          'The heap grows to the full grid size',
          'Nothing; it is exactly equivalent'
        ],
        correct: 0,
        explain: 'Every interior cell has two predecessors, so the two-way push discovers it twice. It is fixable with a visited set, at the cost of extra memory and a hash per push. Seeding a column and moving only right gives each cell a unique discovery path and needs no set at all.',
        hint: 'Count the routes from (0,0) to (1,1) in the grid.'
      },
      {
        tag: 'TWEAK',
        q: "k is 1,000,000 but nums1 has only 3 elements and nums2 has 4 — just 12 pairs exist. What must the code do?",
        options: [
          'Stop when the heap empties, returning all 12 pairs rather than looping k times',
          'Pad the arrays until there are k pairs',
          'Return an empty list, since k cannot be satisfied',
          'Repeat pairs until it has k of them'
        ],
        correct: 0,
        explain: 'The loop condition has to be "heap not empty AND fewer than k collected", not a bare range over k. It is the standard guard for every top-k problem where k may exceed the number of candidates — and it is the case an interviewer will reach for first.',
        hint: 'What is the loop condition, and what happens when the frontier runs out?'
      }
    ]
  };

  E['find-median-from-data-stream'] = {
    id: 'find-median-from-data-stream',
    epNumber: 82,
    title: 'The Scales That Never Stop Tipping',
    arc: 'Whole Cake Island',
    patternId: 'heaps-top-k',
    scene: 'colosseum',
    leetcode: { name: 'Find Median from Data Stream', number: 295, difficulty: 'Hard', url: 'https://leetcode.com/problems/find-median-from-data-stream/' },
    problem: 'Design a structure that accepts numbers one at a time and can report the median of everything seen so far, at any moment.',
    example: 'add 1, add 2 → median 1.5;  add 3 → median 2',

    h: 210,
    props: [
      { id: 'lo', emoji: '⬅️', label: 'low half (max-heap)', x: 27, y: 34 },
      { id: 'hi', emoji: '➡️', label: 'high half (min-heap)', x: 73, y: 34 },
      { id: 'x1', emoji: '⚖️', label: '1', x: 20, y: 62 },
      { id: 'x2', emoji: '⚖️', label: '2', x: 50, y: 62 },
      { id: 'x3', emoji: '⚖️', label: '3', x: 80, y: 62 }
    ],
    ledger: [
      { id: 'M', x: 50, y: 88 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "The tally of every deal at the tea party keeps growing, and Big Mom wants the MIDDLE value on demand — not at the end, at any moment.",
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Keep a sorted list and insert each new number in its place? Finding the spot is a binary search, so that's fast...",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Finding it is fast. Making room for it is not — everything after the insertion point shifts along. That is linear work on every single deal.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "But look at what the median actually needs. Not the whole ordering — only the boundary between the smaller half and the larger half. So hold the halves separately.",
        p: { lo: 'lit', hi: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "A max-heap for the low half, so its top is the LARGEST of the small ones. A min-heap for the high half, so its top is the SMALLEST of the large ones. The median sits right between those two tops.",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Add one. It goes to the low half. One heap holds one item, the other none — so the median is just that top: one.",
        p: { x1: 'good', lo: 'good' }, l: { M: 'median 1' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Add two. It belongs on the high side. Now both halves hold one, so the median is the average of the two tops: one and a half.",
        p: { x2: 'good', hi: 'good' }, l: { M: 'median 1.5' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Add three. High side again — but now it holds two and the low side holds one. Rebalance: move the high side's smallest across. Median is two.",
        p: { x3: 'good' }, l: { M: 'median 2' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The rebalance is the whole discipline. The two halves must never differ in size by more than one, or the tops stop straddling the middle and the answer quietly drifts.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "There's a neat trick for the insert, isn't there? Push onto one heap, immediately move its top to the other, and then fix the sizes.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Yes — it routes the value to the correct half without a single comparison against the tops. Insert costs log n, and reading the median costs nothing at all: it is one or two peeks.",
        p: { lo: 'good', hi: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'Two heaps of opposite polarity hold the halves of a stream so their tops straddle the middle — the median never needs the full ordering, only the boundary between the halves.',
    complexity: '<b>Time O(log n)</b> per insertion, <b>O(1)</b> per median query. <b>Space O(n)</b>. A sorted list gives O(1) queries but O(n) insertions because of the shifting.',
    pitfall: 'Letting the halves drift out of balance by more than one element — the tops then no longer straddle the middle. And in a language with only a min-heap, remember to negate on the low side, including when reading its top back.',
    solution: `import heapq

class MedianFinder:
    def __init__(self):
        self.low = []    # max-heap (negated), the smaller half
        self.high = []   # min-heap, the larger half

    def addNum(self, num):
        # Route through low, then hand its top to high: no comparisons needed.
        heapq.heappush(self.low, -num)
        heapq.heappush(self.high, -heapq.heappop(self.low))
        # Rebalance so low is never smaller than high.
        if len(self.high) > len(self.low):
            heapq.heappush(self.low, -heapq.heappop(self.high))

    def findMedian(self):
        if len(self.low) > len(self.high):
            return -self.low[0]
        return (-self.low[0] + self.high[0]) / 2`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different stream, same scales: Chopper wants the 90th percentile of arriving patient temperatures rather than the median. What changes?",
        options: [
          'The same two heaps, but rebalanced to a 90/10 split instead of 50/50',
          'Nothing — the median structure already reports any percentile',
          'A single max-heap suffices',
          'It requires storing every value in sorted order'
        ],
        correct: 0,
        explain: 'The structure is "hold a boundary between two halves"; the median is simply the boundary at 50%. Keeping the low heap at 90% of the count puts the boundary at the 90th percentile, with the same O(log n) insert. That generality is the reason to understand the invariant rather than memorise the median code.',
        hint: 'What does the size ratio between the two heaps actually control?'
      },
      {
        tag: 'PITFALL',
        q: "Nami pushes each new value straight onto whichever heap it belongs to by comparing against the tops, but forgets the rebalance step. After adding 1, 2, 3, 4, 5 in order, what breaks?",
        options: [
          'One heap ends up much larger, so its top is no longer the middle and the reported median is wrong',
          'It crashes on an empty heap',
          'The values are stored but cannot be retrieved',
          'Nothing; the tops always straddle the median regardless of sizes'
        ],
        correct: 0,
        explain: 'Straddling the median depends entirely on the halves being equal in size (or off by one). With 1 low and 4 high, the boundary between the tops sits at the 20th percentile, not the 50th. The rebalance is not tidying — it is the invariant that makes the tops mean anything.',
        hint: 'If the low heap holds 1 item and the high heap holds 4, where does the boundary between their tops actually fall?'
      },
      {
        tag: 'TWEAK',
        q: "The interviewer adds: all values are integers from 0 to 100. Is there something better?",
        options: [
          'Yes — a count array of 101 buckets gives O(1) insertion and O(101) median by scanning to the halfway count',
          'No, two heaps are optimal for any input',
          'Yes — sort the values, since the range is small',
          'Yes — a single heap now suffices'
        ],
        correct: 0,
        explain: 'A bounded range turns counting into a viable structure: increment a bucket on insert, and walk the buckets accumulating counts to find the middle. The scan is bounded by a constant, so it beats log n. Spotting when a stated range unlocks counting is a reliable interview signal.',
        hint: 'How many distinct values can arrive, and what does that let you index?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
