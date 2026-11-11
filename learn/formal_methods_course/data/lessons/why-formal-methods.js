window.LESSONS = window.LESSONS || {};
window.LESSONS['why-formal-methods'] = {
  id: 'why-formal-methods',
  title: 'Why Formal Methods: Testing vs Proving, Soundness, Completeness & the Landscape',
  category: 'Part 0 — Logic Foundations',
  timeMin: 30,
  summary: "Tests sample a program's behavior; formal methods reason about all of it at once. This lesson sets up the vocabulary every later lesson leans on: what a specification is, what it means for an analysis to be sound or complete, why Rice's theorem forces every practical tool to give one of them up, and how the landscape (SAT/SMT solvers, model checkers, abstract interpreters, auto-active verifiers, interactive provers) splits along automation and expressiveness. You finish by watching 100,000 random tests miss a real overflow bug that Z3 finds in milliseconds.",
  goals: [
    "Explain the difference between testing (under-approximation of behaviors) and verification (reasoning about all behaviors) with a concrete example",
    "Define soundness and completeness precisely for both bug-finders and provers, and say which way a given tool errs",
    "Use Rice's theorem and decidability to explain why no static analyzer is simultaneously sound, complete and terminating for all programs",
    "Place SAT/SMT, bounded model checking, abstract interpretation, Dafny-style verifiers and Lean/Coq/Isabelle on an automation-vs-expressiveness map",
    "Use the validity-by-negation trick: a property P is proved when the solver reports Not(P) unsat"
  ],
  concept: [
    {
      h: "Testing samples, verification quantifies",
      p: [
        "A test checks one input. A property-based test (Hypothesis, QuickCheck, jqwik) checks a few thousand random inputs. Either way you are evaluating <code>P(x)</code> on a finite sample of an input space that, for two 32-bit ints, has 2<sup>64</sup> points. Dijkstra's line is the summary: <i>testing can show the presence of bugs, never their absence</i>.",
        "Formal verification replaces the sample with a quantifier: prove <code>∀x. pre(x) ⇒ post(f(x))</code>. The program is turned into a logical formula (its semantics), the requirement into another (the specification), and a decision procedure or proof checker establishes the implication for every input at once.",
        "The practical payoff is in bugs that live in tiny corners of the input space. The binary-search midpoint bug <code>mid = (lo + hi) / 2</code> sat in the JDK's <code>Arrays.binarySearch</code> for about nine years (Joshua Bloch's 2006 post): it only fires when <code>lo + hi</code> exceeds 2<sup>31</sup>-1, i.e. arrays with more than about a billion elements. Random tests on realistic sizes essentially never reach it; an SMT query over 32-bit bit-vectors finds it immediately."
      ]
    },
    {
      h: "Specifications: you can only prove what you wrote down",
      p: [
        "Verification is always relative to a specification. A spec can be partial (\"never dereferences null\", \"no integer overflow\", \"no assertion fails\") or functional (\"returns the input sorted, as a permutation\"). Most industrial wins are partial specs: memory safety, absence of runtime errors, protocol invariants.",
        "The gap between the spec and what you actually wanted is called the <b>specification problem</b>, and it is where proved-correct systems still go wrong. A sorting function proved to return a sorted list is still wrong if it returns <code>[]</code>; the spec forgot \"is a permutation of the input\". In interviews, mentioning that verification moves trust from the code to the spec (plus the tool's trusted computing base) signals maturity.",
        "<div class=\"card\"><b>Trusted computing base (TCB):</b> what you must trust for a proof to mean anything. For Z3: the encoding of your program into logic plus Z3 itself. For Lean or Coq: the small kernel that re-checks proof terms (the de Bruijn criterion), not the tactics that found them. For Dafny: the Dafny-to-Boogie translation, Boogie's VC generator and Z3.</div>"
      ]
    },
    {
      h: "Soundness and completeness, stated carefully",
      p: [
        "These two words flip meaning depending on whether the tool is a <i>prover</i> (claims \"no bugs\") or a <i>bug finder</i> (claims \"here is a bug\"), so always state them relative to the claim the tool makes.",
        "<table><tr><th>Tool kind</th><th>Sound means</th><th>Complete means</th><th>Typical failure</th></tr><tr><td>Verifier / prover (Dafny, Astrée, abstract interpreters)</td><td>If it says \"safe\", the program really is safe (no missed bugs)</td><td>If the program is safe, it can say so (no false alarms)</td><td>False positives</td></tr><tr><td>Bug finder (testing, fuzzing, KLEE, bounded MC)</td><td>Every reported bug is real (no false alarms)</td><td>Finds every bug</td><td>Missed bugs (false negatives)</td></tr></table>",
        "So testing is sound for bugs (a failing test is a real failure, flakiness aside, which is your research area) but wildly incomplete. An abstract interpreter like Astrée is sound for absence of runtime errors but incomplete, so it reports alarms that a human must triage. Many industrial static analyzers (Infer in some modes, Coverity, most linters) are deliberately <i>neither</i>, trading both for low noise: the \"soundy\" position (Livshits et al., CACM 2015).",
        "A useful exercise: for every tool you mention in an interview, say which direction it errs. That one sentence often separates a strong answer from a vague one."
      ]
    },
    {
      h: "Decidability and Rice's theorem: why the tradeoff is forced",
      p: [
        "Rice's theorem: every non-trivial semantic property of programs (one that depends on behavior, not syntax, and is true of some programs and false of others) is undecidable. \"Does this program ever divide by zero?\" is such a property. So no analyzer can be sound, complete <i>and</i> always terminate on arbitrary Turing-complete programs.",
        "Every practical tool escapes in one of three ways: (1) give up completeness by over-approximating (abstract interpretation, type systems: may reject safe programs); (2) give up soundness by under-approximating (testing, fuzzing, bounded model checking, symbolic execution with a path budget); (3) give up automation and ask a human for invariants or proofs (Dafny annotations, Lean tactics).",
        "Logics have the same structure. Propositional SAT is decidable (NP-complete). Linear integer arithmetic (Presburger) is decidable. Add multiplication of variables and you get Peano arithmetic, which is undecidable (Gödel, and Hilbert's tenth problem: Matiyasevich 1970 showed nonlinear integer equations are undecidable). First-order logic is semi-decidable: valid formulas can be proved eventually, invalid ones may loop forever. That is exactly why Z3 can answer <code>unknown</code>."
      ]
    },
    {
      h: "The landscape on one map",
      p: [
        "Think of two axes: how much the tool does automatically, and how expressive the properties are.",
        "<ul><li><b>SAT / SMT solvers</b> (MiniSat, CaDiCaL, Kissat; Z3, cvc5, Yices, Bitwuzla): fully automatic decision procedures for propositional logic plus theories (integers, bit-vectors, arrays). The engine under most other tools.</li><li><b>Symbolic execution and concolic testing</b> (KLEE, angr, SAGE): explore program paths, solve path conditions with SMT to generate inputs. Bug finders.</li><li><b>Model checkers</b> (SPIN, NuSMV/nuXmv, TLC for TLA+, CBMC for bounded C): exhaustively explore a finite (or bounded) state space against temporal properties; return a counterexample trace on failure.</li><li><b>Abstract interpretation</b> (Astrée, Frama-C EVA, NASA's IKOS, Mopsa): compute over-approximations of reachable states in abstract domains (intervals, octagons, polyhedra). Sound, automatic, imprecise.</li><li><b>Auto-active verifiers</b> (Dafny, Why3, Viper, Verus, F*, SPARK): you write specs and loop invariants, the tool generates verification conditions and discharges them with SMT.</li><li><b>Interactive theorem provers</b> (Lean 4, Coq/Rocq, Isabelle/HOL, HOL4, Agda): higher-order logic or dependent types, arbitrary math, small trusted kernel, you drive the proof. CompCert (Coq) and seL4 (Isabelle) are the flagship verified systems.</li></ul>",
        "Automation goes down the list; expressiveness goes up. Most real projects combine layers: Lean's <code>omega</code> and <code>decide</code> tactics, Isabelle's Sledgehammer calling SMT and ATP provers, Dafny calling Z3, CBMC calling a SAT solver."
      ]
    },
    {
      h: "The one trick to remember: validity is unsatisfiability of the negation",
      p: [
        "Solvers answer <i>satisfiability</i>: is there an assignment making F true? To prove that P holds for all inputs (validity), assert <code>Not(P)</code> and check. <code>unsat</code> means no counterexample exists, so P is valid. <code>sat</code> hands you a concrete counterexample in the model. <code>unknown</code> means the solver gave up (timeout, nonlinear arithmetic, quantifiers).",
        "Every later lesson uses this pattern: equivalence checking (assert the two programs differ), Hoare-logic VCs (assert the VC is false), bounded model checking (assert the property is violated within k steps)."
      ],
      code: `from z3 import Int, Solver, Not, Implies, sat, unsat

x = Int("x")
claim = Implies(x > 2, x * x > 4)   # want: true for every integer x

s = Solver()
s.add(Not(claim))                   # look for a counterexample
print(s.check())                    # unsat  -> the claim is valid over the integers`
    }
  ],
  deepDive: {
    timeMin: 12,
    intro: "The essentials gave you the vocabulary. These are the follow-ups interviewers use to see whether you understand where the lines really are.",
    sections: [
      {
        h: "Over- vs under-approximation as set inclusion",
        p: [
          "Let <code>R</code> be the true set of reachable states and <code>Bad</code> the error states. A sound verifier computes some <code>R′ ⊇ R</code> and proves <code>R′ ∩ Bad = ∅</code>; since R is inside R′, the real program is safe. A false alarm is a state in <code>R′ \\ R</code> that hits Bad. A bug finder computes <code>R″ ⊆ R</code>; any bad state it finds is real, but it can miss bad states in <code>R \\ R″</code>.",
          "Incorrectness logic (O'Hearn, POPL 2020) formalizes the bug-finder side the way Hoare logic formalizes the prover side: an under-approximate triple <code>[p] C [q]</code> says every state in q is reachable from some state in p. It is the theory behind Meta's Pulse analyzer."
        ]
      },
      {
        h: "Decidable fragments are a design tool, not trivia",
        p: [
          "<ul><li>Propositional logic: decidable, NP-complete (Cook-Levin).</li><li>QBF (quantified Boolean formulas): decidable, PSPACE-complete.</li><li>Presburger arithmetic (linear integer arithmetic with quantifiers): decidable, doubly-exponential worst case. Quantifier-free LIA is NP-complete.</li><li>Linear real arithmetic: quantifier-free is polynomial (but solvers use simplex, exponential worst case and fast in practice); with quantifiers decidable via Fourier-Motzkin or Ferrante-Rackoff.</li><li>Nonlinear real arithmetic: decidable (Tarski), via cylindrical algebraic decomposition; Z3's nlsat implements a variant.</li><li>Nonlinear integer arithmetic: undecidable (Hilbert's tenth problem).</li><li>First-order logic: semi-decidable. Effectively propositional (EPR / Bernays-Schönfinkel) fragment: decidable.</li></ul>",
          "Tool designers pick encodings that stay inside decidable fragments when they can. Dafny encourages linear arithmetic in specs; Liquid Haskell restricts refinements to decidable theories so type checking is predictable."
        ]
      },
      {
        h: "Bounded guarantees are real guarantees, with a scope",
        p: [
          "Bounded model checking (CBMC) proves \"no assertion fails on any execution with at most k loop iterations\". That is a full proof over a restricted program, not a sample, so it finds bugs no random test finds. The small scope hypothesis (Jackson, Alloy) argues most bugs show up in small bounds. If the unwinding assertion also holds (no execution needs more than k iterations), the bounded result becomes a full proof.",
          "Similarly, a 32-bit bit-vector proof in Z3 covers every 32-bit input exactly, including overflow, which is why it beats both testing and an unbounded-integer proof for C or Java code."
        ]
      },
      {
        h: "Where formal methods actually ship",
        p: [
          "AWS: Zelkova (SMT-based IAM policy analysis, used by Access Analyzer and S3 Block Public Access), Tiros for network reachability, TLA+ for DynamoDB and S3 protocols (Newcombe et al., CACM 2015), Dafny and later Lean for the Cedar authorization language. Microsoft: SLAM/SDV for Windows drivers, SAGE whitebox fuzzing, Hyper-V verification, Project Everest (verified TLS in F*). Intel and AMD: formal verification of floating-point and cache-coherence after the 1994 Pentium FDIV bug. seL4 (Isabelle), CompCert (Coq), and the Lean-based mathlib show the high-assurance end.",
          "The pattern interviewers like hearing: formal methods win where bugs are expensive, the spec is crisp (policies, protocols, compilers, crypto) and the code changes slowly enough to maintain proofs."
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: "Usopp's Spot Checks vs Nami's Chart",
      text: [
        "The Thousand Sunny has to cross a reef field. Usopp's plan: drop a weighted line over the side a hundred thousand times at random spots. Every drop comes back \"deep enough\". He declares the passage safe.",
        "Nami does something different. She does not sample; she draws the chart: a description of the sea floor that covers every point at once, and she asks one question of it: is there <i>any</i> point on our route shallower than the keel? The chart answers: yes, here, at this exact coordinate, a single spike of coral that none of Usopp's drops happened to land on.",
        "Robin points out that Nami's chart is only as good as the survey behind it (the specification), and that some waters are so complex no chart can be finished (undecidability), so Nami sometimes marks a region \"possibly dangerous\" just to be safe (sound but incomplete). Usopp's line never lies when it hits coral, but it can miss it forever (sound for bugs, incomplete)."
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: "Sheldon Refuses to Accept 'It Worked Every Time I Tried It'",
      text: [
        "Howard says his Mars rover code is correct because he ran it on every test case he could think of. Sheldon asks how many inputs there are. Two 32-bit integers: 18 quintillion. Howard tested 400.",
        "Leonard suggests they just prove it. Sheldon writes the property down, negates it, and asks the solver for a world where the code is wrong. The solver returns a pair of numbers whose sum overflows. Howard objects that nobody would ever pass numbers that big. Sheldon: \"That is exactly what the JDK authors said for nine years.\"",
        "Penny asks whether the solver could just say \"I don't know\". Sheldon admits, painfully, that yes, for some questions it must, and that this is a theorem, not a bug."
      ]
    },
    why: "Usopp's drops and Howard's 400 runs are testing: real failures when they hit, silent when they miss. Nami's chart and Sheldon's negated property are verification: a statement about every input, which either yields a proof (unsat) or a concrete counterexample (sat). The chart's dependence on the survey is the specification problem, and the regions Nami cannot finish are Rice's theorem."
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'reef', emoji: '🪸', label: 'Hidden coral spike', x: 62, y: 70 },
      { id: 'drops', emoji: '🎣', label: 'Random drops: 0 hits', x: 12, y: 18 },
      { id: 'chart', emoji: '🗺️', label: "Nami's chart", x: 86, y: 18 },
      { id: 'verdict', emoji: '❓', label: 'Safe?', x: 50, y: 12 }
    ],
    actors: [
      { id: 'usopp', emoji: '🤥', label: 'Usopp (tests)', x: 14, y: 55 },
      { id: 'nami', emoji: '🧭', label: 'Nami (solver)', x: 86, y: 55 },
      { id: 'ship', emoji: '⛵', label: 'Sunny', x: 40, y: 45 }
    ],
    steps: [
      { c: "The Sunny must cross the reef. Is there any point on the route shallower than the keel?", p: { verdict: 'lit' } },
      { c: "Usopp drops the line at 100,000 random spots. Every one comes back deep. Testing samples the input space.", a: { usopp: [30, 60] }, p: { drops: 'lit' }, l: { drops: '100k drops: all deep' } },
      { c: "He declares the route safe. But the coral spike is a single point none of his drops touched: the (lo + hi) overflow case.", p: { verdict: 'bad' }, l: { verdict: 'Usopp: safe (wrong)' } },
      { c: "Nami does not sample. She writes the route and the keel depth as one formula and asks: does a shallow point exist? That is assert Not(safe).", a: { nami: [72, 50] }, p: { chart: 'lit' } },
      { c: "The chart answers sat, with a model: the exact coordinate of the spike. A counterexample, not a guess.", p: { reef: 'bad', chart: 'good' }, l: { reef: 'sat: lo=2^28, hi=7*2^28' } },
      { c: "Nami reroutes (lo + (hi - lo) / 2) and asks again. Now the answer is unsat: no shallow point exists anywhere on the new route.", a: { ship: [58, 30] }, p: { verdict: 'good' }, l: { verdict: 'unsat: proved safe' } },
      { c: "Robin's caveat: the proof is only as good as the survey (the spec), and some seas cannot be charted at all (Rice's theorem).", p: { chart: 'good', drops: 'dim' } }
    ]
  },
  conceptFlow: {
    title: "From 'does it work?' to a solver verdict",
    intro: "The same pipeline underlies Z3 scripts, Dafny, CBMC and symbolic execution.",
    stages: [
      { label: 'Inputs', nodes: [ { id: 'prog', text: 'Program\nmid = (lo+hi)/2' }, { id: 'spec', text: 'Specification\nlo <= mid <= hi' } ] },
      { label: 'Encode', nodes: [ { id: 'sem', text: 'Semantics as formula\n32-bit BitVec ops' }, { id: 'neg', text: 'Negate the claim\npre AND NOT post' } ] },
      { label: 'Decide', nodes: [ { id: 'solver', text: 'SAT/SMT solver\ncheck()' } ] },
      { label: 'Verdict', nodes: [ { id: 'unsat', text: 'unsat\nproved for ALL inputs' }, { id: 'sat', text: 'sat\nconcrete counterexample' }, { id: 'unk', text: 'unknown\nundecidable / timeout' } ] }
    ],
    steps: [
      { active: ['prog', 'spec'], note: "Start with code and a written-down property. No spec, no proof: verification is always relative to a specification." },
      { active: ['sem'], note: "Translate the code into logic with the right semantics. For Java ints that means 32-bit two's-complement bit-vectors, where addition wraps." },
      { active: ['neg'], note: "Solvers decide satisfiability, so to prove validity we assert the precondition together with the negated postcondition." },
      { active: ['solver'], note: "The decision procedure explores the whole input space symbolically: 2 to the 64 combinations, no sampling." },
      { active: ['sat'], note: "For the buggy midpoint, the answer is sat, and the model gives concrete lo and hi values you can paste into a regression test." },
      { active: ['unsat'], note: "For lo + (hi - lo) / 2 the answer is unsat: no counterexample exists, so the property holds for every input." },
      { active: ['unk'], note: "For undecidable theories (nonlinear integers, quantifiers) the solver may say unknown. That is Rice's theorem showing up in practice." }
    ]
  },
  tech: [
    {
      q: "Why does Z3 answer 'sat' when I am trying to prove something? Isn't sat the good answer?",
      a: "Z3 is a satisfiability checker. When you assert Not(P), sat means there is an assignment making Not(P) true, i.e. a counterexample to P. For proofs you want unsat. Z3's own <code>prove(P)</code> helper wraps exactly this: it asserts Not(P) and prints \"proved\" on unsat or \"counterexample\" plus the model on sat."
    },
    {
      q: "If abstract interpreters are sound, why do companies ship unsound analyzers?",
      a: "Because false positives kill adoption. Google's and Meta's published experience (Sadowski et al., 'Lessons from building static analysis tools at Google', CACM 2018; Distefano et al., 'Scaling static analyses at Facebook', CACM 2019) is that developers ignore tools with high false-positive rates, so those tools trade soundness for precision and report only high-confidence issues at code-review time. Soundness is kept for domains where it pays: avionics (Astrée on Airbus flight software), OS kernels, crypto."
    },
    {
      q: "What exactly is the 'kernel' in Lean or Coq and why do people keep mentioning it?",
      a: "A small type checker that re-checks every proof term. Tactics, automation and even LLM-generated proofs can be arbitrarily buggy, because their output is checked by the kernel before being accepted. This is the de Bruijn criterion: trust only a small, independently checkable core. SMT solvers do not have this by default (you trust all of Z3), which is why proof-producing modes (cvc5 proofs, Z3 proof objects, Alethe format) and proof reconstruction in Isabelle/Lean exist."
    },
    {
      q: "Is a flaky test a soundness or a completeness problem?",
      a: [
        "It breaks the usual assumption that testing is sound for bugs. A flaky failure may not correspond to a real bug in the code under test (it can come from order dependence, timing, or environment), so a test-based bug report can be a false positive. A flaky pass can also hide a real bug (false negative).",
        "Formal methods help here: model checking concurrent code over all interleavings (or stateless model checkers like CHESS/GenMC) turns 'fails 1 in 1000 runs' into a deterministic counterexample schedule."
      ]
    }
  ],
  code: {
    title: "100,000 random tests vs one Z3 query: the binary-search midpoint bug",
    intro: "Install once with <code>pip install --user z3-solver</code>. The script simulates Java's 32-bit signed arithmetic, runs a big random test campaign that passes, then asks Z3 for a counterexample over all 2<sup>64</sup> inputs, then proves the standard fix.",
    code: `# midpoint.py -- run with: python3 midpoint.py
import random
from z3 import BitVec, BitVecVal, Solver, Or, sat

def mid_buggy(lo, hi):
    """(lo + hi) / 2 with Java int semantics: wrap to 32 bits, truncate."""
    s = (lo + hi) & 0xFFFFFFFF
    if s >= 2**31:
        s -= 2**32
    return int(s / 2)

# 1) Testing: realistic array sizes never trigger the overflow
random.seed(0)
for _ in range(100_000):
    n = random.randint(1, 10_000)
    lo = random.randint(0, n - 1)
    hi = random.randint(lo, n - 1)
    assert lo <= mid_buggy(lo, hi) <= hi
print("testing: 100000 random cases passed")

# 2) Verification: is there ANY 0 <= lo <= hi with mid outside [lo, hi]?
lo, hi = BitVec("lo", 32), BitVec("hi", 32)
zero = BitVecVal(0, 32)

def check(mid, name):
    s = Solver()
    s.add(zero <= lo, lo <= hi)       # on BitVec, < and <= are SIGNED
    s.add(Or(mid < lo, mid > hi))     # the negated postcondition
    if s.check() == sat:
        m = s.model()
        print(name, "-> sat, counterexample lo =", m[lo].as_signed_long(),
              "hi =", m[hi].as_signed_long())
    else:
        print(name, "-> unsat: holds for every 32-bit lo, hi")

check((lo + hi) / 2, "(lo + hi) / 2      ")   # / on BitVec is signed division
check(lo + (hi - lo) / 2, "lo + (hi - lo) / 2 ")

# Output (z3-solver 4.x/5.x; the exact counterexample may differ):
# testing: 100000 random cases passed
# (lo + hi) / 2       -> sat, counterexample lo = 268435456 hi = 1879048192
# lo + (hi - lo) / 2  -> unsat: holds for every 32-bit lo, hi`,
    notes: [
      "The counterexample is real: 268435456 + 1879048192 = 2147483648 = 2^31, which wraps to -2^31 in a Java int, and halves to a negative midpoint.",
      "On Z3 bit-vectors, <code>&lt;</code>, <code>&lt;=</code> and <code>/</code> are the signed versions. The unsigned ones are <code>ULT</code>, <code>ULE</code>, <code>UDiv</code> (covered in the bit-vectors lesson).",
      "Had we used <code>Int</code> instead of <code>BitVec</code>, Z3 would prove the buggy version correct, because mathematical integers do not overflow. Choosing the right semantics is part of the specification."
    ]
  },
  lab: {
    title: "Write prove() and catch an overflow that integers hide",
    prompt: "Write a function <code>prove(claim)</code> that returns <code>None</code> when <code>claim</code> is valid and a counterexample model otherwise (raise on <code>unknown</code>). Use it to show: (1) <code>x * x &gt;= 0</code> is valid for an unbounded <code>Int</code>; (2) the same claim fails for a 32-bit <code>BitVec</code>; (3) a 32-bit <code>abs</code> built with <code>If(v &lt; 0, -v, v)</code> can return a negative number.",
    starter: `from z3 import Int, BitVec, Solver, Not, If, sat, unsat

def prove(claim):
    s = Solver()
    # TODO: assert the negation of claim
    # TODO: unsat -> None, sat -> s.model(), otherwise raise
    pass

x = Int("x")
# TODO: print prove(x * x >= 0)

b = BitVec("b", 32)
# TODO: print prove(b * b >= 0)

def abs32(v):
    # TODO
    pass

# TODO: print prove(abs32(b) >= 0)
`,
    checks: [
      { re: 'def\\s+prove\\s*\\(\\s*claim\\s*\\)', flags: '', must: true, hint: 'Define def prove(claim):', pass: 'prove(claim) defined' },
      { re: '\\.add\\s*\\(\\s*Not\\s*\\(\\s*claim\\s*\\)\\s*\\)', flags: '', must: true, hint: 'Validity check: s.add(Not(claim)) and look for a counterexample', pass: 'Negated claim asserted' },
      { re: '==\\s*unsat[\\s\\S]*return\\s+None', flags: '', must: true, hint: 'If check() == unsat, the claim is valid: return None', pass: 'unsat means proved' },
      { re: 'return\\s+s\\.model\\s*\\(\\s*\\)', flags: '', must: true, hint: 'On sat, return s.model() as the counterexample', pass: 'Counterexample model returned' },
      { re: 'raise\\s+\\w+', flags: '', must: true, hint: 'Do not silently treat unknown as proved: raise an exception', pass: 'unknown is not treated as success' },
      { re: 'BitVec\\s*\\(\\s*["\']b["\']\\s*,\\s*32\\s*\\)', flags: '', must: true, hint: 'Use a 32-bit bit-vector: BitVec("b", 32)', pass: '32-bit BitVec used' },
      { re: 'If\\s*\\(\\s*v\\s*<\\s*0\\s*,\\s*-\\s*v\\s*,\\s*v\\s*\\)', flags: '', must: true, hint: 'abs32 should return If(v < 0, -v, v)', pass: 'abs32 via If' },
      { re: 'pass\\s*$', flags: 'm', must: false, hint: 'Replace every pass placeholder with real code', pass: 'No placeholders left' }
    ],
    run: "Save as <code>prove_lab.py</code>, then: <code>pip install --user z3-solver &amp;&amp; python3 prove_lab.py</code>. Expected: <code>None</code> for the Int claim, a model like <code>[b = 3328516277]</code> for b*b (Z3 prints bit-vectors as unsigned), and <code>[b = 2147483648]</code> (that is INT_MIN) for abs.",
    solution: `from z3 import Int, BitVec, Solver, Not, If, sat, unsat

def prove(claim):
    """Return None if claim is valid, else a counterexample model."""
    s = Solver()
    s.add(Not(claim))
    r = s.check()
    if r == unsat:
        return None
    if r == sat:
        return s.model()
    raise RuntimeError("solver returned unknown")

x = Int("x")
print("Int:    x*x >= 0    ->", prove(x * x >= 0))

b = BitVec("b", 32)
print("BitVec: b*b >= 0    ->", prove(b * b >= 0))

def abs32(v):
    return If(v < 0, -v, v)

print("BitVec: abs(b) >= 0 ->", prove(abs32(b) >= 0))

# Int:    x*x >= 0    -> None
# BitVec: b*b >= 0    -> [b = 3328516277]
# BitVec: abs(b) >= 0 -> [b = 2147483648]
`,
    notes: [
      "3328516277 as a signed 32-bit value is -966451019; its square wraps around to a value with the sign bit set. Use <code>m[b].as_signed_long()</code> to print the signed view.",
      "2147483648 is 0x80000000 = INT_MIN. Negating it in two's complement gives itself, so Java's <code>Math.abs(Integer.MIN_VALUE)</code> really is negative. That is documented JDK behavior, and Z3 found it from the definition alone.",
      "Treating <code>unknown</code> as success is a classic soundness bug in tooling built on solvers; raising keeps your tool honest."
    ]
  },
  quiz: [
    {
      q: "A static analyzer reports 'no null dereferences' on a program that actually dereferences null on some input. Which property did the analyzer violate?",
      options: ["Completeness", "Soundness", "Termination", "Decidability"],
      correct: 1,
      explain: "For a verifier, soundness means a 'safe' verdict implies the program really is safe. Missing a real bug while claiming safety is unsoundness."
    },
    {
      q: "You assert Not(P) in Z3 and get unsat. What do you conclude?",
      options: ["P is unsatisfiable", "P is valid (true under every assignment)", "Z3 timed out", "P has exactly one model"],
      correct: 1,
      explain: "No assignment makes Not(P) true, so every assignment makes P true. That is validity."
    },
    {
      q: "Why can no analyzer be sound, complete and always terminating for 'can this Java program throw ArithmeticException'?",
      options: ["Java bytecode is not formally specified", "Rice's theorem: non-trivial semantic properties are undecidable", "SMT solvers are NP-hard", "Exceptions are not expressible in first-order logic"],
      correct: 1,
      explain: "Rice's theorem applies to any non-trivial behavioral property of programs in a Turing-complete language. NP-hardness is about cost, not decidability."
    },
    {
      q: "Which tool is the best example of a sound-but-incomplete verifier for runtime errors?",
      options: ["AFL++ fuzzing", "Astrée (abstract interpretation)", "KLEE with a 1-hour budget", "A unit test suite with 100% line coverage"],
      correct: 1,
      explain: "Astrée over-approximates reachable states, so it never misses a runtime error in its scope but can raise false alarms. The others are under-approximate bug finders."
    },
    {
      q: "Z3 proves 'mid = (lo + hi) / 2 stays in [lo, hi]' when lo and hi are Int, yet Java's binary search was buggy. What went wrong?",
      options: ["Z3 is unsound for integers", "The encoding used mathematical integers instead of 32-bit wrap-around semantics", "The property needs quantifiers", "Division is undecidable"],
      correct: 1,
      explain: "The proof was about a different program. Choosing BitVec(32) models Java ints faithfully, and then Z3 finds the overflow."
    }
  ],
  testFlow: {
    title: "Test yourself: which way does this tool err?",
    start: 'q1',
    nodes: {
      q1: {
        q: "CBMC with --unwind 10 reports VERIFICATION SUCCESSFUL, but the unwinding assertions were disabled. What do you actually know?",
        choices: [
          { text: "No assertion fails on executions with at most 10 iterations per loop", to: 'q1_right' },
          { text: "The program is correct for all inputs", to: 'q1_wrong' }
        ]
      },
      q1_right: { end: true, correct: true, text: "Right. Bounded model checking is exhaustive within the bound, an under-approximation of all behaviors. With unwinding assertions enabled and passing, you would also know no execution needs more than 10 iterations, which upgrades it to a full proof.", next: 'q2' },
      q1_wrong: { end: true, correct: false, text: "Executions needing an 11th iteration were never explored. Without the unwinding assertion, the result is a bounded guarantee only.", retry: 'q1' },
      q2: {
        q: "An interval-domain analyzer warns 'possible division by zero' on x / (y*y + 1) for integer y. Is the warning a real bug?",
        choices: [
          { text: "No: y*y + 1 is always >= 1 (ignoring overflow); this is a false alarm from over-approximation", to: 'q2_right' },
          { text: "Yes: sound tools never produce false alarms", to: 'q2_wrong' }
        ]
      },
      q2_right: { end: true, correct: true, text: "Exactly. Intervals lose the correlation between the two y factors, so y*y may be approximated as including negative values. Sound tools err toward false positives. (With 32-bit overflow, y*y + 1 can actually wrap to 0, so on machine ints it is worth checking!)" },
      q2_wrong: { end: true, correct: false, text: "Backwards: sound verifiers avoid false negatives, and pay for it with false positives. Bug finders avoid false positives.", retry: 'q2' }
    }
  },
  pitfalls: [
    "Saying a tool is 'sound' without saying sound with respect to what claim. A sound bug finder and a sound verifier err in opposite directions.",
    "Proving a property over Int or Real when the code runs on 32- or 64-bit machine integers or IEEE floats. The proof is correct and irrelevant.",
    "Treating solver <code>unknown</code> or a timeout as 'no counterexample found, so it is fine'. That silently turns a verifier into an unsound one.",
    "Forgetting the specification problem: a proved function with a weak spec (sorted but not a permutation) is still wrong.",
    "Claiming formal methods 'prove the absence of all bugs'. They prove a stated property relative to a model of the language, compiler, hardware and the tool's TCB."
  ],
  interview: [
    {
      q: "What is the difference between testing and formal verification? When would you choose each?",
      a: "Testing executes the program on chosen inputs and observes behavior: cheap, finds real bugs, but only covers the sampled inputs (an under-approximation). Verification reasons about all inputs symbolically against a written specification: it can prove absence of a class of bugs but costs spec-writing, tool expertise and sometimes proof maintenance. I default to tests and property-based tests everywhere, add sound static analysis or SMT-backed checks for crisp, high-cost properties (overflow, memory safety, access-control policies), and reserve full functional verification for small, critical, stable components like parsers, crypto, consensus protocols or compiler passes."
    },
    {
      q: "Define soundness and completeness for a static analyzer. Can an analyzer be both?",
      a: "For an analyzer that certifies safety: sound means whenever it says safe, the program is safe (no false negatives); complete means whenever the program is safe, it says so (no false positives). By Rice's theorem, for a Turing-complete language and a non-trivial semantic property, you cannot have both plus guaranteed termination. You can have both on restricted programs (finite-state systems for a model checker, or a decidable logic like quantifier-free linear arithmetic), which is why tools choose decidable abstractions or bounds."
    },
    {
      q: "Explain a tradeoff: sound static analysis vs a 'soundy' industrial analyzer.",
      a: "A sound analyzer (Astrée, Frama-C EVA) gives a guarantee, but over-approximation produces false alarms, and every alarm costs an engineer's time; if precision is low, developers stop reading reports. A soundy analyzer (Infer, Error Prone, CodeQL queries) deliberately ignores hard features like reflection, aliasing through native code, or deep heap shapes, and tunes for high precision at diff time. You lose the guarantee but gain adoption and fix rates. The right choice depends on the cost of a missed bug: flight control software gets sound analysis; a web monorepo gets precise, unsound checks in code review."
    },
    {
      q: "How does a solver prove that a property holds for all inputs if it only checks satisfiability?",
      a: "By refutation. P holds for all inputs iff Not(P) is unsatisfiable. You assert the precondition and the negated postcondition, and an unsat answer is a proof that no counterexample exists; a sat answer includes a model, which is a concrete failing input you can turn into a regression test. Solvers can also emit unsat cores (which assertions were needed) and, in some modes, checkable proof certificates."
    },
    {
      q: "Whiteboard: you are asked to make sure a team's 300-line IAM-style policy evaluator never grants access to a resource marked private. How would you approach it?",
      a: "First pin down the spec: for every request and policy set, if resource.private then decision != Allow. Then pick a tool by cost: (1) property-based tests with a generator for requests and policies to catch obvious bugs fast; (2) encode the policy language semantics in SMT (strings, regex for wildcards, booleans) the way AWS Zelkova does, and ask Z3/cvc5 for a request and policy where private and Allow both hold: sat gives a counterexample, unsat gives a proof for the encoded semantics; (3) if the evaluator itself must be trusted, write it in Dafny or Lean so the implementation is proved against the same semantics (AWS did this for Cedar). I would also differential-test the SMT model against the real implementation to keep the encoding honest."
    },
    {
      q: "What does it mean that first-order logic is semi-decidable, and how does that show up when you use Z3?",
      a: "There is a procedure that eventually confirms every valid first-order formula, but no procedure that always terminates on invalid ones. In Z3, quantified formulas are handled by instantiation heuristics (E-matching, MBQI), so it can return unknown or loop until timeout. In practice you keep queries quantifier-free when possible, give triggers/patterns, or bound quantifiers over finite domains."
    },
    {
      q: "What is a trusted computing base in verification and how do Lean and Z3 differ?",
      a: "It is everything that must be correct for the result to be trustworthy. Lean (and Coq, Isabelle) follow the de Bruijn criterion: proofs are terms checked by a small kernel, so the large, clever automation is untrusted. An SMT solver is a large optimized C++ program with no independent checker by default, so a Z3 bug can yield a wrong unsat. Mitigations: proof-producing modes and checkers, running two solvers, or reconstructing SMT proofs inside a prover (Isabelle's smt method, Lean's lean-smt / Coq SMTCoq)."
    }
  ]
};
