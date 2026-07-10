window.LESSONS = window.LESSONS || {};
window.LESSONS['ml-fundamentals'] = {
  id: 'ml-fundamentals',
  title: 'ML Fundamentals: Learning, Overfitting & the Bias-Variance Trade-off',
  category: 'Part 2 — Classical ML',
  timeMin: 40,
  summary: 'The concepts that govern every model you will ever train, from linear regression to GPT: what "learning" formally is, why models that ace their training data can fail in production, and the bias-variance trade-off that explains both. Interviewers probe this in almost every ML conversation.',
  goals: [
    'Define supervised vs unsupervised learning, and the anatomy of a supervised problem (features, labels, hypothesis space, loss).',
    'Explain overfitting and underfitting mechanically — not as slogans — and diagnose them from train/validation curves.',
    'State the bias-variance decomposition and use it to reason about model choices.',
    'Apply the standard remedies (more data, regularization, early stopping, simpler/richer models) to the right disease.',
  ],
  concept: [
    {
      h: 'What "learning" formally is',
      p: [
        '<b>Supervised learning</b>: you have examples of inputs x (features) with known answers y (labels), and want a function f that predicts y for NEW x. Regression = numeric y (price, temperature); classification = categorical y (spam/ham, which of 100k tokens comes next — yes, LLM pretraining is supervised classification at heart).',
        '<b>Unsupervised learning</b>: only x, no labels — find structure: clusters (k-means), compressed representations (PCA, embeddings), densities. <b>Self-supervised</b> (the LLM trick): manufacture labels from the data itself — "predict the next word" needs no human annotator because the next word is right there. This is why LLMs could train on the whole internet.',
        'The formal setup of supervised learning, worth having verbatim: choose a <b>hypothesis space</b> (the family of functions you\'ll search — all straight lines; all depth-5 trees; all transformers with this architecture), a <b>loss</b> (how wrong is a prediction — you now know these are mostly likelihoods), and an <b>optimizer</b> (how to search — usually gradient descent). Learning = using data to pick the best member of the hypothesis space. Every ML system you will ever build is these three choices.',
      ],
    },
    {
      h: 'Overfitting and underfitting, mechanically',
      p: [
        'From the statistics lesson: anything fit to a sample looks better on that sample than on the world. The size of that gap depends on the hypothesis space:',
        '<b>Underfitting</b> (high bias): the hypothesis space is too rigid to represent the real pattern. A straight line fit to a U-shaped relationship is wrong <i>everywhere</i>, including on its own training data. Signature: <b>train error high, validation error high and similar</b>. More data will NOT help — the model can\'t express the truth at any dataset size.',
        '<b>Overfitting</b> (high variance): the hypothesis space is so flexible it can fit the noise, not just the signal. A degree-15 polynomial through 12 points passes through every point exactly — including the measurement errors — and swings wildly between them. Signature: <b>train error ≈ 0, validation error much higher</b>. The model memorized the sample; the noise it memorized doesn\'t repeat in new data.',
        'The professional\'s diagnostic instrument is the pair of <b>learning curves</b> (train + validation error over training time or dataset size). The four patterns — both-high (underfit), gap (overfit), both-low (done), validation rising while train falls (overfitting in progress → early stopping) — are read at a glance and asked about in interviews constantly.',
      ],
    },
    {
      h: 'The bias-variance decomposition',
      p: [
        'For squared-error problems this is a theorem, not a metaphor. Imagine re-drawing your training set many times and re-training each time. For a given test point, expected error splits into three parts:',
        '<div class="math">E[(y − ŷ)²] = Bias² + Variance + Irreducible noise<span class="mnote">Bias = how far the AVERAGE trained model is from truth · Variance = how much models WOBBLE across re-draws · Noise = randomness no model can beat</span></div>',
        '<b>Bias</b> is systematic error from a too-rigid hypothesis space: every re-trained straight line misses the U-shape the same way. <b>Variance</b> is instability: each re-trained degree-15 polynomial is wrong <i>differently</i>, chasing its own sample\'s noise. Model complexity moves you along a trade-off: rigid models = high bias/low variance; flexible = low bias/high variance; the sweet spot minimizes the sum.',
        'Modern footnote worth knowing for interviews: very large neural networks complicate the classic U-shaped picture ("double descent" — past the point where the model can perfectly fit the data, adding EVEN MORE parameters can improve generalization again, with regularization and SGD\'s implicit biases doing the policing). The classic trade-off still governs classical models and small-data regimes — and the vocabulary still frames every serious ML discussion.',
      ],
    },
    {
      h: 'The remedy table — match the cure to the disease',
      p: [
        '<div class="cmp-wrap"><table class="cmp"><tr><th>Symptom</th><th>Disease</th><th>Cures</th></tr><tr><td>Train error high, val error similar</td><td>Underfitting (bias)</td><td>Richer model (more features, higher degree, deeper net), train longer, reduce regularization</td></tr><tr><td>Train ≈ 0, val much worse</td><td>Overfitting (variance)</td><td>More data, regularization (L2/L1, dropout), simpler model, early stopping, data augmentation, ensembling</td></tr><tr><td>Both low, val ≈ train</td><td>Healthy</td><td>Ship it (after ONE test-set measurement)</td></tr><tr><td>Val was falling, now rising</td><td>Overfitting beginning</td><td>Stop here — early stopping is regularization for free</td></tr></table></div>',
        'Two notes that separate practitioners from textbook-readers. First, <b>more data cures variance, never bias</b> — knowing which disease you have decides whether a data-labeling budget is worth anything. Second, regularization (which you can now read as a prior, from the statistics lesson) doesn\'t shrink the hypothesis space — it makes the extreme members expensive to reach, so the optimizer only goes there if the data genuinely insists.',
      ],
    },
  ],
  story: {
    onePiece: {
      title: 'Zoro vs the dojo ghost: the swordsman who memorized one opponent',
      text: [
        'In Zoro\'s dojo years, a rival student took a shortcut to beating him: he studied Zoro exclusively. Every recorded spar, every habit — Zoro leads with the left after two parries; Zoro blinks before a lunge. Against Zoro, this student became untouchable: he wasn\'t reading swordsmanship, he was replaying a memorized answer key. Training error: zero.',
        'Then came a tournament full of strangers. The student\'s "skill" evaporated — he\'d dodge lunges that never came, parry patterns nobody else used. He hadn\'t learned <i>fencing</i> (the signal); he\'d memorized <i>Zoro</i>, including Zoro\'s meaningless quirks (the noise). New opponents drew from the true distribution of swordsmen, and his validation error was catastrophic. That is overfitting, in one tournament.',
        'Kuina\'s path — and later Zoro\'s across the Grand Line — is the generalizing one: principles (distance, timing, reading weight shifts) drilled across <b>many diverse opponents</b>. Principles fit no single opponent perfectly (small bias: a specialist could edge her in one matchup) but transfer to all of them (low variance). And Mihawk, the world\'s strongest, is what "more, diverse data + right hypothesis space" converges to. When your model\'s validation loss climbs while training loss falls, picture the dojo ghost confidently parrying attacks that no longer exist.',
      ],
    },
    sitcom: {
      show: 'Friends',
      title: 'Joey "learns" French',
      text: [
        'Phoebe tries to teach Joey French for an audition. Joey repeats whole phrases after her with perfect sound — "Je m\'appelle Claude" — and within an hour he\'s convinced he\'s fluent. He has driven his training loss to zero: on the exact phrases in the lesson (his training set), he\'s flawless. Then the audition asks for anything off-script and out comes confident gibberish — "meh blah blooh" — delivered with total conviction. Zero generalization: he memorized surface outputs without learning the grammar (the underlying function) that generates them.',
        'The detail that makes it perfect ML: Joey can\'t even tell he\'s failing — inside his own training distribution, everything checks out. That\'s why you never evaluate on training data, and why Phoebe (the held-out set) has to be the one to break the news, in fake French, that il est fou.',
      ],
    },
    why: 'The dojo ghost gives you overfitting as a mechanism, not a slogan: memorizing one opponent\'s noise beats that opponent and no one else. Joey adds the sneaky part — inside the training set, the overfit model genuinely can\'t tell (train loss looks perfect); only held-out data (Phoebe) reveals the truth.',
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'zoro1', emoji: '⚔️', label: 'Zoro (training data)', x: 18, y: 30 },
      { id: 'op1', emoji: '🤺', label: 'stranger 1', x: 62, y: 20 },
      { id: 'op2', emoji: '🤺', label: 'stranger 2', x: 78, y: 44 },
      { id: 'op3', emoji: '🤺', label: 'stranger 3', x: 62, y: 68 },
      { id: 'score', emoji: '🏆', label: '', x: 14, y: 80 },
    ],
    actors: [
      { id: 'ghost', emoji: '👻', label: 'memorizer', x: 34, y: 46 },
      { id: 'kuina', emoji: '🥋', label: 'Kuina (principles)', x: 34, y: 76 },
    ],
    steps: [
      { c: 'The dojo ghost studies ONE opponent: every habit, every quirk — including the meaningless ones (the noise).', p: { zoro1: 'lit' }, l: { score: 'train err: 0%' } },
      { c: 'Against Zoro: flawless. Training error zero. He is CERTAIN he has mastered swordsmanship.', p: { zoro1: 'good' }, a: { ghost: [24, 36] } },
      { c: 'Tournament day: new opponents, drawn from the real distribution of swordsmen.', p: { op1: 'lit', op2: 'lit', op3: 'lit' } },
      { c: 'He parries lunges that never come — replaying memorized noise. Validation error: catastrophic.', a: { ghost: [66, 34] }, p: { op1: 'bad', op2: 'bad' }, l: { score: 'val err: 90%' } },
      { c: 'Kuina drilled principles across MANY sparring partners: fits none perfectly (a little bias), transfers to all (low variance).', a: { kuina: [66, 60] }, p: { op1: 'good', op2: 'good', op3: 'good' }, l: { score: 'val err: 15%' } },
      { c: 'Same lesson for models: capacity + one narrow sample = memorized noise. Diverse data + right constraints = swordsmanship. 🏴‍☠️', p: { score: 'good' } },
    ],
  },
  tech: [
    {
      q: 'What do sklearn\'s .fit() and .predict() actually do — what\'s inside the black box?',
      a: '<code>model.fit(X, y)</code> runs the training procedure for that hypothesis space and stores the learned parameters on the object (sklearn convention: attributes ending in underscore, like <code>model.coef_</code>). For LinearRegression it solves a linear-algebra problem (least squares); for LogisticRegression it runs an iterative optimizer; for trees it runs recursive splitting. <code>model.predict(X)</code> just evaluates the stored function on new rows. The uniform interface is the point of the library: every estimator is fit/predict/score, so you can swap hypothesis spaces in one line. After the next two lessons you\'ll have implemented what fit() hides for the two most important models — then the black box is glass forever.',
    },
    {
      q: 'How exactly should I split train/validation/test — and what is cross-validation for?',
      a: [
        'Standard recipe: shuffle, split ~60/20/20 or 80/10/10 (big data needs proportionally less held out). Fit on train; tune every knob (hyperparameters, feature choices, early stopping) by validation; touch test once at the end. <b>k-fold cross-validation</b> (split train into k folds, train k times each holding out one fold, average) squeezes more reliable estimates from small datasets at k× compute cost — standard for classical ML, rare for LLM-scale.',
        'The splits must respect real-world structure or your estimate lies: time-series must split by time (train on past, validate on future — random splits leak the future); grouped data (multiple rows per user/patient) must split by group, or the model "generalizes" to users it already saw. Leaky splits are among the most common causes of "it worked offline, failed in prod".',
      ],
    },
    {
      q: 'Why does L2 regularization reduce variance, mechanically?',
      a: 'Variance = the model changes a lot when the sample changes. Wild swings between data points require large weights (big polynomial coefficients, big neuron weights). Adding λ‖w‖² to the loss makes large weights expensive, so the optimizer only buys them when the data-fit improvement outweighs the penalty — noise, which is inconsistent across samples, rarely justifies the price; signal, which is consistent, does. Geometrically it shrinks the reachable hypothesis space toward smoother functions. In the Bayesian reading (statistics lesson): a Gaussian prior saying "weights are probably small". Same math, three lenses — use whichever your interviewer speaks.',
    },
    {
      q: 'Is "more parameters than data points" automatically overfitting? (The double-descent caveat)',
      a: 'Classically yes — a degree-15 polynomial through 12 points is the canonical disaster. But modern deep nets routinely have 1000× more parameters than examples and generalize anyway: the "double descent" phenomenon shows test error can fall AGAIN past the interpolation threshold. Working intuition: among the many zero-training-error solutions a huge net can express, SGD + weight decay + architecture bias preferentially find "smooth"/simple ones — implicit regularization does the policing that explicit capacity limits used to. For interviews: know the classical picture cold, mention double descent as the modern caveat, and note that classical rules still fully apply to classical models and small tabular data — which is most industry ML.',
    },
  ],
  code: {
    title: 'Worked example — watching overfitting happen (NumPy only)',
    intro: 'Twelve noisy points from a gentle quadratic. Fit polynomials of degree 1, 2 and 9 and read the train/test errors. This experiment is the whole lesson in eight lines of output.',
    code: `import numpy as np
rng = np.random.default_rng(7)

def true_f(x):           # reality: a gentle curve
    return 0.5 * x**2 - x + 2

x_train = np.linspace(-3, 3, 12)
y_train = true_f(x_train) + rng.normal(0, 1.0, 12)   # noisy sample
x_test  = np.linspace(-2.8, 2.8, 50)
y_test  = true_f(x_test)  + rng.normal(0, 1.0, 50)   # fresh sample, same world

for degree in [1, 2, 9]:
    coeffs = np.polyfit(x_train, y_train, degree)     # least-squares fit
    mse_tr = np.mean((np.polyval(coeffs, x_train) - y_train) ** 2)
    mse_te = np.mean((np.polyval(coeffs, x_test)  - y_test) ** 2)
    print(f"degree {degree}:  train MSE {mse_tr:5.2f}   test MSE {mse_te:6.2f}")

# degree 1:  train ~2.6   test ~2.9   <- underfit: bad everywhere (bias)
# degree 2:  train ~0.8   test ~1.2   <- right capacity: best test error
# degree 9:  train ~0.3   test ~9+    <- overfit: memorized noise (variance)`,
    notes: [
      'Degree 9\'s train error is the BEST of the three and its test error the WORST — training error actively misleads about quality. This asymmetry is the reason validation sets exist.',
      'The irreducible term is visible too: even the perfect degree-2 model can\'t get test MSE below ~1.0, because the labels carry noise with variance 1. Know what floor you\'re fighting.',
      '<code>np.polyfit</code> minimizes squared error over polynomial coefficients — linear regression on features [1, x, x², …], which is exactly the next lesson.',
    ],
  },
  lab: {
    title: 'Lab: build a train/test split and catch an overfitter red-handed',
    prompt: 'Implement (1) <code>train_test_split_ids(n, test_fraction, seed)</code> — deterministically shuffle indices <code>0..n−1</code> with <code>random.Random(seed).shuffle</code> and return <code>(train_ids, test_ids)</code>; (2) <code>mse(y_true, y_pred)</code>; (3) <code>diagnose(train_mse, val_mse)</code> returning <code>"underfit"</code>, <code>"overfit"</code>, or <code>"healthy"</code> using two rules: healthy if val ≤ 1.5× train AND train &lt; 1.0; underfit if train ≥ 1.0; else overfit. (These thresholds are for the exercise — real life calibrates per problem.)',
    starter: `import random

def train_test_split_ids(n, test_fraction=0.25, seed=0):
    # shuffle list(range(n)) with random.Random(seed), split off the last test_fraction
    pass

def mse(y_true, y_pred):
    pass

def diagnose(train_mse, val_mse):
    # "underfit" if train_mse >= 1.0
    # "healthy" if val_mse <= 1.5 * train_mse (and train < 1.0)
    # else "overfit"
    pass
`,
    checks: [
      { re: 'def\\s+train_test_split_ids', must: true, hint: 'Define train_test_split_ids(n, test_fraction, seed).' },
      { re: 'random\\.Random\\s*\\(', must: true, hint: 'Use random.Random(seed) so the split is reproducible — unseeded shuffles make experiments unrepeatable.' },
      { re: 'def\\s+diagnose', must: true, hint: 'Define diagnose(train_mse, val_mse).' },
      { re: 'shuffle', must: true, hint: 'Shuffle before splitting — unshuffled data is often ordered (by time, by class), which poisons the split.' },
    ],
    tests: `tr, te = train_test_split_ids(100, 0.25, seed=42)
assert len(tr) == 75 and len(te) == 25, f"75/25 split expected, got {len(tr)}/{len(te)}"
assert sorted(tr + te) == list(range(100)), "every index exactly once"
tr2, te2 = train_test_split_ids(100, 0.25, seed=42)
assert (tr, te) == (tr2, te2), "same seed must give same split"
tr3, _ = train_test_split_ids(100, 0.25, seed=7)
assert tr != tr3, "different seed should give a different split"
assert tr[:5] != [0, 1, 2, 3, 4], "did you forget to shuffle?"
assert abs(mse([1, 2, 3], [1, 2, 3])) < 1e-12
assert abs(mse([0, 0], [3, 4]) - 12.5) < 1e-9, "mse([0,0],[3,4]) = (9+16)/2 = 12.5"
assert diagnose(2.5, 2.7) == "underfit", "high train error = can't even fit the sample"
assert diagnose(0.1, 3.0) == "overfit", "tiny train, huge val = memorized noise"
assert diagnose(0.8, 0.9) == "healthy"
print("The dojo ghost is exposed. Your split is honest and your diagnosis automatic.")`,
    solution: `import random

def train_test_split_ids(n, test_fraction=0.25, seed=0):
    ids = list(range(n))
    random.Random(seed).shuffle(ids)
    n_test = int(n * test_fraction)
    return ids[n_test:], ids[:n_test]

def mse(y_true, y_pred):
    return sum((a - b) ** 2 for a, b in zip(y_true, y_pred)) / len(y_true)

def diagnose(train_mse, val_mse):
    if train_mse >= 1.0:
        return "underfit"
    if val_mse <= 1.5 * train_mse:
        return "healthy"
    return "overfit"`,
    notes: [
      '<code>random.Random(seed)</code> creates a private, seeded generator — better practice than seeding the global <code>random</code> module, which other code might disturb.',
      'The diagnose() rules mirror how you actually read learning curves; internalize the shape-reading, not the thresholds.',
    ],
  },
  quiz: [
    {
      q: 'Train MSE 0.02, validation MSE 4.1. Diagnosis and best first move?',
      options: [
        'Underfitting — use a bigger model',
        'Overfitting — regularize, get more data, or simplify the model',
        'Healthy — ship it',
        'The validation set must be broken',
      ],
      correct: 1,
      explain: 'A huge train/val gap = variance = memorized noise. Bigger models make it worse; more data, regularization, early stopping or simpler hypotheses fix it.',
    },
    {
      q: 'More training data will NOT meaningfully help when a model is…',
      options: ['overfitting', 'underfitting (high bias)', 'trained with SGD', 'ensembled'],
      correct: 1,
      explain: 'A straight line stays wrong about a U-shape at any sample size — bias is a hypothesis-space problem. More data specifically shrinks variance.',
    },
    {
      q: '"Predict the next token" is called self-supervised because…',
      options: [
        'no loss function is needed',
        'the labels are manufactured from the data itself — the next token IS the label, no annotator required',
        'the model supervises another model',
        'it is unsupervised',
      ],
      correct: 1,
      explain: 'Structurally it\'s supervised classification (features: context; label: next token) with labels generated for free from raw text — which is what made internet-scale training data possible.',
    },
    {
      q: 'In the bias-variance decomposition, "variance" refers to…',
      options: [
        'the variance of the labels',
        'how much the trained model would differ if trained on different random samples of data',
        'the spread of the features',
        'the model\'s output entropy',
      ],
      correct: 1,
      explain: 'Re-draw the training set, re-train, repeat: bias = the average model\'s systematic miss; variance = the wobble across re-trainings. Overfit models wobble wildly because they chase each sample\'s private noise.',
    },
    {
      q: 'Your time-series model looks great offline, terrible in production. The most classic cause:',
      options: [
        'The model is too small',
        'Random (not temporal) train/test splitting let the model peek at the future',
        'The learning rate was too low',
        'Production servers are slower',
      ],
      correct: 1,
      explain: 'Random splits scatter future rows into training — offline evaluation then measures "predicting the past from the future". Split by time: train on past, validate on future, always.',
    },
  ],
  pitfalls: [
    'Evaluating on training data — Joey grading his own French. Everything looks fluent from inside the training set.',
    'Fitting preprocessing (scalers, vocabularies, feature selection, PCA) on all data before splitting. The test set leaks into training through the statistics. Split first; fit transforms on train only.',
    'Fighting the wrong disease: adding data to a biased model, or adding capacity to an overfit one. Diagnose from the curves before spending.',
    'Tuning hyperparameters against the test set. That converts it into a validation set and your final number into marketing.',
    'Ignoring the irreducible-noise floor and burning weeks chasing error a perfect model couldn\'t remove. Estimate the floor (label noise, human agreement rate) early.',
  ],
  interview: [
    {
      q: 'Explain overfitting and how you detect and prevent it.',
      a: 'Overfitting is when a model captures sample-specific noise along with the signal, so training performance overstates real performance — the model effectively memorizes rather than generalizes. Detection: gap between training and validation metrics, validation loss rising while training loss keeps falling, and instability across cross-validation folds. Prevention, matched to cause: more/more-diverse data, regularization (L2/L1, dropout), reduced capacity, early stopping, data augmentation, and ensembling to average away variance. I\'d also mention the discipline that makes detection trustworthy: leak-free splits (temporal for time-series, grouped for repeated entities), transforms fit on train only, and a test set touched exactly once.',
    },
    {
      q: 'Explain the bias-variance trade-off with a concrete example.',
      a: 'Expected squared error decomposes into bias² + variance + irreducible noise. Bias is systematic error from an inflexible hypothesis space; variance is sensitivity to the particular training sample. Concrete: fitting 12 noisy points from a quadratic — a line (degree 1) misses the curvature everywhere (high bias, but re-trainings agree: low variance); a degree-9 polynomial threads every point exactly but swings wildly between samples (near-zero bias, huge variance); degree 2 minimizes the sum. Complexity, regularization strength, k in KNN, tree depth — all are knobs on this same dial. Modern caveat worth volunteering: heavily overparameterized deep nets can defy the classic U-curve (double descent) thanks to implicit regularization, but the framework still governs classical models and drives the vocabulary of every model-debugging conversation.',
    },
    {
      q: 'You can either collect 10× more training data or do a hyperparameter search. How do you decide?',
      a: 'Diagnose first — the learning curves decide. If train error is already near the noise floor and validation lags far behind (variance problem), data wins: variance shrinks with sample size, and I\'d confirm by plotting validation error vs training-set size — if it\'s still falling at the current size, more data has headroom. If train and validation are both high (bias problem), more data is nearly worthless; I need a richer model or better features, which the hyperparameter/architecture search addresses. Also weigh costs: labeling 10× data has fixed cost and often helps every future model, while tuning gains are model-specific. The one-sentence version interviewers want: "I\'d read the train/val curves to see whether I\'m bias-limited or variance-limited, because data only cures variance."',
    },
    {
      q: 'What is data leakage? Give three examples you\'ve seen or could imagine.',
      a: 'Leakage is any path by which information unavailable at prediction time contaminates training or evaluation, inflating offline metrics. Examples: (1) preprocessing leakage — normalizing or selecting features using statistics of the full dataset before splitting, so test-set properties shape the training pipeline; (2) temporal leakage — random splits on time-series let models train on the future ("predicting" a stock dip it already saw); (3) group leakage — the same patient/user appears in train and test, so the model recognizes individuals instead of learning the condition; bonus (4) target leakage — a feature that\'s a proxy for the label ("account_closed_date" when predicting churn). Detection heuristics: results too good to be true, single features with implausible importances, and offline/online performance gaps. The cure is pipeline discipline: split first, fit transforms inside the training fold only, and design features from strictly pre-prediction-time information.',
    },
  ],
};
