window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['prefix-sum'] = {
  id: 'prefix-sum',
  title: 'Prefix Sum',
  category: 'Hashing & Linear Structures',
  timeMin: 12,
  summary: 'Precompute a running aggregate over the array once, so that any range query, or any "does an earlier running total exist that completes this one" check, becomes an O(1) lookup instead of a re-scan.',
  concept: [
    'A prefix sum array P turns repeated re-summing into repeated subtraction. Define P[i] as the sum of the first i elements (P[0] = 0, representing "nothing read yet"). Once P is built in a single O(n) pass, the sum of any range nums[i..j] is just P[j+1] − P[i] — one subtraction, no matter how wide the range is or how many times you ask. The entire value of the pattern is trading O(n) work once for O(1) work forever after.',
    'There are two dominant sub-patterns. <b>Build-once, query-many</b>: precompute the full prefix array up front, then answer arbitrary range-sum queries in O(1) each — the canonical example is Range Sum Query - Immutable. <b>Prefix-aggregate + frequency map</b>: maintain a running prefix sum (or remainder, or product) <i>while scanning</i>, and a hashmap of how many times each prefix value has occurred so far, so that the number of valid subarrays ending at the current index is just a lookup — the canonical example is Subarray Sum Equals K. The same running-aggregate idea generalizes past addition too: Product of Array Except Self keeps a running prefix <i>product</i> (and a mirrored suffix product) instead of a sum, with no hashmap involved at all.',
    'The pattern stops helping the moment the array becomes mutable and updates are frequent: recomputing a prefix array after every write is O(n) per update, which erases the whole advantage. That is the cue to graduate to a Fenwick tree (Binary Indexed Tree) or segment tree, both of which support O(log n) updates alongside O(log n) range queries — worth naming out loud in an interview as "the next tool up" even if you are not asked to implement one.',
    'Formally, the invariant is: immediately before processing index i in a build-once prefix array, P[i] equals the true sum of nums[0..i-1], and this holds by induction — P[0] = 0 is the (trivially true) base case, and each step P[i] = P[i-1] + nums[i-1] preserves it. For the streaming variant (prefix + frequency map), the invariant is that before processing index i, the map contains the frequency of every prefix sum value produced by nums[0..i-1], with the empty prefix (sum 0, occurring "before" any element) seeded in from the start. That seed is not optional bookkeeping — without it, any valid subarray that begins at index 0 has no earlier prefix to match against and is silently never counted.',
  ],
  recognitionSignals: [
    'Phrasing like "sum of elements from index i to j," "range sum query," or "the array won\'t change, but you\'ll be asked many range queries" — signals build-once-query-many.',
    'Phrasing like "count subarrays whose sum/remainder equals K" — signals prefix sum + frequency map, not a sliding window, because negative numbers (or an arbitrary modulus) break the monotonicity a window relies on.',
    'Phrasing like "product of every element except this one," "left and right running totals," or "equilibrium/pivot index" — signals a prefix (and often mirrored suffix) aggregate, frequently without any hashmap at all.',
    'If the array is mutated between queries (point updates interleaved with range queries), plain prefix sum is the wrong tool — that is the tell for a Fenwick tree or segment tree instead.',
    'Distinguish from monotonic stack: prefix sum answers "what is the aggregate over a range," not "what is the next greater/smaller element" — there is no ordering or elimination happening, just accumulation.',
  ],
  complexity: 'Time: O(n) to build the prefix array or scan once with a frequency map; O(1) per range query or per-index lookup afterward. Space: O(n) for the prefix array or frequency map.',
  canonical: {
    name: 'Range Sum Query - Immutable (LeetCode 303)',
    statement: 'Given an integer array nums that does not change, implement a class that can answer many calls to sumRange(i, j), returning the sum of the elements between indices i and j inclusive, as efficiently as possible.',
  },
  story: {
    onePiece: {
      title: "Nami's running voyage ledger",
      text: [
        "A Log Pose only ever points one direction — toward the next island's magnetic field. It has nothing to say about how far the crew has already sailed. So on a long Grand Line stretch, Nami keeps a second record entirely by hand: at the end of every single day, she doesn't just jot down that day's distance, she writes down the TOTAL distance sailed since the very first day of the log, once, running. Day one might read '42 miles total.' Day two reads '65 miles total.' The daily distance is still recoverable — it's just today's total minus yesterday's — but she never has to hold onto it as its own fact.",
        "The payoff shows up weeks later, when Sanji asks how far they sailed between the island with the giant crab and the one with the singing cliffs — two arbitrary days, picked out of nowhere. Nami doesn't re-add a single mile of open ocean. She flips to the running total on the LATER day, flips to the running total on the day just BEFORE the earlier one, and subtracts. One lookup, one subtraction, no matter how many days apart those two islands were. She could answer that question a thousand more times, for a thousand more pairs of days, and never touch the raw distances again — because she only ever had to build the running ledger once.",
      ],
    },
    history: {
      title: 'Summed-area tables, 1984',
      text: [
        "In 1984, computer graphics researcher Frank Crow published the summed-area table: a precomputed grid where every cell holds the running total of all pixel intensities above and to the left of it, built specifically to make texture filtering (mip-mapping) fast. Once built, the average brightness of ANY rectangular region of an image — no matter how large — could be read off with exactly four lookups and a few additions and subtractions, instead of summing every pixel inside the rectangle from scratch.",
        "That is a 2D prefix sum, invented for rendering realistic textures at a distance decades before it became a standard interview pattern — and the same table resurfaced in 2001 as the backbone of the Viola-Jones face detector, which needed to evaluate millions of rectangular brightness comparisons per image in real time. Same trick, same reason it works: precompute the running totals once, and every subsequent range query becomes arithmetic instead of a re-scan.",
      ],
    },
    why: 'Both anecdotes hinge on the same physical intuition: writing down a running total costs you nothing extra during the walk you were already taking, but it turns every future "how much between these two points" question into a subtraction. That is easy to lose once the idea is compressed into "P[j+1] − P[i]" under interview pressure.',
  },
  tricks: [
    {
      name: 'Prefix array needs length n + 1, not n',
      idea: 'It is tempting to make P the same length as nums and let P[i] mean "sum through index i inclusive" — but that makes sumRange(0, j) a special case instead of the same formula as everything else.',
      before:
`class NumArray:
    def __init__(self, nums):
        self.prefix = [0] * len(nums)   # BUG: same length as nums, no "empty prefix" slot
        running = 0
        for i, n in enumerate(nums):
            running += n
            self.prefix[i] = running

    def sum_range(self, i, j):
        # sumRange(0, j) has no P[-1] to subtract — needs a special case
        return self.prefix[j] - (self.prefix[i - 1] if i > 0 else 0)`,
      after:
`class NumArray:
    def __init__(self, nums):
        self.prefix = [0] * (len(nums) + 1)  # prefix[0] = 0 = the "nothing read yet" slot
        for i, n in enumerate(nums):
            self.prefix[i + 1] = self.prefix[i] + n

    def sum_range(self, i, j):
        return self.prefix[j + 1] - self.prefix[i]   # one formula, no special case`,
      explain: 'Making the prefix array one element longer than nums, with prefix[0] = 0 representing the empty range, means sumRange(i, j) is always prefix[j+1] - prefix[i] with no if-statement for i == 0. The same "seed the empty prefix" idea shows up again in Subarray Sum Equals K, where the frequency map is seeded with {0: 1} for exactly the same reason.',
    },
    {
      name: 'Continuous Subarray Sum: a matching remainder one element away is NOT enough',
      idea: 'The problem requires a subarray of length at least 2 — a single element that happens to be an exact multiple of k must not count on its own, even though its "sum" is technically a multiple of k.',
      before:
`def check_subarray_sum(nums, k):
    seen = {0: -1}
    prefix = 0
    for i, num in enumerate(nums):
        prefix += num
        rem = prefix % k if k else prefix
        if rem in seen:
            return True  # BUG: doesn't check the gap is at least 2 elements wide
        seen[rem] = i
    return False`,
      after:
`def check_subarray_sum(nums, k):
    seen = {0: -1}   # remainder -> earliest index it was seen at
    prefix = 0
    for i, num in enumerate(nums):
        prefix += num
        rem = prefix % k if k else prefix
        if rem in seen:
            if i - seen[rem] >= 2:      # at least 2 elements between them
                return True
            # too short: do NOT overwrite — keep the earliest index for this remainder
        else:
            seen[rem] = i
    return False`,
      explain: 'If the same remainder shows up one index later, the single element in between is itself an exact multiple of k — true, but not a "subarray of length >= 2" as the problem demands. Keeping the EARLIEST index for each remainder (never overwriting on a too-short match) also matters: it maximizes the gap for any later match against that same remainder.',
    },
  ],
  variants: [
    {
      company: 'Google-style',
      title: 'Subarray Sum Equals K (LeetCode 560)',
      twist: 'Instead of a fixed prebuilt array answering range queries, you scan once and ask, at every index, "how many earlier prefix sums equal (today\'s prefix sum minus k)?" — that count, read from a frequency hashmap, is added to a running total. The map must be seeded with {0: 1} before the scan starts, or every valid subarray beginning at index 0 is silently missed.',
    },
    {
      company: 'Meta-style',
      title: 'Continuous Subarray Sum (LeetCode 523)',
      twist: 'Instead of matching prefix sums exactly, you match prefix sums MODULO k — two indices with the same remainder mean everything between them sums to a multiple of k. The extra twist tested here is the length->=2 requirement (see the trick above) and the k == 0 edge case, where "modulo zero" is undefined and you must fall back to matching the raw prefix sum instead of a remainder.',
    },
    {
      company: 'Amazon-style',
      title: 'Product of Array Except Self (LeetCode 238)',
      twist: 'The aggregate is a PRODUCT, not a sum, and no hashmap is involved at all: sweep left to right keeping a running prefix product (everything before index i), then sweep right to left keeping a running suffix product (everything after index i), multiplying the two into the answer array. The trap is reaching for "divide the total product by nums[i]" instead — that breaks the instant any element is zero, and breaks silently (produces all-zero output) if two or more elements are zero.',
    },
  ],
  pythonSolution: {
    title: 'Range Sum Query - Immutable',
    code:
`class NumArray:
    def __init__(self, nums: list[int]):
        self.prefix = [0] * (len(nums) + 1)  # prefix[0] = 0: the empty range
        for i, n in enumerate(nums):
            self.prefix[i + 1] = self.prefix[i] + n

    def sum_range(self, left: int, right: int) -> int:
        return self.prefix[right + 1] - self.prefix[left]`,
    notes: [
      'The prefix array is built once in the constructor — O(n) total, paid a single time no matter how many queries follow.',
      '<code>prefix[i + 1] = prefix[i] + nums[i]</code> is the whole build step: each new slot is the previous running total plus one more element.',
      '<code>sum_range</code> never touches <code>nums</code> at all — it is pure arithmetic on two already-computed values, which is what makes it O(1) regardless of how far apart <code>left</code> and <code>right</code> are.',
      'The off-by-one (<code>right + 1</code>, not <code>right</code>) is the detail to say out loud: prefix[k] means "sum of the first k elements," so the sum through index <code>right</code> inclusive is prefix[right + 1].',
    ],
  },
  pitfalls: [
    'Sizing the prefix array the same length as the input instead of length n + 1 — forces an awkward special case for ranges that start at index 0 (see the trick above).',
    'Forgetting to seed a frequency map with the empty prefix ({0: 1} for sums, {0: -1} for remainder-with-index problems) — silently undercounts or misses every valid subarray that starts at index 0.',
    'For Continuous Subarray Sum: accepting a remainder match that is only one element away, or dividing by k == 0 instead of special-casing it.',
    'For Product of Array Except Self: dividing the total product by nums[i] instead of using two independent prefix/suffix sweeps — fails outright when any element is zero.',
    'Reaching for prefix sum on a MUTABLE array with frequent updates — recomputing the whole prefix array per write is O(n) per update, which erases the entire benefit; a Fenwick tree or segment tree is the correct tool there instead.',
  ],
  viz: {
    type: 'array',
    initialArray: [5, 3, 8, 2, 6, 4],
    steps: [
      { highlights: { 0: 'a' }, pointers: { i: 0 }, vars: { prefix: '[0, 5]' }, message: 'Build phase. prefix[0] = 0 (empty range, seeded before any element). prefix[1] = prefix[0] + nums[0] = 0 + 5 = 5.' },
      { highlights: { 1: 'a' }, pointers: { i: 1 }, vars: { prefix: '[0, 5, 8]' }, message: 'prefix[2] = prefix[1] + nums[1] = 5 + 3 = 8.' },
      { highlights: { 2: 'a' }, pointers: { i: 2 }, vars: { prefix: '[0, 5, 8, 16]' }, message: 'prefix[3] = prefix[2] + nums[2] = 8 + 8 = 16.' },
      { highlights: { 3: 'a' }, pointers: { i: 3 }, vars: { prefix: '[0, 5, 8, 16, 18]' }, message: 'prefix[4] = prefix[3] + nums[3] = 16 + 2 = 18.' },
      { highlights: { 4: 'a' }, pointers: { i: 4 }, vars: { prefix: '[0, 5, 8, 16, 18, 24]' }, message: 'prefix[5] = prefix[4] + nums[4] = 18 + 6 = 24.' },
      { highlights: { 5: 'a' }, pointers: { i: 5 }, vars: { prefix: '[0, 5, 8, 16, 18, 24, 28]' }, message: 'prefix[6] = prefix[5] + nums[5] = 24 + 4 = 28. Build complete — O(n), done exactly once.' },
      { highlights: { 1: 'c', 2: 'c', 3: 'c' }, pointers: {}, vars: { query: 'sumRange(1, 3)', answer: 'prefix[4] - prefix[1] = 18 - 5 = 13' }, message: 'Query 1: sum of indices 1..3 (3 + 8 + 2 = 13). No re-scanning — one subtraction using the prebuilt array.' },
      { highlights: { 2: 'c', 3: 'c', 4: 'c', 5: 'c' }, pointers: {}, vars: { query: 'sumRange(2, 5)', answer: 'prefix[6] - prefix[2] = 28 - 8 = 20' }, message: 'Query 2: sum of indices 2..5 (8 + 2 + 6 + 4 = 20). Same O(1) lookup — could repeat this for any range, any number of times.' },
    ],
  },
  quiz: [
    {
      q: 'Why is the prefix sum array typically built with length n + 1 rather than n?',
      options: [
        'It is not necessary; length n works identically',
        'So that prefix[0] = 0 represents the empty range, letting sumRange(i, j) = prefix[j+1] - prefix[i] work uniformly, including when i == 0',
        'To leave room for negative numbers',
        'Because Python lists must have odd length for slicing to work',
      ],
      correct: 1,
      explain: 'Without the extra "empty prefix" slot at index 0, a range starting at index 0 has no prefix[-1] to subtract and needs a special case. The length n+1 array removes that special case entirely.',
    },
    {
      q: 'In Subarray Sum Equals K, why must the frequency map be seeded with {0: 1} before scanning begins?',
      options: [
        'It is just a defensive habit with no real effect',
        'It accounts for the empty prefix, so subarrays that start at index 0 and sum exactly to k are correctly counted',
        'It prevents integer overflow',
        'It is only needed when k is negative',
      ],
      correct: 1,
      explain: 'A subarray nums[0..i] sums to k exactly when prefix[i] == k, i.e. when (prefix[i] - k) == 0. Without the seed {0: 1}, the algorithm can never find a frequency for a target difference of 0 and misses every subarray beginning at index 0.',
    },
    {
      q: 'Continuous Subarray Sum (LC 523) requires the matching subarray to have length at least 2. What does that rule out?',
      options: [
        'Nothing — any remainder match is automatically valid',
        'A single element that happens to be an exact multiple of k, which would otherwise be (incorrectly) counted as a valid answer on its own',
        'Negative numbers in the array',
        'Arrays shorter than length k',
      ],
      correct: 1,
      explain: 'If the same remainder recurs exactly one index later, the lone element between those two indices is itself a multiple of k — true, but the problem specifically requires a subarray of at least two elements, so that single-element case must be rejected.',
    },
    {
      q: 'Why does Product of Array Except Self avoid computing "total product of the array, then divide by nums[i]" for each answer?',
      options: [
        'Division is always slower than multiplication in every language',
        'That approach breaks the moment any element is zero (division by zero), and produces incorrect all-zero output when two or more elements are zero',
        'It actually is the standard, correct solution',
        'Python does not support integer division',
      ],
      correct: 1,
      explain: 'Dividing by a zero element is undefined, and with two or more zeros, "total product" is 0 for every index either way, making the naive division approach silently wrong. Two independent prefix/suffix product sweeps sidestep division entirely.',
    },
    {
      q: 'A problem gives you an array that receives frequent point updates interleaved with range-sum queries. Why is a plain prefix sum array the wrong tool here?',
      options: [
        'Prefix sums cannot represent negative numbers',
        'Rebuilding (or even partially patching) the prefix array after every update costs O(n) per update, erasing the O(1)-query advantage — a Fenwick tree or segment tree supports both operations in O(log n) instead',
        'Prefix sums only work on arrays of even length',
        'It is actually still the best tool, no changes needed',
      ],
      correct: 1,
      explain: 'A single point update changes every prefix sum entry from that index onward, so naively maintaining a prefix array under frequent writes costs O(n) per update. Fenwick trees and segment trees are built specifically to keep both point updates and range queries at O(log n).',
    },
  ],
};
