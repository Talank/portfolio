window.LESSONS = window.LESSONS || {};
window.LESSONS['pointer-and-callgraph'] = {
  id: 'pointer-and-callgraph',
  title: 'Call Graphs & Pointer Analysis: CHA, RTA, Andersen vs Steensgaard',
  category: 'Part 3 — Static Analysis Theory',
  timeMin: 45,
  summary: `Every interprocedural analysis has to answer two questions before it can do anything else: <i>which methods can this call site invoke?</i> (the call graph) and <i>which objects can this variable or field refer to?</i> (points-to). In Java and Python a virtual call <code>s.area()</code> depends on the runtime type of <code>s</code>, so the two questions depend on each other. This lesson goes from the cheapest answers (CHA, RTA, VTA), which use only the type hierarchy, to the inclusion-based (Andersen) and unification-based (Steensgaard) points-to analyses. It then covers the sensitivity knobs that trade cost for precision (context, field, flow, heap) and the frameworks that implement them: Soot/SootUp and Spark, WALA, Doop and Tai-e.`,
  goals: [
    `Build CHA and RTA call graphs by hand for a small Java hierarchy and explain why RTA is more precise but still sound for a closed program`,
    `Write Andersen's four constraint rules and solve them; explain why Steensgaard is near-linear but less precise`,
    `Define context, field, flow and heap sensitivity and state what each costs`,
    `Compare call-site sensitivity (k-CFA), object sensitivity and type sensitivity for Java`,
    `Explain on-the-fly call-graph construction and the soundiness problems of reflection, dynamic loading and native code`
  ],
  concept: [
    {
      h: 'Why call graphs come first, and why they are hard',
      p: [
        `A <b>call graph</b> has one node per method and an edge from each call site to every method it might invoke. Static calls (<code>Math.max</code>, <code>super.foo()</code>, constructors) have exactly one target. A virtual call <code>s.area()</code> dispatches on the runtime class of <code>s</code>, and for Python <i>every</i> call is dynamic, because <code>f</code> is just a variable. Taint analysis, dead-method detection, inlining and test-impact analysis all walk this graph. A missing edge is a missed bug, and a spurious edge is a false alarm plus wasted analysis time.`,
        `The circularity: to resolve <code>s.area()</code> precisely you need the points-to set of <code>s</code>, and to compute points-to sets you need to know which methods are called, because parameters and returns carry objects. Cheap algorithms break the cycle by ignoring dataflow and using only types. Precise algorithms solve both together, <b>on the fly</b>.`
      ]
    },
    {
      h: 'Type-based call graphs: CHA, RTA, VTA',
      p: [
        `<b>CHA</b> (Class Hierarchy Analysis; Dean, Grove and Chambers 1995): for <code>x.m()</code> with declared type T, the targets are the implementation of <code>m</code> that each concrete subtype of T dispatches to. It needs only the hierarchy, so it is fast and simple, and it is sound if the hierarchy is complete. It is also very imprecise: <code>Object.toString()</code> fans out to every override in the classpath.`,
        `<b>RTA</b> (Rapid Type Analysis; Bacon and Sweeney 1996): like CHA, but only classes <i>instantiated</i> (a reachable <code>new C()</code>) in methods already found reachable are candidates. It is computed as a fixpoint: discovering a new reachable method can add new instantiated classes, which can add new targets. Unused library subclasses disappear, which in practice often removes a large fraction of CHA's edges.`,
        `<b>VTA</b> (Variable Type Analysis; Sundaresan et al. 2000, built in Soot): propagate class types along assignments through a type-flow graph, so each variable gets its own set of possible runtime types instead of "everything instantiated anywhere". It is a cheap, field-based form of points-to with types as the abstract objects. Precision order: CHA ⊇ RTA ⊇ VTA ⊇ points-to-based call graphs.`
      ],
      code: `abstract class Shape { abstract double area(); }
class Circle extends Shape { double area() { return 3.14 * r * r; } double r = 1; }
class Square extends Shape { double area() { return s * s; } double s = 1; }
class Cube   extends Square { }                        // inherits Square.area()

static void main(String[] a) { Shape s = new Circle(); print(s.area()); }

CHA  s.area() -> { Circle.area, Square.area }   (Cube dispatches to Square.area)
RTA  s.area() -> { Circle.area }                (only Circle is ever instantiated)
VTA  s.area() -> { Circle.area }                (types reaching s: {Circle})`
    },
    {
      h: `Andersen's analysis: inclusion constraints`,
      p: [
        `Points-to analysis approximates, for each pointer variable, the set of <b>abstract objects</b> it may refer to. The standard heap abstraction is the <b>allocation site</b>: every object created at <code>new Foo()</code> on line 12 becomes one abstract object, o12. Andersen (1994) generates one subset constraint per statement and solves them to a fixpoint:`,
        `<div class="cmp-wrap"><table class="cmp"><tr><th>Statement</th><th>Constraint</th><th>Java analogue</th></tr><tr><td><code>p = &amp;a</code></td><td>{a} ⊆ pts(p)</td><td><code>p = new A()</code> (o_A ∈ pts(p))</td></tr><tr><td><code>p = q</code></td><td>pts(q) ⊆ pts(p)</td><td>assignment, parameter passing, return</td></tr><tr><td><code>p = *q</code></td><td>∀o ∈ pts(q): pts(o) ⊆ pts(p)</td><td><code>p = q.f</code>: pts(o.f) ⊆ pts(p)</td></tr><tr><td><code>*p = q</code></td><td>∀o ∈ pts(p): pts(q) ⊆ pts(o)</td><td><code>p.f = q</code>: pts(q) ⊆ pts(o.f)</td></tr></table></div>`,
        `Solvers build a constraint graph with an edge q → p for each copy, propagate sets along the edges with a worklist, and add new edges whenever a load or store's base gains a new object. The worst case is O(n³). Real solvers collapse cycles (every node in a copy cycle has the same set), and Hardekopf and Lin's lazy cycle detection made Andersen practical on programs with millions of lines.`
      ]
    },
    {
      h: `Steensgaard's analysis: unification`,
      p: [
        `Steensgaard (1996) replaces "⊆" with "=": an assignment <code>p = q</code> <b>merges</b> the points-to classes of p and q, using union-find, and every equivalence class has at most one pointee class. Each statement is processed once, so it runs in almost linear time, O(n·α(n)). The price is precision. After <code>r = p; r = q</code>, p, q and r all point to the merged class {a, b}, even though p never pointed to b. The code below shows both side by side on the same program.`,
        `<b>Rule of thumb:</b> Steensgaard is good when you need a fast, coarse alias oracle over a huge C codebase, for example to decide which loads may be affected by a store. Andersen is the baseline for anything a developer will read, such as call graphs, taint or null checks. Most modern Java tools use Andersen-style analysis plus context sensitivity.`
      ],
      code: `Program: p = &a; q = &b; r = p; r = q; s = &c; t = &p; *t = s; u = *t

Andersen   : {'p': ['a', 'c'], 'q': ['b'], 'r': ['a', 'b', 'c'], 's': ['c'], 't': ['p'], 'u': ['a', 'c']}
Steensgaard: {'p': ['a', 'b', 'c'], 'q': ['a', 'b', 'c'], 'r': ['a', 'b', 'c'], 's': ['a', 'b', 'c'],
              't': ['p'], 'u': ['a', 'b', 'c']}
                     ^ q "points to" a and c only because r = p; r = q unified everything`
    },
    {
      h: 'The sensitivity knobs',
      p: [
        `<ul><li><b>Flow sensitivity:</b> a separate points-to state per program point, so order matters. It allows <b>strong updates</b>: after <code>p = new A(); p = new B()</code>, pts(p) = {o_B}. It is expensive, and for heap fields strong updates are only valid when the base points to a single concrete object.</li><li><b>Field sensitivity:</b> o.f and o.g are tracked separately. Field-<i>based</i> analysis merges all objects' f fields, and field-<i>insensitive</i> analysis merges all fields of one object. Field sensitivity is essential for Java, where most data flows through fields.</li><li><b>Context sensitivity:</b> analyse a method separately for different calling contexts, so <code>id(x)</code> called with a String and with an Integer does not mix the two. Contexts can be call sites (k-CFA: the last k call sites), receiver objects (<b>object sensitivity</b>, Milanova et al.) or receiver types (<b>type sensitivity</b>, Smaragdakis et al.).</li><li><b>Heap sensitivity (heap cloning):</b> qualify allocation sites by context, so that each <code>new ArrayList()</code> inside a factory gets a separate abstract object per caller.</li><li><b>Path sensitivity:</b> track branch conditions. This is rare in points-to analysis and is the domain of symbolic execution.</li></ul>`,
        `For Java, the consensus from the Doop line of work is that <b>object sensitivity</b> (for example 2-object with a 1-object heap context, "2obj+H") beats k-call-site sensitivity at similar cost, because Java's precision problems come from containers and factories reached through receivers. Context sensitivity can blow up exponentially, so modern tools apply it <i>selectively</i>, only to methods that benefit (Scaler, Zipper and the Tai-e/Qilin line of work).`
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: `What a pointer-analysis interviewer digs into: writing the analysis as Datalog, how frameworks construct call graphs on the fly, why "sound" call graphs are really "soundy", and what is different about Python.`,
    sections: [
      {
        h: 'Points-to analysis as Datalog (the Doop style)',
        p: [
          `Doop (Bravenboer and Smaragdakis, OOPSLA 2009) expresses the whole analysis as Datalog rules over facts extracted from bytecode (Soot's Jimple, now also WALA's IR). It originally ran on LogicBlox and now runs on Soufflé, which compiles Datalog to parallel C++. Changing the context abstraction becomes a few rule changes, which is why the papers comparing k-CFA, object and type sensitivity all came out of the same codebase. The core rules below are simplified. Real Doop uses longer relation names and threads context through every relation.`
        ],
        code: `// Simplified, context-insensitive Andersen for Java in Datalog (Doop-style).
VarPointsTo(v, h)        :- Alloc(v, h, meth), Reachable(meth).
VarPointsTo(to, h)       :- Move(to, from), VarPointsTo(from, h).
FieldPointsTo(bh, f, h)  :- Store(base, f, from), VarPointsTo(base, bh), VarPointsTo(from, h).
VarPointsTo(to, h)       :- Load(to, base, f), VarPointsTo(base, bh), FieldPointsTo(bh, f, h).

// On-the-fly call graph: dispatch on the TYPE OF THE OBJECT, not the declared type.
CallGraph(inv, m), Reachable(m), VarPointsTo(this_m, h) :-
    VCall(base, sig, inv, caller), Reachable(caller),
    VarPointsTo(base, h), HeapType(h, t), Dispatch(t, sig, m), ThisVar(m, this_m).
// ...plus rules binding actual arguments to formals and return values to call results.`
      },
      {
        h: 'Frameworks and what they give you',
        p: [
          `<b>Soot</b> (Sable/McGill, now Paderborn) built Jimple. Its call-graph phase <code>cg</code> offers <code>cg.cha</code> and <b>Spark</b> (<code>cg.spark</code>, Lhoták and Hendren 2003), an Andersen-style, field-sensitive, context-insensitive points-to analysis that builds the call graph on the fly. <b>SootUp</b> is the redesigned successor, without global singletons. It ships <code>ClassHierarchyAnalysisAlgorithm</code> and <code>RapidTypeAnalysisAlgorithm</code>, and pointer analyses such as Qilin plug in alongside it (see the Soot/SootUp lesson). <b>WALA</b> (IBM) provides builders like 0-CFA, 0-1-CFA and container-sensitive variants for Java and JavaScript. <b>Doop</b> is the declarative research workhorse. <b>Tai-e</b> (Tan and Li, 2023) is a newer Java framework designed to make pointer analysis and its plugins easy to develop.`,
          `For <b>Python</b>, call graphs are harder: first-class functions, decorators, monkey patching and <code>getattr</code>. PyCG (Salis et al., ICSE 2021) builds an assignment graph over namespaces, much like a field-based Andersen over Python names, and reports high precision and recall on its micro-benchmark. Type checkers' inferred types (mypy, Pyright) provide a CHA-like fallback.`
        ]
      },
      {
        h: 'Soundiness: what sound call graphs leave out',
        p: [
          `Livshits et al. ("In Defense of Soundiness", CACM 2015) observed that essentially every practical whole-program analysis is unsound for some language features. For Java these are reflection (<code>Class.forName(s).newInstance()</code>), dynamic proxies, class loading, native methods (JNI), serialization callbacks and <code>invokedynamic</code> lambdas, which need modelling of <code>LambdaMetafactory</code>. For Python they include <code>eval</code>, <code>exec</code>, <code>importlib</code>, <code>__getattr__</code> and metaclasses.`,
          `Mitigations include string analysis for reflection targets (Doop's reflection support, Tamiflex's dynamic reflection logs), stubs and models for native and library code, and entry-point models for frameworks: Android lifecycle callbacks (FlowDroid generates a dummy main), Spring dependency injection and JUnit test runners. When you claim "sound", list which of these you model. Research on flaky tests and test selection runs into this directly: a regression-test-selection tool's call graph that misses reflective edges skips tests it should have run.`
        ]
      },
      {
        h: 'Demand-driven and incremental analysis',
        p: [
          `Whole-program exhaustive analysis does not fit in an IDE. <b>Demand-driven</b> points-to analysis answers "what can <i>this</i> variable point to?" by exploring backward from it as a CFL-reachability problem with balanced parentheses for calls and fields (Sridharan and Bodík's refinement-based analysis; Boomerang). <b>Incremental</b> analysis re-solves only the constraints affected by an edit. Datalog engines and Infer's compositional, summary-based design make this natural, which is why Infer can run on every diff at Meta.`
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: `Who Answers When You Call "Cook!"?`,
      text: [
        `Aboard the Sunny, yelling "Cook!" means whoever holds the role of Cook. CHA is the rookie Marine reading the World Government's job registry: "Cook could be Sanji, or any cook who ever trained under Zeff at the Baratie." That is everyone with that job in the whole hierarchy. Sound, but the list is long.`,
        `RTA is Nami's sharper version: only count cooks who actually came aboard this voyage. Zeff never boarded, so he is off the list. Andersen is Robin tracking each Den Den Mushi separately: "this snail was handed from Usopp to Chopper, so Chopper's snail might reach Usopp's contacts, and only those." Steensgaard is Luffy: "Usopp's snail and Chopper's snail got swapped once, so from now on they are the same snail, and everyone they ever talked to is one group." Fast, simple and much too generous.`
      ]
    },
    sitcom: {
      show: 'Friends',
      title: 'Whose Sandwich Is It?',
      text: [
        `Ross's sandwich goes missing at work. His boss's first theory is "anyone employed at the museum could have taken it." That is CHA: correct and useless. Ross narrows it to "anyone who was actually in the building today", which is RTA.`,
        `Then Ross does it properly: the note went from his bag to the fridge, the fridge was opened by these three people, and one of them took a container to that desk. He tracks exactly who passed what to whom, which is Andersen. Monica's shortcut, "everyone who ever shared a fridge with you is one suspect", is Steensgaard. She finishes in seconds, and half of Manhattan is under suspicion.`
      ]
    },
    why: `CHA, RTA and Andersen are increasingly careful answers to "who could be on the other end of this name". The hierarchy is CHA, who was actually created is RTA, and who was actually passed where is points-to. Unification is the shortcut that merges anyone who ever touched the same snail or fridge.`
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'site', emoji: '📣', label: 's.area()', x: 10, y: 45 },
      { id: 'circle', emoji: '⭕', label: 'Circle.area', x: 55, y: 14 },
      { id: 'square', emoji: '⬛', label: 'Square.area', x: 55, y: 50 },
      { id: 'cube', emoji: '🧊', label: 'Cube (inherits)', x: 55, y: 84 },
      { id: 'verdict', emoji: '📜', label: 'targets: ?', x: 88, y: 45 }
    ],
    actors: [
      { id: 'marine', emoji: '🪖', label: 'CHA', x: 25, y: 20 },
      { id: 'nami', emoji: '🧭', label: 'RTA', x: 25, y: 70 },
      { id: 'robin', emoji: '📚', label: 'points-to', x: 30, y: 45 }
    ],
    steps: [
      { c: `A virtual call site: Shape s = new Circle(); s.area(). Who could answer?`, p: { site: 'lit' } },
      { c: `CHA reads the hierarchy: every concrete subtype of Shape. Circle, Square, and Cube, which dispatches to Square.area.`, a: { marine: [42, 40] }, p: { circle: 'lit', square: 'lit', cube: 'lit' }, l: { verdict: 'CHA: {Circle.area, Square.area}' } },
      { c: `RTA asks which classes are ever instantiated in reachable code. Only Circle. Square and Cube drop out.`, a: { nami: [42, 62] }, p: { square: 'dim', cube: 'dim', circle: 'good' }, l: { verdict: 'RTA: {Circle.area}' } },
      { c: `If main also did "new Square()" for another variable, RTA would add Square.area back, because RTA is still per-program, not per-variable.`, p: { square: 'lit' }, l: { verdict: 'RTA: {Circle, Square} (!)' } },
      { c: `Points-to tracks objects per variable: pts(s) = {o_Circle}. The Square object flows elsewhere, so s.area() has one target.`, a: { robin: [44, 30] }, p: { square: 'dim', circle: 'good' }, l: { verdict: 'Andersen: {Circle.area}' } },
      { c: `Precision order: CHA ⊇ RTA ⊇ VTA ⊇ points-to. Fewer spurious edges means fewer false alarms downstream. 🏴‍☠️`, p: { verdict: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'On-the-fly call graph + Andersen points-to',
    intro: 'How Spark, Doop and WALA grow the call graph and the points-to sets together.',
    stages: [
      { label: 'Seed', nodes: [ { id: 'entry', text: 'Entry points\nmain, tests,\nframework callbacks' } ] },
      { label: 'Constraints', nodes: [ { id: 'alloc', text: 'new C() at site h\n→ h ∈ pts(v)' }, { id: 'copy', text: 'v = w / args / ret\n→ pts(w) ⊆ pts(v)' }, { id: 'field', text: 'v.f = w,  v = w.f\n→ via pts(o.f)' } ] },
      { label: 'Solve', nodes: [ { id: 'prop', text: 'Worklist propagation\nalong constraint graph' }, { id: 'cyc', text: 'Collapse cycles\n(same set on a cycle)' } ] },
      { label: 'Discover', nodes: [ { id: 'disp', text: 'Virtual call x.m()\ndispatch on types\nof objects in pts(x)' }, { id: 'newm', text: 'New target method\n→ reachable, add its\nconstraints' } ] },
      { label: 'Result', nodes: [ { id: 'cg', text: 'Call graph +\npoints-to sets\n(fixpoint)' } ] }
    ],
    steps: [
      { active: ['entry'], note: 'Start from entry points. For a library or framework you must model them: test methods, servlet handlers, Android lifecycle callbacks.' },
      { active: ['alloc'], note: 'Each allocation site becomes an abstract object. Every object created at that site is represented by it.' },
      { active: ['copy'], note: 'Assignments, parameter passing and returns become subset edges in the constraint graph.' },
      { active: ['field'], note: 'Loads and stores are complex constraints: their edges depend on what the base variable points to, so they are added as the sets grow.' },
      { active: ['prop'], note: 'Propagate points-to sets along the edges until nothing changes. This is the same worklist pattern as dataflow analysis.' },
      { active: ['cyc'], note: 'Nodes on a cycle of copy edges must end up with equal sets. Collapsing them is the key optimisation that makes Andersen scale.' },
      { active: ['disp'], note: 'When pts(x) gains an object of type T, resolve x.m() by dispatching on T. This gives far fewer targets than CHA.' },
      { active: ['newm'], note: 'A newly reachable method contributes its own allocation, copy and field constraints, so the loop continues.' },
      { active: ['cg'], note: 'At the fixpoint the call graph and the points-to sets are consistent with each other. Taint, null and escape analyses are built on top of this.' }
    ]
  },
  tech: [
    {
      q: 'Why is the allocation site the standard heap abstraction?',
      a: `The number of runtime objects is unbounded, so the analysis needs a finite name for them. Allocation sites are finite and syntactic, and objects created at the same <code>new</code> tend to be used the same way. The cost: every object from a factory method's single <code>new ArrayList()</code> collapses into one abstract list, so two unrelated callers' lists alias. Heap cloning (qualifying the site with a context) or object sensitivity separates them.`
    },
    {
      q: 'Why do flow-insensitive analyses only do weak updates?',
      a: `A flow-insensitive analysis computes one points-to set per variable for the whole program, so a later assignment cannot "replace" an earlier one. Every assignment just adds. Even a flow-sensitive analysis can only <b>strongly</b> update a field <code>o.f = x</code> when the base definitely refers to one concrete runtime object. An abstract object that stands for many runtime objects (a summary object) must be weakly updated, otherwise the analysis would drop values that other runtime objects still hold.`
    },
    {
      q: 'How do you handle Java lambdas and invokedynamic in a call graph?',
      a: `A lambda compiles to an <code>invokedynamic</code> instruction whose bootstrap method (<code>LambdaMetafactory.metafactory</code>) creates, at runtime, an object implementing the functional interface that forwards to a synthetic <code>lambda$main$0</code> method. A call-graph builder has to model this: treat the indy site as allocating a synthetic class that implements the interface and dispatches to the synthetic method. Soot, SootUp, WALA and Doop each have dedicated handling, with different coverage. If a tool ignores it, every call through a <code>Runnable</code> or <code>Function</code> created by a lambda silently has no targets, which is a classic false-negative source.`
    },
    {
      q: 'What is k-CFA and why is k usually 1 or 2?',
      a: `k-CFA (Shivers) distinguishes method analyses by the last k call sites on the stack. Each method can have up to |call sites|^k contexts, and every variable and heap object is replicated per context, so cost grows exponentially in k. For Java, k = 1 or 2 already separates most wrapper and utility methods, and beyond that the cost explodes with little extra precision. Object sensitivity with depth 2 usually beats call-site sensitivity with the same k for OO code.`
    }
  ],
  code: {
    title: 'Andersen vs Steensgaard on the same program',
    intro: `Stdlib only. Save it as <code>pointsto.py</code> and run <code>python3 pointsto.py</code>. The four statement kinds are the canonical C forms. For Java, read <code>addr</code> as <code>new</code>, and <code>load</code>/<code>store</code> as field reads and writes.`,
    code: "\"\"\"Andersen (inclusion-based) vs Steensgaard (unification-based) points-to\nanalysis on the four canonical statement forms.  Flow- and context-insensitive.\"\"\"\nfrom collections import defaultdict\n\n# C-like program:\n#   p = &a;  q = &b;  r = p;  r = q;  s = &c;  t = &p;  *t = s;  u = *t\nPROGRAM = [\n    (\"addr\",  \"p\", \"a\"),   # p = &a\n    (\"addr\",  \"q\", \"b\"),   # q = &b\n    (\"copy\",  \"r\", \"p\"),   # r = p\n    (\"copy\",  \"r\", \"q\"),   # r = q\n    (\"addr\",  \"s\", \"c\"),   # s = &c\n    (\"addr\",  \"t\", \"p\"),   # t = &p\n    (\"store\", \"t\", \"s\"),   # *t = s\n    (\"load\",  \"u\", \"t\"),   # u = *t\n]\n\n\ndef andersen(stmts):\n    pts = defaultdict(set)            # var -> set of abstract locations\n    changed = True\n    while changed:                    # naive fixpoint; real solvers use a worklist\n        changed = False               # over a constraint graph + cycle elimination\n        def add(dst, locs):\n            nonlocal changed\n            before = len(pts[dst])\n            pts[dst] |= locs\n            changed |= len(pts[dst]) != before\n        for kind, a, b in stmts:\n            if kind == \"addr\":   add(a, {b})                  # {b} ⊆ pts(a)\n            elif kind == \"copy\": add(a, set(pts[b]))          # pts(b) ⊆ pts(a)\n            elif kind == \"load\":                              # ∀o∈pts(b): pts(o) ⊆ pts(a)\n                for o in list(pts[b]): add(a, set(pts[o]))\n            elif kind == \"store\":                             # ∀o∈pts(a): pts(b) ⊆ pts(o)\n                for o in list(pts[a]): add(o, set(pts[b]))\n    return {v: sorted(s) for v, s in sorted(pts.items()) if s}\n\n\nclass Steensgaard:\n    \"\"\"Each equivalence class (union-find node) has at most ONE pointee class.\"\"\"\n    def __init__(self):\n        self.parent, self.pointee = {}, {}\n\n    def find(self, x):\n        self.parent.setdefault(x, x)\n        while self.parent[x] != x:\n            self.parent[x] = self.parent[self.parent[x]]   # path halving\n            x = self.parent[x]\n        return x\n\n    def union(self, x, y):\n        x, y = self.find(x), self.find(y)\n        if x == y: return x\n        self.parent[y] = x\n        px, py = self.pointee.pop(x, None), self.pointee.pop(y, None)\n        if px and py: self.pointee[x] = self.union(px, py)   # unify pointees too\n        elif px or py: self.pointee[x] = px or py\n        return self.find(x)\n\n    def deref(self, x):               # class that x points to (create if absent)\n        x = self.find(x)\n        if x not in self.pointee:\n            self.pointee[x] = self.find(\"*\" + x)\n        return self.find(self.pointee[x])\n\n    def run(self, stmts):\n        for kind, a, b in stmts:\n            if kind == \"addr\":    self.union(self.deref(a), b)\n            elif kind == \"copy\":  self.union(self.deref(a), self.deref(b))\n            elif kind == \"load\":  self.union(self.deref(a), self.deref(self.deref(b)))\n            elif kind == \"store\": self.union(self.deref(self.deref(a)), self.deref(b))\n        vars_ = {v for _, a, b in stmts for v in (a, b)}\n        classes = defaultdict(set)\n        for v in vars_: classes[self.find(v)].add(v)\n        out = {}\n        for v in sorted(vars_):\n            c = self.find(v)\n            if c in self.pointee:\n                out[v] = sorted(classes[self.find(self.pointee[c])])\n        return out\n\n\nprint(\"Andersen   :\", andersen(PROGRAM))\nprint(\"Steensgaard:\", Steensgaard().run(PROGRAM))\n",
    notes: [
      `Verified output: <code>Andersen : {'p': ['a', 'c'], 'q': ['b'], 'r': ['a', 'b', 'c'], 's': ['c'], 't': ['p'], 'u': ['a', 'c']}</code>. Steensgaard reports <code>['a', 'b', 'c']</code> for p, q, r, s and u.`,
      `p gains c in both analyses through the store <code>*t = s</code>: t points to p, so the store writes s's targets into pts(p).`,
      `The Andersen solver iterates naively over every statement until nothing changes. Real solvers propagate only along changed edges and collapse cycles. Try making <code>r = p; p = r</code> a copy cycle and note that both variables end with identical sets.`
    ]
  },
  lab: {
    title: 'Build CHA and RTA call-graph resolution',
    prompt: `Implement <code>subtypes</code>, <code>dispatch</code>, <code>cha_targets</code> and <code>rta_targets</code> for the Shape hierarchy in the starter. <code>dispatch(cls, m)</code> walks up the superclass chain to the first class that declares <code>m</code>, as Java virtual dispatch does. CHA considers every non-abstract subtype of the declared type. RTA intersects that set with <code>INSTANTIATED</code>. The asserts check that CHA gives {Circle.area, Square.area} and RTA gives only {Circle.area}.`,
    starter: `SUPER = {"Shape": None, "Circle": "Shape", "Square": "Shape", "Cube": "Square"}
DECLARES = {"Shape": set(), "Circle": {"area"}, "Square": {"area"}, "Cube": set()}
ABSTRACT = {"Shape"}
INSTANTIATED = {"Circle"}


def subtypes(t):
    """t and every class that transitively extends it."""
    return {t}                       # TODO


def dispatch(cls, method):
    """Walk up from the runtime class to the first declaration."""
    return None                      # TODO


def cha_targets(declared_type, method):
    return set()                     # TODO


def rta_targets(declared_type, method):
    return set()                     # TODO


print("CHA s.area() ->", sorted(cha_targets("Shape", "area")))
print("RTA s.area() ->", sorted(rta_targets("Shape", "area")))
assert cha_targets("Shape", "area") == {"Circle.area", "Square.area"}
assert rta_targets("Shape", "area") == {"Circle.area"}
print("all assertions passed")
`,
    checks: [
      { re: 'def\\s+subtypes[\\s\\S]*?SUPER\\.items\\(\\)', flags: '', must: true, hint: 'subtypes: iterate SUPER.items() to a fixpoint, adding every class whose superclass is already in the set.', pass: 'transitive subtypes ✓' },
      { re: 'while\\s+cls\\s+is\\s+not\\s+None', flags: '', must: true, hint: 'dispatch: while cls is not None, check DECLARES[cls], then move to SUPER[cls].', pass: 'dispatch walks the superclass chain ✓' },
      { re: 'cls\\s*=\\s*SUPER\\[cls\\]', flags: '', must: true, hint: 'Move up the hierarchy: cls = SUPER[cls].', pass: 'moves to superclass ✓' },
      { re: 'not\\s+in\\s+ABSTRACT', flags: '', must: true, hint: 'Skip abstract classes, which can never be a runtime receiver: c not in ABSTRACT.', pass: 'skips abstract classes ✓' },
      { re: '&\\s*INSTANTIATED|INSTANTIATED\\s*&|in\\s+INSTANTIATED', flags: '', must: true, hint: 'RTA: restrict candidates to INSTANTIATED classes, e.g. subtypes(t) & INSTANTIATED.', pass: 'RTA filters by instantiation ✓' },
      { re: 'return\\s+set\\(\\)\\s*#\\s*TODO', flags: '', must: false, hint: 'A TODO stub is still returning set().', pass: 'stubs replaced ✓' }
    ],
    run: `Save it as <code>cg_lab.py</code> and run <code>python3 cg_lab.py</code>. Expected output: <code>CHA s.area() -&gt; ['Circle.area', 'Square.area']</code>, then <code>RTA s.area() -&gt; ['Circle.area']</code>, then <code>all assertions passed</code>. Next, add <code>"Cube"</code> to INSTANTIATED. RTA should then return Square.area as well, because Cube inherits it. For the real thing on Java bytecode, the Soot/SootUp lesson builds both call graphs with SootUp's <code>ClassHierarchyAnalysisAlgorithm</code> and <code>RapidTypeAnalysisAlgorithm</code>.`,
    solution: "# Class hierarchy of a small Java program:\n#   abstract class Shape { abstract double area(); }\n#   class Circle extends Shape { double area() {...} }\n#   class Square extends Shape { double area() {...} }\n#   class Cube   extends Square { }            // inherits Square.area()\n#   main: Shape s = new Circle(); s.area();   (Square is never instantiated)\nSUPER = {\"Shape\": None, \"Circle\": \"Shape\", \"Square\": \"Shape\", \"Cube\": \"Square\"}\nDECLARES = {\"Shape\": set(), \"Circle\": {\"area\"}, \"Square\": {\"area\"}, \"Cube\": set()}\nABSTRACT = {\"Shape\"}\nINSTANTIATED = {\"Circle\"}                  # classes with a reachable `new`\n\n\ndef subtypes(t):\n    \"\"\"t and every class that transitively extends it.\"\"\"\n    out = {t}\n    changed = True\n    while changed:\n        changed = False\n        for c, sup in SUPER.items():\n            if sup in out and c not in out:\n                out.add(c)\n                changed = True\n    return out\n\n\ndef dispatch(cls, method):\n    \"\"\"Walk up from the runtime class to the first declaration: Java virtual dispatch.\"\"\"\n    while cls is not None:\n        if method in DECLARES[cls]:\n            return f\"{cls}.{method}\"\n        cls = SUPER[cls]\n    return None\n\n\ndef cha_targets(declared_type, method):\n    \"\"\"CHA: any concrete subtype of the declared receiver type might be the receiver.\"\"\"\n    return {dispatch(c, method) for c in subtypes(declared_type)\n            if c not in ABSTRACT and dispatch(c, method)}\n\n\ndef rta_targets(declared_type, method):\n    \"\"\"RTA: like CHA, but only classes instantiated somewhere in reachable code.\"\"\"\n    return {dispatch(c, method) for c in subtypes(declared_type) & INSTANTIATED\n            if c not in ABSTRACT and dispatch(c, method)}\n\n\nprint(\"CHA s.area() ->\", sorted(cha_targets(\"Shape\", \"area\")))\nprint(\"RTA s.area() ->\", sorted(rta_targets(\"Shape\", \"area\")))\nassert cha_targets(\"Shape\", \"area\") == {\"Circle.area\", \"Square.area\"}\nassert rta_targets(\"Shape\", \"area\") == {\"Circle.area\"}\nprint(\"all assertions passed\")\n",
    notes: [
      `Real RTA computes INSTANTIATED as part of the fixpoint: only <code>new</code> expressions in methods already found reachable count, and each new target can make more methods reachable. Here it is given, to keep the lab small.`,
      `<code>dispatch</code> returning None means "no concrete implementation", for example on an abstract class. CHA must skip abstract receivers, otherwise it adds edges to methods with no body.`
    ]
  },
  quiz: [
    {
      q: 'What is the key difference between CHA and RTA?',
      options: ['RTA uses points-to sets', 'RTA only considers classes that are instantiated in reachable code', 'CHA is unsound', 'CHA works only for static calls'],
      correct: 1,
      explain: 'Both are type-based. RTA prunes CHA targets to classes with a reachable new expression, computed as a fixpoint with reachability.'
    },
    {
      q: 'After `r = p; r = q` with p → {a}, q → {b}, what does Steensgaard report for p?',
      options: ['{a}', '{a, b}', '{b}', '{}'],
      correct: 1,
      explain: 'Unification merges the pointee classes of p, q and r, so p appears to point to b as well. Andersen keeps p → {a}.'
    },
    {
      q: 'Which statement is true of Andersen-style analysis?',
      options: ['It runs in near-linear time', 'It uses subset constraints and has cubic worst-case time', 'It is flow-sensitive by definition', 'It cannot handle fields'],
      correct: 1,
      explain: 'Inclusion constraints, O(n³) worst case, and usually flow-insensitive. Field sensitivity is an independent choice, and Java implementations are field-sensitive.'
    },
    {
      q: 'For Java, which context abstraction tends to give the best precision for its cost?',
      options: ['Deep call-site sensitivity (k = 5)', 'Object sensitivity (receiver allocation sites)', 'No context sensitivity', 'Path sensitivity'],
      correct: 1,
      explain: 'Empirical results from Doop and others show that 2-object sensitivity with a heap context is a strong sweet spot for OO programs.'
    },
    {
      q: 'Why is a "sound" Java call graph usually only soundy?',
      options: ['Because CHA is unsound', 'Because reflection, dynamic class loading, native code and similar features are only partially modelled', 'Because bytecode lacks type information', 'Because of Rice’s theorem alone'],
      correct: 1,
      explain: 'Practical tools are sound with respect to an explicitly modelled subset of the language. Reflection and native code are the usual gaps.'
    }
  ],
  testFlow: {
    title: 'Test yourself: choose the analysis',
    start: 'q1',
    nodes: {
      q1: { q: 'You need an IDE "find implementations" feature that must run in under 50 ms on every keystroke, over the whole classpath. Choice?', choices: [ { text: 'CHA over the class hierarchy index', to: 'q1_ok' }, { text: '2-object-sensitive Andersen', to: 'q1_obj' } ] },
      q1_ok: { end: true, correct: true, text: 'Yes. CHA needs only the hierarchy, which IDEs already index. Its imprecision is acceptable for navigation.', next: 'q2' },
      q1_obj: { end: true, correct: false, text: 'A whole-program context-sensitive analysis takes minutes, not milliseconds. It is the right tool for a nightly security scan, not keystroke-level navigation.', retry: 'q1' },
      q2: { q: 'Your taint analysis reports flows between two unrelated callers of a shared `wrap(x)` helper. Which knob helps most?', choices: [ { text: 'Context sensitivity (call-site or object)', to: 'q2_ok' }, { text: 'Field sensitivity', to: 'q2_field' }, { text: 'Switch to Steensgaard', to: 'q2_st' } ] },
      q2_ok: { end: true, correct: true, text: 'Right. Context-insensitive analysis merges every call of wrap, so caller A’s tainted argument flows out at caller B. Analysing wrap per context separates them.', next: 'q3' },
      q2_field: { end: true, correct: false, text: 'Field sensitivity separates o.f from o.g. The mixing here is across calling contexts.', retry: 'q2' },
      q2_st: { end: true, correct: false, text: 'Unification merges even more. It would make the spurious flow worse.', retry: 'q2' },
      q3: { q: 'A call graph has no edges out of `Class.forName(name).newInstance().run()`. What is the most likely reason?', choices: [ { text: 'Reflection is not modelled: the target class is a runtime string', to: 'q3_ok' }, { text: 'CHA was used', to: 'q3_cha' } ] },
      q3_ok: { end: true, correct: true, text: 'Correct. This is the classic soundiness gap. Use string analysis, reflection logs (Tamiflex) or manual models.' },
      q3_cha: { end: true, correct: false, text: 'Even CHA needs a declared receiver type. newInstance() returns Object, and without reflection modelling nothing is known about which class was loaded.', retry: 'q3' }
    }
  },
  pitfalls: [
    `Reporting precision of the call graph only. What matters is the client's precision. A call graph with 20% fewer edges may barely change taint results, or may remove most false alarms. Measure on the client.`,
    `Forgetting entry points for frameworks and tests. With only <code>main</code> as an entry, JUnit test methods, Spring beans and Android callbacks are all "unreachable" and silently ignored.`,
    `Assuming a flow-insensitive analysis can kill facts. <code>p = null</code> later in a method does not remove earlier targets from pts(p).`,
    `Turning on deep context sensitivity everywhere. Time and memory blow up exponentially. Prefer object sensitivity and selective or introspective context sensitivity.`,
    `Ignoring lambdas, <code>invokedynamic</code> and reflection, then calling the result sound.`
  ],
  interview: [
    {
      q: 'Explain CHA, RTA and a points-to based call graph, and order them by precision.',
      a: `CHA resolves <code>x.m()</code> to the <code>m</code> implementation of every concrete subtype of x's declared type, using only the hierarchy. RTA keeps only subtypes instantiated in reachable code, and computes reachability and instantiation together as a fixpoint. VTA propagates types along assignments, so each variable gets its own type set. A points-to based call graph dispatches on the types of the abstract objects in pts(x), computed on the fly with Andersen-style constraints. Precision order: CHA ⊇ RTA ⊇ VTA ⊇ points-to. Cost increases in the same order. All of them are sound for a closed world with a complete hierarchy and modelled reflection.`
    },
    {
      q: 'Andersen versus Steensgaard: explain the difference and when you would choose each.',
      a: `Andersen treats an assignment <code>p = q</code> as a subset constraint, pts(q) ⊆ pts(p). The direction is preserved, the worst case is cubic, and it is the precision baseline. Steensgaard treats it as equality and unifies the two classes with union-find, so each class points to at most one class. It runs in near-linear time but is symmetric and over-merges: after <code>r = p; r = q</code>, p appears to point to q's targets. I would use Steensgaard as a fast pre-pass or coarse alias oracle on very large C code (for example to partition the program before a more precise analysis), and Andersen plus context sensitivity for anything users see: call graphs, taint, null dereference.`
    },
    {
      q: 'Tradeoff: k-call-site sensitivity versus object sensitivity for Java.',
      a: `k-CFA separates contexts by the last k call sites. It is cheap to explain, but in OO code the call site that matters is often several frames up (a factory calls a constructor that calls a helper), so small k misses it and large k explodes. Object sensitivity uses the receiver object's allocation site (and its allocator's, for depth 2) as the context, which matches how Java code is organised: containers, builders and factories are distinguished by which object they are. Empirically, 2-object sensitivity with a 1-object heap context gives clearly better precision at comparable or lower cost than 2-CFA on standard benchmarks like DaCapo. Type sensitivity, which uses the class containing the allocation site instead of the site, is a cheaper approximation of the same idea. Today the standard answer is "selective": apply context only where it pays.`
    },
    {
      q: 'Whiteboard: write the constraint rules for Andersen on Java, including virtual calls.',
      a: `Facts per reachable method: <code>v = new T()</code> at site h gives h ∈ pts(v). <code>v = w</code> gives pts(w) ⊆ pts(v). <code>v.f = w</code> gives, for each o in pts(v), pts(w) ⊆ pts(o.f). <code>v = w.f</code> gives, for each o in pts(w), pts(o.f) ⊆ pts(v). For a call <code>r = x.m(a1..an)</code>: for each o in pts(x) with dynamic type T, let m' = dispatch(T, m). Mark m' reachable, add o to pts(this_m'), add pts(ai) ⊆ pts(param_i(m')), and add pts(ret(m')) ⊆ pts(r). Static calls are the same without dispatch. Solve with a worklist over a constraint graph, adding edges when base sets grow and collapsing copy cycles. Entry points (main, tests, framework callbacks) seed reachability.`
    },
    {
      q: 'Your call graph for a Spring Boot service is missing most controller methods. Why, and how do you fix it?',
      a: `Spring calls controllers through reflection and proxies, driven by annotations such as <code>@RestController</code>, <code>@GetMapping</code> and <code>@Autowired</code>. There is no <code>main → controller</code> edge in the bytecode, so a whole-program analysis that starts at <code>main</code> never reaches them. Fixes: (1) synthesise entry points, for example a generated dummy main that calls every annotated handler with abstract arguments, which is what FlowDroid does for Android lifecycle methods; (2) model dependency injection by treating each injected field as pointing to the bean classes that implement its type; (3) model proxies as forwarding to the target. Then validate against dynamic traces from integration tests to measure what is still missing.`
    },
    {
      q: 'How would you build a call graph for Python, and what makes it harder than Java?',
      a: `In Python every call goes through a name binding that can change: first-class functions, decorators that return wrappers, monkey patching, <code>getattr</code> with computed strings, <code>**kwargs</code> forwarding, and dynamic imports. A practical approach is PyCG-style: a flow-insensitive, field-based assignment graph over fully qualified names (modules, classes, functions, attributes), propagated to a fixpoint with an Andersen-like solver, with MRO-aware attribute lookup for classes and explicit models for common decorators (functools.wraps, property, staticmethod). Type annotations or Pyright inference serve as a fallback. Report soundiness explicitly: <code>eval</code>, <code>exec</code>, <code>importlib</code> and <code>__getattr__</code> are not covered. Validate recall against dynamic call traces from running the test suite.`
    },
    {
      q: 'What does "on-the-fly" call-graph construction mean, and why is it more precise than CHA followed by points-to?',
      a: `On the fly, the call graph and the points-to sets are solved together: a virtual call's targets are resolved from the current points-to set of its receiver, and newly discovered targets add constraints, until both reach a joint fixpoint. If you first build a CHA graph and then run points-to over it, methods that CHA thinks are reachable but never actually are still contribute their constraints. Those constraints pollute points-to sets, which then cannot prune the graph. Spark, Doop and WALA all construct on the fly.`
    }
  ]
};
