/* Whisky Peak — the sliding window arc.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['minimum-size-subarray-sum'] = {
    id: 'minimum-size-subarray-sum',
    epNumber: 67,
    title: 'The Shortest Night of Drinking',
    arc: 'Whisky Peak',
    patternId: 'sliding-window',
    scene: 'colosseum',
    leetcode: { name: 'Minimum Size Subarray Sum', number: 209, difficulty: 'Medium', url: 'https://leetcode.com/problems/minimum-size-subarray-sum/' },
    problem: 'Given an array of positive integers and a target, return the length of the shortest contiguous subarray whose sum is at least the target. Return 0 if no such subarray exists.',
    example: 'target = 7, nums = [2, 3, 1, 2, 4, 3]  →  answer: 2  (the run [4, 3])',

    h: 210,
    props: [
      { id: 'b0', emoji: '🍺', label: '2', x: 12, y: 38 },
      { id: 'b1', emoji: '🍺', label: '3', x: 28, y: 38 },
      { id: 'b2', emoji: '🍺', label: '1', x: 44, y: 38 },
      { id: 'b3', emoji: '🍺', label: '2', x: 60, y: 38 },
      { id: 'b4', emoji: '🍺', label: '4', x: 76, y: 38 },
      { id: 'b5', emoji: '🍺', label: '3', x: 92, y: 38 }
    ],
    ledger: [
      { id: 'Ls', x: 30, y: 80 },
      { id: 'Lb', x: 70, y: 80 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "The Baroque Works agents will only fall asleep once the crew has drunk at least seven barrels — and Zoro wants it done in as FEW consecutive rounds as possible. He can't skip a round in the middle; whatever he starts, he finishes.",
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "So try every starting round and count forward from each? Six starts, six counts each — fine here, awful on a real night.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Watch what the barrels have in common: every one of them is positive. So adding a round can only raise the total, and dropping a round from the front can only lower it. That is a licence to slide a window instead of restarting.",
        p: { Ls: 'lit', Lb: 'lit' }, l: { Ls: 'sum: 0', Lb: 'best: —' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Grow from the right while we're short. Two, then five, then six — still under seven. Then the fourth round brings it to eight. We've cleared the bar for the first time, with four rounds.",
        p: { b0: 'lit', b1: 'lit', b2: 'lit', b3: 'lit' }, l: { Ls: 'sum: 8', Lb: 'best: 4' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Now shrink from the left, as long as we still clear it. Drop the first two: six. That's short — so four rounds was as tight as that window goes. Put the barrel back conceptually and move on.",
        l: { Ls: 'sum: 6', Lb: 'best: 4' },
        sfx: null
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Add the fifth round, four barrels — that's ten. Now shrink hard: drop the 3, leaves seven. Still enough. Drop the 1, leaves six — too few, so stop. Three rounds that time.",
        p: { b0: 'dim', b1: 'dim', b2: 'lit', b3: 'lit', b4: 'lit' }, l: { Ls: 'sum: 7', Lb: 'best: 3' },
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "Add the last round, three barrels — ten again. Shrink: drop the 1 and the 2 and we're at seven with just two rounds standing. Drop another and we fall short.",
        p: { b2: 'dim', b3: 'dim', b4: 'good', b5: 'good' }, l: { Ls: 'sum: 7', Lb: 'best: 2' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Two rounds. And notice neither edge ever went backwards — the right edge walked the line once and the left edge walked it once. Two pointers, 2n moves total, no matter how the nesting looks in the code.",
        p: { Lb: 'good' }, l: { Lb: 'best: 2 ✓' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "And if the whole night doesn't add up to seven at all? Then we never once cleared the bar, and the answer has to be zero — not some leftover window length.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is why 'best' starts at infinity and is translated to zero at the end if it was never touched. And one warning: put a single negative barrel on that table and the whole licence collapses — shrinking would no longer be guaranteed to lower the sum.",
        sfx: 'chime'
      }
    ],

    insight: 'A window is legal to slide only when the values are monotone in the right direction — all-positive here means growing right can only help and shrinking left can only hurt, which is exactly what makes the shrink safe.',
    complexity: '<b>Time O(n)</b> — each pointer moves forward only, so the inner shrink loop costs O(n) across the whole run, not per step. <b>Space O(1)</b>. The prefix-sum plus binary-search alternative is O(n log n).',
    pitfall: 'Returning the last window length instead of 0 when the target is never reached. And the deeper trap: this technique needs all values positive. With negatives, shrinking can raise the sum, so you must use prefix sums with a map instead.',
    solution: `def min_subarray_len(target, nums):
    best = float('inf')
    left = 0
    total = 0
    for right, x in enumerate(nums):
        total += x                       # grow on the right
        while total >= target:           # shrink while still legal
            best = min(best, right - left + 1)
            total -= nums[left]
            left += 1
    return 0 if best == float('inf') else best`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different deck, same window: Sanji needs the SHORTEST run of consecutive days whose catch totals at least 40 kilos. Every day's catch is a positive number. Where in the loop should he record a candidate answer?",
        options: [
          'Inside the shrink loop, just before removing the leftmost day — the window is minimal-for-its-right-edge exactly there',
          'Every time he adds a day on the right',
          'Only once, after the loop finishes',
          'Whenever the total drops below 40'
        ],
        correct: 0,
        explain: 'The window is at its tightest for the current right edge at the moment it still clears the bar but is about to be shrunk. Recording on every growth would count windows that are wider than necessary, and recording after the total falls short measures an illegal window.',
        hint: 'For a fixed right edge, which position of the left edge gives the shortest valid window?'
      },
      {
        tag: 'TWEAK',
        q: "One of the fishing days is recorded as −5 kilos (spoiled catch discarded). Sanji runs the identical sliding window. What breaks?",
        options: [
          'Shrinking from the left can now RAISE the total, so a window dismissed as too short might have been valid',
          'Nothing — the window still works with negatives',
          'Only the answer\'s sign changes',
          'It becomes an infinite loop'
        ],
        correct: 0,
        explain: 'The whole method rests on monotonicity: grow raises, shrink lowers. Removing a negative from the left increases the sum, so the shrink loop\'s stopping condition no longer means what it claims. With negatives the tool is prefix sums plus a map — the shape people reach for in "subarray sum equals k".',
        hint: 'What happens to the total when you drop a negative day off the left edge?'
      },
      {
        tag: 'PITFALL',
        q: "The target is 100 but the entire array sums to 30. Sanji's code initialises <code>best = 0</code> and returns it directly. What does it report, and what should it?",
        options: [
          'It reports 0 by accident — correct here, but the same bug returns 0 for a valid input when best is never updated upward',
          'It correctly reports 0 in all cases',
          'It reports the array length',
          'It crashes on an empty result'
        ],
        correct: 0,
        explain: 'Starting at 0 and taking a minimum against it means 0 always wins, so a valid answer can never replace it — the code returns 0 even when a real window exists. Seed with infinity and translate to 0 at the end; that keeps "no window found" and "the window has length 0" distinguishable.',
        hint: 'If best starts at 0, what does min(best, anything positive) ever produce?'
      }
    ]
  };

  E['substring-concatenation'] = {
    id: 'substring-concatenation',
    epNumber: 68,
    title: 'The Passphrase in Any Order',
    arc: 'Whisky Peak',
    patternId: 'sliding-window',
    scene: 'colosseum',
    leetcode: { name: 'Substring with Concatenation of All Words', number: 30, difficulty: 'Hard', url: 'https://leetcode.com/problems/substring-with-concatenation-of-all-words/' },
    problem: 'Given a string s and a list of words all of the same length, return every starting index in s where a substring is exactly a concatenation of all the words, each used once, in any order.',
    example: 's = "barfoothefoobarman", words = ["foo","bar"]  →  [0, 9]',

    h: 210,
    props: [
      { id: 'p0', emoji: '🔡', label: 'bar', x: 12, y: 34 },
      { id: 'p1', emoji: '🔡', label: 'foo', x: 30, y: 34 },
      { id: 'p2', emoji: '🔡', label: 'the', x: 48, y: 34 },
      { id: 'p3', emoji: '🔡', label: 'foo', x: 66, y: 34 },
      { id: 'p4', emoji: '🔡', label: 'bar', x: 84, y: 34 },
      { id: 'w0', emoji: '🗝️', label: 'foo', x: 34, y: 78 },
      { id: 'w1', emoji: '🗝️', label: 'bar', x: 62, y: 78 }
    ],
    ledger: [
      { id: 'Ln', x: 88, y: 78 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "The vault passphrase is two words long — but the guard will accept them in EITHER order, and they must be spoken back to back with nothing in between. We have to find every place in this intercepted transmission where that happens.",
        p: { w0: 'lit', w1: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "Every arrangement of the words, searched for separately? With two words that's two arrangements. With ten words it's three and a half million.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "We never need the arrangements. All the words are the same length — three letters — so any valid stretch is just six letters split into two three-letter chunks. We only have to check that the multiset of chunks matches.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Read the transmission in three-letter chunks starting at position zero: 'bar', 'foo'. That is exactly our two words, each used once. Position zero is a hit.",
        p: { p0: 'good', p1: 'good' }, l: { Ln: 'hit: 0' },
        sfx: 'victory'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "But chunks starting at position one would be 'arf', 'oot' — nonsense. So don't we have to restart the chunking at every single position?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Only three times, not eighteen. Every position falls into one of three alignments — offset zero, one, or two — and within one alignment the chunk boundaries never move. So run a sliding window three times, once per alignment.",
        p: { p2: 'dim' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Inside an alignment it is an ordinary window over chunks. Add a chunk on the right; if it isn't one of our words at all, throw the whole window away and start fresh after it.",
        p: { p2: 'bad' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "And if it IS one of our words but we've already used it as many times as the passphrase allows, we shrink from the left until that duplicate is legal again.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "When the window holds exactly as many chunks as there are words, and none is over its allowance, we record the start. Then slide one chunk on and keep going.",
        p: { p3: 'good', p4: 'good' }, l: { Ln: 'hits: 0, 9' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "So the words list can repeat a word? 'foo' twice means we're allowed two 'foo' chunks and no more?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Exactly — which is why it is a count map rather than a set. A set would happily accept 'foo foo' when the passphrase was 'foo bar'. That single mistake is the difference between a working vault key and a locked door.",
        p: { w0: 'good', w1: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'Equal-length words mean the string only has to be read in as many alignments as the word length — within one alignment it is an ordinary count-matching sliding window over whole chunks.',
    complexity: '<b>Time O(L · n)</b> where L is the word length and n the length of s — L alignments, each a linear window over chunks. The naive restart-at-every-index version is O(n · k · L) for k words. <b>Space O(k · L)</b> for the count maps.',
    pitfall: 'Using a set instead of a count map, which loses the requirement that a repeated word be present that many times. Also: on an unknown chunk, the window must be reset entirely rather than shrunk one chunk at a time.',
    solution: `from collections import Counter

def find_substring(s, words):
    if not s or not words:
        return []
    k, L = len(words), len(words[0])
    need = Counter(words)
    span = k * L
    out = []

    # Only L distinct alignments exist; within each, chunk boundaries are fixed.
    for offset in range(L):
        left = offset
        have = Counter()
        count = 0
        for right in range(offset, len(s) - L + 1, L):
            chunk = s[right:right + L]
            if chunk not in need:
                have.clear()          # unknown chunk: nothing before it can survive
                count = 0
                left = right + L
                continue
            have[chunk] += 1
            count += 1
            # too many copies of this word — shrink until it is legal again
            while have[chunk] > need[chunk]:
                have[s[left:left + L]] -= 1
                count -= 1
                left += L
            if count == k:
                out.append(left)
                have[s[left:left + L]] -= 1
                count -= 1
                left += L
    return out`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different vault, same idea: Franky must find every stretch of a parts list that contains exactly one bolt, one plate and TWO rivets, in any order, with all part codes four characters long. What structure tracks the requirement?",
        options: [
          'A count map of required part → how many, compared against a count map of the current window',
          'A set of the required parts',
          'A sorted list of the required parts',
          'A single counter of how many parts are in the window'
        ],
        correct: 0,
        explain: 'Two rivets is a multiplicity requirement, so a set would accept a window with one rivet and something else, and a bare total would accept four bolts. Counts on both sides — with a "how many words are fully satisfied" tally for an O(1) validity check — is the shape.',
        hint: 'Which structure can tell the difference between one rivet and two?'
      },
      {
        tag: 'TWEAK',
        q: "The words are no longer all the same length: [\"a\", \"bc\"]. Does the alignment trick still apply?",
        options: [
          'No — chunk boundaries stop being fixed, so this becomes a much harder search rather than a window',
          'Yes, using the shortest word as the chunk size',
          'Yes, using the longest word as the chunk size',
          'Yes, by padding all words to the same length'
        ],
        correct: 0,
        explain: 'The entire method rests on being able to cut the string into fixed-size pieces so that any valid stretch aligns to those cuts. With mixed lengths, where one word ends depends on which word it was, so you are into backtracking or a trie-driven search. Equal length is a load-bearing precondition, not a convenience.',
        hint: 'What lets you say "any valid stretch starts on a chunk boundary"?'
      },
      {
        tag: 'PITFALL',
        q: "Nami hits a chunk that is not in the word list at all. She shrinks the window from the left by one chunk and carries on. What is wrong with that?",
        options: [
          'No window containing that chunk can ever be valid, so the whole window must be discarded and restarted past it',
          'Nothing — shrinking one chunk is equivalent and simpler',
          'She should grow the window instead',
          'She should shrink by one character rather than one chunk'
        ],
        correct: 0,
        explain: 'An unknown chunk poisons every window that spans it, so shrinking one step at a time just re-derives that same fact repeatedly. Clearing the counts and jumping the left edge past the bad chunk is both correct and what keeps each alignment linear.',
        hint: 'Can any valid answer include a chunk that is not one of the words?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
