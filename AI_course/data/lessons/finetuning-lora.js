window.LESSONS = window.LESSONS || {};
window.LESSONS['finetuning-lora'] = {
  id: 'finetuning-lora',
  title: 'Fine-Tuning: SFT, LoRA & QLoRA',
  category: 'Part 6 — LLM Engineering',
  timeMin: 65,
  summary: 'Last lesson ended with a fluent but unhelpful base model. This lesson closes that gap without re-running months of pretraining: supervised fine-tuning (SFT) teaches the instruction-response SHAPE on a small curated dataset, and LoRA/QLoRA make that affordable by freezing the giant pretrained brain and training only a tiny, low-rank "adapter" bolted on top — the difference between retraining a whole ship and clipping on a small rudder.',
  goals: [
    'Explain SFT precisely: dataset shape, chat templating, and why loss is masked to only the response tokens',
    'Explain why full fine-tuning is expensive (optimizer state) and risky (catastrophic forgetting) even on a small dataset',
    'Derive LoRA\'s parameter savings from its low-rank update ΔW = BA, and explain why r ≪ d works empirically',
    'Explain what QLoRA adds: 4-bit quantization of the frozen base model, and why the trainable adapters stay in higher precision',
    'Judge when fine-tuning is the right tool versus when RAG or prompting would serve the actual goal better'
  ],
  concept: [
    {
      h: 'Supervised fine-tuning: teaching the SHAPE, not new knowledge',
      p: [
        'SFT trains the pretrained base model further, on a much smaller (thousands to low millions of examples, versus pretraining\'s trillions of tokens) CURATED dataset of (instruction, ideal response) pairs, formatted with a consistent chat template — special tokens marking where the user\'s turn ends and the assistant\'s turn begins (e.g. <code>&lt;|user|&gt; How do I bake bread? &lt;|assistant|&gt; Start by...</code>). The loss function is the SAME causal cross-entropy from pretraining — nothing new mathematically — but with one crucial change: it is computed ONLY on the assistant\'s response tokens, not the user\'s instruction. The instruction tokens are masked out of the loss (their labels set to a sentinel like -100, which most loss functions are told to ignore).',
        'Why mask the instruction? Training the model to predict the USER\'s question would be actively counterproductive — the model should generate the response given a question, never generate more questions given a question. Masking focuses every gradient update on exactly the behavior you want to shape: "given this instruction pattern, produce this KIND of response" — better formatting, more directness, following the request instead of rambling into a plausible-but-unhelpful continuation (last lesson\'s failure mode).'
      ]
    },
    {
      h: 'Why full fine-tuning is expensive even on a small dataset',
      p: [
        'The dataset is small, but the MODEL is not — full fine-tuning still updates every one of a 7B, 70B, or larger model\'s parameters, and that carries two costs independent of dataset size. Memory: Adam-family optimizers (the training-neural-nets lesson\'s default) store TWO extra moment estimates per parameter (first and second moment) alongside the parameter itself and its gradient — roughly 4x a parameter\'s footprint in fp32 (weight + gradient + 2 optimizer states), meaning a 7B-parameter model needs on the order of 28GB just for optimizer state, before activations, before the model weights\' own footprint — routinely exceeding a single consumer or even prosumer GPU\'s memory.',
        '<b>Catastrophic forgetting</b>: aggressively updating ALL parameters on a narrow fine-tuning dataset risks overwriting broad capabilities the pretrained model spent enormous compute acquiring — a model fine-tuned hard on customer-support-style responses can measurably get WORSE at, say, code generation or general reasoning, because the same weight matrices that encode "how to write code" also got nudged by every fine-tuning gradient step, whether or not that step had anything to do with code. Full fine-tuning has no built-in mechanism to protect what it isn\'t trying to change — the entire model is exposed to every update.'
      ]
    },
    {
      h: 'LoRA: freeze everything, train a tiny low-rank patch',
      p: [
        'LoRA (Low-Rank Adaptation, Hu et al. 2021) makes a specific empirical bet: the CHANGE a pretrained model needs to adapt to a new task or style doesn\'t require touching every direction in its enormous weight space — that change lives in a much lower-dimensional subspace than the full weight matrix (its "intrinsic rank" is low). Instead of updating a weight matrix W (shape d_in × d_out, potentially millions of entries) directly, LoRA FREEZES W completely and represents the UPDATE as a product of two small matrices:',
        '<div class="math">ΔW = B·A&nbsp;&nbsp;&nbsp;&nbsp;A: r × d_in,&nbsp;&nbsp;B: d_out × r,&nbsp;&nbsp;r ≪ d_in, d_out<br>forward: h = x·W + (α/r)·x·Aᵀ·Bᵀ&nbsp;&nbsp;&nbsp;&nbsp;(W frozen — no gradient; only A, B are trained)</div>',
        'Concrete numbers make the savings vivid: a 4096×4096 weight matrix has ~16.8M parameters. A LoRA adapter with rank r=8 has A (8×4096) + B (4096×8) = 65,536 trainable parameters — roughly 256× fewer. Applied across a whole model\'s attention projections (typically LoRA is applied to Wq and Wv, sometimes all four attention projections), total trainable parameters often drop to well under 1% of the base model\'s size. Since only A and B receive gradients, the optimizer only needs to store moment estimates for THOSE tiny matrices — the 4x-memory-multiplier problem from full fine-tuning shrinks by the same ~100-1000x factor, which is the entire reason LoRA fine-tuning fits on a single consumer GPU where full fine-tuning of the same base model would not.',
        'Practical details worth knowing: B is typically initialized to all ZEROS (and A with small random values), so at the start of training ΔW = BA = 0 exactly — the adapted model is IDENTICAL to the base model on step 0, and training gradually introduces the learned adjustment rather than starting from a randomly-perturbed model. And critically, LoRA sidesteps catastrophic forgetting almost by construction: since W itself never changes, everything the base model already knew that ISN\'T touched by the low-rank update remains completely intact — the adapter can only ADD a bounded, low-dimensional correction, not overwrite the base capability wholesale. After training, BA can optionally be MERGED back into W (W_new = W + BA) for zero extra inference latency, or kept SEPARATE as a small, swappable file (often tens of MB, versus tens of GB for the full model) — letting one frozen base model serve many different task-specific adapters, hot-swapped per request.'
      ]
    },
    {
      h: 'QLoRA: shrink the frozen base too',
      p: [
        'LoRA already shrinks the TRAINABLE footprint dramatically, but the FROZEN base model still has to be loaded into memory in full — a 65B-parameter model in bf16 still needs ~130GB just to hold the frozen weights, out of reach for a single consumer GPU regardless of how small the trainable adapter is. QLoRA (Dettmers et al. 2023) adds one more move: quantize the frozen base weights down to 4 bits per parameter (using NF4, "NormalFloat4" — a quantization scheme specifically designed around the observation that pretrained weights are roughly normally distributed, allocating quantization levels to match that distribution rather than spacing them uniformly, which loses less precision than a naive 4-bit scheme).',
        'The key asymmetry that makes this work: the frozen base weights only ever need to be READ (used in the forward pass, never updated), so aggressive quantization is safe there — a small forward-pass approximation error is tolerable. The trainable LoRA matrices A and B, by contrast, are UPDATED by gradient descent every step and kept in a higher-precision format (bf16) specifically because optimizer updates on heavily-quantized parameters accumulate error and destabilize training — the same "don\'t quantize what you\'re differentiating through carelessly" caution that motivated fp32 master weights in the mixed-precision discussion last lesson. QLoRA also introduces "double quantization" (quantizing the quantization constants themselves, a small additional memory saving) and paged optimizers (offloading optimizer state to CPU memory during occasional memory spikes rather than crashing) — engineering details worth knowing exist, without needing to reproduce them from memory. The headline result: QLoRA made it possible to fine-tune a 65B-parameter model on a SINGLE 48GB GPU, and 7B models on GPUs with as little as 8-12GB — the difference between "needs a research lab\'s cluster" and "runs on a single well-equipped consumer machine."'
      ]
    },
    {
      h: 'Choosing the right tool — including knowing when fine-tuning is the WRONG tool',
      p: [
        'Full fine-tuning: reach for it only with a large, high-quality dataset, ample compute, and a genuine need to change a large fraction of the model\'s behavior — increasingly rare as LoRA/QLoRA close the quality gap for most practical tasks. LoRA: the default choice for most custom fine-tuning jobs — cheap, fast, low risk of catastrophic forgetting, produces small swappable adapter files. QLoRA: LoRA\'s answer to "I don\'t have a GPU cluster" — same benefits, plus makes fine-tuning very large base models feasible on modest hardware, at a small forward-pass precision cost.',
        'The mistake worth flagging hardest: using fine-tuning (of any flavor) to teach a model NEW FACTS — "our product catalog changed, let\'s fine-tune the model on the new catalog." Fine-tuning is well-suited to teaching STYLE, FORMAT, and BEHAVIOR (respond concisely, use this tone, follow this output schema, refuse this category of request) because those are patterns repeated consistently across many examples. It is poorly suited to injecting SPECIFIC, ISOLATED FACTS reliably — a fact seen a handful of times during fine-tuning competes against everything the base model already "believes" from pretraining, and the model can confidently hallucinate a blend of old and new information rather than reliably recalling the updated fact. The better tool for "the model needs access to current, specific, or proprietary information" is retrieval — hand the model the relevant document AT INFERENCE TIME rather than trying to bake the fact into its weights (RAG, Part 7\'s opening lesson). A good rule of interview-ready thumb: fine-tune for BEHAVIOR, retrieve for KNOWLEDGE.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Vegapunk fixes the rambling brain — with a rudder, not a rebuild',
      text: 'The satellites reconvene, staring at their magnificent but unhelpful creation from last month. Edison\'s first instinct is to just rebuild the whole thing from scratch with better instructions baked in from day one — and Atlas shuts that down immediately: retraining the ENTIRE brain means storing detailed adjustment notes on every single neuron all over again (full optimizer state), weeks of processing, and a real risk the rebuilt brain FORGETS half of what made it so broadly knowledgeable in the first place, if they push too hard on the new narrow behavior (catastrophic forgetting). Shaka proposes something smaller: don\'t touch the giant frozen brain at ALL. Instead, bolt on a small, removable RUDDER — a tiny set of adjustable dials, far fewer than the brain\'s full neuron count, that sits alongside the frozen structure and nudges its output just enough to correct the specific problem (rambling instead of answering) without rewiring anything else. His bet: the actual CHANGE needed — "answer directly instead of trailing off" — doesn\'t require touching millions of connections, just a small, low-dimensional correction layered on top. Crucially, the rudder starts perfectly neutral — dialed to zero effect — so on day one of training, the brain-plus-rudder behaves EXACTLY like the untouched original, and only gradually, gently, does the rudder learn to nudge outputs toward directness. They train it on a modest set of example question-answer pairs (nowhere near the size of the original archive), scoring the brain ONLY on how well it completes the ANSWER portion — never scoring it on how well it "predicts" the question that was asked, which would be backwards. Days later: the same enormous knowledge, the same fluency, but now genuinely helpful — and the rudder itself is small enough that York, delighted, points out you could build several DIFFERENT rudders for different jobs (a diplomacy rudder, a medical-triage rudder) and swap them onto the SAME frozen brain as needed, rather than keeping several giant brains around. When Franky asks if they can shrink the frozen brain itself down small enough to run this whole setup off the Sunny\'s modest onboard systems instead of Vegapunk\'s lab, Atlas confirms it\'s possible — compress the big frozen part down hard (it only ever needs to be READ, never re-adjusted), while keeping the small rudder\'s own dials at full precision (those ARE being adjusted, and need the precision) — and just like that, fine-tuning something Vegapunk-brain-scale becomes a job for a ship\'s workshop, not a research island.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Fixing the Trivia Machine before showtime',
      text: 'Trivia night is tomorrow and the machine still rambles instead of answering. Ross wants to re-feed it every tape again with better instructions from the start — Monica points out that\'s an all-night rebuild with real risk it forgets half the obscure trivia it already nailed, if they push the "just answer directly" lesson too hard on top of everything else (retraining risks wrecking what already worked). Phoebe has a smaller idea: don\'t touch the giant tape archive at all — just clip on a SMALL SET of new note cards, way fewer than the full archive, that sit alongside the existing knowledge and nudge its answers toward directness, without altering anything else it knows. She insists the cards start completely blank (zero effect) so the machine behaves exactly as before on card one, and only gradually, as they add real examples, does the new card-set start correcting the rambling. They train it on a modest stack of example question-answer pairs, and Chandler notices something important while grading practice runs: they should only judge it on how well it produces the ANSWER, never on how well it "guesses" the question — grading the question part would train it backwards. By the next morning, the machine still knows everything it knew before, but now actually ANSWERS — and Joey, delighted, suggests building a SEPARATE small card-set for "answer like a game show host" versus "answer like a serious librarian," swapping cards onto the same base archive depending on the event. When Monica worries the fix needs a machine bigger than Central Perk\'s ancient PC, Ross proposes shrinking the huge base archive down into a rougher, compressed form (it\'s only ever being READ during the show, never re-learned) while keeping the small new card-set at full detail (that part IS being actively adjusted) — and the whole fix runs, that night, off the coffee shop\'s aging computer. The only thing it still can\'t do reliably: answer about an episode that aired only last week, something genuinely new that was never in ANY tape or card — Rachel notes that\'s a different problem, and probably needs the machine to just look something up live instead of trying to memorize everything in advance.'
    },
    why: 'Freeze the enormous existing brain, bolt on a small removable rudder that starts at zero effect and only nudges behavior, score it only on the part you\'re trying to teach, and — if hardware is tight — compress the frozen part hard (it\'s only ever read) while keeping the small trainable rudder at full precision. And the final beat both stories land on deliberately: this fix teaches BEHAVIOR, not brand-new FACTS — genuinely new information needs a different tool entirely, which is exactly where Part 7 picks up.'
  },
  storyAnim: {
    title: 'Freeze the brain, train the rudder',
    h: 260,
    props: [
      { id: 'brain', emoji: '🧠', label: 'frozen base brain (unchanged)', x: 15, y: 16 },
      { id: 'rudder', emoji: '🎛️', label: 'small adapter (A, B) — starts at zero', x: 50, y: 16 },
      { id: 'combined', emoji: '➕', label: 'output = frozen path + adapter path', x: 78, y: 16 },
      { id: 'qa', emoji: '📋', label: 'training pairs: instruction → response', x: 15, y: 50 },
      { id: 'masked', emoji: '🚫', label: 'loss masked on instruction tokens', x: 40, y: 50 },
      { id: 'scored', emoji: '✅', label: 'loss scored only on response tokens', x: 65, y: 50 },
      { id: 'result', emoji: '💬', label: 'direct, helpful answers — same knowledge intact', x: 45, y: 84 }
    ],
    actors: [
      { id: 'shaka', emoji: '🧑‍🔬', label: 'Shaka', x: 50, y: 40 }
    ],
    steps: [
      { c: 'The giant frozen brain stays completely untouched — no gradients flow into it at all.', p: { brain: 'lit' } },
      { c: 'A small removable adapter is bolted on alongside it — far fewer dials than the brain\'s full size, and it starts dialed to exactly zero effect.', p: { rudder: 'lit' }, a: { shaka: [50, 30] } },
      { c: 'Output is the frozen path PLUS the adapter\'s (currently zero) contribution — on day one, identical to the untouched brain.', p: { combined: 'good' } },
      { c: 'Training pairs arrive: instruction in, ideal response out.', p: { qa: 'lit' } },
      { c: 'The instruction portion is masked out of the loss — never score the model on guessing the question.', p: { masked: 'bad' } },
      { c: 'Only the response portion is scored — every gradient update shapes exactly "answer this way", nothing else.', p: { scored: 'good' } },
      { c: 'Result: the same vast knowledge, now genuinely helpful — and the base brain never forgot anything, because it was never touched.', p: { result: 'good' } }
    ]
  },
  tech: [
    {
      q: 'Precisely, why is SFT loss computed only on response tokens, and what mechanism enforces that?',
      a: 'Mechanically: each training example is tokenized as instruction tokens followed by response tokens (with template markers), and the LABELS array used for the cross-entropy loss has the instruction positions set to a sentinel value (commonly -100 in PyTorch/HF conventions) that the loss function is configured to ignore, while response positions keep their real token IDs as labels. The model still SEES the instruction tokens as input context (it needs them to know what it\'s responding to) — only the LOSS computation skips them. Why this matters: causal language modeling loss at an instruction-token position would be training the model to predict "what comes after the start of this instruction," which is either predicting more of the instruction (useless — the instruction is given, not generated) or, worse, subtly encouraging instruction-continuation behavior that competes with response-generation behavior. Masking ensures every gradient update is exclusively about "given this full instruction, generate this ideal response" — precisely the shape being taught, with zero training signal wasted on (or working against) the wrong objective.'
    },
    {
      q: 'Walk through the LoRA parameter-count math for a real model, and explain concretely why optimizer memory drops proportionally.',
      a: 'Take a 4096×4096 attention projection matrix (a plausible size for a 7B-class model): full fine-tuning makes all 4096×4096 ≈ 16.8M parameters trainable. With LoRA at rank r=8: A is r×d_in = 8×4096 = 32,768 parameters, B is d_out×r = 4096×8 = 32,768 parameters, total 65,536 trainable parameters — a ~256× reduction for this one matrix. Applied across a full model\'s attention projections (Wq, Wv commonly; sometimes Wk, Wo, and FFN matrices too), total trainable parameters typically land under 1% of the base model\'s size. Since Adam-family optimizers store two moment estimates PER TRAINABLE PARAMETER (not per total parameter), optimizer memory scales with the SAME ~1% figure — a 7B model needing ~28GB of optimizer state under full fine-tuning needs only a few hundred MB under LoRA, which is the direct, mechanical reason LoRA fine-tuning fits on GPUs where full fine-tuning of the identical base model would OOM (out-of-memory) immediately.'
    },
    {
      q: 'What does QLoRA\'s 4-bit NF4 quantization actually do, and why is it applied only to the frozen weights, not the trainable LoRA matrices?',
      a: 'NF4 (NormalFloat4) maps each weight to one of 16 possible quantization levels (4 bits = 2⁴ = 16 values), but unlike a naive uniform quantization scheme (16 evenly-spaced values across the weight range), NF4\'s 16 levels are spaced to match the empirical observation that pretrained neural network weights are approximately normally distributed — more levels are allocated near zero (where weight density is highest) and fewer near the tails, minimizing average quantization error for weights that actually follow this distribution, versus a scheme optimized for a uniform distribution. This is applied ONLY to the frozen base weights because those weights are used exclusively in forward-pass matrix multiplications and never updated — a small, fixed approximation error per weight is a one-time, bounded cost. The LoRA matrices A and B, by contrast, are the parameters gradient descent is actively UPDATING every training step — repeatedly quantizing, updating, and re-quantizing a parameter under active gradient descent accumulates rounding error in a way that can measurably destabilize or degrade training (the same reasoning that motivated keeping fp32 master weights during mixed-precision pretraining, last lesson) — so A and B are kept in a higher-precision format (typically bf16) throughout training, and only the already-frozen, read-only base weights get the aggressive 4-bit compression.'
    },
    {
      q: 'Why is fine-tuning a poor tool for injecting new factual knowledge, and what should be used instead?',
      a: 'A fine-tuning dataset teaching a new fact typically contains that fact a small number of times (dozens to hundreds of examples, versus the fact\'s absence — or a now-outdated version of it — appearing potentially thousands of times across the ENTIRE pretraining corpus). Gradient descent on a small number of new examples nudges the relevant weights, but does not reliably OVERWRITE the much larger, more deeply-embedded pretrained association — the practical result is often a model that has learned to produce fact-shaped text influenced by both the old and new information, sometimes blending them into a confident-sounding but wrong answer (a specific, well-documented flavor of hallucination), with no reliable way to verify which version "won" for any given query without extensive evaluation. Fine-tuning also can\'t easily keep up with facts that change frequently (prices, current events, an evolving internal knowledge base) — each update would require a new fine-tuning run. The better tool: retrieval-augmented generation (RAG, Part 7) — keep the current, authoritative facts in an external store, retrieve the relevant piece at INFERENCE TIME, and place it directly in the model\'s context window so it can read and cite the actual current information rather than relying on what got (unreliably) baked into its weights during training. Rule of thumb: fine-tune to change HOW the model behaves (style, format, task-following); retrieve to give it WHAT it needs to know (facts, current data, proprietary documents).'
    }
  ],
  code: {
    title: 'LoRA in PyTorch: freeze the base, train the adapter',
    intro: 'A minimal LoRA linear layer — the whole mechanism in about fifteen lines, wrapping an existing frozen nn.Linear.',
    code: `import torch
import torch.nn as nn

class LoRALinear(nn.Module):
    def __init__(self, base_linear: nn.Linear, r=8, alpha=16):
        super().__init__()
        self.base = base_linear
        for p in self.base.parameters():
            p.requires_grad = False              # freeze the pretrained weight entirely

        d_in, d_out = base_linear.in_features, base_linear.out_features
        self.A = nn.Parameter(torch.randn(r, d_in) * 0.01)   # small random init
        self.B = nn.Parameter(torch.zeros(d_out, r))          # zero init -> adapter starts as a no-op
        self.scale = alpha / r

    def forward(self, x):
        base_out = self.base(x)                   # frozen path: x @ W^T + b
        lora_out = (x @ self.A.T) @ self.B.T       # adapter path: low-rank x @ A^T @ B^T
        return base_out + self.scale * lora_out

# Wrap an existing pretrained layer -- only A and B will ever get gradients
pretrained_layer = nn.Linear(4096, 4096)
lora_layer = LoRALinear(pretrained_layer, r=8, alpha=16)

trainable = sum(p.numel() for p in lora_layer.parameters() if p.requires_grad)
total = sum(p.numel() for p in lora_layer.parameters())
print(f"trainable: {trainable:,} / total: {total:,} ({100*trainable/total:.2f}%)")
# trainable: 65,536 / total: 16,842,752 (0.39%)

opt = torch.optim.AdamW([p for p in lora_layer.parameters() if p.requires_grad], lr=1e-4)
# only A and B receive optimizer state -- the ~28GB-for-a-7B-model problem shrinks by ~100-1000x`,
    notes: [
      'requires_grad = False on every base parameter is the entire "freeze" mechanism — autograd simply never computes or stores gradients for those tensors, and the optimizer, built only from requires_grad=True parameters, never touches them.',
      'B initialized to zeros is not a detail to skip — it guarantees lora_out = 0 at step 0, so the wrapped layer is numerically IDENTICAL to the original frozen layer before any training happens.',
      'In a real fine-tuning run, LoRALinear wraps the attention projections (Wq, Wv typically) throughout every transformer block — the trainable-parameter percentage shown here (under 1%) is representative of a real fine-tuning job, not an exaggeration.',
      'After training, base_out + scale * lora_out can be pre-computed once into a merged weight matrix (W_merged = W + scale*B@A) for zero-overhead inference — or kept separate to allow hot-swapping different adapters onto the same frozen base.'
    ]
  },
  lab: {
    title: 'LoRA parameter counting, the zero-init no-op property, and SFT loss masking',
    prompt: 'Pure Python, fully runnable. Implement (1) <code>full_finetune_params(d_in, d_out)</code> — parameter count of a full d_in × d_out weight matrix; (2) <code>lora_params(d_in, d_out, r)</code> — trainable parameter count of a rank-r LoRA adapter (A: r×d_in, B: d_out×r); (3) <code>lora_forward(x, W, A, B, alpha, r)</code> — compute base_out + (alpha/r)·lora_out for a single input vector x, where W is d_in×d_out (base, list of lists), A is r×d_in, B is d_out×r; (4) <code>sft_loss_mask(n_instruction_tokens, n_response_tokens)</code> — return a list of 0/1 weights, 0 for instruction positions and 1 for response positions.',
    starter: `def full_finetune_params(d_in, d_out):
    ...

def lora_params(d_in, d_out, r):
    # A: r x d_in, B: d_out x r -- return TOTAL trainable count
    ...

def matvec(M, v):
    # M: list of lists (rows x cols), v: list -- return M @ v as a list
    ...

def lora_forward(x, W, A, B, alpha, r):
    # base_out = W^T @ x  (treat W as d_in x d_out, so base_out[j] = sum_i x[i]*W[i][j])
    # lora_out = B @ (A @ x)   -- low-rank path
    # return base_out[j] + (alpha/r) * lora_out[j] for each output dim j
    ...

def sft_loss_mask(n_instruction_tokens, n_response_tokens):
    # 0 for each instruction token position, 1 for each response token position
    ...`,
    checks: [
      { re: 'def\\s+full_finetune_params\\s*\\(', must: true, hint: 'Define full_finetune_params(d_in, d_out) -> d_in * d_out.', pass: 'full_finetune_params() defined' },
      { re: 'def\\s+lora_params\\s*\\(', must: true, hint: 'Define lora_params(d_in, d_out, r) -> r*d_in + r*d_out.', pass: 'lora_params() defined' },
      { re: 'def\\s+lora_forward\\s*\\(', must: true, hint: 'Define lora_forward(x, W, A, B, alpha, r) combining the frozen base path and the scaled low-rank adapter path.', pass: 'lora_forward() defined' },
      { re: 'alpha\\s*/\\s*r', must: true, hint: 'Scale the adapter contribution by alpha/r before adding it to the base output.', pass: 'alpha/r scaling present' },
      { re: 'def\\s+sft_loss_mask\\s*\\(', must: true, hint: 'Define sft_loss_mask(n_instruction_tokens, n_response_tokens) returning the 0/1 mask list.', pass: 'sft_loss_mask() defined' }
    ],
    tests: `# LoRA drastically reduces trainable parameters vs full fine-tuning
full = full_finetune_params(4096, 4096)
lora = lora_params(4096, 4096, r=8)
assert full == 16_777_216
assert lora == 65_536
assert full / lora > 200, f"expected >200x reduction, got {full/lora:.1f}x"

# lora_forward with B all zeros: adapter path contributes nothing (the zero-init no-op property)
W = [[1.0, 0.0], [0.0, 1.0]]          # 2x2 identity-like base
x = [3.0, 5.0]
A = [[0.1, 0.2]]                       # r=1, d_in=2
B_zero = [[0.0], [0.0]]                # r=1, d_out=2 -- all zeros
out_zero = lora_forward(x, W, A, B_zero, alpha=16, r=1)
assert abs(out_zero[0] - 3.0) < 1e-9 and abs(out_zero[1] - 5.0) < 1e-9, "zero B must make adapter a no-op"

# lora_forward with nonzero B: adapter path DOES change the output
B_nonzero = [[1.0], [1.0]]
out_nonzero = lora_forward(x, W, A, B_nonzero, alpha=16, r=1)
assert out_nonzero != out_zero, "nonzero B should change the output"

# sft_loss_mask: 0s for instruction, 1s for response, correct total length
mask = sft_loss_mask(n_instruction_tokens=4, n_response_tokens=3)
assert mask == [0, 0, 0, 0, 1, 1, 1]
print("LoRA parameter math + zero-init no-op + SFT loss masking. The three mechanics that make fine-tuning cheap and correct.")`,
    runnable: true,
    solution: `def full_finetune_params(d_in, d_out):
    return d_in * d_out

def lora_params(d_in, d_out, r):
    return r * d_in + d_out * r

def matvec(M, v):
    return [sum(M[i][j] * v[j] for j in range(len(v))) for i in range(len(M))]

def lora_forward(x, W, A, B, alpha, r):
    d_out = len(W[0])
    base_out = [sum(x[i] * W[i][j] for i in range(len(x))) for j in range(d_out)]
    Ax = matvec(A, x)                 # r-dim
    lora_out = matvec(B, Ax)          # d_out-dim
    scale = alpha / r
    return [base_out[j] + scale * lora_out[j] for j in range(d_out)]

def sft_loss_mask(n_instruction_tokens, n_response_tokens):
    return [0] * n_instruction_tokens + [1] * n_response_tokens`,
    notes: [
      'The >200x parameter reduction in the test is not exaggerated for teaching purposes — it is a realistic figure for real 4096-dimensional attention projections at rank 8, the actual scale used in production LoRA fine-tuning.',
      'The zero-init test encodes a real correctness property of every production LoRA implementation: B starts at zero specifically so training begins from a model IDENTICAL to the frozen base, not a randomly perturbed one.',
      'sft_loss_mask is deliberately the simplest possible version of what a real tokenizer/data-collator does with -100 sentinel labels — same idea (zero out instruction-position loss), simplified to a readable 0/1 mask.'
    ]
  },
  quiz: [
    {
      q: 'Why is SFT loss masked to only the response tokens rather than computed over the whole sequence?',
      options: ['Training on instruction tokens would teach the model to predict/continue the user\'s question, which is the opposite of the desired behavior — every gradient update should shape response generation specifically', 'Masking speeds up tokenization', 'The instruction tokens are not fed to the model at all', 'Masking is only needed when the dataset is very small'],
      correct: 0,
      explain: 'The model still sees instruction tokens as context; the loss simply never scores predictions AT those positions, focusing all learning signal on "given this instruction, produce this response."'
    },
    {
      q: 'Why does full fine-tuning require roughly 4x a model\'s parameter memory footprint even with a small dataset?',
      options: ['Adam-family optimizers store two additional moment estimates per parameter alongside the weight and gradient, and dataset size does not change how many parameters need this per-parameter state', 'Small datasets always require more memory than large ones', 'The 4x factor comes from needing four copies of the dataset in memory', 'Full fine-tuning does not actually require more memory than LoRA'],
      correct: 0,
      explain: 'weight + gradient + 2 optimizer moments ≈ 4x, and this scales with the FULL model\'s parameter count regardless of how few training examples are used — the model, not the dataset, drives this cost.'
    },
    {
      q: 'In LoRA, why is B initialized to all zeros while A is initialized with small random values?',
      options: ['So the adapter contributes exactly zero at the start of training (ΔW = BA = 0), making the adapted model identical to the frozen base before any learning happens', 'Zero initialization prevents the base model from being loaded correctly', 'It has no functional purpose, only a performance one', 'A must be zero, not B, for LoRA to work correctly'],
      correct: 0,
      explain: 'Any product involving the all-zero matrix B is zero, so ΔW=BA=0 exactly at initialization regardless of what A contains — training then gradually introduces the learned correction rather than starting from a randomly-perturbed model.'
    },
    {
      q: 'Why does QLoRA quantize the frozen base weights to 4 bits but keep the trainable LoRA matrices in higher precision?',
      options: ['The frozen weights are only ever read in forward passes (a bounded, one-time approximation cost is fine); the LoRA matrices are actively updated by gradient descent, and repeated quantization under active training accumulates destabilizing error', 'Quantizing trainable parameters is technically impossible in any framework', 'The frozen weights are quantized to save disk space only, not memory during training', '4-bit precision would make the LoRA matrices too large to store'],
      correct: 0,
      explain: 'Read-only weights tolerate a small fixed error; parameters under active gradient-based updates need enough precision that update noise doesn\'t compound into training instability — the same reasoning behind fp32 master weights in mixed-precision training.'
    },
    {
      q: 'Why is fine-tuning generally the wrong tool for teaching a model new, specific facts?',
      options: ['A small number of new examples competes against a much larger, more deeply embedded body of pretrained associations, often producing confident but unreliable blends of old and new information rather than a clean overwrite', 'Fine-tuning can only change a model\'s vocabulary, not its knowledge', 'New facts require full fine-tuning and cannot be taught via LoRA specifically', 'Base models cannot be fine-tuned on factual content at all'],
      correct: 0,
      explain: 'Fine-tuning shapes behavior well (style, format, following instructions) but is unreliable for injecting isolated new facts — retrieval (RAG, Part 7) is the better tool for giving a model access to current or specific information.'
    }
  ],
  pitfalls: [
    'Forgetting to freeze the base model\'s parameters (requires_grad = False) before wrapping it with a LoRA adapter — without this, the "frozen" backbone silently receives gradients too, defeating the memory savings and reintroducing catastrophic-forgetting risk.',
    'Not masking the instruction tokens out of the SFT loss — training on the full sequence unmasked measurably degrades response quality by wasting (and working against) gradient signal on predicting the user\'s own question.',
    'Choosing a LoRA rank r far too small or far too large without checking — too small under-fits complex behavior changes; too large approaches full fine-tuning\'s cost and forgetting risk without matching benefit. r=8-64 is a common practical range, tuned empirically, not a universal constant.',
    'Assuming a merged LoRA model (W + scale·BA folded into one matrix) behaves identically to keeping the adapter separate at inference — numerically they should match closely, but a separate adapter allows hot-swapping different task adapters onto one base model, a real operational advantage merging gives up.',
    'Using fine-tuning to "update the model\'s knowledge" as a substitute for a proper data pipeline — this is the single most common and costly fine-tuning mistake in production systems, and it is a decision worth pushing back on explicitly (behavior via fine-tuning, facts via retrieval).',
    'Confusing "the model can now talk about topic X because we fine-tuned on X" with "the model reliably knows current facts about X" — fine-tuning on a topic teaches STYLE and FAMILIARITY with the topic\'s language, not guaranteed factual accuracy about specific, evolving details within it.'
  ],
  interview: [
    {
      q: 'Explain the LoRA mechanism in full: the math, why it saves memory, and why it empirically works nearly as well as full fine-tuning.',
      a: 'LoRA freezes a pretrained weight matrix W (d_in×d_out) entirely — no gradients, no optimizer state for it — and represents the fine-tuning UPDATE as a low-rank product ΔW=BA, where A is r×d_in and B is d_out×r, with r chosen much smaller than d_in/d_out (commonly 8-64 versus dimensions in the thousands). The forward pass becomes h = xW + (α/r)·xAᵀBᵀ, where only A and B are trainable. Memory savings: trainable parameter count drops from d_in×d_out to r(d_in+d_out) — often a 100-1000x reduction — and since Adam-family optimizers store per-parameter moment estimates only for TRAINABLE parameters, optimizer memory shrinks by the same factor, which is the direct reason LoRA fine-tuning fits on hardware where full fine-tuning of the identical base model would exceed available memory. Why it works empirically: the LoRA paper\'s central finding is that the weight UPDATE needed to adapt a large pretrained model to a new task has low "intrinsic rank" — despite the full weight matrix having enormous dimensionality, the actual useful direction of change during task adaptation lives in a small subspace, so a low-rank approximation of that change captures most of the benefit. As a bonus, because W is never modified, everything the base model already knew outside that low-rank update remains completely intact — LoRA is close to immune to catastrophic forgetting by construction, unlike full fine-tuning.'
    },
    {
      q: 'What specifically does QLoRA add on top of LoRA, and what problem does each addition solve?',
      a: 'Three additions, each solving a specific memory problem LoRA alone doesn\'t address. (1) 4-bit NF4 quantization of the FROZEN base weights: LoRA already shrinks trainable-parameter memory, but the frozen base model still needs to be loaded in full precision — for a 65B model that\'s roughly 130GB in bf16, out of reach for consumer hardware regardless of adapter size; NF4 quantizes those read-only weights to 4 bits using a distribution matched to how pretrained weights are actually distributed (roughly normal), cutting that footprint by ~4x with a small, bounded forward-pass approximation cost. (2) Double quantization: the quantization CONSTANTS themselves (scale factors used to dequantize blocks of weights) also take memory at scale; quantizing those constants too yields a further, smaller memory saving. (3) Paged optimizers: borrowing the OS concept of memory paging, optimizer state that would otherwise cause an out-of-memory spike during a large batch or long sequence is automatically offloaded to CPU memory temporarily and paged back in as needed, rather than crashing the training run. Combined, these took what would otherwise require a multi-GPU server (full-precision base weights, even with a LoRA adapter) down to fitting a 65B-parameter fine-tune on a single 48GB GPU, and smaller models on much more modest consumer hardware.'
    },
    {
      q: 'A team wants to fine-tune an open-source LLM so it "knows" their constantly-changing internal product documentation. Walk through your recommendation.',
      a: 'Start by separating what they actually need: is this a BEHAVIOR problem (the model should answer product questions in a specific format/tone/style) or a KNOWLEDGE problem (the model needs access to specific, frequently-changing facts)? Based on the description ("constantly-changing... documentation"), this is overwhelmingly a knowledge problem, and fine-tuning is the wrong primary tool for it — a fine-tuning run baking in today\'s documentation would need to be RE-RUN every time the docs change, is unreliable at cleanly overwriting stale facts with updated ones (the model can blend old and new into a confidently wrong answer), and the cost/latency of continuous re-fine-tuning doesn\'t match how frequently the underlying facts actually change. The right architecture: retrieval-augmented generation (RAG, Part 7) — keep the documentation in a searchable store, retrieve the relevant section(s) at query time, and place them directly in the model\'s context so every answer is grounded in the CURRENT document, with citations possible. If there\'s ALSO a genuine behavior need (e.g., "always respond in this specific structured format," "always ask a clarifying question before answering ambiguous requests"), that part is a legitimate, complementary LoRA fine-tuning job layered on top of a RAG pipeline — fine-tune the response SHAPE, retrieve the actual CONTENT. Recommending fine-tuning alone for this request would predictably produce a model that sounds confident about documentation that\'s already out of date by the time training finishes.'
    },
    {
      q: 'How would you decide between LoRA and QLoRA for a specific fine-tuning job, and what would make you reach for full fine-tuning instead of either?',
      a: 'LoRA vs QLoRA is primarily a hardware-constraint decision, not a quality-first one: if the base model fits comfortably in available GPU memory at full/bf16 precision alongside the (already tiny) LoRA adapter\'s optimizer state, plain LoRA is preferable — it avoids QLoRA\'s small forward-pass quantization error and its added engineering complexity (quantization scheme, dequantization overhead at each forward pass) for no real benefit. QLoRA earns its complexity specifically when the frozen base model itself doesn\'t fit in available memory in full precision — a 65B+ model on a single consumer/prosumer GPU, or wanting to fine-tune a large model without provisioning multi-GPU infrastructure. Full fine-tuning is the right call in narrower circumstances than intuition suggests: when you have both a genuinely large, high-quality, task-diverse dataset (not a few hundred examples) AND a specific, measured reason to believe the task requires broad changes across the model rather than a bounded low-rank correction (LoRA\'s "low intrinsic rank" assumption doesn\'t hold for the task) AND the compute budget to support it — in practice, most real-world fine-tuning jobs (behavior shaping, style adaptation, narrow task specialization) are well within LoRA\'s low-rank assumption, and the honest recommendation in most interviews and most real projects is "start with LoRA, measure against your actual eval set (the model-evaluation lesson\'s discipline), and only escalate to full fine-tuning if LoRA measurably underperforms and you can afford to test that hypothesis."'
    }
  ]
};
