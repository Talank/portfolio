window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['backtracking'] = {
  id: 'backtracking',
  title: 'Backtracking',
  category: 'Trees & Graphs',
  timeMin: 15,
  summary: 'Systematically enumerate all valid configurations by making a choice, recursing, then explicitly undoing the choice before trying the next one — DFS over an implicit decision tree.',
  concept: [
    'Backtracking is DFS over an implicit tree of choices, where the defining move is the <b>undo</b>: after recursing into a choice, you revert the shared state (typically <code>path.append(x)</code> before the recursive call, <code>path.pop()</code> after it returns) before trying the next sibling choice at that level. Without the undo, sibling branches would see stale state from a previous branch — this is what separates backtracking from plain unconditional recursion.',
    'State should be mutated in place and restored, not rebuilt via fresh copies at every recursive call — that keeps each step O(1) instead of O(n). The one place you *do* need a copy is when recording a result: <code>res.append(path[:])</code>, never <code>res.append(path)</code>, because <code>path</code> is a single mutable object that every future backtrack step will keep changing.',
    '<b>Pruning</b> — cutting a branch early once it provably can\'t lead to a valid answer (remaining candidates fewer than still-needed count, running sum already exceeds target, etc.) — is what makes backtracking practical. It doesn\'t change the worst-case asymptotic ceiling (still O(2ⁿ) for subsets, O(n!) for permutations), but it\'s frequently the difference between a solution that finishes and one that times out on real inputs.',
  ],
  recognitionSignals: [
    '"Generate all subsets/permutations/combinations", "find all ways to...", "return all valid arrangements" — phrasing asking for every valid configuration, not just one optimal value.',
    'Constraint-satisfaction problems where choices are made one at a time and can be undone: N-Queens, Sudoku solving, word search on a grid, generating valid parentheses.',
    'Brute force is inherently exponential (2ⁿ subsets, n! permutations) — backtracking is the systematic, correct way to enumerate that space, using pruning to cut dead branches early rather than changing the asymptotic ceiling.',
    'Distinguish from Dynamic Programming: DP fits when overlapping subproblems let you reuse one optimal value/count per subproblem; backtracking fits when you need every distinct valid configuration (or any one satisfying answer), and there usually isn\'t reusable overlapping substructure to memoize.',
  ],
  complexity: 'Time: O(2ⁿ) for subsets (each element independently in/out), O(n!) for permutations, generally O(branches^depth) — pruning improves the practical constant but rarely the worst-case bound. Space: O(n) for the recursion stack and current path, plus O(2ⁿ · n) or O(n! · n) if materializing every result.',
  canonical: {
    name: 'Subsets (LeetCode 78)',
    statement: 'Given an integer array nums of unique elements, return all possible subsets (the power set), with no duplicate subsets, in any order.',
  },
  variants: [
    {
      company: 'Meta-style',
      title: 'Subsets II (LC 90) — nums may contain duplicates',
      twist: 'Sort nums first, then at each recursion level skip <code>nums[i] == nums[i-1] when i > start</code> to avoid generating the same subset twice. The condition is specifically "i > start," not "i > 0" — two equal values are allowed to both appear together in the same branch (one directly following the other via recursion), the skip only prevents *re-starting* an identical branch at the same recursion level.',
    },
    {
      company: 'Google-style',
      title: 'Permutations (LC 46)',
      twist: 'The bookkeeping flips from an index-based <code>start</code> cursor to a <code>used[]</code> boolean array (or a "remaining elements" collection), because every recursion level must consider all not-yet-used indices, not just indices ahead of a cursor — subsets never revisit earlier indices, but permutations must be able to place any unused element at any position. This changes the shape of the recursion tree: depth-n branching from a shrinking *set* of remaining choices, not a shrinking *suffix*.',
    },
    {
      company: 'Amazon-style',
      title: 'Combination Sum (LC 39) — elements reusable',
      twist: 'Elements can be reused an unlimited number of times, so the recursive call passes <code>start</code> (not <code>i + 1</code>) when including an element, allowing the same index to be chosen again. This requires an explicit pruning condition — sort candidates first and stop recursing once the running sum exceeds the target — otherwise reusing the same element indefinitely with no stopping condition on sum would recurse forever instead of just being slow.',
    },
  ],
  pythonSolution: {
    title: 'Subsets',
    code:
`def subsets(nums):
    res = []
    path = []

    def backtrack(start):
        res.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1)
            path.pop()

    backtrack(0)
    return res`,
    notes: [
      '<code>res.append(path[:])</code> copies the list at the moment of recording — <code>path</code> keeps mutating after this call, so appending the live reference instead would leave every recorded subset pointing at the same, later-changed list.',
      'The loop bound <code>range(start, len(nums))</code> combined with recursing on <code>i + 1</code> is what prevents both duplicate subsets and reuse of an already-included element — each recursive call only considers indices strictly after the one just added.',
      '<code>path.append(...)</code> / <code>path.pop()</code> bracketing the recursive call is the canonical backtracking idiom: mutate shared state in place before recursing, restore it immediately after, so sibling iterations of the same loop never see stale state from a previous branch.',
      'Recording the result (<code>res.append(path[:])</code>) unconditionally at the top of <code>backtrack</code>, before the loop, is what captures every prefix (including the empty subset on the very first call) without a separate base case.',
    ],
  },
  pitfalls: [
    'Appending the live <code>path</code> reference into the results list instead of a copy (<code>res.append(path)</code> instead of <code>res.append(path[:])</code>) — every subsequent mutation of <code>path</code> retroactively corrupts every previously recorded result, since they all alias the same list object.',
    'Forgetting the <code>path.pop()</code> after the recursive call returns — leaves stale elements in the shared path for sibling branches at that recursion level, corrupting every subset generated afterward.',
    'For "subsets/combinations with duplicate input values," omitting the sort-then-skip-adjacent-duplicates step (<code>if i > start and nums[i] == nums[i-1]: continue</code>) — produces duplicate subsets in the output that the problem explicitly disallows.',
    'Confusing the recursive start index between variants: <code>i + 1</code> (element used at most once, as in Subsets) versus <code>i</code> (element may be reused, as in Combination Sum) — using the wrong one either silently omits valid combinations or, in the reusable-element case, causes unbounded recursion without a separate sum-based pruning condition.',
  ],
  viz: {
    type: 'array',
    initialArray: [1, 2, 3],
    steps: [
      { highlights: {}, pointers: {}, vars: { current: '[]', found: 1 }, message: "Call backtrack(start=0) with an empty path → record subset []. The empty set is always the first result." },
      { highlights: { 0: 'a' }, pointers: { i: 0 }, vars: { current: '[1]', found: 2 }, message: "i=0: include nums[0]=1 → path=[1]. Record subset [1]. Recurse with start=1." },
      { highlights: { 0: 'a', 1: 'a' }, pointers: { i: 1 }, vars: { current: '[1,2]', found: 3 }, message: "i=1: include nums[1]=2 → path=[1,2]. Record subset [1,2]. Recurse with start=2." },
      { highlights: { 0: 'a', 1: 'a', 2: 'a' }, pointers: { i: 2 }, vars: { current: '[1,2,3]', found: 4 }, message: "i=2: include nums[2]=3 → path=[1,2,3]. Record subset [1,2,3]. Recurse with start=3 — range(3,3) is empty, so this call returns immediately." },
      { highlights: { 0: 'a', 1: 'bad', 2: 'bad' }, pointers: {}, vars: { current: '[1]', found: 4 }, message: "Backtrack: pop 3 → path=[1,2] (loop at start=2 is exhausted, nothing after index 2). Backtrack again: pop 2 → path=[1] (loop at start=1 exhausted, i now advances to 2)." },
      { highlights: { 0: 'a', 2: 'a' }, pointers: { i: 2 }, vars: { current: '[1,3]', found: 5 }, message: "Back in the start=1 loop, i advances to 2: include nums[2]=3 → path=[1,3]. Record subset [1,3]." },
      { highlights: { 0: 'bad', 2: 'bad' }, pointers: {}, vars: { current: '[]', found: 5 }, message: "Backtrack: pop 3 → path=[1] (start=2 loop exhausted). Backtrack again: pop 1 → path=[] (start=0 loop's i advances from 0 to 1)." },
      { highlights: { 1: 'a' }, pointers: { i: 1 }, vars: { current: '[2]', found: 6 }, message: "Back at the top level (start=0), i advances to 1: include nums[1]=2 → path=[2]. Record subset [2]." },
      { highlights: { 1: 'a', 2: 'a' }, pointers: { i: 2 }, vars: { current: '[2,3]', found: 7 }, message: "i=2: include nums[2]=3 → path=[2,3]. Record subset [2,3]." },
      { highlights: { 1: 'bad', 2: 'bad' }, pointers: {}, vars: { current: '[]', found: 7 }, message: "Backtrack: pop 3 → path=[2] (start=2 loop exhausted). Backtrack again: pop 2 → path=[] (start=0 loop's i advances from 1 to 2)." },
      { highlights: { 2: 'a' }, pointers: { i: 2 }, vars: { current: '[3]', found: 8 }, message: "i=2: include nums[2]=3 → path=[3]. Record subset [3]." },
      { highlights: { 2: 'bad' }, pointers: {}, vars: { current: '[]', found: 8 }, message: "Backtrack: pop 3 → path=[] (start=2 loop exhausted). Top-level loop also exhausted (i was 2, range(0,3) done) → backtrack(0) returns. All 8 subsets generated: [], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]." },
    ],
  },
  quiz: [
    {
      q: 'Which phrasing most strongly signals a backtracking approach rather than dynamic programming?',
      options: [
        '"Return the minimum number of coins to make a target amount"',
        '"Return all possible subsets/permutations/combinations satisfying a condition"',
        '"Return the length of the longest increasing subsequence"',
        '"Return whether a target sum is achievable" (yes/no only)',
      ],
      correct: 1,
      explain: 'Backtracking is for enumerating every distinct valid configuration. The other three ask for a single optimal value or count, which is DP\'s territory — DP exploits overlapping subproblems to avoid re-exploring the same state, which doesn\'t apply when you need every distinct output.',
    },
    {
      q: 'What is the time complexity of generating all subsets of an n-element array, and why?',
      options: [
        'O(n), because each element is only looked at once',
        'O(n log n), the same as sorting',
        'O(2ⁿ), because each of the n elements is independently either included or excluded, giving 2ⁿ total subsets',
        'O(n!), the same as permutations',
      ],
      correct: 2,
      explain: 'Subsets correspond to every combination of include/exclude decisions across n elements — 2 choices per element, n elements, 2ⁿ total subsets. Permutations are O(n!) instead because order matters and every element must appear exactly once per output.',
    },
    {
      q: 'Why does the reference solution write `res.append(path[:])` instead of `res.append(path)`?',
      options: [
        'Purely a style preference — both behave identically',
        '`path` is a single mutable list that keeps changing via later append/pop calls; appending a copy freezes a snapshot, while appending the live reference means every recorded result would reflect path\'s *final* state, not its state at the moment of recording',
        '`path[:]` is required to make the function run faster',
        'It converts `path` from a list to a tuple, which is needed for hashing',
      ],
      correct: 1,
      explain: 'Every recorded subset must reflect what `path` looked like at that specific moment in the recursion. Since `path` is mutated in place by later append/pop calls, storing the live reference (not a copy) means all previously "recorded" results would silently change too, ending up identical to whatever `path` happens to be when the whole function returns — almost always wrong.',
    },
    {
      q: 'A variant (Combination Sum, LC 39) allows the same element to be reused multiple times in one combination. What specifically changes in the recursive call compared to Subsets?',
      options: [
        'Nothing changes — the exact same code works unchanged',
        'The recursive call passes `start` instead of `i + 1` so the same index can be chosen again, and an explicit pruning/stopping condition (e.g. sorted candidates, stop once running sum exceeds target) becomes necessary to avoid runaway recursion',
        'You must switch from recursion to an iterative loop entirely',
        'The result no longer needs `path[:]` copies',
      ],
      correct: 1,
      explain: 'Passing `start` (not `i + 1`) into the recursive call is what allows an index to be reused in a later step. Because that opens the door to reusing the same element indefinitely, you now need a real stopping condition tied to the problem\'s constraint (e.g. running sum vs. target) — without it, recursion doesn\'t just get slow, it can fail to terminate.',
    },
    {
      q: 'What subset does `backtrack(0)` record as its very first result in the reference Subsets solution, and why?',
      options: [
        'The full array [1, 2, 3], because the function starts by including everything',
        'Nothing — the function has no base case for an empty path',
        'The empty subset [], because `res.append(path[:])` runs unconditionally at the very top of `backtrack`, before the loop has added anything on the initial call',
        'A random subset, since the recursion order is not deterministic',
      ],
      correct: 2,
      explain: '`res.append(path[:])` is the first line of `backtrack`, executed before the for-loop runs. On the very first call, `path` is still empty, so the empty subset is recorded immediately — this is also what makes a separate explicit base case unnecessary: every call records its current path state, empty or not, before trying further inclusions.',
    },
  ],
};
