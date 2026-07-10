window.LESSONS = window.LESSONS || {};
window.LESSONS['using-models-apis'] = {
  id: 'using-models-apis',
  title: 'Using Models: APIs, Hugging Face, Ollama & Choosing the Right Tier',
  category: 'Part 6 — LLM Engineering',
  timeMin: 55,
  summary: 'Everything so far explained how a model is built. This lesson is how you actually GET one into your hands: a hosted API call, a self-hosted open-weight model from Hugging Face, or a fully local model via Ollama — three genuinely different trade-offs in cost, privacy, control, and quality ceiling. And because most real systems will use more than one of these over their lifetime, this lesson ends on the design principle Part 7\'s agent frameworks are built around: write your code so the model underneath is a swappable detail, not a hard-coded assumption.',
  goals: [
    'Compare hosted commercial APIs, self-hosted open-weight models, and local models on cost, privacy, control, and quality',
    'Explain precisely what "open-weight" means, how it differs from full open-source, and why the distinction has real licensing consequences',
    'Estimate API cost and the rough break-even volume where self-hosting becomes cheaper than paying per token',
    'Explain why "always use the biggest/best model" is usually the wrong default, and how to reason about matching a tier to a task',
    'Design an LLM-agnostic interface and explain what real differences between providers such an abstraction has to paper over'
  ],
  concept: [
    {
      h: 'Three ways to get a model into your hands',
      p: [
        '<b>Hosted commercial APIs</b> (Anthropic, OpenAI, Google, and others) — you send a request over the network, they run the model on their infrastructure, you pay per token. Zero infrastructure to manage, access to frontier-tier model quality (typically the strongest models available anywhere), automatic updates as providers improve their models — at the cost of your data leaving your infrastructure (a real constraint for regulated or sensitive data), per-token cost that scales directly with usage, rate limits, and dependence on a third party\'s uptime and pricing decisions.',
        '<b>Self-hosted open-weight models</b> — download a model\'s trained weights (LLaMA, Mistral, Qwen, and many others publish weights openly) via Hugging Face\'s Hub, and run it on infrastructure YOU control (your own GPUs, or a managed-but-dedicated service like HF Inference Endpoints). Full control over data (nothing leaves your infrastructure), no per-token fee to a model provider, full fine-tuning rights (everything from Part 6\'s LoRA/QLoRA lessons applies directly) — at the cost of owning the entire serving stack (the previous lesson\'s batching, KV cache, and quantization concerns become YOUR problem), provisioning and paying for GPU infrastructure regardless of utilization, and a quality ceiling that, while closing fast, has historically trailed the very best closed frontier models on the hardest reasoning tasks.',
        '<b>Local models via Ollama</b> — run a (typically quantized, per the inference-sampling lesson) open-weight model directly on a laptop or workstation, with no network dependency at all. Completely private (nothing ever leaves the machine), free after the hardware is paid for, and remarkably simple to get running (<code>ollama pull llama3</code>, <code>ollama run llama3</code>) — at the cost of being limited to whatever a single machine\'s memory and compute can hold, meaningfully below both hosted-API and well-provisioned self-hosted quality ceilings, and unsuited to serving many concurrent users (it\'s a single-machine, mostly single-user tool). Ollama\'s real niche: local development and testing, privacy-non-negotiable individual use, and — directly relevant to Part 7 — quick, free, LLM-agnostic prototyping of agent logic before committing to a production model choice.'
      ]
    },
    {
      h: '"Open-weight" is not the same thing as "open-source"',
      p: [
        'Traditional open-source software makes the full SOURCE available — code you can read, modify, and rebuild from scratch. Most "open" LLMs are more precisely described as <b>open-weight</b>: the TRAINED PARAMETERS are published and downloadable, but the training DATA, and often the exact training recipe/code, are not — you can run and fine-tune the model, but you cannot reproduce it from scratch the way you could reproduce a traditional open-source program\'s binary from its published source.',
        'This distinction has real, practical consequences, not just a philosophical one. Licenses vary meaningfully between "open" models: some permit unrestricted commercial use, others restrict commercial use above a certain company size or user count, others prohibit specific use cases outright — betting a product on a specific open-weight model without reading ITS specific license (not just assuming "open" means "unrestricted") is a real, avoidable business risk. It also means you cannot always independently verify or audit exactly what data a model was trained on (relevant to bias, provenance, and compliance questions) the way full source availability would allow — "open" describes a meaningful spectrum of actual openness, not a single guarantee, and knowing which point on that spectrum a specific model sits at is a genuine due-diligence step before depending on it.'
      ]
    },
    {
      h: 'The cost-structure trade-off, made concrete',
      p: [
        'API pricing is per-token, usually with input tokens priced lower than output tokens (output requires actual generation compute — the causal, one-token-at-a-time cost from the inference-sampling lesson — while input tokens are processed once, in parallel, during the initial forward pass). Cost scales LINEARLY and immediately with usage: zero fixed cost, but no economy of scale beyond whatever volume discounts a provider offers.',
        'Self-hosting has the opposite shape: a large, mostly FIXED cost (GPU infrastructure, whether rented hourly from a cloud provider or owned outright) largely independent of how many requests you actually serve — cost per token DECREASES as utilization increases, because the fixed infrastructure cost is amortized across more requests (this is exactly why the previous lesson\'s batching and serving-efficiency techniques directly translate to real cost savings, not just latency improvements). There is a genuine break-even volume: below it, paying per token to an API is cheaper than provisioning and operating your own infrastructure; above it, self-hosting becomes cheaper, PROVIDED you can actually achieve high utilization (idle, underused GPUs are a pure loss, and are why the break-even calculation is a real, sometimes-surprising engineering estimate, not "self-hosting is just cheaper because there\'s no middleman markup").',
        '<div class="math">breakeven volume ≈ fixed infrastructure cost / (API price per token)<span class="mnote">below this monthly token volume, pay-per-token wins; above it, owned infrastructure wins — assuming utilization stays high enough to actually hit that volume</span></div>'
      ]
    },
    {
      h: 'Why "always use the biggest model" is the wrong default',
      p: [
        'The largest, most capable frontier model is not automatically the right engineering choice for every task inside a system — three separate reasons converge on this. Cost: a frontier model\'s per-token price can be an order of magnitude (or more) above a well-chosen smaller model\'s, and for high-volume, low-complexity subtasks (classifying a support ticket into one of 12 categories, extracting a date from text — the classic-nlp-tasks lesson\'s territory) that cost difference compounds directly with volume. Latency: smaller models generate faster, and for user-facing, latency-sensitive interactions, a noticeably slower frontier-model response can hurt the product more than a small accuracy gain helps it. Fit: many real subtasks simply don\'t NEED frontier-level general reasoning — a fine-tuned (LoRA, last-lesson\'s technique) small open model, specialized on exactly the narrow task at hand, can match or beat a much larger general model on THAT specific task, at a fraction of the cost and latency.',
        'The engineering skill is matching TIER to TASK, not defaulting to either extreme. A practical heuristic: reserve the most capable (and most expensive) tier for the hardest sub-problems in a system — genuinely open-ended reasoning, ambiguous instructions, tasks where errors are costly — and route simpler, high-volume, well-defined sub-problems to smaller, cheaper, faster models, ideally fine-tuned for exactly that narrow job. This "model routing" pattern (different requests handled by different-tier models, chosen automatically based on estimated task difficulty) is increasingly common in production LLM systems for exactly this reason, and it is only possible to design well if the underlying model choice is a swappable implementation detail — which is exactly the next section\'s point. As always, the right tier for a given task is a measured, not assumed, decision — the model-evaluation lesson\'s discipline, applied to model SELECTION rather than model training.'
      ]
    },
    {
      h: 'Designing for LLM-agnosticism',
      p: [
        'Given that a real system will likely use several of the above (a frontier API for the hardest reasoning, a fine-tuned self-hosted model for a high-volume narrow task, maybe a local model during development), the practical design principle is: never hard-code assumptions about a specific provider throughout your application code. Define a consistent internal interface — something like <code>generate(prompt, **params) -&gt; str</code> — and implement it once per backend (an OpenAI-compatible client, an HF Inference Endpoint client, an Ollama client), so switching which model handles a given call is a CONFIGURATION change, not a rewrite of application logic.',
        'What such an abstraction actually has to paper over, concretely: different providers have different REQUEST SHAPES (message formats, parameter names — temperature and top_p are common, but not universal in naming or range), different CONTEXT LENGTH limits (a prompt that fits one model may need truncation for another), different PROMPT-FORMATTING conventions baked into how each model was fine-tuned (chat templates differ — the SFT lesson\'s instruction/response formatting is genuinely model-specific), and different SAFETY/REFUSAL behavior (the same request can be answered by one model and refused by another, based on each provider\'s own alignment choices — the RLHF/DPO lesson\'s preference data, which differs by provider). A well-designed abstraction layer isolates application code from all of this — and this exact pattern (a unified interface over swappable underlying models) is precisely what Part 7\'s agent frameworks are built on, because an agent\'s TOOLS and REASONING LOOP should not need to be rewritten every time you want to try a different underlying model.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Three ways to get an answer from a brain',
      text: 'Word of Vegapunk\'s brain spreads across the seas, and different crews end up accessing "AI-quality" answers in three completely different ways, each with a real trade-off. The wealthiest, best-connected crews simply CALL Vegapunk\'s lab directly by Den Den Mushi whenever they need something answered — his is, hands-down, the single most capable brain in the world, no infrastructure required on their end, just a toll paid per question. The catch, which a sharp young navigator points out uneasily: every question they ask travels straight to Vegapunk\'s lab, and he hears every single one — fine for "what\'s the weather near Alabasta," less fine for a crew planning something they\'d rather nobody outside the ship know about. A second group of captains gets hold of a full BLUEPRINT for a lesser, but still genuinely useful, brain that a rival scientist published openly for any crew to build and run themselves — no ongoing toll to anyone, complete privacy, full rights to retrain it for their own specific needs. But a young shipwright reads the blueprint\'s fine print and discovers it\'s not truly "free to do anything with" — the publishing scientist restricted commercial use above a certain crew size, a real constraint that almost catches out a growing crew who assumed "openly published" meant "no strings attached." And running it is now entirely THEIR problem: their own engineer has to build and maintain the actual processing room, no different from Franky\'s earlier struggles with feeding and serving the thing efficiently. A third, much larger group of small, modest ships just carries a compact, heavily-compressed version small enough to fit in a single cabin — completely private, free once built, but genuinely limited: fine for basic navigation questions, hopeless for anything requiring deep, wide-ranging knowledge. When the Sunny\'s crew finds themselves needing all three at different times — Vegapunk\'s full power for a genuinely hard question, their own smaller trained brain for routine daily tasks, and the pocket version for quick checks with no Den Den Mushi signal at all — Franky designs something clever: one single "ask the brain" panel on the ship\'s console that can be pointed at WHICHEVER brain makes sense for the moment, swapped with one lever rather than rebuilding the whole console every time. When Vegapunk unexpectedly raises his toll rates the following month, the crew barely notices — they just flip the lever toward their own brain for routine work instead, no scramble required.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Three ways to win at trivia',
      text: 'The gang discovers three completely different ways to get expert-level trivia help, and each has a real catch. The fanciest option is a premium trivia hotline — call in, get expert-quality answers instantly, no setup required, just a fee per call. Rachel is the one who points out the obvious catch: every question they ask gets logged by the hotline company, which is a mildly uncomfortable thought when Chandler wants to ask something slightly embarrassing before a big date. A second option: a trivia hobbyist publishes his entire home-built question-and-answer database for free, for anyone to download and run on their own computer. Free forever, totally private, and Ross can even retrain it on Friends-specific trivia the way he\'s always wanted — but Monica actually reads the fine print and finds it\'s licensed "free for personal use only, not for resale," which matters the moment Joey jokingly suggests they charge OTHER trivia teams admission to use their setup. And now it\'s THEIR computer that has to run the thing, which means Chandler is stuck being the one who keeps it working (deja vu from the finals). The third option is a free, offline trivia app on everyone\'s phone — totally private, zero cost, works with no signal at all, but it\'s genuinely limited, fine for a casual car-ride quiz, useless for the serious tournament. When the gang realizes different situations call for different ones of the three — the hotline for big paid tournaments, their home database for weekly bar trivia, the offline app for spontaneous car rides — Chandler, tired of switching setups every time, builds one universal "ask a question" button that works across all three phones, pointed at whichever service fits the moment. When the hotline suddenly jacks up its per-call price the next month, nobody panics — they just point the button at their home database instead, no scramble required.'
    },
    why: 'Three real options — a powerful hosted service you don\'t control and that sees every question (API), a published design you can run and adjust yourself but must operate and license-check yourself (self-hosted open-weight), and a small, totally private, always-available but limited local copy (Ollama-style local model) — and the fix that matters once you actually need more than one of them: build ONE interface that can point at whichever backend fits the moment, so switching is a lever flip, not a rebuild.'
  },
  storyAnim: {
    title: 'One panel, three brains',
    h: 260,
    props: [
      { id: 'vegapunk', emoji: '🧑‍🔬', label: 'Vegapunk\'s lab (hosted API)', x: 15, y: 14 },
      { id: 'privacy', emoji: '👂', label: 'every question heard by the lab', x: 15, y: 40 },
      { id: 'blueprint', emoji: '📜', label: 'published blueprint (open-weight)', x: 50, y: 14 },
      { id: 'license', emoji: '⚖️', label: 'fine print: commercial use restricted', x: 50, y: 40 },
      { id: 'pocket', emoji: '📱', label: 'pocket brain (local, Ollama-style)', x: 82, y: 14 },
      { id: 'limited', emoji: '🔋', label: 'private, free, but limited', x: 82, y: 40 },
      { id: 'panel', emoji: '🎛️', label: 'one "ask the brain" panel', x: 48, y: 74 }
    ],
    actors: [
      { id: 'franky', emoji: '🤖', label: 'Franky', x: 48, y: 58 }
    ],
    steps: [
      { c: 'Option 1: call Vegapunk\'s lab directly. Most powerful, zero setup — but every question travels to his lab and he hears it.', p: { vegapunk: 'lit', privacy: 'bad' } },
      { c: 'Option 2: build a published open blueprint on your own ship. Full control, full privacy — but check the fine print, and you own the upkeep.', p: { blueprint: 'lit', license: 'bad' } },
      { c: 'Option 3: carry a small compressed pocket version. Totally private, free, always available — but genuinely limited.', p: { pocket: 'lit', limited: 'bad' } },
      { c: 'Franky builds ONE panel that can point at any of the three, swapped with a single lever.', p: { panel: 'good' }, a: { franky: [48, 66] } },
      { c: 'When Vegapunk raises his toll, the crew just flips the lever to their own brain instead. No scramble.', p: { panel: 'good', vegapunk: 'dim' } }
    ]
  },
  tech: [
    {
      q: 'Precisely, what does "open-weight" mean, and why is it a meaningfully different guarantee than "open-source"?',
      a: 'Open-weight means a model\'s trained PARAMETERS (the actual numbers making up every weight matrix in every layer) are published and downloadable, allowing anyone to run inference and typically to fine-tune further on top. It does NOT typically include the training DATA (what corpus, filtered and mixed how — the llm-pretraining lesson\'s pipeline) or the exact training code/hyperparameters/recipe used to produce those weights from scratch. Traditional open-source software\'s core guarantee — given the published source, you can independently REPRODUCE the artifact and fully audit what went into it — does not hold for open-weight models: you can use and adapt the weights, but you generally cannot reproduce them from scratch or fully audit their training data provenance. Practical consequences: (1) licensing varies per model and must be checked individually — "open" is not a single legal category, and specific restrictions (commercial-use thresholds, prohibited use cases) are common and easy to miss if you assume all "open" models carry the same permissions; (2) bias, safety, and data-provenance auditing is inherently limited without training data access, relevant to compliance and trust questions in regulated or sensitive deployments; (3) full reproducibility (re-deriving the exact same weights from scratch, a common expectation for open-source software) generally isn\'t possible, which matters for certain research and verification contexts even though it rarely matters for ordinary production use.'
    },
    {
      q: 'Walk through the break-even math between paying per token and self-hosting, and name the factors that can make the "obvious" calculation wrong.',
      a: 'The naive break-even calculation: monthly self-hosting cost (GPU rental or amortized purchase, plus operational overhead) divided by the API\'s price-per-token gives a token-volume threshold — below it, pay-per-token is cheaper; above it, self-hosting is cheaper, since the API cost scales linearly with volume while self-hosting\'s dominant cost is roughly fixed. The factors that complicate this in practice: (1) UTILIZATION — the fixed infrastructure cost only amortizes well if the GPU is actually kept busy; a self-hosted setup running at 20% utilization has an effective per-token cost close to 5x its theoretical best case, and achieving high utilization requires exactly the batching/continuous-batching techniques from the inference-sampling lesson, which is itself nontrivial engineering effort with its own cost. (2) OPERATIONAL OVERHEAD — someone has to provision, monitor, patch, and scale the serving infrastructure; that\'s real, ongoing engineering time that a pure per-token calculation omits entirely, and for a small team, that opportunity cost can dominate the raw hardware math. (3) QUALITY GAP — if the self-hosted open-weight model underperforms the API\'s frontier model on the actual task, the "cheaper" option might require MORE tokens (retries, longer prompts to compensate, human review overhead) to reach acceptable quality, eroding or eliminating the apparent savings. A defensible break-even analysis has to account for all three, not just sticker-price-per-token versus GPU-rental-rate.'
    },
    {
      q: 'What real differences between LLM providers does an "LLM-agnostic" abstraction layer actually have to handle?',
      a: 'Four categories worth naming specifically, since "just write an interface" undersells the real engineering. (1) Request/response shape: different providers use different parameter names, message formats, and default behaviors (e.g., how system prompts are specified, whether streaming is opt-in or default) — an abstraction layer needs an adapter per provider translating a common internal call into each one\'s specific API contract. (2) Context length and tokenization: different models have different maximum context windows and, more subtly, different TOKENIZERS (the tokenization lesson\'s BPE vocabularies differ by model family) — the same text can consume a meaningfully different number of tokens on different models, which affects both cost estimation and whether a prompt fits at all; an agnostic layer needs per-model token counting, not one universal assumption. (3) Prompt formatting conventions: each model\'s SFT/alignment training (the fine-tuning and RLHF lessons) baked in a SPECIFIC expected chat template — the exact special tokens and structure marking user/assistant turns — and using the wrong template for a given model measurably degrades output quality, sometimes severely; an abstraction layer must apply the correct template per backend, not a generic one. (4) Safety/refusal behavior and default output style: different providers\' alignment data (the RLHF/DPO lesson) produces genuinely different behavior on borderline requests, different default verbosity, and different tendencies (e.g., how readily a model adds caveats or refuses) — application code that assumes one model\'s behavioral profile can behave unexpectedly when pointed at a different backend, so testing/evaluation (the model-evaluation lesson\'s discipline) needs to be re-run per backend, not assumed to transfer.'
    },
    {
      q: 'Explain the reasoning behind "model routing" — using different model tiers for different sub-tasks within one system — and what it requires architecturally.',
      a: 'Model routing starts from the observation that a single application typically contains sub-tasks of very different difficulty and different tolerance for error: classifying an incoming request\'s intent, extracting a structured field, answering a genuinely open-ended and ambiguous user question, and performing multi-step reasoning about a complex problem are not equally hard, and don\'t deserve equal spend. Routing directs cheap, high-volume, well-defined sub-tasks (classification, extraction, formatting) to small, fast, often fine-tuned models (a LoRA-adapted small open model can be highly accurate on a NARROW task at a fraction of a frontier model\'s cost and latency), and reserves the most capable (and most expensive) tier for genuinely hard, high-stakes, or open-ended sub-tasks where the extra capability materially changes the outcome. This requires two architectural pieces: first, exactly the LLM-agnostic interface discussed in this lesson, since routing is meaningless if every call is hard-coded to one specific model; second, some mechanism (rule-based, or itself a small classifier) to actually DECIDE which tier a given request needs — sometimes as simple as "this endpoint always uses tier X," sometimes an actual difficulty-estimation step. The payoff, done well, is a system that spends its most expensive capability only where it\'s actually needed — often cutting overall cost substantially while maintaining or even improving quality on the tasks that matter most, since the small models handling routine sub-tasks can be specifically fine-tuned (last lesson) for exactly that job rather than generically capable.'
    }
  ],
  code: {
    title: 'One interface, three backends',
    intro: 'The LLM-agnostic pattern in code — a common interface, one adapter per backend, application logic that never needs to know which one is actually running.',
    code: `from abc import ABC, abstractmethod

class LLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str, temperature: float = 0.7, max_tokens: int = 512) -> str:
        ...

class AnthropicProvider(LLMProvider):
    def __init__(self, client, model="claude-sonnet-5"):
        self.client, self.model = client, model
    def generate(self, prompt, temperature=0.7, max_tokens=512):
        resp = self.client.messages.create(
            model=self.model, max_tokens=max_tokens, temperature=temperature,
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.content[0].text

class HFEndpointProvider(LLMProvider):
    def __init__(self, client, model="meta-llama/Llama-3-70b-instruct"):
        self.client, self.model = client, model
    def generate(self, prompt, temperature=0.7, max_tokens=512):
        formatted = f"<|user|>\\n{prompt}<|assistant|>\\n"        # model-specific chat template!
        return self.client.text_generation(formatted, max_new_tokens=max_tokens, temperature=temperature)

class OllamaProvider(LLMProvider):
    def __init__(self, client, model="llama3"):
        self.client, self.model = client, model
    def generate(self, prompt, temperature=0.7, max_tokens=512):
        resp = self.client.generate(model=self.model, prompt=prompt,
                                     options={"temperature": temperature, "num_predict": max_tokens})
        return resp["response"]

# Application code never touches provider-specific details again:
def summarize(provider: LLMProvider, document: str) -> str:
    return provider.generate(f"Summarize in 2 sentences:\\n\\n{document}", temperature=0.3)

# Swapping backends is now a ONE-LINE change, not a rewrite:
# provider = AnthropicProvider(anthropic_client)      # frontier tier, hosted
# provider = HFEndpointProvider(hf_client)             # self-hosted open-weight
# provider = OllamaProvider(ollama_client)             # local, private, free
result = summarize(provider, document="...")`,
    notes: [
      'The abstract base class LLMProvider defines the CONTRACT (generate(prompt, ...) -> str) — every backend-specific class implements it differently underneath, but application code (summarize()) only ever calls the contract.',
      'Notice HFEndpointProvider bakes in a model-specific chat template (<|user|>...<|assistant|>) — this is exactly the "prompt formatting differs per model" problem from this lesson\'s tech corner, isolated inside the adapter where it belongs, not leaked into application code.',
      'summarize() has zero knowledge of which backend it\'s calling — this is what makes model ROUTING (different tiers for different sub-tasks) straightforward to implement: pass a different provider instance depending on the task, same calling code throughout.',
      'This is the exact pattern Part 7\'s agent frameworks build on: an agent\'s tool-calling and reasoning loop is written once, against this kind of interface, and works against Ollama, Hugging Face, or a hosted API interchangeably.'
    ]
  },
  lab: {
    title: 'Cost estimation, break-even analysis, and the provider-agnostic interface',
    prompt: 'Pure Python, fully runnable. Implement (1) <code>estimate_api_cost(input_tokens, output_tokens, price_per_1k_input, price_per_1k_output)</code> — total dollar cost for one request; (2) <code>breakeven_tokens(monthly_infra_cost, api_price_per_1k_tokens)</code> — the monthly token volume at which self-hosting cost equals API cost; (3) an <code>LLMProvider</code> base pattern — two mock classes, <code>EchoProvider</code> and <code>UppercaseProvider</code>, each with a <code>generate(prompt)</code> method, plus <code>run_agnostic(provider, prompt)</code> that calls <code>.generate()</code> on WHATEVER provider it\'s given, proving the calling code never needs to know which one it is.',
    starter: `def estimate_api_cost(input_tokens, output_tokens, price_per_1k_input, price_per_1k_output):
    # cost = (input_tokens/1000)*price_per_1k_input + (output_tokens/1000)*price_per_1k_output
    ...

def breakeven_tokens(monthly_infra_cost, api_price_per_1k_tokens):
    # token volume where self-hosting cost == API cost
    # api cost for N tokens = (N/1000) * api_price_per_1k_tokens; solve for N when that equals monthly_infra_cost
    ...

class EchoProvider:
    def generate(self, prompt):
        # return the prompt unchanged
        ...

class UppercaseProvider:
    def generate(self, prompt):
        # return the prompt in uppercase
        ...

def run_agnostic(provider, prompt):
    # call .generate() on whatever provider object is passed in
    ...`,
    checks: [
      { re: 'def\\s+estimate_api_cost\\s*\\(', must: true, hint: 'Define estimate_api_cost(input_tokens, output_tokens, price_per_1k_input, price_per_1k_output).', pass: 'estimate_api_cost() defined' },
      { re: 'def\\s+breakeven_tokens\\s*\\(', must: true, hint: 'Define breakeven_tokens(monthly_infra_cost, api_price_per_1k_tokens).', pass: 'breakeven_tokens() defined' },
      { re: 'class\\s+EchoProvider', must: true, hint: 'Define class EchoProvider with a generate(self, prompt) method.', pass: 'EchoProvider defined' },
      { re: 'class\\s+UppercaseProvider', must: true, hint: 'Define class UppercaseProvider with a generate(self, prompt) method.', pass: 'UppercaseProvider defined' },
      { re: 'def\\s+run_agnostic\\s*\\(', must: true, hint: 'Define run_agnostic(provider, prompt) calling provider.generate(prompt).', pass: 'run_agnostic() defined' },
      { re: '\\.generate\\s*\\(', must: true, hint: 'run_agnostic must call .generate(...) on the provider object it receives.', pass: '.generate() called' }
    ],
    tests: `# estimate_api_cost: input and output tokens priced independently
cost = estimate_api_cost(input_tokens=2000, output_tokens=500, price_per_1k_input=0.003, price_per_1k_output=0.015)
expected = (2000/1000)*0.003 + (500/1000)*0.015
assert abs(cost - expected) < 1e-9

# breakeven_tokens: at this volume, API cost would equal the fixed infra cost
monthly_infra_cost = 3000.0
api_price = 0.01   # per 1k tokens
be = breakeven_tokens(monthly_infra_cost, api_price)
implied_api_cost = (be / 1000) * api_price
assert abs(implied_api_cost - monthly_infra_cost) < 1e-6, f"breakeven volume should make API cost == infra cost, got {implied_api_cost}"

# LLMProvider-agnostic interface: run_agnostic works identically regardless of which provider is passed
echo = EchoProvider()
upper = UppercaseProvider()
assert run_agnostic(echo, "hello world") == "hello world"
assert run_agnostic(upper, "hello world") == "HELLO WORLD"

# calling code doesn't need to know which provider it got -- same function, different backends
providers = [EchoProvider(), UppercaseProvider()]
results = [run_agnostic(p, "same prompt") for p in providers]
assert results == ["same prompt", "SAME PROMPT"]
print("Cost math + break-even analysis + the provider-agnostic interface Part 7's agents are built on.")`,
    runnable: true,
    solution: `def estimate_api_cost(input_tokens, output_tokens, price_per_1k_input, price_per_1k_output):
    return (input_tokens / 1000) * price_per_1k_input + (output_tokens / 1000) * price_per_1k_output

def breakeven_tokens(monthly_infra_cost, api_price_per_1k_tokens):
    return (monthly_infra_cost / api_price_per_1k_tokens) * 1000

class EchoProvider:
    def generate(self, prompt):
        return prompt

class UppercaseProvider:
    def generate(self, prompt):
        return prompt.upper()

def run_agnostic(provider, prompt):
    return provider.generate(prompt)`,
    notes: [
      'run_agnostic never checks isinstance(provider, ...) or branches on which class it received — that\'s the entire point of the pattern: any object with a matching .generate(prompt) method works, real providers or test doubles alike (duck typing, Python\'s native support for exactly this pattern).',
      'EchoProvider and UppercaseProvider are deliberately trivial mocks — in the real code lesson above, AnthropicProvider/HFEndpointProvider/OllamaProvider follow the EXACT same shape, just with real network calls inside generate() instead of string manipulation.',
      'breakeven_tokens is a genuinely useful back-of-envelope tool: plug in a real GPU rental quote and a real API price sheet, and get an actual monthly-volume number to check current or projected usage against before committing to either path.'
    ]
  },
  quiz: [
    {
      q: 'What is the main trade-off of using a hosted commercial LLM API versus self-hosting an open-weight model?',
      options: ['APIs require zero infrastructure and offer frontier-tier quality but send data to a third party and cost per token; self-hosting keeps data private and has no per-token fee but requires owning the entire serving stack and infrastructure cost', 'APIs are always cheaper than self-hosting at any volume', 'Self-hosted models are always higher quality than hosted APIs', 'There is no meaningful difference between the two approaches'],
      correct: 0,
      explain: 'Convenience and quality ceiling versus control and data privacy — a genuine trade-off, not a strictly-better option in either direction, and the right choice depends on the specific constraints of the task.'
    },
    {
      q: 'What does "open-weight" mean, and how does it differ from "open-source"?',
      options: ['Open-weight publishes the trained parameters but typically not the training data or full training code, so the model can be used and fine-tuned but not fully reproduced or audited from scratch', 'Open-weight and open-source are interchangeable terms describing the same thing', 'Open-weight means the model can only be used for non-commercial purposes', 'Open-weight requires the training data to be published, unlike open-source'],
      correct: 0,
      explain: 'Traditional open-source lets you reproduce and fully audit an artifact from its source; open-weight models let you use and adapt the trained weights without that same reproducibility or data-provenance guarantee.'
    },
    {
      q: 'Why does self-hosting only become cost-effective above a certain usage volume?',
      options: ['Self-hosting has a largely fixed infrastructure cost that must be amortized across usage, while API costs scale linearly with volume from zero — below the break-even point, the fixed cost outweighs what the API would have charged', 'Self-hosted models always cost more regardless of volume', 'API providers charge a one-time fee rather than a per-token fee', 'Self-hosting has no fixed costs at any volume'],
      correct: 0,
      explain: 'Below break-even, paying per token is cheaper than provisioning largely-fixed infrastructure; above it, high utilization lets the fixed cost be amortized across enough requests to beat per-token pricing.'
    },
    {
      q: 'Why is "always use the biggest, most capable model" usually the wrong default for a production system with multiple sub-tasks?',
      options: ['Many sub-tasks are simple, high-volume, and well-defined enough that a smaller, cheaper, faster (often fine-tuned) model performs just as well at a fraction of the cost and latency, reserving the largest model for genuinely hard sub-tasks', 'Larger models are always less accurate than smaller ones', 'Smaller models cannot be fine-tuned', 'Frontier models cannot be used for any task requiring speed'],
      correct: 0,
      explain: 'Model routing — matching tier to task difficulty — often cuts cost substantially while maintaining quality, since narrow high-volume tasks are often better served (and cheaper) with a small, specialized model.'
    },
    {
      q: 'What specifically must an LLM-agnostic abstraction layer handle to actually make model-swapping safe?',
      options: ['Differences in request/response format, context length and tokenization, model-specific prompt/chat-template conventions, and differing safety/refusal behavior across providers', 'Nothing — all LLM providers expose an identical API and behave identically', 'Only differences in pricing, since all other behavior is standardized', 'Only the choice of programming language used to call each provider'],
      correct: 0,
      explain: 'Real differences in API shape, tokenization, required chat templates, and alignment-driven behavior all need to be isolated inside provider-specific adapters — a naive interface that ignores these can silently degrade output quality when switched.'
    }
  ],
  pitfalls: [
    'Assuming all "open" LLMs share the same license terms — commercial-use restrictions, user-count thresholds, and prohibited-use clauses genuinely vary per model and must be checked individually before depending on a specific one.',
    'Comparing self-hosting cost to API cost using only the sticker price of GPU rental, ignoring utilization, operational overhead, and any quality gap that might require more tokens/retries to close — all three change the real break-even point.',
    'Defaulting to the largest, most expensive model for every sub-task in a system "to be safe" — this leaves real cost and latency savings on the table for the many sub-tasks that don\'t need frontier-level capability, and doesn\'t automatically produce better results on narrow, well-defined tasks a fine-tuned small model would handle just as well.',
    'Hard-coding a specific provider\'s API shape, prompt template, or parameter names throughout application code — this makes switching providers (for cost, reliability, or capability reasons) a painful rewrite instead of a configuration change.',
    'Assuming a prompt engineered and tested against one model will behave identically on another — different chat templates, different alignment training, and different default verbosity mean prompts and evaluation (the model-evaluation lesson\'s discipline) need to be re-validated per backend, not assumed to transfer.',
    'Treating Ollama/local models as a viable PRODUCTION serving solution for many concurrent users — it is an excellent tool for development, prototyping, and privacy-critical single-user cases, but lacks the batching/concurrency infrastructure (the inference-sampling lesson\'s serving techniques) that real multi-user production serving requires.'
  ],
  interview: [
    {
      q: 'A startup asks whether they should use a hosted API or self-host an open-weight model for their new product. What questions do you ask before recommending either?',
      a: 'Rather than defaulting to either option, I\'d establish the actual constraints first. Volume and predictability: what\'s the expected monthly token volume, and how does it compare to the rough break-even point between API pricing and self-hosting\'s largely-fixed infrastructure cost — at low or unpredictable volume, the API\'s zero-fixed-cost, scales-with-usage model is usually safer even if self-hosting would theoretically be cheaper at scale. Data sensitivity: does the product handle regulated or highly sensitive data where sending it to a third-party API is a compliance non-starter — if so, self-hosting (or even local, for small-scale cases) may be effectively mandatory regardless of cost math. Team capability: does the team have (or can they afford to hire/build) the ops expertise to run a production LLM serving stack — GPU provisioning, batching, monitoring, the inference-sampling lesson\'s whole toolkit — because a self-hosting decision without that capability tends to produce a worse, less reliable, and often ultimately MORE expensive system than just paying an API provider to solve that problem. Quality requirements: does the task genuinely need frontier-tier capability, or would a fine-tuned open model (LoRA, last-lesson\'s technique) specialized on the actual task match it at lower cost — this requires an actual benchmark on the real task, not an assumption in either direction. My default recommendation for an early-stage startup without a proven usage pattern yet: start with a hosted API (fastest to ship, lowest fixed risk), instrument cost and volume carefully, and revisit self-hosting once there\'s real usage data to run an honest break-even analysis against — building for scale you don\'t have yet is a classic, avoidable early-stage mistake.'
    },
    {
      q: 'Design the internal LLM-provider interface for a system that needs to support Anthropic\'s API, a self-hosted Hugging Face model, and Ollama for local development — what does the interface need to abstract, and what should stay OUTSIDE the abstraction?',
      a: 'The interface itself should be minimal and stable: something like generate(prompt, temperature, max_tokens) -> str (or a streaming variant), implemented once per backend as an adapter class. INSIDE each adapter, hide: the specific API request/response shape for that provider; the correct model-specific chat/prompt template (critical — using the wrong template for a self-hosted model measurably degrades quality, and this is a common, subtle bug when models are swapped without updating templates); provider-specific parameter name/range differences (temperature ranges, top_p availability); and authentication/connection details. OUTSIDE the abstraction — deliberately NOT hidden — should be: (1) capability differences that affect application LOGIC, not just plumbing — if a task genuinely requires a capability only some backends have (e.g., function/tool calling support, very long context), the application needs to know which backend it\'s actually talking to for THAT decision, even if the day-to-day generate() call is uniform; (2) cost and latency characteristics, which should be observable/loggable per call so routing and cost-monitoring decisions (this lesson\'s "model routing" pattern) can be made with real data, not hidden inside an opaque black box; (3) evaluation — the model-evaluation lesson\'s discipline means the interface should make it easy to run the SAME test suite against different backends and compare results directly, since prompt behavior isn\'t guaranteed to transfer across models even through an identical interface. The goal isn\'t to make all providers look IDENTICAL in every respect — some differences are real and matter for decision-making — the goal is to make the MECHANICAL plumbing differences (that carry no decision-relevant information) invisible to application code, while keeping genuinely consequential differences visible and measurable.'
    },
    {
      q: 'Your production system currently routes all requests to a single frontier API model. Costs have grown significantly with usage. Walk through how you\'d approach reducing cost without degrading user-facing quality.',
      a: 'Start with measurement, not architecture changes: instrument the system to break down current usage by REQUEST TYPE/endpoint, not just aggregate volume — the model-evaluation lesson\'s discipline applied to cost analysis. The likely finding in most real systems: usage is dominated by a mix of genuinely hard, open-ended requests and much simpler, high-volume, well-defined sub-tasks (classification, extraction, formatting, simple Q&A) that don\'t need frontier-level reasoning. For the well-defined, high-volume subset: evaluate whether a smaller open-weight model, ideally fine-tuned (LoRA, per the fine-tuning lesson) on examples specifically from THIS system\'s actual traffic, matches the frontier model\'s quality on THAT specific sub-task — measured on a real held-out evaluation set drawn from production traffic, not assumed. If it does (a very common outcome for narrow, well-defined tasks), route that traffic to the smaller model — self-hosted if volume justifies the break-even math from this lesson, or a cheaper hosted tier otherwise — while keeping the frontier model for the genuinely hard remaining requests (model routing, this lesson\'s pattern). This requires the LLM-agnostic interface to already exist (or be built first) so routing is a configuration/logic change rather than a rewrite. Secondary levers worth checking in parallel: whether prompts are longer than necessary (unneeded context inflates input-token cost directly), whether output length is unnecessarily verbose (max_tokens and prompt instructions can bound this), and whether caching is being used for any requests with repeated or near-identical prompts. The key discipline throughout: every cost-reduction change should be validated against a real quality metric on production-representative data BEFORE and AFTER the change, not shipped on the assumption that "smaller model = probably fine" — cost savings that quietly degrade user-facing quality are a common, avoidable failure mode of this exact optimization.'
    }
  ]
};
