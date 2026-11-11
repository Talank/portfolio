window.LESSONS = window.LESSONS || {};
window.LESSONS['workflow-orchestration'] = {
  id: 'workflow-orchestration',
  title: 'Workflows & Orchestration: State Machines, LangGraph, DSPy, MCP & Retries',
  category: 'Part 1 — Building Agents & Workflows',
  timeMin: 45,
  summary: `An LLM call is a slow, rate-limited, occasionally failing, non-deterministic remote procedure call that costs money. Production workflows built from many of them need what every distributed system needs: explicit state, retries that do not double side effects, checkpoints so a crash at step 7 does not repeat steps 1 to 6, human approval points, and traces. This lesson covers the engineering: workflows as state machines and DAGs, durable execution and its determinism rule, LangGraph's typed state graphs with checkpointers and interrupts, DSPy's approach of compiling prompts against a metric, the Model Context Protocol for plugging tools into any agent, and the retry/idempotency patterns that hold it all together. All code here was run against current library versions.`,
  goals: [
    'Model an LLM workflow as a state machine or DAG with typed state, and explain what checkpointing buys',
    'Build a LangGraph graph with conditional edges, a retry policy, a checkpointer and a human-approval interrupt',
    'Explain DSPy signatures, modules and optimizers, and when compiling prompts beats hand-tuning',
    'Explain MCP\'s architecture (hosts, clients, servers; tools, resources, prompts; stdio and HTTP transports) and write a server',
    'Implement exponential backoff with jitter and idempotent, checkpointed steps, and reason about determinism and replay'
  ],
  concept: [
    {
      h: 'Workflows are state machines',
      p: [
        `Write the workflow down as states and transitions: each node reads the current state, does one unit of work (an LLM call, a tool, a check), and returns an update; edges decide what runs next, possibly conditionally. A <b>DAG</b> (directed acyclic graph) fits pipelines whose steps are known and never loop, the classic orchestrator model of Airflow, Prefect or Dagster. Agentic workflows need <b>cycles</b> (generate, test, revise, test again), so they need a graph runtime that permits loops with explicit exit conditions.`,
        `Making the graph explicit gives you things a nested while loop does not: you can visualize it, test nodes in isolation, persist state between nodes, resume after failure, pause for a human, and trace which path each run took. It also forces you to name the state, which is where most workflow bugs hide.`,
        `<b>Durable execution</b> engines such as Temporal take this further: workflow code is replayed from an event history after a crash, so it must be deterministic, and all non-deterministic work (LLM calls, HTTP, clocks, random numbers) must happen in "activities" whose results are recorded and replayed rather than re-executed. That rule applies to any checkpointed LLM workflow: the LLM output is a recorded fact, not something to recompute on resume.`
      ]
    },
    {
      h: 'LangGraph: typed state, nodes, edges, checkpoints',
      p: [
        `In LangGraph you declare a state schema (a <code>TypedDict</code>), add nodes (functions from state to a partial update), and connect them with <code>add_edge</code> and <code>add_conditional_edges</code> (a function returning the next node's name). <b>Reducers</b> declared with <code>Annotated[list, operator.add]</code> say how concurrent or repeated updates merge, appending instead of overwriting. <code>compile(checkpointer=...)</code> saves state after every step under a <code>thread_id</code>; <code>InMemorySaver</code> is for tests, and SQLite or Postgres savers give real durability.`,
        `Checkpoints enable three features: <b>resume</b> after a crash (invoke again with the same thread ID and <code>None</code> as input), <b>human-in-the-loop</b> (compile with <code>interrupt_before=[...]</code>, or call <code>interrupt()</code> inside a node and resume with <code>Command(resume=value)</code>), and <b>time travel</b> (<code>get_state_history</code> lists every checkpoint, so you can inspect or fork from any of them). Per-node <code>RetryPolicy</code> retries transient failures with backoff.`,
        `When not to use it: a linear three-call pipeline is clearer as three function calls. The graph earns its cost when you need cycles, persistence, interrupts or branching you want to see.`
      ]
    },
    {
      h: 'DSPy: compile prompts against a metric',
      p: [
        `DSPy (Khattab et al., Stanford) treats prompts as parameters to be optimized rather than strings to be hand-edited. You declare a <b>signature</b> (typed inputs and outputs, with a docstring as the task description), wrap it in a <b>module</b> such as <code>dspy.Predict</code> or <code>dspy.ChainOfThought</code> (which adds a reasoning field), compose modules in ordinary Python, and give an <b>optimizer</b> a training set and a metric. <code>BootstrapFewShot</code> runs the program on training examples and keeps the traces that pass the metric as few-shot demonstrations; <code>MIPROv2</code> also proposes and searches over instructions.`,
        `It shines when you have a clear metric and a few dozen to hundreds of labeled examples, and when you swap models often, because you recompile instead of re-tuning prompts by hand. The usual cautions apply: the optimizer overfits a small training set, so hold out a test set, and optimization itself costs many LLM calls.`
      ],
      code: "import dspy\n\ndspy.configure(lm=dspy.LM(\"anthropic/claude-sonnet-5-5\"))     # LiteLLM-style \"provider/model\" string\n\n\nclass TriageFailure(dspy.Signature):\n    \"\"\"Classify a CI test failure.\"\"\"\n    log: str = dspy.InputField()\n    category: str = dspy.OutputField(desc=\"one of: flaky, regression, infra\")\n\n\ntriage = dspy.ChainOfThought(TriageFailure)                    # adds a reasoning field before the output\n\ntrainset = [dspy.Example(log=\"Timeout; passed on rerun\", category=\"flaky\").with_inputs(\"log\"),\n            dspy.Example(log=\"AssertionError: expected 3 got 4\", category=\"regression\").with_inputs(\"log\")]\n\n\ndef exact(example, pred, trace=None):\n    return example.category == pred.category\n\n\noptimizer = dspy.BootstrapFewShot(metric=exact, max_bootstrapped_demos=4)\ncompiled = optimizer.compile(triage, trainset=trainset)       # searches for few-shot demos that pass the metric\ncompiled.save(\"triage.json\")\n"
    },
    {
      h: 'MCP: one protocol for tools and context',
      p: [
        `The <b>Model Context Protocol</b> (introduced by Anthropic in 2024, now an open standard) standardizes how an AI application gets tools and context. A <b>host</b> application (Claude Code, an IDE, your agent) runs one <b>client</b> per <b>server</b>; servers expose <b>tools</b> (functions the model may call), <b>resources</b> (readable data addressed by URI) and <b>prompts</b> (reusable templates). Messages are JSON-RPC 2.0, over <b>stdio</b> for local servers or <b>Streamable HTTP</b> for remote ones, starting with an <code>initialize</code> capability negotiation. Write a server once and every MCP-capable host can use it, instead of re-implementing the integration per framework.`,
        `On the Anthropic API you can also attach a remote MCP server directly: <code>mcp_servers=[{"type": "url", "url": ..., "name": ...}]</code> plus a matching <code>{"type": "mcp_toolset", "mcp_server_name": ...}</code> entry in <code>tools</code>, with the <code>mcp-client-2025-11-20</code> beta. The Python SDK also ships helpers to convert MCP tools for the tool runner.`,
        `Security matters more than convenience here: an MCP server's tool descriptions go straight into the model's context (a malicious server can inject instructions through them), and its tools act with whatever credentials you gave it. Install servers you trust, pin versions, scope credentials narrowly, and require approval for side-effecting tools.`
      ],
      code: "# flaky_server.py - an MCP server exposing one tool and one resource over stdio\nfrom mcp.server.mcpserver import MCPServer   # mcp>=2; in mcp 1.x: from mcp.server.fastmcp import FastMCP\n\nmcp = MCPServer(\"flaky-tests\")\n\nHISTORY = {\"CheckoutTest#testTimeout\": \"FPPFPPPPFP\"}   # F = fail, P = pass, newest last\n\n\n@mcp.tool()\ndef flake_rate(test_id: str) -> float:\n    \"\"\"Fraction of recent CI runs in which the test failed.\"\"\"\n    runs = HISTORY.get(test_id, \"\")\n    return runs.count(\"F\") / len(runs) if runs else 0.0\n\n\n@mcp.resource(\"flaky://tests\")\ndef list_tests() -> str:\n    \"\"\"Known test ids, one per line.\"\"\"\n    return \"\\n\".join(sorted(HISTORY))\n\n\nif __name__ == \"__main__\":\n    mcp.run()          # stdio transport by default\n"
    },
    {
      h: 'Reliability: retries, idempotency, determinism',
      p: [
        `<b>Classify errors.</b> Retry transient ones: 429 rate limits (honour <code>retry-after</code>), 5xx and 529 overloaded, timeouts, connection resets. Do not retry 400-class validation or auth errors. <b>Back off exponentially with jitter</b>: delay = random(0, min(cap, base x 2^attempt)) ("full jitter"), so a thousand workers that failed together do not retry in lockstep and re-trigger the overload. Bound attempts and total time; add a circuit breaker that stops calling a dependency that keeps failing.`,
        `<b>Retries are only safe for idempotent steps.</b> If "open a Jira issue" times out after the server created the issue, a blind retry creates a duplicate. Give every side-effecting step an idempotency key derived deterministically from the workflow ID, step name and inputs, record completion in the checkpoint store, and skip steps already recorded. Send the key to the downstream API if it supports one.`,
        `<b>Determinism.</b> You cannot make a hosted LLM bit-deterministic, so make the workflow deterministic around it: record each LLM output in the checkpoint and never regenerate it on resume; cache responses keyed by a hash of the full request for tests and eval replays; pin exact model IDs and prompt versions; and seed or remove any other randomness. Then a failed run can be replayed exactly up to the failure point.`
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'Choosing an orchestration layer, durable execution in depth, parallel fan-out, and observability.',
    sections: [
      {
        h: 'Choosing the layer',
        p: [
          `Plain Python plus a small retry helper is right for short, linear, stateless pipelines. A graph library (LangGraph) fits agentic, cyclic flows with human interrupts and in-process persistence. A durable execution engine (Temporal, or step-function style services) fits long-running business workflows spanning hours or days, many services, strong exactly-once requirements on side effects, and operational tooling. A batch orchestrator (Airflow, Prefect, Dagster) fits scheduled DAGs such as nightly eval runs and data pipelines. These compose: a nightly eval DAG whose tasks each run a LangGraph agent, for example.`
        ]
      },
      {
        h: 'Replay and the determinism rule, concretely',
        p: [
          `In an event-sourced engine the workflow function is re-executed from the start on recovery, and each activity call is matched against the recorded history: if step 3 already completed, its recorded result is returned instantly instead of running again. If the workflow code branched on <code>datetime.now()</code> or <code>random()</code> directly, replay can take a different branch than the original run and the history no longer matches, which the engine reports as a non-determinism error. Hence the rule: workflow code only orchestrates; everything that touches the outside world, including the model, is an activity. LangGraph's checkpointer gives a lighter form of the same property at node granularity: a resumed thread restarts from the last saved checkpoint, so a node's side effects must be idempotent in case it ran but did not checkpoint.`
        ]
      },
      {
        h: 'Fan-out, fan-in and rate limits',
        p: [
          `Parallel branches (LangGraph's <code>Send</code> API for map-style fan-out, or a thread or async pool) multiply request rate, and a workflow that fans out 200 LLM calls will hit per-minute token limits. Put a shared limiter in front of the client (a semaphore for concurrency plus a token bucket for tokens per minute), and make the fan-in step tolerate partial failure: decide in advance whether one failed branch fails the run, is retried, or is reported as missing. For offline fan-out, the Batch API removes the problem entirely at half the price.`
        ]
      },
      {
        h: 'Observability',
        p: [
          `Trace every run as a tree: workflow, node, LLM call, tool call, with inputs, outputs, latency, token usage, model ID, prompt version, retry count and error class. OpenTelemetry is the standard transport, and LLM-specific tools such as LangSmith, Langfuse or Arize Phoenix visualize such traces. Traces are what turn "the agent sometimes fails" into a categorized failure distribution, which is the raw material of the evaluating-agents lesson.`
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: 'Franky\'s Ship-Building Log',
      text: [
        `Building the Thousand Sunny takes days and many hands, so Franky runs it from a big board: each station (keel, hull, sails, Soldier Dock) is a box with arrows to the next, and a checkmark plus the measurements go on the board the moment a station finishes. When a storm halts work overnight, nobody rebuilds the keel; they read the board and resume at the sails.`,
        `Before mounting the Gaon Cannon, the board has a red box: "wait for Iceburg's signature". Work stops there until he signs. When the timber merchant does not answer, Franky waits a little, then longer, then longer still, adding a random few minutes so he and the shipwrights are not all knocking at once. And every order to the merchant carries an order number; when a message boy is lost and Franky resends, the merchant sees the same number and does not ship a second load of Adam wood.`,
        `Any shipwright from any dock can show up with Franky's standard toolbox adapter and plug in, because the Galley-La sockets are the same everywhere.`
      ]
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Wedding Planning Binder',
      text: [
        `Monica's wedding binder has a page per task and a checkbox per step, and each step's outcome is written down: "caterer booked, deposit paid, confirmation 4471". When Chandler spills coffee on her laptop mid-planning, she does not start over; she opens the binder and continues at the first unchecked box.`,
        `Some boxes say "Chandler must approve", and she will not book the band until he does. When the florist's line is busy, Monica waits a minute, then two, then four, and Rachel jokes she adds random pauses "so she does not sound desperate". And when Monica re-sends a deposit by mistake, the florist sees confirmation 4471 already paid and refunds the duplicate.`
      ]
    },
    why: 'Franky\'s board and Monica\'s binder are a checkpointed state machine: completed steps and their results are recorded, so a crash resumes at the first unfinished step instead of redoing work. The red box and "Chandler must approve" are human-in-the-loop interrupts. Waiting longer each time with a random extra is exponential backoff with jitter. The order and confirmation numbers are idempotency keys that make retries safe. Galley-La\'s standard sockets are MCP: one protocol, any tool, any host.'
  },
  storyAnim: {
    title: 'A build that survives storms',
    h: 260,
    props: [
      { id: 'board', emoji: '🪧', label: 'board: steps + results (checkpoints)', x: 15, y: 18 },
      { id: 'keel', emoji: '🪵', label: 'keel done ✔', x: 40, y: 18 },
      { id: 'storm', emoji: '⛈️', label: 'storm: work stops', x: 65, y: 18 },
      { id: 'sign', emoji: '✍️', label: 'wait for Iceburg (interrupt)', x: 88, y: 18 },
      { id: 'merchant', emoji: '🏪', label: 'merchant: wait, wait longer + jitter', x: 30, y: 60 },
      { id: 'order', emoji: '🔖', label: 'same order number: no double ship', x: 65, y: 60 }
    ],
    actors: [
      { id: 'franky', emoji: '🦾', label: 'Franky', x: 15, y: 82 }
    ],
    steps: [
      { c: 'Each station is a box on Franky\'s board, and its result is written down the moment it finishes.', p: { board: 'lit', keel: 'good' }, a: { franky: [30, 40] } },
      { c: 'A storm stops work overnight. In the morning they read the board and resume at the sails; the keel is not rebuilt.', p: { storm: 'bad' }, a: { franky: [55, 40] } },
      { c: 'Before the Gaon Cannon, a red box: nothing proceeds until Iceburg signs.', p: { storm: 'dim', sign: 'lit' }, a: { franky: [80, 40] } },
      { c: 'The timber merchant does not answer. Franky waits, then longer, then longer, plus a random few minutes.', p: { merchant: 'lit', sign: 'good' }, a: { franky: [30, 78] } },
      { c: 'A message boy is lost, so Franky resends the order with the same number. The merchant ships once.', p: { order: 'good' }, a: { franky: [62, 78] } },
      { c: 'The Sunny is finished with every step done exactly once, whatever the weather did.', p: { board: 'good', merchant: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'A checkpointed LLM workflow run',
    intro: 'Matches the worked example. Click a box or press Play.',
    stages: [
      { label: 'Start', nodes: [
        { id: 'thread', text: 'invoke(input, thread_id)\nnew durable run' }
      ] },
      { label: 'Nodes', nodes: [
        { id: 'fetch', text: 'fetch_log\nstate update + checkpoint' },
        { id: 'classify', text: 'classify (LLM)\nRetryPolicy on transient errors' }
      ] },
      { label: 'Route', nodes: [
        { id: 'route', text: 'conditional edge\nflaky -> quarantine' }
      ] },
      { label: 'Pause', nodes: [
        { id: 'interrupt', text: 'interrupt_before quarantine\nstate persisted, process may exit' }
      ] },
      { label: 'Resume', nodes: [
        { id: 'resume', text: 'invoke(None, thread_id)\nfrom last checkpoint' },
        { id: 'side', text: 'side effect with\nidempotency key' },
        { id: 'history', text: 'get_state_history\naudit / time travel' }
      ] }
    ],
    steps: [
      { active: ['thread'], note: 'A thread ID names one durable run. Everything that happens is checkpointed under it.' },
      { active: ['fetch'], note: 'Each node returns a partial state update; reducers merge it, and a checkpoint is written after the step.' },
      { active: ['classify'], note: 'The LLM node fails once with a simulated 529. Its retry policy backs off and retries; non-transient errors would fail the run.' },
      { active: ['route'], note: 'A routing function inspects state and names the next node. Branching is explicit and visible.' },
      { active: ['interrupt'], note: 'The graph pauses before the side effect. State is saved; the process can exit while a human reviews.' },
      { active: ['resume'], note: 'Invoking with None and the same thread ID resumes from the checkpoint. Completed nodes, including the LLM call, are not re-run.' },
      { active: ['side'], note: 'The side-effecting node should still be idempotent: if it ran but crashed before checkpointing, it will run again.' },
      { active: ['history'], note: 'Every checkpoint is retained, so you can audit the path a run took or fork from an earlier state.' }
    ]
  },
  tech: [
    {
      q: 'Why "full jitter" instead of plain exponential backoff?',
      a: `When many clients fail at the same moment (a rate-limit spike), plain exponential backoff makes them retry at the same moments too, recreating the spike every interval. Drawing each delay uniformly from 0 to the exponential cap spreads retries out. AWS's analysis of backoff strategies found full jitter among the best for reducing total work and completion time under contention.`
    },
    {
      q: 'What exactly is persisted by a LangGraph checkpointer?',
      a: `A snapshot of the graph state (channel values) after each super-step, plus metadata such as which nodes run next and pending writes, keyed by thread ID and checkpoint ID. That is enough to resume, to show the state at any past step, and to fork from it. It does not capture side effects outside the state, which is why external actions need their own idempotency.`
    },
    {
      q: 'How is MCP different from just defining tools in the API request?',
      a: `API tool definitions are per request and per application: you write the schema and the handler in your code. MCP moves the tool implementation into a separate server process with a standard discovery and invocation protocol, so the same server works across hosts (IDEs, chat apps, agent frameworks) and can also expose resources and prompts. The model still sees ordinary tool definitions; MCP standardizes how hosts obtain and call them.`
    },
    {
      q: 'Which MCP Python SDK API should I use?',
      a: `It changed. In the 1.x SDK the high-level server class was <code>FastMCP</code> from <code>mcp.server.fastmcp</code>. In 2.x it was renamed <code>MCPServer</code> (<code>from mcp.server.mcpserver import MCPServer</code>) and importing the old path raises an error pointing to the migration guide; the decorator style (<code>@mcp.tool()</code>, <code>@mcp.resource(uri)</code>) is the same. Check the installed version before copying examples.`
    }
  ],
  code: {
    title: 'CI-failure triage as a LangGraph state machine',
    intro: 'Typed state with an append reducer, a node that fails transiently and is retried by policy, a conditional edge, an InMemorySaver checkpointer, and an interrupt before the side effect. The second half simulates a restart: a new compiled graph, same checkpointer and thread ID, resumes after approval without re-running the LLM node. Verified with langgraph 1.2.',
    code: "\"\"\"triage_graph.py - a CI-failure triage workflow as a LangGraph state machine:\ntyped state, a retried flaky LLM node, conditional routing, a checkpointer,\nand a human-approval interrupt that survives a \"process restart\".\npip install langgraph      then: python3 triage_graph.py   (offline; the LLM is faked)\"\"\"\nimport operator\nfrom typing import Annotated, Literal, TypedDict\n\nfrom langgraph.checkpoint.memory import InMemorySaver\nfrom langgraph.graph import END, START, StateGraph\nfrom langgraph.types import RetryPolicy\n\n\nclass Triage(TypedDict):\n    test_id: str\n    log: str\n    label: str\n    actions: Annotated[list, operator.add]     # reducer: node outputs are appended, not overwritten\n\n\nCALLS = {\"classify\": 0}\n\n\ndef fetch_log(state: Triage) -> dict:\n    return {\"log\": f\"{state['test_id']}: TimeoutException after 2000ms; passed on rerun\",\n            \"actions\": [\"fetched log\"]}\n\n\ndef classify(state: Triage) -> dict:\n    CALLS[\"classify\"] += 1\n    if CALLS[\"classify\"] == 1:                   # simulate a transient API failure (429/5xx)\n        raise ConnectionError(\"simulated 529 overloaded\")\n    label = \"flaky\" if \"passed on rerun\" in state[\"log\"] else \"regression\"\n    return {\"label\": label, \"actions\": [f\"classified as {label} (attempt {CALLS['classify']})\"]}\n\n\ndef quarantine(state: Triage) -> dict:\n    return {\"actions\": [f\"quarantined {state['test_id']}\"]}\n\n\ndef open_issue(state: Triage) -> dict:\n    return {\"actions\": [f\"opened issue for {state['test_id']}\"]}\n\n\ndef route(state: Triage) -> Literal[\"quarantine\", \"open_issue\"]:\n    return \"quarantine\" if state[\"label\"] == \"flaky\" else \"open_issue\"\n\n\nbuilder = StateGraph(Triage)\nbuilder.add_node(\"fetch_log\", fetch_log)\nbuilder.add_node(\"classify\", classify,\n                 retry_policy=RetryPolicy(max_attempts=3, initial_interval=0.1, backoff_factor=2.0,\n                                          retry_on=ConnectionError))\nbuilder.add_node(\"quarantine\", quarantine)\nbuilder.add_node(\"open_issue\", open_issue)\nbuilder.add_edge(START, \"fetch_log\")\nbuilder.add_edge(\"fetch_log\", \"classify\")\nbuilder.add_conditional_edges(\"classify\", route)\nbuilder.add_edge(\"quarantine\", END)\nbuilder.add_edge(\"open_issue\", END)\n\nsaver = InMemorySaver()                          # use SqliteSaver / PostgresSaver for real durability\n# Pause before the side effect so a human can approve quarantining a test.\ngraph = builder.compile(checkpointer=saver, interrupt_before=[\"quarantine\"])\n\nif __name__ == \"__main__\":\n    config = {\"configurable\": {\"thread_id\": \"ci-run-4812\"}}   # one thread = one durable run\n    graph.invoke({\"test_id\": \"CheckoutTest#testTimeout\", \"actions\": []}, config)\n    snap = graph.get_state(config)\n    print(\"paused before:\", snap.next)\n    print(\"state so far:\", snap.values[\"actions\"])\n\n    # ... later, possibly in another process sharing the same checkpointer ...\n    resumed = builder.compile(checkpointer=saver, interrupt_before=[\"quarantine\"])\n    final = resumed.invoke(None, config)          # None = resume from the checkpoint\n    print(\"after approval:\", final[\"actions\"])\n    print(\"checkpoints written:\", len(list(resumed.get_state_history(config))))\n",
    notes: [
      'Run: <code>pip install langgraph</code> then <code>python3 triage_graph.py</code>. Expected: paused before quarantine, classified on attempt 2, then quarantined after resume.',
      'Note that <code>CALLS["classify"]</code> stays at 2 after resuming: the recorded LLM result is reused, which is the determinism rule in action.',
      'For real durability swap <code>InMemorySaver</code> for a SQLite or Postgres checkpointer (separate <code>langgraph-checkpoint-*</code> packages).',
      'To run the classify node on Claude, call <code>client.messages.create</code> inside it and let the SDK\'s own retries handle 429/5xx, or set <code>max_retries=0</code> on the client and let <code>RetryPolicy</code> own retries; do not stack both blindly.'
    ]
  },
  lab: {
    title: 'Backoff with jitter and idempotent steps',
    prompt: `Implement three functions. <code>retry_with_backoff</code>: call <code>fn()</code>; on <code>TransientError</code> sleep <code>rand() * min(cap, base * 2 ** attempt)</code> and retry, re-raising after the last attempt; any other exception propagates immediately. <code>step_key</code>: a deterministic SHA-256 key over the step name and inputs, independent of dict key order. <code>run_step</code>: return the stored result if the key is in <code>store</code>, otherwise run <code>fn(**inputs)</code>, store and return it. The asserts inject fake <code>sleep</code> and <code>rand</code> so timing is deterministic.`,
    starter: "import hashlib\nimport json\nimport random\nimport time\n\n\nclass TransientError(Exception):\n    \"\"\"429, 5xx, timeouts: safe to retry.\"\"\"\n\n\ndef retry_with_backoff(fn, max_attempts=5, base=0.5, cap=8.0,\n                       sleep=time.sleep, rand=random.random):\n    \"\"\"Call fn(); retry TransientError with full-jitter exponential backoff.\n    delay before retry n (n = 0, 1, ...) is rand() * min(cap, base * 2 ** n).\n    Any other exception propagates immediately. Re-raise after the last attempt.\"\"\"\n    ...\n\n\ndef step_key(step_name, inputs):\n    \"\"\"Deterministic idempotency key: same step + same inputs -> same key.\"\"\"\n    ...\n\n\ndef run_step(store, step_name, inputs, fn):\n    \"\"\"Checkpointed, idempotent step: reuse the stored result if this exact step ran before.\"\"\"\n    ...\n\n\nif __name__ == \"__main__\":\n    delays, calls = [], {\"n\": 0}\n\n    def flaky():\n        calls[\"n\"] += 1\n        if calls[\"n\"] < 3:\n            raise TransientError(\"529\")\n        return \"ok\"\n\n    assert retry_with_backoff(flaky, sleep=delays.append, rand=lambda: 1.0) == \"ok\"\n    assert delays == [0.5, 1.0], delays\n\n    delays.clear()\n    try:\n        retry_with_backoff(lambda: (_ for _ in ()).throw(TransientError(\"x\")),\n                           max_attempts=6, sleep=delays.append, rand=lambda: 1.0)\n        raise AssertionError(\"should re-raise\")\n    except TransientError:\n        pass\n    assert delays == [0.5, 1.0, 2.0, 4.0, 8.0], \"capped at 8\"\n\n    try:\n        retry_with_backoff(lambda: 1 / 0, sleep=delays.append)\n        raise AssertionError(\"non-transient errors must not be retried\")\n    except ZeroDivisionError:\n        pass\n\n    store, side_effects = {}, []\n\n    def open_issue(test_id):\n        side_effects.append(test_id)\n        return \"ISSUE-1\"\n\n    assert run_step(store, \"open_issue\", {\"test_id\": \"T1\"}, open_issue) == \"ISSUE-1\"\n    assert run_step(store, \"open_issue\", {\"test_id\": \"T1\"}, open_issue) == \"ISSUE-1\"\n    assert side_effects == [\"T1\"], \"a replayed step must not repeat its side effect\"\n    assert step_key(\"s\", {\"a\": 1, \"b\": 2}) == step_key(\"s\", {\"b\": 2, \"a\": 1})\n    print(\"all checks passed\")\n",
    checks: [
      { re: 'except\\s+TransientError\\s*:(?!\\s*\\n\\s*pass)', flags: '', must: true, hint: 'Retry only TransientError: except TransientError:', pass: 'only transient errors retried' },
      { re: 'min\\(\\s*cap\\s*,\\s*base\\s*\\*\\s*2\\s*\\*\\*\\s*(?!n\\))\\w+', flags: '', must: true, hint: 'Cap the exponential: min(cap, base * 2 ** attempt).', pass: 'capped exponential delay' },
      { re: 'sleep\\(\\s*rand\\(\\)\\s*\\*', flags: '', must: true, hint: 'Full jitter: multiply the capped delay by rand().', pass: 'full jitter' },
      { re: 'max_attempts\\s*-\\s*1[\\s\\S]*raise', flags: '', must: true, hint: 'On the final attempt re-raise instead of sleeping.', pass: 're-raises when exhausted' },
      { re: 'sort_keys\\s*=\\s*True', flags: '', must: true, hint: 'Serialize inputs with json.dumps(..., sort_keys=True) so key order does not change the key.', pass: 'canonical serialization' },
      { re: 'hashlib\\.sha256\\(', flags: '', must: true, hint: 'Hash the canonical blob with hashlib.sha256.', pass: 'stable hash key' },
      { re: 'if\\s+key\\s+in\\s+store', flags: '', must: true, hint: 'Check the store before running the step.', pass: 'completed steps skipped' },
      { re: 'except\\s+Exception\\s*:', flags: '', must: false, hint: 'Catching every Exception would retry bugs and validation errors.', pass: 'no catch-all retry' }
    ],
    run: `Save as <code>lab.py</code> and run <code>python3 lab.py</code>. Then wrap a real call: <code>retry_with_backoff(lambda: client.messages.create(...))</code> with <code>anthropic.Anthropic(max_retries=0)</code>, mapping <code>anthropic.RateLimitError</code>, <code>anthropic.InternalServerError</code> and <code>anthropic.APIConnectionError</code> to <code>TransientError</code>. Persist <code>store</code> to a JSON or SQLite file to make <code>run_step</code> survive restarts.`,
    solution: "import hashlib\nimport json\nimport random\nimport time\n\n\nclass TransientError(Exception):\n    \"\"\"429, 5xx, timeouts: safe to retry.\"\"\"\n\n\ndef retry_with_backoff(fn, max_attempts=5, base=0.5, cap=8.0,\n                       sleep=time.sleep, rand=random.random):\n    \"\"\"Call fn(); retry TransientError with full-jitter exponential backoff.\n    delay before retry n (n = 0, 1, ...) is rand() * min(cap, base * 2 ** n).\n    Any other exception propagates immediately. Re-raise after the last attempt.\"\"\"\n    for attempt in range(max_attempts):\n        try:\n            return fn()\n        except TransientError:\n            if attempt == max_attempts - 1:\n                raise\n            sleep(rand() * min(cap, base * 2 ** attempt))\n\n\ndef step_key(step_name, inputs):\n    \"\"\"Deterministic idempotency key: same step + same inputs -> same key.\"\"\"\n    blob = json.dumps({\"step\": step_name, \"inputs\": inputs}, sort_keys=True)\n    return hashlib.sha256(blob.encode()).hexdigest()\n\n\ndef run_step(store, step_name, inputs, fn):\n    \"\"\"Checkpointed, idempotent step: reuse the stored result if this exact step ran before.\"\"\"\n    key = step_key(step_name, inputs)\n    if key in store:\n        return store[key]\n    result = fn(**inputs)\n    store[key] = result\n    return result\n\n\nif __name__ == \"__main__\":\n    delays, calls = [], {\"n\": 0}\n\n    def flaky():\n        calls[\"n\"] += 1\n        if calls[\"n\"] < 3:\n            raise TransientError(\"529\")\n        return \"ok\"\n\n    assert retry_with_backoff(flaky, sleep=delays.append, rand=lambda: 1.0) == \"ok\"\n    assert delays == [0.5, 1.0], delays\n\n    delays.clear()\n    try:\n        retry_with_backoff(lambda: (_ for _ in ()).throw(TransientError(\"x\")),\n                           max_attempts=6, sleep=delays.append, rand=lambda: 1.0)\n        raise AssertionError(\"should re-raise\")\n    except TransientError:\n        pass\n    assert delays == [0.5, 1.0, 2.0, 4.0, 8.0], \"capped at 8\"\n\n    try:\n        retry_with_backoff(lambda: 1 / 0, sleep=delays.append)\n        raise AssertionError(\"non-transient errors must not be retried\")\n    except ZeroDivisionError:\n        pass\n\n    store, side_effects = {}, []\n\n    def open_issue(test_id):\n        side_effects.append(test_id)\n        return \"ISSUE-1\"\n\n    assert run_step(store, \"open_issue\", {\"test_id\": \"T1\"}, open_issue) == \"ISSUE-1\"\n    assert run_step(store, \"open_issue\", {\"test_id\": \"T1\"}, open_issue) == \"ISSUE-1\"\n    assert side_effects == [\"T1\"], \"a replayed step must not repeat its side effect\"\n    assert step_key(\"s\", {\"a\": 1, \"b\": 2}) == step_key(\"s\", {\"b\": 2, \"a\": 1})\n    print(\"all checks passed\")\n",
    notes: [
      'Injecting <code>sleep</code> and <code>rand</code> makes the function testable without waiting and without randomness, the same dependency-injection idea as the mock LLM client.',
      'A production version also honours the server\'s <code>retry-after</code> header when present, using it as a floor on the delay.',
      'The idempotency key covers the inputs, so a step re-run with different inputs (a new commit) is correctly treated as new work.'
    ]
  },
  quiz: [
    {
      q: 'A checkpointed workflow crashed after its LLM classification step. On resume, what should happen to that step?',
      options: ['Re-run it to get a fresh answer', 'Reuse the recorded output from the checkpoint', 'Skip the whole workflow', 'Run it twice and vote'],
      correct: 1,
      explain: 'Recorded results are facts of the run. Regenerating makes resumed runs diverge from the original and can repeat side effects downstream.'
    },
    {
      q: 'Which error should NOT be retried with backoff?',
      options: ['429 rate limit', '529 overloaded', '400 invalid request', 'Connection reset'],
      correct: 2,
      explain: '400s are deterministic request errors; the same request fails the same way.'
    },
    {
      q: 'What does a LangGraph reducer such as Annotated[list, operator.add] control?',
      options: ['The retry policy', 'How a node\'s update to that state key merges with the existing value (append instead of overwrite)', 'Which node runs next', 'The checkpoint storage backend'],
      correct: 1,
      explain: 'Reducers define merge semantics for state keys, important when several nodes or parallel branches write the same key.'
    },
    {
      q: 'What does DSPy\'s BootstrapFewShot optimizer do?',
      options: ['Fine-tunes model weights', 'Runs the program on training examples and keeps traces that pass the metric as few-shot demonstrations', 'Generates synthetic test data only', 'Converts prompts to MCP servers'],
      correct: 1,
      explain: 'It bootstraps demonstrations by filtering the program\'s own successful traces with your metric.'
    },
    {
      q: 'In MCP, which statement is correct?',
      options: ['Servers call the model directly', 'A host runs clients that connect to servers exposing tools, resources and prompts over JSON-RPC (stdio or HTTP)', 'MCP replaces the Messages API', 'Tool descriptions from MCP servers are never shown to the model'],
      correct: 1,
      explain: 'Hosts manage clients; servers expose capabilities; the model sees the tools through the host. That is also why untrusted servers are a prompt-injection risk.'
    }
  ],
  testFlow: {
    title: 'Test yourself: making a workflow safe to retry',
    start: 'q1',
    nodes: {
      q1: { q: 'The "create Jira ticket" step timed out. Did the ticket get created?', choices: [
        { text: 'Unknown: a timeout says nothing about whether the server acted', to: 'q1_right' },
        { text: 'No, timeouts mean nothing happened', to: 'q1_wrong' }
      ] },
      q1_right: { end: true, correct: true, text: 'Right. That ambiguity is exactly why side-effecting steps need idempotency keys before you retry them.', next: 'q2' },
      q1_wrong: { end: true, correct: false, text: 'The request may have succeeded with the response lost. Assuming failure causes duplicates.', retry: 'q1' },
      q2: { q: 'How do you make the retry safe?', choices: [
        { text: 'Derive a key from run ID + step + inputs, send it to the API and record completion before moving on', to: 'q2_right' },
        { text: 'Retry faster so it finishes before anyone notices', to: 'q2_wrong' }
      ] },
      q2_right: { end: true, correct: true, text: 'Yes. Deterministic keys let the downstream service and your own store recognize the repeat.', next: 'q3' },
      q2_wrong: { end: true, correct: false, text: 'Speed does not prevent duplicates. Identity does.', retry: 'q2' },
      q3: { q: '500 workers hit a rate limit at the same time. Best retry schedule?', choices: [
        { text: 'All retry after exactly 1, 2, 4 seconds', to: 'q3_wrong' },
        { text: 'Exponential cap with full jitter, honouring retry-after', to: 'q3_right' }
      ] },
      q3_right: { end: true, correct: true, text: 'Correct. Jitter spreads the retries out so the limit is not hit again in lockstep.' },
      q3_wrong: { end: true, correct: false, text: 'Synchronized retries recreate the spike. Randomize the delays.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Retrying non-idempotent side effects (create issue, send email, charge card) without idempotency keys.',
    'Stacking retries: SDK retries inside a node retry policy inside an orchestrator retry, turning one outage into dozens of attempts per call.',
    'Regenerating LLM outputs on resume, so a resumed run takes a different path than the one a human approved.',
    'Using an in-memory checkpointer in production and losing every paused run on restart.',
    'Installing third-party MCP servers without review; their tool descriptions enter the model\'s context and their tools run with your credentials.'
  ],
  interview: [
    {
      q: 'Design a workflow that triages CI failures with an LLM, opens issues for regressions and quarantines flaky tests, with human approval.',
      a: `A state graph: fetch logs and rerun history, a deterministic pre-check (failed then passed at the same commit marks a flakiness candidate), an LLM classification node with a strict schema and retry policy on transient errors, a conditional edge on the label, and side-effecting nodes for quarantine and issue creation behind an interrupt for approval. State is checkpointed in Postgres keyed by the CI run ID as thread ID; side effects use idempotency keys derived from run ID, step and test ID. Every node is traced with model ID, prompt version and tokens. A labeled set of past failures evaluates classification on every prompt or model change, and approval decisions feed back as new labels.`
    },
    {
      q: 'Tradeoff: LangGraph versus a durable execution engine like Temporal.',
      a: `LangGraph is in-process and LLM-native: typed state, cycles, interrupts and checkpointing with little ceremony, ideal for agentic flows inside one service. Temporal is infrastructure: event-sourced durable execution across processes and machines, timers spanning days, strong guarantees around activities, versioning of workflow code and mature operations tooling, at the cost of the determinism discipline and running a cluster or service. For an interactive agent, LangGraph; for a multi-day business process with many services and strict exactly-once side effects, Temporal, possibly with LangGraph agents running inside activities.`
    },
    {
      q: 'How do you implement retries correctly around LLM calls?',
      a: `Classify errors: retry 429, 5xx, 529, timeouts and connection errors; never 400-class. Use capped exponential backoff with full jitter and honour retry-after. Bound attempts and total time, and keep exactly one retry layer per call. Make the step idempotent or record its result before any side effect depends on it. Add a circuit breaker and a concurrency or token-rate limiter so retries do not amplify an overload. Log retry counts as a metric.`
    },
    {
      q: 'What is MCP and why would you use it?',
      a: `An open protocol for connecting AI applications to tools and data. A host runs clients that connect to servers; servers expose tools, resources and prompts over JSON-RPC via stdio or Streamable HTTP, with capability negotiation at initialize. You use it to write an integration once and use it from any MCP-capable host, and to keep tool code and credentials in a separate process. The risks are trust in third-party servers, prompt injection via tool descriptions or results, and over-broad credentials, so you review, pin and scope them.`
    },
    {
      q: 'How do you make an LLM workflow reproducible for debugging and evaluation?',
      a: `Pin exact model IDs, prompt versions, tool versions and parameters, and log them per run. Record every LLM output and tool result in the trace or checkpoint so a run can be replayed without calling the model. For tests and eval reruns, cache responses keyed by a hash of the full canonical request. Remove other non-determinism from workflow code (time, randomness, unordered iteration). Accept that fresh samples differ and measure that variance explicitly rather than pretending a single run is canonical.`
    },
    {
      q: 'When is DSPy worth it over hand-written prompts?',
      a: `When there is a measurable metric, a few dozen or more labeled examples, a multi-step program whose prompts interact, or frequent model changes. The optimizer searches demonstrations and instructions systematically and recompiles for a new model. It is not worth it for a one-off prompt without a metric, and it needs a held-out test set because optimizers overfit small training sets just as hand-tuning does.`
    },
    {
      q: 'A paused workflow waiting for approval must survive a deploy. What do you need?',
      a: `A durable checkpointer (database, not memory), a stable thread or workflow ID stored with the approval request, graph code that is backward compatible with existing checkpoints (or a versioning and migration strategy for state schemas), and a resume path that loads the checkpoint and continues with the human's decision. Side effects after the approval point must be idempotent in case the resume is retried.`
    }
  ]
};
