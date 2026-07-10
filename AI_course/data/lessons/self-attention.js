window.LESSONS = window.LESSONS || {};
window.LESSONS['self-attention'] = {
  id: 'self-attention',
  title: 'Self-Attention: Q, K, V — the Full Math',
  category: 'Part 5 — Transformers',
  timeMin: 65,
  summary: 'Last lesson\'s attention let a DECODER glance back at an ENCODER. This lesson answers Usopp\'s question: what if a sequence glances at ITSELF? Every token becomes a query, a key, AND a value simultaneously — the exact same score→softmax→weighted-sum mechanism, just pointed inward. Add a scaling factor, run it several times in parallel ("heads"), and you have the operation that replaced recurrence entirely.',
  goals: [
    'Define self-attention precisely: Q = XWq, K = XWk, V = XWv, all from the SAME sequence X',
    'Write and justify the scaled dot-product attention formula, including why the 1/√dk scale exists',
    'Explain multi-head attention: why split into heads, what each head can specialize in, how outputs recombine',
    'Explain causal masking and padding masking: what they block and why each is necessary',
    'State the transformer\'s core trade: O(1) path length between any two positions, at O(n²) time/memory cost'
  ],
  concept: [
    {
      h: 'From cross-attention to self-attention: one word, "self"',
      p: [
        'Recap last lesson in one line: a decoder state s asked "who among the ENCODER\'s hidden states is relevant to me right now?" — scores, softmax, weighted sum. Self-attention asks the exact same question with a twist: instead of one sequence (decoder) querying a DIFFERENT sequence (encoder), a single sequence queries ITSELF. Every token asks "who among my OWN neighbors — including me — is relevant to updating MY representation?"',
        'Concretely: you have an input sequence represented as a matrix X (n tokens × d_model dimensions — one embedding row per token, from the tokenization/word-embeddings lessons). Self-attention produces a NEW matrix, same shape, where row i is no longer just token i\'s static embedding — it\'s been rebuilt as a weighted blend of every token\'s information, weighted by relevance to token i. Feed "The animal didn\'t cross the street because it was too tired" through self-attention and "it"\'s output row ends up mostly built from "animal"\'s value (not "street"\'s) — the model has resolved the coreference, with no parser, no rules, purely learned compatibility.'
      ]
    },
    {
      h: 'Query, Key, Value: three learned roles for every token',
      p: [
        'Last lesson\'s attention reused the same encoder hidden state hᵢ as both "key" and "value" — it played both roles at once. The transformer\'s upgrade: give every token THREE separate learned projections of its embedding, via three weight matrices trained by backprop:',
        '<div class="math">Q = X·Wq&nbsp;&nbsp;(what am I looking for?)<br>K = X·Wk&nbsp;&nbsp;(what do I advertise, so others can find me?)<br>V = X·Wv&nbsp;&nbsp;(what information do I actually hand over, once found?)<span class="mnote">Wq, Wk, Wv are ordinary learned weight matrices (Part 3) — same input X, three different linear projections, three different d_k/d_v-dimensional spaces to live in</span></div>',
        'Why three separate roles instead of reusing the embedding directly? Because "what I\'m looking for" and "what I advertise" are genuinely different questions. The word "it" is LOOKING for its antecedent (a query pattern like "recent singular noun, likely subject"); the word "animal" ADVERTISES itself as exactly that kind of noun (a key pattern), and separately HOLDS the semantic content "animal" that should flow into "it"\'s new representation if matched (its value). Collapsing all three into one vector would force one representation to serve three different jobs — splitting them gives the model more room to specialize, at the cost of three weight matrices instead of zero. This is the direct generalization of word2vec\'s two-vectors-per-word trick (u for "center", v for "context") to three roles.'
      ]
    },
    {
      h: 'Scaled dot-product attention: the exact formula',
      p: [
        '<div class="math">Attention(Q, K, V) = softmax( Q·Kᵀ / √dk ) · V<span class="mnote">Q·Kᵀ: every query dotted with every key, all at once (an n×n matrix of scores) → divide by √dk → softmax each ROW to a probability distribution → multiply by V to get the weighted blend</span></div>',
        'Read the shapes to make it concrete: Q is n×dk, K is n×dk, so Q·Kᵀ is n×n — row i, column j is "how much does token i\'s query match token j\'s key" — exactly last lesson\'s dot-product score, computed for ALL n² pairs in one matrix multiplication. Softmax is applied ROW-WISE (each token\'s scores over all other tokens sum to 1, independently). The result (n×n) multiplies V (n×dv) to give the output (n×dv): row i is the weighted average of every token\'s value, weighted by token i\'s attention distribution.',
        'The scale factor 1/√dk is not decorative. Here is the exact failure it prevents: if Q and K entries are independent, roughly zero-mean, unit-variance numbers (the healthy initialization regime from the training-neural-nets lesson), then a raw dot product q·k = Σ over dk terms has variance ≈ dk — it GROWS with dimension. For a typical dk=64, dot products land in a wide range; fed raw into softmax, the largest score dominates so hard that softmax saturates near one-hot, gradients through the OTHER positions vanish (the softmax-saturation problem you\'ve now met in output layers, gating, and here), and the model can\'t learn nuanced multi-way attention. Dividing by √dk rescales the variance back down to ≈1 regardless of dk, keeping softmax in its well-behaved, gradient-rich middle range. One division, one line of code, and it\'s the difference between trainable and not at realistic dimensions.'
      ]
    },
    {
      h: 'Multi-head attention: several specialized readings in parallel',
      p: [
        'One attention computation gives ONE weighting scheme per token — one "lens". But relevance is not one-dimensional: "it" needs to resolve WHO (coreference), a verb needs to know its SUBJECT (syntax), and a pronoun\'s gender might need to match an antecedent (agreement) — different relations, potentially incompatible weightings. Multi-head attention runs h independent attention computations in parallel, each with its OWN Wq, Wk, Wv (so each head learns its own notion of "relevant"), on smaller dk = d_model/h -dimensional projections, then concatenates the h outputs and applies one more learned matrix Wo to mix them back into d_model dimensions:',
        '<div class="math">headᵢ = Attention(X·Wqᵢ, X·Wkᵢ, X·Wvᵢ)&nbsp;&nbsp;for i = 1..h<br>MultiHead(X) = Concat(head₁, …, head_h) · Wo</div>',
        'Empirically (and somewhat interpretably in small models), different heads DO specialize — some attend mostly to the immediately preceding token (local syntax), some to a sentence\'s subject from anywhere (long-range dependency), some to matching punctuation or delimiters. Nobody assigns heads their job; gradient descent discovers a useful division of labor because gradients flow independently through each head\'s own weights. The parameter cost is modest — h heads of dimension d_model/h have the SAME total parameter count as one head of dimension d_model — you\'re trading one wide lens for several narrow, independently-steerable ones, for roughly free.'
      ]
    },
    {
      h: 'Masking: controlling who is allowed to look at whom',
      p: [
        'The raw formula lets every token attend to every OTHER token — sometimes that\'s wrong, and masking fixes it by forcing specific scores to −∞ BEFORE the softmax (so their weight becomes exactly 0 after):',
        '<b>Padding mask.</b> Batches contain sequences of different lengths, padded to a common width (the tokenization lesson\'s attention_mask). A real token must not attend to a [PAD] position\'s meaningless embedding — mask those score columns to −∞ so padding contributes nothing, for every row.',
        '<b>Causal (look-ahead) mask.</b> A decoder generating text autoregressively (GPT, Part 5\'s next lesson) must predict token t using only tokens 1..t-1 — never a peek at the future, or training would be trivially "cheating" (copy the answer) and inference (where future tokens don\'t exist yet) would be impossible to match. The fix: mask all scores where key-position > query-position to −∞, producing a strictly lower-triangular pattern of allowed attention. This single masking choice is THE structural difference between an encoder (BERT-style, full bidirectional self-attention, sees the whole sequence) and a decoder (GPT-style, causal self-attention, sees only the past) — the next lesson\'s entire topic in one sentence.'
      ]
    },
    {
      h: 'The price of the upgrade: O(n²)',
      p: [
        'Self-attention\'s superpower — direct, O(1)-hop access between any two positions regardless of distance, unlike the RNN\'s O(distance) chain — has a cost: computing Q·Kᵀ for n tokens is an n×n matrix, so both time and memory scale as O(n²·d). Double the sequence length, quadruple the attention cost. For n in the low thousands this is a non-issue and utterly dominates the RNN on GPUs (one parallel matmul beats an unparallelizable loop even with a worse big-O, up to a point). For n in the hundreds of thousands (long documents, long conversations, long code files) it becomes the transformer\'s own bottleneck — the direct motivation for FlashAttention (a memory-efficient EXACT implementation of the same math), sparse/local attention patterns, and KV-caching at inference (Part 6). Keep this trade-off ready for interviews: "attention solved the RNN\'s O(distance) information decay by trading it for O(n²) compute — a good trade at typical sequence lengths, an active engineering problem at extreme ones."'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The glyphs finally glance at each other',
      text: 'Usopp\'s question from last lesson gets answered on the spot: Robin decides to test what happens if she stops being the only reader and instead asks each GLYPH to read the OTHERS. She sets up the experiment on the temple stone: every glyph is given three jobs at once. Its QUERY job: silently ask "which other glyphs do I need context from to know my own meaning?" ("beneath" needs to know WHAT is beneath, so it queries outward). Its KEY job: advertise, in a form other glyphs can match against, what KIND of information it holds ("sea" advertises "I\'m a location-type glyph"). Its VALUE job: hold the actual content it will hand over if another glyph\'s query matches its key (the real meaning-payload of "sea"). Every glyph runs its query against every OTHER glyph\'s key simultaneously — a full n-by-n cross-check, not Robin doing it one at a time — and where the match is strong, that glyph pulls a large share of the matched glyph\'s value into its own updated meaning. Robin\'s old mentor adds one crucial correction when the first trial runs too jumpy: without dividing the match scores down by a calming factor, one lucky strong match completely dominates and every glyph collapses onto reading just ONE other glyph, ignoring nuance — so they add the /√dk correction, and suddenly the readings settle into rich, multi-way blends instead of single fixations. Then Nami suggests going further: what if different TEAMS of glyphs each specialize in reading for a different kind of relationship — one team purely for "what is buried where," another purely for "who betrayed whom," a third for tense and chronology — running in parallel, then combining their notes at the end? That\'s the crew inventing multi-head attention by committee. And when they later try to have EACH glyph predict the NEXT glyph in sequence, they discover a rule is required: a glyph predicting position 12 is not allowed to peek at glyphs 13 onward, or the "prediction" is worthless cheating — Robin literally covers the later glyphs with her hand while training a young apprentice reader. The stone that once needed one overworked interpreter now reads itself, in parallel, self-organizing which parts explain which other parts — the temple hums like it understands its own inscription for the first time.'
    },
    sitcom: {
      show: 'Friends',
      title: 'The group chat that reads itself',
      text: 'The gang starts a group text, and Monica notices something: everyone is simultaneously reading everyone else\'s messages AND being read. Each person is running three jobs at once. QUERY: what am I looking for in this thread right now (Chandler is scanning for a joke opportunity; Monica is scanning for anyone flaking on dinner plans). KEY: what am I signaling I\'m relevant for (Joey\'s messages are tagged, implicitly, "ask me about food"; Ross\'s are tagged "ask me about dinosaurs or Rachel"). VALUE: the actual content each person hands over once matched (Joey\'s literal answer about the sandwich). When Chandler fires off a sarcastic line, everyone\'s "match score" against Chandler spikes at once — and Monica points out that without SOME dampener, the whole chat would fixate entirely on Chandler\'s last joke and stop tracking anything else (the group needs to divide their attention down, not let one loud message dominate — the scaling factor, sitcom edition). Phoebe then reveals she reads the SAME thread for a totally different signal than everyone else — she\'s not tracking food or jokes, she\'s tracking "who sounds sad today" — a completely separate head, running in parallel over the identical messages, catching what the other readings miss; combine Phoebe\'s read with Chandler-joke-detection and Monica-logistics-detection and you get the full picture no single reading gives you alone. The kicker: when Rachel joins the thread LATE and tries to reply to something as if she\'d seen the whole conversation build in order, Ross stops her — "you can only react to what was ALREADY sent when you\'re replying in the moment, not messages that come after" — no peeking at the future of the thread. Catching up on a group chat, one message at a time, in order: that\'s a causal mask with extra emojis.'
    },
    why: 'Every token plays three roles — query (what I need), key (what I advertise), value (what I actually hand over) — and every token runs this against every OTHER token at once, not just one direction. Scale the scores by √dk so no single strong match steamrolls the rest; run several independent versions in parallel (heads) so different relationships get read simultaneously; and mask out anything a given position shouldn\'t be allowed to see (future tokens for a generator, padding for a batch). That whole paragraph IS self-attention — everything else in this lesson is precision on those five sentences.'
  },
  storyAnim: {
    title: 'Every glyph reads every glyph',
    h: 260,
    props: [
      { id: 'g1', emoji: '🪨', label: 'glyph 1: "beneath"', x: 12, y: 16 },
      { id: 'g2', emoji: '🪨', label: 'glyph 2: "the"', x: 34, y: 16 },
      { id: 'g3', emoji: '🪨', label: 'glyph 3: "sea"', x: 56, y: 16 },
      { id: 'g4', emoji: '🪨', label: 'glyph 4: "lies"', x: 78, y: 16 },
      { id: 'scale', emoji: '⚖️', label: '÷ √dk (calming factor)', x: 45, y: 44 },
      { id: 'out1', emoji: '✨', label: 'glyph 1: NEW meaning (blended)', x: 12, y: 78 },
      { id: 'mask', emoji: '🖐️', label: 'no peeking ahead (causal mask)', x: 78, y: 78 }
    ],
    actors: [
      { id: 'robin', emoji: '🌸', label: 'Robin', x: 45, y: 60 }
    ],
    steps: [
      { c: 'Every glyph now plays three roles at once: Query (what do I need?), Key (what do I advertise?), Value (what do I actually hand over?).', p: { g1: 'lit', g2: 'lit', g3: 'lit', g4: 'lit' } },
      { c: 'Glyph 1 ("beneath") sends its query against EVERY other glyph\'s key, all at once — a full n×n cross-check, not one comparison at a time.', p: { g3: 'good', g1: 'lit' }, l: { g1: 'query: "what is beneath?"' } },
      { c: 'First trial: no dampening. One strong match dominates completely — every glyph fixates on just one neighbor. Too sharp.', p: { g3: 'bad' }, l: { scale: 'MISSING — scores too sharp!' } },
      { c: 'Add the /√dk scale before softmax. Scores settle into a rich, multi-way blend instead of single fixations.', p: { scale: 'good', g2: 'good', g3: 'good', g4: 'dim' }, l: { scale: '÷ √dk applied ✓' } },
      { c: 'Glyph 1\'s new meaning is the softmax-weighted blend of every glyph\'s VALUE — mostly "sea", a little "the", barely "lies".', p: { out1: 'good' }, l: { out1: 'α = [–, 0.1, 0.75, 0.05, 0.1]' } },
      { c: 'Training an apprentice reader to predict the NEXT glyph: Robin covers later glyphs with her hand. No peeking at the future — the causal mask.', p: { mask: 'good' }, a: { robin: [70, 60] } }
    ]
  },
  tech: [
    {
      q: 'Derive precisely why dot products need the 1/√dk scale — not just "it helps", the actual variance argument.',
      a: 'Assume each component of q and k is drawn independently with mean 0 and variance 1 (the healthy-initialization regime). The dot product q·k = Σᵢ qᵢkᵢ is a sum of dk independent, zero-mean terms; by variance additivity, Var(q·k) = Σᵢ Var(qᵢkᵢ) = dk·Var(qᵢ)Var(kᵢ) = dk (since each Var(qᵢkᵢ)=E[qᵢ²]E[kᵢ²]=1 for independent zero-mean unit-variance qᵢ,kᵢ). So the standard deviation of a raw dot product score grows as √dk — at dk=64 that\'s already a spread of ~8, easily producing scores 20-30 apart before softmax, which makes softmax(scores) collapse to a near one-hot vector (the largest score\'s exponential dwarfs the rest) regardless of whether that sharp preference is actually justified by the data. Dividing every score by √dk rescales the variance back to 1 (Var(q·k/√dk) = dk/dk = 1) independent of dk, keeping softmax inputs in the range where its gradient is informative rather than saturated. It is literally the same "control the scale of what enters a saturating nonlinearity" principle as input normalization (Part 2) and batch/layer norm (Part 3), applied to attention scores specifically.'
    },
    {
      q: 'Why split into multiple heads instead of using one attention computation with the full d_model dimension?',
      a: 'Two separate justifications, both worth having ready. (1) Representational: a single attention head produces ONE softmax distribution per query — one "opinion" about who\'s relevant. Language needs multiple simultaneous, sometimes-incompatible notions of relevance (syntactic head, coreference antecedent, matching delimiter); one head physically cannot represent two different weightings over the same tokens at once, but h independent heads, each with their own learned Wq/Wk/Wv, can each converge on a different useful notion of "relevant" because their gradients are independent. (2) Nearly free: splitting d_model into h heads of size dk=d_model/h and running attention h times, then concatenating and projecting with Wo, costs essentially the SAME total parameters and FLOPs as one full-width head (the QKV projection matrices\' total size is unchanged; only how they\'re grouped into separate softmax computations changes). So multi-head attention buys representational diversity at close to zero extra cost — an unusually good trade, and part of why it\'s universal rather than an optional refinement.'
    },
    {
      q: 'What exactly does the causal mask change in the matrix computation, mechanically?',
      a: 'Before softmax, the n×n score matrix S = QKᵀ/√dk gets a mask matrix M added elementwise, where M[i,j] = 0 if position j ≤ position i (j is allowed — "in the past or present relative to query i") and M[i,j] = −∞ if j > i (future — forbidden). Softmax(S+M) then assigns exp(−∞)=0 weight to every forbidden position automatically — no weight is manually zeroed after the fact, which matters because doing it before softmax keeps the whole operation differentiable and numerically well-behaved (in practice a large negative number like −1e9 is used instead of literal infinity to avoid NaN from −∞ − −∞ = NaN in edge cases). The resulting weight matrix is strictly lower-triangular (row i only has nonzero weight in columns 1..i). This is the ENTIRE mechanical difference between BERT-style bidirectional self-attention (no mask, or only a padding mask) and GPT-style causal self-attention (this triangular mask) — same formula, one additive matrix.'
    },
    {
      q: 'Compare self-attention\'s O(n²) cost to the RNN\'s O(n) — when does which actually win, and what mitigates attention\'s cost at scale?',
      a: 'RNN: O(n) sequential steps, O(1) memory per step at inference (just the running hidden state), but UNPARALLELIZABLE across time — wall-clock time on a GPU is dominated by the sequential dependency, and information from position 1 reaches position n only after surviving n-1 recurrent transformations (vanishing-gradient territory, Part 3). Self-attention: O(n²·d) time and O(n²) memory to materialize the full score matrix, but every position computes SIMULTANEOUSLY as one matmul — GPU-parallel — and any two positions are directly connected regardless of distance (O(1) path, no decay). At typical sequence lengths (hundreds to low thousands of tokens) the parallelism advantage dominates the worse big-O so decisively that RNNs lost outright. At extreme lengths (100k+ tokens) O(n²) memory becomes genuinely prohibitive — mitigations include FlashAttention (recomputes rather than materializes the full n×n matrix, an exact-math memory optimization, not an approximation), sparse/local/sliding-window attention (each token only attends to a bounded neighborhood, trading some long-range accuracy for O(n) or O(n log n) cost), and KV-caching at INFERENCE time specifically (Part 6) which avoids recomputing keys/values for already-generated tokens. Interview-ready summary: "attention traded the RNN\'s sequential O(n) for a parallel O(n²) — a clear win up to moderate lengths, and the exact reason long-context engineering is a live research area."'
    }
  ],
  code: {
    title: 'Scaled dot-product attention in numpy — the full formula',
    intro: 'Q, K, V projected from the same input X — this is self-attention, not cross-attention, and every line maps directly onto the formula above.',
    code: `import numpy as np

def softmax_rows(S):
    S = S - S.max(axis=-1, keepdims=True)   # stability, per row
    E = np.exp(S)
    return E / E.sum(axis=-1, keepdims=True)

def self_attention(X, Wq, Wk, Wv, mask=None):
    Q, K, V = X @ Wq, X @ Wk, X @ Wv        # (n, dk), (n, dk), (n, dv)
    dk = Q.shape[-1]
    scores = (Q @ K.T) / np.sqrt(dk)         # (n, n) — every query vs every key
    if mask is not None:
        scores = scores + mask               # mask: 0 where allowed, -1e9 where forbidden
    weights = softmax_rows(scores)           # each row sums to 1
    return weights, weights @ V              # (n, n), (n, dv)

n, d_model, dk = 4, 8, 4
X  = np.random.randn(n, d_model)
Wq = np.random.randn(d_model, dk) * 0.1
Wk = np.random.randn(d_model, dk) * 0.1
Wv = np.random.randn(d_model, dk) * 0.1

weights, out = self_attention(X, Wq, Wk, Wv)
print("attention weights (rows sum to 1):\\n", weights.round(2))

# causal mask: position i cannot see position j > i
causal = np.triu(np.full((n, n), -1e9), k=1)   # upper triangle (excl. diagonal) = -1e9
weights_causal, out_causal = self_attention(X, Wq, Wk, Wv, mask=causal)
print("causal weights (strictly lower-triangular):\\n", weights_causal.round(2))`,
    notes: [
      'Q @ K.T computes ALL n² pairwise scores in one matmul — this is the operation that made the RNN\'s sequential loop obsolete.',
      'np.triu(..., k=1) builds the causal mask in one line: everything strictly above the diagonal (future positions) becomes -1e9, everything else stays 0.',
      'Wq, Wk, Wv are ordinary trainable parameters — nn.Linear layers in PyTorch (recall the pytorch-fundamentals lesson) — initialized small and learned entirely by backprop, exactly like every other weight matrix in this course.',
      'Swap the causal mask for a padding mask (same additive -1e9 trick, applied to padded COLUMNS for every row) and you have BERT-style bidirectional attention with batching — same function, different mask.'
    ]
  },
  lab: {
    title: 'Implement scaled dot-product self-attention, with masking',
    prompt: 'Pure Python (small matrices as lists of lists, no numpy — feel every multiply once). Implement: (1) <code>matmul(A, B)</code>; (2) <code>transpose(M)</code>; (3) <code>softmax_rows(M)</code> — softmax applied independently to each row, with the max-subtraction stability trick; (4) <code>self_attention(Q, K, V, mask=None)</code> — scores = matmul(Q, transpose(K)), each entry divided by √dk, optionally add mask (same shape, 0 or -1e9 entries) BEFORE softmax, then weights = softmax_rows(scores), output = matmul(weights, V). Return (weights, output).',
    starter: `import math

def matmul(A, B):
    # A: n x m, B: m x p -> n x p
    ...

def transpose(M):
    ...

def softmax_rows(M):
    # softmax each row independently (max-subtraction trick per row)
    ...

def self_attention(Q, K, V, mask=None):
    # scores = Q @ K^T / sqrt(dk)
    # if mask given, add it elementwise before softmax
    # weights = softmax_rows(scores)
    # output = weights @ V
    # return (weights, output)
    ...`,
    checks: [
      { re: 'def\\s+self_attention\\s*\\(', must: true, hint: 'Define self_attention(Q, K, V, mask=None) returning (weights, output).', pass: 'self_attention() defined' },
      { re: 'sqrt', must: true, hint: 'Divide scores by sqrt(dk) — this is THE scaling correction, not optional. Use math.sqrt.', pass: 'scaling by sqrt(dk) present' },
      { re: 'def\\s+softmax_rows\\s*\\(', must: true, hint: 'softmax must be applied per ROW, independently — each query\'s distribution is separate.', pass: 'softmax_rows defined' },
      { re: 'mask', must: true, hint: 'Handle the optional mask argument — add it to scores before softmax so masked positions get ~0 weight.', pass: 'mask handling present' },
      { re: 'import\\s+numpy', must: false, hint: 'Pure Python here — numpy is fine once you understand every entry by hand.', pass: 'From scratch ✓' }
    ],
    tests: `# softmax_rows: each row is an independent distribution summing to 1
M = softmax_rows([[1.0, 2.0, 3.0], [0.0, 0.0, 0.0]])
assert all(abs(sum(row) - 1.0) < 1e-9 for row in M)
assert M[1][0] == M[1][1] == M[1][2], "equal scores -> uniform row"

# identical keys -> every query attends uniformly (no basis to prefer any position)
Q = [[1.0, 0.0], [0.0, 1.0]]
K = [[1.0, 1.0], [1.0, 1.0], [1.0, 1.0]]
V = [[1.0, 0.0], [0.0, 1.0], [2.0, 2.0]]
weights, out = self_attention(Q, K, V)
assert all(abs(w - 1/3) < 1e-6 for row in weights for w in row), f"expected uniform: {weights}"

# a query that strongly matches one key locks onto that key's value
Q2 = [[10.0, 0.0]]
K2 = [[10.0, 0.0], [0.0, 10.0]]
V2 = [[1.0, 0.0], [0.0, 1.0]]
w2, out2 = self_attention(Q2, K2, V2)
assert w2[0][0] > 0.999, f"should lock onto key 0: {w2}"
assert out2[0][0] > 0.999 and out2[0][1] < 0.001

# causal mask: query 0 must NOT attend to key 1 (the future)
Q3 = [[1.0, 0.0], [1.0, 0.0]]
K3 = [[1.0, 0.0], [1.0, 0.0]]
V3 = [[1.0, 1.0], [9.0, 9.0]]
causal_mask = [[0.0, -1e9], [0.0, 0.0]]   # row 0 can only see col 0; row 1 sees both
w3, out3 = self_attention(Q3, K3, V3, mask=causal_mask)
assert w3[0][1] < 1e-6, f"position 0 must not see position 1: {w3}"
assert abs(out3[0][0] - 1.0) < 1e-6, "position 0's output must come only from value 0"
print("scaled dot-product attention, with masking. You have implemented the transformer's core op.")`,
    runnable: true,
    solution: `import math

def matmul(A, B):
    n, m, p = len(A), len(B), len(B[0])
    return [[sum(A[i][k] * B[k][j] for k in range(m)) for j in range(p)] for i in range(n)]

def transpose(M):
    return [[M[i][j] for i in range(len(M))] for j in range(len(M[0]))]

def softmax_rows(M):
    out = []
    for row in M:
        m = max(row)
        es = [math.exp(x - m) for x in row]
        s = sum(es)
        out.append([e / s for e in es])
    return out

def self_attention(Q, K, V, mask=None):
    dk = len(Q[0])
    scores = matmul(Q, transpose(K))
    scores = [[v / math.sqrt(dk) for v in row] for row in scores]
    if mask is not None:
        scores = [[scores[i][j] + mask[i][j] for j in range(len(scores[i]))] for i in range(len(scores))]
    weights = softmax_rows(scores)
    output = matmul(weights, V)
    return weights, output`,
    notes: [
      'This IS the transformer\'s only new mathematical idea. Everything else in the architecture (next lesson) is stacking this op with residual connections, normalization, and feedforward layers you already know.',
      'The causal-mask test is the whole GPT-vs-BERT distinction in five lines: add -1e9 to forbidden score entries, and softmax does the rest — zero weight, no gradient leak from the future.',
      'Try feeding Q=K=V (literally the same matrix) — that\'s self-attention in the strictest sense: a sequence attending to itself with no separate projections. The lab keeps Q, K, V separate because in the real transformer they ARE separate (projected by different learned matrices), even though they start from the same input X.'
    ]
  },
  quiz: [
    {
      q: 'In self-attention, where do Q, K, and V come from?',
      options: ['All three are learned linear projections (Wq, Wk, Wv) of the SAME input sequence X', 'Q comes from a decoder, K and V come from an encoder', 'Q and K are fixed one-hot vectors; only V is learned', 'They are three different pretrained embedding tables'],
      correct: 0,
      explain: 'Same X, three different learned projections — that "self" is what makes it self-attention rather than cross-attention (last lesson\'s decoder-queries-encoder setup).'
    },
    {
      q: 'Why divide the dot-product scores by √dk before softmax?',
      options: ['Because raw dot-product variance grows with dk, and unscaled scores push softmax into a saturated, near one-hot regime with vanishing gradients', 'To make the attention weights add up to more than 1', 'To convert the scores into probabilities directly, without softmax', 'Purely a historical convention with no mathematical justification'],
      correct: 0,
      explain: 'Var(q·k) ≈ dk under standard assumptions; dividing by √dk restores unit variance regardless of dk, keeping softmax in its gradient-rich range.'
    },
    {
      q: 'What does multi-head attention buy you, and at roughly what extra cost?',
      options: ['Several independent, specialized attention patterns computed in parallel, at close to zero extra parameters/FLOPs versus one full-width head', 'A guaranteed accuracy improvement, at roughly h times the parameters', 'The ability to process longer sequences without more memory', 'Nothing measurable — it is purely a regularization trick'],
      correct: 0,
      explain: 'Splitting d_model into h heads of size d_model/h keeps total QKV parameter count the same as one full head; you get h independently-trainable notions of "relevant" for nearly free.'
    },
    {
      q: 'What is the single mechanical difference between BERT-style and GPT-style self-attention?',
      options: ['GPT applies a causal mask (each position may only attend to itself and earlier positions); BERT applies no such mask (full bidirectional attention)', 'GPT uses dot-product scores; BERT uses cosine similarity', 'BERT has no Value projection', 'GPT does not use softmax'],
      correct: 0,
      explain: 'Same formula, same Q/K/V machinery — a strictly lower-triangular additive mask (−∞ / −1e9 on future positions) is the entire structural difference. Next lesson\'s whole framing.'
    },
    {
      q: 'What is the fundamental compute trade-off self-attention makes versus an RNN?',
      options: ['O(1) path length between any two positions and full GPU parallelism, at the cost of O(n²) time and memory in sequence length', 'Self-attention is strictly cheaper than an RNN in every respect', 'Self-attention requires no training, unlike an RNN', 'Self-attention cannot be used for language modeling, only classification'],
      correct: 0,
      explain: 'RNN: O(n) sequential, information decays over distance. Self-attention: O(n²) but parallel and distance-independent. A clear win at typical lengths; the reason long-context is still an active engineering problem (FlashAttention, sparse attention, KV-caching).'
    }
  ],
  pitfalls: [
    'Saying "attention is just weighted averaging" without naming Q/K/V and the scaling factor — in an interview this reads as having watched a video, not implemented the math.',
    'Forgetting the √dk scale when asked to write the formula from memory — it is the single most commonly dropped term, and dropping it silently degrades training at realistic dimensions rather than crashing loudly.',
    'Confusing self-attention (Q,K,V all from the same sequence) with cross-attention (Q from one sequence, K/V from another — last lesson\'s decoder-to-encoder attention, alive inside every encoder-decoder transformer like T5 or Whisper).',
    'Assuming more heads is strictly better. Beyond a model-size-appropriate point, adding heads without adding parameters just shrinks each head\'s dk, and very small per-head dimensions can hurt expressiveness — head count is a tuned hyperparameter, not "more is free forever".',
    'Applying the causal mask AFTER softmax instead of before (adding −∞ to scores pre-softmax vs. zeroing weights post-softmax). Post-hoc zeroing breaks the row-sums-to-1 property and silently corrupts the weighted average; the mask must be additive on the SCORES.',
    'Treating O(n²) as a purely theoretical footnote. In production, sequence length limits, latency, and memory budgets are direct, practical consequences of this term — "why can\'t we just use a 1M-token context" has a one-line quantitative answer rooted here.'
  ],
  interview: [
    {
      q: 'Write out the scaled dot-product self-attention formula and explain every term.',
      a: 'Attention(Q,K,V) = softmax(QKᵀ/√dk)·V. Q (n×dk), K (n×dk), V (n×dv) are learned linear projections of the input sequence X (Q=XWq, K=XWk, V=XWv). QKᵀ is an n×n matrix of raw compatibility scores between every query and every key, computed as one matrix multiplication. Dividing by √dk rescales score variance (which otherwise grows linearly with dk) back to O(1), keeping softmax\'s input in its gradient-informative range instead of saturating near one-hot. softmax is applied ROW-WISE, turning each query\'s n scores into a probability distribution over positions to attend to. Multiplying by V produces the output: each row is a weighted average of every position\'s value vector, weighted by that row\'s attention distribution. In self-attention specifically, Q, K, and V are all derived from the SAME sequence X — every token simultaneously queries, is queried, and contributes content.'
    },
    {
      q: 'Why do we need separate Query, Key, and Value projections instead of using the raw token embeddings directly for everything?',
      a: 'Three distinct jobs would otherwise be forced onto one vector. A token\'s query encodes "what context do I need" (e.g. a pronoun looking for its antecedent), its key encodes "what do I signal to others looking for something like me" (a candidate antecedent advertising its noun-type and number/gender), and its value encodes "what actual content should flow to whoever matches with me" (the antecedent\'s real semantic payload). These can require genuinely different geometric arrangements in vector space — the query pattern for "looking for an antecedent" need not resemble the key pattern for "being a valid antecedent" even for the same word playing different roles in different sentences. Three independent learned linear maps (Wq, Wk, Wv) give the model three separate, independently-trainable degrees of freedom to represent these roles, rather than compressing all three into one shared representation. It is the same principle as word2vec\'s separate "center" and "context" vectors per word, extended to a third role.'
    },
    {
      q: 'Explain multi-head attention and why it tends to outperform single-head attention of the same total size.',
      a: 'Multi-head attention runs h independent scaled dot-product attention computations in parallel, each with its own learned Wq/Wk/Wv projecting into a smaller dk=d_model/h-dimensional space, then concatenates the h outputs and applies one shared output projection Wo to mix them back to d_model dimensions. The key insight: a single attention head produces exactly ONE softmax distribution per query token — one notion of "who is relevant". But relevance in language is multi-faceted (a token may need to simultaneously attend to its syntactic head, a coreferent, and a matching delimiter) and these can require conflicting weightings over the same set of tokens, which one distribution cannot represent. Because each head has independently-trained projection matrices, gradient descent is free to let different heads specialize in different relational patterns — empirically, visualization of trained transformers shows heads that reliably attend to adjacent tokens, to sentence subjects, or to matching brackets/quotes, with no explicit supervision for any of it. Crucially, splitting d_model into h heads of size d_model/h keeps the total parameter count and FLOPs essentially unchanged versus one full-width head, so this representational diversity is close to free.'
    },
    {
      q: 'What is the causal mask, why is it needed for language generation, and how is it implemented?',
      a: 'A causal (look-ahead) mask restricts a decoder\'s self-attention so that the representation for position i can only attend to positions 1..i, never i+1 onward. It is needed because autoregressive language models are trained to predict token t from tokens 1..t-1 — if a position could attend to future tokens during training, the model could trivially "cheat" by copying the answer instead of learning to predict it, and at inference time those future tokens don\'t exist yet anyway (they haven\'t been generated), so a model trained without the restriction would face a train/inference mismatch it never saw. Implementation: before softmax, add a mask matrix to the raw score matrix QKᵀ/√dk, where entry (i,j) is 0 if j≤i (allowed) and a large negative number like -1e9 if j>i (forbidden) — after softmax, exp(-1e9)≈0, so forbidden positions receive essentially zero attention weight, and the operation remains fully differentiable since the masking happens via addition on the scores rather than a hard post-softmax zeroing step. This single triangular mask is the entire structural distinction between GPT-style causal self-attention and BERT-style bidirectional self-attention, which uses no such mask (only an optional padding mask) — same underlying formula in both cases.'
    }
  ]
};
