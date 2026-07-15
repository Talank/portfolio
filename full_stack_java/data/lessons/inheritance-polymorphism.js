window.LESSONS = window.LESSONS || {};
window.LESSONS['inheritance-polymorphism'] = {
  id: 'inheritance-polymorphism',
  title: 'Inheritance & Polymorphism: extends, super, Dynamic Dispatch, abstract',
  category: 'Part 1 — Core Java',
  timeMin: 50,
  summary: 'The mechanism that makes object-oriented code actually flexible: subclasses extend a parent, override its methods, and — the load-bearing trick — the JVM picks which override to run from the ACTUAL object at runtime, not from the variable\'s declared type. Plus super, abstract classes, final, instanceof pattern matching, why constructors run parent-first, and the design judgment interviews probe hardest: when inheritance is the wrong tool and composition wins.',
  goals: [
    'Write a class hierarchy with extends, super(...), and @Override, and trace exactly which method runs for any call',
    'Explain dynamic dispatch — declared type decides WHAT you may call; runtime type decides WHOSE version runs — and connect it back to overloading\'s compile-time resolution',
    'Use abstract classes and methods to define a template that cannot be instantiated, and final to forbid extension or overriding',
    'Upcast implicitly, downcast explicitly with pattern-matching instanceof, and know why downcasts are a smell in loops',
    'Argue composition-over-inheritance concretely: when is-a is real, when it\'s wishful, and what code-sharing without subclassing looks like'
  ],
  concept: [
    {
      h: 'extends: an is-a relationship with inherited machinery',
      p: [
        '<code>class ReviewEntry extends LogEntry</code> declares: every ReviewEntry <b>is a</b> LogEntry — it inherits the parent\'s fields and methods, adds its own (say, <code>venue</code>, <code>verdict</code>), and may <b>override</b> inherited behavior. Java is single-inheritance for classes (one parent each; multiple inheritance of implementation is where C++ keeps its diamond-problem scars — Java\'s answer for multiple TYPES is interfaces, next lesson). Every class without an explicit parent extends <code>Object</code>, the root that gives everything <code>toString</code>, <code>equals</code>, <code>hashCode</code> — which is why you could <code>@Override toString</code> last lesson without declaring a parent.',
        'Construction runs <b>parent-first</b>: every constructor begins with a call up the chain — implicitly <code>super()</code> if you write nothing, or an explicit <code>super(args)</code> as the mandatory first statement when the parent has no no-arg constructor. The logic is invariant-flow: a child\'s code may rely on parent state, so the parent\'s constructor (and its validation!) must finish before the child\'s begins. <code>super.method()</code> similarly lets an override extend rather than replace the parent\'s version — "do what the parent does, plus…".'
      ]
    },
    {
      h: 'Dynamic dispatch: the runtime asks the OBJECT, not the variable',
      p: [
        'Here is the sentence to tattoo somewhere: <b>the declared (static) type of a variable decides what you\'re ALLOWED to call; the runtime class of the object decides WHICH implementation runs.</b>',
        '<div class="math">LogEntry e = new ReviewEntry(...);&nbsp;&nbsp;e.summary();&nbsp;&nbsp;→ compiler checks LogEntry HAS summary(); JVM runs ReviewEntry\'s override<span class="mnote">the variable is a LogEntry-shaped window; the object behind it is fully a ReviewEntry, and method calls reach the real object.</span></div>',
        'Mechanically: every object\'s header records its actual class (the fact you met in the <code>new</code> walkthrough last lesson); each class carries a <b>vtable</b> — a method table where overrides replace parent entries — and a virtual call looks up the method IN THE OBJECT\'S OWN TABLE at runtime. All non-static, non-final, non-private Java methods dispatch this way by default (C++ makes you opt in with <code>virtual</code>; Java\'s JIT — Part 0\'s friend — de-virtualizes hot calls it can prove monomorphic, so you get flexibility without paying for it where it doesn\'t vary).',
        'Now the payoff, and the contrast you must keep straight in interviews: <b>overloading</b> is resolved at COMPILE time from the arguments\' static types (two lessons ago); <b>overriding</b> is resolved at RUNTIME from the receiver object. The two compose: the compiler picks the signature, the JVM picks the implementation. Polymorphic code — <code>for (LogEntry e : entries) total += e.effortScore();</code> — processes a mixed list where every element answers with its own override, and adding a brand-new entry type next month requires touching ZERO lines of that loop. That loop-untouched property is the Open-Closed Principle, and it\'s the entire practical argument for polymorphism.'
      ]
    },
    {
      h: 'abstract: a template with mandatory blanks; final: the opposite dial',
      p: [
        'An <b>abstract class</b> cannot be instantiated — it exists to be extended: <code>abstract class LogEntry</code> with <code>abstract int effortScore();</code> declares "every concrete entry type MUST define its effort formula" and provides shared machinery (title, timestamps, validation) around the blank. Concrete subclasses either implement every inherited abstract method or stay abstract themselves. This is the <b>template method</b> shape: the parent fixes the skeleton (<code>summary()</code> calls <code>effortScore()</code>), children fill the varying step — Sanji fixes the course structure, each station cooks its own dish.',
        '<b>final</b> turns the dial the other way: a <code>final</code> method cannot be overridden (protect an invariant-bearing algorithm from well-meaning children), a <code>final</code> class cannot be extended at all (<code>String</code> is final — Part 1\'s closing lesson explains how immutability plus finality underpin the String pool and hash-key safety). Design stance worth quoting: "design for inheritance or prohibit it" — a class that\'s neither documented-for-extension nor final is an accident waiting for a subclass.',
        'Casting completes the toolkit. <b>Upcasting</b> (child → parent view) is implicit and always safe: <code>LogEntry e = review;</code>. <b>Downcasting</b> (parent view → child) needs an explicit cast and is checked at runtime — wrong guess throws <code>ClassCastException</code>. Modern Java fuses check-and-cast: <code>if (e instanceof ReviewEntry r) { r.getVenue(); }</code> — pattern-matching instanceof, binding <code>r</code> only where the test passed. Taste rule: an <code>instanceof</code> ladder over your OWN hierarchy usually means a method is missing from the parent — push the behavior INTO the hierarchy and let dispatch do the branching (the exception, sealed-hierarchy switches, arrives in Part 4 with compiler-checked exhaustiveness).'
      ]
    },
    {
      h: 'The judgment call: inheritance vs composition',
      p: [
        'Inheritance is Java\'s most over-used feature, and "composition over inheritance" is the corrective the industry converged on. Inherit when the is-a claim is genuinely, permanently true AND you want polymorphic substitution (a ReviewEntry is a LogEntry, forever, and code processing LogEntries should transparently process reviews). Compose — hold the other object in a field and delegate — when you want to REUSE machinery without BECOMING the thing: LogPose\'s <code>SearchService</code> <b>has a</b> <code>Tokenizer</code>; it is not one. Wishful is-a is how you get <code>class Stack extends Vector</code> (a real JDK fossil: every Stack publicly inherits <code>insertElementAt</code>, letting callers corrupt the middle of the "stack") — Stack should have HAD a list, privately.',
        'The deeper principle (Liskov substitution, the L in SOLID): a subclass must be usable ANYWHERE the parent is expected, honoring every promise the parent\'s contract makes — not just matching signatures. The canonical trap: Square extends Rectangle compiles beautifully and breaks the promise "setWidth leaves height unchanged". When substitution would lie, don\'t inherit — compose, or redesign the hierarchy around what genuinely varies. Interviews probe this with "when would you NOT use inheritance?", and a concrete Stack-extends-Vector or Square/Rectangle answer beats any recitation of definitions.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'One order, eleven answers: Luffy\'s polymorphic crew',
      text: 'When marines swarm the deck, Luffy doesn\'t issue eleven role-specific commands — he yells exactly one word: "FIGHT!" And here\'s the machinery hiding in that moment: Luffy is addressing his crew through the CrewMember view — he neither knows nor cares, mid-chaos, which specialist each silhouette is (LogEntry e = …; the declared type). But the order lands on the ACTUAL person: Zoro\'s body executes fight() as three-sword style, Nami\'s as weather tactics, Sanji\'s as kicks (never the hands — a class invariant if there ever was one), Usopp\'s as sniping from somewhere safer (dynamic dispatch: the object\'s own override runs, whatever window you viewed it through). The genius of the design shows when Jinbe joins two arcs later: a brand-new subclass with his own fight() — and Luffy\'s battle cry doesn\'t change by a syllable. One word still works; the new member just answers it his own way (Open-Closed: the polymorphic call site never gets edited). Now, what IS a "crew member" with no specialty? Nothing — nobody is a generic crew member; the role only exists as a template that concrete people fill (abstract class: cannot be instantiated, exists to be extended — and every member MUST fill in the fight() blank; a recruit with no answer to "what do you do in a fight?" doesn\'t board). Some things the template refuses to leave open: the Jolly Roger and the code "no crew member abandons another" are final — Zoro doesn\'t get to override loyalty. And joining runs parent-first: before Chopper could be Chopper-the-doctor, he first had to BECOME A CREW MEMBER — accepted by the captain, bound by the code (super(...) runs before the child constructor; parent invariants exist before child features). One warning tale rounds it out: Kuro\'s crew once tried wishful inheritance — declaring a cabin boy "is-a fighter" because it was convenient for the org chart. He wasn\'t; every place that substituted him where a fighter was promised, the promise broke (Liskov: if substitution lies, the hierarchy lies). Usopp\'s actual power came later — not from EXTENDING Sniper, but from HAVING a slingshot and five thousand hours of practice: composition, a skill held and honed, not an ancestry claimed.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: '"What do you do?" — four scientists, four overrides',
      text: 'Put Sheldon, Leonard, Raj, and Howard at one table and ask a single question — "how\'s work?" — and you get the cleanest dynamic dispatch demo on television. Same signature, four implementations: Sheldon returns a lecture on string theory\'s inevitability, Leonard describes a laser experiment, Raj narrates the day\'s telescope data, and Howard — well, Howard\'s override comes up in a moment. The university addresses them all through the Scientist view (one paycheck system, one question), but the answer that runs is always the actual object\'s (the caller\'s declared type never changed WHOSE story got told). Sheldon, naturally, has opinions about the class hierarchy itself: in his cosmology, Scientist is abstract — nobody is a GENERIC scientist; you must implement doResearch() with an actual field — and his mental javadoc ranks the subclasses (theoretical physics at the vtable\'s summit, geology "not a real science" — Sheldon denying another class admission to the hierarchy entirely). His treatment of Howard is a running overload-vs-override seminar: "Mr." Wolowitz, the engineer among doctors. But watch what the show actually demonstrates: Howard\'s value never came from claiming the Scientist ancestry — it came from COMPOSITION. Howard HAS a toolkit: he builds space toilets, robot arms, the Mars-rover rig that got him to actual space — a portfolio of held, honed capabilities that no inheritance claim could substitute for (and which, note carefully, made him the only one of the four who\'s BEEN to space — composition shipping features while the hierarchy argues about purity). The final keyword also lives in 4A: Sheldon\'s spot is final — non-overridable, non-negotiable, protected from every subclass, guest, and girlfriend who\'s ever tried ("in an ever-changing world, a single point of consistency" — he is literally describing why you seal an invariant). And when Sheldon needs a substitute for himself at a lecture, he learns Liskov the hard way: sending someone who merely SIGNATURE-matches (can stand at a podium, can say words) but breaks the behavioral contract (correctness, condescension calibrated to Sheldon standards) — the audience\'s expectations, set by the parent, get violated by the substitute. If the substitution lies, don\'t declare it.'
    },
    why: 'One shout — "FIGHT!" — answered eleven different ways is dynamic dispatch: the order goes to the crew-member VIEW, the response comes from the ACTUAL member, and new members (Jinbe) plug in without the battle cry changing (Open-Closed). Nobody is a generic crew member: abstract class, mandatory fight() blank. The Jolly Roger is final. Joining is parent-first: super() before self. Kuro\'s cabin-boy-as-fighter is Liskov violated — and Usopp\'s slingshot (plus Howard\'s space toilet) is composition beating ancestry: capability held and honed, not claimed.'
  },
  storyAnim: {
    title: '"FIGHT!" — one call site, dispatched to whoever\'s actually there',
    h: 290,
    props: [
      { id: 'order', emoji: '📣', label: 'Luffy: fight() — one call, CrewMember view', x: 12, y: 12 },
      { id: 'zoro', emoji: '⚔️', label: 'Zoro.fight(): three swords', x: 40, y: 12 },
      { id: 'nami', emoji: '🌩️', label: 'Nami.fight(): weather', x: 64, y: 12 },
      { id: 'sanji', emoji: '🦵', label: 'Sanji.fight(): kicks only (invariant)', x: 87, y: 12 },
      { id: 'template', emoji: '📋', label: 'abstract CrewMember — fight() is a blank', x: 18, y: 52 },
      { id: 'jinbe', emoji: '🐋', label: 'Jinbe joins: new subclass', x: 48, y: 52 },
      { id: 'unchanged', emoji: '🔒', label: 'battle cry: unchanged (Open-Closed)', x: 78, y: 52 },
      { id: 'kuro', emoji: '🎭', label: 'cabin boy declared "is-a fighter"', x: 28, y: 86 },
      { id: 'slingshot', emoji: '🎯', label: 'Usopp HAS a slingshot (composition)', x: 68, y: 86 }
    ],
    actors: [
      { id: 'luffy', emoji: '👒', label: 'Luffy', x: 12, y: 32 }
    ],
    steps: [
      { c: 'Marines board. Luffy yells ONE word through the CrewMember view — he doesn\'t know or care which specialist each silhouette is.', p: { order: 'lit' } },
      { c: 'The call lands on the ACTUAL objects: Zoro\'s override runs three-sword style…', p: { zoro: 'good' } },
      { c: '…Nami\'s runs weather tactics, Sanji\'s runs kicks-only (his class invariant, protected inside his own implementation). Same signature, each object\'s own table consulted.', p: { nami: 'good', sanji: 'good' } },
      { c: 'Why does every member HAVE a fight()? The role is an abstract template: nobody is a generic crew member, and the fight() blank is mandatory for anyone who boards.', p: { template: 'lit' } },
      { c: 'Two arcs later, Jinbe joins — a brand-new subclass with his own fight().', p: { jinbe: 'good' } },
      { c: 'And Luffy\'s battle cry changes by ZERO syllables. The polymorphic call site is closed to modification, open to new members: the Open-Closed Principle, on a pirate ship.', p: { unchanged: 'good' } },
      { c: 'The cautionary tale: Kuro declares a cabin boy "is-a fighter" for org-chart convenience. Everywhere a fighter was promised and the boy substituted, the promise broke — Liskov violated, the hierarchy lied.', p: { kuro: 'bad' } },
      { c: 'Usopp\'s real power was never ancestry — he HAS a slingshot and five thousand hours (composition: capability held in a field, delegated to, honed). Reuse without becoming. Both tools; judgment decides.', p: { slingshot: 'good' }, a: { luffy: [55, 32] } }
    ]
  },
  conceptFlow: {
    title: 'One virtual call, traced: e.effortScore() from source to the right override',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Compile time',
        nodes: [
          { id: 'declared', text: 'LogEntry e = new ReviewEntry(...)\ndeclared type: LogEntry' },
          { id: 'check', text: 'compiler check\ndoes LogEntry declare effortScore()?' }
        ]
      },
      {
        label: 'Runtime',
        nodes: [
          { id: 'header', text: 'object header\nrecords actual class: ReviewEntry' },
          { id: 'vtable', text: 'ReviewEntry\'s method table\noverride replaced the parent entry' },
          { id: 'run', text: 'ReviewEntry.effortScore() runs\nthe object answers as itself' }
        ]
      },
      {
        label: 'Construction order',
        nodes: [
          { id: 'superc', text: 'super(...) first\nparent validates before child exists' },
          { id: 'childc', text: 'child constructor body\nchild state completes' }
        ]
      },
      {
        label: 'The dials',
        nodes: [
          { id: 'abstract', text: 'abstract\nmust be overridden; class can\'t instantiate' },
          { id: 'final', text: 'final\ncannot be overridden / extended' }
        ]
      }
    ],
    steps: [
      { active: ['declared'], note: 'The variable is a LogEntry-shaped window. Upcasting a ReviewEntry into it is implicit and safe — every ReviewEntry IS a LogEntry.' },
      { active: ['check'], note: 'The compiler only consults the DECLARED type: LogEntry must declare (or inherit) effortScore(), or this line doesn\'t compile. What you may call is settled here; whose version runs is not.' },
      { active: ['header'], note: 'At runtime, the object knows what it is — its header records ReviewEntry (the same fact enabling instanceof, getClass(), and the GC). The window never changed the object.' },
      { active: ['vtable'], note: 'Each class has a method table; overriding replaced LogEntry\'s effortScore entry with ReviewEntry\'s. Virtual dispatch = one indexed lookup in the receiver\'s own table. (The JIT de-virtualizes hot call sites it proves monomorphic — flexibility with the cost optimized away.)' },
      { active: ['run'], note: 'ReviewEntry\'s implementation executes. Same line of source, different behavior per actual object — the mixed-list loop processes every entry type correctly without an if in sight.' },
      { active: ['superc'], note: 'Construction is parent-first: super(...) — implicit or the mandatory first statement — runs the parent\'s validation before any child code. Child logic may rely on parent invariants already holding.' },
      { active: ['childc'], note: 'Then the child\'s fields initialize and its constructor body runs. (This ordering is why calling overridable methods from a constructor is a trap: the child\'s override can run before the child\'s fields exist.)' },
      { active: ['abstract'], note: 'abstract = mandatory blank: no instantiation, subclasses must implement. The parent fixes the skeleton, children fill the varying step — the template-method shape.' },
      { active: ['final'], note: 'final = the opposite dial: seal a method\'s algorithm or a whole class (String!) against extension. "Design for inheritance or prohibit it" — deliberate openness or deliberate closure, never accidental.' }
    ]
  },
  tech: [
    {
      q: 'Trace the exact difference between how the compiler handles e.effortScore() and how the JVM does — and where overloading vs overriding slot in.',
      a: 'Compile time: the compiler sees only the declared type of e. It verifies the type declares or inherits an applicable effortScore(), performs OVERLOAD resolution if several same-named signatures exist (choosing by argument static types — the phases from the control-flow lesson), and emits an invokevirtual instruction naming the chosen SIGNATURE against the declared type. Note what it did NOT do: pick an implementation. Runtime: invokevirtual reads the receiver object\'s header to find its actual class, indexes into that class\'s method table — where any OVERRIDE has replaced the inherited entry — and calls what it finds. So the division of labor is exact: compiler chooses the signature (overloading, static types, compile time); JVM chooses the implementation (overriding, actual object, runtime). This also cleanly explains the edge cases: static methods aren\'t dispatched on objects (invokestatic — resolved from the declared type; "overriding" a static is really hiding, a classic trick question), private methods use invokespecial (no table lookup — they can\'t be overridden), and fields are NEVER dispatched dynamically — a field access compiles against the declared type, so a subclass declaring a same-named field hides rather than overrides the parent\'s, which is why shadowing fields across a hierarchy is a lint error in any sane codebase.'
    },
    {
      q: 'Why exactly is calling an overridable method from a constructor dangerous? Walk the failure.',
      a: 'Combine two rules you now know and the bug writes itself. Rule 1: construction is parent-first — the parent constructor completes before the child\'s field initializers and constructor body run. Rule 2: dispatch is dynamic — a method call on this inside the parent constructor consults the ACTUAL object\'s table, and the actual object is already the child. Failure walk: Parent\'s constructor calls this.describe(); the child overrides describe() to use its field String label = "review"; — but child field initializers haven\'t run yet (we\'re still inside super()), so the override executes with label == null and either NPEs immediately or, worse, silently bakes "null" into the parent\'s state, detonating later at maximum distance from the cause. The fixes, in preference order: constructors call only private or final methods (nothing dispatchable); do child-dependent setup in the child\'s own constructor; or use a static factory that fully constructs, then initializes (build the object, then call the virtual method). This is also one more argument for final classes on things never designed for extension: a final class\'s constructor can call its own public methods safely, because no override can interpose. Effective Java\'s phrasing is worth quoting in interviews: "constructors must not invoke overridable methods."'
    },
    {
      q: 'When SHOULD I still use an abstract class now that interfaces (next lesson) have default methods?',
      a: 'The honest modern division: an abstract class is for sharing STATE and a construction protocol; an interface is for sharing a CONTRACT (and, since default methods, some stateless behavior). Choose abstract class when: subclasses need inherited FIELDS (an interface cannot hold per-instance state — LogEntry\'s title/createdAt live once, in the abstract parent, validated once in its constructor); you want a constructor to enforce invariants for the whole family; you\'re building a template method whose steps access shared protected state; or you want to evolve a family\'s internals without breaking implementers (adding a field to an abstract class is invisible to children; adding an abstract method to either construct breaks them equally). Choose interface when: the capability cuts across unrelated hierarchies (Comparable spans String, LocalDate, and your Project), a class needs several capabilities (single inheritance forbids two abstract parents, but implements takes a list), or you\'re defining a seam for testing/substitution (Part 7 mocks interfaces gladly). The pragmatic combo you\'ll see across the JDK and Spring: an interface for the contract PLUS an abstract skeleton class for convenience (Collection + AbstractCollection) — implementers choose the interface for freedom or the skeleton for a head start. And Part 4\'s sealed hierarchies add the missing piece: abstract parent, fixed set of permitted children, compiler-checked exhaustive switches over them.'
    },
    {
      q: 'Give me the real, concrete case against inheritance for code reuse — the Stack-extends-Vector autopsy.',
      a: 'java.util.Stack extends Vector is in the JDK forever (compatibility) and is a complete autopsy kit. What the authors wanted: reuse Vector\'s growable-array machinery. What extends actually bought them: Stack IS-A Vector, publicly, forever — so every Vector method is part of Stack\'s API. Callers can insertElementAt(x, 2) — write into the MIDDLE of a "stack" — or removeElementAt(0), destroying the LIFO invariant the class exists to provide; no encapsulation can fix it, because the leak is in the type relationship itself, and Liskov substitution cuts the other way: code expecting a Vector can be handed a Stack and legitimately scramble it. Compare composition: class Stack { private ArrayDeque<E> items; } exposes push/pop/peek and NOTHING else — the reused machinery is an implementation detail, replaceable (swap the deque for an array) without any caller noticing, and the invariant is enforceable because Part 1\'s encapsulation rules apply. The generalizable tests you can quote: (1) is-a must hold for EVERY parent behavior, not just the convenient ones; (2) would you be comfortable with callers using the child THROUGH the parent\'s full API? (3) does the child need to forbid or weaken anything the parent promises? A no, no, or yes respectively means compose. Modern JDK agrees: the recommended stack today IS ArrayDeque used via composition or directly — Stack survives as a warning label.'
    }
  ],
  code: {
    title: 'The LogEntry hierarchy — LogPose\'s domain model learns to dispatch',
    intro: 'Last lesson\'s LogEntry becomes an abstract parent with three concrete children. One polymorphic loop totals effort across a mixed day — and adding a fourth entry type would leave that loop untouched.',
    code: `abstract class LogEntry {
    private final String title;                 // final field: assigned once, in the constructor

    protected LogEntry(String title) {          // protected: only subclasses construct through here
        if (title == null || title.isBlank())
            throw new IllegalArgumentException("title must not be blank");
        this.title = title;
    }

    public String getTitle() { return title; }

    // The mandatory blank: every concrete entry type defines its own effort formula.
    public abstract int effortScore();

    // Template method: fixed skeleton, calls the blank. final = children can't break the format.
    public final String summary() {
        return "[" + effortScore() + " effort] " + title;
    }
}

class IdeaEntry extends LogEntry {
    private final boolean actionable;

    IdeaEntry(String title, boolean actionable) {
        super(title);                            // parent-first: validation runs before child state
        this.actionable = actionable;
    }

    @Override
    public int effortScore() { return actionable ? 3 : 1; }
}

class ReviewEntry extends LogEntry {
    private final int pages;

    ReviewEntry(String title, int pages) {
        super(title);
        this.pages = pages;
    }

    @Override
    public int effortScore() { return Math.max(2, pages / 4); }
}

class ExperimentEntry extends LogEntry {
    private final int runs;
    private final boolean flakyObserved;         // of course it's here

    ExperimentEntry(String title, int runs, boolean flakyObserved) {
        super(title);
        this.runs = runs;
        this.flakyObserved = flakyObserved;
    }

    @Override
    public int effortScore() { return runs * (flakyObserved ? 3 : 1); }  // flakiness taxes everything

    public boolean isFlakyObserved() { return flakyObserved; }
}

public class Day {
    public static void main(String[] args) {
        LogEntry[] today = {                          // mixed types behind one declared type
            new IdeaEntry("Embedding cache for repeated queries", true),
            new ReviewEntry("Flaky-test detection paper", 12),
            new ExperimentEntry("Rerun ablation, seed 42", 5, true),
        };

        int total = 0;
        for (LogEntry e : today) {                    // THE polymorphic loop
            System.out.println(e.summary());          // final skeleton + each object's own override
            total += e.effortScore();                 // dispatch: 3, 3, 15
        }
        System.out.println("total effort: " + total); // 21

        // Downcast only at a genuine boundary, with pattern-matching instanceof:
        for (LogEntry e : today) {
            if (e instanceof ExperimentEntry ex && ex.isFlakyObserved()) {
                System.out.println("flaky alert: " + ex.getTitle());
            }
        }

        // new LogEntry("nope")  → compile error: LogEntry is abstract
    }
}`,
    notes: [
      'summary() is a template method: final so the format is uniform, calling the abstract blank so each type contributes its formula. Parent owns the skeleton; children own the variation.',
      'Adding a MentoringEntry tomorrow = one new class. The totaling loop, the summary printing — zero edits. That\'s the Open-Closed Principle as a maintenance property, not a slogan.',
      'The instanceof block is legitimate: flaky-alerting is genuinely about ONE subtype at a boundary. If instead every entry type needed custom alerting, the smell rule applies — push an alert() method into the hierarchy and let dispatch branch.'
    ]
  },
  lab: {
    title: 'Extend the hierarchy without touching the loop',
    prompt: 'Prove the Open-Closed property with your own hands. Write (1) <code>MentoringEntry extends LogEntry</code> — fields <code>String mentee</code>, <code>int sessions</code>; constructor chains <code>super(title)</code> then assigns; <code>@Override int effortScore()</code> returning <code>sessions * 2</code>; (2) a class <code>Report</code> with <code>static int totalEffort(LogEntry[] entries)</code> — one enhanced-for loop, calling <code>effortScore()</code> polymorphically, with a null guard returning 0; (3) in a comment, answer: when <code>MentoringEntry</code> is added to a mixed array fed to <code>totalEffort</code>, how many lines of <code>Report</code> change? Use the abstract <code>LogEntry</code> from the worked example (assume it\'s in scope).',
    starter: `// Assume abstract class LogEntry (title, abstract effortScore(), final summary()) is in scope.

class MentoringEntry extends LogEntry {
    // fields: String mentee, int sessions

    // constructor: MUST chain super(title) first, then assign fields

    // @Override effortScore(): sessions * 2
}

class Report {
    static int totalEffort(LogEntry[] entries) {
        // null guard → 0, then one enhanced-for accumulating effortScore()
    }
}

// Q: adding MentoringEntry to the mix — how many lines of Report change?
// ANSWER:`,
    checks: [
      { re: 'class\\s+MentoringEntry\\s+extends\\s+LogEntry', must: true, hint: 'Declare MentoringEntry extends LogEntry.', pass: 'extends LogEntry ✓' },
      { re: 'super\\s*\\(\\s*title\\s*\\)', must: true, hint: 'The constructor must call super(title) as its first statement — parent validation runs first.', pass: 'super(title) chained ✓' },
      { re: '@Override', must: true, hint: 'Mark effortScore with @Override — the compiler then verifies you actually matched the parent signature.', pass: '@Override present ✓' },
      { re: 'int\\s+effortScore\\s*\\(\\s*\\)', must: true, hint: 'Implement public int effortScore() — it\'s the mandatory abstract blank.', pass: 'effortScore implemented ✓' },
      { re: 'sessions\\s*\\*\\s*2', must: true, hint: 'The mentoring formula is sessions * 2.', pass: 'formula ✓' },
      { re: 'static\\s+int\\s+totalEffort\\s*\\(\\s*LogEntry\\s*\\[\\]', must: true, hint: 'Report.totalEffort must accept LogEntry[] — the PARENT type, so any mix of children flows in.', pass: 'parent-typed parameter ✓' },
      { re: 'for\\s*\\(\\s*(LogEntry|var)\\s+\\w+\\s*:', must: true, hint: 'Use an enhanced-for over the entries.', pass: 'polymorphic loop ✓' },
      { re: 'instanceof', must: false, hint: 'No instanceof needed anywhere — dispatch does the branching. If you typed it, you\'re fighting the design.', pass: 'no instanceof — dispatch trusted ✓' },
      { re: 'ANSWER\\s*:\\s*(0|zero|none)', flags: 'i', must: true, hint: 'Count again: the loop calls effortScore() through the parent type — a new subclass changes ZERO lines of Report.', pass: 'zero lines — Open-Closed proven ✓' }
    ],
    run: 'put LogEntry (from the worked example), your two classes, and a small main into one file <code>Day2.java</code>; <code>javac Day2.java && java Day2</code> with a mixed array including a MentoringEntry. Watch totalEffort handle a type that didn\'t exist when you wrote it.',
    solution: `class MentoringEntry extends LogEntry {
    private final String mentee;
    private final int sessions;

    MentoringEntry(String title, String mentee, int sessions) {
        super(title);
        this.mentee = mentee;
        this.sessions = sessions;
    }

    @Override
    public int effortScore() {
        return sessions * 2;
    }
}

class Report {
    static int totalEffort(LogEntry[] entries) {
        if (entries == null) return 0;
        int total = 0;
        for (LogEntry e : entries) {
            total += e.effortScore();      // dispatch picks each object's own formula
        }
        return total;
    }
}

// ANSWER: 0 — totalEffort is written against the parent type and never names a child;
// new subclasses plug into the existing call site untouched. Open-Closed, demonstrated.`,
    notes: [
      'The zero-lines answer is the entire business case for polymorphism: features get ADDED as new classes, not WOVEN INTO old conditionals. Compare the alternative: a switch on entry-kind strings inside totalEffort, edited for every new type, forever.',
      'Note what made it work: the parameter type is the abstract parent, and the only methods called are ones the parent declares. Discipline at the signature buys freedom at the call site.',
      'In Part 4 you\'ll meet the OTHER good answer: a sealed hierarchy with an exhaustive switch — trading open extension for compiler-verified case coverage. Two tools, opposite trade, both deliberate.'
    ]
  },
  quiz: [
    {
      q: 'LogEntry e = new ReviewEntry("paper", 12); e.effortScore(); — which implementation runs, and what decided it?',
      options: ['ReviewEntry\'s — the JVM dispatches on the object\'s actual class at runtime; the declared type only determined that the call compiles', 'LogEntry\'s — the variable\'s type decides the implementation', 'Both run, parent first', 'It won\'t compile: e must be declared ReviewEntry'],
      correct: 0,
      explain: 'Declared type = what you may call (compile-time check); actual object = whose version runs (runtime dispatch via the object\'s method table). Luffy\'s shout, answered by whoever\'s actually standing there.'
    },
    {
      q: 'Why must super(args) be the FIRST statement in a subclass constructor?',
      options: ['Construction is parent-first: the parent\'s validation and field setup must complete before child code runs, because child logic may rely on parent invariants already holding', 'It\'s an arbitrary syntax rule with no rationale', 'Because super() is faster when called early', 'So the child can override the parent\'s constructor'],
      correct: 0,
      explain: 'Chopper becomes a crew member before he\'s the crew\'s doctor. Invariants flow downward: a child that ran first could observe (or corrupt) a parent that doesn\'t exist yet. (Constructors are never overridden, ruling out that distractor entirely.)'
    },
    {
      q: 'What does abstract give you that an ordinary parent class doesn\'t?',
      options: ['It forbids instantiation of the incomplete concept AND lets you declare mandatory blanks (abstract methods) every concrete subclass must fill — a compiler-enforced template', 'Abstract classes run faster because they skip construction', 'Abstract methods are private by default', 'Nothing — abstract is documentation only'],
      correct: 0,
      explain: 'Nobody is a generic crew member: new LogEntry(...) becomes a compile error, and forgetting effortScore() in a subclass is one too. The skeleton is shared; the blanks are enforced.'
    },
    {
      q: 'Your code has if (e instanceof IdeaEntry) {...} else if (e instanceof ReviewEntry) {...} else if... over your own hierarchy, in three different files. Diagnosis?',
      options: ['A missing polymorphic method — push the varying behavior into the hierarchy as an override and let dispatch branch; the ladders will drift out of sync the first time a type is added', 'Perfectly idiomatic Java — instanceof exists to be used', 'A performance optimization over virtual calls', 'The only way to handle mixed collections'],
      correct: 0,
      explain: 'Three parallel ladders = three places to forget MentoringEntry next month, with no compiler help. One override per class = dispatch branches for you. (The principled exception — sealed types + exhaustive switch, where the compiler DOES check completeness — arrives in Part 4.)'
    },
    {
      q: 'Stack extends Vector is infamous. What\'s the core lesson?',
      options: ['Inheritance for mere code reuse leaks the parent\'s whole API into the child\'s contract — callers can insertElementAt into the middle of a "stack", destroying its invariant; composition (a private deque) reuses the machinery without the leak', 'Vector was too slow to extend', 'Stacks should always be implemented with linked lists', 'The problem was only the missing final keyword'],
      correct: 0,
      explain: 'is-a must hold for EVERY parent behavior, not the convenient subset. Stack wanted Vector\'s storage, got Vector\'s API, and lost its own invariant. Usopp doesn\'t extend Sniper; he has a slingshot.'
    }
  ],
  testFlow: {
    title: 'Test yourself: dispatch under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'Parent declares void greet() { System.out.print("hi"); }. Child overrides it. Code runs: Parent p = new Child(); p.greet(); — but ALSO: Parent q = new Parent(); q.greet();. Output of the pair?',
        choices: [
          { text: 'Child\'s greeting, then Parent\'s — each call dispatches on the ACTUAL object behind the variable, and the two variables hold different objects', to: 'q1_right' },
          { text: 'Parent\'s twice — both variables are declared Parent', to: 'q1_wrong_declared' },
          { text: 'Child\'s twice — once a child exists, its override wins everywhere', to: 'q1_wrong_global' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Dispatch is per-object, per-call: the JVM asks each receiver "what are you, really?" and runs that class\'s table entry. The declared type is just the window; different objects behind identical windows answer differently.', next: 'q2' },
      q1_wrong_declared: { end: true, correct: false, text: 'The declared type gates what COMPILES, never which implementation RUNS. p holds a Child — the Child\'s override runs for p, while q\'s plain Parent runs Parent\'s version.', retry: 'q1' },
      q1_wrong_global: { end: true, correct: false, text: 'Overriding replaces the entry in the CHILD\'s method table only — Parent\'s own table is untouched, and plain Parent objects keep Parent behavior. Overrides aren\'t global patches; they travel with the objects.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'You need PdfExporter and MarkdownExporter to share 200 lines of identical file-handling code. Both "are exporters". Inherit the file code from a BaseExporter, or compose a FileWriter helper?',
        choices: [
          { text: 'Either can work — but default to composing the helper: the file-handling is machinery, not identity; composition keeps it private, swappable, and testable, while a shared abstract Exporter CONTRACT (the export() method) can still exist for polymorphism', to: 'q2_right' },
          { text: 'Always inherit — shared code is exactly what extends is for', to: 'q2_wrong_inherit' },
          { text: 'Copy the 200 lines into both — independence beats reuse', to: 'q2_wrong_copy' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'The mature answer separates two needs the question tangles: a shared CONTRACT (interface or abstract export() — for polymorphic call sites) and shared MACHINERY (the file code — a composed, private helper). Inheritance can carry both, but it welds them; composition lets each vary alone. Usopp\'s slingshot again.', next: 'q3' },
      q2_wrong_inherit: { end: true, correct: false, text: '"Shared code" alone is the Stack-extends-Vector trap: you\'d weld the exporters to BaseExporter\'s API and construction order forever, to reuse what a private field could carry. Reserve extends for genuine, full is-a; reuse machinery by holding it.', retry: 'q2' },
      q2_wrong_copy: { end: true, correct: false, text: '200 duplicated lines = every future fix applied twice or missed once — the drift is guaranteed. The middle path exists: one helper class, two private fields referencing it. Reuse without welding.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A parent constructor calls this.describe(), which the child overrides to read a child field. new Child(...) — what can happen?',
        choices: [
          { text: 'The child\'s override runs BEFORE child fields are initialized (construction is parent-first), so it observes null/0 defaults — NPE now, or corrupted state detonating later', to: 'q3_right' },
          { text: 'The parent\'s describe() runs, since we\'re inside the parent constructor', to: 'q3_wrong_parent' },
          { text: 'Compile error — constructors can\'t call instance methods', to: 'q3_wrong_compile' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'The two rules collide exactly as you traced: dispatch consults the actual object (already a Child) while construction order says child fields don\'t exist yet. Hence the commandment: constructors call only private/final methods. You now understand a bug that bites senior engineers.', next: null },
      q3_wrong_parent: { end: true, correct: false, text: 'Dispatch doesn\'t care WHERE the call is written — this is already a Child (the header said so from allocation), so the Child\'s override runs… against uninitialized child state. That\'s precisely the danger.', retry: 'q3' },
      q3_wrong_compile: { end: true, correct: false, text: 'Perfectly legal to compile — that\'s what makes it treacherous. The failure is semantic and at runtime: an override executing before its class\'s fields initialize. The compiler\'s silence is why the rule must live in your head.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Forgetting @Override and "overriding" with a typo\'d name or wrong parameter list — you silently OVERLOAD instead, the parent version keeps running, and nothing warns you. @Override converts that silence into a compile error. Every intended override, always.',
    'Equating overloading with overriding in interviews — one\'s compile-time by argument static types, the other\'s runtime by receiver object. Mixing them up fails screens on its own.',
    'Calling overridable methods from constructors — the child\'s override runs against uninitialized child fields. Constructors touch only private/final methods.',
    'Shadowing fields across the hierarchy — fields don\'t dispatch; parent-typed access reads the parent\'s field, child-typed access the child\'s, and your object now has two "same" fields disagreeing. Never redeclare an inherited field name.',
    'Inheriting for convenience code-reuse when is-a is wishful — Stack extends Vector. Run the checks: does EVERY parent behavior make sense on the child? Would you expose the parent\'s full API? If not, compose.',
    'Deep inheritance towers (Entry → TimedEntry → TaggedTimedEntry → …) — each level multiplies the fragile-base-class surface. Prefer flat hierarchies: one abstract parent, concrete leaves, capabilities via interfaces (next lesson) and composition.'
  ],
  interview: [
    {
      q: 'Explain polymorphism in Java — mechanism and why it matters for design.',
      a: 'Runtime (subtype) polymorphism: a variable of a parent type can hold any subclass instance, and calling an overridden method executes the version belonging to the object\'s ACTUAL class — resolved at runtime via virtual dispatch (invokevirtual consults the receiver\'s class, whose method table carries overrides in place of inherited entries). Compile time and runtime split the work precisely: the declared type gates which methods are callable (and resolves overloads from argument static types); the runtime object selects the implementation. Why it matters: call sites written against the abstraction — for (LogEntry e : entries) total += e.effortScore(); — handle every current AND FUTURE subclass without modification; adding a type means adding a class, not editing every conditional that inspects types. That\'s the Open-Closed Principle operationalized, and it\'s what makes frameworks possible: Spring invokes your controller, JUnit your tests, through exactly this mechanism. Complete the answer with the boundaries: static methods don\'t dispatch (hidden, not overridden), private/final methods can\'t be overridden, fields never dispatch, and Java\'s other polymorphism flavors — overloading (compile-time) and generics (parametric, Part 3) — are distinct mechanisms sharing the word.'
    },
    {
      q: 'When would you choose composition over inheritance? Give a concrete failure of inheritance.',
      a: 'Default to composition; reserve inheritance for genuine, permanent is-a where polymorphic substitution is the goal. The tests I apply: does EVERY behavior of the parent make sense invoked on the child, by any caller, forever? Am I comfortable with the parent\'s full API becoming my child\'s public contract? Does the child strengthen (never weaken) the parent\'s promises — Liskov substitution as behavior, not just signatures? Concrete failure, from the JDK itself: java.util.Stack extends Vector to reuse growable-array machinery — and thereby publicly inherits insertElementAt/removeElementAt, letting any caller write into the middle of the "stack" and destroy the LIFO invariant; code legitimately holding it AS a Vector can scramble it, and no amount of encapsulation inside Stack can retract an inherited public API. Composition fixes it structurally: a private ArrayDeque field, exposing only push/pop/peek — machinery reused, invariant enforceable, representation swappable. Second classic: Square extends Rectangle — signature-compatible, behavior-incompatible (setWidth silently changing height violates the parent\'s implied contract). The nuance worth adding: composition plus an INTERFACE contract usually gives everything inheritance promised — polymorphic call sites via the interface, reuse via the composed field — without welding your type to a parent\'s implementation history; and where hierarchies are right, keep them shallow and either designed-for-extension or final.'
    },
    {
      q: 'What\'s the difference between overriding a method and hiding one? Where do static methods and fields fit?',
      a: 'Overriding applies to INSTANCE methods: same signature in a subclass replaces the parent\'s entry in the child\'s dispatch table, so calls resolve by the runtime object regardless of the variable\'s declared type — with rules: can\'t reduce visibility, can\'t add broader checked exceptions, covariant return types allowed, @Override to enlist the compiler. Hiding is what happens with STATIC methods and with FIELDS, because neither participates in dynamic dispatch. A static method redeclared in a subclass doesn\'t override — each class simply has its own, and which runs is chosen at COMPILE time from the declared type: Parent p = new Child(); p.staticMethod() runs Parent\'s, full stop (which is why calling statics through instances is a lint error — it reads like dispatch and isn\'t). Fields likewise: a child redeclaring String name gives the object TWO name fields; ((Parent) c).name and c.name read different boxes, again resolved by declared type at compile time. The unified rule to close with: dynamic dispatch is exclusively for instance methods — everything else (statics, fields, private methods, constructors) binds statically — so behavior you want to vary by subtype must live in instance methods, and same-named fields across a hierarchy are a bug factory to be avoided outright.'
    },
    {
      q: 'Design a plugin system where third parties add new export formats to your app without you changing your code. What language mechanisms carry it?',
      a: 'The shape: define the abstraction — interface Exporter { String name(); void export(Document d, OutputStream out); } (interface over abstract class: implementers keep their own inheritance freedom, and there\'s no state to share — though I\'d pair it with an optional AbstractExporter skeleton for convenience). My application code is written ENTIRELY against Exporter: menus list name()s, the export action calls export() — polymorphic dispatch means the app never knows concrete classes exist. Registration/discovery: at minimum a registry (Map<String, Exporter>) plugins add themselves to; properly, Java\'s built-in ServiceLoader — plugins ship a jar with a META-INF/services entry (or module `provides` clause), and ServiceLoader.load(Exporter.class) discovers and instantiates implementations off the classpath at runtime, no registration code at all. Note the Part 0 payoff: this leans on classloading and runtime linkage — the JVM binding my invokeinterface call to bytecode that didn\'t exist when I compiled. Guardrails that show senior judgment: keep the interface minimal and versioned (every method is a forever-contract to third parties); document behavioral requirements (thread-safety, no UI blocking) since Liskov obligations bind plugins too; validate plugins at load (name uniqueness, null checks) because you don\'t control their quality; and consider making export()\'s inputs effectively read-only — handing third-party code mutable internals is last lesson\'s leaked-reference bug at ecosystem scale. This is exactly how JDBC drivers, SLF4J bindings, and JUnit engines work — naming one earns points.'
    }
  ]
};
