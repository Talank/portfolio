window.LESSONS = window.LESSONS || {};
window.LESSONS['oop-classes-objects'] = {
  id: 'oop-classes-objects',
  title: 'Classes & Objects: Constructors, this, static, Encapsulation',
  category: 'Part 1 — Core Java',
  timeMin: 50,
  summary: 'Java\'s heart: the class as a blueprint, objects as the things built from it, constructors as the only door into a valid object, this as "the object I am", static as "belongs to the blueprint, not the buildings", and encapsulation — private fields behind deliberate methods — as the difference between a design and a pile of variables. By the end you\'ll write the first real LogPose domain class and understand why every field in it is private.',
  goals: [
    'Define a class with private fields, overloaded constructors (chained with this(...)), getters, and a toString — and justify each piece',
    'Distinguish instance members from static members, and predict what static methods can and cannot touch',
    'Use this correctly in its two roles: disambiguating fields from parameters, and chaining constructors',
    'Explain encapsulation as invariant-protection (not ceremony), and spot the bug a public field invites',
    'Read the four access levels (private, package-private, protected, public) and pick deliberately'
  ],
  concept: [
    {
      h: 'Class = blueprint, object = the thing built from it',
      p: [
        'A <b>class</b> declares what every instance will have (fields) and be able to do (methods). An <b>object</b> is one concrete instance, built with <code>new</code>, living on the heap, reached through references — last lesson\'s maps-to-chests picture now gets its chests properly designed. One blueprint, any number of buildings; each object gets its OWN copy of every instance field.',
        '<div class="math">class LogEntry { String title; String kind; }&nbsp;&nbsp;→&nbsp;&nbsp;LogEntry a = new LogEntry();&nbsp;&nbsp;LogEntry b = new LogEntry();<span class="mnote">a and b are two independent chests built from one blueprint — a.title and b.title are different boxes. The class itself stores nothing per-object.</span></div>',
        'From here to the end of the course, "modeling" means: pick the nouns of your domain (for LogPose: <code>LogEntry</code>, <code>Project</code>, <code>Tag</code>, <code>ReviewNote</code>), give each a class, and decide what state (fields) and behavior (methods) genuinely belong to it. Java is unapologetically class-shaped — even <code>main</code> had to live in one — so this lesson is less "a feature" than "the terrain".'
      ]
    },
    {
      h: 'Constructors: the only door into a valid object',
      p: [
        'A <b>constructor</b> — same name as the class, no return type — runs exactly once per <code>new</code>, and its job is to ensure no object EVER exists in a half-made state. If you write no constructor, Java supplies an invisible no-arg <b>default constructor</b> that leaves fields at their zero-defaults (0, false, null) — and the moment you declare ANY constructor, that default vanishes (a classic "why did my <code>new Foo()</code> stop compiling?" moment).',
        'Constructors overload like methods, and the idiom for defaults is <b>chaining</b>: the short constructor calls the fuller one with <code>this(...)</code> — which must be the first statement — so validation and assignment live in exactly one place (the same delegate-don\'t-duplicate rule your Streak lab used for method overloads):',
        '<div class="math">LogEntry(String title) { this(title, "misc"); }&nbsp;&nbsp;&nbsp;LogEntry(String title, String kind) { …validate, assign… }<span class="mnote">one constructor owns the logic; the others fill in defaults and forward. Validation in the constructor is what makes "a LogEntry always has a non-blank title" a fact rather than a hope.</span></div>',
        '<b>this</b> has two jobs. Inside any instance method or constructor, it\'s a reference to "the object this call is running on" — needed most when a parameter shadows a field: <code>this.title = title;</code> assigns the parameter to the field (without <code>this</code>, you\'d assign the parameter to itself — legal, useless, and a compiler warning if you\'re lucky). And as <code>this(...)</code> it\'s the constructor-chaining call you just met.'
      ]
    },
    {
      h: 'static: belongs to the blueprint, not the buildings',
      p: [
        'A <b>static</b> field has exactly ONE copy, attached to the class itself, shared by all instances (and existing even if there are none): <code>static int entriesCreated;</code> counts across every LogEntry ever made. A <b>static method</b> is called on the class (<code>LogEntry.count()</code>, <code>Math.sqrt(2)</code>) and — the rule that explains every "non-static cannot be referenced from static context" error you will ever see — <b>has no <code>this</code></b>: it belongs to no particular object, so it cannot touch instance fields or call instance methods directly. It can only use its parameters, static state, or an instance handed to it. That\'s precisely why <code>main</code> (static — the JVM has no objects to call it on) had to CREATE objects before doing anything object-ish.',
        'When to reach for static, honestly: utility functions with no per-object state (<code>Math.max</code>, your <code>Streak.longestStreak</code> from last lesson — it was static because it depends only on its arguments), constants (<code>static final double GRAVITY = 9.81;</code> — <code>final</code> meaning "assigned once"; screaming_snake_case by convention), factory methods (Part 3\'s <code>List.of(...)</code>), and shared counters/caches (used sparingly — shared mutable state is exactly what Part 5\'s concurrency lessons will teach you to fear). Everything else — anything that reads or writes a particular object\'s fields — is instance. When in doubt, instance.'
      ]
    },
    {
      h: 'Encapsulation: private fields, deliberate doors',
      p: [
        'Make every field <code>private</code> and expose behavior through methods. This isn\'t ritual — it\'s <b>invariant protection</b>. An invariant is a fact your class promises is always true: "a LogEntry\'s title is never blank", "spentMinutes is never negative", "the tags list has no duplicates". With public fields, every line of code anywhere in the program can break any promise at any time, and the bug surfaces far from the write that caused it. With private fields, the ONLY code that can touch the state is the class\'s own methods — so every promise has a checkpoint, and when something\'s wrong, the suspect list is one file long.',
        'Getters and setters are the standard doors: <code>getTitle()</code>, and — only when mutation is genuinely part of the design — <code>setTitle(String)</code> that validates before assigning. Two pieces of taste the ecosystem has converged on: <b>don\'t auto-generate a setter for every field</b> (a field with no setter is immutable-after-construction — the strictly safer default; Part 4\'s records take this to its logical conclusion), and <b>getters aren\'t a license to leak</b> — returning your private mutable list hands every caller a map to your internal chest (last lesson\'s aliasing!); return a copy or an unmodifiable view (Part 3 shows how). The naming convention (get/set/is) isn\'t just politeness either: JavaBeans-style tooling — JPA in Part 8, Jackson in Part 9, JavaFX bindings in Part 11 — discovers your properties by these exact name patterns.',
        'Access levels, smallest to largest audience: <b>private</b> (this class only — your default for fields), <b>package-private</b> (no keyword: this package only — handy for test access and internal collaborators), <b>protected</b> (package + subclasses — meaningful after next lesson), <b>public</b> (everyone — your API surface, kept deliberately small). Add <code>toString()</code> with <code>@Override</code> to every domain class early: <code>System.out.println(entry)</code> printing <code>LogEntry[title=…, kind=…]</code> instead of <code>LogEntry@1b6d3586</code> pays for itself the first time you debug anything. (<code>@Override</code> asks the compiler to verify you\'re actually overriding — typo <code>tostring</code> and it\'s a compile error instead of a silent nothing. Overriding itself is next lesson\'s star.)'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Nami\'s treasury: nobody touches the berries',
      text: 'Early on, the Straw Hats\' money was a public field: a chest on deck, lid open, anyone\'s hands allowed. The "invariant" — we keep enough berries to restock at the next island — was a hope, not a rule. And it broke exactly how you\'d predict: Luffy withdrew meat funds directly, Usopp "borrowed" for parts, Zoro got lost and bought the wrong map, and nobody could say WHERE the money went, because every write to the chest happened from somewhere else on the ship, with no record and no checks. The bug surfaced at the worst moment (docking fees, empty chest) far from any of the writes that caused it. Then Nami privatized the treasury. The chest went below deck, into her cabin — private — and the crew got exactly two doors: ask Nami to WITHDRAW (a method with validation: she checks the reserve floor, refuses meat-related requests on principle, and LOGS every berry out) and ask Nami to DEPOSIT (she counts it herself; no one "deposits" IOUs). The promise "we can always afford to dock" stopped being a hope and became an invariant, because every path to the money passes one checkpoint. When something\'s off by 50 berries now, the suspect list is one navigator long. The blueprint-vs-building distinction lives on the ship too: "Straw Hat crew member" is the CLASS — every member built from it has their own bounty, their own dream, their own stomach (instance fields: Luffy\'s hunger doesn\'t fill when Zoro eats). But the flag flying on the mast? ONE flag, belonging to the crew as a whole, shared by every member and existing even between members (static — you don\'t get a personal Jolly Roger; you get THE Jolly Roger). And when the crew\'s cook-of-the-day roster (a static utility posted on the mast) tried to check "am I hungry?" — the roster stared back blankly. The ROSTER isn\'t anyone; there is no "I" on a piece of paper nailed to the mast. It can only reason about crew members handed to it by name. That\'s a static method discovering it has no this.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'The mint-condition comics: look through the sleeve',
      text: 'Sheldon\'s comic collection is encapsulation with a lecture attached. The comics are private in the most literal sense: bagged, boarded, boxed, and no one — NO ONE — touches the pages. When Penny wants to see The Flash #123, she doesn\'t reach in (a public field would let her, and her wine glass is RIGHT THERE); she goes through Sheldon\'s access methods: viewComic(title) — he retrieves it himself, presents it through the mylar sleeve, narrates provenance (a getter returning a protected view, never the raw mutable object) — and if she wants to actually handle it, requestHandling(title) triggers validation: cotton gloves, no beverages within a three-foot radius, supervised turning of pages. Every invariant ("near-mint stays near-mint") has a checkpoint, and the checkpoint is Sheldon. The one time the invariant broke — a spilled drink at a party — the whole apartment understood WHY the rules exist: with open access, the damage could have come from anyone at any time; the bug report is "somebody, sometime". Under Sheldon\'s regime, the suspect list is exactly one access method long. The class/instance/static trio also lives in 4A: "The Roommate Agreement" is a class; the SIGNED COPY governing Sheldon-and-Leonard is an instance with its own state (amendments, invoked clauses — Penny\'s hypothetical agreement would be a different object with different amendments). But the apartment flag — from Fun with Flags, obviously — is static: one flag, property of the APARTMENT as an institution, shared by all occupants, still there when both roommates are at work. And Sheldon\'s constructor discipline is the best in the building: no relationship, roommate, or train trip begins until every precondition is validated and signed — because Sheldon Cooper does not allow half-initialized objects to exist. The Relationship Agreement literally ensures Amy and Sheldon\'s relationship never enters an invalid state. It has clauses. It has this.'
    },
    why: 'The open chest on deck vs Nami\'s guarded treasury IS public-field vs private-field-with-methods: invariants become enforceable exactly when every write passes one checkpoint, and debugging shrinks to a one-file suspect list. Per-member bounties vs THE one Jolly Roger is instance vs static — and the roster on the mast that can\'t ask "am I hungry?" is why static methods have no this. Sheldon\'s sleeve-only comic viewing is the getter that returns a protected view instead of leaking the mutable original, and his precondition-signed agreements are constructors: no object exists in an invalid state, ever.'
  },
  storyAnim: {
    title: 'Privatizing the treasury: from open chest to invariant',
    h: 290,
    props: [
      { id: 'openChest', emoji: '📤', label: 'public chest on deck (anyone writes)', x: 14, y: 12 },
      { id: 'luffyGrab', emoji: '🍖', label: 'Luffy withdraws directly', x: 42, y: 12 },
      { id: 'broke', emoji: '💸', label: 'docking day: empty. suspect: everyone', x: 74, y: 12 },
      { id: 'cabin', emoji: '🚪', label: 'chest moved below deck (private)', x: 14, y: 52 },
      { id: 'withdraw', emoji: '📋', label: 'withdraw(amount) — validated, logged', x: 44, y: 52 },
      { id: 'deposit', emoji: '📥', label: 'deposit(amount) — counted', x: 74, y: 52 },
      { id: 'flag', emoji: '🏴‍☠️', label: 'THE flag: one per crew (static)', x: 22, y: 86 },
      { id: 'bounty', emoji: '💰', label: 'bounties: one per member (instance)', x: 56, y: 86 },
      { id: 'roster', emoji: '📜', label: 'roster on mast: has no "I" (no this)', x: 86, y: 86 }
    ],
    actors: [
      { id: 'nami', emoji: '🍊', label: 'Nami', x: 50, y: 32 }
    ],
    steps: [
      { c: 'Version 1: the money is a public field. Open chest, on deck, every crew member\'s hands allowed.', p: { openChest: 'lit' } },
      { c: 'So every promise about the money is a hope. Luffy writes to the field directly — no validation, no record.', p: { luffyGrab: 'bad' } },
      { c: 'The bug surfaces far from the writes: docking day, empty chest, and the suspect list is the entire ship.', p: { broke: 'bad' } },
      { c: 'Version 2: Nami privatizes. The chest moves below deck — private field. Direct access: gone.', p: { openChest: 'off', cabin: 'good' }, a: { nami: [30, 44] } },
      { c: 'The crew gets deliberate doors: withdraw(amount) validates against the reserve floor and logs; deposit(amount) is counted. Every path to the state passes one checkpoint.', p: { withdraw: 'good', deposit: 'good' } },
      { c: '"We can always afford to dock" is now an INVARIANT — enforced at the door, not hoped about. And a 50-berry discrepancy has a one-navigator suspect list.', p: { broke: 'off' } },
      { c: 'Meanwhile: each member has their OWN bounty (instance fields — one copy per object), but there is exactly ONE Jolly Roger, belonging to the crew itself (static — shared, exists even between members).', p: { flag: 'lit', bounty: 'lit' } },
      { c: 'And the cook-roster nailed to the mast? It can\'t ask "am I hungry?" — a roster isn\'t anyone. Static methods have no this; they only know what they\'re handed.', p: { roster: 'lit' } }
    ]
  },
  conceptFlow: {
    title: 'Anatomy of a domain class, decision by decision',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Blueprint',
        nodes: [
          { id: 'cls', text: 'class LogEntry\nthe nouns of your domain' },
          { id: 'fields', text: 'private fields\nstate — one copy per object' }
        ]
      },
      {
        label: 'Construction',
        nodes: [
          { id: 'ctor', text: 'constructor\nvalidate → assign; no invalid object ever exists' },
          { id: 'chain', text: 'this(...) chaining\nshort ctors forward to the full one' }
        ]
      },
      {
        label: 'Behavior',
        nodes: [
          { id: 'methods', text: 'instance methods\ncan use this — run ON an object' },
          { id: 'statics', text: 'static members\nblueprint-level: no this, shared state' }
        ]
      },
      {
        label: 'The doors',
        nodes: [
          { id: 'getters', text: 'getters (maybe setters)\ndeliberate, validated access' },
          { id: 'tostring', text: '@Override toString()\ndebuggable objects from day one' }
        ]
      }
    ],
    steps: [
      { active: ['cls'], note: 'One class per domain noun. LogPose\'s first four: LogEntry, Project, Tag, ReviewNote. If you can\'t say what a class is responsible for in one sentence, it\'s two classes.' },
      { active: ['fields'], note: 'Fields are per-object state, and they are private — not as ceremony, but because every invariant needs a checkpoint, and private is what creates the checkpoint.' },
      { active: ['ctor'], note: 'The constructor is the only door into existence: validate arguments, reject garbage (throw IllegalArgumentException — Part 1\'s exceptions lesson formalizes this), assign fields. After the constructor returns, the object\'s promises hold.' },
      { active: ['chain'], note: 'Overloaded constructors forward to one canonical constructor via this(...) — first statement, defaults filled in. Validation lives once. Duplicate it and the copies WILL drift.' },
      { active: ['methods'], note: 'Instance methods run ON an object — this is that object. Behavior lives next to the state it protects: entry.addTag(t) can enforce "no duplicate tags" because it\'s the only way tags change.' },
      { active: ['statics'], note: 'Static members belong to the class: one shared copy, callable with no instance, and — no this. A static method can\'t touch instance fields because it belongs to no instance. That\'s the whole "non-static reference from static context" error, demystified.' },
      { active: ['getters'], note: 'Expose the minimum: getters for what callers genuinely need, setters only where mutation is part of the design, and never leak references to private mutable internals — return copies or unmodifiable views.' },
      { active: ['tostring'], note: 'toString() with @Override makes every println and debugger session readable. @Override is a free compiler check that you really did override — make it reflex now, it becomes load-bearing next lesson.' }
    ]
  },
  tech: [
    {
      q: 'What exactly happens, step by step, when I write new LogEntry("title", "idea")?',
      a: 'Five steps, and knowing them explains several later lessons. (1) The JVM allocates space on the heap for the object: all its instance fields, plus a small header (which stores, among bookkeeping, the object\'s class — how the JVM knows at runtime what this chest actually is; that header is what makes next lesson\'s dynamic dispatch and Part 2\'s GC possible). (2) Fields are zeroed: 0, false, null — so even before your constructor runs, the object has SOME defined state (unlike local variables, which the compiler forces you to initialize before reading — fields get defaults, locals get errors). (3) Field initializers and instance-initializer blocks run in source order ("String kind = \\"misc\\";" written at the field counts as this step). (4) The constructor body runs — after an implicit or explicit call up the superclass chain (next lesson\'s super(), which is why parent state is ready before child constructors execute). (5) new returns the reference — the map to the finished chest. One sharp edge worth filing now: don\'t call overridable methods from a constructor — during step 4 a subclass\'s override can run BEFORE that subclass\'s own fields initialize (its constructor hasn\'t run yet), observing half-built state. It\'ll make full sense after inheritance; plant the flag today.'
    },
    {
      q: 'Why do JPA, Jackson, and friends demand a no-arg constructor — and what does that do to my validation story?',
      a: 'Frameworks that materialize objects FROM data (Hibernate reading a database row in Part 8, Jackson parsing JSON in Part 9) can\'t know how to call your rich constructor — which argument is which? — so their default strategy is: instantiate via the no-arg constructor (often reflectively, sometimes bypassing constructors entirely), then inject each field directly (reflection can write private fields — Part 2\'s jvm-tools lesson shows this trick openly). Consequences: entity classes typically need a no-arg constructor (JPA allows it protected, which keeps humans from misusing it while satisfying the framework), and your constructor-validation checkpoint is BYPASSED on that path — the framework path trusts the data source instead. The ecosystem\'s answer is layered validation: constructors guard the objects YOU build in code, while framework-built objects are checked by declarative constraints (Bean Validation\'s @NotBlank, @Positive — Part 9) enforced at the API boundary before data ever reaches persistence. Encapsulation isn\'t defeated — the checkpoint moves to the border crossing. Knowing WHERE each object comes from (your new vs the framework\'s reflection) tells you which checkpoint protects it.'
    },
    {
      q: 'When is a static field a design smell, and when is it exactly right?',
      a: 'Exactly right: static final constants (immutable, shared, harmless — Math.PI, your DEFAULT_KIND); pure static utility methods (no state at all — Math.max, Collections.sort); and static factory methods that construct instances with meaningful names (List.of, LocalDate.now — Part 4). Smell: static MUTABLE state — a static counter, cache, or "current user" — because it is a global variable wearing a class badge. Three specific costs, each foreshadowing a later lesson: testability (tests share the static state, so test order changes results — a textbook FLAKY-test mechanism for Part 7, and yes, your research topic makes an entrance this early); concurrency (every thread sees the same field, so unsynchronized ++ on it drops updates — Part 5 demonstrates this live); and hidden coupling (any code can read/write it, so data flow no longer follows method signatures — the open chest on deck again, ship-wide). The mature pattern you\'ll meet in Part 9: create ONE instance of a service and INJECT it where needed (Spring\'s dependency injection) — shared like a static, but visible in constructors, swappable in tests, and lifecycle-managed. Rule of thumb: static + final + immutable = fine; static + mutable = justify it out loud, twice.'
    },
    {
      q: 'Do getters and setters actually earn their boilerplate — why not just make fields public and move on?',
      a: 'The honest engineering answer has three layers. (1) Invariants and evolution: a getter/setter is a stable POINT OF INTERCEPTION — today setSpentMinutes(m) just assigns; next month it validates m >= 0; later it also updates a derived total or notifies the UI (JavaFX properties, Part 11, are literally this). With a public field, every one of those changes breaks every caller; behind a method, callers never notice. (2) The ecosystem\'s contract: JavaBeans naming (getX/setX/isX) is how JPA maps columns, Jackson maps JSON keys, and JavaFX binds UI — conform and the machinery just works; don\'t, and you fight every framework in this course. (3) BUT — and interviews reward this nuance — blind getter/setter pairs for every field are barely better than public fields: a class whose every field is freely readable AND writable has no invariants worth the name. The modern gradient: no setter unless mutation is a designed operation (immutable-after-construction as default); for pure data carriers, skip the whole question — Part 4\'s records give you constructor, accessors, equals/hashCode, and toString in one line, with immutability built in. So: encapsulation always; boilerplate only where it buys interception; records where there\'s nothing to intercept.'
    }
  ],
  code: {
    title: 'LogEntry v1 — the first real LogPose class',
    intro: 'Everything from this lesson in one honest domain class: private fields, chained validating constructors, this in both roles, a static counter with a static accessor, deliberate doors, and a toString. This class grows with you all course long.',
    code: `public class LogEntry {
    // --- instance state: one copy PER entry, private: every write passes a checkpoint ---
    private String title;
    private String kind;           // "idea" | "review" | "experiment" | ...
    private int spentMinutes;

    // --- class-level state: ONE copy total, shared (and mutable -- so: used carefully) ---
    private static int entriesCreated = 0;

    private static final String DEFAULT_KIND = "misc";   // constant: static + final

    // Canonical constructor: ALL validation lives here, and only here.
    public LogEntry(String title, String kind, int spentMinutes) {
        if (title == null || title.isBlank())
            throw new IllegalArgumentException("title must not be blank");
        if (spentMinutes < 0)
            throw new IllegalArgumentException("spentMinutes must be >= 0");
        this.title = title;               // 'this.' — field, not the parameter
        this.kind = (kind == null || kind.isBlank()) ? DEFAULT_KIND : kind;
        this.spentMinutes = spentMinutes;
        entriesCreated++;                 // static: shared across ALL entries
    }

    // Convenience constructors: forward via this(...) — first statement, no duplicated logic.
    public LogEntry(String title, String kind) { this(title, kind, 0); }
    public LogEntry(String title)              { this(title, DEFAULT_KIND, 0); }

    // --- deliberate doors ---
    public String getTitle()     { return title; }
    public String getKind()      { return kind; }
    public int getSpentMinutes() { return spentMinutes; }

    // A designed mutation, not a blind setter: it ACCUMULATES, and it validates.
    public void logTime(int minutes) {
        if (minutes <= 0) throw new IllegalArgumentException("minutes must be positive");
        this.spentMinutes += minutes;
    }
    // note: no setTitle / setKind — immutable-after-construction until a redesign says otherwise

    // Static accessor for static state; note it CANNOT mention title/kind — there's no 'this'.
    public static int getEntriesCreated() { return entriesCreated; }

    @Override
    public String toString() {
        return "LogEntry[title=" + title + ", kind=" + kind
             + ", spent=" + spentMinutes + "min]";
    }

    public static void main(String[] args) {
        LogEntry idea = new LogEntry("Embedding cache for repeated queries", "idea");
        LogEntry review = new LogEntry("Flaky-test detection paper");   // kind defaults
        idea.logTime(25);
        idea.logTime(15);
        System.out.println(idea);                        // readable, thanks to toString
        System.out.println(review);
        System.out.println(LogEntry.getEntriesCreated()); // 2 — class-level, not per-object
        // new LogEntry("  ")  → IllegalArgumentException: no invalid object ever exists
    }
}`,
    notes: [
      'Count the checkpoints: title can only be set in one place (canonical constructor), spentMinutes can only grow through logTime\'s validation. Those two facts ARE the class\'s invariants, enforced rather than hoped.',
      'logTime instead of setSpentMinutes is the difference between designing behavior and exposing variables — the method says what the operation MEANS.',
      'entriesCreated is the lesson\'s one deliberate impurity: static mutable state, fine in a single-threaded demo, and exactly the thing Part 5 will show two threads corrupting and Part 7 will show making tests order-dependent. It\'s here so you recognize it later.'
    ]
  },
  lab: {
    title: 'Build Project — LogPose\'s second domain class',
    prompt: 'Write <code>Project</code> the same disciplined way: (1) private fields <code>String name</code>, <code>String status</code>, <code>int entryCount</code>; (2) a canonical constructor <code>Project(String name, String status)</code> that throws <code>IllegalArgumentException</code> for a null/blank name and defaults a null/blank status to <code>"active"</code>; (3) a convenience constructor <code>Project(String name)</code> that CHAINS with <code>this(...)</code>; (4) getters for all three fields, but NO setters; (5) a designed mutation <code>void recordEntry()</code> that increments <code>entryCount</code>; (6) a <code>static final String DEFAULT_STATUS = "active"</code> used in the constructor; (7) an <code>@Override toString()</code>. No main needed — you\'ll exercise it from jshell.',
    starter: `public class Project {
    // 1) private fields

    // 6) the constant

    // 2) canonical constructor: validate name, default status

    // 3) convenience constructor — must chain with this(...)

    // 4) getters only — no setters

    // 5) recordEntry()

    // 7) toString with @Override
}`,
    checks: [
      { re: 'private\\s+String\\s+name', must: true, hint: 'Fields must be private — the whole lesson in one keyword.', pass: 'private fields ✓' },
      { re: 'static\\s+final\\s+String\\s+DEFAULT_STATUS', must: true, hint: 'Declare static final String DEFAULT_STATUS = "active"; — a class-level constant.', pass: 'constant declared ✓' },
      { re: 'IllegalArgumentException', must: true, hint: 'The canonical constructor must throw IllegalArgumentException for a null/blank name.', pass: 'constructor validates ✓' },
      { re: 'isBlank\\s*\\(', must: true, hint: 'Use isBlank() to reject whitespace-only names (null check first!).', pass: 'blank check ✓' },
      { re: 'this\\s*\\(', must: true, hint: 'The one-arg constructor must chain: this(name, DEFAULT_STATUS);', pass: 'constructor chaining ✓' },
      { re: 'this\\s*\\.\\s*name\\s*=\\s*name', must: true, hint: 'Disambiguate with this: this.name = name;', pass: 'this.field = param ✓' },
      { re: 'void\\s+recordEntry\\s*\\(', must: true, hint: 'Add the designed mutation void recordEntry() incrementing entryCount.', pass: 'recordEntry ✓' },
      { re: '@Override', must: true, hint: 'Mark toString with @Override — free compiler verification.', pass: '@Override present ✓' },
      { re: 'String\\s+toString\\s*\\(', must: true, hint: 'Provide public String toString().', pass: 'toString ✓' },
      { re: 'set(Name|Status|EntryCount)\\s*\\(', must: false, hint: 'No setters — immutable-after-construction except through recordEntry(). Delete any setXxx methods.', pass: 'no blind setters ✓' }
    ],
    run: 'save as <code>Project.java</code>, run <code>jshell Project.java</code>, then interactively: <code>var p = new Project("LogPose")</code> → check <code>p</code> prints via your toString; <code>p.recordEntry()</code> twice → <code>p.getEntryCount()</code> is 2; and confirm <code>new Project("  ")</code> throws. jshell + a class file is the fastest way to poke at a design.',
    solution: `public class Project {
    private String name;
    private String status;
    private int entryCount;

    private static final String DEFAULT_STATUS = "active";

    public Project(String name, String status) {
        if (name == null || name.isBlank())
            throw new IllegalArgumentException("name must not be blank");
        this.name = name;
        this.status = (status == null || status.isBlank()) ? DEFAULT_STATUS : status;
        this.entryCount = 0;
    }

    public Project(String name) {
        this(name, DEFAULT_STATUS);
    }

    public String getName()     { return name; }
    public String getStatus()   { return status; }
    public int getEntryCount()  { return entryCount; }

    public void recordEntry() {
        this.entryCount++;
    }

    @Override
    public String toString() {
        return "Project[name=" + name + ", status=" + status
             + ", entries=" + entryCount + "]";
    }
}`,
    notes: [
      'Notice what having NO setters buys: a Project\'s name can never change after construction, and entryCount can only move by +1 through a method whose name states the business event. That\'s design, not boilerplate.',
      'The null-check-before-isBlank order matters: calling isBlank() on null throws NullPointerException — short-circuit || evaluation (left to right, stops early) is doing real work in that condition.',
      'Project and LogEntry will meet again in Part 8 as JPA entities (with a protected no-arg constructor added for the framework) and in Part 14 as the first two tables of LogPose\'s ERD.'
    ]
  },
  quiz: [
    {
      q: 'You declare a constructor LogEntry(String title) and suddenly new LogEntry() stops compiling. Why?',
      options: ['The invisible default no-arg constructor is only supplied when a class declares NO constructors — declaring any constructor removes it', 'Constructors can\'t be overloaded', 'The class must be marked public first', 'new LogEntry() only works for static classes'],
      correct: 0,
      explain: 'Java\'s deal: define no doors and you get a free default one; define ANY door and you own all door-making. Add an explicit no-arg constructor (ideally chaining to the canonical one) if you want it back.'
    },
    {
      q: 'Why can\'t a static method read an instance field directly?',
      options: ['A static method belongs to the class, not to any object — there is no this, so there\'s no particular object whose field it could read', 'Static methods run before the JVM starts', 'Instance fields are always private', 'It can, as long as the field is public'],
      correct: 0,
      explain: 'The roster nailed to the mast can\'t ask "am I hungry?" — it isn\'t anyone. Static code only knows its parameters, static state, and any instances explicitly handed to it. That\'s the entire "non-static reference from static context" error.'
    },
    {
      q: 'What is the point of making fields private, in one honest sentence?',
      options: ['It forces every write to pass through the class\'s own methods, making the class\'s invariants enforceable and the suspect list for state bugs one file long', 'It makes the program run faster', 'It encrypts the field\'s contents in memory', 'It\'s required by the compiler for all fields'],
      correct: 0,
      explain: 'Nami\'s treasury: promises about state become checkable exactly when there\'s one checkpoint. Performance, encryption, and compiler mandates have nothing to do with it.'
    },
    {
      q: 'In this.title = title; — what do the two sides refer to?',
      options: ['this.title is the object\'s field; bare title is the constructor/method parameter that shadows it', 'Both refer to the field — this is optional decoration', 'this.title is a static field; title is an instance field', 'It\'s a compile error to name a parameter after a field'],
      correct: 0,
      explain: 'The parameter shadows the field inside the method body, so the bare name means the parameter. this. reaches past the shadow to the object\'s own box. Without it, title = title assigns the parameter to itself — legal and useless.'
    },
    {
      q: 'Your getTags() returns the private ArrayList itself, and a caller does entry.getTags().clear(). What happened, and what\'s the fix?',
      options: ['You leaked a reference to your internal mutable state — the caller mutated your chest through the returned map, bypassing every checkpoint; return a copy or an unmodifiable view instead', 'Nothing — getters make returned objects read-only automatically', 'A compile error — clear() can\'t be called on a getter result', 'The caller got a copy, so only their copy was cleared'],
      correct: 0,
      explain: 'Last lesson\'s aliasing meets this lesson\'s encapsulation: returning the reference hands out a working map to your private chest. Sheldon shows the comic through the sleeve — List.copyOf / Collections.unmodifiableList are the sleeves (Part 3).'
    }
  ],
  testFlow: {
    title: 'Test yourself: blueprints, doors, and the mast',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'LogEntry a = new LogEntry("x"); LogEntry b = new LogEntry("y"); a.logTime(30); — what is b.getSpentMinutes(), and what is LogEntry.getEntriesCreated()?',
        choices: [
          { text: 'b has 0 (instance fields: one copy per object); entriesCreated is 2 (static: one shared copy, bumped by each construction)', to: 'q1_right' },
          { text: 'b has 30 — LogEntry objects share their fields', to: 'q1_wrong_shared' },
          { text: 'Both are 2 — all fields are class-level', to: 'q1_wrong_all' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Bounties vs the Jolly Roger: spentMinutes is per-member (a\'s 30 minutes fill nobody else\'s ledger), while entriesCreated belongs to the crew itself — every construction increments the one shared counter.', next: 'q2' },
      q1_wrong_shared: { end: true, correct: false, text: 'Instance fields are one-copy-PER-OBJECT — that\'s the definition. a and b are two chests from one blueprint; a.spentMinutes and b.spentMinutes are different boxes. Only static fields are shared.', retry: 'q1' },
      q1_wrong_all: { end: true, correct: false, text: 'Only fields declared static live at class level. title, kind, spentMinutes are instance fields — each object gets its own. Check for the keyword, not the vibe.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A teammate\'s class has public int balance; and a bug report says balance went negative "somehow, somewhere". What\'s the structural fix?',
        choices: [
          { text: 'Make balance private and route all changes through validating methods (withdraw/deposit) — the invariant gets a checkpoint, and future bugs get a one-file suspect list', to: 'q2_right' },
          { text: 'Add a comment: // never set this negative', to: 'q2_wrong_comment' },
          { text: 'Search the codebase for every write and fix the guilty one — the field can stay public', to: 'q2_wrong_hunt' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Nami\'s privatization, exactly: the fix isn\'t finding today\'s guilty write, it\'s making tomorrow\'s guilty write impossible. Validation at the only door turns the hope into an invariant.', next: 'q3' },
      q2_wrong_comment: { end: true, correct: false, text: 'Comments don\'t compile. Every line in the program remains free to write the field; the promise is still a hope. Encapsulation is the enforcement mechanism the comment wishes it were.', retry: 'q2' },
      q2_wrong_hunt: { end: true, correct: false, text: 'You\'ll fix today\'s write and next sprint adds another — with a public field, the bug is structural, so the hunt repeats forever. Close the field; the compiler then finds every illegal writer FOR you (they stop compiling).', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'Inside static void main you write title = "x"; to set a LogEntry\'s title field and get "non-static variable cannot be referenced from static context". What\'s the actual situation?',
        choices: [
          { text: 'main belongs to the class, not to any LogEntry — there\'s no this, hence no object whose title could be meant; create an instance (new LogEntry(...)) and go through ITS doors', to: 'q3_right' },
          { text: 'title needs to be declared public', to: 'q3_wrong_public' },
          { text: 'main must be made non-static so it can see fields', to: 'q3_wrong_nonstatic' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'The roster on the mast, asking "am I hungry?" — there\'s no I. main is the JVM\'s static entry point precisely because no objects exist yet; its job is to CREATE them and then talk to specific instances. Part 1\'s most-asked beginner error, permanently decoded.', next: null },
      q3_wrong_public: { end: true, correct: false, text: 'Visibility isn\'t the issue — even a public instance field needs an INSTANCE. The error says "non-static from static context": no this exists in main, so no object\'s field can be meant without naming an object.', retry: 'q3' },
      q3_wrong_nonstatic: { end: true, correct: false, text: 'The JVM requires main to be static (it\'s called before any objects exist — Lesson 0.2\'s entry-point contract). The fix runs the other way: main constructs instances, then accesses fields through them.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Writing title = title in a constructor instead of this.title = title — compiles, assigns the parameter to itself, leaves the field null. The shadowing rule plus a missing this is the most classic constructor bug in Java.',
    'Declaring a parameterized constructor and forgetting that the free no-arg one vanishes — and its cousin: frameworks (JPA, Jackson) needing a no-arg constructor you removed. Know which constructors exist and who calls them.',
    'Blind getter/setter pairs for every field — encapsulation theater. A setter is a design decision ("this state legitimately changes, unvalidated?"); default to no setter, add designed mutations (logTime, recordEntry) with names that mean something.',
    'Returning private mutable collections/objects from getters — you\'ve mailed every caller a map to your chest. Copies or unmodifiable views at the border.',
    'Static mutable state as a convenience — it\'s a global variable with better PR: shared across threads (Part 5 corruption), shared across tests (Part 7 flakiness), invisible in method signatures. static final immutable, or instance state, or a consciously justified exception.',
    'Skipping toString/@Override "for now" — then debugging LogEntry@1b6d3586 at midnight. Two minutes per class, paid back on the first println. And @Override\'s typo-catching becomes genuinely load-bearing next lesson.'
  ],
  interview: [
    {
      q: 'What is encapsulation, and what does it actually buy you — beyond "hiding data"?',
      a: 'Encapsulation is bundling state with the behavior that governs it, and restricting state access to that behavior — concretely: private fields, public methods that mediate every read and write. What it buys, in engineering terms rather than slogans: (1) enforceable invariants — "balance never negative", "title never blank" become facts checked at the only doors (constructors and mutators) rather than hopes scattered across every caller; (2) a bounded blast radius for debugging — when state is wrong, the code that could have wronged it is the class itself, a one-file suspect list instead of the whole program; (3) freedom to evolve — representation can change (int cents → BigDecimal, field → computed value, plain field → observable JavaFX property) without touching callers, because the method signatures are the contract, not the storage; (4) a point of interception for cross-cutting needs — validation, logging, lazy loading, change notification all slot into accessors without caller cooperation. The honest caveat that distinguishes a thoughtful answer: reflexively generating a getter AND setter for every field recreates public fields with extra steps — real encapsulation means most fields have no setter, mutations are named business operations, and getters never leak references to mutable internals.'
    },
    {
      q: 'Explain static vs instance members, with the rules about what can access what.',
      a: 'Instance members (fields, methods) belong to each object: every new allocates fresh copies of instance fields, and instance methods execute with a this reference to the specific receiver. Static members belong to the class itself: exactly one copy of a static field exists regardless of instance count (even zero), and static methods are invoked on the class with NO this. Access matrix, derivable from "is there a this?": instance methods can use everything — their own fields, other instance members via this, and all static members (a shared thing is visible to everyone). Static methods can use static members and their parameters, but CANNOT directly touch instance members — no this means no particular object to read from; they must be handed an instance explicitly. That asymmetry is the complete explanation of "non-static variable cannot be referenced from static context", and why main — static because the JVM calls it before any objects exist — always begins by constructing the objects it needs. Appropriate static uses: constants (static final), pure utilities (Math.max), factory methods (List.of). The flagged risk: static MUTABLE state is a disguised global — it creates test-order dependence (flaky tests), thread-safety hazards, and hidden coupling, which is why dependency injection (Part 9\'s Spring) exists to provide "shared" without "global".'
    },
    {
      q: 'What does a constructor guarantee, and what are the rules around default constructors and constructor chaining?',
      a: 'A constructor\'s contract: between new and the reference being returned, the constructor runs exactly once, so if every constructor validates its inputs and establishes the class\'s invariants, then NO reachable object exists in an invalid state — "make illegal states unrepresentable" in its most basic form. Mechanics an interviewer probes: if a class declares zero constructors, the compiler synthesizes a public no-arg default constructor (fields keep their zero/null defaults); declaring ANY constructor suppresses it — the classic surprise being new Foo() breaking the moment someone adds Foo(String). Overloaded constructors should chain to one canonical constructor via this(...) — mandatory first statement — so validation and assignment exist exactly once; the alternative (copy-pasted logic) drifts. Every constructor also begins with an implicit super() call (explicit if the parent lacks a no-arg constructor), guaranteeing parent state initializes before child state — the full ordering being: allocation and zeroing, field initializers, constructor body, outward through the chain. Two professional footnotes: persistence/serialization frameworks often require a no-arg constructor (JPA accepts protected) and construct objects around your validation — pushing validation to declarative constraints at system borders; and calling overridable methods from constructors is a known trap, since a subclass override can execute before the subclass\'s fields are initialized.'
    },
    {
      q: 'Design question: a Counter class holds static int count with static void increment(). What problems will this design hit as the codebase grows?',
      a: 'Four, in rising order of pain. (1) Hidden coupling: every caller shares one invisible channel of state — data flow stops being traceable through parameters and returns, so understanding any caller requires knowing all of them. (2) Testability and test flakiness: tests share the static count across the JVM; each test\'s result depends on which tests ran before it, so the suite passes alone and fails together (or vice versa) — a canonical mechanism behind flaky tests, and fixing it requires reset hooks that are themselves error-prone. (3) Concurrency: count++ is a read-modify-write, not atomic; two threads incrementing concurrently lose updates silently — no exception, just wrong totals — and the fix (synchronization or AtomicInteger, Part 5) has to be retrofitted onto every access point. (4) Multiplicity is foreclosed: the design hard-codes "there is exactly one counter in the universe" — the first requirement for per-project or per-user counts forces a rewrite of every call site. The redesign: make Counter an ordinary class with instance state, create the number of instances the domain actually needs, and share deliberately by passing the instance (or letting a DI container manage one) — same convenience, but the sharing is visible in constructors, swappable in tests, protectable for concurrency, and multipliable on demand. Static mutable state is the open treasure chest on deck; instances with injection are Nami\'s ledger.'
    }
  ]
};
