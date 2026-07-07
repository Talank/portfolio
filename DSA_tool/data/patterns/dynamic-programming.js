window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['dynamic-programming'] = {
  id: 'dynamic-programming',
  title: 'Dynamic Programming',
  category: 'Optimization Patterns',
  timeMin: 35,
  summary: 'Break an optimization/counting problem into overlapping subproblems, solve each exactly once, and reuse cached results instead of recomputing an exponential recursion tree.',
  concept: [
    'Every DP solution is defined by three ingredients you should say out loud before writing code: the <b>state</b> (the minimal set of parameters that uniquely identifies a subproblem — e.g. "the best answer considering only the first i elements"), the <b>transition</b> (how a state\'s answer is built from the answers to strictly smaller states), and the <b>base case</b> (the smallest state(s) you can answer directly without recursing further). If you can\'t articulate the state in one sentence, you don\'t have a DP solution yet — you have a guess.',
    '<b>Top-down memoization</b> writes the recurrence as a recursive function and caches (memoizes) each state\'s result the first time it\'s computed — in Python this is usually a one-line <code>@functools.lru_cache</code> decorator over a recursive function. It mirrors the mathematical recurrence directly, and — crucially — only computes states actually reached by the recursion, which matters when the full state space is much larger than the set of states a given input actually visits. Its downsides are recursion overhead (function call cost) and Python\'s default recursion limit (~1000), which can matter for deep 1D DPs on large n. <b>Bottom-up tabulation</b> instead iterates over states in an order that guarantees every dependency is already computed (usually increasing index, or increasing interval length for interval DP), filling an explicit table. It avoids recursion-depth issues entirely and — because you control the iteration order — often lets you collapse the table to O(1) or O(n) space instead of O(n²) by only keeping the last one or two rows/values you still need ("rolling array" optimization). In an interview, deriving top-down first (it\'s usually easier to get correct) and then translating to bottom-up if space matters is a defensible, narratable strategy.',
    'Interviewers draw DP problems from a handful of recurring shapes, and recognizing the shape from the problem phrasing is most of the battle. <b>1D linear DP</b> (House Robber, Climbing Stairs, Maximum Subarray): dp[i] depends on a constant number of previous dp values (dp[i-1], dp[i-2], …); the state is "up to index i." <b>0/1 knapsack</b> (Partition Equal Subset Sum, Target Sum): each item is used at most once; dp[i][w] = best value using the first i items with capacity w, and the space-optimized 1D version must iterate the capacity loop <i>backward</i> to avoid reusing an item twice in the same pass. <b>Unbounded knapsack</b> (Coin Change, Coin Change II): items can be reused arbitrarily many times, so the capacity/amount loop typically runs <i>forward</i>, letting a single coin type contribute more than once. <b>LCS family</b> (Longest Common Subsequence, Edit Distance, Longest Common Substring): two input strings/sequences → 2D dp[i][j] over one index into each string, since the state must capture progress through both independently. <b>Interval DP</b> (Matrix Chain Multiplication, Burst Balloons, Palindrome Partitioning): dp[i][j] represents the answer over the subrange [i, j], and transitions split the interval at some pivot k — this requires iterating by increasing interval length, not by row/column index, since dp[i][j] depends on smaller sub-intervals strictly inside [i, j]. <b>Grid DP</b> (Unique Paths, Minimum Path Sum): dp[i][j] on the actual input grid, transition pulls from the top and/or left neighbor.',
    'The strongest signal for choosing 1D vs. 2D state is how many independent sequences the problem hands you and whether "adjacency" or "position within one array" is the only constraint. One array + a positional constraint ("no two adjacent," "at most k apart") → 1D. Two strings/arrays being compared or interleaved → 2D, with the state indexing into both. It\'s also common for a 2D recurrence to be provably reducible to O(1) or O(n) rolling space once you notice dp[i][j] only ever reads row i-1 (or i-1 and i-2) — a strong follow-up an interviewer will probe for after you get the O(n²)-space version working.',
    'A very common follow-up flips "return the optimal value" into "return the optimal solution itself" (the actual subsequence, path, or item set). The numeric dp table alone doesn\'t retain that information — you need either a parallel choice/parent table recorded during the fill, or a backward reconstruction pass that re-derives, at each cell, which transition produced it (by checking which candidate matches the stored value). Always ask out loud whether the interviewer wants the value or the construction — it changes what you need to store.',
    'The correctness of any DP solution is ultimately a proof by strong induction over the state\'s dependency order, not just "it matches my mental model of the problem." You must show two things: the base case(s) are correct by direct computation (not by appeal to the recurrence), and the transition is correct assuming every state it reads from is already correct — i.e. dp[i] = max(dp[i-1], dp[i-2] + nums[i]) is valid only because dp[i-1] and dp[i-2] are themselves guaranteed correct by the induction hypothesis, which in turn requires that the order you fill states in respects every dependency (a DAG on the state space, never a cycle — if dp[i] ever depended on dp[i], the recurrence wouldn\'t even be well-defined). This is exactly why interval DP must iterate by increasing interval length rather than row/column index: only that order guarantees every sub-interval a state depends on has strictly smaller length and was therefore already computed and already correct.',
  ],
  recognitionSignals: [
    '"Maximum/minimum subsequence... no two adjacent" or "at most k apart" on a single array → 1D linear DP.',
    'Given two strings, "find the longest common..." or "minimum number of edits/operations to convert one into the other" → 2D LCS-family DP.',
    '"In how many distinct ways can you make amount X" using a reusable set of coins/items → unbounded knapsack.',
    '"Choose a subset that sums to exactly X," each item usable at most once → 0/1 knapsack.',
    'Brute-force recursion visibly recomputes the same sub-call many times (an exponential recursion tree with repeated arguments) — that overlap is the literal definition of when memoization pays off.',
  ],
  complexity: 'Time and space vary by family: 1D linear DP is O(n) time, O(1) space after rolling-array optimization. 0/1 and unbounded knapsack are O(n·W) time and space (W = capacity or target amount), often reducible to O(W) space. LCS/Edit Distance are O(m·n) time and space, reducible to O(min(m,n)) space by keeping only the previous row. Interval DP is O(n²) states with an O(n) transition per state → O(n³) time, O(n²) space.',
  canonical: {
    name: 'House Robber (LeetCode 198)',
    statement: 'You are a professional robber planning to rob houses along a street. Each house has a nonnegative amount of money, and adjacent houses have connected security systems that will automatically alert the police if two adjacent houses are robbed on the same night. Given an integer array nums representing the money in each house, return the maximum amount of money you can rob without robbing two adjacent houses.',
  },
  story: {
    onePiece: {
      title: 'Nami\'s cheapest route through the Grand Line, locked by the Log Pose',
      text: [
        'Nami plots the crew\'s route island by island, and she never redoes work she\'s already finished: once she\'s worked out the cheapest way to reach island B from Reverse Mountain, that answer is locked in — when she\'s figuring out the best route to island C, she just reuses "cheapest to reach B" as a building block instead of re-deriving every possible sub-route from scratch. That\'s optimal substructure and overlapping subproblems in one habit: the best route to C is built directly out of the best routes to whatever islands come immediately before it, and there\'s no reason to recompute those every time they come up again.',
        'The Log Pose is what makes this legal in the first place. It locks onto the next island\'s magnetic field and physically won\'t let the ship sail backward against its pull — you\'re forced into a fixed forward order, island by island, with no doubling back. That constraint is exactly what a DP fill order needs: you can only trust "cheapest route to C" once every route it depends on has already been computed, which means the Log Pose\'s one-way lock is the sea-going version of "iterate the table in dependency order."',
      ],
    },
    history: {
      title: 'Richard Bellman and the RAND Corporation, 1950s',
      text: [
        'This one is real, documented history, not a stretched analogy: Richard Bellman coined the actual term "dynamic programming" in the 1950s while working at the RAND Corporation on multistage decision and resource-allocation problems, including missile-defense trajectory optimization. He later wrote candidly that he chose the word "dynamic" partly because it sounded impressive and was hard for politically hostile superiors to object to funding, since it had nothing to do with programming computers in the modern sense — "programming" at the time meant something closer to "planning" or "scheduling," as in a military program. The technique itself — breaking a multistage decision problem into overlapping subproblems solved once and reused — is exactly what shows up in every DP table you\'ve ever filled in.',
      ],
    },
    why: 'Nami\'s route gives a mechanical, causal reason to feel optimal substructure — you can picture the specific reused sub-route — while Bellman\'s real story anchors why the technique is called that to an actual person under actual bureaucratic pressure, which tends to stick better than memorizing "dynamic programming" as an arbitrary label.',
  },
  tricks: [
    {
      name: 'House Robber: guard the dp array\'s base cases before reading dp[i-2]',
      idea: 'The general transition dp[i] = max(dp[i-1], dp[i-2] + nums[i]) is only valid once i-2 is a real index. Applying it uniformly starting at i=0 doesn\'t crash in Python — negative indices silently wrap around and read from the end of the array — it just silently returns a wrong answer built from garbage.',
      before:
`def rob(nums):
    n = len(nums)
    dp = [0] * n
    for i in range(n):
        dp[i] = max(dp[i - 1], dp[i - 2] + nums[i])  # BUG: dp[-1], dp[-2] wrap around silently at i=0, i=1
    return dp[-1] if n else 0`,
      after:
`def rob(nums):
    n = len(nums)
    if n == 0:
        return 0
    if n == 1:
        return nums[0]
    dp = [0] * n
    dp[0] = nums[0]
    dp[1] = max(nums[0], nums[1])
    for i in range(2, n):
        dp[i] = max(dp[i - 1], dp[i - 2] + nums[i])
    return dp[-1]`,
      explain: 'Python allows negative indices instead of raising an IndexError, so dp[-1] and dp[-2] at i=0 quietly read the (currently-zeroed) tail of the array rather than crashing — the bug produces a plausible-looking wrong number instead of an obvious failure. Explicitly seeding dp[0] and dp[1] before the general loop starts at i=2 is what actually enforces the precondition the recurrence assumes.',
    },
    {
      name: '0/1 knapsack space-optimized to 1D: iterate capacity backward, or items get reused',
      idea: 'Collapsing the 2D 0/1 knapsack table to a rolling 1D array over capacity only stays 0/1 (each item used at most once) if the capacity loop runs backward within each item\'s pass; forward iteration lets the same item feed into itself later in the same pass, silently turning it into unbounded knapsack.',
      before:
`def can_partition(nums):
    total = sum(nums)
    if total % 2:
        return False
    target = total // 2
    dp = [False] * (target + 1)
    dp[0] = True
    for num in nums:
        for w in range(num, target + 1):        # BUG: forward — reuses \`num\` multiple times in one pass
            dp[w] = dp[w] or dp[w - num]
    return dp[target]`,
      after:
`def can_partition(nums):
    total = sum(nums)
    if total % 2:
        return False
    target = total // 2
    dp = [False] * (target + 1)
    dp[0] = True
    for num in nums:
        for w in range(target, num - 1, -1):     # backward: each item contributes at most once per pass
            dp[w] = dp[w] or dp[w - num]
    return dp[target]`,
      explain: 'Iterating w forward means dp[w - num] may already reflect this same num having been added earlier in the same inner loop, i.e. the item gets counted twice — exactly the unbounded-knapsack update rule (Coin Change uses this forward direction on purpose). Iterating backward guarantees dp[w - num] still reflects only the previous item\'s pass, preserving the "used at most once" invariant that Partition Equal Subset Sum requires.',
    },
  ],
  variants: [
    {
      company: 'Google-style',
      title: 'House Robber II — houses in a circle (LeetCode 213)',
      twist: 'Houses are arranged in a circle, so the first and last house are also adjacent. A single linear DP pass can\'t natively express that wrap-around constraint. The fix: run the exact same linear House Robber DP twice — once over nums[0:n-1] (excluding the last house) and once over nums[1:n] (excluding the first) — and take the max of the two results, since any valid circular selection must exclude at least one of house 0 or house n-1.',
    },
    {
      company: 'Meta-style',
      title: 'Edit Distance — the LCS family with three-way transitions (LeetCode 72)',
      twist: 'Given two strings, find the minimum number of insert/delete/replace operations to convert one into the other. This extends the 2-string DP template from LCS\'s simple "characters match → extend diagonally, else take the better of two skips" into a three-way minimum: dp[i][j] = dp[i-1][j-1] if the characters match, else 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) (delete, insert, replace respectively). Interviewers use this to check whether you can extend a memorized template rather than just reciting it.',
    },
    {
      company: 'Amazon-style',
      title: 'Coin Change — minimum coins, unbounded knapsack (LeetCode 322)',
      twist: 'Must return -1 if the amount is unreachable, which means initializing the dp array to a sentinel larger than any real answer (amount + 1, or infinity) rather than 0 — 0 would look like "already solved," corrupting every downstream min() comparison. The loop order also matters: iterating amounts forward while allowing each coin to be reconsidered (unbounded reuse) is what distinguishes this from 0/1 knapsack\'s backward-iteration trick.',
    },
    {
      company: 'Microsoft-style',
      title: 'Reconstruct the actual sequence, not just its length',
      twist: 'A common combined follow-up on top of any DP problem here (e.g. "return the actual longest common subsequence string, not just its length," or "return one path achieving the minimum path sum"): requires storing a parent/choice table alongside the numeric dp table during the fill, then backtracking from the final cell to the base case following the recorded choices — the plain numeric dp values alone don\'t retain "how did we get here."',
    },
  ],
  pythonSolution: {
    title: 'House Robber (O(1) space, rolling variables)',
    code:
`def rob(nums: list[int]) -> int:
    prev, curr = 0, 0
    for n in nums:
        prev, curr = curr, max(curr, prev + n)
    return curr`,
    notes: [
      '<code>prev, curr = curr, max(curr, prev + n)</code> updates both rolling variables in one tuple assignment — the idiomatic Python way to express "new state derived from old state" without a temporary variable or clobbering one before the other is read.',
      'Starting both <code>prev</code> and <code>curr</code> at 0 handles an empty <code>nums</code> list for free (the loop simply never runs, returning 0) — no special-case branch needed for n=0.',
      'This is the tabulation version already collapsed to O(1) space; the equivalent top-down version would be <code>@functools.lru_cache(maxsize=None)</code> over <code>rob_from(i) = max(rob_from(i+1), nums[i] + rob_from(i+2))</code>, trading the O(1) space here for O(n) call-stack depth and automatic memoization.',
      'Iterating <code>for n in nums</code> directly (not <code>for i in range(len(nums))</code>) is preferred since the transition never needs the index itself, only the running values — index-based loops should be reserved for when you actually need <code>i</code>.',
    ],
  },
  pitfalls: [
    'Off-by-one on dp array sizing — allocating <code>dp = [0] * len(nums)</code> and then reading <code>dp[i-2]</code> at <code>i = 0</code> or <code>i = 1</code> without guarding; in Python this doesn\'t crash, it silently wraps to a negative index and reads garbage from the end of the array instead of raising an error.',
    'Forgetting the base cases for n=0 (empty input → 0) and n=1 (single house → nums[0]) and assuming the general transition dp[i] = max(dp[i-1], dp[i-2] + nums[i]) can be applied uniformly starting from i=0.',
    '0/1 knapsack space-optimized to a 1D array: iterating the capacity loop forward instead of backward, which lets a single item be counted multiple times within the same item\'s pass — silently turns 0/1 knapsack into unbounded knapsack and overcounts.',
    'Memoizing with a mutable default argument or a plain module-level dict shared across calls/test cases instead of <code>functools.lru_cache</code> scoped to a fresh function — stale cache entries from a previous test case silently corrupt the next one.',
  ],
  viz: {
    type: 'array',
    initialArray: [2, 7, 9, 3, 1],
    steps: [
      { arrayOverride: [2, '?', '?', '?', '?'], highlights: { 0: 'a' }, pointers: { i: 0 }, vars: { dp: '[2]' }, message: 'Base case: dp[0] = nums[0] = 2 — with only one house, just rob it.' },
      { arrayOverride: [2, 7, '?', '?', '?'], highlights: { 0: 'c', 1: 'a' }, pointers: { i: 1 }, vars: { dp: '[2, 7]' }, message: 'Base case: dp[1] = max(nums[0], nums[1]) = max(2, 7) = 7 — with two houses, rob the richer one.' },
      { arrayOverride: [2, 7, 11, '?', '?'], highlights: { 0: 'b', 1: 'b', 2: 'a' }, pointers: { i: 2 }, vars: { dp: '[2, 7, 11]', transition: 'max(dp[1]=7, dp[0]+nums[2]=2+9=11) = 11' }, message: 'dp[2] = max(dp[1], dp[0] + nums[2]) = max(7, 11) = 11 — robbing house 2 and adding it to dp[0] beats skipping it.' },
      { arrayOverride: [2, 7, 11, 11, '?'], highlights: { 1: 'b', 2: 'b', 3: 'a' }, pointers: { i: 3 }, vars: { dp: '[2, 7, 11, 11]', transition: 'max(dp[2]=11, dp[1]+nums[3]=7+3=10) = 11' }, message: 'dp[3] = max(dp[2], dp[1] + nums[3]) = max(11, 10) = 11 — skipping house 3 (keeping dp[2]) is at least as good as robbing it.' },
      { arrayOverride: [2, 7, 11, 11, 12], highlights: { 2: 'b', 3: 'b', 4: 'a' }, pointers: { i: 4 }, vars: { dp: '[2, 7, 11, 11, 12]', transition: 'max(dp[3]=11, dp[2]+nums[4]=11+1=12) = 12' }, message: 'dp[4] = max(dp[3], dp[2] + nums[4]) = max(11, 12) = 12 — this time robbing house 4 (plus dp[2]) wins.' },
      { arrayOverride: [2, 7, 11, 11, 12], highlights: { 4: 'c' }, pointers: {}, vars: { dp: '[2, 7, 11, 11, 12]', answer: 12 }, message: 'dp[n-1] holds the answer: maximum loot with no two adjacent houses robbed is 12 (houses at indices 0, 2, 4: 2+9+1=12).' },
    ],
  },
  quiz: [
    {
      q: 'A problem says: "given an array, find the maximum sum of a subsequence with no two adjacent elements chosen." What state/transition should you reach for?',
      options: [
        'dp[i][j] over two indices into two different arrays',
        'dp[i] = best answer considering only the first i elements, with dp[i] = max(dp[i-1], dp[i-2] + nums[i])',
        'A single greedy pass with no dp array at all',
        'dp[i] = dp[i-1] * nums[i]',
      ],
      correct: 1,
      explain: 'A single array with an adjacency constraint is the signature of 1D linear DP, where each state depends on a constant number of previous states (here, the previous one or two).',
    },
    {
      q: 'What is the main practical tradeoff between top-down memoization and bottom-up tabulation?',
      options: [
        'They always have identical time and space complexity, with no tradeoffs',
        'Top-down mirrors the recurrence directly and only computes states actually reached by the recursion, but risks recursion-depth limits and call overhead; bottom-up iterates in dependency order, avoiding recursion overhead and enabling rolling-array space optimization',
        'Bottom-up is always slower because it computes unnecessary states',
        'Top-down cannot be implemented in Python',
      ],
      correct: 1,
      explain: 'Both compute the same recurrence, but top-down is often faster to derive correctly (it follows the recursive definition literally) while bottom-up gives you explicit control over iteration order, which is what enables collapsing a table to O(1) or O(n) space.',
    },
    {
      q: 'In the House Robber recurrence dp[i] = max(dp[i-1], dp[i-2] + nums[i]), what does dp[i] represent?',
      options: [
        'The amount of money in house i',
        'The maximum loot obtainable considering only houses 0..i, honoring the no-two-adjacent constraint',
        'Whether house i was robbed (a boolean)',
        'The total number of houses robbed so far',
      ],
      correct: 1,
      explain: 'The state must summarize "the best achievable answer up to this point," not a single input value — dp[i] is the answer to the subproblem restricted to the first i+1 houses.',
    },
    {
      q: 'A problem gives you two strings and asks for the length of their longest common subsequence. What DP shape should you expect?',
      options: [
        'A 1D dp array of length max(m, n)',
        '2D dp[i][j] over one index into each string, since the state must capture progress through both independently',
        'No DP needed — sort both strings and compare',
        'A single running XOR accumulator',
      ],
      correct: 1,
      explain: 'Whenever a problem compares or interleaves two separate sequences, the state generally needs one index per sequence — that\'s the recognizable jump from 1D to 2D DP.',
    },
    {
      q: 'In Coin Change (unbounded knapsack, minimum coins), why initialize the dp array to amount + 1 (or infinity) instead of 0?',
      options: [
        'It\'s an arbitrary convention with no functional purpose',
        '0 would look like "already solved with 0 coins" for every amount, corrupting every subsequent min() comparison — the sentinel must exceed any real answer so genuine solutions always win the comparison',
        'It avoids integer overflow in Python',
        'It only affects readability; any initial value works identically',
      ],
      correct: 1,
      explain: 'A DP "unreachable" sentinel must never accidentally look like a valid, better answer. Using 0 as the sentinel would make every min(dp[x], ...) comparison favor the fake "0 coins" value over any real solution.',
    },
    {
      q: 'Why does House Robber II (circular street, LeetCode 213) require running the linear House Robber logic twice instead of once?',
      options: [
        'Because circular arrays can\'t be handled by DP at all, only by greedy algorithms',
        'Because the wrap-around adjacency between the first and last house can\'t be expressed in one linear dp pass — splitting into two runs (excluding house 0, and excluding house n-1) reduces it back to two independent linear subproblems, then take the max',
        'Because the array must be reversed and re-scanned for correctness',
        'Because dp[i] needs three previous states instead of two in a circular array',
      ],
      correct: 1,
      explain: 'The circular constraint only affects the single pair (house 0, house n-1). Excluding either endpoint from consideration removes the wrap-around edge entirely, turning the problem back into two ordinary linear House Robber instances.',
    },
  ],
};
