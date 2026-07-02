window.PATTERNS = window.PATTERNS || {};
window.PATTERNS['trie'] = {
  id: 'trie',
  title: 'Trie',
  category: 'Optimization Patterns',
  timeMin: 10,
  summary: 'A prefix tree where each node is a character-to-child map plus an end-of-word flag, giving O(length) insert/search/prefix-lookup independent of how many words are stored.',
  concept: [
    'A trie (prefix tree) stores a set of strings by sharing common prefixes as shared paths from a root node. Each node holds a map from character to child node (a plain dict for an arbitrary alphabet, or a fixed 26-slot array for lowercase-only English) and a boolean <code>is_word</code> flag marking "a complete inserted word ends exactly here." Insert walks the word character by character, reusing existing child nodes when the prefix already exists and creating new nodes only once the shared prefix runs out, then flips <code>is_word</code> at the final node. Search does the same walk but additionally requires <code>is_word</code> to be true at the end; prefix/<code>startsWith</code> lookup only requires that the path exists at all, regardless of <code>is_word</code>.',
    'The complexity payoff — O(L) per operation, where L is the length of the word or prefix — is independent of how many other words are already stored, which is what a hash set of full strings cannot give you: a hash set answers "is this exact string present" in O(L) too, but it cannot efficiently answer "how many/which stored strings start with this prefix" without scanning the entire set. A trie localizes every string sharing a prefix under one shared subtree, so prefix queries are just "does this path exist," at the same O(L) cost as an exact lookup.',
    'Tries frequently combine with another pattern rather than standing alone: Word Search II builds one shared trie from an entire dictionary up front, then runs DFS/backtracking from every cell of a letter board simultaneously, using the trie to prune any path the instant it stops being a prefix of any dictionary word — this amortizes the search across all words instead of re-running an independent board search per word.',
  ],
  recognitionSignals: [
    '"Prefix," "startsWith," "autocomplete," or "find all words sharing a prefix" appears explicitly in the prompt.',
    'Need to search a grid/board for many dictionary words at once (Word Search II) rather than one word at a time — a shared trie lets you prune a DFS branch as soon as it stops matching any word.',
    '"Design a data structure supporting insert / search / startsWith" — this is literally the Implement Trie interface.',
    'Longest common prefix across a set of strings, or "shortest unique prefix for each word" — modeled naturally as "walk down the trie while there\'s exactly one child."',
  ],
  complexity: 'Time: O(L) per insert/search/startsWith, where L is the length of the word or prefix — independent of how many words are already stored. Space: O(total characters across all inserted words) in the worst case (no shared prefixes), less when prefixes overlap; roughly O(26) per node for a fixed-alphabet array implementation, or O(1) amortized per actual existing child for a hash-map implementation.',
  canonical: {
    name: 'Implement Trie / Prefix Tree (LeetCode 208)',
    statement: 'Implement a Trie class with insert(word), search(word) (exact match against previously inserted words), and startsWith(prefix) (true if any inserted word begins with prefix), each running in O(length of the input) time.',
  },
  variants: [
    {
      company: 'Google-style',
      title: 'Word Search II — find all dictionary words on a letter board (LeetCode 212)',
      twist: 'Given a 2D board of letters and a list of words, find every word present as a path of adjacent cells. Build one trie from the entire word list up front, then DFS from every board cell simultaneously, following trie edges instead of relying on the board\'s adjacency alone — this prunes a branch the instant the current path stops being a prefix of any word. A common follow-up: delete matched words from the trie (or mark their end node) as you find them, both to avoid duplicate results and to prune subtrees that no longer lead to any remaining target word.',
    },
    {
      company: 'Meta-style',
      title: 'Design Add and Search Words Data Structure — wildcard search (LeetCode 211)',
      twist: 'search() must support \'.\' as a wildcard matching any single character. This turns a straight-line O(L) walk into a DFS/backtracking search over the trie: on encountering \'.\', you must branch into every child at that node and recurse, only returning true if any branch succeeds. Worst case (an all-wildcard query) blows up from O(L) to O(26^L), which is worth stating explicitly since it\'s a real complexity regression, not just a code-structure change.',
    },
    {
      company: 'Amazon-style',
      title: 'Replace Words — shortest matching root per word (LeetCode 648)',
      twist: 'Given a dictionary of root words and a sentence, replace each word in the sentence with its shortest dictionary root, if one exists. For each sentence word, walk the trie character by character and stop at the first <code>is_word</code> flag encountered — that\'s automatically the shortest matching root, since you hit it before any longer match further down the same path. Handle two edge cases explicitly: no root matches (keep the original word unchanged), and multiple roots match (the shortest one wins by construction, since you stop walking at the first hit).',
    },
  ],
  pythonSolution: {
    title: 'Implement Trie (Prefix Tree)',
    code:
`class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.is_word = True

    def search(self, word: str) -> bool:
        node = self._walk(word)
        return node is not None and node.is_word

    def starts_with(self, prefix: str) -> bool:
        return self._walk(prefix) is not None

    def _walk(self, s: str):
        node = self.root
        for ch in s:
            node = node.children.get(ch)
            if node is None:
                return None
        return node`,
    notes: [
      '<code>node.children.setdefault(ch, TrieNode())</code> inserts a fresh child only if absent and returns the (new or existing) child in one call, replacing a manual <code>if ch not in node.children: ...</code> branch.',
      'Factoring the shared traversal into <code>_walk</code> avoids duplicating the walk loop between <code>search</code> and <code>starts_with</code> — the two methods differ only in what they check once the walk finishes (an is_word flag vs. mere existence of the node).',
      'Using a plain <code>dict</code> for <code>children</code> instead of a fixed 26-slot list keeps the trie alphabet-agnostic (handles uppercase, digits, unicode) at a small per-node overhead cost versus an array.',
      '<code>node.children.get(ch)</code> returns None on a missing key instead of raising KeyError, letting <code>_walk</code> terminate cleanly with one <code>if node is None: return None</code> rather than a try/except around a dict access.',
    ],
  },
  pitfalls: [
    'Confusing search (must end exactly on a node with is_word=True) with starts_with (only needs the path to exist) — implementing both identically is a common bug that makes search("ca") wrongly return True when only "cat"/"car" were ever inserted.',
    'Not setting is_word on an intermediate node when a shorter word is inserted after a longer one that shares its full path (e.g. inserting "car" after "cart" was already inserted) — the node for "car" already exists as an interior node of "cart"\'s path, so you must still flip its is_word flag rather than assuming a brand-new node is required.',
    'Using a fixed-size 26-element array for children when the alphabet actually includes uppercase letters, digits, or unicode — this produces a silent index-out-of-range bug or maps two different characters to the same slot instead of a clean, loud error.',
    'In Word Search II-style problems, re-running an independent trie walk per dictionary word (or failing to stop a board DFS the moment no trie child matches the next letter) — this defeats the entire point of sharing one trie and regresses toward O(words × board cells × 4^L).',
  ],
  viz: {
    type: 'array',
    initialArray: ['c', 'a', 'r', 't'],
    steps: [
      { highlights: {}, pointers: {}, vars: { path: 'root', word: "'cart'" }, message: "Trie already contains 'cat' and 'car'. Insert 'cart': walk from the root one character at a time, reusing existing nodes and creating new ones only when a character is missing." },
      { highlights: { 0: 'c' }, pointers: { i: 0 }, vars: { path: 'root -> c' }, message: "'c': root already has a child 'c' (shared prefix with cat/car) → reuse it, move down." },
      { highlights: { 0: 'c', 1: 'c' }, pointers: { i: 1 }, vars: { path: 'root -> c -> a' }, message: "'a': node 'c' already has a child 'a' (shared prefix 'ca') → reuse it." },
      { highlights: { 0: 'c', 1: 'c', 2: 'c' }, pointers: { i: 2 }, vars: { path: 'root -> c -> a -> r' }, message: "'r': node 'ca' already has a child 'r' (from the earlier word 'car') → reuse it. Note: 'car' was already a complete word ending at this node." },
      { highlights: { 0: 'c', 1: 'c', 2: 'c', 3: 'a' }, pointers: { i: 3 }, vars: { path: 'root -> c -> a -> r -> t', node: 'new' }, message: "'t': node 'car' has no child 't' yet → create a brand-new node here." },
      { highlights: { 0: 'c', 1: 'c', 2: 'c', 3: 'a' }, pointers: {}, vars: { path: 'root -> c -> a -> r -> t', isWord: 'True' }, message: "Mark the new 't' node as is_word=True. 'cart' is now a complete word in the trie, built with only 1 new node (3 were reused)." },
    ],
  },
  quiz: [
    {
      q: 'Which phrasing most strongly signals a trie over a plain hash set of strings?',
      options: [
        'Find if a target value exists in a sorted array',
        'Efficiently answer "how many stored words start with this prefix" or serve autocomplete suggestions for a prefix',
        'Find the shortest path between two nodes',
        'Merge two sorted linked lists',
      ],
      correct: 1,
      explain: 'A hash set can answer exact-match membership in O(L) but cannot efficiently enumerate or count entries sharing a prefix without scanning everything. A trie localizes all such strings under one subtree, answering prefix queries at the same O(L) cost.',
    },
    {
      q: 'In the reference Trie implementation, what\'s the difference between `search(word)` and `starts_with(prefix)`?',
      options: [
        'They are identical — both just check that the path exists',
        'search additionally requires the final node\'s is_word flag to be True; starts_with only requires that the path itself exists',
        'starts_with is O(1) while search is O(L)',
        'search only works correctly for single-character words',
      ],
      correct: 1,
      explain: 'Both share the exact same traversal (_walk); they differ only in what they check once the walk completes — is_word for an exact match, mere node existence for a prefix match.',
    },
    {
      q: 'What is the time complexity of insert/search/startsWith in a trie, and why is it independent of the number of words already stored?',
      options: [
        'O(number of words stored), since you must compare against every existing word',
        'O(L) where L is the length of the word/prefix — each step follows exactly one child pointer per character, regardless of how many other words share or don\'t share that path',
        'O(L log n) where n is the size of the dictionary',
        'O(26^L) always, since every node conceptually has 26 children',
      ],
      correct: 1,
      explain: 'Each character of the input consumes exactly one step down the tree (one dict/array lookup), so the walk length is bounded purely by the input length, not by how many other strings are stored.',
    },
    {
      q: 'Design Add and Search Words (LeetCode 211) adds \'.\' as a wildcard matching any character. How does this change the algorithm\'s worst case?',
      options: [
        'No change — wildcards are simply ignored during the walk',
        'A straight-line O(L) walk becomes a DFS/backtracking search that may branch into every child at each wildcard, worst case O(26^L) for an all-wildcard query',
        'It requires switching from a trie to a suffix array',
        'It reduces the complexity to O(log L)',
      ],
      correct: 1,
      explain: 'A literal character narrows the walk to one specific child; a wildcard forces exploring every child at that position, and those branches compound multiplicatively across multiple wildcards.',
    },
    {
      q: 'You insert \'cart\' into a trie that already contains \'car\'. What\'s the common implementation bug to watch for?',
      options: [
        'Forgetting to set is_word=True on the new final node for \'cart\' while incorrectly assuming the existing \'car\' node\'s is_word flag also covers \'cart\'',
        'There is no risk — the words are unrelated',
        'You must delete \'car\' first before inserting \'cart\'',
        'The trie will automatically reject \'cart\' since \'car\' already exists as a prefix',
      ],
      correct: 0,
      explain: 'is_word is a per-node flag marking "a complete word ends exactly here," not "this node is on the path of some word." The node for \'car\' and the node for \'cart\' are different nodes and need their own independent is_word flags.',
    },
  ],
};
