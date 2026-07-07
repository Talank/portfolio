window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['bit-manipulation'] = {
  id: 'bit-manipulation',
  title: 'Bit Manipulation Tricks',
  category: 'Optimization Patterns',
  timeMin: 10,
  summary: 'Use XOR and bitwise identities to solve presence/duplicate/subset problems in O(1) extra space, replacing a hash set with arithmetic.',
  concept: [
    'XOR has three properties worth memorizing cold: <code>x ^ x = 0</code> (a value cancels with itself), <code>x ^ 0 = x</code> (identity element), and it is commutative and associative, so the order you XOR values in never matters. That last property is what makes "find the element that appears once while everything else appears twice" solvable with a single accumulator swept across the array in any order — every duplicate pair cancels regardless of where the duplicates sit relative to each other.',
    'A handful of bit tricks recur constantly enough to be worth having memorized rather than re-derived under pressure: <code>n & (n - 1)</code> clears the lowest set bit (useful for counting set bits one at a time, or testing "is n a power of two" via <code>n & (n-1) == 0</code>); <code>n & -n</code> isolates the lowest set bit as its own value (useful in Fenwick/BIT trees, or splitting a set of numbers by one differing bit); enumerating all 2ⁿ subsets of n elements via a mask from 0 to 2ⁿ-1, reading bit i of the mask as "is element i included"; and iterating only the submasks of a fixed mask via <code>sub = (sub - 1) & mask</code>, which visits every submask in O(3ⁿ) total across all masks instead of O(4ⁿ).',
    'These tricks show up in interviews disguised as: "each element appears twice/three times except one" (XOR, or sum-of-bits-mod-3 for the triples variant), "count the number of 1 bits" (Brian Kernighan\'s <code>n & (n-1)</code> loop, or Python\'s built-in <code>int.bit_count()</code>), "generate all subsets/combinations" for small n (bitmask enumeration as a non-recursive alternative to backtracking), and "check if a number is a power of two/four" (bit-count and bit-position checks). The unifying tell is an explicit O(1)-extra-space constraint on a problem that would otherwise reach for a hash set or hash map.',
    'The XOR-reduction trick isn\'t a coincidence of arithmetic, it\'s a direct consequence of (Z/2Z)^k — the set of k-bit integers under XOR — being an abelian group where every element is its own inverse: x ^ x = 0 (the identity) for every x, and commutativity/associativity mean a fold over any order of the array computes the same group sum. Formally, XOR-ing the whole array computes the group sum of all elements, and since every value appearing an even number of times contributes that value XORed with itself an even number of times — which telescopes to the identity — those terms vanish entirely from the sum, leaving exactly the values that appear an odd number of times. For Single Number, that\'s a single survivor; the same argument is why the naive trick breaks for triples (x^x^x = x, not the identity, since three is odd) and why the fix for "appears three times except one" has to track state mod 3 per bit instead of relying on a single XOR fold.',
  ],
  recognitionSignals: [
    '"Every element appears exactly twice except one which appears once" (or "exactly three times except one," or "exactly twice except two") → XOR-family reduction.',
    '"Count the number of set bits / 1 bits" phrasing → Brian Kernighan\'s algorithm or a bit-count DP.',
    '"Generate all subsets/combinations" with small n (roughly n ≤ 20) → bitmask enumeration as an iterative alternative to recursive backtracking.',
    'An explicit "without using extra space" / O(1) space constraint on a duplicate-finding, presence-checking, or subset-enumeration problem — a strong hint toward XOR or bitmask tricks over a hash set.',
  ],
  complexity: 'Time: O(n) for a single XOR-reduction pass over an array, or O(log(max value)) for bit tricks operating on one number (clearing/counting/isolating bits). Space: O(1) — avoiding a hash set/map is the entire point of reaching for bit tricks.',
  canonical: {
    name: 'Single Number (LeetCode 136)',
    statement: 'Given a non-empty array of integers nums where every element appears exactly twice except for one element which appears exactly once, find that single element, using O(n) time and O(1) extra space.',
  },
  story: {
    onePiece: {
      title: 'Cipher Pol\'s Haki flags, and the Marine ledger that cancels its own duplicates',
      text: [
        'The World Government\'s Cipher Pol registry tracks every ability a person of interest has confirmed, and it does it with a single number, not a paragraph: each Haki type — Observation, Armament, Conqueror\'s — is just one bit in a profile. Checking "does this person have Conqueror\'s Haki" isn\'t a database lookup, it\'s a single bitwise AND against one fixed mask, and combining two profiles\' abilities is a single OR. The whole registry format is a bitmask because a bitmask is the compact, provably-correct encoding of a fixed set of yes/no flags.',
        'A partially damaged Marine bounty ledger takes it further: it lists every pirate ID on a captured ship\'s manifest exactly twice — once from the initial sighting report, once from the capture report — except for one ID that appears only once, because that pirate slipped away before capture. Nobody wants to sort hundreds of smudged entries by hand. XOR every ID in the ledger together instead: every ID that appears twice cancels itself out exactly (x^x=0), in whatever order the smudged entries happen to be read, and the only ID left standing when the dust settles is the one that appeared once — the pirate who got away. That is LeetCode 136, Single Number, dressed up as a damaged manifest instead of an array.',
      ],
    },
    history: {
      title: 'Leibniz, binary, and the I Ching (1679–1703)',
      text: [
        'This is real, documented history, not a stretch: Gottfried Leibniz formalized binary arithmetic in the West in 1679. Later, in correspondence and notes from around 1703, he remarked on how closely the ancient Chinese I Ching hexagrams — patterns of broken and unbroken lines, a genuine 0/1 binary structure that predates him by well over a thousand years — resembled the binary number system he had just formalized. The bitwise tricks used constantly in interview problems today sit on top of a representation whose Western formalization is directly, provably tied to that historical episode.',
      ],
    },
    why: 'The Cipher Pol / ledger framing gives XOR-cancellation a physical picture — pairs vanishing off a smudged manifest — while the Leibniz/I Ching history anchors why binary representation itself is the substrate these tricks operate on, which is useful to have separately memorable from the trick itself.',
  },
  tricks: [
    {
      name: 'Initialize the XOR accumulator to 0 and fold the whole array — don\'t seed it with nums[0]',
      idea: 'Seeding the accumulator with nums[0] and then still looping over the entire array re-XORs nums[0] against itself, silently cancelling it before the real fold even starts.',
      before:
`def single_number(nums):
    xor = nums[0]
    for i in range(len(nums)):     # BUG: re-includes index 0, XOR-ing nums[0] with itself
        xor ^= nums[i]
    return xor`,
      after:
`def single_number(nums):
    xor = 0
    for num in nums:               # fold the WHOLE array against a 0 identity, no special-casing index 0
        xor ^= num
    return xor`,
      explain: 'Seeding the accumulator with nums[0] and then looping over the entire array re-XORs nums[0] against itself, silently cancelling it out (x^x=0) — if nums[0] happens to be the single unique value, the function now returns the wrong answer instead of crashing. Starting from the identity element 0 and folding every element exactly once, with no special-cased first element, removes the entire class of off-by-one bugs here.',
    },
    {
      name: '`n & (n - 1) == 0` also matches n = 0 — guard with n > 0',
      idea: 'Clearing the lowest set bit and comparing to 0 detects "exactly one bit was set," but n = 0 has no bits set at all and satisfies the same equation, so the bare check wrongly calls 0 a power of two.',
      before:
`def is_power_of_two(n):
    return n & (n - 1) == 0   # BUG: n=0 gives 0 & -1 == 0 -> wrongly reports True`,
      after:
`def is_power_of_two(n):
    return n > 0 and n & (n - 1) == 0`,
      explain: 'n & (n - 1) clears the lowest set bit, and for a true power of two that\'s the only bit set, so the result is 0 — but n = 0 has no set bits at all, and 0 & (0 - 1) is also 0 in Python\'s arbitrary-precision two\'s complement, so the bare expression incorrectly calls 0 a power of two. The n > 0 guard excludes the one input where "no bits differ" means "there were never any bits" rather than "there was exactly one, now cleared."',
    },
  ],
  variants: [
    {
      company: 'Google-style',
      title: 'Single Number II — every element appears three times except one (LeetCode 137)',
      twist: 'Plain XOR cancels pairs, not triples, so the Single Number I trick breaks silently (it returns a value, just the wrong one). The standard fix tracks two bitmask accumulators, <code>ones</code> and <code>twos</code>, representing "bits seen exactly once so far" and "bits seen exactly twice so far," updated each iteration as <code>ones = (ones ^ n) & ~twos</code> then <code>twos = (twos ^ n) & ~ones</code> — equivalently, you can sum each bit position\'s count mod 3 across all numbers, which generalizes more obviously to "appears k times except one."',
    },
    {
      company: 'Meta-style',
      title: 'Single Number III — two elements each appear once, the rest twice (LeetCode 260)',
      twist: 'XOR-ing the entire array gives <code>diff = a ^ b</code>, the XOR of the two unique numbers, not either one individually — a single accumulator can no longer separate them. The trick is to isolate any one set bit in diff (e.g. via <code>diff & -diff</code>), which is guaranteed to differ between a and b, and use it to partition every number in the array into two groups by whether that bit is set; XOR-ing each group independently then recovers a and b separately.',
    },
    {
      company: 'Amazon-style',
      title: 'Counting Bits — total set bits for every number in [0, n] (LeetCode 338)',
      twist: 'Rather than running Brian Kernighan\'s O(log v) loop independently for every one of the n numbers (O(n log n) total), this becomes a DP-over-bits problem: <code>dp[i] = dp[i >> 1] + (i & 1)</code>, reusing the already-computed popcount of a smaller prefix (i shifted right by one, i.e. i // 2) plus whether the current lowest bit is set. This drops total work to O(n) and is a good example of bit tricks combining with DP rather than standing alone.',
    },
  ],
  pythonSolution: {
    title: 'Single Number',
    code:
`import operator
from functools import reduce

def single_number(nums: list[int]) -> int:
    return reduce(operator.xor, nums, 0)`,
    notes: [
      '<code>reduce(operator.xor, nums, 0)</code> expresses "fold XOR across the whole list" in one line instead of a manual accumulator loop; the explicit initial value 0 also correctly handles a single-element input.',
      '<code>operator.xor</code> avoids writing <code>lambda a, b: a ^ b</code> — using the operator module\'s C-implemented function is both more idiomatic and marginally faster than a Python-level lambda.',
      'For "clear the lowest set bit" style utilities elsewhere, prefer the inline expression <code>n & (n - 1)</code> over <code>bin(n).count("1")</code> inside a hot loop — the latter allocates a string just to count characters, which is wasteful when called repeatedly.',
      '<code>n.bit_count()</code> (Python 3.10+) is now the idiomatic, fastest way to count set bits directly on an int, effectively replacing the manual Brian Kernighan loop in production code — though you should still be able to derive the manual loop on a whiteboard.',
    ],
  },
  pitfalls: [
    'Initializing the XOR accumulator to <code>nums[0]</code> and looping from index 1 instead of initializing to 0 and looping over the whole array — an easy way to introduce an off-by-one that skips or double-counts the first element.',
    'Applying the plain Single Number I two-value trick unmodified to the "appears three times except one" variant — XOR-ing everything does not cancel out triples, silently returning a wrong bit pattern rather than crashing, so it can pass a lucky test case.',
    'Relying on <code>n & -n</code> reasoning that assumes a fixed-width two\'s-complement integer: it still correctly isolates the lowest set bit in Python (whose ints are arbitrary-precision with a conceptually infinite sign-extended pattern), but "highest bit" or fixed-width overflow tricks from C/Java do not translate directly and need care.',
    'Using <code>n & (n - 1) == 0</code> to test "is n a power of two" without first excluding n ≤ 0 — this expression is also true for n = 0 (0 & -1 == 0), which is not a power of two, so the check must be <code>n > 0 and n & (n - 1) == 0</code>.',
  ],
  viz: {
    type: 'array',
    initialArray: [4, 1, 2, 1, 2],
    steps: [
      { highlights: {}, pointers: {}, vars: { xor: 0 }, message: 'Initialize the running XOR accumulator to 0 (identity element: x ^ 0 = x).' },
      { highlights: { 0: 'a' }, pointers: { i: 0 }, vars: { xor: 4 }, message: 'xor = 0 ^ 4 = 4' },
      { highlights: { 1: 'a' }, pointers: { i: 1 }, vars: { xor: 5 }, message: 'xor = 4 ^ 1 = 5' },
      { highlights: { 2: 'a' }, pointers: { i: 2 }, vars: { xor: 7 }, message: 'xor = 5 ^ 2 = 7' },
      { highlights: { 3: 'a' }, pointers: { i: 3 }, vars: { xor: 6 }, message: 'xor = 7 ^ 1 = 6 — the first 1 has now cancelled with this second 1.' },
      { highlights: { 4: 'a' }, pointers: { i: 4 }, vars: { xor: 4 }, message: 'xor = 6 ^ 2 = 4 — the pair of 2s has also cancelled. Final xor = 4.' },
      { highlights: { 0: 'c', 1: 'bad', 2: 'bad', 3: 'bad', 4: 'bad' }, pointers: {}, vars: { xor: 4, answer: 4 }, message: 'Every value appearing twice cancels itself out (x^x=0); only the value appearing once — 4 — survives. Answer = 4.' },
    ],
  },
  quiz: [
    {
      q: 'A problem states every element in an array appears exactly twice except one which appears once, and asks for O(1) extra space. What\'s the signal?',
      options: [
        'Use a hash set to track seen elements',
        'XOR-reduce the entire array: pairs cancel to 0 (x^x=0), leaving only the single element',
        'Sort the array and binary search for the gap',
        'Use dynamic programming with a 2D table',
      ],
      correct: 1,
      explain: 'A hash set works but costs O(n) space, violating the O(1) constraint. XOR-reducing the whole array is O(n) time and O(1) space, exploiting x^x=0 and XOR\'s order-independence.',
    },
    {
      q: 'What does `n & (n - 1)` do?',
      options: [
        'Isolates the lowest set bit of n',
        'Clears (zeroes out) the lowest set bit of n',
        'Reverses all the bits of n',
        'Checks whether n is negative',
      ],
      correct: 1,
      explain: 'n - 1 flips all bits below and including the lowest set bit of n; ANDing with the original n keeps everything above that bit unchanged while zeroing the lowest set bit itself. (Isolating it, by contrast, is n & -n.)',
    },
    {
      q: 'Single Number II (LeetCode 137) has every element appearing exactly three times except one. Why does the plain XOR-reduction from Single Number I fail here?',
      options: [
        'XOR only works correctly on sorted arrays',
        'XOR-ing a value with itself an additional two times (three total occurrences) does not cancel back to 0 the way it does for pairs — you need bit-counting mod 3 (or two bitmask accumulators) instead',
        'It doesn\'t fail — the exact same code works unchanged',
        'XOR is undefined for negative numbers',
      ],
      correct: 1,
      explain: 'x^x^x = x, not 0 — XOR cancellation is specifically a pairs phenomenon. For "appears k times except one," you generally need to track each bit\'s count modulo k, not a single running XOR.',
    },
    {
      q: 'For Single Number III (two unique elements, the rest appear twice), after XOR-ing the whole array you get `diff = a ^ b`. What\'s the next step?',
      options: [
        'diff is already one of the two answers',
        'Isolate any set bit in diff (e.g. via diff & -diff) to partition all numbers into two groups by that bit, then XOR each group independently to recover a and b',
        'Sort the array and take the two smallest values',
        'Divide diff by 2 to get one of the two numbers',
      ],
      correct: 1,
      explain: 'diff mixes together the bits of both unique numbers, so a single accumulator can\'t separate them. Any bit set in diff must differ between a and b (since matching bits would cancel), so it can be used to split the array into two independent sub-problems, each solvable with Single Number I\'s trick.',
    },
    {
      q: 'Why is `n.bit_count()` (Python 3.10+) generally preferred over manually looping with `n & (n - 1)` (Brian Kernighan) to count set bits?',
      options: [
        'bit_count() is less accurate for large numbers',
        'It\'s a built-in, C-implemented method — faster and clearer than hand-rolling the same loop, though the manual technique is still expected knowledge for a whiteboard interview',
        'bit_count() only works on floating-point numbers',
        'There is no difference; they run at identical speed',
      ],
      correct: 1,
      explain: 'In production code, prefer the built-in. In an interview, you should still be able to derive and explain the manual n & (n-1) loop, since the interviewer is often testing whether you understand why it works, not just that a built-in exists.',
    },
  ],
};
