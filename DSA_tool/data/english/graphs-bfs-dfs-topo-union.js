window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['graphs-bfs-dfs-topo-union'] = {
  id: 'graphs-bfs-dfs-topo-union',
  title: 'Graphs: BFS/DFS, Topological Sort, Union-Find',
  titleNe: 'A web of roads — who connects to whom',
  intro: 'trees generalize to graphs — but now cycles exist, so visited-tracking becomes non-negotiable',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Anything with “connections”, “dependencies”, “islands”, “shortest path”, “can I reach X from Y?”',
        'A graph is just a tree that <b>allows cycles</b> — same DFS/BFS toolkit, plus a mandatory <code>visited</code> set.',
        'Three extra tools graphs bring: topological sort (ordering), union-find (grouping), Dijkstra (weighted shortest path).',
      ],
      narration: "Now the Graph — the big brother of the previous module's tree. In a tree you arrive from only one parent, and you never loop around back to the same place. In a graph, it's like a web of roads — there can be many routes from one town to another, and you can wander round and round back to the town you started from — that's called a cycle. So the DFS and BFS from the previous module work here too, but one new rule becomes mandatory — you must keep a visited diary, or you'll circle the same town endlessly, forever stuck. This module also adds three new weapons — topological sort (who comes before whom), union-find (which groups are connected), and, on weighted roads, Dijkstra.",
    },
    {
      heading: 'Story: Why visited is non-negotiable',
      bullets: [
        'Without <code>visited</code>, a cycle sends DFS/BFS into an infinite loop.',
        'Mark a node visited <b>the moment you enqueue/push it</b>, not when you process it — or duplicates flood the queue.',
        'Two representations: adjacency list (usual) vs. matrix (dense graphs, O(1) edge check).',
      ],
      narration: "The story — you're wandering the alleys of an unfamiliar town with no map. If you don't keep in mind which houses you've already seen, you'll circle the round alleys and keep seeing those same houses over and over, with no end. So the visited diary is mandatory — the moment you see a house, write it down. But there's a subtle, important timing question — do you write it the moment you see it (as you enqueue it), or after you arrive and step inside (when you process it)? In BFS you must follow the first rule — otherwise the same neighbour is seen by many people at once and added to the queue many times, and the crowd swells. A graph is built two ways — an adjacency list (usually, lightweight) or a matrix (for dense webs, where checking whether two nodes connect is O(1)).",
    },
    {
      heading: 'Mnemonic',
      big: '“Write it in visited before you enter — else you spin in circles.”',
      bullets: [
        'Topological sort = “course prerequisites” ordering — only possible on a <b>DAG</b> (no cycles).',
        'Union-Find = “which group am I in?” — near-O(1) with path compression + union by rank.',
        'Cycle detection: DFS with a <b>recursion-stack</b> set (directed) or parent-tracking (undirected).',
      ],
      narration: "The hook: write it in visited before you enter, else you spin in circles. Now let's quickly meet the three special weapons. Topological Sort is like the college prerequisite chart — figuring out the order in which subjects must be taken — but it's possible only when the graph has no cycle, which is called a DAG — otherwise if A needs B and B needs A, neither ever completes. Union-Find is for the question which group am I in — like sorting out friendship circles — and two tricks, path compression and union by rank, make it almost O(1). And for detecting a cycle — in a directed graph, check whether the same node reappears on the current recursion path; in an undirected one, if you find a visited node other than the parent you came from, that's a cycle.",
    },
    {
      heading: 'Python templates',
      code: 'from collections import deque, defaultdict\n\ndef bfs(graph, start):\n    visited, order = {start}, []\n    q = deque([start])\n    while q:\n        node = q.popleft()\n        order.append(node)\n        for nb in graph[node]:\n            if nb not in visited:\n                visited.add(nb)          # mark as you enqueue\n                q.append(nb)\n    return order\n\ndef topo_sort(graph, n):\n    indegree = [0] * n\n    for u in graph:\n        for v in graph[u]:\n            indegree[v] += 1\n    q = deque([i for i in range(n) if indegree[i] == 0])\n    order = []\n    while q:\n        u = q.popleft()\n        order.append(u)\n        for v in graph[u]:\n            indegree[v] -= 1\n            if indegree[v] == 0:\n                q.append(v)\n    return order if len(order) == n else []   # empty ⇒ a cycle exists\n\nclass UnionFind:\n    def __init__(self, n):\n        self.parent = list(range(n))\n    def find(self, x):\n        if self.parent[x] != x:\n            self.parent[x] = self.find(self.parent[x])  # path compression\n        return self.parent[x]\n    def union(self, a, b):\n        ra, rb = self.find(a), self.find(b)\n        if ra != rb:\n            self.parent[ra] = rb',
      narration: "Let's look at three templates. BFS — notice where visited gets added — right on the append-to-queue line, not when you popleft and process; that's the rule from the previous slide. Topo sort uses Kahn's algorithm — start from those with indegree zero (needing no prerequisite), and as you process them, decrease others' indegree, adding any that hit zero — and if at the end the order's length is less than n, there's a cycle, which is the proof. In UnionFind, the find function, while recursing, sticks everyone it meets on the way directly to the root — path compression — which makes each later query faster and faster.",
    },
    {
      heading: 'Watch out! Where each shows up',
      bullets: [
        'Number of Islands / Connected Components: DFS or BFS flood-fill, or Union-Find — all three work.',
        'Course Schedule (I/II): topological sort — “can all courses finish?” = “is the graph a DAG?”',
        'Redundant Connection, Accounts Merge: scream Union-Find — “which items belong together?”',
        'Weighted shortest path: BFS fails (assumes equal edges) — reach for Dijkstra (heap-based) instead.',
      ],
      narration: "Finally, a map of where each is used. On problems like Number of Islands or Connected Components, DFS, BFS, or Union-Find — all three work — which to pick is often a matter of taste. Course Schedule asks directly — can all the courses be finished? — which is just the question of whether the graph has no cycle, and topo sort answers it. Problems like Redundant Connection or Accounts Merge, which ask which items belong together, are the plain voice of Union-Find. And a final caution — if the roads have different weights (a weighted graph), BFS gives the wrong answer, because it assumes all roads are equally long — there you need Dijkstra, which uses a heap, connecting straight back to the heap knowledge from the previous module.",
    },
  ],
};
