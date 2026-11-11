window.LESSONS = window.LESSONS || {};
window.LESSONS['lean-basics'] = {
  id: 'lean-basics',
  title: 'Lean 4 Basics: Types, Functions & Propositions-as-Types',
  category: 'Part 3 — Theorem Proving With Lean 4',
  timeMin: 45,
  summary: 'Lean 4 is two things at once: a functional programming language (it compiles to C and is written mostly in itself) and an interactive theorem prover based on dependent type theory. The bridge is propositions-as-types: a theorem is a type, and a proof is a program of that type, checked by a small kernel. Unlike Dafny, nothing is delegated to an SMT solver, so a checked proof does not depend on solver heuristics. This lesson gets you fluent in the language: setting up a project with elan and lake, def, #eval and #check, functions and implicit arguments, structures, inductive types, pattern matching and recursion, and finally writing your first proofs as terms.',
  goals: [
    'Set up Lean 4 with elan and lake (including a Mathlib project), and use #eval, #check and #print to explore',
    'Define functions with def, fun, pattern matching and structural recursion, and explain implicit arguments',
    'Declare structures and inductive types (including a dependent type indexed by Nat) and pattern-match on them',
    'Explain propositions-as-types: Prop, proofs as terms, and how implication, and, or and exists correspond to function, pair, sum and dependent pair',
    'Write small proofs directly as terms (rfl, anonymous constructors, fun) and with by decide'
  ],
  concept: [
    {
      h: 'Setup and the interaction loop',
      p: [
        'Install <b>elan</b>, the toolchain manager (like rustup): <code>curl https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh -sSf | sh</code>. Each project pins its Lean version in a <code>lean-toolchain</code> file, and elan fetches the right one. <b>lake</b> is the build tool and package manager: <code>lake new hello</code> makes a plain project, <code>lake new mymath math</code> makes one that depends on Mathlib; in a Mathlib project run <code>lake exe cache get</code> to download prebuilt Mathlib files instead of compiling it for hours. <code>lake build</code> builds; <code>lake env lean Foo.lean</code> checks one file with the project\'s dependencies.',
        'You work in VS Code with the Lean 4 extension (or Emacs/Neovim): the <b>infoview</b> panel shows the current goal and the output of commands as you move the cursor. There is no REPL loop to restart; the file is re-elaborated as you type. For quick experiments, <code>live.lean-lang.org</code> runs Lean in the browser.',
        'Commands that start with <code>#</code> are queries: <code>#eval e</code> runs code, <code>#check e</code> shows the type, <code>#print f</code> shows a definition, <code>#reduce e</code> normalizes a term in the kernel\'s sense.'
      ],
      code: `def double (n : Nat) : Nat := 2 * n

#eval double 21            -- 42
#check double              -- double (n : Nat) : Nat
#check @List.map           -- implicit {α} {β}, then (α → β) → List α → List β
#check Nat.add_comm        -- Nat.add_comm (n m : Nat) : n + m = m + n
#eval [1, 2, 3].map (fun x => x * 10)    -- [10, 20, 30]
#eval s!"double 4 = {double 4}"            -- "double 4 = 8"

def main : IO Unit :=
  IO.println s!"hello from Lean, {double 5}"`
    },
    {
      h: 'Functions, currying and implicit arguments',
      p: [
        'Functions are curried: <code>Nat → Nat → Nat</code> means <code>Nat → (Nat → Nat)</code>, so partial application is free. Lambdas are <code>fun x => x + 1</code>, or with the cdot shorthand <code>(· + 1)</code>. Application is juxtaposition: <code>f x y</code>.',
        'Arguments in curly braces <code>{α : Type}</code> are <b>implicit</b>: Lean infers them by unification from the explicit arguments. Square brackets <code>[Add α]</code> are <b>instance-implicit</b>: found by type class resolution. <code>@f</code> makes every argument explicit, which is how you read and pass them when inference fails.',
        'Lean is strict (call-by-value) and pure. Effects live in monads like <code>IO</code>, with <code>do</code> notation, mutable local variables via <code>let mut</code>, and for loops; that is how Lean itself is implemented.'
      ],
      code: `def add3 (a b c : Nat) : Nat := a + b + c
#eval (add3 1 2) 10                 -- 13: add3 1 2 is a function Nat → Nat

def twice {α : Type} (f : α → α) (x : α) : α := f (f x)
#eval twice (· + 3) 10              -- 16
#eval twice (fun s => s ++ "!") "hi" -- "hi!!"

def sumList {α : Type} [Add α] [OfNat α 0] : List α → α
  | []      => 0
  | x :: xs => x + sumList xs
#eval sumList [1, 2, 3, 4]          -- 10

def sumImperative (xs : List Nat) : Nat := Id.run do
  let mut acc := 0
  for x in xs do
    acc := acc + x
  return acc`
    },
    {
      h: 'Structures, inductive types and pattern matching',
      p: [
        'A <b>structure</b> is a single-constructor type with named fields and generated accessors. <code>deriving Repr</code> lets <code>#eval</code> print it. Anonymous constructor notation <code>⟨1, 2⟩</code> works whenever the expected type is known.',
        'An <b>inductive</b> type lists its constructors. <code>Nat</code> itself is inductive (<code>zero</code> and <code>succ</code>), and so are <code>List</code>, <code>Option</code>, <code>Bool</code> and even <code>And</code>, <code>Or</code> and <code>Eq</code>. Functions on them are defined by pattern matching; Lean checks that the match is exhaustive, and that recursion is <b>structural</b> (on a sub-term) or well-founded (with <code>termination_by</code>). <code>partial def</code> opts out of termination checking, but then you cannot reason about the function in proofs.',
        'Types can be <b>indexed</b> by values. <code>Vec α n</code> below is a list whose length is part of its type, so <code>head</code> only accepts non-empty vectors and the "empty list" case simply cannot be written. That is dependent typing: types that mention terms.'
      ],
      code: `structure Point where
  x : Nat
  y : Nat
  deriving Repr

def Point.add (p q : Point) : Point := { x := p.x + q.x, y := p.y + q.y }
#eval Point.add ⟨1, 2⟩ ⟨10, 20⟩      -- { x := 11, y := 22 }

inductive Tree (α : Type) where
  | leaf : Tree α
  | node : Tree α → α → Tree α → Tree α
  deriving Repr

def Tree.size {α : Type} : Tree α → Nat
  | .leaf       => 0
  | .node l _ r => Tree.size l + 1 + Tree.size r

def Tree.mirror {α : Type} : Tree α → Tree α
  | .leaf       => .leaf
  | .node l x r => .node (Tree.mirror r) x (Tree.mirror l)

#eval (Tree.node .leaf 5 (.node .leaf 7 .leaf)).size     -- 2

inductive Vec (α : Type) : Nat → Type where
  | nil  : Vec α 0
  | cons {n : Nat} : α → Vec α n → Vec α (n + 1)

def Vec.head {α : Type} {n : Nat} : Vec α (n + 1) → α
  | .cons a _ => a          -- no nil case needed: its index is 0, not n + 1`
    },
    {
      h: 'Propositions as types',
      p: [
        '<code>Prop</code> is the type of propositions. A proposition <code>p : Prop</code> is itself a type, and a <b>proof</b> of p is a term <code>h : p</code>. Checking a proof is type checking. This is the <b>Curry-Howard correspondence</b>, and in Lean it is not a metaphor: <code>theorem</code> and <code>def</code> differ only in that theorem bodies are never unfolded and are not computed with.',
        '<div class="cmp-wrap"><table class="cmp"><tr><th>Logic</th><th>Lean type</th><th>A proof is...</th></tr><tr><td>p implies q</td><td><code>p → q</code></td><td>a function turning proofs of p into proofs of q</td></tr><tr><td>p and q</td><td><code>p ∧ q</code></td><td>a pair <code>⟨hp, hq⟩</code></td></tr><tr><td>p or q</td><td><code>p ∨ q</code></td><td><code>Or.inl hp</code> or <code>Or.inr hq</code></td></tr><tr><td>for all x, P x</td><td><code>∀ x, P x</code></td><td>a dependent function <code>fun x => ...</code></td></tr><tr><td>exists x, P x</td><td><code>∃ x, P x</code></td><td>a witness and a proof <code>⟨w, hw⟩</code></td></tr><tr><td>false</td><td><code>False</code></td><td>no constructor: no proof exists</td></tr><tr><td>not p</td><td><code>¬p</code>, defined as <code>p → False</code></td><td>a function from a proof of p to an absurdity</td></tr><tr><td>a = b</td><td><code>a = b</code></td><td><code>rfl</code> when both sides compute to the same value</td></tr></table></div>',
        'Proofs of the same proposition are considered equal (<b>proof irrelevance</b> for Prop), which is why Prop is kept separate from data types like Nat. Lean\'s core logic is constructive, but the standard library provides classical axioms (<code>Classical.em</code>, built from choice, propositional extensionality and quotients), and Mathlib uses them freely.'
      ],
      code: `theorem two_add_two : 2 + 2 = 4 := rfl            -- both sides evaluate to 4
example : 10 < 100 := by decide                      -- decidable: just compute

theorem and_swap (p q : Prop) (h : p ∧ q) : q ∧ p := ⟨h.2, h.1⟩

theorem mp (p q : Prop) (hp : p) (hpq : p → q) : q := hpq hp

theorem or_swap (p q : Prop) : p ∨ q → q ∨ p :=
  fun h => match h with
    | Or.inl hp => Or.inr hp
    | Or.inr hq => Or.inl hq

example : ∃ n : Nat, n * n = 49 := ⟨7, rfl⟩

theorem not_not_intro (p : Prop) (hp : p) : ¬¬p := fun hnp => hnp hp

#check @and_swap      -- ∀ (p q : Prop), p ∧ q → q ∧ p`
    },
    {
      h: 'Universes, Type and why Prop is special',
      p: [
        'Every type has a type: <code>Nat : Type</code>, <code>Type : Type 1</code>, <code>Type 1 : Type 2</code>, and <code>Prop : Type</code>. The hierarchy (universes) avoids Girard\'s paradox, the type-theory version of Russell\'s paradox. Polymorphic library definitions are universe-polymorphic: <code>List.{u} (α : Type u) : Type u</code>, which is why you see <code>Type u_1</code> in <code>#check</code> output.',
        '<code>Prop</code> is <b>impredicative</b>: <code>∀ p : Prop, p → p</code> is itself a Prop, even though it quantifies over all props. That is what makes ordinary mathematical statements convenient. The price is that you cannot, in general, extract data from a proof: you cannot pattern-match on <code>h : ∃ n, P n</code> to produce a Nat in a <code>def</code>, only to prove another Prop.'
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'What makes Lean 4 trustworthy and what distinguishes it architecturally: the kernel, elaboration, definitional equality, decidability, and the fact that Lean is its own metaprogramming language.',
    sections: [
      {
        h: 'The kernel and the de Bruijn criterion',
        p: [
          'Everything you type (notation, implicit arguments, tactics, type classes) is <b>elaborated</b> into a term of a small core type theory: dependent functions, inductive types with recursors, universes, Prop with proof irrelevance, plus quotient types. A small <b>kernel</b> type-checks that term. Bugs in tactics or the elaborator cannot produce an accepted false theorem, because the kernel rechecks the output. Systems with this property satisfy the <b>de Bruijn criterion</b>. External checkers (for example lean4checker, and independent kernels written by the community) can recheck an exported environment.',
          'The trusted base is therefore the kernel, the three standard axioms (<code>propext</code>, <code>Classical.choice</code>, <code>Quot.sound</code>), and whatever extra axioms you declare. <code>#print axioms my_theorem</code> lists exactly which axioms a proof uses, and it will show <code>sorryAx</code> if any step used <code>sorry</code>.'
        ],
        code: `theorem t1 : 2 + 2 = 4 := rfl
#print axioms t1          -- 't1' does not depend on any axioms

theorem t2 (p : Prop) : p ∨ ¬p := Classical.em p
#print axioms t2          -- depends on propext, Classical.choice, Quot.sound

theorem t3 : 1 = 2 := sorry   -- warning: declaration uses 'sorry'
#print axioms t3          -- 't3' depends on axioms: [sorryAx]`
      },
      {
        h: 'Definitional equality, rfl and decide',
        p: [
          'Two terms are <b>definitionally equal</b> if they reduce to the same normal form by unfolding definitions and computing (beta, delta, iota reduction, plus eta). <code>rfl</code> proves <code>a = b</code> exactly when a and b are definitionally equal, so <code>2 + 2 = 4</code> is rfl, and so is <code>[1,2] ++ [3] = [1,2,3]</code>. But <code>n + 0 = n</code> is rfl while <code>0 + n = n</code> is not (for variable n), because Nat addition recurses on its second argument. That asymmetry is the first thing that makes induction necessary.',
          '<code>decide</code> works on propositions with a <code>Decidable</code> instance: it evaluates the decision procedure in the kernel. Fine for <code>10 &lt; 100</code> or small finite checks, but it does not scale to large computations, and it cannot handle free variables. <code>native_decide</code> uses compiled code instead, which is faster but adds the compiler to the trusted base.'
        ],
        code: `example (n : Nat) : n + 0 = n := rfl       -- ok: Nat.add recurses on the 2nd argument
-- example (n : Nat) : 0 + n = n := rfl    -- fails: needs induction (Nat.zero_add)
example (n : Nat) : 0 + n = n := Nat.zero_add n`
      },
      {
        h: 'Termination: structural vs well-founded recursion',
        p: [
          'Lean must know every function terminates, otherwise you could define <code>f x = f x + 1</code> and derive a contradiction. Structural recursion (on an immediate sub-term, like <code>xs</code> in <code>x :: xs</code>) is checked automatically. For anything else, Lean tries to prove a measure decreases; you can give one with <code>termination_by</code> and help with <code>decreasing_by</code>. The exact form in which the decreasing_by goal is presented has changed across Lean releases, so treat that line as a sketch to adapt in the infoview. Well-founded definitions do not reduce by <code>rfl</code> as easily, so you reason about them with their equation lemmas (via <code>simp [f]</code> or <code>unfold f</code>).'
        ],
        code: `def gcd' (a b : Nat) : Nat :=
  if h : b = 0 then a else gcd' b (a % b)
termination_by b
decreasing_by exact Nat.mod_lt a (Nat.pos_of_ne_zero h)   -- goal: a % b < b, with h : ¬b = 0

#eval gcd' 48 18     -- 6`
      },
      {
        h: 'Lean is its own metalanguage',
        p: [
          'Lean 4 is implemented in Lean 4. Tactics, notation, macros and even the elaborator are ordinary Lean code that you can extend in the same file, using the <code>MetaM</code> and <code>TacticM</code> monads. This is a major difference from Coq (OCaml plugins, Ltac) and Isabelle (Standard ML), and it is why Mathlib can ship hundreds of custom tactics, and why tools like LeanDojo and Lean Copilot can talk to Lean programmatically to drive proof search with language models.'
        ],
        code: `-- a tiny custom tactic: try rfl, then decide, then omega
macro "easy" : tactic => \`(tactic| first | rfl | decide | omega)

example : 3 + 4 = 7 := by easy
example (n : Nat) (h : n > 5) : n > 2 := by easy`
      }
    ]
  },
  story: {
    onePiece: {
      title: 'Robin\'s Poneglyph Rule: A Claim Is a Slot, A Proof Is What Fits',
      text: [
        'Robin explains to Luffy how she trusts a Poneglyph translation. Every claim carved on a Poneglyph has a slot shaped exactly like the evidence it needs. "Luffy is captain and Zoro is first mate" has a two-part slot: one piece for each half. "If it rains, the deck is wet" has a slot that only fits a device: give it rain, and it hands back a wet deck.',
        'Nobody argues about whether a translation is convincing. Robin just tries to fit the evidence in the slot, and the stone either accepts it or it does not. The stone is tiny and simple, which is why the whole crew trusts it, even when Franky builds elaborate machines (tactics) to carve the evidence for her.',
        'A claim like "something false is true" has a slot with no possible shape. No evidence will ever fit. That is how the crew knows a contradiction when they see one.'
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Shape-Sorter Proofs',
      text: [
        'Sheldon insists that Leonard\'s claim "I am both on time and prepared" must come with two receipts, a train ticket and his finished slides, clipped together. "I am on time or I texted" can be satisfied with either receipt, but Leonard must say which.',
        'For "if you borrow my car, you will refill it", Sheldon wants a procedure in writing: hand it the car keys and it produces a full tank. Penny asks why he does not just believe people. Sheldon: "Because my checker is twelve lines long and has never been wrong." Propositions are types, proofs are the receipts that fit them, and a small checker makes them trustworthy.'
      ]
    },
    why: 'The slot-shaped claims are types in Prop; evidence that fits is a term of that type. A two-part slot is And (a pair), a slot that takes rain and returns a wet deck is implication (a function), "either receipt but say which" is Or, and a slot nothing fits is False. The small trusted stone is Lean\'s kernel, and Franky\'s machines are tactics, which can be complicated because their output is rechecked.'
  },
  storyAnim: {
    h: 240,
    props: [
      { id: 'stone', emoji: '🪨', label: 'kernel (Poneglyph)', x: 50, y: 14 },
      { id: 'and', emoji: '🧩', label: 'p ∧ q: pair slot', x: 12, y: 82 },
      { id: 'imp', emoji: '⚙️', label: 'p → q: function slot', x: 50, y: 84 },
      { id: 'fls', emoji: '🚫', label: 'False: no shape', x: 88, y: 82 }
    ],
    actors: [
      { id: 'robin', emoji: '📚', label: 'Robin', x: 30, y: 40 },
      { id: 'luffy', emoji: '👒', label: 'Luffy', x: 70, y: 40 },
      { id: 'franky', emoji: '🤖', label: 'Franky (tactics)', x: 88, y: 50 }
    ],
    steps: [
      { c: 'Every claim is a type. Robin\'s job is just to check that a piece of evidence has that type.', p: { stone: 'lit' } },
      { c: 'Claim: p ∧ q. Evidence: a pair ⟨hp, hq⟩. It fits the two-part slot.', a: { robin: [16, 62] }, p: { and: 'good' } },
      { c: 'Claim: p → q. Evidence must be a function: give it a proof of p, it returns a proof of q.', a: { robin: [44, 64] }, p: { imp: 'good' } },
      { c: 'Luffy tries to prove False. There is no constructor, so nothing can ever fit.', a: { luffy: [80, 64] }, p: { fls: 'bad' } },
      { c: 'Franky builds a big machine (a tactic script) that carves a proof term automatically.', a: { franky: [64, 24] }, p: { stone: 'lit' } },
      { c: 'The stone rechecks whatever Franky produced. A buggy machine cannot sneak a false proof past it.', p: { stone: 'good' }, l: { stone: 'kernel: accepted' } }
    ]
  },
  conceptFlow: {
    title: 'From source to a checked theorem',
    intro: 'What happens when Lean processes a theorem.',
    stages: [
      { label: 'You write', nodes: [ { id: 'src', text: 'theorem t : p ∧ q → q ∧ p\n:= fun h => ⟨h.2, h.1⟩' } ] },
      { label: 'Elaborator', nodes: [ { id: 'impl', text: 'fill implicit args\nresolve instances, notation' }, { id: 'tac', text: 'run tactics (by ...)\nproduce a term' } ] },
      { label: 'Core term', nodes: [ { id: 'term', text: 'fully explicit term\nin dependent type theory' } ] },
      { label: 'Kernel', nodes: [ { id: 'check', text: 'type check:\ndoes term have type p?' }, { id: 'env', text: 'add to environment\nusable by later proofs' } ] }
    ],
    steps: [
      { active: ['src'], note: 'You write a statement (a type) and a proof (a term or a tactic block).' },
      { active: ['impl'], note: 'The elaborator inserts implicit arguments by unification, finds type class instances and expands notation like ⟨_, _⟩.' },
      { active: ['tac'], note: 'If the proof is a by block, tactics run against goals and build the proof term step by step.' },
      { active: ['term'], note: 'The result is a fully explicit term in the core calculus, with nothing left to infer.' },
      { active: ['check'], note: 'The small kernel type-checks it. Tactic or elaborator bugs cannot make a false theorem pass this step.' },
      { active: ['env'], note: 'The theorem joins the environment and can be used in later proofs, by name, like any other function.' }
    ]
  },
  tech: [
    {
      q: 'Why does #check Nat.add_comm print a theorem like a function signature?',
      a: 'Because it is one. <code>Nat.add_comm : ∀ (n m : Nat), n + m = m + n</code> is a dependent function type: give it two numbers and it returns a proof of the equation for those numbers. <code>Nat.add_comm 2 3 : 2 + 3 = 3 + 2</code>. Applying theorems to arguments is how you instantiate them, and it is what the apply and exact tactics do behind the scenes.'
    },
    {
      q: 'What is the difference between theorem, def, example and lemma?',
      a: '<code>def</code> defines data or functions that can be evaluated and unfolded. <code>theorem</code> is for Props; its body is opaque to later definitional unfolding and not compiled. <code>example</code> is an anonymous theorem or def, useful for tests. <code>lemma</code> is a Mathlib keyword that behaves like theorem; core Lean only has theorem.'
    },
    {
      q: 'Why can #eval run a def but not a theorem?',
      a: 'Proofs are erased during compilation: since all proofs of a Prop are equal, they carry no runtime information. #eval compiles and runs definitions that produce data. A theorem has no data to show; use #check to see its statement and #print axioms to see what it relies on.'
    },
    {
      q: 'What does the ⟨ ⟩ anonymous constructor actually do?',
      a: 'It is notation for "the unique constructor of the expected type". If Lean expects <code>p ∧ q</code>, <code>⟨hp, hq⟩</code> means <code>And.intro hp hq</code>; if it expects <code>∃ n, P n</code> it means <code>Exists.intro w hw</code>; if it expects a Point it means <code>Point.mk 1 2</code>. It only works when the expected type is known and has exactly one constructor.'
    }
  ],
  code: {
    title: 'A small Lean file: data, functions and first proofs',
    intro: 'Save as <code>Basics.lean</code> inside a project made with <code>lake new basics</code>, open it in VS Code with the Lean 4 extension, and read the infoview. Or paste it into live.lean-lang.org. Lean is not installed in this environment, so this file was written carefully from Lean 4 core semantics rather than run here; the expected outputs are shown in comments.',
    code: `-- Basics.lean  (core Lean 4 only, no Mathlib)

inductive Shape where
  | circle (r : Nat)
  | rect (w h : Nat)
  deriving Repr

def Shape.area : Shape → Nat           -- integer "area", pi approximated as 3
  | .circle r => 3 * r * r
  | .rect w h => w * h

def totalArea (xs : List Shape) : Nat :=
  (xs.map Shape.area).foldl (· + ·) 0

#eval totalArea [.circle 2, .rect 3 4]     -- 24

structure Account where
  owner   : String
  balance : Nat
  deriving Repr

def Account.deposit (a : Account) (amt : Nat) : Account :=
  { a with balance := a.balance + amt }

#eval (Account.deposit ⟨"ana", 10⟩ 5).balance   -- 15

-- proofs as terms
theorem deposit_increases (a : Account) (amt : Nat) :
    (a.deposit amt).balance = a.balance + amt := rfl

theorem and_comm_term (p q : Prop) : p ∧ q ↔ q ∧ p :=
  ⟨fun h => ⟨h.2, h.1⟩, fun h => ⟨h.2, h.1⟩⟩

theorem exists_big : ∃ n : Nat, n > 100 := ⟨101, by decide⟩

example : totalArea [.rect 2 5] = 10 := rfl     -- computes by evaluation
example : totalArea [.rect 2 5] = 10 := by decide

#check @deposit_increases
#print axioms and_comm_term      -- does not depend on any axioms`,
    notes: [
      '<code>{ a with balance := ... }</code> is structure update syntax: copy every field except the ones listed.',
      '<code>deposit_increases</code> is <code>rfl</code> because unfolding deposit makes both sides syntactically identical.',
      '<code>↔</code> is <code>Iff</code>, a structure with two fields (mp and mpr), so the anonymous constructor takes two functions.',
      'Not run here (Lean not installed). Every construct used is core Lean 4; if a toolchain disagrees, the infoview shows the exact error at the offending line.'
    ]
  },
  lab: {
    title: 'Define a type, a function and prove facts about it',
    prompt: 'Write: (1) an inductive <code>Color</code> with constructors <code>red</code>, <code>green</code>, <code>blue</code>, deriving Repr; (2) <code>def Color.next : Color → Color</code> cycling red to green to blue to red by pattern matching; (3) <code>theorem next_next_next (c : Color) : c.next.next.next = c</code>, proved by <code>cases c &lt;;&gt; rfl</code>; (4) a term-mode proof <code>theorem imp_trans (p q r : Prop) (hpq : p → q) (hqr : q → r) : p → r</code> using <code>fun</code>.',
    starter: `inductive Color where
  -- TODO: three constructors
  deriving Repr

def Color.next : Color → Color
  -- TODO: pattern match

theorem next_next_next (c : Color) : c.next.next.next = c := by
  sorry

theorem imp_trans (p q r : Prop) (hpq : p → q) (hqr : q → r) : p → r :=
  sorry
`,
    checks: [
      { re: 'inductive\\s+Color\\s+where', flags: '', must: true, hint: 'Declare: inductive Color where', pass: 'inductive declared' },
      { re: '\\|\\s*red[\\s\\S]*\\|\\s*green[\\s\\S]*\\|\\s*blue', flags: '', must: true, hint: 'Constructors | red | green | blue', pass: 'three constructors' },
      { re: '\\|\\s*\\.red\\s*=>\\s*\\.green', flags: '', must: true, hint: 'Match arm | .red => .green', pass: 'red to green' },
      { re: '\\|\\s*\\.blue\\s*=>\\s*\\.red', flags: '', must: true, hint: 'Match arm | .blue => .red', pass: 'blue wraps to red' },
      { re: 'cases\\s+c\\s*<;>\\s*rfl', flags: '', must: true, hint: 'Prove by case analysis: cases c <;> rfl', pass: 'case split then rfl on each' },
      { re: 'fun\\s+hp\\s*=>\\s*hqr\\s*\\(\\s*hpq\\s+hp\\s*\\)', flags: '', must: true, hint: 'Term proof: fun hp => hqr (hpq hp)', pass: 'implication as function composition' },
      { re: '\\bsorry\\b', flags: '', must: false, hint: 'Remove every sorry: a proof with sorry is not a proof', pass: 'no sorry' },
      { re: 'TODO', flags: '', must: false, hint: 'Replace every TODO', pass: 'no TODOs' }
    ],
    run: 'Install elan (<code>curl https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh -sSf | sh</code>), then <code>lake new colorlab</code>, put your code in <code>Colorlab/Basic.lean</code> (or any .lean file in the project) and run <code>lake build</code>, or open the folder in VS Code with the Lean 4 extension and watch the infoview. Add <code>#eval Color.red.next.next</code> to see <code>Color.blue</code> and <code>#print axioms next_next_next</code> to confirm it uses no axioms. Quickest option: paste into live.lean-lang.org.',
    solution: `inductive Color where
  | red
  | green
  | blue
  deriving Repr

def Color.next : Color → Color
  | .red => .green
  | .green => .blue
  | .blue => .red

theorem next_next_next (c : Color) : c.next.next.next = c := by
  cases c <;> rfl

theorem imp_trans (p q r : Prop) (hpq : p → q) (hqr : q → r) : p → r :=
  fun hp => hqr (hpq hp)
`,
    notes: [
      'cases c produces three goals, one per constructor, such as Color.red.next.next.next = Color.red. Each computes by definitional unfolding, so rfl closes it. <;> applies rfl to every goal produced by cases.',
      'imp_trans is literally function composition: the proof term is hqr after hpq. That is Curry-Howard in one line.',
      'You could also write next_next_next by pattern matching in term mode: | .red => rfl | .green => rfl | .blue => rfl.',
      'Not run here (Lean is not installed); both proofs use only core features and are standard.'
    ]
  },
  quiz: [
    {
      q: 'Under propositions-as-types, a proof of p → q is:',
      options: ['A truth table', 'A function that takes a proof of p and returns a proof of q', 'A pair of proofs', 'A Boolean'],
      correct: 1,
      explain: 'Implication is the function type. Applying the proof to a proof of p is modus ponens.'
    },
    {
      q: 'Why is n + 0 = n provable by rfl for a variable n, but 0 + n = n is not?',
      options: ['rfl only works on literals', 'Nat.add recurses on its second argument, so n + 0 reduces to n by computation, while 0 + n is stuck on the variable n', 'Lean has a bug', '0 + n = n is false'],
      correct: 1,
      explain: 'Definitional equality is computation. 0 + n needs induction on n (Nat.zero_add).'
    },
    {
      q: 'What does lake new myproj math do?',
      options: ['Installs Lean', 'Creates a project that depends on Mathlib (then lake exe cache get downloads prebuilt Mathlib)', 'Runs the tests', 'Creates a Lean 3 project'],
      correct: 1,
      explain: 'The math template wires Mathlib in as a dependency. elan installs toolchains; lake builds.'
    },
    {
      q: 'Which part of Lean must you trust for a theorem to be correct?',
      options: ['Every tactic you used', 'The kernel (plus the axioms the proof uses), because it rechecks the elaborated term', 'The VS Code extension', 'The SMT solver'],
      correct: 1,
      explain: 'Tactics produce terms that the kernel rechecks, so tactic bugs cannot create false theorems. #print axioms shows the axioms involved.'
    },
    {
      q: 'In def Vec.head : Vec α (n + 1) → α, why is there no case for Vec.nil?',
      options: ['Lean ignores missing cases', 'Vec.nil has type Vec α 0, which cannot unify with Vec α (n + 1), so the case is impossible and Lean knows it', 'It defaults to a panic', 'It is a syntax error'],
      correct: 1,
      explain: 'Indexed families make impossible cases unrepresentable; the exhaustiveness checker uses the index to rule nil out.'
    }
  ],
  testFlow: {
    title: 'Which proof term?',
    start: 'q1',
    nodes: {
      q1: { q: 'Goal: p ∧ q, with hp : p and hq : q in context. Proof term?', choices: [ { text: '⟨hp, hq⟩', to: 'q1ok' }, { text: 'Or.inl hp', to: 'q1bad' } ] },
      q1ok: { end: true, correct: true, text: 'Right: And has one constructor taking both proofs.', next: 'q2' },
      q1bad: { end: true, correct: false, text: 'That builds p ∨ q. And needs both halves.', retry: 'q1' },
      q2: { q: 'Goal: p → p. Proof term?', choices: [ { text: 'fun h => h', to: 'q2ok' }, { text: 'rfl', to: 'q2bad' } ] },
      q2ok: { end: true, correct: true, text: 'Yes: the identity function is the proof.', next: 'q3' },
      q2bad: { end: true, correct: false, text: 'rfl proves equalities a = a, not implications.', retry: 'q2' },
      q3: { q: 'Goal: ∃ n : Nat, n + 2 = 5. Proof term?', choices: [ { text: '⟨3, rfl⟩', to: 'q3ok' }, { text: 'fun n => rfl', to: 'q3bad' } ] },
      q3ok: { end: true, correct: true, text: 'Correct: give the witness 3, and 3 + 2 = 5 holds by computation.' },
      q3bad: { end: true, correct: false, text: 'A function proves a for-all. An exists needs a witness and a proof.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Copying Lean 3 syntax from old tutorials: begin ... end, λ x, ..., cases h with hp hq, import tactic. Lean 4 uses by, fun x => ..., cases h with | inl hp => ..., and import Mathlib.Tactic.',
    'Building Mathlib from source instead of running lake exe cache get, then waiting hours.',
    'Leaving a sorry in a file: it compiles with only a warning. Check #print axioms or grep for sorry before claiming something is proved.',
    'Using partial def for a function you want to prove things about; partial functions are opaque to the logic.',
    'Expecting #eval on a theorem, or expecting decide to prove statements with free variables.'
  ],
  interview: [
    {
      q: 'Explain the Curry-Howard correspondence as Lean uses it.',
      a: 'Propositions are types and proofs are terms of those types. Implication is the function type, so a proof of p → q is a function; conjunction is a pair type; disjunction is a sum type with two injections; a universal statement is a dependent function type; an existential is a dependent pair of a witness and a proof; False is the empty type. Checking a proof is type checking, done by a small kernel. In Lean that is literal: theorem and_swap (h : p ∧ q) : q ∧ p := ⟨h.2, h.1⟩ is a program that swaps a pair.'
    },
    {
      q: 'What is the trusted computing base of a Lean proof, compared to a Dafny proof?',
      a: 'In Lean: the kernel type checker, the axioms the proof uses (#print axioms lists them: usually propext, Classical.choice, Quot.sound), and the faithfulness of the statement to what you meant. Tactics, the elaborator and automation are untrusted because their output is rechecked. In Dafny: the Dafny-to-Boogie translation, Boogie\'s VC generation, Z3, and the compiler if you run the code. Lean\'s base is smaller and solver-independent; Dafny\'s automation is much stronger. Both share the biggest risk: the specification might not say what you think.'
    },
    {
      q: 'What is the difference between definitional and propositional equality?',
      a: 'Definitional equality is what the type checker decides by computation: unfolding definitions and reducing matches. It is used silently and proved by rfl, e.g. 2 + 2 = 4 or n + 0 = n. Propositional equality is the type a = b, which may require a real proof, such as 0 + n = n, which needs induction. Every definitional equality gives a propositional one by rfl, but not conversely. Knowing which side of a definition recurses tells you which facts are free.'
    },
    {
      q: 'Explain a tradeoff: why does Lean separate Prop from Type?',
      a: 'Prop gets proof irrelevance and impredicativity: all proofs of a proposition are equal, which makes subtypes and quotients behave well and lets the compiler erase proofs, and you can quantify over all propositions while staying in Prop. The cost is that you cannot eliminate a proof of a Prop into data in general; from h : ∃ n, P n you can prove other props, but a def cannot compute n from h (you would need a Subtype or Sigma type in Type, or noncomputable choice). The separation buys efficiency and clean classical reasoning at the price of that restriction.'
    },
    {
      q: 'How do you set up a new Lean project that uses Mathlib, and what are the common gotchas?',
      a: 'Install elan, then lake new myproj math, cd in, run lake exe cache get to download prebuilt Mathlib artifacts, and lake build. The lean-toolchain file pins the Lean version, which must match Mathlib\'s; upgrading means bumping both with lake update. Gotchas: building Mathlib from source because the cache step was skipped; mismatched toolchains after a manual edit; very long import lists, when import Mathlib or import Mathlib.Tactic is fine for experiments but slow to load.'
    },
    {
      q: 'Whiteboard: define binary trees in Lean with a size function and a mirror function, and state that mirroring preserves size.',
      a: 'inductive Tree (α : Type) where | leaf : Tree α | node : Tree α → α → Tree α → Tree α. Size by structural recursion: leaf maps to 0, node l x r maps to size l + 1 + size r. Mirror: leaf to leaf, node l x r to node (mirror r) x (mirror l). Theorem: (mirror t).size = t.size, by induction t with | leaf => rfl | node l x r ihl ihr => simp only [Tree.mirror, Tree.size, ihl, ihr]; omega. The node case unfolds both functions, rewrites with the two induction hypotheses, and closes a commutativity fact about addition with omega.'
    },
    {
      q: 'Why must every Lean function terminate, and how does Lean check it?',
      a: 'Functions are part of the logic. If f x = f x + 1 were allowed, subtracting f x from both sides gives 0 = 1, so the logic would be inconsistent. Lean accepts structural recursion automatically, and otherwise requires well-founded recursion with a measure (termination_by), proving the measure decreases at each call (decreasing_by, often automatic). partial def is allowed for programs but makes the function opaque to proofs; it must also have an inhabited return type so the logic stays consistent.'
    }
  ]
};
