window.LESSONS = window.LESSONS || {};
window.LESSONS['vectors-cosine'] = {
  id: 'vectors-cosine',
  title: 'Vectors, Dot Products & Cosine Similarity',
  category: 'Part 1 — Math Prerequisites',
  timeMin: 45,
  summary: 'The single most reused idea in this entire course. Word embeddings, attention scores, RAG retrieval, recommendation engines — all of them are literally the math on this page: vectors, dot products, and the angle between them.',
  goals: [
    'Say what a vector is in ML terms (a list of numbers = a point = an arrow) and move between the three views freely.',
    'Compute a dot product and a norm by hand and with NumPy.',
    'Derive cosine similarity from the dot product, compute it, and explain why it ignores magnitude.',
    'Explain why "similar meaning = high cosine similarity" is the foundation of embeddings, attention and RAG.',
  ],
  concept: [
    {
      h: 'A vector is three things at once',
      p: [
        'A <b>vector</b> is just an ordered list of numbers: <code>v = [2, 3]</code>. That\'s the whole definition. But you should learn to see it three ways simultaneously:',
        '<ul><li><b>A list of measurements</b> — e.g. a document described by word counts, a user described by (age, income, clicks). Each slot ("dimension") is one feature.</li><li><b>A point in space</b> — [2, 3] is the point 2 across, 3 up. With 768 numbers it\'s a point in 768-dimensional space; you can\'t picture it, but ALL the 2-D formulas still work unchanged. That is the great trick of linear algebra.</li><li><b>An arrow from the origin</b> — with a <i>direction</i> and a <i>length</i>. This view is where "similarity = small angle" comes from.</li></ul>',
        'In modern AI, <b>everything gets turned into a vector</b>: a word, a sentence, a picture, a user, a song. The whole game of "embeddings" (Part 4) is: design the vector-making function so that <i>similar things land near each other</i>. Once things are vectors, comparing meaning reduces to comparing arrows — which is this lesson.',
      ],
    },
    {
      h: 'Length (norm) and the dot product',
      p: [
        'The <b>norm</b> (length) of a vector is Pythagoras, generalized to any number of dimensions:',
        '<div class="math">‖v‖ = √(v₁² + v₂² + … + vₙ²)<span class="mnote">e.g. ‖[3, 4]‖ = √(9+16) = 5</span></div>',
        'The <b>dot product</b> of two vectors multiplies matching slots and sums:',
        '<div class="math">a · b = a₁b₁ + a₂b₂ + … + aₙbₙ<span class="mnote">e.g. [2, 3] · [4, 1] = 2·4 + 3·1 = 11</span></div>',
        'Two ways to read the result. <b>Algebraic:</b> it\'s a "matching score" — the sum is large when the vectors have big values in the <i>same</i> slots (they agree), near zero when their big values are in different slots (unrelated), and negative when one is positive where the other is negative (they oppose). Sit with this one — it\'s exactly how attention will decide "which words should look at which words" in Part 5.',
        '<b>Geometric:</b> there is a theorem (worth memorizing) that connects the dot product to the angle θ between the arrows:',
        '<div class="math">a · b = ‖a‖ ‖b‖ cos θ</div>',
        'So the dot product = (length of a) × (length of b) × (how aligned they are). cos θ is +1 for same direction, 0 for perpendicular (90°), −1 for opposite. Perpendicular vectors ("orthogonal") have dot product 0 — in ML-speak, they share no information.',
      ],
    },
    {
      h: 'Cosine similarity: divide out the lengths',
      p: [
        'Rearrange the theorem and you get <b>cosine similarity</b> — the alignment score with the lengths divided out:',
        '<div class="math">cos θ = (a · b) / (‖a‖ ‖b‖)<span class="mnote">always in [−1, +1]; for non-negative data (like word counts) in [0, 1]</span></div>',
        'Why divide out the lengths? Because in most ML uses, <b>magnitude is a nuisance, direction is the meaning</b>. A 10,000-word article about pirates and a 100-word note about pirates have wildly different word-count vectors by length — but nearly the same <i>direction</i> (same words in the same proportions). Cosine says "same topic"; raw dot product or Euclidean distance would say "totally different" just because one is longer.',
        'Worked example you should verify by hand — three documents as tiny word-count vectors over the vocabulary <code>[pirate, treasure, physics]</code>:',
        '<div class="math">d₁ = [4, 2, 0] &nbsp; d₂ = [2, 1, 0] &nbsp; d₃ = [0, 1, 3]<br>cos(d₁,d₂) = (4·2+2·1+0)/(√20·√5) = 10/10 = <b>1.0</b><br>cos(d₁,d₃) = (0+2+0)/(√20·√10) ≈ 2/14.14 ≈ <b>0.14</b><span class="mnote">d₂ is d₁ scaled by ½ — identical direction, perfect similarity. d₃ barely overlaps.</span></div>',
        'This exact computation — with smarter vectors — is: TF-IDF document search (Part 2), embedding search / RAG retrieval (Part 7), recommendation ("users with similar taste vectors"), and the attention score inside every transformer (Part 5, where the un-normalized dot product is used and the scaling is handled differently — you\'ll see why).',
      ],
    },
    {
      h: 'Distance vs similarity — know both, know when',
      p: [
        '<b>Euclidean distance</b> is the straight-line gap between the points: ‖a − b‖. It cares about magnitude AND direction. Use it when the scale of features is meaningful (physical measurements, k-means in Part 2).',
        '<b>Cosine similarity</b> cares only about direction. Use it when vectors represent <i>content/meaning</i> and length reflects irrelevant stuff like document size or how "loud" a feature is.',
        'Useful bridge: for vectors normalized to length 1 (common for embeddings), the two agree — ‖a−b‖² = 2 − 2cosθ — so ranking by cosine similarity and ranking by Euclidean distance give the <i>same order</i>. That\'s why vector databases let you pick either and why embedding models often ship pre-normalized vectors.',
      ],
    },
  ],
  story: {
    onePiece: {
      title: 'Nami\'s two-ships test: same course, different speed',
      text: [
        'Off Loguetown, Nami watches two ships on the horizon: a massive Marine galleon plowing along at full sail, and a tiny fishing dinghy puttering slowly. Usopp panics — "they\'re completely different, nothing alike!" Nami draws both as arrows on her chart: each ship\'s velocity — direction and speed. The galleon\'s arrow is huge; the dinghy\'s is short. "Length is just speed," she says. "Look at the <i>angle</i> between the arrows." The two arrows point almost exactly the same way: both ships are heading for Reverse Mountain. Same course. The Marine ship being 20× faster doesn\'t change <i>where it\'s going</i>.',
        'Then she marks a third ship, a luxury liner, moving fast — its huge arrow points 90° away, toward Loguetown port. Big arrow, impressive speed, completely different destination: angle 90°, cos = 0, zero course similarity.',
        'Nami\'s trick is cosine similarity: divide out the arrow lengths (speeds) and compare pure direction. A long pirate-history book and a tweet about pirates are the galleon and the dinghy — different sizes, same heading. When a vector database "finds relevant documents", it is running Nami\'s two-ships test a million times a second.',
      ],
    },
    sitcom: {
      show: 'Friends',
      title: 'Joey\'s "identical" recipes',
      text: [
        'Monica tastes two batches of sauce: one giant stockpot Joey made for the whole building, one tiny saucepan for himself. Ross insists they\'re "totally different amounts, Joey, you can\'t compare them." Monica rolls her eyes: proportions, Ross. Both are 4 parts tomato, 2 parts garlic, 1 part basil — the recipe <i>vector</i> points the same way; one is just scaled up 20×. Same direction = same recipe = same taste. Meanwhile Rachel\'s trifle-with-beef "dessert" has ingredients in proportions no other dessert points anywhere near — its angle to every real dessert is enormous, no matter what serving size you make.',
        'Cosine similarity is Monica\'s palate: compare the proportions (direction), ignore the batch size (magnitude).',
      ],
    },
    why: 'Angle-not-length is the one idea you must be able to retrieve instantly for the rest of the course. Two ships on the same heading (or two pot sizes of one recipe) gives you a picture for "scaling a vector doesn\'t change its meaning" — which is precisely what cosine similarity formalizes.',
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'compass', emoji: '🧭', label: 'Nami\'s chart', x: 8, y: 12 },
      { id: 'dest', emoji: '⛰️', label: 'Reverse Mountain', x: 88, y: 12 },
      { id: 'port', emoji: '🏙️', label: 'Loguetown port', x: 88, y: 82 },
      { id: 'score', emoji: '📐', label: 'cos θ = ?', x: 8, y: 82 },
    ],
    actors: [
      { id: 'galleon', emoji: '🚢', label: 'Galleon (fast)', x: 30, y: 30 },
      { id: 'dinghy', emoji: '🛶', label: 'Dinghy (slow)', x: 26, y: 55 },
      { id: 'liner', emoji: '🛳️', label: 'Liner', x: 30, y: 78 },
    ],
    steps: [
      { c: 'Three ships. Usopp sees chaos. Nami draws each ship\'s velocity as an arrow: direction + speed.', l: { score: 'cos θ = ?' } },
      { c: 'The galleon races toward Reverse Mountain — a LONG arrow (fast).', a: { galleon: [55, 22] }, p: { compass: 'lit' } },
      { c: 'The dinghy crawls… toward Reverse Mountain too — a short arrow, SAME direction.', a: { dinghy: [40, 48] } },
      { c: 'Divide out the lengths: pure headings. Angle between galleon and dinghy ≈ 0°. cos 0° = 1.0 → same course!', p: { dest: 'good' }, l: { score: 'cos θ ≈ 1.0' }, a: { galleon: [70, 16], dinghy: [52, 42] } },
      { c: 'The liner is fast AND shiny — but pointed at Loguetown port. 90° off the others.', a: { liner: [60, 80] }, p: { port: 'lit' } },
      { c: 'cos 90° = 0 → zero course similarity, no matter how big its arrow is. Magnitude is speed; direction is meaning.', l: { score: 'cos θ = 0' }, p: { port: 'bad', dest: 'good' } },
      { c: 'Embedding search = Nami\'s test at scale: your query is a ship; the database returns the documents sailing the same way. 🏴‍☠️', p: { compass: 'good' }, l: { score: 'similarity!' } },
    ],
  },
  tech: [
    {
      q: 'Why does NumPy exist, and what does np.array actually give me over a Python list?',
      a: [
        'A Python list is an array of <i>pointers</i> to scattered number-objects; every <code>+</code> walks pointers and dispatches types — slow. <code>np.array([2,3])</code> stores the raw numbers <b>contiguously in memory as C doubles</b>, and operations like <code>a + b</code> or <code>a @ b</code> run a single compiled C loop over that memory (often using SIMD instructions that add 4–8 numbers per CPU cycle). Same math, ~100× faster, and the code reads like the formula.',
        'This style — "write the whole-array formula, let C do the loop" — is called <b>vectorization</b>. Rule of thumb for the rest of the course: if you wrote <code>for</code> over numbers in NumPy/PyTorch code, there\'s probably a faster one-liner.',
      ],
    },
    {
      q: 'What\'s the difference between np.dot(a, b), a @ b, and np.matmul?',
      a: 'For 1-D vectors, all three compute the same dot product. <code>@</code> is just operator syntax for <code>np.matmul</code>. Differences appear for higher dimensions: <code>matmul/@</code> treats stacks of matrices as batches (what deep learning wants), while <code>np.dot</code> has older, quirkier broadcasting rules. Modern convention: use <code>@</code> everywhere. And <code>np.linalg.norm(v)</code> is literally <code>np.sqrt(v @ v)</code> — the norm is the square root of a vector\'s dot product with itself.',
    },
    {
      q: 'Where does a·b = ‖a‖‖b‖cos θ actually come from?',
      a: 'From the law of cosines on the triangle formed by a, b, and a−b: ‖a−b‖² = ‖a‖² + ‖b‖² − 2‖a‖‖b‖cos θ. Expand the left side algebraically: ‖a−b‖² = (a−b)·(a−b) = ‖a‖² + ‖b‖² − 2(a·b). Set the two expansions equal, cancel, and you get a·b = ‖a‖‖b‖cos θ. So the geometric meaning isn\'t an extra assumption — it falls straight out of Pythagoras generalized. This also proves cosine similarity is always in [−1, 1] (since cos is).',
    },
    {
      q: 'In 768 dimensions, does "angle" even mean anything?',
      a: 'Yes — the formula cos θ = a·b/(‖a‖‖b‖) is <i>defined</i> in any dimension and always lands in [−1,1] (guaranteed by the Cauchy–Schwarz inequality), so the 2-D intuition transfers. One genuinely new high-dimensional phenomenon to know for interviews: two <i>random</i> vectors in high dimensions are almost always nearly orthogonal (cos ≈ 0). So cosine 0.3 between two 768-d embeddings can already mean "quite related" — thresholds are learned from data, not carried over from 2-D intuition. This is part of the "curse of dimensionality".',
    },
  ],
  code: {
    title: 'Worked example — cosine similarity three ways',
    intro: 'By hand, in pure Python, then in NumPy. Same numbers as the concept section, so you can check every step.',
    code: `import numpy as np

# Vocabulary: [pirate, treasure, physics]
d1 = np.array([4.0, 2.0, 0.0])   # long pirate article
d2 = np.array([2.0, 1.0, 0.0])   # short pirate note  (= d1 / 2 !)
d3 = np.array([0.0, 1.0, 3.0])   # physics blog that mentions treasure once

def cosine(a, b):
    return (a @ b) / (np.linalg.norm(a) * np.linalg.norm(b))

print(cosine(d1, d2))   # 1.0        — same direction, different length
print(cosine(d1, d3))   # 0.1414...  — barely related
print(cosine(d2, d3))   # 0.1414...  — scaling d1 -> d2 changed NOTHING

# The normalized-vectors trick used by vector databases:
def normalize(v):
    return v / np.linalg.norm(v)     # now ‖v‖ = 1

u1, u3 = normalize(d1), normalize(d3)
print(u1 @ u3)                       # plain dot product == cosine now
print(np.linalg.norm(u1 - u3)**2)    # == 2 - 2*cos  (same ranking info)`,
    notes: [
      'Line-by-line: <code>a @ b</code> multiplies matching slots and sums (one C loop); <code>np.linalg.norm</code> is √(v·v); the division rescales the score into [−1,1].',
      'Pre-normalizing once and then using raw dot products is how real vector databases (FAISS, pgvector, Chroma) make cosine search fast — dot products are cheaper than divisions per query.',
      'Note <code>cosine(d1,d3) == cosine(d2,d3)</code> exactly: multiplying a vector by a positive constant never changes its cosine to anything else. That\'s "magnitude is not meaning", in code.',
    ],
  },
  lab: {
    title: 'Lab: build cosine similarity from scratch (no NumPy)',
    prompt: 'Implement <code>dot(a, b)</code>, <code>norm(v)</code>, and <code>cosine_similarity(a, b)</code> in <b>pure Python</b> (lists + loops/comprehensions — no imports except <code>math</code>). Building it by hand once is what makes <code>np.dot</code> forever transparent. Then the tests run Nami\'s two-ships check on your code.',
    starter: `import math

def dot(a, b):
    # sum of elementwise products
    pass

def norm(v):
    # square root of dot(v, v)
    pass

def cosine_similarity(a, b):
    # dot / (norm * norm)
    pass
`,
    checks: [
      { re: 'def\\s+dot\\s*\\(', must: true, hint: 'Define dot(a, b).' },
      { re: 'def\\s+norm\\s*\\(', must: true, hint: 'Define norm(v).' },
      { re: 'def\\s+cosine_similarity\\s*\\(', must: true, hint: 'Define cosine_similarity(a, b).' },
      { re: 'import\\s+numpy', must: false, hint: 'Pure Python only in this lab — no NumPy. (You get NumPy back next lesson.)' },
      { re: '(math\\.sqrt|\\*\\*\\s*0\\.5)', must: true, hint: 'norm needs a square root: math.sqrt(...) or (...) ** 0.5.' },
    ],
    tests: `assert dot([2, 3], [4, 1]) == 11, "dot([2,3],[4,1]) should be 11"
assert abs(norm([3, 4]) - 5.0) < 1e-9, "norm([3,4]) should be 5 (Pythagoras!)"
c = cosine_similarity([4, 2, 0], [2, 1, 0])
assert abs(c - 1.0) < 1e-9, f"scaled copies must have cosine 1.0, got {c}"
c2 = cosine_similarity([1, 0], [0, 1])
assert abs(c2) < 1e-9, f"perpendicular vectors must have cosine 0, got {c2}"
c3 = cosine_similarity([1, 1], [-1, -1])
assert abs(c3 + 1.0) < 1e-9, f"opposite vectors must have cosine -1, got {c3}"
c4 = cosine_similarity([4, 2, 0], [0, 1, 3])
assert abs(c4 - 0.1414) < 0.01, f"expected ~0.1414, got {c4}"
print("Nami approves: your two-ships test works in any number of dimensions.")`,
    solution: `import math

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def norm(v):
    return math.sqrt(dot(v, v))

def cosine_similarity(a, b):
    return dot(a, b) / (norm(a) * norm(b))`,
    notes: [
      '<code>zip(a, b)</code> pairs up matching slots — the pure-Python spelling of "elementwise".',
      'Defining norm via <code>dot(v, v)</code> isn\'t just cute: it\'s the actual mathematical relationship, and reusing tested code is the actual engineering habit.',
      'Edge case worth knowing: if either vector is all zeros, norm = 0 and you divide by zero. Real libraries either return 0 or raise — check what YOUR system does before an interview asks.',
    ],
  },
  quiz: [
    {
      q: 'cosine_similarity([6, 3], [2, 1]) equals…',
      options: ['0', 'about 0.5', 'exactly 1.0', 'cannot tell without computing norms'],
      correct: 2,
      explain: '[6,3] = 3 × [2,1] — a positive scaling. Same direction ⇒ angle 0 ⇒ cosine exactly 1. You never need arithmetic when one vector is a positive multiple of the other.',
    },
    {
      q: 'Two documents about the same topic, one 100× longer. Which comparison correctly says "similar"?',
      options: [
        'Euclidean distance on raw word counts',
        'Cosine similarity on word-count vectors',
        'Dot product on raw word counts',
        'Subtracting the vectors',
      ],
      correct: 1,
      explain: 'Length difference dominates Euclidean distance and inflates the raw dot product. Cosine divides out magnitude and compares direction (word proportions) — which is what "topic" means here.',
    },
    {
      q: 'The dot product of two perpendicular (orthogonal) vectors is…',
      options: ['1', '−1', '0', 'undefined'],
      correct: 2,
      explain: 'a·b = ‖a‖‖b‖cos 90° = 0. Orthogonal = no shared component = zero matching score. (This is also why "orthogonal features" means independent information.)',
    },
    {
      q: 'Embeddings are pre-normalized to length 1 in many vector DBs because…',
      options: [
        'It compresses the storage',
        'Dot product then equals cosine similarity, making search cheaper',
        'Normalization improves the model\'s accuracy',
        'Negative values are removed',
      ],
      correct: 1,
      explain: 'With ‖a‖=‖b‖=1, cos θ = a·b — one multiply-add loop per comparison, no square roots or divisions at query time. Same ranking, less arithmetic, at millions of comparisons per query that matters.',
    },
    {
      q: 'In high dimensions, two random vectors typically have cosine similarity…',
      options: ['near +1', 'near −1', 'near 0', 'exactly 0.5'],
      correct: 2,
      explain: 'Random directions in high-dimensional space are almost always nearly orthogonal — so even "modest" cosines like 0.3 between embeddings can indicate real relatedness. Thresholds must be calibrated on your data.',
    },
  ],
  pitfalls: [
    'Comparing raw dot products between vectors of different lengths and reading them as similarity. A long document beats a short one on dot product just by being long. Divide by the norms (or normalize first).',
    'Using cosine similarity when magnitude IS the signal — e.g. "total spend" vectors in fraud detection. Cosine would call a $10 shopper and a $10,000 shopper with the same category mix identical.',
    'Forgetting the zero-vector edge case: cosine similarity is undefined (0/0) for an all-zeros vector — which absolutely happens with word-count vectors of stopword-only strings.',
    'Assuming a cosine of 0.8 from model A means the same as 0.8 from model B. Similarity scales are model-specific; always calibrate thresholds on your own data.',
  ],
  interview: [
    {
      q: 'Explain cosine similarity and why it\'s preferred over Euclidean distance for text.',
      a: 'Cosine similarity is the cosine of the angle between two vectors: a·b/(‖a‖‖b‖), ranging −1 to 1. It measures direction agreement and ignores magnitude. For text, vector magnitude mostly encodes document length or token frequency scale — noise, not meaning — while direction encodes the mix of terms/concepts. So a long article and a short note on the same topic score high with cosine but look far apart in Euclidean distance. Caveat I\'d add: for unit-normalized embeddings the two are monotonically related (‖a−b‖² = 2−2cosθ), so with normalized vectors the choice doesn\'t change rankings.',
    },
    {
      q: 'Your RAG system retrieves irrelevant documents even though cosine scores are high. What could be wrong?',
      a: 'High cosine only means "nearby in the embedding model\'s space" — several failure modes create high scores without relevance: (1) the embedding model wasn\'t trained for the domain, so all in-domain docs cluster tightly and everything scores ~0.8 ("cosine saturation"); (2) chunks are too long, so their embeddings average many topics and match everything weakly; (3) the query and documents are asymmetric (short question vs long passage) and the model wasn\'t trained for asymmetric retrieval — use a model with query/passage modes; (4) score thresholds copied from another model. Fixes: domain-appropriate embedding model, smaller/cleaner chunks, hybrid search with BM25, and calibrating thresholds against labeled pairs — plus reranking with a cross-encoder.',
    },
    {
      q: 'What is the dot product, geometrically and algebraically, and where does it show up inside a transformer?',
      a: 'Algebraically: Σᵢ aᵢbᵢ — multiply matching components, sum. Geometrically: ‖a‖‖b‖cos θ — the product of lengths times alignment; equivalently, the length of a\'s projection onto b times ‖b‖. In a transformer, attention scores are dot products between query and key vectors: QKᵀ computes every query-key dot product at once, giving a matrix of "how relevant is token j to token i" matching scores, which softmax then turns into weights. So the mechanism deciding which words attend to which is exactly the matching-score reading of the dot product, scaled by 1/√d to keep the values in a numerically friendly range.',
    },
    {
      q: 'What happens to distance-based reasoning in very high dimensions?',
      a: 'The curse of dimensionality: as dimension grows, random points concentrate at similar distances from each other — the ratio between nearest and farthest neighbor distances shrinks — and random vectors become nearly orthogonal. Consequences: naive distance thresholds transfer badly across dimensions/models; brute-force nearest neighbor stays correct but slow, and approximate indexes (HNSW, IVF) exploit structure that real (non-random) data thankfully has, since embeddings live on much lower-dimensional manifolds than their ambient 768/1536 dims. Practical answer: trust learned structure, calibrate on real data, don\'t import 2-D intuition.',
    },
  ],
};
