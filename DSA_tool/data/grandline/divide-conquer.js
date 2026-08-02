/* Punk Hazard — divide and conquer.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['sorted-array-to-bst'] = {
    id: 'sorted-array-to-bst',
    epNumber: 77,
    title: 'Rebuilding the Split Island',
    arc: 'Punk Hazard',
    patternId: 'binary-search-trees',
    scene: 'vault',
    leetcode: { name: 'Convert Sorted Array to Binary Search Tree', number: 108, difficulty: 'Easy', url: 'https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/' },
    problem: 'Given an array sorted in ascending order, build a height-balanced binary search tree from it.',
    example: 'nums = [-10, -3, 0, 5, 9]  →  a tree rooted at 0, with -3 and 9 as its children',

    h: 220,
    props: [
      { id: 'v0', emoji: '❄️', label: '-10', x: 12, y: 26 },
      { id: 'v1', emoji: '❄️', label: '-3', x: 31, y: 26 },
      { id: 'v2', emoji: '🌋', label: '0', x: 50, y: 26 },
      { id: 'v3', emoji: '🌋', label: '5', x: 69, y: 26 },
      { id: 'v4', emoji: '🌋', label: '9', x: 88, y: 26 }
    ],
    ledger: [
      { id: 'R', x: 50, y: 60 },
      { id: 'Ll', x: 26, y: 86 },
      { id: 'Lr', x: 74, y: 86 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "The island was cut in half and every research log survived — sorted, in one long line. Now it has to be rebuilt as a search tree, and the tree must be BALANCED, or looking anything up will be as slow as reading the line itself.",
        p: { v0: 'lit', v1: 'lit', v2: 'lit', v3: 'lit', v4: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Just insert them one by one? That's the obvious thing.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And it produces the worst tree possible. Inserting sorted values means every new value is larger than everything before it, so it hangs off the right, forever. You would build a linked list wearing a tree's clothes.",
        p: { v0: 'bad', v1: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So which value should be the root?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The middle one. It is the only choice that leaves exactly as many logs on the left as on the right — and 'balanced' is precisely the claim that the two sides are the same size.",
        p: { v0: 'dim', v1: 'dim', v2: 'good' }, l: { R: 'root: 0' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Then the left half is its own sorted line, so the same rule applies to it. Take ITS middle as the left child.",
        p: { v1: 'good' }, l: { Ll: 'left: -3' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And the right half likewise. The problem is the same problem at a smaller size, which is the whole shape of divide and conquer — split, solve both halves independently, attach.",
        p: { v3: 'dim', v4: 'good' }, l: { Lr: 'right: 9' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And the search-tree ordering comes free! Everything left of the middle is smaller, everything right is larger, at every level. The sorted line was doing that work all along.",
        p: { v0: 'good', v3: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Note what the recursion should pass around: index bounds, not copies of the array. Slicing at every level would turn a linear build into an n-log-n one for no reason at all.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "With an even number of logs there are two middles. Does it matter which we pick?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Not for correctness — either produces a valid, balanced tree. It changes which tree you get, so a judge comparing against one exact answer may care. Say so out loud rather than guessing.",
        sfx: 'gong'
      }
    ],

    insight: 'Choosing the middle as the root is what makes the recursion balanced — the same move that makes binary search logarithmic, used to build rather than to search.',
    complexity: '<b>Time O(n)</b> — every element becomes exactly one node, once. <b>Space O(log n)</b> for the recursion on the balanced tree it builds. Slicing the array at each level instead of passing bounds would make it O(n log n) time and O(n log n) space.',
    pitfall: 'Inserting the values one at a time, which builds a degenerate chain of height n — the exact opposite of what was asked. Also, slicing sub-arrays rather than passing lo/hi indices quietly adds a log factor.',
    solution: `def sorted_array_to_bst(nums):
    def build(lo, hi):                 # bounds, never slices
        if lo > hi:
            return None
        mid = lo + (hi - lo) // 2      # the middle splits the rest evenly
        node = TreeNode(nums[mid])
        node.left = build(lo, mid - 1)
        node.right = build(mid + 1, hi)
        return node

    return build(0, len(nums) - 1)`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp builds the tree by inserting -10, then -3, then 0, then 5, then 9 into an empty BST in that order. What shape does he get?",
        options: [
          'A right-leaning chain of height 5 — a linked list, with O(n) lookups',
          'A balanced tree of height 3',
          'A left-leaning chain of height 5',
          'A complete tree, since insertion self-balances'
        ],
        correct: 0,
        explain: 'Each value is larger than everything inserted so far, so it lands on the rightmost path every time. Plain BSTs do not self-balance; that is what AVL and red-black trees are for. Sorted input is the worst case for naive insertion, which is exactly the input here.',
        hint: 'Where does a value larger than every existing node end up?'
      },
      {
        tag: 'TRANSFER',
        q: "Different rebuild, same move: Franky must turn a sorted list of ship frames into a balanced structure, but he is given a linked list rather than an array and wants to avoid copying it. What changes?",
        options: [
          'Find the middle with a fast/slow pointer walk, or build bottom-up in order — indexing is no longer O(1)',
          'Nothing; the same index arithmetic works on a linked list',
          'Sort the list first',
          'Convert to a heap instead'
        ],
        correct: 0,
        explain: 'The middle-as-root idea survives; only how you find the middle changes, because a list has no random access. The elegant version builds the tree bottom-up while walking the list once in order, giving O(n) — that is LeetCode 109, and it is the natural follow-up to this problem.',
        hint: 'Which single operation does the array version rely on that a linked list cannot do cheaply?'
      },
      {
        tag: 'TWEAK',
        q: "The array has an even length, so there are two candidate middles. Which should Robin take?",
        options: [
          'Either — both give a valid height-balanced BST, though they give different trees',
          'Always the lower one, or the result is unbalanced',
          'Always the upper one, or the BST property breaks',
          'Neither; even-length arrays need a different algorithm'
        ],
        correct: 0,
        explain: 'The halves differ in size by at most one either way, which satisfies height-balance, and the ordering is preserved in both cases. It matters only when a grader compares against one specific expected tree — a good moment to ask the interviewer rather than assume.',
        hint: 'How much can the two halves differ in size, and is that within the balance rule?'
      }
    ]
  };

  E['sort-list'] = {
    id: 'sort-list',
    epNumber: 78,
    title: 'Sorting a Chain You Cannot Index',
    arc: 'Punk Hazard',
    patternId: 'linked-list-reversal',
    scene: 'vault',
    leetcode: { name: 'Sort List', number: 148, difficulty: 'Medium', url: 'https://leetcode.com/problems/sort-list/' },
    problem: 'Given the head of a linked list, return it sorted in ascending order, in O(n log n) time and using constant extra space beyond the recursion.',
    example: 'list = 4 → 2 → 1 → 3   →   1 → 2 → 3 → 4',

    h: 210,
    props: [
      { id: 'k0', emoji: '⛓️', label: '4', x: 16, y: 32 },
      { id: 'k1', emoji: '⛓️', label: '2', x: 38, y: 32 },
      { id: 'k2', emoji: '⛓️', label: '1', x: 60, y: 32 },
      { id: 'k3', emoji: '⛓️', label: '3', x: 82, y: 32 }
    ],
    ledger: [
      { id: 'H1', x: 28, y: 62 },
      { id: 'H2', x: 72, y: 62 },
      { id: 'M', x: 50, y: 88 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The chain has to be sorted, and we can't lift it into a bucket first — captain's orders. Quicksort, then?",
        p: { k0: 'lit', k1: 'lit', k2: 'lit', k3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Quicksort needs to reach into the middle of the data at will, and a chain has no middle you can reach — only a middle you can walk to. It degrades badly here.",
        sfx: 'error'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "What about a heap? Or just reading the values into an array, sorting, and writing them back?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Both work. Both spend O(n) extra space, which is exactly what we were told not to spend. Merge sort is the one that fits a chain: it never needs to jump anywhere.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Splitting: send one runner at single speed and one at double. When the fast one reaches the end, the slow one is standing on the middle — and we cut the chain there.",
        p: { k0: 'lit', k1: 'good' }, l: { M: 'cut after 2' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Cut it properly, though. If we don't set the first half's last link to nothing, both halves still point into each other and the recursion never bottoms out.",
        p: { M: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Sever the link, then sort each half. Four and two becomes two, four. One and three becomes one, three.",
        p: { k0: 'dim', k1: 'dim' }, l: { H1: '2 → 4', H2: '1 → 3' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And now the merge — which is where the actual work is. Two sorted chains, walk both fronts, always take the smaller.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "One, then two, then three, then four. And it's all pointer rewiring — no new nodes made, nothing copied.",
        p: { k2: 'good', k1: 'good', k3: 'good', k0: 'good' }, l: { M: '1 → 2 → 3 → 4 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "A dummy head makes the merge painless: every node then has a predecessor, so there is no special case for whichever list contributes the first element.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So the honest answer on space is 'constant, apart from the log-n recursion stack'. Which they will absolutely ask about.",
        sfx: 'gong'
      }
    ],

    insight: 'Merge sort is the sort that suits a linked list, because it only ever walks forwards — splitting is a fast/slow walk and merging is pointer rewiring, so no random access is ever needed.',
    complexity: '<b>Time O(n log n)</b> — log n levels, each merging n nodes. <b>Space O(log n)</b> for the recursion, or true O(1) with the bottom-up iterative version. Copying to an array and sorting is O(n) space.',
    pitfall: 'Failing to sever the link between the two halves before recursing, which leaves both halves sharing nodes and recursing forever. Also, with two nodes, a fast/slow split must not return the whole list as one half or the recursion never shrinks.',
    solution: `def sort_list(head):
    if not head or not head.next:
        return head

    # Split: slow lands on the end of the first half.
    slow, fast = head, head.next
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    mid = slow.next
    slow.next = None          # sever, or the halves still point at each other

    left = sort_list(head)
    right = sort_list(mid)

    # Merge: all the real work lives here.
    dummy = tail = ListNode(0)
    while left and right:
        if left.val <= right.val:
            tail.next, left = left, left.next
        else:
            tail.next, right = right, right.next
        tail = tail.next
    tail.next = left or right
    return dummy.next`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different cargo, same constraint: Zoro must sort a chain of anchors where equal weights MUST keep their original relative order. Which sort is safe?",
        options: [
          'Merge sort — it is stable, provided the merge takes from the left half on a tie',
          'Quicksort, which is stable by nature',
          'Heapsort, which is stable by nature',
          'Any O(n log n) sort is stable'
        ],
        correct: 0,
        explain: 'Stability is a property of the algorithm, not of its complexity. Merge sort is stable when ties favour the left half — note the <code>&lt;=</code> in the merge, which is doing exactly that. Quicksort and heapsort both reorder equal elements freely.',
        hint: 'Look at the comparison in the merge. What does using < instead of <= change?'
      },
      {
        tag: 'PITFALL',
        q: "Chopper writes the split but forgets <code>slow.next = None</code>. What happens on the list 4 → 2 → 1 → 3?",
        options: [
          'The "first half" still runs to the end of the whole list, so the recursion never shrinks and it overflows the stack',
          'It sorts correctly but in O(n²)',
          'It drops the last element',
          'It returns the list unchanged'
        ],
        correct: 0,
        explain: 'Without severing, both recursive calls receive lists that overlap, so the subproblem is never smaller than the problem. It fails as a stack overflow rather than a wrong answer, which at least makes it easy to spot — unlike the stability bug above.',
        hint: 'What is the length of the "first half" if its last node still points at the second half?'
      },
      {
        tag: 'TWEAK',
        q: "The interviewer insists on true O(1) space — no recursion stack at all. What is the answer?",
        options: [
          'Bottom-up merge sort: merge runs of size 1, then 2, then 4, iterating with pointers instead of recursing',
          'Switch to quicksort with an explicit stack',
          'Sort in place with insertion sort',
          'It is impossible below O(log n) space'
        ],
        correct: 0,
        explain: 'The same merges happen, driven by a loop over run sizes rather than by recursion, so nothing is stored per level. It is more fiddly pointer work — you must carefully split off each run and reattach the merged result — which is precisely why it is the follow-up rather than the first answer.',
        hint: 'The recursion only exists to schedule the merges. Can you schedule them with a loop instead?'
      }
    ]
  };

  E['construct-quad-tree'] = {
    id: 'construct-quad-tree',
    epNumber: 79,
    title: 'The Four Quarters of the Frozen Half',
    arc: 'Punk Hazard',
    patternId: 'binary-search-trees',
    scene: 'vault',
    leetcode: { name: 'Construct Quad Tree', number: 427, difficulty: 'Medium', url: 'https://leetcode.com/problems/construct-quad-tree/' },
    problem: 'Given an n x n grid of 0s and 1s where n is a power of two, build a quad tree: a node is a leaf if its region is uniform, otherwise it splits into four children covering the four quadrants.',
    example: 'grid = [[0,1],[1,0]]  →  a non-leaf with four leaves: 0, 1, 1, 0',

    h: 220,
    props: [
      { id: 'qA', emoji: '❄️', label: 'NW', x: 30, y: 26 },
      { id: 'qB', emoji: '🌋', label: 'NE', x: 70, y: 26 },
      { id: 'qC', emoji: '🌋', label: 'SW', x: 30, y: 58 },
      { id: 'qD', emoji: '❄️', label: 'SE', x: 70, y: 58 }
    ],
    ledger: [
      { id: 'N', x: 50, y: 86 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "Punk Hazard has to be charted, and half of it is burning while half is frozen. Storing every square metre separately would be absurd — most of the island is uniform for miles.",
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So we record big uniform regions as single entries, and only split where the terrain actually changes?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That is a quad tree. Ask one question of a square region: is it all the same? If yes, it is a leaf and we are finished with it. If no, cut it into four quarters and ask each of them the same question.",
        p: { qA: 'lit', qB: 'lit', qC: 'lit', qD: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "The whole island isn't uniform — it's fire and ice. So the root splits.",
        p: { N: 'lit' }, l: { N: 'not uniform → split' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "North-west quarter: all frozen. Leaf, value zero. North-east: all burning. Leaf, value one.",
        p: { qA: 'good', qB: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "South-west: burning. South-east: frozen. Four leaves, and the root that holds them.",
        p: { qC: 'good', qD: 'good' }, l: { N: '4 leaves ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The recursion is the same shape as every divide and conquer: solve four smaller versions of the identical problem, then combine. The combine here is simply 'hang them off a node'.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Is there a shortcut? Instead of scanning a region to check uniformity, could we build the children first and look at THEM?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Yes, and it is the neater version. Build all four children; if all four came back as leaves carrying the same value, collapse them into a single leaf and throw the children away.",
        p: { qA: 'dim', qB: 'dim', qC: 'dim', qD: 'dim' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Bottom-up instead of top-down. Same tree, and no separate scan to test uniformity.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One detail people trip on: the node's own value is meaningless when it is not a leaf. The problem lets you store anything there — so do not write logic that reads it.",
        p: { N: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'Recursive subdivision on a grid is divide and conquer with four subproblems instead of two — and the tidiest version decides uniformity bottom-up, by asking whether all four children came back as identical leaves.',
    complexity: '<b>Time O(n² log n)</b> for the scan-then-split version, or <b>O(n²)</b> for the bottom-up version, which touches each cell once. <b>Space O(log n)</b> recursion depth plus the tree itself.',
    pitfall: 'Reading a non-leaf node\'s value, which the problem leaves unspecified. Also: the collapse only applies when all four children are leaves <b>and</b> share a value — four non-leaf children can never merge.',
    solution: `def construct(grid):
    def build(r, c, size):
        if size == 1:
            return Node(grid[r][c] == 1, True)

        half = size // 2
        tl = build(r, c, half)
        tr = build(r, c + half, half)
        bl = build(r + half, c, half)
        br = build(r + half, c + half, half)

        # Bottom-up collapse: four identical leaves are one bigger leaf.
        kids = (tl, tr, bl, br)
        if all(k.isLeaf for k in kids) and len({k.val for k in kids}) == 1:
            return Node(tl.val, True)

        # A non-leaf's own value is unspecified by the problem — never read it.
        return Node(True, False, tl, tr, bl, br)

    return build(0, 0, len(grid))`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different chart, same subdivision: Nami compresses a weather map by splitting any region that is not a single uniform condition. A region is uniform only when all four of its quarters are uniform AND agree. What does this tell you about the merge step in general?",
        options: [
          'A parent can be summarised only when every child is summarised and the summaries agree',
          'A parent can always be summarised if any child is',
          'Uniformity must be tested by scanning the region, never derived from children',
          'The quarters must be tested in a specific order'
        ],
        correct: 0,
        explain: 'That is the bottom-up rule, and it generalises well past quad trees — it is the same reasoning behind merging nodes in segment trees and in interval compression. Both conditions are needed: all children resolved, and all agreeing.',
        hint: 'What has to be true of all four quarters before the whole region can be one entry?'
      },
      {
        tag: 'PITFALL',
        q: "Usopp writes the collapse as \"if all four children have the same val, make a leaf\", without checking that they are leaves. On what grid does that break?",
        options: [
          'Any grid where two non-leaf children happen to carry the same placeholder value — their internal detail is silently destroyed',
          'Only on grids larger than 8x8',
          'Only on all-zero grids',
          'It never breaks; leaf-ness is implied by equal values'
        ],
        correct: 0,
        explain: 'A non-leaf node\'s val is explicitly unspecified, so two non-leaves can carry equal placeholders while covering completely different terrain. Collapsing them throws away real structure. Both halves of the condition are load-bearing, which is why the problem statement bothers to say the value is meaningless.',
        hint: 'What is stored in the val field of a node that is not a leaf?'
      },
      {
        tag: 'TWEAK',
        q: "The grid is no longer a power of two — say 6x6. What is the first thing that breaks?",
        options: [
          'The split into four equal quadrants — halving 6 works but halving 3 does not, so the recursion needs unequal quadrants or padding',
          'Nothing; the recursion handles any size',
          'The leaf test, which assumes even dimensions',
          'The tree becomes unbalanced but stays correct'
        ],
        correct: 0,
        explain: 'The clean recursion depends on every region halving exactly down to size 1. At an odd size the quadrants differ in dimension, so you must carry explicit bounds rather than a single size, or pad the grid up to the next power of two. The power-of-two constraint is doing real work in the problem statement.',
        hint: 'Follow the size down: 6, 3, and then?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
