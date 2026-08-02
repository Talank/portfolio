/* Twin Capes — the two-pointer arc.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['valid-palindrome'] = {
    id: 'valid-palindrome',
    epNumber: 65,
    title: 'The Lighthouse That Reads Both Ways',
    arc: 'Twin Capes',
    patternId: 'two-pointers',
    scene: 'sea',
    leetcode: { name: 'Valid Palindrome', number: 125, difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-palindrome/' },
    problem: 'Given a string, decide whether it reads the same forwards and backwards once you ignore case and every character that is not a letter or digit.',
    example: '"A man, a plan, a canal: Panama"  →  true      "race a car"  →  false',

    h: 200,
    props: [
      { id: 'c0', emoji: '🅰️', label: 'A', x: 14, y: 40 },
      { id: 'c1', emoji: '❓', label: ',', x: 30, y: 40 },
      { id: 'c2', emoji: '🅱️', label: 'm', x: 46, y: 40 },
      { id: 'c3', emoji: '🅱️', label: 'm', x: 62, y: 40 },
      { id: 'c4', emoji: '❓', label: ':', x: 78, y: 40 },
      { id: 'c5', emoji: '🅰️', label: 'a', x: 94, y: 40 }
    ],
    ledger: [
      { id: 'Ll', x: 25, y: 80 },
      { id: 'Lr', x: 75, y: 80 }
    ],

    steps: [
      {
        speaker: 'brook', pos: 'left',
        line: "The twin lighthouses at the Cape carry the same inscription — but one is meant to be read from the left and the other from the right. If the words truly match in both directions, the passage opens.",
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "So copy the inscription, reverse the copy, compare. Done. ...Although that means carrying a whole second inscription, and some of these run for hundreds of letters.",
        sfx: null
      },
      {
        speaker: 'zoro', pos: 'right',
        line: "Don't copy it. Stand one reader at each end and walk them toward each other. If every pair they meet matches, it reads both ways. The moment one pair disagrees, it does not.",
        p: { Ll: 'lit', Lr: 'lit' }, l: { Ll: '← left', Lr: 'right →' },
        sfx: 'chime'
      },
      {
        speaker: 'brook', pos: 'left',
        line: "But the stonemason carved punctuation and spaces into it, and mixed his capitals. Those were never part of the inscription — they are decoration.",
        p: { c1: 'bad', c4: 'bad' },
        sfx: null
      },
      {
        speaker: 'zoro', pos: 'right',
        line: "Then each reader skips anything that isn't a letter or a digit before it compares, and lowercases what it finds. Decoration is walked past, never compared.",
        p: { c1: 'dim', c4: 'dim' },
        sfx: 'pop'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "'A' against 'a' — same letter once you ignore the case. Skip the comma, skip the colon. Then 'm' against 'm'. They meet in the middle with nothing left to disagree about.",
        p: { c0: 'good', c5: 'good', c2: 'good', c3: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'zoro', pos: 'right',
        line: "One walk of the inscription, no second copy. Each reader only ever moves inward, so together they cover the stone exactly once.",
        sfx: null
      },
      {
        speaker: 'brook', pos: 'left',
        line: "There is one stone on this cape carved with nothing but punctuation. What happens then? Yohohoho — a reader that only knows how to skip will walk straight past the other one and off the end of the world!",
        p: { c1: 'bad', c4: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'zoro', pos: 'right',
        line: "So every skip is bounded by the other reader. Skip while there's still something between us — never past it. And a stone with no letters at all reads the same both ways by default.",
        p: { c1: 'dim', c4: 'dim' },
        sfx: 'chime'
      }
    ],

    insight: 'Two readers walking inward compare a sequence against its own reverse without ever building the reverse — and every inner skip loop must be bounded by the other pointer, or a string of pure punctuation walks them past each other.',
    complexity: '<b>Time O(n)</b> — each pointer moves inward only, so together they cover the string once. <b>Space O(1)</b>. Building a cleaned, reversed copy is also O(n) time but costs O(n) space for no benefit.',
    pitfall: 'The inner skip loops need the <code>left &lt; right</code> guard. Without it, an input like <code>".,;"</code> runs a pointer off the end. Odd-length strings need no special case — the pointers simply meet on the middle character and stop.',
    solution: `def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        # Skip decoration — but never past the other pointer.
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different cape, same walk: Franky must check whether a row of ship ribs is symmetric, ignoring any rib marked as a placeholder. He wants O(1) extra space. Which arrangement works?",
        options: [
          'One index from each end, each skipping placeholders before comparing, both bounded by the other',
          'One index from the start and one from the middle, moving in the same direction',
          'Copy the ribs, drop the placeholders, reverse and compare',
          'Count how many ribs of each kind there are and compare the counts'
        ],
        correct: 0,
        explain: 'Same shape as the inscription: symmetry is a claim about pairs equidistant from the ends, so the pointers must start at the ends and move inward. The copy-and-reverse version is correct but spends O(n) space, and counting throws away order entirely — it would call any rearrangement symmetric.',
        hint: 'Symmetry pairs the first with the last. Where must the two indices start?'
      },
      {
        tag: 'TWEAK',
        q: "New inscription, new rule: the passage opens if the stone reads both ways after removing AT MOST ONE character. On \"abca\", what does a plain two-pointer scan do, and what is needed?",
        options: [
          'It stops at the b/c mismatch — from there, test the two remaining candidates by skipping b, or skipping c',
          'Nothing changes; the plain scan already answers it',
          'It must try deleting every character in turn, which is O(n²)',
          'It returns false, which is the correct answer for "abca"'
        ],
        correct: 0,
        explain: 'At the first mismatch, the one allowed deletion must be spent on one of those two characters — nothing else can fix that pair. So you run an ordinary palindrome check on the two sub-ranges and accept if either passes, keeping the whole thing O(n). "abca" is valid: drop the c.',
        hint: 'When the readers first disagree, how many characters could the single deletion possibly be?'
      },
      {
        tag: 'PITFALL',
        q: "Nami writes the scan but leaves the bound off the skip loops: <code>while not s[left].isalnum(): left += 1</code>. On the input \".,\" what happens?",
        options: [
          'The left pointer runs off the end of the string and it crashes',
          'It correctly returns true',
          'It correctly returns false',
          'It loops forever without crashing'
        ],
        correct: 0,
        explain: 'Nothing in that loop stops at the right pointer or at the end of the string, so it indexes past the end. The guard <code>left &lt; right</code> inside every skip is what makes an all-punctuation input safe — and such a string should return true, since it has no letters to disagree about.',
        hint: 'What halts that inner loop if no character in the string is alphanumeric?'
      }
    ]
  };

  E['is-subsequence'] = {
    id: 'is-subsequence',
    epNumber: 66,
    title: 'The Message Hidden in the Log',
    arc: 'Twin Capes',
    patternId: 'two-pointers',
    scene: 'sea',
    leetcode: { name: 'Is Subsequence', number: 392, difficulty: 'Easy', url: 'https://leetcode.com/problems/is-subsequence/' },
    problem: 'Given strings s and t, decide whether s is a subsequence of t — that is, whether s can be formed by deleting some characters of t without reordering the rest.',
    example: 's = "abc", t = "ahbgdc"  →  true          s = "axc", t = "ahbgdc"  →  false',

    h: 210,
    props: [
      { id: 't0', emoji: '📖', label: 'a', x: 10, y: 34 },
      { id: 't1', emoji: '📖', label: 'h', x: 26, y: 34 },
      { id: 't2', emoji: '📖', label: 'b', x: 42, y: 34 },
      { id: 't3', emoji: '📖', label: 'g', x: 58, y: 34 },
      { id: 't4', emoji: '📖', label: 'd', x: 74, y: 34 },
      { id: 't5', emoji: '📖', label: 'c', x: 90, y: 34 },
      { id: 's0', emoji: '✉️', label: 'a', x: 26, y: 78 },
      { id: 's1', emoji: '✉️', label: 'b', x: 50, y: 78 },
      { id: 's2', emoji: '✉️', label: 'c', x: 74, y: 78 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "A message has been hidden inside the ship's log. The letters of the message appear in the log in order — but with other letters scattered between them. Nothing is rearranged; only padded.",
        p: { s0: 'lit', s1: 'lit', s2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So we check every way of picking three letters out of the log? That's an enormous number of combinations for a log this size.",
        sfx: null
      },
      {
        speaker: 'zoro', pos: 'right',
        line: "No need to choose. Read the log straight through with a finger on the message. Every time the log gives me the letter my finger is on, the finger advances. Otherwise I just keep reading.",
        sfx: 'chime'
      },
      {
        speaker: 'zoro', pos: 'right',
        line: "Log starts with 'a'. My finger is on 'a'. Match — finger moves to 'b'.",
        p: { t0: 'good', s0: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'zoro', pos: 'right',
        line: "Log gives 'h'. Not 'b'. Keep reading. Log gives 'b' — match, finger moves to 'c'. Then 'g', then 'd', neither of them 'c', keep reading. Then 'c'. Match.",
        p: { t1: 'dim', t2: 'good', s1: 'good', t3: 'dim', t4: 'dim', t5: 'good', s2: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The finger ran off the end of the message, which is precisely what success looks like — every letter was found, in order.",
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "But hold on. When the log offered that first 'a', what if there was a better 'a' further along? Shouldn't we consider waiting?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Never. Taking the earliest match leaves the longest possible remainder of the log for everything still to be matched. Waiting can only shorten what is left. Greedy is not a gamble here — it is provably safe.",
        sfx: 'gong'
      },
      {
        speaker: 'zoro', pos: 'right',
        line: "One pass of the log, one finger, no memory of what came before. If the log ends and the finger hasn't cleared the message, the message isn't in there.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And if there are a thousand different messages to check against the SAME log? Reading the whole log a thousand times seems wasteful...",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then you pre-index the log once: for every letter, the sorted list of positions where it appears. After that each message is answered with a binary search per character, and the log is never re-read.",
        sfx: 'chime'
      }
    ],

    insight: 'Greedy matching is optimal for subsequences: taking the earliest possible match never blocks a later one, because it leaves the longest possible remainder to work with.',
    complexity: '<b>Time O(n + m)</b> where n and m are the two lengths. <b>Space O(1)</b>. For many queries against one fixed t, pre-index positions per character — O(n) once, then O(m log n) per query.',
    pitfall: 'Confusing subsequence with substring or with anagram. A subsequence allows gaps but forbids reordering; comparing character counts answers "anagram" and would wrongly accept <code>s = "cba"</code>.',
    solution: `def is_subsequence(s, t):
    i = 0                     # finger on the message
    for ch in t:              # read the log straight through
        if i < len(s) and ch == s[i]:
            i += 1            # earliest match is always safe to take
    return i == len(s)`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different cargo, same walk: Chopper must confirm that a required sequence of treatments was administered in the right order, allowing unrelated treatments in between. Which check does it?",
        options: [
          'Walk the full record once, advancing a pointer through the required list only on a match',
          'Compare the counts of each treatment in the record and in the required list',
          'Sort both lists and compare them element by element',
          'Look for the required list as a contiguous block inside the record'
        ],
        correct: 0,
        explain: 'Order matters and gaps are allowed, which is exactly a subsequence. Counting or sorting destroys order, so both would accept the treatments given backwards. Searching for a contiguous block is the substring question, which would reject a perfectly valid record that had anything in between.',
        hint: 'Which of these still cares which treatment came first?'
      },
      {
        tag: 'TWEAK',
        q: "Robin now needs to check ten thousand different messages against the SAME long log. What changes?",
        options: [
          'Pre-index the log as letter → sorted list of positions, then binary search for the next occurrence after the current one',
          'Nothing — run the same linear scan ten thousand times',
          'Sort the log first, then binary search each character',
          'Build a trie of the ten thousand messages'
        ],
        correct: 0,
        explain: 'Repeated queries against a fixed haystack is the signal to pre-process it once. The index gives O(log n) per character instead of a full scan per message. Sorting the log would destroy the very ordering the problem is about, and a trie of the messages does not help when they are checked independently.',
        hint: 'The log never changes between queries. What can be computed once?'
      },
      {
        tag: 'PITFALL',
        q: "Usopp reasons: \"take the LAST matching position for each character instead of the first — that way we never waste an early one.\" On s = \"aa\", t = \"aab\", what does his rule produce?",
        options: [
          'It matches both letters onto the same final "a" and can wrongly reject or double-count',
          'The same correct answer, since both rules are symmetric',
          'A correct answer, but in O(n²) time',
          'True, which is the right answer here'
        ],
        correct: 0,
        explain: 'Greedy works precisely because it takes the earliest match and leaves the maximum remainder. Reaching for the last match consumes the tail that the remaining characters still need — and it needs extra bookkeeping to avoid reusing one position twice. The earliest-match argument is what makes the one-line loop correct.',
        hint: 'After you match a character, what does the rest of the message still need from the log?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
