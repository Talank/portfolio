window.LESSONS = window.LESSONS || {};
window.LESSONS['sat-solving'] = {
  id: 'sat-solving',
  title: 'Propositional Logic & SAT: CNF, Tseitin, DPLL & CDCL',
  category: 'Part 0 — Logic Foundations',
  timeMin: 45,
  summary: "SAT is the problem every other solver in this course reduces to: given a Boolean formula, find an assignment that makes it true or prove none exists. It is NP-complete, yet modern CDCL solvers (MiniSat, Glucose, CaDiCaL, Kissat) routinely solve industrial instances with millions of clauses. This lesson covers the input format (CNF and DIMACS), how arbitrary formulas get there without blowing up (Tseitin), the DPLL backbone (unit propagation, pure literals, backtracking), and the four ideas that make CDCL fast: implication graphs, 1-UIP clause learning, non-chronological backjumping, and VSIDS with restarts. You build a working DPLL in 60 lines of Python and cross-check it against Z3.",
  goals: [
    "Convert a formula to CNF two ways (distribution and Tseitin) and explain why Tseitin is linear-size and only equisatisfiable",
    "Read and write DIMACS CNF and run it through a real solver (z3 -dimacs)",
    "Trace DPLL by hand: unit propagation, pure literal elimination, decision, chronological backtracking",
    "Explain CDCL: build an implication graph, derive a 1-UIP learned clause by resolution, and compute the backjump level",
    "Explain why VSIDS, restarts, watched literals and learned-clause deletion matter in practice",
    "Encode a small combinatorial problem (graph coloring, pigeonhole) into SAT"
  ],
  concept: [
    {
      h: "Propositional logic and the SAT problem",
      p: [
        "Formulas are built from Boolean variables with ¬, ∧, ∨, →, ↔. A <b>literal</b> is a variable or its negation (x, ¬x). A <b>clause</b> is a disjunction of literals, (x1 ∨ ¬x3 ∨ x7). A formula in <b>conjunctive normal form (CNF)</b> is a conjunction of clauses.",
        "SAT asks: is there an assignment making the formula true? It was the first problem proved NP-complete (Cook 1971, Levin 1973). Checking a proposed assignment is linear; finding one may take exponential time in the worst case. Validity is the dual: F is valid iff ¬F is unsatisfiable, so a SAT solver is also a tautology checker.",
        "Why CNF? A clause is a constraint that is violated by exactly one partial assignment pattern (all its literals false), which makes propagation and conflict detection cheap and uniform. Every SAT solver you will meet consumes CNF."
      ]
    },
    {
      h: "Getting to CNF: distribution vs Tseitin",
      p: [
        "Naive conversion pushes negations inward (De Morgan) and distributes ∨ over ∧. It preserves equivalence but can blow up exponentially: (a1 ∧ b1) ∨ (a2 ∧ b2) ∨ ... ∨ (an ∧ bn) becomes 2<sup>n</sup> clauses.",
        "<b>Tseitin's transformation</b> (1968) introduces a fresh variable for every subformula and adds clauses saying the fresh variable is equivalent to that subformula. Each gate contributes a constant number of clauses, so the result is linear in the formula size. The catch: the output is <b>equisatisfiable</b>, not equivalent (it has extra variables). For SAT that is all you need, and every model of the CNF, projected onto the original variables, is a model of the original formula.",
        "<table><tr><th>Gate</th><th>Tseitin clauses for t ↔ gate</th></tr><tr><td>t ↔ (a ∧ b)</td><td>(¬t ∨ a), (¬t ∨ b), (t ∨ ¬a ∨ ¬b)</td></tr><tr><td>t ↔ (a ∨ b)</td><td>(t ∨ ¬a), (t ∨ ¬b), (¬t ∨ a ∨ b)</td></tr><tr><td>t ↔ ¬a</td><td>(t ∨ a), (¬t ∨ ¬a)</td></tr></table>",
        "Then assert the root variable as a unit clause. Plaisted-Greenbaum is a refinement that emits only one direction of each equivalence, based on the subformula's polarity, roughly halving the clauses."
      ],
      code: `from z3 import Bools, Or, And, Not, Solver
a, b, c, d, t1, t2 = Bools("a b c d t1 t2")
F = Or(And(a, b), And(c, d))

# Tseitin: t1 <-> (a and b), t2 <-> (c and d), root clause (t1 or t2)
cnf = [Or(Not(t1), a), Or(Not(t1), b), Or(t1, Not(a), Not(b)),
       Or(Not(t2), c), Or(Not(t2), d), Or(t2, Not(c), Not(d)),
       Or(t1, t2)]

s = Solver()
s.add(And(cnf), Not(F))   # can the CNF hold while F is false?
print(s.check())          # unsat: every CNF model satisfies F`
    },
    {
      h: "DIMACS: the lingua franca",
      p: [
        "Every competition solver reads DIMACS CNF. Variables are positive integers, negation is a minus sign, each clause ends with <code>0</code>. The header <code>p cnf &lt;vars&gt; &lt;clauses&gt;</code> declares sizes; lines starting with <code>c</code> are comments. Solvers print <code>s SATISFIABLE</code> plus <code>v</code> lines with the model, or <code>s UNSATISFIABLE</code> (exit codes 10 and 20 by competition convention).",
        "Modern solvers can also emit a DRAT proof for UNSAT answers, which an independent checker (drat-trim, or the formally verified cake_lpr) validates. SAT competitions have required proofs for UNSAT since 2016; that is how the 200-terabyte proof of the Boolean Pythagorean triples problem (Heule, Kullmann, Marek 2016) was checked."
      ],
      code: `c (x1 or x2) and (not x1 or x3) and (not x3 or not x2) and (x1 or not x3)
p cnf 3 4
1 2 0
-1 3 0
-3 -2 0
1 -3 0

$ z3 -dimacs f.cnf           # the pip z3-solver package installs a z3 binary
s SATISFIABLE
...`
    },
    {
      h: "DPLL: propagate, decide, backtrack",
      p: [
        "Davis-Putnam-Logemann-Loveland (1962) is a backtracking search with two inference rules:",
        "<ul><li><b>Unit propagation (BCP)</b>: if all literals of a clause but one are false, the last one must be true. Repeat to a fixpoint. If some clause has all literals false, that is a <b>conflict</b>.</li><li><b>Pure literal elimination</b>: if a variable appears with only one polarity in the remaining clauses, set it that way; it cannot hurt. (Modern CDCL solvers skip this during search because it is expensive to maintain; it survives in preprocessing.)</li><li><b>Decision</b>: pick an unassigned variable, try a value; on conflict, flip the most recent decision not yet flipped (chronological backtracking).</li></ul>",
        "Unit propagation does most of the work. In industrial instances, the vast majority of assignments are implied by propagation rather than chosen by decisions, and solvers spend most of their runtime in BCP. That is why the <b>two-watched-literal</b> scheme (Chaff, 2001) matters: each clause watches two non-false literals and is only visited when one of them becomes false, and nothing needs undoing on backtrack."
      ]
    },
    {
      h: "CDCL: learn from every conflict",
      p: [
        "Conflict-Driven Clause Learning (GRASP 1996, Chaff 2001, MiniSat 2003) keeps DPLL's loop but changes what happens on a conflict:",
        "<ol><li><b>Implication graph</b>: every assigned literal records its decision level and its reason clause (the clause that became unit and forced it; decisions have no reason).</li><li><b>Conflict analysis</b>: starting from the falsified clause, repeatedly resolve with the reason clause of the most recently assigned literal at the current level, until exactly one literal from the current decision level remains. That literal is the <b>first unique implication point (1-UIP)</b>: every path from the current decision to the conflict passes through it. The resulting clause is the learned clause.</li><li><b>Non-chronological backjumping</b>: jump back to the second-highest decision level in the learned clause (the asserting level), not just one level. There the learned clause is unit, so it immediately propagates the negation of the UIP.</li><li><b>Keep the clause</b>: the learned clause is implied by the original formula (it was derived by resolution), so adding it is sound and prunes every future branch containing the same bad combination.</li></ol>",
        "Learned clauses are also what makes UNSAT proofs possible: the sequence of learned clauses ending in the empty clause is a resolution proof, which is exactly what DRAT records."
      ]
    },
    {
      h: "Heuristics that make it fly: VSIDS, phase saving, restarts, clause deletion",
      p: [
        "<ul><li><b>VSIDS</b> (Variable State Independent Decaying Sum, Chaff): each variable has an activity score, bumped when it appears in a learned clause (MiniSat bumps variables seen during conflict analysis), and all scores decay geometrically (implemented by growing the bump amount). Decide on the most active unassigned variable. It focuses search on the currently contested core of the problem. Kissat and CaDiCaL alternate VSIDS-style and VMTF (variable move-to-front) heuristics.</li><li><b>Phase saving</b>: when re-deciding a variable, reuse its last assigned value. Keeps partial solutions alive across backjumps and restarts.</li><li><b>Restarts</b>: periodically abandon the trail (keep learned clauses and scores) and start from level 0. Escapes heavy-tailed runtime distributions. Schedules: Luby sequence, or Glucose's dynamic restarts based on recent LBD averages.</li><li><b>Learned clause deletion</b>: keep only useful learned clauses, ranked by <b>LBD</b> (literal block distance, the number of distinct decision levels in the clause; Glucose 2009). Low-LBD \"glue\" clauses are kept forever.</li><li><b>Preprocessing / inprocessing</b>: bounded variable elimination, subsumption, vivification, failed literal probing.</li></ul>"
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: "Interviewers who know SAT will ask you to run conflict analysis on a whiteboard. Here is a full worked example, the theory behind why learning helps, and the encodings you will need.",
    sections: [
      {
        h: "Worked example: implication graph, 1-UIP and backjump",
        p: [
          "Clauses: c1 = (¬a ∨ b), c2 = (¬g ∨ h), c3 = (¬c ∨ d), c4 = (¬b ∨ ¬d ∨ e), c5 = (¬e ∨ ¬b ∨ f), c6 = (¬e ∨ ¬f).",
          "<ul><li>Level 1: decide a. c1 propagates b@1.</li><li>Level 2: decide g. c2 propagates h@2 (unrelated to what follows).</li><li>Level 3: decide c. c3 gives d@3; c4 (b, d true) gives e@3; c5 (e, b true) gives f@3; c6 is now all false: conflict.</li></ul>",
          "Analysis: start with c6 = (¬e ∨ ¬f). Two literals at level 3 (e, f), so resolve on f, the most recent, with its reason c5 = (¬e ∨ ¬b ∨ f): result (¬e ∨ ¬b). Now only one level-3 literal remains (e): stop. e is the 1-UIP; d and c are further back on the same path. Learned clause: (¬e ∨ ¬b).",
          "Backjump level: the highest level among the other literals, here b@1. Jump from level 3 straight to level 1, skipping level 2 (g was irrelevant, and chronological backtracking would have wasted time retrying g=false). At level 1, b is true, so the learned clause is unit and propagates ¬e@1, then c4 gives ¬d@1 and c3 gives ¬c@1. The solver now knows, without any decision, that c must be false whenever a is true.",
          "Compare with learning the decision clause (¬a ∨ ¬g ∨ ¬c): it mentions the irrelevant g, so it prunes less. 1-UIP clauses are short and empirically the best choice (Zhang et al., ICCAD 2001)."
        ]
      },
      {
        h: "Why CDCL beats DPLL: proof complexity",
        p: [
          "A DPLL run on an unsatisfiable formula corresponds to a tree-like resolution proof. CDCL with restarts polynomially simulates general (DAG-like) resolution (Pipatsrisawat and Darwiche 2009/2011; Atserias, Fichte, Thurley 2011), because learned clauses are reusable lemmas. General resolution is exponentially stronger than tree-like resolution on some families.",
          "But resolution itself has limits: the pigeonhole formulas PHP(n+1, n) require exponential-size resolution proofs (Haken 1985), so every CDCL solver takes exponential time on them no matter how clever its heuristics. Solvers with cardinality reasoning or symmetry breaking avoid this; this is the standard answer to \"is there anything CDCL is provably bad at?\"."
        ]
      },
      {
        h: "Encoding patterns you will actually use",
        p: [
          "<ul><li><b>At-least-one</b> of x1..xn: one clause (x1 ∨ ... ∨ xn).</li><li><b>At-most-one</b>: pairwise (¬xi ∨ ¬xj) for all i &lt; j, which is O(n<sup>2</sup>) clauses; the sequential counter (Sinz 2005) or commander encodings are O(n) with auxiliary variables.</li><li><b>Cardinality and pseudo-Boolean</b> constraints (∑ xi ≤ k): sorting networks, totalizers, or let Z3 do it with <code>AtMost</code>/<code>PbLe</code>.</li><li><b>Circuits</b>: Tseitin per gate. Equivalence checking two circuits is SAT on a miter (XOR of their outputs).</li><li><b>Bounded model checking</b>: unroll the transition relation k times and ask whether a bad state is reachable (next lessons).</li></ul>"
        ]
      },
      {
        h: "Incremental SAT and assumptions",
        p: [
          "Real clients (SMT solvers, bounded model checkers, IC3/PDR) call the SAT solver thousands of times on slowly changing formulas. MiniSat's API supports <b>assumptions</b>: solve under temporary unit literals without adding them permanently, keep learned clauses between calls. On UNSAT it returns the subset of assumptions used in the conflict (the final conflict), which is how unsat cores are extracted cheaply. IPASIR is the standard C API for incremental SAT solvers."
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: "Nami Learns From Every Wrong Turn in the Fog",
      text: [
        "The Sunny is lost in a fog maze of channels. At each fork Luffy picks a direction at random (a decision). Some channels force the next turn because the alternative is a cliff (unit propagation: only one option left).",
        "Plain DPLL sailing: when they hit a dead end, they back up to the very last fork and try the other way, even if that fork had nothing to do with the dead end.",
        "Nami does better. At each dead end she traces back on her chart which turns actually forced them there, and finds the single narrow passage every route to the dead end went through (the 1-UIP). She writes a rule on the chart: \"after the red buoy, never take the narrow passage\" (the learned clause). Then she sails straight back to the fork where the red buoy was decided, skipping three irrelevant forks in between (non-chronological backjumping).",
        "Franky keeps a tally of which forks keep showing up in Nami's rules and tells Luffy to decide those first (VSIDS). Every so often Nami says \"start over from the harbor, but keep the rules\" (restarts). By morning the chart has so many rules that the fog maze is solved, or proved to have no exit at all."
      ]
    },
    sitcom: {
      show: 'Friends',
      title: "Monica's Seating Chart",
      text: [
        "Monica has to seat everyone at the wedding: Ross cannot sit next to Emily, Rachel must sit next to someone she knows, Janice cannot be at any table with Chandler. Each rule is a clause.",
        "Phoebe's method is to try seatings until one works and, when stuck, undo only her last change. Monica's method: whenever a seating fails, she figures out the actual reason (\"it's always Janice plus table 2\") and writes it on a sticky note so she never tries that combination again. Then she rips up everything back to the decision that caused it, not just the last one.",
        "Chandler asks if there's a way to prove no seating works. Monica holds up her stack of sticky notes: \"When these notes contradict each other, that's the proof.\""
      ]
    },
    why: "Luffy's random forks and Phoebe's undo-last-change are DPLL decisions with chronological backtracking. Nami's narrow passage is the 1-UIP, her chart rule is the learned clause, skipping irrelevant forks is backjumping, Franky's tally is VSIDS, and Monica's stack of contradicting sticky notes is the resolution proof (DRAT) behind an UNSAT answer."
  },
  storyAnim: {
    h: 260,
    props: [
      { id: 'fork1', emoji: '🔴', label: 'Fork 1: a (red buoy)', x: 12, y: 20 },
      { id: 'fork2', emoji: '🟡', label: 'Fork 2: g (irrelevant)', x: 36, y: 20 },
      { id: 'fork3', emoji: '🟢', label: 'Fork 3: c', x: 60, y: 20 },
      { id: 'passage', emoji: '🚪', label: 'Narrow passage e', x: 74, y: 62 },
      { id: 'wall', emoji: '🪨', label: 'Dead end', x: 90, y: 30 },
      { id: 'chart', emoji: '📜', label: 'Rules: none', x: 12, y: 80 }
    ],
    actors: [
      { id: 'ship', emoji: '⛵', label: 'Sunny (trail)', x: 4, y: 50 },
      { id: 'nami', emoji: '🧭', label: 'Nami', x: 30, y: 82 }
    ],
    steps: [
      { c: "Level 1: Luffy picks the red-buoy channel (decide a). The current forces the next bend (propagate b).", a: { ship: [14, 45] }, p: { fork1: 'lit' } },
      { c: "Level 2: an unrelated fork (decide g). It changes nothing about what follows.", a: { ship: [38, 45] }, p: { fork2: 'lit' } },
      { c: "Level 3: decide c. The channel now forces d, then the narrow passage e, then f.", a: { ship: [70, 50] }, p: { fork3: 'lit', passage: 'lit' } },
      { c: "Dead end: clause (not e or not f) is violated. Conflict!", a: { ship: [86, 36] }, p: { wall: 'bad' } },
      { c: "Nami traces back: resolve the conflict with the reason for f. Only one level-3 turn remains on every path: e, the 1-UIP.", a: { nami: [70, 78] }, p: { passage: 'bad' } },
      { c: "She writes the learned clause on the chart: after the red buoy, never the narrow passage (not e or not b).", l: { chart: 'Rule: not e or not b' }, p: { chart: 'good' } },
      { c: "Backjump to level 1, skipping fork 2 entirely. There the rule is unit: it forces not e, then not d, then not c.", a: { ship: [14, 50] }, p: { fork2: 'dim', fork3: 'off', wall: 'dim' } },
      { c: "No decision was needed to learn that c is bad whenever a holds. That is why CDCL scales where plain DPLL drowns.", p: { fork1: 'good' } }
    ]
  },
  conceptFlow: {
    title: "The CDCL loop",
    intro: "This is the main loop of MiniSat, CaDiCaL and Kissat with the heuristics stripped away. Click a box to jump to it.",
    stages: [
      { label: 'Decide', nodes: [ { id: 'decide', text: 'Pick a variable\nVSIDS + phase saving' } ] },
      { label: 'Propagate', nodes: [ { id: 'bcp', text: 'Unit propagation\n2 watched literals' }, { id: 'graph', text: 'Implication graph\nlevel + reason per literal' } ] },
      { label: 'Conflict?', nodes: [ { id: 'conflict', text: 'Clause all false\nconflict' }, { id: 'done', text: 'All assigned\nSAT, print model' } ] },
      { label: 'Analyze', nodes: [ { id: 'uip', text: 'Resolve back to 1-UIP\nlearned clause' }, { id: 'jump', text: 'Backjump to\nasserting level' } ] },
      { label: 'Maintain', nodes: [ { id: 'restart', text: 'Restarts\nLuby / Glucose' }, { id: 'reduce', text: 'Delete learned clauses\nhigh LBD first' }, { id: 'unsat', text: 'Conflict at level 0\nUNSAT + DRAT proof' } ] }
    ],
    steps: [
      { active: ['decide'], note: "Choose the unassigned variable with the highest activity score, and give it its saved phase. This opens a new decision level." },
      { active: ['bcp'], note: "Propagate units to a fixpoint. Each clause watches two literals, so only clauses whose watched literal just became false get visited." },
      { active: ['graph'], note: "Every implied literal records its decision level and the clause that forced it. These edges form the implication graph." },
      { active: ['done'], note: "If propagation finishes with every variable assigned and no conflict, the trail is a model: answer SAT." },
      { active: ['conflict'], note: "If some clause has every literal false, we have a conflict at the current decision level." },
      { active: ['uip'], note: "Resolve the conflicting clause with reason clauses, newest first, until exactly one literal of the current level remains: the first unique implication point. Bump VSIDS scores of the variables involved." },
      { active: ['jump'], note: "Undo assignments down to the second-highest level in the learned clause. There it is unit and immediately flips the UIP literal." },
      { active: ['unsat'], note: "If a conflict happens at level 0, no decision is left to undo: the formula is unsatisfiable, and the learned clauses form a checkable proof." },
      { active: ['restart', 'reduce'], note: "Periodically restart from level 0, keeping learned clauses, and garbage-collect learned clauses with high literal block distance." }
    ]
  },
  tech: [
    {
      q: "If SAT is NP-complete, how do solvers handle millions of variables?",
      a: "NP-completeness is about worst-case families. Industrial instances (hardware verification, planning, software BMC) have structure: small backdoors, community structure, lots of propagation. CDCL exploits that through learning and VSIDS. Random 3-SAT near the clause-to-variable ratio of about 4.27 and crafted families like pigeonhole remain hard, which is why SAT competitions have separate tracks."
    },
    {
      q: "Why is Tseitin only equisatisfiable, and when does that matter?",
      a: "It adds fresh variables, so the CNF talks about a bigger vocabulary. Every model of the original extends to a model of the CNF, and every model of the CNF restricts to a model of the original. That is enough for SAT and for counterexamples. It matters for model counting (#SAT) and for enumerating all solutions: you must project onto the original variables or you will count the same solution multiple times (with full Tseitin equivalences the extension is unique; with Plaisted-Greenbaum it may not be)."
    },
    {
      q: "What is the difference between backtracking and backjumping?",
      a: "Chronological backtracking undoes the most recent decision and flips it. Backjumping undoes several levels at once, jumping to the highest level that actually participated in the conflict. Levels in between were irrelevant to this conflict, and phase saving makes it cheap to redo them afterwards."
    },
    {
      q: "Do I ever write a SAT solver myself in practice?",
      a: "Almost never. You encode into CNF (or let Z3/PySAT do it) and call CaDiCaL, Kissat, Glucose or MiniSat. PySAT (<code>pip install python-sat</code>) wraps many of them with a uniform Python API and includes cardinality encodings. Knowing the internals matters for writing encodings that propagate well, reading solver statistics, and interviews."
    }
  ],
  code: {
    title: "A 60-line DPLL over DIMACS, with Z3 as the referee",
    intro: "Clauses are lists of nonzero ints, exactly like DIMACS. The solver does unit propagation, pure literal elimination and chronological backtracking, and counts its work. Then it refutes the pigeonhole formula PHP(3,2) and cross-checks the first formula with Z3.",
    code: `# dpll.py -- run with: python3 dpll.py   (needs: pip install --user z3-solver)
from z3 import Bool, Or, Not, Solver

DIMACS = """c (x1 or x2) and (not x1 or x3) and (not x3 or not x2) and (x1 or not x3)
p cnf 3 4
1 2 0
-1 3 0
-3 -2 0
1 -3 0
"""

def parse_dimacs(text):
    clauses, cur = [], []
    for line in text.splitlines():
        line = line.strip()
        if not line or line[0] in "cp%":
            continue
        for tok in line.split():
            lit = int(tok)
            if lit == 0:
                clauses.append(cur)
                cur = []
            else:
                cur.append(lit)
    return clauses

def simplify(clauses, lit):
    """Set lit True: drop satisfied clauses, delete -lit from the others."""
    return [[l for l in c if l != -lit] for c in clauses if lit not in c]

stats = {"decisions": 0, "propagations": 0}

def dpll(clauses, assignment):
    # 1) unit propagation to a fixpoint
    while True:
        if any(len(c) == 0 for c in clauses):
            return None                         # conflict: empty clause
        units = [c[0] for c in clauses if len(c) == 1]
        if not units:
            break
        stats["propagations"] += 1
        assignment = assignment | {units[0]}
        clauses = simplify(clauses, units[0])
    # 2) pure literal elimination
    lits = {l for c in clauses for l in c}
    for lit in lits:
        if -lit not in lits:
            assignment = assignment | {lit}
            clauses = simplify(clauses, lit)
    if not clauses:
        return assignment                       # all clauses satisfied
    # 3) decide, backtrack chronologically on failure
    lit = clauses[0][0]
    stats["decisions"] += 1
    for choice in (lit, -lit):
        result = dpll(simplify(clauses, choice), assignment | {choice})
        if result is not None:
            return result
    return None

clauses = parse_dimacs(DIMACS)
model = dpll(clauses, frozenset())
print("DPLL:", "SAT" if model else "UNSAT", sorted(model, key=abs) if model else "")
print("stats:", stats)

# Pigeonhole PHP(3,2): 3 pigeons, 2 holes, no hole shared -> UNSAT
def var(p, h):
    return p * 2 + h + 1
php = [[var(p, 0), var(p, 1)] for p in range(3)]
php += [[-var(p, h), -var(q, h)] for h in range(2)
        for p in range(3) for q in range(p + 1, 3)]
stats.update(decisions=0, propagations=0)
print("PHP(3,2):", "SAT" if dpll(php, frozenset()) else "UNSAT", stats)

# Referee: the same clauses in Z3
x = {i: Bool("x%d" % i) for i in range(1, 4)}
s = Solver()
for c in clauses:
    s.add(Or([x[l] if l > 0 else Not(x[-l]) for l in c]))
print("Z3:", s.check(), s.model())

# Output:
# DPLL: SAT [1, -2, 3]
# stats: {'decisions': 1, 'propagations': 2}
# PHP(3,2): UNSAT {'decisions': 1, 'propagations': 9}
# Z3: sat [x1 = False, x2 = True, x3 = False]`,
    notes: [
      "DPLL and Z3 return different models. Both are correct; a formula can have many models and solvers make no promise about which one you get.",
      "This solver copies the clause list at every step. Real solvers never copy: they keep a trail of assigned literals and undo by popping it, and use watched literals so propagation does not scan every clause.",
      "Turning this into CDCL means: store a reason clause per implied literal, on conflict resolve back to the 1-UIP, add the learned clause, and return to the asserting level instead of the previous frame."
    ]
  },
  lab: {
    title: "Graph coloring to CNF, solved by your own DPLL",
    prompt: "Implement <code>unit_propagate(clauses)</code> that repeatedly assigns unit clauses and returns <code>(clauses, assigned)</code>, or <code>None</code> on an empty clause. Use it inside <code>dpll</code>. Then write <code>coloring_cnf(n_nodes, edges, k)</code> producing DIMACS-style clauses: each node gets at least one color, at most one color, and adjacent nodes differ. Show that a triangle is not 2-colorable but is 3-colorable, and print the 2-color instance in DIMACS format.",
    starter: `def simplify(clauses, lit):
    return [[l for l in c if l != -lit] for c in clauses if lit not in c]

def unit_propagate(clauses):
    # TODO: loop: conflict if an empty clause exists, stop if no unit clause
    pass

def dpll(clauses, assignment=()):
    # TODO: propagate, then branch on a literal
    pass

def coloring_cnf(n_nodes, edges, k):
    v = lambda node, col: node * k + col + 1
    # TODO: at-least-one, at-most-one, neighbors differ
    pass

triangle = [(0, 1), (1, 2), (0, 2)]
`,
    checks: [
      { re: 'def\\s+unit_propagate\\s*\\(\\s*clauses\\s*\\)', flags: '', must: true, hint: 'Define unit_propagate(clauses)', pass: 'unit_propagate defined' },
      { re: 'len\\s*\\(\\s*c\\s*\\)\\s*==\\s*0', flags: '', must: true, hint: 'Detect a conflict: some clause with len(c) == 0', pass: 'Empty-clause conflict detected' },
      { re: 'len\\s*\\(\\s*c\\s*\\)\\s*==\\s*1', flags: '', must: true, hint: 'Find unit clauses: len(c) == 1', pass: 'Unit clauses found' },
      { re: 'for\\s+choice\\s+in\\s*\\(\\s*lit\\s*,\\s*-\\s*lit\\s*\\)', flags: '', must: true, hint: 'Branch on both polarities: for choice in (lit, -lit)', pass: 'Branches on both polarities' },
      { re: '\\[\\s*-\\s*v\\s*\\(\\s*a\\s*,\\s*c\\s*\\)\\s*,\\s*-\\s*v\\s*\\(\\s*b\\s*,\\s*c\\s*\\)\\s*\\]', flags: '', must: true, hint: 'Adjacent nodes a, b cannot share color c: [-v(a, c), -v(b, c)]', pass: 'Edge constraint encoded' },
      { re: 'c1\\s*\\+\\s*1', flags: '', must: true, hint: 'At-most-one: pairs c1 < c2, e.g. for c2 in range(c1 + 1, k)', pass: 'At-most-one via pairwise clauses' },
      { re: 'p cnf', flags: '', must: true, hint: 'Emit a DIMACS header: p cnf <vars> <clauses>', pass: 'DIMACS header emitted' },
      { re: '^\\s*pass\\s*$', flags: 'm', must: false, hint: 'Replace every pass placeholder', pass: 'No placeholders left' }
    ],
    run: "Save as <code>coloring_sat.py</code> and run <code>python3 coloring_sat.py</code>. Expect <code>k=2: UNSAT</code> and <code>k=3: SAT {0: 0, 1: 1, 2: 2}</code>. Then cross-check with a real solver: <code>python3 coloring_sat.py | tail -n +3 &gt; tri.cnf &amp;&amp; z3 -dimacs tri.cnf</code> prints <code>s UNSATISFIABLE</code>. (The <code>z3</code> binary comes with <code>pip install --user z3-solver</code>, in <code>~/.local/bin</code>.)",
    solution: `# coloring_sat.py -- graph coloring -> CNF -> your own DPLL
def simplify(clauses, lit):
    return [[l for l in c if l != -lit] for c in clauses if lit not in c]

def unit_propagate(clauses):
    """Assign unit clauses to a fixpoint. Return (clauses, assigned) or None."""
    assigned = []
    while True:
        if any(len(c) == 0 for c in clauses):
            return None
        units = [c[0] for c in clauses if len(c) == 1]
        if not units:
            return clauses, assigned
        lit = units[0]
        assigned.append(lit)
        clauses = simplify(clauses, lit)

def dpll(clauses, assignment=()):
    res = unit_propagate(clauses)
    if res is None:
        return None
    clauses, forced = res
    assignment = tuple(assignment) + tuple(forced)
    if not clauses:
        return assignment
    lit = clauses[0][0]
    for choice in (lit, -lit):
        result = dpll(simplify(clauses, choice), assignment + (choice,))
        if result is not None:
            return result
    return None

def coloring_cnf(n_nodes, edges, k):
    v = lambda node, col: node * k + col + 1      # DIMACS vars start at 1
    cnf = [[v(n, c) for c in range(k)] for n in range(n_nodes)]
    cnf += [[-v(n, c1), -v(n, c2)] for n in range(n_nodes)
            for c1 in range(k) for c2 in range(c1 + 1, k)]
    cnf += [[-v(a, c), -v(b, c)] for (a, b) in edges for c in range(k)]
    return cnf

def to_dimacs(cnf, n_vars):
    lines = ["p cnf %d %d" % (n_vars, len(cnf))]
    lines += [" ".join(map(str, c)) + " 0" for c in cnf]
    return "\\n".join(lines)

triangle = [(0, 1), (1, 2), (0, 2)]
for k in (2, 3):
    model = dpll(coloring_cnf(3, triangle, k))
    if model is None:
        print("k=%d: UNSAT" % k)
    else:
        colors = {(l - 1) // k: (l - 1) % k for l in model if l > 0}
        print("k=%d: SAT" % k, colors)

print(to_dimacs(coloring_cnf(3, triangle, 2), 6))
`,
    notes: [
      "Variable v(node, col) = node*k + col + 1 is the standard trick for flattening a 2D index into DIMACS's 1-based integers. Off-by-one here is the most common encoding bug: variable 0 would be read as the clause terminator.",
      "At-most-one is quadratic in k here. For large k, use a sequential counter encoding, or hand Z3 the high-level <code>AtMost</code> constraint.",
      "The triangle with k=2 is a pigeonhole instance in disguise (3 pigeons, 2 holes), which is why it is UNSAT."
    ]
  },
  quiz: [
    {
      q: "Tseitin's transformation produces a CNF that is ...",
      options: ["Equivalent and exponential in size", "Equisatisfiable and linear in size", "Equivalent and linear in size", "Equisatisfiable and exponential in size"],
      correct: 1,
      explain: "Fresh variables per subformula give a constant number of clauses per gate, so linear size, at the cost of equivalence (only equisatisfiability)."
    },
    {
      q: "During unit propagation, clause (x1 ∨ ¬x2 ∨ x3) has x1 = false and x2 = true. What happens?",
      options: ["Conflict", "x3 is forced true", "x3 is forced false", "Nothing until x3 is decided"],
      correct: 1,
      explain: "Two literals are false, so the clause is unit and x3 must be true."
    },
    {
      q: "What is the first unique implication point (1-UIP)?",
      options: ["The first decision made in the search", "The literal at the current decision level, closest to the conflict, that lies on every path from the current decision to the conflict", "The variable with the highest VSIDS score", "The first clause learned after a restart"],
      correct: 1,
      explain: "It is a dominator in the implication graph at the current level. Stopping resolution there yields a clause with exactly one current-level literal, which becomes unit after backjumping."
    },
    {
      q: "A learned clause contains literals assigned at levels 7, 3 and 3 (UIP at level 7) and one at level 5. Where does CDCL backjump to?",
      options: ["Level 6", "Level 5", "Level 3", "Level 0"],
      correct: 1,
      explain: "The asserting level is the second-highest level in the clause: 5. There every literal except the UIP is false, so the clause propagates."
    },
    {
      q: "Why are pigeonhole formulas hard for every CDCL solver?",
      options: ["They have too many variables for VSIDS", "Resolution proofs of PHP(n+1, n) need exponential size, and CDCL is a resolution engine", "They are satisfiable but have only one model", "Tseitin cannot encode them"],
      correct: 1,
      explain: "Haken (1985) proved an exponential lower bound for resolution on pigeonhole. CDCL's learned clauses are resolution steps, so it inherits the bound."
    }
  ],
  testFlow: {
    title: "Test yourself: trace the solver",
    start: 'q1',
    nodes: {
      q1: {
        q: "Clauses: (a), (¬a ∨ b), (¬b ∨ c), (¬c ∨ ¬a). What does unit propagation alone conclude?",
        choices: [
          { text: "Conflict: UNSAT without any decision", to: 'q1_right' },
          { text: "SAT with a, b, c true", to: 'q1_wrong' },
          { text: "It needs a decision on b", to: 'q1_wrong2' }
        ]
      },
      q1_right: { end: true, correct: true, text: "a forces b, b forces c, and then (¬c ∨ ¬a) has both literals false. Conflict at level 0 means UNSAT.", next: 'q2' },
      q1_wrong: { end: true, correct: false, text: "Check the last clause: with a and c both true, (¬c ∨ ¬a) is false.", retry: 'q1' },
      q1_wrong2: { end: true, correct: false, text: "(a) is a unit clause, and each following clause becomes unit in turn. No decision is ever needed.", retry: 'q1' },
      q2: {
        q: "Your SAT encoding of a scheduling problem is slow. Which change is most likely to help the solver?",
        choices: [
          { text: "Add redundant clauses that propagate more (e.g. symmetry-breaking or implied constraints)", to: 'q2_right' },
          { text: "Convert to CNF by distribution instead of Tseitin to avoid auxiliary variables", to: 'q2_wrong' }
        ]
      },
      q2_right: { end: true, correct: true, text: "Yes. Encodings that let unit propagation infer more (arc-consistent cardinality encodings, symmetry breaking) often matter more than solver choice." },
      q2_wrong: { end: true, correct: false, text: "Distribution can blow up exponentially. Auxiliary variables are cheap for CDCL; clause count explosion is not.", retry: 'q2' }
    }
  },
  pitfalls: [
    "Using variable 0 in DIMACS. Variables are 1-based; 0 terminates the clause.",
    "Confusing equisatisfiable with equivalent: counting or enumerating models of a Tseitin CNF without projecting to the original variables.",
    "Saying CDCL 'backtracks to the previous level'. It backjumps to the asserting level, often several levels back.",
    "Claiming the learned clause is new information. It is implied by the original clauses (derived by resolution); it only makes that information available to propagation.",
    "Quadratic at-most-one encodings on hundreds of variables, then blaming the solver for being slow."
  ],
  interview: [
    {
      q: "Walk me through how a CDCL solver works.",
      a: "It maintains a trail of assignments with decision levels. Loop: pick a variable by VSIDS and assign it (decision); run unit propagation with watched literals, recording for each implied literal the clause that forced it. If everything is assigned, return SAT. On a conflict, do conflict analysis: resolve the falsified clause with reason clauses until only one literal from the current level remains (1-UIP); add that learned clause, bump activities, backjump to the second-highest level in the clause where it becomes unit, and continue. A conflict at level 0 means UNSAT. Around that loop: restarts, phase saving, and periodic deletion of learned clauses with high LBD."
    },
    {
      q: "Why use Tseitin instead of converting to CNF by distribution? What do you give up?",
      a: "Distribution is exponential in the worst case, e.g. a disjunction of n conjunctions gives 2^n clauses. Tseitin adds one fresh variable per gate and three clauses per binary gate, so it is linear. You give up logical equivalence, keeping only equisatisfiability, which matters if you count models or need the CNF to be equivalent for some downstream use. In practice solvers handle the extra variables fine because they are functionally determined and propagate immediately."
    },
    {
      q: "Explain a tradeoff: learning more clauses vs keeping the clause database small.",
      a: "Every learned clause prunes future search, but it also costs memory and, more importantly, propagation time, since BCP has to watch it. Solvers learn one clause per conflict (tens of thousands per second), so the database must be reduced. Glucose ranks clauses by LBD, the number of distinct decision levels: low-LBD glue clauses connect few blocks of the search and are kept permanently; high-LBD clauses are deleted periodically. Kissat uses tiers (core, tier2, tier3) based on LBD and recent use."
    },
    {
      q: "What are watched literals and why do they matter?",
      a: "Each clause watches two of its literals that are not false. A clause can only become unit or conflicting when one of its watched literals becomes false, so on assigning x we only visit clauses watching the negation of x. For each, we try to find a new non-false literal to watch; if none, the clause is unit (propagate the other watch) or conflicting. Backtracking needs no updates, because watches stay valid when literals become unassigned. This made propagation, which dominates runtime, much faster (Chaff 2001)."
    },
    {
      q: "Whiteboard: encode Sudoku as SAT. How many variables, and what clause types?",
      a: "Variables x(r,c,v) for 9x9 cells and 9 values: 729. Clauses: each cell has at least one value (81 clauses of 9 literals); each cell has at most one value (pairwise: 81 x 36); each value appears at most once per row, column and 3x3 box (pairwise, 27 units x 9 values x 36 pairs), optionally also at least once per unit for stronger propagation; plus unit clauses for the givens. Unit propagation alone solves easy puzzles; CDCL solves the hardest ones in milliseconds. Variable numbering 81*r + 9*c + v + 1 keeps DIMACS 1-based."
    },
    {
      q: "How would you trust a SAT solver's UNSAT answer in a safety-critical pipeline?",
      a: "Ask the solver for a DRAT or LRAT proof and check it with an independent checker (drat-trim, or a verified checker such as cake_lpr in CakeML). The proof lists learned clauses in order, each checkable by reverse unit propagation, ending in the empty clause. SAT answers are trivially checkable by evaluating the model. Running two different solvers is a weaker but cheap complement."
    },
    {
      q: "What happens with restarts, and why would throwing away the search tree help?",
      a: "A restart unassigns everything back to level 0 while keeping learned clauses, VSIDS scores and saved phases. Runtimes of backtracking search are heavy-tailed: an early bad decision can trap the solver in a hopeless subtree. Restarting lets the improved heuristics reorder the top decisions, and phase saving means satisfying partial assignments are mostly reconstructed. Schedules are Luby-based or dynamic, based on recent LBD, as in Glucose."
    }
  ]
};
