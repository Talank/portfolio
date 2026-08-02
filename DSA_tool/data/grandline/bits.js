/* Wano — bit manipulation.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['add-binary'] = {
    id: 'add-binary',
    epNumber: 83,
    title: 'Two Tallies on the Same Scroll',
    arc: 'Wano',
    patternId: 'bit-manipulation',
    scene: 'night',
    leetcode: { name: 'Add Binary', number: 67, difficulty: 'Easy', url: 'https://leetcode.com/problems/add-binary/' },
    problem: 'Given two binary strings a and b, return their sum as a binary string.',
    example: 'a = "1010", b = "1011"  →  "10101"',

    h: 200,
    props: [
      { id: 'a1', emoji: '1️⃣', label: '1010', x: 28, y: 28 },
      { id: 'b1', emoji: '1️⃣', label: '1011', x: 72, y: 28 },
      { id: 'c1', emoji: '➕', label: 'carry', x: 50, y: 56 },
      { id: 'r1', emoji: '📜', label: '10101', x: 50, y: 82 }
    ],

    steps: [
      {
        speaker: 'zoro', pos: 'left',
        line: "Two tallies of Wano's rice stores, both kept in the old way — a stroke for each doubling. They have to be added, and the answer written in the same notation.",
        p: { a1: 'lit', b1: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Convert both to ordinary numbers, add them, convert back! ...Except these scrolls run to thousands of strokes, and no ordinary number holds that.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So add them the way you were taught to add on paper: right to left, column by column, carrying what spills over. The only difference is that a column spills at two rather than at ten.",
        p: { c1: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "Rightmost column: zero and one. That's one, no carry. Next: one and one. That's two — write zero, carry one.",
        p: { c1: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Next column: zero and zero, plus the carry of one. That is one, carry nothing. Then one and one, which is two again — write zero, carry one.",
        sfx: null
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "And now both scrolls are exhausted but the carry is still standing. It gets its own column at the front.",
        p: { r1: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is the whole trap in this problem. The loop must keep going while EITHER string has digits left OR a carry is outstanding — three conditions, not two.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "And the two scrolls needn't be the same length. Padding them first would work, but treating a missing digit as zero is simpler and costs nothing.",
        p: { a1: 'dim', b1: 'dim' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One more thing worth knowing. Each column here is a single-bit adder: the digit written is the exclusive-or of the three inputs, and the carry is set when at least two of them are one. That is literally how the hardware does it.",
        p: { c1: 'good', r1: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'Column-wise addition with a carry works in any base and at any length — the loop must run while either operand has digits left or a carry is still outstanding.',
    complexity: '<b>Time O(max(m, n))</b> — one pass over the longer string. <b>Space O(max(m, n))</b> for the result. Converting to integers first is O(n) too, but overflows for long inputs in fixed-width languages.',
    pitfall: 'Ending the loop when both strings run out, dropping a final carry — the input "1" + "1" then returns "0" instead of "10". Also remember the result is built backwards and must be reversed.',
    solution: `def add_binary(a, b):
    i, j = len(a) - 1, len(b) - 1
    carry = 0
    out = []

    # Keep going while EITHER string has digits or a carry is outstanding.
    while i >= 0 or j >= 0 or carry:
        total = carry
        if i >= 0:
            total += int(a[i]); i -= 1
        if j >= 0:
            total += int(b[j]); j -= 1
        out.append(str(total % 2))
        carry = total // 2

    return ''.join(reversed(out))`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different scroll, same column walk: Nami adds two very long decimal amounts given as digit strings, too large for any integer type. What is the loop condition?",
        options: [
          'While either string has digits left OR the carry is non-zero',
          'While both strings have digits left',
          'While the carry is non-zero',
          'For exactly max(len(a), len(b)) iterations'
        ],
        correct: 0,
        explain: 'Identical to binary with the spill point at 10 instead of 2. Stopping when both run out loses a final carry, and a fixed max-length loop drops it too — 999 + 1 needs one more column than either operand has.',
        hint: 'Add 999 and 1 by hand. How many columns does the answer have?'
      },
      {
        tag: 'PITFALL',
        q: "Zoro writes <code>while i >= 0 or j >= 0</code> and returns the reversed result. What does he get for a = \"1\", b = \"1\"?",
        options: [
          '"0" — the final carry is dropped',
          '"10", correctly',
          '"11"',
          'An empty string'
        ],
        correct: 0,
        explain: 'Both strings are exhausted after one column, which wrote 0 and carried 1 — and the loop then ends, so the carry never becomes a digit. It is the same class of bug as forgetting to emit the last block in a sweep: state left over when the loop exits.',
        hint: 'What is still held in the carry variable when that loop condition goes false?'
      },
      {
        tag: 'TWEAK',
        q: "The interviewer forbids the <code>+</code> operator entirely — add two 32-bit integers with bit operations only. What is the loop?",
        options: [
          'XOR gives the sum without carries, (a & b) << 1 gives the carries; repeat until the carry is zero',
          'AND gives the sum, XOR gives the carry',
          'OR gives the sum, shift gives the carry',
          'It cannot be done without addition'
        ],
        correct: 0,
        explain: 'Exactly the single-bit adder from the last line of the episode, applied to all bits at once: XOR is addition modulo 2 per column, AND finds the columns that generate a carry, and the shift moves each carry into its next column. In fixed-width signed languages you also mask to 32 bits and sign-extend at the end.',
        hint: 'Which gate produces the sum bit in a half adder, and which produces the carry?'
      }
    ]
  };

  E['reverse-bits'] = {
    id: 'reverse-bits',
    epNumber: 84,
    title: 'The Mirror Seal',
    arc: 'Wano',
    patternId: 'bit-manipulation',
    scene: 'night',
    leetcode: { name: 'Reverse Bits', number: 190, difficulty: 'Easy', url: 'https://leetcode.com/problems/reverse-bits/' },
    problem: 'Reverse the bits of a given 32-bit unsigned integer.',
    example: 'n = 00000010100101000001111010011100  →  00111001011110000010100101000000',

    h: 200,
    props: [
      { id: 'src', emoji: '🪞', label: 'source', x: 25, y: 32 },
      { id: 'dst', emoji: '🪞', label: 'result', x: 75, y: 32 },
      { id: 'lo', emoji: '⬇️', label: 'take lowest', x: 25, y: 66 },
      { id: 'hi', emoji: '⬆️', label: 'push on', x: 75, y: 66 }
    ],
    ledger: [
      { id: 'K', x: 50, y: 88 }
    ],

    steps: [
      {
        speaker: 'zoro', pos: 'left',
        line: "Oden's seal is stamped in reverse — the last stroke first, the first stroke last. Thirty-two strokes exactly. We have to produce the mirror of it.",
        p: { src: 'lit', dst: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Write it out as a string of ones and zeroes, reverse the string, read it back?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That works and it is honest. But there is a version with no strings at all: pour the strokes from one vessel into another. Take the lowest bit off the source, push it onto the bottom of the result — and the result shifts up each time.",
        p: { lo: 'lit', hi: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "So each round: shift the result left to make room, or in the source's lowest bit, shift the source right. Thirty-two rounds, exactly.",
        p: { K: 'lit' }, l: { K: '32 rounds' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The first bit taken off the source ends up furthest from the bottom of the result, because it has been shifted left thirty-one more times. That is the reversal, and it costs no memory.",
        p: { src: 'good', dst: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Why exactly thirty-two rounds? If the number is small, the source hits zero early.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And that is the trap. Stopping when the source empties would produce a result that has not been shifted far enough — the leading zeroes are real bits here, and they must be carried through. The width is part of the problem.",
        p: { K: 'bad' }, l: { K: 'never stop early' },
        sfx: 'error'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "So the loop counts, rather than testing for zero. Fixed width, fixed rounds.",
        p: { K: 'good' }, l: { K: '32 rounds ✓' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "If they ask you to do better, there is a divide-and-conquer version: swap the two sixteen-bit halves, then the eight-bit quarters within those, then fours, twos and ones. Five masked steps instead of thirty-two.",
        sfx: 'gong'
      }
    ],

    insight: 'Reversing a fixed-width value is pouring bits from one end into the other — and because leading zeroes are part of the width, the loop must count rounds rather than stop when the source empties.',
    complexity: '<b>Time O(32)</b>, i.e. constant. <b>Space O(1)</b>. The mask-and-swap version does it in 5 steps; if the function is called many times, an 8-bit lookup table with 4 lookups is the usual production answer.',
    pitfall: 'Ending the loop when the source reaches zero. For n = 1 that gives 1 instead of 0x80000000, because the 31 leading zeroes never get shifted through. Also, in Java use <code>&gt;&gt;&gt;</code>, not <code>&gt;&gt;</code>.',
    solution: `def reverse_bits(n):
    out = 0
    # Exactly 32 rounds: leading zeroes are real bits at a fixed width.
    for _ in range(32):
        out = (out << 1) | (n & 1)   # make room, then pour in the lowest bit
        n >>= 1
    return out`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp writes <code>while n: out = (out << 1) | (n & 1); n >>= 1</code>. For n = 1, what does he return?",
        options: [
          '1, but the answer should be 0x80000000 — the 31 leading zeroes were never shifted through',
          '0x80000000, correctly',
          '0',
          '32'
        ],
        correct: 0,
        explain: 'One round runs, out becomes 1, and the loop stops. The reversal of a 32-bit value depends on the width, and the leading zeroes are genuine positions that must each be shifted past. Counting rounds rather than testing the source is the fix.',
        hint: 'How many times must the very first bit be shifted left to reach the top?'
      },
      {
        tag: 'TRANSFER',
        q: "Different seal, same pour: Franky must reverse the ORDER of the 4 bytes in a 32-bit word (an endianness swap), not the individual bits. What changes?",
        options: [
          'Pour in 8-bit chunks instead of 1-bit ones — mask a byte, shift the result by 8, repeat 4 times',
          'Nothing; bit reversal already reverses the bytes',
          'It requires converting to a string first',
          'Reverse the bits and then reverse each byte again'
        ],
        correct: 0,
        explain: 'The same pour with a bigger ladle. Note the last option is not wrong so much as roundabout — reversing all bits and then re-reversing within each byte does give a byte swap, which is a nice way to see that the two operations compose.',
        hint: 'The loop moves one unit at a time. What is the unit now?'
      },
      {
        tag: 'TWEAK',
        q: "The interviewer says the function will be called millions of times. What is the standard optimisation?",
        options: [
          'Precompute a 256-entry table of reversed bytes, then reverse a word with 4 lookups and 3 shifts',
          'Cache every input and its result in a hash map',
          'Use recursion instead of a loop',
          'Nothing can improve on a constant-time function'
        ],
        correct: 0,
        explain: '"Constant time" is not the same as "fast": 32 iterations per call is worth replacing when the call count is huge. A byte table is 256 entries and turns each call into four lookups. Caching whole inputs is hopeless — there are four billion of them.',
        hint: 'Which is smaller: the set of possible 32-bit words, or the set of possible bytes?'
      }
    ]
  };

  E['single-number-ii'] = {
    id: 'single-number-ii',
    epNumber: 85,
    title: 'The Blade Struck Only Once',
    arc: 'Wano',
    patternId: 'bit-manipulation',
    scene: 'night',
    leetcode: { name: 'Single Number II', number: 137, difficulty: 'Medium', url: 'https://leetcode.com/problems/single-number-ii/' },
    problem: 'Every element in the array appears exactly three times except for one, which appears once. Find that element, in linear time and constant extra space.',
    example: 'nums = [2, 2, 3, 2]  →  answer: 3',

    h: 210,
    props: [
      { id: 'm0', emoji: '⚔️', label: '2', x: 18, y: 30 },
      { id: 'm1', emoji: '⚔️', label: '2', x: 40, y: 30 },
      { id: 'm2', emoji: '🗡️', label: '3', x: 62, y: 30 },
      { id: 'm3', emoji: '⚔️', label: '2', x: 84, y: 30 }
    ],
    ledger: [
      { id: 'B0', x: 25, y: 76 },
      { id: 'B1', x: 50, y: 76 },
      { id: 'B2', x: 75, y: 76 }
    ],

    steps: [
      {
        speaker: 'zoro', pos: 'left',
        line: "Every blade in the armoury was struck three times by the same smith — except one, struck once. Find it. And the smiths kept no ledger, so we can't just count.",
        p: { m0: 'lit', m1: 'lit', m2: 'lit', m3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Count with a hash map, obviously. ...Which they've forbidden. Constant space only.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "In the version where everything appears twice, exclusive-or does it — pairs cancel. But XOR only knows how to count to two. Here we need something that counts to three and resets.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So work one bit position at a time. Across all the numbers, count how many have a one in that position. Every thrice-struck blade contributes three, or none — so the total is a multiple of three, PLUS whatever the lone blade contributes.",
        p: { B0: 'lit', B1: 'lit', B2: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "So take that count modulo three. What's left in each position is exactly the lone blade's bit.",
        p: { m2: 'good' }, l: { B0: 'count % 3' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "That's thirty-two passes over the array, one per bit. Still linear, and the space is a single counter. I'd be happy handing that in.",
        p: { B1: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "It is the right answer to give first. There is a sharper one: keep two accumulators, 'seen once' and 'seen twice', and update both with bit operations so that a bit appearing a third time is cleared from both at once.",
        p: { B2: 'lit' }, l: { B2: 'ones / twos' },
        sfx: null
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "A counter that counts to three across every bit position simultaneously, in two registers.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One warning for languages with fixed-width signed integers: if the lone blade is negative, the modulo-three reconstruction needs a sign fix-up at the end. Python's unbounded integers hide that, and the hiding is itself worth knowing about.",
        p: { B2: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'When XOR cannot count high enough, count each bit position independently and take the total modulo the repeat count — what survives is exactly the odd one out.',
    complexity: '<b>Time O(32n)</b> for the per-bit version, or <b>O(n)</b> in one pass for the two-accumulator version. <b>Space O(1)</b> for both. A hash map is O(n) time but O(n) space, which the problem forbids.',
    pitfall: 'Reaching for XOR out of habit — it cancels pairs, not triples, and returns nonsense here. In fixed-width signed languages, the per-bit reconstruction needs sign extension when the answer is negative.',
    solution: `def single_number(nums):
    # Two accumulators acting as a base-3 counter across every bit at once:
    # a bit reaching its third appearance is cleared from both.
    ones = twos = 0
    for x in nums:
        ones = (ones ^ x) & ~twos
        twos = (twos ^ x) & ~ones
    return ones

    # The straightforward version, worth giving first:
    #   for bit in range(32):
    #       count = sum((x >> bit) & 1 for x in nums)
    #       if count % 3:
    #           result |= 1 << bit`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different armoury: every blade appears exactly FIVE times except one, which appears twice. Does the counting idea still work?",
        options: [
          'Yes — count each bit position and take the total modulo 5; the remainder is 2 wherever the odd blade has a 1',
          'No, it only works when the odd element appears exactly once',
          'No, it only works for prime repeat counts',
          'Yes, but only if the array is sorted'
        ],
        correct: 0,
        explain: 'The argument never depended on the odd count being 1: every five-times element contributes a multiple of 5 to each column, so the remainder is entirely due to the odd one. You then check for a non-zero remainder rather than a remainder of exactly 1. The method generalises to any (k, m) with m not a multiple of k.',
        hint: 'What do the five-times elements contribute to any single bit column?'
      },
      {
        tag: 'PITFALL',
        q: "A different armoury rack reads [5, 5, 9, 5]. Zoro reaches for the familiar trick and XORs everything together. What comes out?",
        options: [
          '12 — the two matching 5s cancel, but the third survives and corrupts the answer',
          '9, correctly',
          '5',
          '0'
        ],
        correct: 0,
        explain: 'Two of the 5s cancel to zero, then 9 XOR 5 gives 12 — the leftover 5 is XORed into the answer alongside the real one. XOR is an exact fit for "everything twice except one" and an exact misfit here; reaching for it by pattern-match rather than by argument is the trap this problem is built around.',
        hint: 'What does 5 XOR 5 XOR 5 equal, and what happens when that meets the 9?'
      },
      {
        tag: 'TWEAK',
        q: "The array contains negative numbers and the language uses fixed-width signed 32-bit integers. What must be added to the per-bit reconstruction?",
        options: [
          'A sign fix-up: if bit 31 is set in the result, sign-extend it to a negative value',
          'Nothing; the per-bit method is sign-agnostic',
          'Take the absolute value of every input first',
          'Use 64-bit accumulators'
        ],
        correct: 0,
        explain: 'Rebuilding bit by bit produces an unsigned pattern. When the top bit is set, that pattern must be interpreted as a negative number rather than as a large positive one. Taking absolute values first would be worse — it destroys the very bits being counted.',
        hint: 'What does bit 31 mean in a signed 32-bit integer, and does the reconstruction know that?'
      }
    ]
  };

  E['bitwise-and-of-numbers-range'] = {
    id: 'bitwise-and-of-numbers-range',
    epNumber: 86,
    title: 'What Survives Every Banner',
    arc: 'Wano',
    patternId: 'bit-manipulation',
    scene: 'night',
    leetcode: { name: 'Bitwise AND of Numbers Range', number: 201, difficulty: 'Medium', url: 'https://leetcode.com/problems/bitwise-and-of-numbers-range/' },
    problem: 'Given two integers left and right, return the bitwise AND of every number in the inclusive range [left, right].',
    example: 'left = 5, right = 7  →  4      (5 & 6 & 7 = 4)',

    h: 200,
    props: [
      { id: 'v5', emoji: '🏴', label: '5 = 101', x: 22, y: 30 },
      { id: 'v6', emoji: '🏴', label: '6 = 110', x: 50, y: 30 },
      { id: 'v7', emoji: '🏴', label: '7 = 111', x: 78, y: 30 }
    ],
    ledger: [
      { id: 'C', x: 35, y: 74 },
      { id: 'R', x: 70, y: 74 }
    ],

    steps: [
      {
        speaker: 'zoro', pos: 'left',
        line: "Every banner from the fifth to the seventh is raised at once. A crest survives only if it appears on every single one of them. Which crests are left?",
        p: { v5: 'lit', v6: 'lit', v7: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Loop from left to right and AND them all. Fine for three banners. But the range can run to two billion, and then we're looping until the next age.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then look at what a range of consecutive numbers does to the low bits. If the range holds more than one number, the lowest bit alternates between zero and one — so it is cleared, always.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The same argument climbs. Any bit that changes anywhere inside the range is guaranteed to be zero somewhere, and one zero is enough to wipe it out.",
        p: { C: 'lit' }, l: { C: 'changing bits die' },
        sfx: 'chime'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "So the only crests that survive are the ones the endpoints already agree on — the common leading prefix of left and right.",
        p: { C: 'good' }, l: { C: 'common prefix' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Five is one-oh-one and seven is one-one-one. They agree on the leading one, then disagree. So the answer is one followed by zeroes — four.",
        p: { v5: 'good', v7: 'good' }, l: { R: 'answer 4' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which gives an algorithm with no loop over the range at all: shift both endpoints right until they are equal, counting the shifts, then shift the agreed value back left by that count.",
        sfx: 'chime'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "At most thirty-two shifts, regardless of how wide the range is. Two billion banners, thirty-two steps.",
        p: { R: 'good' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "There is a second form worth knowing: repeatedly clear the lowest set bit of the right endpoint until it drops to or below the left one. Same reasoning, expressed with Kernighan's trick.",
        sfx: 'gong'
      }
    ],

    insight: 'Over a range of consecutive integers, any bit that changes inside the range is zero somewhere and so is annihilated — the AND is exactly the common binary prefix of the two endpoints.',
    complexity: '<b>Time O(32)</b>, i.e. constant — one shift per bit position, independent of the range width. <b>Space O(1)</b>. Looping the range is O(right − left), which is hopeless at scale.',
    pitfall: 'Iterating the range. Also, when left equals right, the answer is that number itself — the shift loop handles it, but only if it is written as "shift while they differ" rather than assuming at least one shift.',
    solution: `def range_bitwise_and(left, right):
    shift = 0
    # Strip the differing low bits: whatever changes inside the range dies.
    while left < right:
        left >>= 1
        right >>= 1
        shift += 1
    return left << shift          # the common prefix, put back in place`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different banner rule: which crests appear on AT LEAST ONE banner in the range — the bitwise OR of every number from left to right. What is the shape of that answer?",
        options: [
          'The common prefix, followed by all ones from the highest differing bit down',
          'The same as the AND',
          'Always right',
          'Always left OR right'
        ],
        correct: 0,
        explain: 'Mirror reasoning: a bit that changes anywhere in the range is one somewhere, so OR sets it — and once the highest differing bit is crossed, every lower bit takes both values within the range. Note that <code>left | right</code> alone is not enough: for 5..7 it gives 7, which happens to be right here, but for 8..15 the true OR is 15 while 8 | 15 is also 15 — try 4..7 versus 4 | 7 to see the argument matters.',
        hint: 'Flip the argument: a changing bit is guaranteed to be WHAT somewhere in the range?'
      },
      {
        tag: 'PITFALL',
        q: "Usopp's loop is <code>result = left; for x in range(left+1, right+1): result &= x</code>. It is correct. Why is it still the wrong answer in an interview?",
        options: [
          'It is O(right − left), so for left = 0 and right = 2³¹−1 it never finishes',
          'It gives the wrong result for large ranges',
          'It uses too much memory',
          'AND is not associative, so the order matters'
        ],
        correct: 0,
        explain: 'Correctness is not the issue — the constraints are. The inputs run to 2³¹, so a per-element loop is not an algorithm, it is a hope. Reading the constraints and noticing that they rule out the obvious approach is the actual skill this problem tests.',
        hint: 'Look at the stated bounds on left and right, then count iterations.'
      },
      {
        tag: 'TWEAK',
        q: "left equals right — say both are 12. What does the shift algorithm return, and is it right?",
        options: [
          '12 — the loop never runs, shift stays 0, and the AND of a single number is itself',
          '0, which is wrong',
          '12, but only by accident',
          'It loops forever'
        ],
        correct: 0,
        explain: 'The condition <code>while left &lt; right</code> is false immediately, so the value is returned unshifted. This is why the loop must be written as "while they differ" rather than "do at least one shift" — the single-element range is the free edge case that a do-while version would get wrong.',
        hint: 'Check the loop condition before assuming the body runs at all.'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
