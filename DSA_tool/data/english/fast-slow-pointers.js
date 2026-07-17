window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['fast-slow-pointers'] = {
  id: 'fast-slow-pointers',
  title: 'Fast & Slow Pointers',
  titleNe: 'The tortoise and the hare, on a linked list',
  intro: 'detect cycles and find middles in linked structures with two speeds, O(1) space',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Linked list (or any “follow the next thing” chain) with <b>no random access</b>.',
        'Questions: is there a <b>cycle</b>? where is the <b>middle</b>? where does the cycle <b>start</b>?',
        'The killer constraint: O(1) extra space — no visited set allowed.',
      ],
      narration: "Now my favourite pattern for its story — Fast and Slow Pointers. You've heard of the tortoise and the hare. But here's the twist: what if the race isn't on a straight road but on a circular track? The hare races ahead, loops all the way around, and comes up behind the tortoise again — and one day, bumps right into it! On a straight road the hare reaches the end and they never meet. From that single observation you can answer whether a linked list has a cycle — with no visited set, in O(1) space. Reach for this pattern on a linked list, or anywhere you can only move by following next.",
    },
    {
      heading: "Story: Floyd's cycle detection",
      bullets: [
        '<code>slow</code> moves 1 step, <code>fast</code> moves 2 steps.',
        'Straight chain → <code>fast</code> hits <code>None</code>: no cycle.',
        'Loop → the gap shrinks by exactly 1 each step → they <b>must</b> meet.',
      ],
      narration: "This is called Floyd's algorithm. Slow takes one step at a time, fast takes two. If the road is straight, fast reaches the edge — it hits None, no cycle, done. But if there's a loop, look closely: once both are inside the loop, the distance between them shrinks by exactly one every step. A gap that shrinks by one each time must reach zero — it can't leap over. So a meeting is guaranteed, and a meeting proves there's a cycle. This isn't just a trick, it's a mathematical proof — and if you narrate that shrinking-gap argument out loud in an interview, the interviewer's face lights up.",
    },
    {
      heading: 'Mnemonic',
      big: '“On a circular track, fast and slow are certain to meet.”',
      bullets: [
        'Meet ⇒ cycle exists.',
        'Middle of list: when <code>fast</code> reaches the end, <code>slow</code> is at the middle.',
        'Cycle start: after meeting, restart one pointer at head; both walk 1 step — they meet at the cycle’s entrance.',
      ],
      narration: "The hook: on a circular track, fast and slow are certain to meet. This same pair solves two more problems for free. One — finding the middle of a list: when fast reaches the end, slow sits exactly at the middle, because it walked only half the distance. Two — the deeper question of where the cycle begins: after they meet, send one pointer back to the start, then move both one step at a time, and where they meet again is the mouth of the loop. It's a mathematical marvel — hard to derive but easy to remember: after they meet, send one home, both walk slowly, and they meet at the door.",
    },
    {
      heading: 'Python template',
      code: 'def has_cycle(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next          # tortoise: 1 step\n        fast = fast.next.next     # hare: 2 steps\n        if slow is fast:\n            return True           # met ⇒ cycle\n    return False                  # hit the edge ⇒ straight road\n\ndef middle(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow, fast = slow.next, fast.next.next\n    return slow                   # fast done ⇒ slow at middle',
      narration: "Two things to watch in the code. First, the while condition: fast and fast-dot-next — you must check both, or asking for next on a None node crashes. That's the number-one bug in this pattern. Second, the meeting check uses is, not double-equals — because we're asking whether it's the very same node, not whether the values are equal. The same value can repeat on different nodes. Time O(n), space O(1) — and that O(1) space is the jewel of this pattern.",
    },
    {
      heading: 'Watch out! Beyond linked lists',
      bullets: [
        'Happy Number: the “next node” is a <i>computation</i> (sum of squared digits) — cycle detection on numbers!',
        'Find the Duplicate Number: treat <code>i → nums[i]</code> as a linked list; the duplicate is the cycle entrance.',
        'If interviewer allows O(n) space, a visited set is simpler — say both options out loud.',
      ],
      narration: "The last and cleverest point — this pattern isn't limited to lists. Anywhere there's a rule for the next step, it applies. In Happy Number, the next node is the sum of the squared digits — hopping from number to number, you either reach one or get stuck in a loop, and there's your cycle detection. Find the Duplicate is even prettier: build a path from index i to nums-of-i, and the repeated number sits exactly at the mouth of the cycle. And a practical tip — if the interviewer hasn't mentioned space, offer the visited set too, then add: if O(1) space is required, use Floyd. Showing you know both is the strongest answer.",
    },
  ],
};
