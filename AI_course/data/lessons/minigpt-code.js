window.LESSONS = window.LESSONS || {};
window.LESSONS['minigpt-code'] = {
  id: 'minigpt-code',
  title: 'Build a Mini-GPT in PyTorch',
  category: 'Part 5 — Transformers',
  timeMin: 65,
  summary: 'Every piece is already yours: causal self-attention (built by hand, twice), the transformer block (residuals, LayerNorm, FFN), and the GPT objective (predict the next token, only look backward). This lesson assembles them into one real PyTorch model — CausalSelfAttention → TransformerBlock → MiniGPT — with a working generate() loop, so "build a GPT" stops being a black box and becomes a few hundred lines you understand end to end.',
  goals: [
    'Implement multi-head causal self-attention as an nn.Module, using ONE linear projection split into heads (not h separate layers)',
    'Assemble a pre-norm transformer decoder block and stack it into a full MiniGPT model',
    'Explain weight tying between the input embedding and output projection, and why it helps',
    'Write and explain an autoregressive generate() loop: crop context, forward, sample, append, repeat',
    'Estimate a transformer\'s parameter count from its shape (n_layers, d_model) and explain why naive generation is quadratically wasteful'
  ],
  concept: [
    {
      h: 'What you already own versus what\'s new here',
      p: [
        'Count the ideas: causal masking (self-attention lesson\'s lab), scaled dot-product attention (same lab), the residual+LayerNorm+FFN block (transformer-architecture lesson\'s lab), positional encoding (same lesson), the causal language modeling objective (bert-vs-gpt lesson). Every mathematical idea in a GPT is something you have implemented in pure Python in this course. What\'s new in THIS lesson is purely engineering: writing the same ideas as PyTorch nn.Module classes (the pytorch-fundamentals lesson\'s pattern) so they compose, batch, run on GPU, and train via autograd instead of hand-derived gradients.',
        'This is deliberate, and worth saying explicitly in an interview: "I understand what a transformer computes because I derived it by hand; I use PyTorch because re-deriving gradients for a 12-layer network by hand would be a waste of everyone\'s time." That sentence is the entire thesis of this course\'s Part 3 → Part 5 arc.'
      ]
    },
    {
      h: 'CausalSelfAttention as a module: one projection, not three',
      p: [
        'The lab version projected Q, K, V with three separate weight matrices. The efficient PyTorch idiom uses ONE nn.Linear(d_model, 3*d_model) and splits its output into Q, K, V afterward — same math, fewer kernel launches, one weight matrix instead of three (better GPU utilization). Multi-head splitting works by reshaping: a [batch, seq, d_model] tensor becomes [batch, n_heads, seq, d_head] via .view(...).transpose(1,2) — the SAME total numbers, just reinterpreted so torch.matmul on the last two dimensions performs all heads\' attention as one batched operation (recall the pytorch-fundamentals lesson\'s note that @ on batched tensors does independent matmuls per leading dimension — here "batch" includes both the real batch AND the heads).',
        'The causal mask is a fixed, non-trainable, seq_len × seq_len lower-triangular matrix — built once and stored with <code>self.register_buffer("mask", ...)</code> rather than as a regular Python attribute or an nn.Parameter. A buffer moves with the model when you call .to(device) (so the mask always lives on the same device as the tensors it\'s added to) and is saved/loaded with state_dict, but — unlike a Parameter — it never receives a gradient and is never touched by the optimizer. Exactly the right category for "fixed data the model needs, but doesn\'t learn."'
      ]
    },
    {
      h: 'TransformerBlock: pre-norm, residuals, and a GELU feedforward',
      p: [
        'Following the transformer-architecture lesson\'s note that modern models favor pre-norm: <code>x = x + self.attn(self.ln1(x))</code> then <code>x = x + self.ffn(self.ln2(x))</code> — LayerNorm applied to the INPUT of each sub-layer, with the raw x carried through the residual path untouched. The feedforward network widens to 4×d_model and back down, using GELU instead of ReLU (GPT\'s and BERT\'s standard choice — a smooth approximation of ReLU that empirically trains slightly better in transformers; the difference from ReLU is a refinement, not a new concept — still "widen, nonlinearity, narrow").',
        'Stacking N of these blocks (via nn.ModuleList, iterated in forward — not nn.Sequential, since later lessons\' more exotic blocks sometimes need extra arguments Sequential can\'t pass through) is the entire "depth" of the model. GPT-2 small: 12 blocks. GPT-3: 96. The block\'s CODE does not change with depth — only how many times you instantiate and loop over it.'
      ]
    },
    {
      h: 'MiniGPT end to end: embeddings in, logits out',
      p: [
        'The full model: token embedding (nn.Embedding(vocab_size, d_model) — the word-embeddings lesson\'s lookup table, now trained end-to-end rather than pretrained separately) plus a LEARNED positional embedding (nn.Embedding(block_size, d_model), indexed by position 0..seq_len-1 — the simpler, learned alternative to the sinusoidal formula from the transformer-architecture lesson, and what GPT-2 actually uses), summed together, then N transformer blocks, then a final LayerNorm, then a linear head projecting d_model back up to vocab_size logits.',
        '<b>Weight tying</b>: set <code>self.head.weight = self.tok_emb.weight</code> — the SAME matrix is used both to look up input token embeddings and to project final hidden states to output logits. This is not a hack: a word\'s "meaning" (used to interpret it as input) and a word\'s "identity" (used to score it as a candidate output) are plausibly two views of the same underlying vector, and tying them cuts a genuinely large parameter block (vocab_size × d_model — often the single biggest matrix in a small model) roughly in half while empirically improving quality, especially in smaller models where that matrix is a large fraction of total parameters.',
        'Training uses the causal language modeling loss from the bert-vs-gpt lesson: reshape logits from [batch, seq, vocab] to [batch*seq, vocab] and targets from [batch, seq] to [batch*seq], then F.cross_entropy(logits, targets) — the SAME multi-class cross-entropy from the neural-networks lesson, just computed at every sequence position simultaneously via teacher forcing.'
      ]
    },
    {
      h: 'generate(): the autoregressive loop, and its hidden cost',
      p: [
        'Training processes a whole sequence in parallel (teacher forcing). GENERATION cannot — there is no "next token" to feed until the model produces one, so tokens must be produced one at a time, each depending on all previous ones: crop the current sequence to the last block_size tokens (transformers have a fixed maximum context, the same block_size used to size the causal mask), run a forward pass, take ONLY the last position\'s logits (that\'s the prediction for "what comes next"), convert to a probability distribution (softmax, optionally with a temperature that sharpens or flattens the distribution — Part 6\'s sampling lesson goes deep here), sample or take the argmax, append the new token, and repeat.',
        'The hidden cost, worth naming even though the full fix belongs to Part 6: generating token t+1 from scratch reprocesses the ENTIRE sequence 1..t through every layer, even though tokens 1..t-1\'s keys and values haven\'t changed since the last step. Naive generation is O(n²) in the number of generated tokens for exactly this reason (n tokens, each triggering an O(n) forward pass over everything so far). The standard production fix is a <b>KV cache</b>: store each layer\'s computed keys and values as generation proceeds, and at each new step only compute Q/K/V for the ONE new token, reusing the cached K/V for everything before it — turning each generation step from O(n) back down to O(1) amortized per layer. This lab\'s generate() is intentionally the simple, uncached version, so the O(n²) cost is visible rather than hidden — Part 6 builds the cached version once inference optimization is the explicit topic.'
      ]
    },
    {
      h: 'Sizing intuition: how many parameters does this thing have?',
      p: [
        'A commonly-used rule of thumb for a transformer\'s NON-embedding parameter count: roughly 12 × n_layers × d_model² (this comes from each block\'s attention projections — Wq, Wk, Wv, Wo, each roughly d_model² — plus the FFN\'s two matrices at 4×d_model² each, summing to about 12×d_model² per block). GPT-2 small: 12 layers, d_model=768 → 12 × 12 × 768² ≈ 85M, close to its actual ~124M once the embedding and output matrices are added (partially offset by weight tying). This formula is worth memorizing in rough form — "parameter count scales with layers times d_model squared" is a fast mental estimate for "how big is this architecture", useful the moment someone quotes you a model\'s (n_layers, d_model) shape without its total parameter count.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Writing Tower, finally built for real',
      text: 'Franky stops sketching and starts welding. The tower he blueprinted two lessons ago becomes an actual machine, and every part gets a physical form. The GLYPH DICTIONARY is one shared lookup wheel — spin it to a glyph, get back its meaning-vector — and Franky makes a deliberate choice: the SAME wheel is bolted in at both the reading end (converting an incoming glyph to meaning) and the writing end (converting a candidate meaning back to the most likely glyph), because a glyph\'s meaning-when-read and its identity-when-predicted are the same underlying thing — one wheel, two jobs, half the brass he\'d need for two separate wheels (weight tying, riveted into the hull). Above the wheel sits a row of numbered PEDESTALS, one per position in the line being composed, so the tower always knows not just WHAT glyph but WHERE (positional embedding). Then N identical FLOORS, stacked exactly per the blueprint: each floor\'s glyphs check backward only — never forward, the causal rule etched into the floor\'s support beams themselves as a permanent restriction, not a suggestion (register_buffer — fixed, load-bearing, never adjusted by training) — then privately mull things over, then pass upward through a through-beam. At the very top, a DIAL spins to show a probability for every possible next glyph; Franky adds a lever that either locks the dial to its top pick every time (deterministic) or lets it wobble with a bit of randomness for variety (temperature sampling). The first live test: feed the tower a half-finished inscription. It reads the whole thing, the dial spins, picks a glyph, CARVES it onto the end of the line — and then, critically, the tower reads its OWN new line, dial spins again, carves the next glyph, on and on, one glyph feeding the next round. Usopp notices something wasteful on the third test run: for every single new glyph, the tower re-reads the ENTIRE inscription from the very first glyph, floor by floor, even though the early glyphs never change. "Feels like reading the whole book again just to write one more word," he says. Franky agrees it\'s wasteful — and admits fixing it (remembering what it already figured out about the old glyphs, instead of re-deriving it every time) is next month\'s project. The tower works. It\'s just not fast yet.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Building ChandlerBot',
      text: 'The gang, bored during a blizzard, actually builds the thing they\'ve been joking about: a machine that finishes a sentence the way Chandler would. Monica draws the floor plan from the group-chat lesson and Ross insists on a detail: the SAME dictionary of Chandler-isms should be used both for reading his old texts AND for guessing his next word — no point building two separate glossaries when "how Chandler uses a word" and "what word Chandler would pick" are obviously the same knowledge (weight tying, argued over hot chocolate). They tag every word slot with its position in the sentence so ChandlerBot knows "this is word 3 of this text," stack several "read-backward-then-think" panels exactly per the blueprint (each panel forbidden, by a rule wired into the panel itself, from peeking at words that haven\'t been typed yet — the causal restriction, permanent, not something the training adjusts), and cap it with a dial that guesses the next word — with a "randomness knob" Joey insists on turning up so ChandlerBot doesn\'t say the exact same joke every time (temperature). First test: they type "Could this blizzard BE any more—" and ChandlerBot correctly guesses "annoying", appends it, then re-reads the WHOLE sentence including its own new word to guess the one after that, over and over. Rachel clocks the inefficiency on live test three: "it just re-read the entire sentence from the start, again, just to add ONE more word?" Chandler: "So it\'s exactly as inefficient as me telling a story." They agree to fix the re-reading later — a rainy-day project called caching — but for one blizzard afternoon, ChandlerBot writes a passable Chandler joke, one word at a time, entirely from parts everyone in the room already understood.'
    },
    why: 'Everything from the last three lessons, physically assembled: a shared dictionary for both reading and writing (weight tying), position tags (positional embedding), stacked backward-only floors (causal transformer blocks), and a dial at the top that predicts one glyph/word at a time, feeding each new piece back in as input for the next (autoregressive generation) — with one honest, deliberately-left-in inefficiency (re-reading everything every step) that sets up the KV-cache fix waiting in Part 6.'
  },
  storyAnim: {
    title: 'The Writing Tower generates, one glyph at a time',
    h: 260,
    props: [
      { id: 'dict', emoji: '📖', label: 'shared glyph dictionary (tied weights)', x: 12, y: 14 },
      { id: 'pedestal', emoji: '🔢', label: 'position pedestals', x: 34, y: 14 },
      { id: 'floors', emoji: '🏢', label: 'N floors (causal blocks)', x: 56, y: 14 },
      { id: 'dial', emoji: '🎯', label: 'next-glyph dial', x: 78, y: 14 },
      { id: 'line', emoji: '📜', label: '"beneath the ___"', x: 40, y: 50 },
      { id: 'newglyph', emoji: '🪨', label: 'new glyph: "sea"', x: 78, y: 50 },
      { id: 'waste', emoji: '♻️', label: 'reads WHOLE line again next step', x: 40, y: 84 }
    ],
    actors: [
      { id: 'franky', emoji: '🤖', label: 'Franky', x: 12, y: 60 }
    ],
    steps: [
      { c: 'The tower reads the half-finished line through the shared dictionary and position pedestals.', p: { dict: 'lit', pedestal: 'lit', line: 'lit' } },
      { c: 'The line passes up through N causal floors — each glyph checks only backward, never forward.', p: { floors: 'lit' }, a: { franky: [50, 40] } },
      { c: 'The dial at the top spins to a probability over every possible next glyph, and picks (or samples) one.', p: { dial: 'good' } },
      { c: 'The new glyph is carved onto the line.', p: { newglyph: 'good' } },
      { c: 'To generate the NEXT glyph after that, the tower reads the ENTIRE line again from scratch — including the glyph it just carved.', p: { waste: 'bad' }, l: { waste: 'O(n²) over a full generation — the honest cost of no caching' } },
      { c: 'This works, but it\'s wasteful — remembering what the early floors already computed, instead of redoing it, is next month\'s project (Part 6: KV cache).', p: { waste: 'bad' } }
    ]
  },
  tech: [
    {
      q: 'Why project Q, K, V with ONE nn.Linear(d_model, 3*d_model) instead of three separate nn.Linear(d_model, d_model) layers?',
      a: 'Mathematically identical — splitting a [d_model, 3*d_model] weight matrix into three [d_model, d_model] chunks and applying them separately computes exactly the same three projections as three separate layers would. The reason to prefer one fused layer is purely an engineering/performance one: a single larger matrix multiply launches as ONE GPU kernel instead of three, better utilizing the hardware\'s parallelism (larger matmuls have better compute-to-overhead ratio), and it\'s one fewer set of weights to separately initialize and manage. This is a common pattern worth recognizing in real model code (nanoGPT, most production transformer implementations fuse Q/K/V this way) — when you see one large linear layer followed by a .split() or .chunk() call, that\'s this exact trick, not a different mathematical operation.'
    },
    {
      q: 'Why register the causal mask as a buffer (register_buffer) instead of a Parameter or a plain instance attribute?',
      a: 'Three requirements, and only register_buffer satisfies all three. It must move with the model across devices (model.to("cuda") should relocate the mask along with the weights, so mask-addition doesn\'t crash with a device mismatch) — a plain Python attribute (self.mask = torch.tril(...)) does NOT get moved by .to(device) automatically, a classic silent bug. It must be saved and restored with the model\'s state_dict (so a reloaded model has a correctly-shaped mask without needing to be rebuilt from scratch) — again, a plain attribute wouldn\'t be. And it must NOT receive a gradient or be updated by the optimizer (nn.Parameter tensors are, by definition, included in model.parameters() and updated by opt.step() — the causal mask is fixed structure, not a learned quantity, and training it would be nonsensical). register_buffer is PyTorch\'s purpose-built category for exactly this: "tensor state that belongs to the model and must travel with it, but isn\'t learned."'
    },
    {
      q: 'Explain weight tying precisely: what is actually shared, and why does it help beyond just saving parameters?',
      a: 'The token embedding matrix (shape [vocab_size, d_model], mapping token IDs to input vectors) and the output projection matrix (shape [d_model, vocab_size] before a transpose, mapping final hidden states to vocabulary logits) are set to be the LITERAL SAME tensor in memory (self.head.weight = self.tok_emb.weight in PyTorch, which shares the underlying parameter — gradients from the loss flowing through the output layer during backward() correctly accumulate into the same tensor that the embedding lookup also uses, since autograd tracks the shared tensor, not two separate copies). Parameter savings: this matrix is often vocab_size (30k-100k+) × d_model — frequently the single largest weight matrix in a small-to-medium model — so tying roughly halves total parameters relative to two independent matrices of that size. The QUALITY argument (from the original "Using the Output Embedding to Improve Language Models" paper) is that a token\'s representation as something the model READS (its meaning as input context) and as something the model PREDICTS (its identity as an output candidate) are plausibly the same semantic object, so forcing them to share parameters acts as a form of regularization consistent with that assumption — and empirically tends to improve perplexity, especially in smaller models where the tied matrix is a larger fraction of the total parameter budget.'
    },
    {
      q: 'Why is naive (uncached) autoregressive generation O(n²) in the number of tokens generated, and what does a KV cache actually cache?',
      a: 'Generating token t requires a full forward pass over the current sequence of length t (every layer recomputes attention over all t positions, an O(t) operation per layer per step). Generating a total of n tokens this way costs Σₜ₌₁ⁿ O(t) = O(n²) total — the same quadratic-in-sequence-length cost from the self-attention lesson, except now paid REPEATEDLY, once per generated token, because each step reprocesses everything from scratch. The wasted work: tokens 1..t-1\'s KEY and VALUE vectors at every layer are IDENTICAL every single time they get recomputed — they only depend on those tokens\' own (unchanging) embeddings and the (fixed, already-trained) Wk/Wv matrices, not on what\'s been generated since. A KV cache stores, per layer, the K and V tensors computed so far; at each new generation step, the model computes Q/K/V for ONLY the one new token, appends its K and V to the cache, and computes attention using the new Q against the FULL cached K/V (old + new) — reusing rather than recomputing the old portion. This turns each generation step\'s cost from O(t) back down to O(1) (amortized per layer, for the new token\'s work), making total generation cost O(n) instead of O(n²) — the single most important inference-time optimization for autoregressive transformers, formalized in Part 6.'
    }
  ],
  code: {
    title: 'MiniGPT: the full forward pass and a generation call',
    intro: 'The assembled model — CausalSelfAttention, TransformerBlock, MiniGPT — with a training step and a generate() call, so you can see the whole shape at once before building it piece by piece in the lab.',
    code: `import torch
import torch.nn as nn
import torch.nn.functional as F

class CausalSelfAttention(nn.Module):
    def __init__(self, d_model, n_heads, block_size):
        super().__init__()
        self.n_heads, self.d_head = n_heads, d_model // n_heads
        self.qkv = nn.Linear(d_model, 3 * d_model)
        self.proj = nn.Linear(d_model, d_model)
        mask = torch.tril(torch.ones(block_size, block_size)).view(1, 1, block_size, block_size)
        self.register_buffer("mask", mask)

    def forward(self, x):
        B, T, C = x.shape
        q, k, v = self.qkv(x).split(C, dim=-1)                       # each (B, T, C)
        q = q.view(B, T, self.n_heads, self.d_head).transpose(1, 2)  # (B, heads, T, d_head)
        k = k.view(B, T, self.n_heads, self.d_head).transpose(1, 2)
        v = v.view(B, T, self.n_heads, self.d_head).transpose(1, 2)

        scores = (q @ k.transpose(-2, -1)) / (self.d_head ** 0.5)    # (B, heads, T, T)
        scores = scores.masked_fill(self.mask[:, :, :T, :T] == 0, float("-inf"))
        weights = F.softmax(scores, dim=-1)
        out = weights @ v                                             # (B, heads, T, d_head)
        out = out.transpose(1, 2).contiguous().view(B, T, C)          # merge heads back
        return self.proj(out)

class TransformerBlock(nn.Module):
    def __init__(self, d_model, n_heads, block_size):
        super().__init__()
        self.ln1 = nn.LayerNorm(d_model)
        self.attn = CausalSelfAttention(d_model, n_heads, block_size)
        self.ln2 = nn.LayerNorm(d_model)
        self.ffn = nn.Sequential(nn.Linear(d_model, 4 * d_model), nn.GELU(), nn.Linear(4 * d_model, d_model))

    def forward(self, x):
        x = x + self.attn(self.ln1(x))    # pre-norm, residual
        x = x + self.ffn(self.ln2(x))
        return x

class MiniGPT(nn.Module):
    def __init__(self, vocab_size, d_model, n_heads, n_layers, block_size):
        super().__init__()
        self.block_size = block_size
        self.tok_emb = nn.Embedding(vocab_size, d_model)
        self.pos_emb = nn.Embedding(block_size, d_model)
        self.blocks = nn.ModuleList([TransformerBlock(d_model, n_heads, block_size) for _ in range(n_layers)])
        self.ln_f = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, vocab_size, bias=False)
        self.head.weight = self.tok_emb.weight            # weight tying

    def forward(self, idx, targets=None):
        B, T = idx.shape
        pos = torch.arange(T, device=idx.device)
        x = self.tok_emb(idx) + self.pos_emb(pos)          # (B, T, d_model)
        for block in self.blocks:
            x = block(x)
        x = self.ln_f(x)
        logits = self.head(x)                              # (B, T, vocab_size)
        loss = None
        if targets is not None:
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1))
        return logits, loss

    @torch.no_grad()
    def generate(self, idx, max_new_tokens, temperature=1.0):
        for _ in range(max_new_tokens):
            idx_cond = idx[:, -self.block_size:]            # crop to context window
            logits, _ = self(idx_cond)
            logits = logits[:, -1, :] / temperature         # last position only
            probs = F.softmax(logits, dim=-1)
            next_id = torch.multinomial(probs, num_samples=1)
            idx = torch.cat([idx, next_id], dim=1)
        return idx`,
    notes: [
      'q.view(B, T, self.n_heads, self.d_head).transpose(1, 2) is THE multi-head trick — one projection, reinterpreted so torch.matmul does all heads at once. Print shapes at every line if this feels opaque; it always pays off.',
      'masked_fill(mask == 0, -inf) is the causal mask applied as an ADDITIVE penalty via a different API than the lab\'s explicit -1e9 addition — same effect, PyTorch idiom.',
      '@torch.no_grad() on generate() — no gradients needed at inference, and skipping graph-building saves real memory and time (the pytorch-fundamentals lesson\'s eval-mode discipline).',
      'This generate() is the UNCACHED version by design — notice self(idx_cond) reprocesses the whole cropped sequence every single call. That\'s the O(n²) cost made visible, not hidden.'
    ]
  },
  lab: {
    title: 'Assemble CausalSelfAttention, TransformerBlock, and MiniGPT',
    prompt: 'PyTorch isn\'t available in this browser, so this lab is STATIC-CHECKED — write real, structurally correct code; the checkers verify the key pieces are present and correctly wired, and the solution tab gives you a reference to diff against (run it locally with Python + torch to see it actually train and generate). Build the three classes from the lesson: CausalSelfAttention (one fused QKV projection, register_buffer mask), TransformerBlock (pre-norm residual attention + FFN), and MiniGPT (tied embedding/output weights, forward() with optional loss, and a generate() sampling loop).',
    starter: `import torch
import torch.nn as nn
import torch.nn.functional as F

class CausalSelfAttention(nn.Module):
    def __init__(self, d_model, n_heads, block_size):
        super().__init__()
        # self.qkv = nn.Linear(d_model, 3*d_model); self.proj = nn.Linear(d_model, d_model)
        # register_buffer a lower-triangular mask sized (block_size, block_size)
        ...

    def forward(self, x):
        # split qkv, reshape into heads, scaled dot-product with causal mask, merge heads, proj
        ...

class TransformerBlock(nn.Module):
    def __init__(self, d_model, n_heads, block_size):
        super().__init__()
        # ln1, attn, ln2, ffn (Linear -> GELU -> Linear, widen 4x)
        ...

    def forward(self, x):
        # pre-norm residual: x = x + attn(ln1(x)); x = x + ffn(ln2(x))
        ...

class MiniGPT(nn.Module):
    def __init__(self, vocab_size, d_model, n_heads, n_layers, block_size):
        super().__init__()
        # tok_emb, pos_emb, ModuleList of blocks, ln_f, head (bias=False)
        # tie: self.head.weight = self.tok_emb.weight
        ...

    def forward(self, idx, targets=None):
        # embed tokens + positions, run blocks, ln_f, head -> logits
        # if targets is not None: cross_entropy loss on reshaped logits/targets
        # return logits, loss
        ...

    @torch.no_grad()
    def generate(self, idx, max_new_tokens, temperature=1.0):
        # loop: crop to block_size, forward, softmax last position, sample, append
        ...`,
    checks: [
      { re: 'class\\s+CausalSelfAttention\\s*\\(\\s*nn\\.Module\\s*\\)', must: true, hint: 'CausalSelfAttention must subclass nn.Module.', pass: 'CausalSelfAttention defined' },
      { re: 'register_buffer', must: true, hint: 'Store the causal mask with self.register_buffer(...) — it must move with .to(device) but never receive a gradient.', pass: 'causal mask registered as buffer' },
      { re: 'class\\s+TransformerBlock\\s*\\(\\s*nn\\.Module\\s*\\)', must: true, hint: 'TransformerBlock must subclass nn.Module.', pass: 'TransformerBlock defined' },
      { re: 'nn\\.LayerNorm', must: true, hint: 'TransformerBlock needs LayerNorm before attention AND before the FFN (pre-norm).', pass: 'LayerNorm present' },
      { re: 'class\\s+MiniGPT\\s*\\(\\s*nn\\.Module\\s*\\)', must: true, hint: 'MiniGPT must subclass nn.Module.', pass: 'MiniGPT defined' },
      { re: 'nn\\.Embedding', must: true, hint: 'MiniGPT needs both a token embedding and a positional embedding (nn.Embedding, twice).', pass: 'embeddings present' },
      { re: 'self\\.head\\.weight\\s*=\\s*self\\.tok_emb\\.weight', must: true, hint: 'Tie the output head\'s weight to the token embedding: self.head.weight = self.tok_emb.weight.', pass: 'weight tying ✓' },
      { re: 'cross_entropy', must: true, hint: 'forward() should compute F.cross_entropy(logits.view(-1, vocab_size), targets.view(-1)) when targets are given.', pass: 'cross_entropy loss present' },
      { re: 'def\\s+generate\\s*\\(\\s*self', must: true, hint: 'Define a generate(self, idx, max_new_tokens, temperature=1.0) method on MiniGPT.', pass: 'generate() defined' },
      { re: 'multinomial|argmax', must: true, hint: 'generate() must sample (torch.multinomial on softmax probabilities) or greedily pick (argmax) the next token.', pass: 'sampling present' },
      { re: 'no_grad', must: true, hint: 'Decorate generate() with @torch.no_grad() — no gradients needed at inference.', pass: 'no_grad on generate ✓' }
    ],
    tests: null,
    runnable: false,
    solution: `import torch
import torch.nn as nn
import torch.nn.functional as F

class CausalSelfAttention(nn.Module):
    def __init__(self, d_model, n_heads, block_size):
        super().__init__()
        self.n_heads, self.d_head = n_heads, d_model // n_heads
        self.qkv = nn.Linear(d_model, 3 * d_model)
        self.proj = nn.Linear(d_model, d_model)
        mask = torch.tril(torch.ones(block_size, block_size)).view(1, 1, block_size, block_size)
        self.register_buffer("mask", mask)

    def forward(self, x):
        B, T, C = x.shape
        q, k, v = self.qkv(x).split(C, dim=-1)
        q = q.view(B, T, self.n_heads, self.d_head).transpose(1, 2)
        k = k.view(B, T, self.n_heads, self.d_head).transpose(1, 2)
        v = v.view(B, T, self.n_heads, self.d_head).transpose(1, 2)
        scores = (q @ k.transpose(-2, -1)) / (self.d_head ** 0.5)
        scores = scores.masked_fill(self.mask[:, :, :T, :T] == 0, float("-inf"))
        weights = F.softmax(scores, dim=-1)
        out = (weights @ v).transpose(1, 2).contiguous().view(B, T, C)
        return self.proj(out)

class TransformerBlock(nn.Module):
    def __init__(self, d_model, n_heads, block_size):
        super().__init__()
        self.ln1 = nn.LayerNorm(d_model)
        self.attn = CausalSelfAttention(d_model, n_heads, block_size)
        self.ln2 = nn.LayerNorm(d_model)
        self.ffn = nn.Sequential(nn.Linear(d_model, 4 * d_model), nn.GELU(), nn.Linear(4 * d_model, d_model))

    def forward(self, x):
        x = x + self.attn(self.ln1(x))
        x = x + self.ffn(self.ln2(x))
        return x

class MiniGPT(nn.Module):
    def __init__(self, vocab_size, d_model, n_heads, n_layers, block_size):
        super().__init__()
        self.block_size = block_size
        self.tok_emb = nn.Embedding(vocab_size, d_model)
        self.pos_emb = nn.Embedding(block_size, d_model)
        self.blocks = nn.ModuleList([TransformerBlock(d_model, n_heads, block_size) for _ in range(n_layers)])
        self.ln_f = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, vocab_size, bias=False)
        self.head.weight = self.tok_emb.weight

    def forward(self, idx, targets=None):
        B, T = idx.shape
        pos = torch.arange(T, device=idx.device)
        x = self.tok_emb(idx) + self.pos_emb(pos)
        for block in self.blocks:
            x = block(x)
        x = self.ln_f(x)
        logits = self.head(x)
        loss = None
        if targets is not None:
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1))
        return logits, loss

    @torch.no_grad()
    def generate(self, idx, max_new_tokens, temperature=1.0):
        for _ in range(max_new_tokens):
            idx_cond = idx[:, -self.block_size:]
            logits, _ = self(idx_cond)
            logits = logits[:, -1, :] / temperature
            probs = F.softmax(logits, dim=-1)
            next_id = torch.multinomial(probs, num_samples=1)
            idx = torch.cat([idx, next_id], dim=1)
        return idx`,
    notes: [
      'Diff your attempt against the solution line by line — this lab is dense on purpose; every class here is something a real production model (nanoGPT, GPT-2\'s published architecture) does almost identically.',
      'The three classes compose: MiniGPT owns a ModuleList of TransformerBlocks, each TransformerBlock owns one CausalSelfAttention — exactly the "layers that know their own parameters, nested" idea from the pytorch-fundamentals lesson, now three levels deep.',
      'If you run this locally: a few hundred lines of character-level Shakespeare, d_model=128, n_layers=4, block_size=64, a few thousand training steps on a CPU is enough to watch it go from random characters to recognizably English-shaped (if nonsensical) text — worth actually doing once, outside this browser.'
    ]
  },
  quiz: [
    {
      q: 'Why does CausalSelfAttention use ONE nn.Linear(d_model, 3*d_model) instead of three separate Q/K/V linear layers?',
      options: ['Mathematically identical to three separate projections, but one larger matmul is more GPU-efficient than three smaller ones', 'Three separate layers would compute a different (incorrect) result', 'It reduces the number of attention heads', 'It removes the need for a causal mask'],
      correct: 0,
      explain: 'Splitting one [d_model, 3*d_model] matrix into three chunks after a single matmul computes exactly the same Q, K, V as three separate layers — purely a performance idiom.'
    },
    {
      q: 'Why is the causal mask stored with self.register_buffer(...) rather than as a plain attribute or nn.Parameter?',
      options: ['A buffer moves with .to(device) and saves with state_dict, but — unlike a Parameter — never receives a gradient or gets updated by the optimizer', 'register_buffer makes the mask trainable', 'Buffers are required for any tensor inside forward()', 'It has no effect; it is purely stylistic'],
      correct: 0,
      explain: 'The mask is fixed structure the model needs (device-correct, checkpoint-correct) but must never be learned — exactly the role register_buffer exists for.'
    },
    {
      q: 'What does weight tying between the token embedding and the output head accomplish?',
      options: ['Shares one matrix for both looking up input tokens and scoring output candidates, cutting a large parameter block roughly in half and often improving quality', 'It disables the output layer entirely', 'It ties the learning rate of two different layers together', 'It is required for the causal mask to function'],
      correct: 0,
      explain: 'self.head.weight = self.tok_emb.weight — the same [vocab_size, d_model] matrix serves both roles, based on the idea that a token\'s meaning-as-input and identity-as-output are the same underlying representation.'
    },
    {
      q: 'In generate(), why is the entire cropped sequence reprocessed at every single generation step (in the uncached version)?',
      options: ['Because a plain forward pass has no memory of previous steps\' computed keys/values — without a KV cache, each step recomputes attention over the whole context from scratch', 'Because PyTorch requires it for correctness', 'Because temperature sampling needs the full sequence recomputed', 'Because the causal mask changes at every step'],
      correct: 0,
      explain: 'The uncached forward pass has no state carried between generate() steps — keys and values for unchanged tokens are recomputed identically every time, which is exactly what a KV cache (Part 6) eliminates.'
    },
    {
      q: 'Using the rule of thumb params ≈ 12 × n_layers × d_model², roughly how many non-embedding parameters does a model with 12 layers and d_model=768 have?',
      options: ['≈ 85 million', '≈ 850 thousand', '≈ 8.5 billion', '≈ 850 million'],
      correct: 0,
      explain: '12 × 12 × 768² ≈ 85,000,000 — close to GPT-2 small\'s actual non-embedding parameter count. The formula is a fast mental estimate from (n_layers, d_model) alone.'
    }
  ],
  pitfalls: [
    'Using a plain Python attribute (self.mask = ...) for the causal mask instead of register_buffer — it silently fails to move to GPU with the rest of the model, producing a device-mismatch crash the first time you train on CUDA.',
    'Forgetting @torch.no_grad() on generate() — without it, PyTorch builds and retains a full autograd graph across every generation step, wasting memory and time for computation that will never call .backward().',
    'Feeding softmax-ed probabilities into F.cross_entropy instead of raw logits — cross_entropy expects raw logits and applies log-softmax internally; pre-softmaxing is the double-softmax bug from the pytorch-fundamentals lesson, resurfacing here.',
    'Cropping the context incorrectly (or not at all) in generate() — a transformer with a fixed positional embedding table of size block_size will index-error or silently misbehave if fed a sequence longer than block_size; idx[:, -self.block_size:] must run before every forward call.',
    'Treating weight tying as always mandatory — it is a strong default for smaller models but is sometimes dropped in very large models where the vocab-size matrix is a small fraction of total parameters anyway, and where separating the two roles is found to help; know it as a well-justified DEFAULT, not an absolute rule.',
    'Believing "I built a mini-GPT in a lab, so I understand LLMs" without connecting it to scale. This IS the actual architecture — the difference between this lab and GPT-4 is almost entirely n_layers, d_model, training data volume, and the post-pretraining pipeline (Part 6) — say that connection explicitly in an interview; it is the whole point of building this by hand.'
  ],
  interview: [
    {
      q: 'Walk me through the forward pass of a GPT-style model, from token IDs to loss, in terms of shapes.',
      a: 'Input: idx, shape [B, T] (batch of B sequences, each T token IDs). Step 1: tok_emb(idx) looks up each ID in a [vocab_size, d_model] table → [B, T, d_model]; pos_emb(arange(T)) looks up position embeddings → [T, d_model], broadcast-added to give the same [B, T, d_model], now carrying both content and position. Step 2: this passes through N TransformerBlocks, each doing pre-norm causal self-attention (LayerNorm → multi-head attention with causal masking → residual add) then pre-norm feedforward (LayerNorm → widen to 4×d_model, GELU, narrow back → residual add) — shape stays [B, T, d_model] throughout every block. Step 3: a final LayerNorm, then the (weight-tied) output head, a Linear(d_model, vocab_size) → logits of shape [B, T, vocab_size], one distribution over the vocabulary per position. Step 4 (training only): reshape logits to [B*T, vocab_size] and targets to [B*T], compute F.cross_entropy — this is the causal language modeling loss, every position\'s next-token prediction scored simultaneously via teacher forcing.'
    },
    {
      q: 'Explain how multi-head attention is implemented efficiently with tensor reshaping, rather than a Python loop over heads.',
      a: 'Starting from a [B, T, d_model] input, one linear projection produces [B, T, 3*d_model], split into Q, K, V each [B, T, d_model]. Reshape each with .view(B, T, n_heads, d_head).transpose(1, 2) to get [B, n_heads, T, d_head] — same numbers, reinterpreted so the "heads" dimension sits alongside the batch dimension. Now Q @ K.transpose(-2,-1) operates on the LAST TWO dimensions of a 4D tensor, and PyTorch\'s batched matmul treats every leading dimension (both B and n_heads) as independent — producing [B, n_heads, T, T] scores, i.e., a full attention computation for every head of every batch item, in ONE matmul call, no Python-level loop over heads required. After softmax and multiplying by V (giving [B, n_heads, T, d_head]), .transpose(1,2).contiguous().view(B, T, d_model) merges the heads back into the original shape for the output projection. The entire multi-head mechanism is two reshapes around one batched matmul — a GPU executes this as parallel work across heads for free, which is precisely why real implementations never literally loop over heads in Python.'
    },
    {
      q: 'What is a KV cache, why does it matter for production LLM serving, and what does it trade away?',
      a: 'During uncached autoregressive generation, producing token t requires a full forward pass recomputing attention over all t tokens at every layer — even though tokens 1..t-1\'s key and value vectors are identical to what they were on the previous step (they depend only on those tokens\' fixed embeddings and the trained Wk/Wv matrices, not on anything generated since). A KV cache stores each layer\'s K and V tensors as they\'re computed, and on each new step computes Q/K/V for only the newest token, appending its K/V to the cache and attending the new Q against the full cached K/V — reducing each step from O(t) work back to O(1) amortized per layer, turning total generation cost from O(n²) to O(n) in the number of generated tokens. The trade-off: memory. The cache holds K and V for every token, every layer, every attention head — for long contexts and large batch sizes this can dominate GPU memory usage, which is exactly why production inference engineering (Part 6) spends significant effort on cache-size optimizations (multi-query/grouped-query attention reduces the number of K/V heads that need caching; quantizing the cache; paging schemes like vLLM\'s PagedAttention) — KV caching is the default for any serious deployment, but it is not free.'
    },
    {
      q: 'A teammate proposes NOT tying the embedding and output weights, arguing the model might learn better task-specific representations for each role. How do you evaluate that?',
      a: 'This is a real, empirically-testable trade-off rather than a settled rule, and the right answer is to frame it as an experiment, not a certainty. The case FOR tying: it substantially reduces parameters (often the single largest matrix in a smaller model), acts as an implicit regularizer consistent with the plausible assumption that a token\'s meaning-as-input and identity-as-output are related, and is empirically well-validated to help, especially at smaller model scales where that matrix is a large fraction of the total budget (the original tied-weights paper showed perplexity improvements). The case AGAINST, which the teammate is gesturing at: at very large scale, the vocab×d_model matrix becomes a vanishingly small fraction of total parameters, so the parameter-savings argument weakens, and it\'s plausible the optimal input representation and optimal output-scoring representation genuinely diverge once the model is large enough to afford separate ones — some very large models do in fact untie them. The honest answer: don\'t assume either direction is correct by authority — run both configurations at the SAME parameter budget (or accept the untied version\'s slightly larger budget as a controlled cost) and compare validation loss/perplexity on held-out data (the model-evaluation lesson\'s discipline, applied to an architecture choice rather than a full model). Tying is the well-justified DEFAULT to start from, not a law.'
    }
  ]
};
