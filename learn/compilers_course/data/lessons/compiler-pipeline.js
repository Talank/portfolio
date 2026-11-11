window.LESSONS = window.LESSONS || {};
window.LESSONS['compiler-pipeline'] = {
  id: 'compiler-pipeline',
  title: "The Compiler Pipeline: Source → Tokens → AST → IR → Machine Code",
  category: "Part 0 — The Compiler Pipeline",
  timeMin: 30,
  summary: "Every compiler, interpreter, linter and static analyzer is a chain of representation changes: characters become tokens, tokens become a tree, the tree becomes an intermediate representation (IR), and the IR becomes something executable. This lesson maps that chain end to end, names the artifact each phase produces and consumes, and shows where program-analysis tools (linters, SpotBugs, Soot, CodeQL, Infer) plug into it. You will build a complete toy pipeline in about 100 lines of Python and then watch CPython's real pipeline do the same thing with <code>tokenize</code>, <code>ast</code>, <code>compile</code> and <code>dis</code>.",
  goals: [
    "Name each compiler phase (lexing, parsing, semantic analysis, lowering, optimization, code generation) and the data structure it produces",
    "Explain the difference between a token stream, a parse tree (CST) and an abstract syntax tree (AST)",
    "Explain why compilers use an IR at all (the M front ends × N back ends argument) and give real examples: JVM bytecode, Jimple, LLVM IR, GIMPLE",
    "Decide which representation a given analysis should run on (AST for style rules, IR for dataflow, bytecode for library code without source)",
    "Drive CPython's own pipeline from Python: tokenize → ast.parse → compile → dis → exec"
  ],
  concept: [
    {
      h: "One chain of representations",
      p: [
        "A compiler is easiest to understand as a sequence of <b>translations between data structures</b>, each one throwing away detail the next phase does not need and adding structure it does:",
        "<table><tr><th>Phase</th><th>Input</th><th>Output</th><th>Typical failure it reports</th></tr><tr><td>Lexing (scanning)</td><td>characters</td><td>tokens: <code>(kind, text, position)</code></td><td>illegal character, unterminated string</td></tr><tr><td>Parsing</td><td>tokens</td><td>parse tree / AST</td><td>syntax error: <code>expected ')'</code></td></tr><tr><td>Semantic analysis</td><td>AST</td><td>AST + symbol tables + types (an attributed/decorated AST)</td><td>undefined variable, type mismatch, missing return</td></tr><tr><td>Lowering (IR generation)</td><td>typed AST</td><td>IR: three-address code, SSA, bytecode</td><td>(rare: internal limits)</td></tr><tr><td>Optimization</td><td>IR</td><td>better IR</td><td>none; must preserve semantics</td></tr><tr><td>Code generation</td><td>IR</td><td>machine code / bytecode / another language</td><td>none for the user</td></tr></table>",
        "The first three phases are the <b>front end</b> (language-specific), optimization is the <b>middle end</b> (language- and machine-independent), and code generation is the <b>back end</b> (machine-specific). Program analysis tools are mostly front ends plus a middle end with no back end: they stop after building a representation and analyze it instead of emitting code."
      ]
    },
    {
      h: "Tokens, parse trees and ASTs",
      p: [
        "The <b>lexer</b> groups characters into tokens using regular languages (identifiers, numbers, operators, keywords) and discards whitespace and comments (unless it is a formatter or a refactoring tool, which must keep them as \"trivia\"). In <code>total = price * qty + 1</code> it produces <code>NAME total</code>, <code>OP =</code>, <code>NAME price</code>, <code>OP *</code>, and so on.",
        "The <b>parser</b> checks the tokens against a context-free grammar. A <b>parse tree</b> (concrete syntax tree, CST) has one node per grammar rule application, including parentheses, commas and keywords. An <b>AST</b> keeps only the meaning: <code>(1 + 2) * 3</code> becomes <code>Mult(Add(1, 2), 3)</code>; the parentheses vanish because the tree shape already encodes grouping. Python's <code>ast</code> module, JavaParser and Eclipse JDT give you ASTs; tree-sitter and srcML give you something much closer to a CST that preserves every character.",
        "Every node carries a <b>source position</b> (line, column, sometimes end position). Losing positions is the most common way to make a tool useless: a warning without a line number is not actionable."
      ],
      code: String.raw`>>> import ast
>>> print(ast.dump(ast.parse("(1 + 2) * 3", mode="eval").body))
BinOp(left=BinOp(left=Constant(value=1), op=Add(), right=Constant(value=2)), op=Mult(), right=Constant(value=3))`
    },
    {
      h: "Semantic analysis: names, scopes and types",
      p: [
        "A syntactically valid program can still be meaningless: <code>x = y + 1</code> where <code>y</code> was never declared, or <code>int n = \"hello\";</code> in Java. The semantic phase walks the AST, builds <b>symbol tables</b> (one per scope: package, class, method, block), resolves every identifier use to its declaration, computes types, and checks rules like definite assignment.",
        "For analysis tools this is the expensive and valuable step. A raw AST says <code>log.add(x)</code>; only after name and type resolution do you know it calls <code>java.util.List.add(E)</code>. JavaParser needs its symbol solver configured for this; Eclipse JDT needs <code>setResolveBindings(true)</code> plus a classpath; srcML and tree-sitter never do it at all. Knowing which tools stop before this phase is an interview-grade distinction."
      ]
    },
    {
      h: "Why an intermediate representation?",
      p: [
        "If you have M source languages and N target machines, compiling each language directly to each machine needs M×N compilers. With a shared IR you need M front ends and N back ends, and every optimization written once on the IR benefits all of them. This is the design of LLVM (C, C++, Rust, Swift, Zig front ends → LLVM IR → x86, ARM, RISC-V, WebAssembly) and of GCC (GENERIC → GIMPLE → RTL).",
        "An IR is also simply easier to analyze than an AST. Nested expressions are flattened into <b>three-address code</b> (<code>t1 = price * qty; total = t1 + 1</code>), structured control flow (<code>for</code>, <code>while</code>, <code>try</code>, <code>switch</code>, short-circuit <code>&&</code>) becomes explicit jumps, so a dataflow analysis needs only a handful of statement kinds instead of the 100+ node types of a Java AST.",
        "Real IRs you will meet: <b>JVM bytecode</b> (stack-based, what javac emits), <b>Jimple</b> (Soot's typed three-address code built from bytecode), <b>LLVM IR</b> (typed, SSA, register-based), <b>GIMPLE</b> (GCC's three-address tree IR), <b>CPython bytecode</b> (stack-based), <b>Infer's SIL</b>, and <b>MLIR</b> (a framework for building many levels of IR, used by TensorFlow and others)."
      ]
    },
    {
      h: "Optimization and code generation in one paragraph each",
      p: [
        "The middle end runs <b>passes</b> over the IR: constant folding and propagation, dead-code elimination, common-subexpression elimination, inlining, loop-invariant code motion. Every pass is a static analysis (prove a fact) followed by a transformation that is legal only because of that fact. That is why compiler courses and program-analysis courses share so much material.",
        "The back end does <b>instruction selection</b> (map IR operations to machine instructions, often by tree or DAG pattern matching), <b>register allocation</b> (map unboundedly many IR temporaries onto a few physical registers, classically by graph coloring or linear scan, spilling to the stack when they do not fit), and <b>instruction scheduling</b> (order instructions to avoid pipeline stalls)."
      ]
    },
    {
      h: "Where analysis tools plug into the pipeline",
      p: [
        "<ul><li><b>Token / text level</b>: grep, many secret scanners, formatters. Fast, no structure.</li><li><b>CST level</b>: tree-sitter (editors, GitHub code navigation), srcML (whole-repository queries with XPath). Error tolerant, every character kept, no types.</li><li><b>AST level</b>: Pylint, Ruff, ESLint, PMD, Error Prone (runs inside javac with full type attribution), Spoon, JavaParser. Ideal for style rules, API-misuse patterns and source-to-source refactoring.</li><li><b>IR / bytecode level</b>: SpotBugs (bytecode), Soot/SootUp (Jimple), WALA, FlowDroid, Infer (SIL), the LLVM static analyzer passes. Ideal for dataflow, call graphs, taint, and for analyzing libraries where only <code>.class</code> files exist.</li><li><b>Database level</b>: CodeQL hooks the real compiler during the build, extracts ASTs, types and control flow into a relational database, and you query it in a Datalog-like language.</li></ul>",
        "The rule of thumb: the closer to source, the better your error messages and fixes; the closer to IR, the simpler and more precise your semantic reasoning."
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: "Interviewers like to check that you know real pipelines, not just the textbook boxes. Here are the phases of three compilers you use every day, plus the design questions they raise.",
    sections: [
      {
        h: "javac, phase by phase",
        p: [
          "OpenJDK's <code>JavaCompiler</code> runs a work list through these states: <b>parse</b> (to <code>JCTree</code> ASTs), <b>enter</b> (create symbols for classes and members, fill scopes), <b>annotation processing</b> (which may generate new sources and loop back to parse), <b>attribute</b> (<code>Attr</code>: name resolution, type checking, constant folding), <b>flow</b> (<code>Flow</code>: definite assignment, reachability, checked exceptions), <b>desugar</b> (<code>TransTypes</code> erases generics, <code>Lower</code> rewrites inner classes, enhanced for loops, enum switches, string switches, lambdas via <code>LambdaToMethod</code>), and <b>generate</b> (<code>Gen</code> emits bytecode, <code>ClassWriter</code> writes <code>.class</code> files).",
          "Error Prone and the Checker Framework hook in as javac plugins after attribution, which is why they see fully typed trees. Lombok mutates the AST during annotation processing, which is why it is famously fragile across javac versions."
        ]
      },
      {
        h: "CPython and Clang/LLVM",
        p: [
          "CPython 3.9+ uses a PEG parser (PEP 617) that produces the AST directly; the old LL(1) parser built a CST first. Then <code>symtable</code> computes scopes (local, global, free, cell variables for closures), the compiler emits bytecode through an internal control-flow graph, a peephole optimizer and AST optimizer fold constants (<code>60*60*24</code> is stored as <code>86400</code>), and the evaluation loop interprets it. Bytecode is a CPython implementation detail and changes between minor versions (3.11 replaced <code>BINARY_ADD</code> etc. with a single <code>BINARY_OP</code>).",
          "Clang parses C/C++ into the Clang AST (with full semantic info; the Clang Static Analyzer and clang-tidy work here), lowers to LLVM IR, runs <code>opt</code> passes, then <code>llc</code> does instruction selection (SelectionDAG or GlobalISel), register allocation and emission via the MC layer. You can stop at any stage: <code>clang -fsyntax-only</code>, <code>clang -Xclang -ast-dump</code>, <code>clang -S -emit-llvm</code>, <code>clang -S</code>."
        ],
        code: String.raw`clang -Xclang -ast-dump -fsyntax-only max.c   # Clang AST
clang -S -emit-llvm -O0 max.c -o max.ll        # LLVM IR (unoptimized)
opt -S -passes=mem2reg max.ll -o max.ssa.ll   # run one IR pass
llc max.ssa.ll -o max.s                       # IR -> assembly`
      },
      {
        h: "Error tolerance, incrementality and language servers",
        p: [
          "A batch compiler can stop at the first syntax error. An IDE cannot: the code is broken most of the time you are typing. Editors therefore use error-recovering parsers (Roslyn, the JDT parser, tree-sitter) that insert <code>MISSING</code> or <code>ERROR</code> nodes and keep going, and they reparse incrementally, reusing unchanged subtrees. The Language Server Protocol moved this machinery out of editors into per-language servers (jdtls, pyright, rust-analyzer, clangd).",
          "For research tools the lesson is practical: if you need to analyze code that does not compile (old commits, partial snippets, LLM output), choose a tolerant parser (tree-sitter, srcML, JDT with recovery, Spoon in noclasspath mode) rather than one that requires a clean build (Soot, CodeQL, Error Prone)."
        ]
      },
      {
        h: "Interpreters, JITs and where the line blurs",
        p: [
          "An interpreter runs the front end and then executes an IR directly instead of generating machine code. A JIT (HotSpot C1/C2, Graal, V8, PyPy) interprets first, profiles, and compiles hot methods to machine code using runtime type feedback, deoptimizing when a speculation fails. So \"compiled vs interpreted\" describes an implementation, not a language: Java is compiled to bytecode ahead of time and JIT-compiled at run time; Python is compiled to bytecode and interpreted."
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: "Robin Reads a Poneglyph",
      text: [
        "When the crew finds a Poneglyph, Robin does not understand it in one glance. First she copies the carved strokes into distinct glyphs, ignoring cracks and moss: that is lexing. Then she groups glyphs into sentences following the grammar of the ancient script, and draws the sentence structure in her notebook, dropping decorative borders that carry no meaning: that is parsing to an AST.",
        "Next she checks what each name refers to: is \"Joy Boy\" a person, a place, a title? She cross-references her notes from other Poneglyphs, building a table of names: semantic analysis with a symbol table. Finally she rewrites the message as a plain list of simple instructions Nami can act on (sail to this island, find this marker, then go here): lowering to an IR. Nami turns those into actual headings and sail settings for the Sunny: code generation for one specific ship.",
        "When Franky later wants the same message for a different ship, Robin does not reread the stone. She hands over her plain instruction list, and Franky's crew converts it to their own vessel. One front end, many back ends."
      ]
    },
    sitcom: {
      show: "The Big Bang Theory",
      title: "Sheldon's Roommate Agreement Pipeline",
      text: [
        "Leonard emails Sheldon a request: \"can we move date night to Thursday??\". Sheldon first splits it into words and punctuation and objects to the double question mark (a lexical error). He then diagrams the sentence and confirms it is grammatical (parsing). Next he resolves every reference against the Roommate Agreement: \"date night\" maps to Section 10, Thursday is already bound to Anything Can Happen Thursday, a conflict (semantic error, caught before anything runs).",
        "After Leonard rephrases, Sheldon translates the approved change into a numbered list of atomic actions in his own internal notation (IR), which he can then render as a Google Calendar entry, a whiteboard update, or a formal addendum (three back ends from one IR)."
      ]
    },
    why: "Each step in both stories hands the next one a simpler, more explicit version of the message, and errors are caught at the earliest phase that can see them: bad characters at lexing, bad structure at parsing, bad meaning at semantic analysis. The shared instruction list that two ships (or three calendar formats) can consume is exactly the M front ends × N back ends argument for an IR."
  },
  storyAnim: {
    h: 240,
    props: [
      { id: "stone", emoji: "🗿", label: "Poneglyph (source)", x: 8, y: 45 },
      { id: "glyphs", emoji: "🔣", label: "glyphs (tokens)", x: 28, y: 20, cls: "off" },
      { id: "tree", emoji: "🌳", label: "sentence tree (AST)", x: 46, y: 45, cls: "off" },
      { id: "table", emoji: "📒", label: "name table", x: 46, y: 80, cls: "off" },
      { id: "list", emoji: "📜", label: "instruction list (IR)", x: 68, y: 20, cls: "off" },
      { id: "sunny", emoji: "⛵", label: "Sunny (x86)", x: 90, y: 30, cls: "off" },
      { id: "franky", emoji: "🚢", label: "Franky's ship (ARM)", x: 90, y: 75, cls: "off" }
    ],
    actors: [
      { id: "robin", emoji: "📚", label: "Robin", x: 14, y: 75 },
      { id: "nami", emoji: "🧭", label: "Nami", x: 78, y: 50 }
    ],
    steps: [
      { c: "The source is just carved characters on stone. Nothing has structure yet.", p: { stone: "lit" } },
      { c: "Robin lexes: strokes become a stream of glyph tokens; cracks and moss (whitespace, comments) are dropped.", a: { robin: [26, 45] }, p: { glyphs: "lit" } },
      { c: "She parses the glyphs against the grammar and draws the sentence tree; decorative borders (parentheses) disappear because the tree shape encodes grouping.", a: { robin: [42, 62] }, p: { tree: "lit", glyphs: "dim" } },
      { c: "Semantic analysis: every name is resolved against her table. An unknown name would be an error right here, before anything is executed.", p: { table: "lit" } },
      { c: "Lowering: the tree becomes a flat list of simple steps, one operation each. This is the IR.", a: { robin: [62, 45] }, p: { list: "lit", tree: "dim", table: "dim" } },
      { c: "Nami's code generation maps each IR step onto one concrete ship's controls.", a: { nami: [84, 32] }, p: { sunny: "good" } },
      { c: "Franky reuses the same IR for a different ship. Same front end, second back end: no need to reread the stone.", p: { franky: "good" }, l: { list: "shared IR" } }
    ]
  },
  conceptFlow: {
    title: "From characters to machine code",
    intro: "Click a box to see what that phase consumes, produces and rejects.",
    stages: [
      { label: "Front end", nodes: [ { id: "src", text: "Source text" }, { id: "lex", text: "Lexer\ntokens" }, { id: "parse", text: "Parser\nAST" }, { id: "sema", text: "Semantic analysis\nsymbols + types" } ] },
      { label: "Middle end", nodes: [ { id: "lower", text: "Lowering\nTAC / SSA IR" }, { id: "opt", text: "Optimization passes" } ] },
      { label: "Back end", nodes: [ { id: "isel", text: "Instruction selection" }, { id: "ra", text: "Register allocation" }, { id: "emit", text: "Machine code" } ] },
      { label: "Analysis tools", nodes: [ { id: "lint", text: "Linters\n(AST)" }, { id: "dfa", text: "Dataflow / taint\n(IR)" } ] }
    ],
    steps: [
      { active: ["src"], note: "The compiler starts with a flat string of characters, nothing more." },
      { active: ["src", "lex"], note: "The lexer applies regular-expression rules to produce tokens with positions, dropping whitespace and comments." },
      { active: ["lex", "parse"], note: "The parser checks tokens against a context-free grammar and builds an AST. Syntax errors are reported here." },
      { active: ["parse", "sema"], note: "Semantic analysis resolves names to declarations and computes types. Undefined names and type errors are reported here." },
      { active: ["sema", "lint"], note: "AST-level analyzers (Pylint, Ruff, PMD, Error Prone) stop around here and run pattern rules on the (typed) tree." },
      { active: ["sema", "lower"], note: "Lowering flattens nested expressions into three-address code and structured control flow into jumps between basic blocks." },
      { active: ["lower", "opt", "dfa"], note: "Optimizations and IR-level analyses (Soot, SpotBugs, FlowDroid, Infer) need only a few statement kinds and an explicit control-flow graph." },
      { active: ["opt", "isel", "ra", "emit"], note: "The back end selects instructions, allocates registers and emits machine code for one specific target." }
    ]
  },
  tech: [
    {
      q: "Is the lexer really separate from the parser in real compilers?",
      a: [
        "Usually, yes, because it keeps the grammar small and the lexer can be a fast DFA. But there are well-known exceptions where the parser must tell the lexer what to do. In C, <code>T * x;</code> is a declaration if <code>T</code> is a typedef and a multiplication otherwise (the \"lexer hack\": the lexer consults the symbol table). In Java, <code>&gt;&gt;</code> must be split into two <code>&gt;</code> tokens to close <code>List&lt;List&lt;String&gt;&gt;</code>. Python's tokenizer tracks indentation and emits synthetic <code>INDENT</code>/<code>DEDENT</code> tokens. Scannerless parsers (many PEG parsers) skip the separate lexer altogether."
      ]
    },
    {
      q: "What exactly does Python's compile() return, and can I hand it an AST?",
      a: [
        "<code>compile(source_or_ast, filename, mode)</code> accepts a string or an <code>ast.Module</code>/<code>ast.Expression</code> object and returns a <code>code</code> object: bytecode in <code>co_code</code>, constants in <code>co_consts</code>, names in <code>co_names</code>, local variable names in <code>co_varnames</code>, plus line tables. <code>exec</code> or <code>eval</code> runs it. Passing an AST is how AST-rewriting tools (pytest's assertion rewriting is the famous example) change program behavior without touching source files."
      ]
    },
    {
      q: "Why do bytecode-level analyzers work at all if they never see the source?",
      a: [
        "Because bytecode preserves almost all semantic information: class hierarchy, field and method signatures with full types, every call with its resolved owner and descriptor, exception tables, and, when compiled with <code>-g</code>, local variable names and line numbers. What is lost is syntax (comments, formatting, exact expression shapes) and some generic type information (erasure, though the <code>Signature</code> attribute keeps declared generics). That is enough for dataflow, call-graph and taint analyses, which is why SpotBugs and Soot work on JARs you do not have source for."
      ]
    },
    {
      q: "What is the difference between a pass, a phase and a pipeline in an optimizer?",
      a: [
        "A <b>pass</b> is one traversal that computes or transforms something (for example LLVM's <code>mem2reg</code>, <code>instcombine</code>, <code>gvn</code>). A <b>phase</b> is a group of passes with a shared purpose (Soot's packs such as <code>jb</code> body creation or <code>wjtp</code> whole-Jimple transformation). The <b>pipeline</b> is the ordered list run for an optimization level, such as LLVM's <code>default&lt;O2&gt;</code>. Order matters because passes enable each other: inlining exposes constants that constant propagation folds, which exposes dead branches that simplification removes."
      ]
    }
  ],
  code: {
    title: "A complete toy compiler: lexer, parser, lowering, folding, codegen, VM",
    intro: "Every phase from the table above, in one runnable file (Python 3.10+). It compiles assignments like <code>x = 2 * (3 + 4);</code> to three-address code, constant-folds the IR, generates stack-machine code and runs it.",
    code: String.raw`"""A whole compiler pipeline in ~90 lines: source -> tokens -> AST -> TAC IR -> stack code -> run."""
import re
from dataclasses import dataclass

# ---------- 1. Lexer: characters -> tokens ----------
TOKEN_RE = re.compile(r"\s*(?:(?P<num>\d+)|(?P<id>[A-Za-z_]\w*)|(?P<op>[-+*/()=;]))")

def lex(src):
    pos, toks = 0, []
    src = src.rstrip()
    while pos < len(src):
        m = TOKEN_RE.match(src, pos)
        if not m:
            raise SyntaxError(f"bad char {src[pos]!r} at {pos}")
        kind = m.lastgroup
        toks.append((kind, m.group(kind)))
        pos = m.end()
    toks.append(("eof", ""))
    return toks

# ---------- 2. Parser: tokens -> AST ----------
@dataclass
class Num:  value: int
@dataclass
class Var:  name: str
@dataclass
class Bin:  op: str; left: object; right: object
@dataclass
class Assign: target: str; value: object

class Parser:
    def __init__(self, toks): self.toks, self.i = toks, 0
    def peek(self): return self.toks[self.i]
    def eat(self, kind=None, text=None):
        k, t = self.toks[self.i]
        if (kind and k != kind) or (text and t != text):
            raise SyntaxError(f"expected {text or kind}, got {t!r}")
        self.i += 1
        return t
    def program(self):
        stmts = []
        while self.peek()[0] != "eof":
            name = self.eat("id"); self.eat(text="=")
            stmts.append(Assign(name, self.expr())); self.eat(text=";")
        return stmts
    def expr(self):                      # expr := term (('+'|'-') term)*
        node = self.term()
        while self.peek()[1] in ("+", "-"):
            node = Bin(self.eat(), node, self.term())
        return node
    def term(self):                      # term := atom (('*'|'/') atom)*
        node = self.atom()
        while self.peek()[1] in ("*", "/"):
            node = Bin(self.eat(), node, self.atom())
        return node
    def atom(self):
        kind, text = self.peek()
        if kind == "num": self.eat(); return Num(int(text))
        if kind == "id":  self.eat(); return Var(text)
        self.eat(text="("); node = self.expr(); self.eat(text=")"); return node

# ---------- 3. Lowering: AST -> three-address code ----------
def lower(stmts):
    code, n = [], [0]
    def tmp():
        n[0] += 1; return f"t{n[0]}"
    def gen(e):
        if isinstance(e, Num): return str(e.value)
        if isinstance(e, Var): return e.name
        a, b = gen(e.left), gen(e.right)
        t = tmp(); code.append((t, a, e.op, b)); return t
    for s in stmts:
        code.append((s.target, gen(s.value), None, None))
    return code

# ---------- 4. Optimisation on the IR: constant folding ----------
def fold(code):
    consts, out = {}, []
    ops = {"+": lambda x, y: x + y, "-": lambda x, y: x - y,
           "*": lambda x, y: x * y, "/": lambda x, y: x // y}
    val = lambda a: consts.get(a, a)
    for dst, a, op, b in code:
        a, b = val(a), (val(b) if b is not None else None)
        if op and a.lstrip("-").isdigit() and b.lstrip("-").isdigit():
            a, op, b = str(ops[op](int(a), int(b))), None, None
        if op is None and a.lstrip("-").isdigit():
            consts[dst] = a
        out.append((dst, a, op, b))
    return out

# ---------- 5. Code generation: TAC -> stack-machine code, then run it ----------
def codegen(code):
    asm = []
    push = lambda v: asm.append(("PUSH", int(v)) if v.lstrip("-").isdigit() else ("LOAD", v))
    for dst, a, op, b in code:
        push(a)
        if op: push(b); asm.append(("BINOP", op))
        asm.append(("STORE", dst))
    return asm

def run(asm):
    stack, env = [], {}
    for ins, *arg in asm:
        if ins == "PUSH": stack.append(arg[0])
        elif ins == "LOAD": stack.append(env[arg[0]])
        elif ins == "STORE": env[arg[0]] = stack.pop()
        else:
            y, x = stack.pop(), stack.pop()
            stack.append({"+": x + y, "-": x - y, "*": x * y, "/": x // y}[arg[0]])
    return {k: v for k, v in env.items() if not k.startswith("t")}

if __name__ == "__main__":
    src = "x = 2 * (3 + 4); y = x * x - 1;"
    toks = lex(src);            print("tokens:", toks[:6], "...")
    ast_ = Parser(toks).program(); print("ast:   ", ast_[0])
    tac = lower(ast_);          print("tac:   ", tac)
    opt = fold(tac);            print("folded:", opt)
    asm = codegen(opt);         print("asm:   ", asm)
    print("result:", run(asm))

# Output:
# tokens: [('id', 'x'), ('op', '='), ('num', '2'), ('op', '*'), ('op', '('), ('num', '3')] ...
# ast:    Assign(target='x', value=Bin(op='*', left=Num(value=2), right=Bin(op='+', left=Num(value=3), right=Num(value=4))))
# tac:    [('t1', '3', '+', '4'), ('t2', '2', '*', 't1'), ('x', 't2', None, None), ('t3', 'x', '*', 'x'), ...]
# folded: [('t1', '7', None, None), ('t2', '14', None, None), ('x', '14', None, None), ('t3', '196', None, None), ...]
# result: {'x': 14, 'y': 195}`,
    notes: [
      "Each phase only depends on the output type of the previous one; you could swap the parser for a parser generator or the code generator for an x86 emitter without touching the rest.",
      "The constant folder runs on the IR, not the AST: because <code>x</code> has been flattened into a single copy of a constant, folding <code>x * x</code> is a dictionary lookup rather than a tree-matching problem.",
      "Folding <code>/</code> blindly would be wrong for division by zero: real compilers must not fold an expression whose evaluation would trap; they leave it for run time.",
      "Run it with <code>python3 pipeline.py</code>; the expected output is in the comment at the bottom."
    ]
  },
  lab: {
    title: "Drive CPython's real pipeline",
    prompt: "Write a script that pushes <code>SRC = \"total = price * qty + 1\\n\"</code> through every stage of CPython's own compiler using only the standard library: (1) print each token from <code>tokenize.generate_tokens</code> with its type name, (2) parse it with <code>ast.parse</code> and print <code>ast.dump(tree, indent=2)</code>, (3) <code>compile</code> the AST (not the string) into a code object, (4) disassemble it with <code>dis.dis</code>, and (5) <code>exec</code> it in an environment with <code>price=5, qty=3</code> and print <code>total</code>.",
    starter: String.raw`import ast
import dis
import io
import tokenize

SRC = "total = price * qty + 1\n"

# Stage 1: lexing - print the type name and string of every token

# Stage 2: parsing - build the AST and dump it with indent=2

# Stage 3: compile the AST object (not the string) to a code object

# Stage 4: disassemble the code object

# Stage 5: exec with price=5, qty=3 and print total
`,
    checks: [
      { re: 'tokenize\\.generate_tokens\\(', flags: '', must: true, hint: "Use tokenize.generate_tokens(io.StringIO(SRC).readline) to lex.", pass: "Lexing with tokenize ✓" },
      { re: 'tok_name\\[', flags: '', must: true, hint: "Map numeric token types to names with tokenize.tok_name[tok.type].", pass: "Token type names ✓" },
      { re: 'ast\\.parse\\(', flags: '', must: true, hint: "Parse with ast.parse(SRC).", pass: "Parsing to an AST ✓" },
      { re: 'ast\\.dump\\([^)]*indent\\s*=\\s*2', flags: '', must: true, hint: "Pretty-print with ast.dump(tree, indent=2).", pass: "AST dump ✓" },
      { re: 'compile\\(\\s*tree\\s*,', flags: '', must: true, hint: "Compile the AST object: compile(tree, \"<lab>\", \"exec\") — the first argument should be the tree variable, not SRC.", pass: "Compiling the AST ✓" },
      { re: 'dis\\.dis\\(', flags: '', must: true, hint: "Disassemble with dis.dis(code).", pass: "Disassembly ✓" },
      { re: 'exec\\(', flags: '', must: true, hint: "Run the code object with exec(code, env).", pass: "Execution ✓" },
      { re: 'eval\\(\\s*SRC', flags: '', must: false, hint: "Do not shortcut with eval(SRC); go through the AST and code object.", pass: "No eval shortcut ✓" }
    ],
    run: "Save as <code>pipeline_lab.py</code> and run <code>python3 pipeline_lab.py</code>. Expect tokens <code>NAME 'total'</code>, <code>OP '='</code>, ..., <code>NEWLINE</code>, <code>ENDMARKER</code>; an <code>Assign</code> node whose value is <code>BinOp(BinOp(price * qty) + 1)</code>; <code>co_names</code> of <code>('price', 'qty', 'total')</code>; a disassembly with <code>LOAD_NAME</code>/<code>STORE_NAME</code> (on 3.10 you see <code>BINARY_MULTIPLY</code> and <code>BINARY_ADD</code>, on 3.11+ <code>BINARY_OP</code>), and finally <code>16</code>. Then change SRC to <code>total = 60 * 60 * 24\\n</code> and notice the disassembly contains a single <code>LOAD_CONST 86400</code>: CPython folded the constants before generating bytecode.",
    solution: String.raw`import ast
import dis
import io
import tokenize

SRC = "total = price * qty + 1\n"

# Stage 1: lexing
for tok in tokenize.generate_tokens(io.StringIO(SRC).readline):
    print(tokenize.tok_name[tok.type], repr(tok.string))

# Stage 2: parsing to an AST
tree = ast.parse(SRC, mode="exec")
print(ast.dump(tree, indent=2))

# Stage 3: compile the AST to a code object (bytecode)
code = compile(tree, filename="<lab>", mode="exec")
print(code.co_names)

# Stage 4: inspect the bytecode
dis.dis(code)

# Stage 5: run it
env = {"price": 5, "qty": 3}
exec(code, env)
print(env["total"])
`,
    notes: [
      "You never had to write a lexer, parser or code generator: CPython exposes every phase as a library call. This is the same hook pytest uses to rewrite <code>assert</code> statements before compiling test modules.",
      "<code>ast.dump(..., indent=2)</code> requires Python 3.9+. Line and column attributes are hidden by default; pass <code>include_attributes=True</code> to see them.",
      "Bytecode opcodes are not stable across Python versions, so never build a tool that depends on exact opcode names unless you pin the interpreter."
    ]
  },
  quiz: [
    {
      q: "Which phase reports \"name 'y' is not defined\" in a statically typed language like Java?",
      options: ["Lexing", "Parsing", "Semantic analysis", "Code generation"],
      correct: 2,
      explain: "The program is syntactically valid; only name resolution against symbol tables, part of semantic analysis, can tell that <code>y</code> has no declaration in scope."
    },
    {
      q: "What is the main structural difference between a parse tree (CST) and an AST?",
      options: ["The AST keeps comments and whitespace", "The CST has one node per grammar rule, including punctuation; the AST keeps only semantically meaningful structure", "The AST is always in SSA form", "They are the same thing with different names"],
      correct: 1,
      explain: "Parentheses, semicolons and chain rules like <code>expr → term → factor</code> appear in a CST. The AST collapses them; grouping is encoded by tree shape."
    },
    {
      q: "Why does LLVM have a single IR shared by Clang, rustc and swiftc?",
      options: ["Because all those languages have the same syntax", "To turn M languages × N targets into M front ends + N back ends, and to write each optimization once", "Because IR is faster to parse than C", "Because machine code cannot be generated from an AST"],
      correct: 1,
      explain: "A shared IR decouples front ends from back ends, and every middle-end pass benefits every language."
    },
    {
      q: "You must analyze taint flow through a third-party library shipped only as a JAR. Which representation is appropriate?",
      options: ["The source AST via JavaParser", "srcML", "Bytecode lifted to an IR such as Jimple (Soot/SootUp) or WALA IR", "Tokens from a Java lexer"],
      correct: 2,
      explain: "There is no source. Bytecode keeps types, calls and control flow, and Soot/SootUp lift it into an analysis-friendly three-address IR."
    },
    {
      q: "In CPython, <code>SIZE = 60 * 60 * 24</code> disassembles to a single <code>LOAD_CONST 86400</code>. Which phase did that?",
      options: ["The tokenizer", "Constant folding in the compiler (AST/peephole optimizer) before bytecode is emitted", "The evaluation loop at run time", "The garbage collector"],
      correct: 1,
      explain: "CPython's compiler folds constant expressions during compilation, a classic middle-end optimization; the interpreter never executes the multiplications."
    }
  ],
  testFlow: {
    title: "Pick the right representation",
    start: "q1",
    nodes: {
      q1: { q: "You want a rule: \"flag any Java method longer than 80 lines and report the exact line\". Where do you run it?", choices: [ { text: "On the source AST/CST (JavaParser, tree-sitter, srcML)", to: "q1ok" }, { text: "On Jimple from Soot", to: "q1bad" } ] },
      q1ok: { end: true, correct: true, text: "Right. It is a syntactic property tied to source layout; an IR would have lost formatting and might not even map lines one to one.", next: "q2" },
      q1bad: { end: true, correct: false, text: "Jimple is built from bytecode; method length in source lines and formatting are gone. Use a source-level tree.", retry: "q1" },
      q2: { q: "You need to know whether a value read from an HTTP parameter can reach a SQL query through three helper methods. Where?", choices: [ { text: "On tokens with a regex", to: "q2bad" }, { text: "On an IR with a call graph and dataflow (Soot/FlowDroid, CodeQL, Infer)", to: "q2ok" } ] },
      q2bad: { end: true, correct: false, text: "Interprocedural value flow needs resolved calls and def-use information; token matching cannot follow values through variables or calls.", retry: "q2" },
      q2ok: { end: true, correct: true, text: "Right. Taint analysis is interprocedural dataflow, which is exactly what IRs plus call graphs are for.", next: "q3" },
      q3: { q: "The code you analyze is from 10-year-old commits that no longer build. Which tool family survives?", choices: [ { text: "Tolerant parsers: tree-sitter, srcML, JDT/Spoon in no-classpath mode", to: "q3ok" }, { text: "Soot on compiled classes", to: "q3bad" } ] },
      q3ok: { end: true, correct: true, text: "Correct. They parse without a successful build and recover from errors, at the cost of weaker or no type information." },
      q3bad: { end: true, correct: false, text: "Soot needs .class files, which you cannot produce if the commit does not build.", retry: "q3" }
    }
  },
  pitfalls: [
    "Treating \"the AST\" as one thing. A Python <code>ast</code> tree, a JavaParser tree and a tree-sitter tree differ in whether they keep comments, whether names are resolved, and whether broken code yields a tree at all. Always say which one you mean.",
    "Analyzing at the wrong level: writing dataflow over a 100-node-type AST (painful, error prone) or reporting style issues from bytecode (no formatting, synthetic methods, desugared code that the user never wrote).",
    "Dropping source positions during a transformation. Every phase must thread line/column information forward or your tool's output cannot be acted on.",
    "Assuming bytecode equals source semantics one to one: javac desugars lambdas, inner-class accessors, string switches and enhanced for loops, so an IR-level tool sees synthetic methods and extra locals that must be filtered before reporting."
  ],
  interview: [
    {
      q: "Walk me through what happens between typing a Java file and the CPU executing it.",
      a: "javac lexes and parses to <code>JCTree</code> ASTs, enters symbols, runs annotation processors, attributes types and resolves names, runs flow analysis (definite assignment, reachability, exceptions), desugars (generic erasure, inner classes, lambdas, enhanced for), and generates bytecode into <code>.class</code> files. At run time the JVM loads and verifies classes, interprets bytecode, profiles it, and HotSpot's tiered JIT (C1 then C2) compiles hot methods to machine code, with deoptimization if speculative assumptions break. So there are two compilers: an ahead-of-time front end to bytecode and a JIT back end from bytecode to machine code."
    },
    {
      q: "AST vs IR: when would you build an analysis on each?",
      a: "AST when the result must map back to source precisely or the property is syntactic: style rules, API misuse patterns, refactorings, code metrics, fix suggestions. IR when the property is semantic and depends on control or data flow: nullness, taint, constant propagation, call graphs, resource leaks. IR has fewer constructs and explicit control flow, so the analysis is simpler and more precise; the price is mapping results back to source (line tables) and filtering compiler-generated code."
    },
    {
      q: "Why do compilers have an IR at all? Why not optimize the AST directly?",
      a: "Three reasons. Reuse: M front ends and N back ends share one middle end instead of M×N compilers. Simplicity: an IR has a small number of operations, explicit temporaries and explicit jumps, so passes do not need cases for every syntactic form (for, while, do, switch, ternary, short-circuit operators all become branches). Analyzability: properties like SSA, explicit CFGs and typed operands make dataflow and optimizations straightforward. Some optimizations do happen on ASTs (constant folding in javac and CPython), but the heavy ones run on IR."
    },
    {
      q: "Whiteboard: design a tool that flags SQL injection risks across a 2-million-line Java monorepo. Which representation and why?",
      a: "Build once with the real build system and hook it (as CodeQL does) or analyze the resulting bytecode with SootUp/WALA, because I need resolved types and calls. Pipeline: (1) extract an IR per method (Jimple), (2) build a call graph (start with CHA or RTA for scalability, refine with points-to where precision matters), (3) define sources (servlet parameters, Spring <code>@RequestParam</code>), sinks (<code>Statement.execute*</code>, JDBC template strings) and sanitizers (<code>PreparedStatement</code> parameter binding), (4) run an IFDS-style taint analysis, (5) map findings back to source lines via line-number tags and present the source-to-sink path. I would use a tolerant AST tool only for the reporting/fix-suggestion layer. Scale concerns: summaries for library methods, per-module incremental analysis, and a time budget per entry point."
    },
    {
      q: "Explain a tradeoff: tolerant parsers (tree-sitter, srcML) versus full compilers (javac-based, Soot) for mining software repositories.",
      a: "Tolerant parsers work on any snapshot, including broken commits and partial files, and are fast enough to process every revision of thousands of repositories. They give you syntax only: no types, no resolved calls, so <code>log.add</code> on a List and a custom <code>add</code> method look identical. Compiler-based tools give precise semantics but require each commit to build, which in practice fails for a large share of historical commits (missing dependencies, old JDKs). Many MSR studies therefore use tree-sitter/srcML for broad statistics and compile a sample for precise analysis, reporting the bias that introduces."
    },
    {
      q: "What is the difference between a compiler, an interpreter and a JIT?",
      a: "A compiler translates the whole program to another language ahead of time. An interpreter executes a representation (AST or bytecode) directly. A JIT compiles at run time, usually only hot code, using profile information the ahead-of-time compiler did not have (observed receiver types, branch frequencies), and can deoptimize back to the interpreter. These are properties of implementations, not languages: CPython compiles to bytecode and interprets it; PyPy JIT-compiles Python; Java is compiled to bytecode and then JIT-compiled."
    },
    {
      q: "Where does Error Prone run, and why can it do things a linter on raw source cannot?",
      a: "Error Prone is a javac plugin that runs after attribution, so every tree node has resolved symbols and types. A check like \"<code>equals</code> called with an incompatible type\" or \"return value of <code>String.trim()</code> ignored\" needs to know the receiver's static type and the exact method resolved by overload resolution, which a pure syntax tool cannot know reliably. The price is that it only runs when the code compiles with a supported javac."
    }
  ]
};
