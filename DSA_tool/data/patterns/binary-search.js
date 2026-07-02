window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['binary-search'] = {
  id: 'binary-search',
  title: 'Binary Search & Search Space Reduction',
  category: 'Arrays & Two-Pointer Family',
  timeMin: 15,
  summary: 'Discard half the remaining search space each step using a provable invariant — not just on a plain sorted array, but on any monotonic predicate.',
  concept: [
    'Classic binary search relies on the array being fully sorted. The interview-relevant generalization is <b>search space reduction</b>: as long as you can define a monotonic predicate — something that\'s false, then true (or vice versa) across the space, with no flip-flopping — you can binary search over that predicate even if the underlying array or answer range isn\'t literally sorted itself. "Rotated sorted array" is the bridge case: the array isn\'t fully sorted, but at every <code>mid</code>, at least one of the two halves provably is, which is enough structure to keep halving.',
    'The rotated-array trick: compare <code>nums[lo]</code> to <code>nums[mid]</code>. If <code>nums[lo] <= nums[mid]</code>, the left half <code>[lo, mid]</code> is internally sorted (no rotation point inside it), so you can cheaply check whether the target lies in that sorted range; otherwise the right half must be the sorted one. Either way you get a clean O(1) decision about which half to keep — the recursion never needs to know where the rotation point actually is.',
    'Past rotated arrays, the same "monotonic predicate, binary search the answer" idea shows up as "minimize/maximize X such that condition(X) holds" problems — capacity to ship packages within D days, minimum eating speed to finish bananas in time, split array to minimize the largest subarray sum. In all of these you binary search over the *answer value*, not over array indices, calling a feasibility check at each <code>mid</code>.',
  ],
  recognitionSignals: [
    'Array is described as sorted, "rotated sorted", or "almost sorted", and a target must be found faster than O(n).',
    'An explicit O(log n) time requirement, even when the input doesn\'t superficially look sorted — that\'s the strongest signal of "search space reduction" over an answer range rather than plain array search.',
    'Phrasing like "minimize the maximum" or "find the smallest X such that condition holds" — a monotonic feasibility check per candidate X is a binary-search-on-the-answer tell.',
    'Distinguish from two pointers: two pointers scan linearly in O(n) from both ends of an array; binary search discards half the *search space* per step for O(log n) — if brute force is already O(n), reach for binary search only when the search space itself (values, not indices) is what needs shrinking.',
  ],
  complexity: 'Time: O(log n) — each iteration halves the remaining search space. Space: O(1) iterative (O(log n) if implemented recursively, due to call stack depth).',
  canonical: {
    name: 'Search in Rotated Sorted Array (LeetCode 33)',
    statement: 'There is an integer array nums sorted in ascending order (with distinct values), possibly rotated at an unknown pivot index. Given the array after the rotation and an integer target, return the index of target if it is in nums, or -1 if it is not.',
  },
  variants: [
    {
      company: 'Google-style',
      title: 'Search in Rotated Sorted Array II (LeetCode 81) — duplicates allowed',
      twist: 'With duplicates, the check <code>nums[lo] <= nums[mid]</code> can no longer reliably tell you which half is sorted — e.g. <code>[1,0,1,1,1]</code> has <code>nums[lo]==nums[mid]==nums[hi]==1</code> while the actual rotation point is invisible to that comparison. The fix is a fallback: when <code>nums[lo] == nums[mid] == nums[hi]</code>, you can\'t safely discard either half, so you shrink defensively with <code>lo += 1; hi -= 1</code> instead. This degrades worst-case time from O(log n) to O(n) (e.g. an array of all-equal values), and stating that trade-off out loud is what interviewers are listening for.',
    },
    {
      company: 'Meta-style',
      title: 'Search in an unbounded/infinite sorted array (unknown size)',
      twist: 'You\'re given an interface to read <code>arr[i]</code> but no <code>len(arr)</code> — so you can\'t set <code>hi</code> up front. First run exponential ("galloping") search: start <code>hi=1</code> and double it (<code>hi *= 2</code>) until <code>arr[hi]</code> exceeds the target or you hit an out-of-bounds sentinel, which establishes valid bounds in O(log target_index) steps; then run standard binary search inside that range. Total complexity is still O(log n) where n is the target\'s actual position, but you must also handle potential integer overflow when doubling hi for very large indices.',
    },
    {
      company: 'Amazon/Microsoft-style',
      title: 'Find First and Last Position of Element in Sorted Array (LeetCode 34)',
      twist: 'Instead of returning the index as soon as <code>nums[mid] == target</code> is found, you run two separate binary searches with a modified tie-breaking rule: for the first occurrence, when you hit a match you *record it and keep narrowing left* (<code>hi = mid - 1</code>) instead of returning immediately; for the last occurrence, you narrow right (<code>lo = mid + 1</code>) instead. The loop invariant flips from "return on match" to "record best match and keep searching," which trips up candidates who\'ve only memorized the exact-match-and-return template.',
    },
  ],
  pythonSolution: {
    title: 'Search in Rotated Sorted Array',
    code:
`def search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:          # left half is sorted
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                              # right half is sorted
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1`,
    notes: [
      'The chained comparison <code>nums[lo] <= target < nums[mid]</code> is idiomatic Python for a half-open range check, more readable than two separately ANDed comparisons.',
      'Tuple assignment <code>lo, hi = 0, len(nums) - 1</code> sets up both bounds in one line.',
      'Integer floor division <code>(lo + hi) // 2</code> avoids any float arithmetic creeping into an index.',
      '<code>nums[lo] <= nums[mid]</code> (not <code><</code>) correctly handles the single-element range case where <code>lo == mid</code>, which is trivially sorted and must be treated as such.',
    ],
  },
  pitfalls: [
    'Using <code>nums[lo] < nums[mid]</code> instead of <code><=</code> — breaks when the left sub-range collapses to a single element (<code>lo == mid</code>), which is always sorted but fails a strict less-than self-comparison.',
    'Silently assuming the array has no duplicates when the problem doesn\'t explicitly guarantee it — LeetCode 33 does guarantee distinct values, but candidates often carry that assumption unchecked into the LeetCode 81 follow-up, where it\'s false and breaks the sortedness check.',
    'Computing <code>mid</code> correctly but updating the wrong bound in a branch (e.g. setting <code>hi = mid</code> instead of <code>hi = mid - 1</code>) — this can leave <code>lo</code>/<code>hi</code> stuck without shrinking, causing an infinite loop when they converge to adjacent values.',
    'For "find first/last occurrence" variants, returning immediately on the first <code>nums[mid] == target</code> found — this returns *an* occurrence, not necessarily the first or last one, which is wrong for that variant\'s actual requirement.',
  ],
  viz: {
    type: 'array',
    initialArray: [4, 5, 6, 7, 0, 1, 2],
    steps: [
      { highlights: {}, pointers: { lo: 0, hi: 6 }, vars: { target: 0 }, message: 'Rotated sorted array. Not fully sorted overall, but at every mid, at least one half provably is — that\'s the invariant we exploit. lo=0, hi=6.' },
      { highlights: { 0: 'a', 3: 'c', 6: 'b' }, pointers: { lo: 0, mid: 3, hi: 6 }, vars: { target: 0 }, message: 'mid=⌊(0+6)/2⌋=3. nums[mid]=7.' },
      { highlights: { 0: 'bad', 1: 'bad', 2: 'bad', 3: 'bad', 4: 'a', 6: 'b' }, pointers: { lo: 4, hi: 6 }, vars: { target: 0 }, message: 'nums[lo]=4 ≤ nums[mid]=7 → left half [4,5,6,7] is sorted. target=0 ∉ [4,7) → discard the entire left half. lo=mid+1=4.' },
      { highlights: { 0: 'bad', 1: 'bad', 2: 'bad', 3: 'bad', 4: 'a', 5: 'c', 6: 'b' }, pointers: { lo: 4, mid: 5, hi: 6 }, vars: { target: 0 }, message: 'New range [4,6]. mid=⌊(4+6)/2⌋=5. nums[mid]=1.' },
      { highlights: { 0: 'bad', 1: 'bad', 2: 'bad', 3: 'bad', 4: 'a', 5: 'bad', 6: 'bad' }, pointers: { lo: 4, hi: 4 }, vars: { target: 0 }, message: 'nums[lo]=0 ≤ nums[mid]=1 → left half [0,1] is sorted. target=0 ∈ [0,1) → discard the right half. hi=mid-1=4.' },
      { highlights: { 0: 'bad', 1: 'bad', 2: 'bad', 3: 'bad', 4: 'c', 5: 'bad', 6: 'bad' }, pointers: { lo: 4, mid: 4, hi: 4 }, vars: { target: 0 }, message: 'lo==hi==mid==4. nums[mid]=0 == target → found! Return index 4.' },
      { highlights: { 0: 'bad', 1: 'bad', 2: 'bad', 3: 'bad', 4: 'c', 5: 'bad', 6: 'bad' }, pointers: { lo: 4, mid: 4, hi: 4 }, vars: { target: 0, result: 4 }, message: 'Done in 3 mid-comparisons on n=7 elements — O(log n), versus 5 comparisons for a linear scan to reach the same index.' },
    ],
  },
  quiz: [
    {
      q: 'Which of these is the strongest signal for binary search / search space reduction, even when the input doesn\'t look literally sorted?',
      options: [
        'The problem asks for the longest contiguous subarray satisfying a condition',
        'An explicit O(log n) time requirement, or phrasing like "minimize the maximum value such that a condition holds"',
        'The input is a linked list with a possible cycle',
        'The array contains only positive integers',
      ],
      correct: 1,
      explain: 'An O(log n) requirement or a "minimize/maximize X such that feasible(X)" framing signals binary-searching over an answer range with a monotonic feasibility check — the classic disguised binary search problem.',
    },
    {
      q: 'What is the time complexity of Search in Rotated Sorted Array, assuming distinct values as LeetCode 33 guarantees?',
      options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(n²)'],
      correct: 1,
      explain: 'Even though the array isn\'t fully sorted, one half of every mid-split is always provably sorted, which is enough structure to discard half the remaining space every iteration — same asymptotic behavior as plain binary search.',
    },
    {
      q: 'In the reference solution, why does the condition use `nums[lo] <= nums[mid]` rather than `nums[lo] < nums[mid]`?',
      options: [
        'It makes no difference to correctness',
        'When the left half has collapsed to a single element (lo == mid), it is trivially sorted, but a strict `<` self-comparison (nums[lo] < nums[lo]) would be False and misroute the decision',
        'It\'s required to avoid an off-by-one in the final return value',
        'It converts the search from iterative to recursive',
      ],
      correct: 1,
      explain: 'A single-element range must be treated as sorted. Using strict `<` fails exactly when lo==mid, since a value is never strictly less than itself, causing the algorithm to take the wrong branch on that edge case.',
    },
    {
      q: 'The Search in Rotated Sorted Array II variant allows duplicate values (e.g. [1,0,1,1,1]). Why does this break the O(log n) guarantee?',
      options: [
        'Duplicates make the array unsortable in principle',
        'When nums[lo] == nums[mid] == nums[hi], you can no longer tell which half is sorted, forcing a defensive lo+=1, hi-=1 shrink instead of halving — which degrades worst-case time to O(n)',
        'Duplicates require switching to a completely different algorithm like DFS',
        'It doesn\'t break anything — the complexity stays O(log n)',
      ],
      correct: 1,
      explain: 'The core decision "which half is sorted" relies on strict comparisons being informative. When lo, mid, and hi all hold equal values, that check gives no information, so you fall back to shrinking one element at a time, which can degrade to linear time on adversarial inputs like all-equal arrays.',
    },
    {
      q: 'If target is not present in the array at all (e.g. searching for 9 in [4,5,6,7,0,1,2]), how does the algorithm terminate?',
      options: [
        'It loops forever since target is never found',
        'It throws an index-out-of-bounds error',
        'lo and hi keep converging as usual; eventually lo > hi, the while loop condition fails, and the function returns -1',
        'It returns the index of the closest value instead',
      ],
      correct: 2,
      explain: 'The loop invariant lo <= hi is what keeps the search bounded — every iteration strictly shrinks the range whether or not the target is present, so absence is handled the same way as any other termination: the range empties out and -1 is returned.',
    },
  ],
};
