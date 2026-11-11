window.LESSONS = window.LESSONS || {};
window.LESSONS['taint-analysis'] = {
  id: 'taint-analysis',
  title: 'Taint Analysis: Sources, Sinks, Sanitizers — FlowDroid & CodeQL',
  category: 'Part 3 — Static Analysis Theory',
  timeMin: 45,
  summary: `Taint analysis is the most widely deployed use of the theory in this Part. It asks whether data from an untrusted <b>source</b> (an HTTP parameter, a file, an environment variable) can reach a sensitive <b>sink</b> (a SQL query, a shell command, <code>eval</code>) without passing through a <b>sanitizer</b>. Under the hood it is a dataflow problem: forward, may, over a taint lattice. It needs the call graph and points-to sets from the previous lesson to follow data through calls and fields. This lesson builds a small taint tracker on Python's <code>ast</code>, then shows how the production tools express the same idea: IFDS in FlowDroid, <code>TaintTracking::Global</code> in CodeQL for Java and Python, and Semgrep's <code>mode: taint</code>.`,
  goals: [
    `Define sources, sinks, sanitizers and propagators, and model a vulnerability class (SQLi, command injection, XSS) as a taint specification`,
    `Implement a flow-sensitive intraprocedural taint tracker over a Python AST, including strong updates and sanitizers`,
    `Explain IFDS: the exploded supergraph, distributive flow functions, and why it is precise across calls (realizable paths)`,
    `Write a CodeQL taint-tracking query for Java and for Python, and a Semgrep taint rule, and run them`,
    `Discuss the false-positive and false-negative sources specific to taint analysis: implicit flows, missing models, over-tainting of containers, and sanitizer correctness`
  ],
  concept: [
    {
      h: 'The vocabulary: sources, sinks, sanitizers, propagators',
      p: [
        `<ul><li><b>Source:</b> where untrusted data enters. Examples: <code>request.args.get</code> (Flask), <code>HttpServletRequest.getParameter</code> (Java), <code>input()</code>, <code>System.getenv</code>, and on Android <code>TelephonyManager.getDeviceId()</code> as a privacy source.</li><li><b>Sink:</b> where tainted data causes harm. Examples: <code>cursor.execute(query)</code>, <code>Statement.executeQuery</code>, <code>os.system</code>, <code>Runtime.exec</code>, <code>eval</code>, template rendering without escaping, and for privacy, a network send.</li><li><b>Sanitizer (barrier):</b> a function whose output is safe for a given sink: <code>shlex.quote</code> for shell, parameterised queries for SQL, <code>html.escape</code> for HTML, <code>int()</code> for almost anything. Sanitizers are <i>sink-specific</i>: <code>html.escape</code> does not make data safe for SQL.</li><li><b>Propagator (summary/model):</b> how taint moves through code you cannot or do not analyse, such as <code>StringBuilder.append</code>, <code>str.format</code>, <code>dict.get</code> and JSON parsing. Missing propagator models are the leading cause of false negatives.</li></ul>`,
        `A vulnerability class is then a <b>specification</b>: (sources, sinks, sanitizers, extra propagation steps). OWASP's injection categories, CWE-78 (OS command injection), CWE-89 (SQL injection) and CWE-79 (XSS) each correspond to one spec. Tools ship hundreds of them, and most of the engineering work is writing and maintaining these models, not the solver.`
      ]
    },
    {
      h: 'Taint as a dataflow problem',
      p: [
        `Intraprocedurally, taint is a forward <i>may</i> analysis. The fact at each program point is the set of tainted access paths (variables, and for field-sensitive tools, paths like <code>req.user.name</code>). The transfer function for <code>x = e</code> taints x if e reads any tainted value and is not a sanitizer call, and otherwise <i>untaints</i> x. That is a strong update, which is valid for local variables in a flow-sensitive analysis. At merge points the sets are unioned. A sink call whose relevant argument is tainted produces a finding, and a good tool reports the <b>path</b> (the chain of steps from source to sink), because a bare "line 42" is not something a developer can triage.`,
        `Across procedures you need summaries ("parameter 0 flows to the return value") or a context-sensitive solver. Through the heap you need aliasing: if <code>a.f = tainted</code> and <code>b</code> aliases <code>a</code>, then <code>b.f</code> is tainted. FlowDroid handles aliasing with an on-demand backward alias search whenever taint is written into a heap location.`
      ],
      code: `user  = request.args.get("name")     # SOURCE           tainted = {user}
greet = "hello " + user               # propagate         tainted = {user, greet}
os.system("echo " + greet)            # SINK, tainted arg -> FINDING (CWE-78)
safe  = shlex.quote(user)             # SANITIZER         tainted unchanged, safe is clean
os.system("echo " + safe)             # clean -> no finding
user  = "constant"                    # strong update     tainted = {greet}`
    },
    {
      h: 'IFDS: interprocedural taint as graph reachability',
      p: [
        `IFDS (Interprocedural, Finite, Distributive, Subset; Reps, Horwitz and Sagiv, POPL 1995) solves any dataflow problem where facts are subsets of a finite domain D and flow functions distribute over ∪. Taint qualifies, since "is this access path tainted" is decided fact by fact. Each flow function is represented as a small bipartite graph on D ∪ {0}, where 0 is the always-true fact used to generate new facts. Gluing these graphs together over the interprocedural CFG gives the <b>exploded supergraph</b>, and "fact d holds at node n" becomes "(n, d) is reachable from (entry, 0)".`,
        `The key is <b>realizable paths</b>. A path that enters a callee from call site A must return to A, not to B. The tabulation algorithm enforces this with <b>path edges</b> (facts reachable within a procedure) and <b>summary edges</b> (once a callee's effect "fact d at entry gives fact d' at exit" is computed, it is reused at every call site). That makes it fully context-sensitive for the cost of O(E·|D|³) rather than exponential in call depth. IDE extends IFDS to facts with values attached, and Heros is Soot's reusable IFDS/IDE solver.`,
        `<b>FlowDroid</b> (Arzt et al., PLDI 2014) is IFDS taint analysis on Soot for Android. It is flow-, field-, context- and object-sensitive, with access paths truncated at a configurable length. It generates a dummy main method that models the Android component lifecycle and callbacks, and it adds an on-demand backward alias analysis. It introduced the DroidBench micro-benchmark, which is still the standard way to compare Android taint tools.`
      ],
      code: `# FlowDroid sources/sinks file (Soot method signatures):
<android.telephony.TelephonyManager: java.lang.String getDeviceId()> -> _SOURCE_
<android.location.Location: double getLatitude()> -> _SOURCE_
<android.telephony.SmsManager: void sendTextMessage(java.lang.String,java.lang.String,java.lang.String,android.app.PendingIntent,android.app.PendingIntent)> -> _SINK_
<android.util.Log: int i(java.lang.String,java.lang.String)> -> _SINK_

# Run the command-line release jar against an APK (platforms dir = Android SDK platforms/)
java -jar soot-infoflow-cmd-jar-with-dependencies.jar \\
     -a app.apk -p $ANDROID_HOME/platforms -s SourcesAndSinks.txt`
    },
    {
      h: 'CodeQL: taint queries for Java and Python',
      p: [
        `CodeQL extracts a relational database from source (for compiled languages, by observing the build) and you query it in QL, an object-oriented Datalog. A taint query defines a module that implements <code>DataFlow::ConfigSig</code> with <code>isSource</code>, <code>isSink</code> and optionally <code>isBarrier</code> (sanitizer) and <code>isAdditionalFlowStep</code> (an extra propagator). That module is passed to <code>TaintTracking::Global&lt;…&gt;</code>. This module-based API replaced the older <code>class X extends TaintTracking::Configuration</code> style in 2023, so a lot of blog posts still show the old style. Java method calls are <code>MethodCall</code> (formerly <code>MethodAccess</code>).`,
        `Commands: <code>codeql database create db --language=java --command="mvn -q -DskipTests compile"</code> (recent CLIs also accept <code>--build-mode=none</code> for Java), or <code>--language=python --source-root .</code>, which needs no build. Then run <code>codeql database analyze db cmd.ql --format=sarif-latest --output=out.sarif</code>. A custom query lives in a pack whose <code>qlpack.yml</code> depends on <code>codeql/java-all</code> or <code>codeql/python-all</code>. Run <code>codeql pack install</code> to fetch them.`
      ],
      code: `/**
 * @name Remote input flows to Runtime.exec
 * @kind path-problem
 * @problem.severity error
 * @id java/custom/command-injection
 */
import java
import semmle.code.java.dataflow.FlowSources
import semmle.code.java.dataflow.TaintTracking

module CmdConfig implements DataFlow::ConfigSig {
  predicate isSource(DataFlow::Node src) { src instanceof RemoteFlowSource }
  predicate isSink(DataFlow::Node sink) {
    exists(MethodCall mc |
      mc.getMethod().hasQualifiedName("java.lang", "Runtime", "exec") and
      sink.asExpr() = mc.getArgument(0))
  }
  // numbers cannot carry a shell payload
  predicate isBarrier(DataFlow::Node n) { n.getType() instanceof PrimitiveType }
}
module CmdFlow = TaintTracking::Global<CmdConfig>;
import CmdFlow::PathGraph

from CmdFlow::PathNode source, CmdFlow::PathNode sink
where CmdFlow::flowPath(source, sink)
select sink.getNode(), source, sink, "Command built from $@.", source.getNode(), "remote input"

// ---------------- Python: remote input -> os.system ----------------
import python
import semmle.python.dataflow.new.DataFlow
import semmle.python.dataflow.new.TaintTracking
import semmle.python.dataflow.new.RemoteFlowSources
import semmle.python.ApiGraphs

module OsSystemConfig implements DataFlow::ConfigSig {
  predicate isSource(DataFlow::Node src) { src instanceof RemoteFlowSource }
  predicate isSink(DataFlow::Node sink) {
    sink = API::moduleImport("os").getMember("system").getACall().getArg(0)
  }
  predicate isBarrier(DataFlow::Node n) {
    n = API::moduleImport("shlex").getMember("quote").getACall()
  }
}
module OsSystemFlow = TaintTracking::Global<OsSystemConfig>;
import OsSystemFlow::PathGraph

from OsSystemFlow::PathNode source, OsSystemFlow::PathNode sink
where OsSystemFlow::flowPath(source, sink)
select sink.getNode(), source, sink, "os.system argument comes from $@.", source.getNode(), "remote input"`
    },
    {
      h: 'Semgrep taint mode: the lightweight option',
      p: [
        `Semgrep rules are written in the target language's own syntax with metavariables, which makes them quick to write and easy to review. With <code>mode: taint</code>, you list <code>pattern-sources</code>, <code>pattern-sinks</code>, <code>pattern-sanitizers</code> and optionally <code>pattern-propagators</code>. The open-source engine tracks taint within a function (intraprocedurally). Cross-function and cross-file taint is part of the commercial Semgrep Pro engine. That is the usual tradeoff: fast and easy to customise, but shallower than CodeQL's whole-program analysis.`,
        `The rule below was run with Semgrep 1.185. It flags <code>os.system("ping -c 1 " + host)</code> and does <i>not</i> flag the <code>shlex.quote(host)</code> version. The lab extends the idea to SQL injection, with <code>focus-metavariable</code> so that only the query string argument counts as the sink and parameterised queries pass.`
      ],
      code: `rules:
  - id: flask-command-injection
    mode: taint
    languages: [python]
    severity: ERROR
    message: User input from request.args flows into os.system (command injection)
    pattern-sources:
      - pattern: flask.request.args.get(...)
    pattern-sanitizers:
      - pattern: shlex.quote(...)
    pattern-sinks:
      - pattern: os.system(...)

$ semgrep --metrics=off --config taint.yaml app.py
    app.py
   ❯❯❱ flask-command-injection
          User input from request.args flows into os.system (command injection)
            7┆ os.system("ping -c 1 " + host)`
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: `Where taint analysis gets hard in practice, and what interviewers ask once they know you can define sources and sinks.`,
    sections: [
      {
        h: 'Explicit versus implicit flows',
        p: [
          `Almost every production taint tool tracks <b>explicit</b> (data) flows only. In <code>if secret == 1: x = 1 else: x = 0</code>, x copies secret's value through <b>control dependence</b>, which is an implicit flow. Tracking implicit flows (information-flow control, noninterference) massively over-taints ordinary code, because every value computed under a tainted branch becomes tainted. That is acceptable for confidentiality type systems such as Jif, and unacceptable for injection checkers. For injection, implicit flows rarely matter, since an attacker cannot build a SQL payload one bit at a time through branches. For privacy leaks they can, and the tool's documentation should say which it tracks.`
        ]
      },
      {
        h: 'Access paths, containers and over-tainting',
        p: [
          `Field-sensitive taint tracks access paths like <code>a.b.c</code>, truncated at length k. Anything longer becomes <code>a.b.*</code> and taints the whole subtree. Containers are the classic precision sink: if <code>list.add(tainted)</code> taints the whole list, then <code>list.get(0)</code> of an unrelated element is tainted too. CodeQL and FlowDroid model common collections with content-sensitive summaries (for example "element content of" and "map value of") so that keys and values are tracked separately.`,
          `String operations matter too. Should <code>s.length()</code> be tainted? Usually not for injection, since a number cannot carry a payload, which is why CodeQL's Java barrier above excludes primitive types. Should <code>s.substring(0, 3)</code> be tainted? Yes. These choices are encoded in propagator models, and they move both precision and recall.`
        ]
      },
      {
        h: 'Sanitizer correctness and context',
        p: [
          `A sanitizer is only correct for a specific sink context. <code>html.escape</code> is right for HTML element content and wrong inside a <code>&lt;script&gt;</code> block or an unquoted attribute. Regex "validators" are often bypassable, and a check like <code>if "/" not in path</code> on the wrong branch is a classic bug. Tools therefore distinguish <b>barriers</b> (the value is clean after this) from <b>barrier guards</b> (the value is clean on the true edge of this check), and CodeQL has explicit support for guards. Getting sanitizers wrong in the tool's favour produces false negatives that never show up in the false-positive metrics.`
        ]
      },
      {
        h: 'Evaluating a taint tool',
        p: [
          `Benchmarks give ground truth: DroidBench and ICC-Bench for Android, the OWASP Benchmark for Java web vulnerabilities, and the Juliet test suites (NIST SARD) for CWE coverage. Report precision (true positives over reported) and recall (true positives over known flows) per CWE, not as one aggregate number. For a research evaluation, also triage a random sample of findings on real projects. Micro-benchmarks reward modelling exactly what they test, and real code uses frameworks, reflection and generated code that micro-benchmarks do not. This is the same validity concern as in flaky-test research: the benchmark needs to look like the population you care about.`
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: 'The Poisoned Sake Barrel on Thriller Bark',
      text: [
        `Someone on Thriller Bark spikes one barrel of sake with Hogback's sleeping drug. The barrel is the source. Sanji's rule as cook: anything poured from that barrel is suspect, and so is any dish it is mixed into, and so is anything mixed with that dish. Taint spreads through every mixing step. The danger is reaching Luffy's mouth, the sink, because if the captain sleeps, the crew loses.`,
        `Chopper has an antidote. A cup that goes through Chopper's treatment is clean again, and that is the sanitizer. But the antidote only works against that drug, not against Magellan's poison, because sanitizers are specific to the sink. When Sanji pours a fresh cup from a clean barrel into the same mug, the mug is clean again. That is a strong update. Robin traces the full path from barrel to mug to stew to Luffy's bowl, because "something poisoned somewhere" is not enough to act on. You need the path.`
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: `Sheldon's Germ Tracking`,
      text: [
        `Leonard sneezes. Sheldon immediately marks him as the source and tracks every object Leonard touched: the remote, then the takeout box, then the fork Raj used. When Penny wipes the remote with a disinfectant wipe, Sheldon grudgingly accepts it as clean. The wipe is his sanitizer, but only for germs. It does not count for "Penny touched it", which is a separate policy.`,
        `The sink is Sheldon's spot on the couch. A full whiteboard of transfer paths later, he finds that Howard carried the fork to the couch. Howard protests that he only sat next to the fork. Sheldon considers counting that as an implicit flow, but then everyone in the apartment would be contaminated, so he grudgingly tracks direct contact only.`
      ]
    },
    why: `The barrel and the sneeze are sources, Luffy's mouth and the couch are sinks, mixing and touching are propagation, and Chopper's antidote and the wipe are sink-specific sanitizers. Robin's trace and Sheldon's whiteboard are the reported flow path. Sheldon refusing to count "sat next to" is exactly why tools track explicit flows only.`
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'src', emoji: '🛢️', label: 'request.args.get', x: 8, y: 16 },
      { id: 'greet', emoji: '🍲', label: 'greet = "hi " + user', x: 40, y: 16 },
      { id: 'quote', emoji: '💊', label: 'shlex.quote', x: 40, y: 80 },
      { id: 'sink', emoji: '💥', label: 'os.system(...)', x: 85, y: 45 },
      { id: 'report', emoji: '📜', label: 'findings: 0', x: 8, y: 80 }
    ],
    actors: [
      { id: 'taint', emoji: '☠️', label: 'taint', x: 14, y: 40 },
      { id: 'robin', emoji: '🔎', label: 'Robin (path)', x: 25, y: 60 }
    ],
    steps: [
      { c: `request.args.get returns attacker-controlled data, so user is tainted.`, p: { src: 'bad' } },
      { c: `greet = "hi " + user. String concatenation propagates taint: greet is tainted too.`, a: { taint: [40, 38] }, p: { greet: 'bad' } },
      { c: `os.system("echo " + greet): a tainted value reaches a command sink. Finding (CWE-78).`, a: { taint: [80, 45], robin: [60, 55] }, p: { sink: 'bad' }, l: { report: 'findings: 1 (src → greet → os.system)' } },
      { c: `Robin records the path: source, then greet, then the sink. That path is what a developer needs in order to triage the finding.`, p: { report: 'lit' } },
      { c: `Second flow: safe = shlex.quote(user). The sanitizer returns a clean value for shell sinks.`, a: { taint: [40, 70] }, p: { quote: 'good', sink: '' } },
      { c: `os.system("echo " + safe) produces no finding. But shlex.quote would NOT sanitize the same value for a SQL sink. 🏴‍☠️`, a: { taint: [70, 70] }, p: { sink: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'IFDS on one call: summaries make it context-sensitive',
    intro: 'Facts are tainted variables. Edges are distributive flow functions. Click to step through.',
    stages: [
      { label: 'Caller A', nodes: [ { id: 'a1', text: 'x = source()\nfact: x' }, { id: 'a2', text: 'y = id(x)\ncall site A' } ] },
      { label: 'Callee id(p)', nodes: [ { id: 'c1', text: 'entry: p\n(mapped from x)' }, { id: 'c2', text: 'return p\nfact: ret' }, { id: 'sum', text: 'SUMMARY\np ⟶ ret' } ] },
      { label: 'Back to A', nodes: [ { id: 'a3', text: 'fact: y\n(return to A only)' }, { id: 'a4', text: 'sink(y)\nFINDING' } ] },
      { label: 'Caller B', nodes: [ { id: 'b1', text: 'z = id("const")\nreuse summary:\nno taint in → none out' } ] }
    ],
    steps: [
      { active: ['a1'], note: 'The source generates fact x from the special 0 fact. "x tainted" is now reachable.' },
      { active: ['a2'], note: 'At the call, the call-flow function maps actual argument x to formal parameter p.' },
      { active: ['c1'], note: 'Inside the callee, IFDS tracks path edges from the entry fact p.' },
      { active: ['c2'], note: 'return p: the fact p becomes the return fact.' },
      { active: ['sum'], note: 'This gives the summary edge (entry, p) to (exit, ret), computed once and reused at every call site.' },
      { active: ['a3'], note: 'The return-flow function maps ret to y, at call site A only. Realizable paths: what enters from A returns to A.' },
      { active: ['a4'], note: 'y reaches the sink, so there is a finding, with path x → p → ret → y.' },
      { active: ['b1'], note: 'Call site B passes no tainted fact, so the summary produces none. A context-insensitive analysis would have leaked A’s taint into z.' }
    ]
  },
  tech: [
    {
      q: 'Why is taint a distributive problem, and why does that matter?',
      a: `Whether access path v is tainted after a statement depends on each incoming tainted fact independently: <code>f(S) = ∪ f({d})</code> for d in S. That is what lets IFDS represent flow functions as edges between individual facts and reduce the analysis to graph reachability, with summaries that are reused across call sites. Analyses with correlated facts, such as constant propagation (whose value depends on two inputs) or must-alias, are not distributive in that sense and need IDE or more general frameworks.`
    },
    {
      q: 'What is an access path, and why does FlowDroid truncate them?',
      a: `An access path is a local variable followed by a sequence of field dereferences: <code>req.session.user.name</code>. Tracking paths instead of whole objects gives field sensitivity, so <code>req.headers</code> can be tainted while <code>req.method</code> is not. Recursive data structures make the set of paths infinite (<code>node.next.next.next…</code>), so tools cut paths at length k and treat the cut path as "this prefix and everything under it". That keeps the fact domain D finite, which IFDS requires. Larger k is more precise and slower.`
    },
    {
      q: 'Why does CodeQL need to observe the build for Java but not for Python?',
      a: `CodeQL's Java extractor records exactly what the compiler sees: resolved types, overloads, generated sources and the classpath. It does this by intercepting <code>javac</code> during your build command, which gives a precise database with full type information. Python has no compile step and is dynamically typed, so the extractor parses source files directly, and the libraries recover types and call targets through API graphs and points-to. Newer CodeQL versions also offer a build-less mode for Java that trades some type precision for convenience.`
    },
    {
      q: `When should I reach for Semgrep's taint mode versus CodeQL?`,
      a: `Semgrep: when you need a rule in minutes, written in the target language's own syntax, run on every PR in seconds, and the flows you care about are mostly local to one function (the open-source engine is intraprocedural). CodeQL: when the flow crosses functions, files and frameworks, you need path explanations through the call graph, and you can afford database creation, which can take minutes on a large project. Many teams run both: Semgrep for fast house rules, and CodeQL (via GitHub code scanning) for deep security queries.`
    }
  ],
  code: {
    title: 'A flow-sensitive taint tracker on Python ASTs',
    intro: `Stdlib only. Save it as <code>taint.py</code> and run <code>python3 taint.py</code> to analyse the built-in sample, or <code>python3 taint.py yourfile.py</code>. It handles straight-line code, which is enough to see strong updates, propagation through concatenation and f-strings, and sanitizers. Adding branches would need the CFG and the worklist from the capstone.`,
    code: "\"\"\"A minimal intraprocedural, flow-sensitive taint tracker for straight-line\nPython functions, built on the ast module.  Sources, sinks and sanitizers are\nmatched by dotted call name, exactly like a (much bigger) real tool's specs.\"\"\"\nimport ast\nimport sys\n\nSOURCES = {\"input\", \"request.args.get\", \"os.environ.get\"}\nSINKS = {\"os.system\": 0, \"subprocess.call\": 0, \"cursor.execute\": 0, \"eval\": 0}\nSANITIZERS = {\"shlex.quote\", \"int\"}\n\n\ndef dotted(node):\n    \"\"\"Turn Name/Attribute chains into 'a.b.c' (None for anything else).\"\"\"\n    if isinstance(node, ast.Name):\n        return node.id\n    if isinstance(node, ast.Attribute):\n        base = dotted(node.value)\n        return f\"{base}.{node.attr}\" if base else None\n    return None\n\n\nclass TaintTracker(ast.NodeVisitor):\n    def __init__(self):\n        self.tainted = set()          # variable names currently carrying taint\n        self.findings = []\n\n    def is_tainted(self, expr):\n        \"\"\"Does evaluating expr yield a tainted value?\"\"\"\n        if isinstance(expr, ast.Call):\n            name = dotted(expr.func)\n            if name in SOURCES:\n                return True\n            if name in SANITIZERS:\n                return False              # sanitizer output is clean\n            # unknown call: conservatively propagate taint from any argument\n            return any(self.is_tainted(a) for a in expr.args)\n        if isinstance(expr, ast.Name):\n            return expr.id in self.tainted\n        # f-strings, concatenation, %-format, subscripts... any tainted child taints\n        return any(self.is_tainted(c) for c in ast.iter_child_nodes(expr)\n                   if isinstance(c, ast.expr))\n\n    def visit_Assign(self, node):\n        self.generic_visit(node)          # check sinks inside the RHS first\n        t = self.is_tainted(node.value)\n        for target in node.targets:\n            if isinstance(target, ast.Name):\n                (self.tainted.add if t else self.tainted.discard)(target.id)  # strong update\n\n    def visit_Call(self, node):\n        name = dotted(node.func)\n        if name in SINKS:\n            idx = SINKS[name]\n            if idx < len(node.args) and self.is_tainted(node.args[idx]):\n                self.findings.append((node.lineno, name))\n        self.generic_visit(node)\n\n\nSAMPLE = '''\nimport os, shlex\ndef handler(request, cursor):\n    user = request.args.get(\"name\")\n    greeting = \"hello \" + user\n    os.system(\"echo \" + greeting)              # line 6: command injection\n    safe = shlex.quote(user)\n    os.system(\"echo \" + safe)                  # line 8: sanitized, no report\n    cursor.execute(f\"SELECT * FROM t WHERE n = '{user}'\")   # line 9: SQLi\n    user = \"constant\"\n    os.system(\"echo \" + user)                  # line 11: overwritten, clean\n'''\n\nif __name__ == \"__main__\":\n    src = open(sys.argv[1]).read() if len(sys.argv) > 1 else SAMPLE\n    tracker = TaintTracker()\n    tracker.visit(ast.parse(src))\n    for line, sink in tracker.findings:\n        print(f\"line {line}: tainted data reaches sink {sink}()\")\n",
    notes: [
      `Verified output: <code>line 6: tainted data reaches sink os.system()</code> and <code>line 9: tainted data reaches sink cursor.execute()</code>. Line 8 (sanitized) and line 11 (overwritten with a constant) are correctly not reported.`,
      `Unknown calls propagate taint from their arguments. That is the conservative default, and the reason <code>len(user)</code> would be tainted here. Real tools ship per-function models to avoid exactly that.`,
      `The tracker matches sinks by syntactic dotted name (<code>cursor.execute</code>), so <code>c = cursor; c.execute(q)</code> slips through. Fixing that needs points-to or type information, which is why the previous lesson comes first.`
    ]
  },
  lab: {
    title: 'Write a Semgrep taint rule for Flask SQL injection',
    prompt: `Write a Semgrep rule <code>flask-sqli</code> in taint mode for Python. Sources: <code>flask.request.args.get(...)</code> and <code>flask.request.form[...]</code>. Sanitizer: <code>int(...)</code>. Sink: <b>only the first argument</b> of any <code>$CUR.execute($QUERY, ...)</code>. Use <code>pattern-inside</code> plus <code>focus-metavariable: $QUERY</code>, so that parameterised queries such as <code>cur.execute("... = ?", (name,))</code> are not flagged. Then test it against the annotated file in the run instructions.`,
    starter: `rules:
  - id: flask-sqli
    mode: ???
    languages: [python]
    severity: ERROR
    message: Request data reaches a SQL query string (SQL injection)
    pattern-sources:
      - pattern: ???
    pattern-sanitizers:
      - pattern: ???
    pattern-sinks:
      - patterns:
          - pattern-inside: ???
          - focus-metavariable: ???
`,
    checks: [
      { re: 'mode:\\s*taint', flags: '', must: true, hint: 'Set mode: taint.', pass: 'taint mode ✓' },
      { re: 'pattern-sources:[\\s\\S]*flask\\.request\\.args\\.get\\(\\.\\.\\.\\)', flags: '', must: true, hint: 'Source: - pattern: flask.request.args.get(...)', pass: 'args.get source ✓' },
      { re: 'flask\\.request\\.form\\[\\.\\.\\.\\]', flags: '', must: true, hint: 'Second source: - pattern: flask.request.form[...]', pass: 'form source ✓' },
      { re: 'pattern-sanitizers:\\s*\\n\\s*-\\s*pattern:\\s*int\\(\\.\\.\\.\\)', flags: '', must: true, hint: 'Sanitizer: - pattern: int(...)', pass: 'int() sanitizer ✓' },
      { re: 'pattern-inside:\\s*\\$CUR\\.execute\\(\\s*\\$QUERY\\s*,\\s*\\.\\.\\.\\s*\\)', flags: '', must: true, hint: 'Sink context: - pattern-inside: $CUR.execute($QUERY, ...)', pass: 'execute sink context ✓' },
      { re: 'focus-metavariable:\\s*\\$QUERY', flags: '', must: true, hint: 'focus-metavariable: $QUERY, so only the query argument is the sink.', pass: 'focused on the query string ✓' },
      { re: '\\?\\?\\?', flags: '', must: false, hint: 'There are still ??? placeholders.', pass: 'no placeholders ✓' }
    ],
    run: `Save the rule as <code>sqli.yaml</code>. Save this test file as <code>views.py</code>: the <code># ruleid:</code> and <code># ok:</code> comments are Semgrep's test annotations, placed on the line <i>before</i> the code they label.<pre><code>import sqlite3
from flask import request

conn = sqlite3.connect("app.db")


def search():
    cur = conn.cursor()
    name = request.args.get("name")
    # ruleid: flask-sqli
    cur.execute("SELECT * FROM users WHERE name = '" + name + "'")
    # ok: flask-sqli
    cur.execute("SELECT * FROM users WHERE name = ?", (name,))
    return cur.fetchall()


def by_id():
    cur = conn.cursor()
    uid = int(request.args.get("id"))
    # ok: flask-sqli
    cur.execute(f"SELECT * FROM users WHERE id = {uid}")
    raw = request.form["q"]
    # ruleid: flask-sqli
    cur.execute(f"SELECT * FROM t WHERE q = '{raw}'")</code></pre>Run <code>pip install --user semgrep</code>, then <code>semgrep --metrics=off --config sqli.yaml views.py</code>. It should report 2 findings, on lines 11 and 24. Then run <code>semgrep --metrics=off --test --config sqli.yaml views.py</code>, which should print <code>1/1: ✓ All tests passed</code>. Both commands were verified with Semgrep 1.185.`,
    solution: "rules:\n  - id: flask-sqli\n    mode: taint\n    languages: [python]\n    severity: ERROR\n    message: Request data reaches a SQL query string (SQL injection)\n    pattern-sources:\n      - pattern: flask.request.args.get(...)\n      - pattern: flask.request.form[...]\n    pattern-sanitizers:\n      - pattern: int(...)\n    pattern-sinks:\n      - patterns:\n          - pattern-inside: $CUR.execute($QUERY, ...)\n          - focus-metavariable: $QUERY\n",
    notes: [
      `Without <code>focus-metavariable</code>, the whole <code>cur.execute(...)</code> call is the sink, so the parameterised query (where <code>name</code> is in the second argument) would be flagged as a false positive.`,
      `<code>int(...)</code> is a sound sanitizer for SQL because an integer cannot carry a quote character. A regex check would not be, and Semgrep would need <code>pattern-sanitizers</code> with <code>by-side-effect</code> or a guard model to express "validated on this branch".`,
      `The open-source engine is intraprocedural. If <code>name</code> came back from a helper function, the flow would be missed. That is a false negative to state when you present results.`
    ]
  },
  quiz: [
    {
      q: 'Why is a sanitizer always tied to a sink kind?',
      options: ['Because sanitizers are slow', 'Because what is safe depends on the interpreter of the sink: html.escape is fine for HTML text but not for SQL or shell', 'Because sources are typed', 'It is not; one sanitizer fits all'],
      correct: 1,
      explain: 'Each sink has its own metacharacters. A sanitizer neutralises the metacharacters of one context, so specs pair sanitizers with sink kinds.'
    },
    {
      q: 'In IFDS, what makes the analysis context-sensitive without enumerating call stacks?',
      options: ['k-limiting', 'Summary edges computed once per callee, plus matching each return to its own call site (realizable paths)', 'Running the program', 'Widening'],
      correct: 1,
      explain: 'Tabulation reuses per-callee summaries and only follows interprocedurally realizable paths, giving precise context sensitivity in polynomial time.'
    },
    {
      q: 'Which flow do production injection checkers usually NOT track?',
      options: ['String concatenation', 'Implicit flows through control dependence (if secret: x = 1)', 'Field stores', 'Return values'],
      correct: 1,
      explain: 'Tracking implicit flows over-taints most of the program. Injection checkers track data dependence only. Information-flow type systems track both.'
    },
    {
      q: 'In current CodeQL, how do you define a taint analysis?',
      options: ['Subclass TaintTracking::Configuration and override isSource', 'Implement DataFlow::ConfigSig in a module and instantiate TaintTracking::Global<YourConfig>', 'Write a YAML rule', 'Annotate the code with @Tainted'],
      correct: 1,
      explain: 'The module-based API (ConfigSig plus Global<...>) replaced the class-based Configuration API, which is deprecated.'
    },
    {
      q: 'A taint tool reports `list.get(1)` as tainted after `list.add(tainted)` to index 0. What is the precision problem?',
      options: ['Implicit flow', 'Container over-tainting: the whole collection is treated as one tainted blob', 'Missing source model', 'Sanitizer bypass'],
      correct: 1,
      explain: 'Without content-sensitive container models, taint on one element taints every element. Tools mitigate this with element and map-value content tracking.'
    }
  ],
  testFlow: {
    title: 'Test yourself: model the vulnerability',
    start: 'q1',
    nodes: {
      q1: { q: 'A Flask app does `subprocess.run(["ls", path])` with path from request.args. Command-injection finding?', choices: [ { text: 'Not command injection: the list form does not invoke a shell, though path traversal may still apply', to: 'q1_ok' }, { text: 'Yes, any subprocess call with tainted data is command injection', to: 'q1_no' } ] },
      q1_ok: { end: true, correct: true, text: 'Right. Without shell=True there is no shell parsing, so metacharacters do nothing. A good spec models subprocess sinks with the shell argument in mind. The value could still be a path-traversal or argument-injection issue, which is a different CWE.', next: 'q2' },
      q1_no: { end: true, correct: false, text: 'Too broad. With the list form and no shell=True, the argument goes straight to execve. Specs that ignore this produce exactly the noise that makes developers turn tools off.', retry: 'q1' },
      q2: { q: 'Your CodeQL query misses a flow through a custom `Utils.join(a, b)` in a jar without sources. Fix?', choices: [ { text: 'Add an isAdditionalFlowStep (or a models-as-data summary) from the arguments to the return value', to: 'q2_ok' }, { text: 'Add Utils.join as a source', to: 'q2_src' } ] },
      q2_ok: { end: true, correct: true, text: 'Yes. A missing propagator is a false negative. A summary model restores the flow without making every call a source.', next: 'q3' },
      q2_src: { end: true, correct: false, text: 'Then every result of join is tainted, even for constant inputs. You need a propagation step, not a new source.', retry: 'q2' },
      q3: { q: 'Which is the best FlowDroid-style choice for a recursive linked list?', choices: [ { text: 'Truncate access paths at length k (e.g. 5)', to: 'q3_ok' }, { text: 'Track unbounded access paths', to: 'q3_unb' } ] },
      q3_ok: { end: true, correct: true, text: 'Correct. Truncation keeps the fact domain finite, as IFDS requires. A cut path over-approximates everything beneath it.' },
      q3_unb: { end: true, correct: false, text: 'node.next.next... is infinite, so the domain would not be finite and IFDS would not terminate.', retry: 'q3' }
    }
  },
  pitfalls: [
    `Counting the sanitizer call but not its result. <code>shlex.quote(user)</code> on a line by itself does not clean <code>user</code>. Only the returned value is clean.`,
    `Treating every argument of a sink as the sink. Parameterised SQL and list-form <code>subprocess</code> are safe, and flagging them is the quickest way to lose developers' trust.`,
    `Missing framework entry points and sources: Django request objects, Spring <code>@RequestParam</code> parameters, Android intents. If the tool cannot see the source, recall is zero no matter how good the solver is.`,
    `Reporting precision on DroidBench or OWASP Benchmark alone. Micro-benchmarks reward exactly the patterns they contain, so always triage a sample from real projects.`,
    `Forgetting that Semgrep OSS taint is intraprocedural and that FlowDroid's results depend on its callback and lifecycle model. State these limits with every number.`
  ],
  interview: [
    {
      q: 'Define taint analysis and frame it as a dataflow problem.',
      a: `Taint analysis decides whether values derived from untrusted sources can reach security-sensitive sinks without passing through an appropriate sanitizer. It is a forward may-analysis whose facts are sets of tainted access paths. Sources generate facts. Assignments propagate (x is tainted if the right-hand side reads a tainted path) or strongly kill (x is assigned a clean value). Sanitizer calls return clean values. Merges take the union. Interprocedurally it needs call-graph edges, parameter and return mappings, and either summaries or IFDS. Through the heap it needs aliasing. Results are reported as source-to-sink paths so developers can triage them.`
    },
    {
      q: 'Explain IFDS and why FlowDroid uses it.',
      a: `IFDS solves interprocedural dataflow problems whose facts come from a finite set and whose flow functions distribute over union. Each flow function becomes edges between facts, and the whole program becomes an exploded supergraph in which "fact d holds at n" is reachability from (entry, 0). The tabulation algorithm only follows realizable paths (returns match their call site) and caches procedure summaries, giving exact context-sensitive results in O(E·D³). Taint over access paths is distributive and, with k-limited paths, finite, so it fits. FlowDroid adds an on-demand backward alias analysis, an Android lifecycle and callback model, and flow-, field- and object-sensitive handling on top of Soot.`
    },
    {
      q: 'Tradeoff: precision versus recall for a taint tool that will gate every pull request.',
      a: `When a tool blocks merges, precision matters more than recall. Each false positive costs a developer interrupt, and above roughly 10–20% noise people start suppressing or ignoring the tool. Google's Tricorder experience and Meta's Infer deployments both report that developer response depends on the actionable rate. So for a gate I would ship only high-confidence specs: well-modelled sources and sinks, sink-argument precision, and strong sanitizer models. I would report on the diff only (new findings), and run broader, higher-recall queries in a nightly audit for the security team. I would track the fix rate of reported findings as the real precision metric and measure recall by seeding known vulnerabilities, or against a benchmark like OWASP or Juliet.`
    },
    {
      q: 'Whiteboard: design an intraprocedural taint checker for Python using the ast module.',
      a: `Parse with <code>ast.parse</code> and build a CFG per function, with statement nodes and if/loop/try edges. The fact domain is the set of tainted local names, plus attribute paths up to length 2. The transfer function for Assign is: if the RHS is a source call, taint the targets; if it is a sanitizer call, untaint them; otherwise taint the targets if any sub-expression reads a tainted name, else untaint them (strong update on locals). With-targets, for-targets and AugAssign are handled the same way. The meet is union, and the solver is the worklist from the dataflow lesson. At each Call node matching a sink spec, check the specific argument index and keyword, and emit a finding with the path, recovered by recording, for each fact, the node that generated it. Specs are YAML: dotted names for sources, sinks and sanitizers, plus propagator summaries for common library functions. Test with a ruleid/ok-annotated corpus, as Semgrep does.`
    },
    {
      q: 'Write (or describe) a CodeQL query that finds remote input flowing into SQL in a Java app.',
      a: `Define <code>module SqlConfig implements DataFlow::ConfigSig</code>. <code>isSource</code> is <code>src instanceof RemoteFlowSource</code>, which already models servlet parameters, Spring <code>@RequestParam</code> and similar. <code>isSink</code> matches the first argument of <code>java.sql.Statement.executeQuery</code>, <code>execute</code> and <code>executeUpdate</code>, or, more simply, CodeQL's existing <code>QueryInjectionSink</code> class. Add an <code>isBarrier</code> for primitive and boxed numeric types. Then <code>module SqlFlow = TaintTracking::Global&lt;SqlConfig&gt;</code>, import <code>SqlFlow::PathGraph</code>, and select sink, source and path where <code>SqlFlow::flowPath(source, sink)</code>, with <code>@kind path-problem</code> metadata so that the SARIF output carries the path. Create the database with <code>codeql database create --language=java --command="mvn compile"</code> and run <code>codeql database analyze</code>.`
    },
    {
      q: 'How do you evaluate whether your taint analysis is any good?',
      a: `I would use three layers. (1) Micro-benchmarks with ground truth (DroidBench, OWASP Benchmark, Juliet) for per-CWE precision and recall. They are useful for regression testing the engine, but they are biased. (2) Known-vulnerability recall: take CVEs with fixing commits in real projects, check whether the tool flags the vulnerable version and stops flagging the fixed version. (3) Precision on real code: run the tool on a sample of projects and have two people triage a random sample of findings, reporting agreement (Cohen's kappa) and confidence intervals. Report the cost too, meaning time and memory per KLOC, and the soundiness assumptions (reflection, frameworks). Differential comparison against CodeQL or Semgrep on the same corpus provides a baseline.`
    },
    {
      q: 'Your taint tool misses a flow that goes through a lambda passed to `list.forEach`. Why?',
      a: `Probably a call-graph gap. The lambda compiles to an <code>invokedynamic</code> that creates a synthetic class, and <code>forEach</code> is a library method that calls <code>accept</code> on it. If the tool either does not model <code>LambdaMetafactory</code> or uses a library summary for <code>forEach</code> that does not invoke the callback, taint never enters the lambda body. The fix is to model invokedynamic lambda creation in the call graph and to give higher-order library methods summaries of the form "invokes argument 0's functional method with each element". The same issue appears in Python with <code>map</code>, <code>sorted(key=)</code> and decorators.`
    }
  ]
};
