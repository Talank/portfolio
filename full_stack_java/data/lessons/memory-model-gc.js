window.LESSONS = window.LESSONS || {};
window.LESSONS['memory-model-gc'] = {
  id: 'memory-model-gc',
  title: 'Memory & Garbage Collection: the Heap, Generations, GCs & Leaks',
  category: 'Part 2 — The JVM, Deeply',
  timeMin: 55,
  summary: 'Java frees you from manual memory management — but "the GC handles it" is not the same as "you never think about memory." This lesson makes the heap concrete: how objects are allocated, how the collector decides what\'s garbage (reachability, not reference counting), why the heap is split into generations, what the modern collectors (G1, ZGC, Parallel) actually do and how they trade throughput against pause time, and — most practically — how memory LEAKS still happen in a garbage-collected language and how to find them. Getting this right is the difference between an app that runs for months and one that OOMs every Tuesday.',
  goals: [
    'Explain reachability-based garbage collection and why it beats reference counting (and handles cycles)',
    'Describe the generational heap (young/eden/survivor, old) and the weak generational hypothesis that justifies it',
    'Compare the main collectors — Serial, Parallel, G1, ZGC — on the throughput-vs-latency trade-off and pick one for a workload',
    'Name the concrete ways a leak happens in Java despite GC (unbounded caches, listeners, ThreadLocals, classloaders) and how to diagnose one',
    'Reason about allocation cost, escape analysis, and why "don\'t create garbage" is sometimes real advice and often premature'
  ],
  concept: [
    {
      h: 'Garbage = unreachable, determined by tracing from roots',
      p: [
        'The JVM does NOT free an object when its last reference disappears the instant it disappears (that would be reference counting, which C-family <code>shared_ptr</code> uses). Instead it uses <b>tracing</b>: periodically, the collector starts from a set of <b>GC roots</b> — live local variables on every thread\'s stack, static fields, JNI references, active thread objects — and follows every reference transitively. Anything REACHABLE from a root is live; everything else is garbage, reclaimed. "Reachable" is the whole definition of "alive" in Java: an object with a million references is collectable the moment none of them trace back to a root.',
        'Tracing\'s big win over reference counting is <b>cycles</b>. Two objects that reference each other but are referenced by nothing else have a nonzero reference count forever — reference counting leaks them; tracing simply never reaches them from a root, so they\'re correctly collected. This is why you can build doubly-linked lists, parent/child trees, and observer graphs in Java without leaking cycles, and it\'s a genuine reason the JVM chose tracing. The cost is that collection happens in bursts (a GC cycle) rather than continuously, which is where pauses and collector design come in.'
      ]
    },
    {
      h: 'The generational heap and the weak generational hypothesis',
      p: [
        'Empirically, <b>most objects die young</b> — a request handler allocates a pile of short-lived temporaries and drops them all in milliseconds — while objects that survive a while tend to survive much longer (long-lived caches, the app\'s core data). This is the <b>weak generational hypothesis</b>, and collectors exploit it by splitting the heap into a <b>young generation</b> and an <b>old (tenured) generation</b>.',
        'New objects are allocated in the young gen\'s <b>eden</b> space — allocation is astonishingly cheap, often just bumping a pointer. When eden fills, a fast <b>minor GC</b> collects the young gen: it copies the few survivors into a <b>survivor</b> space (and ages them), and since most objects are already dead, it reclaims almost everything by touching almost nothing (copying collectors do work proportional to the SURVIVORS, not the garbage — dead objects cost zero). Objects that survive enough minor GCs are <b>promoted</b> (tenured) to the old gen. The old gen is collected less often by a <b>major/full GC</b>, which is more expensive. This split is why Java allocation is fast and why churning short-lived objects is far cheaper than intuition suggests: they never leave eden and are collected in bulk. It also frames the two failure shapes — a healthy app has frequent cheap minor GCs and rare major GCs; an app promoting too much (or leaking) shows growing old-gen occupancy and lengthening full GCs, the classic pre-OOM signature.'
      ]
    },
    {
      h: 'The collectors: trading throughput against pause time',
      p: [
        'There is no single best collector — they occupy different points on a fundamental trade-off between <b>throughput</b> (total useful work per unit time) and <b>latency</b> (length of individual pauses). <b>Serial GC</b> uses one thread, stops the world for the whole collection — fine for tiny heaps and single-core/container use. <b>Parallel GC</b> (the throughput collector) uses many threads for collection but still stops the world; it maximizes total throughput at the cost of pause length — good for batch jobs where you care about total time, not responsiveness. <b>G1 GC</b> (the default since Java 9) divides the heap into regions and does most work concurrently with your app, aiming to hit a pause-time TARGET you set — a balanced default for typical server apps that want reasonable latency without giving up much throughput. <b>ZGC</b> (and Shenandoah) are low-latency collectors doing almost all work concurrently, delivering sub-millisecond pauses even on huge (multi-terabyte) heaps — for latency-critical services — at some throughput and memory-overhead cost.',
        'The practical framing: pick by what you\'re optimizing. A nightly data-crunching batch → Parallel (throughput). A user-facing API where a 200ms pause is a visible stutter → G1, or ZGC if pauses must be tiny at large heap. A tiny CLI or constrained container → Serial. And the meta-point interviews reward: "stop-the-world" pauses (when the collector must halt all application threads) are the enemy for latency, so modern collectors work to do more CONCURRENTLY and make pauses independent of heap size — that\'s the whole thrust of G1 → ZGC. You rarely need to hand-tune; you frequently need to CHOOSE the right one and set a sane heap size and pause target.'
      ]
    },
    {
      h: 'Leaks still happen — and how to find them',
      p: [
        'Garbage collection eliminates dangling pointers and double-frees, but it does NOT eliminate memory leaks. A Java leak is simple to state: <b>objects that are still REACHABLE but will never be used again</b>. The GC can\'t collect them (they\'re reachable) and you\'ve forgotten them (they\'re useless) — so the heap grows until OOM. The usual culprits: an <b>unbounded cache</b> or <code>static</code> collection you keep adding to and never evict (the most common leak by far — a static <code>Map</code> is a GC root that pins everything in it); <b>listeners/callbacks</b> you register but never unregister (the subject holds the listener alive); <b>ThreadLocals</b> in a thread pool never removed (the pooled thread lives forever, pinning the value); and <b>classloader leaks</b> from the last lesson (a retained loader pins its whole class set, leaking Metaspace). Long-lived object holding short-lived-intent references is the through-line.',
        'The tools make leaks findable. Watch the heap over time (JConsole, VisualVM, or GC logs via <code>-Xlog:gc</code>): a leak looks like old-gen occupancy climbing across GC cycles and never fully receding — the sawtooth drifts UP. To find WHAT is leaking, capture a <b>heap dump</b> (<code>jmap</code>, or <code>-XX:+HeapDumpOnOutOfMemoryError</code> to grab one automatically at the crash) and open it in a profiler (Eclipse MAT, VisualVM) that shows the biggest retained sets and the <b>reference chain from a GC root</b> keeping them alive — the "dominator tree" points straight at the offending static map or un-cleared list. The mental discipline that prevents most leaks: bound your caches (size or time eviction, or <code>WeakHashMap</code>/soft references where appropriate), unregister what you register, clear ThreadLocals in a <code>finally</code>, and be suspicious of every long-lived <code>static</code> mutable collection. LogPose\'s embedding cache (Part 13) is exactly this hazard — an in-memory map of query→vector that MUST be size-bounded, or a long-running LogPose leaks itself to death.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Nami runs the treasury: reachable gold stays, forgotten gold is swept',
      text: 'Nami manages the Straw Hats\' treasure, and her method is exactly the JVM\'s. She does NOT track every single coin with a running tally of "who owns this" (reference counting — and it would fail her the day two crates list each OTHER as owner, each keeping the other "accounted for" while nobody actually needs either: a leaked cycle). Instead, periodically she does a SWEEP from what matters: she starts from the things the crew genuinely uses right now — the captain\'s stash, the active mission funds, what\'s in someone\'s hands this minute (the GC roots) — and follows every chain of "this pays for that" outward. Anything she can trace back to a real, in-use need is KEPT; everything she can\'t reach from those roots, no matter how it got there, is swept out as garbage (tracing reachability). And notice the elegance: those two crates pointing at each other but needed by no one? Unreachable from any root, so correctly swept — cycles handled, no leak. Nami also knows the deep truth of ship economics: MOST treasure is spent almost immediately (supplies, repairs, Sanji\'s groceries — objects that die young), while a rare few items become permanent (the crew\'s core reserve — tenured to the old generation). So she keeps fresh loot in an easy-access hold (eden) she sweeps constantly and cheaply — since almost all of it is already spent, sweeping costs almost nothing — and only the stuff that keeps surviving her sweeps gets promoted to the deep vault, which she opens rarely. Her one recurring nightmare is the leak that GC can\'t fix: a chest she keeps "just in case" and never opens, still formally reachable from an inventory list she forgot to prune, piling up until the hold is full and the ship rides dangerously low (a reachable-but-useless object in an unbounded list — the Java leak). Her fix is discipline: bound the "just in case" pile, and prune the inventory list. Reachable is alive; forgotten-but-listed is the trap.',
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s apartment: if it\'s not in use, it\'s out',
      text: 'Monica Geller runs her apartment on pure reachability-based garbage collection, and it is the cleanest heap in television. Monica does not keep something because it once mattered or because technically someone might reference it someday — she keeps exactly what is REACHABLE from active use, and the instant an object is no longer traceable to a real current need, it is swept out with terrifying efficiency (tracing GC: unreachable = gone). The others live differently and it drives the plot. Ross reference-counts emotionally — he holds onto things because of tangled mutual attachments ("we were on a break" is a cycle of two references pointing at each other, keeping a dead relationship formally "alive" while nobody actually uses it), and Monica would simply sweep it: not reachable from anything real, therefore garbage. The generational hypothesis is the apartment\'s whole rhythm: most things that come in — takeout containers, Joey\'s impulse buys, a week\'s clutter — die young and get cleared in Monica\'s frequent, fast passes (minor GC on eden), while the few things that survive several of her purges earn a permanent, protected spot (tenured to the old gen, touched only in a rare deep-clean full sweep). And then there\'s the famous secret closet — the ONE door Monica keeps locked, crammed floor-to-ceiling with everything she couldn\'t bear to sweep but won\'t use: reachable (it\'s all still IN the apartment, pinned behind that door) yet useless (she never opens it). That closet is a Java memory leak made physical — objects the collector can\'t reclaim because they\'re still referenced, growing until the door literally bursts open under the pressure (OOM). The lesson the show hands you for free: a spotless heap isn\'t about never acquiring things, it\'s about ruthlessly sweeping what\'s no longer reachable — and even Monica, the best collector on the show, leaks through the one closet she refuses to bound.',
    },
    why: 'Nami and Monica both collect by REACHABILITY, not reference counts: sweep from the roots (what\'s actively in use), keep what traces back, discard everything else — which correctly handles cycles (the two crates, the "we were on a break" mutual reference) that reference counting would leak. Both exploit that most things die young (supplies, takeout — cleared cheaply and often in eden/minor GC) while a rare few survive to become permanent (the core reserve, tenured to the old gen, swept rarely). And both show the leak GC can\'t fix: the forgotten-but-listed chest and Monica\'s secret closet — reachable yet useless, piling up until the ship rides low / the door bursts (OOM). The fix is discipline: bound the pile, prune the list.'
  },
  storyAnim: {
    title: 'Trace from the roots: reachable survives, the rest is swept',
    h: 300,
    props: [
      { id: 'roots', emoji: '⚓', label: 'GC roots: stack locals, statics, active threads', x: 12, y: 12 },
      { id: 'live', emoji: '💰', label: 'reachable from a root → LIVE (kept)', x: 44, y: 12 },
      { id: 'garbage', emoji: '🗑️', label: 'unreachable → garbage (swept)', x: 76, y: 12 },
      { id: 'cycle', emoji: '🔁', label: 'two objects referencing each other, no root → swept', x: 22, y: 46 },
      { id: 'eden', emoji: '🌱', label: 'eden: new objects, minor GC clears most cheaply', x: 58, y: 46 },
      { id: 'old', emoji: '🏛️', label: 'survivors promoted → old gen (swept rarely)', x: 86, y: 46 },
      { id: 'leak', emoji: '🚪', label: 'static list never pruned: reachable but useless', x: 30, y: 80 },
      { id: 'oom', emoji: '💥', label: 'heap fills → OutOfMemoryError', x: 72, y: 80 }
    ],
    actors: [
      { id: 'nami', emoji: '🗺️', label: 'Nami (collector)', x: 12, y: 30 }
    ],
    steps: [
      { c: 'A GC cycle starts from the ROOTS: every thread\'s live stack variables, static fields, active threads. These are the "genuinely in use right now" anchors.', p: { roots: 'lit' }, a: { nami: [12, 30] } },
      { c: 'The collector follows every reference from the roots. Anything reachable is LIVE and kept — no matter how many or few references point at it.', p: { live: 'good' } },
      { c: 'Everything NOT reachable from any root is garbage and swept — even an object with millions of internal references, if none trace to a root.', p: { garbage: 'bad' } },
      { c: 'Two objects referencing only each other, anchored to no root, are correctly collected — tracing handles cycles that reference counting would leak forever.', p: { cycle: 'good' } },
      { c: 'New objects land in eden. Because most objects die young, a minor GC clears almost all of eden cheaply — copying collectors do work proportional to SURVIVORS, and there are few.', p: { eden: 'good' } },
      { c: 'The rare objects that survive several minor GCs get promoted to the old generation, collected far less often by an expensive major GC.', p: { old: 'good' } },
      { c: 'The leak GC cannot fix: a static list you keep adding to and never prune. Its entries stay REACHABLE (so uncollectable) yet are never used again (so useless).', p: { leak: 'bad' } },
      { c: 'The heap climbs across cycles and never fully recedes — the sawtooth drifts up — until it fills and throws OutOfMemoryError. The fix is discipline: bound the cache, prune the list.', p: { oom: 'bad' }, a: { nami: [72, 80] } }
    ]
  },
  conceptFlow: {
    title: 'An object\'s life and death on the heap',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Birth',
        nodes: [
          { id: 'alloc', text: 'new Foo()\nallocated in eden (pointer bump)' },
          { id: 'root', text: 'referenced by a live local\n→ reachable from a GC root' }
        ]
      },
      {
        label: 'Young collection',
        nodes: [
          { id: 'minor', text: 'eden fills → minor GC\ncopies few survivors out' },
          { id: 'survivor', text: 'survivor space\nages across minor GCs' }
        ]
      },
      {
        label: 'Long life',
        nodes: [
          { id: 'promote', text: 'survives enough GCs\n→ promoted to old gen' },
          { id: 'major', text: 'old gen fills → major GC\nrarer, more expensive' }
        ]
      },
      {
        label: 'Death or leak',
        nodes: [
          { id: 'unreachable', text: 'last root ref dropped\n→ unreachable → collected' },
          { id: 'leak', text: 'still reachable but unused\n→ leak → OOM' }
        ]
      }
    ],
    steps: [
      { active: ['alloc'], note: 'new allocates in eden — typically just bumping a pointer in a thread-local buffer, so allocation is extremely cheap. This is why short-lived objects cost far less than people fear.' },
      { active: ['root'], note: 'A live local variable holding the object makes it reachable from a GC root. Reachability from a root is the entire definition of "alive".' },
      { active: ['minor'], note: 'When eden fills, a fast minor GC runs. Since most objects have already died, it copies the few survivors elsewhere and reclaims the rest in bulk — work proportional to survivors, not garbage.' },
      { active: ['survivor'], note: 'Survivors move to a survivor space and gain an "age". Objects that keep surviving are candidates for promotion — the collector is sorting the ephemeral from the durable.' },
      { active: ['promote'], note: 'After surviving enough minor GCs, an object is promoted (tenured) to the old generation — the collector now believes it\'s long-lived, per the generational hypothesis.' },
      { active: ['major'], note: 'The old gen fills more slowly and is collected by a major/full GC — rarer but costlier. Rising old-gen occupancy that never recedes is the classic pre-OOM signature.' },
      { active: ['unreachable'], note: 'When the last root-anchored reference is dropped, the object becomes unreachable and the next relevant GC reclaims it. You never free() — dropping references is how you "free".' },
      { active: ['leak'], note: 'The leak case: the object stays reachable (a static map, an un-removed listener) but is never used again. The GC can\'t reclaim it, and the heap grows until OutOfMemoryError. Bound caches, unregister listeners, clear ThreadLocals.' }
    ]
  },
  tech: [
    {
      q: 'Why does the JVM use tracing GC instead of reference counting, and what exactly are GC roots?',
      a: 'Reference counting keeps a per-object count of incoming references and frees an object when its count hits zero — appealing because reclamation is immediate and incremental, but it has two fatal problems for a general-purpose managed runtime. First, CYCLES: two objects that reference each other but are referenced by nothing else keep each other\'s counts at one forever, so they\'re never freed — a guaranteed leak for any cyclic structure (doubly-linked lists, parent/child trees, observer graphs), which are ubiquitous. Second, COST and CONTENDING: every reference assignment must atomically update counts, which is expensive and a nightmare under concurrency (the counts become contended shared state). Tracing sidesteps both: instead of tracking references continuously, it periodically starts from a set of GC ROOTS and follows references transitively, marking everything reachable as live and reclaiming the rest — cycles unreferenced from any root are simply never reached, hence correctly collected, and there\'s no per-assignment bookkeeping. GC roots are the "definitely live" anchors from which reachability is computed: local variables and operands on every thread\'s active stack frames, static fields of loaded classes, JNI references held by native code, live thread objects themselves, and certain JVM-internal references (e.g. classes loaded by the bootstrap loader, objects held by synchronized monitors). The definition of a live object follows directly: reachable from at least one root. This reframes "freeing memory" in Java — you never call free(); you drop references so an object becomes unreachable, and the collector reclaims it on its own schedule. It also explains why setting a reference to null occasionally matters (removing the last root-path to a large graph makes it collectable sooner) but is usually pointless (a local going out of scope does the same thing). The trade-off tracing accepts is that collection happens in bursts, introducing pauses — which is precisely what the different collectors are engineered to minimize.'
    },
    {
      q: 'Explain the generational heap and why minor GCs are cheap. What is the weak generational hypothesis?',
      a: 'The weak generational hypothesis is an empirical observation that holds across the vast majority of programs: MOST objects die young (they\'re short-lived temporaries — the intermediate results of a request, a loop, a parse), and the older an object gets, the more likely it is to keep living (durable data — caches, configuration, the app\'s core structures). Generational collectors exploit this by partitioning the heap into a young generation (subdivided into eden plus two survivor spaces) and an old/tenured generation, and collecting them on different schedules. New objects are allocated in eden, where allocation is nearly free — often a pointer bump in a thread-local allocation buffer (TLAB), so no locking on the fast path. When eden fills, a MINOR GC collects only the young generation: it identifies the (usually few) survivors, copies them into a survivor space, ages them, and reclaims all of eden at once. The key to why this is cheap: a copying collector does work proportional to the LIVE objects it copies, not the dead ones it reclaims — dead objects cost literally nothing, they\'re just abandoned when eden is reset. Since most young objects are already dead by collection time, a minor GC touches very little and frees a lot, which is why churning short-lived objects is dramatically cheaper than intuition (raised on malloc/free) suggests. Objects that survive enough minor GCs are PROMOTED (tenured) to the old generation, which fills slowly and is collected by a rarer, more expensive MAJOR/FULL GC (it must handle the long-lived set, often with compaction). This structure gives you the diagnostic vocabulary for heap health: a healthy app shows frequent, short minor GCs and infrequent major GCs, with old-gen occupancy stable across cycles; an unhealthy one shows old-gen occupancy climbing and never receding (a leak, or excessive promotion from under-sized young gen), with lengthening full GCs as the pre-OOM signature. Practical corollaries: sizing the young generation appropriately keeps short-lived objects from being prematurely promoted (which pollutes the old gen and forces costly full GCs), and "allocation is cheap, promotion is expensive" is the right mental model for performance-sensitive allocation.'
    },
    {
      q: 'Compare the modern collectors and tell me how to choose. What is a stop-the-world pause and why does it dominate the design?',
      a: 'A stop-the-world (STW) pause is a moment when the collector must halt ALL application threads to do some work safely (at minimum, to scan roots consistently). STW pauses are the enemy of latency: during one, your service does zero useful work, so a 500ms full-GC pause is a 500ms outage for every in-flight request. The entire evolution of collectors is about shrinking STW pauses and making them independent of heap size, while giving up as little throughput as possible. The main options: SERIAL GC — single-threaded, fully STW; minimal overhead and footprint, right for tiny heaps, single-core, or small containers. PARALLEL GC (the "throughput collector") — many threads for collection but still fully STW; it maximizes total throughput (useful work per unit time) at the cost of pause length, ideal for batch/throughput jobs where total completion time matters and pauses don\'t. G1 GC (default since Java 9) — divides the heap into equal-size regions, collects incrementally and largely concurrently, and lets you set a PAUSE-TIME TARGET it tries to meet by collecting only as many regions as fit the budget; a balanced default for server apps wanting good latency without sacrificing much throughput. ZGC and SHENANDOAH — low-latency collectors doing almost all work (including compaction) concurrently, delivering sub-millisecond, heap-size-independent pauses even on multi-terabyte heaps, for latency-critical services — at the cost of some throughput and extra memory/CPU overhead (barriers). How to choose: identify what you optimize. Nightly batch or data pipeline → Parallel (you want minimum total time). User-facing API/service where pauses cause visible latency → G1 (the sensible default), or ZGC/Shenandoah if you have a large heap AND strict tail-latency requirements. Tiny CLI or memory-constrained container → Serial. In practice the highest-leverage decisions are usually NOT exotic tuning flags but: pick the right collector for the workload, set a reasonable max heap (-Xmx) matched to the machine/container, set a pause target if using G1, and only then measure with GC logs before touching anything finer. The meta-point worth stating in an interview: there is no universally best collector because throughput and latency are in fundamental tension — you\'re choosing a point on that curve for YOUR workload.'
    },
    {
      q: 'If Java has GC, how do memory leaks still happen, and how do you find one?',
      a: 'A GC eliminates dangling-pointer and double-free bugs, but it does NOT eliminate leaks, because its safety rule is conservative: it only reclaims UNREACHABLE objects. A Java leak is therefore precisely: objects that remain REACHABLE (so the GC must keep them) but will never be used again (so they\'re dead weight) — the heap grows until OutOfMemoryError. The recurring causes are all variations of "a long-lived thing holds a reference it should have released": (1) UNBOUNDED CACHES / static collections — the single most common leak; a static Map or List you keep adding to and never evict is itself a GC root that pins every entry forever (the fix: bound by size or time with an eviction policy, or use WeakHashMap / soft references when the semantics fit). (2) LISTENERS AND CALLBACKS registered but never unregistered — the event source holds the listener alive, and with it everything the listener captures (the fix: unregister in the matching teardown, or use weak listeners). (3) THREADLOCALS in a thread pool — a value set on a ThreadLocal and never removed stays pinned because the pooled thread lives for the app\'s lifetime (the fix: always remove() in a finally). (4) CLASSLOADER leaks — retaining a reference to a custom loader or any of its instances pins its entire loaded class set, leaking Metaspace (classic in redeployed web apps). The common thread: scope your references to their actual useful lifetime. To FIND a leak: first confirm it by watching the heap over time with GC logs (-Xlog:gc) or a live tool (VisualVM, JConsole) — a leak shows the post-GC heap floor (old-gen occupancy after each collection) trending steadily UP, the sawtooth drifting upward rather than returning to a stable baseline. Then find WHAT: capture a heap dump — proactively with jmap, or automatically at the crash with -XX:+HeapDumpOnOutOfMemoryError — and analyze it in Eclipse MAT or VisualVM, which rank objects by RETAINED size (how much memory would be freed if this object were collected) and, crucially, show the reference chain from a GC root that keeps a suspect alive (MAT\'s "path to GC roots" and dominator tree). That chain points straight at the offending static map, un-cleared list, or lingering listener. The preventive discipline is the real lesson: be suspicious of every long-lived static mutable collection, bound your caches, and pair every register/set/open with an unregister/remove/close — which is exactly why LogPose\'s embedding cache must be size-bounded from day one.'
    }
  ],
  code: {
    title: 'A leak you can watch grow — and the bounded fix',
    intro: 'The most common Java leak is an unbounded static cache. Here it is, made observable, next to the disciplined fix. Run the leaky version with a small heap and watch it die; run the fix and watch it stay flat.',
    code: `import java.util.*;

public class CacheLeak {

    // THE LEAK: a static, unbounded cache. It's a GC root that pins every entry forever.
    static final Map<String, byte[]> LEAKY = new HashMap<>();

    static void rememberLeaky(String query) {
        // simulate caching a ~1MB embedding vector per unique query, never evicted
        LEAKY.put(query, new byte[1_000_000]);
    }

    // THE FIX: a bounded LRU cache. Old entries are evicted, so the heap stays flat.
    static final int MAX = 100;
    static final Map<String, byte[]> BOUNDED =
        new LinkedHashMap<>(16, 0.75f, true) {          // access-order LinkedHashMap
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, byte[]> eldest) {
                return size() > MAX;                     // evict once over capacity
            }
        };

    static void rememberBounded(String query) {
        BOUNDED.put(query, new byte[1_000_000]);
    }

    public static void main(String[] args) {
        boolean leak = args.length > 0 && args[0].equals("leak");

        for (int i = 0; i < 10_000; i++) {
            String query = "query-" + i;                 // every query is unique — worst case
            if (leak) rememberLeaky(query);              // grows without bound → OOM eventually
            else      rememberBounded(query);            // stays at MAX entries → flat heap

            if (i % 1000 == 0) {
                long usedMB = (Runtime.getRuntime().totalMemory()
                             - Runtime.getRuntime().freeMemory()) / 1_000_000;
                System.out.println("i=" + i
                    + "  cacheSize=" + (leak ? LEAKY.size() : BOUNDED.size())
                    + "  usedMB≈" + usedMB);
            }
        }
        System.out.println("done — bounded cache never exceeds " + MAX + " entries");
    }
}`,
    notes: [
      'Run the leak: java -Xmx64m CacheLeak leak — watch cacheSize and usedMB climb until OutOfMemoryError. The entries are all REACHABLE (LEAKY is a static root) yet never reused — a textbook Java leak GC cannot fix.',
      'Run the fix: java -Xmx64m CacheLeak — cacheSize plateaus at 100, usedMB stays flat, and it finishes. removeEldestEntry makes the LinkedHashMap self-evict; the evicted arrays become unreachable and the GC reclaims them.',
      'This is LogPose\'s embedding cache in miniature (Part 13): a query→vector map that MUST be bounded (size, time, or weak references) or a long-running LogPose leaks itself to death. Grab -XX:+HeapDumpOnOutOfMemoryError on the leak run and open the dump in VisualVM to see LEAKY as the dominator.'
    ]
  },
  lab: {
    title: 'Diagnose the leak, then bound it',
    prompt: 'Reason about a leak and fix it with the right structure. Given a class <code>Session</code> that stores per-user data, write (1) a class <code>Registry</code> with a <b>static</b> <code>Map&lt;String, Session&gt; active</code>, a <code>static void login(String user)</code> that puts a new Session, and — the fix — a <code>static void logout(String user)</code> that REMOVES the user (without it, logged-out sessions leak); (2) a bounded alternative <code>recent</code> as a <code>LinkedHashMap</code> capped at 50 via <code>removeEldestEntry</code>; (3) in a comment, answer: with only <code>login</code> and no <code>logout</code>, why does the static <code>active</code> map leak even though old sessions are "done", and name the one word that describes why the GC can\'t reclaim them.',
    starter: `import java.util.*;

class Session {
    final String user;
    final byte[] data = new byte[100_000];
    Session(String user) { this.user = user; }
}

class Registry {
    static final Map<String, Session> active = new HashMap<>();

    static void login(String user) {
        active.put(user, new Session(user));
    }

    // FIX: logout must remove the user's session from active

    // BOUNDED ALTERNATIVE: a LinkedHashMap "recent" capped at 50 entries via removeEldestEntry
}

// Q: with login but no logout, why does 'active' leak, and what one word explains why the GC
//    can't reclaim old sessions?
// ANSWER:`,
    checks: [
      { re: 'static\\s+void\\s+logout\\s*\\(\\s*String', must: true, hint: 'Add static void logout(String user).', pass: 'logout declared ✓' },
      { re: 'active\\.remove\\s*\\(', must: true, hint: 'logout must call active.remove(user) — dropping the reference is what lets the GC reclaim the session.', pass: 'session removed ✓' },
      { re: 'LinkedHashMap', must: true, hint: 'The bounded alternative should be a LinkedHashMap.', pass: 'LinkedHashMap used ✓' },
      { re: 'removeEldestEntry', must: true, hint: 'Override removeEldestEntry to cap the map.', pass: 'removeEldestEntry override ✓' },
      { re: 'size\\s*\\(\\s*\\)\\s*>\\s*50', must: true, hint: 'removeEldestEntry should return size() > 50 to cap at 50 entries.', pass: 'capped at 50 ✓' },
      { re: 'ANSWER\\s*:\\s*\\S+', must: true, hint: 'Answer: the static map keeps a live reference to every session, so they stay REACHABLE and the GC (which only collects unreachable objects) can\'t reclaim them.', pass: 'rationale given ✓' },
      { re: 'reachab|reachable', flags: 'i', must: true, hint: 'The one-word answer is "reachable" (or "reachability") — the sessions are still reachable from a GC root, so uncollectable.', pass: 'names reachability ✓' }
    ],
    run: 'this is a reasoning + structure lab (no run recipe needed), but you CAN prove it: add a main that logs in 10,000 users; run once never calling logout (heap climbs) and once calling logout after each (heap flat). <code>javac Registry.java &amp;&amp; java -Xmx64m Registry</code>.',
    solution: `import java.util.*;

class Session {
    final String user;
    final byte[] data = new byte[100_000];
    Session(String user) { this.user = user; }
}

class Registry {
    static final Map<String, Session> active = new HashMap<>();

    static void login(String user) {
        active.put(user, new Session(user));
    }

    static void logout(String user) {
        active.remove(user);      // drops the reference → session becomes unreachable → collectable
    }

    // Bounded: auto-evicts the eldest once over 50 entries.
    static final Map<String, Session> recent =
        new LinkedHashMap<>(16, 0.75f, false) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, Session> eldest) {
                return size() > 50;
            }
        };
}

// ANSWER: 'active' is a static field, hence a GC ROOT. Every Session put into it stays
// referenced by the map, so it remains REACHABLE from that root even after the user is "done".
// The GC only reclaims UNREACHABLE objects, so it cannot collect them — they pile up until OOM.
// The one word: REACHABILITY (the sessions are still reachable).`,
    notes: [
      'The fix is just dropping the reference — active.remove(user) — which makes the session unreachable so the GC can reclaim it. In Java you "free" by un-referencing, never with an explicit free().',
      'The one-word answer, reachability, is the whole concept: GC keeps everything reachable from a root, and a static collection IS a root. A static mutable collection you never prune is the #1 Java leak.',
      'The bounded LinkedHashMap is the general defense: cap the size so evicted entries become unreachable automatically. LogPose\'s embedding cache uses exactly this pattern (Part 13).'
    ]
  },
  quiz: [
    {
      q: 'When does the JVM consider an object eligible for garbage collection?',
      options: ['When it is no longer REACHABLE by following references from any GC root (stack locals, static fields, active threads) — reference count is irrelevant', 'As soon as its reference count drops to zero', 'When you explicitly call free() on it', 'After a fixed time-to-live expires'],
      correct: 0,
      explain: 'Java uses tracing, not reference counting: alive = reachable from a root. This is why cycles (two objects referencing only each other) are correctly collected — unreachable from any root. Nami sweeps from what\'s actively in use.'
    },
    {
      q: 'Why is a minor GC (young generation collection) usually fast and cheap?',
      options: ['Most young objects have already died, and a copying collector does work proportional to the few SURVIVORS it copies — dead objects cost nothing to reclaim', 'It compacts the entire heap including the old generation', 'It runs on a background thread so it never actually does work', 'The young generation is always empty'],
      correct: 0,
      explain: 'The weak generational hypothesis: most objects die young. A minor GC copies the rare survivors out of eden and reclaims everything else in bulk — cost scales with survivors, not garbage. Monica clears the takeout containers cheaply and often.'
    },
    {
      q: 'You run a latency-critical service on a large heap where even a 100ms GC pause causes visible stutter. Which collector fits best?',
      options: ['ZGC (or Shenandoah) — low-latency collectors doing almost all work concurrently, giving sub-millisecond pauses even on very large heaps, trading some throughput', 'Serial GC — one thread keeps pauses short', 'Parallel GC — it maximizes throughput above all', 'None — GC pauses are fixed and unavoidable in Java'],
      correct: 0,
      explain: 'Latency-critical + large heap → ZGC/Shenandoah, engineered for sub-millisecond, heap-size-independent pauses. Parallel maximizes throughput but has long STW pauses; Serial is single-threaded for tiny heaps. Choose by what you optimize.'
    },
    {
      q: 'How can a memory leak happen in a garbage-collected language like Java?',
      options: ['Objects that remain REACHABLE (e.g. held by a static collection you never prune) but are never used again — the GC can\'t reclaim reachable objects, so the heap grows until OOM', 'The garbage collector randomly forgets to free objects', 'Only native code can leak; pure Java cannot leak at all', 'Leaks require calling free() incorrectly'],
      correct: 0,
      explain: 'GC only reclaims UNREACHABLE objects. A reachable-but-useless object — a static map entry never evicted, an un-removed listener, a ThreadLocal never cleared — is a leak GC cannot fix. Monica\'s locked secret closet: still in the apartment, never opened, growing until it bursts.'
    },
    {
      q: 'You suspect a leak. What\'s the most direct way to find WHAT is being retained?',
      options: ['Capture a heap dump (jmap, or -XX:+HeapDumpOnOutOfMemoryError) and analyze it in a tool like Eclipse MAT — look at retained sizes and the reference chain (path to GC roots) keeping suspects alive', 'Add System.gc() calls throughout the code', 'Increase -Xmx until the OOM stops', 'Rewrite the app in a language without GC'],
      correct: 0,
      explain: 'A heap dump plus MAT/VisualVM shows the biggest retained sets and the exact reference chain from a GC root pinning them — pointing straight at the offending static map or un-cleared list. Raising -Xmx just delays the crash; System.gc() can\'t collect reachable objects.'
    }
  ],
  testFlow: {
    title: 'Test yourself: memory and GC under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'You build a doubly-linked list, then drop your only reference to it. Each node still points to its neighbors (a web of cycles). Does it leak?',
        choices: [
          { text: 'No — tracing GC collects it: no node is reachable from any GC root anymore, and internal references between nodes are irrelevant if nothing external anchors the structure', to: 'q1_right' },
          { text: 'Yes — the mutual references between nodes keep their counts nonzero, so they can never be freed', to: 'q1_wrong_refcount' },
          { text: 'Only if you call System.gc() to break the cycles manually', to: 'q1_wrong_gc' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Exactly — this is tracing GC\'s advantage over reference counting. Reachability is computed from roots, so a self-referential island anchored to nothing is unreachable and collected. Cycles that would leak forever under reference counting are handled for free.', next: 'q2' },
      q1_wrong_refcount: { end: true, correct: false, text: 'That\'s reference-counting thinking — and exactly why the JVM does NOT use it. Tracing ignores internal reference counts; it asks only "reachable from a root?" The cycle is unreachable, so it\'s collected. This is a deliberate design win.', retry: 'q1' },
      q1_wrong_gc: { end: true, correct: false, text: 'No manual intervention needed — the regular GC already handles cycles because it traces from roots, not reference counts. System.gc() is just a (discouraged) suggestion to run a collection; it changes nothing about WHAT is collectable.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'Your service uses a thread pool. Each request sets a value on a ThreadLocal but never removes it. Over days, memory climbs. Why?',
        choices: [
          { text: 'Pooled threads live for the app\'s lifetime, so a ThreadLocal value never removed stays pinned by its long-lived thread — a reachable-but-unused leak; clear it with remove() in a finally', to: 'q2_right' },
          { text: 'ThreadLocals are always leaks and should never be used', to: 'q2_wrong_never' },
          { text: 'The GC is broken and needs restarting', to: 'q2_wrong_broken' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Right — in a pool, threads are reused indefinitely, so a ThreadLocal entry set and never removed is anchored by a thread that outlives the request forever. The fix is the discipline pattern: set in a try, remove() in the finally, so the value\'s lifetime matches its use.', next: 'q3' },
      q2_wrong_never: { end: true, correct: false, text: 'Too absolute — ThreadLocals are useful (per-thread context, avoiding parameter threading). The leak is specifically failing to REMOVE them in a pooled-thread environment. Used with a finally-remove discipline, they\'re safe. The rule is scope the value to its use.', retry: 'q2' },
      q2_wrong_broken: { end: true, correct: false, text: 'The GC is working correctly — it can\'t collect the values because they\'re still REACHABLE via the long-lived pooled thread. That\'s a leak in your code (missing remove()), not a broken collector. GC only reclaims the unreachable.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A batch job processes a huge dataset overnight; total completion time is all that matters, and nobody is waiting on individual responses. Which collector, and why?',
        choices: [
          { text: 'Parallel GC — it maximizes total throughput (useful work per unit time) using many collection threads; long stop-the-world pauses are acceptable here because no one is latency-sensitive', to: 'q3_right' },
          { text: 'ZGC — you always want the lowest possible pause times', to: 'q3_wrong_zgc' },
          { text: 'Serial GC — single-threaded is always safest', to: 'q3_wrong_serial' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct trade: for a batch job you optimize THROUGHPUT (finish sooner), and Parallel GC is the throughput collector — full STW pauses don\'t matter when no one is waiting on response latency. Choosing the low-latency ZGC here would sacrifice throughput for a pause reduction you don\'t need.', next: null },
      q3_wrong_zgc: { end: true, correct: false, text: 'ZGC minimizes pauses at some throughput cost — exactly the wrong trade for a batch job where nobody experiences the pauses and total time is what counts. Low latency is valuable for user-facing services, not overnight batch. Match the collector to what you optimize.', retry: 'q3' },
      q3_wrong_serial: { end: true, correct: false, text: 'Serial is single-threaded — it under-uses a multi-core machine and would make an overnight batch job SLOWER. It fits tiny heaps and constrained containers, not a big throughput-bound dataset. For maximum throughput on real hardware, Parallel wins.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Believing "GC means no memory bugs" — GC eliminates dangling pointers and double-frees, not LEAKS. Reachable-but-unused objects (static caches, un-removed listeners, ThreadLocals) still grow the heap to OOM.',
    'Unbounded static/instance caches — the #1 Java leak. A static Map you never evict is a GC root pinning everything in it. Bound every cache by size or time, or use WeakHashMap/soft references where the semantics fit.',
    'Calling System.gc() to "fix" memory pressure — it\'s only a suggestion, can force an expensive full GC, and cannot collect reachable objects. If memory grows, you have a leak (reachability problem), not a GC-timing problem.',
    'Microbenchmarking or reasoning about performance assuming allocation is expensive — young-gen allocation is a pointer bump and short-lived objects are collected almost for free. Premature "avoid all garbage" optimization often adds complexity for no measured gain; profile first.',
    'Forgetting to unregister listeners / remove ThreadLocals / close resources — each leaves a long-lived object holding a reference past its useful life. Pair every register/set/open with an unregister/remove/close, ideally in a finally.',
    'Blindly raising -Xmx when you hit OutOfMemoryError — if the cause is a leak, a bigger heap just delays the crash and makes each full GC longer. Confirm whether it\'s a leak (heap floor trending up across GCs) before adding memory.'
  ],
  interview: [
    {
      q: 'How does garbage collection decide what to collect, and why is tracing better than reference counting?',
      a: 'The JVM uses TRACING (reachability-based) collection: periodically it starts from a set of GC ROOTS — live local variables and operands on every thread\'s stack, static fields, JNI references, active thread objects, and some JVM-internal references — and follows references transitively, marking everything reachable as live and reclaiming the rest. The operative definition is that an object is alive if and only if it is reachable from a root; an object with a million internal references is collectable the instant none of them trace back to a root. Tracing is preferred over reference counting for two decisive reasons. First, CYCLES: reference counting frees an object when its incoming-reference count hits zero, but two objects referencing each other keep each other\'s counts nonzero forever even when nothing else references them — a guaranteed leak for the cyclic structures that pervade real code (linked lists, trees, graphs, observer setups). Tracing never reaches such an island from a root, so it\'s correctly collected. Second, COST: reference counting must update counts on every reference assignment, which is expensive and becomes badly contended under concurrency, whereas tracing does no per-assignment bookkeeping (at the cost of collecting in bursts, which introduces the pauses collectors then work to minimize). This model also reframes "freeing" in Java: you never call free(); you drop references so an object becomes unreachable, and the collector reclaims it on its own schedule — which is why occasionally nulling a field matters (it can sever the last root-path to a large graph) but usually doesn\'t (a local going out of scope achieves the same). The one honest caveat is that reachable is a conservative over-approximation of "needed": the GC keeps everything reachable, so an object you\'ll never use again but still reference is retained — which is exactly how leaks happen in a GC\'d language.'
    },
    {
      q: 'Explain the generational heap and how a typical collection cycle proceeds.',
      a: 'Generational collection is built on the weak generational hypothesis: most objects die young, and objects that have already survived a while tend to keep living. The heap is split into a YOUNG generation — eden plus two survivor spaces — and an OLD (tenured) generation, collected on different schedules. New objects are allocated in eden, where allocation is nearly free: typically a pointer bump within a thread-local allocation buffer, so no locking on the common path. When eden fills, a MINOR GC collects the young generation: it finds the (usually few) survivors, copies them into a survivor space, and increments their age; because a copying collector\'s work is proportional to the LIVE objects it moves and most young objects are already dead, the minor GC reclaims a lot while touching little — this is why high allocation rates of short-lived objects are much cheaper than malloc/free intuition suggests. Survivors that persist across enough minor GCs are PROMOTED (tenured) into the old generation, which fills slowly and is handled by a rarer, costlier MAJOR/FULL GC that must manage the long-lived set, often with compaction to combat fragmentation. This structure gives a diagnostic vocabulary: healthy apps show frequent short minor GCs and infrequent major GCs with stable old-gen occupancy across cycles; trouble shows old-gen occupancy climbing and never receding (a leak, or excessive premature promotion from an undersized young gen forcing costly full GCs). Two practical implications: sizing the young generation matters because too-small a young gen prematurely promotes short-lived objects into the old gen (polluting it and triggering expensive full GCs), and the right performance mantra is "allocation is cheap, promotion and full GCs are expensive" — so the objects to worry about are the ones that survive into tenure, not the ephemeral temporaries. Modern collectors like G1 generalize this into regions rather than fixed contiguous generations, but the young/old, minor/major distinction remains the core mental model.'
    },
    {
      q: 'Walk me through the choice between Serial, Parallel, G1, and ZGC. What drives the decision?',
      a: 'The decision is driven by a fundamental tension between THROUGHPUT (total useful work per unit time) and LATENCY (the length of individual pauses), plus heap size and resource constraints. The key concept is the STOP-THE-WORLD pause: a window where the collector halts all application threads to work safely, during which your app does zero useful work — so pause length directly is latency. SERIAL GC is single-threaded and fully STW: minimal footprint and overhead, appropriate for tiny heaps, single-core machines, or small memory-constrained containers, and poor for anything needing to use multiple cores. PARALLEL GC (the throughput collector) uses many threads to collect but is still fully STW: it maximizes total throughput at the expense of pause length, making it ideal for batch and throughput-bound jobs where total completion time matters and nobody is waiting on individual responses. G1 GC (default since Java 9) partitions the heap into equal-size regions, does much of its work concurrently with the application, and lets you specify a PAUSE-TIME TARGET it tries to honor by collecting only as many regions as fit the budget each cycle — a well-balanced default for server applications that want good latency without sacrificing much throughput, and the right starting point for most services. ZGC and SHENANDOAH are low-latency collectors that do nearly all their work — including compaction — concurrently, achieving sub-millisecond pauses that stay roughly constant even on very large (multi-terabyte) heaps, at the cost of some throughput and additional memory/CPU overhead from the read/write barriers they rely on; they\'re the choice for latency-critical services with large heaps and strict tail-latency SLAs. So to choose: for a nightly batch, Parallel; for a typical user-facing service, G1; for a latency-critical large-heap service, ZGC/Shenandoah; for a tiny CLI or constrained container, Serial. The higher-order point I\'d stress is that the biggest wins are usually not obscure tuning flags but getting the fundamentals right — pick the collector that matches what you\'re optimizing, size the heap sensibly for the machine/container, set a realistic pause target on G1, and measure with GC logs before finer tuning — because there is no universally best collector; you\'re selecting a point on the throughput/latency curve for your specific workload.'
    },
    {
      q: 'A production service\'s memory climbs steadily until it OOMs every few days. Walk me through diagnosing and fixing it.',
      a: 'First, characterize the pattern to confirm it\'s a leak versus just an under-sized heap: enable GC logging (-Xlog:gc) or watch with a live tool (VisualVM/JConsole), and look at the heap FLOOR — the old-gen occupancy remaining after each full GC. A leak shows that floor trending steadily upward over time (the sawtooth drifts up and never returns to a stable baseline), whereas a merely small heap shows a stable-but-high floor. A steadily rising floor across days is the signature of objects accumulating that the GC can\'t reclaim because they remain reachable. Second, find WHAT is retained: capture a heap dump — proactively with jmap -dump, or automatically at the crash by running with -XX:+HeapDumpOnOutOfMemoryError (so you get a dump from the actual failure) — and open it in Eclipse MAT or VisualVM. These rank objects by RETAINED size (memory that would be freed if the object were collected) and, critically, show the PATH TO GC ROOTS — the reference chain from a root that keeps a suspect alive — plus a dominator tree. That chain typically points straight at the culprit: an ever-growing static Map or List, a collection of listeners registered but never unregistered, ThreadLocal values never removed on pooled threads, or a retained classloader (leaking Metaspace rather than heap). Third, fix by scoping references to their actual useful lifetime: bound caches with size/time eviction (e.g. an LRU via LinkedHashMap.removeEldestEntry, or a library cache like Caffeine) or use WeakHashMap/soft references where the semantics fit; unregister listeners in the matching teardown; remove() ThreadLocals in a finally; release classloaders on undeploy. Fourth, verify the fix by re-running under load and confirming the post-GC floor now plateaus. Two anti-patterns to avoid during all this: don\'t just raise -Xmx (a bigger heap only delays a real leak\'s crash and lengthens each full GC), and don\'t sprinkle System.gc() (it can\'t collect reachable objects, so it does nothing for a leak). The concrete example I keep in mind is an unbounded embedding cache — a query→vector static map that must be size-bounded from the start, or a long-running service inexorably leaks itself to death — which is why the preventive discipline (be suspicious of every long-lived static mutable collection; pair every register/set/open with an unregister/remove/close) is worth more than any post-hoc diagnosis.'
    }
  ]
};
