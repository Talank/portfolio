window.LESSONS = window.LESSONS || {};
window.LESSONS['seq2seq-attention'] = {
  id: 'seq2seq-attention',
  title: 'Seq2Seq & the Birth of Attention',
  category: 'Part 4 — NLP',
  timeMin: 50,
  summary: 'Translation needs to read one sequence and write another — enter the encoder-decoder. The 2014 design compressed the whole source sentence into ONE vector, and long sentences died in that bottleneck. The fix, attention (2015), lets the decoder look back at every source position and take a weighted average of what matters right now. You will implement that exact mechanism in the lab — and it is, almost unchanged, the heart of the transformer.',
  goals: [
    'Describe the encoder-decoder architecture and what the "context vector" bottleneck is',
    'Explain teacher forcing: what it is, why training uses it, and the train/inference mismatch it creates',
    'Compute attention by hand: scores → softmax weights → weighted-sum context',
    'Explain why attention fixed long-sentence translation (and produced interpretable alignments)',
    'State the leap from "decoder attends to encoder" to "everything attends to everything" (self-attention)'
  ],
  concept: [
    {
      h: 'The task shape: sequence in, different sequence out',
      p: [
        'Classification maps a sequence to a label. But translation, summarization, and question answering map a sequence to ANOTHER sequence — different length, different order ("the blue ship" → "le navire bleu": three words, adjective flipped to the other side). You can\'t just tag each input token with an output token; the output must be GENERATED, one token at a time, with its own grammar.',
        'The 2014 answer (Sutskever et al.): the <b>encoder-decoder</b>. An encoder RNN (Part 3) reads the source and summarizes it into its final hidden state — the <b>context vector</b> c. A decoder RNN then generates the target token by token, starting from c: each step consumes its previous output and its own hidden state, and emits a softmax over the target vocabulary (the multi-class output layer from the neural-networks lesson). Generation stops when the model emits &lt;EOS&gt;. This design — plus a lot of GPUs — produced the first neural translation systems that beat decades of hand-engineered statistical pipelines.'
      ]
    },
    {
      h: 'Training the decoder: teacher forcing',
      p: [
        'How do you train a generator? At each decoder step, the model predicts a distribution over the next target token, and the loss is cross-entropy against the true next token — summed over the sentence. The subtlety: what do you feed the decoder as "its previous output" during training? Its own prediction might be garbage early in training, and one early error would derail every later step. So training uses <b>teacher forcing</b>: feed the GROUND-TRUTH previous token regardless of what the model predicted. Every step is trained "given the correct prefix, predict the next token".',
        'This buys stable, parallel-friendly training but creates a famous mismatch — <b>exposure bias</b>: at inference there is no teacher; the model consumes its OWN outputs, a distribution of inputs it never saw during training, so errors can compound. Keep this concept warm: LLM pretraining (Part 6) is teacher forcing at planetary scale, and exposure bias is still part of why generation can drift.',
        'Also note what the decoder\'s softmax gives you: a probability for the next token, every step. Multiply stepwise probabilities and you get the model\'s probability for a whole output sequence — greedy decoding takes the top token each step, beam search keeps the k best prefixes; the full decoding toolbox gets its own treatment in Part 6 (sampling, temperature).'
      ]
    },
    {
      h: 'The bottleneck: one vector cannot hold a paragraph',
      p: [
        'Everything the decoder will ever know about the source must fit in c — one fixed-size vector (say 512 numbers), no matter whether the source is 4 words or 60. For short sentences, fine. For long ones, catastrophic: BLEU scores (translation quality) fell off a cliff as source length grew. The encoder is forced to lossily compress an arbitrary amount of content into a fixed budget, and by generation step 40 the decoder is trying to recall word-level details from a summary that never stored them.',
        'You have seen this disease twice: the RNN\'s fading hidden state (Part 3\'s relay chain), and Vegapunk\'s one-pin-per-person chart (last lesson). Diagnosis in one line: <em>a single fixed-size vector is being asked to represent everything at once</em>. The cure will not be a bigger vector — it will be keeping ALL the vectors and choosing among them dynamically.'
      ]
    },
    {
      h: 'Attention: look back at everything, weight what matters now',
      p: [
        'Bahdanau et al. (2015): keep every encoder hidden state h₁…hₙ (one per source token) instead of just the last. At each decoder step, let the decoder\'s current state s ASK the source: "who is relevant to the token I\'m producing right now?" Mechanically, three moves you can now do in your sleep:',
        '<div class="math">scores: eᵢ = score(s, hᵢ)&nbsp;&nbsp;→&nbsp;&nbsp;weights: αᵢ = softmax(e)ᵢ&nbsp;&nbsp;→&nbsp;&nbsp;context: c = Σᵢ αᵢ·hᵢ<span class="mnote">score by compatibility (simplest: dot product s·hᵢ — Part 1 again), normalize to a distribution (softmax), then take the weighted average. c is rebuilt FRESH at every decoder step.</span></div>',
        'That\'s the entire mechanism: <b>a softmax-weighted average, where the weights are computed from compatibility between what I need (s) and what\'s available (hᵢ)</b>. Producing "bleu" while translating "the blue ship"? s at that step scores high against h₂ ("blue"), α concentrates there, and c delivers mostly-"blue" information. The bottleneck is gone — the decoder has a direct, dynamically-chosen line to every source position, path length 1 (the news coo from Part 3, delivered).',
        'Two bonuses. The weights αᵢ are interpretable: plot α over (source position × target position) and you get an alignment heatmap — French adjective-noun inversions visibly show as crossed attention, no linguist required. And the mechanism is differentiable end to end (softmax and weighted sums are smooth), so backprop trains WHERE to look and WHAT to encode jointly — nobody labels alignments.',
        'Score functions you\'ll see named: dot product (s·hᵢ — free, needs matching dimensions), bilinear/"Luong" (sᵀWhᵢ — a learned compatibility matrix), and additive/"Bahdanau" (a tiny MLP on [s; hᵢ] — the 2015 original). Modern transformers use scaled dot product; the scaling story belongs to Part 5.'
      ]
    },
    {
      h: 'The leap: from attention-as-patch to attention-as-architecture',
      p: [
        'In 2015, attention was a PATCH: RNNs still did all the encoding and decoding; attention just bridged them. Then came the audacious question — if the decoder benefits from attending over the source, why shouldn\'t every token attend over every other token, everywhere, and why keep the RNN at all? Three upgrades turn this lesson\'s mechanism into the transformer: (1) <b>self</b>-attention — a sequence attends to ITSELF, so each word builds its representation from all others ("bank" attends to "river": there\'s Vegapunk\'s movable pin — contextual embeddings, mechanized); (2) learned <b>projections</b> — instead of using raw hidden states, project each token into a query (what I\'m looking for), a key (what I advertise), and a value (what I hand over) — the Q/K/V split foreshadowed by word2vec\'s u/v vectors; (3) <b>drop the RNN entirely</b> — with attention providing all token-to-token communication, every position computes in parallel: the sequential bottleneck dies, GPUs rejoice, and "Attention Is All You Need" (2017) becomes the most consequential paper title of the decade.',
        'Your lab implements dot-product attention — score, softmax, weighted sum. Hold onto the code: Part 5\'s self-attention is this function called with Q, K, V matrices, plus a scale factor. If you understand this lesson\'s thirty lines, the transformer is bookkeeping.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Robin translates a Poneglyph: from memorize-then-recite to glance-back-as-you-go',
      text: 'On Skypiea, the crew needs Robin to translate a long Poneglyph. Her first method is the honest disaster every 2014 model shipped with: she reads the ENTIRE stone once, builds a single mental summary — one thought that must hold everything — then turns her back to the stone and recites the translation from that summary alone. For a four-glyph inscription, flawless. For the great stone at the temple\'s heart, the early sentences come out fine and then details rot: was the ancient weapon under the sea or IN the sea of clouds? Which king betrayed which alliance? Her one mental context, fixed in size, was asked to store a paragraph, and by output-sentence twelve the fine-grained facts simply are not in it anymore (the crew watches her translation quality fall off a cliff as inscriptions get longer — a BLEU curve drawn in real time). Her second method is attention, and it\'s embarrassingly simple: STOP TURNING YOUR BACK ON THE STONE. She translates facing it, and for each sentence she writes, her eyes flick across all the glyphs and settle — with different intensity — on the two or three regions relevant to THIS sentence: translating the weapon\'s location, she\'s 80% fixed on the glyph cluster naming the place, 15% on the verb, a glance elsewhere; next sentence, a completely fresh distribution of glances. Nobody taught her where to look per sentence — years of practice tuned her instinct for which glyphs matter to which output (backprop training the score function). Sanji, watching her eyes dart, can literally SEE which glyph produced which translated phrase — the alignment heatmap, human edition. And Usopp asks the question that births the transformer: "if glancing back at the stone helps you translate it… why don\'t the glyphs glance at EACH OTHER, so each one knows its own meaning in context, before you even start?" Robin goes very quiet. That question is Part 5.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Ross recaps the season: notes beat memory',
      text: 'Rachel returns from a long trip and demands a recap of everything she missed. Ross\'s first attempt is pure context-vector: he\'s watched everything, compresses eight episodes into one mental summary, then recounts it by memory — and it degrades exactly like a long translation: early events crisp, later ones mangled ("then Monica… dated… someone? A doctor? Possibly two doctors?"). Second attempt, Monica-approved: he lays out the episode notes on the coffee table and recaps WHILE LOOKING AT THEM — for each part of the story he glances at the relevant note cards, heavily at one or two, lightly at others, fresh glances per story beat. His recap becomes long-form accurate, and Chandler — tracking Ross\'s eye movements to see which card powers which sentence — is reading the attention weights ("could that BE more aligned?"). The kicker Rachel adds at the end is Usopp\'s same question in a different sweater: "the notes would be even better if, while WRITING them, each note referenced the other episodes it connects to." Notes that attend to each other before anyone reads them: self-attention, one lesson early.'
    },
    why: 'One image to rule this topic: Robin with her BACK to the stone (fixed context vector — quality collapses with length) versus Robin FACING the stone, eyes flicking with per-sentence intensity (attention: fresh softmax weights each step, weighted glance = weighted sum). The interview sound-bite falls out automatically: "attention replaces one lossy summary with a dynamically weighted average over all source positions, computed per output step." And Usopp\'s question — why don\'t the glyphs read each other? — is the cliffhanger the transformer answers.'
  },
  storyAnim: {
    title: 'Two ways to translate a Poneglyph',
    h: 250,
    props: [
      { id: 'g1', emoji: '🪨', label: 'glyph: "weapon"', x: 12, y: 18 },
      { id: 'g2', emoji: '🪨', label: 'glyph: "beneath"', x: 34, y: 18 },
      { id: 'g3', emoji: '🪨', label: 'glyph: "sea"', x: 56, y: 18 },
      { id: 'g4', emoji: '🪨', label: 'glyph: "king"', x: 78, y: 18 },
      { id: 'summary', emoji: '💭', label: 'one mental summary (c)', x: 50, y: 48 },
      { id: 'page', emoji: '📃', label: 'translation', x: 88, y: 78 }
    ],
    actors: [
      { id: 'robin', emoji: '🌸', label: 'Robin', x: 10, y: 72 }
    ],
    steps: [
      { c: 'METHOD 1 (2014): Robin reads the whole stone once, compresses everything into ONE thought, then turns her back and recites from memory.', p: { g1: 'lit', g2: 'lit', g3: 'lit', g4: 'lit', summary: 'lit' } },
      { c: 'Short inscription: works. Long inscription: the fixed-size summary can\'t hold every detail — by sentence twelve, "beneath the sea" has become "near some water". Quality falls off a cliff with length.', p: { summary: 'bad', page: 'bad', g1: 'dim', g2: 'dim', g3: 'dim', g4: 'dim' }, l: { page: 'translation: …degrading…' } },
      { c: 'METHOD 2 (attention): face the stone. Keep ALL glyphs available — no single summary has to hold everything.', p: { summary: '', g1: 'lit', g2: 'lit', g3: 'lit', g4: 'lit', page: '' }, a: { robin: [50, 72] } },
      { c: 'Translating the phrase about the weapon\'s location: her glance distributes — 70% on "beneath", 20% on "sea", 10% elsewhere. scores → softmax → weights.', p: { g2: 'good', g3: 'good', g1: 'dim', g4: 'dim' }, l: { summary: 'α = [0.1, 0.7, 0.2, 0.0]' } },
      { c: 'Next sentence, FRESH weights: now 80% on "king". The context is rebuilt per output step — a weighted average of what matters NOW.', p: { g4: 'good', g2: 'dim', g3: 'dim' }, l: { summary: 'α = [0.1, 0.0, 0.1, 0.8]' }, a: { robin: [70, 72] } },
      { c: 'Sanji can see which glyph powered which sentence (the alignment heatmap). And Usopp asks: "why don\'t the glyphs glance at EACH OTHER?" — self-attention. Part 5 begins there.', p: { page: 'good', summary: 'good' }, l: { page: 'translation: accurate ✓' } }
    ]
  },
  conceptFlow: {
    title: 'The mechanism, step by step: "the blue ship sails"',
    intro: 'Click any box to jump straight there, or press Play and just listen.',
    stages: [
      {
        label: 'Encoder states',
        nodes: [
          { id: 'h', text: 'h₁…h₄: one vector per source word\n"the","blue","ship","sails" — all kept, none discarded' },
        ],
      },
      {
        label: 'Query',
        nodes: [
          { id: 'query', text: 'Decoder state s\nabout to produce "bleu" — looking for color information' },
        ],
      },
      {
        label: 'Scores',
        nodes: [
          { id: 'scores', text: 'scores = H · s\none dot product per source position, all at once' },
        ],
      },
      {
        label: 'Weights',
        nodes: [
          { id: 'weights', text: 'softmax(scores)\n≈ [0.19, 0.42, 0.24, 0.16] — concentrated on "blue"' },
        ],
      },
      {
        label: 'Context',
        nodes: [
          { id: 'context', text: 'context = Σ weightᵢ·hᵢ\nmostly h₂\'s ("blue") content, others faintly mixed in' },
        ],
      },
    ],
    steps: [
      { active: ['h'], note: 'Attention\'s fix to the bottleneck: keep EVERY encoder hidden state, one per source token, instead of collapsing them into a single summary vector.' },
      { active: ['query'], note: 'The decoder is about to produce the French word for "blue". Its current state s is effectively "looking for" color information.' },
      { active: ['scores'], note: 'Score compatibility between s and every source position with one matrix-vector product: scores = H · s — Part 1\'s dot product, batched over the whole sequence at once.' },
      { active: ['weights'], note: 'Normalize the scores with softmax into a probability distribution over source positions: ≈ [0.19, 0.42, 0.24, 0.16] — "blue" dominates, but nothing is fully zeroed out.' },
      { active: ['context'], note: 'Build the context as the weighted average of ALL encoder states using those weights — mostly h₂\'s content, with faint contributions from the rest. Next decoder step, a different query rebuilds this from scratch.' },
    ],
  },
  tech: [
    {
      q: 'Why softmax the scores instead of just using the raw dot products as weights?',
      a: 'Three jobs at once. Normalization: softmax makes the weights positive and sum to 1, so the context c = Σαᵢhᵢ is a convex combination — a genuine weighted average that stays in the same magnitude range as the hᵢ regardless of sequence length (raw scores could produce a context 50× too large for a long sentence, wrecking the downstream layers\' input distribution — the normalization lesson again). Sharpness control: exponentiation amplifies gaps, letting the model approach "hard" selection (one weight ≈ 1) while remaining smooth. Differentiability: an actual argmax lookup would have zero gradient almost everywhere — you couldn\'t train WHERE to look; softmax is the differentiable relaxation of selection, so backprop can shape the score function. This "soft, differentiable version of a discrete choice" pattern is one of deep learning\'s master moves — you\'ve now seen it in softmax classification, gating (LSTM), and attention.'
    },
    {
      q: 'What exactly is teacher forcing, and what is exposure bias in precise terms?',
      a: 'Teacher forcing: during training, decoder step t receives the ground-truth token y*ₜ₋₁ as input, not the model\'s own sample ŷₜ₋₁. The loss is Σₜ −log p(y*ₜ | y*<ₜ, source) — every step conditions on a CORRECT prefix. Benefits: no error compounding during training, and all target positions can be computed in parallel (crucial for transformers — Part 5\'s causal mask exists to make teacher forcing work in one matrix pass). Exposure bias: the mismatch that at inference the model conditions on its OWN outputs — a distribution over prefixes it never trained on — so a single bad token pushes it off the manifold of familiar prefixes and errors can snowball. Mitigations historically: scheduled sampling (occasionally feed model samples during training), sequence-level objectives, and beam search at decode time; in the LLM era, massive data plus RLHF-style sequence-level tuning (Part 6) blunt it, but drift over very long generations is its living descendant.'
    },
    {
      q: 'Bahdanau vs Luong vs dot-product attention — what actually differs and does it matter?',
      a: 'Only the score function e = score(s, h). Dot product: s·h — zero extra parameters, requires equal dimensions, fastest (it\'s a matmul over all positions at once). Luong/bilinear: sᵀWh — a learned W gives the model freedom to define compatibility, mild cost. Bahdanau/additive: vᵀtanh(W₁s + W₂h) — a one-hidden-layer MLP per pair; most expressive per parameter at small scale, historically first, but doesn\'t reduce to one big matmul as cleanly. Empirically at scale the differences wash out, and the transformer\'s choice is dot product — but on PROJECTED vectors (queries and keys), which effectively re-introduces Luong\'s learned W as the product of the projection matrices, while keeping the compute one giant GPU-friendly matmul — with a 1/√d scale factor whose justification is a Part 5 story. Interview take: know that "attention variants = choices of score function", name the three, and say why dot-product-on-projections won (parallelism + learned compatibility).'
    },
    {
      q: 'What do attention weights actually tell us — are they "explanations"?',
      a: 'They are a faithful record of WHAT was mixed into the context — αᵢ literally is the coefficient on hᵢ — and in encoder-decoder translation they reproduce classic word alignments beautifully (adjective-noun inversion appears as a visible crossing). But treat "attention = explanation" with care, and say so in interviews: (1) each hᵢ after an RNN/transformer encoder already contains information about OTHER positions, so attending to position 3 doesn\'t mean using only word 3\'s content; (2) research ("Attention is not Explanation", 2019, and its rebuttals) showed you can sometimes find very different weight patterns yielding the same predictions — weights aren\'t unique causal stories; (3) in multi-layer multi-head models, information routes through compositions of many attention maps, and single-map readings mislead. Honest phrasing: attention weights are a useful, cheap diagnostic signal — great for debugging (is the model attending to padding?! ) and alignment visualization — but causal explanation requires stronger tools (ablations, attribution methods). That nuance is exactly what separates a memorized answer from a researcher\'s answer.'
    }
  ],
  code: {
    title: 'Attention in numpy: the thirty lines that changed NLP',
    intro: 'The complete mechanism on a toy "sentence" — encoder states, one decoder query, scores → softmax → context. This is runnable intuition for the lab and the literal core of Part 5.',
    code: `import numpy as np

def softmax(z):
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()

# encoder hidden states: one 4-dim vector per source token
#                 "the    blue   ship   sails"
H = np.array([[0.1, 0.0, 0.2, 0.0],    # h1: the
              [0.0, 0.9, 0.1, 0.0],    # h2: blue   (color-ish direction)
              [0.8, 0.1, 0.0, 0.1],    # h3: ship   (vessel-ish direction)
              [0.1, 0.0, 0.7, 0.6]])   # h4: sails

# decoder is about to produce the French word for "blue":
# its state s is "looking for" color information
s = np.array([0.05, 1.0, 0.0, 0.0])

scores  = H @ s                      # dot product with every source position at once
weights = softmax(scores)            # attention distribution over source tokens
context = weights @ H                # weighted average of encoder states

print("scores :", scores.round(3))   # h2 wins
print("weights:", weights.round(3))  # ~[0.19, 0.42, 0.24, 0.16] — concentrated on "blue"
print("context:", context.round(3))  # mostly h2's content, others faintly mixed in

# next decoder step ("navire"), a DIFFERENT s -> fresh weights, fresh context
s2 = np.array([1.0, 0.0, 0.0, 0.1])           # now hunting vessel-ness
print("weights2:", softmax(H @ s2).round(3))  # concentrates on h3 "ship"`,
    notes: [
      'H @ s computes ALL scores in one matrix-vector product — attention over a whole sequence is a single matmul, which is the parallelism that kills the RNN in Part 5.',
      'The context is a blend, not a selection: even with weights [0.19, 0.42, …], every position contributes. Softness is what makes it trainable.',
      'Make the query more extreme (s = [0, 5, 0, 0]) and watch softmax sharpen toward one-hot — temperature/sharpness intuition you\'ll formalize in Part 6 sampling.',
      'Rename s → "query", the rows of H → "keys" AND "values", and you\'ve already learned most of Part 5\'s vocabulary.'
    ]
  },
  lab: {
    title: 'Implement attention: score, softmax, weighted sum',
    prompt: 'Pure Python — write the mechanism you will use for the rest of this course. Implement (1) <code>softmax(zs)</code> — with the max-subtraction stability trick; (2) <code>attention(query, keys, values)</code> — scores = query·keyᵢ for each key, weights = softmax(scores), return (weights, context) where context = Σ weightᵢ·valueᵢ. keys and values are lists of equal-length vectors (in this lesson\'s encoder-decoder setting they\'re the same vectors — hᵢ serves as both — but write the function to accept both so it\'s Part-5-ready).',
    starter: `import math

def softmax(zs):
    # subtract max first (stability), exponentiate, normalize to sum 1
    ...

def dot(a, b):
    ...

def attention(query, keys, values):
    # scores: dot(query, k) for each key
    # weights: softmax(scores)
    # context: elementwise sum of weight_i * values[i]
    # return (weights, context)
    ...`,
    checks: [
      { re: 'def\\s+attention\\s*\\(', must: true, hint: 'Define attention(query, keys, values) returning (weights, context).', pass: 'attention() defined' },
      { re: 'def\\s+softmax\\s*\\(', must: true, hint: 'Define softmax(zs) — attention weights must sum to 1.', pass: 'softmax defined' },
      { re: 'max\\s*\\(', must: true, hint: 'Subtract the max inside softmax — e^1000 overflows (the log-sum-exp trick from Part 3).', pass: 'stability trick present' },
      { re: 'import\\s+(numpy|torch)', must: false, hint: 'Pure Python: feel every dot product once; numpy takes over in Part 5.', pass: 'From scratch ✓' }
    ],
    tests: `# softmax basics: sums to 1, order preserved, stable on big inputs
w = softmax([1.0, 2.0, 3.0])
assert abs(sum(w) - 1.0) < 1e-9 and w[2] > w[1] > w[0]
assert abs(sum(softmax([1000.0, 1000.0])) - 1.0) < 1e-9, "max-subtraction keeps this finite"

# identical keys -> uniform attention (no basis to prefer anyone)
keys = [[1.0, 0.0], [1.0, 0.0], [1.0, 0.0]]
vals = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]
w, c = attention([0.5, 0.5], keys, vals)
assert all(abs(x - 1/3) < 1e-9 for x in w), f"uniform expected: {w}"
assert abs(c[0] - 2/3) < 1e-9 and abs(c[1] - 2/3) < 1e-9, "context = average of values"

# the query finds its match: strongly aligned key dominates
keys = [[5.0, 0.0], [0.0, 5.0]]
vals = [[1.0, 0.0], [0.0, 1.0]]
w, c = attention([1.0, 0.0], keys, vals)     # query points at key 0
assert w[0] > 0.99, f"should lock onto key 0: {w}"
assert c[0] > 0.99 and c[1] < 0.01, "context is essentially value 0"

# fresh query -> fresh weights (context rebuilt per step, Robin's glances)
w2, c2 = attention([0.0, 1.0], keys, vals)
assert w2[1] > 0.99 and c2[1] > 0.99
print("score -> softmax -> weighted sum. You now hold the heart of the transformer.")`,
    runnable: true,
    solution: `import math

def softmax(zs):
    m = max(zs)
    es = [math.exp(z - m) for z in zs]
    s = sum(es)
    return [e / s for e in es]

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def attention(query, keys, values):
    scores = [dot(query, k) for k in keys]
    weights = softmax(scores)
    d = len(values[0])
    context = [sum(w * v[i] for w, v in zip(weights, values)) for i in range(d)]
    return weights, context`,
    notes: [
      'Count the concepts your ~15 lines contain: dot product as compatibility (Part 1), softmax as differentiable selection (Part 3), weighted average as information routing. Nothing else. That\'s why the field says attention is "simple" — the depth is in what emerges when you stack it.',
      'The uniform-keys test is worth internalizing: attention with nothing to distinguish keys degrades to plain averaging. Learned key diversity is WHERE the routing power comes from.',
      'Part 5 upgrade path for this exact function: batch the queries into a matrix (all positions ask at once), project inputs into separate Q/K/V spaces, divide scores by √d, add a mask. Four mechanical steps from here to self-attention.'
    ]
  },
  quiz: [
    {
      q: 'What is the bottleneck problem in vanilla (2014) seq2seq?',
      options: ['The entire source sequence must compress into one fixed-size context vector, so long inputs lose detail and translation quality collapses with length', 'The decoder vocabulary is too small', 'RNNs cannot output variable-length sequences', 'Teacher forcing prevents learning'],
      correct: 0,
      explain: 'One 512-dim vector must hold a 4-word greeting or a 60-word paragraph. Robin reciting with her back to the stone. Attention removes it by keeping every encoder state accessible.'
    },
    {
      q: 'During training with teacher forcing, decoder step t receives as input:',
      options: ['The ground-truth previous target token, regardless of what the model predicted', 'The model\'s own sampled previous token', 'The full source sentence again', 'A random token, for regularization'],
      correct: 0,
      explain: 'Condition every step on the correct prefix: stable gradients, parallelizable targets. The cost is exposure bias — at inference the model must ride its own (possibly wrong) outputs.'
    },
    {
      q: 'In attention, the context vector at each decoder step is:',
      options: ['A softmax-weighted average of ALL encoder hidden states, with weights computed fresh from the current decoder state', 'The final encoder hidden state, reused each step', 'The single encoder state with the highest score', 'The average of the decoder\'s own previous states'],
      correct: 0,
      explain: 'scores → softmax → weighted sum, recomputed per output token. Fresh glances per sentence. Taking only the argmax would break differentiability — softness is what makes "where to look" learnable.'
    },
    {
      q: 'Why did attention weights become famous as visualizations?',
      options: ['Plotted as a source×target heatmap they reproduce word alignments — e.g. French adjective-noun inversion appears as a visible crossing — learned without any alignment labels', 'They prove which neurons are conscious', 'They show the gradient magnitudes', 'They compress the model for deployment'],
      correct: 0,
      explain: 'αᵢ is literally the mixing coefficient on source position i. Interpretable-ish and diagnostic — though "attention = explanation" deserves the caveats from the technicality corner.'
    },
    {
      q: 'Which THREE changes turn this lesson\'s attention into the transformer\'s self-attention?',
      options: ['Sequences attend to themselves; tokens are projected into separate query/key/value vectors; the RNN is removed so all positions compute in parallel', 'Bigger vectors; more layers; better initialization', 'Beam search; teacher forcing; BLEU scoring', 'Convolutions replace dot products'],
      correct: 0,
      explain: 'Self-attention (every token contextualizes from every other), learned Q/K/V projections (roles, like word2vec\'s u/v), and no recurrence (one parallel matmul). "Attention Is All You Need" = keep the mechanism, delete the RNN.'
    }
  ],
  testFlow: {
    title: 'Test yourself: seq2seq & attention',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'Why does vanilla (2014) seq2seq translation quality collapse as the source sentence gets longer?',
        choices: [
          { text: 'The entire source must compress into one fixed-size context vector — long inputs simply don\'t fit', to: 'q1_right' },
          { text: 'The decoder\'s vocabulary is too small for longer sentences', to: 'q1_wrong_vocab' },
          { text: 'RNNs are mathematically incapable of producing variable-length output', to: 'q1_wrong_varlen' },
        ],
      },
      q1_right: { end: true, correct: true, text: 'Right — one 512-dim vector must hold a 4-word greeting or a 60-word paragraph equally. Robin reciting with her back to the stone: fine for short inscriptions, catastrophic for long ones. Attention fixes this by keeping every encoder state accessible instead of compressing.', next: 'q2' },
      q1_wrong_vocab: { end: true, correct: false, text: 'Vocabulary size is unrelated to sentence length — it\'s fixed regardless of how long any individual input is. The actual failure is the fixed-size context vector bottleneck.', retry: 'q1' },
      q1_wrong_varlen: { end: true, correct: false, text: 'RNN decoders handle variable-length output fine (that\'s the whole point of generating token-by-token until <EOS>). The problem is upstream: the ENCODER\'s summary is fixed-size no matter the input length.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'During training with teacher forcing, what does the decoder receive as input at step t?',
        choices: [
          { text: 'The ground-truth previous target token, regardless of what the model itself predicted', to: 'q2_right' },
          { text: 'The model\'s own sampled prediction from the previous step', to: 'q2_wrong_own' },
          { text: 'The full source sentence, re-encoded fresh at every step', to: 'q2_wrong_resend' },
        ],
      },
      q2_right: { end: true, correct: true, text: 'Exactly — every step conditions on the CORRECT prefix, which gives stable, parallelizable training. The cost is exposure bias: at inference there\'s no teacher, so the model must ride its own (possibly wrong) outputs.', next: 'q3' },
      q2_wrong_own: { end: true, correct: false, text: 'That\'s what happens at INFERENCE time, not during teacher-forced training. Feeding the model\'s own early, garbage predictions during training would let one error corrupt every subsequent step — exactly what teacher forcing avoids.', retry: 'q2' },
      q2_wrong_resend: { end: true, correct: false, text: 'The source is encoded once per sentence (or attended over repeatedly, in the attention case) — it isn\'t re-encoded per decoder step. Teacher forcing is specifically about what feeds the DECODER\'s previous-token input.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'At each decoder step, the attention context vector is computed as…',
        choices: [
          { text: 'A softmax-weighted average of ALL encoder hidden states, with weights recomputed fresh from the current decoder state', to: 'q3_right' },
          { text: 'The single encoder hidden state with the single highest score, selected outright', to: 'q3_wrong_argmax' },
          { text: 'The final encoder hidden state, same as vanilla seq2seq, just relabeled', to: 'q3_wrong_final' },
        ],
      },
      q3_right: { end: true, correct: true, text: 'Right — scores → softmax → weighted sum, rebuilt at every single output step (Robin\'s glances resetting per sentence). Softness is exactly what keeps the mechanism differentiable and trainable end to end.', next: null },
      q3_wrong_argmax: { end: true, correct: false, text: 'A hard argmax selection would have zero gradient almost everywhere — you couldn\'t backprop "where to look". Attention deliberately uses a SOFT weighted blend instead of a hard pick.', retry: 'q3' },
      q3_wrong_final: { end: true, correct: false, text: 'That\'s exactly the bottleneck attention was built to eliminate. Attention uses ALL encoder states with per-step weights, not just the last one.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Describing attention as "the model focuses on important words" and stopping there. In interviews, give the mechanism: compatibility scores → softmax → weighted average, recomputed per step. The vague version signals tutorial-level knowledge.',
    'Forgetting that the context is a BLEND. Attention rarely puts weight 1.0 anywhere; downstream layers receive mixed information. Reasoning that assumes hard selection leads to wrong debugging conclusions.',
    'Confusing encoder-decoder (cross) attention with self-attention. Cross: decoder queries, encoder keys/values — between two sequences. Self: one sequence, Q=K=V source. Transformers use both; interviewers check the distinction.',
    'Ignoring padding in batched attention. Without masking, softmax assigns real weight to <PAD> positions and the context ingests garbage. The attention_mask from the tokenization lesson exists precisely for this.',
    'Treating attention weights as ground-truth explanations of model behavior. They\'re mixing coefficients and a useful diagnostic, not a causal story — cite the "Attention is not Explanation" debate if pressed.',
    'Skipping this "historical" lesson because transformers made seq2seq-with-RNNs obsolete. The bottleneck→attention narrative is the single most-asked conceptual interview arc in NLP, and encoder-decoder + cross-attention is alive inside T5, Whisper, and every translation system.'
  ],
  interview: [
    {
      q: 'Explain the attention mechanism and the problem it was invented to solve.',
      a: 'Setting: 2014 seq2seq compressed the entire source sequence into the encoder\'s final hidden state — one fixed-size vector — and the decoder generated everything from that summary. Information-theoretically doomed for long inputs: translation quality measurably collapsed with sentence length. Attention (Bahdanau 2015) keeps ALL encoder states h₁…hₙ and, at each decoder step, computes relevance scores between the current decoder state and every hᵢ (dot product or a small learned function), normalizes the scores with softmax into weights αᵢ, and builds the step\'s context as the weighted average Σαᵢhᵢ. Each output token thus draws on a freshly weighted view of the whole source — no fixed bottleneck, path length 1 to any input position, and the whole thing is differentiable so "where to look" is learned by backprop with no alignment labels (the weights even reproduce classical word alignments as a free visualization). The mechanism proved more general than the fix: make the sequence attend to itself with learned query/key/value projections, drop the RNN, and you have the transformer.'
    },
    {
      q: 'What is teacher forcing and what problem does it introduce?',
      a: 'Teacher forcing trains an autoregressive decoder by feeding it the ground-truth previous token at each step rather than its own prediction: the loss is Σₜ −log p(y*ₜ | y*<ₜ, x), i.e., every position learns "given the correct prefix, predict the next token". Why it\'s used: without it, early-training garbage predictions would corrupt every subsequent step\'s input (untrainably noisy), and with it all positions\' losses can be computed in parallel from the shifted target sequence — this parallelism is exactly what the transformer\'s causal mask exploits, and LLM pretraining is teacher forcing at scale. The introduced problem is exposure bias: a train/inference mismatch where the model only ever conditioned on gold prefixes but at generation time conditions on its own sampled outputs — a distribution it never saw — so one deviation can push it off familiar ground and compound. Classical mitigations: scheduled sampling, sequence-level training, beam search; modern LLMs blunt it with scale and preference-based fine-tuning (RLHF/DPO operate on whole generated sequences), but long-horizon drift in generation is its surviving symptom.'
    },
    {
      q: 'Walk me through computing attention for one decoder step, with concrete shapes.',
      a: 'Setup: source length n=20, hidden size d=512. Encoder states H: [20, 512]. Current decoder state s: [512]. Step 1 — scores: e = H·s, one dot product per source position → [20] (a single matrix-vector product; with a bilinear variant it\'s sᵀWhᵢ). Step 2 — normalize: α = softmax(e) → [20], positive, sums to 1; any padding positions get −∞ added to their scores first so they receive zero weight. Step 3 — context: c = αᵀH = Σαᵢhᵢ → [512], a convex combination of encoder states. Step 4 — use: concatenate [c; s] (or add) and feed the decoder\'s output layer to produce the token distribution; next step, s has changed, so all weights are recomputed. Batched over B sentences and all T target steps (teacher forcing), it becomes score matrices [B, T, n] via one batched matmul — which is why attention is GPU-native. Complexity: O(T·n·d) time, O(T·n) score memory — the seed of the transformer\'s famous O(n²).'
    },
    {
      q: 'Why did attention ultimately replace recurrence entirely rather than remain an add-on?',
      a: 'Once attention existed, the RNN was solving a problem attention already solved better. The RNN\'s two roles were (1) moving information across positions and (2) providing order-awareness. For role 1, attention is strictly superior: direct O(1)-path access between any positions versus information surviving a chain of O(distance) squashings — no vanishing across distance — and its computation is one big matmul across all positions versus an unparallelizable sequential loop, so training scales with GPU width instead of sequence length in wall-clock. Role 2 turned out to be cheaply replaceable by positional encodings added to the embeddings (Part 5). "Attention Is All You Need" (2017) tested exactly this hypothesis — delete recurrence, keep (self-)attention plus positionals plus feedforward layers — and got better translation quality at a fraction of the training time. The honest completion of the answer: the trade wasn\'t free — attention costs O(n²) in sequence length versus the RNN\'s O(n) with O(1) inference state, which is why long-context efficiency (KV caches, FlashAttention, and revived recurrent ideas like state-space models) remains an active engineering frontier today.'
    }
  ]
};
