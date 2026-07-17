window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['dynamic-programming'] = {
  id: 'dynamic-programming',
  title: 'Dynamic Programming',
  titleNe: 'Ask once, write it in the notebook, never ask again',
  intro: 'overlapping subproblems + optimal substructure — remember answers instead of recomputing them',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'The brute-force recursion re-solves the <b>same subproblem</b> many times — that repetition is the signal.',
        'Ask: “can I express the answer for n in terms of the answer for smaller n?” — if yes, DP is on the table.',
        'Two flavours: top-down (recursion + memo) and bottom-up (table, filled in order).',
      ],
      narration: "Now Dynamic Programming — a name that frightens many, but its heart is dead simple. Think of Fibonacci — how many times does plain recursion recompute fib of three to get fib of five? Many times — the same question, the same answer, but asked again and again as if forgotten. Here's the story — a student who, every time, can't remember the answer to the same little sum and keeps grabbing the calculator again. The fix is easy — the first time an answer comes, write it on a page of a notebook. When the same question comes again, don't reach for the calculator, look at the notebook. That's DP — when you find overlapping subproblems and optimal substructure — a big answer built from smaller answers — keep a notebook, which is memoization.",
    },
    {
      heading: 'Story: Top-down vs bottom-up — same notebook, different door',
      bullets: [
        '<b>Top-down</b>: start from the big question, recurse down, cache (<code>@lru_cache</code> or a dict) as you go.',
        '<b>Bottom-up</b>: start from the smallest base cases, build the table up to the answer — no recursion, no stack risk.',
        'Same notebook, opposite doors — top-down feels natural to write, bottom-up is safer for large n.',
      ],
      narration: "There are two ways to keep the notebook, both using the same notebook, just entering by different doors. Top-down — start from the big question — I need the answer for n, for that I need n-minus-one and n-minus-two, ask them descending down, and jot each answer in the notebook as you come back. This feels easy to write for most people, because it looks like ordinary recursion, only with a dict or an lru_cache added. Bottom-up — the opposite door — start from the smallest base cases, fill the table from the bottom up, and reach the big answer at the end. There's no recursion, so no fear of hitting Python's recursion limit — for problems with large n, bottom-up is more reliable.",
    },
    {
      heading: 'Mnemonic',
      big: '“Ask once, write it in the notebook, look it up next time, no calculator.”',
      bullets: [
        'State = “what do I need to know to answer this subproblem?” — often (index) or (index, remaining capacity).',
        'Transition = how today’s state is built from yesterday’s — this is 90% of the actual thinking.',
        'Base case = the smallest state you can answer without recursing further.',
      ],
      narration: "The hook: ask once, write it in the notebook, look it up next time, no calculator. Solving a DP problem, you must settle three things. First — the state, meaning what you need to know to answer this subproblem — usually an index (how far you've come), sometimes an index and remaining capacity both (like remaining weight in Knapsack). Second, and the hardest part — the transition — the formula for how today's answer is built from yesterday's answer or answers — ninety percent of the thinking in a DP problem is spent here. Third — the base case — the smallest state you can answer without recursing further. Once these three are settled, writing the code is just a formality.",
    },
    {
      heading: 'Python template',
      code: 'from functools import lru_cache\n\n# Top-down: Climbing Stairs (n ways to reach step n, 1 or 2 steps at a time)\n@lru_cache(maxsize=None)\ndef climb(n):\n    if n <= 2:\n        return n                      # base case (first page of the notebook)\n    return climb(n - 1) + climb(n - 2)  # transition\n\n# Bottom-up: same problem, table filled left to right\ndef climb_bottom_up(n):\n    if n <= 2:\n        return n\n    dp = [0] * (n + 1)\n    dp[1], dp[2] = 1, 2\n    for i in range(3, n + 1):\n        dp[i] = dp[i - 1] + dp[i - 2]     # transition, but as a loop\n    return dp[n]\n\n# 0/1 Knapsack — the other DP archetype (state = (index, capacity))\ndef knapsack(weights, values, capacity):\n    n = len(weights)\n    dp = [[0] * (capacity + 1) for _ in range(n + 1)]\n    for i in range(1, n + 1):\n        for c in range(capacity + 1):\n            dp[i][c] = dp[i - 1][c]                     # don\'t take this item\n            if weights[i - 1] <= c:\n                dp[i][c] = max(dp[i][c], dp[i - 1][c - weights[i - 1]] + values[i - 1])  # take it\n    return dp[n][capacity]',
      narration: "Three examples. Look at the top-down form of Climb Stairs — that one line of lru_cache keeps the whole notebook for you, and the code looks just like plain recursion. The bottom-up form of the same problem — filling a dp array, a for loop replacing the recursion, the same transition, but bottom to top. And Knapsack — the other big DP family, where the state needs two things — how many items you've looked at, and how much room is left in the bag. For each item there are two choices — don't take it (carry the value above down) or take it (add this item's value and look up the answer for the remaining room) — keep the larger of the two. This take-it-or-leave-it shape repeats in many problems like subset-sum and coin-change.",
    },
    {
      heading: 'Watch out! Recognizing DP and common traps',
      bullets: [
        'Keywords: “number of ways”, “minimum/maximum cost to reach”, “can you partition/reach exactly X”.',
        'Space optimization: if <code>dp[i]</code> only needs <code>dp[i-1]</code>/<code>dp[i-2]</code>, drop the array for two variables.',
        'Off-by-one in the table size (<code>n+1</code> rows/cols) is the #1 bug — draw the table on paper first.',
        'If subproblems <i>don’t</i> overlap, you don’t need DP — plain recursion or greedy may be simpler and faster.',
      ],
      narration: "Final warnings. If you see these words in a problem, knock on DP's door — number of ways, minimum cost to reach, can you make exactly X. One nice optimization — in a problem like Climbing Stairs, dp of i needs only the previous two, so keeping two variables instead of the whole array drops the space from O(n) to O(1) — this is often asked as a bonus. The most common bug — getting the table size off by one or two — so build the habit of drawing the table by hand on a small example before writing code. And finally — if the subproblems genuinely don't overlap, you don't need DP — plain recursion, or the backtracking and greedy from other modules, solves it faster; don't force DP where it doesn't belong.",
    },
  ],
};
