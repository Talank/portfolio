/* Sabaody — graph modelling, DFS and topological order.
   Part of the Grand Line run over the LeetCode Top Interview 150.
   Loaded on demand by js/grandline-loader.js. */
(function (root) {
  'use strict';
  var E = root.EPISODES = root.EPISODES || {};

  E['surrounded-regions'] = {
    id: 'surrounded-regions',
    epNumber: 87,
    title: 'The Bubbles That Touch the Sky',
    arc: 'Sabaody',
    patternId: 'graphs-bfs-dfs-topo-union',
    scene: 'islands',
    leetcode: { name: 'Surrounded Regions', number: 130, difficulty: 'Medium', url: 'https://leetcode.com/problems/surrounded-regions/' },
    problem: 'Given an m x n board of X and O, capture every region of O that is entirely surrounded by X. A region is not captured if any of its cells touches the border.',
    example: 'Any O connected to a border O survives; every other O becomes X.',

    h: 210,
    props: [
      { id: 'e1', emoji: '🫧', label: 'edge O', x: 12, y: 30 },
      { id: 'i1', emoji: '🫧', label: 'inner O', x: 42, y: 46 },
      { id: 'i2', emoji: '🫧', label: 'inner O', x: 62, y: 46 },
      { id: 'e2', emoji: '🫧', label: 'edge O', x: 90, y: 70 }
    ],
    ledger: [
      { id: 'S', x: 30, y: 82 },
      { id: 'C', x: 70, y: 82 }
    ],

    steps: [
      {
        speaker: 'usopp', pos: 'left',
        line: "The coating bubbles on the grove: any bubble touching open air survives, and any bubble sealed in on all sides gets popped by the resin. We need to know which is which.",
        p: { e1: 'lit', i1: 'lit', i2: 'lit', e2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So for each bubble, check whether its whole region reaches the edge? That means flood-filling every region and asking whether any of its cells is on the border.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Correct, but awkward — you have to fill first and decide afterwards, then go back and act. Turn the question around instead. Do not ask 'which regions are sealed'. Ask 'which regions touch the air'.",
        sfx: 'chime'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Start at the border and flood inward! Anything the flood reaches is connected to open air and therefore safe.",
        p: { e1: 'good', e2: 'good' }, l: { S: 'safe' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Exactly. Walk the four edges, and from every bubble sitting on them, flood into its whole region and mark it. That is one multi-source search, not one per region.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And then everything still unmarked is, by definition, sealed. Pop it.",
        p: { i1: 'bad', i2: 'bad' }, l: { C: 'captured' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One sweep at the end restores the marked bubbles and captures the rest. Two passes over the board, no per-region bookkeeping at all.",
        p: { e1: 'good', e2: 'good', i1: 'dim', i2: 'dim' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Inverting the question turned a hard property into an easy one. The easy property was the negation of the one they asked about.",
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "One practical worry: on a big board, does the recursion get too deep?",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "It can. A region spanning the whole board makes the depth proportional to its area. Say so, and offer the iterative version with an explicit stack — or breadth-first, which has the same effect.",
        sfx: 'gong'
      }
    ],

    insight: 'When a property is awkward to test directly, test its complement — "sealed in" is hard, "reachable from the border" is a plain multi-source flood fill, and everything else is the answer.',
    complexity: '<b>Time O(m · n)</b> — each cell visited a constant number of times across both passes. <b>Space O(m · n)</b> worst case for the recursion or the explicit stack.',
    pitfall: 'Flood-filling each region and then deciding, which needs per-region state and a second visit. Also: mark survivors with a temporary character and restore them at the end, or you cannot tell a survivor from an unvisited cell.',
    solution: `def solve(board):
    if not board or not board[0]:
        return
    rows, cols = len(board), len(board[0])

    def flood(r, c):
        if 0 <= r < rows and 0 <= c < cols and board[r][c] == 'O':
            board[r][c] = '#'            # temporary mark: reachable from air
            flood(r + 1, c); flood(r - 1, c)
            flood(r, c + 1); flood(r, c - 1)

    # Multi-source: every border cell is a starting point.
    for r in range(rows):
        flood(r, 0); flood(r, cols - 1)
    for c in range(cols):
        flood(0, c); flood(rows - 1, c)

    for r in range(rows):
        for c in range(cols):
            board[r][c] = 'O' if board[r][c] == '#' else 'X'`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different grove, same inversion: Nami must find every room in a ship's hold that CANNOT be reached from any hatch. Which approach is simplest?",
        options: [
          'Flood from every hatch, marking what is reachable; the unmarked rooms are the answer',
          'From every room, search for a path to a hatch',
          'Count the doors in each room',
          'Flood from every room and compare the results'
        ],
        correct: 0,
        explain: 'Same move: "cannot be reached" is expensive to test per room and trivial as the complement of one multi-source flood from the hatches. Searching from every room repeats overlapping work once per room.',
        hint: 'Which direction of search do you only have to run once?'
      },
      {
        tag: 'PITFALL',
        q: "Chopper marks reachable bubbles by setting them to 'X' during the flood, planning to set the rest to 'X' too and then restore. What breaks?",
        options: [
          'Survivors become indistinguishable from genuinely captured cells, so nothing can be restored afterwards',
          'The flood fill loops forever',
          'It works, but uses too much memory',
          'Border cells get skipped'
        ],
        correct: 0,
        explain: 'The temporary mark must be a third symbol precisely so the final sweep can tell "was O and survived" from "was X all along". Reusing an existing symbol collapses two states into one — the same reason the Game of Life in-place variant needs a second bit per cell.',
        hint: 'How many distinct states does a cell need to be in at the end of the flood?'
      },
      {
        tag: 'TWEAK',
        q: "The rule changes so that diagonal adjacency also connects bubbles. What must change?",
        options: [
          'The neighbour list grows from 4 directions to 8; nothing else about the method changes',
          'The border scan must include the corners separately',
          'It becomes a union-find problem',
          'The inversion no longer works'
        ],
        correct: 0,
        explain: 'Adjacency is a parameter of the flood, not part of its logic. This is why keeping the direction list as data rather than as four hard-coded recursive calls pays off — the same code covers 4-connectivity, 8-connectivity, and knight moves.',
        hint: 'Which single line of the flood encodes what "adjacent" means?'
      }
    ]
  };

  E['clone-graph'] = {
    id: 'clone-graph',
    epNumber: 88,
    title: 'The Copy That Points at Itself',
    arc: 'Sabaody',
    patternId: 'graphs-bfs-dfs-topo-union',
    scene: 'islands',
    leetcode: { name: 'Clone Graph', number: 133, difficulty: 'Medium', url: 'https://leetcode.com/problems/clone-graph/' },
    problem: 'Given a reference to a node in a connected undirected graph, return a deep copy of the whole graph. Each node holds a value and a list of its neighbours.',
    example: 'A square of four nodes, each joined to two others  →  an identical but entirely separate square',

    h: 210,
    props: [
      { id: 'n1', emoji: '🔗', label: '1', x: 30, y: 28 },
      { id: 'n2', emoji: '🔗', label: '2', x: 70, y: 28 },
      { id: 'n3', emoji: '🔗', label: '3', x: 70, y: 60 },
      { id: 'n4', emoji: '🔗', label: '4', x: 30, y: 60 }
    ],
    ledger: [
      { id: 'M', x: 50, y: 86 }
    ],

    steps: [
      {
        speaker: 'robin', pos: 'right',
        line: "The Auction House's guest network has to be duplicated exactly — every node, every link — without sharing a single object with the original.",
        p: { n1: 'lit', n2: 'lit', n3: 'lit', n4: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "Walk it and copy each node as I meet it. But the links go both ways — node one points at two, and two points back at one. I'd copy one, then two, then follow two's link back to one and copy it again. Forever.",
        sfx: 'error'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "So keep a visited set, like any graph walk.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "A visited set stops the loop, but it leaves you stuck. When you meet node one for the second time, you need to attach ITS COPY to node two's copy — and a set of booleans cannot tell you where that copy is.",
        p: { M: 'lit' }, l: { M: 'original → copy' },
        sfx: null
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "So the visited structure has to be a map. Original node to its clone. It does both jobs at once — it remembers what we've seen AND where the copy lives.",
        p: { M: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "The recursion then reads cleanly. Arrive at a node: if it is already in the map, return its clone and stop. Otherwise create the clone, record it in the map BEFORE recursing, then clone each neighbour and attach.",
        p: { n1: 'good' },
        sfx: 'pop'
      },
      {
        speaker: 'usopp', pos: 'left',
        line: "Before recursing. That's the part I'd get wrong — if you record it after, the cycle comes back round to a node that isn't in the map yet and off you go again.",
        p: { n2: 'good', n3: 'good', n4: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Exactly. The map entry must exist before any neighbour is explored. That single ordering is what makes cycles safe rather than fatal.",
        sfx: 'chime'
      },
      {
        speaker: 'chopper', pos: 'right',
        line: "And a graph of one node with no links at all? Or an empty reference?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Both worth handling explicitly — null in, null out; and an isolated node clones to an isolated node with an empty neighbour list. The problem gives you both, so they will be in the tests.",
        sfx: 'gong'
      }
    ],

    insight: 'A map from original to clone is both the visited set and the wiring table — and the entry must be recorded before recursing into neighbours, or a cycle re-enters an unrecorded node.',
    complexity: '<b>Time O(V + E)</b> — every node and edge handled once. <b>Space O(V)</b> for the map, plus O(V) recursion depth in the worst case. BFS with a queue is the equivalent iterative form.',
    pitfall: 'Using a plain visited set, which prevents infinite recursion but leaves you unable to attach the right clone on a revisit. And recording the clone <b>after</b> exploring neighbours, which reintroduces the infinite recursion it was meant to prevent.',
    solution: `def clone_graph(node):
    if not node:
        return None
    seen = {}                        # original -> clone: visited set AND wiring

    def copy(cur):
        if cur in seen:
            return seen[cur]         # already cloned: hand back the same clone
        clone = Node(cur.val)
        seen[cur] = clone            # record BEFORE recursing, or cycles recurse
        for nb in cur.neighbors:
            clone.neighbors.append(copy(nb))
        return clone

    return copy(node)`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different structure, same trap: Franky deep-copies a linked list where each node has a next pointer AND a random pointer to any node in the list. What does he need?",
        options: [
          'A map from original node to clone, so a random pointer can be redirected to the right clone',
          'A visited set of booleans',
          'Two passes with no extra structure — copy nodes first, then pointers by index',
          'A stack of pending pointers'
        ],
        correct: 0,
        explain: 'Identical need: a pointer to an already-copied node must resolve to that node\'s clone. That is Copy List with Random Pointer, and the map is the standard answer. (There is a clever O(1)-space variant that interleaves clones into the original list, which is exactly the follow-up an interviewer will ask for.)',
        hint: 'When you meet a pointer to a node you have already copied, what do you need to know about it?'
      },
      {
        tag: 'PITFALL',
        q: "Chopper writes: create the clone, recurse into all neighbours attaching them, and THEN put the clone in the map. On a two-node cycle 1 ↔ 2, what happens?",
        options: [
          'Infinite recursion — 1 recurses into 2, which recurses back into 1, which is still not in the map',
          'It works, but produces two copies of node 1',
          'It works correctly',
          'It produces a graph with no edges'
        ],
        correct: 0,
        explain: 'The map entry is the base case for the cycle, so it must be in place before any neighbour is followed. Recording it afterwards means the guard never fires on the way back round — the stack overflows rather than producing a wrong answer.',
        hint: 'When the recursion comes back around to node 1, what does the map contain?'
      },
      {
        tag: 'TWEAK',
        q: "The graph may be disconnected, and Robin is given the full list of nodes rather than one reference. What changes?",
        options: [
          'Loop over every node and start a clone walk from any that is not yet in the map',
          'Nothing — one walk still reaches everything',
          'Use BFS rather than DFS',
          'Connect the components with temporary edges first'
        ],
        correct: 0,
        explain: 'A single walk only reaches one connected component, which is why the original problem hands you a reference and promises connectivity. With a node list, the outer loop over unvisited nodes is the same pattern as counting islands — the map carries across components, so nothing is copied twice.',
        hint: 'How far does one DFS reach in a graph with two separate pieces?'
      }
    ]
  };

  E['evaluate-division'] = {
    id: 'evaluate-division',
    epNumber: 89,
    title: 'The Exchange Rates of the Human Shop',
    arc: 'Sabaody',
    patternId: 'graphs-bfs-dfs-topo-union',
    scene: 'islands',
    leetcode: { name: 'Evaluate Division', number: 399, difficulty: 'Medium', url: 'https://leetcode.com/problems/evaluate-division/' },
    problem: 'Given equations like a / b = 2.0 and a list of queries, return the value of each query, or -1.0 if it cannot be determined from the given equations.',
    example: 'a/b = 2.0, b/c = 3.0;  query a/c  →  6.0;  query a/e  →  -1.0',

    h: 210,
    props: [
      { id: 'ga', emoji: '💰', label: 'a', x: 20, y: 34 },
      { id: 'gb', emoji: '💰', label: 'b', x: 50, y: 34 },
      { id: 'gc', emoji: '💰', label: 'c', x: 80, y: 34 },
      { id: 'ge', emoji: '💰', label: 'e', x: 80, y: 68 }
    ],
    ledger: [
      { id: 'Q1', x: 30, y: 84 },
      { id: 'Q2', x: 70, y: 84 }
    ],

    steps: [
      {
        speaker: 'nami', pos: 'left',
        line: "The Human Shop quotes rates in pairs. One 'a' buys two 'b'. One 'b' buys three 'c'. Nobody will tell us what an 'a' buys in 'c' — but it is obviously six.",
        p: { ga: 'lit', gb: 'lit', gc: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "So it's a chain. Follow the rates and multiply along the way.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Which makes it a graph: each currency is a node, each quoted rate is an edge weighted by that rate — and the reverse edge exists too, weighted by one over it, because a rate always works both ways.",
        sfx: 'chime'
      },
      {
        speaker: 'nami', pos: 'left',
        line: "So a query is a path, and its answer is the product of the weights along that path.",
        p: { ga: 'good', gb: 'good', gc: 'good' }, l: { Q1: 'a→b→c = 2×3 = 6' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Any path will do — the rates are consistent by assumption, so a longer route gives the same product. Depth-first search with a visited set is enough; nothing here needs shortest paths.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "And 'e'? Nobody ever quoted anything against 'e'.",
        p: { ge: 'bad' }, l: { Q2: 'a→e: no path = -1' },
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then it sits in its own component and the answer is minus one. Same for any currency that was never mentioned at all — asking about an unknown node is not zero, it is undetermined.",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'left',
        line: "There's one lovely special case. What is 'a' over 'a'?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "One — but only if 'a' appears somewhere in the equations. If we have never heard of it, we cannot even assert that, and the answer is minus one. That distinction is the single most missed case in this problem.",
        p: { ga: 'good' }, l: { Q2: 'x/x = 1 only if known' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "And with thousands of queries against the same rate table?",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then union-find with weights, or precompute every pair once. But for the sizes in this problem, a DFS per query is clean and fast enough — and clean beats clever when the constraints allow it.",
        sfx: 'gong'
      }
    ],

    insight: 'Model first, traverse second: currencies are nodes, rates are weighted edges in both directions, and a query is a path whose answer is the product of its weights.',
    complexity: '<b>Time O(Q · (V + E))</b> — one traversal per query. <b>Space O(V + E)</b> for the adjacency map. Weighted union-find brings queries close to O(1) after an almost-linear build, which is the right answer if the query count is huge.',
    pitfall: 'Returning 1.0 for x/x when x was never mentioned in any equation — it must be -1.0. Also, forgetting to add the reciprocal edge, which leaves half the graph unreachable.',
    solution: `from collections import defaultdict

def calc_equation(equations, values, queries):
    graph = defaultdict(dict)
    for (a, b), v in zip(equations, values):
        graph[a][b] = v
        graph[b][a] = 1 / v            # a rate always works both ways

    def walk(src, dst, seen):
        if src not in graph or dst not in graph:
            return -1.0                # an unknown currency is undetermined
        if src == dst:
            return 1.0
        seen.add(src)
        for nb, w in graph[src].items():
            if nb in seen:
                continue
            sub = walk(nb, dst, seen)
            if sub != -1.0:
                return w * sub         # multiply along the path
        return -1.0

    return [walk(a, b, set()) for a, b in queries]`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different market, same graph: Sanji has conversion factors between cooking units (1 cup = 16 tbsp, 1 tbsp = 3 tsp) and needs cups per teaspoon. What is the edge weight for the reverse direction of \"1 cup = 16 tbsp\"?",
        options: [
          '1/16, so that walking the edge backwards divides instead of multiplying',
          '16, the same weight in both directions',
          '-16',
          'There is no reverse edge; the graph is directed'
        ],
        correct: 0,
        explain: 'A ratio is invertible, which is what makes the graph effectively undirected with reciprocal weights. Omitting the reverse edge is the most common bug here — half the queries then report -1 simply because the walk could not go upstream.',
        hint: 'If a/b = 16, what is b/a?'
      },
      {
        tag: 'PITFALL',
        q: "Nami is asked for x/x where x never appears in any equation. What should she return?",
        options: [
          '-1.0 — an unknown currency is undetermined, even against itself',
          '1.0, since anything divided by itself is 1',
          '0.0',
          'It is undefined behaviour; either answer is accepted'
        ],
        correct: 0,
        explain: 'The problem asks what can be DERIVED from the given equations, and nothing can be derived about a symbol that was never mentioned. The identity check must therefore come after the "is this node known?" check — reverse the two and you return 1.0 for every unknown symbol.',
        hint: 'Order the two guards in your walk. Which one has to run first?'
      },
      {
        tag: 'TWEAK',
        q: "The equations now contain a contradiction: a/b = 2 and b/a = 3. What does the DFS do?",
        options: [
          'It returns whichever value the first path it happens to find implies — the algorithm assumes consistency and cannot detect the clash',
          'It returns -1.0 for every query',
          'It detects the contradiction and raises',
          'It averages the two values'
        ],
        correct: 0,
        explain: 'Consistency is a stated precondition, and nothing in the traversal checks it — the answer becomes path-dependent, which is worse than an error because it is silent. Detecting contradictions would mean comparing every derived ratio, essentially a weighted union-find that flags a mismatch on union.',
        hint: 'Does the walk ever compare two different routes between the same pair?'
      }
    ]
  };

  E['course-schedule-ii'] = {
    id: 'course-schedule-ii',
    epNumber: 90,
    title: 'The Order the Training Must Be Done',
    arc: 'Sabaody',
    patternId: 'graphs-bfs-dfs-topo-union',
    scene: 'islands',
    leetcode: { name: 'Course Schedule II', number: 210, difficulty: 'Medium', url: 'https://leetcode.com/problems/course-schedule-ii/' },
    problem: 'Given numCourses and a list of prerequisite pairs, return an ordering of courses you can take to finish them all. Return an empty array if no such ordering exists.',
    example: 'numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]  →  [0, 1, 2, 3]',

    h: 210,
    props: [
      { id: 'c0', emoji: '📗', label: '0', x: 20, y: 30 },
      { id: 'c1', emoji: '📘', label: '1', x: 45, y: 30 },
      { id: 'c2', emoji: '📙', label: '2', x: 45, y: 62 },
      { id: 'c3', emoji: '📕', label: '3', x: 75, y: 46 }
    ],
    ledger: [
      { id: 'D', x: 25, y: 86 },
      { id: 'O', x: 70, y: 86 }
    ],

    steps: [
      {
        speaker: 'zoro', pos: 'left',
        line: "Rayleigh's training has an order to it. Some drills can't start until others are finished. Give me a sequence that works — or tell me there isn't one.",
        p: { c0: 'lit', c1: 'lit', c2: 'lit', c3: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Each drill is a node; each prerequisite is a directed edge pointing from what must come first to what it unlocks. What you want is a topological order.",
        sfx: null
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "So start with whatever has no prerequisites at all.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Count, for each drill, how many prerequisites it is waiting on — its in-degree. Everything sitting at zero can be started immediately, so put all of those in a queue.",
        p: { c0: 'good' }, l: { D: 'in-degree 0: [0]' },
        sfx: 'chime'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "Drill zero has nothing before it. Take it. That releases one and two — each of them was waiting only on zero, so both drop to zero.",
        p: { c1: 'lit', c2: 'lit' }, l: { O: 'order: 0' },
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Take one: drill three drops from two prerequisites to one — not ready. Take two: three drops to zero and joins the queue.",
        p: { c1: 'good', c2: 'good' }, l: { O: 'order: 0 1 2' },
        sfx: 'chime'
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "Then three. Four drills, in an order that never breaks a prerequisite.",
        p: { c3: 'good' }, l: { O: 'order: 0 1 2 3 ✓' },
        sfx: 'victory'
      },
      {
        speaker: 'usopp', pos: 'right',
        line: "And if the training were circular — three needs one, one needs three?",
        sfx: 'error'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then neither ever reaches in-degree zero, the queue empties early, and we finish having emitted fewer drills than exist. That count is the cycle test: emit fewer than n and there is no valid order at all.",
        p: { c3: 'bad' }, l: { D: 'emitted < n → cycle' },
        sfx: null
      },
      {
        speaker: 'zoro', pos: 'left',
        line: "So the check isn't a separate pass. It falls out of the same run.",
        p: { c3: 'good' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "There is a depth-first form too — post-order, reversed — which detects the cycle by finding an edge back into a node still on the current stack. Kahn's version is easier to explain out loud, and being able to explain it is most of the interview.",
        sfx: 'gong'
      }
    ],

    insight: 'Topological order by in-degree: repeatedly take anything waiting on nothing, and let each removal release its dependants — if fewer than n nodes come out, the graph has a cycle.',
    complexity: '<b>Time O(V + E)</b> — every node and edge handled once. <b>Space O(V + E)</b> for the adjacency lists, in-degrees and queue.',
    pitfall: 'Reading the pair the wrong way round. In <code>[a, b]</code> here, b must come before a, so the edge points b → a. Reversing it produces a plausible-looking order that is exactly backwards.',
    solution: `from collections import deque, defaultdict

def find_order(num_courses, prerequisites):
    graph = defaultdict(list)
    indeg = [0] * num_courses
    for course, prereq in prerequisites:     # [a, b] means b before a
        graph[prereq].append(course)
        indeg[course] += 1

    q = deque(c for c in range(num_courses) if indeg[c] == 0)
    order = []
    while q:
        cur = q.popleft()
        order.append(cur)
        for nxt in graph[cur]:
            indeg[nxt] -= 1                  # one prerequisite satisfied
            if indeg[nxt] == 0:
                q.append(nxt)

    # Fewer than n emitted means something never reached in-degree 0: a cycle.
    return order if len(order) == num_courses else []`,

    quiz: [
      {
        tag: 'TRANSFER',
        q: "Different yard, same order: Franky has assembly steps where some parts must be fitted before others, and he wants any workable build order. Which detail tells him a valid order does not exist?",
        options: [
          'The queue empties while some steps remain unemitted — those steps form a cycle',
          'Some step has more than one prerequisite',
          'Two steps have the same in-degree',
          'The graph is disconnected'
        ],
        correct: 0,
        explain: 'Only a cycle can leave nodes permanently waiting; multiple prerequisites and disconnected pieces are both perfectly normal (a disconnected graph just means independent sub-builds that can be interleaved freely). The emitted count is the whole cycle test.',
        hint: 'What is the only reason a node can never reach in-degree zero?'
      },
      {
        tag: 'PITFALL',
        q: "Zoro reads <code>[1, 0]</code> as \"1 must come before 0\" and builds the edge 1 → 0. What does he produce?",
        options: [
          'A valid topological order of the reversed graph — a plausible-looking sequence that violates every real prerequisite',
          'An empty list, because the graph now has a cycle',
          'The correct order anyway, since topological order is symmetric',
          'A crash on the in-degree array'
        ],
        correct: 0,
        explain: 'Reversing every edge yields another DAG, so the algorithm runs happily and returns a well-formed answer that happens to be exactly wrong. Silent, plausible wrongness is why the direction convention is worth writing down before coding.',
        hint: 'Does reversing all the edges of a DAG produce something the algorithm would reject?'
      },
      {
        tag: 'TWEAK',
        q: "The interviewer asks for the lexicographically smallest valid order. What is the smallest change?",
        options: [
          'Replace the queue with a min-heap, so the smallest available course is always taken next',
          'Sort the final order',
          'Sort the prerequisite list first',
          'It is impossible without trying all orders'
        ],
        correct: 0,
        explain: 'Kahn\'s algorithm is free to take any zero-in-degree node, so the tie-break is a policy choice — a heap makes it "smallest first" at a cost of O(V log V). Sorting the final order would destroy validity, since the order is the answer, not a set.',
        hint: 'When several courses are available at once, what picks which one goes next?'
      }
    ]
  };
}(typeof window !== 'undefined' ? window : this));
