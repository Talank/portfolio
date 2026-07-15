window.LESSONS = window.LESSONS || {};
window.LESSONS['jvm-architecture'] = {
  id: 'jvm-architecture',
  title: 'Inside the JVM: Class Loading, Bytecode, the JIT & Execution',
  category: 'Part 2 — The JVM, Deeply',
  timeMin: 55,
  summary: 'What actually happens between javac and your program running. The JVM is not a black box: a class loader finds, verifies, links, and initializes each class on demand; an execution engine interprets bytecode at first, then a Just-In-Time compiler watches which code runs hot and recompiles it to native machine code mid-flight; and a small set of runtime data areas hold the pieces. Understanding this explains startup cost, why Java "warms up", why the same bytecode runs everywhere, and a family of bugs (ClassNotFound vs NoClassDefFound, static-initializer order, classloader leaks) that mystify people who treat the JVM as magic.',
  goals: [
    'Trace a class through the three phases of loading — loading, linking (verify/prepare/resolve), and initialization — and say what happens in each',
    'Explain the classloader hierarchy and the parent-delegation model, and diagnose ClassNotFoundException vs NoClassDefFoundError',
    'Describe how the execution engine runs bytecode: interpretation first, then JIT compilation of hot methods, and what "warm-up" means',
    'Name the JVM runtime data areas (heap, metaspace, per-thread stacks, PC register) and which are shared vs per-thread',
    'Connect all of it to "write once, run anywhere" and to concrete performance and initialization behavior you can observe'
  ],
  concept: [
    {
      h: 'Loading, linking, initialization: a class arrives in three phases',
      p: [
        'When your code first NEEDS a class, the JVM brings it in through three phases (this is lazy — a class isn\'t loaded until it\'s referenced). <b>Loading:</b> a class loader locates the <code>.class</code> bytes (from a jar, a directory, the network), parses them, and creates an in-memory <code>Class</code> object representing the type. <b>Linking</b> has three sub-steps: <i>verification</i> (the bytecode verifier proves the bytecode is well-formed and type-safe — no stack overflows/underflows, no illegal casts, no jumping into the middle of an instruction; this is a load-bearing security guarantee, the reason untrusted bytecode can\'t corrupt the JVM), <i>preparation</i> (static fields get default values — 0, null, false — memory allocated but no user code run yet), and <i>resolution</i> (symbolic references to other classes/methods are turned into direct references, possibly lazily). <b>Initialization:</b> static initializers and static field assignments run, exactly once, in textual order — this is where <code>static { ... }</code> blocks and <code>static final</code> computed values execute.',
        'The order matters for real bugs. A class is initialized on first ACTIVE use — first instance creation, first static-method call, first non-constant static-field access — and the JVM guarantees this happens exactly once, thread-safely (the class-init lock). This is why the lazy-holder idiom (a static nested class holding a singleton) is a correct, lock-free lazy singleton: the nested class isn\'t initialized until first referenced, and the JVM\'s init guarantee does the synchronization for you. It also explains static-initializer-order surprises: if class A\'s static block reads class B\'s static field before B is initialized, you can observe a default value — the same "used before it exists" hazard as the constructor-calls-overridable-method trap from Part 1, one level up.'
      ]
    },
    {
      h: 'The classloader hierarchy and parent delegation',
      p: [
        'The JVM doesn\'t use one loader; it uses a hierarchy, and they cooperate by <b>parent delegation</b>. At the top, the <b>bootstrap</b> loader loads the core JDK classes (<code>java.lang.*</code>, etc.) — it\'s part of the JVM itself. Below it, the <b>platform</b> loader (called the extension loader pre-Java 9) loads certain JDK modules. At the bottom, the <b>application (system)</b> loader loads YOUR classes from the classpath/modulepath. The rule: when asked to load a class, a loader first <b>delegates UP to its parent</b>, and only loads the class itself if every ancestor fails.',
        'This upward delegation is a security and consistency mechanism. Security: you cannot hijack <code>java.lang.String</code> by putting a malicious <code>String.class</code> on your classpath, because the app loader delegates up and the bootstrap loader supplies the real one first — core types can\'t be shadowed. Consistency: a class\'s IDENTITY is (its fully-qualified name + the loader that loaded it), so delegation ensures everyone shares ONE <code>java.lang.String</code> class rather than a per-app copy. This model is also why frameworks with custom loaders (app servers, plugin systems, OSGi, hot-reload tools) are powerful but tricky — a class loaded by two different loaders is two different types that can\'t be cast to each other (<code>ClassCastException</code> between "the same" class), and a classloader that\'s never released while its classes are referenced is the classic classloader memory leak.'
      ]
    },
    {
      h: 'Bytecode, the interpreter, and the JIT that watches it run',
      p: [
        '<code>javac</code> compiles source to <b>bytecode</b> — a compact, platform-neutral instruction set for a stack machine (push operands onto an operand stack, an instruction pops them, pushes the result). Bytecode is the "write once" artifact: the SAME <code>.class</code> runs on any JVM on any OS/CPU, because each JVM knows how to execute bytecode on its platform. That\'s the entire "run anywhere" promise — portability lives at the bytecode layer, and the JVM is the per-platform translator.',
        'The execution engine starts by <b>interpreting</b>: reading each bytecode instruction and performing it. Interpretation starts instantly (no compile pause) but is slower than native code. So HotSpot (the standard JVM) adds a <b>Just-In-Time compiler</b> that watches execution and, when a method or loop runs enough times to be "hot", compiles that bytecode to optimized native machine code, which then runs directly on the CPU. This is <b>tiered compilation</b>: quick, lightly-optimized C1 code first (fast to produce), then heavily-optimized C2 code for the hottest paths (slow to produce, very fast to run). The JIT does aggressive optimizations an ahead-of-time compiler often can\'t, precisely because it sees RUNTIME behavior: inlining hot methods, de-virtualizing calls it observes to be monomorphic (the Part 1 dynamic-dispatch payoff), eliminating bounds checks it can prove safe, and escape analysis (stack-allocating objects that never escape a method).',
        'This is why Java "warms up": the first thousand iterations run interpreted or as C1 code, and only after the JIT kicks in does the method reach full speed — so a benchmark that doesn\'t warm up measures the interpreter, not the real performance (a classic microbenchmarking mistake, and why JMH exists). It also means long-running server processes get faster over their first minutes and stay fast, while short CLI tools pay startup+warmup cost every run — the trade that motivates GraalVM native-image ahead-of-time compilation (Part 12) for fast-starting executables.'
      ]
    },
    {
      h: 'Runtime data areas: where the running program lives',
      p: [
        'The JVM organizes memory into a few areas, split by whether they\'re shared across threads or private to one. <b>Shared:</b> the <b>heap</b> holds every object and array — this is what the garbage collector manages (next lesson) — and the <b>method area</b> (implemented as <b>metaspace</b> since Java 8, in native memory) holds per-CLASS data: the loaded class structures, method bytecode, the runtime constant pool, and static fields. <b>Per-thread:</b> each thread has its own <b>JVM stack</b> of frames (one frame per method call, holding that call\'s local variables and operand stack — this is what a StackOverflowError overflows and what a stack trace reads), a <b>program counter (PC) register</b> (the address of the current bytecode instruction), and a native method stack for JNI/native calls.',
        'This division explains a lot you\'ve already touched. "Objects live on the heap, references live on the stack" (the types lesson\'s box-vs-map model) is literally this layout: a local variable in a stack frame holds a reference INTO the shared heap. Why deep recursion throws StackOverflowError but a huge list throws OutOfMemoryError: the first exhausts a per-thread stack (bounded, small — set by <code>-Xss</code>), the second exhausts the shared heap (<code>-Xmx</code>). Why static fields are "one per class, shared by all instances and threads": they live in the class data in metaspace, not in any object on the heap. And why String literals are shared: the string pool lives in the heap (since Java 7) referenced from the constant pool, so every use of a literal points at one pooled object — the immutability-enables-sharing story from Part 1, now with an address.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Thousand Sunny\'s crew comes aboard on demand',
      text: 'Think of running a Java program as sailing the Thousand Sunny, and each CLASS as a crew member who only boards when the voyage first needs them — nobody is loaded onto the ship until a task actually requires them (lazy class loading). And joining the crew is never one instant step; it\'s three phases, and Franky the shipwright runs them in strict order. First, LOADING: the recruit is physically brought aboard and their papers read — who are you, what can you do (the class loader finds the .class bytes and builds the Class object). Then LINKING, which has its own three beats: verification, where the crew rigorously checks the recruit isn\'t a marine spy or a saboteur — do their claimed abilities actually hold together, will they corrupt the ship (the bytecode verifier proving type-safety, the reason no forged crewmate can wreck the JVM from inside); preparation, where their bunk and locker are allocated but still empty (static fields set to defaults, no real values yet); and resolution, where "the cook" and "the doctor" they keep referring to get matched to the actual Sanji and Chopper aboard (symbolic references resolved to real ones). Only THEN comes INITIALIZATION: the recruit unpacks, sets up their station, runs their personal setup ritual — exactly once (static initializers run once, in order). Now the delegation model, which is pure pirate hierarchy: when someone needs a task done, the request goes UP the chain of command first — a rookie doesn\'t just declare himself "the swordsman"; the request goes up to see if Zoro (the established, bootstrap-level authority) already fills that role, and only if no one above can does the newcomer take it (parent delegation: you can\'t hijack java.lang.String because the request delegates up to the bootstrap loader who supplies the real one). This is why no impostor can pose as a core crew member — the chain of command hands down the genuine article before any newcomer gets a chance. And the JIT is Luffy learning a fight in real time: the first exchanges are clumsy, interpreted move by move, but the moves he throws OVER AND OVER against a tough enemy get burned into instinct — Gear Second, a hot path compiled to something devastatingly fast — so the crew starts a battle merely competent and, minutes in, becomes unstoppable (warm-up: hot code gets JIT-compiled to native and only then hits full speed).',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'The apartment loads its residents lazily, and delegates up to Sheldon',
      text: 'Apartment 4A is a running JVM, and its rules are the JVM\'s rules. Residents and guests are CLASSES loaded ON DEMAND — Bernadette doesn\'t exist in the group\'s world until Howard first needs her, at which point she\'s properly brought in, vetted, and integrated (lazy loading, then verification, then initialization). Vetting is real and rigorous: anyone Sheldon lets into the circle is subjected to exhaustive verification — a background so thorough it might as well be the bytecode verifier proving the newcomer won\'t corrupt the group\'s carefully maintained invariants. And the delegation-to-parent model? That IS the Roommate Agreement\'s chain of authority: any request, any dispute, any "who decides this" question delegates UP to Sheldon first, and only if the higher authority genuinely has no rule does it fall to whoever asked. You cannot override a core clause by declaring your own — the request goes up the chain and Sheldon\'s canonical version is handed back down (parent delegation: core classes can\'t be shadowed from below). The static-initialization-runs-once beat is Sheldon\'s "one-time" setup rituals — the elaborate first-time configuration of anything (a new gaming console, a new roommate, a new relationship) happens exactly once, in a fixed order, and woe betide anyone who triggers it twice. And the JIT warm-up is every one of Sheldon\'s skills: he approaches a new activity — driving, a sport, a video game, physical intimacy — haltingly, step by step, narrating each move (interpreting bytecode one instruction at a time), painfully slow at first. But the things he does repeatedly get compiled into fluent, blistering competence — his "Fun with Flags" delivery, his takedowns, his route to the comic book store — hot paths optimized until they run without conscious thought. Watch Sheldon do anything for the tenth time versus the first: that gap, first-run-slow to warmed-up-fast, is the JVM every single time you start it.',
    },
    why: 'A class boards the ship only when first needed (lazy loading), in three ordered phases: loading (papers read), linking = verify (spy check — the type-safety guarantee) + prepare (empty bunk = default values) + resolve (references matched to real crew), then initialization (setup ritual, once, in order). Requests delegate UP the chain of command — to Zoro, to Sheldon — so no impostor can shadow a core member (parent delegation protecting java.lang.String). And the JIT is Luffy/Sheldon learning by repetition: clumsy and interpreted at first, then the hot path burned into instinct (Gear Second) — which is exactly why the JVM warms up and only then runs at full speed.'
  },
  storyAnim: {
    title: 'A class boards in three phases, then gets JIT-compiled when it runs hot',
    h: 300,
    props: [
      { id: 'load', emoji: '📥', label: 'LOAD: find .class bytes, build Class object', x: 12, y: 12 },
      { id: 'verify', emoji: '🔍', label: 'LINK/verify: prove bytecode type-safe (spy check)', x: 42, y: 12 },
      { id: 'prepare', emoji: '🛏️', label: 'LINK/prepare: static fields = defaults', x: 74, y: 12 },
      { id: 'resolve', emoji: '🔗', label: 'LINK/resolve: symbolic refs → real refs', x: 20, y: 46 },
      { id: 'init', emoji: '⚙️', label: 'INIT: static blocks run once, in order', x: 52, y: 46 },
      { id: 'interp', emoji: '🐢', label: 'run: interpreted, one instruction at a time', x: 82, y: 46 },
      { id: 'hot', emoji: '🔥', label: 'method runs HOT → JIT watches', x: 30, y: 80 },
      { id: 'native', emoji: '⚡', label: 'compiled to native (Gear Second) — full speed', x: 70, y: 80 }
    ],
    actors: [
      { id: 'franky', emoji: '🤖', label: 'Franky (loader)', x: 12, y: 30 }
    ],
    steps: [
      { c: 'A class is needed for the first time. LOADING: the class loader finds its bytes and builds the in-memory Class object. Nothing ran until now — loading is lazy.', p: { load: 'lit' }, a: { franky: [12, 30] } },
      { c: 'LINKING begins with verification: the bytecode verifier proves the class is type-safe and well-formed — the spy check that stops forged bytecode from corrupting the JVM.', p: { verify: 'good' } },
      { c: 'Preparation allocates static fields at their DEFAULT values (0, null, false) — bunks assigned, still empty. No user code has run.', p: { prepare: 'good' } },
      { c: 'Resolution turns symbolic references ("the cook") into direct ones (the actual Sanji). Now the class knows exactly what it points at.', p: { resolve: 'good' } },
      { c: 'INITIALIZATION runs static initializers and static assignments — exactly once, in textual order. This is where static { } blocks fire.', p: { init: 'lit' } },
      { c: 'Execution starts by INTERPRETING the bytecode one instruction at a time — instant to begin, but slow. This is the cold start.', p: { interp: 'good' } },
      { c: 'A method that runs over and over gets flagged HOT. The JIT compiler watches it, gathering runtime profile data (which branches, which types).', p: { hot: 'bad' } },
      { c: 'The JIT compiles the hot method to optimized native code — inlined, de-virtualized, bounds-checks removed. Gear Second engaged: this path now runs at full CPU speed. That gap is why Java "warms up".', p: { native: 'good' }, a: { franky: [70, 80] } }
    ]
  },
  conceptFlow: {
    title: 'From javac to full-speed native: the life of your code',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Ahead of time',
        nodes: [
          { id: 'javac', text: 'javac Foo.java\nsource → portable bytecode' },
          { id: 'classfile', text: 'Foo.class\nsame bytes run on any JVM' }
        ]
      },
      {
        label: 'Loading',
        nodes: [
          { id: 'delegate', text: 'app loader asks parent first\n(parent delegation)' },
          { id: 'threephase', text: 'load → link(verify/prepare/resolve) → init\ndone once, lazily' }
        ]
      },
      {
        label: 'Execution',
        nodes: [
          { id: 'interp', text: 'interpreter\nruns bytecode instantly, slowly' },
          { id: 'profile', text: 'JVM profiles\ncounts hot methods/loops' },
          { id: 'jit', text: 'JIT (C1 → C2)\nhot code → native, optimized' }
        ]
      },
      {
        label: 'Where it lives',
        nodes: [
          { id: 'heap', text: 'heap (shared)\nobjects, arrays, string pool' },
          { id: 'stack', text: 'stack (per-thread)\nframes, locals, references' }
        ]
      }
    ],
    steps: [
      { active: ['javac'], note: 'javac compiles source to bytecode — NOT native code. Bytecode is a portable instruction set for the JVM\'s stack machine, the "write once" artifact.' },
      { active: ['classfile'], note: 'The .class file is platform-neutral: the identical bytes run on Windows, Linux, and macOS, on x86 and ARM, because each platform ships a JVM that knows how to execute bytecode there. Portability lives at this layer.' },
      { active: ['delegate'], note: 'When a class is first needed, the loader that\'s asked delegates UP to its parent, loading the class itself only if all ancestors fail — so core types (java.lang.String) can\'t be shadowed by your classpath.' },
      { active: ['threephase'], note: 'The class goes through loading, linking (verify the bytecode, prepare static fields to defaults, resolve references), and initialization (run static blocks once, in order) — lazily, on first active use.' },
      { active: ['interp'], note: 'Execution begins by interpreting: reading and performing each bytecode instruction. Zero compile pause, so startup is immediate — but it\'s slower than native code.' },
      { active: ['profile'], note: 'While interpreting, HotSpot counts how often each method and loop runs, building a runtime profile of what\'s hot and how branches and types actually behave.' },
      { active: ['jit'], note: 'Hot code is JIT-compiled to native — quick C1 code first, then heavily-optimized C2 for the hottest paths: inlining, de-virtualization, bounds-check elimination, escape analysis. This is why Java warms up to full speed.' },
      { active: ['heap'], note: 'Objects and arrays live on the shared heap — what the GC manages next lesson — along with the string pool. Every thread sees the same heap.' },
      { active: ['stack'], note: 'Each thread has its own stack of frames; a local variable in a frame holds a REFERENCE into the shared heap. Deep recursion overflows this per-thread stack (StackOverflowError); a huge object graph exhausts the heap (OutOfMemoryError).' }
    ]
  },
  tech: [
    {
      q: 'Walk the three phases of class loading precisely, and give me a bug each phase explains.',
      a: 'Loading: a class loader locates the .class bytes (classpath, jar, module, network) and constructs the runtime Class object — this is where ClassNotFoundException (a loader was explicitly asked, e.g. via Class.forName, and couldn\'t find the bytes) and the load-time flavor of NoClassDefFoundError (a class that was present at COMPILE time is absent at RUNTIME) originate. Linking has three sub-steps. Verification: the bytecode verifier proves the class is well-formed and type-safe — operand stack never under/overflows, no illegal casts, control flow never jumps into the middle of an instruction, final classes aren\'t subclassed; failure throws VerifyError, and this step is the security cornerstone that lets a JVM run untrusted bytecode without it corrupting memory. Preparation: static fields are allocated and set to their DEFAULT values (0/null/false) — crucially, no initializer code runs yet, which is why a static field is briefly observable at its default. Resolution: symbolic references (names) to other classes, fields, and methods are resolved to direct references, sometimes lazily on first use; a broken reference here surfaces as NoSuchMethodError/NoSuchFieldError, the classic "compiled against one library version, ran against another" failure. Initialization: static initializer blocks and static field assignments execute exactly once, in textual order, triggered by first ACTIVE use (new instance, static method call, non-constant static field read) — this phase explains static-init-order bugs (reading another class\'s static before it\'s initialized yields its default) and, positively, the lazy-holder singleton idiom, which relies on the JVM initializing a static nested class only on first reference, thread-safely, with no explicit locking. Naming the right phase for a given error is a strong interview signal.'
    },
    {
      q: 'Explain parent delegation and why ClassNotFoundException and NoClassDefFoundError are different.',
      a: 'Parent delegation: the loaders form a hierarchy — bootstrap (core JDK, part of the JVM) → platform → application (your classpath). When a loader is asked to load a class, it FIRST delegates the request to its parent, and only attempts to load the class itself if every ancestor fails to. Two payoffs: security (you can\'t substitute a malicious java.lang.String, because the app loader delegates up and the bootstrap loader supplies the genuine one before your copy is ever consulted — core classes can\'t be shadowed from below) and consistency (a class\'s runtime IDENTITY is its fully-qualified name PLUS the loader that defined it, so delegation ensures one shared java.lang.String rather than per-app duplicates). A subtle consequence: the same .class loaded by two DIFFERENT loaders yields two DISTINCT types that aren\'t assignment-compatible — casting between them throws ClassCastException even though the name is identical, a real headache in app servers and plugin systems, and the mechanism behind hot-reload (throw away a loader, load a fresh one). Now the two errors people conflate. ClassNotFoundException is a CHECKED exception thrown when code EXPLICITLY asks a loader for a class by name — Class.forName("com.x.Y"), loadClass(...) — and the bytes aren\'t found; it means "I went looking for a class by name at runtime and it wasn\'t there" (typical cause: a JDBC driver or reflectively-loaded class missing from the classpath). NoClassDefFoundError is an ERROR thrown by the JVM when a class that WAS available at compile time is missing (or failed to initialize) at the point the JVM tries to link a normal reference to it — you didn\'t ask by name, the JVM did on your behalf. A notorious variant: if a class\'s static initializer THREW the first time (ExceptionInInitializerError), every subsequent use reports NoClassDefFoundError ("Could not initialize class") — the class loaded fine but is permanently unusable, which misleads people into hunting a missing jar that\'s actually present. So: ClassNotFound = couldn\'t FIND it when explicitly asked; NoClassDefFound = it was there at compile time but isn\'t usable now.'
    },
    {
      q: 'How does the JIT make Java fast, and why does "warm-up" exist? What can the JIT do that an AOT compiler struggles with?',
      a: 'The execution engine starts by interpreting bytecode — reading and performing each instruction, which begins instantly (no compile pause) but runs slower than native code. HotSpot layers a JIT compiler on top with tiered compilation: it profiles execution (counting method/loop invocations and recording branch and type behavior), and when code crosses a "hotness" threshold it compiles that method to native machine code — first with C1 (fast to compile, lightly optimized) and then, for the hottest paths, C2 (slow to compile, aggressively optimized). The compiled code replaces interpretation for that method (on-stack replacement can even swap a long-running loop mid-execution). "Warm-up" is the transient: the first N executions run interpreted or as C1, and only after the JIT produces C2 does the method hit peak speed — so a server process gets faster over its first minutes and stays fast, while a short CLI tool pays startup+warmup every invocation (the motivation for GraalVM native-image AOT in Part 12, which trades peak throughput for instant startup). The counterintuitive part is that the JIT often BEATS an ahead-of-time compiler on long-running code precisely BECAUSE it sees runtime reality: it inlines hot methods (turning a call into inline code, then optimizing across the boundary); it de-virtualizes — a virtual call the profiler observes to always hit one implementation gets compiled as a direct, inlinable call (with a guard to deopt if the assumption breaks), which is what makes Part 1\'s dynamic dispatch essentially free on hot paths; it eliminates array bounds checks and null checks it can prove redundant; and it does escape analysis, stack-allocating or scalar-replacing objects that never escape a method so they cost nothing to "allocate". An AOT compiler must be conservative because it can\'t observe the actual workload — it doesn\'t know which call site is monomorphic or which branch is never taken for THIS program\'s inputs. The practical corollaries: never microbenchmark without warm-up (you\'ll measure the interpreter — use JMH, which warms up and prevents dead-code elimination), and expect deoptimization pauses when the JIT\'s speculative assumptions are invalidated.'
    },
    {
      q: 'Lay out the JVM runtime data areas, which are shared vs per-thread, and connect them to errors and behaviors I can observe.',
      a: 'Shared across all threads: the HEAP holds every object and array (managed by the GC — next lesson), including the string pool since Java 7; and the METHOD AREA — implemented as METASPACE in native (off-heap) memory since Java 8 — holds per-CLASS data: loaded class metadata, method bytecode, the runtime constant pool, and static fields. Per-thread and private: each thread has a JVM STACK of frames (one frame per in-progress method call, holding that call\'s local variable slots and its operand stack), a PC REGISTER (the address of the bytecode instruction currently executing in that thread), and a native method stack for JNI/native calls. This layout demystifies a lot. "References on the stack, objects on the heap" (the Part 1 box-vs-map model) is literal: a local slot in a stack frame holds a reference pointing into the shared heap, which is why passing an object shares the object but reassigning a parameter doesn\'t affect the caller (Java is pass-by-value of the reference). StackOverflowError vs OutOfMemoryError: deep/infinite recursion exhausts a per-thread stack, which is small and bounded (tune with -Xss), while accumulating too many live objects exhausts the shared heap (tune with -Xmx) — two different limits, two different errors. A stack trace is literally a snapshot of one thread\'s stack frames, top frame = innermost call (the Part 1 exceptions lesson, now with a home). Static fields being "one per class, shared by every instance and thread" follows from their living in class data in metaspace, not in any heap object — which is also why static mutable state is a concurrency hazard (all threads see the one copy). And Metaspace can itself run out (OutOfMemoryError: Metaspace), classically from a classloader leak that keeps loading classes without releasing old loaders — tying straight back to the delegation/identity discussion. Knowing which area a symptom points at is how you turn a cryptic OOM into a targeted fix.'
    }
  ],
  code: {
    title: 'Watching the three phases fire — static init order made visible',
    intro: 'You can OBSERVE class loading and initialization order with print statements in static blocks. This tiny program makes the "lazy, once, in order" rules concrete — and demonstrates the classic static-init-order surprise.',
    code: `public class Phases {

    // A class whose loading/initialization we can watch.
    static class Config {
        static final String NAME;          // prepared to null (default), then initialized below
        static int accessCount = 0;        // prepared to 0

        // static initializer: runs ONCE, on first active use, in textual order
        static {
            System.out.println("  [Config] static init running");
            NAME = "LogPose";              // assigned during INITIALIZATION, not preparation
        }

        static String describe() {
            accessCount++;
            return NAME + " (accessed " + accessCount + "x)";
        }
    }

    // Demonstrates the static-init-ORDER hazard between two classes.
    static class A {
        static int x = B.y + 1;            // reads B.y — forces B to initialize first? see output
        static { System.out.println("  [A] initialized, x=" + x); }
    }
    static class B {
        static int y = 10;
        static { System.out.println("  [B] initialized, y=" + y); }
    }

    public static void main(String[] args) {
        System.out.println("main starts — Config NOT yet initialized (lazy)");

        // First ACTIVE use of Config: this triggers its initialization, exactly here.
        System.out.println("first call: " + Config.describe());
        System.out.println("second call: " + Config.describe());  // no re-init; runs once

        System.out.println("--- init order ---");
        System.out.println("A.x = " + A.x);   // touching A triggers A's init, which reads B.y
    }
}
/* Expected output:
main starts — Config NOT yet initialized (lazy)
  [Config] static init running        <- initialization happened only on first use
first call: LogPose (accessed 1x)
second call: LogPose (accessed 2x)    <- static block did NOT run again
--- init order ---
  [B] initialized, y=10               <- reading B.y forced B to initialize BEFORE A finished
  [A] initialized, x=11
A.x = 11
*/`,
    notes: [
      'Config\'s static block runs on FIRST active use (Config.describe()), not at program start — proving initialization is lazy — and it runs exactly ONCE no matter how many times describe() is called.',
      'When A initializes, its static field reads B.y; that active use of B forces B to fully initialize FIRST, so you see "[B] initialized" before "[A] initialized". Reverse the dependency into a cycle and one class would observe the OTHER\'s field at its default value — the static-init-order bug.',
      'Run it: javac Phases.java && java Phases. Add -verbose:class to the java command to watch every class the JVM loads, and -Xlog:class+init if you want the JIT/loader chatter — a great way to SEE the laziness.'
    ]
  },
  lab: {
    title: 'Predict and prove the lazy-init guarantee',
    prompt: 'Demonstrate that class initialization is lazy and happens exactly once. Write (1) a class <code>Counter</code> with a <code>static int loads</code>, a <code>static { }</code> block that prints "Counter init" and sets <code>loads = 1</code> (so a re-run would be visible), and a <code>static int next()</code> returning an incrementing value; (2) a class <code>Holder</code> with a <code>public static void main</code> that prints "before" BEFORE any use of <code>Counter</code>, then calls <code>Counter.next()</code> twice, printing each result; (3) in a comment, answer: does "Counter init" print before or after "before", and how many times does it print? Explain in one sentence why.',
    starter: `class Counter {
    static int loads;         // prepared to 0
    static int value = 0;

    // static initializer: print "Counter init", set loads = 1

    static int next() {
        // return an incrementing value
        return 0; // replace
    }
}

public class Holder {
    public static void main(String[] args) {
        System.out.println("before");
        // call Counter.next() twice, print each
    }
}

// Q: does "Counter init" print before or after "before", and how many times? Why?
// ANSWER:`,
    checks: [
      { re: 'class\\s+Counter', must: true, hint: 'Declare class Counter.', pass: 'Counter declared ✓' },
      { re: 'static\\s*\\{', must: true, hint: 'Counter needs a static initializer block: static { ... }.', pass: 'static block ✓' },
      { re: '"Counter init"', must: true, hint: 'The static block must print "Counter init" so you can see WHEN it runs.', pass: 'init marker printed ✓' },
      { re: 'loads\\s*=\\s*1', must: true, hint: 'Set loads = 1 inside the static block.', pass: 'loads set ✓' },
      { re: 'static\\s+int\\s+next\\s*\\(', must: true, hint: 'Declare static int next().', pass: 'next() declared ✓' },
      { re: '"before"', must: true, hint: 'main must print "before" prior to any use of Counter.', pass: '"before" printed first ✓' },
      { re: 'Counter\\.next\\s*\\(\\s*\\)', must: true, hint: 'Call Counter.next() (twice) — this is the first ACTIVE use that triggers initialization.', pass: 'Counter used ✓' },
      { re: 'ANSWER\\s*:\\s*\\S+', must: true, hint: 'Answer: "Counter init" prints AFTER "before" (lazy) and exactly ONCE (init runs once).', pass: 'prediction given ✓' }
    ],
    run: 'put both classes in <code>Holder.java</code>; <code>javac Holder.java &amp;&amp; java Holder</code>. Confirm "before" prints first, then "Counter init" ONCE, then the two next() results. Re-run with <code>java -verbose:class Holder</code> to watch the JVM load each class on demand.',
    solution: `class Counter {
    static int loads;
    static int value = 0;

    static {
        System.out.println("Counter init");
        loads = 1;
    }

    static int next() {
        return ++value;
    }
}

public class Holder {
    public static void main(String[] args) {
        System.out.println("before");
        System.out.println(Counter.next());   // triggers Counter's init HERE, first active use
        System.out.println(Counter.next());   // no re-init
    }
}

// ANSWER: "Counter init" prints AFTER "before", and exactly ONCE. Class initialization is
// lazy (deferred until the first active use of Counter, which is the first next() call, not
// program start) and the JVM guarantees the static initializer runs exactly once, thread-safely.`,
    notes: [
      '"before" printing first proves laziness: Counter isn\'t initialized at program start, only when first actively used. This is exactly what makes the lazy-holder singleton idiom work.',
      '"Counter init" printing once — despite two next() calls — is the JVM\'s exactly-once initialization guarantee, and it\'s thread-safe without any lock you wrote (the class-init lock does it).',
      'Run with -verbose:class to watch the loader bring in Counter on demand. This same laziness is why an unused class costs nothing and why static-init-order bugs are about WHICH class gets touched first.'
    ]
  },
  quiz: [
    {
      q: 'In which phase of class loading are static initializer blocks and static field assignments actually executed?',
      options: ['Initialization — the final phase, triggered lazily on first active use, running exactly once in textual order', 'Loading — as soon as the .class bytes are read', 'Preparation — when static fields are allocated', 'Verification — while the bytecode is being checked'],
      correct: 0,
      explain: 'Preparation only sets static fields to DEFAULTS (0/null/false); the real assignments and static { } blocks run in Initialization, the last phase, once, on first active use. Franky\'s recruit unpacks and runs their setup ritual only after loading, verifying, and resolving.'
    },
    {
      q: 'Why can\'t you replace java.lang.String by putting your own String.class on the classpath?',
      options: ['Parent delegation — the application loader delegates the request UP to the bootstrap loader, which supplies the genuine core class before your copy is ever consulted', 'The JVM scans for malicious files and deletes them', 'String is compiled directly into machine code and never loaded', 'Your String.class would work fine and replace the real one'],
      correct: 0,
      explain: 'Loaders delegate up first; core types are supplied by the bootstrap loader before any lower loader gets a chance, so they can\'t be shadowed. Requests go up the chain of command — to Sheldon, to the bootstrap loader — and the canonical version comes back down.'
    },
    {
      q: 'You get NoClassDefFoundError: "Could not initialize class Config". Most likely cause?',
      options: ['Config\'s static initializer threw an exception the first time it ran (ExceptionInInitializerError), leaving the class permanently unusable — the jar is likely present, not missing', 'The Config.class file is definitely missing from the classpath', 'You called Class.forName("Config") and it wasn\'t found', 'Config was never compiled'],
      correct: 0,
      explain: 'The "Could not initialize" wording is the tell: the class LOADED fine but its static init failed, so every later use throws NoClassDefFoundError. People waste hours hunting a missing jar that\'s actually there — look at the static initializer. (A truly missing class when explicitly asked would be ClassNotFoundException.)'
    },
    {
      q: 'Why does the same Java benchmark report much better numbers after running for a while?',
      options: ['JIT warm-up — early iterations run interpreted or as lightly-optimized C1 code; only after hot methods are compiled to optimized C2 native code does the benchmark hit peak speed', 'The garbage collector permanently frees more memory over time', 'The bytecode rewrites itself to be shorter', 'Java caches the benchmark\'s output and stops recomputing'],
      correct: 0,
      explain: 'The interpreter starts instantly but slowly; the JIT compiles hot paths to native and only then reaches full speed. Measuring without warm-up measures the interpreter — the classic microbenchmark mistake (use JMH). Luffy is clumsy at first, then Gear Second.'
    },
    {
      q: 'Deep infinite recursion throws StackOverflowError, but building an enormous list throws OutOfMemoryError. Why different errors?',
      options: ['Recursion exhausts the small, bounded per-thread JVM stack (frames); a huge object graph exhausts the shared heap where all objects live — two different memory areas with two different limits', 'They\'re actually the same error with different names', 'StackOverflowError means the CPU is too slow', 'OutOfMemoryError only happens on 32-bit systems'],
      correct: 0,
      explain: 'Each thread has its own stack of call frames (bounded, -Xss) — recursion fills it. Objects live on the shared heap (-Xmx) — too many live ones fill that. Knowing which area a symptom points at is how you turn a cryptic error into a fix.'
    }
  ],
  testFlow: {
    title: 'Test yourself: the JVM under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'Your program prints "starting" and only THEN does a class\'s static block print its message, even though that class is referenced in a method defined earlier. Bug or expected?',
        choices: [
          { text: 'Expected — class initialization is LAZY, deferred until the first ACTIVE use (instance creation, static call, non-constant static read), not when the class is merely defined or referenced in unreached code', to: 'q1_right' },
          { text: 'A bug — static blocks must run at program startup, before main', to: 'q1_wrong_startup' },
          { text: 'A bug — the class failed to load and is silently skipping initialization', to: 'q1_wrong_fail' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Exactly — the JVM initializes a class only on its first active use, so a class referenced but not yet USED stays uninitialized. This laziness is a feature (unused classes cost nothing; the lazy-holder singleton relies on it), not a bug. Bernadette doesn\'t exist until Howard first needs her.', next: 'q2' },
      q1_wrong_startup: { end: true, correct: false, text: 'Only the class holding main is initialized to start; every other class waits for its first active use. That deferral is exactly what you\'re observing, and it\'s by design — the JVM doesn\'t eagerly initialize the world.', retry: 'q1' },
      q1_wrong_fail: { end: true, correct: false, text: 'A failed initialization would throw (ExceptionInInitializerError, then NoClassDefFoundError) — loudly, not silently. What you see is normal lazy initialization firing at first active use.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A plugin framework loads the same Plugin.class with two different custom classloaders, then tries to cast an instance from one to the type from the other. Result?',
        choices: [
          { text: 'ClassCastException — a class\'s identity is (name + defining loader), so the same bytes under two loaders are two DISTINCT, incompatible types despite the identical name', to: 'q2_right' },
          { text: 'It works fine — same class name means same type', to: 'q2_wrong_same' },
          { text: 'NoClassDefFoundError — the second loader can\'t find the class', to: 'q2_wrong_notfound' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Runtime type identity includes the DEFINING LOADER, so "the same class" loaded twice is two types that won\'t cast to each other — a real gotcha in app servers, OSGi, and hot-reload systems (and the very mechanism that makes hot-reload work: discard a loader, load fresh). Share such types via a COMMON parent loader.', next: 'q3' },
      q2_wrong_same: { end: true, correct: false, text: 'Same NAME is not same TYPE at runtime — identity is name PLUS defining loader. Two loaders, two types, ClassCastException on the cross-cast. This is precisely why plugin systems must load shared interfaces from a common parent loader.', retry: 'q2' },
      q2_wrong_notfound: { end: true, correct: false, text: 'Both loaders found and loaded the class fine — that\'s the setup. The failure is at the CAST: two loaders produce two incompatible types with the same name, so it\'s ClassCastException, not a not-found error.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'You need a Java program that STARTS as fast as possible for a short-lived CLI tool run thousands of times. The JIT warm-up cost hurts. What\'s the right lever?',
        choices: [
          { text: 'Consider ahead-of-time compilation (GraalVM native-image): compile to a native executable that starts instantly with no warm-up — trading some peak long-run throughput for fast startup, exactly the CLI-vs-server trade-off', to: 'q3_right' },
          { text: 'Add more -Xmx heap so the JIT compiles everything immediately at startup', to: 'q3_wrong_heap' },
          { text: 'Nothing can be done — all Java programs have identical startup cost', to: 'q3_wrong_nothing' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Right trade identified: the JIT rewards long-running processes (a server gets faster over minutes) but penalizes short CLI runs that pay startup+warmup every time. AOT native-image (Part 12) compiles ahead of time for instant startup, giving up some peak throughput you\'d never reach in a short run anyway.', next: null },
      q3_wrong_heap: { end: true, correct: false, text: 'Heap size doesn\'t drive JIT timing — the JIT compiles based on execution HOTNESS, which a short run never reaches regardless of heap. The startup problem is warm-up itself; the lever is AOT compilation (native-image), not more memory.', retry: 'q3' },
      q3_wrong_nothing: { end: true, correct: false, text: 'Startup cost varies a lot and is addressable: AOT native-image gives near-instant startup, and even on the standard JVM, class-data sharing (CDS/AppCDS) and tiered-compilation tuning help. The CLI-vs-server startup difference is real and fixable.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Assuming static initializers run at program startup — they run LAZILY on a class\'s first active use, exactly once. Code that depends on eager initialization ordering will surprise you; touch the class explicitly if you need it initialized at a known point.',
    'Confusing ClassNotFoundException (checked; you explicitly asked a loader by name and the bytes weren\'t found) with NoClassDefFoundError (error; present at compile time, absent or un-initializable at runtime — including the "static initializer threw" case). They point at different root causes.',
    'Microbenchmarking without warm-up — you measure the interpreter, not JIT-compiled code, and get numbers off by an order of magnitude. Use JMH, which warms up and defeats dead-code elimination.',
    'Circular static-initialization dependencies — if class A\'s static init reads class B\'s static field while B\'s init reads A\'s, one class observes the other at its DEFAULT value. Keep static initialization acyclic and simple.',
    'Classloader leaks — retaining a reference to a classloader (or any of its loaded classes/instances) prevents unloading its whole class set, eventually exhausting Metaspace. Common in undeployed web apps and hot-reload gone wrong; watch for OutOfMemoryError: Metaspace.',
    'Expecting the same class loaded by different classloaders to be interchangeable — runtime identity is name PLUS defining loader, so cross-casts throw ClassCastException. Load shared interfaces from a common parent loader.'
  ],
  interview: [
    {
      q: 'Explain what happens from javac to your code running at full speed.',
      a: 'javac compiles source to BYTECODE — a compact, platform-neutral instruction set for the JVM\'s stack machine, not native code; the resulting .class file is the "write once" artifact that runs on any JVM. At runtime, when a class is first NEEDED, a class loader brings it in through three phases: loading (find the bytes, build the Class object), linking (verify the bytecode is type-safe — the security cornerstone; prepare static fields to default values; resolve symbolic references to real ones), and initialization (run static initializers and static assignments exactly once, in order, lazily on first active use). Loaders are arranged in a hierarchy — bootstrap, platform, application — and use parent delegation (ask the parent first) so core types can\'t be shadowed and everyone shares one copy of each core class. Execution then begins by INTERPRETING bytecode instruction by instruction, which starts instantly but runs slower than native. HotSpot profiles execution and JIT-compiles hot methods to optimized native code — tiered: quick C1 first, aggressive C2 for the hottest paths — doing runtime-informed optimizations (inlining, de-virtualization of observed-monomorphic calls, bounds-check elimination, escape analysis) that an ahead-of-time compiler struggles to match because it can\'t see the actual workload. This is why Java "warms up": the code reaches peak speed only after the JIT kicks in, which rewards long-running processes and penalizes short CLI tools (motivating GraalVM AOT native-image). Throughout, memory is organized into the shared heap (objects, GC-managed) and metaspace (class data, statics) plus per-thread stacks (call frames) and PC registers. The one-line version: portable bytecode, loaded and verified on demand, interpreted then JIT-compiled to native by profiling what runs hot.'
    },
    {
      q: 'What is parent delegation, and why does it matter for security and for plugin/app-server architectures?',
      a: 'Parent delegation is the rule that a class loader, when asked to load a class, first delegates the request to its parent loader and only loads the class itself if all ancestors fail. The hierarchy is bootstrap (core JDK, part of the JVM) → platform → application (your classpath), with custom loaders below that. Security: it prevents core-class shadowing — you can\'t slip a malicious java.lang.String onto the classpath, because the request delegates up to the bootstrap loader, which supplies the genuine class before your copy is ever considered. Consistency: a class\'s runtime identity is its fully-qualified name PLUS its defining loader, so delegation guarantees a single shared java.lang.Object/String across the whole app instead of per-loader duplicates that wouldn\'t be type-compatible. For plugin systems and app servers this model is both the enabling mechanism and the source of the hard bugs: because identity includes the loader, you can load two versions of a library under two loaders and keep them isolated (great for plugin sandboxing and for supporting multiple deployed apps with conflicting dependency versions), and you can hot-reload by discarding a loader and creating a fresh one (the old classes become garbage once unreferenced). The flip side: the SAME class loaded by two different loaders is two incompatible types, so casting an instance from one to the other throws ClassCastException despite the identical name — which is why frameworks carefully load shared interfaces from a COMMON parent loader while loading implementations in child loaders, and why a leaked reference to a classloader (or one of its instances) pins its entire class set in memory and leaks Metaspace. Some frameworks even deliberately INVERT delegation (child-first, as servlet containers do for web-app classes) to let apps override server-provided libraries — a controlled break of the default rule that shows exactly how load-bearing the rule is.'
    },
    {
      q: 'How does JIT compilation work, and why can a JIT outperform an ahead-of-time compiler on long-running code?',
      a: 'The JVM starts by interpreting bytecode (instant startup, slower execution) and simultaneously profiles the running program — counting how often each method and loop executes and recording how branches and call sites actually behave. When code crosses a hotness threshold, the JIT compiles it to native machine code using tiered compilation: C1 produces lightly-optimized native code quickly to get off the interpreter, and C2 recompiles the hottest paths with heavy optimization; on-stack replacement can even swap a long-running loop to compiled code mid-execution. The reason a JIT can beat an AOT compiler on long-running workloads is that it optimizes against OBSERVED runtime reality rather than static conservatism. Concretely: it inlines hot methods and then optimizes across the merged code; it DE-VIRTUALIZES calls the profiler sees hitting a single implementation, turning a virtual dispatch into a direct, inlinable call guarded by a cheap type check (this is what makes Java\'s pervasive dynamic dispatch essentially free on hot paths, and it can even inline through interfaces); it removes array-bounds and null checks it can prove redundant for the actual code paths taken; and it performs escape analysis, stack-allocating or scalar-replacing objects that never escape their method so they cost nothing to allocate. An AOT compiler must assume any virtual call could be polymorphic and any branch could be taken, because it can\'t observe THIS program\'s inputs. The trade-off is warm-up and startup: the JIT\'s advantage only materializes after profiling and compilation, so long-lived servers win big while short CLI processes pay repeated startup+warmup — which is exactly why GraalVM native-image (AOT) exists for fast-starting executables, accepting lower peak throughput a short run would never reach anyway. It also means the JIT can DEOPTIMIZE: if a speculative assumption (e.g. "this call site is monomorphic") is later violated, it discards the compiled code and falls back, then may recompile — so you can observe occasional deopt pauses. And it\'s why you must warm up before benchmarking (JMH) or you\'ll measure the interpreter.'
    },
    {
      q: 'Walk me through the JVM memory areas and connect them to StackOverflowError, OutOfMemoryError, and how static fields behave.',
      a: 'The JVM splits memory into shared and per-thread regions. Shared across all threads: the HEAP holds every object and array and is what the garbage collector manages (including the string pool since Java 7); the METHOD AREA — implemented as METASPACE in native memory since Java 8 — holds per-CLASS data: class metadata, method bytecode, the runtime constant pool, and static fields. Per-thread and private: each thread has a JVM STACK of frames (one frame per active method call, holding its local-variable slots and operand stack), a PC REGISTER pointing at the current bytecode instruction, and a native method stack. Connecting to errors: StackOverflowError comes from exhausting a single thread\'s stack — deep or infinite recursion piling up frames — and the stack is small and bounded (tunable with -Xss); OutOfMemoryError (Java heap space) comes from exhausting the shared heap with too many live objects (tunable with -Xmx). A separate OutOfMemoryError: Metaspace comes from loading too many classes — classically a classloader leak — exhausting the class-data region, which is a completely different root cause pointing at loaders rather than object retention. A stack trace is literally a snapshot of one thread\'s frames, innermost call on top. Static fields behaving as "one per class, shared by every instance and every thread" follows directly from their living in class data in metaspace rather than inside any heap object — which is also why mutable static state is a concurrency hazard (every thread sees the single shared copy, so it needs synchronization or immutability). And "references live on the stack, objects on the heap" is this layout made literal: a local slot holds a reference into the shared heap, which is why Java passes references by value (the callee gets a copy of the reference to the same object). The practical value of knowing this map is diagnostic: the specific error and region tell you whether to look at recursion depth, object retention, or classloading — turning a cryptic failure into a targeted fix.'
    }
  ]
};
