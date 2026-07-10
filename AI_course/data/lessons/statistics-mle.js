window.LESSONS = window.LESSONS || {};
window.LESSONS['statistics-mle'] = {
  id: 'statistics-mle',
  title: 'Statistics for ML: Sampling, MLE & Why Loss Functions Exist',
  category: 'Part 1 — Math Prerequisites',
  timeMin: 45,
  summary: 'Statistics is the bridge from "the data I have" to "the world that generated it". This lesson gives you sampling and estimators, then the crown jewel: maximum likelihood estimation — the principle that explains where MSE and cross-entropy actually come from. After this, loss functions stop being arbitrary recipes.',
  goals: [
    'Distinguish population vs sample, and say precisely what an estimator and its bias are.',
    'Derive the MLE for a coin, and sketch why "minimize MSE" = "MLE under Gaussian noise" and "minimize cross-entropy" = "MLE for classification".',
    'Explain regularization as a prior (MAP) in one sentence.',
    'Spot correlation-vs-causation traps and explain why train/test splits are a statistical necessity, not a convention.',
  ],
  concept: [
    {
      h: 'Sample vs population: the fundamental gap',
      p: [
        'The <b>population</b> is the whole world you care about (all emails ever, all future users). The <b>sample</b> is the finite dataset you actually have. Statistics is the discipline of reasoning honestly across that gap — and <i>every</i> dataset in ML is a sample, so every model is a statistical inference whether you admit it or not.',
        'An <b>estimator</b> is a formula that turns a sample into a guess about the population: the sample mean x̄ estimates the true mean μ; a trained model\'s weights estimate the "true" input→output relationship. Estimators have quality properties: <b>bias</b> (does it aim at the right target on average? E[estimator] − truth), and <b>variance</b> (how much does it wobble between samples?). You met this pair informally with mini-batches; Part 2 makes it the master trade-off of all ML.',
        'One concrete classic so "bias" is never abstract: the naive variance estimator (1/n)Σ(xᵢ−x̄)² is biased — systematically too small, because x̄ was itself fit to the same sample and sits closer to the data than the true μ does. Dividing by n−1 instead fixes it (that\'s "Bessel\'s correction", the mysterious <code>ddof=1</code> in NumPy). Remember the <i>mechanism</i>: anything fit to a sample looks better on that sample than on the world. That sentence, scaled up, is overfitting.',
      ],
    },
    {
      h: 'Maximum Likelihood Estimation: the master recipe',
      p: [
        'You have data and a family of models with a knob θ. Which θ to pick? <b>MLE</b> says: the θ under which your observed data would have been most probable.',
        '<div class="math">θ̂ = argmax_θ P(data | θ) = argmax_θ Σᵢ log P(xᵢ | θ)<span class="mnote">we maximize the log — same argmax (log is increasing), but products of tiny numbers become sums, kind to both algebra and floating point</span></div>',
        'Coin example, fully worked. You flip 10 times, see 7 heads. Model: heads with probability p. Likelihood: L(p) = p⁷(1−p)³. Log: 7·log p + 3·log(1−p). Differentiate (last lesson\'s tool!) and set to zero: 7/p − 3/(1−p) = 0 → 7(1−p) = 3p → <b>p̂ = 0.7</b>. The intuitive answer, now derived, not assumed — and the same calculus works when θ is a billion weights.',
        'Now the payoff that reorganizes everything you\'ll learn after this:',
        '<ul><li><b>Regression + Gaussian noise assumption</b> → log-likelihood of each point is −(yᵢ − ŷᵢ)²/2σ² + const → maximizing it is <i>exactly</i> minimizing the <b>mean squared error</b>. MSE isn\'t a convention; it\'s MLE wearing a work uniform.</li><li><b>Classification</b> → the model outputs P(class | x); maximizing the log-probability of the true labels is <i>exactly</i> minimizing <b>cross-entropy</b>. Same story.</li><li><b>LLM pretraining</b> (Part 6) → maximize Σ log P(next token | context) over trillions of tokens. GPT\'s objective is literally the coin derivation at cosmic scale.</li></ul>',
      ],
    },
    {
      h: 'Regularization = a prior (the one-line Bayesian view)',
      p: [
        'MLE has a known failure mode: with little data it chases noise (flip a coin twice, see 2 heads, MLE says p̂ = 1.0 — the coin can NEVER land tails. Absurd). The Bayesian fix: bring a prior. Maximize P(data|θ)·P(θ) instead — <b>MAP</b> (maximum a posteriori) estimation.',
        '<div class="math">argmax_θ [log P(data|θ) + log P(θ)] = argmin_θ [loss + penalty]<span class="mnote">a Gaussian prior on weights ⇒ penalty λ‖w‖² (L2 / "weight decay"); a Laplace prior ⇒ λ‖w‖₁ (L1 / sparsity)</span></div>',
        'So when Part 2 adds "+ λ‖w‖²" to a loss and calls it regularization, you\'ll know what it secretly is: a prior belief that weights should be small, keeping the fit from chasing noise. One equation, two philosophies, same code.',
      ],
    },
    {
      h: 'Correlation, causation, and why we split train/test',
      p: [
        '<b>Correlation</b> (Pearson r ∈ [−1,1]) measures linear co-movement of two variables. It is genuinely useful — and famously not causation: ice-cream sales correlate with drownings (shared cause: summer). Models trained on observational data learn correlations, full stop; they will happily learn "hospital visits predict death" and other confounded patterns. Knowing when a correlation supports an <i>intervention</i> ("if we change X, Y will move") requires experiments (A/B tests) or careful causal reasoning — a one-sentence answer interviewers respect: "my model predicts well under the data distribution it saw; acting on it changes the distribution."',
        'And the train/test split, restated as statistics: evaluating on training data measures how well you fit <i>this sample</i> (Bessel\'s lesson: always optimistically). Evaluating on held-out data estimates performance on the <i>population</i> — the thing you actually care about. Touch the test set repeatedly while making decisions and it silently becomes training data; your estimate inflates. That\'s why serious work uses three splits (train/validation/test) and touches test exactly once, at the end. This is not ritual; it\'s unbiased estimation.',
      ],
    },
  ],
  story: {
    onePiece: {
      title: 'Robin and the hull numbers: estimating a fleet you can\'t see',
      text: [
        'The crew has captured three Marine patrol ships. Stamped on each hull: <b>No. 042</b>, <b>No. 117</b>, <b>No. 189</b>. Nami wants to know: how big is the Marine fleet in this sea? Nobody can sail out and count the population — but Robin can reason from the sample.',
        '"Suppose the fleet had 1000 ships," she says. "Then three random captures would probably include some high numbers — the odds that all three fall below 190 are (190/1000)³ ≈ 0.7%. Our observations would be a bizarre coincidence. Now suppose the fleet has exactly 189 ships — then numbers like ours are perfectly typical. Under which fleet size is what we <i>actually saw</i> most probable?" That question — rank all hypotheses by how well they explain the observed sample — is maximum likelihood estimation, and it\'s how Allied statisticians famously estimated German tank production from captured serial numbers (getting ~270/month while intelligence guessed 1,400; the statisticians were right).',
        'Then Robin adds the Bayesian footnote: "If the fleet were truly 189 ships, capturing exactly the maximum would be a little lucky — a wise estimator nudges above the largest serial seen." (The classic correction: max + max/n − 1 ≈ 251.) And when Usopp objects that maybe the Marines paint random numbers to fool pirates — that\'s a different <i>model</i> of the data, and all inference is conditional on the model you assume. Statistics doesn\'t free you from assumptions; it makes them explicit enough to criticize.',
      ],
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s chocolate experiments: intervention beats observation',
      text: [
        'Sheldon doesn\'t merely <i>observe</i> that Penny is quieter on days she eats chocolate and declare victory — a correlation that could mean anything (maybe she buys chocolate on calm days). Instead he runs an intervention: every time Penny behaves "correctly", he hands her a chocolate, and her behavior shifts measurably. By <i>controlling</i> the variable rather than passively recording it, he isolates the causal arrow (to Leonard\'s horror: "You can\'t train my girlfriend like a lab rat!").',
        'That\'s the entire correlation-vs-causation lesson: observational data tells you what moves together; only intervention — an A/B test, an experiment — tells you what happens when YOU move something. Your model, trained observationally, is Sheldon before the chocolates: pattern-spotter, not physicist.',
      ],
    },
    why: 'Robin\'s hull numbers make MLE a scene you can replay: line up candidate worlds, ask which makes the observed sample least surprising, and remember the correction for "the sample flatters itself" (Bessel, overfitting, test sets — same mechanism). Sheldon\'s chocolates pin the intervention/observation line.',
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'h1', emoji: '🚢', label: 'No. 042', x: 16, y: 66 },
      { id: 'h2', emoji: '🚢', label: 'No. 117', x: 34, y: 66 },
      { id: 'h3', emoji: '🚢', label: 'No. 189', x: 52, y: 66 },
      { id: 'hyp1', emoji: '❓', label: 'fleet = 1000?', x: 22, y: 18 },
      { id: 'hyp2', emoji: '❓', label: 'fleet = 500?', x: 50, y: 18 },
      { id: 'hyp3', emoji: '❓', label: 'fleet ≈ 190?', x: 78, y: 18 },
      { id: 'ans', emoji: '📜', label: '', x: 80, y: 82 },
    ],
    actors: [
      { id: 'robin', emoji: '📖', label: 'Robin', x: 8, y: 84 },
    ],
    steps: [
      { c: 'Three captured hulls: 042, 117, 189. The whole fleet (the population) is invisible. Estimate it from the sample.', p: { h1: 'lit', h2: 'lit', h3: 'lit' } },
      { c: 'Hypothesis: 1000 ships. Then all three draws under 190 has probability (0.19)³ ≈ 0.7% — our data would be a freak coincidence. Low likelihood.', p: { hyp1: 'bad' }, a: { robin: [22, 40] } },
      { c: 'Hypothesis: 500 ships. Better — (0.38)³ ≈ 5.5% — but still treats our sample as unusual.', p: { hyp2: 'dim' }, a: { robin: [50, 40] } },
      { c: 'Hypothesis: ~190 ships. Now numbers like 042/117/189 are exactly what you\'d expect. Highest likelihood wins: that\'s MLE.', p: { hyp3: 'good' }, a: { robin: [78, 40] } },
      { c: 'Robin\'s correction: seeing the exact maximum is a bit lucky — nudge up: max + max/n − 1 ≈ 251. Samples flatter themselves; good estimators compensate.', l: { ans: 'fleet ≈ 251' }, p: { ans: 'good' } },
      { c: 'Same logic ran the real German tank problem (statisticians ~270/mo, spies said 1400 — statisticians won). And GPT training = this scene, over trillions of tokens. 🏴‍☠️', p: { h1: 'good', h2: 'good', h3: 'good' } },
    ],
  },
  conceptFlow: {
    title: 'Robin\'s fleet estimate, step by step',
    intro: 'Same hull numbers as the story — 042, 117, 189.',
    stages: [
      { label: 'Sample', nodes: [
        { id: 'hulls', text: 'Observed\n042, 117, 189' },
      ]},
      { label: 'Candidates', nodes: [
        { id: 'h1000', text: 'Fleet = 1000?\nP(this sample) ≈ 0.7%' },
        { id: 'h190', text: 'Fleet ≈ 190?\nthis sample is typical' },
      ]},
      { label: 'Pick', nodes: [
        { id: 'mle', text: 'MLE\nhighest-likelihood world wins' },
      ]},
      { label: 'Correct', nodes: [
        { id: 'correction', text: 'Bias correction\nmax + max/n − 1 ≈ 251' },
      ]},
    ],
    steps: [
      { active: ['hulls'], note: 'Three captured hull numbers: 042, 117, 189. The full fleet size is invisible — estimate it from this sample.' },
      { active: ['h1000'], note: 'Hypothesis: 1000 ships. All three draws landing under 190 would be a roughly 0.7% coincidence — low likelihood.' },
      { active: ['h190', 'mle'], note: 'Hypothesis: about 190 ships. Now these exact numbers are completely typical. Highest likelihood wins — that IS maximum likelihood estimation.' },
      { active: ['correction'], note: 'One correction: seeing the exact maximum is a little lucky, so nudge upward — max + max/n − 1 ≈ 251. Samples flatter themselves; good estimators compensate.' },
    ],
  },
  tech: [
    {
      q: 'Why does everyone work with LOG likelihood instead of likelihood?',
      a: 'Three reasons, one practical killer. (1) Products become sums: the likelihood of a dataset is a product of per-point probabilities, and sums are what calculus and SGD like — the gradient of a sum is the sum of per-example gradients, which is what makes mini-batching possible. (2) Floating point: the probability of 1000 specific coin flips is ~10⁻³⁰⁰, which underflows to exactly 0.0 in float64 and destroys all information; log-space keeps it as a tame −690. (3) The argmax is unchanged since log is monotonic. When you later see "NLL loss" (negative log-likelihood) or <code>log_softmax</code> in PyTorch, this is why they exist — always compute in log-space.',
    },
    {
      q: 'So is EVERY loss function secretly a likelihood?',
      a: 'The big two are exactly: MSE = Gaussian-noise MLE, cross-entropy = categorical MLE — and their variants (MAE = Laplace-noise MLE, which is why MAE is robust to outliers: Laplace has heavy tails and doesn\'t panic about them). Some other losses are engineering constructions instead (hinge loss for SVMs, ranking/triplet losses, RL objectives), chosen for geometry rather than probability. The professional value of knowing the correspondence: when you pick a loss you are silently assuming a noise model, so "should I use MSE or MAE?" becomes an answerable question about your data ("how heavy are my outliers?") instead of folklore.',
    },
    {
      q: 'What does np.std(x) vs np.std(x, ddof=1) mean, and when does it actually matter?',
      a: '<code>ddof=0</code> (default) divides by n: correct if x IS your whole population, and the MLE of variance. <code>ddof=1</code> divides by n−1: unbiased when x is a sample and you\'re estimating the population variance (Bessel\'s correction — the compensation for x̄ hugging its own sample). Numerically it matters only for small n (n=5: 25% difference; n=10,000: nothing). Conceptually it matters forever: it\'s the smallest concrete instance of "fit and evaluation on the same data is optimistic", the principle that scales up to why test sets exist. Pandas defaults to ddof=1 and NumPy to ddof=0 — a real source of "why don\'t our numbers match" bugs.',
    },
    {
      q: 'What is a confidence interval, and what\'s the honest way to get one for a model\'s accuracy?',
      a: 'A 95% confidence interval is a range built by a procedure that captures the true value in 95% of repeated samplings — it quantifies "how much would this number wobble with different data?". For model accuracy on n test examples, the quick formula is acc ± 1.96·√(acc(1−acc)/n) (binomial standard error): 90% accuracy on 100 examples is really "84%–96%" — worth saying out loud before shipping conclusions. The workhorse general method is the <b>bootstrap</b>: resample your test set with replacement 1000 times, recompute the metric each time, take the 2.5th–97.5th percentiles. No formula needed, works for F1/AUC/anything — and telling an interviewer you\'d bootstrap the eval is an instant seniority signal.',
    },
  ],
  code: {
    title: 'Worked example — MLE for a coin, three ways (calculus, grid, simulation)',
    intro: 'Same estimate from the derivative, from brute-force search, and by checking the log-likelihood surface. Also: watch MLE misbehave on tiny samples, then get rescued by a prior.',
    code: `import numpy as np

heads, flips = 7, 10

# --- 1) The calculus answer (derived in the lesson): p = heads/flips
print(heads / flips)                       # 0.7

# --- 2) Grid search over candidate p: maximize log-likelihood
p_grid = np.linspace(0.01, 0.99, 999)
loglik = heads * np.log(p_grid) + (flips - heads) * np.log(1 - p_grid)
print(p_grid[np.argmax(loglik)])           # 0.7 (grid agrees with calculus)

# --- 3) Tiny-sample pathology: 2 flips, 2 heads
loglik2 = 2 * np.log(p_grid) + 0 * np.log(1 - p_grid)
print(p_grid[np.argmax(loglik2)])          # 0.99 -> MLE says "coin ~never tails"!

# --- 4) MAP rescue: add a prior believing coins are near-fair
#     Beta(2,2) prior  ->  + log[p(1-p)]  (one extra pseudo-head and pseudo-tail)
logpost = loglik2 + np.log(p_grid) + np.log(1 - p_grid)
print(p_grid[np.argmax(logpost)])          # 0.75 — sane again. Regularization!

# MSE-as-MLE, numerically: Gaussian log-density of residuals vs plain MSE
resid = np.array([0.5, -1.0, 0.2])
mse_rank = (resid**2).mean()
gauss_ll = -0.5 * (resid**2).sum()         # dropping constants
print(mse_rank, gauss_ll)  # one goes down exactly as the other goes up`,
    notes: [
      'The prior added one imaginary head and one imaginary tail ("pseudo-counts") — regularization at its most touchable. Laplace smoothing in Naive Bayes (Part 2) is this exact trick.',
      'Grid search on a 1-D problem is a legitimate professional tool for building intuition — plot the log-likelihood curve and you can SEE how sharply the data pins down the parameter (2 flips: broad, flat, ignorant; 1000 flips: needle).',
    ],
  },
  lab: {
    title: 'Lab: implement MLE for the coin — and Robin\'s fleet estimator',
    prompt: 'Implement (1) <code>coin_loglik(p, heads, tails)</code> — the log-likelihood using <code>math.log</code>, (2) <code>coin_mle(heads, tails)</code> — return the p in <code>[i/1000 for i in 1..999]</code> maximizing your log-likelihood (grid search; do NOT just return the formula — the point is to feel argmax-of-likelihood), and (3) <code>fleet_estimate(serials)</code> — Robin\'s corrected estimator: max + max/n − 1.',
    starter: `import math

def coin_loglik(p, heads, tails):
    # heads * log(p) + tails * log(1 - p)
    pass

def coin_mle(heads, tails):
    # grid-search p over i/1000 for i in 1..999; return argmax of coin_loglik
    pass

def fleet_estimate(serials):
    # German tank / Marine fleet: m + m/n - 1, where m = max, n = count
    pass
`,
    checks: [
      { re: 'def\\s+coin_loglik', must: true, hint: 'Define coin_loglik(p, heads, tails).' },
      { re: 'math\\.log', must: true, hint: 'Work in log-space with math.log — products of probabilities underflow.' },
      { re: 'def\\s+coin_mle', must: true, hint: 'Define coin_mle(heads, tails).' },
      { re: 'def\\s+fleet_estimate', must: true, hint: 'Define fleet_estimate(serials).' },
      { re: 'range\\s*\\(', must: true, hint: 'coin_mle should grid-search candidates (a loop/comprehension over range), not just return heads/(heads+tails).' },
    ],
    tests: `assert coin_loglik(0.7, 7, 3) > coin_loglik(0.5, 7, 3), "0.7 must explain 7H/3T better than 0.5"
assert coin_loglik(0.7, 7, 3) > coin_loglik(0.9, 7, 3), "...and better than 0.9"
p = coin_mle(7, 3)
assert abs(p - 0.7) < 0.002, f"MLE for 7H/3T should be ~0.7, got {p}"
p2 = coin_mle(2, 0)
assert p2 > 0.99, f"tiny-sample MLE should hit the boundary (~0.999): got {p2} — this is WHY priors exist"
est = fleet_estimate([42, 117, 189])
assert abs(est - 251.0) < 1.0, f"Robin expects ~251, got {est}"
assert fleet_estimate([10]) == 19.0, "single serial 10: 10 + 10/1 - 1 = 19"
print("Robin smiles: the invisible fleet is measured, and you know what GPT maximizes.")`,
    solution: `import math

def coin_loglik(p, heads, tails):
    return heads * math.log(p) + tails * math.log(1 - p)

def coin_mle(heads, tails):
    grid = [i / 1000 for i in range(1, 1000)]
    return max(grid, key=lambda p: coin_loglik(p, heads, tails))

def fleet_estimate(serials):
    m, n = max(serials), len(serials)
    return m + m / n - 1`,
    notes: [
      '<code>max(grid, key=...)</code> is Python\'s cleanest argmax idiom — worth owning.',
      'The 2-heads test hitting p≈0.999 is the overfitting demon in its smallest cage. You\'ll re-meet it wearing bigger costumes (deep nets memorizing noise) — same demon, same exorcism (priors/regularization/more data).',
    ],
  },
  quiz: [
    {
      q: 'You flip a coin 20 times and get 13 heads. The MLE of P(heads) is…',
      options: ['0.5 — coins are fair', '0.65', '0.13', 'impossible to say'],
      correct: 1,
      explain: '13/20 = 0.65: the p that makes the observed data most probable. Whether you should BELIEVE 0.65 (vs a fair-coin prior) is the MLE-vs-MAP question — with 20 flips, a strong fairness prior would still hold your estimate near 0.5.',
    },
    {
      q: '"Minimizing MSE" is equivalent to maximum likelihood when you assume…',
      options: [
        'the model is linear',
        'prediction errors are Gaussian-distributed',
        'the data is normalized',
        'nothing — they are unrelated',
      ],
      correct: 1,
      explain: 'Gaussian log-density of a residual is −(y−ŷ)²/2σ² + const, so maximizing total log-likelihood = minimizing summed squared error. Heavy-tailed noise → this assumption breaks → MAE/Huber (Laplace-ish MLE) behave better.',
    },
    {
      q: 'L2 regularization (weight decay) corresponds, in the Bayesian view, to…',
      options: [
        'a uniform prior on weights',
        'a Gaussian prior centered at zero on the weights',
        'assuming Gaussian noise on the labels',
        'dropping small weights',
      ],
      correct: 1,
      explain: 'MAP = argmax [log-likelihood + log-prior]; a zero-mean Gaussian prior contributes −λ‖w‖². (L1 ↔ Laplace prior, which pushes weights to exactly zero — sparsity.)',
    },
    {
      q: 'Why must the test set be touched only once, at the very end?',
      options: [
        'To save compute',
        'Every decision made while peeking at it leaks information, biasing it from "population estimate" toward "training data"',
        'Because the test set is smaller',
        'It\'s only a convention from Kaggle',
      ],
      correct: 1,
      explain: 'Choosing hyperparameters/architectures based on test performance is fitting to the test sample — the same mechanism as Bessel\'s bias, at pipeline scale. Validation sets absorb the peeking; the test set stays an unbiased estimator.',
    },
    {
      q: 'Cities with more firefighters have more fires. Therefore firefighters cause fires. The flaw is…',
      options: [
        'the sample is too small',
        'a confounder (city size) drives both variables; correlation from observation can\'t orient or explain the arrow',
        'fires are not normally distributed',
        'the correlation is probably negative',
      ],
      correct: 1,
      explain: 'Big cities have more of both. Only intervention (or careful causal inference) separates "moves together" from "moving one moves the other" — Sheldon\'s chocolates, not passive watching.',
    },
  ],
  testFlow: {
    title: 'Test yourself: MLE & statistics',
    start: 'q1',
    nodes: {
      q1: { qid: 'q1', q: 'You flip a coin 20 times and get 13 heads. The MLE of P(heads) is...', choices: [
        { text: '0.5 — coins are fair by assumption', to: 'q1_wrong_fair' },
        { text: '0.65', to: 'q1_right' },
        { text: '0.13', to: 'q1_wrong_count' },
      ]},
      q1_right: { end: true, correct: true, text: 'Right — 13/20 = 0.65, the p that makes the observed 13-heads-in-20 data most probable. A fairness PRIOR could pull an estimate back toward 0.5 (that\'s MAP, not MLE) — but pure MLE just answers "which p explains this data best."', next: 'q2' },
      q1_wrong_fair: { end: true, correct: false, text: '0.5 is a PRIOR belief, not what the observed data itself supports. MLE asks only "which p makes THIS data most probable" — that\'s 13/20 = 0.65, no prior involved.', retry: 'q1' },
      q1_wrong_count: { end: true, correct: false, text: 'That\'s just the raw head-count, not a probability estimate. MLE for a Bernoulli/binomial parameter is heads/total flips: 13/20 = 0.65.', retry: 'q1' },
      q2: { qid: 'q2', q: '"Minimizing MSE" is mathematically equivalent to maximum likelihood estimation when you assume...', choices: [
        { text: 'The model is linear', to: 'q2_wrong_linear' },
        { text: 'Prediction errors (residuals) are Gaussian-distributed', to: 'q2_right' },
        { text: 'The data has been normalized first', to: 'q2_wrong_norm' },
      ]},
      q2_right: { end: true, correct: true, text: 'Right — the Gaussian log-density of a residual is −(y−ŷ)²/2σ² + const, so maximizing total log-likelihood under that noise model is exactly minimizing summed squared error.', next: 'q3' },
      q2_wrong_linear: { end: true, correct: false, text: 'The MSE-MLE equivalence has nothing to do with model linearity — it holds for ANY model shape, as long as the NOISE on the residuals is assumed Gaussian.', retry: 'q2' },
      q2_wrong_norm: { end: true, correct: false, text: 'Normalization is a preprocessing convenience, not what makes MSE equal to a likelihood. The equivalence comes specifically from assuming Gaussian-distributed prediction errors.', retry: 'q2' },
      q3: { qid: 'q3', q: 'Cities with more firefighters have more fires. Therefore firefighters cause fires. What\'s the actual flaw in this reasoning?', choices: [
        { text: 'The sample size is too small', to: 'q3_wrong_sample' },
        { text: 'A confounder (city size) drives both variables — observational correlation alone can\'t establish the causal arrow', to: 'q3_right' },
        { text: 'Fires aren\'t normally distributed', to: 'q3_wrong_normal' },
      ]},
      q3_right: { end: true, correct: true, text: 'Right — bigger cities have both more firefighters AND more fires. Only intervention (or careful causal inference) can separate "moves together" from "moving one moves the other."', },
      q3_wrong_sample: { end: true, correct: false, text: 'Sample size isn\'t the issue here — even a huge, statistically solid sample would show this correlation. The problem is a hidden confounding variable (city size), not insufficient data.', retry: 'q3' },
      q3_wrong_normal: { end: true, correct: false, text: 'The distribution shape of fires is irrelevant to this reasoning error. The flaw is purely about correlation vs. causation: a third variable explains both observed quantities.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Trusting MLE on tiny samples: 2/2 heads → "p = 1.0". Small data needs priors (regularization / pseudo-counts) or humility, ideally both.',
    'Multiplying many raw probabilities: 300 factors of ~0.1 underflow float64 to zero. Always sum logs.',
    'Fitting anything (scaler, feature selection, vocabulary, PCA) on the full dataset before splitting — the test set silently contaminates training. Split FIRST; fit transforms on train only.',
    'Reporting a single accuracy number from a 200-example test set without an interval: 90% ± 4% and 90% ± 0.4% justify very different decisions.',
    'Acting on model correlations as if they were levers: "users who get email X churn less, so send more X" — maybe calm users both tolerate email and stay. A/B test before believing the arrow.',
  ],
  interview: [
    {
      q: 'What is maximum likelihood estimation? Derive the MLE for a biased coin.',
      a: 'MLE picks the parameters under which the observed data is most probable: θ̂ = argmax P(data|θ), in practice argmax of the log-likelihood. Coin with k heads in n flips: L(p) = pᵏ(1−p)ⁿ⁻ᵏ; ℓ(p) = k·log p + (n−k)·log(1−p); set dℓ/dp = k/p − (n−k)/(1−p) = 0 → p̂ = k/n. Worth adding unprompted: the same principle IS the standard training objectives — MSE is Gaussian MLE, cross-entropy is categorical MLE, and LLM pretraining maximizes Σ log P(next token|context) — plus the caveat that small-sample MLE overfits (2/2 heads → p=1), which is what priors/regularization (MAP) correct.',
    },
    {
      q: 'Explain the connection between regularization and Bayesian priors.',
      a: 'MAP estimation maximizes log P(data|w) + log P(w) — likelihood plus prior. If the prior on weights is a zero-mean Gaussian, log P(w) = −λ‖w‖² + const: exactly L2 regularization/weight decay. A Laplace prior gives L1 and its push-to-exactly-zero sparsity. So the regularization strength λ encodes prior confidence that weights are small: more data → likelihood term dominates → regularization matters less, which matches practice. This view also explains WHY regularization combats overfitting: it\'s injecting the belief "extreme parameter values need extraordinary evidence", precisely the fix for MLE chasing noise in small samples.',
    },
    {
      q: 'Your A/B test shows the new model lifts click-through from 5.0% to 5.2% on 10,000 users per arm. Ship it?',
      a: 'Check significance before celebrating: per-arm standard error is √(p(1−p)/n) ≈ 0.22 percentage points, so the observed 0.2pp lift is about one standard error of the DIFFERENCE (~0.31pp) — entirely consistent with noise; a z-test gives p ≈ 0.5. I\'d run longer (power analysis says detecting 0.2pp at 80% power needs ~500k+ users per arm), pre-register the metric, and watch for novelty effects and segment differences. Also worth saying: statistical significance ≠ business significance, and repeatedly peeking at the test inflates false positives unless using sequential-testing corrections. This question is mostly a filter for whether candidates reflexively compute the standard error — do that first.',
    },
    {
      q: 'What\'s the difference between the training loss going down and the model actually being good?',
      a: 'Training loss measures fit to the sample; "good" means low expected loss on the population — and anything optimized on a sample looks better on that sample than on the world (the same bias Bessel\'s correction fixes for variance). The gap between the two is overfitting, monitored by validation loss; the honest final estimate comes from a test set used exactly once. Deeper version: every choice made while observing an evaluation (hyperparameters, early stopping, architecture picks, even which paper ideas you kept) is a degree of freedom fit to that evaluation, which is why validation and test must be separate, why Kaggle has public/private leaderboards, and why production monitoring exists — the deployment distribution keeps drifting away from your test set.',
    },
  ],
};
