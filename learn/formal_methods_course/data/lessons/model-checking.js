window.LESSONS = window.LESSONS || {};
window.LESSONS['model-checking'] = {
  id: 'model-checking',
  title: 'Bounded Model Checking & Temporal Logic: CBMC, LTL & TLA+',
  category: 'Part 2 — Verifying Programs',
  timeMin: 45,
  summary: 'Hoare logic proves one program correct with human-written invariants. Model checking takes a different bargain: describe the system as a state machine, state the property in temporal logic, and let an algorithm explore every reachable state automatically. When it fails you get a concrete counterexample trace, which is why hardware teams, AWS (TLA+) and kernel developers use it daily. This lesson covers Kripke structures, LTL vs CTL, safety vs liveness, state explosion, bounded model checking as SAT/SMT unrolling (you will run one in Z3), k-induction for unbounded proofs, and the practical tools: CBMC for C, TLA+/TLC for designs, and SPIN for protocols.',
  goals: [
    'Model a system as a Kripke structure (states, initial states, transition relation, labels) and say what "M satisfies phi" means',
    'Read and write LTL (G, F, X, U) and CTL (AG, EF, AF) formulas and give a property expressible in one but not the other',
    'Classify a property as safety or liveness and say what a counterexample looks like for each (finite prefix vs lasso)',
    'Encode a bounded model checking query I(s0) and T(s0,s1) and ... and not P(sk) in Z3, and extend it to a k-induction proof',
    'Run CBMC on C code with --unwind and --unwinding-assertions, and write a small TLA+ spec checked by TLC'
  ],
  concept: [
    {
      h: 'The model: Kripke structures and transition systems',
      p: [
        'A <b>Kripke structure</b> is M = (S, S0, R, L): a set of states S, initial states S0, a transition relation R (a subset of S x S, usually required to be total so every state has a successor), and a labeling L that says which atomic propositions hold in each state. A program becomes one by taking the state to be (program counter, values of all variables); hardware becomes one by taking the state to be the values of all latches.',
        'In solver-land we write the same thing <i>symbolically</i>: a formula <code>I(s)</code> that is true exactly of initial states, and a formula <code>T(s, s\')</code> relating a state to its successor. A state is a vector of variables; <code>s\'</code> is a fresh copy for the next step. Everything in this lesson, from BMC to k-induction to TLA+, is built from those two formulas.',
        '<b>Interleaving vs synchronous</b>: concurrent software is usually modeled by interleaving (each step, exactly one process moves and the others keep their values, which you must say explicitly: the <i>frame condition</i>). Synchronous hardware moves every latch on every clock tick. Forgetting the frame condition is the most common modeling bug: unconstrained variables can take any value and the checker happily finds nonsense counterexamples.'
      ],
      code: `-- symbolic transition system for a 2-process lock (interleaving)
state      : p0, p1 in {IDLE, READY, CRIT}; lock : Bool
I(s)       : p0 = IDLE and p1 = IDLE and not lock
T(s, s')   : (p0 moves and p1' = p1) or (p1 moves and p0' = p0)
  move     : IDLE  -> READY  if not lock, and set lock'   (atomic test-and-set)
             READY -> CRIT
             CRIT  -> IDLE   and lock' = false
property P : not (p0 = CRIT and p1 = CRIT)        -- mutual exclusion`
    },
    {
      h: 'Temporal logic: LTL vs CTL',
      p: [
        '<b>LTL</b> (linear temporal logic, Pnueli 1977) talks about a single infinite path. Operators: <code>X p</code> (next), <code>G p</code> (globally, always), <code>F p</code> (finally, eventually), <code>p U q</code> (p until q). M satisfies an LTL formula if <i>every</i> path from an initial state does.',
        '<b>CTL</b> (computation tree logic, Clarke and Emerson 1981) talks about the branching tree of futures. Every temporal operator must be paired with a path quantifier: <code>A</code> (all paths) or <code>E</code> (some path). So <code>AG p</code>, <code>EF p</code>, <code>AF p</code>, <code>EG p</code>, <code>A[p U q]</code>.',
        '<div class="cmp-wrap"><table class="cmp"><tr><th>Property</th><th>LTL</th><th>CTL</th></tr><tr><td>Never both in critical section</td><td><code>G !(c0 &amp;&amp; c1)</code></td><td><code>AG !(c0 &amp;&amp; c1)</code></td></tr><tr><td>Every request is eventually granted</td><td><code>G (req -&gt; F grant)</code></td><td><code>AG (req -&gt; AF grant)</code></td></tr><tr><td>From anywhere you can always get back to reset</td><td>not expressible</td><td><code>AG EF reset</code></td></tr><tr><td>Eventually p holds forever (stabilization)</td><td><code>F G p</code></td><td>not expressible (<code>AF AG p</code> is strictly stronger)</td></tr></table></div>',
        'Neither logic contains the other; CTL* contains both. Algorithmically, CTL model checking is linear in |M| x |phi| (labeling states bottom-up over subformulas). LTL is linear in |M| but exponential in |phi| (build a Buchi automaton for the negated formula, take the product, search for an accepting cycle). Formulas are small and models are huge, so both are practical; the model size is what kills you.'
      ]
    },
    {
      h: 'Safety vs liveness, and what a counterexample looks like',
      p: [
        '<b>Safety</b>: "nothing bad ever happens" (<code>G !bad</code>, assertion never fails, no buffer overflow). Every violation has a <i>finite</i> witness: a path prefix ending in a bad state. Checking safety is a reachability question.',
        '<b>Liveness</b>: "something good eventually happens" (<code>G(req -&gt; F grant)</code>, termination, no starvation). No finite prefix can violate it, because the good thing might still come later. A counterexample is a <b>lasso</b>: a finite stem followed by a cycle that repeats forever without the good thing. Liveness usually needs <b>fairness</b> assumptions (a process that is continuously enabled eventually gets to move), otherwise the scheduler can starve anyone and everything "fails".',
        'Alpern and Schneider (1985) proved every property is the intersection of a safety property and a liveness property. In practice: most industrial checking is safety (assertions, invariants), because it is cheaper and gives readable counterexamples.'
      ]
    },
    {
      h: 'Bounded model checking: unroll the transition relation into one SAT/SMT query',
      p: [
        'Biere, Cimatti, Clarke and Zhu (1999) observed that "is a bad state reachable in exactly k steps" is just a formula: make k+1 copies of the state variables and assert <code>I(s0) and T(s0,s1) and ... and T(s(k-1),sk) and not P(sk)</code>. If the solver says <b>sat</b>, the model <i>is</i> the counterexample trace. If <b>unsat</b>, there is no violation of that length; increase k.',
        'BMC is excellent at finding bugs (SAT solvers are very good at this, and shallow bugs dominate), and it is what CBMC, ESBMC and hardware BMC engines do. Its weakness: unsat at depth k says nothing about depth k+1. It becomes a proof only if k reaches the <i>completeness threshold</i> (for example the recurrence diameter: the longest loop-free path), which is usually far too large to reach.',
        'The worked example below runs BMC on the lock: the buggy version (test and set are separate steps) has a violation at depth 4; the fixed version has none up to depth 10, and k-induction then proves it for all depths.'
      ],
      code: `for k in 0, 1, 2, ...:
    F_k = I(s0) and T(s0,s1) and ... and T(s(k-1),sk) and not P(sk)
    if SAT(F_k): return counterexample(model)   # concrete trace s0..sk
# never returns "safe" on its own -- that needs k-induction or IC3/PDR`
    },
    {
      h: 'k-induction: turning BMC into a proof',
      p: [
        'Induction over transitions: if P holds initially (base) and P(s) and T(s,s\') imply P(s\') (step), then P holds in every reachable state. <b>k-induction</b> (Sheeran, Singh, Stalmarck 2000) generalizes the step: assume P on k consecutive states connected by T, and show P on the next one. The base case is just BMC up to depth k-1.',
        'The step query can fail even when P is true, because it starts from an arbitrary state, not a reachable one. A satisfying assignment for the step query is a <b>counterexample to induction (CTI)</b>: an unreachable P-state that steps to a not-P state. The fixes: (1) increase k, (2) add a simple-path constraint (all k states pairwise distinct) so that unreachable loops cannot be unrolled forever, or (3) <b>strengthen</b> the invariant. That last option is exactly the "loop invariant too weak" problem from Hoare logic, wearing different clothes. In the worked example, plain mutual exclusion fails the step for every k from 1 to 8; adding "lock is held exactly when some process is past IDLE" makes it 1-inductive.',
        '<b>IC3/PDR</b> (Bradley 2011) is the modern answer: it learns those strengthening clauses automatically from CTIs, one frame at a time, and is the default unbounded engine in hardware model checkers (ABC, nuXmv) and in Z3 (Spacer, for constrained Horn clauses).'
      ]
    },
    {
      h: 'State explosion and the tool landscape',
      p: [
        'n components with k local states give up to k^n global states; add 32-bit variables and explicit enumeration is hopeless. The standard weapons: <b>symbolic</b> representation (BDDs, McMillan\'s SMV, 1992), <b>SAT/SMT-based</b> BMC and IC3, <b>partial-order reduction</b> (skip interleavings of independent actions; SPIN), <b>symmetry reduction</b>, and <b>abstraction</b> with CEGAR (abstract, check, if the counterexample is spurious refine; SLAM/SDV for Windows drivers, CPAchecker).',
        '<ul><li><b>CBMC</b>: bounded model checker for C/C++. Unwinds loops k times, converts to SAT/SMT, checks assertions plus built-in checks (bounds, pointers, overflow). Used by AWS for verifying C code such as parts of the FreeRTOS kernel and s2n.</li><li><b>TLA+ / TLC</b> (Lamport): specify designs (not code) as state machines in set theory plus temporal logic; TLC is an explicit-state model checker, Apalache a symbolic one. Famous for AWS finding deep bugs in DynamoDB and S3 designs (Newcombe et al., CACM 2015).</li><li><b>SPIN</b> (Holzmann): explicit-state LTL checker for Promela protocol models, with partial-order reduction; long history with NASA/JPL flight software.</li><li><b>nuXmv / NuSMV</b>: symbolic CTL/LTL for finite-state models; <b>JasperGold</b>, <b>ABC</b> in hardware.</li></ul>'
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'Interviewers who know the area push on four things: what CBMC actually does with loops, how liveness is checked with a SAT solver, what TLC does with your spec, and why IC3 beat k-induction.',
    sections: [
      {
        h: 'CBMC in practice: unwinding, nondeterminism and unwinding assertions',
        p: [
          'CBMC translates the program into static single assignment form, unrolls each loop up to the <code>--unwind N</code> bound, and turns the result into one formula. Inputs come from functions declared but not defined (for example <code>int nondet_int();</code>), which CBMC treats as unconstrained. <code>__CPROVER_assume(cond)</code> prunes paths; <code>assert(cond)</code> or <code>__CPROVER_assert(cond, "msg")</code> adds a proof obligation.',
          'Without <code>--unwinding-assertions</code>, paths that need more than N iterations are silently cut off, so "VERIFICATION SUCCESSFUL" only means "no bug in the first N iterations". With it, CBMC adds an assertion that the loop really does exit within N, so a success becomes a real proof for all inputs (given the assumptions). This distinction is a favorite interview question.'
        ],
        code: `// abs.c
#include <assert.h>
int nondet_int();
int my_abs(int x) { return x < 0 ? -x : x; }
int main(void) {
  int x = nondet_int();
  int r = my_abs(x);
  assert(r >= 0);          // fails for x == INT_MIN: -INT_MIN overflows
  return 0;
}

$ cbmc abs.c --signed-overflow-check --trace
# reports the overflow / failed assertion with x = -2147483648 in the trace

# loops: unwind and prove the bound is enough
$ cbmc sum.c --unwind 11 --unwinding-assertions --bounds-check --pointer-check`
      },
      {
        h: 'Liveness with SAT: lasso-shaped BMC and liveness-to-safety',
        p: [
          'To find a violation of <code>G F grant</code> with BMC, search for a lasso: states s0..sk with some l &lt;= k such that T(sk, sl) closes a loop, and grant is false on every state in the loop. That is still a single SAT query per (k, l). Biere, Artho and Schuppan also showed a <b>liveness-to-safety</b> reduction: nondeterministically save a copy of the state, and flag an error if you return to the saved state without having seen the good event. Then any safety engine (IC3) can prove liveness.'
        ]
      },
      {
        h: 'A small TLA+ spec and what TLC does with it',
        p: [
          'TLC computes the initial states from <code>Init</code>, then does a breadth-first search applying <code>Next</code>, storing fingerprints of every distinct state. It checks <code>INVARIANT</code>s in every state and temporal <code>PROPERTY</code>s over the state graph. BFS means the first invariant violation reported is a shortest trace. Primed variables (<code>pc\'</code>) denote next-state values; <code>[][Next]_vars</code> allows stuttering steps; <code>WF_vars(Next)</code> is weak fairness.',
          'With only <code>WF_vars(Next)</code>, the starvation property below fails: TLC prints a lasso where process 1 acquires and releases forever while process 0 never gets in. Per-process fairness, <code>\\A p \\in Procs : WF_vars(Acquire(p))</code>, does not fix it either, because Acquire(0) is not <i>continuously</i> enabled (it is disabled whenever process 1 holds the lock); you need strong fairness <code>SF_vars(Acquire(p))</code> or a fairer algorithm. Explaining that difference is a strong interview answer.'
        ],
        code: `---------------------------- MODULE Lock ----------------------------
EXTENDS Naturals
VARIABLES pc, lock
vars  == <<pc, lock>>
Procs == {0, 1}

Init == /\\ pc = [p \\in Procs |-> "idle"]
        /\\ lock = FALSE

Acquire(p) == /\\ pc[p] = "idle"
              /\\ lock = FALSE
              /\\ pc' = [pc EXCEPT ![p] = "crit"]
              /\\ lock' = TRUE

Release(p) == /\\ pc[p] = "crit"
              /\\ pc' = [pc EXCEPT ![p] = "idle"]
              /\\ lock' = FALSE

Next == \\E p \\in Procs : Acquire(p) \\/ Release(p)
Spec == Init /\\ [][Next]_vars /\\ WF_vars(Next)

MutualExclusion == ~(pc[0] = "crit" /\\ pc[1] = "crit")
NoStarvation    == \\A p \\in Procs : (pc[p] = "idle") ~> (pc[p] = "crit")
=====================================================================

\\* Lock.cfg
SPECIFICATION Spec
INVARIANT MutualExclusion
PROPERTY NoStarvation

$ java -cp tla2tools.jar tlc2.TLC Lock.tla     # reads Lock.cfg next to it`
      },
      {
        h: 'Why IC3/PDR beat plain k-induction',
        p: [
          'k-induction needs the property itself to be k-inductive for a small k, which real invariants rarely are. IC3 keeps a sequence of over-approximations F0 = I, F1, ..., Fk of the states reachable in at most i steps. When a bad state is reachable from Fk in one step, it recursively tries to block that state in earlier frames using small SAT queries; each blocked state is generalized to a clause and pushed forward. When two adjacent frames become equal, that frame is an inductive invariant: a proof. It never unrolls the transition relation more than one step, so its queries stay small.',
          'Software analogue: Z3\'s Spacer engine solves constrained Horn clauses, the format SeaHorn and JayHorn use to verify C and Java programs. Loop invariants come out as the solution of the Horn clauses.'
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: 'Nami Unrolls the Chart One Day at a Time',
      text: [
        'The crew wants to know if the Sunny can ever end up with both Luffy and Zoro asleep on lookout at the same time. Usopp wants to just sail and see (testing). Nami refuses: she lays out a chart with one column per day, writes the starting positions in column 0, and for each day writes down only the moves the rules allow from the day before.',
        'On day 4 she finds it: Luffy checks the crow\'s nest is empty, Zoro checks too before Luffy climbs, then both climb. That column is the counterexample, and she can show the exact sequence. After the crew adds a rule that checking and climbing happen in a single motion, she checks 10 days and finds nothing, but Robin points out that 10 days says nothing about day 11.',
        'So Robin proves a stronger fact: "the rope is down exactly when someone is up there or on the ladder." It holds on day 0, and any single legal move keeps it true. That one-step argument covers every day forever, and it implies the original rule.'
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Roommate Agreement Has Unreachable States',
      text: [
        'Sheldon tries to prove the Roommate Agreement can never lead to both of them using the bathroom at once by assuming "nobody is double-booked right now" and showing it stays true after any one action. Leonard finds a hole: from a state where both have a pending reservation and the sign-up board is wiped, one action breaks the rule.',
        'Sheldon protests that this state can never occur. Leonard: "Then put that in the invariant." Sheldon adds a clause saying the board is marked exactly when someone holds a slot, and the one-step proof goes through. Leonard\'s hole was a counterexample to induction, not a real bug.'
      ]
    },
    why: 'Nami\'s day-by-day columns are bounded model checking: copies of the state per step, with the rules as the transition relation, and the day-4 column as the counterexample. Robin\'s one-step argument is induction, and Leonard\'s "impossible" state is a CTI that forces you to strengthen the invariant. That is exactly the BMC, then k-induction, then strengthening loop.'
  },
  storyAnim: {
    h: 240,
    props: [
      { id: 'chart', emoji: '🗺️', label: 'day columns s0..sk', x: 10, y: 14 },
      { id: 'nest', emoji: '🪜', label: 'crow\'s nest', x: 86, y: 14 },
      { id: 'solver', emoji: '🧮', label: 'SAT/SMT', x: 50, y: 84 },
      { id: 'proof', emoji: '📜', label: 'invariant', x: 88, y: 82 }
    ],
    actors: [
      { id: 'nami', emoji: '🧭', label: 'Nami', x: 12, y: 50 },
      { id: 'luffy', emoji: '👒', label: 'Luffy (p0)', x: 40, y: 40 },
      { id: 'zoro', emoji: '⚔️', label: 'Zoro (p1)', x: 40, y: 64 },
      { id: 'robin', emoji: '📚', label: 'Robin', x: 70, y: 84 }
    ],
    steps: [
      { c: 'Nami writes the initial state in column 0: both idle, nest empty. That is I(s0).', p: { chart: 'lit' } },
      { c: 'Each new column may only follow the rules from the previous one: T(s_i, s_i+1). Zoro checks the nest: empty.', a: { zoro: [55, 60] } },
      { c: 'Luffy also checks before Zoro climbs. Nobody has set the rope yet, because checking and climbing are separate moves.', a: { luffy: [55, 36] } },
      { c: 'Day 3 and 4: both climb. Column 4 violates "never both up". The solver says sat, and the model is the trace.', a: { luffy: [80, 22], zoro: [84, 34] }, p: { nest: 'bad', solver: 'lit' }, l: { solver: 'sat: depth 4' } },
      { c: 'Fix: check-and-climb is one atomic move. BMC to depth 10 is unsat. Good, but bounded.', a: { luffy: [40, 40], zoro: [40, 64] }, p: { nest: 'good' }, l: { solver: 'unsat up to k=10' } },
      { c: 'Robin tries induction on "never both up" alone: a weird unreachable state breaks the step. That is a CTI.', a: { robin: [68, 60] }, p: { proof: 'bad' }, l: { proof: 'CTI found' } },
      { c: 'She strengthens: rope down exactly when someone is past idle. Now one step always preserves it: proved for every day.', p: { proof: 'good', solver: 'good' }, l: { proof: 'inductive!' } }
    ]
  },
  conceptFlow: {
    title: 'From a transition system to a verdict',
    intro: 'BMC finds bugs; k-induction (or IC3) turns "no bug yet" into a proof.',
    stages: [
      { label: 'Model', nodes: [ { id: 'ts', text: 'I(s), T(s,s\')\nstate = vector of vars' }, { id: 'prop', text: 'Property P\nsafety: G P' } ] },
      { label: 'Unroll', nodes: [ { id: 'unroll', text: 'copies s0..sk\nI(s0) and T(s_i,s_i+1)' }, { id: 'neg', text: 'and not P(sk)' } ] },
      { label: 'Solve', nodes: [ { id: 'sat', text: 'SAT\nmodel = trace' }, { id: 'unsat', text: 'UNSAT\nno bug at depth k' } ] },
      { label: 'Prove', nodes: [ { id: 'kind', text: 'k-induction step\nP on k states => P next' }, { id: 'cti', text: 'CTI?\nstrengthen invariant' }, { id: 'done', text: 'Proved for all depths' } ] }
    ],
    steps: [
      { active: ['ts'], note: 'Write the system symbolically: a formula for initial states and a formula relating a state to its successor (including frame conditions).' },
      { active: ['prop'], note: 'State a safety property P over a single state, such as mutual exclusion.' },
      { active: ['unroll'], note: 'Make k+1 fresh copies of the state variables and chain them with T.' },
      { active: ['neg'], note: 'Ask for a violation at the last step. The whole thing is one SAT/SMT formula.' },
      { active: ['sat'], note: 'Satisfiable: the model gives values for s0..sk, a concrete, replayable counterexample.' },
      { active: ['unsat'], note: 'Unsatisfiable: no violation of length k. Increase k, or try to prove.' },
      { active: ['kind'], note: 'Inductive step: from any k consecutive P-states (not necessarily reachable), can the next one violate P?' },
      { active: ['cti'], note: 'If yes, the model is a counterexample to induction. Raise k, add simple-path constraints, or strengthen P with an auxiliary invariant.' },
      { active: ['done'], note: 'When base and step both hold, P holds in every reachable state, for every depth.' }
    ]
  },
  tech: [
    {
      q: 'Why does each time step need its own fresh copy of every variable?',
      a: 'An SMT variable has one value per model. If you reused <code>x</code> for every step, <code>x == x + 1</code> would just be unsat. Making <code>x_0, x_1, ..., x_k</code> turns the time dimension into separate unknowns, so the solver picks a value for each step at once. That is also why BMC formula size grows linearly with k, and why CBMC first converts programs to SSA form: SSA is exactly this per-assignment renaming.'
    },
    {
      q: 'What is a frame condition and what happens if you forget it?',
      a: 'In an interleaving model, when process 0 moves, you must say that process 1\'s variables are unchanged (<code>p1\' == p1</code>). If you leave them out, they are unconstrained, and the solver may change them arbitrarily in the same step. The checker then reports bogus counterexamples (or, worse, if you over-constrain elsewhere, hides real ones). TLA+ makes this explicit with <code>UNCHANGED &lt;&lt;x, y&gt;&gt;</code>.'
    },
    {
      q: 'Is the BMC encoding "not P at step k" or "not P at some step up to k"?',
      a: 'Both are used. Checking only the last step and iterating k = 0, 1, 2, ... finds a shortest counterexample, and each query is small. Asserting <code>Or(not P(s0), ..., not P(sk))</code> covers all depths up to k in one query. Incremental solvers (Z3 push/pop, or assumptions) let you reuse learned clauses across k, which is what production BMC engines do.'
    },
    {
      q: 'Why is a TLA+ spec not the same as code, and why does AWS use it anyway?',
      a: 'TLA+ describes a design at the level of messages, nodes and state, with no compiler and no generated code. Its value is finding design bugs (race conditions, recovery bugs in replication protocols) before code exists, where they are cheapest. The cost is that nothing guarantees the implementation matches the spec; teams address that with careful review, trace validation, or model-based testing.'
    }
  ],
  code: {
    title: 'BMC and k-induction for a two-process lock, in Z3',
    intro: 'Run with <code>pip install --user z3-solver</code> then <code>python3 bmc.py</code>. The output below was produced by running this file. The buggy lock separates "check the lock" from "take the lock"; the fixed one does test-and-set atomically.',
    code: `# bmc.py -- bounded model checking + k-induction of a 2-process lock, with Z3.
from z3 import Int, Bool, Solver, And, Or, Not, sat

IDLE, READY, CRIT = 0, 1, 2

def state(k):
    """Fresh copy of the state variables for time step k."""
    return {"p0": Int(f"p0_{k}"), "p1": Int(f"p1_{k}"), "lock": Bool(f"lock_{k}")}

def init(s):
    return And(s["p0"] == IDLE, s["p1"] == IDLE, Not(s["lock"]))

def step_proc(me, other, s, t, atomic):
    """Process me moves; other stays put (interleaving + frame condition)."""
    frame = t[other] == s[other]
    if atomic:   # FIXED: test-and-set in one step
        acquire = And(s[me] == IDLE, Not(s["lock"]), t[me] == READY, t["lock"])
        enter   = And(s[me] == READY, t[me] == CRIT, t["lock"] == s["lock"])
    else:        # BUGGY: test in one step, set in the next
        acquire = And(s[me] == IDLE, Not(s["lock"]), t[me] == READY, t["lock"] == s["lock"])
        enter   = And(s[me] == READY, t[me] == CRIT, t["lock"])
    release = And(s[me] == CRIT, t[me] == IDLE, Not(t["lock"]))
    return And(frame, Or(acquire, enter, release))

def trans(s, t, atomic):
    return Or(step_proc("p0", "p1", s, t, atomic), step_proc("p1", "p0", s, t, atomic))

def safe(s):
    return Not(And(s["p0"] == CRIT, s["p1"] == CRIT))

def bmc(max_k, atomic):
    """Is a bad state reachable in exactly k steps, for k = 0..max_k?"""
    for k in range(max_k + 1):
        S = [state(i) for i in range(k + 1)]
        sol = Solver()
        sol.add(init(S[0]))
        for i in range(k):
            sol.add(trans(S[i], S[i + 1], atomic))
        sol.add(Not(safe(S[k])))
        if sol.check() == sat:
            m = sol.model()
            trace = [(m.eval(s["p0"]), m.eval(s["p1"]), m.eval(s["lock"])) for s in S]
            return k, trace
    return None, None

def k_induction(k, atomic, inv):
    """Base: no violation in < k steps from init. Step: k consecutive inv-states
    connected by trans force the next state to satisfy inv."""
    S = [state(i) for i in range(k + 1)]
    base = Solver()
    base.add(init(S[0]))
    for i in range(k - 1):
        base.add(trans(S[i], S[i + 1], atomic))
    base.add(Or([Not(inv(S[i])) for i in range(k)]))
    if base.check() == sat:
        return "base case fails: real counterexample"
    step = Solver()
    for i in range(k):
        step.add(inv(S[i]), trans(S[i], S[i + 1], atomic))
    step.add(Not(inv(S[k])))
    if step.check() == sat:
        return "inductive step fails (CTI found) -- strengthen inv or raise k"
    return "PROVED for all depths"

if __name__ == "__main__":
    k, trace = bmc(10, atomic=False)
    print("buggy lock: violation at depth", k)
    for i, st in enumerate(trace):
        print("  step", i, "p0=%s p1=%s lock=%s" % st)
    print("fixed lock: BMC up to depth 10 ->", bmc(10, atomic=True)[0])
    print("fixed lock, k=1, inv=safe       :", k_induction(1, True, safe))
    def strong(s):   # lock held iff someone is past IDLE, plus mutual exclusion
        busy = Or(s["p0"] != IDLE, s["p1"] != IDLE)
        one = Not(And(s["p0"] != IDLE, s["p1"] != IDLE))
        rng = And(s["p0"] >= 0, s["p0"] <= 2, s["p1"] >= 0, s["p1"] <= 2)
        return And(rng, s["lock"] == busy, one)
    print("fixed lock, k=1, inv=strengthened:", k_induction(1, True, strong))

# ---- actual output ----
# buggy lock: violation at depth 4
#   step 0 p0=0 p1=0 lock=False
#   step 1 p0=0 p1=1 lock=False
#   step 2 p0=1 p1=1 lock=False
#   step 3 p0=1 p1=2 lock=True
#   step 4 p0=2 p1=2 lock=True
# fixed lock: BMC up to depth 10 -> None
# fixed lock, k=1, inv=safe       : inductive step fails (CTI found) -- strengthen inv or raise k
# fixed lock, k=1, inv=strengthened: PROVED for all depths`,
    notes: [
      'The depth-4 trace is a shortest counterexample because k is increased one at a time.',
      'With inv=safe the step fails for every k from 1 to 8 (checked): the unreachable states (READY, READY, lock) -> (CRIT, READY, lock) -> (IDLE, READY, free) -> (READY, READY, lock) form a cycle of safe states that can be unrolled to any length, and from (CRIT, READY, lock) process 1 can step into CRIT. A simple-path constraint or the strengthened invariant fixes it.',
      'The strengthened invariant includes a range constraint on p0/p1 because they are unbounded Ints; without it, the solver could start the step from p0 = 7.',
      'The strengthened invariant implies mutual exclusion, so proving it proves the original property.'
    ]
  },
  lab: {
    title: 'Write your own BMC loop',
    prompt: 'A counter starts at <code>x = 0</code>; each step <code>x\' = x + 2</code> if <code>x &lt; 6</code>, else <code>x\' = 0</code>. The property is <code>x != 4</code>. Complete <code>bmc(max_k)</code>: for each k, create fresh variables <code>x_0..x_k</code>, assert init, k transitions and the negated property at step k, and return the depth and trace on <code>sat</code>. Expected output: <code>(2, [0, 2, 4])</code>.',
    starter: `from z3 import Int, Solver, Not, If, sat

def x(k):
    return Int(f"x_{k}")       # one fresh variable per time step

def init(v):
    return v == 0

def trans(v, w):
    return w == If(v < 6, v + 2, 0)

def prop(v):
    return v != 4

def bmc(max_k):
    for k in range(max_k + 1):
        s = Solver()
        # TODO: add init for step 0
        # TODO: add trans for steps 0..k-1
        # TODO: add the NEGATED property at step k
        # TODO: if sat, return k and the trace from the model
    return None

print(bmc(10))
`,
    checks: [
      { re: 'Int\\(f"x_\\{k\\}"\\)', flags: '', must: true, hint: 'Use a fresh variable per step: Int(f"x_{k}")', pass: 'fresh per-step variables' },
      { re: 's\\.add\\(\\s*init\\(\\s*x\\(0\\)\\s*\\)\\s*\\)', flags: '', must: true, hint: 'Assert the initial condition on x(0): s.add(init(x(0)))', pass: 'initial state asserted' },
      { re: 'for\\s+i\\s+in\\s+range\\(\\s*k\\s*\\)\\s*:\\s*\\n\\s*s\\.add\\(\\s*trans\\(\\s*x\\(i\\)\\s*,\\s*x\\(i\\s*\\+\\s*1\\)\\s*\\)\\s*\\)', flags: '', must: true, hint: 'Chain k transitions: for i in range(k): s.add(trans(x(i), x(i + 1)))', pass: 'transition relation unrolled' },
      { re: 's\\.add\\(\\s*Not\\(\\s*prop\\(\\s*x\\(k\\)\\s*\\)\\s*\\)\\s*\\)', flags: '', must: true, hint: 'Ask for a violation at the last step: s.add(Not(prop(x(k))))', pass: 'negated property at step k' },
      { re: 's\\.check\\(\\)\\s*==\\s*sat', flags: '', must: true, hint: 'Test s.check() == sat', pass: 'sat check' },
      { re: '\\.model\\(\\)', flags: '', must: true, hint: 'Read the counterexample from s.model()', pass: 'trace extracted from the model' },
      { re: 'TODO', flags: '', must: false, hint: 'Remove the TODO lines once implemented', pass: 'no TODOs left' }
    ],
    run: 'Save as <code>lab_bmc.py</code>, then <code>pip install --user z3-solver</code> and <code>python3 lab_bmc.py</code>. It should print <code>(2, [0, 2, 4])</code>. Then change the property to <code>v != 5</code> (unreachable: x is always even) and confirm it prints <code>None</code>. Finally, try proving <code>v % 2 == 0</code> with 1-induction: assert <code>prop(x(0))</code>, <code>trans(x(0), x(1))</code>, <code>Not(prop(x(1)))</code> and check that it is unsat.',
    solution: `from z3 import Int, Solver, Not, If, sat

def x(k):
    return Int(f"x_{k}")       # one fresh variable per time step

def init(v):
    return v == 0

def trans(v, w):
    return w == If(v < 6, v + 2, 0)

def prop(v):
    return v != 4

def bmc(max_k):
    for k in range(max_k + 1):
        s = Solver()
        s.add(init(x(0)))
        for i in range(k):
            s.add(trans(x(i), x(i + 1)))
        s.add(Not(prop(x(k))))
        if s.check() == sat:
            m = s.model()
            return k, [m.eval(x(i)) for i in range(k + 1)]
    return None

print(bmc(10))
`,
    notes: [
      'This exact solution was run with z3-solver and printed (2, [0, 2, 4]).',
      'Notice the solver also found the trace values for you; that is the selling point of BMC over a proof that only says "false".',
      'x != 5 is never violated, but BMC alone can only say "not up to depth 10". The parity invariant v % 2 == 0 is 1-inductive and proves it outright.'
    ]
  },
  quiz: [
    {
      q: 'Which property is expressible in CTL but not in LTL?',
      options: ['G !(c0 and c1)', 'G (req -> F grant)', 'AG EF reset: from every reachable state it is possible to reach reset', 'F G stable'],
      correct: 2,
      explain: 'AG EF reset needs an existential path quantifier nested under a universal one; LTL quantifies over all paths only. F G p is the classic LTL-only property.'
    },
    {
      q: 'What does a counterexample to a liveness property look like?',
      options: ['A single bad state', 'A finite path ending in a bad state', 'A lasso: a finite stem followed by a cycle in which the good event never happens', 'There are no counterexamples to liveness'],
      correct: 2,
      explain: 'A finite prefix cannot violate "eventually", since the event could still happen. The witness is an infinite path, which in a finite model is a lasso.'
    },
    {
      q: 'BMC returns unsat for every k up to 50. What can you conclude?',
      options: ['The property holds for all executions', 'No violation exists within 50 steps; nothing about longer executions unless 50 reaches the completeness threshold', 'The model is wrong', 'The property is a liveness property'],
      correct: 1,
      explain: 'BMC is bounded. It becomes a proof only past the completeness threshold (for example the recurrence diameter), or when combined with k-induction or IC3.'
    },
    {
      q: 'The k-induction step query is sat but BMC never finds a bug. What is the likely cause?',
      options: ['Z3 is unsound', 'The property is not inductive: the solver found an unreachable state (a CTI) that steps to a violation; strengthen the invariant or increase k', 'The base case is wrong', 'The transition relation is total'],
      correct: 1,
      explain: 'The step starts from arbitrary property-satisfying states, including unreachable ones. A CTI means the invariant is too weak, exactly like a weak loop invariant in Hoare logic.'
    },
    {
      q: 'In CBMC, what does --unwinding-assertions add?',
      options: ['Faster solving', 'An assertion that each loop really exits within the --unwind bound, so success becomes a proof instead of "no bug in the first N iterations"', 'Overflow checks', 'Automatic loop invariants'],
      correct: 1,
      explain: 'Without it, deeper paths are silently cut off. With it, insufficient unwinding is reported as a failure.'
    }
  ],
  testFlow: {
    title: 'Pick the right technique',
    start: 'q1',
    nodes: {
      q1: { q: 'You need to find a deadlock in a C implementation of a ring buffer, and a concrete trace would be ideal. First tool?', choices: [ { text: 'BMC (CBMC with a small --unwind)', to: 'q1ok' }, { text: 'Write a Lean proof', to: 'q1bad' } ] },
      q1ok: { end: true, correct: true, text: 'Right: shallow bugs with readable traces are BMC\'s sweet spot.', next: 'q2' },
      q1bad: { end: true, correct: false, text: 'A proof attempt will fail without telling you the bug. Find it first with BMC.', retry: 'q1' },
      q2: { q: 'BMC is clean to depth 30 and you need a guarantee for all depths. Next step?', choices: [ { text: 'Run BMC to depth 60', to: 'q2bad' }, { text: 'k-induction or IC3/PDR, strengthening the invariant on CTIs', to: 'q2ok' } ] },
      q2ok: { end: true, correct: true, text: 'Yes. Induction is what turns bounded evidence into a proof.', next: 'q3' },
      q2bad: { end: true, correct: false, text: 'Still bounded. Deeper BMC never becomes a proof unless you hit the completeness threshold.', retry: 'q2' },
      q3: { q: 'You want to check that a new replication protocol design never loses acknowledged writes, before any code exists. Tool?', choices: [ { text: 'TLA+ with TLC', to: 'q3ok' }, { text: 'CBMC', to: 'q3bad' } ] },
      q3ok: { end: true, correct: true, text: 'Correct: TLA+ is for designs, and TLC explores interleavings and failures exhaustively for small instances.' },
      q3bad: { end: true, correct: false, text: 'CBMC needs C code. For a design, write a TLA+ spec.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Forgetting frame conditions in an interleaving model, so variables of the non-moving process change arbitrarily and you get spurious counterexamples.',
    'Reporting "verified" from BMC or CBMC without --unwinding-assertions: it only means no bug within the bound.',
    'Checking liveness without fairness: the scheduler starves a process and every liveness property "fails" for an uninteresting reason. Conversely, too-strong fairness can hide real starvation.',
    'Reading a CTI from k-induction as a real bug. Confirm with BMC from the initial state first; if BMC cannot reach it, strengthen the invariant.',
    'Making a TLA+ model so large (many nodes, unbounded counters) that TLC never finishes. Check small instances (2-3 nodes) and use symmetry sets; most protocol bugs show up at small sizes.'
  ],
  interview: [
    {
      q: 'Explain bounded model checking to someone who knows SAT solvers but not model checking.',
      a: 'Describe the system with an initial-state formula I(s) and a transition formula T(s, s\'). To ask "can a bad state be reached in k steps", make k+1 copies of all state variables and assert I(s0), T(s0,s1), ..., T(s(k-1),sk), and not P(sk). That is one SAT/SMT instance. If it is satisfiable, the model gives a concrete value for every variable at every step: a counterexample trace you can replay. If unsatisfiable, there is no bug of that length, and you try k+1. It is excellent at finding bugs and gives shortest traces, but it is not a proof unless k reaches the completeness threshold; for that you add k-induction or IC3.'
    },
    {
      q: 'What is the difference between LTL and CTL? Give a property only one can express.',
      a: 'LTL formulas describe individual paths, and a model satisfies one if all paths do. CTL formulas describe the computation tree, and each temporal operator is paired with A (all paths) or E (exists a path). AG EF reset ("from every reachable state, some continuation reaches reset") is CTL-only, because it needs an existential path quantifier. F G p ("eventually p holds forever on every path") is LTL-only; AF AG p is strictly stronger. Algorithmically CTL checking is linear in model and formula size; LTL is linear in the model and exponential in the formula via Buchi automata. CTL* subsumes both.'
    },
    {
      q: 'Safety vs liveness: define both, and explain how each is checked.',
      a: 'Safety says something bad never happens; any violation has a finite witness, so checking it is a reachability problem: BMC, IC3, or explicit BFS like TLC. Liveness says something good eventually happens; a violation is an infinite path, a lasso in a finite model, so you search for accepting cycles (nested DFS in SPIN, lasso-shaped BMC) or reduce liveness to safety. Liveness almost always needs fairness assumptions, and choosing weak vs strong fairness correctly is part of the modeling.'
    },
    {
      q: 'Your k-induction proof fails at the inductive step, but BMC to depth 100 finds no bug. What do you do?',
      a: 'The failing step gives a counterexample to induction: a state satisfying P that steps to not-P. I would first check whether that state is reachable (BMC from init, or reason about it). If it is unreachable, P is true but not inductive, and I strengthen it with an auxiliary invariant that rules out the CTI, for example a relationship between a lock bit and process states, then retry. Other options: increase k, add a simple-path constraint so unreachable loops cannot be unrolled, or switch to IC3/PDR, which learns those strengthening clauses automatically. This is the same skill as finding a loop invariant in Dafny.'
    },
    {
      q: 'Explain a tradeoff: explicit-state (TLC, SPIN) vs symbolic (BDD, SAT-based) model checking.',
      a: 'Explicit-state checkers enumerate and hash concrete states. They handle rich data types and complex specs easily, give clear traces, support partial-order and symmetry reduction, and are predictable, but memory grows with the number of reachable states, so large data domains blow up. Symbolic checkers represent sets of states as BDDs or formulas; they can handle astronomically many states when structure is regular (hardware), and SAT-based BMC/IC3 scale to wide data paths, but performance is less predictable (BDD variable ordering, solver timeouts) and the input language is usually more restricted. For a distributed protocol design I would use TLC on small instances; for a circuit or C code, SAT-based engines.'
    },
    {
      q: 'Whiteboard: model a two-process mutual exclusion protocol and show how you would check it.',
      a: 'State: pc0, pc1 in {idle, ready, crit} and a shared lock bit. Init: both idle, lock false. Transitions are interleaved: one process moves and the other\'s pc is unchanged. Acquire: idle to ready if lock is false, setting lock (atomically, otherwise there is a race). Enter: ready to crit. Release: crit to idle, lock false. Safety: G not(pc0 = crit and pc1 = crit). Liveness: G(pc_i = idle implies F pc_i = crit) under fairness. Check safety with BMC (the non-atomic version fails at depth 4: both test, both enter) and prove it with k-induction using the strengthened invariant "lock iff some process is past idle". Check liveness with TLC; with only weak fairness it fails with a starvation lasso, which motivates Peterson\'s algorithm or strong fairness.'
    },
    {
      q: 'What does CBMC actually guarantee when it prints VERIFICATION SUCCESSFUL?',
      a: 'That no checked property (user assertions plus enabled built-in checks like --bounds-check, --pointer-check, --signed-overflow-check) can fail on any path within the loop unwinding bound, for all values of nondeterministic inputs that satisfy the __CPROVER_assume constraints. If --unwinding-assertions is on and passes, the bound is sufficient, so it is a full proof for those inputs. Caveats: it is relative to the harness (what you assumed about inputs and environment), to the modeled library functions, and to the checks you enabled.'
    },
    {
      q: 'How do you fight state explosion in practice?',
      a: 'Shrink the model first: small instance sizes (2-3 processes), abstract data to the values that matter, and symmetry sets. Then use the right engine: partial-order reduction for asynchronous systems (SPIN), symbolic BDDs or SAT-based IC3 for hardware, BMC for bug hunting. For software, predicate abstraction with CEGAR (SLAM, CPAchecker) builds a small boolean model and refines it only when a counterexample turns out to be spurious. Compositional reasoning (assume-guarantee) checks components separately. And state the property locally so cone-of-influence reduction can drop irrelevant variables.'
    }
  ]
};
