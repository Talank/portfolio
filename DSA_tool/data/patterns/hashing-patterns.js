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
    'The correctness of the seen-map check rests on a simple loop invariant: immediately before processing index <code>i</code>, the map contains exactly the set <code>{nums[0], ..., nums[i-1]}</code> (keyed by value, with the most recent index winning on duplicates). So the test <code>complement in seen</code> is not a heuristic — it is a direct, complete query of "does there exist some <code>j &lt; i</code> with <code>nums[j] = target - nums[i]</code>," which is precisely the definition of a valid earlier partner. Because the invariant holds before every iteration and the map is updated by exactly one insertion per step, no pair is skipped and none is checked twice; the O(1) average cost of each hash lookup is what turns an argument that would otherwise require an O(n²) nested check over every (i, j) pair into a single linear pass.',
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
  story: {
    onePiece: {
      title: 'The Marine bounty board',
      text: [
        'Before the World Government standardized its bounty board system, a Marine officer looking for a wanted pirate had exactly one method: pull down every wanted poster in the depot and read each one, name by name, until either a match turned up or the stack ran out. On a quiet island that might be a few dozen posters. At a hub like Marineford, during a war, it could be tens of thousands — and every second spent flipping paper was a second an officer wasn\'t watching the actual battlefield.',
        'The bounty board changes that by indexing, not scanning. Each name (or alias, or distinguishing feature) is run through a fixed rule that sends it straight to one section of the board — certain names on this rack, certain epithets cross-filed on that one — so an officer doesn\'t page through the whole depot, they walk directly to the section the rule points to and look there. Ask "is this pirate on the board, and for how much," and the answer comes back in the time it takes to reach one rack, not the time it takes to search every rack.',
        'It isn\'t perfect. Every so often two pirates end up with aliases similar enough — a shared surname, a near-identical epithet — that the same indexing rule sends both of their posters to the same section of the same rack. The officer still has to glance at the handful of posters actually sitting there to find the right one. That\'s not a failure of the system, it\'s the ordinary cost of a hash bucket holding more than one entry: you don\'t lose the speedup, you just do a tiny linear check inside one bucket instead of across the whole board.',
      ],
    },
    history: {
      title: 'Melvil Dewey\'s card catalog, 1876',
      text: [
        'In 1876, librarian Melvil Dewey published a classification scheme that assigned every book a number based on its subject, so a patron (or librarian) could find a book\'s shelf location without walking every aisle and reading every spine. A number like 641.5 didn\'t just label a book — it routed a search directly to the cooking section, then to a narrow sub-shelf within it, collapsing what could have been a walk through an entire building into a jump to one small physical bucket.',
        'That\'s the same move a hash function makes on data instead of books: transform a key into a bucket address so a lookup goes straight to the (small) region that could possibly contain the answer, instead of touching everything. Dewey\'s system predates computing by nearly a century, but the underlying idea — trade a scan for a classification/hashing step — is identical.',
      ],
    },
    why: 'Tying an O(1) lookup to a physical "walk straight to the shelf" scene gives you a felt sense of why hashing beats scanning, which is easy to lose once the idea is compressed into asymptotic notation under interview pressure.',
  },
  tricks: [
    {
      name: 'Two Sum: check the complement before inserting',
      idea: 'It\'s tempting to insert the current element into the map first "to keep bookkeeping simple," but that silently breaks the one case where target is exactly double a value — the element ends up pairing with itself.',
      before:
`def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        seen[num] = i  # BUG: inserted before checking for the complement
        complement = target - num
        if complement in seen:
            return [seen[complement], i]  # can return [i, i] when target == 2 * num
    return []`,
      after:
`def two_sum(nums, target):
    seen = {}  # value -> index
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      explain: 'Checking membership before inserting guarantees that any match found refers to a strictly earlier index. If you insert first and target == 2 * num, the complement (which equals num) is already present under the current index, so the function returns the same index twice — a pair that isn\'t actually two elements.',
    },
    {
      name: 'Subarray Sum Equals K: seed the frequency map with {0: 1}',
      idea: 'The prefix-sum + frequency-map technique undercounts every subarray that starts at index 0 unless the empty prefix is pre-registered before the scan begins.',
      before:
`def subarray_sum(nums, k):
    freq = {}  # BUG: missing the empty-prefix seed
    prefix = 0
    count = 0
    for num in nums:
        prefix += num
        count += freq.get(prefix - k, 0)
        freq[prefix] = freq.get(prefix, 0) + 1
    return count`,
      after:
`def subarray_sum(nums, k):
    freq = {0: 1}  # the empty prefix (sum 0) has occurred once, before any element
    prefix = 0
    count = 0
    for num in nums:
        prefix += num
        count += freq.get(prefix - k, 0)
        freq[prefix] = freq.get(prefix, 0) + 1
    return count`,
      explain: 'A subarray nums[0..i] sums to k exactly when prefix[i] == k, i.e. when (prefix[i] - k) == 0. Without seeding freq = {0: 1}, the lookup freq.get(prefix - k, 0) can never find a match for that case, so every valid subarray beginning at index 0 is silently missed.',
    },
  ],
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
