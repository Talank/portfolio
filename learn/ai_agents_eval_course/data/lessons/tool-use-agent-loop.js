window.LESSONS = window.LESSONS || {};
window.LESSONS['tool-use-agent-loop'] = {
  id: 'tool-use-agent-loop',
  title: 'Tool Use: Writing the Agent Loop From Scratch',
  category: 'Part 0 — LLM Building Blocks',
  timeMin: 45,
  summary: `An "agent" is a while loop: call the model with tool definitions, and while it answers with <code>stop_reason == "tool_use"</code>, execute the requested tools and send the results back as <code>tool_result</code> blocks. Everything else (frameworks, SDK tool runners, managed agents) is that loop plus policy. This lesson writes it by hand so you can explain every line in an interview: how tools are described, the exact message protocol including parallel calls, how errors are returned to the model instead of crashing the loop, and which stop conditions keep an agent from spinning forever or burning the budget. The worked example runs offline against a mock that enforces the same protocol rules the real API does.`,
  goals: [
    'Write tool definitions (name, description, JSON Schema) that a model can use correctly, and explain why descriptions matter more than names',
    'Implement the tool_use, execute, tool_result protocol including parallel calls, ID matching and role alternation',
    'Return tool failures as <code>is_error</code> results the model can recover from, and decide which errors should stop the loop instead',
    'Bound an agent with max turns, token or cost budgets, and explicit handling of every stop_reason',
    'Know when to use the SDK tool runner, a framework, or a hand-written loop'
  ],
  concept: [
    {
      h: 'The loop, in six lines of logic',
      p: [
        `1. Send <code>messages</code> plus <code>tools</code>. 2. Append the assistant's full <code>resp.content</code> to <code>messages</code>. 3. If <code>stop_reason</code> is <code>tool_use</code>, run every <code>tool_use</code> block. 4. Append one <code>user</code> message containing a <code>tool_result</code> for each call, matched by <code>tool_use_id</code>. 5. Repeat. 6. Stop on <code>end_turn</code>, on any other stop reason you have not planned for, or when a budget runs out.`,
        `The model never executes anything. It emits a structured request (<code>{"type": "tool_use", "id": "toolu_...", "name": "read_file", "input": {"path": "..."}}</code>) and waits; your code decides whether and how to run it. That separation is the security boundary of every agent you build.`,
        `<b>OpenAI equivalent:</b> Chat Completions returns <code>message.tool_calls</code> with <code>finish_reason == "tool_calls"</code>, arguments as a JSON <i>string</i> you must parse, and results go back as separate <code>{"role": "tool", "tool_call_id": ...}</code> messages. Same protocol, different envelope.`
      ],
      code: `while True:
    resp = client.messages.create(model="claude-opus-5-5", max_tokens=4096,
                                  tools=TOOLS, messages=messages)
    messages.append({"role": "assistant", "content": resp.content})
    if resp.stop_reason != "tool_use":
        break
    results = [run_tool(b) for b in resp.content if b.type == "tool_use"]
    messages.append({"role": "user", "content": results})`
    },
    {
      h: 'Tool definitions are prompts',
      p: [
        `Each tool is <code>name</code>, <code>description</code> and <code>input_schema</code> (JSON Schema). The model chooses tools almost entirely from the descriptions, so write them like documentation for a new colleague: what it does, when to use it versus the other tools, what the arguments mean with an example, what it returns, and its limits ("returns at most 200 lines"). Vague descriptions cause the two classic failures: never calling the right tool, or calling it with guessed arguments.`,
        `Design the tool surface for the model, not as a thin wrapper over your internal API. Fewer, higher-level tools with clear contracts (a <code>search_code(query)</code> that returns ranked snippets) beat many low-level ones the model must chain correctly. Use enums and <code>"strict": true</code> with <code>additionalProperties: false</code> when arguments must be exact. Return results the model can act on: concise, labeled, with actionable error messages ("path not found; known files: ..."), and truncated with a marker when large.`,
        `Tool definitions are rendered first in the prompt and are part of the cached prefix. Build the list in a deterministic order; a tool list assembled from a set or unordered dict changes byte order and breaks caching.`
      ]
    },
    {
      h: 'The protocol rules the API enforces',
      p: [
        `Every <code>tool_use</code> block must be answered by exactly one <code>tool_result</code> with the same <code>tool_use_id</code>, in the very next user message; a missing result is a 400. The assistant turn must be appended unchanged (including any thinking blocks), not re-typed as text. Roles must alternate.`,
        `<b>Parallel tool use</b> is on by default: one assistant turn may contain several <code>tool_use</code> blocks. Run them concurrently if they are independent, then return <b>all</b> results in a <b>single</b> user message. Splitting them across several user messages works syntactically but teaches the model to stop making parallel calls. Set <code>disable_parallel_tool_use</code> on <code>tool_choice</code> if your tools have ordering side effects.`,
        `<b>tool_choice:</b> <code>auto</code> (default) lets the model decide; <code>none</code> forbids tools. Forcing a call with <code>any</code> or a named tool returns a 400 on current Claude models (Opus 5.5, Sonnet 5.5, Fable 5.1/5.2), so steer with instructions and check whether a call came back.`
      ]
    },
    {
      h: 'Errors: feed them back, or stop',
      p: [
        `Most tool failures are information, not crashes. A wrong path, a bad regex, a failing command: catch it and return <code>{"type": "tool_result", "tool_use_id": id, "content": "FileNotFoundError: ...", "is_error": true}</code>. Models recover well from precise errors, often on the next turn. Raising out of the loop instead throws away the whole trajectory.`,
        `Some failures should stop the run: authentication or permission failures in your own infrastructure, a tool timing out repeatedly, a policy check rejecting an action, or the same call failing identically several times (a loop detector: hash <code>(name, input)</code> and count). Distinguish API errors too: 429 and 5xx from the model API are retried with backoff (the SDK does this), while a 400 means your request is malformed and retrying is pointless.`,
        `Put timeouts on every tool. An agent that runs tests or shell commands will eventually hit a hang, and a hung tool hangs the agent.`
      ]
    },
    {
      h: 'Stop conditions and budgets',
      p: [
        `Handle every <code>stop_reason</code> explicitly: <code>end_turn</code> means done; <code>tool_use</code> means continue; <code>pause_turn</code> (a long server-side tool turn paused) means append the turn and re-send; <code>max_tokens</code> means the output was truncated, and if it truncated a tool call that call must not run; <code>refusal</code> means surface it, do not retry blindly.`,
        `Bound the run on several axes: <b>max turns</b>, cumulative <b>output tokens</b> or dollars (input re-sending makes cost grow superlinearly with turns), <b>wall-clock</b> time, and <b>repeated identical actions</b>. When a budget trips, return a clear "stopped because" status and the transcript, which is what evaluation and debugging need. Anthropic also offers an advisory <code>task_budget</code> (beta) that tells the model its token allowance so it paces itself, distinct from the hard <code>max_tokens</code> per response.`,
        `For production, the SDK's <code>client.beta.messages.tool_runner</code> with <code>@beta_tool</code> functions runs this loop for you, generating schemas from type hints and docstrings. Write the loop by hand when you need custom control flow, approvals, or to understand what a framework is doing.`
      ],
      code: "import anthropic\nfrom anthropic import beta_tool\n\nclient = anthropic.Anthropic()\n\n\n@beta_tool\ndef read_file(path: str) -> str:\n    \"\"\"Return the full text of one repository file.\n\n    Args:\n        path: Repository-relative path, e.g. src/app.py.\n    \"\"\"\n    with open(path) as f:\n        return f.read()\n\n\nrunner = client.beta.messages.tool_runner(\n    model=\"claude-opus-5-5\",\n    max_tokens=4096,\n    tools=[read_file],                 # schema generated from the signature + docstring\n    messages=[{\"role\": \"user\", \"content\": \"Summarize src/app.py\"}],\n)\nfor message in runner:                 # one BetaMessage per model turn; stops when no more tool calls\n    print(message.stop_reason)\n"
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The parts interviewers probe once you can write the loop: context growth, safety of tool execution, streaming tool input, idempotency, and how to make an agent testable.',
    sections: [
      {
        h: 'Context management inside the loop',
        p: [
          `Every turn re-sends the transcript, so tool output is the main driver of context growth. Techniques, roughly in order of preference: return less (paginate, summarize, truncate with a marker that says how to get more); cache the stable prefix (tools plus system) with a breakpoint; clear old tool results once they are no longer needed (Anthropic's context-editing beta does this server-side with <code>clear_tool_uses_20250919</code>); and compact the history into a summary for very long runs. Each loses some information, so measure task success, not only token counts, when you add one.`
        ]
      },
      {
        h: 'Executing tools safely',
        p: [
          `Treat every tool input as untrusted: the model can be steered by content it read earlier (prompt injection through a web page, an issue body, or a file comment). Validate arguments against the schema and against policy (path inside the workspace, command on an allowlist), run side-effecting tools in a sandbox (container with no network or a restricted egress list, CPU and memory limits, timeouts, a throwaway filesystem), and require human approval for irreversible actions such as pushing, deleting, paying or emailing. The coding-agents lesson builds the Docker sandbox.`,
          `Make side-effecting tools idempotent where possible (an idempotency key per <code>tool_use_id</code>), so a retried turn cannot charge a card twice.`
        ]
      },
      {
        h: 'Streaming and tool calls',
        p: [
          `When streaming, tool input arrives as <code>input_json_delta</code> fragments inside <code>content_block_delta</code> events; the call is usable only after its <code>content_block_stop</code>. With <code>eager_input_streaming: true</code> on a tool, large inputs stream as they are generated, and the client must validate the accumulated JSON itself, because it may be incomplete if the response hit <code>max_tokens</code>. Do not execute a tool from a partial input.`
        ]
      },
      {
        h: 'Making agents testable',
        p: [
          `Inject the client so a scripted mock can replace it, as in the worked example. The mock checks protocol invariants (every tool_use answered, IDs matched), and lets you unit-test the loop's handling of errors, truncation and budgets deterministically. Record real transcripts and replay them as regression fixtures. Log per turn: tool name, input, latency, result size, error flag, and token usage, because the evaluating-agents lesson builds trajectory metrics on exactly these traces.`
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: 'Luffy Gives Orders; the Crew Does the Work',
      text: [
        `Luffy never touches the helm, the cooking pot or the charts. When a problem comes up he shouts orders, each one addressed to a crew member by role: "Nami, read the log pose!" and "Usopp, check the starboard cannon!" in the same breath. Each crew member reports back, and Luffy only decides the next order once he has heard every report from that round.`,
        `When Usopp reports "there is no starboard cannon number seven, we have numbers one to six", Luffy does not abandon the voyage; he just orders cannon six instead. Zoro, sent to fetch supplies, once wandered for hours, so the crew now gives every errand a time limit. And Nami keeps a strict rule: after twenty orders without reaching the island, or when the berries run low, they stop and reassess instead of sailing in circles.`
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon Directs the Experiment From His Spot',
      text: [
        `Sheldon refuses to leave his spot on the couch, so he directs Leonard, Howard and Raj by request slips: "Leonard: measure the voltage. Howard: fetch the oscilloscope." Each slip has a number, and Sheldon will not continue until every numbered slip comes back with a result attached, matched by number.`,
        `When Howard reports "the oscilloscope is not in the lab, it is in Raj's office", Sheldon simply issues a new slip. When Raj hands back two results stapled to separate sheets, Sheldon complains that results from one round go on one sheet. Penny, watching, sets a kitchen timer: after thirty minutes the experiment ends whether Sheldon is satisfied or not.`
      ]
    },
    why: 'Luffy and Sheldon are the model: they never act, they emit tool calls. The crew and the friends are your tool handlers. Matching every report to its order is tool_use_id pairing; collecting every report before the next order is returning all parallel results in one user message. "No cannon seven" is an is_error result the model recovers from. Zoro\'s time limit is a tool timeout, and the twenty-order rule and Penny\'s timer are max-turn and budget stop conditions.'
  },
  storyAnim: {
    title: 'One round of orders and reports',
    h: 260,
    props: [
      { id: 'orders', emoji: '📣', label: 'orders (tool_use blocks)', x: 18, y: 18 },
      { id: 'logpose', emoji: '🧭', label: 'log pose (tool)', x: 50, y: 18 },
      { id: 'cannon', emoji: '💣', label: 'cannon 7? (tool)', x: 82, y: 18 },
      { id: 'reports', emoji: '📋', label: 'all reports, one round', x: 50, y: 52 },
      { id: 'timer', emoji: '⏳', label: 'turn / berry budget', x: 85, y: 78 },
      { id: 'island', emoji: '🏝️', label: 'answer (end_turn)', x: 15, y: 78 }
    ],
    actors: [
      { id: 'luffy', emoji: '👒', label: 'Luffy (model)', x: 18, y: 50 },
      { id: 'nami', emoji: '🍊', label: 'Nami', x: 40, y: 82 },
      { id: 'usopp', emoji: '🎯', label: 'Usopp', x: 62, y: 82 }
    ],
    steps: [
      { c: 'Luffy shouts two orders at once, one to Nami and one to Usopp. He touches nothing himself.', p: { orders: 'lit' }, a: { luffy: [18, 40] } },
      { c: 'Nami reads the log pose and Usopp checks cannon seven, at the same time.', p: { logpose: 'lit', cannon: 'lit' }, a: { nami: [50, 32], usopp: [80, 32] } },
      { c: 'Usopp reports back: "there is no cannon seven, only one to six." An error, but useful.', p: { cannon: 'bad' } },
      { c: 'Both reports come back together, each tagged with the order it answers.', p: { reports: 'good' }, a: { nami: [42, 62], usopp: [58, 62] } },
      { c: 'Luffy issues the next order, cannon six this time, using what the error told him.', p: { cannon: 'good', orders: 'lit' } },
      { c: 'Nami watches the order count and the berries. Past the limit, the crew stops and reassesses.', p: { timer: 'lit' } },
      { c: 'With enough reports, Luffy stops ordering and announces the course: the turn ends.', p: { island: 'good' }, a: { luffy: [15, 62] } }
    ]
  },
  conceptFlow: {
    title: 'The agent loop, message by message',
    intro: 'Click a box or press Play.',
    stages: [
      { label: 'Request', nodes: [
        { id: 'send', text: 'messages + tools\n(cached prefix: tools, system)' }
      ] },
      { label: 'Model turn', nodes: [
        { id: 'assistant', text: 'assistant content blocks\ntext + tool_use(id, name, input)' },
        { id: 'stopr', text: 'stop_reason' }
      ] },
      { label: 'Your code', nodes: [
        { id: 'validate', text: 'validate + policy check\nsandbox, timeout' },
        { id: 'exec', text: 'execute in parallel' },
        { id: 'err', text: 'exception -> tool_result\nis_error: true' }
      ] },
      { label: 'Reply', nodes: [
        { id: 'results', text: 'ONE user message\nall tool_results, ids matched' }
      ] },
      { label: 'Exit', nodes: [
        { id: 'done', text: 'end_turn: answer' },
        { id: 'budget', text: 'max turns / tokens /\nrepeat detector' }
      ] }
    ],
    steps: [
      { active: ['send'], note: 'Each iteration sends the entire transcript and the tool definitions. Keep the tool list deterministic so the prefix caches.' },
      { active: ['assistant', 'stopr'], note: 'The model answers with content blocks. If it wants tools, stop_reason is tool_use and there are one or more tool_use blocks, each with a unique id.' },
      { active: ['validate'], note: 'Before running anything, check the arguments against the schema and your policy. The model is not a trusted caller.' },
      { active: ['exec'], note: 'Independent calls run concurrently, each with a timeout.' },
      { active: ['err'], note: 'Failures become tool_result blocks with is_error true and an actionable message, so the model can correct itself.' },
      { active: ['results'], note: 'All results go back in a single user message, one per tool_use_id. A missing result is a 400.' },
      { active: ['done'], note: 'When the model ends its turn without tool calls, the loop returns the text answer.' },
      { active: ['budget'], note: 'Independently, the harness stops the run when turns, tokens, time or repeated identical calls exceed their limits, and reports why.' }
    ]
  },
  tech: [
    {
      q: 'Why must the assistant turn be appended as resp.content and not just its text?',
      a: `The next request has to contain the exact <code>tool_use</code> blocks that the <code>tool_result</code> blocks refer to; without them the IDs dangle and the API rejects the request. Thinking blocks must also be passed back unchanged, since current models validate them. Appending the full block list preserves both.`
    },
    {
      q: 'What is the difference between a tool returning is_error and the loop raising an exception?',
      a: `<code>is_error</code> keeps the trajectory alive and tells the model the action failed and why, which it can use to change course. Raising terminates the run and discards progress. Reserve raising for failures the model cannot fix: broken credentials, your own bugs, policy violations, or a budget breach.`
    },
    {
      q: 'Are tool definitions billed?',
      a: `Yes. Tool names, descriptions and schemas are rendered into the prompt as input tokens on every request, plus a small fixed system overhead when tools are present. With dozens of tools this is significant, which is one reason to cache the prefix, keep descriptions tight, and use tool search (deferred loading) for very large tool catalogs.`
    },
    {
      q: 'How does the SDK tool runner differ from the Claude Agent SDK?',
      a: `The tool runner (<code>client.beta.messages.tool_runner</code>) is a thin helper in the regular <code>anthropic</code> package that loops over tools you define. The Claude Agent SDK is a separate package that ships the Claude Code harness: built-in file, shell and search tools, permissions, subagents and context management. Managed Agents goes further and hosts the loop and a per-session sandbox on Anthropic's side.`
    }
  ],
  code: {
    title: 'A complete agent loop with a protocol-checking mock',
    intro: 'Two tools over an in-memory repository, parallel execution with a thread pool, errors returned as is_error results, output truncation, a token budget, max turns, and explicit stop_reason handling. The mock client asserts the same invariants the real API enforces, so if you break the protocol, the offline run fails.',
    code: "\"\"\"agent_loop.py - a tool-using agent loop from scratch, Anthropic Messages API shapes.\nOffline: python3 agent_loop.py          (scripted mock model that also checks the protocol)\nLive:    ANTHROPIC_API_KEY=... python3 agent_loop.py --live\"\"\"\nimport json\nimport re\nimport sys\nimport time\nfrom concurrent.futures import ThreadPoolExecutor\nfrom types import SimpleNamespace as NS\n\n# ---------------- tools: schema the model sees + handler you run ----------------\nREPO = {\n    \"README.md\": \"Cart service. Tests: tests/test_cart.py\",\n    \"src/cart/checkout.py\": \"TIMEOUT_MS = 2000\\ndef checkout(cart):\\n    return pay(cart, timeout=TIMEOUT_MS)\\n\",\n    \"tests/test_cart.py\": \"def test_checkout_slow_gateway():\\n    assert checkout(slow_cart()) == 'ok'\\n\",\n}\n\nTOOLS = [\n    {\n        \"name\": \"grep\",\n        \"description\": \"Search all repository files for a regex. Returns matching lines as path:line:text. \"\n                       \"Use this first to find where something is defined.\",\n        \"input_schema\": {\"type\": \"object\",\n                         \"properties\": {\"pattern\": {\"type\": \"string\", \"description\": \"Python regex\"}},\n                         \"required\": [\"pattern\"], \"additionalProperties\": False},\n    },\n    {\n        \"name\": \"read_file\",\n        \"description\": \"Return the full text of one repository file. Paths are relative, e.g. src/app.py.\",\n        \"input_schema\": {\"type\": \"object\",\n                         \"properties\": {\"path\": {\"type\": \"string\"}},\n                         \"required\": [\"path\"], \"additionalProperties\": False},\n    },\n]\n\n\ndef grep(pattern):\n    out = []\n    for path, text in sorted(REPO.items()):\n        for i, line in enumerate(text.splitlines(), 1):\n            if re.search(pattern, line):\n                out.append(f\"{path}:{i}:{line}\")\n    return \"\\n\".join(out) or \"no matches\"\n\n\ndef read_file(path):\n    if path not in REPO:\n        raise FileNotFoundError(f\"{path} does not exist. Known files: {', '.join(sorted(REPO))}\")\n    return REPO[path]\n\n\nHANDLERS = {\"grep\": grep, \"read_file\": read_file}\nMAX_RESULT_CHARS = 4000\n\n\ndef run_tool(block):\n    \"\"\"Execute one tool_use block and ALWAYS return a tool_result, success or failure.\"\"\"\n    try:\n        handler = HANDLERS[block.name]\n        out = str(handler(**block.input))\n        if len(out) > MAX_RESULT_CHARS:                       # protect the context window\n            out = out[:MAX_RESULT_CHARS] + f\"\\n[truncated {len(out) - MAX_RESULT_CHARS} chars]\"\n        return {\"type\": \"tool_result\", \"tool_use_id\": block.id, \"content\": out}\n    except Exception as exc:                                  # unknown tool, bad args, runtime error\n        return {\"type\": \"tool_result\", \"tool_use_id\": block.id,\n                \"content\": f\"{type(exc).__name__}: {exc}\", \"is_error\": True}\n\n\n# ---------------- the loop ----------------\ndef run_agent(client, task, model=\"claude-opus-5-5\", max_turns=10, max_output_tokens_total=50_000):\n    messages = [{\"role\": \"user\", \"content\": task}]\n    spent = 0\n    for turn in range(1, max_turns + 1):\n        resp = client.messages.create(model=model, max_tokens=4096, tools=TOOLS,\n                                      system=\"You investigate code repositories. Use tools; cite file paths.\",\n                                      messages=messages)\n        spent += resp.usage.output_tokens\n        messages.append({\"role\": \"assistant\", \"content\": resp.content})   # append the FULL block list\n\n        if resp.stop_reason == \"tool_use\":\n            calls = [b for b in resp.content if b.type == \"tool_use\"]\n            print(f\"turn {turn}: {len(calls)} tool call(s): \" +\n                  \", \".join(f\"{c.name}({json.dumps(c.input)})\" for c in calls))\n            with ThreadPoolExecutor(max_workers=4) as pool:           # parallel calls run concurrently\n                results = list(pool.map(run_tool, calls))              # map keeps the original order\n            for r in results:\n                if r.get(\"is_error\"):\n                    print(\"   error ->\", r[\"content\"][:70])\n            messages.append({\"role\": \"user\", \"content\": results})    # ALL results in ONE user message\n            if spent > max_output_tokens_total:\n                return \"stopped: token budget exhausted\", messages\n            continue\n\n        if resp.stop_reason == \"pause_turn\":          # server-side tool paused; resend to resume\n            continue\n        if resp.stop_reason == \"end_turn\":\n            text = \"\".join(b.text for b in resp.content if b.type == \"text\")\n            print(f\"turn {turn}: done\")\n            return text, messages\n        # max_tokens, refusal, or anything unexpected: stop and surface it, never loop blindly\n        return f\"stopped: stop_reason={resp.stop_reason}\", messages\n    return f\"stopped: hit max_turns={max_turns}\", messages\n\n\n# ---------------- a scripted mock that enforces the tool-use protocol ----------------\nclass MockClient:\n    def __init__(self):\n        self.messages = self\n        self.script = [\n            [(\"tool_use\", \"grep\", {\"pattern\": \"TIMEOUT\"}), (\"tool_use\", \"read_file\", {\"path\": \"README.md\"})],\n            [(\"tool_use\", \"read_file\", {\"path\": \"src/checkout.py\"})],          # wrong path -> is_error\n            [(\"tool_use\", \"read_file\", {\"path\": \"src/cart/checkout.py\"})],\n            [(\"text\", \"checkout() in src/cart/checkout.py passes TIMEOUT_MS = 2000 to pay(); \"\n                      \"tests/test_cart.py::test_checkout_slow_gateway is timing-dependent and likely flaky.\")],\n        ]\n        self.pending = []\n        self.n = 0\n\n    def create(self, **kw):\n        msgs = kw[\"messages\"]\n        if self.pending:                              # protocol check, like the real API's 400s\n            last = msgs[-1]\n            assert last[\"role\"] == \"user\", \"tool results must come in a user turn\"\n            got = {b[\"tool_use_id\"] for b in last[\"content\"] if b[\"type\"] == \"tool_result\"}\n            assert got == set(self.pending), f\"missing tool_result for {set(self.pending) - got}\"\n        step = self.script[self.n]\n        self.n += 1\n        content, self.pending = [], []\n        for kind, *rest in step:\n            if kind == \"tool_use\":\n                bid = f\"toolu_{self.n}_{len(content)}\"\n                content.append(NS(type=\"tool_use\", id=bid, name=rest[0], input=rest[1]))\n                self.pending.append(bid)\n            else:\n                content.append(NS(type=\"text\", text=rest[0]))\n        stop = \"tool_use\" if self.pending else \"end_turn\"\n        return NS(content=content, stop_reason=stop, usage=NS(input_tokens=500, output_tokens=120))\n\n\nif __name__ == \"__main__\":\n    if \"--live\" in sys.argv:\n        import anthropic\n        client = anthropic.Anthropic()\n    else:\n        client = MockClient()\n    t0 = time.time()\n    answer, transcript = run_agent(client, \"Why might test_checkout_slow_gateway be flaky? Find the code.\")\n    print(\"\\nANSWER:\", answer)\n    print(f\"{len(transcript)} messages in transcript, {time.time() - t0:.2f}s\")\n",
    notes: [
      'Run offline: <code>python3 agent_loop.py</code>. Expected: 4 turns, one is_error on the wrong path, then an answer citing <code>src/cart/checkout.py</code>.',
      'Run live: <code>pip install anthropic</code>, <code>export ANTHROPIC_API_KEY=...</code>, <code>python3 agent_loop.py --live</code>. The real model may take a different path; the loop handles it.',
      '<code>pool.map</code> returns results in input order, so the result list lines up with the tool_use blocks even though they ran concurrently.',
      'Try breaking it: append results in two separate user messages, or drop one result. The mock raises, just as the API would return a 400.'
    ]
  },
  lab: {
    title: 'Write the loop',
    prompt: `Implement <code>run_agent(client, tools, handlers, task, max_turns=6)</code>. Start with one user message; on each turn call <code>client.messages.create</code>, append the assistant turn as <code>resp.content</code>, return <code>(text, turns_used)</code> if <code>stop_reason</code> is not <code>"tool_use"</code>, otherwise run every tool_use block through <code>handlers</code>, turning exceptions into results with <code>"is_error": True</code>, and append all results in one user message. After <code>max_turns</code> return <code>("stopped: max_turns", max_turns)</code>. The asserts use a scripted mock including a divide-by-zero tool error and an agent that never stops.`,
    starter: "from types import SimpleNamespace as NS\n\n\ndef run_agent(client, tools, handlers, task, max_turns=6):\n    \"\"\"Return (final_text, turns_used). Stop on end_turn, on any non-tool stop_reason,\n    or after max_turns. Every tool_use gets exactly one tool_result.\"\"\"\n    # 1. messages = [user task]\n    # 2. loop at most max_turns times: call client.messages.create(..., tools=tools, messages=messages)\n    # 3. append the assistant turn (the full resp.content list)\n    # 4. if stop_reason is not tool_use: return the joined text and the turn count\n    # 5. run each tool_use block; errors become tool_result with is_error True\n    # 6. append ALL results in ONE user message\n    ...\n\n\n# ---- scripted mock client (do not edit) ----\nclass Mock:\n    def __init__(self, script):\n        self.messages, self.script, self.seen = self, list(script), []\n\n    def create(self, **kw):\n        self.seen.append(kw[\"messages\"][-1])\n        kind, payload = self.script.pop(0)\n        if kind == \"tools\":\n            blocks = [NS(type=\"tool_use\", id=\"t%d\" % i, name=n, input=a) for i, (n, a) in enumerate(payload)]\n            return NS(content=blocks, stop_reason=\"tool_use\")\n        return NS(content=[NS(type=\"text\", text=payload)], stop_reason=\"end_turn\")\n\n\nif __name__ == \"__main__\":\n    handlers = {\"add\": lambda a, b: a + b, \"div\": lambda a, b: a / b}\n    m = Mock([(\"tools\", [(\"add\", {\"a\": 2, \"b\": 3}), (\"div\", {\"a\": 1, \"b\": 0})]), (\"text\", \"5, and 1/0 failed\")])\n    text, turns = run_agent(m, [], handlers, \"compute\")\n    assert text == \"5, and 1/0 failed\" and turns == 2\n    results = m.seen[1][\"content\"]\n    assert [r[\"tool_use_id\"] for r in results] == [\"t0\", \"t1\"], \"one result per call, same ids\"\n    assert results[0][\"content\"] == \"5\" and results[1].get(\"is_error\") is True\n    loop = Mock([(\"tools\", [(\"add\", {\"a\": 1, \"b\": 1})])] * 10)\n    assert run_agent(loop, [], handlers, \"spin\", max_turns=3) == (\"stopped: max_turns\", 3)\n    print(\"all checks passed\")\n",
    checks: [
      { re: 'for\\s+\\w+\\s+in\\s+range\\(\\s*max_turns', flags: '', must: true, hint: 'Bound the loop: for turn in range(max_turns).', pass: 'loop bounded by max_turns' },
      { re: '"role":\\s*"assistant",\\s*"content":\\s*resp\\.content', flags: '', must: true, hint: 'Append {"role": "assistant", "content": resp.content}, the full block list.', pass: 'assistant turn appended verbatim' },
      { re: 'stop_reason\\s*!=\\s*"tool_use"|stop_reason\\s*==\\s*"tool_use"', flags: '', must: true, hint: 'Branch on resp.stop_reason and "tool_use".', pass: 'stop_reason drives the loop' },
      { re: '"type":\\s*"tool_result"', flags: '', must: true, hint: 'Each result is {"type": "tool_result", ...}.', pass: 'tool_result blocks built' },
      { re: '"tool_use_id":\\s*block\\.id', flags: '', must: true, hint: 'Match results to calls with "tool_use_id": block.id.', pass: 'results matched by id' },
      { re: '"is_error":\\s*True', flags: '', must: true, hint: 'Failures should be returned with "is_error": True, not raised.', pass: 'errors fed back to the model' },
      { re: 'except\\s+Exception', flags: '', must: true, hint: 'Wrap the handler call in try / except Exception as exc.', pass: 'handler exceptions caught' },
      { re: '"role":\\s*"user",\\s*"content":\\s*results', flags: '', must: true, hint: 'After the for-loop over blocks, append one {"role": "user", "content": results}.', pass: 'all results in one user message' }
    ],
    run: `Save as <code>lab.py</code> and run <code>python3 lab.py</code> (prints <code>all checks passed</code>). To run against Claude, replace the mock with <code>anthropic.Anthropic()</code>, pass real tool schemas such as the <code>grep</code>/<code>read_file</code> definitions from the worked example, and print each turn's tool calls.`,
    solution: "from types import SimpleNamespace as NS\n\n\ndef run_agent(client, tools, handlers, task, max_turns=6):\n    \"\"\"Return (final_text, turns_used). Stop on end_turn, on any non-tool stop_reason,\n    or after max_turns. Every tool_use gets exactly one tool_result.\"\"\"\n    messages = [{\"role\": \"user\", \"content\": task}]\n    for turn in range(max_turns):\n        resp = client.messages.create(model=\"claude-opus-5-5\", max_tokens=2048,\n                                      tools=tools, messages=messages)\n        messages.append({\"role\": \"assistant\", \"content\": resp.content})\n        if resp.stop_reason != \"tool_use\":\n            text = \"\".join(b.text for b in resp.content if b.type == \"text\")\n            return text, turn + 1\n        results = []\n        for block in resp.content:\n            if block.type != \"tool_use\":\n                continue\n            try:\n                out = handlers[block.name](**block.input)\n                results.append({\"type\": \"tool_result\", \"tool_use_id\": block.id, \"content\": str(out)})\n            except Exception as exc:\n                results.append({\"type\": \"tool_result\", \"tool_use_id\": block.id,\n                                \"content\": \"error: \" + str(exc), \"is_error\": True})\n        messages.append({\"role\": \"user\", \"content\": results})\n    return \"stopped: max_turns\", max_turns\n\n\n# ---- scripted mock client (do not edit) ----\nclass Mock:\n    def __init__(self, script):\n        self.messages, self.script, self.seen = self, list(script), []\n\n    def create(self, **kw):\n        self.seen.append(kw[\"messages\"][-1])\n        kind, payload = self.script.pop(0)\n        if kind == \"tools\":\n            blocks = [NS(type=\"tool_use\", id=\"t%d\" % i, name=n, input=a) for i, (n, a) in enumerate(payload)]\n            return NS(content=blocks, stop_reason=\"tool_use\")\n        return NS(content=[NS(type=\"text\", text=payload)], stop_reason=\"end_turn\")\n\n\nif __name__ == \"__main__\":\n    handlers = {\"add\": lambda a, b: a + b, \"div\": lambda a, b: a / b}\n    m = Mock([(\"tools\", [(\"add\", {\"a\": 2, \"b\": 3}), (\"div\", {\"a\": 1, \"b\": 0})]), (\"text\", \"5, and 1/0 failed\")])\n    text, turns = run_agent(m, [], handlers, \"compute\")\n    assert text == \"5, and 1/0 failed\" and turns == 2\n    results = m.seen[1][\"content\"]\n    assert [r[\"tool_use_id\"] for r in results] == [\"t0\", \"t1\"], \"one result per call, same ids\"\n    assert results[0][\"content\"] == \"5\" and results[1].get(\"is_error\") is True\n    loop = Mock([(\"tools\", [(\"add\", {\"a\": 1, \"b\": 1})])] * 10)\n    assert run_agent(loop, [], handlers, \"spin\", max_turns=3) == (\"stopped: max_turns\", 3)\n    print(\"all checks passed\")\n",
    notes: [
      'Appending results inside the per-block loop (one user message per result) would still pass the API but defeats parallel tool use; the check for one append of <code>results</code> encodes that.',
      'The <code>stopped: max_turns</code> return carries the reason, which an eval harness can count as its own outcome category.',
      'A production version adds per-tool timeouts and a repeated-call detector; try adding one that stops after the same (name, input) fails three times.'
    ]
  },
  quiz: [
    {
      q: 'The model returns two tool_use blocks in one turn. How should you send the results?',
      options: ['One user message per result, in any order', 'One user message containing both tool_result blocks, each with its tool_use_id', 'Only the first result; the model will ask again', 'As plain text in the next user message'],
      correct: 1,
      explain: 'All results go in a single user message, matched by ID. Splitting them discourages future parallel calls.'
    },
    {
      q: 'read_file raises FileNotFoundError. Best handling?',
      options: ['Crash the agent so a human sees it', 'Return a tool_result with is_error true and a message listing valid paths', 'Silently return an empty string', 'Retry the same call five times'],
      correct: 1,
      explain: 'Actionable error results let the model recover. Empty strings hide the failure and identical retries waste turns.'
    },
    {
      q: 'stop_reason is "max_tokens" and the last block is a partially generated tool_use. What do you do?',
      options: ['Execute it with whatever input parsed', 'Do not execute it; treat the turn as truncated and retry with more output room or a smaller step', 'Ignore it and return end_turn', 'Send a tool_result with is_error for it'],
      correct: 1,
      explain: 'A truncated call has incomplete input. Never execute partial tool input; fix the budget and retry the turn.'
    },
    {
      q: 'Which change most improves how often the model picks the right tool?',
      options: ['Shorter tool names', 'Clear descriptions saying what the tool does, when to use it, argument examples and return shape', 'Adding more tools', 'Raising max_tokens'],
      correct: 1,
      explain: 'Tool selection is driven by descriptions. More tools usually makes selection harder, not easier.'
    },
    {
      q: 'On Claude Opus 5.5 you send tool_choice {"type": "tool", "name": "classify"}. What happens?',
      options: ['The model is forced to call classify', 'A 400 error: forced tool choice is not supported on this model', 'The parameter is ignored', 'The model calls every tool once'],
      correct: 1,
      explain: 'Forced tool_choice (any or a named tool) is rejected on current Claude models. Use auto plus instructions, strict tools, or structured outputs.'
    }
  ],
  testFlow: {
    title: 'Test yourself: what does the loop do next?',
    start: 'q1',
    nodes: {
      q1: { q: 'stop_reason is "tool_use" and the content has text plus one tool_use block. Next step?', choices: [
        { text: 'Append resp.content as the assistant turn, run the tool, send a user turn with its tool_result', to: 'q1_right' },
        { text: 'Return the text to the user; the tool call is optional', to: 'q1_wrong' }
      ] },
      q1_right: { end: true, correct: true, text: 'Right. The text is often a short preamble; the turn is not done until the tool result goes back.', next: 'q2' },
      q1_wrong: { end: true, correct: false, text: 'The model is waiting on the tool. Returning now leaves the task half done.', retry: 'q1' },
      q2: { q: 'The agent has called grep("TODO") with identical input four times in a row. What should the harness do?', choices: [
        { text: 'Keep going; the model knows best', to: 'q2_wrong' },
        { text: 'Trip a repeated-action detector: stop, or inject a note that the call is repeating', to: 'q2_right' }
      ] },
      q2_right: { end: true, correct: true, text: 'Yes. Loop detection is a cheap, important stop condition beyond max turns.', next: 'q3' },
      q2_wrong: { end: true, correct: false, text: 'Identical repeated calls are the classic stuck-agent signature. The harness has to intervene.', retry: 'q2' },
      q3: { q: 'The model API returns HTTP 400 "tool_use ids without tool_result". Retry?', choices: [
        { text: 'Yes, with exponential backoff', to: 'q3_wrong' },
        { text: 'No: fix the transcript, a result is missing for some tool_use id', to: 'q3_right' }
      ] },
      q3_right: { end: true, correct: true, text: 'Correct. 400s are deterministic request bugs; only 429/5xx/connection errors are worth retrying.' },
      q3_wrong: { end: true, correct: false, text: 'The same malformed request will fail the same way. Backoff is for rate limits and server errors.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Appending only the assistant\'s text instead of <code>resp.content</code>, which orphans tool_use IDs (400) and drops thinking blocks.',
    'Returning one user message per tool result, which silently teaches the model to stop calling tools in parallel.',
    'No max-turns, budget or repeat detection: a confused agent loops until it exhausts the account\'s rate limit.',
    'Dumping entire files or logs as tool results; the transcript balloons and every later turn pays for it. Truncate with a marker.',
    'Executing tool inputs without validation or sandboxing, so a prompt-injected instruction becomes a real shell command.'
  ],
  interview: [
    {
      q: 'Write an agent loop on the whiteboard and explain each line.',
      a: `messages = [user task]; for turn in range(max_turns): resp = create(tools, messages); messages.append(assistant, resp.content); if stop_reason == end_turn return text; if tool_use: for each tool_use block run the handler with validation and a timeout, catching exceptions into tool_result with is_error; append one user message with all results matched by tool_use_id; check token and cost budget; handle pause_turn by re-sending, and max_tokens or refusal by stopping with a status. After the loop return "stopped: max_turns" with the transcript. The key invariants: assistant content appended verbatim, every tool_use answered once, results in one message, and every exit path labeled.`
    },
    {
      q: 'Design: a support agent with tools to look up orders, issue refunds and email customers. What do you build around the loop?',
      a: `Read-only tools (lookup) run freely. Side-effecting tools get policy checks and limits in code, not just in the prompt: refund amount caps, only refunds on orders owned by the authenticated customer (enforced from the session, never trusting model-supplied customer IDs), idempotency keys per tool_use_id so retries cannot double refund, and human approval above a threshold. Emails go through templates with a review step. Every action is logged with the transcript for audit. Untrusted text (customer messages) is treated as data. Budgets on turns and cost, escalation to a human when the agent is stuck or confidence is low, and an eval suite of scripted conversations, including adversarial ones, before each release.`
    },
    {
      q: 'Tradeoff: many fine-grained tools versus a few coarse ones (or a single bash tool).',
      a: `Fine-grained tools give precise permissions, easy validation and clear traces, but the model must chain more calls, each costing a turn and context, and selection gets harder as the count grows. Coarse tools, up to a general bash tool, are flexible and play to models trained heavily on shell use, and reduce turns, but are hard to sandbox and audit. A common answer is a general tool inside a strong sandbox for exploration, plus dedicated tools for sensitive operations where you want typed arguments and policy checks, and tool search when the catalog is large.`
    },
    {
      q: 'How do you stop an agent from running forever?',
      a: `Several independent limits: max turns; cumulative tokens or dollars; wall-clock time; per-tool timeouts; and a repeated-action detector on identical (tool, input) pairs or identical errors. Each exit returns a labeled reason. Optionally give the model its budget (an advisory task budget, or a note in the prompt) so it can wrap up gracefully rather than be cut off.`
    },
    {
      q: 'The agent keeps calling the wrong tool. How do you debug it?',
      a: `Read the traces first: which tool it chose, with what input, and what the result said. Usual causes are overlapping or vague descriptions, a result format that misleads, or an error message that does not say how to fix the call. Fix the descriptions (when to use this versus that, with examples), merge overlapping tools, make errors actionable, and build a small eval of tasks with the expected first tool call so you can measure tool-selection accuracy before and after the change.`
    },
    {
      q: 'Why build the loop yourself if the SDK has a tool runner and frameworks exist?',
      a: `For learning and debugging, because every framework is this loop plus policy and you have to understand what it is doing when it misbehaves. In production I use the tool runner when its hooks are enough, and hand-write the loop when I need custom control flow: approval gates with persistent state, routing between models, custom context management, or deterministic replay for evaluation.`
    },
    {
      q: 'How do you unit-test an agent loop without calling a model?',
      a: `Inject the client and use a scripted mock that returns predetermined content blocks and asserts protocol invariants on each request: tool_result per tool_use id, roles alternating, results in one message. Script edge cases: tool errors, truncated turns, refusals, a model that never stops. Separately, replay recorded real transcripts as regression fixtures. Model quality is then measured by evals, not unit tests.`
    }
  ]
};
