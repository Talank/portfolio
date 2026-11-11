window.LESSONS = window.LESSONS || {};
window.LESSONS['dataflow-analysis'] = {
  id: 'dataflow-analysis',
  title: 'Dataflow Analysis: Reaching Definitions, Liveness & the Worklist Algorithm',
  category: 'Part 3 — Static Analysis Theory',
  timeMin: 50,
  summary: `Part 2 gave you a control-flow graph. This lesson asks questions of it that hold on <i>every</i> execution: which assignments can reach this use, which variables still matter here, which expressions have already been computed. Each of those questions is a dataflow analysis. Each one is defined by a direction, a meet operator and a per-block transfer function, and all of them are solved by the same worklist loop. Learn the framework once and you can derive reaching definitions, liveness, available expressions and constant propagation on a whiteboard. Interviewers ask for exactly that.`,
  goals: [
    `Write the gen/kill equations for reaching definitions, liveness, available expressions and very busy expressions, and say for each one whether it is forward or backward and may or must`,
    `Implement a generic worklist solver in Python and explain why it terminates (finite-height lattice plus monotone transfer functions)`,
    `Explain meet-over-all-paths (MOP) versus the maximal fixed point (MFP), and why the two agree for gen/kill problems but not for constant propagation`,
    `Choose a good iteration order (reverse postorder for forward problems) and initialise must-analyses correctly`,
    `Connect each analysis to the optimisation or bug check it powers: dead-store elimination, register allocation, CSE, uninitialised-variable warnings`
  ],
  concept: [
    {
      h: 'What a dataflow analysis computes',
      p: [
        `A dataflow analysis attaches a <b>fact</b> to every program point (just before and just after each basic block or statement) and guarantees that the fact holds on <i>every</i> execution that reaches that point. For reaching definitions the fact is a set of assignment sites. For liveness it is a set of variables. For constant propagation it is a map from each variable to "a known constant", "not a constant" or "no information yet".`,
        `Three ingredients define an analysis:`,
        `<ul><li><b>Direction.</b> Forward analyses push facts from entry toward exit (what happened before this point?). Backward analyses push facts from exit toward entry (what will happen after this point?).</li><li><b>Meet (or join) at merge points.</b> When several CFG edges flow into a block, their facts are combined. A <i>may</i> analysis ("on some path") uses union. A <i>must</i> analysis ("on all paths") uses intersection.</li><li><b>Transfer function</b> per block, <code>OUT = f_B(IN)</code>. For the classic bit-vector problems it always has the shape <code>f_B(X) = GEN_B ∪ (X − KILL_B)</code>.</li></ul>`,
        `The analysis is the least (or greatest) solution of the system of equations these ingredients define over the CFG. You do not solve the system symbolically. You iterate until nothing changes, which is the <b>fixpoint</b>.`
      ]
    },
    {
      h: 'The four classic analyses in one table',
      p: [
        `<div class="cmp-wrap"><table class="cmp"><tr><th>Analysis</th><th>Domain</th><th>Direction</th><th>Meet</th><th>GEN / KILL of block B</th><th>Used for</th></tr><tr><td>Reaching definitions</td><td>sets of def sites <code>d: x = …</code></td><td>forward</td><td>∪ (may)</td><td>GEN = defs in B that reach B's end; KILL = all other defs of the same variables</td><td>def-use chains, uninitialised-variable warnings, constant propagation seeds</td></tr><tr><td>Live variables</td><td>sets of variables</td><td>backward</td><td>∪ (may)</td><td>GEN = variables read in B before any write in B (upward-exposed uses); KILL = variables written in B</td><td>register allocation, dead-store elimination, "unused value" warnings</td></tr><tr><td>Available expressions</td><td>sets of expressions <code>a+b</code></td><td>forward</td><td>∩ (must)</td><td>GEN = expressions computed in B and not later invalidated in B; KILL = expressions using a variable B writes</td><td>common-subexpression elimination</td></tr><tr><td>Very busy (anticipable) expressions</td><td>sets of expressions</td><td>backward</td><td>∩ (must)</td><td>GEN = expressions evaluated in B before their operands are written; KILL = expressions using a variable B writes</td><td>code hoisting, partial-redundancy elimination</td></tr></table></div>`,
        `Forward problems read <code>IN[B] = ⊓ OUT[P]</code> over predecessors P and <code>OUT[B] = GEN ∪ (IN − KILL)</code>. Backward problems mirror that: <code>OUT[B] = ⊓ IN[S]</code> over successors S and <code>IN[B] = GEN ∪ (OUT − KILL)</code>. If you remember those two lines and the table, you can produce any of the four on a whiteboard.`
      ],
      code: `Reaching definitions (forward, may)       Liveness (backward, may)
  IN[B]  = ∪ OUT[P]   for P in pred(B)      OUT[B] = ∪ IN[S]   for S in succ(B)
  OUT[B] = GEN[B] ∪ (IN[B] − KILL[B])       IN[B]  = USE[B] ∪ (OUT[B] − DEF[B])
  init: OUT[B] = ∅, IN[entry] = ∅           init: IN[B] = ∅, OUT[exit] = ∅

Available expressions (forward, must)
  IN[B]  = ∩ OUT[P]   (IN[entry] = ∅: nothing is available at program start)
  OUT[B] = E_GEN[B] ∪ (IN[B] − E_KILL[B])
  init: OUT[B] = U (all expressions) for B ≠ entry   <- must-analyses start at the TOP`
    },
    {
      h: 'The worklist algorithm',
      p: [
        `The naive approach is round-robin: sweep all blocks, recompute their equations, and repeat until a full sweep changes nothing. The <b>worklist algorithm</b> does less work. It keeps a queue of blocks whose inputs may have changed. When a block's output changes, only the blocks that depend on it (successors for a forward problem, predecessors for a backward one) go back on the queue.`,
        `It terminates for two reasons. First, the facts live in a <b>lattice of finite height</b>: a powerset of definitions can only grow so many times. Second, the transfer functions are <b>monotone</b>: more information in never gives less information out. So each block's value can only move up the lattice, and it can do that only finitely often. With <i>n</i> blocks and lattice height <i>h</i>, each block changes at most <i>h</i> times. That bounds the work at O(n·h) block visits times the cost of a set operation. For bit vectors a set operation is one machine word per 64 facts.`,
        `Order matters for speed but not for the answer. For a forward problem, process blocks in <b>reverse postorder</b> of a DFS from entry: every block is visited after its non-back-edge predecessors, so on reducible CFGs most facts settle in one or two passes. The number of extra passes is bounded by the loop-nesting depth. For a backward problem, use reverse postorder of the reversed CFG (postorder is a common approximation).`
      ],
      code: `def solve(blocks, succ, pred, gen, kill, forward=True, meet=set.union, init=set):
    IN  = {b: init() for b in blocks}
    OUT = {b: init() for b in blocks}
    flow_in, flow_out = (pred, succ) if forward else (succ, pred)
    before, after     = (IN, OUT)    if forward else (OUT, IN)
    work = deque(blocks)                         # seed: every block once
    while work:
        b = work.popleft()
        srcs = [after[p] for p in flow_in[b]]
        before[b] = meet(*srcs) if srcs else init()
        new = gen[b] | (before[b] - kill[b])     # the transfer function
        if new != after[b]:                      # changed -> dependents are stale
            after[b] = new
            for s in flow_out[b]:
                if s not in work:
                    work.append(s)
    return IN, OUT`
    },
    {
      h: 'Worked example: a factorial loop',
      p: [
        `Take <code>x = 5; y = 1; while x &gt; 1: y = x * y; x = x - 1; print(y)</code> with one statement per block (B1 to B6) and definitions d1: <code>x=5</code>, d2: <code>y=1</code>, d3: <code>y=x*y</code>, d4: <code>x=x-1</code>. The loop head B3 has two predecessors, B2 and the back edge from B5. On the first visit B3 sees only {d1, d2}. When B5's output {d3, d4} arrives over the back edge, B3's IN grows to {d1, d2, d3, d4}. B3 goes back through B4 and B5 once more, nothing changes, and the queue empties.`,
        `Read the result as an analyst. At B6 (<code>print(y)</code>) both d2 and d3 reach, so <code>y</code> may hold either the initial 1 or a product. That is why a compiler cannot constant-fold <code>y</code> there. Liveness says <code>x</code> is not live after B6 or in B6, so its storage can be reused after the loop. Neither statement needs a test run. Both follow from the equations.`
      ],
      code: `block RD in                     RD out                    live in       live out
B1    []                        ['d1']                    []            ['x']
B2    ['d1']                    ['d1', 'd2']              ['x']         ['x', 'y']
B3    ['d1', 'd2', 'd3', 'd4']  ['d1', 'd2', 'd3', 'd4']  ['x', 'y']    ['x', 'y']
B4    ['d1', 'd2', 'd3', 'd4']  ['d1', 'd3', 'd4']        ['x', 'y']    ['x', 'y']
B5    ['d1', 'd3', 'd4']        ['d3', 'd4']              ['x', 'y']    ['x', 'y']
B6    ['d1', 'd2', 'd3', 'd4']  ['d1', 'd2', 'd3', 'd4']  ['y']         []`
    },
    {
      h: 'Constant propagation: a dataflow problem that is not gen/kill',
      p: [
        `Constant propagation tracks, for each variable, a value from the flat lattice <code>⊤ (undefined/no info yet) ⊐ {…, -1, 0, 1, 2, …} ⊐ ⊥ (NAC, not a constant)</code>. Different authors flip ⊤ and ⊥, so say which convention you are using. Meeting two different constants gives NAC, and meeting anything with "undefined" gives the other value. The transfer function for <code>x = a + b</code> evaluates <code>a + b</code> abstractly: two constants give their sum, and NAC in gives NAC out.`,
        `This transfer function cannot be written as GEN ∪ (IN − KILL), because the output value of <code>x</code> depends on the input values of <code>a</code> and <code>b</code>. It is still monotone, so the worklist algorithm still terminates. Each variable can drop at most twice (⊤ to a constant to NAC). But the function is <b>not distributive</b>, and the next section explains why that costs precision.`
      ],
      code: `if c:  a = 1; b = 2          # path 1: a+b = 3
else:  a = 2; b = 1          # path 2: a+b = 3
x = a + b                    # every path says 3 ...

MOP (evaluate each path, then merge):  f(path1) ⊓ f(path2) = 3 ⊓ 3 = 3
MFP (merge first, then evaluate):      a = 1 ⊓ 2 = NAC, b = NAC  ->  x = NAC
f(A ⊓ B) ⊑ f(A) ⊓ f(B), with strict inequality here: MFP is sound but less precise.`
    }
  ],
  deepDive: {
    timeMin: 18,
    intro: `What interviewers probe once they know you can write the equations: what the answer actually means (MOP versus MFP), why must-analyses are initialised differently, how production compilers make this fast, and how the framework extends across procedures.`,
    sections: [
      {
        h: 'MOP, MFP and distributivity',
        p: [
          `The ideal answer is the <b>meet over all paths</b>: for every path from entry to point <i>p</i>, compose the transfer functions along that path, apply the result to the entry value, and meet the results. A program with loops has infinitely many paths, so MOP cannot be computed directly. (Kam and Ullman showed that MOP is undecidable for general monotone frameworks.) The iterative algorithm computes the <b>maximal fixed point</b> (MFP) of the equations instead.`,
          `For any monotone framework MFP ⊑ MOP: MFP is sound but possibly less precise. If every transfer function is <b>distributive</b>, meaning <code>f(x ⊓ y) = f(x) ⊓ f(y)</code>, then MFP = MOP (Kildall). Every gen/kill function is distributive because set union and difference distribute. That is why reaching definitions and liveness are exact relative to the CFG. Constant propagation is the standard counterexample, shown above.`,
          `"Exact relative to the CFG" still means path-insensitive. MOP treats every CFG path as feasible, including ones that cannot actually run, such as <code>if c: x = 1</code> followed later by <code>if c: use(x)</code>. Removing infeasible paths is a different and much more expensive refinement (path-sensitive analysis, symbolic execution).`
        ]
      },
      {
        h: 'Initialisation: may starts at ⊥, must starts at ⊤',
        p: [
          `For a may analysis (union), interior blocks start at the empty set and facts only grow. For a must analysis (intersection), interior blocks start at the full universe U and facts only shrink. If you initialise available expressions to ∅, every loop head intersects with the empty set from its unvisited back edge and you get "nothing is ever available". That answer is sound but useless. The boundary condition is separate: <code>IN[entry] = ∅</code> for available expressions, because nothing has been computed yet when the program starts.`,
          `The general rule: start every non-boundary node at the lattice element that is the identity of the meet (∅ for ∪, U for ∩). Then the first real value to arrive simply replaces it.`
        ]
      },
      {
        h: 'Making it fast: bit vectors, RPO, and going sparse',
        p: [
          `Classic implementations number the facts (definitions, expressions, variables) and represent each set as a bit vector. Union is OR, intersection is AND, and KILL is AND-NOT. Combined with reverse-postorder iteration, liveness over a large function converges in a few passes. The number of passes needed is bounded by the loop-connectedness of the CFG: the maximum number of back edges on any acyclic path.`,
          `Dense analyses carry every fact to every program point. <b>Sparse</b> analyses follow def-use edges directly. SSA form (previous Part) makes this natural, because each SSA name has exactly one definition. Reaching definitions becomes trivial: the unique def reaches every use of that name. Sparse conditional constant propagation (SCCP, Wegman and Zadeck) runs constant propagation over SSA edges and CFG reachability at the same time. That lets it fold branches whose condition becomes constant, and both LLVM and GCC implement it.`
        ]
      },
      {
        h: 'Beyond one function: interprocedural dataflow',
        p: [
          `Across calls, the naive approach glues all CFGs into one supergraph with call and return edges. That mixes up callers: facts from caller A flow into the callee and back out to caller B, which is the <b>unrealizable path</b> problem. There are two classic fixes. The <b>call-strings</b> approach tags facts with a bounded call stack (k-limiting). The <b>functional (summary)</b> approach of Sharir and Pnueli computes, for each procedure, its transfer function as a summary and applies it at each call site.`,
          `<b>IFDS</b> (Reps, Horwitz, Sagiv 1995) is the efficient special case for problems whose facts are a finite set and whose transfer functions distribute over union. It reduces the analysis to graph reachability over an "exploded supergraph" and runs in O(E·D³). FlowDroid's taint analysis is built on it, which is the subject of the taint-analysis lesson. IDE generalises IFDS to facts with values attached (for example "x is the constant 3").`
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: `Nami's Rumour Charts Across the Grand Line`,
      text: [
        `The Straw Hats leave a note at every island saying who last gave the "set course" order and what it was. At a fork in the route the crew cannot know which channel the Sunny took, so Nami's rule is simple. The chart for an island lists every order that could have arrived by any channel. Arriving rumours get merged as a union, and a new order from the captain erases the old orders about the same heading. That is gen and kill.`,
        `There is a loop in the route: Water 7, then Enies Lobby, then back. Nami does not redraw every chart on every pass. She keeps a stack of islands whose incoming news changed and only re-copies those. When she copies a chart and it comes out identical, she does not bother telling the next island. Eventually no chart changes. That is the fixpoint, and Nami puts the pen down.`
      ]
    },
    sitcom: {
      show: 'Friends',
      title: 'Who Knows About Ross and Rachel?',
      text: [
        `The secret starts with Phoebe. Every time someone learns something new, they call the friends they talk to, and that is all they do. Monica does not re-call Chandler if she has nothing new to add. Chandler, hearing the same news again from Joey, does not phone anyone. The gossip spreads along the friendship graph until a full round of calls changes nobody's knowledge, and then the apartment goes quiet.`,
        `Rachel's question "does EVERYONE know?" is a must question, so you intersect what each person knows. Ross's question "could ANYONE know?" is a may question, so you take the union. Same phone calls, different meet operator, very different answers.`
      ]
    },
    why: `The islands and the friends are CFG nodes, the rumours are dataflow facts, merging news is the meet, and "only call people when you have something new" is exactly the worklist rule that makes the algorithm efficient. "Everyone" versus "anyone" is must versus may.`
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'b1', emoji: '🏝️', label: 'B1: x = 5', x: 8, y: 14 },
      { id: 'b3', emoji: '🌀', label: 'B3: while x > 1', x: 40, y: 14 },
      { id: 'b4', emoji: '🏝️', label: 'B4: y = x*y', x: 76, y: 14 },
      { id: 'b5', emoji: '🏝️', label: 'B5: x = x-1', x: 76, y: 78 },
      { id: 'b6', emoji: '🏁', label: 'B6: print(y)', x: 40, y: 78 },
      { id: 'queue', emoji: '📜', label: 'worklist: B1 B2 B3 B4 B5 B6', x: 8, y: 78 }
    ],
    actors: [
      { id: 'nami', emoji: '🗺️', label: 'Nami (solver)', x: 8, y: 40 },
      { id: 'snail', emoji: '🐌', label: 'facts {d1}', x: 16, y: 30 }
    ],
    steps: [
      { c: `Nami seeds the worklist with every block. B1 defines x (d1), so its chart leaves with the fact set {d1}.`, p: { b1: 'lit', queue: 'lit' } },
      { c: `B2 adds d2 (y = 1). The Den Den Mushi carries {d1, d2} into the loop head B3.`, a: { snail: [40, 32], nami: [34, 40] }, l: { snail: 'facts {d1,d2}', queue: 'worklist: B3 B4 B5 B6' }, p: { b3: 'lit' } },
      { c: `B4 is y = x*y, which generates d3 and kills d2 (the other def of y). OUT[B4] = {d1, d3}.`, a: { snail: [72, 32], nami: [66, 40] }, l: { snail: 'facts {d1,d3}' }, p: { b4: 'lit' } },
      { c: `B5 is x = x-1, which generates d4 and kills d1. OUT[B5] = {d3, d4}, and it travels back along the back edge.`, a: { snail: [70, 66], nami: [62, 60] }, l: { snail: 'facts {d3,d4}' }, p: { b5: 'lit' } },
      { c: `The loop head merges by union: {d1,d2} ∪ {d3,d4}. B3's chart changed, so B4, B5 and B6 go back on the worklist.`, a: { snail: [44, 34], nami: [40, 46] }, l: { snail: 'IN[B3] = {d1..d4}', queue: 'worklist: B4 B5 B6' }, p: { b3: 'good', queue: 'lit' } },
      { c: `Second lap: B4 and B5 recompute and get the same charts as before, so nothing new is sent. B6 receives {d1,d2,d3,d4}, which means y may be 1 or a product.`, a: { snail: [40, 64], nami: [30, 60] }, p: { b4: 'dim', b5: 'dim', b6: 'lit' } },
      { c: `The worklist is empty and no chart changed: fixpoint. The facts are sound for every run of the program, and nobody executed it. 🏴‍☠️`, l: { queue: 'worklist: (empty) ✓' }, p: { queue: 'good', b6: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'One worklist iteration, end to end',
    intro: 'Click any box to jump to it, or press Play. This is the exact loop in the code below.',
    stages: [
      { label: 'Setup', nodes: [ { id: 'cfg', text: 'CFG\nblocks + pred/succ' }, { id: 'eq', text: 'Equations\ndirection, meet,\nGEN/KILL per block' }, { id: 'init', text: 'Init\nmay: ∅   must: U\nboundary at entry/exit' } ] },
      { label: 'Iterate', nodes: [ { id: 'pop', text: 'Pop block B\nfrom worklist' }, { id: 'meet', text: 'Meet inputs\n∪ / ∩ over preds\n(or succs if backward)' }, { id: 'xfer', text: 'Transfer\nGEN ∪ (IN − KILL)' } ] },
      { label: 'Propagate', nodes: [ { id: 'chg', text: 'Changed?\ncompare to old OUT' }, { id: 'push', text: 'Push dependents\nsuccs (fwd) / preds (bwd)' } ] },
      { label: 'Finish', nodes: [ { id: 'fix', text: 'Worklist empty\n= fixpoint (MFP)' }, { id: 'use', text: 'Use the facts\nwarnings, DCE,\nregister alloc' } ] }
    ],
    steps: [
      { active: ['cfg'], note: 'Start from the CFG built in the lowering lesson: basic blocks with predecessor and successor lists.' },
      { active: ['eq'], note: 'Pick the analysis. Reaching definitions: forward, union, GEN = local defs, KILL = other defs of the same variables.' },
      { active: ['init'], note: 'Initialise interior nodes to the identity of the meet: the empty set for union, the universe for intersection. Set the boundary value at entry (or at exit for a backward problem).' },
      { active: ['pop'], note: 'Take any block off the worklist. The order affects speed, not the final answer; reverse postorder is the usual choice.' },
      { active: ['meet'], note: 'Combine the OUT facts of all predecessors. At a loop head this includes the back edge, and that is where new facts enter the loop.' },
      { active: ['xfer'], note: 'Apply the block transfer function. It is monotone, so a larger input can never produce a smaller output.' },
      { active: ['chg'], note: 'If the new OUT equals the old one, stop here. Nobody downstream can learn anything new from this block.' },
      { active: ['push'], note: 'If it changed, every block that reads this OUT is now stale. Enqueue them, unless they are already queued.' },
      { active: ['fix'], note: 'Finite lattice height plus monotone functions means each value can only climb finitely many times, so the queue eventually empties. The result is the maximal fixed point.' },
      { active: ['use'], note: 'Consume the result: a use reached only by the "undefined" pseudo-def is an uninitialised read; a def whose variable is not live afterwards is a dead store.' }
    ]
  },
  tech: [
    {
      q: 'Why does liveness use "upward-exposed" uses instead of every use in the block?',
      a: `A variable is live at a point if some path from there reads it <i>before</i> writing it. Inside a block like <code>t = 1; y = t + x</code>, the read of <code>t</code> is satisfied by the write just before it, so <code>t</code> is not live on entry to the block. Only <code>x</code> is. If GEN counted every use, <code>t</code> would wrongly be live at the top of the block, and a register allocator would keep a dead value alive across the boundary. The same rule applies to available expressions: GEN contains only expressions that are still valid at the end of the block.`
    },
    {
      q: 'What exactly does "monotone" buy us, and what breaks without it?',
      a: `Monotone means that <code>x ⊑ y</code> implies <code>f(x) ⊑ f(y)</code>. During iteration each node's value then only moves in one direction (up for may-analyses written as a join). Combined with finite lattice height, this guarantees termination. Monotonicity is also what makes the result the least fixed point, by the Knaster–Tarski and Kleene theorems. A non-monotone transfer function, for example one that removes a fact when a <i>larger</i> set arrives, can oscillate forever: A adds a fact, which makes B remove one, which makes A remove its fact, and so on. Every transfer function written as GEN ∪ (X − KILL) is monotone by construction.`
    },
    {
      q: 'Why is reverse postorder the standard iteration order for forward problems?',
      a: `In reverse postorder (RPO) of a DFS from entry, every node comes after all of its predecessors except those reached through back edges. So when a block is processed, most of its inputs are already final for this pass. On acyclic code one RPO pass reaches the fixpoint. With loops, each extra pass carries facts around one more back edge, so the pass count is bounded by loop-connectedness plus two. Processing blocks in a random order gives the same answer, but it may revisit blocks many more times.`
    },
    {
      q: 'Statement-level or block-level facts: which does a real tool store?',
      a: `Compilers usually store facts only at block boundaries, because that is cheap and gives a few sets per block. When a statement-level answer is needed, for example "is <code>x</code> live right after instruction 7?", they recompute it with one local pass over the block from the stored boundary fact. Bug-finding tools that report at precise lines often use statement-level CFG nodes for simplicity. The capstone does that, and so does Python's own compiler for some checks. Asymptotically nothing changes, and the code is easier to read.`
    }
  ],
  code: {
    title: 'A generic worklist solver: reaching definitions and liveness from one function',
    intro: `Self-contained and stdlib only. Save it as <code>dataflow.py</code> and run <code>python3 dataflow.py</code>. The same <code>solve</code> function does both analyses: liveness is the forward solver with the roles of pred and succ, and of IN and OUT, swapped.`,
    code: "\"\"\"A tiny monotone-framework solver: reaching definitions (forward, may)\nand liveness (backward, may) on a hand-built CFG, solved with a worklist.\"\"\"\nfrom collections import deque\n\n# Program (one statement per block, to keep it readable):\n#   B1: x = 5          d1\n#   B2: y = 1          d2\n#   B3: while x > 1:   (branch -> B4 or B6)\n#   B4:   y = x * y    d3\n#   B5:   x = x - 1    d4   (back edge -> B3)\n#   B6: print(y)\nBLOCKS = {\n    \"B1\": {\"defs\": {\"x\": \"d1\"}, \"uses\": set()},\n    \"B2\": {\"defs\": {\"y\": \"d2\"}, \"uses\": set()},\n    \"B3\": {\"defs\": {},          \"uses\": {\"x\"}},\n    \"B4\": {\"defs\": {\"y\": \"d3\"}, \"uses\": {\"x\", \"y\"}},\n    \"B5\": {\"defs\": {\"x\": \"d4\"}, \"uses\": {\"x\"}},\n    \"B6\": {\"defs\": {},          \"uses\": {\"y\"}},\n}\nSUCC = {\"B1\": [\"B2\"], \"B2\": [\"B3\"], \"B3\": [\"B4\", \"B6\"],\n        \"B4\": [\"B5\"], \"B5\": [\"B3\"], \"B6\": []}\nPRED = {b: [p for p in SUCC if b in SUCC[p]] for b in SUCC}\n\nALL_DEFS = {d: v for b in BLOCKS.values() for v, d in b[\"defs\"].items()}\n\n\ndef solve(blocks, succ, pred, gen, kill, forward=True, meet=set.union, init=set):\n    \"\"\"Generic worklist solver.  Returns (IN, OUT) maps of frozen sets.\n    forward: IN[b] = meet(OUT[p] for p in pred); OUT[b] = gen U (IN - kill)\n    backward: swap the roles of IN/OUT and pred/succ.\"\"\"\n    IN = {b: init() for b in blocks}\n    OUT = {b: init() for b in blocks}\n    flow_in, flow_out = (pred, succ) if forward else (succ, pred)\n    before, after = (IN, OUT) if forward else (OUT, IN)\n    work = deque(blocks)              # seed with every block\n    while work:\n        b = work.popleft()\n        srcs = [after[p] for p in flow_in[b]]\n        before[b] = meet(*srcs) if srcs else init()\n        new = gen[b] | (before[b] - kill[b])\n        if new != after[b]:           # changed -> successors must be revisited\n            after[b] = new\n            for s in flow_out[b]:\n                if s not in work:\n                    work.append(s)\n    return IN, OUT\n\n\n# Reaching definitions: GEN = defs made here, KILL = other defs of same var\nrd_gen = {b: set(info[\"defs\"].values()) for b, info in BLOCKS.items()}\nrd_kill = {b: {d for d, v in ALL_DEFS.items()\n               if v in info[\"defs\"] and d not in info[\"defs\"].values()}\n           for b, info in BLOCKS.items()}\nRD_IN, RD_OUT = solve(BLOCKS, SUCC, PRED, rd_gen, rd_kill, forward=True)\n\n# Liveness: GEN = uses (before any def in block), KILL = vars defined here\nlv_gen = {b: set(info[\"uses\"]) for b, info in BLOCKS.items()}\nlv_kill = {b: set(info[\"defs\"]) for b, info in BLOCKS.items()}\nLV_IN, LV_OUT = solve(BLOCKS, SUCC, PRED, lv_gen, lv_kill, forward=False)\n\nprint(f\"{'block':6}{'RD in':26}{'RD out':26}{'live in':14}live out\")\nfor b in BLOCKS:\n    print(f\"{b:6}{str(sorted(RD_IN[b])):26}{str(sorted(RD_OUT[b])):26}\"\n          f\"{str(sorted(LV_IN[b])):14}{sorted(LV_OUT[b])}\")\n",
    notes: [
      `Output (verified with Python 3.10): <code>RD in</code> at B6 is <code>['d1','d2','d3','d4']</code>, and <code>live in</code> at B6 is <code>['y']</code>.`,
      `KILL for reaching definitions is computed from the global set of defs: in B4, <code>y = x*y</code> kills d2, the other definition of <code>y</code>.`,
      `To get available expressions, pass <code>meet=set.intersection</code> and initialise interior OUT sets to the universe of expressions. The solver as written seeds every set with <code>init()</code>, so you would also have to special-case the entry block. Try it.`
    ]
  },
  lab: {
    title: 'Write a backward liveness solver',
    prompt: `Implement <code>liveness(blocks, succ, pred, uses, defs)</code> using a worklist. It should return <code>(live_in, live_out)</code> as dicts of sets. Use <code>live_out[b] = ∪ live_in[s]</code> over successors and <code>live_in[b] = uses[b] | (live_out[b] - defs[b])</code>. When <code>live_in[b]</code> changes, re-enqueue the <b>predecessors</b> of <code>b</code>. This is a backward problem. The starter includes a three-block loop in which <code>c</code> is read before it is ever written, so <code>c</code> must be live at entry.`,
    starter: `from collections import deque


def liveness(blocks, succ, pred, uses, defs):
    live_in = {b: set() for b in blocks}
    live_out = {b: set() for b in blocks}
    work = deque(reversed(blocks))
    # TODO: while the worklist is non-empty:
    #   pop b, recompute live_out[b] from the successors,
    #   recompute live_in[b] with the transfer function,
    #   and if live_in[b] changed, enqueue the predecessors of b
    return live_in, live_out


# a = 0 ; loop: b = a + 1 ; c = c + b ; a = b * 2 ; if a < 9 goto loop ; return c
blocks = ["B1", "B2", "B3"]
succ = {"B1": ["B2"], "B2": ["B2", "B3"], "B3": []}
pred = {"B1": [], "B2": ["B1", "B2"], "B3": ["B2"]}
uses = {"B1": set(), "B2": {"a", "c"}, "B3": {"c"}}
defs = {"B1": {"a"}, "B2": {"a", "b", "c"}, "B3": set()}

live_in, live_out = liveness(blocks, succ, pred, uses, defs)
for b in blocks:
    print(b, "in:", sorted(live_in[b]), "out:", sorted(live_out[b]))
assert live_in["B1"] == {"c"}, "c is read before any write: live at entry"
assert live_in["B2"] == {"a", "c"}
print("all assertions passed")
`,
    checks: [
      { re: 'while\\s+work\\s*:', flags: '', must: true, hint: 'Loop with "while work:" until the worklist is empty.', pass: 'worklist loop ✓' },
      { re: 'work\\.popleft\\(\\)|work\\.pop\\(\\)', flags: '', must: true, hint: 'Take a block off the worklist with work.popleft() or work.pop().', pass: 'pops a block ✓' },
      { re: 'live_out\\[b\\]\\s*=\\s*set\\(\\)\\.union\\(\\*\\(?\\s*live_in\\[s\\]\\s+for\\s+s\\s+in\\s+succ\\[b\\]', flags: '', must: true, hint: 'live_out[b] = set().union(*(live_in[s] for s in succ[b])): the meet is a union over successors.', pass: 'meet over successors ✓' },
      { re: 'uses\\[b\\]\\s*\\|\\s*\\(\\s*live_out\\[b\\]\\s*-\\s*defs\\[b\\]\\s*\\)', flags: '', must: true, hint: 'Transfer function: uses[b] | (live_out[b] - defs[b]).', pass: 'transfer function ✓' },
      { re: 'for\\s+p\\s+in\\s+pred\\[b\\]', flags: '', must: true, hint: 'Backward problem: when live_in[b] changes, enqueue every p in pred[b].', pass: 're-enqueues predecessors ✓' },
      { re: 'live_in\\[\\w+\\]\\s+for\\s+\\w+\\s+in\\s+pred\\[', flags: '', must: false, hint: 'Do not take the meet over predecessors. Liveness flows backward, so live_out comes from the successors.', pass: 'direction is backward ✓' }
    ],
    run: `Save the file as <code>liveness_lab.py</code> and run <code>python3 liveness_lab.py</code>. You should see <code>B1 in: ['c'] out: ['a', 'c']</code>, then <code>B2 in: ['a', 'c'] out: ['a', 'c']</code>, then <code>B3 in: ['c'] out: []</code>, then <code>all assertions passed</code>. For a further exercise, delete <code>"c"</code> from <code>uses["B2"]</code> and confirm that <code>c</code> stops being live at entry.`,
    solution: "from collections import deque\n\n\ndef liveness(blocks, succ, pred, uses, defs):\n    live_in = {b: set() for b in blocks}\n    live_out = {b: set() for b in blocks}\n    work = deque(reversed(blocks))      # backward problem: start near the exit\n    while work:\n        b = work.popleft()\n        live_out[b] = set().union(*(live_in[s] for s in succ[b]))\n        new_in = uses[b] | (live_out[b] - defs[b])\n        if new_in != live_in[b]:\n            live_in[b] = new_in\n            for p in pred[b]:\n                if p not in work:\n                    work.append(p)\n    return live_in, live_out\n\n\n# a = 0 ; loop: b = a + 1 ; c = c + b ; a = b * 2 ; if a < 9 goto loop ; return c\nblocks = [\"B1\", \"B2\", \"B3\"]\nsucc = {\"B1\": [\"B2\"], \"B2\": [\"B2\", \"B3\"], \"B3\": []}\npred = {\"B1\": [], \"B2\": [\"B1\", \"B2\"], \"B3\": [\"B2\"]}\nuses = {\"B1\": set(), \"B2\": {\"a\", \"c\"}, \"B3\": {\"c\"}}\ndefs = {\"B1\": {\"a\"}, \"B2\": {\"a\", \"b\", \"c\"}, \"B3\": set()}\n\nlive_in, live_out = liveness(blocks, succ, pred, uses, defs)\nfor b in blocks:\n    print(b, \"in:\", sorted(live_in[b]), \"out:\", sorted(live_out[b]))\nassert live_in[\"B1\"] == {\"c\"}, \"c is read before any write: live at entry\"\nassert live_in[\"B2\"] == {\"a\", \"c\"}\nprint(\"all assertions passed\")\n",
    notes: [
      `<code>c</code> is live at entry to B1 because B2 reads <code>c</code> before writing it on the first trip. In a real program this is an uninitialised-read bug, and liveness at function entry is a cheap way to detect it.`,
      `<code>b</code> is never live at a block boundary. It is defined and consumed inside B2, which makes it a good candidate to keep in a register.`,
      `The <code>if p not in work</code> test is linear on a deque. Production code keeps a parallel <code>set</code> of queued blocks, as the capstone does.`
    ]
  },
  quiz: [
    {
      q: 'Which combination describes live-variable analysis?',
      options: ['Forward, must, intersection', 'Backward, may, union', 'Forward, may, union', 'Backward, must, intersection'],
      correct: 1,
      explain: 'A variable is live if SOME future path reads it before writing it. Future means backward, and "some path" means may, which uses union.'
    },
    {
      q: 'You initialise every OUT set to ∅ in an available-expressions analysis. What goes wrong?',
      options: ['Nothing, initial values never matter', 'The analysis may not terminate', 'At every loop head, intersecting with the still-empty back edge yields ∅, so nothing is ever reported available inside loops', 'It reports expressions as available when they are not'],
      correct: 2,
      explain: 'Must-analyses start at the top element U and shrink. Starting at ∅ is still sound, because claiming nothing is never wrong, but the result is uselessly imprecise.'
    },
    {
      q: 'Why does the iterative solver compute exactly the MOP solution for reaching definitions but not for constant propagation?',
      options: ['Reaching definitions has fewer facts', 'Gen/kill transfer functions distribute over the meet, while constant propagation transfer functions do not', 'Constant propagation is a backward analysis', 'MOP is undecidable for reaching definitions'],
      correct: 1,
      explain: 'Kildall: if f(x ⊓ y) = f(x) ⊓ f(y) for every transfer function, then MFP equals MOP. Evaluating x = a + b after merging (a: 1 or 2, b: 2 or 1) gives NAC, but evaluating each path first gives 3 both times.'
    },
    {
      q: 'In the factorial example, both d2 (y = 1) and d3 (y = x*y) reach print(y). What does that let a compiler conclude?',
      options: ['y is the constant 1', 'y cannot be constant-folded at the print using reaching definitions alone', 'd2 is dead code', 'The loop never runs'],
      correct: 1,
      explain: 'Two definitions with different right-hand sides reach the use, so no single constant is guaranteed. Neither def is dead, because each one reaches a use.'
    },
    {
      q: 'What guarantees that the worklist algorithm terminates?',
      options: ['The CFG is acyclic', 'Reverse postorder iteration', 'A lattice of finite height plus monotone transfer functions', 'Using bit vectors'],
      correct: 2,
      explain: 'Each value can only climb the lattice, and only finitely many times. Iteration order and representation affect speed, not termination. Infinite-height lattices such as intervals need widening, which is covered in the next lesson.'
    }
  ],
  testFlow: {
    title: 'Test yourself: pick the right analysis',
    start: 'q1',
    nodes: {
      q1: { q: 'You want to warn "value assigned to x is never used". Which analysis answers that directly?', choices: [ { text: 'Liveness: the assignment is dead if x is not live right after it', to: 'q1_ok' }, { text: 'Reaching definitions: check whether the def reaches the exit', to: 'q1_rd' }, { text: 'Available expressions', to: 'q1_ae' } ] },
      q1_ok: { end: true, correct: true, text: 'Right. Dead-store detection is "x not in LIVE_OUT at the def". Pyflakes, Pylint unused-variable and the capstone all rely on this idea.', next: 'q2' },
      q1_rd: { end: true, correct: false, text: 'Reaching the exit does not mean the value is read. A def can reach the exit while nothing ever reads it. You need to know whether a future read exists, which is a backward question.', retry: 'q1' },
      q1_ae: { end: true, correct: false, text: 'Available expressions tracks whether a + b has already been computed, for CSE. It says nothing about whether a variable is read later.', retry: 'q1' },
      q2: { q: 'Your forward must-analysis reports nothing ever available inside any loop. Most likely bug?', choices: [ { text: 'Interior nodes initialised to ∅ instead of the universe', to: 'q2_ok' }, { text: 'Wrong iteration order', to: 'q2_order' }, { text: 'The lattice has infinite height', to: 'q2_inf' } ] },
      q2_ok: { end: true, correct: true, text: 'Yes. With ∩, the unvisited back edge must contribute the identity U, not ∅. Initialise interior nodes to the top element.', next: 'q3' },
      q2_order: { end: true, correct: false, text: 'Order changes how many passes you need, never the fixpoint you reach. Look at the initial values instead.', retry: 'q2' },
      q2_inf: { end: true, correct: false, text: 'A powerset of a finite set of expressions has finite height. The symptom points to initialisation.', retry: 'q2' },
      q3: { q: 'if c: a=1;b=2 else: a=2;b=1; x=a+b. What does standard (MFP) constant propagation say about x?', choices: [ { text: 'NAC: a and b are each merged to NAC before the addition', to: 'q3_ok' }, { text: '3', to: 'q3_three' } ] },
      q3_ok: { end: true, correct: true, text: 'Correct. This is the textbook non-distributivity example: MOP would give 3, MFP gives NAC. Sound, but less precise.' },
      q3_three: { end: true, correct: false, text: '3 is the meet-over-paths answer. The iterative solver merges at the join point first, so it loses the correlation between a and b.', retry: 'q3' }
    }
  },
  pitfalls: [
    `Counting every use in a block as GEN for liveness. Only upward-exposed uses (read before any write in the block) belong in GEN.`,
    `Initialising a must-analysis to ∅. It still terminates and is still sound, but it reports nothing, and you will waste time looking for a bug in the transfer function.`,
    `Forgetting the boundary condition. Reaching definitions for an uninitialised-variable check needs a pseudo-definition "x = undefined" at entry for every local; otherwise a use with no reaching defs is indistinguishable from unreachable code.`,
    `Treating the result as path-sensitive. "d may reach u" includes infeasible paths through correlated branches. That is where most uninitialised-variable false positives come from.`,
    `Re-enqueuing the wrong neighbours: successors for a forward problem, predecessors for a backward one. If you get it wrong the loop still terminates, but at a wrong, under-approximated answer.`
  ],
  interview: [
    {
      q: 'Define reaching definitions and write its dataflow equations.',
      a: `A definition d of x at point p reaches point q if some path from p to q contains no other definition of x. It is a forward may-analysis over sets of definition sites. The equations are <code>IN[B] = ∪_{P∈pred(B)} OUT[P]</code> and <code>OUT[B] = GEN[B] ∪ (IN[B] − KILL[B])</code>, where GEN is the set of definitions in B that survive to its end and KILL is every other definition of a variable that B defines. Initialise everything to ∅ and iterate to a fixpoint. It is used to build def-use chains, to seed constant propagation, and, with a pseudo-def at entry, to detect possibly uninitialised reads.`
    },
    {
      q: 'Walk me through the worklist algorithm and argue that it terminates and is correct.',
      a: `Initialise every node to the meet identity and the boundary node to its boundary value, then put every node on the worklist. Repeat: pop a node, meet the values flowing in, apply the transfer function, and if the output changed, enqueue the dependents. <b>Termination:</b> the values come from a lattice of finite height and the transfer functions are monotone, so each node's value moves monotonically and can change at most h times. That gives O(n·h) node visits. <b>Correctness:</b> when the list is empty, every equation holds, so we have a fixpoint. Because we started from the bottom (for a join formulation) and only applied monotone functions, by Kleene iteration it is the least fixed point. That is the MFP solution, a sound approximation of MOP and equal to MOP when the functions are distributive.`
    },
    {
      q: 'Explain MOP versus MFP with an example where they differ.',
      a: `MOP applies the composed transfer functions along each path separately and merges at the end. MFP merges at every join point and then keeps going. They agree when the transfer functions distribute over the meet. Constant propagation is the classic case where they do not: <code>if c: a=1; b=2 else: a=2; b=1; x = a+b</code>. Along each path x = 3, so MOP says 3. MFP merges first, a = 1 ⊓ 2 = NAC and b = NAC, so x = NAC. MFP is still sound because it never claims a false constant. It just loses the correlation between a and b. Getting that back needs path sensitivity or a relational domain.`
    },
    {
      q: 'Tradeoff: should a bug-finding tool use a may-analysis or a must-analysis to warn about uninitialised variables?',
      a: `It depends on which error you would rather make. A may-analysis ("on some path the variable may be unassigned") reports every real bug plus false positives from infeasible paths, such as correlated <code>if flag:</code> checks. This is the sound choice, and it matches the Java compiler's definite-assignment rule, which rejects code even if a human can see it is safe. A must-analysis ("on every path it is unassigned") reports only certain bugs, misses most of them, and almost never false-alarms. Tools show this split: javac is conservative and makes you initialise. Pylint's <code>possibly-used-before-assignment</code> is a may-check, and its <code>used-before-assignment</code> covers the definite case. For a large codebase I would ship the must-version as an error, the may-version as a warning, and measure the false-positive rate before promoting it.`
    },
    {
      q: 'Whiteboard: design a dead-store detector for Python functions.',
      a: `Pipeline: <code>ast.parse</code>, then build a statement-level CFG per function. That means if/while/for/try edges, break and continue targets, and edges from return to exit. Collect defs (Name nodes in Store context) and upward-exposed uses (Load context) per node, and track only locals: drop names declared global/nonlocal and names captured by closures. Run backward liveness with a worklist. Report a def of x at node n when x is not in LIVE_OUT[n]. To keep false positives down: skip underscore-prefixed names, skip tuple-unpacking targets (a common idiom), and treat <code>del x</code> as a use. Mark findings with line numbers and a stable rule ID. Test with unit cases for each control construct, then run it over a real corpus such as the stdlib and hand-triage a sample to estimate precision. That is exactly what the capstone lesson builds.`
    },
    {
      q: 'How does SSA change dataflow analysis?',
      a: `In SSA every variable has exactly one static definition, and φ-functions merge values at join points. Reaching definitions becomes trivial, since the definition of x_3 is its single def, and def-use chains are explicit. That lets analyses run <b>sparsely</b> along def-use edges instead of carrying every fact to every point. Sparse conditional constant propagation runs over SSA edges plus CFG reachability, and it finds more constants than Kildall's dense algorithm because it treats unreachable branches as unreachable. Liveness on SSA has specialised fast algorithms, and SSA-based register allocation exploits the fact that SSA interference graphs are chordal.`
    },
    {
      q: 'Your liveness analysis takes minutes on a huge generated function. What do you look at?',
      a: `First, representation: use bit vectors indexed by variable number instead of Python or Java hash sets, so union and difference become word-wide OR and AND-NOT. Second, order: process blocks in reverse postorder of the reversed CFG, so most blocks settle in one pass, and use a worklist with a membership bitset instead of round-robin sweeps. Third, granularity: store facts per basic block, not per instruction, and recompute inside a block on demand. Fourth, consider a sparse or SSA-based formulation, or compute liveness per variable along its def-use chain. Finally, check whether the function's CFG is irreducible, because irreducible CFGs need more iterations.`
    }
  ]
};
