window.LESSONS = window.LESSONS || {};
window.LESSONS['smt-theories'] = {
  id: 'smt-theories',
  title: 'From SAT to SMT: Theories, DPLL(T) & Decidability',
  category: 'Part 1 — SMT Solvers & Z3',
  timeMin: 40,
  summary: "Programs are not Boolean: they have integers, bit-vectors, arrays, strings and function calls. Satisfiability Modulo Theories (SMT) keeps the CDCL engine from the last lesson and plugs in theory solvers that understand those domains. This lesson explains the architecture (lazy DPLL(T): a SAT solver over a Boolean skeleton plus theory solvers that explain conflicts), the main theories and how each is decided (congruence closure, simplex, branch-and-bound, bit-blasting, read-over-write), how theories are combined (Nelson-Oppen), SMT-LIB2 syntax you can type into any solver, and why quantifiers make things hard (E-matching triggers, MBQI, decidable fragments). You run a working toy DPLL(T) loop built on Z3.",
  goals: [
    "Explain lazy DPLL(T): Boolean abstraction, theory consistency checks, theory explanations as learned clauses, and theory propagation",
    "Name the core SMT theories (EUF, LIA, LRA, BV, arrays, strings), their SMT-LIB logic names, and the decision procedure behind each",
    "Write and run SMT-LIB2 scripts with declare-const, declare-fun, assert, check-sat, get-model, push/pop and named assertions for unsat cores",
    "Explain Nelson-Oppen combination: purification, equality propagation, and the convexity and stable-infiniteness conditions",
    "Explain how solvers handle quantifiers (E-matching with triggers, MBQI) and why matching loops cause timeouts",
    "Say which fragments are decidable and what complexity to expect"
  ],
  concept: [
    {
      h: "What SMT adds to SAT",
      p: [
        "An SMT formula is a Boolean combination of <b>atoms from background theories</b>: <code>(x + y &gt; 10) ∧ (f(a) = b ∨ select(m, i) = 0)</code>. Satisfiable modulo a theory T means satisfiable by an assignment that also respects T's axioms (integers add like integers, <code>f(a) = f(b)</code> whenever <code>a = b</code>, and so on).",
        "The SMT-LIB standard (smtlib.cs.uiowa.edu) fixes the input language and names <b>logics</b> by their ingredients: <code>QF_</code> = quantifier-free, <code>UF</code> = uninterpreted functions, <code>LIA</code>/<code>LRA</code> = linear integer/real arithmetic, <code>NIA</code>/<code>NRA</code> = nonlinear, <code>BV</code> = bit-vectors, <code>A</code> or <code>AX</code> = arrays, <code>S</code> = strings, <code>FP</code> = IEEE floating point. So <code>QF_AUFBV</code> is quantifier-free arrays + uninterpreted functions + bit-vectors, which is what symbolic executors like KLEE generate.",
        "Main solvers: Z3 (Microsoft Research), cvc5 (Stanford/Iowa), Yices 2 (SRI), Bitwuzla (bit-vectors and FP), MathSAT. They compete yearly in SMT-COMP."
      ]
    },
    {
      h: "Lazy DPLL(T): CDCL on the outside, theory solvers on the inside",
      p: [
        "Replace each theory atom with a fresh Boolean variable (the <b>Boolean abstraction</b> or skeleton). Run CDCL on the skeleton. Each time the SAT solver produces a (partial) assignment, hand the corresponding conjunction of theory literals to the theory solver T-solver:",
        "<ul><li><b>T-consistent</b>: keep going; if the assignment is total, the formula is SAT and the T-solver supplies values for x, y, ...</li><li><b>T-inconsistent</b>: the T-solver returns an <b>explanation</b>, a small subset of the literals that is already contradictory (a theory conflict). Its negation is a valid clause and is learned like any CDCL clause, then the solver backjumps.</li><li><b>Theory propagation</b>: the T-solver can also say \"given x &lt; 3 and y &lt; 5, the atom x + y &gt; 10 must be false\" and push that implied literal to the SAT solver early, with the explanation as its reason clause.</li></ul>",
        "This is DPLL(T) (Nieuwenhuis, Oliveras, Tinelli, JACM 2006). Its requirements on a theory solver: incremental (assert literals one by one), backtrackable (pop cheaply), able to produce small explanations, and ideally able to propagate. The alternative, <b>eager</b> SMT, translates everything to SAT up front; bit-blasting bit-vectors is the surviving eager technique.",
        "The code example below implements the lazy loop literally: Z3 as a pure SAT solver over p1..p4, and a second Z3 instance as the linear-real-arithmetic checker whose unsat core becomes the blocking clause."
      ]
    },
    {
      h: "The theories and how each is decided",
      p: [
        "<table><tr><th>Theory</th><th>Example atoms</th><th>Decision procedure (quantifier-free)</th><th>Complexity</th></tr><tr><td>EUF (equality + uninterpreted functions)</td><td>f(a) = b, g(x, y) ≠ g(y, x)</td><td>Congruence closure over union-find (Nelson-Oppen 1980; Downey-Sethi-Tarjan): if a = b then f(a) = f(b)</td><td>O(n log n)</td></tr><tr><td>LRA (linear real arithmetic)</td><td>2x - 3y ≤ 7</td><td>General simplex, incremental, with bound propagation (Dutertre and de Moura 2006); Farkas lemma gives explanations</td><td>Polynomial (simplex is exponential worst-case, fast in practice)</td></tr><tr><td>LIA (linear integer arithmetic)</td><td>x + 2y = 7, x ≥ 0</td><td>Simplex relaxation + branch-and-bound + cutting planes (Gomory), GCD tests</td><td>NP-complete</td></tr><tr><td>BV (fixed-width bit-vectors)</td><td>bvadd x #x01, bvult</td><td>Word-level rewriting, then bit-blasting to SAT (circuits for adders, multipliers)</td><td>NP-complete for fixed widths (harder with symbolic widths/exponential encodings)</td></tr><tr><td>Arrays (McCarthy)</td><td>select(store(m, i, v), j)</td><td>Read-over-write axioms + extensionality, instantiated lazily</td><td>NP-complete</td></tr><tr><td>Strings</td><td>str.len s = 5, str.in_re s R</td><td>Word equations + length abstraction + regex derivatives (Z3seq, cvc5)</td><td>Decidability of the full theory with length is open; solvers are incomplete</td></tr><tr><td>NRA / NIA</td><td>x*y &gt; 3</td><td>NRA: cylindrical algebraic decomposition (nlsat), incremental linearization; NIA: incomplete heuristics</td><td>NRA decidable (doubly exponential); NIA undecidable</td></tr></table>",
        "The array axioms are worth memorizing because symbolic execution leans on them: <code>select(store(a, i, v), i) = v</code>, and <code>i ≠ j ⇒ select(store(a, i, v), j) = select(a, j)</code>, plus extensionality <code>(∀k. select(a, k) = select(b, k)) ⇒ a = b</code>."
      ]
    },
    {
      h: "SMT-LIB2 in five minutes",
      p: [
        "S-expressions, prefix operators. <code>declare-const</code> introduces a constant (a 0-ary function), <code>declare-fun</code> an uninterpreted function, <code>define-fun</code> a macro. <code>assert</code> adds a formula, <code>check-sat</code> answers sat / unsat / unknown, <code>get-model</code> or <code>get-value</code> reads the model after sat. <code>push</code>/<code>pop</code> open and close assertion scopes, which is how verifiers ask many related queries incrementally. Name assertions with <code>(! F :named n)</code> and call <code>get-unsat-core</code> after unsat. Every snippet below was run with <code>z3 theories.smt2</code>."
      ],
      code: `; theories.smt2 -- run with: z3 theories.smt2   (cvc5 theories.smt2 also works)
(set-option :produce-unsat-cores true)
(set-logic ALL)

; EUF + LIA: congruence closure meets arithmetic
(push 1)
(declare-fun f (Int) Int)
(declare-const a Int)
(declare-const b Int)
(assert (= a (+ b 1)))
(assert (= (f (- a 1)) 7))
(assert (not (= (f b) 7)))
(check-sat)                ; unsat: a - 1 = b, so f(a - 1) = f(b)
(pop 1)

; Arrays: read-over-write at a different index
(push 1)
(declare-const m (Array Int Int))
(declare-const i Int)
(declare-const j Int)
(assert (not (= i j)))
(assert (not (= (select (store m i 42) j) (select m j))))
(check-sat)                ; unsat
(pop 1)

; Bit-vectors: 8-bit unsigned wrap-around
(push 1)
(declare-const x (_ BitVec 8))
(assert (bvugt x #x00))
(assert (bvult (bvadd x #x01) x))
(check-sat)                ; sat
(get-model)                ; x = #xff, because #xff + 1 wraps to #x00
(pop 1)

; Strings and regular expressions
(push 1)
(declare-const s String)
(assert (= (str.len s) 5))
(assert (str.prefixof "ab" s))
(assert (str.in_re s (re.+ (re.range "a" "c"))))
(assert (str.contains s "ca"))
(check-sat)                ; sat
(get-value (s))            ; ((s "abcab"))
(pop 1)

; Named assertions and an unsat core
(push 1)
(declare-const p Int)
(declare-const q Int)
(assert (! (> p 10) :named p_big))
(assert (! (< q 0) :named q_neg))
(assert (! (= p q) :named same))
(assert (! (> q -100) :named q_floor))
(check-sat)                ; unsat
(get-unsat-core)           ; (p_big same q_neg)  -- q_floor is not needed
(pop 1)`
    },
    {
      h: "Combining theories: Nelson-Oppen",
      p: [
        "Real queries mix theories: <code>f(x) ≠ f(y) ∧ x ≤ y ∧ y ≤ x</code> uses EUF and LIA. Nelson-Oppen (1979) combines decision procedures for theories with disjoint signatures:",
        "<ol><li><b>Purify</b>: introduce fresh variables so every literal belongs to one theory. Here the atoms already split: EUF gets <code>f(x) ≠ f(y)</code>, LIA gets <code>x ≤ y, y ≤ x</code>.</li><li><b>Propagate equalities</b> between shared variables: LIA derives <code>x = y</code> and tells EUF.</li><li>EUF, with <code>x = y</code>, derives <code>f(x) = f(y)</code>: conflict. UNSAT.</li></ol>",
        "Conditions: both theories must be <b>stably infinite</b> (every satisfiable formula has an infinite model; bit-vectors and finite datatypes are not, so they need other methods), and for the simple deterministic version, <b>convex</b> (if a conjunction implies a disjunction of equalities it implies one of them). LIA is not convex: <code>1 ≤ x ≤ 2 ∧ y = 1 ∧ z = 2</code> implies <code>x = y ∨ x = z</code> but neither alone, so the combination must case-split on equalities. Z3 uses <b>model-based theory combination</b> (de Moura and Bjørner 2008): guess equalities from the current candidate models and only fix them when they conflict."
      ]
    },
    {
      h: "Quantifiers: triggers, MBQI and the edge of decidability",
      p: [
        "With <code>∀</code> in the formula, first-order logic is only semi-decidable, so solvers instantiate quantifiers with ground terms and hope to reach a contradiction.",
        "<ul><li><b>E-matching</b> (Simplify, Detlefs, Nelson, Saxe 2005): each quantifier has <b>triggers</b> (patterns), e.g. <code>(f x)</code>. Whenever a ground term matching the pattern appears in the current congruence-closure graph, instantiate the body with it. Fast and predictable; Dafny, F* and Boogie depend on it. A badly chosen trigger causes a <b>matching loop</b>: <code>∀x. f(x) &gt; f(x + 1)</code> with trigger <code>f(x)</code> instantiates on f(a), creating f(a+1), which matches again, forever.</li><li><b>MBQI</b> (model-based quantifier instantiation, Ge and de Moura, CAV 2009): build a candidate model for the ground part, check whether the quantifier holds in it (a ground query), and if not, instantiate with the counterexample. Can prove SAT, which E-matching alone cannot.</li><li><b>Others</b>: conflict-based instantiation and enumerative instantiation (cvc5), quantifier elimination for linear arithmetic.</li></ul>",
        "Decidable quantified fragments include Presburger arithmetic, linear real arithmetic with quantifiers, EPR (∃*∀* with no function symbols), and the array property fragment (Bradley, Manna, Sipma 2006). Outside those, <code>unknown</code> is a legitimate answer."
      ],
      code: `; trigger-driven instantiation works ...
(declare-fun f (Int) Int)
(declare-fun g (Int) Int)
(declare-const a Int)
(assert (forall ((x Int)) (! (= (g (f x)) x) :pattern ((f x)))))   ; f is injective via g
(assert (= (f a) (f 5)))
(assert (not (= a 5)))
(check-sat)       ; unsat: instantiate at x := a and x := 5

; ... but this trigger feeds itself: a matching loop
(reset)
(declare-const a Int)
(declare-fun h (Int) Int)
(assert (forall ((x Int)) (! (> (h x) (h (+ x 1))) :pattern ((h x)))))
(assert (= (h a) 0))
(check-sat)       ; z3 -T:10: unknown (with smt.mbqi=false: timeout)`
    }
  ],
  deepDive: {
    timeMin: 14,
    intro: "The details that separate 'I have used Z3' from 'I know how an SMT solver works': theory solver internals, explanations, and the engineering choices behind real solvers.",
    sections: [
      {
        h: "Congruence closure in one paragraph",
        p: [
          "Represent all terms as a DAG. Maintain a union-find over nodes. On asserting <code>a = b</code>, merge their classes; then for every pair of parent terms <code>f(u)</code>, <code>f(v)</code> whose arguments are now pairwise in the same class, merge those too, repeating to a fixpoint (congruence). A disequality <code>s ≠ t</code> conflicts when s and t end up in the same class. Explanations come from a proof forest that records why each merge happened, so the solver can return the minimal set of input equalities behind <code>s = t</code> (Nieuwenhuis and Oliveras 2005). This same structure is the e-graph that E-matching searches, and that egg-style equality saturation reuses for compiler optimization."
        ]
      },
      {
        h: "Simplex as a theory solver",
        p: [
          "Dutertre and de Moura's variant rewrites every constraint as a bound on a slack variable (<code>s = 2x - 3y, s ≤ 7</code>), so asserting and retracting atoms only changes bounds, never the tableau. This makes it incremental and backtrackable: popping a scope restores old bounds and keeps the current basis. When a row cannot be fixed by pivoting, the row's variables and their bounds form a conflict, and the Farkas coefficients certify it. For integers, branch-and-bound adds splits <code>x ≤ ⌊v⌋ ∨ x ≥ ⌈v⌉</code> as new Boolean atoms, so the SAT engine manages the branching."
        ]
      },
      {
        h: "Bit-vectors: rewrite first, blast later",
        p: [
          "Bit-blasting a 64-bit multiplier yields thousands of clauses, so solvers first simplify at word level (constant propagation, normalization, slicing, abstraction of unconstrained terms), and only then blast. Bitwuzla and Z3 also use lazy abstraction refinement for multiplication and division, and local search for some instances. This is why bit-vector queries from symbolic execution are often fast even though the theory is NP-complete: most of each query simplifies away."
        ]
      },
      {
        h: "Offline vs online, and the solver as a service",
        p: [
          "Online (incremental) use is the norm: Dafny, KLEE and CBMC issue thousands of related queries with <code>push</code>/<code>pop</code> or assumptions. Two engineering consequences: (1) learned clauses and theory lemmas survive across queries, which is a huge speedup, but (2) results can depend on query history and random seeds, which is the root of <b>proof brittleness</b> in Dafny/F* projects (a proof that passes today times out after an unrelated change). Mitigations: <code>smt.random_seed</code> sweeps, resource limits (<code>rlimit</code>) instead of wall-clock timeouts, and tools like Mariposa (Zhou et al., FMCAD 2023) that measure instability."
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: "Nami Plans the Route, the Specialists Check It",
      text: [
        "Nami draws possible routes as yes/no choices: through the strait or around it, stop at the island or not. That is the Boolean skeleton, and she is fast at it.",
        "But each route makes claims Nami cannot check herself. Franky checks the arithmetic (\"we have 10 barrels of cola, the strait route burns 12\"). Robin checks the history books (\"if two islands share a name, they share a ruler\": congruence). Usopp checks the cargo hold inventory (arrays: \"we put the treasure in slot 3; slot 5 is unchanged\").",
        "When Franky says a route is impossible, he does not just say no; he names the exact two claims that clash (\"strait plus no refuel stop\"). Nami writes that pair down as a rule and never proposes it again (the theory explanation becomes a learned clause).",
        "Sometimes Franky and Robin each see half of a problem: Franky deduces two islands are the same distance away, which means they are the same island; he shouts that equality to Robin, who then realizes their rulers must match, which contradicts her notes (Nelson-Oppen equality propagation)."
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: "The Roommate Agreement Committee",
      text: [
        "Leonard wants to know if there is any weekend plan that satisfies the Roommate Agreement. He lists options as yes/no: Comic-Con or not, Penny's party or not, Mom visiting or not.",
        "Each yes/no option comes with a claim checked by a specialist: Howard checks the budget arithmetic, Raj checks calendar times, Sheldon checks the Agreement clauses. When Howard says \"Comic-Con plus the party is over budget\", Leonard crosses out that combination and moves on.",
        "Then Sheldon adds a rule that applies to all future weekends forever. The committee has to keep generating specific weekends to test it against, and Penny notices they have been going for three hours because each weekend they test makes Sheldon think of a new one (a matching loop)."
      ]
    },
    why: "Nami and Leonard run the SAT solver over yes/no choices. Franky, Robin, Usopp, Howard and Raj are theory solvers for arithmetic, equality and arrays; their named clashing pairs are theory explanations turned into learned clauses. Franky shouting an equality to Robin is Nelson-Oppen, and Sheldon's forever-rule that spawns endless test weekends is a quantifier with a matching loop."
  },
  storyAnim: {
    h: 260,
    props: [
      { id: 'skeleton', emoji: '🗺️', label: 'Skeleton: p1 & p3 & (p2 | p4)', x: 50, y: 10 },
      { id: 'lra', emoji: '🔧', label: 'LRA solver', x: 85, y: 50 },
      { id: 'learned', emoji: '📜', label: 'Learned: none', x: 15, y: 82 },
      { id: 'answer', emoji: '❓', label: 'Answer?', x: 85, y: 85 }
    ],
    actors: [
      { id: 'nami', emoji: '🧭', label: 'Nami (SAT)', x: 15, y: 45 },
      { id: 'franky', emoji: '🤖', label: 'Franky (simplex)', x: 70, y: 40 }
    ],
    steps: [
      { c: "Atoms become Booleans: p1 = (x + y > 10), p2 = (x < 3), p3 = (y < 5), p4 = (x - y = 1). Nami only sees p1..p4.", p: { skeleton: 'lit' } },
      { c: "Nami's SAT model: p1, p2, p3 true, p4 false. She hands the literals to Franky.", a: { nami: [45, 45] } },
      { c: "Franky runs simplex: x + y > 10 with x < 3 and y < 5 is impossible. Theory conflict.", p: { lra: 'bad' } },
      { c: "He returns the explanation (the core): {p1, p2, p3}. Nami learns the clause (not p1 or not p2 or not p3).", l: { learned: 'Learned: !p1 | !p2 | !p3' }, p: { learned: 'good' }, a: { nami: [20, 50] } },
      { c: "New SAT model: p1, p3, p4 true, p2 false. Franky checks again.", a: { nami: [45, 45] }, p: { lra: 'lit' } },
      { c: "Consistent: x = 17/3, y = 14/3 satisfies all four literals. The formula is SAT and Franky supplies the model.", p: { lra: 'good', answer: 'good' }, l: { answer: 'sat: x=17/3, y=14/3' } }
    ]
  },
  conceptFlow: {
    title: "Lazy DPLL(T) with two theories",
    intro: "The SAT engine never sees arithmetic; the theory solvers never see disjunctions.",
    stages: [
      { label: 'Preprocess', nodes: [ { id: 'parse', text: 'SMT-LIB input\nsimplify, purify' }, { id: 'abs', text: 'Boolean abstraction\natom -> p_i' } ] },
      { label: 'SAT core', nodes: [ { id: 'cdcl', text: 'CDCL on skeleton\ndecide + propagate' } ] },
      { label: 'Theories', nodes: [ { id: 'euf', text: 'EUF\ncongruence closure' }, { id: 'arith', text: 'LIA/LRA\nsimplex + B&B' }, { id: 'no', text: 'Nelson-Oppen\nshare equalities' } ] },
      { label: 'Feedback', nodes: [ { id: 'tprop', text: 'Theory propagation\nimplied atoms' }, { id: 'expl', text: 'Explanation\n-> learned clause' } ] },
      { label: 'Result', nodes: [ { id: 'sat', text: 'sat + model' }, { id: 'unsat', text: 'unsat + core' } ] }
    ],
    steps: [
      { active: ['parse'], note: "Parse, rewrite, and purify so that every atom belongs to a single theory, introducing fresh variables for mixed terms." },
      { active: ['abs'], note: "Each distinct atom gets a Boolean variable. The formula becomes a pure propositional skeleton." },
      { active: ['cdcl'], note: "CDCL assigns the Boolean variables: decisions, unit propagation, exactly as in the SAT lesson." },
      { active: ['euf', 'arith'], note: "Each newly assigned atom is asserted to its theory solver, incrementally, so a conflict can be detected before the assignment is complete." },
      { active: ['no'], note: "Theories exchange equalities between shared variables until they agree or one finds a conflict." },
      { active: ['tprop'], note: "A theory can tell the SAT core that an unassigned atom is already implied, which saves decisions." },
      { active: ['expl'], note: "On a theory conflict, the solver returns a minimal set of literals that are jointly inconsistent; its negation is learned and the SAT core backjumps." },
      { active: ['sat'], note: "Full assignment, all theories consistent: combine the theory models into one model and answer sat." },
      { active: ['unsat'], note: "A conflict at level 0: unsat. Tracked assertions in the final conflict give the unsat core." }
    ]
  },
  tech: [
    {
      q: "Why do bit-vector problems sometimes take forever while huge LIA problems are instant?",
      a: "Nonlinear bit-vector operations (multiplication, division, remainder) bit-blast to large circuits whose CNF is hard for CDCL, especially when chained. Linear arithmetic over the reals is polynomial and simplex is very effective in practice. Practical fixes: keep widths as small as the semantics allows, avoid symbolic multipliers, and try Bitwuzla, which is tuned for BV and FP."
    },
    {
      q: "What does set-logic actually do?",
      a: "It tells the solver which theories and quantifier settings to expect, so it can pick a specialized strategy, for example a dedicated QF_BV tactic pipeline or a pure-LRA simplex configuration. Declaring a smaller logic than you use is an error in strict solvers; <code>ALL</code> is accepted by Z3 and cvc5 and selects the general engine. In Z3, the logic chooses the default tactic, which is why <code>(set-logic QF_BV)</code> can be dramatically faster than no logic."
    },
    {
      q: "What is the difference between get-model and get-value?",
      a: "<code>get-model</code> prints a definition for every declared symbol (and Z3 also lists named assertions as Boolean definitions). <code>get-value</code> evaluates the terms you list, including compound terms like <code>(+ a b)</code>, in the current model. Scripts that feed results back into other tools should use <code>get-value</code>."
    },
    {
      q: "Are uninterpreted functions useful outside of puzzles?",
      a: [
        "Yes. They are the standard way to abstract things you do not want to model precisely: a hash function, a complicated library call, floating-point operations in an equivalence check. EUF only assumes functional consistency (equal inputs give equal outputs), which is exactly what you need to prove two programs that call the same function in the same way are equivalent.",
        "Translation validation and hardware equivalence checking (Burch-Dill for pipelined processors) are built on this idea."
      ]
    }
  ],
  code: {
    title: "A working lazy DPLL(T) loop in 40 lines",
    intro: "One Z3 solver is used as a pure SAT solver over Booleans p1..p4. A second Z3 solver plays the linear-real-arithmetic theory solver: it checks the conjunction of literals the SAT model selected and, on conflict, returns an unsat core that becomes a blocking clause. This is exactly the offline variant of DPLL(T) (one theory check per full Boolean model); real solvers interleave the check with propagation.",
    code: `# lazy_smt.py -- run with: python3 lazy_smt.py
from z3 import Real, Bool, Or, Not, Solver, unsat, sat, is_true

x, y = Real("x"), Real("y")
# Theory atoms and their Boolean names (the abstraction)
atoms = {
    "p1": x + y > 10,
    "p2": x < 3,
    "p3": y < 5,
    "p4": x - y == 1,
}
P = {name: Bool(name) for name in atoms}

# Formula: p1 and p3 and (p2 or p4) -- the SAT solver sees only Booleans
sat_solver = Solver()
sat_solver.add(P["p1"], P["p3"], Or(P["p2"], P["p4"]))

def value(model, name):
    return is_true(model.eval(P[name], model_completion=True))

for rnd in range(1, 20):
    if sat_solver.check() == unsat:
        print("round", rnd, ": skeleton UNSAT -> formula UNSAT")
        break
    bm = sat_solver.model()
    shown = ", ".join(n if value(bm, n) else "!" + n for n in atoms)

    # Theory check: is the selected conjunction of literals LRA-consistent?
    th = Solver()
    th.set(unsat_core=True)
    for name, atom in atoms.items():
        th.assert_and_track(atom if value(bm, name) else Not(atom), Bool("t_" + name))
    if th.check() == sat:
        tm = th.model()
        print("round", rnd, ": [", shown, "] T-consistent -> SAT  x =", tm[x], " y =", tm[y])
        break

    # Theory conflict: block exactly the literals in the core
    core = [str(c)[2:] for c in th.unsat_core()]
    block = Or([Not(P[n]) if value(bm, n) else P[n] for n in core])
    print("round", rnd, ": [", shown, "] T-conflict, core", core, "-> learn", block)
    sat_solver.add(block)

# Output:
# round 1 : [ p1, p2, p3, !p4 ] T-conflict, core ['p1', 'p2', 'p3'] -> learn Or(Not(p1), Not(p2), Not(p3))
# round 2 : [ p1, !p2, p3, p4 ] T-consistent -> SAT  x = 17/3  y = 14/3`,
    notes: [
      "Blocking only the core, not the whole Boolean model, is what makes lazy SMT scale: one learned clause rules out every model that contains p1, p2 and p3, whatever p4 is.",
      "The first SAT model you get may differ between Z3 versions; the loop still terminates with the same verdict.",
      "Notice the answer is rational. Over Real, Z3 returns exact rationals from simplex, not floats."
    ]
  },
  lab: {
    title: "A one-machine schedule in raw SMT-LIB2, with an unsat core",
    prompt: "Write <code>schedule.smt2</code> in <code>QF_LIA</code>. Jobs A, B, C have integer start times <code>a</code>, <code>b</code>, <code>c</code> and durations 2, 3 and 1. All start at or after 0; no two jobs overlap on the single machine (each pair: one ends before the other starts); B starts after A finishes. Name every assertion. In one <code>push</code>/<code>pop</code> scope, add a deadline of 6 (every job ends by time 6), check sat, and print the start times. In a second scope, use a deadline of 5, check sat, and print the unsat core.",
    starter: `; schedule.smt2 -- run with: z3 schedule.smt2
(set-option :produce-unsat-cores true)
(set-logic QF_LIA)
(declare-const a Int)
; TODO: declare b and c

; TODO: named non-negativity, pairwise no-overlap, and a_before_b

(push 1)
; TODO: deadline 6, check-sat, print a b c
(pop 1)

(push 1)
; TODO: deadline 5, check-sat, get-unsat-core
(pop 1)
`,
    checks: [
      { re: '\\(set-logic\\s+QF_LIA\\)', flags: '', must: true, hint: 'Start with (set-logic QF_LIA)', pass: 'Logic is QF_LIA' },
      { re: '\\(declare-const\\s+b\\s+Int\\)[\\s\\S]*\\(declare-const\\s+c\\s+Int\\)', flags: '', must: true, hint: 'Declare b and c as Int with declare-const', pass: 'All three start times declared' },
      { re: '\\(or\\s+\\(<=\\s+\\(\\+\\s+a\\s+2\\)\\s+b\\)\\s+\\(<=\\s+\\(\\+\\s+b\\s+3\\)\\s+a\\)\\)', flags: '', must: true, hint: 'A and B do not overlap: (or (<= (+ a 2) b) (<= (+ b 3) a))', pass: 'A/B disjointness as a disjunction' },
      { re: '\\(or\\s+\\(<=\\s+\\(\\+\\s+b\\s+3\\)\\s+c\\)\\s+\\(<=\\s+\\(\\+\\s+c\\s+1\\)\\s+b\\)\\)', flags: '', must: true, hint: 'B and C do not overlap: (or (<= (+ b 3) c) (<= (+ c 1) b))', pass: 'B/C disjointness' },
      { re: ':named', flags: '', must: true, hint: 'Name assertions with (! F :named name) so the core is readable', pass: 'Assertions are named' },
      { re: '\\(check-sat\\)[\\s\\S]*\\(get-(value|model)[\\s\\S]*\\(check-sat\\)\\s*\\(get-unsat-core\\)', flags: '', must: true, hint: 'First scope: check-sat then get-value/get-model; second: check-sat then get-unsat-core', pass: 'Both queries present in order' },
      { re: '\\(push 1\\)[\\s\\S]*\\(pop 1\\)[\\s\\S]*\\(push 1\\)[\\s\\S]*\\(pop 1\\)', flags: '', must: true, hint: 'Use two push/pop scopes so the deadlines do not accumulate', pass: 'Two scopes' },
      { re: 'TODO', flags: '', must: false, hint: 'Remove the TODO lines once done', pass: 'No TODOs left' }
    ],
    run: "Install the solver binary with <code>pip install --user z3-solver</code> (it lands in <code>~/.local/bin/z3</code>), then <code>z3 schedule.smt2</code>. Expected: <code>sat</code>, <code>((a 0) (b 2) (c 5))</code> or another valid schedule, then <code>unsat</code> and a core such as <code>(nonneg ac_disjoint bc_disjoint a_before_b deadline5)</code>. Try <code>cvc5 --produce-models schedule.smt2</code> too if you have cvc5: the script is portable.",
    solution: `; schedule.smt2 -- run with: z3 schedule.smt2
(set-option :produce-unsat-cores true)
(set-logic QF_LIA)
(declare-const a Int)
(declare-const b Int)
(declare-const c Int)
; durations: A = 2, B = 3, C = 1, all start at or after 0
(assert (! (and (>= a 0) (>= b 0) (>= c 0)) :named nonneg))
; one machine: every pair of jobs must not overlap
(assert (! (or (<= (+ a 2) b) (<= (+ b 3) a)) :named ab_disjoint))
(assert (! (or (<= (+ a 2) c) (<= (+ c 1) a)) :named ac_disjoint))
(assert (! (or (<= (+ b 3) c) (<= (+ c 1) b)) :named bc_disjoint))
; B must start after A finishes
(assert (! (<= (+ a 2) b) :named a_before_b))

(push 1)
(assert (! (and (<= (+ a 2) 6) (<= (+ b 3) 6) (<= (+ c 1) 6)) :named deadline6))
(check-sat)
(get-value (a b c))
(pop 1)

(push 1)
(assert (! (and (<= (+ a 2) 5) (<= (+ b 3) 5) (<= (+ c 1) 5)) :named deadline5))
(check-sat)
(get-unsat-core)
(pop 1)

; z3 output:
; sat
; ((a 0)
;  (b 2)
;  (c 5))
; unsat
; (nonneg ac_disjoint bc_disjoint a_before_b deadline5)
`,
    notes: [
      "The total work is 2 + 3 + 1 = 6 time units on one machine, so a deadline of 5 is impossible. The core explains why using only the constraints that matter; ab_disjoint is absent because a_before_b already implies it.",
      "Unsat cores are not guaranteed minimal. Z3 can minimize them with <code>(set-option :smt.core.minimize true)</code>.",
      "The disjunctions are where DPLL(T) earns its keep: the SAT core picks one side of each <code>or</code>, the LIA solver checks the resulting conjunction of linear constraints."
    ]
  },
  quiz: [
    {
      q: "In lazy DPLL(T), what does the theory solver return when the current assignment is inconsistent?",
      options: ["A new Boolean model", "An explanation: a subset of literals that is already inconsistent, whose negation is learned", "The full list of assigned literals", "A quantifier instantiation"],
      correct: 1,
      explain: "Small explanations become short learned clauses that prune many future Boolean models, exactly like CDCL conflict clauses."
    },
    {
      q: "Which procedure decides quantifier-free EUF?",
      options: ["Simplex", "Bit-blasting", "Congruence closure over union-find", "Cylindrical algebraic decomposition"],
      correct: 2,
      explain: "Merge equal terms, and merge f(u), f(v) whenever their arguments are merged; a disequality inside a class is a conflict."
    },
    {
      q: "Why is linear integer arithmetic 'non-convex' a problem for Nelson-Oppen?",
      options: ["It has no infinite models", "A conjunction can imply a disjunction of equalities without implying any single one, forcing case splits", "Simplex cannot run on integers", "It shares function symbols with EUF"],
      correct: 1,
      explain: "With 1 ≤ x ≤ 2, y = 1, z = 2 you know x = y or x = z, but neither alone. The combination procedure must branch."
    },
    {
      q: "Assertion: forall x. f(x) > f(x + 1), with trigger (f x), plus f(a) = 0. What typically happens with E-matching only?",
      options: ["unsat immediately", "sat with f(x) = -x", "A matching loop: each instance creates a new term that matches the trigger again", "A parse error"],
      correct: 2,
      explain: "f(a) triggers an instance mentioning f(a + 1), which triggers f(a + 2), and so on. E-matching alone cannot conclude sat."
    },
    {
      q: "Which SMT-LIB logic is the natural target for KLEE-style symbolic execution of C?",
      options: ["QF_LRA", "QF_ABV (arrays of bit-vectors)", "LIA with quantifiers", "QF_S"],
      correct: 1,
      explain: "Memory is an array from 32/64-bit addresses to 8-bit bytes, and machine arithmetic is bit-vector arithmetic. KLEE queries are QF_ABV."
    }
  ],
  testFlow: {
    title: "Test yourself: which theory, which answer?",
    start: 'q1',
    nodes: {
      q1: {
        q: "x and y are Int. Assert x > y, y > x - 1. What does an LIA solver answer?",
        choices: [
          { text: "unsat: x > y and y > x - 1 means x - 1 < y < x, and no integer fits", to: 'q1_right' },
          { text: "sat, e.g. y = x - 0.5", to: 'q1_wrong' }
        ]
      },
      q1_right: { end: true, correct: true, text: "Right. Over Real it would be sat (y = x - 0.5); over Int, branch-and-bound or a GCD/cut argument proves no integer lies strictly between x - 1 and x.", next: 'q2' },
      q1_wrong: { end: true, correct: false, text: "x - 0.5 is not an integer. The simplex relaxation finds that real solution, and branch-and-bound then refutes both branches.", retry: 'q1' },
      q2: {
        q: "Your Dafny proof started timing out after you added an innocent lemma with a forall. Most likely cause?",
        choices: [
          { text: "The new quantifier's trigger causes many instantiations or a matching loop", to: 'q2_right' },
          { text: "Z3 cannot handle more than a fixed number of lemmas", to: 'q2_wrong' }
        ]
      },
      q2_right: { end: true, correct: true, text: "Yes. Check the trigger Dafny chose (it prints warnings for matching loops), pick a more specific pattern with {:trigger}, or make the lemma explicit and call it only where needed." },
      q2_wrong: { end: true, correct: false, text: "There is no such hard limit. Quantifier instantiation is the usual source of SMT instability in verifiers.", retry: 'q2' }
    }
  },
  pitfalls: [
    "Using Real when the program uses integers: x > y and y > x - 1 is sat over reals and unsat over integers.",
    "Treating an unsat core as minimal. It is a subset that suffices, not necessarily the smallest one.",
    "Writing quantifiers without thinking about triggers, then debugging timeouts. Check instantiation counts with <code>z3 -st</code>.",
    "Forgetting that get-model after unsat, or after unknown, is an error or meaningless.",
    "Assuming theory combination is free: mixing nonlinear arithmetic with arrays and quantifiers is where solvers most often return unknown."
  ],
  interview: [
    {
      q: "Explain how an SMT solver like Z3 works at a high level.",
      a: "It is a CDCL SAT solver extended with theory solvers, the DPLL(T) architecture. The input is preprocessed and each theory atom is abstracted as a Boolean. The SAT core assigns those Booleans; each assignment is pushed incrementally to the relevant theory solver (congruence closure for EUF, simplex for arithmetic, bit-blasting for bit-vectors, axiom instantiation for arrays). A theory solver either accepts, propagates implied atoms back, or reports a conflict with an explanation that is learned as a clause. Theories cooperate by sharing equalities over shared variables (Nelson-Oppen, or model-based combination in Z3). Quantifiers are handled by instantiation: E-matching on triggers and MBQI."
    },
    {
      q: "What is the difference between eager and lazy SMT? Why did lazy win?",
      a: "Eager SMT translates the whole formula plus enough theory axioms into one SAT instance up front, e.g. bit-blasting, or encoding equalities with transitivity constraints. It is simple but the encoding can be huge, and it must include theory facts that are never needed. Lazy SMT lets the SAT solver propose Boolean models and asks the theory solver only about the literals actually assigned, learning theory lemmas on demand. That keeps instances small and lets each theory use its best algorithm. Eager survives for bit-vectors, where bit-blasting after word-level simplification is still the best approach."
    },
    {
      q: "Explain a tradeoff: E-matching vs MBQI for quantifiers.",
      a: "E-matching instantiates quantifiers only when ground terms match user-supplied or inferred triggers. It is fast, predictable and controllable, which is why Dafny, F* and Boogie use it, but it is incomplete, cannot prove sat, and bad triggers cause matching loops or missed instances. MBQI builds a candidate model and checks the quantifier against it, instantiating with counterexamples; it is complete for some fragments and can prove sat, but is slower and less predictable. Z3 runs both by default; verifiers often disable MBQI for stability."
    },
    {
      q: "Whiteboard: show Nelson-Oppen on f(x) ≠ f(y) ∧ x ≤ y ∧ y ≤ x.",
      a: "Purify: EUF owns f(x) ≠ f(y), LIA owns x ≤ y and y ≤ x; shared variables are x and y. LIA alone is satisfiable but entails x = y, so it propagates that equality. EUF receives x = y, congruence closure merges f(x) and f(y), contradicting the disequality: EUF reports a conflict with explanation {x = y, f(x) ≠ f(y)}, and with LIA's explanation for x = y {x ≤ y, y ≤ x}, the combined conflict is learned. Result: unsat. I would then mention the conditions: disjoint signatures, stably infinite theories, and the extra case-splitting needed for non-convex theories like LIA."
    },
    {
      q: "Which theories are decidable and what does that mean for tools built on them?",
      a: "Quantifier-free EUF, LRA, LIA, BV, arrays and their combinations are decidable (NP-complete in general, LRA polynomial). Presburger arithmetic with quantifiers is decidable, as is NRA via CAD. NIA is undecidable, and strings with length and replace-all are at or beyond the edge. General quantifiers with uninterpreted functions are semi-decidable. Tools that need predictable answers keep their queries quantifier-free and linear when possible (KLEE, CBMC), while auto-active verifiers accept quantifiers but manage them with triggers and give users ways to guide instantiation."
    },
    {
      q: "Why would you use uninterpreted functions to abstract part of a program?",
      a: "UF only assumes equal inputs give equal outputs. That is often all you need: to prove refactored code equivalent to the original, you can replace a complicated pure helper with an uninterpreted f in both versions, and the check stays decidable and fast. If the proof fails because it needs more facts about f, you add just those as axioms. It is a form of abstraction-refinement and the basis of translation validation and Burch-Dill processor verification."
    },
    {
      q: "A Z3 query returns unknown. What do you do?",
      a: "Ask why: <code>s.reason_unknown()</code> (Python) or <code>(get-info :reason-unknown)</code> tells you whether it was a timeout, incomplete quantifier handling, or nonlinear arithmetic. Then: remove or guard quantifiers, give triggers, bound the domain, linearize or use bit-vectors instead of nonlinear integers, select a specialized logic or tactic, try cvc5, or split the problem into cases. Never treat unknown as unsat in a verifier."
    }
  ]
};
