window.LESSONS = window.LESSONS || {};
window.LESSONS['abstract-interpretation'] = {
  id: 'abstract-interpretation',
  title: 'Lattices, Monotone Frameworks & Abstract Interpretation',
  category: 'Part 3 — Static Analysis Theory',
  timeMin: 45,
  summary: `The dataflow lesson used finite sets and a worklist and simply trusted that the iteration would stop and give a meaningful answer. This lesson supplies the theory behind that trust. Lattices explain why facts can be merged, monotone functions and fixpoint theorems explain why iteration terminates and what it converges to, and Galois connections explain why the result is <i>sound</i> about the real program. Abstract interpretation (Cousot and Cousot, 1977) is the general recipe: pick an abstract domain (signs, intervals, octagons), make each operation over-approximate its concrete counterpart, and use <b>widening</b> when the domain is too tall for plain iteration to terminate.`,
  goals: [
    `Define a partial order, a join-semilattice, a complete lattice and lattice height, and use them to explain dataflow termination`,
    `State the fixpoint theorems (Knaster–Tarski, Kleene) informally and say what "least fixed point" means for an analysis`,
    `Explain soundness via a Galois connection (α, γ) and check an abstract operator for soundness`,
    `Run interval analysis on a loop and explain why widening is required and how narrowing recovers precision`,
    `Compare non-relational (sign, constant, interval) and relational (octagon, polyhedra) domains on cost and precision`
  ],
  concept: [
    {
      h: 'Lattices: the algebra of "how much do we know"',
      p: [
        `A <b>partial order</b> ⊑ is reflexive, antisymmetric and transitive. In analysis terms, <code>a ⊑ b</code> means "a is at least as precise as b", or equivalently "b describes at least the states a describes". A <b>join-semilattice</b> has a least upper bound <code>a ⊔ b</code> for every pair, and that is how facts from two incoming edges are merged. A <b>complete lattice</b> has a join and meet for every subset, including a bottom ⊥ (no information yet, or unreachable) and a top ⊤ (anything is possible).`,
        `<b>Height</b> is the length of the longest strictly increasing chain. The powerset of n definitions has height n. The flat constant lattice ⊥ ⊏ {each integer} ⊏ ⊤ has height 2, however many integers there are. The interval lattice has <b>infinite</b> height: [0,0] ⊏ [0,1] ⊏ [0,2] ⊏ … never stops. Height is the property that decides whether naive iteration terminates.`,
        `Products and maps of lattices are lattices too, ordered pointwise. A constant-propagation state is a map Var → FlatLattice, and its height is |Var| × 2. That is why constant propagation over a finite set of variables terminates even though there are infinitely many integers.`
      ],
      code: `Sign lattice                 Flat constants              Intervals (infinite height)
        ⊤                          ⊤                       [-∞,+∞]
     /  |  \\                 / / | \\ \\                     ...
   NEG ZERO POS          ... -1  0  1  2 ...          [0,2]   [-1,1]
     \\  |  /                 \\ \\ | / /                  |  \\  /
        ⊥                          ⊥                  [0,1] [0,0] ...
height 2                     height 2                     height ∞ -> needs widening`
    },
    {
      h: 'Monotone frameworks and fixpoints',
      p: [
        `A <b>monotone framework</b> (Kam and Ullman) is a lattice L, a set of monotone transfer functions <code>f: L → L</code>, a flow graph and boundary values. Every analysis in the dataflow lesson is an instance of it. Monotone means <code>x ⊑ y ⇒ f(x) ⊑ f(y)</code>: knowing less can never let you conclude more.`,
        `<b>Knaster–Tarski:</b> a monotone function on a complete lattice has a least fixed point, and the set of its fixed points is itself a complete lattice. <b>Kleene:</b> if f is also continuous, which is automatic when the lattice has finite height, then the least fixed point is the limit of <code>⊥, f(⊥), f(f(⊥)), …</code>. The worklist algorithm is a chaotic version of that iteration. Any fair order of updates reaches the same least fixed point.`,
        `Why the <i>least</i> fixed point? The analysis equations usually have many solutions. "Every definition reaches everywhere" satisfies the reaching-definitions equations, but it is far less precise than necessary. The least solution contains only the facts that the program forces to be true. Starting from ⊥ and only climbing reaches it and never overshoots.`
      ]
    },
    {
      h: 'Abstract interpretation and soundness',
      p: [
        `The <b>concrete semantics</b> of a program point is the set of all states that can occur there, which is uncomputable in general (see Rice's theorem in the Python analyzers lesson). Abstract interpretation picks an <b>abstract domain</b> A plus two maps. <b>α</b> (abstraction) sends a set of concrete values to its best abstract description, and <b>γ</b> (concretisation) sends an abstract value to the set of concrete values it represents. When <code>α(S) ⊑ a ⇔ S ⊆ γ(a)</code>, the pair is a <b>Galois connection</b>.`,
        `An abstract operator <code>op#</code> is <b>sound</b> if <code>op(γ(a)) ⊆ γ(op#(a))</code>: running the real operator on everything the abstract value describes stays inside the description of the abstract result. If every operator is sound and joins over-approximate unions, the fixpoint over-approximates every reachable state. A sound analysis that says "x is never negative here" is therefore a proof.`,
        `The <b>best</b> abstract operator is <code>α ∘ op ∘ γ</code>. You usually implement something cheaper that is still sound. Returning ⊤ is always sound and never useful, and that is the precision–cost dial.`
      ],
      code: `x ∈ POS, y ∈ NEG:   x + y  ->  TOP      (could be -5, 0 or 7: must say TOP)
x ∈ POS, y ∈ POS:   x + y  ->  POS
x ∈ TOP:            x * x  ->  TOP      (sound, but x*x >= 0 is lost: the domain
                                         cannot relate the two operands)
x ∈ [1,3], y ∈ [-2,5]:  x + y -> [-1,8],   x * y -> [min, max of corner products] = [-6,15]`
    },
    {
      h: 'Widening and narrowing',
      p: [
        `For <code>i = 0; while i &lt; 100: i = i + 1</code>, plain Kleene iteration on intervals gives [0,0], [0,1], [0,2], … at the loop head and takes 102 iterations to reach [0,100]. If the bound is unknown (<code>while i &lt; n</code>), it never stops. A <b>widening</b> operator ∇ forces convergence. It satisfies <code>a ⊔ b ⊑ a ∇ b</code>, so it stays sound, and every chain <code>x₀, x₀∇x₁, …</code> stabilises in finitely many steps. The standard interval widening keeps a stable bound and sends a growing bound straight to ±∞: <code>[0,0] ∇ [0,1] = [0,+∞]</code>.`,
        `Widening overshoots. <b>Narrowing</b> (Δ) then iterates downward from the post-fixpoint while staying above the least fixed point, and it refines only the infinite bounds. One narrowing step through the loop guard <code>i &lt; 100</code> gives the head back as [0,100], and the exit, filtered by <code>i ≥ 100</code>, as exactly [100,100].`,
        `Practical tricks: apply widening only at loop heads, which form a cut set of the CFG; delay widening for the first k iterations; and use <b>widening with thresholds</b>, where bounds jump to the next program constant (for example 100) instead of ∞.`
      ]
    },
    {
      h: 'Choosing a domain',
      p: [
        `<div class="cmp-wrap"><table class="cmp"><tr><th>Domain</th><th>Represents</th><th>Relational?</th><th>Cost per op</th><th>Proves</th></tr><tr><td>Sign / parity</td><td>x ∈ {−,0,+}</td><td>no</td><td>O(1) per var</td><td>no division by zero, sign of results</td></tr><tr><td>Constants</td><td>x = c or unknown</td><td>no</td><td>O(1) per var</td><td>constant folding, dead branches</td></tr><tr><td>Intervals</td><td>a ≤ x ≤ b</td><td>no</td><td>O(1) per var</td><td>array bounds, overflow ranges</td></tr><tr><td>Octagons (Miné)</td><td>±x ± y ≤ c</td><td>yes</td><td>O(n²) memory, O(n³) closure</td><td>i &lt; n relationships, loop counters vs lengths</td></tr><tr><td>Convex polyhedra</td><td>Σ aᵢxᵢ ≤ c</td><td>yes</td><td>exponential worst case</td><td>arbitrary linear invariants</td></tr></table></div>`,
        `Non-relational domains cannot prove <code>a[i]</code> safe when the loop is <code>for i in range(len(a))</code>, because they do not know that i &lt; len(a). That needs a relational fact. Industrial analyzers such as Astrée (used on Airbus flight-control code), Frama-C's Eva plugin, NASA's IKOS and Meta's SPARTA library combine several domains (reduced products) and pack variables into small groups so that relational domains stay affordable.`
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: `The parts that separate "I have heard of abstract interpretation" from "I could build one": exactly what a Galois connection guarantees, why widening breaks monotonicity, how reduced products work, and where precision is lost in practice.`,
    sections: [
      {
        h: 'Galois connections, precisely',
        p: [
          `Take the concrete lattice to be (℘(Values), ⊆) and an abstract lattice (A, ⊑). A Galois connection requires both maps to be monotone, <code>S ⊆ γ(α(S))</code> (abstraction loses information but never loses states), and <code>α(γ(a)) ⊑ a</code>. If <code>α(γ(a)) = a</code> holds as well, it is a Galois <i>insertion</i>, meaning the domain has no redundant elements. Some useful domains, polyhedra among them, have no best abstraction (there is no smallest polyhedron containing a disc), so the theory is also stated with only γ, using soundness alone.`,
          `The soundness theorem: if each abstract transfer function f# satisfies <code>α ∘ f ∘ γ ⊑ f#</code>, then <code>lfp(f) ⊆ γ(lfp(f#))</code>. The abstract fixpoint covers every concrete reachable state. That one line is the meaning of "sound static analysis".`
        ]
      },
      {
        h: 'Widening is not monotone, and that is fine',
        p: [
          `Widening operators are generally not monotone, and the result after widening depends on the iteration order. Termination comes from the chain-stabilisation property, not from finite height. Soundness comes from <code>a ⊔ b ⊑ a ∇ b</code>. You lose the guarantee of reaching the <i>least</i> fixed point and keep only a post-fixpoint, which is why narrowing (or simply one or two extra plain iterations from that post-fixpoint) is worth running.`,
          `A classic precision trap is the nested loop. Widening the outer loop's head too early sends the inner counters to ∞ before their own guards have been applied. Iteration strategies based on weak topological ordering (Bourdoncle 1993) stabilise inner components first and widen only at their heads. This is the standard in tools such as IKOS and Crab.`
        ]
      },
      {
        h: 'Reduced products and path sensitivity',
        p: [
          `Running intervals and parity side by side gives the <b>product</b> domain. A <b>reduced product</b> also lets each domain tighten the other: x ∈ [1,1] together with "x is even" is a contradiction, so the state is ⊥ (unreachable). Reduction is how industrial analyzers combine cheap domains without paying for a full relational one.`,
          `Path sensitivity is a separate axis. <b>Trace partitioning</b> keeps separate abstract states per branch outcome until a join point that the analysis decides is safe, and it recovers precision in correlated-branch code such as the <code>if flag: x = 1 … if flag: use(x)</code> pattern. At the far end, symbolic execution is path-sensitive with a logical domain and an SMT solver deciding feasibility. That is the bridge to the formal-methods course.`
        ]
      },
      {
        h: 'Where abstract interpretation shows up outside safety-critical C',
        p: [
          `Type inference can be seen as abstract interpretation over a domain of types. Pyright's narrowing of <code>Optional[int]</code> after <code>if x is not None</code> is a refinement of an abstract value at a branch. Infer's InferBO checker uses symbolic intervals to find buffer overruns, and its Pulse engine is built on abstract interpretation with separation-logic-style memory abstractions. Android's ReDex optimizer uses Meta's SPARTA library for its constant-propagation and type analyses. In interviews, being able to say "this is a domain, this is the join, this is why it terminates" for any of these is the point.`
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: `Nami's Weather Bands Instead of Exact Forecasts`,
      text: [
        `Nobody aboard the Sunny can predict the exact wind speed at every hour on the Grand Line. Nami gives up on exact numbers and logs a band per island instead, such as "between force 2 and force 5". Two routes into the same island means she merges the bands, with the lowest low and the highest high. It is never wrong, because every real wind fits inside the band. It just gets wider.`,
        `On the looping current around Long Ring Long Land the band keeps creeping: 0–1, then 0–2, then 0–3. Usopp groans that this will take forever. Nami draws "0 to anything" and moves on. That is widening. Then she sails the loop one more time, notices the current always breaks at force 100 where the reef stops it, and trims the band back to 0–100. That is narrowing.`
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: `Sheldon's "Somewhere Between" Answer`,
      text: [
        `Penny asks how long Sheldon's train-set modifications will take. He refuses to give a single number, because a single number could be wrong, and being wrong is unacceptable to Sheldon. "Between three hours and the heat death of the universe." It is useless, but it is certainly correct.`,
        `Leonard points out that every previous project finished before Comic-Con. Sheldon tightens his estimate: "between three hours and the next Comic-Con." He is still never wrong, and he is now much more useful. Sound by construction, then refined using a known bound: that is the analyser's job.`
      ]
    },
    why: `Nami's bands are intervals. Merging routes is the join, so the band only widens. "0 to anything" is widening, which guarantees she stops. Trimming at the reef is narrowing through the loop guard. Sheldon's always-correct-but-broad answers are soundness, and his refinement is precision bought without giving up soundness.`
  },
  storyAnim: {
    h: 240,
    props: [
      { id: 'head', emoji: '🌀', label: 'loop head: i = ?', x: 45, y: 14 },
      { id: 'guard', emoji: '🪨', label: 'guard i < 100', x: 80, y: 40 },
      { id: 'body', emoji: '⚙️', label: 'i = i + 1', x: 80, y: 80 },
      { id: 'exit', emoji: '🏁', label: 'exit: i = ?', x: 12, y: 80 },
      { id: 'log', emoji: '📓', label: 'iterations: 0', x: 12, y: 14 }
    ],
    actors: [
      { id: 'nami', emoji: '🧭', label: 'Nami', x: 30, y: 45 },
      { id: 'usopp', emoji: '😩', label: 'Usopp', x: 55, y: 60 }
    ],
    steps: [
      { c: `Entry sends i = [0,0] to the loop head. Nami logs the first band.`, l: { head: 'loop head: [0,0]', log: 'iterations: 1' }, p: { head: 'lit' } },
      { c: `Around the loop: the guard keeps [0,0] and the body adds 1, giving [1,1]. Join with the entry value: [0,1].`, a: { nami: [70, 55] }, l: { head: 'loop head: [0,1]', log: 'iterations: 2' }, p: { guard: 'lit', body: 'lit' } },
      { c: `Again: [0,2], then [0,3]... Usopp says this will take 100 laps, and with an unknown bound n it would never end.`, a: { usopp: [60, 40] }, l: { head: 'loop head: [0,3]...', log: 'iterations: 4...' }, p: { log: 'bad' } },
      { c: `Widening: the upper bound is unstable, so jump it straight to +∞. [0,0] ∇ [0,1] = [0,+∞]. One more pass confirms it is stable.`, a: { nami: [45, 40] }, l: { head: 'loop head: [0,+∞]', log: 'iterations: 3 (widened)' }, p: { head: 'good', log: 'lit' } },
      { c: `Narrowing: push [0,+∞] through the guard (≤ 99) and the body (+1), giving [1,100]. Join with entry: [0,100]. Only the infinite bound gets refined.`, a: { nami: [74, 62] }, l: { head: 'loop head: [0,100]' }, p: { guard: 'good' } },
      { c: `At the exit, the head value filtered by NOT (i < 100) gives exactly [100,100]. Sound and precise, in a handful of steps. 🏴‍☠️`, a: { nami: [22, 70], usopp: [30, 52] }, l: { exit: 'exit: [100,100]' }, p: { exit: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'Interval analysis of a counting loop',
    intro: 'The same numbers the code below prints. Click a box or press Play.',
    stages: [
      { label: 'Domain', nodes: [ { id: 'lat', text: 'Interval lattice\n⊥ ⊑ [a,b] ⊑ [-∞,+∞]\ninfinite height' }, { id: 'ops', text: 'Sound operators\njoin = hull, + shifts,\nguards = meet' } ] },
      { label: 'Ascend', nodes: [ { id: 'k1', text: 'Kleene step\n[0,0] → [0,1] → [0,2]…' }, { id: 'stuck', text: 'Would need 102 steps\n(∞ with unknown bound)' } ] },
      { label: 'Widen', nodes: [ { id: 'wid', text: 'Widen at loop head\n[0,0] ∇ [0,1] = [0,+∞]' }, { id: 'post', text: 'Post-fixpoint\nstable after 3 steps' } ] },
      { label: 'Refine', nodes: [ { id: 'nar', text: 'Narrow via guard\n[0,+∞] → [0,100]' }, { id: 'exit', text: 'Exit: i ≥ 100\n→ [100,100]' } ] }
    ],
    steps: [
      { active: ['lat'], note: 'Intervals form a lattice ordered by containment. Its height is infinite, so the termination argument from the dataflow lesson no longer applies.' },
      { active: ['ops'], note: 'Each abstract operation must over-approximate the concrete one. Join takes the convex hull, x+1 shifts both bounds, and the guard i<100 intersects with [-∞,99].' },
      { active: ['k1'], note: 'Plain iteration from ⊥ climbs one step per lap around the loop.' },
      { active: ['stuck'], note: 'With the constant 100 it takes 102 iterations. With an unknown n the chain never stabilises. That is why widening exists.' },
      { active: ['wid'], note: 'Widening keeps the stable lower bound 0 and sends the growing upper bound to +∞. It is still sound, because it is above the join.' },
      { active: ['post'], note: 'Another pass gives [0,+∞] again: a post-fixpoint. Sound, but imprecise.' },
      { active: ['nar'], note: 'One descending pass through the guard and the body refines only the infinite bound, giving [0,100].' },
      { active: ['exit'], note: 'Filtering the head value by the negated guard gives exactly i = 100 at the exit, which is the best possible answer.' }
    ]
  },
  tech: [
    {
      q: `Is "soundness" in abstract interpretation the same as "soundness" for a bug finder?`,
      a: `Not quite, and interviewers like this distinction. An abstract interpreter is sound if its result over-approximates every reachable concrete state. A sound <i>verifier</i> built on it therefore never misses a violation of the property: no false negatives, possibly some false alarms. Many bug finders are deliberately unsound, so that they report fewer false positives (Infer's Pulse, Coverity, most linters). People often say "sound" when they mean "no false negatives with respect to the property". Say which property, and whether you mean soundness of the analysis or of the alarm reporting.`
    },
    {
      q: `Why is returning ⊤ always sound, and why is that a trap when writing abstract operators?`,
      a: `γ(⊤) is every value, so <code>op(γ(a)) ⊆ γ(⊤)</code> holds trivially. When you are unsure how to abstract an operation, such as a library call or bitwise arithmetic, ⊤ keeps the analysis correct. The trap is that ⊤ spreads: every expression that uses a ⊤ operand tends to become ⊤ too, and soon every alarm fires. Good analyzers model the common operations precisely and fall back to ⊤ only at the edges. The lab's sign multiplication shows a useful case: ZERO × ⊤ is ZERO, not ⊤.`
    },
    {
      q: `How does a dataflow framework relate to abstract interpretation? Are they different things?`,
      a: `Monotone dataflow frameworks are a special case. They use finite-height lattices and per-block transfer functions, and their soundness is usually argued informally. Abstract interpretation adds the semantic link (α/γ), so you can <i>prove</i> soundness against the concrete semantics. It also adds widening and narrowing, so infinite-height domains such as intervals and polyhedra become usable. In practice, a reaching-definitions pass and an interval analyzer share the same engine: a worklist, joins at merges, transfer functions, plus widening at loop heads.`
    },
    {
      q: `Why do analyzers widen only at loop heads?`,
      a: `Every infinite ascending chain must go around a cycle in the CFG, and every cycle passes through a loop head (more generally, through a node of a feedback vertex set or WTO component head). Widening there is enough to guarantee termination. Widening at other points throws away precision for no benefit, because those points would converge on their own once their inputs stabilise.`
    }
  ],
  code: {
    title: 'Interval analysis with widening and narrowing',
    intro: `Self-contained, stdlib only. Save it as <code>intervals.py</code> and run <code>python3 intervals.py</code>. It analyses <code>i = 0; while i &lt; 100: i = i + 1</code> three ways.`,
    code: "\"\"\"Interval abstract interpretation of\n       i = 0\n       while i < 100:      # loop head H\n           i = i + 1\n       # exit X\nshowing why widening is needed and how narrowing recovers precision.\"\"\"\nimport math\nINF = math.inf\nBOT = None                       # the empty interval (unreachable)\n\n\ndef join(a, b):                  # least upper bound (convex hull)\n    if a is BOT: return b\n    if b is BOT: return a\n    return (min(a[0], b[0]), max(a[1], b[1]))\n\n\ndef meet(a, b):                  # greatest lower bound (intersection)\n    if a is BOT or b is BOT: return BOT\n    lo, hi = max(a[0], b[0]), min(a[1], b[1])\n    return (lo, hi) if lo <= hi else BOT\n\n\ndef widen(old, new):             # jump unstable bounds to infinity\n    if old is BOT: return new\n    if new is BOT: return old\n    lo = old[0] if new[0] >= old[0] else -INF\n    hi = old[1] if new[1] <= old[1] else INF\n    return (lo, hi)\n\n\ndef narrow(old, new):            # refine only the infinite bounds\n    if old is BOT or new is BOT: return BOT\n    lo = new[0] if old[0] == -INF else old[0]\n    hi = new[1] if old[1] == INF else old[1]\n    return (lo, hi)\n\n\ndef add(a, k):\n    return BOT if a is BOT else (a[0] + k, a[1] + k)\n\n\ndef body(head):\n    \"\"\"One pass of the loop: returns (value fed back to head, exit value).\"\"\"\n    in_loop = meet(head, (-INF, 99))      # assume i < 100   (integers)\n    back = add(in_loop, 1)                # i = i + 1\n    exit_ = meet(head, (100, INF))        # assume not (i < 100)\n    return back, exit_\n\n\ndef analyze(use_widening, max_iter=1000):\n    entry = (0, 0)\n    head = BOT\n    for n in range(1, max_iter + 1):\n        back, _ = body(head)\n        new = join(entry, back)\n        nxt = widen(head, new) if use_widening else new\n        if nxt == head:\n            return head, n\n        head = nxt\n    return head, max_iter\n\n\nh, n = analyze(use_widening=False)\nprint(f\"plain Kleene iteration : head={h}  after {n} iterations\")\nh, n = analyze(use_widening=True)\nprint(f\"with widening          : head={h}  after {n} iterations\")\n# one descending (narrowing) step from the post-fixpoint\nback, _ = body(h)\nh2 = narrow(h, join((0, 0), back))\nprint(f\"after narrowing        : head={h2}\")\nprint(f\"exit state             : i in {body(h2)[1]}\")\n",
    notes: [
      `Verified output: <code>plain Kleene iteration : head=(0, 100)  after 102 iterations</code>, <code>with widening : head=(0, inf) after 3 iterations</code>, <code>after narrowing : head=(0, 100)</code>, <code>exit state : i in (100, 100)</code>.`,
      `Change the guard to an unknown bound by replacing <code>99</code> with <code>INF</code> in <code>body()</code>. Plain iteration then runs to <code>max_iter</code> without converging, while the widened version still stops after 3 iterations.`,
      `<code>meet(head, (-INF, 99))</code> is how branch conditions refine abstract values. It is the same mechanism that lets Pyright narrow <code>Optional[int]</code> to <code>int</code> after an <code>is not None</code> check.`
    ]
  },
  lab: {
    title: 'Make the sign domain sound and precise',
    prompt: `The starter implements the sign lattice ⊥ ⊑ NEG, ZERO, POS ⊑ ⊤, but <code>mul</code> and <code>add</code> always return TOP. That is sound but useless. Make them as precise as possible while keeping them sound. <code>mul</code> must return ZERO whenever either operand is ZERO (even TOP × ZERO), return ⊥ when either operand is ⊥, and work out POS/NEG products by the usual sign rules. <code>add</code> returns the other operand when one side is ZERO, keeps POS+POS = POS and NEG+NEG = NEG, and returns TOP for mixed signs. The brute-force soundness loop at the bottom has to keep passing.`,
    starter: `# Sign domain:  BOT < NEG, ZERO, POS < TOP
BOT, NEG, ZERO, POS, TOP = "BOT", "NEG", "ZERO", "POS", "TOP"


def alpha(n):
    """Abstraction: concrete integer -> abstract sign."""
    return NEG if n < 0 else ZERO if n == 0 else POS


def join(a, b):
    if a == BOT:
        return b
    if b == BOT:
        return a
    return a if a == b else TOP


def mul(a, b):
    return TOP                 # TODO: sound but useless - make it precise


def add(a, b):
    return TOP                 # TODO: sound but useless - make it precise


def gamma_contains(sign, n):
    return sign == TOP or sign == alpha(n)


for x in range(-3, 4):
    for y in range(-3, 4):
        assert gamma_contains(mul(alpha(x), alpha(y)), x * y), (x, y)
        assert gamma_contains(add(alpha(x), alpha(y)), x + y), (x, y)

print("x*x for x in TOP-sign:", mul(TOP, TOP), "(sound, but loses x*x >= 0)")
print("merge POS and ZERO:", join(POS, ZERO))
print("sign arithmetic is sound on all tested pairs")
`,
    checks: [
      { re: 'def\\s+mul\\s*\\(\\s*a\\s*,\\s*b\\s*\\)\\s*:[\\s\\S]*?if\\s+BOT\\s+in\\s+\\(\\s*a\\s*,\\s*b\\s*\\)', flags: '', must: true, hint: 'mul: return BOT first if either operand is BOT (unreachable stays unreachable). Use: if BOT in (a, b).', pass: 'mul handles ⊥ ✓' },
      { re: 'if\\s+ZERO\\s+in\\s+\\(\\s*a\\s*,\\s*b\\s*\\)\\s*:\\s*\\n\\s*return\\s+ZERO', flags: '', must: true, hint: 'mul: if ZERO in (a, b): return ZERO. Zero times anything is zero, even TOP.', pass: 'ZERO absorbs ✓' },
      { re: 'return\\s+POS\\s+if\\s+a\\s*==\\s*b\\s+else\\s+NEG', flags: '', must: true, hint: 'mul on two definite signs: return POS if a == b else NEG.', pass: 'sign rule ✓' },
      { re: 'if\\s+a\\s*==\\s*ZERO\\s*:\\s*\\n\\s*return\\s+b', flags: '', must: true, hint: 'add: if a == ZERO: return b (0 is the identity for +).', pass: 'add identity ✓' },
      { re: 'def\\s+mul[^\\n]*\\n\\s*return\\s+TOP', flags: '', must: false, hint: 'mul still returns TOP unconditionally. Replace the stub.', pass: 'mul stub replaced ✓' },
      { re: 'def\\s+add[^\\n]*\\n\\s*return\\s+TOP', flags: '', must: false, hint: 'add still returns TOP unconditionally. Replace the stub.', pass: 'add stub replaced ✓' }
    ],
    run: `Save the file as <code>signs.py</code> and run <code>python3 signs.py</code>. Expected output: <code>x*x for x in TOP-sign: TOP (sound, but loses x*x &gt;= 0)</code>, <code>merge POS and ZERO: TOP</code>, <code>sign arithmetic is sound on all tested pairs</code>. To see the soundness check fail, make <code>add(POS, NEG)</code> return POS. The assert fires on <code>(1, -3)</code>.`,
    solution: "# Sign domain:  BOT < NEG, ZERO, POS < TOP\nBOT, NEG, ZERO, POS, TOP = \"BOT\", \"NEG\", \"ZERO\", \"POS\", \"TOP\"\n\n\ndef alpha(n):\n    \"\"\"Abstraction: concrete integer -> abstract sign.\"\"\"\n    return NEG if n < 0 else ZERO if n == 0 else POS\n\n\ndef join(a, b):\n    if a == BOT:\n        return b\n    if b == BOT:\n        return a\n    return a if a == b else TOP\n\n\ndef mul(a, b):\n    if BOT in (a, b):\n        return BOT\n    if ZERO in (a, b):\n        return ZERO            # 0 * anything = 0, even TOP\n    if TOP in (a, b):\n        return TOP\n    return POS if a == b else NEG\n\n\ndef add(a, b):\n    if BOT in (a, b):\n        return BOT\n    if a == ZERO:\n        return b\n    if b == ZERO:\n        return a\n    if a == b and a != TOP:\n        return a               # POS+POS = POS, NEG+NEG = NEG\n    return TOP                 # POS+NEG could be anything\n\n\n# Soundness check: for every pair of small integers, the concrete result\n# must be described by the abstract result.\ndef gamma_contains(sign, n):\n    return sign == TOP or sign == alpha(n)\n\n\nfor x in range(-3, 4):\n    for y in range(-3, 4):\n        assert gamma_contains(mul(alpha(x), alpha(y)), x * y), (x, y)\n        assert gamma_contains(add(alpha(x), alpha(y)), x + y), (x, y)\n\nprint(\"x*x for x in TOP-sign:\", mul(TOP, TOP), \"(sound, but loses x*x >= 0)\")\nprint(\"merge POS and ZERO:\", join(POS, ZERO))\nprint(\"sign arithmetic is sound on all tested pairs\")\n",
    notes: [
      `<code>mul(TOP, TOP)</code> stays TOP even though x*x is never negative. A non-relational domain cannot know that both operands are the same variable. A relational domain, or a special case for <code>x*x</code>, would be needed.`,
      `The brute-force loop is a cheap soundness test for abstract operators: enumerate small concrete values, abstract them, and check that γ of the abstract result contains the concrete result. Real analyzer test suites do the same thing at scale.`,
      `<code>join(POS, ZERO)</code> is TOP in this lattice. Adding NONNEG (≥ 0) and NONPOS elements gives a more precise 7-element sign lattice.`
    ]
  },
  quiz: [
    {
      q: 'Which property of the interval lattice forces the use of widening?',
      options: ['It is not a lattice', 'It has infinite height, so ascending chains may never stabilise', 'Its join is not commutative', 'It has no bottom element'],
      correct: 1,
      explain: 'Kleene iteration terminates on finite-height lattices. [0,0] ⊏ [0,1] ⊏ [0,2] ⊏ … is infinite, so termination must be forced by a widening operator.'
    },
    {
      q: 'An abstract operator op# is sound when…',
      options: ['op#(α(x)) = α(op(x)) for all x', 'Applying op to every value described by a lands inside γ(op#(a))', 'It returns the smallest possible abstract value', 'It is monotone'],
      correct: 1,
      explain: 'Soundness is op(γ(a)) ⊆ γ(op#(a)), an over-approximation. Equality would make it the best (complete) operator, which is not required.'
    },
    {
      q: 'What does the standard interval widening compute for [0,1] ∇ [0,2]?',
      options: ['[0,2]', '[0,+∞]', '[-∞,+∞]', '[1,2]'],
      correct: 1,
      explain: 'The lower bound 0 is stable and kept. The upper bound grew, so it jumps to +∞.'
    },
    {
      q: 'Why can intervals not prove a[i] in bounds for `for i in range(len(a))` when the length is unknown?',
      options: ['Intervals cannot represent integers', 'The property needs a relation between i and len(a), and intervals are non-relational', 'Widening is unsound', 'Python has no arrays'],
      correct: 1,
      explain: 'Intervals track each variable on its own. i < len(a) is a relational constraint, which octagons (i − n ≤ −1) can express.'
    },
    {
      q: 'What does the least fixed point represent for a forward may-analysis?',
      options: ['The most facts consistent with the equations', 'The smallest set of facts that the program forces to hold, which is the most precise sound solution of the equations', 'An unsound under-approximation', 'The result of the first iteration'],
      correct: 1,
      explain: 'Many solutions satisfy the equations, and "everything reaches everywhere" is one of them. Starting from ⊥ and climbing yields the least one, which is the most precise.'
    }
  ],
  testFlow: {
    title: 'Test yourself: domains and convergence',
    start: 'q1',
    nodes: {
      q1: { q: 'Your interval analyzer hangs on `while i != n: i += 1` with n unknown. Fix?', choices: [ { text: 'Apply widening at the loop head', to: 'q1_ok' }, { text: 'Use reverse postorder', to: 'q1_rpo' }, { text: 'Switch to the sign domain', to: 'q1_sign' } ] },
      q1_ok: { end: true, correct: true, text: 'Yes. The ascending chain is infinite, and widening forces it to stabilise ([0,+∞]) at the cycle cut point.', next: 'q2' },
      q1_rpo: { end: true, correct: false, text: 'The order changes the number of steps on finite lattices. It cannot make an infinite chain finite.', retry: 'q1' },
      q1_sign: { end: true, correct: false, text: 'That terminates, because the sign lattice has finite height, but you lose all range information. Widening keeps the interval domain.', retry: 'q1' },
      q2: { q: 'x ∈ ⊤ (sign). What should a precise, sound mul return for x * 0?', choices: [ { text: 'ZERO', to: 'q2_ok' }, { text: 'TOP', to: 'q2_top' } ] },
      q2_ok: { end: true, correct: true, text: 'Right. Every concrete x gives x*0 = 0, so ZERO is sound and strictly more precise than TOP.', next: 'q3' },
      q2_top: { end: true, correct: false, text: 'TOP is sound but needlessly imprecise. Zero absorbs every concrete value, so you can say ZERO.', retry: 'q2' },
      q3: { q: 'You need to prove i < len(a) throughout a loop. Cheapest domain that can express it?', choices: [ { text: 'Octagons (±x ± y ≤ c)', to: 'q3_ok' }, { text: 'Intervals', to: 'q3_int' }, { text: 'Full polyhedra', to: 'q3_poly' } ] },
      q3_ok: { end: true, correct: true, text: 'Correct. i − len ≤ −1 is an octagonal constraint, cubic to close, and far cheaper than polyhedra.' },
      q3_int: { end: true, correct: false, text: 'Intervals bound each variable separately and cannot state a relation between two of them.', retry: 'q3' },
      q3_poly: { end: true, correct: false, text: 'Polyhedra work, but they are exponential in the worst case. Octagons are the cheapest domain that captures differences between two variables.', retry: 'q3' }
    }
  },
  pitfalls: [
    `Assuming that monotone transfer functions guarantee termination. You also need finite height, or a widening.`,
    `Widening everywhere instead of only at loop heads, which throws away precision for no gain.`,
    `Forgetting that guards refine values. If you skip the meet with <code>i &lt; 100</code> on the true edge, narrowing has nothing to recover from.`,
    `Calling an analyzer "sound" without naming the property and its assumptions. Most real tools are sound only modulo reflection, native code, concurrency or <code>eval</code>.`,
    `Writing an abstract operator by intuition and never testing it against concrete values. The brute-force α/γ check from the lab catches most mistakes.`
  ],
  interview: [
    {
      q: 'What is abstract interpretation, in two sentences, and why does it matter for static analysis?',
      a: `Abstract interpretation runs the program over an abstract domain: sets of states are approximated by elements of a lattice, each operation is replaced by a sound over-approximation, and the analysis computes a fixpoint, using widening when the lattice is tall. It matters because it gives one theory for termination (lattices, fixpoints, widening) and for correctness (Galois connections mean the abstract result covers every concrete execution), and every analysis from constant propagation to Astrée fits into it.`
    },
    {
      q: 'Explain widening and narrowing with a concrete loop.',
      a: `For <code>i = 0; while i &lt; n: i++</code>, the loop-head interval climbs [0,0], [0,1], [0,2], … forever, because n is unknown and intervals have infinite height. Widening at the head compares successive values and pushes any bound that grew to ±∞, so [0,0] ∇ [0,1] = [0,+∞], which is stable after one more pass. Widening is sound because a∇b ⊒ a⊔b, and it terminates because widened chains stabilise. It overshoots, so narrowing then iterates downward. With a constant bound of 100, one pass through the guard i ≤ 99 and the body i+1 gives [0,100] at the head and [100,100] at the exit. With unknown n, the refinement keeps [0,+∞], or a relational domain gives 0 ≤ i ≤ n.`
    },
    {
      q: 'Tradeoff: intervals versus octagons versus polyhedra for an array-bounds checker.',
      a: `Intervals are linear in the number of variables and very fast, but they are non-relational. They cannot prove <code>a[i]</code> safe when the bound is <code>len(a)</code> rather than a constant, which is most real loops. Octagons capture ±x±y ≤ c, which is exactly <code>i &lt; n</code> and <code>i ≤ j + 1</code>, at O(n²) space and O(n³) closure per variable pack. That is usually the sweet spot, and it is what Astrée uses with variable packing. Polyhedra express any linear invariant but are exponential in the worst case, so they are reserved for small, critical code. My answer would be intervals everywhere, octagons on packs of variables that appear together in index expressions, and polyhedra only if the proof still fails.`
    },
    {
      q: 'How do you know an abstract transfer function is sound? How would you test one?',
      a: `Formally, show that α∘f∘γ ⊑ f#, or equivalently that f(γ(a)) ⊆ γ(f#(a)), for every abstract a. Then the soundness theorem lifts it to the fixpoint. Practically, test it: enumerate or randomly sample abstract inputs, sample concrete values from γ of each, run the real operation, and assert that the abstraction of the result is ⊑ the abstract result. That is property-based testing (Hypothesis or QuickCheck). The same idea, differential testing of abstract against concrete semantics, has found real bugs in production analyzers and in LLVM's KnownBits analysis.`
    },
    {
      q: 'Whiteboard: design an abstract interpreter for a small imperative language.',
      a: `The components are: (1) a CFG front end with statements as edges or nodes; (2) a domain interface with ⊥, ⊤, ⊑, ⊔, ⊓, ∇, Δ, and transfer functions for assignment, guards (refining by meeting with the condition) and calls; (3) a fixpoint engine that iterates over a weak topological order (Bourdoncle), widens at component heads, optionally delays widening k times, and runs a narrowing pass after; (4) domains, starting with a map Var → Interval, plus a reduced product with constants or parity, and octagons on variable packs if precision requires them; (5) checkers that query the invariants at assertion points, such as divisor ∋ 0 or index ∉ [0, len−1], and report "proved", "alarm" or "unreachable (⊥)". For procedures, I would start with inlining or summary-based analysis and add context sensitivity only where alarms need it.`
    },
    {
      q: 'Why do linters and bug finders often give up soundness, when abstract interpretation is all about it?',
      a: `Soundness has a cost in false positives, and developers stop reading a tool whose alarms are mostly wrong. Rice's theorem says we cannot be sound, complete and terminating at once, so a tool has to pick a side. Verifiers for safety-critical code (Astrée on flight software) accept the false alarms and have experts triage them to zero. Developer-facing tools (Infer, Error Prone, Pylint, Semgrep) prefer high precision: they under-approximate on purpose, for example by assuming calls do not alias or by skipping reflection, and they are tuned so that most reports are real. Both use the same lattice machinery. They just choose different points on the precision–recall curve.`
    },
    {
      q: 'What is a Galois connection and why do we care?',
      a: `It is a pair of monotone maps α: ℘(Concrete) → Abstract and γ: Abstract → ℘(Concrete) with α(S) ⊑ a ⇔ S ⊆ γ(a). It formalises "a describes S", gives a best abstraction α(S) for every concrete set, and defines the best abstract transformer α∘f∘γ. Its practical value is that it turns soundness from a hope into a local proof obligation per operation, and it lets you compare domains, since one domain is more precise than another if its γ-image is finer.`
    }
  ]
};
