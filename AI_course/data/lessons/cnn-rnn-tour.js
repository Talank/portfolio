window.LESSONS = window.LESSONS || {};
window.LESSONS['cnn-rnn-tour'] = {
  id: 'cnn-rnn-tour',
  title: 'CNNs & RNNs: Why Sequences Broke Everything',
  category: 'Part 3 — Deep Learning',
  timeMin: 45,
  summary: 'MLPs treat every input position as unrelated — disastrous for images and text. CNNs fix images with a sliding template (weight sharing + locality); RNNs fix sequences with a running memory. Both are landmark ideas, and the RNN\'s specific failures — fading memory, one-lane processing — are the exact problems attention was invented to solve. This lesson is the "why" that makes transformers feel inevitable.',
  goals: [
    'Explain why a plain MLP is hopeless on images (parameter explosion, no translation structure)',
    'Compute a 1-D convolution by hand and explain kernels as learned sliding templates',
    'Describe the CNN recipe: conv → nonlinearity → pool, stacked into a feature hierarchy',
    'Trace an RNN\'s hidden state through a sequence and explain backpropagation through time',
    'Name the two RNN killers — vanishing memory over distance and sequential (unparallelizable) compute — and why they set up attention'
  ],
  concept: [
    {
      h: 'The problem with MLPs on structured data',
      p: [
        'Feed a 224×224 RGB image to an MLP: flatten to 150,528 numbers, and a first hidden layer of just 1000 neurons already needs 150 MILLION weights. Worse than the count: the flattening destroys structure. Pixel (10,10) and pixel (10,11) are neighbors — almost certainly part of the same edge — but the MLP gives them completely independent weights and would have to re-learn "cat" separately for a cat in the top-left and the same cat one pixel to the right. No weight sharing, no notion of locality, no translation awareness.',
        'The fix is to build the structure INTO the architecture: this is called an <b>inductive bias</b> — an assumption baked into the model so it doesn\'t have to learn it from data. CNNs bake in "nearby pixels relate; patterns matter regardless of position". RNNs bake in "inputs arrive in order; the past summarizes into a state". Interviews love the term: architecture = inductive bias made of layers.'
      ]
    },
    {
      h: 'Convolution: one small template, slid everywhere',
      p: [
        'A convolutional layer learns a tiny weight template — a <b>kernel</b>, say 3×3 — and slides it across the input, computing a dot product at every position. High response where the patch matches the template (dot product = alignment, Part 1 paying rent yet again). The output — the response at every position — is a <b>feature map</b>: literally a map of "where does my pattern occur?"',
        '<div class="math">out[i] = Σⱼ x[i+j] · k[j]<span class="mnote">1-D version (your lab). One kernel k, reused at every position i — that reuse is weight sharing.</span></div>',
        'Two structural wins. <b>Weight sharing</b>: one 3×3×3 kernel is 27 parameters used at every location — versus the MLP\'s 150M; a whole conv layer with 64 kernels is ~1.7k parameters. <b>Translation equivariance</b>: shift the cat, the feature map\'s responses shift with it — position generalization is free, by construction, not learned from a million cat photos. A layer learns many kernels in parallel (64, 128…), each becoming a different pattern detector — and remember from the neural-networks lesson: nobody designs them; gradient descent sculpts them, and layer-1 kernels famously converge to edge and color-blob detectors.',
        'Vocabulary that shows up in every CNN interview: <b>stride</b> (slide step >1 → smaller output), <b>padding</b> (zeros around the border so output size matches input), <b>pooling</b> (downsample a feature map, e.g. max-pool takes the strongest response in each 2×2 window — "was the pattern here-ish?", buying a little translation INVARIANCE and shrinking compute), and <b>receptive field</b> (how much of the original image one deep neuron sees — it grows with depth, which is what lets late layers respond to whole objects).'
      ]
    },
    {
      h: 'The CNN recipe and the feature hierarchy',
      p: [
        'The canonical stack: [conv → ReLU → (sometimes pool)] repeated, growing channels while shrinking spatial size, then a small MLP head for the final classification. Depth builds the hierarchy you met in the neural-networks lesson, now with mechanism: layer 1 kernels match edges; layer 2 kernels slide over EDGE MAPS, so they match arrangements of edges — corners, textures; layer 3 matches arrangements of those — eyes, wheels; the head combines object parts into "cat". Composition, layer by layer, with each layer\'s alphabet built from the previous one\'s words.',
        'Landmarks worth recognizing by name: LeNet (1998, digits), AlexNet (2012 — the ImageNet result that ignited the deep-learning era), VGG (depth with uniform 3×3), ResNet (2015 — residual/skip connections, the anti-vanishing-gradient highway from the backprop lesson, enabling 100+ layers; its skip-connection idea is inside every transformer). You don\'t need to reproduce their tables — you need to know ResNet\'s trick, because it never left.'
      ]
    },
    {
      h: 'Sequences: the RNN\'s running memory',
      p: [
        'Text, audio, time series: variable length, order matters, and the meaning of word 47 can hinge on word 3. The RNN\'s idea: process one token at a time, carrying a <b>hidden state</b> h — a fixed-size vector that is the network\'s running summary of everything so far:',
        '<div class="math">hₜ = tanh(W_x·xₜ + W_h·hₜ₋₁ + b)<span class="mnote">same weights W_x, W_h at every step (weight sharing across TIME — the CNN trick, rotated). hₜ is "memory after t tokens"; read predictions off it with an output layer.</span></div>',
        'Training unrolls the recurrence into a deep chain — one "layer" per timestep — and runs ordinary backprop through it: <b>backpropagation through time</b> (BPTT). And there\'s the trap you can now diagnose on sight: a 100-token sequence is a 100-layer network in which the SAME W_h multiplies into the gradient at every step. From the backprop lesson: long products of similar factors vanish (‖W_h‖ effectively < 1) or explode (> 1) — geometrically in sequence length.',
        'Consequences, concretely: by the time the loss at token 100 back-propagates to token 3, the signal is ~gone — the network cannot LEARN long-range dependencies ("The keys … 40 words … WERE on the table"). Exploding gradients meanwhile NaN the run (the gradient-clipping habit was born in RNN-land). <b>LSTM</b> and <b>GRU</b> patch the vanishing side with gates: an explicit cell state on an additive path (like a residual connection through time) plus learned forget/input/output gates deciding what to keep, write, and reveal. Gates stretched usable memory from ~10 tokens to a few hundred and powered the 2014–2017 era (translation, Siri-class speech) — a patch, not a cure.'
      ]
    },
    {
      h: 'Why RNNs lost: the two-sentence indictment',
      p: [
        'First: even with gates, information from token 3 must SURVIVE 97 sequential compressions into one fixed-size vector to influence token 100 — long-range dependencies fade, and the path length between distant tokens is O(distance). Second: hₜ cannot be computed before hₜ₋₁ — processing is inherently SEQUENTIAL, so an RNN cannot use a GPU\'s thousands of cores across time steps; training crawls exactly when data and models grow.',
        'Now flip both complaints into a wish: "let every token look DIRECTLY at every other token — path length 1 between any pair — and let all of it be computed as one big parallel matrix multiply." That wish, made precise, is <b>attention</b>, and the paper that removed the recurrence entirely is literally titled "Attention Is All You Need". You now know exactly which problems the transformer was built to kill — which is the difference between memorizing its diagram and understanding it. Part 5 builds it.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Wanted-poster kernels and the Den Den Mushi whisper chain',
      text: 'Two Marine intelligence systems, two architectures. FIRST, the poster problem: a checkpoint officer must spot Luffy in any crowd. He doesn\'t memorize every possible photo of Luffy at every position and angle (the MLP way — one weight per pixel per position). He carries a small mental TEMPLATE — "straw hat over a scar under the left eye" — and slides it across every face in the crowd, one small window at a time. High match anywhere → alarm. The template is a kernel; sliding it everywhere is convolution; and the reason it works on a Luffy at the dock, in a bar, or upside-down-left-of-frame is translation equivariance — learn the pattern ONCE, detect it ANYWHERE, with 27 numbers instead of 150 million. Junior officers scan for edges of hats; senior analysts read the junior reports and scan THOSE for arrangements — "hat-edge above eye-scar" (deeper layers matching patterns of patterns); the top brass reads "it\'s the Straw Hat captain" off the final map. SECOND, the sequence problem: news of Luffy\'s latest incident travels the Grand Line by Den Den Mushi relay — island 1 tells island 2 tells island 3, each station passing ONE summary snail-call onward (an RNN\'s hidden state, token by token). By island 10, "Straw Hat defeated a Warlord at Marineford" has faded into "some rookie caused trouble somewhere" — every relay compresses and re-tells, and detail decays GEOMETRICALLY with distance (vanishing gradients through time). Important stations learn to keep a written logbook and copy key facts forward verbatim while discarding chatter — a forget-gate and a write-gate: that\'s an LSTM, and it genuinely helps for a dozen hops. But two curses remain: a 100-island chain still takes 100 sequential calls (no parallelism — station 40 cannot relay before 39), and the logbook is still one fixed-size page. The World Government\'s real fix? The news coo: Morgans PRINTS the full story and birds drop the SAME newspaper on every island SIMULTANEOUSLY — every island reads the original source directly, path length 1, all in parallel. Hold that image: the newspaper is attention, and Part 5 is Morgans\' printing press.'
    },
    sitcom: {
      show: 'Friends',
      title: 'The gossip chain (and the group text that killed it)',
      text: 'Phoebe sees something juicy: Ross and Rachel, coffee, hand-holding. She tells Joey, who tells Chandler, who tells Monica, who tells Rachel\'s sister, who tells Gunther. Each friend re-tells a COMPRESSED version filtered through what they consider important — Joey drops the location, Chandler adds a joke that gets mistaken for fact, Monica\'s version is somehow about the coffee cups. Five hops later the story is unrecognizable: sequential re-telling loses information geometrically (a vanishing gradient made of gossip), and occasionally a detail gets AMPLIFIED each hop until "hand-holding" becomes "eloped to Vegas" (the exploding twin — someone should have clipped that rumor). Monica\'s fix is pure LSTM: she starts writing the key facts on a notepad and reading them out verbatim — a cell state with a write gate — which keeps the story straight for a few more hops but still can\'t fix the deeper flaws: the chain is slow (each person must wait for the previous call) and her notepad has one page. The actual solution arrives when someone finally creates the group text: the original message, verbatim, delivered to EVERYONE simultaneously — each friend attends directly to the source instead of a fifth-hand summary. Sequential chain → broadcast with direct access: that\'s exactly the RNN → attention transition, in one apartment.'
    },
    why: 'Two images to keep: the poster TEMPLATE slid over a crowd (kernel = small shared pattern-detector; deeper officers scan the previous layer\'s reports = feature hierarchy), and the RELAY CHAIN that fades with distance and can\'t be parallelized (RNN), patched by a logbook (LSTM), obsoleted by the newspaper/group text (attention). When Part 5 asks "why attention?", the answer is already in your head: because the tenth island deserves the original story, not the ninth re-telling.'
  },
  storyAnim: {
    title: 'Relay chain vs news coo: how the message survives',
    h: 250,
    props: [
      { id: 'i1', emoji: '🏝️', label: 'msg: 100%', x: 10, y: 30 },
      { id: 'i2', emoji: '🏝️', label: '', x: 30, y: 30 },
      { id: 'i3', emoji: '🏝️', label: '', x: 50, y: 30 },
      { id: 'i4', emoji: '🏝️', label: '', x: 70, y: 30 },
      { id: 'i5', emoji: '🏝️', label: '', x: 90, y: 30 },
      { id: 'press', emoji: '📰', label: 'Morgans\' press', x: 10, y: 78 }
    ],
    actors: [
      { id: 'snail', emoji: '🐌', label: 'relay call', x: 10, y: 45 },
      { id: 'coo', emoji: '🐦', label: 'news coo', x: 10, y: 90 }
    ],
    steps: [
      { c: 'Island 1 has the full story: "Straw Hat defeated a Warlord at Marineford." The relay chain begins — one summary call to the next island (hₜ = compress(hₜ₋₁, new stuff)).', p: { i1: 'lit' } },
      { c: 'Hop 2: some detail is dropped in the re-telling. The hidden state is fixed-size; something must go.', a: { snail: [30, 45] }, p: { i2: 'lit' }, l: { i2: 'msg: ~70%' } },
      { c: 'Hop 3, hop 4: decay compounds GEOMETRICALLY. And note the clock — island 4 cannot hear anything until island 3 finishes its call. Strictly sequential.', a: { snail: [70, 45] }, p: { i3: 'dim', i4: 'dim' }, l: { i3: 'msg: ~45%', i4: 'msg: ~30%' } },
      { c: 'Island 5 receives: "some rookie caused trouble somewhere." Long-range information has vanished — exactly what BPTT gradients do across 100 timesteps.', a: { snail: [90, 45] }, p: { i5: 'bad' }, l: { i5: 'msg: ~15% 💀' } },
      { c: 'The LSTM patch: stations keep a logbook and copy key facts forward verbatim (a gated, additive cell state). Better — hops carry further — but still sequential, still one small page.', p: { i3: 'lit', i4: 'lit' }, l: { i3: 'logbook: keep "Straw Hat"', i4: 'msg: ~60%' } },
      { c: 'Morgans\' solution: PRINT the original and have news coos drop the SAME newspaper on every island at once. Direct access to the source, path length 1, fully parallel. That is attention — see Part 5.', a: { coo: [90, 85] }, p: { press: 'good', i1: 'good', i2: 'good', i3: 'good', i4: 'good', i5: 'good' }, l: { i5: 'msg: 100% ✓' } }
    ]
  },
  tech: [
    {
      q: 'What does nn.Conv2d(3, 64, kernel_size=3, padding=1) actually allocate and compute?',
      a: 'Allocates 64 kernels, each of shape 3×3×3 (kernel covers ALL input channels — a "3×3" kernel on RGB is really 27 weights), plus 64 biases: 64×(3×3×3)+64 = 1,792 parameters. On a [B, 3, H, W] input it computes, for each kernel, the sliding dot product over every 3×3×3 patch — producing [B, 64, H, W] (padding=1 rings the border with zeros so 3×3 kernels keep H×W). Each of the 64 output channels is one detector\'s response map. Under the hood the sliding is turned into one huge matrix multiply (im2col/cuDNN) — convolution IS matmul after rearrangement, which is why GPUs eat it. Parameter-count sanity checks like this are a favorite interview warm-up: note the count doesn\'t depend on H or W at all — that\'s weight sharing in one sentence.'
    },
    {
      q: 'Convolution vs cross-correlation — is the "convolution" in CNNs even convolution?',
      a: 'Strictly, no. Mathematical convolution flips the kernel before sliding (Σ x[i−j]k[j]); what CNN layers compute is cross-correlation (Σ x[i+j]k[j] — no flip). Frameworks skip the flip because it\'s pointless when the kernel is LEARNED: gradient descent would simply learn the flipped version, so the two are equivalent up to re-parameterization, and the unflipped form is cheaper to think about. The name stuck for historical/signal-processing reasons. This is a fun "do you actually know what the layer computes?" interview probe — the answer shows you\'ve looked under the hood. Your lab implements the honest unflipped version, same as PyTorch.'
    },
    {
      q: 'Why exactly does the same W_h at every timestep make RNN gradients vanish or explode?',
      a: 'BPTT\'s chain rule from the loss at step T back to step t multiplies the local Jacobian ∂hₖ/∂hₖ₋₁ = diag(tanh\')·W_h once per step — (T−t) times. Unlike an MLP where each layer has a DIFFERENT matrix (errors partially cancel), here it is the SAME W_h compounding: the product behaves like W_h^(T−t), which is governed by W_h\'s largest eigenvalue λ (the eigenvalue lesson, cashing in): |λ| < 1 → the gradient decays like λ^distance (vanishing — no learning signal across long gaps); |λ| > 1 → grows like λ^distance (exploding — NaN). tanh\' ≤ 1 pushes further toward vanishing. Fixes map cleanly: gradient clipping caps the exploding side; LSTM\'s additive cell state creates a path whose Jacobian is ~identity (gated, near-eigenvalue-1 — a residual connection through time) for the vanishing side; attention removes the long product altogether by making every pair one hop.'
    },
    {
      q: 'Why did translation invariance matter so much for images but weight sharing across TIME still wasn\'t enough for language?',
      a: 'The CNN bias fits images almost perfectly: a cat is a cat anywhere in the frame (translation), and meaningful patterns are local-then-compositional (edges→parts→objects), so locality + sharing + hierarchy captures the true structure with tiny parameter budgets. The RNN bias — "the past compresses into one fixed vector, updated identically each step" — fits language only partly: yes, text is ordered and processed left-to-right, but the RELEVANT context for a word is neither local nor recent — the antecedent of "she" might be 200 tokens back with everything in between irrelevant. A fixed-size state forces lossy compression of exactly the long-range links that matter, and locality-in-time (CNNs over text were tried too — WaveNet-style dilated convs) still needs O(log n) or O(n) layers to connect distant tokens. Language wanted an architecture whose bias is "any token may depend on any other, learn which" — content-based, position-flexible routing. That is attention\'s inductive bias, and it\'s why transformers also conquered images (ViT) once data was plentiful enough to learn what CNNs hard-coded.'
    }
  ],
  code: {
    title: 'A tiny CNN and a tiny RNN, side by side',
    intro: 'Both architectures in ~25 lines each of PyTorch, with the shapes annotated. Read the shapes, not just the layers — shape-tracing is how you actually understand an architecture.',
    code: `import torch
import torch.nn as nn

# ---- CNN for 28x28 grayscale digits (MNIST-shaped) ----
cnn = nn.Sequential(
    nn.Conv2d(1, 32, 3, padding=1),   # [B,1,28,28] -> [B,32,28,28]   32 templates
    nn.ReLU(),
    nn.MaxPool2d(2),                  # -> [B,32,14,14]   keep strongest response per 2x2
    nn.Conv2d(32, 64, 3, padding=1),  # -> [B,64,14,14]   patterns-of-patterns
    nn.ReLU(),
    nn.MaxPool2d(2),                  # -> [B,64,7,7]
    nn.Flatten(),                     # -> [B, 64*7*7]
    nn.Linear(64*7*7, 10),            # -> [B,10] logits
)
x = torch.randn(8, 1, 28, 28)
print(cnn(x).shape)                   # torch.Size([8, 10])

# ---- RNN for sequences, by hand (one tanh cell) ----
class TinyRNN(nn.Module):
    def __init__(self, d_in, d_hidden, n_classes):
        super().__init__()
        self.Wx = nn.Linear(d_in, d_hidden, bias=True)
        self.Wh = nn.Linear(d_hidden, d_hidden, bias=False)
        self.head = nn.Linear(d_hidden, n_classes)
    def forward(self, x):                      # x: [B, T, d_in]
        B, T, _ = x.shape
        h = torch.zeros(B, self.Wh.in_features)
        for t in range(T):                     # the sequential bottleneck, in the flesh:
            h = torch.tanh(self.Wx(x[:, t]) + self.Wh(h))   # no way to parallelize over t
        return self.head(h)                    # classify from the final memory

seq = torch.randn(8, 50, 16)                   # batch of 8 sequences, 50 steps
print(TinyRNN(16, 64, 4)(seq).shape)           # torch.Size([8, 4])`,
    notes: [
      'CNN parameter count: (1·32·9+32) + (32·64·9+64) + (64·7·7·10+10) ≈ 50k — versus ~150M for an MLP of similar reach on raw pixels. Weight sharing is not a rounding error.',
      'The RNN\'s python-level for t in range(T) is the indictment made visible: 50 steps = 50 dependent little matmuls. The CNN\'s convs, by contrast, are each ONE big parallel op. (nn.LSTM/nn.GRU fuse the loop into optimized kernels, but the sequential dependency remains.)',
      'In practice you\'d use nn.LSTM(16, 64, batch_first=True) instead of the hand loop — but write the loop once; it makes hₜ = f(hₜ₋₁) stop being abstract.',
      'ResNet\'s skip connection (x + block(x)) is one line to add to the CNN and turns it 100-layers-deep trainable — same anti-vanishing highway that LSTM cells build through time and transformers build through depth.'
    ]
  },
  lab: {
    title: 'Build conv1d, max-pool, and an RNN step — then watch memory fade',
    prompt: 'Pure Python. Implement (1) <code>conv1d(x, k)</code> — valid cross-correlation: out[i] = Σⱼ x[i+j]·k[j], output length len(x)−len(k)+1; (2) <code>maxpool(x, size)</code> — split x into consecutive windows of the given size (drop any ragged tail) and keep each window\'s max; (3) <code>rnn_steps(xs, wx, wh, h0)</code> — run hₜ = tanh(wx·xₜ + wh·hₜ₋₁) over the scalar sequence xs and return the FINAL h. The tests use an edge-detector kernel, then demonstrate vanishing (wh=0.5) and exploding-ish (wh=2.0, saturating in tanh) memory.',
    starter: `import math

def conv1d(x, k):
    # out[i] = sum_j x[i+j] * k[j], for i in 0..len(x)-len(k)
    ...

def maxpool(x, size):
    # non-overlapping windows; drop ragged tail; keep max of each
    ...

def rnn_steps(xs, wx, wh, h0=0.0):
    # h = tanh(wx*x + wh*h), once per element; return final h
    ...`,
    checks: [
      { re: 'def\\s+conv1d\\s*\\(', must: true, hint: 'Define conv1d(x, k) — the sliding dot product.', pass: 'conv1d defined' },
      { re: 'def\\s+rnn_steps\\s*\\(', must: true, hint: 'Define rnn_steps(xs, wx, wh, h0) — the recurrence.', pass: 'rnn_steps defined' },
      { re: 'math\\.tanh|tanh\\s*\\(', must: true, hint: 'The RNN cell squashes with tanh.', pass: 'tanh used' },
      { re: 'import\\s+(numpy|torch)', must: false, hint: 'Lists and loops only — feel the slide and the recurrence.', pass: 'Pure Python' }
    ],
    tests: `# edge detector: kernel [-1, 1] responds only where the signal steps up
sig = [0, 0, 0, 1, 1, 1]
assert conv1d(sig, [-1, 1]) == [0, 0, 1, 0, 0], f"got {conv1d(sig, [-1, 1])}"
# smoothing kernel: len checks out (valid mode) and values average
out = conv1d([1, 2, 3, 4], [0.5, 0.5])
assert len(out) == 3 and abs(out[0] - 1.5) < 1e-9 and abs(out[2] - 3.5) < 1e-9

assert maxpool([1, 5, 2, 8, 3, 3], 2) == [5, 8, 3]
assert maxpool([1, 5, 2, 8, 9], 2) == [5, 8], "ragged tail is dropped"

# translation EQUIVARIANCE: shift the input, the response shifts with it
a = conv1d([0, 0, 1, 0, 0, 0], [1, 2])
b = conv1d([0, 0, 0, 1, 0, 0], [1, 2])
assert a[:-1] == b[1:] and max(a) == max(b), "same pattern detected, shifted position"

# vanishing memory: strong signal at t=0, then 30 steps of silence
h_short = rnn_steps([5.0] + [0.0]*3,  wx=1.0, wh=0.5)
h_long  = rnn_steps([5.0] + [0.0]*30, wx=1.0, wh=0.5)
assert abs(h_short) > 0.05, f"after 3 quiet steps some memory remains: {h_short}"
assert abs(h_long) < 1e-6, f"after 30 quiet steps the memory is GONE: {h_long}"
# wh near 1 preserves much better (the LSTM/residual idea: keep the multiplier ~1)
h_keep = rnn_steps([5.0] + [0.0]*30, wx=1.0, wh=0.99)
assert abs(h_keep) > 0.05, f"wh≈1 keeps the memory alive: {h_keep}"
print("Edge found, memory faded, wh≈1 saved it. You have now debugged 2015.")`,
    runnable: true,
    solution: `import math

def conv1d(x, k):
    n = len(x) - len(k) + 1
    return [sum(x[i + j] * k[j] for j in range(len(k))) for i in range(n)]

def maxpool(x, size):
    return [max(x[i:i + size]) for i in range(0, len(x) - size + 1, size)]

def rnn_steps(xs, wx, wh, h0=0.0):
    h = h0
    for x in xs:
        h = math.tanh(wx * x + wh * h)
    return h`,
    notes: [
      'The equivariance test is the deep one: shifting the input shifted the output, with identical response values. You verified the CNN\'s core promise in two lines.',
      'The memory experiment IS the vanishing-gradient story in forward form: each quiet step multiplies h by ≈ wh (tanh is ~linear near 0), so influence decays like wh^distance. wh = 0.99 ≈ the LSTM cell/residual trick: keep the recurrent multiplier pinned near 1.',
      'maxpool\'s window max is why small shifts stop mattering after pooling (invariance) — and why fine position information is lost, which is the classic pooling trade-off.'
    ]
  },
  quiz: [
    {
      q: 'Why does a conv layer need thousands of times fewer parameters than an MLP layer on the same image?',
      options: ['One small kernel is reused at every spatial position (weight sharing), so parameters depend on kernel size and channels — not on image size', 'Convolutions use lower-precision floats', 'Feature maps are smaller than images', 'Conv layers have no biases'],
      correct: 0,
      explain: 'Conv2d(3→64, 3×3) is 1,792 parameters whether the image is 28×28 or 4K — the count is image-size independent. The MLP\'s 150M came from giving every pixel×neuron pair its own weight.'
    },
    {
      q: 'What property guarantees a CNN detects a pattern regardless of where it appears in the image?',
      options: ['Translation equivariance — sliding the same kernel everywhere means a shifted input yields a correspondingly shifted feature map', 'The softmax output layer', 'Backpropagation through time', 'Zero padding'],
      correct: 0,
      explain: 'The same template is applied at every position by construction, so position generalization is architectural, not learned. Pooling then adds a bit of invariance (small shifts stop mattering at all).'
    },
    {
      q: 'An RNN processes a 200-token sequence. Why does the loss at token 200 barely teach the network about token 5?',
      options: ['BPTT multiplies the same recurrent Jacobian ~195 times; with effective eigenvalue < 1 the gradient decays geometrically to ~zero over that distance', 'The hidden state is too large', 'Tokens beyond 100 are truncated by default', 'The learning rate decays over the sequence'],
      correct: 0,
      explain: 'Same-matrix products behave like λ^distance — the eigenvalue lesson meeting the backprop lesson. LSTM gates create a near-identity additive path to fight this; attention removes the long product entirely.'
    },
    {
      q: 'What is the key mechanism by which an LSTM preserves long-range information better than a vanilla RNN?',
      options: ['An additive, gated cell state — a near-identity path through time (like a residual connection) where gradients don\'t get repeatedly squashed', 'A much larger hidden state', 'It processes the sequence in both directions', 'It skips unimportant tokens entirely'],
      correct: 0,
      explain: 'The cell state updates as c ← f⊙c + i⊙(new stuff) — additive, with learned forget/input gates. When f ≈ 1, information (and gradient) rides through unmultiplied. Bigger states or bidirectionality don\'t fix the geometric decay.'
    },
    {
      q: 'Which TWO properties of RNNs did attention/transformers specifically eliminate?',
      options: ['O(distance) paths between tokens (long-range fading) and strictly sequential timestep computation (no parallelism)', 'Weight sharing and nonlinear activations', 'The use of embeddings and of softmax', 'Gradient descent and backpropagation'],
      correct: 0,
      explain: 'Attention gives every token a direct (path-length-1) connection to every other, computed as one parallel matmul over the whole sequence. Those two fixes are the entire origin story of "Attention Is All You Need".'
    }
  ],
  pitfalls: [
    'Memorizing architectures without their WHY. "CNN = conv+pool+fc" earns nothing in interviews; "weight sharing + locality as an inductive bias for translation structure" is the answer that lands. Same for RNNs: lead with the fixed-size state and the sequential bottleneck.',
    'Confusing equivariance with invariance. Conv layers are EQUIVARIANT (shift input → shifted output); pooling/global-average adds approximate INVARIANCE (shift input → same output). Interviewers enjoy this distinction.',
    'Forgetting that a "3×3" kernel spans all input channels: Conv2d(64, 128, 3) kernels are 3×3×64. Parameter miscounts follow immediately.',
    'Believing LSTMs solved long-range dependency. They stretched it from ~10 to a few hundred tokens; the fixed-size state and sequential compute remained. If they\'d solved it, Part 5 wouldn\'t exist.',
    'Flattening spatial data before you must. nn.Flatten() belongs after the conv stack, at the head — flattening first throws away exactly the structure convolutions exist to exploit.',
    'Dismissing CNNs/RNNs as "obsolete". CNNs still dominate edge/small-data vision; RNN-descendants (state-space models like Mamba) are an active research bet on reviving O(n) sequence processing. Know the trade-offs, not the fashion.'
  ],
  interview: [
    {
      q: 'Why are CNNs so much more parameter-efficient than fully-connected networks on images, and what assumptions do they encode?',
      a: 'Two architectural moves. Locality: each unit connects only to a small neighborhood (a 3×3 patch), not the whole image — justified because image statistics are local (edges, textures). Weight sharing: the same kernel is applied at every position, so parameters scale with kernel size × channels, independent of image resolution — a Conv2d(3→64, 3×3) layer is under 2k parameters where a dense layer on the same pixels would be hundreds of millions. Together they encode the inductive bias that patterns are position-independent (translation equivariance, by construction) and compositional (stacking layers grows receptive fields, building edges→textures→parts→objects). The bias is also the limitation: it must be roughly TRUE of the data. It is for photos; for data without translation structure (tabular features), convolutions are the wrong prior — and with enough data, Vision Transformers LEARN what CNNs hard-code, trading bias for flexibility.'
    },
    {
      q: 'Explain the vanishing gradient problem in RNNs and how LSTMs address it.',
      a: 'Backpropagation through time unrolls the recurrence into a chain where the gradient from a loss at step T to a hidden state at step t multiplies the Jacobian ∂hₖ/∂hₖ₋₁ = diag(tanh′)·W_h exactly (T−t) times — and critically it\'s the SAME W_h every step, so the product behaves like W_h^(T−t): its largest eigenvalue below 1 makes gradients decay geometrically with distance (long-range dependencies unlearnable), above 1 makes them explode (NaNs; mitigated by gradient clipping). LSTMs attack the vanishing side structurally: they add a cell state updated ADDITIVELY — cₜ = fₜ⊙cₜ₋₁ + iₜ⊙c̃ₜ — with learned sigmoid gates (forget f, input i, output o). When f ≈ 1 the path through time has a near-identity Jacobian, so information and gradient flow across long gaps without repeated squashing — conceptually a residual connection through time. GRUs achieve the same with fewer gates. It works to a point — hundreds of tokens — but the fixed-size state and sequential computation remain, which is what attention subsequently removed.'
    },
    {
      q: 'Your team is choosing between an RNN/LSTM and a transformer for a sequence task. What trade-offs would you present?',
      a: 'Transformer advantages: path length 1 between any token pair (long-range dependencies learned directly, not through a survival lottery), and full parallelism across the sequence during training (one matmul over all positions vs a strictly sequential loop) — which is why they scale and why pretrained checkpoints for transfer are abundant. Costs: attention is O(n²) in sequence length in compute and memory (an RNN is O(n) with O(1) state), transformers are data-hungry (weak inductive bias), and at inference they need a growing KV-cache while an RNN carries one fixed vector. So I\'d ask: sequence length and latency budget (streaming/embedded with tight memory → LSTM or a state-space model like Mamba remains legitimate); data volume (small supervised data → fine-tune a pretrained transformer rather than train any RNN from scratch); dependency range (long documents → transformer, or long-context variants). Honest default in 2026: pretrained transformer, unless O(n²) or on-device constraints bite — and then modern linear-time architectures, not vanilla LSTMs, are the real alternative.'
    },
    {
      q: 'Walk me through the shapes in a CNN from a [32, 3, 64, 64] input through Conv2d(3,16,3,padding=1) → MaxPool2d(2) → Conv2d(16,32,3,padding=1) → MaxPool2d(2) → Flatten → Linear head for 10 classes. How many parameters in each layer?',
      a: 'Shapes: [32,3,64,64] → conv1 (padding preserves spatial dims) [32,16,64,64] → pool [32,16,32,32] → conv2 [32,32,32,32] → pool [32,32,16,16] → flatten [32, 32·16·16=8192] → linear [32,10]. Parameters: conv1 = 16 kernels × (3×3×3) + 16 biases = 448; conv2 = 32 × (3×3×16) + 32 = 4,640; pools and flatten = 0 (no learned weights); linear = 8192×10 + 10 = 81,930. Total ≈ 87k — and note the punchline the interviewer wants: the dense head dwarfs both conv layers combined, which is why classic architectures replaced giant FC heads with global average pooling. Batch size 32 appears in every activation shape but no parameter count — parameters never depend on batch or image size, only kernels and channels.'
    }
  ]
};
