window.LESSONS = window.LESSONS || {};
window.LESSONS['syntax-types-operators'] = {
  id: 'syntax-types-operators',
  title: 'Types & Variables: Primitives vs References, Autoboxing, var',
  category: 'Part 1 — Core Java',
  timeMin: 45,
  summary: 'The single most important mental model in Java: some variables hold the value itself (primitives), and some hold a map to where the value lives (references). Every confusing thing beginners hit — == behaving weirdly, methods "not changing" their arguments, the Integer cache party trick at 127 vs 128 — is this one distinction wearing different costumes. Plus: the eight primitives, overflow, floating-point honesty, casting, autoboxing, and what var does (and doesn\'t) change.',
  goals: [
    'Name the eight primitive types with sizes and defaults, and choose correctly between int/long/double/boolean in real code',
    'Draw the primitives-vs-references picture: value in the box vs address in the box, and predict assignment and == behavior from it',
    'Explain autoboxing, the Integer cache (-128..127), and why == on wrappers is a bug even when it "works"',
    'Predict integer overflow and floating-point surprises (0.1 + 0.2), and know when BigDecimal is required',
    'Use var appropriately: local type inference that keeps static typing, not dynamic typing'
  ],
  concept: [
    {
      h: 'The one picture to rule Part 1: what\'s actually in the box',
      p: [
        'Every variable in Java is a fixed-size box. The question that settles ninety percent of beginner confusion is: <b>what does the box contain?</b> For the eight <b>primitive</b> types, the box contains the value itself — the actual bits of the number <code>42</code>. For everything else — objects, arrays, strings — the box contains a <b>reference</b>: essentially the address of where the object lives in the heap. The variable is never the object; it\'s a treasure map to the object.',
        '<div class="math">int a = 42;&nbsp;&nbsp;→&nbsp;&nbsp;[ 42 ]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Point p = new Point(3,4);&nbsp;&nbsp;→&nbsp;&nbsp;[ ↗ map ] ──→ {x:3, y:4} on the heap<span class="mnote">assignment ALWAYS copies the box\'s contents — the value for primitives, the MAP for references. Java has no other assignment semantics, anywhere.</span></div>',
        'Consequences, all mechanical once you hold the picture: <code>int b = a;</code> copies the number — <code>a</code> and <code>b</code> are forever independent. <code>Point q = p;</code> copies the MAP — now two maps lead to the SAME buried chest, and <code>q.x = 99</code> changes what <code>p</code> sees too. <code>==</code> compares box contents: for primitives that means comparing values (what you want); for references it means comparing MAPS — "are these literally the same object?" — which is almost never the question you\'re asking (that\'s what <code>.equals()</code> is for, and it gets a whole lesson later in this Part). Method calls copy the box into the parameter — so a method can never rebind YOUR variable, but via a copied map it can absolutely modify the object your variable points to. People call this "pass by value where the value may be a reference", and now you can derive it instead of memorizing it.'
      ]
    },
    {
      h: 'The eight primitives — and the three you\'ll actually use',
      p: [
        'Full roster: <code>byte</code> (8-bit), <code>short</code> (16), <code>int</code> (32), <code>long</code> (64) for integers; <code>float</code> (32), <code>double</code> (64) for floating point; <code>char</code> (16-bit UTF-16 unit); <code>boolean</code>. Daily reality: <b>int</b> for whole numbers, <b>double</b> for decimals, <b>boolean</b> for truth — reaching for byte/short/float to "save memory" is almost always a false economy that costs correctness or conversions (they exist mainly for arrays, file formats, and protocols). Use <b>long</b> when values can exceed ~2.1 billion: database IDs, timestamps in milliseconds, byte counts. Literals: <code>25L</code> for long, <code>2.5f</code> for float, underscores allowed for readability (<code>1_000_000</code>).',
        'Integer arithmetic has two honest sharp edges. <b>Division truncates:</b> <code>7 / 2</code> is <code>3</code> (you verified this in jshell last lesson); write <code>7 / 2.0</code> to get 3.5. <b>Overflow wraps silently:</b> <code>Integer.MAX_VALUE + 1</code> is <code>Integer.MIN_VALUE</code> — no exception, no warning, just modular arithmetic. This is not academic: it\'s the famous YouTube view-counter story (Gangnam Style forcing the counter to long) and the classic hidden bug in binary search (<code>(lo + hi) / 2</code> overflowing on huge arrays — the DSA course\'s binary-search pattern sidesteps it with <code>lo + (hi - lo) / 2</code>).',
        '<b>Floating point tells the truth in binary, not decimal:</b> <code>0.1 + 0.2 == 0.3</code> is <code>false</code> — 0.1 has no exact binary representation, same as 1/3 has no exact decimal one. This is IEEE 754, identical in Python and JavaScript; Java just refuses to hide it. Rules that follow: never <code>==</code> doubles (compare <code>Math.abs(a-b) &lt; epsilon</code>), and never represent money as double — use <code>BigDecimal</code> (an object, exact decimal arithmetic) or store cents in a <code>long</code>. LogPose stores no money, but it will store timestamps and embedding vectors — long and float[] respectively, both chosen with exactly this table in mind.'
      ]
    },
    {
      h: 'Casting: when Java converts numbers for you, and when it demands a signature',
      p: [
        'Conversions that cannot lose information happen implicitly — <code>int</code> flows into <code>long</code>, <code>long</code> into <code>double</code>, no ceremony (widening). Conversions that CAN lose information require you to sign the waiver with an explicit cast: <code>(int) 3.99</code> is <code>3</code> (truncation toward zero, not rounding), <code>(int) 4_000_000_000L</code> silently mangles (narrowing). The compiler forcing the cast is static typing doing its job: potentially-lossy operations should look different from safe ones at the call site.',
        'One operator gotcha while we\'re here: <code>+</code> is overloaded for String concatenation, and evaluation is left-to-right — <code>"sum: " + 1 + 2</code> is <code>"sum: 12"</code>, while <code>1 + 2 + " is the sum"</code> is <code>"3 is the sum"</code>. And <code>char</code> is secretly a number: <code>\'A\' + 1</code> is the int <code>66</code>, and <code>(char)(\'A\' + 1)</code> is <code>\'B\'</code> — occasionally genuinely useful (the DSA course\'s counting-sort-by-letter tricks rely on it).'
      ]
    },
    {
      h: 'Autoboxing and the Integer cache: the 127/128 party trick, explained',
      p: [
        'Generics and collections (Part 3) can only hold objects, not primitives — so each primitive has an object <b>wrapper</b>: <code>Integer</code>, <code>Long</code>, <code>Double</code>, <code>Boolean</code>… Java converts automatically at the boundary: <code>Integer boxed = 42;</code> (autoboxing — really <code>Integer.valueOf(42)</code>), <code>int raw = boxed;</code> (unboxing — really <code>boxed.intValue()</code>). Convenient, mostly invisible, with two traps.',
        '<b>Trap 1 — null:</b> a wrapper is a reference, so it can be <code>null</code>, and unboxing null throws <code>NullPointerException</code>: <code>Integer count = null; int c = count;</code> compiles cleanly and detonates at runtime. This is the #1 reason a database column (nullable!) maps to <code>Integer</code>, not <code>int</code>, in Part 8\'s JPA entities — and why you unbox with a null check or a default.',
        '<b>Trap 2 — the cache:</b> <code>Integer.valueOf</code> keeps a permanent cache of the objects for values <b>-128 to 127</b> and hands the SAME object back every time; outside that range you get a fresh object per call. So <code>Integer a = 127, b = 127; a == b</code> is <code>true</code> (same cached object — same map), while <code>Integer c = 128, d = 128; c == d</code> is <code>false</code> (two different objects with equal contents — two maps to two identical chests). Nothing about the NUMBERS changed at 128 — what changed is which question <code>==</code> was answering. The rule that makes the trick boring: <b><code>==</code> on wrappers is always a bug</b> (even when the cache makes it accidentally pass your tests); compare wrappers with <code>.equals()</code>, and prefer primitives unless you specifically need nullability or a collection.'
      ]
    },
    {
      h: 'var: inference, not dynamism',
      p: [
        'Since Java 10, local variables can be declared with <code>var</code>: <code>var count = 3;</code> — the compiler infers <code>int</code> from the initializer, and the variable IS an int forever; <code>count = "three";</code> is a compile error. This is type <b>inference</b> (the type is fixed, just unwritten), not dynamic typing (Python, where the variable would happily switch types). <code>var</code> works only for locals with initializers — never fields, parameters, or return types.',
        'Taste guideline the course follows: use <code>var</code> when the type is obvious from the right-hand side (<code>var reader = new BufferedReader(...)</code> — spelling BufferedReader twice helps no one), keep the explicit type when the right side doesn\'t reveal it (<code>int timeout = service.getLimit()</code> beats <code>var timeout = …</code> where the reader must guess). It\'s a readability dial, not a philosophy.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Coins in pockets, maps to chests',
      text: 'Nami manages the crew\'s wealth in exactly two forms, and confusing them once nearly caused a mutiny. Small money is COINS IN POCKETS: when she hands Luffy 42 berries, the coins physically leave her hand and enter his pocket — two pockets, two independent piles, and nothing Luffy does to his coins can ever change hers (primitives: the box holds the value; assignment copies it; done). Treasure is different. Nobody carries a treasure chest around — a chest stays buried on some island, and what you hand out are MAPS to it (references: the box holds the address, the object lives on the heap). One day Nami gives Zoro a copy of her map to the Alabasta chest. Two maps, ONE chest — so when Zoro digs it up and takes half the gold, Nami\'s "treasure" shrinks too, even though nobody touched HER map (two references, one mutated object). The crew\'s worst argument came from the question "do we have the same treasure?" — Zoro insisted his hoard equaled Usopp\'s because both maps showed a chest with 10,000 berries; Nami had to explain there are two completely different questions: "are these maps to the SAME chest?" (== on references — identity) versus "do the two chests CONTAIN equally much?" (.equals() — a question so important it gets its own war council later this Part). Then there\'s Nami\'s bank. For the small denominations everyone requests constantly — 1 berry, 50, 127 — she long ago pre-buried standard chests and hands EVERYONE copies of the same map (the Integer cache, -128 to 127): ask twice for "a chest of 100" and your two maps genuinely lead to one chest, so even the "same chest?" question answers yes. But ask for 128, and her clerks bury a FRESH chest per request — two maps, two different-but-identical chests, and the "same chest?" test suddenly fails even though every coin matches. Sailors who tested wealth by comparing MAPS instead of opening CHESTS swore the world broke at 128. The world didn\'t break — they\'d been asking the wrong question all along, and the bank\'s little pre-burial efficiency had been covering for them. And unboxing null? That\'s being handed an official bank envelope that should contain a map, opening it mid-voyage, and finding it empty: the promise of treasure, the NullPointerException of reality.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'That\'s my SPOT (identity), not A spot (equality)',
      text: 'Sheldon\'s spot on the couch is the cleanest identity-vs-equality lecture ever aired. When Penny sits in a chair that is the same model, same color, same wear pattern — Sheldon concedes the chairs are EQUAL in every measurable property (.equals() would return true) but that is not, and never will be, THE SPOT (== is false: not the same object). "In an ever-changing world, it is a single point of consistency" — my man is literally describing reference identity. The reverse case also lives in the apartment: the Roommate Agreement exists as ONE document, and both Sheldon and Leonard hold... access to the same one (two references, one object). When Sheldon amends Section 9, Leonard\'s copy is instantly "amended" too — because there was never a Leonard\'s-copy, just Leonard\'s MAP to the single shared original. Contrast cash: when Sheldon repays Penny $20, the bill leaves his wallet and enters hers — independent pockets, primitive semantics, no spooky action at a distance. The Integer cache is pure Sheldon, too: for the numbers he uses constantly he keeps pre-printed index cards in a box — ask him for "73" twice ("the best number", obviously cached) and you get the SAME laminated card both times; ask for some vulgar number like 128 and he scribbles a fresh card each time, muttering. Two people comparing their "73" cards find they hold one card; two people comparing their "128" cards hold two — and if their friendship test is "do we hold the same card?" instead of "do our cards say the same thing?", it shatters at exactly 128. Howard\'s verdict: don\'t compare cards, compare what\'s written on them. Bazinga: .equals(), not ==.'
    },
    why: 'Coins in pockets vs maps to chests IS the primitive/reference distinction — assignment always copies the box (coins move, maps duplicate, chests never do). == compares boxes: values for coins, "same chest?" for maps — while .equals() opens the chests. The bank pre-burying chests for -128..127 is the Integer cache: it makes the wrong question (==) accidentally answer yes for small numbers and fail at 128, which is why == on wrappers is always a bug even when it passes. And Sheldon\'s spot vs an equal chair pins identity vs equality to a scene you\'ll never forget.'
  },
  storyAnim: {
    title: 'Nami\'s ledger: coins, maps, and the bank\'s pre-buried chests',
    h: 290,
    props: [
      { id: 'namiCoins', emoji: '🪙', label: 'Nami\'s pocket: 42', x: 12, y: 12 },
      { id: 'luffyCoins', emoji: '🪙', label: 'Luffy\'s pocket: (empty)', x: 38, y: 12 },
      { id: 'chest', emoji: '💰', label: 'chest on the heap {gold: 10000}', x: 78, y: 14 },
      { id: 'namiMap', emoji: '🗺️', label: 'Nami\'s map → chest', x: 14, y: 50 },
      { id: 'zoroMap', emoji: '🗺️', label: 'Zoro\'s map: (none)', x: 40, y: 50 },
      { id: 'bank127', emoji: '🏦', label: 'bank\'s pre-buried "127" chest', x: 66, y: 50 },
      { id: 'chest128a', emoji: '📦', label: 'fresh "128" chest #1', x: 60, y: 84 },
      { id: 'chest128b', emoji: '📦', label: 'fresh "128" chest #2', x: 84, y: 84 },
      { id: 'verdict', emoji: '⚖️', label: '== asks: same chest?', x: 22, y: 84 }
    ],
    actors: [
      { id: 'nami', emoji: '🍊', label: 'Nami', x: 50, y: 30 }
    ],
    steps: [
      { c: 'int a = 42 — coins live IN the pocket. Handing Luffy 42 berries copies coins into his pocket; the piles are independent forever.', p: { namiCoins: 'lit', luffyCoins: 'good' }, l: { luffyCoins: 'Luffy\'s pocket: 42 (his own coins)' } },
      { c: 'Treasure is different: the chest stays buried on the heap. Nami\'s variable holds only a MAP to it.', p: { chest: 'lit', namiMap: 'good' } },
      { c: 'Point q = p — assignment copies the MAP, never the chest. Now Zoro\'s map and Nami\'s map lead to the SAME chest.', p: { zoroMap: 'good' }, l: { zoroMap: 'Zoro\'s map → SAME chest' } },
      { c: 'Zoro digs via his map and takes half the gold. Nami\'s treasure shrank — nobody touched her map, but there was only ever one chest.', p: { chest: 'bad' }, l: { chest: 'chest on the heap {gold: 5000}' } },
      { c: '== compares MAPS ("same chest?"). .equals() opens chests ("equal contents?"). Two different questions — Sheldon\'s spot vs an equal chair.', p: { verdict: 'lit' } },
      { c: 'The bank pre-buries chests for every value -128..127. Ask for "127" twice: everyone gets a map to the ONE cached chest — so even == says true.', p: { bank127: 'good' }, a: { nami: [66, 36] } },
      { c: 'Ask for "128" twice: the clerks bury a FRESH chest per request. Equal contents, different chests — == suddenly false. Nothing broke at 128; the question was wrong all along.', p: { chest128a: 'lit', chest128b: 'lit' } },
      { c: 'Verdict, permanent: primitives compare with == happily; wrappers and all objects compare with .equals(). And an official envelope with NO map inside — Integer count = null — detonates the moment you unbox it.', p: { verdict: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'What lives where: stack boxes, heap chests, and the boxing border',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Primitive world',
        nodes: [
          { id: 'prim', text: 'int a = 42\nthe box holds the VALUE' },
          { id: 'primcopy', text: 'int b = a\ncopies the value — independent forever' }
        ]
      },
      {
        label: 'Reference world',
        nodes: [
          { id: 'ref', text: 'Point p = new Point(3,4)\nbox holds a MAP; object lives on the heap' },
          { id: 'refcopy', text: 'Point q = p\ncopies the MAP — one shared object' },
          { id: 'mutate', text: 'q.x = 99\np sees it too: same chest' }
        ]
      },
      {
        label: 'The == question',
        nodes: [
          { id: 'eqprim', text: '== on primitives\ncompares values ✓' },
          { id: 'eqref', text: '== on references\n"same object?" — rarely your question' }
        ]
      },
      {
        label: 'Boxing border',
        nodes: [
          { id: 'box', text: 'Integer boxed = 42\nautobox → Integer.valueOf(42)' },
          { id: 'cache', text: 'cache -128..127\nsame object returned → == "works"' },
          { id: 'nocache', text: '128 and beyond\nfresh object each time → == fails' }
        ]
      }
    ],
    steps: [
      { active: ['prim'], note: 'A primitive variable IS its value — 32 bits of int sitting right in the box. Nothing to share, nothing to alias.' },
      { active: ['primcopy'], note: 'Assignment copies box contents. For primitives that\'s the value itself: a and b are now unrelated piles of coins.' },
      { active: ['ref'], note: 'new constructs the object on the heap and returns a reference — a map. The variable never contains the object, only the way to reach it.' },
      { active: ['refcopy'], note: 'Same assignment rule, different cargo: the MAP is copied. Two variables, one object. This is also exactly what happens to every method argument.' },
      { active: ['mutate'], note: 'Mutating through either map changes the one shared chest — the classic "my method changed my caller\'s data!" surprise, fully explained by the picture.' },
      { active: ['eqprim'], note: 'On primitives, == compares the values in the boxes. Exactly what you expect. Use it freely.' },
      { active: ['eqref'], note: 'On references, == compares the maps: are these the SAME object? That\'s Sheldon\'s spot — identity. For "equal contents?" you want .equals(), coming in this Part\'s finale.' },
      { active: ['box'], note: 'Where objects are required (collections, generics, nullable DB columns), primitives autobox into wrappers via Integer.valueOf — invisible in source, real at runtime.' },
      { active: ['cache'], note: 'valueOf keeps one shared object per value from -128 to 127. Two boxed 127s = two maps to one cached chest = accidentally-true ==.' },
      { active: ['nocache'], note: 'At 128 the cache ends: fresh object per boxing. Equal contents, different identity, == false. The rule that predates the trick: == on wrappers is ALWAYS a bug — even when the cache makes it pass.' }
    ]
  },
  tech: [
    {
      q: 'Is Java pass-by-value or pass-by-reference? Settle it with the box picture.',
      a: 'Strictly, always pass-by-value: calling a method copies each argument\'s BOX into the parameter\'s box. The nuance that spawns a thousand forum arguments is what the box contains — for reference types, the copied value IS a reference (a map). So the method holds its own map to your same object: it can never REBIND your variable (assigning its parameter to a new object just redraws its own map — yours is untouched), but it absolutely can MUTATE the shared object your map leads to (dig up the chest, rearrange the gold). Test yourself: void f(Point p) { p = new Point(0,0); } leaves the caller\'s point unchanged (rebinding — its own map redrawn); void g(Point p) { p.x = 0; } changes the caller\'s object (mutation through the shared map). True pass-by-reference (C++\'s int&) would let f rebind the caller\'s variable itself — Java has no such mechanism, anywhere. Interviewers love this precisely because the correct two-sentence answer proves the mental model: "Java always copies the argument; for objects, what\'s copied is the reference — so methods can mutate shared objects but never rebind caller variables."'
    },
    {
      q: 'Why does the Integer cache exist at all, and can its range actually change?',
      a: 'Boxing is ferociously common — every int entering a List<Integer> or Map key boxes — and small values dominate real programs (loop indices, counts, flags, ages). Caching one immutable Integer object per value in -128..127 means the hottest boxing operations allocate nothing: valueOf returns the pre-built object, saving allocation and GC pressure across literally every Java program. It\'s safe ONLY because Integer is immutable — a shared object nobody can modify behaves indistinguishably from a private copy (a preview of why immutability matters, this Part\'s Strings lesson doubles down). The range: the spec GUARANTEES -128..127, and the upper bound is actually tunable (-XX:AutoBoxCacheMax=n) — which is the final nail for == on wrappers: code whose correctness depends on cache hits doesn\'t just break at 128, it breaks differently per JVM configuration. Long, Short, Byte, Character have analogous caches; Double doesn\'t (floating-point values don\'t cluster on small integers). None of this is trivia for its own sake: "explain Integer a=127,b=127 vs 128" is a top-five Java screening question, and the answer that names valueOf, immutability, and the real rule (.equals(), or just use int) is a pass.'
    },
    {
      q: 'Why does 0.1 + 0.2 != 0.3, mechanically — and what should code do about it?',
      a: 'A double is a 64-bit IEEE 754 value: sign, exponent, and 52 bits of binary fraction — meaning it can exactly represent only numbers of the form (integer × power of two). 0.1 is 1/10; its denominator has a factor of 5, so in binary it\'s the repeating fraction 0.000110011001100…₂, which must be cut off at 52 bits — storing a value a hair off from 0.1 (the same way 1/3 can\'t be written exactly in decimal). 0.2 carries its own tiny error, the sum rounds again, and the result lands at 0.30000000000000004 while the literal 0.3 rounds to a slightly DIFFERENT nearest double — so == is false. Every IEEE 754 language behaves identically; Java\'s System.out.println just doesn\'t sugarcoat it. Consequences for code: (1) never == floating point — compare |a−b| < ε with a tolerance chosen for your domain; (2) never accumulate money or exact quantities in double — use BigDecimal constructed FROM STRINGS (new BigDecimal("0.1") — the double constructor faithfully preserves the error you were escaping) or hold integer cents in a long; (3) doubles remain exactly right for measurements, statistics, graphics, and ML — LogPose\'s embedding vectors (Part 13) are float[]s precisely because approximate is the native language of that domain.'
    },
    {
      q: 'Does var make Java dynamically typed? What are its actual rules?',
      a: 'No — var is compile-time type INFERENCE, not runtime dynamism. The compiler looks at the initializer, fixes the variable\'s static type right there, and everything downstream (type checks, method resolution, IDE completion) behaves exactly as if you\'d written the type by hand: var x = 3; x = "three"; is a compile error, full stop — in Python that reassignment is Tuesday. The bytecode is identical to the explicit version; there is nothing to pay at runtime and no type to discover later. Rules: local variables (and for/try-with-resources headers) only — never fields, parameters, or return types (those are API surface, where the written type is documentation for callers); an initializer is mandatory (var x; has nothing to infer from); var x = null is rejected (null belongs to every reference type — no unique inference). One honest subtlety: var infers the EXACT compile-time type of the right side — var list = new ArrayList<String>() infers ArrayList<String>, not List<String>, so you\'ve committed to the concrete class where the interfaces lesson (later this Part) will teach you to prefer the interface. Which is exactly the taste rule: var where the right side makes the type obvious; explicit types where the declaration is the documentation.'
    }
  ],
  code: {
    title: 'Every trap from this lesson, in one runnable file',
    intro: 'Read it, predict every printed line BEFORE the comment tells you, then actually run it — jshell or java Types.java, your kitchen is set up now.',
    code: `public class Types {
    public static void main(String[] args) {
        // -- coins: value semantics --
        int a = 42;
        int b = a;                      // copies the VALUE
        b = 99;
        System.out.println(a);          // 42 — independent piles of coins

        // -- maps: reference semantics --
        int[] p = {3, 4};               // arrays are objects: p is a MAP
        int[] q = p;                    // copies the MAP, not the chest
        q[0] = 99;
        System.out.println(p[0]);       // 99 — one chest, two maps

        // -- integer arithmetic honesty --
        System.out.println(7 / 2);      // 3   — integer division truncates
        System.out.println(7 % 2);      // 1
        System.out.println(-7 % 3);     // -1  — sign follows the dividend
        System.out.println(Integer.MAX_VALUE + 1); // -2147483648 — silent wrap!
        long big = 3_000_000_000L;      // needs the L: the literal exceeds int

        // -- floating point honesty --
        System.out.println(0.1 + 0.2);          // 0.30000000000000004
        System.out.println(0.1 + 0.2 == 0.3);   // false — IEEE 754, not a bug
        System.out.println(Math.abs((0.1+0.2) - 0.3) < 1e-9); // true — the right test

        // -- casting: widening free, narrowing signed-for --
        double d = a;                   // int → double: implicit, safe
        int truncated = (int) 3.99;     // 3 — cast truncates toward zero
        System.out.println((char)('A' + 1)); // B — char is secretly a number

        // -- the boxing border --
        Integer w1 = 127, w2 = 127;
        Integer w3 = 128, w4 = 128;
        System.out.println(w1 == w2);          // true  — cache: same chest
        System.out.println(w3 == w4);          // false — fresh chests
        System.out.println(w3.equals(w4));     // true  — the RIGHT question
        Integer empty = null;
        // int boom = empty;            // compiles fine; NullPointerException at runtime

        // -- var: inference, not dynamism --
        var count = 3;                  // count IS an int, forever
        // count = "three";             // compile error — still statically typed
        System.out.println(count + 1);  // 4
    }
}`,
    notes: [
      'The array aliasing block is the whole reference model in four lines — arrays are objects even when they hold primitives, so p and q are two maps to one chest.',
      'Uncomment the two poison lines one at a time and read both failures: unboxing null is a RUNTIME NullPointerException, while reassigning var to a String is a COMPILE error. Knowing which side of the compile/run divide each trap lives on is last lesson\'s axis, still paying rent.',
      'Every println here is a ten-second jshell experiment — the file is just the tasting menu, plated.'
    ]
  },
  lab: {
    title: 'Predict, then verify: the semantics gauntlet',
    prompt: 'For each numbered snippet, write your predicted output as a comment BEFORE running anything — the rep is prediction, not typing. Then verify every prediction in jshell and mark hits/misses. Snippets: (1) <code>int x = 5; int y = x; y++;</code> — what is <code>x</code>? (2) <code>int[] m = {5}; int[] n = m; n[0]++;</code> — what is <code>m[0]</code>? (3) <code>9 / 4</code> and <code>9 / 4.0</code>? (4) <code>"id" + 4 + 2</code> and <code>4 + 2 + "id"</code>? (5) <code>Integer p1 = 100, p2 = 100; p1 == p2</code>? and with 200? (6) <code>(int) 7.99</code>? Write all six as comments in the editor with your answers.',
    starter: `// 1) int x = 5; int y = x; y++;        → x == ?
// PREDICTION 1:

// 2) int[] m = {5}; int[] n = m; n[0]++; → m[0] == ?
// PREDICTION 2:

// 3) 9 / 4 == ?        9 / 4.0 == ?
// PREDICTION 3:

// 4) "id" + 4 + 2 == ?     4 + 2 + "id" == ?
// PREDICTION 4:

// 5) Integer p1 = 100, p2 = 100; p1 == p2 == ?   ...and with 200?
// PREDICTION 5:

// 6) (int) 7.99 == ?
// PREDICTION 6:

// After verifying in jshell, record your score:
// SCORE: ?/6`,
    checks: [
      { re: 'PREDICTION\\s*1\\s*:\\s*(x\\s*==\\s*)?5', flags: 'i', must: true, hint: '(1) y is a COPY of x\'s value — incrementing y leaves x at 5. Coins, not maps.', pass: '(1) x stays 5 — value semantics ✓' },
      { re: 'PREDICTION\\s*2\\s*:\\s*(m\\[0\\]\\s*==\\s*)?6', flags: 'i', must: true, hint: '(2) arrays are objects: n is a second map to the same chest, so m[0] becomes 6.', pass: '(2) m[0] is 6 — reference semantics ✓' },
      { re: 'PREDICTION\\s*3\\s*:.*2.*2\\.25', flags: 'i', must: true, hint: '(3) 9/4 truncates to 2; 9/4.0 promotes to double → 2.25.', pass: '(3) 2 and 2.25 ✓' },
      { re: 'PREDICTION\\s*4\\s*:.*id42.*6id', flags: 'i', must: true, hint: '(4) left-to-right: "id"+4+2 → "id42"; 4+2+"id" → "6id".', pass: '(4) "id42" and "6id" ✓' },
      { re: 'PREDICTION\\s*5\\s*:.*true.*false', flags: 'i', must: true, hint: '(5) 100 is inside the -128..127 cache → true; 200 is outside → false. And the real rule: never == wrappers.', pass: '(5) true then false — the cache ✓' },
      { re: 'PREDICTION\\s*6\\s*:\\s*7', flags: 'i', must: true, hint: '(6) casting truncates toward zero: (int) 7.99 is 7, not 8.', pass: '(6) 7 — casts truncate ✓' },
      { re: 'SCORE\\s*:\\s*\\d\\s*/\\s*6', flags: 'i', must: true, hint: 'Run all six in jshell and record an honest SCORE: n/6.', pass: 'score recorded — honest reps ✓' }
    ],
    run: 'open <code>jshell</code> and type each snippet exactly; for (5), declare the Integers on one line each and compare. Every miss is gold: it marks the exact spot your mental model diverged from the JVM\'s.',
    solution: `// 1) x == 5        — y got a copy of the value; coins in separate pockets
// 2) m[0] == 6     — arrays are objects; n is a second map to the same chest
// 3) 9/4 == 2 (truncation)    9/4.0 == 2.25 (promotion to double)
// 4) "id" + 4 + 2 == "id42"   4 + 2 + "id" == "6id"  (left-to-right evaluation)
// 5) 100: true (Integer cache, same object)   200: false (fresh objects)
//    — and either way, == on wrappers is the wrong question: use .equals()
// 6) (int) 7.99 == 7  — casting truncates toward zero, never rounds`,
    notes: [
      'A miss on (2) means re-watching the Nami animation — the map-copy picture has to be automatic before Part 3\'s collections, where EVERYTHING is references.',
      'A miss on (5) in the safe direction (predicting false/false) is fine philosophically — the cache is an implementation efficiency. Predicting true/true means == and .equals() aren\'t separated yet; that separation is this Part\'s closing lesson.',
      'Keep the score comment honest. The course\'s only real metric is "predictions per lesson that stopped surprising you."'
    ]
  },
  quiz: [
    {
      q: 'After int a = 10; int b = a; b = 20; — what is a, and why?',
      options: ['10 — assignment copied the VALUE into b\'s independent box; primitives never share', '20 — a and b refer to the same storage', '10, but only because int is immutable', 'Compile error — a was already assigned'],
      correct: 0,
      explain: 'Coins in pockets: the value 10 was copied into b\'s box, after which the boxes have no relationship. (And "immutable" isn\'t the mechanism — copying is.)'
    },
    {
      q: 'After int[] p = {1}; int[] q = p; q[0] = 7; — what is p[0], and why?',
      options: ['7 — q copied the REFERENCE, so both variables map to the same array object on the heap', '1 — assignment always copies the whole array', '1 — q became a snapshot of p at assignment time', 'Compile error — arrays can\'t be assigned'],
      correct: 0,
      explain: 'Arrays are objects: the box holds a map. Copying the box copies the map — two maps, one chest, and mutation through either is visible through both.'
    },
    {
      q: 'Integer a = 127, b = 127 gives a == b → true, but Integer c = 128, d = 128 gives c == d → false. What actually changed?',
      options: ['Nothing about the numbers — valueOf returns one cached object for -128..127, so the identity question (==) accidentally passes there; at 128 you get fresh objects and identity honestly fails. Compare wrappers with .equals()', 'Java\'s == operator overflows at 127', 'Integers become immutable above 127', '128 exceeds the byte range, corrupting the comparison'],
      correct: 0,
      explain: 'The bank pre-buries chests for small denominations. == was the wrong question at every value — the cache just made the wrong question return the right-looking answer below 128.'
    },
    {
      q: 'Which is the correct way to compare two computed doubles x and y for "equality"?',
      options: ['Math.abs(x - y) < epsilon, with a tolerance suited to the domain — binary floats carry representation error, so exact == is meaningless for computed values', 'x == y — doubles compare exactly like ints', 'x.equals(y) — doubles are objects', 'Convert both to float first for extra precision'],
      correct: 0,
      explain: '0.1 + 0.2 lands at 0.30000000000000004: each decimal literal rounds to the nearest binary fraction, and arithmetic compounds the error. Tolerance comparison — or BigDecimal/long-cents when exactness is the requirement (money).'
    },
    {
      q: 'What does var count = 3; count = "three"; do?',
      options: ['Fails to compile — var inferred int at the declaration and the type is fixed forever; inference is not dynamic typing', 'Works — var variables can hold anything, like Python', 'Compiles but throws ClassCastException at runtime', 'Works only if count is later cast back to int'],
      correct: 0,
      explain: 'var asks the compiler to write the type for you, once, at the declaration. Everything afterward is ordinary static typing — same bytecode, same rules, red squiggle included.'
    }
  ],
  testFlow: {
    title: 'Test yourself: the box model under fire',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A method void reset(int[] data) { data = new int[]{0}; } is called with your array {5}. After the call, your array contains…?',
        choices: [
          { text: '{5} — the method redrew ITS OWN copied map to point at a new array; your map and your chest never changed', to: 'q1_right' },
          { text: '{0} — the method replaced the array', to: 'q1_wrong_replace' },
          { text: 'Compile error — arrays can\'t be reassigned inside methods', to: 'q1_wrong_compile' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Rebinding a parameter only redraws the method\'s own map — pass-by-value, where the value is a reference. Had the method written data[0] = 0 instead (mutation through the shared map), your array WOULD see it. That rebind-vs-mutate line is the whole pass-by-value argument, settled.', next: 'q2' },
      q1_wrong_replace: { end: true, correct: false, text: 'The method got a COPY of your map. Pointing its copy at a new chest does nothing to yours — only mutating the shared chest (data[0] = 0) would be visible to you. Rebind vs mutate: different operations, different visibility.', retry: 'q1' },
      q1_wrong_compile: { end: true, correct: false, text: 'Parameters are ordinary local variables — reassigning one is legal and common. The interesting part is that it\'s invisible to the caller: only the method\'s own map moved.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A JPA entity (Part 8 preview) maps a nullable database column "review_score". Which field type is correct, and what\'s the trap with the other?',
        choices: [
          { text: 'Integer — it can represent NULL from the database; an int field would force a fake 0, and unboxing a null Integer elsewhere throws NullPointerException', to: 'q2_right' },
          { text: 'int — primitives are faster and the database will cope', to: 'q2_wrong_int' },
          { text: 'String — safest, since anything can be a string', to: 'q2_wrong_string' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Exactly — nullability is the one capability wrappers add that primitives can\'t fake. And the flip side you also named: Integer means every unboxing site is a potential NPE, so null checks (or Optional, Part 4) guard the border. This tiny type decision is real Part 8 code.', next: 'q3' },
      q2_wrong_int: { end: true, correct: false, text: 'An int has no way to say "no value" — the mapping layer would either crash or invent a 0 that\'s indistinguishable from a real score of 0. Nullable column → wrapper type is a firm JPA rule you\'ll meet again in Part 8.', retry: 'q2' },
      q2_wrong_string: { end: true, correct: false, text: 'Stringly-typed data trades one nullability problem for parsing, validation, and comparison problems everywhere. Keep numbers numeric; represent absence with the wrapper\'s null (guarded), not with a different domain.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'Code reviews keep flagging "if (userId == cachedId)" where both are Long. It passes all current tests. Ship it?',
        choices: [
          { text: 'No — it compares references; it only passes because test IDs are small (Long caches -128..127). Production IDs above 127 will make equal values compare false. Use .equals() or unbox to long', to: 'q3_right' },
          { text: 'Yes — passing tests mean it\'s correct', to: 'q3_wrong_tests' },
          { text: 'No — Long can\'t be compared at all, even with .equals()', to: 'q3_wrong_never' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'The exact production bug the cache breeds: correct-looking in every test with small fixture IDs, silently wrong when real IDs pass 127. And notice it\'s also a FLAKY-adjacent bug — correctness depending on data ranges, not logic. == on wrappers: always wrong, even when green.', next: null },
      q3_wrong_tests: { end: true, correct: false, text: 'The tests pass BECAUSE fixture IDs sit inside the -128..127 cache where boxing returns shared objects. The first production user with ID 128 falsifies the suite\'s implicit assumption. Green tests over the wrong question prove nothing — a theme your flaky-tests lesson (Part 7) returns to.', retry: 'q3' },
      q3_wrong_never: { end: true, correct: false, text: '.equals() compares Long contents correctly and is exactly the fix (or unbox both to primitive long and use ==). The problem isn\'t comparing — it\'s comparing IDENTITY when you meant VALUE.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Using == on wrapper types (Integer, Long, Boolean…) — it compares object identity and only "works" inside the -128..127 cache. It\'s the textbook bug that passes every unit test and fails in production. Wrappers compare with .equals(); better yet, keep primitives where null isn\'t needed.',
    'Unboxing without a null check — Integer x = mapOrDb.get(k); int y = x; compiles cleanly and NPEs at runtime the first time the value is absent. The wrapper/primitive border is a null border.',
    'Expecting overflow to throw — int arithmetic wraps silently at ±2.1 billion. Use long for IDs, timestamps, and counters; Math.addExact/multiplyExact when you\'d rather crash than wrap.',
    'Representing money as double — accumulate 0.1 a few thousand times and reconciliation fails. BigDecimal (from Strings) or integer cents in a long. Doubles are for measurements, not ledgers.',
    'Believing a method can\'t affect your data because "Java is pass-by-value" — the copied value is a MAP for objects: rebinding is invisible to you, but mutation through it is fully visible. Both halves matter.',
    'Writing var everywhere or banning it everywhere — it\'s a readability dial: use it when the initializer states the type (var user = new User()), avoid it when the reader would have to hunt (var result = svc.process()).'
  ],
  interview: [
    {
      q: 'Explain the difference between primitive and reference types in Java, and the consequences for assignment, comparison, and method calls.',
      a: 'A primitive variable stores its value directly — eight types (int, long, double, boolean, byte, short, float, char), fixed sizes, never null. A reference variable stores a reference to an object living on the heap — the variable is never the object, just the means of reaching it. One rule then generates all behavior: every assignment (and every method-argument pass) copies the variable\'s contents. For primitives, that copies the value — the copies are independent. For references, it copies the REFERENCE — producing two variables aliasing one object, so mutation through either is visible through both, while rebinding one has no effect on the other. Comparison follows the same logic: == compares stored contents, meaning values for primitives (correct) but identity — "same object?" — for references, which is why object equality goes through .equals(). Method calls are therefore "pass-by-value where the value may be a reference": a method can mutate the objects its parameters alias, but can never rebind the caller\'s variables. Practical corollaries: wrappers exist because generics/collections need objects (with autoboxing at the border, a null-unboxing hazard, and the -128..127 valueOf cache making == on wrappers a landmine); and nullable data (like database columns) needs wrapper types since primitives can\'t represent absence.'
    },
    {
      q: 'Integer a = 127, b = 127; System.out.println(a == b); Integer c = 128, d = 128; System.out.println(c == d); — output, and full explanation?',
      a: 'true, then false. Autoboxing compiles to Integer.valueOf(n), and valueOf maintains a cache of shared immutable Integer instances for the guaranteed range -128 to 127 — so both 127s are the very same object and identity comparison happens to pass. 128 falls outside the cache: each boxing allocates a distinct object, so == — which compares references, not numeric values — is false despite equal contents. Three points elevate the answer: (1) the cache exists because small values dominate boxing traffic, and sharing is safe only because Integer is immutable; (2) the upper bound is configurable (-XX:AutoBoxCacheMax), so code relying on cache behavior isn\'t merely wrong at 128, it\'s wrong differently per JVM configuration; (3) the real conclusion is that == asked the wrong question at EVERY value — wrapper comparison is .equals() (or unbox to primitives) — and the cache is dangerous precisely because it lets the wrong question pass small-number unit tests and fail on production data. Same trap applies to Long database IDs, where test fixtures under 128 hide the bug.'
    },
    {
      q: 'Why is double the wrong type for money, and what do you use instead?',
      a: 'Doubles are binary fractions (IEEE 754): they exactly represent only integer-times-power-of-two values, so most decimal amounts — 0.1, 0.01, a $19.99 price — are stored as the nearest representable binary value, each carrying a tiny error. Individual errors are ~10⁻¹⁷, but money is summed, multiplied by rates, and compared for exact equality across millions of transactions: errors accumulate, and "balance == expected" comparisons fail in ways that are rare, data-dependent, and miserable to reproduce — a ledger that\'s off by a cent is not 99.999% correct, it\'s wrong. Alternatives: BigDecimal — arbitrary-precision decimal arithmetic with explicit, auditable rounding modes; construct from Strings (new BigDecimal("0.1")), because the double constructor lovingly preserves the very error you\'re escaping; or store integer minor units (cents) in a long — fast, exact, and common in payment systems — formatting to decimal only at the display edge. Doubles remain correct for measurements, statistics, graphics, and ML features, where quantities are approximate by nature; the type choice follows the domain\'s exactness requirement, which is a sentence worth saying in an interview.'
    },
    {
      q: 'Is Java pass-by-value or pass-by-reference? Prove your answer with code.',
      a: 'Pass-by-value, without exception — with the twist that for objects, the value copied is a reference. Proof by two functions: void rebind(int[] a) { a = new int[]{9}; } — call it with int[] mine = {1}; and mine is STILL {1} afterward: the method redirected its own copied reference, and if Java were pass-by-reference, my variable itself would now point at the new array. void mutate(int[] a) { a[0] = 9; } — now mine becomes {9}: the copied reference aliases my object, so mutation through it is visible to me. The pair demonstrates both halves: callers are insulated from parameter REBINDING (proving by-value), but exposed to OBJECT MUTATION (proving the value was a reference). Same story for the classic swap: void swap(Point a, Point b) { Point t = a; a = b; b = t; } shuffles the method\'s own two maps and achieves nothing for the caller — genuinely impossible to write in Java, trivially possible in C++ with references. The crisp interview close: "Java copies arguments always; for objects the copy is a reference — so methods can change your objects\' state but never which objects your variables name."'
    }
  ]
};
