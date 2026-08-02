/* Water Seven — binary trees and recursion.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['same-tree'] = {
    id: 'same-tree',
    epNumber: 141,
    title: 'Two Blueprints, Compared Rivet by Rivet',
    arc: 'Water Seven',
    patternId: 'tree-dfs-bfs',
    scene: 'forest',
    leetcode: { name: 'Same Tree', number: 100, difficulty: 'Easy', url: 'https://leetcode.com/problems/same-tree/' },
    problem: 'Given the roots of two binary trees, determine whether they are identical — the same structure and the same values at every node.',
    example: 'p = [1,2,3], q = [1,2,3]  →  true;    p = [1,2], q = [1,null,2]  →  false',

    h: 210,
    props: [
      { id: 'p1', emoji: '📐', label: '1', x: 28, y: 24 },
      { id: 'p2', emoji: '📐', label: '2', x: 16, y: 52 },
      { id: 'q1', emoji: '📐', label: '1', x: 72, y: 24 },
      { id: 'q2', emoji: '📐', label: '2', x: 84, y: 52 }
    ],
    ledger: [
      { id: 'V', x: 50, y: 84 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Two blueprints for the same ship. Iceberg wants to know whether they are truly identical — same shape, same numbers, no differences anywhere.",
        p: { p1: 'lit', q1: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Recursion on trees is one honest question: what do I need from my children, and what do I hand my parent? Here the answer is a yes or a no, and it is the AND of both children's answers.",
        p: { V: 'lit' }, l: { V: 'same = value AND both sides' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So at each pair of nodes: are they both absent? Then they match. Is exactly one absent? Then they differ. Otherwise compare the values and recurse on both sides.",
        p: { p1: 'good', q1: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "The two-nodes-absent case is what makes it terminate. And 'exactly one absent' is the structural difference — the second blueprint has its 2 on the other side.",
        p: { p2: 'bad', q2: 'bad' }, l: { V: 'shape differs → false' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is why comparing the traversals alone is not enough. Two different trees can share a preorder sequence unless the nulls are recorded too.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So the shape has to be compared directly, node against node — not flattened first.",
        p: { p2: 'good', q2: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And the comparison short-circuits: the moment one side disagrees, the whole thing is false and nothing further needs visiting.",
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Three lines, once you have the three cases straight. The cases are the work.",
        sfx: 'gong'
      }
    ],

    insight: 'A tree recursion is defined by what each node returns to its parent — here a boolean, combined with AND, with the null cases doing the terminating.',
    complexity: '<b>Time O(n)</b> — every pair of nodes visited at most once, less on an early mismatch. <b>Space O(h)</b> for the recursion stack, which is O(n) on a degenerate tree.',
    pitfall: 'Comparing flattened traversals without recording nulls — [1,2] and [1,null,2] both preorder to "1 2". And handling only one of the two null cases, which crashes on the other.',
    solution: `def is_same_tree(p, q):
    if not p and not q:
        return True             # both absent: identical
    if not p or not q:
        return False            # exactly one absent: shapes differ
    return (p.val == q.val
            and is_same_tree(p.left, q.left)
            and is_same_tree(p.right, q.right))`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper compares the two trees by collecting their preorder traversals into lists and checking equality. Which pair of different trees does he wrongly call identical?",
        options: [
          'A root with a single left child versus the same root with a single right child — both preorder to the same two values',
          'Two trees with different root values',
          'Two trees of different heights',
          'None; preorder uniquely identifies a tree'
        ],
        correct: 0,
        explain: 'Preorder alone loses the shape. Recording nulls as explicit markers fixes it — which is exactly why serialisation formats include them. Comparing node against node avoids the issue entirely and stops early on a mismatch.',
        hint: 'Write out the preorder of [1,2] and of [1,null,2].'
      },
      {
        tag: 'TRANSFER',
        q: "Different blueprint check: Nami must decide whether one tree is a SUBTREE of another. How does Same Tree help?",
        options: [
          'Walk the big tree and run the same-tree check from every node whose value matches the subtree\'s root',
          'Compare the two trees\' heights',
          'Check that every value in the small tree appears in the big one',
          'Flatten both and search for a substring'
        ],
        correct: 0,
        explain: 'Subtree of Another Tree is built directly on this one — O(m · n) in the worst case, and perfectly acceptable. Value containment is far too weak, and the flatten-and-substring approach works only if nulls are serialised carefully, for the reason above.',
        hint: 'A subtree match is an exact match, anchored somewhere. What anchors it?'
      },
      {
        tag: 'TWEAK',
        q: "The check relaxes to \"same shape, values ignored\". What changes?",
        options: [
          'Drop the value comparison and keep the two null cases — the structure check is the recursion itself',
          'Nothing changes',
          'Compare the node counts instead',
          'It becomes a traversal comparison'
        ],
        correct: 0,
        explain: 'Stripping the value test leaves exactly the structural skeleton, which shows how little of the recursion was about values. Comparing node counts is not enough — two trees of the same size can have wildly different shapes.',
        hint: 'Which single clause in the return statement mentions the values?'
      }
    ]
  };

  E['invert-binary-tree'] = {
    id: 'invert-binary-tree',
    epNumber: 142,
    title: 'The Mirror-Image Dock',
    arc: 'Water Seven',
    patternId: 'tree-dfs-bfs',
    scene: 'forest',
    leetcode: { name: 'Invert Binary Tree', number: 226, difficulty: 'Easy', url: 'https://leetcode.com/problems/invert-binary-tree/' },
    problem: 'Given the root of a binary tree, invert it — swap every node\'s left and right subtrees — and return the root.',
    example: 'tree = [4,2,7,1,3,6,9]  →  [4,7,2,9,6,3,1]',

    h: 210,
    props: [
      { id: 'i4', emoji: '⚓', label: '4', x: 50, y: 22 },
      { id: 'i2', emoji: '⚓', label: '2', x: 28, y: 50 },
      { id: 'i7', emoji: '⚓', label: '7', x: 72, y: 50 },
      { id: 'i1', emoji: '⚓', label: '1', x: 16, y: 76 },
      { id: 'i3', emoji: '⚓', label: '3', x: 40, y: 76 }
    ],
    ledger: [
      { id: 'S', x: 50, y: 94 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "Dock One's layout has to be rebuilt as a mirror image — every berth that was on the left goes to the right, all the way down.",
        p: { i4: 'lit', i2: 'lit', i7: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is one of the shortest recursions there is. Swap this node's two children, then invert each of them. Or invert them first and then swap — both orders work.",
        p: { S: 'lit' }, l: { S: 'swap, then recurse' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Four's children swap: seven comes left, two goes right. Then two's own children swap, and seven's.",
        p: { i2: 'good', i7: 'good', i1: 'good', i3: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Why do both orders work? Surely one of them mangles it.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Because the swap only touches this node's two pointers, and the recursion only touches what is below them. The two operations are independent, so their order is free.",
        p: { S: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "The null case is the whole base case — an absent node inverts to an absent node.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And if the recursion depth worries you, the iterative version is the same thing with a queue or a stack: take a node, swap its children, push both.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "It's famous, this one. Someone was turned down for a job over it.",
        sfx: 'gong'
      }
    ],

    insight: 'When an operation on a node and the recursion into its children touch disjoint state, their order does not matter — which is why inverting a tree reads the same top-down or bottom-up.',
    complexity: '<b>Time O(n)</b> — every node visited once. <b>Space O(h)</b> for the recursion, or O(w) for the iterative BFS version.',
    pitfall: 'Recursing into <code>node.left</code> after already overwriting it, so one subtree is inverted twice and the other not at all — swap using a simultaneous assignment or a temporary.',
    solution: `def invert_tree(root):
    if not root:
        return None
    # Simultaneous swap: assigning left first would lose the original.
    root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper writes <code>root.left = invert(root.right)</code> then <code>root.right = invert(root.left)</code> on separate lines. What happens?",
        options: [
          'The second line reads the already-overwritten left pointer, so the original left subtree is lost and one side is inverted twice',
          'Nothing; the lines are equivalent to a simultaneous swap',
          'It crashes',
          'Only the root is affected'
        ],
        correct: 0,
        explain: 'The classic swap-without-a-temporary bug. By the second line, root.left already holds the inverted right subtree, so it gets inverted again and assigned to root.right — and the original left subtree has no reference left. Simultaneous assignment or a temporary variable is required.',
        hint: 'After the first line, what does root.left point to?'
      },
      {
        tag: 'TRANSFER',
        q: "Different dock, same recursion: Nami must check whether a tree is SYMMETRIC about its centre. How does inversion relate?",
        options: [
          'A tree is symmetric exactly when it equals its own inversion — though the direct two-pointer comparison avoids mutating anything',
          'A symmetric tree is one that inverts to itself only if it is complete',
          'They are unrelated',
          'Symmetry requires inverting twice'
        ],
        correct: 0,
        explain: 'The relationship is real and worth seeing, but the practical solution compares left against right directly — recursing with two pointers that move outward in mirror — because it needs no mutation and stops early on a mismatch.',
        hint: 'What does it mean for a tree to be unchanged by mirroring?'
      },
      {
        tag: 'TWEAK',
        q: "The tree has a million nodes and is severely unbalanced. What is the risk with the recursive version?",
        options: [
          'Stack overflow — the recursion depth equals the tree height, which is O(n) on a degenerate tree',
          'It becomes O(n²)',
          'The swap becomes incorrect',
          'No risk; recursion depth is always O(log n)'
        ],
        correct: 0,
        explain: 'Recursion depth is height, not node count — but on a chain-shaped tree those are the same. The iterative version with an explicit queue moves that memory to the heap and removes the limit, which is the standard follow-up answer.',
        hint: 'What shape must a tree have for its height to equal its node count?'
      }
    ]
  };

  E['symmetric-tree'] = {
    id: 'symmetric-tree',
    epNumber: 143,
    title: 'The Shipyard That Mirrors Itself',
    arc: 'Water Seven',
    patternId: 'tree-dfs-bfs',
    scene: 'forest',
    leetcode: { name: 'Symmetric Tree', number: 101, difficulty: 'Easy', url: 'https://leetcode.com/problems/symmetric-tree/' },
    problem: 'Given the root of a binary tree, determine whether it is a mirror image of itself about its centre.',
    example: 'tree = [1,2,2,3,4,4,3]  →  true;    tree = [1,2,2,null,3,null,3]  →  false',

    h: 210,
    props: [
      { id: 'm1', emoji: '🏗️', label: '1', x: 50, y: 22 },
      { id: 'm2', emoji: '🏗️', label: '2', x: 30, y: 50 },
      { id: 'm3', emoji: '🏗️', label: '2', x: 70, y: 50 },
      { id: 'm4', emoji: '🏗️', label: '3', x: 18, y: 78 },
      { id: 'm5', emoji: '🏗️', label: '3', x: 82, y: 78 }
    ],
    ledger: [
      { id: 'M', x: 50, y: 94 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The shipyard is supposed to be perfectly symmetric — everything on the left mirrored on the right, all the way down.",
        p: { m1: 'lit', m2: 'lit', m3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So compare the left subtree with the right subtree. But not node for node in the same direction — mirrored.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which means the recursion carries TWO pointers that move in opposite directions. The left one's left child pairs with the right one's RIGHT child, and vice versa.",
        p: { M: 'lit' }, l: { M: 'left.left ↔ right.right' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "That crossing is the entire problem, isn't it. Compare them in the same direction and you'd be checking whether the two halves are identical, not mirrored.",
        p: { m4: 'good', m5: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Exactly. Two nodes mirror when their values agree AND the outer pair mirrors AND the inner pair mirrors.",
        p: { m2: 'good', m3: 'good' }, l: { M: 'symmetric ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And both absent is a match, exactly one absent is a mismatch — the same two null cases as comparing two trees.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The iterative form pushes nodes onto a queue IN PAIRS, which keeps the mirroring explicit rather than relying on the recursion to carry it.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Checking a whole level for being a palindrome would also work, but you'd have to include the nulls or the shape slips through.",
        sfx: 'gong'
      }
    ],

    insight: 'Symmetry is a claim about pairs, so the recursion carries two pointers that descend in opposite directions — outer against outer, inner against inner.',
    complexity: '<b>Time O(n)</b> — each node visited once. <b>Space O(h)</b> for the recursion, or O(w) for the paired-queue version.',
    pitfall: 'Comparing <code>left.left</code> with <code>right.left</code>, which tests whether the halves are identical rather than mirrored. And forgetting that a level check must include nulls, or [1,2,2,null,3,null,3] passes.',
    solution: `def is_symmetric(root):
    def mirrors(a, b):
        if not a and not b:
            return True
        if not a or not b:
            return False
        # The crossing is the whole idea: outer pair, then inner pair.
        return (a.val == b.val
                and mirrors(a.left, b.right)
                and mirrors(a.right, b.left))

    return not root or mirrors(root.left, root.right)`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper recurses with <code>mirrors(a.left, b.left)</code> and <code>mirrors(a.right, b.right)</code>. What is he actually testing?",
        options: [
          'Whether the two subtrees are IDENTICAL rather than mirrored — so [1,2,2,3,4,4,3] would fail',
          'Whether the tree is complete',
          'Nothing; the two versions are equivalent',
          'Whether the tree is a BST'
        ],
        correct: 0,
        explain: 'Without the crossing, the check compares the two halves in the same orientation. On a genuinely symmetric tree the halves are mirror images, not copies, so his version rejects correct input. The single swap of left and right in the recursive calls is the entire algorithm.',
        hint: 'Take [1,2,2,3,4,4,3] and compare the left subtree with the right one node by node in the same direction.'
      },
      {
        tag: 'TWEAK',
        q: "Nami checks symmetry by reading each level into a list and testing whether the list is a palindrome. When does that fail?",
        options: [
          'When nulls are omitted — [1,2,2,null,3,null,3] has the level [3,3], which reads as a palindrome despite the tree being asymmetric',
          'It never fails',
          'Only on trees deeper than three levels',
          'Only when values repeat'
        ],
        correct: 0,
        explain: 'Dropping nulls loses the positional information that symmetry is about. Including them as explicit placeholders makes the level-palindrome check correct — and it is essentially the paired-queue solution wearing a different hat.',
        hint: 'Write out the third level of [1,2,2,null,3,null,3], first with nulls and then without.'
      },
      {
        tag: 'TRANSFER',
        q: "Different yard: Franky wants to know whether two SEPARATE trees are mirror images of each other. What changes?",
        options: [
          'Nothing but the entry point — call the same mirroring helper on the two roots instead of on one root\'s two children',
          'It requires inverting one tree first',
          'It needs a different recursion',
          'It cannot be done without extra space'
        ],
        correct: 0,
        explain: 'The helper never assumed the two pointers came from the same tree — a nice illustration of writing the recursive helper in terms of what it actually needs. Inverting one tree and comparing also works, at the cost of mutating an input.',
        hint: 'Look at the helper\'s parameters. Does it care where the two nodes came from?'
      }
    ]
  };
  E['construct-tree-preorder-inorder'] = {
    id: 'construct-tree-preorder-inorder',
    epNumber: 144,
    title: 'Rebuilding the Ship From Two Manifests',
    arc: 'Water Seven',
    patternId: 'tree-dfs-bfs',
    scene: 'forest',
    leetcode: { name: 'Construct Binary Tree from Preorder and Inorder Traversal', number: 105, difficulty: 'Medium', url: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/' },
    problem: 'Given the preorder and inorder traversals of a binary tree with distinct values, reconstruct the tree.',
    example: 'preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]  →  the tree [3,9,20,null,null,15,7]',

    h: 210,
    props: [
      { id: 'pre', emoji: '📋', label: 'pre: 3 9 20 15 7', x: 50, y: 24 },
      { id: 'ino', emoji: '📋', label: 'in: 9 3 15 20 7', x: 50, y: 48 },
      { id: 'rt', emoji: '🌳', label: 'root = 3', x: 26, y: 74 },
      { id: 'sp', emoji: '✂️', label: 'split inorder', x: 72, y: 74 }
    ],
    ledger: [
      { id: 'X', x: 50, y: 94 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The ship's frame was catalogued twice, in two different orders, and the drawing itself is lost. Can we rebuild it from the two lists alone?",
        p: { pre: 'lit', ino: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Each list gives one thing the other cannot. Preorder visits the root FIRST, so its first entry names the root immediately.",
        p: { rt: 'good' }, l: { X: 'preorder → the root' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And inorder visits everything on the left, then the root, then everything on the right. So finding the root inside the inorder list splits it into the two subtrees.",
        p: { sp: 'good' }, l: { X: 'inorder → the two sizes' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Root is 3. In the inorder list, 9 lies to its left and 15, 20, 7 to its right — so the left subtree holds one node and the right holds three.",
        p: { ino: 'good' },
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And those sizes tell us how to cut the preorder list too. The next one entry is the whole left subtree; the three after that are the right.",
        p: { pre: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then recurse on each half with the same rule. Every node is created exactly once.",
        p: { rt: 'good', sp: 'good' }, l: { X: 'rebuilt ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "The 'find the root in the inorder list' step worries me. If that's a linear scan every time, it's quadratic.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So index the inorder positions in a map once, up front. Then the split is a lookup and the whole build is linear. And note that distinct values are a precondition — with duplicates, the split is ambiguous.",
        sfx: 'gong'
      }
    ],

    insight: 'Preorder names the root, inorder splits the remainder into the two subtree sizes — and pre-indexing the inorder positions is what keeps the reconstruction linear.',
    complexity: '<b>Time O(n)</b> with an inorder index map; O(n²) if you scan for the root each time. <b>Space O(n)</b> for the map plus O(h) recursion.',
    pitfall: 'Searching the inorder list linearly at every level, which is quadratic on a degenerate tree. And assuming duplicates are fine — they make the split ambiguous and the problem unsolvable.',
    solution: `def build_tree(preorder, inorder):
    index = {v: i for i, v in enumerate(inorder)}   # O(1) splits
    pre = 0

    def build(lo, hi):
        nonlocal pre
        if lo > hi:
            return None
        val = preorder[pre]          # preorder names the root
        pre += 1
        node = TreeNode(val)
        mid = index[val]             # inorder gives the two subtree sizes
        node.left = build(lo, mid - 1)
        node.right = build(mid + 1, hi)
        return node

    return build(0, len(inorder) - 1)`,

    quiz: [
      {
        tag: 'TWEAK',
        q: "Nami is given the postorder and inorder traversals instead. What changes?",
        options: [
          'Read postorder from the BACK for the root, and build the right subtree before the left',
          'Nothing; postorder behaves like preorder',
          'It cannot be reconstructed from those two',
          'Reverse the inorder list first'
        ],
        correct: 0,
        explain: 'Postorder puts the root last, so consuming it in reverse mirrors the preorder version — and because you are consuming from the right, the right subtree must be built first or the indices desynchronise. That is LeetCode 106, and the order swap is the one detail people miss.',
        hint: 'Where does postorder put the root, and which end will you be consuming from?'
      },
      {
        tag: 'PITFALL',
        q: "Chopper is given preorder and POSTORDER only, with no inorder. Can he reconstruct the tree?",
        options: [
          'Not uniquely — those two cannot distinguish a single left child from a single right child',
          'Yes, always',
          'Yes, if the tree is balanced',
          'Only if the values are sorted'
        ],
        correct: 0,
        explain: 'Inorder is what supplies the left/right split. Without it, a root with one child gives identical preorder and postorder either way. (A unique reconstruction is possible if every node has 0 or 2 children — a nice follow-up.)',
        hint: 'Write preorder and postorder for a root with only a left child, then for the same root with only a right child.'
      },
      {
        tag: 'TRANSFER',
        q: "Different manifest: Franky must build a balanced BST from a sorted array. How does that compare?",
        options: [
          'A sorted array IS the inorder traversal, but with no preorder to name the root — so you are free to choose the middle and get balance',
          'It is the same problem',
          'It requires both traversals',
          'It cannot be done recursively'
        ],
        correct: 0,
        explain: 'A neat contrast: here the preorder pins down the root, so the shape is forced. With only an inorder list, the root is a free choice — and choosing the middle is what buys the balance. Same split, different amount of freedom.',
        hint: 'Which of the two traversals was telling you the root, and what happens when it is missing?'
      }
    ]
  };

  E['construct-tree-inorder-postorder'] = {
    id: 'construct-tree-inorder-postorder',
    epNumber: 145,
    title: 'The Same Frame, Catalogued Backwards',
    arc: 'Water Seven',
    patternId: 'tree-dfs-bfs',
    scene: 'forest',
    leetcode: { name: 'Construct Binary Tree from Inorder and Postorder Traversal', number: 106, difficulty: 'Medium', url: 'https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/' },
    problem: 'Given the inorder and postorder traversals of a binary tree with distinct values, reconstruct the tree.',
    example: 'inorder = [9,3,15,20,7], postorder = [9,15,7,20,3]  →  the tree [3,9,20,null,null,15,7]',

    h: 210,
    props: [
      { id: 'po', emoji: '📋', label: 'post: 9 15 7 20 3', x: 50, y: 26 },
      { id: 'in2', emoji: '📋', label: 'in: 9 3 15 20 7', x: 50, y: 50 },
      { id: 'bk', emoji: '⬅️', label: 'read from the back', x: 30, y: 76 },
      { id: 'rl', emoji: '↩️', label: 'right before left', x: 72, y: 76 }
    ],
    ledger: [
      { id: 'Y', x: 50, y: 94 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "Same frame, but this time the second catalogue is postorder — children before parents, root recorded last of all.",
        p: { po: 'lit', in2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So the root is at the END. Consume the postorder list from the back and it behaves exactly like preorder consumed from the front.",
        p: { bk: 'good' }, l: { Y: 'root = last of postorder' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Three is last, so three is the root. Then inorder splits as before: 9 on the left, 15, 20, 7 on the right.",
        p: { in2: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "But there's a catch. Reading backwards, the next value after the root is 20 — which is the RIGHT subtree's root, not the left's.",
        p: { rl: 'lit' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is the one detail that separates this from its sibling problem: build the right subtree BEFORE the left, or the pointer into the postorder list falls out of step.",
        p: { rl: 'good' }, l: { Y: 'right subtree first ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Everything else is identical — the inorder index map, the recursive split, the linear total.",
        p: { po: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So knowing one of these two really is knowing both, as long as you notice which direction you're consuming from.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And that is the useful habit: when a problem looks like one you know, find the single axis it differs on rather than starting over.",
        sfx: 'gong'
      }
    ],

    insight: 'Postorder consumed from the back is preorder consumed from the front — but the consumption direction forces the right subtree to be built first, or the shared pointer desynchronises.',
    complexity: '<b>Time O(n)</b> with an inorder index map. <b>Space O(n)</b> for the map plus O(h) recursion.',
    pitfall: 'Building the left subtree first, which consumes postorder entries that belong to the right subtree. The result is a plausible tree with the wrong shape rather than a crash.',
    solution: `def build_tree(inorder, postorder):
    index = {v: i for i, v in enumerate(inorder)}
    post = len(postorder) - 1        # consume from the back

    def build(lo, hi):
        nonlocal post
        if lo > hi:
            return None
        val = postorder[post]
        post -= 1
        node = TreeNode(val)
        mid = index[val]
        # RIGHT first: reading backwards, the right subtree comes next.
        node.right = build(mid + 1, hi)
        node.left = build(lo, mid - 1)
        return node

    return build(0, len(inorder) - 1)`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper copies the preorder solution and builds the LEFT subtree first while consuming postorder from the back. What is the symptom?",
        options: [
          'A well-formed tree with the wrong shape — the left subtree receives nodes that belong to the right',
          'A crash on an index error',
          'An infinite recursion',
          'Nothing; the order does not matter'
        ],
        correct: 0,
        explain: 'The shared consumption pointer is the coupling. Reading backwards, the entries immediately before the root belong to the right subtree, so claiming them for the left silently misassigns whole branches. It returns a tree, which is what makes it hard to spot.',
        hint: 'Reading postorder backwards from the root, whose nodes come next?'
      },
      {
        tag: 'TRANSFER',
        q: "Different catalogue: Nami has preorder and postorder for a tree in which every node has either 0 or 2 children. Can she rebuild it?",
        options: [
          'Yes — with no single-child nodes the ambiguity disappears, and the second preorder value identifies the left subtree\'s root',
          'No, inorder is always required',
          'Only if the tree is balanced',
          'Only if the values are sorted'
        ],
        correct: 0,
        explain: 'The ambiguity in pre+post is exactly the single-child case, so forbidding it restores uniqueness. That is LeetCode 889 — a good example of how a structural guarantee can replace an entire missing traversal.',
        hint: 'Which shape made preorder and postorder identical for two different trees?'
      },
      {
        tag: 'TWEAK',
        q: "The values are no longer distinct. What breaks in both reconstruction problems?",
        options: [
          'The inorder index lookup becomes ambiguous, so the split point is no longer determined',
          'Only the recursion depth changes',
          'Nothing; duplicates are handled naturally',
          'The root can no longer be identified'
        ],
        correct: 0,
        explain: 'The root is still identifiable, but finding WHERE it sits in the inorder list is not — and that position is what determines the two subtree sizes. Distinctness is a load-bearing precondition in both problems, not a convenience.',
        hint: 'Which step of the algorithm assumes a value appears exactly once?'
      }
    ]
  };

  E['populating-next-right-pointers-ii'] = {
    id: 'populating-next-right-pointers-ii',
    epNumber: 146,
    title: 'Stringing a Rope Along Each Deck',
    arc: 'Water Seven',
    patternId: 'tree-dfs-bfs',
    scene: 'forest',
    leetcode: { name: 'Populating Next Right Pointers in Each Node II', number: 117, difficulty: 'Medium', url: 'https://leetcode.com/problems/populating-next-right-pointers-in-each-node-ii/' },
    problem: 'Given a binary tree where each node has an extra next pointer, set each next pointer to the node immediately to its right on the same level, or null if there is none. The tree need not be perfect.',
    example: 'Each level becomes a linked list, left to right, ending in null.',

    h: 210,
    props: [
      { id: 'lv', emoji: '🪢', label: 'level as a list', x: 50, y: 26 },
      { id: 'cu', emoji: '👉', label: 'walk this level', x: 26, y: 56 },
      { id: 'nx', emoji: '🧵', label: 'build the next', x: 74, y: 56 }
    ],
    ledger: [
      { id: 'R', x: 50, y: 86 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Every deck of the shipyard needs a guide rope running left to right, joining each platform to the one beside it. Some decks have gaps — the tree isn't perfect.",
        p: { lv: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Level-order traversal with a queue would do it — snapshot the level, link them in order.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "It would, at O of width memory. But there is a version with none at all, and it is a lovely idea: once a level has been strung, that level IS a linked list you can walk.",
        p: { cu: 'good' }, l: { R: 'walk level n to build n+1' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So we use the rope we just tied to walk along and tie the next one.",
        p: { nx: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Walk the current level through its next pointers, and for each node hang its children onto a growing list for the level below. A dummy head makes that list painless.",
        p: { lv: 'good' }, l: { R: 'O(1) extra space ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And gaps don't matter — we only ever attach children that exist, so the next level's rope skips the holes automatically.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is exactly why the perfect-tree version of this problem is easier: there, a node's left child always connects to its right child, and no walking is needed.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Using the structure you have just built as the scaffolding for the next piece. That's a genuinely satisfying trick.",
        sfx: 'gong'
      }
    ],

    insight: 'Once a level is linked, it becomes a list you can traverse — so each level can be used as the scaffolding to build the level below it, removing the queue entirely.',
    complexity: '<b>Time O(n)</b> — every node visited once. <b>Space O(1)</b> with the level-walking version, or O(w) with a BFS queue.',
    pitfall: 'Assuming a node\'s right child follows its left child, which only holds for a perfect tree. With gaps, the next node on the level below may be several parents away.',
    solution: `def connect(root):
    node = root
    while node:
        dummy = tail = Node(0)       # head of the level being built
        while node:                  # walk the current level via next
            if node.left:
                tail.next = node.left
                tail = tail.next
            if node.right:
                tail.next = node.right
                tail = tail.next
            node = node.next
        node = dummy.next            # descend to the level just built
    return root`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper writes <code>node.left.next = node.right</code> and <code>node.right.next = node.next.left</code>, the solution to the perfect-tree version. Where does it break here?",
        options: [
          'Whenever a node lacks a child, or the next node on the level lacks a left child — the assumed neighbours may not exist',
          'Only on trees deeper than three levels',
          'It does not break; it is equivalent',
          'Only when the root has one child'
        ],
        correct: 0,
        explain: 'The perfect-tree shortcut relies on every node having both children so that neighbours are predictable. With gaps you must search rightward along the parent level for the next existing child — which is exactly what the dummy-and-tail walk does implicitly.',
        hint: 'What is "the next node to the right" when the adjacent parent has no children at all?'
      },
      {
        tag: 'TWEAK',
        q: "The interviewer accepts O(width) space. What is the simplest correct solution?",
        options: [
          'Standard level-order BFS: snapshot the level size, drain exactly that many, and link each node to the next one drained',
          'Recursive DFS with no bookkeeping',
          'Two passes over the tree',
          'Sort each level'
        ],
        correct: 0,
        explain: 'This is the honest first answer, and it is worth giving before the O(1) version. The level-size snapshot is the same building block as every other level-order problem — right side view, averages, zigzag.',
        hint: 'What does the queue length tell you at the top of each round of a BFS?'
      },
      {
        tag: 'TRANSFER',
        q: "Different rope: Nami must find, for each node, the value immediately to its right on the same level — without adding pointers to the nodes. What changes?",
        options: [
          'Nothing structural — the same level walk, recording pairs instead of assigning next pointers',
          'It requires a full BFS with a queue',
          'It becomes O(n log n)',
          'It cannot be done in one pass'
        ],
        correct: 0,
        explain: 'The traversal is independent of what you do with each level. Without a next field to reuse, though, you do lose the O(1)-space trick — the scaffolding only exists because the pointers are stored in the tree itself.',
        hint: 'The O(1) version reused the next pointers it had already written. What if there are none to write?'
      }
    ]
  };

  E['flatten-tree-to-list'] = {
    id: 'flatten-tree-to-list',
    epNumber: 147,
    title: 'Laying the Frame Out Flat',
    arc: 'Water Seven',
    patternId: 'tree-dfs-bfs',
    scene: 'forest',
    leetcode: { name: 'Flatten Binary Tree to Linked List', number: 114, difficulty: 'Medium', url: 'https://leetcode.com/problems/flatten-binary-tree-to-linked-list/' },
    problem: 'Flatten a binary tree into a linked list in place, using the right pointers, in preorder. Every left pointer must end up null.',
    example: 'tree = [1,2,5,3,4,null,6]  →  1 → 2 → 3 → 4 → 5 → 6, all via right pointers',

    h: 210,
    props: [
      { id: 'f1', emoji: '🪵', label: '1', x: 50, y: 22 },
      { id: 'f2', emoji: '🪵', label: '2', x: 28, y: 48 },
      { id: 'f5', emoji: '🪵', label: '5', x: 72, y: 48 },
      { id: 'f3', emoji: '🪵', label: '3', x: 16, y: 74 },
      { id: 'f4', emoji: '🪵', label: '4', x: 40, y: 74 }
    ],
    ledger: [
      { id: 'F', x: 50, y: 94 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "The frame has to be laid out flat along the dock, in the order you would meet the timbers walking the tree — root, then everything left, then everything right.",
        p: { f1: 'lit', f2: 'lit', f5: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Collect the preorder into a list and then re-link? That works, but it needs a whole list of nodes.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "There is an in-place version with no extra structure. For each node that has a left subtree, find the RIGHTMOST node of that subtree — the last timber you would meet walking it.",
        p: { F: 'lit' }, l: { F: 'find the left subtree\'s tail' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And attach the current right subtree onto that tail, because in preorder the right subtree comes immediately after everything on the left.",
        p: { f3: 'good', f4: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then move the whole left subtree over to the right pointer, and set the left pointer to null. Advance to the new right and repeat.",
        p: { f2: 'good', f5: 'good' }, l: { F: '1 2 3 4 5 6 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So the tree unrolls itself one node at a time, and nothing is ever stored.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Constant space, and linear time — each node is visited once as the current node and at most once while searching for a tail.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Setting the left pointers to null isn't optional either. The problem says the result must be a proper list.",
        p: { f1: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'In preorder the right subtree follows everything in the left subtree — so splicing the right subtree onto the left subtree\'s rightmost node unrolls the tree in place, with no storage at all.',
    complexity: '<b>Time O(n)</b> — amortised, since each node is passed over a bounded number of times. <b>Space O(1)</b> for the Morris-style version, or O(n) if you collect the preorder first.',
    pitfall: 'Forgetting to null the left pointers, which leaves a tree rather than a list. And attaching the right subtree to the left subtree\'s root instead of to its rightmost node.',
    solution: `def flatten(root):
    node = root
    while node:
        if node.left:
            # The right subtree follows everything in the left subtree.
            tail = node.left
            while tail.right:
                tail = tail.right
            tail.right = node.right
            node.right = node.left
            node.left = None          # required: it must become a list
        node = node.right`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp attaches the right subtree to <code>node.left</code> rather than to the rightmost node of the left subtree. What is the result?",
        options: [
          'The left subtree\'s own right child is overwritten, losing that whole branch',
          'The order is reversed but nothing is lost',
          'It produces a valid list in postorder',
          'Nothing; the two are equivalent'
        ],
        correct: 0,
        explain: 'node.left.right already points at part of the left subtree, so overwriting it discards everything hanging there. The rightmost node is by definition the one whose right pointer is free — which is precisely why the search for it exists.',
        hint: 'What is already stored in node.left.right before the assignment?'
      },
      {
        tag: 'TWEAK',
        q: "The flattening must be in POSTORDER instead of preorder. Is the same splice possible?",
        options: [
          'Not directly — postorder puts the root last, so the natural approach is a reverse-postorder walk that prepends each node to a running head',
          'Yes, with left and right swapped',
          'Yes, unchanged',
          'No, postorder flattening is impossible'
        ],
        correct: 0,
        explain: 'The in-place splice works because in preorder the root leads its subtrees, so the current node can immediately become the list head. In postorder it must come last, which inverts the construction — build the list backwards, prepending as you go.',
        hint: 'Where does the root sit in the output for each traversal order?'
      },
      {
        tag: 'TRANSFER',
        q: "Different frame: Nami must flatten a multilevel doubly linked list where nodes may have a child list. What is the shared idea?",
        options: [
          'Splice the child list in and reattach the original next to the child list\'s tail — the same "find the tail, then reconnect" move',
          'Sort all the nodes by depth',
          'Use a queue of pending child lists',
          'They are unrelated problems'
        ],
        correct: 0,
        explain: 'LeetCode 430, and the shape is identical: a nested structure is unrolled by finding where the inserted piece ends and reconnecting what followed. A stack of pending tails also works and is the common iterative form — but the tail-splice is the same idea in both problems.',
        hint: 'When you splice one list into the middle of another, what do you need to find first?'
      }
    ]
  };

  E['path-sum'] = {
    id: 'path-sum',
    epNumber: 148,
    title: 'The Route That Spends Exactly Enough',
    arc: 'Water Seven',
    patternId: 'tree-dfs-bfs',
    scene: 'forest',
    leetcode: { name: 'Path Sum', number: 112, difficulty: 'Easy', url: 'https://leetcode.com/problems/path-sum/' },
    problem: 'Given the root of a binary tree and a target sum, determine whether any root-to-leaf path\'s values add up to exactly that sum.',
    example: 'tree = [5,4,8,11,null,13,4,7,2], target = 22  →  true   (5 → 4 → 11 → 2)',

    h: 210,
    props: [
      { id: 'a5', emoji: '💴', label: '5', x: 50, y: 22 },
      { id: 'a4', emoji: '💴', label: '4', x: 28, y: 48 },
      { id: 'a11', emoji: '💴', label: '11', x: 28, y: 72 },
      { id: 'a2', emoji: '💴', label: '2', x: 44, y: 92 }
    ],
    ledger: [
      { id: 'T', x: 76, y: 76 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The route through the city costs something at every crossing, and we need to know whether any route from the gate to a dead end spends exactly twenty-two.",
        p: { a5: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Carry the remaining budget down instead of the total spent. At each crossing, subtract its cost and hand the rest to the children.",
        p: { T: 'lit' }, l: { T: 'budget: 22 → 17 → 13 → 2' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Twenty-two minus five is seventeen. Minus four is thirteen. Minus eleven is two. And the leaf costs exactly two.",
        p: { a4: 'good', a11: 'good', a2: 'good' }, l: { T: 'exactly 0 at a leaf ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The test happens only at a LEAF — a node with no children at all. Reaching zero halfway down means nothing, because the path is not finished.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And a node with one child isn't a leaf, even though it feels like the end of that side.",
        p: { a11: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is where most wrong answers come from. Test for BOTH children being absent, not either — and never treat a null child as a zero-cost leaf, or an empty side will fabricate a path.",
        p: { a11: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "The answer is an OR across the two children — either side finding a route is enough.",
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And negative values are allowed, so you cannot prune when the budget goes below zero. Without that guarantee, an obvious optimisation becomes a bug.",
        sfx: 'gong'
      }
    ],

    insight: 'Carry the remaining budget down and test only at a genuine leaf — both children absent — because a partial path reaching zero proves nothing.',
    complexity: '<b>Time O(n)</b> — every node visited once in the worst case. <b>Space O(h)</b> for the recursion stack.',
    pitfall: 'Treating a node with one child as a leaf, or treating a null child as a valid endpoint — both invent paths that do not exist. And pruning on a negative remainder, which is wrong when negative values are allowed.',
    solution: `def has_path_sum(root, target_sum):
    if not root:
        return False                     # not a leaf: an empty side proves nothing
    remaining = target_sum - root.val
    if not root.left and not root.right: # a genuine leaf: both children absent
        return remaining == 0
    return (has_path_sum(root.left, remaining)
            or has_path_sum(root.right, remaining))`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper's base case is <code>if not root: return target_sum == 0</code>. On the tree [1, 2] with target 1, what does he return?",
        options: [
          'True, wrongly — the root\'s missing right child is treated as a completed path',
          'False, correctly',
          'True, and that is correct',
          'It crashes'
        ],
        correct: 0,
        explain: 'After the root, the remaining budget is 0, and the absent right child hits his base case and reports success — but there is no root-to-leaf path ending there. Node 2 is the only leaf, and the path 1 → 2 sums to 3. The leaf test must be about the node, not about running out of tree.',
        hint: 'Trace the recursion into the root\'s missing right child.'
      },
      {
        tag: 'TWEAK',
        q: "The problem now asks for ALL root-to-leaf paths that hit the target, not just whether one exists. What changes?",
        options: [
          'Carry the current path as you descend, record a COPY at a matching leaf, and un-choose on the way back up',
          'Nothing but the return type',
          'It requires BFS instead of DFS',
          'The remaining-budget trick no longer works'
        ],
        correct: 0,
        explain: 'That is Path Sum II, and it turns a search into a backtracking enumeration. The copy at the leaf is essential — the path list is one shared object that keeps mutating — which is the same trap as in every other backtracking problem.',
        hint: 'The path buffer is a single object. What must you store when you find a match?'
      },
      {
        tag: 'TRANSFER',
        q: "Different route: Nami counts paths summing to the target that may START and END anywhere, not just root to leaf. What technique applies?",
        options: [
          'Prefix sums along the current root-to-node path, with a map of how many times each running total has been seen',
          'The same leaf test with a different base case',
          'A full O(n²) search from every node',
          'Sorting the node values'
        ],
        correct: 0,
        explain: 'That is Path Sum III, and it is the tree version of "subarray sum equals k" — a running total plus a count map, with the map entry removed on the way back up so it only ever reflects the current ancestor chain. The O(n²) search also works and is a reasonable first answer.',
        hint: 'On an array, how do you count subarrays summing to k in one pass?'
      }
    ]
  };
  E['sum-root-to-leaf-numbers'] = {
    id: 'sum-root-to-leaf-numbers',
    epNumber: 149,
    title: 'Every Serial Number on the Hull',
    arc: 'Water Seven',
    patternId: 'tree-dfs-bfs',
    scene: 'forest',
    leetcode: { name: 'Sum Root to Leaf Numbers', number: 129, difficulty: 'Medium', url: 'https://leetcode.com/problems/sum-root-to-leaf-numbers/' },
    problem: 'Each root-to-leaf path spells a number, one digit per node. Return the total of all such numbers.',
    example: 'tree = [1,2,3]  →  25   (the paths spell 12 and 13)',

    h: 210,
    props: [
      { id: 'd1', emoji: '🔢', label: '1', x: 50, y: 24 },
      { id: 'd2', emoji: '🔢', label: '2', x: 30, y: 54 },
      { id: 'd3', emoji: '🔢', label: '3', x: 70, y: 54 }
    ],
    ledger: [
      { id: 'N', x: 30, y: 84 },
      { id: 'M', x: 70, y: 84 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "Every plate on the hull carries a digit, and each route from the keel to an edge spells out a serial number. Iceberg wants them all added up.",
        p: { d1: 'lit', d2: 'lit', d3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Build the number as you descend rather than collecting digits and assembling at the end. Each step down multiplies the running number by ten and adds this node's digit.",
        l: { N: '1 → 12', M: '1 → 13' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So arriving at a leaf, the running number IS that path's serial. Twelve on one side, thirteen on the other.",
        p: { d2: 'good', d3: 'good' }, l: { N: '12', M: '13' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And the total is the sum of what the two children report. A node with one child reports only that side — the absent side contributes nothing, not a zero-length number.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Which is the trap again. If a null child returned the running number, a node with one child would count its serial twice.",
        p: { d1: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So a null child returns zero, and the leaf test is once more 'both children absent'. Twenty-five in total.",
        p: { d1: 'good' }, l: { N: '12 + 13 = 25 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Carrying the value down and summing the results back up — information flowing both ways through the same recursion.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That pairing — a parameter descending, a return value ascending — is the shape of most tree problems worth the name.",
        sfx: 'gong'
      }
    ],

    insight: 'Information flows both ways through a tree recursion: a parameter carries context down, and the return value carries results back up — here the running number descends and the summed totals ascend.',
    complexity: '<b>Time O(n)</b> — every node once. <b>Space O(h)</b> for the recursion stack.',
    pitfall: 'Returning the running number from a null child, which double-counts every node that has exactly one child. And rebuilding the number from a digit list at each leaf, which is O(depth) extra work per path for no benefit.',
    solution: `def sum_numbers(root):
    def walk(node, running):
        if not node:
            return 0                       # an absent side contributes nothing
        running = running * 10 + node.val
        if not node.left and not node.right:
            return running                 # a genuine leaf: this is the serial
        return walk(node.left, running) + walk(node.right, running)

    return walk(root, 0)`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper writes <code>if not node: return running</code> as the base case. On the tree [1, 2] — a root with only a left child — what does he get?",
        options: [
          '24 instead of 12 — the root\'s absent right child reports 1 and the leaf\'s two absent children report 12 each',
          '12, correctly',
          '13',
          'It crashes'
        ],
        correct: 0,
        explain: 'Every missing child becomes a phantom leaf reporting whatever number reached it. The rule is that a null contributes nothing, and completion is decided by "both children absent" at a real node — exactly as in Path Sum.',
        hint: 'Count how many times the recursion hits a null pointer on that tiny tree.'
      },
      {
        tag: 'TRANSFER',
        q: "Different hull: Nami wants every root-to-leaf path returned as a string like \"1->2->5\". What is the smallest change?",
        options: [
          'Carry the path text down instead of a number, and record it at the leaf rather than summing',
          'Collect all node values first, then reconstruct',
          'Use BFS with a queue of paths',
          'It requires backtracking with an explicit stack'
        ],
        correct: 0,
        explain: 'Same skeleton with a different accumulator — string concatenation instead of arithmetic. Because strings are immutable in most languages, carrying the text down avoids the shared-buffer copy problem that a list-based path would introduce.',
        hint: 'What is being carried down in the number version, and what is its equivalent here?'
      },
      {
        tag: 'TWEAK',
        q: "The digits are base 2 rather than base 10. What changes?",
        options: [
          'Multiply the running value by 2 instead of 10 — the base appears in exactly one place',
          'The recursion must be rewritten',
          'It requires bit manipulation throughout',
          'Nothing; the base is irrelevant'
        ],
        correct: 0,
        explain: 'Building a number digit by digit is base-agnostic apart from the multiplier, which is the same observation as incrementing a counter in base 7. Recognising which constants encode the domain makes these variants free.',
        hint: 'Where in the code does the number 10 appear, and what does it represent?'
      }
    ]
  };

  E['binary-tree-maximum-path-sum'] = {
    id: 'binary-tree-maximum-path-sum',
    epNumber: 150,
    title: 'The Longest Beam in the Whole Frame',
    arc: 'Water Seven',
    patternId: 'tree-dfs-bfs',
    scene: 'forest',
    leetcode: { name: 'Binary Tree Maximum Path Sum', number: 124, difficulty: 'Hard', url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/' },
    problem: 'A path is any sequence of nodes joined by edges, appearing at most once each, and it need not pass through the root. Return the maximum sum of any path.',
    example: 'tree = [-10,9,20,null,null,15,7]  →  42   (15 → 20 → 7)',

    h: 210,
    props: [
      { id: 'x10', emoji: '🪚', label: '-10', x: 50, y: 22 },
      { id: 'x9', emoji: '🪚', label: '9', x: 28, y: 50 },
      { id: 'x20', emoji: '🪚', label: '20', x: 72, y: 50 },
      { id: 'x15', emoji: '🪚', label: '15', x: 60, y: 78 },
      { id: 'x7', emoji: '🪚', label: '7', x: 86, y: 78 }
    ],
    ledger: [
      { id: 'RET', x: 26, y: 92 },
      { id: 'BEST', x: 74, y: 92 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The strongest beam in the frame — but a beam can run up one branch, across a joint, and back down another. It doesn't have to pass through the keel at all.",
        p: { x15: 'lit', x20: 'lit', x7: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which forces two different quantities at every joint, and confusing them is the whole difficulty of this problem.",
        p: { RET: 'lit', BEST: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Two quantities at one joint? Surely a beam is a beam — what could the difference be?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "What you HAND YOUR PARENT is a beam that can be extended upward — so it may use only one branch, because a parent cannot walk down both. That is the node plus the better of its two sides.",
        p: { RET: 'good' }, l: { RET: 'return: node + max(one side)' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "What you RECORD as a candidate answer may bend at this joint and use BOTH sides — node plus left plus right. That beam is complete; it can never be extended.",
        p: { BEST: 'good' }, l: { BEST: 'record: node + left + right' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Fifteen plus twenty plus seven is forty-two, bending at the twenty. And what twenty hands upward is only thirty-five.",
        p: { x15: 'good', x20: 'good', x7: 'good' }, l: { BEST: '42 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And a branch that would weaken the beam?",
        p: { x10: 'bad' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Clamp it to zero — a harmful branch is simply not taken. But the recorded answer must still allow a single node, or an all-negative tree returns zero instead of its least bad node.",
        p: { x10: 'dim' },
        sfx: 'error'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "One value to propagate, another to record. Once you separate those, the code is six lines.",
        sfx: 'gong'
      }
    ],

    insight: 'Separate what you propagate from what you record: a parent can only use one branch, so the return value takes the better side, while the answer may bend through a node and use both.',
    complexity: '<b>Time O(n)</b> — every node visited once. <b>Space O(h)</b> for the recursion stack.',
    pitfall: 'Returning the bent path to the parent, which lets a parent walk down both branches of a child — an impossible path. And initialising the best to zero, which is wrong on an all-negative tree.',
    solution: `def max_path_sum(root):
    best = float('-inf')          # not 0: the tree may be entirely negative

    def gain(node):
        nonlocal best
        if not node:
            return 0
        # A harmful branch is simply not taken.
        left = max(gain(node.left), 0)
        right = max(gain(node.right), 0)
        # Record: the path may bend here and use both sides.
        best = max(best, node.val + left + right)
        # Return: a parent can only extend through one side.
        return node.val + max(left, right)

    gain(root)
    return best`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper returns <code>node.val + left + right</code> to the parent instead of taking the better side. What impossible path does that allow?",
        options: [
          'One that walks down into both of a child\'s branches and back up — a path that visits the child twice',
          'One that skips the root',
          'One with negative values',
          'None; the two are equivalent'
        ],
        correct: 0,
        explain: 'A path is a simple sequence of nodes, so passing through a node uses at most two of its edges. Handing the bent sum upward lets the parent add a third, which no real path can do. The distinction between "extendable" and "complete" is the entire problem.',
        hint: 'Draw a node whose parent tries to extend a path that already uses both of its children.'
      },
      {
        tag: 'TWEAK',
        q: "The tree is [-3] — a single negative node. What does an implementation that initialises <code>best = 0</code> return?",
        options: [
          '0, when the answer is -3 — the empty path is not allowed',
          '-3, correctly',
          'It crashes on an empty tree',
          '3'
        ],
        correct: 0,
        explain: 'Clamping the branches at zero is right, because a branch may be declined. Clamping the ANSWER at zero is wrong, because a path must contain at least one node. It is the same distinction as Kadane\'s all-negative case, and it is the standard failing test here.',
        hint: 'Which of the two zero-clamps represents a choice you are actually allowed to make?'
      },
      {
        tag: 'TRANSFER',
        q: "Different frame: Nami wants the DIAMETER — the longest path measured in edges rather than values. What is the same?",
        options: [
          'The identical split: return the deeper side plus one, but record left depth plus right depth as a candidate',
          'It needs a completely different traversal',
          'The diameter always passes through the root',
          'It requires BFS'
        ],
        correct: 0,
        explain: 'Diameter of Binary Tree is this problem with the values replaced by edge counts, and the same propagate-versus-record split. Once you see that pairing, the whole family — diameter, max path sum, longest zig-zag, longest univalue path — is one technique.',
        hint: 'What does a node hand its parent when measuring depth, and what does it record?'
      }
    ]
  };

  E['bst-iterator'] = {
    id: 'bst-iterator',
    epNumber: 151,
    title: 'The Foreman Who Calls the Next Number',
    arc: 'Water Seven',
    patternId: 'binary-search-trees',
    scene: 'forest',
    leetcode: { name: 'Binary Search Tree Iterator', number: 173, difficulty: 'Medium', url: 'https://leetcode.com/problems/binary-search-tree-iterator/' },
    problem: 'Implement an iterator over a BST that returns its values in ascending order, with next() and hasNext() running in average O(1) time and O(h) memory.',
    example: 'next() returns the smallest unvisited value; hasNext() says whether any remain.',

    h: 210,
    props: [
      { id: 'b7', emoji: '📣', label: '7', x: 50, y: 22 },
      { id: 'b3', emoji: '📣', label: '3', x: 28, y: 50 },
      { id: 'b15', emoji: '📣', label: '15', x: 72, y: 50 },
      { id: 'st', emoji: '🪜', label: 'stack of lefts', x: 50, y: 78 }
    ],
    ledger: [
      { id: 'I', x: 50, y: 94 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The foreman calls out plate numbers in order, one whenever asked — but the whole list is far too big to write out in advance.",
        p: { b7: 'lit', b3: 'lit', b15: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So we can't just do an in-order traversal into a list up front. That's O of n memory and it does all the work before the first call.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Instead, keep the traversal PAUSED. A recursive in-order walk uses a call stack; make that stack explicit and you can stop it between any two steps.",
        p: { st: 'good' }, l: { I: 'stack = the paused walk' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "At construction, push the root and every left child down to the smallest. The top of the stack is then the next number to call.",
        p: { b3: 'good' }, l: { I: 'top = next value' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "On each call, pop the top — that is the answer — and if it has a right child, push that child and all of ITS left descendants. The stack always holds the pending ancestors.",
        p: { b7: 'good', b15: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Some calls push several nodes and some push none. So how is it O of one?",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Amortised. Every node is pushed exactly once and popped exactly once across the entire iteration, so n calls do O of n work in total — an average of one apiece.",
        p: { st: 'good' }, l: { I: 'amortised O(1) ✓' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And the memory is the stack depth, which is the tree height — not the node count.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Turning recursion into an explicit stack so it can be paused is how every lazy iterator over a nested structure is built. Well worth having in hand.",
        sfx: 'gong'
      }
    ],

    insight: 'An explicit stack is a paused recursion — holding the left spine lets an in-order traversal be resumed one step at a time, with height-sized memory instead of node-sized.',
    complexity: '<b>Time O(1)</b> amortised per next(), since each node is pushed and popped exactly once across the whole iteration. <b>Space O(h)</b> — the left spine, not the whole tree.',
    pitfall: 'Flattening the tree into a list in the constructor, which is O(n) memory and violates the stated bound. And forgetting to push the right child\'s left spine after popping, which skips values.',
    solution: `class BSTIterator:
    def __init__(self, root):
        self.stack = []
        self._push_left(root)

    def _push_left(self, node):
        while node:                 # the left spine: pending ancestors
            self.stack.append(node)
            node = node.left

    def next(self):
        node = self.stack.pop()     # the smallest unvisited value
        self._push_left(node.right) # its right subtree's spine comes next
        return node.val

    def hasNext(self):
        return len(self.stack) > 0`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper's constructor performs a full in-order traversal into a list and next() pops from the front. Is that wrong?",
        options: [
          'Not wrong in output, but it uses O(n) memory and does all the work up front, which the stated O(h) bound rules out',
          'It produces the wrong order',
          'It is strictly better',
          'It fails on unbalanced trees'
        ],
        correct: 0,
        explain: 'Worth being precise: the values are correct. What fails is the memory bound — and the laziness, which matters when the caller may stop after three values or when the tree does not fit in memory. The stack version pays only for the spine.',
        hint: 'Compare the memory used by the two versions on a tree of a billion nodes.'
      },
      {
        tag: 'TWEAK',
        q: "A <code>prev()</code> method is added, returning the previous value in order. What is the difficulty?",
        options: [
          'The stack holds only the forward frontier, so stepping backwards needs a second structure or a different design entirely',
          'Nothing; pop from the other end',
          'It requires the tree to be balanced',
          'prev() is impossible on a BST'
        ],
        correct: 0,
        explain: 'A paused forward traversal is inherently one-directional — the popped nodes are gone. Supporting both directions typically means keeping a visited history, or maintaining two stacks, or (with parent pointers) walking to the in-order predecessor directly.',
        hint: 'Where do the nodes go after they are popped?'
      },
      {
        tag: 'TRANSFER',
        q: "Different foreman: Nami must iterate a nested list structure, flattening it lazily. What carries over?",
        options: [
          'The same explicit-stack pause — hold the position within each level so the traversal can resume mid-way',
          'Nothing; nested lists need full flattening',
          'A queue rather than a stack',
          'Recursion with memoisation'
        ],
        correct: 0,
        explain: 'Flatten Nested List Iterator is the same design in a different structure. Any lazy iterator over something recursive is a paused recursion, and making the stack explicit is what allows the pause.',
        hint: 'What does the stack hold in the BST version, and what would the equivalent be for nested lists?'
      }
    ]
  };

  E['count-complete-tree-nodes'] = {
    id: 'count-complete-tree-nodes',
    epNumber: 152,
    title: 'Counting the Rivets Without Counting Them',
    arc: 'Water Seven',
    patternId: 'binary-search',
    scene: 'forest',
    leetcode: { name: 'Count Complete Tree Nodes', number: 222, difficulty: 'Easy', url: 'https://leetcode.com/problems/count-complete-tree-nodes/' },
    problem: 'Given the root of a complete binary tree, count its nodes in better than O(n) time.',
    example: 'tree = [1,2,3,4,5,6]  →  6',

    h: 210,
    props: [
      { id: 'r1', emoji: '🔩', label: '1', x: 50, y: 22 },
      { id: 'r2', emoji: '🔩', label: '2', x: 30, y: 50 },
      { id: 'r3', emoji: '🔩', label: '3', x: 70, y: 50 },
      { id: 'lh', emoji: '📏', label: 'left height', x: 26, y: 78 },
      { id: 'rh', emoji: '📏', label: 'right height', x: 74, y: 78 }
    ],
    ledger: [
      { id: 'C', x: 50, y: 94 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "Count the rivets in the frame. Walking every one is easy — but the frame is COMPLETE, filled left to right with no gaps except possibly at the end of the last row. That must be worth something.",
        p: { r1: 'lit', r2: 'lit', r3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "It is worth a great deal. A PERFECT tree of height h holds exactly two to the h, minus one, nodes — no traversal needed at all.",
        p: { C: 'lit' }, l: { C: 'perfect → 2^h - 1' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So how do we tell whether a subtree is perfect?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Walk its leftmost spine and its rightmost spine. In a complete tree, if those two heights are equal the subtree is perfect — and the formula answers it instantly.",
        p: { lh: 'good', rh: 'good' }, l: { C: 'equal spines → perfect' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And if they differ, recurse into both children — but at most one of those will need real work, because the other is guaranteed perfect.",
        p: { r2: 'good', r3: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is what gives the bound: log n levels, each costing a log n spine walk. O of log squared n instead of O of n.",
        p: { C: 'good' }, l: { C: 'O(log² n) ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "It's marked Easy, which feels like a joke. The O of n traversal is easy; using the completeness is not.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And that is the lesson. When a problem states a structural guarantee, it is there to be used — otherwise why mention it?",
        sfx: 'gong'
      }
    ],

    insight: 'A stated structural guarantee is an invitation — completeness means equal left and right spine heights prove a subtree perfect, and a perfect subtree is counted by formula rather than by traversal.',
    complexity: '<b>Time O(log² n)</b> — O(log n) levels, each with an O(log n) spine walk. <b>Space O(log n)</b> for the recursion. The plain traversal is O(n).',
    pitfall: 'Ignoring completeness and just counting every node, which is correct but misses the entire point. And computing the two heights by full traversal rather than by walking the spines.',
    solution: `def count_nodes(root):
    if not root:
        return 0

    # In a complete tree, equal spine heights mean this subtree is perfect.
    left_h = right_h = 0
    node = root
    while node:
        left_h += 1; node = node.left
    node = root
    while node:
        right_h += 1; node = node.right

    if left_h == right_h:
        return (1 << left_h) - 1        # perfect: counted by formula

    return 1 + count_nodes(root.left) + count_nodes(root.right)`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp counts with a plain recursive traversal. Is his answer wrong?",
        options: [
          'No — it is correct, but O(n), and the completeness guarantee exists precisely to enable something faster',
          'Yes, it double-counts the root',
          'Yes, it fails on incomplete last rows',
          'No, and it is optimal'
        ],
        correct: 0,
        explain: 'A useful distinction between correct and expected. The interviewer\'s question is not "can you count nodes" but "what does completeness buy you". Reading the constraints for what they enable is the skill being tested.',
        hint: 'Ask why the problem bothers to say the tree is complete.'
      },
      {
        tag: 'TWEAK',
        q: "Why is it valid to conclude \"perfect\" from equal left-spine and right-spine heights, only for COMPLETE trees?",
        options: [
          'Completeness forbids internal gaps, so equal extreme depths leave no room for a missing node anywhere inside',
          'Because complete trees are always balanced',
          'It is valid for any binary tree',
          'Because the spines share the root'
        ],
        correct: 0,
        explain: 'In an arbitrary tree the two spines say nothing about the interior — you could have equal spines and a hollow middle. Completeness fills left to right with no holes, so if the leftmost and rightmost paths reach the same depth, every position between them is occupied.',
        hint: 'Draw a tree with equal spine heights and a missing node in the middle. Is it complete?'
      },
      {
        tag: 'TRANSFER',
        q: "Different frame: Nami must find the value of the LAST node in the bottom row of a complete tree, faster than O(n). What technique applies?",
        options: [
          'Binary search the index of the last node, using the path\'s binary representation to descend to a given position',
          'A full level-order traversal',
          'Count the nodes and divide by two',
          'It cannot be done faster than O(n)'
        ],
        correct: 0,
        explain: 'In a complete tree, node indices map to root-to-node paths: the bits of the index, read after the leading one, spell left and right. That makes "does node k exist?" an O(log n) descent, which can then be binary searched — O(log² n) again, and the same idea underneath.',
        hint: 'In a heap-style array layout, how does a node\'s index relate to the path from the root to it?'
      }
    ]
  };

  E['lowest-common-ancestor'] = {
    id: 'lowest-common-ancestor',
    epNumber: 153,
    title: 'Where the Two Routes Last Met',
    arc: 'Water Seven',
    patternId: 'tree-dfs-bfs',
    scene: 'forest',
    leetcode: { name: 'Lowest Common Ancestor of a Binary Tree', number: 236, difficulty: 'Medium', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/' },
    problem: 'Given a binary tree and two nodes, find their lowest common ancestor — the deepest node having both as descendants, where a node may be a descendant of itself.',
    example: 'tree = [3,5,1,6,2,0,8], p = 5, q = 1  →  3',

    h: 210,
    props: [
      { id: 'n3', emoji: '🧭', label: '3', x: 50, y: 22 },
      { id: 'n5', emoji: '🧭', label: '5', x: 28, y: 50 },
      { id: 'n1', emoji: '🧭', label: '1', x: 72, y: 50 },
      { id: 'n6', emoji: '🧭', label: '6', x: 16, y: 78 },
      { id: 'n2', emoji: '🧭', label: '2', x: 40, y: 78 }
    ],
    ledger: [
      { id: 'L', x: 76, y: 84 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Two crews set out from the same yard and took different routes. Where did their paths last coincide?",
        p: { n5: 'lit', n1: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Record the full route to each and compare them? That works, but it needs both routes stored.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "There is a recursion that needs nothing. Ask each node one question: did you find either target anywhere below you, or are you one of them?",
        p: { L: 'lit' }, l: { L: 'return: found something?' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "If a node IS one of the targets, it reports itself and stops looking — because a node counts as its own descendant.",
        p: { n5: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Otherwise it asks both children. If BOTH report a find, the two routes diverge exactly here — so this node is the answer.",
        p: { n3: 'good' }, l: { L: 'both sides → this is it ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And if only one side reports, the answer lies that way, so we pass the finding straight up unchanged.",
        p: { n1: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The subtlety is that the same return value carries two meanings — 'here is a target I found' on the way up, and 'here is the answer' once both sides have reported. It works because once both report, that value can only ever be passed upward unchanged.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And this assumes both targets are actually in the tree. If one might be missing, you'd need to confirm the find rather than trusting it.",
        p: { n6: 'dim', n2: 'dim' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which the problem guarantees. In a BST you can do better still — compare both values against the node and simply walk down, in O of height with no recursion at all.",
        sfx: 'gong'
      }
    ],

    insight: 'One return value can carry two meanings when they never conflict — here "a target found below" becomes "the answer" at the exact node where both sides report, and is then passed up untouched.',
    complexity: '<b>Time O(n)</b> — one pass, worst case every node. <b>Space O(h)</b> for the recursion. The BST version is O(h) time and O(1) space iteratively.',
    pitfall: 'Assuming both nodes exist — if one may be absent, the algorithm returns the other one, which is wrong. Also, a node is its own descendant, so a target that is an ancestor of the other IS the answer.',
    solution: `def lowest_common_ancestor(root, p, q):
    if not root or root is p or root is q:
        return root                     # a node is its own descendant

    left = lowest_common_ancestor(root.left, p, q)
    right = lowest_common_ancestor(root.right, p, q)

    if left and right:
        return root                     # the routes diverge here
    return left or right                # pass the single finding upward`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "The tree contains p but NOT q. What does this algorithm return?",
        options: [
          'p itself — the single finding is passed all the way up and looks like an answer',
          'None, correctly',
          'The root',
          'It crashes'
        ],
        correct: 0,
        explain: 'Nothing in the recursion verifies that both targets were actually found; it trusts the guarantee in the problem statement. If that guarantee is removed, you need a second pass or a pair of found-flags to confirm both before trusting the result.',
        hint: 'Follow what happens to the single finding as it travels up through nodes whose other side reports nothing.'
      },
      {
        tag: 'TWEAK',
        q: "The tree is a BST. What is the better approach?",
        options: [
          'Walk down comparing both values: both smaller means go left, both larger means go right, otherwise you are standing on the LCA',
          'The same recursion, unchanged',
          'Sort the values first',
          'Use an in-order traversal'
        ],
        correct: 0,
        explain: 'Ordering turns the search into a decision at every node, so it becomes an O(h) walk with O(1) space and no recursion. The split point — where the two targets fall on opposite sides, or one equals the node — is exactly the LCA.',
        hint: 'What does it mean when p is smaller than the current node and q is larger?'
      },
      {
        tag: 'TRANSFER',
        q: "Different yard: Franky has parent pointers on every node. What is the simplest LCA?",
        options: [
          'Walk up from each node collecting ancestors, then find the first shared one — or equalise depths and step up together',
          'The same recursion from the root',
          'Binary search the depths',
          'Parent pointers do not help'
        ],
        correct: 0,
        explain: 'With parent pointers the problem becomes the intersection of two upward paths — which is the same shape as finding where two linked lists merge. Equalising depths first and then stepping together gives O(h) time with O(1) space.',
        hint: 'Two upward paths that end at the same root. What linked-list problem is that?'
      }
    ]
  };

}(typeof window !== 'undefined' ? window : this));
