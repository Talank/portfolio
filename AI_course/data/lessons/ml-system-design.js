window.LESSONS = window.LESSONS || {};
window.LESSONS['ml-system-design'] = {
  id: 'ml-system-design',
  title: 'ML & LLM System Design Interviews',
  category: 'Part 8 — Interviews & Career',
  timeMin: 60,
  summary: 'Every other lesson in this course went deep on one idea. This one is different on purpose: it is the framework for combining ALL of them under interview pressure, when the question is deliberately vague ("design a fraud detection system," "design a support chatbot") and what\'s being graded is not whether you land on the "right" architecture but whether you reason about it the way a senior engineer — or a researcher — actually would. Two worked examples, one classic ML and one LLM-native, walk the same six-stage framework end to end, and a closing section covers what changes when the conversation is a research pitch instead of a production system.',
  goals: [
    'Apply a repeatable six-stage framework to any ML/LLM system design prompt: clarify, metrics, data, approach, serving, iteration',
    'Explain what interviewers are actually evaluating in a system design round, and why a confident wrong turn beats silent uncertainty',
    'Walk a classic ML system (fraud detection) and an LLM-native system (RAG support chatbot) through the same framework, citing specific course concepts by name',
    'Connect offline ML metrics to online business metrics explicitly, including a cost-based framing of the precision/recall trade-off',
    'Explain what changes in a research-track conversation versus a production system design interview, and prepare for both'
  ],
  concept: [
    {
      h: 'What is actually being graded',
      p: [
        'A system design prompt ("design a recommendation system," "design an LLM agent for X") is deliberately underspecified — there is no single correct architecture, and interviewers know this. What they\'re evaluating is HOW you handle ambiguity: do you ask clarifying questions before committing to an approach, do you explicitly state assumptions when a clarifying question isn\'t answerable, do you justify each significant design choice against an alternative rather than asserting it, do you propose a way to MEASURE whether your design actually worked, and do you show awareness of failure modes and a plan to iterate rather than presenting a "finished," never-revisited v1.',
        'The single most common failure mode in these interviews isn\'t choosing a suboptimal architecture — it\'s silence: staring at an ambiguous prompt hoping the "right" answer will present itself, rather than narrating a structured process out loud. A confident, clearly-reasoned answer that lands on a defensible-but-not-optimal design consistently outperforms a correct-but-silently-arrived-at answer, because the interviewer cannot evaluate reasoning they never heard. This lesson\'s framework exists specifically to give you something concrete to narrate, every time, regardless of how unfamiliar the specific prompt is.'
      ]
    },
    {
      h: 'The six-stage framework',
      p: [
        '<b>1. Clarify.</b> Before proposing anything: what is the actual business goal (reduce fraud losses, resolve support tickets faster, increase engagement), what scale (requests per second, data volume), what latency/cost constraints, what does the interviewer mean by "success," and what\'s explicitly OUT of scope. State the assumptions you\'re making if a question can\'t be fully answered — this alone signals structured thinking.',
        '<b>2. Define metrics — offline AND online.</b> An offline ML metric (precision/recall/AUC for classification, perplexity/BLEU/task-success-rate for generation — the model-evaluation lesson\'s toolkit) is a PROXY for a real business metric (fraud losses prevented, tickets resolved without escalation, revenue) — state both explicitly, and say HOW you\'d validate that the offline proxy actually predicts the online outcome (an A/B test, a staged rollout), since interviewers specifically probe whether a candidate conflates "the model scores well offline" with "the system achieves the business goal."',
        '<b>3. Data.</b> What data exists, is it labeled (and how — human review, weak/proxy labels, user feedback), how would you split it to avoid leakage (the model-evaluation lesson\'s temporal-split discipline is especially relevant here — most real systems have a strong time component), and how does the data stay fresh as the underlying distribution shifts.',
        '<b>4. Approach — start simple, justify escalation.</b> Propose the SIMPLEST approach that could plausibly work first (sometimes a rule-based heuristic, sometimes classical ML — logistic regression, a decision tree) BEFORE reaching for the most sophisticated option, and justify moving up in complexity only against a concrete limitation of the simpler approach — this is literally the using-models-apis lesson\'s tier-matching framework, now the interview answer itself: match the tool to the actual requirement, don\'t default to the most impressive-sounding option.',
        '<b>5. Serving and infrastructure.</b> Latency budget (synchronous, user-facing decisions need a tight budget; offline batch scoring does not), throughput and cost at the stated scale, caching opportunities, and — for an LLM-based system specifically — the inference-sampling and using-models-apis lessons\' concerns: which model tier, hosted vs self-hosted, batching strategy.',
        '<b>6. Monitor and iterate.</b> A shipped v1 is a starting point, not an ending point: how do you detect the model/data drifting out of date, what\'s the feedback loop for catching real-world failures the offline evaluation missed, how do you safely test a v2 (shadow traffic, a staged rollout), and — for anything with real-world side effects — what guardrails (the agent-memory-eval-safety lesson\'s layered approach) are in place for when the system is wrong.'
      ]
    },
    {
      h: 'Worked example 1 — classic ML: fraud detection',
      p: [
        'Prompt: "Design a system to flag potentially fraudulent transactions on a payments platform." Clarify: synchronous decision at checkout (tight latency), what happens to a flagged transaction (blocked outright, or routed to human review — very different designs), what\'s the cost of a false positive (blocking a legitimate customer, real revenue and trust cost) versus a false negative (a fraud loss). Metrics: this is the model-evaluation lesson\'s precision/recall trade-off made concrete and COST-WEIGHTED — false positives and false negatives have genuinely different dollar costs here, so the right operating threshold isn\'t "maximize F1," it\'s "minimize expected cost given the actual cost of each error type" (this lesson\'s lab makes this precise). Data: historical labeled transactions — but labels are DELAYED (a fraud isn\'t confirmed for days/weeks after the transaction), a real, specific leakage risk (the model-evaluation lesson\'s discipline: never train on information that wasn\'t actually available at decision time).',
        'Approach: start with a simple baseline — logistic regression on hand-engineered features (transaction amount, merchant category, velocity of recent transactions — the linear-regression and logistic-regression lessons\' territory) — before justifying a move to gradient-boosted trees or a neural approach against a MEASURED limitation of the baseline. Serving: sub-100ms scoring at checkout, meaning the model must be small/fast enough to score synchronously — a strong constraint that itself argues against an unnecessarily large model. Iterate: borderline scores route to a human review queue rather than an automatic block (a cost-aware middle ground, and an early version of the action-guardrail pattern from agent-memory-eval-safety — a costly, hard-to-reverse action gated by review rather than fully autonomous), and the model is retrained on a rolling window as fraud PATTERNS shift (concept drift is not hypothetical here — fraud is adversarial and adapts specifically to defeat whatever the current model catches).'
      ]
    },
    {
      h: 'Worked example 2 — LLM-native: a RAG support chatbot with escalation',
      p: [
        'Prompt: "Design a chatbot that answers customer questions from our documentation and escalates issues it can\'t resolve." Clarify: what\'s the acceptable rate of wrong-but-confident answers (a much higher bar for something like billing questions than general how-to questions), does escalation mean handing to a human or taking an autonomous action (issuing a refund is a VERY different design than drafting a human-reviewed suggestion). Metrics: task success rate AND a groundedness/faithfulness metric specifically (the embeddings-rag lesson\'s retrieval-failure-vs-generation-failure distinction — measure BOTH separately), plus the online business metric (ticket deflection rate, customer satisfaction) with a plan to validate the offline proxy against it.',
        'Data: the existing documentation is the retrieval corpus — but ALSO consider what data doesn\'t exist yet (a labeled set of realistic user questions with known-correct chunks, needed for the embeddings-rag lesson\'s recall@k evaluation, likely requiring deliberate construction rather than assuming it already exists). Approach: RAG over the documentation (embeddings-rag) rather than fine-tuning to "memorize" the docs (the fine-tuning-lora lesson\'s explicit rule — fine-tune for behavior, retrieve for knowledge, and documentation changes too often to bake into weights reliably); decide model tier per using-models-apis\' framework (a smaller model for straightforward lookup-style questions, escalating to a more capable tier or an actual agent with tools for multi-step troubleshooting — model routing, the using-models-apis lesson\'s pattern). Serving: latency budget for a chat interface (looser than fraud detection\'s checkout constraint, but still real), streaming responses for perceived latency.',
        'Iterate and guard: an agent-based escalation path (agents-from-scratch\'s tool-use loop) with any CONSEQUENTIAL action (issuing a refund, modifying an account) gated behind explicit human approval (langchain-langgraph/agent-memory-eval-safety\'s action-guardrail pattern) regardless of the model\'s apparent confidence; retrieved content is treated as untrusted input specifically because a support system plausibly ingests user-submitted content into its context, a genuine prompt-injection surface (agent-memory-eval-safety\'s closing topic); evaluation combines LLM-as-judge scoring at scale with periodic human audit of a sample (the same lesson\'s caveat about unaudited judges). Notice how many named course concepts this single design pulls together — that breadth, not depth on any one piece, is exactly what an LLM-system design round is testing.'
      ]
    },
    {
      h: 'When the conversation is research, not production',
      p: [
        'A research-track conversation ("tell me about a problem you\'d want to work on," or a paper-discussion/proposal round) rewards a genuinely different, though related, kind of rigor than a production system design interview — worth preparing for explicitly given this course\'s stated aim of getting you research-ready, not just engineer-ready. Where a production design interview wants "does this ship, work reliably, and handle scale," a research conversation wants: <b>motivation</b> — WHY does this problem matter, concretely, not just that it\'s technically interesting; <b>awareness of what\'s already been tried</b> — the research equivalent of "start with the simple baseline," now meaning "what do existing approaches already achieve, and specifically where do they fall short" (arriving with zero awareness of prior work reads as a bigger red flag in a research conversation than proposing a suboptimal architecture does in an engineering one); <b>a genuinely testable hypothesis</b> — a specific, falsifiable claim about what your approach should do better and why, not just "try a bigger model" or "try a new architecture" without a mechanism-level reason to expect improvement; <b>a concrete evaluation and ablation plan</b> — the model-evaluation lesson\'s discipline pointed at validating a NOVEL claim rather than a known metric, including what experiment would prove you WRONG, not only what would confirm you right; and <b>honest limitations</b> — naming what your approach doesn\'t solve, what assumptions it depends on, and where it would plausibly fail, rather than overselling. A candidate who says "I don\'t know, and here\'s the specific experiment I\'d run to find out" is, in a research context, giving a STRONGER answer than one who confidently asserts an untested claim — the opposite of how confident-but-wrong plays in most engineering interviews, and a distinction worth having explicitly in mind before either kind of conversation.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Nami\'s trial isn\'t about the answer — it\'s about the questions asked first',
      text: 'When the crew needs a new junior navigator, Nami doesn\'t quiz candidates on memorized facts — charts and tide tables can be looked up. Instead she gives every candidate the same deliberately vague scenario: "we need to get this crew safely across an unmapped stretch of the Grand Line. How would you approach it?" The candidates who fail fastest are the ones who immediately blurt a confident specific route — no questions asked, no stated assumptions, just a guess dressed up as certainty. The ones who pass ask first: what\'s our actual time pressure, what\'s our tolerance for risk versus speed, do we have a fallback if the first plan fails, and what would even COUNT as "on track" at each waypoint rather than only at the very end. Only after establishing that does a strong candidate propose an actual plan — and crucially, they propose the SIMPLEST reasonably safe route first, explaining exactly what would make them escalate to something more elaborate, rather than opening with the most complex option to look impressive. Nami then runs every promising candidate through a SECOND, completely different scenario — not another navigation puzzle, but designing an entirely new fleet-wide reporting system so several allied ships can coordinate over the Den Den Mushi network without confusion (echoes of an earlier chapter\'s standardized-protocol lesson) — specifically to check whether their APPROACH generalizes, or whether they\'d simply memorized one clever navigation trick that doesn\'t transfer to a genuinely different kind of problem. Separately, and very differently, Robin evaluates a prospective archaeology apprentice — and she is explicitly not looking for someone who already knows the answer to some obscure historical question. She wants someone who can explain, clearly, WHY a specific unsolved question actually matters to understanding the world\'s hidden history, who knows what previous scholars already tried and specifically where those attempts fell short, who proposes one genuinely testable next step rather than a vague ambition, and who says "I don\'t yet know, and here is exactly the piece of evidence that would tell us" without embarrassment — a candidate confidently asserting an unverified historical claim worries her far more than one honestly admitting the limits of what they\'ve confirmed.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s kitchen trial, and Ross\'s museum interview',
      text: 'Hiring a new sous-chef, Monica doesn\'t test candidates on reciting recipes from memory — anyone can look up a recipe. She gives every candidate the same deliberately vague, high-pressure scenario: "the walk-in fridge just died an hour before a huge private event tonight — what do you do?" The candidates who fail fastest launch immediately into a confident, specific fix with zero questions asked. The ones who pass ask first: how much food is actually at risk right now, what\'s the actual guest count and menu, is there a backup fridge or ice available, and what would even count as "we\'re okay" in the next ten minutes versus needing a real Plan B. Only then does a strong candidate propose an actual response — starting with the simplest safe fix available (move the most perishable items to ice immediately) rather than opening with some elaborate, unnecessary overhaul to look decisive. Monica runs every promising candidate through a SECOND, totally different scenario too — not another kitchen-emergency question, but designing an entirely new system for the whole restaurant to take, track, and confirm phone-in reservations without double-booking — specifically to see whether their APPROACH transfers to a genuinely different kind of problem, or whether they\'d simply memorized one clever fridge-emergency trick. Separately, interviewing a research-assistant candidate for the museum, Ross looks for something different entirely — not someone who already has the answer to an unsolved paleontology question, but someone who can explain clearly WHY that specific open question actually matters, who knows what previous researchers already tried and exactly where it fell short, who proposes one real testable next step rather than a vague ambition, and who says "I genuinely don\'t know yet, and here\'s the specific piece of evidence that would tell us" without flinching — a candidate who confidently asserts an unverified claim worries Ross far more than one who\'s honest about the limits of what they\'ve actually confirmed.'
    },
    why: 'Neither Nami nor Monica is grading the SPECIFIC fix a candidate proposes — they\'re grading whether the candidate asks clarifying questions first, states what "success" even means before chasing it, starts simple before escalating, and can run the SAME reasoning process on a second, unrelated problem. And Robin and Ross, running a different kind of interview entirely, aren\'t grading whether a candidate already knows the answer — they\'re grading whether the candidate can motivate why a question matters, knows what\'s already been tried, proposes something genuinely testable, and is honest about what they don\'t yet know.'
  },
  storyAnim: {
    title: 'Two trials, one framework each',
    h: 280,
    props: [
      { id: 'prompt', emoji: '❓', label: '"get us across an unmapped stretch"', x: 12, y: 12 },
      { id: 'silence', emoji: '🤐', label: 'candidate A: confident guess, no questions', x: 12, y: 38 },
      { id: 'clarify', emoji: '💬', label: 'candidate B: clarifying questions first', x: 40, y: 38 },
      { id: 'simple', emoji: '🧭', label: 'starts with the simplest safe route', x: 40, y: 60 },
      { id: 'second', emoji: '🐌', label: 'a SECOND, unrelated scenario', x: 68, y: 38 },
      { id: 'transfer', emoji: '✅', label: 'same framework, transfers cleanly', x: 68, y: 60 },
      { id: 'research', emoji: '📜', label: 'Robin\'s apprentice trial: a different rigor', x: 90, y: 12 },
      { id: 'honest', emoji: '🎓', label: '"I don\'t know yet — here\'s the test that would tell us"', x: 90, y: 38 }
    ],
    actors: [
      { id: 'nami', emoji: '🍊', label: 'Nami', x: 40, y: 20 }
    ],
    steps: [
      { c: 'The scenario is deliberately vague. Candidate A jumps straight to a confident, specific answer — no questions asked.', p: { prompt: 'lit', silence: 'bad' } },
      { c: 'Candidate B asks first: what\'s our timeline, our risk tolerance, our fallback plan?', p: { clarify: 'good' }, a: { nami: [40, 30] } },
      { c: 'Only then do they propose the SIMPLEST safe route — and say exactly what would make them escalate.', p: { simple: 'good' } },
      { c: 'Nami runs a completely different scenario next: not navigation, but a whole new fleet reporting system.', p: { second: 'lit' } },
      { c: 'The same framework transfers cleanly — that\'s what was actually being graded, not the first answer.', p: { transfer: 'good' } },
      { c: 'A different trial entirely: Robin\'s apprentice test rewards a different, research-shaped rigor.', p: { research: 'lit' } },
      { c: '"I don\'t know yet — here is exactly the evidence that would tell us" beats a confident, unverified claim.', p: { honest: 'good' } }
    ]
  },
  tech: [
    {
      q: 'Precisely, why does an interviewer prefer a candidate who states assumptions and asks clarifying questions over one who immediately proposes a specific architecture?',
      a: 'A system design prompt is deliberately underspecified because real engineering problems ARE underspecified — the actual constraints (scale, latency budget, cost of different error types, what "success" means to the business) are never fully known upfront in real work either, and a senior engineer\'s first move is always to establish them, not guess. A candidate who immediately proposes a specific architecture without clarifying is implicitly making a large number of unstated assumptions, and the interviewer has no way to distinguish "this candidate made good, reasonable assumptions and just didn\'t say so" from "this candidate didn\'t consider that these constraints matter at all" — the SILENCE is the actual problem, not necessarily the eventual answer. A candidate who explicitly clarifies (or explicitly states an assumption when a question is unanswerable — "I\'ll assume this needs to run under 200ms since it\'s presumably a synchronous user-facing decision") gives the interviewer direct, gradeable evidence that the relevant constraints were actually considered, which is precisely the signal a system design round exists to extract — the specific final architecture is almost secondary to demonstrating that this reasoning process happened at all.'
    },
    {
      q: 'Explain precisely how to connect an offline ML metric to an online business metric in a system design answer, using the fraud-detection example.',
      a: 'The offline metric (say, precision and recall on a held-out labeled fraud dataset — the model-evaluation lesson\'s tools) is a PROXY, not the actual goal — the actual goal is minimizing the payments platform\'s real financial and trust costs. The connection requires two explicit moves. First, translate the confusion matrix into COST terms: a false positive (blocking a legitimate transaction) has a specific cost — lost revenue on that transaction, plus a harder-to-quantify trust/churn cost from a frustrated customer — while a false negative (missing actual fraud) has a different specific cost — the fraud loss itself, plus potential chargeback fees. The classifier\'s decision THRESHOLD should be chosen to minimize expected TOTAL cost given these two cost rates, not to maximize a threshold-agnostic metric like AUC or an arbitrary F1 balance — this is the fraud-detection lab\'s exact calculation. Second, explicitly propose HOW to validate that the offline-optimized threshold actually achieves the intended online outcome once deployed — an A/B test or staged rollout comparing actual fraud losses and false-positive-driven customer complaints against the offline predictions, since an offline evaluation set can itself be an imperfect proxy for live traffic (label delay, distribution shift, adversarial adaptation by fraudsters specifically targeting the new model). Stating both the cost translation AND the online validation plan, rather than stopping at "we\'ll pick a good F1 threshold," is exactly the depth that separates a strong system design answer from a superficial one.'
    },
    {
      q: 'Walk through why "start with the simplest baseline" is a genuinely strong system design answer rather than just a hedge or a way to avoid committing to a real design.',
      a: 'Starting with the simplest plausible approach — a rule-based heuristic, or classical ML like logistic regression, before reaching for a large neural model or an LLM — serves several concrete engineering purposes that a system design interview specifically rewards recognizing. It establishes a MEASURABLE baseline: without knowing what a simple approach achieves, there\'s no way to know whether a more complex approach\'s added cost and complexity is actually buying meaningful improvement, or just adding risk and maintenance burden for a marginal gain (directly the using-models-apis lesson\'s "benchmark the cheap option before committing to the expensive one" discipline). It surfaces DATA and LABELING problems early and cheaply — a simple model trains fast and fails informatively, revealing issues (label noise, missing features, unexpected class imbalance) far more cheaply than discovering the same problems after investing in a complex pipeline. It gives a concrete, specific LIMITATION to justify escalating from — "logistic regression achieves X, but specifically struggles with Y pattern, which motivates trying an approach that captures Y" is a far stronger, more gradeable answer than "let\'s use the fanciest available model because it\'s presumably better." Proposing complexity without first establishing this baseline and this specific justification is precisely the "defaulting to the most sophisticated-sounding option" anti-pattern the using-models-apis lesson warned against, now showing up as an interview red flag rather than just a production cost mistake.'
    },
    {
      q: 'What specifically changes between a production system design answer and a research conversation answer for a similar underlying topic, and why does confidently asserting an untested claim work against a candidate in the research context?',
      a: 'A production system design answer is graded on whether the proposed system would reliably WORK at the stated scale and constraints — confidence in a well-reasoned, defensible design (even if not objectively optimal) reads as a strength, because production engineering rewards decisive, well-justified action under real deadlines and real constraints. A research conversation is graded on a different axis: whether the candidate has correctly identified a genuinely OPEN question (not already solved by existing work — the equivalent of the "start simple" principle, now meaning "know what\'s already been tried and where it specifically falls short"), proposed a hypothesis specific and testable enough that an experiment could actually PROVE IT WRONG, and can honestly characterize the limits of what they currently know versus what they\'re merely hoping is true. Confidently asserting an untested claim works against a candidate here specifically because research fundamentally deals in claims that have NOT yet been empirically validated — the entire discipline\'s rigor comes from designing experiments precisely because intuition and confidence are known to be unreliable predictors of what will actually turn out to be true (a theme running throughout this course\'s model-evaluation lesson, now applied to evaluating claims about the world rather than model outputs specifically). A candidate who says "here\'s my hypothesis, and here specifically is the experiment that would tell us if I\'m wrong" is demonstrating the exact scientific discipline the role requires; a candidate who instead asserts confident certainty about an unverified idea is demonstrating the opposite of that discipline, regardless of how correct they might eventually turn out to be.'
    }
  ],
  code: {
    title: 'From the framework to a defensible answer, in outline',
    intro: 'A compressed worked outline for "design a system to detect fraudulent transactions" — the actual shape a strong verbal answer takes, stage by stage.',
    code: `# 1. CLARIFY
#    - Synchronous decision at checkout, or async batch review?
#    - What happens on a flag: hard block, or route to human review?
#    - Assume: synchronous, tight latency budget, borderline cases go to review queue.

# 2. METRICS
#    Offline:  precision/recall on held-out labeled transactions (model-evaluation lesson)
#    Online:   $ fraud losses prevented, $ lost to false-positive-blocked legitimate transactions
#    Bridge:   choose decision threshold to minimize EXPECTED COST, not raw F1
#              expected_cost(threshold) = FP(threshold)*cost_fp + FN(threshold)*cost_fn

# 3. DATA
#    - Historical labeled transactions -- BUT fraud labels arrive with DELAY (weeks).
#    - Leakage risk: never use features only known AFTER the transaction cleared.
#    - Split by TIME, not randomly (model-evaluation lesson's discipline).

# 4. APPROACH -- start simple, escalate with justification
#    v0: rule-based heuristics (velocity checks, amount thresholds) -- ships in days, sets a floor.
#    v1: logistic regression on engineered features -- fast, interpretable, a real baseline.
#    v2: gradient-boosted trees or a small neural model -- ONLY if v1's specific failure
#        pattern (e.g. missing non-linear interaction effects) justifies the added complexity.

# 5. SERVING
#    - Sub-100ms scoring at checkout -> model must be small enough for synchronous inference.
#    - Feature computation (velocity, recent history) needs a low-latency feature store.

# 6. MONITOR & ITERATE
#    - Borderline scores -> human review queue, not auto-block (a cost-aware middle ground,
#      and an early instance of the action-guardrail pattern from agent-memory-eval-safety).
#    - Retrain on a rolling window -- fraud is ADVERSARIAL and adapts to defeat the current model.
#    - A/B test any new model version against the live one before full rollout.`,
    notes: [
      'Every stage names the SPECIFIC course concept it draws on — that\'s deliberate: a strong interview answer sounds like this, citing real trade-offs by name rather than vague gestures at "using machine learning."',
      'Notice v0 is a RULE-BASED heuristic, not even classical ML — "simplest that could plausibly work" sometimes means no model at all, and saying so explicitly is a strong signal, not a weak one.',
      'The expected_cost formula in stage 2 is exactly what this lesson\'s lab implements — the bridge between an offline confusion matrix and a real business decision.',
      'This entire outline is roughly what a strong 3-4 minute verbal answer sounds like before diving into any one stage\'s detail — practice compressing to this shape first, then let the interviewer\'s follow-up questions pull you deeper into whichever stage they care most about.'
    ]
  },
  lab: {
    title: 'The system-design toolkit: cost-based thresholds and tier selection',
    prompt: 'Pure Python, fully runnable. Implement (1) <code>expected_cost(tp, fp, fn, tn, cost_fp, cost_fn)</code> — total expected cost of a classifier\'s confusion matrix, given the dollar cost of a false positive and a false negative (true positives and true negatives cost 0 in this simplified model); (2) <code>best_threshold(candidates, cost_fp, cost_fn)</code> — candidates is a list of dicts like {"threshold": 0.5, "tp":.., "fp":.., "fn":.., "tn":..}; return the threshold value with the LOWEST expected cost; (3) <code>recommend_tier(is_high_stakes, has_labeled_data, latency_budget_ms)</code> — return "rule_based_heuristic", "classical_ml", "fine_tuned_small_model", or "frontier_api_or_rag" using simple, defensible rules (e.g. a very tight latency budget rules out a large model regardless of stakes).',
    starter: `def expected_cost(tp, fp, fn, tn, cost_fp, cost_fn):
    # true positives and true negatives cost 0 here (a simplified model)
    ...

def best_threshold(candidates, cost_fp, cost_fn):
    # candidates: list of {"threshold":.., "tp":.., "fp":.., "fn":.., "tn":..}
    # return the threshold VALUE (not the whole dict) with lowest expected_cost
    ...

def recommend_tier(is_high_stakes, has_labeled_data, latency_budget_ms):
    # Return one of: "rule_based_heuristic", "classical_ml",
    #                "fine_tuned_small_model", "frontier_api_or_rag"
    # Rule of thumb: a very tight latency budget (<50ms) rules out large models entirely.
    # No labeled data yet -> start with a rule-based heuristic regardless of stakes.
    # High stakes + enough latency budget + labeled data -> a fine-tuned small model.
    # Otherwise, a frontier API/RAG approach is a reasonable default.
    ...`,
    checks: [
      { re: 'def\\s+expected_cost\\s*\\(', must: true, hint: 'Define expected_cost(tp, fp, fn, tn, cost_fp, cost_fn).', pass: 'expected_cost() defined' },
      { re: 'def\\s+best_threshold\\s*\\(', must: true, hint: 'Define best_threshold(candidates, cost_fp, cost_fn) returning the best threshold VALUE.', pass: 'best_threshold() defined' },
      { re: 'def\\s+recommend_tier\\s*\\(', must: true, hint: 'Define recommend_tier(is_high_stakes, has_labeled_data, latency_budget_ms).', pass: 'recommend_tier() defined' },
      { re: 'cost_fp|cost_fn', must: true, hint: 'expected_cost must actually use cost_fp and cost_fn in its calculation.', pass: 'cost weighting present' }
    ],
    tests: `# expected_cost: only FP and FN carry cost
assert expected_cost(tp=90, fp=5, fn=5, tn=900, cost_fp=10, cost_fn=100) == 5*10 + 5*100

# best_threshold: picks the threshold minimizing TOTAL expected cost, not raw accuracy
candidates = [
    {"threshold": 0.3, "tp": 95, "fp": 20, "fn": 5,  "tn": 880},   # catches more fraud, more false alarms
    {"threshold": 0.7, "tp": 60, "fp": 2,  "fn": 40, "tn": 898},   # fewer false alarms, misses more fraud
]
# fraud (false negative) is expensive, false alarms are cheap -> low threshold should win
best = best_threshold(candidates, cost_fp=10, cost_fn=200)
assert best == 0.3, f"expected the low threshold to win when FN is expensive, got {best}"

# flip the costs: expensive false alarms, cheap fraud losses -> high threshold should win
best2 = best_threshold(candidates, cost_fp=500, cost_fn=10)
assert best2 == 0.7, f"expected the high threshold to win when FP is expensive, got {best2}"

# recommend_tier: sensible, defensible rules
assert recommend_tier(is_high_stakes=True, has_labeled_data=False, latency_budget_ms=1000) == "rule_based_heuristic"
assert recommend_tier(is_high_stakes=True, has_labeled_data=True, latency_budget_ms=30) != "frontier_api_or_rag"
assert recommend_tier(is_high_stakes=True, has_labeled_data=True, latency_budget_ms=500) == "fine_tuned_small_model"
print("Cost-based thresholds + tier selection. The framework's math, made concrete and testable.")`,
    runnable: true,
    solution: `def expected_cost(tp, fp, fn, tn, cost_fp, cost_fn):
    return fp * cost_fp + fn * cost_fn

def best_threshold(candidates, cost_fp, cost_fn):
    scored = [(c["threshold"], expected_cost(c["tp"], c["fp"], c["fn"], c["tn"], cost_fp, cost_fn)) for c in candidates]
    scored.sort(key=lambda pair: pair[1])
    return scored[0][0]

def recommend_tier(is_high_stakes, has_labeled_data, latency_budget_ms):
    if not has_labeled_data:
        return "rule_based_heuristic"
    if latency_budget_ms < 50:
        return "classical_ml"
    if is_high_stakes:
        return "fine_tuned_small_model"
    return "frontier_api_or_rag"`,
    notes: [
      'The two best_threshold tests with FLIPPED costs and the SAME candidate thresholds proving opposite winners is the whole "offline metric is a proxy, the real decision is cost-based" argument, made numerically undeniable.',
      'recommend_tier deliberately mirrors real interview reasoning: no labeled data yet overrides everything else (you cannot fine-tune or even properly validate classical ML without it); a hard latency floor overrides stakes (an unusably slow "best" model helps nobody).',
      'None of these functions are trying to be a universal, production-grade decision engine — they\'re a compressed, defensible, EXPLAINABLE version of the reasoning a strong interview answer walks through out loud, which is the actual point of this lesson.'
    ]
  },
  quiz: [
    {
      q: 'What is the single most common failure mode in ML/LLM system design interviews?',
      options: ['Silently jumping to a specific architecture without asking clarifying questions or stating assumptions, giving the interviewer no visibility into the reasoning process', 'Choosing a technically suboptimal but well-justified architecture', 'Spending too much time on the data stage of the framework', 'Proposing a simple baseline before a complex model'],
      correct: 0,
      explain: 'A defensible, clearly-reasoned answer beats a "correct" answer arrived at silently — the interviewer can only evaluate reasoning that was actually stated out loud.'
    },
    {
      q: 'Why should a fraud-detection system\'s decision threshold be chosen by minimizing expected COST rather than maximizing F1 or accuracy?',
      options: ['False positives and false negatives have genuinely different dollar costs to the business, so the threshold that minimizes total real-world cost is not generally the same threshold that maximizes a cost-agnostic statistical metric', 'F1 score cannot be computed for imbalanced datasets', 'Cost-based thresholds are always mathematically identical to F1-optimal thresholds', 'Accuracy is not a valid metric for any classification problem'],
      correct: 0,
      explain: 'The offline metric is a proxy; the real decision should weight errors by their actual business cost, which F1/accuracy do not account for by default.'
    },
    {
      q: 'Why is proposing the simplest plausible approach first a strong system design answer rather than a weak or evasive one?',
      options: ['It establishes a measurable baseline to justify escalation against, surfaces data/labeling problems cheaply and early, and gives a specific, gradeable reason for any added complexity', 'It signals the candidate does not know how to build a sophisticated system', 'Simple approaches are always sufficient and complex approaches are never justified', 'Interviewers specifically penalize candidates who mention simple baselines'],
      correct: 0,
      explain: 'Without a baseline, there is no way to know whether added complexity is buying real improvement — and a baseline\'s specific failure pattern is exactly what justifies escalating.'
    },
    {
      q: 'In the RAG support chatbot design example, why is fine-tuning explicitly NOT the recommended approach for teaching the model the documentation content?',
      options: ['Fine-tuning is unreliable for injecting specific, frequently-changing facts, and documentation changes too often to bake into weights reliably — RAG keeps the model\'s access to the docs current without retraining', 'Fine-tuning is always more expensive than RAG regardless of use case', 'RAG and fine-tuning cannot be used in the same system', 'Fine-tuning cannot be applied to any customer-support use case'],
      correct: 0,
      explain: 'The fine-tuning-lora lesson\'s rule directly applied: fine-tune for behavior, retrieve for knowledge — documentation is exactly the frequently-changing knowledge RAG is suited for.'
    },
    {
      q: 'What is the key difference between what a production system design interview rewards and what a research conversation rewards?',
      options: ['Production design rewards a confident, well-justified, defensible design under real constraints; research conversations reward honest awareness of what is NOT yet known and a genuinely testable, falsifiable hypothesis', 'Research conversations reward the same confident architectural decisiveness as production design interviews', 'Production interviews never involve discussing trade-offs', 'Research conversations do not require any awareness of existing prior work'],
      correct: 0,
      explain: 'Confidently asserting an untested claim works AGAINST a candidate in a research context specifically because the discipline is built around designing experiments to test claims that intuition alone cannot reliably validate.'
    }
  ],
  pitfalls: [
    'Diving straight into a specific architecture without first clarifying scale, latency, cost constraints, and what "success" means — the single most common and most avoidable system design interview mistake.',
    'Stopping at an offline ML metric ("we\'d optimize for F1") without connecting it to the actual business cost of different error types or proposing how to validate the offline metric against real online outcomes.',
    'Proposing the most sophisticated-sounding approach first "to show technical depth," rather than starting simple and justifying escalation against a concrete limitation — this reads as poor engineering judgment, not impressive technical range.',
    'Presenting a v1 design as finished, with no discussion of monitoring, drift, feedback loops, or how a v2 would be safely tested and rolled out — real systems are never "done," and interviewers listen for this explicitly.',
    'Treating an LLM-based system design prompt as fundamentally different from a classical ML one rather than recognizing it uses the SAME six-stage framework, just with LLM-specific tools (RAG, fine-tuning, agents, model tiers) slotted into the "approach" stage.',
    'Bringing production-system confidence and decisiveness into a research conversation, or bringing research-style hedging and open-endedness into a production system design interview — knowing which mode a given conversation calls for, and switching deliberately, is itself part of the skill.'
  ],
  interview: [
    {
      q: '"Design a system to detect fraudulent transactions on a payments platform." Walk me through your approach.',
      a: 'I\'d start by clarifying: is this a synchronous decision at checkout, or an async review process — I\'ll assume synchronous, since that\'s the harder and more common version, meaning we have a tight latency budget. What happens when something\'s flagged — hard block or route to human review? I\'ll assume borderline cases route to review rather than auto-blocking, since false positives have a real cost in lost revenue and customer trust. For metrics: offline, precision and recall on historical labeled transactions; but the real decision should minimize EXPECTED COST — false positives and false negatives have different dollar costs here (a blocked legitimate purchase versus an actual fraud loss), so I\'d choose the operating threshold to minimize total expected cost, not just optimize F1, and validate that choice with an online A/B test before full rollout. For data: historical labeled transactions, but fraud labels arrive with real delay after the transaction — a genuine leakage risk if not handled carefully, and I\'d split by time, not randomly, to simulate real deployment conditions. For approach: start with rule-based heuristics and a logistic regression baseline on engineered features — transaction velocity, amount, merchant category — before justifying a move to gradient-boosted trees or a neural approach against a SPECIFIC limitation the baseline shows. Serving needs to fit a sub-100ms budget, ruling out anything too large for synchronous scoring. And critically, this isn\'t a one-time build: fraud is adversarial and adapts specifically to defeat whatever the current model catches, so I\'d plan for a rolling retraining window and continuous monitoring for drift, not a static, unchanging model.'
    },
    {
      q: '"Design a customer support chatbot that answers questions from our internal documentation and can escalate complex issues." Walk me through your approach.',
      a: 'Clarifying first: what\'s an acceptable rate of confidently-wrong answers — I\'d expect a much stricter bar for something like billing than for general how-to questions — and does "escalate" mean handing off to a human, or the agent taking autonomous actions like issuing a refund; I\'d assume the latter needs a human-approval gate regardless of the model\'s apparent confidence, given how consequential and hard to reverse it is. For the core architecture, I\'d use retrieval-augmented generation over the documentation rather than fine-tuning the model to memorize it — documentation changes too often and too specifically for fine-tuning to reliably track, while RAG stays current by construction as long as the underlying index is refreshed. I\'d evaluate this in two separate pieces: retrieval quality via recall@k against a labeled set of realistic questions and known-correct source passages, and generation faithfulness — does the answer actually reflect what was retrieved, since these are genuinely different failure modes needing different fixes. For model tier, I\'d route by task difficulty: a smaller, cheaper model for straightforward lookup-style questions, escalating to a more capable model or an actual tool-using agent for multi-step troubleshooting. For the escalation path specifically, I\'d build it as an agent with a scoped toolset, using the ReAct loop with explicit stuck-loop detection and a hard step cap, and any consequential action gated behind human approval before execution — never fully autonomous, regardless of confidence. Given the system ingests retrieved and possibly user-submitted content into its context, I\'d also treat that content as untrusted and specifically test for prompt injection as part of the evaluation, since that\'s a real, agent-specific attack surface here. And I\'d combine scalable LLM-as-judge evaluation with periodic human audits of a sample, since an unaudited judge can develop its own systematic blind spots.'
    },
    {
      q: 'How would your answer change if this were a research-track interview asking you to propose a research direction, rather than a production system design question?',
      a: 'The framework shifts from "will this ship and work reliably at scale" to "is this a genuinely open, well-motivated question with a testable answer." I\'d start by motivating WHY the problem matters — not just that it\'s technically interesting, but what understanding or capability gap it would actually close, and for whom. I\'d then show awareness of what\'s already been tried and specifically where it falls short — the research equivalent of starting with a simple baseline, except here the "baseline" is the current best-known approach in the literature, and my proposal needs to be justified against its specific, known limitation rather than proposed in a vacuum. I\'d state a genuinely falsifiable hypothesis — a specific, mechanism-grounded prediction about what my approach should do better and why, not just "try scaling it up" without a reason to expect that specifically helps. I\'d describe a concrete evaluation and ablation plan, including what result would prove the hypothesis WRONG, not just what would confirm it, since a research proposal with no way to fail isn\'t really testable. And critically, I\'d be upfront about limitations and open questions my approach wouldn\'t address — in a research context, honestly saying "I don\'t know yet, and here\'s the specific experiment that would tell us" is a stronger answer than confidently overselling an unvalidated idea, which is close to the opposite of how confidence plays in a production system design round.'
    },
    {
      q: 'An interviewer pushes back on your proposed approach mid-answer, suggesting a completely different architecture. How do you respond?',
      a: 'I treat this as a genuine collaborative signal, not an attack on my original answer — interviewers frequently push back specifically to see how a candidate handles new information and disagreement, which is itself part of what\'s being evaluated. First, I\'d make sure I actually understand the suggested alternative and why they\'re proposing it — asking a clarifying question here is legitimate and useful, not a stall. Then I\'d compare it against my original proposal on the SAME axes the framework already established — does it change the metrics story, the data requirements, the latency/cost trade-off, the complexity-versus-baseline justification — rather than either defensively insisting my original answer was right, or immediately capitulating without actually reasoning through the comparison. If their suggestion is genuinely better on the constraints we established, I\'d say so directly and explain specifically why, which demonstrates I\'m evaluating ideas on their merits rather than being attached to my first answer. If I think my original approach still holds up better given the stated constraints, I\'d explain the specific trade-off I think their suggestion misses — respectfully, with the reasoning made explicit, not just repeating my original claim more insistently. The actual skill being tested here isn\'t "was your first answer right" — it\'s whether you can reason in real time, update cleanly when new information genuinely warrants it, and hold your ground with actual justification when it doesn\'t, which is exactly the kind of technical disagreement real engineering and research work involves constantly.'
    }
  ]
};
