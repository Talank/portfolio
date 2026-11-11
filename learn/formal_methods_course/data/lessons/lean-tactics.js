window.LESSONS = window.LESSONS || {};
window.LESSONS['lean-tactics'] = {
  id: 'lean-tactics',
  title: 'Lean 4 Tactics: intro, apply, exact, rw, simp, cases, induction, omega',
  category: 'Part 3 — Theorem Proving With Lean 4',
  timeMin: 50,
  summary: 'Writing proof terms by hand stops scaling quickly. Tactics let you build the term interactively: after <code>by</code>, Lean shows a goal (hypotheses above a turnstile, the target below), and each tactic transforms the goal into simpler subgoals until none remain. The kernel still checks the term that the tactics produced. This lesson covers the core tactics you need for nearly every proof (intro, exact, apply, rw, simp, cases, rcases/obtain, induction, constructor, omega, decide), how to read the infoview, how to structure multi-goal proofs, and the Mathlib power tools (ring, linarith, norm_num, aesop, exact?) that interviewers expect you to know by name.',
  goals: [
    'Read a Lean goal state (context, turnstile, target, multiple goals) and predict how a tactic changes it',
    'Use intro, exact, apply, constructor, left/right, cases and obtain to work with implications, and, or and exists',
    'Rewrite with rw (including right-to-left and at hypotheses), and simplify with simp, simp only and simp at',
    'Prove properties of recursive functions with induction ... with | zero => ... | succ n ih => ..., and finish arithmetic with omega',
    'Pick the right automation: decide, omega, simp, and Mathlib\'s ring, linarith, norm_num, aesop, exact?'
  ],
  concept: [
    {
      h: 'Goals and the infoview',
      p: [
        'Inside <code>by</code>, the infoview shows one or more goals. Each goal is a list of hypotheses (names with types) and, after <code>⊢</code>, the target you must prove. A tactic replaces the current goal with zero or more new goals. The proof is done when no goals remain ("No goals"). If a tactic block ends with goals left, Lean reports "unsolved goals" and prints them.',
        'Structure matters once there are several goals: <code>·</code> (a centered dot, typed <code>\\.</code>) focuses on the first goal and requires you to close it; <code>t1 &lt;;&gt; t2</code> runs t2 on every goal t1 produced; <code>all_goals t</code> and <code>any_goals t</code> do what they say; <code>case inl h =&gt; ...</code> selects a goal by tag. <code>sorry</code> closes any goal (with a warning), useful as a placeholder while you sketch.'
      ],
      code: `theorem and_swap (p q : Prop) : p ∧ q → q ∧ p := by
  intro h
  -- p q : Prop
  -- h : p ∧ q
  -- ⊢ q ∧ p
  constructor
  -- two goals: ⊢ q   and   ⊢ p
  · exact h.2
  · exact h.1`
    },
    {
      h: 'The logical core: intro, exact, apply, constructor, cases',
      p: [
        '<div class="cmp-wrap"><table class="cmp"><tr><th>Goal or hypothesis shape</th><th>Introduce (goal)</th><th>Use (hypothesis h)</th></tr><tr><td><code>p → q</code>, <code>∀ x, P x</code></td><td><code>intro h</code> / <code>intro x</code></td><td><code>apply h</code>, <code>exact h hp</code>, <code>specialize h a</code></td></tr><tr><td><code>p ∧ q</code></td><td><code>constructor</code> or <code>exact ⟨hp, hq⟩</code></td><td><code>obtain ⟨hp, hq⟩ := h</code>, or <code>h.1</code>, <code>h.2</code></td></tr><tr><td><code>p ∨ q</code></td><td><code>left</code> / <code>right</code></td><td><code>cases h with | inl hp => ... | inr hq => ...</code></td></tr><tr><td><code>∃ x, P x</code></td><td><code>exists w</code> or <code>exact ⟨w, hw⟩</code> (Mathlib: <code>use w</code>)</td><td><code>obtain ⟨w, hw⟩ := h</code></td></tr><tr><td><code>p ↔ q</code></td><td><code>constructor</code> (two implications)</td><td><code>h.mp</code>, <code>h.mpr</code>, or <code>rw [h]</code></td></tr><tr><td><code>False</code>, <code>¬p</code></td><td><code>intro hp</code> for ¬p (it is p → False)</td><td><code>contradiction</code>, <code>exact absurd hp hnp</code>, <code>cases h</code> on False</td></tr><tr><td><code>a = b</code></td><td><code>rfl</code>, <code>rw</code>, <code>simp</code>, <code>omega</code></td><td><code>rw [h]</code>, <code>subst h</code>, <code>simp [h]</code></td></tr></table></div>',
        '<b>exact e</b> closes the goal with a term of exactly the target type. <b>apply f</b> works backwards: if <code>f : a → b → c</code> and the goal is <code>c</code>, it leaves goals <code>a</code> and <code>b</code>. <b>intro</b> moves a hypothesis or a universally quantified variable from the target into the context. <b>cases</b> splits on the constructors of an inductive value; <b>rcases</b> and <b>obtain</b> do nested destructuring with patterns like <code>⟨hp, hq | hr⟩</code>. <code>by_cases h : p</code> splits on whether p holds.'
      ],
      code: `theorem or_swap (p q : Prop) : p ∨ q → q ∨ p := by
  intro h
  cases h with
  | inl hp => right; exact hp
  | inr hq => left; exact hq

example (p q r : Prop) (hpq : p → q) (hqr : q → r) (hp : p) : r := by
  apply hqr        -- ⊢ q
  apply hpq        -- ⊢ p
  exact hp

example (p q r : Prop) (h : p ∧ (q ∨ r)) : (p ∧ q) ∨ (p ∧ r) := by
  obtain ⟨hp, hq | hr⟩ := h
  · left; exact ⟨hp, hq⟩
  · right; exact ⟨hp, hr⟩

example : ∃ n : Nat, n * 3 = 12 := by
  exists 4`
    },
    {
      h: 'Rewriting and simplification: rw, simp, simp only',
      p: [
        '<code>rw [h]</code> with <code>h : a = b</code> replaces occurrences of a with b in the goal (the first instance it finds, with all its occurrences); <code>rw [← h]</code> rewrites right to left; <code>rw [h] at h2</code> rewrites a hypothesis. rw tries <code>rfl</code> afterwards, so it closes goals that become syntactically trivial. It fails if the pattern does not appear literally (up to instances), which is the most common rw error: "did not find instance of the pattern".',
        '<code>simp</code> rewrites with every lemma tagged <code>@[simp]</code>, plus the ones you pass in brackets, repeatedly, to a normal form. <code>simp [f]</code> also unfolds definition f using its equation lemmas. <code>simp at h</code> simplifies a hypothesis; <code>simp at *</code> everything. <code>simp only [l1, l2]</code> uses only the listed lemmas, which makes proofs stable when the simp set changes between library versions. <code>simp?</code> prints the <code>simp only</code> call that would do the same job: run it once, then paste the result.',
        'Use rw when you want one precise step; simp when you want normalization and do not care about the path. A non-terminal plain <code>simp</code> (one that does not close the goal) is considered bad style in Mathlib for exactly the brittleness reason.'
      ],
      code: `example (a b c : Nat) (h1 : a = b) (h2 : b = c) : a = c := by
  rw [h1, h2]                  -- ⊢ c = c, closed by rfl

example (a b : Nat) (h : a = b) : b = a := by
  rw [← h]                     -- replaces b by a: ⊢ a = a

example (xs : List Nat) (h : xs ++ [] = [1, 2]) : xs.length = 2 := by
  simp at h                    -- h : xs = [1, 2]   (List.append_nil is a simp lemma)
  simp [h]                     -- ⊢ [1, 2].length = 2, computed`
    },
    {
      h: 'Induction',
      p: [
        '<code>induction n with | zero => ... | succ n ih => ...</code> splits a Nat goal into the base case and the step case, where <code>ih</code> is the statement for n and the goal is for n + 1. For lists: <code>| nil => ... | cons x xs ih => ...</code>. For your own inductive types the case names are the constructor names, and there is one induction hypothesis per recursive argument.',
        'The standard rhythm for a property of a recursive function: induction on the argument the function recurses on; in each case unfold the function one step (<code>simp only [f]</code> or <code>rw [f]</code>); use the induction hypothesis (<code>rw [ih]</code>, <code>simp [ih]</code>, or let <code>omega</code> pick it up from the context); close what remains with arithmetic or list lemmas.',
        'Two tactics are worth knowing about here. <code>show t</code> replaces the goal with a definitionally equal one, which is how you put a goal into the shape rw expects. And recent Lean releases display Nat induction goals with <code>0</code> and <code>n + 1</code>; older ones showed <code>Nat.zero</code> and <code>Nat.succ n</code>. If an older tutorial\'s rw fails on succ, that is usually why.'
      ],
      code: `theorem my_zero_add (n : Nat) : 0 + n = n := by
  induction n with
  | zero => rfl
  | succ n ih =>
    show 0 + n + 1 = n + 1      -- definitionally equal to 0 + (n + 1) = n + 1
    rw [ih]

def double : Nat → Nat
  | 0     => 0
  | n + 1 => double n + 2

theorem double_eq (n : Nat) : double n = 2 * n := by
  induction n with
  | zero => rfl
  | succ n ih =>
    simp only [double]          -- ⊢ double n + 2 = 2 * (n + 1)
    omega                       -- uses ih : double n = 2 * n from the context

theorem len_append {α : Type} (xs ys : List α) :
    (xs ++ ys).length = xs.length + ys.length := by
  induction xs with
  | nil => simp
  | cons x xs ih =>
    simp only [List.cons_append, List.length_cons]
    omega`
    },
    {
      h: 'Decision procedures and automation',
      p: [
        '<b>omega</b> (core Lean) decides linear arithmetic over Nat and Int: +, -, multiplication by constants, / and % by constants, &lt;, ≤, =, and the logical connectives. It reads hypotheses from the context and treats other terms (like <code>double n</code> or <code>xs.length</code>) as opaque atoms. It does not do nonlinear arithmetic (x * y).',
        '<b>decide</b> evaluates a <code>Decidable</code> instance: closed, finite facts only. <b>rfl</b> closes definitional equalities. <b>trivial</b> and <b>assumption</b> close easy goals. <b>exact?</b> searches the library for a lemma that closes the goal and prints it, and <b>apply?</b> suggests lemmas that make progress (these ship with Mathlib and, in recent releases, with core).',
        'Mathlib adds: <b>ring</b> (equalities in commutative rings, so (a + b)^2 expansions), <b>linarith</b> (linear arithmetic over ordered fields, from hypotheses), <b>nlinarith</b> (with products of hypotheses), <b>norm_num</b> (numeric normalization including divisibility and primes), <b>positivity</b>, <b>field_simp</b>, <b>use</b>, <b>push_neg</b>, <b>gcongr</b>, and <b>aesop</b> (a general proof search over rules). Knowing which one fits the goal is most of the skill.'
      ],
      code: `example (n : Nat) (h : n + 1 = 0) : False := by omega
example (n : Nat) : n % 2 = 0 ∨ n % 2 = 1 := by omega
example : 2 ^ 10 = 1024 := by decide

example (p : Prop) [Decidable p] (q : Prop) (h1 : p → q) (h2 : ¬p → q) : q := by
  by_cases hp : p
  · exact h1 hp
  · exact h2 hp

example (a b c : Nat) (h1 : a < b) (h2 : b ≤ c) : a < c := by
  calc a < b := h1
    _ ≤ c := h2

-- with Mathlib:
-- import Mathlib.Tactic
-- example (a b : ℤ) : (a + b)^2 = a^2 + 2*a*b + b^2 := by ring
-- example (x y : ℚ) (h1 : 2*x + y = 4) (h2 : x - y = -1) : x = 1 := by linarith
-- example : (17 : ℕ) ∣ 289 := by norm_num
-- example (a b : ℕ) (h : a ≤ b) : ∃ c, b = a + c := by
--   use b - a
--   omega`
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The parts that separate someone who has used Lean from someone who has read about it: what tactics really produce, how simp decides what to do, why induction hypotheses are sometimes too weak, and how to get unstuck.',
    sections: [
      {
        h: 'Tactics build terms',
        p: [
          'A tactic block is elaborated into an ordinary proof term, with metavariables standing for the goals still open. <code>intro h</code> builds <code>fun h => ?_</code>; <code>apply f</code> builds <code>f ?a ?b</code>; <code>constructor</code> builds <code>And.intro ?_ ?_</code>; <code>induction</code> builds an application of the recursor (<code>Nat.rec</code>). <code>#print and_swap</code> shows the resulting term. This is why tactic proofs and term proofs are interchangeable, and why <code>exact</code> can take any term and <code>by</code> can appear inside any term.'
        ]
      },
      {
        h: 'How simp works, and how it goes wrong',
        p: [
          'simp uses lemmas of the form <code>lhs = rhs</code> (or <code>p ↔ q</code>) oriented left to right, and rewrites bottom-up until no lemma applies. It can also use conditional lemmas if it can discharge the side conditions, and hypotheses you pass in. For this to terminate, the simp set must be oriented toward a normal form: <code>xs ++ [] = xs</code> is a good simp lemma, <code>a + b = b + a</code> would loop (simp handles commutativity specially with ordered rewriting, but you should not add such lemmas casually).',
          'Common failures: simp makes no progress (the lemma you need is not tagged simp: pass it in brackets); simp rewrites the goal into an unexpected form that later tactics do not match (use simp only); simp loops or times out (you passed a hypothesis that rewrites in a cycle, like <code>h : f x = g (f x)</code>). <code>set_option trace.Meta.Tactic.simp.rewrite true in</code> before a theorem shows every rewrite simp performed.'
        ]
      },
      {
        h: 'When the induction hypothesis is too weak: generalizing',
        p: [
          'Induction fixes everything else in the goal. If a function has an accumulator, the IH is about the original accumulator, and the step case needs it for a different one. The fix is <code>induction xs generalizing acc</code>, which keeps acc universally quantified in the IH. This is the theorem-prover version of strengthening a loop invariant, and it is the most common reason a "simple" induction gets stuck.'
        ],
        code: `def revAcc {α : Type} : List α → List α → List α
  | [],      acc => acc
  | x :: xs, acc => revAcc xs (x :: acc)

theorem revAcc_eq {α : Type} (xs acc : List α) :
    revAcc xs acc = xs.reverse ++ acc := by
  induction xs generalizing acc with
  | nil => simp [revAcc]
  | cons x xs ih =>
    simp [revAcc, ih]       -- ih : ∀ acc, revAcc xs acc = xs.reverse ++ acc
-- without generalizing, ih mentions only the original acc,
-- but the step needs it for (x :: acc), and the proof gets stuck.`
      },
      {
        h: 'Getting unstuck: a checklist',
        p: [
          '<ul><li>Read the goal after every tactic. Most failures are a goal in a different shape than you assumed.</li><li>Try <code>exact?</code> on small lemmas; Mathlib or core almost certainly has it. Names follow conventions: <code>Nat.add_comm</code>, <code>List.length_append</code>, <code>List.map_map</code>, <code>Nat.lt_of_lt_of_le</code>.</li><li>If rw cannot find the pattern, the term is probably in a different but definitionally equal form: use <code>show</code>, <code>unfold</code>, or <code>simp only [f]</code> first.</li><li>Make intermediate facts explicit with <code>have h : stmt := by ...</code>.</li><li>If the IH is not usable, generalize variables or prove a more general lemma first.</li><li>Leave <code>sorry</code> for subgoals to check the overall structure, then fill them in one at a time.</li></ul>'
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: 'Zoro\'s Three-Sword Map of the Goal',
      text: [
        'Zoro always gets lost, so Nami gives him a rule: before every move, look at the single target written on the board, and the list of things already in his hands. Each move must turn the target into smaller targets until none are left.',
        'If the target is "if you reach the dock, find the ship", he first steps onto the dock (intro), and now the dock is in his hands. If the target is "find Luffy and find Sanji", he splits it into two separate searches (constructor). If he is told "Chopper is on the hill or in the cave", he searches both places, one at a time (cases). When the target exactly matches something in his hands, he is done (exact).',
        'For the stairs of Enies Lobby, Robin tells him: show you can climb the first step, and show that if you are on any step you can reach the next one. That covers every step at once (induction). And when it is just counting, Franky\'s calculator settles it instantly (omega).'
      ]
    },
    sitcom: {
      show: 'Friends',
      title: 'Ross Proves He Was On a Break',
      text: [
        'Ross writes his argument on a whiteboard as a target with the facts he already has listed above a line. Each time he applies a rule, Chandler erases the target and writes the smaller ones it leaves. When Rachel says "you were on a break or you were not", Ross has to handle both branches separately, and he does not get to pick one.',
        'Ross gets stuck because his inductive argument only works for the exact day he started with; Phoebe tells him to generalize the claim to any starting day first. Then it goes through. Monica summarizes: "So you split, rewrote, and inducted. You still lose."'
      ]
    },
    why: 'Zoro\'s rule is the goal-directed style of tactic proving: context in hand, target on the board, each tactic replaces the target with subgoals. intro, constructor, cases and exact match the shapes of implication, and, or and an exact match. The stairs are induction (base plus step), Franky\'s calculator is omega, and Phoebe\'s advice is generalizing before induction.'
  },
  storyAnim: {
    h: 240,
    props: [
      { id: 'goal', emoji: '🎯', label: '⊢ p ∧ q → q ∧ p', x: 50, y: 12 },
      { id: 'hands', emoji: '🤲', label: 'context: (empty)', x: 14, y: 84 },
      { id: 'g1', emoji: '📌', label: '⊢ q', x: 72, y: 60 },
      { id: 'g2', emoji: '📌', label: '⊢ p', x: 90, y: 60 },
      { id: 'kernel', emoji: '🪨', label: 'kernel', x: 88, y: 86 }
    ],
    actors: [
      { id: 'zoro', emoji: '⚔️', label: 'Zoro', x: 20, y: 40 },
      { id: 'nami', emoji: '🧭', label: 'Nami (infoview)', x: 50, y: 40 }
    ],
    steps: [
      { c: 'The goal is an implication. Nami reads it off the board for Zoro.', p: { goal: 'lit' } },
      { c: 'intro h: Zoro steps onto the dock. h : p ∧ q goes into his hands, and the target becomes q ∧ p.', p: { hands: 'lit' }, l: { hands: 'h : p ∧ q', goal: '⊢ q ∧ p' } },
      { c: 'constructor: the target splits into two goals, q and p.', p: { g1: 'lit', g2: 'lit', goal: 'dim' } },
      { c: 'exact h.2 closes the first goal: the right half of h is exactly q.', a: { zoro: [70, 46] }, p: { g1: 'good' } },
      { c: 'exact h.1 closes the second goal. "No goals."', a: { zoro: [88, 46] }, p: { g2: 'good' } },
      { c: 'The tactics built the term fun h => ⟨h.2, h.1⟩, and the kernel checks it.', p: { kernel: 'good', goal: 'good' }, l: { kernel: 'kernel: OK' } }
    ]
  },
  conceptFlow: {
    title: 'The rhythm of an induction proof about a recursive function',
    intro: 'Example: double_eq : double n = 2 * n.',
    stages: [
      { label: 'Split', nodes: [ { id: 'ind', text: 'induction n with' }, { id: 'base', text: '| zero =>\n⊢ double 0 = 2 * 0' }, { id: 'step', text: '| succ n ih =>\n⊢ double (n+1) = 2*(n+1)' } ] },
      { label: 'Unfold', nodes: [ { id: 'rfl', text: 'rfl\n(both sides compute to 0)' }, { id: 'unfold', text: 'simp only [double]\n⊢ double n + 2 = 2*(n+1)' } ] },
      { label: 'Use IH', nodes: [ { id: 'ih', text: 'ih : double n = 2 * n\n(in context)' } ] },
      { label: 'Close', nodes: [ { id: 'omega', text: 'omega\nlinear arithmetic' }, { id: 'qed', text: 'No goals' } ] }
    ],
    steps: [
      { active: ['ind'], note: 'Induct on the argument the function recurses on.' },
      { active: ['base'], note: 'Base case: the goal with n replaced by 0.' },
      { active: ['rfl'], note: 'Both sides reduce by computation, so rfl closes it.' },
      { active: ['step'], note: 'Step case: prove the statement for n + 1, with ih for n in the context.' },
      { active: ['unfold'], note: 'Unfold one step of the definition using its equation lemma.' },
      { active: ['ih'], note: 'The remaining goal mentions double n, which ih relates to 2 * n.' },
      { active: ['omega'], note: 'omega treats double n as an atom, reads ih, and solves the linear arithmetic.' },
      { active: ['qed'], note: 'All goals closed; the kernel checks the term built from Nat.rec.' }
    ]
  },
  tech: [
    {
      q: 'What is the difference between exact, apply and refine?',
      a: '<code>exact e</code> requires e to fully match the goal, with nothing left over. <code>apply f</code> unifies the conclusion of f with the goal and creates new goals for every premise it could not infer. <code>refine e</code> takes a term with explicit holes <code>?_</code> and turns each hole into a goal, so <code>refine ⟨?_, ?_⟩</code> is like constructor, and <code>refine ⟨3, ?_⟩</code> provides a witness and leaves the proof.'
    },
    {
      q: 'Why does rw sometimes fail with "motive is not type correct"?',
      a: 'rw abstracts every occurrence of the pattern and rebuilds the goal with Eq.mpr. If some other part of the goal depends on the term being rewritten (for example a proof that an index is in bounds mentions the length you are rewriting), the abstracted goal no longer type checks. Workarounds: simp (which can handle some dependencies), rewriting a more specific term, or subst when the hypothesis is a variable equation.'
    },
    {
      q: 'What does omega actually decide?',
      a: 'Presburger arithmetic: first-order formulas over integers and naturals with addition, multiplication by literals, and comparisons, which is decidable. The Lean implementation handles the quantifier-free fragment from goals and hypotheses, including Nat subtraction (by case splitting), / and % by literals, and ∧ ∨ ¬ →. Anything else (function applications, x * y) becomes an atom. It is a complete procedure for that fragment, unlike simp.'
    },
    {
      q: 'Why do Mathlib reviewers dislike non-terminal simp?',
      a: 'A simp that does not close the goal leaves it in whatever normal form the current simp set produces. When the library adds or changes a simp lemma, that form changes and the next tactic (often a rw) breaks, in a file nobody touched. Replacing it with the <code>simp only [...]</code> list from <code>simp?</code> pins the behavior. Terminal simp is fine: if it still closes the goal, the path does not matter.'
    }
  ],
  code: {
    title: 'A tactic workout file',
    intro: 'Core Lean 4 only. Paste into live.lean-lang.org or a <code>lake new</code> project and step through it with the infoview open. Lean is not installed in this environment, so this was written carefully from Lean 4 semantics rather than run; comments show the expected goals.',
    code: `-- Tactics.lean

-- 1. logic
theorem and_swap (p q : Prop) : p ∧ q → q ∧ p := by
  intro ⟨hp, hq⟩            -- intro can destructure directly
  exact ⟨hq, hp⟩

theorem imp_chain (p q r : Prop) : (p → q) → (q → r) → p → r := by
  intro hpq hqr hp
  exact hqr (hpq hp)

theorem not_or_split (p q : Prop) (h : ¬(p ∨ q)) : ¬p ∧ ¬q := by
  constructor
  · intro hp; exact h (Or.inl hp)
  · intro hq; exact h (Or.inr hq)

-- 2. existentials
theorem exists_double (n : Nat) : ∃ m, m = n + n := ⟨n + n, rfl⟩

example (h : ∃ k : Nat, k > 5) : ∃ k : Nat, k > 3 := by
  obtain ⟨k, hk⟩ := h
  exact ⟨k, by omega⟩

-- 3. induction on Nat
def sumTo : Nat → Nat
  | 0     => 0
  | n + 1 => sumTo n + (n + 1)

theorem sumTo_ge (n : Nat) : sumTo n ≥ n := by
  induction n with
  | zero => simp [sumTo]
  | succ n ih =>
    simp only [sumTo]        -- ⊢ sumTo n + (n + 1) ≥ n + 1
    omega

-- 4. induction on List, with rw and simp
def count (p : Nat → Bool) : List Nat → Nat
  | []      => 0
  | x :: xs => (if p x then 1 else 0) + count p xs

theorem count_le_length (p : Nat → Bool) (xs : List Nat) :
    count p xs ≤ xs.length := by
  induction xs with
  | nil => simp [count]
  | cons x xs ih =>
    simp only [count, List.length_cons]
    split <;> omega          -- one goal per branch of the if

theorem count_append (p : Nat → Bool) (xs ys : List Nat) :
    count p (xs ++ ys) = count p xs + count p ys := by
  induction xs with
  | nil => simp [count]
  | cons x xs ih =>
    simp only [List.cons_append, count, ih]
    omega                    -- reassociate the sum

#eval count (· > 2) [1, 5, 3, 0, 7]      -- 3`,
    notes: [
      'In count_le_length, after unfolding, the goal contains <code>if p x = true then 1 else 0</code>; <code>split</code> creates one goal per branch, and <code>&lt;;&gt; omega</code> closes both with ih from the context.',
      'In count_append, <code>simp only [..., ih]</code> rewrites count p (xs ++ ys) using the induction hypothesis; omega then handles (a + (b + c)) = (a + b) + c, treating the if-expression as an atom.',
      'Not run here (Lean is not installed). If a simp only call leaves the goal in a slightly different shape on your toolchain, replace it with <code>simp [count]</code> and inspect the goal, or use <code>simp?</code> to see what simp did.'
    ]
  },
  lab: {
    title: 'Three proofs, three styles',
    prompt: 'Prove: (1) <code>theorem and_assoc_r (p q r : Prop) : (p ∧ q) ∧ r → p ∧ (q ∧ r)</code> using <code>intro</code> and <code>obtain</code>; (2) <code>double_eq</code> by induction with <code>simp only [double]</code> and <code>omega</code>; (3) <code>len_append</code> by list induction with cases <code>nil</code> and <code>cons x xs ih</code>. No sorry.',
    starter: `theorem and_assoc_r (p q r : Prop) : (p ∧ q) ∧ r → p ∧ (q ∧ r) := by
  sorry

def double : Nat → Nat
  | 0     => 0
  | n + 1 => double n + 2

theorem double_eq (n : Nat) : double n = 2 * n := by
  sorry

theorem len_append {α : Type} (xs ys : List α) :
    (xs ++ ys).length = xs.length + ys.length := by
  sorry
`,
    checks: [
      { re: 'intro\\s+h', flags: '', must: true, hint: 'Start (1) with intro h', pass: 'intro' },
      { re: 'obtain\\s*⟨\\s*⟨\\s*hp\\s*,\\s*hq\\s*⟩\\s*,\\s*hr\\s*⟩\\s*:=\\s*h', flags: '', must: true, hint: 'Destructure the nested pair: obtain ⟨⟨hp, hq⟩, hr⟩ := h', pass: 'nested obtain' },
      { re: 'exact\\s*⟨\\s*hp\\s*,\\s*hq\\s*,\\s*hr\\s*⟩|exact\\s*⟨\\s*hp\\s*,\\s*⟨\\s*hq\\s*,\\s*hr\\s*⟩\\s*⟩', flags: '', must: true, hint: 'Rebuild: exact ⟨hp, hq, hr⟩ (anonymous constructors flatten to the right)', pass: 'rebuilt the conjunction' },
      { re: 'induction\\s+n\\s+with[\\s\\S]*\\|\\s*zero\\s*=>[\\s\\S]*\\|\\s*succ\\s+n\\s+ih\\s*=>', flags: '', must: true, hint: 'induction n with | zero => ... | succ n ih => ...', pass: 'Nat induction structure' },
      { re: 'simp\\s+only\\s*\\[\\s*double\\s*\\]', flags: '', must: true, hint: 'Unfold one step: simp only [double]', pass: 'unfolded double' },
      { re: 'induction\\s+xs\\s+with[\\s\\S]*\\|\\s*nil\\s*=>[\\s\\S]*\\|\\s*cons\\s+x\\s+xs\\s+ih\\s*=>', flags: '', must: true, hint: 'induction xs with | nil => ... | cons x xs ih => ...', pass: 'List induction structure' },
      { re: 'omega[\\s\\S]*omega', flags: '', must: true, hint: 'Use omega to close the arithmetic in both inductions', pass: 'omega used' },
      { re: '\\bsorry\\b', flags: '', must: false, hint: 'Remove every sorry', pass: 'no sorry' }
    ],
    run: 'With elan installed: <code>lake new tactlab</code>, paste into a .lean file in the project, and open it in VS Code with the Lean 4 extension; put the cursor after each tactic to see the goal change. Or paste into live.lean-lang.org. To check from the command line, run <code>lake env lean YourFile.lean</code> inside the project: no output means everything checked. Then try deleting the omega in double_eq to see the unsolved goal <code>⊢ double n + 2 = 2 * (n + 1)</code>.',
    solution: `theorem and_assoc_r (p q r : Prop) : (p ∧ q) ∧ r → p ∧ (q ∧ r) := by
  intro h
  obtain ⟨⟨hp, hq⟩, hr⟩ := h
  exact ⟨hp, hq, hr⟩

def double : Nat → Nat
  | 0     => 0
  | n + 1 => double n + 2

theorem double_eq (n : Nat) : double n = 2 * n := by
  induction n with
  | zero => rfl
  | succ n ih =>
    simp only [double]
    omega

theorem len_append {α : Type} (xs ys : List α) :
    (xs ++ ys).length = xs.length + ys.length := by
  induction xs with
  | nil => simp
  | cons x xs ih =>
    simp only [List.cons_append, List.length_cons]
    omega
`,
    notes: [
      '<code>⟨hp, hq, hr⟩</code> is sugar for <code>⟨hp, ⟨hq, hr⟩⟩</code>: anonymous constructors associate to the right, matching p ∧ (q ∧ r).',
      'In the nil case of len_append, simp uses List.nil_append, List.length_nil and Nat.zero_add (all simp lemmas). In fact plain simp proves the whole theorem, because List.length_append is itself a simp lemma; the induction is the exercise.',
      'omega closes <code>(xs ++ ys).length + 1 = xs.length + 1 + ys.length</code> because ih, in the context, equates the atom (xs ++ ys).length with xs.length + ys.length.',
      'Not run here (Lean is not installed); these are standard core-Lean proofs.'
    ]
  },
  quiz: [
    {
      q: 'The goal is p → q. Which tactic makes progress?',
      options: ['constructor', 'intro hp', 'left', 'cases'],
      correct: 1,
      explain: 'intro moves the premise into the context as hp : p, leaving ⊢ q.'
    },
    {
      q: 'You have h : a = b and want to replace b with a in the goal. Which?',
      options: ['rw [h]', 'rw [← h]', 'simp at h', 'exact h'],
      correct: 1,
      explain: 'rw [h] rewrites a to b. ← reverses the direction, rewriting b to a.'
    },
    {
      q: 'omega fails on ⊢ x * y = y * x for variables x y. Why?',
      options: ['omega is buggy', 'Multiplication of two variables is nonlinear, outside omega\'s Presburger fragment', 'The goal is false', 'omega only works on Int'],
      correct: 1,
      explain: 'Use Nat.mul_comm, or ring from Mathlib. omega handles multiplication only by literals.'
    },
    {
      q: 'An induction proof about a function with an accumulator gets stuck because the IH is about the wrong accumulator. Fix?',
      options: ['Use omega', 'induction xs generalizing acc', 'Use decide', 'Add sorry'],
      correct: 1,
      explain: 'generalizing keeps acc universally quantified in the induction hypothesis.'
    },
    {
      q: 'Why replace simp with the output of simp? in a library proof?',
      options: ['It is faster to type', 'simp only [...] is stable against future changes to the global simp set', 'simp? proves more', 'It removes axioms'],
      correct: 1,
      explain: 'Pinning the lemma list prevents library changes from altering the intermediate goal.'
    }
  ],
  testFlow: {
    title: 'Pick the tactic',
    start: 'q1',
    nodes: {
      q1: { q: 'Hypothesis h : p ∨ q, goal r. First move?', choices: [ { text: 'cases h with | inl hp => ... | inr hq => ...', to: 'q1ok' }, { text: 'left', to: 'q1bad' } ] },
      q1ok: { end: true, correct: true, text: 'Right: to use an Or you must handle both possibilities.', next: 'q2' },
      q1bad: { end: true, correct: false, text: 'left works on an Or goal. Here the Or is a hypothesis: split it with cases.', retry: 'q1' },
      q2: { q: 'Goal: ⊢ double n + 2 = 2 * (n + 1), with ih : double n = 2 * n. Fastest finish?', choices: [ { text: 'omega', to: 'q2ok' }, { text: 'decide', to: 'q2bad' } ] },
      q2ok: { end: true, correct: true, text: 'Yes: linear arithmetic with an atom and a hypothesis is omega\'s home ground.', next: 'q3' },
      q2bad: { end: true, correct: false, text: 'decide needs a closed proposition; n is a variable.', retry: 'q2' },
      q3: { q: 'With Mathlib, goal: (a + b)^2 = a^2 + 2*a*b + b^2 over ℤ. Tactic?', choices: [ { text: 'ring', to: 'q3ok' }, { text: 'linarith', to: 'q3bad' } ] },
      q3ok: { end: true, correct: true, text: 'Correct: ring normalizes polynomial identities in commutative rings.' },
      q3bad: { end: true, correct: false, text: 'linarith combines linear hypotheses. This is a polynomial identity: ring.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Using Lean 3 tactic syntax: cases h with hp hq, induction n with n ih, begin ... end, or { } blocks for focusing. Lean 4 uses with | ctor args => and the · bullet.',
    'Expecting rw to see through definitions. It matches syntactically (up to instances); unfold or simp only [f] first, or use show to restate the goal.',
    'Writing a non-terminal simp and building on its output; it breaks when the simp set changes.',
    'Inducting on the wrong variable, or without generalizing an accumulator, and fighting an IH that cannot apply.',
    'Treating omega or decide as general automation: omega is linear integer arithmetic only, decide is closed and finite only.'
  ],
  interview: [
    {
      q: 'Walk me through proving that list append length adds, in Lean.',
      a: 'Induction on xs, the list append recurses on. Nil case: [] ++ ys reduces to ys and [].length is 0, so simp (using nil_append, length_nil, zero_add) closes it. Cons case: the goal is (x :: xs ++ ys).length = (x :: xs).length + ys.length, and ih says (xs ++ ys).length = xs.length + ys.length. Unfold with simp only [List.cons_append, List.length_cons] to get (xs ++ ys).length + 1 = xs.length + 1 + ys.length, and omega finishes using ih from the context. In practice List.length_append is already a simp lemma, so simp would do it in one step.'
    },
    {
      q: 'Explain the difference between rw and simp, and when you would use each.',
      a: 'rw performs one targeted rewrite with a given equation, left to right or right to left, on the first matching instance; it is precise and predictable, fails loudly if the pattern is absent, and then tries rfl. simp rewrites repeatedly with a whole set of oriented lemmas (the simp set plus extras) to a normal form, can use conditional lemmas and hypotheses, and can close goals. Use rw for a specific step you have in mind, simp for normalization or closing routine goals, and simp only with an explicit list when the proof should be robust against library changes.'
    },
    {
      q: 'Explain a tradeoff: automation (simp, omega, aesop) vs explicit proof steps.',
      a: 'Automation makes proofs short and quick to write, and terminal automation is robust because only the result matters. But it can be slow, can fail silently after library changes when non-terminal, and hides the argument, which makes proofs hard to read and repair. Explicit steps (rw, exact, calc) are verbose but stable and readable. A good pattern: use automation for leaf goals (omega for arithmetic, simp to close), keep the proof skeleton explicit with have and calc, and pin intermediate simp calls with simp only.'
    },
    {
      q: 'What is omega, and why is it in core Lean?',
      a: 'omega is a decision procedure for linear arithmetic over Int and Nat (Presburger arithmetic, quantifier-free fragment), based on Pugh\'s Omega test. It takes the goal and hypotheses, normalizes Nat subtraction, division and modulo by literals, and either proves the goal or reports failure, treating other terms as atoms. It is in core because nearly every program proof has index and length side conditions, and the Lean core team wanted those discharged automatically without depending on Mathlib.'
    },
    {
      q: 'Whiteboard: prove that reversing with an accumulator equals reverse ++ acc. Why does naive induction fail?',
      a: 'Define revAcc [] acc = acc and revAcc (x :: xs) acc = revAcc xs (x :: acc). Statement: revAcc xs acc = xs.reverse ++ acc. With plain induction xs, the IH is revAcc xs acc = xs.reverse ++ acc for the fixed acc, but the step needs revAcc xs (x :: acc). So use induction xs generalizing acc: the IH becomes for all acc. Then the cons case is revAcc xs (x :: acc) = (x :: xs).reverse ++ acc, which by IH is xs.reverse ++ x :: acc, and the right side is xs.reverse ++ [x] ++ acc by List.reverse_cons and associativity; simp [revAcc, ih] handles it.'
    },
    {
      q: 'How do tactic proofs relate to proof terms, and what does the kernel see?',
      a: 'Tactics are metaprograms that construct a proof term incrementally, with metavariables for open goals. intro produces lambdas, apply produces applications with holes, cases and induction produce recursor applications, rw produces Eq.mpr with congruence. When the block finishes, the term is complete, and the kernel type-checks it like any other term. #print shows it. That is why tactic bugs cannot produce false theorems.'
    },
    {
      q: 'You are stuck on a goal. What is your process?',
      a: 'Read the exact goal and context. Check whether it is in a shape a tactic handles directly: linear arithmetic (omega), closed computation (decide or rfl), a library fact (exact?), propositional structure (intro, constructor, cases). If the goal mentions a function, unfold one step. If an IH does not apply, generalize or prove a helper lemma. Break the goal with have and sorry to check the structure, then fill in the pieces. And question the statement: sometimes the lemma is false as stated, which a quick #eval on examples reveals.'
    }
  ]
};
