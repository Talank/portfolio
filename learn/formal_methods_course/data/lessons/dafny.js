window.LESSONS = window.LESSONS || {};
window.LESSONS['dafny'] = {
  id: 'dafny',
  title: 'Auto-Active Verification With Dafny: requires, ensures, invariant, decreases',
  category: 'Part 2 — Verifying Programs',
  timeMin: 45,
  summary: 'Dafny is the Hoare-logic lesson turned into a programming language. You write ordinary imperative code plus specifications (requires, ensures, loop invariants, termination measures); Dafny generates verification conditions through Boogie and discharges them with Z3 while you type. You never write a proof script line by line as in Lean, but you do supply the hints (invariants, lemma calls, assertions) the solver cannot invent. That mix is called auto-active verification. Amazon uses Dafny for its authorization engine and for AWS encryption libraries, and Dafny is the most common target in LLM-for-verification research benchmarks.',
  goals: [
    'Write methods, functions and predicates with requires/ensures, and say which ones are ghost and which are compiled',
    'Write a loop with invariant and decreases clauses, and diagnose "invariant might not be maintained" vs "might not hold on entry"',
    'Prove a fact with a lemma, using recursion as induction, and call it from a method',
    'Verify a binary search end to end and explain why each invariant is needed',
    'Explain the pipeline Dafny to Boogie to VCs to Z3, and the common failure modes: weak invariants, missing frames, triggers, timeouts'
  ],
  concept: [
    {
      h: 'The building blocks: method, function, predicate, lemma',
      p: [
        '<b>method</b>: imperative code with statements, loops, mutation and heap access. Callers only see its contract (requires/ensures), never its body. That modularity is what makes verification scale, and it is also the first surprise: if a method has no ensures, callers know nothing about its result.',
        '<b>function</b>: a pure mathematical expression whose body <i>is</i> visible to callers (the verifier can unfold its definition). In Dafny 4, <code>function</code> is compiled and <code>ghost function</code> is specification-only; in Dafny 3 the spelling was <code>function method</code> for compiled and <code>function</code> for ghost, so older tutorials look different. A <b>predicate</b> is a function returning bool.',
        '<b>lemma</b>: a ghost method whose only purpose is its ensures clause. Its body is the proof; calling it at a program point makes its conclusion available there. Recursive calls in a lemma are induction hypotheses, and Dafny checks they decrease, so the induction is well-founded.',
        '<b>ghost</b> anything (variables, functions, parameters) exists only for verification and is erased by the compiler. Ghost code may not affect compiled state, which Dafny checks.'
      ],
      code: `function Sum(n: nat): nat
{
  if n == 0 then 0 else n + Sum(n - 1)
}

predicate Sorted(a: array<int>)
  reads a                        // functions must declare what heap they read
{
  forall i, j :: 0 <= i < j < a.Length ==> a[i] <= a[j]
}

lemma SumFormula(n: nat)
  ensures 2 * Sum(n) == n * (n + 1)
{
  if n > 0 {
    SumFormula(n - 1);           // induction hypothesis for n - 1
  }
}`
    },
    {
      h: 'Contracts: requires, ensures, modifies, reads, old',
      p: [
        '<code>requires P</code> is the caller\'s obligation and the body\'s assumption. <code>ensures Q</code> is the body\'s obligation and the caller\'s assumption. Methods that write heap objects must declare <code>modifies a</code>; functions and predicates that read the heap must declare <code>reads a</code>. These <b>frames</b> let Dafny conclude that everything else is unchanged across a call.',
        '<code>old(e)</code> in a postcondition means the value of e on entry. Sequences give clean specs: <code>a[..]</code> is the array\'s contents as a mathematical sequence, and <code>multiset(a[..]) == multiset(old(a[..]))</code> says "a permutation of the input".',
        'Integers in Dafny are mathematical (unbounded), so <code>(lo + hi) / 2</code> cannot overflow. That is a deliberate design choice: verify the algorithm first, and use bounded newtypes (<code>newtype int32 = x | -0x8000_0000 &lt;= x &lt; 0x8000_0000</code>) when you need machine arithmetic.'
      ],
      code: `method Swap(a: array<int>, i: int, j: int)
  requires 0 <= i < a.Length && 0 <= j < a.Length
  modifies a
  ensures a[i] == old(a[j]) && a[j] == old(a[i])
  ensures forall k :: 0 <= k < a.Length && k != i && k != j ==> a[k] == old(a[k])
{
  a[i], a[j] := a[j], a[i];      // parallel assignment
}`
    },
    {
      h: 'Loops: invariant and decreases',
      p: [
        'A loop is a black box to the verifier: after the loop, all it knows is the invariant plus the negated guard. So the invariant must be (1) true on entry, (2) preserved by one iteration assuming the guard, and (3) strong enough that invariant and not guard imply the postcondition. Dafny reports these as "might not hold on entry", "might not be maintained by the loop", and "a postcondition could not be proved" respectively.',
        '<code>decreases e</code> gives a termination measure: e must be bounded below and strictly decrease each iteration (or each recursive call). Dafny guesses common ones (like <code>n - i</code> for <code>while i &lt; n</code>), and you write it when the guess fails. Lexicographic tuples are allowed: <code>decreases m, n</code>.'
      ],
      code: `method ComputeSum(n: nat) returns (s: nat)
  ensures s == Sum(n)
{
  s := 0;
  var i := 0;
  while i < n
    invariant 0 <= i <= n          // bounds: needed to get i == n at exit
    invariant s == Sum(i)          // the real content
    decreases n - i
  {
    i := i + 1;
    s := s + i;                    // Sum(i) unfolds to i + Sum(i - 1)
  }
}`
    },
    {
      h: 'A verified binary search',
      p: [
        'The invariant says: everything left of <code>lo</code> is smaller than the key, everything from <code>hi</code> onward is larger. If the loop exits without finding the key, then lo == hi and the two halves cover the whole array, which is exactly the "not found" postcondition. The <code>Sorted</code> precondition is what lets Dafny extend each half when lo or hi moves: knowing a[mid] &lt; key and sortedness gives a[k] &lt; key for all k &lt;= mid.',
        'The famous Java binary search bug (Bloch, 2006: <code>(low + high) / 2</code> overflows for large arrays) cannot happen here because ints are unbounded. If you use a bounded int type, Dafny would force you to write <code>lo + (hi - lo) / 2</code>.'
      ],
      code: `method BinarySearch(a: array<int>, key: int) returns (index: int)
  requires Sorted(a)
  ensures 0 <= index ==> index < a.Length && a[index] == key
  ensures index < 0 ==> forall k :: 0 <= k < a.Length ==> a[k] != key
{
  var lo, hi := 0, a.Length;
  while lo < hi
    invariant 0 <= lo <= hi <= a.Length
    invariant forall k :: 0 <= k < lo ==> a[k] < key
    invariant forall k :: hi <= k < a.Length ==> a[k] > key
    decreases hi - lo
  {
    var mid := lo + (hi - lo) / 2;
    if a[mid] < key {
      lo := mid + 1;
    } else if a[mid] > key {
      hi := mid;
    } else {
      return mid;
    }
  }
  return -1;
}`
    },
    {
      h: 'Under the hood: Dafny to Boogie to Z3',
      p: [
        'Dafny translates the program into <b>Boogie</b>, an intermediate verification language (Microsoft Research) with only a few constructs: assume, assert, havoc, assignments, procedures with contracts, and loops. The heap becomes a map from (object, field) to value; method calls become "assert the precondition, havoc the modified heap locations, assume the postcondition"; loops become "assert the invariant, havoc the loop variables, assume the invariant, check one iteration".',
        'Boogie converts each procedure to a passive (SSA) form and computes a verification condition with weakest preconditions, the same wp calculus from the Hoare logic lesson, using an encoding that avoids the exponential blow-up of naive wp. The VC is printed as SMT-LIB and sent to <b>Z3</b>. Z3 tries to find a model of the <i>negated</i> VC: unsat means verified, sat (or unknown) becomes an error message pointing at the assertion that could not be proved.',
        'Quantifiers (<code>forall k :: ...</code>) are handled by <b>E-matching</b>: Z3 instantiates a quantified fact only when it sees a ground term that matches its <b>trigger</b> pattern, for example <code>a[k]</code>. Dafny picks triggers automatically and warns if it cannot. This is the main reason verification is fast, and also the main reason it sometimes fails mysteriously.'
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'What interviewers who have used Dafny ask about: why verification fails when the code is right, triggers and matching loops, timeouts and brittleness, and how Dafny is used in industry and LLM research.',
    sections: [
      {
        h: 'Reading failures: the four usual suspects',
        p: [
          '<ul><li><b>Invariant too weak</b>: "might not be maintained" or the postcondition fails after the loop. Ask: what does the verifier know at the top of an arbitrary iteration? Only the invariant. Add the missing fact (often a bounds fact like <code>0 &lt;= i &lt;= n</code>, or a "nothing else changed" fact).</li><li><b>Missing frame</b>: after calling a method that modifies <code>a</code>, facts about <code>b</code> disappear because the method did not say it only modifies <code>a</code>, or facts about <code>a</code> disappear because the ensures did not restate them.</li><li><b>Function not unfolded far enough</b>: recursive functions get limited unrolling (fuel), so <code>Sum(i + 1)</code> may unfold but <code>Sum(i + 3)</code> may not. Add an intermediate <code>assert</code> or call a lemma.</li><li><b>Nonlinear arithmetic</b>: <code>x * y</code> with both variables is undecidable in general and Z3 handles it heuristically. Isolate it in small lemmas.</li></ul>',
          'Debugging technique: insert <code>assert</code> statements to move the error. If <code>assert P;</code> just before the failing line verifies but the line still fails, P is not enough; if the assert itself fails, the problem is earlier. <code>assume false;</code> at a point makes everything after it verify, which bisects a long proof.'
        ],
        code: `// calc blocks and assert-by make reasoning steps explicit
lemma SumFormulaCalc(n: nat)
  ensures 2 * Sum(n) == n * (n + 1)
{
  if n > 0 {
    calc {
      2 * Sum(n);
    ==  2 * (n + Sum(n - 1));
    ==  2 * n + 2 * Sum(n - 1);
    ==  { SumFormulaCalc(n - 1); }        // justify this step with the IH
      2 * n + (n - 1) * n;
    ==  n * (n + 1);
    }
  }
}`
      },
      {
        h: 'Triggers and matching loops',
        p: [
          'A quantifier <code>forall x :: f(x) &gt; 0</code> with trigger <code>f(x)</code> is instantiated once for every ground term <code>f(t)</code> Z3 has seen. If no such term exists, the fact is never used (an "incomplete" failure: correct code does not verify; fix with an <code>assert</code> that mentions the term). If instantiating creates a new matching term, for example <code>forall x :: f(x) == f(x + 1)</code>, Z3 instantiates forever: a <b>matching loop</b>, which shows up as a timeout. Dafny warns about suspected matching loops; you can choose triggers manually with <code>{:trigger f(x)}</code>.'
        ]
      },
      {
        h: 'Timeouts, brittleness and opaque definitions',
        p: [
          'Verification time is not monotone in program size: unrelated edits change the SMT query, and a proof can go from one second to timeout. This is called <b>proof brittleness</b> and it is the top practical complaint from industrial Dafny users. Mitigations: keep methods small, mark large function definitions <code>opaque</code> and <code>reveal</code> them only where needed (Dafny 4 syntax: <code>opaque function F...</code> then <code>reveal F();</code>), state intermediate lemmas, and split assertions into separate queries (the Dafny 4 CLI has <code>--isolate-assertions</code>; older versions used the <code>{:vcs_split_on_every_assert}</code> attribute). <code>dafny verify --verification-time-limit 30 file.dfy</code> bounds each query.',
          'Tooling: <code>dotnet tool install --global dafny</code>, or the VS Code extension, which downloads Dafny and verifies on every keystroke. Commands: <code>dafny verify</code>, <code>dafny run</code>, <code>dafny build</code>, and <code>dafny translate</code> with targets including C#, Java, Go, JavaScript and Python.'
        ]
      },
      {
        h: 'Dafny in industry and in LLM research',
        p: [
          'AWS rewrote the authorization engine that evaluates IAM policies in Dafny and proved it correct against a specification, then used differential testing against the old engine before switching over. The AWS Encryption SDK and the Cedar policy language also used Dafny models alongside Lean proofs. The pattern: verified core logic, compiled to the production language, with testing for the boundary.',
          'Because Dafny gives fast, precise feedback and needs only annotations (not proof scripts), it is a popular target for LLM work: generating loop invariants, generating whole verified programs from natural language, and repairing failing proofs using the verifier error as feedback. The verifier acts as a perfect judge for the logic, but not for whether the specification is the right one; a vacuous or weak ensures clause verifies trivially. You will see this in the capstone.'
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: 'Franky Signs Every Part With a Contract',
      text: [
        'Franky builds the Sunny\'s parts in separate workshops. Each part comes with a tag: what it needs to be attached to (requires) and what it promises once attached (ensures). When Usopp installs the cannon, he only reads the tag, never opens the casing. That is why Franky can rebuild a part\'s insides without anyone re-checking the whole ship.',
        'For the paddle wheel, which turns round after round, Franky writes on the axle what is true at the start of every turn: "every paddle left of the marker is greased." Robin, the inspector, checks it holds before the first turn and that one turn keeps it true. She also checks the marker always moves forward and the axle has an end, so the wheel cannot spin forever.',
        'When the inspection fails although the wheel is fine, it is always the axle note: too vague to imply the final promise. Franky adds the missing detail and the inspection passes.'
      ]
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Kitchen Rules',
      text: [
        'Monica runs Thanksgiving with written rules: anyone touching the turkey must have washed hands (requires), and whoever serves it guarantees it is at 74 degrees (ensures). Joey only reads the tags on each dish, never the recipes.',
        'For the pile of plates, Monica writes the rule that holds after every plate: "everything to the left of the towel is dry and stacked." Chandler points out that her rule does not mention that the stack never falls over; when Rachel adds one plate the stack falls and the rule never said otherwise. Monica rewrites it, and that strengthened rule is exactly a loop invariant that is finally strong enough.'
      ]
    },
    why: 'Tags on parts are contracts: callers read only requires/ensures, which is why Dafny verifies each method in isolation. The axle note checked at "before the first turn" and "after any one turn" is the invariant\'s entry and preservation checks, the always-forward marker is decreases, and a failing inspection on a correct wheel is the classic too-weak invariant.'
  },
  storyAnim: {
    h: 240,
    props: [
      { id: 'tag', emoji: '🏷️', label: 'requires / ensures', x: 12, y: 14 },
      { id: 'wheel', emoji: '⚙️', label: 'loop', x: 50, y: 18 },
      { id: 'note', emoji: '📝', label: 'invariant', x: 86, y: 14 },
      { id: 'boogie', emoji: '🔧', label: 'Boogie VC', x: 30, y: 84 },
      { id: 'z3', emoji: '🧮', label: 'Z3', x: 70, y: 84 }
    ],
    actors: [
      { id: 'franky', emoji: '🤖', label: 'Franky (writes code+spec)', x: 14, y: 50 },
      { id: 'robin', emoji: '📚', label: 'Robin (verifier)', x: 86, y: 52 },
      { id: 'usopp', emoji: '🎯', label: 'Usopp (caller)', x: 50, y: 60 }
    ],
    steps: [
      { c: 'Franky writes a method with a tag: requires Sorted(a), ensures the index is correct.', p: { tag: 'lit' } },
      { c: 'Usopp calls it and reads only the tag. Modular: the body is invisible to callers.', a: { usopp: [26, 30] } },
      { c: 'The body has a loop. Franky writes an invariant on the axle note.', p: { wheel: 'lit', note: 'lit' } },
      { c: 'Dafny turns body plus specs into Boogie, then a verification condition via weakest preconditions.', p: { boogie: 'lit' }, a: { franky: [30, 62] } },
      { c: 'Z3 searches for a counterexample to the VC. It finds one: the invariant is too weak to be maintained.', p: { z3: 'bad', note: 'bad' }, l: { z3: 'Z3: sat (error)' } },
      { c: 'Franky adds the missing half: everything at or past hi is larger than key.', p: { note: 'lit' }, l: { note: 'invariant (strengthened)' } },
      { c: 'Z3 now reports unsat for every VC: verified. Robin signs off, no tests needed for this property.', a: { robin: [70, 46] }, p: { z3: 'good', note: 'good', tag: 'good' }, l: { z3: 'Z3: unsat (verified)' } }
    ]
  },
  conceptFlow: {
    title: 'How a Dafny method gets verified',
    intro: 'Every check in the IDE is a Z3 query generated through Boogie.',
    stages: [
      { label: 'You write', nodes: [ { id: 'code', text: 'method + body' }, { id: 'spec', text: 'requires / ensures\ninvariant / decreases' } ] },
      { label: 'Dafny', nodes: [ { id: 'boogie', text: 'translate to Boogie\nheap = map, calls = contracts' } ] },
      { label: 'Boogie', nodes: [ { id: 'loops', text: 'cut loops at invariants\nhavoc modified vars' }, { id: 'vc', text: 'passive form + wp\none VC per procedure' } ] },
      { label: 'Z3', nodes: [ { id: 'smt', text: 'SMT-LIB query\nnot VC satisfiable?' }, { id: 'ok', text: 'unsat: verified' }, { id: 'err', text: 'sat / unknown:\nerror at an assertion' } ] }
    ],
    steps: [
      { active: ['code'], note: 'You write ordinary imperative code: loops, arrays, mutation.' },
      { active: ['spec'], note: 'Plus specifications: preconditions, postconditions, loop invariants and termination measures.' },
      { active: ['boogie'], note: 'Dafny translates to Boogie, a tiny language of assert, assume, havoc and assignment. The heap becomes an explicit map.' },
      { active: ['loops'], note: 'Each loop is replaced by: assert invariant, havoc everything the loop modifies, assume invariant, then check one arbitrary iteration.' },
      { active: ['vc'], note: 'Boogie computes a verification condition with weakest preconditions over the loop-free, passive program.' },
      { active: ['smt'], note: 'The negated VC is sent to Z3. Quantifiers are instantiated by E-matching on triggers.' },
      { active: ['ok'], note: 'Unsat: no counterexample exists, so every assertion holds.' },
      { active: ['err'], note: 'Sat or unknown: Dafny maps the failing assertion back to your source line, for example "this loop invariant might not be maintained".' }
    ]
  },
  tech: [
    {
      q: 'Why can a method call "forget" everything about its result?',
      a: 'Dafny verifies methods modularly: at a call site it asserts the callee\'s requires, havocs the result and anything in its modifies clause, then assumes its ensures. The body is never consulted. So <code>method Double(x: int) returns (y: int) { y := 2 * x; }</code> with no ensures gives callers no information about y. Functions are different: their bodies are part of the logic and can be unfolded.'
    },
    {
      q: 'What exactly is "auto-active" verification?',
      a: 'A term coined by Leino for tools between fully automatic (static analyzers, model checkers) and interactive (Lean, Coq, Isabelle). The user interacts only through annotations in the program text (invariants, assertions, lemma calls), and an automatic solver fills in all the proof steps between them. Dafny, Why3, Viper, Verus (for Rust) and Frama-C/WP work this way.'
    },
    {
      q: 'Why does Dafny need decreases at all? Partial correctness is enough for most specs.',
      a: 'Dafny proves total correctness: methods must terminate unless marked <code>decreases *</code>. For functions and lemmas termination is not optional, because a non-terminating "lemma" like <code>lemma Bad() ensures false { Bad(); }</code> would prove false and make the logic inconsistent. Recursion in a lemma is induction only if it is well-founded, and decreases is how that is checked.'
    },
    {
      q: 'What does a trigger warning mean in practice?',
      a: 'Dafny could not find a term pattern to use as the trigger for a quantifier, or the chosen trigger may cause a matching loop. Without a usable trigger, Z3 may never instantiate the quantified fact, so correct code fails to verify. Rewrite the quantifier so the bound variable appears inside a function application or array index, such as <code>a[k]</code>, or annotate <code>{:trigger a[k]}</code>.'
    }
  ],
  code: {
    title: 'Sorted-array search and a verified loop with a lemma',
    intro: 'A complete Dafny file. Save as <code>search.dfy</code> and run <code>dafny verify search.dfy</code>; <code>dafny run search.dfy</code> executes Main. Dafny is not installed in this environment, so this was written from the standard textbook versions of these programs rather than run here.',
    code: `// search.dfy
predicate Sorted(a: array<int>)
  reads a
{
  forall i, j :: 0 <= i < j < a.Length ==> a[i] <= a[j]
}

method BinarySearch(a: array<int>, key: int) returns (index: int)
  requires Sorted(a)
  ensures 0 <= index ==> index < a.Length && a[index] == key
  ensures index < 0 ==> forall k :: 0 <= k < a.Length ==> a[k] != key
{
  var lo, hi := 0, a.Length;
  while lo < hi
    invariant 0 <= lo <= hi <= a.Length
    invariant forall k :: 0 <= k < lo ==> a[k] < key
    invariant forall k :: hi <= k < a.Length ==> a[k] > key
    decreases hi - lo
  {
    var mid := lo + (hi - lo) / 2;
    if a[mid] < key {
      lo := mid + 1;
    } else if a[mid] > key {
      hi := mid;
    } else {
      return mid;
    }
  }
  return -1;
}

function Sum(n: nat): nat
{
  if n == 0 then 0 else n + Sum(n - 1)
}

lemma SumFormula(n: nat)
  ensures 2 * Sum(n) == n * (n + 1)
{
  if n > 0 { SumFormula(n - 1); }
}

method ComputeSum(n: nat) returns (s: nat)
  ensures 2 * s == n * (n + 1)
{
  s := 0;
  var i := 0;
  while i < n
    invariant 0 <= i <= n
    invariant s == Sum(i)
  {
    i := i + 1;
    s := s + i;
  }
  SumFormula(n);        // bring the closed form into scope
}

method Main()
{
  var a := new int[5] [1, 3, 5, 7, 9];
  var r := BinarySearch(a, 7);
  print "index of 7: ", r, "\\n";        // 3
  var s := ComputeSum(10);
  print "sum 1..10: ", s, "\\n";         // 55
}

// $ dafny verify search.dfy
// Dafny program verifier finished with N verified, 0 errors`,
    notes: [
      'Delete the second loop invariant of BinarySearch and the "not found" postcondition fails: after the loop Dafny only knows the array right of hi is larger.',
      'Delete <code>SumFormula(n);</code> in ComputeSum and the postcondition fails: the verifier knows s == Sum(n) but does not prove the closed form by itself.',
      'The <code>new int[5] [1, 3, 5, 7, 9]</code> initializer syntax creates and fills an array; the verifier proves Sorted(a) at the call from those literal values.',
      'Exact verifier output wording varies by Dafny version.'
    ]
  },
  lab: {
    title: 'Verify FindMax',
    prompt: 'Complete the specification and loop annotations so Dafny can verify <code>FindMax</code>: it requires a non-empty array, and ensures <code>m</code> is at least every element and equals some element. Write two ensures clauses, and a loop with a bounds invariant, a "max so far" invariant, an "m occurs in the prefix" invariant, and a decreases clause.',
    starter: `method FindMax(a: array<int>) returns (m: int)
  // TODO: requires
  // TODO: ensures m is >= every element
  // TODO: ensures m equals some element
{
  m := a[0];
  var i := 1;
  while i < a.Length
    // TODO: invariants and decreases
  {
    if a[i] > m {
      m := a[i];
    }
    i := i + 1;
  }
}
`,
    checks: [
      { re: 'requires\\s+a\\.Length\\s*>\\s*0|requires\\s+0\\s*<\\s*a\\.Length', flags: '', must: true, hint: 'Need requires a.Length > 0, otherwise a[0] is out of bounds', pass: 'non-empty precondition' },
      { re: 'ensures\\s+forall\\s+k\\s*::\\s*0\\s*<=\\s*k\\s*<\\s*a\\.Length\\s*==>\\s*a\\[k\\]\\s*<=\\s*m', flags: '', must: true, hint: 'ensures forall k :: 0 <= k < a.Length ==> a[k] <= m', pass: 'upper-bound postcondition' },
      { re: 'ensures\\s+exists\\s+k\\s*::\\s*0\\s*<=\\s*k\\s*<\\s*a\\.Length\\s*&&\\s*a\\[k\\]\\s*==\\s*m', flags: '', must: true, hint: 'ensures exists k :: 0 <= k < a.Length && a[k] == m', pass: 'witness postcondition' },
      { re: 'invariant\\s+1\\s*<=\\s*i\\s*<=\\s*a\\.Length', flags: '', must: true, hint: 'Bounds invariant: invariant 1 <= i <= a.Length', pass: 'bounds invariant' },
      { re: 'invariant\\s+forall\\s+k\\s*::\\s*0\\s*<=\\s*k\\s*<\\s*i\\s*==>\\s*a\\[k\\]\\s*<=\\s*m', flags: '', must: true, hint: 'Max-so-far invariant over the prefix a[0..i]', pass: 'max-so-far invariant' },
      { re: 'invariant\\s+exists\\s+k\\s*::\\s*0\\s*<=\\s*k\\s*<\\s*i\\s*&&\\s*a\\[k\\]\\s*==\\s*m', flags: '', must: true, hint: 'm occurs in the prefix: invariant exists k :: 0 <= k < i && a[k] == m', pass: 'witness invariant' },
      { re: 'decreases\\s+a\\.Length\\s*-\\s*i', flags: '', must: true, hint: 'decreases a.Length - i', pass: 'termination measure' },
      { re: 'TODO', flags: '', must: false, hint: 'Replace every TODO', pass: 'no TODOs left' }
    ],
    run: 'Install Dafny (<code>dotnet tool install --global dafny</code>, needs the .NET SDK; or install the Dafny VS Code extension). Save as <code>findmax.dfy</code> and run <code>dafny verify findmax.dfy</code>. Then experiment: remove the bounds invariant and read the error (the postcondition fails because i == a.Length is no longer known at exit); change <code>i := 1</code> to <code>i := 0</code> and see which invariant now fails on entry.',
    solution: `method FindMax(a: array<int>) returns (m: int)
  requires a.Length > 0
  ensures forall k :: 0 <= k < a.Length ==> a[k] <= m
  ensures exists k :: 0 <= k < a.Length && a[k] == m
{
  m := a[0];
  var i := 1;
  while i < a.Length
    invariant 1 <= i <= a.Length
    invariant forall k :: 0 <= k < i ==> a[k] <= m
    invariant exists k :: 0 <= k < i && a[k] == m
    decreases a.Length - i
  {
    if a[i] > m {
      m := a[i];
    }
    i := i + 1;
  }
}
`,
    notes: [
      'This is a standard textbook Dafny example; it was not run here because Dafny is not installed.',
      'At loop exit Dafny knows the invariants and not (i < a.Length). With 1 <= i <= a.Length that gives i == a.Length, turning both prefix invariants into the postconditions.',
      'The existential invariant needs a witness after m := a[i]; Z3 finds k = i because the term a[i] appears in the assignment.'
    ]
  },
  quiz: [
    {
      q: 'A method has requires P and ensures Q. At a call site, what does Dafny do?',
      options: ['Inlines the body', 'Asserts P, then assumes Q (after havocking results and modified locations)', 'Assumes P and asserts Q', 'Runs the method on test inputs'],
      correct: 1,
      explain: 'Calls are modular: the caller must establish the precondition and may rely only on the postcondition.'
    },
    {
      q: 'Dafny says "this loop invariant might not be maintained by the loop". The code is correct. Most likely fix?',
      options: ['Add decreases', 'Strengthen the invariant with the fact the verifier is missing at the top of an arbitrary iteration', 'Remove the invariant', 'Increase the timeout'],
      correct: 1,
      explain: 'The verifier only knows the invariant at the top of an arbitrary iteration. If that is not enough to prove it again after one iteration, it is too weak.'
    },
    {
      q: 'In Dafny 4, which declaration is erased by the compiler?',
      options: ['function', 'method', 'ghost function and lemma', 'predicate without ghost'],
      correct: 2,
      explain: 'In Dafny 4, function and predicate are compiled by default; ghost function, ghost predicate, lemma and ghost variables are specification-only.'
    },
    {
      q: 'Why does the Dafny binary search not need lo + (hi - lo) / 2 for overflow safety?',
      options: ['Arrays are small', 'Dafny int is a mathematical unbounded integer', 'Z3 checks overflow automatically', 'It does need it'],
      correct: 1,
      explain: 'int is unbounded in Dafny. Overflow matters only with bounded newtypes or when reasoning about compiled machine integers.'
    },
    {
      q: 'Verification of a quantified invariant suddenly times out after an innocent edit. What is a plausible cause?',
      options: ['A matching loop or trigger explosion in E-matching, or general proof brittleness', 'Dafny ran out of disk', 'The loop does not terminate', 'Boogie cannot parse the file'],
      correct: 0,
      explain: 'Quantifier instantiation is heuristic; small changes alter the query and can cause instantiation cascades. Use explicit triggers, opaque definitions and smaller lemmas.'
    }
  ],
  testFlow: {
    title: 'Diagnose the Dafny error',
    start: 'q1',
    nodes: {
      q1: { q: 'Error: "this invariant could not be proved to hold on entry". Where do you look?', choices: [ { text: 'The code before the loop and the invariant\'s initial values', to: 'q1ok' }, { text: 'The loop body', to: 'q1bad' } ] },
      q1ok: { end: true, correct: true, text: 'Right: entry failures are about initialization, such as starting i at 0 when the invariant says 1 <= i.', next: 'q2' },
      q1bad: { end: true, correct: false, text: 'The body has not run yet on entry. Check the initialization against the invariant.', retry: 'q1' },
      q2: { q: 'Every invariant verifies but the postcondition fails after the loop. Fix?', choices: [ { text: 'Add an invariant that, with the negated guard, implies the postcondition (often a bounds invariant)', to: 'q2ok' }, { text: 'Add a decreases clause', to: 'q2bad' } ] },
      q2ok: { end: true, correct: true, text: 'Yes: after the loop, the verifier knows only invariant and not guard.', next: 'q3' },
      q3: { q: 'A caller cannot prove anything about the result of a method you just wrote, even though its body is obviously right. Why?', choices: [ { text: 'The method lacks an ensures clause; callers never see method bodies', to: 'q3ok' }, { text: 'Z3 is incomplete', to: 'q3bad' } ] },
      q2bad: { end: true, correct: false, text: 'Termination is unrelated to the postcondition. Think about what is known at exit.', retry: 'q2' },
      q3ok: { end: true, correct: true, text: 'Exactly: modular verification means the contract is the only interface.' },
      q3bad: { end: true, correct: false, text: 'It is simpler than that: method bodies are invisible to callers.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Writing a method where a function was intended, then wondering why callers cannot use its definition. Methods are opaque; functions unfold.',
    'Forgetting the bounds invariant (0 <= i <= n). It looks trivial but without it Dafny cannot conclude i == n at loop exit.',
    'Writing a weak or vacuous specification: ensures true, or ensures that only restates the code. It verifies, but proves nothing useful. Review specs as carefully as code.',
    'Quantifiers without a good trigger (for example over bare arithmetic), leading to facts that are never used or to matching-loop timeouts.',
    'Mixing Dafny 3 and Dafny 4 syntax from old tutorials: function method no longer exists in Dafny 4.'
  ],
  interview: [
    {
      q: 'Walk me through verifying binary search in Dafny. What invariants and why?',
      a: 'Precondition: the array is sorted. Postconditions: a non-negative result is a valid index holding the key; a negative result means the key is absent. Loop over the half-open range [lo, hi) with three invariants: bounds 0 <= lo <= hi <= a.Length; everything left of lo is less than key; everything from hi on is greater than key. Decreases hi - lo. When a[mid] < key, sortedness lets the verifier extend the left invariant to mid, so lo := mid + 1 preserves it; symmetric for the right. On exit lo == hi so the two invariants cover the array, giving "not found". Ints are unbounded, but I would still write lo + (hi - lo) / 2 because it is the habit that avoids the classic overflow bug in Java or C.'
    },
    {
      q: 'How does Dafny turn your program into something Z3 can check?',
      a: 'Dafny translates to Boogie, an intermediate verification language with assert, assume, havoc, assignments and procedures. The heap becomes an explicit map, frames become assumptions about unchanged locations, calls become assert-pre, havoc, assume-post, and loops are cut at invariants: assert invariant, havoc modified variables, assume invariant, verify one iteration. Boogie converts to passive SSA form and computes a weakest-precondition VC, then emits SMT-LIB. Z3 checks whether the negated VC is satisfiable: unsat means verified; a model or unknown is mapped back to a source-level error. Quantifiers are handled with E-matching using triggers.'
    },
    {
      q: 'Explain a tradeoff: Dafny vs Lean for verifying an algorithm.',
      a: 'Dafny is auto-active: you write the program with specifications and hints, and Z3 does the logic. It is fast to get started, the code is executable and compiles to several languages, and simple invariants verify instantly. The costs are unpredictability (timeouts, brittleness when Z3 heuristics change), limited control when automation fails, and a trusted base that includes Z3 and the Boogie encoding. Lean is interactive: proofs are explicit terms checked by a small kernel, so they are stable and highly trustworthy, and Mathlib gives deep mathematics; but proofs take more effort and the programs are functional. For a verified data-structure library shipped as code, Dafny; for deep mathematical properties or a long-lived proof that must not break with solver upgrades, Lean.'
    },
    {
      q: 'Your loop invariant is true but Dafny cannot prove it is maintained. How do you debug?',
      a: 'First remember that at the top of an arbitrary iteration the verifier knows only the invariants, the guard, and facts about unchanged variables. I check whether the iteration needs a fact I did not state, like bounds, a relationship between two variables, or "the rest of the array is unchanged". Then I add assert statements inside the body to locate the step that fails, possibly calling lemmas for arithmetic or recursive-function facts that need more unfolding. If an invariant involves a quantifier, I check the trigger, since a missing instantiation looks exactly like a weak invariant. assume false can bisect a long body.'
    },
    {
      q: 'What is the difference between a function, a method and a lemma in Dafny?',
      a: 'A function is a pure expression whose definition is visible to the verifier, usable inside specifications; in Dafny 4 it is compiled unless marked ghost. A method is imperative code that may loop, allocate and mutate; callers see only its contract. A lemma is a ghost method whose ensures is a theorem and whose body is the proof; recursive lemma calls are induction hypotheses and must decrease. Ghost code is erased at compile time.'
    },
    {
      q: 'Design question: how would you use an LLM to help annotate Dafny code at scale, and how would you evaluate it?',
      a: 'Loop: give the model the method plus the Dafny error, ask for invariants or assertions only (not changes to the code or the ensures), run dafny verify, feed back the first error, and retry a bounded number of times. Guardrails: diff-check that the executable code and the specification are unchanged, reject assume statements and {:verify false}, and reject weakened postconditions. Evaluation: verification success rate on a held-out benchmark of methods with reference specs, attempts and wall time per success, and spec-strength checks such as mutation testing of the specification (does the spec reject mutated implementations?). Track timeouts separately from failures.'
    },
    {
      q: 'Why must lemmas terminate?',
      a: 'A lemma is a proof. A non-terminating lemma can "prove" anything: lemma Bad() ensures false { Bad(); } would make the logic inconsistent. Dafny requires a decreasing measure for recursive lemmas so that recursion corresponds to well-founded induction. Methods can opt out with decreases *, lemmas and functions cannot.'
    }
  ]
};
