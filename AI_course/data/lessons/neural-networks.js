window.LESSONS = window.LESSONS || {};
window.LESSONS['neural-networks'] = {
  id: 'neural-networks',
  title: 'Neural Networks: From Perceptron to MLP',
  category: 'Part 3 — Deep Learning',
  timeMin: 55,
  summary: 'A neuron is just logistic regression. The magic starts when you stack them: hidden layers learn their own features, nonlinear activations make stacking meaningful, and suddenly problems no straight line could solve (XOR!) become easy. This lesson builds the multi-layer perceptron from parts you already own.',
  goals: [
    'Explain a single neuron as "dot product + bias + nonlinearity" and connect it to logistic regression',
    'Show with the XOR example why one linear layer cannot solve everything — and how two neurons fix it',
    'Explain why stacking layers WITHOUT nonlinearities collapses into one linear layer (the interview classic)',
    'Compare sigmoid, tanh, and ReLU, and say why ReLU won',
    'Count the parameters of an MLP and choose the right output layer + loss for a given task'
  ],
  concept: [
    {
      h: 'You already know what a neuron is',
      p: [
        'Take logistic regression from Part 2: score = w·x + b, then squash with a sigmoid. That whole thing — weighted sum, bias, squash — is one artificial neuron. The weights say how much each input matters, the bias shifts the threshold, and the nonlinearity (called the <em>activation function</em>) turns the score into the neuron\'s output, its "firing strength".',
        '<div class="math">neuron(x) = σ(w·x + b)<span class="mnote">one neuron = logistic regression. A "layer" is just many neurons reading the same input in parallel: h = σ(Wx + b), one row of W per neuron.</span></div>',
        'A <b>layer</b> of n neurons is n of these running in parallel on the same input — which is exactly one matrix-vector multiply Wx + b followed by an elementwise activation. This is why Part 1\'s matrix lesson matters: the entire forward pass of a neural network is a chain of matrix multiplies with squashes in between. GPUs exist in this story because they multiply matrices absurdly fast.'
      ]
    },
    {
      h: 'The wall: one neuron can only draw a straight line',
      p: [
        'A single neuron says "positive if w·x + b > 0" — a line in 2D, a plane in 3D, a hyperplane in general. It can only separate classes that a flat boundary CAN separate. Enter the most famous counterexample in the field: XOR. Output 1 when exactly one input is 1: (0,1)→1, (1,0)→1, but (0,0)→0 and (1,1)→0. Plot the four points: the two 1s sit on one diagonal, the two 0s on the other. No straight line puts the 1s on one side and the 0s on the other. Try it — you can\'t.',
        'This tiny observation (Minsky &amp; Papert, 1969) froze neural-network research for a decade, the first "AI winter". The thaw came from an idea that sounds almost too simple: if one line isn\'t enough, let some neurons draw lines and let another neuron combine their verdicts.'
      ]
    },
    {
      h: 'Hidden layers: XOR in two neurons',
      p: [
        'Solve XOR with a committee. Neuron A detects "at least one input is on" (OR): a = ReLU(x₁ + x₂). Neuron B detects "both inputs are on" (AND-ish): b = ReLU(x₁ + x₂ − 1). The output neuron combines: y = a − 2b.',
        '<div class="math">(0,0): a=0, b=0 → y=0&nbsp;&nbsp;&nbsp;(1,0): a=1, b=0 → y=1&nbsp;&nbsp;&nbsp;(0,1): a=1, b=0 → y=1&nbsp;&nbsp;&nbsp;(1,1): a=2, b=1 → y=0<span class="mnote">y = a − 2b computes "on, but not both" — XOR, from two straight lines plus a combiner.</span></div>',
        'The neurons A and B form a <b>hidden layer</b>: they compute intermediate features ("any input on", "both on") that make the final decision linearly easy. That is the entire philosophy of deep learning in one sentence: <em>instead of you hand-crafting features (Part 2: TF-IDF, polynomial terms), the hidden layers learn features from data, and each layer builds richer features from the previous layer\'s</em>. In an image network, layer 1 learns edge detectors, layer 2 combines edges into textures and corners, layer 3 into eyes and wheels. Nobody programs that hierarchy — gradient descent finds it.'
      ]
    },
    {
      h: 'Why the nonlinearity is not optional',
      p: [
        'Remove the activations and stack ten layers: y = W₁₀(W₉(…(W₁x))). Matrix products collapse: that entire tower equals a single matrix W = W₁₀W₉…W₁, i.e. ONE linear layer. Depth without nonlinearity buys you exactly nothing — the network can still only draw a straight line. This is a top-five interview question ("what happens if I remove all activation functions?") and now you know: the composition of linear maps is linear (Part 1, matrices as transformations).',
        'The activation breaks linearity between layers so each layer can genuinely reshape the space — folding it, so that points no line could separate become separable. Nonlinearity is what makes depth mean something.'
      ]
    },
    {
      h: 'Choosing the activation: why ReLU won',
      p: [
        '<b>Sigmoid</b> σ(z) = 1/(1+e⁻ᶻ): outputs (0,1), historically loved because it looks like a smooth on/off. Fatal flaw for hidden layers: for |z| > 4 it is nearly flat, so its derivative ≈ 0 — and (spoiler for next lesson) gradients flow backwards by multiplying these derivatives, so deep sigmoid networks learn glacially. σ\'(z) peaks at just 0.25, so ten layers multiply the signal down by ≤ 0.25¹⁰ ≈ 10⁻⁶. This is the <em>vanishing gradient problem</em>.',
        '<b>tanh</b>: sigmoid\'s zero-centered cousin, outputs (−1,1). Better (zero-centered outputs help optimization) but still saturates at both ends.',
        '<b>ReLU</b> max(0, z): outputs z if positive, else 0. Derivative is exactly 1 for z > 0 — the gradient passes through undiminished, no matter how deep the network. It is also nearly free to compute (one comparison; no exponentials). Weakness: a neuron stuck with z < 0 for all inputs has zero gradient forever — a "dead ReLU" — which variants like LeakyReLU (small slope for z < 0) and GELU (the smooth version transformers use) patch. Default answer in interviews and in code: <b>ReLU for hidden layers</b>, its variants when you have a reason.',
        'Note where sigmoid survives: the <em>output</em> layer of a binary classifier, where you genuinely want a probability in (0,1). The vanishing problem is about hidden layers stacked deep, not about one final squash.'
      ]
    },
    {
      h: 'Universal approximation — and why we still go deep',
      p: [
        'The universal approximation theorem: a network with ONE hidden layer (enough neurons, any squashing nonlinearity) can approximate any continuous function on a bounded region to any precision. Sounds like "one hidden layer is all you need" — but read the fine print: "enough neurons" can be astronomically many, the theorem says nothing about whether gradient descent can FIND those weights, and nothing about generalizing beyond the training data.',
        'In practice depth beats width: functions with compositional structure (edges→textures→parts→objects; characters→words→phrases→meaning) are represented exponentially more efficiently by deep networks, because layers reuse sub-features the way code reuses functions. A wide-shallow network would have to memorize every combination separately; a deep one composes. That is the honest answer to "why deep learning?": the world is compositional, and depth matches that structure.'
      ]
    },
    {
      h: 'The output layer is chosen by the task',
      p: [
        'Hidden layers are generic; the LAST layer and the loss are dictated by what you predict. Regression (a price): one linear output neuron, no activation, MSE loss. Binary classification (spam?): one sigmoid neuron, binary cross-entropy. Multi-class (which of 10 digits): K neurons through <b>softmax</b> — softmax(z)ᵢ = e^zᵢ / Σⱼe^zⱼ, which turns K raw scores ("logits") into a probability distribution — trained with cross-entropy (Part 1\'s information theory, now the working loss of all of deep learning).',
        '<div class="math">softmax(z)ᵢ = e^{zᵢ} / Σⱼ e^{zⱼ}<span class="mnote">exponentiate (make positive, amplify gaps), normalize (sum to 1). Cross-entropy then charges −log(probability given to the true class) — confident wrong answers cost the most.</span></div>',
        'Keep this table in your head; it reappears verbatim when we train GPT: a language model is "multi-class classification over the vocabulary, softmax + cross-entropy, at every position".'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Usopp\'s one-line lookout rule meets the Grand Line',
      text: 'In East Blue, Usopp runs the crow\'s nest with a single scoring rule: 3×(cannon count) + 2×(black flag) + 1×(approach speed), and if the total clears his threshold, he fires the alarm. One weighted sum, one threshold — Usopp is a perceptron, and in East Blue it works, because dangerous ships there simply look dangerous. Then the crew enters the Grand Line and the rule dies in a week. A Marine warship bristles with cannons and flies government colors — armed AND official, dangerous to pirates. A "merchant" ship with no visible weapons and a friendly flag turns out to be bounty hunters in disguise — unarmed-looking AND friendly, also dangerous. But an armed ship flying an ally pirate flag (Law\'s submarine) is safe, and a genuinely unarmed merchant is safe. Danger is now "armed XOR friendly-looking" — the threats sit on both diagonal corners, and NO single weighted sum of Usopp\'s signals can separate them; raise the threshold and he misses the disguised hunters, lower it and he alarms on Law. The fix is not a better threshold — it is a committee. Zoro watches for one pattern: "armed and flying hostile colors" (the warship feature). Sanji watches for the opposite: "harmless-looking but wrong — too many crew below deck, riding too low in the water" (the wolf-in-sheep\'s-clothing feature). Each of them is still just a simple threshold — a straight line. But Luffy on the deck combines their two shouts with a trivial rule: if EITHER lookout fires, sound the alarm. Two simple detectors plus one combiner solves what no single detector could: Zoro and Sanji are a hidden layer, their learned patterns are hidden features, and Luffy is the output neuron. And notice nobody told Zoro exactly what to look for — after enough ambushes (training data), he tuned his own instincts (weights).'
    },
    sitcom: {
      show: 'Friends',
      title: 'Chandler\'s job is a hidden layer',
      text: 'Nobody on Friends knows what Chandler does. Rachel, under pressure in the trivia game, blurts "transponster!" — which is not a word. Yet the system demonstrably works: numbers go in Monday (input layer), reports come out Friday (output layer), the company profits. What happens in between — "statistical analysis and data reconfiguration" — is real, useful, and un-nameable by outsiders. That is precisely a hidden layer: when you train an MLP, the intermediate neurons learn features that make the output easy, but nobody assigned them names, and if you inspect neuron 7 of layer 2 you\'ll usually find something Rachel-level un-nameable. Interpretability research is the whole subfield trying to figure out what Chandler actually does. The lesson: judge hidden layers by whether the output works, not by whether you can label each unit.'
    },
    why: 'XOR is THE story of this lesson: Usopp\'s single threshold failing on "armed XOR friendly" is the exact reason perceptrons stalled in 1969, and Zoro + Sanji + Luffy is the exact 2-hidden-neuron construction that solves it (you\'ll code it in the lab). When an interviewer asks "why hidden layers?" or "why nonlinearity?", picture the committee: simple detectors, combined, beat any single line.'
    },
  storyAnim: {
    title: 'Two lookouts solve what one cannot',
    h: 250,
    props: [
      { id: 'nest', emoji: '🔭', label: 'crow\'s nest: w·x > t ?', x: 50, y: 12 },
      { id: 'warship', emoji: '⚓', label: 'armed + hostile ⚠', x: 10, y: 42 },
      { id: 'disguise', emoji: '⛵', label: 'harmless-looking trap ⚠', x: 90, y: 42 },
      { id: 'ally', emoji: '🚢', label: 'armed ally ✓', x: 10, y: 72 },
      { id: 'merchant', emoji: '🛶', label: 'true merchant ✓', x: 90, y: 72 },
      { id: 'verdict', emoji: '🔔', label: 'alarm rule', x: 50, y: 88 }
    ],
    actors: [
      { id: 'usopp', emoji: '🎯', label: 'Usopp', x: 50, y: 28 },
      { id: 'zoro', emoji: '⚔️', label: 'Zoro (feature A)', x: 28, y: 55 },
      { id: 'sanji', emoji: '🦵', label: 'Sanji (feature B)', x: 72, y: 55 },
      { id: 'luffy', emoji: '👒', label: 'Luffy (output)', x: 50, y: 70 }
    ],
    steps: [
      { c: 'East Blue: Usopp alone scores every ship with one weighted sum — cannons, flag, speed — and one threshold. A perceptron. It works… there.', p: { nest: 'lit' } },
      { c: 'Grand Line: threats sit on BOTH diagonals — the armed warship AND the harmless-looking trap. Safe ships sit on the other two corners. Danger = armed XOR friendly.', p: { warship: 'bad', disguise: 'bad', ally: 'good', merchant: 'good' } },
      { c: 'No threshold works. Raise it → the disguised trap slips through. Lower it → he alarms on Law\'s allied submarine. One straight line cannot cut both diagonals apart.', p: { nest: 'bad' }, l: { nest: 'no single line separates ⚠ from ✓' } },
      { c: 'The committee: Zoro learns ONE simple pattern — "armed AND hostile colors". A straight-line detector that lights up only for the warship corner.', a: { zoro: [14, 55] }, p: { warship: 'lit' } },
      { c: 'Sanji learns the OPPOSITE pattern — "looks harmless but rides too low, too many boots below deck". His line lights up only for the disguised-trap corner.', a: { sanji: [86, 55] }, p: { disguise: 'lit' } },
      { c: 'Luffy combines: if EITHER lookout shouts → alarm. Two linear detectors + one combiner = XOR solved. Zoro and Sanji are the hidden layer; their instincts are learned features.', p: { verdict: 'good', nest: '' }, l: { verdict: 'y = A OR B → XOR ✓' }, a: { luffy: [50, 82] } }
    ]
  },
  conceptFlow: {
    title: 'XOR, solved by committee',
    intro: 'Same neurons A and B as the worked example.',
    stages: [
      { label: 'The wall', nodes: [
        { id: 'wall', text: 'One neuron\ncan\'t separate XOR' },
      ]},
      { label: 'Hidden layer', nodes: [
        { id: 'a', text: 'Neuron A\na = ReLU(x1+x2) — "any on"' },
        { id: 'b', text: 'Neuron B\nb = ReLU(x1+x2−1) — "both on"' },
      ]},
      { label: 'Combine', nodes: [
        { id: 'combine', text: 'Output\ny = a − 2b' },
      ]},
      { label: 'Solved', nodes: [
        { id: 'solved', text: '(0,0)→0 (1,0)→1\n(0,1)→1 (1,1)→0 ✓' },
      ]},
    ],
    steps: [
      { active: ['wall'], note: 'XOR\'s positive cases sit on opposite diagonal corners — no single straight line separates them from the negative cases.' },
      { active: ['a'], note: 'Neuron A detects "at least one input on": a = ReLU(x1+x2). Still just a straight line — but a different one.' },
      { active: ['b'], note: 'Neuron B detects "both inputs on": b = ReLU(x1+x2−1). Another straight line, positioned differently.' },
      { active: ['combine', 'solved'], note: 'Combine: y = a − 2b. At (1,1): a=2, b=1, y=0 — B exactly cancels A when both are on. Two straight lines plus a combiner solve what no single line could.' },
    ],
  },
  tech: [
    {
      q: 'Why is a layer literally a matrix multiplication, and why do GPUs matter?',
      a: 'A layer of n neurons on m inputs holds an n×m weight matrix W and a bias vector b (n×1). Computing all n neurons at once is h = act(Wx + b) — one matrix-vector product. A batch of k examples stacks the x\'s into a matrix, making it a matrix-matrix product. So a forward pass is nothing but chained matrix multiplies with elementwise squashes — and matrix multiply is embarrassingly parallel: every output cell is an independent dot product. GPUs have thousands of small cores built for exactly this, which is why a GPU trains in hours what a CPU takes weeks to do, and why the entire deep-learning era tracks GPU progress. When PyTorch code says nn.Linear(784, 128), it means: allocate a 128×784 W and a 128-vector b, and on every call do Wx + b.'
    },
    {
      q: 'What exactly does "the network learns features" mean mechanically?',
      a: 'Each hidden neuron\'s weight vector defines a direction in input space (Part 1: a dot product measures alignment). The neuron fires strongly for inputs aligned with its weights — so the weight vector IS a template of the pattern the neuron detects. During training, gradient descent nudges these templates toward whatever patterns reduce the loss: in vision nets, first-layer templates famously converge to edge and color-blob detectors (you can plot the weights as tiny images and see the edges). "Learning features" = gradient descent sculpting weight-vector templates so that later layers get a representation in which the task is linearly easy. Nobody chooses the features; the loss does.'
    },
    {
      q: 'Why does softmax exponentiate instead of just normalizing the scores?',
      a: 'Three reasons. (1) Scores (logits) can be negative; e^z makes everything positive so we can normalize into probabilities. (2) exp amplifies differences — a logit gap of 3 becomes a probability ratio of e³ ≈ 20 — giving a sharp but differentiable "argmax-like" behavior (hence SOFTmax). (3) The killer reason: softmax + cross-entropy have a jointly beautiful gradient — ∂L/∂zᵢ = pᵢ − yᵢ, prediction minus truth, the same clean form you saw for logistic regression (sigmoid is just 2-class softmax). Plain normalization (z/Σz) has none of these properties and breaks on negatives. Bonus fact for the lab and interviews: softmax(z) = softmax(z − c) for any constant c, so implementations subtract max(z) first to stop e^z overflowing — "the log-sum-exp trick".'
    },
    {
      q: 'What does the bias term actually do — could we drop it?',
      a: 'Without b, the decision boundary w·x = 0 must pass through the origin, and a ReLU neuron must fire on exactly half of all directions. The bias shifts the threshold: ReLU(w·x + b) lets the neuron stay silent until the pattern strength clears −b. Usopp\'s alarm threshold IS his bias. Drop biases and you lose the ability to place boundaries freely — networks still sort of work (and some transformer variants do drop them, compensating with normalization layers), but for the MLPs here, the bias is one extra number per neuron that buys full freedom of boundary placement. In code it\'s the "+ b" in Wx + b and the bias=True default in nn.Linear.'
    }
  ],
  code: {
    title: 'An MLP forward pass, in nothing but numpy',
    intro: 'The entire forward machinery of deep learning in ~20 lines: two layers, ReLU between, softmax at the end. Everything PyTorch does in the next lessons is this, plus automated gradients.',
    code: `import numpy as np

def relu(z):    return np.maximum(0, z)
def softmax(z):
    z = z - z.max(axis=-1, keepdims=True)   # log-sum-exp trick: no overflow
    e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)

rng = np.random.default_rng(0)

# A 2-layer MLP: 4 inputs -> 8 hidden (ReLU) -> 3 classes (softmax)
W1, b1 = rng.normal(0, 0.5, (8, 4)), np.zeros(8)
W2, b2 = rng.normal(0, 0.5, (3, 8)), np.zeros(3)

def forward(x):
    h = relu(W1 @ x + b1)          # hidden layer: template match + squash
    logits = W2 @ h + b2           # output scores, one per class
    return softmax(logits)         # scores -> probability distribution

x = np.array([0.2, -1.0, 0.5, 0.1])
p = forward(x)
print(p, p.sum())                  # 3 probabilities, summing to 1.0

# Parameter count: (8*4 + 8) + (3*8 + 3) = 40 + 27 = 67
n_params = W1.size + b1.size + W2.size + b2.size
print("parameters:", n_params)`,
    notes: [
      'Every "@" is a layer\'s worth of neurons firing at once — n dot products as one matrix-vector product. Replace numpy with torch and add .backward() and you have next lesson\'s training loop.',
      'Parameter counting (out×in + out per layer) is a real interview quickie: know it cold. This toy net has 67; GPT-3 has 175 billion of exactly the same kind of numbers.',
      'The softmax max-subtraction is not optional in real code: e^1000 overflows to inf. Interviewers ask about this as "how do you compute softmax stably?"',
      'Note what\'s missing: no learning yet. Weights are random, so the probabilities are nonsense. Backprop (next lesson) is what turns this from a random function into a trained one.'
    ]
  },
  lab: {
    title: 'Build a neuron, a layer, and the XOR network',
    prompt: 'Pure Python (math module only). Implement (1) <code>relu(z)</code> and <code>sigmoid(z)</code>; (2) <code>dense(x, W, b, act)</code> — one layer: for each row Wᵢ of W, compute act(Wᵢ·x + bᵢ), returning the list of outputs; (3) <code>mlp_xor(x1, x2)</code> — wire the lesson\'s committee with the given weights: hidden layer W1=[[1,1],[1,1]], b1=[0,−1] with ReLU (neuron A = "any on", neuron B = "both on"), then output y = 1·a − 2·b. Return y (0 or 1 for boolean inputs).',
    starter: `import math

def relu(z):
    ...

def sigmoid(z):
    ...

def dense(x, W, b, act):
    # one layer: [act(dot(row, x) + bi) for each row/bi]
    ...

def mlp_xor(x1, x2):
    # hidden: W1 = [[1,1],[1,1]], b1 = [0,-1], activation relu
    # output: y = 1*a - 2*b   (a, b = the two hidden outputs)
    ...`,
    checks: [
      { re: 'def\\s+dense\\s*\\(', must: true, hint: 'Define dense(x, W, b, act) — the general layer.', pass: 'dense() defined' },
      { re: 'def\\s+mlp_xor\\s*\\(', must: true, hint: 'Define mlp_xor(x1, x2) using dense().', pass: 'mlp_xor() defined' },
      { re: 'dense\\s*\\(', flags: 'g', must: true, hint: 'mlp_xor should call your dense() — the point is reusing the layer abstraction.', pass: 'dense() is used' },
      { re: 'import\\s+numpy', must: false, hint: 'Pure Python here — write the dot product yourself so you feel the layer.', pass: 'No numpy used' }
    ],
    tests: `assert relu(3.2) == 3.2 and relu(-5) == 0
assert abs(sigmoid(0) - 0.5) < 1e-9
assert 0 < sigmoid(-10) < 0.001 and 0.999 < sigmoid(10) < 1

# one layer, by hand: W = [[2,0],[0,3]], b = [1,-1], x = [1,1]
out = dense([1,1], [[2,0],[0,3]], [1,-1], relu)
assert out == [3, 2], f"dense wrong: {out}"

# the committee solves XOR
assert mlp_xor(0,0) == 0
assert mlp_xor(1,0) == 1
assert mlp_xor(0,1) == 1
assert mlp_xor(1,1) == 0, "both on -> neuron B fires and cancels: y = 2 - 2*1 = 0"
print("XOR falls. Zoro and Sanji approve of your hidden layer.")`,
    runnable: true,
    solution: `import math

def relu(z):
    return z if z > 0 else 0

def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))

def dense(x, W, b, act):
    return [act(sum(w*xi for w, xi in zip(row, x)) + bi)
            for row, bi in zip(W, b)]

def mlp_xor(x1, x2):
    a, b = dense([x1, x2], [[1, 1], [1, 1]], [0, -1], relu)
    return 1*a - 2*b`,
    notes: [
      'Trace (1,1) by hand once: a = relu(2) = 2, b = relu(2−1) = 1, y = 2 − 2 = 0. The second neuron exists purely to cancel the "both on" case — that cancellation IS the nonlinear boundary.',
      'Your dense() is nn.Linear + activation. Every network in the rest of this course — including GPT — is dense() calls arranged in a pattern, with weights found by gradient descent instead of given to you.',
      'We handed you the XOR weights. Next lesson answers the real question: how does the network FIND weights like these from data alone? (Backpropagation.)'
    ]
  },
  quiz: [
    {
      q: 'You build a 10-layer network but use NO activation functions between layers. What can it compute?',
      options: ['Only linear functions — the ten matrices collapse into one matrix', 'Anything, given enough neurons', 'Only XOR-like functions', 'Nothing — it won\'t run without activations'],
      correct: 0,
      explain: 'W₁₀W₉…W₁x = (one matrix)x. Composition of linear maps is linear, so all that depth buys exactly one straight-line boundary. Nonlinear activations are what make layers not collapse.'
    },
    {
      q: 'Why can\'t a single neuron (perceptron) learn XOR?',
      options: ['XOR\'s positive examples sit on opposite diagonal corners — not separable by one straight line', 'XOR has too many training examples', 'The sigmoid saturates on binary inputs', 'It can, with a high enough learning rate'],
      correct: 0,
      explain: 'One neuron draws one hyperplane. XOR needs the two diagonal corners (0,1),(1,0) on one side and (0,0),(1,1) on the other — geometrically impossible with a line. Two hidden neurons + a combiner solve it.'
    },
    {
      q: 'Why is ReLU preferred over sigmoid for hidden layers in deep networks?',
      options: ['Its gradient is 1 for positive inputs, so gradients don\'t vanish as they multiply through layers', 'It outputs probabilities', 'It is bounded between 0 and 1', 'It makes the network linear and therefore faster'],
      correct: 0,
      explain: 'Sigmoid\'s derivative maxes at 0.25 and ≈0 when saturated; multiplying many such factors kills the gradient in deep nets. ReLU passes gradient 1 through active units (and is cheap). Sigmoid survives only as the binary output squash.'
    },
    {
      q: 'An MLP has 100 inputs, one hidden layer of 50 (with biases), and 10 outputs (with biases). Total parameters?',
      options: ['(100·50 + 50) + (50·10 + 10) = 5,560', '100·50·10 = 50,000', '100 + 50 + 10 = 160', '(100·50) + (50·10) = 5,500'],
      correct: 0,
      explain: 'Per layer: out×in weights + out biases. 5050 + 510 = 5560. Counting parameters is a standard interview warm-up — and the same arithmetic (at 10⁹ scale) sizes LLMs.'
    },
    {
      q: 'The universal approximation theorem says one hidden layer can approximate any continuous function. So why use deep networks?',
      options: ['Depth represents compositional structure exponentially more efficiently, and "enough neurons" for shallow nets can be astronomical', 'The theorem was disproven', 'Deep networks are easier to interpret', 'Shallow networks cannot use ReLU'],
      correct: 0,
      explain: 'The theorem is about existence, not efficiency or trainability. Hierarchical functions (edges→parts→objects) need exponentially wide shallow nets but compact deep ones — layers reuse sub-features like code reuses functions.'
    }
  ],
  testFlow: {
    title: 'Test yourself: neurons & MLPs',
    start: 'q1',
    nodes: {
      q1: { qid: 'q1', q: 'You build a 10-layer network but use NO activation functions between layers. What can it compute?', choices: [
        { text: 'Only linear functions — the ten matrices collapse into one matrix', to: 'q1_right' },
        { text: 'Anything, given enough neurons', to: 'q1_wrong_anything' },
        { text: 'Only XOR-like functions', to: 'q1_wrong_xor' },
      ]},
      q1_right: { end: true, correct: true, text: 'Right — W₁₀W₉…W₁x collapses to (one matrix)x. Composition of linear maps is linear, so all that depth buys exactly one straight-line boundary.', next: 'q2' },
      q1_wrong_anything: { end: true, correct: false, text: 'More neurons doesn\'t fix this — the fundamental issue is algebraic: composing linear transformations, no matter how many or how wide, always collapses to a single linear transformation.', retry: 'q1' },
      q1_wrong_xor: { end: true, correct: false, text: 'Without nonlinearities, the network can\'t even solve XOR — that\'s the WHOLE point of the XOR example. Pure linear composition is strictly LESS capable, not specifically XOR-shaped.', retry: 'q1' },
      q2: { qid: 'q2', q: 'Why can\'t a single neuron (perceptron) learn XOR?', choices: [
        { text: 'XOR\'s positive examples sit on opposite diagonal corners — not separable by any single straight line', to: 'q2_right' },
        { text: 'XOR has too many training examples for one neuron to handle', to: 'q2_wrong_examples' },
        { text: 'The sigmoid activation saturates on binary (0/1) inputs', to: 'q2_wrong_saturate' },
      ]},
      q2_right: { end: true, correct: true, text: 'Right — (0,1) and (1,0) need to land on one side, (0,0) and (1,1) on the other, and geometrically no single hyperplane can do that. Two hidden neurons plus a combiner solve it.', next: 'q3' },
      q2_wrong_examples: { end: true, correct: false, text: 'XOR only has 4 possible input combinations — that\'s a trivially small dataset. The limitation is purely geometric: a single line cannot separate points arranged on opposite diagonals, regardless of dataset size.', retry: 'q2' },
      q2_wrong_saturate: { end: true, correct: false, text: 'Saturation is a gradient/training-speed issue, not a representational one. Even with a PERFECTLY trained single neuron, a linear decision boundary geometrically cannot separate XOR\'s diagonal pattern.', retry: 'q2' },
      q3: { qid: 'q3', q: 'Why is ReLU generally preferred over sigmoid for HIDDEN layers in deep networks?', choices: [
        { text: 'Its gradient is exactly 1 for positive inputs, so gradients don\'t vanish as they multiply through many layers', to: 'q3_right' },
        { text: 'It outputs values that can be directly interpreted as probabilities', to: 'q3_wrong_prob' },
        { text: 'It is bounded between 0 and 1, like sigmoid', to: 'q3_wrong_bounded' },
      ]},
      q3_right: { end: true, correct: true, text: 'Right — sigmoid\'s derivative maxes out at just 0.25 and approaches 0 when saturated; multiplying many such small factors through depth kills the gradient. ReLU passes gradient 1 through every active unit, at any depth.', },
      q3_wrong_prob: { end: true, correct: false, text: 'ReLU outputs unbounded non-negative values (0 to infinity), not probabilities — sigmoid is the one that outputs values in (0,1) suitable for probability interpretation, and that\'s specifically why sigmoid survives as an OUTPUT layer choice.', retry: 'q3' },
      q3_wrong_bounded: { end: true, correct: false, text: 'ReLU is explicitly UNBOUNDED above (max(0,z) can be any positive value) — this is actually the opposite of sigmoid\'s bounded (0,1) range, and is part of why it avoids saturation-driven vanishing gradients.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Saying "neural networks are like the brain" in an interview. The analogy is historical branding; the honest description is "stacked linear maps with nonlinearities, trained by gradient descent". Lead with the math, mention the neuroscience inspiration only if asked.',
    'Forgetting the activation on hidden layers (a real, common bug: nn.Linear stacked directly on nn.Linear). The network silently becomes linear and plateaus at logistic-regression-level accuracy — no error message, just mediocrity.',
    'Putting an activation on a regression output. Squashing the final layer of a price predictor through sigmoid caps predictions at 1 and destroys training. Regression output = raw linear neuron.',
    'Computing softmax without subtracting the max. e^1000 = inf → NaNs everywhere. Any framework does this for you inside its CrossEntropyLoss — which is why you feed it raw logits, not softmax outputs (double-softmax is the twin bug).',
    'Interpreting individual hidden neurons as if they must mean something human-nameable. Some do (edge detectors), most don\'t (Chandler\'s job). Judge representations by downstream performance.'
  ],
  interview: [
    {
      q: 'What happens if you initialize all weights of a neural network to zero?',
      a: 'Every neuron in a layer receives identical inputs, has identical weights, so produces identical outputs and — crucially — identical gradients. They update in lockstep forever: the layer behaves as one neuron duplicated n times, and no feature diversity can ever emerge. This is the symmetry-breaking problem. Random initialization breaks the tie so different neurons can specialize into different features. (Biases CAN start at zero — the random weights already break symmetry.) Follow-up worth volunteering: initialization scale also matters — too large saturates activations, too small shrinks signals layer by layer; schemes like Xavier/He initialization pick the variance to keep activation magnitudes stable across depth.'
    },
    {
      q: 'Why do neural networks need nonlinear activation functions?',
      a: 'Because a composition of linear maps is itself linear: stacking Linear layers without activations collapses algebraically into a single matrix, so a 100-layer "network" could still only learn linear decision boundaries — it couldn\'t even solve XOR. The nonlinearity between layers prevents the collapse and lets each layer genuinely re-represent its input, folding the space so that classes which were not linearly separable become separable. Concretely: with ReLU hidden units, two neurons plus a linear combiner compute XOR — a = ReLU(x₁+x₂), b = ReLU(x₁+x₂−1), y = a−2b. The choice of nonlinearity then matters for optimization: sigmoids saturate and vanish gradients in deep stacks; ReLU keeps gradient 1 on active paths, which is why it became the default.'
    },
    {
      q: 'Explain sigmoid vs tanh vs ReLU, and when you\'d use each.',
      a: 'Sigmoid maps to (0,1) — use it exactly where you need a probability: the output of a binary classifier. As a hidden activation it is poor: it saturates on both ends and its derivative peaks at 0.25, so deep stacks suffer vanishing gradients. Tanh maps to (−1,1); being zero-centered it optimizes better than sigmoid and it survives in some RNN gates, but it still saturates. ReLU = max(0,z): gradient exactly 1 when active, trivially cheap, sparse activations — the modern default for hidden layers in MLPs and CNNs. Its failure mode is dead units (always-negative input ⇒ zero gradient forever), mitigated by LeakyReLU or by GELU — the smooth ReLU relative that transformers (BERT, GPT) use. Practical answer: ReLU/GELU hidden, sigmoid for binary output, softmax for multiclass output, and tanh mostly when a recipe (e.g., LSTM) calls for it.'
    },
    {
      q: 'Design the output layer and loss for: (a) predicting house price, (b) spam detection, (c) classifying a news article into 20 topics, (d) tagging an article with any subset of 20 topics.',
      a: '(a) Regression: 1 linear neuron, no activation, MSE loss (or MAE/Huber if outliers are a concern — MSE is MLE under Gaussian noise, from Part 1). (b) Binary: 1 neuron + sigmoid, binary cross-entropy. (c) Multi-class, exactly one label: 20 neurons + softmax, categorical cross-entropy — softmax couples the outputs so probabilities compete and sum to 1. (d) Multi-LABEL, labels independent: 20 neurons each with its own sigmoid + binary cross-entropy per output — no softmax, because softmax forces the topics to compete while an article can be about several. The (c)-vs-(d) distinction — softmax for mutually exclusive classes, independent sigmoids for multi-label — is precisely what interviewers are probing with this question.'
    }
  ]
};
