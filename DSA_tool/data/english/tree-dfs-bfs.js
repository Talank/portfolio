window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['tree-dfs-bfs'] = {
  id: 'tree-dfs-bfs',
  title: 'Tree DFS / BFS + Recursion Templates',
  titleNe: 'Two ways to walk the family tree',
  intro: 'depth-first (recursion) vs level-by-level (queue) — and when each wins',
  slides: [
    {
      heading: 'When to reach for which',
      bullets: [
        '<b>DFS</b> (go deep): paths, depths, subtree properties, “does a path exist with sum X?”',
        '<b>BFS</b> (go wide): anything with <b>levels</b> — level-order, zigzag, right-side view, <i>shortest</i> path.',
        'The word “level” or “nearest/shortest” in the problem ⇒ BFS. Otherwise DFS is usually simpler.',
      ],
      narration: "Now we enter the world of trees. There are two ways to walk a tree, and the family-genealogy story fits best. Imagine you're tracing your clan's lineage. DFS means — go to the eldest son's house, then his eldest son's, then his — descending generation by generation to the very bottom, and only after that branch ends do you come back and head for the second son. BFS means — first meet all your children, then all your grandchildren, then all your great-grandchildren — generation by generation, level by level. Which, when? If the problem says level, nearest, or shortest path — BFS. If it asks about path sums, depths, or subtree properties — DFS, and DFS written with recursion often fits in three or four lines.",
    },
    {
      heading: 'Story: Trust the recursion',
      bullets: [
        'The recursive leap of faith: “my helper <i>already works</i> for smaller trees.”',
        'Ask each child for its answer, combine, add yourself.',
        '<code>max_depth(node) = 1 + max(left_depth, right_depth)</code> — three lines, no simulation.',
      ],
      narration: "Recursion scares many people, because the mind tries to dive into every call and gets dizzy. Learn the leap of faith. A master tells a servant — your job is to measure the tree's depth. The servant's move — I won't measure it all myself — I tell the left branch to measure itself, the right branch to measure itself, add one to the bigger of the two, and hand it back. But who measures the left branch? Another copy of the servant, the same way. The one thing you trust: my function works correctly for a smaller tree. Base case — if there's no tree, the depth is zero. That's it. Don't try to trace every call — just assume the children's answers are already in, and think only about your own level. This one habit melts half of all tree problems.",
    },
    {
      heading: 'Mnemonic',
      big: '“DFS: dive deep (stack). BFS: float level by level (queue).”',
      bullets: [
        'DFS = stack (or recursion, which <i>is</i> a stack).',
        'BFS = queue — the temple line again!',
        'Level trick: <code>for _ in range(len(queue))</code> drains exactly one level.',
      ],
      narration: "The hook: DFS dives deep, using a stack — BFS floats level by level, using a queue. Dive and float — those two words tell you the container too. When you dive, you must remember the way back up — that's a stack, and recursion is itself a hidden stack. When you float, turns come in order — that's the previous module's temple line, a queue. And memorize one golden BFS trick — the way to separate levels: at the start of the loop, however many are in the queue are exactly this level — for underscore in range of len of queue drains exactly one level, and whatever gets added belongs to the next. This three-line shape opens level-order, zigzag, and right-side view all from the same key.",
    },
    {
      heading: 'Python templates',
      code: '# DFS — three lines per idea\ndef max_depth(node):\n    if not node:\n        return 0\n    return 1 + max(max_depth(node.left), max_depth(node.right))\n\n# BFS — level by level\nfrom collections import deque\ndef level_order(root):\n    if not root:\n        return []\n    q, levels = deque([root]), []\n    while q:\n        level = []\n        for _ in range(len(q)):          # exactly one level\n            node = q.popleft()\n            level.append(node.val)\n            if node.left: q.append(node.left)\n            if node.right: q.append(node.right)\n        levels.append(level)\n    return levels',
      narration: "Look at both templates. DFS — a base case and one line of faith — in this same shape you write path sum, same tree, invert tree, diameter — dozens of problems, differing only in what you combine and what you return. BFS — a while outside, that magical for inside, building a level list as you go. Need zigzag? Just reverse the odd levels. Right-side view? Just take the last element of each level. One caution — don't put None children into the queue; check as you add them, or popleft crashes. Time O(n) for both — each node once. Space — the tree's height for DFS, the widest level for BFS.",
    },
    {
      heading: 'Watch out! Traversal orders + pitfalls',
      bullets: [
        'Pre-order (node first), in-order (left-node-right), post-order (children first) — same DFS, different timing.',
        'Bottom-up answers (depth, diameter) are post-order; top-down (path so far) pass state as arguments.',
        'Diameter trap: the helper returns <b>height</b>, but the answer updates a separate best — two different quantities!',
        'Deep skewed trees can hit Python’s recursion limit — mention the iterative-stack rewrite.',
      ],
      narration: "The final slide — three orders and two traps. Pre-order, in-order, post-order — all three are the same DFS, differing only in when you do your own work: before the children, in between, or after. Answers that accumulate from the bottom up — depth, diameter — are post-order: first hear the children, then speak. Things that flow top-down — the path so far — are carried down as arguments. Remember the famous diameter trap — the helper returns the height, but the diameter is updated in a separate best variable — two different quantities in one function — and many interviews have slipped on failing to separate them. And last — a lopsided tree thousands of nodes deep can hit Python's recursion limit; in that case say in one sentence that you'd rewrite it iteratively with your own stack — that's enough.",
    },
  ],
};
