window.LESSONS = window.LESSONS || {};
window.LESSONS['clustering-pca'] = {
  id: 'clustering-pca',
  title: 'Unsupervised Learning: K-Means & PCA',
  category: 'Part 2 — Classical ML',
  timeMin: 40,
  summary: 'No labels, just structure: k-means finds the groups hiding in data, PCA finds the directions that matter. Both are daily tools around LLM systems — clustering embeddings, visualizing them, compressing them — and both are short enough to know completely, algorithm and failure modes included.',
  goals: [
    'Execute the k-means loop by hand (assign → update → repeat) and state what objective it descends.',
    'Choose k sensibly (elbow, silhouette) and list the geometry where k-means lies to you.',
    'Run PCA correctly (center! fit on train!) and read explained-variance ratios.',
    'Name where these appear in LLM work: clustering embeddings, dataset curation, visualization.',
  ],
  concept: [
    {
      h: 'K-means: the two-step dance',
      p: [
        'Given n points and a number k, find k <b>centroids</b> so that each point is close to its nearest centroid. Formally, minimize the within-cluster sum of squared distances ("inertia"):',
        '<div class="math">J = Σᵢ ‖xᵢ − c(assigned cluster of i)‖²</div>',
        'The algorithm is a two-step dance repeated until nothing moves: <b>(1) Assign</b> — give each point to its nearest centroid; <b>(2) Update</b> — move each centroid to the mean of its assigned points. Each step can only lower J (assignment picks the closest option; the mean is the point minimizing summed squared distance to a set — that\'s literally what a mean is), so the loop always converges. But — like gradient descent — only to a <i>local</i> minimum: bad starting centroids give bad final clusters. Fixes: run multiple random restarts (sklearn\'s <code>n_init</code>) and seed smartly with <b>k-means++</b> (pick initial centroids spread far apart, with probability proportional to squared distance from those already chosen).',
        'Assumptions you are silently making: clusters are roughly <b>round, similar in size, and separable by distance</b> — because the objective is squared Euclidean distance to a center. Elongated, nested, or crescent-shaped clusters break it (DBSCAN/hierarchical methods handle those), and unscaled features break it the same way they break KNN. K-means is a superb default and a terrible universal truth.',
      ],
    },
    {
      h: 'Choosing k — the honest answer is "it\'s a modeling decision"',
      p: [
        'J always decreases as k grows (more centers = shorter distances; k = n gives J = 0 and zero insight). So you can\'t pick k by minimizing J. Standard tools: the <b>elbow method</b> — plot J vs k and pick the bend where extra clusters stop paying (readable but subjective); the <b>silhouette score</b> — for each point, (nearest-other-cluster distance − own-cluster distance) / max of the two, averaged: +1 = crisp clusters, ~0 = overlapping, negative = misassigned; pick k maximizing it. And frequently the honest driver is <i>downstream use</i>: "we can staff 5 customer-segment campaigns" is a legitimate reason for k = 5.',
      ],
    },
    {
      h: 'PCA in practice (the eigen-lesson, operationalized)',
      p: [
        'You already own the theory: principal components are the top eigenvectors of the covariance matrix (equivalently, right singular vectors of centered data) — the directions of maximal variance. Practice checklist: <b>center</b> (and usually standardize) features; fit PCA <b>on train only</b>; inspect <code>explained_variance_ratio_</code> and keep enough components for ~90–95% (or 2 for plotting); remember components are directions, not causes.',
        'Where it earns its keep around modern AI: <b>visualizing embeddings</b> (project 768-d sentence embeddings to 2-D to eyeball whether your RAG chunks cluster by topic — though for pure visualization, t-SNE/UMAP produce prettier local structure at the price of distorting global distances; use them for looking, never for downstream math); <b>speed/denoise</b> (compress features before a distance-based method — recall KNN\'s curse of dimensionality); <b>whitening</b> inputs for classical models; and <b>dataset curation at LLM scale</b> — cluster embeddings of a giant corpus to find duplicate/low-quality/off-topic groups and rebalance the training mix (this is literally how frontier-lab data teams spend their days).',
        'The pairing that appears constantly in real work: <b>PCA (or UMAP) to reduce → k-means to cluster → read a few samples per cluster to name them</b>. It\'s the standard exploratory move on any pile of embeddings — support tickets, user queries, agent traces — and it takes ten lines.',
      ],
    },
  ],
  story: {
    onePiece: {
      title: 'Sorting the raid loot: piles emerge without labels',
      text: [
        'After a raid, the deck of the Sunny is buried in unlabeled loot: coins, gems, charts, cutlery, weapons, medicine bottles — thousands of items, no inventory list. Nobody will label them; the piles must <i>emerge</i>. Nami plants k = 4 flags at random spots on deck and declares the two-step dance: <b>everyone bring each item to its nearest flag</b> (assignment). The piles that form are lopsided nonsense at first — flag 3 is halfway between the gems and the medicine. So, step two: <b>move each flag to the middle of its own pile</b> (update). Now some items are suddenly closer to a different flag; reassign. Move flags again. Within a few rounds, nothing moves: convergence — coins, gems, charts, and gear, each around its flag.',
        'The pathologies show up too. Luffy planted two starting flags inside the coin mountain; both stayed there, splitting coins into "coins (left)" and "coins (right)" while gems and medicine got mashed into one pile — a local minimum from bad initialization. Nami\'s fix is k-means++: plant the first flag anywhere, then plant each next flag far from the existing ones, so no two flags start in the same mountain. And when Franky asks "why four piles and not seven?", Nami\'s answer is the honest one: J always drops with more flags — k = one-flag-per-item would be "perfect" and useless. She picks the bend where an extra flag stops meaningfully shortening carrying trips (elbow), sanity-checks that items sit closer to their own flag than to any other (silhouette), and admits the warehouse has exactly four shelves anyway (downstream constraint).',
        'And before any sorting, Robin quietly did the PCA move: items have a hundred describable properties, but she noticed 90% of the variation lies along two axes — roughly "value" and "weight" — so the crew sorts on the deck-plane of those two axes instead of arguing over a hundred traits. Reduce to the directions that vary, then cluster: the standard play, on a pirate ship.',
      ],
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s closet taxonomy — and the secret closet',
      text: [
        'Monica\'s apartment is unsupervised learning at equilibrium: nobody handed her category labels, yet everything sits in crisp clusters — the 11 towel categories emerged from the towels themselves ("everyday use", "fancy", "guest", "fancy-guest"...). Her categories are centroids: each new towel goes to its nearest concept, and the concept subtly adjusts (update step) as items accumulate.',
        'Then Chandler finds the locked closet — and inside, the un-clusterable chaos pile. Every real clustering job has one: items far from every centroid, forced into whichever is least-wrong (k-means has no "none of the above"). Real systems either add an outlier bucket, use methods with a noise category (DBSCAN), or accept that centroid #7 is secretly named "misc". If your embedding clusters have one weird cluster whose members share nothing — congratulations, you\'ve found Monica\'s closet.',
      ],
    },
    why: 'The loot-sort IS the algorithm — flags (centroids), carry-to-nearest (assign), recenter flags (update), Luffy\'s two-flags-in-the-coins (local minima → k-means++), and "why four piles?" (elbow/silhouette/downstream). Monica\'s secret closet is the permanent reminder that k-means has no "none of the above".',
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'coins', emoji: '🪙', label: 'coins…', x: 18, y: 30 },
      { id: 'gems', emoji: '💎', label: 'gems…', x: 74, y: 26 },
      { id: 'meds', emoji: '🧪', label: 'medicine…', x: 70, y: 72 },
      { id: 'charts', emoji: '🗺️', label: 'charts…', x: 22, y: 74 },
      { id: 'J', emoji: '📉', label: 'J = ?', x: 48, y: 10 },
    ],
    actors: [
      { id: 'f1', emoji: '🚩', label: 'flag 1', x: 40, y: 46 },
      { id: 'f2', emoji: '🚩', label: 'flag 2', x: 52, y: 52 },
      { id: 'f3', emoji: '🚩', label: 'flag 3', x: 46, y: 60 },
      { id: 'f4', emoji: '🚩', label: 'flag 4', x: 56, y: 42 },
    ],
    steps: [
      { c: 'Loot everywhere, four flags planted at random mid-deck. Nobody labeled anything.', l: { J: 'J = 4,810' } },
      { c: 'ASSIGN: every item goes to its nearest flag. The piles are lopsided nonsense — but they are piles.', p: { coins: 'lit', gems: 'lit', meds: 'lit', charts: 'lit' }, l: { J: 'J = 3,200' } },
      { c: 'UPDATE: each flag walks to the center of its own pile. (The mean minimizes squared distances — that\'s what a mean is.)', a: { f1: [20, 32], f2: [72, 28], f3: [68, 70], f4: [24, 72] }, l: { J: 'J = 1,450' } },
      { c: 'Reassign — some items now belong to a different flag. Update again. Each step can only lower J.', a: { f1: [18, 30], f2: [74, 26], f3: [70, 72], f4: [22, 74] }, l: { J: 'J = 920' } },
      { c: 'Nothing moves: converged. Coins, gems, medicine, charts — labels EMERGED. (Unless two flags started inside the coin mountain — rerun with spread-out starts: k-means++.)', p: { coins: 'good', gems: 'good', meds: 'good', charts: 'good' }, l: { J: 'J = 905 ✓' } },
      { c: 'Same dance on 768-d embeddings clusters your users\' queries, your RAG chunks, your agent\'s failures. Flags in meaning-space. 🏴‍☠️', p: { J: 'good' } },
    ],
  },
  conceptFlow: {
    title: 'The loot-sort dance, watched by J',
    intro: 'Same inertia numbers as the animation.',
    stages: [
      { label: 'Plant', nodes: [
        { id: 'flags', text: '4 flags, random spots\nJ = 4,810' },
      ]},
      { label: 'Assign', nodes: [
        { id: 'assign', text: 'Each item → nearest flag\nJ = 3,200' },
      ]},
      { label: 'Update', nodes: [
        { id: 'update', text: 'Flags walk to pile centers\nJ = 1,450' },
      ]},
      { label: 'Converge', nodes: [
        { id: 'converge', text: 'Repeat until nothing moves\nJ = 905' },
      ]},
    ],
    steps: [
      { active: ['flags'], note: 'Four flags planted at random mid-deck. Nobody labeled anything. J = 4,810.' },
      { active: ['assign'], note: 'ASSIGN: every item goes to its nearest flag. The piles are lopsided nonsense — but they are piles. J drops to 3,200.' },
      { active: ['update'], note: 'UPDATE: each flag walks to the center of its own pile — the mean minimizes squared distance, that\'s what a mean IS. J drops to 1,450.' },
      { active: ['converge'], note: 'Repeat — reassign, update, reassign — each step can only lower J. Nothing moves: converged at J=905. Coins, gems, medicine, charts: labels EMERGED, with no annotator.' },
    ],
  },
  tech: [
    {
      q: 'Why does the k-means update step use the mean — and what breaks if I use something else?',
      a: 'Because the objective is SQUARED Euclidean distance: for a fixed set of points, the c minimizing Σ‖xᵢ − c‖² is exactly their mean (set the gradient 2Σ(c − xᵢ) = 0 → c = mean — the calculus lesson in one line). Change the objective and the right center changes with it: absolute distance → median (k-medians, robust to outliers); restrict centers to actual data points → k-medoids (works for any dissimilarity, e.g. edit distance); cosine similarity on unit vectors → spherical k-means (mean, then re-normalize — the variant that fits embeddings). The dance is general; the "middle" must match the metric. Outliers dragging means around is also why one weird point can hijack a centroid — Monica\'s closet strikes again.',
    },
    {
      q: 'What exactly does sklearn\'s KMeans do beyond my loop?',
      a: '<code>KMeans(n_clusters=k)</code> runs your loop with production armor: k-means++ init by default; <code>n_init</code> restarts keeping the best J (set it ≥ 10 for anything that matters); Elkan\'s triangle-inequality acceleration to skip provably-unnecessary distance computations; tolerance-based early stopping. <code>fit</code> stores <code>cluster_centers_</code>, <code>labels_</code>, <code>inertia_</code> (that\'s J). <code>MiniBatchKMeans</code> is the streaming version for millions of points — updates centroids from random mini-batches, the same statistical bargain as SGD. For embedding-scale work (10⁷+ vectors), FAISS\'s GPU k-means is the tool the big labs actually use.',
    },
    {
      q: 'PCA vs t-SNE vs UMAP for looking at embeddings — which and why?',
      a: 'PCA is linear and global: distances/directions in the plot relate faithfully (if flatly) to the original space, it\'s deterministic and fast, and coordinates are reusable for downstream math. t-SNE/UMAP are nonlinear neighbor-preserving maps: they unroll manifolds and make gorgeous, well-separated blobs — but they distort global structure (inter-cluster distances and cluster SIZES in a t-SNE plot are close to meaningless), depend on hyperparameters (perplexity/n_neighbors) and seeds, and their axes mean nothing. Rules: PCA first, always (it may be enough, and it\'s honest); t-SNE/UMAP for presentation-grade cluster pictures, interpreted qualitatively only; never feed t-SNE coordinates into downstream models; never read "cluster A is twice as spread as B" off a t-SNE plot.',
    },
    {
      q: 'How is clustering actually used in LLM data pipelines?',
      a: 'Three production patterns. (1) <b>Corpus curation</b>: embed millions of documents, cluster, inspect samples per cluster — find and down-weight boilerplate/SEO-spam/duplicate clusters, up-weight rare valuable ones (semantic dedup at pretraining scale is embedding-cluster-based; SemDeDup-style methods). (2) <b>Understanding usage</b>: embed user queries or agent failures, cluster, name the clusters — instant taxonomy of what people actually ask and where the system breaks; this drives eval-set design (one eval per major cluster). (3) <b>Routing/caching</b>: cluster queries so cheap models handle the easy clusters, or semantic caches hit on near-duplicate requests. The skill is identical to the loot-sort: reduce (PCA/UMAP), cluster (k-means), READ samples, name piles.',
    },
  ],
  code: {
    title: 'Worked example — reduce, cluster, read (the standard exploratory play)',
    intro: 'Synthetic "embeddings" with four hidden topics: PCA to see them, k-means to find them, silhouette to sanity-check k. This is the ten-line move you\'ll run on real embeddings constantly.',
    code: `import numpy as np
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

rng = np.random.default_rng(0)
# four hidden "topics" in 50-d space (like sentence embeddings)
centers = rng.normal(size=(4, 50)) * 3
X = np.vstack([c + rng.normal(size=(100, 50)) for c in centers])   # (400, 50)

# 1) PCA: how much structure lives in few dimensions?
pca = PCA(n_components=10).fit(X)
print(pca.explained_variance_ratio_.round(2))
# first ~3 components carry most variance -> low-dim structure exists
X2 = PCA(n_components=2).fit_transform(X)      # for plotting/eyeballing

# 2) choose k by silhouette
for k in [2, 3, 4, 5, 6]:
    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(X)
    print(f"k={k}: inertia={km.inertia_:9.0f}  silhouette={silhouette_score(X, km.labels_):.3f}")
# inertia falls FOREVER as k grows (useless alone);
# silhouette peaks at the true k=4 — that's your signal

# 3) cluster at k=4 and check against the hidden truth
km = KMeans(n_clusters=4, n_init=10, random_state=0).fit(X)
truth = np.repeat([0, 1, 2, 3], 100)
for c in range(4):
    members = truth[km.labels_ == c]
    print(f"cluster {c}: sizes by true topic -> {np.bincount(members, minlength=4)}")
# each found cluster should be dominated by one true topic`,
    notes: [
      'Watch inertia vs silhouette in the k-loop: inertia ALWAYS improves with k (never use it alone to choose k); silhouette peaks where clusters are genuinely crisp.',
      '<code>n_init=10</code> is Luffy-insurance: ten random restarts, keep the best J. Skipping it is how you ship "coins (left) / coins (right)".',
      'On real embeddings, add step 4: print 5 example texts per cluster and NAME them. Clusters without names are decoration.',
    ],
  },
  lab: {
    title: 'Lab: implement the k-means dance',
    prompt: 'Pure Python, 2-D points. Implement (1) <code>assign(points, centroids)</code> → list of centroid indices (nearest by Euclidean distance — <code>math.dist</code>); (2) <code>update(points, assignments, k)</code> → new centroids as per-cluster means (if a cluster is empty, keep a centroid at (0,0)); (3) <code>kmeans(points, k, iters=20)</code> → run the dance from the FIRST k points as initial centroids, return (centroids, assignments); (4) <code>inertia(points, centroids, assignments)</code> → the J objective.',
    starter: `import math

def assign(points, centroids):
    pass

def update(points, assignments, k):
    pass

def kmeans(points, k, iters=20):
    centroids = [list(p) for p in points[:k]]
    for _ in range(iters):
        a = assign(points, centroids)
        centroids = update(points, a, k)
    return centroids, assign(points, centroids)

def inertia(points, centroids, assignments):
    pass
`,
    checks: [
      { re: 'def\\s+assign', must: true, hint: 'Define assign(points, centroids).' },
      { re: 'def\\s+update', must: true, hint: 'Define update(points, assignments, k).' },
      { re: 'math\\.dist|\\*\\*\\s*2', must: true, hint: 'Distances: math.dist or explicit squared differences.' },
      { re: 'def\\s+inertia', must: true, hint: 'Define inertia(points, centroids, assignments) — the J objective.' },
    ],
    tests: `pts = [(0,0),(1,0),(0,1),(1,1), (10,10),(11,10),(10,11),(11,11)]
cents, a = kmeans(pts, 2)
# the two centroids should sit at (~0.5, 0.5) and (~10.5, 10.5), either order
cs = sorted((round(c[0],1), round(c[1],1)) for c in cents)
assert cs == [(0.5, 0.5), (10.5, 10.5)], f"centroids off: {cs}"
# all four low points share a cluster; all four high points share the other
assert len(set(a[:4])) == 1 and len(set(a[4:])) == 1 and a[0] != a[4], f"bad assignment {a}"
J = inertia(pts, cents, a)
assert abs(J - 4.0) < 1e-6, f"J should be 4.0 (8 points, each 0.5 from its centroid: 8 * 0.5) got {J}"
# J must not increase when clustering with the right k vs k=1
c1, a1 = kmeans(pts, 1)
assert inertia(pts, c1, a1) > J, "k=2 must fit these two blobs better than k=1"
print("Deck sorted. Nami logs the piles; Monica locks the closet.")`,
    solution: `import math

def assign(points, centroids):
    return [min(range(len(centroids)), key=lambda j: math.dist(p, centroids[j]))
            for p in points]

def update(points, assignments, k):
    cents = []
    for j in range(k):
        members = [p for p, a in zip(points, assignments) if a == j]
        if members:
            cents.append([sum(m[0] for m in members)/len(members),
                          sum(m[1] for m in members)/len(members)])
        else:
            cents.append([0.0, 0.0])
    return cents

def kmeans(points, k, iters=20):
    centroids = [list(p) for p in points[:k]]
    for _ in range(iters):
        a = assign(points, centroids)
        centroids = update(points, a, k)
    return centroids, assign(points, centroids)

def inertia(points, centroids, assignments):
    return sum(math.dist(p, centroids[a]) ** 2 for p, a in zip(points, assignments))`,
    notes: [
      'Each point sits at distance 0.5·√2… no — check: (0,0) to (0.5,0.5) is √0.5, squared = 0.5; eight points × 0.5 = J = 4.0. Verify one by hand, per the standing habit.',
      'Initializing from the first k points is deterministic for the test but naive in general — real code uses k-means++ plus restarts. You saw why on Luffy\'s coin mountain.',
    ],
  },
  quiz: [
    {
      q: 'The k-means update step moves each centroid to its cluster\'s mean because…',
      options: [
        'the mean is the fastest to compute',
        'the mean is the point minimizing the sum of squared distances to the members — exactly the objective being descended',
        'it guarantees the global optimum',
        'centroids must be actual data points',
      ],
      correct: 1,
      explain: 'Set d/dc Σ‖xᵢ−c‖² = 0 → c = mean. Different objective, different center: L1 → median (k-medians); centers restricted to data points → k-medoids. No step guarantees a GLOBAL optimum — hence restarts.',
    },
    {
      q: 'Inertia (J) alone cannot choose k because…',
      options: [
        'it is too slow to compute',
        'it always decreases as k grows — k = n gives J = 0 and zero insight',
        'it only works in 2-D',
        'it requires labels',
      ],
      correct: 1,
      explain: 'More flags always shorten carrying trips. Use the elbow bend, silhouette peak, or downstream constraints — and accept that k is a modeling decision, not a discovered truth.',
    },
    {
      q: 'Your t-SNE plot shows cluster A twice as large and far from cluster B. You may safely conclude…',
      options: [
        'A has twice B\'s variance in the original space',
        'A and B are semantically distant',
        'almost nothing quantitative — t-SNE distorts global distances and cluster sizes; it\'s for qualitative looking only',
        'k should be 2',
      ],
      correct: 2,
      explain: 't-SNE preserves local neighborhoods and mangles everything global. Never feed its coordinates downstream, never read sizes/distances off it. PCA is the honest (if less pretty) projection.',
    },
    {
      q: 'K-means on raw (uncentered, unscaled) mixed-unit features will…',
      options: [
        'work fine — k-means is scale-invariant',
        'let the largest-scale feature dominate all distances, like KNN',
        'fail to converge',
        'automatically standardize internally',
      ],
      correct: 1,
      explain: 'Same disease as every distance-based method: income (0–10⁷) makes age (0–100) invisible in Euclidean distance. Standardize first. (Convergence still happens — to confidently wrong piles.)',
    },
  ],
  testFlow: {
    title: 'Test yourself: k-means & PCA',
    start: 'q1',
    nodes: {
      q1: { qid: 'q1', q: 'The k-means update step moves each centroid to its cluster\'s MEAN because...', choices: [
        { text: 'The mean is the fastest statistic to compute', to: 'q1_wrong_fast' },
        { text: 'The mean is the point minimizing the sum of squared distances to the cluster members — exactly the objective being descended', to: 'q1_right' },
        { text: 'It guarantees finding the global optimum', to: 'q1_wrong_global' },
      ]},
      q1_right: { end: true, correct: true, text: 'Right — setting d/dc Σ‖xᵢ−c‖²=0 gives c=mean exactly. Change the objective (L1 distance) and the right center changes too (median, giving k-medians).', next: 'q2' },
      q1_wrong_fast: { end: true, correct: false, text: 'Computational speed isn\'t why the mean is used — it\'s used because it is the EXACT mathematical minimizer of the sum-of-squared-distances objective k-means is descending.', retry: 'q1' },
      q1_wrong_global: { end: true, correct: false, text: 'Neither the assign nor the update step guarantees a global optimum — k-means only guarantees convergence to A local minimum, which is exactly why k-means++ and multiple restarts matter.', retry: 'q1' },
      q2: { qid: 'q2', q: 'Inertia (J) alone cannot be used to choose k because...', choices: [
        { text: 'It is too computationally slow to evaluate at different k', to: 'q2_wrong_slow' },
        { text: 'It always decreases as k grows — k=n gives J=0 and zero insight', to: 'q2_right' },
        { text: 'It only works correctly in 2 dimensions', to: 'q2_wrong_2d' },
      ]},
      q2_right: { end: true, correct: true, text: 'Right — more centroids always shorten distances to the nearest one, so J monotonically falls with k. Use the elbow bend, the silhouette peak, or a downstream constraint instead.', next: 'q3' },
      q2_wrong_slow: { end: true, correct: false, text: 'Computing J is cheap — that\'s not the issue. The real problem is that J is a monotonically decreasing function of k, so minimizing it directly just pushes you toward k=n (one cluster per point), which is useless.', retry: 'q2' },
      q2_wrong_2d: { end: true, correct: false, text: 'Inertia works fine as a computation in any number of dimensions — the problem isn\'t dimensionality, it\'s that it always favors more clusters regardless of dimension.', retry: 'q2' },
      q3: { qid: 'q3', q: 'Running k-means on raw (uncentered, unscaled) mixed-unit features will...', choices: [
        { text: 'Work fine — k-means is scale-invariant like decision trees', to: 'q3_wrong_fine' },
        { text: 'Let the largest-scale feature dominate all distance calculations, exactly like it does for KNN', to: 'q3_right' },
        { text: 'Cause the algorithm to fail to converge at all', to: 'q3_wrong_noconverge' },
      ]},
      q3_right: { end: true, correct: true, text: 'Right — the same disease as every distance-based method: an income feature spanning 0–10⁷ makes an age feature spanning 0–100 essentially invisible in Euclidean distance. Standardize first.', },
      q3_wrong_fine: { end: true, correct: false, text: 'K-means is NOT scale-invariant — unlike trees, it computes actual Euclidean distances across features, so features with larger numeric ranges dominate the clustering.', retry: 'q3' },
      q3_wrong_noconverge: { end: true, correct: false, text: 'K-means will still converge (the monotonic-decrease argument doesn\'t depend on scaling) — it just converges to confidently WRONG piles, dominated by whichever feature happens to have the largest scale.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Running k-means once with random init and trusting the result — Luffy\'s two-flags-in-the-coins. Use k-means++ and n_init ≥ 10.',
    'Choosing k by inertia. It always says "more". Silhouette, elbow, or the downstream constraint.',
    'Clustering unscaled features, or clustering raw high-dimensional sparse TF-IDF with Euclidean k-means (use cosine/spherical variants or reduce first).',
    'Fitting PCA before the train/test split, or forgetting to center — both old friends by now, both still the top real-world PCA bugs.',
    'Presenting clusters without reading samples from each. Unnamed clusters are decoration; the reading step is where the value is.',
  ],
  interview: [
    {
      q: 'Walk through the k-means algorithm, its convergence argument, and its failure modes.',
      a: 'Initialize k centroids (k-means++: spread them out probabilistically). Loop: (1) assign each point to its nearest centroid; (2) move each centroid to its members\' mean. Both steps monotonically decrease the objective J = Σ‖xᵢ − c_{a(i)}‖² — assignment by choosing the nearest option, update because the mean is the unique minimizer of summed squared distance — and since J is bounded below and there are finitely many assignments, it converges. Failure modes: local minima (mitigate with k-means++ and restarts), wrong k (elbow/silhouette/domain), non-spherical or unequal-density clusters (the Euclidean-ball assumption — use DBSCAN/GMM/spectral instead), outliers dragging means (k-medians/medoids), and unscaled features distorting distances. Complexity O(n·k·d) per iteration — cheap enough to run at embedding scale with mini-batch variants.',
    },
    {
      q: 'You have a million customer-support tickets and no labels. Deliver insight in a week.',
      a: 'Embed each ticket with a sentence-embedding model (or TF-IDF if constrained — and honestly compare both). Reduce with PCA to ~50 dims for speed/denoising. Cluster: mini-batch k-means, k swept over 10–50, silhouette + manual inspection to settle; expect a junk/outlier cluster and either DBSCAN it away or budget a "misc" pile. The critical human step: read 10–20 samples per cluster and NAME them — now you have a data-driven taxonomy with volumes ("31% password resets, 12% billing disputes, 4% angry-about-new-UI"). Deliverables: taxonomy + volumes + trend over time (cluster drift flags emerging issues), a routing classifier trained on cluster labels if desired, and an eval set sampled per cluster for any future automation. This is also exactly how LLM teams mine user queries and agent failures — the workflow transfers verbatim.',
    },
    {
      q: 'When would you NOT use k-means, and what instead?',
      a: 'Non-spherical shapes (crescents, rings, elongated clusters): density- or graph-based methods — DBSCAN/HDBSCAN (also gives a principled noise/outlier category, which k-means fatally lacks) or spectral clustering. Unknown/variable cluster count with noise: HDBSCAN again. Clusters as overlapping probability distributions or with very different sizes/covariances: Gaussian mixture models (soft assignments, per-cluster shape). Categorical or non-Euclidean data: k-medoids with a suitable dissimilarity, or hierarchical clustering (which also yields the dendrogram when the number of clusters is genuinely ambiguous). Massive-scale embeddings: mini-batch k-means or FAISS GPU k-means — there scale forces you BACK toward k-means. The interview skill is naming the violated assumption (Euclidean ball, hard assignment, fixed k, no-noise) and matching the method to it.',
    },
  ],
};
