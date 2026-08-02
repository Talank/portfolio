/* Drum Island — hash maps and hash sets.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['ransom-note'] = {
    id: 'ransom-note',
    epNumber: 111,
    title: 'The Letter Cut From the Newspaper',
    arc: 'Drum Island',
    patternId: 'hashing-patterns',
    scene: 'vault',
    leetcode: { name: 'Ransom Note', number: 383, difficulty: 'Easy', url: 'https://leetcode.com/problems/ransom-note/' },
    problem: 'Given two strings, return true if the first can be constructed using the letters of the second, where each letter of the second may be used at most once.',
    example: 'note = "aa", magazine = "aab"  →  true;   note = "aa", magazine = "ab"  →  false',

    h: 200,
    props: [
      { id: 'nt', emoji: '✉️', label: 'note: a a', x: 28, y: 30 },
      { id: 'mg', emoji: '📰', label: 'paper: a a b', x: 72, y: 30 },
      { id: 'ct', emoji: '🔢', label: 'counts', x: 50, y: 64 }
    ],
    ledger: [
      { id: 'V', x: 50, y: 88 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "Wapol's demand note was cut from the castle newspaper. If we can prove every letter in the note came from that one issue, we know where it was written.",
        p: { nt: 'lit', mg: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So check every letter of the note appears in the paper. Put the paper's letters in a set and look each one up.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That answers the wrong question. A set records that a letter exists, not how many there were. A note needing two 'a's would pass on a paper holding only one — you cannot cut the same letter out twice.",
        p: { ct: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So counts, not membership. Tally every letter in the paper, then walk the note spending them.",
        p: { ct: 'good' }, l: { V: 'a:2  b:1' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "First 'a' of the note: the tally drops to one. Second 'a': the tally drops to zero. Nothing ever goes negative, so the note fits.",
        p: { nt: 'good', mg: 'good' }, l: { V: 'a:0  b:1  ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And the moment a tally would go below zero, we stop and say no. We don't even need to read the rest of the note.",
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One pass to build the tally, one pass to spend it. Linear in both lengths, and the tally is at most twenty-six entries, so the space is effectively constant.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "The distinction between a set and a count map is the whole problem, isn't it. Everything else is bookkeeping.",
        sfx: 'gong'
      }
    ],

    insight: 'Membership and multiplicity are different questions — a set answers "does this exist", a count map answers "how many", and containment problems almost always need the second.',
    complexity: '<b>Time O(m + n)</b> — one pass over each string. <b>Space O(k)</b> for the alphabet, which is constant for lowercase English.',
    pitfall: 'Using a set and losing multiplicity. Also, an early exit is possible the moment the note is longer than the magazine — a free O(1) rejection worth mentioning.',
    solution: `from collections import Counter

def can_construct(ransom_note, magazine):
    if len(ransom_note) > len(magazine):
        return False                    # free rejection

    have = Counter(magazine)
    for ch in ransom_note:
        if have[ch] == 0:               # ran out of this letter
            return False
        have[ch] -= 1
    return True`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different supply run: Sanji must cook a dish needing 3 eggs, 1 onion and 2 peppers from a pantry list. Which structure answers whether he can?",
        options: [
          'A count map of the pantry, decremented per required ingredient, failing on any shortfall',
          'A set of the pantry\'s ingredient names',
          'A sorted list of both, compared element by element',
          'The total number of items in the pantry'
        ],
        correct: 0,
        explain: 'Same question in a kitchen: the recipe needs multiplicities, so a set would accept a pantry with one egg. Comparing totals is worse still — twelve onions do not make up for a missing pepper.',
        hint: 'Would a pantry containing exactly one egg satisfy a recipe calling for three?'
      },
      {
        tag: 'TWEAK',
        q: "The rule relaxes: letters may be reused from the paper as many times as needed. What is the right structure now?",
        options: [
          'A set — multiplicity no longer matters, only whether each distinct letter appears at all',
          'The same count map, unchanged',
          'A sorted list of the paper\'s letters',
          'A count map of the note instead'
        ],
        correct: 0,
        explain: 'The counts existed only to enforce single use. Remove that and the question collapses to plain membership, which is exactly what a set is for. Knowing when a structure becomes overkill is as useful as knowing when it is insufficient.',
        hint: 'With unlimited reuse, what does knowing there are five "a"s tell you that knowing there is at least one does not?'
      },
      {
        tag: 'PITFALL',
        q: "Usopp builds a count map of the NOTE and checks that each of its entries appears in the magazine at least once. What input does that wrongly accept?",
        options: [
          'note = "aab", magazine = "ab" — every distinct letter is present, but there is only one "a"',
          'note = "abc", magazine = "cba"',
          'note = "", magazine = "abc"',
          'Nothing; the check is equivalent'
        ],
        correct: 0,
        explain: 'Counting the note without comparing against the magazine\'s counts still reduces to membership on the magazine side. The comparison has to be count against count — for every letter, the magazine\'s tally must be at least the note\'s.',
        hint: 'Which side of the comparison lost its multiplicity information?'
      }
    ]
  };

  E['isomorphic-strings'] = {
    id: 'isomorphic-strings',
    epNumber: 112,
    title: 'The Cipher That Must Work Both Ways',
    arc: 'Drum Island',
    patternId: 'hashing-patterns',
    scene: 'vault',
    leetcode: { name: 'Isomorphic Strings', number: 205, difficulty: 'Easy', url: 'https://leetcode.com/problems/isomorphic-strings/' },
    problem: 'Two strings are isomorphic if the characters of the first can be replaced to get the second, preserving order, with no two characters mapping to the same character and each character mapping to itself consistently.',
    example: '"egg" and "add"  →  true;    "foo" and "bar"  →  false;    "badc" and "baba"  →  false',

    h: 200,
    props: [
      { id: 'sa', emoji: '🔤', label: 'e g g', x: 28, y: 28 },
      { id: 'sb', emoji: '🔤', label: 'a d d', x: 72, y: 28 },
      { id: 'f1', emoji: '➡️', label: 'forward map', x: 28, y: 62 },
      { id: 'f2', emoji: '⬅️', label: 'reverse map', x: 72, y: 62 }
    ],
    ledger: [
      { id: 'OK', x: 50, y: 88 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "Dr. Kureha's notes are enciphered by swapping letters — but the swap has to be reversible. Each letter always becomes the same letter, and no two letters may collapse onto the same one.",
        p: { sa: 'lit', sb: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So walk both strings together and record what each letter becomes. 'e' becomes 'a'. 'g' becomes 'd'. Then the second 'g' also becomes 'd' — consistent.",
        p: { f1: 'good' }, l: { OK: 'e→a, g→d' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "One map, then. What could go wrong?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Take 'badc' and 'baba'. Forward, 'b' becomes 'b', 'a' becomes 'a', 'd' becomes 'b'... and now two different letters both become 'b'. The forward map never noticed, because it only ever asked about the source.",
        p: { f2: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So we need a second map going the other way, checking that nothing is claimed twice.",
        p: { f2: 'good' }, l: { OK: 'both directions' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Two maps, checked at every position. If either disagrees with what it already recorded, the cipher is not reversible and the answer is no.",
        p: { sa: 'good', sb: 'good' }, l: { OK: 'egg / add ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "There's a neater version, isn't there? Compare the pattern of first appearances.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Map each string to the sequence of positions where each character was first seen. 'egg' gives zero, one, one; 'add' gives zero, one, one. Identical, so they are isomorphic — one comparison instead of two maps.",
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Both are linear. The two-map version is easier to explain out loud, which matters more than it sounds.",
        sfx: 'gong'
      }
    ],

    insight: 'A one-to-one mapping needs checking in both directions — a single forward map proves consistency but not injectivity, and it is the reverse check that catches two sources colliding on one target.',
    complexity: '<b>Time O(n)</b> — one pass with constant-time map operations. <b>Space O(k)</b> for the alphabet.',
    pitfall: 'Using only the forward map, which accepts <code>"badc"</code> and <code>"baba"</code>. The failure requires two distinct source characters mapping onto one target, so simple test cases miss it entirely.',
    solution: `def is_isomorphic(s, t):
    if len(s) != len(t):
        return False

    forward, backward = {}, {}
    for a, b in zip(s, t):
        # Consistency in both directions: a always becomes b, and only a does.
        if a in forward and forward[a] != b:
            return False
        if b in backward and backward[b] != a:
            return False
        forward[a] = b
        backward[b] = a
    return True`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper keeps only the forward map. Which pair does he wrongly accept?",
        options: [
          '"paper" and "title" is correctly accepted, but "foo" and "bee"... no — the failing shape is two sources mapping to one target, like "ab" and "aa"',
          '"egg" and "add"',
          '"abc" and "xyz"',
          'None; the forward map is sufficient'
        ],
        correct: 0,
        explain: 'On "ab" and "aa" the forward map records a→a and b→a with no conflict, because it only ever asks "has this SOURCE been seen before?". The reverse map is what notices that the target "a" has already been claimed. Two distinct sources colliding on one target is the only failure mode the forward map is blind to.',
        hint: 'Construct the smallest pair where two different letters must become the same letter.'
      },
      {
        tag: 'TRANSFER',
        q: "Different cipher, same requirement: Nami matches a pattern of words to a sentence — \"abba\" against \"dog cat cat dog\". What changes structurally?",
        options: [
          'Nothing — it is the same two-map check, with words as the target alphabet instead of characters',
          'It needs a count map rather than two maps',
          'It needs only one map, since words are unique',
          'It cannot be done with maps'
        ],
        correct: 0,
        explain: 'That is Word Pattern, and it is Isomorphic Strings with a larger alphabet on one side. The bijection requirement is identical: "abba" against "dog dog dog dog" must fail, and only the reverse map catches it.',
        hint: 'What is the equivalent of two letters colliding, when the targets are whole words?'
      },
      {
        tag: 'TWEAK',
        q: "The rule relaxes so that several characters MAY map onto the same one, as long as each character maps consistently. What is the check now?",
        options: [
          'The forward map alone suffices — the reverse check existed only to enforce one-to-one',
          'Two maps are still required',
          'Compare the sorted strings',
          'Compare the character counts'
        ],
        correct: 0,
        explain: 'Dropping injectivity drops exactly the constraint the backward map enforced. It is a good check on whether you understood why the second map was there, rather than having copied it from a template.',
        hint: 'Which of the two maps was catching the collision case?'
      }
    ]
  };

  E['word-pattern'] = {
    id: 'word-pattern',
    epNumber: 113,
    title: 'The Signal Flags and What They Stand For',
    arc: 'Drum Island',
    patternId: 'hashing-patterns',
    scene: 'vault',
    leetcode: { name: 'Word Pattern', number: 290, difficulty: 'Easy', url: 'https://leetcode.com/problems/word-pattern/' },
    problem: 'Given a pattern of letters and a sentence of words, determine whether the sentence follows the pattern — a full bijection between letters and words.',
    example: 'pattern = "abba", s = "dog cat cat dog"  →  true;   pattern = "abba", s = "dog dog dog dog"  →  false',

    h: 200,
    props: [
      { id: 'pt', emoji: '🚩', label: 'a b b a', x: 28, y: 30 },
      { id: 'ws', emoji: '💬', label: 'dog cat cat dog', x: 72, y: 30 },
      { id: 'ln', emoji: '📏', label: 'lengths must match', x: 50, y: 64 }
    ],
    ledger: [
      { id: 'B', x: 50, y: 88 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The signal flags spell out a pattern, and the shouted message is supposed to follow it. Same flag, same word. Different flags, different words.",
        p: { pt: 'lit', ws: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "This is the letter cipher again, with words on one side instead of characters. Split the sentence, then walk the flags and the words in step.",
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "'a' means dog. 'b' means cat. The second 'b' must mean cat — it does. The last 'a' must mean dog — it does.",
        p: { pt: 'good', ws: 'good' }, l: { B: 'a↔dog, b↔cat ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And the trap is the same one — 'abba' against four dogs. Forward, 'a' means dog and 'b' means dog, no contradiction at all.",
        p: { B: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So the reverse map matters just as much: once 'dog' is claimed by 'a', no other flag may claim it. Two maps, both checked.",
        p: { B: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "There's a check before any of that, though. If there are four flags and only three words, nothing can possibly line up.",
        p: { ln: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And it is easy to miss, because zipping two sequences of different lengths in most languages simply stops at the shorter one — silently accepting a mismatch instead of rejecting it.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So the length check isn't defensive tidying. It's a real case the rest of the code cannot see.",
        sfx: 'gong'
      }
    ],

    insight: 'A bijection needs both directions checked and both sequences the same length — and a zip that silently truncates will hide the length mismatch rather than reporting it.',
    complexity: '<b>Time O(n)</b> where n is the total length of the sentence — splitting dominates. <b>Space O(w)</b> for the two maps over distinct words.',
    pitfall: 'Zipping pattern and words without first comparing their lengths, so <code>"abc"</code> against <code>"dog cat"</code> is accepted. Also, splitting on a single space assumes no repeated or trailing spaces.',
    solution: `def word_pattern(pattern, s):
    words = s.split()
    if len(pattern) != len(words):
        return False               # zip would truncate and hide this

    letter_to_word, word_to_letter = {}, {}
    for ch, w in zip(pattern, words):
        if ch in letter_to_word and letter_to_word[ch] != w:
            return False
        if w in word_to_letter and word_to_letter[w] != ch:
            return False
        letter_to_word[ch] = w
        word_to_letter[w] = ch
    return True`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Robin omits the length check and relies on zip. What does her code return for pattern = \"abc\" and s = \"dog cat\"?",
        options: [
          'True — zip stops at the shorter sequence, so the unmatched "c" is never examined',
          'False, correctly',
          'It raises an error',
          'True, and that is the correct answer'
        ],
        correct: 0,
        explain: 'Zip silently truncates, so the loop sees two consistent pairs and reports success. The mismatch is invisible to every check inside the loop because the loop never reaches it — the guard has to come first.',
        hint: 'How many iterations does zip perform on sequences of length 3 and 2?'
      },
      {
        tag: 'TWEAK',
        q: "The sentence may contain multiple spaces between words, like \"dog  cat\". Does <code>s.split(' ')</code> still work?",
        options: [
          'No — splitting on a single space yields empty strings between the doubles; <code>s.split()</code> with no argument collapses whitespace runs',
          'Yes, both behave identically',
          'No, and neither form handles it',
          'Yes, provided the pattern is shorter'
        ],
        correct: 0,
        explain: 'A subtle language detail with a real consequence: the empty strings become "words" and the length check then fails on valid input. Preferring the no-argument split — or an explicit filter — is the kind of thing that turns a correct algorithm into a correct submission.',
        hint: 'What does "dog  cat".split(\' \') actually produce?'
      },
      {
        tag: 'TRANSFER',
        q: "Different signal, same bijection: Franky must check that a list of part codes maps one-to-one onto a list of bay numbers. What is the shortest correct test?",
        options: [
          'The two lists have equal length, and the number of distinct pairs equals both the number of distinct codes and the number of distinct bays',
          'The two lists have the same set of values',
          'Both lists are sorted identically',
          'Each code appears the same number of times as its bay'
        ],
        correct: 0,
        explain: 'A neat reformulation of the two-map check: a relation is a bijection exactly when pairing loses no information on either side. Counting distinct pairs against distinct values on each side captures both the forward and the reverse constraint in one comparison.',
        hint: 'If two codes map to one bay, how do the counts of distinct pairs and distinct bays compare?'
      }
    ]
  };

  E['valid-anagram'] = {
    id: 'valid-anagram',
    epNumber: 114,
    title: 'The Same Letters, Shaken',
    arc: 'Drum Island',
    patternId: 'hashing-patterns',
    scene: 'vault',
    leetcode: { name: 'Valid Anagram', number: 242, difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-anagram/' },
    problem: 'Given two strings, determine whether the second is an anagram of the first — the same letters with the same multiplicities, in any order.',
    example: 's = "anagram", t = "nagaram"  →  true;   s = "rat", t = "car"  →  false',

    h: 200,
    props: [
      { id: 'x1', emoji: '🧪', label: 'anagram', x: 28, y: 30 },
      { id: 'x2', emoji: '🧪', label: 'nagaram', x: 72, y: 30 },
      { id: 'tal', emoji: '🔢', label: 'one tally', x: 50, y: 64 }
    ],
    ledger: [
      { id: 'Z', x: 50, y: 88 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "Two labels from the medicine cabinet. Same letters, shuffled — or genuinely different compounds? Getting this wrong would be unfortunate.",
        p: { x1: 'lit', x2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Sort both and compare. Two lines, done.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Correct, and perfectly acceptable — n log n. But counting does it in linear time, and the counting version generalises to the harder problems in this family.",
        p: { tal: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "One tally. Add one for every letter of the first label, subtract one for every letter of the second.",
        p: { tal: 'good' }, l: { Z: 'add then subtract' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "If they are anagrams, every entry ends at zero. A single non-zero entry anywhere means the labels differ.",
        p: { x1: 'good', x2: 'good' }, l: { Z: 'all zero ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And different lengths can be rejected immediately, before any counting at all.",
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One tally rather than two, and one pass over each string. For lowercase English, that tally is a fixed array of twenty-six — genuinely constant space.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And if the labels were in Japanese? Then twenty-six is nowhere near enough.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then a hash map instead of an array, and the space becomes proportional to the distinct characters present. The follow-up in this problem asks exactly that, and it is a real consideration rather than a formality.",
        sfx: 'gong'
      }
    ],

    insight: 'Anagram is a multiset comparison — one shared tally incremented by the first string and decremented by the second ends at all zeros exactly when they match.',
    complexity: '<b>Time O(n)</b> with counting, or O(n log n) if you sort both. <b>Space O(k)</b> for the alphabet — constant for lowercase English, proportional to the distinct characters for Unicode.',
    pitfall: 'Forgetting the length check, which is both a free rejection and necessary if you only verify that no count goes negative. Also, order is irrelevant here — this is the exact opposite of the subsequence question.',
    solution: `def is_anagram(s, t):
    if len(s) != len(t):
        return False

    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    for ch in t:
        if ch not in counts or counts[ch] == 0:
            return False
        counts[ch] -= 1
    return True                     # equal lengths + nothing left over`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different cabinet, same tally: Nami groups a crate of labels into families where every family shares the same letters. What should the grouping key be?",
        options: [
          'A canonical form of each label — the sorted letters, or a tuple of the 26 counts',
          'The label\'s length',
          'The label\'s first letter',
          'A hash of the label itself'
        ],
        correct: 0,
        explain: 'That is Group Anagrams. The key must be identical for exactly the labels that belong together, which is what "canonical form" means. Length and first letter collide wildly; hashing the label itself makes every label its own family.',
        hint: 'Design the key so that "same key" means precisely "same family".'
      },
      {
        tag: 'TWEAK',
        q: "The check relaxes to: is t an anagram of some SUBSET of s? What changes?",
        options: [
          'Drop the equal-length requirement and only verify that no count goes negative while spending s\'s tally',
          'Nothing changes',
          'Sort both and compare prefixes',
          'It becomes a subsequence problem'
        ],
        correct: 0,
        explain: 'That is exactly Ransom Note. The equal-length check is what turns "can be built from" into "uses everything" — remove it and the same counting loop answers the containment question instead. One line separates the two problems.',
        hint: 'Which line in the anagram check enforces that nothing is left over?'
      },
      {
        tag: 'PITFALL',
        q: "Chopper removes the length check but keeps the \"never go negative\" loop. What does he wrongly accept?",
        options: [
          's = "aab", t = "ab" — nothing goes negative, but a letter is left unspent',
          's = "ab", t = "aab"',
          's = "rat", t = "car"',
          'Nothing; the loop is sufficient'
        ],
        correct: 0,
        explain: 'The loop only proves t\'s letters are available in s; it says nothing about leftovers. Equal length plus no shortfall together imply an exact match — which is why the cheap length check is load-bearing rather than decorative.',
        hint: 'What is left in the tally when t is shorter than s?'
      }
    ]
  };

  E['happy-number'] = {
    id: 'happy-number',
    epNumber: 115,
    title: 'The Fever That Either Breaks or Loops',
    arc: 'Drum Island',
    patternId: 'hashing-patterns',
    scene: 'vault',
    leetcode: { name: 'Happy Number', number: 202, difficulty: 'Easy', url: 'https://leetcode.com/problems/happy-number/' },
    problem: 'Repeatedly replace a number by the sum of the squares of its digits. It is happy if this eventually reaches 1; otherwise it loops forever. Determine whether a number is happy.',
    example: 'n = 19  →  1 + 81 = 82 → 64 + 4 = 68 → 36 + 64 = 100 → 1 + 0 + 0 = 1, so true',

    h: 200,
    props: [
      { id: 'n19', emoji: '🌡️', label: '19', x: 16, y: 32 },
      { id: 'n82', emoji: '🌡️', label: '82', x: 38, y: 32 },
      { id: 'n68', emoji: '🌡️', label: '68', x: 60, y: 32 },
      { id: 'n100', emoji: '🌡️', label: '100', x: 82, y: 32 },
      { id: 'one', emoji: '💚', label: '1', x: 94, y: 60 }
    ],
    ledger: [
      { id: 'SE', x: 50, y: 84 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "Kureha's fever chart: each reading becomes the sum of the squares of its digits. Some patients settle at one and recover. Some go round in circles forever.",
        p: { n19: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So run it and see. But if it loops, 'run it and see' never finishes.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "There are only two outcomes — reach one, or repeat a reading you have already had. Repeating means a cycle, and a cycle can never escape.",
        p: { SE: 'lit' }, l: { SE: 'remember every reading' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Nineteen gives eighty-two. Eighty-two gives sixty-eight. Sixty-eight gives one hundred. One hundred gives one. Recovered.",
        p: { n82: 'good', n68: 'good', n100: 'good', one: 'good' }, l: { SE: 'reached 1 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "A set of seen readings answers it. But look at the structure: each reading determines exactly one next reading. That is a linked list where the next pointer is a function.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Which means Floyd's tortoise and hare works — one reading advancing once per step, another advancing twice. If they ever meet, it's a loop.",
        p: { SE: 'good' }, l: { SE: 'or: fast & slow' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And that costs no memory at all, where the set costs whatever the cycle's length is. Same answer, constant space.",
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Why does it always terminate? Couldn't the readings grow forever?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "No — a three-digit number can produce at most two hundred and forty-three, so everything is quickly trapped below a small ceiling. Finitely many values means it must either hit one or repeat.",
        p: { n19: 'good' },
        sfx: 'gong'
      }
    ],

    insight: 'A process where each state determines exactly one successor is a linked list in disguise — so cycle detection applies, and Floyd\'s fast/slow walk answers it in constant space.',
    complexity: '<b>Time O(log n)</b> per digit-square step, with a bounded number of steps since values quickly fall below 243. <b>Space O(1)</b> with fast/slow pointers, or O(cycle length) with a seen set.',
    pitfall: 'Capping the iterations at an arbitrary number and hoping. The termination argument is that the values are bounded, so either 1 is reached or a value repeats — both are detectable exactly.',
    solution: `def is_happy(n):
    def step(x):
        total = 0
        while x:
            x, d = divmod(x, 10)
            total += d * d
        return total

    # Each value has exactly one successor, so this is a linked list:
    # Floyd's fast/slow walk detects the cycle in O(1) space.
    slow, fast = n, step(n)
    while fast != 1 and slow != fast:
        slow = step(slow)
        fast = step(step(fast))
    return fast == 1`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different chart, same shape: Franky applies a fixed transformation to a machine state, one successor per state, and wants to know whether it ever returns to a state it has been in. Which tool applies?",
        options: [
          'Floyd\'s fast/slow walk — one successor per state makes it a linked list, whatever the states actually are',
          'Binary search over the states',
          'A topological sort',
          'It requires storing every state'
        ],
        correct: 0,
        explain: 'The deterministic single-successor property is the whole requirement — the states can be numbers, strings, board positions, anything. Storing every state also works but costs memory proportional to the path; the two-pointer walk needs none.',
        hint: 'How many successors does each state have, and what structure does that describe?'
      },
      {
        tag: 'PITFALL',
        q: "Usopp writes <code>for _ in range(1000)</code> and returns whether the value reached 1. What is wrong with that?",
        options: [
          'It happens to work here but proves nothing — the bound is guessed rather than argued, and the same approach silently fails on a variant with a longer cycle',
          'It is too slow',
          'It returns the wrong answer on 19',
          'Nothing; a fixed bound is the standard solution'
        ],
        correct: 0,
        explain: 'Worth being precise: for this particular problem the values fall below 243 quickly, so a large fixed bound does produce right answers. But it is a guess dressed as an algorithm — an interviewer will ask why 1000, and "cycle detection" is the answer that survives the follow-up.',
        hint: 'Could you defend the number 1000 if asked where it came from?'
      },
      {
        tag: 'TWEAK',
        q: "The rule changes to summing the CUBES of the digits. Does the same method still work?",
        options: [
          'Yes — the values are still bounded, so it still either reaches a fixed point or cycles, and the same detection applies',
          'No, cubes grow without bound',
          'Yes, but only with a seen set',
          'No, cycle detection needs squares specifically'
        ],
        correct: 0,
        explain: 'A d-digit number is at least 10^(d-1) while its digit-cube sum is at most 729d, so beyond four digits the value must shrink — bounded again, so the same argument holds. The method depends on the boundedness, not on the exponent.',
        hint: 'Compare the size of a 5-digit number with the largest possible sum of five digit-cubes.'
      }
    ]
  };

  E['contains-duplicate-ii'] = {
    id: 'contains-duplicate-ii',
    epNumber: 116,
    title: 'The Same Symptom, Too Soon',
    arc: 'Drum Island',
    patternId: 'hashing-patterns',
    scene: 'vault',
    leetcode: { name: 'Contains Duplicate II', number: 219, difficulty: 'Easy', url: 'https://leetcode.com/problems/contains-duplicate-ii/' },
    problem: 'Given an array and an integer k, return true if there are two distinct indices i and j such that the values are equal and the indices differ by at most k.',
    example: 'nums = [1, 2, 3, 1], k = 3  →  true;    nums = [1, 2, 3, 1], k = 2  →  false',

    h: 200,
    props: [
      { id: 'v0', emoji: '🩺', label: '1', x: 20, y: 32 },
      { id: 'v1', emoji: '🩺', label: '2', x: 40, y: 32 },
      { id: 'v2', emoji: '🩺', label: '3', x: 60, y: 32 },
      { id: 'v3', emoji: '🩺', label: '1', x: 80, y: 32 }
    ],
    ledger: [
      { id: 'W', x: 50, y: 78 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "The same symptom twice is normal. The same symptom twice within three days is a relapse — and that we need to catch.",
        p: { v0: 'lit', v3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Compare every pair of days and check both the value and the gap? That's every pair again.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Two ways to do it in one pass. Either remember the last day each symptom appeared, and check the gap when it reappears — or keep a window of the last k days as a set.",
        p: { W: 'lit' }, l: { W: 'window of k days' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "The window version is neat. Slide forward, and whenever the window grows past k days, drop the oldest one out of the set.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then a duplicate INSIDE the set is automatically within k days — the distance check is built into what the set contains, rather than being a separate comparison.",
        p: { W: 'good' }, l: { W: 'in set → within k' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Day zero: symptom one, window holds one. Day one: two. Day two: three. With k of three the window still holds all of them, so day three's one is already there. Relapse.",
        p: { v0: 'good', v3: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And with k of two, day zero would have been dropped by then, so the same data gives no relapse.",
        p: { v0: 'dim' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The last-seen map does the same job and generalises better — replacing the position each time means you always compare against the NEAREST previous occurrence, which is the only one that can be close enough.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Keeping the nearest rather than the first. That's the detail I'd have got wrong.",
        sfx: 'gong'
      }
    ],

    insight: 'Bounding a window to size k turns a distance condition into plain membership — anything still in the set is by construction within range, so no gap arithmetic is needed at all.',
    complexity: '<b>Time O(n)</b> — one pass with constant-time set or map operations. <b>Space O(min(n, k))</b> for the window, or O(distinct values) for the last-seen map.',
    pitfall: 'Storing the FIRST index a value was seen at rather than the most recent. Only the nearest previous occurrence can satisfy the distance bound, so the map entry must be overwritten every time.',
    solution: `def contains_nearby_duplicate(nums, k):
    window = set()
    for i, x in enumerate(nums):
        if i > k:
            window.discard(nums[i - k - 1])   # drop what fell out of range
        if x in window:                       # still present => within k
            return True
        window.add(x)
    return False

    # Equivalent with a last-seen map:
    #   last = {}
    #   for i, x in enumerate(nums):
    #       if x in last and i - last[x] <= k:
    #           return True
    #       last[x] = i        # keep the NEAREST occurrence, not the first`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Using the last-seen map, Usopp writes <code>if x not in last: last[x] = i</code> — recording only the first occurrence. On nums = [1, 0, 1, 1] with k = 1, what does he report?",
        options: [
          'False, when the answer is true — indices 2 and 3 are adjacent, but he only ever compares against index 0',
          'True, correctly',
          'False, and that is correct',
          'It crashes'
        ],
        correct: 0,
        explain: 'Comparing against the first occurrence measures the largest possible gap. Only the nearest previous occurrence can be within k, so the map must always hold the most recent index — overwriting unconditionally is the fix and it is one character of difference.',
        hint: 'Which previous occurrence of a value gives the smallest gap to the current one?'
      },
      {
        tag: 'TRANSFER',
        q: "Different ward, same window: Nami must detect whether any two readings within 5 positions of each other differ by at most 3 in VALUE. Does a plain set still work?",
        options: [
          'No — the set answers equality only; near-equality needs an ordered structure over the window, such as a balanced BST or bucketing',
          'Yes, a set handles it unchanged',
          'Yes, with the window size increased to 8',
          'No, and it cannot be done better than O(n²)'
        ],
        correct: 0,
        explain: 'That is Contains Duplicate III, and the jump in difficulty is exactly that "equal" becomes "close". Hashing cannot answer proximity, so you need order within the window — the bucket trick divides values by (t+1) so that near-equal values land in the same or an adjacent bucket.',
        hint: 'Can a hash set tell you whether it contains anything within 3 of a given value?'
      },
      {
        tag: 'TWEAK',
        q: "k is larger than the array length. What does the window version do?",
        options: [
          'The window never evicts anything, so it degenerates to plain "contains any duplicate" — which is correct',
          'It crashes on a negative index',
          'It always returns False',
          'It must be special-cased'
        ],
        correct: 0,
        explain: 'The eviction is guarded by <code>i &gt; k</code>, which never fires, so every value stays in the window. That is the right behaviour: with an unbounded distance the question really is just "is there a duplicate at all". Degenerate parameter values are worth tracing rather than guarding blindly.',
        hint: 'Trace the eviction condition when k exceeds every index the loop reaches.'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
