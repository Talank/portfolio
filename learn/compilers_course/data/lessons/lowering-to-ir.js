window.LESSONS = window.LESSONS || {};
window.LESSONS['lowering-to-ir'] = {
  id: 'lowering-to-ir',
  title: "Lowering: Three-Address Code, Basic Blocks & Control-Flow Graphs",
  category: "Part 2 — Lowering to Intermediate Representations",
  timeMin: 45,
  summary: "Lowering turns a tree with nested expressions and structured statements into a flat list of simple instructions, each doing at most one operation, connected by explicit jumps. That list is three-address code (TAC). Partitioning it into basic blocks with the leader algorithm and connecting the blocks gives the control-flow graph (CFG), the structure every dataflow analysis, SSA construction and optimizer runs on. This lesson lowers a real Python subset to TAC, builds blocks and a CFG in code you can run, and covers the parts interviewers like: short-circuit booleans, loops, back edges, critical edges and exceptions.",
  goals: [
    "Lower expressions to three-address code with temporaries, and statements (if, while, return) to labels and conditional jumps",
    "Lower short-circuit <code>and</code>/<code>or</code> to jumping code instead of evaluating both sides",
    "Find leaders, partition TAC into basic blocks and build CFG edges, including fall-through",
    "Identify back edges, loops, critical edges and unreachable blocks in a CFG",
    "Recognize the same ideas in real IRs: Jimple, LLVM IR, CPython bytecode"
  ],
  concept: [
    {
      h: "Three-address code",
      p: [
        "Each TAC instruction has at most one operator and at most three addresses (two operands, one result): <code>x = y op z</code>, <code>x = op y</code>, <code>x = y</code>, <code>goto L</code>, <code>if x relop y goto L</code> (or <code>ifFalse x goto L</code>), <code>param x</code> / <code>x = call f, n</code>, <code>return x</code>, plus indexed and pointer forms (<code>x = a[i]</code>, <code>*p = x</code>). Operands are variables, constants or compiler temporaries <code>t1, t2, ...</code>.",
        "Lowering an expression is a post-order walk: lower the children, get back operands, emit one instruction into a fresh temporary, return the temporary. <code>a = b * c + d</code> becomes <code>t1 = b * c; t2 = t1 + d; a = t2</code>. Every intermediate value now has a name, which is exactly what dataflow analysis needs: it can say \"<code>t1</code> is defined here and used there\".",
        "TAC is often stored as <b>quadruples</b> <code>(op, arg1, arg2, result)</code>. Jimple (Soot) is a typed TAC for Java; LLVM IR is a typed TAC in SSA form; GCC's GIMPLE is a TAC over trees. Stack bytecode (JVM, CPython) is the other common style: implicit operands on an operand stack, compact to store but awkward to analyze, which is why Soot converts bytecode to Jimple first."
      ],
      code: String.raw`source:   total = price * qty + tax(price)

TAC:      t1 = price * qty
          param price
          t2 = call tax, 1
          t3 = t1 + t2
          total = t3

Jimple (Soot) for a similar Java statement:
          $i0 = i1 * i2;
          $i3 = staticinvoke <Shop: int tax(int)>(i1);
          i4 = $i0 + $i3;`
    },
    {
      h: "Lowering control flow",
      p: [
        "Structured statements become labels and jumps. <code>if c: A else: B</code> lowers to: evaluate <code>c</code> into <code>t</code>; <code>ifFalse t goto Lelse</code>; A; <code>goto Lend</code>; <code>Lelse:</code> B; <code>Lend:</code>. <code>while c: body</code> lowers to <code>Ltop:</code> evaluate c; <code>ifFalse t goto Lend</code>; body; <code>goto Ltop</code>; <code>Lend:</code>. <code>break</code> becomes <code>goto Lend</code> of the innermost loop and <code>continue</code> becomes <code>goto Ltop</code> (or the increment label of a <code>for</code>), so a lowerer keeps a stack of loop labels.",
        "Compilers often rotate loops (test at the bottom: <code>goto Ltest; Lbody: body; Ltest: if c goto Lbody</code>) so each iteration executes one conditional jump instead of a conditional plus an unconditional one. LLVM does this in its <code>loop-rotate</code> pass. javac, by contrast, emits the test at the top (the Jimple in the deep dive and in the Soot lesson shows <code>label1: if i4 &gt;= $i0 goto label2; ... goto label1</code>), but with the condition inverted so the jump leaves the loop.",
        "<code>switch</code> lowers either to a chain of comparisons, a binary search, or a jump table (JVM <code>tableswitch</code> for dense cases, <code>lookupswitch</code> for sparse ones; LLVM <code>switch</code> is lowered later by the back end)."
      ]
    },
    {
      h: "Short-circuit booleans: jumping code",
      p: [
        "<code>if a &lt; b and f(x): S</code> must not call <code>f</code> when <code>a &lt; b</code> is false. So boolean expressions in conditions are lowered as <b>jumping code</b>: a function <code>cond(e, Ltrue, Lfalse)</code> emits jumps rather than computing a value. For <code>e1 and e2</code>: <code>cond(e1, Lmid, Lfalse); Lmid: cond(e2, Ltrue, Lfalse)</code>. For <code>e1 or e2</code>: <code>cond(e1, Ltrue, Lmid); Lmid: cond(e2, Ltrue, Lfalse)</code>. For <code>not e</code>: swap the labels. A comparison at the leaf emits <code>if a &lt; b goto Ltrue; goto Lfalse</code>.",
        "Consequence for analysis: in the IR, <code>&amp;&amp;</code> and <code>||</code> have disappeared into extra basic blocks and branches. A source-level \"one condition\" may be several CFG branches, which matters for branch coverage, for McCabe complexity measured on bytecode, and for mapping IR results back to source."
      ],
      code: String.raw`if a < b and f(x):          # source
    y = 1

    if a >= b goto L_false     # cond(a < b, L_mid, L_false), inverted test
    t1 = call f, x             # L_mid (fall through)
    ifFalse t1 goto L_false
    y = 1                      # L_true
L_false:`
    },
    {
      h: "Basic blocks with the leader algorithm",
      p: [
        "A <b>basic block</b> is a maximal sequence of instructions with one entry (only the first instruction can be jumped to) and one exit (only the last can jump or end the function). Inside a block, if the first instruction runs, all of them run, in order. That property is why analyses summarize a block once instead of per instruction.",
        "<b>Leaders</b> (Aho, Lam, Sethi, Ullman): (1) the first instruction is a leader; (2) any instruction that is the target of a jump is a leader (in TAC with labels: every label); (3) any instruction immediately following a jump or return is a leader. Each block runs from a leader up to, not including, the next leader.",
        "<b>CFG edges</b>: from block B to C if B's last instruction jumps to C's first, or if B does not end in an unconditional jump or return and C immediately follows B (fall-through). A conditional jump gives two successors. Add a unique ENTRY node with an edge to the first block and an EXIT node with edges from every return; many algorithms assume these."
      ],
      code: String.raw`def basic_blocks(code):
    # Leaders: (1) first instruction, (2) any jump target, (3) instruction after a jump/return.
    leaders = {0}
    for i, ins in enumerate(code):
        if ins[0] == "label":
            leaders.add(i)
        if ins[0] in ("goto", "iffalse", "return") and i + 1 < len(code):
            leaders.add(i + 1)
    starts = sorted(leaders)
    blocks = [code[s:e] for s, e in zip(starts, starts[1:] + [len(code)])]
    ...`
    },
    {
      h: "Reading a CFG: loops, back edges, critical edges, unreachable code",
      p: [
        "A <b>back edge</b> is an edge B → H where H dominates B (every path from entry to B passes through H; dominators are covered in the SSA lesson). Each back edge defines a <b>natural loop</b> with header H: H plus all blocks that can reach B without going through H. In a DFS, edges to an ancestor on the current stack are retreating edges; for reducible CFGs (all CFGs from structured code without <code>goto</code>) retreating edges and back edges coincide.",
        "A <b>critical edge</b> goes from a block with several successors to a block with several predecessors. Some transformations (placing code \"on an edge\", SSA destruction, partial redundancy elimination) need to split critical edges by inserting an empty block. <b>Unreachable blocks</b> have no path from entry; finding them is a graph search, and they are what javac reports as \"unreachable statement\" (by its own rules) and what optimizers delete.",
        "Exceptions complicate everything: any instruction that may throw has an implicit edge to the handler. Soot's <code>ExceptionalUnitGraph</code> models these edges explicitly; <code>BriefUnitGraph</code> ignores them. An analysis that ignores exceptional edges can be wrong about what is defined in a <code>catch</code> or <code>finally</code> block."
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: "Real IRs and real complications: how three production systems represent the CFG, and the design choices behind them.",
    sections: [
      {
        h: "The same function in three IRs",
        p: [
          "For <code>static int abs(int x) { if (x &lt; 0) x = -x; return x; }</code>, Soot's Jimple (run with <code>soot.Main -cp . -pp -f J Demo</code>) is TAC with labels, typed locals and identity statements for parameters:",
          "<pre><code>static int abs(int)\n{\n    int i0;\n    i0 := @parameter0: int;\n    if i0 &gt;= 0 goto label1;\n    i0 = neg i0;\n label1:\n    return i0;\n}</code></pre>",
          "Note the inverted condition (<code>&gt;= 0</code> jumps over the then-branch), exactly the jumping-code pattern. LLVM IR at <code>-O0</code> would keep <code>x</code> in a stack slot (<code>alloca</code>, <code>load</code>, <code>store</code>) with explicit blocks <code>entry</code>, <code>if.then</code>, <code>if.end</code> and <code>br</code> terminators; every LLVM block must end in exactly one terminator, so fall-through does not exist there. CPython bytecode for the same logic uses <code>COMPARE_OP</code> and <code>POP_JUMP_IF_FALSE</code> on an operand stack; <code>dis.dis</code> marks jump targets with <code>&gt;&gt;</code>, which are the block leaders."
        ]
      },
      {
        h: "Instruction-level vs block-level CFGs",
        p: [
          "Soot's <code>UnitGraph</code> classes are instruction-level CFGs (one node per <code>Unit</code>), with <code>BlockGraph</code> variants if you want blocks; SootUp's <code>StmtGraph</code> is also statement level. LLVM and GCC are block level, with instruction lists inside blocks. Instruction-level graphs make analyses simpler to write (no per-block transfer composition) and are fine for intraprocedural analyses on Java methods, which are small; block-level graphs are more memory efficient and faster for large functions. Interview answer: same information, different granularity; the leader algorithm converts one to the other."
        ]
      },
      {
        h: "Lowering design choices that affect analysis",
        p: [
          "<ul><li><b>Temporaries</b>: fresh temporaries for every subexpression make def-use trivial but create many variables; copy propagation cleans them up later.</li><li><b>Evaluation order</b>: lowering fixes it. Java specifies left-to-right; C leaves much of it unspecified, and the lowered order is one legal choice.</li><li><b>Desugaring</b>: enhanced for loops become iterator calls, string concatenation becomes <code>StringBuilder</code> or <code>invokedynamic</code> (<code>makeConcatWithConstants</code>, Java 9+), lambdas become <code>invokedynamic</code> plus a synthetic method. An analysis on lowered code must know these patterns.</li><li><b>Exceptions</b>: <code>finally</code> is duplicated by javac onto each exit path (normal, each return, exceptional), so one source block appears several times in bytecode.</li><li><b>Structured vs unstructured</b>: some IRs keep structure (MLIR <code>scf.if</code>, WebAssembly blocks), which simplifies some analyses but must eventually be lowered to a flat CFG.</li></ul>"
        ]
      },
      {
        h: "Irreducible control flow",
        p: [
          "A CFG is reducible if every retreating edge is a back edge (its target dominates its source); equivalently, every loop has a single entry. Structured Java and Python code always gives reducible CFGs. <code>goto</code> in C, some compiler transformations, and hand-written bytecode can create loops with two entries, which break assumptions of interval-based analyses and some loop optimizations. Handling: node splitting (duplicate code to make the graph reducible) or algorithms that do not need reducibility (iterative worklist dataflow works on any CFG, just possibly with more iterations)."
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: "Nami Turns Luffy's Plan Into Steering Orders",
      text: [
        "Luffy's plan is a nested sentence: \"Sail around the storm and, if the Marines are there and they have a Buster Call, run; otherwise fight, and keep circling the island until we find Zoro.\" Nobody can steer the Sunny from that. Nami rewrites it as numbered orders, each doing one thing: \"1. Turn port. 2. Check for Marines; if none, skip to 5. 3. Check for a Buster Call; if none, skip to 5. 4. Run, go to 8. 5. Fight. 6. Look for Zoro; if found, go to 8. 7. Go back to 6.\" That is lowering to three-address code with jumps, and checking the Buster Call only after seeing Marines is short-circuit evaluation.",
        "Then she groups the orders into stretches that always run straight through once started (basic blocks): an order that someone jumps to starts a new stretch, and so does the order right after any jump. Drawing arrows between stretches gives her the CFG pinned to the chart table. The arrow from \"look for Zoro\" back to itself is a back edge: a loop."
      ]
    },
    sitcom: {
      show: "Friends",
      title: "Monica's Thanksgiving Run Sheet",
      text: [
        "Monica cannot cook from Rachel's recipe, which is one giant sentence with nested conditions. She rewrites it on index cards, one action each, with \"if the turkey is not done, go back to card 7\". Then she clips cards into stacks that are always done together: any card someone might jump to starts a new stack, and so does the card after a jump. Chandler points out that one stack (\"make the trifle with beef\") has no arrow pointing to it from anywhere and can be thrown away: an unreachable block."
      ]
    },
    why: "Lowering is rewriting a nested plan into one-action steps with explicit jumps; basic blocks are the stacks of steps that always run together; the CFG is the arrows between them. Short-circuit evaluation (only check for a Buster Call if there are Marines) becomes extra branches, and a block with no incoming arrow is dead code."
  },
  storyAnim: {
    h: 240,
    props: [
      { id: "plan", emoji: "🗣️", label: "nested plan (AST)", x: 8, y: 20 },
      { id: "tac", emoji: "📝", label: "numbered orders (TAC)", x: 30, y: 20, cls: "off" },
      { id: "b0", emoji: "🟦", label: "B0: turn port", x: 54, y: 15, cls: "off" },
      { id: "b1", emoji: "🟦", label: "B1: marines?", x: 54, y: 45, cls: "off" },
      { id: "b2", emoji: "🟦", label: "B2: buster call?", x: 76, y: 30, cls: "off" },
      { id: "b3", emoji: "🟦", label: "B3: fight / find Zoro", x: 76, y: 70, cls: "off" },
      { id: "loop", emoji: "🔁", label: "back edge", x: 92, y: 85, cls: "off" }
    ],
    actors: [
      { id: "nami", emoji: "🧭", label: "Nami", x: 18, y: 60 }
    ],
    steps: [
      { c: "Luffy's plan is a nested tree of conditions and actions. It cannot be executed step by step as is.", p: { plan: "lit" } },
      { c: "Nami lowers it: one action per order, temporaries for intermediate checks, explicit 'skip to N' jumps.", a: { nami: [30, 50] }, p: { tac: "lit" } },
      { c: "The 'and' becomes two separate checks: the Buster Call check only runs when Marines were seen (jumping code).", p: { tac: "good" } },
      { c: "Leaders: the first order, every jump target, and every order right after a jump. Block B0 is the opening turn.", a: { nami: [48, 30] }, p: { b0: "lit" } },
      { c: "B1 ends in a conditional jump, so it gets two successors: B2 (fall through) and B3 (jump).", p: { b1: "lit", b2: "lit", b3: "lit" } },
      { c: "Edges come from jump targets plus fall-through when a block does not end in an unconditional jump.", a: { nami: [66, 55] } },
      { c: "The 'keep circling until we find Zoro' jump goes back to an earlier block: a back edge, so this part is a loop.", p: { loop: "bad", b3: "good" } }
    ]
  },
  conceptFlow: {
    title: "From AST to CFG",
    intro: "Each column consumes the previous one. Click a node to jump to its step.",
    stages: [
      { label: "AST", nodes: [ { id: "ast", text: "while / if / assign" } ] },
      { label: "Lowering", nodes: [ { id: "expr", text: "expressions ->\ntemporaries" }, { id: "jumps", text: "statements ->\nlabels + jumps" }, { id: "sc", text: "and / or ->\njumping code" } ] },
      { label: "Blocks", nodes: [ { id: "lead", text: "leaders" }, { id: "blocks", text: "basic blocks" } ] },
      { label: "CFG", nodes: [ { id: "edges", text: "jump + fall-through\nedges" }, { id: "back", text: "back edges /\nloops" }, { id: "dead", text: "unreachable\nblocks" } ] }
    ],
    steps: [
      { active: ["ast"], note: "Start from a tree with nested expressions and structured statements." },
      { active: ["expr"], note: "Post-order walk of expressions: each operator gets one instruction and a fresh temporary." },
      { active: ["jumps"], note: "if/while become ifFalse jumps, gotos and labels; break/continue use a stack of loop labels." },
      { active: ["sc"], note: "Short-circuit conditions emit jumps directly, so the right operand runs only when needed." },
      { active: ["lead"], note: "Leaders: first instruction, every jump target, every instruction after a jump or return." },
      { active: ["blocks"], note: "A block spans from a leader to just before the next one: single entry, single exit." },
      { active: ["edges"], note: "Edges: to the jump target, plus to the next block when the last instruction can fall through." },
      { active: ["back", "dead"], note: "Back edges (to a dominating header) identify loops; blocks unreachable from entry are dead code." }
    ]
  },
  tech: [
    {
      q: "Why is it called three-address code if a call can have many arguments?",
      a: [
        "The name describes the arithmetic core (<code>x = y op z</code> names three addresses). Calls are traditionally split into <code>param</code> instructions followed by <code>call f, n</code>, each of which has at most three addresses. Modern IRs relax this: Jimple and LLVM IR write <code>staticinvoke &lt;C: int f(int,int)&gt;(a, b)</code> or <code>call i32 @f(i32 %a, i32 %b)</code> as one instruction, but keep the essential property that arguments are already simple operands (variables or constants), never nested expressions."
      ]
    },
    {
      q: "Why must a label start a new basic block even if nothing jumps to it?",
      a: [
        "Strictly, only actual jump targets must be leaders; an unused label could be merged into the previous block. Simple implementations treat every label as a leader because it is cheap and safe, and a later pass merges a block into its predecessor when the predecessor has one successor and the block has one predecessor. Soot's Jimple printer, for instance, only prints labels that are targets, so there every label is a real leader."
      ]
    },
    {
      q: "How do I see basic blocks in real tools?",
      a: [
        "<ul><li>CPython: <code>python3 -m dis file.py</code>; lines marked <code>&gt;&gt;</code> are jump targets (leaders).</li><li>LLVM: <code>clang -S -emit-llvm -O0 f.c</code> then <code>opt -passes=dot-cfg -disable-output f.ll</code> writes <code>.dot</code> files per function; render with <code>dot -Tpng</code>.</li><li>Soot: <code>soot.Main -cp . -pp -f J</code> for Jimple text, or <code>-dump-cfg ALL</code> for CFG dot files per phase; in code, <code>new ExceptionalUnitGraph(body)</code> or <code>new ExceptionalBlockGraph(body)</code>.</li><li>SootUp: <code>method.getBody().getStmtGraph()</code>, with <code>successors(stmt)</code> and <code>getBlocks()</code>.</li><li>GCC: <code>-fdump-tree-cfg</code> writes the GIMPLE CFG.</li></ul>"
      ]
    },
    {
      q: "What are ENTRY and EXIT nodes for, if the first block is already the entry?",
      a: [
        "Uniformity. If the first block is also a loop header, it has predecessors, which some algorithms (dominators, dataflow initialization) do not expect for the start node. A separate ENTRY with no predecessors avoids special cases. EXIT gives backward analyses (liveness) a single start node even when a function has many returns or throws, and it is needed for post-dominators."
      ]
    }
  ],
  code: {
    title: "Lower a Python subset to TAC, then build basic blocks and a CFG",
    intro: "Uses Python's <code>ast</code> as the front end. Handles assignment, augmented assignment, <code>if/else</code>, <code>while</code>, <code>return</code>, arithmetic and comparisons. Run <code>python3 lower.py</code>; the output includes a Graphviz <code>digraph</code> you can render with <code>dot -Tpng</code>.",
    code: String.raw`"""Lower a Python subset (assign / if / while / return) to three-address code, then build basic blocks + CFG."""
import ast

class Lowerer:
    def __init__(self):
        self.code, self.ntemp, self.nlabel = [], 0, 0

    def temp(self):
        self.ntemp += 1
        return f"t{self.ntemp}"

    def label(self):
        self.nlabel += 1
        return f"L{self.nlabel}"

    def emit(self, *ins):
        self.code.append(ins)

    # ---- expressions return an operand (name, constant or temp) ----
    OPS = {ast.Add: "+", ast.Sub: "-", ast.Mult: "*", ast.FloorDiv: "//", ast.Mod: "%",
           ast.Lt: "<", ast.LtE: "<=", ast.Gt: ">", ast.GtE: ">=", ast.Eq: "==", ast.NotEq: "!="}

    def expr(self, e):
        if isinstance(e, ast.Constant):
            return repr(e.value)
        if isinstance(e, ast.Name):
            return e.id
        if isinstance(e, ast.BinOp):
            a, b = self.expr(e.left), self.expr(e.right)
            t = self.temp(); self.emit("binop", t, a, self.OPS[type(e.op)], b); return t
        if isinstance(e, ast.Compare) and len(e.ops) == 1:
            a, b = self.expr(e.left), self.expr(e.comparators[0])
            t = self.temp(); self.emit("binop", t, a, self.OPS[type(e.ops[0])], b); return t
        raise NotImplementedError(ast.dump(e))

    # ---- statements ----
    def stmt(self, s):
        if isinstance(s, ast.Assign):
            self.emit("copy", s.targets[0].id, self.expr(s.value))
        elif isinstance(s, ast.AugAssign):
            t = self.temp()
            self.emit("binop", t, s.target.id, self.OPS[type(s.op)], self.expr(s.value))
            self.emit("copy", s.target.id, t)
        elif isinstance(s, ast.If):
            l_else, l_end = self.label(), self.label()
            self.emit("iffalse", self.expr(s.test), l_else)
            for b in s.body: self.stmt(b)
            self.emit("goto", l_end)
            self.emit("label", l_else)
            for b in s.orelse: self.stmt(b)
            self.emit("label", l_end)
        elif isinstance(s, ast.While):
            l_top, l_end = self.label(), self.label()
            self.emit("label", l_top)
            self.emit("iffalse", self.expr(s.test), l_end)
            for b in s.body: self.stmt(b)
            self.emit("goto", l_top)
            self.emit("label", l_end)
        elif isinstance(s, ast.Return):
            self.emit("return", self.expr(s.value))
        else:
            raise NotImplementedError(ast.dump(s))

def fmt(ins):
    op = ins[0]
    if op == "binop": return f"{ins[1]} = {ins[2]} {ins[3]} {ins[4]}"
    if op == "copy": return f"{ins[1]} = {ins[2]}"
    if op == "iffalse": return f"ifFalse {ins[1]} goto {ins[2]}"
    if op == "goto": return f"goto {ins[1]}"
    if op == "label": return f"{ins[1]}:"
    return f"return {ins[1]}"

def basic_blocks(code):
    # Leaders: (1) first instruction, (2) any jump target, (3) instruction after a jump/return.
    leaders = {0}
    for i, ins in enumerate(code):
        if ins[0] == "label":
            leaders.add(i)
        if ins[0] in ("goto", "iffalse", "return") and i + 1 < len(code):
            leaders.add(i + 1)
    starts = sorted(leaders)
    blocks = [code[s:e] for s, e in zip(starts, starts[1:] + [len(code)])]
    blocks = [b for b in blocks if b]
    label_to_block = {b[0][1]: i for i, b in enumerate(blocks) if b[0][0] == "label"}
    succ = {}
    for i, b in enumerate(blocks):
        last = b[-1]
        if last[0] == "goto":
            succ[i] = [label_to_block[last[1]]]
        elif last[0] == "iffalse":
            succ[i] = [i + 1, label_to_block[last[2]]]       # fall-through (true), jump (false)
        elif last[0] == "return":
            succ[i] = []
        else:
            succ[i] = [i + 1] if i + 1 < len(blocks) else []
    return blocks, succ

SRC = """
def gcd_sum(a, b, n):
    s = 0
    while b != 0:
        t = a % b
        a = b
        b = t
    if a > n:
        s = a * 2
    else:
        s = a + n
    return s
"""

fn = ast.parse(SRC).body[0]
low = Lowerer()
for st in fn.body:
    low.stmt(st)
for ins in low.code:
    print("   " + fmt(ins) if ins[0] != "label" else fmt(ins))

blocks, succ = basic_blocks(low.code)
print()
for i, b in enumerate(blocks):
    print(f"B{i}: {' ; '.join(fmt(x) for x in b)}  ->  {['B%d' % s for s in succ[i]]}")

print("\ndigraph cfg {")
for i, ss in succ.items():
    for s in ss:
        print(f"  B{i} -> B{s};")
print("}")

# Output (TAC, then blocks):
#    s = 0
# L1:
#    t1 = b != 0
#    ifFalse t1 goto L2
#    t2 = a % b
#    t = t2
#    a = b
#    b = t
#    goto L1
# L2:
#    t3 = a > n
#    ifFalse t3 goto L3
#    t4 = a * 2
#    s = t4
#    goto L4
# L3:
#    t5 = a + n
#    s = t5
# L4:
#    return s
#
# B0: s = 0  ->  ['B1']
# B1: L1: ; t1 = b != 0 ; ifFalse t1 goto L2  ->  ['B2', 'B3']
# B2: t2 = a % b ; t = t2 ; a = b ; b = t ; goto L1  ->  ['B1']
# B3: L2: ; t3 = a > n ; ifFalse t3 goto L3  ->  ['B4', 'B5']
# B4: t4 = a * 2 ; s = t4 ; goto L4  ->  ['B6']
# B5: L3: ; t5 = a + n ; s = t5  ->  ['B6']
# B6: L4: ; return s  ->  []`,
    notes: [
      "B2 → B1 is the back edge of the <code>while</code> loop; B1 is the loop header. B3 is reached only when the loop exits.",
      "The lowering creates copies such as <code>t = t2</code> and <code>s = t4</code>; a copy-propagation pass would remove them. Real lowerers often target the variable directly when the expression is the whole right-hand side.",
      "Extend it: add <code>ast.BoolOp</code> handling with jumping code (a <code>cond(e, Ltrue, Lfalse)</code> method), and <code>break</code>/<code>continue</code> with a stack of <code>(l_top, l_end)</code> labels.",
      "Render the graph: <code>python3 lower.py | sed -n '/digraph/,$p' &gt; cfg.dot && dot -Tpng cfg.dot -o cfg.png</code>."
    ]
  },
  lab: {
    title: "Leaders, basic blocks and CFG edges from textual TAC",
    prompt: "Given TAC as a list of strings (labels end with <code>:</code>, jumps end with <code>goto LABEL</code>, conditional jumps start with <code>if </code>), implement <code>find_leaders(code)</code> returning sorted leader indices and <code>build_cfg(code)</code> returning <code>(blocks, succ)</code> where <code>succ[i]</code> lists the successor block indices. Rules: the first instruction, every label, and every instruction after a jump or <code>return</code> are leaders. Edges: to the jump target's block, plus fall-through to the next block if the last instruction is a conditional jump or not a jump or return at all. The assert at the bottom must pass.",
    starter: String.raw`import re

TAC = [
    "i = 0",
    "s = 0",
    "L1:",
    "if i >= n goto L3",
    "t1 = i % 2",
    "if t1 == 0 goto L2",
    "s = s + i",
    "L2:",
    "i = i + 1",
    "goto L1",
    "L3:",
    "return s",
]

def is_label(ins):
    return ins.endswith(":")

def jump_target(ins):
    m = re.search(r"goto (\w+)$", ins)
    return m.group(1) if m else None

# TODO: find_leaders(code) and build_cfg(code)

blocks, succ = build_cfg(TAC)
for i, b in enumerate(blocks):
    print("B" + str(i), b, "->", succ[i])
assert {k: sorted(v) for k, v in succ.items()} == {0: [1], 1: [2, 5], 2: [3, 4], 3: [4], 4: [1], 5: []}
print("CFG ok")
`,
    checks: [
      { re: 'def\\s+find_leaders\\s*\\(\\s*code\\s*\\)', flags: '', must: true, hint: "Define find_leaders(code).", pass: "find_leaders ✓" },
      { re: 'leaders\\s*=\\s*\\{\\s*0\\s*\\}', flags: '', must: true, hint: "The first instruction (index 0) is always a leader: leaders = {0}.", pass: "First instruction ✓" },
      { re: 'is_label\\(\\s*ins\\s*\\)[\\s\\S]*leaders\\.add\\(\\s*i\\s*\\)', flags: '', must: true, hint: "Every label is a leader: if is_label(ins): leaders.add(i).", pass: "Jump targets ✓" },
      { re: 'leaders\\.add\\(\\s*i\\s*\\+\\s*1\\s*\\)', flags: '', must: true, hint: "The instruction after a jump or return is a leader: leaders.add(i + 1).", pass: "After-jump leaders ✓" },
      { re: 'def\\s+build_cfg\\s*\\(\\s*code\\s*\\)', flags: '', must: true, hint: "Define build_cfg(code).", pass: "build_cfg ✓" },
      { re: 'startswith\\(\\s*"if "\\s*\\)', flags: '', must: true, hint: "A conditional jump (startswith(\"if \")) has both a jump edge and a fall-through edge.", pass: "Conditional fall-through ✓" },
      { re: 'i\\s*\\+\\s*1\\s*<\\s*len\\(\\s*blocks\\s*\\)', flags: '', must: true, hint: "Only add a fall-through edge if a next block exists: i + 1 < len(blocks).", pass: "Fall-through bounds ✓" }
    ],
    run: "Save as <code>cfg_lab.py</code> and run <code>python3 cfg_lab.py</code>. Expected six blocks, ending with <code>CFG ok</code>: B0 <code>[i = 0, s = 0]</code> → B1; B1 <code>[L1:, if i &gt;= n goto L3]</code> → B5, B2; B2 <code>[t1 = i % 2, if t1 == 0 goto L2]</code> → B4, B3; B3 <code>[s = s + i]</code> → B4; B4 <code>[L2:, i = i + 1, goto L1]</code> → B1; B5 <code>[L3:, return s]</code>. Then identify the back edge (B4 → B1) and check that B1 dominates B4.",
    solution: String.raw`import re

TAC = [
    "i = 0",
    "s = 0",
    "L1:",
    "if i >= n goto L3",
    "t1 = i % 2",
    "if t1 == 0 goto L2",
    "s = s + i",
    "L2:",
    "i = i + 1",
    "goto L1",
    "L3:",
    "return s",
]

def is_label(ins):
    return ins.endswith(":")

def jump_target(ins):
    m = re.search(r"goto (\w+)$", ins)
    return m.group(1) if m else None

def find_leaders(code):
    leaders = {0}
    for i, ins in enumerate(code):
        if is_label(ins):
            leaders.add(i)
        if (jump_target(ins) or ins.startswith("return")) and i + 1 < len(code):
            leaders.add(i + 1)
    return sorted(leaders)

def build_cfg(code):
    starts = find_leaders(code)
    blocks = [code[s:e] for s, e in zip(starts, starts[1:] + [len(code)])]
    where = {b[0][:-1]: i for i, b in enumerate(blocks) if is_label(b[0])}
    succ = {}
    for i, b in enumerate(blocks):
        last = b[-1]
        target = jump_target(last)
        edges = []
        if target:
            edges.append(where[target])
        if last.startswith("if ") or not (target or last.startswith("return")):
            if i + 1 < len(blocks):
                edges.append(i + 1)
        succ[i] = edges
    return blocks, succ

blocks, succ = build_cfg(TAC)
for i, b in enumerate(blocks):
    print("B" + str(i), b, "->", succ[i])
assert {k: sorted(v) for k, v in succ.items()} == {0: [1], 1: [2, 5], 2: [3, 4], 3: [4], 4: [1], 5: []}
print("CFG ok")
`,
    notes: [
      "Note B3 → B4 is a fall-through edge into a labeled block: B3 has no jump at all, so control simply continues. Forgetting fall-through edges is the most common CFG bug.",
      "B2 → B4 is a critical edge: B2 has two successors (B3, B4) and B4 has two predecessors (B2, B3). Splitting it would insert an empty block between them.",
      "The assert compares sorted successor lists because successor order (jump first vs fall-through first) is a convention, not part of the graph."
    ]
  },
  quiz: [
    {
      q: "Which instruction is NOT a leader under the standard algorithm?",
      options: ["The first instruction", "The target of a goto", "The instruction right after a conditional jump", "The instruction right before a jump"],
      correct: 3,
      explain: "Leaders are the first instruction, jump targets and instructions following jumps. The instruction before a jump ends a block, it does not start one."
    },
    {
      q: "How many CFG successors does a block ending in <code>if x &lt; y goto L5</code> have?",
      options: ["0", "1", "2: the jump target and the fall-through block", "It depends on x and y at run time"],
      correct: 2,
      explain: "The CFG is static: both outcomes are possible paths."
    },
    {
      q: "Why are <code>&amp;&amp;</code>/<code>and</code> conditions lowered to jumping code?",
      options: ["To make code shorter", "To preserve short-circuit semantics: the right operand must not execute when the left decides the result", "Because TAC has no boolean type", "To avoid temporaries"],
      correct: 1,
      explain: "Evaluating both sides could call functions with side effects or crash (<code>p != null &amp;&amp; p.x &gt; 0</code>)."
    },
    {
      q: "An edge from B (2 successors) to C (2 predecessors) is called:",
      options: ["A back edge", "A critical edge", "A fall-through edge", "An exceptional edge"],
      correct: 1,
      explain: "Critical edges must be split before inserting code on the edge, such as copies during SSA destruction."
    },
    {
      q: "Soot offers <code>BriefUnitGraph</code> and <code>ExceptionalUnitGraph</code>. What is the difference?",
      options: ["Brief is block level, Exceptional is statement level", "Exceptional adds edges from statements that may throw to their handlers; Brief ignores exceptional control flow", "Brief is SSA", "There is none"],
      correct: 1,
      explain: "Without exceptional edges, catch blocks look unreachable and facts flowing into them are wrong."
    }
  ],
  testFlow: {
    title: "CFG construction checks",
    start: "q1",
    nodes: {
      q1: { q: "Block B3 is <code>s = s + i</code> with no jump, followed by block B4 starting with label L2. Edge B3 → B4?", choices: [ { text: "Yes, fall-through", to: "q1ok" }, { text: "No, there is no goto", to: "q1bad" } ] },
      q1ok: { end: true, correct: true, text: "Right. A block that does not end in an unconditional jump or return falls through to the next block.", next: "q2" },
      q1bad: { end: true, correct: false, text: "Control continues to the next instruction when there is no jump, so there is a fall-through edge.", retry: "q1" },
      q2: { q: "You lower <code>while c: body</code> and get edges header → body, body → header, header → exit. Which is the back edge?", choices: [ { text: "body → header", to: "q2ok" }, { text: "header → exit", to: "q2bad" } ] },
      q2ok: { end: true, correct: true, text: "Yes: its target (header) dominates its source (body).", next: "q3" },
      q2bad: { end: true, correct: false, text: "header → exit leaves the loop. The back edge returns to the dominating header.", retry: "q2" },
      q3: { q: "A def in a try block is used in the catch block. Your reaching-definitions analysis says nothing reaches the catch. Likely cause?", choices: [ { text: "The CFG lacks exceptional edges", to: "q3ok" }, { text: "The leader algorithm is wrong", to: "q3bad" } ] },
      q3ok: { end: true, correct: true, text: "Correct. Use an exceptional CFG (e.g. Soot's ExceptionalUnitGraph)." },
      q3bad: { end: true, correct: false, text: "The handler is only reachable through implicit exception edges; without them it looks unreachable.", retry: "q3" }
    }
  },
  pitfalls: [
    "Forgetting fall-through edges: a block that ends without a jump still has a successor.",
    "Lowering <code>and</code>/<code>or</code> by computing both operands, which changes semantics when the right side has effects or can fail.",
    "Ignoring exceptional control flow, so catch/finally blocks appear unreachable and facts in them are wrong.",
    "Mapping IR blocks one to one onto source statements: desugaring, duplicated finally blocks and inverted loop tests break that mapping. Use line-number tables.",
    "Assuming every loop has a single entry; hand-written or obfuscated bytecode can be irreducible."
  ],
  interview: [
    {
      q: "Define a basic block and give the algorithm to find them.",
      a: "A maximal straight-line sequence with a single entry at the top and a single exit at the bottom: if the first instruction executes, all execute in order. Leaders: the first instruction, every jump target, every instruction right after a jump or return. Each block runs from a leader to just before the next leader. Then add edges for jumps and for fall-through when the last instruction is not an unconditional jump or return. It is linear in the number of instructions."
    },
    {
      q: "Lower <code>while (i &lt; n &amp;&amp; a[i] != 0) i++;</code> to three-address code.",
      a: "<code>Ltop: if i &gt;= n goto Lend; t1 = a[i]; if t1 == 0 goto Lend; i = i + 1; goto Ltop; Lend:</code>. The condition becomes jumping code: the array read only happens when <code>i &lt; n</code>, preserving short-circuit semantics (and avoiding an out-of-bounds access). Blocks: [Ltop, test1], [t1 = a[i], test2], [i = i + 1, goto], [Lend...]; the goto back to Ltop is the back edge."
    },
    {
      q: "Explain a tradeoff: stack-based bytecode versus three-address code as an analysis IR.",
      a: "Stack bytecode (JVM, CPython) is compact, easy to generate and quick to interpret, but operands are implicit on the stack, so an analysis must simulate stack heights and types to know what each instruction reads and writes. Three-address code names every value, making def-use chains, dataflow and pattern matching direct, at the cost of more instructions and many temporaries. That is why analysis frameworks convert: Soot turns bytecode into Jimple, WALA into its SSA IR, and the JVM's own JIT builds an SSA graph from bytecode."
    },
    {
      q: "What is a critical edge and why do compilers split them?",
      a: "An edge from a block with multiple successors to a block with multiple predecessors. You cannot put code \"on\" such an edge by appending to the source block (it would run on the other outgoing paths too) or prepending to the target (it would run for the other incoming paths). Splitting inserts a new empty block on the edge. SSA destruction needs it to place copies for phi functions, as do partial redundancy elimination and some register allocators."
    },
    {
      q: "Whiteboard: design the CFG data structure for an intraprocedural analysis framework for Java.",
      a: "Nodes are statements (or blocks) of a typed TAC like Jimple; each node stores its statement, a list of normal successors and predecessors, and separately its exceptional successors with the caught exception type. Provide unique entry and exit, reverse postorder iteration, and maps from statements to source lines. Build from bytecode via lifting (Soot/SootUp) rather than from source to get desugaring right. Expose both exceptional and non-exceptional views, since many analyses want to ignore implicit exceptions like NullPointerException edges for precision. Cache dominator trees and loop nests lazily."
    },
    {
      q: "How do you find loops in a CFG?",
      a: "Compute dominators, then find back edges B → H where H dominates B. For each back edge, the natural loop is H plus every block that can reach B without passing through H (backward search from B stopping at H). Loops with the same header are merged; nesting follows from containment. In reducible graphs, DFS retreating edges are exactly the back edges, so a DFS plus dominance check suffices."
    }
  ]
};
