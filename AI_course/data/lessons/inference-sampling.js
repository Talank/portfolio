window.LESSONS = window.LESSONS || {};
window.LESSONS['inference-sampling'] = {
  id: 'inference-sampling',
  title: 'Inference: Sampling, KV Cache, Quantization & Serving',
  category: 'Part 6 — LLM Engineering',
  timeMin: 55,
  summary: 'A trained, aligned model is only half the story — someone has to actually RUN it, fast enough and cheap enough to be useful. This lesson is everything that happens after training stops: how to pick the next token (greedy, temperature, top-k, top-p, beam search), how the KV cache (foreshadowed back in the minigpt-code lesson) actually works, how to shrink a finished model for cheap deployment (quantization), and how production systems serve thousands of simultaneous requests without falling over (batching, PagedAttention).',
  goals: [
    'Compare greedy, temperature, top-k, and top-p (nucleus) sampling, and explain what problem each solves',
    'Explain why beam search, despite finding higher-probability sequences, tends to produce bland output for open-ended generation',
    'Explain the KV cache precisely: what it stores, why it works, and how its memory cost scales',
    'Distinguish training-time quantization (QLoRA) from post-training quantization for serving, and explain why some weights need extra protection',
    'Explain continuous batching and PagedAttention at a conceptual level, and why they matter for serving cost and throughput'
  ],
  concept: [
    {
      h: 'Picking the next token: greedy is not enough',
      p: [
        'The minigpt-code lesson\'s generate() took softmax(logits) and sampled — but "sample from the full distribution" and "always take the top prediction" (greedy decoding, effectively temperature→0) are just the two extremes of a whole family of decoding strategies, and the choice measurably changes output quality and character.',
        '<b>Greedy decoding</b> (always pick argmax) is deterministic and fast, but suffers "text degeneration" on longer generations: once the model commits to a slightly-suboptimal token, every SUBSEQUENT token is chosen to be consistent with that commitment (recall the causal mask — there\'s no going back), and greedy decoding has a well-documented tendency to fall into repetitive loops ("I think that I think that I think that...") because a repeated phrase\'s continuation is often the single highest-probability next token, precisely because it already appeared.',
        '<b>Temperature sampling</b> divides logits by a temperature T before softmax: <code>softmax(logits/T)</code>. T=1 leaves the distribution unchanged; T&lt;1 SHARPENS it (the model behaves more like greedy, more deterministic, more conservative); T&gt;1 FLATTENS it (more randomness, more diverse but less reliable). Mechanically this is exactly the same operation as the self-attention lesson\'s 1/√dk scaling applied to a DIFFERENT set of logits — dividing before softmax always controls how "peaked" the resulting distribution is.',
        '<b>Top-k sampling</b> keeps only the k highest-probability tokens, zeroes everything else, and renormalizes before sampling — this prevents the model from ever sampling from the long, unreliable TAIL of the distribution (thousands of tokens each with a tiny but nonzero probability, most of which would be nonsensical if actually chosen). <b>Top-p (nucleus) sampling</b> improves on a FIXED k: sort tokens by probability descending, and keep the SMALLEST set whose cumulative probability exceeds p (e.g. p=0.9) — when the model is very confident (one token dominates), the nucleus might contain just 1-2 tokens; when the model is genuinely uncertain (a flat distribution over many plausible next words), the nucleus naturally widens to include more options. This adapts to the SHAPE of each individual step\'s distribution, which a fixed k cannot — nucleus sampling has become the more common default for exactly this reason.'
      ]
    },
    {
      h: 'Why beam search backfires for open-ended generation',
      p: [
        '<b>Beam search</b> tracks the top-B partial sequences (by cumulative log-probability) at every step, rather than committing to one token at a time — a systematic search for a high-JOINT-probability full sequence, not a token-by-token gamble. It is the right tool for tasks with a genuinely "correct-ish" target (machine translation, where you want the single best translation, not a creative variety of them) — the seq2seq-attention lesson\'s decoding toolbox, now precisely named.',
        'For OPEN-ENDED generation (chat, story writing, brainstorming), beam search reliably produces noticeably BLAND, repetitive, generic text — a well-documented and slightly counterintuitive finding. The mechanism: natural human text is not, token by token, the maximum-probability continuation at every step — real writing takes locally lower-probability but interesting turns constantly (that IS what makes it interesting). A search that explicitly maximizes joint sequence probability finds the "safest," most generic, most statistically expected continuation at every fork, and generic-and-expected is close to a definition of bland. This is why virtually every modern conversational LLM uses sampling-based decoding (temperature + top-p, typically) rather than beam search for everyday generation, reserving beam-search-like approaches for narrower tasks where "the single best answer" genuinely is the goal.'
      ]
    },
    {
      h: 'The KV cache, precisely',
      p: [
        'The minigpt-code lesson flagged the cost: naive generation reprocesses the entire sequence from scratch at every new token, an O(n²) total cost across a full generation. The <b>KV cache</b> fixes this by exploiting a simple fact — a token\'s KEY and VALUE vectors at every layer depend ONLY on that token\'s own (fixed) embedding and the (fixed, already-trained) Wk/Wv matrices, never on tokens generated afterward. So once token 5\'s K and V are computed at layer 3, they will be IDENTICAL every time they\'d otherwise be recomputed — cache them instead.',
        'Mechanically: maintain, per layer, a growing cache of K and V tensors for every token generated so far. At each new generation step, compute Q, K, V for ONLY the newest token, append its K and V to that layer\'s cache, and compute attention using the new token\'s Q against the FULL cached K/V (old, retrieved instantly, plus the one new entry) — turning each step\'s attention cost from O(current length) back down to O(1) new work (amortized per layer), and total generation cost from O(n²) to O(n).',
        'The cost that buys: MEMORY. Cache size scales as <code>2 (K and V) × n_layers × n_heads × d_head × sequence_length × batch_size × bytes_per_value</code> — it grows LINEARLY with both sequence length and batch size, and for long-context or high-throughput serving this routinely becomes the dominant consumer of GPU memory, not the model weights themselves. Two production mitigations worth knowing by name: <b>multi-query attention (MQA)</b> and <b>grouped-query attention (GQA)</b> — instead of every attention head having its own K/V projections, SHARE one (MQA) or a small group\'s worth (GQA) of K/V heads across multiple query heads, cutting cache size proportionally with a small, usually acceptable, quality cost — LLaMA-2 and most modern serving-optimized models use GQA specifically for this reason.'
      ]
    },
    {
      h: 'Shrinking a FINISHED model: post-training quantization',
      p: [
        'QLoRA (last lesson) quantized the frozen base model DURING fine-tuning, specifically to fit training in limited memory, while the trainable LoRA adapters stayed high-precision. <b>Post-training quantization (PTQ)</b> is a different, narrower job: take a model that is COMPLETELY DONE training (no gradients, no fine-tuning happening at all), and shrink its weights to a lower precision purely to reduce the memory and increase the throughput of SERVING it — a one-time, training-free transformation applied for deployment.',
        'Naive uniform quantization (map the full weight range to evenly-spaced low-bit buckets) works reasonably at 8 bits but degrades noticeably at 4 bits, because a small number of individual weights turn out to matter disproportionately to model quality — DESTROYING their precision hurts far more than an "average" weight\'s precision loss would suggest. Two well-known techniques address this: <b>GPTQ</b> quantizes layer by layer, choosing each quantized weight value to minimize the RECONSTRUCTION ERROR of that layer\'s output (not just each weight in isolation), correcting for how quantization errors in earlier weights affect later ones within the same layer. <b>AWQ (Activation-aware Weight Quantization)</b> takes a different angle: it observes which weights get multiplied by consistently LARGE activation values during a calibration pass (a small sample of real data run through the model) — those weights have outsized influence on the output — and protects exactly that small salient subset at higher precision while aggressively quantizing everything else, based on the finding that protecting roughly 1% of weights preserves most of the quality a full-precision model would have delivered.',
        'This is worth keeping conceptually distinct from QLoRA even though both use "4-bit quantization": QLoRA quantizes a frozen base DURING a training run so a small adapter can be trained cheaply; PTQ (GPTQ/AWQ) quantizes an already-finished model AFTER all training is complete, purely for cheaper/faster inference, with no gradients or trainable parameters involved at all.'
      ]
    },
    {
      h: 'Serving many requests at once: batching and PagedAttention',
      p: [
        'A single request rarely uses a GPU\'s full parallel capacity — the model reads it far faster than the network can deliver more requests, one at a time. <b>Batching</b> processes multiple requests together as one larger matrix operation, dramatically improving GPU utilization and total throughput. NAIVE (static) batching groups a fixed batch of requests and waits for ALL of them to finish before starting a new batch — wasteful, because generation lengths vary wildly (a one-sentence answer versus a long explanation), so most of the batch sits idle waiting for the single slowest request to finish.',
        '<b>Continuous (dynamic) batching</b> — the technique behind most production LLM serving engines (vLLM among the best-known) — operates at the TOKEN level instead: the moment any request in the batch finishes generating, a new waiting request is immediately swapped into its slot, so the GPU is kept continuously busy with a full batch rather than idling for stragglers. This alone is typically a several-fold throughput improvement over naive static batching for realistic, variable-length request traffic.',
        '<b>PagedAttention</b> (vLLM\'s specific contribution) applies an idea borrowed directly from operating-systems virtual memory: instead of reserving one large, contiguous block of GPU memory per request\'s KV cache (which wastes memory to fragmentation and to over-provisioning for a worst-case sequence length that may never be reached), the KV cache is split into fixed-size PAGES that can be allocated non-contiguously and shared — most usefully, when many requests share an identical PROMPT PREFIX (a common system prompt, or multiple sampled completions of the same input), their KV cache pages for that shared prefix can be literally the SAME memory, computed once and referenced by every request that needs it, rather than duplicated. This combination (continuous batching + paged, shareable KV cache memory) is most of what separates a naive from a production-grade LLM serving stack, and is worth naming specifically in any conversation about deploying LLMs at scale.'
      ]
    },
    {
      h: 'Matching decoding strategy to the task',
      p: [
        'Practical, interview-ready summary: tasks wanting a single reliable, reproducible, "correct" answer (factual Q&A, code generation, structured data extraction, math) want LOW temperature or even greedy decoding — sampling variance mostly just introduces a chance of an unnecessary wrong turn. Tasks wanting variety, creativity, or multiple distinct options (brainstorming, creative writing, generating diverse synthetic training examples) want HIGHER temperature and/or top-p sampling, deliberately trading determinism for range. Production APIs expose exactly these knobs (temperature, top_p, sometimes top_k) directly — every parameter in this lesson maps to a real, callable argument in the APIs the using-models-apis lesson (next) will use hands-on.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky finally fixes the rereading problem — and tunes the dial',
      text: 'Months after the Writing Tower first worked, Usopp\'s old complaint finally gets fixed for real: Franky installs a NOTEBOOK inside the tower that jots down, permanently, what it already figured out about every earlier glyph the moment it figures it out — so the next time the tower needs that information, it just reads its own notes instead of re-deriving everything from scratch. Now generating glyph 50 costs about the same as generating glyph 2, instead of ballooning every single step (the KV cache, installed at last). The crew notices the notebook itself takes up real shelf space, growing with every glyph AND with how many inscriptions are being composed at once — Nami calculates it\'s becoming the tower\'s biggest storage cost, bigger than the tower\'s actual brain matter, for long or busy jobs. Meanwhile Robin raises a second, separate question: the dial that picks the next glyph — should it always take its single top guess, or roll dice? For transcribing an EXACT Poneglyph inscription (precision matters, no room for creative guessing), she locks the dial to always take its most confident pick. For inventing a brand-new bedtime story for the crew, she lets the dial wobble — but not wildly; she restricts its randomness to just the handful of most plausible next words, so it never says something totally unhinged, just genuinely varied. She also tries having the tower search for the single best FULL sentence instead of picking word by word — and the result is oddly boring, generic, safe; searching hard for the "most probable whole sentence" turns out to produce exactly the kind of flat, forgettable prose nobody actually wants from a storyteller. Later, wanting to put a small reading tower on every ship in the fleet — not just Vegapunk\'s lab — Franky shrinks a FINISHED, fully-trained tower down to a much smaller footprint, careful to protect the handful of connections that matter most (leaving those at full precision) while aggressively compressing everything else, since shrinking absolutely everything equally turned out to wreck quality disproportionately. Finally, when EVERY ship in the fleet starts querying the one central tower during a crisis, Vegapunk redesigns the queue: instead of waiting for the slowest ship\'s question to finish before starting the next batch, new questions get swapped in the instant any ship\'s question finishes — and for ships asking about the SAME shared briefing, their notebook pages are literally shared rather than each ship getting its own duplicate copy. The tower that once ground to a halt under real fleet-wide demand now serves the whole armada without buckling.'
    },
    sitcom: {
      show: 'Friends',
      title: 'The Trivia Machine, live at the finals',
      text: 'Championship night. The Trivia Machine (well-behaved since last month\'s fix) is painfully slow live on stage — it re-reads the ENTIRE transcript of the show so far before every single answer, and by round three the delay is excruciating. Chandler has the fix mid-show: have it jot down notes on what it already figured out earlier, instead of rereading the whole broadcast every time — instantly faster, because it only has to process the newest question, not everything before it (the KV cache, discovered under real pressure). Monica notices the notebook of notes keeps growing the longer the show runs, and with SEVERAL teams querying simultaneously it becomes the real bottleneck, bigger than the machine itself. Meanwhile, Ross realizes the "randomness dial" needs different settings per round: for the FACTUAL round, he locks it to always give its single most confident answer — no creative guessing allowed. For the "bonus improv joke" round, he lets it wobble, but only among the handful of most plausible jokes, so it doesn\'t blurt something completely off the wall — genuinely varied, not reckless. He also tries having it search for the single "best" whole joke in advance instead of building it word by word live — and it comes out flat and generic every time, the safest possible joke instead of the funniest, so he scraps that approach entirely. Before the finals, wanting every team\'s tablet to run its OWN copy instead of hammering one central machine, they shrink the fully-finished Trivia Machine down small enough to fit on a tablet — protecting the handful of connections that matter most at full detail while compressing the rest hard, since compressing everything equally made it noticeably dumber. And when ALL the teams hit the central machine with questions at once during the live finale, Monica organizes the queue so a new team\'s question gets swapped in the SECOND any other team\'s question finishes, and teams asking overlapping questions share the same cached notes instead of each duplicating the work. The machine that stumbled in round one handles the entire packed finale without a hiccup.'
    },
    why: 'Four fixes, one arc: stop rereading everything by keeping notes on what\'s already known (KV cache); tune how much the "next pick" dial wobbles to match the job — locked for precision work, controlled-random for creative work, and never search for the single "best" whole answer for open-ended tasks, because that reliably produces the blandest possible result (beam search\'s counterintuitive failure); shrink a FINISHED system carefully, protecting the few connections that matter most (post-training quantization); and serve many simultaneous requests by swapping in new work the instant old work finishes, sharing memory across overlapping requests instead of duplicating it (continuous batching + paged shared memory).'
  },
  storyAnim: {
    title: 'From a stalling tower to a fleet-ready one',
    h: 280,
    props: [
      { id: 'reread', emoji: '🔁', label: 'reread everything, every step', x: 12, y: 12 },
      { id: 'notebook', emoji: '📓', label: 'notebook of known glyphs (KV cache)', x: 12, y: 40 },
      { id: 'dial', emoji: '🎛️', label: 'randomness dial', x: 40, y: 12 },
      { id: 'locked', emoji: '🔒', label: 'locked: precision work', x: 40, y: 40 },
      { id: 'wobble', emoji: '🎲', label: 'controlled wobble: creative work', x: 62, y: 40 },
      { id: 'beam', emoji: '😐', label: 'search for "best full sentence": bland', x: 40, y: 66 },
      { id: 'shrink', emoji: '📦', label: 'shrink finished tower for every ship', x: 80, y: 12 },
      { id: 'queue', emoji: '🚦', label: 'shared queue, shared notes, fleet-wide', x: 80, y: 40 }
    ],
    actors: [
      { id: 'franky', emoji: '🤖', label: 'Franky', x: 12, y: 26 }
    ],
    steps: [
      { c: 'Old problem: every new glyph means rereading the entire inscription from scratch. O(n²) over a full generation.', p: { reread: 'bad' } },
      { c: 'Fix: a notebook records what\'s already known about each earlier glyph — only the newest glyph needs processing now.', p: { notebook: 'good' }, a: { franky: [12, 35] } },
      { c: 'For exact transcription: lock the dial to its single most confident pick every time.', p: { dial: 'lit', locked: 'good' } },
      { c: 'For storytelling: let the dial wobble, but only among the most plausible options.', p: { wobble: 'good' } },
      { c: 'Searching for the single "best" whole sentence instead of picking step by step: technically higher-probability, but reliably the most boring possible output.', p: { beam: 'bad' } },
      { c: 'To deploy on every ship: shrink the FINISHED tower, protecting the handful of connections that matter most.', p: { shrink: 'good' } },
      { c: 'Fleet-wide demand: swap in new questions the instant old ones finish, and share notebook pages across overlapping requests instead of duplicating them.', p: { queue: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'The mechanism, step by step: from a stalling tower to a fleet-ready one',
    intro: 'Click any box to jump straight there, or press Play and just listen.',
    stages: [
      {
        label: 'KV cache',
        nodes: [
          { id: 'notebook', text: 'Notebook of known glyphs\ncache K/V once, reuse — O(n²) → O(n)' },
        ],
      },
      {
        label: 'Pick the next token',
        nodes: [
          { id: 'locked', text: 'T→0 (locked): precision work\nalways the single most confident pick' },
          { id: 'wobble', text: 'T=0.5–2.0, top-p: creative work\ncontrolled wobble among plausible options' },
        ],
      },
      {
        label: 'Avoid the beam trap',
        nodes: [
          { id: 'beam', text: 'Search for "best" full sentence\ntechnically higher-probability, reliably bland' },
        ],
      },
      {
        label: 'Shrink + serve',
        nodes: [
          { id: 'shrink', text: 'Quantize the FINISHED model\nprotect the ~1% high-leverage weights' },
          { id: 'queue', text: 'Continuous batching + paged KV cache\nswap in new work instantly, share overlapping memory' },
        ],
      },
    ],
    steps: [
      { active: ['notebook'], note: 'A token\'s key and value vectors never change once computed — cache them per layer instead of recomputing the whole sequence at every step. Generating token 50 now costs about the same as token 2.' },
      { active: ['locked'], note: 'For exact, reliable output (transcription, code, math): sharpen the distribution toward greedy — softmax(logits/T) with T near 0, always the top pick.' },
      { active: ['wobble'], note: 'For creative or varied output: raise T and/or apply top-p filtering — enough randomness to be genuinely different, bounded to the handful of plausible next tokens so it never goes unhinged.' },
      { active: ['beam'], note: 'Searching explicitly for the single highest-JOINT-probability full sequence (beam search) sounds better but isn\'t: it finds the safest, most generic continuation at every fork — reliably the blandest possible output for open-ended generation.' },
      { active: ['shrink', 'queue'], note: 'To deploy at scale: quantize the already-finished model down (protecting the small subset of weights that matter most), and serve with continuous batching plus a paged, shareable KV cache — new requests swap in instantly, overlapping prefixes share memory instead of duplicating it.' },
    ],
  },
  tech: [
    {
      q: 'Precisely compare top-k and top-p (nucleus) sampling — mechanics and why nucleus generally adapts better.',
      a: 'Top-k: sort the vocabulary\'s probabilities descending, keep only the top k tokens, zero out (mask) the rest, renormalize the remaining k probabilities to sum to 1, then sample. The set size is FIXED at k regardless of what the actual distribution looks like at this particular step. Top-p (nucleus): sort descending, compute the running cumulative probability, and keep the SMALLEST prefix of tokens whose cumulative probability first exceeds p (e.g. 0.9), zero everything else, renormalize, sample. The set size VARIES per step depending on how peaked or flat the model\'s distribution is: when the model is very confident (one or two tokens hold almost all probability mass), the nucleus might contain just 1-2 tokens — nearly greedy; when the model is genuinely uncertain across many plausible continuations (a flatter distribution), the nucleus naturally widens to include more candidates. Top-k with a fixed k can be too restrictive in the confident case (arbitrarily excluding a clearly-second-best token if k happens to cut it off) or too permissive in the uncertain case (including tokens far out in a flat tail that a smaller, better-chosen nucleus would have excluded) — nucleus sampling\'s adaptivity to the actual shape of each step\'s distribution is the specific advantage that made it the more common modern default, often combined with a modest temperature and sometimes a small top-k as a safety floor.'
    },
    {
      q: 'Beam search finds sequences with higher joint probability than sampling, yet produces blander text for open-ended generation. Explain the mechanism precisely.',
      a: 'Beam search explicitly performs an approximate search for the sequence maximizing Πₜ p(tokenₜ | tokens&lt;ₜ) — the single highest-JOINT-probability full sequence findable within its beam width. But natural, interesting human text is demonstrably NOT, token by token, always the maximum-probability continuation — human writers constantly choose locally lower-probability but more specific, surprising, or vivid words over the safest, most generic, most statistically-expected one, and that specificity/surprise is a meaningful part of what makes text feel genuinely written rather than auto-completed. A search procedure that explicitly maximizes joint probability will, at every fork, prefer the SAFEST available continuation (the one most consistent with everything already seen, the "path of least surprise"), and repeatedly choosing the safest option at every step compounds into text that reads as generic, repetitive, or cliché — this has been directly observed and measured in NLG research (comparing human-written text\'s token-level probability profile against beam search output: human text visits substantially lower-probability tokens far more often than beam search ever would). This is why beam search remains genuinely useful for tasks with a comparatively narrow, well-defined "correct" target (translation, where fidelity to source meaning matters more than stylistic variety) but is avoided for open-ended chat/creative generation in favor of sampling-based decoding.'
    },
    {
      q: 'Derive the KV cache\'s memory footprint and explain what grouped-query attention (GQA) changes about it.',
      a: 'Per layer, the cache stores a Key tensor and a Value tensor, each of shape [batch_size, n_heads, sequence_length, d_head] — so total cache size (in values, before multiplying by bytes-per-value) is 2 (K and V) × n_layers × batch_size × n_heads × sequence_length × d_head. This is LINEAR in both sequence_length and batch_size, which is exactly why long-context, high-throughput serving is memory-dominated by the KV cache rather than by the (fixed-size, sequence-independent) model weights — for a large model serving long contexts at meaningful batch sizes, KV cache memory can exceed the model weights\' own footprint several times over. Standard multi-head attention gives every one of n_heads a fully separate K and V projection, so n_heads appears as a direct multiplier in cache size. Multi-query attention (MQA) uses just ONE shared K/V head across all query heads — cutting that factor from n_heads to 1, a large reduction, at some quality cost from the reduced representational diversity in the cached keys/values. Grouped-query attention (GQA) is the practical middle ground: split the n_heads query heads into G groups, and share one K/V head PER GROUP (G≪n_heads) — cache size scales with G instead of n_heads, capturing most of MQA\'s memory savings while preserving noticeably more quality than the single-shared-head extreme, which is why GQA (not full MQA) is the choice most modern production models (LLaMA-2/3 among them) actually ship with.'
    },
    {
      q: 'Distinguish QLoRA\'s quantization from post-training quantization (GPTQ/AWQ), and explain why AWQ specifically protects a subset of weights.',
      a: 'QLoRA quantizes the FROZEN base model\'s weights to 4-bit DURING an active fine-tuning run, specifically to shrink memory enough that a LoRA adapter can be trained on top of an otherwise-too-large model — it is a training-time technique whose purpose is enabling gradient-based learning to happen at all within a limited memory budget; the quantized weights are read-only throughout, and the trainable adapter matrices stay in higher precision. Post-training quantization (GPTQ, AWQ) is applied to a model that has FINISHED all training entirely — no gradients, no fine-tuning, no adapters — purely to shrink the model\'s memory footprint and increase inference throughput for SERVING; it is a one-time, training-free transformation of a completed artifact. AWQ specifically protects a small subset (empirically often around 1%) of weights at higher precision because a brief CALIBRATION pass (running a small sample of representative data through the model) reveals that certain weights are consistently multiplied by unusually LARGE activation values — meaning small quantization errors in those specific weights get amplified disproportionately in the layer\'s output, while the same-size error in a "typical" weight (multiplied by small, unremarkable activations) barely matters. Protecting exactly the weights identified as high-leverage by this activation-aware analysis (rather than treating all weights as equally important, which naive uniform quantization implicitly does) preserves most of a full-precision model\'s quality even at aggressive 4-bit compression for everything else.'
    }
  ],
  code: {
    title: 'Decoding strategies in numpy: greedy, temperature, top-k, top-p',
    intro: 'Every decoding knob from the lesson, on one toy logit vector — this is exactly what sits between a model\'s raw logits and the token it actually emits.',
    code: `import numpy as np

def softmax(z):
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()

logits = np.array([4.0, 3.5, 2.0, 1.0, 0.5, -1.0, -2.0])   # 7-token toy vocabulary
tokens = ["the", "a", "this", "some", "one", "an", "any"]

# greedy: always the top logit
greedy_choice = tokens[np.argmax(logits)]
print("greedy:", greedy_choice)

# temperature: T<1 sharpens, T>1 flattens
for T in [0.5, 1.0, 2.0]:
    probs = softmax(logits / T)
    print(f"T={T}: top prob = {probs.max():.3f}")   # decreases as T grows -- flatter distribution

# top-k: zero everything outside the top k, renormalize
def top_k_filter(probs, k):
    idx = np.argsort(probs)[::-1]
    kept = set(idx[:k])
    filtered = np.array([p if i in kept else 0.0 for i, p in enumerate(probs)])
    return filtered / filtered.sum()

probs = softmax(logits)
print("top-3:", top_k_filter(probs, 3).round(3))

# top-p (nucleus): keep the smallest prefix with cumulative prob >= p
def top_p_filter(probs, p):
    idx = np.argsort(probs)[::-1]
    sorted_probs = probs[idx]
    cumulative = np.cumsum(sorted_probs)
    cutoff = np.searchsorted(cumulative, p) + 1        # smallest prefix exceeding p
    kept = set(idx[:cutoff])
    filtered = np.array([pr if i in kept else 0.0 for i, pr in enumerate(probs)])
    return filtered / filtered.sum()

print("top-p=0.8:", top_p_filter(probs, 0.8).round(3))`,
    notes: [
      'The temperature loop is the whole "sharpen vs flatten" idea made visible: top_prob shrinks toward uniform (1/7 ≈ 0.14) as T grows, and approaches 1.0 (fully deterministic) as T shrinks toward 0.',
      'top_k_filter and top_p_filter both end in the same renormalize step (filtered / filtered.sum()) — masking out disallowed tokens then renormalizing so the remaining probabilities sum back to 1 is the shared pattern behind every truncation-based sampling method.',
      'np.searchsorted(cumulative, p) finds the insertion point for p in the sorted cumulative array — exactly "how many top tokens until cumulative probability first reaches p," the nucleus boundary.',
      'In a real serving stack, this whole block runs on EVERY generated token, on GPU, integrated with the KV cache — conceptually unchanged from this numpy sketch, just executed at production speed and scale.'
    ]
  },
  lab: {
    title: 'Implement temperature scaling, top-k, and top-p filtering',
    prompt: 'Pure Python, fully runnable. Implement (1) <code>softmax(logits)</code>; (2) <code>temperature_scale(logits, T)</code> — divide every logit by T before returning (softmax is applied separately); (3) <code>top_k_filter(probs, k)</code> — zero every probability outside the top k, renormalize the rest to sum to 1; (4) <code>top_p_filter(probs, p)</code> — sort descending, keep the smallest prefix whose cumulative probability is ≥ p, zero the rest, renormalize.',
    starter: `import math

def softmax(logits):
    ...

def temperature_scale(logits, T):
    # divide every logit by T
    ...

def top_k_filter(probs, k):
    # keep only the top k probabilities (by value), zero the rest, renormalize to sum 1
    ...

def top_p_filter(probs, p):
    # sort descending; keep smallest prefix with cumulative sum >= p; zero rest; renormalize
    ...`,
    checks: [
      { re: 'def\\s+softmax\\s*\\(', must: true, hint: 'Define softmax(logits) with the max-subtraction stability trick.', pass: 'softmax() defined' },
      { re: 'def\\s+temperature_scale\\s*\\(', must: true, hint: 'Define temperature_scale(logits, T) dividing each logit by T.', pass: 'temperature_scale() defined' },
      { re: 'def\\s+top_k_filter\\s*\\(', must: true, hint: 'Define top_k_filter(probs, k).', pass: 'top_k_filter() defined' },
      { re: 'def\\s+top_p_filter\\s*\\(', must: true, hint: 'Define top_p_filter(probs, p) using cumulative probability.', pass: 'top_p_filter() defined' },
      { re: 'sort|sorted', must: true, hint: 'Both top_k_filter and top_p_filter need the probabilities sorted by value to find the top candidates.', pass: 'sorting present' }
    ],
    tests: `# softmax basics
probs = softmax([1.0, 2.0, 3.0])
assert abs(sum(probs) - 1.0) < 1e-9

# temperature: lower T sharpens (higher max prob after softmax), higher T flattens
logits = [3.0, 1.0, 0.5, 0.2, 0.1]
sharp = softmax(temperature_scale(logits, 0.5))
flat = softmax(temperature_scale(logits, 2.0))
neutral = softmax(temperature_scale(logits, 1.0))
assert max(sharp) > max(neutral) > max(flat), "lower T should sharpen, higher T should flatten"

# top_k_filter: exactly k nonzero entries, sums to 1
probs2 = softmax([3.0, 2.5, 1.0, 0.5, 0.1])
filtered_k = top_k_filter(probs2, k=2)
nonzero = [p for p in filtered_k if p > 1e-9]
assert len(nonzero) == 2, f"expected exactly 2 nonzero entries, got {len(nonzero)}"
assert abs(sum(filtered_k) - 1.0) < 1e-9

# top_p_filter: keeps the smallest prefix covering >= p cumulative probability
probs3 = [0.5, 0.3, 0.1, 0.06, 0.04]     # already sorted descending, sums to 1
filtered_p = top_p_filter(probs3, p=0.75)
nonzero_p = [round(x, 6) for x in filtered_p if x > 1e-9]
assert len(nonzero_p) == 2, f"0.5+0.3=0.8 >= 0.75 with just the top 2 -- expected 2 nonzero, got {len(nonzero_p)}"
assert abs(sum(filtered_p) - 1.0) < 1e-9

# a very confident distribution -> top_p keeps very few tokens even with a high p
probs4 = [0.97, 0.01, 0.01, 0.005, 0.005]
filtered_p2 = top_p_filter(probs4, p=0.9)
assert sum(1 for x in filtered_p2 if x > 1e-9) == 1, "one dominant token should satisfy p=0.9 alone"
print("Temperature, top-k, top-p -- the exact knobs behind every LLM API's sampling parameters.")`,
    runnable: true,
    solution: `import math

def softmax(logits):
    m = max(logits)
    es = [math.exp(x - m) for x in logits]
    s = sum(es)
    return [e / s for e in es]

def temperature_scale(logits, T):
    return [x / T for x in logits]

def top_k_filter(probs, k):
    order = sorted(range(len(probs)), key=lambda i: probs[i], reverse=True)
    kept = set(order[:k])
    filtered = [p if i in kept else 0.0 for i, p in enumerate(probs)]
    total = sum(filtered)
    return [p / total for p in filtered]

def top_p_filter(probs, p):
    order = sorted(range(len(probs)), key=lambda i: probs[i], reverse=True)
    cumulative = 0.0
    kept = set()
    for i in order:
        kept.add(i)
        cumulative += probs[i]
        if cumulative >= p:
            break
    filtered = [pr if i in kept else 0.0 for i, pr in enumerate(probs)]
    total = sum(filtered)
    return [pr / total for pr in filtered]`,
    notes: [
      'The adaptivity test (probs4) is the whole point of nucleus sampling made concrete: a confident distribution needs only ONE token to satisfy even a demanding p=0.9, while a flatter distribution would naturally keep more — top_k with a fixed k cannot do this.',
      'Every one of these functions ends by renormalizing (dividing by the new sum) — after zeroing out disallowed tokens, the remaining probabilities no longer sum to 1, and sampling requires a valid distribution.',
      'In production these compose: typically temperature first, then top-k or top-p filtering on the result, THEN sample — exactly mirroring real API parameters like temperature, top_p, and top_k that most LLM providers expose directly.'
    ]
  },
  quiz: [
    {
      q: 'What is the main failure mode of greedy decoding on longer generations?',
      options: ['Text degeneration — repetitive loops, since a repeated phrase\'s continuation is often the highest-probability next token precisely because it already appeared', 'It runs too slowly to be practical', 'It cannot generate more than one token total', 'It requires a KV cache to function at all'],
      correct: 0,
      explain: 'Once committed to a slightly-suboptimal token (no backtracking, thanks to the causal mask), greedy decoding tends to fall into repetitive loops, a well-documented degeneration pattern.'
    },
    {
      q: 'What makes top-p (nucleus) sampling adapt better to different situations than a fixed top-k?',
      options: ['The kept token set size varies with how peaked or flat the actual distribution is at each step, rather than being a fixed count regardless of confidence', 'Top-p is always faster to compute than top-k', 'Top-p never allows more than one token to be sampled', 'Top-p requires no sorting, unlike top-k'],
      correct: 0,
      explain: 'A confident step naturally yields a small nucleus; an uncertain step yields a larger one — the cutoff adapts to the distribution\'s actual shape, which a fixed k cannot.'
    },
    {
      q: 'Why does beam search tend to produce blander text than sampling for open-ended generation, despite finding higher joint-probability sequences?',
      options: ['Real human text is not, token by token, always the maximum-probability continuation — a search that explicitly maximizes joint sequence probability finds the safest, most generic continuation at every fork', 'Beam search cannot process more than a few tokens total', 'Beam search always produces syntactically invalid text', 'Beam search is mathematically identical to greedy decoding'],
      correct: 0,
      explain: 'Interesting writing regularly takes locally lower-probability turns; maximizing joint probability systematically avoids exactly those turns, compounding into generic output.'
    },
    {
      q: 'Why does KV cache memory grow specifically with sequence length and batch size?',
      options: ['The cache stores one Key and Value entry per token per layer per head per sequence in the batch — more tokens generated or more concurrent sequences means proportionally more stored entries', 'The cache size is fixed regardless of how many tokens are generated', 'KV cache size depends only on model depth, not sequence length', 'The cache only stores information for the very first token'],
      correct: 0,
      explain: 'Cache size ≈ 2 × n_layers × batch_size × n_heads × sequence_length × d_head — linear in both sequence length and batch size, which is why it dominates memory at long context or high concurrency.'
    },
    {
      q: 'What is the key difference between QLoRA\'s quantization and post-training quantization (GPTQ/AWQ)?',
      options: ['QLoRA quantizes a frozen base model DURING an active fine-tuning run to fit training in limited memory; PTQ quantizes an already-fully-trained model AFTER training, purely for cheaper serving, with no training involved at all', 'QLoRA and PTQ are the same technique with different names', 'PTQ can only be applied to models under 1 billion parameters', 'QLoRA quantizes trainable parameters; PTQ never quantizes any weights'],
      correct: 0,
      explain: 'QLoRA is a training-time technique enabling adapter training on limited hardware; GPTQ/AWQ are training-free, one-time transformations of a finished model for deployment.'
    }
  ],
  testFlow: {
    title: 'Test yourself: sampling, KV cache & serving',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'What is the main failure mode of greedy decoding on longer generations?',
        choices: [
          { text: 'Text degeneration — repetitive loops, since a repeated phrase\'s continuation is often the highest-probability next token precisely because it already appeared', to: 'q1_right' },
          { text: 'It runs too slowly to be practical at any scale', to: 'q1_wrong_slow' },
          { text: 'It cannot generate more than a single token in total', to: 'q1_wrong_onetoken' },
        ],
      },
      q1_right: { end: true, correct: true, text: 'Right — once committed to a slightly-suboptimal token (no backtracking, thanks to the causal mask), greedy decoding tends to fall into repetitive loops like "I think that I think that...", a well-documented degeneration pattern.', next: 'q2' },
      q1_wrong_slow: { end: true, correct: false, text: 'Greedy decoding is actually the FASTEST decoding strategy (no search, no sampling overhead) — its problem is output quality on long generations, not speed.', retry: 'q1' },
      q1_wrong_onetoken: { end: true, correct: false, text: 'Greedy decoding generates a full sequence, one token at a time, just like any other strategy — the issue is what kind of sequence it tends to produce over many steps, not a length limitation.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'What makes top-p (nucleus) sampling adapt better to different situations than a fixed top-k?',
        choices: [
          { text: 'The kept token set size varies with how peaked or flat the actual distribution is at each step, rather than being a fixed count regardless of confidence', to: 'q2_right' },
          { text: 'Top-p is always computationally faster to run than top-k', to: 'q2_wrong_speed' },
          { text: 'Top-p never allows more than one token to ever be sampled', to: 'q2_wrong_one' },
        ],
      },
      q2_right: { end: true, correct: true, text: 'Exactly — a confident step (one token dominates) naturally yields a small nucleus; an uncertain, flat step yields a larger one. The cutoff adapts to the distribution\'s actual shape, which a fixed k cannot do.', next: 'q3' },
      q2_wrong_speed: { end: true, correct: false, text: 'Both require a sort over probabilities — there\'s no inherent speed advantage for top-p. The real advantage is adaptivity to each step\'s distribution shape, not raw computation speed.', retry: 'q2' },
      q2_wrong_one: { end: true, correct: false, text: 'Top-p can and often does keep several tokens (whenever the distribution is flatter) — it can also keep just one when the model is very confident. The set size varies; it isn\'t fixed at one.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'Why does beam search tend to produce blander text than sampling for open-ended generation, despite finding higher joint-probability sequences?',
        choices: [
          { text: 'Real human text is not, token by token, always the maximum-probability continuation — maximizing joint sequence probability finds the safest, most generic continuation at every fork', to: 'q3_right' },
          { text: 'Beam search is technically incapable of processing more than a few tokens total', to: 'q3_wrong_length' },
          { text: 'Beam search is mathematically identical to greedy decoding, just renamed', to: 'q3_wrong_identical' },
        ],
      },
      q3_right: { end: true, correct: true, text: 'Right — interesting writing regularly takes locally lower-probability turns; explicitly maximizing joint probability systematically avoids exactly those turns, compounding into generic, forgettable output.', next: null },
      q3_wrong_length: { end: true, correct: false, text: 'Beam search handles arbitrarily long sequences fine (with a beam width tracking top-B candidates throughout) — length isn\'t the limiting factor behind its blandness.', retry: 'q3' },
      q3_wrong_identical: { end: true, correct: false, text: 'They\'re related but distinct: greedy always takes the single best NEXT token, while beam search tracks multiple candidate full SEQUENCES simultaneously, searching for the best overall joint probability — not the same algorithm.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Using greedy decoding by default for open-ended or creative tasks — it reliably produces repetitive, degenerate text on longer generations; reserve it (or very low temperature) for tasks that genuinely want a single deterministic best answer.',
    'Using beam search for chat or creative generation because it "finds the most probable sequence" — that\'s exactly why it produces bland output for these tasks; beam search is the right tool for translation-like tasks, not open-ended ones.',
    'Forgetting that KV cache memory scales with BOTH sequence length and batch size — a system that works fine in testing with short prompts and low concurrency can hit an out-of-memory wall in production with long contexts and many simultaneous users.',
    'Assuming quantization is "free" precision loss with no quality cost — naive uniform quantization at aggressive bit-widths (4-bit and below) can meaningfully degrade quality unless a calibration-aware technique like AWQ or GPTQ specifically protects high-leverage weights.',
    'Confusing training-time quantization (QLoRA, enables fine-tuning under memory constraints) with inference-time/post-training quantization (GPTQ/AWQ, shrinks a finished model for serving) — they solve different problems at different pipeline stages and are not interchangeable steps.',
    'Building a serving system with static/naive batching and being surprised by poor throughput under real, variable-length traffic — continuous batching is not an optional optimization at meaningful request volume, it is close to a requirement for competitive cost-per-token.'
  ],
  interview: [
    {
      q: 'You need to choose a decoding strategy for two different products: a code-generation assistant and a creative-writing brainstorming tool. Walk through your choices and why.',
      a: 'Code generation wants low temperature (often near-greedy, e.g. T=0.2 or lower) with little to no top-p widening: code has a comparatively narrow space of CORRECT continuations at each point (syntax rules, variable names already in scope, the specific API being used), and sampling variance mostly just introduces a chance of picking a subtly wrong token that then compounds through the rest of the causally-generated sequence — a wrong token early in a function is far more costly than an equally "creative" word choice in a story. Determinism and reliability dominate; occasional identical outputs across requests are a non-issue, even a feature (reproducibility). Creative brainstorming wants meaningfully higher temperature (e.g. 0.8-1.0) combined with top-p sampling (e.g. p=0.9) to actively encourage variety and unexpected but still plausible directions — the entire value of the tool is generating options a human wouldn\'t have immediately thought of themselves, which requires deliberately NOT always taking the single most probable, safest continuation. I\'d also actively avoid beam search for both, but for different reasons: for code, beam search doesn\'t align well with "the correct next token given exact syntax/logic constraints" (it\'s optimizing joint probability, not correctness); for brainstorming, beam search\'s well-documented tendency toward generic, bland output directly undermines the product\'s purpose.'
    },
    {
      q: 'Explain the KV cache mechanism precisely, including why it produces IDENTICAL outputs to the uncached version, not just faster ones.',
      a: 'At generation step t, computing attention for the newest token requires that token\'s Query vector against the Keys and Values of ALL tokens 1..t (itself included, under the causal mask). The keys and values for tokens 1..t-1 are functions purely of those tokens\' own fixed embeddings and the model\'s fixed, already-trained Wk/Wv weight matrices — nothing about token t\'s existence changes what token 3\'s key or value vector IS. So computing K/V for tokens 1..t-1 at generation step t produces bit-for-bit the same result as computing them at any earlier step where those tokens were already present — recomputation is pure, deterministic, wasted duplicate work, not new information. The KV cache exploits this by computing each token\'s K and V exactly ONCE, the first time it appears, storing them, and on every subsequent step reusing the cached values while only computing K, V (and Q) for the genuinely new token. Because the cached values are mathematically identical to what fresh recomputation would have produced, the cached and uncached generation paths compute EXACTLY the same attention outputs at every step — the KV cache is a pure performance optimization with zero effect on the model\'s actual output distribution, not an approximation.'
    },
    {
      q: 'Design the serving architecture for an LLM API expecting variable, bursty traffic — what would you specify, and why?',
      a: 'Core requirements to design against: variable request lengths (some users send one-line prompts, others send long documents), variable expected output lengths (short factual answers versus long-form generation), and bursty concurrency (traffic spikes rather than a steady, predictable rate) — a naive single-request-at-a-time or static-batch design fails on all three. Specify: (1) Continuous/dynamic batching at the serving layer — process requests token-by-token as a shared batch, immediately swapping in newly-arrived requests into any slot freed by a completed request, rather than waiting for a fixed batch to fully finish; this is close to mandatory for competitive throughput under bursty, variable-length traffic (vLLM or a similar continuous-batching-capable engine, rather than a naive per-request inference loop). (2) A paged/shareable KV cache (PagedAttention or equivalent) to avoid both memory fragmentation from over-provisioning worst-case sequence lengths per request, and to exploit shared-prefix reuse if the API serves many requests sharing a common system prompt. (3) Decide on quantization for the deployed model (GPTQ/AWQ at 4-8 bit, chosen based on measured quality-vs-cost tradeoffs on the actual task, not assumed) — smaller effective model footprint directly increases how many concurrent requests fit in GPU memory. (4) Autoscaling policy tied to queue depth/latency SLOs rather than raw request COUNT, since request cost varies enormously by input/output length — a naive "scale on request count" metric would under-provision for a burst of long-context requests and over-provision for a burst of short ones. (5) Decoding-parameter validation at the API boundary (reasonable bounds on temperature, top_p, max_tokens) to prevent a misconfigured client from monopolizing capacity with pathologically long or expensive generations.'
    },
    {
      q: 'A team observes their deployed 4-bit quantized model performs noticeably worse than the full-precision version on a narrow set of tasks, but fine on most others. How would you investigate?',
      a: 'This pattern — broad quality roughly preserved, but a specific narrow subset notably worse — is a strong signature of quantization disproportionately damaging a small number of high-leverage weights relevant to THOSE specific tasks, rather than a uniform quality loss across everything (which naive uniform quantization would more evenly cause). Investigation: (1) Confirm the quantization method used — if it\'s naive uniform PTQ rather than an activation-aware method like AWQ or an error-minimizing method like GPTQ, that\'s the first, most likely culprit, and re-quantizing with a calibration-aware technique using data representative of the AFFECTED tasks specifically (not just generic calibration data) is the natural first fix, since AWQ\'s salient-weight protection is only as good as its calibration sample\'s relevance to real usage. (2) Check whether the affected tasks share something structurally (e.g., they all require precise numeric reasoning, or they all rely on a narrow, specific vocabulary/format) — if quantization calibration data didn\'t include examples resembling this pattern, the "salient weight" detection may have missed weights that matter specifically for this task family even though they\'re not broadly important. (3) Run a controlled comparison at a HIGHER bit-width (8-bit instead of 4-bit) on just the affected task subset — if 8-bit closes most of the gap, that\'s strong evidence this specific task family is unusually sensitive to precision and may need to stay at a higher bit-width even if the rest of the model quantizes fine at 4-bit (mixed-precision deployment, quantizing different parts differently, is a legitimate response here). (4) Treat this as exactly the kind of gap the model-evaluation lesson\'s discipline exists for — quantify the degradation on a proper held-out eval set for the affected tasks specifically, rather than deploying (or reverting) based on anecdotal impressions.'
    }
  ]
};
