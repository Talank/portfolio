window.LESSONS = window.LESSONS || {};
window.LESSONS['z3-advanced-theories'] = {
  id: 'z3-advanced-theories',
  title: 'Bit-Vectors, Arrays, Uninterpreted Functions & Quantifiers in Z3',
  category: 'Part 1 — SMT Solvers & Z3',
  timeMin: 45,
  summary: "Real programs run on 32- and 64-bit machine words, read and write memory, call functions you do not want to model, and come with specifications that say 'for all'. This lesson covers the Z3 theories that model each of those: bit-vectors (with the signed vs unsigned operator split that trips up everyone), arrays as memory (Select/Store and the read-over-write axioms), uninterpreted functions as abstraction, quantifiers (ForAll/Exists, patterns, quantifier elimination), and tactics for steering the solver. You will prove classic bit hacks correct for all 2^32 inputs and watch Z3 find the inputs where the tempting versions fail.",
  goals: [
    "Pick the right bit-vector operator: <, ULT, /, UDiv, %, SRem, URem, >>, LShR, and explain two's-complement wrap-around",
    "Detect overflow with wider bit-vectors (ZeroExt/SignExt) or BVAddNoOverflow, and prove or refute bit-twiddling identities",
    "Model memory with Array, Select and Store, and state the read-over-write and extensionality axioms",
    "Use uninterpreted functions to abstract code, knowing that only functional consistency is assumed",
    "Write ForAll/Exists constraints with patterns, recognize when they make Z3 return unknown, and use quantifier elimination",
    "Compose tactics (simplify, solve-eqs, bit-blast, qe) and turn a tactic pipeline into a solver"
  ],
  concept: [
    {
      h: "Bit-vectors: one bag of bits, two interpretations",
      p: [
        "<code>BitVec(\"x\", 32)</code> is a 32-bit word. Arithmetic (<code>+ - *</code>) wraps modulo 2<sup>32</sup> and is the same for signed and unsigned, because two's complement makes them coincide. Operations whose result depends on interpretation come in pairs, and in Z3's Python API the plain operator is the <b>signed</b> one:",
        "<table><tr><th>Meaning</th><th>Signed (Python operator)</th><th>Unsigned</th><th>SMT-LIB</th></tr><tr><td>less than, etc.</td><td><code>&lt; &lt;= &gt; &gt;=</code></td><td><code>ULT ULE UGT UGE</code></td><td>bvslt / bvult</td></tr><tr><td>division</td><td><code>/</code></td><td><code>UDiv</code></td><td>bvsdiv / bvudiv</td></tr><tr><td>remainder</td><td><code>SRem</code> (sign of dividend, like C/Java); <code>%</code> is <code>bvsmod</code> (sign of divisor)</td><td><code>URem</code></td><td>bvsrem, bvsmod / bvurem</td></tr><tr><td>right shift</td><td><code>&gt;&gt;</code> (arithmetic, copies sign bit)</td><td><code>LShR</code> (logical, Java's &gt;&gt;&gt;)</td><td>bvashr / bvlshr</td></tr><tr><td>widening</td><td><code>SignExt(k, x)</code></td><td><code>ZeroExt(k, x)</code></td><td>sign_extend / zero_extend</td></tr></table>",
        "Other building blocks: <code>Extract(hi, lo, x)</code>, <code>Concat(a, b)</code>, <code>RotateLeft</code>, bitwise <code>&amp; | ^ ~</code>. Models print bit-vectors as unsigned; use <code>.as_signed_long()</code> for the signed view. Division by zero is defined in SMT-LIB (<code>bvudiv x 0</code> is all ones, <code>bvurem x 0</code> is x), so if your language traps on it, you must add that check yourself."
      ],
      code: `from z3 import *
v = BitVecVal(0xF0, 8)                      # bits 11110000: 240 unsigned, -16 signed
print(simplify(v < 1), simplify(ULT(v, 1)))           # True False
print(simplify(v / 16), simplify(UDiv(v, 16)))        # 255 15   (255 is -1 signed)
print(simplify(v >> 2), simplify(LShR(v, 2)))         # 252 60   (252 is -4 signed)
m7 = BitVecVal(-7, 8)
print(simplify(m7 % 3), simplify(SRem(m7, 3)), simplify(URem(m7, 3)))   # 2 255 0
print(v.as_long(), v.as_signed_long())                # 240 -16
print(simplify(SignExt(8, v)), simplify(ZeroExt(8, v)))   # 65520 240
print(simplify(Extract(7, 4, v)), simplify(Concat(BitVecVal(1, 4), BitVecVal(2, 4))))   # 15 18`
    },
    {
      h: "Overflow: widen, or use the built-in predicates",
      p: [
        "Two standard ways to talk about overflow. (1) <b>Widen</b>: compute in 33 or 64 bits with <code>ZeroExt</code>/<code>SignExt</code> and compare with the 32-bit result. (2) Use Z3's predicates <code>BVAddNoOverflow(a, b, signed)</code>, <code>BVAddNoUnderflow</code>, <code>BVMulNoOverflow</code>, <code>BVSubNoUnderflow</code>, <code>BVSDivNoOverflow</code>, <code>BVSNegNoOverflow</code>.",
        "In C, signed overflow is undefined behavior, and compilers exploit that: <code>if (x + y &lt; x)</code> as a signed overflow check can be deleted by the optimizer. Tools like CBMC and KLEE insert an overflow assertion at each signed operation for this reason. In Java it is defined wrap-around, so you model it exactly with bit-vectors."
      ],
      code: `a, b = BitVecs("a b", 32)
s = Solver()
s.add(a > 0, b > 0, a + b < 0)              # two positives summing to a negative?
print(s.check(), s.model())                 # sat [a = 2147483647, b = 1608515583]

# With the no-overflow guard, the sum of two positives is positive
prove(Implies(And(a > 0, b > 0, BVAddNoOverflow(a, b, True)), a + b > 0))   # proved`
    },
    {
      h: "Arrays: memory as a total function",
      p: [
        "<code>Array(\"A\", IndexSort, ValueSort)</code> is a total map. <code>Select(A, i)</code> (or <code>A[i]</code>) reads, <code>Store(A, i, v)</code> returns a <i>new</i> array equal to A except at i. Arrays are values: there is no mutation, which is exactly what makes them easy to reason about. <code>K(IntSort(), 0)</code> is the constant array (all zeros), handy for zero-initialized memory.",
        "The theory is defined by two axioms plus extensionality: <code>Select(Store(A, i, v), i) == v</code>; <code>i != j ⇒ Select(Store(A, i, v), j) == Select(A, j)</code>; and arrays equal at every index are equal. KLEE and angr model memory as <code>Array(BitVecSort(64), BitVecSort(8))</code>: byte-addressed, so a 4-byte load is a <code>Concat</code> of four Selects (little-endian order matters).",
        "Equality of arrays is first-class. Z3 below finds that two stores commute only when the indices differ, and in the counterexample introduces a witness index (shown as <code>Ext</code>) from extensionality."
      ],
      code: `A = Array("A", IntSort(), IntSort())
i, j, v = Ints("i j v")
prove(Select(Store(A, i, v), i) == v)                             # proved
prove(Implies(i != j, Select(Store(A, i, v), j) == A[j]))         # proved
prove(Store(Store(A, i, 1), j, 2) == Store(Store(A, j, 2), i, 1))
# counterexample [A = K(Int, 3), i = 4, j = 4, Ext = [else -> 4]]  -> needs i != j

s = Solver()
s.add(Select(K(IntSort(), 0), 5) != 0)      # zero-initialized memory
print(s.check())                            # unsat`
    },
    {
      h: "Uninterpreted functions: abstraction with exactly one assumption",
      p: [
        "<code>f = Function(\"f\", IntSort(), IntSort())</code> declares a function about which Z3 knows only <b>functional consistency</b>: equal arguments give equal results (congruence). It does not know f is injective, monotone, or anything else unless you assert it.",
        "That makes UFs ideal for abstraction: replace a hash, a cryptographic primitive, a floating-point routine or a library call by an uninterpreted f in both versions of a program and prove the versions equivalent without ever modeling f. If the proof needs more, add exactly the facts needed (e.g. <code>ForAll([x], f(x) &gt;= 0)</code>). In the model, Z3 shows a finite interpretation of f, like <code>[1 -&gt; 0, else -&gt; 1]</code>."
      ],
      code: `f = Function("f", IntSort(), IntSort())
x, y = Ints("x y")
prove(Implies(x == y, f(x) == f(y)))        # proved: congruence
prove(Implies(f(x) == f(y), x == y))        # counterexample: f need not be injective

s = Solver()
s.add(f(f(x)) == x, f(x) == y, x != y)      # an involution with no fixed point at x
print(s.check(), s.model())                 # sat [x = 0, y = 1, f = [1 -> 0, else -> 1]]`
    },
    {
      h: "Quantifiers: ForAll, Exists, patterns and quantifier elimination",
      p: [
        "<code>ForAll([x], body)</code> and <code>Exists([x], body)</code> take a list of bound constants. Z3 handles them with E-matching on patterns (pass <code>patterns=[f(x)]</code> to choose the trigger) and MBQI. Typical results: unsat when a few instantiations suffice (very common), sat when MBQI can build a model, and unknown or timeout otherwise.",
        "For linear arithmetic, <b>quantifier elimination</b> is complete: <code>Tactic(\"qe\")</code> turns <code>∃x. x &gt; y ∧ x &lt; 5</code> into the equivalent quantifier-free <code>y ≤ 3</code> (over Int).",
        "Practical rule: keep queries quantifier-free when you can (unroll, instantiate by hand, or use a finite domain); when you cannot, give each quantifier a pattern that mentions all bound variables and does not create new matching terms."
      ],
      code: `f = Function("f", IntSort(), IntSort())
x, y = Ints("x y")
s = Solver()
s.add(ForAll([x], f(x) >= x), f(3) < 3)
print(s.check())                            # unsat: instantiate x := 3

s = Solver()
s.add(ForAll([x], Implies(x > 0, f(x) > f(x - 1))), f(0) == 0, f(5) < 0)
print(s.check())                            # unsat: needs the chain x := 1..5

g = Function("g", IntSort(), IntSort())
s = Solver()
s.add(ForAll([x], g(x) == 2 * x + 1, patterns=[g(x)]), g(y) == 10)
print(s.check())                            # unsat: 2y + 1 is odd

s = Solver()
s.add(Exists([x], And(x > y, x < y + 2)))
print(s.check(), s.model())                 # sat [y = -1]  (x = y + 1 always works)

print(Tactic("qe")(Exists([x], And(x > y, x < 5))))   # [[y <= 3]]`
    },
    {
      h: "Tactics: telling Z3 how to solve",
      p: [
        "A <b>Goal</b> is a set of formulas; a <b>tactic</b> transforms a goal into subgoals. Combinators: <code>Then(t1, t2)</code>, <code>OrElse(t1, t2)</code>, <code>Repeat(t)</code>, <code>TryFor(t, ms)</code>, <code>ParOr</code>, <code>Cond</code>. Useful tactics: <code>simplify</code>, <code>solve-eqs</code> (Gaussian-style variable elimination), <code>propagate-values</code>, <code>bit-blast</code>, <code>tseitin-cnf</code>, <code>qe</code>, <code>nlsat</code>, <code>sat</code>, <code>smt</code>. <code>t.solver()</code> wraps a tactic as a Solver. <code>describe_tactics()</code> lists everything available.",
        "You rarely need tactics for small queries, but for a family of hard bit-vector queries a custom pipeline such as <code>Then(\"simplify\", \"solve-eqs\", \"bit-blast\", \"sat\")</code> can beat the default strategy, and inspecting what <code>simplify</code> produces is a great debugging tool."
      ],
      code: `a, b = BitVecs("a b", 8)
g = Goal()
g.add(a * 2 == b, b == 6)
print(Then("simplify", "solve-eqs")(g))     # [[2*a == 6]]  b eliminated

t = Then("simplify", "bit-blast", "sat")
s = t.solver()
s.add(a * 3 == 7)                           # 8-bit: is 7 a multiple of 3 mod 256?
print(s.check(), s.model())                 # sat [a = 173]   (3 * 173 = 519 = 2*256 + 7)`
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: "Where the advanced theories bite in practice: modeling real languages, performance of bit-vector reasoning, and the semantics of quantifiers and arrays inside verifiers.",
    sections: [
      {
        h: "Modeling C and Java integers faithfully",
        p: [
          "<ul><li><b>Java</b>: int is BitVec(32) with wrap-around; <code>/</code> truncates toward zero (bvsdiv) and <code>%</code> takes the dividend's sign (bvsrem, i.e. <code>SRem</code>, not Python's <code>%</code>). <code>&gt;&gt;</code> is arithmetic, <code>&gt;&gt;&gt;</code> is LShR. Shift amounts are masked to 5 bits (x &lt;&lt; 33 == x &lt;&lt; 1), which bit-vector shifts do not do: SMT-LIB shifting by 33 gives 0. Model the mask explicitly.</li><li><b>C</b>: unsigned arithmetic wraps; signed overflow, shifting by the width or more, and <code>INT_MIN / -1</code> are undefined behavior, so a faithful encoding asserts they never happen (a verification condition) rather than giving them a value. Integer promotions mean <code>uint8_t + uint8_t</code> is computed in int: use ZeroExt to 32 bits first.</li><li><b>Floats</b>: Z3 has an IEEE theory (<code>FP</code>, <code>FPSort(8, 24)</code>, rounding modes), decided by bit-blasting; it is slow but exact. Many tools abstract floats as UFs or reals instead.</li></ul>"
        ]
      },
      {
        h: "Why some bit-vector queries are hard",
        p: [
          "Addition bit-blasts to a ripple-carry chain: linear size, easy. Multiplication of two symbolic 64-bit values is a quadratic-size circuit and proving properties of it (e.g. commutativity after bit-blasting, or inverting a hash) can be very hard for CDCL. Division and remainder are worse. Tricks: reduce width when the property is width-independent (prove at 8 bits, then argue, or use a parametric proof), avoid symbolic * symbolic, prefer shifts for constants, and try Bitwuzla. Proving bit hacks at 32 bits, as in the code example, is fast because they are mostly bitwise and additive."
        ]
      },
      {
        h: "Arrays in verifiers: frames, heaps and lambdas",
        p: [
          "Dafny and Boogie model the heap as a map from (object, field) to value, so a method call becomes 'the heap after is some unknown heap that agrees with the old one outside the modifies clause', which is a quantified statement over array indices. That is why frame reasoning causes quantifier instantiation. Z3 also supports <code>Lambda([i], body)</code> as an array value, plus map combinators (<code>Map(f, A, B)</code>) and set operations over arrays of Booleans, which are useful for compact memory and set models."
        ]
      },
      {
        h: "Skolemization and why Exists is usually easy",
        p: [
          "An existential at the top level is just a fresh constant (Skolemization): <code>Exists([x], P(x))</code> asserted is equivalent to asserting <code>P(c)</code> for a new c. A universal under an existential becomes a fresh function: <code>ForAll([y], Exists([x], P(x, y)))</code> becomes <code>ForAll([y], P(sk(y), y))</code>. The hard part is always the remaining universals, which require instantiation. When you prove a goal by negation, the goal's universals become existentials (easy) and its existentials become universals (hard). Validity of <code>∀x. ∃y. y &gt; x</code> means checking that <code>∃x. ∀y. y ≤ x</code> is unsat, which requires instantiating y."
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: "Franky's Cola Gauge, Usopp's Ledger and Robin's Unread Book",
      text: [
        "Franky's cola gauge has eight lights. When he adds one more barrel to a full gauge it wraps around to zero lights: that is bit-vector addition. Read the gauge one way and the top light means 'more than 128 barrels'; read it the other way and it means 'running a deficit'. Same lights, signed or unsigned, and the Sunny almost ran dry because Usopp compared the gauges the wrong way (< instead of ULT).",
        "Usopp keeps the cargo ledger as a list of slots. 'Put the treasure in slot 3' does not erase the old ledger; it creates a new ledger identical except at slot 3. Asking about slot 5 in the new ledger gives the same answer as the old one (read-over-write).",
        "Robin carries a sealed book of Poneglyph translations. Nobody knows what the book says, only that the same glyph always translates to the same thing (an uninterpreted function). That is enough to prove that two decoding routes agree, without ever opening the book.",
        "And Nami writes the general law 'every island is further than the previous one' (a ForAll). To use it, the crew has to name specific islands one at a time (instantiation), and if they pick the wrong ones, they never get an answer."
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: "Howard's Odometer and Sheldon's Spot",
      text: [
        "Howard's old car odometer has six digits. At 999,999 miles it rolls over to zero, and the car dealer insists the car is brand new. Leonard points out that both are reading the same digits under different conventions.",
        "Sheldon's spot on the couch is cell (0, 0) of the apartment. When Penny moves the coffee table, only the coffee table's cell changes, and Sheldon can prove his spot is untouched without checking the rest of the room (read-over-write at a different index).",
        "Raj's 'secret recipe' is a black box; all anyone knows is that the same ingredients always give the same curry. Sheldon proves that two shopping lists produce the same dinner anyway: same ingredients in, same curry out."
      ]
    },
    why: "The wrapping cola gauge and odometer are fixed-width bit-vectors, with signed and unsigned readings of the same bits. The ledger and the room are arrays with Store and Select and the read-over-write axiom. Robin's sealed book and Raj's recipe are uninterpreted functions: only congruence is known. Nami's general law is a ForAll that needs instantiation."
  },
  storyAnim: {
    h: 260,
    props: [
      { id: 'gauge', emoji: '🔋', label: 'Gauge: 0xF0', x: 15, y: 18 },
      { id: 'ledger', emoji: '📒', label: 'Ledger A', x: 50, y: 18 },
      { id: 'book', emoji: '📕', label: 'Sealed book f', x: 85, y: 18 },
      { id: 'verdict', emoji: '❓', label: 'Verdict', x: 50, y: 85 }
    ],
    actors: [
      { id: 'franky', emoji: '🤖', label: 'Franky', x: 15, y: 55 },
      { id: 'usopp', emoji: '🤥', label: 'Usopp', x: 50, y: 55 },
      { id: 'robin', emoji: '📚', label: 'Robin', x: 85, y: 55 }
    ],
    steps: [
      { c: "The gauge shows bits 11110000. Signed it is -16, unsigned it is 240. Usopp asks: is it below 1?", p: { gauge: 'lit' } },
      { c: "With signed <, yes (-16 < 1). With ULT, no (240 is not below 1). The bits never changed; the operator did.", p: { gauge: 'bad' }, l: { gauge: '< True, ULT False' } },
      { c: "Usopp stores the treasure at slot 3: Store(A, 3, gold) is a new ledger. The old one is untouched.", a: { usopp: [55, 40] }, p: { ledger: 'lit' }, l: { ledger: "A' = Store(A, 3, gold)" } },
      { c: "Asking slot 5 of the new ledger equals slot 5 of the old: read-over-write at a different index.", p: { ledger: 'good' } },
      { c: "Robin's book f is sealed. All she knows: same glyph in, same translation out.", a: { robin: [80, 40] }, p: { book: 'lit' } },
      { c: "If x == y then f(x) == f(y): proved. If f(x) == f(y) then x == y: counterexample, the book might map two glyphs alike.", p: { book: 'good', verdict: 'lit' }, l: { verdict: 'congruence only' } },
      { c: "Together they prove Franky's branchless abs equals the If version for all 2^32 inputs, and that abs(INT_MIN) is negative.", a: { franky: [40, 75] }, p: { verdict: 'good' }, l: { verdict: 'proved + 1 counterexample' } }
    ]
  },
  conceptFlow: {
    title: "From program fragment to Z3 theory",
    intro: "Each language feature maps to a theory; the solver combines them.",
    stages: [
      { label: 'Program feature', nodes: [ { id: 'ints', text: 'int / long arithmetic' }, { id: 'mem', text: 'arrays, heap, pointers' }, { id: 'call', text: 'opaque calls\nhash(), sqrt()' }, { id: 'spec', text: 'spec: for all i ...' } ] },
      { label: 'Z3 encoding', nodes: [ { id: 'bv', text: 'BitVec(32)\nULT vs <, LShR vs >>' }, { id: 'arr', text: 'Array(BV64, BV8)\nSelect / Store' }, { id: 'uf', text: 'Function(...)\ncongruence only' }, { id: 'q', text: 'ForAll + patterns\nor qe' } ] },
      { label: 'Decision procedure', nodes: [ { id: 'blast', text: 'rewrite + bit-blast\nto SAT' }, { id: 'row', text: 'read-over-write\nlemmas' }, { id: 'cc', text: 'congruence closure' }, { id: 'inst', text: 'E-matching / MBQI' } ] },
      { label: 'Answer', nodes: [ { id: 'ans', text: 'proved / counterexample\n/ unknown' } ] }
    ],
    steps: [
      { active: ['ints', 'bv'], note: "Machine integers become fixed-width bit-vectors. Choose signed or unsigned operators to match the language: Java's >>> is LShR, C's unsigned < is ULT." },
      { active: ['bv', 'blast'], note: "Z3 simplifies at word level, then bit-blasts what remains into a SAT problem over individual bits." },
      { active: ['mem', 'arr'], note: "Memory becomes an array from addresses to bytes. Every write is a Store producing a new array value." },
      { active: ['arr', 'row'], note: "The array solver instantiates read-over-write axioms lazily: a read at j from a store at i splits on whether i equals j." },
      { active: ['call', 'uf', 'cc'], note: "Calls you do not want to model become uninterpreted functions. Congruence closure guarantees equal inputs give equal outputs, nothing more." },
      { active: ['spec', 'q', 'inst'], note: "Universal specs become ForAll. The solver instantiates them on matching ground terms; for linear arithmetic, qe can eliminate them exactly." },
      { active: ['ans'], note: "The combined answer: unsat of the negation proves the property; sat gives a concrete counterexample in machine terms; unknown usually points at quantifiers or nonlinear arithmetic." }
    ]
  },
  tech: [
    {
      q: "Why does Z3 print my -1 as 4294967295?",
      a: "A bit-vector value has no sign; it is just bits. Z3 prints the unsigned interpretation. Call <code>m[x].as_signed_long()</code> for the two's-complement reading. The sign only matters to operators: < vs ULT, / vs UDiv, >> vs LShR."
    },
    {
      q: "Is Python's % on a Z3 BitVec the same as Java's %?",
      a: "No. On BitVec, <code>%</code> builds <code>bvsmod</code>, whose result takes the sign of the divisor (like Python's integer %). Java and C use truncating remainder, whose result takes the sign of the dividend: that is <code>SRem</code> (bvsrem). For -7 and 3: smod gives 2, srem gives -1. On Int, Z3's % is SMT-LIB mod, which is always non-negative."
    },
    {
      q: "What is the Ext symbol that appears in array counterexamples?",
      a: "When Z3 refutes or satisfies an array (dis)equality, extensionality introduces a witness index where the two arrays differ. Z3 reports it as a function named Ext (or similar) in the model. In the store-commutation counterexample, i = j = 4 and the witness index 4 is where the two arrays hold 1 and 2."
    },
    {
      q: "When should I use an uninterpreted function instead of an array?",
      a: [
        "Arrays and UFs both denote functions, but arrays are first-class values: you can Store into them, compare them for equality, and pass them around, which is what mutable memory needs. UFs are fixed for the whole query, which is what a pure, unknown function needs.",
        "Rule of thumb: state that changes during the program is an array (a new array per write); an operation whose definition you want to abstract is a UF."
      ]
    }
  ],
  code: {
    title: "Proving bit hacks for all 2^32 inputs, and catching the broken ones",
    intro: "One <code>check</code> helper asserts the negation of a claim. The script proves the guarded power-of-two test, branchless abs and the overflow-free average, and finds the counterexamples to the unguarded power-of-two test, to abs being non-negative, and to the naive average. It ends with a byte-addressed memory model proving a swap correct.",
    code: `# bithacks_z3.py -- run with: python3 bithacks_z3.py   (pip install --user z3-solver)
from z3 import (BitVec, BitVecVal, Array, BitVecSort, Select, Store, Solver, Not, And,
                Or, If, Implies, LShR, ZeroExt, Extract, sat, unsat)

W = 32
x, y = BitVec("x", W), BitVec("y", W)

def check(name, claim, show=(x, y)):
    s = Solver()
    s.add(Not(claim))
    r = s.check()
    if r == unsat:
        print("%-34s proved for all inputs" % name)
    elif r == sat:
        m = s.model()
        vals = ", ".join("%s=%d" % (v, m.eval(v, model_completion=True).as_signed_long()) for v in show)
        print("%-34s counterexample: %s" % (name, vals))
    else:
        print("%-34s unknown (%s)" % (name, s.reason_unknown()))

is_pow2_spec = Or([x == (1 << i) for i in range(W)])

# 1) Classic power-of-two test, and the version people forget to guard
check("is_pow2: x & (x-1) == 0", ((x & (x - 1)) == 0) == is_pow2_spec, show=(x,))
check("is_pow2: x != 0 && x & (x-1) == 0",
      And(x != 0, (x & (x - 1)) == 0) == is_pow2_spec, show=(x,))

# 2) Branchless abs: m = x >> 31 (arithmetic shift), abs = (x ^ m) - m
m = x >> 31
check("branchless abs == If(x<0,-x,x)", ((x ^ m) - m) == If(x < 0, -x, x), show=(x,))
check("abs(x) >= 0", If(x < 0, -x, x) >= 0, show=(x,))

# 3) Unsigned average without overflow vs the naive version
exact = Extract(W - 1, 0, LShR(ZeroExt(1, x) + ZeroExt(1, y), 1))   # 33-bit reference
check("(x & y) + ((x ^ y) >>> 1)", ((x & y) + LShR(x ^ y, 1)) == exact)
check("naive (x + y) >>> 1", LShR(x + y, 1) == exact)

# 4) Memory: swap two cells of a byte-addressed heap
mem = Array("mem", BitVecSort(W), BitVecSort(8))
i, j = BitVec("i", W), BitVec("j", W)
swapped = Store(Store(mem, i, Select(mem, j)), j, Select(mem, i))
check("swap: mem'[i]==mem[j], mem'[j]==mem[i]",
      And(Select(swapped, i) == Select(mem, j), Select(swapped, j) == Select(mem, i)), show=(i, j))
k = BitVec("k", W)
check("swap leaves other cells alone",
      Implies(And(k != i, k != j), Select(swapped, k) == Select(mem, k)), show=(i, j))

# Output:
# is_pow2: x & (x-1) == 0            counterexample: x=0
# is_pow2: x != 0 && x & (x-1) == 0  proved for all inputs
# branchless abs == If(x<0,-x,x)     proved for all inputs
# abs(x) >= 0                        counterexample: x=-2147483648
# (x & y) + ((x ^ y) >>> 1)          proved for all inputs
# naive (x + y) >>> 1                counterexample: x=-66060289, y=-66060289
# swap: mem'[i]==mem[j], mem'[j]==mem[i] proved for all inputs
# swap leaves other cells alone      proved for all inputs`,
    notes: [
      "The counterexample for the naive average is printed signed: -66060289 is 0xFC0FFFFF unsigned, and adding two of them overflows 32 bits. This is the same bug as the binary-search midpoint, in unsigned form.",
      "abs(INT_MIN) == INT_MIN is real behavior in Java, C (where it is UB) and most hardware. A spec that says 'abs is non-negative' is false for machine integers.",
      "The swap proof holds even when i == j, which you might not have checked by hand. Solvers consider aliasing cases automatically; this is why they are good at memory reasoning."
    ]
  },
  lab: {
    title: "Verify four integer tricks from real codebases",
    prompt: "Using 32-bit bit-vectors <code>x</code>, <code>y</code> and the provided <code>check(name, claim)</code> helper, check: (1) the unsigned overflow test <code>ULT(x + y, x)</code> is true exactly when the 33-bit sum (via <code>ZeroExt</code>) exceeds 2<sup>32</sup>-1; (2) branchless signed min <code>y ^ ((x ^ y) &amp; -(x &lt; y))</code> equals <code>If(x &lt; y, x, y)</code>; (3) the sign function <code>(x &gt;&gt; 31) | LShR(-x, 31)</code> returns -1, 0 or 1; (4) the signed overflow test people write in C, <code>x + y &lt; x</code>, is equivalent to <code>y &lt; 0</code>. Three should be proved; one should produce a counterexample. Remember: integer literals inside <code>If</code> branches must be <code>BitVecVal(..., 32)</code>.",
    starter: `from z3 import BitVecs, BitVecVal, Solver, Not, If, ULT, UGT, LShR, ZeroExt, sat, unsat

x, y = BitVecs("x y", 32)

def check(name, claim):
    s = Solver()
    s.add(Not(claim))
    r = s.check()
    if r == unsat:
        print("%-28s proved" % name)
    elif r == sat:
        m = s.model()
        print("%-28s COUNTEREXAMPLE x=%d y=%d" % (name, m.eval(x, True).as_signed_long(), m.eval(y, True).as_signed_long()))
    else:
        print("%-28s unknown" % name)

# 1) unsigned overflow test
# TODO

# 2) branchless signed min
# TODO

# 3) sign function via shifts
# TODO

# 4) signed overflow test as written in C
# TODO
`,
    checks: [
      { re: 'ZeroExt\\s*\\(\\s*1\\s*,\\s*x\\s*\\)\\s*\\+\\s*ZeroExt\\s*\\(\\s*1\\s*,\\s*y\\s*\\)', flags: '', must: true, hint: 'Widen to 33 bits: ZeroExt(1, x) + ZeroExt(1, y)', pass: '33-bit reference sum' },
      { re: 'ULT\\s*\\(\\s*x\\s*\\+\\s*y\\s*,\\s*x\\s*\\)', flags: '', must: true, hint: 'The unsigned overflow test is ULT(x + y, x)', pass: 'Unsigned comparison used' },
      { re: 'If\\s*\\(\\s*x\\s*<\\s*y\\s*,\\s*x\\s*,\\s*y\\s*\\)', flags: '', must: true, hint: 'Reference min: If(x < y, x, y)', pass: 'Reference min' },
      { re: 'LShR\\s*\\(\\s*-\\s*x\\s*,\\s*31\\s*\\)', flags: '', must: true, hint: 'Logical shift of -x: LShR(-x, 31)', pass: 'Logical shift in sign()' },
      { re: 'x\\s*>>\\s*31', flags: '', must: true, hint: 'Arithmetic shift: x >> 31 (copies the sign bit)', pass: 'Arithmetic shift in sign()' },
      { re: 'BitVecVal\\s*\\(\\s*-\\s*1\\s*,\\s*32\\s*\\)', flags: '', must: true, hint: 'Use BitVecVal(-1, 32) inside If, otherwise sort mismatch', pass: 'Typed literals in If' },
      { re: '\\(\\s*x\\s*\\+\\s*y\\s*<\\s*x\\s*\\)\\s*==\\s*\\(\\s*y\\s*<\\s*0\\s*\\)', flags: '', must: true, hint: 'Check (x + y < x) == (y < 0)', pass: 'C-style signed overflow test checked' },
      { re: 'TODO', flags: '', must: false, hint: 'Replace every TODO', pass: 'No TODOs left' }
    ],
    run: "Save as <code>int_tricks.py</code>, <code>pip install --user z3-solver</code>, then <code>python3 int_tricks.py</code>. Expected: the first three print <code>proved</code>; the fourth prints a counterexample such as <code>x=1358923281 y=872413081</code> (two positives whose sum wraps negative). Bonus: rerun with <code>BitVecs(\"x y\", 8)</code> to see an 8-bit counterexample you can check by hand.",
    solution: `# int_tricks.py -- run with: python3 int_tricks.py
from z3 import BitVecs, BitVecVal, Solver, Not, If, ULT, UGT, LShR, ZeroExt, sat, unsat

x, y = BitVecs("x y", 32)

def check(name, claim):
    s = Solver()
    s.add(Not(claim))
    r = s.check()
    if r == unsat:
        print("%-28s proved" % name)
    elif r == sat:
        m = s.model()
        print("%-28s COUNTEREXAMPLE x=%d y=%d" % (name, m.eval(x, True).as_signed_long(), m.eval(y, True).as_signed_long()))
    else:
        print("%-28s unknown" % name)

ONE, ZERO, MINUS1 = BitVecVal(1, 32), BitVecVal(0, 32), BitVecVal(-1, 32)

# 1) unsigned add overflows exactly when the wrapped sum is below an operand
wide = ZeroExt(1, x) + ZeroExt(1, y)
check("unsigned overflow test", ULT(x + y, x) == UGT(wide, BitVecVal(2**32 - 1, 33)))

# 2) branchless signed min: -(x < y) is all ones when x < y, else zero
check("branchless min", (y ^ ((x ^ y) & -If(x < y, ONE, ZERO))) == If(x < y, x, y))

# 3) sign function: -1, 0 or 1
check("sign via shifts", ((x >> 31) | LShR(-x, 31)) == If(x > 0, ONE, If(x < 0, MINUS1, ZERO)))

# 4) the C idiom for signed overflow (and UB in C anyway)
check("signed overflow: x+y < x", (x + y < x) == (y < 0))

# unsigned overflow test       proved
# branchless min               proved
# sign via shifts              proved
# signed overflow: x+y < x     COUNTEREXAMPLE x=1358923281 y=872413081
`,
    notes: [
      "Check (4) fails because with wrap-around, x + y < x can hold for positive y (the sum overflows to a negative number). In C it is worse: the compiler may assume signed overflow never happens and fold the test to y < 0, so the check vanishes. Use __builtin_add_overflow or Math.addExact.",
      "The sign trick works even for INT_MIN: -INT_MIN wraps to INT_MIN, whose top bit is 1, and INT_MIN >> 31 is -1, so the OR is -1. Z3 covered that case without you thinking of it.",
      "The sort-mismatch error you get from <code>If(x &gt; 0, 1, -1)</code> on bit-vectors is Z3 refusing to guess a width for the Python ints; use BitVecVal."
    ]
  },
  quiz: [
    {
      q: "x = BitVecVal(0x80, 8). What do x < 0 and ULT(x, 0) evaluate to?",
      options: ["True, True", "True, False", "False, False", "False, True"],
      correct: 1,
      explain: "0x80 is -128 signed, so x < 0 is True. Unsigned it is 128, and nothing is unsigned-less-than 0."
    },
    {
      q: "Which Z3 expression matches Java's x >>> 3 on an int?",
      options: ["x >> 3", "LShR(x, 3)", "UDiv(x, 3)", "x / 8"],
      correct: 1,
      explain: "Java's >>> is a logical shift (zero-fill): LShR. Python's >> on a Z3 BitVec is arithmetic, like Java's >>."
    },
    {
      q: "With f an uninterpreted function, which is valid?",
      options: ["f(x) == f(y) implies x == y", "x == y implies f(x) == f(y)", "f(f(x)) == x", "f(x) >= 0"],
      correct: 1,
      explain: "Only functional consistency (congruence) holds for every interpretation."
    },
    {
      q: "prove(Store(Store(A, i, 1), j, 2) == Store(Store(A, j, 2), i, 1)) gives a counterexample. What is it?",
      options: ["i != j", "i == j: the last write wins, so the arrays hold 2 and 1 at that index", "A is not initialized", "Arrays cannot be compared"],
      correct: 1,
      explain: "Stores to distinct indices commute; stores to the same index do not."
    },
    {
      q: "Which statement about quantifiers in Z3 is true?",
      options: ["Z3 is complete for all quantified formulas", "ForAll is handled by instantiation and can lead to unknown; linear arithmetic quantifiers can be eliminated exactly with qe", "Exists is harder than ForAll when asserted", "Patterns change the meaning of the formula"],
      correct: 1,
      explain: "Asserted Exists is just Skolemization. Patterns only control instantiation, not semantics."
    }
  ],
  testFlow: {
    title: "Test yourself: pick the operator",
    start: 'q1',
    nodes: {
      q1: {
        q: "You are modeling the C code `unsigned a, b; if (a / b > 3)`. Which Z3 encoding?",
        choices: [
          { text: "UGT(UDiv(a, b), 3), plus an assertion or check that b != 0", to: 'q1_right' },
          { text: "a / b > 3", to: 'q1_wrong' }
        ]
      },
      q1_right: { end: true, correct: true, text: "Right. Unsigned C types need unsigned operators, and division by zero is undefined in C but defined (all ones) in SMT-LIB, so you add the b != 0 check yourself.", next: 'q2' },
      q1_wrong: { end: true, correct: false, text: "Plain / and > on Z3 bit-vectors are signed. For unsigned C types use UDiv and UGT, and handle b == 0.", retry: 'q1' },
      q2: {
        q: "You want to prove refactored code that calls sha256(buf) twice is equivalent to the original that calls it once and reuses the result. How do you model sha256?",
        choices: [
          { text: "As an uninterpreted function: congruence is exactly the fact the proof needs", to: 'q2_right' },
          { text: "Bit-precisely, by encoding the full SHA-256 circuit", to: 'q2_wrong' }
        ]
      },
      q2_right: { end: true, correct: true, text: "Yes. Equal inputs give equal outputs, and that is all the equivalence needs. Encoding SHA-256 bit-precisely would make the query enormous for no gain." },
      q2_wrong: { end: true, correct: false, text: "That is correct but needlessly expensive: the proof only needs 'same input, same output', which an uninterpreted function gives for free.", retry: 'q2' }
    }
  },
  pitfalls: [
    "Using <, /, >> on bit-vectors that model unsigned values. The Python operators are signed; use ULT, UDiv, LShR.",
    "Using Python's % expecting Java/C remainder. On BitVec it is bvsmod; Java's % is SRem.",
    "Passing raw Python ints as both branches of If on bit-vectors (sort mismatch), or mixing widths (8-bit + 32-bit) without ZeroExt/SignExt.",
    "Assuming an uninterpreted function has properties (injective, monotone) you never asserted, and being surprised by a counterexample.",
    "Adding quantified axioms casually: each ForAll can turn a fast decidable query into unknown. Keep them few, with good patterns."
  ],
  interview: [
    {
      q: "How would you use Z3 to check whether a bit-twiddling optimization is correct?",
      a: "Model both versions on BitVec of the real width (32 or 64), with operators matching the language's semantics (signed vs unsigned shifts, division and comparison), assert they differ, and check. Unsat means equivalent for every input, including edge cases like 0, INT_MIN and overflow; sat gives a concrete input. This is the idea behind Alive and Alive2, which verify LLVM peephole optimizations with Z3, including reasoning about undef and poison values."
    },
    {
      q: "Explain signed vs unsigned bit-vector operations and where they differ.",
      a: "Two's complement makes add, sub, mul, and bitwise operations identical for both interpretations, so there is one bvadd. They differ for comparisons (bvslt vs bvult), division and remainder (bvsdiv, bvsrem, bvsmod vs bvudiv, bvurem), right shift (arithmetic vs logical), and widening (sign vs zero extension). Overflow conditions also differ: unsigned addition overflows when there is a carry out, signed when two same-sign operands give an opposite-sign result."
    },
    {
      q: "How do symbolic execution engines model memory with SMT arrays, and what are the costs?",
      a: "Memory is an array from 64-bit addresses to bytes. A store at a symbolic address creates Store(mem, addr, val); a load is Select. Multi-byte accesses are Concat or Extract over consecutive bytes, respecting endianness. The cost is that reads after many symbolic writes create long Store chains, and the solver has to case-split on whether addresses alias, which can blow up. KLEE mitigates by splitting memory into objects (one array per allocation) and resolving pointers to candidate objects; angr concretizes symbolic addresses using strategies when the range is large."
    },
    {
      q: "Explain a tradeoff: modeling a library function precisely vs as an uninterpreted function.",
      a: "Precise modeling makes queries complete for that function's behavior but can make them huge or undecidable (floating-point math, hashes, string libraries). An uninterpreted function keeps queries small and decidable, and is sound for proofs that only need congruence, but it over-approximates: the solver may produce counterexamples where f behaves impossibly (spurious), so proofs that need real properties fail. The middle ground is abstraction-refinement: start with UF, and when a counterexample is spurious, add just the axiom (e.g. monotonicity) that rules it out."
    },
    {
      q: "Whiteboard: prove that x & (x - 1) clears the lowest set bit of a 32-bit x.",
      a: "Specification without the trick: for every bit position i, the result bit i is 0 if i is the lowest set position of x, and equals x's bit i otherwise. In Z3, define low = x & -x (isolates the lowest set bit, itself provable against a spec), then claim (x & (x - 1)) == x ^ low for all x, which includes x = 0 (both sides 0). Assert the negation over BitVec(32); unsat proves it. I would also state the independent spec low == 1 << k where k is the index of the lowest set bit, expressed with Or over 32 cases, to avoid proving one trick with another."
    },
    {
      q: "When does adding a ForAll to a Z3 query make it return unknown, and what do you do?",
      a: "When instantiation cannot find the right terms: no ground term matches the pattern, the pattern causes a matching loop, or the formula requires infinitely many instances (MBQI cannot build a finite model). Remedies: choose explicit patterns, instantiate the axiom by hand at the terms you need (often the best fix), restrict the quantifier to a finite domain and unroll it, use qe if the quantifier is over linear arithmetic, or move to a prover like Lean when the property genuinely needs induction."
    },
    {
      q: "What are tactics in Z3 and when have you needed them?",
      a: "Tactics transform goals: simplify, solve-eqs, bit-blast, qe, and so on, and combinators compose them into strategies; t.solver() makes a solver from a strategy. I use them to (1) inspect what preprocessing does to a slow query, (2) apply qe for quantified linear arithmetic, and (3) build a specialized pipeline for a family of bit-vector queries (simplify, solve-eqs, bit-blast, sat) when the default strategy is slower. For one-off queries the default Solver is usually best."
    }
  ]
};
