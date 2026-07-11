window.LESSONS = window.LESSONS || {};
window.LESSONS['transformer-architecture'] = {
  id: 'transformer-architecture',
  title: 'The Transformer Architecture, Layer by Layer',
  category: 'Part 5 — Transformers',
  timeMin: 60,
  summary: 'Self-attention is the transformer\'s one new idea. Everything else in "Attention Is All You Need" is assembly: stack attention with residual connections, layer normalization, a small feedforward network, and positional encodings (since attention alone has no sense of order), repeat N times. This lesson builds the whole block from parts you already own, then explains why each piece is load-bearing.',
  goals: [
    'Explain why attention alone has no notion of token order, and how positional encoding fixes it',
    'Describe the transformer block: self-attention → add & norm → feedforward → add & norm',
    'Explain WHY residual connections and layer norm are necessary for training deep stacks of these blocks',
    'Describe the encoder stack vs the decoder stack, and where cross-attention fits in a full encoder-decoder transformer',
    'Trace a token from input embedding to output logits through the entire architecture, naming every step'
  ],
  concept: [
    {
      h: 'The missing piece: attention has no idea what "order" means',
      p: [
        'Look at the self-attention formula again: softmax(QKᵀ/√dk)·V. Every term is a function of CONTENT (the token embeddings, via Q/K/V), never POSITION. Shuffle the input tokens and shuffle the output rows identically — the computation is exactly permutation-equivariant. That is a real problem: "the dog bit the man" and "the man bit the dog" have identical token sets and would produce IDENTICAL attention patterns keyed only on content, despite meaning opposite things. An RNN got word order for free (it processes left to right, sequentially); attention throws that away in exchange for parallelism, and now has to buy order back explicitly.',
        'The fix: <b>positional encoding</b>. Before the first attention layer, ADD a position-dependent vector to each token\'s embedding — now "dog" at position 2 and "dog" at position 5 have DIFFERENT input vectors, and every downstream computation (including attention scores) can, in principle, use that difference to recover order. The original transformer paper used a fixed (non-learned) formula built from sines and cosines of different frequencies per dimension:',
        '<div class="math">PE(pos, 2i) = sin(pos / 10000^(2i/d))&nbsp;&nbsp;&nbsp;PE(pos, 2i+1) = cos(pos / 10000^(2i/d))<span class="mnote">each dimension oscillates at a different frequency — low dimensions change fast (fine position resolution), high dimensions change slowly (coarse position resolution), like a binary-clock encoding of position spread across many wavelengths</span></div>',
        'Two properties made this specific formula attractive rather than arbitrary: it produces a unique vector for every position (up to very long sequences), and — the clever part — PE(pos+k) can be expressed as a LINEAR function of PE(pos), which the paper\'s authors hoped would let attention learn to attend by RELATIVE position (e.g. "3 tokens back") via simple linear operations on the encoding. In practice, modern models increasingly use LEARNED positional embeddings (a plain lookup table trained like any other embedding, same mechanism as the word-embeddings lesson) or relative-position schemes (RoPE, ALiBi) that inject position information directly into the attention computation itself rather than into the input — worth knowing the fixed-formula story for interviews, worth knowing it\'s not the only or even the most common modern choice.'
      ]
    },
    {
      h: 'The transformer block: attention + feedforward, wrapped in residuals and norm',
      p: [
        'One transformer block (also called a "layer", stacked N times — 12, 24, 96+ depending on model size) is exactly four sub-steps applied to the running sequence representation X:',
        '<div class="math">X₁ = LayerNorm(X + MultiHeadAttention(X))&nbsp;&nbsp;&nbsp;(1) attend, (2) residual add, (3) normalize<br>X₂ = LayerNorm(X₁ + FeedForward(X₁))&nbsp;&nbsp;&nbsp;(4) per-token MLP, same add-and-norm pattern</div>',
        'The <b>feedforward network</b> (also "FFN" or "MLP block") is refreshingly ordinary — it\'s the plain multi-layer perceptron from the neural-networks lesson, applied INDEPENDENTLY to every token\'s vector (same weights reused at every position, no mixing across positions — attention already did all the cross-token mixing): a linear layer up to a wider hidden size (commonly 4× d_model), a nonlinearity (ReLU or GELU), then a linear layer back down. Attention decides WHAT information to gather from where; the FFN then processes each token\'s gathered information further, independently. Rule of thumb worth stating in interviews: attention mixes ACROSS positions, the FFN mixes WITHIN a position\'s features — the two sub-layers do complementary jobs, and most of a transformer\'s parameters actually live in the FFN, not the attention weights.'
      ]
    },
    {
      h: 'Residual connections: why "X +" is not optional',
      p: [
        'Notice both sub-layers are wrapped as X + Sublayer(X), not just Sublayer(X) — a <b>residual (skip) connection</b>, first popularized by ResNet (the cnn-rnn-tour lesson\'s feature-hierarchy discussion) and essential here for the same reason: stacking dozens of layers makes gradients travel a long path backward through the chain rule (the backpropagation lesson), and without a shortcut, each layer\'s Jacobian multiplies in, risking vanishing or exploding gradients purely from DEPTH, independent of sequence length. The residual path gives gradients a direct, untransformed route: ∂Loss/∂X gets a term straight from ∂Loss/∂X₁ with NO sub-layer transformation in between (the "+X" term differentiates to identity), so even if a particular attention or FFN sub-layer\'s gradient is small, the total gradient reaching X does not vanish. It also gives every layer an easy fallback: if a sub-layer has nothing useful to add at some position, it can learn to output near-zero and the residual just passes the input through unchanged — depth becomes "safe to add" rather than "risky to add", which is exactly why 96-layer transformers are trainable at all.'
      ]
    },
    {
      h: 'Layer normalization: keeping every layer\'s inputs well-behaved',
      p: [
        'Recall <b>LayerNorm</b> from the training-neural-nets lesson: for each token\'s vector independently, subtract its mean and divide by its standard deviation across the FEATURE dimension, then apply a learned scale and shift (γ, β). Why per-token rather than per-batch (BatchNorm)? Sequence lengths vary, batches get padded, and BatchNorm\'s statistics would mix real tokens with padding and depend on batch composition — LayerNorm\'s statistics are computed independently per token, making it indifferent to batch size, sequence length, and padding, which is exactly the robustness a variable-length-sequence architecture needs.',
        'Placement matters and has a name: the formula above is "post-norm" (normalize AFTER the residual add — the original 2017 paper\'s choice). Most modern large models use "pre-norm" instead — LayerNorm(X) fed INTO the sub-layer, with the raw X added back afterward: X₁ = X + MultiHeadAttention(LayerNorm(X)). Pre-norm keeps an even cleaner, unnormalized gradient super-highway through the residual stream and empirically trains more stably at very large depth — if you read a modern model\'s architecture diagram (GPT, LLaMA) and the norm looks like it\'s "inside" the block rather than "after" it, that\'s pre-norm, and it\'s worth naming as the more common modern default.'
      ]
    },
    {
      h: 'Encoder stack, decoder stack, and where cross-attention lives',
      p: [
        'The original transformer, built for translation, has TWO stacks. The <b>encoder</b> stack (N blocks of: self-attention with NO mask [full bidirectional — every token sees every other token] → FFN) reads the source sentence and produces a final contextualized representation of every source token — this is BERT\'s entire architecture, next lesson\'s topic. The <b>decoder</b> stack (N blocks of: CAUSAL self-attention [masked, GPT-style] → CROSS-attention → FFN) generates the target sentence one token at a time.',
        'Cross-attention is the direct upgrade of the seq2seq-attention lesson\'s mechanism into transformer form: same scaled-dot-product formula, but Q comes from the DECODER\'s current representation while K and V come from the ENCODER\'s final output — the decoder queries the source, exactly like Bahdanau attention, just computed as one parallel matmul with learned projections instead of a hand-rolled score function. So a full encoder-decoder transformer block sequence is: self-attend to what I\'ve generated so far (causal) → attend to the source (cross) → process (FFN). Three sub-layers instead of two, otherwise identical machinery.',
        'Not every transformer uses both stacks. Encoder-only models (BERT) drop the decoder and causal masking entirely — good for understanding tasks (classification, the classic-nlp-tasks lesson\'s pipelines). Decoder-only models (GPT, LLaMA, and effectively every modern large language model) drop the encoder and cross-attention entirely, keeping ONLY causal self-attention + FFN, stacked deep — good for generation, and it turns out good enough at understanding too when scaled up, which is most of why decoder-only architecture won the LLM era. That split is the entirety of next lesson.'
      ]
    },
    {
      h: 'One token\'s full journey, start to finish',
      p: [
        'Concrete trace, tying every prior lesson together: a raw string is split into subword tokens (BPE, the tokenization lesson) → each token ID is looked up in a learned embedding table (the word-embeddings lesson\'s table, now trained end-to-end rather than pre-trained separately) → a positional encoding is ADDED (this lesson) → the resulting matrix enters the first transformer block: multi-head self-attention (last lesson) with a residual connection and LayerNorm, then a feedforward network with another residual connection and LayerNorm → repeat for N blocks, each one refining every token\'s representation using an ever richer contextual picture of the whole sequence → after the final block, a linear layer projects each position\'s final vector to vocabulary-size logits → softmax turns logits into a probability distribution over the next token (for a decoder) or a task label (for a classifier head, the classic-nlp-tasks lesson). Every arrow in that chain is a concept you have implemented by hand somewhere in this course.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Poneglyph reading room gets a floor plan',
      text: 'After the crew\'s breakthrough — glyphs reading each other via query/key/value — Franky is asked to build a permanent reading room so this can happen reliably, at scale, for stones far longer than one temple wall. His blueprint reveals every piece this lesson needs. First problem he catches: laid out on a table, glyphs read each other by CONTENT alone and have no sense of ORDER — "beneath the sea" and "the sea beneath" would be read identically, since nothing marks WHERE each glyph sits in the sentence. Franky\'s fix: stamp every glyph, before anything else happens, with a small positional marker etched at a different rhythm depending on its slot in the line — glyph 1 gets one pattern, glyph 2 a slightly different one, and so on, so position is baked into the glyph\'s appearance before any reading begins (positional encoding, added to the embedding). Second, he designs the room as repeatable FLOORS, stacked: each floor does the same two jobs — a round of glyphs-read-each-other (self-attention), then a private "each glyph thinks it over alone" desk pass (the feedforward network, same processing applied to every glyph independently). Third, and this is the part Franky is proudest of: he installs a SUPER through-beam on every floor — a direct structural support running straight from a floor\'s input to its output, so that even if a floor\'s reading-and-thinking process contributes nothing useful for a particular glyph, the glyph\'s information still passes through undamaged rather than getting lost in a badly-tuned floor (the residual connection — "even a floor that does NOTHING can\'t break the building," Franky explains, tapping the beam). Fourth, he adds a leveling gauge at the top of every floor that rescales each glyph\'s signal back to a sane range before it enters the next floor, so tall towers of many floors don\'t drift wildly out of proportion by floor forty (LayerNorm). Finally, Franky reveals TWO separate towers: a READING tower (bidirectional — every glyph sees the whole inscription at once, for pure comprehension) and a WRITING tower (a trainee translator who may only look BACKWARD at what she\'s already written, plus glance across at the reading tower\'s finished notes — cross-attention, the direct upgrade of Robin-facing-the-stone from two lessons ago) for producing a brand-new translated inscription one glyph at a time. "Understanding and generating," Franky says, "turn out to need almost the same floor plan — just wire the through-beams and the peeking-rules differently." The reading room that started as one lucky insight is now an actual, buildable, repeatable architecture.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica designs Thanksgiving so nothing gets lost, no matter how big the guest list gets',
      text: 'After discovering the gang could self-organize who-needs-what over group text, Monica is asked to scale it up to hosting Thanksgiving for a much bigger crowd, floor by floor, without chaos. She notices the same missing-order problem first: if everyone just reads everyone\'s texts by CONTENT, there\'s no way to tell who spoke FIRST — "I\'ll bring the pie" reads the same whether it was the opening offer or a last-minute correction, and that matters. Her fix: give every message an explicit little timestamp tag, position baked right into it before anyone reads anything (positional encoding). She then designs the whole evening as repeatable ROUNDS: each round is one pass of everybody-reads-everybody (self-attention) followed by a quiet moment where each person privately processes what they just heard on their own (the feedforward pass — same "think it over" step, applied to each guest independently, no cross-talk). Her genius addition, which she explains proudly to Chandler: no matter how badly a round goes — even if a round\'s conversation is totally useless to someone — that guest\'s original plans and opinions are NEVER discarded, they\'re carried forward automatically to the next round untouched, layered on top of whatever the round added (Monica\'s "nobody\'s original idea gets lost" rule = the residual connection). And after every round, she does a quick temperature-check reset so nobody\'s stress level has quietly spiraled out of proportion by round six (LayerNorm, sitcom edition — keeping everyone "normalized" before the next round). By the end, she\'s built a repeatable, stackable system: order preserved, ideas never lost round over round, everyone kept in a sane emotional range — and Chandler notes that Thanksgiving planning has never sounded more like a systems diagram.'
    },
    why: 'The whole lesson in one floor plan: mark position before anything else happens (positional encoding); each floor is attend-then-think (self-attention, then a per-token feedforward pass); a through-beam guarantees nothing is ever lost even through a bad floor (residual connections); a leveling gauge keeps every floor\'s output in a sane range (LayerNorm); and there are two tower designs — bidirectional reading versus backward-looking writing that also glances at the reading tower (encoder vs. decoder, cross-attention) — which is exactly next lesson\'s split.'
  },
  storyAnim: {
    title: 'One floor of the reading room',
    h: 280,
    props: [
      { id: 'glyphs', emoji: '🪨', label: 'input tokens', x: 10, y: 12 },
      { id: 'pos', emoji: '📍', label: '+ positional encoding', x: 32, y: 12 },
      { id: 'attn', emoji: '👁️', label: 'multi-head self-attention', x: 55, y: 30 },
      { id: 'beam1', emoji: '🏗️', label: 'residual through-beam', x: 55, y: 50 },
      { id: 'norm1', emoji: '📏', label: 'LayerNorm', x: 78, y: 50 },
      { id: 'ffn', emoji: '🧮', label: 'feedforward (per-token)', x: 55, y: 70 },
      { id: 'beam2', emoji: '🏗️', label: 'residual through-beam', x: 78, y: 70 },
      { id: 'norm2', emoji: '📏', label: 'LayerNorm', x: 78, y: 88 },
      { id: 'out', emoji: '✨', label: 'refined representation → next floor', x: 55, y: 96 }
    ],
    actors: [
      { id: 'franky', emoji: '🤖', label: 'Franky', x: 10, y: 60 }
    ],
    steps: [
      { c: 'Raw glyphs alone have no sense of order. Franky stamps each one with a position marker BEFORE anything else happens.', p: { glyphs: 'lit', pos: 'lit' } },
      { c: 'Floor step 1: every glyph reads every other glyph at once — multi-head self-attention (last lesson\'s full formula).', p: { attn: 'lit' }, a: { franky: [40, 30] } },
      { c: 'A through-beam runs straight from the floor\'s input to past this step — even a badly-tuned attention pass can\'t destroy the glyph\'s original signal.', p: { beam1: 'good' } },
      { c: 'A leveling gauge rescales the combined signal back to a sane range before continuing.', p: { norm1: 'good' } },
      { c: 'Floor step 2: each glyph privately "thinks it over" alone — the feedforward network, same weights applied to every position independently, no cross-talk.', p: { ffn: 'lit' }, a: { franky: [40, 70] } },
      { c: 'Another through-beam, another leveling gauge — the exact same pattern, twice per floor.', p: { beam2: 'good', norm2: 'good' } },
      { c: 'The refined representation heads to the NEXT floor. Stack this whole unit N times — 12, 24, 96 — and you have the transformer.', p: { out: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'The mechanism, step by step: one floor of the reading room',
    intro: 'Click any box to jump straight there, or press Play and just listen.',
    stages: [
      {
        label: 'Add position',
        nodes: [
          { id: 'pos', text: '+ positional encoding\nbefore anything else — content alone has no order' },
        ],
      },
      {
        label: 'Self-attention',
        nodes: [
          { id: 'attn', text: 'Multi-head self-attention\nevery token reads every other token at once' },
        ],
      },
      {
        label: 'Residual + norm',
        nodes: [
          { id: 'resnorm1', text: 'X + Attention(X), then LayerNorm\nthrough-beam: nothing is ever lost' },
        ],
      },
      {
        label: 'Feedforward',
        nodes: [
          { id: 'ffn', text: 'Feedforward (per-token)\nsame weights, every position, no cross-talk' },
        ],
      },
      {
        label: 'Residual + norm',
        nodes: [
          { id: 'resnorm2', text: 'X₁ + FFN(X₁), then LayerNorm\nsame through-beam pattern, again' },
        ],
      },
      {
        label: 'Stack ×N',
        nodes: [
          { id: 'stack', text: 'Repeat this whole floor N times\n12, 24, 96+ — the transformer' },
        ],
      },
    ],
    steps: [
      { active: ['pos'], note: 'Self-attention alone is permutation-equivariant — it has no idea what order tokens came in. A position-dependent vector gets added to every token\'s embedding BEFORE the first attention layer, so order is baked in from the start.' },
      { active: ['attn'], note: 'Multi-head self-attention (last lesson\'s full Q/K/V formula): every token gathers a weighted blend of information from every other token, all as one parallel computation.' },
      { active: ['resnorm1'], note: 'Wrap it as X + Attention(X), then LayerNorm. The residual "through-beam" guarantees the original signal survives even if this particular attention pass has nothing useful to add — depth becomes safe to add.' },
      { active: ['ffn'], note: 'A plain per-token MLP — same weights reused at every position, zero mixing across tokens (attention already did all the cross-token communication). Attention mixes ACROSS positions; the FFN mixes WITHIN one.' },
      { active: ['resnorm2'], note: 'The exact same wrap, again: X₁ + FFN(X₁), then LayerNorm. Two sub-layers, same residual+norm pattern both times — that\'s the whole shape to memorize.' },
      { active: ['stack'], note: 'Stack this entire floor N times, each one refining every token\'s representation with an ever-richer contextual picture. 12 floors, 24, 96+ — that repetition, plus a final linear+softmax layer, is the transformer.' },
    ],
  },
  tech: [
    {
      q: 'Why can\'t attention alone represent word order, and is positional encoding the only fix?',
      a: 'Self-attention\'s output for position i is a weighted sum over VALUE vectors, with weights computed from CONTENT-based dot products (Q·K) — nowhere in QKᵀ/√dk·V does an index "i" or "j" appear as a number; the whole computation is invariant to permuting the input rows (permute X\'s rows, and the output rows permute identically with the same values — a mathematical fact called permutation equivariance). So without an explicit signal, "the cat sat on the mat" and any shuffled version would be processed with identical PER-POSITION computations relative to their new arrangement — the model literally cannot distinguish subject-verb-object order from a bag of words using attention alone. Positional encoding isn\'t the only fix: (1) the classic sinusoidal formula (added to embeddings, this lesson); (2) LEARNED absolute positional embeddings (a trainable lookup table by position index, used by BERT and GPT-2); (3) RELATIVE position schemes like RoPE (rotary position embedding, used by LLaMA and most modern LLMs) or ALiBi, which inject position information directly into the attention score computation (as a function of the DISTANCE between query and key positions) rather than into the input embedding — these tend to generalize better to sequence lengths longer than seen in training, which is a live reason modern models favor them over the original fixed sinusoidal scheme.'
    },
    {
      q: 'Explain precisely why residual connections make very deep transformer stacks trainable, using the chain rule.',
      a: 'For a sub-layer output Y = X + F(X) (F being attention or the FFN), the gradient of the loss with respect to X, by the chain rule, is ∂L/∂X = ∂L/∂Y · (I + ∂F/∂X) = ∂L/∂Y + ∂L/∂Y·∂F/∂X — an IDENTITY term plus a sub-layer term. Chain this through N stacked blocks and the gradient reaching the very first block always retains that additive identity path all the way back, regardless of how small any individual ∂F/∂X term is. Contrast with a plain (non-residual) deep stack Y=F(X), where the gradient is a PRODUCT of N Jacobians ∂L/∂X = ∂L/∂Y·∂Fɴ/∂X·…·∂F₁/∂X — if any of those Jacobians tends to have eigenvalues below 1 (very plausible after a nonlinearity or attention\'s softmax saturating), the product shrinks geometrically with depth, exactly the vanishing-gradient mechanism from the backpropagation lesson, now driven by depth rather than sequence length. Residuals convert a PRODUCT of Jacobians into a SUM containing an identity term, which is the difference between "gradients shrink exponentially with depth" and "gradients have a guaranteed lower bound" — the mechanism that makes 96-layer transformers trainable at all, first proven out at similar depths by ResNet in vision (cnn-rnn-tour lesson).'
    },
    {
      q: 'Pre-norm vs post-norm — what changes, and why did the field move toward pre-norm?',
      a: 'Post-norm (2017 original): X₁ = LayerNorm(X + Sublayer(X)) — normalization happens AFTER the residual add, so the residual stream itself gets renormalized at every layer. Pre-norm: X₁ = X + Sublayer(LayerNorm(X)) — normalization happens only INSIDE the sub-layer\'s input, and the raw, un-normalized X is what actually flows through the residual path. The practical difference: in pre-norm, the residual stream (the "+X" path) is a completely clean, unmodified additive gradient highway all the way from output to input, since it is never itself passed through a LayerNorm; in post-norm, that highway gets renormalized at every single layer, which in practice makes very deep post-norm stacks harder to train without careful learning-rate warmup (recall the training-neural-nets lesson\'s warmup discussion — post-norm transformers are the textbook case that motivated it) and more prone to instability at large depth/scale. Nearly all modern large language models (GPT-2 onward, LLaMA, etc.) use pre-norm specifically because it trains more stably at the depths and scales those models operate at, at a mild cost in final-layer representation quality that\'s usually addressed with one extra final LayerNorm after the whole stack.'
    },
    {
      q: 'In a full encoder-decoder transformer, trace exactly what Q, K, V are at each of the decoder\'s two attention sub-layers.',
      a: 'The decoder block has TWO attention sub-layers, not one, and they use different sources for Q/K/V. Sub-layer 1, masked self-attention: Q, K, and V are ALL projections of the decoder\'s own running representation (what\'s been generated so far), with a causal mask so position t cannot see positions after t — this lets each decoder position build a representation informed only by legitimate prior context. Sub-layer 2, cross-attention: Q is a projection of THAT masked-self-attention sub-layer\'s output (still decoder-side — "what am I looking for in the source, given what I\'ve generated so far"), while K and V are projections of the ENCODER\'s final output (computed once, reused at every decoder step and every decoder layer) — so the decoder queries the source sentence directly, exactly mirroring the seq2seq-attention lesson\'s Bahdanau mechanism, just as one parallel matmul with learned Q/K/V projections instead of a hand-built score function. No mask is needed on cross-attention (the decoder is always allowed to see the WHOLE source — only the decoder\'s view of its OWN generated output needs to be causal). Then a shared FFN sub-layer processes the result, same as the encoder. Three sub-layers total per decoder block: masked self-attn, cross-attn, FFN — each wrapped in the usual residual+norm pattern.'
    }
  ],
  code: {
    title: 'One transformer block, top to bottom, in numpy',
    intro: 'Reusing last lesson\'s self_attention, plus positional encoding, residuals, LayerNorm, and a feedforward pass — the entire block in about twenty lines, because every piece is something you\'ve already built.',
    code: `import numpy as np

def sinusoidal_positions(n, d):
    pos = np.arange(n)[:, None]
    i = np.arange(d)[None, :]
    angle = pos / np.power(10000, (2 * (i // 2)) / d)
    pe = np.zeros((n, d))
    pe[:, 0::2] = np.sin(angle[:, 0::2])
    pe[:, 1::2] = np.cos(angle[:, 1::2])
    return pe

def layer_norm(X, gamma, beta, eps=1e-5):
    mean = X.mean(axis=-1, keepdims=True)          # per TOKEN, not per batch
    var = X.var(axis=-1, keepdims=True)
    X_hat = (X - mean) / np.sqrt(var + eps)
    return gamma * X_hat + beta

def feedforward(X, W1, b1, W2, b2):
    hidden = np.maximum(0, X @ W1 + b1)             # ReLU, widen (commonly 4x d_model)
    return hidden @ W2 + b2                          # project back down

def transformer_block(X, params):
    # 1. self-attention, residual, norm
    Q, K, V = X @ params['Wq'], X @ params['Wk'], X @ params['Wv']
    dk = Q.shape[-1]
    scores = (Q @ K.T) / np.sqrt(dk)
    weights = np.exp(scores - scores.max(-1, keepdims=True))
    weights /= weights.sum(-1, keepdims=True)
    attn_out = weights @ V
    X1 = layer_norm(X + attn_out, params['g1'], params['b1'])

    # 2. feedforward, residual, norm
    ffn_out = feedforward(X1, params['W1'], params['fb1'], params['W2'], params['fb2'])
    X2 = layer_norm(X1 + ffn_out, params['g2'], params['b2'])
    return X2

# input: 5 tokens, d_model=8 -- add positions BEFORE the first block
n, d = 5, 8
X = np.random.randn(n, d) * 0.1 + sinusoidal_positions(n, d)
# X now carries both content AND position -- ready for transformer_block(X, params)`,
    notes: [
      'layer_norm operates on axis=-1 (the feature dimension, per token) — never across the batch or sequence axis. That row-independence is exactly what makes it robust to padding and variable batch size.',
      'feedforward has NO cross-token mixing (no matmul across the n dimension) — every token is processed by the identical W1/W2, independently. All cross-token communication happened in the attention step.',
      'Both sub-layers follow X_new = LayerNorm(X + Sublayer(X)) — same pattern twice per block. Internalize that shape and you can read any transformer paper\'s diagram.',
      'Stack transformer_block N times (feeding each block\'s output as the next block\'s input) and add a final linear+softmax layer to vocabulary size, and you have a complete, if small, language model.'
    ]
  },
  lab: {
    title: 'Build sinusoidal positional encoding and a residual+norm wrapper',
    prompt: 'Pure Python. Implement (1) <code>positional_encoding(n, d)</code> — return an n×d list-of-lists using the sin/cos formula (even dims: sin, odd dims: cos, both using angle = pos / 10000^(2*(dim//2)/d)); (2) <code>add_vectors(A, B)</code> — elementwise sum of two same-shape matrices (for adding positions to embeddings, and for residual connections); (3) <code>layer_norm_row(row, eps=1e-5)</code> — normalize ONE token vector (list of floats) to zero mean, unit variance (no learned gamma/beta — just the normalization step, to keep focus on the mechanism).',
    starter: `import math

def positional_encoding(n, d):
    # return n x d matrix (list of lists)
    # even columns: sin(pos / 10000^(2*(col//2)/d))
    # odd columns:  cos(pos / 10000^(2*(col//2)/d))
    ...

def add_vectors(A, B):
    # elementwise sum, same shape
    ...

def layer_norm_row(row, eps=1e-5):
    # normalize one row to zero mean, unit variance
    ...`,
    checks: [
      { re: 'def\\s+positional_encoding\\s*\\(', must: true, hint: 'Define positional_encoding(n, d) returning an n x d matrix.', pass: 'positional_encoding() defined' },
      { re: 'sin', must: true, hint: 'Even dimensions use sin(...) — the sinusoidal formula from the lesson.', pass: 'sin present' },
      { re: 'cos', must: true, hint: 'Odd dimensions use cos(...) — even/odd dims alternate sin/cos.', pass: 'cos present' },
      { re: 'def\\s+layer_norm_row\\s*\\(', must: true, hint: 'Define layer_norm_row(row, eps=1e-5) — subtract mean, divide by std.', pass: 'layer_norm_row() defined' },
      { re: 'def\\s+add_vectors\\s*\\(', must: true, hint: 'Define add_vectors(A, B) for the residual connection and for adding positions to embeddings.', pass: 'add_vectors() defined' }
    ],
    tests: `# positional_encoding shape and range
pe = positional_encoding(4, 6)
assert len(pe) == 4 and len(pe[0]) == 6
assert all(-1.0001 <= v <= 1.0001 for row in pe for v in row), "sin/cos outputs must be in [-1, 1]"

# position 0 is special: angle = 0 for every dim -> sin(0)=0, cos(0)=1
assert all(abs(pe[0][j]) < 1e-9 for j in range(0, 6, 2)), "even dims at pos 0 should be sin(0)=0"
assert all(abs(pe[0][j] - 1.0) < 1e-9 for j in range(1, 6, 2)), "odd dims at pos 0 should be cos(0)=1"

# different positions get different encodings (order-distinguishing, the whole point)
assert pe[0] != pe[1] != pe[2], "positions must be distinguishable"

# add_vectors: elementwise, same shape
A = [[1.0, 2.0], [3.0, 4.0]]
B = [[10.0, 20.0], [30.0, 40.0]]
assert add_vectors(A, B) == [[11.0, 22.0], [33.0, 44.0]]

# layer_norm_row: zero mean, unit variance after normalizing
row = [2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0]
normed = layer_norm_row(row)
mean = sum(normed) / len(normed)
var = sum((x - mean) ** 2 for x in normed) / len(normed)
assert abs(mean) < 1e-6, f"mean should be ~0: {mean}"
assert abs(var - 1.0) < 1e-3, f"variance should be ~1: {var}"
print("positional encoding + residual add + layer norm. The non-attention half of a transformer block.")`,
    runnable: true,
    solution: `import math

def positional_encoding(n, d):
    pe = [[0.0] * d for _ in range(n)]
    for pos in range(n):
        for col in range(d):
            angle = pos / (10000 ** ((2 * (col // 2)) / d))
            pe[pos][col] = math.sin(angle) if col % 2 == 0 else math.cos(angle)
    return pe

def add_vectors(A, B):
    return [[A[i][j] + B[i][j] for j in range(len(A[0]))] for i in range(len(A))]

def layer_norm_row(row, eps=1e-5):
    mean = sum(row) / len(row)
    var = sum((x - mean) ** 2 for x in row) / len(row)
    std = math.sqrt(var + eps)
    return [(x - mean) / std for x in row]`,
    notes: [
      'Position 0 is a good sanity check by hand: angle=0 for every dimension, so sin(0)=0 fills every even column and cos(0)=1 fills every odd column — that\'s why the tests check it explicitly.',
      'add_vectors is deliberately reused for two different jobs in a real transformer: embeddings+positions (once, at the input) and every residual connection (twice per block, N blocks deep) — same one-line operation, doing structurally different jobs by context.',
      'This lab skips LayerNorm\'s learned γ, β (scale and shift) to isolate the normalization mechanism — production LayerNorm multiplies by a learned γ and adds a learned β AFTER this exact normalization, so the layer can undo the normalization if that turns out to be optimal.'
    ]
  },
  quiz: [
    {
      q: 'Why does a transformer need positional encoding at all?',
      options: ['Self-attention\'s output is invariant to the order of input tokens (permutation-equivariant) — without an explicit position signal, shuffled input order produces the same content-based attention patterns', 'Positional encoding speeds up training convergence but attention would work fine without it', 'It replaces the need for an embedding table', 'It is only needed for very short sequences'],
      correct: 0,
      explain: 'QKᵀ/√dk·V is built entirely from content dot-products — no term depends on index i or j. Order must be injected explicitly, typically by adding a position vector to each token embedding.'
    },
    {
      q: 'What does the feedforward (FFN) sub-layer do that self-attention does NOT do?',
      options: ['It processes each token\'s features independently (no mixing across positions) — attention already handled all cross-token communication', 'It computes attention scores between all token pairs', 'It generates the positional encoding', 'It applies the causal mask'],
      correct: 0,
      explain: 'Attention mixes information ACROSS positions; the FFN (an ordinary MLP, same weights at every position) then processes WITHIN each position\'s features, independently. Complementary jobs — and most transformer parameters live in the FFN.'
    },
    {
      q: 'Why are residual connections (X + Sublayer(X)) necessary for training deep transformer stacks?',
      options: ['They give the gradient an identity (unmodified) path backward through every layer, preventing the vanishing gradients that come from multiplying many small Jacobians together across depth', 'They reduce the total number of parameters in the model', 'They replace the need for layer normalization', 'They make the model\'s output deterministic'],
      correct: 0,
      explain: '∂L/∂X = ∂L/∂Y·(I + ∂F/∂X) — the identity term guarantees a non-vanishing gradient path regardless of how small any individual sub-layer\'s gradient is, across arbitrarily many stacked layers.'
    },
    {
      q: 'What is the mechanical difference between cross-attention (in a decoder) and self-attention?',
      options: ['In cross-attention, Q comes from the decoder while K and V come from the encoder\'s output; in self-attention, Q, K, and V all come from the same sequence', 'Cross-attention does not use softmax', 'Cross-attention has no scaling factor', 'Self-attention only works on the encoder, never the decoder'],
      correct: 0,
      explain: 'Cross-attention is the decoder querying the source sentence — the direct transformer-form upgrade of the seq2seq-attention lesson\'s Bahdanau mechanism. Same formula, different source for K/V.'
    },
    {
      q: 'What is the practical difference between pre-norm and post-norm transformer blocks?',
      options: ['Pre-norm applies LayerNorm to the sub-layer\'s input (keeping the residual stream itself unnormalized and a cleaner gradient path); post-norm normalizes AFTER the residual add, renormalizing the residual stream at every layer', 'Pre-norm has no residual connections at all', 'Post-norm is exclusively used in modern large language models', 'The two are mathematically identical'],
      correct: 0,
      explain: 'Pre-norm keeps a clean, un-normalized residual highway all the way through the stack, which trains more stably at large depth — the reason most modern LLMs (GPT-2 onward, LLaMA) use it despite the 2017 original being post-norm.'
    }
  ],
  testFlow: {
    title: 'Test yourself: the transformer block',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'Why does a transformer need positional encoding at all?',
        choices: [
          { text: 'Self-attention\'s output is invariant to input order (permutation-equivariant) — without an explicit signal, shuffled tokens produce the same content-based attention patterns', to: 'q1_right' },
          { text: 'It just speeds up convergence; attention would work fine without it, only slower', to: 'q1_wrong_speed' },
          { text: 'It replaces the need for an embedding table entirely', to: 'q1_wrong_replace' },
        ],
      },
      q1_right: { end: true, correct: true, text: 'Right — QKᵀ/√dk·V is built entirely from content dot-products; no term depends on position index i or j. "The dog bit the man" and "the man bit the dog" would attend identically without an explicit position signal added in.', next: 'q2' },
      q1_wrong_speed: { end: true, correct: false, text: 'It\'s not a speed optimization — without it the model literally CANNOT distinguish "the dog bit the man" from "the man bit the dog" by position at all, regardless of how long you train.', retry: 'q1' },
      q1_wrong_replace: { end: true, correct: false, text: 'Positional encoding is ADDED to the embedding table\'s output, not a replacement for it — you still need the embedding lookup for content; position is a separate signal layered on top.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'What does the feedforward (FFN) sub-layer do that self-attention does NOT do?',
        choices: [
          { text: 'It processes each token\'s features independently, with no mixing across positions — attention already handled all cross-token communication', to: 'q2_right' },
          { text: 'It computes the compatibility scores between every pair of tokens', to: 'q2_wrong_scores' },
          { text: 'It applies the causal mask that blocks future positions', to: 'q2_wrong_mask' },
        ],
      },
      q2_right: { end: true, correct: true, text: 'Exactly — attention mixes ACROSS positions; the FFN (same weights, applied identically to every position) then processes WITHIN each position\'s features, independently. Complementary jobs, and most of a transformer\'s parameters actually live in the FFN.', next: 'q3' },
      q2_wrong_scores: { end: true, correct: false, text: 'That\'s attention\'s job (QKᵀ), not the FFN\'s. The FFN runs entirely per-token — it never computes anything between different positions.', retry: 'q2' },
      q2_wrong_mask: { end: true, correct: false, text: 'The causal mask is part of the self-attention sub-layer\'s score computation, not the feedforward sub-layer. The FFN has no notion of masking — it just transforms each token vector independently.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'Why are residual connections (X + Sublayer(X)) necessary for training very deep transformer stacks?',
        choices: [
          { text: 'They give the gradient an identity path backward through every layer, preventing vanishing gradients from multiplying many small Jacobians together across depth', to: 'q3_right' },
          { text: 'They reduce the total number of trainable parameters in the model', to: 'q3_wrong_params' },
          { text: 'They make LayerNorm unnecessary, so only one of the two is needed', to: 'q3_wrong_norm' },
        ],
      },
      q3_right: { end: true, correct: true, text: '∂L/∂X = ∂L/∂Y·(I + ∂F/∂X) — that identity term guarantees a non-vanishing gradient path regardless of how small any individual sub-layer\'s own gradient is, across arbitrarily many stacked blocks. This is exactly why 96-layer transformers are trainable.', next: null },
      q3_wrong_params: { end: true, correct: false, text: 'Residuals add essentially no extra parameters (just an elementwise addition) — the benefit is entirely about gradient flow during backpropagation, not model size.', retry: 'q3' },
      q3_wrong_norm: { end: true, correct: false, text: 'Residuals and LayerNorm solve different problems and both remain necessary — residuals fix vanishing gradients from depth, LayerNorm keeps each layer\'s input distribution well-behaved. Removing either one hurts deep training.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Describing the transformer as "just attention" — attention is the one genuinely new idea, but residuals, LayerNorm, the FFN, and positional encoding are all load-bearing; remove any one and deep stacks stop training reliably or lose order information entirely.',
    'Forgetting that positional information must be added BEFORE the first attention layer (or injected into the attention computation itself, for relative schemes) — adding it only at the end, after attention has already thrown order away, does nothing.',
    'Confusing LayerNorm with BatchNorm. LayerNorm normalizes across the FEATURE dimension per token (batch-size-independent, padding-robust); BatchNorm normalizes across the BATCH dimension per feature (breaks with variable-length padded sequences) — the training-neural-nets lesson\'s distinction, now load-bearing here.',
    'Assuming the FFN mixes information across tokens. It does not — same weights applied independently per position; ALL cross-token mixing happens in attention. Getting this backwards leads to wrong mental models of what each sub-layer contributes.',
    'Treating pre-norm vs post-norm as a trivial implementation detail. It measurably affects training stability at depth/scale — knowing which one a given architecture diagram shows (and why the field moved toward pre-norm) is a real signal of having read past the abstract idea into the engineering.',
    'Not knowing that cross-attention exists (only decoder-only models get asked about causal masking so often that cross-attention is forgotten) — encoder-decoder transformers (T5, Whisper, most translation systems) are alive and well and use exactly this mechanism.'
  ],
  interview: [
    {
      q: 'Describe the complete structure of one transformer encoder block, and explain what each component contributes.',
      a: 'Input X (n tokens × d_model, already containing added positional information). Sub-layer 1: multi-head self-attention — every token gathers a weighted blend of information from every other token, weights determined by learned content-based compatibility (no mask, full bidirectional visibility, for an encoder). This is wrapped as X₁ = LayerNorm(X + MultiHeadAttention(X)) [or LayerNorm(X) fed in, pre-norm style] — the residual "+X" guarantees an unobstructed gradient path through arbitrarily many stacked blocks (preventing depth-driven vanishing gradients), and LayerNorm keeps each token\'s feature statistics in a stable, batch-independent range. Sub-layer 2: a position-wise feedforward network — an ordinary two-layer MLP with a nonlinearity, applied identically and independently to each token\'s vector, providing per-token processing capacity that complements attention\'s cross-token mixing. Wrapped the same way: X₂ = LayerNorm(X₁ + FFN(X₁)). Stack this whole unit N times (12 for BERT-base, 96+ for large LLMs), each block refining every token\'s representation with progressively richer context. A decoder block adds one more sub-layer (masked causal self-attention first, then cross-attention to an encoder\'s output, then the FFN) — three sub-layers instead of two, same wrapping pattern throughout.'
    },
    {
      q: 'Why is positional encoding necessary, and what are the main approaches?',
      a: 'Self-attention\'s formula, softmax(QKᵀ/√dk)V, is built entirely from content-based dot products between projected token vectors — mathematically, it is permutation-equivariant: permute the input token order and the output permutes identically, with no notion of "this token came before that one" anywhere in the computation. Since word order is essential to meaning, position must be injected explicitly. Main approaches: (1) fixed sinusoidal encoding (the original transformer) — a deterministic function of position and dimension using sines/cosines at geometrically varying frequencies, added to the token embedding before the first layer; chosen partly because relative offsets can be expressed as a linear function of the encoding. (2) Learned absolute positional embeddings — a trainable lookup table indexed by position, exactly analogous to a token embedding table, used by models like BERT and GPT-2; simpler, but doesn\'t naturally generalize beyond the max sequence length seen in training. (3) Relative position schemes (RoPE, ALiBi) — inject position as a function of the DISTANCE between the query and key positions, directly inside the attention computation rather than into the input embedding; these tend to extrapolate better to longer sequences at inference than training, which is why most current large language models (LLaMA and its descendants) use RoPE rather than the original sinusoidal scheme.'
    },
    {
      q: 'Explain, with the chain rule, why residual connections are essential for training very deep transformer stacks.',
      a: 'For a residual sub-layer Y = X + F(X), the gradient of the loss with respect to the sub-layer\'s input is, by the chain rule, ∂L/∂X = ∂L/∂Y · ∂Y/∂X = ∂L/∂Y · (I + ∂F/∂X) = ∂L/∂Y + ∂L/∂Y·∂F/∂X. That first term is an unmodified identity pass-through of the gradient from the layer above — it exists regardless of what F (attention or the FFN) computes or how small its own Jacobian is. Chain this through N stacked residual blocks and the gradient reaching the earliest block retains that additive identity contribution at every step; it cannot vanish purely from depth. Contrast a non-residual stack, Y=F(X), where the gradient is a straight PRODUCT of N sub-layer Jacobians — if the typical Jacobian has eigenvalues below 1 (very plausible with softmax saturation or bounded nonlinearities), that product shrinks geometrically with N, the same vanishing-gradient mechanism seen in deep MLPs and long RNN chains, just driven here by network DEPTH rather than sequence LENGTH. This is precisely the mechanism ResNet demonstrated in vision, and it is why transformer stacks 96+ layers deep are trainable at all — remove the residual connections and depth becomes actively harmful rather than helpful.'
    },
    {
      q: 'Walk through the full path of a single input token from raw text to output prediction in a decoder-only transformer.',
      a: 'Text is split into subword tokens via a trained tokenizer (BPE/WordPiece — the tokenization lesson). Each token ID is looked up in a learned embedding table, producing a d_model-dimensional vector; a positional encoding (fixed, learned, or relative) is added or otherwise injected so the model can use order. This n×d_model matrix enters block 1: causal (masked) multi-head self-attention lets each position build a representation from itself and all EARLIER positions only, wrapped in a residual connection and LayerNorm; then a position-wise feedforward network processes each token\'s vector independently, again wrapped in residual+norm. That output feeds into block 2, then block 3, … through N total blocks (commonly dozens), each one producing an increasingly context-rich representation per position. After the final block (and typically one last LayerNorm), a linear layer projects each position\'s final vector to vocabulary-size logits, and softmax converts those logits into a probability distribution over the next token. During training, cross-entropy loss compares this distribution to the true next token at every position simultaneously (teacher forcing, the seq2seq-attention lesson, now at planetary scale); at inference, a decoding strategy (greedy, sampling, beam search — Part 6) picks the actual next token from this distribution, one step at a time.'
    }
  ]
};
