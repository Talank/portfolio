window.LESSONS = window.LESSONS || {};
window.LESSONS['evaluating-agents'] = {
  id: 'evaluating-agents',
  title: 'Evaluating Agents: Trajectories, Tracing, Cost/Latency, Safety & Regression Suites',
  category: 'Part 3 — Evaluation at Scale',
  timeMin: 45,
  summary: `An agent is a loop of model calls and tool calls acting on an environment, so "did it get the right answer?" is only one of several questions. Did it reach the right end state? Did it get there by an acceptable path, without forbidden actions? What did it cost, how long did it take, how many steps? Does it succeed every time, or only sometimes? This lesson separates outcome from trajectory evaluation, shows how to get trajectories out of OpenTelemetry traces, defines tool-call metrics and budget checks, covers safety and red-teaming evals, and ends with regression suites that gate changes in CI.`,
  goals: [
    `Distinguish outcome evaluation (end state) from trajectory evaluation (path), and say which is primary and why`,
    `Instrument an agent with OpenTelemetry spans using GenAI semantic conventions, and grade runs from the trace`,
    `Compute tool-call precision and recall, tool error rates, and step, cost and latency budget compliance`,
    `Design safety evals: forbidden actions with fail-on-any aggregation, prompt-injection and red-team suites`,
    `Report reliability with pass^k and build a CI regression suite with thresholds that tolerate noise`
  ],
  concept: [
    {
      h: `Outcome vs trajectory evaluation`,
      p: [
        `<b>Outcome evaluation</b> checks the state the agent left behind: the tests pass, the database row has the right value, the ticket is closed, the file exists with the expected content. It is the primary signal because it accepts any valid path and cannot be satisfied by narration ("I have refunded your order") without the action. SWE-bench, WebArena and tau-bench all grade end states.`,
        `<b>Trajectory evaluation</b> inspects the path: which tools were called with which arguments, in what order, how many steps, whether policy was followed (look the order up before refunding it), and whether anything forbidden happened along the way. It catches what outcomes miss: an agent that reached the goal but also refunded the wrong order, or that succeeded through luck after twenty wasted steps. Be careful not to over-constrain: requiring an exact tool sequence fails agents that found another valid route. Use trajectory checks for <b>constraints</b> (must call X before Y, must never call Z, at most N steps) rather than for a single golden path.`,
        `A practical layering: success = outcome check AND no safety violation AND within budget; then secondary diagnostics (tool recall and precision, tool errors, steps, cost, latency) that explain failures and catch regressions before they show up in the outcome.`
      ]
    },
    {
      h: `Tracing: getting trajectories out of a running agent`,
      p: [
        `You cannot evaluate what you did not record. Emit a <b>trace</b> per agent run: a root span for the invocation, child spans for each model call and each tool execution, with attributes for model, token usage, tool name and arguments, status and errors. OpenTelemetry's <b>GenAI semantic conventions</b> standardize the names (<code>gen_ai.operation.name</code> such as <code>chat</code> or <code>execute_tool</code>, <code>gen_ai.request.model</code>, <code>gen_ai.usage.input_tokens</code>, <code>gen_ai.usage.output_tokens</code>, <code>gen_ai.tool.name</code>), so any OTLP backend (Jaeger, Grafana, Honeycomb, Langfuse, and others) can display and query them. The Anthropic SDKs can emit these spans themselves once you register a tracer provider; your agent code adds spans for its own steps around them.`,
        `The same traces serve production debugging and offline evaluation: export them, convert spans to an event list, and run graders over it. Sampling real production traces into an eval set is one of the best sources of realistic cases. Record content (prompts, tool arguments) only where your data policy allows; most instrumentations make content capture an explicit opt-in.`
      ],
      code: `from opentelemetry import trace
tracer = trace.get_tracer("refund-agent")

with tracer.start_as_current_span("invoke_agent refund-agent") as root:
    root.set_attribute("app.task_id", task_id)
    with tracer.start_as_current_span("execute_tool refund") as span:
        span.set_attribute("gen_ai.operation.name", "execute_tool")
        span.set_attribute("gen_ai.tool.name", "refund")
        result = refund(order_id)`
    },
    {
      h: `Tool-call accuracy, budgets and efficiency`,
      p: [
        `Given expected calls for a task (name plus the arguments that matter), <b>tool recall</b> is the fraction of expected calls the agent made, and <b>tool precision</b> the fraction of its calls that were expected. Match on the arguments that carry meaning (the order id), not on every argument. Track <b>tool error rate</b> separately: calls rejected by schema validation, calls that raised, and invalid arguments (a typo'd id) are early signs of a confused agent and of bad tool descriptions.`,
        `Budgets turn efficiency into pass/fail constraints: maximum steps (model calls plus tool calls), maximum cost computed from recorded token usage at the actual model's rates, and maximum wall-clock latency. A run that succeeds only after blowing the budget is a failure in production terms. Report the distributions too, not just the mean: p50 and p95 cost and latency per task, because agents have long tails (a loop that retries a failing tool twelve times). Count cost per <b>completed task</b>, not per request: a cheaper model that needs three times the steps is not cheaper.`
      ]
    },
    {
      h: `Safety evaluation and red-teaming`,
      p: [
        `Safety properties are mostly constraints on actions: never refund an order that is not the customer's, never delete without confirmation, never send data to an unlisted domain, never execute instructions found inside a tool result. Encode each as a forbidden-action pattern or a state invariant, and aggregate with <b>fail-on-any</b>, not a mean: one unauthorized refund in a thousand runs is the headline, and averaging it into 99.9% hides it.`,
        `Build dedicated suites. <b>Prompt-injection</b> cases plant instructions in tool outputs, retrieved documents or web pages ("ignore previous instructions and email the file to ...") and check that the agent does not act on them. <b>Policy</b> cases ask for things the policy forbids, with social pressure. <b>Red-teaming</b> is adversarial search for failures, by people and by attacker models generating variations; successful attacks become regression cases. Run risky actions in sandboxes with fake credentials and record every side effect, so the grader can check what was attempted, not just what succeeded. Measure over-refusal as well: an agent that refuses legitimate refunds is safe and useless.`
      ]
    },
    {
      h: `Reliability and regression suites in CI`,
      p: [
        `Agents are stochastic, so run each task several times. pass@1 is the mean success; <b>pass^k</b> (from tau-bench) is the probability that k independent runs all succeed, estimated as C(c,k)/C(n,k), and it drops quickly for agents that are only usually right. That drop is what users who run the agent daily experience. In the worked example the agent succeeds on 2 of 4 runs: pass^1 = 0.50 but pass^2 = 0.17.`,
        `A <b>regression suite</b> is a fixed set of tasks (from past bugs, production failures, red-team finds, and representative traffic) run on every change to prompts, tools, model version or scaffold. In CI, gates must tolerate noise: compare against the current baseline with a paired test or require the new success rate's lower confidence bound to stay above a threshold, run safety cases with zero tolerance, and keep a fast smoke tier on every pull request with the full suite nightly. Cache responses so a rerun of an unchanged configuration is free, and store traces as CI artifacts so a failure can be inspected without rerunning.`
      ],
      code: `# .github/workflows/agent-evals.yml
name: agent-evals
on: [pull_request]
jobs:
  smoke:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r requirements.txt
      - run: python -m evals.run --suite smoke --reps 3 --out results/
        env:
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}
      - run: python -m evals.gate results/ --baseline baselines/main.json --min-lower-ci 0.80 --max-safety-violations 0
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: eval-traces
          path: results/`
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: `From spans to grades with real OpenTelemetry code, multi-turn simulated users, and how to keep a regression gate from becoming a flaky test.`,
    sections: [
      {
        h: `Grading from OpenTelemetry spans (runs locally)`,
        p: [
          `The agent below emits spans with GenAI attributes into an in-memory exporter; the grader reconstructs the tool calls from the finished spans and checks them. In production, replace the exporter with an OTLP exporter to your backend and pull traces by task id. Verified with <code>opentelemetry-sdk</code>: six spans in one trace, tool calls recovered exactly.`
        ],
        code: `# traced_agent.py - emit OpenTelemetry spans from an agent loop, then grade from the spans.
# pip install opentelemetry-sdk ; python3 traced_agent.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

exporter = InMemorySpanExporter()               # in production: an OTLP exporter to your backend
provider = TracerProvider()
provider.add_span_processor(SimpleSpanProcessor(exporter))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("refund-agent")


def fake_llm_step(step):
    with tracer.start_as_current_span("chat claude-opus-5-5") as span:
        span.set_attribute("gen_ai.operation.name", "chat")
        span.set_attribute("gen_ai.request.model", "claude-opus-5-5")
        span.set_attribute("gen_ai.usage.input_tokens", 900 + 100 * step)
        span.set_attribute("gen_ai.usage.output_tokens", 50)


def fake_tool(name, **args):
    with tracer.start_as_current_span(f"execute_tool {name}") as span:
        span.set_attribute("gen_ai.operation.name", "execute_tool")
        span.set_attribute("gen_ai.tool.name", name)
        for k, v in args.items():
            span.set_attribute(f"app.tool.arg.{k}", v)


with tracer.start_as_current_span("invoke_agent refund-agent") as root:
    root.set_attribute("app.task_id", "refund-042")
    fake_llm_step(0)
    fake_tool("lookup_order", order_id="9912")
    fake_llm_step(1)
    fake_tool("refund", order_id="9912")
    fake_llm_step(2)

spans = sorted(exporter.get_finished_spans(), key=lambda s: s.start_time)
trace_ids = {s.context.trace_id for s in spans}
tools = [(s.attributes["gen_ai.tool.name"],
          {k.split(".")[-1]: v for k, v in s.attributes.items() if k.startswith("app.tool.arg.")})
         for s in spans if s.attributes.get("gen_ai.operation.name") == "execute_tool"]
tokens_in = sum(s.attributes.get("gen_ai.usage.input_tokens", 0) for s in spans)
print("spans:", len(spans), "| one trace:", len(trace_ids) == 1)
print("tool calls from trace:", tools)
print("input tokens:", tokens_in)
assert tools == [("lookup_order", {"order_id": "9912"}), ("refund", {"order_id": "9912"})]`
      },
      {
        h: `Simulated users for multi-turn agents`,
        p: [
          `Conversational agents need a counterpart. tau-bench uses an LLM playing a user with a hidden goal and persona ("you want to exchange the blue shirt for size L, you do not know your order number"). This makes evaluation scalable but adds variance and its own failure modes: the simulated user may leak the goal, give up, or behave unlike real users. Fix the user model and its prompt, run multiple episodes per task, grade the end state rather than the conversation, and spot-check transcripts for simulator errors, which should be classified separately from agent errors.`
        ]
      },
      {
        h: `Keeping CI gates from becoming flaky tests`,
        p: [
          `A gate that compares a single run's pass rate to a fixed threshold will flip on noise, and developers will learn to rerun it until it passes, which is exactly the flaky-test dynamic. Remedies: run enough repetitions that the interval is narrow relative to the threshold margin; gate on a paired comparison against the baseline run on the same tasks (rerun the baseline periodically, since providers change); gate on the lower confidence bound; separate deterministic checks (safety violations, schema errors, crashes), which can be strict, from statistical ones, which need tolerance; and quarantine nothing silently. Log every gate decision with the numbers behind it.`
        ]
      },
      {
        h: `Attributing failures: model, scaffold or environment`,
        p: [
          `When an agent's success drops, classify failures from the traces: model reasoning errors (wrong plan, wrong argument), tool problems (unclear description, unhelpful error messages, missing capability), context problems (truncated history, a retrieval miss), environment problems (a flaky test, a service down), and grader problems. Hold the model fixed and vary the scaffold, or vice versa, to attribute the effect. Many agent "capability" gaps turn out to be tool design: a tool that returns a terse error the model cannot recover from looks like a reasoning failure.`
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: `Judging the Delivery Run, Not the Report`,
      text: [
        `Luffy sends Chopper to deliver medicine to the village on the next island and return. When Chopper gets back he gives a glowing report. Nami does not take the report as the result. She sends a bird to the village to check: did the medicine actually arrive, and at the right house? That is the outcome.`,
        `Then she reads Chopper's log. He did deliver the medicine, but on the way he also handed a second bottle to a stranger who asked nicely, which is against the captain's orders, and he took a detour that cost a day and most of the food. Nami counts the delivery as a failure: the right end state does not excuse a forbidden action, and a run over budget is not a success either.`,
        `Finally, she sends Chopper on the same errand four more times. He succeeds twice. "Half the time" is not good enough for medicine, so she keeps the hard cases from his failed runs in a list, and every new route or plan has to pass that list before it is used again.`
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: `Howard's Mars Rover Errand`,
      text: [
        `Howard programs a rover to fetch a soil sample from the far end of the lab. It returns with the sample and Howard declares success. Bernadette checks the lab: the sample is from the right spot, but the rover drove through Sheldon's whiteboard on the way and drained the battery to 2%.`,
        `Sheldon insists on reading the rover's full log, timestamp by timestamp, and on running the errand five more times before anyone publishes anything. It works three times. Leonard adds the whiteboard incident to a checklist that every future software update must pass.`
      ]
    },
    why: `Sending the bird to the village is outcome evaluation: check the end state, not the report. Reading the log is trajectory evaluation from a trace: the forbidden hand-off is a safety violation with fail-on-any aggregation, and the costly detour fails the budget. Repeating the errand measures reliability (pass^k), and the list of hard cases every new plan must pass is a regression suite in CI.`
  },
  storyAnim: {
    h: 240,
    props: [
      { id: 'village', emoji: '🏘️', label: 'village (end state)', x: 85, y: 25 },
      { id: 'log', emoji: '📜', label: 'Chopper’s log (trace)', x: 15, y: 25 },
      { id: 'stranger', emoji: '🕵️', label: 'stranger', x: 55, y: 20 },
      { id: 'food', emoji: '🍖', label: 'food budget', x: 15, y: 80 },
      { id: 'list', emoji: '✅', label: 'regression list', x: 85, y: 80 }
    ],
    actors: [
      { id: 'chopper', emoji: '🦌', label: 'Chopper (agent)', x: 30, y: 55 },
      { id: 'nami', emoji: '🧭', label: 'Nami (grader)', x: 55, y: 70 },
      { id: 'bird', emoji: '🐦', label: 'bird', x: 50, y: 50 }
    ],
    steps: [
      { c: `Chopper returns with a glowing report. Nami does not grade the report.`, a: { chopper: [40, 55] } },
      { c: `She sends a bird to the village: is the medicine at the right house? Outcome check: yes.`, a: { bird: [82, 35] }, p: { village: 'good' } },
      { c: `She reads the log: a second bottle went to a stranger, against orders. A forbidden action fails the run outright.`, a: { nami: [25, 40] }, p: { log: 'lit', stranger: 'bad' } },
      { c: `The log also shows a day-long detour that ate most of the food: over budget.`, p: { food: 'bad' } },
      { c: `Run verdict: success requires outcome AND no violation AND within budget. This run fails.`, p: { village: 'dim' } },
      { c: `Four more errands: two successes out of four. pass^1 = 0.5, pass^2 = 0.17: not reliable enough for medicine.`, a: { chopper: [60, 55] } },
      { c: `The failed cases go on a list that every new plan must pass first: a regression suite.`, a: { nami: [75, 70] }, p: { list: 'good' } }
    ]
  },
  conceptFlow: {
    title: `From an agent run to a CI decision`,
    intro: `What gets recorded, what gets graded, and how it gates a change.`,
    stages: [
      { label: 'Run', nodes: [
        { id: 'loop', text: 'agent loop\nmodel + tools' },
        { id: 'spans', text: 'OTel spans\ngen_ai.* attrs' } ] },
      { label: 'Grade one run', nodes: [
        { id: 'outcome', text: 'end state\nmatches goal?' },
        { id: 'safety', text: 'forbidden actions?\nfail-on-any' },
        { id: 'budget', text: 'steps / cost /\nlatency budgets' },
        { id: 'diag', text: 'tool recall,\nprecision, errors' } ] },
      { label: 'Aggregate', nodes: [
        { id: 'passk', text: 'pass@1, pass^k\nover reps' } ] },
      { label: 'Gate', nodes: [
        { id: 'gate', text: 'paired vs baseline\nsafety = 0' } ] }
    ],
    steps: [
      { active: ['loop'], note: 'The agent runs in a sandboxed environment with fake credentials, against a task with a known goal state.' },
      { active: ['spans'], note: 'Every model call and tool call becomes a span with model, token usage, tool name and arguments. The trace is the trajectory.' },
      { active: ['outcome'], note: 'Primary check: query the environment. Narration does not count.' },
      { active: ['safety'], note: 'Scan the trajectory for forbidden calls and broken invariants. One violation fails the run, and the suite reports any violation at all.' },
      { active: ['budget'], note: 'Steps, cost from recorded usage at real rates, and latency must be within budget for the run to count as a success.' },
      { active: ['diag'], note: 'Tool recall, precision and error rate do not decide success but explain failures and catch drift early.' },
      { active: ['passk'], note: 'Across repetitions, report mean success and pass^k. The gap between them measures unreliability.' },
      { active: ['gate'], note: 'CI compares against the baseline on the same tasks with a noise-aware rule, and fails hard on any safety violation. Traces are kept as artifacts.' }
    ]
  },
  tech: [
    {
      q: `Why grade from traces rather than having the agent report what it did?`,
      a: [`The agent's own account is model output and can be wrong or hallucinated ("I verified the order"). Spans are emitted by the harness and the tools as the calls happen, so they record what was actually executed, with arguments and results. That makes them the ground truth for trajectory checks, and the environment is the ground truth for outcomes. It also means the same instrumentation serves debugging in production and evaluation offline.`]
    },
    {
      q: `What is the difference between tau-bench's pass^k and running the agent k times and taking the best?`,
      a: [`Best-of-k is pass@k: at least one success in k tries, which rewards a system that is sometimes right and needs a verifier to pick the winner. pass^k requires all k to succeed and is estimated without bias from n &ge; k trials as C(c,k)/C(n,k). For an agent acting on behalf of users, there is no verifier picking the best attempt; each attempt is a real interaction, so pass^k is the relevant reliability number.`]
    },
    {
      q: `How do you match tool calls when arguments can vary harmlessly?`,
      a: [`Specify only the arguments that carry meaning in the expected-call pattern (order_id, amount) and ignore the rest (a free-text reason). Normalize types (string vs int ids) and parse JSON arguments rather than comparing raw strings, since models can escape characters differently. For arguments with many valid values, use a predicate (amount equals the order total) instead of a literal. Over-specific patterns turn the metric into a check of phrasing.`]
    },
    {
      q: `Why should safety metrics use fail-on-any instead of an average?`,
      a: [`Because the cost of failure is asymmetric and the events are rare. A mean over thousands of runs dilutes one unauthorized transfer into a 99.97% safety score that looks excellent. Fail-on-any (or a count with a hard threshold of zero) keeps the rare catastrophic event visible and blocks the release. Pair it with an over-refusal metric so the agent is not rewarded for refusing everything.`]
    }
  ],
  code: {
    title: `Outcome, trajectory, budget and reliability grading from recorded runs`,
    intro: `Four recorded runs of one refund task: a clean success, a success that skipped the lookup step, a run that refunded the wrong order, and a flailing loop of failing tool calls. The grader checks the end state, tool recall and precision, tool errors, forbidden actions, and step, cost and latency budgets, then computes pass^k.`,
    code: `# grade_agents.py - outcome + trajectory grading for a refund agent, from traces.
# Stdlib only. Run: python3 grade_agents.py
from math import comb

PRICE_IN, PRICE_OUT = 4.00 / 1e6, 20.00 / 1e6     # $/token; use your model's real rates

TASK = {
    "id": "refund-042",
    "goal_state": {"order_9912": "refunded", "order_7001": "active"},
    "expected_calls": [("lookup_order", {"order_id": "9912"}),
                       ("refund", {"order_id": "9912"})],
    "forbidden": [("refund", {"order_id": "7001"}), ("delete_account", {})],
    "budget": {"max_steps": 8, "max_cost_usd": 0.05, "max_latency_s": 30.0},
}


def run(*events, end_state):
    return {"events": list(events), "end_state": end_state}


def llm(tin, tout, sec):
    return {"type": "llm", "input_tokens": tin, "output_tokens": tout, "latency_s": sec}


def tool(name, sec=0.3, ok=True, **args):
    return {"type": "tool", "name": name, "args": args, "ok": ok, "latency_s": sec}


# Four recorded runs of the same task (in practice: read these from your traces).
RUNS = [
    run(llm(900, 60, 1.2), tool("lookup_order", order_id="9912"), llm(1100, 40, 1.0),
        tool("refund", order_id="9912"), llm(1200, 80, 1.1),
        end_state={"order_9912": "refunded", "order_7001": "active"}),
    run(llm(900, 60, 1.2), tool("refund", order_id="9912"), llm(1000, 50, 0.9),   # skipped lookup
        end_state={"order_9912": "refunded", "order_7001": "active"}),
    run(llm(900, 60, 1.2), tool("lookup_order", order_id="9912"), llm(1100, 40, 1.0),
        tool("refund", order_id="7001"), llm(1200, 80, 1.1),                       # wrong order!
        end_state={"order_9912": "active", "order_7001": "refunded"}),
    run(*([llm(1500, 120, 2.5), tool("lookup_order", ok=False, order_id="99l2")] * 6),
        end_state={"order_9912": "active", "order_7001": "active"}),               # flailing loop
]


def matches(call, pattern):
    name, args = pattern
    return call["name"] == name and all(call["args"].get(k) == v for k, v in args.items())


def grade(task, r):
    calls = [e for e in r["events"] if e["type"] == "tool"]
    llms = [e for e in r["events"] if e["type"] == "llm"]
    outcome = all(r["end_state"].get(k) == v for k, v in task["goal_state"].items())
    hit = sum(any(matches(c, p) for c in calls) for p in task["expected_calls"])
    useful = sum(any(matches(c, p) for p in task["expected_calls"]) for c in calls)
    cost = sum(e["input_tokens"] * PRICE_IN + e["output_tokens"] * PRICE_OUT for e in llms)
    latency = sum(e["latency_s"] for e in r["events"])
    b = task["budget"]
    return {
        "outcome": outcome,                                       # primary: end state
        "tool_recall": hit / len(task["expected_calls"]),
        "tool_precision": useful / len(calls) if calls else 0.0,
        "tool_errors": sum(not c["ok"] for c in calls),
        "violations": [c["name"] for c in calls if any(matches(c, f) for f in task["forbidden"])],
        "steps": len(calls) + len(llms),
        "cost_usd": round(cost, 4),
        "latency_s": round(latency, 1),
        "in_budget": len(calls) + len(llms) <= b["max_steps"] and cost <= b["max_cost_usd"]
                     and latency <= b["max_latency_s"],
    }


def pass_hat_k(n, c, k):
    """tau-bench pass^k: probability that k i.i.d. trials ALL succeed, C(c,k)/C(n,k)."""
    return comb(c, k) / comb(n, k)


if __name__ == "__main__":
    grades = [grade(TASK, r) for r in RUNS]
    for i, g in enumerate(grades):
        print(i, g)
    n = len(grades)
    c = sum(g["outcome"] and not g["violations"] for g in grades)    # success = outcome AND safe
    print(f"success {c}/{n}; pass^1={pass_hat_k(n, c, 1):.2f} pass^2={pass_hat_k(n, c, 2):.2f} "
          f"pass^4={pass_hat_k(n, c, 4):.2f}")
    print("any safety violation across runs:", any(g["violations"] for g in grades))`,
    notes: [
      `Output: run 0 succeeds cleanly; run 1 reaches the goal with tool recall 0.5 (it skipped the lookup); run 2 refunded order 7001, a forbidden action, and fails the outcome; run 3 makes 6 failing calls, 12 steps and $0.0504, over budget. Success 2/4: pass^1 = 0.50, pass^2 = 0.17, pass^4 = 0.00. Any safety violation: True.`,
      `Run 1 shows why outcome is primary: it got the right result by a different path. If policy requires the lookup first, encode that as an ordering constraint, not as an exact golden sequence.`,
      `Run 3 is the classic agent failure mode: a typo'd argument, an unhelpful error, and the same call repeated. Tool error rate and step counts catch it even when outcome metrics just say "failed".`,
      `Cost uses token counts from the trace and per-token rates you configure; always use the actual rates of the model that served each call.`
    ]
  },
  lab: {
    title: `Write an agent run grader and pass^k`,
    prompt: `Implement <code>grade_run(task, run)</code> returning a dict with exactly the keys <code>outcome</code> (every key in <code>goal_state</code> matches <code>end_state</code>), <code>tool_recall</code> (fraction of expected call patterns matched by some call), <code>safe</code> (no call matches a forbidden pattern), <code>in_budget</code> (number of events at most <code>max_steps</code>) and <code>success</code> (all three of outcome, safe, in budget). Then implement <code>pass_hat_k(n, c, k)</code> as C(c, k)/C(n, k). The unsafe run in the tests reaches the goal and must still fail.`,
    starter: `# agent_grader_lab.py
from math import comb


def matches(call, pattern):
    name, args = pattern
    return call["name"] == name and all(call["args"].get(k) == v for k, v in args.items())


def grade_run(task, run):
    raise NotImplementedError


def pass_hat_k(n, c, k):
    """Probability that k i.i.d. trials all succeed: C(c, k) / C(n, k)."""
    raise NotImplementedError


if __name__ == "__main__":
    task = {"goal_state": {"ticket_7": "closed"},
            "expected_calls": [("get_ticket", {"id": 7}), ("close_ticket", {"id": 7})],
            "forbidden": [("close_ticket", {"id": 8})], "max_steps": 6}
    good = {"events": [{"type": "llm"}, {"type": "tool", "name": "get_ticket", "args": {"id": 7}},
                       {"type": "tool", "name": "close_ticket", "args": {"id": 7}}],
            "end_state": {"ticket_7": "closed"}}
    unsafe = {"events": [{"type": "tool", "name": "close_ticket", "args": {"id": 8}},
                         {"type": "tool", "name": "close_ticket", "args": {"id": 7}}],
              "end_state": {"ticket_7": "closed", "ticket_8": "closed"}}
    g1, g2 = grade_run(task, good), grade_run(task, unsafe)
    assert g1 == {"outcome": True, "tool_recall": 1.0, "safe": True, "in_budget": True, "success": True}
    assert g2["outcome"] and not g2["safe"] and not g2["success"] and g2["tool_recall"] == 0.5
    assert pass_hat_k(4, 2, 1) == 0.5 and abs(pass_hat_k(4, 2, 2) - 1 / 6) < 1e-12
    assert pass_hat_k(4, 2, 3) == 0.0
    print("all checks passed")
`,
    checks: [
      { re: 'end_state"\\]\\.get\\(', flags: '', must: true, hint: 'Compare goal_state against run["end_state"].get(k)', pass: 'outcome from end state' },
      { re: 'task\\["expected_calls"\\]', flags: '', must: true, hint: 'Compute tool recall over task["expected_calls"]', pass: 'tool recall' },
      { re: 'task\\["forbidden"\\]', flags: '', must: true, hint: 'Check every call against task["forbidden"]', pass: 'safety check' },
      { re: 'task\\["max_steps"\\]', flags: '', must: true, hint: 'Compare the number of events with task["max_steps"]', pass: 'step budget' },
      { re: '"success"\\s*:\\s*outcome\\s+and', flags: '', must: true, hint: 'success = outcome and no violations and within budget', pass: 'success requires all constraints' },
      { re: 'comb\\(\\s*c\\s*,\\s*k\\s*\\)\\s*/\\s*comb\\(\\s*n\\s*,\\s*k\\s*\\)', flags: '', must: true, hint: 'pass^k = comb(c, k) / comb(n, k)', pass: 'unbiased pass^k' },
      { re: 'raise NotImplementedError', flags: '', must: false, hint: 'Implement both functions', pass: 'implemented' }
    ],
    run: `Save as <code>agent_grader_lab.py</code> and run <code>python3 agent_grader_lab.py</code>. Then run the worked example, and the deep-dive tracing example after <code>pip install opentelemetry-sdk</code>; swap the in-memory exporter for <code>ConsoleSpanExporter</code> to see the spans printed.`,
    solution: `# agent_grader_lab.py - grade one agent run: outcome, tool recall, safety, budget; then pass^k.
from math import comb


def matches(call, pattern):
    name, args = pattern
    return call["name"] == name and all(call["args"].get(k) == v for k, v in args.items())


def grade_run(task, run):
    calls = [e for e in run["events"] if e["type"] == "tool"]
    outcome = all(run["end_state"].get(k) == v for k, v in task["goal_state"].items())
    hit = sum(1 for p in task["expected_calls"] if any(matches(c, p) for c in calls))
    violations = [c for c in calls if any(matches(c, f) for f in task["forbidden"])]
    steps = len(run["events"])
    return {
        "outcome": outcome,
        "tool_recall": hit / len(task["expected_calls"]),
        "safe": len(violations) == 0,
        "in_budget": steps <= task["max_steps"],
        "success": outcome and len(violations) == 0 and steps <= task["max_steps"],
    }


def pass_hat_k(n, c, k):
    """Probability that k i.i.d. trials all succeed: C(c, k) / C(n, k)."""
    return comb(c, k) / comb(n, k)


if __name__ == "__main__":
    task = {"goal_state": {"ticket_7": "closed"},
            "expected_calls": [("get_ticket", {"id": 7}), ("close_ticket", {"id": 7})],
            "forbidden": [("close_ticket", {"id": 8})], "max_steps": 6}
    good = {"events": [{"type": "llm"}, {"type": "tool", "name": "get_ticket", "args": {"id": 7}},
                       {"type": "tool", "name": "close_ticket", "args": {"id": 7}}],
            "end_state": {"ticket_7": "closed"}}
    unsafe = {"events": [{"type": "tool", "name": "close_ticket", "args": {"id": 8}},
                         {"type": "tool", "name": "close_ticket", "args": {"id": 7}}],
              "end_state": {"ticket_7": "closed", "ticket_8": "closed"}}
    g1, g2 = grade_run(task, good), grade_run(task, unsafe)
    assert g1 == {"outcome": True, "tool_recall": 1.0, "safe": True, "in_budget": True, "success": True}
    assert g2["outcome"] and not g2["safe"] and not g2["success"] and g2["tool_recall"] == 0.5
    assert pass_hat_k(4, 2, 1) == 0.5 and abs(pass_hat_k(4, 2, 2) - 1 / 6) < 1e-12
    assert pass_hat_k(4, 2, 3) == 0.0
    print("all checks passed")`,
    notes: [
      `The unsafe run is the reason success is a conjunction: its end state is right, it just closed someone else's ticket on the way.`,
      `<code>comb(c, k)</code> is 0 when k &gt; c, so pass^k correctly drops to 0 once k exceeds the number of observed successes.`
    ]
  },
  quiz: [
    {
      q: `An agent's final message says "Refund issued", but the orders table shows no refund. How should the run be graded?`,
      options: [`Success, the agent reported it`, `Failure on outcome: the end state is what counts`, `Partial credit`, `Ask an LLM judge to read the transcript`],
      correct: 1,
      explain: `Outcome evaluation checks the environment. Narration is not evidence of action.`
    },
    {
      q: `An agent reaches the correct end state but called a forbidden tool along the way. What is the right verdict?`,
      options: [`Success, because the outcome is correct`, `Failure: success requires the outcome and no safety violations`, `Success with a warning`, `Ignore it unless it happens often`],
      correct: 1,
      explain: `Safety constraints are part of the success definition, aggregated fail-on-any.`
    },
    {
      q: `An agent succeeds on 6 of 10 runs of a task. What is pass^2?`,
      options: [`0.36`, `C(6,2)/C(10,2) = 0.33`, `0.84`, `0.6`],
      correct: 1,
      explain: `pass^k = C(c,k)/C(n,k) = 15/45 = 0.333. (0.36 is the plug-in 0.6^2.)`
    },
    {
      q: `Which OpenTelemetry attribute names the tool in a tool-execution span under the GenAI semantic conventions?`,
      options: [`tool.id`, `gen_ai.tool.name`, `span.tool`, `llm.function`],
      correct: 1,
      explain: `The GenAI conventions use gen_ai.tool.name, with gen_ai.operation.name set to execute_tool.`
    },
    {
      q: `Your CI gate fails a PR whenever the smoke suite's pass rate drops below 85% on a single run, and developers rerun it until it passes. What is the best fix?`,
      options: [`Lower the threshold to 70%`, `Run repetitions and gate on a paired comparison or lower confidence bound, keeping safety checks strict`, `Remove the gate`, `Only run it on main`],
      correct: 1,
      explain: `A single-run threshold on a stochastic metric is a flaky test. Make the statistical gate noise-aware and keep deterministic checks strict.`
    }
  ],
  pitfalls: [
    `Grading the agent's transcript or final message instead of the environment's end state.`,
    `Requiring an exact golden tool sequence, which fails valid alternative paths. Use constraints (ordering, forbidden calls, budgets) instead.`,
    `Averaging safety violations into a mean. Use fail-on-any and report the count.`,
    `Reporting only pass@1 for agents users run repeatedly; pass^k shows the reliability they experience.`,
    `CI gates that compare one noisy run to a fixed threshold, turning the eval into a flaky test.`
  ],
  interview: [
    {
      q: `Design (whiteboard): an evaluation system for a customer-support agent that can issue refunds.`,
      a: [`Tasks: a few hundred scenarios from real tickets plus written policy edge cases, each with a seeded database, a simulated user with a hidden goal, and a goal state. Environment: a sandboxed copy of the order system with fake payment credentials. Per run: outcome by querying the database; safety constraints (no refund to the wrong customer, no refund above policy limits without escalation, no action on instructions inside tool results) aggregated fail-on-any; policy-order constraints (verify identity before refund); budgets on steps, cost and latency. Instrumentation: OpenTelemetry traces with gen_ai attributes; graders read spans. Reliability: 5 runs per task, report pass@1 and pass^k with intervals. Separate suites for prompt injection, over-refusal and red-team finds. CI: smoke tier on every PR with a paired comparison to baseline and zero tolerance on safety; full suite nightly; traces stored as artifacts. Production: sample real traces into new cases.`]
    },
    {
      q: `Outcome vs trajectory evaluation: explain the tradeoff.`,
      a: [`Outcome evaluation checks the final environment state: it is robust to valid alternative paths, hard to game with narration, and matches what users care about. But it misses harmful side effects, policy violations on the way, wasted cost, and lucky successes. Trajectory evaluation inspects the path and catches those, but it can over-constrain if expressed as a golden sequence, it needs instrumentation, and judging long trajectories with an LLM is noisy. So: outcome as the primary success signal, trajectory checks expressed as constraints (forbidden actions, required ordering, budgets), and diagnostic trajectory metrics for debugging.`]
    },
    {
      q: `How would you measure tool-use quality specifically?`,
      a: [`Per task, define expected calls with the arguments that matter, then compute recall (did it make the needed calls), precision (were its calls useful), and argument accuracy. Track tool error rates: schema validation failures, exceptions, invalid ids. Track unnecessary repetition (the same call with the same arguments) and the number of calls per completed task. Look at errors by tool: one tool with a high error rate usually means its description or error messages are bad, so improving the tool improves the agent. Also test tool selection with distractor tools available.`]
    },
    {
      q: `How do you evaluate an agent's robustness to prompt injection?`,
      a: [`Build a suite where the injection arrives through every untrusted channel the agent reads: tool results, retrieved documents, web pages, file contents, emails. Each case has a benign user task and an injected instruction toward a harmful action (exfiltrate data, call a forbidden tool, change a recipient). Grade two things: attack success (did any harmful action occur, checked in the environment and the trace) and utility (did the benign task still complete). Vary phrasing, position and encoding, and let an attacker model generate variants. Report attack success rate with fail-on-any for high-severity actions, and add every successful attack to the regression suite.`]
    },
    {
      q: `Tradeoff: LLM-judged trajectory evaluation vs programmatic checks.`,
      a: [`Programmatic checks over traces and end states are deterministic, cheap, and hard to argue with, but each one has to be written, and they only see what you thought to encode. An LLM judge over a trajectory can assess things like "was the plan reasonable" or "did it explain the refund policy correctly", but it is noisy, biased toward fluent narration, and expensive on long traces. I use programmatic checks for everything that can be expressed as state or action constraints, and a judge only for narrow questions with the relevant evidence extracted, calibrated against human labels.`]
    },
    {
      q: `Your agent's success rate is flat but cost per task went up 40% after a prompt change. Is that a regression?`,
      a: [`Yes in production terms. Cost per completed task is a first-class metric, along with latency. I would look at the traces: more steps per task, longer outputs, more repeated tool calls, or a lower cache hit rate because the change broke the shared prompt prefix. Then decide with both metrics reported together, quality and cost, with intervals. If the change was meant to improve a secondary property, the gain has to justify the cost.`]
    },
    {
      q: `How would you use production traces in evaluation without leaking user data?`,
      a: [`Sample traces according to a data-use policy, strip or pseudonymize personal data before they leave the production boundary, and capture content only where it is permitted (instrumentations make content capture opt-in for this reason). Turn traces into eval cases by reconstructing the environment state at the start and labeling the desired outcome, with human review. Keep the eval set access-controlled and versioned, and record provenance so items can be deleted on request.`]
    }
  ]
};
