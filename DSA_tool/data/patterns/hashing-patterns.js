window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['hashing-patterns'] = {
  id: 'hashing-patterns',
  title: 'Hashing Patterns',
  category: 'Hashing & Linear Structures',
  timeMin: 12,
  summary: 'Trade O(n) or O(n²) scanning for O(1) average-case lookup by remembering what you have already seen (or aggregated) in a hash map/set.',
  concept: [
    'The core move is: as you scan once, left to right, store something in a hash map keyed by value (or by a running aggregate) so that a later index can answer "have I seen X before, and where/how many times" in O(1) average time instead of re-scanning. This turns an O(n²) pair/subarray search into a single O(n) pass.',
    'There are two dominant sub-patterns. <b>Seen-map</b>: for each element, check whether its <i>complement</i> (target - num, or some transformation of it) already exists in the map before you insert the current element — the canonical example is Two Sum. <b>Prefix-aggregate + frequency map</b>: maintain a running prefix sum (or XOR, or count) and a hashmap of <i>how many times each prefix value has occurred so far</i>; the number of valid subarrays ending at the current index is the frequency of (currentPrefix - target) already recorded — the canonical example is Subarray Sum Equals K.',
    'A hash set/map is the right tool exactly when you need existence/frequency lookups on <i>unordered</i> data without sacrificing O(n) time. The moment the problem needs range queries ("closest to", "less than K", "next larger") rather than exact-match lookups, hashing stops helping and you should reach for sorting + two pointers or a balanced structure instead — recognizing that boundary is itself an interview signal.',
  ],
  recognitionSignals: [
    'Phrasing like "does there exist," "have you seen," or "find a pair/complement that sums to" — signals a seen-map membership check.',
    'Phrasing like "count subarrays/pairs whose sum/XOR equals K" — signals prefix-aggregate + frequency map, not a sliding window, because negative numbers (or arbitrary signs) break the monotonicity a window relies on.',
    'Phrasing like "anagram," "first non-repeating character," or "majority element" — signals a plain frequency-count map (Counter), a simpler cousin of the seen-map.',
    'If the array is already sorted and the problem only needs exact-match or two-element lookups, a hashmap works but is not the best answer — two pointers gets you O(1) extra space instead of O(n).',
    'If the ask shifts to "less than K," "closest to K," or any inequality/ordering condition instead of exact equality, hashing no longer applies — that is your cue to pivot to sort + two pointers or binary search.',
  ],
  complexity: 'Time: O(n) average (hash map insert/lookup is O(1) amortized); degrades to O(n²) worst case only under adversarial hash collisions, which you can mention but not worry about in practice. Space: O(n) for the hash map/set.',
  canonical: {
    name: 'Two Sum (LeetCode 1)',
    statement: 'Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target. Assume exactly one solution exists, and you may not use the same element twice.',
  },
  variants: [
    {
      company: 'Google-style',
      title: 'Two Sum II — Input Array Is Sorted (LeetCode 167)',
      twist: 'The array is now sorted ascending. The hashmap solution still works (O(n) time, O(n) space), but it is no longer the best answer: with sorted input, two pointers starting at both ends (move left pointer right if the sum is too small, right pointer left if too large) solves it in O(n) time and O(1) space. Interviewers use this to check whether you default to hashing everywhere or actually notice when the input\'s structure (sortedness) makes extra space unnecessary.',
    },
    {
      company: 'Meta-style',
      title: 'Subarray Sum Equals K (LeetCode 560)',
      twist: 'Instead of finding a pair of elements, count the number of contiguous subarrays summing to k. The fix is to track a running prefix sum and a hashmap of <code>prefix_sum → how many times it has occurred</code>. At each index, add <code>freq.get(prefix - k, 0)</code> to the answer <i>before</i> incrementing <code>freq[prefix]</code> for the current index — get that order backwards and you double-count or self-pair a subarray with itself. You must also seed <code>freq = {0: 1}</code> to correctly count subarrays that start at index 0.',
    },
    {
      company: 'Amazon-style',
      title: 'Two Sum Less Than K (LeetCode 1099)',
      twist: 'The target is no longer exact — you need the maximum pair sum that is strictly less than K (or -1 if none exists). A hashmap cannot answer "closest value below a threshold" in O(1); exact-match lookups do not help with inequalities. The correct pivot is to sort the array and use two pointers, moving inward and tracking the best valid sum seen. This variant exists specifically to test whether you recognize when hashing is the wrong tool rather than forcing it to fit.',
    },
  ],
  pythonSolution: {
    title: 'Two Sum',
    code:
`def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}  # value -> index
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    notes: [
      '<code>enumerate(nums)</code> yields index and value together, avoiding a manual counter — the standard Pythonic replacement for <code>range(len(nums))</code>.',
      'Checking <code>complement in seen</code> before the line <code>seen[num] = i</code> matters: if you insert first, an element equal to half the target (<code>target == 2 * num</code>) would incorrectly "find itself" as its own complement.',
      'The dict is keyed by value, not index, because the lookup you need is "does this value exist" — an O(1) average membership test that a list or array cannot give you.',
      'Returning <code>[]</code> is a deliberate fallback; the problem guarantees a solution exists, but writing an explicit empty-return keeps the function total and avoids an implicit <code>None</code> leaking into caller code.',
    ],
  },
  pitfalls: [
    'Checking <code>if num in seen</code> (the current element) instead of the complement — a subtle typo-class bug that returns wrong or no pairs.',
    'Inserting the current element into <code>seen</code> before checking for its complement — causes a single element to incorrectly pair with itself when <code>target == 2 * num</code>.',
    'For Subarray Sum Equals K: forgetting to seed <code>freq = {0: 1}</code> for the empty prefix — silently undercounts every valid subarray that starts at index 0.',
    'Reaching for a hashmap out of habit when the array is sorted or the question involves inequalities ("less than," "closest to") — both cases have a strictly better O(1)-space alternative (two pointers) and interviewers notice when you miss it.',
  ],
  viz: {
    type: 'array',
    initialArray: [3, 1, 4, 1, 5, 9, 2, 6],
    steps: [
      { highlights: { 0: 'a' }, pointers: { i: 0 }, vars: { seen: '{}', complement: 8, target: 11 }, message: 'i=0, num=3. complement=11-3=8 not in seen → add seen[3]=0.' },
      { highlights: { 1: 'a' }, pointers: { i: 1 }, vars: { seen: '{3: 0}', complement: 10, target: 11 }, message: 'i=1, num=1. complement=11-1=10 not in seen → add seen[1]=1.' },
      { highlights: { 2: 'a' }, pointers: { i: 2 }, vars: { seen: '{3: 0, 1: 1}', complement: 7, target: 11 }, message: 'i=2, num=4. complement=11-4=7 not in seen → add seen[4]=2.' },
      { highlights: { 3: 'a' }, pointers: { i: 3 }, vars: { seen: '{3: 0, 1: 1, 4: 2}', complement: 10, target: 11 }, message: 'i=3, num=1 (duplicate value). complement=11-1=10 not in seen → add seen[1]=3, overwriting the earlier index for value 1 (fine — we only ever need the most recent index for a value).' },
      { highlights: { 4: 'a' }, pointers: { i: 4 }, vars: { seen: '{3: 0, 1: 3, 4: 2}', complement: 6, target: 11 }, message: 'i=4, num=5. complement=11-5=6 not in seen → add seen[5]=4.' },
      { highlights: { 5: 'a' }, pointers: { i: 5 }, vars: { seen: '{3: 0, 1: 3, 4: 2, 5: 4}', complement: 2, target: 11 }, message: 'i=5, num=9. complement=11-9=2 not in seen → add seen[9]=5.' },
      { highlights: { 6: 'a' }, pointers: { i: 6 }, vars: { seen: '{3: 0, 1: 3, 4: 2, 5: 4, 9: 5}', complement: 9, target: 11 }, message: 'i=6, num=2. complement=11-2=9 IS in seen at index 5 → match found!' },
      { highlights: { 5: 'c', 6: 'c' }, pointers: { i: 6 }, vars: { answer: '[5, 6]' }, message: 'Return [5, 6]: nums[5] + nums[6] = 9 + 2 = 11 = target. Found in a single O(n) pass.' },
    ],
  },
  quiz: [
    {
      q: 'Which phrasing most strongly signals a hashing (seen-map) approach rather than a sorted two-pointer approach?',
      options: [
        'The array is already sorted and you need the pair closest to a target',
        'The array is unsorted and you need to know whether a complement/pair exists, and preserving original indices matters',
        'You need the k-th smallest element in a stream',
        'You need to find a cycle in a linked list',
      ],
      correct: 1,
      explain: 'Sorted input with a closest/ordering condition favors two pointers or binary search; a cycle question points to fast/slow pointers. Unsorted data with an existence/complement check and index preservation is the hashmap signature — sorting would destroy the original indices.',
    },
    {
      q: 'What is the time and space complexity of the Subarray Sum Equals K solution (prefix sum + frequency hashmap)?',
      options: [
        'O(n) time, O(1) space',
        'O(n²) time, O(n) space',
        'O(n) time, O(n) space',
        'O(n log n) time, O(n) space',
      ],
      correct: 2,
      explain: 'One pass computes the running prefix sum and does O(1) average hashmap lookups/inserts, giving O(n) time. The frequency map can hold up to n distinct prefix sums, giving O(n) space.',
    },
    {
      q: 'In the Two Sum reference solution, why check `complement in seen` before the line `seen[num] = i`, rather than after?',
      options: [
        'It has no effect on correctness, only style',
        'Checking after would make the lookup itself slower',
        'Inserting first would let an element whose value is exactly half of target incorrectly match itself',
        'It is required to make the dictionary hashable',
      ],
      correct: 2,
      explain: 'If target == 2 * num and you insert num into seen before checking, the complement (which equals num) would already be present — the algorithm would pair the element with itself at the same index, which is invalid.',
    },
    {
      q: 'A variant asks for "the maximum pair sum strictly less than K" instead of an exact target sum. Why doesn\'t the standard hashmap approach carry over directly?',
      options: [
        'Hashmaps cannot store negative numbers',
        'A hashmap answers exact-match/existence queries in O(1); "closest value under a threshold" is a range/inequality query a hashmap cannot answer without a full scan',
        'The array must be reversed first',
        'It actually does carry over unchanged',
      ],
      correct: 1,
      explain: 'Hash lookups only tell you whether a specific key exists, not which stored keys satisfy an inequality. That requires ordered structure — sorting the array and using two pointers (or a sorted structure like a balanced BST) is the correct pivot.',
    },
    {
      q: 'For Subarray Sum Equals K, why must the frequency map be seeded with `{0: 1}` before scanning begins?',
      options: [
        'It is just a defensive habit with no real effect',
        'It accounts for the empty prefix, so subarrays that start at index 0 and sum exactly to k are correctly counted',
        'It prevents integer overflow',
        'It is only needed when k is negative',
      ],
      correct: 1,
      explain: 'A subarray nums[0..i] sums to k exactly when prefix[i] == k, i.e. when (prefix[i] - k) == 0. Without the seed {0: 1}, the algorithm would never find a frequency for a target difference of 0 and would miss every subarray beginning at index 0.',
    },
  ],
};
