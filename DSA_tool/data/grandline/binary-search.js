/* Zou — binary search, including searching over answers.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['search-insert-position'] = {
    id: 'search-insert-position',
    epNumber: 106,
    title: 'Where the New Name Goes on the Roster',
    arc: 'Zou',
    patternId: 'binary-search',
    scene: 'sea',
    leetcode: { name: 'Search Insert Position', number: 35, difficulty: 'Easy', url: 'https://leetcode.com/problems/search-insert-position/' },
    problem: 'Given a sorted array of distinct integers and a target, return the index of the target. If it is absent, return the index where it would be inserted to keep the array sorted.',
    example: 'nums = [1, 3, 5, 6], target = 2  →  1',

    h: 200,
    props: [
      { id: 'n1', emoji: '📋', label: '1', x: 20, y: 34 },
      { id: 'n3', emoji: '📋', label: '3', x: 40, y: 34 },
      { id: 'n5', emoji: '📋', label: '5', x: 60, y: 34 },
      { id: 'n6', emoji: '📋', label: '6', x: 80, y: 34 }
    ],
    ledger: [
      { id: 'L', x: 30, y: 78 },
      { id: 'R', x: 70, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The Mink roster is kept in order. A new name arrives — where does it slot in? And if it's already there, where is it?",
        p: { n1: 'lit', n3: 'lit', n5: 'lit', n6: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Both questions have the same answer: the first position whose name is not smaller than the newcomer. That single phrasing covers found and not-found alike.",
        p: { L: 'lit', R: 'lit' }, l: { L: 'lo', R: 'hi' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So we're not really searching for the target — we're searching for a BOUNDARY. The point where 'smaller than the target' stops being true.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And that is what binary search actually needs. Not a sorted array as such, but a condition that is false, false, false, then true and stays true.",
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Looking for 2 in one, three, five, six. Middle is 3 — not smaller than 2, so the answer is here or to the left. Keep it, move the right edge to it.",
        p: { n3: 'lit' }, l: { R: 'hi = mid' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Note the asymmetry. When the middle might BE the answer, the edge moves to mid, not past it. Move past it and you can step over the only correct position.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Then the range narrows to just position one, and that's the answer. Two would slot in between 1 and 3.",
        p: { n1: 'good', n3: 'good' }, l: { L: 'lo = 1 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And if the newcomer is larger than everyone? Then the boundary is past the end of the roster.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is why the right edge starts at the length, not at the last index. The answer is allowed to be 'one past everything', and the search space has to include it.",
        p: { R: 'good' }, l: { R: 'hi starts at n' },
        sfx: 'gong'
      }
    ],

    insight: 'Binary search needs a monotone predicate, not a sorted array as such — "is this value less than the target?" is false-then-true, and the boundary between them is the answer to both the found and not-found cases.',
    complexity: '<b>Time O(log n)</b> — the range halves each step. <b>Space O(1)</b>.',
    pitfall: 'Setting <code>hi = n - 1</code>, which makes "insert at the end" unreachable. And writing <code>hi = mid - 1</code> in the boundary template, which can step over the answer.',
    solution: `def search_insert(nums, target):
    lo, hi = 0, len(nums)          # hi = n: the answer may be one past the end
    while lo < hi:
        mid = lo + (hi - lo) // 2  # no overflow, even in fixed-width languages
        if nums[mid] < target:
            lo = mid + 1           # mid is ruled out
        else:
            hi = mid               # mid may be the answer — keep it
    return lo`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper reuses the search on a different roster, nums = [2, 4, 9], but initialises <code>hi = len(nums) - 1</code>. With target 11, what does he return?",
        options: [
          '2, when the answer is 3 — the search space never included the position past the end',
          '3, correctly',
          '-1',
          'It loops forever'
        ],
        correct: 0,
        explain: 'The insert position for a value larger than everything is n, and a search bounded at n−1 can never produce it. Deciding the search space before writing the loop — and asking what the largest legal answer is — prevents this whole class of bug.',
        hint: 'What is the largest value the answer is allowed to take, and is it inside the initial range?'
      },
      {
        tag: 'TRANSFER',
        q: "Different roster, same boundary: Nami wants the first day on which the cargo total reaches 500, given daily totals that only ever increase. Which predicate does she binary search?",
        options: [
          '"Is the total on this day below 500?" — false-then-true, and the boundary is the first qualifying day',
          '"Is the total exactly 500?"',
          '"Is this day in the first half?"',
          'None; she must scan linearly'
        ],
        correct: 0,
        explain: 'Monotonicity is what licenses the halving, and a running total that only increases has it. Searching for exact equality fails whenever no day totals exactly 500 — the boundary formulation answers the question either way, which is precisely why it is the more useful template.',
        hint: 'What must be true of the predicate across the whole range for halving to be valid?'
      },
      {
        tag: 'TWEAK',
        q: "The roster now allows duplicates and Robin wants the LAST position where the target occurs. What changes?",
        options: [
          'Search for the boundary of "value ≤ target" and step back one, rather than "value < target"',
          'Nothing; the same search returns it',
          'Scan forward from the first occurrence',
          'Sort the array again'
        ],
        correct: 0,
        explain: 'The two boundaries — first index ≥ target and first index > target — bracket the run of duplicates. Scanning forward from the first occurrence is correct but O(n) when the array is entirely one value, which is exactly the case the problem is testing.',
        hint: 'The run of equal values has two edges. Which predicate lands on each?'
      }
    ]
  };

  E['search-2d-matrix'] = {
    id: 'search-2d-matrix',
    epNumber: 107,
    title: 'The Chart That Reads as One Long Line',
    arc: 'Zou',
    patternId: 'binary-search',
    scene: 'sea',
    leetcode: { name: 'Search a 2D Matrix', number: 74, difficulty: 'Medium', url: 'https://leetcode.com/problems/search-a-2d-matrix/' },
    problem: 'Search a target in an m x n matrix where each row is sorted and the first value of each row is greater than the last value of the previous row.',
    example: 'matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3  →  true',

    h: 210,
    props: [
      { id: 'ra', emoji: '🗺️', label: '1 3 5 7', x: 50, y: 22 },
      { id: 'rb', emoji: '🗺️', label: '10 11 16 20', x: 50, y: 44 },
      { id: 'rc', emoji: '🗺️', label: '23 30 34 60', x: 50, y: 66 }
    ],
    ledger: [
      { id: 'F', x: 50, y: 90 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "The Zou chart is drawn in bands. Each band runs in order, and every band starts after the previous one ends. Is depth 3 marked anywhere on it?",
        p: { ra: 'lit', rb: 'lit', rc: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Binary search each band in turn? That's m searches of log n each.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Read the guarantee again. Every band starts after the previous one ends — so if you laid all the bands end to end, the whole chart is ONE sorted line. There is nothing two-dimensional about it except the drawing.",
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "So binary search over positions zero to m times n minus one, and convert a position back to a band and an offset when I need to read it.",
        p: { F: 'lit' }, l: { F: 'row = i / n,  col = i % n' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Division gives the band, modulo gives the offset within it — the same pairing as the Sudoku box index, used the other way round.",
        p: { F: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Twelve cells, so the middle is position five: band one, offset one — that's 11. Too big, so look left. Then position two: band zero, offset two — that's 5. Still too big. Then position one: 3. Found.",
        p: { ra: 'good' }, l: { F: 'found at (0,1) ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "One search instead of three. Log of twelve rather than three lots of log four.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "There is a sister problem that looks almost identical — rows and columns each sorted, but the bands do NOT chain. That one is not a sorted line, and this trick fails on it.",
        p: { rb: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "For that one you walk from the top-right corner: too big means go left, too small means go down. O of m plus n. Different guarantee, different tool.",
        p: { rb: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'Read the guarantee precisely — a matrix whose rows chain end to end is a sorted array in disguise, and the index formula (i / n, i % n) is all that separates them.',
    complexity: '<b>Time O(log(m · n))</b> — one binary search over the flattened index space. <b>Space O(1)</b>. Searching row by row is O(m log n); the staircase walk for the non-chaining variant is O(m + n).',
    pitfall: 'Applying this to LeetCode 240, where rows and columns are sorted but the rows do not chain — the flattened array is not sorted there and the search silently returns wrong answers.',
    solution: `def search_matrix(matrix, target):
    rows, cols = len(matrix), len(matrix[0])
    lo, hi = 0, rows * cols - 1       # treat it as one sorted array

    while lo <= hi:
        mid = lo + (hi - lo) // 2
        val = matrix[mid // cols][mid % cols]   # unflatten to (row, col)
        if val == target:
            return True
        if val < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return False`,

    quiz: [
      {
        tag: 'TWEAK',
        q: "The guarantee weakens: each row is sorted and each COLUMN is sorted, but a row no longer starts after the previous ends. Does the flatten-and-search trick still work?",
        options: [
          'No — the flattened array is not sorted; walk from the top-right corner instead, moving left when too large and down when too small',
          'Yes, unchanged',
          'Yes, if you search each row separately',
          'No, and the matrix must be sorted first'
        ],
        correct: 0,
        explain: 'That is LeetCode 240, and the difference is exactly the chaining guarantee. From the top-right, each comparison eliminates a whole row or a whole column, giving O(m + n). Telling these two problems apart on sight is the real content of both.',
        hint: 'Write out a small matrix where rows and columns are sorted but a row starts lower than the previous row ended. Is the flattened list sorted?'
      },
      {
        tag: 'TRANSFER',
        q: "Different chart, same flattening: Franky stores a 3-D grid of size a×b×c in one flat array. What is the index for (x, y, z)?",
        options: [
          'x·(b·c) + y·c + z',
          'x + y + z',
          'x·a + y·b + z·c',
          '(x + y)·c + z'
        ],
        correct: 0,
        explain: 'Row-major layout generalises the same way: each step in x skips a whole b×c plane, each step in y skips a row of c. It is the identical arithmetic as (row·cols + col) with one more dimension, and it is worth being able to derive rather than recall.',
        hint: 'How many elements do you skip by advancing x by one?'
      },
      {
        tag: 'PITFALL',
        q: "Nami writes <code>matrix[mid % cols][mid // cols]</code> — the two operators swapped. What happens?",
        options: [
          'It reads the wrong cell and, on a non-square matrix, will index out of bounds',
          'It works, since the matrix is sorted either way',
          'It reads the transposed cell but still finds the target',
          'It always returns False'
        ],
        correct: 0,
        explain: 'Division gives the row because each row holds <code>cols</code> elements; modulo gives the offset within the row. Swapping them reads scattered cells and, once <code>mid % cols</code> exceeds the row count, indexes off the end. Deriving the formula on a small example beats memorising which way round it goes.',
        hint: 'For a 3×4 matrix, what does mid = 5 map to under each version?'
      }
    ]
  };

  E['find-peak-element'] = {
    id: 'find-peak-element',
    epNumber: 108,
    title: 'Climbing the Back of the Elephant',
    arc: 'Zou',
    patternId: 'binary-search',
    scene: 'sea',
    leetcode: { name: 'Find Peak Element', number: 162, difficulty: 'Medium', url: 'https://leetcode.com/problems/find-peak-element/' },
    problem: 'A peak is an element strictly greater than its neighbours. Given an array where neighbouring values are never equal, return the index of any peak in O(log n) time. Treat out-of-bounds neighbours as negative infinity.',
    example: 'nums = [1, 2, 1, 3, 5, 6, 4]  →  1 or 5  (either peak is accepted)',

    h: 200,
    props: [
      { id: 'p1', emoji: '⛰️', label: '1', x: 12, y: 40 },
      { id: 'p2', emoji: '⛰️', label: '2', x: 26, y: 30 },
      { id: 'p3', emoji: '⛰️', label: '1', x: 40, y: 40 },
      { id: 'p4', emoji: '⛰️', label: '3', x: 54, y: 34 },
      { id: 'p5', emoji: '⛰️', label: '5', x: 68, y: 26 },
      { id: 'p6', emoji: '⛰️', label: '6', x: 82, y: 20 },
      { id: 'p7', emoji: '⛰️', label: '4', x: 94, y: 32 }
    ],
    ledger: [
      { id: 'S', x: 50, y: 80 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "Zunesha's back rises and falls. We need any spot higher than both its neighbours — and the edges count as dropping off into the sea.",
        p: { p1: 'lit', p2: 'lit', p3: 'lit', p4: 'lit', p5: 'lit', p6: 'lit', p7: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Just walk along until it stops rising. That's linear, and they've asked for logarithmic. But the array isn't sorted — how can we possibly halve it?",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Sortedness was never the requirement. What binary search needs is a rule that lets you discard half with certainty. And here there is one.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Stand anywhere. If the ground to your right is higher, then walking right you must eventually reach a peak — either it keeps rising to the very end, which makes the last spot a peak, or it turns over somewhere.",
        p: { p4: 'lit', p5: 'lit' }, l: { S: 'rising → a peak lies right' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So the whole left half can be thrown away — not because there's no peak there, but because we're guaranteed one on the right and we only need any peak.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And symmetrically, if the ground to the right is lower, then a peak lies at or to the left of where you stand. One comparison, half the mountain gone.",
        p: { S: 'good' }, l: { S: 'compare mid with mid+1' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Middle of seven is position three, value 3. To its right is 5 — higher. Discard the left half. Then middle of the rest, value 6, and to its right is 4 — lower. Keep the left. Converges on position five.",
        p: { p6: 'good' }, l: { S: 'peak at index 5 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "The condition that no two neighbours are equal is doing real work here, isn't it.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "It is what makes the comparison decisive. On a plateau neither direction is guaranteed, and the problem becomes genuinely linear — a constraint that looks decorative and is in fact the whole licence.",
        sfx: 'gong'
      }
    ],

    insight: 'Binary search needs a decisive halving rule, not a sorted array — an uphill slope guarantees a peak ahead, so half the range can be discarded on a single comparison.',
    complexity: '<b>Time O(log n)</b> — one comparison per halving. <b>Space O(1)</b>. A linear scan is correct but does not meet the stated bound.',
    pitfall: 'Comparing against both neighbours and handling the edges separately, which is fiddly. Comparing <code>nums[mid]</code> with <code>nums[mid + 1]</code> alone is sufficient, provided <code>hi</code> starts at n − 1 so mid + 1 is always in range.',
    solution: `def find_peak_element(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if nums[mid] < nums[mid + 1]:
            lo = mid + 1        # uphill: a peak is guaranteed to the right
        else:
            hi = mid            # downhill or flat-topped: mid may be the peak
    return lo                   # lo == hi, and it is a peak`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different climb, same argument: Nami has an array that increases then decreases (a bitonic mountain) and wants the single summit. Does the same comparison work?",
        options: [
          'Yes — compare mid with mid+1 and move toward the higher side; the unimodal shape guarantees convergence on the summit',
          'No, bitonic arrays need a linear scan',
          'Yes, but only if the array is sorted first',
          'No, the comparison must be with mid-1 instead'
        ],
        correct: 0,
        explain: 'Find Peak Element is the general case; a bitonic array is the special case with exactly one peak, so the same halving finds it and is now guaranteed to find THE peak rather than any peak. Recognising the shared structure means one implementation covers both.',
        hint: 'What does the mountain shape guarantee that the general array does not?'
      },
      {
        tag: 'TWEAK',
        q: "The guarantee that neighbours are never equal is removed, so plateaus are possible. What breaks?",
        options: [
          'On a plateau neither direction is guaranteed to contain a peak, so no half can be safely discarded and it degrades to O(n)',
          'Nothing; the algorithm is unaffected',
          'Only the edge cases break',
          'It loops forever'
        ],
        correct: 0,
        explain: 'The halving rests on a strict comparison giving a definite direction. Equal neighbours give no information about where a peak lies, so you may have to inspect both sides — the classic example being an array that is entirely one value. Constraints that look like tidying often carry the algorithm.',
        hint: 'On [3, 3, 3, 3, 3], which half does the comparison tell you to keep?'
      },
      {
        tag: 'PITFALL',
        q: "Chopper writes the loop as <code>while lo &lt;= hi</code> with <code>hi = mid</code> in the else branch. What happens?",
        options: [
          'An infinite loop when lo equals hi — the range stops shrinking',
          'It returns the wrong index',
          'It skips the last element',
          'Nothing; both forms are equivalent'
        ],
        correct: 0,
        explain: 'With <code>hi = mid</code> the range can stay the same size once lo equals hi, and <code>lo &lt;= hi</code> keeps looping over it. The two templates are internally consistent pairs: <code>lo &lt; hi</code> with <code>hi = mid</code>, or <code>lo &lt;= hi</code> with <code>hi = mid − 1</code>. Mixing them is the classic cause of a hang.',
        hint: 'When lo and hi are equal, what does mid become, and what does hi become?'
      }
    ]
  };

  E['find-first-last-position'] = {
    id: 'find-first-last-position',
    epNumber: 109,
    title: 'The Two Ends of a Repeated Name',
    arc: 'Zou',
    patternId: 'binary-search',
    scene: 'sea',
    leetcode: { name: 'Find First and Last Position of Element in Sorted Array', number: 34, difficulty: 'Medium', url: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/' },
    problem: 'Given a sorted array, find the starting and ending index of a target value. Return [-1, -1] if it is absent. The whole thing must run in O(log n).',
    example: 'nums = [5, 7, 7, 8, 8, 10], target = 8  →  [3, 4]',

    h: 200,
    props: [
      { id: 'q0', emoji: '📜', label: '5', x: 14, y: 34 },
      { id: 'q1', emoji: '📜', label: '7', x: 30, y: 34 },
      { id: 'q2', emoji: '📜', label: '7', x: 46, y: 34 },
      { id: 'q3', emoji: '📜', label: '8', x: 62, y: 34 },
      { id: 'q4', emoji: '📜', label: '8', x: 78, y: 34 },
      { id: 'q5', emoji: '📜', label: '10', x: 94, y: 34 }
    ],
    ledger: [
      { id: 'A', x: 32, y: 78 },
      { id: 'B', x: 72, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The name appears more than once in the ledger, and we need both ends of the run — where it starts and where it stops.",
        p: { q3: 'lit', q4: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Find it with a normal binary search, then walk outward until the name changes?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is fine until the whole ledger is that one name. Then walking outward reads every entry — linear, and precisely the case the problem is testing.",
        p: { q1: 'bad', q2: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So instead of stopping when we find it, we keep searching. For the first end, keep going left even after a match.",
        p: { A: 'lit' }, l: { A: 'first ≥ target' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Two boundary searches. The first index whose value is at least the target, and the first index whose value is greater than it. Those two bracket the run exactly.",
        p: { B: 'lit' }, l: { B: 'first > target' },
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "First index at least 8 is position three. First index greater than 8 is position five. So the run is three to four.",
        p: { q3: 'good', q4: 'good' }, l: { A: 'lo = 3', B: 'hi = 5 → last 4' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And absence falls out with no extra case. If the first boundary lands past the end, or the value there is not the target, the name is not in the ledger at all.",
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Two searches of log n each. Still logarithmic, whatever the run length.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And both are the same template with one character changed — less-than for the left edge, less-than-or-equal for the right. Learn one boundary search properly and you get this whole family for free.",
        p: { A: 'good', B: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'Two boundary searches bracket a run of equal values: the first index ≥ target and the first index > target — the same template with one comparison flipped.',
    complexity: '<b>Time O(log n)</b> — two independent binary searches. <b>Space O(1)</b>. Finding one occurrence and expanding outward is O(n) when the array is a single repeated value.',
    pitfall: 'Expanding linearly from a found index, which fails the complexity requirement on the very input the problem is designed around. Also, the "not found" check must happen after the left boundary search, before indexing with it.',
    solution: `def search_range(nums, target):
    def bound(pred):
        lo, hi = 0, len(nums)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if pred(nums[mid]):
                lo = mid + 1
            else:
                hi = mid
        return lo

    left = bound(lambda v: v < target)      # first index >= target
    if left == len(nums) or nums[left] != target:
        return [-1, -1]
    right = bound(lambda v: v <= target)    # first index > target
    return [left, right - 1]`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper finds one occurrence and walks outward in both directions. On an array of 100,000 identical values, what is his cost?",
        options: [
          'O(n) — the walk reads every element, which is exactly the case the O(log n) requirement targets',
          'O(log n), unchanged',
          'O(n log n)',
          'O(1)'
        ],
        correct: 0,
        explain: 'The binary search is logarithmic but the expansion is proportional to the run length. Since the run can be the entire array, the overall cost is linear. This is a good example of an added step quietly dominating the algorithm it was bolted onto.',
        hint: 'How many steps does the outward walk take when every value is the target?'
      },
      {
        tag: 'TRANSFER',
        q: "Different ledger, same brackets: Nami wants to COUNT how many entries equal the target. What is the smallest change?",
        options: [
          'Subtract the two boundaries — the count is (first index > target) minus (first index ≥ target)',
          'Run the search once and multiply by two',
          'Scan the run and count',
          'It requires a hash map'
        ],
        correct: 0,
        explain: 'The two boundaries already delimit the run, so their difference is its length — no third search and no scanning. It is the same reason prefix sums answer range queries by subtraction: two boundary values describe the interval between them.',
        hint: 'You already have both ends of the run. What is the length of an interval given its two edges?'
      },
      {
        tag: 'TWEAK',
        q: "The target is absent entirely — say target = 6 in [5, 7, 7, 8]. What does the left boundary search return, and what does the code do with it?",
        options: [
          'It returns 1, the insert position; the value there is 7, not 6, so the code returns [-1, -1]',
          'It returns -1 directly',
          'It returns 0 and the code wrongly reports a match',
          'It throws, because 6 is not present'
        ],
        correct: 0,
        explain: 'A boundary search always returns a valid insert position, never a "not found" signal — so the absence check is a separate step: is the index in range, and does the value there actually equal the target. Skipping it is the standard way this solution reports a phantom match.',
        hint: 'What does the boundary search return when the target is missing, and is that index meaningful?'
      }
    ]
  };

  E['median-two-sorted-arrays'] = {
    id: 'median-two-sorted-arrays',
    epNumber: 110,
    title: 'The Cut That Balances Two Ledgers',
    arc: 'Zou',
    patternId: 'binary-search',
    scene: 'sea',
    leetcode: { name: 'Median of Two Sorted Arrays', number: 4, difficulty: 'Hard', url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/' },
    problem: 'Given two sorted arrays, return the median of their combined elements. The overall run time must be O(log(m + n)).',
    example: 'nums1 = [1, 3], nums2 = [2]  →  2.0',

    h: 210,
    props: [
      { id: 'A1', emoji: '📘', label: 'ledger A', x: 28, y: 26 },
      { id: 'B1', emoji: '📙', label: 'ledger B', x: 72, y: 26 },
      { id: 'cut', emoji: '✂️', label: 'one cut each', x: 50, y: 56 }
    ],
    ledger: [
      { id: 'L', x: 28, y: 84 },
      { id: 'R', x: 72, y: 84 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "Two ledgers, each already in order, and we need the middle value of the two combined — without combining them, because they've asked for logarithmic time.",
        p: { A1: 'lit', B1: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Merging them is linear and easy. Logarithmic in the total means we can't even LOOK at every entry.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then stop thinking about the median as a value and think of it as a CUT. We need to split the combined ledger into a left half and a right half of equal size, where everything on the left is at most everything on the right.",
        p: { cut: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "And each ledger gets exactly one cut. So if I choose how many entries to take from A, the number from B is forced — the halves must add to half the total.",
        p: { L: 'lit', R: 'lit' }, l: { L: 'take i from A', R: 'take k-i from B' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One free choice, and it is what we binary search over. Not the values — the position of the cut in the smaller ledger.",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'left',
        line: "How do I know a cut is the right one?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Check the four entries either side of the two cuts. The cut is correct when A's last-taken is at most B's first-untaken, and B's last-taken is at most A's first-untaken. Otherwise you have taken too many from one side and you move the cut.",
        p: { cut: 'good' }, l: { L: 'A[i-1] ≤ B[j]', R: 'B[j-1] ≤ A[i]' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Then the median is either the largest on the left, or the average of that and the smallest on the right, depending on whether the total is odd or even.",
        p: { A1: 'good', B1: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Always binary search the SMALLER ledger — it bounds the number of steps and keeps the index arithmetic in range. And treat a cut at either end as plus or minus infinity, so the empty side never needs a special case.",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Infinities instead of edge cases. That turns four awkward branches into no branches at all.",
        sfx: 'gong'
      }
    ],

    insight: 'Binary search the partition rather than the value — one cut in the smaller array forces the other, and four boundary comparisons say whether the cut is correct or which way to move it.',
    complexity: '<b>Time O(log(min(m, n)))</b> — the search runs over the smaller array only. <b>Space O(1)</b>. Merging is O(m + n), which is far simpler and worth offering first if the bound is not demanded.',
    pitfall: 'Searching the larger array, which lets the derived index fall out of range. And handling the empty-side cases by hand instead of using ±infinity sentinels, which is where most implementations break.',
    solution: `def find_median_sorted_arrays(nums1, nums2):
    # Always search the smaller array: fewer steps, and j stays in range.
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    m, n = len(nums1), len(nums2)
    half = (m + n + 1) // 2

    lo, hi = 0, m
    while lo <= hi:
        i = (lo + hi) // 2          # taken from nums1
        j = half - i                # forced: taken from nums2

        # Sentinels remove every empty-side special case.
        a_left = nums1[i - 1] if i > 0 else float('-inf')
        a_right = nums1[i] if i < m else float('inf')
        b_left = nums2[j - 1] if j > 0 else float('-inf')
        b_right = nums2[j] if j < n else float('inf')

        if a_left <= b_right and b_left <= a_right:
            if (m + n) % 2:
                return max(a_left, b_left)
            return (max(a_left, b_left) + min(a_right, b_right)) / 2
        if a_left > b_right:
            hi = i - 1              # took too many from nums1
        else:
            lo = i + 1              # took too few from nums1
    return 0.0`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp binary searches the LARGER array instead of the smaller one. What goes wrong?",
        options: [
          'The derived index into the other array can fall outside it, since the smaller array may not have enough elements to supply the rest of the half',
          'Nothing; it is symmetric',
          'It becomes O(log(m + n)) instead of O(log(min(m, n)))',
          'The median is computed from the wrong side'
        ],
        correct: 0,
        explain: 'With i taken from a long array, j = half − i can exceed the short array\'s length or go negative. Searching the smaller side keeps j within bounds by construction, which is why that swap is the first line of every correct implementation rather than an optimisation.',
        hint: 'If nums1 has 1000 elements and nums2 has 2, what values can j take?'
      },
      {
        tag: 'TRANSFER',
        q: "Different question, same cut: Nami wants the kth smallest element across the two ledgers rather than the median. Does the partition idea still apply?",
        options: [
          'Yes — search for the cut where exactly k elements lie on the left, then take the larger of the two left-hand boundary values',
          'No, only the median can be found this way',
          'Yes, but only for k less than the shorter array\'s length',
          'No, it requires merging'
        ],
        correct: 0,
        explain: 'The median is the special case k = (m+n)/2, so the general kth-element version is the same search with a different target size for the left half. Seeing the median as a particular cut rather than as a special quantity is exactly what makes this generalisation obvious.',
        hint: 'What did "half" represent in the median version, and what would it become here?'
      },
      {
        tag: 'TWEAK',
        q: "One of the arrays is empty. Does the sentinel version need an extra case?",
        options: [
          'No — the cut in the empty array is forced to 0, and its ±infinity sentinels make both comparisons pass automatically',
          'Yes, empty input must be checked first',
          'Yes, it divides by zero',
          'No, but only if the other array has odd length'
        ],
        correct: 0,
        explain: 'That is what the sentinels are for. With m = 0 the loop runs once with i = 0, both of nums1\'s boundaries become infinities, and the comparisons reduce to a plain median of the non-empty array. Replacing edge cases with values that behave correctly is a technique worth reaching for generally.',
        hint: 'Substitute −infinity and +infinity into the two comparison conditions and see what they become.'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
