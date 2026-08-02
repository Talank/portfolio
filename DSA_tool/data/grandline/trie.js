/* Marineford — the trie arc.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['word-search-ii'] = {
    id: 'word-search-ii',
    epNumber: 64,
    title: 'Every Name on the Execution Roll',
    arc: 'Marineford',
    patternId: 'trie',
    scene: 'forest',
    leetcode: { name: 'Word Search II', number: 212, difficulty: 'Hard', url: 'https://leetcode.com/problems/word-search-ii/' },
    problem: 'Given an m x n grid of letters and a list of words, return every word that can be spelled by walking through adjacent cells (up, down, left, right) without reusing a cell within one word.',
    example: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]  →  ["oath","eat"]',

    h: 220,
    props: [
      { id: 'g0', emoji: '🔤', label: 'o a a n', x: 50, y: 16 },
      { id: 'g1', emoji: '🔤', label: 'e t a e', x: 50, y: 36 },
      { id: 'g2', emoji: '🔤', label: 'i h k r', x: 50, y: 56 },
      { id: 'w0', emoji: '📜', label: 'oath', x: 14, y: 82 },
      { id: 'w1', emoji: '📜', label: 'pea', x: 38, y: 82 },
      { id: 'w2', emoji: '📜', label: 'eat', x: 62, y: 82 },
      { id: 'w3', emoji: '📜', label: 'rain', x: 86, y: 82 }
    ],
    ledger: [
      { id: 'Lt', x: 20, y: 66 },
      { id: 'Lf', x: 80, y: 66 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "The execution roll is a grid of letters, and Marine headquarters has a list of names it wants found in it. A name is spelled by walking cell to cell — up, down, left, right — never standing on the same cell twice within one name.",
        p: { g0: 'lit', g1: 'lit', g2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Easy. Take the first name, search the whole grid for it. Then the second name, search the whole grid again. Then the third...",
        p: { w0: 'lit' },
        sfx: null
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "There are three thousand names on that roll. You'd walk the same grid three thousand times, and every walk starts by exploring the same dead ends.",
        p: { w1: 'dim', w2: 'dim', w3: 'dim' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So carry all the names at once. Stack them into a prefix tree — every name that starts with the same letters shares the same branch, right up to the point where they diverge.",
        p: { Lt: 'lit' }, l: { Lt: 'trie of names' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Now one walk of the grid carries every name simultaneously. From each cell I step to a neighbour and ask the tree a single question: is anything still spelled this way?",
        sfx: null
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "And the instant the answer is no, I stop. Not one name abandoned — every name that begins with those letters, all at once. That's the cut.",
        p: { w1: 'bad' }, l: { Lf: 'prune here' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Walking from the top-left 'o': o-a is still alive, o-a-t is still alive, o-a-t-h — and this node is marked as the end of a name. Found one.",
        p: { g0: 'good', w0: 'good' }, l: { Lf: 'oath ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "But 'p' isn't anywhere in the grid at all, so 'pea' dies on the very first letter. We never walk a single step for it.",
        p: { w1: 'dim' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One more discipline. When we step onto a cell we must mark it used, and when we step back off it we must UNMARK it — otherwise a cell consumed by one path stays blocked for every other path forever.",
        sfx: 'chime'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "Choose, walk, un-choose. Same as any search that has to try more than one road out of the same crossroads.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "One last thing — 'eat' is spelled twice in that grid. We shouldn't hand headquarters the same name twice.",
        p: { w2: 'good' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So when a name is found, we clear its end-marker in the tree. It can never be reported again — and as a bonus, branches that no longer lead anywhere can be pruned away entirely, which makes the rest of the search faster still.",
        p: { Lt: 'good', Lf: 'good' }, l: { Lt: 'prune found', Lf: 'oath, eat ✓' },
        sfx: 'victory'
      }
    ],

    insight: 'When one search must test many strings at once, put the strings in a trie: a single walk carries all of them, and a dead prefix prunes every word that shares it in one move.',
    complexity: '<b>Time O(m·n·4^L)</b> in the worst case, where L is the longest word — but the trie prunes so aggressively that real inputs are nowhere near it. Building the trie is O(total characters). <b>Space O(total characters)</b> for the trie plus O(L) recursion.',
    pitfall: 'Forgetting to un-mark a visited cell on the way back out, which silently blocks every other path through it. Second: reporting a word every time it is spelled — clear the end-marker on the trie node once found, so duplicates are impossible.',
    solution: `def find_words(board, words):
    # Build the trie. Each node maps a letter to a child; "word" on a node
    # holds the complete word when a word ends exactly there.
    trie = {}
    for w in words:
        node = trie
        for ch in w:
            node = node.setdefault(ch, {})
        node['word'] = w

    rows, cols = len(board), len(board[0])
    found = []

    def walk(r, c, node):
        ch = board[r][c]
        nxt = node.get(ch)
        if nxt is None:          # no word continues this way — prune the branch
            return
        word = nxt.pop('word', None)
        if word:                 # pop, so the same word is never reported twice
            found.append(word)

        board[r][c] = '#'        # choose: mark the cell used
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != '#':
                walk(nr, nc, nxt)
        board[r][c] = ch         # un-choose: hand the cell back

        if not nxt:              # nothing left below — drop the dead branch
            node.pop(ch)

    for r in range(rows):
        for c in range(cols):
            walk(r, c, trie)
    return found`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different hunt, same structure: Nami must find which of 40,000 island names appear in a long stream of intercepted Morse text, and she may only pass over the stream once. Why is a trie of the island names better than a hash set of them?",
        options: [
          'The trie can extend a partial match one character at a time and abandon it the moment no name continues that way',
          'A hash set cannot store 40,000 strings',
          'The trie makes exact lookup asymptotically faster than hashing',
          'The trie removes the need to read the whole stream'
        ],
        correct: 0,
        explain: 'A hash set answers "is this complete string a name?" and nothing else — with a stream you would have to try every substring. A trie tracks live partial matches and kills them on the first impossible character, which is the same pruning that carries the grid search. Exact lookup in a set is O(L) too; the trie wins on prefixes, not on lookup.',
        hint: 'The stream gives you characters one at a time. What question do you need to ask after each one?'
      },
      {
        tag: 'TWEAK',
        q: "Headquarters relaxes the rule: a name may now reuse the same cell as often as it likes. What must change in the search?",
        options: [
          'Drop the visited marking — but add a depth cap, since the walk can now loop forever',
          'Nothing; the algorithm already handles it',
          'Replace the trie with a hash set of the words',
          'Switch from DFS to BFS'
        ],
        correct: 0,
        explain: 'The visited marks exist purely to enforce "no cell twice". Removing them lets the walk bounce between two adjacent cells indefinitely, so the bound has to come from somewhere else — here the length of the longest word in the trie, which caps the depth naturally.',
        hint: 'What stopped the search from walking back and forth between two cells forever?'
      },
      {
        tag: 'PITFALL',
        q: "Zoro writes the search but restores the board cell only when a word is found, not on every return. What breaks?",
        options: [
          'Cells consumed by a failed path stay blocked, so later paths cannot use them and real words go unfound',
          'The same word gets reported many times',
          'The trie is corrupted',
          'Nothing — failed paths do not matter'
        ],
        correct: 0,
        explain: 'The un-choose has to happen on every exit from a cell, success or failure, because the cell belongs to the current path and not to the search as a whole. Restoring only on success leaves a trail of permanently blocked cells behind every dead end — and it fails silently, returning too few words rather than crashing.',
        hint: 'What state does a dead-end path leave behind for the next path that comes through?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
