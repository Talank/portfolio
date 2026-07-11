window.LESSONS = window.LESSONS || {};
window.LESSONS['bert-vs-gpt'] = {
  id: 'bert-vs-gpt',
  title: 'BERT vs GPT: Encoders, Decoders & When to Use Which',
  category: 'Part 5 — Transformers',
  timeMin: 45,
  summary: 'The original transformer had two stacks — encoder and decoder — built for translation. Two years later, the field split the pair apart and asked: what if you keep ONLY the encoder (BERT), or ONLY the decoder (GPT)? Same block from last lesson, radically different pretraining objective, radically different superpower. This lesson pins down exactly why "understanding" and "generation" ended up as two families, and why decoder-only quietly ate the whole LLM era.',
  goals: [
    'Explain the masked language modeling objective (BERT) and why bidirectional context makes it well-suited to understanding tasks',
    'Explain the causal/autoregressive language modeling objective (GPT) and why it is naturally suited to generation',
    'State precisely why BERT cannot generate text left-to-right and GPT cannot see future context — the architectural reason, not folklore',
    'Compare encoder-only, decoder-only, and encoder-decoder architectures and name a real model family for each',
    'Justify, with evidence, why decoder-only architectures became the dominant choice for large language models'
  ],
  concept: [
    {
      h: 'Same block, two amputations',
      p: [
        'Last lesson\'s transformer block is a self-attention sub-layer plus a feedforward sub-layer, wrapped in residuals and norm. The full encoder-decoder transformer stacks TWO variants of it. Split them apart and keep only one, and you get the two dominant model families in NLP:',
        '<div class="math">encoder-only (BERT family): N × [ bidirectional self-attention → FFN ]&nbsp;&nbsp;&nbsp;no mask, sees the WHOLE input at once<br>decoder-only (GPT family): N × [ causal self-attention → FFN ]&nbsp;&nbsp;&nbsp;masked, sees only the PAST at each position</div>',
        'Everything else — residuals, LayerNorm, multi-head attention, positional encoding, the FFN — is identical machinery from last lesson. The entire personality difference between "a BERT" and "a GPT" comes down to ONE bit: is the self-attention mask present or absent. That single bit cascades into two different pretraining objectives, two different sets of native strengths, and (mostly) two different jobs in an ML system.'
      ]
    },
    {
      h: 'BERT: masked language modeling — fill in the blank, using BOTH directions',
      p: [
        'BERT (Bidirectional Encoder Representations from Transformers, 2018) is pretrained on <b>masked language modeling (MLM)</b>: take a sentence, randomly replace ~15% of tokens with a special [MASK] token (or a random wrong token, or leave it unchanged — a detail meant to reduce train/inference mismatch), and train the model to predict the ORIGINAL token at each masked position, using the FULL surrounding context — both the words before AND after the mask. "The [MASK] sat on the mat" — predicting the blank, the model gets to look at "The", "sat", "on", "the", "mat" all at once, from both sides.',
        'This is only possible BECAUSE there is no causal mask — full bidirectional self-attention lets every position see every other position, including ones that come later in the sentence. That bidirectionality is BERT\'s superpower for understanding tasks: classifying sentiment, extracting entities, answering "does sentence A entail sentence B" — tasks where you have the WHOLE input up front and need the richest possible representation of it (exactly the classic-nlp-tasks lesson\'s pipelines, most of which are BERT-family models under the hood).',
        'It is also BERT\'s structural limitation for generation: bidirectionality that lets a token see its own right-context during TRAINING makes it fundamentally unable to generate left-to-right at INFERENCE, because at generation time the future tokens don\'t exist yet to look at. You cannot ask a bidirectional model to "write the next word" one word at a time in any principled way — the training objective and the generation task are architecturally incompatible, not just under-trained.'
      ]
    },
    {
      h: 'GPT: causal language modeling — predict the next token, only ever looking backward',
      p: [
        'GPT (Generative Pretrained Transformer, 2018-onward) is pretrained on <b>causal (autoregressive) language modeling</b>: given a sequence of tokens, predict the NEXT token at every position, using only the tokens that came BEFORE it — exactly the causal mask from last lesson. The loss is the same cross-entropy-over-vocabulary you\'ve seen since the neural-networks lesson, applied at every position in parallel via teacher forcing (the seq2seq-attention lesson\'s mechanism, at planetary scale): <code>Σₜ −log p(tokenₜ | token₁...tokenₜ₋₁)</code>.',
        'This objective is a PERFECT match for generation because training and inference are the SAME procedure: at both training and generation time, the model predicts the next token from only the preceding ones — no mismatch, no incompatibility, just longer and longer contexts as generation proceeds. That\'s why GPT-family models generate fluent, open-ended text natively while BERT-family models structurally cannot.',
        'The surprising empirical discovery of the GPT line (especially GPT-2 and GPT-3): a big enough causal language model, trained on enough diverse text, gets good at UNDERSTANDING tasks too — not because anyone designed it to classify sentiment, but because predicting "this movie was ___" well enough requires an internal representation that captures sentiment, entities, facts, and a great deal else as a side effect of getting really good at next-token prediction. This single finding (scale + next-token-prediction alone yields broad capability) is most of why decoder-only architecture, not encoder-only or encoder-decoder, became the dominant LLM design — one objective, one architecture, does almost everything, at sufficient scale.'
      ]
    },
    {
      h: 'The precise reason each direction is architecturally blocked',
      p: [
        'Not folklore, the actual mechanism, tying straight back to last lesson\'s formula. In BOTH BERT and GPT, self-attention computes softmax(QKᵀ/√dk)·V; the ONLY difference is whether a mask is added before the softmax. BERT: no mask (or only a padding mask) — position i\'s output can draw on any position j, before or after. GPT: causal mask added — scores where j > i are set to −∞ before softmax, so position i\'s output can draw on ONLY positions ≤ i.',
        'BERT can\'t generate left-to-right because its pretraining literally trained every position to expect access to right-context that, during generation, would not yet exist — feeding it a partial sentence and asking for the next word gives it a distribution trained under a completely different information regime than the one it would face. GPT can\'t use bidirectional context at inference (even if you wanted it to) because the causal mask is BAKED into how it was trained end to end — every one of its N layers has only ever seen masked attention, so removing the mask at inference feeds every layer inputs from a distribution it never learned to handle. This is not a minor limitation to patch around; it is the direct, unavoidable consequence of what a mask does to a matrix multiplication.'
      ]
    },
    {
      h: 'The third option: keep both stacks (T5, and the original transformer)',
      p: [
        'Encoder-decoder models (T5, BART, the original "Attention Is All You Need" transformer, Whisper for speech) keep BOTH stacks from last lesson: a bidirectional encoder builds a rich representation of a complete input, and a causal decoder generates output conditioned on that representation via cross-attention. This is the natural fit for tasks that are genuinely INPUT-to-OUTPUT transformations of different content — translation (source language in, target language out), summarization (long document in, short summary out) — where you want the full bidirectional read of the SOURCE plus autoregressive generation of the TARGET.',
        'Why didn\'t encoder-decoder win the LLM era instead? Partly parameter efficiency at scale (a decoder-only model spends its entire parameter budget on one stack that does both jobs reasonably well, rather than splitting budget across two specialized stacks); partly the empirical finding above (decoder-only, scaled up, handles understanding tasks about as well via prompting, without a dedicated encoder); and partly flexibility — a decoder-only model isn\'t architecturally committed to a fixed "one input, one output" shape the way encoder-decoder is, so the exact same model handles chat, classification-via-prompting, code, and translation without a task-specific input/output split. Encoder-decoder models remain the right choice for large-scale, genuinely input-heavy transformation tasks (T5-style pipelines, Whisper for speech-to-text), but for open-ended general-purpose language modeling, decoder-only won.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Reading Tower and the Writing Tower',
      text: 'Franky\'s two towers from last lesson get put to their first real test, and the crew discovers they are good at completely different jobs — for a reason baked into how each was TRAINED, not just how it\'s used. The Reading Tower is trained by a brutal game: someone blacks out random words across a WHOLE inscription, all at once, and the trainee must guess each blacked-out word using EVERY visible glyph around it, before and after, all at the same time. Robin, training in the Reading Tower, gets extraordinarily good at this — give her any inscription with gaps and she reconstructs it fluently, because she has spent years using both-sides context. But when the crew asks her to write a BRAND NEW inscription from scratch, one glyph at a time, left to right, she freezes — her whole training assumed the finished inscription (including everything AFTER whatever gap she was filling) was already sitting right there on the wall. Asking her to produce glyph 40 without glyphs 41 onward existing yet is a game she has never played; the skill genuinely does not transfer. The Writing Tower, meanwhile, trains its apprentice completely differently: she is only ever shown a PARTIAL inscription and asked to guess the very next glyph, over and over, always with everything after her current position covered up — Robin\'s hand, from two lessons ago, made permanent as the rule of this tower. It feels like a HANDICAP during training (she never gets the easy both-sides view), but it is exactly the skill that matters when the crew later needs someone to compose brand-new Poneglyphs one glyph at a time. And the surprise nobody predicted: once the Writing apprentice gets good ENOUGH at pure next-glyph prediction, over enough inscriptions, she starts understanding meaning, grammar, even implied history almost as well as the Reading Tower does — not because anyone taught her to, but because reliably guessing the next glyph, across enough of the world\'s inscriptions, turns out to require deeply understanding them. Sengoku, reviewing both towers\' graduates for a new assignment, sums it up: "for filling gaps in existing text, send a Reading Tower graduate. For writing something that\'s never existed before, ONLY a Writing Tower graduate can do it — and lately, give her enough training, she can practically do the other tower\'s job too."'
    },
    sitcom: {
      show: 'Friends',
      title: 'The proofreader and the improviser',
      text: 'Joey lands two very different side gigs, and Chandler notices they require opposite skills for a structural reason, not just a stylistic one. Job one: proofreading scripts with random words blacked out, guessing each one from the FULL surrounding scene — lines before AND after the gap, all visible at once. Joey turns out to be great at this (to everyone\'s shock) — given the whole page, filling blanks using context from both directions is basically a puzzle, and he\'s a fast puzzle-solver when the whole picture is in front of him. Job two: live improv, where he has to say the NEXT line with zero knowledge of how the scene will end, using only what\'s already been said. When his improv teacher tries to get him to use the "fill in the blank" instinct from the proofreading gig — subtly anticipating lines that haven\'t happened yet — it actively breaks his improv, because real improv scenes don\'t have a predetermined "later" to peek at; there is no both-directions context to lean on, only what came before. Ross explains why the skills don\'t transfer: the proofreading gig TRAINED him to always expect the ending was already written and visible; improv trains the opposite habit, guessing forward with nothing but the past, one line at a time — which happens to be EXACTLY the skill that lets him also generate an entire new scene from a blank stage, something the proofreading skill could never do no matter how good he got at it. And when Joey\'s improv gets good enough, Monica notices he\'s started passing casual comprehension quizzes about scenes he\'s only IMPROVISED through, never proofread — the pure "guess what comes next" skill quietly grew into understanding too.'
    },
    why: 'One training regime (fill in a gap using BOTH directions, all at once) builds an incredible READER but an architecturally incapable WRITER — Robin/Joey literally never learned to produce output without already-written future context to check against. The other regime (guess only the next piece, using only the past) is a strictly harder game to train on, but it is the ONLY one of the two that can generate anything new, one step at a time — and get good enough at understanding almost for free.'
  },
  storyAnim: {
    title: 'Two towers, two training games',
    h: 260,
    props: [
      { id: 'text1', emoji: '📜', label: 'The [MASK] sat on the mat', x: 15, y: 14 },
      { id: 'reader', emoji: '🗼', label: 'Reading Tower (BERT): bidirectional', x: 15, y: 40 },
      { id: 'guess1', emoji: '✅', label: 'guess: "cat" (used BOTH sides)', x: 15, y: 66 },
      { id: 'text2', emoji: '📜', label: 'The cat sat on the ___', x: 78, y: 14 },
      { id: 'writer', emoji: '🗼', label: 'Writing Tower (GPT): causal only', x: 78, y: 40 },
      { id: 'guess2', emoji: '✅', label: 'guess: "mat" (used ONLY the past)', x: 78, y: 66 },
      { id: 'fail', emoji: '❌', label: 'Reading Tower asked to write left-to-right: freezes', x: 15, y: 90 }
    ],
    actors: [],
    steps: [
      { c: 'Reading Tower training game: black out a word, guess it using EVERY visible glyph, before AND after. No mask on self-attention.', p: { text1: 'lit', reader: 'lit' } },
      { c: 'She nails it — bidirectional context makes this easy. Great for understanding: sentiment, entities, "does A imply B".', p: { guess1: 'good' } },
      { c: 'Writing Tower training game: guess only the NEXT glyph, seeing only what came before. Causal mask on self-attention.', p: { text2: 'lit', writer: 'lit' } },
      { c: 'Harder game — no future to peek at — but it is the ONLY game that matches generation: training and inference are the same procedure.', p: { guess2: 'good' } },
      { c: 'Ask the Reading Tower graduate to write new text left to right, one glyph at a time: she freezes. Her training never prepared her for "no future context exists yet".', p: { fail: 'bad' } },
      { c: 'Scale the Writing Tower up enough, and she starts understanding almost as well as the Reading Tower — next-token prediction, done well enough, requires understanding as a side effect. This is most of why GPT-family (decoder-only) architecture ate the LLM era.', p: { guess2: 'good', fail: 'dim' } }
    ]
  },
  conceptFlow: {
    title: 'The mechanism, step by step: one mask bit, two families',
    intro: 'Click any box to jump straight there, or press Play and just listen.',
    stages: [
      {
        label: 'Shared block',
        nodes: [
          { id: 'block', text: 'Same transformer block\nattention + FFN + residuals + norm, identical either way' },
        ],
      },
      {
        label: 'BERT: no mask',
        nodes: [
          { id: 'bert', text: 'No causal mask\nw_bert[0] nonzero at every position — sees the whole sequence' },
        ],
      },
      {
        label: 'GPT: causal mask',
        nodes: [
          { id: 'gpt', text: 'Causal mask added\nw_gpt[0] = [1,0,0,0,0] — only itself, nothing later' },
        ],
      },
      {
        label: 'Pretraining objective',
        nodes: [
          { id: 'mlm', text: 'BERT: masked LM\n"The [MASK] sat on the mat" → predict using BOTH sides' },
          { id: 'clm', text: 'GPT: causal LM\n"The cat sat on the ___" → predict using ONLY the past' },
        ],
      },
      {
        label: 'Consequence',
        nodes: [
          { id: 'outcome', text: 'BERT: understanding, can\'t generate\nGPT: generation natively, understanding emerges at scale' },
        ],
      },
    ],
    steps: [
      { active: ['block'], note: 'Both families stack the exact same transformer block from last lesson — multi-head attention plus FFN, wrapped in residuals and LayerNorm. Nothing differs here.' },
      { active: ['bert'], note: 'BERT: no mask added before softmax. Position 0\'s attention weights are nonzero across ALL positions — it can freely look forward and backward.' },
      { active: ['gpt'], note: 'GPT: a causal mask sets scores where j > i to −∞ before softmax. Position 0\'s weights collapse to [1,0,0,0,0] — it can only ever see itself.' },
      { active: ['mlm'], note: 'That one masking bit determines what pretraining is even POSSIBLE: BERT can mask a word in the middle and predict it from both sides — masked language modeling.' },
      { active: ['clm'], note: 'GPT can only ever predict the NEXT token from the past — causal language modeling. Every position gets a training signal, no random masking needed.' },
      { active: ['outcome'], note: 'The consequence cascades all the way to deployment: BERT is architecturally excellent at understanding but cannot generate left-to-right; GPT generates natively, and at large enough scale, understanding emerges as a side effect of getting really good at next-token prediction.' },
    ],
  },
  tech: [
    {
      q: 'Precisely, why can BERT not be used for open-ended left-to-right text generation, architecturally?',
      a: 'BERT\'s self-attention has no causal mask — every one of its N layers was trained with each position free to attend to positions both before AND after it. Its masked-language-modeling pretraining exploited this: predicting a masked token used the full bidirectional context. At generation time, if you tried to produce text left to right, position t\'s hidden state at EVERY layer would need to be computed without positions t+1 onward existing yet — but BERT\'s weights were trained under the assumption that such context IS typically available (except at the specific masked positions, which were a small, randomly-placed minority — 15% — not a full left-to-right recursive setup). There is no way to "just not give it right context" at inference and expect sensible output, because its layers\' learned transformations are calibrated for a fundamentally different information regime than sequential generation requires. This is separate from (and deeper than) BERT simply "not being trained on generation" — even with generation-style fine-tuning, an unmasked bidirectional stack does not straightforwardly support autoregressive decoding the way a causally-masked stack does by construction.'
    },
    {
      q: 'Explain exactly why GPT\'s pretraining objective has zero train/inference mismatch, in contrast to BERT.',
      a: 'GPT\'s pretraining task — predict token t from tokens 1..t-1, for every t in a sequence, via teacher forcing — is LITERALLY the same operation performed at inference: given some prefix, produce a distribution over the next token, using only the prefix. The only difference between training and inference is where the "true" next token comes from (the training corpus during training, the model\'s own sampled output during generation — this is exactly the exposure bias discussed in the seq2seq-attention lesson, which still applies here). BERT\'s pretraining task — predict a MASKED token using bidirectional context, where masks are placed at a random ~15% of positions inside an otherwise-complete, fully-visible sentence — has no equivalent "downstream task" that matches it exactly; classification, NER, and QA (BERT\'s actual use cases) are all fine-tuned as SEPARATE objectives layered on top of the pretrained representations, meaning there IS a task/pretraining-objective gap for BERT that fine-tuning has to bridge, whereas GPT\'s "downstream task" (generate text) is not just similar to but IDENTICAL in mechanism to its pretraining objective.'
    },
    {
      q: 'What specifically did GPT-2/GPT-3 demonstrate that shifted the field toward decoder-only architectures?',
      a: 'The demonstration, roughly: as you scale a purely causal, next-token-prediction-only model (no task-specific fine-tuning, no auxiliary objectives) up in parameters and training data, it acquires increasingly broad capabilities — translation, question answering, arithmetic, summarization — that were never explicitly trained for, simply by being prompted appropriately (few-shot / zero-shot prompting, formalized in GPT-3\'s paper as "Language Models are Few-Shot Learners"). This mattered because it suggested next-token prediction at scale is not a narrow objective that only produces a narrow "text completion" skill — it is a sufficiently rich training signal that, at scale, subsumes most of what separately-designed architectures (a BERT-style classifier, a T5-style seq2seq model) were purpose-built for, without their architectural specialization. The practical consequence: instead of building and maintaining separate encoder-only models for understanding tasks and encoder-decoder models for transformation tasks, a single decoder-only model, scaled up, handles a very wide task surface through prompting alone — a strong simplicity and cost argument that most of the field converged on (GPT, LLaMA, Claude\'s base architecture family, and effectively every modern frontier LLM are decoder-only).'
    },
    {
      q: 'If encoder-decoder architectures give you a "best of both worlds" bidirectional-encoder-plus-generative-decoder, why aren\'t they the dominant LLM architecture?',
      a: 'A few converging reasons, worth naming together rather than picking just one. (1) Parameter efficiency: an encoder-decoder model splits its parameter budget across two specialized stacks (bidirectional encoder + causal decoder); a decoder-only model of the same total size spends its ENTIRE budget on one stack that, per the scaling evidence above, handles both understanding and generation reasonably well via prompting — so at a fixed parameter budget, decoder-only tends to be more capability-per-parameter for general-purpose use. (2) Architectural flexibility: encoder-decoder is naturally shaped for a FIXED "one input sequence → one output sequence" task (translation, summarization); a decoder-only model isn\'t committed to that shape at all — the same weights handle chat, classification-via-prompting, code completion, and multi-turn dialogue without a structural input/output split, which matters enormously for a general-purpose assistant. (3) Training/serving simplicity: one stack, one attention pattern (causal), one KV-cache scheme to optimize (Part 6) — versus two stacks with different attention patterns and a cross-attention bridge to engineer and optimize. Encoder-decoder models remain the RIGHT choice for tasks that are genuinely, structurally input-heavy transformations with a clean input/output split and where bidirectional source understanding matters a lot (T5-style pipelines, Whisper for speech-to-text) — it\'s a real, live architecture family, just not the one that won the general-purpose LLM race.'
    }
  ],
  code: {
    title: 'Same block, two masks: the entire BERT/GPT distinction in code',
    intro: 'One function, one boolean — this is literally the whole architectural difference from last lesson\'s formula.',
    code: `import numpy as np

def softmax_rows(S):
    S = S - S.max(axis=-1, keepdims=True)
    E = np.exp(S)
    return E / E.sum(axis=-1, keepdims=True)

def self_attention(X, Wq, Wk, Wv, causal=False):
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    dk = Q.shape[-1]
    scores = (Q @ K.T) / np.sqrt(dk)

    if causal:
        n = scores.shape[0]
        mask = np.triu(np.full((n, n), -1e9), k=1)   # GPT: block j > i
        scores = scores + mask
    # else: BERT-style — no mask, full bidirectional visibility

    weights = softmax_rows(scores)
    return weights, weights @ V

n, d_model, dk = 5, 8, 4
X  = np.random.randn(n, d_model)
Wq = np.random.randn(d_model, dk) * 0.1
Wk = np.random.randn(d_model, dk) * 0.1
Wv = np.random.randn(d_model, dk) * 0.1

# BERT-style: token 0 CAN see token 4
w_bert, _ = self_attention(X, Wq, Wk, Wv, causal=False)
print("BERT   weights[0]:", w_bert[0].round(2))   # nonzero everywhere

# GPT-style: token 0 CANNOT see token 4 (or 1, 2, 3)
w_gpt, _ = self_attention(X, Wq, Wk, Wv, causal=True)
print("GPT    weights[0]:", w_gpt[0].round(2))    # [1.0, 0, 0, 0, 0] -- only itself`,
    notes: [
      'causal=True/False is the entire code-level difference between building a BERT-style encoder block and a GPT-style decoder block — everything else (Wq/Wk/Wv, the FFN, residuals, LayerNorm) is identical.',
      'w_bert[0] has nonzero weight across ALL 5 positions; w_gpt[0] is exactly [1,0,0,0,0] — position 0 has no earlier positions to attend to, so it can only attend to itself. Position 4 in the GPT version, by contrast, can attend to all 5 (everything up to and including itself).',
      'Pretraining objective is a separate layer on top of this: BERT additionally needs a masking-and-predict data pipeline (randomly replace tokens with [MASK], train to reconstruct); GPT needs only a shifted-by-one target (predict token t+1 from tokens ≤t) — which is why GPT-style pretraining data pipelines are notably simpler to build at scale.'
    ]
  },
  lab: {
    title: 'Build the causal mask and a masked-language-model target generator',
    prompt: 'Pure Python. Implement (1) <code>causal_mask(n)</code> — return an n×n matrix with 0 where j ≤ i (allowed) and -1e9 where j > i (forbidden); (2) <code>mlm_targets(tokens, mask_positions, mask_token="[MASK]")</code> — given a token list and a list of positions to mask, return (masked_tokens, labels) where masked_tokens has mask_token at each masked position (others unchanged) and labels has the ORIGINAL token at masked positions and None elsewhere (BERT-style training targets); (3) <code>clm_targets(tokens)</code> — given a token list, return (inputs, targets) for causal language modeling: inputs = tokens[:-1], targets = tokens[1:] (predict-the-next-token pairs, GPT-style).',
    starter: `def causal_mask(n):
    # n x n: 0.0 where j <= i, -1e9 where j > i
    ...

def mlm_targets(tokens, mask_positions, mask_token="[MASK]"):
    # masked_tokens: tokens with mask_token at each position in mask_positions
    # labels: original token at masked positions, None elsewhere
    # return (masked_tokens, labels)
    ...

def clm_targets(tokens):
    # inputs = tokens[:-1], targets = tokens[1:]
    # return (inputs, targets)
    ...`,
    checks: [
      { re: 'def\\s+causal_mask\\s*\\(', must: true, hint: 'Define causal_mask(n) returning an n x n matrix.', pass: 'causal_mask() defined' },
      { re: '-1e9|-1000000000|float\\(.-inf.\\)', must: true, hint: 'Forbidden positions (j > i) should be a large negative number like -1e9, not zero or a small negative.', pass: 'large negative penalty used' },
      { re: 'def\\s+mlm_targets\\s*\\(', must: true, hint: 'Define mlm_targets(tokens, mask_positions, mask_token="[MASK]") returning (masked_tokens, labels).', pass: 'mlm_targets() defined' },
      { re: 'def\\s+clm_targets\\s*\\(', must: true, hint: 'Define clm_targets(tokens) returning (inputs, targets) shifted by one position.', pass: 'clm_targets() defined' }
    ],
    tests: `# causal_mask: lower triangle (incl diagonal) is 0, strict upper triangle is -1e9
m = causal_mask(4)
assert len(m) == 4 and len(m[0]) == 4
for i in range(4):
    for j in range(4):
        if j <= i:
            assert m[i][j] == 0.0, f"m[{i}][{j}] should be 0.0 (allowed)"
        else:
            assert m[i][j] <= -1e8, f"m[{i}][{j}] should be a large negative (forbidden)"

# mlm_targets: masked positions replaced, labels capture the originals
tokens = ["the", "cat", "sat", "on", "the", "mat"]
masked, labels = mlm_targets(tokens, [1, 4])
assert masked == ["the", "[MASK]", "sat", "on", "[MASK]", "mat"]
assert labels == [None, "cat", None, None, "the", None]

# clm_targets: predict-the-next-token pairs, shifted by one
inputs, targets = clm_targets(["the", "cat", "sat", "on", "the", "mat"])
assert inputs  == ["the", "cat", "sat", "on", "the"]
assert targets == ["cat", "sat", "on", "the", "mat"]
assert len(inputs) == len(targets) == 5

print("causal mask (GPT) + MLM targets (BERT) + CLM targets (GPT). The two pretraining objectives, side by side.")`,
    runnable: true,
    solution: `def causal_mask(n):
    return [[0.0 if j <= i else -1e9 for j in range(n)] for i in range(n)]

def mlm_targets(tokens, mask_positions, mask_token="[MASK]"):
    masked_tokens = list(tokens)
    labels = [None] * len(tokens)
    for pos in mask_positions:
        labels[pos] = tokens[pos]
        masked_tokens[pos] = mask_token
    return masked_tokens, labels

def clm_targets(tokens):
    return tokens[:-1], tokens[1:]`,
    notes: [
      'causal_mask(n) is literally the mask you\'d add to self_attention\'s scores before softmax — you built this exact structure conceptually last lesson; here it\'s the standalone, reusable piece.',
      'mlm_targets only supervises the MASKED positions (labels is None elsewhere) — BERT\'s loss is computed ONLY at masked positions, not every position, which is part of why MLM pretraining needs more total tokens to see the same number of "supervised" predictions as CLM does.',
      'clm_targets shows why causal language modeling is "free" supervision: EVERY position gets a training signal (predict the next token), no random masking scheme needed, no held-out fraction of positions — this simplicity is part of why GPT-style pretraining data pipelines scale so easily.'
    ]
  },
  quiz: [
    {
      q: 'What is the ONE architectural bit that distinguishes a BERT-style block from a GPT-style block?',
      options: ['Whether a causal mask is applied before the self-attention softmax — present (GPT, sees only the past) or absent (BERT, sees the whole sequence)', 'BERT uses convolution instead of attention', 'GPT has no feedforward sub-layer', 'BERT has no positional encoding'],
      correct: 0,
      explain: 'Same transformer block (attention + FFN + residuals + norm) in both. The presence or absence of the causal mask is the entire structural difference, and it cascades into everything else.'
    },
    {
      q: 'Why can BERT not be fine-tuned to generate text left-to-right the way GPT does?',
      options: ['Its bidirectional pretraining trained every layer to expect access to right-context that does not exist yet during left-to-right generation — an architectural mismatch, not just a missing skill', 'BERT has fewer parameters than GPT', 'BERT was never trained on enough text', 'BERT does not use a feedforward network'],
      correct: 0,
      explain: 'Every one of BERT\'s layers was calibrated to use both-directions context during masked-token prediction. Sequential generation would require every layer to work with information (or lack thereof) it never trained under.'
    },
    {
      q: 'Why does GPT\'s causal language modeling objective have no train/inference mismatch?',
      options: ['Predicting the next token from only prior tokens is literally the same operation at both training time and generation time', 'GPT is never actually trained — it only learns at inference time', 'BERT also has no train/inference mismatch, so this is not a real distinction', 'GPT uses reinforcement learning instead of supervised pretraining'],
      correct: 0,
      explain: 'Teacher-forced next-token prediction during training and next-token generation at inference are the same procedure, differing only in whether the "true" prior token is from the corpus or from the model\'s own prior output.'
    },
    {
      q: 'What did GPT-2/GPT-3 demonstrate that shifted the field toward decoder-only architectures?',
      options: ['A purely causal, next-token-prediction model, scaled up in size and data, acquires broad task capability (translation, QA, arithmetic) via prompting alone, without task-specific architecture or fine-tuning', 'Bidirectional models cannot be trained at all above a certain size', 'Encoder-decoder models are mathematically equivalent to decoder-only models', 'Causal language modeling requires less data than masked language modeling'],
      correct: 0,
      explain: '"Language Models are Few-Shot Learners" — scale plus next-token prediction alone subsumed much of what purpose-built architectures were designed for, favoring one flexible decoder-only design over specialized alternatives.'
    },
    {
      q: 'When is an encoder-decoder architecture (T5, Whisper) still the right choice over decoder-only?',
      options: ['When the task is a genuinely input-heavy transformation with a clean input/output split (translation, speech-to-text) where a full bidirectional read of the source materially helps', 'Never — decoder-only is strictly better in all cases', 'Only for tasks with fewer than 100 training examples', 'Only when GPU memory is extremely limited'],
      correct: 0,
      explain: 'Encoder-decoder keeps a dedicated bidirectional read of the full source (via the encoder) plus autoregressive generation (via the decoder) connected through cross-attention — a strong fit for structured transformation tasks, even though decoder-only won the general-purpose race.'
    }
  ],
  testFlow: {
    title: 'Test yourself: BERT vs GPT',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'What is the ONE architectural bit that distinguishes a BERT-style block from a GPT-style block?',
        choices: [
          { text: 'Whether a causal mask is applied before the self-attention softmax — present (GPT) or absent (BERT)', to: 'q1_right' },
          { text: 'BERT uses convolutional layers instead of self-attention', to: 'q1_wrong_conv' },
          { text: 'GPT has no feedforward sub-layer', to: 'q1_wrong_ffn' },
        ],
      },
      q1_right: { end: true, correct: true, text: 'Right — same transformer block (attention + FFN + residuals + norm) in both. The presence or absence of the causal mask is the entire structural difference, and it cascades into everything else: pretraining objective, native strengths, deployment role.', next: 'q2' },
      q1_wrong_conv: { end: true, correct: false, text: 'Both BERT and GPT are pure transformer stacks — no convolutions involved in either. The difference is purely about masking within self-attention, not the layer type.', retry: 'q1' },
      q1_wrong_ffn: { end: true, correct: false, text: 'Both families include the standard feedforward sub-layer in every block — that machinery is identical. Only the presence of the causal mask on self-attention differs.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'Why can\'t BERT be fine-tuned to generate text left-to-right the way GPT does?',
        choices: [
          { text: 'Its bidirectional pretraining calibrated every layer\'s weights to expect right-context that simply doesn\'t exist yet during left-to-right generation', to: 'q2_right' },
          { text: 'BERT has too few parameters compared to GPT', to: 'q2_wrong_size' },
          { text: 'BERT was never trained on enough text to learn generation', to: 'q2_wrong_data' },
        ],
      },
      q2_right: { end: true, correct: true, text: 'Exactly — this isn\'t a missing skill you can fine-tune in, it\'s an architectural mismatch. Every one of BERT\'s layers learned transformations calibrated for a bidirectional-information world; feeding it a partial sequence at inference gives every layer inputs from a distribution it never learned to handle.', next: 'q3' },
      q2_wrong_size: { end: true, correct: false, text: 'Parameter count is unrelated — you could scale BERT up enormously and it would still be structurally unable to generate left-to-right. The blocker is the bidirectional TRAINING regime, not model size.', retry: 'q2' },
      q2_wrong_data: { end: true, correct: false, text: 'More training data wouldn\'t fix this — the issue isn\'t insufficient exposure, it\'s that BERT\'s pretraining objective (masked language modeling with full bidirectional context) is architecturally incompatible with sequential left-to-right generation.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'Why does GPT\'s causal language modeling objective have zero train/inference mismatch?',
        choices: [
          { text: 'Predicting the next token from only prior tokens is literally the same operation at both training time and generation time', to: 'q3_right' },
          { text: 'GPT skips pretraining entirely and only learns at inference time', to: 'q3_wrong_notrain' },
          { text: 'BERT has the same property, so this isn\'t actually a meaningful distinction', to: 'q3_wrong_same' },
        ],
      },
      q3_right: { end: true, correct: true, text: 'Right — teacher-forced next-token prediction during training and next-token generation at inference are the same procedure, differing only in whether the "true" prior token comes from the training corpus or the model\'s own prior output. BERT has no equivalent match between its pretraining task and any single downstream use.', next: null },
      q3_wrong_notrain: { end: true, correct: false, text: 'GPT is very much pretrained (on massive next-token-prediction corpora) before it ever generates anything at inference — that pretraining is exactly what this question is about.', retry: 'q3' },
      q3_wrong_same: { end: true, correct: false, text: 'BERT does NOT have this property — its masked-language-modeling pretraining (predict ~15% masked positions using bidirectional context) has no matching downstream task; classification/NER/QA are separately fine-tuned objectives layered on top.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Saying "BERT is for understanding, GPT is for generating" without being able to explain WHY — the causal mask is the mechanism; know it, don\'t just recite the label.',
    'Assuming BERT could generate text if you just "removed the mask restriction" at inference — the model\'s weights were trained under bidirectional assumptions at every layer; there is no clean way to retrofit autoregressive generation onto that training.',
    'Forgetting that MLM loss is only computed at the ~15% masked positions, while CLM loss is computed at every position — a real difference in supervision density per training example, not just a philosophical difference in objective.',
    'Treating "decoder-only won" as proof encoder-decoder or encoder-only are obsolete. T5-style and BERT-style models remain the right, efficient choice for their specific task shapes (structured transformation, classification/extraction pipelines) — "what won the general-purpose LLM race" and "what\'s the best tool for this specific task" are different questions.',
    'Confusing "causal mask" (a training/architecture detail — which positions self-attention may see) with "causal inference" (the statistics field about cause and effect) — same word, entirely unrelated concepts, and interviewers do check this isn\'t conflated.',
    'Not knowing which family a well-known model belongs to. Quick reference worth memorizing: BERT/RoBERTa = encoder-only; GPT/LLaMA/most modern chat LLMs = decoder-only; T5/BART/Whisper = encoder-decoder.'
  ],
  interview: [
    {
      q: 'Compare BERT and GPT: architecture, pretraining objective, and native task strengths.',
      a: 'Architecture: both stack the same transformer block (multi-head self-attention + FFN, wrapped in residuals and LayerNorm) from a shared design, differing in exactly one structural choice — BERT uses NO causal mask (bidirectional self-attention, every position sees the whole sequence); GPT uses a causal mask (every position sees only itself and earlier positions). Pretraining objective: BERT uses masked language modeling — randomly mask ~15% of tokens and predict the originals using full bidirectional context, loss computed only at masked positions. GPT uses causal language modeling — predict every token from only its predecessors, loss computed at every position, via teacher forcing. Native strengths: BERT\'s bidirectionality makes it excellent at UNDERSTANDING tasks where the whole input is available upfront (classification, NER, extractive QA — richer representations from seeing both directions) but architecturally unable to generate text autoregressively. GPT\'s causal objective is IDENTICAL in mechanism to the generation task itself (predict next token from the past), making it naturally suited to open-ended generation, and — the key empirical finding that reshaped the field — scaled up, it also acquires strong understanding capability via prompting, without dedicated architecture for it.'
    },
    {
      q: 'A colleague asks why we can\'t just "turn off" BERT\'s bidirectionality at inference time to make it generate text. What\'s your answer?',
      a: 'It is not a runtime switch — bidirectionality is baked into every layer\'s LEARNED WEIGHTS, not just a configuration flag. During pretraining, every one of BERT\'s N layers was optimized under the assumption that, for any given position, information from BOTH directions is typically available (masking hid roughly 15% of positions, not a systematic "no future ever" regime). The learned attention patterns, the learned Wq/Wk/Wv projections, the learned FFN transformations — all of it was shaped by gradient descent to work well in a bidirectional-information world. If you now feed it a partial sequence and mask out future positions at inference (essentially trying to retrofit a causal mask BERT never trained with), every layer receives inputs from a distribution its weights were never calibrated for — the internal representations at layer 1 would already be "wrong" relative to what layer 2 learned to expect from layer 1, and errors compound through the stack. It is architecturally possible to build a bidirectional model and separately train a causal one with the same block design (that is literally the difference between BERT and GPT), but you cannot get generation-quality output from BERT\'s specific TRAINED weights just by changing the attention pattern at inference — the weights and the attention pattern were learned together.'
    },
    {
      q: 'Why did decoder-only architectures come to dominate large language models over encoder-only or encoder-decoder designs?',
      a: 'Three reinforcing reasons. First, empirical: GPT-2 and especially GPT-3 demonstrated that a purely causal, next-token-prediction objective, scaled up in parameters and data, produces broad task capability (translation, QA, summarization, arithmetic, code) via prompting alone — capabilities that encoder-only and encoder-decoder designs achieved only through task-specific architecture or fine-tuning. This suggested next-token prediction at scale is a sufficiently rich training signal to subsume much of what specialized architectures were purpose-built for. Second, efficiency: a decoder-only model spends its entire parameter budget on one stack; an encoder-decoder model of equal size splits its budget across two specialized stacks plus a cross-attention bridge, generally yielding less capability per parameter for open-ended, general-purpose use. Third, flexibility: decoder-only isn\'t architecturally committed to a fixed input/output shape — the same weights handle chat, classification-via-prompting, multi-turn dialogue, and code without a structural encoder/decoder split, which is essential for a general-purpose assistant that needs to handle arbitrarily many task types through one interface (the prompt). Encoder-decoder architectures remain the better engineering choice for tasks that are genuinely, structurally transformation-shaped with a clear input/output split (T5-style pipelines, Whisper) — but for building one flexible, general-purpose model, decoder-only\'s combination of scale-driven capability, parameter efficiency, and flexibility won out.'
    },
    {
      q: 'Design question: you need to build a system that classifies customer support tickets into 12 categories AND drafts a suggested reply. Would you use one model or two, and what architecture(s)?',
      a: 'This is worth answering by separating the two sub-tasks rather than assuming one architecture must do both. Classification into 12 fixed categories is a bounded, input-only task — an encoder-only model (BERT-family) fine-tuned with a classification head is typically the most efficient choice: smaller, faster, cheaper to serve, and bidirectional context is a genuine asset for reading a whole ticket before committing to one of 12 labels. Drafting a reply is open-ended generation conditioned on the ticket content — this calls for a decoder-only model (or the decoder side of an encoder-decoder model), since generation requires the causal, next-token capability that encoder-only architectures structurally lack. In practice there are two reasonable system designs: (a) two separate specialized models — a small fine-tuned BERT-family classifier plus a decoder-only LLM (open-source via Ollama/HF, or an API model) prompted to draft replies, which is cheaper to run at high classification volume and easier to evaluate/debug independently (the model-evaluation lesson\'s discipline applies per component); or (b) one sufficiently capable decoder-only LLM doing both via prompting (classify AND draft in one call), simpler to build and maintain but more expensive per request and harder to guarantee strict adherence to exactly 12 valid category labels without extra output-parsing/validation. The right call depends on ticket volume, latency/cost budget, and how strict the category-label guarantee needs to be — worth stating explicitly rather than defaulting to "one big LLM for everything."'
    }
  ]
};
