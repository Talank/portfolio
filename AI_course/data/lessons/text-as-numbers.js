window.LESSONS = window.LESSONS || {};
window.LESSONS['text-as-numbers'] = {
  id: 'text-as-numbers',
  title: 'Text as Numbers: Bag-of-Words, TF-IDF & Cosine Search',
  category: 'Part 2 — Classical ML',
  timeMin: 50,
  summary: 'Models eat numbers, so NLP begins with turning text into vectors. Bag-of-words, TF-IDF and cosine search powered every search engine and spam filter for two decades, remain the baseline that embedding systems are measured against (BM25 is still in your RAG stack), and are the single most-asked "explain it" topic in NLP interviews.',
  goals: [
    'Convert documents into bag-of-words vectors and name exactly what information is thrown away.',
    'Compute TF-IDF by hand: why term frequency, why inverse document frequency, why the log.',
    'Build a working search engine: TF-IDF vectors + cosine similarity (Part 1 pays off).',
    'State the limits (synonyms, word order) and how embeddings/BM25 relate.',
  ],
  concept: [
    {
      h: 'Bag-of-words: text becomes a count vector',
      p: [
        'Fix a <b>vocabulary</b> — one slot per known word. A document becomes the vector of its word counts:',
        '<div class="math">"the treasure map shows treasure" → [the:1, treasure:2, map:1, shows:1, 0, 0, …]<span class="mnote">one slot per vocabulary word — typically 10,000–100,000 dimensions, almost all zeros ("sparse")</span></div>',
        'Deliberately thrown away: word ORDER ("dog bites man" = "man bites dog" — identical bags) and any notion that "ship" and "boat" are related (they\'re just different slots — orthogonal, in Part 1 language). Kept: topic-defining word usage, which for search and classification is a shockingly large fraction of the signal.',
        'On top of bags you can already build: spam filters (Naive Bayes multiplies per-word likelihood ratios — the probability lesson in production), sentiment classifiers (logistic regression on counts — last lesson in production), and search. But raw counts have two diseases the next section cures.',
      ],
    },
    {
      h: 'TF-IDF: weigh words by how much they mean',
      p: [
        'Disease #1: within a document, a word appearing 20× isn\'t 20× more topical than once (topicality saturates). Disease #2 — the big one: across the collection, words like "the"/"and"/"is" rack up giant counts while carrying zero information about <i>which</i> document you want. The cure weights each word by two factors:',
        '<div class="math">tf-idf(word, doc) = tf(word, doc) × idf(word)<br>idf(word) = log( N / df(word) )<span class="mnote">tf = count in this doc (often log-damped: 1 + log count) · N = total docs · df = docs containing the word</span></div>',
        '<b>Why idf</b>: a word in every document (df = N) gets log(1) = 0 — "the" is muted to nothing, automatically, with no hand-made stopword list. A word in 3 of 10,000 docs gets log(3333) ≈ 8.1 — a rare, pinpointing term gets amplified. <b>Why the log</b>: information theory! −log(df/N) is exactly the <i>surprise</i> (in the Shannon sense) of seeing that word in a random document — TF-IDF literally weights words by their information content. Rarity should count in bits, not in raw ratios: a 1-in-10,000 word is informative, but not 10,000× more than a 1-in-2 word.',
        'Worked micro-example (N = 4 docs; "treasure" in 2, "the" in 4, "poneglyph" in 1): idf(the) = log(4/4) = 0; idf(treasure) = log(2) ≈ 0.69; idf(poneglyph) = log(4) ≈ 1.39. A single mention of "poneglyph" outweighs two mentions of "treasure" and infinite mentions of "the". The weighting matches a librarian\'s instinct exactly.',
      ],
    },
    {
      h: 'Search = TF-IDF + cosine (Part 1, delivering as promised)',
      p: [
        'The engine: represent every document as its TF-IDF vector; represent the query the same way; rank documents by <b>cosine similarity</b> to the query. Cosine (not raw dot product) because document length must not matter — the two-ships lesson verbatim: a 400-page book and a 1-page note about poneglyphs should rank by <i>topic direction</i>, not size.',
        'This exact recipe — plus a refinement called <b>BM25</b> (a battle-tuned TF-IDF variant with saturating term frequency and length normalization) — ran web search, library search, and everything in between for ~25 years. It is still not dead: BM25 is the "keyword search" half of the hybrid retrieval in modern RAG systems (Part 7), because it does something embeddings do badly — exact rare-term matching (product codes, error strings, names). Know both; the winning production systems combine them.',
        'Known limits, which are the exam questions: <b>synonyms</b> (query "boat", document says "ship" — zero cosine; the slots are orthogonal), <b>polysemy</b> ("bank" the river edge vs the institution share one slot), <b>word order/negation</b> ("not good" ≈ "good" in a bag). Fixing these by making similar-MEANING words have similar vectors is precisely the embedding project (Part 4), and the reason it was worth inventing.',
      ],
    },
  ],
  story: {
    onePiece: {
      title: 'Robin in the Tree of Knowledge: the librarian\'s weighting',
      text: [
        'Young Robin, in Ohara\'s great library, is asked to find scrolls about the Void Century. Thousands of scrolls; no time to read them all. Her first instinct — count how often each scroll uses the query words — fails immediately: the scrolls most full of "the", "sea" and "island" are just the <i>longest</i> ones. Every scroll in a maritime library says "sea". A word that appears everywhere points nowhere.',
        'Professor Clover teaches her the librarian\'s weighting. Two questions per word: how often is it in <i>this</i> scroll (term frequency — repeated use signals real topical focus)? And in how many scrolls of the <i>whole library</i> does it appear at all (document frequency)? Words in every scroll get muted to zero; words in a handful of scrolls become beacons. "Poneglyph", appearing in three scrolls out of ten thousand, outweighs a hundred occurrences of "ancient". And when ranking, Clover compares scrolls by the <i>direction</i> of their weighted word-mix, never raw magnitude — so a one-page fragment about the Void Century beats a 400-page almanac that mentions it once in passing. That\'s cosine, dividing out the ship sizes again.',
        'Years later, when Robin instantly identifies which ruins matter on each island, she\'s running the same index in her head: rare-and-repeated terms are signal; ubiquitous terms are noise; topic is a direction, not a length. Every search box you\'ve ever typed into was Robin\'s method, industrialized.',
      ],
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Why "Bazinga" identifies Sheldon',
      text: [
        'Suppose you must identify a TBBT speaker from a transcript. Counting common words fails — everyone says "the", "okay", "you" at similar rates; those words have df = everyone, idf = 0. What identifies Sheldon is "Bazinga" — a term with document frequency ≈ 1 across all speakers, hence enormous idf. One occurrence settles it. Likewise "vintage mint-condition" flags Howard\'s collectibles talk and "Oh. My. God." flags Janice on Friends — the rare-and-characteristic vocabulary IS the fingerprint, which is why authorship-attribution tools (the ones that unmasked pseudonymous authors) are, at their core, TF-IDF plus cosine.',
      ],
    },
    why: 'Clover\'s two questions ARE the two factors: tf ("how much does this scroll lean on the word?") × idf ("how special is the word in the library?"), and the fragment-beats-almanac ranking pins why cosine, not raw counts. "Bazinga" gives you idf in one word.',
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'q', emoji: '❓', label: 'query: "void century poneglyph"', x: 50, y: 10 },
      { id: 's1', emoji: '📜', label: 'almanac (400p)', x: 18, y: 44 },
      { id: 's2', emoji: '📜', label: 'sea shanties', x: 42, y: 44 },
      { id: 's3', emoji: '📜', label: 'fragment (1p)', x: 66, y: 44 },
      { id: 's4', emoji: '📜', label: 'tide tables', x: 88, y: 44 },
      { id: 'idf', emoji: '⚖️', label: '', x: 14, y: 78 },
    ],
    actors: [
      { id: 'robin', emoji: '📖', label: 'Robin', x: 50, y: 84 },
    ],
    steps: [
      { c: 'Query arrives. First instinct: count matching words. The 400-page almanac wins — it contains EVERYTHING once, including "the" 9,000 times.', p: { s1: 'lit' }, l: { idf: 'raw counts: almanac wins?' } },
      { c: 'Clover\'s weighting: "sea" is in every scroll → idf = log(N/N) = 0. Muted. "Poneglyph" is in 3 of 10,000 → idf ≈ 8. Beacon.', p: { idf: 'lit' }, l: { idf: 'idf("sea")=0, idf("poneglyph")=8' } },
      { c: 'Re-score every scroll with tf × idf. The shanties and tide tables collapse to ~0. The almanac keeps a small score (one passing mention).', p: { s2: 'dim', s4: 'dim', s1: 'lit' } },
      { c: 'The one-page fragment REPEATS "void century" and "poneglyph" — high tf on high-idf terms. Its vector points hard at the query\'s direction.', p: { s3: 'good' }, a: { robin: [66, 66] } },
      { c: 'Rank by cosine, not magnitude: the fragment (tiny but on-topic) beats the almanac (huge but diffuse). Direction over length — the two ships again.', p: { s1: 'dim' }, l: { idf: 'cos(query, fragment) = 0.91' } },
      { c: 'That\'s a search engine: sparse vectors, information-weighted, cosine-ranked. BM25 still runs this play inside modern RAG. 🏴‍☠️', p: { q: 'good', s3: 'good' } },
    ],
  },
  tech: [
    {
      q: 'What do CountVectorizer and TfidfVectorizer actually do when I call fit_transform?',
      a: '<code>fit</code>: scan the training corpus, build the vocabulary (a word→column-index dict, after tokenizing — default is a lowercase regex for word characters — and applying options like min_df/max_df/n-gram range), and for TF-IDF also compute each column\'s idf. <code>transform</code>: for each document, count tokens into a SPARSE matrix (scipy CSR — only nonzeros stored; a 10k×50k matrix with 0.1% density fits in a few MB), then multiply columns by idf and (by default) L2-normalize each row. Two things to know cold: sklearn\'s idf is smoothed — log((1+N)/(1+df)) + 1 — so unseen/ubiquitous terms never hit exact 0 or infinity; and rows being pre-normalized means a plain dot product IS cosine similarity (the Part 1 trick, done for you). And: fit on train only — the vocabulary and idf are learned parameters; fitting them on test data is leakage.',
    },
    {
      q: 'Why does everyone L2-normalize TF-IDF rows instead of just "using cosine at query time"?',
      a: 'Same math, better engineering. Normalizing once at index time makes every later comparison a raw dot product — and dot products against a sparse matrix are one highly-optimized sparse matvec (<code>X @ q</code>), with no per-query norm computations. At web scale that\'s the difference between milliseconds and minutes. It also stabilizes downstream classifiers: document length stops being an accidental feature. The general lesson generalizes to embeddings and vector databases (they do exactly this) — normalize at write time, dot at read time.',
    },
    {
      q: 'What is BM25 and why does my RAG stack still include it in 2026?',
      a: 'BM25 is TF-IDF\'s tuned successor: tf is saturating (tf·(k+1)/(tf+k) — the 20th occurrence adds almost nothing, fixing disease #1 properly) and scores are normalized by document length against the corpus average (parameter b). Two knobs, decades of validation. It survives in RAG because it\'s <i>lexical</i>: exact matches on rare strings — "ERR_CONN_RESET_2231", "Nico Robin", part numbers, function names — where embedding models blur or have never seen the token. Hybrid retrieval (BM25 + embedding cosine, fused with reciprocal-rank fusion) beats either alone on most benchmarks, and "why keep BM25 alongside embeddings?" is now a standard AI-engineer interview question. Your answer: embeddings recall by meaning, BM25 recalls by exact rare terms; production wants both.',
    },
    {
      q: 'How do n-grams patch the word-order blindness, and what does it cost?',
      a: 'Add short sequences to the vocabulary: bigrams ("not good", "new york") and trigrams as their own slots. "Not good" then carries its own (negative) weight, distinct from "good" — the cheapest fix for negation and multi-word entities, and <code>ngram_range=(1,2)</code> is a standard accuracy bump for text classification. Costs: vocabulary explodes combinatorially (control with min_df), vectors get sparser (each specific n-gram is rarer — data hunger grows), and it\'s still fundamentally memorization of exact phrases, not understanding — "not terrible" and "hardly awful" stay unrelated. That ceiling is the cue for embeddings (Part 4).',
    },
  ],
  code: {
    title: 'Worked example — a working search engine in 30 lines (sklearn)',
    intro: 'The full Robin pipeline on a toy corpus: vectorize, normalize, cosine-rank. Read the idf values printed at the end — they ARE the lesson.',
    code: `from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

corpus = [
    "the great almanac of the sea covers every island and the void century once",
    "sea shanties and songs of the sea sung across every island",
    "the void century poneglyph fragment speaks of the void century",
    "tide tables for every island harbor in the sea",
]

vec = TfidfVectorizer()               # fit: build vocab + idf ; transform: weighted counts
X = vec.fit_transform(corpus)         # sparse matrix, rows L2-normalized by default
print(X.shape)                        # (4, ~25): 4 docs, one column per vocab word

query = ["void century poneglyph"]
q = vec.transform(query)              # SAME vocab + idf (never re-fit on queries!)
scores = cosine_similarity(q, X)[0]
for i in scores.argsort()[::-1]:
    print(f"{scores[i]:.3f}  {corpus[i][:60]}")
# the 1-line fragment wins by a mile; the almanac (mentions it once) is second

import numpy as np
idf = dict(zip(vec.get_feature_names_out(), vec.idf_))
for w in ["the", "sea", "island", "void", "poneglyph"]:
    print(f"idf({w}) = {idf[w]:.2f}")
# 'the'/'sea'/'island' ≈ 1.0 (floor: everywhere = uninformative)
# 'poneglyph' ≈ 1.92 (one doc: beacon)`,
    notes: [
      '<code>vec.transform(query)</code>, never <code>fit_transform</code> — the query must be projected into the corpus\'s learned space. Re-fitting on the query is a classic bug that silently changes the vocabulary.',
      'sklearn\'s smoothed idf floors at 1.0 rather than 0, so ubiquitous words are damped, not erased; row L2-normalization is why <code>cosine_similarity</code> here is just dot products.',
      'Try query "songs of the ocean" — zero overlap with "shanties... sea" beyond stopwords. The synonym failure, live. Hold that itch until Part 4.',
    ],
  },
  lab: {
    title: 'Lab: build TF-IDF search from scratch — Robin\'s index',
    prompt: 'Pure Python. Implement (1) <code>tf(word, doc)</code> — count of word in a tokenized doc (list of words); (2) <code>idf(word, corpus)</code> — <code>math.log(N / df)</code> over a corpus of tokenized docs (assume the word appears somewhere); (3) <code>tfidf_vector(doc, vocab, corpus)</code> — the list [tf·idf for each vocab word]; (4) <code>search(query_tokens, corpus, vocab)</code> — return the index of the highest-cosine document (reuse your Part 1 cosine, provided in the starter).',
    starter: `import math

def cosine(a, b):
    dot = sum(x*y for x, y in zip(a, b))
    na = math.sqrt(sum(x*x for x in a)); nb = math.sqrt(sum(x*x for x in b))
    return 0.0 if na == 0 or nb == 0 else dot / (na * nb)

def tf(word, doc):
    pass

def idf(word, corpus):
    # math.log(len(corpus) / number_of_docs_containing_word)
    pass

def tfidf_vector(doc, vocab, corpus):
    pass

def search(query_tokens, corpus, vocab):
    # vectorize query and every doc; return argmax cosine index
    pass
`,
    checks: [
      { re: 'def\\s+tf\\s*\\(', must: true, hint: 'Define tf(word, doc).' },
      { re: 'def\\s+idf\\s*\\(', must: true, hint: 'Define idf(word, corpus).' },
      { re: 'math\\.log', must: true, hint: 'idf needs the log — rarity counts in bits, not raw ratios.' },
      { re: 'def\\s+search', must: true, hint: 'Define search(query_tokens, corpus, vocab).' },
      { re: 'cosine\\s*\\(', must: true, hint: 'Rank with cosine — raw dot products would let long documents win by length.' },
    ],
    tests: `corpus = [
  "the sea and the island and the sea".split(),
  "void century poneglyph void century".split(),
  "the sea shanties for every island".split(),
  "the treasure of the grand line".split(),
]
vocab = sorted(set(w for d in corpus for w in d))

assert tf("void", corpus[1]) == 2
assert tf("kraken", corpus[0]) == 0
assert abs(idf("the", corpus) - math.log(4/3)) < 1e-9, "'the' is in 3 of 4 docs"
assert abs(idf("poneglyph", corpus) - math.log(4)) < 1e-9, "'poneglyph' is in 1 of 4"
assert idf("poneglyph", corpus) > idf("island", corpus) > idf("the", corpus), "rarer = higher idf"

v = tfidf_vector(corpus[1], vocab, corpus)
assert len(v) == len(vocab)
assert v[vocab.index("void")] > 0, "'void' should have positive weight in doc 1"
assert v[vocab.index("kraken")] == 0 if "kraken" in vocab else True

hit = search("void poneglyph".split(), corpus, vocab)
assert hit == 1, f"query 'void poneglyph' should retrieve doc 1, got doc {hit}"
hit2 = search("sea shanties".split(), corpus, vocab)
assert hit2 == 2, f"query 'sea shanties' should retrieve doc 2, got doc {hit2}"
print("Ohara's index is live. Robin approves of your idf.")`,
    solution: `import math

def cosine(a, b):
    dot = sum(x*y for x, y in zip(a, b))
    na = math.sqrt(sum(x*x for x in a)); nb = math.sqrt(sum(x*x for x in b))
    return 0.0 if na == 0 or nb == 0 else dot / (na * nb)

def tf(word, doc):
    return doc.count(word)

def idf(word, corpus):
    df = sum(1 for d in corpus if word in d)
    return math.log(len(corpus) / df)

def tfidf_vector(doc, vocab, corpus):
    return [tf(w, doc) * idf(w, corpus) for w in vocab]

def search(query_tokens, corpus, vocab):
    q = tfidf_vector(query_tokens, vocab, corpus)
    scores = [cosine(q, tfidf_vector(d, vocab, corpus)) for d in corpus]
    return scores.index(max(scores))`,
    notes: [
      'You just built the architecture of 25 years of information retrieval in ~20 lines. Real systems add: inverted indexes (only visit docs containing query terms), BM25\'s saturation/length tricks, and caching — engineering, not new math.',
      'The query is weighted with the CORPUS\'s idf — the query is a tiny document projected into the library\'s space. Same rule as sklearn\'s transform-not-fit.',
    ],
  },
  quiz: [
    {
      q: 'A word appears in every document of the corpus. Its idf (log N/df) is…',
      options: ['maximal', 'log(N)', '0 — the word carries no discriminating information', 'negative'],
      correct: 2,
      explain: 'df = N → log(1) = 0. TF-IDF auto-mutes stopwords with no hand-made list — the information-theoretic surprise of an always-present word is zero.',
    },
    {
      q: 'Why cosine similarity rather than raw dot product for ranking TF-IDF documents?',
      options: [
        'Cosine is faster',
        'Raw dot products let long documents win on length; cosine compares topical direction only',
        'Dot products can\'t handle sparse vectors',
        'Cosine handles synonyms',
      ],
      correct: 1,
      explain: 'The almanac problem: more words = bigger vector = bigger dot product, regardless of relevance. Cosine divides out magnitude. (Nothing handles synonyms here — that\'s embeddings.)',
    },
    {
      q: 'Query "boat", document about ships (never says "boat"). TF-IDF cosine similarity is…',
      options: ['high — they mean the same thing', 'moderate', '~0 — different slots are orthogonal; meaning plays no role', 'negative'],
      correct: 2,
      explain: 'BoW/TF-IDF vectors have one independent slot per surface form. "boat" and "ship" share no slots ⇒ orthogonal. This exact failure is the motivation for word embeddings.',
    },
    {
      q: 'Why does modern RAG often pair BM25 with embedding search?',
      options: [
        'BM25 is more accurate in general',
        'Embeddings match by meaning but blur exact rare strings (IDs, error codes, names) — BM25\'s lexical matching covers exactly that gap',
        'Embeddings are too slow',
        'BM25 handles synonyms better',
      ],
      correct: 1,
      explain: 'Complementary failure modes: semantic recall (embeddings) + exact rare-term precision (BM25), fused. Hybrid beats either alone on most retrieval benchmarks.',
    },
    {
      q: 'Calling fit_transform on your test documents (instead of transform) is wrong because…',
      options: [
        'it is slower',
        'it rebuilds vocabulary and idf from test data — leakage, plus vectors live in a different space than the trained model expects',
        'it produces dense vectors',
        'sklearn forbids it',
      ],
      correct: 1,
      explain: 'Vocabulary and idf are learned parameters (fit on train only), and transform must project new text into THAT space. Re-fitting changes column meanings entirely — predictions become garbage quietly.',
    },
  ],
  pitfalls: [
    'Fitting the vectorizer on train+test together — idf and vocabulary leak test-set statistics. Split first; fit on train; transform everything else.',
    'Comparing documents with raw counts or raw dot products and wondering why long documents dominate every ranking.',
    'Expecting TF-IDF to understand: negation ("not good"), synonyms, paraphrase — all invisible. Know the failure modes as crisply as the strengths.',
    'Letting vocabulary explode with n-grams and typos: use min_df to drop one-off tokens, or the memory and variance costs eat you.',
    'Forgetting TF-IDF matrices must stay sparse: calling <code>.toarray()</code> on a 100k-vocab corpus allocates gigabytes of zeros.',
  ],
  interview: [
    {
      q: 'Explain TF-IDF to someone who knows no ML, then justify the log in idf.',
      a: 'We score each word in each document by two multiplied factors: how often the word occurs in the document (leaning on a word repeatedly signals it\'s topical), and how rare the word is across the whole collection (a word in every document, like "the", identifies nothing; a word in three documents out of ten thousand is a beacon). The log in idf = log(N/df) makes rarity count in information units: −log(df/N) is literally the Shannon surprise of finding the word in a random document, so TF-IDF weights words by their information content. Practically the log also compresses the scale — a 1-in-10,000 word is more informative than a 1-in-2 word, but not 5,000× more, and log says "about 13× (bits)", which matches retrieval behavior empirically.',
    },
    {
      q: 'Design a simple document search system without neural networks. Walk through the pipeline and its failure modes.',
      a: 'Index time: tokenize (lowercase, strip punctuation; consider bigrams for phrases), build vocabulary with min_df to drop noise, compute smoothed idf, store documents as L2-normalized TF-IDF sparse vectors in an inverted index (term → posting list) so queries only touch documents sharing terms. Query time: project the query with the SAME vocab/idf, score candidates by dot product (= cosine, thanks to normalization) or better BM25, return top-k. Failure modes: synonyms/paraphrase (lexical mismatch — mitigate with query expansion or, honestly, add an embedding retriever), polysemy, negation/order blindness (bigrams help slightly), and vocabulary drift over time (recompute idf periodically). I\'d also mention evaluation: recall@k / MRR on labeled query-doc pairs before any tuning.',
    },
    {
      q: 'When does TF-IDF still beat sending everything to an embedding model in 2026?',
      a: 'Several real regimes: (1) exact/rare-token queries — error codes, SKUs, legal citations, function names — where embeddings blur and BM25 nails it (this is why hybrid retrieval exists); (2) latency/cost floors — sparse dot products are microseconds on CPU with no model serving, ideal for high-QPS or on-device; (3) tiny or domain-alien corpora where pretrained embedding models are out of distribution and there\'s no data to fine-tune them; (4) interpretability/auditability — you can show exactly which terms produced a match; (5) as the mandatory baseline — an embedding stack that can\'t beat tuned BM25 on your evals is negative value. Production answer: default to hybrid, let evals on your own queries pick the weights.',
    },
    {
      q: 'Your TF-IDF classifier does great offline but performance decays over months in production. Why, and what do you do?',
      a: 'Vocabulary and distribution drift. New terms appear (product names, slang, event vocabulary) that are OOV — they vanish from the vectors entirely; meanwhile idf weights computed on last year\'s corpus mis-weight today\'s words (a once-rare term going mainstream keeps its stale beacon status). The label relationship can drift too (what words indicate spam changes as spammers adapt — adversarial drift). Remedies: monitor OOV rate and score distributions as drift signals; re-fit vectorizer + model on rolling windows; keep a held-out recent-data eval separate from the original test set; for adversarial domains, shorten retraining cadence and consider hashing vectorizers (no fixed vocab to go stale). The meta-answer interviewers want: models are estimates of a distribution, and distributions move — monitoring and retraining cadence are part of the system design, not an afterthought.',
    },
  ],
};
