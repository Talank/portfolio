window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['queue-deque'] = {
  id: 'queue-deque',
  title: 'Queue / Deque',
  titleNe: 'The temple queue and the two-door micro',
  intro: 'FIFO order for BFS, and the deque trick behind Sliding Window Maximum',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        '<b>Queue (FIFO)</b>: process things in arrival order — the heart of BFS / level-order.',
        '<b>Deque</b>: push/pop at <i>both</i> ends in O(1) — powers Sliding Window Maximum.',
        'In Python: <code>collections.deque</code> for both — never <code>list.pop(0)</code>.',
      ],
      narration: "Now Queue and Deque. A queue is the temple darshan line — first to arrive is first to be seen, first in first out. Wherever you must process things in the order they arrived — especially BFS, which shows up in the trees and graphs modules ahead — a queue is the heart of it. A deque is a slightly special beast — like a micro-bus with doors at both ends — you can board and get off from the front and the back, both in O(1). In Python one container does both jobs — collections-dot-deque. And let me nail one thing down right now — never do list-dot-pop-of-zero — removing from the front shifts every other element, O(n); the deque's popleft is O(1).",
    },
    {
      heading: 'Story: Sliding Window Maximum',
      bullets: [
        'Window of size k slides; report the <b>max</b> at every stop — naive is O(nk).',
        'Think of a royal court: when a stronger newcomer arrives, everyone weaker <b>leaves for good</b>.',
        'They can never be the answer again — a weaker, older element is doubly useless.',
      ],
      narration: "The crown of this module — Sliding Window Maximum. The window slides, and at each stop you must name the largest inside. Searching the window each time is O(n times k) — it dies on big inputs. Now a palace story — a line of warriors stands in the court. When a new warrior enters, the rule is: everyone weaker than him leaves the line for good. Why for good? Think — that weaker warrior arrived before the newcomer, so he'll also leave the window earlier. As long as he's inside, the stronger newcomer is inside too — so he can never, in any window, be the maximum. Older and weaker — doubly useless. That proof is the heart of the deque trick.",
    },
    {
      heading: 'Mnemonic',
      big: '“Stronger arrives — the weak are dismissed. Grown too old — dismissed from the front.”',
      bullets: [
        'Back of deque: pop while smaller than the newcomer (kingmaking).',
        'Front of deque: pop when its index falls out of the window (retirement).',
        'The front is <i>always</i> the current maximum.',
      ],
      narration: "The hook: stronger arrives, the weak are dismissed; grown too old, dismissed from the front. The deque's two doors have two separate jobs. The weak leave by the back door — pop everyone smaller than the new element. The old leave by the front door — whoever's index has fallen outside the window is retired. Keep these two rules and the deque always holds a decreasing court, and the warrior standing at the front door is the king of every moment — the current maximum. Each element enters once and leaves at most once — total O(n). The kinship with the previous module's monotonic stack is obvious — this is a monotonic deque — the same taller-shorter rule, but with two doors.",
    },
    {
      heading: 'Python template',
      code: 'from collections import deque\n\ndef max_sliding_window(nums, k):\n    dq = deque()          # indices; values decreasing\n    ans = []\n    for i, x in enumerate(nums):\n        while dq and nums[dq[-1]] <= x:\n            dq.pop()                  # dismiss the weak (from the back)\n        dq.append(i)\n        if dq[0] <= i - k:\n            dq.popleft()              # dismiss the old (from the front)\n        if i >= k - 1:\n            ans.append(nums[dq[0]])   # front = the king\n    return ans',
      narration: "The template has three blocks — dismiss the weak, dismiss the old, and record the answer. Things to watch — the deque holds indices, not values, because you need the index to check whether someone has grown too old. To record the answer you wait for i greater-than-or-equal to k minus one — you can't name a max before the first window is complete. And the edge of less-than-or-equal — pop the older one even on a tie, because the newcomer is just a younger version of the same value, so there's no gain keeping the old. Time O(n), space O(k).",
    },
    {
      heading: 'Watch out! Where each shows up',
      bullets: [
        'Plain queue: BFS (graphs module), level-order traversal (trees module), task schedulers.',
        'Monotonic deque: Sliding Window Maximum/Minimum, Shortest Subarray with Sum ≥ K (with prefix sums).',
        'Two stacks can simulate a queue — a classic warm-up question worth knowing.',
        'Heap also gives window max but in O(n log n) — deque is strictly better here; say why.',
      ],
      narration: "Finally, the map — which container goes where. A plain queue — BFS and level-order — the engine of the modules ahead; you'll meet this line's story again there. A monotonic deque — anywhere a window's max or min is asked, and in the tougher Shortest Subarray with Sum at least K, where it works together with prefix sums. Keep one beloved warm-up in mind too — building a queue from two stacks — one to fill, one to pour into and take from reversed. And come to the interview ready to compare — if they ask, doesn't a heap also give the window max? Yes, but in O(n log n) — the deque does it in O(n), because it recognizes and discards the already-useless, while a heap keeps carrying the old ones around. Being able to say that is where you stand out.",
    },
  ],
};
