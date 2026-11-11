window.LESSONS = window.LESSONS || {};
window.LESSONS['llm-api-fundamentals'] = {
  id: 'llm-api-fundamentals',
  title: 'LLM APIs: Messages, Tokens, Sampling, Context Windows & Cost',
  category: 'Part 0 — LLM Building Blocks',
  timeMin: 35,
  summary: `Every agent, RAG system and eval harness you will build is a loop around one stateless HTTP call: send a list of messages, get back a list of content blocks, a stop_reason and a usage record. This lesson takes that call apart. You will see what a token is and why counts are model-specific, what temperature and top_p actually do to the next-token distribution (and why current Claude models no longer let you set them), how the context window bounds input plus output, where latency and cost come from, and how streaming, prompt caching and the Batch API change those numbers. Code uses the Anthropic Python SDK; OpenAI equivalents are noted where the shapes differ.`,
  goals: [
    'Write a Messages API call from memory and name every field of the response that matters: <code>content</code> blocks, <code>stop_reason</code>, <code>usage</code>',
    'Explain tokenization (BPE-style subwords), why token counts differ across models, and how to count tokens correctly before sending',
    'Implement temperature scaling and top-p (nucleus) filtering by hand and explain why temperature 0 is still not perfectly deterministic',
    'Reason about the context window as a shared budget for input and output, and about cost growth in multi-turn agent loops',
    'Estimate the cost of a workload, and cut it with prompt caching, batching, model choice and output-length control'
  ],
  concept: [
    {
      h: 'The one call underneath everything: a stateless Messages request',
      p: [
        `An LLM chat API is a pure function over the request body. You send <code>model</code>, <code>max_tokens</code>, an optional top-level <code>system</code> prompt and a <code>messages</code> list of alternating <code>user</code>/<code>assistant</code> turns. The server keeps no conversation state between calls: "memory" in a chatbot is the client re-sending the whole transcript every turn. That one fact explains most of the cost and latency behaviour in later lessons.`,
        `The response is not a string. <code>resp.content</code> is a list of typed blocks: <code>text</code>, <code>tool_use</code>, <code>thinking</code>, and others. Code that does <code>resp.content[0].text</code> breaks the day the model emits a thinking block or a tool call first, so iterate and branch on <code>block.type</code>. <code>resp.stop_reason</code> tells you why generation ended: <code>end_turn</code> (finished naturally), <code>max_tokens</code> (truncated by your cap), <code>stop_sequence</code>, <code>tool_use</code> (wants you to run a tool), <code>pause_turn</code> (a long server-side tool turn paused and can be resumed) or <code>refusal</code>. <code>resp.usage</code> carries <code>input_tokens</code>, <code>output_tokens</code> and the cache counters you are billed on.`,
        `<b>OpenAI equivalent:</b> Chat Completions puts the system prompt inside <code>messages</code> as <code>{"role": "system"}</code>, returns <code>choices[0].message.content</code> (a string) and <code>finish_reason</code> (<code>stop</code>, <code>length</code>, <code>tool_calls</code>), and reports <code>usage.prompt_tokens</code>/<code>completion_tokens</code>. The newer Responses API returns a list of output items, closer to Anthropic's block list. Same concepts, different field names.`
      ],
      code: "import anthropic\n\nclient = anthropic.Anthropic()          # reads ANTHROPIC_API_KEY (or an `ant auth login` profile)\n\nresp = client.messages.create(\n    model=\"claude-opus-5-5\",\n    max_tokens=1024,                    # hard cap on OUTPUT tokens; hitting it gives stop_reason=\"max_tokens\"\n    system=\"You are a terse SE research assistant.\",\n    messages=[\n        {\"role\": \"user\", \"content\": \"Define a flaky test in one sentence.\"},\n    ],\n)\nprint(resp.stop_reason)                 # \"end_turn\" | \"max_tokens\" | \"stop_sequence\" | \"tool_use\" | \"refusal\" | ...\nfor block in resp.content:              # content is a LIST of typed blocks, not a string\n    if block.type == \"text\":\n        print(block.text)\nprint(resp.usage.input_tokens, resp.usage.output_tokens)\n"
    },
    {
      h: 'Tokens: the unit of context, latency and money',
      p: [
        `Models read and write <b>tokens</b>, subword pieces produced by a learned tokenizer (byte-pair encoding and its relatives). Common English words are often one token; rare words, identifiers like <code>getUserByIdOrThrow</code>, numbers, whitespace-heavy code and non-English text split into many. A rough rule of thumb for English prose is a few characters per token, but treat it as a sketch, not a measurement.`,
        `Tokenizers are <b>model-specific</b>. The same prompt yields different counts on different model families, and even within one vendor a new tokenizer can change counts noticeably (Anthropic notes the tokenizer introduced with Opus 4.7 uses roughly 1x to 1.35x as many tokens as earlier ones on the same text). So never estimate Claude tokens with OpenAI's <code>tiktoken</code>: call <code>client.messages.count_tokens(model=..., messages=...)</code>, which is free and uses the exact tokenizer of the model you name.`,
        `Why interviewers care: tokens are simultaneously the context limit, the billing unit, and (for output) the latency unit, since decoding produces one token per forward pass. "Make it cheaper and faster" usually means "send fewer input tokens and generate fewer output tokens".`
      ]
    },
    {
      h: 'Sampling: temperature, top_p, top_k, and what you can still control',
      p: [
        `At each step the model produces a logit per vocabulary entry. <b>Temperature</b> divides the logits before softmax: <code>p_i = exp(z_i/T) / sum_j exp(z_j/T)</code>. T below 1 sharpens the distribution toward the top token, T above 1 flattens it, and T approaching 0 becomes greedy argmax. <b>top_k</b> keeps only the k most likely tokens. <b>top_p</b> (nucleus sampling, Holtzman et al. 2019) keeps the smallest set of tokens whose cumulative probability reaches p, then renormalizes, so the candidate set shrinks when the model is confident and grows when it is not.`,
        `<b>Current-API reality:</b> on Claude 4.7 and later models these parameters accept only their defaults, and under API version <code>2026-10-21</code> sending <code>temperature</code>, <code>top_p</code> or <code>top_k</code> returns a 400 on every model. Your levers on those models are the prompt, <code>output_config.effort</code> (<code>low</code> to <code>max</code>, which trades thinking depth and token spend), structured outputs, and <code>max_tokens</code>. Many OpenAI chat models still accept <code>temperature</code>/<code>top_p</code> (their reasoning models restrict them), so know the math even if you cannot always turn the knob.`,
        `<b>Determinism:</b> even greedy decoding is not bit-reproducible on hosted APIs. Batched GPU kernels change floating-point reduction order with batch composition, near-tied logits flip, and mixture-of-experts routing can differ. OpenAI's <code>seed</code> parameter is documented as best-effort. For evals this means you measure variance by repeated sampling rather than assuming one run is the answer, a theme the eval-statistics lesson builds on.`
      ]
    },
    {
      h: 'Context windows: one budget for input and output',
      p: [
        `The <b>context window</b> is the maximum number of tokens the model can attend to in one request, and it covers the prompt plus everything generated in that call. Current Claude models have 1M-token windows with up to 128K output tokens. So the check is <code>input_tokens + max_tokens &lt;= window</code>; setting <code>max_tokens</code> too low truncates (you see <code>stop_reason == "max_tokens"</code>), and the SDKs want streaming for very large <code>max_tokens</code> so the HTTP request does not time out.`,
        `A large window is not free recall. Models retrieve facts placed in the middle of long contexts less reliably than those near the beginning or end ("Lost in the Middle", Liu et al. 2023), and quality on long, noisy contexts degrades in ways short benchmarks do not show. Practical consequences: put instructions and the question where the model reliably uses them, prune stale tool output, and prefer retrieval over dumping a whole repository into the prompt.`,
        `In an agent loop the transcript grows every turn and is re-sent every turn, so total input tokens grow roughly quadratically with the number of turns. This is why agent harnesses use prompt caching, tool-result clearing, and summarization/compaction (Anthropic offers server-side compaction and context editing as beta features).`
      ]
    },
    {
      h: 'Latency, cost, streaming, caching and batching',
      p: [
        `<b>Latency</b> has two parts: time to first token (TTFT), dominated by processing the input ("prefill"), and the decode phase, roughly proportional to output tokens. Streaming (<code>client.messages.stream(...)</code>, server-sent events: <code>message_start</code>, <code>content_block_start</code>, <code>content_block_delta</code>, <code>content_block_stop</code>, <code>message_delta</code>, <code>message_stop</code>) does not shorten total time; it shows progress at TTFT and avoids HTTP timeouts on long generations.`,
        `<b>Cost</b> is <code>input_tokens x input_price + output_tokens x output_price</code>, and output is typically about 5x the input price (Claude Opus 5.5 lists $4 / $20 per million tokens, Sonnet 5.5 $2 / $10). Thinking tokens bill as output.`,
        `<b>Prompt caching</b> is a prefix match over the render order tools, then system, then messages. Mark a breakpoint with <code>cache_control: {"type": "ephemeral"}</code> (or use the top-level automatic form). The first request writes the cache at a premium (1.25x input for the 5-minute TTL, 2x for 1-hour); later requests with a byte-identical prefix read it at a small fraction of the input price and with lower TTFT. Any byte change in the prefix (a timestamp in the system prompt, a reordered tool list, unsorted JSON) silently invalidates everything after it, so verify with <code>usage.cache_read_input_tokens</code>. OpenAI caches long prompt prefixes automatically without markers; the same prefix-stability discipline applies.`,
        `<b>Message Batches</b> (<code>client.messages.batches.create</code>) run asynchronously at 50% of standard price, most batches finish within an hour and all within 24 hours; results come back in any order, so key them by <code>custom_id</code>. For offline evals this is usually the cheapest knob you have.`
      ],
      code: "import anthropic\n\nclient = anthropic.Anthropic()\nBIG_SPEC = open(\"style_guide.md\").read()          # large, stable prefix (must exceed the model's cache minimum)\n\n# Streaming: tokens arrive as server-sent events; time-to-first-token drops, total time does not.\nwith client.messages.stream(\n    model=\"claude-opus-5-5\",\n    max_tokens=4096,\n    system=[{\"type\": \"text\", \"text\": BIG_SPEC,\n             \"cache_control\": {\"type\": \"ephemeral\"}}],   # breakpoint: cache everything up to here\n    messages=[{\"role\": \"user\", \"content\": \"Review this diff: ...\"}],\n) as stream:\n    for text in stream.text_stream:\n        print(text, end=\"\", flush=True)\n    final = stream.get_final_message()\n\nu = final.usage\nprint(\"\\nwrite:\", u.cache_creation_input_tokens, \"read:\", u.cache_read_input_tokens, \"uncached:\", u.input_tokens)\n\n# Count before you send (model-specific tokenizer; do not estimate Claude tokens with tiktoken)\nn = client.messages.count_tokens(model=\"claude-opus-5-5\",\n                                 messages=[{\"role\": \"user\", \"content\": BIG_SPEC}])\nprint(n.input_tokens)\n"
    }
  ],
  deepDive: {
    timeMin: 12,
    intro: 'What interviewers probe after the basics: why caching works mechanically, why agent loops get expensive, rate limits, and how thinking and effort change the cost model.',
    sections: [
      {
        h: 'Why prefix caching exists: the KV cache',
        p: [
          `During prefill a transformer computes key and value vectors for every input token at every layer. Decoding then reuses them, which is why generating token n+1 does not recompute tokens 1..n. Prompt caching persists those keys and values on the server between requests. Because each token's representation depends on everything before it (causal attention), cached state is only valid for an identical prefix: change token 50 and every token after 50 must be recomputed. That is the mechanical reason caching is prefix-based and why "stable content first, volatile content last" is the whole design rule.`,
          `Minimum cacheable prefix lengths are model-dependent (512 tokens on the newest Claude models, larger on some older ones); shorter prefixes are simply not cached, with no error. Up to 4 breakpoints per request let you cache layers that change at different rates, for example tool definitions plus system prompt (rarely), then a long document (per session), then the growing conversation (per turn).`
        ]
      },
      {
        h: 'The quadratic agent bill, worked',
        p: [
          `Suppose a 30k-token prefix (system prompt plus tool schemas), each turn adds 800 tokens of tool output, and the agent runs 20 turns. Without caching you pay for roughly 20 x 30k = 600k prefix tokens plus the growing tail, which is about sum_{t=1..20} 800t = 168k more. With the prefix cached, 19 of those 20 prefix reads bill at the cache-read rate. The worked example below computes this for Opus 5.5 and shows roughly a 5x difference just from one breakpoint. In interviews, say the formula out loud before giving numbers.`
        ]
      },
      {
        h: 'Rate limits and errors',
        p: [
          `Anthropic enforces limits on requests per minute and on input and output tokens per minute, per model; OpenAI uses RPM and TPM similarly. Exceeding them returns HTTP 429 with a <code>retry-after</code> header. 5xx errors (including 529 "overloaded" on Anthropic) are transient. The Python SDK retries 408/409/429/5xx and connection errors twice by default with exponential backoff (<code>max_retries</code> configures it). 400-class validation errors are not retryable: retrying a malformed request burns quota and returns the same 400. In code, catch from most specific to least: <code>anthropic.RateLimitError</code>, then <code>anthropic.APIStatusError</code> (check <code>status_code</code>), then <code>anthropic.APIConnectionError</code>.`
        ]
      },
      {
        h: 'Thinking and effort change the cost model',
        p: [
          `Current Claude models think adaptively: the model decides how much to reason before answering, and <code>output_config={"effort": "low"|"medium"|"high"|"xhigh"|"max"}</code> steers how much. On Claude Opus 5.5 thinking cannot be disabled and the default effort is <code>medium</code>; lowering effort is how you buy latency and cost back. Because thinking tokens bill as output, an eval that compares two models at different default efforts is partly comparing token budgets. Record effort and usage with every eval run.`
        ],
        code: "import anthropic\nfrom anthropic.types.message_create_params import MessageCreateParamsNonStreaming\nfrom anthropic.types.messages.batch_create_params import Request\n\nclient = anthropic.Anthropic()\nbatch = client.messages.batches.create(requests=[\n    Request(custom_id=f\"item-{i}\",\n            params=MessageCreateParamsNonStreaming(\n                model=\"claude-sonnet-5-5\", max_tokens=512,\n                messages=[{\"role\": \"user\", \"content\": q}]))\n    for i, q in enumerate([\"Summarize A\", \"Summarize B\"])\n])\n# later: poll client.messages.batches.retrieve(batch.id).processing_status == \"ended\",\n# then iterate client.messages.batches.results(batch.id) and key results by custom_id (order is not preserved)\n"
      }
    ]
  },
  story: {
    onePiece: {
      title: 'Nami and the Forgetful Den Den Mushi',
      text: [
        `The Sunny's long-range Den Den Mushi can reach a navigator-for-hire at Marine HQ prices: every syllable spoken into it and every syllable it speaks back is billed, the replies cost five times as much, and the snail remembers nothing between calls. When Nami calls back to continue a route calculation, she has to read the entire previous conversation into the receiver again before asking the new question.`,
        `Nami, being Nami, optimises. She keeps the standing instructions (charts, the crew's rules, the ship's specs) at the very start of every call, word-for-word identical, because the operator charges far less for "the same opening as last time" when it matches exactly. If Usopp adds today's date to the opening line, the match breaks and the full price returns. She caps how long the snail may talk; once a long answer was cut off mid-coordinate, and the operator's note said only "stopped: length limit". For non-urgent questions she mails a stack of them to HQ overnight at half price, and the answers come back in a random order, each tagged with her reference number.`
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon Bills Leonard by the Syllable',
      text: [
        `Picture Sheldon, annoyed at being asked the same questions, announcing a pricing scheme: Leonard pays per syllable for the question and five times that per syllable of Sheldon's answer, and Sheldon refuses to remember any previous conversation, "for reproducibility". Leonard must recap everything each time. Leonard starts every request with the exact same preamble so Sheldon can say "Ah, the standard preamble, discounted rate." Penny, asked to deliver one question, adds "Hi sweetie, it is Tuesday" to the front, and Sheldon charges full price for the whole preamble because it no longer matches.`,
        `Leonard also learns to say "answer in under fifty words", because Sheldon stops precisely at the limit even if mid-sentence, and Raj discovers that asking Sheldon to "be creative" changes the answer every time while Amy's "just give me your single best guess" usually gives the same one, though not always, since Sheldon claims his neurons are "non-deterministically batched".`
      ]
    },
    why: 'The snail and Sheldon are a stateless API: the client re-sends the whole transcript each call, input and output are priced per token with output dearer, an identical opening prefix is discounted (prompt caching) and any change to it voids the discount, a length cap truncates (stop_reason max_tokens), overnight mail is the Batch API (half price, unordered, keyed by ID), and "be creative" vs "single best guess" is high vs low temperature, with even the greedy answer not perfectly reproducible.'
  },
  storyAnim: {
    title: 'Every call re-reads the log',
    h: 260,
    props: [
      { id: 'snail', emoji: '🐌', label: 'Den Den Mushi (stateless)', x: 50, y: 18 },
      { id: 'log', emoji: '📜', label: 'full transcript, re-read each call', x: 18, y: 18 },
      { id: 'prefix', emoji: '🗺️', label: 'identical opening (cached prefix)', x: 18, y: 50 },
      { id: 'meter', emoji: '💰', label: 'per-syllable meter: out costs 5x', x: 82, y: 18 },
      { id: 'cut', emoji: '✂️', label: 'length cap: stop_reason max_tokens', x: 82, y: 50 },
      { id: 'mail', emoji: '📮', label: 'overnight mail: half price, any order', x: 50, y: 78 }
    ],
    actors: [
      { id: 'nami', emoji: '🧭', label: 'Nami', x: 30, y: 72 },
      { id: 'usopp', emoji: '🤥', label: 'Usopp', x: 70, y: 78 }
    ],
    steps: [
      { c: 'Nami calls the snail. It remembers nothing from yesterday, so she reads the whole log in again.', p: { snail: 'lit', log: 'lit' }, a: { nami: [30, 45] } },
      { c: 'Every syllable in and out is metered, and the snail\'s replies cost five times as much as hers.', p: { meter: 'lit' } },
      { c: 'She opens every call with the same charts and rules, word for word, so the operator bills the opening at the discounted "same as last time" rate.', p: { prefix: 'good' } },
      { c: 'Usopp adds today\'s date to the opening. The match breaks and the whole opening is billed at full price again.', p: { prefix: 'bad' }, a: { usopp: [26, 60] } },
      { c: 'Nami sets a length cap. A long answer is cut mid-coordinate: the operator note says "stopped: length".', p: { cut: 'bad', prefix: 'good' }, a: { usopp: [70, 78] } },
      { c: 'Non-urgent questions go by overnight mail: half price, answers return in random order tagged with her reference numbers.', p: { mail: 'good' }, a: { nami: [42, 70] } }
    ]
  },
  conceptFlow: {
    title: 'Anatomy of one Messages API call',
    intro: 'Click a box to jump to it, or press Play.',
    stages: [
      { label: 'Build request', nodes: [
        { id: 'req', text: 'tools + system + messages\nmodel, max_tokens, effort' },
        { id: 'count', text: 'count_tokens (optional)\nmodel-specific tokenizer' }
      ] },
      { label: 'Prefill', nodes: [
        { id: 'cache', text: 'Prefix cache lookup\nidentical prefix = cache read' },
        { id: 'prefill', text: 'Process uncached tokens\ndrives time-to-first-token' }
      ] },
      { label: 'Decode loop', nodes: [
        { id: 'logits', text: 'Logits for next token' },
        { id: 'sample', text: 'Sample (temperature, top_p)\none token per step' },
        { id: 'stream', text: 'Stream deltas (SSE)\ncontent_block_delta' }
      ] },
      { label: 'Stop', nodes: [
        { id: 'stop', text: 'stop_reason\nend_turn / max_tokens / tool_use' }
      ] },
      { label: 'Bill', nodes: [
        { id: 'usage', text: 'usage: input, output,\ncache write / read tokens' }
      ] }
    ],
    steps: [
      { active: ['req'], note: 'The client assembles the full request. The server is stateless, so the whole conversation goes in every time, rendered in the order tools, system, messages.' },
      { active: ['count'], note: 'Optionally count tokens first with the exact tokenizer of the target model, to check the window and estimate cost.' },
      { active: ['cache'], note: 'The server checks whether a byte-identical prefix up to a cache breakpoint was processed recently. If so, its key/value state is reused and billed at the cache-read rate.' },
      { active: ['prefill'], note: 'Remaining tokens are processed in parallel. This prefill phase is most of the time to first token.' },
      { active: ['logits', 'sample'], note: 'Decoding is sequential: compute logits, turn them into a distribution, pick one token, append it, repeat. Temperature and nucleus filtering act here.' },
      { active: ['stream'], note: 'With streaming, each token chunk is sent as a server-sent event as soon as it exists, so the user sees progress at TTFT.' },
      { active: ['stop'], note: 'Generation stops at a natural end, the max_tokens cap, a stop sequence, or because the model emitted a tool_use block and is waiting for you.' },
      { active: ['usage'], note: 'The response reports uncached input, cache writes, cache reads and output tokens. Multiply each by its price to get the bill for this call.' }
    ]
  },
  tech: [
    {
      q: 'Why is the response a list of content blocks instead of a string?',
      a: `Because one assistant turn can contain several kinds of output: reasoning (<code>thinking</code>), prose (<code>text</code>), one or more tool calls (<code>tool_use</code>, possibly in parallel), server-tool results, and citations attached to text. A list of typed blocks lets the client route each part correctly and, critically, lets you append the assistant's turn back into <code>messages</code> unchanged, which tool use and thinking both require.`
    },
    {
      q: 'What exactly does max_tokens limit, and what happens when you hit it?',
      a: `It caps the tokens generated in this response (thinking included), not the input. When reached, generation stops wherever it is, <code>stop_reason</code> is <code>max_tokens</code>, and any partially written JSON or tool call is incomplete. Production code checks <code>stop_reason</code> before parsing. Setting it generously costs nothing by itself, since you pay for tokens actually generated, though a very large value requires streaming to avoid HTTP timeouts.`
    },
    {
      q: 'Why does a timestamp in the system prompt destroy caching?',
      a: `Cache hits require a byte-identical prefix up to the breakpoint, and the system prompt is rendered before the messages. A value that changes every request (a timestamp, a request ID, a randomly ordered set serialized to JSON) makes every request a cache miss and every request pays the write premium on top. Move volatile values into the latest user message, after the last breakpoint, and confirm hits with <code>usage.cache_read_input_tokens</code>.`
    },
    {
      q: 'If the API is stateless, how do "assistant memory" features work?',
      a: `They are client-side or tool-side constructs layered on top: the client keeps the transcript, a memory tool reads and writes files the model can consult, or a server-side helper (threads, compaction) holds or summarizes the history for you. The model itself only ever sees what is in the current request.`
    }
  ],
  code: {
    title: 'Sampling math and a cost model you can run offline',
    intro: 'No API key needed. The first half shows what temperature and top_p do to a real-looking next-token distribution; the second half prices a 20-turn agent session on Opus 5.5 with and without one cache breakpoint.',
    code: "\"\"\"sampling_and_cost.py - what the API does with logits, and what a call costs.\nRuns offline: python3 sampling_and_cost.py   (no API key, no third-party packages).\"\"\"\nimport math\nimport random\n\n# ---- 1. Sampling: logits -> probabilities -> one token ------------------------\nVOCAB = [\"Paris\", \"paris\", \"Lyon\", \"the\", \"France\", \"<eos>\"]\nLOGITS = [6.0, 3.5, 2.0, 1.0, 0.5, -1.0]   # what the model emits for the next position\n\n\ndef softmax_with_temperature(logits, temperature):\n    \"\"\"T<1 sharpens the distribution, T>1 flattens it, T->0 is argmax (greedy).\"\"\"\n    if temperature <= 0:\n        best = max(range(len(logits)), key=lambda i: logits[i])\n        return [1.0 if i == best else 0.0 for i in range(len(logits))]\n    scaled = [x / temperature for x in logits]\n    m = max(scaled)                                   # subtract max for numerical stability\n    exps = [math.exp(x - m) for x in scaled]\n    z = sum(exps)\n    return [e / z for e in exps]\n\n\ndef top_p_filter(probs, top_p):\n    \"\"\"Nucleus sampling: keep the smallest set of tokens whose mass >= top_p, renormalize.\"\"\"\n    order = sorted(range(len(probs)), key=lambda i: probs[i], reverse=True)\n    kept, mass = [], 0.0\n    for i in order:\n        kept.append(i)\n        mass += probs[i]\n        if mass >= top_p:\n            break\n    total = sum(probs[i] for i in kept)\n    return [probs[i] / total if i in kept else 0.0 for i in range(len(probs))]\n\n\ndef sample(probs, rng):\n    r, acc = rng.random(), 0.0\n    for i, p in enumerate(probs):\n        acc += p\n        if r < acc:\n            return i\n    return len(probs) - 1\n\n\nrng = random.Random(0)\nfor t in (0.0, 0.5, 1.0, 1.5):\n    p = softmax_with_temperature(LOGITS, t)\n    print(f\"T={t:<4} P(Paris)={p[0]:.3f}  P(paris)={p[1]:.3f}  P(<eos>)={p[5]:.4f}\")\n\np = top_p_filter(softmax_with_temperature(LOGITS, 1.5), top_p=0.9)\nprint(\"top_p=0.9 at T=1.5 keeps:\", [VOCAB[i] for i, x in enumerate(p) if x > 0])\ndraws = [VOCAB[sample(p, rng)] for _ in range(1000)]\nprint(\"1000 draws:\", {w: draws.count(w) for w in sorted(set(draws))})\n\n# ---- 2. Cost: tokens x price, with prompt caching ----------------------------\n# USD per million tokens (Anthropic list prices, check the pricing page before relying on them)\nPRICES = {\n    \"claude-opus-5-5\":   {\"in\": 4.00, \"out\": 20.00, \"cache_read\": 0.20},\n    \"claude-sonnet-5-5\": {\"in\": 2.00, \"out\": 10.00, \"cache_read\": 0.10},\n}\nCACHE_WRITE_MULT = 1.25   # 5-minute TTL write premium (1-hour TTL is 2x)\n\n\ndef request_cost(model, usage):\n    \"\"\"usage mirrors response.usage: input_tokens is the UNCACHED remainder.\"\"\"\n    pr = PRICES[model]\n    dollars = (usage[\"input_tokens\"] * pr[\"in\"]\n               + usage.get(\"cache_creation_input_tokens\", 0) * pr[\"in\"] * CACHE_WRITE_MULT\n               + usage.get(\"cache_read_input_tokens\", 0) * pr[\"cache_read\"]\n               + usage[\"output_tokens\"] * pr[\"out\"])\n    return dollars / 1_000_000\n\n\n# An agent that re-sends a 30k-token system prompt + tool list on each of 20 turns.\nPREFIX, TAIL, OUT, TURNS = 30_000, 800, 400, 20\nno_cache = sum(request_cost(\"claude-opus-5-5\", {\"input_tokens\": PREFIX + TAIL, \"output_tokens\": OUT})\n               for _ in range(TURNS))\nfirst = request_cost(\"claude-opus-5-5\", {\"input_tokens\": TAIL, \"cache_creation_input_tokens\": PREFIX,\n                                         \"output_tokens\": OUT})\nrest = (TURNS - 1) * request_cost(\"claude-opus-5-5\", {\"input_tokens\": TAIL, \"cache_read_input_tokens\": PREFIX,\n                                                      \"output_tokens\": OUT})\nprint(f\"20 turns, no cache: ${no_cache:.3f}   with cache: ${first + rest:.3f}\")\n",
    notes: [
      'Run it: <code>python3 sampling_and_cost.py</code>. Expected: P(Paris) falls from 1.000 at T=0 to about 0.75 at T=1.5; top_p=0.9 keeps three candidates; the cached session costs roughly a fifth of the uncached one.',
      'The cost model treats <code>input_tokens</code> as the uncached remainder, which is how the Anthropic usage object reports it: total input = input_tokens + cache_creation_input_tokens + cache_read_input_tokens.',
      'Prices are list prices at the time of writing; read them from config, not constants, in real code.'
    ]
  },
  lab: {
    title: 'Implement the sampler and the bill',
    prompt: `Fill in four functions: <code>apply_temperature</code> (softmax of logits/T, one-hot when T is 0), <code>top_p_filter</code> (sort by probability, keep until cumulative mass reaches top_p, renormalize), <code>estimate_cost</code> (uncached input, cache writes at 1.25x, cache reads, output; prices are per million tokens) and <code>fits_context</code> (input plus reserved output must fit). The asserts at the bottom must pass.`,
    starter: "import math\n\nPRICE = {\"in\": 4.00, \"out\": 20.00, \"cache_read\": 0.20}   # USD per 1M tokens\nCACHE_WRITE_MULT = 1.25\n\n\ndef apply_temperature(logits, temperature):\n    \"\"\"Return softmax(logits / temperature); temperature 0 means greedy (one-hot).\"\"\"\n    ...\n\n\ndef top_p_filter(probs, top_p):\n    \"\"\"Keep the smallest high-probability set whose mass reaches top_p, then renormalize.\"\"\"\n    ...\n\n\ndef estimate_cost(usage):\n    \"\"\"usage has input_tokens (uncached), output_tokens, and optional cache fields.\"\"\"\n    ...\n\n\ndef fits_context(input_tokens, max_tokens, context_window):\n    \"\"\"Input plus the reserved output budget must fit in the window.\"\"\"\n    ...\n\n\nif __name__ == \"__main__\":\n    p = apply_temperature([2.0, 1.0, 0.0], 1.0)\n    assert abs(sum(p) - 1.0) < 1e-9 and p[0] > p[1] > p[2]\n    assert apply_temperature([2.0, 1.0, 0.0], 0) == [1.0, 0.0, 0.0]\n    sharp = apply_temperature([2.0, 1.0, 0.0], 0.5)\n    assert sharp[0] > p[0]\n    q = top_p_filter([0.5, 0.3, 0.15, 0.05], 0.8)\n    assert q[2] == 0.0 and q[3] == 0.0 and abs(q[0] - 0.625) < 1e-9\n    c = estimate_cost({\"input_tokens\": 1000, \"output_tokens\": 500, \"cache_read_input_tokens\": 100_000})\n    assert abs(c - (0.004 + 0.01 + 0.02)) < 1e-9\n    assert fits_context(990_000, 10_000, 1_000_000) and not fits_context(995_000, 10_000, 1_000_000)\n    print(\"all checks passed\")\n",
    checks: [
      { re: 'math\\.exp\\(', flags: '', must: true, hint: 'Softmax needs math.exp on the scaled logits.', pass: 'softmax uses exp' },
      { re: '\\w+\\s*/\\s*temperature(?!\\))', flags: '', must: true, hint: 'Divide each logit by the temperature before the softmax.', pass: 'logits divided by temperature' },
      { re: 'sorted\\([\\s\\S]*reverse\\s*=\\s*True', flags: '', must: true, hint: 'Nucleus sampling walks tokens from most to least likely: sorted(..., reverse=True).', pass: 'tokens sorted by probability' },
      { re: '>=\\s*top_p', flags: '', must: true, hint: 'Stop adding tokens once cumulative mass >= top_p.', pass: 'cumulative mass compared with top_p' },
      { re: 'usage\\.get\\(\\s*"cache_read_input_tokens"', flags: '', must: true, hint: 'Cache reads are billed separately: usage.get("cache_read_input_tokens", 0).', pass: 'cache reads priced' },
      { re: '\\*\\s*CACHE_WRITE_MULT', flags: '', must: true, hint: 'Cache writes cost input price x CACHE_WRITE_MULT.', pass: 'cache write premium applied' },
      { re: '/\\s*1_?000_?000', flags: '', must: true, hint: 'Prices are per million tokens: divide by 1_000_000.', pass: 'per-million conversion' },
      { re: 'input_tokens\\s*\\+\\s*max_tokens\\s*<=\\s*context_window', flags: '', must: true, hint: 'fits_context: input_tokens + max_tokens <= context_window.', pass: 'window check covers input + output' }
    ],
    run: `Save as <code>lab.py</code> and run <code>python3 lab.py</code>; it prints <code>all checks passed</code>. Then try it against the real API: <code>pip install anthropic</code>, <code>export ANTHROPIC_API_KEY=...</code>, send one request with <code>client.messages.create</code> and feed <code>resp.usage.model_dump()</code> into your <code>estimate_cost</code>.`,
    solution: "import math\n\nPRICE = {\"in\": 4.00, \"out\": 20.00, \"cache_read\": 0.20}   # USD per 1M tokens\nCACHE_WRITE_MULT = 1.25\n\n\ndef apply_temperature(logits, temperature):\n    \"\"\"Return softmax(logits / temperature); temperature 0 means greedy (one-hot).\"\"\"\n    if temperature == 0:\n        best = max(range(len(logits)), key=lambda i: logits[i])\n        return [1.0 if i == best else 0.0 for i in range(len(logits))]\n    scaled = [x / temperature for x in logits]\n    m = max(scaled)\n    exps = [math.exp(x - m) for x in scaled]\n    z = sum(exps)\n    return [e / z for e in exps]\n\n\ndef top_p_filter(probs, top_p):\n    \"\"\"Keep the smallest high-probability set whose mass reaches top_p, then renormalize.\"\"\"\n    order = sorted(range(len(probs)), key=lambda i: probs[i], reverse=True)\n    keep, mass = set(), 0.0\n    for i in order:\n        keep.add(i)\n        mass += probs[i]\n        if mass >= top_p:\n            break\n    total = sum(probs[i] for i in keep)\n    return [probs[i] / total if i in keep else 0.0 for i in range(len(probs))]\n\n\ndef estimate_cost(usage):\n    \"\"\"usage has input_tokens (uncached), output_tokens, and optional cache fields.\"\"\"\n    d = usage[\"input_tokens\"] * PRICE[\"in\"]\n    d += usage.get(\"cache_creation_input_tokens\", 0) * PRICE[\"in\"] * CACHE_WRITE_MULT\n    d += usage.get(\"cache_read_input_tokens\", 0) * PRICE[\"cache_read\"]\n    d += usage[\"output_tokens\"] * PRICE[\"out\"]\n    return d / 1_000_000\n\n\ndef fits_context(input_tokens, max_tokens, context_window):\n    \"\"\"Input plus the reserved output budget must fit in the window.\"\"\"\n    return input_tokens + max_tokens <= context_window\n\n\nif __name__ == \"__main__\":\n    p = apply_temperature([2.0, 1.0, 0.0], 1.0)\n    assert abs(sum(p) - 1.0) < 1e-9 and p[0] > p[1] > p[2]\n    assert apply_temperature([2.0, 1.0, 0.0], 0) == [1.0, 0.0, 0.0]\n    sharp = apply_temperature([2.0, 1.0, 0.0], 0.5)\n    assert sharp[0] > p[0]\n    q = top_p_filter([0.5, 0.3, 0.15, 0.05], 0.8)\n    assert q[2] == 0.0 and q[3] == 0.0 and abs(q[0] - 0.625) < 1e-9\n    c = estimate_cost({\"input_tokens\": 1000, \"output_tokens\": 500, \"cache_read_input_tokens\": 100_000})\n    assert abs(c - (0.004 + 0.01 + 0.02)) < 1e-9\n    assert fits_context(990_000, 10_000, 1_000_000) and not fits_context(995_000, 10_000, 1_000_000)\n    print(\"all checks passed\")\n",
    notes: [
      'Subtracting the max logit before exponentiating does not change the softmax but prevents overflow for large logits.',
      'The token that crosses the top_p threshold is included; that is what "smallest set whose mass reaches p" means.',
      'On current Claude models you cannot pass temperature or top_p, but this math is still what the server does with its fixed defaults, and what OpenAI-style APIs expose.'
    ]
  },
  quiz: [
    {
      q: 'A chatbot "remembers" the previous five turns. Where does that memory live in a plain Messages API integration?',
      options: ['In a server-side session tied to the API key', 'In the client, which re-sends the whole transcript in messages on every call', 'In the model weights, updated after each call', 'In the prompt cache, which stores the conversation'],
      correct: 1,
      explain: 'The API is stateless. The client re-sends history; caching only makes re-sending an identical prefix cheaper, it does not store a conversation for you.'
    },
    {
      q: 'You lower temperature from 1.0 to 0.5. What happens to the next-token distribution?',
      options: ['It becomes uniform', 'It gets sharper: high-probability tokens gain mass', 'Only the top token is ever chosen', 'Nothing; temperature only affects latency'],
      correct: 1,
      explain: 'Dividing logits by T < 1 widens the gaps between them, so softmax concentrates mass on the leaders. Only T approaching 0 is pure argmax.'
    },
    {
      q: 'A 20-turn agent is expensive. The system prompt includes the current timestamp. What is the most direct fix?',
      options: ['Switch to streaming', 'Move the timestamp after the last cache breakpoint so the prefix is byte-stable and can be cached', 'Increase max_tokens', 'Lower temperature'],
      correct: 1,
      explain: 'Caching is a prefix match. A changing value in the system prompt makes every request a miss and pays the write premium. Streaming changes perceived latency, not cost.'
    },
    {
      q: 'resp.stop_reason is "max_tokens" and you were expecting JSON. What should your code do?',
      options: ['Parse it anyway; JSON is usually complete', 'Treat the output as truncated: retry with a larger max_tokens or a shorter task, do not parse it as final', 'Retry the identical request immediately', 'Lower the temperature'],
      correct: 1,
      explain: 'max_tokens means generation was cut wherever it was. The same request will usually truncate again; change the budget or the task.'
    },
    {
      q: 'Which statement about Message Batches is correct?',
      options: ['Results come back in submission order', 'They cost the same but run faster', 'They run asynchronously at about half price and results must be matched by custom_id', 'They only accept one request at a time'],
      correct: 2,
      explain: 'Batches trade latency (up to 24h) for a 50% discount; results are unordered and keyed by custom_id.'
    }
  ],
  testFlow: {
    title: 'Test yourself: reading a usage record',
    start: 'q1',
    nodes: {
      q1: { q: 'A response reports input_tokens=900, cache_read_input_tokens=40000, output_tokens=300. How many input tokens did the model actually attend to?', choices: [
        { text: '900', to: 'q1_wrong' },
        { text: '40,900', to: 'q1_right' },
        { text: '41,200', to: 'q1_wrong2' }
      ] },
      q1_right: { end: true, correct: true, text: 'Right. input_tokens is only the uncached remainder; cached tokens are still in context, just billed at the cache-read rate.', next: 'q2' },
      q1_wrong: { end: true, correct: false, text: 'input_tokens is the uncached part only. The 40k cached tokens are still part of the prompt.', retry: 'q1' },
      q1_wrong2: { end: true, correct: false, text: 'Output tokens are generated, not attended-to input. Add only the input-side counters.', retry: 'q1' },
      q2: { q: 'The next identical request shows cache_read_input_tokens=0 and cache_creation_input_tokens=40000. Most likely cause?', choices: [
        { text: 'Something in the prefix changed, or the TTL expired between requests', to: 'q2_right' },
        { text: 'The output was too long', to: 'q2_wrong' }
      ] },
      q2_right: { end: true, correct: true, text: 'Yes: a prefix byte changed (timestamp, tool order, JSON key order) or more than the TTL passed since the last read. Check both.', next: 'q3' },
      q2_wrong: { end: true, correct: false, text: 'Output length does not affect whether the input prefix matches. Look at what precedes the breakpoint, and at timing.', retry: 'q2' },
      q3: { q: 'Users complain the app "feels slow" on long answers but total time is acceptable. What helps most?', choices: [
        { text: 'Streaming the response', to: 'q3_right' },
        { text: 'Using the Batch API', to: 'q3_wrong' }
      ] },
      q3_right: { end: true, correct: true, text: 'Streaming shows tokens at time-to-first-token. Batches would make interactive latency far worse.' },
      q3_wrong: { end: true, correct: false, text: 'Batches are asynchronous with up to 24h turnaround. For perceived latency, stream.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Reading <code>resp.content[0].text</code> blindly: the first block may be thinking or tool_use. Iterate and check <code>block.type</code>.',
    'Ignoring <code>stop_reason</code>: truncated (<code>max_tokens</code>) or refused output gets parsed and stored as if it were complete.',
    'Estimating Claude tokens with <code>tiktoken</code> or a characters/4 heuristic and then hitting the context limit; use <code>count_tokens</code> with the target model.',
    'Volatile data (timestamps, request IDs, shuffled tool lists) inside the cached prefix, which silently turns caching into a cost increase.',
    'Assuming temperature 0 gives reproducible outputs and running each eval item once; hosted inference is not bit-deterministic.'
  ],
  interview: [
    {
      q: 'Walk me through what happens between client.messages.create(...) and the response.',
      a: `The SDK serializes tools, system and messages into JSON and POSTs to /v1/messages. The server tokenizes with the model's tokenizer, checks the prefix cache up to any breakpoints, and runs prefill over the uncached tokens, which determines time to first token. It then decodes one token at a time: logits, sampling under the configured (or fixed default) parameters, append, repeat, streaming deltas if requested. It stops on end of turn, max_tokens, a stop sequence or a tool_use block, and returns typed content blocks, stop_reason and a usage record with uncached input, cache writes, cache reads and output. The SDK retries 429/5xx with backoff. Nothing is retained server-side except the cache entry.`
    },
    {
      q: 'Explain temperature and top_p precisely. When would you use each, and what changed on current Claude models?',
      a: `Temperature rescales logits before softmax (z/T): lower T sharpens, higher T flattens, T to 0 is greedy. top_p keeps the smallest set of tokens whose cumulative probability reaches p and renormalizes, so the candidate set adapts to the model's confidence, which top_k does not. Historically you used low temperature for extraction and classification and higher temperature plus top_p for diverse sampling, for example generating many candidate patches for pass@k. On Claude 4.7+ models only the defaults are accepted, and API version 2026-10-21 rejects the parameters everywhere, so diversity comes from prompting, multiple samples and effort settings instead. OpenAI chat models largely still expose them.`
    },
    {
      q: 'Tradeoff: one huge long-context prompt versus retrieval plus a short prompt. How do you decide?',
      a: `Long context is simpler (no index, no retrieval misses) and with caching can be economical for a stable corpus queried repeatedly. Retrieval wins when the corpus is larger than the window, changes often, when cost per query matters without cache reuse, or when attribution matters. Quality-wise, long contexts suffer from position effects (lost in the middle) and distractors, while RAG fails when retrieval misses. I would measure both on the real task: retrieval recall@k on one side, end-to-end accuracy and cost per query on both, and often land on a hybrid: retrieve generously, then put a few hundred thousand tokens in a cached context.`
    },
    {
      q: 'Design: your team runs a nightly eval of 50,000 prompts against two models. Minimize cost and wall-clock time.',
      a: `Use the Batch API for the 50% discount and server-side parallelism, chunked into batches with deterministic custom_ids (hash of dataset version, item ID, model, prompt version) so results join back reliably and reruns are idempotent. Put the shared instructions and few-shot examples in a cached system prefix, identical across items. Set max_tokens to what the task needs and ask for terse, structured output, since output is the expensive side. Record model ID, effort and usage per item. Poll processing_status, collect results by custom_id, resubmit only errored or expired items. If results are needed sooner than the batch SLA, run a bounded-concurrency async client with a token-bucket limiter respecting the per-minute token limits and the retry-after header.`
    },
    {
      q: 'Why is greedy decoding on a hosted API not deterministic, and what do you do about it in evals?',
      a: `Floating-point addition is not associative, and GPU kernels change reduction order with batch size and composition, so logits differ in the last bits between runs; near-ties then flip the argmax and the sequence diverges from there. Mixture-of-experts routing and serving-stack changes add more. In evals I sample each item multiple times, report mean and a confidence interval, use paired comparisons between systems on the same items, and pin the exact model ID and settings.`
    },
    {
      q: 'Your agent bill tripled after a refactor that did not change prompts. Where do you look?',
      a: `First, cache hit rate: compare cache_read_input_tokens before and after. Refactors commonly break prefix stability by changing tool ordering (building tools from a dict or set), serializing JSON without sort_keys, or interpolating a timestamp or session ID into the system prompt. Second, turn count and transcript growth: a change in stop logic or error handling can add turns, and each turn re-sends the whole transcript. Third, output tokens: a larger effort default or a model swap. Fourth, retries: a 400 being retried in a loop. The usage record per call answers all four.`
    },
    {
      q: 'How does streaming interact with tool calls and max_tokens?',
      a: `Tool-use input is streamed as partial JSON deltas, so you cannot execute a tool until its content block stops and the JSON is complete; with eager input streaming the client must validate the accumulated input itself. If max_tokens is hit mid tool call, the call is incomplete and must not be executed. Streaming also lets you set large max_tokens safely, because the connection stays active instead of waiting on one long HTTP response.`
    }
  ]
};
