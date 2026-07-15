window.LESSONS = window.LESSONS || {};
window.LESSONS['generics'] = {
  id: 'generics',
  title: 'Generics: Type Parameters, Bounds, Wildcards & Erasure',
  category: 'Part 3 — Collections & Generics',
  timeMin: 50,
  summary: 'How Java lets you write code that is both reusable across types AND type-safe at compile time — the machinery behind List<String>, Map<K,V>, and every collection you will use. Type parameters turn "a list of something" into "a list of exactly this, checked by the compiler"; bounded types and wildcards let a method accept a whole family of types with precise variance rules (the famous PECS); and type erasure — the fact that generics are a compile-time-only fiction the JVM never sees — explains a cluster of surprising limitations that trip up everyone once. Get this right and the collections framework, streams, and every generic API stop being magic.',
  goals: [
    'Write generic classes and methods with type parameters, and explain what problem generics solved over raw Object-based code',
    'Use bounded type parameters (<T extends Comparable<T>>) to call methods on a type parameter safely',
    'Apply wildcards with the PECS rule — ? extends for producers (read), ? super for consumers (write) — and say why List<Dog> is NOT a List<Animal>',
    'Explain type erasure and predict the concrete limitations it causes (no new T[], no instanceof List<String>, unchecked warnings)',
    'Read and reason about a realistic generic signature the way you will meet them across the JDK, streams, and Spring'
  ],
  concept: [
    {
      h: 'Type parameters: "a container of exactly this", checked by the compiler',
      p: [
        'Before generics (Java 5), a <code>List</code> held <code>Object</code>, so you could put anything in and had to CAST everything out — <code>String s = (String) list.get(0);</code> — with the cast failing at RUNTIME (<code>ClassCastException</code>) if you guessed wrong. Generics move that check to COMPILE time: <code>List&lt;String&gt;</code> declares "a list of Strings, and the compiler will reject anything else," so <code>list.add(42)</code> won\'t compile and <code>list.get(0)</code> returns a <code>String</code> with no cast. The type parameter <code>&lt;String&gt;</code> is a promise the compiler enforces — you trade nothing at runtime and gain the compiler catching type mistakes before they ship.',
        'You write your own generics the same way. A generic CLASS parameterizes over a type: <code>class Box&lt;T&gt; { private T value; T get() {...} void set(T v) {...} }</code> — <code>T</code> is a placeholder filled in when someone writes <code>Box&lt;String&gt;</code>. A generic METHOD introduces its own type parameter before the return type: <code>&lt;T&gt; T firstOrNull(List&lt;T&gt; list)</code> works for any <code>T</code>, inferred from the argument at each call. The naming convention is single uppercase letters — <code>T</code> (type), <code>E</code> (element), <code>K</code>/<code>V</code> (key/value), <code>R</code> (result) — and it\'s just convention; the mechanism is "let the caller name the type, and check consistency everywhere it appears."'
      ]
    },
    {
      h: 'Bounded type parameters: constraining what T can be',
      p: [
        'An unbounded <code>T</code> could be anything, so you can only call <code>Object</code> methods on it. A <b>bound</b> narrows it and unlocks capabilities: <code>&lt;T extends Comparable&lt;T&gt;&gt;</code> says "T must be comparable to itself," so inside the method you can call <code>a.compareTo(b)</code> — the compiler knows every valid <code>T</code> has that method. <code>&lt;T extends Number&gt;</code> lets you call <code>t.doubleValue()</code>. This is how generic algorithms stay both reusable AND able to actually DO something with their type parameter: <code>&lt;T extends Comparable&lt;T&gt;&gt; T max(List&lt;T&gt; items)</code> works for any comparable type — <code>String</code>, <code>Integer</code>, your own <code>LogEntry</code> if it implements <code>Comparable</code> — while guaranteeing at compile time that <code>compareTo</code> exists.',
        'The keyword is always <code>extends</code> in a bound, even for interfaces (<code>T extends Comparable</code>, not <code>implements</code>) — in generics, "extends" means "is a subtype of," covering both class inheritance and interface implementation. You can even require multiple bounds: <code>&lt;T extends Number &amp; Comparable&lt;T&gt;&gt;</code> demands both. The mental model: a bound is a contract on the type parameter, exactly parallel to how an interface is a contract on a value — it says "whoever you are, you must at least be able to do THIS," and the compiler holds callers to it.'
      ]
    },
    {
      h: 'Wildcards and variance: why List<Dog> is not a List<Animal>',
      p: [
        'Here is the counterintuitive rule that trips up everyone: even though <code>Dog</code> is a subtype of <code>Animal</code>, <code>List&lt;Dog&gt;</code> is NOT a subtype of <code>List&lt;Animal&gt;</code>. Generics are <b>invariant</b>. The reason is soundness: if <code>List&lt;Dog&gt;</code> WERE a <code>List&lt;Animal&gt;</code>, you could assign it to a <code>List&lt;Animal&gt;</code> variable and then <code>add(new Cat())</code> — the compiler would allow it, and your list of dogs now contains a cat, blowing up later. Invariance forbids exactly this. (Arrays, notoriously, ARE covariant — <code>Dog[]</code> IS an <code>Object[]</code> — which is precisely why array stores are checked at runtime and can throw <code>ArrayStoreException</code>; generics chose compile-time safety instead.)',
        'But invariance is too restrictive for methods that just want to work with a FAMILY of types, so <b>wildcards</b> reintroduce controlled flexibility. <code>List&lt;? extends Animal&gt;</code> — "a list of Animal or any subtype" — you can READ Animals out (whatever\'s in there IS an Animal), but you can\'t ADD anything (the compiler doesn\'t know the exact subtype, so no element is provably safe to insert). <code>List&lt;? super Dog&gt;</code> — "a list of Dog or any supertype" — you can ADD Dogs (a Dog fits any supertype list), but reading gives you only <code>Object</code> (you don\'t know how far up the type is). This is the famous <b>PECS</b> mnemonic: <b>Producer Extends, Consumer Super</b>. If a parameter PRODUCES values you\'ll read, use <code>? extends</code>; if it CONSUMES values you\'ll write, use <code>? super</code>. It\'s exactly why <code>Collections.copy(List&lt;? super T&gt; dest, List&lt;? extends T&gt; src)</code> reads like that — src produces (extends), dest consumes (super).'
      ]
    },
    {
      h: 'Type erasure: generics are a compile-time fiction',
      p: [
        'The single fact that explains every weird generics limitation: <b>the JVM never sees your type parameters.</b> Generics are enforced by the COMPILER and then ERASED — at runtime, <code>List&lt;String&gt;</code> and <code>List&lt;Integer&gt;</code> are both just <code>List</code>, and <code>T</code> becomes <code>Object</code> (or its bound). This was a deliberate choice for backward compatibility: pre-generics code and generic code had to interoperate, so generics were layered on top without changing the bytecode\'s view of types. The compiler inserts the casts you didn\'t write and checks everything up front; the runtime runs cast-laden, type-parameter-free code.',
        'Erasure directly causes a family of limitations you WILL hit: you can\'t write <code>new T()</code> or <code>new T[]</code> (the runtime doesn\'t know what <code>T</code> is — no type, no constructor, no array); you can\'t do <code>if (x instanceof List&lt;String&gt;)</code> (at runtime it\'s just <code>List</code> — you can only test the raw <code>List</code>); you can\'t have two overloads that differ only by type parameter (<code>foo(List&lt;String&gt;)</code> and <code>foo(List&lt;Integer&gt;)</code> erase to the same signature); and primitives can\'t be type arguments (<code>List&lt;int&gt;</code> is illegal — you use <code>List&lt;Integer&gt;</code> and pay autoboxing, the Part 1 wrapper story returning). The "unchecked warning" you get from casting to a generic type or using a raw type is the compiler telling you honestly, "I can\'t verify this at runtime because the type info is erased — you\'re on your own here." Understanding erasure turns all of these from baffling errors into predictable consequences of one rule: the type parameters vanish before the program runs.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Nami\'s labeled chests: the compiler checks the label, the hold forgets it',
      text: 'Nami reorganizes the Sunny\'s hold with labeled chests, and the whole system is Java generics. Before her reform, every chest was just "a chest of stuff" — you opened it, pulled out something, and had to GUESS what it was, occasionally getting a fistful of Luffy\'s garbage when you wanted gold (raw List of Object, cast on the way out, ClassCastException when you guessed wrong). Nami\'s fix: each chest gets a strict label — Chest<Gold>, Chest<Map>, Chest<Tangerine> — and the quartermaster (the compiler) refuses at the dock to let anyone put a spice jar into the Chest<Gold> or hand you a map when you asked the gold chest for its contents. The label is checked when things go IN and come OUT, so nobody ever pulls the wrong type by surprise. Bounded types are Nami\'s rule for her ranking chest: Chest<T extends Weighable> — "I don\'t care WHAT treasure you are, but you must have a weight I can read," so she can sort the contents by value because every item is guaranteed to answer weigh() (a bound unlocks the operations you can call on T). Now the variance lesson, which Nami learned the hard way: a Chest<Gold> is NOT interchangeable with a Chest<Treasure>, even though gold IS treasure — because if you could treat the gold chest AS a generic treasure chest, someone would drop a cursed idol into it "since idols are treasure too," and now Nami\'s pure-gold chest is contaminated (List<Dog> is not List<Animal>: allowing it would let a Cat in). So she uses careful wildcards: when she just wants to TALLY the value of any chest of "treasure-or-better," she takes a Chest<? extends Treasure> and only READS from it (producer extends — you can look, you can\'t add, because you don\'t know the exact contents). When she wants to STASH gold somewhere safe, she takes a Chest<? super Gold> — any chest that can legally hold gold — and only WRITES to it (consumer super). Producer extends, consumer super: Nami\'s two rules for handling other people\'s chests. And the final twist, the erasure joke of the crew: for all Nami\'s meticulous labeling, the SHIP ITSELF — the dumb wooden hold — doesn\'t actually know or care about labels. At the physical level every chest is just a chest; the labels exist only in Nami\'s ledger (the compiler), enforced before anything is stored, and the moment cargo is in the hold the label is, physically, gone. Which is exactly why she can\'t ask the hold at sea "give me a brand-new chest of whatever type THIS one is" — the hold has no idea; only the ledger ever knew, and the ledger stays on the dock.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s labeled containers and the roommate agreement\'s type rules',
      text: 'Sheldon Cooper runs his entire apartment as a strongly-typed generic system, and it is glorious. Every container is labeled with EXACTLY what it may hold — a box that is not merely "a box" but a Box<VintageComics>, a drawer that is Drawer<TShirts, SortedByColor> — and the idea of putting the wrong type into a labeled container causes him physical distress: attempting to file a DC comic into the Marvel long-box is, to Sheldon, a compile error the universe should reject before it happens (List<String> won\'t accept an Integer). His bounded-type rule appears whenever he ranks things: Sheldon will happily create a "friendship algorithm" or a tier list of <T extends Rankable> — he doesn\'t care what the items ARE, as long as each one exposes a property he can measure and order by (a bound: T must support the operation the algorithm needs). The variance lesson is pure Sheldon pedantry: try to tell him that his container of "Leonard Nimoy-signed napkins" is just a container of "napkins," and he will explain at length why NO, you cannot treat the specific collection as the general one — because the instant you did, someone (Penny) would "helpfully" add a regular napkin to it, and the specialness that defined the collection would be destroyed (Collection<SignedNapkin> is not Collection<Napkin>: the general reference would permit an unsafe insert). And PECS is exactly how Sheldon handles other people touching his things: if he\'s letting you merely LOOK THROUGH a collection to admire it, it\'s a "? extends" arrangement — read-only, you may observe, you may NOT add (producer extends); if he\'s designating a container for you to DEPOSIT approved items into, it\'s "? super" — you may put the specific approved thing in, but don\'t expect to know everything else that\'s in there (consumer super). The erasure punchline is the funniest part: for all Sheldon\'s obsessive labeling, the apartment\'s actual physical shelves are just... shelves. The rich type system lives entirely in Sheldon\'s mind and his labeling ritual (the compiler), enforced meticulously at the moment of filing — but the wood and metal holding everything up is blissfully, structurally unaware that "Box<VintageComics>" is any different from "Box<Junk>." The types are real to Sheldon and invisible to the furniture, which is precisely Java\'s bargain.',
    },
    why: 'Nami\'s and Sheldon\'s labeled chests are List<T>: the label is checked going in and coming out by the quartermaster/compiler, so nobody pulls the wrong type by surprise (compile-time safety replacing the old guess-and-cast). A ranking chest of <T extends Weighable/Rankable> is a bound — don\'t care what T is, only that it supports the operation. A Chest<Gold> is NOT a Chest<Treasure> because treating the specific as the general would let a cursed idol / a plain napkin be inserted (invariance for soundness). PECS is how they handle others\' chests: read-only "? extends" (producer, look don\'t add), deposit-only "? super" (consumer, add don\'t assume). And erasure is the joke: the ship\'s hold / the furniture don\'t know the labels at all — the type system lives only in the ledger/compiler and is physically gone at runtime.'
  },
  storyAnim: {
    title: 'Labeled chests: checked by the ledger, erased in the hold',
    h: 300,
    props: [
      { id: 'raw', emoji: '❓', label: 'old way: Chest of stuff → guess + cast (ClassCastException)', x: 16, y: 12 },
      { id: 'typed', emoji: '🏷️', label: 'Chest<Gold>: quartermaster checks label in AND out', x: 58, y: 12 },
      { id: 'bound', emoji: '⚖️', label: 'Chest<T extends Weighable>: can weigh() any T', x: 20, y: 46 },
      { id: 'invariant', emoji: '🚫', label: 'Chest<Gold> ≠ Chest<Treasure> (would let an idol in)', x: 58, y: 46 },
      { id: 'extends', emoji: '👀', label: '? extends: producer — READ only', x: 22, y: 80 },
      { id: 'super', emoji: '📥', label: '? super: consumer — WRITE only', x: 52, y: 80 },
      { id: 'erased', emoji: '🌫️', label: 'the hold forgets the label: erased at runtime', x: 84, y: 80 }
    ],
    actors: [
      { id: 'nami', emoji: '🗺️', label: 'Nami', x: 12, y: 30 }
    ],
    steps: [
      { c: 'Old hold: every chest is just "a chest of stuff". You pull something out and GUESS its type — cast on the way out, and get a ClassCastException when you guess wrong.', p: { raw: 'bad' }, a: { nami: [16, 30] } },
      { c: 'Nami\'s reform: Chest<Gold>. The quartermaster (compiler) checks the label when things go IN and come OUT — you can\'t add a spice jar, and what you take out IS gold, no cast, no surprise.', p: { typed: 'good' } },
      { c: 'A ranking chest is bounded: Chest<T extends Weighable>. She doesn\'t care what T is, only that every item can weigh() — so she can sort by value. A bound unlocks the operations.', p: { bound: 'lit' } },
      { c: 'The variance rule: a Chest<Gold> is NOT a Chest<Treasure>, even though gold is treasure — because treating it as the general chest would let someone drop a cursed idol in. Invariance keeps the gold chest pure.', p: { invariant: 'bad' } },
      { c: 'To TALLY any treasure-or-better chest, take Chest<? extends Treasure> and only READ — producer extends: look, don\'t add, because you don\'t know the exact contents.', p: { extends: 'good' } },
      { c: 'To STASH gold safely, take Chest<? super Gold> and only WRITE — consumer super: a Dog fits any supertype list; gold fits any chest that can hold gold.', p: { super: 'good' } },
      { c: 'The punchline: the ship\'s hold doesn\'t know the labels at all. The type system lives only in Nami\'s ledger (the compiler), enforced before storage — and physically erased once cargo is aboard. That\'s why you can\'t ask the hold for "a new chest of whatever type THIS is".', p: { erased: 'lit' }, a: { nami: [84, 80] } }
    ]
  },
  conceptFlow: {
    title: 'Reading a generic signature: <T extends Comparable<T>> T max(Collection<? extends T> c)',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Declare the type param',
        nodes: [
          { id: 'declare', text: '<T ...>\nintroduce a type variable T' },
          { id: 'bound', text: 'T extends Comparable<T>\nT must be comparable to itself' }
        ]
      },
      {
        label: 'Use it in the signature',
        nodes: [
          { id: 'return', text: 'returns T\nthe caller gets back their exact type' },
          { id: 'param', text: 'Collection<? extends T>\na producer of T — we READ from it' }
        ]
      },
      {
        label: 'Inside the body',
        nodes: [
          { id: 'call', text: 'a.compareTo(b)\nlegal because of the bound' },
          { id: 'noadd', text: 'c.add(x) — illegal\n? extends is read-only' }
        ]
      },
      {
        label: 'At runtime',
        nodes: [
          { id: 'erase', text: 'erasure\nT → Comparable, wildcards gone' },
          { id: 'casts', text: 'compiler-inserted casts\nrun in place of the vanished types' }
        ]
      }
    ],
    steps: [
      { active: ['declare'], note: 'The <T> before the return type introduces a fresh type variable for THIS method, inferred from the arguments at each call site. It lets one method work for every T while keeping every use of T consistent.' },
      { active: ['bound'], note: 'The bound T extends Comparable<T> constrains T — it must be comparable to itself. This is what makes calling compareTo inside the method legal: the compiler knows every valid T has it.' },
      { active: ['return'], note: 'The return type T means the caller gets back their OWN type — call max on a List<LogEntry> and you get a LogEntry, no cast. The type flows through.' },
      { active: ['param'], note: 'Collection<? extends T> is a PRODUCER: the method reads T-or-subtype values out of it. PECS says a source you read from uses ? extends, which widens what callers may pass (a Collection<Integer> works where T is Number).' },
      { active: ['call'], note: 'Inside, a.compareTo(b) compiles precisely because the bound guaranteed it. Without the bound, T would be treated as Object and compareTo wouldn\'t exist. The bound is what makes the body able to DO something.' },
      { active: ['noadd'], note: 'You cannot c.add(anything) here — with ? extends T the exact element type is unknown, so no value is provably safe to insert. Read-only is the price (and the point) of ? extends.' },
      { active: ['erase'], note: 'At runtime T erases to its bound (Comparable) and the wildcards vanish — the JVM sees no type parameters at all. This is why you can\'t do new T[] or instanceof with a parameterized type.' },
      { active: ['casts'], note: 'The compiler inserted the casts you didn\'t write and checked everything up front, so the erased, cast-laden code runs safely. Generics cost nothing at runtime — the whole system is a compile-time guarantee.' }
    ]
  },
  tech: [
    {
      q: 'What problem do generics actually solve, and what does a bound buy you over an unbounded T?',
      a: 'Before generics, collections held Object, so reusable containers came at the cost of type safety: you inserted anything and CAST on retrieval, moving type errors to runtime as ClassCastException, often far from the offending insertion. Generics restore both properties at once — reuse AND safety — by parameterizing over a type the compiler checks: List<String> rejects non-Strings at COMPILE time and returns String without a cast, so the mistake is caught at the keystroke, not in production. The mechanism is "let the caller name the type, and verify consistency everywhere that name appears," with the compiler inserting the casts you no longer write. An UNBOUNDED type parameter <T> is maximally reusable but nearly useless inside the method: since T could be anything, you can only call Object methods on it (equals, hashCode, toString). A BOUND fixes that: <T extends Comparable<T>> constrains T to types comparable to themselves, which UNLOCKS calling a.compareTo(b) in the body because the compiler now knows every valid T has that method — the bound is a compile-time contract on the type parameter, exactly analogous to requiring a value to implement an interface. Bounds are what let generic ALGORITHMS actually operate on their type parameter: a max method needs Comparable, a numeric method needs Number (to call doubleValue()), and so on. Note the vocabulary quirk that always uses extends in a bound even for interfaces (<T extends Comparable>, not implements) because in generics "extends" means "is a subtype of," spanning class inheritance and interface implementation; and you can demand multiple bounds with & (<T extends Number & Comparable<T>>). The design payoff is that a single generic method with the right bound is both broadly reusable and fully able to do meaningful work — reuse without giving up either safety or capability.'
    },
    {
      q: 'Explain why List<Dog> is not a List<Animal>, and how wildcards and PECS restore controlled flexibility.',
      a: 'Generics are INVARIANT: List<Dog> is not a subtype of List<Animal> even though Dog is a subtype of Animal. The reason is soundness. Suppose covariance were allowed — then you could write List<Animal> a = someListOfDogs; and next a.add(new Cat());, which the compiler would accept because a\'s static type is List<Animal>, yet you\'ve just inserted a Cat into a List<Dog>, corrupting it for every holder of the List<Dog> reference. Invariance forbids the initial assignment, closing the hole. (Arrays made the opposite choice — Dog[] IS an Object[], covariantly — which is exactly why array stores carry a runtime check and can throw ArrayStoreException; generics preferred compile-time safety and no runtime store check.) But strict invariance is too rigid for methods that legitimately want to accept a family of parameterizations, so WILDCARDS add bounded flexibility with a variance direction. List<? extends Animal> is a COVARIANT view — "a list of Animal or some unknown subtype" — from which you can READ Animals (whatever is inside is at least an Animal), but into which you cannot ADD anything except null, because the exact element type is unknown so no concrete value is provably safe to insert. List<? super Dog> is a CONTRAVARIANT view — "a list of Dog or some unknown supertype" — into which you can ADD Dogs (a Dog is assignable to any supertype-of-Dog slot), but from which reads yield only Object (you don\'t know how far up the hierarchy the real type sits). PECS — Producer Extends, Consumer Super — is the rule for choosing: if a parameter is a source you\'ll read FROM (it produces values), declare it ? extends; if it\'s a sink you\'ll write TO (it consumes values), declare it ? super. The canonical signature Collections.copy(List<? super T> dest, List<? extends T> src) embodies it exactly — src produces (extends), dest consumes (super) — and it\'s why well-designed generic APIs use wildcards on parameters to maximize the set of callers they accept while staying type-safe. A parameter that BOTH produces and consumes gets an exact type (no wildcard), because you can\'t safely be flexible in both directions at once.'
    },
    {
      q: 'What is type erasure, and what specific limitations does it cause? Give me the list and the reason for each.',
      a: 'Type erasure is the fact that generic type information exists only at COMPILE time and is removed before runtime: the compiler checks all your generic constraints and inserts the necessary casts, then erases the type parameters so the bytecode sees raw types — List<String> and List<Integer> are both just List at runtime, and a type variable T becomes its bound (Object if unbounded, Comparable if <T extends Comparable>, etc.). It was a deliberate backward-compatibility choice so that generic and pre-generic code could interoperate on the same JVM without changing how the runtime views types (this is "migration compatibility"). Erasure directly produces a cluster of limitations, each following from "the runtime doesn\'t know T": (1) You can\'t do new T() or new T[] — with no runtime type there\'s no constructor to call and no component type for the array; the idioms are to pass a Class<T> factory/token or use reflection (Array.newInstance), or accept an Object[]/List. (2) You can\'t use instanceof with a parameterized type — if (x instanceof List<String>) is illegal because at runtime it\'s only List; you can test the raw List (or use an unbounded wildcard List<?>). (3) You can\'t overload on erased signatures — method(List<String>) and method(List<Integer>) both erase to method(List), a name clash the compiler rejects. (4) Primitives can\'t be type arguments — List<int> is illegal because a type argument must be a reference type (erasing to Object); you use List<Integer> and accept autoboxing costs, the Part 1 wrapper story returning. (5) A generic class can\'t have static fields of its type parameter or use T in a static context, since T is per-instance-parameterization and statics are per-class. (6) You can\'t catch a generic exception type, and a class can\'t be generic AND extend Throwable. (7) UNCHECKED WARNINGS arise whenever the compiler can\'t verify a generic cast at runtime — casting to (List<String>), using a raw type, or creating a generic array — because erasure removed the info it would need to check; the warning is an honest "I can\'t guarantee this, you\'re asserting it." @SuppressWarnings("unchecked") is how you acknowledge you\'ve reasoned it through. The unifying insight worth stating: every one of these is a predictable consequence of a single rule — type parameters vanish before the program runs — so once you internalize erasure, the limitations stop being surprising exceptions and become derivable facts. (Contrast reified generics in C#, where the runtime DOES know the type argument, allowing new T() and typeof checks at the cost of a different compatibility model.)'
    },
    {
      q: 'Walk me through designing a generic method versus a generic class — when each, and how does type inference help?',
      a: 'Use a generic CLASS when the type parameter defines the STATE of instances — the type is a property of the object that persists across many method calls: Box<T> holds a T, List<E> stores Es, Map<K,V> maps Ks to Vs. The parameter is declared on the class (class Box<T> {...}) and every instance is bound to a specific type argument for its lifetime (a Box<String> is a String box forever). Use a generic METHOD when the type parameter is local to a SINGLE call — the method works over some type but the enclosing class doesn\'t need to be parameterized: a static utility like <T> T firstOrNull(List<T> list) or <T extends Comparable<T>> T max(Collection<? extends T> c). The parameter is declared just before the return type (<T> T method(...)), and it\'s inferred fresh at each call site. Generic methods are especially natural for static helpers (which can\'t use the class\'s type parameters anyway) and for relating the types of several parameters/return (e.g. <T> void copy(List<? super T> dst, List<? extends T> src) ties the two lists together through T). TYPE INFERENCE is what keeps generics from being verbose: the compiler deduces the type arguments so you rarely write them. For methods, it infers T from the argument types — max(listOfStrings) infers T=String with no <String> at the call. For constructors, the diamond operator infers from the left side — Map<String, List<Integer>> m = new HashMap<>(); the <> means "same as the declared type," saving a repetition. Inference also flows through var (var list = new ArrayList<String>() infers the full type) and through target typing in lambdas and streams (the whole streams API leans on it). When inference can\'t determine a type (e.g. an empty Collections.<String>emptyList() where context is ambiguous) you can supply an explicit type witness, but that\'s rare. Practical guidance: parameterize the class when the type is part of the object\'s identity/state; write a generic method when the type is confined to one operation; put wildcards on METHOD PARAMETERS (per PECS) to accept the widest set of callers, but use a concrete type parameter <T> when you need to NAME the type to relate a return value or multiple arguments to it — a wildcard alone can\'t express "the return has the same type as this argument," which is exactly when you reach for a named T.'
    }
  ],
  code: {
    title: 'A generic, type-safe container for LogPose — Repository<T>',
    intro: 'LogPose stores many kinds of records — entries, projects, tags. Rather than one untyped store per kind, a single generic Repository<T> gives every store compile-time type safety, and a bounded generic method sorts any comparable records. This is the collections framework\'s design in miniature.',
    code: `import java.util.*;
import java.util.function.Predicate;

// A generic class: T is the record type this repository stores.
class Repository<T> {
    private final List<T> items = new ArrayList<>();

    void add(T item) { items.add(item); }              // only a T goes in — checked at compile time

    T get(int i) { return items.get(i); }              // a T comes out — no cast needed

    // A generic METHOD with its OWN type param R, plus a wildcard producer parameter.
    List<T> findAll(Predicate<? super T> test) {        // ? super T: a consumer of T (it reads each T)
        List<T> out = new ArrayList<>();
        for (T item : items) if (test.test(item)) out.add(item);
        return out;
    }

    int size() { return items.size(); }

    // Static generic method: bounded T so we can call compareTo. Reads from a producer.
    static <E extends Comparable<E>> E maxOf(Collection<? extends E> c) {  // PECS: producer extends
        Iterator<? extends E> it = c.iterator();
        E best = it.next();
        while (it.hasNext()) {
            E next = it.next();
            if (next.compareTo(best) > 0) best = next;   // legal ONLY because of the bound
        }
        return best;
        // c.add(best);  // would NOT compile: ? extends is read-only (unknown exact type)
    }
}

public class RepoDemo {
    public static void main(String[] args) {
        Repository<String> titles = new Repository<>();   // diamond infers <String>
        titles.add("flaky-test triage");
        titles.add("embedding cache");
        // titles.add(42);   // compile error: an int is not a String — caught at the keystroke

        String first = titles.get(0);                     // no cast — the type flowed through
        System.out.println("first: " + first);

        // ? super String consumer: a Predicate<Object> is accepted (it can test any Object, incl. String)
        Predicate<Object> nonEmpty = o -> o.toString().length() > 0;
        System.out.println("matches: " + titles.findAll(nonEmpty).size());

        // Bounded generic method: works for any Comparable type, returns that exact type.
        System.out.println("max title: " + Repository.maxOf(List.of("apple", "pear", "fig")));
        System.out.println("max int:   " + Repository.maxOf(List.of(3, 9, 2)));   // T=Integer inferred
    }
}`,
    notes: [
      'One Repository<T> class serves every record type with full compile-time safety — add takes only a T, get returns a T with no cast. titles.add(42) fails to compile: the mistake is caught at the keystroke, not as a runtime ClassCastException.',
      'maxOf shows the bound and PECS together: <E extends Comparable<E>> unlocks compareTo in the body, and Collection<? extends E> is a producer we only READ from (adding to it wouldn\'t compile). It returns E, so max of Integers is an Integer, max of Strings a String — the type flows through.',
      'findAll takes Predicate<? super T> — a consumer of T, so a broad Predicate<Object> is accepted (PECS: consumer super). Run it: javac RepoDemo.java && java RepoDemo. Try adding titles.add(42) and watch the compiler reject it before you ever run.'
    ]
  },
  lab: {
    title: 'Write a bounded generic method with a wildcard',
    prompt: 'Build a reusable, type-safe utility. Write a generic method <code>static &lt;T extends Comparable&lt;T&gt;&gt; T minOf(List&lt;? extends T&gt; items)</code> that returns the smallest element of a list, using <code>compareTo</code>, and throws <code>IllegalArgumentException</code> if the list is null or empty. Requirements: (1) declare the type parameter <b>with a bound</b> so <code>compareTo</code> is callable; (2) the parameter must be a <b>producer wildcard</b> <code>List&lt;? extends T&gt;</code>; (3) do NOT call <code>items.add(...)</code> anywhere (it wouldn\'t compile — prove you understand why). In a comment, answer: why can\'t you call <code>items.add(someT)</code> on a <code>List&lt;? extends T&gt;</code>?',
    starter: `import java.util.*;

class Utils {
    // static <T extends Comparable<T>> T minOf(List<? extends T> items)
    //  - throw IllegalArgumentException if null or empty
    //  - use compareTo to find the smallest
    //  - do NOT call items.add(...)
    static <T extends Comparable<T>> T minOf(List<? extends T> items) {
        return null; // replace
    }
}

// Q: why can't you call items.add(someT) on a List<? extends T>?
// ANSWER:`,
    checks: [
      { re: '<\\s*T\\s+extends\\s+Comparable\\s*<\\s*T\\s*>\\s*>', must: true, hint: 'Declare the bounded type parameter: <T extends Comparable<T>>.', pass: 'bounded type param ✓' },
      { re: 'List\\s*<\\s*\\?\\s+extends\\s+T\\s*>', must: true, hint: 'The parameter must be a producer wildcard: List<? extends T>.', pass: 'producer wildcard ✓' },
      { re: '\\.compareTo\\s*\\(', must: true, hint: 'Use compareTo to compare elements — legal because of the bound.', pass: 'uses compareTo ✓' },
      { re: 'throw\\s+new\\s+IllegalArgumentException', must: true, hint: 'Throw IllegalArgumentException for null/empty input.', pass: 'guards null/empty ✓' },
      { re: '(isEmpty\\s*\\(\\s*\\)|size\\s*\\(\\s*\\)\\s*==\\s*0|==\\s*null|null\\s*==)', must: true, hint: 'Check for null or empty before iterating.', pass: 'null/empty check ✓' },
      { re: 'items\\.add\\s*\\(', must: false, hint: 'Do NOT call items.add(...) — a List<? extends T> is read-only, so it wouldn\'t even compile.', pass: 'no illegal add ✓' },
      { re: 'ANSWER\\s*:\\s*\\S+', must: true, hint: 'Answer: with ? extends T the exact element type is unknown, so the compiler can\'t prove any value is safe to insert — reads are fine, writes are forbidden (producer extends).', pass: 'rationale given ✓' }
    ],
    run: 'put Utils and a main in <code>Utils.java</code>; <code>javac Utils.java &amp;&amp; java Utils</code>. Call minOf on a List of Strings and a List of Integers — it works for both and returns that exact type. Then try adding items.add(...) inside and watch it fail to compile.',
    solution: `import java.util.*;

class Utils {
    static <T extends Comparable<T>> T minOf(List<? extends T> items) {
        if (items == null || items.isEmpty())
            throw new IllegalArgumentException("list must be non-empty");
        T best = items.get(0);
        for (T item : items) {                 // reading Ts out is fine — they ARE at least T
            if (item.compareTo(best) < 0) best = item;   // compareTo legal thanks to the bound
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(minOf(List.of("pear", "fig", "apple")));  // apple  (T=String)
        System.out.println(minOf(List.of(3, 9, 2)));                  // 2      (T=Integer)
    }
}

// ANSWER: With List<? extends T> the exact element type is some UNKNOWN subtype of T, so the
// compiler can't prove that any value you offer (even a T) is safe to store — the real list
// might be a List<SubtypeOfT> that must not receive a plain T. Reading is safe (everything in
// there is at least a T); writing is forbidden. Producer Extends: you may consume, not produce
// into it.`,
    notes: [
      'The bound <T extends Comparable<T>> is what makes compareTo callable — without it, T is treated as Object and the method body couldn\'t compare anything. The bound unlocks the operation.',
      'List<? extends T> lets callers pass a List<String>, List<Integer>, or any List of a T-subtype — maximum reach — precisely because you only READ from it. That\'s PECS\'s producer-extends half in action.',
      'minOf returns T, so the caller gets their exact type back (a String from a List<String>) with no cast. The type flows from argument to return through the shared parameter T — something a bare wildcard could not express, which is why you name T here.'
    ]
  },
  quiz: [
    {
      q: 'What is the core problem generics solved compared to pre-generics collections?',
      options: ['They move type checking from runtime to COMPILE time — List<String> rejects wrong types at compile time and needs no cast on retrieval, replacing the old put-Object/cast-out/ClassCastException pattern', 'They make collections run faster at runtime', 'They allow collections to hold primitives like int directly', 'They eliminate the need for the equals method'],
      correct: 0,
      explain: 'Pre-generics, collections held Object: you cast on the way out and got ClassCastException when wrong. Generics make List<String> a compile-time promise the compiler enforces — the mistake is caught at the keystroke. Nami\'s labeled chests, checked in and out by the quartermaster.'
    },
    {
      q: 'Why is List<Dog> NOT a subtype of List<Animal> in Java?',
      options: ['Soundness — if it were, you could alias it as List<Animal> and add a Cat, corrupting the List<Dog>; invariance forbids the assignment to prevent this', 'Because Dog is not actually a subtype of Animal', 'Because lists can only hold one type ever', 'It actually IS a subtype — Java generics are covariant'],
      correct: 0,
      explain: 'Generics are invariant for soundness: covariance would let you insert a Cat into a List<Dog> through an Animal-typed alias. (Arrays ARE covariant, which is exactly why they need runtime ArrayStoreException checks.) A Chest<Gold> is not a Chest<Treasure> — someone would drop a cursed idol in.'
    },
    {
      q: 'You have a method that reads elements out of a collection but never adds to it. Which wildcard, per PECS?',
      options: ['? extends — the collection is a PRODUCER of values you read, so Producer Extends: you can read (everything is at least the bound type) but not add', '? super — because reading requires super', 'No wildcard — always use an exact type', '? extends for reading AND writing equally'],
      correct: 0,
      explain: 'Producer Extends, Consumer Super. A source you read FROM uses ? extends (read-only: exact type unknown, so no safe insert). A sink you write TO uses ? super. Nami reads a Chest<? extends Treasure> to tally it; she can look, not add.'
    },
    {
      q: 'Why can\'t you write new T[] or if (x instanceof List<String>) in Java?',
      options: ['Type erasure — type parameters are removed at runtime, so the JVM doesn\'t know T (no component type for the array) and List<String> is just List at runtime (nothing to test)', 'Those are just syntax errors that a future Java version will fix', 'Arrays and instanceof are deprecated in modern Java', 'You need to import a special generics library first'],
      correct: 0,
      explain: 'Erasure: generics are compile-time only. At runtime T is Object (or its bound) and List<String> is raw List, so there\'s no runtime type to construct an array from or test with instanceof. The ship\'s hold doesn\'t know the labels — they lived only in the ledger.'
    },
    {
      q: 'What does the bound in <T extends Comparable<T>> actually enable inside the method?',
      options: ['Calling compareTo on values of type T — the bound guarantees every valid T is comparable, so the method can order its elements; without it, T is treated as Object', 'It makes T run faster', 'It allows T to be a primitive like int', 'It lets you create arrays of T'],
      correct: 0,
      explain: 'A bound is a compile-time contract on the type parameter: <T extends Comparable<T>> promises compareTo exists, unlocking it in the body. Without a bound you can only call Object methods on T. Nami\'s ranking chest requires each item to weigh().'
    }
  ],
  testFlow: {
    title: 'Test yourself: generics under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'You want a method addAll(List<? ??? T> dest, List<? ??? T> src) that COPIES elements from src into dest. What wildcards, and why?',
        choices: [
          { text: 'dest is List<? super T> (a consumer you write into) and src is List<? extends T> (a producer you read from) — PECS: Consumer Super, Producer Extends', to: 'q1_right' },
          { text: 'Both should be List<? extends T> for maximum flexibility', to: 'q1_wrong_bothext' },
          { text: 'Both should be List<T> exactly — wildcards aren\'t needed', to: 'q1_wrong_exact' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Exactly the shape of Collections.copy: src produces (read from it → ? extends T), dest consumes (write into it → ? super T). PECS chooses each wildcard by data-flow direction, and it maximizes the callers the method accepts while staying type-safe.', next: 'q2' },
      q1_wrong_bothext: { end: true, correct: false, text: 'src as ? extends T is right (you read from it), but dest as ? extends T would be READ-ONLY — you couldn\'t add to it, which is the whole job. A destination you WRITE into must be ? super T (consumer super). Match the wildcard to the direction of data flow.', retry: 'q1' },
      q1_wrong_exact: { end: true, correct: false, text: 'Exact List<T> works but needlessly restricts callers: you couldn\'t copy from a List<SubtypeOfT> or into a List<SupertypeOfT>. Wildcards per PECS widen the accepted types safely — that\'s their purpose on parameters.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'You try to write a generic method that does return new T(); to create a default instance. It won\'t compile. Why, and what\'s the fix?',
        choices: [
          { text: 'Type erasure removes T at runtime, so there\'s no runtime type to construct — pass a Class<T> (or a Supplier<T> factory) and call clazz.getDeclaredConstructor().newInstance() or supplier.get()', to: 'q2_right' },
          { text: 'new T() is fine; you just forgot a semicolon', to: 'q2_wrong_syntax' },
          { text: 'You must declare T as <T extends Object> to enable construction', to: 'q2_wrong_bound' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Right — erasure means T is unknown at runtime, so there\'s no constructor to call via T. The standard workarounds pass the type as a value: a Class<T> token (reflectively construct) or, more cleanly, a Supplier<T>/factory the caller provides. The runtime needs the type handed to it because it was erased.', next: 'q3' },
      q2_wrong_syntax: { end: true, correct: false, text: 'It\'s not a syntax slip — new T() is fundamentally impossible because T doesn\'t exist at runtime (erasure). No punctuation fixes it; you must supply the type as a Class<T> or a factory Supplier<T>.', retry: 'q2' },
      q2_wrong_bound: { end: true, correct: false, text: 'A bound doesn\'t help — even <T extends Object> leaves T erased at runtime, so there\'s still no runtime type to instantiate. The fix is to pass the type in as data (Class<T> or Supplier<T>), not to change the bound.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A colleague uses a RAW List (no type parameter) to "avoid generics complexity" and gets unchecked warnings. What\'s the real risk?',
        choices: [
          { text: 'Raw types opt out of compile-time checking, so wrong-typed inserts compile silently and blow up later as ClassCastException on retrieval — the exact runtime failure generics were designed to prevent', to: 'q3_right' },
          { text: 'No real risk — raw types behave identically to parameterized ones', to: 'q3_wrong_norisk' },
          { text: 'The code won\'t run at all until the warnings are fixed', to: 'q3_wrong_wontrun' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct — a raw List is treated as List<Object> with checks disabled, so it accepts anything and defers the failure to a runtime ClassCastException far from the bad insertion. The unchecked warning is the compiler saying "I can no longer verify this." Raw types exist for legacy interop; new code should always parameterize.', next: null },
      q3_wrong_norisk: { end: true, correct: false, text: 'They do NOT behave identically: a raw type SUPPRESSES the generic type checks, reintroducing exactly the put-anything/cast-out/ClassCastException hazard generics eliminate. The unchecked warnings are flagging genuine lost safety, not noise.', retry: 'q3' },
      q3_wrong_wontrun: { end: true, correct: false, text: 'Unchecked warnings are warnings, not errors — the code compiles and runs. That\'s the danger: it runs fine until a wrong-typed element is retrieved and cast, then throws at runtime. Parameterize the list to get the compile-time safety back.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Assuming List<Dog> is a List<Animal> — generics are invariant. Assigning it to a List<Animal> would permit inserting a Cat, so the compiler forbids it. Use ? extends/? super wildcards (per PECS) when you need cross-type flexibility.',
    'Getting PECS backwards — a source you READ from is ? extends (producer), a sink you WRITE to is ? super (consumer). Reversing them makes a destination read-only or a source impossible to consume from.',
    'Fighting type erasure — trying new T(), new T[], or instanceof List<String>. None can work because T and the parameterization are gone at runtime. Pass a Class<T> or factory, use an array of the bound, or test the raw/unbounded-wildcard type.',
    'Using raw types (a bare List) in new code — they disable generic checking and reintroduce the ClassCastException-at-retrieval hazard. Raw types exist only for legacy interop; always parameterize, even as List<?> when the element type is genuinely unknown.',
    'Ignoring unchecked warnings by reflex-adding @SuppressWarnings — the warning means the compiler can\'t verify a cast because of erasure. Only suppress after you\'ve reasoned that it IS safe, and scope the annotation as narrowly as possible.',
    'Forgetting that primitives can\'t be type arguments — List<int> is illegal; you use List<Integer> and pay autoboxing/unboxing costs (and risk NullPointerException unboxing a null Integer). For performance-critical primitive collections, reach for specialized libraries or arrays.'
  ],
  interview: [
    {
      q: 'What are generics, what problem do they solve, and what do bounds add?',
      a: 'Generics let you parameterize types and methods over a type the compiler checks, giving you code that is simultaneously reusable across types AND type-safe at compile time. Before generics, collections held Object, so reuse cost safety: you inserted anything and cast on retrieval, deferring type errors to runtime as ClassCastException, often far from the bad insertion. Generics restore both — List<String> rejects non-Strings at compile time and returns String with no cast — by letting the caller name the type and having the compiler verify consistency everywhere that name appears, inserting the casts you no longer write. The runtime cost is zero because the enforcement is entirely at compile time. You write your own with a generic CLASS when the type is part of an object\'s state (Box<T>, List<E>, Map<K,V>) or a generic METHOD when the type is local to one call (<T> T firstOrNull(List<T>)). BOUNDS add capability: an unbounded T can only be treated as Object inside the method, but <T extends Comparable<T>> constrains T to comparable types and thereby UNLOCKS calling compareTo in the body — the compiler knows every valid T has it. A bound is a compile-time contract on the type parameter, exactly analogous to requiring a value to implement an interface, and it\'s what lets a generic ALGORITHM actually operate on its type parameter (max needs Comparable, a numeric routine needs Number). Note that bounds always use "extends" even for interfaces because in generics "extends" means "is a subtype of," and you can combine bounds with & (<T extends Number & Comparable<T>>). The payoff is reuse without sacrificing either safety or the ability to do meaningful work with the type.'
    },
    {
      q: 'Explain invariance, wildcards, and PECS. Why is List<Dog> not a List<Animal>?',
      a: 'Java generics are INVARIANT: List<Dog> is not a subtype of List<Animal> despite Dog being a subtype of Animal. The reason is soundness — if it were allowed, you could alias a List<Dog> through a List<Animal> reference and call add(new Cat()), which the compiler would accept against the List<Animal> static type while actually corrupting the List<Dog>. Invariance forbids the initial assignment, closing that hole. (Arrays chose covariance — Dog[] is an Object[] — which is exactly why array stores carry a runtime check and can throw ArrayStoreException; generics preferred pure compile-time safety.) Because strict invariance is too rigid for methods that want to accept a family of parameterizations, WILDCARDS reintroduce bounded, directional flexibility. List<? extends Animal> is a covariant, READ-ONLY view: you can read Animals out (everything inside is at least an Animal), but can\'t add anything except null, because the exact element type is unknown so nothing is provably safe to insert. List<? super Dog> is a contravariant, WRITE-capable view: you can add Dogs (assignable to any supertype-of-Dog slot), but reads yield only Object. PECS — Producer Extends, Consumer Super — is the rule for choosing: a parameter you READ FROM (it produces) is ? extends; a parameter you WRITE TO (it consumes) is ? super. Collections.copy(List<? super T> dest, List<? extends T> src) is the canonical illustration — src produces, dest consumes. The practical guidance is to put wildcards on method PARAMETERS to maximize the callers you accept while staying safe, use an exact type when a parameter both produces and consumes (you can\'t be safely flexible both ways), and use a named type parameter <T> instead of a bare wildcard when you must relate a return value or multiple arguments to the same type — a wildcard alone can\'t say "the return has the same type as this argument."'
    },
    {
      q: 'What is type erasure, why did Java choose it, and what limitations does it impose?',
      a: 'Type erasure means generic type information exists only at compile time: the compiler checks all generic constraints, inserts the required casts, and then ERASES the type parameters, so the bytecode sees raw types — List<String> and List<Integer> are both just List at runtime, and a type variable T becomes its bound (Object if unbounded). Java chose it for backward/migration compatibility: generics were added in Java 5 and had to interoperate with the enormous body of pre-generics code on the same JVM, so they were layered on without changing how the runtime represents types. The consequences are a well-known cluster of limitations, each derivable from "the runtime doesn\'t know T": you can\'t new T() or new T[] (no runtime type → no constructor, no array component type; the workaround is to pass a Class<T> or a factory); you can\'t instanceof a parameterized type (if (x instanceof List<String>) is illegal — at runtime it\'s just List, so you can only test the raw or unbounded-wildcard List<?>); you can\'t overload on erased signatures (method(List<String>) and method(List<Integer>) collide as method(List)); primitives can\'t be type arguments (List<int> is illegal — you use List<Integer> and accept autoboxing); a static context can\'t use the class\'s type parameter; a class can\'t be generic and extend Throwable; and you get UNCHECKED WARNINGS whenever the compiler can\'t verify a generic cast at runtime (casting to a parameterized type, using raw types, creating generic arrays), which is the compiler honestly flagging lost verifiability. The unifying insight is that all of these follow from one rule — type parameters vanish before the program runs — so once you internalize erasure they become predictable rather than surprising. It\'s worth contrasting with C#\'s reified generics, where the runtime DOES know the type argument, permitting new T() and typeof(T) at the cost of a different (non-migration) compatibility story; Java traded that runtime knowledge for seamless interoperability with legacy code.'
    },
    {
      q: 'When do you write a generic method versus a generic class, and how does type inference reduce the verbosity?',
      a: 'Use a generic CLASS when the type parameter is part of the object\'s STATE — a property that persists across many calls on an instance: Box<T> holds a T, List<E> stores Es, Map<K,V> relates Ks and Vs; each instance is bound to its type argument for life. Use a generic METHOD when the type is confined to a SINGLE operation and the enclosing class needn\'t be parameterized: static utilities (<T> T firstOrNull(List<T>)), or methods that relate several parameters and the return through one type (<T> void copy(List<? super T> dst, List<? extends T> src) ties the lists together via T). Generic methods are the natural choice for static helpers (which can\'t reference a class\'s type parameters) and whenever you need to NAME a type to express a relationship a wildcard can\'t — e.g. "the return has the same type as this argument." TYPE INFERENCE keeps this from being verbose by deducing type arguments so you rarely write them explicitly: for methods, T is inferred from the arguments (max(listOfStrings) infers T=String — no <String> needed); for constructors, the diamond operator infers from the target type (Map<String,List<Integer>> m = new HashMap<>()); var infers the full type of a right-hand-side expression; and target typing drives inference through lambdas and the entire streams API. On the rare occasion inference can\'t settle a type (an ambiguous empty collection, say), you can supply an explicit type witness (Collections.<String>emptyList()), but that\'s uncommon. My practical rule: parameterize the class when the type defines instance identity/state; write a generic method when the type is local to one call; put wildcards on parameters per PECS to accept the widest safe set of callers; and reach for a named <T> when you must relate a return value or multiple arguments to the same type — the combination of a well-chosen type parameter or wildcard plus inference is what makes generic APIs both powerful to design and painless to call.'
    }
  ]
};
