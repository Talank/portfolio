window.LESSONS = window.LESSONS || {};
window.LESSONS['llm-pretraining'] = {
  id: 'llm-pretraining',
  title: 'Pretraining LLMs: Data, Scaling Laws & Distributed Training',
  category: 'Part 6 — LLM Engineering',
  timeMin: 55,
  summary: 'MiniGPT trains in minutes on a CPU with a few hundred lines of Shakespeare. A frontier LLM trains for months on thousands of GPUs over trillions of tokens, and costs tens of millions of dollars. Same architecture, same causal language modeling loss — this lesson is everything that changes when you scale that up: where the data comes from and how it\'s cleaned, what "scaling laws" actually predict, how training gets split across hardware, and — critically — what you get at the end (a base model) versus what you still don\'t have (a helpful assistant).',
  goals: [
    'Describe the pretraining data pipeline: collection, filtering, deduplication, mixing, and tokenization at scale',
    'State the Chinchilla scaling-law finding precisely: the compute-optimal ratio between model size and training tokens',
    'Explain data parallelism, tensor/model parallelism, and pipeline parallelism — what each splits and when each is needed',
    'Explain mixed-precision training: why lower precision speeds things up and what keeps it numerically stable',
    'Explain exactly why a raw pretrained base model is not yet a helpful assistant — the objective it was actually trained on'
  ],
  concept: [
    {
      h: 'Same architecture, three new problems',
      p: [
        'The MiniGPT lesson\'s architecture — token+positional embedding, N causal transformer blocks, tied output head, cross-entropy loss via teacher forcing — is not a simplification of a real LLM\'s architecture. It IS the architecture (GPT-3, LLaMA, and most frontier models are this exact recipe, just with much larger n_layers and d_model). What pretraining at real scale adds are three genuinely new engineering problems that have nothing to do with the model\'s math: where do you get enough good DATA, how do you decide how big to make the model given a fixed budget (SCALING), and how do you physically run a computation too large for any single machine (DISTRIBUTION). This lesson is those three problems, in order.'
      ]
    },
    {
      h: 'The data pipeline: collection, filtering, deduplication, mixing',
      p: [
        'Raw material is mostly Common Crawl (petabytes of scraped public web pages) plus curated sources — books, Wikipedia, code repositories, academic papers — combined because different sources teach different things (code teaches structured reasoning and precise syntax; books teach long-range narrative coherence; Wikipedia teaches dense factual writing). None of this is used raw.',
        '<b>Filtering</b> removes low-quality content: language identification (keep only the target language(s)), a trained quality classifier (a small model, often logistic regression or a tiny neural net — the classical-ML lessons\' territory — scores "does this read like well-formed prose" versus boilerplate, spam, or SEO-stuffed garbage), and heuristic rules (drop documents that are mostly symbols, absurdly short, or fail basic structure checks).',
        '<b>Deduplication</b> matters more than intuition suggests. Exact duplicates are common (the same article mirrored across many sites); NEAR-duplicates are the sneakier problem — boilerplate templates, slightly-reworded spam, or a popular paragraph quoted thousands of times — detected via fuzzy techniques like MinHash/LSH (locality-sensitive hashing: represent each document as a compact signature such that similar documents get similar signatures, then bucket and compare cheaply instead of all-pairs comparing every document). Why it matters so much: undeduplicated data lets the model effectively "memorize by repetition" rather than generalize, measurably hurts downstream quality, and can leak memorized boilerplate verbatim at inference — a real, documented failure mode of early large models.',
        '<b>Mixing</b> is the final, surprisingly consequential choice: what FRACTION of the training budget comes from each source (web text, books, code, dialogue, academic text)? This is tuned empirically — more code data measurably helps reasoning-adjacent benchmarks even for non-coding tasks, for instance — and re-tuning the mixture is one of the highest-leverage, lowest-glamour levers in pretraining, worth naming in an interview as "not just architecture and scale — the data recipe is itself a major design decision."'
      ]
    },
    {
      h: 'Scaling laws: what Chinchilla actually found',
      p: [
        'A pretraining run has three knobs: model size N (parameters), dataset size D (training tokens), and compute C (roughly C ≈ 6·N·D FLOPs — the standard approximation for a transformer\'s training compute, where the 6 comes from ~2 FLOPs per parameter for the forward pass and ~4 more for the backward pass). Empirically, final training loss follows a smooth, predictable POWER LAW in each of these when the others aren\'t the bottleneck — plot log(loss) against log(N) or log(D) and you get a near-straight line, stable enough to EXTRAPOLATE: train several smaller models, fit the curve, and predict a much larger model\'s loss before ever training it.',
        'The 2022 Chinchilla paper (Hoffmann et al.) asked a sharper question: for a FIXED compute budget C, what split between N and D minimizes loss? Earlier large models (GPT-3: 175B params, ~300B training tokens) turned out to be substantially UNDER-trained relative to their size — too many parameters, not enough data, for their compute budget. Chinchilla\'s finding: compute-optimal training wants model size and token count to scale together, roughly <b>~20 training tokens per parameter</b> (a 70B-parameter compute-optimal model wants roughly 1.4 trillion training tokens). Train a Chinchilla-sized model at the SAME compute budget as an under-trained GPT-3-style model, and it reliably wins on downstream quality — this single result reshaped how the whole field allocates training budgets after 2022, and it is a genuinely interview-testable fact, not just conceptual background.',
        '<div class="math">C ≈ 6·N·D&nbsp;&nbsp;&nbsp;&nbsp;compute-optimal: D ≈ 20·N<span class="mnote">fixed compute budget → solve for the (N, D) pair that minimizes loss, not just "make N as big as possible"</span></div>',
        'Caveat worth stating precisely: "compute-optimal" minimizes TRAINING loss for a given training compute budget — it says nothing about INFERENCE cost. A smaller model trained on more tokens than Chinchilla-optimal (over-trained relative to the ratio) can still be the better real-world choice if it will be served billions of times, because inference cost scales with model size, not training compute — this is exactly why many widely-deployed open models (LLaMA family) are deliberately trained well past the Chinchilla-optimal point: cheaper to run forever, at a modest extra training cost paid once.'
      ]
    },
    {
      h: 'Distributed training: splitting a computation too big for one machine',
      p: [
        'Three orthogonal ways to split the work across many GPUs, often combined:',
        '<b>Data parallelism.</b> Copy the ENTIRE model onto every GPU; give each GPU a different slice of the current batch; each computes its own forward/backward pass independently; then an all-reduce step averages gradients across all GPUs before every optimizer step, so all copies stay identical. Simple, and the default first lever — but it doesn\'t help if the MODEL itself is too big to fit on one GPU\'s memory in the first place.',
        '<b>Tensor (model) parallelism.</b> Split individual WEIGHT MATRICES across GPUs — e.g., a Linear layer\'s [d_model, 4*d_model] FFN matrix gets column-sliced so each GPU holds and computes only a fraction of it, with a communication step to combine partial results. This is what lets a single layer too large for one GPU\'s memory exist at all; the cost is frequent, latency-sensitive communication between GPUs (best done over very fast interconnects within one physical node).',
        '<b>Pipeline parallelism.</b> Split the LAYERS themselves across GPUs — GPU 1 holds blocks 1-8, GPU 2 holds blocks 9-16, etc. — and stream "microbatches" through the pipeline so GPU 2 can start working on microbatch 1 while GPU 1 has already moved on to microbatch 2 (exactly the assembly-line idea, minimizing idle GPU time between stages — the naive version otherwise leaves every GPU but one idle at any given moment, the "pipeline bubble" problem).',
        'Frontier training runs use all three simultaneously (often called 3D parallelism) — data parallelism across whole model REPLICAS, tensor parallelism within a node for the biggest matrices, pipeline parallelism across nodes for depth — an entire subfield (distributed systems engineering) most ML engineers will never personally implement but should recognize by name, since it explains why pretraining a frontier model requires a dedicated infrastructure team, not just an ML researcher with a laptop.'
      ]
    },
    {
      h: 'Mixed-precision training: doing more, faster, without breaking gradients',
      p: [
        'Standard float32 uses 4 bytes per number; float16/bfloat16 use 2 — half the memory, roughly double the throughput on hardware with dedicated low-precision matmul units (modern GPU tensor cores). Running the FORWARD and BACKWARD pass in fp16/bf16 while keeping a MASTER COPY of weights in fp32 (updated by the optimizer, then cast back down to fp16/bf16 for the next forward pass) captures most of the speed benefit while avoiding the accumulation of rounding error that pure fp16 weights would suffer over thousands of update steps.',
        'The specific danger with fp16 (less so bf16, which trades precision for a wider EXPONENT range matching fp32): very small gradient values can UNDERFLOW to exactly zero in fp16\'s narrower range, silently killing a training signal. The fix is <b>loss scaling</b>: multiply the loss by a large constant (say 1024) before backward() — every gradient scales up proportionally by the chain rule, pushing small-but-nonzero gradients up out of fp16\'s underflow range — then divide the gradients back down by the same constant before the optimizer step. bfloat16 (the now-standard choice for most large-model training) sidesteps this specific problem by keeping fp32\'s wide exponent range while still halving memory, at the cost of some mantissa precision — which is why most modern pretraining defaults to bf16 over fp16 and often skips loss scaling entirely.'
      ]
    },
    {
      h: 'What you actually get: a base model, not an assistant',
      p: [
        'After all of this, the resulting model is trained on exactly one objective: predict the next token, given internet-scale text (the bert-vs-gpt lesson\'s causal language modeling loss, at planetary scale). It has NOT been trained to follow instructions, answer questions helpfully, refuse harmful requests, or format output in any particular way — it has been trained to continue text plausibly, in whatever style/genre/register the prompt suggests. Prompt a raw base model with "How do I bake bread?" and, depending on what internet text that prompt pattern-matches to, it might answer helpfully, continue with a LIST OF SIMILAR QUESTIONS (because forum FAQ pages often look like that), or trail off into an unrelated blog post — because "plausible continuation of this text" and "helpful answer to this question" are related but genuinely different objectives.',
        'This gap — a fluent, broadly-capable base model that isn\'t yet a well-behaved assistant — is exactly what the next two lessons close. Fine-tuning (specifically SFT, supervised fine-tuning, next lesson) teaches the specific input→output SHAPE of instruction-following on a much smaller, curated dataset of (instruction, good response) pairs. Alignment (RLHF/DPO, the lesson after) further tunes the model\'s behavior toward human PREFERENCES — helpful, harmless, honest — using comparison data rather than single "correct" answers. Pretraining builds the engine; these later stages are what make it drivable.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Vegapunk\'s six satellites compile the world',
      text: 'Vegapunk decides to build something beyond even his Punk Records chart from before — a single brain that has absorbed every recorded word from every island, not just his crew\'s conversations. The scale immediately breaks a one-person approach, so he splits the labor across his six satellite personalities, and the split maps onto this lesson exactly. York, whose one canon obsession is HOARDING information, is put in charge of collection — she doesn\'t just gather Den Den Mushi transcripts, she goes after literal WAREHOUSES of them, from every Marine base, every newspaper archive, every ship\'s log, because more raw material is always the starting move. Lilith, unimpressed, refuses to feed York\'s raw haul in unfiltered — she insists on throwing out the obviously duplicated broadcasts (the same Marine bulletin echoed identically across forty islands), the garbled Den Den Mushi static passed off as "transcripts," and anything that\'s mostly noise, keeping only what\'s actually worth learning from. Pythagoras, built for raw computation, refuses to process the surviving mountain of text alone — he splits it across every satellite\'s processing core simultaneously, each satellite chewing through a different SLICE of the archive in parallel, periodically comparing notes so all six stay in sync on what they\'ve collectively learned (the crew jokes it looks exactly like six Vegapunks reading different newspapers at once, then meeting to compare). Edison, the impatient one, keeps demanding they just make the brain BIGGER — more satellite-processing-tissue, surely more is always better — until Atlas runs the actual numbers and discovers something nobody expected: brain-size and archive-size need to grow together in a fixed, predictable RATIO, or the extra brain tissue goes to waste; a huge brain fed a small archive is no better than a modest brain fed the RIGHT amount, and there\'s an exact, calculable sweet spot for any given amount of processing power they\'re willing to spend. Weeks later, the finished brain can complete ANY sentence fluently, in any island\'s dialect, on any topic ever recorded — but when a young Marine recruit politely asks it a direct question, it just keeps talking, rambling into tangentially related trivia, never quite ANSWERING, because nobody ever taught it the difference between "continue plausibly" and "actually help the person asking." Vegapunk stares at his magnificent, useless-for-conversation creation and mutters: "we built the engine. We forgot to teach it to drive." That fix is next month\'s project.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Building the Ultimate Friends Trivia Machine',
      text: 'Ross, obsessed with winning an upcoming trivia night, recruits the whole gang to build something absurd: a machine trained on literally every rerun, so it can answer ANY question about their own lives fluently. He splits the work exactly like Vegapunk\'s satellites, six friends, six jobs. Joey volunteers for collection, gleefully re-watching and narrating every taped episode he can find (more tapes, more anecdotes, always his answer). Monica — predictably — refuses to let Joey\'s raw haul in unsorted, throwing out the duplicate retellings of the same story and the tapes that are mostly static or crosstalk, keeping only usable material (her dedup instinct finally has a real outlet). Chandler and Ross split reviewing what\'s left in parallel shifts instead of both watching everything serially, comparing notes at the end of each night so nothing gets processed twice. Phoebe, unexpectedly, is the one who notices the real pattern: bigger note-card stacks only help if you ALSO have proportionally more tapes to back them up — a huge stack of cards with too few tapes is just guessing, and she works out, purely by trial and error, the exact ratio of tapes-to-cards that makes recall actually improve, refusing to let Ross just pile on more cards without more tape to match. Weeks later, the finished machine can complete any "Friends"-trivia sentence with eerie fluency — until Rachel tests it with a direct, polite question and it just KEEPS TALKING, spiraling into tangential gossip about Ugly Naked Guy, never landing on an actual answer, because nobody ever taught it the difference between "sound like us" and "actually help whoever\'s asking." Ross, staring at his technically-impressive, practically-useless creation: "We built something that talks. We forgot to teach it to listen."'
    },
    why: 'Six workers splitting one enormous job maps directly onto the lesson\'s three engineering problems: collect too much raw material, then aggressively clean it (data pipeline); discover that brain-size and archive-size must grow together in a fixed ratio, not independently (scaling laws); and split the processing across many workers running in parallel, syncing periodically (distributed training). And both stories land on the same punchline for a reason: the finished product is fluent but not HELPFUL — the exact gap the next two lessons exist to close.'
  },
  storyAnim: {
    title: 'Vegapunk\'s pretraining pipeline',
    h: 260,
    props: [
      { id: 'raw', emoji: '📚', label: 'raw archive (every island)', x: 10, y: 14 },
      { id: 'clean', emoji: '🧹', label: 'cleaned + deduplicated', x: 32, y: 14 },
      { id: 'satellites', emoji: '🛰️', label: '6 satellites, parallel processing', x: 55, y: 14 },
      { id: 'curve', emoji: '📈', label: 'brain-size ∝ archive-size (scaling law)', x: 78, y: 14 },
      { id: 'brain', emoji: '🧠', label: 'finished base model', x: 45, y: 50 },
      { id: 'fluent', emoji: '💬', label: 'fluent completion ✓', x: 20, y: 82 },
      { id: 'confused', emoji: '❓', label: '"how do I bake bread?" → rambles, never answers', x: 70, y: 82 }
    ],
    actors: [
      { id: 'york', emoji: '🛍️', label: 'York (collects)', x: 10, y: 40 },
      { id: 'vegapunk', emoji: '🧑‍🔬', label: 'Vegapunk', x: 45, y: 70 }
    ],
    steps: [
      { c: 'York hoards every Den Den Mushi transcript, newspaper, and ship\'s log she can find. More raw material, always the starting move.', p: { raw: 'lit' }, a: { york: [20, 20] } },
      { c: 'Lilith throws out duplicated broadcasts and garbled static — cleaning matters more than intuition suggests.', p: { clean: 'good' } },
      { c: 'Pythagoras splits the surviving archive across all six satellites, each processing a different slice in parallel, syncing periodically.', p: { satellites: 'lit' } },
      { c: 'Atlas discovers the real rule: brain-size and archive-size must grow together in a fixed ratio, not independently. Edison\'s "just make it bigger" alone wastes tissue.', p: { curve: 'good' } },
      { c: 'The finished brain: fluent completion on any topic, any dialect.', p: { brain: 'good', fluent: 'good' }, a: { vegapunk: [45, 55] } },
      { c: 'But asked a direct question, it just rambles — never trained to distinguish "continue plausibly" from "actually help". A base model, not yet an assistant.', p: { confused: 'bad' }, l: { confused: 'gap closed by fine-tuning + alignment, next two lessons' } }
    ]
  },
  conceptFlow: {
    title: 'The mechanism, step by step: Vegapunk\'s six satellites',
    intro: 'Click any box to jump straight there, or press Play and just listen.',
    stages: [
      {
        label: 'Collect',
        nodes: [
          { id: 'raw', text: 'York: raw archive\nevery island\'s transcripts, newspapers, ship\'s logs' },
        ],
      },
      {
        label: 'Clean',
        nodes: [
          { id: 'clean', text: 'Lilith: filter + dedupe\ndrop duplicated broadcasts, garbled static' },
        ],
      },
      {
        label: 'Scale',
        nodes: [
          { id: 'ratio', text: 'Atlas: D ≈ 20N\nbrain-size and archive-size grow together, not "just bigger"' },
        ],
      },
      {
        label: 'Distribute',
        nodes: [
          { id: 'satellites', text: 'Pythagoras: 6 satellites in parallel\neach processes a slice, syncing periodically' },
        ],
      },
      {
        label: 'Result',
        nodes: [
          { id: 'brain', text: 'Finished base model\nfluent completion — but rambles instead of answering' },
        ],
      },
    ],
    steps: [
      { active: ['raw'], note: 'York hoards every transcript, newspaper, and log she can find — more raw material is always the starting move, before any cleaning happens.' },
      { active: ['clean'], note: 'Lilith throws out duplicated broadcasts and garbled static. Deduplication matters more than intuition suggests: it prevents the model from memorizing repeats instead of generalizing.' },
      { active: ['ratio'], note: 'Atlas discovers the real rule: brain-size (N) and archive-size (D) must grow together in a fixed ratio, D ≈ 20N — Edison\'s "just make it bigger" wastes tissue if the archive doesn\'t grow proportionally.' },
      { active: ['satellites'], note: 'Pythagoras splits the surviving archive across all six satellites, each chewing through a different slice in parallel, periodically comparing notes — data parallelism, made concrete.' },
      { active: ['brain'], note: 'The finished brain completes any sentence fluently on any topic — but asked a direct question, it just rambles. It was only ever trained to continue text plausibly, never to distinguish that from actually answering. A base model, not yet an assistant.' },
    ],
  },
  tech: [
    {
      q: 'State the Chinchilla scaling-law finding precisely, including the approximate compute formula and token-to-parameter ratio.',
      a: 'Training compute is approximated as C ≈ 6ND FLOPs, where N is parameter count and D is training tokens (the "6" comes from roughly 2 FLOPs/parameter for the forward pass plus roughly 4 more for the backward pass, per token). Chinchilla (Hoffmann et al., 2022) trained many models at different (N, D) pairs under matched compute budgets and fit power-law curves to find the LOSS-MINIMIZING allocation for a fixed C, discovering that prior large models (GPT-3-era) had been allocating too much budget to parameters and too little to data — compute-optimal training wants N and D to scale together, at roughly D ≈ 20N (a compute-optimal model with 70B parameters wants roughly 1.4 trillion training tokens). The practical consequence: for a fixed compute budget, a smaller, more-heavily-trained model reliably outperforms a larger, under-trained one — which is why post-2022 pretraining runs allocate substantially more tokens per parameter than the pre-Chinchilla era did. Caveat to include: this ratio minimizes TRAINING compute for a given loss, not inference cost — production models are often deliberately trained well past this ratio (more tokens than "optimal") because a smaller model that will be served billions of times has a much bigger total cost from INFERENCE than from the one-time extra training expense.'
    },
    {
      q: 'Explain data parallelism versus tensor parallelism versus pipeline parallelism — what each actually splits, and the failure each addresses.',
      a: 'Data parallelism splits the BATCH: identical full model copies on every GPU, each processing a different subset of the current batch, gradients averaged (all-reduced) across GPUs before every optimizer step so replicas stay in sync. It addresses "training is slow" (more GPUs process more examples per second) but does NOT help if the model itself doesn\'t fit in one GPU\'s memory — every GPU still needs the WHOLE model. Tensor (model) parallelism splits individual WEIGHT MATRICES across GPUs — e.g. a large Linear layer\'s matrix is column- or row-sliced so each GPU holds only a fraction, with a communication/combination step per layer. It addresses "a single layer is too big for one GPU," at the cost of frequent, latency-sensitive inter-GPU communication (best kept within a fast-interconnected node). Pipeline parallelism splits the LAYERS/DEPTH across GPUs — GPU 1 owns the first several blocks, GPU 2 the next several, etc. — with microbatches streamed through so different GPUs work on different microbatches simultaneously rather than sitting idle waiting for the whole batch to finish one stage. It addresses "the whole model (all layers) doesn\'t fit even split within one node," at the cost of pipeline "bubble" idle time that needs careful microbatch scheduling to minimize. Real large-scale training combines all three (3D parallelism): data parallelism across replica GROUPS, tensor parallelism within a fast-interconnected node, pipeline parallelism across nodes for depth.'
    },
    {
      q: 'How does mixed-precision training work, and what specifically can go wrong with fp16 that bf16 avoids?',
      a: 'The forward and backward passes run in a lower-precision format (fp16 or bf16, 2 bytes vs fp32\'s 4), roughly halving memory and, on hardware with dedicated low-precision matmul units (tensor cores), roughly doubling throughput — while a MASTER COPY of the weights is kept in fp32 and updated by the optimizer each step (then cast down to low precision for the next forward pass), preventing the accumulation of rounding error across thousands of small updates that pure low-precision weights would suffer. The specific fp16 danger: fp16 has a NARROW exponent range, so small-magnitude gradient values (very common deep in a network, especially early in training) can underflow to exactly zero, silently killing that gradient\'s contribution — the fix is loss scaling: multiply the loss by a constant (e.g. 1024) before backward(), which scales every gradient up proportionally (by the chain rule) into fp16\'s representable range, then divide the gradients back down before the optimizer step. bfloat16 avoids this specific failure mode by keeping the SAME wide exponent range as fp32 (trading away some mantissa/precision bits instead), so small gradients don\'t underflow the way they can in fp16 — which is why bf16, not fp16, is the standard choice for most modern large-model pretraining, often without needing loss scaling at all.'
    },
    {
      q: 'Mechanically, why does a raw pretrained base model fail to behave like a helpful assistant, even though it is fluent and broadly capable?',
      a: 'The ENTIRE training signal a base model ever received is "given this prefix, predict the statistically likely next token" over internet-scale text — there is no notion of "this specific response is what a helpful assistant should say" anywhere in that objective. When you prompt it with something that looks like a question, the model isn\'t asking "how do I help this person" — it\'s asking "what text plausibly follows this pattern," and internet text containing that pattern includes genuinely helpful answers, but ALSO forum threads where a question is followed by five MORE similar questions, blog posts that trail into unrelated tangents, and FAQ pages that never resolve into a direct answer — the model has no mechanism to prefer the helpful-answer continuation over any of the others, because all of them were plausible continuations somewhere in its training data. This is precisely why supervised fine-tuning exists (next lesson): a smaller, CURATED dataset of (instruction, ideal response) pairs specifically teaches the shape "when you see something that looks like an instruction, the correct completion is a direct, helpful answer, not another instruction or a tangent" — reshaping which continuations the model prefers, on top of the broad knowledge and fluency pretraining already built.'
    }
  ],
  code: {
    title: 'Data pipeline and distributed training, sketched',
    intro: 'Illustrative, not runnable end-to-end (requires a multi-GPU cluster and terabytes of data) — read this as the shape of a real pretraining setup, connecting each lesson concept to the actual PyTorch/HF ecosystem calls that implement it.',
    code: `# --- 1. Data pipeline (conceptual shape) ---
# raw_docs = load_common_crawl_shard() + load_books() + load_code() + load_wikipedia()
# clean_docs = [d for d in raw_docs if language_id(d) == "en" and quality_classifier(d) > 0.5]
# deduped = minhash_deduplicate(clean_docs)          # near-duplicate removal via LSH
# mixed = mix_sources(deduped, weights={"web": 0.6, "books": 0.15, "code": 0.15, "wiki": 0.1})
# token_ids = tokenizer.encode_batch(mixed)           # BPE, trained separately on a sample
# packed = pack_into_fixed_length_sequences(token_ids, block_size=2048)

# --- 2. Compute-optimal sizing (Chinchilla ratio) ---
def chinchilla_optimal_tokens(n_params, ratio=20):
    return n_params * ratio                            # D ~ 20N, tokens to train on

def training_flops(n_params, n_tokens):
    return 6 * n_params * n_tokens                      # C ~ 6ND

n_params = 7_000_000_000
tokens_needed = chinchilla_optimal_tokens(n_params)
print(f"7B model, compute-optimal tokens: {tokens_needed:,}")   # ~140B tokens
print(f"training FLOPs: {training_flops(n_params, tokens_needed):.2e}")

# --- 3. Distributed training (PyTorch idioms, sketch) ---
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

# dist.init_process_group("nccl")                      # one process per GPU
# model = MiniGPT(...).to(local_rank)
# model = DDP(model, device_ids=[local_rank])           # wraps forward/backward with gradient all-reduce

scaler = torch.cuda.amp.GradScaler()                    # loss scaling for fp16 stability
# for xb, yb in loader:
#     with torch.cuda.amp.autocast(dtype=torch.bfloat16):   # mixed precision forward
#         logits, loss = model(xb, yb)
#     scaler.scale(loss).backward()                     # scaled backward (fp16) / plain (bf16)
#     scaler.step(optimizer)
#     scaler.update()`,
    notes: [
      'chinchilla_optimal_tokens and training_flops ARE runnable as pure functions — the surrounding distributed/data code is sketched because it genuinely requires infrastructure this browser doesn\'t have.',
      'DistributedDataParallel (DDP) is PyTorch\'s data-parallelism primitive — it wraps a model so backward() automatically triggers gradient all-reduce across all processes, keeping every GPU\'s copy in sync with zero manual synchronization code.',
      'torch.cuda.amp.autocast automatically runs eligible ops (matmuls) in reduced precision while keeping numerically sensitive ops (like softmax accumulation) in fp32 internally — you rarely hand-pick precision per operation.',
      'This sketch is the entire arc of the lesson in ~25 lines: clean data in, compute-optimal sizing decision, distributed + mixed-precision execution.'
    ]
  },
  lab: {
    title: 'Data cleaning and compute-optimal sizing, in pure Python',
    prompt: 'Pure Python, fully runnable — the parts of the pretraining pipeline that are just logic, not infrastructure. Implement (1) <code>normalize_text(t)</code> — lowercase and collapse whitespace, for duplicate comparison; (2) <code>dedupe(docs)</code> — remove documents whose NORMALIZED form has already been seen, preserving first-occurrence order; (3) <code>filter_quality(docs, min_words=5)</code> — keep only documents with at least min_words words; (4) <code>training_flops(n_params, n_tokens)</code> — the C ≈ 6ND approximation; (5) <code>chinchilla_optimal_tokens(n_params, ratio=20)</code> — the compute-optimal token budget for a given parameter count.',
    starter: `def normalize_text(t):
    # lowercase, collapse repeated whitespace to single spaces, strip
    ...

def dedupe(docs):
    # remove docs whose normalized form was already seen; keep first occurrence order
    ...

def filter_quality(docs, min_words=5):
    # keep only docs with at least min_words words
    ...

def training_flops(n_params, n_tokens):
    # C ~ 6ND
    ...

def chinchilla_optimal_tokens(n_params, ratio=20):
    # compute-optimal token budget: D ~ ratio * N
    ...`,
    checks: [
      { re: 'def\\s+normalize_text\\s*\\(', must: true, hint: 'Define normalize_text(t) — lowercase + collapse whitespace.', pass: 'normalize_text() defined' },
      { re: 'def\\s+dedupe\\s*\\(', must: true, hint: 'Define dedupe(docs) using normalize_text to detect near-duplicates.', pass: 'dedupe() defined' },
      { re: 'def\\s+filter_quality\\s*\\(', must: true, hint: 'Define filter_quality(docs, min_words=5).', pass: 'filter_quality() defined' },
      { re: 'def\\s+training_flops\\s*\\(', must: true, hint: 'Define training_flops(n_params, n_tokens) implementing C ~ 6*N*D.', pass: 'training_flops() defined' },
      { re: 'def\\s+chinchilla_optimal_tokens\\s*\\(', must: true, hint: 'Define chinchilla_optimal_tokens(n_params, ratio=20) implementing D ~ ratio*N.', pass: 'chinchilla_optimal_tokens() defined' },
      { re: '6\\s*\\*', must: true, hint: 'training_flops should compute 6 * n_params * n_tokens — the standard approximation.', pass: '6ND formula present' }
    ],
    tests: `# normalize_text: case and whitespace insensitive
assert normalize_text("  The Quick BROWN Fox  ") == normalize_text("the quick brown fox")

# dedupe: near-duplicates collapse, distinct docs survive, order preserved
docs = ["The cat sat.", "the   CAT sat.", "A totally different sentence.", "The cat sat."]
result = dedupe(docs)
assert result == ["The cat sat.", "A totally different sentence."], f"got {result}"

# filter_quality: drop short docs, keep the rest
docs2 = ["too short", "This document has more than five words in it easily.", "one two three"]
kept = filter_quality(docs2, min_words=5)
assert kept == ["This document has more than five words in it easily."], f"got {kept}"

# training_flops: C ~ 6ND
assert training_flops(1_000_000, 1000) == 6 * 1_000_000 * 1000

# chinchilla_optimal_tokens: D ~ 20N by default
assert chinchilla_optimal_tokens(1_000_000_000) == 20_000_000_000

# GPT-3 (175B params, ~300B tokens) was undertrained relative to compute-optimal
gpt3_optimal = chinchilla_optimal_tokens(175_000_000_000)
assert gpt3_optimal > 300_000_000_000, "compute-optimal token count should exceed GPT-3's actual training tokens"
print(f"GPT-3-sized model: {gpt3_optimal:,} compute-optimal tokens vs ~300B actually used — undertrained.")
print("Data cleaning + compute-optimal sizing. The two least glamorous, most consequential parts of pretraining.")`,
    runnable: true,
    solution: `import re

def normalize_text(t):
    return re.sub(r"\\s+", " ", t.strip().lower())

def dedupe(docs):
    seen = set()
    result = []
    for d in docs:
        key = normalize_text(d)
        if key not in seen:
            seen.add(key)
            result.append(d)
    return result

def filter_quality(docs, min_words=5):
    return [d for d in docs if len(d.split()) >= min_words]

def training_flops(n_params, n_tokens):
    return 6 * n_params * n_tokens

def chinchilla_optimal_tokens(n_params, ratio=20):
    return n_params * ratio`,
    notes: [
      'The GPT-3 test at the end is not a toy number — it is the actual finding that motivated the Chinchilla paper: a 175B model "wants" roughly 3.5 trillion compute-optimal tokens but was trained on about 300B, a real and consequential under-training gap.',
      'dedupe here is EXACT-after-normalization deduplication (case/whitespace-insensitive). Real pipelines add fuzzy/near-duplicate detection via MinHash — this lab implements the simpler, still-genuinely-useful first layer.',
      'Notice how much of "pretraining" is ordinary, unglamorous data-engineering logic — normalize, dedupe, filter, count — rather than exotic ML. That ratio surprises most people\'s mental image of what pretraining work actually looks like day to day.'
    ]
  },
  quiz: [
    {
      q: 'Why does deduplication matter so much in pretraining data, beyond just saving storage space?',
      options: ['Undeduplicated data lets the model memorize repeated content instead of generalizing, measurably hurting downstream quality and risking verbatim memorization leaks', 'It has no measurable effect on model quality', 'It only matters for reducing training time, not model behavior', 'It is required by tokenizer software to function at all'],
      correct: 0,
      explain: 'Repeated near-duplicate content (boilerplate, mirrored articles, popular quoted passages) skews what the model effectively "sees" most often, encouraging memorization over generalization — a documented, real failure mode.'
    },
    {
      q: 'What did the Chinchilla scaling-law finding establish about model size versus training data?',
      options: ['For a fixed compute budget, model size and training tokens should scale together (roughly 20 tokens per parameter) — many earlier large models were under-trained relative to their size', 'Model size should always be maximized regardless of available data', 'Training data size has no measurable effect on final model quality', 'Compute-optimal training only applies to models under 1 billion parameters'],
      correct: 0,
      explain: 'C ≈ 6ND; the compute-optimal split found D ≈ 20N. GPT-3-era models had too many parameters relative to their training tokens for their compute budget.'
    },
    {
      q: 'What specifically does tensor (model) parallelism split, and what problem does it solve that data parallelism does not?',
      options: ['It splits individual weight matrices/layers across GPUs, solving the case where a single layer is too large to fit in one GPU\'s memory — something data parallelism (which replicates the WHOLE model per GPU) cannot address', 'It splits the training data across GPUs, identical to data parallelism', 'It only applies to the tokenizer, not the model', 'It eliminates the need for gradient computation'],
      correct: 0,
      explain: 'Data parallelism needs the full model to fit on every GPU. Tensor parallelism slices individual matrices across GPUs specifically so oversized layers can exist at all.'
    },
    {
      q: 'Why does bfloat16 avoid the gradient-underflow problem that plain float16 can suffer from?',
      options: ['bfloat16 keeps the same wide exponent range as float32 (trading mantissa precision instead), so small gradient magnitudes don\'t fall outside its representable range the way they can in float16\'s narrower exponent range', 'bfloat16 uses more bits than float32', 'bfloat16 disables backpropagation entirely', 'Float16 has no underflow problem in practice'],
      correct: 0,
      explain: 'fp16\'s narrow exponent range lets small-but-nonzero gradients underflow to zero, requiring loss scaling as a workaround; bf16\'s fp32-matching exponent range avoids this specific failure mode.'
    },
    {
      q: 'Why is a freshly pretrained base model not yet a helpful assistant?',
      options: ['Its only training objective was "predict the statistically plausible next token" over internet text — there is no signal in that objective distinguishing a genuinely helpful answer from any other plausible continuation', 'It has not been trained on enough data to know facts', 'It uses the wrong architecture for conversation', 'It has not yet learned to tokenize text correctly'],
      correct: 0,
      explain: 'Internet text following a question-like pattern includes helpful answers, but also more questions, tangents, and unresolved threads — pretraining alone has no mechanism to prefer the helpful continuation. That gap is what fine-tuning and alignment close.'
    }
  ],
  testFlow: {
    title: 'Test yourself: pretraining at scale',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'Why does deduplication matter so much in pretraining data, beyond just saving storage space?',
        choices: [
          { text: 'Undeduplicated data lets the model memorize repeated content instead of generalizing, measurably hurting downstream quality', to: 'q1_right' },
          { text: 'It has no measurable effect on model quality, only on disk usage', to: 'q1_wrong_none' },
          { text: 'It is required by tokenizer software just to function at all', to: 'q1_wrong_tokenizer' },
        ],
      },
      q1_right: { end: true, correct: true, text: 'Right — repeated near-duplicate content (boilerplate, mirrored articles, popular quoted passages) skews what the model effectively "sees" most often, encouraging memorization over generalization, and can even leak memorized boilerplate verbatim at inference.', next: 'q2' },
      q1_wrong_none: { end: true, correct: false, text: 'It has a real, documented effect on downstream quality, not just storage — undeduplicated data is one of the most consequential, well-documented mistakes in pretraining pipelines.', retry: 'q1' },
      q1_wrong_tokenizer: { end: true, correct: false, text: 'Tokenizers work fine on duplicated text — deduplication is a data-quality decision made upstream of tokenization, not a technical requirement for the tokenizer itself.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'What did the Chinchilla scaling-law finding establish about model size versus training data?',
        choices: [
          { text: 'For a fixed compute budget, model size and training tokens should scale together (roughly 20 tokens per parameter) — many earlier large models were under-trained relative to their size', to: 'q2_right' },
          { text: 'Model size should always be maximized regardless of how much data is available', to: 'q2_wrong_maximize' },
          { text: 'Training data size has no measurable effect on final model quality', to: 'q2_wrong_nodata' },
        ],
      },
      q2_right: { end: true, correct: true, text: 'Exactly — C ≈ 6ND, and the compute-optimal split found D ≈ 20N. GPT-3-era models had too many parameters relative to their training tokens for their compute budget — Atlas\'s ratio finding, in Vegapunk\'s lab.', next: 'q3' },
      q2_wrong_maximize: { end: true, correct: false, text: 'That\'s exactly the mistake Chinchilla identified in earlier models — piling on parameters without proportionally more data wastes compute. Size and data must scale together.', retry: 'q2' },
      q2_wrong_nodata: { end: true, correct: false, text: 'Data size has a major, measurable effect — it\'s one of the two knobs (alongside model size) that the whole scaling-law finding is about balancing correctly.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'Why is a freshly pretrained base model not yet a helpful assistant?',
        choices: [
          { text: 'Its only training objective was "predict the plausible next token" over internet text — nothing in that objective distinguishes a genuinely helpful answer from any other plausible continuation', to: 'q3_right' },
          { text: 'It has not been trained on enough data to know basic facts', to: 'q3_wrong_facts' },
          { text: 'It uses the wrong neural network architecture for holding a conversation', to: 'q3_wrong_arch' },
        ],
      },
      q3_right: { end: true, correct: true, text: 'Right — internet text following a question-like pattern includes helpful answers, but also more questions, tangents, and unresolved threads. Pretraining alone has no mechanism to prefer the helpful continuation — that gap is exactly what fine-tuning and alignment (next two lessons) close.', next: null },
      q3_wrong_facts: { end: true, correct: false, text: 'A base model trained on trillions of tokens typically knows an enormous amount of factual content — the problem isn\'t missing knowledge, it\'s that nothing taught it to prefer a direct helpful answer over any other plausible continuation.', retry: 'q3' },
      q3_wrong_arch: { end: true, correct: false, text: 'The architecture (the exact same causal transformer from MiniGPT) is perfectly capable of conversation — the gap is entirely about training OBJECTIVE, not architecture.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Assuming "bigger model" is always the right lever for better quality — Chinchilla showed that under a fixed compute budget, more training DATA at a smaller model size often wins; size and data must scale together.',
    'Confusing "compute-optimal" (minimizes training compute for a given loss) with "best real-world choice" — a model trained well past the Chinchilla ratio can be the right call when its huge deployment volume makes inference cost dominate the total cost, not training cost.',
    'Treating deduplication as an optional cleanup step rather than a first-order quality lever — undeduplicated data is one of the most well-documented, consequential mistakes in pretraining data pipelines.',
    'Confusing data parallelism (replicate the model, split the batch) with model/tensor parallelism (split the model itself) — they solve different problems and are frequently combined, not interchangeable.',
    'Assuming mixed precision is "free" speed with no care needed — fp16 specifically requires loss scaling to avoid silent gradient underflow; skipping it can produce training that looks stable but is quietly learning from corrupted (zeroed) gradients.',
    'Believing "I understand transformers, so I could pretrain an LLM from scratch" without accounting for the data pipeline and distributed-systems engineering — the architecture is the easy 20%; data curation and distributed infrastructure are most of the real work and cost.'
  ],
  interview: [
    {
      q: 'Explain the Chinchilla scaling-law result and why it changed how the field allocates pretraining compute.',
      a: 'Chinchilla (Hoffmann et al., 2022) studied the relationship between model size N, training tokens D, and compute budget C (approximated as C≈6ND) by training many models at matched compute budgets and different (N,D) splits, then fitting power-law loss curves. The finding: prior large models, notably GPT-3 (175B params, ~300B tokens), had allocated too much of their compute budget to PARAMETERS and too little to DATA — they were under-trained relative to their size. The compute-optimal allocation scales N and D together, at roughly D≈20N tokens per parameter. Practically, this meant a smaller model trained on proportionally more data, at the SAME total compute cost, reliably achieves lower loss than a larger, under-trained model — which shifted the field\'s default pretraining recipes toward smaller-but-more-heavily-trained models after 2022 (visible in the LLaMA family\'s design choices, among others). The important caveat: this result optimizes training compute for a target loss, not inference cost — models intended for massive deployment are often deliberately trained on MORE than the Chinchilla-optimal token count, since a smaller model is cheaper to serve forever, making the extra one-time training cost worth it.'
    },
    {
      q: 'Walk through the three main forms of parallelism used in distributed LLM training and when each is necessary.',
      a: 'Data parallelism: the entire model is replicated on every GPU; each GPU processes a different slice of the current batch independently, and gradients are averaged across all replicas (via all-reduce) before each optimizer step, keeping every copy synchronized. It scales THROUGHPUT (more examples processed per second) but requires the full model to fit in a single GPU\'s memory — it does not help if the model itself is too large. Tensor (model) parallelism addresses that: individual weight matrices are split across GPUs (e.g., a large FFN matrix column-sliced so each GPU computes and stores only a fraction), with a communication step per split layer to recombine partial results — this lets a SINGLE LAYER too large for one GPU\'s memory exist at all, at the cost of frequent, latency-sensitive cross-GPU communication, so it\'s typically confined to GPUs within one fast-interconnected node. Pipeline parallelism splits the model\'s LAYERS/DEPTH across GPUs (GPU 1 holds the first several blocks, GPU 2 the next several, etc.), streaming microbatches through so different GPUs process different microbatches concurrently rather than sitting idle — this handles the case where even a per-node tensor-parallel slice of the model is too large, at the cost of pipeline "bubble" idle time requiring careful microbatch scheduling. Real large-scale training combines all three (3D parallelism): data parallelism across whole-model replica groups, tensor parallelism within a node, pipeline parallelism across nodes.'
    },
    {
      q: 'What exactly does a pretrained base model learn to do, and why does that objective not automatically produce a helpful assistant?',
      a: 'A base model\'s entire training signal is causal language modeling: given a sequence of tokens, predict the next one, trained via teacher-forced cross-entropy across essentially the whole (cleaned, deduplicated, mixed) internet-scale corpus. This objective optimizes for one thing only — "what token is a STATISTICALLY PLAUSIBLE continuation of this prefix" — and internet text is enormously varied in how it continues question-like or instruction-like prompts: sometimes with a direct helpful answer, but just as often with a list of similar questions (FAQ-page patterns), a tangential blog-post digression, or an unresolved forum thread. Pretraining gives the model no mechanism to PREFER the helpful-answer continuation over any of these other statistically-plausible ones, because all of them appeared, with some frequency, somewhere in its training data — "plausible continuation" and "helpful response" are correlated but not identical objectives. This is exactly the gap supervised fine-tuning (next lesson) closes: training on a smaller, curated dataset of (instruction, ideal-response) pairs specifically reshapes which continuations the model prefers, layered on top of the broad knowledge and language fluency pretraining already provides — pretraining builds the capability, fine-tuning and alignment shape the behavior.'
    },
    {
      q: 'A startup wants to pretrain their own domain-specific LLM from scratch rather than fine-tuning an existing open model. What would you push back on, and what questions would you ask first?',
      a: 'Pretraining from scratch is rarely justified compared to starting from a strong open base model (LLaMA-family, or similar) and fine-tuning — worth stating plainly and then explaining why, rather than assuming it. Cost: even a modest, Chinchilla-appropriately-sized model requires trillions of tokens and substantial multi-GPU infrastructure — realistically millions of dollars and a dedicated distributed-systems team, not something most startups can justify against the alternative. Data: does the startup actually have or can they assemble a dataset anywhere near the scale needed to teach an LLM general language competence from zero — usually not; most "domain-specific" needs (legal, medical, internal company knowledge) are actually FINE-TUNING problems (the next lesson\'s SFT/LoRA), where a small, high-quality domain dataset adapts an already-fluent, already-knowledgeable base model, at a tiny fraction of the cost and data requirement. Timeline and risk: pretraining runs take months and can fail expensively partway through (loss spikes, hardware failures) in ways a small fine-tuning run doesn\'t. The right question sequence: what specific behavior or knowledge gap are we actually trying to close (usually answerable with fine-tuning or even prompting/RAG, Part 7), do we have genuinely internet-scale proprietary data that justifies training language competence from scratch (almost never), and have we benchmarked a fine-tuned open model against our requirements FIRST before committing to a pretraining budget (the model-evaluation lesson\'s discipline, applied at the level of "should we even build this").'
    }
  ]
};
