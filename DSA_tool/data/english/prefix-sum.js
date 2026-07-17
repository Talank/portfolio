window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['prefix-sum'] = {
  id: 'prefix-sum',
  title: 'Prefix Sum',
  titleNe: 'The kilometre-stones along the highway',
  intro: 'precompute running totals so any range sum becomes one subtraction',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Many <b>range-sum</b> queries on the same array: “sum from i to j?”',
        '“How many <b>subarrays</b> sum to K?” — even with negative numbers.',
        'Sliding window fails on negatives — prefix sum is the tool that steps in.',
      ],
      narration: "Now Prefix Sum — simple, but deep. The story: along the Prithvi Highway there are kilometre-stones marking how far you are from Kathmandu. Naubise is at twenty-six, Mugling at one hundred and ten. How far from Naubise to Mugling? One-ten minus twenty-six — a single subtraction! You didn't measure the road by walking it, because each stone already records the total from the start. Prefix sum is exactly that — build the running total up to every position once, then get the sum of any stretch in O(1) from the difference of two stones. Reach for it when the same array is asked for range sums repeatedly, or on questions like subarray sum equals K.",
    },
    {
      heading: 'Story: The subtraction trick',
      bullets: [
        '<code>P[i]</code> = sum of the first i elements; <code>P[0] = 0</code>.',
        'sum(i..j) = <code>P[j+1] − P[i]</code> — build O(n) once, answer O(1) forever.',
        'The empty prefix <code>P[0]=0</code> is what lets ranges starting at index 0 work.',
      ],
      narration: "How to build it — start with P of zero equals zero, then at each step add the new element to the previous total. The sum from i to j is P of j-plus-one minus P of i. Here's a tiny but crucial detail — that leading zero. Even Kathmandu has a zero-kilometre stone planted somewhere — without it you couldn't get the distance from Kathmandu to Naubise by subtraction. In the same way, without P of zero equals zero, the totals for stretches that start at index zero break. That empty prefix is the most-forgotten detail in this pattern.",
    },
    {
      heading: 'Mnemonic',
      big: '“Keep the total, subtract to get a range — and don’t forget the zero-stone.”',
      bullets: [
        'Range sum = difference of two milestones.',
        'Subarray sum == K ⇒ “have I seen milestone <code>P − K</code> before?” → hash map!',
        'Prefix idea generalizes: products, XOR, 2-D grids, counts of odd/even.',
      ],
      narration: "The hook: keep the total, subtract to get a range, and don't forget to plant the zero-stone. Now watch the second layer of magic — how does subarray sum equals K fall out? A stretch summing to K means two stones differ by K. So as you walk the array, at each new stone P you ask: have I seen a stone at P minus K before? That's just the Two Sum question from the previous module — asking a hash map what I need! Prefix sum and hashing together work even on arrays with negative numbers, where sliding window fails completely. This is the first place two patterns combine into a new power — keep it in mind.",
    },
    {
      heading: 'Python template',
      code: 'from itertools import accumulate\n\ndef range_sums(nums, queries):\n    P = [0, *accumulate(nums)]           # zero-stone + running totals\n    return [P[j + 1] - P[i] for i, j in queries]\n\ndef subarray_sum_equals_k(nums, k):\n    seen = {0: 1}                        # empty prefix seen once\n    P = ans = 0\n    for x in nums:\n        P += x\n        ans += seen.get(P - k, 0)        # how many stones at P−k?\n        seen[P] = seen.get(P, 0) + 1\n    return ans',
      narration: "The top function — accumulate builds the running total in one line, and prepending a zero gives you the row of stones. The bottom function is the famous Subarray Sum Equals K — since we're counting, the hash map records how many times each prefix has been seen. Notice seen starts with the zero-stone already placed once — without it, stretches reaching K from the very start of the array go uncounted. And the same order again — ask first, then add your own stone — otherwise, when K is zero, you count yourself and the answer comes out too high. Time O(n), space O(n).",
    },
    {
      heading: 'Watch out! Where it generalizes',
      bullets: [
        'Product of Array Except Self = prefix product × suffix product (no division).',
        '2-D grids: <code>P[r][c]</code> rectangle sums via inclusion–exclusion.',
        'Odd-count / parity questions: same trick with counts instead of sums.',
        'Don’t rebuild P per query — build once, that is the whole point!',
      ],
      narration: "Finally, see where this idea spreads. In Product of Array Except Self it's products, not sums — a prefix product from the left meets a suffix product from the right, solving it with no division at all — and no-division is the whole twist of the problem. In a two-dimensional grid the same idea: keep the total up to each corner, and any rectangle's sum comes from adding and subtracting four stones. Not just sums — XOR, counts, odd-versus-even — any quantity that accumulates works with this trick. And a last warning — if you rebuild P on every query, you've thrown away the whole benefit; plant the stones once, and after the road is built, ask as many times as you like, for free.",
    },
  ],
};
