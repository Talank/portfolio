/* Master ordered list of lessons. Drives the dashboard, prev/next links and the
   interview drill pool. type: 'lesson' loads data/lessons/<id>.js. */
window.SCHEDULE = [
  // ── Part 0 — LLM Building Blocks
  { id: "llm-api-fundamentals", title: "LLM APIs: Messages, Tokens, Sampling, Context Windows & Cost", category: "Part 0 \u2014 LLM Building Blocks", timeMin: 35, type: 'lesson' },
  { id: "prompting-structured-output", title: "Prompt Engineering & Structured Output: Schemas, Few-Shot & Validation", category: "Part 0 \u2014 LLM Building Blocks", timeMin: 40, type: 'lesson' },
  { id: "tool-use-agent-loop", title: "Tool Use: Writing the Agent Loop From Scratch", category: "Part 0 \u2014 LLM Building Blocks", timeMin: 45, type: 'lesson' },
  // ── Part 1 — Building Agents & Workflows
  { id: "agent-architectures", title: "Agent Architectures: ReAct, Plan-and-Execute, Reflection & Multi-Agent", category: "Part 1 \u2014 Building Agents & Workflows", timeMin: 45, type: 'lesson' },
  { id: "rag", title: "Retrieval-Augmented Generation: Embeddings, Chunking, Hybrid Search & Reranking", category: "Part 1 \u2014 Building Agents & Workflows", timeMin: 45, type: 'lesson' },
  { id: "workflow-orchestration", title: "Workflows & Orchestration: State Machines, LangGraph, DSPy, MCP & Retries", category: "Part 1 \u2014 Building Agents & Workflows", timeMin: 45, type: 'lesson' },
  { id: "coding-agents", title: "Coding Agents: SWE-agent, Agentless, Sandboxes & LLM Program Repair", category: "Part 1 \u2014 Building Agents & Workflows", timeMin: 50, type: 'lesson' },
  // ── Part 2 — Evaluation Fundamentals
  { id: "eval-fundamentals", title: "Evaluation Fundamentals: Test Sets, Metrics, pass@k & Golden Datasets", category: "Part 2 \u2014 Evaluation Fundamentals", timeMin: 45, type: 'lesson' },
  { id: "benchmark-landscape", title: "The Benchmark Landscape: HumanEval, MBPP, SWE-bench, GAIA, MMLU & Contamination", category: "Part 2 \u2014 Evaluation Fundamentals", timeMin: 40, type: 'lesson' },
  { id: "llm-as-judge", title: "LLM-as-a-Judge & Human Evaluation: Rubrics, Biases & Agreement", category: "Part 2 \u2014 Evaluation Fundamentals", timeMin: 40, type: 'lesson' },
  { id: "eval-statistics", title: "Statistics for Evals: Confidence Intervals, Bootstrap, Paired Tests & Flakiness", category: "Part 2 \u2014 Evaluation Fundamentals", timeMin: 50, type: 'lesson' },
  // ── Part 3 — Evaluation at Scale
  { id: "large-scale-eval-infra", title: "Running Evals at Scale: Parallelism, Rate Limits, Caching, Batch APIs & Sandboxes", category: "Part 3 \u2014 Evaluation at Scale", timeMin: 50, type: 'lesson' },
  { id: "evaluating-agents", title: "Evaluating Agents: Trajectories, Tracing, Cost/Latency, Safety & Regression Suites", category: "Part 3 \u2014 Evaluation at Scale", timeMin: 45, type: 'lesson' },
  { id: "capstone-agent-eval-harness", title: "Capstone: Build an Agent and Its Eval Harness & Interview Playbook", category: "Part 3 \u2014 Evaluation at Scale", timeMin: 60, type: 'lesson' },
];
window.CATEGORY_COLORS = {"Part 0 \u2014 LLM Building Blocks": "#4fd1c5", "Part 1 \u2014 Building Agents & Workflows": "#f6ad55", "Part 2 \u2014 Evaluation Fundamentals": "#9f7aea", "Part 3 \u2014 Evaluation at Scale": "#68d391"};
