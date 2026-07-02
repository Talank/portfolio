/*
Master ordered list of study modules. Drives the dashboard, nav order, prev/next
links on pattern pages, and the mock-interview variant pool.
type: 'warmup' | 'pattern' — warmup has no data/patterns/<id>.js file (handled by
pythonic-idioms.html directly); pattern modules load data/patterns/<id>.js.
*/
window.SCHEDULE = [
  { id: 'warmup', title: 'Big-O Refresher + Pythonic Idioms', category: 'Foundations', timeMin: 15, type: 'warmup', href: 'pythonic-idioms.html' },
  { id: 'two-pointers', title: 'Two Pointers', category: 'Arrays & Two-Pointer Family', timeMin: 12, type: 'pattern' },
  { id: 'sliding-window', title: 'Sliding Window', category: 'Arrays & Two-Pointer Family', timeMin: 15, type: 'pattern' },
  { id: 'fast-slow-pointers', title: 'Fast & Slow Pointers', category: 'Arrays & Two-Pointer Family', timeMin: 10, type: 'pattern' },
  { id: 'merge-intervals', title: 'Merge Intervals', category: 'Arrays & Two-Pointer Family', timeMin: 10, type: 'pattern' },
  { id: 'binary-search', title: 'Binary Search & Search Space Reduction', category: 'Arrays & Two-Pointer Family', timeMin: 15, type: 'pattern' },
  { id: 'hashing-patterns', title: 'Hashing Patterns', category: 'Hashing & Linear Structures', timeMin: 12, type: 'pattern' },
  { id: 'linked-list-reversal', title: 'Linked List In-Place Reversal', category: 'Hashing & Linear Structures', timeMin: 10, type: 'pattern' },
  { id: 'monotonic-stack', title: 'Monotonic Stack', category: 'Hashing & Linear Structures', timeMin: 12, type: 'pattern' },
  { id: 'queue-deque', title: 'Queue / Deque (Sliding Window Max, BFS Scaffolding)', category: 'Hashing & Linear Structures', timeMin: 10, type: 'pattern' },
  { id: 'tree-dfs-bfs', title: 'Tree DFS / BFS + Recursion Templates', category: 'Trees & Graphs', timeMin: 15, type: 'pattern' },
  { id: 'binary-search-trees', title: 'Binary Search Trees', category: 'Trees & Graphs', timeMin: 10, type: 'pattern' },
  { id: 'heaps-top-k', title: 'Heaps / Top-K / K-Way Merge', category: 'Trees & Graphs', timeMin: 12, type: 'pattern' },
  { id: 'backtracking', title: 'Backtracking', category: 'Trees & Graphs', timeMin: 15, type: 'pattern' },
  { id: 'graphs-bfs-dfs-topo-union', title: 'Graphs: BFS/DFS, Topological Sort, Union-Find', category: 'Trees & Graphs', timeMin: 20, type: 'pattern' },
  { id: 'dynamic-programming', title: 'Dynamic Programming', category: 'Optimization Patterns', timeMin: 35, type: 'pattern' },
  { id: 'greedy', title: 'Greedy Algorithms', category: 'Optimization Patterns', timeMin: 12, type: 'pattern' },
  { id: 'bit-manipulation', title: 'Bit Manipulation Tricks', category: 'Optimization Patterns', timeMin: 10, type: 'pattern' },
  { id: 'trie', title: 'Trie', category: 'Optimization Patterns', timeMin: 10, type: 'pattern' },
];

window.SCHEDULE_TOTAL_MIN = window.SCHEDULE.reduce((s, m) => s + m.timeMin, 0);
