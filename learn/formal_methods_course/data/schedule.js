/* Master ordered list of lessons. Drives the dashboard, prev/next links and the
   interview drill pool. type: 'lesson' loads data/lessons/<id>.js. */
window.SCHEDULE = [
  // ── Part 0 — Logic Foundations
  { id: "why-formal-methods", title: "Why Formal Methods: Testing vs Proving, Soundness, Completeness & the Landscape", category: "Part 0 \u2014 Logic Foundations", timeMin: 30, type: 'lesson' },
  { id: "sat-solving", title: "Propositional Logic & SAT: CNF, Tseitin, DPLL & CDCL", category: "Part 0 \u2014 Logic Foundations", timeMin: 45, type: 'lesson' },
  // ── Part 1 — SMT Solvers & Z3
  { id: "smt-theories", title: "From SAT to SMT: Theories, DPLL(T) & Decidability", category: "Part 1 \u2014 SMT Solvers & Z3", timeMin: 40, type: 'lesson' },
  { id: "z3-python-basics", title: "Z3 in Python: Ints, Reals, Bools, check(), model() & Optimize", category: "Part 1 \u2014 SMT Solvers & Z3", timeMin: 45, type: 'lesson' },
  { id: "z3-advanced-theories", title: "Bit-Vectors, Arrays, Uninterpreted Functions & Quantifiers in Z3", category: "Part 1 \u2014 SMT Solvers & Z3", timeMin: 45, type: 'lesson' },
  { id: "symbolic-execution", title: "Symbolic Execution: Path Conditions, KLEE & angr — Built on Z3", category: "Part 1 \u2014 SMT Solvers & Z3", timeMin: 45, type: 'lesson' },
  // ── Part 2 — Verifying Programs
  { id: "hoare-logic-and-vcs", title: "Hoare Logic, Weakest Preconditions, Loop Invariants & Verification Conditions", category: "Part 2 \u2014 Verifying Programs", timeMin: 50, type: 'lesson' },
  { id: "model-checking", title: "Bounded Model Checking & Temporal Logic: CBMC, LTL & TLA+", category: "Part 2 \u2014 Verifying Programs", timeMin: 45, type: 'lesson' },
  { id: "dafny", title: "Auto-Active Verification With Dafny: requires, ensures, invariant, decreases", category: "Part 2 \u2014 Verifying Programs", timeMin: 45, type: 'lesson' },
  // ── Part 3 — Theorem Proving With Lean 4
  { id: "lean-basics", title: "Lean 4 Basics: Types, Functions & Propositions-as-Types", category: "Part 3 \u2014 Theorem Proving With Lean 4", timeMin: 45, type: 'lesson' },
  { id: "lean-tactics", title: "Lean 4 Tactics: intro, apply, exact, rw, simp, cases, induction, omega", category: "Part 3 \u2014 Theorem Proving With Lean 4", timeMin: 50, type: 'lesson' },
  { id: "lean-program-proofs", title: "Proving Programs Correct in Lean: Lists, Induction, Mathlib & Coq/Isabelle", category: "Part 3 \u2014 Theorem Proving With Lean 4", timeMin: 50, type: 'lesson' },
  // ── Part 4 — Solvers in Practice
  { id: "capstone-solvers-in-practice", title: "Capstone: Solvers in Industry & Research, LLMs + Formal Methods & Interview Playbook", category: "Part 4 \u2014 Solvers in Practice", timeMin: 60, type: 'lesson' },
];
window.CATEGORY_COLORS = {"Part 0 \u2014 Logic Foundations": "#4fd1c5", "Part 1 \u2014 SMT Solvers & Z3": "#f6ad55", "Part 2 \u2014 Verifying Programs": "#9f7aea", "Part 3 \u2014 Theorem Proving With Lean 4": "#68d391", "Part 4 \u2014 Solvers in Practice": "#f687b3"};
