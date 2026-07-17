window.LESSONS = window.LESSONS || {};
window.LESSONS['running-local-llms'] = {
  id: 'running-local-llms',
  title: 'Ollama & Hugging Face: Running a Real LLM on Your Own Machine',
  category: 'Part 1 — Local LLM Core Skills',
  timeMin: 40,
  summary: 'Time to actually run the brain. This lesson makes you fluent in the two workflows the whole course stands on: Ollama as your always-ready local model server (pull, run, keep warm, talk HTTP) and Hugging Face transformers as the Python path you will use when Ollama is the wrong shape. You will learn to read a model tag like llama3.1:8b-instruct-q4_K_M the way you read a version number, manage conversation state correctly (the API is stateless — YOU carry the history), and control sampling so the director gives reproducible answers.',
  goals: [
    'Install and drive Ollama: pull a model, chat with it from the terminal and over HTTP, list and remove models, and understand what stays resident in memory',
    'Read a full model tag — family, parameter count, instruct vs base, quantization level — and pick deliberately instead of accepting defaults',
    'Manage conversation state correctly: the chat API is stateless, so the caller owns and resends the message history every turn',
    'Control generation with sampling options — temperature 0 (plus a seed) for the reproducible director role, higher temperature only where variety is a feature',
    'Run the same job through Hugging Face transformers in Python, and articulate when that path is the right one'
  ],
  concept: [
    {
      h: 'Ollama in ten minutes: a package manager that grew a server',
      p: [
        'Install Ollama (one installer on macOS/Windows, one curl-pipe on Linux) and you get a background server on <code>http://localhost:11434</code> plus a CLI that feels like a package manager: <code>ollama pull llama3.1:8b</code> downloads a model, <code>ollama list</code> shows what is on disk, <code>ollama run llama3.1:8b</code> opens an interactive chat in the terminal, <code>ollama rm</code> deletes, <code>ollama ps</code> shows what is loaded in memory right now. The mental model: models on DISK are cheap and passive (a few GB each, sitting in a cache directory); a model in MEMORY is the expensive, active thing — loaded on first request, kept warm for a few minutes of idle (configurable), then unloaded.',
        'That warm/cold distinction is the first performance fact of local LLM work: the first request after a cold start pays several seconds of load time; every request while warm starts generating almost immediately. For DenDen Studio, this shapes real decisions — the director model should be warm while a creator is actively editing, and Part 5 turns "who stays warm" into an explicit eviction policy. For now: if a request is mysteriously slow, <code>ollama ps</code> before blaming the model.'
      ]
    },
    {
      h: 'Reading a model tag like an engineer',
      p: [
        '<code>llama3.1:8b-instruct-q4_K_M</code> unpacks into four decisions someone made for you: <b>family</b> (llama3.1 — the architecture and training lineage; Qwen, Mistral, Gemma are peers worth trying), <b>parameter count</b> (8b — the quality/latency/VRAM triangle from last lesson, in one number), <b>instruct vs base</b> (instruct models are post-trained to follow instructions and chat; BASE models just continue text and will cheerfully continue your JSON schema with more schema instead of filling it in — for app work you want instruct, essentially always), and <b>quantization</b> (q4_K_M — 4-bit weights with a particular grouping scheme; the default pulls are usually this, and it is the right default).',
        'Short tags like <code>llama3.1:8b</code> are aliases that resolve to a specific full tag — convenient, but an app should PIN the full tag the same way production code pins dependency versions: model upgrades change behavior, and you want them to happen when you choose, not when an alias moves. <code>ollama show &lt;tag&gt;</code> prints the details of what you actually have, including its context window and its chat template.'
      ]
    },
    {
      h: 'The API is stateless: you are the memory',
      p: [
        'The single most common beginner bug: sending only the newest user message and wondering why the model forgot the conversation. The chat endpoint has no session — every request must carry the ENTIRE conversation: the system message, every prior user and assistant turn, then the new message. The model re-reads all of it, every time (the KV cache from last lesson\'s deep dive makes the re-reading cheap when the prefix is unchanged, but correctness-wise, what you send is all the model knows).',
        'So every real app grows a tiny conversation-state layer: append the user turn, call the API, append the assistant reply, repeat — and eventually, trim or summarize old turns before the context window fills. For DenDen Studio\'s director this state is small and structured (a few planning exchanges per project), but the discipline matters immediately: the editing loop in Part 4 works precisely because prior plan versions ride along in the history, letting "no, bigger" mean something.'
      ]
    },
    {
      h: 'Sampling options — and the Python path when you need it',
      p: [
        'Generation is sampling from a probability distribution, and you hold the dials: <code>temperature</code> scales how adventurous the choice is (0 collapses to always-pick-the-likeliest, giving near-deterministic output; 0.7-1.0 gives natural variety), <code>seed</code> fixes the random draw so runs reproduce, <code>num_predict</code> caps output length. The director role wants <b>temperature 0 and a fixed seed</b>: same request, same plan, debuggable diffs, meaningful golden-set tests. Save higher temperatures for genuinely creative surfaces — script brainstorming, alternative phrasings — where variety is the feature, not a bug.',
        'And the other hand: Hugging Face <code>transformers</code> loads a model INSIDE your Python process — <code>pipeline(\'text-generation\', model=...)</code> for a quick start, tokenizer + model classes when you need control. You pay Python environment setup and manual memory management, and you gain what a server cannot give: access to internals (logits, embeddings, attention), custom processing, and the entire media-model ecosystem that Parts 2 and 3 live in. The working split stands: Ollama serves the app\'s text brain; transformers is how Python touches models directly — you will use both before the course is half done.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Sanji\'s Galley: Stock the Pantry Once, Keep One Stove Lit',
      text: 'Early on, the crew ate ashore — every meal meant docking, finding a tavern, paying tavern prices, and telling a stranger what everyone liked, again. Sanji ends that era the day he takes over the galley. First: provisioning. At each major port he stocks the pantry ONCE — sacks and barrels hauled aboard, labeled precisely in his own system: not just "rice" but which variety, which harvest, which barrel size, because a cook who grabs "whatever rice" serves worse food and does not know why. From then on, cooking happens on board, free, private, any hour — no tavern keeper learns the crew\'s tastes, no port prices, no docking required. Second: readiness. Sanji keeps exactly one stove lit through the day — the first meal after a cold galley pays the full relighting wait; every dish while the stove is warm comes fast. He does not keep every burner going ("a lit stove eats fuel whether it cooks or not"), and he lets the stove cool overnight. Third, and the part the crew never sees: Sanji keeps the whole order in his head. Luffy shouts a stream of nonsense — "like yesterday but MORE, and what Usopp had!" — and it works only because Sanji remembers yesterday, and what Usopp had. A new galley boy takes one order in isolation, forgets everything prior, and serves chaos. Sanji, tapping his temple: "The counter does not remember. I remember. That is the job."'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon Ends the Coffee-Shop Era with a Pantry, a Warm Machine, and a Log',
      text: 'After a barista gets his order wrong twice ("it is a SIXTEEN-step order, how is that hard"), Sheldon declares the apartment shall have its own espresso setup — over Leonard\'s objection that the coffee shop is right downstairs. Sheldon\'s counterargument is a whiteboard with three sections. One: ACQUISITION. Beans purchased once, in bulk, catalogued by roast, origin, grind size, and batch — "Leonard bought \'coffee.\' I bought Ethiopian Yirgacheffe, medium roast, batch 47, and when a cup disappoints me I will know EXACTLY which variable to blame." Two: THERMAL READINESS. The machine takes four minutes from cold; Sheldon keeps it warm during his scheduled coffee windows and lets it sleep otherwise — "warm during use, off during disuse; only a barbarian pays the four-minute penalty at 8 a.m. sharp, and only a wastrel heats an idle machine all night." Three: STATE. The machine, Sheldon explains, remembers nothing — so a laminated log sheet hangs beside it recording every prior cup in the current "session," because "make it like last time, but stronger" is meaningless to a machine and must be reconstructed, in full, by the person asking. Penny asks whether all this beats just talking to a barista. Sheldon: "The barista wrote down sixteen steps and performed eleven. My machine performs precisely what the log specifies, every time, and tells no one what I drink."'
    },
    why: 'Both stories carry the lesson\'s four mechanics. Stocking the pantry / buying catalogued beans = pulling models to local disk once, with the tag read precisely (variety, batch, grind = family, size, quant) rather than grabbing "whatever rice." The lit stove / warm machine = model residency — first use after cold pays the load penalty, warm serves fast, and keeping everything hot wastes fuel (VRAM), so warmth is managed, not maximized. Sanji remembering the whole order and the laminated log = the stateless API — the counter/machine remembers nothing, so the CALLER reconstructs the full history every request. And the privacy thread — no tavern keeper or barista learning the crew\'s tastes — is the local-first dividend again: the conversation never leaves the ship.'
  },
  tech: [
    {
      q: 'What actually happens, memory-wise, between "ollama pull" and getting your first token back — and where do the seconds go on a cold request?',
      a: 'Pull writes model layers (GGUF weights, template, params) to the on-disk cache — no memory involved. The first chat request triggers load: weights are mapped/copied from disk into RAM/VRAM (seconds — dominated by size on disk, so a q4 8B loads far faster than a q8 or a 70B), the runtime allocates the KV cache sized by context length, then PREFILL runs — the model processes your entire prompt to populate that cache — and only then does token-by-token generation start. So cold latency = load + prefill + generation, warm latency = prefill + generation, and prefill itself scales with prompt length. Three levers fall straight out: keep hot-path models warm (Ollama\'s keep_alive), keep prompts lean, and prefer smaller/more-quantized builds where quality allows. ollama ps tells you what is currently paying rent in memory.'
    },
    {
      q: 'Why must an app pin the full model tag (llama3.1:8b-instruct-q4_K_M) rather than a convenient alias like llama3.1:8b?',
      a: 'Aliases are mutable pointers — the same reason lockfiles exist for packages. If the alias re-resolves after a registry update or on a teammate\'s machine, you get silently different weights: different quant, sometimes a different point release — and LLM behavior differences are subtle, showing up as a slightly higher rate of malformed plans rather than an error message. Because the component is probabilistic, you cannot eyeball the difference from one response; you need your golden-set tests against a KNOWN artifact. Pin the full tag in config, treat model upgrades like dependency upgrades — deliberate bump, full regression run, then commit. This also makes "works on my machine" debuggable: ollama show on both machines should print identical builds.'
    },
    {
      q: 'Your director calls run at temperature 0 with a fixed seed. A colleague objects that "temperature 0 makes the model dumber." What is true and false in that?',
      a: 'False as stated: temperature does not change the model\'s knowledge or the distribution it computes — it changes how you SELECT from that distribution. At 0 you take the argmax token every step; the model is exactly as capable, just deterministic. The grain of truth: greedy decoding can occasionally commit to a locally-likely early token that leads somewhere globally weaker, where sampling might have escaped — for long creative text this is a real (mild) effect and one reason prose at temperature 0 reads flat and repetitive. But the director emits short, structured plans, where the failure mode that matters is VARIANCE, not blandness: the same request should produce the same plan so diffs are meaningful, bugs reproduce, and golden tests do not flap. Determinism is also not perfectly guaranteed even at temperature 0 (GPU floating-point nondeterminism and runtime versions can wiggle results) — which is an argument for MORE validation, never for more temperature. Reserve temperature for surfaces where variety is the product: brainstorming scripts, suggesting alternate gestures.'
    }
  ],
  code: {
    title: 'The daily driver: Ollama CLI + stateful chat over a stateless API',
    intro: 'The terminal half you will run constantly, then the Python shape of a conversation loop that actually remembers — because the server will not do it for you.',
    code: `# ---- terminal: the package-manager workflow -------------------------
# ollama pull llama3.1:8b-instruct-q4_K_M   # download once, pinned tag
# ollama list                               # what is on disk
# ollama ps                                 # what is in MEMORY right now
# ollama run llama3.1:8b-instruct-q4_K_M    # interactive chat to try it
# ollama show llama3.1:8b-instruct-q4_K_M   # context window, template, quant
# ollama rm  <tag>                          # reclaim disk

# ---- python: a conversation that remembers ---------------------------
import json, urllib.request

OLLAMA = 'http://localhost:11434'
MODEL = 'llama3.1:8b-instruct-q4_K_M'      # pinned, like a lockfile entry

def chat(messages, deterministic=True):
    body = {
        'model': MODEL,
        'messages': messages,
        'stream': False,
        'options': {'temperature': 0, 'seed': 42} if deterministic else
                   {'temperature': 0.8},
    }
    req = urllib.request.Request(OLLAMA + '/api/chat',
                                 data=json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())['message']['content']

history = [{'role': 'system',
            'content': 'You are the planning brain of a talking-avatar app.'}]

def ask(user_text):
    history.append({'role': 'user', 'content': user_text})
    reply = chat(history)                  # ENTIRE history, every call
    history.append({'role': 'assistant', 'content': reply})
    return reply

ask('The avatar should wave, then speak the intro.')
ask('Actually, make the wave happen after the intro instead.')
# "Actually" only means something because turn 1 rode along in the request.`,
    notes: [
      'options.seed with temperature 0 gives reproducible runs on the same machine and build — the foundation for the golden-set testing this course keeps advertising.',
      'The history list is the app\'s memory, which also makes it the app\'s responsibility: Part 5 covers trimming it before the context window overflows.'
    ]
  },
  lab: {
    title: 'Build the conversation-state layer the API refuses to be',
    prompt: 'Write <code>ChatSession</code>: constructor takes a <code>system</code> string and starts the history with that system message. Method <code>add_user(text)</code> appends a user turn and RETURNS the full messages list ready to send (system first, strict user/assistant alternation after). Method <code>add_assistant(text)</code> records the reply. Method <code>request_body(model, deterministic=True)</code> returns the dict for Ollama: keys <code>model</code>, <code>messages</code>, <code>stream</code> (False), and <code>options</code> — <code>{"temperature": 0, "seed": 42}</code> when deterministic, else <code>{"temperature": 0.8}</code>. No network calls — this is the state layer, and it must be exactly right.',
    starter: `class ChatSession:
    def __init__(self, system):
        # start history with the system message
        pass

    def add_user(self, text):
        # append user turn, return the FULL messages list
        pass

    def add_assistant(self, text):
        # record the model's reply
        pass

    def request_body(self, model, deterministic=True):
        # full Ollama /api/chat body: model, messages, stream, options
        pass`,
    checks: [
      { re: 'class\\s+ChatSession', flags: '', must: true, hint: 'Define the ChatSession class.', pass: 'ChatSession defined ✓' },
      { re: "'system'|\"system\"", flags: '', must: true, hint: 'History must start with a system-role message.', pass: 'system role present ✓' },
      { re: 'def\\s+request_body\\s*\\(', flags: '', must: true, hint: 'Implement request_body(model, deterministic=True).', pass: 'request_body defined ✓' },
      { re: "temperature", flags: '', must: true, hint: 'options must set temperature (0 when deterministic, 0.8 otherwise).', pass: 'temperature option ✓' },
      { re: "seed", flags: '', must: true, hint: 'Deterministic mode also pins a seed.', pass: 'seed pinned ✓' }
    ],
    tests: `s = ChatSession('You are the planner.')
msgs = s.add_user('Plan a wave.')
assert msgs[0] == {'role': 'system', 'content': 'You are the planner.'}, 'system message first'
assert msgs[1] == {'role': 'user', 'content': 'Plan a wave.'}, 'then the user turn'
s.add_assistant('{"steps": ["motion"]}')
msgs = s.add_user('Add speech too.')
assert len(msgs) == 4, 'full history rides along: system, user, assistant, user'
assert [m['role'] for m in msgs] == ['system', 'user', 'assistant', 'user'], 'strict alternation'
body = s.request_body('llama3.1:8b-instruct-q4_K_M')
assert body['model'] == 'llama3.1:8b-instruct-q4_K_M' and body['stream'] is False
assert body['options'] == {'temperature': 0, 'seed': 42}, 'director mode is reproducible'
assert body['messages'] is not None and len(body['messages']) == 4
loose = s.request_body('llama3.1:8b-instruct-q4_K_M', deterministic=False)
assert loose['options'] == {'temperature': 0.8}, 'creative mode raises temperature'
print('conversation state layer correct')`,
    solution: `class ChatSession:
    def __init__(self, system):
        self.messages = [{'role': 'system', 'content': system}]

    def add_user(self, text):
        self.messages.append({'role': 'user', 'content': text})
        return self.messages

    def add_assistant(self, text):
        self.messages.append({'role': 'assistant', 'content': text})

    def request_body(self, model, deterministic=True):
        return {
            'model': model,
            'messages': self.messages,
            'stream': False,
            'options': ({'temperature': 0, 'seed': 42} if deterministic
                        else {'temperature': 0.8}),
        }`,
    notes: [
      'Twenty lines, but this class IS the fix for the number-one beginner bug (sending only the newest message) — and its request_body seam is where Part 5 will later add history trimming and where structured-output constraints land next lesson.',
      'Wire it to the real server yourself: replace the asserts with an actual urllib call from the code demo and watch "Actually, change that" work because — and only because — the history rode along.'
    ]
  },
  quiz: [
    {
      q: 'A request to a model you have not used for an hour takes 8 seconds; the identical request again takes 1. The main difference:',
      options: ['Ollama cached the answer text', 'The first request paid the cold-start model load into memory; the second hit a warm, resident model', 'The network warmed up', 'Temperature dropped between calls'],
      correct: 1,
      explain: 'Models on disk are passive; first use loads weights into memory (seconds), and Ollama keeps them warm for a while after. ollama ps shows what is resident.'
    },
    {
      q: 'In llama3.1:8b-instruct-q4_K_M, what does "instruct" tell you, and why does it matter for app work?',
      options: ['It runs faster than base', 'It was post-trained to follow instructions and chat — a BASE model would just continue your text, e.g. extending your JSON schema instead of filling it in', 'It has a larger context window', 'It is the unquantized build'],
      correct: 1,
      explain: 'Base models are text-continuers; instruct models are instruction-followers. For planners, tools, and chat — effectively all app work — you want instruct.'
    },
    {
      q: 'Why did the model "forget" the previous turn when you sent only the newest user message?',
      options: ['The context window overflowed', 'Temperature was too high', 'The chat API is stateless — the model only knows what is in THIS request, so the caller must resend the full history every turn', 'The model needs a session cookie'],
      correct: 2,
      explain: 'There is no server-side session. Every request stands alone; conversation memory is entirely the caller\'s job — hence the ChatSession layer in the lab.'
    },
    {
      q: 'For the DenDen Studio director (request in → structured plan out), the right sampling setup is:',
      options: ['temperature 1.0 for smarter plans', 'temperature 0 with a pinned seed — same request, same plan: reproducible, diffable, testable', 'random seed each call to avoid ruts', 'num_predict of 5 to keep plans short'],
      correct: 1,
      explain: 'Determinism is the feature: debuggable diffs and stable golden-set tests. Higher temperature belongs on genuinely creative surfaces, where variety is the point.'
    },
    {
      q: 'You need token-level access to a model\'s output distribution to build a custom decoding trick. Which path, and why?',
      options: ['Ollama — add an HTTP parameter', 'Hugging Face transformers — the model runs inside your Python process, exposing logits and internals a server API deliberately hides', 'Either works equally', 'Neither; that requires training your own model'],
      correct: 1,
      explain: 'A server API gives you text in, text out. In-process loading via transformers is exactly for when you need the internals — logits, embeddings, custom processing.'
    }
  ],
  pitfalls: [
    'Benchmarking or demoing against a cold model and concluding local LLMs are too slow. Always distinguish cold-start load (paid once) from warm inference (the real number) — run ollama ps, warm the model, then measure.',
    'Letting the model alias float. llama3.1:8b re-resolving to a different build on another machine or after an update produces behavior drift with no error message — pin the full tag in config and upgrade deliberately, with your golden set as the gate.',
    'Rebuilding the messages list from scratch each turn (or worse, sending only the newest message) instead of maintaining one growing history — the model loses all context, or gets an inconsistent one, and the bug looks like "the model is stupid" instead of what it is: the caller dropped the state.'
  ],
  interview: [
    {
      q: 'Walk me through what happens end-to-end when an app sends its first chat request to a local Ollama server after boot.',
      a: 'The HTTP request hits the Ollama server on localhost:11434. The requested model is on disk but not resident, so the server loads it: GGUF weights mapped into RAM/VRAM — seconds, proportional to file size — plus KV-cache allocation sized by the context window. Then the server applies that model family\'s chat template to my messages array (correct per-model templating is one of Ollama\'s quiet value-adds), and prefill runs: the model processes the entire prompt, populating the KV cache — time proportional to prompt length. Only then does autoregressive generation begin, one token at a time, streamed or buffered back. Subsequent requests skip the load while the model stays warm (keep_alive), so steady-state latency is prefill plus generation. The operational takeaways: manage warmth deliberately for hot-path models, keep prompts lean because prefill is not free, and remember the API is stateless — that whole prompt, history included, is rebuilt and resent by MY code every turn.'
    },
    {
      q: 'How do you make an inherently probabilistic LLM component behave reproducibly enough to test, and where are the limits?',
      a: 'Three pins. Pin the artifact: the full model tag — family, size, instruct, quant build — in config, treated like a lockfile entry; upgrades are deliberate events gated by regression tests. Pin the sampling: temperature 0 (greedy decoding) plus a fixed seed, so identical requests yield identical outputs in the common case. Pin the input: prompts built from templates under version control, so a "model bug" can be bisected to a prompt diff. Limits, honestly stated: bit-identical output is not guaranteed across machines, GPU vs CPU, runtime versions, or even some parallel-execution schedules — floating-point nondeterminism is real. So reproducibility is a debugging aid, not a correctness mechanism; correctness comes from schema-constrained output and field-level validation downstream, which must hold for ANY text the model returns. Golden-set tests then assert semantic properties of plans, not byte-identical strings.'
    },
    {
      q: 'Your team standardized everything on Ollama, and now a feature needs sentence embeddings and another needs Whisper transcription. What do you tell them?',
      a: 'That the standardization confused a tool with an architecture. Ollama is a chat/generation server for GGUF language models — superb for the text-brain role: language-agnostic HTTP, model lifecycle handled, quantized builds managed like packages. But it does not serve arbitrary model types: embeddings support is narrow, and Whisper, TTS, diffusion, and talking-head models are simply outside its shape. Those live in the Hugging Face/Python world — transformers and friends — loaded in-process where you control preprocessing and can reach intermediates. The sane architecture is a boundary, not a monoculture: text generation goes through the Ollama service; a Python media service owns everything that touches audio, images, or video. That is not a compromise — the two tools exist because the two workloads are genuinely different shapes.'
    },
    {
      q: 'When would you choose a 70B model over an 8B for a production feature, and what is the honest process for deciding?',
      a: 'Start from the failure, not the model: run the feature on the 8B and collect concrete failures — plans with wrong structure survive validation? Misread intent on complex multi-step requests? If the failures are format discipline, a bigger model is usually the WRONG fix; constrained generation and better prompts are cheaper and more reliable. If the failures are genuine reasoning depth — multi-constraint planning where the small model consistently drops a constraint — then test the 70B on the same golden set and price the win: roughly 8-10x the memory (~40+ GB, likely a dedicated GPU or quantized to the edge), several times the latency per token, and heavier cold starts. Often the right answer is a routing architecture instead: the 8B handles the frequent simple cases, escalating the rare hard ones to the big model — paying the premium only where the measured failures live. What I would not accept is "bigger is better" as a default: on a local-first product, VRAM is product surface — memory spent on the LLM is memory taken from the media models.'
    }
  ]
};
