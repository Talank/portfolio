/* Skypiea — linked lists.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['add-two-numbers'] = {
    id: 'add-two-numbers',
    epNumber: 123,
    title: 'Two Bells Rung in Reverse',
    arc: 'Skypiea',
    patternId: 'linked-list-reversal',
    scene: 'sky',
    leetcode: { name: 'Add Two Numbers', number: 2, difficulty: 'Medium', url: 'https://leetcode.com/problems/add-two-numbers/' },
    problem: 'Two non-negative integers are stored as linked lists with their digits in reverse order. Add them and return the sum as a linked list in the same form.',
    example: 'l1 = 2 → 4 → 3, l2 = 5 → 6 → 4  →  7 → 0 → 8   (342 + 465 = 807)',

    h: 200,
    props: [
      { id: 'a1', emoji: '🔔', label: '2', x: 16, y: 26 },
      { id: 'a2', emoji: '🔔', label: '4', x: 38, y: 26 },
      { id: 'a3', emoji: '🔔', label: '3', x: 60, y: 26 },
      { id: 'b1', emoji: '🛎️', label: '5', x: 16, y: 54 },
      { id: 'b2', emoji: '🛎️', label: '6', x: 38, y: 54 },
      { id: 'b3', emoji: '🛎️', label: '4', x: 60, y: 54 }
    ],
    ledger: [
      { id: 'C', x: 85, y: 40 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The Skypiean bells record numbers backwards — the smallest place first. Two of them have to be added, and the answer written the same way.",
        p: { a1: 'lit', b1: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Backwards is a gift, not an obstacle. Column addition starts at the smallest place, and these lists already begin there — so we simply walk both from the head, adding as we go.",
        p: { C: 'lit' }, l: { C: 'carry' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Two plus five is seven. Four plus six is ten — write zero, carry one. Three plus four plus the carry is eight.",
        p: { a1: 'good', b1: 'good', a2: 'good', b2: 'good', a3: 'good', b3: 'good' }, l: { C: '7 → 0 → 8 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And the lists needn't be the same length. A missing digit is just a zero.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So the loop runs while either list has nodes left OR a carry is outstanding — the same three-condition loop as adding binary strings. A final carry becomes a new node at the end.",
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "A dummy head makes building the answer painless. Otherwise the first node needs its own special case, separate from all the rest.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Attach to the dummy's tail every time, and return the dummy's next at the end. One shape for every node, first included.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "What if the bells were recorded the normal way round, biggest place first?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then you would reverse both lists, add, and reverse the answer — or push the digits onto stacks and pop them. Either way you are paying to get back to the order this problem hands you for free.",
        sfx: 'gong'
      }
    ],

    insight: 'Digits stored least-significant-first are exactly the order column addition wants — walk both lists from the head with a carry, and let the loop continue while either list or the carry survives.',
    complexity: '<b>Time O(max(m, n))</b> — one pass over the longer list. <b>Space O(max(m, n))</b> for the result, which is unavoidable since it must be returned.',
    pitfall: 'Ending the loop when both lists are exhausted and dropping a final carry, so 5 + 5 returns a single node 0 instead of 0 → 1. And forgetting that the lists may differ in length.',
    solution: `def add_two_numbers(l1, l2):
    dummy = tail = ListNode(0)     # dummy: no special case for the first node
    carry = 0

    # Continue while EITHER list has digits or a carry is outstanding.
    while l1 or l2 or carry:
        total = carry
        if l1:
            total += l1.val; l1 = l1.next
        if l2:
            total += l2.val; l2 = l2.next
        carry, digit = divmod(total, 10)
        tail.next = ListNode(digit)
        tail = tail.next

    return dummy.next`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper's loop condition is <code>while l1 or l2</code>. What does he return for 5 + 5?",
        options: [
          'A single node 0 — the final carry never becomes a digit',
          '0 → 1, correctly',
          '10 in one node',
          'An empty list'
        ],
        correct: 0,
        explain: 'One column is processed, writing 0 and carrying 1, and then both lists are exhausted so the loop ends with the carry stranded. It is the same leftover-state bug as dropping the final carry in binary addition or the last range in a sweep.',
        hint: 'What is still held in `carry` when both lists run out?'
      },
      {
        tag: 'TWEAK',
        q: "The digits are now stored MOST significant first and you may not modify the input lists. What is the cleanest approach?",
        options: [
          'Push both lists onto stacks, then pop in step — the stacks give you least-significant-first without reversing anything',
          'Reverse both lists in place, add, and reverse back',
          'Convert both to integers and add',
          'It cannot be done without modifying the lists'
        ],
        correct: 0,
        explain: 'That is Add Two Numbers II. Stacks give the reversal without mutating the inputs, and building the result by prepending keeps it in the required order. Converting to integers fails on lists long enough to overflow — which is why the numbers are in lists to begin with.',
        hint: 'You need to reach the last digit first, without reversing. What structure gives you that?'
      },
      {
        tag: 'TRANSFER',
        q: "Different bells, same dummy: Franky merges two sorted lists into one. What does the dummy head save him from?",
        options: [
          'Branching on which list supplies the first node — every node is attached the same way',
          'Null pointer errors in the middle of the lists',
          'Needing to track the list lengths',
          'Allocating new nodes'
        ],
        correct: 0,
        explain: 'The dummy exists to make the head unspecial. Without it, the first attachment sets the result head while every later one extends a tail — two shapes instead of one. Return dummy.next, never a saved head, since the real head is decided during the loop.',
        hint: 'What is different about attaching the very first node compared with all the others?'
      }
    ]
  };

  E['merge-two-sorted-lists'] = {
    id: 'merge-two-sorted-lists',
    epNumber: 124,
    title: 'Two Cloud Currents Joined',
    arc: 'Skypiea',
    patternId: 'linked-list-reversal',
    scene: 'sky',
    leetcode: { name: 'Merge Two Sorted Lists', number: 21, difficulty: 'Easy', url: 'https://leetcode.com/problems/merge-two-sorted-lists/' },
    problem: 'Merge two sorted linked lists into one sorted list, splicing together the nodes of the originals.',
    example: 'l1 = 1 → 2 → 4, l2 = 1 → 3 → 4  →  1 → 1 → 2 → 3 → 4 → 4',

    h: 200,
    props: [
      { id: 'p1', emoji: '☁️', label: '1', x: 18, y: 26 },
      { id: 'p2', emoji: '☁️', label: '2', x: 40, y: 26 },
      { id: 'p4', emoji: '☁️', label: '4', x: 62, y: 26 },
      { id: 'q1', emoji: '🌥️', label: '1', x: 18, y: 56 },
      { id: 'q3', emoji: '🌥️', label: '3', x: 40, y: 56 },
      { id: 'q4', emoji: '🌥️', label: '4', x: 62, y: 56 }
    ],
    ledger: [
      { id: 'T', x: 86, y: 42 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "Two cloud currents, each already in order, have to be woven into one — without building new clouds. Just re-tying the ropes between them.",
        p: { p1: 'lit', q1: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Stand at the front of both and repeatedly take whichever head is smaller, attaching it to the tail of what you have built. Both fronts only ever move forward.",
        p: { T: 'lit' }, l: { T: 'take the smaller head' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "One and one — take either. Then one, then two, then three, then four, then four.",
        p: { p1: 'good', q1: 'good', p2: 'good', q3: 'good', p4: 'good', q4: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And when one current runs out, the rest of the other is already sorted and already linked — attach it whole, in one move. No loop needed for the tail.",
        l: { T: 'attach the remainder ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "A dummy head again. Otherwise the very first take needs its own branch.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And take from the LEFT list on a tie, which keeps equal values in their original relative order. That is what makes the merge stable — the property merge sort depends on.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "No new nodes at all — every node in the answer was already in one of the inputs.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is why the space is constant. This merge is also the engine inside sorting a linked list, and inside merging k lists — worth being able to write without thinking.",
        sfx: 'gong'
      }
    ],

    insight: 'A merge only ever needs the two fronts, and once one list is exhausted the other can be attached whole — its remainder is already sorted and already linked.',
    complexity: '<b>Time O(m + n)</b> — each node handled once. <b>Space O(1)</b>, since nodes are re-linked rather than copied.',
    pitfall: 'Looping to attach the remaining list node by node, which is unnecessary work. And using <code>&lt;</code> rather than <code>&lt;=</code> on ties, which silently makes the merge unstable.',
    solution: `def merge_two_lists(list1, list2):
    dummy = tail = ListNode(0)

    while list1 and list2:
        if list1.val <= list2.val:      # <= keeps the merge stable
            tail.next, list1 = list1, list1.next
        else:
            tail.next, list2 = list2, list2.next
        tail = tail.next

    tail.next = list1 or list2          # attach the whole remainder at once
    return dummy.next`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different weave, same merge: Nami merges k sorted currents at once. Which approach is O(N log k) rather than O(N k)?",
        options: [
          'A min-heap of the k current heads, or repeated pairwise merging that halves the list count each round',
          'Scanning all k heads each time to find the smallest',
          'Concatenating everything and sorting',
          'Merging them one at a time into an accumulator'
        ],
        correct: 0,
        explain: 'Per output node, "which of the k fronts is smallest?" costs O(k) by scanning and O(log k) with a heap. Pairwise merging reaches the same bound through log k rounds of O(N) work. Merging one at a time re-walks the growing accumulator, giving O(N k).',
        hint: 'What does each output node cost under each strategy?'
      },
      {
        tag: 'PITFALL',
        q: "Chopper writes the loop with <code>&lt;</code> instead of <code>&lt;=</code>. What breaks?",
        options: [
          'Nothing about correctness — the output is still sorted — but equal values from the right list now come first, so the merge is no longer stable',
          'The merge produces an unsorted list',
          'It drops one of the equal values',
          'It loops forever on ties'
        ],
        correct: 0,
        explain: 'Worth being exact: the result is still correctly sorted. What is lost is stability, which matters when the nodes carry payloads whose original order is meaningful — and it is the property that makes merge sort a stable sort.',
        hint: 'On a tie, which list contributes first under each comparison, and does that affect sortedness or something else?'
      },
      {
        tag: 'TWEAK',
        q: "One of the two lists is empty. Does the code need a guard?",
        options: [
          'No — the while loop is skipped and <code>tail.next = list1 or list2</code> attaches the non-empty one, or None if both are empty',
          'Yes, empty lists must be checked first',
          'Yes, it dereferences a null head',
          'No, but it returns the dummy instead of the list'
        ],
        correct: 0,
        explain: 'The remainder attachment doubles as the empty-input case, which is a small example of choosing a formulation that absorbs its own edge cases — the same instinct as the ±infinity sentinels in the median problem.',
        hint: 'Trace the code with list1 = None and see which line does the work.'
      }
    ]
  };

  E['copy-list-random-pointer'] = {
    id: 'copy-list-random-pointer',
    epNumber: 125,
    title: 'The Vine That Points Anywhere',
    arc: 'Skypiea',
    patternId: 'linked-list-reversal',
    scene: 'sky',
    leetcode: { name: 'Copy List with Random Pointer', number: 138, difficulty: 'Medium', url: 'https://leetcode.com/problems/copy-list-with-random-pointer/' },
    problem: 'Deep copy a linked list where each node has a next pointer and a random pointer that may point to any node in the list, or to null.',
    example: 'Each copied node must point to the COPY of whatever the original pointed to, never to the original itself.',

    h: 200,
    props: [
      { id: 'o1', emoji: '🌿', label: 'A', x: 20, y: 28 },
      { id: 'o2', emoji: '🌿', label: 'B', x: 45, y: 28 },
      { id: 'o3', emoji: '🌿', label: 'C', x: 70, y: 28 },
      { id: 'mp', emoji: '🗺️', label: 'original → copy', x: 50, y: 62 }
    ],
    ledger: [
      { id: 'W', x: 50, y: 86 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "The vine has two kinds of link: one to the next vine along, and one that can reach out to any vine at all — including backwards, or to itself. We need a complete duplicate that shares nothing with the original.",
        p: { o1: 'lit', o2: 'lit', o3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Copy the nodes in one pass, then go back and fix the random pointers. But when I copy A's random pointer, the node it points at might not exist yet.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So build them all first, then wire. And to wire, you need to know which copy corresponds to which original — that is a map from original node to its clone.",
        p: { mp: 'good' }, l: { W: 'pass 1: clone, pass 2: wire' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "First pass makes every clone and records the pairing. Second pass sets each clone's next and random by looking up the original's targets in the map.",
        p: { o1: 'good', o2: 'good', o3: 'good' }, l: { W: 'O(n) time, O(n) space ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And the interviewer immediately asks for constant space.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then weave the clones INTO the original list. After each original node, insert its copy. Now every clone sits directly behind its original — the map is the list itself.",
        p: { mp: 'lit' }, l: { W: 'interleave A A′ B B′ C C′' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So a clone's random pointer is whatever its original's random points at, plus one step. No lookup needed.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then unweave: restore the original list's next pointers and extract the clone chain. Three passes, no extra structure at all.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "The unweaving is where people leave the original list mangled, isn't it.",
        sfx: 'gong'
      }
    ],

    insight: 'A pointer to an already-copied node must resolve to that node\'s clone, so you need a correspondence — either an explicit map, or the interleaving trick that makes each clone sit one step behind its original.',
    complexity: '<b>Time O(n)</b> for both approaches. <b>Space O(n)</b> with the map, <b>O(1)</b> with the interleaving weave (excluding the output).',
    pitfall: 'Wiring random pointers during the first pass, when the target clone may not exist yet. In the interleaved version, forgetting to restore the original list\'s next pointers on the way out.',
    solution: `def copy_random_list(head):
    if not head:
        return None

    # 1. Weave a clone in behind every original node.
    cur = head
    while cur:
        cur.next = Node(cur.val, cur.next)
        cur = cur.next.next

    # 2. Each clone's random is its original's random, one step along.
    cur = head
    while cur:
        if cur.random:
            cur.next.random = cur.random.next
        cur = cur.next.next

    # 3. Unweave, restoring the original list as we go.
    cur, clone_head = head, head.next
    while cur:
        clone = cur.next
        cur.next = clone.next
        clone.next = clone.next.next if clone.next else None
        cur = cur.next
    return clone_head`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper sets each clone's random pointer during the same pass that creates the clones. What goes wrong?",
        options: [
          'A random pointer aimed at a node further along the list resolves to a clone that does not exist yet',
          'The clones share values with the originals',
          'It creates a cycle',
          'Nothing; one pass is sufficient'
        ],
        correct: 0,
        explain: 'Random pointers can aim forwards, so the target clone may not have been created. Separating creation from wiring is the general fix whenever a structure contains references to arbitrary parts of itself — the same reason graph cloning records the clone before recursing.',
        hint: 'What does A.random point to if it aims at C, and has C been cloned yet?'
      },
      {
        tag: 'TWEAK',
        q: "In the interleaved version, Robin forgets step 3 and simply returns <code>head.next</code>. What is the consequence?",
        options: [
          'The clone list is correct, but the original list is left permanently interleaved with the clones — a destroyed input',
          'The clone list is wrong',
          'Nothing; the original is not needed',
          'It leaks memory'
        ],
        correct: 0,
        explain: 'The clone chain is reachable and correctly wired, so tests that only check the copy may pass. Mutating an input you were asked to copy is a real bug regardless — and an interviewer will ask what state the original is in when you finish.',
        hint: 'Follow the original head\'s next pointer after step 2. Where does it lead?'
      },
      {
        tag: 'TRANSFER',
        q: "Different structure, same correspondence: Franky deep-copies an arbitrary graph with cycles. Which part of this episode transfers directly?",
        options: [
          'The map from original to clone, which serves as both the visited set and the wiring table',
          'The interleaving trick, which works on any structure',
          'The three-pass approach',
          'Nothing; graphs need a different technique'
        ],
        correct: 0,
        explain: 'The map transfers exactly. The interleaving does not — it relies on a node having exactly one next pointer to hide a clone behind, which a general graph node does not have. Knowing which half of a technique generalises is the useful part.',
        hint: 'The weave hid each clone in the original\'s next pointer. Does a graph node have a spare pointer like that?'
      }
    ]
  };

  E['reverse-nodes-k-group'] = {
    id: 'reverse-nodes-k-group',
    epNumber: 126,
    title: 'Turning the Sky Road in Sections',
    arc: 'Skypiea',
    patternId: 'linked-list-reversal',
    scene: 'sky',
    leetcode: { name: 'Reverse Nodes in k-Group', number: 25, difficulty: 'Hard', url: 'https://leetcode.com/problems/reverse-nodes-in-k-group/' },
    problem: 'Reverse the nodes of a linked list k at a time. If the remaining nodes number fewer than k, leave them as they are.',
    example: 'list = 1 → 2 → 3 → 4 → 5, k = 2  →  2 → 1 → 4 → 3 → 5',

    h: 200,
    props: [
      { id: 'k1', emoji: '🌉', label: '1', x: 14, y: 32 },
      { id: 'k2', emoji: '🌉', label: '2', x: 34, y: 32 },
      { id: 'k3', emoji: '🌉', label: '3', x: 54, y: 32 },
      { id: 'k4', emoji: '🌉', label: '4', x: 74, y: 32 },
      { id: 'k5', emoji: '🌉', label: '5', x: 92, y: 32 }
    ],
    ledger: [
      { id: 'G', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The sky road has to be turned around in sections of k — but only complete sections. A leftover stub at the end stays as it is.",
        p: { k1: 'lit', k2: 'lit', k3: 'lit', k4: 'lit', k5: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So before reversing anything, COUNT. Walk k nodes ahead; if you run out, the rest stays untouched and you are finished.",
        p: { G: 'lit' }, l: { G: 'check k nodes exist first' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Because if you reverse first and then discover the section was short, you'd have to undo it.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then reverse the section with the ordinary three-pointer walk — save next, rewire, advance — stopping after exactly k nodes rather than at the end of the list.",
        p: { k1: 'good', k2: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And then stitch it back in. The node before the section has to point at the section's NEW head, and the section's new tail has to point at whatever comes next.",
        p: { k3: 'good', k4: 'good' }, l: { G: 'stitch both ends' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The old head becomes the new tail, which is exactly the node to continue from. Draw the three nodes around each rewire before writing a line — this is the problem where guessing does not survive.",
        p: { k5: 'dim' },
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Two and one, then four and three, and five sits alone so it stays put.",
        p: { k5: 'good' }, l: { G: '2 1 4 3 5 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "A dummy head before everything removes the special case for the very first section, which would otherwise have no predecessor to stitch to.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Count, reverse, stitch, advance. It's three easy problems stacked, and the stacking is the hard part.",
        sfx: 'gong'
      }
    ],

    insight: 'Check the section exists before reversing it — and every group reversal needs two stitches, one from the previous group\'s tail and one to the next group\'s head.',
    complexity: '<b>Time O(n)</b> — each node is counted once and reversed once. <b>Space O(1)</b> iteratively; the recursive version costs O(n/k) stack frames.',
    pitfall: 'Reversing before confirming that k nodes remain, which leaves a partial group reversed. And losing the connection to the following group — the old head becomes the new tail and must be linked forward.',
    solution: `def reverse_k_group(head, k):
    dummy = ListNode(0, head)
    group_prev = dummy

    while True:
        # 1. Confirm a full group exists before touching anything.
        node = group_prev
        for _ in range(k):
            node = node.next
            if not node:
                return dummy.next
        group_next = node.next

        # 2. Reverse exactly k nodes.
        prev, cur = group_next, group_prev.next
        for _ in range(k):
            cur.next, prev, cur = prev, cur, cur.next

        # 3. Stitch: old head is the new tail and the place to continue from.
        new_tail = group_prev.next
        group_prev.next = prev
        group_prev = new_tail`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp reverses each group first and checks the length afterwards, undoing it when the group is short. Why is that worse than counting first?",
        options: [
          'The undo is a second reversal with its own stitching, doubling the fiddly pointer work for no benefit',
          'It gives the wrong answer',
          'It changes the complexity to O(n²)',
          'It cannot be implemented'
        ],
        correct: 0,
        explain: 'It can be made correct, but every extra rewire is a chance to lose the list. The count is a cheap O(k) walk that removes the need for any undo path — a good illustration that the simplest correct structure usually beats the cleverest recovery.',
        hint: 'How much code does the undo path need, and how often is it exercised by tests?'
      },
      {
        tag: 'TWEAK',
        q: "The rule changes: a final group of fewer than k nodes must ALSO be reversed. What is the smallest change?",
        options: [
          'Drop the "return early if fewer than k remain" check and reverse however many are left',
          'Reverse the whole list first',
          'Pad the list to a multiple of k',
          'Process the list backwards'
        ],
        correct: 0,
        existing: true,
        explain: 'The length check exists solely to enforce the leave-the-stub rule. Removing it — and reversing whatever count actually remains — gives the variant directly. It is a good check on whether you know what each guard is for.',
        hint: 'Which line encodes the "leave short groups alone" rule?'
      },
      {
        tag: 'TRANSFER',
        q: "Different bridge, same stitching: Nami reverses only the nodes between positions left and right. What does she need before reversing?",
        options: [
          'A pointer to the node just BEFORE position left, so the reversed section can be stitched back in',
          'The list length',
          'A copy of the list',
          'The node at position right only'
        ],
        correct: 0,
        explain: 'That is Reverse Linked List II, and it is one group of this problem. The predecessor is what every in-place section reversal needs — which is exactly why the dummy head exists, so that even a section starting at the head has one.',
        hint: 'After reversing a middle section, what has to point at its new head?'
      }
    ]
  };

  E['remove-nth-from-end'] = {
    id: 'remove-nth-from-end',
    epNumber: 127,
    title: 'Cutting the Rope N From the End',
    arc: 'Skypiea',
    patternId: 'fast-slow-pointers',
    scene: 'sky',
    leetcode: { name: 'Remove Nth Node From End of List', number: 19, difficulty: 'Medium', url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/' },
    problem: 'Given the head of a linked list, remove the nth node from the end and return the head. Do it in one pass.',
    example: 'list = 1 → 2 → 3 → 4 → 5, n = 2  →  1 → 2 → 3 → 5',

    h: 200,
    props: [
      { id: 'r1', emoji: '🪢', label: '1', x: 14, y: 32 },
      { id: 'r2', emoji: '🪢', label: '2', x: 34, y: 32 },
      { id: 'r3', emoji: '🪢', label: '3', x: 54, y: 32 },
      { id: 'r4', emoji: '🪢', label: '4', x: 74, y: 32 },
      { id: 'r5', emoji: '🪢', label: '5', x: 92, y: 32 }
    ],
    ledger: [
      { id: 'GAP', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "Cut the second rope from the end. But we can't see the end from here, and we're only allowed to walk the line once.",
        p: { r4: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Count the length first, then walk again to the right spot? That's two passes.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Instead, hold the gap. Send one hand n steps ahead, then walk both hands together. When the leading hand reaches the end, the trailing hand is exactly n from it.",
        p: { GAP: 'lit' }, l: { GAP: 'gap of n, held' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "The gap does the counting for us. We never learn the length and never need to.",
        p: { r3: 'good', r5: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "To remove a node you need its PREDECESSOR, so stop the trailing hand one short — on the node before the one to cut.",
        p: { r4: 'bad' }, l: { GAP: 'stop one short' },
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And if the node to cut is the head itself? Then its predecessor doesn't exist.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is what the dummy head is for. Start both hands at a dummy in front of the list and the head suddenly has a predecessor like everything else. The special case disappears rather than being handled.",
        p: { r4: 'dim' }, l: { GAP: 'dummy → head has a predecessor ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "One pass, constant space, and no branch for the head.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Whenever a list problem has an awkward case at the front, reach for a dummy before reaching for an if.",
        sfx: 'gong'
      }
    ],

    insight: 'A fixed gap between two pointers converts "n from the end" into "the leading pointer reached the end" — and a dummy head gives the real head a predecessor so removal needs no special case.',
    complexity: '<b>Time O(L)</b> — one pass. <b>Space O(1)</b>. Counting the length first is also O(L) but takes two passes.',
    pitfall: 'Stopping the trailing pointer on the node to delete rather than on its predecessor. And removing the head without a dummy, which needs a separate branch that is easy to get wrong.',
    solution: `def remove_nth_from_end(head, n):
    dummy = ListNode(0, head)      # gives the head a predecessor
    lead = trail = dummy

    for _ in range(n):             # open a gap of n
        lead = lead.next

    # Walk together; lead stops on the last node, so trail is one before target.
    while lead.next:
        lead = lead.next
        trail = trail.next

    trail.next = trail.next.next   # unlink
    return dummy.next`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper opens the gap from <code>head</code> rather than from a dummy, then removes with <code>trail.next = trail.next.next</code>. On list = 1 → 2 and n = 2, what happens?",
        options: [
          'The target is the head itself, so trail has no valid predecessor and the removal is wrong or crashes',
          'It removes node 2 instead',
          'It works correctly',
          'It returns an empty list, which is correct'
        ],
        correct: 0,
        explain: 'When n equals the list length the node to remove is the head, and without a dummy there is no predecessor to rewire. The dummy makes "remove the head" structurally identical to "remove any other node" — which is the entire reason it exists.',
        hint: 'What is the predecessor of the first node?'
      },
      {
        tag: 'TRANSFER',
        q: "Different rope, same gap: Nami wants the MIDDLE node of a list in one pass. What changes about the two pointers?",
        options: [
          'Instead of a fixed gap, one pointer moves twice as fast — when it reaches the end, the slow one is at the middle',
          'The gap becomes half the length',
          'Both pointers move at the same speed from opposite ends',
          'It requires two passes'
        ],
        correct: 0,
        explain: 'Two distinct two-pointer tools on lists: a fixed GAP answers "n from the end", and a fixed SPEED RATIO answers "a fraction of the way along". Knowing which of the two a problem needs is most of the work.',
        hint: 'A gap gives a constant offset. What gives a proportional position?'
      },
      {
        tag: 'TWEAK',
        q: "n is guaranteed valid, but what would happen if n exceeded the list length?",
        options: [
          'The initial gap-opening loop would walk past the end and dereference null — it needs a bounds check if the guarantee is removed',
          'It would remove the head',
          'It would return the list unchanged',
          'The gap loop is safe regardless'
        ],
        correct: 0,
        explain: 'The guarantee in the problem statement is doing real work: the first loop advances n times with no null check. Noticing which stated constraints your code is relying on is a habit worth having — it is what tells you where the guards go if the constraint is lifted.',
        hint: 'Count the null checks in the first loop.'
      }
    ]
  };

  E['remove-duplicates-sorted-list-ii'] = {
    id: 'remove-duplicates-sorted-list-ii',
    epNumber: 128,
    title: 'Every Trace of the Repeated Name',
    arc: 'Skypiea',
    patternId: 'linked-list-reversal',
    scene: 'sky',
    leetcode: { name: 'Remove Duplicates from Sorted List II', number: 82, difficulty: 'Medium', url: 'https://leetcode.com/problems/remove-duplicates-from-sorted-list-ii/' },
    problem: 'Given the head of a sorted linked list, delete every node that has a duplicate, leaving only the values that appear exactly once.',
    example: 'list = 1 → 2 → 3 → 3 → 4 → 4 → 5  →  1 → 2 → 5',

    h: 200,
    props: [
      { id: 'u1', emoji: '📛', label: '1', x: 12, y: 32 },
      { id: 'u2', emoji: '📛', label: '2', x: 28, y: 32 },
      { id: 'u3', emoji: '📛', label: '3', x: 44, y: 32 },
      { id: 'u3b', emoji: '📛', label: '3', x: 58, y: 32 },
      { id: 'u4', emoji: '📛', label: '4', x: 74, y: 32 },
      { id: 'u4b', emoji: '📛', label: '4', x: 88, y: 32 }
    ],
    ledger: [
      { id: 'P', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The roster has duplicate names, and the rule is harsh: if a name appears twice, EVERY copy of it is struck out. Not one kept — none.",
        p: { u3: 'lit', u3b: 'lit', u4: 'lit', u4b: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "That's different from the usual de-duplication, where you keep one of each.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is why the pointer you carry is different too. Here you must stand on the node BEFORE a run, because if the run turns out to be a duplicate you have to skip the whole thing.",
        p: { P: 'lit' }, l: { P: 'stand before the run' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So look ahead: if the next node and the one after it share a value, walk forward past every node with that value, then link across the entire run.",
        p: { u3: 'bad', u3b: 'bad' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And crucially, do NOT advance the predecessor in that case — the node now sitting after it has not been examined yet and might begin another run.",
        p: { u4: 'bad', u4b: 'bad' },
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Two runs back to back. If you advanced blindly after skipping the threes, the fours would slip through.",
        p: { u1: 'good', u2: 'good' }, l: { P: '1 → 2 → 5 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The head itself may be part of a run, so a dummy in front is required rather than merely convenient.",
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Sorted input is doing the heavy lifting, isn't it. Duplicates are guaranteed adjacent, so a run is a local thing.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Unsorted, you would need a counting pass first. The sortedness is what makes one walk enough.",
        sfx: 'gong'
      }
    ],

    insight: 'Deleting entire runs means carrying the node before the run, and advancing that pointer only when nothing was deleted — otherwise two adjacent runs let the second one through.',
    complexity: '<b>Time O(n)</b> — one pass. <b>Space O(1)</b>. Unsorted input would need an O(n) counting pass first.',
    pitfall: 'Advancing the predecessor after skipping a run, which misses a run that starts immediately afterwards. And keeping one copy of a duplicated value — that is the easier sibling problem (LeetCode 83), not this one.',
    solution: `def delete_duplicates(head):
    dummy = ListNode(0, head)       # the head itself may be part of a run
    prev = dummy

    while head:
        if head.next and head.val == head.next.val:
            # Walk past every node carrying this value.
            while head.next and head.val == head.next.val:
                head = head.next
            prev.next = head.next    # link across the whole run
            # prev is NOT advanced: the next node is still unexamined.
        else:
            prev = prev.next
        head = head.next

    return dummy.next`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper advances <code>prev</code> after skipping a run. On 1 → 1 → 2 → 2 → 3, what does he return?",
        options: [
          '1 → 2 → 3 or similar — the second run survives because prev moved onto an unexamined node',
          '3, correctly',
          'An empty list',
          '1 → 3'
        ],
        correct: 0,
        explain: 'After linking across the 1s, the node following prev is the first 2 — which has not been tested yet. Advancing prev past it means the 2s are never examined as a run. The rule is: advance only when you deleted nothing.',
        hint: 'After skipping the run of 1s, what is sitting immediately after prev, and has it been checked?'
      },
      {
        tag: 'TWEAK',
        q: "The rule softens to the usual one: keep exactly one copy of each value. How much simpler does it get?",
        options: [
          'Much simpler — no predecessor and no dummy are needed; just compare each node with its next and skip forward',
          'Identical difficulty',
          'Harder, because you must decide which copy to keep',
          'It requires a hash set'
        ],
        correct: 0,
        explain: 'That is LeetCode 83. Because a survivor of each run remains, you can always stand on that survivor and never need to look behind — which is precisely what removes the need for both the predecessor and the dummy. The difference between the two problems is entirely about whether the run leaves anything behind.',
        hint: 'If one copy always survives, do you ever need to link ACROSS a whole run?'
      },
      {
        tag: 'TRANSFER',
        q: "Different roster, same run detection: Nami must count how many values appear exactly once in a sorted array. What is the analogous check?",
        options: [
          'A value is unique when it differs from both its neighbours — the array equivalent of "the run has length one"',
          'Compare each element with the first',
          'Use a hash map of counts',
          'Sort the array again'
        ],
        correct: 0,
        explain: 'Sortedness turns "appears exactly once" into a purely local test against two neighbours, in arrays exactly as in lists. A count map works and costs O(n) space to learn something the ordering already tells you for free.',
        hint: 'In sorted order, where must the other copies of a value be if they exist?'
      }
    ]
  };

  E['rotate-list'] = {
    id: 'rotate-list',
    epNumber: 129,
    title: 'The Ring Road of Angel Island',
    arc: 'Skypiea',
    patternId: 'linked-list-reversal',
    scene: 'sky',
    leetcode: { name: 'Rotate List', number: 61, difficulty: 'Medium', url: 'https://leetcode.com/problems/rotate-list/' },
    problem: 'Given the head of a linked list, rotate it to the right by k places.',
    example: 'list = 1 → 2 → 3 → 4 → 5, k = 2  →  4 → 5 → 1 → 2 → 3',

    h: 200,
    props: [
      { id: 'g1', emoji: '🛤️', label: '1', x: 14, y: 32 },
      { id: 'g2', emoji: '🛤️', label: '2', x: 34, y: 32 },
      { id: 'g3', emoji: '🛤️', label: '3', x: 54, y: 32 },
      { id: 'g4', emoji: '🛤️', label: '4', x: 74, y: 32 },
      { id: 'g5', emoji: '🛤️', label: '5', x: 92, y: 32 }
    ],
    ledger: [
      { id: 'L', x: 30, y: 78 },
      { id: 'B', x: 72, y: 78 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "The ring road has to be shifted round by k — the last k stops come to the front, everything else slides back.",
        p: { g4: 'lit', g5: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Move the last node to the front, k times? That's k walks of the whole road.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Do it in one move instead. Walk once to measure the length and reach the tail, then close the road into an actual ring by linking the tail back to the head.",
        p: { L: 'lit' }, l: { L: 'length, then close the ring' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And then just cut it open again in the right place.",
        p: { B: 'lit' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The new head is k from the end, so it is length minus k from the front — and the cut goes immediately before it. One walk to find that point, one break, done.",
        p: { g4: 'good', g5: 'good' }, l: { B: 'break at length - k' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And k can be enormous. Rotating a five-stop road by five hundred is the same as rotating it by zero.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So reduce k modulo the length first. If it comes out zero, the road is unchanged and you can return immediately — and if you have already closed the ring, you must be careful to reopen it.",
        p: { g1: 'good', g2: 'good', g3: 'good' }, l: { B: '4 5 1 2 3 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Empty list, or a single stop — both are unchanged by any rotation.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Closing a list into a ring and cutting it elsewhere is a genuinely reusable move. Any 'shift everything round' problem is a ring waiting to be cut.",
        sfx: 'gong'
      }
    ],

    insight: 'Close the list into a ring, then cut it at the right place — one traversal instead of k, and the modulo reduction is what stops a huge k from mattering.',
    complexity: '<b>Time O(L)</b> — one pass to measure, part of another to reach the cut. <b>Space O(1)</b>. Moving the tail k times is O(k · L).',
    pitfall: 'Forgetting <code>k %= length</code>, which makes a large k walk the list needlessly or overshoot. And leaving the ring closed when k reduces to 0, producing an infinite list.',
    solution: `def rotate_right(head, k):
    if not head or not head.next:
        return head

    # Measure and reach the tail.
    length, tail = 1, head
    while tail.next:
        tail = tail.next
        length += 1

    k %= length
    if k == 0:
        return head            # unchanged — do NOT leave a ring behind

    tail.next = head           # close the ring
    steps = length - k         # nodes before the new head
    new_tail = head
    for _ in range(steps - 1):
        new_tail = new_tail.next
    new_head = new_tail.next
    new_tail.next = None       # cut it open again
    return new_head`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp closes the ring first and only afterwards computes <code>k %= length</code>, returning early when k is 0 without reopening. What is the result?",
        options: [
          'A circular list — anything that walks it, including the judge, loops forever',
          'The correct answer',
          'A list missing its last node',
          'An empty list'
        ],
        correct: 0,
        explain: 'Order of operations matters when one of the steps mutates the structure. Either reduce k before closing the ring, or make sure every exit path reopens it. A returned cycle usually shows up as a hang rather than a wrong answer, which makes it harder to diagnose.',
        hint: 'What does the tail point to on that early-return path?'
      },
      {
        tag: 'TWEAK',
        q: "Rotate LEFT by k instead of right. What changes?",
        options: [
          'The new head is k from the front rather than k from the end — cut after node k instead of after node (length − k)',
          'Reverse the list first',
          'Use k %= length twice',
          'Nothing; left and right rotation are the same'
        ],
        correct: 0,
        explain: 'Both directions are one cut in a closed ring; only the cut position differs. Rotating left by k is also the same as rotating right by (length − k), which is a useful sanity check when you cannot remember which offset to use.',
        hint: 'Where does the new head sit in each case, counting from the front?'
      },
      {
        tag: 'TRANSFER',
        q: "Different road, same trick: Nami rotates an ARRAY right by k in place with O(1) space. What is the equivalent move?",
        options: [
          'Reverse the whole array, then reverse the first k and the rest separately',
          'Close it into a ring and cut',
          'Shift every element k times',
          'Sort and re-index'
        ],
        correct: 0,
        explain: 'Arrays cannot be closed into rings, so the triple-reversal takes the place of the cut — same result, different mechanism, both O(n) with O(1) space. Note that both start with <code>k %= n</code>, which is the one step they genuinely share.',
        hint: 'What does reversing the entire array do to the last k elements?'
      }
    ]
  };

  E['partition-list'] = {
    id: 'partition-list',
    epNumber: 130,
    title: 'Sorting the Clouds by Weight',
    arc: 'Skypiea',
    patternId: 'linked-list-reversal',
    scene: 'sky',
    leetcode: { name: 'Partition List', number: 86, difficulty: 'Medium', url: 'https://leetcode.com/problems/partition-list/' },
    problem: 'Given a linked list and a value x, reorder it so that all nodes less than x come before all nodes greater than or equal to x, preserving the original relative order within each group.',
    example: 'list = 1 → 4 → 3 → 2 → 5 → 2, x = 3  →  1 → 2 → 2 → 4 → 3 → 5',

    h: 200,
    props: [
      { id: 'w1', emoji: '☁️', label: '1', x: 12, y: 30 },
      { id: 'w4', emoji: '☁️', label: '4', x: 30, y: 30 },
      { id: 'w3', emoji: '☁️', label: '3', x: 48, y: 30 },
      { id: 'w2', emoji: '☁️', label: '2', x: 66, y: 30 },
      { id: 'w5', emoji: '☁️', label: '5', x: 84, y: 30 }
    ],
    ledger: [
      { id: 'LO', x: 30, y: 74 },
      { id: 'HI', x: 70, y: 74 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "Light clouds to the front, heavy clouds to the back — but within each group, the order they were in must be kept exactly.",
        p: { w1: 'lit', w4: 'lit', w3: 'lit', w2: 'lit', w5: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Swap nodes around in place until they're sorted?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Far easier: build two separate chains. Walk once, and append each cloud to the light chain or the heavy chain. Then join the two.",
        p: { LO: 'lit', HI: 'lit' }, l: { LO: 'light chain', HI: 'heavy chain' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "One and two go left. Four, three and five go right. Then link the light tail to the heavy head.",
        p: { w1: 'good', w2: 'good', w4: 'good', w3: 'good', w5: 'good' }, l: { LO: '1 → 2', HI: '4 → 3 → 5' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Appending in the order encountered preserves the relative order within each group for free — that is what makes this stable without any extra effort.",
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Two dummy heads, one per chain, so neither needs a first-node special case.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And one line that must not be forgotten: terminate the heavy chain. Its last node still points wherever it did in the original list, which can easily be back into the light chain.",
        p: { HI: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "A cycle, in other words. The output looks right until something tries to walk to the end of it.",
        p: { HI: 'good' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Splitting into buckets and concatenating is a pattern well beyond lists — it is how radix sort works, and how stable partitions are done generally.",
        sfx: 'gong'
      }
    ],

    insight: 'Two chains built in encounter order and joined at the end give a stable partition with no swapping — and the second chain must be explicitly terminated, or its tail still points into the first.',
    complexity: '<b>Time O(n)</b> — one pass. <b>Space O(1)</b>; nodes are re-linked, not copied.',
    pitfall: 'Forgetting <code>high_tail.next = None</code>, which leaves the original forward pointer intact and usually creates a cycle. Also, swapping node values instead of re-linking is fragile and loses the point of the exercise.',
    solution: `def partition(head, x):
    low = low_tail = ListNode(0)    # two dummies: no first-node special case
    high = high_tail = ListNode(0)

    while head:
        if head.val < x:
            low_tail.next = head
            low_tail = low_tail.next
        else:
            high_tail.next = head
            high_tail = high_tail.next
        head = head.next

    high_tail.next = None           # terminate, or the tail still points back
    low_tail.next = high.next       # join the two chains
    return low.next`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp omits <code>high_tail.next = None</code>. On 1 → 4 → 3 → 2 → 5 with x = 3, what is the result?",
        options: [
          'A cycle — the last heavy node still points at a node that is now in the light chain',
          'The correct list',
          'A list missing the last node',
          'A list with the groups reversed'
        ],
        correct: 0,
        explain: 'Every node keeps its original next pointer until it is overwritten, and the final node of each chain never gets overwritten. The light chain\'s tail is fixed by the join; the heavy chain\'s must be terminated explicitly. The output looks correct for the first few nodes, which is what makes it a nasty bug.',
        hint: 'What does the last heavy node point to, and was that pointer ever reassigned?'
      },
      {
        tag: 'TWEAK',
        q: "The requirement drops the stability guarantee — relative order within each group no longer matters. Does anything get easier?",
        options: [
          'Not meaningfully — the two-chain method is already O(n) and O(1), and it happens to be stable for free',
          'Yes, you can now swap values in place',
          'Yes, you can sort the list instead',
          'Yes, one chain suffices'
        ],
        correct: 0,
        explain: 'A good check on whether an added constraint is actually costing anything. Here stability falls out of appending in encounter order, so relaxing it buys nothing — unlike, say, the difference between a stable and an unstable sort.',
        hint: 'Which line of the algorithm is there specifically to preserve order?'
      },
      {
        tag: 'TRANSFER',
        q: "Different cargo, same buckets: Franky must reorder a list into three groups — below x, equal to x, and above x. What changes?",
        options: [
          'A third chain, joined in order — the same method extended, which is exactly the Dutch national flag partition',
          'It requires sorting',
          'Two passes are needed',
          'It cannot be done stably'
        ],
        correct: 0,
        explain: 'The bucket-and-concatenate idea scales to any fixed number of groups, still in one pass and still stable. On arrays the same three-way split is the Dutch national flag problem, which does it in place with three pointers — same concept, different mechanics.',
        hint: 'The method used one chain per group. How many groups are there now?'
      }
    ]
  };

  E['lru-cache'] = {
    id: 'lru-cache',
    epNumber: 131,
    title: 'The Dial That Forgets the Oldest Sound',
    arc: 'Skypiea',
    patternId: 'linked-list-reversal',
    scene: 'sky',
    leetcode: { name: 'LRU Cache', number: 146, difficulty: 'Medium', url: 'https://leetcode.com/problems/lru-cache/' },
    problem: 'Design a cache with a fixed capacity supporting get and put in O(1) average time. When it is full, evict the least recently used entry.',
    example: 'capacity 2: put(1,1), put(2,2), get(1), put(3,3) evicts key 2 — it was the least recently used.',

    h: 200,
    props: [
      { id: 'mp', emoji: '🗺️', label: 'map: key → node', x: 28, y: 30 },
      { id: 'dl', emoji: '🔗', label: 'list: recency order', x: 72, y: 30 },
      { id: 'hd', emoji: '🆕', label: 'most recent', x: 28, y: 62 },
      { id: 'tl', emoji: '🗑️', label: 'evict from here', x: 72, y: 62 }
    ],
    ledger: [
      { id: 'O', x: 50, y: 88 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "The Tone Dial holds only so many sounds. Recording a new one when it is full overwrites whichever sound has gone longest without being played.",
        p: { mp: 'lit', dl: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So we need to find a sound instantly by name, AND know which one is stalest. Those feel like two different structures.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "They are, and the answer is to keep both. A hash map gives instant lookup by key. A doubly linked list keeps the entries in order of use, most recent at the front.",
        p: { hd: 'lit', tl: 'lit' }, l: { O: 'map + doubly linked list' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And the map doesn't store the value — it stores the NODE, so we can reach straight into the middle of the list.",
        p: { mp: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That is what makes everything constant time. On a get, unlink the node from wherever it sits and move it to the front. Unlinking needs its neighbours — which is exactly why the list must be DOUBLY linked.",
        p: { dl: 'good' },
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "With a singly linked list you'd have to walk from the head to find the predecessor. Linear, every single time.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "On a put over capacity, take the node at the back, remove it from the list, and — the step people forget — delete its key from the map too. Otherwise the map keeps growing forever.",
        p: { tl: 'good' }, l: { O: 'evict from list AND map ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Sentinel nodes at both ends again, so no insertion or removal ever needs to ask whether it is at an edge.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Two structures, each covering the other's weakness. That pairing — a map for lookup and something else for order — is one of the most reusable designs there is.",
        sfx: 'gong'
      }
    ],

    insight: 'Pair a hash map with a doubly linked list: the map gives O(1) lookup by key, the list gives O(1) reordering by recency, and the map stores nodes rather than values so the middle of the list is reachable directly.',
    complexity: '<b>Time O(1)</b> average for both get and put. <b>Space O(capacity)</b>. A list alone makes lookup O(n); a map alone cannot answer "which is stalest".',
    pitfall: 'Using a singly linked list, which makes unlinking O(n) because the predecessor must be found. And evicting from the list without deleting the key from the map, which leaks entries and breaks later lookups.',
    solution: `class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.map = {}                       # key -> Node
        self.head, self.tail = Node(), Node()   # sentinels: no edge cases
        self.head.next, self.tail.prev = self.tail, self.head

    def _unlink(self, node):
        node.prev.next, node.next.prev = node.next, node.prev

    def _push_front(self, node):
        node.next, node.prev = self.head.next, self.head
        self.head.next.prev = self.head.next = node

    def get(self, key):
        if key not in self.map:
            return -1
        node = self.map[key]
        self._unlink(node)                  # O(1): needs BOTH neighbours
        self._push_front(node)
        return node.val

    def put(self, key, value):
        if key in self.map:
            self._unlink(self.map[key])
        elif len(self.map) == self.cap:
            stale = self.tail.prev
            self._unlink(stale)
            del self.map[stale.key]         # evict from the map too
        node = Node(key, value)
        self.map[key] = node
        self._push_front(node)`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper evicts the stale node from the list but forgets <code>del self.map[stale.key]</code>. What breaks?",
        options: [
          'The map grows without bound, and a later get on the evicted key returns a node that is no longer in the list',
          'Only the memory usage suffers',
          'Eviction picks the wrong node',
          'Nothing; the map entry is harmless'
        ],
        correct: 0,
        explain: 'The two structures must agree about what the cache contains. A stranded map entry means a hit on a key that was evicted, returning a detached node whose neighbours are wrong — a correctness bug on top of the leak. Keeping paired structures in sync is the whole discipline of this design.',
        hint: 'What does get() return for a key that was evicted from the list but not the map?'
      },
      {
        tag: 'PITFALL',
        q: "Why must the list be doubly linked rather than singly?",
        options: [
          'Unlinking a node from the middle needs its predecessor, and only a doubly linked list has it in O(1)',
          'Because the cache must be traversed backwards',
          'Because the map stores two pointers',
          'It need not be; singly linked works fine'
        ],
        correct: 0,
        explain: 'The map jumps you straight to a node in the middle, and removing it requires rewiring the node before it. Singly linked would mean walking from the head to find that predecessor — O(n), which destroys the entire point of the design.',
        hint: 'The map hands you a node directly. What do you need in order to remove it?'
      },
      {
        tag: 'TWEAK',
        q: "The policy changes to evict the LEAST FREQUENTLY used entry instead. What has to change?",
        options: [
          'Recency order is no longer sufficient — you need per-key counts and a way to find the minimum count in O(1), typically buckets of lists by frequency',
          'Only the eviction end of the list changes',
          'Nothing; frequency and recency are equivalent',
          'A single counter per entry is enough'
        ],
        correct: 0,
        explain: 'That is LFU Cache, and it is genuinely harder: you need a count per key, lists grouped by count, and a pointer to the minimum count — with ties broken by recency. Recognising that a small change in policy demands a different structure is the point of the comparison.',
        hint: 'Can a single ordering by last-use tell you which key was used fewest times?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
