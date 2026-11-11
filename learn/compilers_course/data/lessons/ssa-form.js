window.LESSONS = window.LESSONS || {};
window.LESSONS['ssa-form'] = {
  id: 'ssa-form',
  title: "SSA Form: φ-Functions, Dominators & LLVM IR",
  category: "Part 2 — Lowering to Intermediate Representations",
  timeMin: 45,
  summary: "In static single assignment (SSA) form every variable is assigned exactly once, and where control flow merges, a φ (phi) function picks the value from whichever predecessor ran. SSA makes def-use chains trivial and many analyses sparse and fast, which is why LLVM IR, GCC's middle end, HotSpot's and V8's JITs, WALA and Soot's Shimple all use it. This lesson builds SSA the way production compilers do: dominators with the Cooper-Harvey-Kennedy algorithm, dominance frontiers, φ placement with Cytron et al.'s iterated dominance frontier, and renaming along the dominator tree, in runnable Python. Then it shows real LLVM IR before and after <code>mem2reg</code>.",
  goals: [
    "Define SSA and φ-functions, and convert a small CFG to SSA by hand",
    "Compute dominators, immediate dominators and the dominator tree (iterative Cooper-Harvey-Kennedy algorithm)",
    "Compute dominance frontiers and place φ-functions with the iterated dominance frontier (Cytron et al. 1991)",
    "Rename variables by a dominator-tree walk with per-variable stacks, and explain minimal vs pruned SSA and SSA destruction",
    "Read LLVM IR (<code>alloca</code>/<code>load</code>/<code>store</code>, <code>phi</code>, <code>br</code>) and explain what <code>mem2reg</code> does and why <code>-O0</code> output needs <code>-Xclang -disable-O0-optnone</code>"
  ],
  concept: [
    {
      h: "What SSA is, and why compilers love it",
      p: [
        "In SSA every variable has exactly one static definition. Straight-line code is converted by giving each assignment a new version: <code>x = 1; x = x + 2; y = x</code> becomes <code>x1 = 1; x2 = x1 + 2; y1 = x2</code>. At a merge point, different versions may arrive from different predecessors, so SSA inserts <code>x3 = φ(x1 from B1, x2 from B2)</code> at the start of the merge block. A φ is not a real instruction: it means \"the value from the edge we came in on\", and all φs at the top of a block execute simultaneously.",
        "Payoffs: (1) <b>def-use is explicit</b>: each use names its unique definition, so there is no need to solve reaching definitions; (2) <b>sparse analyses</b>: facts attach to variables instead of to every (program point, variable) pair, so constant propagation (SCCP), value numbering (GVN) and dead-code elimination run in near-linear time; (3) <b>no false dependencies</b>: two unrelated uses of the name <code>i</code> become different variables; (4) many optimizations become simple rewrites on the def-use graph.",
        "SSA is a property of an IR, not a separate IR. LLVM IR is always SSA for virtual registers (but not for memory). Soot offers Shimple, an SSA variant of Jimple (<code>-f S</code> or <code>-via-shimple</code>). WALA's IR is SSA. HotSpot's C2 and Graal build sea-of-nodes SSA graphs."
      ],
      code: String.raw`Before SSA                     After SSA
B0: x = 1                      B0: x1 = 1
    if c goto B2                   if c goto B2
B1: x = x + 2                  B1: x2 = x1 + 2
    goto B3                        goto B3
B2: x = 10                     B2: x3 = 10
B3: return x                   B3: x4 = φ(x2 from B1, x3 from B2)
                                   return x4`
    },
    {
      h: "Dominators and the dominator tree",
      p: [
        "Block A <b>dominates</b> B (A dom B) if every path from entry to B goes through A. Every block dominates itself; A <b>strictly dominates</b> B if A dom B and A ≠ B. The <b>immediate dominator</b> idom(B) is the strict dominator of B closest to B; every block except entry has exactly one, so the idom relation forms the <b>dominator tree</b>.",
        "Dominance is the key to SSA because a definition in A is available at every block A dominates without any φ: there is no other way to get there. φs are needed exactly where dominance ends.",
        "Computing it: the classic dataflow formulation is Dom(entry) = {entry}, Dom(B) = {B} ∪ ⋂ Dom(P) over predecessors P, iterated to a fixed point. Cooper, Harvey and Kennedy (\"A Simple, Fast Dominance Algorithm\", 2001) do the same iteration directly on idom: process blocks in reverse postorder; idom(B) = intersect of the already-processed predecessors, where <code>intersect(a, b)</code> walks the two fingers up the current idom tree using postorder numbers until they meet. It converges in a couple of passes on typical CFGs and is what many production compilers use; Lengauer-Tarjan is asymptotically faster (near-linear) and used by LLVM historically (now a semi-NCA variant)."
      ],
      code: String.raw`def dominators(succ, entry):
    rpo = reverse_postorder(succ, entry)
    index = {b: i for i, b in enumerate(rpo)}
    preds = preds_of(succ)
    idom = {entry: entry}
    def intersect(a, b):
        while a != b:
            while index[a] > index[b]: a = idom[a]
            while index[b] > index[a]: b = idom[b]
        return a
    changed = True
    while changed:
        changed = False
        for b in rpo[1:]:
            done = [p for p in preds[b] if p in idom]
            new = done[0]
            for p in done[1:]:
                new = intersect(p, new)
            if idom.get(b) != new:
                idom[b] = new
                changed = True
    return idom`
    },
    {
      h: "Dominance frontiers",
      p: [
        "The <b>dominance frontier</b> DF(A) is the set of blocks B such that A dominates a predecessor of B but does not strictly dominate B. Informally: the first blocks where A's dominance stops, which are exactly the merge points where a definition in A meets definitions from elsewhere.",
        "Cooper et al.'s computation: for every join block B (two or more predecessors), for each predecessor P, walk a runner from P up the dominator tree until reaching idom(B), adding B to DF(runner) at each step. Loop headers appear in their own frontier when the loop body flows back to them (DF(header) ∋ header), which is how loop-carried variables get φs at the header."
      ],
      code: String.raw`def dominance_frontiers(succ, idom):
    preds = preds_of(succ)
    df = defaultdict(set)
    for b in idom:
        if len(preds[b]) >= 2:                  # only join points contribute
            for p in preds[b]:
                runner = p
                while runner != idom[b]:
                    df[runner].add(b)
                    runner = idom[runner]
    return df`
    },
    {
      h: "Placing φ-functions (Cytron et al.)",
      p: [
        "For each variable v with definition blocks Defs(v): every block in DF of a definition block needs a φ for v. But a φ is itself a new definition of v, so its block's frontier may need φs too. Hence the <b>iterated dominance frontier</b> DF⁺(Defs(v)), computed with a worklist: pop a block, for each d in DF(block) without a φ for v yet, insert one and push d if it was not already a definition site.",
        "This yields <b>minimal SSA</b>: as few φs as possible given only the CFG, but some may be dead (the variable is not live at the merge). <b>Pruned SSA</b> runs liveness first and inserts a φ only where v is live-in. <b>Semi-pruned SSA</b> skips variables that are never live across a block boundary (local temporaries), a cheap middle ground that LLVM-style constructions approximate.",
        "Cytron, Ferrante, Rosen, Wegman and Zadeck, \"Efficiently Computing Static Single Assignment Form and the Control Dependence Graph\" (TOPLAS 1991) is the paper to cite; the same frontiers on the reverse CFG give control dependence."
      ],
      code: String.raw`def place_phis(blocks, df):
    defsites = defaultdict(set)
    for b, stmts in blocks.items():
        for tgt, _, _ in stmts:
            if tgt:
                defsites[tgt].add(b)
    phis = defaultdict(set)                     # block -> {var}
    for v, sites in defsites.items():
        work = list(sites)
        while work:
            b = work.pop()
            for d in df[b]:
                if v not in phis[d]:
                    phis[d].add(v)
                    if d not in sites:          # a phi is itself a new definition of v
                        work.append(d)
    return phis`
    },
    {
      h: "Renaming, and getting out of SSA",
      p: [
        "Renaming walks the dominator tree from the entry, keeping a stack of current versions per variable. In each block: φ targets get fresh versions (pushed); for each ordinary statement, uses are replaced by the top of their stack and definitions get fresh versions (pushed); then, for each CFG successor, fill in this block's operand of each φ with the current top of stack; recurse into dominator-tree children; on return, pop everything pushed in this block. Correctness relies on dominance: the top of the stack is always the definition that dominates the current point.",
        "<b>SSA destruction</b>: machines have no φ. The naive translation replaces <code>x3 = φ(x1 from B1, x2 from B2)</code> with copies <code>x3 = x1</code> at the end of B1 and <code>x3 = x2</code> at the end of B2. This is wrong in two well-known cases after optimization: the <b>lost-copy problem</b> (copy placed on a critical edge or where the φ result is still needed) and the <b>swap problem</b> (φs that read each other, like <code>a2 = φ(b1)</code>, <code>b2 = φ(a1)</code>, must be treated as parallel copies, needing a temporary). Fixes: split critical edges and sequentialize parallel copies (Briggs et al.; Boissinot et al. for a modern treatment). Register allocation then coalesces most copies away."
      ]
    },
    {
      h: "SSA in LLVM: alloca, mem2reg and φ",
      p: [
        "Clang does not build SSA directly. At <code>-O0</code> it puts every local variable in a stack slot (<code>alloca</code>) and reads/writes it with <code>load</code>/<code>store</code>, which is trivially in SSA because memory is not subject to SSA. The <code>mem2reg</code> pass (and <code>SROA</code>, which subsumes it for aggregates) promotes allocas whose address does not escape into SSA registers, computing dominance frontiers and inserting <code>phi</code> instructions exactly as above.",
        "LLVM's <code>phi</code> syntax lists <code>[value, predecessor-label]</code> pairs: <code>%r.0 = phi i32 [ %a, %if.then ], [ %b, %if.else ]</code>. φs must be grouped at the top of a block and have one entry per predecessor. Every block ends in exactly one terminator (<code>br</code>, <code>ret</code>, <code>switch</code>...).",
        "Practical gotcha: <code>clang -O0</code> marks functions <code>optnone</code>, so <code>opt -passes=mem2reg</code> silently does nothing on them. Use <code>clang -O0 -Xclang -disable-O0-optnone -S -emit-llvm f.c</code>, then run the pass."
      ],
      code: String.raw`; int max(int a, int b) { int r; if (a > b) r = a; else r = b; return r; }
; clang -O0 -Xclang -disable-O0-optnone -S -emit-llvm max.c   (excerpt, metadata removed)
define dso_local i32 @max(i32 noundef %a, i32 noundef %b) {
entry:
  %a.addr = alloca i32, align 4
  %b.addr = alloca i32, align 4
  %r = alloca i32, align 4
  store i32 %a, ptr %a.addr, align 4
  store i32 %b, ptr %b.addr, align 4
  %0 = load i32, ptr %a.addr, align 4
  %1 = load i32, ptr %b.addr, align 4
  %cmp = icmp sgt i32 %0, %1
  br i1 %cmp, label %if.then, label %if.else
if.then:
  %2 = load i32, ptr %a.addr, align 4
  store i32 %2, ptr %r, align 4
  br label %if.end
if.else:
  %3 = load i32, ptr %b.addr, align 4
  store i32 %3, ptr %r, align 4
  br label %if.end
if.end:
  %4 = load i32, ptr %r, align 4
  ret i32 %4
}

; opt -S -passes=mem2reg max.ll
define dso_local i32 @max(i32 noundef %a, i32 noundef %b) {
entry:
  %cmp = icmp sgt i32 %a, %b
  br i1 %cmp, label %if.then, label %if.else
if.then:                                          ; preds = %entry
  br label %if.end
if.else:                                          ; preds = %entry
  br label %if.end
if.end:                                           ; preds = %if.else, %if.then
  %r.0 = phi i32 [ %a, %if.then ], [ %b, %if.else ]
  ret i32 %r.0
}`
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: "Loops in SSA, analyses that exploit SSA, and the other SSA variants you may be asked about.",
    sections: [
      {
        h: "A loop in LLVM IR, before and after promotion",
        p: [
          "For <code>int sum(int n) { int s = 0; for (int i = 0; i &lt; n; i++) s += i; return s; }</code>, promotion produces two φs in the loop header, one per loop-carried variable. The first operand comes from the preheader (<code>entry</code>), the second from the back edge (<code>for.body</code>). This output was produced from hand-written <code>-O0</code>-style IR with LLVM's SROA pass (which performs the same promotion as <code>mem2reg</code> for scalars):"
        ],
        code: String.raw`define dso_local i32 @sum(i32 noundef %n) {
entry:
  br label %for.cond

for.cond:                                         ; preds = %for.body, %entry
  %s.0 = phi i32 [ 0, %entry ], [ %add, %for.body ]
  %i.0 = phi i32 [ 0, %entry ], [ %inc, %for.body ]
  %cmp = icmp slt i32 %i.0, %n
  br i1 %cmp, label %for.body, label %for.end

for.body:                                         ; preds = %for.cond
  %add = add nsw i32 %s.0, %i.0
  %inc = add nsw i32 %i.0, 1
  br label %for.cond

for.end:                                          ; preds = %for.cond
  ret i32 %s.0
}`
      },
      {
        h: "Sparse conditional constant propagation",
        p: [
          "SCCP (Wegman and Zadeck, 1991) is the showcase SSA analysis. It keeps a lattice value per SSA variable (undefined ⊤, constant c, overdefined ⊥) and a set of executable CFG edges. Two worklists: SSA edges (when a definition's value changes, revisit its uses) and CFG edges (when a branch condition becomes constant, only one successor edge becomes executable). A φ meets only operands from executable incoming edges. Because it combines constant propagation with unreachable-code detection, it finds strictly more constants than running the two separately, and each variable's value can change at most twice, so it is linear in the size of the SSA graph."
        ]
      },
      {
        h: "Memory, aliasing and SSA variants",
        p: [
          "Classic SSA covers scalar variables whose address is not taken. Memory needs more: LLVM's <b>MemorySSA</b> gives a virtual SSA form to memory states (MemoryDef, MemoryUse, MemoryPhi) for passes like GVN and LICM; GCC has virtual operands (VDEF/VUSE). <b>e-SSA / SSI</b> (static single information) also splits variables after branches (π or σ functions) so a condition like <code>x &gt; 0</code> attaches to a new version in the true branch, which helps range and nullness analysis (used in ABCD array-bounds-check elimination). <b>Gated SSA</b> annotates φs with the branch predicate. Shimple in Soot can optionally add π nodes for this reason."
        ]
      },
      {
        h: "Shimple: SSA for Java in Soot",
        p: [
          "Run <code>java -cp soot.jar soot.Main -cp . -pp -f S Demo</code> to see Shimple. For <code>abs</code> it prints numbered statements and a φ in the join block (real output from Soot 4.4.1):",
          "<pre><code>static int abs(int)\n{\n    int i0, i0_1, i0_2;\n    i0 := @parameter0: int;\n(0) if i0 &gt;= 0 goto label1;\n(1) i0_1 = neg i0;\n label1:\n    i0_2 = Phi(i0 #0, i0_1 #1);\n    return i0_2;\n}</code></pre>",
          "<code>#0</code> and <code>#1</code> refer to the predecessor statements labeled <code>(0)</code> and <code>(1)</code>: the value is <code>i0</code> when control comes from the branch and <code>i0_1</code> when it falls through from the negation. SootUp similarly supports SSA through its body interceptors."
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: "Every Bounty Poster Gets a New Version Number",
      text: [
        "The Marines keep one master copy of each bounty poster and overwrite it whenever the bounty changes, so nobody can tell which value a report was based on. Robin proposes a better archive: never overwrite a poster. Each change prints a new, numbered poster (Luffy-1: 30 million, Luffy-2: 100 million, Luffy-3: 300 million). Every report now names exactly the poster it used: single assignment.",
        "The tricky part is when two fleets come back from different missions and merge: one fleet carries Luffy-2, the other Luffy-3. The harbor posts a notice \"Luffy-4 = whichever poster arrived with the fleet that docked\" (a φ-function). Robin only needs such notices at harbors where routes from different missions first meet, never at a harbor that every route must pass through first (the dominance frontier). And when a new notice itself creates a new poster, the next merge harbor downstream may need a notice too (the iterated frontier)."
      ]
    },
    sitcom: {
      show: "The Big Bang Theory",
      title: "Leonard's Thesis Drafts",
      text: [
        "Sheldon refuses to edit a file named thesis.doc because he can never tell which version a comment refers to. Every edit must produce a new file: thesis_v1, thesis_v2. When Leonard and Raj each edit v2 on different laptops and come back together, Sheldon insists on a merge note at the top of the next file: \"v5 is v3 if we used Leonard's laptop, v4 if Raj's\". He points out that a merge note is only needed at the first meeting after the branches split, not on files that every edit history passes through anyway."
      ]
    },
    why: "SSA is versioning without overwriting: every definition creates a new name, so every use refers to exactly one definition. A φ is the merge note that picks a version based on which path arrived. Merge notes go exactly at the dominance frontier, the first places where histories that were separate meet, and new merge notes can force more merge notes downstream."
  },
  storyAnim: {
    h: 250,
    props: [
      { id: "b0", emoji: "⚓", label: "B0: x1 = 1", x: 45, y: 10 },
      { id: "b1", emoji: "🚢", label: "B1: x2 = x1 + 2", x: 20, y: 45 },
      { id: "b2", emoji: "🚢", label: "B2: x3 = 10", x: 72, y: 45 },
      { id: "b3", emoji: "🏝️", label: "B3: return x", x: 45, y: 82 },
      { id: "dom", emoji: "🌲", label: "B0 idom of B1, B2, B3", x: 88, y: 10, cls: "off" },
      { id: "df", emoji: "🚧", label: "DF(B1)=DF(B2)={B3}", x: 88, y: 82, cls: "off" },
      { id: "phi", emoji: "🔀", label: "x4 = φ(x2, x3)", x: 18, y: 82, cls: "off" }
    ],
    actors: [
      { id: "robin", emoji: "📚", label: "Robin", x: 45, y: 35 }
    ],
    steps: [
      { c: "A CFG with a diamond: B0 branches to B1 or B2, both join at B3. Both arms assign x.", p: { b0: "lit", b1: "lit", b2: "lit", b3: "lit" } },
      { c: "Dominators: every path to B1, B2 and B3 passes through B0, and neither arm dominates B3. So idom of all three is B0.", p: { dom: "lit" } },
      { c: "Dominance frontier: B1 dominates a predecessor of B3 (itself) but not B3. Same for B2. So DF(B1) = DF(B2) = {B3}.", a: { robin: [70, 70] }, p: { df: "lit" } },
      { c: "x is defined in B1 and B2, so B3 is in the iterated frontier of x's definitions: place a φ for x at B3.", p: { phi: "lit" } },
      { c: "Renaming walks the dominator tree. B0 defines x1; in B1 the use x becomes x1 and the def becomes x2; in B2 the def is x3.", a: { robin: [20, 30] }, l: { b1: "B1: x2 = x1 + 2", b2: "B2: x3 = 10" } },
      { c: "When leaving B1 and B2, each fills its own operand of the φ in their successor B3 with the current top of x's stack.", a: { robin: [30, 70] }, p: { phi: "good" }, l: { phi: "x4 = φ(x2 B1, x3 B2)" } },
      { c: "In B3 the use of x becomes x4. Every use now names exactly one definition.", p: { b3: "good" }, l: { b3: "B3: return x4" } }
    ]
  },
  conceptFlow: {
    title: "SSA construction pipeline",
    intro: "Each stage feeds the next. Click a node.",
    stages: [
      { label: "CFG", nodes: [ { id: "cfg", text: "CFG +\nreverse postorder" } ] },
      { label: "Dominance", nodes: [ { id: "idom", text: "idom via\nCooper-Harvey-Kennedy" }, { id: "tree", text: "dominator tree" }, { id: "df", text: "dominance\nfrontiers" } ] },
      { label: "Placement", nodes: [ { id: "defs", text: "def sites\nper variable" }, { id: "idf", text: "iterated DF\nworklist" }, { id: "prune", text: "pruning by\nliveness (opt.)" } ] },
      { label: "Renaming", nodes: [ { id: "walk", text: "dom-tree walk\nwith stacks" }, { id: "fill", text: "fill φ operands\nof successors" }, { id: "out", text: "out of SSA:\nparallel copies" } ] }
    ],
    steps: [
      { active: ["cfg"], note: "Number blocks in reverse postorder so each block (except loop headers' back edges) is processed after its predecessors." },
      { active: ["idom"], note: "Iterate idom(B) = intersect(processed predecessors) until nothing changes." },
      { active: ["tree"], note: "idom edges form the dominator tree, which renaming will walk." },
      { active: ["df"], note: "For each join block, run each predecessor up the dominator tree to idom(join), adding the join to each runner's DF." },
      { active: ["defs", "idf"], note: "For each variable, insert φs at DF of its def sites; each new φ is a def, so iterate with a worklist." },
      { active: ["prune"], note: "Pruned SSA drops φs for variables that are not live at the join; minimal SSA keeps them." },
      { active: ["walk", "fill"], note: "Rename along the dominator tree: push new versions on defs, rewrite uses, fill successor φ operands, pop on exit." },
      { active: ["out"], note: "Before code generation, replace φs with copies on incoming edges, splitting critical edges and sequentializing parallel copies." }
    ]
  },
  tech: [
    {
      q: "Why does a loop header get φs for every variable modified in the loop?",
      a: [
        "The header has two kinds of predecessors: the preheader (values from before the loop) and the latch (values from the previous iteration). A variable assigned in the body has a definition in a block that dominates the latch but not the header, so the header is in that block's dominance frontier. That is the loop-carried φ: <code>i.0 = phi [0, %entry], [%inc, %for.body]</code>. Variables only read in the loop need no φ."
      ]
    },
    {
      q: "What does mem2reg refuse to promote, and why?",
      a: [
        "Allocas whose address escapes or is used by anything other than simple loads and stores of the whole value: passed to a call, stored into memory, used in pointer arithmetic or <code>getelementptr</code> into a struct, or volatile accesses. Once the address escapes, other code could modify the slot through a pointer, so the value cannot be represented as a single SSA register. SROA can still split aggregates into scalars first and then promote the pieces; escaped variables stay in memory and are handled by alias analysis and MemorySSA."
      ]
    },
    {
      q: "Is SSA the same as functional programming?",
      a: [
        "Closely related. Appel's \"SSA is Functional Programming\" (1998) and Kelsey's earlier work show that SSA corresponds to continuation-passing style or nested functions: each basic block is a function, φ-functions are its parameters, and a jump passes arguments. Some IRs make this explicit with <b>block arguments</b> instead of φs (MLIR, Swift SIL, Cranelift): <code>br ^bb3(%x2 : i32)</code> passes the value to the successor's parameter. Same information, cleaner semantics for edge-specific values."
      ]
    },
    {
      q: "Why is the φ operand tied to a predecessor block rather than to a position?",
      a: [
        "Because a φ selects by the edge taken into the block, and the value must be available at the end of that predecessor. When code generation turns a φ into copies, each copy is placed at the end of the corresponding predecessor (or on a split edge). If a block appears twice as a predecessor (two edges from a <code>switch</code> to the same target), LLVM requires the φ to list it twice with the same value."
      ]
    }
  ],
  code: {
    title: "Full SSA construction: dominators, frontiers, φ placement, renaming",
    intro: "The CFG is a loop containing an if/else. Run <code>python3 ssa.py</code>; it prints idom, frontiers, where φs go, and the renamed program.",
    code: String.raw`"""Construct SSA: dominators (Cooper-Harvey-Kennedy), dominance frontiers, phi placement (Cytron et al.), renaming."""
import re
from collections import defaultdict

# CFG for:   x = 1; y = 0
#            while x < n:            (B1 header)
#                if x % 2:           (B3)
#                    y = y + x       (B4)
#                else:
#                    y = y - 1       (B5)
#                x = x + 1           (B6, loop latch)
#            return y                (B2)
# Each statement: (target or None, [used vars], text)
BLOCKS = {
    "B0": [("x", [], "1"), ("y", [], "0")],
    "B1": [(None, ["x", "n"], "if x < n")],
    "B3": [(None, ["x"], "if x % 2")],
    "B5": [("y", ["y"], "y - 1")],
    "B4": [("y", ["y", "x"], "y + x")],
    "B6": [("x", ["x"], "x + 1")],
    "B2": [(None, ["y"], "return y")],
}
SUCC = {"B0": ["B1"], "B1": ["B3", "B2"], "B3": ["B4", "B5"], "B4": ["B6"], "B5": ["B6"],
        "B6": ["B1"], "B2": []}
ENTRY = "B0"
PARAMS = ["n"]

def preds_of(succ):
    p = defaultdict(list)
    for b, ss in succ.items():
        for s in ss:
            p[s].append(b)
    return p

def reverse_postorder(succ, entry):
    seen, order = set(), []
    def dfs(b):
        seen.add(b)
        for s in succ[b]:
            if s not in seen:
                dfs(s)
        order.append(b)
    dfs(entry)
    return order[::-1]

def dominators(succ, entry):
    """Cooper, Harvey & Kennedy, 'A Simple, Fast Dominance Algorithm' (2001)."""
    rpo = reverse_postorder(succ, entry)
    index = {b: i for i, b in enumerate(rpo)}
    preds = preds_of(succ)
    idom = {entry: entry}
    def intersect(a, b):
        while a != b:
            while index[a] > index[b]: a = idom[a]
            while index[b] > index[a]: b = idom[b]
        return a
    changed = True
    while changed:
        changed = False
        for b in rpo[1:]:
            done = [p for p in preds[b] if p in idom]
            new = done[0]
            for p in done[1:]:
                new = intersect(p, new)
            if idom.get(b) != new:
                idom[b] = new
                changed = True
    return idom

def dominance_frontiers(succ, idom):
    preds = preds_of(succ)
    df = defaultdict(set)
    for b in idom:
        if len(preds[b]) >= 2:                  # only join points contribute
            for p in preds[b]:
                runner = p
                while runner != idom[b]:
                    df[runner].add(b)
                    runner = idom[runner]
    return df

def place_phis(blocks, df):
    defsites = defaultdict(set)
    for b, stmts in blocks.items():
        for tgt, _, _ in stmts:
            if tgt:
                defsites[tgt].add(b)
    phis = defaultdict(set)                     # block -> {var}
    for v, sites in defsites.items():
        work = list(sites)
        while work:
            b = work.pop()
            for d in df[b]:
                if v not in phis[d]:
                    phis[d].add(v)
                    if d not in sites:          # a phi is itself a new definition of v
                        work.append(d)
    return phis

def rename(blocks, succ, idom, phis, entry, params):
    preds = preds_of(succ)
    kids = defaultdict(list)
    for b, d in idom.items():
        if b != d:
            kids[d].append(b)
    counter = defaultdict(int)
    stack = defaultdict(list)
    for p in params:
        stack[p].append(p + "0")
    out = {b: [] for b in blocks}
    phi_args = {b: {v: {} for v in phis[b]} for b in blocks}
    phi_dst = {b: {} for b in blocks}

    def fresh(v):
        counter[v] += 1
        name = f"{v}{counter[v]}"
        stack[v].append(name)
        return name

    def walk(b):
        pushed = []
        for v in sorted(phis[b]):
            phi_dst[b][v] = fresh(v); pushed.append(v)
        for tgt, uses, text in blocks[b]:
            text = re.sub(r"[A-Za-z_]\w*",
                          lambda m: stack[m.group()][-1] if m.group() in uses else m.group(), text)
            if tgt:
                text = f"{fresh(tgt)} = {text}"; pushed.append(tgt)
            out[b].append(text)
        for s in succ[b]:
            for v in phis[s]:
                phi_args[s][v][b] = stack[v][-1] if stack[v] else "undef"
        for k in kids[b]:
            walk(k)
        for v in pushed:
            stack[v].pop()

    walk(entry)
    for b in blocks:
        for v in sorted(phis[b], reverse=True):
            args = ", ".join(f"[{phi_args[b][v][p]}, {p}]" for p in preds[b])
            out[b].insert(0, f"{phi_dst[b][v]} = phi {args}")
    return out

idom = dominators(SUCC, ENTRY)
df = dominance_frontiers(SUCC, idom)
phis = place_phis(BLOCKS, df)
print("idom:", {b: d for b, d in idom.items() if b != d})
print("DF:  ", {b: sorted(s) for b, s in df.items() if s})
print("phis:", {b: sorted(v) for b, v in phis.items() if v})
ssa = rename(BLOCKS, SUCC, idom, phis, ENTRY, PARAMS)
for b in reverse_postorder(SUCC, ENTRY):
    print(f"{b}:")
    for line in ssa[b]:
        print("    " + line)

# Output:
# idom: {'B1': 'B0', 'B2': 'B1', 'B3': 'B1', 'B5': 'B3', 'B4': 'B3', 'B6': 'B3'}
# DF:   {'B6': ['B1'], 'B3': ['B1'], 'B1': ['B1'], 'B4': ['B6'], 'B5': ['B6']}
# phis: {'B1': ['x', 'y'], 'B6': ['y']}
# B0:
#     x1 = 1
#     y1 = 0
# B1:
#     x2 = phi [x1, B0], [x3, B6]
#     y2 = phi [y1, B0], [y5, B6]
#     if x2 < n0
# B2:
#     return y2
# B3:
#     if x2 % 2
# B5:
#     y3 = y2 - 1
# B4:
#     y4 = y2 + x2
# B6:
#     y5 = phi [y4, B4], [y3, B5]
#     x3 = x2 + 1`,
    notes: [
      "DF(B1) contains B1 itself: the loop body flows back to the header, so loop-carried variables x and y get φs at B1. B6 is the join of the if/else, so y gets a second φ there.",
      "x needs no φ at B6 because x is not assigned in B4 or B5; minimal SSA follows definitions, not uses.",
      "The renamer uses a regex to substitute names in statement text; a real implementation rewrites operand objects instead.",
      "Swap <code>SUCC</code> and <code>BLOCKS</code> for the CFG produced by the lowering lesson's code to build SSA for real lowered programs."
    ]
  },
  lab: {
    title: "Dominance frontiers and φ placement",
    prompt: "Given a CFG (<code>SUCC</code>), its immediate dominators (<code>IDOM</code>) and the blocks where each variable is defined (<code>DEFS</code>), implement <code>dominance_frontiers(succ, idom)</code> using the runner algorithm (for each block with at least two predecessors, walk each predecessor up the idom chain until reaching the block's idom) and <code>place_phis(defs, df)</code> using the iterated-frontier worklist (a block that receives a new φ becomes a definition site unless it already was one). The asserts must pass.",
    starter: String.raw`from collections import defaultdict

# entry -> A; A -> B, C; B -> D; C -> D; D -> A (loop back), D -> exit
SUCC = {"entry": ["A"], "A": ["B", "C"], "B": ["D"], "C": ["D"], "D": ["A", "exit"], "exit": []}
IDOM = {"entry": "entry", "A": "entry", "B": "A", "C": "A", "D": "A", "exit": "D"}
DEFS = {"v": {"entry", "B"}, "w": {"C"}}

def predecessors(succ):
    preds = defaultdict(list)
    for b, ss in succ.items():
        for s in ss:
            preds[s].append(b)
    return preds

# TODO: dominance_frontiers(succ, idom) and place_phis(defs, df)

df = dominance_frontiers(SUCC, IDOM)
phis = place_phis(DEFS, df)
assert df["B"] == {"D"} and df["C"] == {"D"} and df["D"] == {"A"} and df["A"] == {"A"}
assert phis["D"] == {"v", "w"} and phis["A"] == {"v", "w"}
print("DF:", {k: sorted(v) for k, v in df.items()})
print("phis:", {k: sorted(v) for k, v in phis.items()})
`,
    checks: [
      { re: 'def\\s+dominance_frontiers\\s*\\(\\s*succ\\s*,\\s*idom\\s*\\)', flags: '', must: true, hint: "Define dominance_frontiers(succ, idom).", pass: "dominance_frontiers ✓" },
      { re: 'len\\(\\s*preds\\[\\s*b\\s*\\]\\s*\\)\\s*>=\\s*2', flags: '', must: true, hint: "Only join blocks contribute: if len(preds[b]) >= 2.", pass: "Join points only ✓" },
      { re: 'while\\s+runner\\s*!=\\s*idom\\[\\s*b\\s*\\]', flags: '', must: true, hint: "Walk the runner up while runner != idom[b].", pass: "Runner loop ✓" },
      { re: 'runner\\s*=\\s*idom\\[\\s*runner\\s*\\]', flags: '', must: true, hint: "Advance the runner with runner = idom[runner].", pass: "Runner advances ✓" },
      { re: 'def\\s+place_phis\\s*\\(\\s*defs\\s*,\\s*df\\s*\\)', flags: '', must: true, hint: "Define place_phis(defs, df).", pass: "place_phis ✓" },
      { re: 'worklist\\.append\\(', flags: '', must: true, hint: "Use a worklist; push blocks that receive a new phi (they are new definition sites).", pass: "Iterated frontier ✓" },
      { re: 'if\\s+\\w+\\s+not\\s+in\\s+sites', flags: '', must: true, hint: "Only push a phi block if it was not already an original definition site (if d not in sites).", pass: "Def-site check ✓" }
    ],
    run: "Save as <code>phi_lab.py</code> and run <code>python3 phi_lab.py</code>. Expected: <code>DF: {'entry': [], 'A': ['A'], 'B': ['D'], 'C': ['D'], 'D': ['A'], 'exit': []}</code> and <code>phis: {'D': ['v', 'w'], 'A': ['v', 'w']}</code>. Why does <code>w</code> need a φ at A even though it is only defined in C? Because the φ for w at D is a new definition, and DF(D) = {A}: that is the iterated part. Then check your understanding against LLVM: write the loop in C, compile with <code>clang -O0 -Xclang -disable-O0-optnone -S -emit-llvm</code>, run <code>opt -S -passes=mem2reg</code>, and find the header φs.",
    solution: String.raw`from collections import defaultdict

# entry -> A; A -> B, C; B -> D; C -> D; D -> A (loop back), D -> exit
SUCC = {"entry": ["A"], "A": ["B", "C"], "B": ["D"], "C": ["D"], "D": ["A", "exit"], "exit": []}
IDOM = {"entry": "entry", "A": "entry", "B": "A", "C": "A", "D": "A", "exit": "D"}
DEFS = {"v": {"entry", "B"}, "w": {"C"}}

def predecessors(succ):
    preds = defaultdict(list)
    for b, ss in succ.items():
        for s in ss:
            preds[s].append(b)
    return preds

def dominance_frontiers(succ, idom):
    preds = predecessors(succ)
    df = {b: set() for b in succ}
    for b in succ:
        if len(preds[b]) >= 2:
            for p in preds[b]:
                runner = p
                while runner != idom[b]:
                    df[runner].add(b)
                    runner = idom[runner]
    return df

def place_phis(defs, df):
    phis = defaultdict(set)
    for var, sites in defs.items():
        worklist = list(sites)
        while worklist:
            b = worklist.pop()
            for d in df[b]:
                if var not in phis[d]:
                    phis[d].add(var)
                    if d not in sites:
                        worklist.append(d)
    return phis

df = dominance_frontiers(SUCC, IDOM)
phis = place_phis(DEFS, df)
assert df["B"] == {"D"} and df["C"] == {"D"} and df["D"] == {"A"} and df["A"] == {"A"}
assert phis["D"] == {"v", "w"} and phis["A"] == {"v", "w"}
print("DF:", {k: sorted(v) for k, v in df.items()})
print("phis:", {k: sorted(v) for k, v in phis.items()})
`,
    notes: [
      "A ∈ DF(A) because A is a join with predecessors entry and D. The runner from entry stops at once (entry is idom(A)); the runner from D visits D (adding A to DF(D)), then idom(D) = A (adding A to DF(A)), then reaches entry and stops. That self-membership is what gives loop headers their φs.",
      "This is minimal SSA. If w is dead after the loop and not used in A, pruned SSA would skip the φ for w at A.",
      "The worklist order does not affect the result, only the amount of work; the iteration stops because each (block, variable) pair gets at most one φ."
    ]
  },
  quiz: [
    {
      q: "What does <code>x3 = φ(x1 from B1, x2 from B2)</code> mean?",
      options: ["x3 is the maximum of x1 and x2", "x3 takes x1 if control arrived from B1, x2 if from B2", "Both assignments happen", "x3 is undefined"],
      correct: 1,
      explain: "A φ selects the operand associated with the incoming edge actually taken."
    },
    {
      q: "Block A dominates B means:",
      options: ["A is B's immediate predecessor", "Every path from entry to B passes through A", "A executes more often than B", "B is reachable from A"],
      correct: 1,
      explain: "Dominance is about all paths from entry. Reachability or adjacency is not enough."
    },
    {
      q: "Where does Cytron's algorithm place φ-functions for a variable v?",
      options: ["At every join block", "At the iterated dominance frontier of the blocks that define v", "At the dominator-tree root", "At every use of v"],
      correct: 1,
      explain: "DF⁺ of def sites; each φ is a new def, hence iteration. Pruned SSA additionally requires v to be live there."
    },
    {
      q: "You run <code>opt -passes=mem2reg</code> on <code>clang -O0</code> output and nothing changes. Why?",
      options: ["mem2reg only works on C++", "clang -O0 adds the optnone attribute; compile with -Xclang -disable-O0-optnone", "You need -O3 first", "LLVM IR is already SSA so nothing to do"],
      correct: 1,
      explain: "optnone makes the optimizer skip the function. Locals at -O0 live in allocas, which mem2reg would otherwise promote."
    },
    {
      q: "Why is translating φs into copies at the end of predecessors sometimes wrong?",
      options: ["Copies are slower than φs", "Lost-copy and swap problems: copies on critical edges or between φs that read each other need edge splitting and parallel-copy sequentialization", "Machines support φ directly", "It is never wrong"],
      correct: 1,
      explain: "φs at a block execute in parallel; naive sequential copies can overwrite a value another copy still needs."
    }
  ],
  testFlow: {
    title: "SSA reasoning",
    start: "q1",
    nodes: {
      q1: { q: "x is assigned only in the entry block and then read inside a loop. Does the loop header need a φ for x?", choices: [ { text: "No", to: "q1ok" }, { text: "Yes, every loop header needs φs", to: "q1bad" } ] },
      q1ok: { end: true, correct: true, text: "Right. The single definition dominates the whole loop; φs are only needed where different definitions can merge.", next: "q2" },
      q1bad: { end: true, correct: false, text: "Only variables defined inside the loop (or otherwise reaching the header along different paths) get header φs.", retry: "q1" },
      q2: { q: "In a diamond B0 → {B1, B2} → B3, what is idom(B3)?", choices: [ { text: "B0", to: "q2ok" }, { text: "B1 or B2, whichever ran", to: "q2bad" } ] },
      q2ok: { end: true, correct: true, text: "Yes. Neither arm is on every path to B3; B0 is.", next: "q3" },
      q2bad: { end: true, correct: false, text: "Dominance is static and about all paths. Neither B1 nor B2 is on every path.", retry: "q2" },
      q3: { q: "Two φs at the top of a block: a2 = φ(b1 from L), b2 = φ(a1 from L). Out of SSA you emit a2 = b1; b2 = a2 at the end of L. Correct?", choices: [ { text: "No: φs are parallel; b2 must get the old a, so use a temporary", to: "q3ok" }, { text: "Yes", to: "q3bad" } ] },
      q3ok: { end: true, correct: true, text: "Correct, that is the swap problem: t = a1; a2 = b1; b2 = t (with a1/a2 coalesced into one register)." },
      q3bad: { end: true, correct: false, text: "Once versions are coalesced into the same registers, sequential copies overwrite a before b reads it.", retry: "q3" }
    }
  },
  pitfalls: [
    "Thinking a φ is executed like an instruction in sequence. All φs in a block read their operands simultaneously on entry.",
    "Placing φs only at DF of the original definitions, forgetting that φs are definitions too (iterate).",
    "Expecting <code>mem2reg</code> to work on <code>clang -O0</code> output without <code>-Xclang -disable-O0-optnone</code>.",
    "Assuming SSA covers memory: in LLVM IR, loads and stores through pointers are not in SSA; aliasing still matters.",
    "Dropping SSA naively with copies at predecessor ends, without splitting critical edges or handling parallel copies."
  ],
  interview: [
    {
      q: "What is SSA form and why do compilers use it?",
      a: "Every variable is assigned exactly once statically; φ-functions at merge points select values by incoming edge. It makes def-use chains explicit (each use has one def), enables sparse analyses that attach facts to variables instead of program points (SCCP, GVN, aggressive DCE), removes false dependencies from reused names, and simplifies many transformations. LLVM IR, GCC GIMPLE-SSA, HotSpot C2, Graal, V8 TurboFan, WALA and Soot's Shimple all use it."
    },
    {
      q: "How do you convert a CFG to SSA? Walk through the algorithm.",
      a: "(1) Compute dominators and the dominator tree (Cooper-Harvey-Kennedy iterative idom, or Lengauer-Tarjan). (2) Compute dominance frontiers: for each join block, walk each predecessor up to the join's idom, adding the join to each visited block's DF. (3) For each variable, insert φs at the iterated DF of its definition blocks using a worklist; optionally prune with liveness. (4) Rename by a preorder walk of the dominator tree with a stack per variable: new versions for φ targets and defs, rewrite uses with stack tops, fill φ operands in CFG successors, pop on exit. Complexity is near-linear in practice."
    },
    {
      q: "Define dominance frontier and explain why φs go there.",
      a: "DF(A) = {B : A dominates some predecessor of B, but A does not strictly dominate B}. A definition in A reaches everything A dominates unopposed; the dominance frontier is the first place where paths not passing through A also arrive, so values from A may meet other values of the same variable. Those are exactly the merge points needing φs. Iterating handles φs creating new definitions."
    },
    {
      q: "Explain a tradeoff: minimal, semi-pruned and pruned SSA.",
      a: "Minimal SSA (Cytron) inserts φs at all iterated-frontier blocks, needing only the CFG, but creates dead φs for variables not live at the merge, wasting memory and time in later passes. Pruned SSA requires a liveness analysis first and inserts only live φs, producing the smallest form at the cost of that analysis. Semi-pruned skips variables that are only ever used in the block where they are defined (no liveness needed, just a per-block scan) and removes most dead φs cheaply. Many compilers use semi-pruned plus later dead-φ elimination."
    },
    {
      q: "What does mem2reg do in LLVM?",
      a: "Clang emits locals as <code>alloca</code> stack slots with loads and stores, which is SSA-trivial because memory is not in SSA. <code>mem2reg</code> promotes each alloca whose address does not escape and is only loaded and stored as a whole: it finds the blocks with stores (definitions), places <code>phi</code> nodes at their iterated dominance frontier, renames loads to the reaching SSA values along the dominator tree, and deletes the alloca, loads and stores. SROA does the same plus splitting aggregates and is what the default pipeline uses."
    },
    {
      q: "Whiteboard: design an SSA-based constant propagation for a JIT.",
      a: "SCCP over SSA: lattice per value (⊤ unknown, constant c, ⊥ overdefined), executable flag per CFG edge. Initialize entry edge executable. Worklists of CFG edges and SSA def-use edges. When a block becomes reachable, evaluate its φs (meet only executable incoming operands) and instructions; when a branch condition is constant, mark only the taken edge executable. When a value lowers in the lattice, push its uses. Afterwards replace constant values, fold branches, delete unreachable blocks. For a JIT, add speculation: use profile-observed constants guarded by deoptimization checks, which is how JITs propagate \"constants\" that are only constant in practice."
    },
    {
      q: "How do you get out of SSA, and what can go wrong?",
      a: "Replace each φ with copies on its incoming edges, at the end of predecessors. Problems appear after optimizations like copy propagation: the lost-copy problem (a copy placed where the φ's result is still live, typically on a critical edge) and the swap problem (φs that cyclically read each other's values need parallel-copy semantics). The standard fixes are splitting critical edges and treating each block's φs as a parallel copy that is sequentialized with temporaries when cycles exist; coalescing in register allocation removes most copies afterwards."
    }
  ]
};
