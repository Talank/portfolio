window.LESSONS = window.LESSONS || {};
window.LESSONS['how-java-fits-together'] = {
  id: 'how-java-fits-together',
  title: 'The Map: JDK vs JRE vs JVM, the Java Ecosystem & Where This Course Ends Up',
  category: 'Part 0 — Orientation & Setup',
  timeMin: 35,
  summary: 'Before writing a line of Java, get the map straight: what the JVM actually is, why "compiled AND interpreted" isn\'t a contradiction, what JRE and JDK add around the JVM, and how the whole ecosystem — Maven, Spring, JavaFX, Gradle — hangs off that core. The lesson ends with the destination of the entire course: LogPose, the research-log app you will design in Part 14 and build yourself, on desktop, web, and your iPhone, from one Java codebase.',
  goals: [
    'Define JVM, JRE, and JDK precisely, say which contains which, and pick the right one for a given machine (developer laptop vs server vs end user)',
    'Explain the two-step execution model — javac compiles .java to .class bytecode, the JVM interprets then JIT-compiles it — and why that gives "write once, run anywhere"',
    'Place the big ecosystem names (Maven, Gradle, Spring, JavaFX, JUnit, Hibernate) on the map: what layer each lives at and when it enters this course',
    'Explain why Java is neither "purely compiled" like C++ nor "purely interpreted" like classic Python, and what the JIT changes at runtime',
    'Describe the capstone app (LogPose) in one paragraph: what it manages, what makes its search special, and which platforms it targets'
  ],
  concept: [
    {
      h: 'The problem Java was built to solve',
      p: [
        'A C++ program is compiled directly to machine code for ONE specific CPU and operating system — compile on Linux/x86 and the binary is meaningless on a Mac with an Apple Silicon chip. In 1995, Sun Microsystems wanted programs that could ship over the network and run on ANY device. Their answer was a level of indirection that is still the defining fact about Java thirty years later: don\'t compile for a real machine at all. Compile for an imaginary, perfectly standardized one — the <b>Java Virtual Machine</b> — and then implement that imaginary machine in software, once per real platform.',
        'So the deal is: your <code>.java</code> source is compiled (by <code>javac</code>) into <b>bytecode</b> — compact instructions for the imaginary machine, stored in <code>.class</code> files. That bytecode is identical everywhere. Then each platform — macOS/ARM, Linux/x86, Windows, your iPhone via a twist we\'ll meet in Part 12 — has its own JVM implementation that knows how to execute bytecode on THAT hardware. Your program is compiled once; the platform differences are somebody else\'s solved problem (specifically, the JVM implementers\').',
        '<div class="math">You write once: Hello.java → javac → Hello.class (bytecode)<br>It runs anywhere: Hello.class → JVM-for-Mac / JVM-for-Linux / JVM-for-Windows → native execution<span class="mnote">"Write once, run anywhere" is literal: the SAME .class file, byte for byte, runs on every platform that has a JVM.</span></div>'
      ]
    },
    {
      h: 'JVM ⊂ JRE ⊂ JDK — three nested boxes',
      p: [
        'These three acronyms are the most-asked warm-up question in Java interviews, and people fumble them because they memorize definitions instead of the containment picture. It\'s three nested boxes:',
        '<ul><li><b>JVM (Java Virtual Machine)</b> — the engine. The program that loads <code>.class</code> bytecode, verifies it, executes it (interpreting at first, JIT-compiling the hot parts to native code as it learns what "hot" means), and manages memory for you (garbage collection). On its own it can run nothing useful — it doesn\'t even know what a <code>String</code> is.</li><li><b>JRE (Java Runtime Environment)</b> — the engine plus the standard library: JVM + the thousands of built-in classes (<code>String</code>, <code>ArrayList</code>, <code>HashMap</code>, file I/O, networking…) every program assumes exist. A JRE is enough to <i>run</i> Java programs. It contains no compiler: you cannot develop with only a JRE.</li><li><b>JDK (Java Development Kit)</b> — the JRE plus the developer\'s toolbox: <code>javac</code> (compiler), <code>jshell</code> (interactive REPL — you\'ll live in it during Part 1), <code>javap</code> (bytecode inspector), <code>jpackage</code> (native installer builder, Part 12), profilers, and more. This is what you install on your machine.</li></ul>',
        'One historical footnote that trips people up in interviews: since Java 11, Oracle stopped shipping a separate standalone "JRE" download. You install a JDK to develop, and to give an app to end users you bundle a trimmed-down runtime <i>inside</i> the app with <code>jlink</code>/<code>jpackage</code> (Part 12) — so the user installs "LogPose.app", never "Java". The JRE still exists as a concept and a layer; it just stopped being a product you download separately.'
      ]
    },
    {
      h: 'Compiled or interpreted? Yes.',
      p: [
        'Classic C++ is compiled ahead of time to native code. Classic Python is read and executed line-ish by line by an interpreter. Java deliberately sits in between, and the machinery is worth knowing because it explains real behavior you\'ll observe (like Java programs getting <i>faster</i> the longer they run):',
        '<ul><li><b>Step 1 — compile time:</b> <code>javac</code> compiles source to bytecode. This catches type errors, missing methods, wrong arguments — a whole class of bugs — before the program ever runs. This is why Java is "statically typed" and why your IDE can be so aggressive about red squiggles.</li><li><b>Step 2 — run time:</b> the JVM starts by <b>interpreting</b> bytecode — decent speed, instant startup. Meanwhile it profiles: which methods run thousands of times? Those "hot spots" get handed to the <b>JIT (Just-In-Time) compiler</b>, which compiles them to native machine code optimized using facts only available at runtime (which branch is actually taken, which types actually show up). Hot code ends up running at native, C++-competitive speed.</li></ul>',
        'This is also why the flagship JVM is literally named <b>HotSpot</b>. The deep dive — classloaders, bytecode format, JIT tiers, garbage collectors — is Part 2, three lessons of it. For now you need the shape: <i>compile once to bytecode, then the JVM interprets first and compiles the hot parts natively as it learns.</i>'
      ]
    },
    {
      h: 'The ecosystem map — what hangs off the core, and when this course gets there',
      p: [
        'Everything else with a famous name is a library or tool built on top of that core, and each one enters this course exactly when you can appreciate what it solves:',
        '<ul><li><b>Maven</b> (Part 6) — the build tool: fetches your dependencies, compiles, tests, and packages your project the same way on every machine. Our primary build tool for the whole course.</li><li><b>JUnit + Mockito + Testcontainers</b> (Part 7) — the testing stack: unit, integration, and end-to-end, plus TDD and the flaky-test problem you research.</li><li><b>PostgreSQL + JDBC + Hibernate/JPA</b> (Part 8) — persistence: the database and the two layers Java talks to it through.</li><li><b>Spring / Spring Boot</b> (Part 9) — the backend framework that turns Java into web services; the single most in-demand skill on Java job postings.</li><li><b>JavaFX</b> (Part 11) — desktop UIs and games; <b>libGDX</b> — games that ship to desktop, web, and mobile from one codebase.</li><li><b>Gluon + GraalVM</b> (Part 12) — the cross-platform twist: JavaFX apps compiled to run natively on Mac and iPhone (Apple forbids shipping a JIT-ing JVM on iOS, so GraalVM compiles your Java fully ahead-of-time — the exception that proves you understood the JIT rule).</li><li><b>Lucene, ONNX Runtime, pgvector</b> (Part 13) — search and NLP in Java, where this course connects to your AI course.</li><li><b>Gradle, Ant, Bazel</b> (Part 15) — the other build systems, once Maven has taught you what a build system even is.</li></ul>'
      ]
    },
    {
      h: 'The destination: LogPose',
      p: [
        'Every course needs a boss fight. Yours is <b>LogPose</b> — named after the One Piece navigation instrument that records where a ship has been and points where it must go next, which is precisely what a research log does. It\'s an app for a working research scientist: it tracks <b>paper reviews, paper writing, research ideas, experiments, mentoring, projects, and things you\'re learning</b>, in one place, with one killer feature — semantic search. You\'ll ask it <i>"what ideas did I have related to flaky tests?"</i> and it will find the entries that are <i>about</i> that, even when they never contain those words — using sentence embeddings and a vector index (the AI course\'s Part 7 machinery, reimplemented in Java).',
        'Architecturally, LogPose is the whole course in one artifact: a multi-module <b>Maven</b> project; a <b>Spring Boot</b> REST backend; <b>PostgreSQL</b> (with pgvector) for storage and semantic search; a <b>web UI</b>; a <b>JavaFX desktop app</b>; and a <b>Gluon-built iPhone/Mac client</b> — one Java codebase, every platform you own (deliberately skipping Android, which you don\'t). Part 14 contains the full design — requirements, entity-relationship diagram, API spec, module layout, milestones — and the build order. The course hands you the design and verifies every ingredient along the way; the building is yours.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky\'s universal blueprints',
      text: 'Franky has a problem: the crew keeps needing vehicles built at every island they visit — and every island\'s dock is different. Water 7 shipwrights use different tools than Sabaody\'s coating mechanics; a Sky Island workshop doesn\'t even have the same materials. Early on, Franky did it the painful way: redesign the same waver from scratch at every island, for every dock (the C++ way — recompile per platform, and heaven help you if an island\'s quirks break the design). Then he invents something better: a UNIVERSAL BLUEPRINT format. He draws each vehicle ONCE, in a strict, standardized notation that says exactly what to build without assuming anything about local tools (bytecode). Then he trains one dockmaster at each island to read that exact notation and translate it into whatever their local workshop does (a JVM per platform). Now the same blueprint, unchanged, becomes a real working vehicle on any island — write once, run anywhere. A dockmaster alone isn\'t enough, though: the blueprints assume every dock stocks standard parts — ropes, gears, Adam\'s Wood planks — so each island keeps a standard parts warehouse next to the dockmaster (the JRE: engine + standard library). And Franky\'s own workshop on the Sunny has all of that PLUS the drafting tools that create and check new blueprints in the first place (the JDK: everything the dock has, plus the tools to develop). One more trick separates a good dockmaster from a great one: the great one starts building from the blueprint immediately (interpretation — no waiting), but watches which sub-assembly the crew requests over and over — and after the tenth waver wheel, she pre-fabricates a wheel jig tuned to her own workshop\'s tools, so every wheel after that comes out at full native speed (the JIT compiling the hot spots). The longer her dock runs, the faster it gets. And the destination of all this? Every great voyage needs a Log Pose to record where the crew has been and point where they\'re going next — which is exactly the app you\'re sailing toward: LogPose, your research log, buildable at every dock you own — Mac, browser, iPhone — from one blueprint.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s roommate agreement runs on any roommate',
      text: 'Remember how Sheldon handles processes? He doesn\'t give vague instructions and hope — he writes the Roommate Agreement: an exhaustively precise document specifying exact behavior for every situation ("Section 9: the thermostat shall remain at 72 degrees"). Here\'s the trick: the agreement isn\'t written FOR Leonard. It\'s written for an idealized, standardized roommate that doesn\'t exist (the abstract JVM specification) — which is exactly why it works on ANY roommate. When Penny fills in, when Stuart crashes on the couch, each of them "implements" the same document on their own hardware — different people, same observable behavior, because the spec is precise enough to leave nothing to interpretation (the same .class file behaving identically on every platform\'s JVM). Compare that with how Penny normally operates: improvising each situation as it arises, reading the room line by line (a pure interpreter — flexible, instant to start, but she re-derives everything every time). Sheldon\'s catch: executing the agreement needs the apartment\'s standard equipment — the whiteboard, the designated cushion, the schedule on the fridge (the JRE\'s standard library; a bare roommate with no apartment around them can execute nothing). And only Sheldon\'s own desk has the tools to draft and amend the agreement itself — the notary stamp, the version history binder (the JDK: you can RUN the agreement anywhere, but you AUTHOR it in one properly equipped place). Even the JIT shows up: the first week, Leonard consciously consults the document for every rule (interpretation), but by month three, "knock-knock-knock Penny" happens at native reflex speed — the hot paths got compiled into muscle memory. Bazinga: Java is Sheldon-compiled AND Leonard-interpreted, and being both is the entire point.'
    },
    why: 'One blueprint in a strict universal notation (bytecode), a trained translator at every location (a JVM per platform), a standard parts warehouse the blueprints can assume (the JRE), and one fully-equipped workshop where blueprints are authored (the JDK) — plus a translator who starts instantly but builds jigs for the parts requested over and over (interpreter first, JIT for hot spots). Remember the nesting as "the workshop contains the warehouse contains the dockmaster": JDK ⊃ JRE ⊃ JVM.'
  },
  storyAnim: {
    title: 'Franky\'s blueprint, from drafting table to any island',
    h: 280,
    props: [
      { id: 'source', emoji: '📐', label: 'Franky\'s design (.java)', x: 10, y: 12 },
      { id: 'draft', emoji: '📋', label: 'drafting tools (javac, in the JDK)', x: 34, y: 12 },
      { id: 'blueprint', emoji: '📜', label: 'universal blueprint (.class bytecode)', x: 60, y: 12 },
      { id: 'dock1', emoji: '⚓', label: 'Water 7 dockmaster (JVM, Mac)', x: 14, y: 52 },
      { id: 'dock2', emoji: '⚓', label: 'Sabaody dockmaster (JVM, Linux)', x: 44, y: 52 },
      { id: 'dock3', emoji: '⚓', label: 'Sky Island dockmaster (JVM, Windows)', x: 74, y: 52 },
      { id: 'warehouse', emoji: '🏭', label: 'standard parts warehouse (JRE = JVM + libraries)', x: 30, y: 84 },
      { id: 'jig', emoji: '⚙️', label: 'wheel jig for hot parts (JIT → native speed)', x: 66, y: 84 }
    ],
    actors: [
      { id: 'franky', emoji: '🤖', label: 'Franky', x: 88, y: 30 }
    ],
    steps: [
      { c: 'Franky designs a vehicle once — the .java source, human-readable, full of intent.', p: { source: 'lit' } },
      { c: 'His drafting tools check every measurement and translate the design into strict universal notation. That\'s javac — and it only exists in the JDK, his own workshop.', p: { draft: 'good' } },
      { c: 'Out comes the universal blueprint: bytecode. Identical, byte for byte, no matter which island will build it.', p: { blueprint: 'good' } },
      { c: 'Each island has a dockmaster trained to read that exact notation on local tools — a JVM per platform. Same blueprint, three islands, three working vehicles.', p: { dock1: 'good', dock2: 'good', dock3: 'good' }, a: { franky: [60, 40] } },
      { c: 'The blueprints assume standard parts — ropes, gears, planks. Every dock keeps the standard warehouse stocked: JVM + standard library = JRE, enough to RUN anything.', p: { warehouse: 'good' } },
      { c: 'A great dockmaster starts building immediately (interpreting), but after the tenth identical wheel she builds a jig tuned to her workshop — the JIT compiling hot spots to native speed. The longer the dock runs, the faster it gets.', p: { jig: 'lit' } },
      { c: 'JDK ⊃ JRE ⊃ JVM: the workshop (develop) contains the warehouse (run) contains the dockmaster (execute). One blueprint, every island — including the three where LogPose will ship: Mac, browser, iPhone.', p: { source: 'good', blueprint: 'lit' } }
    ]
  },
  conceptFlow: {
    title: 'From Hello.java to native speed — the actual pipeline',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Compile time (once)',
        nodes: [
          { id: 'src', text: 'Hello.java\nsource code — for humans' },
          { id: 'javac', text: 'javac (JDK only)\ntype-checks, then compiles' },
          { id: 'bytecode', text: 'Hello.class\nbytecode — identical on every platform' }
        ]
      },
      {
        label: 'Load',
        nodes: [
          { id: 'classloader', text: 'Classloader\nfinds & loads .class files' },
          { id: 'verifier', text: 'Bytecode verifier\nrejects malformed/unsafe bytecode' }
        ]
      },
      {
        label: 'Execute (JVM)',
        nodes: [
          { id: 'interp', text: 'Interpreter\nruns bytecode immediately — instant start' },
          { id: 'profiler', text: 'Profiler\ncounts: which methods are HOT?' },
          { id: 'jit', text: 'JIT compiler\nhot methods → optimized native code' }
        ]
      },
      {
        label: 'All along',
        nodes: [
          { id: 'stdlib', text: 'Standard library (JRE)\nString, collections, I/O — assumed everywhere' },
          { id: 'gc', text: 'Garbage collector\nfrees unused objects automatically (Part 2)' }
        ]
      }
    ],
    steps: [
      { active: ['src'], note: 'You write source code for humans: names, comments, structure. No machine runs this directly.' },
      { active: ['javac'], note: 'javac — which only ships in the JDK, not the JRE — type-checks everything first. A whole class of bugs (wrong types, missing methods) dies here, before the program ever runs.' },
      { active: ['bytecode'], note: 'The output is bytecode: compact instructions for the standardized imaginary machine. This exact file runs on Mac, Linux, and Windows unchanged — that is "write once, run anywhere".' },
      { active: ['classloader', 'verifier'], note: 'At run time the JVM\'s classloader finds and loads each .class file the moment it\'s first needed, and the verifier proves the bytecode is well-formed and safe before a single instruction executes.' },
      { active: ['interp'], note: 'Execution starts by interpreting — no compilation pause, instant startup. This is the "interpreted" half of Java\'s identity.' },
      { active: ['profiler'], note: 'While interpreting, the JVM profiles the running program: call counts, hot loops, which branches actually get taken. It is learning where the time goes.' },
      { active: ['jit'], note: 'Methods that cross the "hot" threshold get JIT-compiled to native machine code, optimized with runtime facts a C++ ahead-of-time compiler could never see. This is the "compiled" half — and why the JVM is named HotSpot.' },
      { active: ['stdlib', 'gc'], note: 'Underneath it all: the standard library (the JRE layer — String, ArrayList, HashMap, file and network I/O) and the garbage collector silently reclaiming memory. Both get full lessons in Parts 2–3.' }
    ]
  },
  tech: [
    {
      q: 'If bytecode still has to be translated at runtime, why is that better than just interpreting the source code directly, like classic Python?',
      a: 'Three concrete wins. First, work is moved out of runtime: parsing text, resolving names, and checking types happen ONCE at compile time instead of on every run — bytecode is a compact, pre-digested format designed to be executed, not read. Second, the compile step is a quality gate: javac rejects entire categories of bugs (type mismatches, missing methods, wrong argument counts) before the program ships — a Python program can hide a typo in a rarely-taken branch for months, while the equivalent Java doesn\'t compile. Third, bytecode is a stable, verifiable contract: the JVM\'s verifier can prove a .class file is well-formed and memory-safe before executing it, which is what made "run code you just downloaded from the network" a sane idea in 1995 — and what makes the JVM a safe target for OTHER languages too (Kotlin, Scala, Clojure all compile to the same bytecode and run on the same JVM).'
    },
    {
      q: 'What does the JIT know that a C++ ahead-of-time compiler can\'t know, and what does it actually do with it?',
      a: 'An ahead-of-time compiler optimizes for a hypothetical average execution: it sees all the code but none of the behavior. The JIT watches the REAL execution before committing: it sees that this virtual method call always lands on the same concrete class in practice (so it can inline that implementation and skip the dispatch — with a cheap guard in case a different class ever shows up), that this branch is taken 99.9% of the time (so it lays out the machine code with the hot path straight-line), that this loop runs millions of times (so it\'s worth aggressive optimization), and that this "polymorphic" call site has only ever seen one type (so the type check can be hoisted). Crucially, these are BETS, not proofs — so JIT-compiled code carries deoptimization guards: if an assumption is ever violated (a new class gets loaded, the rare branch fires), the JVM throws away the optimized code and falls back to the interpreter, re-profiles, and re-compiles. That gamble-with-a-safety-net is something an AOT compiler structurally cannot do, and it\'s why long-running Java servers can genuinely rival C++ on hot paths.'
    },
    {
      q: 'Since Java 11 there\'s no separate JRE download — so what do end users install to run my app?',
      a: 'Nothing Java-branded at all, and that\'s the modern intent. The current model: developers install a JDK; applications BUNDLE their own runtime. jlink (Part 12) assembles a trimmed runtime image containing only the JVM plus the exact standard-library modules your app actually uses (often 40–60 MB instead of 300+), and jpackage wraps your app plus that runtime into a native installer — a .dmg/.app for Mac, .msi for Windows, .deb for Linux. The user double-clicks LogPose.app and never knows or cares that Java is inside. The "JRE" survives as a layer in the containment diagram (JVM + standard library) and as an interview question, but as a product you download separately from your app, it\'s history.'
    },
    {
      q: 'Is the JVM itself written in Java? What actually executes the first instruction?',
      a: 'No — it can\'t be, at the bottom. HotSpot (the reference JVM inside OpenJDK) is mostly C++ with some assembly for the performance-critical entry points; it\'s a native program compiled ahead-of-time for each platform, exactly like any C++ application. That\'s the resolution of the apparent chicken-and-egg: the platform-specific native JVM binary is what the OS launches, and IT then loads and executes your platform-independent bytecode. (Fun wrinkle: large parts of the JDK\'s standard library ARE written in Java and get JIT-compiled like your code — and javac itself is written in Java too. The JVM bootstraps the rest of the ecosystem, but the JVM itself stands on native code.)'
    },
    {
      q: 'Why does Apple\'s iOS ban change the story, and how does Java get onto an iPhone anyway?',
      a: 'iOS forbids apps from generating and executing machine code at runtime (a security policy: writable memory can never become executable). The JIT is exactly that — generating machine code at runtime — so a normal JVM is impossible on iOS. The workaround, which you\'ll use for LogPose\'s iPhone client in Part 12, is GraalVM Native Image: it compiles your Java (and the reachable standard library, and the substrate VM providing GC) fully AHEAD of time into one static native executable — no bytecode, no JIT, no JVM process at all on the device. The trade: you give up the JIT\'s runtime-adaptive optimizations and dynamic classloading tricks (reflection needs to be declared up front), and gain instant startup, small footprint, and App Store compliance. It\'s the exception that tests whether you really understood the rule: Java is portable because of runtime translation — and when a platform forbids runtime translation, you translate everything before you ship.'
    }
  ],
  code: {
    title: 'Your first look at Java — read it, don\'t worry about writing it yet',
    intro: 'This is the complete life story of one tiny program. Every part of this file gets its own lesson later; today you only need to recognize the moving pieces and the two commands underneath.',
    code: `// Hello.java — the source file. The class name MUST match the file name.
public class Hello {

    // The JVM looks for exactly this signature as the program's entry point:
    // public, static (no object needed yet), void (returns nothing),
    // named main, taking an array of command-line arguments.
    public static void main(String[] args) {
        String who = (args.length > 0) ? args[0] : "world";
        System.out.println("Hello, " + who + "!");
    }
}

/* In a terminal (after Lesson 0.2 installs the JDK):

   $ javac Hello.java        # compile-time: type-check, then emit bytecode
   $ ls
   Hello.java  Hello.class   # <- the universal blueprint appeared

   $ java Hello              # run-time: start a JVM, load Hello.class, run main
   Hello, world!

   $ java Hello Nami         # args[0] = "Nami"
   Hello, Nami!

   Modern shortcut (single-file programs only):
   $ java Hello.java         # compiles in memory + runs, no .class left behind
*/`,
    notes: [
      '<code>javac</code> is the drafting table (JDK-only); <code>java</code> launches the dockmaster (the JVM). Two different programs, two different phases — keep them separate in your head and the JDK/JRE/JVM question answers itself.',
      'The <code>Hello.class</code> file produced on your machine would run unchanged on a Windows or Linux box — that file IS the "write once, run anywhere" artifact.',
      'Everything here — <code>public</code>, <code>static</code>, <code>void</code>, <code>String[]</code>, why the class name matches the file name — is explained properly in Part 1. Today, recognizing the shape is enough.'
    ]
  },
  lab: {
    title: 'Label the map',
    prompt: 'No Java syntax knowledge needed yet — this lab checks the MAP. In the editor below, write one line per scenario (as a Java comment), assigning each scenario the correct tool or layer: <code>JVM</code>, <code>JRE</code>, <code>JDK</code>, <code>javac</code>, <code>bytecode</code>, or <code>JIT</code>. Scenario 1 is done for you. Then answer the bonus in a final comment: which of the six is the only one that is a FILE you ship, rather than software that runs?',
    starter: `// Scenario 1: A developer laptop that must compile, test, and package Java code.
// ANSWER 1: JDK

// Scenario 2: The layer that interprets .class instructions and manages memory.
// ANSWER 2:

// Scenario 3: What javac produces from Hello.java.
// ANSWER 3:

// Scenario 4: The component that notices a method is "hot" and compiles it to native code at runtime.
// ANSWER 4:

// Scenario 5: JVM + standard library (String, ArrayList, file I/O), but no compiler.
// ANSWER 5:

// Scenario 6: The JDK-only command-line tool that type-checks source and emits .class files.
// ANSWER 6:

// BONUS: Which one of the six is a FILE you ship rather than software that runs?
// BONUS ANSWER:`,
    checks: [
      { re: 'ANSWER\\s*2\\s*:\\s*JVM', flags: 'i', must: true, hint: 'Scenario 2: the engine that executes bytecode and manages memory is the JVM.', pass: 'Scenario 2: JVM ✓' },
      { re: 'ANSWER\\s*3\\s*:\\s*bytecode', flags: 'i', must: true, hint: 'Scenario 3: javac produces bytecode (.class files).', pass: 'Scenario 3: bytecode ✓' },
      { re: 'ANSWER\\s*4\\s*:\\s*JIT', flags: 'i', must: true, hint: 'Scenario 4: the runtime hot-spot compiler is the JIT.', pass: 'Scenario 4: JIT ✓' },
      { re: 'ANSWER\\s*5\\s*:\\s*JRE', flags: 'i', must: true, hint: 'Scenario 5: JVM + standard library, no compiler = JRE.', pass: 'Scenario 5: JRE ✓' },
      { re: 'ANSWER\\s*6\\s*:\\s*javac', flags: 'i', must: true, hint: 'Scenario 6: the compiler tool is javac.', pass: 'Scenario 6: javac ✓' },
      { re: 'BONUS\\s*ANSWER\\s*:\\s*bytecode', flags: 'i', must: true, hint: 'Bonus: bytecode (.class) is the only FILE in the list — everything else is software that runs.', pass: 'Bonus: bytecode is the shippable file ✓' }
    ],
    run: 'nothing to execute this time — this lab is pure map-labeling. Your first real compile-and-run happens in the next lesson, minutes after you install the JDK.',
    solution: `// Scenario 1: A developer laptop that must compile, test, and package Java code.
// ANSWER 1: JDK

// Scenario 2: The layer that interprets .class instructions and manages memory.
// ANSWER 2: JVM

// Scenario 3: What javac produces from Hello.java.
// ANSWER 3: bytecode

// Scenario 4: The component that notices a method is "hot" and compiles it to native code at runtime.
// ANSWER 4: JIT

// Scenario 5: JVM + standard library (String, ArrayList, file I/O), but no compiler.
// ANSWER 5: JRE

// Scenario 6: The JDK-only command-line tool that type-checks source and emits .class files.
// ANSWER 6: javac

// BONUS: Which one of the six is a FILE you ship rather than software that runs?
// BONUS ANSWER: bytecode`,
    notes: [
      'If any of these took more than a second, replay the Franky animation — the workshop (JDK) contains the warehouse (JRE) contains the dockmaster (JVM); the blueprint (bytecode) is the thing that travels; the jig (JIT) is built at the dock, not on the Sunny.',
      'The bonus matters more than it looks: bytecode being a portable FILE while every JVM is platform-specific SOFTWARE is the entire "write once, run anywhere" mechanism in one sentence.'
    ]
  },
  quiz: [
    {
      q: 'Which containment relationship is correct?',
      options: ['JDK ⊃ JRE ⊃ JVM — the development kit contains the runtime, which contains the virtual machine', 'JVM ⊃ JRE ⊃ JDK — the virtual machine contains everything', 'JRE ⊃ JDK ⊃ JVM — the runtime contains the development kit', 'They are three unrelated, side-by-side installations'],
      correct: 0,
      explain: 'The workshop contains the warehouse contains the dockmaster: JDK (develop) ⊃ JRE (run: JVM + standard library) ⊃ JVM (execute bytecode).'
    },
    {
      q: 'Why does the SAME .class file run on Mac, Linux, and Windows without recompilation?',
      options: ['Bytecode targets a standardized imaginary machine, and each platform provides its own JVM implementation that executes that bytecode on real hardware', 'The .class file contains native machine code for every popular CPU', 'The operating system translates Java bytecode itself', 'It doesn\'t — you must recompile per platform, like C++'],
      correct: 0,
      explain: 'The .class file is compiled for the abstract JVM specification. Platform differences live inside each platform\'s JVM implementation, not in your file — Franky\'s universal blueprint, readable at every trained dock.'
    },
    {
      q: 'Is Java compiled or interpreted?',
      options: ['Both, in sequence: javac compiles source to bytecode ahead of time; the JVM then interprets that bytecode and JIT-compiles the hot parts to native code at runtime', 'Purely compiled, exactly like C++', 'Purely interpreted, exactly like classic Python', 'Neither — Java source is executed directly by hardware'],
      correct: 0,
      explain: 'Two stages: compile-time (javac → bytecode, catching type errors early) and run-time (interpret immediately, profile, JIT-compile hot spots). That\'s why the JVM is named HotSpot and why Java programs speed up as they run.'
    },
    {
      q: 'A colleague\'s machine only needs to RUN a finished Java application, never compile one. Which layer is conceptually sufficient — and how does that layer usually reach an end user\'s machine today?',
      options: ['The JRE (JVM + standard library) — nowadays typically bundled inside the app itself via jlink/jpackage rather than downloaded separately', 'The full JDK — running a program requires javac', 'Just a .class file — no runtime needed', 'A C++ compiler, since the JVM is written in C++'],
      correct: 0,
      explain: 'Running needs the JVM plus the standard library — the JRE layer — but since Java 11 that runtime ships embedded inside the application (jlink/jpackage, Part 12), so users install "the app", never "Java".'
    },
    {
      q: 'What is LogPose, the capstone of this course?',
      options: ['A research-log manager (reviews, ideas, experiments, mentoring, projects, learning) with embedding-based semantic search, built as one Java codebase targeting web, Mac desktop, and iPhone', 'A Java IDE you\'ll build from scratch', 'A One Piece fan game for Android', 'A clone of Spring Boot'],
      correct: 0,
      explain: 'LogPose is the whole course in one artifact: multi-module Maven, Spring Boot + PostgreSQL/pgvector backend, semantic search over your research entries ("what ideas did I have about flaky tests?"), and web + JavaFX + Gluon iOS clients. Designed in Part 14, built by you.'
    }
  ],
  testFlow: {
    title: 'Test yourself: the map',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'Your CI build server must compile and package the project. A production server only runs the packaged app. What does each machine need, minimally?',
        choices: [
          { text: 'CI server: a JDK (it compiles). Production server: just a runtime — the JRE layer, today usually bundled with the app', to: 'q1_right' },
          { text: 'Both need the full JDK — Java machines always do', to: 'q1_wrong_jdk' },
          { text: 'Neither needs anything — .class files run directly on hardware', to: 'q1_wrong_bare' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Exactly — compiling needs javac (JDK-only); running needs only JVM + standard library (the JRE layer, typically embedded in the app image via jlink these days). Right-sizing runtimes is a real deployment decision, not trivia.', next: 'q2' },
      q1_wrong_jdk: { end: true, correct: false, text: 'The production server never compiles anything — shipping compilers to production is unnecessary surface area. Running needs only the runtime layer: JVM + standard library.', retry: 'q1' },
      q1_wrong_bare: { end: true, correct: false, text: 'Bytecode is instructions for the IMAGINARY machine — real hardware can\'t execute it. Something must translate: a JVM. That indirection is the entire portability mechanism.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A Java web server is noticeably faster after an hour of traffic than in its first minute. What explains this?',
        choices: [
          { text: 'The JIT: the JVM profiled the running code and compiled the hottest methods to optimized native code using observed runtime behavior', to: 'q2_right' },
          { text: 'The CPU physically warmed up, so electrons move faster', to: 'q2_wrong_cpu' },
          { text: 'javac keeps recompiling the source in the background as it runs', to: 'q2_wrong_javac' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Right — interpretation gives instant startup, then the profiler finds hot spots and the JIT compiles them natively, with optimizations based on what the code ACTUALLY does (real branch frequencies, real types). "JVM warmup" is a real operational phenomenon you\'ll hear about in production.', next: 'q3' },
      q2_wrong_cpu: { end: true, correct: false, text: 'Tempting Sheldon-physics, but no — the speedup is software: the JVM\'s profiler identifies hot methods and JIT-compiles them to native code as evidence accumulates.', retry: 'q2' },
      q2_wrong_javac: { end: true, correct: false, text: 'javac finished its job before deployment — it produced the bytecode and left. The runtime speedup comes from the JVM\'s own JIT compiler working on bytecode, not from recompiling source.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'Kotlin code compiles to .class files that your Java program can call directly, and vice versa. What fact from this lesson makes that possible?',
        choices: [
          { text: 'The JVM executes bytecode, not Java — any language that compiles to valid bytecode runs on the same VM and interoperates through it', to: 'q3_right' },
          { text: 'Kotlin is secretly translated into Java source code first', to: 'q3_wrong_transpile' },
          { text: 'It isn\'t possible — JVMs only accept code written in Java', to: 'q3_wrong_only' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Exactly — the JVM\'s contract is with BYTECODE, and the verifier checks the .class file, not the language it came from. Kotlin, Scala, and Clojure are all "JVM languages" for precisely this reason. The imaginary machine turned out to be the most valuable part of the design.', next: null },
      q3_wrong_transpile: { end: true, correct: false, text: 'No intermediate Java source exists — kotlinc compiles Kotlin straight to JVM bytecode, exactly as javac does for Java. The shared layer is the bytecode format, not the Java language.', retry: 'q3' },
      q3_wrong_only: { end: true, correct: false, text: 'The JVM has no idea what language produced a .class file — it verifies and executes bytecode. That language-independence is why a whole family of languages lives on the JVM.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Saying "the JVM compiles Java source code" in an interview — javac compiles source to bytecode; the JVM executes bytecode (interpreting, then JIT-compiling hot spots). Mixing these up is the classic tell of a memorized-not-understood answer.',
    'Believing "Java is slow because it\'s interpreted" — that was 1997\'s Java. Modern HotSpot JIT-compiles hot paths to native code with runtime-informed optimizations; long-running Java services routinely compete with C++ on throughput. (Startup time and memory footprint are the honest criticisms — and Part 12\'s GraalVM addresses exactly those.)',
    'Telling users to "install Java first" for your app — the modern pattern (Java 11+) bundles a trimmed runtime inside the app with jlink/jpackage. If your deployment plan involves end users downloading a JRE, you\'re shipping like it\'s 2009.',
    'Treating bytecode as secret — it decompiles trivially (javap -c shows it in seconds). Never ship credentials or secret logic in .class files handed to users.',
    'Conflating "Java the language" with "the JVM the platform" — Kotlin/Scala/Clojure run on the JVM without being Java, and (via GraalVM, Part 12) Java can run with no JVM at all. Keeping the two ideas separate makes both the ecosystem and the iOS story make sense.'
  ],
  interview: [
    {
      q: 'Explain the difference between JDK, JRE, and JVM.',
      a: 'Three nested layers. The JVM is the execution engine: it loads .class bytecode, verifies it, executes it — interpreting at first, then JIT-compiling hot methods to native code — and manages memory via garbage collection. It\'s platform-specific software implementing a platform-independent specification, which is precisely how one bytecode file runs everywhere. The JRE is the JVM plus the standard class library (String, collections, I/O, networking) — everything needed to RUN Java applications, but with no development tools: you can\'t compile with a JRE. The JDK is the JRE plus the developer toolchain — javac, jshell, javap, jar, jpackage, profilers — everything needed to DEVELOP. So JDK ⊃ JRE ⊃ JVM. Worth adding in an interview: since Java 11 the standalone JRE download is gone — developers install a JDK, and applications ship their own trimmed runtime via jlink/jpackage, so end users never install anything Java-branded at all.'
    },
    {
      q: 'Is Java compiled or interpreted?',
      a: 'Both, in two deliberate stages, and the two-stage design IS the answer. Stage one, ahead of time: javac compiles .java source to .class bytecode — a static, type-checked compilation that catches type errors, missing methods, and bad signatures before the program runs. Stage two, at runtime: the JVM begins by interpreting that bytecode, which gives instant startup, while profiling the running program. Methods that prove hot get handed to the JIT compiler, which produces native machine code optimized with facts only runtime can reveal — actual branch frequencies, actual receiver types (enabling speculative inlining of virtual calls, with deoptimization guards to fall back if an assumption breaks). So: compiled to bytecode, then interpreted, then selectively compiled again to native — which is why Java programs measurably speed up as they warm, and why the reference JVM is literally named HotSpot. The one place this story changes: platforms that forbid runtime code generation (iOS) require full ahead-of-time compilation via GraalVM Native Image, trading the JIT\'s adaptive optimization for instant startup and policy compliance.'
    },
    {
      q: 'What is bytecode, and why did Java\'s designers introduce it rather than compiling straight to machine code?',
      a: 'Bytecode is a compact instruction set for an abstract, standardized machine — the JVM specification — stored in .class files. It buys four things. Portability: the same file runs on any platform with a JVM implementation; platform differences are solved once per platform by JVM implementers, not once per program by every developer. Early error detection with late platform binding: source is fully type-checked at compile time, yet the native-code decision is deferred to runtime, where the JIT can optimize with observed behavior an ahead-of-time compiler can\'t see. Safety: bytecode is verifiable — the JVM proves a class file is well-formed and memory-safe before executing it, which is what made running untrusted network-delivered code plausible, decades before app stores. And language independence: the JVM contracts on bytecode, not Java — Kotlin, Scala, and Clojure compile to the same format and interoperate freely, which turned the JVM from a language runtime into a platform.'
    },
    {
      q: 'Your Java service shows poor performance for the first few minutes after every deploy, then stabilizes. What\'s happening and what could you do about it?',
      a: 'That\'s JVM warmup: immediately after startup everything runs interpreted, and the JIT hasn\'t yet identified and compiled the hot paths; latency and throughput improve as profiling data accumulates and hot methods get native-compiled. Options, in increasing order of effort: (1) accept and mask it — warm the service before it takes traffic, e.g. run synthetic requests against key endpoints during a pre-traffic phase, or use rolling deploys so a cold instance never takes full load; (2) tiered compilation is already the default (C1 compiles early with light optimization, C2 recompiles the hottest paths aggressively) — but you can tune thresholds if profiling shows the defaults are wrong for your workload; (3) newer JVM features like CDS/AppCDS (class data sharing) and Project Leyden-style ahead-of-time caches shorten the load-and-warm phase; (4) if startup latency is the dominant requirement — serverless, CLI tools, autoscaling that spins instances up under load — consider GraalVM Native Image, which eliminates warmup entirely by compiling ahead of time, at the cost of the JIT\'s peak adaptive performance and some dynamic-feature restrictions. The interview-winning part of this answer is naming the trade-off explicitly: JIT optimizes for long-run peak throughput, AOT optimizes for startup — pick per workload.'
    }
  ]
};
