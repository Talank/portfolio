/* The LeetCode "Top Interview 150" list, as course data.
 *
 * This is the spine of the Grand Line arc: every one of these gets an episode
 * (story + conversation + animated action) and a Dojo fight. Keeping the list
 * here rather than in prose means the site can show real coverage — how many
 * are written, which arc you are on, what is left — instead of a claim.
 *
 * Fields:
 *   n     LeetCode problem number
 *   t     title
 *   d     difficulty: E | M | H   (drives the enemy tier in the Dojo)
 *   g     group — the pattern family, which is also the story arc
 *
 * Difficulty maps to who you fight, because that is a far better motivator
 * than a coloured label:
 *   E -> a Marine grunt      (one exchange, learn the shape)
 *   M -> an officer          (three exchanges, a real pattern)
 *   H -> a Warlord/Yonko     (multi-phase, the ones that earn a bounty raise)
 */
(function (root) {
  'use strict';

  const L = (n, t, d, g) => ({ n: n, t: t, d: d, g: g });

  const LC150 = [
    // ---- Array / String -------------------------------------------------
    L(88, 'Merge Sorted Array', 'E', 'array-string'),
    L(27, 'Remove Element', 'E', 'array-string'),
    L(26, 'Remove Duplicates from Sorted Array', 'E', 'array-string'),
    L(80, 'Remove Duplicates from Sorted Array II', 'M', 'array-string'),
    L(169, 'Majority Element', 'E', 'array-string'),
    L(189, 'Rotate Array', 'M', 'array-string'),
    L(121, 'Best Time to Buy and Sell Stock', 'E', 'array-string'),
    L(122, 'Best Time to Buy and Sell Stock II', 'M', 'array-string'),
    L(55, 'Jump Game', 'M', 'array-string'),
    L(45, 'Jump Game II', 'M', 'array-string'),
    L(274, 'H-Index', 'M', 'array-string'),
    L(380, 'Insert Delete GetRandom O(1)', 'M', 'array-string'),
    L(238, 'Product of Array Except Self', 'M', 'array-string'),
    L(134, 'Gas Station', 'M', 'array-string'),
    L(135, 'Candy', 'H', 'array-string'),
    L(42, 'Trapping Rain Water', 'H', 'array-string'),
    L(13, 'Roman to Integer', 'E', 'array-string'),
    L(12, 'Integer to Roman', 'M', 'array-string'),
    L(58, 'Length of Last Word', 'E', 'array-string'),
    L(14, 'Longest Common Prefix', 'E', 'array-string'),
    L(151, 'Reverse Words in a String', 'M', 'array-string'),
    L(6, 'Zigzag Conversion', 'M', 'array-string'),
    L(28, 'Find the Index of the First Occurrence in a String', 'E', 'array-string'),
    L(68, 'Text Justification', 'H', 'array-string'),

    // ---- Two Pointers ---------------------------------------------------
    L(125, 'Valid Palindrome', 'E', 'two-pointers'),
    L(392, 'Is Subsequence', 'E', 'two-pointers'),
    L(167, 'Two Sum II - Input Array Is Sorted', 'M', 'two-pointers'),
    L(11, 'Container With Most Water', 'M', 'two-pointers'),
    L(15, '3Sum', 'M', 'two-pointers'),

    // ---- Sliding Window -------------------------------------------------
    L(209, 'Minimum Size Subarray Sum', 'M', 'sliding-window'),
    L(3, 'Longest Substring Without Repeating Characters', 'M', 'sliding-window'),
    L(30, 'Substring with Concatenation of All Words', 'H', 'sliding-window'),
    L(76, 'Minimum Window Substring', 'H', 'sliding-window'),

    // ---- Matrix ---------------------------------------------------------
    L(36, 'Valid Sudoku', 'M', 'matrix'),
    L(54, 'Spiral Matrix', 'M', 'matrix'),
    L(48, 'Rotate Image', 'M', 'matrix'),
    L(73, 'Set Matrix Zeroes', 'M', 'matrix'),
    L(289, 'Game of Life', 'M', 'matrix'),

    // ---- Hashmap --------------------------------------------------------
    L(383, 'Ransom Note', 'E', 'hashmap'),
    L(205, 'Isomorphic Strings', 'E', 'hashmap'),
    L(290, 'Word Pattern', 'E', 'hashmap'),
    L(242, 'Valid Anagram', 'E', 'hashmap'),
    L(49, 'Group Anagrams', 'M', 'hashmap'),
    L(1, 'Two Sum', 'E', 'hashmap'),
    L(202, 'Happy Number', 'E', 'hashmap'),
    L(219, 'Contains Duplicate II', 'E', 'hashmap'),
    L(128, 'Longest Consecutive Sequence', 'M', 'hashmap'),

    // ---- Intervals ------------------------------------------------------
    L(228, 'Summary Ranges', 'E', 'intervals'),
    L(56, 'Merge Intervals', 'M', 'intervals'),
    L(57, 'Insert Interval', 'M', 'intervals'),
    L(452, 'Minimum Number of Arrows to Burst Balloons', 'M', 'intervals'),

    // ---- Stack ----------------------------------------------------------
    L(20, 'Valid Parentheses', 'E', 'stack'),
    L(71, 'Simplify Path', 'M', 'stack'),
    L(155, 'Min Stack', 'M', 'stack'),
    L(150, 'Evaluate Reverse Polish Notation', 'M', 'stack'),
    L(224, 'Basic Calculator', 'H', 'stack'),

    // ---- Linked List ----------------------------------------------------
    L(141, 'Linked List Cycle', 'E', 'linked-list'),
    L(2, 'Add Two Numbers', 'M', 'linked-list'),
    L(21, 'Merge Two Sorted Lists', 'E', 'linked-list'),
    L(138, 'Copy List with Random Pointer', 'M', 'linked-list'),
    L(92, 'Reverse Linked List II', 'M', 'linked-list'),
    L(25, 'Reverse Nodes in k-Group', 'H', 'linked-list'),
    L(19, 'Remove Nth Node From End of List', 'M', 'linked-list'),
    L(82, 'Remove Duplicates from Sorted List II', 'M', 'linked-list'),
    L(61, 'Rotate List', 'M', 'linked-list'),
    L(86, 'Partition List', 'M', 'linked-list'),
    L(146, 'LRU Cache', 'M', 'linked-list'),

    // ---- Binary Tree General --------------------------------------------
    L(104, 'Maximum Depth of Binary Tree', 'E', 'tree'),
    L(100, 'Same Tree', 'E', 'tree'),
    L(226, 'Invert Binary Tree', 'E', 'tree'),
    L(101, 'Symmetric Tree', 'E', 'tree'),
    L(105, 'Construct Binary Tree from Preorder and Inorder Traversal', 'M', 'tree'),
    L(106, 'Construct Binary Tree from Inorder and Postorder Traversal', 'M', 'tree'),
    L(117, 'Populating Next Right Pointers in Each Node II', 'M', 'tree'),
    L(114, 'Flatten Binary Tree to Linked List', 'M', 'tree'),
    L(112, 'Path Sum', 'E', 'tree'),
    L(129, 'Sum Root to Leaf Numbers', 'M', 'tree'),
    L(124, 'Binary Tree Maximum Path Sum', 'H', 'tree'),
    L(173, 'Binary Search Tree Iterator', 'M', 'tree'),
    L(222, 'Count Complete Tree Nodes', 'E', 'tree'),
    L(236, 'Lowest Common Ancestor of a Binary Tree', 'M', 'tree'),

    // ---- Binary Tree BFS ------------------------------------------------
    L(199, 'Binary Tree Right Side View', 'M', 'tree-bfs'),
    L(637, 'Average of Levels in Binary Tree', 'E', 'tree-bfs'),
    L(102, 'Binary Tree Level Order Traversal', 'M', 'tree-bfs'),
    L(103, 'Binary Tree Zigzag Level Order Traversal', 'M', 'tree-bfs'),

    // ---- Binary Search Tree ---------------------------------------------
    L(530, 'Minimum Absolute Difference in BST', 'E', 'bst'),
    L(230, 'Kth Smallest Element in a BST', 'M', 'bst'),
    L(98, 'Validate Binary Search Tree', 'M', 'bst'),

    // ---- Graph General --------------------------------------------------
    L(200, 'Number of Islands', 'M', 'graph'),
    L(130, 'Surrounded Regions', 'M', 'graph'),
    L(133, 'Clone Graph', 'M', 'graph'),
    L(399, 'Evaluate Division', 'M', 'graph'),
    L(207, 'Course Schedule', 'M', 'graph'),
    L(210, 'Course Schedule II', 'M', 'graph'),

    // ---- Graph BFS ------------------------------------------------------
    L(909, 'Snakes and Ladders', 'M', 'graph-bfs'),
    L(433, 'Minimum Genetic Mutation', 'M', 'graph-bfs'),
    L(127, 'Word Ladder', 'H', 'graph-bfs'),

    // ---- Trie -----------------------------------------------------------
    L(208, 'Implement Trie (Prefix Tree)', 'M', 'trie'),
    L(211, 'Design Add and Search Words Data Structure', 'M', 'trie'),
    L(212, 'Word Search II', 'H', 'trie'),

    // ---- Backtracking ---------------------------------------------------
    L(17, 'Letter Combinations of a Phone Number', 'M', 'backtracking'),
    L(77, 'Combinations', 'M', 'backtracking'),
    L(46, 'Permutations', 'M', 'backtracking'),
    L(39, 'Combination Sum', 'M', 'backtracking'),
    L(52, 'N-Queens II', 'H', 'backtracking'),
    L(22, 'Generate Parentheses', 'M', 'backtracking'),
    L(79, 'Word Search', 'M', 'backtracking'),

    // ---- Divide & Conquer -----------------------------------------------
    L(108, 'Convert Sorted Array to Binary Search Tree', 'E', 'divide-conquer'),
    L(148, 'Sort List', 'M', 'divide-conquer'),
    L(427, 'Construct Quad Tree', 'M', 'divide-conquer'),
    L(23, 'Merge k Sorted Lists', 'H', 'divide-conquer'),

    // ---- Kadane ---------------------------------------------------------
    L(53, 'Maximum Subarray', 'M', 'kadane'),
    L(918, 'Maximum Sum Circular Subarray', 'M', 'kadane'),

    // ---- Binary Search --------------------------------------------------
    L(35, 'Search Insert Position', 'E', 'binary-search'),
    L(74, 'Search a 2D Matrix', 'M', 'binary-search'),
    L(162, 'Find Peak Element', 'M', 'binary-search'),
    L(33, 'Search in Rotated Sorted Array', 'M', 'binary-search'),
    L(34, 'Find First and Last Position of Element in Sorted Array', 'M', 'binary-search'),
    L(153, 'Find Minimum in Rotated Sorted Array', 'M', 'binary-search'),
    L(4, 'Median of Two Sorted Arrays', 'H', 'binary-search'),

    // ---- Heap -----------------------------------------------------------
    L(215, 'Kth Largest Element in an Array', 'M', 'heap'),
    L(502, 'IPO', 'H', 'heap'),
    L(373, 'Find K Pairs with Smallest Sums', 'M', 'heap'),
    L(295, 'Find Median from Data Stream', 'H', 'heap'),

    // ---- Bit Manipulation -----------------------------------------------
    L(67, 'Add Binary', 'E', 'bits'),
    L(190, 'Reverse Bits', 'E', 'bits'),
    L(191, 'Number of 1 Bits', 'E', 'bits'),
    L(136, 'Single Number', 'E', 'bits'),
    L(137, 'Single Number II', 'M', 'bits'),
    L(201, 'Bitwise AND of Numbers Range', 'M', 'bits'),

    // ---- Math -----------------------------------------------------------
    L(9, 'Palindrome Number', 'E', 'math'),
    L(66, 'Plus One', 'E', 'math'),
    L(172, 'Factorial Trailing Zeroes', 'M', 'math'),
    L(69, 'Sqrt(x)', 'E', 'math'),
    L(50, 'Pow(x, n)', 'M', 'math'),
    L(149, 'Max Points on a Line', 'H', 'math'),

    // ---- 1D DP ----------------------------------------------------------
    L(70, 'Climbing Stairs', 'E', 'dp-1d'),
    L(198, 'House Robber', 'M', 'dp-1d'),
    L(139, 'Word Break', 'M', 'dp-1d'),
    L(322, 'Coin Change', 'M', 'dp-1d'),
    L(300, 'Longest Increasing Subsequence', 'M', 'dp-1d'),

    // ---- Multidimensional DP --------------------------------------------
    L(120, 'Triangle', 'M', 'dp-2d'),
    L(64, 'Minimum Path Sum', 'M', 'dp-2d'),
    L(63, 'Unique Paths II', 'M', 'dp-2d'),
    L(5, 'Longest Palindromic Substring', 'M', 'dp-2d'),
    L(97, 'Interleaving String', 'M', 'dp-2d'),
    L(72, 'Edit Distance', 'M', 'dp-2d'),
    L(123, 'Best Time to Buy and Sell Stock III', 'H', 'dp-2d'),
    L(188, 'Best Time to Buy and Sell Stock IV', 'H', 'dp-2d'),
    L(221, 'Maximal Square', 'M', 'dp-2d')
  ];

  /* Each group is an arc, with the island it happens on and the crewmate who
     leads it — so progress reads as a voyage rather than a checklist. */
  const ARCS = {
    'array-string':   { arc: 'Dawn Island',        lead: 'luffy',   power: 'rubber' },
    'two-pointers':   { arc: 'Twin Capes',         lead: 'zoro',    power: 'blades' },
    'sliding-window': { arc: 'Whisky Peak',        lead: 'nami',    power: 'room' },
    'matrix':         { arc: 'Little Garden',      lead: 'usopp',   power: 'shot' },
    'hashmap':        { arc: 'Drum Island',        lead: 'robin',   power: 'sprout' },
    'intervals':      { arc: 'Alabasta',           lead: 'nami',    power: 'storm' },
    'stack':          { arc: 'Jaya',               lead: 'usopp',   power: 'shot' },
    'linked-list':    { arc: 'Skypiea',            lead: 'chopper', power: 'song' },
    'tree':           { arc: 'Water Seven',        lead: 'franky',  power: 'quake' },
    'tree-bfs':       { arc: 'Enies Lobby',        lead: 'robin',   power: 'sprout' },
    'bst':            { arc: 'Thriller Bark',      lead: 'brook',   power: 'song' },
    'graph':          { arc: 'Sabaody',            lead: 'law',     power: 'room' },
    'graph-bfs':      { arc: 'Impel Down',         lead: 'ace',     power: 'flame' },
    'trie':           { arc: 'Marineford',         lead: 'aokiji',  power: 'ice' },
    'backtracking':   { arc: 'Fish-Man Island',    lead: 'jinbe',   power: 'quake' },
    'divide-conquer': { arc: 'Punk Hazard',        lead: 'law',     power: 'room' },
    'kadane':         { arc: 'Dressrosa',          lead: 'zoro',    power: 'blades' },
    'binary-search':  { arc: 'Zou',                lead: 'usopp',   power: 'shot' },
    'heap':           { arc: 'Whole Cake Island',  lead: 'sanji',   power: 'flame' },
    'bits':           { arc: 'Wano',               lead: 'zoro',    power: 'blades' },
    'math':           { arc: 'Onigashima',         lead: 'nami',    power: 'storm' },
    'dp-1d':          { arc: 'Egghead',            lead: 'franky',  power: 'quake' },
    'dp-2d':          { arc: 'Laugh Tale',         lead: 'luffy',   power: 'rubber' }
  };

  const TIER = { E: 'grunt', M: 'officer', H: 'warlord' };
  const DIFF = { E: 'Easy', M: 'Medium', H: 'Hard' };

  root.LC150 = LC150;
  root.LC150_ARCS = ARCS;
  root.LC150_TIER = TIER;
  root.LC150_DIFF = DIFF;
}(typeof window !== 'undefined' ? window : this));
