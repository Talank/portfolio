window.LESSONS = window.LESSONS || {};
window.LESSONS['hoare-logic-and-vcs'] = {
  id: 'hoare-logic-and-vcs',
  title: 'Hoare Logic, Weakest Preconditions, Loop Invariants & Verification Conditions',
  category: 'Part 2 — Verifying Programs',
  timeMin: 50,
  summary: "Hoare logic is the theory under Dafny, Why3, Frama-C WP, VeriFast, Viper and every 'auto-active' verifier: a program is correct when every triple {P} C {Q} in its proof is valid, and the proof obligations can be computed mechanically as verification conditions (VCs) and handed to an SMT solver. This lesson covers Hoare triples and partial vs total correctness, the proof rules, Dijkstra's weakest precondition calculus for assignment, sequence, if and while, how to find and debug loop invariants, variants for termination, and VC generation. You run a 60-line VC generator that verifies a summation loop and integer division with Z3, and watch it pinpoint exactly which VC a weak invariant breaks.",
  goals: [
    "Read and write Hoare triples, and distinguish partial correctness from total correctness",
    "Compute weakest preconditions for assignment (substitution), sequence, if and while (with an invariant) by hand",
    "Derive the three verification conditions of a loop: initiation, preservation (consecution) and exit (sufficiency), plus variant conditions for termination",
    "Find loop invariants by generalizing the postcondition, and diagnose a failing VC from the solver's counterexample",
    "Generate VCs automatically and discharge them with Z3 by checking that their negations are unsat",
    "Explain how Dafny/Boogie, Frama-C and Why3 use this pipeline, and where it gets hard (heap, frames, quantifiers)"
  ],
  concept: [
    {
      h: "Hoare triples: a contract between states",
      p: [
        "A Hoare triple <code>{P} C {Q}</code> (Hoare 1969, building on Floyd 1967) says: if C starts in a state satisfying the precondition P, and C terminates, then the final state satisfies the postcondition Q. That is <b>partial correctness</b>. <b>Total correctness</b>, written <code>[P] C [Q]</code>, additionally requires that C terminates from every state satisfying P.",
        "Examples: <code>{x = 5} x := x + 1 {x = 6}</code> is valid. <code>{true} while true do skip {false}</code> is valid as a partial-correctness triple (the loop never terminates, so the postcondition is never tested) and invalid as total correctness. <code>{x &gt; 0} y := 10 / x {y ≤ 10}</code> is valid over integers.",
        "Assertions P and Q are first-order formulas over program variables, often with <b>ghost</b> or logical variables to remember initial values: <code>{x = x0} x := x * 2 {x = 2 * x0}</code>. In Dafny, <code>requires</code> is P, <code>ensures</code> is Q, and <code>old(x)</code> plays the role of x0."
      ]
    },
    {
      h: "The proof rules",
      p: [
        "<table><tr><th>Rule</th><th>Statement</th></tr><tr><td>Assignment (backwards)</td><td><code>{Q[e/x]} x := e {Q}</code>: substitute e for x in the postcondition</td></tr><tr><td>Sequence</td><td>from <code>{P} C1 {R}</code> and <code>{R} C2 {Q}</code> infer <code>{P} C1; C2 {Q}</code></td></tr><tr><td>Conditional</td><td>from <code>{P ∧ b} C1 {Q}</code> and <code>{P ∧ ¬b} C2 {Q}</code> infer <code>{P} if b then C1 else C2 {Q}</code></td></tr><tr><td>While (partial)</td><td>from <code>{I ∧ b} C {I}</code> infer <code>{I} while b do C {I ∧ ¬b}</code></td></tr><tr><td>Consequence</td><td>if <code>P ⇒ P'</code>, <code>{P'} C {Q'}</code> and <code>Q' ⇒ Q</code>, then <code>{P} C {Q}</code></td></tr></table>",
        "The assignment rule looks backwards at first, and it has to be: <code>{x + 1 = 6} x := x + 1 {x = 6}</code>, i.e. <code>{x = 5}</code>. The forward version needs an existential for the old value (strongest postcondition: <code>sp(x := e, P) = ∃x0. P[x0/x] ∧ x = e[x0/x]</code>), which is why VC generators usually work backwards.",
        "The consequence rule is where logic enters: its side conditions are implications between assertions, exactly the formulas we give to Z3. The rules are sound (every derivable triple is valid) and relatively complete (Cook 1978): every valid triple is derivable, provided an oracle for the assertion logic, which is undecidable for arithmetic. Hence SMT."
      ]
    },
    {
      h: "Weakest preconditions: running the program backwards",
      p: [
        "Dijkstra's <code>wp(C, Q)</code> (1975) is the weakest predicate on initial states that guarantees C terminates in a state satisfying Q. Then <code>{P} C {Q}</code> holds (totally) iff <code>P ⇒ wp(C, Q)</code>. For loop-free code, wp is computed purely syntactically:",
        "<ul><li><code>wp(x := e, Q) = Q[e/x]</code></li><li><code>wp(C1; C2, Q) = wp(C1, wp(C2, Q))</code></li><li><code>wp(if b then C1 else C2, Q) = (b ⇒ wp(C1, Q)) ∧ (¬b ⇒ wp(C2, Q))</code></li><li><code>wp(assert p, Q) = p ∧ Q</code>, and <code>wp(assume p, Q) = p ⇒ Q</code> (Boogie's two primitives)</li></ul>",
        "Worked example. <code>C = (if x &lt; 0 then y := -x else y := x); y := y + 1</code>, <code>Q = (y &gt; 0)</code>. Backwards: <code>wp(y := y + 1, y &gt; 0) = y + 1 &gt; 0</code>. Then the if: <code>(x &lt; 0 ⇒ -x + 1 &gt; 0) ∧ (x ≥ 0 ⇒ x + 1 &gt; 0)</code>, which simplifies to <code>true</code>. So <code>{true} C {y &gt; 0}</code> is valid over Int. (Over 32-bit ints it is not: x = INT_MIN makes -x + 1 negative. Same lesson as before.)",
        "For a loop, the true wp is a fixpoint that cannot be computed in general (it would solve the halting problem). Verifiers instead ask the programmer for an invariant."
      ]
    },
    {
      h: "Loops: invariants and the three VCs",
      p: [
        "A <b>loop invariant</b> I is a predicate that holds before the loop and after every iteration. Given I, the loop <code>while b do C</code> with postcondition Q generates three obligations:",
        "<ol><li><b>Initiation</b>: the precondition (after the code before the loop) implies I. In wp form: the wp of the code before the loop, computed against I, is implied by P.</li><li><b>Preservation</b> (consecution): <code>I ∧ b ⇒ wp(C, I)</code>. One iteration from any state satisfying I and the guard re-establishes I.</li><li><b>Exit</b> (sufficiency): <code>I ∧ ¬b ⇒ Q</code>. When the loop stops, the invariant plus the negated guard give the postcondition.</li></ol>",
        "Crucially, preservation and exit are checked in <i>every</i> state satisfying I, not only reachable ones. Anything the proof needs about variables the loop does not change (y &gt; 0, an array's length, n ≥ 0) must be in I. Forgetting such a frame fact is the most common reason a correct program fails to verify, and it happens in the code example below.",
        "<b>Total correctness</b> adds a <b>variant</b> (ranking function) V: an integer expression with <code>I ∧ b ⇒ V ≥ 0</code> and <code>I ∧ b ∧ V = v0 ⇒ wp(C, V &lt; v0)</code>. Dafny's <code>decreases</code> clause is exactly V, and Dafny guesses it for simple loops."
      ],
      code: `{ n >= 0 }
i := 0; s := 0;
while i < n
  invariant 0 <= i <= n && 2*s == i*(i-1)      // I
  decreases n - i                              // V
{
  s := s + i;
  i := i + 1;
}
{ 2*s == n*(n-1) }

Initiation:   n >= 0  ==>  0 <= 0 <= n && 2*0 == 0*(0-1)
Preservation: I && i < n  ==>  0 <= i+1 <= n && 2*(s+i) == (i+1)*i
Exit:         I && !(i < n)  ==>  2*s == n*(n-1)        (needs i <= n to get i == n)
Variant:      I && i < n  ==>  n - i >= 0,   and n - (i+1) < n - i`
    },
    {
      h: "Finding invariants",
      p: [
        "Heuristics that work most of the time:",
        "<ul><li><b>Generalize the postcondition</b> by replacing a constant with the loop counter: post <code>2s = n(n-1)</code> becomes <code>2s = i(i-1)</code>; post <code>r = n·x</code> becomes <code>r = i·x</code>.</li><li><b>Add the bounds</b> of the counter: <code>0 ≤ i ≤ n</code>. The upper bound is what lets exit conclude i = n from ¬(i &lt; n).</li><li><b>Carry frame facts</b> about unchanged variables that preservation or the variant need (<code>y &gt; 0</code>, <code>a.Length == N</code>).</li><li><b>For arrays</b>, describe the processed prefix with a quantifier: <code>∀k. 0 ≤ k &lt; i ⇒ a[k] ≤ max</code>.</li><li><b>Read the counterexample</b>: a failing preservation VC gives a state satisfying I and b from which one iteration breaks I. Either the state is unreachable (strengthen I to exclude it) or it is reachable (the program has a bug).</li></ul>",
        "Automatic invariant inference exists for restricted shapes: abstract interpretation (intervals, octagons, polyhedra), Houdini (guess a candidate set, drop those that fail, Flanagan and Leino 2001), IC3/PDR and interpolation for model checking, Constrained Horn Clause solvers (Z3's Spacer), and data-driven / ML and LLM-based guessers whose candidates are then checked by the same VCs. The check is the trusted part; the guesser can be anything."
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: "How real verifiers turn these rules into a robust pipeline, and where the theory gets hard.",
    sections: [
      {
        h: "From source to VC: the Boogie pipeline",
        p: [
          "Dafny translates to Boogie, an intermediate verification language with just assignments, havoc, assert, assume, and goto. Loops are cut: at the loop head, <code>assert I; havoc</code> the variables the loop modifies; <code>assume I</code>; then either the body followed by <code>assert I; assume false</code>, or <code>assume !b</code> and continue. This is the invariant rule as straight-line code. Boogie converts to passive form (each variable assigned once, like SSA) and computes the VC with an efficient wp that avoids the exponential blow-up of naive substitution through if-branches (Flanagan and Saxe 2001; Barnett and Leino 2005), then asks Z3. A failing assertion is mapped back to the source line, with the model as a counterexample.",
          "Why3 does the same with a richer logic and can send VCs to many provers (Alt-Ergo, Z3, cvc5, Coq, Isabelle). Frama-C's WP plugin does it for ACSL-annotated C."
        ]
      },
      {
        h: "Exponential VCs and how to avoid them",
        p: [
          "Naive wp through a sequence of n if-statements duplicates Q into both branches each time: size 2<sup>n</sup>. Fixes: introduce a fresh variable or label for the intermediate postcondition (\"let R = wp(rest, Q)\" and refer to R), or compute VCs over passive form where each branch is a Boolean variable for 'execution reached here'. This is the same idea as Tseitin's fresh variables: share subformulas instead of copying them."
        ]
      },
      {
        h: "Beyond integers: arrays, heaps and separation logic",
        p: [
          "Arrays are handled by treating <code>a[i] := v</code> as <code>a := Store(a, i, v)</code>, so the assignment rule still applies, with the array theory deciding the VCs. Pointers are harder because of aliasing: <code>*p := 1</code> may change <code>*q</code>. Dafny models the heap as a map and requires <code>modifies</code> and <code>reads</code> frames. <b>Separation logic</b> (Reynolds, O'Hearn, Ishtiaq 2001–2002) adds the separating conjunction <code>P * Q</code> (P and Q hold on disjoint parts of the heap) and the frame rule <code>{P} C {Q} ⇒ {P * R} C {Q * R}</code>, which makes local reasoning about heap-manipulating code scale. VeriFast, Viper, Iris (in Coq), Prusti and Verus for Rust, and Meta's Infer (bi-abduction) build on it."
        ]
      },
      {
        h: "Strongest postconditions, symbolic execution and the bridge to model checking",
        p: [
          "Forward reasoning with strongest postconditions is symbolic execution: sp of a path is its symbolic store plus path condition, and a VC per path is 'sp(path) implies the assertion'. Backward wp and forward sp are duals, and modern tools mix them. Inferring invariants automatically leads to Constrained Horn Clauses: each VC becomes a Horn clause over an unknown predicate Inv, e.g. <code>Inv(i, s) ∧ i &lt; n ⇒ Inv(i + 1, s + i)</code>, and a CHC solver (Spacer, Eldarica) searches for an interpretation of Inv. That is the bridge to the model checking lesson."
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: "Nami's Logbook Promise",
      text: [
        "Nami promises Luffy: \"if you give me a ship in seaworthy condition (precondition), and I sail it to Wano, it will arrive with the crew and the cargo intact (postcondition)\". She does not promise they will ever arrive; storms might keep them circling forever (partial correctness). Franky adds a promise about the fuel gauge strictly decreasing each day, which means they must arrive (the variant: total correctness).",
        "To make the promise believable, Nami works backwards from the destination. 'To arrive with full cargo, the last leg must start with full cargo. To start the last leg with full cargo, the leg before must...' (weakest preconditions).",
        "The long open-sea crossing is a loop of identical days. Nami cannot check every day, so she writes one sentence in the logbook that is true every morning: 'crew aboard, cargo intact, and the distance left plus distance traveled equals the total' (the invariant). She checks three things: it is true on day one (initiation); if it is true on some morning and we sail a day, it is true the next morning (preservation); and on the morning we stop sailing, it implies we are at Wano with the cargo (exit).",
        "Usopp's first logbook sentence forgot to say 'and the ship still has its sail'. Nami's check failed: 'starting from a morning matching your sentence but without a sail, one day of sailing does not keep the distance equation true'. The ship had its sail all along; the sentence just had to say so (carrying frame facts)."
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: "Sheldon's Roommate Agreement Clauses",
      text: [
        "Each clause of Sheldon's Roommate Agreement has the shape: 'if Leonard is in state P when the event starts, then after the event, state Q holds'. Leonard asks what happens if the event never ends, like Sheldon's train documentary marathon. Sheldon: 'Then the clause is vacuously satisfied. That is partial correctness.'",
        "Leonard wants to know what he must do before Saturday to make sure Sheldon is calm after Saturday. Sheldon computes it backwards through the day's schedule: calm after laundry requires the right detergent, which requires going to the store before laundry, which requires... (weakest preconditions).",
        "For the weekly Halo night, which repeats forever, Sheldon states one invariant: 'Sheldon's spot is unoccupied at the start of every round'. Penny sits there, and Sheldon has the counterexample to preservation."
      ]
    },
    why: "Nami's promise and the Roommate Agreement clauses are Hoare triples; 'never arriving' and the endless marathon are partial correctness; Franky's decreasing fuel gauge is a variant for total correctness. Working backwards from Wano or from a calm Sheldon is wp. The logbook sentence is the loop invariant with its initiation, preservation and exit checks, and Usopp's missing 'still has its sail' is the frame fact that makes a correct loop fail to verify."
  },
  storyAnim: {
    h: 270,
    props: [
      { id: 'pre', emoji: '⚓', label: 'Pre: n >= 0', x: 8, y: 15 },
      { id: 'loop', emoji: '🌊', label: 'while i < n', x: 45, y: 15 },
      { id: 'post', emoji: '🏯', label: 'Post: 2s = n(n-1)', x: 90, y: 15 },
      { id: 'log', emoji: '📖', label: 'Invariant: 2s = i(i-1)', x: 45, y: 80 },
      { id: 'z3', emoji: '⚖️', label: 'Z3 verdicts', x: 90, y: 80 }
    ],
    actors: [
      { id: 'nami', emoji: '🧭', label: 'Nami (VC gen)', x: 20, y: 50 },
      { id: 'usopp', emoji: '🤥', label: 'Usopp', x: 70, y: 55 }
    ],
    steps: [
      { c: "The promise: starting with n >= 0, after the loop 2s = n(n-1). A Hoare triple.", p: { pre: 'lit', post: 'lit' } },
      { c: "Usopp writes the logbook sentence: 0 <= i and 2s = i(i-1). Nami generates the three VCs.", a: { usopp: [55, 65] }, p: { log: 'lit' } },
      { c: "Initiation: with i = 0, s = 0, the sentence holds. Z3: valid.", a: { nami: [25, 30] }, p: { pre: 'good' }, l: { z3: 'initiation: valid' } },
      { c: "Preservation: from any morning matching the sentence with i < n, one day keeps it true. Z3: valid.", a: { nami: [45, 35] }, p: { loop: 'good' }, l: { z3: 'preservation: valid' } },
      { c: "Exit: sentence and not (i < n) should give the post. Z3: FAILS with n = -5, i = 2. Nothing says i <= n, so i could have overshot.", a: { nami: [75, 35] }, p: { post: 'bad', z3: 'bad' }, l: { z3: 'exit: n=-5, i=2' } },
      { c: "That state is unreachable, so the program is fine and the invariant is too weak. Add 0 <= i <= n.", a: { usopp: [45, 68] }, l: { log: 'Inv: 0<=i<=n, 2s=i(i-1)' }, p: { log: 'good' } },
      { c: "All VCs valid, plus the variant n - i decreasing and non-negative: total correctness. Verified.", p: { post: 'good', z3: 'good' }, l: { z3: 'all VCs valid' } }
    ]
  },
  conceptFlow: {
    title: "From annotated program to proof",
    intro: "This is what Dafny, Why3 and Frama-C WP do every time you save a file.",
    stages: [
      { label: 'Annotate', nodes: [ { id: 'spec', text: 'requires / ensures\nP and Q' }, { id: 'inv', text: 'loop invariant I\nvariant V' } ] },
      { label: 'wp backwards', nodes: [ { id: 'assign', text: 'x := e\nQ[e/x]' }, { id: 'ifs', text: 'if b\n(b => wp1) and (!b => wp2)' }, { id: 'loop', text: 'while\nreturn I, emit side VCs' } ] },
      { label: 'VCs', nodes: [ { id: 'entry', text: 'P => wp(C, Q)' }, { id: 'pres', text: 'I and b => wp(body, I)' }, { id: 'exit', text: 'I and !b => Q' } ] },
      { label: 'Discharge', nodes: [ { id: 'z3', text: 'Z3: assert Not(VC)\nunsat = valid' } ] },
      { label: 'Report', nodes: [ { id: 'ok', text: 'verified' }, { id: 'cex', text: 'failing VC\n+ counterexample state' } ] }
    ],
    steps: [
      { active: ['spec', 'inv'], note: "The programmer supplies the contract and, for each loop, an invariant and optionally a variant. Everything else is mechanical." },
      { active: ['assign'], note: "Walk the program backwards from Q. An assignment substitutes the right-hand side for the variable in the current postcondition." },
      { active: ['ifs'], note: "A conditional combines the wp of both branches, each guarded by its condition." },
      { active: ['loop'], note: "A loop does not have a computable wp. The generator uses the invariant as the loop's precondition and emits separate verification conditions." },
      { active: ['entry'], note: "The main VC: the precondition implies the wp of the whole program. It covers initiation, since the wp of the loop is its invariant." },
      { active: ['pres', 'exit'], note: "Each loop adds preservation and exit VCs, checked for every state satisfying the invariant, reachable or not." },
      { active: ['z3'], note: "Each VC is valid iff its negation is unsat. Free variables are implicitly universally quantified, so no ForAll is needed." },
      { active: ['ok'], note: "All unsat: the program meets its contract, for all inputs, relative to the model of the language." },
      { active: ['cex'], note: "A sat answer names the VC and gives a state. Decide: unreachable (strengthen the invariant) or reachable (fix the code)." }
    ]
  },
  tech: [
    {
      q: "Why is the assignment rule written backwards, with substitution into the postcondition?",
      a: "Because substitution is exact and needs no new variables. After x := e, the new x equals the old e; so 'Q holds afterwards' is the same as 'Q with x replaced by e holds before'. The forward rule must remember the old value of x with an existential, which is harder to automate. Note the substitution must be capture-avoiding and must treat arrays as whole values: a[i] := v becomes a := Store(a, i, v)."
    },
    {
      q: "If wp gives the weakest precondition, why do verifiers need invariants at all?",
      a: "For a loop, wp is the least fixpoint of an equation over predicates; computing it exactly is undecidable in general and the iterates are infinitely many formulas. An invariant is a user-supplied (or inferred) approximation that is strong enough to prove the postcondition and inductive. The VCs check exactly those two properties."
    },
    {
      q: "Are the VCs in the code example quantified?",
      a: [
        "Implicitly. A VC like <code>I ∧ b ⇒ wp(body, I)</code> must hold for all values of the program variables. Asserting its negation and getting unsat checks that, because the solver treats free constants existentially: unsat of 'exists a state where the VC fails' is validity.",
        "Quantifiers appear explicitly only inside assertions (∀k. 0 ≤ k &lt; i ⇒ ...), and that is where verifiers start to depend on triggers."
      ]
    },
    {
      q: "What does 'relatively complete' mean for Hoare logic?",
      a: "Cook (1978): every valid partial-correctness triple can be derived with the Hoare rules, provided the assertion language is expressive enough to state the needed invariants and you have an oracle for the valid assertions used in the consequence rule. The incompleteness is all in the assertion logic (arithmetic), not in the program rules. Practically: if verification fails, either the invariant is wrong or the solver could not prove a true VC."
    }
  ],
  code: {
    title: "A 60-line VC generator: wp, loop VCs and variants, discharged by Z3",
    intro: "Expressions are Z3 terms over Int constants, so the assignment rule is literally <code>z3.substitute</code>. The generator handles assign, sequence, if, assert and while (with invariant and optional variant), collects side VCs for loops, and checks each VC by asserting its negation. It verifies a summation loop, shows exactly which VC a weak invariant breaks, verifies max, and then catches a subtle missing frame fact in integer division.",
    code: `# vcgen.py -- weakest preconditions + verification conditions, discharged by Z3
# run with: python3 vcgen.py   (pip install --user z3-solver)
from z3 import Int, IntVal, And, Or, Not, Implies, BoolVal, Solver, substitute, unsat, sat

# Statements: ("skip",) ("assign", x, e) ("seq", s1, s2, ...) ("if", b, s1, s2)
#             ("while", b, invariant, variant_or_None, body) ("assert", p)
# Expressions are Z3 terms over Int constants, so wp is just substitution.

def wp(stmt, Q, vcs):
    """Return wp(stmt, Q); append side conditions (from loops) to vcs."""
    kind = stmt[0]
    if kind == "skip":
        return Q
    if kind == "assign":                         # wp(x := e, Q) = Q[e/x]
        _, x, e = stmt
        return substitute(Q, (x, e))
    if kind == "seq":                            # wp(s1; s2, Q) = wp(s1, wp(s2, Q))
        for s in reversed(stmt[1:]):
            Q = wp(s, Q, vcs)
        return Q
    if kind == "if":                             # (b => wp(s1,Q)) and (!b => wp(s2,Q))
        _, b, s1, s2 = stmt
        return And(Implies(b, wp(s1, Q, vcs)), Implies(Not(b), wp(s2, Q, vcs)))
    if kind == "assert":
        return And(stmt[1], Q)
    if kind == "while":                          # needs a user-supplied invariant I
        _, b, I, V, body = stmt
        vcs.append(("invariant preserved", Implies(And(I, b), wp(body, I, vcs))))
        vcs.append(("invariant + exit => post", Implies(And(I, Not(b)), Q)))
        if V is not None:                        # total correctness: variant decreases
            v0 = Int("v0")
            vcs.append(("variant >= 0", Implies(And(I, b), V >= 0)))
            vcs.append(("variant decreases",
                        Implies(And(I, b, V == v0), wp(body, V < v0, vcs))))
        return I
    raise ValueError(kind)

def verify(name, pre, prog, post):
    vcs = []
    main = wp(prog, post, vcs)
    vcs.insert(0, ("pre => wp(prog, post)", Implies(pre, main)))
    print("==", name)
    ok = True
    for label, vc in vcs:
        s = Solver()
        s.add(Not(vc))                           # valid iff negation unsat
        r = s.check()
        if r == unsat:
            print("   %-26s valid" % label)
        else:
            ok = False
            print("   %-26s FAILS  %s" % (label, s.model() if r == sat else r))
    print("   =>", "VERIFIED" if ok else "NOT VERIFIED")

n, i, s_, x, y, q, r, m = (Int(v) for v in "n i s x y q r m".split())

# 1) sum of 0..n-1 by a loop:  { n >= 0 } ... { 2*s == n*(n-1) }
summ = ("seq",
        ("assign", i, IntVal(0)),
        ("assign", s_, IntVal(0)),
        ("while", i < n, And(0 <= i, i <= n, 2 * s_ == i * (i - 1)), n - i,
            ("seq", ("assign", s_, s_ + i), ("assign", i, i + 1))))
verify("sum loop", n >= 0, summ, 2 * s_ == n * (n - 1))

# 2) same loop, invariant missing i <= n: preservation holds, exit fails
weak = ("seq", summ[1], summ[2],
        ("while", i < n, And(0 <= i, 2 * s_ == i * (i - 1)), n - i, summ[3][4]))
verify("sum loop, weak invariant", n >= 0, weak, 2 * s_ == n * (n - 1))

# 3) max with an if
mx = ("if", x >= y, ("assign", m, x), ("assign", m, y))
verify("max", BoolVal(True), mx, And(m >= x, m >= y, Or(m == x, m == y)))

# 4) division by repeated subtraction
div = ("seq",
       ("assign", q, IntVal(0)),
       ("assign", r, x),
       ("while", r >= y, And(x == q * y + r, r >= 0), r,
            ("seq", ("assign", r, r - y), ("assign", q, q + 1))))
verify("divmod", And(x >= 0, y > 0), div, And(x == q * y + r, 0 <= r, r < y))

# 5) the fix: loop VCs are checked in ANY state satisfying I, so I must carry y > 0
div_fixed = ("seq", div[1], div[2],
             ("while", r >= y, And(x == q * y + r, r >= 0, y > 0), r, div[3][4]))
verify("divmod, invariant carries y > 0", And(x >= 0, y > 0), div_fixed, And(x == q * y + r, 0 <= r, r < y))

# Output:
# == sum loop
#    pre => wp(prog, post)      valid
#    invariant preserved        valid
#    invariant + exit => post   valid
#    variant >= 0               valid
#    variant decreases          valid
#    => VERIFIED
# == sum loop, weak invariant
#    pre => wp(prog, post)      valid
#    invariant preserved        valid
#    invariant + exit => post   FAILS  [n = -5, s = 1, i = 2]
#    variant >= 0               valid
#    variant decreases          valid
#    => NOT VERIFIED
# == max
#    pre => wp(prog, post)      valid
#    => VERIFIED
# == divmod
#    pre => wp(prog, post)      valid
#    invariant preserved        valid
#    invariant + exit => post   valid
#    variant >= 0               valid
#    variant decreases          FAILS  [x = 0, y = 0, q = 0, r = 0, v0 = 0]
#    => NOT VERIFIED
# == divmod, invariant carries y > 0
#    pre => wp(prog, post)      valid
#    invariant preserved        valid
#    invariant + exit => post   valid
#    variant >= 0               valid
#    variant decreases          valid
#    => VERIFIED`,
    notes: [
      "The weak invariant fails only the exit VC, and the counterexample (n = -5, i = 2) is unreachable: i never exceeds n. That tells you to strengthen the invariant, not to change the code.",
      "divmod fails the variant VC with y = 0: in a state satisfying the invariant but not the precondition, r - y is not smaller than r. The loop VCs do not see the precondition; only what the invariant says survives into the loop. Adding <code>y &gt; 0</code> to the invariant fixes it. Dafny users hit this constantly.",
      "Invariants like <code>x == q*y + r</code> are nonlinear. Z3 proves these quickly because the VCs are simple instances, but nonlinear integer VCs can make verifiers unstable; Dafny lets you isolate them in lemmas."
    ]
  },
  lab: {
    title: "Write the wp rules and an invariant for a multiplication loop",
    prompt: "Complete <code>wp(stmt, Q, vcs)</code> for <code>assign</code> (substitution), <code>if</code>, and <code>while</code> (return the invariant, and append the preservation and exit VCs to <code>vcs</code>). <code>seq</code> is given. Then verify <code>{ n &gt;= 0 } r := 0; i := 0; while i &lt; n { r := r + x; i := i + 1 } { r == n * x }</code> with an invariant of your choice, show that the weaker invariant <code>r == i * x</code> fails, and verify the abs program <code>if x &lt; 0 then r := -x else r := x</code> against <code>r &gt;= 0 and (r == x or r == -x)</code>.",
    starter: `from z3 import Int, IntVal, BoolVal, And, Or, Not, Implies, Solver, substitute, unsat, sat

def wp(stmt, Q, vcs):
    kind = stmt[0]
    if kind == "assign":
        _, x, e = stmt
        # TODO: Q with e substituted for x
    if kind == "seq":
        for s in reversed(stmt[1:]):
            Q = wp(s, Q, vcs)
        return Q
    if kind == "if":
        _, b, s1, s2 = stmt
        # TODO
    if kind == "while":
        _, b, inv, body = stmt
        # TODO: append ("preserved", ...) and ("exit", ...) to vcs, return inv
    raise ValueError(kind)

def verify(name, pre, prog, post):
    vcs = []
    vcs.append(("entry", Implies(pre, wp(prog, post, vcs))))
    ok = True
    for label, vc in vcs:
        s = Solver()
        s.add(Not(vc))
        r = s.check()
        ok = ok and r == unsat
        print("%-12s %-10s %s" % (name, label, "valid" if r == unsat else s.model() if r == sat else r))
    print("%-12s => %s" % (name, "VERIFIED" if ok else "NOT VERIFIED"))
    return ok

n, i, x, r = Int("n"), Int("i"), Int("x"), Int("r")
# TODO: mul_loop(inv), a good invariant, the weak one, and the abs program
`,
    checks: [
      { re: 'return\\s+substitute\\s*\\(\\s*Q\\s*,\\s*\\(\\s*x\\s*,\\s*e\\s*\\)\\s*\\)', flags: '', must: true, hint: 'Assignment rule: return substitute(Q, (x, e))', pass: 'Assignment by substitution' },
      { re: 'Implies\\s*\\(\\s*b\\s*,\\s*wp\\s*\\(\\s*s1', flags: '', must: true, hint: 'If rule, then-branch: Implies(b, wp(s1, Q, vcs))', pass: 'If rule: then-branch' },
      { re: 'Implies\\s*\\(\\s*Not\\s*\\(\\s*b\\s*\\)\\s*,\\s*wp\\s*\\(\\s*s2', flags: '', must: true, hint: 'If rule, else-branch: Implies(Not(b), wp(s2, Q, vcs))', pass: 'If rule: else-branch' },
      { re: 'Implies\\s*\\(\\s*And\\s*\\(\\s*inv\\s*,\\s*b\\s*\\)\\s*,\\s*wp\\s*\\(\\s*body\\s*,\\s*inv', flags: '', must: true, hint: 'Preservation: Implies(And(inv, b), wp(body, inv, vcs))', pass: 'Preservation VC' },
      { re: 'Implies\\s*\\(\\s*And\\s*\\(\\s*inv\\s*,\\s*Not\\s*\\(\\s*b\\s*\\)\\s*\\)\\s*,\\s*Q\\s*\\)', flags: '', must: true, hint: 'Exit: Implies(And(inv, Not(b)), Q)', pass: 'Exit VC' },
      { re: 'return\\s+inv', flags: '', must: true, hint: 'The wp of a loop is its invariant', pass: 'Loop returns its invariant' },
      { re: 'i\\s*<=\\s*n', flags: '', must: true, hint: 'The good invariant needs the bound i <= n so that exit gives i == n', pass: 'Invariant bounds the counter' },
      { re: 'r\\s*==\\s*i\\s*\\*\\s*x', flags: '', must: true, hint: 'Generalize the postcondition: r == i * x', pass: 'Invariant generalizes the post' }
    ],
    run: "Save as <code>mini_vcgen.py</code>, <code>pip install --user z3-solver</code>, <code>python3 mini_vcgen.py</code>. Expect <code>mul =&gt; VERIFIED</code>, <code>mul-weak exit</code> to print a counterexample such as <code>[n = -1, i = 2, x = -6, r = -12]</code> and <code>NOT VERIFIED</code>, and <code>abs =&gt; VERIFIED</code>. Then try the same program in Dafny (next lessons): the error messages map to exactly these three VCs.",
    solution: `# mini_vcgen.py -- weakest-precondition VC generator, discharged with Z3
from z3 import Int, IntVal, BoolVal, And, Or, Not, Implies, Solver, substitute, unsat, sat

def wp(stmt, Q, vcs):
    kind = stmt[0]
    if kind == "assign":                       # wp(x := e, Q) = Q[e/x]
        _, x, e = stmt
        return substitute(Q, (x, e))
    if kind == "seq":                          # wp(s1; s2, Q) = wp(s1, wp(s2, Q))
        for s in reversed(stmt[1:]):
            Q = wp(s, Q, vcs)
        return Q
    if kind == "if":
        _, b, s1, s2 = stmt
        return And(Implies(b, wp(s1, Q, vcs)), Implies(Not(b), wp(s2, Q, vcs)))
    if kind == "while":
        _, b, inv, body = stmt
        vcs.append(("preserved", Implies(And(inv, b), wp(body, inv, vcs))))
        vcs.append(("exit", Implies(And(inv, Not(b)), Q)))
        return inv
    raise ValueError(kind)

def verify(name, pre, prog, post):
    vcs = []
    vcs.append(("entry", Implies(pre, wp(prog, post, vcs))))
    ok = True
    for label, vc in vcs:
        s = Solver()
        s.add(Not(vc))
        r = s.check()
        ok = ok and r == unsat
        print("%-12s %-10s %s" % (name, label, "valid" if r == unsat else s.model() if r == sat else r))
    print("%-12s => %s" % (name, "VERIFIED" if ok else "NOT VERIFIED"))
    return ok

n, i, x, r = Int("n"), Int("i"), Int("x"), Int("r")

def mul_loop(inv):
    return ("seq",
            ("assign", r, IntVal(0)),
            ("assign", i, IntVal(0)),
            ("while", i < n, inv,
                ("seq", ("assign", r, r + x), ("assign", i, i + 1))))

good = And(0 <= i, i <= n, r == i * x)
weak = r == i * x                              # forgets the bound on i
assert verify("mul", n >= 0, mul_loop(good), r == n * x)
assert not verify("mul-weak", n >= 0, mul_loop(weak), r == n * x)

# abs via if: { true } if x < 0 then r := -x else r := x { r >= 0 and (r == x or r == -x) }
absprog = ("if", x < 0, ("assign", r, -x), ("assign", r, x))
assert verify("abs", BoolVal(True), absprog, And(r >= 0, Or(r == x, r == -x)))

# mul          preserved  valid
# mul          exit       valid
# mul          entry      valid
# mul          => VERIFIED
# mul-weak     preserved  valid
# mul-weak     exit       [n = -1, i = 2, x = -6, r = -12]
# mul-weak     entry      valid
# mul-weak     => NOT VERIFIED
# abs          entry      valid
# abs          => VERIFIED
`,
    notes: [
      "The weak invariant's exit counterexample has i = 2 &gt; n = -1. With n &gt;= 0 as the precondition that state is unreachable, but the loop VCs cannot see the precondition; only the invariant can carry it.",
      "Notice the VC list is printed with preservation and exit before entry: they are appended while wp recurses into the loop, before the entry VC is formed. Order does not matter for validity.",
      "Over Int, abs verifies. Change the variables to <code>BitVec(\"x\", 32)</code> and the same proof fails at x = INT_MIN: the spec, not the proof method, decides which semantics you verify."
    ]
  },
  quiz: [
    {
      q: "What is wp(x := x + y, x > 10)?",
      options: ["x > 10", "x + y > 10", "x > 10 - y and y > 0", "x + y > 10 and x > 10"],
      correct: 1,
      explain: "Substitute x + y for x in the postcondition."
    },
    {
      q: "Which triple is valid under partial correctness but not total correctness?",
      options: ["{x = 1} x := x + 1 {x = 2}", "{true} while true do skip {false}", "{x > 0} x := x - 1 {x >= 0}", "{false} skip {x = 3}"],
      correct: 1,
      explain: "The loop never terminates, so partial correctness holds vacuously; total correctness requires termination."
    },
    {
      q: "A loop invariant I with guard b must satisfy which preservation condition for body C?",
      options: ["I => wp(C, I)", "I and b => wp(C, I)", "I and not b => wp(C, I)", "wp(C, I) => I"],
      correct: 1,
      explain: "Only iterations that actually run (guard true) must re-establish I."
    },
    {
      q: "Your preservation VC fails with a counterexample state that the program can never reach. What do you change?",
      options: ["The program", "Strengthen the invariant to exclude that state", "Weaken the postcondition", "Switch to a different SMT solver"],
      correct: 1,
      explain: "The VC is checked over all states satisfying I. If the bad state is unreachable, I is too weak."
    },
    {
      q: "In {x >= 0, y > 0} q := 0; r := x; while r >= y { r := r - y; q := q + 1 }, why must the invariant mention y > 0 to prove termination with variant r?",
      options: ["Because y changes in the loop", "Because loop VCs are checked in arbitrary states satisfying the invariant, and with y <= 0 the variant does not decrease", "Because Z3 cannot handle y", "It does not need to"],
      correct: 1,
      explain: "The precondition is not available inside the loop VCs unless the invariant carries it."
    }
  ],
  testFlow: {
    title: "Test yourself: compute the wp",
    start: 'q1',
    nodes: {
      q1: {
        q: "wp(if x > 0 then y := x else y := 0 - x, y > 0) simplifies to?",
        choices: [
          { text: "x != 0", to: 'q1_right' },
          { text: "x > 0", to: 'q1_wrong' },
          { text: "true", to: 'q1_wrong2' }
        ]
      },
      q1_right: { end: true, correct: true, text: "(x > 0 => x > 0) and (x <= 0 => -x > 0) = true and (x <= 0 => x < 0) = x != 0.", next: 'q2' },
      q1_wrong: { end: true, correct: false, text: "The else-branch also contributes: negative x gives y = -x > 0. Only x = 0 fails.", retry: 'q1' },
      q1_wrong2: { end: true, correct: false, text: "Try x = 0: the else-branch sets y = 0, and 0 > 0 is false.", retry: 'q1' },
      q2: {
        q: "Post: r == n * x. Loop: i from 0 while i < n, r += x, i += 1. Is 'r == i * x' alone an inductive invariant that proves the post?",
        choices: [
          { text: "It is preserved, but exit fails: without i <= n, not (i < n) does not imply i == n", to: 'q2_right' },
          { text: "Yes, it is enough", to: 'q2_wrong' }
        ]
      },
      q2_right: { end: true, correct: true, text: "Exactly what the lab shows. Add 0 <= i <= n." },
      q2_wrong: { end: true, correct: false, text: "Exit gets r == i*x and i >= n. To conclude r == n*x you need i == n, which requires i <= n in the invariant.", retry: 'q2' }
    }
  },
  pitfalls: [
    "Writing invariants that are true but not inductive (they hold on every reachable state, yet one iteration from some unreachable state breaks them). The solver only checks inductiveness.",
    "Forgetting frame facts (bounds of unchanged variables, array lengths, preconditions) in the invariant.",
    "Forgetting the counter's bound (i <= n), so the exit VC cannot conclude i == n.",
    "Proving over Int when the code uses machine integers; overflow makes an Int-verified program wrong.",
    "Confusing partial and total correctness: without a variant, a non-terminating loop satisfies any postcondition."
  ],
  interview: [
    {
      q: "What is a Hoare triple, and what is the difference between partial and total correctness?",
      a: "{P} C {Q} means: from any state satisfying P, if C terminates, the final state satisfies Q. That is partial correctness. Total correctness also requires C to terminate from every P-state. Proving total correctness needs a variant (ranking function) for each loop and recursion: a non-negative quantity that strictly decreases each iteration in a well-founded order."
    },
    {
      q: "Compute wp for a small program and explain each rule.",
      a: "Take y := x + 1; if y > 5 then z := y else z := 5 with Q = z >= 5. Backwards: wp(if, Q) = (y > 5 => y >= 5) and (y <= 5 => 5 >= 5) = true. Then wp(y := x + 1, true) = true. So the program establishes z >= 5 from any state. Rules: assignment substitutes, sequence composes right to left, if takes both branches guarded by the condition. For loops there is no closed form; use an invariant and generate initiation, preservation and exit VCs."
    },
    {
      q: "What are verification conditions and how are they discharged?",
      a: "Logical formulas, generated from the annotated program, whose validity implies the program meets its specification: precondition implies wp of the body, plus for each loop 'invariant and guard implies wp of the body with respect to the invariant' and 'invariant and not guard implies what follows'. Each VC is discharged by asserting its negation in an SMT solver: unsat means valid. Sat yields a counterexample state, which a tool maps back to a source location."
    },
    {
      q: "Explain a tradeoff: auto-active verification (Dafny) vs interactive theorem proving (Lean/Coq) for program correctness.",
      a: "Auto-active tools ask for specifications and invariants in the program text and discharge the rest automatically with SMT. They are much faster to use for typical imperative code and closer to how engineers think, but limited by what the solver can prove and prone to proof instability (timeouts after small changes). Interactive provers give full control and stability, a tiny trusted kernel, and arbitrary mathematics, at the cost of writing proofs step by step. A common split: Dafny or Verus for implementation-level code, Lean or Coq for the deep math or metatheory, and increasingly LLMs to propose invariants or proof steps that the checker validates."
    },
    {
      q: "Whiteboard: give the invariant for binary search that proves it returns the index of the key if present.",
      a: "With a sorted array a of length N, lo = 0, hi = N, loop while lo < hi: invariant 0 <= lo <= hi <= N, and for all k in [0, lo): a[k] < key, and for all k in [hi, N): a[k] > key (for the 'returns -1 iff absent' version, or >= key for the lower-bound version). Variant: hi - lo. Each branch preserves the invariant using sortedness, and at exit lo == hi so every index is excluded, proving absence; the found branch returns mid with a[mid] == key. I would also mention the midpoint must be computed as lo + (hi - lo) / 2 if the code uses machine integers, which the VC for 'mid is in range' would catch."
    },
    {
      q: "Your invariant fails the preservation VC. Walk me through debugging it.",
      a: "Read the counterexample: it is a state satisfying the invariant and the guard from which one iteration breaks the invariant. Check whether that state is reachable. If not, the invariant is too weak: add the missing fact (usually a bound or a frame fact about unchanged variables, or a relationship between variables). If it is reachable, the program has a bug or the invariant is false. In Dafny I would add intermediate asserts inside the body to localize which step breaks it, and assume statements to test hypotheses."
    },
    {
      q: "How do VC generators avoid exponential blow-up?",
      a: "Naive wp copies the postcondition into both branches of every if, so n sequential ifs give 2^n copies. Practical generators first convert to passive (SSA-like) form, where each assignment introduces a fresh variable and branches are encoded with Boolean 'reached' variables, or name intermediate postconditions with let-bindings so they are shared rather than copied. Flanagan and Saxe's efficient weakest preconditions (2001) produce VCs roughly quadratic or linear in program size; Boogie uses this."
    }
  ]
};
