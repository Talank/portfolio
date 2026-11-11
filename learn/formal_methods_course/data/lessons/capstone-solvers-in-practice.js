window.LESSONS = window.LESSONS || {};
window.LESSONS['capstone-solvers-in-practice'] = {
  id: 'capstone-solvers-in-practice',
  title: 'Capstone: Solvers in Industry & Research, LLMs + Formal Methods & Interview Playbook',
  category: 'Part 4 — Solvers in Practice',
  timeMin: 60,
  summary: 'The course so far covered techniques: SAT and SMT, symbolic execution, Hoare logic, model checking, Dafny, and Lean. This capstone is about using them. First the deployments that interviewers expect you to know and be able to explain: AWS Zelkova, Microsoft SAGE, seL4, CompCert and Meta Infer, with the specific technical idea that made each one work. Then the fastest-moving research area, LLMs combined with formal methods: autoformalization, LLM-proposed loop invariants checked by a verifier, LLM-guided proof search (LeanDojo, Lean Copilot, AlphaProof), and the specification-quality trap. Then a decision guide for choosing a tool, a runnable miniature of two industrial patterns in Z3, and an interview playbook that ties it to an SE research background.',
  goals: [
    'Explain, for each of Zelkova, SAGE, seL4, CompCert and Infer, what is checked, which technique is used, and why it was practical',
    'Describe the generate-and-check pattern for LLMs with verifiers, and what the verifier does and does not guarantee',
    'Summarize LLM proof search in Lean (LeanDojo, Lean Copilot, AlphaProof) and autoformalization, qualitatively and accurately',
    'Choose a tool (SMT, symbolic execution, BMC, TLA+, abstract interpretation, Dafny, Lean/Isabelle/Rocq) for a given problem and justify the choice',
    'Run a Zelkova-style policy comparison and an LLM-invariant checker in Z3, and pitch them in an interview'
  ],
  concept: [
    {
      h: 'Five deployments worth knowing in detail',
      p: [
        '<b>AWS Zelkova</b> (Backes et al., FMCAD 2018). Translates IAM and S3 access policies into SMT formulas over strings, regular expressions and conditions, then asks questions like "does this policy allow any request from outside my account?" or "is policy B more permissive than policy A?" as satisfiability queries. A sat answer gives a concrete example request. It powers features such as IAM Access Analyzer and S3 Block Public Access checks, and runs at very large query volumes, which drove AWS investment in solver performance (including a portfolio of solvers and cvc5 string work). Key idea: a narrow, fully formalized domain with a precise semantics, so every query is decidable or nearly so, and users never see a formula.',
        '<b>Microsoft SAGE</b> (Godefroid, Levin, Molnar). Whitebox fuzzing: run a program on a seed input, record the x86 trace, collect the path constraint symbolically, negate branch conditions one at a time (generational search), and solve with Z3 to get new inputs that explore new paths. Used heavily on Windows file parsers and credited with finding a large share of the security bugs found by fuzzing during Windows 7 development. Key idea: concolic execution sidesteps the hardest parts (concrete values for system calls and unknown code), and every report comes with a crashing input, so there are no false positives.',
        '<b>seL4</b> (Klein et al., SOSP 2009). A microkernel whose C implementation was proved, in Isabelle/HOL, to refine an abstract specification (functional correctness), later extended to integrity and confidentiality proofs and to translation validation down to the binary. Key idea: refinement through layers (abstract spec, executable spec, C), and a kernel designed to be verifiable. The often-quoted lesson is cost: proof effort was many times the code effort, which is why it is done for small, critical code.',
        '<b>CompCert</b> (Leroy, Coq). A C compiler with a machine-checked proof that compiled code behaves as the source semantics says (semantic preservation), for the verified passes. When Yang et al. ran Csmith random testing (PLDI 2011), they found many wrong-code bugs in GCC and LLVM but none in CompCert\'s verified middle-end; the bugs they found were in unverified parts. Used in avionics and other safety-critical settings. Key idea: a proof that rules out miscompilation, the bug class that testing the source cannot catch.',
        '<b>Meta Infer</b> (Calcagno, Distefano, O\'Hearn). A static analyzer based on separation logic and bi-abduction, which infers pre- and postconditions for each procedure independently, so analysis is compositional and incremental. Deployed at diff time: it runs on code review and comments on new null dereferences, resource leaks and (via RacerD) data races. Key idea: compositionality makes it fast enough for every diff, and reporting at diff time, rather than as a big batch, is what made developers fix the reports. Infer is unsound by design in places, to keep false positives low.'
      ]
    },
    {
      h: 'The shape of successful deployments',
      p: [
        '<ul><li><b>Push-button over expert-driven</b> wherever the users are not verification experts (Zelkova, SAGE, Infer). Proof assistants are used where a small team of experts can own a critical artifact (seL4, CompCert).</li><li><b>Concrete output</b>: a request, a crashing input, a trace, a comment on a line. Engineers act on examples, not on "unsat".</li><li><b>Fit into an existing workflow</b>: code review (Infer), the console (Zelkova), the fuzzing farm (SAGE), the CI pipeline (CBMC proofs at AWS run on each change).</li><li><b>Trade soundness for usability deliberately</b>, and say so: Infer reports likely bugs, SAGE finds bugs but proves nothing, CBMC proofs are relative to harness assumptions.</li><li><b>Narrow the domain</b>: policies, file parsers, a kernel, a compiler. General-purpose "verify my app" tools rarely succeed.</li></ul>'
      ]
    },
    {
      h: 'LLMs + formal methods: generate, then check',
      p: [
        'The central pattern: an LLM proposes something that is hard to find but easy to check (a loop invariant, a proof step, a whole proof, a specification), and a verifier checks it. The verifier provides a reward signal with no false positives for the logical step, so failed attempts are cheap and successful ones are trustworthy. It is the same propose-check split as CEGAR or IC3, with a neural proposer.',
        '<b>Loop invariants and annotations.</b> LLMs propose candidate invariants for Dafny, Frama-C or a Z3 encoding; the verifier checks initiation, preservation and sufficiency, and the error is fed back. Systems such as Lemur formalize this loop. Invariant synthesis is where LLMs help most clearly, because the check is precise and local.',
        '<b>Proof search in proof assistants.</b> Early work (GPT-f on Metamath) showed language models could propose proof steps for a tree search. LeanDojo provided an open toolkit and dataset for interacting with Lean programmatically, with a retrieval-augmented prover that selects relevant premises from the library. <b>Lean Copilot</b> brings this into the editor: tactics such as <code>suggest_tactics</code>, <code>search_proof</code> and <code>select_premises</code> run a model locally or remotely and suggest steps that Lean then checks. In Isabelle, Baldur generated whole proofs and repaired them using the error messages, and Draft-Sketch-Prove used informal proofs to guide formal sketches.',
        '<b>AlphaProof</b> (Google DeepMind, 2024) combined a language model with AlphaZero-style reinforcement learning, training on a large set of problems that were automatically formalized into Lean, and searching for Lean proofs that the kernel checks. Together with AlphaGeometry 2 it reached a silver-medal standard on IMO 2024 problems, with some problems taking far longer than the contest time. The important part for interviews: the answer was trusted because Lean checked it, not because of the model.',
        '<b>Autoformalization</b>: translating natural-language statements (math problems, requirements, docstrings) into formal statements. It is the weak link: a proof of a mis-formalized statement is worthless, and the verifier cannot catch that. Good practice: back-translate the formal statement to English, test it on examples, and check for vacuity (an unsatisfiable hypothesis makes any conclusion provable).'
      ]
    },
    {
      h: 'The specification trap, and how to evaluate LLM + verifier systems',
      p: [
        'A verifier guarantees that the code satisfies the spec. If the model also writes or edits the spec, it can satisfy the verifier by weakening it: <code>ensures true</code>, a sort spec without the permutation clause, an extra <code>requires false</code>, an <code>assume</code> statement, <code>{:verify false}</code>, <code>sorry</code> or a new axiom. Every serious pipeline must guard against these: freeze the spec and diff-check it, ban escape hatches syntactically, run <code>#print axioms</code>, and test the spec itself (does it reject mutated implementations, does it accept known-good outputs?).',
        'Evaluation should report: success rate on a held-out benchmark (miniF2F, ProofNet and PutnamBench for Lean math; Dafny and Verus program benchmarks for code), the attempt and compute budget per success (pass@k is meaningless without k), wall-clock time including verifier time, contamination checks (were the solutions in the training data?), and spec-integrity failures counted as failures. This is the same discipline as any agent eval; the verifier makes the correctness part cheap but not the rest.'
      ]
    },
    {
      h: 'Choosing a tool for a problem',
      p: [
        '<div class="cmp-wrap"><table class="cmp"><tr><th>Problem</th><th>First choice</th><th>Why</th></tr><tr><td>Find inputs satisfying constraints; scheduling; configuration checks</td><td>SMT (Z3, cvc5) directly</td><td>Declarative, decidable theories, models as answers</td></tr><tr><td>Generate tests that reach deep branches</td><td>Symbolic or concolic execution (KLEE, angr, SAGE-style)</td><td>Path constraints plus a solver produce inputs</td></tr><tr><td>Bug-hunt C code, memory safety, bounded proofs</td><td>CBMC / ESBMC</td><td>Bit-precise, automatic, traces; proofs with unwinding assertions</td></tr><tr><td>Concurrency or distributed protocol design</td><td>TLA+ with TLC or Apalache</td><td>Explores interleavings and failures on small instances</td></tr><tr><td>Whole-codebase bug finding at scale</td><td>Static analysis (Infer, CodeQL, abstract interpretation)</td><td>Scales, low setup; accepts false positives or negatives</td></tr><tr><td>Verified algorithm or library that ships as code</td><td>Dafny, Verus (Rust), Why3, Frama-C/WP (C)</td><td>Auto-active: specs plus SMT, executable output</td></tr><tr><td>Deep mathematics, long-lived proofs, ML proof search</td><td>Lean 4 + Mathlib</td><td>Kernel-checked, huge library, programmable</td></tr><tr><td>Large systems proof with heavy automation</td><td>Isabelle/HOL (or Rocq for its ecosystem)</td><td>Sledgehammer; seL4, CompCert precedents</td></tr></table></div>',
        'Questions to ask before choosing: what exactly is the property (safety, liveness, functional correctness, equivalence)? Do I need a proof or just bugs? How big is the state or input space, and is it bounded? Who will maintain the artifact? What false-positive rate will users tolerate? Is the code available, or only a design?'
      ]
    }
  ],
  deepDive: {
    timeMin: 20,
    intro: 'Material for the harder follow-ups: what makes the industrial systems sound or not, why LLM + Lean works better than LLM + natural-language math, and research directions that connect to SE.',
    sections: [
      {
        h: 'Soundness boundaries of each deployment',
        p: [
          '<ul><li><b>Zelkova</b>: sound relative to its formal model of policy semantics; the model must track the real evaluator, which AWS cross-checks by testing the model against the production engine (and, later, by building the engine itself in a verified way with Dafny).</li><li><b>SAGE</b>: no soundness claim, bug finding only; incomplete due to path explosion and constraint approximations, but every bug is real.</li><li><b>seL4</b>: proof assumes correctness of the hardware model, the boot code and some assembly, and (for the C-level proof) the C semantics and compiler, later addressed by binary-level translation validation.</li><li><b>CompCert</b>: proof covers the verified passes; parsing and assembling/linking were initially outside it, and the C semantics itself is a trusted specification.</li><li><b>Infer</b>: intentionally unsound in places (for example around certain library models), because the goal is useful signal with few false alarms.</li></ul>',
          'Being able to say precisely what each system does not guarantee is the most convincing signal of real understanding.'
        ]
      },
      {
        h: 'Why verifiers make LLMs more useful, and where it breaks',
        p: [
          'Verifiers turn an unreliable generator into a reliable system: sample many candidates, keep the checked ones. They also give dense training signal (reinforcement learning from verifier feedback, expert iteration on successful proofs), which is the recipe behind the strongest recent provers. Lean is popular for this because its interaction can be scripted (LeanDojo, the REPL), Mathlib provides a huge training corpus, and the kernel check is cheap.',
          'Where it breaks: (1) specs, as above; (2) long proofs where each step is valid but the search space explodes; (3) library drift: Mathlib renames and changes lemmas, so models trained on old versions suggest names that no longer exist; (4) SMT-based verifiers (Dafny, Verus) adding their own nondeterminism through timeouts, which makes success rates noisy; run with fixed seeds and resource limits and report variance.'
        ]
      },
      {
        h: 'Research directions near SE',
        p: [
          '<ul><li><b>Verified test and code repair</b>: an LLM proposes a patch, a verifier or bounded model checker checks it against a specification, and tests catch spec gaps. Flaky-test repair could use solvers to reason about order-dependence or timing constraints explicitly.</li><li><b>Spec mining and spec testing</b>: LLMs draft Dafny or JML specifications from code and docs; mutation testing measures their strength.</li><li><b>Translation validation for LLM code translation</b> (for example C to Rust): equivalence checking with SMT or bounded model checking on the two versions.</li><li><b>Solver-backed test generation</b>: LLMs write harnesses and environment models, which are the expensive manual part of using KLEE or CBMC.</li><li><b>Evaluating these systems</b>: contamination, spec integrity, verifier nondeterminism and cost: the same evaluation problems as in agent benchmarks.</li></ul>'
        ]
      },
      {
        h: 'Stories to have ready',
        p: [
          'Pentium FDIV (1994): a floating-point division bug in a lookup table cost Intel a large recall charge and led to heavy investment in formal verification of floating-point units. The 2006 Java binary search overflow: a "proved" algorithm whose proof assumed unbounded integers. AWS and TLA+: engineers found subtle bugs in designs of distributed systems that tests had missed, and the CACM paper describes TLA+ as finding bugs that would have been hard to find any other way. Heartbleed: a missing bounds check, exactly the class CBMC and bounds-checked languages catch. Each illustrates a different lesson: verification pays where bugs are catastrophic, proofs are only as good as their model, and design-level checking catches bugs code-level testing cannot.'
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: 'The Straw Hats Pick the Right Tool for Each Island',
      text: [
        'At Water 7 the crew splits up. Franky checks the ship\'s new keel against Iceburg\'s blueprints line by line: a full proof, slow, but the keel must never crack (seL4, CompCert). Nami quizzes every harbor rule ("can anyone outside the crew board at night?") and gets back either "no" or a specific example of a stranger who could (Zelkova). Usopp throws thousands of odd-shaped cannonballs at the hull, each one aimed by reading where the last one bounced (SAGE).',
        'Brook proposes guesses for the hidden lock combination, quickly and confidently, many wrong. Robin checks each guess against the lock\'s inscription; only the ones that fit are used (an LLM proposing, a verifier checking). When Brook sneakily rewrites the inscription to match his guess, Robin notices the inscription changed, and rejects it: the spec is frozen.',
        'Luffy just wants to know which tool to use. Robin: ask what you are checking, whether you need certainty or just bugs, and who will maintain it.'
      ]
    },
    sitcom: {
      show: 'Friends',
      title: 'Chandler\'s Job Is Finally Explained',
      text: [
        'At a dinner party, a guest asks Chandler what "statistical analysis and data reconfiguration" means. This time he has an answer: he runs a checker that reads every new expense policy and tells managers either "this policy lets nobody new spend money" or "this exact intern could now expense a jet ski".',
        'Ross brags that his paleontology lab uses a chatbot to propose hypotheses. Chandler: "Who checks them?" Ross admits the chatbot also writes the grading rubric. Everyone at the table agrees that is the problem.'
      ]
    },
    why: 'Each crew member is a deployment pattern: Franky\'s line-by-line keel check is a refinement proof, Nami\'s yes-or-a-counterexample answers are Zelkova, Usopp\'s guided cannonballs are concolic fuzzing. Brook guessing while Robin checks is the LLM-plus-verifier loop, and Brook rewriting the inscription (Ross\'s chatbot writing its own rubric) is the specification trap.'
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'policy', emoji: '📜', label: 'harbor rules (policy)', x: 12, y: 14 },
      { id: 'keel', emoji: '⚓', label: 'keel (kernel proof)', x: 50, y: 12 },
      { id: 'hull', emoji: '🛡️', label: 'hull (parser)', x: 88, y: 14 },
      { id: 'lock', emoji: '🔐', label: 'lock + inscription', x: 50, y: 84 },
      { id: 'spec', emoji: '🧾', label: 'spec frozen?', x: 88, y: 84 }
    ],
    actors: [
      { id: 'nami', emoji: '🧭', label: 'Nami (Zelkova)', x: 14, y: 44 },
      { id: 'franky', emoji: '🤖', label: 'Franky (proof)', x: 40, y: 44 },
      { id: 'usopp', emoji: '🎯', label: 'Usopp (SAGE)', x: 70, y: 44 },
      { id: 'brook', emoji: '🎻', label: 'Brook (LLM)', x: 24, y: 80 },
      { id: 'robin', emoji: '📚', label: 'Robin (verifier)', x: 70, y: 70 }
    ],
    steps: [
      { c: 'Nami asks: can a stranger board at night under the new rules? The solver returns one specific stranger who can.', p: { policy: 'bad' }, l: { policy: 'sat: example request' } },
      { c: 'Franky checks the keel against the blueprint, layer by layer. Slow, but total.', a: { franky: [48, 30] }, p: { keel: 'good' } },
      { c: 'Usopp aims each new cannonball using the path of the last one, solving for unexplored branches.', a: { usopp: [84, 30] }, p: { hull: 'bad' }, l: { hull: 'crash input found' } },
      { c: 'Brook proposes lock combinations fast. Most are wrong.', a: { brook: [40, 80] }, p: { lock: 'lit' } },
      { c: 'Robin checks each guess against the inscription. Only checked guesses count.', a: { robin: [60, 76] }, p: { lock: 'good' }, l: { lock: 'verified guess' } },
      { c: 'Brook tries to rewrite the inscription to fit his guess. Robin diffs it against the original and rejects it.', p: { spec: 'bad' }, l: { spec: 'spec changed: reject' } },
      { c: 'Lesson: pick the tool by the question, and never let the proposer edit the judge.', p: { spec: 'good', policy: 'good' }, l: { spec: 'spec frozen' } }
    ]
  },
  conceptFlow: {
    title: 'LLM + verifier loop, with the guardrails',
    intro: 'The shape used for invariant synthesis, Dafny annotation, and Lean proof search.',
    stages: [
      { label: 'Input', nodes: [ { id: 'task', text: 'code + frozen spec\n(or theorem statement)' } ] },
      { label: 'Propose', nodes: [ { id: 'llm', text: 'LLM proposes\ninvariant / tactic / proof' } ] },
      { label: 'Guard', nodes: [ { id: 'guard', text: 'diff spec, ban sorry /\nassume / axioms' } ] },
      { label: 'Check', nodes: [ { id: 'verify', text: 'verifier: Z3, Dafny,\nLean kernel' }, { id: 'fail', text: 'error message\nfed back' } ] },
      { label: 'Output', nodes: [ { id: 'accept', text: 'accepted artifact\n(trusted)' }, { id: 'eval', text: 'eval: success@budget,\ntime, spec integrity' } ] }
    ],
    steps: [
      { active: ['task'], note: 'Start from a fixed specification: the thing the model must not change.' },
      { active: ['llm'], note: 'The model proposes the hard-to-find piece: an invariant, the next tactic, or a whole proof.' },
      { active: ['guard'], note: 'Syntactic guardrails reject spec edits and escape hatches before verification.' },
      { active: ['verify'], note: 'The verifier checks the proposal. Its verdict on the logic has no false positives (within its trusted base).' },
      { active: ['fail'], note: 'On failure, the error goes back to the model for another attempt, within a budget.' },
      { active: ['accept'], note: 'On success, the artifact is trusted because it was checked, not because the model produced it.' },
      { active: ['eval'], note: 'Report success at a stated budget, time including verifier time, and count spec-integrity violations as failures.' }
    ]
  },
  tech: [
    {
      q: 'How does Zelkova encode "policy B is more permissive than policy A"?',
      a: 'Each policy becomes a formula Allow_P(request) over symbolic request fields (principal, action, resource, condition keys), using string constraints for wildcards and prefixes. B is more permissive than A if Allow_B(r) and not Allow_A(r) is satisfiable; the model is a witness request. Equivalence is checking both directions. Deny statements and the default-deny semantics are encoded too: Allow means some Allow statement matches and no Deny statement matches. The worked example below does this for a two-field toy policy.'
    },
    {
      q: 'What is generational search in SAGE, and why not plain DFS?',
      a: 'Classic dynamic symbolic execution negates one branch and reruns, exploring one new path per run. Generational search takes one run\'s path constraint and, for every branch on it, creates a new input by negating that branch (keeping the prefix), so a single expensive symbolic trace yields many new tests. New inputs are ranked by how much new coverage they produce. It amortizes the cost of symbolic tracing on very long x86 traces.'
    },
    {
      q: 'What is bi-abduction in Infer?',
      a: 'Given what is known at a call site (a heap described in separation logic) and the callee\'s precondition, bi-abduction solves for both the missing part of the heap that the caller must provide (the anti-frame, added to the caller\'s inferred precondition) and the part of the heap the callee does not touch (the frame). Solving these per procedure, bottom-up over the call graph, lets Infer infer specs without annotations and analyze only changed procedures and their dependents, which is what makes diff-time analysis feasible.'
    },
    {
      q: 'Why is Lean, rather than Coq or Isabelle, the main target for LLM theorem proving?',
      a: 'A combination of factors: Mathlib is a large, unified, actively maintained corpus in one consistent style; Lean 4 is programmable in itself, so tools like LeanDojo and Lean Copilot can extract goals and run tactics programmatically; the community built open datasets and benchmarks (miniF2F, ProofNet ports); and high-profile results (AlphaProof) created momentum. Isabelle has strong earlier work (Baldur, Draft-Sketch-Prove, Thor), and Rocq has its own efforts, so it is a matter of ecosystem, not capability.'
    }
  ],
  code: {
    title: 'Two industrial patterns in miniature',
    intro: 'Run with <code>pip install --user z3-solver</code> then <code>python3 capstone.py</code>. Output below is from an actual run. Part 1 is a toy Zelkova: compare two access policies and get a witness request. Part 2 is the checking half of an LLM-invariant loop: each candidate (as a model might propose) is checked for initiation, preservation and sufficiency.',
    code: `# capstone.py -- two industrial patterns in miniature, with Z3.
from z3 import (String, StringVal, PrefixOf, Int, And, Or, Not, Implies,
                Solver, sat, unsat)

# ---------- (1) policy comparison ----------
action, resource = String("action"), String("resource")

def old_policy(a, r):
    # allow s3:GetObject on anything under arn:aws:s3:::reports/
    return And(a == StringVal("s3:GetObject"),
               PrefixOf(StringVal("arn:aws:s3:::reports/"), r))

def new_policy(a, r):
    # "refactored": prefix without the slash, plus ListBucket
    return And(Or(a == StringVal("s3:GetObject"), a == StringVal("s3:ListBucket")),
               PrefixOf(StringVal("arn:aws:s3:::reports"), r))

def more_permissive(p, q):
    """Return a request q allows but p denies, or None if q is no more permissive."""
    s = Solver()
    s.add(q(action, resource), Not(p(action, resource)))
    if s.check() == sat:
        m = s.model()
        return m[action], m[resource]
    return None

print("new allows something old denied:", more_permissive(old_policy, new_policy))
print("old allows something new denied:", more_permissive(new_policy, old_policy))

# ---------- (2) checking candidate loop invariants ----------
# program: i = 0; s = 0; while i < n: i += 1; s += 2    pre: n >= 0   post: s == 2 * n
n, i, s, i2, s2 = Int("n"), Int("i"), Int("s"), Int("i2"), Int("s2")

def valid(formula):
    sol = Solver()
    sol.add(Not(formula))
    return sol.check() == unsat

def check_invariant(inv):
    pre = n >= 0
    init = valid(Implies(pre, inv(0, 0)))
    step = valid(Implies(And(pre, inv(i, s), i < n, i2 == i + 1, s2 == s + 2), inv(i2, s2)))
    post = valid(Implies(And(pre, inv(i, s), Not(i < n)), s == 2 * n))
    return init, step, post

candidates = {                                   # e.g. proposed by an LLM
    "s == 2*i":               lambda i, s: s == 2 * i,
    "s == 2*i and i <= n":    lambda i, s: And(s == 2 * i, i <= n),
    "s >= 0 and i <= n":      lambda i, s: And(s >= 0, i <= n),
    "s == 2*n":               lambda i, s: s == 2 * n,
}
for name, inv in candidates.items():
    init, step, post = check_invariant(inv)
    verdict = "ACCEPT" if (init and step and post) else "reject"
    print(f"{name:24s} init={init!s:5s} step={step!s:5s} post={post!s:5s} -> {verdict}")

# ---- actual output ----
# new allows something old denied: ("s3:GetObject", "arn:aws:s3:::reports")
# old allows something new denied: None
# s == 2*i                 init=True  step=True  post=False -> reject
# s == 2*i and i <= n      init=True  step=True  post=True  -> ACCEPT
# s >= 0 and i <= n        init=True  step=True  post=False -> reject
# s == 2*n                 init=False step=False post=True  -> reject`,
    notes: [
      'Part 1: the missing slash means the new policy also matches buckets like reports-archive. Z3 returned the shortest such resource on this run; other Z3 versions may return a different witness (for example a longer bucket name or the ListBucket action). Any witness is a real over-permission.',
      'The reverse direction is unsat: everything the old policy allowed is still allowed, so the change is strictly more permissive. This is the "is my refactor safe" question Zelkova answers.',
      'Part 2: s == 2*i is inductive but too weak for the postcondition (it does not bound i, so at exit i could exceed n). Adding i <= n makes it sufficient. s == 2*n states the goal, not an invariant, and fails initiation. This is exactly the feedback you would return to the LLM.',
      'Real Zelkova also encodes Deny statements, condition keys, regular-expression wildcards and principals; the structure of the query is the same.'
    ]
  },
  lab: {
    title: 'Build the verifier half of an LLM invariant loop',
    prompt: 'The program is <code>i = 0; s = 0; while i &lt; n: i += 1; s += 3</code> with precondition <code>n &gt;= 0</code> and postcondition <code>s == 3 * n</code>. Implement <code>valid(formula)</code> (a formula is valid when its negation is unsat) and <code>check_invariant(inv)</code> returning the triple (init, step, post): init means pre implies inv(0, 0); step means pre, inv(i, s), the guard and the transition <code>i2 == i + 1, s2 == s + 3</code> imply inv(i2, s2); post means pre, inv(i, s) and the negated guard imply the postcondition. Expected output: <code>(True, True, False)</code> then <code>(True, True, True)</code>.',
    starter: `from z3 import Int, And, Not, Implies, Solver, unsat

# program: i = 0; s = 0; while i < n: i += 1; s += 3     pre: n >= 0   post: s == 3 * n
n, i, s, i2, s2 = Int("n"), Int("i"), Int("s"), Int("i2"), Int("s2")

def valid(formula):
    # TODO: formula is valid iff Not(formula) is unsat
    pass

def check_invariant(inv):
    pre = n >= 0
    # TODO: init, step, post
    return None

print(check_invariant(lambda i, s: s == 3 * i))
print(check_invariant(lambda i, s: And(s == 3 * i, i <= n)))
`,
    checks: [
      { re: 'sol\\.add\\(\\s*Not\\(\\s*formula\\s*\\)\\s*\\)|\\.add\\(\\s*Not\\(\\s*formula\\s*\\)\\s*\\)', flags: '', must: true, hint: 'In valid: add Not(formula) to a Solver', pass: 'negation asserted' },
      { re: '\\.check\\(\\)\\s*==\\s*unsat', flags: '', must: true, hint: 'valid means the negation is unsat: return sol.check() == unsat', pass: 'validity via unsat' },
      { re: 'Implies\\(\\s*pre\\s*,\\s*inv\\(\\s*0\\s*,\\s*0\\s*\\)\\s*\\)', flags: '', must: true, hint: 'init: Implies(pre, inv(0, 0))', pass: 'initiation check' },
      { re: 'i2\\s*==\\s*i\\s*\\+\\s*1\\s*,\\s*s2\\s*==\\s*s\\s*\\+\\s*3', flags: '', must: true, hint: 'step must include the transition i2 == i + 1, s2 == s + 3', pass: 'transition encoded' },
      { re: 'inv\\(\\s*i2\\s*,\\s*s2\\s*\\)', flags: '', must: true, hint: 'step concludes inv(i2, s2)', pass: 'preservation check' },
      { re: 'Not\\(\\s*i\\s*<\\s*n\\s*\\)', flags: '', must: true, hint: 'post assumes the negated guard: Not(i < n)', pass: 'exit condition' },
      { re: 's\\s*==\\s*3\\s*\\*\\s*n\\s*\\)', flags: '', must: true, hint: 'post concludes s == 3 * n', pass: 'postcondition check' },
      { re: 'TODO|\\bpass\\b', flags: '', must: false, hint: 'Replace the TODOs and the pass placeholder', pass: 'no placeholders' }
    ],
    run: 'Save as <code>inv_check.py</code>, run <code>pip install --user z3-solver</code> then <code>python3 inv_check.py</code>. Expected: <code>(True, True, False)</code> and <code>(True, True, True)</code>. Extension: wire it to an LLM. Ask a model for candidate invariants as Python lambda strings for this loop, parse each with a restricted evaluator (only i, s, n, And, Or, Not and arithmetic), check them with check_invariant, and feed back which of init/step/post failed. Track attempts per success.',
    solution: `from z3 import Int, And, Not, Implies, Solver, unsat

# program: i = 0; s = 0; while i < n: i += 1; s += 3     pre: n >= 0   post: s == 3 * n
n, i, s, i2, s2 = Int("n"), Int("i"), Int("s"), Int("i2"), Int("s2")

def valid(formula):
    sol = Solver()
    sol.add(Not(formula))
    return sol.check() == unsat

def check_invariant(inv):
    pre = n >= 0
    init = valid(Implies(pre, inv(0, 0)))
    step = valid(Implies(And(pre, inv(i, s), i < n, i2 == i + 1, s2 == s + 3), inv(i2, s2)))
    post = valid(Implies(And(pre, inv(i, s), Not(i < n)), s == 3 * n))
    return init, step, post

print(check_invariant(lambda i, s: s == 3 * i))
print(check_invariant(lambda i, s: And(s == 3 * i, i <= n)))
`,
    notes: [
      'This solution was run with z3-solver and printed (True, True, False) then (True, True, True).',
      'The three checks are exactly the Hoare-logic loop rule from the Hoare lesson, and the same checks Dafny generates through Boogie.',
      'In an LLM loop, return which check failed and, for step or post, the Z3 model as a counterexample state: a concrete hint for the next attempt.'
    ]
  },
  quiz: [
    {
      q: 'What does AWS Zelkova fundamentally do?',
      options: ['Fuzzes AWS APIs', 'Translates access policies into SMT formulas and answers questions about them as satisfiability queries, with example requests as witnesses', 'Proves the AWS kernel correct in Isabelle', 'Trains LLMs on IAM policies'],
      correct: 1,
      explain: 'Zelkova is policy semantics in SMT: sat means a witness request exists.'
    },
    {
      q: 'Which statement about Microsoft SAGE is accurate?',
      options: ['It proves the absence of bugs', 'It is whitebox fuzzing: symbolic execution of x86 traces, negating path constraints and solving with Z3 to produce new inputs', 'It is a theorem prover for Windows', 'It only works on source code'],
      correct: 1,
      explain: 'SAGE is concolic, bug-finding only, and works at the binary trace level.'
    },
    {
      q: 'An LLM-generated Dafny method verifies. What has been established?',
      options: ['The method meets the user\'s intent', 'The method satisfies its specification, as written, assuming no escape hatches (assume, verify false) were used; whether the spec captures intent is a separate question', 'The method is fast', 'Nothing'],
      correct: 1,
      explain: 'Verification is relative to the spec. Guard against spec weakening and escape hatches.'
    },
    {
      q: 'AlphaProof\'s IMO 2024 solutions are trusted because:',
      options: ['DeepMind reviewed them', 'They are Lean proofs checked by the Lean kernel', 'The model has high confidence', 'They matched official solutions word for word'],
      correct: 1,
      explain: 'The kernel check is what makes the output trustworthy, independent of the model.'
    },
    {
      q: 'You must find whether a new Raft-style leader election design can elect two leaders in one term. Best first tool?',
      options: ['Lean', 'TLA+ with TLC on a 3-node instance', 'Infer', 'CompCert'],
      correct: 1,
      explain: 'Design-level concurrency and failure interleavings on small instances: TLA+ and TLC.'
    }
  ],
  testFlow: {
    title: 'Interview scenario: choose and defend',
    start: 'q1',
    nodes: {
      q1: { q: 'Your team wants to stop misconfigured cloud firewall rules from exposing databases. Approach?', choices: [ { text: 'Encode rules and reachability in SMT and query "can any external address reach port 5432?"', to: 'q1ok' }, { text: 'Write Lean proofs for each rule change', to: 'q1bad' } ] },
      q1ok: { end: true, correct: true, text: 'Right: push-button SMT over a precise network semantics, with example packets as output (the Zelkova/Tiros pattern).', next: 'q2' },
      q1bad: { end: true, correct: false, text: 'Too expensive per change and requires experts. Automate with SMT.', retry: 'q1' },
      q2: { q: 'An LLM pipeline reports 90% verified Dafny programs. First question to ask?', choices: [ { text: 'Were specs frozen and escape hatches (assume, verify false) banned, and at what attempt budget?', to: 'q2ok' }, { text: 'Which GPU was used?', to: 'q2bad' } ] },
      q2ok: { end: true, correct: true, text: 'Yes: spec integrity and budget determine whether the number means anything.', next: 'q3' },
      q2bad: { end: true, correct: false, text: 'Hardware is irrelevant to whether the verification is meaningful.', retry: 'q2' },
      q3: { q: 'You need to ensure an optimizing compiler never miscompiles. What is the gold standard and its cost?', choices: [ { text: 'A CompCert-style machine-checked semantic preservation proof; very high effort, restricted to verified passes', to: 'q3ok' }, { text: 'Run Csmith for a week', to: 'q3bad' } ] },
      q3ok: { end: true, correct: true, text: 'Correct. Csmith-style testing is complementary and found the gaps in unverified parts.' },
      q3bad: { end: true, correct: false, text: 'Random testing finds bugs but cannot rule out miscompilation.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Quoting invented numbers about deployments ("Zelkova runs N billion queries"). Describe scale qualitatively unless you can cite the source.',
    'Saying a verified system "has no bugs". Say what was proved, relative to which model and trusted base.',
    'Evaluating an LLM + verifier system without freezing the specification or banning escape hatches; the model will find the loophole.',
    'Picking a proof assistant when a push-button tool would answer the question, or a bounded tool when the requirement is a proof.',
    'Treating "the verifier accepted it" as "the requirement is met": the spec still needs review and testing.'
  ],
  interview: [
    {
      q: 'Tell me about a real-world application of SMT solvers and why it works.',
      a: 'AWS Zelkova. IAM and S3 policies have a precise semantics, so Zelkova translates each policy into an SMT formula over the request fields, with string and regex constraints for wildcards and default-deny logic. Questions like "does this bucket policy allow public access" or "is the new policy more permissive than the old one" become satisfiability checks: unsat proves the property for all requests, and sat gives a concrete example request. It works because the domain is narrow and decidable, the answers are examples engineers understand, and it is hidden behind product features like Access Analyzer, so users never see logic. The hard engineering is solver performance and keeping the formal semantics aligned with the real policy evaluator.'
    },
    {
      q: 'Compare SAGE, KLEE and AFL as test generators.',
      a: 'AFL is coverage-guided greybox fuzzing: random mutations kept when they hit new edges; extremely fast, no solver, but stuck on magic values and checksums. KLEE is symbolic execution on LLVM bitcode with forking states and environment models: high coverage on small programs, but path explosion and the environment limit scale. SAGE is concolic whitebox fuzzing on x86 traces: start from a real run, collect path constraints, negate them generationally and solve with Z3; it scales to large binaries because concrete execution handles the parts it cannot model. Modern hybrids (Driller-style, SymCC) run a fuzzer and call concolic execution when coverage plateaus.'
    },
    {
      q: 'Explain a tradeoff: soundness vs usefulness in static analysis, using Infer as an example.',
      a: 'A sound analyzer reports every possible bug, and on real code that means many false positives, which developers learn to ignore. Infer deliberately accepts some unsoundness (for example unmodeled library behavior, bounded reasoning) to keep false positives low, and runs at diff time so reports are about code the developer just wrote. Fix rates are much higher for diff-time reports than for batch reports on old code. The tradeoff is that Infer cannot certify absence of bugs; for that you would use a sound tool (Astree for some embedded C, or a verifier) on a smaller, critical codebase.'
    },
    {
      q: 'Design: build a system where an LLM writes verified code. What are the components and the failure modes?',
      a: 'Inputs: a natural-language task and a human-reviewed formal spec (Dafny method signatures with requires/ensures, or a Lean theorem statement). Loop: the model proposes code plus annotations; guardrails reject any change to the spec and any escape hatch (assume, {:verify false}, sorry, new axioms); the verifier runs with a resource limit; errors and counterexamples go back to the model; repeat up to a budget, possibly sampling several candidates in parallel. Failure modes: weak or wrong specs (mitigate with spec review, back-translation and mutation testing of the spec), verifier timeouts and nondeterminism (fixed resource limits, retries counted honestly), and overfitting to a benchmark (held-out, decontaminated tasks). Metrics: verified success at a fixed budget, cost and latency, and spec-integrity violations.'
    },
    {
      q: 'What did AlphaProof show, and what did it not show?',
      a: 'It showed that reinforcement learning with a formal verifier in the loop can produce Lean proofs of hard competition problems: with AlphaGeometry 2 it reached a silver-medal standard on IMO 2024, and the proofs were kernel-checked, so their correctness does not depend on trusting the model. It relied on formalizing problems into Lean (autoformalization at scale for training; the competition problems were formalized for it), and some solutions took far longer than contest time. It did not show general mathematical research ability, and it does not remove the need for correct formal statements. The transferable lesson is verifier-guided search plus self-generated training data.'
    },
    {
      q: 'How would you choose between Dafny, Lean and CBMC for verifying a C-like parsing routine?',
      a: 'If the actual C code must be checked and bounded inputs are acceptable (say messages up to 64 bytes), CBMC: no rewrite, bit-precise semantics, memory-safety checks, and a full proof within the bound with --unwinding-assertions; it is what AWS uses for parts of its C code. If I can rewrite the parser and want unbounded functional correctness shipped as code, Dafny (or Verus for Rust), with specs and loop invariants, compiled to the target language. Lean if the core is a mathematical property worth a long-lived kernel-checked proof, such as a grammar\'s unambiguity, or if the team already works in Lean. In practice: CBMC first to find bugs fast, then decide whether a full proof is worth it.'
    },
    {
      q: 'How does your SE background connect to formal methods?',
      a: 'Test repair and flaky tests are about reasoning over many possible executions with incomplete information, which is exactly what solvers and model checkers are for. Concretely: symbolic execution or SMT can generate inputs that distinguish a correct repair from an overfitted one; model checking or systematic interleaving exploration can expose order-dependent and concurrency flakiness deterministically; and LLM-based repair benefits from a verifier or bounded model checker as the judge, with the same spec-integrity concerns as LLM test generation (a repair that weakens the assertion is not a repair). The evaluation skills carry over directly: budgets, contamination, and checking that the oracle cannot be gamed.'
    },
    {
      q: 'Explain what seL4 and CompCert proved and what they assume.',
      a: 'seL4: in Isabelle/HOL, the C implementation of the microkernel refines its abstract specification (functional correctness), with later proofs of integrity and confidentiality and translation validation of the compiled binary. Assumptions include the hardware model, some assembly and boot code, and the C semantics where binary validation is not used. CompCert: in Coq, every verified compiler pass preserves the semantics of the source program, so compiled code behaves as the C semantics says; assumptions include the formal C semantics itself and the unverified front and back ends. Both are expensive and both changed what people believe is possible: Csmith testing found no wrong-code bugs in CompCert\'s verified parts while finding many in mainstream compilers.'
    }
  ]
};
