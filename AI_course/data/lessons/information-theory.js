window.LESSONS = window.LESSONS || {};
window.LESSONS['information-theory'] = {
  id: 'information-theory',
  title: 'Information Theory: Entropy, Cross-Entropy, KL & Perplexity',
  category: 'Part 1 — Math Prerequisites',
  timeMin: 40,
  summary: 'The loss function that trains every classifier and every LLM is called "cross-entropy", and LLM quality is reported in "perplexity". Both come from one beautiful idea — measuring information as surprise — worked out by Claude Shannon in 1948. Forty minutes here and those words become numbers you can compute and reason about.',
  goals: [
    'Define information as −log p (surprise) and entropy as expected surprise, and compute both.',
    'Explain cross-entropy as "cost of using the wrong codebook" and why it\'s THE training loss for classification and LLMs.',
    'Define KL divergence, its key properties, and where it appears (fine-tuning penalties, VAEs, distillation).',
    'Convert between cross-entropy loss and perplexity, and interpret an LLM\'s perplexity number.',
  ],
  concept: [
    {
      h: 'Information = surprise',
      p: [
        'Shannon\'s starting question: how much <i>information</i> does an event carry? His answer: rare = informative. "The sun rose" carries nothing; "snow in the Sahara" carries a lot. The measure:',
        '<div class="math">I(x) = −log₂ P(x) &nbsp; bits<span class="mnote">P = 1 → 0 bits (no surprise); P = 1/2 → 1 bit; P = 1/1024 → 10 bits</span></div>',
        'Why log, of all functions? Because we want independent surprises to <b>add</b>: two independent events with probabilities p and q have joint probability pq, and −log(pq) = −log p − log q. The log is the unique choice that turns multiplication of probabilities into addition of information.',
        'And "bit" is not metaphor: an event with probability 1/8 carries 3 bits because identifying it takes exactly 3 optimal yes/no questions (halving the possibilities each time: 8 → 4 → 2 → 1).',
      ],
    },
    {
      h: 'Entropy: average surprise = the compression limit',
      p: [
        'The <b>entropy</b> of a distribution is its expected surprise:',
        '<div class="math">H(p) = −Σᵢ pᵢ log₂ pᵢ<span class="mnote">fair coin: 1 bit. Fair 8-sided die: 3 bits. Coin with p=0.99: 0.08 bits — almost no uncertainty</span></div>',
        'Entropy is maximized by the uniform distribution (all outcomes equally likely — maximal ignorance) and hits zero when one outcome is certain. Shannon proved it is also the <b>compression limit</b>: no code can transmit samples from p using fewer than H(p) bits each, on average, and an optimal code (short codewords for frequent symbols — think Morse\'s single-dot "E") achieves it. Entropy = irreducible average message length.',
        'In ML you\'ll meet entropy as: a measure of a model\'s uncertainty over classes; the "impurity" that decision trees minimize when choosing splits (Part 2); and a bonus term in RL that keeps policies exploratory.',
      ],
    },
    {
      h: 'Cross-entropy: the cost of believing the wrong distribution',
      p: [
        'Now the star. Suppose reality generates symbols from p, but you built your code (your beliefs) for q. Your average message length is:',
        '<div class="math">H(p, q) = −Σᵢ pᵢ log₂ qᵢ ≥ H(p)<span class="mnote">always at least the true entropy; equality only when q = p</span></div>',
        'Read it: reality (p) picks the symbols; your codebook (q) prices them. Betting short codes on things that rarely happen and long codes on things that happen constantly costs you — and the excess cost is exactly your model\'s wrongness.',
        'Classification training in this light: for one example, the true distribution is one-hot (the label, with certainty), so H(p,q) collapses to <b>−log q(true class)</b> — the loss is simply "how surprised was the model by the correct answer". Confident-and-right → loss ≈ 0. Confident-and-wrong → −log(0.001) ≈ 10: catastrophic penalty, huge gradient. This asymmetric punishment of confident errors is why cross-entropy (and not accuracy or MSE) trains classifiers. And note the MLE connection from last lesson: minimizing cross-entropy over a dataset IS maximizing Σ log q(true label) — same formula, two lineages.',
        'An LLM\'s pretraining loss (Part 6) is this per-token: −log q(actual next token | context), averaged over trillions of tokens.',
      ],
    },
    {
      h: 'KL divergence and perplexity',
      p: [
        'Subtract the irreducible part of cross-entropy and you get the pure penalty for wrong beliefs — the <b>Kullback–Leibler divergence</b>:',
        '<div class="math">KL(p ‖ q) = H(p, q) − H(p) = Σᵢ pᵢ log(pᵢ / qᵢ)<span class="mnote">≥ 0 always; = 0 iff p = q; NOT symmetric: KL(p‖q) ≠ KL(q‖p)</span></div>',
        'Where you\'ll meet it: <b>RLHF/fine-tuning</b> adds a KL penalty keeping the tuned model close to the base model (Part 6 — "don\'t drift too far from the pretrained distribution while chasing reward"); <b>knowledge distillation</b> trains a small model to match a big model\'s output distribution by minimizing KL; <b>VAEs</b> regularize latent codes toward a Gaussian with a KL term; and the asymmetry (mode-seeking vs mean-covering) is a legitimately deep interview topic.',
        '<b>Perplexity</b> is cross-entropy made human-readable — the exponential of the per-token cross-entropy:',
        '<div class="math">PPL = 2^{H(p,q)} &nbsp; (or e^{loss} with natural-log losses)<span class="mnote">interpretation: the model is as uncertain as if choosing uniformly among PPL options</span></div>',
        'A perplexity of 8 means the model\'s average next-token uncertainty equals a fair 8-way choice. GPT-2 scored ~29 on WikiText-103; modern LLMs are under 5 on similar text. When a paper says "our model reaches 3.2 perplexity", you can now decode it: average per-token cross-entropy of log₂(3.2) ≈ 1.7 bits — the model finds real text only slightly surprising.',
      ],
    },
  ],
  story: {
    onePiece: {
      title: 'The signal flags of the Thousand Sunny: Nami\'s optimal codebook',
      text: [
        'Long voyages need ship-to-ship signals, and waving flags is slow — so Nami designs a codebook. Messages aren\'t equally common: "all clear" happens hourly; "island sighted" daily; "Sea King attack" rarely; "Luffy fell overboard again"… okay, that one\'s also hourly. Her design rule: <b>the commoner the message, the shorter its flag sequence</b>. "All clear" = one white flag. "Sea King" = a rare five-flag sequence. Average flags-per-message drops to the theoretical floor — the entropy of the message distribution. If every message were equally likely (maximum ignorance about what comes next), no clever code would help: that\'s the uniform distribution maximizing entropy.',
        'Then disaster: crossing into Buggy\'s territory, the crew captures <i>Buggy\'s</i> codebook and lazily uses it. Buggy\'s seas are full of circus emergencies, so his shortest flags mean "juggling accident" — and "all clear", which the Straw Hats need constantly, takes seven flags. Every message now costs extra waving. The average cost of using Buggy\'s codebook on Straw-Hat seas is the <b>cross-entropy</b> H(straw-hat reality, Buggy\'s beliefs); the extra waving compared to Nami\'s perfect code is the <b>KL divergence</b> — the pure price of wrong beliefs about what\'s likely.',
        'Training a language model is Nami\'s job at scale: the model\'s predicted distribution is a codebook for real text, and cross-entropy loss literally measures the average code length it assigns to what humans actually wrote. Every gradient step is a codebook revision: shorten the flags for things that actually happen.',
      ],
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Rock-Paper-Scissors-Lizard-Spock, and the three knocks',
      text: [
        'Why does Sheldon prefer Rock-Paper-Scissors-<i>Lizard-Spock</i>? His stated reason is an entropy argument: among friends, regular RPS gets predictable — "anecdotal evidence suggests players familiar with each other tie 75–80% of the time" because everyone throws what they threw before. Predictable = low entropy = little information per round = boring, exploitable games. Adding lizard and Spock pushes the choice distribution back toward uniform over five options: log₂5 ≈ 2.3 bits of genuine surprise per throw. Sheldon literally re-engineered a game to raise its entropy.',
        'Meanwhile his knock — "knock knock knock, Penny; knock knock knock, Penny; knock knock knock, Penny" — is the opposite: probability ≈ 1, zero bits, no information. Which is precisely why it works as a signature: total predictability. High-entropy sources surprise you; zero-entropy sources identify themselves.',
      ],
    },
    why: 'Nami\'s codebook chains all four concepts into one story — entropy (her optimal flag lengths), cross-entropy (waving Buggy\'s flags on her seas), KL (the extra waving) — and makes "training an LLM = revising the codebook toward reality" concrete. Sheldon supplies the poles: RPSLS = high entropy, the triple knock = zero.',
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'm1', emoji: '🏳️', label: '"all clear" (common)', x: 18, y: 24 },
      { id: 'm2', emoji: '🏴', label: '"island!" (weekly)', x: 18, y: 50 },
      { id: 'm3', emoji: '🐉', label: '"Sea King!" (rare)', x: 18, y: 76 },
      { id: 'cost', emoji: '🧮', label: 'avg flags: ?', x: 82, y: 24 },
      { id: 'book', emoji: '📕', label: 'codebook', x: 82, y: 62 },
    ],
    actors: [
      { id: 'nami', emoji: '🍊', label: 'Nami', x: 50, y: 40 },
      { id: 'buggy', emoji: '🤡', label: 'Buggy', x: 50, y: 84 },
    ],
    steps: [
      { c: 'Three messages, very different frequencies. Design a flag code: what\'s the cheapest average signaling cost?', l: { book: 'codebook: ?' } },
      { c: 'Nami\'s rule: common → short. "All clear" = 1 flag, "island" = 3, "Sea King" = 5. Short codes where probability is high.', p: { m1: 'good', m2: 'lit', m3: 'lit' }, l: { book: 'Nami\'s code', cost: 'avg = H(p) ✓' } },
      { c: 'That average IS the entropy of the message distribution — Shannon proved nobody can beat it. The floor of communication.', p: { cost: 'good' } },
      { c: 'Now the crew borrows BUGGY\'s codebook — optimized for circus emergencies. "All clear" costs 7 flags in his book!', a: { buggy: [66, 62] }, p: { book: 'bad', m1: 'bad' }, l: { book: 'Buggy\'s code', cost: 'avg = H(p,q) ↑' } },
      { c: 'Extra waving = wrong beliefs about what\'s common. H(p,q) − H(p) = KL(p‖q): the pure price of believing the wrong world.', l: { cost: 'overhead = KL' }, p: { cost: 'bad' } },
      { c: 'An LLM in training is Nami revising the codebook: every gradient step shortens the code for what text actually does. Perplexity = "my code is as good as a fair PPL-sided die." 🏴‍☠️', p: { book: 'good', cost: 'good', m1: 'good' }, l: { book: 'model q → p' } },
    ],
  },
  conceptFlow: {
    title: 'Codebooks, quantified',
    intro: 'Same three distributions as the code section.',
    stages: [
      { label: 'Reality', nodes: [
        { id: 'truth', text: 'True frequencies\np = [0.7, 0.2, 0.1]' },
      ]},
      { label: "Nami's code", nodes: [
        { id: 'nami', text: 'q = p\nmatches reality' },
        { id: 'H', text: 'H(p) = 1.157 bits\nthe theoretical floor' },
      ]},
      { label: "Buggy's code", nodes: [
        { id: 'buggy', text: 'q = [0.1, 0.2, 0.7]\nmismatched' },
        { id: 'Hpq', text: 'H(p,q) = 2.522 bits\ncross-entropy' },
      ]},
      { label: 'The overhead', nodes: [
        { id: 'kl', text: 'KL = H(p,q) − H(p)\n= 1.365 bits' },
      ]},
    ],
    steps: [
      { active: ['truth'], note: 'Reality: Straw Hat messages actually occur with frequencies p = [0.7, 0.2, 0.1].' },
      { active: ['nami', 'H'], note: 'Nami\'s codebook matches reality exactly: average cost = H(p) = 1.157 bits — the theoretical floor no code can beat.' },
      { active: ['buggy', 'Hpq'], note: 'Now use Buggy\'s mismatched codebook instead: average cost rises to H(p,q) = 2.522 bits — the cross-entropy.' },
      { active: ['kl'], note: 'The extra waving is pure KL divergence: H(p,q) − H(p) = 1.365 bits — the exact, quantified price of believing the wrong world.' },
    ],
  },
  tech: [
    {
      q: 'Why is cross-entropy preferred over MSE for classification — mathematically, not just "it works better"?',
      a: 'Two rigorous reasons. (1) Gradient quality: with a sigmoid/softmax output, MSE\'s gradient contains a factor of the sigmoid\'s slope, which is ≈ 0 when the model is confidently wrong (saturated) — the worse the error, the weaker the learning signal, a perverse combination. Cross-entropy\'s gradient through softmax is (q − p): predicted probability minus truth — large exactly when the model is wrong, no saturation, and astonishingly clean to compute (you\'ll derive this in Part 3). (2) It\'s the MLE objective for categorical outputs, so minimizing it estimates calibrated probabilities, while MSE on probabilities corresponds to a Gaussian noise assumption that\'s simply false for labels in {0,1}.',
    },
    {
      q: 'Bits vs nats — why does PyTorch\'s cross-entropy use natural log, and does the base matter?',
      a: 'Base 2 gives bits (Shannon\'s unit, nice for humans); base e gives "nats" (nice for calculus — d/dx ln x = 1/x with no constant). They differ by a fixed factor: 1 nat = 1/ln2 ≈ 1.443 bits, so the choice changes nothing about optimization (argmin is identical), only the units of the reported number. Convention: <code>torch.nn.CrossEntropyLoss</code> and LLM losses are in nats, so <b>perplexity = e^loss</b>; information-theory texts use bits, where perplexity = 2^H. A loss of 1.5 nats ⇒ PPL = e^1.5 ≈ 4.48. Knowing this conversion cold makes you the person in the room who can read a loss curve as a perplexity.',
    },
    {
      q: 'What does nn.CrossEntropyLoss actually compute, and why must I NOT put a softmax before it?',
      a: 'It fuses three steps: log_softmax on the raw logits, then negative log-likelihood of the true class, averaged over the batch: loss = −mean(log softmax(z)[true]). It takes LOGITS as input by design — computing log(softmax(z)) directly as two steps is numerically dangerous (softmax can underflow to 0, log(0) = −inf), while the fused log-sum-exp formulation is stable. If you apply your own softmax first, you get a double-softmax: still trains (probabilities are valid logits), but gradients shrink, temperatures warp, and your model quietly underperforms — one of the most common real-world PyTorch bugs. Same story for <code>BCEWithLogitsLoss</code> vs sigmoid+BCELoss.',
    },
    {
      q: 'Which way does KL\'s asymmetry cut — what\'s the practical difference between KL(p‖q) and KL(q‖p)?',
      a: 'KL(p‖q) = Σ p log(p/q) explodes when q ≈ 0 where p > 0 — so minimizing it forces q to COVER everything p does ("mean-covering": q spreads over all of p\'s modes, possibly blurrily). KL(q‖p) explodes where q > 0 but p ≈ 0 — minimizing it forbids q from claiming mass where p has none, so q picks one mode and commits ("mode-seeking": sharp but incomplete). Practical sightings: maximum likelihood training minimizes (forward) KL(data‖model) — models must cover the data; variational inference and RLHF penalties use reverse KL — stay sharp, don\'t wander into regions the reference forbids. If an interviewer asks one deep information-theory question, it\'s this one.',
    },
  ],
  code: {
    title: 'Worked example — entropy to perplexity, end to end',
    intro: 'Every formula from the lesson, computed on small distributions you can check mentally — ending with the loss↔perplexity conversion you\'ll use on real LLMs.',
    code: `import numpy as np

def entropy(p, base=2):
    p = np.asarray(p, dtype=float)
    p = p[p > 0]                       # 0·log0 = 0 by convention
    return -(p * np.log(p)).sum() / np.log(base)

print(entropy([0.5, 0.5]))            # 1.0 bit  — fair coin
print(entropy([0.125]*8))             # 3.0 bits — fair 8-sided die
print(entropy([0.99, 0.01]))          # 0.081    — near-certainty ≈ no info
print(entropy([1.0]))                 # 0.0      — Sheldon's knock

def cross_entropy(p, q, base=2):
    p, q = np.asarray(p, float), np.asarray(q, float)
    mask = p > 0
    return -(p[mask] * np.log(q[mask])).sum() / np.log(base)

truth = [0.7, 0.2, 0.1]               # Straw-Hat message frequencies
nami  = [0.7, 0.2, 0.1]               # codebook matching reality
buggy = [0.1, 0.2, 0.7]               # codebook for circus seas
print(cross_entropy(truth, nami))     # 1.157 = H(p): optimal
print(cross_entropy(truth, buggy))    # 2.522 : Buggy tax
print(cross_entropy(truth, buggy) - entropy(truth))   # 1.365 = KL(p||q)

# --- LLM loss <-> perplexity (natural-log convention) ---
loss_nats = 1.5                        # a typical modern pretraining loss
print(np.exp(loss_nats))               # PPL ≈ 4.48: "fair 4.5-sided die per token"

# one confidently-wrong prediction vs a hedged one (why CE punishes hubris):
print(-np.log(0.001))                  # 6.9  — "certain" and wrong
print(-np.log(0.25))                   # 1.39 — humble and wrong`,
    notes: [
      'The <code>p > 0</code> mask implements the 0·log 0 = 0 convention (justified by the limit x·log x → 0) — and dodges the NaN that sinks naive implementations.',
      'Note cross_entropy(truth, nami) exactly equals entropy(truth): matching codebook, zero KL. Any mismatch only ever adds cost — Gibbs\' inequality.',
      'The last two lines are the practical soul of cross-entropy: being wrong at 99.9% confidence costs 5× more than being wrong at 25%. Models learn epistemic humility because hubris is expensive.',
    ],
  },
  lab: {
    title: 'Lab: implement Shannon\'s toolkit',
    prompt: 'Implement <code>entropy(p)</code>, <code>cross_entropy(p, q)</code>, <code>kl_divergence(p, q)</code> (all in bits, base 2, pure Python + <code>math</code>), and <code>perplexity_from_loss(loss_nats)</code> (which uses base e — mind the switch!). Handle pᵢ = 0 terms as contributing 0. The tests check the coin, the die, Nami-vs-Buggy, KL ≥ 0, and a real loss→perplexity conversion.',
    starter: `import math

def entropy(p):
    # -sum p_i * log2(p_i), skipping p_i == 0
    pass

def cross_entropy(p, q):
    # -sum p_i * log2(q_i), skipping p_i == 0
    pass

def kl_divergence(p, q):
    # H(p, q) - H(p)   (reuse your functions!)
    pass

def perplexity_from_loss(loss_nats):
    # e ** loss  (LLM losses are natural-log)
    pass
`,
    checks: [
      { re: 'def\\s+entropy', must: true, hint: 'Define entropy(p).' },
      { re: 'def\\s+cross_entropy', must: true, hint: 'Define cross_entropy(p, q).' },
      { re: 'def\\s+kl_divergence', must: true, hint: 'Define kl_divergence(p, q).' },
      { re: 'log2|log\\s*\\(.+,\\s*2\\s*\\)', must: true, hint: 'Entropy/cross-entropy here are in bits: use math.log2 (or math.log(x, 2)).' },
      { re: 'math\\.exp|math\\.e\\s*\\*\\*', must: true, hint: 'perplexity_from_loss uses base e: math.exp(loss).' },
    ],
    tests: `assert abs(entropy([0.5, 0.5]) - 1.0) < 1e-9, "fair coin = 1 bit"
assert abs(entropy([0.125]*8) - 3.0) < 1e-9, "fair 8-die = 3 bits"
assert entropy([1.0]) == 0, "certainty = 0 bits (Sheldon's knock)"
truth, buggy = [0.7, 0.2, 0.1], [0.1, 0.2, 0.7]
assert abs(cross_entropy(truth, truth) - entropy(truth)) < 1e-9, "matching codebook: H(p,p) = H(p)"
assert cross_entropy(truth, buggy) > entropy(truth), "wrong codebook always costs more (Gibbs)"
kl = kl_divergence(truth, buggy)
assert abs(kl - (cross_entropy(truth, buggy) - entropy(truth))) < 1e-9
assert kl > 0, "KL must be positive for p != q"
assert abs(kl_divergence(truth, truth)) < 1e-9, "KL(p||p) = 0"
assert abs(perplexity_from_loss(1.5) - 4.4817) < 0.001, "loss 1.5 nats -> PPL ~4.48"
assert abs(perplexity_from_loss(0.0) - 1.0) < 1e-9, "loss 0 -> PPL 1: a psychic model"
print("Codebook mastered. You can now read any LLM paper's loss table.")`,
    solution: `import math

def entropy(p):
    return -sum(pi * math.log2(pi) for pi in p if pi > 0)

def cross_entropy(p, q):
    return -sum(pi * math.log2(qi) for pi, qi in zip(p, q) if pi > 0)

def kl_divergence(p, q):
    return cross_entropy(p, q) - entropy(p)

def perplexity_from_loss(loss_nats):
    return math.exp(loss_nats)`,
    notes: [
      'PPL = 1 means loss = 0: the model assigns probability 1 to every actual next token — only possible if the text is fully deterministic (or memorized: near-1 perplexity on training data is a memorization red flag).',
      'Real text has intrinsic entropy (Shannon estimated ~1 bit/character for English) — a floor no model can beat. Loss curves flatten because they approach the entropy of language itself.',
    ],
  },
  quiz: [
    {
      q: 'Which distribution over 4 outcomes has the highest entropy?',
      options: ['[0.97, 0.01, 0.01, 0.01]', '[0.4, 0.3, 0.2, 0.1]', '[0.25, 0.25, 0.25, 0.25]', '[1, 0, 0, 0]'],
      correct: 2,
      explain: 'Uniform = maximal uncertainty = maximal entropy (here 2 bits). Certainty ([1,0,0,0]) = 0 bits. Entropy orders distributions by how unpredictable they are.',
    },
    {
      q: 'A classifier assigns the true class probability 0.01. Its cross-entropy loss on that example (nats) is…',
      options: ['0.01', '−log(0.01) ≈ 4.6', '0.99', '1 − 0.01'],
      correct: 1,
      explain: 'With a one-hot target, cross-entropy collapses to −log q(true class). The −log is why confident mistakes dominate the gradient — one such example outweighs dozens of mild ones.',
    },
    {
      q: 'An LLM reports validation loss 2.0 (natural log). Its perplexity is…',
      options: ['2', '4', 'e² ≈ 7.39', '2² = 4 bits'],
      correct: 2,
      explain: 'PPL = e^loss for nat-based losses. The model\'s per-token uncertainty ≈ a fair 7.4-way choice. (2^loss only if the loss were in bits.)',
    },
    {
      q: 'KL(p‖q) = 0 exactly when…',
      options: ['p and q are independent', 'q is uniform', 'p = q everywhere', 'H(p) = H(q)'],
      correct: 2,
      explain: 'KL is the extra cost of the wrong codebook — zero only when beliefs match reality exactly. Equal entropies are NOT enough: two different distributions can have identical entropy yet positive KL.',
    },
    {
      q: 'In RLHF, a KL penalty against the base model is added to the reward. Its role is…',
      options: [
        'to speed up training',
        'to keep the tuned policy\'s distribution close to the pretrained model, preventing reward-hacking gibberish',
        'to increase output diversity',
        'to compress the model',
      ],
      correct: 1,
      explain: 'Pure reward maximization finds degenerate high-reward outputs (repetition, sycophancy, gibberish the reward model mis-scores). The KL leash constrains exploration to stay near the sane distribution learned in pretraining. Full story in Part 6.',
    },
  ],
  testFlow: {
    title: 'Test yourself: entropy & cross-entropy',
    start: 'q1',
    nodes: {
      q1: { qid: 'q1', q: 'Which distribution over 4 outcomes has the HIGHEST entropy?', choices: [
        { text: '[0.97, 0.01, 0.01, 0.01]', to: 'q1_wrong_peaked' },
        { text: '[0.25, 0.25, 0.25, 0.25]', to: 'q1_right' },
        { text: '[1, 0, 0, 0]', to: 'q1_wrong_certain' },
      ]},
      q1_right: { end: true, correct: true, text: 'Right — uniform means maximal uncertainty, hence maximal entropy (2 bits here). Any concentration toward one outcome reduces average surprise.', next: 'q2' },
      q1_wrong_peaked: { end: true, correct: false, text: 'This distribution is heavily concentrated on one outcome — very LOW average surprise, hence low entropy, not high. Entropy is maximized by spreading probability out evenly.', retry: 'q1' },
      q1_wrong_certain: { end: true, correct: false, text: 'This is total certainty — one outcome has probability 1. That\'s the MINIMUM possible entropy (exactly 0 bits), the opposite of what the question asks.', retry: 'q1' },
      q2: { qid: 'q2', q: 'A classifier assigns the TRUE class a probability of 0.01. Its cross-entropy loss on that example, in nats, is...', choices: [
        { text: '0.01', to: 'q2_wrong_direct' },
        { text: '−log(0.01) ≈ 4.6', to: 'q2_right' },
        { text: '0.99', to: 'q2_wrong_complement' },
      ]},
      q2_right: { end: true, correct: true, text: 'Right — with a one-hot target, cross-entropy collapses to −log q(true class). The −log is exactly why confident mistakes dominate training: one such example outweighs dozens of mild ones.', next: 'q3' },
      q2_wrong_direct: { end: true, correct: false, text: 'Cross-entropy is −log(probability), not the raw probability itself. −log(0.01) ≈ 4.6, a much larger (and correctly punishing) number.', retry: 'q2' },
      q2_wrong_complement: { end: true, correct: false, text: 'That\'s just 1 minus the probability — not how cross-entropy is defined. The formula is −log q(true class) = −log(0.01) ≈ 4.6.', retry: 'q2' },
      q3: { qid: 'q3', q: 'KL(p‖q) = 0 exactly when...', choices: [
        { text: 'p and q are independent', to: 'q3_wrong_independent' },
        { text: 'p = q everywhere', to: 'q3_right' },
        { text: 'H(p) = H(q), even if p and q differ', to: 'q3_wrong_entropy' },
      ]},
      q3_right: { end: true, correct: true, text: 'Right — KL is the extra cost of a mismatched codebook; it hits exactly zero only when beliefs match reality perfectly, everywhere.', },
      q3_wrong_independent: { end: true, correct: false, text: 'Independence is a completely different concept (about joint vs. marginal probabilities of two variables) and doesn\'t apply here — KL compares two distributions over the SAME variable, and is zero only when they\'re identical.', retry: 'q3' },
      q3_wrong_entropy: { end: true, correct: false, text: 'Two distinct distributions can absolutely share the same entropy value while still differing from each other everywhere — that alone does not make KL(p‖q) zero. Only p = q exactly gives KL = 0.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Applying softmax before <code>nn.CrossEntropyLoss</code> — it expects raw logits and applies log-softmax internally. The double-softmax bug trains, underperforms, and hides for weeks.',
    'Comparing perplexities across different tokenizers: PPL is per-token, so a model with a coarser tokenizer gets fewer, harder tokens — the numbers aren\'t comparable. (Bits-per-byte is the tokenizer-neutral metric.)',
    'Computing log(0) = −inf from a zero probability: mask zero-p terms (0·log0 = 0), clamp q with a small epsilon, and prefer fused log-space ops (log_softmax) over log(softmax(·)).',
    'Treating KL like a distance: it\'s asymmetric and violates the triangle inequality. If you need a true metric, that\'s Jensen-Shannon divergence\'s square root, not KL.',
  ],
  interview: [
    {
      q: 'What is cross-entropy loss and why is it the standard for classification and language modeling?',
      a: 'Cross-entropy H(p,q) = −Σ p log q measures the average surprise of a model believing q when reality follows p — equivalently, the average message length of using q\'s codebook on p\'s data. With one-hot labels it reduces to −log q(true class). It\'s standard because (1) minimizing it is exactly maximum likelihood for categorical outputs, so it estimates calibrated probabilities; (2) its gradient through softmax is the beautifully clean (predicted − true), giving strong signal precisely when the model is confidently wrong, with no saturation; (3) it decomposes as H(p) + KL(p‖q), so training explicitly drives the model distribution toward the data distribution. Language models use it per token: loss = −mean log P(actual next token | context), and e^loss is the reported perplexity.',
    },
    {
      q: 'Define perplexity and interpret it. What are its limitations as an LLM metric?',
      a: 'Perplexity is the exponentiated average per-token cross-entropy: PPL = e^loss (nats) or 2^H (bits). Interpretation: the model\'s average uncertainty equals a uniform choice among PPL options — PPL 4 ≈ a fair 4-sided die per token. Limitations: (1) tokenizer-dependent — not comparable across different vocabularies (use bits-per-byte to compare); (2) it measures fit to a text distribution, not usefulness — instruction-following, factuality and reasoning quality correlate imperfectly with PPL, which is why modern evals use task benchmarks and human/AI preference judgments; (3) dataset-relative — PPL 3 on code and PPL 3 on chat transcripts mean different things; (4) near-1 PPL on training-like data signals memorization, not brilliance.',
    },
    {
      q: 'What is KL divergence, and give two concrete uses in modern ML systems.',
      a: 'KL(p‖q) = Σ p log(p/q): the expected extra bits (or nats) paid for modeling p with q — always ≥ 0, zero iff equal, asymmetric. Uses: (1) RLHF/DPO fine-tuning constrains the policy with a KL term against the frozen reference model, so reward optimization can\'t drag the model into degenerate high-reward text — the coefficient trades alignment gain against capability drift; (2) knowledge distillation minimizes KL between a small student\'s and a large teacher\'s output distributions, transferring "dark knowledge" in the soft probabilities that hard labels destroy. (Also: VAE regularization, mode-seeking vs mean-covering behavior from the asymmetry, and detecting distribution drift in production.)',
    },
    {
      q: 'Why does entropy appear in decision tree training?',
      a: 'A tree split is good if it makes the class distribution in each child purer — less uncertain. Entropy quantifies that uncertainty, and "information gain" = parent entropy − weighted child entropy = how many bits the split\'s question reveals about the label. Choosing max-gain splits is playing optimal twenty-questions against the data. (Gini impurity is a cheaper cousin — same idea, slightly different curvature, nearly identical trees in practice; knowing both names and that the difference rarely matters is the interview-complete answer.)',
    },
  ],
};
