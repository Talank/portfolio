window.LESSONS = window.LESSONS || {};
window.LESSONS['calculus-gradients'] = {
  id: 'calculus-gradients',
  title: 'Calculus for ML: Derivatives, Chain Rule & Gradient Descent',
  category: 'Part 1 — Math Prerequisites',
  timeMin: 55,
  summary: 'Training = "nudge the numbers to be less wrong". This lesson is the math of the nudge: what a derivative is, how the chain rule lets us differentiate huge nested functions, and how gradient descent turns slopes into learning. Every optimizer, every .backward(), every fine-tune is this page.',
  goals: [
    'Explain a derivative as local slope / sensitivity, and compute simple ones by hand and numerically.',
    'Use the chain rule on nested functions — and explain why it makes training billion-parameter models possible.',
    'Define the gradient of a multivariable function and why stepping against it decreases the function fastest.',
    'Implement gradient descent, and diagnose learning-rate-too-big vs too-small from behavior.',
  ],
  concept: [
    {
      h: 'A derivative is a sensitivity dial',
      p: [
        'The <b>derivative</b> of f at a point answers one question: <i>if I nudge the input a tiny bit, how much does the output move?</i>',
        '<div class="math">f′(w) = lim<sub>h→0</sub> [f(w+h) − f(w)] / h<span class="mnote">"rise over run", taken at a single point</span></div>',
        'f′(w) = 6 means: increase w by a tiny ε and f increases by about 6ε. Negative derivative: output moves opposite to input. Zero: locally flat — you\'re at a valley bottom, hilltop, or plateau.',
        'The handful of rules you need (and can verify from the definition once): power rule d(wⁿ)/dw = n·wⁿ⁻¹; constants ride along d(c·f) = c·f′; sums split d(f+g) = f′+g′; and e^w, ln w have derivatives e^w and 1/w. That plus the chain rule below covers essentially all of deep learning.',
        'In ML the function we differentiate is always the <b>loss</b>: L(w) = "how wrong is the model when its parameter is w". The derivative dL/dw tells us how the wrongness responds to each parameter — which is exactly what we need to know to fix it.',
      ],
    },
    {
      h: 'The chain rule: derivatives of nested functions',
      p: [
        'Models are nested functions: prediction = layer3(layer2(layer1(x))), and loss wraps around all of it. The <b>chain rule</b> says the sensitivity of a composition is the <i>product</i> of the sensitivities of its stages:',
        '<div class="math">if y = f(g(w)): &nbsp; dy/dw = f′(g(w)) · g′(w)<span class="mnote">outer slope (evaluated at the inner value) × inner slope</span></div>',
        'Worked, slowly. L(w) = (3w − 6)². Let u = 3w − 6 (inner), L = u² (outer). Then dL/du = 2u and du/dw = 3, so dL/dw = 2u·3 = 6(3w − 6). At w = 1: dL/dw = −18 → the loss falls if we increase w. At w = 2: 0 → we\'re at the bottom (indeed 3·2−6 = 0, perfect).',
        'Why this rule is <i>the</i> enabler of deep learning: a 100-layer network is a 100-deep composition. The chain rule turns "differentiate this monster" into "multiply 100 local slopes" — each cheap, each local. <b>Backpropagation (Part 3) is nothing but the chain rule, organized efficiently</b>: compute once forward, then sweep backward multiplying local derivatives. When PyTorch runs <code>loss.backward()</code>, it is executing this exact rule along the recorded graph of operations.',
      ],
    },
    {
      h: 'Many parameters: partial derivatives and the gradient',
      p: [
        'Real losses depend on millions of parameters: L(w₁, w₂, …, wₙ). The <b>partial derivative</b> ∂L/∂wᵢ is the ordinary derivative with respect to wᵢ while holding the others still. Collect them all into a vector and you have the <b>gradient</b>:',
        '<div class="math">∇L = [∂L/∂w₁, ∂L/∂w₂, …, ∂L/∂wₙ]</div>',
        'Two facts make this vector the hero of ML. First, it points in the direction of <b>steepest increase</b> of L (sketch of why: moving a tiny unit step in direction d changes L by ∇L·d — a dot product! — which is maximized when d aligns with ∇L, by last lesson\'s cos θ). Second, therefore, <b>−∇L is the direction of steepest decrease</b>: the best local direction to reduce wrongness.',
        'Note the beautiful economy: the gradient of a billion-parameter model is just a billion ordinary one-variable derivatives, each computed by the chain rule, all bundled into one vector.',
      ],
    },
    {
      h: 'Gradient descent: follow the slope downhill',
      p: [
        'The algorithm that trains (almost) everything:',
        '<div class="math">w ← w − η · ∇L(w)<span class="mnote">η ("eta") = the <b>learning rate</b> — step size</span></div>',
        'Repeat until the loss stops improving. That\'s it. Linear regression, GPT pretraining, LoRA fine-tuning, RLHF — all are this loop with different L and different tricks for computing ∇L fast.',
        'The learning rate is the knob you will tune most in your career, and its failure modes are visceral: <b>η too small</b> → crawling; thousands of steps to cross a valley (and possibly stuck in a flat region forever). <b>η too big</b> → each step overshoots the valley floor and lands higher on the opposite wall; the loss oscillates or blows up to NaN. The Goldilocks zone is found empirically (and modern optimizers like Adam auto-scale per-parameter steps — Part 3).',
        'One honest caveat: gradient descent only sees local slope, so it finds a <i>local</i> minimum. For deep nets this turns out to be mostly fine (high-dimensional loss surfaces have huge families of good-enough minima), but the vocabulary — local minimum, saddle point, plateau — is interview-standard, so own it.',
      ],
    },
  ],
  story: {
    onePiece: {
      title: 'Chopper\'s blizzard descent of the Drum Rockies',
      text: [
        'Drum Island. Nami burns with fever; the doctor is at the bottom of the mountain range; and a whiteout blizzard has erased all visibility. Chopper — carrying her — cannot see the path, the valley, or even three steps ahead. What he CAN do, through his hooves, is <b>feel the slope directly under him</b>: which direction tilts down, and how steeply.',
        'His strategy is gradient descent, exactly: at each stop, sense the steepest downhill direction (−∇L), take a step that way, re-feel, repeat. He never needs the whole map of the mountains (the full loss landscape is invisible and irrelevant); local slope information, used repeatedly, is enough to reach the bottom.',
        'And step size is life-or-death: on a gentle snowfield he bounds ahead in Heavy Point — big steps, fast progress. Nearing a ravine edge where the ground plunges, big bounds would launch him past the safe floor and into the far wall — <i>overshoot</i> — so he shrinks to Brain Point and inches: small learning rate where the landscape is treacherous. Freeze in place too long taking timid steps, though, and Nami\'s fever wins: too small a learning rate is ALSO fatal. Every training run you ever babysit is Chopper in that blizzard.',
      ],
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s spot vs gradient descent: why brute force doesn\'t scale',
      text: [
        'How did Sheldon find his perfect spot? He evaluated the loss function everywhere: sat in every seat, in summer and winter, measured drafts, TV glare angle, conversational reach — an exhaustive grid search over the living room, then picked the global optimum. Gloriously rigorous… and only possible because the room has about six candidate positions.',
        'Now give Sheldon a "room" with 7 billion coordinates — one per model parameter — where each "sit" (loss evaluation) costs a GPU-second. Exhaustive search dies instantly: even 2 candidate values per parameter is 2^7,000,000,000 seats. Gradient descent is the escape: instead of trying seats, the chain rule tells you, from ONE evaluation, which way every single coordinate should move at once. That is why calculus, not diligence, trains models — and why even Sheldon would concede the spot must be found by slope, not census.',
      ],
    },
    why: 'Chopper gives you the full algorithm as a body-memory: local slope felt underfoot (gradient), stepping downhill (update rule), Heavy Point vs Brain Point (learning rate trade-off), blizzard (you never see the whole landscape). Sheldon\'s spot marks the boundary: exhaustive evaluation works for six seats, never for billions of parameters.',
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 's1', emoji: '🏔️', label: 'L = 81', x: 8, y: 18 },
      { id: 's2', emoji: '⛰️', label: 'L = 36', x: 26, y: 34 },
      { id: 's3', emoji: '🗻', label: 'L = 9', x: 44, y: 52 },
      { id: 's4', emoji: '🌲', label: 'L = 1', x: 62, y: 68 },
      { id: 'valley', emoji: '🏥', label: 'doctor: L = 0', x: 80, y: 82 },
      { id: 'cliff', emoji: '⚠️', label: 'far wall', x: 95, y: 40 },
    ],
    actors: [
      { id: 'chopper', emoji: '🦌', label: 'Chopper (w)', x: 8, y: 10 },
    ],
    steps: [
      { c: 'Whiteout. Chopper can\'t see the valley — only feel the slope underfoot. Loss = altitude; his position = the parameter w.', p: { s1: 'lit' } },
      { c: 'Feel the tilt (compute ∇L), step the steepest downhill way (w ← w − η∇L). Altitude 81 → 36.', a: { chopper: [26, 26] }, p: { s1: 'dim', s2: 'lit' } },
      { c: 'Slope is still steep, steps stay big — notice the gradient itself shrinks as the ground flattens. 36 → 9.', a: { chopper: [44, 44] }, p: { s2: 'dim', s3: 'lit' } },
      { c: 'Heavy Point here would overshoot: one huge bound flies PAST the clinic and up the far wall. Loss goes UP. That\'s η too large.', a: { chopper: [95, 32] }, p: { cliff: 'bad' } },
      { c: 'Brain Point: shrink the step near the bottom. 9 → 1 → …', a: { chopper: [62, 60] }, p: { cliff: '', s4: 'lit' } },
      { c: 'Gradient ≈ 0: flat ground — the valley floor. Doctor reached; fever treated; convergence declared. 🏴‍☠️', a: { chopper: [80, 74] }, p: { s4: 'dim', valley: 'good' } },
    ],
  },
  conceptFlow: {
    title: 'One gradient descent loop, watched closely',
    intro: 'Same L(w) = (3w−6)² and learning rate as the code section.',
    stages: [
      { label: 'Start', nodes: [
        { id: 'w0', text: 'w = 0\nL(0) = 36' },
      ]},
      { label: 'Sense', nodes: [
        { id: 'grad', text: 'dL/dw = 6(3w−6)\nat w=0: −36' },
      ]},
      { label: 'Step', nodes: [
        { id: 'update', text: 'w ← w − η·∇L\nw = 0 − 0.05·(−36) = 1.8' },
      ]},
      { label: 'Repeat', nodes: [
        { id: 'converge', text: 'Repeat\nw → 2.0, L → 0' },
      ]},
    ],
    steps: [
      { active: ['w0'], note: 'Start at w = 0. L(0) = 36 — far from the minimum.' },
      { active: ['grad'], note: 'Compute the slope via the chain rule: dL/dw = 6(3w−6). At w=0 that\'s −36 — steeply downhill.' },
      { active: ['update'], note: 'Step against the slope: w ← w − η·∇L. With η=0.05, w jumps from 0 to 1.8.' },
      { active: ['converge'], note: 'Repeat. Each step the slope shrinks as the ground flattens — w glides smoothly toward 2.0, where L=0 and the gradient hits zero.' },
    ],
  },
  tech: [
    {
      q: 'How does the computer get derivatives — does PyTorch do algebra like I do on paper?',
      a: [
        'Three ways exist. <b>Symbolic</b> (do algebra, like Mathematica): exact but formulas explode for big compositions. <b>Numerical</b> (nudge and re-evaluate: [f(w+h)−f(w)]/h): trivially easy — you\'ll use it in the lab as a checker — but needs one full extra evaluation <i>per parameter</i> (a billion forward passes for one gradient!) and suffers rounding errors. <b>Automatic differentiation</b> (what PyTorch does): during the forward pass, record every primitive operation on a "tape"; every primitive knows its own local derivative; then sweep the tape backward multiplying local derivatives per the chain rule. Exact like symbolic, cheap like one extra pass — the entire gradient of a billion parameters costs roughly 2× one forward pass. That absurd efficiency is why deep learning is possible at all.',
      ],
    },
    {
      q: 'Why does the gradient point uphill — where does that come from?',
      a: 'Move from w a tiny step in unit direction d. First-order Taylor: L(w + εd) ≈ L(w) + ε(∇L·d). The change is a dot product, and from the vectors lesson, ∇L·d = ‖∇L‖cos θ is maximized when d points along ∇L (cos θ = 1) and minimized when d points against it (cos θ = −1). So "gradient = steepest ascent, minus gradient = steepest descent" isn\'t a definition — it\'s the dot product doing its aligned-vectors-score-highest thing. Two lessons in and the pieces already interlock.',
    },
    {
      q: 'What are saddle points and plateaus, and why do people say local minima aren\'t the real problem in deep learning?',
      a: 'A saddle point is flat (∇L = 0) but not a minimum — downhill in some directions, uphill in others, like the center of a Pringle. A plateau is a wide, nearly-flat region where gradients are tiny and progress crawls. In very high dimensions, being a true local minimum requires the surface to curve upward in ALL million directions at once — combinatorially rare — so most zero-gradient points are saddles, and empirically the minima that exist tend to be similarly good. The practical enemies are saddles/plateaus (slow escape) and ill-conditioned ravines (steep one way, flat another), which is what momentum and Adam (Part 3) are engineered against.',
    },
    {
      q: 'Why do we minimize "loss" instead of maximizing "accuracy" directly?',
      a: 'Gradient descent needs slopes, and accuracy has none: it\'s a step function (count of correct predictions) that stays constant under tiny weight changes, then jumps — derivative zero almost everywhere, undefined at the jumps. Loss functions (squared error, cross-entropy) are smooth surrogates that (a) decrease when predictions improve even slightly, giving a usable gradient everywhere, and (b) are designed so their minimum coincides with good accuracy. This surrogate trick — optimize a differentiable stand-in for the thing you actually want — is one of ML\'s deepest recurring patterns (you\'ll see it again in RLHF).',
    },
  ],
  code: {
    title: 'Worked example — gradient descent, watched closely',
    intro: 'Minimize L(w) = (3w − 6)² three ways: by-hand derivative, gradient descent that converges, and gradient descent that explodes. Read the printed trajectories — the numbers tell the whole story.',
    code: `# L(w) = (3w - 6)^2 : perfect when w = 2 (then 3w = 6 exactly)
def L(w):  return (3*w - 6)**2
def dL(w): return 2*(3*w - 6)*3        # chain rule: outer 2u * inner 3

# --- healthy learning rate ---
w, lr = 0.0, 0.05
for step in range(8):
    w = w - lr * dL(w)
    print(f"step {step}: w={w:.4f}  L={L(w):.4f}")
# w: 1.8 -> 1.98 -> 1.998 -> ... smooth glide into 2.0

# --- learning rate too big ---
w, lr = 0.0, 0.12
for step in range(8):
    w = w - lr * dL(w)
    print(f"step {step}: w={w:.2f}  L={L(w):.1f}")
# w: 4.32 -> -0.67 -> 5.06 -> ... each step overshoots farther: divergence

# --- numerical gradient: the universal checker ---
def numgrad(f, w, h=1e-6):
    return (f(w + h) - f(w - h)) / (2 * h)      # "central difference"
print(dL(1.0), numgrad(L, 1.0))   # -18.0 vs -18.000000... they agree`,
    notes: [
      'The divergence isn\'t random: for this quadratic, each step multiplies the error (w−2) by |1 − 18·lr|. lr = 0.05 → factor 0.1 (fast shrink); lr = 0.12 → factor 1.16 (growth). Stability has an exact threshold — here lr < 1/9.',
      '<code>numgrad</code> (central difference) is the standard sanity-checker for hand-written derivatives — pros use it to unit-test custom layers. Its cost per parameter is why it can\'t replace autodiff for training.',
      'Watch the gradient shrink as w nears 2: gradient descent naturally decelerates near a minimum — Chopper\'s steps shorten as the ground flattens, even at fixed η.',
    ],
  },
  lab: {
    title: 'Lab: implement gradient descent + a numerical gradient checker',
    prompt: 'Implement (1) <code>numerical_gradient(f, w, h=1e-6)</code> using the central difference, and (2) <code>gradient_descent(f, w0, lr, steps)</code> that minimizes a 1-parameter function using YOUR numerical gradient each step, returning the final w. The tests descend Chopper\'s mountain and check you land at the clinic — then verify you can diagnose a bad learning rate.',
    starter: `def numerical_gradient(f, w, h=1e-6):
    # central difference: (f(w+h) - f(w-h)) / (2h)
    pass

def gradient_descent(f, w0, lr, steps):
    w = w0
    # loop for the given number of steps: w <- w - lr * numerical_gradient(f, w)
    pass
`,
    checks: [
      { re: 'def\\s+numerical_gradient', must: true, hint: 'Define numerical_gradient(f, w, h=1e-6).' },
      { re: 'def\\s+gradient_descent', must: true, hint: 'Define gradient_descent(f, w0, lr, steps).' },
      { re: '2\\s*\\*\\s*h', must: true, hint: 'Central difference divides by 2h (more accurate than forward difference).' },
      { re: '-\\s*lr\\s*\\*', must: true, hint: 'The update must SUBTRACT lr * gradient — descend, not ascend.' },
    ],
    tests: `L = lambda w: (3*w - 6)**2
g = numerical_gradient(L, 1.0)
assert abs(g - (-18.0)) < 1e-3, f"dL/dw at w=1 should be -18, got {g}"
w_final = gradient_descent(L, w0=0.0, lr=0.05, steps=100)
assert abs(w_final - 2.0) < 1e-4, f"should converge to 2.0, got {w_final}"
# a different valley: minimum of (w-5)^2 + 1 is at w=5
w2 = gradient_descent(lambda w: (w-5)**2 + 1, w0=-3.0, lr=0.1, steps=200)
assert abs(w2 - 5.0) < 1e-3, f"should find w=5, got {w2}"
# diagnose: lr way too big must NOT converge (Chopper overshoots the ravine)
w3 = gradient_descent(L, w0=0.0, lr=0.5, steps=25)
assert abs(w3 - 2.0) > 1.0, f"lr=0.5 should diverge/oscillate, got {w3}"
print("Blizzard descended. You now own the loop that trains every model on Earth.")`,
    solution: `def numerical_gradient(f, w, h=1e-6):
    return (f(w + h) - f(w - h)) / (2 * h)

def gradient_descent(f, w0, lr, steps):
    w = w0
    for _ in range(steps):
        w = w - lr * numerical_gradient(f, w)
    return w`,
    notes: [
      'Your optimizer never saw a formula for f — only slope queries. That black-box property is exactly why one loop trains regressions, CNNs and LLMs alike.',
      'In real training the only change is scale: ∇ comes from autodiff over millions of parameters at once, and each step uses a mini-batch estimate of L (Part 3).',
    ],
  },
  quiz: [
    {
      q: 'L(w) = (2w + 1)². dL/dw by the chain rule is…',
      options: ['2(2w+1)', '4(2w+1)', '2w+1', '4w'],
      correct: 1,
      explain: 'Outer u² → 2u, inner 2w+1 → 2. Product: 2(2w+1)·2 = 4(2w+1). Forgetting the inner factor is THE classic chain-rule slip.',
    },
    {
      q: 'The gradient ∇L at a point tells you…',
      options: [
        'the location of the global minimum',
        'the direction of steepest local increase (so −∇L is steepest decrease)',
        'the average slope over the whole landscape',
        'whether the model has converged for all inputs',
      ],
      correct: 1,
      explain: 'Purely local information — Chopper\'s hooves, not a map. That locality is both the efficiency (cheap to compute) and the limitation (local minima/saddles).',
    },
    {
      q: 'Your training loss oscillates wildly and then becomes NaN. Most likely fix?',
      options: ['More layers', 'Lower the learning rate', 'Raise the learning rate', 'More training data'],
      correct: 1,
      explain: 'Oscillate-then-explode is the textbook signature of overshooting: each step lands higher on the opposite wall. Lower η (and/or clip gradients). Recognizing this from a loss curve is a real interview question.',
    },
    {
      q: 'Why can\'t we train by maximizing accuracy directly with gradient descent?',
      options: [
        'Accuracy is too expensive to compute',
        'Accuracy is a step function: zero gradient almost everywhere, so no slope to follow',
        'Accuracy only works for regression',
        'We can and we do',
      ],
      correct: 1,
      explain: 'Tiny weight changes almost never flip a prediction, so accuracy is flat — no signal. We minimize a smooth surrogate (cross-entropy) whose gradients point toward better accuracy.',
    },
    {
      q: 'Numerical differentiation is not used to train big models because…',
      options: [
        'it is inexact',
        'it needs ~one extra forward pass per parameter — billions of passes per single update',
        'it only works for quadratics',
        'GPUs cannot do subtraction',
      ],
      correct: 1,
      explain: 'Cost, primarily. Autodiff gets the ENTIRE gradient for ~2× one forward pass, regardless of parameter count. (Accuracy is also worse numerically, but cost is the killer.)',
    },
  ],
  testFlow: {
    title: 'Test yourself: derivatives & gradient descent',
    start: 'q1',
    nodes: {
      q1: { qid: 'q1', q: 'L(w) = (2w + 1)². By the chain rule, dL/dw is...', choices: [
        { text: '2(2w+1)', to: 'q1_wrong_inner' },
        { text: '4(2w+1)', to: 'q1_right' },
        { text: '4w', to: 'q1_wrong_expand' },
      ]},
      q1_right: { end: true, correct: true, text: 'Right. Outer u² → 2u, inner (2w+1) → 2 — multiply: 2(2w+1)·2 = 4(2w+1).', next: 'q2' },
      q1_wrong_inner: { end: true, correct: false, text: 'You differentiated the outer function (u² → 2u) but dropped the inner factor — the derivative of (2w+1) itself, which is 2. The chain rule needs BOTH factors multiplied together.', retry: 'q1' },
      q1_wrong_expand: { end: true, correct: false, text: 'That drops the constant entirely. Apply the chain rule directly: outer slope 2u times inner slope 2, evaluated with u=2w+1, giving 4(2w+1) — not a simplified 4w.', retry: 'q1' },
      q2: { qid: 'q2', q: 'Your training loss oscillates wildly for a few steps, then becomes NaN. Most likely fix?', choices: [
        { text: 'Add more layers', to: 'q2_wrong_layers' },
        { text: 'Lower the learning rate', to: 'q2_right' },
        { text: 'Raise the learning rate', to: 'q2_wrong_raise' },
      ]},
      q2_right: { end: true, correct: true, text: 'Right — oscillate-then-explode is the textbook signature of overshooting: each step lands higher on the opposite wall of the valley. Lowering η (and/or clipping gradients) is the standard fix.', next: 'q3' },
      q2_wrong_layers: { end: true, correct: false, text: 'More layers doesn\'t address the actual failure — the STEP SIZE is too large relative to the loss curvature, causing each update to overshoot. Adding capacity doesn\'t fix an overshooting optimizer.', retry: 'q2' },
      q2_wrong_raise: { end: true, correct: false, text: 'That would make an overshooting problem worse, not better — bigger steps overshoot the valley floor even further, accelerating toward NaN.', retry: 'q2' },
      q3: { qid: 'q3', q: 'Why can\'t you train a classifier by directly maximizing accuracy with gradient descent?', choices: [
        { text: 'Accuracy is too expensive to compute', to: 'q3_wrong_cost' },
        { text: 'Accuracy is a step function — its gradient is zero almost everywhere, so there\'s no slope to follow', to: 'q3_right' },
        { text: 'Accuracy only makes sense for regression problems', to: 'q3_wrong_regression' },
      ]},
      q3_right: { end: true, correct: true, text: 'Right. Tiny weight nudges almost never flip a prediction, so accuracy stays flat with an occasional jump — zero gradient nearly everywhere. We minimize a smooth surrogate (cross-entropy) instead, whose gradient actually points toward better accuracy.' },
      q3_wrong_cost: { end: true, correct: false, text: 'Cost isn\'t the issue — accuracy is cheap to compute. The real problem is that it provides no usable GRADIENT: it\'s flat almost everywhere, so gradient descent has nothing to follow.', retry: 'q3' },
      q3_wrong_regression: { end: true, correct: false, text: 'Accuracy is specifically a CLASSIFICATION metric, not a regression one — the issue isn\'t which task type, it\'s that accuracy\'s step-function shape has no usable slope for gradient descent to follow.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Dropping the inner-function factor in the chain rule — d(3w−6)²/dw = 6(3w−6), not 2(3w−6). Verify with <code>numerical_gradient</code> whenever unsure; that habit scales to checking custom PyTorch layers.',
    'Tuning learning rate by vibes alone. Learn the signatures: loss NaN/oscillating → too big; loss creeping linearly → too small; loss down-then-flat early → fine, maybe decay it later.',
    'Believing gradient descent finds THE minimum. It finds A stationary point; deep learning lives with (and is empirically fine with) that.',
    'Confusing "gradient is zero" with "we\'re done": saddle points and plateaus also have zero gradient. Check the loss value, not just the gradient norm.',
  ],
  interview: [
    {
      q: 'Explain gradient descent to a junior engineer, including what the learning rate does.',
      a: 'A model\'s loss measures how wrong it is as a function of its parameters — picture altitude over a landscape whose coordinates are the parameters. The gradient at the current position is the local steepest-uphill direction, computed by calculus; gradient descent repeatedly steps the opposite way: w ← w − η∇L. The learning rate η is the step size: too small and training crawls or stalls on plateaus; too large and each step overshoots the valley, so the loss oscillates or explodes to NaN. In practice we use mini-batch estimates of the gradient (SGD), adaptive per-parameter step sizes (Adam), and schedules that shrink η as training progresses — refinements, but the core loop is exactly this.',
    },
    {
      q: 'What is the chain rule and why is it central to deep learning?',
      a: 'For nested functions, the derivative of the composition is the product of the local derivatives: d/dw f(g(w)) = f′(g(w))·g′(w). A neural network is a deep composition — layers inside layers inside a loss — so the chain rule decomposes "how does the loss respond to a weight in layer 3?" into a product of simple local slopes along the path from that weight to the loss. Backpropagation is the chain rule organized as one backward sweep that reuses shared subproducts, so the full gradient of millions of parameters costs about as much as two forward passes. Without this, gradients would be computationally unreachable and none of modern AI trains.',
    },
    {
      q: 'Your model\'s loss plateaus early in training. Walk me through your diagnosis.',
      a: 'Ordered checklist: (1) learning rate — too low crawls, but too HIGH can also flatline by bouncing around a basin; try a quick LR sweep or a warmup+decay schedule. (2) Data/labels — shuffled labels, broken preprocessing, or all-one-class batches make the best achievable loss high; verify the model can overfit a tiny subset (a 50-sample sanity test should reach ~zero loss — if not, the bug is in code, not hyperparameters). (3) Initialization/architecture — vanishing gradients from bad init or missing normalization; check gradient norms per layer. (4) Optimization — plateau/saddle, so try momentum/Adam if not already. The overfit-a-tiny-batch test is the single highest-value move: it cleanly splits "broken pipeline" from "hard optimization".',
    },
    {
      q: 'Why does gradient descent use the negative gradient rather than some other downhill direction?',
      a: 'To first order, moving unit step d changes the loss by ∇L·d, and that dot product is minimized when d = −∇L/‖∇L‖ — so the negative gradient is the locally fastest descent per unit of step length. Any other downhill direction works but wastes some step budget. That said, "steepest per unit Euclidean length" isn\'t always smartest globally: in ravine-shaped losses, plain steepest descent zigzags, which is exactly what momentum (damps oscillation) and Adam/second-order methods (rescale directions by curvature/variance) improve on. Framing it as a first-order Taylor + dot-product argument usually reads as a strong answer.',
    },
  ],
};
