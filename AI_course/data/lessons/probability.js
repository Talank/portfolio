window.LESSONS = window.LESSONS || {};
window.LESSONS['probability'] = {
  id: 'probability',
  title: 'Probability: Bayes, Distributions, Expectation',
  category: 'Part 1 — Math Prerequisites',
  timeMin: 50,
  summary: 'ML models don\'t output answers — they output probabilities. This lesson gives you the working vocabulary: conditional probability, Bayes\' rule (the math of updating beliefs), the distributions you\'ll actually meet, and expectation/variance. An LLM is, formally, one enormous conditional probability table — so none of this is optional.',
  goals: [
    'Manipulate P(A|B), joint and marginal probabilities without hand-waving.',
    'Apply Bayes\' rule to real problems (diagnostics, spam, unreliable witnesses) and explain the base-rate fallacy.',
    'Recognize Bernoulli, categorical and Gaussian distributions and where each appears in ML.',
    'Compute expectation and variance, and connect "expected value" to loss functions and sampling.',
  ],
  concept: [
    {
      h: 'Probability as bookkeeping of uncertainty',
      p: [
        'A probability is a number in [0,1] tracking how strongly you believe something; the beliefs over all mutually exclusive outcomes must sum to 1. Everything else is bookkeeping rules:',
        '<div class="math">Joint: P(A, B) = P(A|B)·P(B) &nbsp;&nbsp; Marginal: P(A) = Σ_b P(A, B=b)<span class="mnote">"|" reads "given": P(A|B) = probability of A in the world where B is known true</span></div>',
        '<b>Conditional probability</b> is the load-bearing idea for AI: P(rain | dark clouds) ≠ P(rain). Conditioning = updating on information. A language model is precisely a machine for one conditional distribution: P(next token | all previous tokens). When people say "LLMs just predict the next word", the technically exact statement is: they compute this conditional distribution, and we sample from it.',
        '<b>Independence</b>: A and B are independent when knowing B changes nothing: P(A|B) = P(A), equivalently P(A,B) = P(A)P(B). Most naive-but-useful models (Naive Bayes, Part 2) work by <i>pretending</i> features are independent because it makes the math collapse into products.',
      ],
    },
    {
      h: 'Bayes\' rule: how evidence updates belief',
      p: [
        'Flip the conditioning direction — derived in one line from the two ways of writing the joint P(A,B):',
        '<div class="math">P(H|E) = P(E|H) · P(H) / P(E)<span class="mnote">posterior = likelihood × prior / evidence</span></div>',
        'In words: your belief in hypothesis H after seeing evidence E = (how well H explains E) × (how plausible H was beforehand), renormalized. The three named pieces — <b>prior</b> P(H), <b>likelihood</b> P(E|H), <b>posterior</b> P(H|E) — are permanent vocabulary; they show up from spam filters to A/B tests to the phrase "prior" in every ML conversation you\'ll ever have.',
        'The classic trap it guards against — the <b>base-rate fallacy</b> — deserves a full worked example. A disease affects 1% of patients. A test catches 90% of true cases (sensitivity) but also false-alarms on 9% of healthy patients. You test positive. Chance you\'re sick?',
        '<div class="math">P(sick|+) = (0.9 × 0.01) / (0.9×0.01 + 0.09×0.99) = 0.009 / 0.0981 ≈ <b>9.2%</b><span class="mnote">Not 90%. The rare prior dominates: among 10,000 patients, 90 true positives drown under 891 false alarms.</span></div>',
        'Most people — including doctors in published studies — guess 80–90%. The prior is doing the work: rare things stay improbable even after moderately strong evidence. Interviewers love this; so do fraud-detection and medical-AI systems, where positive predictions on rare classes are mostly false alarms unless the model is extremely precise (this connects directly to precision/recall in Part 2).',
      ],
    },
    {
      h: 'The distributions you\'ll actually meet',
      p: [
        '<b>Bernoulli(p)</b>: one yes/no event with success probability p. The output of a binary classifier (spam or not) is a Bernoulli p — and logistic regression (Part 2) is exactly a machine that maps features to that p.',
        '<b>Categorical</b>: one draw among k options with probabilities p₁…p_k summing to 1. The output of <i>every</i> LLM at every step is one categorical distribution over ~100,000 tokens; "temperature" and "top-p" (Part 6) are just ways of reshaping and sampling this distribution.',
        '<b>Gaussian / normal N(μ, σ²)</b>: the bell curve, defined by mean μ and variance σ². Ubiquitous for three reasons: the Central Limit Theorem (sums/averages of many small independent effects come out bell-shaped, whatever the pieces looked like), maximal entropy for a given variance (the "least opinionated" choice), and analytic convenience. Weight initialization, measurement noise models, VAEs, diffusion models — Gaussian country, all of it.',
        'Distributions come as a <b>PMF</b> (probability of each discrete outcome — bar chart) or a <b>PDF</b> (density for continuous values — curve whose <i>area</i> over an interval is the probability; the height alone is not a probability and can exceed 1).',
      ],
    },
    {
      h: 'Expectation and variance: the summary numbers',
      p: [
        '<div class="math">E[X] = Σ x·P(X=x) &nbsp;&nbsp;&nbsp; Var(X) = E[(X − E[X])²]<span class="mnote">expectation = probability-weighted average; variance = expected squared deviation; σ = √Var</span></div>',
        'Expectation is the long-run average per trial: a die\'s E = (1+2+…+6)/6 = 3.5 — never rolled, always approached. Variance measures spread around that average.',
        'Why ML cares, concretely: <b>every loss you minimize is an expectation</b> — "average wrongness over the data distribution", estimated by averaging over a batch. SGD works because a random mini-batch\'s average gradient has the true gradient as its expectation (an <i>unbiased estimate</i>), with variance that shrinks as batches grow — that\'s the entire statistical justification for training on batches of 32 instead of the whole internet per step. And "the model\'s expected reward" is the literal objective in RLHF (Part 6).',
      ],
    },
  ],
  story: {
    onePiece: {
      title: 'Usopp\'s tall tales: Bayes\' rule with an unreliable witness',
      text: [
        'Usopp bursts onto deck: "A SEA KING the size of an island is behind us!!" Should the crew man the cannons? Nami runs the numbers she knows. Prior: island-sized Sea Kings in these waters are rare — say 1 voyage in 100 meets one, P(H) = 0.01. Likelihood: <i>if</i> one were really there, Usopp would certainly yell about it, P(E|H) ≈ 1. But the crucial second likelihood: Usopp yells about imaginary monsters constantly — on a monster-free day there\'s still a 30% chance of exactly this performance, P(E|¬H) = 0.3.',
        'Bayes: P(H|E) = (1 × 0.01) / (1 × 0.01 + 0.3 × 0.99) ≈ 0.033. After the famous alarm, belief in the monster rose from 1% to just 3.3% — evidence from a noisy channel barely moves the needle against a strong prior. Zoro goes back to sleep. This is why one weak signal shouldn\'t flip your fraud model\'s decision, and why a spam filter needs the word "FREE" to be much rarer in real mail than in spam before it convicts.',
        'But Bayes cuts both ways: moments later NAMI sees the shadow herself. Her false-alarm rate is ~1%, so with her report, P(H|E) = (1×0.01)/(1×0.01 + 0.01×0.99) ≈ 50% — and two independent reports push it near certainty. Same prior, different likelihood ratios: the reliability of the sensor determines how much a positive report is worth. (And remember Elbaf: sometimes the 3.3% happens — low posterior means unlikely, not impossible.)',
      ],
    },
    sitcom: {
      show: 'Friends',
      title: 'The lottery episode: expectation vs hope',
      text: [
        'The gang pools money for dozens of Powerball tickets, and Phoebe insists the "vibes" are right. Run the actual numbers: a ticket costs $1, the jackpot is $300 million, and the odds are about 1 in 292 million. E[winnings] = 300,000,000 × (1/292,000,000) ≈ $1.03 — before taxes, shared jackpots and the far-likelier small prizes drag the realistic expected return to roughly $0.50 per $1 ticket. The expected value says: every ticket converts a dollar into fifty cents, on average, forever.',
        'That\'s expectation as a decision tool: not "you won\'t win" (someone does!) but "the probability-weighted average outcome is a loss". Casinos, insurance and loss functions all live on this one formula — and when your model minimizes "expected loss over the data", it\'s doing exactly this arithmetic, millions of times, with gradients.',
      ],
    },
    why: 'Usopp gives you Bayes as a permanent instinct: posterior = prior reshaped by the reliability of the channel — weak channels (Usopp) barely move beliefs, reliable ones (Nami) move them a lot. The lottery pins expectation: probability-weighted average, computed before the dice roll.',
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'prior', emoji: '🌊', label: 'prior P(monster)=1%', x: 14, y: 20 },
      { id: 'monster', emoji: '🐉', label: '?', x: 86, y: 16 },
      { id: 'meter', emoji: '📊', label: 'belief: 1%', x: 14, y: 82 },
    ],
    actors: [
      { id: 'usopp', emoji: '🔭', label: 'Usopp (30% false alarms)', x: 40, y: 40 },
      { id: 'nami', emoji: '🍊', label: 'Nami (1% false alarms)', x: 40, y: 66 },
      { id: 'zoro', emoji: '⚔️', label: 'Zoro', x: 64, y: 52 },
    ],
    steps: [
      { c: 'Calm seas. Prior: island-sized Sea Kings show up on 1% of voyages. Belief meter: 1%.', p: { prior: 'lit' } },
      { c: '"MONSTER!!" — Usopp\'s alarm. But Usopp alarms on 30% of monster-free days too. How much should belief move?', a: { usopp: [52, 34] }, p: { monster: 'lit' } },
      { c: 'Bayes: (1.0 × 0.01) / (0.01 + 0.3 × 0.99) ≈ 3.3%. Noisy channel, strong prior: needle barely moves. Zoro resumes napping.', l: { meter: 'belief: 3.3%' }, p: { meter: 'lit' } },
      { c: 'Now NAMI sees it too — and she false-alarms only 1% of the time. Same formula, sharper likelihood ratio…', a: { nami: [52, 60] }, p: { monster: 'bad' } },
      { c: '…posterior jumps to ~50%. Then Usopp AND Nami together (independent evidence multiplies): belief ≈ 97%. Cannons out!', l: { meter: 'belief: ~97%' }, p: { meter: 'good' }, a: { zoro: [70, 40] } },
      { c: 'Every spam filter, fraud model and medical classifier is this scene: prior × likelihood ratio, per feature, renormalize. 🏴‍☠️', p: { prior: 'good', monster: 'bad' } },
    ],
  },
  conceptFlow: {
    title: 'Bayes\' rule: the disease test, step by step',
    intro: 'Same numbers as the worked example — a 1% prior, a 90%-sensitive, 9%-false-positive test.',
    stages: [
      { label: 'Before', nodes: [
        { id: 'prior', text: 'Prior\nP(sick) = 1%' },
      ]},
      { label: 'Test result', nodes: [
        { id: 'sens', text: 'Sensitivity\nP(+ | sick) = 90%' },
        { id: 'fpr', text: 'False-positive rate\nP(+ | healthy) = 9%' },
      ]},
      { label: 'Combine', nodes: [
        { id: 'bayes', text: 'Bayes\' rule\n(0.9×0.01) / (0.9×0.01 + 0.09×0.99)' },
      ]},
      { label: 'After', nodes: [
        { id: 'post', text: 'Posterior\n≈ 9.2% — NOT 90%' },
      ]},
    ],
    steps: [
      { active: ['prior'], note: 'Start with the prior: only 1% of patients actually have the disease.' },
      { active: ['sens', 'fpr'], note: 'The test catches 90% of true cases, but also false-alarms on 9% of healthy patients.' },
      { active: ['bayes'], note: 'Bayes\' rule combines them: likelihood times prior, divided by the total probability of testing positive at all.' },
      { active: ['post'], note: 'The result: only about 9.2% chance of actually being sick — the rare prior dominates a moderately noisy test, the base-rate fallacy made concrete.' },
    ],
  },
  tech: [
    {
      q: 'Why do people keep saying an LLM "is" a probability distribution?',
      a: 'Because that\'s its literal output type. Feed a transformer the tokens so far, and its final layer emits one number per vocabulary entry (~100k "logits"), which a softmax turns into a categorical distribution: P(next token = t | context). Generation = sample from it, append, repeat. Temperature scales the logits before softmax (flattening or sharpening the distribution); top-k/top-p crop its tail; greedy decoding takes the argmax. Training (Part 6) maximizes the probability the model assigns to the actual next tokens of real text — "maximize likelihood", the same phrase from Bayes, and the topic of the statistics lesson next.',
    },
    {
      q: 'Where does the softmax function come from, and why e^x of all things?',
      a: [
        'Softmax turns any real vector (logits z) into a valid distribution: p_i = e^{z_i} / Σ_j e^{z_j}. Why exponentials? (1) e^x is positive for any input, so probabilities are automatically ≥ 0 with no clamping; (2) it makes ratios depend only on logit <i>differences</i>: p_i/p_j = e^{z_i − z_j} — shifting all logits by a constant changes nothing (a numerical-stability gift: implementations subtract max(z) before exponentiating to avoid overflow, changing nothing mathematically); (3) it\'s the maximum-entropy distribution consistent with the given expected scores, i.e. the least-opinionated choice — and it makes the gradient of cross-entropy come out breathtakingly clean (softmax output − true one-hot), which you\'ll verify in Part 3.',
      ],
    },
    {
      q: 'What does np.random actually do — where does randomness come from in a deterministic computer?',
      a: 'It\'s pseudo-randomness: a deterministic algorithm (NumPy uses PCG64) that from a starting "seed" produces a stream of numbers statistically indistinguishable from random. Same seed → same stream, which is a feature: <code>np.random.default_rng(42)</code> / <code>torch.manual_seed(42)</code> make experiments reproducible — non-negotiable in research and in debugging ("is this improvement real or a lucky seed?"). Sampling from distributions is built on this stream: e.g. inverse-CDF or Box–Muller transforms turn uniform draws into Gaussian draws. GPU nondeterminism (parallel reduction order) means even seeded runs can differ slightly across hardware — worth knowing before you chase a phantom 0.1% regression.',
    },
    {
      q: 'What\'s the difference between probability and likelihood? People use them interchangeably.',
      a: 'Same formula, different variable held fixed. P(data | θ) as a function of <b>data</b> (θ fixed) is a probability distribution: sums to 1 over possible data. The same expression as a function of <b>θ</b> (data fixed — you already observed it) is the <i>likelihood</i> of the parameters: it does NOT sum to 1 over θ and is not a probability of θ. "Maximum likelihood estimation" (next lesson) = pick the θ that gives your observed data the highest probability. In Bayes\' rule, P(E|H) is called the likelihood precisely because E is fixed (you saw the evidence) and you\'re comparing hypotheses H.',
    },
  ],
  code: {
    title: 'Worked example — Bayes and expectation, verified by brute-force simulation',
    intro: 'The professional habit this example teaches: whenever a probability argument feels slippery, simulate it. A hundred thousand Monte-Carlo patients settle arguments fast.',
    code: `import numpy as np
rng = np.random.default_rng(0)

# --- Bayes by formula: the 1% disease, 90% sensitivity, 9% false positives
prior, sens, fpr = 0.01, 0.90, 0.09
posterior = (sens * prior) / (sens * prior + fpr * (1 - prior))
print(f"P(sick | positive) = {posterior:.3f}")        # 0.092

# --- Bayes by simulation: 1,000,000 patients
n = 1_000_000
sick = rng.random(n) < prior                      # who is actually sick
pos = np.where(sick, rng.random(n) < sens,        # sick: test + with p=0.9
                     rng.random(n) < fpr)          # healthy: + with p=0.09
print(f"simulated        = {sick[pos].mean():.3f}")   # ≈ 0.092  — formula confirmed

# --- Expectation & variance of a die, then the mini-batch idea
die = np.arange(1, 7)
E = die.mean()                                     # 3.5
var = ((die - E) ** 2).mean()                      # 2.9166...
print(E, var)

rolls = rng.integers(1, 7, size=(10_000, 8))       # 10k "batches" of 8 rolls
batch_means = rolls.mean(axis=1)
print(batch_means.mean())      # ≈ 3.5  : batch mean is UNBIASED for E
print(batch_means.std())       # ≈ sigma/sqrt(8): bigger batch -> less noise
# ...which is exactly why mini-batch gradients work, and why bigger batches
# give smoother (but not "more correct on average") gradient estimates.`,
    notes: [
      '<code>rng.random(n) < p</code> is the standard one-liner for "n Bernoulli(p) draws" — a uniform draw is below p exactly p of the time.',
      'The simulation agreeing with the formula to 3 decimals is not luck; it\'s the law of large numbers, and it\'s your permanent tool for checking probabilistic reasoning.',
      'batch_means.std() shrinking like 1/√batch-size is the fundamental trade-off behind choosing batch sizes in Part 3.',
    ],
  },
  lab: {
    title: 'Lab: implement Bayes\' rule and expected value',
    prompt: 'Implement (1) <code>bayes_posterior(prior, likelihood_h, likelihood_not_h)</code> returning P(H|E) for a single piece of evidence, and (2) <code>expected_value(outcomes, probs)</code> — with a guard that raises <code>ValueError</code> if the probabilities don\'t sum to 1 (within 1e-9). The tests re-run the disease example, both Usopp and Nami\'s alarms, and Phoebe\'s lottery ticket.',
    starter: `def bayes_posterior(prior, likelihood_h, likelihood_not_h):
    # P(H|E) = L_H * prior / (L_H * prior + L_notH * (1 - prior))
    pass

def expected_value(outcomes, probs):
    # sum of outcome * prob; raise ValueError if probs don't sum to ~1
    pass
`,
    checks: [
      { re: 'def\\s+bayes_posterior', must: true, hint: 'Define bayes_posterior(prior, likelihood_h, likelihood_not_h).' },
      { re: 'def\\s+expected_value', must: true, hint: 'Define expected_value(outcomes, probs).' },
      { re: 'raise\\s+ValueError', must: true, hint: 'Guard expected_value: probabilities must sum to 1 (within 1e-9) or raise ValueError.' },
      { re: '1\\s*-\\s*prior', must: true, hint: 'The evidence term needs the complement: likelihood_not_h * (1 - prior).' },
    ],
    tests: `p = bayes_posterior(0.01, 0.90, 0.09)
assert abs(p - 0.0917) < 0.001, f"disease example: expected ~0.092, got {p}"
usopp = bayes_posterior(0.01, 1.0, 0.30)
assert abs(usopp - 0.0326) < 0.001, f"Usopp's alarm: expected ~0.033, got {usopp}"
nami = bayes_posterior(0.01, 1.0, 0.01)
assert abs(nami - 0.5025) < 0.001, f"Nami's alarm: expected ~0.50, got {nami}"
both = bayes_posterior(usopp, 1.0, 0.01)   # chain updates: Usopp's posterior is Nami's prior
assert both > 0.75, f"two independent witnesses should convince: got {both}"
ev = expected_value([300_000_000, 0], [1/292_000_000, 1 - 1/292_000_000])
assert abs(ev - 1.0274) < 0.01, f"lottery EV ~ $1.03, got {ev}"
try:
    expected_value([1, 2], [0.5, 0.4])
    assert False, "should reject probs that don't sum to 1"
except ValueError:
    pass
print("Zoro can nap safely: your belief-updating math is sound.")`,
    solution: `def bayes_posterior(prior, likelihood_h, likelihood_not_h):
    evidence = likelihood_h * prior + likelihood_not_h * (1 - prior)
    return likelihood_h * prior / evidence

def expected_value(outcomes, probs):
    if abs(sum(probs) - 1.0) > 1e-9:
        raise ValueError(f"probabilities sum to {sum(probs)}, not 1")
    return sum(o * p for o, p in zip(outcomes, probs))`,
    notes: [
      'The chained test (Usopp\'s posterior becomes the prior for Nami\'s report) is how real sequential evidence works — and how spam filters combine many words\' evidence, one Bayes update at a time.',
      'The sum-to-1 guard will save you real debugging hours: unnormalized "probabilities" are among the most common silent bugs in probabilistic code.',
    ],
  },
  quiz: [
    {
      q: 'A disease affects 1 in 1000 people. A test is 99% sensitive with a 2% false-positive rate. Someone tests positive. Roughly what\'s the chance they\'re sick?',
      options: ['99%', '~66%', '~5%', '~0.1%'],
      correct: 2,
      explain: '(0.99×0.001)/(0.99×0.001 + 0.02×0.999) ≈ 0.047. Among 100k people: ~99 true positives vs ~1998 false alarms. The rarer the condition, the more a "positive" is probably noise — the base-rate fallacy.',
    },
    {
      q: 'P(A|B) = P(A) means…',
      options: [
        'A and B are mutually exclusive',
        'A and B are independent — knowing B tells you nothing about A',
        'A causes B',
        'P(B|A) = 0',
      ],
      correct: 1,
      explain: 'Conditioning on B doesn\'t move the belief: independence. (Mutually exclusive is nearly the opposite — then P(A|B) = 0.)',
    },
    {
      q: 'An LLM\'s output at each generation step is best described as…',
      options: [
        'the single most likely word',
        'a categorical probability distribution over the whole vocabulary, which we then sample from',
        'a Gaussian over embeddings',
        'a database lookup',
      ],
      correct: 1,
      explain: 'Logits → softmax → one categorical distribution over ~100k tokens. Greedy/temperature/top-p are different ways of turning that distribution into a choice — the model itself outputs the distribution.',
    },
    {
      q: 'Mini-batch gradient descent works statistically because…',
      options: [
        'small batches have less noise than the full dataset',
        'the batch-average gradient is an unbiased estimate of the full-data gradient, with variance shrinking as batch size grows',
        'each batch contains every class',
        'gradients don\'t depend on the data',
      ],
      correct: 1,
      explain: 'E[batch gradient] = true gradient (unbiased); Var ∝ 1/batch-size. You trade gradient smoothness against compute per step — the die-rolling demo in miniature.',
    },
    {
      q: 'A Gaussian PDF has height 2.3 at some point. This means…',
      options: [
        'that outcome has probability 2.3 — impossible, the code is buggy',
        'nothing is wrong: densities can exceed 1; probability is the AREA under the curve over an interval',
        'the variance is negative',
        'the distribution is not normalized',
      ],
      correct: 1,
      explain: 'PDFs are densities, not probabilities — a narrow N(0, 0.01) peaks near 4. Only integrals (areas) are probabilities. Mixing these up is a classic interview filter.',
    },
  ],
  testFlow: {
    title: 'Test yourself: probability & Bayes',
    start: 'q1',
    nodes: {
      q1: { qid: 'q1', q: 'A disease affects 1 in 1000 people. A test is 99% sensitive with a 2% false-positive rate. Someone tests positive. Roughly what\'s the chance they\'re actually sick?', choices: [
        { text: '~99%', to: 'q1_wrong_99' },
        { text: '~66%', to: 'q1_wrong_66' },
        { text: '~5%', to: 'q1_right' },
      ]},
      q1_right: { end: true, correct: true, text: 'Right — (0.99×0.001)/(0.99×0.001 + 0.02×0.999) ≈ 0.047. Among 100,000 people: ~99 true positives drown under ~1998 false alarms. The rarer the condition, the more a "positive" is probably noise.', next: 'q2' },
      q1_wrong_99: { end: true, correct: false, text: 'That confuses the test\'s SENSITIVITY (P(+|sick)=99%) with the posterior P(sick|+), which are different conditionals entirely — and the rare 1-in-1000 prior drags the real answer far below 99%.', retry: 'q1' },
      q1_wrong_66: { end: true, correct: false, text: 'Closer, but still overestimating — with only a 0.1% prior, the ~2% false-positive rate applied to the huge healthy population generates far more false alarms than true positives generate real hits.', retry: 'q1' },
      q2: { qid: 'q2', q: 'P(A|B) = P(A). What does this tell you about A and B?', choices: [
        { text: 'A and B are mutually exclusive', to: 'q2_wrong_exclusive' },
        { text: 'A and B are independent — knowing B tells you nothing about A', to: 'q2_right' },
        { text: 'A causes B', to: 'q2_wrong_causes' },
      ]},
      q2_right: { end: true, correct: true, text: 'Right — conditioning on B doesn\'t move belief about A at all. That\'s the definition of independence.', next: 'q3' },
      q2_wrong_exclusive: { end: true, correct: false, text: 'Mutually exclusive is nearly the OPPOSITE case — if A and B can\'t both happen, then P(A|B) = 0, not P(A|B) = P(A).', retry: 'q2' },
      q2_wrong_causes: { end: true, correct: false, text: 'This equation says the opposite of a causal link — B carries zero information about A. Causation would typically show up as P(A|B) being quite DIFFERENT from P(A).', retry: 'q2' },
      q3: { qid: 'q3', q: 'A Gaussian probability density function (PDF) has height 2.3 at some point. What does this mean?', choices: [
        { text: 'That outcome has probability 2.3 — impossible, the code must be buggy', to: 'q3_wrong_buggy' },
        { text: 'Nothing is wrong — densities can exceed 1; only the AREA under the curve over an interval is a probability', to: 'q3_right' },
        { text: 'The variance must be negative', to: 'q3_wrong_variance' },
      ]},
      q3_right: { end: true, correct: true, text: 'Right. A PDF is a density, not a probability — a narrow, low-variance Gaussian can peak well above 1. Only integrating (finding area) over an interval gives you an actual probability.', },
      q3_wrong_buggy: { end: true, correct: false, text: 'Nothing\'s broken — this is a common misconception. PDF HEIGHTS are not probabilities and are not bounded by 1; only areas under the curve are. A narrow, sharply-peaked Gaussian easily exceeds height 1.', retry: 'q3' },
      q3_wrong_variance: { end: true, correct: false, text: 'Variance can\'t be negative by definition (it\'s an average of squared terms) — a density height above 1 is completely normal and unrelated to the sign of the variance.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Confusing P(A|B) with P(B|A) — "most drug users started with milk, therefore milk drinkers become drug users". Inverting the conditional is precisely what Bayes\' rule exists to do correctly (it costs you a prior).',
    'Ignoring base rates when evaluating classifiers on rare classes: a fraud model with 99% precision on a balanced benchmark can be mostly false alarms at a 0.1% real-world fraud rate.',
    'Treating independence as the default. Correlated features double-count evidence: two copies of the same signal shouldn\'t double your confidence, but a naive product of likelihoods will.',
    'Reading PDF heights as probabilities, or reporting a model\'s softmax confidence as a calibrated real-world probability — modern neural nets are systematically overconfident unless explicitly calibrated.',
  ],
  interview: [
    {
      q: 'State Bayes\' theorem and give a practical ML example of it in action.',
      a: 'P(H|E) = P(E|H)P(H)/P(E): the posterior belief in a hypothesis equals how well it explains the evidence, times its prior plausibility, normalized over all hypotheses. Example — spam filtering (Naive Bayes): prior = base rate of spam; likelihoods = how often each word appears in spam vs ham; multiply per-word likelihood ratios (naively assuming independence), renormalize, and you get P(spam | words). Same structure underlies medical-test interpretation and why rare-event detectors produce mostly false positives: with a 1% base rate, even a 90%-sensitive/9%-false-positive test yields only ~9% posterior on a positive — the prior dominates. Being fluent in that computation is the practical skill.',
    },
    {
      q: 'What is expected value, and where exactly does it appear in the training of a neural network?',
      a: 'The probability-weighted average of a random quantity: E[X] = Σx·P(x). In training, the true objective is expected loss over the data distribution, E[ℓ(model(x), y)] — which we can\'t compute (we don\'t have the distribution), so we estimate it by the empirical average over a dataset, and per-step by the average over a mini-batch. The mini-batch gradient is an unbiased estimator of the full gradient with variance ∝ 1/batch-size, which is the entire statistical license for SGD. Expectation also defines evaluation (expected accuracy), regularization trade-offs (bias-variance decomposes expected error), and RL objectives (expected cumulative reward).',
    },
    {
      q: 'Your binary classifier reports 0.97 confidence. Should the business treat that as a 97% probability? Why or why not?',
      a: 'Not without checking calibration. Softmax/sigmoid outputs are trained to rank and separate classes, and modern over-parameterized networks are systematically overconfident — a bucket of "0.97" predictions might be right only 80% of the time. Measure it: reliability diagrams and expected calibration error on held-out data (bucket predictions by confidence, compare bucket accuracy to bucket confidence). Fixes: temperature scaling (fit one scalar on validation logits — simple and remarkably effective), Platt scaling/isotonic regression. Also flag distribution shift: calibration measured on yesterday\'s data doesn\'t survive a changed input distribution. If money rides on the number being a probability, calibration is a requirement, not a nicety.',
    },
    {
      q: 'Explain the difference between P(data|model) and P(model|data), and why the distinction matters.',
      a: 'P(data|model) — the likelihood — is what your model computes: how probable the observations are under specific parameter values. P(model|data) — the posterior — is what you usually want: how plausible the model/parameters are given what you observed. They\'re related by Bayes\' rule but NOT equal; converting one to the other costs you a prior and a normalization over alternatives. Practical stakes: maximum likelihood (pick θ maximizing P(data|θ)) can overfit precisely because it ignores the prior — regularization (next lesson) is mathematically equivalent to adding one (MAP estimation). And rhetorically, "the data is very likely under my hypothesis" never by itself establishes "my hypothesis is likely" — the base-rate fallacy in formal dress.',
    },
  ],
};
