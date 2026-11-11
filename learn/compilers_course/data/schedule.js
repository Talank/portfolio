/* Master ordered list of lessons. Drives the dashboard, prev/next links and the
   interview drill pool. type: 'lesson' loads data/lessons/<id>.js. */
window.SCHEDULE = [
  // ── Part 0 — The Compiler Pipeline
  { id: "compiler-pipeline", title: "The Compiler Pipeline: Source → Tokens → AST → IR → Machine Code", category: "Part 0 \u2014 The Compiler Pipeline", timeMin: 30, type: 'lesson' },
  { id: "lexing-and-parsing", title: "Lexing & Parsing: Grammars, Recursive Descent, Precedence & Parser Generators", category: "Part 0 \u2014 The Compiler Pipeline", timeMin: 45, type: 'lesson' },
  // ── Part 1 — Working With ASTs
  { id: "python-ast", title: "Python's ast Module: Parse, Visit, Transform & Unparse", category: "Part 1 \u2014 Working With ASTs", timeMin: 45, type: 'lesson' },
  { id: "java-ast-tools", title: "ASTs for Java: JavaParser, Eclipse JDT, Spoon & tree-sitter", category: "Part 1 \u2014 Working With ASTs", timeMin: 45, type: 'lesson' },
  { id: "srcml", title: "srcML: Source Code as XML, XPath Queries & Round-Tripping", category: "Part 1 \u2014 Working With ASTs", timeMin: 40, type: 'lesson' },
  // ── Part 2 — Lowering to Intermediate Representations
  { id: "lowering-to-ir", title: "Lowering: Three-Address Code, Basic Blocks & Control-Flow Graphs", category: "Part 2 \u2014 Lowering to Intermediate Representations", timeMin: 45, type: 'lesson' },
  { id: "ssa-form", title: "SSA Form: φ-Functions, Dominators & LLVM IR", category: "Part 2 \u2014 Lowering to Intermediate Representations", timeMin: 45, type: 'lesson' },
  { id: "soot-and-jimple", title: "Soot & SootUp: Jimple, Bytecode IR & Call Graphs for Java", category: "Part 2 \u2014 Lowering to Intermediate Representations", timeMin: 50, type: 'lesson' },
  // ── Part 3 — Static Analysis Theory
  { id: "dataflow-analysis", title: "Dataflow Analysis: Reaching Definitions, Liveness & the Worklist Algorithm", category: "Part 3 \u2014 Static Analysis Theory", timeMin: 50, type: 'lesson' },
  { id: "abstract-interpretation", title: "Lattices, Monotone Frameworks & Abstract Interpretation", category: "Part 3 \u2014 Static Analysis Theory", timeMin: 45, type: 'lesson' },
  { id: "pointer-and-callgraph", title: "Call Graphs & Pointer Analysis: CHA, RTA, Andersen vs Steensgaard", category: "Part 3 \u2014 Static Analysis Theory", timeMin: 45, type: 'lesson' },
  { id: "taint-analysis", title: "Taint Analysis: Sources, Sinks, Sanitizers — FlowDroid & CodeQL", category: "Part 3 \u2014 Static Analysis Theory", timeMin: 45, type: 'lesson' },
  // ── Part 4 — Static Analyzers in the Wild
  { id: "java-static-analyzers", title: "Java Static Analyzers: SpotBugs, PMD, Error Prone, Checker Framework, Infer", category: "Part 4 \u2014 Static Analyzers in the Wild", timeMin: 45, type: 'lesson' },
  { id: "python-static-analyzers", title: "Python Static Analyzers: Pylint, Ruff, mypy/Pyright, Bandit, Semgrep", category: "Part 4 \u2014 Static Analyzers in the Wild", timeMin: 40, type: 'lesson' },
  { id: "capstone-mini-analyzer", title: "Capstone: Build a Mini Analyzer (AST → CFG → Dataflow → Report) & Interview Playbook", category: "Part 4 \u2014 Static Analyzers in the Wild", timeMin: 60, type: 'lesson' },
];
window.CATEGORY_COLORS = {"Part 0 \u2014 The Compiler Pipeline": "#4fd1c5", "Part 1 \u2014 Working With ASTs": "#f6ad55", "Part 2 \u2014 Lowering to Intermediate Representations": "#9f7aea", "Part 3 \u2014 Static Analysis Theory": "#68d391", "Part 4 \u2014 Static Analyzers in the Wild": "#f687b3"};
