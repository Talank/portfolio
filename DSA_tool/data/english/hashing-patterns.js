window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['hashing-patterns'] = {
  id: 'hashing-patterns',
  title: 'Hashing Patterns',
  titleNe: 'Name it, get its shelf instantly',
  intro: 'trade O(n) space for O(1) lookups: complements, groups, seen-sets',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        '“Have I <b>seen</b> this before?” — duplicates, pairs, matching.',
        '“<b>Group</b> these by something” — anagrams, frequencies.',
        'Any O(n²) “for each element, scan for its partner” loop → hash map kills the inner scan.',
      ],
      narration: "Now hashing — more a superpower than a pattern, because it blends into roughly half of all problems somewhere. Here's the story. At an old hotel counter there's a board of key hooks, one hook per room. Say a room number and your hand goes straight to its hook — no searching. That's a hash map — name it, get its place, in O(1). When do you need it? When this question pops up: have I seen this thing before? Or: I need to group these by some property. And when your code has an inner loop scanning the whole array again to find a partner — a hash map wipes that inner loop out in one stroke.",
    },
    {
      heading: 'Story: Two Sum — ask the right question',
      bullets: [
        'Wrong question: “which pairs sum to target?” → all pairs, O(n²).',
        'Right question, per element: “<b>what do I need?</b> Is <code>target − x</code> already on the board?”',
        'One pass: check for the complement, then hang yourself on the board.',
      ],
      narration: "Two Sum — the most famous interview question in the world — is a hashing story. If every guest at a feast wandered the whole hall looking for their partner, that's O(n squared). There's another way — put a board at the door. As each guest enters, they first ask: what do I need? Target minus my own value. Is that hanging on the board? If yes, the pair is found, done. If not, they hang their own name on the board and walk in. Each guest's work is O(1), total O(n). Notice the shift in thinking — you ask not what do I have, but what do I need. That complement idea is the very heart of the hashing pattern.",
    },
    {
      heading: 'Mnemonic',
      big: '“Before you search, ask what you need — then hang yourself on the board.”',
      bullets: [
        'Complement first, insert after — one pass, and no self-pairing bug.',
        'Group anagrams: the key is the <b>signature</b> — <code>"".join(sorted(word))</code>.',
        'Seen-set for duplicates; Counter for frequencies.',
      ],
      narration: "The hook: before you search, ask what you need, and only then hang yourself on the board. The order matters — check first, then insert — otherwise you get the bug of pairing with yourself, like when the target is ten and your value is five. For grouping problems you need a different idea — the signature. Anagrams like listen and silent look different, but sort their letters and both become the same string. Use that sorted form as the key and they hang on the same hook. A signature is like a citizenship number — the appearance may change, but the number stays the same.",
    },
    {
      heading: 'Python toolkit',
      code: 'def two_sum(nums, target):\n    seen = {}                        # value -> index\n    for i, x in enumerate(nums):\n        if target - x in seen:       # ask first: what do I need?\n            return [seen[target - x], i]\n        seen[x] = i                  # then hang yourself\n    return []\n\nfrom collections import Counter, defaultdict\nCounter("dashain")                   # frequencies in one call\ngroups = defaultdict(list)\ngroups["".join(sorted(w))].append(w) # group anagrams by signature',
      narration: "Python makes hashing wonderfully easy. Two Sum is up top — seven lines. Below, meet two friends. Counter tallies any list or string in a single call — and you can compare two Counters directly for equality, which is the shortest way to check anagrams. defaultdict of list conjures an empty list when a key is missing, so you skip the three-line ceremony of if-key-not-in-dict. Use these two imports openly in an interview — it's not cheating, it's idiomatic Python, and interviewers are glad to see it.",
    },
    {
      heading: 'Watch out! Pitfalls',
      bullets: [
        'Keys must be immutable: <code>tuple(sorted(w))</code> ok, a list is not.',
        'Two Sum with duplicates: insert <i>after</i> checking handles <code>[5, 5], target 10</code> correctly.',
        'Hashing costs O(n) space — say the trade-off out loud.',
        'Subarray-sum questions are <i>not</i> plain hashing — that is prefix-sum + hashing, next module!',
      ],
      narration: "Four warnings. One — dict keys must be immutable; a list can't be a key, a tuple can, so sometimes you write tuple-of-sorted. Two — don't fear duplicate values; the check-then-insert order handles cases like two fives summing to ten on its own, because the first five is already on the board. Three — hashing buys time but pays in space, O(n) memory; say that trade-off out loud, because a candidate who names it looks mature. Four — when you see a question about a subarray's sum, don't grab plain hashing; that's solved by pairing prefix sum with hashing, which is the very next module. Only together do they open that lock.",
    },
  ],
};
