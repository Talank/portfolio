/* Fish-Man Island — backtracking.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['letter-combinations'] = {
    id: 'letter-combinations',
    epNumber: 101,
    title: 'Every Name the Den Den Mushi Could Mean',
    arc: 'Fish-Man Island',
    patternId: 'backtracking',
    scene: 'forest',
    leetcode: { name: 'Letter Combinations of a Phone Number', number: 17, difficulty: 'Medium', url: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/' },
    problem: 'Given a string of digits from 2 to 9, return every letter combination the number could spell, using the standard telephone keypad mapping.',
    example: 'digits = "23"  →  ["ad","ae","af","bd","be","bf","cd","ce","cf"]',

    h: 210,
    props: [
      { id: 'd2', emoji: '2️⃣', label: 'a b c', x: 30, y: 30 },
      { id: 'd3', emoji: '3️⃣', label: 'd e f', x: 70, y: 30 },
      { id: 'pa', emoji: '✏️', label: 'path', x: 30, y: 64 },
      { id: 'ou', emoji: '📋', label: 'results', x: 70, y: 64 }
    ],
    ledger: [
      { id: 'C', x: 50, y: 88 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The transponder snail recorded a number, not a name. Each digit could be any of three letters, so we need every name it might have been.",
        p: { d2: 'lit', d3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Two digits, three letters each — nine names. Build them by choosing one letter for the first digit, then one for the second, and recording what you have when the digits run out.",
        p: { pa: 'lit', ou: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So it's a tree. From the top, three branches for a, b and c. Under each of those, three more for d, e and f.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And the shape is always the same three lines. Choose a letter and append it. Recurse to the next digit. Then REMOVE the letter — un-choose — so the next branch starts from a clean path.",
        p: { pa: 'good' }, l: { C: 'choose · recurse · un-choose' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Why does removing matter? Can't I just build a new string each time?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "You can, and with strings it is often cleaner — a new string per branch has no shared state to corrupt. But with a shared list or array, the un-choose is what stops one branch's choices leaking into its sibling's.",
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And when we reach the bottom, we record the path. But if we record the list itself rather than a COPY, every result points at the same list — and by the end it's empty.",
        p: { ou: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The single most common bug in this whole family. The path is one object, mutated all the way back up. Store a copy.",
        p: { ou: 'good' }, l: { C: 'store a COPY of the path' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And an empty recording? No digits at all?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then the answer is an empty list, not a list containing the empty string. Guard it at the top — the recursion would otherwise record one meaningless result.",
        sfx: 'gong'
      }
    ],

    insight: 'Choose, recurse, un-choose — and whatever you record at the leaf must be a copy, because the path is a single object that keeps mutating after you store it.',
    complexity: '<b>Time O(4ⁿ · n)</b> — up to four letters per digit, n digits, and O(n) to build each combination. <b>Space O(n)</b> for the recursion and path, beyond the output itself.',
    pitfall: 'Appending the shared path object to the results instead of a copy, which yields a list of identical (usually empty) entries. And returning <code>[""]</code> rather than <code>[]</code> for empty input.',
    solution: `def letter_combinations(digits):
    if not digits:
        return []                     # [] not [""] — no digits, no names

    keys = {'2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
            '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'}
    out = []
    path = []

    def walk(i):
        if i == len(digits):
            out.append(''.join(path))     # a COPY, not the path itself
            return
        for ch in keys[digits[i]]:
            path.append(ch)               # choose
            walk(i + 1)                   # recurse
            path.pop()                    # un-choose

    walk(0)
    return out`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper writes <code>out.append(path)</code> instead of joining or copying. After the search finishes on \"23\", what does out contain?",
        options: [
          'Nine references to the same list, which is empty by the end — every result identical',
          'Nine correct combinations',
          'One combination',
          'Nine lists, each with one letter'
        ],
        correct: 0,
        explain: 'The path is a single object that every un-choose pops from, so after the search unwinds it is empty — and all nine stored references point at it. The symptom is a results list of the right LENGTH full of wrong content, which is what makes it confusing to debug.',
        hint: 'How many separate list objects exist during the entire search?'
      },
      {
        tag: 'TRANSFER',
        q: "Different snail, same tree: Franky must list every way to pick one part from each of 4 bins holding 3, 5, 2 and 4 parts. How many results, and what is the recursion depth?",
        options: [
          '120 results, depth 4 — one level per bin, branching by that bin\'s size',
          '14 results, depth 4',
          '120 results, depth 120',
          '3⁴ = 81 results, depth 4'
        ],
        correct: 0,
        explain: '3 × 5 × 2 × 4 = 120, and the depth is the number of decisions, not the number of outcomes. Recognising that depth = decisions and breadth = options per decision is what lets you state the complexity of any backtracking problem on sight.',
        hint: 'Each bin is one decision. What does that make the depth, and what multiplies to give the count?'
      },
      {
        tag: 'TWEAK',
        q: "The task changes: return only the combinations that contain no two adjacent identical letters. Where does that check belong?",
        options: [
          'Inside the loop, before recursing — pruning at the choice point skips an entire subtree',
          'At the leaf, filtering the completed combinations',
          'After the search, filtering the results list',
          'It cannot be checked during the search'
        ],
        correct: 0,
        explain: 'All three produce the right answer; only one is efficient. Rejecting a letter before recursing removes every combination beginning with that prefix — an exponential subtree — while filtering at the leaf or afterwards pays for all of them first. Pruning early is the entire craft of backtracking.',
        hint: 'How many completed combinations hang below a choice you could have rejected immediately?'
      }
    ]
  };

  E['combinations'] = {
    id: 'combinations',
    epNumber: 102,
    title: 'Choosing the Landing Party',
    arc: 'Fish-Man Island',
    patternId: 'backtracking',
    scene: 'forest',
    leetcode: { name: 'Combinations', number: 77, difficulty: 'Medium', url: 'https://leetcode.com/problems/combinations/' },
    problem: 'Given two integers n and k, return all possible combinations of k numbers chosen from the range 1 to n.',
    example: 'n = 4, k = 2  →  [[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]',

    h: 210,
    props: [
      { id: 'm1', emoji: '🐟', label: '1', x: 20, y: 30 },
      { id: 'm2', emoji: '🐟', label: '2', x: 40, y: 30 },
      { id: 'm3', emoji: '🐟', label: '3', x: 60, y: 30 },
      { id: 'm4', emoji: '🐟', label: '4', x: 80, y: 30 }
    ],
    ledger: [
      { id: 'ST', x: 30, y: 74 },
      { id: 'PR', x: 70, y: 74 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Four candidates for the landing party, and we can take two. Every possible pair, listed once — and one-and-two is the same party as two-and-one.",
        p: { m1: 'lit', m2: 'lit', m3: 'lit', m4: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So order doesn't matter. How do I stop myself listing the same party twice in a different order?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Fix an order and never go backwards. Each level of the recursion is handed a starting point, and it may only choose from there onward. That single index makes duplicates impossible.",
        p: { ST: 'lit' }, l: { ST: 'start index' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Pick one, then the next level starts at two. Pick two, party complete: one and two. Un-choose, pick three: one and three. Then one and four.",
        p: { m1: 'good', m2: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then back up, start from two, and you get two-three and two-four. Then three-four. Six parties, none repeated — and we never even considered two-one.",
        p: { m3: 'good', m4: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "There's a smarter cut here, isn't there? Once I'm at candidate four with nobody chosen yet, there aren't enough people left to fill the party.",
        p: { PR: 'lit' }, l: { PR: 'prune: too few left' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Exactly. If the numbers remaining are fewer than the slots still to fill, that whole branch is dead. Bound the loop so it never starts a party it cannot finish.",
        p: { PR: 'good' }, l: { PR: 'i <= n - (k - len) + 1' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Which for large n and small k throws away a huge amount of pointless walking.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "And this is the difference between combinations and permutations, in one variable. A start index means order does not matter; a used-set means it does. Choose the wrong one and you are solving the wrong problem.",
        sfx: 'gong'
      }
    ],

    insight: 'A start index enforces "order does not matter" by construction — each level may only look forward, so no combination can ever be produced twice.',
    complexity: '<b>Time O(C(n, k) · k)</b> — one unit of work per combination produced, plus the copy. <b>Space O(k)</b> for the path and recursion, beyond the output.',
    pitfall: 'Looping from 1 every level, which produces permutations and duplicates. And skipping the pruning bound, which explores branches that provably cannot reach k elements.',
    solution: `def combine(n, k):
    out = []
    path = []

    def walk(start):
        if len(path) == k:
            out.append(path[:])          # copy, not the shared path
            return
        # Prune: stop where too few numbers remain to fill the party.
        for i in range(start, n - (k - len(path)) + 2):
            path.append(i)
            walk(i + 1)                  # forward only — no duplicates
            path.pop()

    walk(1)
    return out`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Chopper loops <code>for i in range(1, n+1)</code> at every level instead of from <code>start</code>. With n = 4 and k = 2, what does he produce?",
        options: [
          'All 16 ordered pairs including [1,1] and both [1,2] and [2,1] — permutations with repetition, not combinations',
          'The correct 6 combinations',
          '12 pairs, missing the diagonal',
          'Nothing; it recurses forever'
        ],
        correct: 0,
        explain: 'Without the forward-only bound, every level sees every candidate, so parties repeat in different orders and members can be chosen twice. The start index is not an optimisation — it is the thing that defines the problem as combinations.',
        hint: 'At the second level, which candidates can he choose from?'
      },
      {
        tag: 'TRANSFER',
        q: "Different party, same index: Nami must list every SUBSET of 4 crew members, of any size. What changes from the k-sized version?",
        options: [
          'Record the path at every node rather than only when it reaches size k, and drop the size check',
          'Run the k-version once for each k and concatenate',
          'Use a used-set instead of a start index',
          'Nothing changes'
        ],
        correct: 0,
        explain: 'Subsets are combinations of every size at once, so every node of the same tree is a valid answer. Running the k-version k+1 times also works and is a fine observation, but it rebuilds the same tree repeatedly — the one-pass version is strictly better and is the standard Subsets solution.',
        hint: 'In the combinations tree, what is sitting at every internal node?'
      },
      {
        tag: 'TWEAK',
        q: "n = 20 and k = 2. Roughly how much does the pruning bound save?",
        options: [
          'Very little — with k = 2 almost every branch can still be completed, so few are prunable',
          'It halves the work',
          'It removes exponentially many branches',
          'It makes the algorithm polynomial'
        ],
        correct: 0,
        explain: 'Pruning bites when k is close to n, where most branches run out of candidates. With k = 2 out of 20, only the last candidate is ever prunable. Being honest about when an optimisation does nothing is as useful as knowing it exists — this one matters for k = 18, not k = 2.',
        hint: 'The bound rejects branches with too few numbers left. How often is that true when only 2 are needed?'
      }
    ]
  };

  E['generate-parentheses'] = {
    id: 'generate-parentheses',
    epNumber: 103,
    title: 'The Bubbles That Must Not Burst',
    arc: 'Fish-Man Island',
    patternId: 'backtracking',
    scene: 'forest',
    leetcode: { name: 'Generate Parentheses', number: 22, difficulty: 'Medium', url: 'https://leetcode.com/problems/generate-parentheses/' },
    problem: 'Given n pairs of parentheses, generate all combinations of well-formed parentheses.',
    example: 'n = 3  →  ["((()))","(()())","(())()","()(())","()()()"]',

    h: 210,
    props: [
      { id: 'ob', emoji: '🫧', label: 'open used', x: 28, y: 32 },
      { id: 'cb', emoji: '💥', label: 'close used', x: 72, y: 32 },
      { id: 'rule', emoji: '📏', label: 'close ≤ open', x: 50, y: 64 }
    ],
    ledger: [
      { id: 'N', x: 50, y: 88 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "Three coating bubbles, each needing an opening and a closing seal — and a bubble can never be closed before it has been opened, or it bursts.",
        p: { ob: 'lit', cb: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Generate every arrangement of three opens and three closes, then throw away the invalid ones? That's twenty arrangements to get five.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Never generate what you will only discard. Build left to right and refuse illegal moves at the moment of choosing, so no invalid arrangement is ever begun.",
        p: { rule: 'lit' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So when may I place an opening seal?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Whenever fewer than n have been used. And a closing seal only when the closes used so far are strictly fewer than the opens — that is what guarantees nothing closes before it opened.",
        p: { rule: 'good' }, l: { N: 'open < n · close < open' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Two counters, two conditions, and every leaf is valid by construction. No filtering at all.",
        p: { ob: 'good', cb: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is a general lesson: encoding the constraint in the choice is almost always better than generating freely and testing afterwards. The saving grows with n.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And we stop when the string reaches twice n. At that point both counters must be n — there's no way to arrive there otherwise.",
        p: { N: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "The count of results is the Catalan numbers, isn't it. One, two, five, fourteen, forty-two.",
        sfx: 'gong'
      }
    ],

    insight: 'Encode the constraint in the choice rather than filtering afterwards — an opening is legal while fewer than n are used, a closing while it would not outnumber the openings, so every leaf is valid by construction.',
    complexity: '<b>Time O(4ⁿ / √n)</b> — the nth Catalan number, times O(n) to build each string. <b>Space O(n)</b> for the recursion depth. Generate-and-filter is O(2^(2n)) and wastes most of it.',
    pitfall: 'Generating all arrangements and validating them, which explores far more than necessary. And allowing a closing seal when closes equal opens, which produces strings like <code>"()) ("</code>.',
    solution: `def generate_parenthesis(n):
    out = []
    path = []

    def walk(opened, closed):
        if len(path) == 2 * n:
            out.append(''.join(path))
            return
        if opened < n:                 # room for another opening
            path.append('(')
            walk(opened + 1, closed)
            path.pop()
        if closed < opened:            # never close what was not opened
            path.append(')')
            walk(opened, closed + 1)
            path.pop()

    walk(0, 0)
    return out`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp writes the closing condition as <code>closed &lt;= opened</code>. What is the first invalid string this lets through for n = 1?",
        options: [
          '")(" — a closing seal placed before anything was opened',
          '"((", with no closes',
          '"()", which is valid',
          'Nothing invalid; the condition is equivalent'
        ],
        correct: 0,
        explain: 'At the very start both counters are 0, so <code>closed &lt;= opened</code> is true and a closing bracket is placed with nothing open. The strict <code>&lt;</code> is what encodes "there is an unmatched opening to close" — one character carrying the entire well-formedness rule.',
        hint: 'Evaluate the condition at the very first step, when both counters are zero.'
      },
      {
        tag: 'TRANSFER',
        q: "Different seal, same counters: Franky generates every valid sequence of n pushes and n pops on a stack. What are the two rules?",
        options: [
          'A push is legal while fewer than n have been made; a pop is legal while pops are strictly fewer than pushes',
          'A push is always legal; a pop is legal while the stack is non-empty at the end',
          'Both are legal whenever fewer than n of each have been used',
          'Only sequences of alternating push and pop are valid'
        ],
        correct: 0,
        explain: 'It is literally the same problem — an opening bracket is a push and a closing one is a pop, and "never pop an empty stack" is "never close an unopened bracket". Recognising that identity means one solution covers both, and it explains why the count is Catalan in each case.',
        hint: 'What does an opening bracket correspond to on a stack?'
      },
      {
        tag: 'TWEAK',
        q: "Now there are two bracket types, () and [], and both must be well-formed and properly nested. Do two counters still suffice?",
        options: [
          'No — you must track the actual nesting order, so the path needs a stack of which type is open',
          'Yes, with four counters',
          'Yes, two counters per type',
          'Yes, unchanged'
        ],
        correct: 0,
        explain: 'Counters can only prove quantities match; with two types the closing bracket must match the most recent unclosed OPENING, which is an order requirement. That is exactly the lesson from Valid Parentheses — counts are enough for one type and never enough for two.',
        hint: 'Could four counters distinguish "([)]" from "([])"?'
      }
    ]
  };

  E['word-search'] = {
    id: 'word-search',
    epNumber: 104,
    title: 'The Name Carved Through the Coral',
    arc: 'Fish-Man Island',
    patternId: 'backtracking',
    scene: 'forest',
    leetcode: { name: 'Word Search', number: 79, difficulty: 'Medium', url: 'https://leetcode.com/problems/word-search/' },
    problem: 'Given an m x n grid of letters and a word, return true if the word can be spelled by walking through adjacent cells (up, down, left, right) without reusing a cell.',
    example: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"  →  true',

    h: 210,
    props: [
      { id: 'r1', emoji: '🪸', label: 'A B C E', x: 50, y: 22 },
      { id: 'r2', emoji: '🪸', label: 'S F C S', x: 50, y: 44 },
      { id: 'r3', emoji: '🪸', label: 'A D E E', x: 50, y: 66 }
    ],
    ledger: [
      { id: 'W', x: 22, y: 88 },
      { id: 'U', x: 74, y: 88 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "The name is carved through the coral, letter by letter, turning corners — but never crossing itself. Is 'ABCCED' really in there?",
        p: { r1: 'lit', r2: 'lit', r3: 'lit' }, l: { W: 'ABCCED' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Try every cell as a possible first letter. From a matching cell, walk to each of the four neighbours looking for the next letter, and so on.",
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And 'never crossing itself' means marking cells as used. But used only along the CURRENT path — a cell blocked by one attempt has to be free for the next.",
        p: { U: 'lit' }, l: { U: 'mark · walk · unmark' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So the mark goes on when you step in, and comes off when you step out — success or failure. Choose, recurse, un-choose, exactly as always.",
        p: { U: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "A at the top-left. B to its right. C next. Then C below. Then E, then D. All six letters, none reused.",
        p: { r1: 'good', r2: 'good', r3: 'good' }, l: { W: 'ABCCED ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The cheapest saving is to check the letter BEFORE recursing, not after arriving. Rejecting a neighbour without a function call removes four branches at every level.",
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Is there a way to bail out early on a hopeless word?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Count the letters on the board first. If the word needs three 'Z's and the board holds two, you can answer before searching at all. And if the word's last letter is rarer than its first, search it backwards.",
        p: { r2: 'dim' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Both of those are cheap checks that can save an enormous search. I like that they cost almost nothing to add.",
        sfx: 'gong'
      }
    ],

    insight: 'The visited mark belongs to the current path, not to the search — set it on the way in and clear it on the way out, or a dead end leaves cells permanently blocked.',
    complexity: '<b>Time O(m · n · 4^L)</b> in the worst case for a word of length L, though pruning makes real inputs far cheaper. <b>Space O(L)</b> for the recursion, plus O(1) if you mark in place.',
    pitfall: 'Clearing the visited mark only on success, which blocks cells for every later path. And forgetting that the same letter may be reachable from several directions, so an early match does not mean the rest of the word follows.',
    solution: `def exist(board, word):
    rows, cols = len(board), len(board[0])

    def walk(r, c, i):
        if i == len(word):
            return True
        if not (0 <= r < rows and 0 <= c < cols) or board[r][c] != word[i]:
            return False

        board[r][c] = '#'                    # choose: mark this path's cell
        found = (walk(r + 1, c, i + 1) or walk(r - 1, c, i + 1) or
                 walk(r, c + 1, i + 1) or walk(r, c - 1, i + 1))
        board[r][c] = word[i]                # un-choose, on failure AND success

        return found

    return any(walk(r, c, 0) for r in range(rows) for c in range(cols))`,

    quiz: [
      {
        tag: 'PITFALL',
        q: "Usopp restores the board cell only when the recursion returns True. What is the symptom?",
        options: [
          'Cells consumed by failed paths stay blocked, so the search reports False for words that are genuinely present',
          'The search reports True too often',
          'It crashes with an index error',
          'It loops forever'
        ],
        correct: 0,
        explain: 'A failing branch leaves a trail of permanently marked cells, and every later attempt has to route around them. The failure is silent and input-dependent — the word is there, the search simply cannot see it any more.',
        hint: 'What does a dead-end path leave behind for the next attempt through the same region?'
      },
      {
        tag: 'TWEAK',
        q: "Chopper must now find 5,000 different words in the same board. What changes?",
        options: [
          'Put the words in a trie and run ONE search that carries them all, pruning on dead prefixes',
          'Run this search 5,000 times, once per word',
          'Sort the words and binary search',
          'Precompute every path in the board'
        ],
        correct: 0,
        explain: 'That is Word Search II. Per-word searching repeats the same grid walks for every word sharing a prefix; a trie lets one walk carry all of them and abandon a whole family at once. The 5,000 in the question is the signal — many queries against one fixed structure means preprocess the queries.',
        hint: 'What do "cat", "car" and "card" have in common while you are walking the board?'
      },
      {
        tag: 'TRANSFER',
        q: "Different maze, same marking: Nami counts the number of distinct PATHS from one corner of a grid to another, avoiding walls, with no cell reused. Why can she not memoise on the cell alone?",
        options: [
          'The count from a cell depends on which cells are already used, so the state is the cell plus the whole visited set',
          'Because the grid has walls',
          'Because paths may be of different lengths',
          'She can — memoising on the cell is valid here'
        ],
        correct: 0,
        explain: 'A useful boundary. Memoisation needs the subproblem to be fully described by its key, and with a no-reuse constraint the visited set is part of the state — which is why these problems stay exponential and why the bitmask version only works on tiny grids.',
        hint: 'Is the number of onward paths from a cell the same regardless of how you arrived there?'
      }
    ]
  };

  E['n-queens-ii'] = {
    id: 'n-queens-ii',
    epNumber: 105,
    title: 'The Sea Kings That Cannot See Each Other',
    arc: 'Fish-Man Island',
    patternId: 'backtracking',
    scene: 'forest',
    leetcode: { name: 'N-Queens II', number: 52, difficulty: 'Hard', url: 'https://leetcode.com/problems/n-queens-ii/' },
    problem: 'Return the number of distinct ways to place n queens on an n x n chessboard so that no two attack each other.',
    example: 'n = 4  →  2 distinct solutions',

    h: 210,
    props: [
      { id: 'cq', emoji: '👑', label: 'columns', x: 22, y: 32 },
      { id: 'd1', emoji: '↘️', label: 'r - c', x: 50, y: 32 },
      { id: 'd2', emoji: '↙️', label: 'r + c', x: 78, y: 32 }
    ],
    ledger: [
      { id: 'CNT', x: 50, y: 76 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "One Sea King per row of the trench, and no two may ever be in line of sight — not along a row, not down a column, not along either diagonal.",
        p: { cq: 'lit', d1: 'lit', d2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One per row is forced, so the recursion is by row: place a queen somewhere in row zero, then row one, and so on. Rows can never conflict, which removes a third of the checking immediately.",
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Columns are easy — a set of the columns already taken. But how do you check a diagonal quickly? Scanning the board every time would be slow.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Look at what stays constant along one. Going down-right, the row and column both increase, so their DIFFERENCE never changes. Going down-left, one rises as the other falls, so their SUM never changes.",
        p: { d1: 'good', d2: 'good' }, l: { CNT: 'r-c and r+c identify diagonals' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So three sets — columns, differences, sums — and every safety check is three constant-time lookups.",
        p: { cq: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then it is choose, recurse, un-choose over the columns of each row. Add to all three sets, descend, remove from all three.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And when a queen reaches the last row, that's one complete arrangement. We're only counting, so we don't even need to store the board.",
        p: { CNT: 'good' }, l: { CNT: 'n = 4 → 2 ways ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Why does making the check fast matter so much? It's only three lookups either way.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Because a fast check is what lets you reject a placement immediately, and every rejection at row two removes an entire subtree of arrangements below it. In an exponential search, where you cut matters far more than how quickly you loop.",
        sfx: 'gong'
      }
    ],

    insight: 'Along a ↘ diagonal the value r − c is constant; along a ↙ diagonal r + c is. Three sets make every safety check O(1), which is what makes the pruning worth doing at all.',
    complexity: '<b>Time O(n!)</b> in the worst case, heavily reduced by pruning. <b>Space O(n)</b> for the three sets and the recursion. The bitmask version replaces the sets with three integers and is markedly faster in practice.',
    pitfall: 'Scanning the board to test safety, which turns an O(1) check into O(n) and multiplies the whole exponential search. Also, both diagonal keys must be removed on the un-choose, not just the column.',
    solution: `def total_n_queens(n):
    cols, diag, anti = set(), set(), set()
    count = 0

    def place(row):
        nonlocal count
        if row == n:
            count += 1                  # a complete arrangement
            return
        for c in range(n):
            if c in cols or (row - c) in diag or (row + c) in anti:
                continue                # rejected in O(1) — prune the subtree
            cols.add(c); diag.add(row - c); anti.add(row + c)
            place(row + 1)
            cols.remove(c); diag.remove(row - c); anti.remove(row + c)

    place(0)
    return count`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different trench: Franky places rooks (which attack only along rows and columns) on an n x n board, one per row, none attacking. How many arrangements, and what is the search?",
        options: [
          'n! — it degenerates to counting permutations of the columns, with no diagonal constraint to prune',
          'The same as N-Queens',
          '2ⁿ',
          'n², since each rook has n² choices'
        ],
        correct: 0,
        explain: 'Dropping the diagonals removes the only constraint that ever fails late, so every partial placement extends — the count is exactly the number of column permutations. It is a nice illustration of what the diagonal sets are actually buying: the pruning, not the correctness.',
        hint: 'Without diagonals, can a partial placement of k rooks ever fail to be extendable?'
      },
      {
        tag: 'PITFALL',
        q: "Chopper removes the column from its set on the un-choose but forgets the two diagonal keys. What happens?",
        options: [
          'Diagonals stay permanently blocked, so the search finds far too few arrangements',
          'It counts too many arrangements',
          'It crashes on a missing key',
          'Nothing; the diagonal sets are rebuilt each row'
        ],
        correct: 0,
        explain: 'Every explored branch leaves its diagonals marked forever, so later branches are rejected for conflicts with queens that are no longer placed. The un-choose must undo every part of the choose — the same discipline as restoring a board cell in Word Search.',
        hint: 'What must be true of the three sets when a branch returns?'
      },
      {
        tag: 'TWEAK',
        q: "The interviewer asks for the fastest practical version. What replaces the three sets?",
        options: [
          'Three integers used as bitmasks, with the available columns computed by bit tricks and the lowest set bit picked off each iteration',
          'A hash map from row to column',
          'Memoisation on the row number',
          'Sorting the columns before each row'
        ],
        correct: 0,
        explain: 'Bitmasks make each check a single AND and each iteration an <code>x & -x</code> to grab the lowest available column — the standard fast N-Queens. Memoising on the row is meaningless, since the row alone does not describe the state; the placed set does.',
        hint: 'The three sets each hold a subset of a small range. What data type represents that in one register?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
