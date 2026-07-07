window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['linked-list-reversal'] = {
  id: 'linked-list-reversal',
  title: 'Linked List In-Place Reversal',
  category: 'Hashing & Linear Structures',
  timeMin: 10,
  summary: 'Flip a singly linked list\'s next pointers in a single O(n) pass using three rolling references, with no extra data structure.',
  concept: [
    'In-place reversal walks the list once, flipping each node\'s <code>next</code> pointer to point backward, using three rolling references: <code>prev</code> (the already-reversed portion, starts as <code>None</code>), <code>curr</code> (the node currently being flipped), and a temporary <code>next_node</code> that you must save <i>before</i> you overwrite <code>curr.next</code> — otherwise you lose the rest of the original list permanently. This is O(n) time and O(1) extra space: no new nodes are allocated and nothing is copied into an array.',
    'The skeleton is always the same four moves per iteration: save next, rewire <code>curr.next = prev</code>, advance <code>prev = curr</code>, advance <code>curr = next_node</code>. Every "reverse a linked list" variant — the whole list, a sublist, groups of k, pairs — is this identical primitive wrapped with different boundary bookkeeping: where the loop starts/stops, and how the reversed segment gets reconnected to whatever surrounds it afterward.',
    'A recursive formulation exists (recurse to the tail first, then fix pointers as the call stack unwinds) but costs O(n) stack space instead of O(1) — worth mentioning to show you know it, but default to iterative unless the interviewer specifically wants the recursive form, since "can you do it without recursion / in O(1) space?" is a common immediate follow-up.',
    'The correctness argument for in-place reversal is an induction on the loop: the invariant is that at the start of every iteration, the nodes reachable from <code>prev</code> form exactly the reverse of the original sublist processed so far, and the nodes reachable from <code>curr</code> form exactly the unprocessed suffix of the original list, with these two sets partitioning all nodes and no node ever duplicated or dropped. The base case (<code>prev = None</code>, <code>curr = head</code>, zero nodes processed) trivially satisfies this. Each iteration\'s four operations preserve it: saving <code>next_node</code> keeps the unprocessed suffix intact before it\'s touched, and the pointer flip moves exactly one node from the "unprocessed" partition to the head of the "reversed" partition. When <code>curr</code> becomes <code>None</code>, the unprocessed partition is empty by the invariant, so <code>prev</code> must reference the fully reversed list — that\'s what guarantees the technique works for a list of any length, not just the lengths you happened to test.',
  ],
  recognitionSignals: [
    'Explicit ask to "reverse a linked list," or a sub-portion of one, in place.',
    '"Reverse in groups of k" or "reverse pairs" — same reversal primitive applied repeatedly, with extra bookkeeping to reconnect group boundaries; not a fundamentally different algorithm.',
    '"Without using extra space" or "O(1) space" — rules out copying node values into an array/stack and rebuilding, which is the naive first idea most candidates reach for.',
    'If the problem also mentions finding a middle, detecting a cycle, or checking a palindrome, that signals <i>combining</i> fast/slow pointers with this reversal primitive, not reversal in isolation.',
  ],
  complexity: 'Time: O(n) — every node is visited exactly once. Space: O(1) iterative (three pointers regardless of list length); O(n) if implemented recursively, due to call-stack depth.',
  canonical: {
    name: 'Reverse Linked List (LeetCode 206)',
    statement: 'Given the head of a singly linked list, reverse the list in place and return the new head.',
  },
  story: {
    onePiece: {
      title: 'The bridge crossing, reversed',
      text: [
        'The crew is crossing an old rope bridge single file, each person gripping the hand of whoever is directly ahead of them — a human chain stretching from one cliff to the other. Command comes down to turn the whole line around and walk back the way they came, but the bridge is one plank wide: nobody can pass anybody, and there\'s no room to build a second chain alongside the first.',
        'So they reverse it in place, one person at a time. Starting from the front, each person lets go of the hand ahead of them and instead reaches back to grab the hand of whoever is now walking last in the new direction — but only after making sure they\'ve already noted who\'s still further down the original line, or they\'d lose the rest of the chain the moment they let go. One "current" person handles this handoff, then the job moves to the next person down the line, and the next, until everyone\'s grip has been flipped and the line now faces the opposite cliff.',
        'The rule that keeps this from turning into chaos: never let go of the next hand in line until you\'ve already made note of who it belongs to. That\'s the entire discipline — and it maps exactly onto why <code>next_node = curr.next</code> has to happen before <code>curr.next = prev</code> in the code. Forget that order, even once, and the rest of the human chain — or the rest of the linked list — becomes unreachable.',
      ],
    },
    history: {
      title: 'Bucket-brigade fire lines, reversing direction',
      text: [
        'Before motorized pumps, 18th- and 19th-century fire brigades fought fires with bucket brigades: a line of people stretching from a water source to the fire, each person passing a full bucket to the next and an empty one back. The line itself was the infrastructure — there was no faster way to move water that far with what people had on hand.',
        'If a better water source turned up behind the line instead of ahead of it, the brigade didn\'t dismantle itself and re-form facing the other way — a fire doesn\'t give you time to waste like that. Instead, each person turned in place to face their other neighbor, and the same chain of hands now passed buckets in the opposite direction. Nothing new was built; the existing links were re-pointed, one at a time, exactly like reversing a linked list without allocating a second list.',
      ],
    },
    why: 'A pointer-rewiring proof is abstract on its own; anchoring it to a chain of people who have to remember who\'s still behind them before letting go gives your memory a second, physical route back to the same four-line loop.',
  },
  tricks: [
    {
      name: 'Save next_node before overwriting curr.next',
      idea: 'It\'s tempting to flip the pointer first and grab the "next" reference after, but curr.next is the only link to the rest of the original list — overwrite it first and that link is gone for good, not just temporarily out of order.',
      before:
`def reverse_list(head):
    prev, curr = None, head
    while curr:
        curr.next = prev       # BUG: overwrites curr.next before saving it
        next_node = curr.next  # this is now \`prev\`, not the original next node
        prev = curr
        curr = next_node       # the rest of the original list is unreachable
    return prev`,
      after:
`def reverse_list(head):
    prev, curr = None, head
    while curr:
        next_node = curr.next  # save the original next node FIRST
        curr.next = prev
        prev = curr
        curr = next_node
    return prev`,
      explain: 'curr.next is the only reference to the unprocessed remainder of the list. Reading it into next_node before reassigning curr.next preserves the ability to keep walking; reverse the order and every node after curr becomes unreachable the instant it happens — a silent data-loss bug, not a crash.',
    },
    {
      name: 'Reverse Linked List II: use a dummy head so left == 1 has a real predecessor',
      idea: 'Reversing only nodes from position left to right (LC 92) needs a predecessor node to reconnect the new sublist head to — but when left == 1, there is no real node before it, so skipping the dummy-head trick makes the reconnection step crash or corrupt the list.',
      before:
`def reverse_between(head, left, right):
    prev, curr = None, head
    for _ in range(left - 1):
        prev = curr
        curr = curr.next
    # BUG: no dummy head — when left == 1, prev stays None,
    # so there is no predecessor to reconnect to after reversal
    sub_prev, sub_curr = None, curr
    for _ in range(right - left + 1):
        nxt = sub_curr.next
        sub_curr.next = sub_prev
        sub_prev = sub_curr
        sub_curr = nxt
    prev.next = sub_prev   # AttributeError: 'NoneType' has no attribute 'next'
    curr.next = sub_curr
    return head`,
      after:
`def reverse_between(head, left, right):
    dummy = ListNode(0, head)
    prev = dummy
    for _ in range(left - 1):
        prev = prev.next
    curr = prev.next
    sub_prev, sub_curr = None, curr
    for _ in range(right - left + 1):
        nxt = sub_curr.next
        sub_curr.next = sub_prev
        sub_prev = sub_curr
        sub_curr = nxt
    # reconnect both boundaries: predecessor -> new sublist head,
    # old sublist head (now the tail) -> node after the reversed segment
    prev.next = sub_prev
    curr.next = sub_curr
    return dummy.next`,
      explain: 'The dummy node guarantees a real predecessor exists even when the reversal starts at the very first node, so prev.next = sub_prev always has somewhere to write. Without it, left == 1 has no true "node before the sublist" to hold the new connection, which either crashes (as above) or forces awkward special-casing of the head pointer instead of one uniform reconnection.',
    },
  ],
  variants: [
    {
      company: 'Meta-style',
      title: 'Reverse Linked List II — reverse only a sublist (LeetCode 92)',
      twist: 'Only reverse nodes from position <code>left</code> to <code>right</code> (1-indexed), leaving the rest of the list untouched. You need a reference to the node just before <code>left</code> (use a dummy head node so this works even when <code>left == 1</code>), run the same prev/curr/next loop starting at position <code>left</code> for exactly <code>right - left + 1</code> iterations, and afterward reconnect two boundaries: <code>predecessor.next</code> must point to the new sublist head (the old <code>right</code>-th node), and the original <code>left</code>-th node — now the sublist\'s tail — must have its <code>.next</code> pointed at whatever came after the old <code>right</code>-th node. Getting either reconnection wrong silently truncates or duplicates part of the list.',
    },
    {
      company: 'Google-style',
      title: 'Reverse Nodes in k-Group (LeetCode 25)',
      twist: 'Reverse the list in consecutive chunks of exactly k nodes; if fewer than k nodes remain at the end, leave that final partial group unreversed. This forces a counting pre-pass (or lookahead) to verify k nodes actually exist before committing to reverse the group — reverse first and find out you were short, and you have to reason carefully about un-reversing or restructuring. Groups are then chained together by reconnecting each group\'s new tail to the next group\'s new head, same boundary-reconnection idea as LC 92 but repeated across the whole list.',
    },
    {
      company: 'Amazon-style',
      title: 'Palindrome Linked List (LeetCode 234)',
      twist: 'Determine whether the list reads the same forwards and backwards, in O(1) space — you can\'t just dump values into an array and check with two pointers, since that\'s O(n) space. The O(1)-space solution combines two patterns: use fast/slow pointers to find the middle, reverse the second half in place using the standard reversal primitive, then walk two pointers inward from both ends comparing values. This variant tests whether you can compose linked-list reversal with a different pattern (fast/slow) rather than apply it in isolation, and whether you remember to (optionally) restore the list afterward if the interviewer asks you not to mutate the input.',
    },
  ],
  pythonSolution: {
    title: 'Reverse Linked List',
    code:
`class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def reverse_list(head: ListNode | None) -> ListNode | None:
    prev, curr = None, head
    while curr:
        next_node = curr.next
        curr.next = prev
        prev = curr
        curr = next_node
    return prev`,
    notes: [
      '<code>prev, curr = None, head</code> initializes both rolling references in one line — a small but idiomatic Python tuple-assignment habit worth using for pointer pairs.',
      'The order inside the loop is load-bearing, not stylistic: <code>next_node</code> must be captured before <code>curr.next</code> is reassigned, or the rest of the original list becomes unreachable.',
      'Returning <code>prev</code>, not <code>head</code>, is the whole point — by the time the loop ends, <code>head</code> refers to the old first node, which is now the <i>last</i> node of the reversed list.',
      'The type hint <code>ListNode | None</code> documents that both the input and output can be an empty list, which is exactly the edge case worth stating out loud in an interview.',
    ],
  },
  pitfalls: [
    'Writing <code>curr.next = prev</code> before saving <code>next_node = curr.next</code> — this is the single most common bug, and it silently severs the rest of the list rather than crashing, so it can slip past a quick manual test.',
    'Returning <code>head</code> instead of <code>prev</code> at the end — <code>head</code> is now the reversed list\'s tail (its <code>.next</code> is <code>None</code>), so the caller sees what looks like a 1-node list.',
    'For the sublist variant (LC 92): forgetting the dummy-head trick when <code>left == 1</code>, so there is no real predecessor node to hold a reference to, or forgetting to reconnect the old <code>left</code>-th node (now the sublist tail) to whatever came after the old <code>right</code>-th node.',
    'Not handling the empty-list (<code>head is None</code>) or single-node case — both should just fall through the <code>while curr</code> loop correctly, but it\'s worth stating explicitly rather than assuming it works.',
  ],
  viz: {
    type: 'array',
    initialArray: [1, 2, 3, 4, 5],
    steps: [
      { highlights: { 0: 'a' }, pointers: { curr: 0 }, vars: { prev: 'None', reversedSoFar: '[]' }, message: 'Start: prev=None, curr=head (node 1). Original list: 1→2→3→4→5→None.' },
      { highlights: { 0: 'c', 1: 'a' }, pointers: { prev: 0, curr: 1 }, vars: { prev: '1', reversedSoFar: '[1]', savedNext: '2' }, message: 'Saved next=node(2) first, then set node(1).next=None (prev). prev→node(1), curr→node(2). Reversed-so-far: 1→None.' },
      { highlights: { 0: 'c', 1: 'c', 2: 'a' }, pointers: { prev: 1, curr: 2 }, vars: { prev: '2', reversedSoFar: '[2, 1]', savedNext: '3' }, message: 'Saved next=node(3), set node(2).next=node(1). prev→node(2), curr→node(3). Reversed-so-far: 2→1→None.' },
      { highlights: { 0: 'c', 1: 'c', 2: 'c', 3: 'a' }, pointers: { prev: 2, curr: 3 }, vars: { prev: '3', reversedSoFar: '[3, 2, 1]', savedNext: '4' }, message: 'Saved next=node(4), set node(3).next=node(2). prev→node(3), curr→node(4). Reversed-so-far: 3→2→1→None.' },
      { highlights: { 0: 'c', 1: 'c', 2: 'c', 3: 'c', 4: 'a' }, pointers: { prev: 3, curr: 4 }, vars: { prev: '4', reversedSoFar: '[4, 3, 2, 1]', savedNext: '5' }, message: 'Saved next=node(5), set node(4).next=node(3). prev→node(4), curr→node(5). Reversed-so-far: 4→3→2→1→None.' },
      { highlights: { 0: 'c', 1: 'c', 2: 'c', 3: 'c', 4: 'c' }, pointers: { prev: 4 }, vars: { prev: '5', curr: 'None', reversedSoFar: '[5, 4, 3, 2, 1]' }, message: 'Saved next=None, set node(5).next=node(4). prev→node(5), curr→None. Loop condition `while curr` is now false — done.' },
      { highlights: { 4: 'c', 3: 'c', 2: 'c', 1: 'c', 0: 'c' }, pointers: { newHead: 4 }, vars: { answer: '[5, 4, 3, 2, 1]' }, message: 'Return prev (node 5) as the new head. Full reversed list: 5→4→3→2→1→None.' },
    ],
  },
  quiz: [
    {
      q: 'Which phrasing most clearly signals in-place linked-list reversal rather than fast/slow pointers?',
      options: [
        '"Determine whether the list has a cycle"',
        '"Reverse the list (or a portion of it) in O(1) extra space"',
        '"Find the middle node of the list in one pass"',
        '"Find the k-th node from the end"',
      ],
      correct: 1,
      explain: 'Cycle detection, finding the middle, and "k-th from the end" are all classic fast/slow (two-speed) pointer problems. An explicit ask to reverse the list, especially with an O(1)-space constraint, is the reversal primitive\'s signature.',
    },
    {
      q: 'What is the time and space complexity of the iterative reversal algorithm?',
      options: [
        'O(n) time, O(n) space',
        'O(n) time, O(1) space',
        'O(n log n) time, O(1) space',
        'O(1) time, O(1) space',
      ],
      correct: 1,
      explain: 'Each node is visited exactly once (O(n) time), and only three pointer variables are used regardless of list length (O(1) space). The recursive version instead costs O(n) space for the call stack.',
    },
    {
      q: 'In the reference code, why must `next_node = curr.next` execute before `curr.next = prev`?',
      options: [
        'It doesn\'t matter — Python evaluates both regardless of order',
        'Once curr.next is overwritten to point at prev, the original link to the rest of the list is gone unless you saved it first',
        'It\'s required to avoid a TypeError',
        'It only matters for the recursive version, not the iterative one',
      ],
      correct: 1,
      explain: 'curr.next is the only reference to the rest of the unprocessed list. Overwrite it before saving a copy of that reference, and everything after curr becomes unreachable — a silent data-loss bug, not a crash.',
    },
    {
      q: 'Reverse Linked List II (LC 92) reverses only nodes from position left to right. What extra bookkeeping does this variant require beyond the base reversal loop?',
      options: [
        'None — the identical loop over the whole list works unchanged',
        'A reference to the node before `left` (via a dummy head), plus reconnecting that predecessor and the old left-th node (now the sublist tail) to the boundaries of the reversed segment afterward',
        'You must convert the list to an array first',
        'You must reverse the whole list twice',
      ],
      correct: 1,
      explain: 'The base loop only knows how to flip pointers within the segment being traversed. Splicing that reversed segment back into a larger list requires holding onto the predecessor node and correctly re-linking both ends of the reversed sublist, which is the actual difficulty of LC 92.',
    },
    {
      q: 'What happens if you call the standard iterative reverse_list on an empty list (head is None)?',
      options: [
        'It raises an AttributeError',
        'It infinite-loops',
        'The while loop body never executes (curr is already None), and the function correctly returns prev, which is still None',
        'It returns head unchanged, which is a bug',
      ],
      correct: 2,
      explain: 'prev and curr are initialized to None and head respectively. If head is None, `while curr` is immediately false, the loop body never runs, and prev (None) is returned — correctly representing an empty reversed list with no special-casing needed.',
    },
  ],
};
