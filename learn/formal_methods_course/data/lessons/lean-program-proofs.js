window.LESSONS = window.LESSONS || {};
window.LESSONS['lean-program-proofs'] = {
  id: 'lean-program-proofs',
  title: 'Proving Programs Correct in Lean: Lists, Induction, Mathlib & Coq/Isabelle',
  category: 'Part 3 — Theorem Proving With Lean 4',
  timeMin: 50,
  summary: 'This lesson puts the language and tactics together on the kind of problem interviewers actually ask: take a small functional program and prove it meets its specification. You will prove the classic list laws (reverse distributes over append, reverse is an involution, map preserves length and distributes over append), then verify insertion sort completely: the output is sorted and is a permutation of the input. Along the way we recap Curry-Howard, show how Mathlib already packages these results, and compare Lean with Coq (now Rocq) and Isabelle/HOL, the other two proof assistants behind landmark verified systems.',
  goals: [
    'Prove algebraic laws about recursive list functions (reverse, append, map, length) by structural induction',
    'Write a complete specification for a sort (sorted output and permutation of input) and explain why both halves are needed',
    'Prove insertion sort correct in Lean using an inductive Sorted predicate, List.Perm and helper lemmas',
    'Distinguish extrinsic verification (separate theorems) from intrinsic verification (invariants in the types)',
    'Compare Lean 4, Coq/Rocq and Isabelle/HOL on logic, automation, code extraction and landmark projects'
  ],
  concept: [
    {
      h: 'The method: specification as theorems, proof by structural induction',
      p: [
        'In Lean a program is a pure function and its specification is a set of theorems about it. The recipe from the tactics lesson scales: induct on the argument the function recurses on, unfold one step, use the induction hypothesis, close with simp or omega. When the induction hypothesis is not strong enough, the fix is almost always a helper lemma that is more general than the statement you want.',
        'Our own <code>rev</code> is the naive quadratic reverse. The first law needs only simp with the standard append lemmas; the second needs the first as a helper. This "prove a lemma about the interaction with append first" pattern recurs constantly in list proofs.'
      ],
      code: `def rev {α : Type} : List α → List α
  | []      => []
  | x :: xs => rev xs ++ [x]

#eval rev [1, 2, 3]     -- [3, 2, 1]

theorem rev_append {α : Type} (xs ys : List α) :
    rev (xs ++ ys) = rev ys ++ rev xs := by
  induction xs with
  | nil => simp [rev]                         -- rev ys = rev ys ++ []
  | cons x xs ih => simp [rev, ih, List.append_assoc]

theorem rev_rev {α : Type} (xs : List α) : rev (rev xs) = xs := by
  induction xs with
  | nil => rfl
  | cons x xs ih => simp [rev, rev_append, ih]
  -- rev (rev xs ++ [x]) = rev [x] ++ rev (rev xs) = [x] ++ xs

theorem length_rev {α : Type} (xs : List α) : (rev xs).length = xs.length := by
  induction xs with
  | nil => rfl
  | cons x xs ih => simp [rev, ih]`
    },
    {
      h: 'map laws, and checking your theorem against the library',
      p: [
        'For core functions like <code>List.map</code>, the library already has the lemmas (<code>List.map_append</code>, <code>List.length_map</code>, <code>List.map_map</code>), usually tagged simp. Proving them yourself is good practice, but in real work you find them with <code>exact?</code> or by guessing the name from the conventions: function name, then an underscore, then the operation it interacts with.',
        'One habit worth copying: <code>#eval</code> the two sides on a few examples before trying to prove an equation. A false lemma wastes far more time than a quick test, and this is property-based testing as a sanity check before proving.'
      ],
      code: `theorem map_append' {α β : Type} (f : α → β) (xs ys : List α) :
    (xs ++ ys).map f = xs.map f ++ ys.map f := by
  induction xs with
  | nil => rfl
  | cons x xs ih => simp [ih]

theorem length_map' {α β : Type} (f : α → β) (xs : List α) :
    (xs.map f).length = xs.length := by
  induction xs with
  | nil => rfl
  | cons x xs ih => simp [ih]

theorem map_comp' {α β γ : Type} (f : β → γ) (g : α → β) (xs : List α) :
    (xs.map g).map f = xs.map (fun x => f (g x)) := by
  induction xs with
  | nil => rfl
  | cons x xs ih => simp [ih]

#eval ([1, 2] ++ [3]).map (· * 10) == [1, 2].map (· * 10) ++ [3].map (· * 10)  -- true
#check @List.map_append       -- the library version`
    },
    {
      h: 'Insertion sort: program and specification',
      p: [
        'A correct sort must return a sorted list <b>and</b> a permutation of its input. Either half alone is satisfied by a wrong program: <code>fun _ => []</code> is always sorted, and the identity function is always a permutation. Forgetting the permutation half is the textbook example of a weak specification, and it is exactly the failure mode to watch for when an LLM writes the spec.',
        'We define <code>Sorted</code> as an inductive predicate (the proof that a list is sorted is a derivation built from three rules), and use core\'s <code>List.Perm</code>, the inductive permutation relation with constructors nil, cons, swap and trans.'
      ],
      code: `def ins (x : Nat) : List Nat → List Nat
  | []      => [x]
  | y :: ys => if x ≤ y then x :: y :: ys else y :: ins x ys

def isort : List Nat → List Nat
  | []      => []
  | x :: xs => ins x (isort xs)

#eval isort [5, 2, 9, 1, 5]      -- [1, 2, 5, 5, 9]

inductive Sorted : List Nat → Prop where
  | nil : Sorted []
  | single (x : Nat) : Sorted [x]
  | cons (x y : Nat) (ys : List Nat) : x ≤ y → Sorted (y :: ys) → Sorted (x :: y :: ys)

-- the specification:
-- theorem isort_sorted (xs : List Nat) : Sorted (isort xs)
-- theorem isort_perm   (xs : List Nat) : List.Perm (isort xs) xs`
    },
    {
      h: 'Proving the permutation half',
      p: [
        'First a lemma about the helper: inserting x into ys gives a permutation of x :: ys. In the interesting branch (x goes after y) we chain two permutations: cons y onto the induction hypothesis, then swap the first two elements. The main theorem then follows by induction, chaining the lemma with the induction hypothesis through <code>List.Perm.trans</code>.',
        'Length preservation falls out the same way, and is also a corollary of the permutation (<code>List.Perm.length_eq</code>).'
      ],
      code: `theorem ins_perm (x : Nat) (ys : List Nat) : List.Perm (ins x ys) (x :: ys) := by
  induction ys with
  | nil => exact List.Perm.refl _
  | cons y ys ih =>
    simp only [ins]
    split
    · exact List.Perm.refl _
    · -- goal: Perm (y :: ins x ys) (x :: y :: ys)
      exact (List.Perm.cons y ih).trans (List.Perm.swap x y ys)

theorem isort_perm (xs : List Nat) : List.Perm (isort xs) xs := by
  induction xs with
  | nil => exact List.Perm.refl _
  | cons x xs ih =>
    simp only [isort]
    exact (ins_perm x (isort xs)).trans (List.Perm.cons x ih)

theorem isort_length (xs : List Nat) : (isort xs).length = xs.length :=
  (isort_perm xs).length_eq`
    },
    {
      h: 'Proving the sorted half',
      p: [
        'Here induction is on the derivation of <code>Sorted l</code>, not on the list, because the three Sorted rules give exactly the cases we need. The hard case is x landing after y: the result is y :: ins x (z :: zs), and to rebuild a Sorted derivation we need to know what the head of <code>ins x (z :: zs)</code> is. It is x or z, so we unfold that call as well and split again, rewriting the induction hypothesis in the same way.',
        'A small unfolding lemma <code>ins_cons</code> (true by rfl) lets us rewrite exactly one call to <code>ins</code> at a time, instead of having simp unfold every occurrence at once and disconnect the goal from the induction hypothesis.'
      ],
      code: `theorem ins_cons (x y : Nat) (ys : List Nat) :
    ins x (y :: ys) = if x ≤ y then x :: y :: ys else y :: ins x ys := rfl

theorem ins_sorted (x : Nat) {l : List Nat} (h : Sorted l) : Sorted (ins x l) := by
  induction h with
  | nil => exact Sorted.single x
  | single y =>
    rw [ins_cons]
    by_cases hxy : x ≤ y
    · rw [if_pos hxy]; exact Sorted.cons _ _ _ hxy (Sorted.single y)
    · rw [if_neg hxy]
      show Sorted [y, x]
      exact Sorted.cons _ _ _ (by omega) (Sorted.single x)
  | cons y z zs hyz hs ih =>
    rw [ins_cons x y (z :: zs)]
    by_cases hxy : x ≤ y
    · rw [if_pos hxy]; exact Sorted.cons _ _ _ hxy (Sorted.cons _ _ _ hyz hs)
    · rw [if_neg hxy]
      rw [ins_cons x z zs] at ih ⊢
      by_cases hxz : x ≤ z
      · rw [if_pos hxz] at ih ⊢
        exact Sorted.cons _ _ _ (by omega) ih       -- y ≤ x from ¬ x ≤ y
      · rw [if_neg hxz] at ih ⊢
        exact Sorted.cons _ _ _ hyz ih

theorem isort_sorted (xs : List Nat) : Sorted (isort xs) := by
  induction xs with
  | nil => exact Sorted.nil
  | cons x xs ih =>
    show Sorted (ins x (isort xs))
    exact ins_sorted x ih`
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The higher-level questions: Curry-Howard as a design tool, intrinsic vs extrinsic verification, what Mathlib gives you, and how Lean compares with Coq/Rocq and Isabelle/HOL.',
    sections: [
      {
        h: 'Curry-Howard, revisited for programs',
        p: [
          'Every proof above is a program. <code>ins_perm</code> is a recursive function that, given x and ys, builds a permutation derivation; induction is recursion and the induction hypothesis is the recursive call. <code>Sorted</code> is a data type of evidence, and <code>ins_sorted</code> transforms evidence that l is sorted into evidence that ins x l is sorted. This view is useful in interviews: "induction on the Sorted derivation" just means "recursion over the evidence structure", with one case per rule.'
        ]
      },
      {
        h: 'Extrinsic vs intrinsic verification',
        p: [
          'What we did is <b>extrinsic</b>: plain functions on plain lists, with theorems proved afterwards. The <b>intrinsic</b> alternative puts the invariant into the type, so the function cannot be written incorrectly: for example return a subtype <code>{ l : List Nat // Sorted l ∧ List.Perm l xs }</code>, or use a type of sorted lists. Intrinsic styles catch errors at definition time and need no separate proofs, but couple the code to the proof, make types heavier, and often make the function harder to write. Extrinsic proofs keep code simple and reusable, and let you prove properties you did not anticipate. Lean supports both; Mathlib mostly uses extrinsic proofs about simple definitions.'
        ],
        code: `-- intrinsic: the type is the spec
def sortSpec (xs : List Nat) : { l : List Nat // Sorted l ∧ List.Perm l xs } :=
  ⟨isort xs, isort_sorted xs, isort_perm xs⟩`
      },
      {
        h: 'Mathlib',
        p: [
          'Mathlib is Lean\'s community library: a single, unified repository with hundreds of thousands of theorems, covering algebra, analysis, topology, combinatorics, number theory and much more, plus the tactics from the previous lesson (ring, linarith, norm_num, positivity, aesop integration, field_simp, gcongr). It is maintained with strict review and continuous integration, and it moves fast, so projects pin a version. For program verification, its <code>List</code> API is relevant: Mathlib defines <code>List.insertionSort</code> and <code>List.mergeSort</code>-style results with sortedness and permutation theorems for an arbitrary order relation.',
          'Landmarks done in Lean and Mathlib include the Liquid Tensor Experiment (verifying a central result of Clausen and Scholze), the formalization of the polynomial Freiman-Ruzsa conjecture proof shortly after it appeared, and an ongoing project to formalize Fermat\'s Last Theorem. In software, AWS has used Lean for the Cedar authorization language (proving properties of its formal model) and for SampCert, a verified differential-privacy sampler.'
        ],
        code: `import Mathlib.Tactic

example (a b : ℕ) : (a + b) ^ 2 = a ^ 2 + 2 * a * b + b ^ 2 := by ring
example (s : Finset ℕ) : ∑ i ∈ s, 0 = 0 := by simp
example : Nat.Prime 97 := by norm_num`
      },
      {
        h: 'Lean vs Coq/Rocq vs Isabelle/HOL',
        p: [
          '<div class="cmp-wrap"><table class="cmp"><tr><th></th><th>Lean 4</th><th>Coq / Rocq</th><th>Isabelle/HOL</th></tr><tr><td>Logic</td><td>Dependent type theory (inductive types, universes, proof-irrelevant Prop, quotients); classical axioms available</td><td>Calculus of Inductive Constructions; constructive by default, classical axioms optional</td><td>Classical higher-order logic with simple types and type classes; no dependent types</td></tr><tr><td>Proof style</td><td>Tactics and terms; metaprogramming in Lean itself</td><td>Ltac / Ltac2 tactics, SSReflect; plugins in OCaml</td><td>Isar structured proofs or apply scripts; ML for extensions</td></tr><tr><td>Automation</td><td>simp, omega, decide, aesop, Mathlib tactics; hammers are emerging research tools</td><td>lia, auto, eauto, CoqHammer</td><td>Sledgehammer (calls external ATPs and SMT solvers, then reconstructs the proof), Nitpick counterexamples: the strongest push-button automation of the three</td></tr><tr><td>Programs</td><td>Lean is a compiled programming language</td><td>Extraction to OCaml or Haskell</td><td>Code generation to SML, OCaml, Haskell, Scala</td></tr><tr><td>Landmarks</td><td>Mathlib, Liquid Tensor Experiment</td><td>CompCert (verified C compiler), Four Color Theorem, Feit-Thompson, Iris</td><td>seL4 (verified microkernel), Archive of Formal Proofs</td></tr></table></div>',
          'Coq was renamed the Rocq Prover in 2025; you will see both names. All three are LCF-style or kernel-checked, so their trust stories are similar; the choice is usually about ecosystem (Mathlib for mathematics, Iris for concurrent separation logic in Rocq, the AFP and Sledgehammer for Isabelle) and about whether you need dependent types.'
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: 'Sanji\'s Two-Part Inspection of the Spice Rack',
      text: [
        'Sanji asks Usopp to sort the spice jars by heat, and promises to check the job. Usopp hands back an empty shelf: "Perfectly sorted!" Sanji kicks him. The inspection has two parts, he explains: the shelf must be in order, and it must hold exactly the jars he started with, no more, no fewer.',
        'Usopp\'s method is to take one jar at a time and slide it into the right place on the already-sorted shelf. To prove the method works for any number of jars, Robin argues: an empty shelf is sorted; and if the shelf is sorted before a jar is slid in, it is sorted after. The tricky case is when the new jar goes after the first one: she has to look at what ends up second, and it is either the new jar or the old second jar, and both are hotter than the first.',
        'For the "same jars" part, Nami notes that sliding a jar in only swaps neighbors, and swapping neighbors never loses or adds a jar.'
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon Sorts the Comic Books',
      text: [
        'Howard volunteers to alphabetize Sheldon\'s comics and returns an empty box. "Technically sorted," he says. Sheldon writes a contract: sorted, and the multiset of comics unchanged. Raj offers a second shortcut: hand back the original pile, untouched. "That is a permutation," Sheldon says, "but it fails clause one."',
        'Leonard does the real work by inserting each comic into a sorted stack, and Sheldon only accepts it after Leonard proves the stack stays sorted after each insertion, handling the case where the new comic goes after the first one by checking what ends up second.'
      ]
    },
    why: 'The empty shelf and the untouched pile are the two classic wrong programs that satisfy half a sorting spec, which is why the spec is "sorted and a permutation". Sliding one jar in is ins; induction over the shelf is the proof; looking at what ends up second is the case split on the head of ins x (z :: zs); "only swaps neighbors" is the Perm.swap step.'
  },
  storyAnim: {
    h: 240,
    props: [
      { id: 'shelf', emoji: '🗄️', label: 'sorted shelf', x: 50, y: 14 },
      { id: 'sorted', emoji: '📏', label: 'Sorted?', x: 14, y: 84 },
      { id: 'perm', emoji: '🔁', label: 'Perm?', x: 86, y: 84 }
    ],
    actors: [
      { id: 'usopp', emoji: '🎯', label: 'Usopp', x: 16, y: 40 },
      { id: 'sanji', emoji: '🍳', label: 'Sanji (spec)', x: 84, y: 40 },
      { id: 'jar', emoji: '🌶️', label: 'jar x', x: 30, y: 60 },
      { id: 'robin', emoji: '📚', label: 'Robin (proof)', x: 50, y: 60 }
    ],
    steps: [
      { c: 'Usopp returns an empty shelf. Sorted? Yes. Same jars? No. Half a spec accepts a wrong program.', p: { shelf: 'bad', sorted: 'good', perm: 'bad' }, l: { shelf: 'empty shelf' } },
      { c: 'Sanji\'s real spec: Sorted (isort xs) and Perm (isort xs) xs.', a: { sanji: [70, 30] }, p: { shelf: 'lit', sorted: 'lit', perm: 'lit' }, l: { shelf: 'isort xs' } },
      { c: 'Method: slide one jar into an already sorted shelf: ins x l.', a: { jar: [44, 22] } },
      { c: 'Perm: inserting only swaps neighbours. Perm.cons plus Perm.swap, chained with trans.', p: { perm: 'good' } },
      { c: 'Sorted, hard case: x goes after y. What ends up second? Either x or z, so split again.', a: { robin: [40, 40] } },
      { c: 'Both cases rebuild a Sorted derivation. Induction over Sorted l covers every shelf.', p: { sorted: 'good', shelf: 'good' }, l: { shelf: 'verified isort' } }
    ]
  },
  conceptFlow: {
    title: 'Verifying insertion sort, lemma by lemma',
    intro: 'Each box is a theorem; arrows go from what is used to what uses it.',
    stages: [
      { label: 'Program', nodes: [ { id: 'ins', text: 'ins x l' }, { id: 'isort', text: 'isort xs' } ] },
      { label: 'Spec', nodes: [ { id: 'sortedDef', text: 'inductive Sorted' }, { id: 'permDef', text: 'List.Perm' } ] },
      { label: 'Helper lemmas', nodes: [ { id: 'insPerm', text: 'ins_perm:\nPerm (ins x ys) (x :: ys)' }, { id: 'insSorted', text: 'ins_sorted:\nSorted l → Sorted (ins x l)' } ] },
      { label: 'Main theorems', nodes: [ { id: 'isPerm', text: 'isort_perm' }, { id: 'isSorted', text: 'isort_sorted' }, { id: 'spec', text: 'sorted ∧ perm:\nfull correctness' } ] }
    ],
    steps: [
      { active: ['ins'], note: 'The helper inserts one element into an already sorted list.' },
      { active: ['isort'], note: 'The sort folds ins over the input.' },
      { active: ['sortedDef', 'permDef'], note: 'The specification has two parts: sortedness and permutation. Either alone admits wrong programs.' },
      { active: ['insPerm'], note: 'By induction on ys: in the "goes later" case, cons onto the IH then swap the first two elements.' },
      { active: ['insSorted'], note: 'By induction on the Sorted derivation, splitting on where x lands and on the head of the recursive result.' },
      { active: ['isPerm'], note: 'Induction on xs, chaining ins_perm with the IH via Perm.trans.' },
      { active: ['isSorted'], note: 'Induction on xs, applying ins_sorted to the IH.' },
      { active: ['spec'], note: 'Together: isort is a correct sort for every input list.' }
    ]
  },
  tech: [
    {
      q: 'Why induct on the Sorted derivation instead of on the list?',
      a: 'The list structure gives cases [] and y :: ys, but to use sortedness in the cons case you would then have to invert the Sorted hypothesis to learn y ≤ head of ys, with a further case split. Inducting on <code>h : Sorted l</code> gives exactly the three rules as cases, each with the facts it carries (y ≤ z, Sorted (z :: zs)) and an induction hypothesis about the smaller derivation. It is "rule induction", the standard technique for inductively defined predicates.'
    },
    {
      q: 'Why the ins_cons lemma, when ins already unfolds by simp?',
      a: '<code>simp only [ins]</code> rewrites every occurrence of ins applied to a cons, including the recursive call <code>ins x (z :: zs)</code> in the goal. The induction hypothesis is stated about the un-unfolded term, so after simp the two no longer match. Rewriting with <code>ins_cons x y (z :: zs)</code>, fully instantiated, unfolds exactly one call. Controlling unfolding is a big part of practical proof engineering.'
    },
    {
      q: 'What is List.Perm, concretely?',
      a: 'An inductive relation in core Lean with four constructors: <code>nil : Perm [] []</code>, <code>cons x : Perm l1 l2 → Perm (x :: l1) (x :: l2)</code>, <code>swap x y l : Perm (y :: x :: l) (x :: y :: l)</code>, and <code>trans : Perm l1 l2 → Perm l2 l3 → Perm l1 l3</code>. Any permutation can be built from adjacent swaps, so this captures exactly "same multiset". The library proves it is an equivalence and relates it to counts (<code>List.perm_iff_count</code>).'
    },
    {
      q: 'How is this different from verifying the same sort in Dafny?',
      a: 'In Dafny you would write an imperative in-place insertion sort with loop invariants such as "a[..i] is sorted" and "multiset(a[..]) == multiset(old(a[..]))", and Z3 would discharge most steps automatically. In Lean you write a functional version and construct every proof step, with automation only at the leaves. Dafny is faster to get through; Lean gives a kernel-checked proof that does not depend on SMT heuristics, and the lemmas are reusable mathematical facts.'
    }
  ],
  code: {
    title: 'Complete file: verified insertion sort',
    intro: 'Core Lean 4 only, no Mathlib. Save as <code>ISort.lean</code> in a <code>lake new</code> project and run <code>lake env lean ISort.lean</code>, or paste into live.lean-lang.org. Lean is not installed in this environment, so this file was written carefully but not machine-checked here; the risky spots are the exact goal shapes after <code>rw</code> and <code>split</code>, and the infoview will show the goal if a step needs adjusting.',
    code: `-- ISort.lean

def ins (x : Nat) : List Nat → List Nat
  | []      => [x]
  | y :: ys => if x ≤ y then x :: y :: ys else y :: ins x ys

def isort : List Nat → List Nat
  | []      => []
  | x :: xs => ins x (isort xs)

inductive Sorted : List Nat → Prop where
  | nil : Sorted []
  | single (x : Nat) : Sorted [x]
  | cons (x y : Nat) (ys : List Nat) : x ≤ y → Sorted (y :: ys) → Sorted (x :: y :: ys)

theorem ins_cons (x y : Nat) (ys : List Nat) :
    ins x (y :: ys) = if x ≤ y then x :: y :: ys else y :: ins x ys := rfl

-- permutation half
theorem ins_perm (x : Nat) (ys : List Nat) : List.Perm (ins x ys) (x :: ys) := by
  induction ys with
  | nil => exact List.Perm.refl _
  | cons y ys ih =>
    rw [ins_cons]
    by_cases hxy : x ≤ y
    · rw [if_pos hxy]
      try exact List.Perm.refl _     -- in case rw's closing rfl did not apply to Perm
    · rw [if_neg hxy]
      exact (List.Perm.cons y ih).trans (List.Perm.swap x y ys)

theorem isort_perm (xs : List Nat) : List.Perm (isort xs) xs := by
  induction xs with
  | nil => exact List.Perm.refl _
  | cons x xs ih =>
    show List.Perm (ins x (isort xs)) (x :: xs)
    exact (ins_perm x (isort xs)).trans (List.Perm.cons x ih)

-- sorted half
theorem ins_sorted (x : Nat) {l : List Nat} (h : Sorted l) : Sorted (ins x l) := by
  induction h with
  | nil => exact Sorted.single x
  | single y =>
    rw [ins_cons]
    by_cases hxy : x ≤ y
    · rw [if_pos hxy]; exact Sorted.cons _ _ _ hxy (Sorted.single y)
    · rw [if_neg hxy]
      show Sorted [y, x]
      exact Sorted.cons _ _ _ (by omega) (Sorted.single x)
  | cons y z zs hyz hs ih =>
    rw [ins_cons x y (z :: zs)]
    by_cases hxy : x ≤ y
    · rw [if_pos hxy]; exact Sorted.cons _ _ _ hxy (Sorted.cons _ _ _ hyz hs)
    · rw [if_neg hxy]
      rw [ins_cons x z zs] at ih ⊢
      by_cases hxz : x ≤ z
      · rw [if_pos hxz] at ih ⊢
        exact Sorted.cons _ _ _ (by omega) ih
      · rw [if_neg hxz] at ih ⊢
        exact Sorted.cons _ _ _ hyz ih

theorem isort_sorted (xs : List Nat) : Sorted (isort xs) := by
  induction xs with
  | nil => exact Sorted.nil
  | cons x xs ih =>
    show Sorted (ins x (isort xs))
    exact ins_sorted x ih

-- full correctness, packaged
theorem isort_correct (xs : List Nat) :
    Sorted (isort xs) ∧ List.Perm (isort xs) xs :=
  ⟨isort_sorted xs, isort_perm xs⟩

#eval isort [3, 1, 4, 1, 5, 9, 2, 6]    -- [1, 1, 2, 3, 4, 5, 6, 9]
#print axioms isort_correct`,
    notes: [
      'In ins_perm\'s first branch, after <code>rw [if_pos hxy]</code> the goal is <code>Perm (x :: y :: ys) (x :: y :: ys)</code>; rw may close it with its automatic rfl step (if List.Perm.refl is registered as a reflexivity lemma on your toolchain); the <code>try exact List.Perm.refl _</code> line covers both cases.',
      '<code>(by omega)</code> inside <code>Sorted.cons _ _ _ (by omega) ...</code> is elaborated after the underscores are unified with the goal, so omega sees the concrete goal y ≤ x and the hypothesis hxy : ¬x ≤ y.',
      '<code>#print axioms isort_correct</code> lists the axioms the proof relies on; the thing to check is that sorryAx is not among them.',
      'Mathlib already provides List.insertionSort with List.sorted_insertionSort and List.perm_insertionSort for any total preorder; this file shows how such results are proved.'
    ]
  },
  lab: {
    title: 'Prove the reverse laws',
    prompt: 'Given the naive <code>rev</code>, prove (1) <code>rev_append</code>: rev (xs ++ ys) = rev ys ++ rev xs, by induction on xs with <code>simp [rev, ih, List.append_assoc]</code> in the cons case; and (2) <code>rev_rev</code>: rev (rev xs) = xs, by induction, using <code>rev_append</code> in the cons case. No sorry.',
    starter: `def rev {α : Type} : List α → List α
  | []      => []
  | x :: xs => rev xs ++ [x]

theorem rev_append {α : Type} (xs ys : List α) :
    rev (xs ++ ys) = rev ys ++ rev xs := by
  sorry

theorem rev_rev {α : Type} (xs : List α) : rev (rev xs) = xs := by
  sorry
`,
    checks: [
      { re: 'theorem\\s+rev_append[\\s\\S]*induction\\s+xs\\s+with', flags: '', must: true, hint: 'Prove rev_append by induction xs with ...', pass: 'rev_append by induction' },
      { re: '\\|\\s*nil\\s*=>\\s*simp\\s*\\[\\s*rev\\s*\\]', flags: '', must: true, hint: 'The nil case of rev_append: simp [rev] (rev [] = [] and ys ++ [] = ys)', pass: 'nil case via simp' },
      { re: '\\|\\s*cons\\s+x\\s+xs\\s+ih\\s*=>\\s*simp\\s*\\[\\s*rev\\s*,\\s*ih\\s*,\\s*List\\.append_assoc\\s*\\]', flags: '', must: true, hint: 'cons case: simp [rev, ih, List.append_assoc]', pass: 'cons case uses ih and associativity' },
      { re: 'theorem\\s+rev_rev[\\s\\S]*induction\\s+xs\\s+with', flags: '', must: true, hint: 'Prove rev_rev by induction xs with ...', pass: 'rev_rev by induction' },
      { re: 'theorem\\s+rev_rev[\\s\\S]*simp\\s*\\[[^\\]]*rev_append[^\\]]*\\]', flags: '', must: true, hint: 'Use the helper: simp [rev, rev_append, ih]', pass: 'helper lemma used' },
      { re: '\\bsorry\\b', flags: '', must: false, hint: 'Remove every sorry', pass: 'no sorry' }
    ],
    run: 'In a project made with <code>lake new revlab</code>, put the code in a .lean file and run <code>lake env lean RevLab.lean</code> (silence means success), or paste into live.lean-lang.org. Add <code>#print axioms rev_rev</code> and check that sorryAx is not listed. Then try proving rev_rev <i>without</i> rev_append and watch the cons case get stuck on <code>rev (rev xs ++ [x]) = x :: xs</code>: that is why the helper exists.',
    solution: `def rev {α : Type} : List α → List α
  | []      => []
  | x :: xs => rev xs ++ [x]

theorem rev_append {α : Type} (xs ys : List α) :
    rev (xs ++ ys) = rev ys ++ rev xs := by
  induction xs with
  | nil => simp [rev]
  | cons x xs ih => simp [rev, ih, List.append_assoc]

theorem rev_rev {α : Type} (xs : List α) : rev (rev xs) = xs := by
  induction xs with
  | nil => rfl
  | cons x xs ih => simp [rev, rev_append, ih]
`,
    notes: [
      'nil case of rev_append: [] ++ ys simplifies to ys, rev [] to [], and rev ys ++ [] to rev ys.',
      'cons case: rev (x :: (xs ++ ys)) unfolds to rev (xs ++ ys) ++ [x], the IH turns it into (rev ys ++ rev xs) ++ [x], and associativity matches the right side rev ys ++ (rev xs ++ [x]). List.append_assoc is already a simp lemma; listing it documents the step.',
      'rev_rev cons: rev (rev xs ++ [x]) becomes rev [x] ++ rev (rev xs) by rev_append, which simp reduces to [x] ++ xs and then x :: xs.',
      'Not run here (Lean is not installed); these are the standard proofs, using only core simp lemmas.'
    ]
  },
  quiz: [
    {
      q: 'A sort specification says only "the output is sorted". Which wrong program satisfies it?',
      options: ['Bubble sort', 'fun _ => [] (always return the empty list)', 'Merge sort', 'None'],
      correct: 1,
      explain: 'The empty list is sorted. You also need "the output is a permutation of the input".'
    },
    {
      q: 'Proving rev (rev xs) = xs by induction gets stuck at rev (rev xs ++ [x]) = x :: xs. Best move?',
      options: ['Use omega', 'Prove a helper lemma rev (xs ++ ys) = rev ys ++ rev xs first', 'Use decide', 'Switch to Dafny'],
      correct: 1,
      explain: 'The stuck goal is about rev of an append; a more general lemma about that interaction unlocks it.'
    },
    {
      q: 'Which proof assistant is classical higher-order logic without dependent types, with Sledgehammer automation?',
      options: ['Lean 4', 'Coq/Rocq', 'Isabelle/HOL', 'Agda'],
      correct: 2,
      explain: 'Isabelle/HOL is simply typed HOL; Sledgehammer calls external provers and reconstructs proofs.'
    },
    {
      q: 'The seL4 microkernel proof and the CompCert compiler proof were done in, respectively:',
      options: ['Lean and Isabelle', 'Isabelle/HOL and Coq', 'Coq and Lean', 'Dafny and Coq'],
      correct: 1,
      explain: 'seL4 was verified in Isabelle/HOL; CompCert in Coq.'
    },
    {
      q: 'Returning { l : List Nat // Sorted l ∧ List.Perm l xs } from a sort function is an example of:',
      options: ['Extrinsic verification', 'Intrinsic verification: the specification lives in the return type', 'Testing', 'Model checking'],
      correct: 1,
      explain: 'A subtype carries its proof, so callers get the guarantee from the type itself.'
    }
  ],
  testFlow: {
    title: 'Plan the proof',
    start: 'q1',
    nodes: {
      q1: { q: 'You want to prove (xs.map f).length = xs.length. Induct on?', choices: [ { text: 'xs', to: 'q1ok' }, { text: 'f', to: 'q1bad' } ] },
      q1ok: { end: true, correct: true, text: 'Yes: map recurses on the list.', next: 'q2' },
      q1bad: { end: true, correct: false, text: 'f is a function, not an inductive value map recurses on.', retry: 'q1' },
      q2: { q: 'Your sorted-insert proof needs to know the head of ins x (z :: zs). What do you do?', choices: [ { text: 'Unfold that one call and case split on x ≤ z', to: 'q2ok' }, { text: 'Call omega', to: 'q2bad' } ] },
      q2ok: { end: true, correct: true, text: 'Right: the head is x or z depending on the comparison.', next: 'q3' },
      q2bad: { end: true, correct: false, text: 'This is a structural question about a list, not arithmetic.', retry: 'q2' },
      q3: { q: 'You need a verified OS kernel and want the strongest push-button automation. Which assistant has a track record there?', choices: [ { text: 'Isabelle/HOL (seL4)', to: 'q3ok' }, { text: 'Only Lean can do this', to: 'q3bad' } ] },
      q3ok: { end: true, correct: true, text: 'Correct: seL4 is the landmark, and Sledgehammer is a big productivity aid.' },
      q3bad: { end: true, correct: false, text: 'Any of the three could, but seL4 was done in Isabelle/HOL.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Specifying only half of correctness (sorted but not permutation, or permutation but not sorted).',
    'Letting simp unfold every occurrence of a recursive function, disconnecting the goal from the induction hypothesis. Unfold one call with a targeted rw lemma.',
    'Inducting on the list when the hypothesis you need to use is an inductive predicate: rule induction on the derivation is often far simpler.',
    'Reproving library lemmas under the same name and getting ambiguity errors; use primes or a namespace, or just use the library version.',
    'Assuming "proved in Lean" means the program you deploy is correct: you proved properties of this Lean function, so the spec and the link to production code still need review.'
  ],
  interview: [
    {
      q: 'Whiteboard: specify and prove insertion sort correct.',
      a: 'Program: ins x [] = [x]; ins x (y :: ys) = if x ≤ y then x :: y :: ys else y :: ins x ys; isort folds ins. Spec: Sorted (isort xs) and Perm (isort xs) xs, with Sorted an inductive predicate (nil, single, cons with x ≤ y) and Perm the standard permutation relation. Permutation: lemma Perm (ins x ys) (x :: ys) by induction on ys, where the "goes later" case is Perm.cons y ih followed by a swap; then isort_perm by induction chaining with trans. Sortedness: lemma Sorted l → Sorted (ins x l) by induction on the Sorted derivation; the hard case is x after y in y :: z :: zs, where you case split on x ≤ z to know the head of ins x (z :: zs) is x or z, both of which are at least y. Then isort_sorted by induction.'
    },
    {
      q: 'Why does proving rev (rev xs) = xs need a lemma, and how do you find the right one?',
      a: 'In the cons case the goal becomes rev (rev xs ++ [x]) = x :: xs, and the IH is about rev (rev xs), not rev of an append. So you need to know how rev interacts with ++: rev (xs ++ ys) = rev ys ++ rev xs. Finding it: look at the stuck goal and ask which function is applied to which constructor or operation you cannot simplify, then generalize the specific term (rev xs ++ [x]) into variables (xs ++ ys). Often the general lemma is easier to prove than the specific one.'
    },
    {
      q: 'Explain a tradeoff: intrinsic vs extrinsic verification in Lean.',
      a: 'Extrinsic: write ordinary functions, prove theorems about them afterwards. Code stays simple and reusable, and you can add new properties later. Intrinsic: encode invariants in types (length-indexed vectors, subtypes like { l // Sorted l }, or sorted-list types), so incorrect code does not type check and no separate proofs are needed. The costs are heavier types, proofs entangled with code, and harder definitions (dependent pattern matching, casts between types that are only propositionally equal). Mathlib and most program verification use extrinsic proofs with small intrinsic touches such as Fin n for indices.'
    },
    {
      q: 'Compare Lean, Coq/Rocq and Isabelle. Which would you pick for what?',
      a: 'All three are kernel-checked proof assistants with similar trust stories. Lean 4 has dependent types, a fast-moving unified math library (Mathlib), is itself a good programming language, and is extended in Lean itself, which also makes it the main platform for machine-learning proof search. Coq/Rocq, based on the Calculus of Inductive Constructions, has decades of verified software (CompCert, Iris for concurrent separation logic, Fiat Cryptography) and extraction to OCaml. Isabelle/HOL is simply typed classical HOL with the best push-button automation (Sledgehammer, Nitpick) and seL4 plus the Archive of Formal Proofs. For mathematics or ML-assisted proving, Lean; for an existing verified-compiler or separation-logic ecosystem, Rocq; for big classical systems proofs where automation matters most, Isabelle.'
    },
    {
      q: 'What is rule induction, and when do you use it?',
      a: 'Induction over the derivation of an inductively defined predicate rather than over a data structure. Each constructor (rule) of the predicate is a case, with its premises available and an IH for every recursive premise. Use it when the hypothesis carries the information you need, such as Sorted l, a typing judgment, or an evaluation relation in a semantics proof. In Lean: induction h with | rule1 ... => ... on h : P x.'
    },
    {
      q: 'Explain Curry-Howard using your insertion sort proof.',
      a: 'Sorted is a data type of evidence with three constructors. ins_sorted is a function from evidence that l is sorted to evidence that ins x l is sorted, defined by recursion on the evidence; the induction hypothesis is the recursive call. List.Perm is likewise a type of evidence, and ins_perm builds it from cons, swap and trans. The final theorem is a pair of those two pieces of evidence. Type checking these programs is checking the proof.'
    },
    {
      q: 'You proved a Lean function correct. What could still be wrong in production?',
      a: 'The spec may be too weak (the half-spec problem), or may not match the requirement. The production code may not be the Lean function: if it is a separate Java implementation, the proof says nothing about it, unless you compile the Lean code, extract it, or check equivalence via differential testing. Machine integers, I/O, concurrency and performance were not modeled. And the toolchain is trusted (kernel, compiler if you run Lean code). The strongest setups verify the actual deployed code, or keep the verified model and the implementation tied together with property-based or differential testing.'
    }
  ]
};
