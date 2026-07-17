window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['sliding-window'] = {
  id: 'sliding-window',
  title: 'Sliding Window',
  titleNe: 'A window that slides — like peering through a moving frame',
  intro: 'best contiguous run (subarray/substring) in O(n) by growing and shrinking a window',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'The answer is a <b>contiguous</b> subarray / substring — “longest…”, “shortest…”, “max sum of…”.',
        'A condition must hold inside the run: at most K distinct, no repeats, sum ≥ target…',
        'Both pointers move <b>forward only</b> — unlike converging two pointers.',
      ],
      narration: "Now, Sliding Window. When you see words like longest substring, shortest subarray, at most K distinct — a bell should ring: the answer is some contiguous stretch. Here's the story. On a Kathmandu micro-bus the seats are limited, say twelve. New passengers keep boarding from the back. Once it's full, what happens? A passenger up front has to get off before a new one fits. The bus itself keeps rolling forward, but the group inside — that's our window — keeps sliding along, sometimes longer, sometimes shorter. Both doors only ever move forward, never back — and that's exactly what separates this from two pointers.",
    },
    {
      heading: 'Story: Why it beats brute force',
      bullets: [
        'Brute force: check every (start, end) pair → O(n²) or worse.',
        'Sliding window: each element enters once, leaves once → O(n).',
        'The window “remembers” — you never rebuild the count from scratch.',
      ],
      narration: "Why does this finish in O(n)? Because each passenger boards exactly once and gets off exactly once — just two events per passenger. Brute force, on the other hand, checks every possible start-and-end pair separately, counting from zero each time. That's like re-counting the passengers at every stop by making everyone get off and board again. The magic of the sliding window is memory: the state inside the window — say a dict counting each character — stays up to date. One boards, add one; one leaves, subtract one. You never redo the whole count.",
    },
    {
      heading: 'Mnemonic',
      big: '“Grow on the right, shrink from the left when it breaks.”',
      bullets: [
        'Grow: move <code>right</code> every step, add <code>nums[right]</code> into the window state.',
        'Shrink: <code>while</code> the condition breaks, remove <code>nums[left]</code>, move <code>left</code>.',
        'Record the answer after the window is valid again.',
      ],
      narration: "The hook: grow on the right, shrink from the left when it breaks. The right door steps forward every iteration and a new element enters the window. When the rule breaks — say more than K distinct characters — a while loop removes from the left until the rule holds again. Only then do you record the answer. Pay attention: the shrinking is done by a while, not an if, because sometimes you need to drop several passengers at once. Many bugs hide in exactly that little detail.",
    },
    {
      heading: 'Python template (variable-size window)',
      code: 'def longest_ok_window(s, k):\n    count = {}\n    left = 0\n    best = 0\n    for right, ch in enumerate(s):\n        count[ch] = count.get(ch, 0) + 1        # grow on the right\n        while len(count) > k:                    # broke the rule?\n            count[s[left]] -= 1                  # shrink from the left\n            if count[s[left]] == 0:\n                del count[s[left]]\n            left += 1\n        best = max(best, right - left + 1)       # record only when valid\n    return best',
      narration: "Look at the template. The outer for loop pushes right forward every time — it never stops. The inner while moves left only when the rule breaks. The window length is right minus left plus one — memorize that formula, because forgetting the plus one is an incredibly common mistake. And don't forget to delete a key from the dict once its count hits zero, or len of count gives a wrong answer. Total cost: time O(n), space O(k).",
    },
    {
      heading: 'Watch out! Two flavours + pitfalls',
      bullets: [
        '<b>Fixed-size</b> window (size k given): slide by adding one, removing one — no while loop needed.',
        '<b>Variable-size</b>: the template above; “longest” records after shrinking, “shortest” records <i>inside</i> the shrink loop.',
        'Negative numbers break the sum-based shrink logic — that variant needs prefix sums instead.',
      ],
      narration: "Finally, let's separate the two flavours. If the problem fixes the window size for you — say exactly k — you don't even need the while; add one, remove one, and slide smoothly. If you have to find the size yourself, use the template above. And a small but important point: when finding the longest, you record the answer after shrinking the window; but when finding the shortest, you record inside the shrink loop, because the shrunk window is itself the shorter answer. And the biggest trap of all — if the array has negative numbers, the logic of shrinking by subtracting from a sum falls apart. That kind of problem isn't solved by sliding window but by prefix sums — a pattern coming up a little later.",
    },
  ],
};
