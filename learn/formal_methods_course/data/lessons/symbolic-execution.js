window.LESSONS = window.LESSONS || {};
window.LESSONS['symbolic-execution'] = {
  id: 'symbolic-execution',
  title: 'Symbolic Execution: Path Conditions, KLEE & angr — Built on Z3',
  category: 'Part 1 — SMT Solvers & Z3',
  timeMin: 45,
  summary: "Symbolic execution runs a program on symbols instead of values. Every branch adds a constraint to the current path condition, and an SMT solver decides which branches are feasible and produces a concrete input for each path. It is how KLEE generated high-coverage tests for GNU Coreutils, how SAGE found a large share of Windows file-parser bugs, and how angr solves binary CTF challenges. This lesson covers the core mechanics (symbolic state, forking, path conditions, feasibility checks), concolic execution (DART/SAGE), the practical tools (KLEE on LLVM bitcode, angr with claripy on binaries), and the problem that dominates everything: path explosion. You build a working symbolic executor for a toy language on Z3 and a concolic test generator.",
  goals: [
    "Explain symbolic state (symbolic store + path condition) and how forking at branches enumerates paths",
    "Generate one concrete test input per feasible path by solving its path condition",
    "Explain concolic (dynamic symbolic) execution and why concretization rescues it from unmodeled code",
    "Use KLEE and angr at the command/API level: klee_make_symbolic, ktest-tool, claripy.BVS, simulation managers, explore(find, avoid)",
    "Name the causes of path explosion and the main mitigations: search heuristics, state merging, summaries, loop bounds, query optimizations",
    "State where symbolic execution sits on the soundness/completeness map and how it relates to fuzzing"
  ],
  concept: [
    {
      h: "The idea: run the program on symbols",
      p: [
        "Classic symbolic execution (King 1976; Boyer, Elspas, Levitt 1975) keeps two things per execution state: a <b>symbolic store</b> mapping variables to expressions over input symbols (after <code>z = 2 * y</code>, z maps to <code>2·β</code>), and a <b>path condition</b> (PC): the conjunction of branch conditions taken so far.",
        "At a branch <code>if (x == z)</code> with symbolic condition c, the executor asks the solver whether <code>PC ∧ c</code> and <code>PC ∧ ¬c</code> are satisfiable, and forks into one state per feasible side. When a path ends (return, crash, failed assertion), solving its PC gives concrete inputs that drive the real program down exactly that path: a test case, or a reproducer for the bug.",
        "Example: <code>z = 2*y; if (x == z) { if (x &gt; y + 10) assert(false); }</code>. The assertion path has PC <code>x = 2y ∧ x &gt; y + 10</code>; Z3 answers with, e.g., <code>x = 32, y = 16</code>. A random tester needs to hit x = 2y exactly, which with 32-bit inputs has probability about 2<sup>-32</sup> per try."
      ]
    },
    {
      h: "Soundness, completeness and what a path gives you",
      p: [
        "Each reported bug comes with a concrete input, and if the modeling is faithful, it is real: symbolic execution is a <b>bug finder</b>, sound for bugs (no false alarms) and incomplete (it explores a subset of paths within a budget). It is also exact per path: the PC is not an approximation, unlike abstract interpretation's join of states.",
        "Exploring all paths would be a proof of the asserted properties for bounded programs, which is essentially bounded model checking done path by path instead of with one big formula.",
        "Where faithfulness breaks: the environment (system calls, files, network), library code without source, floating point, and symbolic pointers. Every tool's design is about handling those: models of the environment (KLEE's POSIX runtime), concretization (concolic), or symbolic memory with SMT arrays."
      ]
    },
    {
      h: "Concolic execution: concrete and symbolic together",
      p: [
        "DART (Godefroid, Klarlund, Sen, PLDI 2005), CUTE (Sen et al. 2005) and SAGE (Godefroid, Levin, Molnar, NDSS 2008) run the program <i>concretely</i> on an input while tracking symbolic expressions alongside. After the run, they take the path condition, negate one branch condition (keeping the prefix), solve, and get a new input that diverges at that branch. Repeat.",
        "Why it helps: when the symbolic engine meets something it cannot model (a hash, a system call, nonlinear math), it substitutes the concrete value it observed and keeps going. That loses completeness for that expression, but the run never gets stuck. SAGE's <b>generational search</b> flips every branch of a run, not just the last, producing many new tests per expensive execution; it ran on Windows file parsers at large scale and found many security bugs the fuzzers missed.",
        "The lab builds exactly this loop in 40 lines."
      ]
    },
    {
      h: "KLEE: symbolic execution of LLVM bitcode",
      p: [
        "KLEE (Cadar, Dunbar, Engler, OSDI 2008) interprets LLVM IR. Memory is modeled as one SMT array of bytes per allocated object, queries are QF_ABV, and the solver is STP by default (Z3 supported). It ships a POSIX environment model (symbolic files, arguments, stdin) and uClibc, which is how it tested all 89 GNU Coreutils programs to high line coverage and found bugs that had been there for years.",
        "Its query optimizations are as important as its search: constraint independence (only send the solver the constraints that share variables with the query), a counterexample cache (reuse previous models; a superset of an unsat set is unsat; a subset of a sat set is sat), and expression rewriting."
      ],
      code: `/* get_sign.c */
#include <klee/klee.h>
int get_sign(int x) {
  if (x == 0) return 0;
  if (x < 0)  return -1;
  else        return 1;
}
int main(void) {
  int a;
  klee_make_symbolic(&a, sizeof(a), "a");
  return get_sign(a);
}

$ clang -I klee/include -emit-llvm -c -g -O0 -Xclang -disable-O0-optnone get_sign.c
$ klee get_sign.bc
KLEE: done: completed paths = 3
KLEE: done: generated tests = 3
$ ktest-tool klee-last/test000002.ktest        # each .ktest holds concrete bytes for "a"
# Useful flags: --search=random-path|nurs:covnew|dfs|bfs, --max-time=10min,
#               --libc=uclibc --posix-runtime (then: ./prog.bc --sym-args 0 2 4 --sym-files 1 8)`
    },
    {
      h: "angr and claripy: symbolic execution of binaries",
      p: [
        "angr (UC Santa Barbara; Shoshitaishvili et al., IEEE S&amp;P 2016) lifts machine code to the VEX IR and executes it symbolically. <b>claripy</b> is its solver front end: <code>claripy.BVS(\"name\", bits)</code> makes a symbolic bit-vector, <code>BVV</code> a concrete one, and constraints go to Z3 underneath. A <b>SimulationManager</b> holds stashes of states (active, found, avoided, deadended, errored) and <code>explore(find=..., avoid=...)</code> steps them until a state reaches a target address.",
        "Unconstrained symbolic memory addresses are concretized according to strategies, library functions are replaced by SimProcedures (Python models of libc), and <code>LAZY_SOLVES</code>, veritesting (state merging, Avgerinos et al., ICSE 2014) and other options trade precision for speed. The canonical use: find the input that makes a crackme print \"Correct\"."
      ],
      code: `import angr, claripy

proj = angr.Project("./crackme", auto_load_libs=False)
pw = claripy.BVS("pw", 8 * 16)                         # 16 symbolic bytes
state = proj.factory.entry_state(args=["./crackme", pw])
for b in pw.chop(8):                                   # printable ASCII only
    state.solver.add(b >= 0x20, b <= 0x7e)

simgr = proj.factory.simulation_manager(state)
simgr.explore(find=lambda s: b"Correct" in s.posix.dumps(1),
              avoid=lambda s: b"Wrong" in s.posix.dumps(1))
if simgr.found:
    print(simgr.found[0].solver.eval(pw, cast_to=bytes))`
    },
    {
      h: "Path explosion and how tools fight it",
      p: [
        "n sequential independent branches give 2<sup>n</sup> paths; a loop whose bound depends on input gives a path per iteration count. This, not solver speed, is the main limit. Mitigations:",
        "<ul><li><b>Search heuristics</b>: pick which state to run next. KLEE's random-path (biased toward shallow states) and coverage-optimized searchers; distance-to-target for directed symbolic execution (KATCH, directed greybox fuzzing).</li><li><b>State merging</b>: join states at control-flow merge points with <code>If</code>-expressions, trading more paths for harder queries (Kuznetsov et al., PLDI 2012, query-count estimation; veritesting).</li><li><b>Function summaries and compositional SE</b>: compute a function's input-output relation once and reuse it (SMART, Godefroid 2007).</li><li><b>Loop handling</b>: bounds, loop summarization, or invariants.</li><li><b>Under-constrained and selective SE</b>: start in the middle of a program (UC-KLEE) or only make some inputs symbolic (S2E).</li><li><b>Hybrid fuzzing</b>: let a fuzzer (AFL++) explore cheaply and call the symbolic engine only when the fuzzer is stuck on a hard branch (Driller, QSYM, SymCC).</li></ul>"
      ]
    }
  ],
  deepDive: {
    timeMin: 14,
    intro: "The questions interviewers ask after you have explained forking: memory, the environment, the relation to fuzzing and model checking, and modern compiled-in symbolic execution.",
    sections: [
      {
        h: "Symbolic memory and pointers",
        p: [
          "When an address is symbolic (<code>a[i]</code> with symbolic i), the executor can (1) model memory as one SMT array and emit Select/Store with the symbolic index, letting the solver handle aliasing (precise, expensive); (2) fork per possible target object, as KLEE does when a pointer may refer to several objects, then use an array within each object; or (3) concretize the address to one or a few values satisfying the PC (cheap, incomplete), as angr does by default for writes to wide ranges. Out-of-bounds checks become queries: is <code>PC ∧ (i ≥ len)</code> satisfiable?"
        ]
      },
      {
        h: "Symbolic execution vs fuzzing vs BMC",
        p: [
          "<table><tr><th></th><th>Greybox fuzzing (AFL++, libFuzzer)</th><th>Symbolic / concolic execution</th><th>Bounded model checking (CBMC)</th></tr><tr><td>Unit of work</td><td>One concrete execution</td><td>One path, solved by SMT</td><td>All paths up to depth k in one formula</td></tr><tr><td>Strength</td><td>Very fast, scales to big programs</td><td>Solves magic-value and checksum-like branches</td><td>Exhaustive within the bound, proves bounded safety</td></tr><tr><td>Weakness</td><td>Blind to narrow conditions (x == 0xdeadbeef)</td><td>Path explosion, environment modeling</td><td>Formula size grows with k and program size</td></tr></table>",
          "Hybrids dominate in practice. SymCC (Poeplau and Francillon, USENIX Security 2020) compiles symbolic execution into the binary via an LLVM pass, which is far faster than interpreting IR like KLEE, and pairs well with AFL++."
        ]
      },
      {
        h: "Incremental solving and caching in practice",
        p: [
          "Most queries along a path share a long prefix, so engines keep a solver per state with push/pop, or reuse models from a cache, because the same PC prefix is asked about at every branch. KLEE's measurements showed constraint independence and the counterexample cache together cut solver time dramatically on Coreutils. The toy executor in the code example creates a fresh Solver per check, which is the simplest correct choice and the first thing to optimize."
        ]
      },
      {
        h: "Symbolic execution for SE research tasks",
        p: [
          "Test generation (Pex/IntelliTest for .NET, which shipped in Visual Studio; Symbolic PathFinder for Java on JPF), regression testing (differential symbolic execution, shadow symbolic execution for patches), program repair (SemFix, Angelix use symbolic execution to derive angelic values), equivalence checking of refactorings, and generating inputs that expose flaky behavior by making environment values (time, random seeds, ordering) symbolic. LLM-assisted variants use the model to propose inputs or summaries and the solver to check them."
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: "Robin Reads Every Ending of the Poneglyph at Once",
      text: [
        "A Poneglyph describes a maze whose route depends on two numbers carved by whoever enters: x and y. Luffy's way to explore is to try numbers one at a time, walk the maze, and see where he ends up (testing). He has walked it 500 times and never found the treasure room.",
        "Robin reads the maze without choosing numbers. She writes 'x' and 'y' on her notes and follows the text: 'the gate opens if x equals twice y'. She cannot know which way it goes, so she clones herself with Hana Hana no Mi: one Robin goes through the gate carrying the note 'x = 2y', the other stays outside with 'x ≠ 2y' (forking with path conditions).",
        "Each clone keeps adding notes at every fork. When a clone reaches the treasure room, its notes read 'x = 2y and x > y + 10'. Nami solves those notes and hands Luffy the numbers 32 and 16. He walks in on the first try.",
        "The problem is the corridor that loops 'as many times as x says'. Each count needs another clone, and soon there are more Robins than the island can hold (path explosion). Robin decides to follow each loop at most three times and marks the rest 'unexplored' (a loop bound), honest about what she has not seen."
      ]
    },
    sitcom: {
      show: 'Friends',
      title: "Ross Plans for Every Possible Rachel Reaction",
      text: [
        "Ross wants to give Rachel a gift, and her reaction depends on unknowns: whether she is still mad about the list, and whether Joey already told her. Instead of guessing, Ross writes a plan that branches: if she is mad and Joey told her, then...; if she is mad and Joey did not tell her, then...",
        "Chandler notes that each branch carries its own assumptions, and some branches are impossible: Joey cannot have told her if Joey does not know yet. Ross crosses those out (infeasible paths).",
        "For the branch that ends with Rachel throwing the gift out the window, Monica works out exactly what has to be true for that to happen, so they can avoid it. By the time Ross has handled three gifts, the plan has 64 branches, and Phoebe suggests he just ask Rachel (concretization)."
      ]
    },
    why: "Robin's notes and Ross's assumptions are path conditions over symbolic inputs; cloning at every fork is forking states; crossing out impossible branches is the feasibility check; Nami turning notes into numbers is solving the PC to get a test input. The looping corridor and the 64-branch plan are path explosion, Robin's three-loop limit is a loop bound, and Phoebe's 'just ask' is concolic concretization."
  },
  storyAnim: {
    h: 270,
    props: [
      { id: 'gate', emoji: '⛩️', label: 'Gate: x == 2y ?', x: 30, y: 20 },
      { id: 'room', emoji: '💎', label: 'Treasure (assert fails)', x: 88, y: 15 },
      { id: 'exit', emoji: '🚪', label: 'Exit: return 1', x: 88, y: 50 },
      { id: 'loop', emoji: '🔁', label: 'Loop corridor', x: 60, y: 82 },
      { id: 'notes', emoji: '📝', label: 'PC: true', x: 10, y: 85 }
    ],
    actors: [
      { id: 'robin', emoji: '📚', label: 'Robin (state 1)', x: 8, y: 45 },
      { id: 'clone', emoji: '🌸', label: 'Clone (state 2)', x: 8, y: 60 },
      { id: 'nami', emoji: '🧭', label: 'Nami (Z3)', x: 50, y: 50 }
    ],
    steps: [
      { c: "Inputs x and y are symbols. Robin executes z = 2*y: the store now maps z to 2y. No values chosen yet.", p: { notes: 'lit' }, l: { notes: 'store: z = 2y' } },
      { c: "Branch on x == z. Nami checks both sides are satisfiable, so the state forks.", a: { robin: [30, 35], clone: [30, 65] }, p: { gate: 'lit' } },
      { c: "Robin goes through with PC x = 2y. The clone continues with PC x != 2y.", a: { robin: [55, 25], clone: [45, 75] }, l: { notes: 'PC1: x=2y | PC2: x!=2y' } },
      { c: "Robin forks again on x > y + 10. One copy reaches the failing assertion with PC x = 2y and x > y + 10.", a: { robin: [82, 20] }, p: { room: 'bad' } },
      { c: "Nami solves that PC: x = 32, y = 16. A concrete input that reproduces the bug on the real program.", a: { nami: [70, 40] }, p: { room: 'good' }, l: { room: 'test: x=32, y=16' } },
      { c: "The other side of that fork returns 1 with PC x = 2y and x <= y + 10: another test, another covered path.", p: { exit: 'good' } },
      { c: "The clone hits the loop 'while i < x'. Every iteration count is a new path: path explosion.", a: { clone: [60, 70] }, p: { loop: 'bad' } },
      { c: "With a bound of 3 unrollings, the clone reports paths for x = 0..3 and marks the rest 'LOOP BOUND HIT': honest incompleteness.", p: { loop: 'dim' }, l: { loop: 'bound 3: rest unexplored' } }
    ]
  },
  conceptFlow: {
    title: "One step of a symbolic executor",
    intro: "KLEE, angr and the toy executor in the code example all run this loop.",
    stages: [
      { label: 'Pick', nodes: [ { id: 'pick', text: 'Searcher picks a state\nDFS / random-path / coverage' } ] },
      { label: 'Execute', nodes: [ { id: 'assign', text: 'Assignment\nupdate symbolic store' }, { id: 'branch', text: 'Branch on c\nquery PC and c, PC and not c' } ] },
      { label: 'Solver', nodes: [ { id: 'feas', text: 'Feasibility check\nSMT (QF_ABV)' }, { id: 'cache', text: 'Independence +\ncounterexample cache' } ] },
      { label: 'Fork', nodes: [ { id: 'fork', text: 'Fork: one state\nper feasible side' }, { id: 'prune', text: 'Drop infeasible side' } ] },
      { label: 'Terminate', nodes: [ { id: 'test', text: 'Path ends\nsolve PC -> test input' }, { id: 'bug', text: 'Assertion / crash\nsolve -> reproducer' } ] }
    ],
    steps: [
      { active: ['pick'], note: "Choose which pending state to advance. This choice decides which bugs you find within the time budget." },
      { active: ['assign'], note: "Assignments only rewrite the symbolic store: z becomes an expression over the input symbols. No solver call needed." },
      { active: ['branch'], note: "At a branch with symbolic condition c, we need to know which of PC and c, PC and not c is satisfiable." },
      { active: ['cache'], note: "Before calling the solver, slice the PC to constraints sharing variables with c and check the cache of earlier answers." },
      { active: ['feas'], note: "The remaining query goes to the SMT solver. For C programs it is bit-vectors plus arrays." },
      { active: ['fork', 'prune'], note: "Both sides feasible: clone the state and extend each PC. Only one feasible: continue without forking." },
      { active: ['test'], note: "When a path returns, solve its PC: the model is a concrete test that drives the program down this exact path." },
      { active: ['bug'], note: "At an assertion, check whether PC and not assertion is satisfiable. If so, the model is a bug reproducer, never a false alarm, as long as the modeling is faithful." }
    ]
  },
  tech: [
    {
      q: "Why does KLEE need -O0 -Xclang -disable-O0-optnone when compiling?",
      a: "KLEE runs on bitcode, and you usually want unoptimized code for readable paths and debug info. But clang at -O0 marks functions optnone, which prevents KLEE's own optional optimization passes (<code>--optimize</code>) from running. <code>-Xclang -disable-O0-optnone</code> drops that attribute. The <code>-g</code> flag gives KLEE source-line info for coverage reports and error messages."
    },
    {
      q: "Is symbolic execution sound or complete?",
      a: "As a bug finder, each reported error comes with a concrete input, so it has no false alarms if the environment and memory are modeled faithfully (that is the caveat: concretization or bad models can produce spurious or missed paths). It is incomplete because it explores only some paths within a budget. With loop bounds and full exploration it gives bounded verification, like BMC."
    },
    {
      q: "What is the difference between symbolic and concolic execution in one sentence each?",
      a: [
        "Symbolic: interpret the program purely over symbols, forking at each feasible branch, keeping many states alive (KLEE, angr).",
        "Concolic: run one concrete input at a time while recording symbolic constraints, then negate branch conditions to compute the next input; one state in memory, and concrete values available whenever the symbolic model gives up (DART, CUTE, SAGE, SymCC)."
      ]
    },
    {
      q: "Why is SymCC so much faster than KLEE?",
      a: "KLEE interprets LLVM IR instruction by instruction. SymCC is a compiler pass that inserts calls building symbolic expressions directly into the compiled program, so concrete execution runs at native speed and only the symbolic bookkeeping costs extra. It executes one path at a time (concolic) and sends the queries to a solver backend (its own or QSYM's), which suits hybrid fuzzing."
    }
  ],
  code: {
    title: "A complete symbolic executor for a toy language, on Z3",
    intro: "Programs are lists of tuples: assign, if, while, assert, return. Expressions evaluate to Z3 32-bit bit-vector terms. At each if the executor checks both sides for feasibility and forks; loops are unrolled up to a bound and the remainder is reported honestly; assertions are checked by asking whether their negation is satisfiable on the current path. At the end, every path condition is solved to produce a test input.",
    code: `# tiny_symex.py -- a symbolic executor for a toy imperative language, on Z3
# run with: python3 tiny_symex.py   (pip install --user z3-solver)
from z3 import BitVec, BitVecVal, Solver, And, Not, sat, simplify

# ---- the toy language: statements and expressions as tuples -------------
#   ("assign", var, expr)  ("if", cond, then_block, else_block)
#   ("while", cond, body)  ("assert", cond)  ("return", expr)
#   expr: ("var", name) | ("const", n) | (op, e1, e2) with op in + - * == != < <= >
PROGRAM = [
    ("assign", "z", ("*", ("var", "y"), ("const", 2))),
    ("if", ("==", ("var", "x"), ("var", "z")),
        [("if", (">", ("var", "x"), ("+", ("var", "y"), ("const", 10))),
            [("assert", ("const", 0))],                    # the bug
            [("return", ("const", 1))])],
        [("assign", "i", ("const", 0)),
         ("while", ("<", ("var", "i"), ("var", "x")),
             [("assign", "i", ("+", ("var", "i"), ("const", 1)))]),
         ("return", ("var", "i"))]),
]
INPUTS = ["x", "y"]
W = 32           # machine words
LOOP_BOUND = 3   # unroll loops at most this many times per path

def ev(e, env):
    kind = e[0]
    if kind == "var":
        return env[e[1]]
    if kind == "const":
        return BitVecVal(e[1], W)
    a, b = ev(e[1], env), ev(e[2], env)
    return {"+": lambda: a + b, "-": lambda: a - b, "*": lambda: a * b,
            "==": lambda: a == b, "!=": lambda: a != b, "<": lambda: a < b,
            "<=": lambda: a <= b, ">": lambda: a > b}[kind]()

def truthy(v):
    # conditions may be Boolean (comparisons) or words (assert 0 means false)
    return v if v.sort().name() == "Bool" else v != 0

def feasible(pc):
    s = Solver()
    s.add(*pc)
    return s.check() == sat, s

paths = []

def execute(stmts, env, pc, loops):
    """Explore every feasible path through stmts; record (outcome, pc) at the end."""
    if not stmts:
        paths.append(("fallthrough", pc))
        return
    st, rest = stmts[0], stmts[1:]
    kind = st[0]
    if kind == "assign":
        env = dict(env)
        env[st[1]] = ev(st[2], env)
        execute(rest, env, pc, loops)
    elif kind == "return":
        paths.append(("return " + str(simplify(ev(st[1], env))), pc))
    elif kind == "assert":
        c = truthy(ev(st[1], env))
        ok, _ = feasible(pc + [Not(c)])
        if ok:
            paths.append(("ASSERTION FAILURE", pc + [Not(c)]))
        if feasible(pc + [c])[0]:
            execute(rest, env, pc + [c], loops)
    elif kind == "if":
        c = truthy(ev(st[1], env))
        for cond, block in ((c, st[2]), (Not(c), st[3])):    # fork the state
            if feasible(pc + [cond])[0]:                     # prune infeasible paths
                execute(block + rest, env, pc + [cond], loops)
    elif kind == "while":
        c = truthy(ev(st[1], env))
        n = loops.get(id(st), 0)
        if feasible(pc + [c])[0]:
            if n < LOOP_BOUND:
                execute(st[2] + [st] + rest, env, pc + [c], {**loops, id(st): n + 1})
            else:
                paths.append(("LOOP BOUND HIT", pc + [c]))   # unexplored: incomplete
        if feasible(pc + [Not(c)])[0]:
            execute(rest, env, pc + [Not(c)], loops)

env0 = {v: BitVec(v, W) for v in INPUTS}
ASSUME = [And(-100 <= env0[v], env0[v] <= 100) for v in INPUTS]   # input domain
execute(PROGRAM, env0, ASSUME, {})

for outcome, pc in paths:
    ok, s = feasible(pc)
    m = s.model()
    test = {v: m.eval(env0[v], model_completion=True).as_signed_long() for v in INPUTS}
    print("%-18s inputs %-22s pc: %s" % (outcome, test, " ".join(str(simplify(And(pc[len(ASSUME):]))).split())))

# Output (inputs may differ between Z3 versions; outcomes and PCs will not):
# ASSERTION FAILURE  inputs {'x': 32, 'y': 16}     pc: And(x == 2*y, Not(x <= 10 + y))
# return 1           inputs {'x': -82, 'y': -41}   pc: And(x == 2*y, x <= 10 + y)
# LOOP BOUND HIT     inputs {'x': 62, 'y': 32}     pc: And(Not(x == 2*y), Not(x <= 0), Not(x <= 1), Not(x <= 2), Not(x <= 3))
# return 3           inputs {'x': 3, 'y': -3}      pc: And(Not(x == 2*y), Not(x <= 0), Not(x <= 1), Not(x <= 2), x <= 3)
# return 2           inputs {'x': 2, 'y': -3}      pc: And(Not(x == 2*y), Not(x <= 0), Not(x <= 1), x <= 2)
# return 1           inputs {'x': 1, 'y': -3}      pc: And(Not(x == 2*y), Not(x <= 0), x <= 1)
# return 0           inputs {'x': 0, 'y': 95}      pc: And(Not(x == 2*y), x <= 0)`,
    notes: [
      "Note the 'return i' paths print the concrete count (0, 1, 2, 3): after unrolling, the symbolic store maps i to a constant on each path, and simplify folds it.",
      "Set <code>ASSUME = []</code> and the assertion failure is found with overflow inputs such as x = -10, y = 2147483643, where 2*y and y + 10 both wrap. Symbolic execution over bit-vectors finds bugs that depend on machine arithmetic, which a mathematical-integer model would miss.",
      "The executor recurses depth-first and keeps every state on the Python stack. Real engines keep an explicit worklist of states so the searcher can choose which to run next, and share a solver with push/pop along each path."
    ]
  },
  lab: {
    title: "Build a concolic test generator (DART/SAGE style)",
    prompt: "The function <code>program(x, y, pc)</code> runs on concrete integers and records each branch's symbolic condition (or its negation, if the branch was not taken) in <code>pc</code>. Write <code>concolic(seed)</code>: keep a worklist of inputs; run each one; for every position i in its path condition, build <code>pc[:i] + [Not(pc[i])]</code>, skip it if already tried, solve it with Z3, and push the model's (x, y) onto the worklist. Return a dict from input to outcome. Starting from (0, 0), your generator must reach all four outcomes, including <code>BUG</code>.",
    starter: `from z3 import Int, Solver, Not, And, sat

X, Y = Int("x"), Int("y")

def program(x, y, pc):
    def branch(concrete, symbolic):
        pc.append(symbolic if concrete else Not(symbolic))
        return concrete
    if branch(x * 3 == y + 7, X * 3 == Y + 7):
        if branch(y > 100, Y > 100):
            return "BUG"
        return "A"
    if branch(x > y, X > Y):
        return "B"
    return "C"

def concolic(seed, max_runs=20):
    worklist, tried, results = [seed], set(), {}
    # TODO: run, flip each branch, solve, enqueue new inputs
    return results

for inp, out in concolic((0, 0)).items():
    print(inp, "->", out)
`,
    checks: [
      { re: 'out\\s*=\\s*program\\s*\\(\\s*x\\s*,\\s*y\\s*,\\s*pc\\s*\\)', flags: '', must: true, hint: 'Run the program concretely: out = program(x, y, pc)', pass: 'Concrete run collects the path' },
      { re: 'pc\\s*\\[\\s*:\\s*i\\s*\\]\\s*\\+\\s*\\[\\s*Not\\s*\\(\\s*pc\\s*\\[\\s*i\\s*\\]\\s*\\)\\s*\\]', flags: '', must: true, hint: 'Keep the prefix and negate branch i: pc[:i] + [Not(pc[i])]', pass: 'Branch flipping' },
      { re: 'in\\s+tried', flags: '', must: true, hint: 'Skip path prefixes you have already tried', pass: 'Deduplicates flipped paths' },
      { re: 's\\.check\\s*\\(\\s*\\)\\s*==\\s*sat', flags: '', must: true, hint: 'Only enqueue when the flipped path is feasible: s.check() == sat', pass: 'Feasibility check' },
      { re: 'model_completion\\s*=\\s*True', flags: '', must: true, hint: 'Variables absent from the PC still need values: m.eval(X, model_completion=True)', pass: 'Model completion' },
      { re: 'worklist\\.append', flags: '', must: true, hint: 'Push the new input onto the worklist', pass: 'New inputs enqueued' },
      { re: 'for\\s+i\\s+in\\s+range\\s*\\(\\s*len\\s*\\(\\s*pc\\s*\\)\\s*\\)', flags: '', must: true, hint: 'Generational search: flip every branch of the run, for i in range(len(pc))', pass: 'Flips every branch' },
      { re: 'TODO', flags: '', must: false, hint: 'Replace the TODO with your loop', pass: 'No TODOs left' }
    ],
    run: "Save as <code>concolic.py</code>, <code>pip install --user z3-solver</code>, <code>python3 concolic.py</code>. Expected (order and exact values may vary): <code>(0, 0) -&gt; C</code>, <code>(1, 0) -&gt; B</code>, <code>(0, -7) -&gt; A</code>, <code>(36, 101) -&gt; BUG</code>, ... Try replacing <code>x * 3 == y + 7</code> with a condition on <code>hash(x)</code>: the symbolic side can no longer follow it, which is exactly where real concolic tools concretize.",
    solution: `# concolic.py -- a concolic (DART/SAGE-style) test generator
from z3 import Int, Solver, Not, And, sat

X, Y = Int("x"), Int("y")

def program(x, y, pc):
    """Code under test, instrumented: every branch records its symbolic condition."""
    def branch(concrete, symbolic):
        pc.append(symbolic if concrete else Not(symbolic))
        return concrete
    if branch(x * 3 == y + 7, X * 3 == Y + 7):
        if branch(y > 100, Y > 100):
            return "BUG"
        return "A"
    if branch(x > y, X > Y):
        return "B"
    return "C"

def concolic(seed, max_runs=20):
    worklist, tried, results = [seed], set(), {}
    while worklist and len(results) < max_runs:
        x, y = worklist.pop()
        pc = []
        out = program(x, y, pc)                    # 1) run concretely, collect the path
        results[(x, y)] = out
        for i in range(len(pc)):                   # 2) flip each branch along the path
            flipped = pc[:i] + [Not(pc[i])]
            key = str(flipped)
            if key in tried:
                continue
            tried.add(key)
            s = Solver()
            s.add(And(flipped))
            if s.check() == sat:                   # 3) solve for inputs taking the new path
                m = s.model()
                worklist.append((m.eval(X, model_completion=True).as_long(),
                                 m.eval(Y, model_completion=True).as_long()))
    return results

for inp, out in concolic((0, 0)).items():
    print(inp, "->", out)

# (0, 0) -> C
# (1, 0) -> B
# (0, -7) -> A
# (36, 101) -> BUG
# (35, 98) -> A
# (0, -6) -> B
`,
    notes: [
      "Flipping every branch of each run (not just the last) is SAGE's generational search. It squeezes several new tests out of each expensive concrete execution.",
      "Random testing would need 3x = y + 7 and y > 100 at the same time; Z3 solves it in one query. This is the magic-value problem concolic execution was invented for.",
      "The <code>tried</code> set keyed on the flipped prefix prevents re-solving the same path condition when different runs share a prefix. Real tools also bound depth and use coverage to prioritize which runs to expand."
    ]
  },
  quiz: [
    {
      q: "What is a path condition?",
      options: ["The set of variables live at a program point", "The conjunction of branch conditions (over input symbols) that an execution must satisfy to follow a given path", "The loop invariant of the current loop", "The postcondition of the function"],
      correct: 1,
      explain: "Solving the path condition gives inputs that drive the program down that path."
    },
    {
      q: "At a branch, PC and c is unsat and PC and not c is sat. What does the executor do?",
      options: ["Fork both states", "Continue only on the else side, without forking", "Report a bug", "Abort the path"],
      correct: 1,
      explain: "Only the feasible side is explored; the then-branch is unreachable on this path."
    },
    {
      q: "The main practical limitation of symbolic execution is ...",
      options: ["SMT solvers cannot handle bit-vectors", "Path explosion: the number of paths grows exponentially with branches and with input-dependent loops", "It produces false alarms on every run", "It cannot generate concrete inputs"],
      correct: 1,
      explain: "Solvers are fast on typical path queries; the number of paths is what kills you."
    },
    {
      q: "In concolic execution, what happens when the code calls a function the engine cannot model symbolically?",
      options: ["The engine crashes", "It uses the concrete value observed in this run (concretization), losing completeness but continuing", "It marks the path infeasible", "It switches to abstract interpretation"],
      correct: 1,
      explain: "Concretization is the key advantage of concolic over pure symbolic execution."
    },
    {
      q: "In angr, which call steps states until one reaches a target while discarding states that reach another address?",
      options: ["proj.factory.blank_state()", "simgr.explore(find=target, avoid=bad)", "claripy.BVS(target)", "state.solver.eval(target)"],
      correct: 1,
      explain: "explore moves matching states to the found stash and avoided ones to the avoid stash."
    }
  ],
  testFlow: {
    title: "Test yourself: will symbolic execution find it?",
    start: 'q1',
    nodes: {
      q1: {
        q: "if (crc32(buf) == 0x1234abcd) crash(); with buf symbolic, 64 bytes. What happens with pure symbolic execution over bit-vectors?",
        choices: [
          { text: "In principle it can, but the CRC formula makes the query hard; the solver may time out", to: 'q1_right' },
          { text: "It can never reach crash() because hashes are uninterpreted", to: 'q1_wrong' }
        ]
      },
      q1_right: { end: true, correct: true, text: "Right. CRC32 is linear over GF(2), so solvers often handle it, but cryptographic hashes are effectively hopeless. Concolic tools concretize, and fuzzers rely on dictionaries or input-to-state correspondence (RedQueen) for comparisons like this.", next: 'q2' },
      q1_wrong: { end: true, correct: false, text: "CRC32 is ordinary bit-vector code; the engine models it exactly. Whether the solver finishes is a separate question.", retry: 'q1' },
      q2: {
        q: "for (i = 0; i < n; i++) if (a[i] == 7) count++; with n up to 1000 and a[] symbolic. How many paths?",
        choices: [
          { text: "Exponential: for each n, each iteration forks on a[i] == 7, so roughly 2^n per n", to: 'q2_right' },
          { text: "About 1000, one per value of n", to: 'q2_wrong' }
        ]
      },
      q2_right: { end: true, correct: true, text: "Yes. State merging (count becomes count + If(a[i] == 7, 1, 0)) collapses these into one path per n, at the cost of bigger queries. That is the core tradeoff of veritesting." },
      q2_wrong: { end: true, correct: false, text: "Each iteration's if also forks, independently of n. Path counts multiply.", retry: 'q2' }
    }
  },
  pitfalls: [
    "Calling symbolic execution 'verification'. Without exploring all paths it is a bug finder; with bounds it gives a bounded guarantee only.",
    "Forgetting that unmodeled environment (files, syscalls, time) or concretized pointers make paths unsound or missing. Check what the tool models.",
    "Modeling machine integers as mathematical Int: you will miss overflow-dependent paths and may report infeasible ones.",
    "Silently dropping paths at a loop bound. Report them as incomplete, as the code example does, so nobody mistakes coverage for completeness.",
    "Solving each query from scratch. Real engines rely on incremental solving, slicing (constraint independence) and caching."
  ],
  interview: [
    {
      q: "Explain symbolic execution and how it generates test inputs.",
      a: "Inputs are symbols; the executor keeps a symbolic store mapping variables to expressions over those symbols and a path condition, the conjunction of branch conditions taken. At each branch it asks an SMT solver which sides are feasible and forks a state for each. When a path terminates, the solver returns a model of its path condition, which is a concrete input that drives the real program down that path; at assertions or potential crashes, it checks whether the PC plus the negated safety condition is satisfiable, and if so, the model is a reproducer."
    },
    {
      q: "What is path explosion and how do practical tools deal with it?",
      a: "The number of paths grows exponentially with sequential branches and unboundedly with input-dependent loops. Tools respond with search heuristics that prioritize new coverage or a target (KLEE's random-path and covnew, directed search), state merging at join points (veritesting) to trade paths for query complexity, function summaries (compositional SE), loop bounds or summaries, starting in the middle of the program (under-constrained SE), making only selected inputs symbolic, and hybrid fuzzing where a fuzzer explores cheaply and symbolic execution only cracks branches the fuzzer cannot."
    },
    {
      q: "Explain a tradeoff: symbolic execution vs coverage-guided fuzzing.",
      a: "Fuzzing executes millions of concrete inputs per hour with almost no setup and scales to huge codebases, but it struggles with narrow conditions like magic numbers and checksums. Symbolic execution solves those conditions directly and produces precise per-path reasoning, but each path costs solver time, environment modeling is a lot of work, and path explosion limits depth. In practice: fuzz first, then use concolic execution (Driller, QSYM, SymCC) when coverage plateaus, and use fuzzer-friendly tricks like CmpLog/RedQueen for comparisons that do not need a full solver."
    },
    {
      q: "Whiteboard: design a symbolic executor for a small imperative language.",
      a: "State = (pc location, symbolic store, path condition, maybe heap as an SMT array). Expressions evaluate to solver terms over input symbols. Assignment updates the store. A branch evaluates the condition c; check PC and c and PC and not c with the solver, fork for each satisfiable side. Loops: unroll up to a bound and report bound hits. Assertions: check PC and not assertion. Termination: solve PC for a test. Around that: a worklist of states with a pluggable searcher, an incremental solver per state or a shared solver with push/pop, constraint slicing and a query cache. The code example in this lesson is a 90-line instance of exactly this."
    },
    {
      q: "How do KLEE and angr differ?",
      a: "KLEE works on LLVM bitcode compiled from source, so it needs the source and a build; it has a POSIX environment model and uClibc, uses STP or Z3, and is aimed at test generation and bug finding in C programs. angr works on binaries by lifting machine code to VEX IR, uses claripy over Z3, models libc with SimProcedures, and is a broader binary-analysis framework (CFG recovery, value-set analysis), popular in security research and CTFs. KLEE is more precise for source-level C; angr is the choice when you only have the binary."
    },
    {
      q: "How would you use symbolic or concolic execution to help with flaky tests?",
      a: "Treat sources of nondeterminism as symbolic inputs: the result of time calls, random seeds, thread scheduling decisions (via a controlled scheduler), environment variables and file system state. A concolic run of a test then yields path conditions over those values, and solving their negations generates environments where the test takes a different path, which can expose order- or timing-dependent failures deterministically and produce a reproducer. Combine with a systematic concurrency tester for schedules. The limitation is modeling: most flakiness comes from the environment, which is exactly what is hardest to model."
    },
    {
      q: "What is concretization and when is it unsound?",
      a: "Replacing a symbolic expression with one concrete value that satisfies the current PC, for example a symbolic pointer or the argument to an unmodeled system call. It is a sound under-approximation for bug finding if you also add the constraint expr == value to the PC, so later inputs stay consistent. If you concretize without adding the constraint, you can generate inputs that do not actually follow the path (divergence), which concolic tools detect by re-running and comparing paths."
    }
  ]
};
