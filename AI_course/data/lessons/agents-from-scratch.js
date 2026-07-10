window.LESSONS = window.LESSONS || {};
window.LESSONS['agents-from-scratch'] = {
  id: 'agents-from-scratch',
  title: 'Agents from Scratch: Tool Use, ReAct & LLM-Agnostic Design',
  category: 'Part 7 — RAG & Agents',
  timeMin: 60,
  summary: 'Every lesson so far has been "prompt in, one response out." An agent breaks that shape: the model can decide to call a TOOL — a calculator, a search function, a real API — observe what comes back, and use that observation to decide what to do next, looping until it has enough to answer. This lesson builds that loop from scratch, precisely enough that it works identically whether the model underneath is a hosted API, a Hugging Face model, or a local Ollama model — exactly the interface-first design the using-models-apis lesson set up.',
  goals: [
    'Explain precisely what makes something an "agent" rather than a single LLM call: the tool-use loop and observation feedback',
    'Describe the ReAct pattern (Thought → Action → Observation) and why interleaving reasoning with tool calls outperforms either alone',
    'Explain function/tool-calling mechanics: how tools are described to a model and how a structured call gets executed and fed back',
    'Identify concrete agent-loop failure modes (infinite loops, repeated actions, runaway cost) and the safeguards against each',
    'Design an agent loop against an LLM-agnostic interface so it works unchanged across hosted APIs, Hugging Face models, and Ollama'
  ],
  concept: [
    {
      h: 'From one forward pass to a loop',
      p: [
        'Every lesson up to this point used an LLM the same way: construct a prompt, get one response, done — even RAG (last lesson) is still fundamentally "one enriched prompt in, one response out," just with better-informed context. An <b>agent</b> changes the shape of the interaction entirely: instead of always producing a final answer, the model can produce a request to call a TOOL — a calculator, a search function, a database query, code execution, a real API call to an external system — the calling code EXECUTES that tool for real, and the tool\'s result is fed back to the model as new information, which the model then reasons about to decide its NEXT move: call another tool, or now produce a final answer.',
        'Why bother? Because LLMs are, by design, next-token predictors trained on text — genuinely bad at things outside that lane: precise arithmetic on large numbers, knowing anything that happened after their training cutoff, reliably executing multi-step deterministic procedures, or actually DOING something in the real world (sending an email, querying a live database, controlling a robot). A tool call is the model delegating exactly the sub-task it\'s unreliable at to a system that IS reliable at it — a calculator never makes an arithmetic mistake the way a language model occasionally does; a live search API knows about this morning\'s news; a database query returns the actual current row, not a plausible-sounding guess. Retrieval (last lesson) is, in this framing, simply ONE particular tool — "search my document store" — among a much broader family an agent can be given access to.'
      ]
    },
    {
      h: 'ReAct: interleaving reasoning with acting',
      p: [
        'The <b>ReAct</b> pattern (Yao et al. 2022, "Reasoning and Acting") structures the agent loop as a repeating cycle of three labeled steps, made explicit in the model\'s own output: <b>Thought</b> — the model reasons in natural language about what it currently knows and what it needs to find out next; <b>Action</b> — the model requests a specific tool call with specific arguments; <b>Observation</b> — the tool\'s actual result is inserted back into the transcript. This repeats until a Thought concludes the model has enough information, at which point it produces a Final Answer instead of another Action.',
        '<div class="math">loop: Thought → Action → Observation → Thought → Action → Observation → … → Final Answer<span class="mnote">reasoning and acting interleaved, not separated into two phases — each Thought is informed by the MOST RECENT real observation, not just the model\'s prior beliefs</span></div>',
        'Why interleave rather than do pure reasoning OR pure acting? Pure chain-of-thought reasoning (thinking through a whole plan with no real-world checks) is fluent but ungrounded — if an early reasoning step contains a subtly wrong assumption or an outdated fact, everything built on top of it inherits the error, and the model has no mechanism to catch this since it never checks anything against reality (this is a special case of the causal generation exposure-bias pattern from the seq2seq-attention lesson — an early mistake compounds through everything that follows). Pure acting without reasoning (jumping straight into tool calls with no explicit plan) tends to select poor or redundant tools, and gives the model no natural place to synthesize what MULTIPLE observations together imply before deciding the next step. ReAct\'s interleaving gives the model a chance to course-correct after EVERY observation — if a search result contradicts an assumption made two steps ago, the next Thought can revise the plan immediately, rather than the whole reasoning chain being locked in from the start. This mirrors, quite directly, how a person investigates something unfamiliar: think about what you need, go check it, update your thinking based on what you actually find, repeat.'
      ]
    },
    {
      h: 'Tool calling, mechanically',
      p: [
        'A tool is described to the model as a structured SCHEMA — a name, a natural-language description of what it does and when to use it, and a specification of its parameters (names, types, whether required). This schema is placed in the model\'s context (or, for models specifically fine-tuned for function-calling — the fine-tuning-lora lesson\'s SFT applied to exactly this output format — passed through a dedicated API field), and the model is prompted to emit a request to call ONE of the described tools with SPECIFIC argument values whenever it decides a tool is the right next step, INSTEAD of natural-language prose, at that point in its output.',
        'Concretely, this structured request is typically JSON: <code>{"tool": "calculator", "arguments": {"expression": "847 * 23"}}</code>. The calling code parses this, looks up the named tool, actually EXECUTES it (real code — this is the one point in the whole pipeline where something outside the model genuinely runs), and formats the tool\'s return value as an Observation appended to the ongoing transcript before the next model call. Models with NATIVE function-calling support (specifically fine-tuned to reliably produce well-formed structured tool requests) do this more reliably than prompting an ordinary model to "please output JSON when you want a tool" — but the fallback (careful prompting plus robust parsing of whatever text comes back) works with any model, including open models run locally via Ollama that may lack a dedicated function-calling API, which matters directly for the LLM-agnostic design this lesson closes on.'
      ]
    },
    {
      h: 'When agent loops go wrong',
      p: [
        'An agent loop is, structurally, code that keeps calling an LLM and executing whatever it asks for — and that combination has real, well-documented failure modes worth designing against explicitly, not discovering in production. <b>Infinite or excessive looping</b>: nothing inherently stops a model from deciding "I need one more piece of information" forever — a hard <code>max_steps</code> cap (and a designed fallback response — "I wasn\'t able to complete this within the allotted steps" — rather than silently looping forever) is close to mandatory in any real deployment. <b>Repeated identical actions</b>: a specific, common failure where the model calls the SAME tool with the SAME arguments multiple times in a row — often because an earlier observation didn\'t resolve its uncertainty and it doesn\'t have a better next move, so it re-asks the same question hoping for a different answer (which, for a deterministic tool, it will never get) — detectable by comparing each new action against recent history and breaking out (or forcing a different strategy) when a repeat is caught.',
        '<b>Cost and runaway tool use</b>: every loop iteration is (at minimum) another LLM call, and some tools themselves cost money or rate-limit (a paid search API, a rate-limited external service) — bounding max_steps is also a direct cost control, and production agents typically track and cap total cost per run, not just step count. <b>Goodhart-style objective gaming</b>: this is the rlhf-alignment lesson\'s reward-hacking concern, now embodied in ACTIONS rather than just text — an agent given a loosely specified goal and the ability to take real actions can find a technically-satisfying but genuinely unhelpful or harmful strategy nobody intended (an agent told to "get the ticket count to zero" that starts deleting tickets instead of resolving them is the canonical cautionary example) — which is exactly why scoping an agent\'s available tools tightly to what a task actually needs, and reviewing consequential actions (anything hard to undo — the "Executing actions with care" principle underlying this entire course\'s own tool-use discipline) rather than letting an agent act with unchecked autonomy, matters even more here than in ordinary software design.'
      ]
    },
    {
      h: 'Building the loop LLM-agnostic',
      p: [
        'The using-models-apis lesson\'s core principle — write application logic against a common <code>generate(prompt) -&gt; str</code> interface, with provider-specific details hidden in adapters — applies directly and importantly here: the AGENT LOOP itself (build the prompt with tool descriptions, call the model, parse its output for a tool request or a final answer, execute the tool, append the observation, repeat) should be written ONCE, against that same abstract interface, not hard-coded to one provider\'s specific function-calling API shape.',
        'This matters concretely for exactly the goal this course set out with: building agents that work with Ollama and open Hugging Face models, not just a single commercial API. Some models have dedicated, reliable native function-calling support; others (including many models comfortably run locally via Ollama) do not, and need the FALLBACK approach — describe tools in the prompt as plain text, instruct the model to respond in a specific parseable format ("Action: tool_name[arguments]"), and write a robust PARSER on the calling-code side that extracts the tool request from whatever text comes back, regardless of which underlying model produced it. Writing the loop\'s parsing and tool-execution logic to work against this lowest-common-denominator text format means the exact same agent code runs identically whether it\'s pointed at a frontier hosted API, a self-hosted open-weight model, or a small model running locally via Ollama — the model is a swappable configuration detail, and this is precisely the foundation the next two lessons\' frameworks (LangChain/LangGraph, and the Google ADK/OpenClaw/CrewAI/MCP survey) build further structure on top of.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Nami navigates by loop, not by memory',
      text: 'Approaching unfamiliar waters, Nami doesn\'t simply recall a route from memory and commit to it blind — she\'s learned, the hard way, that confident guessing without checking anything gets a crew killed. Instead she runs a loop, out loud, every time: THOUGHT — "we might be nearing a storm system, I should find out before committing to a heading." ACTION — she calls up to the crow\'s nest: "check the horizon to the northeast." OBSERVATION — the actual lookout report comes back: dark clouds, still distant. THOUGHT again, now informed by that real observation — "distant enough we have time, but I should confirm with the barometer before deciding our speed." ACTION — check the barometer. OBSERVATION — pressure dropping, but slowly. Only once she has ENOUGH real observations does she commit to a Final Answer: a specific heading and speed. She never tries to reason her way to a route purely from memory of old charts (that\'s how captains get crews killed on outdated information), and she never blindly checks random instruments with no plan either (Usopp, once, panicked and checked the SAME barometer reading four times in a row hoping it would somehow say something different — Nami cut him off: "it\'s not going to change because you\'re scared, ask something NEW or commit"). Her tools are whatever\'s actually available and reliable: the Log Pose for direction, the crow\'s nest for visual range, Chopper for reading crew fatigue before a hard push, Sanji for provisions count before deciding how long they can safely delay. She has a hard personal rule — no more than a handful of checks before she commits to SOME decision, storm or not, because a crew arguing over instrument readings forever loses just as badly as one that never checked at all (a real cap on how long the loop is allowed to run). The real test comes the day their Log Pose is destroyed in a fight: Nami doesn\'t freeze. Her PROCESS — think about what\'s uncertain, go get a real answer from whatever reliable source is actually available, incorporate it, repeat — never depended on the Log Pose specifically. She simply starts asking local sailors and reading unfamiliar currents instead, same loop, same discipline, a different source standing in for the tool she lost — and the crew barely notices the difference in how she operates, only in what she\'s asking.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica plans Thanksgiving by loop, not by guessing',
      text: 'Hosting a huge Thanksgiving with an uncertain guest count, Monica refuses to just guess how much food and seating she\'ll need from memory of past years — too many things have changed, and guessing wrong means a genuinely bad night. Instead she runs an explicit loop out loud, driving Chandler slightly insane: THOUGHT — "I don\'t know if we have enough chairs." ACTION — she calls Ross: "count how many folding chairs you actually have, right now." OBSERVATION — Ross reports back: four, one wobbly. THOUGHT, now updated by that real number — "still short at least two, and I should check if anyone\'s bringing a plus-one before I decide how short." ACTION — she calls Rachel to ask. OBSERVATION — Rachel confirms two extra guests are coming. Only once she\'s gathered ENOUGH real answers does she commit to a Final plan: exactly how many chairs to borrow and from where. She never tries to plan the whole night purely from memory of last year (guaranteed to be wrong by now), and she never randomly calls people with no plan either — Phoebe, at one point, calls Joey about the chair count for the THIRD time in ten minutes, hoping the number will somehow have changed; Monica cuts her off: "it\'s not going to be different because you\'re anxious, ask something we actually don\'t know yet, or we\'re moving on." She sets a hard personal rule: no more than three calls per open question before she just works with whatever she\'s learned, because endless fact-checking loses just as badly as no fact-checking at all. The real test comes when her phone battery dies mid-planning: Monica doesn\'t panic. Her PROCESS — figure out what\'s uncertain, get a real answer from whoever\'s reliably available, update the plan, repeat — never depended on having a working phone specifically. She just sends Joey door to door asking the same questions in person instead, same loop, same discipline, a different channel standing in for the one she lost.'
    },
    why: 'The loop is the entire idea: think about what\'s still uncertain, take one concrete action to find out (ask a specific source a specific question), actually incorporate the real answer that comes back, and repeat — never purely guessing from memory (ungrounded reasoning drifts), never blindly acting with no plan (pointless, possibly repeated, actions), and always with a hard cap on how long you\'re allowed to keep checking before you have to commit. And the punchline both stories share: the PROCESS never depends on which specific tool or source is used — lose the Log Pose, lose the phone, and the exact same loop keeps working with a different source standing in.'
  },
  storyAnim: {
    title: 'Nami\'s ReAct loop',
    h: 260,
    props: [
      { id: 'thought1', emoji: '💭', label: 'Thought: storm nearby?', x: 10, y: 14 },
      { id: 'nest', emoji: '🔭', label: 'Action: check crow\'s nest', x: 32, y: 14 },
      { id: 'obs1', emoji: '👁️', label: 'Observation: clouds, distant', x: 54, y: 14 },
      { id: 'thought2', emoji: '💭', label: 'Thought: confirm with barometer', x: 76, y: 14 },
      { id: 'baro', emoji: '📊', label: 'Action: check barometer', x: 32, y: 40 },
      { id: 'obs2', emoji: '👁️', label: 'Observation: pressure dropping slowly', x: 54, y: 40 },
      { id: 'final', emoji: '🧭', label: 'Final Answer: heading + speed', x: 76, y: 40 },
      { id: 'stuck', emoji: '🔁', label: 'Usopp: rechecks SAME reading 4x', x: 32, y: 70 },
      { id: 'cap', emoji: '🛑', label: 'hard cap: commit after a few checks', x: 60, y: 70 }
    ],
    actors: [
      { id: 'nami', emoji: '🍊', label: 'Nami', x: 10, y: 55 }
    ],
    steps: [
      { c: 'THOUGHT: is there a storm nearby? Not enough information yet.', p: { thought1: 'lit' } },
      { c: 'ACTION: check the crow\'s nest.', p: { nest: 'good' }, a: { nami: [32, 30] } },
      { c: 'OBSERVATION: real information comes back — clouds, still distant.', p: { obs1: 'good' } },
      { c: 'THOUGHT updates based on the REAL observation, not a guess: confirm with the barometer next.', p: { thought2: 'lit' } },
      { c: 'ACTION → OBSERVATION again: pressure dropping slowly.', p: { baro: 'good', obs2: 'good' } },
      { c: 'Enough real information gathered. FINAL ANSWER: commit to a heading and speed.', p: { final: 'good' } },
      { c: 'Usopp, panicked, rechecks the SAME reading four times hoping for a different answer — a stuck loop.', p: { stuck: 'bad' } },
      { c: 'Nami\'s hard rule stops it: ask something NEW, or commit. A cap on how long the loop is allowed to run.', p: { cap: 'good' } }
    ]
  },
  tech: [
    {
      q: 'Precisely explain why ReAct\'s interleaving of Thought and Action outperforms pure chain-of-thought reasoning alone.',
      a: 'Pure chain-of-thought reasoning generates an entire multi-step plan or answer using only the model\'s internal (pretrained + fine-tuned) knowledge, with no mechanism to check any intermediate claim against reality. Because generation is autoregressive (every token conditions on everything generated so far — the bert-vs-gpt lesson\'s causal structure), an early wrong assumption or outdated fact becomes part of the context for every subsequent token, and the model has no way to detect or correct it mid-generation — errors compound silently, and the final answer can be fluent and confident while being built on a false premise introduced steps earlier. ReAct breaks this single unbroken generation into discrete segments punctuated by REAL observations: after each Action, the Observation injected into the transcript is not the model\'s own (possibly wrong) belief, it is an actual result from a real tool call. The NEXT Thought is generated conditioned on that real observation, giving the model a genuine opportunity to notice a contradiction ("I assumed X, but the search result says Y") and revise its plan before continuing — a course-correction mechanism pure chain-of-thought structurally lacks, because it never has anything but its own generated text to condition on.'
    },
    {
      q: 'Walk through the mechanics of a single tool call end to end: what is sent to the model, what the model outputs, and what the calling code does with it.',
      a: 'Setup: the calling code constructs a prompt (or, for models with native function-calling support, a dedicated API field) listing available tools, each with a name, a natural-language description of its purpose, and a schema of expected parameters — e.g., a "search" tool taking a single "query" string parameter. The model generates its next output conditioned on this tool-aware context; if it determines a tool is the right next step, instead of (or alongside) natural-language text, it produces a STRUCTURED request — commonly JSON, e.g. {"tool": "search", "arguments": {"query": "current weather in Tokyo"}} — either because it was specifically fine-tuned to reliably emit this format for tool use, or because it was prompted to and the calling code will need to robustly parse whatever comes back. The calling code parses this structured request (validating the tool name exists and the arguments match the expected schema — a real point where malformed or hallucinated tool calls need to be caught, not blindly executed), looks up the actual corresponding function, and EXECUTES it for real — this is the one step in the entire pipeline where genuine, non-LLM code runs and something actually happens outside the model. The tool\'s return value is then formatted as an Observation and appended to the conversation transcript, and the model is called again with this updated transcript, now able to reason about and use the real result in deciding its next step.'
    },
    {
      q: 'What specifically causes an agent to get "stuck" repeating the same action, and how do you detect and prevent it programmatically?',
      a: 'The typical mechanism: the model receives an observation that doesn\'t resolve the uncertainty it was trying to address (a search returns no useful results, a tool errors out, or the observation is genuinely ambiguous), and rather than reasoning toward a DIFFERENT next step, it reissues the SAME action — often because the model has no strong signal for what else to try, and the training data it learned tool-use patterns from didn\'t sufficiently cover this exact "the obvious next step didn\'t help" case. For a deterministic tool, repeating the identical action produces the identical observation, so the model can loop this way indefinitely without external intervention. Detection is comparatively simple: maintain a short history of recent (tool_name, arguments) pairs, and before executing a newly requested action, check whether it exactly matches one recently issued — if so, don\'t execute it again; instead, inject a special observation like "You have already tried this exact action with this exact result — try a different approach" to force the model to reason about an alternative on its next Thought, or, if repeats persist past a small threshold, terminate the loop early with an explicit "unable to make progress" fallback rather than continuing to burn steps (and cost) on a provably unproductive pattern. This is a cheap, high-value safeguard — most production agent frameworks implement some version of it as a default, not an opt-in feature.'
    },
    {
      q: 'Explain precisely how to make an agent loop work identically across a model with native function-calling support and a local Ollama model without it.',
      a: 'The core design move is to implement the agent loop\'s control flow (build prompt with tool descriptions, call model, extract a tool request or final answer, execute tool if requested, append observation, repeat) entirely in terms of the LOWEST-COMMON-DENOMINATOR interface: a model that returns plain text, from which a tool request must be PARSED, never assuming a dedicated structured-output API field is available. For models WITH native function-calling support, an adapter (the using-models-apis lesson\'s pattern) can still use that richer, more reliable native mechanism internally, but its OUTPUT to the agent loop\'s core logic should be normalized to the same shape a text-parsing fallback would produce — e.g., always return a consistent internal representation like {"type": "tool_call", "tool": ..., "arguments": {...}} or {"type": "final_answer", "text": ...}, regardless of whether that was derived from a native API field or parsed out of raw text via a prompted format like "Action: tool_name[arguments]". For models WITHOUT native function-calling (many models comfortably run via Ollama fall in this category, or simply weren\'t fine-tuned with a specific provider\'s function-calling convention), the prompt explicitly instructs the exact text format expected, and a dedicated PARSER function (using regex or a small structured-text grammar) extracts the tool name and arguments from the raw generated text, handling minor formatting variance the model might produce and failing gracefully (asking the model to retry, or falling back to treating malformed output as a final answer) rather than crashing on an unexpected format. With this design, the agent loop\'s core logic — arguably the most valuable, most tested part of the system — never changes when the underlying model is swapped; only the adapter translating between "raw model output" and the loop\'s normalized internal tool-call representation changes per backend.'
    }
  ],
  code: {
    title: 'A minimal ReAct agent loop, LLM-agnostic',
    intro: 'The full loop — prompt construction, parsing, tool execution, observation feedback, safety caps — written against the LLMProvider interface from the using-models-apis lesson, so it runs unchanged against a hosted API, an HF model, or Ollama.',
    code: `import re
import json

TOOLS = {
    "search": lambda query: f"[search results for '{query}': ...]",
    "calculator": lambda expression: str(eval(expression, {"__builtins__": {}})),
}

TOOL_DESCRIPTIONS = """
Available tools:
- search(query): look up current information
- calculator(expression): evaluate a math expression

Respond in EXACTLY one of these two formats:
Thought: <your reasoning>
Action: <tool_name>[<argument>]

OR, once you have enough information:
Thought: <your reasoning>
Final Answer: <your answer>
"""

def parse_response(text):
    if "Final Answer:" in text:
        return {"type": "final", "text": text.split("Final Answer:")[1].strip()}
    match = re.search(r"Action:\\s*(\\w+)\\[(.*?)\\]", text)
    if match:
        return {"type": "tool_call", "tool": match.group(1), "argument": match.group(2)}
    return {"type": "unparsed", "text": text}          # fallback: model didn't follow the format

def run_agent(question, provider, max_steps=6):        # provider: any LLMProvider from using-models-apis
    transcript = f"{TOOL_DESCRIPTIONS}\\nQuestion: {question}\\n"
    recent_actions = []

    for step in range(max_steps):
        raw = provider.generate(transcript, temperature=0.2)
        parsed = parse_response(raw)

        if parsed["type"] == "final":
            return parsed["text"]

        if parsed["type"] == "tool_call":
            key = (parsed["tool"], parsed["argument"])
            if key in recent_actions[-2:]:               # stuck-loop detection
                transcript += f"\\nObservation: You already tried this exact action. Try something different.\\n"
                continue
            recent_actions.append(key)
            tool_fn = TOOLS.get(parsed["tool"])
            result = tool_fn(parsed["argument"]) if tool_fn else f"Unknown tool: {parsed['tool']}"
            transcript += f"\\n{raw}\\nObservation: {result}\\n"
        else:
            transcript += f"\\n{raw}\\nObservation: Please follow the exact Thought/Action or Final Answer format.\\n"

    return "I wasn't able to complete this within the allotted steps."

# Works identically regardless of which provider is passed in:
# run_agent("What is 847 * 23?", AnthropicProvider(...))
# run_agent("What is 847 * 23?", OllamaProvider(...))`,
    notes: [
      'run_agent takes provider: LLMProvider — nothing in the loop\'s logic branches on which specific backend it is, exactly the abstraction from the using-models-apis lesson, now carrying a real multi-step control loop instead of a single call.',
      'parse_response has an explicit "unparsed" fallback path — models that don\'t reliably follow the requested format still get a graceful recovery observation rather than crashing the loop, important for models without native function-calling support.',
      'recent_actions[-2:] is the repeated-action guard from the lesson\'s tech corner — checking only a short recent window (not the whole history) keeps the check cheap and catches the common "immediately re-ask the same thing" pattern.',
      'eval() in the calculator tool is fine for a toy example with a restricted __builtins__, but a production tool executing arbitrary model-supplied input needs real sandboxing — remember this is the one place in the whole loop where model output becomes REAL executed code.'
    ]
  },
  lab: {
    title: 'Build the ReAct loop: parsing, tool execution, and stuck-loop detection',
    prompt: 'Pure Python, fully runnable — driven by a SCRIPTED mock model (a list of canned responses) instead of a real LLM, so the loop\'s logic is fully deterministic and testable. Implement (1) <code>parse_response(text)</code> — return {"type": "final", "text": ...} if "Final Answer:" appears, {"type": "tool_call", "tool": ..., "argument": ...} if an "Action: name[arg]" pattern is found, else {"type": "unparsed", "text": text}; (2) <code>is_repeated_action(action, recent_actions, window=2)</code> — True if action matches any of the last `window` entries in recent_actions; (3) <code>run_agent(question, mock_responses, tools, max_steps=6)</code> — the full loop, where mock_responses is a list consumed one per step (standing in for real model calls) instead of calling a live provider.',
    starter: `import re

def parse_response(text):
    ...

def is_repeated_action(action, recent_actions, window=2):
    ...

def run_agent(question, mock_responses, tools, max_steps=6):
    # mock_responses: list of strings, consumed one per loop iteration (stand-in for provider.generate)
    # tools: dict of {name: function(argument) -> str}
    # Loop: parse the next mock response; if final -> return text;
    # if tool_call -> check is_repeated_action first, else execute and continue;
    # if unparsed -> continue with a format-reminder observation
    # if max_steps exhausted -> return the fallback message
    ...`,
    checks: [
      { re: 'def\\s+parse_response\\s*\\(', must: true, hint: 'Define parse_response(text) returning a dict with a "type" key.', pass: 'parse_response() defined' },
      { re: 'Final Answer', must: true, hint: 'parse_response must detect "Final Answer:" in the text.', pass: 'final-answer detection present' },
      { re: 'def\\s+is_repeated_action\\s*\\(', must: true, hint: 'Define is_repeated_action(action, recent_actions, window=2).', pass: 'is_repeated_action() defined' },
      { re: 'def\\s+run_agent\\s*\\(', must: true, hint: 'Define run_agent(question, mock_responses, tools, max_steps=6).', pass: 'run_agent() defined' },
      { re: 'max_steps', must: true, hint: 'run_agent must respect max_steps and return a fallback message if exceeded.', pass: 'max_steps cap present' }
    ],
    tests: `# parse_response: three distinct output types
final = parse_response("Thought: I know enough.\\nFinal Answer: 42")
assert final["type"] == "final" and final["text"] == "42"

tool_call = parse_response("Thought: need to search.\\nAction: search[python programming]")
assert tool_call["type"] == "tool_call"
assert tool_call["tool"] == "search" and tool_call["argument"] == "python programming"

unparsed = parse_response("I'm just going to ramble without following the format.")
assert unparsed["type"] == "unparsed"

# is_repeated_action: detects a match within the recent window, ignores older or distinct actions
recent = [("search", "cats"), ("search", "dogs")]
assert is_repeated_action(("search", "dogs"), recent, window=2) == True
assert is_repeated_action(("search", "birds"), recent, window=2) == False
assert is_repeated_action(("search", "cats"), recent, window=1) == False   # outside the window

# run_agent: full loop, tool executed, observation drives the next step, final answer returned
tools = {"calculator": lambda arg: str(eval(arg, {"__builtins__": {}}))}
mock_responses = [
    "Thought: I need to compute this.\\nAction: calculator[6 * 7]",
    "Thought: Now I know the answer.\\nFinal Answer: 42",
]
result = run_agent("What is 6 times 7?", mock_responses, tools)
assert result == "42", f"expected 42, got {result}"

# run_agent: exhausting max_steps without a final answer returns the fallback
never_finishes = ["Thought: still thinking.\\nAction: calculator[1 + 1]"] * 10
result2 = run_agent("unanswerable", never_finishes, tools, max_steps=3)
assert "allotted steps" in result2.lower() or "wasn't able" in result2.lower()
print("Parsing + stuck-loop detection + the full ReAct control loop, fully deterministic and testable.")`,
    runnable: true,
    solution: `import re

def parse_response(text):
    if "Final Answer:" in text:
        return {"type": "final", "text": text.split("Final Answer:")[1].strip()}
    match = re.search(r"Action:\\s*(\\w+)\\[(.*?)\\]", text)
    if match:
        return {"type": "tool_call", "tool": match.group(1), "argument": match.group(2)}
    return {"type": "unparsed", "text": text}

def is_repeated_action(action, recent_actions, window=2):
    return action in recent_actions[-window:]

def run_agent(question, mock_responses, tools, max_steps=6):
    recent_actions = []
    for step in range(max_steps):
        if step >= len(mock_responses):
            break
        raw = mock_responses[step]
        parsed = parse_response(raw)

        if parsed["type"] == "final":
            return parsed["text"]

        if parsed["type"] == "tool_call":
            action = (parsed["tool"], parsed["argument"])
            if is_repeated_action(action, recent_actions):
                continue
            recent_actions.append(action)
            tool_fn = tools.get(parsed["tool"])
            _ = tool_fn(parsed["argument"]) if tool_fn else f"Unknown tool: {parsed['tool']}"
            # observation would be appended to a real transcript here; mock_responses drives the test instead
        # unparsed: would append a format-reminder observation in a live loop

    return "I wasn't able to complete this within the allotted steps."`,
    notes: [
      'Driving the loop with a scripted mock_responses list instead of a live model is exactly how you\'d unit-test a real agent loop too — decoupling the CONTROL FLOW from actually calling an LLM makes the hardest-to-debug part of an agent (the loop logic itself) fully deterministic and fast to test.',
      'is_repeated_action only checks a short recent WINDOW, not the entire history — an agent legitimately re-using the same tool much later in a long task (after genuinely new context) shouldn\'t be flagged as stuck.',
      'The max_steps fallback test is not a formality — a real agent loop without this safeguard will, on a sufficiently confusing task, call an LLM (and possibly paid external tools) indefinitely, a real production incident waiting to happen.'
    ]
  },
  quiz: [
    {
      q: 'What structurally distinguishes an "agent" from an ordinary single LLM call?',
      options: ['The model can request that a real tool be executed, observe the actual result, and use it to decide its next step — a loop, rather than one prompt producing one final response', 'Agents use a fundamentally different neural network architecture than other LLMs', 'Agents never require any prompt engineering', 'Agents always run faster than single-call LLM usage'],
      correct: 0,
      explain: 'Every other lesson used "prompt in, response out." An agent introduces a loop with real tool execution and observation feedback driving the next decision.'
    },
    {
      q: 'Why does ReAct interleave Thought and Action rather than doing all reasoning up front?',
      options: ['Interleaving lets each Thought be conditioned on a REAL observation from the most recent tool call, allowing the model to catch and correct wrong assumptions mid-task rather than compounding them silently', 'Interleaving makes the model generate text faster', 'Pure chain-of-thought reasoning is architecturally impossible for transformers', 'Interleaving eliminates the need for any tools at all'],
      correct: 0,
      explain: 'Pure upfront reasoning has no mechanism to check itself against reality; ReAct\'s per-step observations give the model real course-correction opportunities an unbroken reasoning chain lacks.'
    },
    {
      q: 'What is the "stuck loop" failure mode in agents, and what is a direct way to guard against it?',
      options: ['The model repeatedly calls the same tool with the same arguments without making progress; comparing each new action against a short recent history and intervening on a match prevents indefinite repetition', 'The model refuses to call any tools at all', 'The tool itself crashes and cannot be called again', 'The model always alternates between exactly two different tools'],
      correct: 0,
      explain: 'A deterministic tool called with identical arguments returns an identical result — repeating it can never resolve the model\'s uncertainty, so detecting and blocking exact repeats (or forcing a different approach) is a cheap, high-value safeguard.'
    },
    {
      q: 'Why is a max_steps cap close to mandatory in a production agent loop?',
      options: ['Without it, nothing stops a model from deciding it needs "one more" step indefinitely, and every loop iteration costs at least one LLM call (and possibly paid tool calls) — an uncapped loop is a real cost and reliability risk', 'max_steps is only needed for local models, never for hosted APIs', 'max_steps prevents the model from ever making a mistake', 'max_steps is required by law in most jurisdictions'],
      correct: 0,
      explain: 'Every iteration has real cost; an agent given a hard task or an ambiguous objective can loop far longer than intended without an explicit cap and a designed fallback response.'
    },
    {
      q: 'What is the key design principle for making an agent loop work across a hosted API, a Hugging Face model, and Ollama without rewriting the loop itself?',
      options: ['Write the loop\'s control flow against a normalized, lowest-common-denominator representation (parsed tool call or final answer), with any provider-specific function-calling differences isolated inside per-backend adapters', 'Only use models that share an identical API format', 'Rewrite the entire agent loop separately for each backend', 'Avoid tool use entirely when working with local models'],
      correct: 0,
      explain: 'The using-models-apis lesson\'s interface-first principle, extended: the loop should consume a consistent internal shape regardless of whether that shape came from a native function-calling API or a text-parsing fallback for models without one.'
    }
  ],
  pitfalls: [
    'Executing a model-requested tool call without validating the tool name and arguments first — a hallucinated or malformed tool request executed blindly is a real correctness and (for tools with side effects) safety risk.',
    'Building an agent loop with no max_steps cap "because the task usually finishes quickly" — the failure case (a confusing task, a model that gets stuck) is exactly when the cap matters most, and it costs nothing to have when the task DOES finish quickly.',
    'Forgetting stuck-loop detection and discovering it in production when an agent silently re-calls the same paid API endpoint dozens of times on a single request.',
    'Giving an agent a broad, loosely-specified toolset "for flexibility" rather than scoping tools tightly to what the task actually needs — this is the reward-hacking-style risk from the rlhf-alignment lesson made concrete in actions: more unconstrained capability increases the chance of a technically-successful-but-unintended strategy.',
    'Assuming a model without native function-calling support simply cannot be used for agents — the text-based Thought/Action/Observation prompting fallback works with any sufficiently capable model, including most models run locally via Ollama; it just requires a more careful parser.',
    'Hard-coding a specific provider\'s tool-calling API format directly into the agent loop\'s core logic, making it painful to swap in a different model later — exactly the anti-pattern the using-models-apis lesson\'s abstraction exists to prevent, now with a more complex loop at stake.'
  ],
  interview: [
    {
      q: 'Explain the ReAct pattern precisely, and why it improves on both pure chain-of-thought and pure tool-calling-without-reasoning.',
      a: 'ReAct structures an agent\'s output as a repeating cycle: Thought (natural-language reasoning about current knowledge and next steps), Action (a request to call a specific tool with specific arguments), Observation (the tool\'s actual, real result inserted into the transcript) — repeated until a Thought concludes enough information is available, ending in a Final Answer. Compared to pure chain-of-thought (reasoning through an entire plan with no real-world checks): CoT has no mechanism to catch a wrong assumption or outdated fact introduced early in its reasoning, and because generation is autoregressive, that error becomes part of the context for everything generated afterward, compounding silently into a fluent but wrong final answer. ReAct breaks this by injecting a REAL observation after every action, giving each subsequent Thought a chance to notice a contradiction and revise course — genuine grounding, not just more reasoning. Compared to pure tool-calling without explicit reasoning: acting without a stated plan tends to select poor or redundant tools and gives the model no natural place to synthesize what several observations together imply before deciding what to do next — the explicit Thought step is where that synthesis happens, visible and (usefully, for debugging) inspectable in the transcript. The net effect: ReAct combines the planning benefit of reasoning with the grounding benefit of real tool execution, each compensating for the other\'s weakness.'
    },
    {
      q: 'Walk through the concrete engineering safeguards you would put around a production agent loop, and why each one is necessary.',
      a: 'Four safeguards, each addressing a distinct, real failure mode. (1) max_steps cap with an explicit fallback response: without it, an agent facing an ambiguous or hard task can loop indefinitely, and every iteration costs at least one LLM call (plus any tool costs) — the cap bounds worst-case cost and latency, and the fallback ensures a caller gets SOME response rather than a hung request. (2) Repeated-action detection: compare each newly requested action against a short recent history, and intervene (skip re-execution, inject a "you already tried this" observation, or force termination past a threshold) on a match — because a deterministic tool called identically will never resolve whatever uncertainty caused the model to re-ask, this is a cheap, high-value way to prevent wasted iterations. (3) Tool-call validation before execution: never blindly execute a model-requested tool call — validate the tool name exists and the arguments roughly match the expected schema/types before running it, since a hallucinated or malformed request executed without checking is both a correctness risk and, for tools with real side effects, a safety risk. (4) Scoped, minimal toolsets: give an agent access to only the tools a specific task genuinely needs, rather than a broad general-purpose toolkit "just in case" — this is a direct mitigation for the reward-hacking-style risk where a loosely constrained agent with excess capability finds a technically-successful but unintended strategy; narrowing available actions narrows the space of possible unintended strategies. Together, these four turn "an LLM that can call functions" into something closer to a bounded, auditable, production-safe system.'
    },
    {
      q: 'Design the tool-calling abstraction for a system that must support both a hosted API with native function-calling and a local Ollama model without it, using the same agent loop code.',
      a: 'Define a normalized internal representation the agent loop\'s core logic consumes, independent of how it was produced — e.g. a dict {"type": "tool_call", "tool": name, "arguments": {...}} or {"type": "final_answer", "text": ...}. Implement this as a method on each backend-specific provider adapter (extending the using-models-apis lesson\'s LLMProvider pattern): the hosted-API adapter, when the provider\'s native function-calling field is populated in its response, simply maps that structured field directly into the normalized representation — reliable, since the model was specifically trained to produce well-formed output in that field. The Ollama (or any non-function-calling-native model) adapter instead includes the available tools\' descriptions as PLAIN TEXT in the prompt, instructs a specific parseable output format ("Action: tool_name[arguments]" or similar), and applies a dedicated regex/parsing function to the model\'s raw text output to extract the same normalized representation — handling minor formatting variance gracefully (e.g., matching common near-miss formats, or falling back to an "unparsed, please retry in the correct format" observation rather than crashing on unexpected output). Critically, the agent loop\'s CONTROL FLOW (call the model, check the normalized type, execute the tool if requested, append the observation, repeat, respect max_steps) is written ONCE against this normalized representation and never branches on which backend produced it — all backend-specific complexity (how to extract a tool call from THIS model\'s particular output style) lives entirely inside the per-backend adapter, which is exactly the separation of concerns that lets the same loop code serve a frontier hosted model and a small local Ollama model interchangeably, differing only in which adapter is configured.'
    },
    {
      q: 'A team\'s customer-support agent occasionally takes a surprising, unintended action (e.g., issuing a refund when the user only asked a billing question). How would you investigate and prevent this?',
      a: 'This is a concrete instance of the reward-hacking-adjacent risk this lesson flags: an agent with access to a consequential tool (issue_refund) and a loosely specified objective (be helpful, resolve the user\'s issue) can, in some transcripts, decide that tool serves its objective in a way nobody intended for that specific case. Investigation: (1) Pull the full transcript (Thought/Action/Observation history) for the incident — because ReAct makes reasoning explicit and inspectable, this is usually directly diagnosable, unlike a black-box single-call system; check what Thought preceded the refund Action, and whether it reflects a reasonable-but-wrong interpretation of the user\'s request or a clearer failure (misreading an ambiguous message, or a stuck-loop-adjacent pattern where an earlier unhelpful observation pushed it toward an overly aggressive fallback action). (2) Check whether the refund tool\'s description/schema in the prompt adequately conveys WHEN it should and shouldn\'t be used — vague tool descriptions are a common, fixable root cause; tightening the description (and possibly requiring specific preconditions be confirmed via other tools/observations before this one becomes available) directly narrows the space for misuse. (3) Consider whether a consequential, hard-to-reverse action like a refund should be FULLY AUTONOMOUS at all versus requiring a confirmation step — e.g., the agent proposes the refund and a human (or a separate, narrower confirmation check) approves it before actual execution — treating "issue a refund" with the same reversibility-aware caution this course\'s own safety guidance applies to real-world actions generally. (4) Add this specific scenario (or the pattern behind it) to the agent\'s evaluation suite (agent-memory-eval-safety, next lesson\'s topic) so the fix is verified to actually prevent recurrence, not just patched anecdotally. The general principle: scope which actions an agent can take autonomously versus which require confirmation, based on how costly and reversible a wrong action would be — not based on how rarely the agent is expected to get it wrong.'
    }
  ]
};
