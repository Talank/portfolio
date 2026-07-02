window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['monotonic-stack'] = {
  id: 'monotonic-stack',
  title: 'Monotonic Stack',
  category: 'Hashing & Linear Structures',
  timeMin: 12,
  summary: 'Keep a stack whose elements stay strictly increasing or decreasing, so that each pop resolves a "next/previous greater or smaller" query in O(1) amortized time.',
  concept: [
    'A monotonic stack maintains its contents in strictly increasing or strictly decreasing order by popping any element that violates that order before pushing the new one. You almost always store <i>indices</i>, not values, so that once an element is resolved you can compute a distance or width (<code>i - poppedIndex</code>) — the value is recovered with one array lookup when you need it.',
    'The trick is that <b>the pop moment is the resolution moment</b>: when the current element causes you to pop something off the stack, the current element <i>is</i> the answer ("next greater/smaller") for whatever just got popped. Because every index is pushed exactly once and popped at most once across the whole scan, the total work is O(n) amortized even though there\'s a while loop nested inside a for loop.',
    'Whether the stack should be increasing or decreasing, and whether the comparison is strict (<code>&lt;</code>) or non-strict (<code>&lt;=</code>), depends on the exact question being asked ("next greater" vs. "next greater or equal," which occurrence wins on a tie). Get the comparison operator wrong and the algorithm still runs to completion and returns a plausible-looking but off-by-one wrong answer — it will not crash, which is exactly what makes this bug dangerous in an interview.',
  ],
  recognitionSignals: [
    '"For each element, find the next/previous element that is greater/smaller" — the canonical monotonic-stack phrasing.',
    'Problems like "days until a warmer temperature," "next greater element," "largest rectangle in a histogram," or "trapping rain water" — anything shaped like a per-element query against its neighbors in a specific direction.',
    'Brute force is an O(n²) scan-forward/backward-from-each-index approach — the stack collapses this to O(n) by remembering only the "still unresolved" candidates instead of rescanning.',
    'Distinguish from sliding window: there is no contiguous range being grown/shrunk against a validity condition here. Instead you maintain an ordered history of unresolved elements, and elements can resolve out of order relative to their array position.',
    'Distinguish from a plain stack (e.g. balanced parentheses): a monotonic stack actively pops non-monotonic elements as part of the algorithm\'s logic, not just to match/undo a structural nesting.',
  ],
  complexity: 'Time: O(n) amortized — each index is pushed once and popped at most once, so total push+pop operations are bounded by 2n regardless of how the while loop is nested. Space: O(n) worst case (e.g. a strictly decreasing temperature sequence never triggers a pop, so every index stays on the stack).',
  canonical: {
    name: 'Daily Temperatures (LeetCode 739)',
    statement: 'Given an array of daily temperatures, return an array answer where answer[i] is the number of days you\'d have to wait after day i to get a warmer temperature. If there is no future day for which this is possible, put 0 instead.',
  },
  variants: [
    {
      company: 'Google-style',
      title: 'Next Greater Element II — circular array (LeetCode 503)',
      twist: 'The array is now circular: the "next greater element" can wrap around past the end back to the beginning. Instead of physically doubling the array in memory, iterate <code>2n</code> times and index with <code>i % n</code>, using the exact same decreasing-stack logic. The subtlety is realizing the stack itself doesn\'t need to know about the wraparound — only the index arithmetic does.',
    },
    {
      company: 'Meta-style',
      title: 'Largest Rectangle in Histogram (LeetCode 84)',
      twist: 'Instead of answering a per-element "next greater" query, you maintain a stack of increasing bar heights and, when a pop happens, compute an <i>area</i> (<code>height * width</code>) rather than just recording a distance. The width on pop is <code>i - stack[-1] - 1</code> (or <code>i</code> if the stack is now empty) — you need the index of the new stack top, not just the popped index, to know the left boundary. This is the same skeleton doing real arithmetic at each pop instead of a single subtraction, and is meaningfully harder to get right under time pressure.',
    },
    {
      company: 'Amazon-style',
      title: 'Online Stock Span (LeetCode 901)',
      twist: 'Prices now arrive one at a time via repeated calls to <code>next(price)</code> on a class instance, not as a full array upfront — you must return the span for each price immediately, with no ability to look ahead. The fix is to store <code>(price, span)</code> pairs on the stack: when popping elements with price <= current price, absorb their span into the current one before pushing. This keeps the same amortized O(1) per call, but forces you to design a stateful class API instead of a single-pass function over a known array.',
    },
  ],
  pythonSolution: {
    title: 'Daily Temperatures',
    code:
`def daily_temperatures(temps: list[int]) -> list[int]:
    answer = [0] * len(temps)
    stack = []  # indices with strictly decreasing temperatures
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            answer[j] = i - j
        stack.append(i)
    return answer`,
    notes: [
      '<code>enumerate(temps)</code> gives index and value together, needed here because the stack stores indices but the comparison needs values.',
      '<code>while stack and temps[stack[-1]] < t</code> is the idiomatic guard order — checking <code>stack</code> truthiness first avoids an IndexError from <code>stack[-1]</code> on an empty stack (short-circuit evaluation).',
      'Using a plain Python <code>list</code> as the stack is correct and idiomatic here — <code>append</code>/<code>pop</code> from the end are both O(1), unlike <code>pop(0)</code> which would be O(n).',
      '<code>answer = [0] * len(temps)</code> pre-fills the "no warmer day found" default, so indices left on the stack at the end never need special-casing.',
    ],
  },
  pitfalls: [
    'Storing values instead of indices in the stack — you lose the ability to compute <code>i - j</code> (the distance), which is what most of these problems actually ask for.',
    'Using <code>&lt;=</code> instead of <code>&lt;</code> in the while condition (or vice versa) — for "next warmer/strictly greater," popping on equal values is wrong (an equal temperature is not warmer), silently shifting every answer for repeated values.',
    'Forgetting to push the current index after the while loop finishes — every element must end up on the stack (even if it immediately triggers pops for others later); skipping this breaks the invariant that the stack always holds all "still unresolved" indices.',
    'Assuming the stack can grow unbounded and worrying about O(n²) — the amortized argument (each index pushed once, popped at most once) is exactly the thing to say out loud to justify O(n) despite the nested loop.',
  ],
  viz: {
    type: 'array',
    initialArray: [73, 74, 75, 71, 69, 72, 76, 73],
    steps: [
      { highlights: { 0: 'a' }, pointers: { i: 0 }, vars: { stack: '[0]', answer: '[0, 0, 0, 0, 0, 0, 0, 0]' }, message: 'i=0, temp=73. Stack empty → push index 0. stack=[0].' },
      { highlights: { 0: 'bad', 1: 'a' }, pointers: { i: 1 }, vars: { stack: '[1]', popped: 'index 0 → answer[0]=1-0=1', answer: '[1, 0, 0, 0, 0, 0, 0, 0]' }, message: 'i=1, temp=74 > temps[0]=73 → pop 0, answer[0]=1-0=1. Push 1. stack=[1].' },
      { highlights: { 1: 'bad', 2: 'a' }, pointers: { i: 2 }, vars: { stack: '[2]', popped: 'index 1 → answer[1]=2-1=1', answer: '[1, 1, 0, 0, 0, 0, 0, 0]' }, message: 'i=2, temp=75 > temps[1]=74 → pop 1, answer[1]=1. Push 2. stack=[2].' },
      { highlights: { 2: 'b', 3: 'a' }, pointers: { i: 3 }, vars: { stack: '[2, 3]', answer: '[1, 1, 0, 0, 0, 0, 0, 0]' }, message: 'i=3, temp=71 ≤ temps[2]=75 → no pop, stack stays non-increasing. Push 3. stack=[2, 3].' },
      { highlights: { 2: 'b', 3: 'b', 4: 'a' }, pointers: { i: 4 }, vars: { stack: '[2, 3, 4]', answer: '[1, 1, 0, 0, 0, 0, 0, 0]' }, message: 'i=4, temp=69 ≤ temps[3]=71 → no pop. Push 4. stack=[2, 3, 4].' },
      { highlights: { 4: 'bad', 3: 'bad', 2: 'b', 5: 'a' }, pointers: { i: 5 }, vars: { stack: '[2, 5]', popped: '4→answer[4]=1, 3→answer[3]=2', answer: '[1, 1, 0, 2, 1, 0, 0, 0]' }, message: 'i=5, temp=72. Pop 4 (69<72, answer[4]=5-4=1), pop 3 (71<72, answer[3]=5-3=2). Stop — temps[2]=75 not < 72. Push 5. stack=[2, 5].' },
      { highlights: { 5: 'bad', 2: 'bad', 6: 'a' }, pointers: { i: 6 }, vars: { stack: '[6]', popped: '5→answer[5]=1, 2→answer[2]=4', answer: '[1, 1, 4, 2, 1, 1, 0, 0]' }, message: 'i=6, temp=76. Pop 5 (72<76, answer[5]=1), pop 2 (75<76, answer[2]=6-2=4). Stack now empty. Push 6. stack=[6].' },
      { highlights: { 6: 'b', 7: 'a' }, pointers: { i: 7 }, vars: { stack: '[6, 7]', answer: '[1, 1, 4, 2, 1, 1, 0, 0]' }, message: 'i=7, temp=73 ≤ temps[6]=76 → no pop. Push 7. stack=[6, 7]. Input exhausted — indices left on the stack never found a warmer day, so their answers stay 0.' },
      { highlights: { 0: 'c', 1: 'c', 2: 'c', 3: 'c', 4: 'c', 5: 'c', 6: 'c', 7: 'c' }, arrayOverride: [1, 1, 4, 2, 1, 1, 0, 0], pointers: {}, vars: { answer: '[1, 1, 4, 2, 1, 1, 0, 0]' }, message: 'Final answer: days until a warmer temperature for each index, computed in a single O(n) amortized pass.' },
    ],
  },
  quiz: [
    {
      q: 'Which problem phrasing most strongly signals a monotonic stack rather than a sliding window?',
      options: [
        'Find the longest substring with at most K distinct characters',
        'For each element, find the next element to its right that is strictly greater',
        'Find a pair of numbers in a sorted array summing to a target',
        'Find the maximum sum of any contiguous subarray of size k',
      ],
      correct: 1,
      explain: '"At most K distinct" and "fixed-size subarray" are sliding window signatures; "sorted pair sum" is two pointers. "For each element, find the next greater element" is the monotonic stack\'s defining query shape.',
    },
    {
      q: 'Why is Daily Temperatures O(n) time despite having a while loop nested inside a for loop?',
      options: [
        'Because the while loop never actually executes more than once total',
        'Because each index is pushed onto the stack exactly once and popped at most once across the entire run, bounding total stack operations by O(n)',
        'Because the input is guaranteed to be sorted',
        'It is not O(n); it is actually O(n²) in the worst case',
      ],
      correct: 1,
      explain: 'This is the amortized-analysis argument for monotonic stacks: even though the while loop can pop several elements in one outer iteration, no index is ever pushed or popped more than once total, so the sum of all inner-loop work across the whole run is still O(n).',
    },
    {
      q: 'In the reference code, why does the while condition check `temps[stack[-1]] < t` and not `<=`?',
      options: [
        'Using <= would cause an infinite loop',
        'Using <= would pop an equal-temperature day too, incorrectly treating an equal (not warmer) day as the answer for a previous day',
        'It makes no difference either way',
        '<= is required to keep the stack strictly increasing instead of decreasing',
      ],
      correct: 1,
      explain: 'The problem asks for a strictly warmer day. If the comparison used <=, a day with the same temperature as an earlier one would trigger a pop and get recorded as "the warmer day," which is wrong — it is not warmer, only equal.',
    },
    {
      q: 'The Largest Rectangle in Histogram variant (LC 84) reuses the same monotonic-stack skeleton but adds what extra piece of work at each pop?',
      options: [
        'Nothing extra — the code is character-for-character identical to Daily Temperatures',
        'Computing an area (height * width) using the popped index, the current index, and the new stack top after the pop, instead of just recording a distance',
        'Sorting the stack after every pop',
        'Switching from a stack to a hashmap entirely',
      ],
      correct: 1,
      explain: 'Where Daily Temperatures just records i - poppedIndex, the histogram problem needs a width bounded on both sides — the new stack top (left boundary) and the current index (right boundary) — multiplied by the popped bar\'s height, making each pop do real arithmetic instead of a single subtraction.',
    },
    {
      q: 'At the end of a Daily Temperatures run, some indices may remain on the stack and never get popped. What does that mean?',
      options: [
        'It indicates a bug — every index must eventually be popped',
        'Those days never found a strictly warmer day for the rest of the array, so their answer correctly stays at the default 0',
        'The stack should be cleared and the algorithm re-run',
        'Those indices should be assigned the maximum possible answer value',
      ],
      correct: 1,
      explain: 'Elements remain on the stack exactly when no later element resolved them — i.e., no warmer day ever appeared. The answer array is pre-filled with 0 for this reason, so leftover stack entries need no special handling.',
    },
  ],
};
