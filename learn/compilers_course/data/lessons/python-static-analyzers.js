window.LESSONS = window.LESSONS || {};
window.LESSONS['python-static-analyzers'] = {
  id: 'python-static-analyzers',
  title: 'Python Static Analyzers: Pylint, Ruff, mypy/Pyright, Bandit, Semgrep',
  category: 'Part 4 — Static Analyzers in the Wild',
  timeMin: 40,
  summary: `Python ships no compiler that rejects bad programs, so the whole safety net is static analyzers bolted on from outside. They sit at very different points on the cost/precision curve: pyflakes and Ruff look at one file's AST and scopes, Pylint adds astroid's type inference, mypy and Pyright run a gradual type checker, Bandit and Semgrep match security patterns (Semgrep with taint tracking), Pysa runs interprocedural taint over a whole codebase, and vulture guesses at dead code with a confidence score. This lesson runs each of them on the same small file, shows how to write a custom rule for Pylint and Semgrep, and ends with the argument interviewers want to hear: by Rice's theorem every one of these tools is either unsound, incomplete, or both, and the engineering question is which kind of wrong you can afford.`,
  goals: [
    `Place pyflakes, Ruff, Pylint, mypy/Pyright, Bandit, Semgrep, Pysa and vulture by what they look at (tokens, AST, inferred types, dataflow) and what they can and cannot find`,
    `Write a working Pylint checker plugin on astroid nodes and load it with --load-plugins`,
    `Write a Semgrep rule with pattern-inside, metavariable-regex and fix, and test it with semgrep --test`,
    `Explain gradual typing: what Any does, why unannotated functions are not checked by default, and what --strict changes`,
    `Argue precision vs recall and soundness vs completeness using Rice's theorem, and say why most linters choose to be unsound`
  ],
  concept: [
    {
      h: `One file, eight tools: what each one actually sees`,
      p: [
        `The fastest way to understand the ecosystem is to run all of it on one file. The file below has an unused import, a dead local, a <code>print</code>, a <code>time.sleep</code> in a test, a <code>shell=True</code> subprocess call, and a type error. Every tool here is real output from this course's sandbox (Pylint 4.1, Ruff 0.17, mypy 2.4, Bandit 1.9, vulture 2.16, pyflakes 4.0).`,
        `<table class="cmp"><tr><th>Tool</th><th>Looks at</th><th>Found on this file</th></tr>
<tr><td>pyflakes</td><td>AST + scope table of one module</td><td>unused <code>os</code>, unused local <code>unused</code></td></tr>
<tr><td>Ruff (F, E, B, S)</td><td>Its own Rust parser, AST + semantic model</td><td>F401, F841, S101 assert, S602 shell=True</td></tr>
<tr><td>Pylint + plugin</td><td>astroid tree with inference</td><td>W0612 unused-variable, plus our custom W9001/W9002</td></tr>
<tr><td>mypy</td><td>Types (annotations + inference)</td><td><code>add("1", 2)</code> arg-type error</td></tr>
<tr><td>Bandit</td><td>AST, security plugin tests</td><td>B404 import subprocess, B101 assert, B602 shell=True</td></tr>
<tr><td>vulture</td><td>Defined-but-never-referenced names</td><td>unused import 90%, unused variable 60%, unused function <code>run</code> 60%</td></tr></table>`,
        `Notice the overlap: three tools report the unused import, three report <code>shell=True</code>. That is not waste. Ruff re-implemented the rule sets of pyflakes, pycodestyle, flake8-bugbear, flake8-bandit (the S codes), pyupgrade (UP) and dozens more, keeping their codes, so a project can delete five tools and keep its config vocabulary. What Ruff does <i>not</i> do is cross-module type inference; that is still mypy/Pyright territory.`
      ],
      code: `$ PYTHONPATH=. pylint --load-plugins=no_print_checker \\
    --disable=all --enable=sleep-in-test,print-call,unused-variable test_sample.py
test_sample.py:8:4: W9002: print() call; use logging (print-call)
test_sample.py:7:4: W0612: Unused variable 'unused' (unused-variable)
test_sample.py:13:4: W9001: time.sleep() in test 'test_wait'; wait on a condition instead (sleep-in-test)

$ pyflakes test_sample.py
test_sample.py:2:1: 'os' imported but unused
test_sample.py:7:5: local variable 'unused' is assigned to but never used

$ mypy test_sample.py
test_sample.py:25: error: Argument 1 to "add" has incompatible type "str"; expected "int"  [arg-type]

$ vulture test_sample.py
test_sample.py:2: unused import 'os' (90% confidence)
test_sample.py:7: unused variable 'unused' (60% confidence)
test_sample.py:17: unused function 'run' (60% confidence)`
    },
    {
      h: `Linters: pyflakes, flake8, Ruff and Pylint`,
      p: [
        `<b>pyflakes</b> parses with the standard <code>ast</code> module and walks it with a scope stack (module, class, function, comprehension). It reports only things that are almost certainly bugs: undefined names, unused imports and locals, redefinitions, f-strings without placeholders. It deliberately never reports style, which is why its false-positive rate is very low. <b>flake8</b> is a driver: it runs pyflakes (F codes), pycodestyle (E/W) and mccabe (C90), and loads plugins registered under the <code>flake8.extension</code> entry point, each of which receives the AST or the token stream.`,
        `<b>Ruff</b> is a Rust reimplementation of that whole plugin ecosystem with one parser and one pass over the tree, which is why it is typically one to two orders of magnitude faster and can run on save. You select rule families by prefix in <code>pyproject.toml</code>. It also has an autofixer: fixes are tagged safe or unsafe, and unsafe ones (deleting an assignment whose right-hand side might have side effects) need <code>--unsafe-fixes</code>. The catch is that Ruff rules are compiled into the binary; you cannot add a project-specific rule without forking Ruff.`,
        `<b>Pylint</b> is slower and noisier, but it is built on <b>astroid</b>, an AST library that adds inference: <code>node.infer()</code> yields the possible values of an expression, following imports, assignments and simple calls. That is how Pylint can say <code>no-member</code> (attribute not on the inferred class) or <code>possibly-used-before-assignment</code>. And it has a real plugin API: subclass <code>BaseChecker</code>, define <code>visit_&lt;nodetype&gt;</code> methods on astroid nodes (lowercased class names: <code>visit_call</code>, <code>visit_functiondef</code>), declare messages, and register.`
      ],
      code: `# pyproject.toml
[tool.ruff]
line-length = 100
target-version = "py310"

[tool.ruff.lint]
select = ["F", "E", "W", "B", "S", "UP", "I"]   # pyflakes, pycodestyle, bugbear, bandit, pyupgrade, isort
ignore = ["E501"]

[tool.ruff.lint.per-file-ignores]
"tests/*" = ["S101"]          # assert is fine in tests

$ ruff check --select S,B,UP --output-format concise checks.py
checks.py:7:12: S301 pickle and modules that wrap it can be unsafe when used to deserialize untrusted data, ...
checks.py:8:11: S506 Probable use of unsafe yaml.load. Allows instantiation of arbitrary objects. Consider yaml.safe_load.
checks.py:9:5: S602 subprocess call with shell=True identified, security issue`
    },
    {
      h: `Type checkers: mypy and Pyright, and what "gradual" means`,
      p: [
        `mypy and Pyright implement the same typing spec (PEPs 484, 526, 544, 612...) with different engines: mypy is written in Python (compiled with mypyc) and is the reference implementation; Pyright is written in TypeScript, powers Pylance in VS Code, and is lazy and incremental, which makes it fast in an editor. Both do flow-sensitive <b>narrowing</b>: after <code>if v is not None:</code>, the type of <code>v</code> inside the branch is <code>int</code> rather than <code>int | None</code>. That narrowing is a small dataflow analysis over the function's CFG, exactly the kind from the dataflow lesson.`,
        `<b>Gradual typing</b> means static and dynamic typing coexist. The type <code>Any</code> is compatible in both directions with every type: you can assign an <code>Any</code> to an <code>int</code> and an <code>int</code> to an <code>Any</code>, and no error is reported. That is what makes it possible to annotate a large codebase incrementally, and it is also a deliberate hole in soundness: a value typed <code>Any</code> can flow anywhere. Unannotated functions are treated as returning and taking <code>Any</code>, and mypy does not even type-check their bodies by default (<code>--check-untyped-defs</code> turns that on). <code>--strict</code> enables a bundle of flags, including <code>--disallow-untyped-defs</code>, so missing annotations become errors.`,
        `<code>reveal_type(expr)</code> is a pseudo-function the checker understands; it prints the inferred type at that point. It is the type-checker equivalent of a print statement, and the quickest way to debug "why does mypy think this is Optional".`
      ],
      code: `from typing import Any, Optional

def lookup(d: dict[str, int], key: str) -> Optional[int]:
    return d.get(key)

def untyped(x):              # not checked at all by default
    return x + 1

def caller() -> int:
    v = lookup({"a": 1}, "a")
    reveal_type(v)
    n: Any = "oops"
    ok: int = n              # Any is compatible with int: no error, unsound by design
    return v + 1             # v may be None

$ mypy gradual.py
gradual.py:14: note: Revealed type is "int | None"
gradual.py:17: error: Unsupported operand types for + ("None" and "int")  [operator]
gradual.py:17: note: Left operand is of type "int | None"

$ mypy --strict gradual.py
gradual.py:8: error: Function is missing a type annotation  [no-untyped-def]
gradual.py:14: note: Revealed type is "int | None"
gradual.py:17: error: Unsupported operand types for + ("None" and "int")  [operator]`
    },
    {
      h: `Security analyzers: Bandit, Semgrep, Pysa`,
      p: [
        `<b>Bandit</b> parses each file with <code>ast</code> and runs plugin tests keyed by node type (calls, imports, strings). Each finding has a test id (B602 subprocess with shell=True, B301 pickle, B506 yaml.load, B105 hardcoded password string), a severity and a confidence. It has no dataflow at all: <code>subprocess.call("ls", shell=True)</code> with a constant string is flagged exactly like one built from user input. That makes it high recall for "dangerous API used" and low precision for "exploitable".`,
        `<b>Semgrep</b> matches code patterns written in the target language's own syntax, with <code>...</code> for "anything" and <code>$X</code> metavariables. Patterns combine with <code>patterns</code> (AND), <code>pattern-either</code> (OR), <code>pattern-not</code>, <code>pattern-inside</code>, and metavariable filters. It understands the AST, not text, so <code>requests.get(url, timeout=5)</code> matches <code>requests.$M(..., timeout=$T, ...)</code> regardless of argument order and formatting. <code>mode: taint</code> switches to intraprocedural (and, in the paid engine, cross-function) source-to-sink tracking with sanitizers, the subject of the taint-analysis lesson.`,
        `<b>Pysa</b> (Meta, part of the Pyre type checker) is the heavyweight: interprocedural taint analysis over a whole program, using Pyre's types to resolve calls. You declare sources, sinks and features in a <code>taint.config</code> JSON file and attach them to functions with <code>.pysa</code> model files written as stub signatures, for example <code>def os.system(command: TaintSink[RemoteCodeExecution]): ...</code>. It computes per-function summaries bottom-up over the call graph to scale, the same summary idea Infer uses on the Java side.`
      ],
      code: `$ bandit -q -f custom --msg-template "{line}: {test_id} [{severity}/{confidence}] {msg}" checks.py
1: B404 [LOW/HIGH] Consider possible security implications associated with the subprocess module.
2: B403 [LOW/HIGH] Consider possible security implications associated with pickle module.
7: B301 [MEDIUM/HIGH] Pickle and modules that wrap it can be unsafe when used to deserialize untrusted data, possible security issue.
8: B506 [MEDIUM/HIGH] Use of unsafe yaml load. Allows instantiation of arbitrary objects. Consider yaml.safe_load().
9: B602 [HIGH/HIGH] subprocess call with shell=True identified, security issue.

# rules.yaml -- a Semgrep rule with a negative pattern, a regex filter and an autofix
rules:
  - id: requests-without-timeout
    languages: [python]
    severity: WARNING
    message: requests.$METHOD() without timeout= can hang forever
    patterns:
      - pattern: requests.$METHOD($...ARGS)
      - pattern-not: requests.$METHOD(..., timeout=$T, ...)
      - metavariable-regex:
          metavariable: $METHOD
          regex: ^(get|post|put|delete|head|patch)$
    fix: requests.$METHOD($...ARGS, timeout=10)

$ semgrep --metrics=off --config rules.yaml --autofix --dryrun net.py
   Autofix > requests.get(url, timeout=10)
        4| a = requests.get(url, timeout=10)`
    },
    {
      h: `Precision, recall, and why every analyzer is wrong somehow`,
      p: [
        `Treat a checker as a classifier over program locations. A <b>false positive</b> is a warning on correct code; a <b>false negative</b> is a real bug it misses. <b>Precision</b> = TP / (TP + FP), <b>recall</b> = TP / (TP + FN). In analysis vocabulary, a <b>sound</b> analysis (for a given property) has no false negatives: if it says "no null dereference", there is none. A <b>complete</b> analysis has no false positives: everything it reports can actually happen.`,
        `<b>Rice's theorem</b> says every non-trivial semantic property of programs (does this variable ever hold None at this line, does user input ever reach this call) is undecidable. So no analyzer can be sound, complete and terminating on all programs. Real tools pick a side. Abstract interpreters and type systems lean sound and pay with false positives. Bug finders lean complete-ish (they report things they are confident about) and pay with false negatives. Python tools are almost all on the second side, and on top of that the language itself (dynamic attributes, <code>eval</code>, monkey-patching, <code>Any</code>) defeats soundness claims.`,
        `The practical constraint is human: developers stop reading a tool's output once a noticeable fraction is wrong, and Google's published experience with Tricorder and Error Prone puts the tolerable "effective false positive" rate (warnings developers do not act on) at around ten percent. That is why pyflakes keeps a tiny rule set, why Ruff splits safe and unsafe fixes, why Bandit reports a confidence, and why vulture prints a percentage: 100% for unreachable code after return, 90% for imports, 60% for functions and attributes that might be called dynamically.`
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: `The harder parts: how astroid inference actually works, how a type checker narrows, how Semgrep matches, and how Pysa scales.`,
    sections: [
      {
        h: `astroid inference: lazy, generator-based, and allowed to give up`,
        p: [
          `astroid builds its tree from <code>ast</code>, then decorates nodes with <code>infer()</code>, a generator yielding every value the node might evaluate to. Inferring a <code>Name</code> looks it up in the scope, follows each assignment, and recursively infers the right-hand side; a call infers the callee, then infers the function's return statements with arguments bound (a bounded form of context sensitivity). Imports are resolved by actually loading the target module's source into an astroid tree, cached in a manager. When inference cannot decide, it yields <code>Uninferable</code>, and well-behaved checkers treat that as "say nothing". That single convention is the whole reason Pylint is noisy but not absurd: precision is bought by silence on unknowns.`,
          `For C extensions and heavily dynamic libraries astroid uses <b>brain</b> plugins: hand-written transforms that tell it, for example, what attributes a namedtuple, an enum or numpy objects have. A Pylint <code>no-member</code> false positive on a library is almost always a missing brain.`
        ],
        code: `import astroid
node = astroid.extract_node("""
def make():
    return [1, 2]
make()  #@
""")
print([n.as_string() for n in node.infer()])     # ['[1, 2]']`
      },
      {
        h: `How Semgrep matches, and where it stops`,
        p: [
          `Semgrep parses both the target and the pattern into a generic AST (it uses tree-sitter and language-specific parsers, translated into one shared representation), then matches pattern against target with unification of metavariables, treating <code>...</code> as a sequence wildcard over arguments or statements. It normalizes some equivalences: keyword argument order, <code>import x as y</code> aliasing, and constant propagation so that a string assigned to a variable still matches a literal pattern. In <code>mode: taint</code> the open-source engine tracks taint through assignments within a function; cross-function and cross-file taint are features of the commercial Pro engine. So "Semgrep missed it" is often "the flow crossed a function boundary".`
        ]
      },
      {
        h: `Type narrowing is dataflow analysis`,
        p: [
          `When mypy checks <code>if x is not None: return x + 1</code>, it maintains a map from expressions to narrowed types along each branch of the function's control flow, joins those maps where branches merge (the join of <code>int</code> and <code>None</code> is <code>int | None</code>), and invalidates narrowings on assignment. That is a forward, flow-sensitive analysis over a type lattice, solved by walking the AST in order rather than with a general worklist. Narrowing is intentionally not interprocedural: a call to <code>self.reset()</code> does not invalidate <code>self.x</code>'s narrowed type, which is unsound but would otherwise make narrowing almost useless on attributes. Pyright has the same policy. <code>TypeGuard</code>/<code>TypeIs</code> functions let you declare a custom narrowing predicate.`
        ]
      },
      {
        h: `Pysa: summaries, models, and features`,
        p: [
          `Pysa analyzes each function once to a summary: which parameters flow to which sinks, and which sources flow to the return value. It processes the call graph bottom-up (strongly connected components iterated to a fixpoint), and at a call site it applies the callee's summary instead of re-analyzing its body, which is the IFDS-style idea of procedure summaries in practical form. Library code without source is handled by <code>.pysa</code> models; anything unmodeled gets a default "taint flows through arguments to return" approximation (an "obscure" model). Findings carry <i>features</i> such as whether taint passed through a string format or a type conversion, which you filter on to cut false positives. Getting precise call resolution depends on Pyre type information, so un-annotated code loses precision.`
        ],
        code: `# taint.config (excerpt) and a .pysa model
{
  "sources": [{ "name": "UserControlled" }],
  "sinks":   [{ "name": "RemoteCodeExecution" }],
  "rules": [{ "name": "RCE", "code": 5001,
              "sources": ["UserControlled"], "sinks": ["RemoteCodeExecution"],
              "message_format": "User data flows into a shell command" }]
}

# models/stdlib.pysa
def os.system(command: TaintSink[RemoteCodeExecution]): ...
def django.http.request.HttpRequest.__init__(self) -> TaintSource[UserControlled]: ...`
      }
    ]
  },
  story: {
    onePiece: {
      title: `Eight Lookouts on the Sunny, Each With a Different Telescope`,
      text: [
        `Before the Sunny enters a new island's harbor, Nami posts lookouts. Usopp with his slingshot goggles only checks one thing: is anything in the water that has no business being there? He almost never cries wolf, but he misses anything that looks normal. Chopper, a fast little reindeer, runs every rail and rope in a minute flat, checking a long printed checklist; he catches a lot, but only what is on his list.`,
        `Robin reads the whole harbor, infers who works for whom, and says "that dock worker is actually a Marine" even when nobody told her. She is right often, and sometimes wrong, and when she cannot tell she stays quiet. Franky checks that every crate is labeled with what is in it and refuses cargo marked "unknown" only when Nami tells him to be strict.`,
        `Zoro looks for swords: any blade on deck gets reported, whether it is a carving knife in Sanji's kitchen or an assassin's dagger. Jinbe follows currents: he traces where anything dropped at the pier could drift to, and only shouts if it would reach the ship's hull without passing the net. Nami's rule for the crew: nobody is perfect, so know which lookout cries wolf and which one sleeps.`
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: `Sheldon Proofreads the Paper Four Different Ways`,
      text: [
        `Leonard asks for a quick look at his paper. Raj checks spelling in ten seconds and flags only words that are definitely wrong. Howard runs a giant checklist of style rules and returns forty comments, half of which Leonard ignores. Sheldon refuses to sign off until every equation's units are declared, and says "untyped variables are an affront", except where Leonard wrote "units: whatever", which Sheldon grudgingly lets through.`,
        `Amy only reads the methods section, tracing whether any contaminated sample could have reached the final result. Penny's verdict: "So the one who complains the most is not the most useful one?" Exactly.`
      ]
    },
    why: `Usopp is pyflakes (tiny, precise rule set), Chopper is Ruff (huge checklist, very fast, only what is compiled in), Robin is Pylint's astroid inference (guesses types, stays silent on Uninferable), Franky is mypy with --strict as the strict mode and "unknown" as Any, Zoro is Bandit (flags every dangerous API without dataflow), and Jinbe is taint analysis in Semgrep/Pysa (only reports when a source reaches a sink without a sanitizer). The point is the tradeoff: each tool is wrong in a characteristic direction.`
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'ship', emoji: '⛵', label: 'test_sample.py', x: 50, y: 50 },
      { id: 'imp', emoji: '📦', label: 'import os (unused)', x: 12, y: 14 },
      { id: 'sleep', emoji: '⏰', label: 'time.sleep in test', x: 88, y: 14 },
      { id: 'shell', emoji: '🗡️', label: 'shell=True', x: 12, y: 84 },
      { id: 'type', emoji: '🏷️', label: 'add("1", 2)', x: 88, y: 84 }
    ],
    actors: [
      { id: 'usopp', emoji: '🎯', label: 'Usopp (pyflakes)', x: 30, y: 30 },
      { id: 'robin', emoji: '📖', label: 'Robin (Pylint)', x: 70, y: 30 },
      { id: 'zoro', emoji: '⚔️', label: 'Zoro (Bandit)', x: 30, y: 70 },
      { id: 'franky', emoji: '🤖', label: 'Franky (mypy)', x: 70, y: 70 }
    ],
    steps: [
      { c: `One file, four lookouts. Each one has a different telescope and will see different things.` },
      { c: `Usopp (pyflakes) checks scopes only: an import nobody uses. Certain, cheap, reported.`, a: { usopp: [18, 22] }, p: { imp: 'bad' } },
      { c: `Robin (Pylint) runs a custom plugin and spots time.sleep inside test_wait: a flaky-test smell nobody else is looking for.`, a: { robin: [80, 22] }, p: { sleep: 'bad' } },
      { c: `Zoro (Bandit) sees a blade: subprocess.call with shell=True. He does not know if the string is user-controlled. He reports it anyway, HIGH severity.`, a: { zoro: [18, 76] }, p: { shell: 'bad' } },
      { c: `Franky (mypy) reads labels: "1" is a str where an int was declared. Only a type checker catches this.`, a: { franky: [80, 76] }, p: { type: 'bad' } },
      { c: `None of them saw everything, and Zoro may be crying wolf. That is Rice's theorem on deck: pick tools for the kind of wrong you can tolerate.`, p: { ship: 'lit' } },
      { c: `So Nami runs them all in CI: Ruff on every save, mypy on every push, Semgrep taint rules on every PR.`, p: { ship: 'good' }, l: { ship: 'CI: ruff + mypy + semgrep' } }
    ]
  },
  conceptFlow: {
    title: `How a Python analyzer turns source into a warning`,
    intro: `The same skeleton underlies every tool here; they differ in how far down the pipeline they go.`,
    stages: [
      { label: 'Parse', nodes: [ { id: 'src', text: 'source file' }, { id: 'tree', text: 'AST\n(ast / astroid / Ruff parser)' } ] },
      { label: 'Enrich', nodes: [ { id: 'scope', text: 'scopes + bindings\n(pyflakes, Ruff)' }, { id: 'infer', text: 'inference / types\n(astroid, mypy, Pyright)' }, { id: 'flow', text: 'dataflow / taint\n(Semgrep taint, Pysa)' } ] },
      { label: 'Match', nodes: [ { id: 'rules', text: 'rules / checkers\nvisit_call, patterns' } ] },
      { label: 'Report', nodes: [ { id: 'msg', text: 'file:line code msg\n+ severity / confidence' }, { id: 'fix', text: 'autofix\n(safe vs unsafe)' } ] }
    ],
    steps: [
      { active: ['src', 'tree'], note: `Every tool starts by parsing. Ruff has its own Rust parser; the rest use Python's ast, astroid wraps ast with inference hooks.` },
      { active: ['scope'], note: `Scope analysis builds a symbol table per module, class, function and comprehension. Unused imports and undefined names fall out of this directly.` },
      { active: ['infer'], note: `Type inference: astroid yields possible values lazily, mypy and Pyright compute declared and narrowed types. This is where no-member and arg-type errors come from.` },
      { active: ['flow'], note: `Dataflow: tracking values along control flow and across calls. Semgrep taint mode within a function, Pysa across the whole call graph using summaries.` },
      { active: ['rules'], note: `Rules run over whatever was computed: a Pylint visit_call method, a Semgrep pattern, a Bandit plugin keyed on Call nodes.` },
      { active: ['msg'], note: `A finding is location + rule id + message, and good tools add severity and confidence so people can triage.` },
      { active: ['fix'], note: `Some rules attach a fix. Ruff marks fixes unsafe when they could change behavior, Semgrep rules can carry a fix template.` }
    ]
  },
  tech: [
    {
      q: `Why can Ruff be so much faster than flake8 with the same rules?`,
      a: `flake8 runs each plugin as separate Python code, and many plugins re-walk the tree or re-tokenize the file; startup and per-file overhead are paid in an interpreter. Ruff parses each file once in Rust, builds one semantic model (scopes, bindings, references), runs all enabled rules in a single traversal, parallelizes across files, and caches results keyed on file content. The rules are not smarter; the architecture removes redundant work. The tradeoff is extensibility: there is no plugin API, so a project-specific rule needs Semgrep, a Pylint plugin, or a flake8 plugin running alongside.`
    },
    {
      q: `What exactly is a Pylint message id like W9001, and how does it get to the output?`,
      a: `A checker declares <code>msgs = {"W9001": (template, symbolic-name, description)}</code>. The letter is the category (C convention, R refactor, W warning, E error, F fatal), and the number range 90xx is conventionally for plugins. <code>self.add_message("sleep-in-test", node=node, args=(name,))</code> fills the template with args and takes line and column from the node. Pylint's linter collects messages, applies enable/disable settings and inline <code># pylint: disable=</code> pragmas, and hands them to a reporter (text, json, parseable). <code>--disable=all --enable=...</code> is how you test one checker in isolation.`
    },
    {
      q: `Why does mypy not report anything inside a function with no annotations?`,
      a: `Gradual typing's design goal is that adding a type checker to existing code produces no errors until you opt in by annotating. A function with no annotations is "dynamically typed": parameters and return are <code>Any</code>, and mypy skips checking the body because nearly everything in it would involve <code>Any</code> anyway. <code>--check-untyped-defs</code> checks the body with <code>Any</code> parameters (catching e.g. calls with the wrong arity to typed functions), and <code>--disallow-untyped-defs</code> (part of <code>--strict</code>) makes the missing annotation itself an error. Pyright by default does infer return types of unannotated functions, which is one of the visible behavioral differences between the two.`
    },
    {
      q: `How does vulture decide its confidence numbers?`,
      a: `vulture collects every defined name (functions, classes, variables, attributes, imports) and every name that is used anywhere in the scanned files, then reports definitions that are never used. It cannot see dynamic access such as <code>getattr(obj, name)</code>, framework callbacks or entry points, so it assigns a fixed confidence per kind: 100% for code after return/raise (provably unreachable), 90% for unused imports, 60% for most other definitions. You filter with <code>--min-confidence</code> and keep a whitelist file of names that are used dynamically. It is an explicitly unsound and incomplete heuristic, honest about it.`
    }
  ],
  code: {
    title: `A Pylint checker plugin that flags flaky-test smells`,
    intro: `This plugin is the one that produced the W9001/W9002 output above. It shows the three parts every Pylint checker has: message table, visit methods on astroid nodes, and a register function. Save as <code>no_print_checker.py</code> next to <code>test_sample.py</code> (contents in the first section) and run the command at the bottom.`,
    code: `"""Pylint plugin: forbid print() calls and time.sleep() inside test functions."""
from astroid import nodes
from pylint.checkers import BaseChecker


class FlakyTestChecker(BaseChecker):
    name = "flaky-test"
    msgs = {
        "W9001": (
            "time.sleep() in test %r; wait on a condition instead",
            "sleep-in-test",
            "Fixed sleeps in tests are a classic source of timing flakiness.",
        ),
        "W9002": (
            "print() call; use logging",
            "print-call",
            "print() in library code bypasses log configuration.",
        ),
    }

    def visit_call(self, node: nodes.Call) -> None:
        func = node.func
        if isinstance(func, nodes.Name) and func.name == "print":
            self.add_message("print-call", node=node)
        if (isinstance(func, nodes.Attribute) and func.attrname == "sleep"
                and isinstance(func.expr, nodes.Name) and func.expr.name == "time"):
            scope = node.scope()          # nearest enclosing function/class/module
            if isinstance(scope, nodes.FunctionDef) and scope.name.startswith("test_"):
                self.add_message("sleep-in-test", node=node, args=(scope.name,))


def register(linter) -> None:
    linter.register_checker(FlakyTestChecker(linter))

# --- run it -----------------------------------------------------------
# $ pip install pylint
# $ PYTHONPATH=. pylint --load-plugins=no_print_checker \\
#       --disable=all --enable=sleep-in-test,print-call test_sample.py
# test_sample.py:8:4: W9002: print() call; use logging (print-call)
# test_sample.py:13:4: W9001: time.sleep() in test 'test_wait'; wait on a condition instead (sleep-in-test)`,
    notes: [
      `Matching <code>func.expr.name == "time"</code> is syntactic: <code>from time import sleep</code> or <code>import time as t</code> slip past. The more robust version calls <code>func.inferred()</code> / <code>safe_infer</code> and checks that the result is the function <code>time.sleep</code>, which is exactly what astroid inference is for.`,
      `<code>node.scope()</code> returns the nearest scope node, so a sleep inside a nested helper function in a test is attributed to the helper, not the test. Decide whether that is what you want.`,
      `For larger projects, register the plugin through <code>load-plugins</code> in <code>pyproject.toml</code> under <code>[tool.pylint.main]</code> instead of the command line.`
    ]
  },
  lab: {
    title: `Write a Semgrep rule: no time.sleep() inside test functions`,
    prompt: `Write a Semgrep rule with id <code>sleep-in-test</code> for Python that reports <code>time.sleep(...)</code> only when it is inside a function whose name starts with <code>test_</code>. Use <code>patterns</code> with <code>pattern-inside</code> binding the function name to <code>$FUNC</code>, a <code>metavariable-regex</code> on <code>$FUNC</code>, and the <code>time.sleep(...)</code> pattern. Include the function name in the message. A call in a non-test helper must not match.`,
    starter: `rules:
  - id: ???
    languages: [python]
    severity: WARNING
    message: ???
    patterns:
      - pattern-inside: |
          ???
      - metavariable-regex:
          metavariable: ???
          regex: ???
      - pattern: ???
`,
    checks: [
      { re: 'id:\\s*sleep-in-test', flags: '', must: true, hint: 'Set id: sleep-in-test', pass: 'rule id ✓' },
      { re: 'languages:\\s*\\[\\s*python\\s*\\]', flags: '', must: true, hint: 'languages: [python]', pass: 'language ✓' },
      { re: 'pattern-inside:\\s*\\|\\s*\\n\\s*def \\$FUNC\\(\\.\\.\\.\\):\\s*\\n\\s*\\.\\.\\.', flags: '', must: true, hint: 'pattern-inside should be a block: def $FUNC(...): followed by ... on the next line', pass: 'pattern-inside binds $FUNC ✓' },
      { re: 'metavariable:\\s*\\$FUNC', flags: '', must: true, hint: 'The metavariable-regex must filter $FUNC', pass: 'metavariable-regex on $FUNC ✓' },
      { re: 'regex:\\s*\\^test_', flags: '', must: true, hint: 'Anchor the regex: ^test_', pass: 'regex anchored ✓' },
      { re: '-\\s*pattern:\\s*time\\.sleep\\(\\.\\.\\.\\)', flags: '', must: true, hint: 'The main pattern is time.sleep(...)', pass: 'main pattern ✓' },
      { re: 'message:.*\\$FUNC', flags: '', must: true, hint: 'Interpolate $FUNC into the message', pass: 'message names the test ✓' },
      { re: '\\?\\?\\?', flags: '', must: false, hint: 'Replace every ??? placeholder', pass: 'no placeholders left ✓' }
    ],
    run: `Save the rule as <code>sleep-in-test.yaml</code>. Create <code>sleep-in-test.py</code> next to it with a helper calling <code>time.sleep(1)</code> preceded by the comment <code># ok: sleep-in-test</code>, and a <code>def test_upload():</code> calling <code>time.sleep(2)</code> preceded by <code># ruleid: sleep-in-test</code>. Then:<pre><code>pip install semgrep
semgrep --metrics=off --config sleep-in-test.yaml sleep-in-test.py
semgrep --metrics=off --test .        # checks the ruleid/ok annotations: "All tests passed"</code></pre>`,
    solution: `rules:
  - id: sleep-in-test
    languages: [python]
    severity: WARNING
    message: time.sleep() inside test $FUNC; poll for the condition instead
    patterns:
      - pattern-inside: |
          def $FUNC(...):
            ...
      - metavariable-regex:
          metavariable: $FUNC
          regex: ^test_
      - pattern: time.sleep(...)
`,
    notes: [
      `Verified with Semgrep 1.185: on a file with a sleeping helper and a sleeping test_upload, only the line inside test_upload matches, and <code>semgrep --test</code> reports "1/1: All tests passed".`,
      `Like the Pylint version, this is syntactic on the module name. Semgrep does resolve simple import aliases, so <code>import time as t; t.sleep(1)</code> still matches <code>time.sleep(...)</code>, but a sleep hidden in a helper the test calls is invisible: that needs an interprocedural tool.`,
      `<code>pattern-inside</code> with <code>...</code> as the body means "anywhere in the body", including nested blocks such as loops and with-statements.`
    ]
  },
  quiz: [
    {
      q: `Which tool would you reach for to catch <code>len(x) + "a"</code> where x is annotated as a list?`,
      options: [`pyflakes`, `Bandit`, `mypy or Pyright`, `vulture`],
      correct: 2,
      explain: `It is a type error (int + str). pyflakes and vulture only reason about names, Bandit about dangerous APIs. Only a type checker models operand types.`
    },
    {
      q: `Bandit reports B602 on <code>subprocess.call("ls -l", shell=True)</code>. What does that tell you about its analysis?`,
      options: [`It proved the string is user-controlled`, `It matches the API call shape without dataflow, so constant strings are flagged too`, `It ran the command in a sandbox`, `It used mypy types to resolve subprocess`],
      correct: 1,
      explain: `Bandit plugins inspect AST nodes, here a Call with shell=True. There is no source-to-sink tracking, which is why it has high recall for risky APIs and lower precision for real vulnerabilities.`
    },
    {
      q: `In mypy, <code>n: Any = "oops"; ok: int = n</code> produces:`,
      options: [`An incompatible-type error`, `No error, because Any is compatible with every type in both directions`, `A warning only under --strict`, `A runtime TypeError`],
      correct: 1,
      explain: `That bidirectional compatibility is the definition of Any in gradual typing, and it is a deliberate soundness gap. --strict does not change it; flags like --disallow-any-expr or warn-return-any narrow some uses.`
    },
    {
      q: `By Rice's theorem, an analyzer that decides "can this variable be None here" for all Python programs must:`,
      options: [`Be slower than linear time`, `Give up soundness, completeness, or termination on some programs`, `Require type annotations`, `Run the program`],
      correct: 1,
      explain: `The property is non-trivial and semantic, so it is undecidable. Any terminating analyzer must over-approximate (false positives), under-approximate (false negatives), or both.`
    },
    {
      q: `You need a project-specific rule enforced on every PR in a repo that already uses only Ruff. What is the lowest-friction option?`,
      options: [`Add a Ruff plugin`, `Write a Semgrep rule or a small Pylint plugin and run it alongside Ruff`, `Use vulture`, `Patch CPython`],
      correct: 1,
      explain: `Ruff rules are compiled into the binary and there is no plugin API. Semgrep rules are YAML and quick to write; a Pylint plugin gives you astroid inference when you need it.`
    }
  ],
  testFlow: {
    title: `Test yourself: which analyzer, which wrong`,
    start: 'q1',
    nodes: {
      q1: {
        q: `A team complains the security scanner flags 200 shell=True calls, almost all with constant strings. What is the most precise fix?`,
        choices: [
          { text: `Switch the rule to a taint rule: request data as source, subprocess with shell=True as sink`, to: 'q1_right' },
          { text: `Disable B602 globally`, to: 'q1_wrong_disable' },
          { text: `Add mypy --strict`, to: 'q1_wrong_mypy' }
        ]
      },
      q1_right: { end: true, correct: true, text: `Right. Pattern-only rules cannot tell a constant from user input; taint tracking adds the dataflow fact that makes the warning actionable, raising precision without giving up the real cases.`, next: 'q2' },
      q1_wrong_disable: { end: true, correct: false, text: `That raises precision by dropping recall to zero for that bug class, including the few real injections. Look for a way to keep the true positives.`, retry: 'q1' },
      q1_wrong_mypy: { end: true, correct: false, text: `Types say the argument is a str either way; they do not track where the string came from.`, retry: 'q1' },
      q2: {
        q: `mypy passes, yet production crashes with "NoneType has no attribute". The value came from a third-party library with no stubs. Why did mypy miss it?`,
        choices: [
          { text: `The library's functions are typed Any, and Any silently flows into your annotated code`, to: 'q2_right' },
          { text: `mypy does not support Optional`, to: 'q2_wrong_opt' },
          { text: `mypy only checks syntax`, to: 'q2_wrong_syntax' }
        ]
      },
      q2_right: { end: true, correct: true, text: `Yes. Missing stubs (with ignore_missing_imports) make the module Any; gradual typing then accepts it wherever an int or str is expected. Install stubs, or use --disallow-any-unimported / warn_return_any to see the gap.`, next: 'q3' },
      q2_wrong_opt: { end: true, correct: false, text: `mypy narrows Optional types well, as reveal_type shows. The gap is that the value was never typed Optional to begin with.`, retry: 'q2' },
      q2_wrong_syntax: { end: true, correct: false, text: `mypy is a full type checker. Think about what type a value from an unstubbed library gets.`, retry: 'q2' },
      q3: {
        q: `Which statement about soundness is correct for these Python tools?`,
        choices: [
          { text: `They are generally unsound by design: they prefer missing bugs to flooding developers with false positives`, to: 'q3_right' },
          { text: `Pylint is sound because it does inference`, to: 'q3_wrong_pylint' },
          { text: `Semgrep taint mode is sound for any Python program`, to: 'q3_wrong_semgrep' }
        ]
      },
      q3_right: { end: true, correct: true, text: `Correct. Dynamic features (getattr, eval, monkey-patching), Any, and Uninferable all push Python tools toward reporting only what they are confident about.`, next: null },
      q3_wrong_pylint: { end: true, correct: false, text: `astroid yields Uninferable and Pylint stays silent on it. That is a choice for precision over soundness.`, retry: 'q3' },
      q3_wrong_semgrep: { end: true, correct: false, text: `Open-source Semgrep taint is intraprocedural and only knows the sources and sinks you list. Flows through other functions or unlisted APIs are missed.`, retry: 'q3' }
    }
  },
  pitfalls: [
    `Treating a clean mypy run as proof of type safety when large parts of the code are unannotated or come from libraries without stubs: those are Any, and Any checks nothing.`,
    `Turning on every Pylint or Ruff rule at once on a legacy codebase. Thousands of warnings teach people to ignore the tool. Start from a small, high-precision set (F, B, S on Ruff) and ratchet, or baseline existing findings.`,
    `Writing custom rules that match names syntactically (<code>time.sleep</code>) and assuming they catch aliases and wrappers. Test with the alias forms and decide explicitly what you will miss.`,
    `Reading Bandit or Semgrep pattern findings as vulnerabilities. Without dataflow they mean "dangerous API used here", and triage has to establish whether attacker data reaches it.`,
    `Deleting what vulture reports at 60% confidence without checking for dynamic use: framework hooks, entry points, getattr, and pytest fixtures are invisible to it.`
  ],
  interview: [
    {
      q: `Compare Pylint, Ruff and mypy. When would you use each in a CI pipeline?`,
      a: `They analyze different things. Ruff is a fast AST and scope linter that reimplements pyflakes, pycodestyle, bugbear, bandit-style and pyupgrade rules in Rust; run it on save and as the first CI step, with autofix for safe rules. mypy (or Pyright) is a gradual type checker that needs annotations to be useful and catches interface mismatches across modules; run it on every push, with strict settings on new packages. Pylint is slower but has astroid inference and a plugin API; I keep it for checks Ruff cannot express, such as project-specific plugins or no-member on inferred classes, often on a narrowed rule set. The overlap between them is deliberate and fine; what matters is that each one in the pipeline has a low false-positive rate for its enabled rules.`
    },
    {
      q: `Explain soundness vs completeness for a static analyzer, and use Rice's theorem to argue why most linters are unsound.`,
      a: `Sound means no false negatives with respect to a property: if it reports no null dereference, there is none. Complete means no false positives: every report is a real possible behavior. Rice's theorem says every non-trivial semantic property of programs is undecidable, so a terminating analyzer cannot be both on all inputs; it must over- or under-approximate. Type systems and abstract interpreters over-approximate and accept false positives. Developer-facing linters mostly under-approximate because the cost of false positives is human: people stop reading a tool when a noticeable fraction of its warnings are wrong (Google's Tricorder work targets roughly ten percent effective false positives). In Python, eval, getattr, monkey-patching and Any make soundness nearly impossible anyway, so tools stay silent on unknowns, like astroid returning Uninferable.`
    },
    {
      q: `Design question: you are asked to build a check that finds tests which call time.sleep, across a monorepo of 20,000 Python files, run on every PR. How would you build it?`,
      a: `First decide precision targets and scope: direct calls in test functions only, or also through helpers. For direct calls, a Semgrep rule with pattern-inside def $FUNC(...) and a metavariable-regex ^test_ is a few lines, handles import aliases, and runs only on changed files in the PR, with semgrep --baseline-commit set to the merge base so only new findings are reported, so cost is proportional to the diff. I would add semgrep --test fixtures with ruleid/ok annotations to keep it honest. If we also need sleeps reached through helper functions, that is interprocedural: build a call graph (Pysa, or a cheap approximation: index every function that transitively calls time.sleep, computed nightly over the repo, and check calls to those from tests at PR time). Roll out by baselining existing violations so only new ones block, report as a warning first, measure how often people suppress it, then make it blocking.`
    },
    {
      q: `How does a Pylint plugin work, and what would you change to make a syntactic rule robust to import aliases?`,
      a: `A plugin module exposes register(linter), which registers a BaseChecker subclass. The checker declares msgs (id, template, symbolic name, description) and defines visit_<node> and leave_<node> methods called during the walk over the astroid tree, for example visit_call(self, node). It reports with add_message(symbol, node=..., args=...). To handle aliases, stop matching the textual name and use inference: call safe_infer(node.func) from pylint.checkers.utils and check that the result is a FunctionDef whose qname() is time.sleep. That resolves import time as t, from time import sleep, and simple re-exports, and returns None on Uninferable, where the rule should stay silent.`
    },
    {
      q: `What is gradual typing, and what are its holes?`,
      a: `Gradual typing lets annotated and unannotated code coexist: the dynamic type Any is consistent with every type in both directions, so untyped values can be passed where typed ones are expected and vice versa without errors. That makes incremental adoption possible. The holes: Any propagates silently (a function returning Any infects every caller), unannotated function bodies are not checked by default in mypy, libraries without stubs become Any, casts and type: ignore are trusted, and narrowing on attributes is not invalidated by calls. Mitigations are --strict on new code, warn_return_any, disallow_any_unimported, installing types- stub packages, and treating "Any count" as a metric to drive down.`
    },
    {
      q: `Tradeoff question: Bandit or a Semgrep taint rule for command injection, and why?`,
      a: `Bandit's B602 fires on every subprocess call with shell=True, constant or not. It is cheap, needs no configuration, and has high recall for the dangerous API, but low precision for actual injections, so on a big codebase it produces a lot of triage. A Semgrep taint rule declares sources (request.args.get, input), sanitizers (shlex.quote) and sinks (os.system, subprocess with shell=True); it only fires when data flows from source to sink in a function, so precision is much higher. Its recall is lower: open-source Semgrep taint is intraprocedural, and it only knows the sources you list. I would use the taint rule as the blocking gate and keep Bandit or Ruff S602 as a non-blocking audit, or go to Pysa if the flows commonly cross functions.`
    },
    {
      q: `What do pyflakes and vulture each report about unused code, and why do their precisions differ?`,
      a: `pyflakes reports unused imports and unused local variables within a single module, using scope analysis: a local assigned and never read in its own function scope is a near-certain finding, since nothing outside the function can see it. vulture reports any definition, including module-level functions, classes, methods and attributes, that is never referenced in the files it scanned. Those can be used dynamically or from outside the scanned set (frameworks, entry points, getattr), so vulture cannot be sure and reports a confidence (90% imports, 60% functions). The difference is the scope of the claim: a local's uses are all visible, a public name's are not.`
    }
  ]
};
