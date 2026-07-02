window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['binary-search-trees'] = {
  id: 'binary-search-trees',
  title: 'Binary Search Trees',
  category: 'Trees & Graphs',
  timeMin: 10,
  summary: 'Exploit the BST invariant — every node\'s left subtree is entirely smaller, right subtree entirely larger — to get sorted-order traversal and O(h) search/insert/rank operations.',
  concept: [
    'The BST property is a <b>global</b> constraint, not a local one: every node in a subtree must respect the bounds set by *all* of its ancestors, not just its immediate parent. This is the single most common source of bugs — checking only <code>node.left.val < node.val < node.right.val</code> passes plenty of invalid trees where a deeper descendant violates a grandparent\'s bound.',
    'The core exploitable insight: an <b>inorder traversal</b> (left, node, right) of a valid BST visits nodes in strictly ascending sorted order. This turns "find the kth smallest," "find the closest value to a target," and "is this a valid BST" into traversal problems rather than requiring you to reconstruct sorted order some other way.',
    'Validation and rank-style queries (kth smallest, floor/ceiling) are best written as recursion that threads <code>(low, high)</code> bounds downward, tightening them at every step — <code>validate(node.left, low, node.val)</code> and <code>validate(node.right, node.val, high)</code> — rather than comparing a node only to its direct parent.',
  ],
  recognitionSignals: [
    'Problem explicitly says "binary search tree" or "BST," or gives you a tree that\'s guaranteed sorted along inorder traversal.',
    'Asks for kth smallest/largest, closest value to a target, floor/ceiling, or "is this a valid BST" — all exploit the sorted-inorder or bounded-subtree property.',
    'Mentions insert/delete/successor/predecessor operations that must stay O(h) rather than O(n) — a signal that you should navigate via BST comparisons (go left/right) instead of scanning.',
    'Distinguish from the general "Binary Search" array pattern: both exploit a sorted/monotonic structure, but here you navigate via node pointers and subtree bounds rather than index arithmetic on a flat array — and depth h is only O(log n) if the tree happens to be balanced (not guaranteed unless stated).',
  ],
  complexity: 'Time: O(h + k) for kth smallest via early-exit inorder (h to reach the leftmost node, then k pops); O(n) worst case if the whole tree must be visited (e.g. full validation). Space: O(h) for the explicit stack or recursion, where h = O(log n) balanced, O(n) skewed (a degenerate BST is just a linked list).',
  canonical: {
    name: 'Kth Smallest Element in a BST (LeetCode 230)',
    statement: 'Given the root of a binary search tree and an integer k, return the kth smallest value (1-indexed) among all node values in the tree.',
  },
  variants: [
    {
      company: 'Google-style',
      title: 'Validate Binary Search Tree (LC 98)',
      twist: 'Instead of exploiting sorted order, you must prove it. Recurse with (low, high) bounds: <code>valid(node.left, low, node.val)</code> and <code>valid(node.right, node.val, high)</code>, failing if <code>node.val</code> is not strictly between the bounds. The classic bug is comparing a node only against its immediate parent, which incorrectly accepts trees where a node is fine relative to its parent but violates a grandparent\'s bound.',
    },
    {
      company: 'Meta-style',
      title: 'BST Iterator (LC 173)',
      twist: 'Needs O(1) amortized <code>next()</code> calls and O(h) space total — you cannot precompute the full inorder list up front (that\'s O(n) space and defeats the point). Instead, maintain an explicit stack representing "where the traversal paused": push the left spine down from a node whenever you descend, and pushing the left spine of <code>node.right</code> whenever you advance past a node. This turns the recursive inorder traversal into a resumable stack machine.',
    },
    {
      company: 'Amazon-style',
      title: 'Kth Smallest with frequent insertions/deletions',
      twist: 'A realistic follow-up to 230: if kth-smallest queries happen repeatedly on a BST that\'s also being mutated, re-running an O(n) or O(h+k) inorder traversal every query is wasteful. Augment each node with a <code>subtree_size</code> field maintained during insert/delete, then answer kth-smallest as an O(h) "rank descent": if <code>k <= size(node.left)</code> go left, if <code>k == size(node.left) + 1</code> return node.val, else recurse right with <code>k - size(node.left) - 1</code>.',
    },
  ],
  pythonSolution: {
    title: 'Kth Smallest Element in a BST',
    code:
`class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def kth_smallest(root, k):
    stack = []
    node = root
    while stack or node:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        k -= 1
        if k == 0:
            return node.val
        node = node.right`,
    notes: [
      'Iterative inorder with an explicit stack lets you <code>return</code> the moment <code>k == 0</code> — a recursive "collect all values then index" solution can\'t short-circuit and always pays O(n).',
      'The inner <code>while node:</code> loop pushes the entire left spine before popping anything — this is what guarantees the first pop is the tree\'s minimum, i.e. that pops happen in ascending order.',
      'After popping and processing a node, setting <code>node = node.right</code> (rather than recursing) hands control back to the outer loop, which will push that subtree\'s left spine next — this single line is what continues the inorder sequence correctly.',
      'No sentinel or extra bookkeeping is needed for the empty-subtree case: the <code>while node:</code> guard naturally stops descending, and <code>stack or node</code> naturally stops the whole traversal once both are exhausted.',
    ],
  },
  pitfalls: [
    'Validating a BST by comparing a node only to its immediate parent/children instead of threading (low, high) bounds through the recursion — passes many test cases but fails on a node that\'s locally fine yet violates an ancestor further up the tree.',
    'Assuming inorder traversal gives sorted order for *any* binary tree — it only holds for a valid BST; running this trick as a shortcut on a tree you haven\'t validated (or that isn\'t guaranteed to be a BST) produces meaningless output.',
    'Off-by-one in the early-exit kth-smallest loop: decrementing k before or after the wrong comparison returns the (k-1)th or (k+1)th element instead of the kth — trace k on a 3-node example by hand before trusting the loop.',
    'Using a value-based sentinel like `float("-inf")` for a "previous value" check as a substitute for proper bound-passing recursion — works until the tree contains duplicate values, at which point whether `==` should pass or fail depends on the problem\'s definition of "valid BST," and a sentinel-only check often gets this silently wrong.',
  ],
  viz: {
    type: 'graph',
    nodes: [
      { id: 'A', x: 200, y: 40, label: '5' },
      { id: 'B', x: 120, y: 110, label: '3' },
      { id: 'C', x: 280, y: 110, label: '8' },
      { id: 'D', x: 80, y: 190, label: '2' },
      { id: 'E', x: 160, y: 190, label: '4' },
      { id: 'F', x: 340, y: 190, label: '9' },
    ],
    edges: [
      { from: 'A', to: 'B' },
      { from: 'A', to: 'C' },
      { from: 'B', to: 'D' },
      { from: 'B', to: 'E' },
      { from: 'C', to: 'F' },
    ],
    steps: [
      { visited: [], current: 'A', activeEdge: null, vars: { stack: "[]", k: 3 }, message: "Start at root 5. Looking for the 3rd smallest value." },
      { visited: [], current: 'D', activeEdge: ['B', 'D'], vars: { stack: "[5, 3, 2]", k: 3 }, message: "Descend the left spine: push 5, then 3, then 2 (2 has no left child, stop descending)." },
      { visited: ['D'], current: 'B', activeEdge: ['B', 'D'], vars: { stack: "[5, 3]", k: 2 }, message: "Pop 2 (smallest value in the tree). k: 3 → 2. No right child, so continue popping." },
      { visited: ['D', 'B'], current: 'A', activeEdge: ['A', 'B'], vars: { stack: "[5]", k: 1 }, message: "Pop 3. k: 2 → 1. Node 3 has a right child (4) — descend into it next." },
      { visited: ['D', 'B'], current: 'E', activeEdge: ['B', 'E'], vars: { stack: "[5, 4]", k: 1 }, message: "Descend to right child 4; it has no left child, so push it and stop descending." },
      { visited: ['D', 'B', 'E'], current: 'A', activeEdge: ['B', 'E'], vars: { stack: "[5]", k: 0 }, message: "Pop 4. k: 1 → 0 → this is the 3rd smallest. Return 4 immediately." },
      { visited: ['D', 'B', 'E'], current: null, activeEdge: null, vars: { result: 4 }, message: "Answer: the 3rd smallest value is 4. Nodes 5, 8, and 9 were never visited — the early exit is the entire point of the iterative approach over a collect-all-then-index solution." },
    ],
  },
  quiz: [
    {
      q: 'Which of these problem phrasings most directly signals "exploit BST inorder traversal" rather than a generic tree DFS/BFS?',
      options: [
        '"Return the maximum depth of the tree"',
        '"Find the kth smallest value in a binary search tree"',
        '"Return the level-order traversal of the tree"',
        '"Count the number of leaf nodes"',
      ],
      correct: 1,
      explain: 'Kth smallest/largest, closest-value, and validity questions on a BST all hinge on the inorder-traversal-gives-sorted-order property. Depth, level order, and leaf counting are generic tree properties that don\'t depend on the BST ordering invariant at all.',
    },
    {
      q: 'What is the time complexity of the early-exit iterative kth-smallest solution, and why is it better than building a full sorted list first?',
      options: [
        'O(n) always, identical to building a full sorted list — there\'s no advantage',
        'O(h + k): you descend the left spine once (O(h)) then pop at most k times, and can return the moment k reaches 0, rather than paying O(n) to visit every node',
        'O(log n), because BST height is always logarithmic',
        'O(k²), because each pop requires re-scanning the stack',
      ],
      correct: 1,
      explain: 'The stack-based inorder traversal only does as much work as needed to reach the kth element, then returns — O(h) to reach the first node plus O(k) pops. A "collect all values into a list, then index" approach always pays O(n) regardless of k, and BST height h is only O(log n) if the tree happens to be balanced.',
    },
    {
      q: 'In the reference solution, why does `node = node.right` (after popping and processing a node) correctly continue the inorder sequence?',
      options: [
        'It doesn\'t matter what this line does — the stack alone determines correctness',
        'It hands the outer while-loop a subtree (node.right) whose left spine will be pushed next, continuing inorder order — without it, the traversal would skip every right subtree entirely',
        'It undoes the previous pop, effectively skipping the node',
        'It resets the stack to empty, restarting the traversal from the root',
      ],
      correct: 1,
      explain: 'After visiting a node, inorder must next visit its right subtree (starting from that subtree\'s leftmost node). Setting `node = node.right` and letting the outer loop\'s inner `while node:` push that subtree\'s left spine is exactly how the stack-based version replicates recursive inorder traversal.',
    },
    {
      q: 'A variant asks you to validate a BST (LC 98) instead of finding the kth smallest. What is the correct way to check validity, and what\'s the common mistake?',
      options: [
        'Compare each node only to its immediate left and right children — this is fully correct and sufficient',
        'Thread (low, high) bounds down the recursion, tightening them at each step — the common mistake is comparing a node only to its immediate parent/children, which misses violations against a further ancestor',
        'Sort all values first, then check the tree structure matches a heap',
        'It cannot be checked recursively; it requires an iterative BFS with a hash set',
      ],
      correct: 1,
      explain: 'A node deep in the right subtree of a left child can be numerically fine relative to its direct parent but still violate the root\'s bound. Passing (low, high) down and tightening them at each recursive call (valid(node.left, low, node.val), valid(node.right, node.val, high)) is what correctly enforces the global constraint.',
    },
    {
      q: 'What happens if you run an inorder traversal expecting sorted output on a binary tree that is NOT a valid BST?',
      options: [
        'It still produces sorted output — inorder traversal always yields sorted order regardless of tree shape',
        'It throws a runtime error immediately',
        'It produces some traversal order, but that order is not guaranteed to be sorted — the sorted-order guarantee only holds because a valid BST enforces left < node < right transitively at every level',
        'It automatically detects the invalid tree and raises a ValueError',
      ],
      correct: 2,
      explain: 'Inorder (left, node, right) is just a traversal order — it produces sorted output only because a *valid* BST\'s structure guarantees every left descendant is smaller and every right descendant is larger. On an arbitrary binary tree without that invariant, inorder traversal still runs, but the output is not meaningfully sorted.',
    },
  ],
};
