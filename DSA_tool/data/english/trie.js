window.ENGLISH_DECKS = window.ENGLISH_DECKS || {};
window.ENGLISH_DECKS['trie'] = {
  id: 'trie',
  title: 'Trie (Prefix Tree)',
  titleNe: 'A tree that branches letter by letter',
  intro: 'words that share a prefix share the same path — turning “starts with” queries into O(length) walks',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Anything about <b>prefixes</b>: autocomplete, spell-check, “does any word start with…”.',
        'Word search on a grid, IP-routing-style longest-prefix-match, dictionary lookups at scale.',
        'A hash set answers “is this word in the dictionary?” — a trie also answers “is this a valid <i>prefix</i>?” in the same O(length).',
      ],
      narration: "Now the last pattern of this course — the Trie, also called a prefix tree. Imagine a big dictionary. The Nepali words kaath, Kathmandu, and kaathko all begin from the same root, kaath. A trie is a tree built on exactly this idea — words with the same beginning share the early part of the path, and a branch splits off only where they start to differ. It's useful when the word prefix itself appears in the problem — autocomplete (suggestions as you type), spell-check, or does any word start with these letters? A hash set can quickly tell you only whether a whole word is in the dictionary, but for the question is this partial group of letters the start of some word, you need a trie — and in the same short time.",
    },
    {
      heading: 'Story: The shared-root library',
      bullets: [
        'Each node = one character; a path from root to node = the prefix spelled so far.',
        'A node marks <b>end-of-word</b> separately from “has children” — “काठ” can be a word <i>and</i> a prefix of “काठमाडौं”.',
        'Insert/search cost = O(word length) — completely independent of how many other words are stored!',
      ],
      narration: "Think of a library story — thousands of books arranged on shelves alphabetically, but in a special way — books with the same first letter on one first shelf, within that, books with the same second letter on one sub-shelf — the deeper you go, the more books share the path. In a trie, each node is a letter, and the path from the root to a node is the prefix built so far. One subtle but important point — at a node you must keep a separate flag saying a whole word ends here, because kaath is itself a complete word and also the front part of Kathmandu — both can be true at once. And the best part — the time to search or add a word depends only on that word's length, with no bearing at all on how many thousands of other words are stored!",
    },
    {
      heading: 'Mnemonic',
      big: '“Same start, same path — a branch splits off only where they differ.”',
      bullets: [
        'Node = <code>{children: {char: node}, is_end: bool}</code> — a dict of dicts, basically.',
        'Insert: walk/create one node per character, mark <code>is_end = True</code> at the last one.',
        'starts_with(prefix): walk the same path — if you fall off, the answer is no.',
      ],
      narration: "The hook: same start, same path — a branch splits off only where they differ. Structurally a trie really isn't complex — each node is a dictionary holding the routes from a letter to the next node, plus an is_end flag. Adding a word — walk letter by letter, creating a new node where the path is missing, and at the last letter set is_end to True. Checking a prefix — walk the same path — and if the path isn't there at some point, you know at once the prefix is nowhere in the dictionary, and can stop early.",
    },
    {
      heading: 'Python template',
      code: 'class TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_end = False\n\nclass Trie:\n    def __init__(self):\n        self.root = TrieNode()\n\n    def insert(self, word):\n        node = self.root\n        for ch in word:\n            if ch not in node.children:\n                node.children[ch] = TrieNode()   # a new branch\n            node = node.children[ch]\n        node.is_end = True                        # the word ends here\n\n    def search(self, word):\n        node = self._walk(word)\n        return node is not None and node.is_end\n\n    def starts_with(self, prefix):\n        return self._walk(prefix) is not None\n\n    def _walk(self, s):\n        node = self.root\n        for ch in s:\n            if ch not in node.children:\n                return None                       # the path broke\n            node = node.children[ch]\n        return node',
      narration: "The template has four functions. insert walks letter by letter, building missing branches, and marks is_end at the end. search and starts_with both use the same _walk helper — the only difference is that search also checks is_end at the end, because merely finding the path isn't enough — the whole word must actually end there. starts_with only checks whether the path exists, not is_end — because a prefix need not itself be a full word. Returning None the moment the path breaks in _walk, and stopping right away, is the secret to a trie's speed — you never even check the remaining letters.",
    },
    {
      heading: 'Watch out! Space cost and where it shows up',
      bullets: [
        'Space can balloon: many words with little shared prefix ≈ one node per character, no savings.',
        'Word Search II (grid + dictionary): build a trie of all words, DFS the grid, prune branches the trie says can’t lead anywhere.',
        'Autocomplete: reaching the end of a prefix, then DFS-collecting all <code>is_end</code> words in that subtree.',
        'For pure “is this word present” with no prefix queries, a plain hash set is simpler — don’t reach for a trie unless prefixes matter.',
      ],
      narration: "A final caution. If the words in the dictionary share little prefix with one another, a trie saves hardly any space — almost every letter gets its own node, and the benefit disappears — so the decision to use a trie also depends on how similar the words are. In a problem like Word Search Two, a trie teams up with grid-DFS — you build a trie of all the words, and while doing DFS on the grid, if the trie says that path leads nowhere you prune the branch right there — otherwise searching for each word separately in the grid would take far too long. In autocomplete, you walk the trie to the end of the typed prefix, then DFS the entire subtree below to gather every is_end word — that's your suggestion list. And a last reminder — if the problem has no interest in prefixes at all, only whether a whole word is present, a plain hash set is simpler and enough — don't force a trie. And with this, our journey through twenty patterns comes to a close — all the weapons are ready now, only practice remains!",
    },
  ],
};
