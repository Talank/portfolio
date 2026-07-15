window.LESSONS = window.LESSONS || {};
window.LESSONS['jvm-tools-reflection'] = {
  id: 'jvm-tools-reflection',
  title: 'JVM Tools, Reflection, Annotations & How Frameworks Work',
  category: 'Part 2 — The JVM, Deeply',
  timeMin: 45,
  summary: 'Two payoffs of the JVM being a rich, introspectable runtime. First: the toolbox that ships with the JDK — jps, jstack, jmap, jstat, jcmd, JFR — that turns a hung or bloated production process from a mystery into a readable report, plus how to actually read a thread dump. Second: reflection and annotations — the runtime\'s ability to inspect and manipulate its own types — which feels academic until you realize it is the machinery underneath Spring, JUnit, Jackson, Hibernate, and essentially every framework you\'ll use. Understanding this demystifies "how does @Autowired even work?" and equips you to debug the frameworks instead of cargo-culting them.',
  goals: [
    'Reach for the right JDK tool for a symptom: jps to find PIDs, jstack for hangs, jmap for memory, jstat/JFR for live behavior',
    'Read a thread dump — identify a deadlock, a blocked thread, and a hot thread — from the states and stack frames',
    'Explain reflection: obtaining a Class object, inspecting members, and invoking methods/reading fields dynamically at runtime',
    'Describe how annotations with RUNTIME retention plus reflection power frameworks (DI, testing, serialization, ORM)',
    'Weigh reflection\'s costs — performance, lost compile-time safety, and module-system encapsulation — and when NOT to use it'
  ],
  concept: [
    {
      h: 'The JDK toolbox: making a running JVM confess',
      p: [
        'Because the JVM is a managed runtime, it can be interrogated live — and the JDK ships command-line tools that do exactly that, no extra install. <code>jps</code> lists running JVMs and their process IDs (your starting point — everything else needs a PID). <code>jstack &lt;pid&gt;</code> dumps every thread\'s current stack — the go-to for a HANG (what is each thread doing, who is blocked, is there a deadlock). <code>jmap &lt;pid&gt;</code> inspects the heap and can dump it for offline analysis — the go-to for a MEMORY problem (from the last lesson: capture, then open in MAT/VisualVM). <code>jstat &lt;pid&gt;</code> streams live GC and class-loading statistics — watch minor/major GC frequency and heap occupancy trend in real time. <code>jcmd &lt;pid&gt;</code> is the swiss-army successor that can do most of the above through one interface (thread dumps, heap dumps, GC info, and starting a recording).',
        'The heavier hitters: <b>JFR (Java Flight Recorder)</b> is a built-in, low-overhead profiler that records a timeline of events — allocations, GC, locks, method sampling, I/O — that you open in <b>JDK Mission Control</b> to see where time and memory actually go, in production, at ~1% overhead. And GUI tools <b>VisualVM</b> / <b>JConsole</b> attach to a live JVM for real-time graphs of heap, threads, and CPU. The habit worth building: when something is wrong in production, you don\'t guess — you take a thread dump AND a heap dump first, because they\'re cheap, and they usually contain the answer. A frozen service with no dump is a debugging session thrown away.'
      ]
    },
    {
      h: 'Reading a thread dump: states tell the story',
      p: [
        'A thread dump lists each thread with a STATE and its stack. The states you must recognize: <b>RUNNABLE</b> (executing or ready to — a thread stuck RUNNABLE across two dumps taken seconds apart is a HOT thread, likely a busy loop or heavy computation), <b>BLOCKED</b> (waiting to acquire a monitor lock another thread holds — the signature of lock contention), <b>WAITING</b>/<b>TIMED_WAITING</b> (parked in <code>wait()</code>, <code>join()</code>, <code>park()</code>, <code>sleep()</code> — idle, waiting to be signaled), and <b>NEW</b>/<b>TERMINATED</b> (not yet started / finished).',
        'The highest-value pattern is a <b>deadlock</b>, and a thread dump names it outright. Two threads each hold a lock the other needs: thread A is BLOCKED waiting on lock 2 while holding lock 1; thread B is BLOCKED waiting on lock 1 while holding lock 2 — neither can proceed, forever. Modern <code>jstack</code>/<code>jcmd</code> detect this and print a "Found one Java-level deadlock" section listing exactly which threads and locks are involved, so you go straight from a frozen app to the two lines of code that lock in the wrong order. For a performance problem (not a hang), take TWO dumps a few seconds apart and diff: threads RUNNABLE in the same application frames across both are where your CPU is going. This is a genuine, learnable skill — reading dumps is how senior engineers diagnose production incidents in minutes, and Part 5 (concurrency) will make the lock-ordering rules that prevent deadlock concrete.'
      ]
    },
    {
      h: 'Reflection: a program that inspects and manipulates itself',
      p: [
        'Every loaded type has a <code>Class</code> object (from the loading phase two lessons ago) — obtainable as <code>Foo.class</code>, <code>obj.getClass()</code>, or <code>Class.forName("com.x.Foo")</code> — and that object is a full, queryable description of the type: its methods, fields, constructors, annotations, superclass, and interfaces. <b>Reflection</b> is the API for reading that description and ACTING on it at runtime: list a class\'s declared methods (<code>getDeclaredMethods()</code>), find one by name, and <b>invoke</b> it on an instance (<code>method.invoke(obj, args)</code>); read or write a field (even a private one) via <code>field.setAccessible(true)</code> then <code>field.get/set</code>; construct an instance from a <code>Constructor</code> with no compile-time knowledge of the type. In short, reflection lets code work with classes it never imported and methods whose names it only learns as strings at runtime.',
        'This sounds like a party trick until you see what it enables: <b>generic machinery that operates on ANY type.</b> A serializer that turns any object into JSON must, at runtime, discover that object\'s fields and read them — reflection. A test runner that finds and calls every method you marked as a test — reflection. A dependency injector that sees a field needs a <code>UserService</code> and sets it — reflection. None of these could be written if code could only touch types it named at compile time. Reflection is the escape hatch from static typing that makes framework-level generality possible, and the price (below) is exactly the compile-time guarantees you give up to gain that generality.'
      ]
    },
    {
      h: 'Annotations + reflection = how every framework works',
      p: [
        'An <b>annotation</b> is metadata you attach to code — <code>@Override</code>, <code>@Test</code>, <code>@Autowired</code>, <code>@Entity</code> — that by itself DOES nothing; it\'s a label. What gives a label meaning is something that READS it, and annotations declared with <code>@Retention(RUNTIME)</code> survive into the running program where <b>reflection</b> can find them: <code>method.getAnnotation(Test.class)</code>, <code>field.isAnnotationPresent(Autowired.class)</code>. Put the two together and the entire mechanism of modern Java frameworks appears. JUnit: at startup it reflectively scans your class for methods annotated <code>@Test</code> and <code>invoke()</code>s each one — that\'s literally how your tests get run (Part 7). Spring: it scans for <code>@Component</code>/<code>@Service</code> classes, instantiates them reflectively, and for each field marked <code>@Autowired</code> it reflectively sets the right dependency — that\'s dependency injection (Part 9). Jackson: it reflects over an object\'s fields (respecting <code>@JsonProperty</code>) to serialize it. Hibernate: <code>@Entity</code>/<code>@Column</code> tell it how to map fields to database rows (Part 8).',
        'So the answer to "how does <code>@Autowired</code> magically work?" is: it isn\'t magic — a framework, at runtime, uses reflection to find your annotations and act on them, calling constructors, invoking methods, and setting fields it discovered by inspection. Knowing this changes how you work: you can read a framework\'s source and understand it, you can write your OWN annotation-driven tool when appropriate, and you can debug the "magic" when it misbehaves (a missing <code>@Component</code>, a wrong retention policy, a proxy intercepting a call). The costs are real and you should respect them: reflection is SLOWER than direct calls (though modern JITs and <code>MethodHandle</code>s narrow the gap, and frameworks cache reflective lookups), it discards COMPILE-TIME SAFETY (a mistyped method name is a runtime <code>NoSuchMethodException</code>, not a compile error — the price of the generality), and since Java 9 the MODULE SYSTEM can forbid reflective access to a module\'s internals unless it explicitly <code>opens</code> them (strong encapsulation — the reason you sometimes see "module does not open package to..." errors when a framework tries to reflect into your code). Use reflection to build genuinely generic infrastructure; never as a shortcut to reach a private member you could design access to properly.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Robin reads the ship, and the poneglyphs read themselves',
      text: 'When something goes wrong on the Thousand Sunny, the crew doesn\'t guess — they call Nico Robin, who can find out exactly what is happening ANYWHERE at once, sprouting eyes and ears across the whole ship (jstack: a snapshot of every thread\'s state simultaneously). If the ship has mysteriously frozen mid-voyage, Robin\'s report reads like a thread dump: this crewmate is RUNNABLE, frantically working; that one is BLOCKED, standing frozen because they need the wheel that someone else is holding; two others are WAITING, idle until signaled. And the deadlock she diagnoses in an instant is the classic one: Zoro is holding the rope, refusing to let go until he gets the wheel; Sanji is holding the wheel, refusing to let go until he gets the rope — each waiting on what the other clutches, the ship dead in the water until Robin names both and breaks the cycle (jstack\'s "Found one Java-level deadlock" pointing straight at the two). When the cargo hold is bloating with weight nobody can account for, she inventories exactly what\'s aboard and what\'s keeping it there (jmap heap dump). Now the reflection beat, which is the very soul of her power: the poneglyphs are objects that describe THEMSELVES — carved with the complete account of what they are, what they contain, how they connect to the others — and Robin is the one being alive who can read that self-description and ACT on it, invoking knowledge from a stone she never carved, calling forth history from a type she encounters for the first time (reflection: inspecting a Class you never imported and invoking its methods at runtime). And the annotations? Each poneglyph bears special markings — a small red symbol — that mean nothing on their own, just carved labels, UNTIL someone who knows how to read them arrives: the marking flags "this is a Road Poneglyph, treat me specially," and Robin, the runtime reader, finds that marking and does the special thing (an @annotation is inert metadata until a reflective reader finds it and acts). A carved label plus a reader who scans for it and responds — that is Robin and the poneglyphs, and it is exactly how every Java framework turns @Test or @Autowired from a decoration into behavior.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon reflects on the group — and the flags mean nothing until he reads them',
      text: 'When the friend-group\'s dynamics seize up, Sheldon performs a full diagnostic worthy of jstack: he assesses each person\'s exact state — Leonard is RUNNABLE (actively doing something), Howard is BLOCKED (can\'t proceed because he\'s waiting on Bernadette\'s decision, which she holds), Raj is WAITING (idle until someone includes him) — and he\'ll cheerfully announce the deadlock when he spots one: "You two are each refusing to apologize until the OTHER apologizes first — you have entered a mutual hold and neither of you can proceed," which is a social deadlock named as precisely as any thread dump names a lock cycle. Sheldon is also a living reflection API: he can take ANY person — even one he just met — and, without prior knowledge, enumerate their properties, list their "methods" (what they\'re capable of), and invoke them ("You. Do the thing where you..."), operating on a type he never formally imported by inspecting it on the spot. The annotation-plus-reader mechanism is Sheldon\'s entire relationship with rules: a label by itself is inert — a Post-it that says "Sheldon\'s spot" is just ink — but Sheldon is the RUNTIME reader who scans for that label and enforces the behavior it implies, transforming a meaningless marking into an ironclad consequence. His roommate agreement is thousands of such annotations: each clause is metadata that does nothing until Sheldon, the reflective processor, finds the relevant one and executes it ("Per section 8, paragraph 3, you have triggered the..."). And the module-system encapsulation beat is pure Sheldon too: some things are simply NOT open to reflection no matter how badly you want to inspect them — try to reflect into the private internals of his personal life and you hit a hard "that package is not open to you," access denied, strong encapsulation enforced. Labels are inert until a reader acts; some internals stay sealed regardless — Sheldon is both the reflective framework AND the module boundary.',
    },
    why: 'Robin (and Sheldon) diagnosing a frozen ship IS reading a thread dump: each member RUNNABLE / BLOCKED / WAITING, and the deadlock — Zoro holds the rope wanting the wheel, Sanji holds the wheel wanting the rope — named outright, just as jstack prints "Found one Java-level deadlock." Reflection is the poneglyph describing itself so Robin can read and invoke a type she never carved — exactly obj.getClass() then method.invoke(). And annotations are the red markings: inert carved labels that mean nothing until a runtime reader (Robin, Sheldon) scans for them and acts — which is how @Test and @Autowired become behavior. Some internals stay sealed (module encapsulation): reflect into Sheldon\'s private life and you hit "not open to you."'
  },
  storyAnim: {
    title: 'From a frozen ship to the cause: dumps, then reflection',
    h: 300,
    props: [
      { id: 'jps', emoji: '🔎', label: 'jps: find the running JVM (the PID)', x: 12, y: 12 },
      { id: 'jstack', emoji: '👁️', label: 'jstack: snapshot every thread\'s state', x: 44, y: 12 },
      { id: 'deadlock', emoji: '🔒', label: 'BLOCKED ↔ BLOCKED: deadlock, named outright', x: 78, y: 12 },
      { id: 'jmap', emoji: '📦', label: 'jmap: heap dump for a memory bloat', x: 22, y: 46 },
      { id: 'classobj', emoji: '🪨', label: 'Class object: the type describes itself', x: 56, y: 46 },
      { id: 'invoke', emoji: '⚡', label: 'method.invoke(obj): call a type you never imported', x: 86, y: 46 },
      { id: 'anno', emoji: '🏷️', label: '@Test / @Autowired: inert label…', x: 30, y: 80 },
      { id: 'reader', emoji: '🤖', label: '…until a reflective reader scans + acts (framework!)', x: 72, y: 80 }
    ],
    actors: [
      { id: 'robin', emoji: '🕵️‍♀️', label: 'Robin', x: 12, y: 30 }
    ],
    steps: [
      { c: 'Something\'s wrong in production. First, jps finds the running JVM and its PID — every other tool needs it.', p: { jps: 'lit' }, a: { robin: [12, 30] } },
      { c: 'The app is frozen. jstack snapshots every thread at once — like Robin sprouting eyes across the whole ship — showing each thread\'s state and stack.', p: { jstack: 'good' } },
      { c: 'The dump names the deadlock outright: thread A BLOCKED holding lock 1, needing lock 2; thread B BLOCKED holding lock 2, needing lock 1. Zoro\'s rope, Sanji\'s wheel. "Found one Java-level deadlock."', p: { deadlock: 'bad' } },
      { c: 'Different symptom — memory bloating. jmap captures a heap dump to open offline in MAT/VisualVM (last lesson\'s leak hunt).', p: { jmap: 'good' } },
      { c: 'Now reflection: every loaded type has a Class object that fully describes itself — methods, fields, annotations — like a poneglyph carved with its own account.', p: { classobj: 'lit' } },
      { c: 'With that description, code can invoke a method on a type it never imported: method.invoke(obj, args). Robin reads and acts on a stone she never carved.', p: { invoke: 'good' } },
      { c: 'An annotation like @Test or @Autowired is an inert label — a red marking that does nothing by itself.', p: { anno: 'lit' } },
      { c: 'Until a reflective reader — JUnit, Spring — scans for the annotation and ACTS: invoking the @Test method, injecting the @Autowired field. Label plus reader equals behavior. That is how every framework works.', p: { reader: 'good' }, a: { robin: [72, 80] } }
    ]
  },
  conceptFlow: {
    title: 'How a framework runs your annotated code (JUnit, traced)',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'You write',
        nodes: [
          { id: 'annotate', text: '@Test void addsEntry() { ... }\nan inert label on a method' },
          { id: 'retention', text: '@Test is @Retention(RUNTIME)\nso it survives into the running JVM' }
        ]
      },
      {
        label: 'Framework scans',
        nodes: [
          { id: 'classobj', text: 'Class<?> c = YourTest.class\nthe type describes itself' },
          { id: 'find', text: 'c.getDeclaredMethods()\nkeep those with @Test' }
        ]
      },
      {
        label: 'Framework acts',
        nodes: [
          { id: 'construct', text: 'reflectively new YourTest()\nno import of your class needed' },
          { id: 'invoke', text: 'method.invoke(instance)\nyour test actually runs' }
        ]
      },
      {
        label: 'The costs',
        nodes: [
          { id: 'safety', text: 'no compile-time check\nwrong name → runtime error' },
          { id: 'module', text: 'module must `opens`\nor reflection is denied' }
        ]
      }
    ],
    steps: [
      { active: ['annotate'], note: 'You annotate a method @Test. On its own this does nothing — it\'s metadata, a label with no behavior. Something must READ it.' },
      { active: ['retention'], note: '@Test is declared with RUNTIME retention, so unlike a compile-only annotation it survives into the running program where reflection can find it. Retention policy is what makes framework annotations work.' },
      { active: ['classobj'], note: 'At startup the framework obtains your class\'s Class object — the self-description produced during class loading — giving it queryable access to every method, field, and annotation.' },
      { active: ['find'], note: 'It lists the declared methods and keeps the ones where isAnnotationPresent(Test.class) is true. It has now discovered your tests without you registering them anywhere.' },
      { active: ['construct'], note: 'It reflectively constructs an instance of your test class — calling a constructor it found by inspection, for a class the framework never imported.' },
      { active: ['invoke'], note: 'It calls method.invoke(instance) on each @Test method — and THAT is the moment your test body executes. "How does JUnit run my tests?" answered: reflection over a runtime annotation.' },
      { active: ['safety'], note: 'The cost: this bypasses compile-time checking. A method the framework looks up by the wrong name fails at RUNTIME (NoSuchMethodException), not at compile time — the safety you trade away for generality.' },
      { active: ['module'], note: 'Since Java 9, if your code is a module, it must `opens` its package for the framework to reflect into it — otherwise access is denied (strong encapsulation). The reason for "module does not open package to..." errors.' }
    ]
  },
  tech: [
    {
      q: 'Give me a symptom-to-tool mapping for diagnosing a misbehaving JVM in production.',
      a: 'Start every investigation with jps to list running JVMs and get the PID — everything else needs it (or use jcmd, which can list JVMs too). Then map by symptom. APP IS HUNG / UNRESPONSIVE → jstack <pid> (or jcmd <pid> Thread.print) for a full thread dump: it shows every thread\'s state and stack, detects deadlocks explicitly, and reveals whether threads are BLOCKED on locks, WAITING on conditions, or spinning RUNNABLE. HIGH CPU → take TWO thread dumps a few seconds apart and diff: threads RUNNABLE in the same application frames across both are where CPU is going (on Linux you can also correlate a hot OS thread\'s ID from top -H with the nid in the dump). MEMORY GROWING / OOM → jmap for heap inspection and to capture a heap dump (or run with -XX:+HeapDumpOnOutOfMemoryError to grab one at the crash), then analyze in Eclipse MAT/VisualVM by retained size and path-to-GC-roots (last lesson\'s leak hunt); jstat -gc <pid> streams live GC stats to watch whether old-gen occupancy trends up. GENERAL PERFORMANCE / WHERE IS TIME SPENT → Java Flight Recorder (jcmd <pid> JFR.start / JFR.dump), a built-in ~1%-overhead profiler recording allocations, GC, locks, and method samples, opened in JDK Mission Control; JFR is safe to run in production, which is its whole point. LIVE MONITORING → VisualVM or JConsole attach for real-time graphs of heap, threads, CPU, and MBeans. jcmd is the modern one-stop front end for most of these (thread dumps, heap dumps, GC.run, JFR control, VM.flags). The professional habit worth internalizing: when production misbehaves, immediately capture a thread dump AND a heap dump because they\'re cheap and usually contain the answer — a service you restart without dumping is a diagnosis thrown away, and intermittent issues rarely reproduce on demand.'
    },
    {
      q: 'Walk me through reading a thread dump to find a deadlock and a hot thread.',
      a: 'A thread dump is a snapshot listing each thread with a name, a STATE, and its current stack trace (innermost frame on top), plus lock information. The states: RUNNABLE (executing or ready to run on the CPU), BLOCKED (waiting to ENTER a synchronized block/method whose monitor another thread holds — the fingerprint of lock contention), WAITING and TIMED_WAITING (parked in Object.wait, Thread.join, LockSupport.park, Thread.sleep, or a timed variant — idle, awaiting a signal or timeout), and NEW/TERMINATED. DEADLOCK: modern jstack/jcmd detect Java-level deadlocks automatically and print a dedicated "Found one Java-level deadlock" section that names the threads and the exact locks involved — but you can also read it manually: look for two (or more) threads in BLOCKED state where thread A is "waiting to lock <monitorX>" while its stack shows it already "locked <monitorY>", and thread B is "waiting to lock <monitorY>" while holding <monitorX> — a cycle in the who-holds-what-waits-for-what graph, which means neither can ever proceed. The fix is always to establish a consistent global lock-ordering (Part 5), and the dump hands you the two code sites that violate it. HOT THREAD (a CPU/performance problem, not a hang): a single dump isn\'t enough because a thread being RUNNABLE once is normal; take TWO dumps several seconds apart and compare — a thread that is RUNNABLE in the SAME application stack frames in both dumps is stuck doing heavy work or spinning in a loop right there, and the top application frame in that repeated stack is your hot spot. (For real profiling you\'d use JFR rather than eyeballing dumps, but the two-dumps-and-diff trick is fast and needs no setup.) Other patterns worth recognizing: many threads all BLOCKED on the same monitor means a contention bottleneck (one lock serializing everything); all worker threads WAITING with an empty work queue means the pool is idle and the bottleneck is upstream; a thread pool exhausted with every thread BLOCKED on a downstream call means a slow dependency is back-pressuring you. Reading dumps is a concrete, learnable skill that turns "the service is frozen and I don\'t know why" into a specific, fixable cause in minutes.'
    },
    {
      q: 'Explain reflection concretely — the API and a realistic use — and its costs.',
      a: 'Reflection is the runtime API for inspecting and manipulating types. The entry point is a Class object, obtained via Foo.class (compile-time known), instance.getClass() (runtime type of an object), or Class.forName("com.x.Foo") (load by name from a string — how JDBC drivers and plugins are loaded). From a Class you can enumerate and access members: getDeclaredMethods()/getDeclaredFields()/getDeclaredConstructors() (all members including private) or the getMethods() family (public, including inherited); find a specific Method by name and parameter types; and then ACT — method.invoke(targetInstance, args) calls it, field.get(instance)/field.set(instance, value) reads/writes it (calling field.setAccessible(true) first to bypass access checks for private members, subject to the module system), and constructor.newInstance(args) creates an object. You can also read annotations (getAnnotation, isAnnotationPresent), inspect generic type information, and query modifiers. A realistic use: a generic JSON serializer given any Object reflects over its declared fields, reads each value, and emits name:value pairs — it works for types it never imported precisely because it discovers the fields at runtime rather than naming them at compile time; that generality is impossible without reflection. The costs are real and you must weigh them. PERFORMANCE: reflective calls are slower than direct calls (extra indirection, access checks, autoboxing of arguments/returns), though the gap has narrowed with JIT improvements and MethodHandle/VarHandle (a faster, more type-safe alternative), and mature frameworks cache reflective lookups (resolve the Method once, reuse it) so the cost is paid at startup, not per call. LOST COMPILE-TIME SAFETY: names and types become strings and runtime lookups, so a typo\'d method name is a NoSuchMethodException at runtime instead of a compile error — you trade the compiler\'s guarantees for dynamism, which is why reflection belongs in framework infrastructure with good tests, not sprinkled through ordinary application logic. ENCAPSULATION VIOLATION: setAccessible(true) can reach private members, which breaks the invariant protections encapsulation exists to provide — legitimate for a framework that must map your fields, illegitimate as a lazy shortcut to poke a private you should have exposed deliberately. And since Java 9, the MODULE SYSTEM can deny reflective access to a module\'s internals unless the package is `opens`-ed, so deep reflection into arbitrary code is no longer unconditionally allowed. Rule of thumb: use reflection to build genuinely generic infrastructure that must operate on unknown types; never to bypass the type system or access control for convenience.'
    },
    {
      q: 'How exactly do annotations plus reflection make frameworks work? Trace @Autowired or @Test end to end.',
      a: 'An annotation is pure metadata — a label attached to a class, method, field, or parameter — that by itself has zero behavior; it does nothing until some processor reads it. The critical enabler is the RETENTION policy: an annotation declared @Retention(RetentionPolicy.RUNTIME) is preserved in the class file AND made available to reflection in the running JVM (SOURCE retention is discarded after compilation, e.g. @Override which only the compiler needs; CLASS retention is in the bytecode but not exposed to runtime reflection). Framework annotations like @Test, @Autowired, @Entity are RUNTIME-retained precisely so a framework can find them reflectively at runtime. Trace @Test (JUnit): at launch, the framework is pointed at your test classes; for each, it obtains the Class object, calls getDeclaredMethods(), and keeps every method where method.isAnnotationPresent(Test.class); it then reflectively constructs an instance of your test class (constructor.newInstance()) and calls method.invoke(instance) on each @Test method — and that invoke is literally the moment your test body runs. Lifecycle annotations (@BeforeEach, etc.) are just methods it invokes in a defined order around each test. Trace @Autowired (Spring): during context startup Spring scans the classpath for classes annotated @Component/@Service/@Repository (component scanning, itself reflection over class metadata), reflectively instantiates each as a bean, and for dependency injection it inspects each bean\'s constructors/fields/setters for @Autowired; for a field injection point it determines the required type, finds a matching bean in the container, and calls field.setAccessible(true) + field.set(bean, dependency) to wire it in — no "magic," just reflection acting on a discovered annotation. The same shape recurs everywhere: Jackson reflects over fields (honoring @JsonProperty) to serialize/deserialize; Hibernate reads @Entity/@Column/@Id to map objects to rows and generate SQL; validation frameworks read @NotNull/@Size to check constraints. Two refinements that show depth: (1) many frameworks add DYNAMIC PROXIES on top — java.lang.reflect.Proxy (or CGLIB/ByteBuddy subclassing) generates a wrapper implementing your interface at runtime so it can intercept calls, which is how @Transactional starts/commits a transaction around your method and how Spring AOP works; and (2) modern frameworks increasingly move this work to BUILD TIME (annotation processors generating code, or GraalVM native-image doing ahead-of-time reflection registration) to cut startup cost and enable native compilation — but the conceptual model remains annotation-as-metadata plus a processor that reads it. Understanding this end to end is what lets you debug "why isn\'t my bean injected?" (missing @Component, wrong scope, package not scanned) instead of treating the framework as an oracle.'
    }
  ],
  code: {
    title: 'A tiny test runner — build JUnit\'s core in 30 lines',
    intro: 'The best way to demystify "how does a framework run my annotated code?" is to build the smallest possible one. This defines a @Test annotation and a runner that reflectively finds and invokes every method marked with it — exactly JUnit\'s core mechanism, in miniature.',
    code: `import java.lang.annotation.*;
import java.lang.reflect.*;

// 1) The annotation: RUNTIME retention so reflection can see it in the running JVM.
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Test {}

// 2) Someone's test class — note it imports NOTHING about the runner.
class LogEntryTests {
    @Test void titleIsStored()      { assert "flaky".equals("flaky") : "title mismatch"; System.out.println("  ran titleIsStored"); }
    @Test void effortIsPositive()   { assert 3 > 0 : "effort must be positive";           System.out.println("  ran effortIsPositive"); }
    void notATest()                 { throw new RuntimeException("should NOT run"); }   // no @Test → skipped
    @Test void deliberatelyFails()  { assert 1 == 2 : "one is not two";                    System.out.println("  ran deliberatelyFails"); }
}

// 3) The runner: pure reflection + annotation reading. This is JUnit's heart.
public class MiniRunner {
    public static void run(Class<?> testClass) throws Exception {
        Object instance = testClass.getDeclaredConstructor().newInstance();  // reflectively construct
        int passed = 0, failed = 0;

        for (Method m : testClass.getDeclaredMethods()) {        // inspect every declared method
            if (!m.isAnnotationPresent(Test.class)) continue;    // keep only @Test-annotated ones
            m.setAccessible(true);                               // allow invoking package-private tests
            System.out.println("running " + m.getName() + "()");
            try {
                m.invoke(instance);                              // THIS is where the test body runs
                passed++;
            } catch (InvocationTargetException e) {
                // invoke wraps the test's real exception; unwrap it for a useful report
                System.out.println("  FAILED: " + e.getCause());
                failed++;
            }
        }
        System.out.println("== " + passed + " passed, " + failed + " failed ==");
    }

    public static void main(String[] args) throws Exception {
        run(LogEntryTests.class);   // discover + run every @Test, having imported none of them by name
    }
}
/* Run with assertions enabled: javac MiniRunner.java && java -ea MiniRunner
   running titleIsStored()      ->   ran titleIsStored
   running effortIsPositive()   ->   ran effortIsPositive
   running deliberatelyFails()  ->   FAILED: java.lang.AssertionError: one is not two
   == 2 passed, 1 failed ==   (notATest never ran — no @Test)
*/`,
    notes: [
      'The runner never imports LogEntryTests\' methods by name — it DISCOVERS them via getDeclaredMethods() and keeps the @Test-annotated ones. That is exactly how JUnit finds your tests: annotation (RUNTIME retention) + reflection.',
      'm.invoke(instance) is the moment a test actually executes — the answer to "how does JUnit run my test?" InvocationTargetException wraps the test\'s real failure, so you unwrap getCause() to report it (a real gotcha when using reflection).',
      'Run with java -ea to enable the assert statements. Swap @Test onto different methods and re-run: the runner adapts with zero code changes, because it operates on the annotation, not on hard-coded method names. That adaptivity is the whole point of annotation-driven frameworks.'
    ]
  },
  lab: {
    title: 'Reflectively read annotated fields — a mini-serializer',
    prompt: 'Build the core of a Jackson-style serializer. Write (1) a RUNTIME-retained annotation <code>@Include</code> targeting fields; (2) a class <code>Entry</code> with two fields annotated <code>@Include</code> (e.g. <code>String title</code>, <code>int minutes</code>) and one field WITHOUT the annotation (e.g. <code>String secret</code>); (3) a method <code>static String toLine(Object o)</code> that reflectively iterates the object\'s declared fields, and for each field marked <code>@Include</code>, appends <code>name=value</code> (call <code>setAccessible(true)</code> to read private fields), skipping unannotated ones. In a comment, answer: what would <code>toLine</code> do if <code>@Include</code> were declared with <code>SOURCE</code> retention instead of <code>RUNTIME</code>, and why?',
    starter: `import java.lang.annotation.*;
import java.lang.reflect.*;

// 1) @Include: RUNTIME retention, targets fields

class Entry {
    // 2) two @Include fields (e.g. String title, int minutes) + one un-annotated (String secret)
}

class Serializer {
    // 3) static String toLine(Object o): reflect over declared fields; for each @Include field,
    //    append "name=value" (use setAccessible(true)); skip fields without @Include.
    static String toLine(Object o) throws IllegalAccessException {
        return ""; // replace
    }
}

// Q: if @Include were @Retention(SOURCE) instead of RUNTIME, what would toLine produce, and why?
// ANSWER:`,
    checks: [
      { re: '@Retention\\s*\\(\\s*RetentionPolicy\\.RUNTIME\\s*\\)', must: true, hint: '@Include must have RUNTIME retention so reflection can see it at runtime.', pass: 'RUNTIME retention ✓' },
      { re: '@interface\\s+Include', must: true, hint: 'Declare the annotation: @interface Include.', pass: '@Include declared ✓' },
      { re: 'getDeclaredFields\\s*\\(\\s*\\)', must: true, hint: 'Iterate o.getClass().getDeclaredFields().', pass: 'iterates fields ✓' },
      { re: 'isAnnotationPresent\\s*\\(\\s*Include\\.class\\s*\\)', must: true, hint: 'Keep only fields where f.isAnnotationPresent(Include.class).', pass: 'filters by @Include ✓' },
      { re: 'setAccessible\\s*\\(\\s*true\\s*\\)', must: true, hint: 'Call f.setAccessible(true) before reading a private field.', pass: 'setAccessible ✓' },
      { re: '\\.get\\s*\\(\\s*o\\s*\\)', must: true, hint: 'Read the value with f.get(o).', pass: 'reads field value ✓' },
      { re: 'ANSWER\\s*:\\s*\\S+', must: true, hint: 'Answer: with SOURCE retention the annotation is discarded after compilation, so isAnnotationPresent is always false and NO fields would be included (empty output).', pass: 'retention rationale given ✓' }
    ],
    run: 'put all three in <code>Serializer.java</code> with a small main printing <code>toLine(new Entry(...))</code>; <code>javac Serializer.java &amp;&amp; java Serializer</code>. Confirm the two @Include fields appear and <code>secret</code> does not. Then change @Include to @Retention(SOURCE), recompile, and watch the output go empty — proving retention is what makes it work.',
    solution: `import java.lang.annotation.*;
import java.lang.reflect.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface Include {}

class Entry {
    @Include String title;
    @Include int minutes;
    String secret;                 // no @Include → excluded

    Entry(String title, int minutes, String secret) {
        this.title = title; this.minutes = minutes; this.secret = secret;
    }
}

class Serializer {
    static String toLine(Object o) throws IllegalAccessException {
        StringBuilder sb = new StringBuilder();
        for (Field f : o.getClass().getDeclaredFields()) {
            if (!f.isAnnotationPresent(Include.class)) continue;   // skip un-annotated
            f.setAccessible(true);                                 // read even private fields
            if (sb.length() > 0) sb.append(", ");
            sb.append(f.getName()).append("=").append(f.get(o));   // name=value
        }
        return sb.toString();
    }

    public static void main(String[] args) throws IllegalAccessException {
        System.out.println(toLine(new Entry("flaky triage", 90, "hunter2")));
        // -> title=flaky triage, minutes=90     (secret excluded)
    }
}

// ANSWER: With @Retention(SOURCE), the annotation is discarded by the compiler and never appears
// in the class file, so at runtime isAnnotationPresent(Include.class) is ALWAYS false. No field
// would be included and toLine would return an empty string. RUNTIME retention is exactly what
// lets reflection see the annotation in the running JVM — the linchpin of every annotation-driven
// framework.`,
    notes: [
      'toLine works on ANY object because it discovers fields at runtime rather than naming them — the same generality that lets Jackson serialize types it never imported. That is reflection\'s core value: generic machinery over unknown types.',
      'The SOURCE-retention answer is the whole lesson in one experiment: an annotation is only visible to reflection if it is RUNTIME-retained. Get the retention wrong and your framework silently sees nothing — a real, confusing bug.',
      'setAccessible(true) lets the serializer read private fields; a framework legitimately needs this, but it is exactly the encapsulation bypass to use sparingly and never as a shortcut in ordinary code. Under the module system, the class\'s package must also be `opens` for this to be permitted.'
    ]
  },
  quiz: [
    {
      q: 'Your production service is frozen and unresponsive. Which tool do you reach for first, and what does it tell you?',
      options: ['jstack (or jcmd Thread.print) for a thread dump — it shows every thread\'s state and stack and detects deadlocks, revealing whether threads are BLOCKED on locks, WAITING, or spinning', 'jmap — a heap dump is the only way to diagnose any problem', 'jstat — GC statistics explain every kind of hang', 'Just restart the service; hangs can\'t be diagnosed'],
      correct: 0,
      explain: 'A hang is a thread problem, so a thread dump is first: it shows what every thread is doing and names deadlocks outright. Robin sprouts eyes across the whole ship at once. (Restarting without a dump throws away the diagnosis — intermittent hangs rarely reproduce.)'
    },
    {
      q: 'In a thread dump, two threads are BLOCKED: A holds lock 1 and waits for lock 2; B holds lock 2 and waits for lock 1. What is this?',
      options: ['A deadlock — a cycle in the who-holds-what-waits-for-what graph; neither can ever proceed, and jstack prints a "Found one Java-level deadlock" section naming both', 'Normal lock contention that will resolve itself shortly', 'Two hot threads consuming CPU', 'A garbage collection pause'],
      correct: 0,
      explain: 'Mutual hold-and-wait = deadlock, and the tool names it explicitly. Zoro holds the rope wanting the wheel; Sanji holds the wheel wanting the rope; the ship is dead in the water. The fix is consistent lock ordering (Part 5).'
    },
    {
      q: 'What does reflection let you do that ordinary compiled code cannot?',
      options: ['Inspect a type\'s methods, fields, and annotations at runtime and invoke/read them dynamically — working with classes you never imported and method names known only as runtime strings', 'Make code run faster than direct method calls', 'Guarantee compile-time type safety for dynamic calls', 'Prevent all memory leaks automatically'],
      correct: 0,
      explain: 'Reflection is the runtime self-inspection API — obtain a Class, enumerate members, invoke them — enabling generic machinery (serializers, test runners, injectors) that operates on unknown types. The poneglyph describes itself so Robin can read a stone she never carved.'
    },
    {
      q: 'How does JUnit actually run the methods you mark with @Test?',
      options: ['It reflectively obtains your class\'s methods, keeps those with the RUNTIME-retained @Test annotation, constructs an instance, and calls method.invoke() on each — annotation + reflection, no magic', 'It scans your source code as text for the word "Test"', 'The compiler generates a call to each @Test method automatically', 'It requires you to register each test in a config file'],
      correct: 0,
      explain: 'A framework finds RUNTIME-retained annotations via reflection and acts on them: getDeclaredMethods → filter by @Test → newInstance → invoke. The red marking on the poneglyph means nothing until a runtime reader scans for it and acts.'
    },
    {
      q: 'A framework fails at startup with "module does not open package to unnamed module". What\'s the cause?',
      options: ['Since Java 9, the module system forbids reflective access into a module\'s internals unless the package is explicitly `opens`-ed — the framework\'s reflection is being denied by strong encapsulation', 'The framework jar is corrupted', 'Reflection was removed from modern Java', 'You have a memory leak in the module'],
      correct: 0,
      explain: 'Modules enforce strong encapsulation: deep reflection requires the target package to be `opens`. It\'s the intended boundary — reflect into Sheldon\'s private life and you hit "not open to you." Fix by opening the package (module-info `opens`) or adjusting how the framework accesses it.'
    }
  ],
  testFlow: {
    title: 'Test yourself: tools and reflection under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A service is pegging a CPU core at 100% but still responding. You want to find the hot code path. What\'s the quickest no-setup approach?',
        choices: [
          { text: 'Take TWO thread dumps a few seconds apart and diff them — a thread RUNNABLE in the same application frames in both is where the CPU is going', to: 'q1_right' },
          { text: 'Take a single heap dump and look at the biggest objects', to: 'q1_wrong_heap' },
          { text: 'Restart the service and hope the CPU spike doesn\'t return', to: 'q1_wrong_restart' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Exactly — a single dump can\'t distinguish a momentarily-running thread from a stuck-hot one, but two dumps seconds apart reveal threads RUNNABLE in the SAME frames both times: that repeated top frame is your hot spot. (JFR is the heavier, more precise tool, but two-dumps-and-diff needs zero setup.)', next: 'q2' },
      q1_wrong_heap: { end: true, correct: false, text: 'A heap dump diagnoses MEMORY (what\'s retained), not CPU. High CPU is about what threads are EXECUTING, so you want thread dumps — and two of them, to see which threads stay RUNNABLE in the same code.', retry: 'q1' },
      q1_wrong_restart: { end: true, correct: false, text: 'Restarting discards the evidence and the spike will likely return, still undiagnosed. Capture two thread dumps first — they\'re free and point straight at the hot frames. A frozen or hot service with no dump is a diagnosis thrown away.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'You wrote a custom @Auditable annotation and a processor that scans for it reflectively, but at runtime isAnnotationPresent always returns false. Likeliest cause?',
        choices: [
          { text: 'The annotation isn\'t declared @Retention(RUNTIME) — with the default (CLASS) or SOURCE retention it isn\'t visible to runtime reflection, so the processor never sees it', to: 'q2_right' },
          { text: 'Reflection is disabled by default and must be turned on with a flag', to: 'q2_wrong_flag' },
          { text: 'Annotations can never be read at runtime in Java', to: 'q2_wrong_never' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Right — retention policy is the linchpin. The default is CLASS (in the bytecode but NOT exposed to runtime reflection), and SOURCE is discarded after compilation. Only @Retention(RUNTIME) survives into the running JVM where reflection can find it. Add it and the processor will see your annotation.', next: 'q3' },
      q2_wrong_flag: { end: true, correct: false, text: 'There\'s no global "enable reflection" flag for reading annotations — reflection over annotations works out of the box IF the annotation is RUNTIME-retained. Your annotation is invisible because it lacks @Retention(RUNTIME), not because a flag is off.', retry: 'q2' },
      q2_wrong_never: { end: true, correct: false, text: 'They absolutely can — that\'s the entire basis of JUnit, Spring, Jackson, and Hibernate. The requirement is RUNTIME retention; a SOURCE- or CLASS-retained annotation just isn\'t available to runtime reflection. Fix the retention policy.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A teammate uses reflection with setAccessible(true) to reach into another class\'s PRIVATE field in ordinary application code, to avoid adding a getter. Good idea?',
        choices: [
          { text: 'No — that bypasses encapsulation and compile-time safety for convenience, is fragile (breaks silently if the field is renamed) and can be blocked by the module system; if you need the value, expose it deliberately through proper API', to: 'q3_right' },
          { text: 'Yes — reflection is the cleanest way to access private members', to: 'q3_wrong_clean' },
          { text: 'Yes — setAccessible makes it officially supported and safe', to: 'q3_wrong_safe' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct — reflection into private state is for framework infrastructure that must operate generically, not a shortcut in application logic. It defeats the invariant protection encapsulation provides, turns a rename into a runtime failure with no compiler warning, and may be denied under the module system. Design the access you need properly.', next: null },
      q3_wrong_clean: { end: true, correct: false, text: 'It\'s the opposite of clean: it couples your code to another class\'s private implementation detail via a string field name, with no compile-time check and a hard dependency on that internal never changing. If you legitimately need the value, add a proper accessor — don\'t reflectively pry.', retry: 'q3' },
      q3_wrong_safe: { end: true, correct: false, text: 'setAccessible(true) suppresses the access check; it does NOT make the practice safe or supported. You keep the fragility (breaks on rename, no compile check) and add module-system risk (it can be denied). Reserve it for framework code that genuinely must reflect over unknown types.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Restarting a hung or bloated production process before capturing a thread dump AND heap dump — you throw away the only evidence, and intermittent issues rarely reproduce on demand. Dump first (cheap), diagnose after.',
    'Declaring a custom annotation without @Retention(RUNTIME) and then trying to read it reflectively — the default (CLASS) and SOURCE policies aren\'t visible to runtime reflection, so your processor silently sees nothing.',
    'Forgetting that Method.invoke wraps the target\'s exception in InvocationTargetException — you must unwrap getCause() to see and report the real failure, or you\'ll misdiagnose every reflective call\'s errors.',
    'Using reflection + setAccessible(true) to reach private members in ordinary application code — it defeats encapsulation and compile-time safety, breaks silently on rename, and can be denied by the module system. Reserve it for genuine generic infrastructure.',
    'Assuming reflection is free — reflective calls are slower than direct ones and lose compile-time checking (a typo\'d name is a runtime NoSuchMethodException). Frameworks cache reflective lookups; ad-hoc reflection in a hot loop is a performance and correctness hazard.',
    'Ignoring the module system when a framework must reflect into your code — packages must be `opens`-ed for deep reflection, or you get "module does not open package" errors. Open exactly what needs opening, not the whole module.'
  ],
  interview: [
    {
      q: 'Your Java service is misbehaving in production — walk me through your diagnostic toolkit by symptom.',
      a: 'I start with jps (or jcmd) to identify the target JVM and its PID, since everything else needs it, then map by symptom. For a HANG or unresponsiveness, I take a thread dump with jstack <pid> or jcmd <pid> Thread.print: it shows every thread\'s state and stack and, crucially, auto-detects and prints Java-level deadlocks — so I can see whether threads are BLOCKED on locks (contention or deadlock), WAITING on conditions, or spinning RUNNABLE. For HIGH CPU, I take two thread dumps a few seconds apart and diff them; threads RUNNABLE in the same application frames in both are the hot paths (I can cross-reference a hot OS thread from top -H with the nid in the dump on Linux). For MEMORY growth or OOM, I capture a heap dump — with jmap, or automatically at the crash via -XX:+HeapDumpOnOutOfMemoryError — and analyze it in Eclipse MAT or VisualVM by retained size and path-to-GC-roots to find what\'s pinning memory, and I use jstat -gc to watch whether old-gen occupancy trends upward (a leak signature). For general "where is time and memory going," I use Java Flight Recorder (jcmd JFR.start/JFR.dump), a built-in ~1%-overhead profiler safe to run in production, opened in JDK Mission Control for a timeline of allocations, GC, locks, and method samples; for live monitoring I attach VisualVM or JConsole. jcmd is the modern one-stop front end for most of this. The professional habit I\'d emphasize is capturing a thread dump and heap dump BEFORE restarting anything — they\'re cheap, they usually contain the answer, and a restart destroys evidence that an intermittent problem may not surrender again. The overall approach is symptom-driven and evidence-first: hang → threads, memory → heap, CPU → two dumps or JFR, and never guess when the JVM will tell you.'
    },
    {
      q: 'Explain what reflection is, give a real use case, and discuss its downsides.',
      a: 'Reflection is Java\'s runtime API for a program to inspect and manipulate its own types. Every loaded type has a Class object — obtained via Foo.class, instance.getClass(), or Class.forName("name") — that fully describes the type: its methods, fields, constructors, annotations, superclass, and interfaces. Through reflection you can enumerate those members (getDeclaredMethods/Fields/Constructors), find a specific one, and act on it: method.invoke(instance, args) to call a method, field.get/set to read or write a field (with setAccessible(true) to reach private members), and constructor.newInstance(args) to create objects — all for types the calling code never imported and members named only as runtime strings. The canonical use case is generic infrastructure that must operate on ANY type: a JSON serializer reflects over an arbitrary object\'s fields to emit them; a test runner finds and invokes methods you annotated; a dependency injector discovers and sets annotated fields. None of these can be written with only compile-time type knowledge — reflection is the escape hatch from static typing that makes framework-level generality possible. The downsides are real and I weigh them explicitly. Performance: reflective calls are slower than direct calls due to indirection, access checks, and argument boxing, though the JIT and MethodHandle/VarHandle narrow the gap and frameworks cache lookups so the cost is mostly at startup. Lost compile-time safety: names and types become runtime strings and lookups, so a typo is a runtime NoSuchMethodException rather than a compile error — which is why reflection belongs in well-tested framework code, not scattered through application logic. Encapsulation violation: setAccessible(true) can pry into private state, defeating the invariant protection encapsulation exists to provide — legitimate for a framework mapping your fields, illegitimate as a lazy shortcut. And since Java 9 the module system can deny deep reflection unless a package is `opens`-ed, so it\'s no longer unconditionally permitted. My rule: use reflection to build genuinely generic infrastructure over unknown types; never to bypass the type system or access control for convenience.'
    },
    {
      q: 'How does a framework like Spring or JUnit actually use annotations and reflection to do its "magic"? Trace it end to end.',
      a: 'The core insight is that an annotation is inert metadata — a label with no behavior — that only matters when a processor reads it, and the enabler is RUNTIME retention: an annotation declared @Retention(RUNTIME) survives into the running JVM where reflection can find it (SOURCE retention is discarded after compilation; CLASS retention is in the bytecode but not exposed to runtime reflection). Framework annotations are RUNTIME-retained precisely so the framework can discover them reflectively. Tracing JUnit end to end: at launch it takes your test class, obtains its Class object, calls getDeclaredMethods(), keeps every method where isAnnotationPresent(Test.class) is true, reflectively constructs an instance (constructor.newInstance()), and calls method.invoke(instance) on each @Test method — that invoke is literally where your test body runs; lifecycle methods like @BeforeEach are just other methods it invokes in a defined order. Tracing Spring: during context startup it scans the classpath for classes annotated @Component/@Service/@Repository (reflection over class metadata), reflectively instantiates each as a bean, and for injection points marked @Autowired it determines the required type, finds a matching bean, and sets it via field.setAccessible(true) + field.set(bean, dependency) (or by invoking an annotated constructor/setter) — that\'s dependency injection, no magic, just reflection acting on discovered annotations. The identical pattern powers Jackson (reflect over fields honoring @JsonProperty to serialize), Hibernate (@Entity/@Column/@Id to map objects to rows), and validation (@NotNull/@Size). Two refinements that show depth: many frameworks layer DYNAMIC PROXIES on top — java.lang.reflect.Proxy or subclass-generation via CGLIB/ByteBuddy creates a runtime wrapper that intercepts calls, which is how @Transactional wraps your method in begin/commit and how Spring AOP works; and modern frameworks increasingly shift this to BUILD TIME (annotation processors generating code, GraalVM native-image doing ahead-of-time reflection registration) to cut startup and enable native images — but the mental model stays annotation-as-metadata plus a reflective processor. Understanding this is what turns "why isn\'t my bean injected?" from a mystery into a checklist: missing @Component, wrong retention, package not scanned, or a proxy intercepting the call.'
    },
    {
      q: 'What is a thread dump, how do you read one, and what patterns tell you something is wrong?',
      a: 'A thread dump is a point-in-time snapshot of every thread in the JVM, each listed with a name, a state, and its current stack trace (innermost frame on top), plus lock ownership and wait information; you capture it with jstack <pid>, jcmd <pid> Thread.print, or a SIGQUIT/Ctrl-Break to the process. Reading it starts with the thread STATES: RUNNABLE (executing or ready on the CPU), BLOCKED (waiting to enter a synchronized monitor held by another thread — the fingerprint of lock contention), WAITING/TIMED_WAITING (parked in wait/join/park/sleep — idle, awaiting a signal or timeout), and NEW/TERMINATED. The highest-value pattern is a DEADLOCK, which modern tools detect and print in a "Found one Java-level deadlock" section naming the threads and locks; manually, you\'d spot two BLOCKED threads forming a cycle — A holds monitorX and waits for monitorY while B holds monitorY and waits for monitorX — meaning neither can ever proceed, fixed by imposing a consistent global lock ordering. For a HOT-CPU problem (not a hang), one dump is insufficient because a thread being RUNNABLE once is normal; I take two dumps seconds apart and look for threads RUNNABLE in the SAME application frames in both, whose repeated top frame is the hot spot. Other diagnostic patterns: many threads BLOCKED on one monitor indicates a single lock serializing everything (a contention bottleneck to break up); all pool worker threads WAITING with an empty queue means the pool is idle and the bottleneck is upstream; a thread pool fully occupied with every thread BLOCKED on a downstream call means a slow dependency is exerting back-pressure and you may be heading for exhaustion; and a steadily growing thread count across dumps suggests threads are being created and not reaped (an unbounded executor or a thread leak). The value is that reading dumps converts "the service is frozen/slow and I don\'t know why" into a specific, located cause in minutes — and it dovetails with Part 5\'s concurrency material, where the lock-ordering and pool-sizing rules that prevent these patterns are made concrete.'
    }
  ]
};
