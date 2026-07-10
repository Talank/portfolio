window.LESSONS = window.LESSONS || {};
window.LESSONS['knn-trees-forests'] = {
  id: 'knn-trees-forests',
  title: 'KNN, Decision Trees & Random Forests',
  category: 'Part 2 — Classical ML',
  timeMin: 45,
  summary: 'Three workhorses with three completely different philosophies: predict by neighbors (KNN), by learned questions (trees), and by a voting crowd of diverse trees (forests). Tabular data in industry is still mostly won by tree ensembles — and each model here teaches a concept (laziness, information gain, variance-averaging) that transfers far beyond it.',
  goals: [
    'Implement KNN and reason about k, distance metrics, scaling and the curse of dimensionality.',
    'Explain how trees choose splits (entropy/Gini — the information-theory lesson, cashing in) and why lone trees overfit.',
    'Explain bagging + feature subsampling, and why averaging diverse models slashes variance.',
    'Place gradient boosting (XGBoost/LightGBM) in the map and know when tree ensembles beat neural nets.',
  ],
  concept: [
    {
      h: 'KNN: no training, all memory',
      p: [
        'K-Nearest Neighbors is the laziest possible model: store the training set; to classify a new point, find its k closest training points (Euclidean distance, usually) and take a majority vote (or average, for regression). There is no "fit" — all the work happens at prediction time.',
        'Everything you\'ve learned converges on its knobs. <b>k is the bias-variance dial</b>: k=1 memorizes (any noisy point creates its own little wrong island — high variance); k=n predicts the global majority always (high bias). <b>Scaling is mandatory</b>: distance mixes features, so an unscaled income axis (0–10⁷) makes the age axis (0–100) invisible. <b>High dimensions break it</b>: the curse of dimensionality (Part 1) means all points become nearly equidistant, and "nearest" loses meaning — KNN wants few, meaningful dimensions.',
        'Why learn it in 2026? Because KNN on <i>embeddings</i> is one of the most-deployed algorithms on earth: vector-database retrieval (RAG!), recommendation ("users near you liked…"), few-shot classification, and deduplication are all literally KNN with cosine distance in learned spaces. The algorithm didn\'t die; it moved into a better coordinate system.',
      ],
    },
    {
      h: 'Decision trees: learned twenty-questions',
      p: [
        'A tree classifies by asking a sequence of threshold questions ("bounty > 100M?" → "has devil fruit?" → …), each answer routing left/right until a leaf gives the verdict. Training grows the tree greedily: at each node, try every feature and threshold, and pick the split that most <b>purifies</b> the child groups — measured by the drop in <b>entropy</b> (information gain — literally the Shannon entropy you implemented) or <b>Gini impurity</b> (Σp(1−p), a cheaper cousin with near-identical results):',
        '<div class="math">gain = H(parent) − [ w_L·H(left) + w_R·H(right) ]<span class="mnote">choose the question whose answer tells you the most about the label — optimal twenty-questions, played greedily</span></div>',
        'Trees are beloved because they need no scaling (thresholds only use order), handle mixed/categorical features and missing values gracefully, capture interactions and nonlinearity automatically, and are readable — you can print the questions. And they have one famous disease: grown deep, a tree happily keeps splitting until every leaf is pure, i.e. <b>it memorizes the training set</b> — high variance, the dojo ghost with branches. Depth limits and minimum-leaf sizes help, but the real cure is the next idea.',
      ],
    },
    {
      h: 'Random forests: variance dies in the averaging',
      p: [
        'Recall the bias-variance decomposition: deep trees have low bias but huge variance — each retrained tree is wrong <i>differently</i>. Statistics says: the average of many noisy, <b>independent</b> estimates keeps the signal and shrinks the noise (variance of a mean falls like 1/n for independent terms). So: train many deep trees, let them vote. The engineering problem is making the trees disagree (identical trees average to nothing new). Random forests force diversity twice:',
        '<ul><li><b>Bagging</b> (bootstrap aggregating): each tree trains on a bootstrap sample — n rows drawn WITH replacement — so each sees a different ~63% of the data (and the left-out rows give a free validation estimate: "out-of-bag" error).</li><li><b>Feature subsampling</b>: at each split, only a random subset of features (√d is standard) may be considered — otherwise every tree grabs the same dominant feature at the root and they all correlate.</li></ul>',
        'The result is the most reliable default model in tabular ML: strong out of the box, hard to overfit catastrophically, parallel to train, with useful side products (feature importances, OOB error). Its cousin <b>gradient boosting</b> (XGBoost/LightGBM/CatBoost) builds trees <i>sequentially</i>, each fitting the residual errors of the ensemble so far — bias reduction rather than variance reduction — and, carefully tuned, wins most tabular benchmarks and Kaggle competitions to this day. Interview shorthand: <b>bagging fights variance with independent voters; boosting fights bias with specialists correcting each other</b>.',
      ],
    },
  ],
  story: {
    onePiece: {
      title: 'The crew\'s island council: many flawed navigators, one sharp verdict',
      text: [
        'An unknown island looms and the crew must call it: friendly or hostile? Method one is KNN — Nami flips through her logbook for the <b>k most similar islands</b> she\'s ever charted (similar weather vector, similar bird species, similar sea current) and votes their outcomes: "the five closest matches were four ambushes and a fruit market — assume hostile." No theory, pure precedent. It works exactly as well as her logbook is big and her similarity measure is honest — chart the wrong features (compare islands by <i>name length</i>) and the neighbors are meaningless. That\'s KNN\'s soul: the metric IS the model.',
        'Method two is Luffy\'s style, learned from Shanks: a few sharp questions in the right order. "Marine flags in the harbor?" — if yes, next question; if no — "are the villagers waving or hiding?" A decision tree, and each question is chosen because its answer <i>splits the uncertainty most</i> — asking "does the island have sand?" gains nothing (every island does — zero information gain); "waving or hiding?" cleaves the cases nearly clean. But one navigator\'s tree, grown too deep, ends in superstition: "islands with three palm trees on the west beach are always ambushes" — one memorized coincidence from one bad day. Overfitting, again.',
        'So the crew does what makes them dangerous: <b>everyone votes</b>. Nami\'s weather-read, Zoro\'s danger-sense, Sanji\'s market-instinct, Usopp\'s paranoia, Chopper\'s smell — each a deep, flawed, CONFIDENT read of the situation, each trained on different voyages (bagging) and each attending to different clues (feature subsampling — Zoro literally cannot use the map). Their individual quirks — Usopp\'s false alarms, Luffy\'s "smells like adventure" — are uncorrelated noise, and the vote cancels it while the shared signal survives. The Straw Hats are a random forest with a flag.',
      ],
    },
    sitcom: {
      show: 'Friends',
      title: 'The Embryos quiz: questions ranked by information gain',
      text: [
        'In the famous apartment-bet quiz, Ross doesn\'t ask random questions — the good ones are the ones whose answers <i>separate</i> the contestants. "What is Chandler\'s job?" is the maximal-information-gain split in television history: it cleaves "knows Chandler" from "does not" so hard that Monica and Rachel lose the apartment on it ("transpon... transponster?!"). A question everyone gets right ("Is Ross a paleontologist?") has zero gain — same entropy before and after. Building a decision tree is hiring Ross to design the quiz: at every node, ask the question that most divides what\'s left.',
      ],
    },
    why: 'One scene, three algorithms: Nami\'s logbook = KNN (precedent + a similarity metric), Luffy\'s sharp questions = a tree (maximal information gain per question, with the three-palm-trees superstition as overfitting), and the crew vote = a random forest (diverse, independently-trained voters canceling each other\'s noise). "Transponster" pins information gain forever.',
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'island', emoji: '🏝️', label: 'unknown island', x: 50, y: 12 },
      { id: 'verdict', emoji: '⚖️', label: 'verdict: ?', x: 88, y: 12 },
      { id: 'log', emoji: '📔', label: 'logbook (KNN)', x: 12, y: 40 },
    ],
    actors: [
      { id: 'nami', emoji: '🍊', label: 'Nami', x: 14, y: 78 },
      { id: 'luffy', emoji: '👒', label: 'Luffy', x: 34, y: 78 },
      { id: 'zoro', emoji: '⚔️', label: 'Zoro', x: 54, y: 78 },
      { id: 'usopp', emoji: '🔭', label: 'Usopp', x: 74, y: 78 },
      { id: 'sanji', emoji: '🍳', label: 'Sanji', x: 90, y: 78 },
    ],
    steps: [
      { c: 'Unknown island. Nami runs KNN: the 5 most-similar charted islands were 4 ambushes, 1 market. Her vote: hostile.', p: { log: 'lit' }, a: { nami: [22, 56] }, l: { log: 'k=5: 4 hostile' } },
      { c: 'Luffy runs his tree: "Marine flags? No. Villagers waving or hiding? Hiding." Two high-gain questions → his vote: hostile.', a: { luffy: [40, 56] } },
      { c: 'Zoro\'s deep tree overfits: "three palm trees on the west beach = ambush" — one memorized coincidence. His vote: hostile (for a nonsense reason).', a: { zoro: [56, 56] }, p: { island: 'lit' } },
      { c: 'Usopp votes hostile (he always does — his personal noise). Sanji sees a market and votes friendly. Five deep, flawed, CONFIDENT models.', a: { usopp: [72, 56], sanji: [88, 56] } },
      { c: 'The vote: 4–1 hostile. Individual quirks (Usopp\'s paranoia, Zoro\'s palm trees) are uncorrelated noise — averaging cancels them; shared signal survives.', p: { verdict: 'bad' }, l: { verdict: '4–1 hostile' } },
      { c: 'It was an ambush. Bagging = each nakama trained on different voyages; feature subsampling = each reads different clues. The crew is a random forest. 🏴‍☠️', p: { verdict: 'good' } },
    ],
  },
  tech: [
    {
      q: 'Gini vs entropy for splits — does the choice ever matter?',
      a: 'Gini = Σpᵢ(1−pᵢ) (probability two random draws from the node disagree), entropy = −Σpᵢlog pᵢ. Both are zero for pure nodes, maximal for uniform mixes, and differ only in curvature; empirical studies find they disagree on ~2% of splits and almost never change final accuracy. Gini is the default (sklearn, XGBoost) because it skips the log — measurably faster over millions of candidate splits. The interview-complete answer: know both formulas, say the difference rarely matters, and spend your tuning budget on depth/leaf-size/ensemble knobs instead. (For regression trees, the split criterion is variance reduction — same idea, squared-error flavored.)',
    },
    {
      q: 'How does KNN actually find neighbors fast — surely not a linear scan?',
      a: 'Small data: yes, brute force — sklearn auto-picks it and it\'s fine to ~10⁵ points. Classical indexes (KD-trees, ball trees) cut this to O(log n) in LOW dimensions but degrade to brute force beyond ~20 dims (the curse again). Modern scale (embeddings, RAG) uses <b>approximate</b> nearest neighbors: HNSW (navigable small-world graphs — greedy graph walks from an entry point, the engine inside most vector DBs like Chroma/pgvector/Qdrant), or IVF+PQ (cluster the space, search a few cells, compress vectors — FAISS\'s specialty). They trade exactness (~95–99% recall) for 100–1000× speed. When you query a vector database in Part 7, this is what runs — "KNN at scale = ANN indexes" is a sentence worth owning.',
    },
    {
      q: 'What do random-forest "feature importances" mean, and when do they lie?',
      a: 'Default (impurity-based) importance sums each feature\'s information-gain contributions across all trees — how much splitting on it purified nodes. Reliable-ish, but it lies in known ways: it inflates high-cardinality features (more candidate thresholds = more chances to look useful, even for random noise), and correlated features split credit unpredictably. Sturdier: <b>permutation importance</b> — shuffle one feature\'s column in validation data and measure the metric drop; model-agnostic and asked about in interviews. Gold standard for per-prediction explanations: SHAP values (from game theory — fairly allocate each prediction\'s deviation among features). Practical rule: never present impurity importances to stakeholders without a permutation cross-check.',
    },
    {
      q: 'Why do gradient-boosted trees still beat neural networks on tabular data?',
      a: 'Several honest reasons: tabular features are heterogeneous (age, ZIP code, price — different scales/types/meanings), where trees\' scale-invariant threshold logic is a perfect inductive bias while nets must learn normalization-sensitive embeddings; tabular datasets are often small (10³–10⁶ rows), starving nets of their data advantage; irregular, axis-aligned decision boundaries (eligibility cliffs, business rules) are exactly what trees carve natively; and boosting is brutally well-tuned by two decades of engineering (XGBoost/LightGBM). Benchmarks (e.g. Grinsztajn et al.) keep confirming it. Neural nets win when features are RAW and homogeneous (pixels, audio, text) and structure must be learned. An AI engineer who reaches for a transformer on 50k rows of tabular churn data fails the judgment test — say "LightGBM baseline first" and you pass.',
    },
  ],
  code: {
    title: 'Worked example — all three models race on the same data (sklearn)',
    intro: 'One synthetic tabular problem, three philosophies, one honest validation score each — plus the overfitting signature of the lone deep tree.',
    code: `import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

rng = np.random.default_rng(0)
n = 2000
X = rng.normal(size=(n, 6))
# hostile if a nonlinear combo of "weather" and "current" is high, plus noise
y = ((X[:, 0] * X[:, 1] > 0.3) | (X[:, 2] > 1.2)).astype(int)
y ^= (rng.random(n) < 0.08)                      # 8% label noise (the real world)

Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=1)

for name, model in [
    ("KNN (k=15)",        KNeighborsClassifier(n_neighbors=15)),
    ("Deep lone tree",    DecisionTreeClassifier(max_depth=None, random_state=0)),
    ("Depth-4 tree",      DecisionTreeClassifier(max_depth=4, random_state=0)),
    ("Random forest",     RandomForestClassifier(n_estimators=300, random_state=0)),
]:
    model.fit(Xtr, ytr)
    print(f"{name:16s} train {model.score(Xtr, ytr):.3f}   test {model.score(Xte, yte):.3f}")

# Typical output:
# KNN (k=15)        train 0.87   test 0.84
# Deep lone tree    train 1.000  test 0.80   <- memorized the 8% noise (dojo ghost)
# Depth-4 tree      train 0.86   test 0.84   <- constrained: less variance
# Random forest     train 1.000  test 0.88   <- ALSO fits train perfectly, but the
#                                               vote of diverse trees generalizes`,
    notes: [
      'The deep lone tree and the forest BOTH score 1.0 on train — but the forest\'s test score is best in class. Averaging diverse overfitters ≠ one overfitter: variance cancels in the vote. This one output line is the whole ensemble story.',
      'KNN needed no fit time but pays at predict time — feel it by timing <code>model.predict</code> on 10⁶ rows.',
      'Add <code>X[:, 5] *= 1000</code> (break the scaling) and watch KNN collapse while the trees don\'t care. The lesson\'s claims, falsifiable in one line.',
    ],
  },
  lab: {
    title: 'Lab: build KNN and a tree\'s split-chooser from scratch',
    prompt: 'Implement (1) <code>knn_predict(X_train, y_train, x, k)</code> — majority label among the k nearest training points by Euclidean distance (pure Python; break score ties any way); (2) <code>gini(labels)</code> — 1 − Σ pᵢ²; (3) <code>best_split(xs, labels)</code> — for a single numeric feature, try midpoints between consecutive sorted unique values and return the threshold minimizing the weighted Gini of the two sides (exactly what tree training does at every node).',
    starter: `import math
from collections import Counter

def knn_predict(X_train, y_train, x, k):
    # distances to all training points -> take k smallest -> majority vote
    pass

def gini(labels):
    # 1 - sum(p_i^2) over label proportions
    pass

def best_split(xs, labels):
    # candidates: midpoints between consecutive sorted unique xs
    # return threshold minimizing weighted gini of (left: x <= t, right: x > t)
    pass
`,
    checks: [
      { re: 'def\\s+knn_predict', must: true, hint: 'Define knn_predict(X_train, y_train, x, k).' },
      { re: 'sorted|sort\\(', must: true, hint: 'You\'ll need sorting: distances for KNN, unique values for split candidates.' },
      { re: 'def\\s+gini', must: true, hint: 'Define gini(labels).' },
      { re: 'def\\s+best_split', must: true, hint: 'Define best_split(xs, labels).' },
      { re: 'Counter|count\\(', must: true, hint: 'Majority vote / proportions need counting (collections.Counter is idiomatic).' },
    ],
    tests: `# --- KNN: two clear clusters ---
X = [[0,0],[0,1],[1,0],[1,1],[8,8],[8,9],[9,8],[9,9]]
y = ['calm','calm','calm','calm','storm','storm','storm','storm']
assert knn_predict(X, y, [0.5, 0.5], k=3) == 'calm'
assert knn_predict(X, y, [8.5, 8.5], k=3) == 'storm'
# k = all -> global majority (tie here is fine either way; use k=7 for a real majority)
assert knn_predict(X, y, [4.5, 4.6], k=7) in ('calm', 'storm')

# --- gini ---
assert abs(gini(['a','a','a','a'])) < 1e-9, "pure node: gini 0"
assert abs(gini(['a','b']) - 0.5) < 1e-9, "50/50 binary: gini 0.5"
assert abs(gini(['a','a','a','b']) - 0.375) < 1e-9

# --- best split: labels flip cleanly at 5 ---
xs     = [1, 2, 3, 4, 6, 7, 8, 9]
labels = ['calm']*4 + ['storm']*4
t = best_split(xs, labels)
assert 4 < t < 6, f"perfect split lies between 4 and 6, got {t}"
# noisy: one mislabeled point should not move the split much
labels2 = ['calm','calm','storm','calm','storm','storm','storm','storm']
t2 = best_split(xs, labels2)
assert 3 < t2 < 6, f"split should stay near the true boundary, got {t2}"
print("Council convened: your neighbors vote and your questions have maximal gain.")`,
    solution: `import math
from collections import Counter

def knn_predict(X_train, y_train, x, k):
    dists = sorted(
        (math.dist(p, x), yi) for p, yi in zip(X_train, y_train)
    )
    votes = Counter(yi for _, yi in dists[:k])
    return votes.most_common(1)[0][0]

def gini(labels):
    n = len(labels)
    return 1 - sum((c / n) ** 2 for c in Counter(labels).values())

def best_split(xs, labels):
    order = sorted(range(len(xs)), key=lambda i: xs[i])
    xs_s = [xs[i] for i in order]
    ls_s = [labels[i] for i in order]
    uniq = sorted(set(xs_s))
    best_t, best_score = None, float('inf')
    for a, b in zip(uniq, uniq[1:]):
        t = (a + b) / 2
        left = [l for x, l in zip(xs_s, ls_s) if x <= t]
        right = [l for x, l in zip(xs_s, ls_s) if x > t]
        score = (len(left) * gini(left) + len(right) * gini(right)) / len(xs_s)
        if score < best_score:
            best_t, best_score = t, score
    return best_t`,
    notes: [
      '<code>math.dist</code> (Python 3.8+) is Euclidean distance — the same √Σ(aᵢ−bᵢ)² you built in Part 1.',
      'Real tree training runs your <code>best_split</code> over EVERY feature at EVERY node recursively, with sorted-scan tricks making it O(n log n) per feature instead of the O(n²) here. The logic is identical.',
      'One mislabeled point barely moved the threshold — split criteria average over the node, giving trees some noise tolerance per split. It\'s the accumulation over many deep splits that overfits.',
    ],
  },
  quiz: [
    {
      q: 'Increasing k in KNN moves you toward…',
      options: [
        'higher variance (memorization)',
        'higher bias (smoother, more "global majority" behavior)',
        'faster predictions',
        'the curse of dimensionality',
      ],
      correct: 1,
      explain: 'k=1 memorizes every noisy point (variance); k=n always predicts the majority class (bias). k slides along the same dial as tree depth and polynomial degree — recognize the family.',
    },
    {
      q: 'A tree considers splitting on "island has sand" (every island does). Its information gain is…',
      options: ['maximal', 'about 0.5', 'zero — the answer doesn\'t change the label distribution', 'negative'],
      correct: 2,
      explain: 'A question with a constant answer leaves entropy unchanged: H(parent) = weighted H(children). Trees automatically ignore useless features — one of their quiet superpowers.',
    },
    {
      q: 'Random forests beat single deep trees primarily by reducing…',
      options: ['bias', 'variance — averaging diverse, independently-trained overfitters cancels their uncorrelated errors', 'training time', 'the number of features needed'],
      correct: 1,
      explain: 'Each deep tree has low bias, high variance. Bagging + feature subsampling decorrelates their errors; the vote keeps signal and cancels noise. Boosting is the bias-reducing counterpart.',
    },
    {
      q: 'Which model breaks if you forget to standardize features?',
      options: ['Decision tree', 'Random forest', 'KNN — distance lets the largest-scale feature dominate', 'XGBoost'],
      correct: 2,
      explain: 'Distance-based (KNN, k-means, RBF-SVM) and gradient-trained models need scaling. Trees only compare values to thresholds within one feature at a time — monotone rescaling changes nothing.',
    },
    {
      q: 'Bagging vs boosting, in one line each:',
      options: [
        'Bagging trains sequentially; boosting in parallel',
        'Bagging = independent trees on bootstrap samples, vote (kills variance); boosting = sequential trees each fixing the ensemble\'s remaining errors (kills bias)',
        'Bagging uses shallow trees; boosting deep ones',
        'They are the same with different names',
      ],
      correct: 1,
      explain: 'Direction of the fix differs: forests average away instability; boosting stacks specialists on the residuals (and typically uses SHALLOW trees as the weak learners — the reverse of forests).',
    },
  ],
  pitfalls: [
    'KNN on unscaled features — the widest-range feature silently becomes the only feature. Standardize first, always.',
    'Letting a lone tree grow unbounded and trusting its training accuracy. Depth is the variance knob; 1.000 train accuracy on noisy labels is a confession, not an achievement.',
    'Trusting impurity-based feature importances with correlated or high-cardinality features — cross-check with permutation importance before telling stakeholders anything.',
    'Using KNN with brute force at embedding scale (10⁷ vectors) — that\'s what ANN indexes (HNSW/IVF) are for; know the names before the system-design interview.',
    'Reaching for deep learning on 50k rows of tabular data before running the LightGBM baseline. The baseline usually wins, and interviewers check for this judgment specifically.',
  ],
  interview: [
    {
      q: 'How does a decision tree decide where to split, and why do single trees overfit?',
      a: 'At each node, training evaluates every (feature, threshold) candidate and picks the one maximizing impurity reduction — information gain (entropy drop) or equivalently Gini decrease: gain = H(parent) − weighted H(children). It\'s greedy twenty-questions: always ask the most label-revealing question next. Overfitting: with unlimited depth, splitting continues until leaves are pure, which on noisy data means carving a private region around every mislabeled point — the tree memorizes the sample, so tiny data changes yield entirely different trees (the definition of high variance). Controls: max_depth, min_samples_leaf, pruning; but the strong fix is ensembling — bagging into forests (variance cancellation) or boosting shallow trees (bias-focused, sequential error-correction).',
    },
    {
      q: 'Explain how a random forest works and why it generalizes better than its own trees.',
      a: 'Train ~hundreds of deep trees, each on a bootstrap resample of the rows (bagging) and with each split restricted to a random subset of features (typically √d), then aggregate by vote/average. Each tree is a low-bias, high-variance estimator; the two randomizations DEcorrelate their errors, and the variance of an average of weakly-correlated estimators shrinks toward the correlated floor — signal (shared by all trees) survives, idiosyncratic noise cancels. Bonuses worth naming: out-of-bag error (each tree\'s left-out rows give a free validation estimate), parallel training, feature importances (with the caveat to verify via permutation). Sharp detail: forests can score 100% on train AND generalize — training accuracy of the ensemble is not the overfitting signal; OOB/validation is.',
    },
    {
      q: 'You have 100k rows of mixed-type tabular data and two weeks to ship a churn model. Walk me through your plan.',
      a: 'Day 1: leakage-safe split (by customer and time if longitudinal), then two baselines — majority class and logistic regression on quick features — to set the floor. Days 2–5: LightGBM/XGBoost as the primary model (native categorical handling, no scaling needs, best-in-class on tabular); modest hyperparameter search (depth, learning rate, estimators, subsampling) via cross-validation. Days 6–8: feature work — aggregations, recency/frequency features, target encoding with CV-fold isolation — this is where tabular gains actually live. Days 9–10: evaluation against costs (churn is imbalanced: PR-AUC, calibrated probabilities, threshold from intervention economics), permutation importances + SHAP for the stakeholder story. Remaining days: package behind an API, log inputs/outputs, set drift monitors, document retraining cadence. Deliberately absent: neural nets — at 100k mixed-type rows, boosted trees are the strong prior and the interview is checking whether you know that.',
    },
    {
      q: 'Where is KNN used in modern LLM systems?',
      a: 'Everywhere retrieval happens — just in learned coordinates. RAG is KNN: embed the query, find the k nearest document-chunk embeddings by cosine, stuff them into context. Approximate-NN indexes (HNSW graphs, IVF-PQ) make it fast at 10⁶–10⁹ vectors, trading ~1–5% recall for orders of magnitude of speed — that\'s what runs inside vector databases. Also: few-shot example selection (retrieve the k most similar labeled examples to include in a prompt), semantic caching/dedup (is this query ≈ a cached one?), recommendation over embedding spaces, and memory systems for agents. Classic KNN concerns carry over directly: the metric is the model (embedding quality decides everything), scaling/normalization matter (unit-norm + dot product), and the curse of dimensionality is why calibrating similarity thresholds on your own data is mandatory.',
    },
  ],
};
