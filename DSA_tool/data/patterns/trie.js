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
    'The correctness of trie search rests on a simple invariant, provable by induction on prefix length: after walking characters c_1, c_2, ..., c_k from the root, the node you land on (if any) represents exactly the set of all inserted strings that begin with the prefix c_1...c_k, and is_word at that node is true if and only if that exact prefix was itself inserted as a complete word. The base case is the root, representing the empty prefix shared by every stored string. The inductive step holds because insert() only ever creates a new child when the current character isn\'t already a key in the current node\'s children map — so two words sharing a k-character prefix are, by construction, forced onto the identical path for those first k characters, and diverge into separate subtrees only at the first character where they differ. That shared-path guarantee is what makes both search (walk the path, then check is_word) and startsWith (walk the path, ignore is_word) correct in exactly O(L) steps: the path either exists and is unique, or it doesn\'t exist at all — there\'s no other case to handle.',
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
  story: {
    onePiece: {
      title: 'The shared "D." branch in the World Government\'s name registry',
      text: [
        'Monkey D. Luffy. Portgas D. Ace. Marshall D. Teach. Gol D. Roger. Across the entire story, an unnerving number of the most dangerous, most plot-critical people share not a surname but a middle initial — the mysterious "Will of D." Imagine the World Government maintaining its surveillance registry as a trie over full names, branching letter by letter: \'M\', then \'o\', \'n\', \'k\', \'e\', \'y\', then the space, then the shared \'D\' node — and every single name whose path passes through that one "D." node gets flagged for elevated surveillance, no matter how differently the names continue afterward (\'Luffy\' branches one way past it, \'Teach\' another).',
        'That\'s precisely what a trie\'s shared-prefix structure gives you for free: one node, "D.", shared by every flagged name, with the actual divergence — Luffy vs. Ace vs. Teach vs. Roger — happening only in the subtrees hanging off that single shared point. The registry doesn\'t need a rule per bloodline; it needs one shared node and a flag, and the branching structure sorts everyone downstream of it automatically.',
      ],
    },
    history: {
      title: 'The North American Numbering Plan',
      text: [
        'Real infrastructure, not analogy: the North American Numbering Plan (NANP) routes a phone call through a literal digit-by-digit prefix tree — the area code narrows the call to a region, the central office/exchange code narrows it further within that region, and the subscriber number resolves the exact line — with each additional digit dialed pruning the remaining search space down another level, exactly the way walking a trie one character at a time prunes down to fewer and fewer candidate words. Telephone switching equipment was, for decades, a physical embodiment of trie traversal built out of relays and digit-by-digit routing tables.',
      ],
    },
    why: 'The "D." registry gives trie-sharing a single, precise in-universe image — one node, many names branching off it — while the NANP anchors the same digit-by-digit narrowing to a real infrastructure system built long before anyone called it a trie, which helps the idea generalize past "a data structure for strings" specifically.',
  },
  tricks: [
    {
      name: 'search() must check is_word; starts_with() must not',
      idea: 'Both methods share the exact same traversal, so it\'s tempting to implement them identically — but a path existing is not the same claim as a complete word having been inserted there.',
      before:
`class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.is_word = True

    def search(self, word):
        return self._walk(word) is not None   # BUG: identical to starts_with -- no is_word check

    def starts_with(self, prefix):
        return self._walk(prefix) is not None

    def _walk(self, s):
        node = self.root
        for ch in s:
            node = node.children.get(ch)
            if node is None:
                return None
        return node`,
      after:
`class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.is_word = True

    def search(self, word):
        node = self._walk(word)
        return node is not None and node.is_word   # must land on a completed word, not just a valid path

    def starts_with(self, prefix):
        return self._walk(prefix) is not None

    def _walk(self, s):
        node = self.root
        for ch in s:
            node = node.children.get(ch)
            if node is None:
                return None
        return node`,
      explain: 'With only "cat" and "car" ever inserted, the buggy version has search("ca") return True (the path exists), when it must return False (no word "ca" was ever inserted). Only checking node.is_word at the end of the walk distinguishes "a path exists" from "a complete word was inserted here."',
    },
    {
      name: 'Inserting a shorter word after a longer one that shares its path must still flip is_word on the existing node',
      idea: 'If "cart" is already stored and you then insert "car", every node on car\'s path already exists — no new node gets created at all — so flipping is_word only "when we created something new" silently drops the shorter word.',
      before:
`def insert(self, word):
    node = self.root
    created_new_path = False
    for ch in word:
        if ch not in node.children:
            node.children[ch] = TrieNode()
            created_new_path = True
        node = node.children[ch]
    if created_new_path:            # BUG: assumes is_word only matters when new nodes were created
        node.is_word = True`,
      after:
`def insert(self, word):
    node = self.root
    for ch in word:
        node = node.children.setdefault(ch, TrieNode())
    node.is_word = True   # always flip it, whether the final node was reused or brand new`,
      explain: 'If \'cart\' is already in the trie and you then insert \'car\', every node on car\'s path already exists, so a version that only sets is_word "when we created something new" never marks "car" as a complete word, and search("car") wrongly returns False even though "car" was just inserted. is_word must be set unconditionally at the end of every insert, regardless of whether the walk reused existing nodes or built new ones.',
    },
  ],
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
