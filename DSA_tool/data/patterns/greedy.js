window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['greedy'] = {
  id: 'greedy',
  title: 'Greedy Algorithms',
  category: 'Optimization Patterns',
  timeMin: 12,
  summary: 'Make the locally optimal choice at each step, never reconsidering earlier decisions, and prove that this choice never prevents an optimal overall solution.',
  concept: [
    'A greedy algorithm commits to one choice per step based only on the current state, with no backtracking and no exploring alternatives. This is fast (usually a single O(n) or O(n log n) pass) but only correct when the problem has the <b>greedy-choice property</b>: some locally optimal choice is guaranteed to be part of some globally optimal solution. Many problems that "look greedy" — most famously 0/1 knapsack — do not have this property, and a greedy heuristic there simply produces a wrong answer with no warning.',
    'The standard way to justify greedy correctness in an interview is an <b>exchange argument</b>: take any hypothetical optimal solution, find the first point where it diverges from what greedy would choose, and show you can swap that choice for the greedy one without making the solution any worse (often making it strictly better or leaving it unchanged). Applying this inductively along the whole solution shows greedy is at least as good as any optimum, hence itself optimal. If you cannot construct such an argument — or worse, you can construct a concrete counterexample where a different local choice does strictly better — that\'s the signal to fall back to DP, which explores all choices instead of committing to one.',
    'For Jump Game specifically: tracking "farthest index reachable so far" and updating it with <code>max(farthest, i + nums[i])</code> at every position is safe because farthest is monotonically non-decreasing and dominates any specific path that achieves it — you never need to know <i>which</i> sequence of jumps got you there, only how far you can now go, so there is nothing to undo or reconsider. That monotonic-dominance property is exactly the greedy-choice property for this problem, and is worth stating explicitly if asked to justify the approach.',
    'The correctness of the Jump Game\'s greedy rule can be proven directly by induction on i, without any hand-wavy "clearly the farthest reach is the best we can do": the invariant is "farthest, after processing index i, equals the true maximum index reachable using only jumps that start at indices ≤ i." The base case (i=0) holds by definition. For the inductive step, assume the invariant holds after processing i-1; index i is only usable at all if i ≤ farthest (otherwise no reachable index chains into it), and if it is usable, the best it can contribute is i + nums[i], so farthest = max(farthest, i + nums[i]) is exactly the true reachable maximum after also considering index i — never an overestimate, because you only ever extend reachability from indices already proven reachable, and never an underestimate, because every usable index\'s contribution is folded in via max(). The greedy-choice property here isn\'t assumed, it falls directly out of this invariant.',
  ],
  recognitionSignals: [
    '"At each step, choose the ... that ..." phrasing, or a problem solvable by sorting once and then making a single forward pass (interval scheduling, activity selection).',
    'Asks for feasibility ("can you reach...", "is it possible to...") rather than counting all ways or enumerating solutions — feasibility questions often collapse to a single running aggregate.',
    'A brute-force or DP solution technically works, but a single forward/backward scan tracking one running value (max reach, min cost so far, running balance) also produces the correct answer — a strong signal DP is unnecessary overhead.',
    'You can articulate "if a better/cheaper/farther choice is available right now, taking it never hurts later" without finding a counterexample — the exchange argument applies cleanly.',
  ],
  complexity: 'Time: O(n) for a single pass, or O(n log n) if a sort is required first (interval/activity-selection style problems). Space: O(1) — greedy typically needs only a constant number of running variables, no table.',
  canonical: {
    name: 'Jump Game (LeetCode 55)',
    statement: 'Given an array of non-negative integers nums, you start at index 0. Each element nums[i] represents the maximum jump length from that position. Determine whether you can reach the last index of the array.',
  },
  story: {
    onePiece: {
      title: 'Buggy\'s circus, and the greedy act that finishes soonest wins the slot',
      text: [
        'Buggy\'s traveling circus has more acts wanting a slot than the day has room for, and every act insists its performance is the one that deserves the stage — Buggy doesn\'t referee that argument. To fit the maximum number of acts into one day, he only ever asks one question of whatever\'s left: which act, among the ones that don\'t conflict with what\'s already locked in, finishes soonest? He commits to that one and moves on, never reconsidering, never trying to sneak in the "best" act first.',
        'It feels reckless — surely the flashiest act deserves priority — but that instinct is provably wrong. An act chosen only for being exciting might run long and block two shorter acts that could both have fit in the same window. Picking whichever act frees up the stage earliest, every single time, is what actually maximizes how many acts get performed — exactly the activity-selection greedy rule, and exactly why "finishes soonest" beats "looks best" as a scheduling criterion.',
      ],
    },
    history: {
      title: 'David Huffman, 1952',
      text: [
        'This is real computer science history: in 1952, David Huffman (then a student) devised an algorithm for optimal prefix-free binary codes by always merging the two lowest-frequency nodes into a single new node and repeating the process until one tree remains. It\'s a purely greedy, local rule — smallest two, every time, no lookahead — and it\'s provably globally optimal, verified by an exchange argument almost identical in structure to the one used for interval scheduling: swapping any other pairing for the smallest-two choice at the first point of difference never produces a shorter encoding.',
      ],
    },
    why: 'Buggy\'s stage-slot problem gives interval scheduling a concrete, visualizable reason "finishing soonest" wins, while Huffman\'s real 1952 algorithm shows the same greedy-plus-exchange-argument structure earning a provable global optimum in an entirely different domain — two data points that make clear the underlying proof technique isn\'t specific to one problem.',
  },
  tricks: [
    {
      name: 'Jump Game: `>=`, not `>`, when checking if the last index is reached',
      idea: 'Requiring the farthest reach to overshoot the last index instead of merely reach it rejects the single most common way to succeed: landing exactly on it.',
      before:
`def can_jump(nums):
    farthest = 0
    for i, step in enumerate(nums):
        if i > farthest:
            return False
        farthest = max(farthest, i + step)
        if farthest > len(nums) - 1:   # BUG: rejects landing exactly on the last index
            return True
    return True`,
      after:
`def can_jump(nums):
    farthest = 0
    for i, step in enumerate(nums):
        if i > farthest:
            return False
        farthest = max(farthest, i + step)
        if farthest >= len(nums) - 1:   # landing exactly on the last index is success
            return True
    return True`,
      explain: '`farthest > len(nums) - 1` demands overshooting the last index, so a farthest reach that lands exactly on it gets missed and the loop keeps scanning past a case that was already solved. The fix is a one-character change, but it\'s the kind of boundary bug that passes every test case with slack past the target and fails only on the tight ones.',
    },
    {
      name: 'Check `i > farthest` before updating farthest, not after',
      idea: 'Updating farthest with nums[i] before confirming i itself is reachable lets an unreachable index illegitimately extend reachability, producing a false positive instead of correctly returning False.',
      before:
`def can_jump(nums):
    farthest = 0
    for i, step in enumerate(nums):
        farthest = max(farthest, i + step)   # BUG: extends reachability using an index not yet proven reachable
        if i > farthest:
            return False
        if farthest >= len(nums) - 1:
            return True
    return True`,
      after:
`def can_jump(nums):
    farthest = 0
    for i, step in enumerate(nums):
        if i > farthest:          # check reachability of i BEFORE trusting nums[i]
            return False
        farthest = max(farthest, i + step)
        if farthest >= len(nums) - 1:
            return True
    return True`,
      explain: 'If index i is actually unreachable (i > farthest) but you update farthest using nums[i] anyway, you\'re pretending the algorithm stood at an index it never legitimately reached — silently fabricating reachability instead of correctly returning False. The check must gate the update, not follow it; swapping the two lines produces false positives on inputs with an early zero that should have ended the scan.',
    },
  ],
  variants: [
    {
      company: 'Google-style',
      title: 'Jump Game II — minimum number of jumps (LeetCode 45)',
      twist: 'Now asks for the minimum number of jumps to reach the end, not just feasibility. Greedy still applies, but you track two variables instead of one: the current jump\'s farthest reach so far, and the farthest reach seen anywhere within the current jump\'s window — incrementing a jump counter every time you exhaust the current window and advance to the next one. This is a "greedy scan by levels," structurally closer to BFS-by-frontier than to the single farthest-pointer scan in Jump Game I.',
    },
    {
      company: 'Meta-style',
      title: 'Gas Station (LeetCode 134)',
      twist: 'Find the starting gas station index from which a circular route can be completed exactly once, given per-station gas gained and cost to the next station. The exchange argument here is subtler: if total gas ≥ total cost overall, a valid start is guaranteed to exist, and any station where the running tank first goes negative can be eliminated as a candidate start — along with every station between the previous reset point and that failure point — because starting from any of them would fail at the same or an earlier point. Proving that "every station up to the failure point also fails" is the crux of the correctness argument.',
      },
    {
      company: 'Amazon-style',
      title: 'Interval Scheduling Maximization (maximum non-overlapping intervals)',
      twist: 'Given a set of intervals, select the maximum number that don\'t overlap. The greedy choice is "always pick the interval that finishes earliest among those still compatible," which requires sorting by end time first (so the O(n log n) sort dominates the O(n) scan). The correctness proof is the textbook exchange argument: given any optimal schedule, swapping in the earliest-finishing compatible candidate at the first point of difference cannot make the schedule worse, because it frees up at least as much room for subsequent choices.',
    },
  ],
  pythonSolution: {
    title: 'Jump Game',
    code:
`def can_jump(nums: list[int]) -> bool:
    farthest = 0
    for i, step in enumerate(nums):
        if i > farthest:
            return False
        farthest = max(farthest, i + step)
        if farthest >= len(nums) - 1:
            return True
    return True`,
    notes: [
      '<code>enumerate(nums)</code> again pairs index and value without a manual counter, the idiomatic default whenever both are needed.',
      'The early <code>return True</code> the moment <code>farthest >= len(nums) - 1</code> avoids scanning the rest of the array — a direct expression of "greedy commits and never looks back."',
      'The <code>i > farthest</code> check must run <i>before</i> updating <code>farthest</code> with the current index\'s jump value — otherwise you\'d use an index you could never actually reach to illegitimately extend reachability.',
      'The trailing <code>return True</code> after the loop covers a single-element array (start index already equals the last index) without a special-case branch.',
    ],
  },
  pitfalls: [
    'Using <code>farthest > len(nums) - 1</code> instead of <code>>=</code>, which incorrectly rejects the exact boundary case where the farthest reach lands precisely on the last index.',
    'Updating <code>farthest</code> before checking <code>i > farthest</code> — this lets a jump value from an index you could never actually reach illegitimately extend reachability, silently producing false positives.',
    'Assuming greedy applies to any "maximize/minimize" phrasing — 0/1 Knapsack looks superficially similar to interval scheduling but greedy (by value/weight ratio) is provably wrong there; only DP explores enough of the choice space to get the right answer.',
    'In Gas Station-style variants, resetting the running tank/candidate start on every local negative dip instead of only when the cumulative tank from the current candidate start goes negative — this breaks the single O(n) pass and can skip over the true valid start.',
  ],
  viz: {
    type: 'array',
    initialArray: [2, 3, 1, 1, 4],
    steps: [
      { highlights: { 0: 'a' }, pointers: { i: 0 }, vars: { farthest: 0 }, message: 'Start: farthest=0 (only index 0 reached so far). Check i=0 ≤ farthest=0 → still reachable.' },
      { highlights: { 0: 'c' }, pointers: { i: 0 }, vars: { farthest: 2 }, message: 'From index 0 (value 2): farthest = max(0, 0+2) = 2.' },
      { highlights: { 1: 'a' }, pointers: { i: 1 }, vars: { farthest: 2 }, message: 'i=1 ≤ farthest=2 → index 1 is reachable, continue.' },
      { highlights: { 1: 'c' }, pointers: { i: 1 }, vars: { farthest: 4 }, message: 'From index 1 (value 3): farthest = max(2, 1+3) = 4 — this already reaches the last index (4)!' },
      { highlights: { 4: 'c' }, pointers: {}, vars: { farthest: 4, answer: 'True' }, message: 'farthest=4 ≥ last index (4) → return True immediately, without even examining indices 2, 3, or 4.' },
    ],
  },
  quiz: [
    {
      q: 'Which observation should make you suspect a greedy approach over dynamic programming?',
      options: [
        'The problem asks to count all distinct ways to reach a target',
        'A single forward pass tracking one running aggregate (e.g. farthest reach, min cost so far) provably reproduces the optimal answer, with no need to reconsider earlier choices',
        'The recurrence has overlapping subproblems best solved with memoization',
        'The input must be processed in reverse using a stack',
      ],
      correct: 1,
      explain: 'Greedy is appropriate exactly when committing to one choice per step, without revisiting it, is provably sufficient — a single running aggregate that never needs correction is the tell.',
    },
    {
      q: 'What is an "exchange argument," the standard way to justify a greedy algorithm\'s correctness in an interview?',
      options: [
        'Randomly swapping array elements until the answer improves',
        'Showing that any optimal solution can be modified, without making it worse, to match the greedy choice at the first point of difference — implying greedy is at least as good as any optimum',
        'Proving the problem is NP-hard so greedy is the best achievable approach',
        'Replacing the greedy algorithm with a DP algorithm once greedy fails',
      ],
      correct: 1,
      explain: 'The exchange argument is an inductive proof technique: at the first divergence between an assumed-optimal solution and the greedy choice, swapping in the greedy choice cannot make things worse, so by induction greedy matches or beats any optimum.',
    },
    {
      q: 'In the Jump Game solution, why must the check `i > farthest` happen before updating `farthest` with `nums[i]`?',
      options: [
        'It doesn\'t matter — the order is irrelevant',
        'Using index i\'s jump value to extend reachability is only valid if i itself is actually reachable — checking after the update would let an unreachable index illegitimately extend farthest',
        'It\'s required to avoid an IndexError',
        'It changes the time complexity from O(n) to O(n log n)',
      ],
      correct: 1,
      explain: 'If i were unreachable (i > farthest) but you still applied its jump value, you\'d be pretending you stood at an index you never actually got to — a subtle correctness bug, not a crash, so it\'s easy to miss with weak test cases.',
    },
    {
      q: 'Jump Game II (minimum number of jumps) still uses a greedy approach, but tracks more state than Jump Game I (feasibility only). What\'s the key difference?',
      options: [
        'It requires sorting the array first',
        'It tracks both the current jump\'s farthest reach and the farthest reach seen while scanning that jump\'s window, incrementing a jump counter each time the window is exhausted — a level-by-level greedy scan',
        'It needs a hash map to detect cycles',
        'It\'s identical code, just with a different return type',
      ],
      correct: 1,
      explain: 'Counting jumps requires knowing when you\'ve exhausted the current jump\'s reachable window and must commit to the next jump — that "advance to next level" bookkeeping is the added state beyond Jump Game I\'s single farthest pointer.',
    },
    {
      q: 'Why does a naive greedy (always pick the item with the best value/weight ratio) fail for 0/1 Knapsack but work for the fractional knapsack variant?',
      options: [
        'Greedy never actually works for any knapsack-style problem',
        '0/1 knapsack forces all-or-nothing choices per item, so a locally best ratio can block a better combination later and no exchange argument holds; fractional knapsack allows partial items, which restores the greedy-choice property',
        '0/1 knapsack is always solvable in O(1) time, making greedy unnecessary',
        'Fractional knapsack also requires DP; the two behave identically',
      ],
      correct: 1,
      explain: 'Fractional knapsack lets you take any fraction of an item, so always filling with the best available ratio is provably optimal. 0/1 knapsack\'s all-or-nothing constraint breaks that guarantee — a concrete counterexample is easy to construct — which is exactly why it needs DP instead.',
    },
  ],
};
