window.LESSONS = window.LESSONS || {};
window.LESSONS['training-neural-nets'] = {
  id: 'training-neural-nets',
  title: 'Training Dynamics: Optimizers, Batches, Dropout & BatchNorm',
  category: 'Part 3 — Deep Learning',
  timeMin: 50,
  summary: 'Backprop gives you gradients; this lesson is about using them well. Mini-batches trade noise for speed, the learning rate makes or breaks everything, momentum and Adam power through ravines, and dropout/weight-decay/normalization keep big networks from memorizing. These knobs are 90% of the day-to-day craft of deep learning — and of its interview questions.',
  goals: [
    'Choose between batch, stochastic, and mini-batch gradient descent, and define epoch/step/batch precisely',
    'Explain why the learning rate is the single most important hyperparameter, including the divergence math',
    'Describe momentum and Adam as running averages that fix specific geometric pathologies',
    'Explain dropout (why co-adaptation is bad, what changes between train and eval) and weight decay',
    'Say what BatchNorm/LayerNorm normalize, why they help, and why transformers use LayerNorm'
  ],
  concept: [
    {
      h: 'Mini-batches: how much data per step?',
      p: [
        'The true loss is an average over ALL training examples, so the true gradient is too — but computing it means a full pass over the dataset for ONE update (<b>batch gradient descent</b>: accurate, glacial). The opposite extreme updates after every single example (<b>stochastic gradient descent</b>: fast, but each gradient is a wild guess). The industry standard is the compromise: <b>mini-batches</b> of 32–1024 examples — small enough for thousands of updates per pass, large enough that the averaged gradient points roughly the right way, and sized to saturate GPU matrix-multiply throughput (batching is literally the matrix-matrix product from the neural-networks lesson).',
        'Vocabulary you must have cold: a <b>step</b> = one parameter update from one mini-batch; an <b>epoch</b> = one full pass over the training set (steps per epoch = N/batch_size); batches are re-shuffled every epoch so the noise stays unbiased.',
        'The noise is not just tolerable — it helps. A noisy gradient jiggles the trajectory out of sharp little minima and saddle points that would trap exact descent, and empirically the flat minima that noisy SGD prefers generalize better. This is why "just use a bigger batch" is not free: giant batches converge to sharper minima and often generalize slightly worse unless you retune the learning rate.'
      ]
    },
    {
      h: 'The learning rate: the knob that decides everything',
      p: [
        'You met η in Part 1: too small crawls, too large diverges. Now the precise version. On a quadratic valley L = ½aw², gradient descent multiplies the error by (1 − ηa) each step: it converges only if |1 − ηa| < 1, i.e. η < 2/a. The catch: a multi-dimensional loss has a DIFFERENT curvature a per direction, and one η must serve them all. A "ravine" — steep side walls (big a), gentle floor (small a) — forces η small enough for the walls, which makes progress along the floor microscopic. The optimizer zigzags across the ravine while barely advancing along it. Hold that picture; momentum and Adam are both cures for it.',
        'In practice the learning rate is also scheduled: start with <b>warmup</b> (ramp η from ~0 over the first few hundred steps, so early violent gradients on random weights don\'t wreck the model), then <b>decay</b> it (cosine decay is the modern default) so late training takes fine steps. "Linear warmup + cosine decay" is, almost word for word, the schedule used to train GPT-class models — you will meet it again verbatim in Part 6.',
        'Rules of thumb worth carrying: when the loss explodes or NaNs → η too big (cut 10×). Loss falls painfully slowly → try 10× bigger. Typical starting points: 1e-3 for Adam, 1e-1..1e-2 for SGD+momentum. And η interacts with batch size — bigger batches (less noise) tolerate and usually need bigger η.'
      ]
    },
    {
      h: 'Momentum: a heavy ball instead of a cautious hiker',
      p: [
        'Replace "step along today\'s gradient" with "maintain a velocity that gradients push on":',
        '<div class="math">v ← β·v + ∇L(w)&nbsp;&nbsp;&nbsp;&nbsp;w ← w − η·v<span class="mnote">β ≈ 0.9: today\'s velocity keeps ~90% of yesterday\'s. v is an exponential moving average of recent gradients.</span></div>',
        'In the ravine, the across-the-valley components alternate sign, so they CANCEL in the running average — while the along-the-floor components all agree, so they ACCUMULATE (up to 1/(1−β) = 10× the single-step push). The ball damps the zigzag and barrels down the valley. Physical intuition: the Thousand Sunny doesn\'t jitter with every wave; its mass averages the chop while the steady current carries it forward.'
      ]
    },
    {
      h: 'Adam: momentum plus a per-parameter ruler',
      p: [
        'Different parameters can live at wildly different scales — an embedding for a rare word gets huge-but-rare gradients; a bias gets small steady ones. One global η can\'t suit both. Adam keeps TWO running averages per parameter: m (mean of gradients — momentum) and s (mean of squared gradients — a scale estimate), and divides:',
        '<div class="math">m ← β₁m + (1−β₁)g&nbsp;&nbsp;&nbsp;s ← β₂s + (1−β₂)g²&nbsp;&nbsp;&nbsp;w ← w − η · m̂ / (√ŝ + ε)<span class="mnote">β₁=0.9, β₂=0.999, ε≈1e-8. m̂, ŝ are bias-corrected (divide by 1−βᵗ) so early steps aren\'t shrunk by the zero-initialized averages.</span></div>',
        'Dividing by √ŝ normalizes each parameter\'s step to its own gradient scale — rarely-updated parameters take proportionally bigger steps, screaming ones get damped. The result is the forgiving default that works with η = 1e-3 on almost anything, which is why Adam (in its <b>AdamW</b> form — same thing with weight decay applied correctly, decoupled from the gradient) trains essentially every transformer and LLM you\'ve heard of. Cost: two extra floats per parameter — for a 7B-parameter model, that\'s ~56 GB of optimizer state in float32, a number that will matter a lot in the fine-tuning lesson.',
        'When NOT Adam: plain SGD+momentum, carefully tuned, still matches or beats it on many vision tasks and is cheaper. Honest interview line: "Adam to get anything working fast; SGD+momentum when I have budget to tune and want the last drop of generalization."'
      ]
    },
    {
      h: 'Regularization: dropout, weight decay, early stopping',
      p: [
        'Big networks can memorize the training set (Part 2\'s overfitting, now with millions of parameters). Three standard brakes:',
        '<b>Dropout</b>: during training, independently zero each neuron\'s output with probability p (commonly 0.1–0.5) — a different random subset every step. Why it works: neurons can no longer <em>co-adapt</em> — build fragile pacts where one unit\'s quirk compensates another\'s, since any partner might vanish tonight. Each unit must carry independently useful signal; the network becomes an implicit ensemble of thinned sub-networks. At evaluation, dropout turns OFF and (in the standard "inverted dropout") activations were already scaled by 1/(1−p) during training so no test-time correction is needed. This train/eval difference is precisely why PyTorch makes you call model.train() and model.eval() — forgetting eval() before validation is a classic bug (your "validation" runs with neurons randomly missing).',
        '<b>Weight decay</b>: L2 regularization — add λ‖w‖² to the loss, equivalently shrink every weight slightly each step (w ← (1−ηλ)w before the gradient update). Same "keep the model simple" pressure as ridge regression in Part 2. In Adam, use AdamW, which applies the decay directly to weights instead of through the adaptive gradient (the original Adam+L2 coupling was subtly wrong — a known interview nugget).',
        '<b>Early stopping</b>: watch validation loss each epoch and stop (or restore the best checkpoint) when it starts rising while training loss keeps falling — the overfitting signature from Part 2, used as a brake. Free, effective, and universal.'
      ]
    },
    {
      h: 'BatchNorm & LayerNorm: keeping the signal in a healthy range',
      p: [
        'As training updates layer 1, the input DISTRIBUTION seen by layer 2 keeps shifting — every layer is chasing a moving target, and activations can drift into saturation or blow up. Normalization layers re-standardize between layers: subtract a mean, divide by a standard deviation, then re-scale with two learned parameters γ, β (so the network keeps its expressive freedom):',
        '<div class="math">x̂ = (x − μ) / √(σ² + ε)&nbsp;&nbsp;&nbsp;&nbsp;out = γ·x̂ + β<span class="mnote">The difference between the variants is only WHERE μ, σ are computed: BatchNorm — across the batch, per feature. LayerNorm — across the features, per example.</span></div>',
        '<b>BatchNorm</b> (CNN-era standard) computes μ, σ across the mini-batch for each channel. It smooths the loss landscape, permits much larger learning rates, and mildly regularizes (batch statistics are noisy). Costs: behavior depends on batch size (breaks with tiny batches), and at inference it must switch to running averages collected during training — another model.eval() responsibility.',
        '<b>LayerNorm</b> normalizes across the feature dimension of EACH example independently — no batch dependence at all, identical behavior train/test, works with batch size 1 and variable-length sequences. That independence is exactly why transformers use LayerNorm (or its lighter cousin RMSNorm, which skips the mean subtraction — used by Llama). When you see nn.LayerNorm in the transformer lesson, this is the whole story: keep every token\'s activation vector standardized so hundreds of layers of attention stay numerically tame.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The timeskip: two years of training hyperparameters',
      text: 'The crew\'s two-year timeskip is a masterclass in training dynamics. Start with Luffy and Rayleigh on Rusukaina. Rayleigh does NOT make Luffy fight every beast on the island before giving feedback (batch gradient descent: one perfectly-informed lesson per month — far too slow), nor does he critique every single punch as it lands (pure stochastic: instant but hysterical feedback, half of it noise). He runs sparring ROUNDS — a dozen beasts, then a debrief (mini-batches: frequent updates, each averaged over enough encounters to point the right way). Early on, Rayleigh restrains Luffy\'s wilder corrections — a raw fighter overhauling his whole style after one lucky hit would wreck himself (warmup: small learning rate while the weights are still random chaos); as Luffy stabilizes, corrections get bolder, and in the final months Rayleigh dials them back down to fine polish (decay). Meanwhile Zoro, with Mihawk, invents dropout: he trains with one sword randomly taken away — some days no Wado, some days blindfolded off-balance. Why? Because his three-sword style had developed co-adaptations: technique A only worked because sword B compensated. Remove a random sword each session and every remaining skill is forced to stand on its own; two years later, ANY subset of his style works, and the full ensemble is devastating. And the ship itself teaches momentum: when Franky steers the Sunny through choppy water, he doesn\'t yank the rudder with every wave — the ship\'s mass carries a running average of recent pushes, so the wave-chop cancels itself while the steady current accumulates. Waves = mini-batch noise; the ship\'s momentum = β·v; the current = the true gradient. That\'s why the heavy ship outruns a rowboat in rough seas — and why momentum-SGD outruns plain SGD in every ravine.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Joey\'s co-adapted lines (and the dropout cure)',
      text: 'Joey learns a play by rehearsing exclusively with Rachel cueing him. It goes perfectly — until opening night, when the other actor delivers a line with different timing and Joey\'s entire performance collapses: his memory of each line depended on Rachel\'s exact intonation for the previous one. His skills had co-adapted — each unit worked only because a specific partner compensated. The fix the gang stumbles into is dropout: rehearse with a random person missing each night — Chandler reads badly, Phoebe improvises, Monica skips lines entirely. Joey can no longer lean on any specific partner, so each line has to be anchored to something robust (the scene\'s meaning). On the actual night — all partners present, no chaos (dropout off at eval time) — he\'s better than any single rehearsal ever was: an ensemble of all the "thinned" rehearsals at once. And Monica\'s restaurant kitchen adds the weight-decay coda: she keeps every station\'s mise-en-place deliberately minimal — any ingredient not earning its place gets shrunk out of the pantry — because a bloated pantry lets cooks build baroque dishes that only work on one lucky night.'
    },
    why: 'Each knob gets one image: Rayleigh\'s sparring rounds = mini-batches; restrained-then-bold-then-fine corrections = warmup + decay; the Sunny\'s mass averaging wave-chop = momentum canceling zigzag noise; Zoro\'s randomly-removed sword and Joey\'s randomly-missing scene partner = dropout killing co-adaptation (and both perform with everything ON at showtime = model.eval()). If an interviewer asks "why does dropout help?", tell them about Zoro\'s swords: no skill may depend on a partner that might be gone tomorrow.'
  },
  storyAnim: {
    title: 'The ravine: why momentum beats the cautious hiker',
    h: 250,
    props: [
      { id: 'wallTop', emoji: '⛰️', label: 'steep wall (big curvature)', x: 50, y: 8 },
      { id: 'wallBot', emoji: '⛰️', label: 'steep wall', x: 50, y: 88 },
      { id: 'floor', emoji: '🏁', label: 'minimum', x: 92, y: 48 },
      { id: 'meter', emoji: '📉', label: 'progress', x: 8, y: 88 }
    ],
    actors: [
      { id: 'hiker', emoji: '🥾', label: 'plain SGD', x: 8, y: 30 },
      { id: 'ship', emoji: '⛵', label: 'momentum', x: 8, y: 62 }
    ],
    steps: [
      { c: 'A ravine: brutally steep side walls, gently sloping floor toward the minimum at the right. One learning rate must survive BOTH curvatures.', p: { wallTop: 'dim', wallBot: 'dim' } },
      { c: 'Plain SGD: the wall gradient dominates every step, so the hiker bounces across the ravine — up, down, up, down — while inching right.', a: { hiker: [14, 66] } },
      { c: 'Bounce, bounce. The across-the-valley moves alternate direction and mostly undo each other. Almost all the step budget is wasted on zigzag.', a: { hiker: [20, 30] }, p: { meter: 'bad' }, l: { meter: 'progress: crawling' } },
      { c: 'Momentum keeps a velocity: each new gradient only nudges it. The alternating wall-pushes CANCEL inside the running average…', a: { ship: [30, 55] } },
      { c: '…while the always-rightward floor-pushes ACCUMULATE — up to 1/(1−β) ≈ 10× the single-step force. The ship barrels down the valley.', a: { ship: [60, 50] }, p: { meter: 'lit' }, l: { meter: 'momentum: cancel noise, add signal' } },
      { c: 'Momentum reaches the flag while SGD is still bouncing. Adam adds one more trick: a per-parameter ruler (÷√s̄) so steep walls and gentle floors each get a properly-sized step automatically.', a: { ship: [88, 48], hiker: [34, 60] }, p: { floor: 'good', meter: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'Racing the ravine: SGD vs momentum',
    intro: 'Same L(x,y) = x² + 10y² as the animation and the lab.',
    stages: [
      { label: 'The ravine', nodes: [
        { id: 'ravine', text: 'L(x,y)=x²+10y²\nsteep walls, gentle floor' },
      ]},
      { label: 'Plain SGD', nodes: [
        { id: 'sgd', text: 'Bounces wall to wall\nprogress: crawling' },
      ]},
      { label: 'Momentum', nodes: [
        { id: 'cancel', text: 'Cross-valley pushes CANCEL\nin the running average' },
      ]},
      { label: 'Result', nodes: [
        { id: 'accumulate', text: 'Along-valley pushes ACCUMULATE\nup to 10× faster' },
      ]},
    ],
    steps: [
      { active: ['ravine'], note: 'A ravine: brutally steep side walls, a gently sloping floor toward the minimum. One learning rate must survive both curvatures.' },
      { active: ['sgd'], note: 'Plain SGD: the wall gradient dominates every step — the hiker bounces up, down, up, down while barely inching toward the minimum.' },
      { active: ['cancel'], note: 'Momentum keeps a running velocity instead of reacting to each step alone. The alternating wall-pushes cancel inside that average.' },
      { active: ['accumulate'], note: 'The consistently-rightward floor-pushes accumulate instead — up to 1/(1−β) ≈ 10× the single-step force. The ship barrels down the valley while the hiker still bounces.' },
    ],
  },
  tech: [
    {
      q: 'What do model.train() and model.eval() actually switch, and what goes wrong if I forget?',
      a: 'They flip a boolean (self.training) on every submodule, and exactly two common layer types read it. Dropout: in train mode it zeroes activations with probability p and scales survivors by 1/(1−p); in eval mode it is the identity. BatchNorm: in train mode it normalizes with the CURRENT batch\'s statistics and updates running averages; in eval mode it uses the stored running averages. Forget eval() at validation → predictions are made with neurons randomly missing and batch-dependent normalization: metrics are noisy, worse, and irreproducible. Forget train() when resuming → dropout and BN silently off, model overfits faster and BN stats go stale. Neither affects gradients per se — that\'s torch.no_grad()\'s job, a separate and also-required wrapper for eval loops (it skips graph recording, saving memory and time).'
    },
    {
      q: 'Why does Adam need bias correction (the m̂ = m/(1−β₁ᵗ) step)?',
      a: 'm and s start at zero. After the first step, m = (1−β₁)g = 0.1g — an average that pretends nine phantom zero-gradients preceded the real one. Uncorrected, early steps would be ~10× too timid for m and ~1000× too timid for s (β₂=0.999), and their RATIO m/√s would be badly distorted precisely when the model most needs sane steps. Dividing by (1−βᵗ) rescales each average to be an unbiased estimate given only t observations; the correction factor decays to 1 within a few hundred steps and becomes irrelevant. It\'s two lines of code that make η = 1e-3 safe from step one — and "why does Adam have those (1−βᵗ) terms?" is a real interview question.'
    },
    {
      q: 'What\'s the difference between Adam and AdamW, and why does everyone use AdamW now?',
      a: 'Both want weight decay; they differ in where it enters. Classic Adam implements L2 by adding λw INTO the gradient — but Adam then divides that gradient by √s, so parameters with large gradient history get their decay shrunk: the regularization strength becomes accidentally coupled to gradient magnitudes, weakening it exactly where weights are most active. AdamW decouples: the update is w ← w − η(m̂/(√ŝ+ε)) − ηλw — decay applied directly to the weight, uniformly, outside the adaptive machinery (Loshchilov & Hutter, 2017). Empirically this trains better-generalizing models and makes λ tunable independently of η. Every modern transformer recipe — BERT, GPT, Llama — specifies AdamW; in PyTorch just use torch.optim.AdamW and know that its weight_decay actually does what it says, unlike Adam\'s.'
    },
    {
      q: 'How do I actually choose batch size, and what is gradient accumulation?',
      a: 'Start with the largest batch that fits GPU memory (memory scales with batch × activations — the training-memory story from backprop), because GPU throughput improves until the matmuls saturate. Then remember the coupling: doubling batch size halves gradient noise, which usually permits/needs a larger learning rate (the "linear scaling rule" heuristic), and extremely large batches can hurt generalization by settling into sharp minima. If the batch that FITS is smaller than the batch you WANT: gradient accumulation — run k small forward/backward passes without calling optimizer.step(), letting .grad accumulate (backward adds, remember), then step once and zero. Mathematically identical to a k×-larger batch (average the losses or scale by 1/k), at k× the wall-clock per update. This trick is how 7B-parameter models get fine-tuned on a single consumer GPU, and it returns in Part 6.'
    }
  ],
  code: {
    title: 'A complete, correct PyTorch training loop',
    intro: 'The canonical loop with every knob from this lesson labeled. This exact skeleton — AdamW, scheduler, dropout, train/eval discipline, early stopping — is what you\'ll write for everything from MNIST to LLM fine-tuning.',
    code: `import torch, torch.nn as nn

model = nn.Sequential(                     # MLP with the full toolkit
    nn.Linear(784, 256), nn.ReLU(),
    nn.Dropout(0.2),                       # dropout between hidden layers
    nn.Linear(256, 256), nn.ReLU(),
    nn.Dropout(0.2),
    nn.Linear(256, 10),                    # raw logits out (loss applies softmax)
)
opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)
sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=EPOCHS)
loss_fn = nn.CrossEntropyLoss()

best_val, patience = float("inf"), 0
for epoch in range(EPOCHS):
    model.train()                          # dropout ON, BN uses batch stats
    for xb, yb in train_loader:            # mini-batches, reshuffled each epoch
        opt.zero_grad()                    # clear accumulated blame
        loss = loss_fn(model(xb), yb)
        loss.backward()                    # the backward sweep
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)  # explosion guard
        opt.step()                         # AdamW update
    sched.step()                           # learning-rate decay

    model.eval()                           # dropout OFF, BN uses running stats
    with torch.no_grad():                  # no graph -> fast, low-memory
        val = sum(loss_fn(model(x), y).item() for x, y in val_loader) / len(val_loader)

    if val < best_val:                     # early stopping bookkeeping
        best_val, patience = val, 0
        torch.save(model.state_dict(), "best.pt")
    else:
        patience += 1
        if patience >= 5: break            # stop when val stops improving`,
    notes: [
      'Trace the discipline pairs: zero_grad ↔ step, train() ↔ eval(), backward ↔ no_grad. Interviewers hand you loops with one of these missing and ask what breaks.',
      'clip_grad_norm_ caps the global gradient norm — cheap insurance against exploding gradients; universal in RNN and transformer recipes.',
      'weight_decay=0.01 with AdamW is the standard transformer setting; embeddings/LayerNorm/biases are often excluded from decay in serious recipes.',
      'torch.save(state_dict) + early stopping = "restore the best checkpoint", the honest version of early stopping.'
    ]
  },
  lab: {
    title: 'Race SGD vs momentum down a ravine',
    prompt: 'The ravine from the lesson: L(x, y) = x² + 10y² — gentle along x, brutally steep along y, minimum at (0,0). Implement (1) <code>grad(x, y)</code> returning (∂L/∂x, ∂L/∂y); (2) <code>sgd(x0, y0, lr, steps)</code> — plain gradient descent, returning the final (x, y); (3) <code>momentum(x0, y0, lr, beta, steps)</code> — velocity update v ← β·v + g, position w ← w − lr·v, returning final (x, y). The tests race them and also check the divergence threshold you derived: along y, stability needs lr < 2/20 = 0.1.',
    starter: `def L(x, y):
    return x**2 + 10 * y**2

def grad(x, y):
    # (dL/dx, dL/dy)
    ...

def sgd(x0, y0, lr, steps):
    x, y = x0, y0
    # repeat: g = grad; x -= lr*gx; y -= lr*gy
    ...
    return x, y

def momentum(x0, y0, lr, beta, steps):
    x, y = x0, y0
    vx, vy = 0.0, 0.0
    # repeat: v = beta*v + g ; w = w - lr*v
    ...
    return x, y`,
    checks: [
      { re: 'def\\s+momentum\\s*\\(', must: true, hint: 'Define momentum(x0, y0, lr, beta, steps) with a velocity state.', pass: 'momentum() defined' },
      { re: 'beta\\s*\\*\\s*v', must: true, hint: 'The velocity must decay-and-accumulate: v = beta*v + g.', pass: 'velocity EMA present' },
      { re: 'import\\s+(numpy|torch)', must: false, hint: 'Two floats and a loop — no libraries needed.', pass: 'Pure Python' }
    ],
    tests: `assert grad(1, 1) == (2, 20)
assert grad(0, 0) == (0, 0)

# stable lr: converges (y-direction factor |1 - 0.09*20| = 0.8 < 1)
x, y = sgd(5, 5, 0.09, 200)
assert abs(x) < 1e-3 and abs(y) < 1e-3, f"sgd should converge: {(x, y)}"

# past the threshold lr = 2/20 = 0.1: the y direction diverges
x, y = sgd(5, 5, 0.11, 60)
assert abs(y) > 100, f"lr=0.11 should explode along y, got y={y}"

# the race: same small lr, same steps -- momentum lands much closer
sx, sy = sgd(5, 5, 0.01, 120)
mx, my = momentum(5, 5, 0.01, 0.9, 120)
assert L(mx, my) < L(sx, sy) / 10, f"momentum {L(mx,my):.4f} should crush sgd {L(sx,sy):.4f}"
print(f"After 120 steps  sgd loss={L(sx,sy):.4f}  momentum loss={L(mx,my):.6f}")
print("The Sunny outruns the rowboat. Momentum wins the ravine.")`,
    runnable: true,
    solution: `def L(x, y):
    return x**2 + 10 * y**2

def grad(x, y):
    return (2 * x, 20 * y)

def sgd(x0, y0, lr, steps):
    x, y = x0, y0
    for _ in range(steps):
        gx, gy = grad(x, y)
        x -= lr * gx
        y -= lr * gy
    return x, y

def momentum(x0, y0, lr, beta, steps):
    x, y = x0, y0
    vx, vy = 0.0, 0.0
    for _ in range(steps):
        gx, gy = grad(x, y)
        vx = beta * vx + gx
        vy = beta * vy + gy
        x -= lr * vx
        y -= lr * vy
    return x, y`,
    notes: [
      'You just verified the stability bound η < 2/a empirically: 0.09 converges, 0.11 explodes, with a = 20 in the steep direction. The steepest direction of the loss sets the ceiling on everyone\'s learning rate — that is the ravine problem in one sentence.',
      'At lr=0.01 plain SGD shrinks x by only 2% per step (factor 0.98) — that\'s the crawl along the valley floor. Momentum\'s accumulated velocity moves up to 10× faster there while the y-oscillations cancel inside the EMA.',
      'Adam\'s extra idea on top of this: divide each direction by its own √(mean g²) — the steep y gets a small effective step, the gentle x a large one, automatically. Try implementing it here as a bonus; with lr=0.1 it should converge comfortably.'
    ]
  },
  quiz: [
    {
      q: 'You have 50,000 training examples and batch size 100. What is one epoch, and how many optimizer steps does it contain?',
      options: ['One full pass over the data = 500 steps', 'One parameter update = 100 steps', '50,000 steps', 'One pass over the validation set'],
      correct: 0,
      explain: 'Epoch = full pass; steps per epoch = N / batch = 500. Precise step/epoch/batch vocabulary is assumed everywhere — logs, papers, schedules (e.g. "warmup for 500 steps").'
    },
    {
      q: 'Training loss suddenly spikes to NaN in the middle of training. The FIRST knob to suspect:',
      options: ['Learning rate too high (or exploding gradients) — reduce η and/or add gradient clipping', 'Batch size too small', 'Too much dropout', 'Weight decay too strong'],
      correct: 0,
      explain: 'NaN loss is the divergence signature: steps overshoot, values blow past float range. Cut η ~10× and add clip_grad_norm_. Dropout/decay/batch size cause slow or noisy learning, not explosions.'
    },
    {
      q: 'Why does momentum specifically help in ravine-shaped loss landscapes?',
      options: ['The oscillating cross-valley gradient components cancel in the running average while consistent along-valley components accumulate', 'It increases the learning rate globally', 'It computes exact second derivatives', 'It removes the need for a learning rate'],
      correct: 0,
      explain: 'v is an EMA of gradients: alternating-sign pushes (the walls) sum to ~0; same-sign pushes (the floor) sum to up to 1/(1−β)×. Noise cancels, signal compounds.'
    },
    {
      q: 'At inference time, what does dropout do?',
      options: ['Nothing — it is disabled, and inverted-dropout scaling during training already made the magnitudes match', 'It zeroes neurons with probability p, as in training', 'It averages 100 random dropout masks', 'It doubles all activations'],
      correct: 0,
      explain: 'Dropout is train-only; model.eval() turns it into the identity. Training scaled survivors by 1/(1−p) so expected activations already match. (Deliberately leaving it on with multiple passes — "MC dropout" — is a niche uncertainty-estimation trick.)'
    },
    {
      q: 'Why do transformers use LayerNorm instead of BatchNorm?',
      options: ['LayerNorm normalizes each example independently across features — no batch-size dependence, identical train/eval behavior, works with variable-length sequences', 'LayerNorm is faster to compute', 'BatchNorm cannot be differentiated', 'Transformers do not need any normalization'],
      correct: 0,
      explain: 'BatchNorm ties every example\'s statistics to its batchmates and needs running averages at eval. Sequence models with varying lengths and small/streamed batches need per-example normalization — LayerNorm (or RMSNorm in Llama).'
    }
  ],
  testFlow: {
    title: 'Test yourself: training dynamics',
    start: 'q1',
    nodes: {
      q1: { qid: 'q1', q: 'Training loss suddenly spikes to NaN in the middle of training. The FIRST knob to suspect is...', choices: [
        { text: 'Learning rate too high (or exploding gradients) — reduce η and/or add gradient clipping', to: 'q1_right' },
        { text: 'Batch size too small', to: 'q1_wrong_batch' },
        { text: 'Too much dropout', to: 'q1_wrong_dropout' },
      ]},
      q1_right: { end: true, correct: true, text: 'Right — NaN loss is the divergence signature: steps overshoot so badly values blow past representable float range. Cut η by ~10× and add gradient clipping.', next: 'q2' },
      q1_wrong_batch: { end: true, correct: false, text: 'A small batch size causes noisy, slow, or unstable-ish learning — but it doesn\'t typically cause outright NaN explosions. That signature specifically points to the learning rate/gradient magnitude.', retry: 'q1' },
      q1_wrong_dropout: { end: true, correct: false, text: 'Excessive dropout would cause underfitting or noisy training curves, not a sudden NaN spike. NaN specifically signals numerical divergence — values overflowing — which points to the learning rate.', retry: 'q1' },
      q2: { qid: 'q2', q: 'Why does momentum specifically help in ravine-shaped loss landscapes?', choices: [
        { text: 'The oscillating cross-valley gradient components cancel in the running average while consistent along-valley components accumulate', to: 'q2_right' },
        { text: 'It increases the learning rate globally for every parameter', to: 'q2_wrong_lr' },
        { text: 'It computes exact second derivatives of the loss', to: 'q2_wrong_second' },
      ]},
      q2_right: { end: true, correct: true, text: 'Right — momentum\'s velocity is an exponential moving average of gradients: alternating-sign pushes (the walls) sum toward zero; same-sign pushes (the floor) sum toward up to 1/(1−β)× the single-step push.', next: 'q3' },
      q2_wrong_lr: { end: true, correct: false, text: 'Momentum doesn\'t change the learning rate η itself — it changes what gets multiplied by η (a smoothed velocity instead of the raw instantaneous gradient), which is what cancels the zigzag.', retry: 'q2' },
      q2_wrong_second: { end: true, correct: false, text: 'Momentum uses only first-order gradient information (an exponential moving average of past gradients) — it never computes or approximates second derivatives (curvature); that\'s the domain of methods like Newton\'s method or Adam\'s variance term.', retry: 'q2' },
      q3: { qid: 'q3', q: 'Why do transformers use LayerNorm instead of BatchNorm?', choices: [
        { text: 'LayerNorm normalizes each example independently across features — no batch-size dependence, identical train/eval behavior, works with variable-length sequences', to: 'q3_right' },
        { text: 'LayerNorm is simply faster to compute than BatchNorm', to: 'q3_wrong_speed' },
        { text: 'BatchNorm cannot be differentiated, so it can\'t be used with backprop', to: 'q3_wrong_diff' },
      ]},
      q3_right: { end: true, correct: true, text: 'Right — BatchNorm ties every example\'s statistics to its batchmates and needs running averages at inference. Sequence models with variable lengths and small/streamed batches need per-example normalization instead.', },
      q3_wrong_speed: { end: true, correct: false, text: 'Computational speed isn\'t the deciding factor here — both are cheap. The real reason is behavioral: LayerNorm has no dependence on other examples in the batch, which matters enormously for variable-length sequences and small batches.', retry: 'q3' },
      q3_wrong_diff: { end: true, correct: false, text: 'BatchNorm is fully differentiable and trains fine with backprop (it was the CNN-era default for years) — the issue transformers have with it is behavioral: batch-size dependence and a train/eval statistics mismatch, not differentiability.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Forgetting model.eval() + torch.no_grad() in the validation loop. Your metrics get computed with dropout firing and the autograd graph building — noisy numbers AND memory bloat. The pair belongs together in every eval loop, always.',
    'Tuning anything before the learning rate. η is the highest-leverage hyperparameter by an order of magnitude; sweep it in powers of 10 first (1e-4 → 1e-1), then touch the rest.',
    'Using dropout after the output layer or in tiny networks. Dropout regularizes capacity you have too much of; on a small model it just starves learning. Same for slapping 0.5 everywhere — modern nets use 0.1–0.2, and CNNs mostly rely on BatchNorm instead.',
    'Copying Adam hyperparameters to SGD or vice versa. Adam\'s 1e-3 would be absurdly small for SGD+momentum on vision (try 1e-1); SGD\'s rates would detonate Adam. Learning rates are optimizer-specific.',
    'Weight decay on everything indiscriminately. Serious recipes exclude biases, LayerNorm/BatchNorm parameters, and often embeddings from decay — shrinking a normalization gain toward zero fights the normalization itself.',
    'Chasing training loss. The only number that matters is validation. A falling train loss with rising val loss is not "still improving" — it\'s the early-stopping bell ringing.'
  ],
  interview: [
    {
      q: 'Compare batch, stochastic, and mini-batch gradient descent. Why is mini-batch the universal choice?',
      a: 'Batch GD computes the exact gradient over the full dataset per update: maximally accurate direction, but one slow update per epoch, prohibitive memory, and — surprisingly — worse generalization because exact descent settles into sharp minima. Pure SGD updates per example: cheap, very noisy gradients, poor hardware utilization (no batching for the matmuls). Mini-batch (32–1024) is the engineering optimum on three axes at once: statistical — averaging over B samples cuts gradient variance by 1/B, enough to point reliably while keeping useful exploration noise; hardware — batches turn matrix-vector into matrix-matrix products that saturate GPU throughput; and optimization — thousands of updates per epoch with noise that helps escape saddles and prefers flat, generalizing minima. Follow-up worth volunteering: batch size couples to learning rate (bigger batch → less noise → usually scale η up), and gradient accumulation simulates large batches when memory is short.'
    },
    {
      q: 'Explain how Adam works and when you would prefer plain SGD with momentum.',
      a: 'Adam maintains two exponential moving averages per parameter: m of gradients (momentum, β₁=0.9) and s of squared gradients (scale, β₂=0.999), bias-corrects both for zero initialization, and updates w −= η·m̂/(√ŝ+ε). The division adapts the step per parameter: dimensions with historically large gradients get damped, rare-but-informative ones get boosted — so a single default η=1e-3 works across wildly different layers, making Adam the "it just trains" default, and AdamW (decay decoupled from the adaptive scaling) the standard for all transformer/LLM training. Prefer SGD+momentum when: compute-per-parameter matters (Adam stores 2 extra floats per weight — tens of GB at LLM scale), or on well-understood vision tasks where tuned SGD reliably generalizes slightly better, or when you want fewer interacting hyperparameters at scale. My honest default: AdamW everywhere first; SGD+momentum when I have tuning budget and a mature recipe.'
    },
    {
      q: 'Why does dropout reduce overfitting, and what changes between training and inference?',
      a: 'Two complementary explanations. Co-adaptation: without dropout, neurons form brittle dependencies — unit A\'s error is compensated by unit B — which are pure training-set artifacts; randomly deleting units makes any such pact unreliable, forcing each unit to carry independently useful features. Ensemble view: each mini-batch trains a different random sub-network sharing weights; the final model approximates averaging exponentially many thinned networks, and averaging reduces variance — the definition of fighting overfitting. Mechanics: training zeroes each unit with probability p and scales survivors by 1/(1−p) (inverted dropout) so expected activations are unchanged; inference disables it entirely — deterministic full network, no correction needed thanks to the scaling. That train/eval asymmetry is why model.eval() exists, and forgetting it is the most common validation bug in PyTorch code.'
    },
    {
      q: 'What problem do BatchNorm and LayerNorm solve, and how do they differ?',
      a: 'Both fight the same disease: as earlier layers update, the distribution of inputs to later layers keeps shifting, pushing activations into saturated or extreme ranges and making one global learning rate wrong somewhere. Normalization re-standardizes activations — subtract mean, divide by std, then restore expressiveness with learned scale γ and shift β — which demonstrably smooths the loss landscape and permits far larger learning rates. They differ only in the axis of the statistics. BatchNorm: per feature/channel, across the batch — strong for CNNs, but couples examples (needs decent batch sizes), and at inference must swap to running averages (a train/eval behavior difference). LayerNorm: per example, across features — zero batch dependence, identical train/test behavior, valid at batch size 1 and on variable-length token sequences, which is precisely why transformers standardized on it (Llama-family models use RMSNorm, LayerNorm minus the mean-centering, for speed). One extra depth point: normalization is also part of the anti-vanishing-gradient toolkit alongside ReLU, residuals, and good init.'
    }
  ]
};
