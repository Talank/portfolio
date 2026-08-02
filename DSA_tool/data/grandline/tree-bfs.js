/* Enies Lobby — level-order traversal.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['binary-tree-right-side-view'] = {
    id: 'binary-tree-right-side-view',
    epNumber: 71,
    title: 'The Tower Seen From the Sea',
    arc: 'Enies Lobby',
    patternId: 'tree-dfs-bfs',
    scene: 'islands',
    leetcode: { name: 'Binary Tree Right Side View', number: 199, difficulty: 'Medium', url: 'https://leetcode.com/problems/binary-tree-right-side-view/' },
    problem: 'Given the root of a binary tree, imagine standing on its right side. Return the values of the nodes you can see, ordered from top to bottom.',
    example: 'tree = [1, 2, 3, null, 5, null, 4]  →  [1, 3, 4]',

    h: 220,
    props: [
      { id: 'a1', emoji: '🏛️', label: '1', x: 50, y: 16 },
      { id: 'a2', emoji: '🏛️', label: '2', x: 30, y: 44 },
      { id: 'a3', emoji: '🏛️', label: '3', x: 70, y: 44 },
      { id: 'a5', emoji: '🏛️', label: '5', x: 40, y: 72 },
      { id: 'a4', emoji: '🏛️', label: '4', x: 80, y: 72 }
    ],
    ledger: [
      { id: 'V0', x: 10, y: 16 },
      { id: 'V1', x: 10, y: 44 },
      { id: 'V2', x: 10, y: 72 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "We're approaching the Tower of Justice from the sea, on the right. From out here you can only see the rightmost window on each floor — everything behind it is hidden.",
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "So we want, for every floor, the window furthest to the right. Do we just keep walking right from the top?",
        p: { a1: 'lit', a3: 'lit' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Careful. That works only while the right side keeps going. If a floor has no right-hand room at all, what you see is whatever is furthest right on that floor — which may hang off the left side of the building.",
        p: { a5: 'lit' },
        sfx: 'error'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Level five! It hangs under the left tower, but there's nothing to its right on that floor. So from the sea it would be visible — if there were nothing else on that floor.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is why we survey floor by floor rather than following a wall. Take the whole floor at once, and report its last room.",
        p: { V0: 'lit', V1: 'lit', V2: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Here is the trick that makes 'a whole floor at once' possible. Put the root in a queue. At the top of each round, the number of rooms waiting in that queue IS the width of the current floor.",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "So I snapshot that count first, then take exactly that many out — and everything I add while draining belongs to the NEXT floor, not this one.",
        p: { a1: 'good' }, l: { V0: 'see 1' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Floor two holds rooms two and three. The last one drained is three — that is what the sea sees. Floor three holds five and four; the last is four.",
        p: { a2: 'dim', a3: 'good', a5: 'dim', a4: 'good' }, l: { V1: 'see 3', V2: 'see 4' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "One, three, four. And if I'd just walked down the right wall I'd have got one, three, four here too — but only because this building happens to be lucky.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Take a tower whose right side stops after two floors while the left side runs on for six. Walking the wall reports two floors. The survey reports six. That is the difference between the two methods.",
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "And if you snapshot the count AFTER you start adding children, the floors bleed into each other and the whole thing quietly falls apart.",
        p: { V1: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Read the width before you start building the next floor. One line, and it is the line the entire family of level-order problems rests on.",
        p: { V1: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'At the top of each round of a BFS the queue holds exactly one complete level — snapshot its length before enqueuing anything, and every level-order problem becomes a matter of what you do with that slice.',
    complexity: '<b>Time O(n)</b> — every node enters and leaves the queue once. <b>Space O(w)</b> for the widest level, which on a complete tree is about n/2. A DFS that records the first node seen at each new depth is also O(n) and costs O(h) space instead.',
    pitfall: 'Assuming the right side view is "walk right children only". A node with no right sibling anywhere on its level is visible even if it hangs off a left branch. Also, capture the level width <b>before</b> enqueuing children, never during.',
    solution: `from collections import deque

def right_side_view(root):
    if not root:
        return []
    out = []
    q = deque([root])
    while q:
        width = len(q)              # this IS the current level's width
        for i in range(width):
            node = q.popleft()
            if i == width - 1:      # last one drained on this level
                out.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
    return out`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Same tower, opposite shore: Franky sails around and wants the LEFT side view. What is the smallest change?",
        options: [
          'Record the FIRST node drained on each level instead of the last',
          'Enqueue right children before left children',
          'Reverse the final answer',
          'Traverse only left children'
        ],
        correct: 0,
        explain: 'The level slice already contains everything; only which end of it you report changes. Swapping enqueue order also works but muddies the next level for no benefit, reversing the answer flips top-to-bottom rather than left-to-right, and following left children only has exactly the symmetric bug as following right children only.',
        hint: 'The level is already in front of you in order. Which element of it do you want?'
      },
      {
        tag: 'TWEAK',
        q: "Instead of the view, Chopper wants the AVERAGE value on each floor. What changes in the loop?",
        options: [
          'Sum every node drained in the level and divide by the snapshotted width',
          'Divide the total of all nodes by the tree height',
          'Track a running average as nodes are enqueued',
          'Nothing — the same code produces averages'
        ],
        correct: 0,
        explain: 'The width snapshot is doing double duty: it bounds the drain and it is the denominator. This is why the level-slice shape generalises so well — the same skeleton answers view, average, sum, maximum, and zigzag, differing only in what happens inside the slice.',
        hint: 'You already captured the count of nodes on this level. What else is that number good for?'
      },
      {
        tag: 'PITFALL',
        q: "Nami writes <code>while q: node = q.popleft(); ...</code> with no width snapshot, and tries to detect level changes by comparing node depths she stores alongside each node. Is that wrong?",
        options: [
          'No — storing depth per node is a correct alternative; the snapshot is just cheaper and needs no extra state',
          'Yes — depths cannot be known during BFS',
          'Yes — it visits nodes out of order',
          'No, and it is strictly better than the snapshot'
        ],
        correct: 0,
        explain: 'Both are correct. Pairing each node with its depth is a standard variant and is sometimes clearer, at the cost of storing a second value per queue entry. The point of the snapshot is that BFS already encodes level boundaries in the queue length, so the extra state is unnecessary.',
        hint: 'Ask whether the alternative actually produces wrong output, or merely costs a little more.'
      }
    ]
  };

  E['average-of-levels'] = {
    id: 'average-of-levels',
    epNumber: 72,
    title: 'Weighing Each Floor of the Courthouse',
    arc: 'Enies Lobby',
    patternId: 'tree-dfs-bfs',
    scene: 'islands',
    leetcode: { name: 'Average of Levels in Binary Tree', number: 637, difficulty: 'Easy', url: 'https://leetcode.com/problems/average-of-levels-in-binary-tree/' },
    problem: 'Given the root of a binary tree, return an array of the average value of the nodes on each level, from the top down.',
    example: 'tree = [3, 9, 20, null, null, 15, 7]  →  [3.00000, 14.50000, 11.00000]',

    h: 220,
    props: [
      { id: 'c3', emoji: '⚖️', label: '3', x: 50, y: 18 },
      { id: 'c9', emoji: '⚖️', label: '9', x: 28, y: 48 },
      { id: 'c20', emoji: '⚖️', label: '20', x: 72, y: 48 },
      { id: 'c15', emoji: '⚖️', label: '15', x: 60, y: 78 },
      { id: 'c7', emoji: '⚖️', label: '7', x: 86, y: 78 }
    ],
    ledger: [
      { id: 'A0', x: 12, y: 18 },
      { id: 'A1', x: 12, y: 48 },
      { id: 'A2', x: 12, y: 78 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "The courthouse has to be weighed floor by floor before they load the cannons. Not the whole building — each floor's average, separately.",
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "That's exactly the shape BFS hands you for free. You don't have to work out which floor anything is on — the queue already knows.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Snapshot the queue length. That is the number of rooms on this floor — the denominator. Then drain exactly that many, adding as you go. That is the numerator.",
        p: { A0: 'lit', A1: 'lit', A2: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Floor one: one room, weighing three. Average three.",
        p: { c3: 'good' }, l: { A0: '3 / 1 = 3' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Floor two: two rooms, nine and twenty. Twenty-nine over two — fourteen and a half.",
        p: { c9: 'good', c20: 'good' }, l: { A1: '29 / 2 = 14.5' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Floor three: fifteen and seven. Twenty-two over two — eleven.",
        p: { c15: 'good', c7: 'good' }, l: { A2: '22 / 2 = 11' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Depth-first would answer this too, but it would need a running sum and a count indexed by depth, carried through the recursion. Breadth-first hands you the level as a unit, because the level IS its unit of work.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Pick the traversal whose natural chunk matches the question's chunk. That's a rule I can actually remember.",
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "One thing worries me. These are courthouse ledgers — the values can be huge. If a floor has thousands of rooms, does the running total overflow?",
        p: { c20: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "In a fixed-width language, yes — sum with a wider type, or divide as you go. In Python integers grow, so it is safe, but knowing which of those two worlds you are in is exactly the sort of thing an interviewer is listening for.",
        p: { c20: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'Choose the traversal whose natural unit matches the question\'s unit — BFS materialises a level as a slice, so any per-level statistic falls out with no depth bookkeeping at all.',
    complexity: '<b>Time O(n)</b> — one visit per node. <b>Space O(w)</b> for the widest level. A DFS solution is O(n) time and O(h) space but needs per-depth accumulators.',
    pitfall: 'Integer division. In languages where <code>/</code> truncates, the average of 9 and 20 becomes 14 rather than 14.5. Also watch the running sum\'s width on wide levels with large values.',
    solution: `from collections import deque

def average_of_levels(root):
    if not root:
        return []
    out = []
    q = deque([root])
    while q:
        width = len(q)              # denominator, captured before enqueuing
        total = 0
        for _ in range(width):
            node = q.popleft()
            total += node.val
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(total / width)   # true division, not integer division
    return out`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different tower, same slice: Zoro wants the LARGEST value on each floor rather than the average. What is the smallest change to the loop?",
        options: [
          'Track a running maximum over the drained level instead of a running sum',
          'Sort each level before draining it',
          'Use a max-heap instead of a queue',
          'Traverse depth-first instead'
        ],
        correct: 0,
        explain: 'The level-slice skeleton is untouched; only the accumulator changes. Swapping the queue for a heap would destroy the level structure entirely, since a heap reorders by value rather than by arrival — and the level boundaries are exactly what arrival order encodes.',
        hint: 'Which part of the loop actually knows what "average" means?'
      },
      {
        tag: 'PITFALL',
        q: "Chopper writes the accumulator in a language where <code>/</code> on two integers truncates. A floor holds 9 and 20. What does he report, and what should he?",
        options: [
          '14 instead of 14.5 — he must divide in floating point',
          '15 instead of 14.5, from rounding up',
          '14.5, correctly; truncation only affects negatives',
          '29, because the division is skipped'
        ],
        correct: 0,
        explain: 'Integer division silently truncates toward zero, so 29/2 becomes 14. It passes any test whose levels happen to divide evenly, which is what makes it a nasty one. Cast the sum, or the count, to a floating-point type before dividing.',
        hint: 'What is 29 divided by 2 when both operands are integers?'
      },
      {
        tag: 'TWEAK',
        q: "Robin asks for the averages from the BOTTOM floor upward. What changes?",
        options: [
          'Nothing in the traversal — reverse the collected list at the end',
          'Traverse the tree upward from the leaves',
          'Use a stack instead of a queue',
          'Enqueue children before parents'
        ],
        correct: 0,
        explain: 'A tree has no upward links to follow, and swapping the queue for a stack turns BFS into DFS and destroys the level grouping. The traversal that produces the data is independent of the order you present it in — reverse at the end, or push onto the front of a deque.',
        hint: 'Is this a question about how you walk the tree, or about how you print the result?'
      }
    ]
  };

  E['zigzag-level-order'] = {
    id: 'zigzag-level-order',
    epNumber: 73,
    title: 'The Serpentine Report',
    arc: 'Enies Lobby',
    patternId: 'tree-dfs-bfs',
    scene: 'islands',
    leetcode: { name: 'Binary Tree Zigzag Level Order Traversal', number: 103, difficulty: 'Medium', url: 'https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/' },
    problem: 'Return the level-order traversal of a binary tree in zigzag order: the first level left to right, the next right to left, and so on.',
    example: 'tree = [3, 9, 20, null, null, 15, 7]  →  [[3], [20, 9], [15, 7]]',

    h: 220,
    props: [
      { id: 'z3', emoji: '📡', label: '3', x: 50, y: 18 },
      { id: 'z9', emoji: '📡', label: '9', x: 28, y: 48 },
      { id: 'z20', emoji: '📡', label: '20', x: 72, y: 48 },
      { id: 'z15', emoji: '📡', label: '15', x: 60, y: 78 },
      { id: 'z7', emoji: '📡', label: '7', x: 86, y: 78 }
    ],
    ledger: [
      { id: 'R0', x: 12, y: 18 },
      { id: 'R1', x: 12, y: 48 },
      { id: 'R2', x: 12, y: 78 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "The signal relay only works if each floor is read in the opposite direction to the floor above. Top floor left to right, next floor right to left, and back again all the way down.",
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Easy — I'll flip which child I put in the queue first on alternate floors. Left first, then right first, then left first...",
        p: { z9: 'lit', z20: 'lit' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That is the trap, and it is a subtle one. Changing the enqueue order does not only reverse the next floor — it scrambles the floor after that, because those children are enqueued from a parent order you have already disturbed.",
        p: { z15: 'bad', z7: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "So keep the walk completely boring. Always left child then right child, every single level, no exceptions.",
        p: { z15: 'dim', z7: 'dim' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And handle the zigzag where it belongs — at presentation. Build each level in the natural order, then reverse it if the level index is odd.",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Level zero: just three. Even level, leave it.",
        p: { z3: 'good' }, l: { R0: '[3]' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Level one collects nine then twenty. Odd level — reverse it. Twenty, nine.",
        p: { z9: 'good', z20: 'good' }, l: { R1: '[20, 9]' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Level two collects fifteen then seven. Even level — leave it alone.",
        p: { z15: 'good', z7: 'good' }, l: { R2: '[15, 7]' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "If reversing a list per level offends you, collect into a double-ended structure and push to the front on odd levels instead. Same result, no reversal pass — but the reversal is O(width) and the traversal is already O(n), so it changes nothing asymptotically.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Keep the machinery dumb, put the cleverness in the output. I like that better than trying to be clever inside the queue.",
        sfx: 'chime'
      }
    ],

    insight: 'Keep the traversal uniform and handle presentation at the level boundary — altering enqueue order to fake a reversal corrupts the levels below it.',
    complexity: '<b>Time O(n)</b> — every node once, plus O(width) per reversal, which sums to O(n). <b>Space O(w)</b> for the queue and the level buffer.',
    pitfall: 'Alternating which child is enqueued first. It appears to work on level two and then quietly produces the wrong order on level three and below, because the parents were already out of order when their children were queued.',
    solution: `from collections import deque

def zigzag_level_order(root):
    if not root:
        return []
    out = []
    q = deque([root])
    left_to_right = True
    while q:
        width = len(q)
        level = []
        for _ in range(width):
            node = q.popleft()
            level.append(node.val)
            # Traversal order never changes — only the presentation does.
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(level if left_to_right else level[::-1])
        left_to_right = not left_to_right
    return out`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp implements the zigzag by swapping which child he enqueues first on alternate levels. On a full tree of four levels, where does the output first go wrong?",
        options: [
          'Level three — its nodes are enqueued from parents whose order was already disturbed on level two',
          'Level one, immediately',
          'Level two, the first flipped level',
          'It never goes wrong; the method is correct'
        ],
        correct: 0,
        explain: 'Level two comes out reversed as intended, so the bug hides. But those level-two nodes are now sitting in the queue in reversed order, and their children inherit that order on top of the next flip — two reversals interacting produce an order that is neither. Presentation-time reversal never has this problem.',
        hint: 'A flipped level is correct on screen — but what order is it left in inside the queue?'
      },
      {
        tag: 'TRANSFER',
        q: "Different report, same discipline: Brook wants each level printed sorted by value. Where does the sorting belong?",
        options: [
          'In the level buffer after the slice is drained, leaving the traversal untouched',
          'In the queue, by replacing it with a priority queue',
          'In the tree, by rearranging children before traversing',
          'It cannot be done with BFS'
        ],
        correct: 0,
        explain: 'Same lesson as the zigzag: the traversal establishes the levels, and anything about how a level is presented is done to the buffer afterwards. A priority queue would reorder across level boundaries and destroy the very grouping you need.',
        hint: 'What is the one thing the queue is responsible for, and would sorting inside it preserve that?'
      },
      {
        tag: 'TWEAK',
        q: "Robin wants the zigzag without ever calling reverse, for a tree whose levels are enormous. What structure gives it directly?",
        options: [
          'A deque per level — append on left-to-right levels, appendleft on right-to-left ones',
          'A max-heap per level',
          'A stack for the whole traversal',
          'Two queues swapped each level'
        ],
        correct: 0,
        explain: 'Pushing to the front of a deque builds the reversed order as you go, at O(1) per node. It saves a pass, though not a complexity class — the reversal was already O(width) and the traversal is O(n) either way. Two swapped stacks is the other classic form of this same idea.',
        hint: 'You want the order built backwards as it arrives, not flipped afterwards.'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
