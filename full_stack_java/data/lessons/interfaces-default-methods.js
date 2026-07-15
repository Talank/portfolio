window.LESSONS = window.LESSONS || {};
window.LESSONS['interfaces-default-methods'] = {
  id: 'interfaces-default-methods',
  title: 'Interfaces: Contracts, Multiple Types, default Methods & Functional Interfaces',
  category: 'Part 1 — Core Java',
  timeMin: 50,
  summary: 'The other axis of Java\'s type system: an interface is a pure CONTRACT — a promise of capability, decoupled from any implementation, that a class fulfils with implements. Where a class can extend exactly one parent, it can implement many interfaces, so this is how Java gives a type several capabilities without the diamond scars of multiple implementation inheritance. Plus default and static methods (how the JDK evolves interfaces without breaking every implementer), constants, functional interfaces and the single-abstract-method shape that lambdas fill, and the design instinct interviews reward: program to the interface, not the implementation.',
  goals: [
    'Declare and implement an interface, and explain how it differs from an abstract class along the state / contract / single-vs-multiple axes',
    'Give one type several capabilities with multiple implements, and see why that\'s safe where multiple class inheritance is not',
    'Use default methods to evolve an interface without breaking implementers, and resolve the diamond conflict when two defaults collide',
    'Recognise a functional interface (one abstract method) and connect it to the lambdas and method references Part 4 leans on',
    'Apply "program to the interface" — declare variables and parameters by capability, not concrete class — and justify it as the seam testing and Spring depend on'
  ],
  concept: [
    {
      h: 'An interface is a contract, not a thing',
      p: [
        '<code>interface Searchable { List&lt;Hit&gt; search(String query); }</code> declares a <b>capability</b>: "whatever implements me can be searched, this is the shape of the call." It has no constructor, holds no per-instance state, and cannot be instantiated — it is the promise, not the keeper of the promise. A class signs the contract with <code>class LogIndex implements Searchable</code> and must supply a body for every abstract method (or be declared abstract itself). Method declarations in an interface are implicitly <code>public abstract</code>; any field is implicitly <code>public static final</code> — a constant, never instance state (put behaviour in interfaces, not data).',
        'The load-bearing difference from a class: <b>a class extends one parent but implements as many interfaces as it likes.</b> <code>class ExperimentEntry extends LogEntry implements Searchable, Comparable&lt;ExperimentEntry&gt;, Serializable</code> — one identity (its is-a parent) plus a list of capabilities (its can-do contracts). That is Java\'s deliberate answer to multiple inheritance: you may inherit many TYPES (contracts, which carry no state to collide) but only one IMPLEMENTATION lineage (the class, which does). The C++ diamond problem — two paths to the same inherited FIELD — simply cannot arise, because interfaces classically had no fields to duplicate.'
      ]
    },
    {
      h: 'default methods: evolving a contract without breaking its signatories',
      p: [
        'Before Java 8, adding a method to a published interface was a catastrophe: every existing implementer instantly failed to compile, because they lacked the new method. This froze the JDK\'s interfaces in place. <b>default methods</b> broke the freeze: <code>default boolean isEmpty() { return search("").isEmpty(); }</code> ships a body <i>in the interface</i>, so old implementers inherit a working version for free and only override it if they want something better. This is exactly how <code>Collection.stream()</code>, <code>Iterable.forEach()</code>, and <code>List.sort()</code> were added to interfaces that already had thousands of implementations in the wild — nobody\'s code broke.',
        'Interfaces can also carry <code>static</code> methods (factory/utility helpers that belong to the contract but not to instances — <code>Comparator.comparing(...)</code>, <code>List.of(...)</code>) and, since Java 9, <code>private</code> methods to share code between defaults without exposing it. The mental model: an interface is still primarily a bag of abstract promises, but it may now carry a little stateless, shared machinery so those promises can grow.',
        'The one genuinely new hazard defaults introduce is the <b>diamond conflict</b>: if a class implements two interfaces that BOTH provide a default <code>greet()</code>, the compiler cannot guess which and forces you to resolve it — you must override <code>greet()</code> in the class, optionally delegating with the explicit syntax <code>InterfaceA.super.greet()</code>. Note how contained the problem is compared to C++: only BEHAVIOUR can clash (state never does), and the language makes the ambiguity a compile error you resolve explicitly rather than a silent, surprising pick.'
      ]
    },
    {
      h: 'Functional interfaces: one abstract method, and lambdas fit',
      p: [
        'A <b>functional interface</b> is any interface with exactly ONE abstract method (defaults and statics don\'t count toward the one) — <code>Runnable</code> (<code>run()</code>), <code>Comparator&lt;T&gt;</code> (<code>compare(a,b)</code>), <code>Predicate&lt;T&gt;</code> (<code>test(t)</code>). Because there is only one method to fill, Java lets you supply it with a <b>lambda</b> instead of a whole anonymous class: <code>Runnable r = () -&gt; System.out.println("go");</code> is the runnable whose single <code>run()</code> is that body. The <code>@FunctionalInterface</code> annotation is the interface-side equivalent of <code>@Override</code>: optional, but it makes the compiler enforce the single-abstract-method rule so a future accidental second method becomes a build error rather than a silent breakage of every lambda.',
        'This is the bridge to Part 4\'s streams and to how you\'ll write callbacks, comparators, and event handlers throughout the course. For now the point is conceptual: <b>a functional interface turns behaviour into a value you can pass around</b> — sort with <code>list.sort(Comparator.comparingInt(LogEntry::effortScore))</code>, and the comparator you handed in is an object implementing a one-method interface, whether you wrote it as a lambda, a method reference, or a named class. The interface is what makes the behaviour typed and substitutable.'
      ]
    },
    {
      h: 'Program to the interface, not the implementation',
      p: [
        'The single most repeated piece of Java design advice: declare variables, parameters, and return types by the most general INTERFACE that suffices, not by the concrete class. <code>List&lt;Hit&gt; results = new ArrayList&lt;&gt;();</code> — not <code>ArrayList&lt;Hit&gt; results</code>. Now the field could become a <code>LinkedList</code> or an unmodifiable list tomorrow and every caller keeps compiling, because callers only ever depended on the <i>can-do</i> (List), never the <i>how</i> (ArrayList). Method parameters gain reach the same way: <code>void index(Collection&lt;LogEntry&gt; entries)</code> accepts a list, a set, anything iterable-as-a-collection — you asked for the capability, not a specific container.',
        'This is not style pedantry; it is the seam the rest of the course hangs on. Part 7\'s tests substitute a fake <code>Searchable</code> for the real database-backed one precisely because the calling code names the interface, so a stand-in that satisfies the contract drops in transparently. Part 9\'s Spring wires a concrete bean into every field typed as an interface, letting configuration — not hard-coded <code>new</code> — pick the implementation. When you type a field as an interface you are leaving a deliberate door for substitution: for testing, for a faster implementation, for a different backend. LogPose\'s search will be an interface for exactly this reason — an in-memory keyword matcher today, an embedding-backed semantic searcher by Part 13, with the calling code never noticing the swap.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'One crew, many capabilities: the Straw Hats sign contracts',
      text: 'Look at what actually makes the Straw Hats function, and you find the interface pattern everywhere. Each member IS exactly one thing by lineage — Chopper is-a crew member, full stop, single inheritance — but each one CAN-DO a whole list of contracts. Chopper implements Doctor (the ship needs someone who can treat(injury), and he signed that contract). Nami implements Navigator (can plotCourse(sky)) and, separately, Cartographer (can drawMap(island)) — two independent capabilities on one person, which single-inheritance could never give her but a list of implements can. And here is the genius the crew relies on in every fight: Luffy doesn\'t need a Chopper to get the crew patched up — he needs SOMEONE WHO IMPLEMENTS DOCTOR. When Chopper\'s down and Law is aboard, Law implements Doctor too; the call "get me a medic!" lands on anyone who signed that contract, no matter their lineage (program to the interface — the CAN-DO, not the concrete person). The contract carries no personal history, so no two capabilities ever collide: being a Doctor doesn\'t drag in any of Chopper\'s reindeer-specific baggage, it\'s a pure promise of a treat() method. Now the default-method twist, straight from the Grand Line\'s evolution: years in, the Navigator contract needs a new clause — every navigator should also readWeatherInstinct(). If that clause had NO default body, every navigator in every crew across the seas would instantly "fail to compile" — suddenly non-conforming. So the clause ships with a sensible default implementation ("check the barometer and the sky"), and every existing navigator inherits a working version untouched; Nami, who has the once-in-a-generation weather sense, simply OVERRIDES it with something far better. The contract grew; nobody broke. And the diamond moment: when a member somehow signs two contracts that each define a default drinkCall() — say Sanji, bound by both the Cook\'s code and the Gentleman\'s code, each of which says how to offer a drink — the crew doesn\'t silently guess. Sanji must decide explicitly which he honours (or blend them himself). Ambiguity resolved out loud, never in the dark.',
    },
    sitcom: {
      show: 'Friends',
      title: 'Joey signs the same contract two agents wrote',
      text: 'Joey Tribbiani is single-inheritance to the bone — he is-a struggling actor, one identity, don\'t confuse him with a second parent class or he panics ("It\'s a moo point. It\'s like a cow\'s opinion — it doesn\'t matter"). But Joey IMPLEMENTS a surprising list of contracts: he implements Actor (can perform(scene)), he implements — reluctantly, for the paycheck — SantaClaus and, in a European tour nobody discusses, a Cologne Robot. Each is a capability signed onto one person, not a change to who he fundamentally is. Watch the "program to the interface" logic run in the auditions: the casting director never asks for "Joey" — they ask for someone who implements Soap-Opera-Doctor, and whoever satisfies that contract can be dropped into the role. Dr. Drake Ramoray is an implementation detail; the show depends on the CONTRACT ("can play a neurosurgeon on camera"), which is exactly why they can — and infamously do — recast around it. The default-method beat is pure Friends too: the friend-group has an unwritten Roommate contract, and when a new clause is needed — say, "everyone chips in for the apartment" — Monica supplies the default behaviour (she\'ll organise it, she always does), so nobody in the group breaks even though the rule is new; Rachel, who\'d otherwise be non-conforming, inherits Monica\'s default and coasts. And the diamond conflict has a canonical Friends scene: Joey is bound by two contracts at once — the Bro Code ("a friend doesn\'t date another friend\'s...") and his own loyalty to Rachel — each with a conflicting default for how to act. He can\'t silently follow both; he has to resolve it explicitly, out loud, agonisingly, on a balcony. The language of the group forces the ambiguity into the open, which is precisely what Java\'s compiler does: two defaults collide, you must override and choose.',
    },
    why: 'One identity by lineage (extends, single), many capabilities by contract (implements, a list) — Chopper is-a crew member but can-do Doctor, Nami can-do Navigator AND Cartographer. "Get me a medic!" lands on anyone who signed the Doctor contract, Chopper or Law — programming to the interface, the can-do not the concrete person. Contracts carry no state, so capabilities never collide. A new clause ships with a default body so old signatories don\'t break (Nami overrides it with better weather sense); and when two defaults conflict — Sanji\'s two codes, Joey on the balcony — the choice must be made explicitly, never guessed.'
  },
  storyAnim: {
    title: 'One person, a list of contracts — and a contract that grows',
    h: 300,
    props: [
      { id: 'chopper', emoji: '🦌', label: 'Chopper: is-a CrewMember (extends, one)', x: 12, y: 12 },
      { id: 'doctor', emoji: '⚕️', label: 'implements Doctor: treat()', x: 42, y: 12 },
      { id: 'law', emoji: '🗡️', label: 'Law ALSO implements Doctor', x: 74, y: 12 },
      { id: 'call', emoji: '📣', label: '"get me a medic!" — to anyone Doctor', x: 20, y: 46 },
      { id: 'clause', emoji: '📜', label: 'Navigator gains readWeather() — with a default body', x: 56, y: 46 },
      { id: 'override', emoji: '🌈', label: 'Nami OVERRIDES with better sense', x: 30, y: 80 },
      { id: 'diamond', emoji: '💎', label: 'two defaults collide → resolve explicitly', x: 72, y: 80 }
    ],
    actors: [
      { id: 'luffy', emoji: '👒', label: 'Luffy', x: 12, y: 44 }
    ],
    steps: [
      { c: 'Chopper IS-A crew member — one identity by lineage. That never changes.', p: { chopper: 'lit' } },
      { c: 'But he CAN-DO a contract: implements Doctor, supplying treat(). A capability signed onto one person, carrying no lineage baggage.', p: { doctor: 'good' } },
      { c: 'And crucially, he\'s not the only signatory — Law implements Doctor too, from an entirely different lineage.', p: { law: 'good' } },
      { c: 'So "get me a medic!" is programmed to the INTERFACE: it lands on anyone who signed Doctor — Chopper or Law — never on a concrete person. Substitution for free.', p: { call: 'lit' }, a: { luffy: [40, 44] } },
      { c: 'The Grand Line evolves: the Navigator contract gains readWeather(). It ships WITH a default body, so every existing navigator inherits a working version and none breaks.', p: { clause: 'good' } },
      { c: 'Nami, with once-in-a-generation weather sense, simply overrides the default with something better. The contract grew; nobody was forced to change.', p: { override: 'good' } },
      { c: 'The one new hazard: sign two contracts whose defaults collide, and the compiler refuses to guess. You resolve it explicitly — override and choose, or blend with Interface.super. Ambiguity forced into the open.', p: { diamond: 'bad' } }
    ]
  },
  conceptFlow: {
    title: 'From contract to running call: how implements + default + dispatch fit',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'The contract',
        nodes: [
          { id: 'iface', text: 'interface Searchable\nsearch(String) — abstract promise' },
          { id: 'default', text: 'default boolean isEmpty()\nships a body — implementers inherit it' }
        ]
      },
      {
        label: 'Signing it',
        nodes: [
          { id: 'implements', text: 'class LogIndex extends LogStore\nimplements Searchable, Comparable' },
          { id: 'supply', text: 'must supply search(...)\nmay override isEmpty()' }
        ]
      },
      {
        label: 'Calling it',
        nodes: [
          { id: 'declare', text: 'Searchable s = new LogIndex()\ndeclared by CAPABILITY' },
          { id: 'dispatch', text: 's.search(q)\ndynamic dispatch to LogIndex\'s body' }
        ]
      },
      {
        label: 'When defaults clash',
        nodes: [
          { id: 'diamond', text: 'two interfaces, same default\ncompiler error' },
          { id: 'resolve', text: 'override in the class\nA.super.m() to pick' }
        ]
      }
    ],
    steps: [
      { active: ['iface'], note: 'The interface is the promise: a method shape with no body and no state. It cannot be instantiated — it exists to be implemented. This is the CAN-DO, decoupled from any keeper.' },
      { active: ['default'], note: 'A default method ships an actual body inside the interface, so the contract can gain a method without breaking the thousands of classes that already implemented it. This is how Collection.stream() was added to the JDK non-catastrophically.' },
      { active: ['implements'], note: 'A class extends ONE parent (its identity) but implements a LIST of interfaces (its capabilities). No state collides, so no diamond of fields — the C++ problem is designed away.' },
      { active: ['supply'], note: 'It must provide a body for every abstract method (search), or be abstract itself. It inherits isEmpty() free, and overrides only if it wants better than the default.' },
      { active: ['declare'], note: 'Program to the interface: the variable is typed Searchable, not LogIndex. Now the concrete class can change tomorrow and every caller keeps compiling — the seam testing and Spring depend on.' },
      { active: ['dispatch'], note: 'The call resolves by the SAME dynamic dispatch as last lesson — the object\'s actual class supplies the body. An interface reference is just another parent-shaped window onto the real object.' },
      { active: ['diamond'], note: 'The one new hazard: implement two interfaces that both provide a default greet(), and the compiler cannot choose. It refuses — a compile error, not a silent surprise pick.' },
      { active: ['resolve'], note: 'You resolve it by overriding greet() in the class, optionally delegating with InterfaceA.super.greet(). The ambiguity is forced into the open and settled by you, explicitly.' }
    ]
  },
  tech: [
    {
      q: 'Interface or abstract class — give me the decision rule, not a feature list.',
      a: 'Ask what you are sharing. If you are sharing a CONTRACT — a capability that may cut across unrelated hierarchies, that several classes should offer independently, that you want as a substitution seam — reach for an interface: a class can implement many, so the capability composes freely (Comparable spans String, LocalDate, and your Project; nothing about them is a shared ancestor). If you are sharing STATE and a CONSTRUCTION protocol — per-instance fields that must be initialised and validated once, invariants a constructor enforces for the whole family, a template method that reads shared protected state — reach for an abstract class, because interfaces still cannot hold per-instance fields or run a constructor. Concretely in LogPose: LogEntry is an abstract CLASS (it owns title/createdAt state, validated in its constructor, shared by every entry) while Searchable is an INTERFACE (a capability an index has, a database has, a fake test-double has — no shared state, no common ancestor). The two aren\'t rivals; the JDK\'s house style pairs them — an interface for the contract plus an optional abstract skeleton for convenience (Collection + AbstractCollection, List + AbstractList) — so implementers take the interface for freedom or the skeleton for a running start. Default methods narrowed the gap (interfaces can now carry stateless behaviour) but did NOT close it: the moment you need a field, it must be an abstract class.'
    },
    {
      q: 'Why were default methods added, and what did they cost? Walk the diamond resolution precisely.',
      a: 'They were added to solve interface EVOLUTION. A published interface is a contract with every implementer in existence; before Java 8, adding a method broke all of them at compile time, which is why core interfaces ossified. Default methods let a new method ship with a fallback body — Iterable.forEach, Collection.stream, Comparator.reversed were all retrofitted onto interfaces with countless existing implementations, and not one broke, because each inherited the default. The cost is a controlled ambiguity. If class C implements A and B, and both declare default void m(), C inherits two competing bodies and the compiler rejects it outright — you MUST override m() in C. Inside that override you can pick explicitly with the qualified-super syntax A.super.m() or B.super.m(), or write something new, or combine both. The resolution RULES the compiler applies before declaring a conflict are worth knowing: (1) a concrete method from a superCLASS always wins over any interface default ("class wins" — real state beats a would-be default); (2) a more-specific sub-interface\'s default beats a parent interface\'s; (3) only when neither rule disambiguates does it force your explicit override. Note the blast radius versus C++ multiple inheritance: only BEHAVIOUR can collide (interfaces hold no instance state, so there is no duplicated-field diamond at all), and the collision is a loud compile error resolved by hand, never a silent, spooky linearised pick. Java bought interface evolution and paid only a narrow, explicit ambiguity — a deliberately good trade.'
    },
    {
      q: 'What exactly makes an interface "functional", and how does a lambda satisfy it?',
      a: 'A functional interface has exactly ONE abstract method — the Single Abstract Method (SAM) shape. Default and static methods don\'t count (they have bodies, they\'re not promises to fill), and the three methods every interface implicitly inherits from Object — equals, hashCode, toString — don\'t count either, which is why Comparator (with compare as its one abstract method, plus a pile of defaults and statics) is still functional. Because there is exactly one blank, the compiler can accept a lambda in place of a full anonymous class: the lambda\'s parameter list and body ARE that one method\'s implementation, with the target type inferred from context. Runnable r = () -> work(); constructs an object whose sole run() is work(); Comparator<LogEntry> byEffort = (a, b) -> Integer.compare(a.effortScore(), b.effortScore()); constructs a comparator whose compare is that expression. A method reference is the same thing shorthand: Comparator.comparingInt(LogEntry::effortScore) passes the existing method AS the function. The @FunctionalInterface annotation is optional but does for the interface what @Override does for a method — it makes the compiler enforce the single-abstract-method invariant, so if someone later adds a second abstract method (silently breaking every lambda that targeted it) the interface itself fails to compile at the source of the mistake. Mechanically the JVM implements this via invokedynamic and the LambdaMetafactory rather than generating an anonymous inner class per lambda — a Part 2/4 detail — but the type-level story is simply: one blank, so a one-expression value can fill it.'
    },
    {
      q: 'Someone says "always program to the interface." When is a concrete type the right declaration instead?',
      a: 'The rule is a strong default, not an absolute. Declare by interface when you want substitutability and only depend on the capability: local variables, fields, parameters, and especially return types for anything crossing a module or API boundary should say List, Map, Collection, Searchable — so implementations can change (ArrayList to an unmodifiable list, an in-memory index to an embedding-backed one) without touching callers, and so tests and Spring can inject stand-ins. It is most valuable at boundaries: a public method returning ArrayList leaks and freezes an implementation choice into your API forever; returning List keeps it yours to change. Declare by the concrete type only when you genuinely, specifically need what only that type promises — you need ArrayDeque\'s deque operations (push/pop AND offer/poll) that the List interface doesn\'t expose, or you need a LinkedHashMap\'s access-ordering guarantee that Map doesn\'t state, or you\'re constructing and the right-hand side is concrete anyway (new ArrayList<>()). And the collection subtlety this course keeps flagging: choosing the INTERFACE for the declaration (Map) and the IMPLEMENTATION for the construction (new LinkedHashMap<>()) is often exactly right — but only when the caller truly doesn\'t depend on the ordering; the moment the ORDER is part of the contract you\'re offering, that guarantee belongs in the declared type or in documentation, or callers will silently rely on an accident. So: interface by default and always at boundaries; concrete type when the specific behaviour IS the requirement — and be honest about which.'
    }
  ],
  code: {
    title: 'Searchable — LogPose\'s search becomes a contract, not a class',
    intro: 'The capability the whole app pivots on gets its own interface. Two implementations satisfy it — a trivial keyword matcher today, an embedding-backed semantic searcher by Part 13 — and every caller depends only on the contract, so the swap is invisible. A default method and a functional-interface comparator round it out.',
    code: `import java.util.*;

interface Searchable {
    // The one real promise every searcher must keep.
    List<String> search(String query);

    // default: ships a body, so adding it did NOT break existing implementers.
    default boolean hasMatch(String query) {
        return !search(query).isEmpty();
    }

    // static: a factory that belongs to the contract, not to any instance.
    static Searchable empty() {
        return query -> List.of();     // a lambda IS the single-method implementation
    }
}

// Today's implementation: dumb keyword containment over titles.
class KeywordIndex implements Searchable {
    private final List<String> titles = new ArrayList<>();

    void add(String title) { titles.add(title); }

    @Override
    public List<String> search(String query) {
        List<String> hits = new ArrayList<>();
        for (String t : titles)
            if (t.toLowerCase().contains(query.toLowerCase()))
                hits.add(t);
        return hits;
    }
    // note: hasMatch() inherited free from the default — no code here.
}

public class SearchDemo {
    // Program to the INTERFACE: this method never names KeywordIndex.
    static void report(Searchable index, String query) {
        System.out.println(query + " -> " + index.search(query)
            + (index.hasMatch(query) ? " (hit)" : " (miss)"));
    }

    public static void main(String[] args) {
        KeywordIndex idx = new KeywordIndex();
        idx.add("Flaky-test detection via reruns");
        idx.add("Embedding cache for repeated queries");
        idx.add("Mentoring notes: onboarding plan");

        report(idx, "flaky");            // hit — matched by the contract, not the class
        report(Searchable.empty(), "x"); // the lambda-backed searcher, same call site

        // A functional interface in the wild: sort titles by length with a lambda.
        List<String> titles = idx.search("");          // empty query matches nothing here…
        List<String> all = List.of("bb", "a", "ccc");
        List<String> sorted = new ArrayList<>(all);
        sorted.sort(Comparator.comparingInt(String::length));  // SAM filled by a method ref
        System.out.println(sorted);                            // [a, bb, ccc]
    }
}`,
    notes: [
      'report(Searchable, ...) depends on the capability, never on KeywordIndex. When the embedding-backed searcher arrives in Part 13, this method — and every caller like it — changes by zero lines. That is the whole reason search is an interface.',
      'hasMatch() is inherited from the default with no code in KeywordIndex. Had we added it AFTER shipping KeywordIndex, the default body would have kept KeywordIndex compiling untouched — interface evolution without breakage.',
      'Searchable.empty() returns a lambda: because Searchable has one abstract method, query -> List.of() IS a Searchable. Comparator.comparingInt(String::length) is the same trick — a functional interface filled by a method reference.'
    ]
  },
  lab: {
    title: 'Give LogEntry a capability, and add a default',
    prompt: 'Design a capability and hang it off the domain model. Write (1) an interface <code>Tagged</code> with one abstract method <code>List&lt;String&gt; tags()</code> and a <b>default</b> method <code>boolean hasTag(String t)</code> that returns whether <code>tags()</code> contains <code>t</code> (case-insensitive); (2) a class <code>Note</code> that <code>implements Tagged</code>, holds a <code>List&lt;String&gt;</code> of tags supplied in its constructor, and returns it from <code>tags()</code> — it must NOT write its own <code>hasTag</code> (inherit the default); (3) a static method <code>countTagged(List&lt;Tagged&gt; items, String tag)</code> that counts how many items <code>hasTag(tag)</code> — typed against the <b>interface</b>, never <code>Note</code>. In a comment, answer: if you later add a <code>ReviewEntry implements Tagged</code>, how many lines of <code>countTagged</code> change?',
    starter: `import java.util.*;

interface Tagged {
    // one abstract method: List<String> tags()

    // default boolean hasTag(String t): case-insensitive membership in tags()
}

class Note implements Tagged {
    // hold a List<String> tags from the constructor; return it from tags()
    // do NOT override hasTag — inherit the default
}

class Reports {
    // static int countTagged(List<Tagged> items, String tag): count items whose hasTag(tag) is true
    // parameter typed by the INTERFACE, not by Note
}

// Q: adding ReviewEntry implements Tagged later — how many lines of countTagged change?
// ANSWER:`,
    checks: [
      { re: 'interface\\s+Tagged', must: true, hint: 'Declare interface Tagged.', pass: 'interface Tagged ✓' },
      { re: 'List\\s*<\\s*String\\s*>\\s+tags\\s*\\(\\s*\\)', must: true, hint: 'The one abstract method is List<String> tags().', pass: 'abstract tags() ✓' },
      { re: 'default\\s+boolean\\s+hasTag', must: true, hint: 'hasTag must be a default method — it ships a body inside the interface.', pass: 'default hasTag ✓' },
      { re: 'class\\s+Note\\s+implements\\s+Tagged', must: true, hint: 'Note must implement Tagged.', pass: 'Note implements Tagged ✓' },
      { re: 'static\\s+int\\s+countTagged\\s*\\(\\s*List\\s*<\\s*Tagged\\s*>', must: true, hint: 'countTagged must accept List<Tagged> — the interface type, so any implementer flows in.', pass: 'interface-typed parameter ✓' },
      { re: 'hasTag', must: true, hint: 'countTagged should call hasTag(tag) on each item — the default does the work.', pass: 'uses hasTag ✓' },
      { re: 'toLowerCase|equalsIgnoreCase', must: true, hint: 'hasTag must be case-insensitive — lowercase both sides or use equalsIgnoreCase.', pass: 'case-insensitive ✓' },
      { re: 'ANSWER\\s*:\\s*(0|zero|none)', flags: 'i', must: true, hint: 'countTagged names only the interface — a new implementer changes ZERO lines.', pass: 'zero lines — program-to-interface proven ✓' }
    ],
    run: 'put Tagged, Note, Reports and a small main into one file <code>Tags.java</code>; <code>javac Tags.java &amp;&amp; java Tags</code> with a list of Notes plus, to prove the point, one anonymous Tagged made from a lambda — countTagged should count it too.',
    solution: `import java.util.*;

interface Tagged {
    List<String> tags();

    default boolean hasTag(String t) {
        for (String tag : tags())
            if (tag.equalsIgnoreCase(t)) return true;
        return false;
    }
}

class Note implements Tagged {
    private final List<String> tags;
    Note(List<String> tags) { this.tags = List.copyOf(tags); }
    @Override public List<String> tags() { return tags; }
    // hasTag inherited from the default — no code here.
}

class Reports {
    static int countTagged(List<Tagged> items, String tag) {
        int n = 0;
        for (Tagged item : items)
            if (item.hasTag(tag)) n++;      // default method, dispatched per object
        return n;
    }
}

// ANSWER: 0 — countTagged is written against Tagged and never names an implementer;
// ReviewEntry implements Tagged drops straight in. Program to the interface.`,
    notes: [
      'Note inherits hasTag with zero lines of its own — that is interface evolution and code-sharing via default, in miniature. Every future implementer gets hasTag free unless it wants better.',
      'countTagged typed against Tagged is "program to the interface": it counts Notes, ReviewEntries, and even a lambda-made Tagged identically, because it only ever asked for the capability.',
      'List.copyOf in the constructor is last lesson\'s leaked-reference defence returning: Note hands out and holds an unmodifiable copy so no caller can mutate its tags behind its back.'
    ]
  },
  quiz: [
    {
      q: 'Why can a class implement many interfaces but extend only one class?',
      options: ['Interfaces contribute only contracts (no instance state), so multiple ones can never collide over a shared field — while multiple class parents could each bring state, reviving the diamond problem Java chose to avoid', 'It\'s an arbitrary limit the designers picked for simplicity', 'Interfaces are faster to inherit than classes', 'Classes can actually extend many parents using the implements keyword'],
      correct: 0,
      explain: 'One identity by lineage (a class carries state, so one parent), many capabilities by contract (interfaces carry no per-instance state, so a whole list is safe). Chopper is-a crew member but can-do Doctor, Navigator, and more.'
    },
    {
      q: 'What problem do default methods solve?',
      options: ['Interface EVOLUTION: a new method can ship with a fallback body, so the thousands of classes already implementing the interface inherit a working version and none breaks at compile time', 'They let interfaces finally hold per-instance state', 'They make interface methods run faster', 'They allow interfaces to have constructors'],
      correct: 0,
      explain: 'Collection.stream() was added to an interface with countless existing implementers precisely because the default gave them all a free body. The Navigator contract grew a readWeather() clause; every navigator inherited the default; Nami overrode it.'
    },
    {
      q: 'Class C implements A and B; both declare default void m(). What happens?',
      options: ['Compile error — C must override m() explicitly, optionally delegating with A.super.m() or B.super.m(); the compiler refuses to guess', 'B\'s version silently wins because it was listed last', 'A\'s version silently wins because it was listed first', 'Both run in sequence when m() is called'],
      correct: 0,
      explain: 'The one hazard defaults introduce, and it\'s deliberately loud: ambiguity is a compile error you resolve by hand, never a silent linearised pick. Sanji, bound by two codes, must choose out loud.'
    },
    {
      q: 'Which of these is a functional interface, and why does it matter?',
      options: ['Comparator — it has exactly one ABSTRACT method (compare); its many default/static methods don\'t count — so a lambda or method reference can fill it', 'Any interface with exactly one method total, counting defaults and statics', 'Only interfaces annotated @FunctionalInterface can be functional', 'None — functional interfaces were removed in modern Java'],
      correct: 0,
      explain: 'One abstract method = one blank = a lambda can fill it. Defaults, statics, and the inherited equals/hashCode/toString don\'t count toward the one. @FunctionalInterface is an optional compiler check, not a requirement.'
    },
    {
      q: 'You write List<Hit> results = new ArrayList<>(); instead of ArrayList<Hit> results. The main payoff?',
      options: ['Callers depend only on the List capability, so the implementation can change (to LinkedList, an unmodifiable list, a test double) without any caller changing — the substitution seam testing and Spring rely on', 'ArrayList is deprecated and List is its replacement', 'List is measurably faster than ArrayList at runtime', 'It has no real effect — the two are identical in every way'],
      correct: 0,
      explain: 'Program to the interface: name the can-do, not the how. The concrete class becomes a swappable detail — which is exactly why LogPose\'s search is typed Searchable, keyword-matcher today, embedding-backed by Part 13, callers none the wiser.'
    }
  ],
  testFlow: {
    title: 'Test yourself: contracts under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'You must give one class the ability to be searched, compared, and serialized — three unrelated capabilities. Interfaces or a deep class hierarchy?',
        choices: [
          { text: 'Three interfaces the class implements — capabilities compose freely on one type, they carry no state to collide, and each is independently reusable on unrelated classes', to: 'q1_right' },
          { text: 'A single tall superclass chain: Searchable extends Comparable extends Serializable, and the class extends the bottom', to: 'q1_wrong_chain' },
          { text: 'Impossible in Java — a class can only have one capability', to: 'q1_wrong_impossible' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Exactly the multiple-implements design: implements Searchable, Comparable, Serializable. Each capability is a separate contract, reusable on any class, colliding with nothing because interfaces hold no state. One identity, a list of can-dos.', next: 'q2' },
      q1_wrong_chain: { end: true, correct: false, text: 'Welding three unrelated capabilities into one inheritance chain forces a false is-a (a Searchable is-a Comparable? no) and locks every class needing one capability into inheriting all three. Interfaces exist precisely so capabilities compose without a lineage.', retry: 'q1' },
      q1_wrong_impossible: { end: true, correct: false, text: 'The opposite is true — a class implements as MANY interfaces as it likes. That freedom is the whole point of separating capability (interface, many) from identity (class, one).', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'You maintain a published interface with 400 known implementers and need to add a method. What lets you do it without breaking their builds?',
        choices: [
          { text: 'Add it as a default method with a sensible fallback body — every existing implementer inherits the default and keeps compiling; those wanting better override it', to: 'q2_right' },
          { text: 'Add it as a normal abstract method — implementers will figure it out', to: 'q2_wrong_abstract' },
          { text: 'You can\'t add anything to a published interface, ever', to: 'q2_wrong_never' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'This is exactly why default methods exist and how the JDK retrofitted stream(), forEach(), and sort() onto ancient interfaces. The default is the safety net; overriding is opt-in improvement. The contract grew; nobody broke.', next: 'q3' },
      q2_wrong_abstract: { end: true, correct: false, text: 'A new abstract method is the pre-Java-8 catastrophe: all 400 implementers instantly fail to compile for lacking a body. The default method was invented specifically to avoid this — ship a fallback and they inherit it.', retry: 'q2' },
      q2_wrong_never: { end: true, correct: false, text: 'Too pessimistic since Java 8 — default methods make additive evolution safe. (Removing or changing a signature is still breaking; but ADDING with a default is exactly the escape hatch.)', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A helper method takes ArrayList<LogEntry> as its parameter. A caller has a perfectly good List<LogEntry> from List.of(...) and can\'t pass it. What was the mistake, and the fix?',
        choices: [
          { text: 'The parameter should be the interface (List, or even Collection) — typing it as the concrete ArrayList needlessly rejects every other valid implementation; widen the parameter to the capability actually used', to: 'q3_right' },
          { text: 'The caller must copy into a new ArrayList before every call', to: 'q3_wrong_copy' },
          { text: 'ArrayList and List are incompatible types that can never interoperate', to: 'q3_wrong_incompat' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Program to the interface at the parameter, too: ask for the least you need (List, or Collection). The concrete ArrayList in the signature was an over-specification that rejected List.of() lists, unmodifiable lists, and every test double — for no benefit the method actually uses.', next: null },
      q3_wrong_copy: { end: true, correct: false, text: 'Copying at every call site is pure waste papering over the real defect: an over-specified parameter type. Widen the signature to List and the copies vanish — the caller\'s list flows straight in.', retry: 'q3' },
      q3_wrong_incompat: { end: true, correct: false, text: 'They interoperate fine — ArrayList IS-A List. The issue is direction: a method demanding the narrow ArrayList rejects the broad List, when it should demand the broad type and accept every implementation. Depend on the capability, not the class.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Reaching for an abstract class when you need a capability across unrelated types — single inheritance then blocks a class from also extending its real parent. If it\'s a can-do that cuts across hierarchies, it\'s an interface.',
    'Putting mutable state in an interface — you can\'t (fields are public static final constants), and trying is a sign you actually needed an abstract class. Interfaces carry contracts and, since Java 8, stateless behaviour; never per-instance data.',
    'Forgetting that interface methods are public — an implementing method declared package-private or protected won\'t compile as an override; every implemented method must be public.',
    'Adding a second abstract method to an interface used as a lambda target — every existing lambda silently stops compiling. Annotate lambda-target interfaces @FunctionalInterface so that mistake fails at the interface, loudly, not at every call site.',
    'Assuming default methods let interfaces do everything abstract classes do — they still can\'t hold instance state or run a constructor to enforce invariants. State and construction remain the abstract class\'s job.',
    'Over-specifying declared types — returning or accepting ArrayList/HashMap instead of List/Map leaks and freezes an implementation choice into your API, rejecting valid alternatives and blocking future change. Interface at every boundary.'
  ],
  interview: [
    {
      q: 'Interface vs abstract class in modern Java — when each, and did default methods erase the difference?',
      a: 'Interface for a CONTRACT / capability; abstract class for shared STATE and a construction protocol. Choose an interface when the capability cuts across unrelated hierarchies (Comparable spans String, LocalDate, your own types), when a class needs several capabilities at once (implements takes a list; extends takes one), or when you want a substitution seam for testing and dependency injection. Choose an abstract class when subclasses share per-instance FIELDS that must be initialised and validated once (an interface cannot hold instance state), when a constructor must enforce invariants for the whole family, or when a template method needs shared protected state. Default methods narrowed the gap — interfaces can now carry stateless shared behaviour and evolve additively — but did NOT erase it: the moment you need a field or a constructor, it must be an abstract class, and "class wins" resolution means a superclass method still beats any interface default. The idiomatic modern move is to use BOTH — an interface for the contract plus an optional abstract skeleton implementation for convenience, exactly as the JDK pairs Collection with AbstractCollection and List with AbstractList — letting implementers take the interface for maximum freedom or the skeleton for a running start. So: default to the interface for flexibility, add the abstract class the instant you need shared state or construction.'
    },
    {
      q: 'Walk me through default methods: motivation, the diamond, and how conflicts resolve.',
      a: 'Motivation is interface evolution. A published interface is a binding contract with every implementer alive; pre-Java-8, adding a method broke all of them at compile time, so the core interfaces were frozen. Default methods let a new method ship with a body, so existing implementers inherit a working version and none breaks — that is precisely how stream(), forEach(), and sort() were retrofitted onto interfaces with vast installed bases. The cost is a narrow, controlled ambiguity: if a class implements two interfaces that both provide a default m(), it inherits two competing bodies and won\'t compile until the class overrides m() itself — inside which it can pick explicitly with A.super.m() / B.super.m(), or write its own. The compiler applies resolution rules before declaring a conflict: (1) a concrete method inherited from a superCLASS always beats any interface default ("class wins" — real implementation over a would-be default); (2) a more specific sub-interface\'s default beats a less specific parent interface\'s; (3) only if neither disambiguates does it force your explicit override. The crucial contrast with C++ multiple inheritance: only BEHAVIOUR can collide because interfaces hold no instance state, so there is no duplicated-field diamond at all, and the collision surfaces as a loud compile error resolved by hand rather than a silent linearised choice. Net: Java gained safe additive evolution of interfaces and paid only an explicit, well-scoped ambiguity.'
    },
    {
      q: 'What is a functional interface, and how do lambdas and method references relate to it?',
      a: 'A functional interface has exactly one abstract method — the SAM (Single Abstract Method) shape. Default methods, static methods, and the three Object methods (equals, hashCode, toString) don\'t count toward the one, which is why Comparator, with a single abstract compare and many defaults/statics, still qualifies. Because there is exactly one blank to fill, the compiler accepts a lambda as an instance of that interface: the lambda\'s parameters and body ARE the one method\'s implementation, and the target type is inferred from assignment or argument context — Runnable r = () -> work(); yields an object whose run() is work(). A method reference is the same construct in shorthand, passing an existing method as the function: LogEntry::effortScore, String::length, System.out::println. @FunctionalInterface is an optional annotation that makes the compiler enforce the SAM invariant — like @Override for interfaces — so a later accidental second abstract method fails at the interface rather than silently breaking every lambda targeting it. Why it matters in practice: functional interfaces turn behaviour into typed, passable values, which is the entire foundation of the streams API, comparators, callbacks, and event handlers — you hand a Predicate, Comparator, or Function to a method and it invokes your behaviour. Under the hood the JVM realises lambdas via invokedynamic and LambdaMetafactory rather than an anonymous class per lambda, but the type-level idea is simply: one abstract method, so a single expression can implement it.'
    },
    {
      q: 'Explain "program to the interface, not the implementation." Where does it matter most, and where would you deliberately break it?',
      a: 'It means declaring variables, parameters, fields, and especially return types by the most general interface that meets the need, not by the concrete class — List not ArrayList, Map not HashMap, a domain interface like Searchable not its current implementation. The payoff is substitutability: callers depend only on the capability, so the implementation can change (a different collection, an unmodifiable wrapper, a faster backend, a test double) without any caller changing. It matters MOST at boundaries — a public method returning ArrayList leaks and freezes that choice into your API forever, whereas returning List keeps the decision yours to revise — and it is the exact seam that unit testing (inject a fake implementing the interface) and dependency-injection frameworks like Spring (wire a bean into every interface-typed field) rely on; without it, both are impossible. In LogPose the search capability is an interface for precisely this reason: an in-memory keyword matcher today, an embedding-backed semantic searcher by Part 13, with every caller unchanged. Where I\'d deliberately break it: when the specific behaviour of a concrete type IS the requirement — declaring ArrayDeque because I need its deque operations that List doesn\'t expose, or LinkedHashMap because a caller genuinely depends on its ordering guarantee that Map doesn\'t promise — and on the right-hand side of construction, where the concrete type is unavoidable (new ArrayList<>()). The discipline is to name the interface for what callers depend on and reach for the concrete type only when its extra guarantee is the actual contract — and to be honest about which of the two it really is.'
    }
  ]
};
