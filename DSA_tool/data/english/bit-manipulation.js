window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['bit-manipulation'] = {
  id: 'bit-manipulation',
  title: 'Bit Manipulation',
  titleNe: 'The game of light switches, on and off',
  intro: 'AND, OR, XOR, and shifts — O(1) tricks that replace loops once you see the binary pattern',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Anything about parity, uniqueness, or “without extra space”: single number, missing number, power of two.',
        'Bitmask as a compact set: use an int’s bits to represent “which of N items are included” — great with backtracking/DP.',
        '<code>&</code> (AND), <code>|</code> (OR), <code>^</code> (XOR), <code>~</code> (NOT), <code>&lt;&lt;</code>/<code>&gt;&gt;</code> (shift) — five tools, endless tricks.',
      ],
      narration: "Now Bit Manipulation — the art of seeing a number not as a decimal, but as a row of lights. Imagine a wall with a long row of light switches, each either on (a one) or off (a zero). Every number is such a row of switches. This module comes in handy when you see signals like without extra space, odd-or-even, or find the one odd number out — single number, missing number, power of two. And a powerful use — a bitmask — remembering which of N items are included inside a single integer, keeping state small when combined with the backtracking and DP of earlier modules. There are only five tools — AND, OR, XOR, NOT, and shift — but from these come countless tricks.",
    },
    {
      heading: 'Story: XOR, the self-cancelling switch',
      bullets: [
        'XOR = “different?” — same bits cancel to 0, different bits give 1.',
        '<code>x ^ x = 0</code> and <code>x ^ 0 = x</code> — pair up and everything unpaired survives.',
        'Single Number: XOR the whole array — every paired value cancels, the lone survivor is the answer.',
      ],
      narration: "XOR is the most magical switch — it asks just one question: are the two lights different? If different, it lights up (a one); if the same, it goes off (a zero). Memorize its two results — XORing a number with itself gives zero, because meeting same-with-same turns both off. And XORing a number with zero returns it unchanged, since comparing against zero changes nothing. Its famous use — Single Number — every number in the array appears twice, only one appears once — picture it like this, dancers pairing up on the floor, each pair dancing off and vanishing (XOR cancels them), and at the end the one left standing alone, who found no partner — that's the answer. XORing the whole array in sequence cancels all the pairs and leaves the lone one — O(n) time, O(1) space, no extra array at all.",
    },
    {
      heading: 'Mnemonic',
      big: '“XOR = are we different? AND = are both on? OR = is anyone on?”',
      bullets: [
        '<code>n & (n-1)</code> clears the lowest set bit — count-set-bits and power-of-two both lean on this.',
        '<code>n & -n</code> isolates the lowest set bit — used in Fenwick trees and bitmask DP.',
        '<code>x &lt;&lt; k</code> = multiply by 2ᵏ, <code>x &gt;&gt; k</code> = divide by 2ᵏ (careful with negatives).',
      ],
      narration: "The hook: XOR asks are we different, AND asks are both on, OR asks is anyone on. Now remember two lightning tricks. n AND (n minus one) — this turns off the lowest lit switch of n, leaving the rest as they were — because subtracting one from n flips that lowest one off and lights all the switches below it, and AND, meeting the two, erases only the lowest. This trick solves both counting how many switches are lit and whether a number is a power of two — a power-of-two number has exactly one switch lit, so if n AND n-minus-one is zero, it's a power of two. n AND negative-n isolates just the lowest lit switch, turning off all the rest — used in advanced structures like Fenwick trees. And shifting is just multiply and divide — a left shift multiplies by two, a right shift divides by two, but be careful with negative numbers.",
    },
    {
      heading: 'Python template',
      code: 'def single_number(nums):\n    result = 0\n    for x in nums:\n        result ^= x          # pairs cancel, the lone one remains\n    return result\n\ndef count_set_bits(n):\n    count = 0\n    while n:\n        n &= (n - 1)          # clear the lowest lit switch — runs once per lit switch\n        count += 1\n    return count\n\ndef is_power_of_two(n):\n    return n > 0 and (n & (n - 1)) == 0\n\n# Bitmask as a set — subsets of {0..n-1}\ndef all_subsets_via_mask(items):\n    n = len(items)\n    res = []\n    for mask in range(1 << n):              # from zero to all-lit\n        subset = [items[i] for i in range(n) if mask & (1 << i)]\n        res.append(subset)\n    return res',
      narration: "Let's see four functions. single_number is a one-line loop — result XOR-equals x — sweeping the whole array leaves the lone one behind. count_set_bits repeats n AND n-minus-one in a while loop — each pass turns off one switch, so the loop runs exactly as many times as there were lit switches at the start. is_power_of_two pulls the same move into one line. And the last — a bitmask shows another way to produce all subsets without backtracking — go over every mask from zero up to two-to-the-n, and each lit switch of the mask says this item is included — one-shift-i picks and checks the i-th switch. This plain for loop does the same work as the recursive backtracking of an earlier module, in a different style.",
    },
    {
      heading: 'Watch out! Pitfalls and where it shows up',
      bullets: [
        'Python ints are arbitrary precision — no fixed 32-bit overflow, but LeetCode problems often assume 32-bit; mask with <code>& 0xFFFFFFFF</code> when needed.',
        'Negative numbers use two’s complement — right-shift behaves differently than in C/Java; be careful porting tricks.',
        'Bitmask DP: state = <code>(index, mask)</code> — classic for Traveling Salesman / “assign N tasks to N workers” at small N (≤ ~20).',
        'When bits feel unreadable, write out a small example in binary on paper — the pattern jumps out visually.',
      ],
      narration: "Final warnings. Python's integer can grow arbitrarily large — the overflow problem you get in C or Java after thirty-two bits doesn't happen in Python — but many LeetCode problems expect the answer assuming thirty-two bits, so when needed you trim with AND 0xFFFFFFFF. Negative numbers are stored inside using a special scheme called two's complement — right-shift can behave differently from C or Java, so be careful porting a trick from another language. Get to know the powerful combination of bitmask DP too — the state holds both an index and a mask — for problems like Traveling Salesman or assigning N tasks to N workers, where N is small, under about twenty. And a last practical tip — when the light game gets confusing in your head, write a small example out in binary on paper — the pattern shows up to the eye, no need to strain your mind.",
    },
  ],
};
