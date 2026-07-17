window.LESSONS = window.LESSONS || {};
window.LESSONS['anatomy-of-an-llm-app'] = {
  id: 'anatomy-of-an-llm-app',
  title: 'Anatomy of an LLM App: Models, Orchestration & Why Open Source',
  category: 'Part 0 — The Product & the Plan',
  timeMin: 35,
  summary: 'Every LLM application — DenDen Studio included — is the same four-layer cake: hardware at the bottom, model runtimes on top of it, an orchestration layer that is 90% ordinary software engineering, and the product surface the user touches. This lesson names the layers, introduces the two ways you will actually run open models (Ollama for convenience, Hugging Face transformers for control), and gives you the triangle you will trade against for the whole course: quality, latency, and VRAM — pick two.',
  goals: [
    'Name the four layers of an LLM app (hardware, runtime, orchestration, product) and place any given piece of DenDen Studio in the right layer',
    'Explain what Ollama actually is (a local model server managing quantized GGUF models behind an HTTP API) and when it beats using Hugging Face transformers directly — and vice versa',
    'Use the quality-latency-VRAM triangle to reason about model choice before downloading anything',
    'Explain why most of an LLM app is ordinary software (queues, caches, validation) and why that is good news',
    'Distinguish "open weights" from genuinely open licenses, and know to check a model card\'s license before building on it'
  ],
  concept: [
    {
      h: 'The four-layer cake every LLM app is made of',
      p: [
        'Bottom layer: <b>hardware</b> — your GPU (or Apple-silicon unified memory, or plain CPU), whose VRAM ceiling silently dictates half your architecture. Second layer: <b>model runtimes</b> — the software that loads weights and turns inputs into outputs: Ollama or llama.cpp serving a quantized LLM, Python processes running Whisper, XTTS, or a talking-head model via <code>transformers</code>/PyTorch. Third layer: <b>orchestration</b> — YOUR code: the pipeline planner from last lesson, job queues, caching, validation of LLM output, retries, ffmpeg. Top layer: <b>product</b> — the upload forms, the preview player, the drag-to-fix canvas, the progress bar.',
        'The distribution of effort surprises people: the models are the layer you write the LEAST code for. You do not train them; you barely even configure them. The orchestration layer is where an LLM-app engineer lives — and it is ordinary software engineering with two twists: one component (the LLM) returns probabilistic text instead of deterministic values, and several components (the media models) take seconds-to-minutes and gigabytes to run. Twist one is handled by constrained output and validation (Part 1); twist two by queues and caching (Part 5). Neither twist is magic.'
      ]
    },
    {
      h: 'Ollama vs Hugging Face transformers: your two hands',
      p: [
        '<b>Ollama</b> is a local model server. <code>ollama pull llama3.1:8b</code> downloads a quantized GGUF build of the model; <code>ollama serve</code> (usually already running) exposes it at <code>http://localhost:11434</code> with a clean HTTP API for chat, streaming, and structured output. It handles model loading/unloading, keeps the model resident between requests, and runs surprisingly well on CPU and Apple silicon. For the LLM-director role in DenDen Studio — request in, JSON plan out — Ollama is the right tool almost every time: zero Python entanglement, language-agnostic HTTP, models managed like packages.',
        '<b>Hugging Face</b> is the model registry and the <code>transformers</code>/<code>diffusers</code> Python ecosystem. This is where the MEDIA models live — Whisper checkpoints, XTTS, SadTalker-lineage models, AnimateDiff — because those need Python-level control: custom preprocessing, access to intermediate tensors (remember, editing features feed on intermediates), and pipelines Ollama was never designed to serve. Rule of thumb for this course: <b>text in, text out → Ollama; anything touching audio, images, or video → Hugging Face + Python</b>. Real apps use both at once, and DenDen Studio will.'
      ]
    },
    {
      h: 'The triangle: quality, latency, VRAM — pick two',
      p: [
        'Every model decision in this course is the same triangle. Bigger models answer better and follow instructions more reliably (quality), but take longer per token (latency) and need more memory (VRAM). Quantization — storing weights in 4 or 5 bits instead of 16 — buys back memory and speed at a small quality cost, which is why Ollama defaults to quantized builds; Part 5 covers exactly what is lost. As orientation: an 8B-parameter LLM at 4-bit lives comfortably in about 5–6 GB and is a genuinely capable director; a 70B model wants ~40 GB and is out of reach for most single consumer GPUs.',
        'The media models have their own footprints (Whisper-small is light; talking-head and video-diffusion models are the heavy end), and in a pipeline they COMPETE for the same VRAM — you cannot casually keep the LLM, XTTS, and a diffusion model all resident on an 8 GB card. Which models stay loaded, which load on demand, and what gets cached is a real architectural decision, not an afterthought — it is why Part 5 exists. For now you only need the instinct: before adding any model to the pipeline, ask what it costs in the triangle.'
      ]
    },
    {
      h: 'Orchestration: where the engineering actually is',
      p: [
        'Strip away the model calls and DenDen Studio is a familiar web app: uploads land in storage; a job queue feeds long-running work to workers; results are cached so that re-rendering an unchanged voice line costs nothing; a backend streams progress to a frontend. Every skill transfers. What the LLM changes is one interface: somewhere in the middle sits a component that takes natural language and returns structure, and it is <b>probabilistic</b> — it can return something malformed, subtly wrong, or valid-but-absurd ("wave at minute 40" in a 30-second clip).',
        'The whole discipline of LLM-app engineering is wrapping that one probabilistic component so the rest of the system stays deterministic: constrain the output format (JSON schema — next Part), validate every field against reality (allowlisted stage names, timestamps inside clip bounds), and design so a bad plan fails loudly BEFORE expensive GPU work runs, not after. An LLM app is not "software, but unpredictable." It is predictable software with one well-guarded unpredictable component.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky Explains Why the Sunny Is Four Ships Stacked On Top of Each Other',
      text: 'A shipwright apprentice at a friendly port asks Franky to explain the Thousand Sunny, expecting a tour of cannons. Franky instead draws four horizontal lines on a plank. "Layer one: the hull and the mast — raw capacity. How much the ship can physically carry and survive. Boring, invisible, decides everything." Layer two, he taps the engine room: the machinery that converts supplies into motion — the Coup de Burst, the paddle wheels, each machine tuned for one job, none of which the crew rebuilds; they operate them. Layer three, and here Franky gets loud: "The helm and the log book! Nami\'s layer! Which machine fires, in what order, what gets saved for later, what gets double-checked before we spend a whole barrel of cola on a Burst. THAT is where a voyage is actually won." Layer four is the deck everyone sees — where the crew stands, the figurehead, the parts guests interact with. The apprentice asks which layer took the most work. Franky grins: "Everyone thinks the engines. The engines came from geniuses before me — I install them and pick the right size for our hull. The layer I sweat over is Nami\'s: the rules for when NOT to fire the expensive machine. Any fool can install an engine too big for the hull. It sinks beautiful ships every day."'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Kitchen Is Also Four Layers, and the Expediter Is the Hard Part',
      text: 'Monica takes over a chaotic restaurant kitchen and diagnoses it for Rachel in layers. Layer one: the physical kitchen — burners, counter space, walk-in capacity. "You cannot cook around a kitchen that is too small, you can only pretend for a while." Layer two: the stations and their specialist equipment — the grill, the saucier station, the pastry fridge. Monica did not invent any of them and would never build a grill from scratch; she picks good ones that fit the space and keeps them maintained. Layer three: the expediter — Monica herself at the pass, reading each handwritten ticket, turning "birthday, nut allergy, she loves lemon" into exact, checkable instructions for specific stations, deciding what fires now, what can be prepped ahead and reused, and catching the ticket that says "table 40" when the room only has thirty tables — BEFORE the kitchen wastes food on it. Layer four: the dining room, the only layer customers ever see. Rachel asks why Monica hired great station cooks but insists on running the pass herself. "Because the stations are solved problems. The pass is where a kitchen actually fails — one nonsense ticket that nobody catches, cooked at full price."'
    },
    why: 'Both stories are the four-layer cake with the emphasis in the right place. Hull/kitchen = hardware, whose capacity quietly rules everything (VRAM). Engines/stations = model runtimes — powerful specialist machines you install and operate rather than build (Ollama-served LLMs, Hugging Face media models), sized to fit the hull (the triangle). Helm/expediter = orchestration, the layer this course claims is the real engineering: translating free-form requests into exact checkable instructions, deciding what runs and what is reused from cache, and catching the impossible order before the expensive machinery fires — exactly the validate-the-plan-before-the-GPU-burns discipline. Deck/dining room = the product surface. And both masters make the same point about effort: the glamorous layer is bought; the coordinating layer is built.'
  },
  tech: [
    {
      q: 'What exactly happens when you run "ollama pull llama3.1:8b" and then send it a chat request — what is Ollama doing that raw llama.cpp does not?',
      a: 'The pull downloads a manifest plus layers (deliberately Docker-like) containing the model weights in GGUF format — a single-file, quantization-friendly format designed for llama.cpp, which is in fact the inference engine inside Ollama. On a chat request to localhost:11434, Ollama loads the model into memory if it is not already resident (and transparently unloads idle models later — this load/unload latency will matter to us in Part 5), applies the model\'s chat template (every model family formats conversations differently, and silently wrong templates are a classic quality bug when people use raw runtimes), runs generation, and streams tokens back over HTTP. So versus raw llama.cpp: model lifecycle management, correct per-model chat templating, a stable HTTP API any language can call, and package-manager ergonomics. What it costs you: Python-level access to internals — which is exactly why the media models stay in Hugging Face land.'
    },
    {
      q: 'Why does the course keep insisting the LLM must emit a plan that code validates, rather than trusting a well-prompted LLM? Concretely, what goes wrong?',
      a: 'Three concrete failure classes, all of which you will see within your first hour of real use. Malformed output: the model wraps JSON in prose or markdown fences, or emits a trailing comma — anything that breaks a naive json.loads. Schema-valid but reality-invalid: a gesture keyframe at t=41.0 in a 30-second clip; a stage name "lip_sync" when the executor knows "lipsync"; a negative speaking rate. Valid but expensive-wrong: a plan that re-renders every stage when only the audio changed, wasting minutes of GPU time. Prompting reduces the frequency of all three; it eliminates none — the component is probabilistic by nature. The engineering answer is layered: constrained generation makes malformed output structurally impossible (Part 1), field-level validation against reality catches the second class before execution, and plan diffing/caching addresses the third (Part 5). None of that is exotic — it is input validation, the oldest discipline in software, applied to a new kind of input source.'
    },
    {
      q: 'You have a 12 GB GPU. Sketch how DenDen Studio\'s models can possibly fit, given an 8B LLM (~5.5 GB at 4-bit), Whisper-small (~1 GB), XTTS (~2 GB), and a talking-head model (~4 GB).',
      a: 'They do not all fit resident simultaneously with working memory — and they do not need to, because the pipeline is sequential. The insight is that the PLAN phase and the RENDER phase have disjoint model needs: the LLM director runs first (5.5 GB, alone), emits the plan, and can then be unloaded (or left to Ollama\'s idle unloading) before the media stages run in order — Whisper (live mode only), then XTTS, then the talking-head model, each loading, running, and releasing. Peak concurrent usage stays around the largest single stage plus overhead rather than the 12.5 GB sum. The prices you pay: model load latency between stages (mitigated by keeping the two most-used models warm, an eviction-policy decision — Part 5), and the live mode is harder because ITS stages genuinely must be co-resident, which pushes live mode toward smaller variants: Whisper-tiny, a lighter lip-sync model. This kind of arithmetic — the sum, the peak, what can be sequential, what must be concurrent — is the daily bread of local-first ML apps.'
    }
  ],
  code: {
    title: 'Talking to a local LLM the way the app will: HTTP to Ollama',
    intro: 'This is the entire interface between DenDen Studio and its director. No SDK required — just HTTP to localhost. (Run it for real after installing Ollama; the shape is what matters today.)',
    code: `import json, urllib.request

OLLAMA = 'http://localhost:11434'

def chat(model, messages, stream=False):
    """Minimal Ollama chat call — the whole 'SDK' DenDen Studio needs."""
    body = json.dumps({
        'model': model,          # e.g. 'llama3.1:8b' — pulled beforehand
        'messages': messages,    # [{'role': 'system'|'user'|'assistant', 'content': ...}]
        'stream': stream,        # False = one JSON response with the full reply
    }).encode()
    req = urllib.request.Request(OLLAMA + '/api/chat', data=body,
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())['message']['content']

# The director's first, deliberately naive draft (Part 1 fixes its flaws):
reply = chat('llama3.1:8b', [
    {'role': 'system',
     'content': 'You plan pipelines for a talking-avatar app. '
                'Reply with ONLY a JSON list of stage names, in order. '
                'Stages: stt, tts, lipsync, motion, mux.'},
    {'role': 'user',
     'content': 'Live mic mode, and she should wave at the start.'},
])
print(reply)          # hopefully: ["stt", "tts", "lipsync", "motion", "mux"]
plan = json.loads(reply)   # <- the fragile line. Sometimes the model chats.
                           #    Part 1: make this structurally unbreakable.`,
    notes: [
      'Everything is localhost: no API key, no per-request bill, no user data leaving the machine — the open-source dividend, in code.',
      'The last line is this lesson\'s honest cliffhanger: json.loads on raw model text WILL eventually explode. Constrained generation (next Part) makes malformed output impossible rather than just unlikely.'
    ]
  },
  lab: {
    title: 'VRAM arithmetic: which models can be resident together?',
    prompt: 'Write <code>fits_together(models, vram_gb, headroom_gb=1.5)</code>: given a dict mapping model names to their memory footprint in GB, return <code>True</code> if the SUM of footprints plus the working headroom fits in <code>vram_gb</code>. Then write <code>peak_sequential(models)</code>: if the models instead run one at a time (load, run, release), return the peak requirement — the LARGEST single footprint (headroom not included). These two numbers — the sum and the max — are the difference between "impossible on this GPU" and "fine, just sequential."',
    starter: `def fits_together(models, vram_gb, headroom_gb=1.5):
    # models: {'llm': 5.5, 'xtts': 2.0, ...} footprints in GB
    # True if all can be RESIDENT AT ONCE within vram_gb
    pass

def peak_sequential(models):
    # peak GB needed if models run strictly one at a time
    pass`,
    checks: [
      { re: 'def\\s+fits_together\\s*\\(', flags: '', must: true, hint: 'Define fits_together(models, vram_gb, headroom_gb=1.5).', pass: 'fits_together defined ✓' },
      { re: 'def\\s+peak_sequential\\s*\\(', flags: '', must: true, hint: 'Define peak_sequential(models).', pass: 'peak_sequential defined ✓' },
      { re: 'sum\\s*\\(', flags: '', must: true, hint: 'Co-residency is about the SUM of footprints.', pass: 'uses sum ✓' },
      { re: 'max\\s*\\(', flags: '', must: true, hint: 'Sequential execution is bounded by the LARGEST single model.', pass: 'uses max ✓' }
    ],
    tests: `cat = {'llm': 5.5, 'whisper': 1.0, 'xtts': 2.0, 'talking_head': 4.0}
assert fits_together(cat, 16.0) == True, 'sum 12.5 + 1.5 headroom fits in 16 GB'
assert fits_together(cat, 12.0) == False, 'sum 12.5 + 1.5 headroom does NOT fit in 12 GB'
assert fits_together({'llm': 5.5}, 8.0) == True, 'one model on an 8 GB card is fine'
assert peak_sequential(cat) == 5.5, 'sequential peak is the largest model (the LLM)'
assert fits_together({'whisper': 1.0, 'xtts': 2.0}, 6.0) == True, 'the live-mode pair fits a small card'
print('VRAM arithmetic correct')`,
    solution: `def fits_together(models, vram_gb, headroom_gb=1.5):
    return sum(models.values()) + headroom_gb <= vram_gb

def peak_sequential(models):
    return max(models.values())`,
    notes: [
      'Two one-liners, but they are the two numbers every local-first ML architecture is negotiated around: the sum (what co-residency costs) and the max (what sequencing costs). Part 5 adds the third number — load latency — which is the PRICE of choosing the max over the sum.',
      'Headroom is not padding for cowardice: inference needs working memory beyond the weights (activations, KV cache for LLMs), and running a GPU to the last megabyte produces the least debuggable crashes in the field.'
    ]
  },
  deepDive: {
    timeMin: 15,
    intro: 'Two things worth genuinely understanding beneath today\'s working knowledge: what a model is actually doing when it generates (and why that explains both VRAM behavior and latency), and what "open" really means on a model card.',
    sections: [
      {
        h: 'What generation actually is: one token at a time, with a growing cache',
        p: 'An LLM generates autoregressively: it computes a probability distribution over its vocabulary for the SINGLE next token, one is chosen (sampling with temperature, or greedily), appended, and the whole thing repeats. Two consequences you will feel constantly. Latency scales with OUTPUT length — a 500-token plan takes ~10x longer to emit than a 50-token one, which is a real argument for keeping the director\'s plans terse. And the KV cache: to avoid recomputing attention over the whole prompt for every new token, the runtime caches per-token key/value tensors — memory that grows with context length and sits on top of the weights\' footprint. A long system prompt plus a long conversation history is not free even when the reply is short; it is VRAM and prefill time. This is also why the SAME model can feel snappy in a short exchange and sluggish with a bloated prompt — and why Part 5 treats prompt length as a performance dial, not just a prompt-engineering aesthetic.'
      },
      {
        h: 'Quantization in one paragraph (Part 5 does the details)',
        p: 'Weights are trained in 16-bit floats; quantization stores them in fewer bits — typically 4 or 5 for local use — with per-block scaling factors so the compression stays honest. A Q4 build of an 8B model shrinks from ~16 GB to ~5 GB and runs meaningfully faster (memory bandwidth, not arithmetic, bottlenecks local inference). The cost is a small quality degradation that is usually invisible for structured-output work like ours and most visible in long-form subtle reasoning. GGUF is the single-file format the llama.cpp/Ollama world uses for these builds; the quant level is in the tag (q4_K_M and friends). Working default: start at 4-bit, move up only when you can name the quality failure you are fixing.'
      },
      {
        h: '"Open weights" is not "open source" — read the license, then build',
        p: 'Three tiers matter in practice. Genuinely open licenses (Apache-2.0, MIT — e.g. Whisper, many Qwen and Mistral releases) permit commercial use, modification, and redistribution without drama. Community licenses (the Llama family) are free for almost everyone but carry conditions — acceptable-use policies, thresholds for very large deployments, attribution requirements — fine for this course, worth a real read before a startup bets on them. Research/non-commercial licenses (common in the talking-head and voice-cloning space — always check the specific repo) can prototype but cannot ship in a paid product. For DenDen Studio this bites hardest exactly where the magic is: several famous lip-sync and voice models are research-licensed, and choosing the Apache-licensed alternative over the slightly-better research-licensed one is a product decision, not a legal footnote. Habit to build now: the license line on the model card is the FIRST thing you read, before the benchmark table.'
      }
    ]
  },
  quiz: [
    {
      q: 'In the four-layer picture of an LLM app, where does the code you write mostly live?',
      options: ['The model layer — fine-tuning and training loops', 'The orchestration layer — planning, validation, queues, caching, glue', 'The hardware layer', 'Evenly across all four layers'],
      correct: 1,
      explain: 'You install and operate the models; you barely write model code. The orchestration layer — turning intent into validated plans and running them reliably — is where LLM-app engineering happens.'
    },
    {
      q: 'DenDen Studio needs its LLM director and its talking-head model. Per this lesson\'s rule of thumb, how do you run each?',
      options: ['Both via Ollama', 'Both via Hugging Face transformers', 'Director via Ollama (text→text over HTTP); talking-head via Hugging Face + Python (needs media handling and intermediate access)', 'Director via Hugging Face; talking-head via Ollama'],
      correct: 2,
      explain: 'Text in, text out → Ollama. Anything touching audio/images/video → the Python ecosystem, where preprocessing and intermediate tensors are accessible.'
    },
    {
      q: 'Four models sum to 12.5 GB but the largest is 5.5 GB, and your GPU has 8 GB. What does the sum-vs-max distinction tell you?',
      options: ['The app cannot run on this GPU', 'Run stages sequentially (load, run, release) — peak need is the 5.5 GB max, at the price of load latency between stages', 'Quantize until all four fit together', 'Buy more VRAM; there is no architectural answer'],
      correct: 1,
      explain: 'Co-residency costs the sum; sequencing costs the max plus load latency. A sequential pipeline makes the 8 GB card viable — this trade is the heart of local-first ML architecture.'
    },
    {
      q: 'Why does even a perfectly-prompted LLM director still require code-level validation of its plans?',
      options: ['Because prompts cannot be longer than the plan', 'The component is probabilistic: malformed JSON, schema-valid-but-impossible values (a keyframe past the clip\'s end), and wasteful-but-valid plans all still occur — validation catches them before GPU money burns', 'Because Ollama corrupts JSON', 'It does not; good prompting suffices'],
      correct: 1,
      explain: 'Prompting lowers error rates; it cannot make a probabilistic component deterministic. Constrained output plus reality-checking every field is what keeps the rest of the system deterministic.'
    },
    {
      q: 'A stunning lip-sync model on Hugging Face carries a research-only license. For DenDen Studio as a shippable product, you:',
      options: ['Use it — model licenses are unenforceable', 'Use it in the paid tier only', 'Prototype with awareness, but ship the permissively-licensed alternative — the license line is read before the benchmark table', 'Avoid Hugging Face entirely'],
      correct: 2,
      explain: '"Open weights" spans genuinely-open through research-only. In the talking-head space especially, license-checking is a first-class product decision.'
    }
  ],
  pitfalls: [
    'Downloading the biggest model your disk fits instead of the smallest that does the job. The 8B-class director handles structured planning shockingly well, loads in seconds, and leaves VRAM for the media models — reach for 70B only when you can name the failure the small model actually exhibits.',
    'Treating Ollama and Hugging Face as competitors and standardizing on one. They serve different layers: Ollama is a model SERVER ideal for the text brain; transformers is a Python LIBRARY the media pipeline cannot do without. DenDen Studio uses both, and so does nearly every serious local-first app.',
    'Budgeting VRAM by adding up weight files alone. Activations, the LLM\'s KV cache (which grows with context length), and framework overhead all claim memory on top — the 1.5 GB headroom in the lab is a floor, not a superstition, and exhausting VRAM produces the ugliest crashes you will debug all course.'
  ],
  interview: [
    {
      q: 'Describe the architecture of a local-first LLM application. Where does the engineering effort actually go?',
      a: 'Four layers. Hardware: the GPU/unified-memory budget that constrains everything. Runtimes: an LLM served locally (Ollama/llama.cpp with quantized GGUF weights, HTTP API) plus Python-hosted specialist models from Hugging Face for any media work. Orchestration — where most of my code and effort lives: translating user intent into structured plans via the LLM with constrained output, validating those plans against reality before execution, job queues for long-running GPU work, caching to avoid recomputation, and model lifecycle management under a VRAM budget. Product: the UI and API surface. The counterintuitive part for people coming from ML research: the models are consumed as components, almost never trained or modified — the differentiating engineering is the orchestration layer, which is classical software engineering wrapped around one probabilistic component.'
    },
    {
      q: 'When would you serve a model through Ollama versus loading it with Hugging Face transformers in your own process?',
      a: 'Ollama when the interaction is text-in-text-out and benefits from server semantics: it owns model lifecycle (load on demand, unload when idle), applies each model family\'s chat template correctly, exposes a language-agnostic HTTP API so the calling service needs no Python or CUDA anything, and manages quantized builds like packages. That fits the planner/director role perfectly. Transformers when I need what a server API hides: custom pre/post-processing of audio and images, access to intermediate representations (embeddings, motion coefficients — which editing features in my app literally consume), model surgery like swapping a vocoder, or models Ollama simply does not serve — Whisper, TTS, talking-head, diffusion. The practical architecture is both at once, and the interview-worthy point is knowing WHY each side exists rather than tribal loyalty to one.'
    },
    {
      q: 'Your pipeline\'s models sum to more VRAM than the GPU has. Walk me through your options and their costs.',
      a: 'First establish the two bounding numbers: the sum (co-residency requirement) and the max (strict-sequential requirement). If even the max does not fit, I need smaller variants or heavier quantization — an architecture cannot sequence its way below its largest stage. Otherwise, options in order: (1) Sequence stages — load, run, release — paying load latency between stages; sensible for batch generation where seconds of loading amortize over minutes of rendering. (2) Hybrid residency: keep the highest-frequency models warm (an eviction policy, essentially LRU over models) and load the rest on demand. (3) Shrink stages: deeper quantization of the LLM, Whisper-small instead of medium — each with a nameable quality cost. (4) Split hardware: LLM on CPU (llama.cpp is genuinely usable there) freeing the GPU for media models. For a live/realtime mode, sequencing is off the table for the stages on the hot path — they must be co-resident, which is exactly why live modes run smaller models than batch modes in the same product.'
    },
    {
      q: 'What does "the LLM is the only probabilistic component" imply for how you design and test an LLM app?',
      a: 'Design: quarantine the nondeterminism at one boundary. Everything upstream (UI, request handling) and downstream (plan execution, media rendering) stays deterministic; the LLM sits behind an interface that accepts natural language and returns SCHEMA-CONSTRAINED structure, with code validating every field against reality — enum membership, numeric bounds, cross-field consistency like keyframe times within clip duration — before anything expensive runs. Failures become ordinary handled errors (re-ask, fall back, surface to user), not corrupted downstream state. Testing: the deterministic 90% gets normal unit and integration tests. For the probabilistic seam: golden-set tests (a corpus of realistic requests where the emitted plans are checked for validity and semantic sanity, run against a pinned model version), property-based validation tests (whatever the model emits, the validator must never pass an impossible plan), and treating model upgrades like dependency upgrades — full golden-set regression before swapping. The mental model: you are not testing whether the LLM is smart; you are testing that your system is correct regardless of the specific text it returns.'
    }
  ]
};
