window.LESSONS = window.LESSONS || {};
window.LESSONS['logistic-regression'] = {
  id: 'logistic-regression',
  title: 'Logistic Regression & Classification',
  category: 'Part 2 — Classical ML',
  timeMin: 40,
  summary: 'The bridge from regression to classification — and secretly the final layer of every neural classifier and every LLM. A weighted sum, squashed to a probability, trained with cross-entropy: learn it deeply once here and you\'ve pre-learned a third of deep learning.',
  goals: [
    'Explain why a sigmoid converts scores into probabilities and what the "logit" is.',
    'Write the binary cross-entropy loss and its (astonishingly clean) gradient.',
    'Choose decision thresholds by cost, not by reflex-0.5.',
    'Explain softmax as the multiclass generalization — the exact output layer of an LLM.',
  ],
  concept: [
    {
      h: 'From score to probability: the sigmoid',
      p: [
        'Classification wants P(class = 1 | x), but a weighted sum z = w·x + b produces any real number. The <b>sigmoid</b> squashes ℝ → (0, 1):',
        '<div class="math">σ(z) = 1 / (1 + e^{−z})<span class="mnote">σ(0) = 0.5 · σ(+∞) → 1 · σ(−∞) → 0 · smooth and differentiable: σ′ = σ(1−σ)</span></div>',
        'So logistic regression is: <b>ŷ = σ(w·x + b)</b> — linear regression\'s score reinterpreted as a probability. The raw score z is called the <b>logit</b>, and it has a precise meaning: z = log(p/(1−p)), the log-odds. Each unit of a feature adds its weight to the log-odds — multiplies the odds by e^w. (This is where the "logits" that LLMs emit get their name — they\'re pre-softmax scores, same concept.)',
        'The <b>decision boundary</b> — where the model is 50/50 — is where z = 0, i.e. the hyperplane w·x + b = 0. Logistic regression carves space with a flat blade; features decide the blade\'s angle. It cannot carve curves (that\'s what feature engineering or neural nets add), but in high dimensions flat blades are shockingly effective — which is why it remains the default baseline for text classification and tabular problems.',
      ],
    },
    {
      h: 'The loss and its beautiful gradient',
      p: [
        'From the information-theory lesson: the right loss for probabilities is cross-entropy (= MLE for Bernoulli labels):',
        '<div class="math">L = −(1/n) Σᵢ [ yᵢ log ŷᵢ + (1−yᵢ) log(1−ŷᵢ) ]<span class="mnote">per example: −log(probability assigned to the TRUE class)</span></div>',
        'Now differentiate through the sigmoid (chain rule: ∂L/∂ŷ · σ′(z) · ∂z/∂w), and the messy middle terms cancel perfectly:',
        '<div class="math">∂L/∂w = (1/n) Σᵢ (ŷᵢ − yᵢ) · xᵢ &nbsp;&nbsp; ∂L/∂b = (1/n) Σᵢ (ŷᵢ − yᵢ)<span class="mnote">identical in form to linear regression\'s gradients — error times input</span></div>',
        'Pause on that. Swap the model (add a sigmoid) and the loss (MSE → cross-entropy), and the gradient comes out the SAME shape: (prediction − truth)·input. This is not coincidence — sigmoid+cross-entropy were made for each other (cross-entropy\'s log cancels the sigmoid\'s exp), and the same cancellation happens for softmax+cross-entropy in every neural net and LLM. It\'s also why we do NOT use MSE here: MSE through a sigmoid leaves σ′ = σ(1−σ) in the gradient, which is ≈ 0 when the model is confidently wrong — the saturated model stops learning exactly when it most needs to.',
      ],
    },
    {
      h: 'Thresholds are business decisions, not math',
      p: [
        'The model outputs probabilities; turning them into decisions needs a threshold, and 0.5 is only right when both mistakes cost the same. They almost never do: missing a fraud costs $10,000, flagging a legit user costs a support ticket. If a false negative costs C_FN and a false positive C_FP, the cost-minimizing rule is: predict positive when p > C_FP/(C_FP + C_FN). Cheap false alarms ⇒ low threshold; expensive false alarms ⇒ high.',
        'This is also your first contact with the precision/recall trade-off (fully developed in the evaluation lesson): sliding the threshold down catches more true positives (recall ↑) at the price of more false alarms (precision ↓). The model doesn\'t change — your operating point on it does. Engineers who understand "the threshold is a product decision exposed by a well-calibrated model" get hired.',
      ],
    },
    {
      h: 'Softmax: the multiclass sigmoid (and the LLM\'s mouth)',
      p: [
        'For k classes, compute k scores z₁…z_k (one weight vector per class) and normalize with <b>softmax</b> (information-theory lesson):',
        '<div class="math">P(class = j | x) = e^{z_j} / Σₘ e^{z_m}</div>',
        'Sigmoid is exactly the k = 2 case. Training minimizes −log P(true class) — cross-entropy again — and the gradient again comes out (softmax output − one-hot truth). An LLM\'s final layer is precisely this with k ≈ 100,000 token classes: a 100k-way logistic regression riding on a transformer\'s features. You have now seen, in miniature and in full math, the exact component that "chooses the next word".',
      ],
    },
  ],
  story: {
    onePiece: {
      title: 'Smoker\'s checkpoint: probability, not verdict',
      text: [
        'Loguetown harbor, Captain Smoker\'s checkpoint. Every arriving traveler gets scored on evidence: visible sword (+2 to suspicion), fresh bounty-poster resemblance (+4), trembling when Marines pass (+1), merchant\'s guild papers (−3). The clerk sums the weighted evidence into one number z — a suspicion score that can be anything from −10 to +10. But "arrest at score 3" is meaningless policy until scores become <b>probabilities</b>: Smoker\'s conversion chart squashes any score into "chance this one\'s a pirate" — score 0 → 50%, +4 → 98%, −4 → 2%. Sigmoid: evidence in, calibrated belief out.',
        'Now the part rookie Marines get wrong: Tashigi asks, "so we arrest above 50%?" Smoker growls no. Arresting an innocent merchant means paperwork, an angry guild, a day wasted (cheap false positive) — but letting a Supernova stroll through means a burned harbor (catastrophic false negative). So the checkpoint arrests at 20% suspicion: threshold set by <i>costs</i>, not by symmetry. Down the coast, a checkpoint near the merchant capital — where wrongful arrests start trade wars — runs the same scorer at a 90% threshold. Same model, different operating points.',
        'And how did the weights get their values? From history: every time the checkpoint\'s predicted probability disagreed with the truth (that "merchant" was Luffy), each feature\'s weight got nudged by (predicted − actual) × feature — swords\' weight rises after sword-carrying pirates slip through. That update is literally the logistic-regression gradient, running on Marine bureaucracy.',
      ],
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s friendship algorithm outputs a probability, eventually',
      text: [
        'Sheldon\'s literal flowchart for making friends ("have you had a meal recently? would you like a hot beverage?") is a hard classifier: every answer routes to a rigid yes/no verdict, no shades. It promptly traps him in an infinite loop until Howard patches it — because reality doesn\'t come in clean verdicts.',
        'What Sheldon needed was Smoker\'s design: score the evidence (shared interests +3, "enjoys camping" −5, "knows Fortran" +2), squash to a probability of friendship-compatibility, and pick thresholds per decision — maybe 40% clears "get coffee" while "give them a key to the apartment" needs 99.7% (Leonard barely qualifies). Soft probabilities + cost-aware thresholds beat brittle flowcharts. This is also the honest difference between logistic regression and a hand-written rule engine — the weights are learned from outcomes, and the output admits uncertainty.',
      ],
    },
    why: 'Smoker\'s checkpoint packages the whole model: weighted evidence (logits), the conversion chart (sigmoid), weight-nudging from mistakes (the gradient), and — the part interviews probe — thresholds set by asymmetric costs, with different deployments choosing different operating points on the same model.',
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'f1', emoji: '🗡️', label: 'sword +2', x: 14, y: 22 },
      { id: 'f2', emoji: '📜', label: 'poster match +4', x: 14, y: 46 },
      { id: 'f3', emoji: '📄', label: 'guild papers −3', x: 14, y: 70 },
      { id: 'sum', emoji: '🧮', label: 'z = ?', x: 46, y: 46 },
      { id: 'sig', emoji: '📈', label: 'σ(z)', x: 68, y: 46 },
      { id: 'gate', emoji: '🚧', label: 'threshold 20%', x: 88, y: 46 },
    ],
    actors: [
      { id: 'traveler', emoji: '🕵️', label: 'traveler', x: 30, y: 86 },
      { id: 'smoker', emoji: '💨', label: 'Smoker', x: 70, y: 86 },
    ],
    steps: [
      { c: 'A traveler approaches: sword visible, faint poster resemblance, no guild papers. Each feature carries a learned weight.', p: { f1: 'lit', f2: 'lit', f3: 'dim' } },
      { c: 'Weighted sum: z = 2 + 4 + 0 = +6. Raw evidence score — any real number. This is the LOGIT.', p: { sum: 'lit' }, l: { sum: 'z = +6' } },
      { c: 'The conversion chart squashes it: σ(6) ≈ 0.997. Now it speaks probability: "99.7% pirate."', p: { sig: 'good' }, l: { sig: 'p = 0.997' } },
      { c: 'Threshold check: 0.997 > 0.20 → arrest. (The 20% bar exists because missed pirates burn harbors; false arrests only burn paperwork.)', p: { gate: 'bad' }, a: { smoker: [86, 70] } },
      { c: 'Next traveler: guild papers, no sword. z = −3 → σ(−3) ≈ 0.05 < 0.20 → wave through. Same model, calibrated humility.', l: { sum: 'z = −3', sig: 'p = 0.05' }, p: { f1: 'dim', f2: 'dim', f3: 'lit', gate: 'good', sig: 'lit' } },
      { c: 'That night, "the merchant" turns out to be Luffy. Every weight nudges by (predicted − truth) × feature. The checkpoint learns. 🏴‍☠️', p: { sum: 'good' }, l: { f2: 'poster match +4.5' } },
    ],
  },
  tech: [
    {
      q: 'Where does the sigmoid formula come from? It looks arbitrary.',
      a: 'Run the logic backwards from odds. Suppose you want log-odds to be linear in features: log(p/(1−p)) = w·x + b = z (a natural modeling choice — each unit of evidence multiplies the odds by a constant factor, like Bayes evidence accumulating). Solve for p: p/(1−p) = e^z ⇒ p = e^z(1−p) ⇒ p(1+e^z) = e^z ⇒ p = e^z/(1+e^z) = 1/(1+e^{−z}). The sigmoid isn\'t a squashing function someone liked; it\'s the unique inverse of "log-odds are linear". Softmax is the same derivation for k classes. Bonus identity used everywhere in backprop: σ′(z) = σ(z)(1−σ(z)).',
    },
    {
      q: 'Why does everyone warn against MSE for classification when it "sort of works"?',
      a: 'Compute the gradient and look at it. MSE through sigmoid: ∂L/∂z = (ŷ − y)·σ′(z) = (ŷ − y)·ŷ(1−ŷ). Consider a confidently wrong model: y = 1, ŷ = 0.0001. The error factor is ≈ −1 (huge), but ŷ(1−ŷ) ≈ 0.0001 — the gradient is strangled to nothing precisely at maximum wrongness. The model is stuck in a flat region of its own making. Cross-entropy\'s log cancels the sigmoid\'s saturation: ∂L/∂z = ŷ − y, full signal at any confidence. Also: MSE on probabilities is non-convex through a sigmoid (multiple local minima), while cross-entropy is convex — guaranteed single optimum for logistic regression.',
    },
    {
      q: 'What does sklearn\'s LogisticRegression(C=1.0) mean, and what solver does it use?',
      a: '<code>C</code> is INVERSE regularization strength: C = 1/λ, so smaller C = more L2 regularization (and it\'s applied by default — sklearn\'s logistic regression is secretly ridge-regularized MAP, not pure MLE; people are routinely surprised). Solvers: <code>lbfgs</code> (default) is a quasi-Newton method — uses approximate curvature for fast convergence on small/medium dense data; <code>liblinear</code> for small sparse/L1; <code>saga</code> for huge sparse data and L1/elastic-net. There\'s no closed form (the loss is non-quadratic — this is why the normal equation died last lesson), so everything is iterative; <code>max_iter</code> warnings mean the optimizer hit its budget before converging — scale your features first, then raise the budget.',
    },
    {
      q: 'Are logistic regression\'s probabilities actually calibrated?',
      a: 'Better than most models\' — cross-entropy directly rewards calibration, and with enough data and a well-specified model, predicted 0.7s come true ~70% of the time. But three things break it: strong regularization (shrinks weights → probabilities squeezed toward 0.5 → underconfident), class imbalance handling like re-weighting/oversampling (shifts the base rate the intercept encodes → systematically wrong probabilities until you correct the intercept), and model misspecification (the true boundary isn\'t linear). Check with a reliability diagram; fix with Platt scaling or isotonic regression on validation data. Neural nets are worse offenders (overconfident), as flagged in the probability lesson.',
    },
  ],
  code: {
    title: 'Worked example — Smoker\'s checkpoint in NumPy',
    intro: 'Two features (sword, papers), a training loop with the clean gradient, and threshold analysis at the end. Note how little changed from linear regression — one squash, one loss.',
    code: `import numpy as np
rng = np.random.default_rng(3)

# 200 travelers: [has_sword, has_guild_papers]; pirates tend to sword=1, papers=0
n = 200
is_pirate = rng.random(n) < 0.3
sword  = np.where(is_pirate, rng.random(n) < 0.8, rng.random(n) < 0.2).astype(float)
papers = np.where(is_pirate, rng.random(n) < 0.1, rng.random(n) < 0.7).astype(float)
X = np.stack([sword, papers], axis=1)          # (200, 2)
y = is_pirate.astype(float)

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

w, b, lr = np.zeros(2), 0.0, 0.5
for epoch in range(300):
    p = sigmoid(X @ w + b)                     # (200,) predicted probabilities
    err = p - y                                # THE gradient signal: pred - truth
    w -= lr * (X.T @ err) / n                  # error correlated with each feature
    b -= lr * err.mean()

print("weights:", w.round(2), "bias:", round(b, 2))
# sword weight positive, papers weight negative — the model learned the signals

# --- thresholds are policy ---
p = sigmoid(X @ w + b)
for thresh in [0.5, 0.2]:
    arrest = p > thresh
    caught  = (arrest & is_pirate).sum() / is_pirate.sum()        # recall
    wrongful = (arrest & ~is_pirate).sum() / max(arrest.sum(), 1) # 1 - precision
    print(f"threshold {thresh}: catch {caught:.0%} of pirates; "
          f"{wrongful:.0%} of arrests are wrongful")`,
    notes: [
      'The training loop differs from linear regression by ONE line (the sigmoid). The gradient lines are literally identical — that\'s the sigmoid+cross-entropy cancellation at work.',
      'Lowering the threshold from 0.5 to 0.2 raises the catch rate and the wrongful-arrest rate together. Neither number is "the accuracy" — full treatment in the evaluation lesson.',
      '<code>X.T @ err / n</code> computes all feature gradients in one matmul — the vectorized form of "for each feature: error times feature, averaged".',
    ],
  },
  lab: {
    title: 'Lab: build Smoker\'s checkpoint (pure Python)',
    prompt: 'Implement <code>sigmoid(z)</code>, <code>predict_proba(w, b, x)</code> for one 2-feature example, and <code>fit_logistic(X, y, lr=0.5, epochs=400)</code> using the (prediction − truth)×feature gradient, means over the dataset. Then <code>decide(p, cost_fp, cost_fn)</code>: return <code>True</code> (arrest) when p exceeds the cost-optimal threshold cost_fp/(cost_fp + cost_fn).',
    starter: `import math

def sigmoid(z):
    pass

def predict_proba(w, b, x):
    # sigmoid(w[0]*x[0] + w[1]*x[1] + b)
    pass

def fit_logistic(X, y, lr=0.5, epochs=400):
    w, b = [0.0, 0.0], 0.0
    n = len(X)
    for _ in range(epochs):
        # for each example: p = predict_proba, err = p - y_i
        # grad_w[j] = mean of err * x[j];  grad_b = mean of err
        pass
    return w, b

def decide(p, cost_fp, cost_fn):
    # arrest when p > cost_fp / (cost_fp + cost_fn)
    pass
`,
    checks: [
      { re: 'def\\s+sigmoid', must: true, hint: 'Define sigmoid(z).' },
      { re: 'math\\.exp\\s*\\(\\s*-|exp\\(-z\\)', must: true, hint: 'sigmoid needs e^(−z): math.exp(-z).' },
      { re: 'def\\s+fit_logistic', must: true, hint: 'Define fit_logistic(X, y, lr, epochs).' },
      { re: 'def\\s+decide', must: true, hint: 'Define decide(p, cost_fp, cost_fn).' },
      { re: 'cost_fp\\s*/\\s*\\(\\s*cost_fp\\s*\\+\\s*cost_fn\\s*\\)', must: true, hint: 'The optimal threshold is cost_fp / (cost_fp + cost_fn).' },
    ],
    tests: `assert abs(sigmoid(0) - 0.5) < 1e-9, "sigma(0) = 0.5"
assert sigmoid(6) > 0.99 and sigmoid(-6) < 0.01, "extremes should saturate"
assert abs(sigmoid(2) + sigmoid(-2) - 1.0) < 1e-9, "symmetry: sigma(z) + sigma(-z) = 1"

# travelers: [sword, papers] -> pirate?
X = [[1,0],[1,0],[1,1],[0,0],[0,1],[0,1],[1,0],[0,1],[0,0],[1,0]]
y = [1,    1,    0,    0,    0,    0,    1,    0,    1,    1]
w, b = fit_logistic(X, y, lr=0.8, epochs=2000)
assert w[0] > 0.5, f"sword weight should be clearly positive, got {w[0]:.2f}"
assert w[1] < -0.5, f"papers weight should be clearly negative, got {w[1]:.2f}"
p_pirate = predict_proba(w, b, [1, 0])
p_merchant = predict_proba(w, b, [0, 1])
assert p_pirate > 0.7, f"sword+no-papers should look piratey, got {p_pirate:.2f}"
assert p_merchant < 0.3, f"papers+no-sword should look safe, got {p_merchant:.2f}"

# cost-aware thresholds: missed pirates are 4x costlier -> arrest above 20%
assert decide(0.35, cost_fp=1, cost_fn=4) is True, "0.35 > 0.2 threshold: arrest"
assert decide(0.35, cost_fp=4, cost_fn=1) is False, "0.35 < 0.8 threshold: release"
assert decide(0.5, cost_fp=1, cost_fn=1) is False, "exactly at 0.5: not strictly greater"
print("Checkpoint operational. Tashigi is taking notes on your thresholds.")`,
    solution: `import math

def sigmoid(z):
    return 1 / (1 + math.exp(-z))

def predict_proba(w, b, x):
    return sigmoid(w[0]*x[0] + w[1]*x[1] + b)

def fit_logistic(X, y, lr=0.5, epochs=400):
    w, b = [0.0, 0.0], 0.0
    n = len(X)
    for _ in range(epochs):
        grad_w0 = grad_w1 = grad_b = 0.0
        for xi, yi in zip(X, y):
            err = predict_proba(w, b, xi) - yi
            grad_w0 += err * xi[0]
            grad_w1 += err * xi[1]
            grad_b += err
        w[0] -= lr * grad_w0 / n
        w[1] -= lr * grad_w1 / n
        b -= lr * grad_b / n
    return w, b

def decide(p, cost_fp, cost_fn):
    return p > cost_fp / (cost_fp + cost_fn)`,
    notes: [
      'For large |z|, <code>math.exp(-z)</code> can overflow (z < −700). Production sigmoids branch on sign or use log-space tricks — another reason to use library fused ops (BCEWithLogitsLoss).',
      'Notice x=[1,1] was labeled 0 and x=[0,0] appeared as 1 in training — noisy, overlapping classes, like reality. The model still finds the right weights; probability is the honest output format for overlap.',
    ],
  },
  quiz: [
    {
      q: 'The "logit" z = w·x + b in logistic regression is…',
      options: [
        'the probability of class 1',
        'the log-odds: log(p/(1−p)) — sigmoid is its inverse',
        'the loss',
        'the decision threshold',
      ],
      correct: 1,
      explain: 'Sigmoid converts log-odds to probability; each feature unit adds its weight to the log-odds (multiplies odds by e^w). LLM "logits" are the same concept pre-softmax.',
    },
    {
      q: 'The gradient of cross-entropy through sigmoid w.r.t. the logit is…',
      options: ['ŷ(1−ŷ)', 'ŷ − y', '(ŷ − y)·ŷ(1−ŷ)', '−y/ŷ'],
      correct: 1,
      explain: 'The log and the exp cancel to leave (prediction − truth), pure and unstrangled. Option C is MSE-through-sigmoid — with the σ′ factor that kills learning when confidently wrong.',
    },
    {
      q: 'Fraud detection: a missed fraud costs $5,000, a false alarm costs $50. The cost-optimal threshold on P(fraud) is about…',
      options: ['0.5', '0.99', '0.01 (≈ 50/5050)', '0.9'],
      correct: 2,
      explain: 'Threshold = C_FP/(C_FP + C_FN) = 50/5050 ≈ 0.0099: flag anything above ~1%. Expensive misses push thresholds DOWN. The threshold is a business decision computed from costs.',
    },
    {
      q: 'An LLM\'s final layer, mathematically, is…',
      options: [
        'a database lookup over its training data',
        'a ~100k-class softmax (multiclass logistic regression) over the transformer\'s features',
        'a sigmoid per token',
        'a decision tree over embeddings',
      ],
      correct: 1,
      explain: 'Features from the transformer → one linear score per vocabulary token → softmax → categorical distribution. You have now fully understood one entire component of GPT.',
    },
  ],
  pitfalls: [
    'Using MSE for classification "because it\'s simpler" — gradients vanish exactly on confidently-wrong examples, and the loss becomes non-convex. Sigmoid pairs with cross-entropy.',
    'Reflexive 0.5 thresholds. On imbalanced or cost-asymmetric problems (i.e., most real ones), 0.5 is almost never the right operating point.',
    'Forgetting sklearn regularizes by default (C = 1.0). Your "plain" logistic regression is MAP-with-Gaussian-prior; on small data the shrinkage visibly biases coefficients toward 0.',
    'Perfectly separable data sends unregularized weights to infinity (the optimizer keeps sharpening the probability toward 1 forever). Regularization fixes it — know this as the answer to "when does logistic regression fail to converge?".',
    'Reporting accuracy on a 99/1 imbalanced problem: the always-say-no model scores 99%. Precision/recall (next lessons) or you\'re flying blind.',
  ],
  interview: [
    {
      q: 'Why cross-entropy instead of MSE for logistic regression? Give the mathematical reason.',
      a: 'Two rigorous reasons. Gradients: with cross-entropy, ∂L/∂z = ŷ − y — full corrective signal at any confidence level. With MSE, ∂L/∂z = (ŷ − y)·σ′(z), and σ′ ≈ 0 whenever the sigmoid saturates — so a confidently wrong model receives almost no gradient, stalling exactly when correction matters most. Convexity: cross-entropy makes logistic regression\'s loss convex in (w, b) — one global optimum, reliable convergence — while MSE through a sigmoid is non-convex with flat regions and local minima. Underneath both: cross-entropy IS the Bernoulli maximum-likelihood objective, so it also yields approximately calibrated probabilities, which MSE doesn\'t promise.',
    },
    {
      q: 'Interpret the coefficients of a fitted logistic regression for a stakeholder.',
      a: 'Each weight is the change in LOG-ODDS per unit of the feature, holding others fixed: e^w is the odds multiplier — "each prior chargeback multiplies fraud odds by e^0.7 ≈ 2" is stakeholder-ready. The intercept sets the base rate when features are zero (only meaningful if zero is meaningful — standardize or center for interpretability). Honest caveats I\'d volunteer: effects on PROBABILITY are nonlinear (the same log-odds bump moves 50%→67% but 1%→2%), correlated features make individual weights unstable (credit shifts between twins), regularization shrinks everything toward zero, and none of it is causal without experimental design.',
    },
    {
      q: 'Your logistic model must run at a different precision/recall operating point next quarter. Do you retrain?',
      a: 'No — the model produces probabilities; the operating point is the threshold, which is a deployment configuration, not a model parameter. I\'d recompute the threshold from the new cost structure (optimal threshold = C_FP/(C_FP+C_FN) for cost minimization, or pick the point on the validation precision-recall curve meeting the new constraint, e.g. "recall ≥ 95%, maximize precision"). Retraining enters only if the probabilities themselves are poor at the new operating region — check calibration there (reliability diagram); if miscalibrated, first try recalibration (Platt/isotonic) before touching the model. This separation — model estimates probabilities once; products choose thresholds per use-case — is exactly how one fraud model serves both a "block transaction" flow and a "soft review" flow.',
    },
    {
      q: 'When would you choose logistic regression over a gradient-boosted tree or a neural net in 2026?',
      a: 'When any of these dominate: (1) interpretability/regulatory needs — coefficients are auditable odds-ratios (credit scoring, healthcare); (2) small data — low variance, convex training, and regularization-as-prior make it hard to beat under a few thousand examples; (3) high-dimensional sparse features like text n-grams or hashed categoricals, where linear models with L1/L2 are strong and trees struggle; (4) latency/simplicity — one dot product per prediction, trivially servable at any scale, no feature-interaction machinery to maintain; (5) as the baseline — if the fancy model can\'t beat calibrated logistic regression by a business-meaningful margin, ship the simple one. Boosted trees win on medium tabular data with interactions; neural nets win with raw unstructured inputs (text/images/audio). Naming the decision criteria matters more than the verdict.',
    },
  ],
};
