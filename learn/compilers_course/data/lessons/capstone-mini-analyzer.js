window.LESSONS = window.LESSONS || {};
window.LESSONS['capstone-mini-analyzer'] = {
  id: 'capstone-mini-analyzer',
  title: 'Capstone: Build a Mini Analyzer (AST → CFG → Dataflow → Report) & Interview Playbook',
  category: 'Part 4 — Static Analyzers in the Wild',
  timeMin: 60,
  summary: `Everything in the course so far, in one 300-line program. <b>minilint</b> parses Python with <code>ast</code> (Part 1). It lowers each function to a statement-level control-flow graph, with if/while/for/try/with, break and continue (Part 2). It runs reaching definitions and liveness with one generic worklist solver (Part 3), and reports <b>possibly uninitialised reads</b> (ML001) and <b>dead stores</b> (ML002) as file:line diagnostics with stable rule IDs and an exit code (Part 4). It runs: it was tested with unit tests, compared against Pylint and pyflakes, and run over the whole CPython 3.10 standard library. The second half of the lesson is an interview playbook: how to present a project like this, the questions that come up and how to answer them, and a one-page recall map of the course.`,
  goals: [
    `Build and run a complete analyzer pipeline: parse, then CFG, then a worklist dataflow solver, then checks, then a report`,
    `Explain each design decision (statement-level nodes, pseudo-definitions at entry, strong updates, closure handling) and the precision and soundness tradeoff behind it`,
    `Evaluate an analyzer properly: unit tests per construct, differential comparison with Pylint and pyflakes, a corpus run, and manual triage of false positives`,
    `Extend it with a new check (unreachable code, ML003) in the lab`,
    `Present the project and the course material in an interview: a 2-minute pitch, likely deep-dive questions, and whiteboard designs`
  ],
  concept: [
    {
      h: 'The architecture, in four stages',
      p: [
        `<ol><li><b>Parse:</b> <code>ast.parse(src, filename)</code>. Each <code>FunctionDef</code> or <code>AsyncFunctionDef</code> anywhere in the module, nested ones included, is analysed on its own.</li><li><b>Lower to a CFG:</b> <code>CFGBuilder.stmt</code> returns the list of <i>dangling tails</i>, the nodes whose successor is "whatever comes next". That one trick makes sequencing compositional. <code>if</code> returns the tails of both arms. <code>return</code> and <code>raise</code> link to the exit node and return <code>[]</code>, which means everything after them is unreachable. Loops keep a stack of (header, break sources) for <code>break</code> and <code>continue</code>. Each node records its <code>defs</code> (names in Store context) and its <code>uses</code> (Load context, with <code>x += 1</code> counted as both).</li><li><b>Solve:</b> one <code>solve(nodes, transfer, forward, boundary)</code> worklist function computes reaching definitions forward and liveness backward.</li><li><b>Check and report:</b> ML001 fires when the reaching definitions of a used variable include the pseudo-definition <code>&lt;uninit&gt;</code>. ML002 fires when a defined variable is not in LIVE_OUT. Output is <code>file:line: CODE function: message</code>, and the exit status is 1 when anything was found, so CI can gate on it.</li></ol>`
      ],
      code: `source ──ast.parse──▶ AST ──CFGBuilder──▶ CFG (Node: kind, defs, uses, succ, pred)
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
     reaching defs (forward, ∪)                          liveness (backward, ∪)
     boundary: (v, <uninit>) for every local             boundary: ∅ at exit
     transfer: kill other defs of n.defs, gen (v, n)     transfer: (OUT − defs) ∪ uses
                    │                                                    │
     ML001: use of v where (v,<uninit>) ∈ RD_IN          ML002: def of v where v ∉ LIVE_OUT
                    └──────────────────────┬─────────────────────────────┘
                               report: file:line: ML00x fn: message   (exit 1)`
    },
    {
      h: 'The trick that makes uninitialised reads fall out: a pseudo-definition at entry',
      p: [
        `Reaching definitions alone cannot tell a variable that is "never assigned on this path" from code that is simply unreachable. Both have an empty set of reaching definitions. So the analyzer seeds the entry node with a fake definition <code>(v, "&lt;uninit&gt;")</code> for every local that is not a parameter. A real assignment kills it, exactly as it kills any other definition of v. If <code>&lt;uninit&gt;</code> still reaches a use, some path from entry gets there without an assignment. If it is the <i>only</i> definition reaching, the read always fails at runtime with <code>UnboundLocalError</code>, and the message says "is never assigned before this use". Otherwise it says "may be unassigned".`,
        `This is the same may/must split from the dataflow lesson. "Some path" is a may-fact, and "the only fact" approximates a must-fact. Java's definite-assignment rule (JLS chapter 16) is the must-style version enforced by the compiler. Python checks nothing until runtime.`,
        `The full <code>sample.py</code> used throughout this lesson (save it next to <code>minilint.py</code>):`,
        "<pre><code>import json\n\n\ndef parse_config(path, strict):\n    if strict:\n        mode = \"r\"\n    with open(path, mode) as fh:          # mode unassigned when strict is False\n        data = json.load(fh)\n    retries = 3                           # dead store: overwritten below\n    retries = data.get(\"retries\", 5)\n    return data, retries\n\n\ndef find_index(items, target):\n    for i, item in enumerate(items):\n        if item == target:\n            found = i\n            break\n    return found                          # unassigned if the loop never breaks\n\n\ndef total(xs):\n    acc = 0\n    for x in xs:\n        acc += x\n    return acc                            # clean\n\n\ndef retry(fn):\n    try:\n        result = fn()\n    except ValueError:\n        pass\n    return result                         # unassigned if fn() raised\n\n\ndef count_down(n):\n    while n &gt; 0:\n        n -= 1\n        last = n\n    tmp = n * 2                           # dead store: never read\n    return n</code></pre>"
      ],
      code: `def find_index(items, target):
    for i, item in enumerate(items):
        if item == target:
            found = i          # kills (found, <uninit>) on this path only
            break
    return found               # RD_IN ∋ (found, <uninit>) via "loop ended without break"

$ python3 minilint.py sample.py
sample.py:7: ML001 parse_config: local 'mode' may be unassigned at this use
sample.py:9: ML002 parse_config: value assigned to 'retries' is never read
sample.py:19: ML001 find_index: local 'found' may be unassigned at this use
sample.py:34: ML001 retry: local 'result' may be unassigned at this use
sample.py:40: ML002 count_down: value assigned to 'last' is never read
sample.py:41: ML002 count_down: value assigned to 'tmp' is never read
minilint: 6 finding(s)`
    },
    {
      h: 'How the CFG handles the awkward constructs',
      p: [
        `<ul><li><b>for/while:</b> a <code>loop</code> header node with a back edge from the body tails. The header of a <code>for</code> <i>uses</i> the iterable and <i>defines</i> the target. The loop's exits are the <code>else</code> clause (reached from the header) plus every <code>break</code>. <code>while True:</code> has no fall-through exit, so it exits only through <code>break</code>. Without that special case, <code>while True: line = input(); if line: break</code> gave a false positive on <code>line</code>, and the test suite caught it.</li><li><b>try/except:</b> deliberately conservative. Any statement in the body might raise, so every body node, and the node just before the first statement, gets an edge to every handler. That is why <code>result = fn()</code> inside <code>try</code>, followed by <code>except ValueError: pass</code>, correctly yields "result may be unassigned". <code>finally</code> is sequenced after the normal tails. Modelling the exceptional path through <code>finally</code> exactly is left out.</li><li><b>with:</b> items bind left to right, so in <code>with open(p) as f, wrap(f) as g</code> the use of <code>f</code> sees the definition before it.</li><li><b>Nested scopes:</b> lambdas, comprehensions and nested defs do not bind in the enclosing scope (Python 3 semantics), but the free names they read count as uses.</li></ul>`
      ]
    },
    {
      h: 'Precision decisions, and the one soundness compromise',
      p: [
        `Three filters keep ML002 useful in practice. They match what pyflakes and Pylint do: skip names starting with <code>_</code> (the "intentionally unused" convention); skip tuple-unpacking targets (<code>a, b = pair</code> when only <code>a</code> is used is idiomatic); and treat <code>del x</code> as a read. Imports, <code>def</code> and <code>class</code> statements and <code>with … as</code> bindings are not reported as dead stores either.`,
        `The one deliberate soundness compromise concerns <b>closures</b>. A variable captured by a nested function is read whenever the closure runs, not where it is defined. In the stdlib, <code>functools.singledispatch</code> defines <code>wrapper</code>, which reads <code>funcname</code>, and assigns <code>funcname</code> a few lines later. A flow-sensitive check flags it, but the code is correct, because the closure only runs after the assignment. minilint excludes captured names from both checks. That misses real bugs in closures and removes a whole class of false positives. State tradeoffs like this explicitly in an interview.`
      ]
    },
    {
      h: 'Evaluation: tests, differential comparison, corpus run',
      p: [
        `<b>Unit tests per construct</b> (<code>test_minilint.py</code>, six cases, all passing): if without else, both branches assigned, overwritten value, loop-carried accumulator, <code>while True</code> with break, and the except path. Each bug found during development became a test.`,
        `<b>Differential comparison</b> on the same <code>sample.py</code>. Pylint 4.1 (<code>possibly-used-before-assignment</code>, <code>unused-variable</code>) reports <code>mode</code>, <code>last</code> and <code>tmp</code>. pyflakes reports <code>last</code> and <code>tmp</code>. minilint additionally finds <code>found</code> (unassigned when the loop never breaks), <code>result</code> (the except path) and the overwritten <code>retries = 3</code>. Pylint's unused-variable only asks "is this name ever read?", not "is this <i>value</i> ever read?". That is the difference between a name-based check and a dataflow-based one.`,
        `<b>Corpus run:</b> over the 173 top-level modules in <code>/usr/lib/python3.10</code>, with no crashes, minilint reports 165 ML001 and 120 ML002 findings. A hand triage of samples gave three categories. True positives, such as <code>gettext._as_int</code>, where <code>i = round(n)</code> is assigned and never used. Path-insensitivity false positives, such as <code>warnings.filterwarnings</code>, which does <code>if message or module: import re</code> and later <code>if message: re.compile(...)</code>. And interprocedural false positives, such as <code>ipaddress</code>, where <code>cls._report_invalid_netmask()</code> always raises but the analysis does not know that. Those categories are exactly the theory lessons' limitations showing up in real code.`
      ],
      code: `$ python3 -m unittest -v test_minilint
test_both_branches_assign_is_clean ... ok
test_except_path_reaches_use ... ok
test_if_without_else_is_possibly_uninitialized ... ok
test_loop_carried_value_is_live ... ok
test_overwritten_value_is_dead_store ... ok
test_while_true_only_exits_via_break ... ok
Ran 6 tests in 0.001s   OK

$ pylint --disable=all --enable=possibly-used-before-assignment,unused-variable sample.py
sample.py:7:20: E0606: Possibly using variable 'mode' before assignment
sample.py:40:8: W0612: Unused variable 'last'
sample.py:41:4: W0612: Unused variable 'tmp'
$ pyflakes sample.py
sample.py:40:9: local variable 'last' is assigned to but never used
sample.py:41:5: local variable 'tmp' is assigned to but never used`
    },
    {
      h: 'Interview playbook: presenting this (or any) analysis project',
      p: [
        `<b>The 2-minute pitch:</b> problem, then approach, then one result, then one limitation. For example: "Python only reports unbound locals at runtime. I built a dataflow-based checker: AST to CFG to reaching definitions and liveness with a worklist. It finds possibly-uninitialised reads and dead stores, including cases Pylint misses, such as a variable assigned only inside a try body. On the stdlib its false positives fall into two families, correlated branches and functions that always raise, and that tells me the next steps would be path sensitivity and interprocedural no-return summaries."`,
        `<b>Expect these follow-ups</b> and have one-line answers ready. Why statement-level nodes? (Simpler and good enough. Blocks are an optimisation.) Does it terminate? (Finite powerset lattice, monotone gen/kill.) Is it sound? (Not for closures, <code>exec</code>, <code>globals()</code> or <code>locals()</code> writes, or interprocedural exceptions, and here is why.) How would it scale? (Bit vectors, reverse postorder, per-function parallelism, incremental re-analysis on edit.) How did you evaluate it? (Unit tests, differential comparison, corpus run, triage.) What would you add? (No-return summaries, path sensitivity via condition tracking, SSA.)`,
        `<b>For whiteboard design questions</b>, always cover: the IR (AST or CFG or SSA), the abstract domain and lattice, the direction and meet, the transfer functions, termination, the interprocedural strategy, sources of unsoundness, how results are reported, and how you would measure precision and recall. Saying those nine items in order is most of a strong answer.`,
        `<b>Connect it to your own work:</b> flaky-test detection and test repair are program-analysis problems. Order-dependent tests are a shared-state dataflow question: which static fields does test A write that test B reads? Test selection needs a call graph and is only as sound as its reflection handling. LLM-based repair benefits from analyzer feedback, both by grounding prompts in CFG and def-use facts and by using analyzers as cheap verifiers of generated patches. Have one concrete example of each ready.`
      ]
    }
  ],
  deepDive: {
    timeMin: 20,
    intro: `Where to take minilint next, each mapped to the lesson that covers the theory. Plus the course on one page, for the night before.`,
    sections: [
      {
        h: 'Extension 1: interprocedural "no-return" summaries',
        p: [
          `The <code>ipaddress</code> false positive comes from a helper that always raises. Compute a summary per function: <i>does any path reach exit other than through raise?</i> That is a reachability query on the function's own CFG. Then, when building a caller's CFG, give calls to no-return functions no fall-through edge, exactly as <code>raise</code> does. Resolving <code>cls._report_invalid_netmask</code> needs at least CHA-style method resolution (pointer-and-callgraph lesson). Iterate the summaries to a fixpoint over the call graph's strongly connected components. This is the summary-based interprocedural pattern of Infer and of the functional approach to IFDS.`
        ]
      },
      {
        h: 'Extension 2: path sensitivity for correlated branches',
        p: [
          `The <code>if message: import re … if message: re.compile()</code> pattern needs facts qualified by conditions. Cheap option: <b>trace partitioning</b> on simple boolean locals, keeping separate RD sets per value of <code>message</code> (truthy or falsy) until the variable is reassigned. Exact but expensive option: symbolic execution with an SMT solver (formal-methods course) to check whether the path "first if false, second if true" is feasible. That conjunction is unsatisfiable, so the alarm is suppressed. Either way, measure the drop in false positives against the cost.`
        ]
      },
      {
        h: 'Extension 3: SSA and sparse analysis',
        p: [
          `Convert the CFG to SSA (dominance frontiers via Cytron et al., ssa-form lesson). ML001 then becomes "a φ-function has an operand that is the undefined version v₀", and ML002 becomes "an SSA name with no uses". Both are sparse and linear in the size of the def-use graph. CPython's own compiler does not do this, but tools like Pyright effectively compute definite assignment over their own flow graph. Pyright's <code>reportPossiblyUnbound</code> check is the production version of ML001.`
        ]
      },
      {
        h: 'The whole course on one page',
        p: [
          `<div class="cmp-wrap"><table class="cmp"><tr><th>Part</th><th>Remember</th><th>One-liner for the interview</th></tr><tr><td>0 Pipeline and parsing</td><td>lex, then parse (CST/AST), then semantic analysis, then IR, then optimisation, then codegen</td><td>Recursive descent equals one function per nonterminal. Precedence climbing handles operators. LR handles left recursion, LL needs it removed.</td></tr><tr><td>1 ASTs</td><td>Python <code>ast</code> (NodeVisitor/Transformer, <code>unparse</code>), JavaParser/JDT/Spoon, tree-sitter (error-tolerant, incremental), srcML (XML plus XPath, round-trips)</td><td>Choose by need: types (JDT, JavaParser with symbol solver), edits (Spoon, LibCST), many languages (tree-sitter), queries (srcML).</td></tr><tr><td>2 IR</td><td>Three-address code, basic blocks (leaders), CFG, dominators, SSA with φ, LLVM IR, Jimple</td><td>SSA gives one def per name, which makes def-use explicit and analysis sparse. φ nodes are placed at dominance frontiers.</td></tr><tr><td>3 Theory</td><td>gen/kill, may/must, worklist, MOP vs MFP; lattices, Galois connections, widening; CHA/RTA/Andersen/Steensgaard; IFDS taint</td><td>Finite height plus monotone functions gives termination. Distributive functions make MFP equal MOP. Widening covers infinite height.</td></tr><tr><td>4 Tools</td><td>SpotBugs (bytecode), PMD (AST/XPath), Error Prone (javac), Checker Framework (types), Infer (separation logic), CodeQL (Datalog); Pylint, Ruff, mypy/Pyright, Bandit, Semgrep</td><td>Rice's theorem: you cannot have sound, complete and terminating together. Developer tools favour precision, verifiers favour soundness.</td></tr></table></div>`
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: `Franky Builds the Sunny's Inspection Crew`,
      text: [
        `Before the Sunny leaves Water 7, Franky wants a crew of inspectors so that it never sinks the way the Merry did. Usopp reads the blueprints and turns them into a list of parts, which is parsing. Nami lays out every corridor and hatch as a map of which room leads to which, including the dead ends behind locked doors, which is the CFG. Robin walks the map with chalk, marking in each room which fittings were last installed and which ones someone will still need. She keeps re-walking only the corridors whose marks changed. That is the dataflow fixpoint.`,
        `Then Franky writes the report: "Room 7: the cannon may be loaded with nothing on the route through the storeroom. Room 12: a fresh barrel of cola nobody ever drinks." Each line gives a location, a rule and a reason. Usopp points out two false alarms, a hatch that is only ever opened when the other one is open. Franky does not throw the inspection away. He writes the reason down as the next improvement and launches the ship.`
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: `The Roommate Agreement Linter`,
      text: [
        `Sheldon writes a program that reads the Roommate Agreement, maps every clause that refers to another clause, and checks for clauses that can never apply because their precondition is impossible, and for obligations that are created and then never enforced. He runs it on the agreement and gets a dozen findings.`,
        `Leonard, triaging: "This one is wrong. Clause 37B only applies if 12A was invoked, so it's fine." Sheldon, outraged, then concedes that his tool does not track correlated conditions, adds a unit test for it, and puts "path sensitivity" in the roadmap. When Leonard asks why he does not just make the tool perfect, Sheldon explains Rice's theorem at length.`
      ]
    },
    why: `Parse, then map, then propagate marks to a fixpoint, then report with reasons: that is minilint's pipeline. The false alarms that come from correlated hatches and clauses are path-insensitivity. Turning each one into a test and a roadmap item is how real analyzer teams work, and it is how to talk about your own tool in an interview.`
  },
  storyAnim: {
    h: 260,
    props: [
      { id: 'src', emoji: '📄', label: 'sample.py', x: 8, y: 16 },
      { id: 'ast', emoji: '🌳', label: 'ast.parse', x: 30, y: 16 },
      { id: 'cfg', emoji: '🗺️', label: 'CFG per function', x: 54, y: 16 },
      { id: 'rd', emoji: '➡️', label: 'reaching defs', x: 54, y: 52 },
      { id: 'lv', emoji: '⬅️', label: 'liveness', x: 78, y: 52 },
      { id: 'rep', emoji: '📋', label: 'report: 0 findings', x: 30, y: 84 }
    ],
    actors: [
      { id: 'franky', emoji: '🔧', label: 'Franky (driver)', x: 10, y: 50 },
      { id: 'robin', emoji: '🖍️', label: 'Robin (solver)', x: 40, y: 50 }
    ],
    steps: [
      { c: `minilint sample.py: read the file and hand it to ast.parse.`, p: { src: 'lit', ast: 'lit' }, a: { franky: [20, 34] } },
      { c: `For each function, CFGBuilder makes nodes for statements and branch/loop headers. Return links to exit, break goes to the loop's exits, and except handlers get edges from every try statement.`, p: { cfg: 'lit' }, a: { franky: [44, 34] } },
      { c: `Reaching definitions, forward: entry seeds (mode, <uninit>). The if-branch kills it on one path only, so at open(path, mode) the pseudo-def still reaches.`, p: { rd: 'lit' }, a: { robin: [50, 66] }, l: { rep: 'report: ML001 mode (line 7)' } },
      { c: `Same idea for found after a loop that may not break, and result after an except that swallowed the error.`, l: { rep: 'report: ML001 ×3' }, p: { rep: 'lit' } },
      { c: `Liveness, backward: retries = 3 is overwritten before any read, so retries is not in LIVE_OUT there. That is a dead store.`, p: { lv: 'lit' }, a: { robin: [74, 66] }, l: { rep: 'report: ML001 ×3, ML002 ×3' } },
      { c: `Print file:line: CODE function: message and exit 1. CI can gate on that exit code.`, p: { rep: 'good', rd: 'good', lv: 'good' }, a: { franky: [24, 70] } },
      { c: `Triage: the stdlib run shows correlated-branch and always-raises false positives. Each one becomes a test and a roadmap item. 🏴‍☠️`, p: { cfg: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'minilint, end to end',
    intro: 'Each box is a function or class in minilint.py. Click to jump, or press Play.',
    stages: [
      { label: 'Front end', nodes: [ { id: 'parse', text: 'analyze_source\nast.parse, walk\nevery FunctionDef' }, { id: 'names', text: 'names_in\nLoad/Store names,\nnested scopes = free reads' } ] },
      { label: 'IR', nodes: [ { id: 'cfg', text: 'CFGBuilder.stmt\nreturns dangling tails' }, { id: 'loops', text: 'loop stack\nbreak / continue,\nwhile True' }, { id: 'try', text: 'try: every body node\n→ every handler' } ] },
      { label: 'Dataflow', nodes: [ { id: 'rd', text: 'solve(forward)\nRD with <uninit>\nat entry' }, { id: 'lv', text: 'solve(backward)\nliveness' } ] },
      { label: 'Checks', nodes: [ { id: 'ml1', text: 'ML001\n<uninit> ∈ RD_IN\nat a use' }, { id: 'ml2', text: 'ML002\nv ∉ LIVE_OUT\nat a def' } ] },
      { label: 'Output', nodes: [ { id: 'rep', text: 'file:line: CODE msg\nexit 1 if findings' } ] }
    ],
    steps: [
      { active: ['parse'], note: 'Parse once and analyse every function separately, nested ones included. A syntax error stops the run here, as with any parser-based linter.' },
      { active: ['names'], note: 'Collect the names read and written per statement. Lambdas and comprehensions do not bind outward, but their free names count as reads.' },
      { active: ['cfg'], note: 'Each statement handler returns the nodes that fall through to whatever comes next. Return and raise return an empty list, so the code after them has no predecessor.' },
      { active: ['loops'], note: 'Loop headers get back edges. Break nodes are collected as extra loop exits, and while True has no normal exit.' },
      { active: ['try'], note: 'Conservative exceptions: any statement in the try body may raise, so the handlers can be reached with any prefix of the body executed.' },
      { active: ['rd'], note: 'Forward reaching definitions with a pseudo-def per local at entry. Parameters start as defined.' },
      { active: ['lv'], note: 'Backward liveness, using the same solver with the direction flipped.' },
      { active: ['ml1'], note: 'If the pseudo-def reaches a use, report ML001: "never assigned" if it is the only def reaching, otherwise "may be unassigned".' },
      { active: ['ml2'], note: 'A def whose variable is not live afterwards is ML002, except for underscore names, unpacking targets, imports and defs.' },
      { active: ['rep'], note: 'Stable rule codes, sorted output and a nonzero exit status: the minimum contract for running in CI.' }
    ]
  },
  tech: [
    {
      q: `Why statement-level CFG nodes instead of basic blocks?`,
      a: `Diagnostics are per statement anyway, so storing facts per statement means no intra-block recomputation is needed when reporting. The cost is more nodes, which for a linter working on one function at a time is negligible. A compiler would build basic blocks (lowering-to-ir lesson) and bit vectors because it runs on huge generated functions. The solver does not care which you choose: the equations are the same, with a block's transfer function being the composition of its statements' functions.`
    },
    {
      q: `Is minilint sound for ML001? List the holes.`,
      a: `No, and listing exactly where is the right interview answer. (1) Captured variables are skipped on purpose. (2) <code>exec</code>, <code>globals()[...] = </code>, and writes through <code>locals()</code> are invisible. (3) <code>try/finally</code>: the exceptional path through <code>finally</code> is not modelled. (4) A <code>with</code> block whose context manager suppresses exceptions (<code>contextlib.suppress</code>) can skip the rest of its body, which is not modelled. (5) Exceptions raised inside called functions are only considered within an explicit try. In the other direction, it is conservative (may produce false positives) for correlated branches and always-raising helpers.`
    },
    {
      q: `Why does the solver keep a separate "queued" set next to the deque?`,
      a: `<code>m not in deque</code> is O(n). With a membership set it is O(1), which keeps every worklist step proportional to the node's degree. The dataflow lesson's teaching version used the linear check for readability. The capstone fixes it, which is the kind of detail to point out when presenting your own code.`
    },
    {
      q: `How would you ship this in a real codebase?`,
      a: `Add a <code>--format=sarif</code> output so that GitHub code scanning can show the findings inline. Add per-line suppression (<code># minilint: disable=ML002</code>), which needs <code>tokenize</code>, because comments are not in the AST. Add a baseline file so that only new findings fail CI. Add a pre-commit hook and a Ruff-style config in <code>pyproject.toml</code>. Most importantly, track how many reported findings developers actually fix, and drop or improve any rule whose fix rate is low.`
    }
  ],
  code: {
    title: 'minilint.py: the complete analyzer',
    intro: `Stdlib only, Python 3.8+ (tested on 3.10). Save it as <code>minilint.py</code>. Run <code>python3 minilint.py yourfile.py</code>, or the sample from the concept section. The tests (<code>test_minilint.py</code>) are in the lab's run instructions.`,
    code: "#!/usr/bin/env python3\n\"\"\"minilint: a tiny dataflow-based Python analyzer.\n\nPipeline:  source --ast.parse--> AST --CFGBuilder--> statement-level CFG\n           --worklist--> reaching definitions + liveness --checks--> report\n\nChecks (per function, locals only):\n  ML001 possibly-uninitialized : a local is read where some path from entry\n                                 reaches it without any assignment\n  ML002 dead-store             : a value is assigned to a local and never read\nUsage:  python3 minilint.py file.py [more.py ...]   (exit 1 if findings)\n\"\"\"\nimport ast\nimport sys\nfrom collections import deque\nfrom dataclasses import dataclass, field\n\nSCOPE_NODES = (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Lambda,\n               ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp)\n\n\n# --------------------------------------------------------------------------\n# 1. CFG: one node per simple statement or per branch/loop header\n# --------------------------------------------------------------------------\n@dataclass(eq=False)\nclass Node:\n    id: int\n    kind: str                     # 'entry', 'exit', 'stmt', 'test', 'loop'\n    ast_node: ast.AST = None\n    defs: set = field(default_factory=set)   # local names written here\n    uses: set = field(default_factory=set)   # local names read here\n    succ: list = field(default_factory=list)\n    pred: list = field(default_factory=list)\n\n    @property\n    def line(self):\n        return getattr(self.ast_node, \"lineno\", 0)\n\n\ndef names_in(expr_or_stmt):\n    \"\"\"(loads, stores) of plain names, not descending into nested scopes.\"\"\"\n    loads, stores = set(), set()\n    todo = [expr_or_stmt] if expr_or_stmt is not None else []\n    while todo:\n        n = todo.pop()\n        if isinstance(n, ast.Name):             # `del x` counts as a read of x\n            (stores if isinstance(n.ctx, ast.Store) else loads).add(n.id)\n        elif isinstance(n, (ast.Import, ast.ImportFrom)):\n            for a in n.names:            # `import a.b` binds `a`; `as x` binds x\n                if a.name != \"*\":\n                    stores.add(a.asname or a.name.split(\".\")[0])\n        elif isinstance(n, SCOPE_NODES):\n            # A nested scope: its own bindings stay inside, but free names it\n            # reads (closures, comprehension sources) count as reads here.\n            inner_l, inner_s = set(), set()\n            for sub in ast.walk(n):\n                if isinstance(sub, ast.Name):\n                    (inner_l if isinstance(sub.ctx, ast.Load) else inner_s).add(sub.id)\n                elif isinstance(sub, ast.arg):\n                    inner_s.add(sub.arg)\n            loads |= inner_l - inner_s\n            if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):\n                stores.add(n.name)\n        else:\n            todo.extend(ast.iter_child_nodes(n))\n    return loads, stores\n\n\nclass CFGBuilder:\n    def __init__(self):\n        self.nodes = []\n        self.loops = []            # stack of (header, break_sources)\n\n    def new(self, kind, ast_node=None, loads=(), stores=()):\n        n = Node(len(self.nodes), kind, ast_node, set(stores), set(loads))\n        self.nodes.append(n)\n        return n\n\n    @staticmethod\n    def link(preds, node):\n        for p in preds:\n            p.succ.append(node)\n            node.pred.append(p)\n\n    def build_function(self, fn):\n        self.entry = self.new(\"entry\", fn)\n        self.exit = self.new(\"exit\")\n        tails = self.seq(fn.body, [self.entry])\n        self.link(tails, self.exit)            # falling off the end returns None\n        return self\n\n    def seq(self, stmts, preds):\n        for s in stmts:\n            preds = self.stmt(s, preds)\n        return preds                            # dangling tails ([] if unreachable)\n\n    def stmt(self, s, preds):\n        if isinstance(s, ast.If):\n            test = self.new(\"test\", s, *names_in(s.test))\n            self.link(preds, test)\n            return self.seq(s.body, [test]) + self.seq(s.orelse, [test])\n        if isinstance(s, (ast.While, ast.For, ast.AsyncFor)):\n            if isinstance(s, ast.While):\n                loads, stores = names_in(s.test)\n            else:                               # header: read iter, bind target\n                loads, _ = names_in(s.iter)\n                _, stores = names_in(s.target)\n            head = self.new(\"loop\", s, loads, stores)\n            self.link(preds, head)\n            self.loops.append((head, []))\n            body_tails = self.seq(s.body, [head])\n            self.link(body_tails, head)         # back edge\n            _, breaks = self.loops.pop()\n            infinite = isinstance(s, ast.While) and isinstance(s.test, ast.Constant) \\\n                and bool(s.test.value)\n            exits = [] if infinite else self.seq(s.orelse, [head])   # `while True:` only exits via break\n            return exits + breaks\n        if isinstance(s, ast.Break):\n            n = self.new(\"stmt\", s)\n            self.link(preds, n)\n            self.loops[-1][1].append(n)\n            return []\n        if isinstance(s, ast.Continue):\n            n = self.new(\"stmt\", s)\n            self.link(preds, n)\n            self.link([n], self.loops[-1][0])\n            return []\n        if isinstance(s, (ast.Return, ast.Raise)):\n            n = self.new(\"stmt\", s, *names_in(s))\n            self.link(preds, n)\n            self.link([n], self.exit)\n            return []\n        if isinstance(s, (ast.With, ast.AsyncWith)):\n            loads, stores = set(), set()\n            for item in s.items:                # items bind left to right\n                l, _ = names_in(item.context_expr)\n                _, st = names_in(item.optional_vars)\n                loads |= l - stores\n                stores |= st\n            head = self.new(\"stmt\", s, loads, stores)\n            self.link(preds, head)\n            return self.seq(s.body, [head])\n        if isinstance(s, ast.Try):\n            # Conservative: any statement of the body may raise, so every point\n            # in the body (including before the first statement) edges to each handler.\n            start = self.new(\"stmt\", s)         # marks \"entered try\"\n            self.link(preds, start)\n            before = len(self.nodes)\n            tails = self.seq(s.body, [start])\n            raisers = [start] + self.nodes[before:]\n            out = self.seq(s.orelse, tails)\n            for h in s.handlers:\n                hn = self.new(\"stmt\", h, (), {h.name} if h.name else ())\n                self.link(raisers, hn)\n                out += self.seq(h.body, [hn])\n            if s.finalbody:\n                out = self.seq(s.finalbody, out)\n            return out\n        if isinstance(s, (ast.Global, ast.Nonlocal)):\n            return preds\n        # plain statement: Assign, AugAssign, AnnAssign, Expr, Delete, Import, Pass...\n        loads, stores = names_in(s)\n        if isinstance(s, ast.AugAssign) and isinstance(s.target, ast.Name):\n            loads.add(s.target.id)              # x += 1 reads x first\n        if isinstance(s, ast.AnnAssign) and s.value is None:\n            stores = set()                      # `x: int` alone binds nothing\n        n = self.new(\"stmt\", s, loads, stores)\n        self.link(preds, n)\n        return [n]\n\n\n# --------------------------------------------------------------------------\n# 2. Dataflow: a generic worklist solver (forward or backward, union meet)\n# --------------------------------------------------------------------------\ndef solve(nodes, transfer, forward=True, boundary=frozenset()):\n    IN = {n: frozenset() for n in nodes}\n    OUT = {n: frozenset() for n in nodes}\n    start = nodes[0] if forward else nodes[1]            # entry / exit\n    work = deque(nodes if forward else reversed(nodes))\n    queued = set(work)\n    while work:\n        n = work.popleft()\n        queued.discard(n)\n        if forward:\n            inc = boundary if n is start else frozenset().union(*(OUT[p] for p in n.pred))\n            IN[n] = inc\n            new, old, nxt = transfer(n, inc), OUT[n], n.succ\n            OUT[n] = new\n        else:\n            inc = boundary if n is start else frozenset().union(*(IN[s] for s in n.succ))\n            OUT[n] = inc\n            new, old, nxt = transfer(n, inc), IN[n], n.pred\n            IN[n] = new\n        if new != old:\n            for m in nxt:\n                if m not in queued:\n                    work.append(m)\n                    queued.add(m)\n    return IN, OUT\n\n\n# --------------------------------------------------------------------------\n# 3. Checks\n# --------------------------------------------------------------------------\nUNINIT = \"<uninit>\"               # pseudo-definition site: \"not yet assigned\"\n\n\ndef analyze_function(fn, filename):\n    cfg = CFGBuilder().build_function(fn)\n    nodes = cfg.nodes\n    params = {a.arg for a in fn.args.posonlyargs + fn.args.args + fn.args.kwonlyargs}\n    params |= {a.arg for a in (fn.args.vararg, fn.args.kwarg) if a}\n    declared_outer = {name for s in ast.walk(fn) if isinstance(s, (ast.Global, ast.Nonlocal))\n                      for name in s.names}\n    # Names captured by nested functions/lambdas are read whenever the closure\n    # runs, not where it is defined, so a flow-sensitive check would be unsound\n    # for them: skip them (a precision/soundness tradeoff worth saying out loud).\n    captured = set()\n    for sub in ast.walk(fn):\n        if sub is not fn and isinstance(sub, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda)):\n            l, _ = names_in(sub)\n            captured |= l\n    local_vars = {v for n in nodes for v in n.defs} - declared_outer - captured\n    for n in nodes:                     # only track locals\n        n.defs &= local_vars\n        n.uses &= local_vars\n\n    # Reaching definitions. A fact is (var, node_id); node_id UNINIT means unassigned.\n    entry_facts = frozenset((v, UNINIT) for v in local_vars - params) | \\\n        frozenset((p, \"param\") for p in params if p in local_vars)\n\n    def rd_transfer(n, facts):\n        if not n.defs:\n            return facts\n        return frozenset(f for f in facts if f[0] not in n.defs) | \\\n            frozenset((v, n.id) for v in n.defs)\n\n    RD_IN, _ = solve(nodes, rd_transfer, forward=True, boundary=entry_facts)\n\n    # Liveness (backward). Everything is dead at function exit.\n    def live_transfer(n, live_out):\n        return (live_out - n.defs) | n.uses\n\n    _, LIVE_OUT = solve(nodes, live_transfer, forward=False)\n\n    findings = []\n    reachable = {n for n in nodes if n.pred or n.kind == \"entry\"}\n    for n in nodes:\n        if n not in reachable or n.kind == \"entry\":\n            continue\n        for v in sorted(n.uses):\n            sites = {d for (var, d) in RD_IN[n] if var == v}\n            if UNINIT in sites:\n                how = \"is never assigned before\" if sites == {UNINIT} else \"may be unassigned at\"\n                findings.append((n.line, \"ML001\", f\"local '{v}' {how} this use\"))\n        unpacking = isinstance(n.ast_node, (ast.Assign, ast.For)) and any(\n            isinstance(t, (ast.Tuple, ast.List)) for t in\n            (n.ast_node.targets if isinstance(n.ast_node, ast.Assign) else [n.ast_node.target]))\n        for v in sorted(n.defs):\n            if v not in LIVE_OUT[n] and not v.startswith(\"_\") and not unpacking and \\\n                    not isinstance(n.ast_node, (ast.FunctionDef, ast.ClassDef,\n                                                ast.Import, ast.ImportFrom, ast.With)):\n                findings.append((n.line, \"ML002\", f\"value assigned to '{v}' is never read\"))\n    return [(filename, line, code, f\"{fn.name}: {msg}\") for line, code, msg in findings]\n\n\ndef analyze_source(src, filename=\"<string>\"):\n    tree = ast.parse(src, filename)\n    out = []\n    for node in ast.walk(tree):\n        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):\n            out += analyze_function(node, filename)\n    return sorted(set(out), key=lambda f: (f[0], f[1], f[2]))\n\n\ndef main(argv):\n    if not argv:\n        print(__doc__)\n        return 2\n    total = 0\n    for path in argv:\n        with open(path, encoding=\"utf-8\") as fh:\n            findings = analyze_source(fh.read(), path)\n        for fname, line, code, msg in findings:\n            print(f\"{fname}:{line}: {code} {msg}\")\n        total += len(findings)\n    print(f\"minilint: {total} finding(s)\")\n    return 1 if total else 0\n\n\nif __name__ == \"__main__\":\n    sys.exit(main(sys.argv[1:]))\n",
    notes: [
      `Verified: the six findings on <code>sample.py</code> shown above; zero findings on a clean file containing globals, closures, comprehensions, for/else, while True with break, and try/finally; zero findings on minilint itself; and no crashes over all 173 modules in <code>/usr/lib/python3.10</code>.`,
      `The <code>reachable</code> filter in <code>analyze_function</code> uses "has a predecessor", which is a shortcut. A dead loop body has a predecessor (its own back edge) but is still unreachable. The lab builds the correct BFS-based version.`,
      `Everything specific to Python is in <code>names_in</code> and <code>CFGBuilder</code>. <code>solve</code> and the two checks would work unchanged on a CFG built from Java (JavaParser or Jimple) or from tree-sitter.`
    ]
  },
  lab: {
    title: 'Add ML003: unreachable code (by real reachability)',
    prompt: `Add a third check to minilint. Write <code>reachable_from_entry(entry)</code> as a BFS over <code>succ</code> edges, and <code>check_unreachable(fn)</code>, which builds the CFG with minilint's <code>CFGBuilder</code> and reports every <code>stmt</code>, <code>test</code> or <code>loop</code> node not reached from entry as <code>(line, "ML003", "fn: unreachable code")</code>. Only report the first line of each run of consecutive dead lines. Do <b>not</b> use "has a predecessor" as the test: a dead loop body after a <code>return</code> has its own back edge. Expected output on the built-in sample: lines 4, 11 and 14.`,
    starter: `"""ML003 unreachable-code: a statement no path from entry can reach.
Run next to minilint.py:  python3 ml003.py"""
import ast
import textwrap
from collections import deque

from minilint import CFGBuilder


def reachable_from_entry(entry):
    # TODO: BFS over node.succ starting at entry; return the set of reached nodes
    return {entry}


def check_unreachable(fn):
    cfg = CFGBuilder().build_function(fn)
    findings = []
    # TODO: report stmt/test/loop nodes that are not reachable from cfg.entry,
    #       then keep only the first line of each consecutive run
    return findings


SRC = textwrap.dedent('''
    def f(x):
        return x
        print("never")
        while x:
            x -= 1

    def g(xs):
        for v in xs:
            continue
            v += 1
        while True:
            pass
        return 0
''')

if __name__ == "__main__":
    tree = ast.parse(SRC)
    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            for line, code, msg in check_unreachable(node):
                print(f"line {line}: {code} {msg}")
`,
    checks: [
      { re: 'queue\\s*=\\s*deque\\(\\s*\\[\\s*entry\\s*\\]\\s*\\)', flags: '', must: true, hint: 'Start the BFS with queue = deque([entry]).', pass: 'BFS seeded at entry ✓' },
      { re: 'for\\s+s\\s+in\\s+node\\.succ', flags: '', must: true, hint: 'Follow successor edges: for s in node.succ.', pass: 'follows succ edges ✓' },
      { re: 'if\\s+s\\s+not\\s+in\\s+seen', flags: '', must: true, hint: 'Visit each node once: if s not in seen: seen.add(s); queue.append(s).', pass: 'visited set ✓' },
      { re: 'reachable_from_entry\\(\\s*cfg\\.entry\\s*\\)', flags: '', must: true, hint: 'In check_unreachable, call reachable_from_entry(cfg.entry).', pass: 'uses real reachability ✓' },
      { re: 'n\\.kind\\s+in\\s+\\(\\s*"stmt"\\s*,\\s*"test"\\s*,\\s*"loop"\\s*\\)', flags: '', must: true, hint: 'Only report real statements: n.kind in ("stmt", "test", "loop"). Do not report the synthetic exit node.', pass: 'filters node kinds ✓' },
      { re: '"ML003"', flags: '', must: true, hint: 'Use the rule code "ML003".', pass: 'rule code ✓' },
      { re: 'if\\s+not\\s+n\\.pred', flags: '', must: false, hint: 'Do not use "has no predecessor" as the unreachability test. A dead loop has a back edge.', pass: 'no predecessor shortcut ✓' }
    ],
    run: `Put <code>ml003.py</code> in the same folder as <code>minilint.py</code> (the worked example) and run <code>python3 ml003.py</code>. Verified output:<pre><code>line 4: ML003 f: unreachable code
line 11: ML003 g: unreachable code
line 14: ML003 g: unreachable code</code></pre>Line 4 covers the dead <code>print</code> and the dead <code>while</code> loop on lines 5–6. Line 11 is after <code>continue</code>. Line 14 is after <code>while True</code> with no <code>break</code>. To run the capstone's own tests, save the following as <code>test_minilint.py</code> next to <code>minilint.py</code> and run <code>python3 -m unittest -v test_minilint</code>, which should report 6 tests OK:<pre><code>import textwrap
import unittest

from minilint import analyze_source


def codes(src):
    return [(line, code) for _, line, code, _ in analyze_source(textwrap.dedent(src))]


class MiniLintTest(unittest.TestCase):
    def test_if_without_else_is_possibly_uninitialized(self):
        self.assertEqual(codes("""
            def f(c):
                if c:
                    x = 1
                return x
        """), [(5, "ML001")])

    def test_both_branches_assign_is_clean(self):
        self.assertEqual(codes("""
            def f(c):
                if c:
                    x = 1
                else:
                    x = 2
                return x
        """), [])

    def test_overwritten_value_is_dead_store(self):
        self.assertEqual(codes("""
            def f():
                y = 1
                y = 2
                return y
        """), [(3, "ML002")])

    def test_loop_carried_value_is_live(self):
        self.assertEqual(codes("""
            def f(xs):
                acc = 0
                for x in xs:
                    acc = acc + x
                return acc
        """), [])

    def test_while_true_only_exits_via_break(self):
        self.assertEqual(codes("""
            def f():
                while True:
                    v = input()
                    if v:
                        break
                return v
        """), [])

    def test_except_path_reaches_use(self):
        self.assertEqual(codes("""
            def f(g):
                try:
                    r = g()
                except ValueError:
                    pass
                return r
        """), [(7, "ML001")])


if __name__ == "__main__":
    unittest.main()</code></pre>`,
    solution: "\"\"\"ML003 unreachable-code: a statement no path from entry can reach.\nRun next to minilint.py:  python3 ml003.py\"\"\"\nimport ast\nimport textwrap\nfrom collections import deque\n\nfrom minilint import CFGBuilder\n\n\ndef reachable_from_entry(entry):\n    \"\"\"BFS over successor edges. 'Has a predecessor' is NOT enough:\n    a dead loop body has predecessors (its own back edge) but no path from entry.\"\"\"\n    seen = {entry}\n    queue = deque([entry])\n    while queue:\n        node = queue.popleft()\n        for s in node.succ:\n            if s not in seen:\n                seen.add(s)\n                queue.append(s)\n    return seen\n\n\ndef check_unreachable(fn):\n    cfg = CFGBuilder().build_function(fn)\n    live = reachable_from_entry(cfg.entry)\n    findings = []\n    for n in cfg.nodes:\n        if n not in live and n.kind in (\"stmt\", \"test\", \"loop\"):\n            findings.append((n.line, \"ML003\", f\"{fn.name}: unreachable code\"))\n    # report only the first line of each dead region, like most linters\n    findings.sort()\n    first_lines, last = [], None\n    for f in findings:\n        if last is None or f[0] > last + 1:\n            first_lines.append(f)\n        last = f[0]\n    return first_lines\n\n\nSRC = textwrap.dedent('''\n    def f(x):\n        return x\n        print(\"never\")\n        while x:\n            x -= 1\n\n    def g(xs):\n        for v in xs:\n            continue\n            v += 1\n        while True:\n            pass\n        return 0\n''')\n\nif __name__ == \"__main__\":\n    tree = ast.parse(SRC)\n    for node in tree.body:\n        if isinstance(node, ast.FunctionDef):\n            for line, code, msg in check_unreachable(node):\n                print(f\"line {line}: {code} {msg}\")\n",
    notes: [
      `With the predecessor shortcut, the dead <code>while x:</code> loop in <code>f</code> would not be reported, because its header has a predecessor: the back edge from its own body.`,
      `Compare with Pylint 4.1: <code>pylint --disable=all --enable=unreachable</code> on the same sample reports W0101 on lines 4 and 11, but not line 14. Pylint does not treat code after a <code>while True:</code> loop with no <code>break</code> as dead, and a CFG-based reachability check does.`,
      `To wire ML003 into minilint, call <code>check_unreachable</code> from <code>analyze_function</code> and replace its <code>reachable</code> set with <code>reachable_from_entry(cfg.entry)</code>, so the other two checks also skip dead code.`
    ]
  },
  quiz: [
    {
      q: 'How does minilint detect a possibly uninitialised read?',
      options: ['It runs the function with random inputs', 'It seeds a pseudo-definition (v, <uninit>) at entry and reports a use where that pseudo-def still reaches', 'It checks whether the name appears anywhere earlier in the file', 'It asks mypy'],
      correct: 1,
      explain: 'Reaching definitions with an "undefined" definition at entry. Real assignments kill it on their path, and if it survives to a use, some path skips every assignment.'
    },
    {
      q: 'Why did `while True: line = input(); if line: break; return line` produce a false positive before the fix?',
      options: ['input() is a source', 'The CFG gave the loop a fall-through exit from its header, but `while True` can only exit through break', 'Liveness was wrong', 'Python has no while True'],
      correct: 1,
      explain: 'The fall-through edge created a path to the return on which line was never assigned. Removing it for constant-true conditions fixed the false positive, and a test keeps it fixed.'
    },
    {
      q: 'minilint skips variables captured by nested functions. What kind of decision is that?',
      options: ['A soundness compromise taken to avoid a class of false positives', 'A performance optimisation with no effect on results', 'Required by Python semantics', 'A bug'],
      correct: 0,
      explain: 'Closures read variables when they run, not where they are defined, so a flow-sensitive check misfires (for example functools.singledispatch). Skipping them avoids those false positives and gives up any bugs in closures.'
    },
    {
      q: 'What found the `result` bug that Pylint and pyflakes did not report?',
      options: ['Name-based unused checks', 'Modelling the edge from inside the try body to the except handler, then running reaching definitions', 'Type inference', 'Regex matching'],
      correct: 1,
      explain: 'The handler can be reached before result is assigned. A flow-sensitive analysis over a CFG that includes exception edges sees that path.'
    },
    {
      q: 'In an interview whiteboard design for an analyzer, which item is most often forgotten?',
      options: ['Naming the parser', 'Stating sources of unsoundness and how precision and recall will be measured', 'Choosing a programming language', 'Drawing the AST'],
      correct: 1,
      explain: 'Strong answers end with limits and evaluation: what the analysis misses, which false positives it produces, and how to measure both. That is what separates a research engineer from someone who only implements.'
    }
  ],
  testFlow: {
    title: 'Test yourself: debug the analyzer',
    start: 'q1',
    nodes: {
      q1: { q: 'minilint flags `x` in `if flag: x = 1` … `if flag: print(x)`. What is the category?', choices: [ { text: 'Path-insensitivity false positive (correlated branches)', to: 'q1_ok' }, { text: 'A real bug', to: 'q1_bug' }, { text: 'A CFG construction error', to: 'q1_cfg' } ] },
      q1_ok: { end: true, correct: true, text: 'Right. The CFG contains the path "first if false, second if true", which cannot actually run. Fixes are trace partitioning or an SMT feasibility check.', next: 'q2' },
      q1_bug: { end: true, correct: false, text: 'It cannot fail at runtime as long as flag does not change between the two ifs. It is a false positive.', retry: 'q1' },
      q1_cfg: { end: true, correct: false, text: 'The CFG is correct: both ifs have two successors. The imprecision comes from merging facts at the join regardless of the branch outcome.', retry: 'q1' },
      q2: { q: 'A dead-store warning fires on `a, b = divmod(n, 10)` when only `a` is used. Best response?', choices: [ { text: 'Exempt unpacking targets: the idiom is intentional', to: 'q2_ok' }, { text: 'Keep it: the value is indeed unused', to: 'q2_keep' } ] },
      q2_ok: { end: true, correct: true, text: 'Yes. It is technically true and practically noise. Pyflakes and Pylint make the same choice, and _ is the explicit opt-out.', next: 'q3' },
      q2_keep: { end: true, correct: false, text: 'It is technically correct, but developers will suppress the rule. Precision as developers perceive it is what keeps a check enabled.', retry: 'q2' },
      q3: { q: 'Your corpus run shows 120 ML002 findings. What is the most informative next step?', choices: [ { text: 'Randomly sample about 30, triage them by hand, and categorise the false positives', to: 'q3_ok' }, { text: 'Report "120 bugs found"', to: 'q3_bad' } ] },
      q3_ok: { end: true, correct: true, text: 'Correct. A sampled precision estimate plus false-positive categories tells you which improvement buys the most, and it is what a reviewer or interviewer will ask for.' },
      q3_bad: { end: true, correct: false, text: 'Untriaged counts are not results. Some of those findings are intentional or are false positives.', retry: 'q3' }
    }
  },
  pitfalls: [
    `Reporting "found N bugs" from a corpus run without triage. Always sample, label and categorise.`,
    `Treating "has a predecessor" as reachability. Dead cycles have predecessors.`,
    `Analysing nested function bodies as part of the outer function. Python 3 scopes do not leak, and doing so produced dozens of bogus "never assigned" reports on the stdlib until it was fixed.`,
    `Counting <code>del x</code> as a store. It removes the binding and requires it to exist, so it behaves like a read for liveness.`,
    `Shipping a check without a regression test for each false positive you fixed. The <code>while True</code> fix would have regressed silently without one.`
  ],
  interview: [
    {
      q: 'Walk me through a static analyzer you built.',
      a: `Use the capstone as the template: "minilint finds possibly-uninitialised locals and dead stores in Python. The pipeline is ast.parse, then a statement-level CFG per function, with if, loops, break and continue, try edges to every handler, and with. On that CFG, a single worklist solver runs reaching definitions forward, seeded with an undefined pseudo-definition per local, and liveness backward. ML001 is 'the pseudo-def reaches a use' and ML002 is 'the def is not live after it'. I tested each construct with unit tests, compared against Pylint and pyflakes (it finds the try/except and loop-without-break cases they miss), and ran it over the stdlib. Triage showed two false-positive families, correlated branches and always-raising helpers, which point to path sensitivity and no-return summaries as next steps. The main compromise was skipping closure-captured variables." Then stop and let them choose what to dig into.`
    },
    {
      q: 'Whiteboard: design a "possibly None dereference" checker for Python.',
      a: `IR: a CFG per function as in minilint. Domain: map each variable to an element of a small lattice {⊥, NotNone, None, Maybe}, ordered with Maybe as top. Transfer functions: <code>x = None</code> gives None. <code>x = Foo()</code> gives NotNone. A call result is Maybe unless the callee is annotated as returning a non-Optional type or has a summary. On edges, the guard <code>if x is not None</code> refines x to NotNone on the true edge and to None on the false edge. That is the abstract-interpretation lesson's meet-with-guard, and it is also what Pyright does for narrowing. Join at merges, forward direction, finite height, so no widening. Check: <code>x.attr</code> or <code>x(...)</code> where x is None reports an error, and where x is Maybe reports a warning. Interprocedural: use type annotations as summaries, as NullAway does in Java, to stay fast and modular. Unsound points: attributes (<code>self.x</code> can be changed by other code), which you either invalidate at calls or treat optimistically. Evaluate on a corpus with triage, and compare against Pyright's <code>reportOptionalMemberAccess</code>.`
    },
    {
      q: 'Tradeoff: should your analyzer be sound?',
      a: `It depends on the user and the cost of each kind of error. For a verifier of safety-critical code, yes: false alarms cost expert time, but a missed bug can cost far more. For a developer-facing linter in CI, generally no: aim for high precision and accept documented unsoundness, because tools whose false-positive rate gets too high stop being used (Google's Tricorder and Meta's Infer reports both stress the actionable rate). Rice's theorem says we cannot have sound, complete and terminating together, so a tool has to choose. My minilint is sound-leaning on the paths it models (may-analysis, conservative try edges) and deliberately unsound for closures, because that removes a large category of noise. I would document that and measure precision on triaged samples.`
    },
    {
      q: 'How does the worklist algorithm terminate, and what is its complexity?',
      a: `Facts form a finite lattice (powersets of definitions or variables) and the gen/kill transfer functions are monotone, so each node's value can only grow (for a may-analysis) and only as many times as the lattice height. Each change re-enqueues only the dependents. The total work is O(height × edges) set operations, which with bit vectors means word operations. Reverse postorder iteration makes it converge in a few passes on reducible CFGs. For infinite-height domains like intervals you add widening at loop heads.`
    },
    {
      q: 'How would you make this analyzer interprocedural without exploding in cost?',
      a: `Use summaries computed bottom-up over the call graph's SCCs, the way Infer works. For each function compute a compact summary: does it always raise (no-return)? Which parameters does it read or mutate? Can it return None? A caller applies the summary at the call site instead of re-analysing the callee. This is compositional, so it parallelises per function and supports incremental re-analysis when one function changes. Mutual recursion is handled by iterating the summaries within an SCC to a fixpoint. The call graph comes from CHA over the class hierarchy, refined by types (pointer-and-callgraph lesson). Dynamic features (getattr, monkey patching) get a conservative default summary and a soundiness note.`
    },
    {
      q: 'How would you use LLMs together with a static analyzer like this?',
      a: `In three directions. (1) <b>Analyzer feeds LLM:</b> give a repair model the finding plus CFG and def-use context (the path on which a variable is unassigned), which grounds the patch. Then re-run the analyzer and tests on the patch as a cheap verifier and reject patches that introduce new findings. (2) <b>LLM feeds analyzer:</b> use the model to draft source, sink and sanitizer specs or library summaries, which are the bottleneck in taint analysis, and validate each spec on labelled examples before trusting it. (3) <b>LLM triages analyzer output:</b> rank or filter false positives using the code context, measured against human-labelled triage, because the classifier itself can be wrong. In every case the analyzer provides guarantees and the LLM provides coverage of the long tail. Evaluate on held-out projects to avoid training-set contamination.`
    },
    {
      q: 'What did you learn from running minilint on the standard library?',
      a: `Three things. First, scoping bugs appear only at scale. The initial version treated nested function bodies as part of the outer function and reported dozens of "never assigned" findings, and three Python-specific fixes (scopes, imports binding names, sequential with items) were needed before the results were believable. Second, the remaining false positives fall into families that match the theory: path-insensitivity (correlated <code>if message:</code> checks) and missing interprocedural facts (helpers that always raise). Third, true positives exist even in well-reviewed code, such as an assigned-and-never-read <code>i = round(n)</code> in <code>gettext</code>. That is the case for running analyzers in CI. The general lesson: a corpus run plus triage changes your roadmap more than any micro-benchmark.`
    }
  ]
};
