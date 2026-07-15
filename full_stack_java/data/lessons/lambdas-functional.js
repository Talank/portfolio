window.LESSONS = window.LESSONS || {};
window.LESSONS['lambdas-functional'] = {
  id: 'lambdas-functional',
  title: 'Lambdas & Functional Interfaces: Function, Predicate, Method References',
  category: 'Part 4 — Modern Java',
  timeMin: 45,
  summary: 'Part 1 taught you that a one-abstract-method interface (Searchable, Comparator) is a capability contract — this lesson gives you the compact syntax Java added to FILL one inline, without writing a named class. You will see what makes an interface "functional" (exactly one abstract method), how a lambda expression implements that method on the spot, the small set of built-in shapes (Function, Predicate, Consumer, Supplier) that cover almost every case so you rarely need a custom interface, the four kinds of method references that let you reuse an existing method instead of writing a lambda, and the closure rule — effectively final capture — that governs what a lambda is allowed to reach outside itself. Streams, next lesson, are built entirely on top of what you learn here.',
  goals: [
    'Recognize a functional interface (exactly one abstract method) and explain why default/static methods don\'t count against that rule',
    'Write lambda expressions in expression and block form and know when Java can infer parameter types',
    'Use the four core java.util.function interfaces — Function, Predicate, Consumer, Supplier — instead of inventing custom ones',
    'Replace a lambda with the right kind of method reference (static, bound instance, unbound instance, constructor) when the lambda just calls one existing method',
    'Explain effectively-final capture: why a lambda can read a local variable but not reassign it, and why captured fields behave differently'
  ],
  concept: [
    {
      h: 'A functional interface: exactly one abstract method, and a lambda fills it',
      p: [
        'You already met the shape in Part 1: <code>interface Searchable { List&lt;Hit&gt; search(String query); }</code> has exactly ONE abstract method. Any interface with that property — precisely one method left unimplemented, no matter how many <code>default</code> or <code>static</code> methods it also carries (those have bodies, they don\'t count) — is a <b>functional interface</b>, and Java lets you implement it INLINE with a <b>lambda expression</b> instead of writing a named class. <code>Searchable byTag = query -> index.stream()...</code> reads as "here is a value of type Searchable, and its one method\'s body is this expression" — the lambda IS the method body, and its parameter list must match the abstract method\'s signature (here, one <code>String</code> parameter, matching <code>search(String query)</code>). The <code>@FunctionalInterface</code> annotation (optional, but good practice on your own interfaces) asks the compiler to VERIFY exactly one abstract method exists and error if a second one is ever added — a guardrail, not a requirement; <code>Comparator</code>, <code>Runnable</code>, and <code>Searchable</code> all qualify whether or not they carry the annotation.',
        'This is not new capability — it is DRAMATICALLY shorter syntax for something Java could always do: implement an interface anonymously. Before lambdas, you\'d write <code>Searchable byTag = new Searchable() { public List&lt;Hit&gt; search(String query) { ... } };</code> — an anonymous inner class, all that ceremony to supply one method body. A lambda strips away the class declaration, the method signature, and the boilerplate, leaving only the parameter list and the body: <code>query -> ...</code>. The two compile to nearly the same bytecode-level idea (a lambda is actually implemented more efficiently, via <code>invokedynamic</code>, not a hidden class file per lambda) but the lambda is what you write and read from here on. The rule that unlocks all of it: you can ONLY use lambda syntax where the compiler can determine you\'re implementing a functional interface — one abstract method to fill, unambiguously.'
      ]
    },
    {
      h: 'Lambda syntax: expression and block form, and type inference',
      p: [
        'The general shape is <code>(parameters) -> body</code>. For a single expression, the EXPRESSION form omits braces and the value of the expression becomes the return: <code>Predicate&lt;String&gt; isBlank = s -> s.trim().isEmpty();</code> — no <code>return</code> keyword, no semicolon before the closing context. For multi-statement logic, the BLOCK form uses braces and an explicit <code>return</code> (if the abstract method returns something): <code>Function&lt;String,Integer&gt; wordCount = text -> { String[] parts = text.split("\\\\s+"); return parts.length; };</code>. Parentheses around a SINGLE untyped parameter are optional (<code>s -> ...</code> or <code>(s) -> ...</code>, identical), but required for zero or multiple parameters: <code>() -> "default"</code> and <code>(a, b) -> a + b</code>.',
        'Parameter TYPES are almost always omitted and inferred from the functional interface\'s method signature — the compiler knows <code>Predicate&lt;String&gt;.test</code> takes a <code>String</code>, so <code>s -> s.isEmpty()</code> needs no type annotation on <code>s</code>. You CAN write them explicitly (<code>(String s) -> s.isEmpty()</code>), and Java requires it if you mix explicit and implicit across multiple parameters (an all-or-nothing rule), but the terse form is standard style. The target type — which functional interface a given lambda is implementing — comes entirely from CONTEXT: the declared variable type, the parameter type of the method you\'re passing the lambda into, or a cast. The same lambda literal <code>x -> x * 2</code> could implement <code>UnaryOperator&lt;Integer&gt;</code> or a custom <code>IntTransformer</code> interface — its meaning depends entirely on where it\'s used, which is why a bare lambda has no type of its own outside an assignment or call context.'
      ]
    },
    {
      h: 'The four shapes that cover almost everything: Function, Predicate, Consumer, Supplier',
      p: [
        'Rather than write a custom functional interface for every one-method need (as Searchable and Comparator are custom because they carry domain meaning), <code>java.util.function</code> ships four generic shapes that cover the overwhelming majority of cases, and streams (next lesson) are built entirely on them. <code>Function&lt;T,R&gt;</code> — "take a T, return an R" — <code>apply(T t)</code>; used for transforming data: <code>Function&lt;LogEntry,String&gt; title = LogEntry::title;</code>. <code>Predicate&lt;T&gt;</code> — "take a T, answer yes or no" — <code>test(T t)</code> returning <code>boolean</code>; used for filtering: <code>Predicate&lt;LogEntry&gt; isUrgent = e -> e.priority() == 1;</code>. <code>Consumer&lt;T&gt;</code> — "take a T, do something, return nothing" — <code>accept(T t)</code>; used for side effects like printing or saving: <code>Consumer&lt;LogEntry&gt; log = e -> System.out.println(e.title());</code>. <code>Supplier&lt;T&gt;</code> — "take nothing, produce a T" — <code>get()</code>; used for lazy or deferred creation: <code>Supplier&lt;List&lt;LogEntry&gt;&gt; freshList = ArrayList::new;</code>.',
        'Related variants worth recognizing rather than memorizing exhaustively: <code>BiFunction&lt;T,U,R&gt;</code> and <code>BiConsumer&lt;T,U&gt;</code> take TWO inputs instead of one; <code>UnaryOperator&lt;T&gt;</code> is a specialized <code>Function&lt;T,T&gt;</code> where input and output types match (a transformation that stays in the same type, like <code>String::toUpperCase</code>); <code>BinaryOperator&lt;T&gt;</code> is a specialized <code>BiFunction&lt;T,T,T&gt;</code> (combining two of the same type into one, like addition); and primitive-specialized versions (<code>IntPredicate</code>, <code>ToIntFunction&lt;T&gt;</code>, <code>IntSupplier</code>) exist to avoid autoboxing overhead in hot paths. The design payoff: because these interfaces are STANDARD, a method that accepts a <code>Predicate&lt;T&gt;</code> parameter can be called with a lambda, a method reference, or a stored variable, from ANY caller, without either side needing to know about a custom interface — it is the same "program to the interface" leverage from Part 1, now applied to behavior itself, not just objects.'
      ]
    },
    {
      h: 'Method references: reuse an existing method instead of writing a lambda',
      p: [
        'When a lambda\'s ENTIRE body is a call to one already-existing method, Java lets you skip the lambda syntax and reference the method by name with <code>::</code> — shorter, and it reuses tested code instead of re-describing the call. There are four kinds. <b>Static method reference</b> — <code>Type::staticMethod</code> — for a lambda that just calls a static method: <code>Function&lt;String,Integer&gt; parse = Integer::parseInt;</code> is exactly <code>s -> Integer.parseInt(s)</code>. <b>Bound instance method reference</b> — <code>instance::method</code> — for a lambda that calls a method on one SPECIFIC, already-existing object: <code>Consumer&lt;String&gt; print = System.out::println;</code> is exactly <code>s -> System.out.println(s)</code>, bound to that one <code>System.out</code> object. <b>Unbound instance method reference</b> — <code>Type::instanceMethod</code> — for a lambda whose FIRST parameter becomes the object the method is called ON: <code>Function&lt;LogEntry,String&gt; title = LogEntry::title;</code> is exactly <code>e -> e.title()</code> — the lambda\'s parameter supplies the receiver. <b>Constructor reference</b> — <code>Type::new</code> — for a lambda that just calls a constructor: <code>Supplier&lt;ArrayList&lt;String&gt;&gt; factory = ArrayList::new;</code> is exactly <code>() -> new ArrayList&lt;String&gt;()</code>.',
        'The judgment call: use a method reference when it\'s a direct, unmodified delegation to one existing method — it reads as "just do what this method already does," and eliminates a redundant restatement of a call that\'s already named clearly (<code>LogEntry::title</code> over <code>e -> e.title()</code> is shorter and arguably clearer once you\'re fluent in the syntax). Keep the lambda when there\'s ANY additional logic — a condition, a transformation, string concatenation, multiple statements — because forcing that into a method reference either requires extracting a throwaway helper method (adding indirection for no benefit) or is simply impossible. Neither is "more correct"; method references are a readability optimization for the specific case of pure delegation, not a mandate.'
      ]
    },
    {
      h: 'Closures: what a lambda can capture, and the effectively-final rule',
      p: [
        'A lambda can read variables from its ENCLOSING scope — local variables, method parameters, instance fields, static fields — which is what makes it a <b>closure</b>: it "closes over" the environment it was created in and carries that access with it, even after the enclosing method has returned. But local variables and parameters are captured under one hard constraint: they must be <b>effectively final</b> — assigned exactly once, never reassigned anywhere after initialization, even if you don\'t write the <code>final</code> keyword explicitly. <code>String prefix = "[LOG] "; Consumer&lt;String&gt; log = s -> System.out.println(prefix + s);</code> compiles because <code>prefix</code> is never reassigned. Add one line, <code>prefix = "[WARN] ";</code>, anywhere after, and the lambda no longer compiles — the compiler flags <code>prefix</code> as "not effectively final."',
        'The reason isn\'t arbitrary: Java captures LOCAL variables by taking a snapshot COPY of the value at the point the lambda is created — the lambda doesn\'t hold a live reference back into the method\'s stack frame (which may not even exist anymore by the time the lambda runs, if the method already returned). If reassignment were allowed, the lambda\'s copy and the method\'s current value would silently diverge, and — worse — if the same lambda were shared across threads (Part 5), a reassignable capture would be a genuine data race. Effectively-final capture sidesteps the whole problem by making the captured value immutable from the lambda\'s perspective, by construction. Fields (instance or static) behave DIFFERENTLY and are NOT subject to this rule, because a lambda referencing <code>this.count</code> doesn\'t capture a snapshot value — it captures a reference to the enclosing object (effectively <code>this</code>), and reads the field live through it each time the lambda runs; that field CAN change between calls, and the lambda will see the new value, for better (live shared state) or worse (yet another source of the shared-mutable-state bugs the concurrency lesson warns about).'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Nami\'s one-line order chits, the standard blank forms, and the frozen tide reading',
      text: 'Nami doesn\'t always draft a full role description for a one-off job. When she needs "whoever\'s free" to do exactly ONE thing — "when you spot land, ring the bell" — she scrawls it on a single ORDER CHIT and hands it to whoever\'s nearest, instead of formally appointing a new crew position with a title and a manual (a functional interface: exactly one job to fill; a lambda: the inline, on-the-spot way to fill it, no named class required). She keeps a stack of pre-printed BLANK CHIT TEMPLATES for the jobs that come up constantly, so nobody drafts new wording every time: a yes/no chit — "check this and report true or false" (Predicate) — for things like "is the barrel empty?"; a transform chit — "take this, hand back that" (Function) — for "take this fish, hand back its weight"; a do-it chit — "take this, no report needed" (Consumer) — for "take this crate below deck"; and a make-me-one chit — "no input, just produce one" (Supplier) — for "fetch me a fresh water skin." Most jobs on the Sunny fit one of the four blank forms; nobody invents a new chit shape unless the job is genuinely special, the way Searchable and Comparator were. Sometimes, instead of writing fresh instructions at all, Nami just writes "do what Zoro always does when he spots an enemy ship" — pointing at an ALREADY-NAMED, already-known move rather than describing it again from scratch (a method reference: reuse an existing method instead of writing a new lambda body) — and depending on whose move she\'s citing, that\'s either "do Franky\'s signature build move" (a static, ship-wide technique), "do what THIS specific lookout, Usopp, does" (bound to one crewmate), "have whoever\'s holding the chit do THEIR OWN version of the move" (unbound — the holder supplies themselves as the actor), or "build me a brand new one of these" (a construction chit, pointing at "make one," not a specific existing thing). And when Chopper is sent off holding a chit that says "row until you reach the depth we measured at departure," the NUMBER written on that chit is frozen the moment he left — nobody can walk out to sea and rewrite it in his hand, because the crew learned the hard way that a chit whose number could change mid-errand caused Chopper to act on stale-vs-fresh readings inconsistently (effectively-final capture: a snapshot, immutable once handed over). But if his chit instead just says "check the ship\'s log" — pointing at the shared logbook itself, not a copied number — he genuinely sees whatever is CURRENTLY written there, because he\'s holding a reference to a shared, live object, not a frozen value.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Post-it instructions, the pre-printed forms, and the signed thermostat clause',
      text: 'Sheldon doesn\'t draft a formal job description for a one-off favor. When he needs exactly ONE thing done — "when the mail arrives, knock twice" — he writes it on a single Post-it and hands it to whoever\'s around, rather than issuing anyone a role with a manual (a functional interface: one method to fill; a lambda: the compact, inline way to fill it). He keeps a drawer of pre-printed STANDARD FORMS for the requests that recur constantly, precisely so he never re-drafts the wording: a yes/no form — "is the following statement true?" — for things like "is the milk expired?" (Predicate); a convert form — "input one value, output the converted value" — for "convert this Celsius reading to Fahrenheit" (Function); a just-do-it form — "perform the following action, no report expected" — for "water the plant" (Consumer); and a produce-one form — "no input required, hand me one" — for "fetch me a fresh tissue" (Supplier). Instead of writing fresh, verbose instructions, Sheldon often simply writes "do what Leonard usually does here" — citing an ALREADY-DEFINED routine instead of re-describing it (a method reference) — and the exact phrasing depends on whose routine he means: "do the building\'s standard fire-drill procedure" (a shared, static routine), "do what THIS specific person, Wolowitz, does" (bound to one person), "have whoever reads this do THEIR OWN version" (unbound — the reader supplies themselves), or "produce a brand-new one of these" (a make-a-new-instance instruction). And the roommate-agreement addendum he once had Penny sign captured "the thermostat setting AT THE MOMENT OF SIGNING" — a number frozen into the paper the instant it was signed, which nobody can retroactively rewrite, because Sheldon insists a captured value in a legal document must be fixed, not fluid (effectively-final capture). But a clause that instead says "whatever the CURRENT posted house rule is" points at the shared, LIVE rulebook itself, not a frozen number — so it genuinely reflects whatever the rulebook currently says, updates included.',
    },
    why: 'The order chit / Post-it is a lambda filling a functional interface — one job, no formal class needed. The four blank templates (yes/no, transform, do-it, produce-one) are Predicate, Function, Consumer, and Supplier — standard shapes that cover almost every case so custom interfaces stay reserved for genuinely domain-specific contracts like Searchable. "Do what X already does" is a method reference, and its four flavors (Franky\'s signature move = static; a specific crewmate\'s move = bound instance; "whoever holds this does their own version" = unbound instance; "build a new one" = constructor) map onto Type::staticMethod, instance::method, Type::instanceMethod, and Type::new. And the frozen tide reading / signed thermostat number is effectively-final capture: a local variable is snapshotted the instant the lambda is created and can never be reassigned afterward — while a reference to a shared, live object (the ship\'s log, the posted house rule) still reflects whatever is CURRENTLY there, because that\'s a live reference, not a frozen value.'
  },
  storyAnim: {
    title: 'Order chits, standard forms, "do what X does," and the frozen number',
    h: 320,
    props: [
      { id: 'chit', emoji: '📜', label: 'one-line order chit: exactly ONE job (functional interface)', x: 14, y: 10 },
      { id: 'lambda', emoji: '✍️', label: 'filled in on the spot, no formal role (lambda)', x: 40, y: 10 },
      { id: 'forms', emoji: '🗂️', label: 'stack of standard blank forms: yes/no, transform, do-it, produce-one', x: 70, y: 10 },
      { id: 'methodref', emoji: '👉', label: '"do what Zoro always does" — point at an existing move (method reference)', x: 20, y: 46 },
      { id: 'kinds', emoji: '🏷️', label: 'four flavors: static / bound / unbound / constructor', x: 55, y: 46 },
      { id: 'frozen', emoji: '🧊', label: 'tide reading frozen at handoff — effectively final', x: 20, y: 80 },
      { id: 'livelog', emoji: '📖', label: 'ship\'s log reference stays live — reads current value', x: 62, y: 80 }
    ],
    actors: [
      { id: 'nami', emoji: '🍊', label: 'Nami', x: 10, y: 26 },
      { id: 'chopper', emoji: '🦌', label: 'Chopper', x: 88, y: 60 }
    ],
    steps: [
      { c: 'Nami scrawls a one-line order chit: exactly ONE job to fill. That single-method shape is a functional interface.', p: { chit: 'good' }, a: { nami: [14, 26] } },
      { c: 'Whoever\'s nearest fills it in on the spot — no formal role, no manual. That inline fill-in is a lambda expression.', p: { lambda: 'lit' } },
      { c: 'For jobs that recur constantly, Nami reaches for a pre-printed standard form instead of drafting new wording: yes/no, transform, do-it, produce-one — Predicate, Function, Consumer, Supplier.', p: { forms: 'good' } },
      { c: 'Sometimes she just writes "do what Zoro always does" — pointing at an already-known move instead of describing it again. That\'s a method reference.', p: { methodref: 'good' } },
      { c: 'Which move she\'s citing determines the flavor: a ship-wide signature technique (static), one crewmate\'s own move (bound), "whoever holds this does their own version" (unbound), or "build a new one" (constructor).', p: { kinds: 'lit' } },
      { c: 'Chopper\'s chit captures the tide reading AT THE MOMENT he left — frozen, unchangeable afterward. That\'s effectively-final capture of a local variable.', p: { frozen: 'bad' }, a: { chopper: [20, 60] } },
      { c: 'But a chit that instead points at the ship\'s LOG ITSELF stays live — Chopper reads whatever is CURRENTLY written there, because it\'s a shared reference, not a frozen snapshot.', p: { livelog: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'From functional interface to lambda to method reference',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Recognize the shape',
        nodes: [
          { id: 'sam', text: 'exactly ONE abstract method?\n→ functional interface' },
          { id: 'annotation', text: '@FunctionalInterface\ncompiler-checked, optional' }
        ]
      },
      {
        label: 'Fill it with a lambda',
        nodes: [
          { id: 'expr', text: 'expression form\ns -> s.isEmpty()' },
          { id: 'block', text: 'block form\ns -> { ...; return x; }' }
        ]
      },
      {
        label: 'Reach for a standard shape first',
        nodes: [
          { id: 'function', text: 'Function<T,R>: T → R' },
          { id: 'predicate', text: 'Predicate<T>: T → boolean' },
          { id: 'consumer', text: 'Consumer<T>: T → void' },
          { id: 'supplier', text: 'Supplier<T>: () → T' }
        ]
      },
      {
        label: 'Simplify to a method reference?',
        nodes: [
          { id: 'purecall', text: 'lambda body = ONE existing method call?' },
          { id: 'refkinds', text: 'Type::static / obj::method\nType::instanceMethod / Type::new' }
        ]
      },
      {
        label: 'Mind what it captures',
        nodes: [
          { id: 'efffinal', text: 'local vars: effectively final\n(snapshot, no reassignment)' },
          { id: 'livefield', text: 'fields: live reference\n(reads current value each call)' }
        ]
      }
    ],
    steps: [
      { active: ['sam'], note: 'First check: does this interface have exactly one abstract method? default/static methods with bodies don\'t count. If yes, it\'s functional — a lambda can implement it.' },
      { active: ['annotation'], note: '@FunctionalInterface is optional but useful on your own interfaces: it makes the compiler reject a second abstract method by mistake, catching an accidental contract change early.' },
      { active: ['expr'], note: 'For a single expression, skip braces and return — the expression\'s value IS the return value. This is the common case for short predicates and transforms.' },
      { active: ['block'], note: 'For multi-statement logic, use braces and an explicit return, exactly like a normal method body.' },
      { active: ['function', 'predicate', 'consumer', 'supplier'], note: 'Before inventing a custom functional interface, check if Function, Predicate, Consumer, or Supplier already matches the shape you need — most one-method needs fit one of these four.' },
      { active: ['purecall'], note: 'If the lambda body is nothing but a call to one existing method — no extra logic — you can likely replace it with a method reference instead.' },
      { active: ['refkinds'], note: 'Pick the kind by what\'s being referenced: Type::staticMethod (a static method), obj::method (one specific object\'s method), Type::instanceMethod (the lambda\'s parameter supplies the receiver), Type::new (a constructor).' },
      { active: ['efffinal'], note: 'A lambda capturing a local variable gets a frozen SNAPSHOT taken at creation time — the variable must never be reassigned anywhere after, or the compiler rejects the capture.' },
      { active: ['livefield'], note: 'Fields are different: a lambda referencing this.someField captures a reference to the enclosing object and reads the field LIVE each call — it CAN change between invocations, which is a feature and a hazard.' }
    ]
  },
  tech: [
    {
      q: 'What makes an interface "functional," and how does a lambda actually implement it?',
      a: 'An interface is functional if it has exactly ONE abstract method — any number of default methods, static methods, and even methods inherited from Object (like equals or toString, which don\'t count as abstract for this purpose since every class already has them) can coexist, but there must be precisely one method left with no body for an implementer to supply. Searchable (Part 1), Comparator, Runnable, and Callable all qualify. A lambda expression is Java\'s syntax for supplying that ONE method\'s body inline, without a named class: the lambda\'s parameter list must match the abstract method\'s parameter types (inferred, usually left implicit), and its body becomes that method\'s implementation. Mechanically, when you write Searchable byTag = query -> ...;, the compiler determines from the assignment context that Searchable is a functional interface, matches the lambda\'s single parameter against search(String query)\'s single parameter, and generates code (via invokedynamic and a synthetic call site, not a hand-written anonymous class) that produces an object implementing Searchable whose search method runs the lambda body. The @FunctionalInterface annotation is optional documentation-plus-enforcement: it doesn\'t change behavior, but it makes the compiler error out if someone later adds a second abstract method, which would silently break every lambda currently implementing that interface (a lambda can only ever implement ONE method, so a second abstract method makes the interface no longer functional and no longer lambda-implementable).'
    },
    {
      q: 'Walk through the four java.util.function interfaces and when each is the right fit.',
      a: 'These four generic shapes cover the overwhelming majority of one-method needs, and I reach for them before ever writing a custom functional interface. Function<T,R> — method apply(T t) returning R — models "transform a T into an R," and is the interface behind every stream .map(...) call: Function<LogEntry,String> title = LogEntry::title. Predicate<T> — method test(T t) returning boolean — models "answer yes or no about a T," and is what stream .filter(...) takes: Predicate<LogEntry> isUrgent = e -> e.priority() == 1. Consumer<T> — method accept(T t) returning void — models "do something with a T, no result," used for side effects like logging or saving, and is what stream .forEach(...) takes: Consumer<LogEntry> print = e -> System.out.println(e.title()). Supplier<T> — method get() taking nothing, returning T — models "produce a T on demand," used for lazy/deferred creation or default values: Supplier<List<LogEntry>> factory = ArrayList::new. I pick among them purely by SHAPE: does my logic take an input and produce a different-typed output (Function), take an input and answer true/false (Predicate), take an input and do something without returning (Consumer), or take nothing and produce something (Supplier)? The two-argument siblings (BiFunction, BiConsumer) and the type-preserving specializations (UnaryOperator<T> = Function<T,T>, BinaryOperator<T> = BiFunction<T,T,T>) extend the same logic to two inputs or same-type transforms. I only reach for a CUSTOM functional interface, like Searchable, when the method name and parameter meaning carry domain significance that a generic Function/Predicate name would obscure — Searchable.search(query) documents intent that Function<String,List<Hit>> would not.'
    },
    {
      q: 'Explain the four kinds of method references and give an example of each.',
      a: 'A method reference replaces a lambda whose entire body is a single call to an existing method, using :: instead of writing out the call. Static method reference — Type::staticMethod — for a lambda calling a static method: Function<String,Integer> parse = Integer::parseInt is identical to s -> Integer.parseInt(s); the lambda\'s parameter becomes the static method\'s argument. Bound instance method reference — instance::method — for a lambda calling a method on one SPECIFIC object that already exists at the point you write the reference: Consumer<String> print = System.out::println is identical to s -> System.out.println(s), permanently bound to that one System.out object. Unbound instance method reference — Type::instanceMethod — for a lambda whose FIRST parameter supplies the object the method is called ON, rather than a pre-existing object: Function<String,Integer> length = String::length is identical to s -> s.length() — there is no specific String yet; whichever String is passed in when the function is eventually called becomes the receiver. Constructor reference — Type::new — for a lambda that just calls a constructor: Supplier<ArrayList<String>> factory = ArrayList::new is identical to () -> new ArrayList<String>(); with a parameterized functional interface like Function<String,LogEntry>, LogEntry::new would call a constructor taking one String argument instead. I use method references when they\'re a direct, unmodified delegation — they read cleanly once you\'re fluent in the syntax and reuse an already-tested, already-named method — and fall back to a full lambda the moment there\'s any additional logic, since forcing extra logic into a method reference means extracting an awkward, single-use helper method purely to satisfy the syntax.'
    },
    {
      q: 'What is effectively-final capture, why does it exist, and how do fields behave differently?',
      a: 'A lambda can read local variables and parameters from its enclosing scope, but only if they are effectively final — assigned exactly once and never reassigned anywhere afterward in that scope, even without the explicit final keyword. The compiler enforces this: the moment you reassign a local variable anywhere after a lambda has captured it, every capture of that variable becomes a compile error. The reason is how capture actually works: Java takes a SNAPSHOT COPY of a local variable\'s value at the moment the lambda object is created, not a live reference back into the enclosing method\'s stack frame — which is necessary because that stack frame might not even exist anymore by the time the lambda actually runs (e.g., a lambda stored and invoked long after the method that created it has returned). If reassignment were legal, the lambda\'s frozen copy and the method\'s current value would silently diverge, producing confusing bugs — and if the same lambda were shared across threads, a mutable capture would be an outright data race, since there would be no synchronization protecting the shared variable. Effectively-final capture eliminates the whole class of bug by construction: the value literally cannot change after the lambda was created, so there\'s nothing to race on or diverge from. Fields — instance fields via an implicit this, or static fields — are NOT subject to this restriction, because a lambda referencing a field doesn\'t capture a value snapshot at all; it captures a reference to the enclosing OBJECT (or class, for statics) and reads the field fresh, live, each time the lambda executes. That field CAN be mutated between calls and the lambda will observe the new value — which is sometimes exactly what you want (a shared counter, a live configuration object) and sometimes the exact shared-mutable-state hazard the concurrency lesson (Part 5) spends real time on. The practical rule: if a lambda needs to react to a value that changes over time, capture it via a field or a wrapper object, not a local variable — the compiler won\'t even let you try the local-variable version once it changes.'
    }
  ],
  code: {
    title: 'LogPose search tools built from Function, Predicate, Consumer, and Supplier',
    intro: 'Small, generic pieces built on the four standard shapes, used against LogEntry records — filtering, transforming, and reacting, plus each of the four method-reference kinds and the effectively-final capture rule in action.',
    code: `import java.util.*;
import java.util.function.*;

record LogEntry(String title, String tag, int priority) {}

class SearchTools {
    static List<LogEntry> filter(List<LogEntry> entries, Predicate<LogEntry> test) {
        List<LogEntry> out = new ArrayList<>();
        for (LogEntry e : entries) if (test.test(e)) out.add(e);
        return out;
    }

    static List<String> transform(List<LogEntry> entries, Function<LogEntry, String> extractor) {
        List<String> out = new ArrayList<>();
        for (LogEntry e : entries) out.add(extractor.apply(e));
        return out;
    }

    static void notifyEach(List<LogEntry> entries, Consumer<LogEntry> action) {
        for (LogEntry e : entries) action.accept(e);
    }
}

public class LambdasDemo {
    static boolean isTesting(LogEntry e) { return e.tag().equals("testing"); }   // for the static method ref

    public static void main(String[] args) {
        List<LogEntry> entries = List.of(
            new LogEntry("flaky test triage", "testing", 1),
            new LogEntry("embedding cache design", "infra", 2),
            new LogEntry("mentoring notes", "people", 3)
        );

        // Predicate via a plain lambda (extra logic: an equality check on a computed field)
        List<LogEntry> urgent = SearchTools.filter(entries, e -> e.priority() == 1);
        System.out.println("urgent: " + urgent.size());                     // 1

        // Predicate via a STATIC method reference (Type::staticMethod) — pure delegation
        List<LogEntry> testingTagged = SearchTools.filter(entries, LambdasDemo::isTesting);
        System.out.println("testing-tagged: " + testingTagged.size());      // 1

        // Function via an UNBOUND instance method reference (Type::instanceMethod) —
        // the first argument passed in becomes the receiver of title()
        List<String> titles = SearchTools.transform(entries, LogEntry::title);
        System.out.println("titles: " + titles);

        // Consumer via a lambda that CAPTURES an effectively-final local (prefix)
        String prefix = "[LOG] ";
        SearchTools.notifyEach(entries, e -> System.out.println(prefix + e.title()));
        // prefix = "[WARN] ";   // uncommenting this line anywhere would break the capture above —
                                  // "prefix is not effectively final" — a compile error, not a runtime one

        // Consumer via a BOUND instance method reference (instance::method) —
        // System.out already exists; println is called on that specific object
        Consumer<String> printer = System.out::println;
        printer.accept("bound reference demo");

        // Supplier via a CONSTRUCTOR reference (Type::new)
        Supplier<List<LogEntry>> freshIndex = ArrayList::new;
        List<LogEntry> empty = freshIndex.get();
        System.out.println("fresh index size: " + empty.size());            // 0
    }
}`,
    notes: [
      'filter/transform/notifyEach take Predicate/Function/Consumer parameters — standard shapes, not custom interfaces — so ANY caller can pass a lambda, a method reference, or a stored variable without SearchTools ever needing to know which.',
      'isTesting demonstrates the static method reference; LogEntry::title (an unbound instance reference, since LogEntry is a record and title() is its accessor) demonstrates the second kind; System.out::println (bound to one existing object) the third; ArrayList::new (constructor reference) the fourth.',
      'prefix is captured by the Consumer lambda and must stay effectively final — the commented-out reassignment line is left in deliberately to show exactly what would break compilation. Run: javac LambdasDemo.java LogEntry.java && java LambdasDemo (or one file with both types).'
    ]
  },
  lab: {
    title: 'Filter and transform tags with Predicate, Function, and a method reference',
    prompt: 'Write a class <code>TagUtils</code> with two static methods, each using a plain loop (no streams — those are next lesson): <code>static List&lt;String&gt; keep(List&lt;String&gt; tags, Predicate&lt;String&gt; test)</code> returns the tags for which <code>test.test(tag)</code> is true; <code>static List&lt;Integer&gt; lengths(List&lt;String&gt; tags, Function&lt;String,Integer&gt; f)</code> returns <code>f.apply(tag)</code> for every tag, in order. In a <code>main</code> method, call <code>keep</code> with a LAMBDA that filters out blank tags, and call <code>lengths</code> with the METHOD REFERENCE <code>String::length</code>.',
    starter: `import java.util.*;
import java.util.function.*;

class TagUtils {
    static List<String> keep(List<String> tags, Predicate<String> test) {
        // loop, add tags where test.test(tag) is true
        return null; // replace
    }

    static List<Integer> lengths(List<String> tags, Function<String, Integer> f) {
        // loop, add f.apply(tag) for every tag
        return null; // replace
    }

    public static void main(String[] args) {
        List<String> tags = List.of("testing", "", "infra", " ", "people");

        // call keep with a lambda that filters out blank tags (tag.isBlank())

        // call lengths with the method reference String::length
    }
}`,
    checks: [
      { re: 'static\\s+List\\s*<\\s*String\\s*>\\s+keep\\s*\\([^)]*Predicate\\s*<\\s*String\\s*>', must: true, hint: 'keep must take a Predicate<String> parameter.', pass: 'keep(List, Predicate<String>) ✓' },
      { re: 'static\\s+List\\s*<\\s*Integer\\s*>\\s+lengths\\s*\\([^)]*Function\\s*<\\s*String\\s*,\\s*Integer\\s*>', must: true, hint: 'lengths must take a Function<String, Integer> parameter.', pass: 'lengths(List, Function<String,Integer>) ✓' },
      { re: 'test\\.test\\s*\\(', must: true, hint: 'keep must call test.test(tag) inside its loop.', pass: 'keep calls test.test(...) ✓' },
      { re: 'f\\.apply\\s*\\(', must: true, hint: 'lengths must call f.apply(tag) inside its loop.', pass: 'lengths calls f.apply(...) ✓' },
      { re: 'String::length', must: true, hint: 'Call lengths(...) with the method reference String::length.', pass: 'uses String::length method reference ✓' },
      { re: '->\\s*!?\\s*\\w+\\.isBlank\\s*\\(\\s*\\)', must: true, hint: 'Call keep(...) with a lambda like tag -> !tag.isBlank().', pass: 'uses a lambda for keep ✓' },
      { re: '\\.stream\\s*\\(', must: false, hint: 'Use a plain loop, not streams — streams are next lesson.', pass: 'no streams used yet ✓' }
    ],
    run: 'javac TagUtils.java && java TagUtils — print the results of keep(...) and lengths(...) to confirm blanks are filtered and lengths line up with the non-filtered tags list.',
    solution: `import java.util.*;
import java.util.function.*;

class TagUtils {
    static List<String> keep(List<String> tags, Predicate<String> test) {
        List<String> out = new ArrayList<>();
        for (String tag : tags) if (test.test(tag)) out.add(tag);
        return out;
    }

    static List<Integer> lengths(List<String> tags, Function<String, Integer> f) {
        List<Integer> out = new ArrayList<>();
        for (String tag : tags) out.add(f.apply(tag));
        return out;
    }

    public static void main(String[] args) {
        List<String> tags = List.of("testing", "", "infra", " ", "people");

        List<String> nonBlank = keep(tags, tag -> !tag.isBlank());
        System.out.println("non-blank: " + nonBlank);          // [testing, infra, people]

        List<Integer> lens = lengths(nonBlank, String::length);
        System.out.println("lengths: " + lens);                 // [7, 5, 6]
    }
}`,
    notes: [
      'test.test(tag) and f.apply(tag) are the actual method calls behind Predicate and Function — the interfaces are just single-method contracts named test and apply respectively, matching what Searchable\'s search method and Comparator\'s compare method already taught you about calling through an interface reference.',
      'tag -> !tag.isBlank() has real logic (a negation) so it stays a lambda; String::length is pure delegation to an existing method with no extra logic, so it collapses cleanly to a method reference — the exact judgment call the lesson describes.',
      'Plain loops are used deliberately here so the Predicate/Function calls are visible and explicit; the streams lesson immediately next will replace filter/transform loops like these with .stream().filter(...).map(...) built on these SAME interfaces.'
    ]
  },
  quiz: [
    {
      q: 'What qualifies an interface as "functional," and does adding a default method break that?',
      options: ['Exactly one ABSTRACT method — default and static methods have bodies and don\'t count, so an interface can have many default methods and still be functional as long as only one method remains unimplemented', 'Any interface with at least one method of any kind', 'Only interfaces explicitly marked @FunctionalInterface count — the annotation is what makes it functional', 'An interface is functional if it has no fields'],
      correct: 0,
      explain: 'Only ABSTRACT (bodiless) methods count toward the one-method rule. Searchable, Comparator, and Runnable stay functional regardless of how many default/static methods they also carry, because those already have implementations. @FunctionalInterface is an optional compiler check, not what defines the category.'
    },
    {
      q: 'Which java.util.function interface fits "take a LogEntry, return true or false"?',
      options: ['Predicate<LogEntry> — test(T t) returning boolean is exactly the yes/no shape', 'Function<LogEntry, Boolean> — technically works but Predicate is the purpose-built, idiomatic shape', 'Consumer<LogEntry> — accept(T t) returns void, not a boolean', 'Supplier<LogEntry> — get() takes no input, but this shape needs an input'],
      correct: 0,
      explain: 'Predicate<T>.test(T t) returning boolean is the standard shape for a yes/no question about a value — used everywhere filtering happens, including stream .filter(...). Function<T,Boolean> would technically compile but obscures intent versus the purpose-built Predicate.'
    },
    {
      q: 'A lambda\'s body is just `return LogEntry::title` called on its parameter — i.e., `e -> e.title()`. Which method reference kind replaces it, and why?',
      options: ['Unbound instance method reference, LogEntry::title — the lambda\'s parameter (e) supplies the receiver the instance method is called ON, since there\'s no specific LogEntry object named yet', 'Bound instance method reference, since title() is an instance method', 'Static method reference, since LogEntry is a type name before the ::', 'Constructor reference, since LogEntry is a record'],
      correct: 0,
      explain: 'Because the object the method is called on (e) comes from the lambda\'s OWN parameter rather than being a specific object that already exists at the point you write the reference, this is the UNBOUND instance method reference kind: Type::instanceMethod. A bound reference would look like someSpecificEntry::title instead.'
    },
    {
      q: 'Why does `String prefix = "[LOG] "; list.forEach(e -> print(prefix + e));` compile, but adding `prefix = "[WARN] ";` anywhere afterward breaks it?',
      options: ['Local variables captured by a lambda must be effectively final — assigned exactly once — because the lambda captures a frozen snapshot of the value, not a live reference back into the method\'s stack frame', 'Lambdas can only capture String variables, not other types', 'The forEach method specifically forbids variable capture', 'This is a runtime error, not a compile-time one — it would only fail if forEach were actually called'],
      correct: 0,
      explain: 'The lambda takes a snapshot copy of prefix at creation time, because the enclosing method\'s stack frame might not exist anymore by the time the lambda actually runs. Allowing reassignment would let the snapshot and the "real" value silently diverge, so the compiler requires effective finality and rejects it at COMPILE time, before the code even runs.'
    },
    {
      q: 'A lambda reads `this.threshold` (an instance field) instead of a captured local variable. Does it need to be effectively final too?',
      options: ['No — fields are captured via a reference to the enclosing object, not a value snapshot, so the lambda reads the field LIVE each time it runs and the field can be freely reassigned elsewhere', 'Yes — all captured state must be effectively final, fields included', 'Only static fields are exempt from the effectively-final rule, not instance fields', 'It depends on whether the field is public or private'],
      correct: 0,
      explain: 'Fields aren\'t snapshotted the way local variables are — the lambda holds a reference to the enclosing object (or class, for statics) and reads the field fresh on each call, so it CAN change between invocations and the lambda will see the new value. This is a real difference from local-variable capture, and a potential shared-mutable-state hazard across threads.'
    }
  ],
  testFlow: {
    title: 'Test yourself: lambdas and functional interfaces under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'You write a custom interface with one abstract method PLUS three default methods with bodies. Can you still implement it with a lambda?',
        choices: [
          { text: 'Yes — only ABSTRACT methods count toward the "functional interface" rule; default methods have bodies already and don\'t need a lambda to fill them', to: 'q1_right' },
          { text: 'No — any interface with more than one method total (default or abstract) can no longer be implemented by a lambda', to: 'q1_wrong_total' },
          { text: 'Only if you remove the @FunctionalInterface annotation', to: 'q1_wrong_annotation' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct — a lambda fills the ONE remaining abstract method; default methods already have implementations and simply come along for free on any lambda-created instance. This is exactly how Searchable and Comparator work — both carry default/static helper methods alongside their one abstract method.', next: 'q2' },
      q1_wrong_total: { end: true, correct: false, text: 'Total method count doesn\'t matter — only ABSTRACT (bodiless) methods count. An interface can carry any number of default/static methods and remain functional as long as exactly one method has no body. This is deliberate: it lets interfaces grow rich helper behavior without losing lambda-compatibility.', retry: 'q1' },
      q1_wrong_annotation: { end: true, correct: false, text: '@FunctionalInterface is optional documentation-plus-compiler-check — it doesn\'t create or remove functional-interface status, it just makes the compiler verify (and error if violated) that exactly one abstract method exists. Removing it changes nothing about whether a lambda can implement the interface.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'You have `Function<String,Integer> len = s -> s.length();`. Should you rewrite it as a method reference, and if so, which kind?',
        choices: [
          { text: 'Yes — String::length, an UNBOUND instance method reference, since the lambda\'s parameter (s) supplies the receiver and the body is pure delegation with no extra logic', to: 'q2_right' },
          { text: 'Yes — but it should be a BOUND reference since length() is called on an object', to: 'q2_wrong_bound' },
          { text: 'No — lambdas and method references are never interchangeable for the same functional interface', to: 'q2_wrong_never' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Right — s -> s.length() is pure delegation (no extra logic beyond the call), so it collapses to String::length. It\'s UNBOUND because there\'s no specific pre-existing String — the parameter passed in at call time supplies the receiver, which is the hallmark of Type::instanceMethod.', next: 'q3' },
      q2_wrong_bound: { end: true, correct: false, text: 'Bound means the receiver is one SPECIFIC object that already exists when you write the reference (like System.out::println, bound to that one System.out). Here the receiver is whatever String gets passed in later — that\'s the lambda\'s own parameter supplying the receiver, which is the UNBOUND case: Type::instanceMethod.', retry: 'q2' },
      q2_wrong_never: { end: true, correct: false, text: 'They ARE interchangeable whenever the lambda body is nothing but a single, direct method call — that\'s exactly the case a method reference exists to shorten. The two forms compile to essentially the same thing; the choice is purely a readability preference for pure-delegation lambdas.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'Inside a loop, you write `for (String tag : tags) { Runnable r = () -> System.out.println(tag); tasks.add(r); }` intending each Runnable to print its OWN tag. Does this raise any concern, and why?',
        choices: [
          { text: 'No concern here — tag is re-declared fresh on each iteration (a new effectively-final local each time), so each lambda correctly captures its own iteration\'s value; this is different from mutating a single shared loop counter', to: 'q3_right' },
          { text: 'This is a compile error because tag is captured inside a loop, and loop variables can never be captured by lambdas', to: 'q3_wrong_compile' },
          { text: 'All the Runnables will print the SAME final tag value, because tag is shared across iterations like a traditional for(int i=0;...) counter', to: 'q3_wrong_shared' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct — in a for-each loop, tag is a NEW local variable on every iteration (never reassigned within that iteration\'s scope), so it\'s effectively final each time and each lambda captures its own distinct snapshot. This is exactly why for-each loops don\'t suffer the "all lambdas see the same final value" bug that a classic for(int i=0;...) loop with a single reused variable can invite.', next: null },
      q3_wrong_compile: { end: true, correct: false, text: 'Lambdas CAN capture loop variables — the concern is only about REASSIGNMENT, not location. Since a for-each loop introduces a fresh binding of tag each iteration that\'s never reassigned within that iteration, capture is perfectly legal and compiles cleanly.', retry: 'q3' },
      q3_wrong_shared: { end: true, correct: false, text: 'That would be true for a classic for(int i=0; i<n; i++) loop reusing one variable i (and in fact Java forbids capturing that i directly for exactly this reason) — but a for-each loop\'s tag is a DISTINCT variable binding per iteration, so each lambda legitimately captures its own separate value, not a shared one.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Writing a custom functional interface when Function/Predicate/Consumer/Supplier already fit — check the standard shapes first; reserve custom interfaces for genuinely domain-meaningful contracts like Searchable.',
    'Assuming a lambda "sees" a local variable live and can react to it changing later — local capture is a frozen snapshot at creation time, not a live reference; use a field or wrapper object if the lambda needs to observe changes over time.',
    'Forcing a method reference when there\'s extra logic beyond one direct call — extracting a throwaway helper method purely to enable Type::method syntax adds indirection for no readability gain; keep the lambda.',
    'Confusing bound and unbound instance method references — instance::method (bound) references ONE specific existing object; Type::instanceMethod (unbound) takes its receiver from the lambda\'s own first parameter. Mixing these up misreads what the reference actually calls.',
    'Trying to capture and mutate a loop counter from a classic for(int i=0;...) loop inside a lambda — it won\'t compile (i is reassigned each iteration, so it\'s not effectively final). A for-each loop\'s per-iteration variable avoids this because it\'s freshly bound, not reused.',
    'Believing @FunctionalInterface makes an interface functional — it only asks the compiler to VERIFY and enforce that status; the actual requirement (exactly one abstract method) holds with or without the annotation.'
  ],
  interview: [
    {
      q: 'What is a functional interface and how does a lambda expression relate to it? Walk through a concrete example.',
      a: 'A functional interface is any interface with exactly one abstract (bodiless) method — default methods and static methods, which already carry implementations, don\'t count toward that total, so an interface can have several default methods and remain functional as long as one method stays unimplemented. Comparator, Runnable, Callable, and any custom interface shaped like Part 1\'s Searchable (List<Hit> search(String query)) qualify. A lambda expression is the syntax Java provides to supply that one method\'s implementation INLINE, without declaring a named or anonymous class: given Searchable byTag = query -> index.stream().filter(e -> e.tag().equals(query)).collect(...);, the compiler infers from the assignment context that Searchable is the target functional interface, matches the lambda\'s single parameter against search\'s single String parameter, and produces (via invokedynamic under the hood, not a generated .class file per lambda) an object whose search method executes that lambda body. This is functionally identical to, but dramatically terser than, the pre-Java-8 anonymous class form new Searchable() { public List<Hit> search(String query) { ... } }. The @FunctionalInterface annotation is optional but valuable self-documentation: it asks the compiler to verify and enforce the one-abstract-method invariant, catching an accidental second abstract method (which would break every existing lambda implementing that interface) at compile time instead of leaving it as an unstated assumption.'
    },
    {
      q: 'Compare Function, Predicate, Consumer, and Supplier — their shapes, their methods, and where you\'d use each.',
      a: 'These four java.util.function interfaces cover the large majority of one-method needs and are the interfaces streams are built directly on top of. Function<T,R> has method R apply(T t) — "transform a T into an R" — used for mapping/extraction, e.g. Function<LogEntry,String> title = LogEntry::title, and it\'s exactly the interface stream .map(...) accepts. Predicate<T> has method boolean test(T t) — "answer yes or no about a T" — used for filtering, e.g. Predicate<LogEntry> isUrgent = e -> e.priority() == 1, and it\'s exactly what stream .filter(...) accepts. Consumer<T> has method void accept(T t) — "do something with a T, produce no result" — used for side effects like logging, saving, or printing, e.g. Consumer<LogEntry> log = e -> System.out.println(e.title()), and it\'s exactly what stream .forEach(...) accepts. Supplier<T> has method T get() — "produce a T from nothing" — used for lazy evaluation, default values, or factories, e.g. Supplier<List<LogEntry>> factory = ArrayList::new. I choose among them purely by input/output SHAPE: input transformed to a different-typed output → Function; input reduced to a boolean → Predicate; input consumed with a side effect and no return → Consumer; no input, a value produced → Supplier. Related specializations extend the same logic: BiFunction/BiConsumer take two inputs, UnaryOperator<T> is Function<T,T> (same-type transform), BinaryOperator<T> is BiFunction<T,T,T> (combining two same-typed values, like a reducer), and primitive-specialized versions (IntPredicate, ToIntFunction<T>) avoid autoboxing in hot paths. I only reach for a CUSTOM functional interface, the way Searchable is custom, when the method name itself needs to carry domain meaning that a generic Function/Predicate signature would obscure.'
    },
    {
      q: 'Explain all four kinds of method references with an example of each, and when you\'d choose one over writing out the lambda.',
      a: 'A method reference is shorthand for a lambda whose body is nothing but a single call to an existing method, replacing the lambda syntax with Type::method or instance::method. Static method reference (Type::staticMethod): the lambda calls a static method directly, e.g. Function<String,Integer> parse = Integer::parseInt, equivalent to s -> Integer.parseInt(s). Bound instance method reference (instance::method): the lambda calls a method on one SPECIFIC object that already exists when you write the reference, e.g. Consumer<String> print = System.out::println, equivalent to s -> System.out.println(s), permanently bound to that one System.out instance. Unbound instance method reference (Type::instanceMethod): the lambda\'s own parameter supplies the receiver the method is called ON — there\'s no specific pre-existing object — e.g. Function<String,Integer> len = String::length, equivalent to s -> s.length(), where whichever String is passed in at call time becomes the receiver. Constructor reference (Type::new): the lambda just calls a constructor, e.g. Supplier<ArrayList<String>> factory = ArrayList::new, equivalent to () -> new ArrayList<String>(), or with a one-argument functional interface, Function<String,LogEntry> maker = LogEntry::new would invoke a matching one-String constructor. I use a method reference specifically when the lambda is PURE delegation — no additional logic, no extra statements, no conditional — because it\'s shorter and reuses an already-named, already-tested method instead of restating the call. The moment there\'s any additional logic (a condition, string concatenation, multiple statements), I keep the lambda rather than extract an awkward single-use helper method purely to force method-reference syntax — the two forms aren\'t a strict hierarchy of "better," they\'re suited to different amounts of logic in the body.'
    },
    {
      q: 'Explain effectively-final variable capture in lambdas: what it requires, why the restriction exists, and how field capture differs.',
      a: 'A lambda can read local variables and method parameters from its enclosing scope — this is what makes it a closure — but only if those variables are effectively final: assigned exactly once, with no reassignment anywhere in that scope after the point of assignment, even without an explicit final keyword. The compiler enforces this at compile time; the instant you write a second assignment to a captured local anywhere in its scope, every lambda capturing it fails to compile with "variable must be final or effectively final." The mechanism explains the restriction: capturing a local variable takes a SNAPSHOT COPY of its value at the moment the lambda object is created — it does not hold a live reference into the enclosing method\'s stack frame, because that frame might no longer exist by the time the lambda actually executes (a lambda can be stored in a field, returned, or passed elsewhere and invoked long after its creating method has returned and its stack frame popped). If reassignment were permitted, there would be an unresolvable ambiguity about what value the lambda should see, and if the same lambda were shared across threads, a mutable capture would constitute an actual data race with no synchronization protecting it — effectively-final capture prevents this entire bug class by making the captured value immutable by construction rather than by convention. Fields — instance fields (implicitly via a captured this) or static fields — are exempt from this rule entirely, because a lambda referencing a field doesn\'t snapshot a value; it captures a reference to the enclosing OBJECT (or class), and reads the field fresh, live, on every invocation. That field genuinely CAN be mutated between calls and the lambda will observe the new value — useful for things like a live counter or shared configuration, but it reintroduces exactly the shared-mutable-state hazard (now potentially across threads) that local capture\'s effectively-final rule was designed to sidestep. The practical guidance I give: if a lambda needs to react to a value that changes after the lambda is created, that value has to live in a field or a mutable wrapper object (like a single-element array or an AtomicReference, relevant again in Part 5\'s concurrency material) — a plain local variable literally cannot serve that purpose once captured.'
    }
  ]
};
