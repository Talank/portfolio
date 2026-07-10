window.LESSONS = window.LESSONS || {};
window.LESSONS['backpropagation'] = {
  id: 'backpropagation',
  title: 'Backpropagation, Step by Step',
  category: 'Part 3 — Deep Learning',
  timeMin: 60,
  summary: 'Gradient descent needs the gradient — but a network has millions of weights buried under layers of composition. Backpropagation is the chain rule, organized: blame flows backward from the loss, each layer multiplies in its local sensitivity, and every weight learns its share of the fault at the cost of roughly one extra forward pass. This is the algorithm that trains everything from MLPs to GPT.',
  goals: [
    'State backprop in one sentence: the chain rule applied backwards through the computational graph, reusing shared work',
    'Hand-compute every gradient of a 2-layer network and check it numerically',
    'Explain why we go backward (one loss, many weights) and why the cost is only ~2× a forward pass',
    'Derive the famous local derivatives: sigmoid → h(1−h), and softmax+cross-entropy → p − y',
    'Explain vanishing/exploding gradients as products of local derivatives, and name the modern fixes'
  ],
  concept: [
    {
      h: 'The problem: one loss, a million knobs',
      p: [
        'Gradient descent (Part 1) updates every weight by w ← w − η·∂L/∂w. Fine — but the loss sits at the END of a long composition: L depends on the output, which depends on layer 3, which depends on layer 2\'s weights… To train, we need ∂L/∂w for EVERY weight, and computing each one from scratch would repeat the same sub-derivatives millions of times.',
        'Backpropagation is not a new kind of math. It is the chain rule from the calculus lesson, plus one systems idea: <em>compute the shared pieces once and reuse them</em>, sweeping from the loss backwards. Dynamic programming applied to differentiation.'
      ]
    },
    {
      h: 'The chain rule, worn like a tool',
      p: [
        'If L depends on y, and y depends on w, then a small nudge to w moves y (by ∂y/∂w), and that movement moves L (by ∂L/∂y). The effects multiply:',
        '<div class="math">∂L/∂w = ∂L/∂y · ∂y/∂w<span class="mnote">"my blame = how much the boss cares about my output × how much my knob moves my output" — local sensitivity times downstream blame.</span></div>',
        'Every node in a network only ever needs to answer one local question: "if my output wiggled by ε, how much does MY immediate output wiggle?" That local derivative, multiplied by the blame arriving from downstream, gives the blame to pass further upstream. No node needs to understand the whole network — the chain rule stitches the local answers into global gradients. That locality is why the algorithm scales to a trillion parameters.'
      ]
    },
    {
      h: 'The computational graph: forward stores, backward multiplies',
      p: [
        'Write the network as a graph of primitive operations (multiply, add, sigmoid, …). The <b>forward pass</b> computes the output AND stashes each intermediate value (we\'ll need them: sigmoid\'s derivative needs sigmoid\'s output, a product\'s derivative needs the other factor). The <b>backward pass</b> starts at the loss with ∂L/∂L = 1 and visits nodes in reverse order; each node multiplies the incoming gradient by its local derivative and hands the result to its inputs. Where paths merge (a value used in two places), gradients <b>add</b> — total blame is the sum over all routes it influenced the loss through.',
        'Two consequences worth saying out loud. First, <b>cost</b>: each edge of the graph is touched once forward and once backward, so backprop costs about the same as one extra forward pass — that is the miracle; the naive alternative (one perturbed forward pass per weight) would cost millions of forward passes. Second, <b>memory</b>: those stashed activations are why <em>training</em> a model needs far more GPU memory than <em>running</em> it — inference can discard each layer\'s output immediately; training must keep them all until backward consumes them.'
      ]
    },
    {
      h: 'Worked example: every gradient of a 2-layer net',
      p: [
        'The smallest network with a hidden layer, all scalars: z = w₁x + b₁, then h = σ(z), then y = w₂h + b₂, loss L = (y − t)². This is exactly the network in your lab. Backward, one hop at a time:',
        '<div class="math">∂L/∂y = 2(y − t)<br>∂L/∂w₂ = ∂L/∂y · h&nbsp;&nbsp;&nbsp;&nbsp;∂L/∂b₂ = ∂L/∂y · 1<br>∂L/∂h = ∂L/∂y · w₂<br>∂L/∂z = ∂L/∂h · σ\'(z) = ∂L/∂h · h(1 − h)<br>∂L/∂w₁ = ∂L/∂z · x&nbsp;&nbsp;&nbsp;&nbsp;∂L/∂b₁ = ∂L/∂z · 1<span class="mnote">read it as a bucket brigade: each line takes the blame from the line above and multiplies in one local derivative. Notice h and z from the forward pass being reused — that\'s why we stored them.</span></div>',
        'The sigmoid\'s local derivative deserves its box: σ\'(z) = σ(z)(1 − σ(z)) — derived in the calculus lesson, and delightfully computed from the OUTPUT alone, no re-evaluation needed. Its maximum value is 0.25 (at z = 0), a number about to become the villain of this lesson.',
        'One more famous local derivative, stated here and derived in the technicality corner: for softmax outputs p trained with cross-entropy against one-hot truth y, the gradient at the logits is simply <b>p − y</b> — prediction minus truth, the same clean error signal you found for linear regression (with MSE) and logistic regression. This is not coincidence; it is the matched-pairs pattern of losses and output layers, and it is why frameworks fuse softmax and cross-entropy into one op.'
      ]
    },
    {
      h: 'Why backward, not forward?',
      p: [
        'The chain rule works in either direction. <em>Forward-mode</em> differentiation pushes "how does everything change per unit nudge of THIS input?" from one input to all outputs — one pass per input. <em>Reverse-mode</em> pulls "how does THIS output change per unit nudge of everything?" from one output to all inputs — one pass per output. A neural network has millions of inputs-to-the-gradient (the weights) and exactly ONE scalar output that matters (the loss). One reverse pass gets every ∂L/∂w at once; forward mode would need a pass per weight. Backprop = reverse-mode automatic differentiation applied to the loss. When PyTorch runs loss.backward(), this graph walk is literally what executes.'
      ]
    },
    {
      h: 'Vanishing and exploding gradients',
      p: [
        'Look again at the bucket brigade: the blame reaching early layers is a PRODUCT of many local derivatives, one per layer crossed. Products of many numbers are unstable in both directions. If the factors are typically < 1 — sigmoid\'s ≤ 0.25 is the classic culprit — the gradient shrinks geometrically: ten sigmoid layers scale it by up to 0.25¹⁰ ≈ 10⁻⁶, and early layers receive essentially no learning signal. That is the <b>vanishing gradient problem</b>, the reason deep networks "didn\'t work" for decades. If factors are > 1, gradients <b>explode</b> instead — updates overshoot, the loss goes to NaN (RNNs, next lessons, are the classic victims).',
        'The modern toolkit exists almost entirely to keep that product near 1: <b>ReLU</b> (local derivative exactly 1 on active paths), <b>residual connections</b> (skip paths give gradients a derivative-1 highway past each block — the key trick inside transformers), <b>normalization layers</b> (keep activations in the regime where derivatives are healthy), <b>careful initialization</b> (start the product balanced), and <b>gradient clipping</b> (cap the norm when it explodes). Memorize that list as a unit: "how do we fight vanishing gradients?" is a guaranteed interview question, and every item will reappear when we assemble the transformer.'
      ]
    },
    {
      h: 'Gradient checking: trust, but verify',
      p: [
        'The chain rule tells you what the gradient should be; the definition of the derivative tells you how to CHECK it. Nudge one weight by tiny ε both ways and compare:',
        '<div class="math">∂L/∂w ≈ (L(w + ε) − L(w − ε)) / 2ε<span class="mnote">central difference, ε ≈ 10⁻⁵. Too slow to train with (two forward passes per weight!) — but perfect for verifying a hand-written backward pass on a few weights.</span></div>',
        'This is how you debug backprop implementations, how autograd frameworks test themselves (torch.autograd.gradcheck), and how your lab will prove your analytic gradients are right. If analytic and numerical disagree beyond ~10⁻⁴ relative error, the analytic code has a bug — the numerical one is definitionally correct, just slow.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The missed cannon shot: blame flows backward through the crew',
      text: 'The Going Merry fires on a Marine pursuer and misses by twelve meters. Luffy\'s instinct is to yell at everyone equally — but Nami runs the post-mortem properly, starting from the miss and walking BACKWARD through the chain of stations. The shot\'s error came directly from the cannon\'s aim: Usopp, at the last station, asks the local question "if my aim angle had been one degree different, how much less would we have missed?" — say 4 meters per degree. His blame = (12 meters of miss) × his local sensitivity. But Usopp aimed based on the heading Zoro was steering — so Usopp passes blame upstream, scaled: "of my aiming error, this much traces to the heading you gave me." Zoro asks HIS local question — "one degree of my steering moves Usopp\'s effective aim by how much?" — multiplies, and passes the product further back to Nami\'s course calculation, who passes it back to the weather reading. Each station only ever knows its own local sensitivity — Usopp doesn\'t understand navigation, Nami doesn\'t understand cannons — yet multiplying the local numbers along the chain tells every single station exactly how much of the twelve meters is theirs, in ONE backward sweep. And where two paths merge — Nami\'s course fed BOTH Zoro\'s steering AND Usopp\'s wind correction — her blame is the SUM from both routes. The crew adjusts each station in proportion to its blame (gradient descent step), fires again, misses by three meters. Repeat. That backward sweep of scaled blame is backpropagation, and the reason nobody re-derives the whole battle from scratch per station is the reason backprop costs one pass instead of a million: shared sub-blames are computed once and reused.'
    },
    sitcom: {
      show: 'Friends',
      title: 'The One Where No One\'s Ready (chain rule edition)',
      text: 'Ross must get everyone to the museum banquet, and they leave 40 minutes late. Who does he blame, and how much? Work backward from the loss (40 minutes). The last delay: Rachel had no outfit — her local contribution, 15 minutes. But WHY was she stuck? Phoebe\'s dress got hummus on it, which pulled Rachel into outfit triage — so part of Rachel\'s 15 propagates back to the hummus incident, scaled by how much of her delay it caused. Meanwhile Joey wearing ALL of Chandler\'s clothes ("Could I BE wearing any more clothes?") traces back through Chandler hiding Joey\'s underwear, which traces back to the chair war. Chandler\'s chair grab was upstream of BOTH the clothes crisis AND the couch standoff — so his total blame is the SUM over both paths. Ross, screaming, is computing reverse-mode automatic differentiation: start at the total lateness, walk each cause backward, multiply each link\'s local sensitivity, add where paths merge. And the fix mirrors gradient descent: he applies pressure proportional to blame — maximum at Joey and Chandler, mild at Phoebe — and the system\'s lateness decreases on the next event.'
    },
    why: 'Both stories carry the three load-bearing ideas: (1) each station/friend answers only a LOCAL sensitivity question, (2) blame arriving from downstream is MULTIPLIED by that local number and passed on, (3) where one cause feeds two paths, blames ADD. If you can retell the cannon post-mortem, you can pass any "explain backprop" interview — swap stations for graph nodes and blame for ∂L/∂·.'
  },
  storyAnim: {
    title: 'Post-mortem of a missed shot: the backward sweep',
    h: 250,
    props: [
      { id: 'weather', emoji: '🌬️', label: 'wind reading', x: 10, y: 20 },
      { id: 'course', emoji: '🗺️', label: 'Nami: course', x: 30, y: 20 },
      { id: 'helm', emoji: '🧭', label: 'Zoro: heading', x: 50, y: 20 },
      { id: 'aim', emoji: '🎯', label: 'Usopp: aim', x: 70, y: 20 },
      { id: 'miss', emoji: '💥', label: 'miss: 12 m (the loss)', x: 90, y: 20 },
      { id: 'note', emoji: '📜', label: 'rule: blame = local × downstream', x: 30, y: 85 }
    ],
    actors: [
      { id: 'nami', emoji: '🍊', label: 'Nami (audit)', x: 90, y: 55 },
      { id: 'luffy', emoji: '👒', label: 'Luffy', x: 10, y: 55 }
    ],
    steps: [
      { c: 'FORWARD: wind → course → heading → aim → shot. Each station computes its piece and (crucially) remembers what it did. The shot misses by 12 m — that\'s the loss.', p: { miss: 'bad' } },
      { c: 'Luffy wants to yell at everyone equally. Nami: "No. We sweep BACKWARD from the miss, one station at a time."', a: { nami: [90, 45] } },
      { c: 'Usopp\'s local question: "one degree of my aim = how many meters of miss?" Multiply by the 12 m → his exact share of blame. He needs no navigation knowledge — only his LOCAL sensitivity.', a: { nami: [70, 45] }, p: { aim: 'lit' } },
      { c: 'Usopp passes his blame upstream, scaled. Zoro multiplies in HIS local derivative (heading → effective aim) and passes the product on. A bucket brigade of multiplications.', a: { nami: [50, 45] }, p: { helm: 'lit' } },
      { c: 'Nami\'s course fed TWO paths — Zoro\'s steering and Usopp\'s wind correction. Where paths merge, blames ADD: her total = sum over both routes.', a: { nami: [30, 45] }, p: { course: 'lit' }, l: { course: 'Nami: blame = path₁ + path₂' } },
      { c: 'One backward sweep prices every station\'s share of 12 m. Adjust each in proportion (gradient step), refire: 3 m. This sweep costs about one extra pass — not one pass per station. That\'s backprop.', p: { weather: 'lit', miss: 'good', note: 'good' }, l: { miss: 'next shot: 3 m ✓' } }
    ]
  },
  tech: [
    {
      q: 'What exactly does loss.backward() do in PyTorch?',
      a: 'During the forward pass, every tensor operation on tensors with requires_grad=True appends a node to a graph, recording the op and saving whatever it needs for its local derivative (inputs, outputs). loss.backward() walks that graph in reverse topological order from the loss node, seeding with dL/dL = 1: each node multiplies the incoming gradient by its local Jacobian and routes results to its parents, ACCUMULATING into each leaf parameter\'s .grad field (accumulating — which is why the training loop calls optimizer.zero_grad() first, or the previous batch\'s blame lingers). The graph is then freed. It is exactly the cannon post-mortem: recorded forward, one multiplied-and-summed sweep backward, every parameter left holding its share of the blame.'
    },
    {
      q: 'Derive why softmax + cross-entropy gives the gradient p − y at the logits.',
      a: 'Loss L = −log p_c where c is the true class and p = softmax(z). Write L = −z_c + log Σⱼ e^{zⱼ} (expand the log of the softmax). Differentiate w.r.t. logit z_i: the first term gives −1 if i = c else 0 (that\'s −y_i for one-hot y); the second gives e^{z_i}/Σⱼe^{zⱼ} = p_i. So ∂L/∂z_i = p_i − y_i. Every messy piece — the exponentials, the normalization coupling all classes — cancels into "predicted probability minus truth". Consequences: gradients are bounded and well-scaled (in [−1,1]), confident-wrong predictions get the largest push, and frameworks fuse the two ops (CrossEntropyLoss takes raw logits) both for this clean gradient and for numerical stability. The same p − y form appears for sigmoid+BCE and linear+MSE: matched output/loss pairs are chosen precisely to produce it.'
    },
    {
      q: 'Why does training need so much more GPU memory than inference?',
      a: 'Backward needs the forward\'s intermediate values: sigmoid\'s derivative needs its output, matmul\'s derivative needs the other operand. So training must keep every layer\'s activations alive from forward until backward consumes them — memory grows with depth × batch size — plus gradients (one per parameter) and optimizer state (Adam keeps two extra numbers per parameter — next lesson). Inference keeps none of that: each activation is discarded the moment the next layer is computed. Rules of thumb: inference ≈ parameters + a little; training ≈ several × parameters + activations. The trick called gradient checkpointing trades compute for memory by storing only some activations and recomputing the rest during backward — standard practice when fine-tuning LLMs on small GPUs, and it will come back in Part 6.'
    },
    {
      q: 'If numerical gradients are "definitionally correct", why not train with them?',
      a: 'Cost and precision. Cost: the central difference needs two forward passes PER PARAMETER; a 1M-parameter model would need 2M forward passes to get one gradient vector that backprop delivers for the price of ~2. That is the difference between one step per second and one step per month. Precision: finite differences subtract two nearly equal numbers, so float round-off eats most of the significant digits; ε must be tuned per problem and the result is still approximate, while reverse-mode autodiff is exact to machine precision. So numerical gradients have exactly one job — verifying analytic ones on a handful of weights (torch.autograd.gradcheck does this, in float64) — and your lab does precisely that.'
    }
  ],
  code: {
    title: 'Backprop by hand vs autograd — same numbers',
    intro: 'The lab\'s 2-layer scalar network, computed three ways: hand-derived chain rule, numerical check, and PyTorch autograd. All three agree — that agreement is the whole point of the lesson.',
    code: `import torch

x, t = 1.5, 1.0                       # input, target
w1, b1 = torch.tensor(0.8, requires_grad=True), torch.tensor(-0.2, requires_grad=True)
w2, b2 = torch.tensor(1.1, requires_grad=True), torch.tensor(0.3,  requires_grad=True)

# forward — every op is recorded onto the autograd graph
z = w1 * x + b1
h = torch.sigmoid(z)
y = w2 * h + b2
loss = (y - t) ** 2

loss.backward()                        # the backward sweep: one call
print("autograd :", w1.grad.item(), b1.grad.item(), w2.grad.item(), b2.grad.item())

# the same gradients by hand — the bucket brigade from the lesson
with torch.no_grad():
    dy  = 2 * (y - t)                  # dL/dy
    dw2, db2 = dy * h, dy              # local: y = w2*h + b2
    dh  = dy * w2
    dz  = dh * h * (1 - h)             # sigmoid: h(1-h), from stored output
    dw1, db1 = dz * x, dz
print("by hand  :", dw1.item(), db1.item(), dw2.item(), db2.item())

# numerical check on w1 (definitionally correct, brutally slow)
eps = 1e-5
def f(w):
    return (torch.tensor(1.1) * torch.sigmoid(w * x - 0.2) + 0.3 - t) ** 2
num = (f(torch.tensor(0.8 + eps)) - f(torch.tensor(0.8 - eps))) / (2 * eps)
print("numerical:", num.item())        # matches both, to ~1e-6`,
    notes: [
      'Three independent computations, one answer — when your hand-derived line disagrees with autograd, the bug is in your algebra, and the numerical check referees.',
      'requires_grad=True is the flag that says "record operations touching this tensor"; .grad is where backward() deposits the blame. Leaf tensors only — intermediate h has no .grad by default.',
      'Notice dz reuses h from the forward pass — the stored-activation memory cost made concrete in one line.',
      'This snippet needs PyTorch (run it locally); the lab below does the identical computation in pure Python so you can run it right here in the browser.'
    ]
  },
  lab: {
    title: 'Derive the gradients, then prove them numerically',
    prompt: 'Pure Python. For the 2-layer scalar net z = w1·x + b1, h = sigmoid(z), y = w2·h + b2, L = (y − t)²: implement (1) <code>forward(x, params)</code> returning (z, h, y) with params = (w1, b1, w2, b2); (2) <code>loss(x, t, params)</code>; (3) <code>grads(x, t, params)</code> returning the analytic (dw1, db1, dw2, db2) via the chain rule from the lesson. The tests will check your analytic gradients against central-difference numerical gradients — the same verification real autograd frameworks use.',
    starter: `import math

def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))

def forward(x, params):
    w1, b1, w2, b2 = params
    # z = w1*x + b1 ; h = sigmoid(z) ; y = w2*h + b2
    ...

def loss(x, t, params):
    ...

def grads(x, t, params):
    w1, b1, w2, b2 = params
    z, h, y = forward(x, params)
    # bucket brigade: dy -> (dw2, db2) -> dh -> dz -> (dw1, db1)
    # sigmoid's local derivative: h * (1 - h)
    ...
    return (dw1, db1, dw2, db2)`,
    checks: [
      { re: 'def\\s+grads\\s*\\(', must: true, hint: 'Define grads(x, t, params) returning the four analytic gradients.', pass: 'grads() defined' },
      { re: 'h\\s*\\*\\s*\\(1\\s*-\\s*h\\)', must: true, hint: 'Use the sigmoid derivative h*(1-h) — computed from the stored forward output, no re-evaluation.', pass: 'σ\' = h(1−h) used' },
      { re: '2\\s*\\*\\s*\\(y\\s*-\\s*t\\)', must: true, hint: 'Start the brigade at the loss: dL/dy = 2*(y - t).', pass: 'dL/dy seeds the sweep' },
      { re: 'import\\s+(numpy|torch)', must: false, hint: 'Pure Python — you ARE the autograd engine today.', pass: 'No autograd shortcuts' }
    ],
    tests: `def numgrad(x, t, params, i, eps=1e-6):
    p_hi = list(params); p_hi[i] += eps
    p_lo = list(params); p_lo[i] -= eps
    return (loss(x, t, tuple(p_hi)) - loss(x, t, tuple(p_lo))) / (2 * eps)

params = (0.8, -0.2, 1.1, 0.3)
z, h, y = forward(1.5, params)
assert abs(z - (0.8*1.5 - 0.2)) < 1e-12
assert abs(h - sigmoid(z)) < 1e-12
assert abs(y - (1.1*h + 0.3)) < 1e-12

# analytic vs numerical, all four parameters, two different inputs
for (xx, tt) in [(1.5, 1.0), (-0.7, 0.0)]:
    g = grads(xx, tt, params)
    for i in range(4):
        n = numgrad(xx, tt, params, i)
        assert abs(g[i] - n) < 1e-4, f"param {i}: analytic {g[i]} vs numerical {n}"

# gradient step must reduce the loss
g = grads(1.5, 1.0, params)
stepped = tuple(p - 0.1 * gi for p, gi in zip(params, g))
assert loss(1.5, 1.0, stepped) < loss(1.5, 1.0, params)
print("Analytic == numerical. You just re-derived loss.backward().")`,
    runnable: true,
    solution: `import math

def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))

def forward(x, params):
    w1, b1, w2, b2 = params
    z = w1 * x + b1
    h = sigmoid(z)
    y = w2 * h + b2
    return z, h, y

def loss(x, t, params):
    z, h, y = forward(x, params)
    return (y - t) ** 2

def grads(x, t, params):
    w1, b1, w2, b2 = params
    z, h, y = forward(x, params)
    dy = 2 * (y - t)
    dw2 = dy * h
    db2 = dy
    dh = dy * w2
    dz = dh * h * (1 - h)
    dw1 = dz * x
    db1 = dz
    return (dw1, db1, dw2, db2)`,
    notes: [
      'Count the multiplications in grads(): six. The forward pass had five ops. Backward ≈ forward cost — you just witnessed the "2× miracle" firsthand.',
      'The numerical check in the tests is torch.autograd.gradcheck in miniature — the exact tool you\'d reach for when implementing a custom layer\'s backward.',
      'Scale this mentally: replace scalars with matrices (dw2 becomes dy·hᵀ, dh becomes w2ᵀ·dy) and you have the real algorithm for any MLP. The structure — seed, multiply local, pass upstream, add at merges — never changes.'
    ]
  },
  quiz: [
    {
      q: 'In one sentence, what is backpropagation?',
      options: ['The chain rule applied backward through the computation graph, reusing shared sub-derivatives so all gradients cost about one extra pass', 'A separate learning algorithm that replaces gradient descent', 'Randomly perturbing weights and keeping improvements', 'Running the network backward to reconstruct inputs'],
      correct: 0,
      explain: 'Backprop computes gradients (reverse-mode autodiff); gradient descent then uses them to update weights. Two different jobs — conflating them is a classic interview slip.'
    },
    {
      q: 'Why does backprop sweep backward from the loss rather than forward from the inputs?',
      options: ['There is ONE scalar loss and millions of weights — one reverse pass yields every ∂L/∂w; forward-mode would need a pass per weight', 'Backward passes are more numerically stable', 'The loss must be computed before the inputs', 'It doesn\'t matter; forward would be equally fast'],
      correct: 0,
      explain: 'Reverse mode is efficient for many-inputs → one-output; forward mode for one-input → many-outputs. A network\'s loss is the textbook many-to-one case.'
    },
    {
      q: 'A value computed once feeds into two later branches of the network. Its gradient is:',
      options: ['The SUM of the gradients flowing back along both branches', 'The maximum of the two branch gradients', 'The product of the two branch gradients', 'Whichever branch executed last'],
      correct: 0,
      explain: 'Multivariate chain rule: total influence on the loss = sum of influences through every path. Nami\'s course fed steering AND wind-correction — her blame is path₁ + path₂.'
    },
    {
      q: 'Ten hidden layers all use sigmoid activations. The most likely training pathology is:',
      options: ['Vanishing gradients — each layer multiplies in σ\' ≤ 0.25, so early layers get ~0.25¹⁰ of the signal and barely learn', 'Exploding gradients, since sigmoids amplify', 'Overfitting, since sigmoids memorize', 'Nothing — depth with sigmoids is standard today'],
      correct: 0,
      explain: 'The backward product of many ≤0.25 factors decays geometrically. Fixes to recite: ReLU, residual connections, normalization, good init, (and clipping for the exploding twin).'
    },
    {
      q: 'Why does training need the forward pass\'s intermediate activations kept in memory?',
      options: ['Local derivatives depend on them — e.g. sigmoid\'s is h(1−h), a matmul\'s needs the other operand — and backward consumes them after the forward finishes', 'They are the model\'s parameters', 'To display the loss curve', 'They are not needed; frameworks keep them only for debugging'],
      correct: 0,
      explain: 'This is why training VRAM ≫ inference VRAM, and why gradient checkpointing (recompute instead of store) exists. Inference throws each activation away immediately.'
    }
  ],
  pitfalls: [
    'Calling backprop "the learning algorithm". Backprop only COMPUTES gradients; gradient descent (or Adam) does the learning. Precise language here signals real understanding in interviews.',
    'Forgetting optimizer.zero_grad() in PyTorch. backward() ACCUMULATES into .grad, so skipping the reset mixes last batch\'s blame into this batch — training limps mysteriously. (Accumulation is a feature: it enables gradient accumulation for large effective batches.)',
    'Deriving σ\'(z) = h(1−h) but plugging in z instead of h. The derivative uses the OUTPUT of the sigmoid. Your numerical check catches this instantly — which is why you always gradient-check hand-written backward code.',
    'Testing with ε too small in numerical checks (1e-12): float subtraction cancels and the "reference" becomes noise. Use ε ≈ 1e-5/1e-6 and central differences.',
    'Believing exploding gradients only happen in exotic nets. Any deep product can blow up; if the loss suddenly becomes NaN mid-training, suspect exploding gradients and check the gradient norm — clipping (clip_grad_norm_) is the standard bandage.'
  ],
  interview: [
    {
      q: 'Explain backpropagation to someone who knows calculus but not ML.',
      a: 'A network is a long composition of simple functions, and training needs the derivative of one final scalar — the loss — with respect to every internal parameter. The chain rule gives each derivative as a product of local derivatives along the path from parameter to loss; backprop organizes those products efficiently: run forward once, storing intermediate values; then sweep backward from the loss, having each operation multiply the gradient flowing in by its own local derivative and pass the result to its inputs, summing where a value fed multiple paths. Because every edge is processed once, ALL gradients — millions of them — cost about as much as one extra forward pass, versus one perturbed forward pass per parameter naively. It is reverse-mode automatic differentiation plus dynamic programming, and it\'s exact, not approximate.'
    },
    {
      q: 'What are vanishing and exploding gradients? Causes and remedies?',
      a: 'The gradient reaching layer k is a product of local derivatives from all downstream layers. If those factors are typically below 1 the product decays geometrically with depth — vanishing gradients: early layers receive ~zero signal and stop learning (classic cause: saturating activations; sigmoid\'s derivative caps at 0.25). If factors exceed 1 the product grows geometrically — exploding gradients: loss spikes to NaN (classic in RNNs, where the same weight matrix multiplies in at every timestep). Remedies, in the order I\'d give them: ReLU-family activations (derivative 1 on active paths); residual/skip connections (an identity path whose derivative is exactly 1 — the reason 100-layer nets and transformers train at all); normalization layers (BatchNorm/LayerNorm keep activations in healthy derivative regimes); variance-preserving initialization (Xavier/He); and gradient clipping for the exploding side. LSTMs\' gates were historically the RNN-specific fix, and attention ultimately sidestepped the problem by shortening paths — that thread runs straight into Part 5.'
    },
    {
      q: 'Walk me through what a single training step does in PyTorch, naming what each line computes.',
      a: 'optimizer.zero_grad() clears accumulated gradients from the previous step (backward ADDS into .grad). output = model(batch) runs the forward pass, and autograd records every operation into a graph, saving the tensors each op\'s derivative will need. loss = criterion(output, target) appends the loss node — one scalar. loss.backward() executes reverse-mode autodiff: from dL/dL = 1, walk the graph backward, multiply local Jacobians, sum at merge points, deposit ∂L/∂θ into each parameter\'s .grad, then free the graph. optimizer.step() applies the update rule (SGD: θ −= lr·grad; Adam rescales per-parameter first) using those .grad fields. Two details that show depth: the stored activations between forward and backward are the memory cost of training, and CrossEntropyLoss takes raw logits because it fuses log-softmax with NLL for the stable p−y gradient.'
    },
    {
      q: 'How would you verify a hand-implemented backward pass is correct?',
      a: 'Gradient checking: compare the analytic gradient against the central finite difference (L(θ+ε) − L(θ−ε))/2ε per checked parameter, with ε around 1e-5 — central differences kill the first-order truncation error. Practical protocol: use float64 (float32 round-off can exceed the tolerance), test a handful of parameters on a tiny random input rather than everything, compare with RELATIVE error |a−n|/(|a|+|n|) below ~1e-6–1e-4, and disable nondeterminism (dropout) during the check. Also test edge regimes — e.g. ReLU near 0, saturated sigmoids — where local-derivative bugs hide. This is exactly what torch.autograd.gradcheck automates for custom autograd Functions, and it\'s cheap insurance: the numerical value is definitionally correct, just too slow to train with (two forward passes per parameter).'
    }
  ]
};
