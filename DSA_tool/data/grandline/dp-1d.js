/* Egghead — one-dimensional dynamic programming.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['word-break'] = {
    id: 'word-break',
    epNumber: 69,
    title: 'Cutting the Unbroken Transmission',
    arc: 'Egghead',
    patternId: 'dynamic-programming',
    scene: 'sky',
    leetcode: { name: 'Word Break', number: 139, difficulty: 'Medium', url: 'https://leetcode.com/problems/word-break/' },
    problem: 'Given a string s and a dictionary of words, decide whether s can be segmented into a sequence of one or more dictionary words. A word may be reused any number of times.',
    example: 's = "applepenapple", dict = ["apple","pen"]  →  true',

    h: 210,
    props: [
      { id: 'd0', emoji: '📕', label: 'apple', x: 30, y: 22 },
      { id: 'd1', emoji: '📕', label: 'pen', x: 70, y: 22 },
      { id: 'p0', emoji: '0️⃣', label: '', x: 8, y: 56 },
      { id: 'p5', emoji: '5️⃣', label: 'apple', x: 32, y: 56 },
      { id: 'p8', emoji: '8️⃣', label: 'pen', x: 56, y: 56 },
      { id: 'p13', emoji: '🔚', label: 'apple', x: 84, y: 56 }
    ],
    ledger: [
      { id: 'L0', x: 8, y: 84 },
      { id: 'L5', x: 32, y: 84 },
      { id: 'L8', x: 56, y: 84 },
      { id: 'L13', x: 84, y: 84 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The transmission came through with every space stripped out — one unbroken run of letters. Vegapunk's dictionary is right here, but where do the cuts go?",
        p: { d0: 'lit', d1: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Try every possible set of cuts? For a message this long that's two to the power of everything. We'd be here until the next Reverie.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then let's not ask about the whole message at once. Ask a much smaller question, over and over: can the FIRST i letters be cut cleanly? Write it as a sentence and the code follows from the sentence.",
        p: { L0: 'lit' }, l: { L0: 'true' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The first zero letters can be cut cleanly — there is nothing there to cut. That is the base case, and it has to be true or nothing else can ever start.",
        p: { p0: 'good', L0: 'good' }, l: { L0: 'true ✓' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So for each position, I look backwards: is there some earlier position that was already true, where the stretch from there to here is a whole dictionary word?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Position five. Look back to position zero — true — and the letters from zero to five spell 'apple'. Both halves hold, so position five is true.",
        p: { p5: 'good', L5: 'good' }, l: { L5: 'true ✓' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Position eight. Look back to five — true — and five to eight spells 'pen'. True as well!",
        p: { p8: 'good', L8: 'good' }, l: { L8: 'true ✓' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And the end, position thirteen: back to eight, which is true, and eight to thirteen spells 'apple'. The whole transmission cuts cleanly.",
        p: { p13: 'good', L13: 'good' }, l: { L13: 'true ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "The clever part is that once a position is settled, it's settled forever. We never re-derive it, no matter how many later positions ask about it.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That is the whole of dynamic programming. And note the direction of the check — a position becomes true only if some EARLIER true position plus one word reaches it. A word alone is never enough.",
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "There's a trap, isn't there. If I check 'is any dictionary word a prefix of the rest' without asking whether where I'm standing is reachable, I'd accept nonsense.",
        p: { p8: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Precisely. Both halves must hold: reachable, and then a word. One without the other proves nothing.",
        p: { p8: 'good' },
        sfx: 'chime'
      }
    ],

    insight: 'Define the state as a sentence in English — "the first i characters can be segmented" — and the recurrence writes itself: true when some earlier true position is joined to this one by a single dictionary word.',
    complexity: '<b>Time O(n² · L)</b> in the plain form — for each end position, every split point, with an O(L) substring compare. Capping the look-back at the longest dictionary word is the standard practical cut. <b>Space O(n)</b> for the table plus the word set.',
    pitfall: 'Getting <code>dp[0]</code> wrong. It must be true — the empty prefix is trivially segmentable — or nothing downstream can ever become true. The other classic is checking only whether a word fits at position i without requiring i itself to be reachable.',
    solution: `def word_break(s, word_dict):
    words = set(word_dict)
    longest = max((len(w) for w in words), default=0)
    n = len(s)

    # dp[i] == "the first i characters can be cut into dictionary words"
    dp = [False] * (n + 1)
    dp[0] = True                       # the empty prefix, trivially true

    for i in range(1, n + 1):
        # Only look back as far as the longest word can reach.
        for j in range(max(0, i - longest), i):
            if dp[j] and s[j:i] in words:
                dp[i] = True
                break
    return dp[n]`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different machine, same shape: Franky must decide whether a length of cable can be cut exactly into pieces from a set of allowed lengths, reusing lengths freely. What should dp[i] mean?",
        options: [
          '"A cable of length i can be cut exactly into allowed pieces"',
          '"The number of pieces needed for a cable of length i"',
          '"The longest allowed piece that fits within length i"',
          '"Whether length i is itself an allowed piece"'
        ],
        correct: 0,
        explain: 'It is Word Break with numbers instead of letters: a boolean over prefixes, true when some earlier true length plus one allowed piece lands exactly here. Counting pieces answers a different (min-coins) question, and asking only whether i is itself allowed drops the composition entirely.',
        hint: 'What is the smallest true-or-false claim about a prefix that the next step needs?'
      },
      {
        tag: 'PITFALL',
        q: "Chopper initialises the whole table to false, including dp[0], and runs the loop. What comes back for s = \"apple\" with \"apple\" in the dictionary?",
        options: [
          'False — nothing is ever reachable, because no position has a true predecessor to build on',
          'True, correctly',
          'True, but only by accident',
          'It crashes on an index error'
        ],
        correct: 0,
        explain: 'Every entry needs an earlier true entry to stand on, so with dp[0] false the whole table stays false regardless of the input. The empty prefix being segmentable is not a technicality — it is the seed the entire recurrence grows from.',
        hint: 'Which entry has no earlier entry to depend on?'
      },
      {
        tag: 'TWEAK',
        q: "The mission changes: report HOW MANY different ways the transmission can be cut, not merely whether it can. What is the smallest change?",
        options: [
          'Make dp an integer table, seed dp[0] = 1, and add up the ways instead of stopping at the first success',
          'Run the same boolean version and count how many entries are true',
          'Use backtracking; a table cannot count',
          'Nothing changes; the table already holds the count'
        ],
        correct: 0,
        explain: 'Boolean-DP and counting-DP share a skeleton and differ in the combiner: OR becomes +, and the base case becomes "one way to segment nothing". The early <code>break</code> must also go, since every split point now contributes. This same swap turns Coin Change into Coin Change II.',
        hint: 'What does "true" become when the question stops being yes/no?'
      }
    ]
  };

  E['longest-increasing-subsequence'] = {
    id: 'longest-increasing-subsequence',
    epNumber: 70,
    title: 'The Rising Line of Satellites',
    arc: 'Egghead',
    patternId: 'dynamic-programming',
    scene: 'sky',
    leetcode: { name: 'Longest Increasing Subsequence', number: 300, difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-increasing-subsequence/' },
    problem: 'Given an array of numbers, return the length of the longest strictly increasing subsequence — the elements must appear in order but need not be adjacent.',
    example: 'nums = [10, 9, 2, 5, 3, 7, 101, 18]  →  answer: 4  (2, 3, 7, 18 or 2, 3, 7, 101)',

    h: 210,
    props: [
      { id: 'n0', emoji: '🛰️', label: '10', x: 10, y: 32 },
      { id: 'n1', emoji: '🛰️', label: '9', x: 24, y: 32 },
      { id: 'n2', emoji: '🛰️', label: '2', x: 38, y: 32 },
      { id: 'n3', emoji: '🛰️', label: '5', x: 52, y: 32 },
      { id: 'n4', emoji: '🛰️', label: '3', x: 66, y: 32 },
      { id: 'n5', emoji: '🛰️', label: '7', x: 80, y: 32 },
      { id: 'n6', emoji: '🛰️', label: '18', x: 94, y: 32 }
    ],
    ledger: [
      { id: 'T1', x: 20, y: 78 },
      { id: 'T2', x: 44, y: 78 },
      { id: 'T3', x: 68, y: 78 },
      { id: 'T4', x: 92, y: 78 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "The satellites pass overhead in a fixed order, and we can only lock onto ones that are higher than the last one we locked. Skipping is allowed — but going back in time is not. How long a chain can we get?",
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "For every satellite, look at all the earlier ones lower than it and take the best chain ending there, plus one. That works! It's just... every pair. Slow.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "It works, and it is the honest starting point — order n squared. But there is a sharper structure hiding here. Instead of the chains themselves, track the SMALLEST possible ending value for a chain of each length.",
        p: { T1: 'lit' }, l: { T1: 'len1: —' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Ten arrives. The best chain of length one now ends at ten. Nine arrives — a chain of length one that ends at nine is strictly better than one ending at ten, because nine leaves more room above it.",
        p: { n0: 'dim', n1: 'lit' }, l: { T1: 'len1: 9' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Wait — we just threw away ten. But it might have been part of the answer!",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Only its VALUE was replaced, never its length. Any chain that could have been built on ten can also be built on nine, and possibly more. We are keeping the length record and lowering the bar.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Two arrives — lower still, so length one now ends at two. Then five: five is higher than two, so it EXTENDS. Length two now ends at five.",
        p: { n2: 'lit', n3: 'lit' }, l: { T1: 'len1: 2', T2: 'len2: 5' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Three arrives. It can't extend past five, but a length-two chain ending at three is better than one ending at five. So it replaces five.",
        p: { n4: 'lit' }, l: { T2: 'len2: 3' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Seven extends to length three. A hundred and one extends to length four. Eighteen cannot extend past a hundred and one, but it lowers the length-four bar to eighteen.",
        p: { n5: 'good', n6: 'good' }, l: { T3: 'len3: 7', T4: 'len4: 18' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Four entries in the table, so the longest chain is four. And because that table is always sorted, finding where a new value belongs is a binary search — which drops the whole thing to n log n.",
        p: { T4: 'good' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So the table is the answer chain, right? Two, three, seven, eighteen — that IS a valid chain here.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Coincidence. The table is a record of best endings per length, not a real subsequence — its entries can come from positions in the wrong order. Only its LENGTH is meaningful. To recover an actual chain you must track predecessors separately.",
        sfx: 'chime'
      }
    ],

    insight: 'Keep the smallest possible tail for an increasing subsequence of each length: a new value either extends the table or lowers one of its bars, and the table stays sorted so the position is a binary search.',
    complexity: '<b>Time O(n log n)</b> — one binary search per element. The straightforward table version is <b>O(n²)</b> and is a perfectly good first answer to give before optimising. <b>Space O(n)</b>.',
    pitfall: 'Believing the tails array is the answer subsequence — it is not, and its contents may never have co-existed. Also, "strictly increasing" means the binary search must find the first tail <b>≥</b> x; using <b>&gt;</b> silently solves the non-decreasing variant instead.',
    solution: `from bisect import bisect_left

def length_of_lis(nums):
    # tails[k] = the smallest value that can end an increasing
    # subsequence of length k+1. Always sorted, so bisect applies.
    tails = []
    for x in nums:
        i = bisect_left(tails, x)     # first tail >= x  (strictly increasing)
        if i == len(tails):
            tails.append(x)           # x extends the longest chain
        else:
            tails[i] = x              # x lowers the bar for that length
    return len(tails)`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different cargo, same climb: Nami must stack crates into one tower, each strictly lighter than the one below, taking crates only in the order they come off the ship. What is she computing?",
        options: [
          'The longest strictly DECREASING subsequence — the same algorithm run on the negated weights',
          'The number of crates lighter than the first one',
          'The longest run of consecutive crates that decrease',
          'The heaviest crate she can place at the bottom'
        ],
        correct: 0,
        explain: 'Reversing the comparison is the same problem: negate the values (or flip the binary-search direction) and the tails method applies unchanged. Note the word "consecutive" in the wrong answer — that would be a much easier scan, and it is the standard misreading of this family.',
        hint: 'What single transformation turns "decreasing" into "increasing"?'
      },
      {
        tag: 'TWEAK',
        q: "The rule relaxes to NON-decreasing — equal values may sit on top of each other. What changes in the n log n version?",
        options: [
          'The search becomes bisect_right — find the first tail strictly greater than x, so an equal value extends rather than replaces',
          'Nothing; the same code handles both',
          'The tails array must be kept in decreasing order',
          'It falls back to the O(n²) version'
        ],
        correct: 0,
        explain: 'bisect_left finds the first tail ≥ x, so an equal value overwrites and the chain cannot grow through duplicates — correct for strict. bisect_right finds the first tail > x, letting equals extend. One function name is the entire difference between the two variants.',
        hint: 'On a run of equal values, do you want the new one to replace a tail or to extend the table?'
      },
      {
        tag: 'PITFALL',
        q: "Chopper prints the tails array at the end and reports it as the longest increasing subsequence. When is that wrong?",
        options: [
          'Often — the entries are best-endings per length and need not occur in that order in the input, so the printed list may not be a real subsequence',
          'Never; the tails array is always the answer',
          'Only when the input contains duplicates',
          'Only when the input is already sorted'
        ],
        correct: 0,
        explain: 'On [1, 5, 6, 2] the tails end as [1, 2, 6] — length 3 is right, but 1, 2, 6 is not a subsequence of the input in that order. Only the length is guaranteed. Reconstructing a real chain means recording, for each element, the index of its predecessor.',
        hint: 'Can a later, smaller value overwrite a tail that an earlier, larger value depended on?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
