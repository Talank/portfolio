/* Thriller Bark — the binary search tree arc.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['min-absolute-difference-bst'] = {
    id: 'min-absolute-difference-bst',
    epNumber: 63,
    title: 'The Two Closest Shadows',
    arc: 'Thriller Bark',
    patternId: 'binary-search-trees',
    scene: 'night',
    leetcode: { name: 'Minimum Absolute Difference in BST', number: 530, difficulty: 'Easy', url: 'https://leetcode.com/problems/minimum-absolute-difference-in-bst/' },
    problem: 'Given the root of a binary search tree, return the minimum absolute difference between the values of any two different nodes.',
    example: 'tree = [4, 2, 6, 1, 3]  →  answer: 1  (between 1 and 2, or 2 and 3, or 3 and 4)',

    h: 220,
    props: [
      { id: 't4', emoji: '👻', label: '4', x: 50, y: 18 },
      { id: 't2', emoji: '👻', label: '2', x: 28, y: 46 },
      { id: 't6', emoji: '👻', label: '6', x: 72, y: 46 },
      { id: 't1', emoji: '👻', label: '1', x: 16, y: 74 },
      { id: 't3', emoji: '👻', label: '3', x: 40, y: 74 }
    ],
    ledger: [
      { id: 'Lp', x: 70, y: 82 },
      { id: 'Lb', x: 90, y: 82 }
    ],

    steps: [
      {
        speaker: 'brook', pos: 'left',
        line: "Moria has stolen five shadows and hung them in his tree by weight. Two of them belong to the same person — and the only clue is that their weights are closer together than any other pair. Yohohoho, a grim little puzzle!",
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Five shadows, so ten pairs. We could just measure every pair! ...though with five hundred shadows that's over a hundred thousand measurements, and I'd like to leave this island.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "We don't need every pair. This is a search tree — everything smaller hangs to the left, everything larger to the right. Which means if we walk it left, node, right, the shadows come out in sorted order.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Left-most first. One. Then its parent, two. Then two's right child, three. Then the root, four. Then six. One, two, three, four, six — perfectly ordered, and we never sorted anything.",
        p: { t1: 'lit', t2: 'lit', t3: 'lit', t4: 'lit', t6: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'brook', pos: 'left',
        line: "And in a sorted line, the closest pair must be NEIGHBOURS. If two shadows had something between them, that something would be closer to each of them than they are to each other.",
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So we only measure adjacent pairs. Nine gaps instead of ten pairs here — but on five hundred shadows, four hundred and ninety-nine gaps instead of a hundred and twenty-five thousand pairs.",
        l: { Lp: 'prev: —', Lb: 'best: ∞' },
        sfx: null
      },
      {
        speaker: 'brook', pos: 'left',
        line: "One and two — a gap of one. Two and three — one again. Three and four — one. Four and six — two. The smallest gap is one.",
        p: { t1: 'good', t2: 'good', t3: 'good' }, l: { Lp: 'prev: 6', Lb: 'best: 1' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And we never built the sorted list. We carry one number — the previous shadow visited — and compare it against the current one as the traversal passes through. Constant extra memory beyond the recursion itself.",
        l: { Lb: 'best: 1 ✓' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Wait. What if I did the traversal wrong and went node, left, right instead? Then I'd get four, two, one, three, six — and comparing four with two would give me two, which isn't the answer at all!",
        p: { t4: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'brook', pos: 'left',
        line: "Precisely why the order matters more than the walking. In-order is the only traversal that turns a search tree into a sorted line. Get the order wrong and neighbours stop meaning anything. Yohohoho!",
        p: { t4: 'good' },
        sfx: 'pop'
      }
    ],

    insight: 'An in-order traversal of a BST emits its values in sorted order, and in a sorted sequence the closest pair is always adjacent — so carry the previously visited value and compare only neighbours.',
    complexity: '<b>Time O(n)</b> — every node visited once. <b>Space O(h)</b> for the recursion stack, which is O(log n) on a balanced tree and O(n) on a degenerate one. Building an explicit sorted list also works but costs O(n) extra space for no gain.',
    pitfall: 'Comparing the wrong pairs. Only <b>in-order</b> gives sorted output — pre-order or post-order neighbours are meaningless here. The other slip is initialising <code>prev</code> to 0 rather than to "nothing yet", which invents a phantom node at zero and can report a difference that does not exist.',
    solution: `def min_diff_in_bst(root):
    best = float('inf')
    prev = None          # the previously visited value, not a sentinel number

    def walk(node):
        nonlocal best, prev
        if not node:
            return
        walk(node.left)          # everything smaller, in order
        if prev is not None:     # compare only against the immediate predecessor
            best = min(best, node.val - prev)
        prev = node.val
        walk(node.right)         # everything larger, in order

    walk(root)
    return best`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different tree, same trick: Chopper stores patient temperatures in a BST and wants to know whether any two readings are IDENTICAL. What is the cheapest way?",
        options: [
          'Walk it in order and check whether any value equals the one just before it',
          'Walk it in order and compare every value against every later value',
          'Check at each node whether its left child equals its right child',
          'Count the nodes and compare with the number of distinct values in a set'
        ],
        correct: 0,
        explain: 'Duplicates in a sorted sequence must be adjacent, exactly as the closest pair must be adjacent — same one-pass, one-remembered-value shape, with the comparison changed from "smallest gap" to "gap of zero". The set approach works but spends O(n) memory to learn something the ordering already tells you.',
        hint: 'If two readings are equal, where must they sit once the values are in sorted order?'
      },
      {
        tag: 'TWEAK',
        q: "Moria rehangs the shadows so the tree is an ordinary binary tree — no ordering rule at all — and Brook still wants the smallest gap between any two. Does the in-order neighbour trick still work?",
        options: [
          'No — without the BST property in-order output is not sorted, so you must collect all values and sort them first',
          'Yes, in-order traversal always produces sorted output',
          'Yes, but only if the tree is balanced',
          'No, and the problem becomes unsolvable in better than O(n²)'
        ],
        correct: 0,
        explain: 'Sortedness comes from the BST invariant, not from the traversal. On a plain binary tree you collect the n values and sort them — O(n log n) — and then the adjacent-pairs argument applies again. It is still far better than the O(n²) all-pairs comparison.',
        hint: 'Which gives you the sorted order: the shape of the walk, or the rule about where values are allowed to live?'
      },
      {
        tag: 'PITFALL',
        q: "Usopp writes the same traversal but starts with <code>prev = 0</code> instead of \"nothing seen yet\". On a tree whose smallest value is 7, what does he report?",
        options: [
          'A difference of 7, from comparing the first real node against a node that does not exist',
          'The correct answer, since 0 is smaller than everything',
          'Zero, because prev never changes',
          'An error, because 0 is not in the tree'
        ],
        correct: 0,
        explain: 'The first real comparison becomes 7 − 0 = 7, a gap between a node and a phantom. It happens to be harmless when the true answer is smaller than the minimum value, which is why this bug survives casual testing — and then fails on a tree like [7, null, 100].',
        hint: 'What does the very first comparison actually compare against?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
