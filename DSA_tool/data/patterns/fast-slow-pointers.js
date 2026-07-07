window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['fast-slow-pointers'] = {
  id: 'fast-slow-pointers',
  title: 'Fast & Slow Pointers',
  category: 'Arrays & Two-Pointer Family',
  timeMin: 10,
  summary: 'Two pointers move in the same direction at different speeds (1 step vs. 2 steps) over a linked structure to detect cycles or find a midpoint in O(1) space.',
  concept: [
    'Floyd\'s tortoise and hare: <code>slow</code> advances one node per step, <code>fast</code> advances two. If the structure has no cycle, <code>fast</code> simply reaches the end first. If it does have a cycle, <code>fast</code> enters the loop, laps <code>slow</code>, and the two <b>must</b> collide — you can prove this by noting that once both pointers are inside the cycle, the gap between them shrinks by exactly one node every step, so it hits zero within at most (cycle length) steps.',
    'This is the O(1)-space alternative to the obvious approach of dropping every visited node into a hash set and checking membership (which is O(n) space) — fast/slow is almost always asked specifically because the interviewer wants to see whether you know the constant-space trick, not just "a" cycle-detection algorithm.',
    'A second, distinct use of the same skeleton: with no cycle at all, running fast at 2x speed against slow at 1x means that when <code>fast</code> reaches the end, <code>slow</code> is exactly at the midpoint — this is how you find the middle of a linked list in one pass without first counting its length.',
    'The collision proof is worth stating precisely, not just gesturing at. Once both pointers are inside a cycle of length c, define the gap g = (fast\'s position − slow\'s position) mod c. Every step, slow advances 1 and fast advances 2, so g decreases by exactly 1 (mod c) each iteration — it can never jump by 2 or more, and it can never increase. A quantity that changes by exactly −1 each step, starting somewhere in the finite set {0, 1, …, c−1}, is mathematically guaranteed to hit 0 within at most c steps; it cannot "skip over" zero the way it could if the gap changed by an unpredictable amount. That\'s the whole proof — collision isn\'t a probabilistic likelihood, it\'s forced.',
  ],
  recognitionSignals: [
    'Problem involves a linked list (or an array used as an implicit linked structure via index-as-pointer) and asks to detect a cycle, find where a cycle begins, or find a middle/midpoint node.',
    'An explicit O(1) extra space constraint that rules out a hash set of visited nodes.',
    'Values are constrained to index range [1, n] with array length n+1 or n — a strong tell that the array itself is meant to be walked like a linked list via <code>nums[i]</code> as a "next pointer" (Find the Duplicate Number).',
    'Distinguish from two pointers: fast/slow both start at the same place and move in the <i>same</i> direction at different speeds; two pointers start at opposite ends and converge. Distinguish from sliding window: there\'s no notion of a "window" or contiguous validity condition here, just pointer position.',
  ],
  complexity: 'Time: O(n) — fast reaches any cycle within O(n) steps, and once inside, collision happens within one additional lap (bounded by cycle length ≤ n). Space: O(1), no auxiliary structure.',
  canonical: {
    name: 'Linked List Cycle (LeetCode 141)',
    statement: 'Given the head of a linked list, determine if the linked list has a cycle in it. There is a cycle if some node can be reached again by continuously following the next pointer. Return true if there is a cycle, false otherwise. Solve it using O(1) extra memory.',
  },
  story: {
    onePiece: {
      title: 'Chopper and Gear Second Luffy in the forest maze',
      text: [
        'Chopper and Luffy enter a dense forest maze on an island, hunting for whoever left a trail through it. Chopper trots along at his normal pace — small hooves, one step at a time. Luffy, showing off, kicks into Gear Second and moves through the maze at exactly double Chopper\'s pace, same path, same turns, just faster.',
        'If the path is a straight corridor with a dead end, Gear Second Luffy simply reaches the end first, turns around, and reports back — they never cross paths again inside the maze, because there was nothing to loop back into.',
        'But if the path secretly loops back on itself — a cycle hidden in the maze layout — then double-speed Luffy, running the same loop, is guaranteed to eventually come up right behind slow Chopper and run into him from the back, lapping him. That collision happening at all is the proof the path loops; it could not happen on a straight dead-end path. Map this directly onto Floyd\'s algorithm: a meeting point between the two pointers exists if and only if a cycle exists.',
      ],
    },
    history: {
      title: 'Magellan\'s expedition and the Victoria\'s return, 1519–1522',
      text: [
        'Ferdinand Magellan\'s fleet set out from Spain in 1519 sailing steadily forward, never doubling back, aiming to find a westward route to the Spice Islands. Magellan himself died partway through, but one ship, the Victoria, kept going forward and eventually sailed back into Sanlúcar de Barrameda in 1522 — having never reversed course even once.',
        'The forward-only return to the starting port was itself the proof that the route the fleet had traced was a single closed loop around the entire globe — you don\'t need to backtrack to discover a cycle, you only need to keep moving and see if you arrive back where you began. To be honest about the mapping: this anchors the *conclusion* well — a return to a known start point proves a loop — but it doesn\'t capture the two-speed mechanism that makes fast/slow pointers work in O(1) space with no memory of the start; a single ship retracing its own path is closer to "drop a marker at the start and watch for it again" than to Floyd\'s tortoise-and-hare race. Treat it as an anchor for *why closing a loop is provable by forward motion alone*, not as a model of the algorithm\'s mechanics.',
      ],
    },
    why: 'The two-speed collision proof is a piece of modular arithmetic that\'s easy to lose under interview stress. Chopper getting run into by Gear-Second Luffy gives a visceral image of *why* two different speeds guarantee a meeting, while Magellan\'s ship gives a separate, historically real anchor for the *idea* that returning to a start point is itself proof of a loop — two distinct retrieval cues for two distinct parts of the argument.',
  },
  tricks: [
    {
      name: 'Check both fast and fast.next before double-advancing',
      idea: 'Advancing fast two nodes at once means dereferencing fast.next.next. If either fast or fast.next is None, that dereference crashes with an AttributeError instead of correctly concluding "no cycle."',
      before:
`def has_cycle(head: "ListNode | None") -> bool:
    slow = fast = head
    while fast:                 # BUG: only checks fast, not fast.next
        slow = slow.next
        fast = fast.next.next   # crashes here if fast.next is None
        if slow is fast:
            return True
    return False`,
      after:
`def has_cycle(head: "ListNode | None") -> bool:
    slow = fast = head
    while fast and fast.next:   # both must be non-None before dereferencing .next.next
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False`,
      explain: 'On any non-cyclic list with an even number of nodes, fast lands exactly on the last node with fast.next is None. The buggy loop condition lets the body execute one more time, and fast.next.next raises AttributeError on a None. Checking fast.next in the loop guard catches this before the unsafe dereference.',
    },
    {
      name: 'Compare node identity, not node value',
      idea: 'Cycle detection is about whether the *same node* is revisited, not whether two nodes happen to hold equal values. Comparing .val instead of the nodes themselves gives false positives whenever the list contains duplicate values but no actual cycle.',
      before:
`def has_cycle(head: "ListNode | None") -> bool:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow.val == fast.val:   # BUG: value equality, not node identity
            return True
    return False`,
      after:
`def has_cycle(head: "ListNode | None") -> bool:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:   # identity comparison: are these literally the same node object?
            return True
    return False`,
      explain: 'A list like 1 -> 2 -> 1 -> 3 -> None (no cycle, just a repeated value 1) will trip the buggy version into reporting a cycle the first time slow and fast land on differently-positioned nodes that both happen to hold value 1. is checks that slow and fast reference the exact same node in memory, which is the only thing a genuine cycle guarantees.',
    },
  ],
  variants: [
    {
      company: 'Google-style',
      title: 'Linked List Cycle II (LeetCode 142) — return the cycle\'s start node, not just true/false',
      twist: 'After slow and fast meet inside the cycle, reset one pointer to <code>head</code> and advance <b>both</b> pointers one step at a time — they meet again exactly at the cycle\'s entry node. This works because of a distance identity: if the distance from head to cycle start is <code>a</code> and from cycle start to the meeting point is <code>b</code>, the math of the first phase guarantees a pointer walking from the head reaches the cycle start in exactly the same number of steps as a pointer walking from the meeting point around the remainder of the cycle. Interviewers use this to check whether you can extend detection into localization, which requires understanding *why* it works, not just replaying a memorized second loop.',
    },
    {
      company: 'Meta-style',
      title: 'Find the Duplicate Number (LeetCode 287)',
      twist: 'Given an array of n+1 integers where every value is in [1, n], find the one duplicate — without modifying the array and using O(1) space (ruling out sorting and a visited-set). Treat the array as an implicit linked list where <code>next(i) = nums[i]</code>; because a duplicate value means two different indices point to the same next node, a cycle necessarily exists, and Floyd\'s algorithm applied to this implicit structure finds the entry point of that cycle, which is exactly the duplicate value. The non-obvious leap is recognizing an *array with a value-range constraint* as a disguised linked-list-with-cycle problem.',
    },
    {
      company: 'Amazon/Microsoft-style',
      title: 'Happy Number (LeetCode 202)',
      twist: 'There\'s no explicit list or array at all — the "next" step is a function: replace a number with the sum of the squares of its digits, repeatedly. Fast/slow pointers detect whether this iteration cycles (unhappy) or reaches 1 (happy) in O(1) space, versus the naive approach of storing every seen value in a hash set. The insight being tested is that fast/slow generalizes to *any* deterministic "next state" function, not just literal pointer-following over nodes — a good interviewer follow-up is "what if you can\'t enumerate all seen states cheaply?" which is exactly when this pattern beats a visited-set.',
    },
  ],
  pythonSolution: {
    title: 'Linked List Cycle',
    code:
`def has_cycle(head: "ListNode | None") -> bool:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False`,
    notes: [
      'Chained assignment <code>slow = fast = head</code> initializes both pointers to the same starting node in one line.',
      'The guard <code>while fast and fast.next</code> checks two levels ahead before dereferencing <code>fast.next.next</code>, avoiding an AttributeError on a None tail — a very common crash in this pattern.',
      '<code>slow is fast</code> uses identity comparison, not <code>==</code>, because two distinct nodes could coincidentally hold equal values; a cycle is about the same node being revisited, not the same value.',
      'No hash set, list, or counter is allocated — the whole function runs in genuinely O(1) auxiliary space, which is the entire point of asking for this pattern instead of the obvious visited-set approach.',
    ],
  },
  pitfalls: [
    'Checking only <code>fast</code> before writing <code>fast.next.next</code> and forgetting <code>fast.next</code> can also be None — crashes with AttributeError on odd-length non-cyclic lists.',
    'Comparing node values (<code>slow.val == fast.val</code>) instead of node identity (<code>slow is fast</code>) — gives false positives when duplicate values exist without an actual cycle.',
    'For Linked List Cycle II, forgetting to reset the *correct* pointer to head (either works by symmetry, but you must move both remaining pointers at speed 1, not speed 2, in the second phase) — moving fast at 2x in phase two breaks the distance identity and gives the wrong node.',
    'For Find the Duplicate Number, mutating <code>nums</code> in place (e.g., sorting it, or negating visited entries as a cheap "visited" marker) — this violates the "do not modify the input array" constraint that\'s usually explicit in this variant.',
  ],
  viz: {
    type: 'array',
    initialArray: [10, 20, 30, 40, 50, 60],
    labelArray: ['10', '20', '30→cycle', '40', '50', '60→2'],
    steps: [
      { highlights: { 0: 'a' }, pointers: { slow: 0, fast: 0 }, vars: { note: 'node5.next wraps back to node2, forming the cycle' }, message: 'Initialize slow and fast both at head (index 0). Node 5\'s next pointer wraps back to node 2 — that\'s the hidden cycle.' },
      { highlights: { 1: 'a', 2: 'b' }, pointers: { slow: 1, fast: 2 }, vars: {}, message: 'Step 1: slow advances 1 node (0→1). fast advances 2 nodes (0→1→2).' },
      { highlights: { 2: 'a', 4: 'b' }, pointers: { slow: 2, fast: 4 }, vars: {}, message: 'Step 2: slow advances to 2. fast advances 2→3→4.' },
      { highlights: { 2: 'b', 3: 'a' }, pointers: { slow: 3, fast: 2 }, vars: {}, message: 'Step 3: slow advances to 3. fast advances 4→5→2 (wrapped through the cycle back to node 2).' },
      { highlights: { 4: 'c' }, pointers: { slow: 4, fast: 4 }, vars: {}, message: 'Step 4: slow advances to 4. fast advances 2→3→4. slow is fast → they collided!' },
      { highlights: { 4: 'c' }, pointers: { slow: 4, fast: 4 }, vars: { result: 'True' }, message: 'Return True — a cycle exists. If there were no cycle, fast would have hit a None next pointer and the loop would have exited with False.' },
    ],
  },
  quiz: [
    {
      q: 'Which detail in a problem statement most strongly signals fast/slow pointers over a plain hash-set visited-tracking approach?',
      options: [
        'The list/array is sorted',
        'An explicit requirement to use O(1) extra space while detecting a cycle or midpoint',
        'The problem asks for the longest contiguous subarray',
        'The problem involves finding the k-th largest element',
      ],
      correct: 1,
      explain: 'A hash set trivially detects cycles or duplicates in O(n) space. Fast/slow pointers exist specifically to solve the same problem in O(1) space — that constraint is the tell.',
    },
    {
      q: 'Why is the time complexity of Floyd\'s cycle detection O(n) and not O(n²) or worse, given that fast "re-walks" parts of the cycle?',
      options: [
        'It isn\'t O(n) — it\'s actually O(n log n)',
        'fast reaches the cycle within O(n) steps, and once both pointers are inside, the gap between them shrinks by exactly 1 each step, so they must meet within one additional lap of the cycle (bounded by n) — total work stays linear',
        'The algorithm secretly uses a hash set internally to skip redundant work',
        'It only works on lists shorter than 1000 nodes, so the complexity is effectively constant',
      ],
      correct: 1,
      explain: 'Both phases (reaching the cycle, then closing the gap inside it) are individually bounded by O(n), and they happen sequentially, not nested — so total work is O(n), not O(n²).',
    },
    {
      q: 'In the reference solution, why does `while fast and fast.next` guard the loop instead of just `while fast`?',
      options: [
        'It has no real effect, just defensive style',
        'The loop body dereferences `fast.next.next`, so both `fast` and `fast.next` must be non-None or that line crashes with an AttributeError',
        'It\'s required to make the algorithm run in O(1) space',
        'It prevents `slow` from ever equaling `fast` incorrectly',
      ],
      correct: 1,
      explain: 'fast.next.next requires two safe dereferences ahead of the current fast position. Checking only `fast` still allows `fast.next` to be None, which would crash on `.next.next`.',
    },
    {
      q: 'The Find the Duplicate Number variant (LeetCode 287) gives you a plain array, not a linked list. What makes fast/slow pointers applicable at all?',
      options: [
        'It doesn\'t apply — that problem requires sorting',
        'The array\'s value-range constraint (values in [1,n], length n+1) lets you treat index→nums[index] as an implicit "next" pointer; a duplicate value forces two indices to point to the same next node, which creates a genuine cycle to detect',
        'Fast/slow pointers work on any array regardless of its values',
        'You must first convert the array into an actual linked list data structure',
      ],
      correct: 1,
      explain: 'The key insight is recognizing nums[i] as a functional "next" step over indices. No conversion to real linked-list nodes is needed — the array itself, read this way, already has the cycle structure Floyd\'s algorithm needs.',
    },
    {
      q: 'If a linked list has no cycle at all, what happens when you run the canonical `has_cycle` function on it?',
      options: [
        'It infinite-loops because fast never stops',
        'It raises an exception every time',
        'fast eventually reaches a node whose `.next` is None (or fast itself becomes None), the while condition becomes false, and the function returns False',
        'slow and fast are guaranteed to meet anyway, giving a false positive',
      ],
      correct: 2,
      explain: 'Without a cycle, fast is racing toward a definite end (None). The loop guard fails as soon as fast can\'t safely advance two more steps, and the function correctly falls through to return False.',
    },
  ],
};
