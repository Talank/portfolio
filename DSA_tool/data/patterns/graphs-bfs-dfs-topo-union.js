window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['graphs-bfs-dfs-topo-union'] = {
  id: 'graphs-bfs-dfs-topo-union',
  title: 'Graphs: BFS/DFS, Topological Sort, Union-Find',
  category: 'Trees & Graphs',
  timeMin: 20,
  summary: 'Traverse directed/undirected graphs with BFS or DFS, linearize dependencies with topological sort, and track connectivity incrementally with Union-Find.',
  concept: [
    'Graphs generalize the tree templates you already know: BFS explores level-by-level with a queue and is the right tool for unweighted shortest-path questions ("fewest steps/moves/hops"); DFS explores depth-first with recursion or an explicit stack and is the right tool for reachability, cycle detection, and exhaustive path enumeration. The adjacency-list representation (a dict/list of neighbor lists) dominates interviews over adjacency matrices unless the graph is dense or given as a matrix already.',
    '<b>Topological sort</b> only exists for DAGs (directed acyclic graphs) and produces a linear ordering where every edge u→v places u before v — the canonical framing is "task/course scheduling with prerequisites." There are two standard implementations: Kahn\'s algorithm (BFS driven by in-degree — repeatedly dequeue any node with in-degree 0, then decrement its neighbors\' in-degrees) and DFS-based (postorder-append-then-reverse, using a 3-color white/gray/black visited scheme to detect back edges = cycles). Kahn\'s is usually preferred in interviews because the queue naturally doubles as your cycle detector: if you dequeue fewer than V nodes total, a cycle exists among the leftovers.',
    '<b>Union-Find (Disjoint Set Union)</b> answers "are these two nodes in the same connected component" and "merge these two components" incrementally, without rebuilding a traversal from scratch after every edge. With <i>path compression</i> (flatten the tree on every find) and <i>union by rank/size</i> (always attach the smaller tree under the bigger one\'s root), each operation is nearly O(1) amortized (formally O(α(n)), the inverse Ackermann function). It\'s the right tool whenever a problem streams edges one at a time and asks about connectivity after each — a fresh BFS/DFS per query would be far too slow.',
    'Plain BFS on an unweighted graph gives shortest paths for free because it explores nodes in strictly increasing distance order — the moment you first visit a node, that\'s its shortest distance from the source. This breaks down the instant edges have weights (then you need Dijkstra) — a frequent interview trap is applying plain BFS to a weighted grid (e.g. different costs per cell) and getting a wrong "shortest" path.',
    'Kahn\'s algorithm\'s correctness is a direct induction on graph size: the base case is trivial (an empty graph has an empty valid order), and the inductive step observes that any node with in-degree 0 can safely be placed first in some topological order — removing it (and its outgoing edges) yields a strictly smaller DAG, to which the inductive hypothesis applies; repeating this exactly reconstructs Kahn\'s dequeue order, and the process fails to terminate with V nodes exactly when the remaining subgraph has no in-degree-0 node, which is equivalent by definition to that subgraph containing a cycle. Union-Find\'s near-O(1) bound rests on a separate, purely structural invariant: with union by rank/size, a tree of height h must contain at least 2^h nodes (each merge that increases height only happens when merging two equal-height trees, doubling the node count), so height is capped at O(log n) even without compression; path compression then flattens every visited node directly under the root on each find, so the amortized cost across a whole sequence of operations provably falls to O(α(n)) via a potential-function argument, not merely "fast in practice."',
  ],
  recognitionSignals: [
    '"Prerequisite," "must complete X before Y," "course order," "build order," or any dependency-graph phrasing → topological sort.',
    'Explicit "detect a cycle in a directed graph" ask, or a scheduling feasibility question ("can all tasks be completed?") → topological sort / Kahn\'s in-degree check.',
    '"Connected components," "are these two nodes connected," "minimum edges to remove to make a tree," or edges arriving incrementally with connectivity queries after each → Union-Find.',
    'Unweighted graph or grid + "shortest path," "fewest steps," or "minimum number of moves" → plain BFS, not Dijkstra.',
    'Weighted edges combined with "shortest/cheapest path" → outside this pattern\'s scope (Dijkstra/Bellman-Ford), but recognizing the weight is what should redirect you away from plain BFS.',
  ],
  complexity: 'Time: O(V + E) for BFS, DFS, and topological sort (each vertex and edge is processed a constant number of times). Space: O(V + E) for the adjacency list plus O(V) for visited/in-degree/queue bookkeeping. Union-Find: O(E · α(V)) ≈ O(E) amortized total with path compression + union by rank, where α is the inverse Ackermann function (effectively constant for any realistic input size).',
  canonical: {
    name: 'Course Schedule (LeetCode 207)',
    statement: 'There are numCourses courses labeled 0 to numCourses-1. You are given an array prerequisites where prerequisites[i] = [a, b] means you must take course b before course a. Given the total number of courses and the list of prerequisite pairs, determine whether it is possible to finish all courses (equivalently: determine whether the prerequisite graph is a DAG, i.e. contains no cycle).',
  },
  story: {
    onePiece: {
      title: 'The Straw Hats\' voyage order, and Whitebeard\'s allied banners',
      text: [
        'The Straw Hats\' own voyage has a strict prerequisite order baked into it long before Luffy ever notices: you cannot reach Fishman Island until your ship has been Coated, and certain islands\' plot events must resolve before the next arc\'s islands even become reachable. Skipping a step doesn\'t just cost time — it makes the rest of the route undefined. That\'s exactly what a topological sort formalizes: a directed graph of "X must happen before Y" edges, and a valid voyage order is any ordering that respects every one of those edges at once.',
          'If the story\'s internal logic ever looped back on itself — some island secretly requiring a plot event from an island that itself required the first island\'s event — the voyage would be provably impossible to complete, not just difficult. That\'s the cycle-detection half of topological sort: Kahn\'s algorithm dequeues only islands with zero unresolved prerequisites, and if it runs dry before every island has been dequeued, the remaining islands are stuck in exactly this kind of unresolvable loop.',
          'Whitebeard\'s crew works on a completely different structure. When the Spade Pirates — Ace\'s crew — throw in with Whitebeard, that\'s not a new edge in a dependency graph, it\'s a union: two previously separate groups collapse into one shared faction, instantly linking every member of one to every member of the other. Asking "are these two pirates in the same faction" afterward is a find query, comparing which representative captain each side ultimately answers to — and it\'s cheap precisely because nobody needs to re-trace the whole allegiance history each time, only follow the current chain up to its representative.',
      ],
    },
    history: {
      title: 'The Critical Path Method, and the alliance blocs before 1914',
      text: [
        'Topological sort\'s real-world origin is genuinely mundane: the Critical Path Method (CPM), formalized in the 1950s for scheduling large engineering projects — including work tied to the Manhattan Project and the Polaris missile program — solves exactly the problem of ordering tasks that have hard dependencies (you cannot pour concrete before the forms are built, cannot test a component before it\'s assembled). Scheduling such a project is, underneath the project-management language, a topological sort of a real dependency DAG.',
        'Union-Find\'s alliance framing has its own real analogue: the network of European alliance blocs before World War I — the Triple Entente and the Triple Alliance — where nations kept merging into larger committed blocs such that "are these two countries allied" collapsed into a same-set membership question. A new treaty was a union operation; a diplomatic query about mutual defense obligations was a find.',
      ],
    },
    why: 'Anchoring topological sort to a voyage with a real point of no return, and union-find to a merger of allegiances that can\'t be undone, gives two separate concrete scenes to reach for — one for "why would this fail," one for "why is checking membership cheap" — instead of one abstract algorithm to reconstruct from scratch.',
  },
  tricks: [
    {
      name: 'Cycle detection needs the dequeue count, not just an empty queue',
      idea: 'The queue empties in both the cyclic and acyclic case, so checking only "did the queue run out" silently accepts inputs with a cycle.',
      before:
`from collections import deque, defaultdict

def can_finish(num_courses, prerequisites):
    graph = defaultdict(list)
    indegree = [0] * num_courses
    for course, pre in prerequisites:
        graph[pre].append(course)
        indegree[course] += 1

    queue = deque(c for c in range(num_courses) if indegree[c] == 0)
    while queue:
        node = queue.popleft()
        for nxt in graph[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    return True  # BUG: queue emptied, but that doesn't mean every course was reached`,
      after:
`from collections import deque, defaultdict

def can_finish(num_courses, prerequisites):
    graph = defaultdict(list)
    indegree = [0] * num_courses
    for course, pre in prerequisites:
        graph[pre].append(course)
        indegree[course] += 1

    queue = deque(c for c in range(num_courses) if indegree[c] == 0)
    visited = 0
    while queue:
        node = queue.popleft()
        visited += 1
        for nxt in graph[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    return visited == num_courses  # nodes stuck in a cycle are never dequeued`,
      explain: 'A cycle just means some nodes never reach in-degree 0 and are never enqueued in the first place — the loop still terminates normally, it just terminates early. Counting how many nodes were actually dequeued and comparing to num_courses is the only way to tell "we finished" from "we got stuck."',
    },
    {
      name: 'Redundant Connection: check connectivity *before* unioning, and compress paths as you go',
      idea: 'The redundant edge is by definition the first edge whose endpoints already share a root — union() must report whether the merge was a no-op, and without path compression / union by rank the whole structure degrades on skewed input.',
      before:
`def find_redundant_connection(edges):
    n = len(edges)
    parent = list(range(n + 1))

    def find(x):
        while parent[x] != x:      # no path compression: re-walks the full chain every call
            x = parent[x]
        return x

    def union(a, b):
        parent[find(a)] = find(b)  # unions unconditionally, even if a and b are already connected

    for a, b in edges:
        union(a, b)   # BUG: never checks whether a and b were already in the same component
    return []          # never identifies the redundant edge at all`,
      after:
`def find_redundant_connection(edges):
    n = len(edges)
    parent = list(range(n + 1))
    rank = [0] * (n + 1)

    def find(x):
        if parent[x] != x:
            parent[x] = find(parent[x])   # path compression: flatten on the way back up
        return parent[x]

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra == rb:
            return False           # already connected — this edge is the redundant one
        if rank[ra] < rank[rb]:
            ra, rb = rb, ra
        parent[rb] = ra
        if rank[ra] == rank[rb]:
            rank[ra] += 1
        return True

    for a, b in edges:
        if not union(a, b):
            return [a, b]
    return []`,
      explain: 'The redundant edge is precisely the first edge whose two endpoints already share a root, so union() must communicate whether the merge was a no-op and the caller must check that on every edge, not just call union() for its side effect. Path compression and union by rank are an orthogonal fix — without them find() can degrade to O(n) per call — but the connectivity check is what actually finds the answer; skipping it returns no answer at all rather than a slow one.',
    },
  ],
  variants: [
    {
      company: 'Google-style',
      title: 'Course Schedule II — return the actual order (LeetCode 210)',
      twist: 'Instead of a boolean, return one valid course order, or an empty array if impossible. The only code change is appending each dequeued node to a result list as you go — but the discussion shifts to correctness: multiple valid topological orders usually exist (ties are broken by insertion order into the queue), so don\'t over-fit your test expectations to one specific "expected" sequence — any order respecting all edges is correct.',
    },
    {
      company: 'Meta-style',
      title: 'Redundant Connection (LeetCode 684)',
      twist: 'Undirected graph, given as a sequence of edges that originally formed a tree plus one extra edge that created exactly one cycle. Process edges left to right with Union-Find; the first edge whose two endpoints already share a root (i.e. union() is a no-op because find(a) == find(b)) is the redundant edge to return. No orientation and no adjacency list needed — this is Union-Find in its purest incremental-connectivity form.',
    },
    {
      company: 'Amazon-style',
      title: 'Number of Provinces (LeetCode 547)',
      twist: 'Input is an n×n adjacency matrix (isConnected[i][j] == 1) rather than an edge list, so you iterate all i,j pairs directly and union(i, j) whenever connected, instead of building an edge list first. Watch out for the matrix being symmetric — you\'ll call union(i,j) and later effectively revisit union(j,i); that\'s harmless (find() on an already-merged pair is just a wasted O(α(n)) call) but explain why in the interview so it doesn\'t look like an oversight.',
    },
  ],
  pythonSolution: {
    title: 'Course Schedule (Kahn\'s BFS topological sort)',
    code:
`from collections import deque, defaultdict

def can_finish(num_courses: int, prerequisites: list[list[int]]) -> bool:
    graph = defaultdict(list)
    indegree = [0] * num_courses
    for course, pre in prerequisites:
        graph[pre].append(course)
        indegree[course] += 1

    queue = deque(c for c in range(num_courses) if indegree[c] == 0)
    visited = 0
    while queue:
        node = queue.popleft()
        visited += 1
        for nxt in graph[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    return visited == num_courses`,
    notes: [
      '<code>defaultdict(list)</code> lets <code>graph[pre].append(course)</code> work without a manual "if pre not in graph" branch — avoids a KeyError on the first edge from any given node.',
      '<code>deque</code> gives O(1) <code>popleft()</code>; using a plain list and <code>pop(0)</code> would silently degrade the whole algorithm to O(V²).',
      'The generator expression <code>(c for c in range(num_courses) if indegree[c] == 0)</code> seeds the queue in one line — idiomatic instead of a manual loop with <code>.append()</code> calls.',
      'Counting <code>visited</code> and comparing to <code>num_courses</code> at the end is the cycle check: nodes stuck in a cycle never reach in-degree 0, so they\'re never dequeued and never counted.',
    ],
  },
  pitfalls: [
    'Checking only "did the queue empty out" instead of "did we dequeue exactly num_courses nodes" — if there\'s a cycle, the queue empties early while cycle nodes are left with nonzero in-degree, and a naive implementation can mistake "queue is empty" for "we\'re done" and wrongly return True.',
    'Building the adjacency list backwards: prerequisites[i] = [course, pre] means the edge is pre → course, not course → pre. Mixing this up silently reverses every dependency and produces a topological order that\'s valid for the wrong graph.',
    'Implementing DFS-based cycle detection with a single visited set instead of a 3-state (unvisited / in current recursion stack / fully done) scheme — a plain visited set can\'t distinguish "currently on the DFS stack" (a real cycle) from "already fully explored via another path" (safe), causing false positives or missed cycles.',
    'Union-Find without path compression and without union by rank/size degrades to O(n) per operation in the worst case (a degenerate linked-list-shaped tree) — both optimizations are needed together to get the near-O(1) amortized bound, and forgetting to check "are they already in the same component" before counting a "redundant" or "extra" edge gives an off-by-one in edge-counting problems.',
  ],
  viz: {
    type: 'graph',
    nodes: [
      { id: 0, x: 50, y: 150, label: 0 },
      { id: 1, x: 150, y: 80, label: 1 },
      { id: 2, x: 150, y: 220, label: 2 },
      { id: 3, x: 250, y: 150, label: 3 },
      { id: 4, x: 350, y: 80, label: 4 },
      { id: 5, x: 350, y: 220, label: 5 },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 3, to: 5 },
    ],
    steps: [
      { visited: [], current: null, activeEdge: null, vars: { queue: '[0]', order: '[]', 'indeg[1..5]': '1,1,2,1,1' }, message: 'Build in-degree counts from the edges: 1 and 2 each depend on 0; 3 depends on both 1 and 2; 4 and 5 depend on 3. Seed the queue with every in-degree-0 node: [0].' },
      { visited: [], current: 0, activeEdge: null, vars: { queue: '[]', order: '[0]' }, message: 'Dequeue node 0, append to order → [0]. Now relax its outgoing edges.' },
      { visited: [0], current: 0, activeEdge: [0, 1], vars: { queue: '[1]', order: '[0]', 'indeg[1]': 0 }, message: 'Edge 0→1: decrement in-degree of 1 to 0 → enqueue 1. queue=[1]' },
      { visited: [0], current: 0, activeEdge: [0, 2], vars: { queue: '[1, 2]', order: '[0]', 'indeg[2]': 0 }, message: 'Edge 0→2: decrement in-degree of 2 to 0 → enqueue 2. queue=[1, 2]' },
      { visited: [0], current: 1, activeEdge: null, vars: { queue: '[2]', order: '[0, 1]' }, message: 'Dequeue node 1, append to order → [0, 1].' },
      { visited: [0, 1], current: 1, activeEdge: [1, 3], vars: { queue: '[2]', order: '[0, 1]', 'indeg[3]': 1 }, message: 'Edge 1→3: decrement in-degree of 3 to 1 — node 3 still has an unmet prerequisite (from 2), so it is not enqueued yet.' },
      { visited: [0, 1], current: 2, activeEdge: null, vars: { queue: '[]', order: '[0, 1, 2]' }, message: 'Dequeue node 2, append to order → [0, 1, 2].' },
      { visited: [0, 1, 2], current: 2, activeEdge: [2, 3], vars: { queue: '[3]', order: '[0, 1, 2]', 'indeg[3]': 0 }, message: 'Edge 2→3: decrement in-degree of 3 to 0 → enqueue 3. queue=[3]' },
      { visited: [0, 1, 2], current: 3, activeEdge: null, vars: { queue: '[]', order: '[0, 1, 2, 3]' }, message: 'Dequeue node 3, append to order → [0, 1, 2, 3].' },
      { visited: [0, 1, 2, 3], current: 3, activeEdge: [3, 4], vars: { queue: '[4]', order: '[0, 1, 2, 3]', 'indeg[4]': 0 }, message: 'Edge 3→4: decrement in-degree of 4 to 0 → enqueue 4.' },
      { visited: [0, 1, 2, 3], current: 3, activeEdge: [3, 5], vars: { queue: '[4, 5]', order: '[0, 1, 2, 3]', 'indeg[5]': 0 }, message: 'Edge 3→5: decrement in-degree of 5 to 0 → enqueue 5. queue=[4, 5]' },
      { visited: [0, 1, 2, 3], current: 4, activeEdge: null, vars: { queue: '[5]', order: '[0, 1, 2, 3, 4]' }, message: 'Dequeue node 4, append to order → [0, 1, 2, 3, 4].' },
      { visited: [0, 1, 2, 3, 4], current: 5, activeEdge: null, vars: { queue: '[]', order: '[0, 1, 2, 3, 4, 5]' }, message: 'Dequeue node 5, append to order → [0, 1, 2, 3, 4, 5].' },
      { visited: [0, 1, 2, 3, 4, 5], current: null, activeEdge: null, vars: { order: '[0, 1, 2, 3, 4, 5]', result: 'True' }, message: 'All 6 nodes were dequeued (order length == numCourses) → no cycle exists. can_finish returns True.' },
    ],
  },
  quiz: [
    {
      q: 'A problem says: "course A must be completed before course B... determine if you can complete all courses." Which technique applies?',
      options: [
        'Binary search on the sorted list of prerequisites',
        'Topological sort / cycle detection on a directed graph',
        'Two-pointer merge of the prerequisite lists',
        'Sliding window over the course list',
      ],
      correct: 1,
      explain: '"Must complete X before Y" is a directed dependency edge; feasibility of completing everything is exactly "does this directed graph contain a cycle," answered by attempting a topological sort.',
    },
    {
      q: 'In Kahn\'s BFS topological sort, what does it mean if the final order contains fewer nodes than the total node count?',
      options: [
        'The graph is disconnected and BFS should simply restart from another node',
        'The graph contains a directed cycle, so the remaining nodes never reach in-degree 0 and are never dequeued',
        'You forgot to initialize the queue correctly',
        'The graph must be undirected',
      ],
      correct: 1,
      explain: 'Nodes inside a cycle always retain at least one unmet in-edge from another node in the same cycle, so their in-degree never drops to 0 and they\'re never enqueued — the queue empties early, leaving a gap between order length and V.',
    },
    {
      q: 'What is the time complexity of BFS or DFS traversal on a graph with V vertices and E edges represented as an adjacency list?',
      options: ['O(V²)', 'O(V + E)', 'O(E log V)', 'O(V · E)'],
      correct: 1,
      explain: 'Each vertex is dequeued/visited once and each edge is examined once (or twice for undirected graphs, still a constant factor), giving O(V + E) — this is the standard bound to state immediately in an interview.',
    },
    {
      q: 'Union-Find (Disjoint Set Union) is the right tool when a problem primarily asks:',
      options: [
        'For the shortest path between two specific nodes',
        'Whether two nodes are already in the same connected component, especially with edges/queries arriving incrementally',
        'For the maximum-sum contiguous subarray',
        'For the longest increasing subsequence',
      ],
      correct: 1,
      explain: 'Union-Find answers connectivity queries and merges incrementally in near-O(1) amortized time per operation with path compression + union by rank — far cheaper than re-running BFS/DFS after every new edge.',
    },
    {
      q: 'Redundant Connection (LeetCode 684) asks you to find the one edge that, if removed, turns a graph with exactly one cycle back into a tree. Which approach directly identifies that edge in a single pass over the edge list?',
      options: [
        'Run DFS cycle detection from every node and intersect the results',
        'Union-Find: process edges in order, and the edge whose two endpoints already share a root is the redundant one',
        'Sort edges by weight and apply Kruskal\'s MST algorithm',
        'Compute in-degree for every node and return the one with in-degree 2',
      ],
      correct: 1,
      explain: 'As you union endpoints edge by edge, the first edge where find(a) == find(b) already holds means those two nodes were already connected before this edge — adding it is what created the cycle, so it\'s the answer.',
    },
  ],
};
