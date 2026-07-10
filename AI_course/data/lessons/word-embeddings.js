window.LESSONS = window.LESSONS || {};
window.LESSONS['word-embeddings'] = {
  id: 'word-embeddings',
  title: 'Word Embeddings: word2vec & the Geometry of Meaning',
  category: 'Part 4 — NLP',
  timeMin: 55,
  summary: 'Token IDs are arbitrary integers — ID 4074 is no more similar to 4075 than to 9. Embeddings fix this: every token gets a learned dense vector, positioned so that similar meanings sit close together and directions encode relationships (king − man + woman ≈ queen). This lesson covers the distributional hypothesis, how word2vec learns the geometry, and why the embedding layer is the ground floor of every LLM.',
  goals: [
    'Explain why one-hot vectors cannot carry meaning and what dense embeddings fix',
    'State the distributional hypothesis and connect it to how word2vec trains',
    'Describe skip-gram with negative sampling: what is predicted, what the loss pushes on',
    'Do vector arithmetic (analogies) and explain what directions in embedding space encode',
    'Explain the limits of static embeddings (polysemy) and what "contextual" embeddings change'
  ],
  concept: [
    {
      h: 'From arbitrary IDs to meaningful vectors',
      p: [
        'After tokenization, "ship" is ID 4074. As a number that\'s useless: 4074 isn\'t "closer" to "boat" (ID 8802) than to "sarcasm" (ID 302). The naive vector encoding — <b>one-hot</b>, a 50,000-long vector of zeros with a single 1 at position 4074 — is just the ID in costume: every pair of one-hot vectors is equally distant, their dot product is 0, cosine similarity 0. No geometry, no meaning, and Part 1\'s whole toolkit (dot products, cosine) has nothing to grab.',
        'An <b>embedding</b> gives each token a learned DENSE vector — 100 to 4096 real numbers — stored as rows of a matrix E (vocab_size × d). "Looking up token 4074" = taking row 4074 (mathematically: one-hot × E, which is why you\'ll hear "the embedding layer is a linear layer over one-hots" — but implemented as a lookup, nn.Embedding). The magic is in HOW the rows get values: they are ordinary parameters, initialized randomly and trained by gradient descent — and the training objective, chosen cleverly, forces geometry to emerge: similar words end up near each other, and meaningful RELATIONSHIPS become consistent directions.'
      ]
    },
    {
      h: 'The distributional hypothesis: meaning is company',
      p: [
        '"You shall know a word by the company it keeps" (Firth, 1957). Words with similar meanings appear in similar contexts: "ship" and "vessel" both show up near sail, cargo, harbor, crew. You\'ve used this instinct forever — encountering an unknown word ("the zoril sprayed a foul musk when cornered"), you infer its nature from its neighbors. The distributional hypothesis says context statistics are not just a CLUE to meaning — they\'re enough of a signal to LEARN meaning representations from raw text, no labels, no dictionary.',
        'That makes embedding-learning <b>self-supervised</b>: the supervision (which words co-occur) is manufactured from the text itself. This idea — turn raw text into its own training labels — is the single most important idea in modern AI: word2vec used it for word vectors, and LLM pretraining (Part 6) is the same idea scaled up ("predict the next token" is context-prediction too).'
      ]
    },
    {
      h: 'word2vec: skip-gram with negative sampling',
      p: [
        'word2vec (Mikolov, 2013) turns the hypothesis into a training task. <b>Skip-gram</b>: slide a window over the corpus; for each center word, try to predict its context words. "the ship sails at dawn", center = "ship", window ±2 → training pairs (ship→the), (ship→sails), (ship→at). The model is amusingly tiny: each word has a center vector v and a context vector u, and the predicted compatibility of a pair is just their dot product.',
        '<div class="math">P(context c | center w) ∝ exp(u_c · v_w)<span class="mnote">softmax over the whole vocabulary — dot product as compatibility score, squashed into probabilities. Familiar shape? It\'s logistic-regression-style scoring with BOTH sides learned.</span></div>',
        'Full softmax over 50k words per training pair is too slow, so the real recipe is <b>negative sampling</b>: turn it into binary classification. For the true pair (ship, sails), push u_sails·v_ship UP (σ(u·v) → 1); for k≈5 randomly sampled "negative" words (ship, quantum), (ship, sofa), push the dot products DOWN. Millions of windows later, the only way for the model to win this game is: words appearing in similar contexts get similar vectors — because they must be compatible with the same context vectors. Geometry emerges from a prediction game.',
        'The cousins: <b>CBOW</b> (predict center from averaged context — faster, slightly worse on rare words) and <b>GloVe</b> (skip the sliding window; factorize the global co-occurrence count matrix directly — dot products trained to match log co-occurrence). Different routes, same destination: vectors whose geometry mirrors co-occurrence statistics.'
      ]
    },
    {
      h: 'The geometry: neighborhoods, directions, analogies',
      p: [
        'What training produces: <b>neighborhoods</b> — nearest neighbors (by cosine, Part 1) of "ship" are boat, vessel, freighter; of "good" are great, decent, bad (! — antonyms share contexts; embeddings encode relatedness, not sentiment polarity). <b>Directions</b> — the displacement from "man" to "woman" is roughly the SAME vector as from "king" to "queen", from "actor" to "actress": a "gender direction". Same for verb tense (walk→walked ≈ swim→swam), plurality, comparative degree, even country→capital.',
        '<div class="math">v_king − v_man + v_woman ≈ v_queen<span class="mnote">the most famous equation in NLP. Solve analogies by arithmetic: take the relationship direction, apply it elsewhere, find the nearest vector (excluding the inputs — a detail your lab enforces).</span></div>',
        'Why would directions be consistent? Because co-occurrence differences are consistent: "king" and "queen" appear in nearly identical contexts EXCEPT where gendered words differ, and that systematic difference gets squeezed into a systematic offset. Caveats for interviews: analogies work best on frequent words and curated benchmarks; the honest phrasing is "linear structure often emerges", not "embeddings do algebra". And the training data\'s statistics — including its biases — are faithfully geometrized: the famous example is "doctor − man + woman" landing near "nurse" in vectors trained on 2013-era news text; bias measurement and mitigation in embeddings is a research area precisely because the geometry is real enough to matter.'
      ]
    },
    {
      h: 'The ceiling: one vector per word — and what came next',
      p: [
        'Static embeddings assign ONE vector per token type, forever. But "bank" in "river bank" and "bank account" are different meanings forced to share a single point — the vector lands on a frequency-weighted average of the senses (<b>polysemy</b> problem). Same for "play", "run" (600+ senses combined), and every context-dependent word. No amount of training fixes this within the one-vector-per-word design.',
        'The fix defines the modern era: <b>contextual embeddings</b>. Instead of a lookup table as the FINAL answer, use the lookup as layer zero and let the network TRANSFORM each token\'s vector based on its neighbors — so "bank" near "river" ends up at a different point than "bank" near "account". The machinery that does the transforming is attention (started next lesson, completed in Part 5); models like ELMo then BERT made contextual vectors standard, and in every LLM today the embedding table is just the ground floor: row 4074 is where "ship" STARTS, and 30 attention layers move it to where this-particular-"ship"-in-this-sentence belongs.',
        'Static embeddings still earn their keep where speed and simplicity win: fastText (subword-enriched word2vec) for lightweight classifiers, embedding layers in recommenders (user/item vectors — same math, no words), and as the mental model for the sentence-level embeddings that power RAG in Part 7. The concept "meaning = position in a learned vector space" is now simply how AI represents everything: words, sentences, images, code, users, products.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Vegapunk\'s chart of everyone: know a pirate by the company they keep',
      text: 'Vegapunk wants a map of every notable person in the world — not their locations, their NATURES. He has no questionnaire, no labels; all he has is twenty years of World Economy News Journal back-issues. So he does the distributional thing: two people who keep appearing in the same KINDS of articles get pinned close together on his chart. Luffy and Kid co-occur with "raid", "supernova", "escaped", "bounty increased" — close together. Nami and Bepo co-occur with "navigated", "log pose", "storm avoided" — a navigators\' cluster, far from the berserkers. Sanji and Cosette co-occur with "banquet", "recipe" — the cooks\' corner. Nobody ever TOLD the chart what a navigator is; the label-free co-occurrence statistics carved the clusters out on their own (self-supervision: the newspaper is its own teacher). Then Vegapunk notices something better than clusters: ARROWS mean things. The displacement from Luffy to Nami — captain to their navigator — is nearly the same arrow as from Law to Bepo. The arrow from Ace to Sabo matches other sworn-brother pairs. So he can ANSWER QUESTIONS BY ARITHMETIC: start at Zoro, subtract "swordsman", add "sniper" — the nearest pin is Usopp. Crew − captain + cook = Sanji. And the chart\'s one embarrassing failure teaches the final lesson: "Ms. All-Sunday" and "Nico Robin" — one person, two context-lives (Baroque Works villain vs Straw Hat archaeologist) — get ONE pin, stuck awkwardly between the assassin cluster and the scholar cluster, accurate for neither. One point per name cannot represent a person whose meaning depends on context. Vegapunk\'s fix — re-position each pin based on WHICH article you\'re currently reading — is exactly contextual embeddings, and building that machine is the next two lessons.'
    },
    sitcom: {
      show: 'TBBT',
      title: 'Sheldon learns sarcasm from co-occurrence statistics',
      text: 'Sheldon cannot detect sarcasm from tone — so he learns it distributionally. He starts logging every utterance in the apartment with its context: "Penny said \'great\' after Leonard spilled her coffee — flagged. Howard said \'genius move\' after Raj locked the keys in the car — flagged." After a season of data, his notebook has discovered that sarcastic "great" keeps company with disasters while sincere "great" keeps company with actual good news — same word, two clusters of contexts. When he finally deploys his knowledge ("I believe that was sarcasm, because \'nice going\' co-occurred with a dropped pizza"), he\'s right — not because he FEELS the sarcasm but because he positioned the phrase by its statistical neighbors, which is precisely how word2vec knows "ship" from "sarcasm" without feeling either. His remaining failure is the polysemy ceiling: his notebook gives "great" ONE final verdict, so borderline cases confuse him — what he\'d need is a vector that MOVES depending on the current sentence. (Leonard\'s summary: "You built word2vec out of index cards." Sheldon: "I built it BETTER. I have color coding.")'
    },
    why: 'Vegapunk\'s chart carries every load-bearing idea: pins placed by article co-occurrence = distributional hypothesis; no labels needed = self-supervision; the captain→navigator arrow reused across crews = analogy directions (king − man + woman); Robin\'s one awkward pin for two identities = polysemy, the limit that motivates contextual embeddings. If an interviewer says "explain word2vec", describe the chart: place people so that co-occurrence predicts proximity, and relationships become consistent arrows.'
  },
  storyAnim: {
    title: 'Pinning the world onto Vegapunk\'s chart',
    h: 250,
    props: [
      { id: 'news', emoji: '📰', label: '20 years of newspapers', x: 10, y: 12 },
      { id: 'navcluster', emoji: '🧭', label: 'navigator cluster', x: 22, y: 42 },
      { id: 'fightcluster', emoji: '⚔️', label: 'fighter cluster', x: 75, y: 42 },
      { id: 'arrow', emoji: '➡️', label: 'captain→navigator arrow', x: 48, y: 25 }
    ],
    actors: [
      { id: 'nami', emoji: '🍊', label: 'Nami', x: 8, y: 60 },
      { id: 'bepo', emoji: '🐻‍❄️', label: 'Bepo', x: 8, y: 80 },
      { id: 'zoro', emoji: '⚔️', label: 'Zoro', x: 92, y: 60 },
      { id: 'robin', emoji: '🌸', label: 'Robin / Ms. All-Sunday', x: 92, y: 80 }
    ],
    steps: [
      { c: 'No labels, no questionnaire — just co-occurrence. Vegapunk reads every article and pins people who share contexts near each other.', p: { news: 'lit' } },
      { c: 'Nami co-occurs with "log pose", "storm", "course plotted"… so does Bepo. Their pins drift together: the navigator cluster forms with nobody defining "navigator".', a: { nami: [20, 45], bepo: [26, 50] }, p: { navcluster: 'lit' } },
      { c: 'Zoro co-occurs with "duel", "blades", "bounty" — he lands across the chart with Kid and Killer. Distance on the chart = difference in the company you keep.', a: { zoro: [76, 48] }, p: { fightcluster: 'lit' } },
      { c: 'Directions mean things: the arrow Luffy→Nami (captain→navigator) matches Law→Bepo. Apply it from any captain and land near their navigator: analogy by arithmetic.', p: { arrow: 'good' }, l: { arrow: 'v_Law + (v_Nami − v_Luffy) ≈ v_Bepo' } },
      { c: 'The failure: Robin has TWO context-lives — assassin articles and archaeologist articles — but only ONE pin. It lands between clusters, wrong for both. Polysemy.', a: { robin: [55, 55] }, p: { fightcluster: 'dim', navcluster: 'dim' }, l: { arrow: 'one pin per name = polysemy problem' } },
      { c: 'The next machine must move each pin per-article: "Robin, in THIS story, is a scholar." A vector that shifts with context — that is attention\'s job, next lesson.', a: { robin: [40, 70] }, p: { news: 'good' } }
    ]
  },
  tech: [
    {
      q: 'What is nn.Embedding actually — and why is it equivalent to a linear layer on one-hots?',
      a: 'nn.Embedding(vocab, d) allocates a vocab×d matrix of ordinary trainable parameters and implements forward(ids) as a row lookup — ids [B, T] → vectors [B, T, d]. Mathematically, selecting row i equals multiplying the matrix by a one-hot vector for i, so the layer IS a linear layer whose input happens to be one-hot — but the lookup implementation skips materializing 50,000-dim vectors of zeros, turning O(vocab·d) into O(d) per token. Consequences: gradients only flow to the rows actually used in the batch (sparse updates — rare tokens train rarely, the glitch-token connection from tokenization), and the table dominates parameter counts for small models (50k × 512 = 25M parameters before any "real" layer). In LLMs the same table often serves twice: tied input/output embeddings use E for lookup and Eᵀ inside the final softmax, saving memory and (empirically) helping quality.'
    },
    {
      q: 'Why does negative sampling work — and how is it different from the softmax it replaces?',
      a: 'The full skip-gram softmax computes exp(u_c·v_w) normalized over ALL 50k context vectors per training pair — the denominator is the killer. Negative sampling swaps the multiclass problem ("which word, out of everyone, is the context?") for a few binary ones ("is (ship, sails) a real pair? is (ship, sofa)?") — logistic losses on 1 positive + k≈5 sampled negatives, so each update touches 6 vectors instead of 50,000. It\'s not an unbiased approximation of the softmax — it optimizes a different objective (related to noise-contrastive estimation) — but it still forces the geometry we want: true co-occurrers get aligned vectors, random pairs get repelled. Two practical details with outsized effect: negatives are drawn ∝ frequency^0.75 (damping "the" without ignoring it), and frequent-word SUBSAMPLING randomly drops very common center words. This positive-vs-sampled-negatives pattern is now everywhere under the name contrastive learning — sentence embedders and CLIP (Part 7\'s retrieval models) train exactly this way.'
    },
    {
      q: 'Why does every word get TWO vectors (center v and context u), and which do we keep?',
      a: 'Using one vector per word would make a word predict ITSELF as its own context whenever w appears near w — and more subtly, the dot product v_w·v_w is always large, biasing self-similarity into the objective. Separating roles ("word as the thing being described" vs "word as evidence in a context") gives the optimizer freedom: v_ship must align with u_sails and u_harbor — not with v_sails. After training, standard practice keeps v (or averages v+u; both work). The deeper pattern is worth flagging in interviews: giving the same object different representations for different ROLES — asking vs being-asked-about — is exactly the query/key separation in attention (Part 5). word2vec\'s u/v split is the ancestor of Q/K.'
    },
    {
      q: 'How are embeddings evaluated, and what should I actually use in 2026 if I need word vectors?',
      a: 'Intrinsic evaluations: word-similarity benchmarks (correlate cosine with human ratings — WordSim-353, SimLex) and analogy accuracy (the king−man+woman suites) — quick, but they don\'t guarantee downstream usefulness. Extrinsic (the one that matters): plug the vectors into your real task — classifier, retrieval, NER — and measure the end metric. Bias probes (WEAT and successors) measure unwanted geometry. What to use today: for word-LEVEL needs, fastText (word2vec + character n-grams, so misspellings and rare words get sensible vectors compositionally) remains the strong lightweight choice; for sentence/passage-level semantics — the common case, especially RAG — use a contextual sentence-embedding model (the sentence-transformers family or API embedding endpoints), which run text through a transformer and pool. The word2vec concepts transfer wholesale: cosine for similarity, contrastive training, nearest-neighbor search — Part 7\'s vector databases are this lesson at production scale.'
    }
  ],
  code: {
    title: 'Training word2vec on your own corpus in eight lines',
    intro: 'gensim makes the whole pipeline — windows, negative sampling, the works — a constructor call. Run locally (pip install gensim), then spend your time where the learning is: interrogating the geometry.',
    code: `from gensim.models import Word2Vec
from gensim.utils import simple_preprocess

# corpus: any iterable of tokenized sentences — here, One Piece plot summaries
sentences = [simple_preprocess(line) for line in open("onepiece_plots.txt")]

model = Word2Vec(
    sentences,
    vector_size=100,   # d: embedding dimension
    window=5,          # context window: ±5 words
    sg=1,              # 1 = skip-gram, 0 = CBOW
    negative=5,        # k negative samples per positive
    min_count=5,       # ignore words seen < 5 times
    epochs=20,
)

wv = model.wv                                    # the learned lookup table
print(wv.most_similar("nami"))                   # navigators & weather terms expected
print(wv.similarity("zoro", "sword"))            # high
print(wv.similarity("zoro", "cooking"))          # low
print(wv.most_similar(positive=["nami", "cook"], negative=["navigator"]))
#                     ≈ nami − navigator + cook → sanji  (analogy arithmetic)

vec = wv["luffy"]                                # a plain 100-dim numpy array
print(vec.shape, float(vec @ wv["ace"] /         # cosine, by hand, Part 1 style
      ((vec**2).sum()**0.5 * (wv["ace"]**2).sum()**0.5)))`,
    notes: [
      'vector_size, window, negative — every hyperparameter maps to a concept from this lesson. Small windows (±2) bias toward syntactic similarity; large (±10) toward topical.',
      'min_count matters more than it looks: words seen twice get garbage vectors (two gradient updates!) that pollute nearest-neighbor lists. Prune, or use fastText for the tail.',
      'most_similar uses cosine on the stored table — no model inference at all. Static embeddings are a lookup at serving time, which is why they\'re still chosen when latency budgets are brutal.',
      'Swap the file for your own domain text (support tickets, papers): domain-trained vectors routinely beat generic ones on in-domain tasks — a cheap, underused win.'
    ]
  },
  lab: {
    title: 'Build the geometry: co-occurrence vectors, neighbors, analogies',
    prompt: 'Two acts, pure Python. ACT 1 — the distributional hypothesis, mechanically: implement <code>cooc_vectors(sentences, vocab)</code> — for each vocab word, a vector of how often each OTHER vocab word appears in the same sentence (counts ordered by the vocab list; a word\'s count with itself stays 0). ACT 2 — the geometry: with dense vectors provided in the tests, implement <code>cosine(a, b)</code>, <code>nearest(word, vectors, exclude)</code> — the non-excluded word whose vector is most cosine-similar — and <code>analogy(a, b, c, vectors)</code> — the word nearest to (v_b − v_a + v_c), excluding a, b, c. Solve king − man + woman = queen with arithmetic you wrote yourself.',
    starter: `import math

def cooc_vectors(sentences, vocab):
    # sentences: list of lists of words. vocab: list of words.
    # return {w: [count of co-occurrence with each vocab word, in vocab order]}
    # (same-sentence counts; w with itself stays 0)
    ...

def cosine(a, b):
    ...

def nearest(word, vectors, exclude=()):
    # highest-cosine other word; skip anything in exclude and word itself
    ...

def analogy(a, b, c, vectors):
    # target = v_b - v_a + v_c ; return nearest word to target, excluding a, b, c
    ...`,
    checks: [
      { re: 'def\\s+cooc_vectors\\s*\\(', must: true, hint: 'Define cooc_vectors(sentences, vocab) — Act 1.', pass: 'cooc_vectors defined' },
      { re: 'def\\s+analogy\\s*\\(', must: true, hint: 'Define analogy(a, b, c, vectors) — Act 2.', pass: 'analogy defined' },
      { re: 'cosine\\s*\\(', flags: 'g', must: true, hint: 'nearest() should rank by your cosine — direction, not magnitude.', pass: 'cosine reused' },
      { re: 'import\\s+(numpy|gensim)', must: false, hint: 'Lists and loops — feel the geometry by hand once.', pass: 'Pure Python' }
    ],
    tests: `# ---- Act 1: co-occurrence IS similarity ----
sents = [
  "nami plots the course".split(),
  "bepo plots the course".split(),
  "nami reads the storm".split(),
  "bepo reads the storm".split(),
  "zoro swings the sword".split(),
  "zoro sharpens the sword".split(),
]
vocab = ["nami", "bepo", "zoro", "plots", "reads", "swings", "sharpens", "course", "storm", "sword"]
V = cooc_vectors(sents, vocab)
assert V["nami"][vocab.index("plots")] == 1 and V["nami"][vocab.index("course")] == 1
assert V["nami"][vocab.index("nami")] == 0, "self-count stays 0"
# nami and bepo share contexts -> similar vectors; zoro does not
assert cosine(V["nami"], V["bepo"]) > 0.9, f"navigators should match: {cosine(V['nami'], V['bepo'])}"
assert cosine(V["nami"], V["zoro"]) < 0.4, f"navigator vs swordsman: {cosine(V['nami'], V['zoro'])}"

# ---- Act 2: directions encode relationships ----
E = {
  "king":  [1.0, 1.0, 0.0],   # [royalty, male, female]
  "queen": [1.0, 0.0, 1.0],
  "man":   [0.0, 1.0, 0.0],
  "woman": [0.0, 0.0, 1.0],
  "boy":   [0.0, 0.9, 0.1],
  "girl":  [0.0, 0.1, 0.9],
  "throne":[0.9, 0.5, 0.5],
}
assert nearest("man", E, exclude=("king","queen")) == "boy"
assert analogy("man", "king", "woman", E) == "queen", "the most famous equation in NLP"
assert analogy("boy", "man", "girl", E) == "woman"
print("king - man + woman = queen. The chart works.")`,
    runnable: true,
    solution: `import math

def cooc_vectors(sentences, vocab):
    idx = {w: i for i, w in enumerate(vocab)}
    V = {w: [0] * len(vocab) for w in vocab}
    for sent in sentences:
        present = [w for w in sent if w in idx]
        for w in present:
            for c in present:
                if c != w:
                    V[w][idx[c]] += 1
    return V

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return 0.0 if na == 0 or nb == 0 else dot / (na * nb)

def nearest(word, vectors, exclude=()):
    target = vectors[word]
    best, best_sim = None, -2.0
    for w, v in vectors.items():
        if w == word or w in exclude:
            continue
        s = cosine(target, v)
        if s > best_sim:
            best, best_sim = w, s
    return best

def analogy(a, b, c, vectors):
    va, vb, vc = vectors[a], vectors[b], vectors[c]
    target = [x - y + z for x, y, z in zip(vb, va, vc)]
    best, best_sim = None, -2.0
    for w, v in vectors.items():
        if w in (a, b, c):
            continue
        s = cosine(target, v)
        if s > best_sim:
            best, best_sim = w, s
    return best`,
    notes: [
      'Act 1 is the distributional hypothesis with no learning at all — raw counts already make Nami and Bepo similar. word2vec\'s achievement is compressing those sparse count vectors into small dense ones that generalize (and GloVe makes that compression explicit: factorize the count matrix).',
      'The exclude parameter in analogy() isn\'t pedantry: v_b − v_a + v_c is usually closest to v_b or v_c themselves; every real analogy benchmark excludes the inputs, and forgetting this is a classic implementation gotcha.',
      'Design note in the toy vectors: dimensions are interpretable ([royalty, male, female]) so the arithmetic is transparent. Real embedding dimensions are NOT interpretable individually (Chandler\'s job again) — only distances and directions carry meaning.'
    ]
  },
  quiz: [
    {
      q: 'Why are one-hot vectors useless as word representations?',
      options: ['Every pair is equidistant with dot product 0 — no similarity structure exists for models or cosine to use', 'They are too small to store meaning', 'They cannot be fed to neural networks', 'They only work for English'],
      correct: 0,
      explain: 'One-hots are IDs in vector costume: orthogonal, all pairwise-identical distances. Embeddings replace them with dense learned vectors whose geometry encodes similarity.'
    },
    {
      q: 'The distributional hypothesis states:',
      options: ['Words that occur in similar contexts have similar meanings — so context statistics suffice to learn meaning representations', 'Word frequency follows a power law', 'Every word has exactly one meaning per context', 'Meaning is distributed randomly across dimensions'],
      correct: 0,
      explain: '"Know a word by the company it keeps." It\'s the license for self-supervised learning from raw text — word2vec, GloVe, and LLM pretraining all cash this same check.'
    },
    {
      q: 'In skip-gram with negative sampling, one training update on the pair (ship, sails) does what?',
      options: ['Pushes u_sails·v_ship up (real pair → 1) and pushes dot products with a few random words down', 'Computes a softmax over the entire vocabulary', 'Averages the two word vectors', 'Increments a co-occurrence count matrix'],
      correct: 0,
      explain: 'Binary classification: real pair vs k sampled fakes — 6 vectors touched instead of 50,000. Geometry emerges because co-occurring words must align with the same context vectors.'
    },
    {
      q: 'v_king − v_man + v_woman lands near v_queen because:',
      options: ['Systematic co-occurrence differences (gendered contexts) become consistent displacement directions in the learned space', 'The training data contained the sentence "king minus man plus woman equals queen"', 'Embedding dimensions are hand-labeled with gender', 'Cosine similarity is symmetric'],
      correct: 0,
      explain: 'king/queen contexts differ the same way man/woman contexts do, so the offset is shared. Linear structure emerges from consistent statistics — nobody programs the arithmetic.'
    },
    {
      q: 'What limitation of static embeddings do contextual embeddings (BERT-style) fix?',
      options: ['Polysemy: one vector per word forces "bank" (river) and "bank" (money) onto the same point; contextual models re-compute each token\'s vector from its sentence', 'Static embeddings cannot use cosine similarity', 'Static embeddings require labeled data', 'Contextual embeddings eliminate the need for tokenization'],
      correct: 0,
      explain: 'Vegapunk\'s one pin for Robin/Ms. All-Sunday. Contextual models keep the lookup as layer zero, then let attention move each occurrence to where THIS usage belongs.'
    }
  ],
  pitfalls: [
    'Expecting antonym-awareness. "good" and "bad" share contexts, so their embeddings are NEIGHBORS. Embeddings encode relatedness/substitutability, not sentiment or logic — a sentiment classifier needs more than raw proximity.',
    'Comparing embeddings from two different training runs or models directly. Spaces are defined up to rotation — vectors only mean something RELATIVE to their own space. Aligning spaces is its own technique (Procrustes); naive cross-space cosine is noise.',
    'Skipping the exclude-inputs rule in analogy code, then reporting inflated accuracy. b − a + c is nearest to b or c themselves most of the time.',
    'Feeding averaged word2vec vectors as "sentence embeddings" for anything nuanced. Averaging destroys word order and negation ("not good" ≈ "good"). Use a proper sentence-embedding model for retrieval/RAG.',
    'Ignoring embedded bias in production systems. Occupation–gender associations from training text are measurable geometry (WEAT); resume-screening or search systems inherit them silently. Audit before shipping.',
    'Treating the analogy demo as the point. It\'s a diagnostic curiosity; the point of embeddings is downstream: features for classifiers, retrieval by cosine, and the ground floor of every transformer.'
  ],
  interview: [
    {
      q: 'Explain word2vec to someone who knows neural networks but not NLP.',
      a: 'word2vec learns a vector per word such that geometry mirrors meaning, using no labels — just co-occurrence. Training task (skip-gram): slide a window over text; from each center word, predict its neighbors. Score a (center, context) pair by the dot product of their vectors; train with negative sampling — logistic loss pushing real pairs\' dot products up and k random pairs\' down — so each update is cheap (touches ~6 vectors, not the whole vocabulary). Why geometry emerges: two words appearing in the same kinds of contexts must both align with the same context vectors, which forces them near each other; systematic context DIFFERENCES (male vs female contexts) become consistent displacement directions, which is why king − man + woman ≈ queen. The result is a lookup table where cosine similarity = distributional similarity. Its ceiling: one static vector per word can\'t represent polysemy ("bank"), which is what contextual models (BERT onward) fixed by re-computing each token\'s vector from its sentence via attention.'
    },
    {
      q: 'What\'s the difference between static and contextual embeddings, and when would you still use static ones?',
      a: 'Static (word2vec, GloVe, fastText): one fixed vector per vocabulary entry, produced by a lookup — training bakes all of a word\'s uses into a single point, so senses average together and word order is invisible to the representation. Contextual (ELMo, BERT, all LLMs): the lookup is only layer zero; a transformer then recomputes every token\'s vector as a function of the whole sentence, so "bank" near "river" and near "account" produce different vectors, and the same architecture yields sentence/passage embeddings via pooling. Contextual wins on essentially every quality benchmark. Static still earns its place when: latency/compute budgets forbid a transformer forward pass per query (a lookup is ~free — high-QPS ranking features, autocomplete); vocabulary items aren\'t natural language (product IDs, users in recommenders — nn.Embedding trained end-to-end IS a static embedding); tiny-data domain classifiers with fastText; or interpretability/simplicity requirements. Also worth saying: inside every LLM sits a static embedding table — the contextual model is static-embedding-plus-transformer, not a replacement for the concept.'
    },
    {
      q: 'How would you build sentence embeddings for a semantic search feature, and why is averaging word vectors not enough?',
      a: 'Averaging word2vec vectors fails on three counts: word order vanishes ("dog bites man" = "man bites dog"), negation and modifiers wash out ("not helpful" lands near "helpful"), and common words dominate the mean unless you re-weight (TF-IDF-weighted averaging helps but only patches). The standard solution: a transformer-based sentence encoder trained contrastively — e.g. the sentence-transformers family — where a model is fine-tuned so that paraphrase/duplicate pairs get high cosine and unrelated pairs low (the negative-sampling idea at sentence scale, often with in-batch negatives). Pipeline: encode the corpus offline into vectors, index them for approximate nearest-neighbor search (a vector database), encode queries at request time, retrieve top-k by cosine, optionally re-rank with a cross-encoder for precision. Evaluation: retrieval metrics (recall@k, MRR) on labeled query-document pairs from YOUR domain — public benchmark rank doesn\'t guarantee domain fit. This exact stack is the retrieval half of RAG, covered in Part 7.'
    },
    {
      q: 'Your model uses pretrained embeddings and produces biased associations (e.g., gendered occupation rankings). What\'s happening and what do you do?',
      a: 'Cause: embeddings are compressed co-occurrence statistics of the training corpus, and the corpus encodes societal biases — "nurse" co-occurring with female pronouns more than male ones becomes literal geometry, measurable with association tests like WEAT (cosine-based analogs of the implicit-association test). The model didn\'t add bias; it faithfully geometrized it. Responses, in order of rigor: (1) Measure first — quantify the specific associations affecting your task; bias is task-relative. (2) Data-level: curate/rebalance the training corpus or fine-tune embeddings on debiased in-domain data. (3) Representation-level: post-hoc debiasing (e.g., projecting out an identified "gender direction") — but cite the known caveat (Gonen & Goldberg\'s "Lipstick on a Pig"): bias is distributed, and removing one direction hides more than it removes. (4) System-level, usually most effective: constrain the DOWNSTREAM decision — fairness-aware ranking, blocked attributes, human review on consequential outputs — and monitor disparate impact in production. In an interview, the winning shape of the answer is: bias is a measurable property of learned geometry, mitigation exists at data/representation/system levels, and representation-level fixes alone are provably insufficient.'
    }
  ]
};
