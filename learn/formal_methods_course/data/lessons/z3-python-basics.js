window.LESSONS = window.LESSONS || {};
window.LESSONS['z3-python-basics'] = {
  id: 'z3-python-basics',
  title: 'Z3 in Python: Ints, Reals, Bools, check(), model() & Optimize',
  category: 'Part 1 — SMT Solvers & Z3',
  timeMin: 45,
  summary: "This is the hands-on Z3 lesson: the Python API you will actually type in an interview or a research prototype. You will declare Int, Real and Bool variables, build constraints with ordinary Python operators, read models, use push/pop for incremental queries, extract unsat cores with tracked assertions and assumptions, optimize with Optimize (hard and soft constraints, minimize/maximize), and solve two classic puzzles (Sudoku and N-queens). Most importantly you will use the proving pattern for real: two expressions are equivalent exactly when Z3 cannot find an input on which they differ. Every snippet here was run against z3-solver from pip.",
  goals: [
    "Declare Int, Real and Bool variables and build constraints using Python operators, And/Or/Not/Implies/If and Distinct",
    "Run check(), read and evaluate models (m[x], m.eval(expr, model_completion=True), as_long())",
    "Use push/pop and check(assumptions) for incremental solving, and extract unsat cores with assert_and_track",
    "Solve optimization problems with Optimize: maximize/minimize objectives, add_soft weights, and read the objective value",
    "Encode Sudoku and N-queens and enumerate all solutions with blocking clauses",
    "Prove two expressions equivalent by asking Z3 for a counterexample to their equality"
  ],
  concept: [
    {
      h: "Install, import, and the three answers",
      p: [
        "<code>pip install --user z3-solver</code> gives you the Python bindings (<code>import z3</code>) and the <code>z3</code> command-line binary. The bindings are a thin layer over the C API: every Python expression you build is a Z3 AST (abstract syntax tree), not a Python value. <code>x + y &gt; 3</code> with <code>x = Int(\"x\")</code> builds a term; it does not compute anything.",
        "<code>Solver.check()</code> returns one of three constants: <code>sat</code>, <code>unsat</code> or <code>unknown</code>. Compare with <code>==</code>, never with truthiness (<code>if s.check():</code> is always true because the result object is truthy).",
        "Useful knobs: <code>s.set(\"timeout\", 2000)</code> (milliseconds, per check), <code>s.statistics()</code>, <code>s.reason_unknown()</code>, <code>s.sexpr()</code> or <code>s.to_smt2()</code> to dump the query as SMT-LIB for a bug report or for running in cvc5."
      ],
      code: `from z3 import *          # convention in scripts; prefer explicit imports in libraries

x, y = Ints("x y")        # Int("x") for one
r = Real("r")
p = Bool("p")

s = Solver()
s.add(x + y == 10, x - y == 4, Implies(p, r > x), r < 7.5)
print(s.check())          # sat
m = s.model()
print(m[x], m[y], m[r], m[p])                    # 7 3 57/8 True
print(m.eval(x * y), m.eval(r + 1))              # 21 65/8
print(m[x].as_long() + 1)                        # 8  (convert to a Python int)
print(s)                                         # the assertions, pretty-printed
# [x + y == 10, x - y == 4, Implies(p, r > ToReal(x)), r < 15/2]`
    },
    {
      h: "Building constraints: operators, connectives and the sharp edges",
      p: [
        "<ul><li>Arithmetic: <code>+ - * / %</code> and comparisons. On <code>Int</code>, <code>/</code> is integer division and <code>%</code> is modulo with SMT-LIB semantics (Euclidean: the remainder is always non-negative for a nonzero divisor, unlike Python's or Java's). On <code>Real</code>, <code>/</code> is exact division. Mixing Int and Real inserts <code>ToReal</code>, as shown above.</li><li>Logic: <code>And, Or, Not, Implies, Xor, If(c, a, b)</code> (an if-then-else term, usable anywhere a value is), <code>Distinct(a, b, c)</code>, <code>Sum(list)</code>, <code>AtMost(b1, b2, b3, k)</code>, <code>AtLeast</code>, <code>PbLe/PbEq</code> for weighted pseudo-Boolean constraints.</li><li>Python's <code>and</code>, <code>or</code>, <code>not</code> and chained comparisons <code>0 &lt; x &lt; 9</code> do <i>not</i> build Z3 terms; Python evaluates them using truthiness, which either raises an error or, for <code>==</code>, silently drops part of your constraint. Always write <code>And(0 &lt; x, x &lt; 9)</code>.</li><li><code>x == 3</code> builds a Z3 equality, not a Python bool. To compare two ASTs structurally in Python, use <code>eq(a, b)</code>.</li></ul>",
        "The model only contains variables that occurred in the assertions. <code>m[z]</code> for an unconstrained z returns <code>None</code>; use <code>m.eval(z, model_completion=True)</code> to get a default value."
      ]
    },
    {
      h: "Incremental solving: push/pop, assumptions and unsat cores",
      p: [
        "<code>push()</code> opens a scope, <code>pop()</code> discards everything asserted since. Learned lemmas that do not depend on popped assertions are kept, which is why verifiers ask thousands of related questions this way.",
        "Two ways to get an unsat core: track assertions with named Boolean literals (<code>assert_and_track</code>), or pass assumption literals to <code>check</code>. The second is the more flexible idiom: guard each constraint with <code>Implies(a_i, C_i)</code> and enable any subset per call without touching the assertion stack. It is the same mechanism as MiniSat assumptions."
      ],
      code: `s.push()
s.add(p, r < 7)           # p forces r > x = 7, contradicting r < 7
print(s.check())          # unsat
s.pop()
print(s.check(), len(s.assertions()))      # sat 4: back to the original 4 assertions

a1, a2, a3 = Bools("a1 a2 a3")
s2 = Solver()
s2.set(unsat_core=True)
s2.assert_and_track(x > 5, a1)
s2.assert_and_track(x < 3, a2)
s2.assert_and_track(y == 1, a3)
print(s2.check(), s2.unsat_core())         # unsat [a1, a2]

s3 = Solver()                              # assumption style
s3.add(Implies(a1, x > 5), Implies(a2, x < 3), Implies(a3, y == 1))
print(s3.check(a1, a2, a3), s3.unsat_core())   # unsat [a1, a2]
print(s3.check(a1, a3))                         # sat: just leave a2 out`
    },
    {
      h: "Optimize: objectives and soft constraints",
      p: [
        "<code>Optimize</code> (the νZ engine, Bjørner, Phan and Fleckenstein, TACAS 2015) accepts hard constraints with <code>add</code>, objectives with <code>maximize</code>/<code>minimize</code>, and weighted <b>soft constraints</b> with <code>add_soft(c, weight, id=...)</code>, which it solves as MaxSAT: minimize the total weight of violated soft constraints in each group. Multiple objectives are combined lexicographically by default (the order you added them); set <code>o.set(priority=\"pareto\")</code> or <code>\"box\"</code> for alternatives.",
        "Over integers this is integer linear programming. It is great for scheduling, configuration and test-suite minimization prototypes; for big LPs and MILPs a dedicated solver (OR-Tools CP-SAT, Gurobi, HiGHS) will be faster."
      ],
      code: `o = Optimize()
xx, yy = Ints("xx yy")
o.add(xx >= 0, yy >= 0, xx + 2 * yy <= 14, 3 * xx - yy >= 0, xx - yy <= 2)
h = o.maximize(3 * xx + 4 * yy)
print(o.check(), o.model(), h.value())     # sat [xx = 6, yy = 4] 34

# Soft constraints: pick at most one meeting day, prefer Tue (5) over Mon (3)
o = Optimize()
mon, tue, wed = Bools("mon tue wed")
o.add(AtMost(mon, tue, wed, 1))
o.add_soft(mon, 3, id="prefs")
o.add_soft(tue, 5, id="prefs")
o.add_soft(Not(wed), 1)
print(o.check(), o.model())                # sat [wed = False, mon = False, tue = True]`
    },
    {
      h: "Proving equivalence: ask for a counterexample to the negation",
      p: [
        "To prove <code>e1 == e2</code> for all inputs, assert <code>e1 != e2</code>. Unsat means no distinguishing input exists. Z3 ships the helper <code>prove(claim)</code>, which prints <code>proved</code> or <code>counterexample</code> plus a model. This is how you validate a refactoring, a compiler peephole rule, or an LLM-generated rewrite of a pure function: encode both versions, assert they differ, and either get a proof or a failing input.",
        "Equivalence over <code>BitVec</code> gives you machine semantics; over <code>Int</code> it gives you mathematical semantics. Both are useful, but they answer different questions."
      ],
      code: `a, b = BitVecs("a b", 32)
s = Solver()
s.add((a ^ b) != ((a | b) & ~(a & b)))     # XOR rewritten with OR, AND, NOT
print(s.check())                           # unsat: equivalent for all 2^64 inputs

prove((a ^ b) == ((a | b) & ~(a & b)))     # proved
prove(a + b == a | b)                      # counterexample [a = 2004314964, b = 1932732756]
                                           # (holds only when a & b == 0)`
    }
  ],
  deepDive: {
    timeMin: 14,
    intro: "Things you learn the hard way after the first few hundred Z3 scripts: performance, modeling choices, and how Z3 is used inside bigger tools.",
    sections: [
      {
        h: "Modeling choices change solve times by orders of magnitude",
        p: [
          "<ul><li><b>Int vs BitVec</b>: for bounded puzzles, small bit-vectors (e.g. <code>BitVec(\"x\", 4)</code> for Sudoku digits) bit-blast to pure SAT and can be faster than LIA. For arithmetic-heavy problems, Int is usually faster.</li><li><b>Distinct vs pairwise !=</b>: <code>Distinct</code> is one constraint the solver can reason about globally; pairwise disequalities are equivalent but bigger.</li><li><b>Booleans vs one-hot integers</b>: N-queens can be written as 64 Booleans with AtMost constraints or as 8 integers with Distinct; both work, and the integer version is more compact and propagates better here.</li><li><b>Symmetry breaking</b>: if solutions come in symmetric families, add a constraint that picks one representative (e.g. queen in row 0 is in the left half) to cut search.</li><li><b>Avoid nonlinear terms</b> when a linear encoding exists: x * y with both symbolic drags you into NIA, which is undecidable and slow.</li></ul>"
        ]
      },
      {
        h: "Enumerating models correctly",
        p: [
          "The blocking-clause loop (assert <code>Or([v != m[v] for v in vars])</code> after each model) enumerates distinct assignments to the listed variables. Two traps: (1) include every variable that defines a solution, or you will block too much or too little; (2) the number of solutions can be astronomical, so bound the loop. For counting at scale, use a model counter (approxmc, d4) on a CNF encoding, not Z3."
        ]
      },
      {
        h: "Tactics, parameters and reproducibility",
        p: [
          "<code>Solver()</code> picks a strategy automatically. <code>SolverFor(\"QF_LIA\")</code> or <code>Then(\"simplify\", \"solve-eqs\", \"smt\").solver()</code> lets you choose. Global parameters: <code>set_param(\"smt.random_seed\", 42)</code>, <code>set_param(\"verbose\", 2)</code>. For reproducible benchmarks, fix seeds, record the Z3 version (<code>z3.get_version_string()</code>), and prefer <code>rlimit</code> (a deterministic resource counter) over wall-clock timeouts, as Dafny does."
        ]
      },
      {
        h: "Where the Python API shows up in research code",
        p: [
          "Typical SE-research uses: test input generation from path conditions; checking whether two program versions are equivalent on a slice (regression verification); minimizing a failing configuration or flaky-test environment (unsat cores and MaxSAT over Boolean flags); checking LLM-generated code against a reference on bounded inputs; and constraint-based repair (SemFix, Angelix), which synthesizes a patched expression by solving for values that make failing tests pass. Being able to sketch these with the API in an interview is worth more than memorizing internals."
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: "Nami's Treasure Distribution With Rules",
      text: [
        "The crew has to split the treasure: Luffy and Zoro together get 10 chests, Luffy gets 4 more than Zoro, and if Sanji cooks the feast, Brook's share must be bigger than Luffy's. Nami writes each rule on the chart table and asks the table, \"is there any split that satisfies all of these?\" (check). It answers yes and lays out one split (the model).",
        "Usopp wants to try a what-if: \"what if Sanji cooks and Brook gets less than 7?\" Nami pins a temporary sheet over the table (push), sees it is impossible, and unpins it (pop) without disturbing the original rules.",
        "When the rules contradict, Robin asks which ones actually clash. The table points at exactly two rules and ignores the rest (the unsat core).",
        "Then Nami wants the best split, not any split: maximize the crew's total morale, with soft wishes like \"Luffy would like meat more than gold\" weighted by how loudly he complains (Optimize with add_soft). Finally, Franky claims his new cannon formula is the same as the old one. Nami asks the table for a single cannonball angle where they differ. \"None exists\" means Franky is right (proving equivalence)."
      ]
    },
    sitcom: {
      show: 'Friends',
      title: "Monica Plans Thanksgiving With a Solver",
      text: [
        "Monica has constraints: Joey must sit next to the turkey, Ross and Rachel cannot sit next to each other this year, Chandler refuses the chair by the window. She asks for any valid seating, gets one, and taps it into the planner.",
        "Phoebe asks \"what if we invite Ursula?\" Monica adds a temporary page, sees no seating works, tears the page out, and the original plan is still there.",
        "Rachel wants to know why Ursula breaks everything; the planner highlights just two rules: Ursula and Phoebe cannot share a room, and there is only one room.",
        "Then Monica wants the best seating: maximize happiness, where Joey next to food is worth 5 points and Ross next to the dinosaur book is worth 1. She does not care if a soft preference is violated, as long as the total is maximal."
      ]
    },
    why: "Writing rules on the table and asking for any split is Solver.add plus check and model. The temporary sheet or page is push/pop; the two clashing rules are the unsat core; the best split with weighted wishes is Optimize with soft constraints; and asking for one angle where two formulas differ is proving equivalence by finding no counterexample."
  },
  storyAnim: {
    h: 260,
    props: [
      { id: 'table', emoji: '🗺️', label: 'Chart table (Solver)', x: 50, y: 15 },
      { id: 'sheet', emoji: '📄', label: 'What-if sheet', x: 85, y: 20 },
      { id: 'core', emoji: '📌', label: 'Clashing rules', x: 15, y: 20 },
      { id: 'chests', emoji: '💰', label: 'Split: ?', x: 50, y: 82 },
      { id: 'cannon', emoji: '💣', label: 'Old vs new cannon', x: 85, y: 82 }
    ],
    actors: [
      { id: 'nami', emoji: '🧭', label: 'Nami', x: 30, y: 50 },
      { id: 'usopp', emoji: '🤥', label: 'Usopp', x: 70, y: 50 },
      { id: 'franky', emoji: '🤖', label: 'Franky', x: 90, y: 55 }
    ],
    steps: [
      { c: "Nami writes the rules: luffy + zoro == 10, luffy - zoro == 4, Implies(sanji_cooks, brook > luffy). s.add(...)", p: { table: 'lit' } },
      { c: "check() says sat. The model: Luffy 7, Zoro 3, Brook 57/8 (a Real), Sanji cooks.", p: { chests: 'good' }, l: { chests: 'Split: 7 / 3 / 57/8' } },
      { c: "Usopp's what-if: Sanji cooks and Brook < 7. Nami pins a temporary sheet: push().", a: { usopp: [78, 30] }, p: { sheet: 'lit' } },
      { c: "check() says unsat. The core names just the clashing rules, not every rule on the table.", p: { sheet: 'bad', core: 'lit' }, l: { core: 'core: [brook_lt_7, cooks, rule3]' } },
      { c: "pop(): the sheet comes off and the original rules are untouched. check() is sat again.", p: { sheet: 'off', core: 'dim', table: 'good' } },
      { c: "Franky says his new cannon formula equals the old one. Nami asserts old != new and asks for a counterexample.", a: { nami: [70, 70] }, p: { cannon: 'lit' } },
      { c: "unsat: no angle exists where they differ. Equivalence proved for every input, not just the ones Franky tested.", p: { cannon: 'good' }, l: { cannon: 'unsat: equivalent' } }
    ]
  },
  conceptFlow: {
    title: "The life of a Z3 Python query",
    intro: "The same lifecycle applies whether you are solving Sudoku or checking a compiler rewrite.",
    stages: [
      { label: 'Declare', nodes: [ { id: 'vars', text: 'Int / Real / Bool\nBitVec, Array' } ] },
      { label: 'Constrain', nodes: [ { id: 'add', text: 's.add(...)\nAnd/Or/If/Distinct' }, { id: 'scope', text: 'push() / pop()\nassumptions' } ] },
      { label: 'Solve', nodes: [ { id: 'check', text: 's.check()\nsat / unsat / unknown' }, { id: 'opt', text: 'Optimize\nmaximize, add_soft' } ] },
      { label: 'Inspect', nodes: [ { id: 'model', text: 'model()\nm[x], m.eval(...)' }, { id: 'core', text: 'unsat_core()\ntracked literals' }, { id: 'why', text: 'reason_unknown()\nstatistics()' } ] },
      { label: 'Iterate', nodes: [ { id: 'block', text: 'Block model\nenumerate solutions' } ] }
    ],
    steps: [
      { active: ['vars'], note: "Declare symbolic variables. They are Z3 terms; Python operators on them build syntax trees, not values." },
      { active: ['add'], note: "Add constraints. Use And, Or, Not and If instead of Python's and, or, not and the ternary operator." },
      { active: ['scope'], note: "Use push and pop, or assumption literals passed to check, to ask related questions without rebuilding the solver." },
      { active: ['check'], note: "check returns sat, unsat or unknown. Compare with ==; the result object is always truthy." },
      { active: ['opt'], note: "For best rather than any solution, use Optimize: hard constraints with add, objectives with maximize or minimize, preferences with add_soft." },
      { active: ['model'], note: "After sat, read values with m[x] or evaluate any expression with m.eval. Convert with as_long or as_fraction." },
      { active: ['core'], note: "After unsat, the unsat core lists the tracked assertions or assumptions that were needed for the contradiction." },
      { active: ['why'], note: "After unknown, reason_unknown says whether it was a timeout, incomplete quantifiers, or nonlinear arithmetic." },
      { active: ['block'], note: "To enumerate solutions, add a clause that excludes the current model and check again, until unsat." }
    ]
  },
  tech: [
    {
      q: "Why does 0 < x < 9 silently do the wrong thing?",
      a: "Python expands a chained comparison to <code>(0 &lt; x) and (x &lt; 9)</code>, and <code>and</code>/<code>or</code> call <code>bool()</code> on Z3 terms. For an ordering comparison Z3 raises <i>Symbolic expressions cannot be cast to concrete Boolean values</i>, which is the lucky case. For <code>==</code> it returns structural equality instead, so <code>(x == 3) and (y == 4)</code> evaluates to just <code>x == 3</code> and <code>(x == 3) or (y == 4)</code> to just <code>y == 4</code>: half the constraint silently disappears. Always use <code>And(...)</code>, <code>Or(...)</code>, <code>Not(...)</code>."
    },
    {
      q: "Why does Z3 print 57/8 instead of 7.125?",
      a: "Real arithmetic in Z3 is exact rational arithmetic (simplex over rationals). <code>m[r].as_fraction()</code> gives a Python Fraction, <code>m[r].as_decimal(6)</code> a decimal string. For algebraic numbers from nonlinear problems (e.g. a root of x^2 = 2), Z3 returns an algebraic number object with <code>approx()</code>."
    },
    {
      q: "What is the difference between assert_and_track and check(assumptions)?",
      a: "<code>assert_and_track(C, a)</code> permanently adds <code>Implies(a, C)</code> and assumes a on every check, so the core reports the a literals that mattered. <code>check(a1, a2)</code> assumes only the literals you pass on that call, so you can enable different subsets per query without push/pop. Both produce cores through the same mechanism; assumptions are better for loops like MUS extraction or delta-debugging over constraints."
    },
    {
      q: "Is Z3's Python API thread-safe?",
      a: "Not within one Context. Each thread (or process) should create its own <code>Context()</code> and pass <code>ctx=</code> when declaring variables and solvers, or use <code>multiprocessing</code>. For large eval-style sweeps over many queries, separate processes with timeouts are the robust choice, since a solver can occasionally run far past its timeout in a long-running operation."
    }
  ],
  code: {
    title: "Sudoku in 25 lines, plus a uniqueness proof",
    intro: "81 Int variables, Distinct on rows, columns and boxes, givens as equalities. After solving, we block the solution and ask again: unsat proves the puzzle has exactly one solution, which is how puzzle generators check their output.",
    code: `# sudoku_z3.py -- run with: python3 sudoku_z3.py   (pip install --user z3-solver)
from z3 import Int, Solver, And, Or, Distinct, sat

PUZZLE = [
    "53..7....",
    "6..195...",
    ".98....6.",
    "8...6...3",
    "4..8.3..1",
    "7...2...6",
    ".6....28.",
    "...419..5",
    "....8..79",
]

X = [[Int("x_%d_%d" % (r, c)) for c in range(9)] for r in range(9)]
s = Solver()
s.add([And(1 <= X[r][c], X[r][c] <= 9) for r in range(9) for c in range(9)])
s.add([Distinct(X[r]) for r in range(9)])                                # rows
s.add([Distinct([X[r][c] for r in range(9)]) for c in range(9)])        # columns
s.add([Distinct([X[3 * br + i][3 * bc + j] for i in range(3) for j in range(3)])
       for br in range(3) for bc in range(3)])                           # 3x3 boxes
s.add([X[r][c] == int(ch) for r, row in enumerate(PUZZLE)
       for c, ch in enumerate(row) if ch != "."])                        # givens

assert s.check() == sat
m = s.model()
grid = [[m.eval(X[r][c]).as_long() for c in range(9)] for r in range(9)]
for row in grid:
    print(" ".join(map(str, row)))

# Uniqueness: block this solution and ask for a different one
s.add(Or([X[r][c] != grid[r][c] for r in range(9) for c in range(9)]))
print("another solution exists?", s.check())

# Output:
# 5 3 4 6 7 8 9 1 2
# 6 7 2 1 9 5 3 4 8
# 1 9 8 3 4 2 5 6 7
# 8 5 9 7 6 1 4 2 3
# 4 2 6 8 5 3 7 9 1
# 7 1 3 9 2 4 8 5 6
# 9 6 1 5 3 7 2 8 4
# 2 8 7 4 1 9 6 3 5
# 3 4 5 2 8 6 1 7 9
# another solution exists? unsat`,
    notes: [
      "Notice that the encoding is declarative: we never wrote a search algorithm. Z3 solves this in a few milliseconds because Distinct plus the givens propagate strongly.",
      "<code>m.eval(...).as_long()</code> converts Z3 integer values to Python ints so you can use them in ordinary code, here to build the blocking clause.",
      "The uniqueness check is the general pattern for 'is this the only answer': enumerate one model, block it, check again."
    ]
  },
  lab: {
    title: "N-queens: solve it, draw it, count all solutions",
    prompt: "Write <code>queens_solver(n)</code> returning a Solver and the list <code>Q</code> of n Int variables, where <code>Q[i]</code> is the column of the queen in row i. Constrain columns to range over 0..n-1, all distinct, and no two queens on a diagonal (for rows i &gt; j: <code>Q[i] - Q[j] != i - j</code> and <code>Q[i] - Q[j] != j - i</code>). Print one 8x8 board, then write <code>count_solutions(n)</code> that enumerates solutions with blocking clauses. Check you get 2, 4 and 92 for n = 4, 6 and 8.",
    starter: `from z3 import Int, Solver, And, Or, Distinct, sat

def queens_solver(n):
    Q = [Int("q_%d" % i) for i in range(n)]
    s = Solver()
    # TODO: range, Distinct, both diagonals
    return s, Q

def count_solutions(n):
    s, Q = queens_solver(n)
    count = 0
    # TODO: while sat: count, then block the current model
    return count

# TODO: print a board for n = 8 and the counts for 4, 6, 8
`,
    checks: [
      { re: 'Distinct\\s*\\(\\s*Q\\s*\\)', flags: '', must: true, hint: 'One queen per column: s.add(Distinct(Q))', pass: 'Columns distinct' },
      { re: 'And\\s*\\(\\s*0\\s*<=\\s*q\\s*,\\s*q\\s*<\\s*n\\s*\\)', flags: '', must: true, hint: 'Range with And(0 <= q, q < n), not a chained comparison', pass: 'Range constraint uses And' },
      { re: 'Q\\[i\\]\\s*-\\s*Q\\[j\\]\\s*!=\\s*i\\s*-\\s*j', flags: '', must: true, hint: 'Main diagonal: Q[i] - Q[j] != i - j', pass: 'Main diagonal' },
      { re: 'Q\\[i\\]\\s*-\\s*Q\\[j\\]\\s*!=\\s*j\\s*-\\s*i', flags: '', must: true, hint: 'Anti-diagonal: Q[i] - Q[j] != j - i', pass: 'Anti-diagonal' },
      { re: 'while\\s+s\\.check\\s*\\(\\s*\\)\\s*==\\s*sat', flags: '', must: true, hint: 'Loop with while s.check() == sat (compare with ==)', pass: 'Enumeration loop' },
      { re: 's\\.add\\s*\\(\\s*Or\\s*\\(\\s*\\[\\s*q\\s*!=\\s*m\\[q\\]', flags: '', must: true, hint: 'Block the model: s.add(Or([q != m[q] for q in Q]))', pass: 'Blocking clause' },
      { re: '\\d\\s*<\\s*q\\s*<|q\\s*<\\s*n\\s*<', flags: '', must: false, hint: 'Chained comparisons do not build Z3 constraints; use And', pass: 'No chained comparisons' },
      { re: 'TODO', flags: '', must: false, hint: 'Remove the TODO comments once done', pass: 'No TODOs left' }
    ],
    run: "Save as <code>nqueens_z3.py</code>; <code>pip install --user z3-solver</code>; <code>python3 nqueens_z3.py</code>. It prints an 8x8 board and <code>n=4 solutions: 2</code>, <code>n=6 solutions: 4</code>, <code>n=8 solutions: 92</code> in well under a second. Try n = 10 (724) to see enumeration cost grow.",
    solution: `# nqueens_z3.py -- run with: python3 nqueens_z3.py
from z3 import Int, Solver, And, Or, Distinct, sat

def queens_solver(n):
    Q = [Int("q_%d" % i) for i in range(n)]     # Q[i] = column of the queen in row i
    s = Solver()
    s.add([And(0 <= q, q < n) for q in Q])
    s.add(Distinct(Q))                          # one queen per column
    s.add([Q[i] - Q[j] != i - j for i in range(n) for j in range(i)])   # main diagonals
    s.add([Q[i] - Q[j] != j - i for i in range(n) for j in range(i)])   # anti-diagonals
    return s, Q

def count_solutions(n):
    s, Q = queens_solver(n)
    count = 0
    while s.check() == sat:
        m = s.model()
        count += 1
        s.add(Or([q != m[q] for q in Q]))       # block this exact solution
    return count

s, Q = queens_solver(8)
assert s.check() == sat
cols = [s.model()[q].as_long() for q in Q]
for c in cols:
    print(". " * c + "Q " + ". " * (8 - c - 1))

for n in (4, 6, 8):
    print("n=%d solutions:" % n, count_solutions(n))

# n=4 solutions: 2
# n=6 solutions: 4
# n=8 solutions: 92
`,
    notes: [
      "Rows are implicit (one variable per row), columns are handled by Distinct, so only diagonals need explicit constraints. Choosing a representation that makes constraints vanish is the main skill in solver modeling.",
      "The blocking clause must mention every variable that defines a solution; here that is all of Q.",
      "The board you get may differ from someone else's; the counts will not."
    ]
  },
  quiz: [
    {
      q: "What does <code>if s.check():</code> do?",
      options: ["Runs the body only if sat", "Runs the body only if unsat", "Always runs the body, because the result object is truthy", "Raises a TypeError"],
      correct: 2,
      explain: "check returns a CheckSatResult object, which is truthy whatever its value. Compare explicitly: s.check() == sat."
    },
    {
      q: "You want to prove f(x) == g(x) for all 32-bit x. Which query?",
      options: ["s.add(f(x) == g(x)); expect sat", "s.add(f(x) != g(x)); expect unsat", "s.add(f(x) != g(x)); expect sat", "Optimize and minimize f(x) - g(x)"],
      correct: 1,
      explain: "Unsat for the disequality means there is no distinguishing input. A sat answer for f == g only shows one input where they agree."
    },
    {
      q: "After s.check() == sat, m[z] returns None. Why?",
      options: ["z is unsatisfiable", "z does not occur in any assertion, so the model does not assign it", "The model is still being computed", "z is a Real"],
      correct: 1,
      explain: "Models only interpret relevant symbols. m.eval(z, model_completion=True) picks a default value."
    },
    {
      q: "What does add_soft(c, 5) mean in an Optimize instance?",
      options: ["c must hold with probability 5%", "c is preferred; violating it costs weight 5, and the solver minimizes total violated weight", "c is checked 5 times", "c is a hard constraint with priority 5"],
      correct: 1,
      explain: "Soft constraints turn the problem into weighted MaxSAT/MaxSMT within the given id group."
    },
    {
      q: "Why use check(a1, a2, a3) with guarded constraints instead of push/pop?",
      options: ["It is the only way to get models", "You can enable any subset of constraints per call and get a core over the assumptions, without changing the assertion stack", "It disables learning", "It is required for Optimize"],
      correct: 1,
      explain: "Assumption literals are cheap to toggle and give unsat cores in terms of exactly the constraints you enabled."
    }
  ],
  testFlow: {
    title: "Test yourself: predict Z3's answer",
    start: 'q1',
    nodes: {
      q1: {
        q: "x = Int('x'); s.add(x % 3 == 2, x < 0). What happens?",
        choices: [
          { text: "sat, e.g. x = -1, since SMT-LIB mod is non-negative and -1 = 3*(-1) + 2", to: 'q1_right' },
          { text: "unsat, since negative numbers have negative remainders", to: 'q1_wrong' }
        ]
      },
      q1_right: { end: true, correct: true, text: "Right. Z3 Int % follows SMT-LIB Euclidean semantics, so the remainder is in [0, 3). In Java, -1 % 3 is -1; in Python it is 2. Know which one your encoding needs.", next: 'q2' },
      q1_wrong: { end: true, correct: false, text: "That is C/Java truncation semantics. Z3's Int mod is Euclidean: always non-negative for a nonzero divisor.", retry: 'q1' },
      q2: {
        q: "You enumerate solutions with s.add(Or([v != m[v] for v in allvars])) but the loop never ends on a puzzle with 3 solutions. allvars includes a helper Int h that no constraint bounds. Most likely bug?",
        choices: [
          { text: "Each new model can just pick a new value for h, so blocking over allvars never runs out of 'new' models", to: 'q2_right' },
          { text: "Z3 cannot enumerate more than one model", to: 'q2_wrong' }
        ]
      },
      q2_right: { end: true, correct: true, text: "Yes. Block only on the variables that define a solution (project away helpers), or you enumerate infinitely many copies of the same 3 solutions." },
      q2_wrong: { end: true, correct: false, text: "Enumeration by blocking clauses is standard. The issue is what the blocking clause mentions.", retry: 'q2' }
    }
  },
  pitfalls: [
    "Using Python <code>and</code>, <code>or</code>, <code>not</code>, ternaries or chained comparisons on Z3 terms. Use And, Or, Not, If.",
    "Writing <code>if s.check():</code>. Always compare with sat or unsat.",
    "Reading <code>s.model()</code> after unsat or unknown: it raises an exception, and after unknown any model is only a candidate.",
    "Mixing Int and Real by accident (e.g. <code>x / 2</code> with x Int is integer division, <code>x / 2.0</code> converts to Real).",
    "Forgetting that Int is unbounded: a proof about Int says nothing about Java ints, which wrap. Use BitVec(32) for machine integers."
  ],
  interview: [
    {
      q: "Walk me through solving a constraint problem with Z3's Python API.",
      a: "Declare symbolic variables of the right sort (Int, Real, Bool, BitVec), create a Solver, add constraints using Z3 operators and connectives (And/Or/If/Distinct), call check(). On sat, read the model with m[x] or m.eval and convert with as_long. On unsat, if I need to know why, I use tracked assertions or assumptions and read unsat_core(). For related queries I use push/pop or assumptions to stay incremental. If I need the best solution, I switch to Optimize with maximize/minimize or add_soft. I always set a timeout and handle unknown explicitly."
    },
    {
      q: "How would you check that an LLM-generated rewrite of a function is correct?",
      a: "If the function is pure and loop-free (or has bounded loops I can unroll), encode both the original and the rewrite as Z3 expressions over the same symbolic inputs, using BitVec for machine integers, and assert they differ. Unsat proves equivalence over the encoded domain; sat gives a concrete distinguishing input, which I turn into a regression test and feedback for the model. For code with unbounded loops or heap, I fall back to bounded equivalence (unroll k times), differential testing with the model's counterexamples as seeds, or a verifier like Dafny with loop invariants."
    },
    {
      q: "Explain a tradeoff: Int vs BitVec for modeling program integers.",
      a: "Int is mathematical, unbounded integers decided by simplex plus branch-and-bound: easy to reason about and often fast for linear constraints, but it ignores overflow, so proofs may not hold for the real program. BitVec models exact machine semantics, including wrap-around, signed vs unsigned comparison and bitwise operations, but is decided by bit-blasting, which can be slow with multiplication or division at 64 bits. I use BitVec when overflow or bit tricks matter (C, Java, compiled code), Int for high-level specs or when I have separately proved no overflow occurs."
    },
    {
      q: "Whiteboard: use Z3 to find a minimal set of tests that covers all branches.",
      a: "One Bool t_i per test meaning the test is kept. For each branch b, add a hard constraint Or(t_i for tests i that cover b), using coverage data. Minimize Sum(If(t_i, 1, 0)), or add_soft(Not(t_i), cost_i) with runtime as the weight to minimize total time. Optimize returns a minimum set cover. I would mention set cover is NP-hard but practical sizes (thousands of tests) are fine for MaxSAT, and that for flaky tests you could also add constraints to exclude known-flaky tests or require redundancy for critical branches."
    },
    {
      q: "What is an unsat core and how would you use one in practice?",
      a: "A subset of the assertions (or assumptions) that is by itself unsatisfiable. In practice: debugging over-constrained models or configurations (which of my 200 package constraints conflict?), explaining why a verification condition holds (which hypotheses were used, a cheap form of proof relevance), and as a building block for MUS extraction (shrink the core until every element is necessary) or diagnosis. Z3 cores are not minimal by default; minimize with the smt.core.minimize option or a deletion-based loop over assumptions."
    },
    {
      q: "How do you enumerate all solutions, and what goes wrong?",
      a: "Loop: check, read the model, add a blocking clause Or(v != m[v] for each solution variable), repeat until unsat. Pitfalls: the clause must be over exactly the variables that define a solution, otherwise you get duplicates or miss solutions; the number of solutions can be exponential, so cap the loop; and for counting, use a dedicated #SAT or approximate counter instead."
    },
    {
      q: "What does Optimize do internally for soft constraints?",
      a: "It treats each id group of soft constraints as a weighted MaxSAT/MaxSMT problem, using core-guided algorithms (MaxRes by default) that repeatedly find unsat cores among the soft constraints and relax them, and it uses an optimizing simplex or iterative bound tightening for arithmetic objectives. Multiple objectives are handled lexicographically by default, or as Pareto fronts or independent box optima if configured."
    }
  ]
};
