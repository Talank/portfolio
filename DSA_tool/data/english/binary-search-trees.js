window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['binary-search-trees'] = {
  id: 'binary-search-trees',
  title: 'Binary Search Trees',
  titleNe: 'Left is smaller, right is bigger',
  intro: 'the one invariant — left < node < right — that makes search, insert, and in-order all fall out for free',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'One rule holds at <b>every single node</b>: everything in the left subtree is smaller, everything in the right is bigger.',
        'Search / insert / delete in O(height) — O(log n) if balanced, O(n) if it degenerates into a line.',
        'Validate BST, kth smallest, closest value, range sum — all lean on the same invariant.',
      ],
      narration: "Now the Binary Search Tree — BST for short. It has just one rule, but that rule holds at every node, everywhere — everything to the left is smaller, everything to the right is bigger. Imagine a village with a strange house-numbering system — to the left of each house's courtyard live only lower-numbered houses, to the right only higher-numbered ones — and this rule repeats at every house, at every level. So to find a number you ask the same question at each house — is the one I want smaller than this, or bigger? Smaller, go left; bigger, go right — and half the remaining village drops away in one step. If the tree is balanced the height is log n, but if it degenerates into a single line it costs n — always keep that in mind.",
    },
    {
      heading: 'Story: In-order is the sorted line',
      bullets: [
        'In-order traversal (left → node → right) of a BST visits nodes in <b>sorted order</b> — always, no exception.',
        'This one fact answers “kth smallest”, “validate BST”, and “convert to sorted array” all at once.',
        'Validating a BST by only checking parent-vs-child is a classic trap — you need the full ancestor range.',
      ],
      narration: "Remember one magical fact — if you walk this village house to house in left-then-self-then-right order, you visit them in exactly increasing order — always, without exception. That single fact opens three doors. Need the kth smallest? Walk in-order and take the kth. Need to turn the BST into a sorted array? Walking in-order already builds the order. And in the validate problem there's a famous trap — many think comparing parent and child is enough, but no — if a grandchild becomes bigger than its grandparent, the rule is broken even though it looks fine against its direct parent. So when validating, each node must carry the bounds its ancestors set — both a minimum and a maximum.",
    },
    {
      heading: 'Mnemonic',
      big: '“Left smaller, right bigger — walk in-order and meet them in sorted order.”',
      bullets: [
        'Search/insert: at each node, compare and step left or right — never both.',
        'Delete has three cases: leaf (just remove), one child (splice), two children (swap with in-order successor).',
        'In-order successor of a node = leftmost node of its right subtree.',
      ],
      narration: "The hook: left smaller, right bigger, walk in-order and meet them in sorted order. In search or insert, at each node it's one choice — left or right, never both — so it's height-many steps. Delete is the fun one — three cases. A leaf node with no children — just remove it. A node with one child — splice that child straight into the parent's place. A node with two children — here you need a trick — put its in-order successor in its place, that is, the leftmost node of its right subtree — because that's the very next value after this node in sorted order.",
    },
    {
      heading: 'Python template',
      code: 'class Node:\n    def __init__(self, val):\n        self.val, self.left, self.right = val, None, None\n\ndef search(root, target):\n    node = root\n    while node:\n        if node.val == target:\n            return node\n        node = node.left if target < node.val else node.right\n    return None\n\ndef insert(root, val):\n    if not root:\n        return Node(val)\n    if val < root.val:\n        root.left = insert(root.left, val)\n    else:\n        root.right = insert(root.right, val)\n    return root\n\ndef is_valid_bst(node, lo=float("-inf"), hi=float("inf")):\n    if not node:\n        return True\n    if not (lo < node.val < hi):\n        return False\n    return is_valid_bst(node.left, lo, node.val) and is_valid_bst(node.right, node.val, hi)',
      narration: "Search is easy — the while loop always moves to just one side. Insert is cleanest written recursively — if it's smaller, send it left, and make what comes back your new left — this creates a new Node at the None spot. In is_valid_bst you see the previous slide's trick as code — carry two bounds, lo and hi; going left tightens hi to the current value, going right tightens lo. This way every node is checked against the narrow range all its ancestors set, not just against its lone parent.",
    },
    {
      heading: 'Watch out! Pitfalls and when NOT to use',
      bullets: [
        'Unbalanced insert order (e.g. sorted input) degenerates to a linked list — O(n) everything.',
        'Self-balancing trees (AVL, Red-Black) fix this — know the name, rarely need to implement in an interview.',
        'Duplicate values: decide the rule up front (go left? go right? not allowed?) and state it.',
        'For pure “top-k” or “kth largest” questions, a heap is often simpler than a BST — don’t over-reach for BST.',
      ],
      narration: "Final warnings. If you insert the numbers already in order — already sorted — the tree degenerates into a straight line, height n, and all the BST benefit is lost — so the order of insertion is part of the problem too. To fix this there are self-balancing trees like AVL and Red-Black — know the names, but interviews rarely ask you to implement them fully; showing you understand is enough. If duplicate values arrive, decide the rule up front and say it — send left, send right, or don't allow them. And a last tip — many rush straight to a BST for kth largest or top-k, but there a heap is usually simpler and faster — when choosing a tool, pause a moment to ask what the problem is really after.",
    },
  ],
};
