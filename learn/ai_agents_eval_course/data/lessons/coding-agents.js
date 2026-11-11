window.LESSONS = window.LESSONS || {};
window.LESSONS['coding-agents'] = {
  id: 'coding-agents',
  title: 'Coding Agents: SWE-agent, Agentless, Sandboxes & LLM Program Repair',
  category: 'Part 1 — Building Agents & Workflows',
  timeMin: 50,
  summary: `Coding agents are where agent design meets software engineering research, and where your own background (flaky tests, test repair, test coverage of agentic pull requests) is a direct asset. This lesson covers the task format that defines the field (SWE-bench: a real issue, a repository snapshot, and FAIL_TO_PASS / PASS_TO_PASS tests), the three reference designs (SWE-agent's agent-computer interface, Agentless's fixed localize, repair, validate pipeline, and OpenHands' code-as-action agents in sandboxed runtimes), how to sandbox execution with Docker, and why test-based validation is both the strongest signal available and a trap: plausible patches overfit tests, agents can edit the oracle, and flaky tests turn validation into noise. The worked example runs a miniature Agentless pipeline end to end with real test execution.`,
  goals: [
    'Describe the SWE-bench task format and what FAIL_TO_PASS and PASS_TO_PASS tests mean for a patch',
    'Explain SWE-agent\'s agent-computer interface design choices, Agentless\'s localize, repair, validate pipeline, and OpenHands\' CodeAct runtime, with their tradeoffs',
    'Build a sandbox for running model-written code and tests: container isolation, no network, resource limits, timeouts',
    'Implement test-based patch validation with reruns, test-edit rejection and patch deduplication',
    'Connect LLM program repair to classic APR results (plausible versus correct patches, overfitting) and to flaky tests and test repair'
  ],
  concept: [
    {
      h: 'The task: issue in, patch out, tests decide',
      p: [
        `SWE-bench (Jimenez et al., ICLR 2024) built 2,294 task instances from real GitHub issues and the pull requests that resolved them across 12 popular Python repositories. The agent gets the issue text and the repository at the parent commit, and must produce a patch. Grading applies the patch and runs two sets of tests from the original PR: <b>FAIL_TO_PASS</b> tests, which failed before the fix and must pass after (they encode the issue), and <b>PASS_TO_PASS</b> tests, which passed before and must still pass (regressions). The agent never sees the FAIL_TO_PASS tests.`,
        `Variants matter in interviews: SWE-bench Lite is a 300-instance subset of more self-contained issues; SWE-bench Verified is a 500-instance subset that human annotators checked for well-specified issues and fair tests (released with OpenAI in 2024), because some original instances were unsolvable or had tests that rejected valid fixes. The benchmark-landscape lesson covers contamination and the newer variants.`,
        `This format generalizes to any repair setting you build: a natural-language problem, an executable environment, hidden tests that check the fix, and visible tests that guard against breakage.`
      ]
    },
    {
      h: 'SWE-agent: design the interface for the model',
      p: [
        `SWE-agent (Yang et al., NeurIPS 2024) argued that an agent's performance depends heavily on its <b>agent-computer interface (ACI)</b>, the commands and feedback formats it works through, just as human productivity depends on IDEs. Instead of a raw shell, it gave the model a small command set: a file viewer that shows a window of about 100 lines with line numbers and supports scrolling and jumping (<code>open</code>, <code>goto</code>, <code>scroll_up</code>/<code>scroll_down</code>), search commands that return concise summaries (<code>find_file</code>, <code>search_file</code>, <code>search_dir</code>), and an <code>edit</code> command that replaces a line range and runs a linter, rejecting edits that introduce syntax errors and showing the model why.`,
        `The lessons carry over to any agent tool design: keep observations short and informative, say explicitly when a command produced no output, prevent common irrecoverable mistakes at the interface (a broken edit that cascades), and show context after an edit so the model sees what it did. These are the same principles as the tool-description advice in the agent-loop lesson, measured on a hard benchmark.`
      ]
    },
    {
      h: 'Agentless: a fixed pipeline that competes with agents',
      p: [
        `Agentless (Xia et al., 2024) asked whether autonomy is needed at all. Its pipeline has no agent loop: <b>localize</b> hierarchically (the LLM picks suspicious files from the repository structure, then classes and functions from skeletons of those files, then specific edit locations, combined with embedding retrieval), <b>repair</b> by sampling multiple candidate patches as simple search/replace edits at those locations, and <b>validate</b> by generating a reproduction test for the issue, running it and the existing regression tests on each candidate, and selecting among survivors by majority vote over normalized patches. At release it was competitive with open-source agents on SWE-bench Lite at a fraction of the cost.`,
        `The takeaway is the workflows-versus-agents lesson in a concrete domain: when the task has a known shape, a pipeline with strong validation is cheaper, more predictable and easier to analyze than an agent. Many production systems mix both: an agent for exploration, then Agentless-style sampling and test-based selection.`,
        `AutoCodeRover (Zhang et al., ISSTA 2024) is a related design that adds program-structure-aware search (class and method lookups over the AST) and spectrum-based fault localization from test execution, a nice bridge to classic fault localization research.`
      ]
    },
    {
      h: 'OpenHands and sandboxed runtimes',
      p: [
        `OpenHands (formerly OpenDevin) is an open platform whose default agent follows <b>CodeAct</b> (Wang et al., 2024): actions are executable code, bash commands or Python, rather than JSON tool calls, executed in a sandboxed Docker runtime, with an event stream recording every action and observation. Code as action lets the model compose operations (loops, conditionals, library calls) in one step. Commercial coding agents such as Claude Code follow a similar shape: a general shell plus file read, edit and search tools in a permissioned environment.`,
        `Whatever the agent design, model-written code and tests must run in isolation. A container per task with no network by default (or an egress allowlist for package mirrors), CPU, memory and process limits, a hard timeout, a non-root user, dropped capabilities, and a disposable copy of the repository. Reset to a clean snapshot for every candidate patch so one candidate cannot contaminate the next. SWE-bench's own harness builds per-repository Docker images for the same reason: reproducible environments are half of a reproducible benchmark.`
      ],
      code: "import subprocess\n\n\ndef run_in_sandbox(repo_dir, cmd, image=\"python:3.11-slim\", timeout_s=600):\n    \"\"\"Run an untrusted command (tests, a model-written script) in a locked-down container.\"\"\"\n    docker = [\n        \"docker\", \"run\", \"--rm\",\n        \"--network\", \"none\",                      # no exfiltration, no pip install at test time\n        \"--memory\", \"2g\", \"--cpus\", \"2\", \"--pids-limit\", \"512\",\n        \"--cap-drop\", \"ALL\", \"--security-opt\", \"no-new-privileges\",\n        \"--user\", \"1000:1000\",\n        \"-v\", f\"{repo_dir}:/work\", \"-w\", \"/work\",\n        image, \"timeout\", str(timeout_s), *cmd,\n    ]\n    proc = subprocess.run(docker, capture_output=True, text=True, timeout=timeout_s + 30)\n    return proc.returncode, proc.stdout[-20_000:], proc.stderr[-20_000:]   # keep tails for the model\n\n\n# e.g. run_in_sandbox(\"/tmp/cand_123\", [\"python\", \"-m\", \"pytest\", \"-q\", \"-x\", \"tests/test_cart.py\"])\n"
    },
    {
      h: 'Tests as the oracle, and how they lie',
      p: [
        `Executable tests are the best verifier coding agents have, which is why best-of-n sampling with test-based selection works so well. But three failure modes matter. <b>Overfitting:</b> classic automated program repair research showed many test-passing ("plausible") patches are not correct, they satisfy weak tests while breaking unspecified behaviour (Smith et al., 2015, "Is the cure worse than the disease?"; Qi et al.'s analysis of GenProg patches). LLM patches inherit the problem: passing visible tests is necessary, not sufficient. <b>Oracle tampering:</b> an agent allowed to edit tests can make them pass by weakening assertions, deleting tests, or special-casing inputs; validation pipelines must detect or forbid test edits and review diffs to test files separately. <b>Flakiness:</b> a test that fails nondeterministically makes a correct patch look wrong and a wrong patch look right, so validation reruns tests, classifies outcomes as pass, fail or flaky, and treats flaky as not validated.`,
        `This is exactly your research area. Timing-dependent flaky failures (the subject of TDRepro) are common in exactly the async and I/O code agents touch, and a validation harness that runs each test once will mislabel them. Test repair, fixing tests broken by legitimate code evolution, is the mirror image of program repair: the agent must decide whether the code or the test is wrong, which is an oracle problem, and the answer cannot come from the failing test alone. And coverage of agent-written changes (as in your ICSME work on agentic pull requests) is a direct measure of how much of a patch the validating tests actually exercise.`
      ]
    }
  ],
  deepDive: {
    timeMin: 18,
    intro: 'Localization as retrieval, patch formats, reproduction tests, what makes evaluation of coding agents hard, and the LLM program-repair literature.',
    sections: [
      {
        h: 'Localization is the bottleneck',
        p: [
          `If the agent edits the wrong file, nothing downstream helps. Signals, roughly from cheapest: lexical search for identifiers and error messages from the issue (stack traces name files and lines), repository structure and file skeletons for the model to choose from, embedding retrieval over code chunks, static structure (call graphs, imports, class hierarchies), and dynamic signals: run the reproduction test and use coverage or spectrum-based fault localization (Ochiai, Tarantula) to rank statements executed by failing but not passing tests. Measure localization separately: file-level and function-level recall@k against the lines the gold patch touched, exactly the retrieval metrics from the RAG lesson.`
        ]
      },
      {
        h: 'Patch formats and edit reliability',
        p: [
          `Models produce edits as whole-file rewrites (simple, expensive, risky for large files), unified diffs (compact, but models often get line numbers and hunk headers wrong), line-range replacements (SWE-agent's <code>edit</code>), or search/replace blocks that quote the exact old text (Agentless and many coding tools). Search/replace is robust because it anchors on content, not line numbers: require the search text to match exactly once, and fail loudly on zero matches (stale context) or several (ambiguous). Then lint or parse the file before accepting the edit, as SWE-agent's linter gate does.`
        ]
      },
      {
        h: 'Reproduction tests',
        p: [
          `Since hidden tests are unavailable at inference time, strong pipelines write their own: generate a test that reproduces the issue, check it fails on the original code (otherwise it does not capture the bug), and use it to filter candidate patches. The same idea underlies test generation for issue reproduction as a research task of its own. Watch for reproduction tests that encode the model's misunderstanding of the issue, which then select wrong patches with confidence, and for reproduction tests that are themselves flaky.`
        ]
      },
      {
        h: 'Evaluating coding agents honestly',
        p: [
          `Report resolve rate with the exact benchmark variant, model, scaffold version, number of attempts (pass@1 versus best-of-n with or without hidden-test access) and cost per instance. Rerun to estimate variance, since agent runs are stochastic and a few instances can swing a leaderboard position. Check for contamination (issues and fixes predating the model's training cutoff) and for environment flakiness in the harness itself. Beyond resolve rate: patch size, test-file edits, regressions on PASS_TO_PASS, and human review of a sample of "resolved" patches for correctness and maintainability. Part 3 builds this harness.`
        ]
      },
      {
        h: 'LLM program repair, briefly',
        p: [
          `Classic APR searched over mutations (GenProg) or templates and validated with tests, and learned the overfitting lesson the hard way. Early LLM work used code models to fill in masked buggy lines; conversational repair (for example ChatRepair, Xia and Zhang 2023) fed test failure messages back to the model across turns, cheaply fixing many Defects4J bugs. Agentic repair adds exploration and execution. The constants across all generations: fault localization quality bounds repair, validation quality bounds trust, and patch correctness needs more than the tests that guided the search.`
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: 'Franky Repairs the Sunny After a Storm',
      text: [
        `A crew report says "the ship pulls left and takes on water near the galley". Franky does not rebuild the ship. He first finds where: which deck, then which compartment, then which plank, using the report, the sound of the leak, and where the floor is wet. Then he cuts three candidate patches, fits each one to a copy of the hull section in the Soldier Dock, and floods the test tank.`,
        `One patch leaks. One "passes" only because Usopp, eager to help, lowered the water mark painted on the tank wall. Franky throws that one out on principle: you do not repair the gauge to fix the ship. The third holds. A fourth looks different but is the same cut turned around, so he counts it as the same patch. And when the tank sometimes reads "leak" because a wave from the harbour sloshes over the edge, Franky floods it three times before believing any verdict, and treats an inconsistent result as "unknown", not "pass".`,
        `He also does all of this in the dock, never on the open sea with the crew aboard.`
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Howard Fixes the Mars Rover Bug',
      text: [
        `NASA reports that a rover arm overshoots its target. Howard narrows it down from subsystem to module to function, then writes three fixes and tests each one in the simulator, never on the real rover. Raj suggests a fourth fix: change the simulator's expected position. Sheldon points out that this does not fix the arm, it fixes the exam.`,
        `When a simulator run fails once and passes twice, Howard reruns it ten times before trusting anything; Leonard notes the simulator has a timing bug of its own. Two of Howard's fixes pass every run, and Sheldon declares them identical apart from whitespace, "which, unlike me, is meaningless".`
      ]
    },
    why: 'Narrowing deck, compartment, plank (or subsystem, module, function) is hierarchical fault localization. Several candidate patches tested on copies are sampled repairs validated in a sandbox, the dock or simulator, never production. Lowering the water mark or editing the expected position is oracle tampering, rejected by policy. The sloshing harbour wave and the simulator timing bug are flaky tests, handled by reruns and an "unknown" verdict. Counting the turned-around cut and the whitespace-only difference as one patch is Agentless-style normalization before voting.'
  },
  storyAnim: {
    title: 'Localize, repair, validate in the dock',
    h: 270,
    props: [
      { id: 'report', emoji: '📨', label: 'issue: pulls left, leaks', x: 12, y: 18 },
      { id: 'locate', emoji: '🔦', label: 'deck > compartment > plank', x: 38, y: 18 },
      { id: 'patches', emoji: '🪚', label: '3 candidate patches', x: 64, y: 18 },
      { id: 'tank', emoji: '🛁', label: 'test tank in the dock (sandbox)', x: 88, y: 18 },
      { id: 'gauge', emoji: '📏', label: 'lowered water mark (test edit)', x: 64, y: 58 },
      { id: 'wave', emoji: '🌊', label: 'harbour wave: flaky reading', x: 88, y: 58 },
      { id: 'hold', emoji: '✅', label: 'patch holds every run', x: 38, y: 58 }
    ],
    actors: [
      { id: 'franky', emoji: '🦾', label: 'Franky', x: 20, y: 82 },
      { id: 'usopp', emoji: '🤥', label: 'Usopp', x: 75, y: 85 }
    ],
    steps: [
      { c: 'The report arrives. Franky does not rebuild the ship; he first finds where the problem is.', p: { report: 'lit' } },
      { c: 'Deck, then compartment, then plank: localization narrows step by step.', p: { locate: 'good' }, a: { franky: [38, 40] } },
      { c: 'He cuts three candidate patches and fits each to a copy of the hull in the dock, never on the open sea.', p: { patches: 'lit', tank: 'lit' }, a: { franky: [72, 40] } },
      { c: 'Usopp lowers the water mark so one patch "passes". Rejected: you do not fix the gauge to fix the ship.', p: { gauge: 'bad' }, a: { usopp: [64, 75] } },
      { c: 'A harbour wave sloshes over the tank edge and one run reads "leak". Franky floods it three times before believing anything.', p: { wave: 'bad' } },
      { c: 'One patch holds on every run. A second, the same cut turned around, counts as the same patch.', p: { hold: 'good', wave: 'dim' }, a: { franky: [38, 75] } }
    ]
  },
  conceptFlow: {
    title: 'An Agentless-style repair pipeline with honest validation',
    intro: 'Click a box or press Play.',
    stages: [
      { label: 'Input', nodes: [
        { id: 'issue', text: 'Issue text + repo snapshot\n(hidden: FAIL_TO_PASS tests)' }
      ] },
      { label: 'Localize', nodes: [
        { id: 'files', text: 'Suspicious files\nlexical + structure + embeddings' },
        { id: 'funcs', text: 'Functions / lines\nskeletons, fault localization' }
      ] },
      { label: 'Repair', nodes: [
        { id: 'sample', text: 'Sample N patches\nsearch/replace edits' },
        { id: 'lint', text: 'Apply + parse/lint\nreject broken edits' }
      ] },
      { label: 'Validate (sandbox)', nodes: [
        { id: 'repro', text: 'Reproduction test\nmust fail before, pass after' },
        { id: 'regress', text: 'Regression tests\nrerun k times: pass/flaky/fail' },
        { id: 'tamper', text: 'Reject test-file edits' }
      ] },
      { label: 'Select', nodes: [
        { id: 'vote', text: 'Normalize (AST) + vote\namong passing patches' }
      ] }
    ],
    steps: [
      { active: ['issue'], note: 'The agent sees the issue and the code. The tests that will grade it are hidden, as in SWE-bench.' },
      { active: ['files'], note: 'Narrow the repository to a few files using names from the issue and stack trace, the repo structure, and retrieval.' },
      { active: ['funcs'], note: 'Narrow further to classes, functions and edit locations, optionally using coverage of a failing reproduction test.' },
      { active: ['sample'], note: 'Sample several candidate patches at those locations as search/replace edits anchored on exact old text.' },
      { active: ['lint'], note: 'Apply each in a fresh copy; reject edits whose search text is missing or ambiguous, or that break parsing.' },
      { active: ['repro', 'tamper'], note: 'In a sandbox, run a reproduction test that failed on the original code. Any candidate that edits tests is rejected outright.' },
      { active: ['regress'], note: 'Run existing tests several times. Only candidates that pass every run count; inconsistent results are flaky, not validated.' },
      { active: ['vote'], note: 'Deduplicate passing patches by normalized AST and pick the most common, a cheap proxy for the most likely correct fix.' }
    ]
  },
  tech: [
    {
      q: 'Why does SWE-bench hide the FAIL_TO_PASS tests from the agent?',
      a: `Because they encode the expected behaviour. With them, an agent could fit the patch to the tests directly (or edit around them), which measures test fitting rather than issue understanding. Hiding them mirrors reality, where the developer has an issue description, not the future test, and forces the agent to infer intent and write its own reproduction.`
    },
    {
      q: 'Why do search/replace edits beat unified diffs for LLM-generated patches?',
      a: `Diffs depend on exact line numbers and hunk headers, which models frequently get wrong, and a misplaced hunk can apply in the wrong place. Search/replace anchors on quoted content: it applies only where the exact old text exists, and an exactly-once rule turns stale or ambiguous edits into clear errors the model can fix.`
    },
    {
      q: 'What does --network none actually protect against in a test sandbox?',
      a: `Exfiltration of code or secrets by model-written or test code, downloading and running arbitrary payloads, accidental calls to production services, and nondeterminism from network-dependent tests. It also forces environments to be built in advance, which makes runs reproducible. If dependencies must be installed during a run, use an egress allowlist to a package mirror rather than open network access.`
    },
    {
      q: 'Is a patch that passes all tests correct?',
      a: `Not necessarily; it is plausible. Tests are a partial specification, and APR research has shown many plausible patches are incorrect or overfitted (for example deleting functionality the tests do not cover). Stronger evidence comes from held-out tests, generated tests that probe the changed behaviour, coverage of the patched lines, differential testing against the original on unaffected inputs, and human review.`
    }
  ],
  code: {
    title: 'A miniature Agentless pipeline with real test execution',
    intro: 'Builds a throwaway repository with a discount bug, confirms the failing tests reproduce the issue, localizes to the file and function from the issue text and stack trace, then validates four scripted candidate patches: one wrong, one that edits the test (rejected), one correct, and one correct but reformatted. Each candidate runs in a fresh copy, three times, as real unittest subprocesses; passing patches are deduplicated by AST.',
    code: "\"\"\"mini_agentless.py - localize -> repair -> validate on a throwaway repo.\nOffline: the \"LLM\" proposes scripted candidate patches (one wrong, one that edits the\ntest to make it pass, one correct). Validation runs real unit tests in subprocesses.\npython3 mini_agentless.py\"\"\"\nimport ast\nimport re\nimport shutil\nimport subprocess\nimport sys\nimport tempfile\nfrom collections import Counter\nfrom pathlib import Path\n\nREPO = {\n    \"shop/cart.py\": '''from shop.pricing import round_money\n\n\ndef total(items, discount=0.0):\n    \"\"\"Sum item prices and apply a fractional discount (0.1 = 10% off).\"\"\"\n    subtotal = sum(price * qty for price, qty in items)\n    return round_money(subtotal * discount)\n''',\n    \"shop/pricing.py\": '''def round_money(x):\n    return round(x + 1e-9, 2)\n''',\n    \"shop/__init__.py\": \"\",\n    \"tests/__init__.py\": \"\",\n    \"tests/test_cart.py\": '''import unittest\nfrom shop.cart import total\n\n\nclass TotalTest(unittest.TestCase):\n    def test_no_discount(self):\n        self.assertEqual(total([(2.50, 2)]), 5.00)\n\n    def test_ten_percent(self):\n        self.assertEqual(total([(10.0, 1)], discount=0.1), 9.00)\n''',\n}\nISSUE = \"\"\"total() returns 0 when no discount is given, and 1.0 instead of 9.0 for a 10% discount.\nTraceback (most recent call last):\n  File \"tests/test_cart.py\", line 7, in test_no_discount\nAssertionError: 0.0 != 5.0\"\"\"\nFAIL_TO_PASS = [\"tests.test_cart.TotalTest.test_no_discount\", \"tests.test_cart.TotalTest.test_ten_percent\"]\nPASS_TO_PASS = []   # in SWE-bench: tests that passed before the fix and must still pass\n\n\ndef make_repo(files):\n    root = Path(tempfile.mkdtemp(prefix=\"repo_\"))\n    for path, text in files.items():\n        (root / path).parent.mkdir(parents=True, exist_ok=True)\n        (root / path).write_text(text)\n    return root\n\n\n# ---------- 1. localize: files, then functions ----------\ndef localize(root, issue, top_files=2):\n    words = set(re.findall(r\"[a-z_]{3,}\", issue.lower()))\n    mentioned = set(re.findall(r\"[\\w/]+\\.py\", issue))\n    scored = []\n    for f in root.rglob(\"*.py\"):\n        rel = str(f.relative_to(root))\n        if rel.startswith(\"tests/\"):\n            continue                                   # repair the code, not the tests\n        text = f.read_text().lower()\n        score = sum(text.count(w) for w in words) + (5 if rel in mentioned else 0)\n        scored.append((score, rel))\n    files = [rel for _, rel in sorted(scored, reverse=True)[:top_files]]\n    funcs = []\n    for rel in files:\n        tree = ast.parse((root / rel).read_text())\n        funcs += [(rel, n.name, n.lineno) for n in ast.walk(tree)\n                  if isinstance(n, ast.FunctionDef) and n.name.lower() in words]\n    return files, funcs\n\n\n# ---------- 2. repair: candidate SEARCH/REPLACE edits (scripted LLM) ----------\nCANDIDATES = [\n    {\"file\": \"shop/cart.py\", \"search\": \"subtotal * discount\", \"replace\": \"subtotal - discount\"},\n    {\"file\": \"tests/test_cart.py\", \"search\": \"5.00)\", \"replace\": \"0.0)\"},          # games the test\n    {\"file\": \"shop/cart.py\", \"search\": \"subtotal * discount\", \"replace\": \"subtotal * (1 - discount)\"},\n    {\"file\": \"shop/cart.py\", \"search\": \"subtotal * discount\",\n     \"replace\": \"subtotal*(1 - discount)\"},                                       # same fix, reformatted\n]\n\n\ndef apply_edit(root, edit):\n    path = root / edit[\"file\"]\n    src = path.read_text()\n    if src.count(edit[\"search\"]) != 1:\n        raise ValueError(f\"search text must match exactly once in {edit['file']}\")\n    path.write_text(src.replace(edit[\"search\"], edit[\"replace\"]))\n\n\n# ---------- 3. validate: run tests in a fresh copy, several times ----------\ndef run_tests(root, test_ids, timeout=60):\n    proc = subprocess.run([sys.executable, \"-m\", \"unittest\", \"-q\", *test_ids], cwd=root,\n                          capture_output=True, text=True, timeout=timeout)\n    return proc.returncode == 0\n\n\ndef validate(base, edit, runs=3):\n    if edit[\"file\"].startswith(\"tests/\"):\n        return \"rejected: edits a test\"                # policy: tests are the oracle\n    work = Path(tempfile.mkdtemp(prefix=\"cand_\"))\n    shutil.copytree(base, work, dirs_exist_ok=True)\n    try:\n        apply_edit(work, edit)\n        outcomes = [run_tests(work, FAIL_TO_PASS + PASS_TO_PASS) for _ in range(runs)]\n    except (ValueError, subprocess.TimeoutExpired) as exc:\n        return f\"error: {exc}\"\n    finally:\n        shutil.rmtree(work)\n    if all(outcomes):\n        return \"pass\"\n    return \"flaky\" if any(outcomes) else \"fail\"\n\n\ndef normalize(code):\n    \"\"\"Agentless-style dedup: compare patches by their AST, not their text.\"\"\"\n    return ast.dump(ast.parse(code))\n\n\nif __name__ == \"__main__\":\n    base = make_repo(REPO)\n    print(\"before fix, failing tests reproduce the issue:\", not run_tests(base, FAIL_TO_PASS))\n    files, funcs = localize(base, ISSUE)\n    print(\"localized files:\", files, \"functions:\", funcs)\n    passing = []\n    for i, edit in enumerate(CANDIDATES):\n        verdict = validate(base, edit)\n        print(f\"candidate {i}: {edit['replace']!r:32} -> {verdict}\")\n        if verdict == \"pass\":\n            passing.append(normalize(edit[\"replace\"]))\n    if passing:\n        votes = Counter(passing)\n        print(f\"{len(passing)} passing candidates, {len(votes)} distinct after AST normalization\")\n    shutil.rmtree(base)\n",
    notes: [
      'Run: <code>python3 mini_agentless.py</code>. Standard library only. Expected: candidate 0 fails, 1 is rejected for editing a test, 2 and 3 pass, and they collapse to one distinct patch after AST normalization.',
      'To make it a real LLM pipeline, replace <code>CANDIDATES</code> with N samples from <code>client.messages.create</code>, prompting with the localized function bodies and asking for search/replace JSON validated against a strict schema.',
      'To make validation real-world safe, swap <code>run_tests</code> for the Docker <code>run_in_sandbox</code> helper in the concept section.',
      'Try making a test flaky (for example <code>import random</code> and fail 30% of the time) and watch the verdict become "flaky" instead of a false pass.'
    ]
  },
  lab: {
    title: 'Safe edits and honest validation',
    prompt: `Implement <code>apply_search_replace</code> (exactly one match, else <code>ValueError</code>), <code>classify(outcomes)</code> returning <code>"pass"</code>, <code>"flaky"</code> or <code>"fail"</code> for repeated runs, and <code>select_patch(candidates, run_tests, runs=5)</code> that skips any candidate touching <code>tests/</code>, runs the others <code>runs</code> times, and returns only the IDs classified <code>"pass"</code>. The asserts include a patch whose tests alternate pass and fail and one that edits a test.`,
    starter: "def apply_search_replace(source, search, replace):\n    \"\"\"Apply one SEARCH/REPLACE edit. The search text must occur exactly once;\n    otherwise raise ValueError (0 matches = stale context, >1 = ambiguous).\"\"\"\n    ...\n\n\n\ndef classify(outcomes):\n    \"\"\"outcomes: list of booleans, one per repeated test run of the same patch.\"\"\"\n    ...\n\n\n\ndef select_patch(candidates, run_tests, runs=5):\n    \"\"\"candidates: list of (patch_id, touched_files). run_tests(patch_id) -> bool.\n    Reject patches that touch tests/, run each remaining patch `runs` times,\n    and return the ids classified \"pass\" (flaky patches are not accepted).\"\"\"\n    ...\n\n\n\nif __name__ == \"__main__\":\n    src = \"x = a * b\\ny = a * b\\n\"\n    assert apply_search_replace(\"total = s * d\\n\", \"s * d\", \"s * (1 - d)\") == \"total = s * (1 - d)\\n\"\n    for bad in (\"a * b\", \"nope\"):\n        try:\n            apply_search_replace(src, bad, \"z\")\n            raise AssertionError(\"must reject ambiguous or missing search text\")\n        except ValueError:\n            pass\n    assert classify([True, True, True]) == \"pass\"\n    assert classify([True, False, True]) == \"flaky\"\n    assert classify([False, False]) == \"fail\"\n\n    import itertools\n    flip = itertools.cycle([True, False])\n    behaviour = {\"p1\": lambda: True, \"p2\": lambda: False, \"p3\": lambda: next(flip), \"p4\": lambda: True}\n    cands = [(\"p1\", [\"src/cart.py\"]), (\"p2\", [\"src/cart.py\"]), (\"p3\", [\"src/cart.py\"]),\n             (\"p4\", [\"tests/test_cart.py\"])]\n    assert select_patch(cands, lambda pid: behaviour[pid]()) == [\"p1\"]\n    print(\"all checks passed\")\n",
    checks: [
      { re: '\\.count\\(\\s*search\\s*\\)', flags: '', must: true, hint: 'Count occurrences first: source.count(search).', pass: 'match count checked' },
      { re: '!=\\s*1', flags: '', must: true, hint: 'Anything other than exactly one match is an error: if count != 1: raise.', pass: 'exactly-once rule' },
      { re: 'replace\\(\\s*search\\s*,\\s*replace\\s*,\\s*1\\s*\\)', flags: '', must: true, hint: 'Replace a single occurrence: source.replace(search, replace, 1).', pass: 'single replacement' },
      { re: 'if\\s+all\\(\\s*outcomes\\s*\\)', flags: '', must: true, hint: 'All runs passing is "pass".', pass: 'pass requires every run' },
      { re: 'if\\s+any\\(\\s*outcomes\\s*\\)', flags: '', must: true, hint: 'Some but not all passing is "flaky".', pass: 'mixed outcomes are flaky' },
      { re: 'startswith\\(\\s*"tests/"\\s*\\)', flags: '', must: true, hint: 'Reject candidates whose touched files start with "tests/".', pass: 'test edits rejected' },
      { re: 'for\\s+_\\s+in\\s+range\\(\\s*runs\\s*\\)', flags: '', must: true, hint: 'Rerun each candidate: [run_tests(pid) for _ in range(runs)].', pass: 'repeated validation runs' },
      { re: 'classify\\(\\s*outcomes\\s*\\)\\s*==\\s*"pass"', flags: '', must: true, hint: 'Accept only candidates classified exactly "pass".', pass: 'flaky patches not accepted' }
    ],
    run: `Save as <code>lab.py</code>, run <code>python3 lab.py</code>. Then wire <code>select_patch</code> to the worked example: let <code>run_tests(pid)</code> copy the repo, apply the candidate with your <code>apply_search_replace</code>, and run <code>python3 -m unittest</code> (or the Docker sandbox: <code>docker run --rm --network none -v "$PWD":/work -w /work python:3.11-slim python -m unittest -q</code>).`,
    solution: "def apply_search_replace(source, search, replace):\n    \"\"\"Apply one SEARCH/REPLACE edit. The search text must occur exactly once;\n    otherwise raise ValueError (0 matches = stale context, >1 = ambiguous).\"\"\"\n    count = source.count(search)\n    if count != 1:\n        raise ValueError(\"search block matched %d times, expected exactly 1\" % count)\n    return source.replace(search, replace, 1)\n\n\ndef classify(outcomes):\n    \"\"\"outcomes: list of booleans, one per repeated test run of the same patch.\"\"\"\n    if not outcomes:\n        raise ValueError(\"no runs\")\n    if all(outcomes):\n        return \"pass\"\n    if any(outcomes):\n        return \"flaky\"\n    return \"fail\"\n\n\ndef select_patch(candidates, run_tests, runs=5):\n    \"\"\"candidates: list of (patch_id, touched_files). run_tests(patch_id) -> bool.\n    Reject patches that touch tests/, run each remaining patch `runs` times,\n    and return the ids classified \"pass\" (flaky patches are not accepted).\"\"\"\n    accepted = []\n    for patch_id, files in candidates:\n        if any(f.startswith(\"tests/\") for f in files):\n            continue\n        outcomes = [run_tests(patch_id) for _ in range(runs)]\n        if classify(outcomes) == \"pass\":\n            accepted.append(patch_id)\n    return accepted\n\n\nif __name__ == \"__main__\":\n    src = \"x = a * b\\ny = a * b\\n\"\n    assert apply_search_replace(\"total = s * d\\n\", \"s * d\", \"s * (1 - d)\") == \"total = s * (1 - d)\\n\"\n    for bad in (\"a * b\", \"nope\"):\n        try:\n            apply_search_replace(src, bad, \"z\")\n            raise AssertionError(\"must reject ambiguous or missing search text\")\n        except ValueError:\n            pass\n    assert classify([True, True, True]) == \"pass\"\n    assert classify([True, False, True]) == \"flaky\"\n    assert classify([False, False]) == \"fail\"\n\n    import itertools\n    flip = itertools.cycle([True, False])\n    behaviour = {\"p1\": lambda: True, \"p2\": lambda: False, \"p3\": lambda: next(flip), \"p4\": lambda: True}\n    cands = [(\"p1\", [\"src/cart.py\"]), (\"p2\", [\"src/cart.py\"]), (\"p3\", [\"src/cart.py\"]),\n             (\"p4\", [\"tests/test_cart.py\"])]\n    assert select_patch(cands, lambda pid: behaviour[pid]()) == [\"p1\"]\n    print(\"all checks passed\")\n",
    notes: [
      'Treating "flaky" as not validated is deliberate: accepting a patch on a lucky run is how plausible-but-wrong patches enter a codebase.',
      'Five runs catch frequent flakiness only. For timing-dependent tests, add stress (CPU load, injected delays) to raise the failure probability, the same idea used to reproduce timing-dependent flaky failures.',
      'In a real pipeline, test-file edits are not always wrong (the issue may require a new test), so production systems route them to separate review instead of silently dropping them.'
    ]
  },
  quiz: [
    {
      q: 'In SWE-bench grading, what must PASS_TO_PASS tests do after the patch?',
      options: ['Fail, proving the bug existed', 'Still pass, showing the patch did not break existing behaviour', 'Be rewritten by the agent', 'Nothing; they are informational'],
      correct: 1,
      explain: 'FAIL_TO_PASS tests check the fix; PASS_TO_PASS tests check for regressions.'
    },
    {
      q: 'What was SWE-agent\'s central claim?',
      options: ['Bigger models are all that matters', 'The agent-computer interface (commands, viewers, feedback, guardrails like a linting edit command) strongly affects agent performance', 'Agents should never use search', 'Unified diffs are the best edit format'],
      correct: 1,
      explain: 'SWE-agent showed that designing the interface for the model, not just exposing a shell, substantially changes results.'
    },
    {
      q: 'How does Agentless differ from an agent like SWE-agent?',
      options: ['It uses no LLM', 'It runs a fixed localize, repair, validate pipeline with sampled patches and test-based selection instead of letting the model choose actions in a loop', 'It only works on Java', 'It edits tests instead of code'],
      correct: 1,
      explain: 'Agentless is a workflow; its strength comes from hierarchical localization, sampling and validation.'
    },
    {
      q: 'A candidate patch passes the test suite on 3 of 5 runs. The right verdict is:',
      options: ['Pass, since it passed most runs', 'Flaky: not validated; investigate the test or the patch', 'Fail, and delete the test', 'Pass if the model is confident'],
      correct: 1,
      explain: 'Inconsistent outcomes mean the oracle is unreliable for this patch. Accepting it risks a wrong patch; rejecting it outright may discard a correct one.'
    },
    {
      q: 'Why is "all tests pass" not proof that an automated patch is correct?',
      options: ['Tests are always wrong', 'Tests are a partial specification; plausible patches can overfit them, as APR research on overfitting showed', 'Passing tests slows the build', 'Because LLMs cannot write code'],
      correct: 1,
      explain: 'Plausible is not correct. Held-out tests, coverage of the patch, generated tests and review provide stronger evidence.'
    }
  ],
  testFlow: {
    title: 'Test yourself: running a validation harness',
    start: 'q1',
    nodes: {
      q1: { q: 'The agent\'s patch modifies tests/test_cart.py by loosening an assertion, and now everything passes. Accept?', choices: [
        { text: 'No: treat test edits as oracle tampering unless separately reviewed and justified', to: 'q1_right' },
        { text: 'Yes, tests are code too', to: 'q1_wrong' }
      ] },
      q1_right: { end: true, correct: true, text: 'Right. Weakening the oracle makes any patch pass. Route test changes to explicit review.', next: 'q2' },
      q1_wrong: { end: true, correct: false, text: 'Tests are code, but they are also the judge. A patch that edits its own grader needs separate scrutiny.', retry: 'q1' },
      q2: { q: 'Your reproduction test passes on the ORIGINAL buggy code. What does that tell you?', choices: [
        { text: 'It does not reproduce the issue, so it cannot be used to select patches', to: 'q2_right' },
        { text: 'The bug is already fixed', to: 'q2_wrong' }
      ] },
      q2_right: { end: true, correct: true, text: 'Yes. A reproduction test must fail before the fix; otherwise it carries no information about the fix.', next: 'q3' },
      q2_wrong: { end: true, correct: false, text: 'More likely the test does not capture the bug. Check it fails on the original code first.', retry: 'q2' },
      q3: { q: 'Tests run fine locally but the harness reports random timeouts in containers. Most likely?', choices: [
        { text: 'Resource limits or timing-dependent tests in the sandbox; measure flakiness and adjust limits', to: 'q3_right' },
        { text: 'The model is bad at Python', to: 'q3_wrong' }
      ] },
      q3_right: { end: true, correct: true, text: 'Correct. Harness-induced flakiness corrupts results. Rerun on the unpatched code to measure the baseline flake rate.' },
      q3_wrong: { end: true, correct: false, text: 'Random timeouts independent of the patch point at the environment, not the model.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Running each validation test once, so flaky tests produce both false passes and false failures.',
    'Letting the agent edit tests without separate review, which lets it weaken the oracle.',
    'Executing model-written code outside a sandbox, with network access and real credentials.',
    'Reporting a resolve rate without the benchmark variant, attempts per instance, scaffold version and cost.',
    'Equating plausible (test-passing) with correct, and skipping review of a sample of "resolved" patches.'
  ],
  interview: [
    {
      q: 'Design a coding agent that fixes issues in your company\'s monorepo and opens PRs.',
      a: `Environment: per-task container built from the repo's CI image, no network beyond an internal package mirror, resource limits, timeouts, non-root, a fresh checkout per attempt. Tools: search (grep and symbol lookup), file view with line windows, search/replace edit with a parse or lint gate, and a run-tests tool that targets selected tests and returns trimmed output. Flow: localize with search plus a failing reproduction test written first and confirmed to fail; edit; run the reproduction and related regression tests, rerunning to detect flakiness; optionally sample several candidates and select by tests. Policies: test-file edits flagged for review, patch size limits, no CI config changes. Output: a PR with a summary, the reproduction test, and coverage of changed lines, reviewed by a human. Evaluate offline on historical fixed issues in the repo, measuring resolve rate, regressions, cost and reviewer acceptance.`
    },
    {
      q: 'Tradeoff: an autonomous agent (SWE-agent, OpenHands) versus a pipeline (Agentless).',
      a: `The pipeline is cheaper, predictable, easy to parallelize and analyze stage by stage, and its sampling plus test-based selection is a strong use of compute. It struggles with issues needing exploration: reproducing complex setups, multi-file refactors, or understanding unfamiliar build systems. Agents handle those by iterating with feedback, at higher and more variable cost, and with more ways to go off the rails. In practice, hybrids: agentic exploration and reproduction, then constrained patch generation and test-based selection.`
    },
    {
      q: 'How do you validate an LLM-generated patch, and what can go wrong?',
      a: `Apply in a fresh sandboxed checkout; confirm a reproduction test fails before and passes after; run relevant regression tests several times; reject or review test edits; check coverage of the changed lines; optionally generate additional tests probing the changed behaviour and compare against the original on unaffected inputs; then human review. What goes wrong: overfitting to weak tests, oracle tampering, flaky tests producing false verdicts, reproduction tests encoding a misreading of the issue, and environment differences between the sandbox and CI.`
    },
    {
      q: 'How do flaky tests affect coding agents and their evaluation?',
      a: `During the run, a flaky failure sends the agent chasing a bug that is not there, or a flaky pass lets a wrong patch through. In evaluation, flaky FAIL_TO_PASS or PASS_TO_PASS tests make resolve rates noisy and can flip leaderboard rankings. Mitigations: measure each test's flake rate on the unpatched code, rerun and classify outcomes, quarantine or exclude known-flaky tests from grading, stress timing-sensitive tests, and report variance across repeated runs. Timing-dependent flakiness is especially relevant because agents often touch async and I/O code.`
    },
    {
      q: 'How would you apply coding agents to test repair, and what is hard about it?',
      a: `When a code change breaks tests, the agent must decide whether the test is outdated (repair the test) or the code is wrong (repair the code), which the failing test alone cannot answer. Useful context: the code diff that broke the test, the commit message and linked issue, the test's history, and whether the new behaviour is intended. The agent proposes test updates, but validation must guard against simply asserting whatever the code now does, which would erase the test's value. I would require the repaired test to still fail on a mutant or on the pre-change behaviour where that behaviour was a bug, and route repairs to review with a short justification.`
    },
    {
      q: 'Why does the agent-computer interface matter so much?',
      a: `The model only knows the environment through observations, and only acts through commands. Verbose, ambiguous or silent feedback wastes context and causes wrong inferences; commands that allow irreversible mistakes (a syntax-breaking edit to a large file) derail runs. SWE-agent showed that windowed file views, concise search, explicit "no output" messages and a linting edit command significantly improve performance with the same model. It is the same principle as good tool design, measured.`
    },
    {
      q: 'What would you report when claiming your agent resolves X% of SWE-bench Verified?',
      a: `The exact variant and harness version, model IDs and settings, scaffold version, attempts per instance and whether selection used anything beyond the agent's own signals, mean and confidence interval over repeated runs, cost and tokens per instance, time limits, and known excluded or environment-broken instances. Plus a breakdown by repository and a manual correctness audit of a sample of resolved patches, since passing hidden tests is still not the same as a good fix.`
    }
  ]
};
