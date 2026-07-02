window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['tree-dfs-bfs'] = {
  id: 'tree-dfs-bfs',
  title: 'Tree DFS / BFS + Recursion Templates',
  category: 'Trees & Graphs',
  timeMin: 15,
  summary: 'Traverse a binary tree level-by-level (BFS, via a queue) or root-to-leaf (DFS, via recursion/stack) — the two traversal skeletons underneath almost every tree problem.',
  concept: [
    'A tree is a graph with no cycles, so unlike general graph traversal you never need a <code>visited</code> set — each node has exactly one parent, so you can never revisit it by walking edges downward. That structural guarantee is what makes tree traversal templates simpler than their graph counterparts.',
    '<b>BFS (level order)</b> uses a queue (<code>collections.deque</code>, never a plain list) and processes nodes level by level: you snapshot the current queue length before draining it, so each inner loop corresponds to exactly one depth level. Reach for BFS when a problem is inherently about levels/depth (level-order output, minimum depth, right-side view, zigzag order).',
    '<b>DFS</b> comes in three flavors that differ only in *when* you process a node relative to recursing into its children: <b>preorder</b> (node, left, right — process before descending, useful for copying/serializing a tree top-down), <b>inorder</b> (left, node, right — yields sorted order for a BST), and <b>postorder</b> (left, right, node — process after both subtrees are done, needed whenever a node\'s answer depends on its children\'s answers, e.g. max depth, diameter, subtree sums). Recursion depth is O(h) where h is tree height, so DFS space is O(log n) balanced but O(n) on a degenerate (linked-list-shaped) tree.',
  ],
  recognitionSignals: [
    '"Level order", "level by level", "minimum depth", "zigzag traversal", "distance/width at each level" — these phrasings point straight at BFS with a queue.',
    '"Path from root to leaf", "max/min depth", "diameter", "is this a valid X" where X is defined recursively in terms of subtrees — these point at DFS, usually postorder since the answer bubbles up from children.',
    'Brute-force intuition of "visit every node exactly once" with no cycle risk signals plain tree DFS/BFS rather than the general graph pattern; if the problem explicitly allows cycles or undirected edges between arbitrary nodes, you need the graph version (with an explicit visited set) instead.',
    'If a problem needs sorted-order visitation or exploits a binary-search-tree ordering property, that is inorder DFS specifically — see the dedicated BST pattern.',
  ],
  complexity: 'Time: O(n) for either traversal — every node is visited exactly once. Space: O(n) worst case for BFS (a maximally wide level, e.g. up to ~n/2 nodes on a complete tree\'s last level) or O(h) for DFS recursion stack, where h = O(log n) balanced, O(n) skewed.',
  canonical: {
    name: 'Binary Tree Level Order Traversal (LeetCode 102)',
    statement: 'Given the root of a binary tree, return the level order traversal of its nodes\' values (i.e., from left to right, level by level), as a list of lists where each inner list holds one level.',
  },
  variants: [
    {
      company: 'Meta-style',
      title: 'Binary Tree Zigzag Level Order Traversal (LC 103)',
      twist: 'Same BFS skeleton, but alternate the direction of each level: left-to-right, then right-to-left, then left-to-right again. Cheapest implementation is to keep the exact same queue-drain loop and just reverse every other level\'s list before appending it to the result (or track a boolean flag and use a deque with alternating append/appendleft) — the traversal order in which nodes are dequeued never changes, only how you record them.',
    },
    {
      company: 'Google-style',
      title: 'Binary Tree Right Side View (LC 199)',
      twist: 'Instead of collecting every value per level, keep only the last node dequeued in each level\'s inner loop. This can also be solved with DFS by visiting the right child before the left child and recording the first node seen at each depth — the interviewer is checking whether you understand that BFS and DFS can both solve a "per-level" problem via different invariants (last-in-BFS-order vs. first-in-a-right-biased-DFS-order).',
    },
    {
      company: 'Amazon-style',
      title: 'Minimum Depth of Binary Tree (LC 111)',
      twist: 'Explicitly favors BFS over DFS: the moment you dequeue a node with no children, return the current depth immediately — an early exit. DFS visits nodes in a way that can\'t short-circuit the same way: on a tree where one path is artificially deep but a shallow leaf exists on another branch, naive DFS still explores the deep branch fully before finding the shallow answer, making BFS the asymptotically better choice here even though both are O(n) worst case.',
    },
  ],
  pythonSolution: {
    title: 'Binary Tree Level Order Traversal',
    code:
`from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def level_order(root):
    if not root:
        return []
    result = []
    queue = deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)
    return result`,
    notes: [
      '<code>deque.popleft()</code> is O(1); using a plain <code>list.pop(0)</code> instead is O(n) per call and silently degrades the whole traversal to O(n²) — a common but costly mistake.',
      '<code>for _ in range(len(queue))</code> captures the queue\'s length once before the loop starts, even though the loop body appends to the same queue — <code>range()</code> is evaluated once, so this is exactly what partitions the flat queue into discrete levels.',
      '<code>if not root: return []</code> is the idiomatic Python falsy-check guard for the empty-tree edge case, avoiding a <code>None</code> attribute error on <code>root.val</code>.',
      'Building a fresh <code>level = []</code> list each iteration and appending to it (rather than slicing the queue) keeps the code readable and avoids accidentally aliasing mutable state across levels.',
    ],
  },
  pitfalls: [
    'Using <code>list.pop(0)</code> instead of <code>collections.deque</code> for the BFS queue — turns each dequeue into an O(n) operation, degrading the whole traversal from O(n) to O(n²).',
    'Forgetting to snapshot the queue length (<code>len(queue)</code>) into the range before the inner loop starts — if you instead check <code>len(queue)</code> freshly on every inner-loop iteration, newly-appended children get consumed in the same "level," corrupting level boundaries.',
    'Carrying the tree-traversal template over to a graph problem without adding a <code>visited</code> set — trees have no cycles so it\'s safe to skip, but the same code on a cyclic/undirected graph infinite-loops.',
    'Mixing up preorder/inorder/postorder under pressure — the only difference is *when* you process the node (before recursing, between the two recursive calls, or after), and getting this backwards for a postorder-dependent problem (e.g. max depth = 1 + max(left, right)) gives you the child\'s answer before it\'s actually computed.',
  ],
  viz: {
    type: 'graph',
    nodes: [
      { id: 'A', x: 200, y: 40, label: '3' },
      { id: 'B', x: 120, y: 110, label: '9' },
      { id: 'C', x: 280, y: 110, label: '20' },
      { id: 'D', x: 240, y: 190, label: '15' },
      { id: 'E', x: 320, y: 190, label: '7' },
    ],
    edges: [
      { from: 'A', to: 'B' },
      { from: 'A', to: 'C' },
      { from: 'C', to: 'D' },
      { from: 'C', to: 'E' },
    ],
    steps: [
      { visited: [], current: 'A', activeEdge: null, vars: { queue: "['A']" }, message: "Push root 3 (A) onto the queue to start BFS." },
      { visited: [], current: 'A', activeEdge: null, vars: { queue: "['B','C']" }, message: "Dequeue A (3) → level 0 = [3]. Enqueue its children B (9) and C (20)." },
      { visited: ['A'], current: 'B', activeEdge: ['A', 'B'], vars: { queue: "['C']" }, message: "Dequeue B (9) → leaf, no children to enqueue. Queue: [C]." },
      { visited: ['A', 'B'], current: 'C', activeEdge: ['A', 'C'], vars: { queue: "['D','E']" }, message: "Dequeue C (20) → level 1 complete = [9, 20]. Enqueue children D (15) and E (7)." },
      { visited: ['A', 'B', 'C'], current: 'D', activeEdge: ['C', 'D'], vars: { queue: "['E']" }, message: "Dequeue D (15) → leaf. Queue: [E]." },
      { visited: ['A', 'B', 'C', 'D'], current: 'E', activeEdge: ['C', 'E'], vars: { queue: "[]" }, message: "Dequeue E (7) → leaf. Queue empty → level 2 complete = [15, 7]." },
      { visited: ['A', 'B', 'C', 'D', 'E'], current: null, activeEdge: null, vars: { result: "[[3],[9,20],[15,7]]" }, message: "BFS complete. Level-order result: [[3], [9, 20], [15, 7]]." },
    ],
  },
  quiz: [
    {
      q: 'Which phrasing most strongly signals BFS (level order) over DFS for a tree problem?',
      options: [
        '"Return the diameter of the tree"',
        '"Return the minimum depth" or "return the tree level by level"',
        '"Check if the tree is a valid binary search tree"',
        '"Compute the sum of all subtree values"',
      ],
      correct: 1,
      explain: 'Diameter, BST validation, and subtree sums all depend on aggregating information from children up to a node — that\'s postorder DFS. Minimum depth and level-by-level output are inherently about level/depth, which is BFS\'s natural fit (and BFS lets minimum depth exit early at the first leaf found).',
    },
    {
      q: 'What is the space complexity of the BFS queue in the worst case, and when is it achieved?',
      options: [
        'O(1), because the queue never holds more than one node at a time',
        'O(h) where h is the tree height, always',
        'O(n), achieved on a wide tree where a single level can hold close to n/2 nodes (e.g. a complete tree\'s last level)',
        'O(log n), because BFS always processes balanced halves',
      ],
      correct: 2,
      explain: 'BFS space is bounded by the widest level, which for a complete binary tree can be roughly n/2 nodes at the last level — that\'s O(n) in the worst case, unlike DFS\'s O(h) recursion stack.',
    },
    {
      q: 'In the reference solution, why does `for _ in range(len(queue))` correctly isolate one tree level per outer while-loop iteration, even though children are appended to `queue` inside that same loop?',
      options: [
        'Because `range()` re-evaluates `len(queue)` on every iteration, so it automatically stops at the right point',
        'Because `range(len(queue))` is evaluated once, up front, capturing the queue length *before* any children get appended — so the inner loop processes exactly the nodes that existed at the start of the level',
        'Because `deque.append()` inserts at the front, not the back, so new children never get counted at all',
        'It\'s not actually necessary — any fixed number would work the same way',
      ],
      correct: 1,
      explain: 'Python evaluates `range(len(queue))` once when the for-loop starts. Newly appended children increase `len(queue)` afterward, but the range object doesn\'t change, so the loop body runs exactly for the nodes present at the start of that level — this is precisely what defines a "level" here.',
    },
    {
      q: 'A variant asks for the "right side view" of a binary tree (the last node visible from each level, looking from the right). What is a correct way to adapt the BFS template?',
      options: [
        'It cannot be solved with BFS at all — only DFS works',
        'Run the identical level-order BFS, but instead of collecting every value in `level`, keep only the last value dequeued in each level\'s inner loop',
        'Swap the queue for a stack and nothing else changes',
        'Sort each level\'s values in descending order and take the first one',
      ],
      correct: 1,
      explain: 'The BFS skeleton (queue, snapshot level length, drain, enqueue children) stays identical — the only change is which values you keep from each level: just the last one dequeued, since that\'s the rightmost node at that depth.',
    },
    {
      q: 'What happens if you run this exact BFS/DFS template, unmodified, on a general graph that contains a cycle?',
      options: [
        'Nothing changes — trees and graphs are traversed identically',
        'It raises a TypeError immediately',
        'It can infinite-loop, because without an explicit `visited` set, a cyclic graph lets you re-enqueue/re-visit the same node forever — trees are safe from this only because each node has exactly one parent',
        'It automatically detects the cycle and returns early',
      ],
      correct: 2,
      explain: 'The tree template omits a visited set because a tree, by definition, has no cycles — you can never reach a node twice by walking edges downward from the root. A general graph has no such guarantee, so the graph BFS/DFS pattern must track visited nodes explicitly to avoid infinite loops.',
    },
  ],
};
