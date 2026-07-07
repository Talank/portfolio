window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['two-pointers'] = {
  id: 'two-pointers',
  title: 'Two Pointers',
  category: 'Arrays & Two-Pointer Family',
  timeMin: 12,
  summary: 'Walk two indices toward each other across a sorted (or sortable) array to find pairs/triplets in O(n) instead of checking every pair.',
  concept: [
    'On a sorted array, two pointers <code>L</code> (starting at index 0) and <code>R</code> (starting at the last index) converge toward each other. At each step you compare <code>nums[L] + nums[R]</code> against a target: if the sum is too small, only increasing <code>L</code> can help (every value to the right of <code>L</code> is ≥ <code>nums[L]</code>); if it\'s too large, only decreasing <code>R</code> can help. This is a convergent scan — contrast with sliding window, where both pointers move in the <i>same</i> direction over a contiguous run.',
    'The correctness argument rests entirely on sortedness: moving <code>L</code> right can only increase the sum, moving <code>R</code> left can only decrease it, so you never have to backtrack or re-check a pair you\'ve already ruled out. That monotonic guarantee is what collapses the O(n²) all-pairs search into O(n).',
    'The same convergent-pointer skeleton generalizes past "sum equals target": greedily choosing which pointer to move based on a local comparison (not a target) solves problems like Container With Most Water, and fixing one index while running two pointers on the remainder is how 3Sum reduces to repeated 2Sum.',
    'Look closer at *why* the greedy move is safe and you find the same argument every time: at each step you\'re standing on a claim of the form "every pair that keeps this pointer where it is has already been checked, or provably can\'t be better." For Two Sum, once <code>nums[L] + nums[R] < target</code>, every pair <code>(L, R\')</code> with <code>R\' < R</code> is even smaller (array is sorted), so <code>R</code> is exhausted as a partner for <code>L</code> — the only remaining hope is a bigger <code>L</code>. That\'s not a heuristic, it\'s a proof, and it\'s what lets you discard an entire triangle of the O(n²) grid of pairs in one comparison instead of checking each cell.',
    'It helps to picture the search space as an n×n grid where cell (i, j) is the pair (nums[i], nums[j]) and you only ever care about the upper triangle i<j. A brute-force scan visits every cell. Two pointers instead walks the *anti-diagonal frontier* of that triangle: starting at the corner (0, n-1), each comparison eliminates an entire row or column at once — either "every remaining pair with this R is too big" or "every remaining pair with this L is too small." That\'s the geometric reason it\'s O(n) instead of O(n²): you\'re not skipping checks cleverly, you\'re proving whole regions of the grid can\'t contain the answer before you ever look at them.',
  ],
  recognitionSignals: [
    'Array is sorted (or you\'re free to sort it) and the task is to find a pair or triplet whose sum/relationship matches a target.',
    'An explicit O(1) extra space constraint that rules out the obvious hash-map one-pass approach.',
    'Distinguish from sliding window: two pointers here start at opposite ends and converge; sliding window pointers both start together and both only move forward, expanding/shrinking a contiguous range.',
    'Distinguish from fast/slow pointers: two pointers need random access into static, indexable data and converge from both ends; fast/slow move in the same direction at different speeds, typically over a linked structure with no random access.',
    'If duplicates in the output must be avoided (triplets, quadruplets), that\'s a strong tell you\'re looking at a "fix one index, two-pointer the rest" variant like 3Sum.',
  ],
  complexity: 'Time: O(n) for the two-pointer sweep itself (O(n log n) total if the input must be sorted first). Space: O(1) beyond the input, or O(n) if you must preserve original indices via a side array, or O(n) for 3Sum-style triplet output.',
  canonical: {
    name: 'Two Sum II — Input Array Is Sorted (LeetCode 167)',
    statement: 'Given a 1-indexed array of integers sorted in non-decreasing order, find two numbers such that they add up to a specific target number. Return the indices of the two numbers, 1-indexed, as an array of length two. You may assume exactly one solution exists, and you may not use the same element twice.',
  },
  story: {
    onePiece: {
      title: 'Chopper\'s two-hand dosage check',
      text: [
        'Someone on the crew has been poisoned, and Chopper has exactly one shot at the antidote. His medicine shelf is lined up sorted from weakest berry to strongest — that ordering isn\'t an accident, it\'s how he always stores them, and it\'s the one fact that makes what happens next possible. Sanji is dying, there\'s no time to test every possible pair of berries, and there are hundreds of them.',
        'Chopper puts his own hoof on the weakest berry, left end of the shelf. He shouts for Usopp to slam a hand down on the strongest berry, right end of the shelf. They call out the combined potency. Too weak — and Chopper knows, instantly, without checking anything else, that the strongest berry is already doing all it can, so pairing it with anything weaker than his current one is hopeless; he slides one berry to the right. Too strong — Usopp backs off one berry toward the middle, because the weakest berry is already contributing the least it possibly can. They keep sliding toward each other, never back the way they came, until the shout comes back "that\'s it, exact dose" — or their hands cross, and they know no pair on the whole shelf works.',
        'They never once checked a pair from the middle out of order, and they never re-checked a berry they\'d already ruled out. That discipline — always move the side that provably can\'t be right, never wander back — is the entire algorithm.',
      ],
    },
    history: {
      title: 'The Golden Spike, Promontory Summit, 1869',
      text: [
        'In 1863 two construction crews started laying the First Transcontinental Railroad from opposite ends of the continent: the Central Pacific pushed east from Sacramento, the Union Pacific pushed west from Omaha. Nobody sat in the middle waiting for both crews to arrive by coincidence — the whole point of building from both ends at once was that the two fronts would provably converge, closing the gap from both directions at once instead of one crew crossing the entire country alone.',
        'On May 10, 1869, the two lines met at Promontory Summit, Utah, and a ceremonial golden spike joined them. The engineering feat wasn\'t "search the whole country for where the tracks should meet" — it was: keep advancing whichever front is behind, and the meeting point finds itself.',
      ],
    },
    why: 'Two pointers is an abstract argument about monotonicity — easy to state, easy to forget the reason for under pressure. Wiring it to Chopper\'s panic (why you move a *specific* side, not either side) and to two rail crews (why starting from both ends beats a single linear scan) gives you two different, vivid retrieval paths back to the same proof. If you blank on "which pointer moves," picture Usopp\'s hand recoiling from a too-strong berry before you try to re-derive it algebraically.',
  },
  tricks: [
    {
      name: 'Preserve original indices before sorting',
      idea: 'Two pointers requires sortedness, but sorting a plain array throws away the original positions — and many variants of this problem (unlike LeetCode 167, which is already sorted) ask for the original indices in the answer.',
      before:
`def two_sum_indices(nums, target):
    nums.sort()  # original indices are gone — nums[i] no longer means "index i"
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target:
            return [left, right]  # WRONG: these are post-sort positions
        left += 1 if s < target else 0
        right -= 1 if s >= target else 0`,
      after:
`def two_sum_indices(nums, target):
    # carry (value, original_index) pairs through the sort instead of raw values
    indexed = sorted(enumerate(nums), key=lambda pair: pair[1])
    left, right = 0, len(indexed) - 1
    while left < right:
        s = indexed[left][1] + indexed[right][1]
        if s == target:
            return sorted([indexed[left][0], indexed[right][0]])
        if s < target:
            left += 1
        else:
            right -= 1
    return []`,
      explain: 'enumerate(nums) tags every value with its original index before sorting, so the ordering used for the pointer sweep and the identity used for the answer travel together. This is the single most common way this pattern breaks in practice — the algorithm is correct, but the returned indices refer to the wrong array.',
    },
    {
      name: 'Container With Most Water: move the shorter wall, not "try both"',
      idea: 'There\'s no target sum here, so it\'s tempting to fall back on checking every combination "to be safe." The greedy rule is a proof, not a guess, and skipping it silently produces a suboptimal answer on inputs just large enough that eyeballing the test case doesn\'t catch it.',
      before:
`def max_area(height):
    best = 0
    left, right = 0, len(height) - 1
    while left < right:
        area = min(height[left], height[right]) * (right - left)
        best = max(best, area)
        # "just try moving the taller one sometimes" — breaks the proof, can miss the optimum
        if height[left] > height[right]:
            right -= 1
        else:
            left += 1
    return best`,
      after:
`def max_area(height):
    best = 0
    left, right = 0, len(height) - 1
    while left < right:
        h = min(height[left], height[right])
        best = max(best, h * (right - left))
        # always advance the SHORTER wall — it's the only pointer whose movement
        # could possibly reveal a taller wall and thus a larger area
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return best`,
      explain: 'Area is capped by the shorter wall. Moving the taller wall inward can only shrink the width while the cap stays the same or gets worse — it can never help. Moving the shorter wall is the only move that has a chance of finding a taller wall and a bigger area, so it\'s not "a" greedy choice, it\'s the *only* defensible one.',
    },
  ],
  variants: [
    {
      company: 'Google-style',
      title: '3Sum (LeetCode 15) — find all triplets summing to zero',
      twist: 'Sort the array, then fix an index <code>i</code> and run the exact two-pointer sweep from the canonical problem on the remainder with target <code>-nums[i]</code>, for every <code>i</code>. The non-obvious part isn\'t the outer loop — it\'s deduplication: you must skip repeated values for <code>i</code> (<code>if i > 0 and nums[i] == nums[i-1]: continue</code>) <b>and</b> skip repeated values for <code>L</code>/<code>R</code> after a match is found, or you\'ll emit the same triplet multiple times. This pushes complexity to O(n²), and interviewers watch specifically for whether you dedupe at all three positions, not just the outer one.',
    },
    {
      company: 'Meta-style',
      title: 'Container With Most Water (LeetCode 11)',
      twist: 'There\'s no target sum to compare against — you\'re maximizing <code>min(height[L], height[R]) * (R - L)</code>. The pointer-movement rule changes fundamentally: instead of comparing a running sum to a target, you always move the pointer at the <b>shorter</b> height inward, because keeping the shorter wall fixed while shrinking the width can never produce a larger area than moving past it — the taller wall was never the bottleneck. Proving that greedy choice out loud (not just coding it) is what separates a strong answer here.',
    },
    {
      company: 'Amazon-style',
      title: '3Sum Closest (LeetCode 16) — no exact match required',
      twist: 'Instead of returning as soon as <code>sum == target</code>, you track <code>best_diff = abs(sum - target)</code> across every triplet examined and never exit early, since the closest sum could occur anywhere in the scan. The pointer-move decision (shrink <code>R</code> if sum too high, grow <code>L</code> if too low) stays identical to the canonical problem, but the "am I done" condition disappears entirely — the loop always runs to completion, which trips people who\'ve memorized the early-return template.',
    },
  ],
  pythonSolution: {
    title: 'Two Sum II — Input Array Is Sorted',
    code:
`def two_sum_sorted(numbers: list[int], target: int) -> list[int]:
    left, right = 0, len(numbers) - 1
    while left < right:
        total = numbers[left] + numbers[right]
        if total == target:
            return [left + 1, right + 1]   # LeetCode 167 wants 1-indexed positions
        if total < target:
            left += 1
        else:
            right -= 1
    return []`,
    notes: [
      'Tuple assignment <code>left, right = 0, len(numbers) - 1</code> initializes both pointers in one line, the idiomatic Python pattern for paired state.',
      'A single <code>while left < right</code> loop with a three-way branch (<code>==</code>, <code>&lt;</code>, else) mirrors the monotonic argument directly — no nested loops, no lookahead.',
      'The <code>+ 1</code> offset for LeetCode\'s 1-indexing is isolated to the single return line, keeping the core comparison logic clean and 0-indexed internally — convert at the boundary, not throughout the algorithm.',
      'For 3Sum, wrap this exact function\'s body in an outer <code>for i, v in enumerate(nums)</code> with target <code>-v</code>, and add the two dedupe checks noted in the 3Sum variant above.',
    ],
  },
  pitfalls: [
    'Using <code>left <= right</code> instead of <code>left < right</code> as the loop condition lets the same element pair with itself, violating the "two different indices" requirement.',
    'Applying two pointers to an unsorted array without sorting first (or without realizing the input already guarantees sortedness) — the entire correctness argument depends on it.',
    'For 3Sum, deduping only the outer loop variable and forgetting to also skip duplicate values at <code>L</code> and <code>R</code> after a successful match, which produces repeated triplets in the output.',
    'For Container With Most Water, moving the taller pointer instead of the shorter one "just to try both" — this is provably wrong, not a style choice, and produces a suboptimal answer that\'s easy to miss on small test cases.',
  ],
  viz: {
    type: 'array',
    initialArray: [2, 3, 5, 8, 11, 15, 19],
    steps: [
      { highlights: { 0: 'a', 6: 'b' }, pointers: { L: 0, R: 6 }, vars: { target: 16, sum: 21 }, message: 'L=0 (2), R=6 (19). sum=21 > target(16) → sum too large, move R left to shrink it.' },
      { highlights: { 0: 'a', 5: 'b' }, pointers: { L: 0, R: 5 }, vars: { target: 16, sum: 17 }, message: 'L=0 (2), R=5 (15). sum=17 > target(16) → still too large, move R left again.' },
      { highlights: { 0: 'a', 4: 'b' }, pointers: { L: 0, R: 4 }, vars: { target: 16, sum: 13 }, message: 'L=0 (2), R=4 (11). sum=13 < target(16) → sum too small, move L right to grow it.' },
      { highlights: { 1: 'a', 4: 'b' }, pointers: { L: 1, R: 4 }, vars: { target: 16, sum: 14 }, message: 'L=1 (3), R=4 (11). sum=14 < target(16) → still too small, move L right again.' },
      { highlights: { 2: 'c', 4: 'c' }, pointers: { L: 2, R: 4 }, vars: { target: 16, sum: 16 }, message: 'L=2 (5), R=4 (11). sum=16 == target → found! Return indices [2, 4].' },
      { highlights: { 2: 'c', 4: 'c' }, pointers: { L: 2, R: 4 }, vars: { target: 16, sum: 16 }, message: 'Answer: nums[2] + nums[4] = 5 + 11 = 16. Converged in 5 comparisons instead of scanning all C(7,2)=21 pairs.' },
    ],
  },
  quiz: [
    {
      q: 'Which phrasing most strongly signals a convergent two-pointer approach rather than sliding window?',
      options: [
        'Find the longest contiguous substring satisfying some condition',
        'Array is sorted; find a pair (or triplet) of elements whose sum matches a target',
        'Find the maximum path sum in a binary tree',
        'Count the number of connected components in a graph',
      ],
      correct: 1,
      explain: 'Sliding window is for contiguous-subarray "longest/shortest/count" questions where both pointers move forward together. A sorted array plus a pair/triplet-sum target is the two-pointer-from-both-ends signature.',
    },
    {
      q: 'What is the time complexity of Two Sum II given the array is already sorted?',
      options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(log n)'],
      correct: 2,
      explain: 'L and R together traverse the array once, each moving strictly toward the other and never backtracking, so total work is O(n). (If you had to sort first, it would be O(n log n) overall — but the pointer sweep itself is linear.)',
    },
    {
      q: 'In the reference solution, why is the loop condition `left < right` and not `left <= right`?',
      options: [
        'It has no effect on correctness either way',
        '`<=` would allow left and right to reference the same index, using one element twice, which the problem forbids',
        '`<=` would cause an infinite loop',
        '`<=` is required to handle duplicate values correctly',
      ],
      correct: 1,
      explain: 'The problem requires two distinct indices. Once left meets right, there is only one element left to consider, which can\'t form a valid pair with itself.',
    },
    {
      q: 'In the Container With Most Water variant, why do you move the pointer at the *shorter* height rather than the taller one?',
      options: [
        'It\'s an arbitrary convention with no effect on the answer',
        'Moving the taller pointer is faster to compute',
        'The shorter height is always the bottleneck on area; keeping it fixed while shrinking width can never beat moving past it, so moving the taller pointer can only ever discard potentially-better answers',
        'Because the array must be sorted first, and the shorter value is always on the correct side',
      ],
      correct: 2,
      explain: 'Area is bounded by min(height[L], height[R]). If you move the taller pointer inward, the width shrinks but the bottleneck height stays the same or gets worse — you can never find a better answer that way. Moving the shorter pointer is the only move that can possibly improve the result.',
    },
    {
      q: 'You\'re given an *unsorted* array and asked to return the original indices of a pair summing to a target, in O(n) time. Why can\'t you just sort and run the standard two-pointer sweep?',
      options: [
        'Two pointers only work on arrays of even length',
        'Sorting destroys the original index-to-value mapping, so you\'d need a side array of (value, original_index) pairs before sorting — otherwise a plain hash-map one-pass (LeetCode 1) is the simpler O(n) fix',
        'Two pointers require the array to already contain no duplicates',
        'It\'s impossible to solve this variant in less than O(n²)',
      ],
      correct: 1,
      explain: 'Two pointers depend on positional order matching value order. Sorting a copy while keeping track of original indices works but adds bookkeeping and O(n) space; in practice, if you need original unsorted indices and O(n) time, a hash map storing value→index in one pass is the standard, simpler answer.',
    },
  ],
};
