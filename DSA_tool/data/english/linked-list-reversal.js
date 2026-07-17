window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['linked-list-reversal'] = {
  id: 'linked-list-reversal',
  title: 'Linked List In-Place Reversal',
  titleNe: 'Flipping a chain with three fingers',
  intro: 'flip the arrows one node at a time with prev / curr / next — O(1) space',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Reverse a linked list — whole, a sub-range, or in groups of k.',
        'The constraint that matters: <b>in place</b>, O(1) extra space.',
        'Also hiding inside: palindrome check, reorder list, swap pairs.',
      ],
      narration: "Now the art of reversing a linked list. The question can come straight out — reverse this list — or hidden — check whether the list is a palindrome, which means reversing the second half to compare. The constraint is always the same: you can't build a new list, you must reverse the existing chain in place, in O(1) space. Picture it this way — railway carriages linked by couplings, each coupling pointing to the carriage ahead. Reversing doesn't mean moving carriages — it means flipping each coupling so every carriage now points backward instead of forward. But be careful — get the order of unhooking wrong and the rest of the train rolls away from your hand.",
    },
    {
      heading: 'Story: The three fingers',
      bullets: [
        'Three fingers on the chain: <code>prev</code> (behind), <code>curr</code> (here), <code>nxt</code> (ahead).',
        'Save <code>nxt</code> <b>first</b> — or the rest of the chain is lost forever.',
        'Flip <code>curr.next</code> to <code>prev</code>, then both fingers step forward.',
      ],
      narration: "The method — three fingers. One finger on the carriage behind — prev. One on the current one — curr. And a third finger, the lifesaver, on the one ahead — next. Why? Because the moment you flip curr's coupling, that very coupling was the only rope reaching the rest of the train ahead. So first grab the carriage ahead with the third finger, and only then flip the coupling. After that, all three fingers step forward one carriage — prev to curr, curr to next. This four-beat dance repeats until the list ends. When it's done, prev is the new engine — return that.",
    },
    {
      heading: 'Mnemonic',
      big: '“Grab next, flip the arrow, step both forward.”',
      bullets: [
        '1. <code>nxt = curr.next</code> (grab)',
        '2. <code>curr.next = prev</code> (flip)',
        '3. <code>prev, curr = curr, nxt</code> (step)',
        'Loop while <code>curr</code>; answer is <code>prev</code>.',
      ],
      narration: "The hook: grab next, flip the arrow, step both forward. Three actions, in this exact order. Grab first — or the train rolls away. Flip second. Step third. If you freeze at the whiteboard, dance it with your hands — left hand prev, right hand curr, eyes on next. And the question that always comes — what do you return? curr becomes None and the loop ends — the answer is prev, standing on the last carriage. This pattern is pure muscle memory — open a Python file today and write it three times without looking; after that it stays with you for life.",
    },
    {
      heading: 'Python template',
      code: 'def reverse_list(head):\n    prev, curr = None, head\n    while curr:\n        nxt = curr.next          # grab next\n        curr.next = prev         # flip the arrow\n        prev, curr = curr, nxt   # step both forward\n    return prev                  # new head\n\n# Recursive flavour (know it, but iterative is safer in interviews):\ndef reverse_rec(head):\n    if not head or not head.next:\n        return head\n    new_head = reverse_rec(head.next)\n    head.next.next = head\n    head.next = None\n    return new_head',
      narration: "The iterative form — five lines, O(n) time, O(1) space — is your main interview weapon. Know the recursive form too — it looks elegant, but each call takes stack space, so its space is O(n); if O(1) space is a hard requirement, recursion breaks the rule. Being able to say that yourself puts you a level up in the interviewer's eyes. And Python's paired assignment — prev comma curr equals curr comma nxt — is the clean way to move both in one line, with no temporary variable in between.",
    },
    {
      heading: 'Watch out! The harder variants',
      bullets: [
        '<b>Reverse between positions m and n</b>: walk to m−1, reverse the window, stitch both ends back.',
        '<b>Reverse in k-groups</b>: count k nodes first; fewer than k left → leave them (usually).',
        '<b>Dummy node</b> trick: a fake head makes “reversal starts at position 1” a non-special case.',
        'Palindrome list: fast/slow to middle + reverse second half — two patterns shake hands.',
      ],
      narration: "The harder variants. When you only reverse from position m to n, the reversing itself is the same — the hard part is the stitching, joining the two ends back: who grabs whom in front of and behind the reversed piece — don't write it without drawing the picture on paper. K-group reversal first counts whether k nodes remain — if fewer, you usually leave them as they are. And the little dummy-node trick — hang a fake head at the front, which turns edge cases like reversing from position one into an ordinary case. Build the habit of reaching for a dummy in any list problem where the head can change. And the most beautiful pairing — to check a palindrome, the hare and tortoise find the middle, then you reverse the second half and compare — the place where two patterns shake hands.",
    },
  ],
};
