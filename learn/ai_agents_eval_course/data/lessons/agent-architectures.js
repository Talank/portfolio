window.LESSONS = window.LESSONS || {};
window.LESSONS['agent-architectures'] = {
  id: 'agent-architectures',
  title: 'Agent Architectures: ReAct, Plan-and-Execute, Reflection & Multi-Agent',
  category: 'Part 1 — Building Agents & Workflows',
  timeMin: 45,
  summary: `Once you can write the tool loop, the real design question is how much control to give the model. At one end are <b>workflows</b>: your code fixes the steps and the model fills them in (prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer). At the other end are <b>agents</b>: the model decides the next step in a loop (ReAct and its descendants). In between sit plan-and-execute, reflection, and multi-agent systems. This lesson gives you the vocabulary interviewers use, the research each pattern comes from, and the tradeoffs in cost, latency, reliability and debuggability, with every pattern implemented on one tiny interface so you can see that they are all small amounts of control flow around <code>llm(system, prompt)</code>.`,
  goals: [
    'Define workflows versus agents precisely, and argue for the simplest architecture that meets the requirement',
    'Implement routing, sectioning, voting, orchestrator-workers and evaluator-optimizer, and say when each fits',
    'Explain ReAct, plan-and-execute (Plan-and-Solve, ReWOO, LLMCompiler) and their cost and robustness tradeoffs',
    'Explain when self-critique helps and when it does not, and why external feedback such as tests is the strong version',
    'Argue both sides of multi-agent designs: parallelism and context isolation versus token cost and coordination failures'
  ],
  concept: [
    {
      h: 'Workflows versus agents',
      p: [
        `Anthropic's "Building effective agents" (2024) draws the line that most practitioners now use: <b>workflows</b> are systems where LLMs and tools are orchestrated through predefined code paths; <b>agents</b> are systems where the LLM dynamically directs its own process and tool use. Both are built from the same block, an "augmented LLM" with retrieval, tools and memory.`,
        `The practical rule is to start with the simplest thing: a single call with good retrieval and examples, then a workflow, and only then an agent. Agents trade predictability, latency and cost for flexibility on open-ended tasks whose steps you cannot write down in advance (fixing an arbitrary GitHub issue, researching an open question). If you can draw the flowchart, it is probably a workflow, and a workflow is easier to test, cheaper, and fails in fewer ways.`,
        `Four questions decide whether an agent is justified: is the task multi-step and hard to specify in advance; is the outcome valuable enough to pay for many calls; can the model actually do it; and can errors be caught and recovered from (tests, review, rollback)? A "no" to any pushes you back toward a workflow.`
      ]
    },
    {
      h: 'The five workflow patterns',
      p: [
        `<b>Prompt chaining:</b> a fixed sequence of calls, each consuming the previous output, with programmatic <i>gates</i> between steps (validate the outline before writing the draft). Trades latency for accuracy on decomposable tasks.`,
        `<b>Routing:</b> classify the input once, then dispatch to a specialized prompt, tool set or model (easy queries to a small model, hard ones to a large one). Separation of concerns, and a cost lever.`,
        `<b>Parallelization:</b> <i>sectioning</i> splits a task into independent parts run concurrently (check security, style and correctness of a patch in parallel); <i>voting</i> runs the same task several times and aggregates (majority label, or "flag if any reviewer flags"). Self-consistency (Wang et al. 2022), sampling several reasoning paths and taking the majority answer, is voting.`,
        `<b>Orchestrator-workers:</b> a central LLM decides the subtasks at runtime, delegates them to workers, and synthesizes the results. Unlike sectioning, the subtasks are not known in advance (which files need changing depends on the issue).`,
        `<b>Evaluator-optimizer:</b> one call generates, another evaluates against criteria and returns feedback, loop until it passes or a budget runs out. Works when evaluation is easier than generation and the criteria are clear.`
      ],
      code: `# Routing in production terms: a cheap classifier picks the expensive path
label = llm("ROUTER: one word: flaky | regression | infra", log)
model = {"flaky": "claude-haiku-5-5", "regression": "claude-opus-5-5"}.get(label, "claude-sonnet-5-5")

# Sectioning: independent reviews of one diff, concurrently
with ThreadPoolExecutor() as pool:
    reviews = list(pool.map(lambda aspect: llm(f"Review ONLY {aspect}.", diff),
                            ["security", "correctness", "test coverage"]))`
    },
    {
      h: 'ReAct and plan-and-execute',
      p: [
        `<b>ReAct</b> (Yao et al., ICLR 2023) interleaves reasoning traces and actions: Thought, Action, Observation, repeat, Final Answer. Reasoning decides the next action, and observations ground the reasoning, which reduced hallucination compared with reasoning alone on knowledge tasks. Modern native tool calling is ReAct with a structured envelope: the "Thought" is text or thinking blocks, the "Action" is a <code>tool_use</code> block. Its weakness is myopia: one step at a time, with the whole growing history re-sent each step.`,
        `<b>Plan-and-execute</b> generates a plan first and then executes steps, replanning on failure. Plan-and-Solve prompting (Wang et al. 2023) asks the model to devise a plan before solving; <b>ReWOO</b> (Xu et al. 2023) writes the full plan with placeholders for tool outputs, runs the tools, then solves, avoiding re-sending observations through the reasoner at every step; <b>LLMCompiler</b> (Kim et al. 2023) plans a DAG of tool calls and executes independent ones in parallel. Plans cut the number of expensive reasoning calls and make the run inspectable, but a wrong early plan propagates unless you replan when observations contradict it.`,
        `In practice strong current models do well with a plain ReAct-style tool loop plus an explicit instruction to plan first and to keep a todo list, which gets much of the benefit of planning without a separate planner.`
      ]
    },
    {
      h: 'Reflection and self-critique',
      p: [
        `<b>Self-Refine</b> (Madaan et al. 2023) has the same model generate, critique and refine iteratively. <b>Reflexion</b> (Shinn et al. 2023) stores verbal reflections on failed trials in an episodic memory and retries, which improved results on coding and decision tasks where the environment provides a success signal such as unit tests.`,
        `The caveat interviewers like: Huang et al. (2023, "Large Language Models Cannot Self-Correct Reasoning Yet") found that <i>intrinsic</i> self-correction, with no external feedback, often fails to improve and can turn right answers into wrong ones. Reflection works best when the critic has information the generator lacked: test results, compiler or linter output, a retrieved source, a stricter rubric, or a different model. For software, the test suite is the critic. That is the whole idea behind test-driven agent loops and Agentless-style validation in the coding-agents lesson.`,
        `Also keep the best candidate, not the last: revisions are not monotonic, and a later round can regress.`
      ]
    },
    {
      h: 'Multi-agent systems: when splitting helps',
      p: [
        `A multi-agent system is several LLM loops with their own prompts, tools and contexts, coordinated by an orchestrator or by message passing (AutoGen, CAMEL, MetaGPT-style role teams, or a lead agent with subagents). The real benefits are <b>parallelism</b> on breadth-first tasks (research many sources at once), <b>context isolation</b> (each subagent spends its own context on reading and returns a compressed result), and <b>specialization</b> (different tools and permissions per role).`,
        `The costs are just as real. Token use multiplies, since every agent re-reads context: Anthropic reported that its multi-agent research system used far more tokens than single-agent chat and paid off mainly on valuable, highly parallel research tasks. Coordination fails in new ways: subagents duplicate work, misread an underspecified delegation, or make decisions that conflict because they cannot see each other's context (Cognition's 2025 "Don't Build Multi-Agents" makes this argument for coding, where actions carry implicit decisions). Studies of failures in multi-agent frameworks (for example Cemri et al. 2025) find many failures come from specification and inter-agent misalignment rather than from individual model errors.`,
        `Rule of thumb: use subagents for read-heavy, parallelizable, loosely coupled work whose results can be summarized; keep a single agent with full context for tightly coupled work such as editing one codebase.`
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'Choosing an architecture on purpose, memory, search-based agents, and how each architecture changes what you must evaluate.',
    sections: [
      {
        h: 'A decision procedure you can say out loud',
        p: [
          `1. Can one well-prompted call with retrieval do it? Ship that. 2. Are the steps known? Use a chain or a router, with code gates. 3. Are there independent parts or does reliability need redundancy? Add sectioning or voting. 4. Are subtasks only known at runtime? Orchestrator-workers. 5. Is there a checkable quality bar? Evaluator-optimizer, ideally with an external checker. 6. Is it open-ended with unpredictable steps and recoverable errors? An agent loop, with budgets and sandboxing. 7. Is it broad, read-heavy and parallel? Consider subagents. At each step, the eval set tells you whether the added complexity paid for itself.`
        ]
      },
      {
        h: 'Memory',
        p: [
          `Short-term memory is the transcript, bounded by the context window and managed by truncation, clearing and compaction. Long-term memory persists across sessions: a file or key-value store the agent reads and writes through a tool (Anthropic's memory tool, <code>memory_20250818</code>, gives Claude a file directory for this), a vector store of past episodes (Reflexion's reflections), or structured notes such as a todo list or a progress file. The design questions are what to write (decisions and lessons, not raw logs), when to read (on start, on retrieval cues), and how to prevent stale or poisoned memories from steering later runs.`
        ]
      },
      {
        h: 'Search over trajectories',
        p: [
          `Tree of Thoughts (Yao et al. 2023) explores several reasoning branches with self-evaluation and backtracking; LATS (Zhou et al. 2023) applies Monte Carlo tree search over agent actions with environment feedback. In coding, sampling many candidate patches and selecting with tests is the same idea in its simplest form (best-of-n with a verifier). Search improves success when there is a reliable value signal and the budget allows many rollouts; without a good verifier it mostly multiplies cost.`
        ]
      },
      {
        h: 'Each architecture changes the evaluation',
        p: [
          `A workflow can be evaluated step by step: router accuracy, per-stage output quality, end-to-end success. An agent needs trajectory-level metrics: success rate, turns, cost, tool-call errors, and whether it took unsafe actions. Multi-agent systems add delegation quality and duplicated work. Voting and best-of-n change the compute budget per item, so comparisons must be at matched cost. The evaluating-agents lesson builds these metrics.`
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: 'How the Straw Hats Plan a Raid',
      text: [
        `For a routine supply stop, Nami writes the plan in advance: dock, buy food, buy medicine, leave by sunset. Each step checks the last (no leaving without the medicine), and Sanji goes to the food market while Chopper goes to the pharmacy at the same time. Nobody improvises; it is a workflow.`,
        `Enies Lobby is different. Nobody knows the layout, so Luffy charges in and decides each move from what he sees: look, act, observe, repeat. Franky's plan to draw the whole route first saves time on the bridges but fails when a drawbridge turns out to be raised, so they redraw from there. Usopp, as Sogeking, critiques the shots, but only after seeing where the last cannonball landed; without that, his "critique" is just guessing.`,
        `When the crew splits up to fight several CP9 agents at once, each fight goes faster because nobody waits for anyone else. But Zoro and Sanji, out of contact, both chase the same key while nobody goes after the other one, and every pair spends a long time explaining to each other what happened when they regroup.`
      ]
    },
    sitcom: {
      show: 'Friends',
      title: 'Planning Thanksgiving Dinner',
      text: [
        `Monica runs Thanksgiving as a fixed plan: turkey at noon, sides at three, a check that the oven is free before each dish. Guests get routed: Joey to the food, Chandler to anything that requires no cooking. Rachel's trifle, made with no recipe check, is the cautionary tale of skipping a gate between steps.`,
        `When the friends try to "divide and conquer" a dinner nobody planned, three of them buy pies and nobody buys potatoes. Ross insists on re-reading his own toast five times; it only gets better when Phoebe actually listens and tells him which joke fell flat.`
      ]
    },
    why: 'The supply stop and Monica\'s schedule are workflows with gates, routing and parallel sections. Luffy at Enies Lobby is a ReAct agent: observe, decide, act. Franky\'s route drawing is plan-and-execute with replanning when the plan meets reality. Sogeking critiquing only after seeing the landing, and Ross improving only with Phoebe\'s feedback, show that reflection works with external signals. The split CP9 fights and the three pies are multi-agent parallelism and its coordination failures.'
  },
  storyAnim: {
    title: 'From fixed plan to improvising to splitting up',
    h: 270,
    props: [
      { id: 'plan', emoji: '📜', label: 'fixed plan + checks (workflow)', x: 15, y: 16 },
      { id: 'map', emoji: '🗺️', label: 'route drawn first (plan-and-execute)', x: 48, y: 16 },
      { id: 'bridge', emoji: '🌉', label: 'raised drawbridge: replan', x: 80, y: 16 },
      { id: 'shot', emoji: '🎯', label: 'critique after seeing the landing', x: 15, y: 52 },
      { id: 'split', emoji: '🔀', label: 'crew splits: parallel fights', x: 48, y: 52 },
      { id: 'key', emoji: '🗝️', label: 'two chase one key, none the other', x: 80, y: 52 }
    ],
    actors: [
      { id: 'luffy', emoji: '👒', label: 'Luffy', x: 30, y: 82 },
      { id: 'zoro', emoji: '⚔️', label: 'Zoro', x: 60, y: 82 },
      { id: 'sanji', emoji: '🚬', label: 'Sanji', x: 75, y: 82 }
    ],
    steps: [
      { c: 'A routine supply stop runs on a written plan with a check between steps. Predictable and cheap.', p: { plan: 'good' } },
      { c: 'Enies Lobby has no known layout. Luffy looks, acts, observes, and decides again: the agent loop.', a: { luffy: [30, 65] } },
      { c: 'Franky draws the route first, which saves time until it meets reality.', p: { map: 'lit' } },
      { c: 'A drawbridge is raised. The plan fails at that step, so they replan from there instead of following it blindly.', p: { bridge: 'bad', map: 'good' } },
      { c: 'Sogeking critiques each shot only after seeing where it landed. Feedback from the world makes the critique useful.', p: { shot: 'good' } },
      { c: 'The crew splits to fight several agents at once. Each fight runs in parallel.', p: { split: 'good' }, a: { zoro: [60, 66], sanji: [74, 66] } },
      { c: 'Out of contact, Zoro and Sanji both chase the same key and nobody gets the other. Parallelism without shared context duplicates and misses work.', p: { key: 'bad' }, a: { zoro: [78, 70], sanji: [84, 70] } }
    ]
  },
  conceptFlow: {
    title: 'The architecture spectrum',
    intro: 'Left is more code control, right is more model control. Click a box or press Play.',
    stages: [
      { label: 'Single call', nodes: [
        { id: 'aug', text: 'Augmented LLM\nretrieval + tools + examples' }
      ] },
      { label: 'Workflows', nodes: [
        { id: 'chain', text: 'Prompt chain\nwith code gates' },
        { id: 'router', text: 'Router\nclassify, then dispatch' },
        { id: 'parallel', text: 'Sectioning / voting' }
      ] },
      { label: 'Dynamic workflows', nodes: [
        { id: 'orch', text: 'Orchestrator-workers\nsubtasks decided at runtime' },
        { id: 'evalopt', text: 'Evaluator-optimizer\ncritic with external signal' }
      ] },
      { label: 'Agents', nodes: [
        { id: 'react', text: 'ReAct tool loop\nthink, act, observe' },
        { id: 'plan', text: 'Plan-and-execute\nreplan on failure' }
      ] },
      { label: 'Many agents', nodes: [
        { id: 'multi', text: 'Lead + subagents\nparallel, isolated contexts' }
      ] }
    ],
    steps: [
      { active: ['aug'], note: 'Start here. Many tasks need only one call with the right context and examples.' },
      { active: ['chain', 'router'], note: 'When the steps are known, fix them in code. Gates between steps catch errors early; a router sends each input to the right specialist or model size.' },
      { active: ['parallel'], note: 'Independent parts run concurrently (sectioning); redundant runs are aggregated for reliability (voting, self-consistency).' },
      { active: ['orch'], note: 'When the subtasks depend on the input, an orchestrator LLM decides them at runtime and delegates.' },
      { active: ['evalopt'], note: 'Generate, evaluate, revise. It works when evaluation is easier than generation, and best when the critic has external evidence such as test results.' },
      { active: ['react'], note: 'The model chooses each next action from observations. Most flexible, least predictable, and every step re-sends the history.' },
      { active: ['plan'], note: 'Plan first to reduce expensive reasoning calls and make runs inspectable; replan when observations contradict the plan.' },
      { active: ['multi'], note: 'Subagents buy parallelism and context isolation at a large token cost and new coordination failures. Best for broad, read-heavy, loosely coupled work.' }
    ]
  },
  tech: [
    {
      q: 'Is ReAct obsolete now that models have native tool calling?',
      a: `The text format is, mostly; the idea is not. Native tool calling removes brittle parsing of "Action:" lines and gives typed arguments, but the control flow, interleaving reasoning with actions and grounding each step in observations, is exactly what every tool loop does. Knowing ReAct matters for reading the literature and for models or settings without native tools.`
    },
    {
      q: 'Why does voting improve accuracy, and when does it not?',
      a: `If samples have independent errors and each is right more often than any single wrong answer, the majority is right more often than one sample (the Condorcet intuition). It fails when errors are correlated, when there is no canonical answer to vote on (free text needs normalization or a judge), and when the budget would be better spent on a stronger model or a verifier.`
    },
    {
      q: 'What makes an orchestrator different from a router?',
      a: `A router makes one classification and hands the whole input to one path. An orchestrator produces a variable set of subtasks for a specific input, may call several workers, and must synthesize their outputs, which introduces delegation quality and result merging as new failure points.`
    },
    {
      q: 'Why do multi-agent systems use so many more tokens?',
      a: `Each agent has its own system prompt and tools and re-reads its own growing transcript every turn; the lead agent re-reads all the summaries; and tasks are split precisely because they involve a lot of reading. Total tokens scale roughly with the number of agents times their turns, which is why the pattern pays off only for high-value, parallel tasks.`
    }
  ],
  code: {
    title: 'All the patterns on one interface',
    intro: 'Routing, orchestrator-workers (with a planner), voting, evaluator-optimizer and a text-format ReAct agent, each a few lines of control flow around <code>llm(system, prompt)</code>. A deterministic fake LLM makes the control flow visible offline; swap in <code>claude</code> to run for real.',
    code: "\"\"\"patterns.py - the five workflow patterns plus a ReAct agent, on one interface.\nEvery pattern takes `llm(system, prompt) -> str`. Offline, a deterministic fake stands in;\nswap in `claude()` below to run against the API.\"\"\"\nimport json\nimport re\nfrom concurrent.futures import ThreadPoolExecutor\n\n\ndef claude(system, prompt, model=\"claude-opus-5-5\"):\n    import anthropic\n    resp = anthropic.Anthropic().messages.create(\n        model=model, max_tokens=2048, system=system,\n        messages=[{\"role\": \"user\", \"content\": prompt}])\n    return \"\".join(b.text for b in resp.content if b.type == \"text\")\n\n\ndef fake_llm(system, prompt):\n    \"\"\"Keyword-driven stand-in so the control flow is visible and testable offline.\"\"\"\n    if system.startswith(\"ROUTER\"):\n        return \"flaky\" if re.search(r\"rerun|intermittent|timeout\", prompt) else \"regression\"\n    if system.startswith(\"PLANNER\"):\n        return json.dumps([\"reproduce the failure\", \"find the timing assumption\", \"propose a fix\"])\n    if system.startswith(\"WORKER\"):\n        return f\"done: {prompt.splitlines()[0]}\"\n    if system.startswith(\"CRITIC\"):\n        return \"PASS\" if \"await\" in prompt else \"FAIL: still uses sleep(); wait on the condition instead\"\n    if system.startswith(\"WRITER\"):\n        return (\"fix: replace sleep(2) with await_until(order.is_paid)\" if \"FAIL\" in prompt\n                else \"fix: increase sleep(2) to sleep(5)\")\n    if system.startswith(\"REACT\"):\n        if \"Observation: 3 failures\" in prompt:\n            return \"Thought: enough evidence.\\nFinal Answer: timing-dependent flaky test\"\n        return \"Thought: check the history.\\nAction: rerun_history\\nAction Input: test_checkout\"\n    return \"ok\"\n\n\n# 1. Routing: classify once, then send to a specialized prompt/model\ndef route(llm, failure_log):\n    label = llm(\"ROUTER: answer exactly one word: flaky or regression.\", failure_log).strip()\n    handlers = {\"flaky\": \"WORKER flaky-triage\", \"regression\": \"WORKER bisect\"}\n    return label, llm(handlers.get(label, \"WORKER generic\"), failure_log)\n\n\n# 2. Plan-and-execute / orchestrator-workers: plan once, fan out, synthesize\ndef orchestrate(llm, task):\n    steps = json.loads(llm(\"PLANNER: return a JSON list of independent subtasks.\", task))\n    with ThreadPoolExecutor(max_workers=len(steps)) as pool:          # sectioning in parallel\n        results = list(pool.map(lambda s: llm(\"WORKER\", f\"{s}\\ncontext: {task}\"), steps))\n    return steps, results\n\n\n# 3. Parallelization by voting: same task, several samples, majority wins\ndef vote(llm, failure_log, n=5):\n    labels = [llm(\"ROUTER: answer exactly one word: flaky or regression.\", failure_log) for _ in range(n)]\n    return max(set(labels), key=labels.count), labels\n\n\n# 4. Evaluator-optimizer (reflection): generate, critique, revise until PASS or budget\ndef refine(llm, task, max_rounds=3):\n    draft, history = llm(\"WRITER\", task), []\n    for _ in range(max_rounds):\n        verdict = llm(\"CRITIC: reply PASS or FAIL: <reason>.\", f\"task: {task}\\ndraft: {draft}\")\n        history.append((draft, verdict))\n        if verdict.startswith(\"PASS\"):\n            break\n        draft = llm(\"WRITER\", f\"task: {task}\\nprevious: {draft}\\ncritique: {verdict}\")\n    return draft, history\n\n\n# 5. ReAct: interleave Thought / Action / Observation in text until a Final Answer\nTOOLS = {\"rerun_history\": lambda test: \"3 failures in last 20 runs, all TimeoutException\"}\n\n\ndef react(llm, question, max_steps=5):\n    scratch = f\"Question: {question}\\n\"\n    for _ in range(max_steps):\n        out = llm(\"REACT: use Thought/Action/Action Input or Final Answer.\", scratch)\n        scratch += out + \"\\n\"\n        final = re.search(r\"Final Answer:\\s*(.*)\", out)\n        if final:\n            return final.group(1), scratch\n        action = re.search(r\"Action:\\s*(\\w+)\\s*\\nAction Input:\\s*(.*)\", out)\n        obs = TOOLS[action.group(1)](action.group(2)) if action and action.group(1) in TOOLS \\\n            else \"unknown action\"\n        scratch += f\"Observation: {obs}\\n\"\n    return None, scratch\n\n\nif __name__ == \"__main__\":\n    log = \"CheckoutTest#testTimeout failed: TimeoutException; passed on rerun\"\n    print(\"route      ->\", route(fake_llm, log))\n    print(\"orchestrate->\", orchestrate(fake_llm, \"fix flaky CheckoutTest\")[1])\n    print(\"vote       ->\", vote(fake_llm, log)[0])\n    final, hist = refine(fake_llm, \"make CheckoutTest deterministic\")\n    print(\"refine     ->\", final, f\"({len(hist)} critique rounds)\")\n    answer, trace = react(fake_llm, \"Is test_checkout flaky?\")\n    print(\"react      ->\", answer)\n    print(trace)\n",
    notes: [
      'Run: <code>python3 patterns.py</code>. The refine step shows the critic rejecting a sleep-based "fix" and accepting a condition wait, the same judgement you would want on a timing-dependent flaky test.',
      'To go live, replace <code>fake_llm</code> with <code>claude</code> (needs <code>pip install anthropic</code> and <code>ANTHROPIC_API_KEY</code>) and rewrite the system prompts as real instructions.',
      'The ReAct parser is deliberately fragile, which is the point: native tool calling replaced it with typed tool_use blocks.'
    ]
  },
  lab: {
    title: 'An evaluator-optimizer loop that keeps the best draft',
    prompt: `Implement <code>refine(generate, critique, task, max_rounds=4, threshold=0.9)</code>. Call <code>generate(task, feedback)</code> (feedback is <code>None</code> first), score the draft with <code>critique(draft) -&gt; (score, feedback)</code>, pass that feedback into the next generation, stop as soon as a score reaches the threshold, and return <code>(best_draft, best_score, rounds)</code> where best means highest score seen. The test includes a revision that regresses, so returning the last draft fails.`,
    starter: "def refine(generate, critique, task, max_rounds=4, threshold=0.9):\n    \"\"\"Evaluator-optimizer loop.\n    generate(task, feedback) -> draft      (feedback is None on the first call)\n    critique(draft) -> (score in [0, 1], feedback text)\n    Stop as soon as a draft scores >= threshold, or after max_rounds critiques.\n    Return (best_draft, best_score, rounds) - the BEST draft seen, not the last one.\"\"\"\n    # your code: loop up to max_rounds, generate with the previous feedback,\n    # critique, remember the best (draft, score), stop early at threshold\n    ...\n\n\nif __name__ == \"__main__\":\n    drafts = iter([\"v1\", \"v2\", \"v3\", \"v4\"])\n    scores = {\"v1\": (0.4, \"too vague\"), \"v2\": (0.8, \"missing test\"), \"v3\": (0.6, \"regressed\"), \"v4\": (0.7, \"meh\")}\n    calls = []\n\n    def gen(task, fb):\n        calls.append(fb)\n        return next(drafts)\n\n    best, score, rounds = refine(gen, lambda d: scores[d], \"patch\", max_rounds=4)\n    assert (best, score, rounds) == (\"v2\", 0.8, 4), \"keep the best draft, not the last\"\n    assert calls == [None, \"too vague\", \"missing test\", \"regressed\"], \"pass the critique back\"\n\n    early = iter([\"a\", \"b\"])\n    out = refine(lambda t, f: next(early), lambda d: (0.95, \"good\") if d == \"b\" else (0.5, \"x\"), \"patch\")\n    assert out == (\"b\", 0.95, 2), \"stop at the first draft over threshold\"\n    print(\"all checks passed\")\n",
    checks: [
      { re: 'for\\s+\\w+\\s+in\\s+range\\(', flags: '', must: true, hint: 'Bound the loop with for ... in range(1, max_rounds + 1).', pass: 'bounded rounds' },
      { re: 'draft\\s*=\\s*generate\\(\\s*task\\s*,\\s*feedback\\s*\\)', flags: '', must: true, hint: 'Feed the latest critique back: generate(task, feedback).', pass: 'critique flows into the next draft' },
      { re: 'score\\s*,\\s*feedback\\s*=\\s*critique\\(', flags: '', must: true, hint: 'Unpack score, feedback = critique(draft).', pass: 'critic scores every draft' },
      { re: 'if\\s+score\\s*>\\s*best_score', flags: '', must: true, hint: 'Track the best: if score > best_score: remember draft and score.', pass: 'best draft tracked' },
      { re: 'score\\s*>=\\s*threshold[\\s\\S]*break', flags: '', must: true, hint: 'Stop early: if score >= threshold: break.', pass: 'early stop at threshold' },
      { re: 'while\\s+True', flags: '', must: false, hint: 'Avoid while True: a reflection loop must have a hard budget.', pass: 'no unbounded loop' }
    ],
    run: `Save as <code>lab.py</code> and run <code>python3 lab.py</code>. For a real version, make <code>generate</code> call Claude with the task and feedback, and make <code>critique</code> run your project's tests on the draft and return the pass fraction as the score, with failing test names as feedback. That turns intrinsic self-critique into externally grounded refinement.`,
    solution: "def refine(generate, critique, task, max_rounds=4, threshold=0.9):\n    \"\"\"Evaluator-optimizer loop.\n    generate(task, feedback) -> draft      (feedback is None on the first call)\n    critique(draft) -> (score in [0, 1], feedback text)\n    Stop as soon as a draft scores >= threshold, or after max_rounds critiques.\n    Return (best_draft, best_score, rounds) - the BEST draft seen, not the last one.\"\"\"\n    feedback = None\n    best_draft, best_score = None, float(\"-inf\")\n    rounds = 0\n    for rounds in range(1, max_rounds + 1):\n        draft = generate(task, feedback)\n        score, feedback = critique(draft)\n        if score > best_score:\n            best_draft, best_score = draft, score\n        if score >= threshold:\n            break\n    return best_draft, best_score, rounds\n\n\nif __name__ == \"__main__\":\n    drafts = iter([\"v1\", \"v2\", \"v3\", \"v4\"])\n    scores = {\"v1\": (0.4, \"too vague\"), \"v2\": (0.8, \"missing test\"), \"v3\": (0.6, \"regressed\"), \"v4\": (0.7, \"meh\")}\n    calls = []\n\n    def gen(task, fb):\n        calls.append(fb)\n        return next(drafts)\n\n    best, score, rounds = refine(gen, lambda d: scores[d], \"patch\", max_rounds=4)\n    assert (best, score, rounds) == (\"v2\", 0.8, 4), \"keep the best draft, not the last\"\n    assert calls == [None, \"too vague\", \"missing test\", \"regressed\"], \"pass the critique back\"\n\n    early = iter([\"a\", \"b\"])\n    out = refine(lambda t, f: next(early), lambda d: (0.95, \"good\") if d == \"b\" else (0.5, \"x\"), \"patch\")\n    assert out == (\"b\", 0.95, 2), \"stop at the first draft over threshold\"\n    print(\"all checks passed\")\n",
    notes: [
      'Initializing best_score to negative infinity guarantees the first draft is recorded even if it scores 0.',
      'Returning <code>rounds</code> lets you measure how many critiques the loop needs on average, a direct cost metric.',
      'With an LLM critic, use a different prompt or model than the generator and a concrete rubric; with tests as the critic, watch for patches that game the tests.'
    ]
  },
  quiz: [
    {
      q: 'You can write down every step of a document-processing task in advance. Which architecture fits best?',
      options: ['A fully autonomous agent', 'A workflow such as a prompt chain with validation gates', 'A multi-agent debate', 'Tree search over trajectories'],
      correct: 1,
      explain: 'Known steps belong in code. Workflows are cheaper, faster and easier to test than agents.'
    },
    {
      q: 'What distinguishes orchestrator-workers from parallel sectioning?',
      options: ['Workers use a different model', 'The subtasks are decided at runtime by an LLM rather than fixed in code', 'Orchestrator-workers never run in parallel', 'Sectioning needs tools'],
      correct: 1,
      explain: 'Sectioning splits along predefined lines; an orchestrator decides the split per input.'
    },
    {
      q: 'Which finding is most relevant to designing a self-critique loop?',
      options: ['Self-critique always improves answers', 'Intrinsic self-correction without external feedback often fails to help and can hurt; external signals like tests make reflection effective', 'Reflection only works with temperature 0', 'Critique must use the same prompt as generation'],
      correct: 1,
      explain: 'Huang et al. 2023 showed intrinsic self-correction is unreliable; Reflexion-style gains rely on environment feedback such as unit tests.'
    },
    {
      q: 'What does ReWOO change relative to ReAct?',
      options: ['It removes tools', 'It plans all tool calls up front with placeholders, executes them, then solves, avoiding re-sending observations through the reasoner each step', 'It uses voting', 'It requires multiple agents'],
      correct: 1,
      explain: 'ReWOO decouples reasoning from observations to cut token use, at the price of less adaptivity.'
    },
    {
      q: 'A team proposes five specialized agents to edit one tightly coupled codebase. Main risk?',
      options: ['Too few tokens used', 'Conflicting edits and lost context between agents, plus multiplied token cost', 'Agents cannot call tools', 'It will be too deterministic'],
      correct: 1,
      explain: 'Tightly coupled work suffers when agents cannot see each other\'s decisions. Subagents suit read-heavy, loosely coupled tasks.'
    }
  ],
  testFlow: {
    title: 'Test yourself: pick the architecture',
    start: 'q1',
    nodes: {
      q1: { q: 'Support tickets fall into billing, bugs and how-to questions, each best handled by a different prompt. Pattern?', choices: [
        { text: 'Routing', to: 'q1_right' },
        { text: 'Multi-agent debate', to: 'q1_wrong' }
      ] },
      q1_right: { end: true, correct: true, text: 'Yes. Classify once, dispatch to the specialist path; a cheap model can do the classification.', next: 'q2' },
      q1_wrong: { end: true, correct: false, text: 'Debate adds cost without addressing the real need, which is sending each ticket to the right handler.', retry: 'q1' },
      q2: { q: 'Generating a patch is hard, but checking it is easy because a test suite exists. Pattern?', choices: [
        { text: 'Evaluator-optimizer with the tests as the evaluator', to: 'q2_right' },
        { text: 'Ask the same model whether its patch looks right', to: 'q2_wrong' }
      ] },
      q2_right: { end: true, correct: true, text: 'Right. An external, reliable critic is when reflection works best.', next: 'q3' },
      q2_wrong: { end: true, correct: false, text: 'Intrinsic self-critique is unreliable. Use the signal you have: run the tests.', retry: 'q2' },
      q3: { q: 'You must survey 40 papers and write a synthesis. Single agent or lead plus subagents?', choices: [
        { text: 'Lead plus subagents, each reading a subset and returning a summary', to: 'q3_right' },
        { text: 'Always a single agent; multi-agent never helps', to: 'q3_wrong' }
      ] },
      q3_right: { end: true, correct: true, text: 'Broad, parallel, read-heavy and loosely coupled: the case where subagents pay for their token cost.' },
      q3_wrong: { end: true, correct: false, text: 'This is the favourable case for subagents: parallel reading with isolated contexts and compressed results.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Reaching for an autonomous agent when the steps are known; you pay in cost, latency and flakiness for flexibility you do not use.',
    'Self-critique loops with no external signal and no budget, which burn tokens and can make correct answers worse.',
    'Returning the last revision instead of the best one; refinement is not monotonic.',
    'Splitting tightly coupled work across agents that cannot see each other\'s decisions.',
    'Comparing architectures at different compute budgets (voting with 5 samples versus one call) and calling the winner "better".'
  ],
  interview: [
    {
      q: 'What is the difference between an agent and a workflow, and how do you decide which to build?',
      a: `In a workflow, code fixes the control flow and LLM calls fill in steps; in an agent, the model chooses the next action in a loop. I start with the simplest option that can meet the quality bar: a single augmented call, then a chain or router with code gates, then dynamic patterns, and only then an agent, when the steps genuinely cannot be specified in advance, the task value justifies many calls, and errors are recoverable through tests, review or rollback. Each step up has to beat the previous one on the eval set at an acceptable cost.`
    },
    {
      q: 'Design: an automated code-review assistant for pull requests.',
      a: `Mostly a workflow. Gather context deterministically (diff, touched files, related tests, CI results). Sectioning: parallel reviewers for correctness, security, tests and style, each with a focused rubric and asked to cite lines. An aggregation step deduplicates and ranks comments, with a gate that drops comments not anchored to changed lines. Optionally a small agent loop for one sub-question ("does any caller rely on this behaviour?") with read-only code search tools. Evaluate on historical PRs: precision of comments against what human reviewers flagged, plus developer acceptance in a pilot. Keep cost bounded by routing trivial PRs to a cheap model.`
    },
    {
      q: 'Tradeoff: ReAct versus plan-and-execute.',
      a: `ReAct adapts every step to fresh observations, which is robust when the environment is surprising, but it re-sends the whole history to the reasoner each step and can wander. Plan-and-execute makes fewer expensive reasoning calls, can run independent steps in parallel (LLMCompiler), and gives an inspectable plan, but a bad plan propagates unless the executor detects contradictions and replans. Hybrids are common: plan, execute with a tool loop, replan on failure or at checkpoints.`
    },
    {
      q: 'When does reflection actually help?',
      a: `When the critic has information the generator did not: test results, compiler errors, a retrieved source, a verifier, or a stricter rubric applied by a different prompt or model. Without that, studies show self-correction is unreliable and can turn right answers wrong. I implement it as evaluator-optimizer with an external signal, a round budget, and best-candidate tracking.`
    },
    {
      q: 'Make the case for and against multi-agent systems.',
      a: `For: parallelism on broad tasks, context isolation so each subagent can read a lot and return a compressed result, and per-role tools and permissions. Against: token cost multiplies, delegation can be underspecified, agents duplicate or contradict each other because they lack shared context, and failures are harder to debug. I would use them for research-style fan-out, and keep one agent with full context for tightly coupled edits, measuring cost per successful task against a single-agent baseline.`
    },
    {
      q: 'How do you evaluate a router?',
      a: `As a classifier first: a labeled set of inputs with the correct route, measuring accuracy and the confusion matrix, weighted by the cost of each misroute (sending a hard question to the small model is worse than the reverse). Then end-to-end: task success and cost with the router versus always using the strongest path. A router that saves money but drops quality on a slice is a regression you only see with per-slice metrics.`
    },
    {
      q: 'Your agent is right 60% of the time. Would you add voting, a verifier, or a stronger model?',
      a: `It depends on the error structure and budget. If answers are checkable (tests, schema, a computation), a verifier with best-of-n is usually the strongest lever because it converts sampling into success. If answers are categorical and errors look independent, voting helps cheaply. If errors are systematic (the model lacks a capability or context), more samples repeat the same mistake, and a stronger model or better retrieval is the fix. I would check by sampling the same failing items several times: if failures are consistent, it is systematic.`
    }
  ]
};
