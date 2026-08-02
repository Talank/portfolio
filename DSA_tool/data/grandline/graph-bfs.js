/* Impel Down — breadth-first search on graphs.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['snakes-and-ladders'] = {
    id: 'snakes-and-ladders',
    epNumber: 74,
    title: 'The Six Levels and the Chutes Between Them',
    arc: 'Impel Down',
    patternId: 'graphs-bfs-dfs-topo-union',
    scene: 'night',
    leetcode: { name: 'Snakes and Ladders', number: 909, difficulty: 'Medium', url: 'https://leetcode.com/problems/snakes-and-ladders/' },
    problem: 'On an n x n board numbered in boustrophedon order, each move rolls 1 to 6 forward. Some squares carry you instantly to another square. Return the fewest moves to reach the last square, or -1 if it cannot be reached.',
    example: 'A 6x6 board with two chutes  →  answer: 4  (the fewest rolls that reach square 36)',

    h: 210,
    props: [
      { id: 'q1', emoji: '🚪', label: '1', x: 12, y: 34 },
      { id: 'q2', emoji: '🪜', label: '+13', x: 32, y: 34 },
      { id: 'q3', emoji: '🚪', label: '15', x: 52, y: 34 },
      { id: 'q4', emoji: '🐍', label: '-9', x: 72, y: 34 },
      { id: 'q5', emoji: '🏁', label: '36', x: 92, y: 34 }
    ],
    ledger: [
      { id: 'D0', x: 20, y: 78 },
      { id: 'D1', x: 50, y: 78 },
      { id: 'D2', x: 80, y: 78 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "Six levels of Impel Down, and the stairs between them don't run straight. Some cells have chutes that dump you two levels down; some have ladders that shoot you up. From any cell you can move one to six steps along the corridor.",
        p: { q2: 'lit', q4: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "We need the FEWEST moves to reach Ace. Not any route — the shortest one.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then stop thinking about a board and start thinking about a graph. Every square is a place; a roll of one through six is six edges leaving it; a chute or ladder just means the edge lands somewhere other than where you counted to.",
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And every roll costs the same — one move. So all the edges weigh the same.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is exactly when breadth-first search is the shortest-path algorithm. It finishes an entire ring of squares reachable in one move before it touches anything needing two. So the first time we arrive anywhere, we have arrived by the shortest route.",
        p: { D0: 'lit', D1: 'lit', D2: 'lit' }, l: { D0: 'ring 1', D1: 'ring 2', D2: 'ring 3' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "From square one, we can roll to squares two through seven. Square two has a ladder to fifteen, so rolling a one actually puts us on fifteen.",
        p: { q1: 'good', q2: 'good', q3: 'good' }, l: { D0: 'reach 15' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Careful with the chute rule though. When a square carries you elsewhere, you take the destination and you do NOT then take that destination's own chute. One transport per landing.",
        p: { q4: 'bad' },
        sfx: 'error'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And we mark a square as visited the moment we put it in the queue — not when we take it out.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That is the difference between a working search and one that grinds. Six rolls per square means a square can be queued six times over before it is ever processed. Mark on entry and each square enters exactly once.",
        p: { q4: 'dim' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Four rings out, we touch the final square. Four moves. And if the queue empties without ever reaching it — then there's no way down at all, and the answer is minus one.",
        p: { q5: 'good' }, l: { D2: 'reached in 4 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The whole difficulty of this one is the board's numbering — it snakes back and forth, so turning a square number into a row and column takes a moment's care. Get that helper right on paper and the search itself is textbook.",
        sfx: 'gong'
      }
    ],

    insight: 'BFS is the shortest-path algorithm exactly when every edge costs the same — it settles one whole ring of distance before starting the next, so the first arrival at any node is optimal.',
    complexity: '<b>Time O(n²)</b> — every square visited once, six edges each. <b>Space O(n²)</b> for the queue and the visited set. Dijkstra would also be correct here but is pure overhead when all edges weigh one.',
    pitfall: 'Chaining transports — if a ladder lands you on a snake, you do not take the snake. And marking visited on dequeue instead of enqueue, which lets a square be queued once per incoming roll.',
    solution: `from collections import deque

def snakes_and_ladders(board):
    n = len(board)

    def square_to_cell(num):
        # The board snakes: rows alternate direction, numbered from the bottom.
        quot, rem = divmod(num - 1, n)
        row = n - 1 - quot
        col = rem if quot % 2 == 0 else n - 1 - rem
        return row, col

    target = n * n
    seen = {1}
    q = deque([(1, 0)])                   # (square, moves so far)
    while q:
        square, moves = q.popleft()
        for roll in range(1, 7):
            nxt = square + roll
            if nxt > target:
                break
            r, c = square_to_cell(nxt)
            if board[r][c] != -1:
                nxt = board[r][c]          # one transport only — never chained
            if nxt == target:
                return moves + 1
            if nxt not in seen:
                seen.add(nxt)              # mark on ENQUEUE, not on dequeue
                q.append((nxt, moves + 1))
    return -1`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different prison, same search: Sanji must cross a kitchen where each tile lets him step to any of 4 neighbours, all steps costing the same, and he wants the fewest steps to the pantry. Which algorithm, and why not the others?",
        options: [
          'BFS — uniform edge cost means the first arrival is the shortest, and Dijkstra would only add a priority queue for nothing',
          'DFS, because it reaches the pantry fastest',
          'Dijkstra, because any shortest-path problem requires it',
          'A greedy walk toward the pantry'
        ],
        correct: 0,
        explain: 'DFS finds a path but not the shortest. Dijkstra is correct but degenerates to BFS with extra log-factor overhead when every edge weighs the same — saying that out loud is worth marks. A greedy walk can wander into a dead end with no way to recover.',
        hint: 'What does BFS guarantee that DFS does not, and what does Dijkstra buy you here?'
      },
      {
        tag: 'TWEAK',
        q: "The corridors are re-rated: some now cost 1 move and others cost 5. Does BFS still find the cheapest route?",
        options: [
          'No — the ring invariant only holds when every edge costs the same; use Dijkstra with a priority queue',
          'Yes, BFS handles any positive weights',
          'Yes, if you run it once per weight value',
          'No, and the problem becomes unsolvable'
        ],
        correct: 0,
        explain: 'BFS settles nodes in the order they are reached, which equals cheapest only when reaching-order equals cost-order — that is exactly the uniform-weight assumption. With mixed positive weights it is Dijkstra; with negative weights, Bellman-Ford. (The special case of weights 0 and 1 has a neat deque trick.)',
        hint: 'Which assumption of BFS does a single expensive edge violate?'
      },
      {
        tag: 'PITFALL',
        q: "Chopper marks a square visited when he POPS it rather than when he pushes it. What actually goes wrong?",
        options: [
          'The same square is queued once per incoming roll, so the queue bloats and work is repeated',
          'The answer becomes too small',
          'The search never terminates on any input',
          'Nothing — both are equivalent'
        ],
        correct: 0,
        explain: 'Between being pushed and being popped, a square can be discovered again by several other squares, each pushing another copy. The distances recorded are still correct for the first pop, but the queue can grow far beyond the node count. Marking on enqueue keeps each node in the structure at most once.',
        hint: 'How many neighbours can push the same square before it is ever processed?'
      }
    ]
  };

  E['minimum-genetic-mutation'] = {
    id: 'minimum-genetic-mutation',
    epNumber: 75,
    title: 'One Letter at a Time',
    arc: 'Impel Down',
    patternId: 'graphs-bfs-dfs-topo-union',
    scene: 'night',
    leetcode: { name: 'Minimum Genetic Mutation', number: 433, difficulty: 'Medium', url: 'https://leetcode.com/problems/minimum-genetic-mutation/' },
    problem: 'Given a start gene, an end gene and a bank of valid genes, each 8 characters from {A, C, G, T}, return the fewest single-character mutations to get from start to end, where every intermediate gene must be in the bank. Return -1 if impossible.',
    example: 'start = "AACCGGTT", end = "AAACGGTA", bank = ["AACCGGTA","AACCGCTA","AAACGGTA"]  →  answer: 2',

    h: 210,
    props: [
      { id: 'g0', emoji: '🧬', label: 'AACCGGTT', x: 16, y: 30 },
      { id: 'g1', emoji: '🧬', label: 'AACCGGTA', x: 50, y: 30 },
      { id: 'g2', emoji: '🧬', label: 'AAACGGTA', x: 84, y: 30 },
      { id: 'g3', emoji: '🧬', label: 'AACCGCTA', x: 50, y: 62 }
    ],
    ledger: [
      { id: 'S0', x: 16, y: 84 },
      { id: 'S1', x: 50, y: 84 },
      { id: 'S2', x: 84, y: 84 }
    ],

    steps: [
      {
        speaker: 'chopper', pos: 'right',
        line: "Vegapunk's serum has to be transformed one letter at a time — and every single intermediate form has to be a gene the bank recognises. Anything else and it destabilises.",
        p: { g0: 'lit', g2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "This is a maze again, isn't it. It just doesn't look like one because there's no map.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Exactly. Genes are the places; a single-letter change to another valid gene is a corridor. Every mutation costs the same, so it is breadth-first search once more.",
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "But how do I find the neighbours of a gene? Compare it against everything in the bank and keep the ones differing by one letter?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That is one way, and with a small bank it is perfectly reasonable. But there is a better one: generate the neighbours instead of searching for them. Eight positions, four letters — thirty-two candidates, and you simply ask the bank whether each exists.",
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Thirty-two lookups instead of scanning a bank of ten thousand. That scales much better as the bank grows.",
        p: { g0: 'good' }, l: { S0: 'step 0' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "From the start gene, changing the last letter gives a gene the bank knows. One mutation.",
        p: { g1: 'good' }, l: { S1: 'step 1' },
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "From there, changing the third letter reaches the target. Two mutations, and BFS guarantees there is no shorter route.",
        p: { g2: 'good' }, l: { S2: 'step 2 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One rule that catches people: the END gene must itself be in the bank. It is an intermediate like any other as far as validity goes, and if it is absent the answer is minus one no matter how close it looks.",
        p: { g3: 'dim' },
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And the START gene doesn't have to be in the bank, because you're already standing on it. That asymmetry is exactly the sort of thing I'd get wrong at two in the morning.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which is why you read the constraints twice before you write a line. The search here is five lines; the reading is the hard part.",
        sfx: 'gong'
      }
    ],

    insight: 'When neighbours are defined by a rule rather than given as a list, generate them from the rule and test membership — it turns an O(bank) neighbour scan into a handful of O(1) lookups.',
    complexity: '<b>Time O(B · L · 4)</b> where B is the bank size and L = 8 — each gene generates 32 candidates, each an O(L) hash lookup. <b>Space O(B)</b>. Comparing all pairs instead would be O(B² · L).',
    pitfall: 'Forgetting that the end gene must appear in the bank, while the start gene need not. Also, mark genes visited on enqueue, and remember a mutation counts even when it lands on a gene you have already seen — you simply do not re-explore it.',
    solution: `from collections import deque

def min_mutation(start, end, bank):
    bank = set(bank)
    if end not in bank:            # the target must itself be a valid gene
        return -1

    q = deque([(start, 0)])
    seen = {start}
    while q:
        gene, steps = q.popleft()
        if gene == end:
            return steps
        # Generate neighbours from the rule rather than scanning the bank.
        for i in range(len(gene)):
            for ch in 'ACGT':
                if ch == gene[i]:
                    continue
                nxt = gene[:i] + ch + gene[i + 1:]
                if nxt in bank and nxt not in seen:
                    seen.add(nxt)
                    q.append((nxt, steps + 1))
    return -1`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different lock, same search: Nami must open a 4-dial combination lock, turning one dial one notch per move, and certain combinations jam the mechanism and must be avoided. Fewest moves from 0000 to a target. How are neighbours found?",
        options: [
          'Generate all 8 one-notch turns from the current combination and skip any that are jammed',
          'Compare the current combination against every possible combination and keep those differing by one',
          'Sort the jammed combinations and binary search',
          'Try every combination in numeric order'
        ],
        correct: 0,
        explain: 'Identical shape to the gene bank: 4 dials × 2 directions = 8 neighbours generated from the rule, with the jammed set as an O(1) membership test. Scanning all 10,000 combinations per step would work and be far slower — and the dials wrap, so 9 turns to 0.',
        hint: 'How many moves are legal from any one combination?'
      },
      {
        tag: 'PITFALL',
        q: "Chopper omits the check that the end gene is in the bank, relying on the search to simply never find it. When does that bite?",
        options: [
          'It still returns -1, but only after exploring the entire reachable bank — correct, yet wasteful, and it hides the rule from the reader',
          'It returns a wrong, too-small answer',
          'It crashes',
          'It returns the right answer faster'
        ],
        correct: 0,
        explain: 'This one is worth being precise about: the omission is not a correctness bug, because an absent gene is never generated as a neighbour and so is never reached. It costs a full traversal to learn something a single lookup answers, and it leaves the validity rule undocumented in the code.',
        hint: 'Ask whether the search could ever reach a gene that is not in the bank.'
      },
      {
        tag: 'TWEAK',
        q: "The bank grows to a million genes and the sequences are 500 characters long. Which change matters most?",
        options: [
          'Bidirectional BFS from both ends, which roughly halves the explored depth',
          'Switching from a queue to a stack',
          'Sorting the bank',
          'Using DFS with memoisation'
        ],
        correct: 0,
        explain: 'The frontier grows exponentially in depth, so searching from both ends and meeting in the middle explores roughly the square root of the nodes a one-sided search would. Note that generating neighbours now costs 500 × 3 per gene, so at that size scanning the bank for one-letter differences may actually become competitive — worth measuring.',
        hint: 'The cost is dominated by how deep the frontier has to grow. Can you halve the depth?'
      }
    ]
  };

  E['word-ladder'] = {
    id: 'word-ladder',
    epNumber: 76,
    title: 'The Ladder Out of Level Six',
    arc: 'Impel Down',
    patternId: 'graphs-bfs-dfs-topo-union',
    scene: 'night',
    leetcode: { name: 'Word Ladder', number: 127, difficulty: 'Hard', url: 'https://leetcode.com/problems/word-ladder/' },
    problem: 'Given beginWord, endWord and a word list, return the number of words in the shortest transformation sequence from beginWord to endWord, changing one letter at a time, where every intermediate word must be in the list. Return 0 if none exists.',
    example: 'begin = "hit", end = "cog", list = ["hot","dot","dog","lot","log","cog"]  →  answer: 5  (hit → hot → dot → dog → cog)',

    h: 210,
    props: [
      { id: 'w0', emoji: '🔡', label: 'hit', x: 10, y: 30 },
      { id: 'w1', emoji: '🔡', label: 'hot', x: 30, y: 30 },
      { id: 'w2', emoji: '🔡', label: 'dot', x: 50, y: 30 },
      { id: 'w3', emoji: '🔡', label: 'dog', x: 70, y: 30 },
      { id: 'w4', emoji: '🔡', label: 'cog', x: 90, y: 30 },
      { id: 'w5', emoji: '🔡', label: 'lot', x: 50, y: 58 },
      { id: 'w6', emoji: '🔡', label: 'log', x: 70, y: 58 }
    ],
    ledger: [
      { id: 'P0', x: 30, y: 84 },
      { id: 'P1', x: 60, y: 84 },
      { id: 'P2', x: 88, y: 84 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The gate codes change one letter at a time, and every code along the way has to be a real word from the guard's book. We're on 'hit' and we need 'cog'.",
        p: { w0: 'lit', w4: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The same graph as the gene bank, in a different costume. Words are nodes, one-letter changes are edges, everything costs one step — breadth-first search, and the first arrival is the shortest ladder.",
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "But this book has thirty thousand words. Comparing every word against every other word to find the edges is nine hundred million comparisons before we even start searching.",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "So we never build the edge list. Bucket the words by pattern instead: 'hot' files under '*ot', 'h*t' and 'ho*'. Any two words sharing a bucket differ by exactly one letter.",
        p: { w1: 'lit' }, l: { P0: '*ot, h*t, ho*' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So from 'hit' I look up 'h*t' and out falls 'hot', without touching a single unrelated word.",
        p: { w0: 'good', w1: 'good' }, l: { P1: 'hit → hot' },
        sfx: 'pop'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "From 'hot': '*ot' gives 'dot' and 'lot'. Both go in the queue at distance three.",
        p: { w2: 'lit', w5: 'lit' },
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "From 'dot': 'do*' gives 'dog'. From 'dog': '*og' gives 'cog'. Five words in the ladder, counting both ends.",
        p: { w3: 'good', w4: 'good' }, l: { P2: 'hit hot dot dog cog = 5' },
        sfx: 'victory'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "The count is the number of WORDS, not the number of changes. Four changes, five words. That off-by-one has cost people whole interviews.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Once a bucket has been used, empty it. Every word in it has already been reached at this distance or a shorter one, so revisiting can only produce a longer ladder.",
        p: { w5: 'dim', w6: 'dim' },
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "And if 'cog' had never been in the book at all, no amount of searching would find it — the answer is zero, not 'nearly'.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "If they push you further, search from both ends at once and stop when the two frontiers touch. The frontier grows exponentially with depth, so halving the depth is close to taking a square root of the work.",
        sfx: 'gong'
      }
    ],

    insight: 'When edges are implied by a rule over a large set, index the rule rather than materialising the graph — wildcard buckets turn neighbour-finding from a scan of every word into a handful of dictionary lookups.',
    complexity: '<b>Time O(N · L²)</b> — N words, L characters, L patterns each costing O(L) to build. The all-pairs comparison alternative is O(N² · L). <b>Space O(N · L²)</b> for the buckets.',
    pitfall: 'Returning the number of transformations instead of the number of words — the answer counts both endpoints. Also: if endWord is not in the list, the answer is 0 regardless of how close it is.',
    solution: `from collections import deque, defaultdict

def ladder_length(begin_word, end_word, word_list):
    words = set(word_list)
    if end_word not in words:
        return 0

    L = len(begin_word)
    # Bucket by wildcard pattern: any two words in a bucket differ by one letter.
    buckets = defaultdict(list)
    for w in words:
        for i in range(L):
            buckets[w[:i] + '*' + w[i + 1:]].append(w)

    seen = {begin_word}
    q = deque([(begin_word, 1)])       # count WORDS, so the start counts as 1
    while q:
        word, depth = q.popleft()
        for i in range(L):
            key = word[:i] + '*' + word[i + 1:]
            for nxt in buckets[key]:
                if nxt == end_word:
                    return depth + 1
                if nxt not in seen:
                    seen.add(nxt)
                    q.append((nxt, depth + 1))
            buckets[key] = []          # this bucket can never help again
    return 0`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different network, same indexing trick: Franky must find the shortest chain of ship parts where consecutive parts share at least one bolt pattern, from a catalogue of 50,000 parts. How should he find neighbours?",
        options: [
          'Index bolt pattern → list of parts using it, then a part\'s neighbours are the union of its patterns\' lists',
          'Compare every part against every other part once, up front',
          'Sort the catalogue by bolt pattern and binary search',
          'Build the full adjacency matrix'
        ],
        correct: 0,
        explain: 'Same move as the wildcard buckets: invert the relation into an index keyed by the thing that makes two items adjacent. All-pairs comparison is 2.5 billion checks and an adjacency matrix is 2.5 billion cells — both are the thing the index exists to avoid.',
        hint: 'What is the property that makes two parts neighbours, and can you look items up BY that property?'
      },
      {
        tag: 'PITFALL',
        q: "The ladder is hit → hot → dot → dog → cog. Usopp returns 4. Why is that wrong?",
        options: [
          'The answer counts words in the sequence, not transformations — 5 words, 4 changes',
          'He forgot to count the start word twice',
          '4 is correct; the expected answer is wrong',
          'He should return the number of buckets used'
        ],
        correct: 0,
        explain: 'A chain of k words contains k−1 changes, and this problem asks for words. Seeding the queue with depth 1 rather than 0 makes it fall out correctly. Read the return-value sentence in the problem statement before writing the loop; it is the cheapest mark on the board.',
        hint: 'Count the items in the printed ladder, then count the arrows between them.'
      },
      {
        tag: 'TWEAK',
        q: "The interviewer asks Robin to return EVERY shortest ladder, not just the length. What has to change?",
        options: [
          'Record all parents that first reach each word at its shortest depth, then walk that parent graph backwards from the end',
          'Run the same BFS and collect every word it visits',
          'Switch to DFS and enumerate all paths',
          'Nothing — the same code already produces all ladders'
        ],
        correct: 0,
        explain: 'That is Word Ladder II. BFS still establishes the layers, but each word needs the set of predecessors that reached it at its minimal depth; the answers are then produced by walking that DAG backwards. Plain DFS over all paths is exponential and does not respect shortest-ness.',
        hint: 'BFS gives each word one distance. What extra thing must you store to rebuild the routes?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
