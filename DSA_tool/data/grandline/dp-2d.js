/* Laugh Tale — two-dimensional dynamic programming.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['triangle'] = {
    id: 'triangle',
    epNumber: 132,
    title: 'The Descent Down the Stone Pyramid',
    arc: 'Laugh Tale',
    patternId: 'dynamic-programming',
    scene: 'vault',
    leetcode: { name: 'Triangle', number: 120, difficulty: 'Medium', url: 'https://leetcode.com/problems/triangle/' },
    problem: 'Given a triangle array, return the minimum path sum from top to bottom. At each step you may move to either of the two adjacent numbers on the row below.',
    example: 'triangle = [[2],[3,4],[6,5,7],[4,1,8,3]]  →  11   (2 + 3 + 5 + 1)',

    h: 210,
    props: [
      { id: 't0', emoji: '🪨', label: '2', x: 50, y: 18 },
      { id: 't1', emoji: '🪨', label: '3', x: 38, y: 38 },
      { id: 't2', emoji: '🪨', label: '4', x: 62, y: 38 },
      { id: 't3', emoji: '🪨', label: '6', x: 26, y: 58 },
      { id: 't4', emoji: '🪨', label: '5', x: 50, y: 58 },
      { id: 't5', emoji: '🪨', label: '7', x: 74, y: 58 }
    ],
    ledger: [
      { id: 'B', x: 50, y: 86 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The pyramid narrows to a single stone at the top and widens as it falls. From any stone you may only drop to the two directly beneath it, and we want the cheapest way down.",
        p: { t0: 'lit', t1: 'lit', t2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Try every route? Each level doubles them. Twenty levels is a million paths.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Work upward instead. For a stone on the bottom row, the cheapest descent is just its own cost. For any stone above, it is its own cost plus the cheaper of the two stones beneath it.",
        p: { B: 'lit' }, l: { B: 'best[i] = cost + min(below)' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So each stone is answered once, using two answers already computed. No route is ever walked twice.",
        p: { t3: 'good', t4: 'good', t5: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Going bottom-up also means there is no separate answer to collect at the end — the top stone's value IS the answer, because every path starts there.",
        p: { t1: 'good', t2: 'good', t0: 'good' }, l: { B: 'top = 11 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Top-down would work too, but then you'd have to scan the whole bottom row for the smallest at the end.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And each row only ever needs the row below it, so one array of the triangle's width is enough. Overwrite it in place, working upward.",
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "O of n squared time for the stones, O of n space instead of a whole triangle of them.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Choosing the direction so that the answer lands in one place, rather than needing a search afterwards, is a small habit that simplifies a lot of these.",
        sfx: 'gong'
      }
    ],

    insight: 'Choosing the direction of a DP can remove work at the end — computing bottom-up leaves the answer at the apex, where top-down would need a scan of the final row.',
    complexity: '<b>Time O(n²)</b> for a triangle of n rows — every cell once. <b>Space O(n)</b> with a single rolling row, or O(1) extra if you may modify the input.',
    pitfall: 'Enumerating paths, which is exponential. And with the rolling-array version, iterating the row in the wrong direction so that a value is read after it has already been overwritten.',
    solution: `def minimum_total(triangle):
    # One row of state, built upward from the bottom.
    best = triangle[-1][:]
    for row in range(len(triangle) - 2, -1, -1):
        for col in range(row + 1):
            best[col] = triangle[row][col] + min(best[col], best[col + 1])
    return best[0]      # the apex: every path starts here`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different descent, same recurrence: Franky wants the MAXIMUM sum path down the same pyramid. What changes?",
        options: [
          'Replace min with max — the structure of the recurrence is untouched',
          'The direction must be reversed to top-down',
          'The rolling array no longer works',
          'It becomes exponential'
        ],
        correct: 0,
        explain: 'The combiner is the only part of a DP that encodes what "best" means; the state and the transitions are about the shape of the problem. Being able to swap min for max, or for a sum when counting, is what makes one solved DP into three.',
        hint: 'Which single operation in the recurrence expresses "cheapest"?'
      },
      {
        tag: 'PITFALL',
        q: "Chopper uses one rolling array but iterates <code>col</code> from high to low while building upward. What goes wrong?",
        options: [
          'Nothing here — each cell reads best[col] and best[col+1], both from the row below, and neither has been overwritten yet at that point... but reversing the loop in the 1-D knapsack WOULD break it',
          'It reads a value from the current row instead of the row below',
          'It goes out of bounds',
          'It always returns the bottom-left value'
        ],
        correct: 0,
        explain: 'Worth being precise rather than reciting a rule: here each new value depends on best[col] and best[col+1], and writing left-to-right overwrites best[col] only after it has been read, so both directions happen to be safe. The direction rule genuinely bites in 0/1 knapsack, where writing forward lets an item be reused. Always check which cells the recurrence reads before assuming.',
        hint: 'List exactly which entries the new best[col] reads, and ask whether either has been written yet in this pass.'
      },
      {
        tag: 'TWEAK',
        q: "The problem now asks which stones the cheapest path actually visits, not just the total. What must be added?",
        options: [
          'A record of which of the two choices was taken at each cell, so the path can be reconstructed by walking down from the apex',
          'Nothing; the totals already encode the path',
          'A second DP pass in the opposite direction',
          'The rolling array must become a full table'
        ],
        correct: 0,
        explain: 'Two things follow. You must keep the full table rather than a rolling row, since reconstruction walks back through it — and you must store the choice (or re-derive it by comparing the two candidates). This is the standard cost of asking for a solution rather than its value.',
        hint: 'Reconstruction needs to walk back through the decisions. Does a single rolling row still hold them?'
      }
    ]
  };

  E['minimum-path-sum'] = {
    id: 'minimum-path-sum',
    epNumber: 133,
    title: 'The Cheapest Road Across the Ruins',
    arc: 'Laugh Tale',
    patternId: 'dynamic-programming',
    scene: 'vault',
    leetcode: { name: 'Minimum Path Sum', number: 64, difficulty: 'Medium', url: 'https://leetcode.com/problems/minimum-path-sum/' },
    problem: 'Given an m x n grid of non-negative numbers, find a path from top-left to bottom-right that minimises the sum of the numbers along it. You may only move right or down.',
    example: 'grid = [[1,3,1],[1,5,1],[4,2,1]]  →  7   (1 → 3 → 1 → 1 → 1)',

    h: 210,
    props: [
      { id: 'c00', emoji: '🧱', label: '1', x: 30, y: 24 },
      { id: 'c01', emoji: '🧱', label: '3', x: 50, y: 24 },
      { id: 'c02', emoji: '🧱', label: '1', x: 70, y: 24 },
      { id: 'c10', emoji: '🧱', label: '1', x: 30, y: 48 },
      { id: 'c11', emoji: '🧱', label: '5', x: 50, y: 48 },
      { id: 'c12', emoji: '🧱', label: '1', x: 70, y: 48 }
    ],
    ledger: [
      { id: 'D', x: 50, y: 82 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "Crossing the ruins costs something at every slab, and we may only step right or down. Find the cheapest crossing.",
        p: { c00: 'lit', c01: 'lit', c02: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Because movement is one-way, any slab can only be reached from the slab above it or the slab to its left. So its cheapest arrival is its own cost plus the cheaper of those two.",
        p: { D: 'lit' }, l: { D: 'dp = cost + min(up, left)' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "And the first row can only be reached from the left, the first column only from above. Those are the base cases and they're just running totals.",
        p: { c00: 'good', c01: 'good', c02: 'good', c10: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Fill the rest row by row, and each slab needs only two already-finished neighbours. The bottom-right slab holds the answer.",
        p: { c11: 'good', c12: 'good' }, l: { D: 'answer 7 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "The whole difference between this and the exponential version is that we ask about SLABS, not about paths. There are nine slabs and dozens of paths.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And each row only needs the row above it, so a single array of the width will do — reading its own previous value as 'left' and its unmodified value as 'up'.",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'left',
        line: "That's neat. The same slot holds 'up' before we write it and 'left' after.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is exactly why that loop must run left to right. Reverse it and 'left' has not been computed yet. The direction is load-bearing here, unlike in the triangle.",
        sfx: 'gong'
      }
    ],

    insight: 'One-way movement means a cell has only two predecessors — ask about cells rather than about paths, and an exponential search collapses into a grid-sized table.',
    complexity: '<b>Time O(m · n)</b> — every cell once. <b>Space O(n)</b> with a rolling row, or O(1) extra if the input grid may be overwritten.',
    pitfall: 'Getting the base cases wrong: the first row and first column have only one predecessor each, so they are running totals rather than a min of two. With the rolling array, the column loop must run left to right.',
    solution: `def min_path_sum(grid):
    rows, cols = len(grid), len(grid[0])
    dp = [0] * cols
    dp[0] = grid[0][0]
    for c in range(1, cols):
        dp[c] = dp[c - 1] + grid[0][c]      # first row: only from the left

    for r in range(1, rows):
        dp[0] += grid[r][0]                 # first column: only from above
        for c in range(1, cols):
            # dp[c] is still "up"; dp[c-1] is already "left" in this row.
            dp[c] = grid[r][c] + min(dp[c], dp[c - 1])
    return dp[-1]`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Nami initialises the whole dp array to zero and runs only the main double loop, skipping the base-case rows. What happens?",
        options: [
          'The first row and column are computed as if they had a free predecessor of 0, so paths can appear cheaper than any real route',
          'It crashes on an index error',
          'It returns the grid total',
          'Nothing; the base cases are redundant'
        ],
        correct: 0,
        explain: 'A zero in dp[0] for a later row means "arriving here from above cost nothing", which no real path can do. Base cases in a DP are not boilerplate — they encode which states are reachable at zero cost, and getting them wrong produces answers that are silently too good.',
        hint: 'What does dp[0] mean on row 3 if it was never updated?'
      },
      {
        tag: 'TWEAK',
        q: "Movement may now also go DOWN-RIGHT diagonally. What changes?",
        options: [
          'A third predecessor: dp = cost + min(up, left, up-left) — the structure is unchanged',
          'The DP no longer applies',
          'Two passes are needed',
          'The base cases become invalid'
        ],
        correct: 0,
        explain: 'The predecessor set is a parameter of the recurrence. As long as every allowed move still goes strictly toward the destination — so the dependency graph stays acyclic — the same table-filling works. Add a move that can go left or up and the whole approach breaks, because states would depend on themselves.',
        hint: 'What property of the allowed moves lets you fill the table in one sweep?'
      },
      {
        tag: 'TRANSFER',
        q: "Different crossing: Sanji counts how many distinct paths exist rather than the cheapest one. What is the recurrence?",
        options: [
          'dp = up + left — the same predecessors, with addition instead of min',
          'dp = min(up, left) + 1',
          'dp = max(up, left)',
          'It needs a completely different method'
        ],
        correct: 0,
        explain: 'Same state, same predecessors, different combiner: min for optimisation, plus for counting. Note the base case shifts too — counting seeds with 1 (one way to be at the start) rather than with a cost.',
        hint: 'How many ways are there to reach a cell, given the ways to reach each of its predecessors?'
      }
    ]
  };

  E['unique-paths-ii'] = {
    id: 'unique-paths-ii',
    epNumber: 134,
    title: 'Counting the Roads Around the Rubble',
    arc: 'Laugh Tale',
    patternId: 'dynamic-programming',
    scene: 'vault',
    leetcode: { name: 'Unique Paths II', number: 63, difficulty: 'Medium', url: 'https://leetcode.com/problems/unique-paths-ii/' },
    problem: 'Count the distinct paths from the top-left to the bottom-right of a grid, moving only right or down, where some cells are blocked by obstacles.',
    example: 'grid = [[0,0,0],[0,1,0],[0,0,0]]  →  2   (the single obstacle removes the middle routes)',

    h: 210,
    props: [
      { id: 'g00', emoji: '🟩', label: '', x: 30, y: 24 },
      { id: 'g01', emoji: '🟩', label: '', x: 50, y: 24 },
      { id: 'g11', emoji: '🚧', label: 'blocked', x: 50, y: 48 },
      { id: 'g21', emoji: '🟩', label: '', x: 50, y: 72 },
      { id: 'g22', emoji: '🏁', label: 'goal', x: 70, y: 72 }
    ],
    ledger: [
      { id: 'N', x: 20, y: 86 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "How many different roads cross the ruins, right and down only — and some squares are buried under rubble and cannot be stepped on at all.",
        p: { g00: 'lit', g11: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Counting rather than optimising, so the two predecessors are ADDED rather than compared. The ways to reach a square are the ways to reach the square above plus the ways to reach the square to its left.",
        p: { N: 'lit' }, l: { N: 'ways = up + left' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And a blocked square? Do we skip it?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Set it to zero ways. Then it contributes nothing to anything downstream, automatically — no branching, no special case. Zero is the natural absorbing value for a counting DP.",
        p: { g11: 'bad' }, l: { N: 'blocked → 0 ways' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So the obstacle removes every road through it just by being a zero. That's elegant.",
        p: { g01: 'good', g21: 'good', g22: 'good' }, l: { N: '2 roads ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "The first row worries me. If one square in it is blocked, everything after it in that row is unreachable.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And the recurrence handles it correctly, provided the first row is built by propagation rather than being filled with ones. A blocked square makes it zero, and every square after it inherits that zero.",
        p: { g11: 'dim' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And if the start square itself is rubble, there are no roads at all.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which the same rule gives you for free: the start is set to zero, and everything downstream multiplies out to nothing. Encode the obstacle in the value and the special cases evaporate.",
        p: { g00: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'In a counting DP, zero is the absorbing value — setting a blocked cell to zero ways removes every path through it with no special-case branching anywhere.',
    complexity: '<b>Time O(m · n)</b>. <b>Space O(n)</b> with a rolling row. The unobstructed version has a closed-form binomial answer, but obstacles rule that out.',
    pitfall: 'Filling the first row and column with ones before checking for obstacles — a blocked cell must zero everything after it in that row or column. Also, the start or end cell may itself be blocked.',
    solution: `def unique_paths_with_obstacles(grid):
    cols = len(grid[0])
    dp = [0] * cols
    dp[0] = 1 if grid[0][0] == 0 else 0     # a blocked start means no paths

    for row in grid:
        for c in range(cols):
            if row[c] == 1:
                dp[c] = 0                   # blocked: absorbs everything
            elif c > 0:
                dp[c] += dp[c - 1]          # dp[c] is "up", dp[c-1] is "left"
    return dp[-1]`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper fills the entire first row with 1s before applying obstacles. On the first row [0, 1, 0], what does his table say about the third cell?",
        options: [
          '1 way, when the truth is 0 — the obstacle in the middle makes it unreachable along that row',
          '2 ways',
          '0 ways, correctly',
          'It crashes'
        ],
        correct: 0,
        explain: 'The first row is not automatically all-reachable; it is reachable only up to the first obstacle. Building it by propagation — each cell inheriting from its left neighbour, zeroed if blocked — gets it right without a separate rule.',
        hint: 'Can you reach the third cell of the top row if the second one is rubble?'
      },
      {
        tag: 'TWEAK',
        q: "The counts become astronomically large for a big grid. What is the standard adjustment?",
        options: [
          'Take every addition modulo a given prime, as the problem usually specifies',
          'Use floating point',
          'Cap the count at the maximum integer',
          'Switch to counting only distinct shapes'
        ],
        correct: 0,
        explain: 'Path counts grow like binomial coefficients, so they overflow quickly. Working modulo a prime keeps every value bounded and is exactly why so many counting problems specify "modulo 10⁹+7". Floating point would silently lose precision instead.',
        hint: 'Why do so many counting problems end with "modulo 1000000007"?'
      },
      {
        tag: 'TRANSFER',
        q: "Different ruins: Nami wants the number of paths that pass through a specific checkpoint cell. How?",
        options: [
          'Multiply the paths from start to the checkpoint by the paths from the checkpoint to the end',
          'Add the two counts',
          'Count all paths and subtract those that avoid it',
          'It requires enumerating the paths'
        ],
        correct: 0,
        explain: 'Paths through a point factor into independent halves, so the counts multiply. Subtracting the avoiding paths also works but requires a second, harder count. Recognising an independent split as a product is a recurring counting move.',
        hint: 'A path through the checkpoint is one choice of first half and one choice of second half. How do independent choices combine?'
      }
    ]
  };

  E['longest-palindromic-substring'] = {
    id: 'longest-palindromic-substring',
    epNumber: 135,
    title: 'The Longest Line That Reads Both Ways',
    arc: 'Laugh Tale',
    patternId: 'dynamic-programming',
    scene: 'vault',
    leetcode: { name: 'Longest Palindromic Substring', number: 5, difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-palindromic-substring/' },
    problem: 'Given a string, return the longest contiguous substring that reads the same forwards and backwards.',
    example: 's = "babad"  →  "bab" (or "aba", both valid)',

    h: 200,
    props: [
      { id: 'ch1', emoji: '🔠', label: 'b', x: 20, y: 34 },
      { id: 'ch2', emoji: '🔠', label: 'a', x: 36, y: 34 },
      { id: 'ch3', emoji: '🔠', label: 'b', x: 52, y: 34 },
      { id: 'ch4', emoji: '🔠', label: 'a', x: 68, y: 34 },
      { id: 'ch5', emoji: '🔠', label: 'd', x: 84, y: 34 }
    ],
    ledger: [
      { id: 'CE', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "The last poneglyph carries one line that reads identically in both directions. We need the longest such run in the inscription.",
        p: { ch1: 'lit', ch2: 'lit', ch3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Check every substring and test each one? That's every start and end, times the cost of checking. Cubic.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Two better ways. The table version says a run is a palindrome when its ends match and the run inside it is one too — that is a two-dimensional DP over start and end.",
        p: { CE: 'lit' }, l: { CE: 'ends match + inside is one' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Quadratic time and quadratic space. What's the other way?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Grow from the centre. Every palindrome has one, so stand at each position and push outward while the two sides agree.",
        p: { ch2: 'good', ch3: 'good', ch4: 'good' }, l: { CE: 'expand from each centre' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "But 'aba' has a centre ON a letter, and 'abba' has a centre BETWEEN two letters. Those aren't the same kind of position.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is why there are two centres per position — one on the character, one in the gap after it. Roughly two n centres in total, and missing the even case is the classic bug here.",
        p: { ch1: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Quadratic time still, but constant space. And far easier to write than the table.",
        p: { ch5: 'dim' }, l: { CE: '"bab" ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "There is a linear algorithm — Manacher's — and it is worth being able to name. But expand-around-centre is the one to write, and the one they expect.",
        sfx: 'gong'
      }
    ],

    insight: 'Every palindrome has a centre, so expanding outward from each of the 2n − 1 possible centres finds them all — and the even-length case needs the centres that sit between characters, not only on them.',
    complexity: '<b>Time O(n²)</b> — 2n centres, each expanding up to O(n). <b>Space O(1)</b>. The DP table is also O(n²) time but O(n²) space; Manacher\'s algorithm is O(n) and rarely required.',
    pitfall: 'Only considering odd-length centres, which misses <code>"abba"</code> entirely. Also, the expansion must stop at the string bounds, not merely on a mismatch.',
    solution: `def longest_palindrome(s):
    if not s:
        return ""
    start, length = 0, 1

    def expand(left, right):
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        return left + 1, right - left - 1   # the last valid span

    for i in range(len(s)):
        for l, r in ((i, i), (i, i + 1)):   # odd centre, then even centre
            lo, size = expand(l, r)
            if size > length:
                start, length = lo, size
    return s[start:start + length]`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp only expands from centres sitting on a character. What does he return for \"cbbd\"?",
        options: [
          '"c" (or any single letter) instead of "bb" — every even-length palindrome is invisible to him',
          '"bb", correctly',
          '"cbbd"',
          'An empty string'
        ],
        correct: 0,
        explain: 'An even-length palindrome has no middle character, so its centre lies in the gap between two positions. Running the expansion twice per index — once from (i, i) and once from (i, i+1) — covers both families with one helper.',
        hint: 'Where exactly is the centre of "bb"?'
      },
      {
        tag: 'TWEAK',
        q: "The question changes to COUNTING all palindromic substrings rather than finding the longest. What changes?",
        options: [
          'Count one for every successful expansion step instead of tracking a maximum — each step is a distinct palindrome',
          'It requires the DP table',
          'Nothing; the answer is the same',
          'You must enumerate all substrings'
        ],
        correct: 0,
        explain: 'That is LeetCode 647, and the same centres carry it: every time an expansion succeeds, that span is a palindrome worth counting. Reusing one traversal for a different accumulator is the same move as swapping min for max in a grid DP.',
        hint: 'Each successful widening step discovers what, exactly?'
      },
      {
        tag: 'TRANSFER',
        q: "Different inscription: Nami wants the longest palindromic SUBSEQUENCE, where letters need not be adjacent. Does expand-around-centre work?",
        options: [
          'No — subsequences have no contiguous centre to grow from; it is a 2-D DP over (start, end), equivalent to the LCS of the string and its reverse',
          'Yes, with the same code',
          'Yes, if you expand by two positions at a time',
          'No, and it is exponential'
        ],
        correct: 0,
        explain: 'A crucial distinction in this family. Substrings are contiguous, so a centre exists; subsequences may skip, so there is no centre to anchor on. The subsequence version is O(n²) DP — and the observation that it equals LCS(s, reverse(s)) is a neat one to have ready.',
        hint: 'Can you grow "aba" outward from a centre if the letters are scattered through the string?'
      }
    ]
  };

  E['interleaving-string'] = {
    id: 'interleaving-string',
    epNumber: 136,
    title: 'Two Voices, One Transmission',
    arc: 'Laugh Tale',
    patternId: 'dynamic-programming',
    scene: 'vault',
    leetcode: { name: 'Interleaving String', number: 97, difficulty: 'Medium', url: 'https://leetcode.com/problems/interleaving-string/' },
    problem: 'Given strings s1, s2 and s3, determine whether s3 is formed by interleaving s1 and s2, preserving the internal order of each.',
    example: 's1 = "aab", s2 = "axy", s3 = "aaxaby"  →  true',

    h: 200,
    props: [
      { id: 'v1', emoji: '🗣️', label: 's1', x: 24, y: 28 },
      { id: 'v2', emoji: '🗣️', label: 's2', x: 76, y: 28 },
      { id: 'v3', emoji: '📻', label: 's3', x: 50, y: 58 }
    ],
    ledger: [
      { id: 'ST', x: 50, y: 84 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Two voices came through on the same channel, cut together. Each voice's own words are in order, but they alternate unpredictably. Is this recording really those two?",
        p: { v1: 'lit', v2: 'lit', v3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Greedily take whichever voice matches the next sound? If both match, take the first?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That is the trap. When both voices could supply the next sound, the choice matters — one leads to a valid parse and the other to a dead end, and you cannot tell which without looking ahead.",
        p: { ST: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So we'd have to try both and backtrack. Exponential.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Unless we notice that the state is small. All that matters is how many sounds we have taken from each voice — i from the first and j from the second. And i plus j is always our position in the recording.",
        p: { ST: 'good' }, l: { ST: 'state = (i, j)' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So there are only m times n states, not two-to-the-length paths. And each one asks a simple question: can I get here by taking one more from the first voice, or one more from the second?",
        p: { v1: 'good', v2: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Two dimensions, because two things move independently. That is what tells you this is a 2-D table rather than a 1-D one.",
        p: { v3: 'good' }, l: { ST: 'true ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And there's a free rejection before any of it: if the lengths don't add up, it can't possibly be an interleaving.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Each row needs only the row before it, so the table collapses to a single array of the second string's length. The two-dimensional thinking stays; the storage does not have to.",
        sfx: 'gong'
      }
    ],

    insight: 'Two independently advancing indices means a two-dimensional state — and when a greedy choice between two valid moves cannot be resolved locally, the fix is to remember the state rather than to guess.',
    complexity: '<b>Time O(m · n)</b> — one entry per (i, j) pair. <b>Space O(n)</b> with a rolling row, or O(m · n) for the full table. The backtracking version is exponential without memoisation.',
    pitfall: 'Greedily consuming whichever string matches, which fails whenever both match and only one choice leads to a solution. Also, the length check <code>len(s1) + len(s2) == len(s3)</code> is a necessary precondition.',
    solution: `def is_interleave(s1, s2, s3):
    m, n = len(s1), len(s2)
    if m + n != len(s3):
        return False                       # necessary precondition

    # dp[j] = "the first i of s1 and first j of s2 interleave into s3[:i+j]"
    dp = [False] * (n + 1)
    dp[0] = True
    for j in range(1, n + 1):
        dp[j] = dp[j - 1] and s2[j - 1] == s3[j - 1]

    for i in range(1, m + 1):
        dp[0] = dp[0] and s1[i - 1] == s3[i - 1]
        for j in range(1, n + 1):
            dp[j] = ((dp[j] and s1[i - 1] == s3[i + j - 1]) or
                     (dp[j - 1] and s2[j - 1] == s3[i + j - 1]))
    return dp[n]`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper matches greedily, preferring s1 whenever both strings offer the next character. Which shape of input defeats him?",
        options: [
          'Any where both offer the same next character but only the s2 choice leads to a complete parse — for example s1 = "aa", s2 = "ab", s3 = "aaba"',
          'Inputs where s1 is longer than s2',
          'Inputs containing repeated characters in s3 only',
          'None; the greedy rule is correct'
        ],
        correct: 0,
        explain: 'Greedy works only when a locally best choice is never regretted, and here it plainly can be. The general lesson: when you cannot prove the greedy choice safe, the fallback is a state you can memoise — and this problem\'s state is small enough to make that cheap.',
        hint: 'Construct a case where taking from s1 now makes the rest impossible, but taking from s2 does not.'
      },
      {
        tag: 'TRANSFER',
        q: "Different transmission: Franky must decide whether s3 is an interleaving of THREE strings. What is the state?",
        options: [
          'A triple (i, j, k), giving an O(m·n·p) table — the dimension count follows the number of independently advancing indices',
          'Still two dimensions',
          'One dimension, since i+j+k is determined',
          'It becomes exponential and cannot be tabulated'
        ],
        correct: 0,
        explain: 'Each independently moving index is one dimension, so three sources means a three-dimensional table. Note that the position in s3 is still derived rather than stored — i + j + k — which is exactly why the two-string version needs two dimensions and not three.',
        hint: 'How many numbers do you need to describe how much of each source has been consumed?'
      },
      {
        tag: 'TWEAK',
        q: "Why is the position in s3 not a separate dimension of the state?",
        options: [
          'It is fully determined by i + j, so storing it would add nothing but a redundant axis',
          'Because s3 is not needed after the length check',
          'Because s3 is always the longest string',
          'It should be a separate dimension'
        ],
        correct: 0,
        explain: 'A good habit in DP design: before adding a dimension, check whether it is a function of the ones you already have. Redundant axes multiply the table size without adding information — here it would turn an O(mn) table into an O(mn(m+n)) one for no benefit.',
        hint: 'If you have consumed i from s1 and j from s2, how many characters of s3 have you matched?'
      }
    ]
  };

  E['edit-distance'] = {
    id: 'edit-distance',
    epNumber: 137,
    title: 'The Fewest Corrections to the Poneglyph',
    arc: 'Laugh Tale',
    patternId: 'dynamic-programming',
    scene: 'vault',
    leetcode: { name: 'Edit Distance', number: 72, difficulty: 'Medium', url: 'https://leetcode.com/problems/edit-distance/' },
    problem: 'Given two words, return the minimum number of single-character insertions, deletions or replacements needed to turn the first into the second.',
    example: 'word1 = "horse", word2 = "ros"  →  3',

    h: 200,
    props: [
      { id: 'ins', emoji: '➕', label: 'insert', x: 24, y: 32 },
      { id: 'del', emoji: '➖', label: 'delete', x: 50, y: 32 },
      { id: 'rep', emoji: '🔁', label: 'replace', x: 76, y: 32 },
      { id: 'dia', emoji: '↘️', label: 'free on a match', x: 50, y: 62 }
    ],
    ledger: [
      { id: 'T', x: 50, y: 88 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "The copied poneglyph differs from the original. We need the smallest number of corrections — inserting a glyph, deleting one, or replacing one — to make them agree.",
        p: { ins: 'lit', del: 'lit', rep: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Three possible moves at every point. Trying all sequences of them is hopeless.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So ask a smaller question: the cost of turning the first i glyphs into the first j glyphs. That is a table, and every cell has exactly four ways to be reached.",
        p: { T: 'lit' }, l: { T: 'dp[i][j] = cost of prefixes' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "If the two glyphs match, nothing needs doing — the cost is whatever it took to fix everything before them. The diagonal, for free.",
        p: { dia: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And if they differ, take the cheapest of three neighbours and add one: the cell above is a deletion, the cell to the left is an insertion, the diagonal is a replacement.",
        p: { ins: 'good', del: 'good', rep: 'good' }, l: { T: 'min of 3, plus 1' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Each neighbouring cell is one edit away from this one. That's a very clean way to remember which is which.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The base cases are the costs of building from nothing: turning an empty word into j glyphs costs j insertions, and turning i glyphs into nothing costs i deletions. Those are the first row and column.",
        p: { T: 'good' }, l: { T: 'horse → ros = 3 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And each row only needs the one above it, so two arrays are enough if we only want the number.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "If they want the actual list of corrections, keep the full table and walk back through it from the corner. That is the usual price of asking for the solution rather than its cost.",
        sfx: 'gong'
      }
    ],

    insight: 'Each neighbouring cell in the edit table is exactly one edit away — above is a deletion, left an insertion, diagonal a replacement — and a matching pair of characters propagates the diagonal at no cost.',
    complexity: '<b>Time O(m · n)</b>. <b>Space O(min(m, n))</b> with two rolling rows, or O(m · n) if the edit sequence must be reconstructed.',
    pitfall: 'Base cases that are not the empty-prefix costs — <code>dp[i][0]</code> must be i and <code>dp[0][j]</code> must be j, not zero. And forgetting that a match costs nothing rather than costing one.',
    solution: `def min_distance(word1, word2):
    m, n = len(word1), len(word2)
    # Base row: turning an empty prefix into j characters costs j insertions.
    prev = list(range(n + 1))

    for i in range(1, m + 1):
        cur = [i] + [0] * n              # i deletions to reach an empty target
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                cur[j] = prev[j - 1]     # match: the diagonal, free
            else:
                cur[j] = 1 + min(prev[j],      # delete
                                 cur[j - 1],   # insert
                                 prev[j - 1])  # replace
        prev = cur
    return prev[n]`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper initialises the whole table to zero, including the first row and column. What does he compute for word1 = \"abc\" and word2 = \"\"?",
        options: [
          '0, when the answer is 3 — deleting three characters is free under his base cases',
          '3, correctly',
          '1',
          'It crashes'
        ],
        correct: 0,
        explain: 'The first column encodes "turn i characters into nothing", which costs i deletions. Zeroing it claims that deletion is free, and the error propagates into every cell that depends on it. Base cases are the part of a DP most worth writing down in English first.',
        hint: 'What does dp[3][0] mean in words, and what should it cost?'
      },
      {
        tag: 'TWEAK',
        q: "The allowed operations are reduced to insertion and deletion only — no replacement. What changes?",
        options: [
          'Drop the diagonal option on a mismatch; the answer becomes m + n − 2·LCS(word1, word2)',
          'Nothing; replacement is redundant',
          'The table becomes one-dimensional',
          'It becomes unsolvable in polynomial time'
        ],
        correct: 0,
        explain: 'Removing an operation removes a transition. The resulting distance has a neat closed relationship to the longest common subsequence — everything not in the LCS must be deleted from one side and inserted into the other. That is LeetCode 583, and spotting the LCS connection is the point of it.',
        hint: 'Without replacement, what must happen to every character that is not shared?'
      },
      {
        tag: 'TRANSFER',
        q: "Different correction: Nami must decide whether two words are within edit distance ONE of each other. Does she need the full table?",
        options: [
          'No — a single linear scan suffices, since one edit means the strings align except at one position',
          'Yes, the table is required',
          'Yes, but only two rows of it',
          'No, comparing lengths is enough'
        ],
        correct: 0,
        explain: 'When the answer is bounded by a small constant, the general DP is usually overkill. With a length difference of at most one, you can walk both strings in step and allow exactly one divergence — O(n) time and O(1) space. Recognising when a bound collapses the problem is a genuinely useful instinct.',
        hint: 'If only one edit is permitted, how many places can the two strings disagree?'
      }
    ]
  };

  E['best-time-stock-iii'] = {
    id: 'best-time-stock-iii',
    epNumber: 138,
    title: 'Two Voyages, No More',
    arc: 'Laugh Tale',
    patternId: 'dynamic-programming',
    scene: 'vault',
    leetcode: { name: 'Best Time to Buy and Sell Stock III', number: 123, difficulty: 'Hard', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/' },
    problem: 'Given daily prices, find the maximum profit from at most two transactions. You must sell before buying again.',
    example: 'prices = [3,3,5,0,0,3,1,4]  →  6   (buy at 0 sell at 3, buy at 1 sell at 4)',

    h: 200,
    props: [
      { id: 'b1', emoji: '🅱️', label: 'buy 1', x: 18, y: 30 },
      { id: 's1', emoji: '💰', label: 'sell 1', x: 40, y: 30 },
      { id: 'b2', emoji: '🅱️', label: 'buy 2', x: 62, y: 30 },
      { id: 's2', emoji: '💰', label: 'sell 2', x: 84, y: 30 }
    ],
    ledger: [
      { id: 'S', x: 50, y: 76 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "Two trading voyages, no more — and the first cargo must be sold before the second is bought. Maximise the total.",
        p: { b1: 'lit', s1: 'lit', b2: 'lit', s2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Split the days at every possible point, run the single-transaction algorithm on each side, and take the best split?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Correct, and a good first answer — precompute the best profit for every prefix and every suffix, then combine. Linear time, linear space.",
        p: { S: 'lit' }, l: { S: 'prefix + suffix best' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "That works, but it walks the prices three times and keeps two whole arrays. Is there something tighter?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Track four running states as you walk the days once: the best position after buying once, after selling once, after buying twice, and after selling twice.",
        p: { S: 'good' }, l: { S: 'buy1 sell1 buy2 sell2' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "And each state is built from the one before it. Buying the second cargo spends whatever the first sale earned.",
        p: { b1: 'good', s1: 'good' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Exactly — buy2 is the best of 'keep the previous buy2' and 'sell1's profit minus today's price'. The states chain, and updating them in order within a single day is perfectly safe here.",
        p: { b2: 'good', s2: 'good' }, l: { S: 'profit 6 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Four numbers, one pass, constant space. That's elegant.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And it generalises: k transactions means two k states. Which is precisely the next problem, and why this one is worth understanding as a state machine rather than as a trick.",
        sfx: 'gong'
      }
    ],

    insight: 'Model the problem as a small state machine — held-after-first-buy, done-after-first-sell, and so on — and each state updates from the previous one in a single pass.',
    complexity: '<b>Time O(n)</b> — one pass, four constant-time updates. <b>Space O(1)</b>. The prefix/suffix split is also O(n) time but O(n) space.',
    pitfall: 'Assuming two disjoint applications of the single-transaction greedy can be found independently — they interact, since the second buy is constrained by the first sale. Also, "at most two" allows zero or one, so all profits start at zero.',
    solution: `def max_profit(prices):
    # Four states, each the best value achievable having done that much.
    buy1 = buy2 = float('-inf')
    sell1 = sell2 = 0

    for price in prices:
        buy1 = max(buy1, -price)            # spend on the first cargo
        sell1 = max(sell1, buy1 + price)    # sell the first
        buy2 = max(buy2, sell1 - price)     # spend the proceeds on the second
        sell2 = max(sell2, buy2 + price)    # sell the second
    return sell2`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different voyage limit: Franky is allowed at most k transactions for an arbitrary k. How does the state machine scale?",
        options: [
          '2k states — a buy and a sell per allowed transaction, giving O(n·k) time',
          'It stays at four states',
          'k² states',
          'It becomes exponential in k'
        ],
        correct: 0,
        explain: 'That is Best Time IV, and the four-state solution is its k = 2 instance. There is one further subtlety worth knowing: when k exceeds n/2 the limit stops binding and the problem collapses to the unlimited-transactions greedy.',
        hint: 'How many states did two transactions need, and what does that suggest per transaction?'
      },
      {
        tag: 'PITFALL',
        q: "Usopp finds the best single transaction over the whole array, removes those days, and finds the best single transaction over the rest. Why can that be wrong?",
        options: [
          'The optimal pair of transactions need not contain the single best transaction — taking it can block a better combination',
          'It double-counts a day',
          'It is correct but too slow',
          'It fails only when prices are decreasing'
        ],
        correct: 0,
        explain: 'This is a greedy that feels obviously right and is not. On [1, 10, 2, 11] the best single trade is 1 → 11 for 10, but the best pair is 1 → 10 and 2 → 11 for 18. Locally optimal choices can be globally wrong whenever the choices interact — which is the signal for DP.',
        hint: 'Construct prices where the single best trade spans both of the two best trades.'
      },
      {
        tag: 'TWEAK',
        q: "A one-day cooldown is added after every sale. What changes in the state machine?",
        options: [
          'A rest state is needed, and buying may only follow a rest rather than a sale directly',
          'Nothing changes',
          'The number of transactions must be halved',
          'It becomes a greedy problem'
        ],
        correct: 0,
        explain: 'That is LeetCode 309. Adding a constraint means adding or rewiring states — and the fact that it is a small edit rather than a rewrite is exactly the payoff for thinking about the problem as a state machine in the first place.',
        hint: 'After selling, what is the trader allowed to do on the very next day?'
      }
    ]
  };

  E['best-time-stock-iv'] = {
    id: 'best-time-stock-iv',
    epNumber: 139,
    title: 'As Many Voyages as the Charter Allows',
    arc: 'Laugh Tale',
    patternId: 'dynamic-programming',
    scene: 'vault',
    leetcode: { name: 'Best Time to Buy and Sell Stock IV', number: 188, difficulty: 'Hard', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/' },
    problem: 'Given daily prices and an integer k, find the maximum profit from at most k transactions, selling before buying again.',
    example: 'k = 2, prices = [3,2,6,5,0,3]  →  7   (buy 2 sell 6, buy 0 sell 3)',

    h: 200,
    props: [
      { id: 'k1', emoji: '📜', label: 'charter: k trades', x: 50, y: 26 },
      { id: 'st', emoji: '🔁', label: '2k states', x: 30, y: 58 },
      { id: 'cl', emoji: '♾️', label: 'k ≥ n/2 → unlimited', x: 74, y: 58 }
    ],
    ledger: [
      { id: 'R', x: 50, y: 86 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "The charter allows k voyages this season. Same rule — sell before you buy again — and we want the most profit the charter permits.",
        p: { k1: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The two-voyage version used four states. This is the same machine with two k of them: for each allowed transaction, a 'holding' state and a 'sold' state.",
        p: { st: 'good' }, l: { R: '2k states, one pass per day' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "So walk the days once, and for each day update all k pairs of states in order.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "O of n times k, with O of k memory. The transaction index is the second dimension — that is what makes this a two-dimensional DP even though the prices are a flat list.",
        p: { k1: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "And if k is enormous? A charter for a thousand voyages over ten days is not really a limit at all.",
        p: { cl: 'lit' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Precisely. A transaction needs at least two days, so more than n over two of them can never all be used. Above that threshold the constraint stops binding and the answer is the unlimited version — sum every upward step.",
        p: { cl: 'good' }, l: { R: 'k ≥ n/2 → greedy' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Which also stops us allocating a table of a billion states for a ten-day list.",
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That guard is the difference between passing and timing out on this problem. Noticing when a parameter stops binding is worth as much as the recurrence itself.",
        p: { st: 'good' }, l: { R: 'profit 7 ✓' },
        sfx: 'gong'
      }
    ],

    insight: 'The transaction count is the second dimension of the state — and when k exceeds n/2 the limit can never bind, so the problem collapses into the unlimited-transaction greedy.',
    complexity: '<b>Time O(n · k)</b>, or O(n) once the k ≥ n/2 shortcut applies. <b>Space O(k)</b> with rolling states.',
    pitfall: 'Allocating an O(n · k) table before checking whether k is enormous, which blows memory or time on inputs where k is far larger than the price list. Also, "at most k" allows fewer, so the sold states start at zero.',
    solution: `def max_profit(k, prices):
    n = len(prices)
    if n < 2 or k == 0:
        return 0

    # A transaction needs two days, so k >= n/2 means no real limit.
    if k >= n // 2:
        return sum(max(0, prices[i] - prices[i - 1]) for i in range(1, n))

    buys = [float('-inf')] * (k + 1)
    sells = [0] * (k + 1)
    for price in prices:
        for t in range(1, k + 1):
            buys[t] = max(buys[t], sells[t - 1] - price)
            sells[t] = max(sells[t], buys[t] + price)
    return sells[k]`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Nami omits the k ≥ n/2 shortcut and k arrives as 1,000,000,000 with 5 prices. What happens?",
        options: [
          'The state arrays are sized to k, so it exhausts memory or time on an input that is trivially small',
          'It returns the wrong profit',
          'It returns 0',
          'Nothing; the loop simply runs longer'
        ],
        correct: 0,
        explain: 'The failure is about the parameter, not the data. Recognising that a constraint stops binding beyond a threshold — and guarding for it — is a recurring theme in problems where a limit is given as an independent input.',
        hint: 'How large are the buys and sells arrays, and how many prices are there?'
      },
      {
        tag: 'TRANSFER',
        q: "Different charter: unlimited voyages, but each sale costs a fixed fee. What changes in the state machine?",
        options: [
          'Two states suffice — holding and sold — with the fee subtracted at each sale',
          'It needs 2k states again',
          'The greedy sum of upward steps still works unchanged',
          'It becomes exponential'
        ],
        correct: 0,
        explain: 'That is LeetCode 714. With no transaction limit the index dimension disappears, leaving just two states — but the fee means the simple "sum every upward step" greedy is no longer valid, since a tiny gain may not cover the fee.',
        hint: 'Which dimension of the state existed only to count transactions?'
      },
      {
        tag: 'TWEAK',
        q: "Within one day's loop, why is it safe to update <code>sells[t]</code> immediately after <code>buys[t]</code>?",
        options: [
          'Because buying and selling on the same day yields zero profit, so the sequential update cannot invent a gain',
          'Because the arrays are copied first',
          'It is not safe; the arrays must be duplicated',
          'Because sells[t] does not depend on buys[t]'
        ],
        correct: 0,
        explain: 'The usual worry with in-place DP updates is reading a value already advanced by the current step. Here that would mean buying and selling at the same price — a profit of exactly zero, which can never beat an existing best. Being able to argue that rather than defensively copying is what keeps the space at O(k).',
        hint: 'What profit results from buying and selling at the same price on the same day?'
      }
    ]
  };

  E['maximal-square'] = {
    id: 'maximal-square',
    epNumber: 140,
    title: 'The Largest Square of Solid Stone',
    arc: 'Laugh Tale',
    patternId: 'dynamic-programming',
    scene: 'vault',
    leetcode: { name: 'Maximal Square', number: 221, difficulty: 'Medium', url: 'https://leetcode.com/problems/maximal-square/' },
    problem: 'Given a binary matrix, find the largest square containing only 1s and return its area.',
    example: 'A 4x5 grid with a 2x2 block of ones  →  4',

    h: 210,
    props: [
      { id: 'up', emoji: '⬆️', label: 'above', x: 50, y: 26 },
      { id: 'lf', emoji: '⬅️', label: 'left', x: 26, y: 50 },
      { id: 'dg', emoji: '↖️', label: 'diagonal', x: 26, y: 26 },
      { id: 'me', emoji: '⬜', label: 'this corner', x: 50, y: 50 }
    ],
    ledger: [
      { id: 'A', x: 50, y: 84 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Which is the biggest solid square of intact floor in the chamber? Not a rectangle — a square, all ones, no gaps.",
        p: { me: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Try every square at every position and check it? That's an enormous amount of re-checking the same stone.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Anchor the state instead. Let each cell hold the side of the largest solid square whose BOTTOM-RIGHT corner is that cell. Then every cell is answered once.",
        p: { A: 'lit' }, l: { A: 'dp = side of square ending here' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And how big can that square be?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One more than the smallest of the three squares ending above, to the left, and diagonally back. All three must support it — the weakest of them is the binding constraint.",
        p: { up: 'good', lf: 'good', dg: 'good' }, l: { A: '1 + min of three' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So if any one of those three is small, this corner can't extend past it, no matter how solid the other two are.",
        p: { me: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And a cell holding a zero has a square of side zero — no branching needed, the recurrence simply never fires there.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Then the answer is the largest side anywhere, squared. It's the AREA they asked for, not the side.",
        p: { A: 'good' }, l: { A: 'area = side² ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Anchoring a shape at one of its corners is the reusable idea here — it turns 'find the biggest' into 'answer this cell', which is what makes it a DP at all.",
        sfx: 'gong'
      }
    ],

    insight: 'Anchor the shape at a corner so the state becomes "the best square ending here" — and the three touching neighbours are all supports, so the minimum of them is what binds.',
    complexity: '<b>Time O(m · n)</b> — every cell once. <b>Space O(n)</b> with a rolling row, or O(1) extra if the input may be overwritten.',
    pitfall: 'Returning the side length instead of the area. Taking the maximum of the three neighbours rather than the minimum — that computes something that is not a square at all.',
    solution: `def maximal_square(matrix):
    if not matrix:
        return 0
    rows, cols = len(matrix), len(matrix[0])
    prev = [0] * (cols + 1)
    best = 0

    for r in range(rows):
        cur = [0] * (cols + 1)
        for c in range(1, cols + 1):
            if matrix[r][c - 1] == '1':
                # All three neighbours must support it: the weakest binds.
                cur[c] = 1 + min(prev[c], cur[c - 1], prev[c - 1])
                best = max(best, cur[c])
        prev = cur
    return best * best        # the AREA, not the side`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper writes <code>1 + max(up, left, diag)</code> instead of min. On a grid where up = 3, left = 1 and diag = 3, what does he claim?",
        options: [
          'A square of side 4, even though the cells immediately to the left cannot support one — the answer is 2',
          'A square of side 2, correctly',
          'A square of side 1',
          'Nothing; max and min agree here'
        ],
        correct: 0,
        explain: 'Every one of the three neighbours is a support, so a square can only be as large as the weakest allows — that is what min means here. Using max claims a square whose left portion is full of zeros, which is not a square of ones at all.',
        hint: 'Draw the region implied by left = 1. How wide is the solid area immediately to the left of this corner?'
      },
      {
        tag: 'TWEAK',
        q: "The question changes to the largest RECTANGLE of ones rather than the largest square. Does the same recurrence work?",
        options: [
          'No — a rectangle has two independent dimensions, so the standard approach builds a histogram per row and applies largest-rectangle-in-histogram',
          'Yes, with max instead of min',
          'Yes, unchanged',
          'No, and it is exponential'
        ],
        correct: 0,
        explain: 'The square recurrence works because one number — the side — describes the shape. A rectangle needs width and height independently, so the corner-anchored trick no longer captures the state. The standard solution treats each row as the base of a histogram of consecutive ones and reuses the monotonic-stack algorithm.',
        hint: 'How many numbers are needed to describe a rectangle, versus a square?'
      },
      {
        tag: 'TRANSFER',
        q: "Different chamber: Nami counts how many solid squares of any size exist in the grid. What is the smallest change?",
        options: [
          'Sum every dp value — a cell with dp = 3 is the corner of exactly 3 squares, of sides 1, 2 and 3',
          'Count the cells where dp is greater than zero',
          'Square each dp value and sum them',
          'Run the DP once per square size'
        ],
        correct: 0,
        explain: 'A lovely consequence of the state definition: if the largest square ending at a cell has side 3, then squares of side 1, 2 and 3 all end there and nothing larger does. Summing the table therefore counts every square exactly once — that is LeetCode 1277, solved by changing one line.',
        hint: 'If dp[r][c] = 3, how many squares have their bottom-right corner exactly at that cell?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
