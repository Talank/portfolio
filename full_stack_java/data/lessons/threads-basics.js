window.LESSONS = window.LESSONS || {};
window.LESSONS['threads-basics'] = {
  id: 'threads-basics',
  title: 'Threads: Runnable, synchronized, volatile & the Java Memory Model',
  category: 'Part 5 — Concurrency',
  timeMin: 55,
  summary: 'The jvm-tools-reflection lesson showed you how to READ a thread dump — RUNNABLE, BLOCKED, WAITING, and the deadlock Zoro and Sanji act out over a rope and a wheel. This lesson explains what actually PRODUCES those states: how to start a thread, why unsynchronized shared mutable state produces a race condition (a direct, first-class cause of flaky, nondeterministic test failures), what synchronized and volatile actually guarantee — and don\'t — and the Java Memory Model rule that makes concurrency bugs different in kind from ordinary bugs: without synchronization, one thread\'s write may never become visible to another thread at all, not just late.',
  goals: [
    'Start a thread with Runnable (preferred) and explain why implementing Runnable beats extending Thread',
    'Explain what a race condition is, why count++ is not atomic, and connect this directly to nondeterministic, flaky test failures',
    'Use synchronized methods and blocks correctly for mutual exclusion, and state exactly what guarantee synchronized provides',
    'Explain volatile\'s visibility guarantee, why it does NOT provide atomicity, and pick correctly between volatile and synchronized',
    'Diagnose and prevent deadlock via consistent lock ordering — the fix for the exact BLOCKED-on-BLOCKED cycle a thread dump names'
  ],
  concept: [
    {
      h: 'Starting a thread: Runnable over extending Thread',
      p: [
        'A <code>Thread</code> is an independent path of execution within one JVM process, and the JDK gives you two ways to define what a thread runs. Extending <code>Thread</code> and overriding <code>run()</code> works, but wastes Java\'s single inheritance slot (Part 1\'s "extends one class, implements many interfaces" rule) on something that isn\'t really an is-a relationship — your task class becomes permanently unable to extend anything else. The preferred approach implements <code>Runnable</code> — a functional interface with one method, <code>void run()</code>, which the lambdas lesson means you can now write as a plain lambda — and hands it to a <code>Thread</code>: <code>Thread t = new Thread(() -> { doWork(); }); t.start();</code>. Programming to the <code>Runnable</code> interface (Part 1\'s discipline again) keeps your task logic decoupled from HOW it runs — the exact same <code>Runnable</code> can be handed to <code>new Thread(...)</code> directly, or, far more commonly in real code, submitted to an <code>ExecutorService</code> thread pool (next lesson), with zero changes.',
        'The single most important method-name distinction in this lesson: call <code>t.start()</code>, never <code>t.run()</code>. <code>start()</code> asks the JVM to allocate a new OS-level thread and have IT execute your <code>run()</code> method, concurrently with the caller. Calling <code>t.run()</code> directly just invokes the method like any ordinary method call — synchronously, on the CURRENT thread, with no new thread created at all — silently defeating the entire point and producing code that "works" (executes without error) but never actually runs concurrently, a genuinely easy mistake to make and easy to miss in review since nothing looks wrong. A thread\'s lifecycle moves through the exact states a thread dump names (the jvm-tools-reflection lesson\'s vocabulary, now with causes attached): NEW (created, not yet started), RUNNABLE (started, executing or eligible to run — the OS scheduler decides when), BLOCKED (waiting to acquire a lock another thread holds — this lesson\'s synchronized section explains exactly how this arises), WAITING/TIMED_WAITING (parked, waiting to be signaled or for a timeout), and TERMINATED (run() has returned).'
      ]
    },
    {
      h: 'Race conditions: why count++ is not atomic, and the flaky-test connection',
      p: [
        'A <b>race condition</b> occurs when the correctness of a result depends on the unpredictable TIMING or INTERLEAVING of multiple threads accessing shared mutable state — and it is the single most direct, well-documented cause of nondeterministic, flaky test failures rooted in production-code bugs (as opposed to environmental causes like the datetime lesson\'s LocalDateTime mistake). The canonical example: <code>count++</code> LOOKS like one operation but is actually THREE separate steps at the machine level — READ the current value of <code>count</code>, ADD one to it, WRITE the new value back. If two threads both execute <code>count++</code> on a shared field with no coordination, an interleaving like this is entirely possible: thread A reads count=5; thread B reads count=5 (before A has written back); thread A computes 6 and writes count=6; thread B ALSO computes 6 (from its stale read of 5) and writes count=6 — TWO increments happened, but the final value is 6, not 7. One increment was silently LOST. Run this same code a thousand times and you might get the correct answer most of the time (the interleaving that causes the bug is a narrow timing window) and the wrong answer occasionally — which is EXACTLY what a flaky test looks like: no code change between runs, a test that usually passes and occasionally, unpredictably fails.',
        'This is the crucial insight worth sitting with: a race condition bug is not "sometimes the code is buggy" — the code is ALWAYS buggy, every single run, in the sense that it always has the SAME latent flaw (an unprotected read-modify-write on shared state); it just doesn\'t always manifest as a visibly wrong RESULT, because manifesting requires two threads\' operations to interleave in the specific unlucky order that loses an update. This is why race-condition bugs are notoriously hard to reproduce on demand, hard to catch in code review (the code often "looks fine" to a reader who isn\'t specifically thinking about interleaving), and why they disproportionately show up in CI environments running under different load and timing characteristics than a developer\'s laptop — a test suite that passes locally 100 times and fails 1-in-200 on a shared CI runner is the fingerprint of exactly this class of bug, and it is one of the concrete, well-studied root causes of flaky tests in real-world software.'
      ]
    },
    {
      h: 'synchronized: mutual exclusion via a monitor lock',
      p: [
        'The <code>synchronized</code> keyword fixes the race by giving a block of code MUTUAL EXCLUSION — a guarantee that at most ONE thread can be executing that block, for a given lock object, at any moment. Every Java object has an implicit MONITOR lock. A <code>synchronized</code> INSTANCE METHOD (<code>synchronized void increment() { count++; }</code>) locks on <code>this</code> for its entire duration; a <code>synchronized</code> STATIC method locks on the class\'s <code>Class</code> object instead; a <code>synchronized</code> BLOCK (<code>synchronized (lockObject) { count++; }</code>) locks on whichever object you name, giving finer control over exactly what\'s protected and by which lock — useful when a class has multiple independent pieces of state that don\'t need to block each other. When a thread tries to enter a synchronized block guarded by a lock another thread currently holds, it doesn\'t spin or fail — it enters the BLOCKED state (exactly the thread-dump state from the jvm-tools-reflection lesson) and waits until the lock is released, at which point exactly one waiting thread is granted entry.',
        'With <code>synchronized void increment() { count++; }</code>, the race from the previous section is fixed: the read-modify-write sequence now happens as one indivisible unit from every OTHER thread\'s point of view — a second thread attempting <code>increment()</code> while the first is mid-operation is BLOCKED until the first fully completes, so the lost-update interleaving can never occur. But this correctness costs something real: threads contending for the same lock serialize (only one makes progress at a time on that protected section), which is a genuine performance cost under heavy contention, and — the sharper danger — a program that acquires MULTIPLE locks in an inconsistent order across different code paths can deadlock, which the last section of this lesson addresses directly. The discipline: synchronize the SMALLEST section of code that actually needs protection (holding a lock longer than necessary only increases contention and deadlock risk), and know exactly which shared mutable state each lock is protecting — a lock protecting nothing, or protecting the wrong field, gives you contention cost with none of the safety benefit.'
      ]
    },
    {
      h: 'volatile: visibility, not atomicity — and the Java Memory Model reason why',
      p: [
        'The Java Memory Model (JMM) permits something genuinely surprising to programmers coming from single-threaded intuition: without explicit synchronization, a write one thread makes to a shared field may NEVER become visible to another thread — not "eventually, after a delay," but potentially never, for as long as both threads run. This isn\'t a bug; it\'s a deliberate, specified allowance that lets the JVM and CPU cache values in registers or per-core caches and reorder instructions for performance, exactly the kind of optimization that\'s invisible and harmless in single-threaded code but becomes a genuine correctness hazard the moment a SECOND thread is reading that same field. A thread spinning on <code>while (!stop) { doWork(); }</code>, where another thread sets <code>stop = true</code> with no synchronization at all, can loop FOREVER on some JVM/hardware combinations — it may keep reading a cached, stale <code>false</code> value indefinitely, never observing the other thread\'s write.',
        'The <code>volatile</code> keyword fixes exactly this visibility problem, and ONLY this problem: <code>private volatile boolean stop;</code> guarantees that a write to <code>stop</code> by one thread is IMMEDIATELY visible to any thread that subsequently reads it (the JMM formalizes this as a "happens-before" edge: a volatile write happens-before every subsequent volatile read of that same field), and it also prevents the compiler/CPU from reordering instructions around that access. This is precisely the right (and cheaper-than-synchronized) tool for a simple flag one thread sets and another thread reads — a shutdown signal, a "configuration changed" flag. But <code>volatile</code> does <b>NOT</b> provide atomicity: <code>private volatile int count; ... count++;</code> is STILL a race condition — the read-modify-write is still three separate steps, volatile only guarantees each individual read and write is visible and ordered correctly, not that the whole compound operation is indivisible. The decision rule: use <code>volatile</code> for a single, simple flag or reference that one thread sets and others read, where the operation is a plain assignment; use <code>synchronized</code> (or the concurrent-collections lesson\'s atomic classes) the moment the operation is a compound read-modify-write, however innocent-looking (<code>count++</code>, <code>if (list.isEmpty()) list.add(x)</code>, any "check then act").'
      ]
    },
    {
      h: 'Deadlock: the BLOCKED-on-BLOCKED cycle, and the fix is lock ordering',
      p: [
        'A deadlock is exactly the cycle the jvm-tools-reflection lesson\'s thread dump named outright: Zoro holds the rope and waits for the wheel; Sanji holds the wheel and waits for the rope — each BLOCKED, waiting on a lock the OTHER thread holds, forever, because neither will release what it has until it gets what it\'s waiting for. In code, this happens when two threads acquire the SAME two locks in OPPOSITE order: thread A does <code>synchronized (lockRope) { synchronized (lockWheel) { ... } }</code> while thread B does <code>synchronized (lockWheel) { synchronized (lockRope) { ... } }</code> — if A grabs <code>lockRope</code> and B grabs <code>lockWheel</code> at nearly the same moment, A now waits for <code>lockWheel</code> (held by B) and B now waits for <code>lockRope</code> (held by A), and neither can ever proceed. The JVM does not detect or break this automatically at runtime — it will hang forever unless something external intervenes (a timeout, a restart), which is exactly why <code>jstack</code>\'s explicit "Found one Java-level deadlock" detection is such a valuable diagnostic tool.',
        'The fix is a discipline, not a clever trick: establish and follow a <b>consistent global lock ordering</b> across your ENTIRE codebase — decide, once, that (for instance) <code>lockRope</code> is always acquired before <code>lockWheel</code>, everywhere, in every code path that needs both, with no exceptions — and the cyclic-wait condition that causes deadlock becomes structurally impossible, because a cycle in the lock-acquisition graph requires at least one path that acquires them in the "wrong" order. When the natural ordering isn\'t obvious (locking two arbitrary objects of the same type, say, in a transfer-between-accounts scenario), a common technique is ordering by some fixed, comparable property of the objects themselves — their <code>System.identityHashCode()</code> or an assigned ID — so any two threads locking the SAME pair of objects always agree on which to lock first, regardless of which order their own local logic would otherwise suggest. A second, complementary tool is <code>Lock.tryLock(timeout)</code> (from <code>java.util.concurrent.locks</code>, briefly previewed here and expanded in the next lesson) — instead of blocking forever waiting for a contended lock, a thread can give up after a timeout, release what it already holds, and retry, which turns a permanent hang into a recoverable, retriable failure. But consistent lock ordering is the primary, first-line defense — it prevents the deadlock from ever becoming POSSIBLE, rather than merely surviving one when it happens.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The lost coin in the treasure count, Nami\'s quill, the lookout\'s shout, and the rope-wheel deadlock — this time, fixed',
      text: 'When the crew counts freshly-hauled treasure, TWO crew members sometimes grab handfuls at once, each shouting out a running total from memory without checking with the other first — "we\'re at 500!" one calls, having started from 499 a beat before the other ALSO started from 499 and called "500!" too — and the pile is quietly undercounted by one, every time this exact unlucky timing happens, though most of the time they don\'t collide and the count comes out right (a race condition: count++ isn\'t one atomic step, it\'s read-then-add-then-announce, and two crewmates racing through those three steps together silently lose an increment — correct most runs, wrong on the unlucky interleaving, exactly a flaky test\'s signature). Nami\'s fix, once she catches it: ONE quill lives on the ledger, and NOBODY may write a new total without physically holding it — whoever has the quill counts and writes undisturbed, and everyone else must wait their turn (synchronized: mutual exclusion via one shared lock, guaranteeing the read-add-write happens as one indivisible unit). But for something simpler — the lookout spotting land and raising a flag — Nami doesn\'t bother with the quill at all; the flag itself is built to be seen INSTANTLY and unambiguously by anyone glancing at the mast, no ceremony required, just a guarantee that the moment it goes up, everyone sees it go up (volatile: cheap, immediate visibility for a simple flag, no atomicity needed because raising a flag is a single simple act, not a count-and-update). And the rope-wheel deadlock from before — Zoro holding rope wanting wheel, Sanji holding wheel wanting rope, the ship frozen — gets a permanent fix once Nami names the rule: from now on, EVERY crew member grabs the rope BEFORE the wheel, always, no exceptions, in every drill, every storm, every maneuver (consistent lock ordering) — and with that one rule, the cycle that caused the freeze becomes physically impossible to recreate, because nobody\'s path through the rigging ever grabs them in the opposite order again.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'The whiteboard tally, the marker rule, the doorbell, and the remote-control deadlock — this time, fixed',
      text: 'When two roommates update the shared "who owes what" tally on the kitchen whiteboard at nearly the same moment — each reading the current total, adding their own item in their head, and writing a NEW total back without checking the other\'s update first — one contribution occasionally vanishes: Howard reads $40, silently plans to write $45; Raj, a beat earlier, ALSO read $40 and writes $46; Howard, still working from his stale $40, overwrites it with $45, erasing Raj\'s update entirely (a race condition: the read-add-write tally update isn\'t atomic, and the collision only happens on unlucky timing — the tally is usually right, occasionally silently wrong, exactly a flaky bug\'s fingerprint). Sheldon\'s fix, once he catches the discrepancy: ONE marker lives on a designated hook, and the Roommate Agreement now states you may not write a new total on the whiteboard without physically holding that marker — whoever has it updates undisturbed while everyone else waits their turn (synchronized: one shared lock enforcing that the read-add-write happens as one indivisible step). But for something simpler — announcing "pizza\'s here" — nobody needs the marker at all; Sheldon just wants the announcement to be INSTANTLY and unambiguously heard by everyone in the apartment the moment it\'s made, no ceremony, no lock, just a guarantee of immediate visibility (volatile: cheap, immediate visibility for a simple one-shot signal, since announcing pizza\'s arrival is a single simple act, not a count that needs protecting). And the classic Sheldon-Leonard deadlock — Sheldon holding the thermostat remote wanting the TV remote, Leonard holding the TV remote wanting the thermostat remote, both refusing to yield, the whole evening frozen — gets permanently fixed once Sheldon (grudgingly) accepts a new Roommate Agreement clause: from now on, whoever wants EITHER remote must pick up the thermostat remote FIRST, always, no exceptions (consistent lock ordering) — and with that single rule in force, the exact cycle that caused the standoff can never happen again, because nobody\'s reach for the remotes goes in the opposite order anymore.',
    },
    why: 'The lost coin / vanished whiteboard tally is a race condition: count++ (or "read, add, write back") is three steps, not one, and two crew members/roommates racing through those steps together can silently lose an update — right most of the time, silently wrong on the unlucky interleaving, exactly a flaky test\'s signature. Nami\'s quill / Sheldon\'s marker is synchronized: one shared lock making the read-add-write indivisible, forcing everyone else to wait their turn. The lookout\'s flag / the pizza announcement is volatile: cheap, immediate visibility for a SIMPLE signal, with no atomicity needed because it\'s one plain act, not a compound update. And the rope-wheel / remote-control deadlock — the exact BLOCKED-on-BLOCKED cycle the jvm-tools-reflection lesson\'s thread dump named — is permanently fixed by consistent lock ordering: agree, once, on which lock everyone grabs first, and the cyclic-wait that causes deadlock becomes structurally impossible.'
  },
  storyAnim: {
    title: 'The lost coin, the quill, the flag, and the fixed grab-order',
    h: 320,
    props: [
      { id: 'race', emoji: '🪙', label: 'two crewmates count-add-shout at once: one coin silently lost', x: 10, y: 10 },
      { id: 'quill', emoji: '🖋️', label: 'ONE quill: whoever holds it writes, everyone else waits (synchronized)', x: 38, y: 10 },
      { id: 'flag', emoji: '🚩', label: 'lookout\'s flag: instantly visible to all, no ceremony (volatile)', x: 66, y: 10 },
      { id: 'noatomic', emoji: '🚫', label: 'a flag alone can\'t protect a COUNT — volatile ≠ atomic', x: 90, y: 10 },
      { id: 'deadlockold', emoji: '🔒', label: 'old bug: Zoro grabs rope-then-wheel, Sanji grabs wheel-then-rope — frozen', x: 25, y: 50 },
      { id: 'fixedorder', emoji: '✅', label: 'new rule: EVERYONE grabs rope before wheel, always — deadlock now impossible', x: 65, y: 50 }
    ],
    actors: [
      { id: 'nami', emoji: '🍊', label: 'Nami', x: 45, y: 26 },
      { id: 'zoro', emoji: '⚔️', label: 'Zoro', x: 20, y: 66 },
      { id: 'sanji', emoji: '🚬', label: 'Sanji', x: 70, y: 66 }
    ],
    steps: [
      { c: 'Two crewmates count and shout a running total at nearly the same moment — both starting from the SAME stale number. One coin gets silently lost. That\'s a race condition: read-add-write isn\'t one step.', p: { race: 'bad' } },
      { c: 'Nami\'s fix: one quill, one writer at a time. Whoever holds it counts and writes undisturbed; everyone else waits their turn. That\'s synchronized — mutual exclusion.', p: { quill: 'good' }, a: { nami: [38, 26] } },
      { c: 'The lookout\'s flag needs no quill at all — the moment it\'s raised, everyone sees it, instantly. That\'s volatile: cheap visibility for a simple signal.', p: { flag: 'lit' } },
      { c: 'But a flag alone can\'t safely protect a running COUNT — raising it is one simple act, while a count is a compound read-add-write. Volatile is not a substitute for synchronized here.', p: { noatomic: 'bad' } },
      { c: 'The old bug: Zoro grabs rope then reaches for wheel; Sanji grabs wheel then reaches for rope. Both end up BLOCKED, waiting on what the other holds. The ship freezes — deadlock.', p: { deadlockold: 'bad' }, a: { zoro: [20, 66], sanji: [70, 66] } },
      { c: 'Nami\'s permanent fix: EVERYONE grabs the rope before the wheel, always, no exceptions. With one consistent order, the cycle that caused the freeze can never form again.', p: { fixedorder: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'From race condition to synchronized, volatile, and deadlock-safe locking',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Start a thread',
        nodes: [
          { id: 'runnable', text: 'implement Runnable, pass to new Thread(...)\nnot extends Thread' },
          { id: 'startvsrun', text: 't.start() — new thread\nt.run() — same thread, NOT concurrent (bug)' }
        ]
      },
      {
        label: 'The race condition',
        nodes: [
          { id: 'notatomic', text: 'count++ = read, add, write\n3 steps, not 1' },
          { id: 'lostupdate', text: 'two threads interleave →\none increment silently lost' },
          { id: 'flakylink', text: 'right most runs, wrong on\nthe unlucky interleaving = flaky' }
        ]
      },
      {
        label: 'Fix atomicity: synchronized',
        nodes: [
          { id: 'mutex', text: 'synchronized: mutual exclusion\none thread in the block at a time' },
          { id: 'cost', text: 'cost: contention + deadlock risk\nkeep protected sections small' }
        ]
      },
      {
        label: 'Fix visibility only: volatile',
        nodes: [
          { id: 'jmm', text: 'JMM: unsynchronized writes may\nNEVER become visible to another thread' },
          { id: 'volatileflag', text: 'volatile: visibility + ordering\nfor a SIMPLE flag, not atomicity' }
        ]
      },
      {
        label: 'Prevent deadlock',
        nodes: [
          { id: 'cycle', text: 'A holds lock1 wants lock2;\nB holds lock2 wants lock1 → BLOCKED forever' },
          { id: 'ordering', text: 'consistent global lock ordering\nmakes the cycle structurally impossible' }
        ]
      }
    ],
    steps: [
      { active: ['runnable'], note: 'Implement Runnable and hand it to Thread (or, more commonly, an executor) rather than extending Thread — keeps your single-inheritance slot free and decouples the task from how it runs.' },
      { active: ['startvsrun'], note: 'Calling run() directly executes synchronously on the current thread — no concurrency happens at all, silently. Always call start().' },
      { active: ['notatomic'], note: 'A compound operation like count++ is read-then-add-then-write — three separate steps at the machine level, not one atomic step.' },
      { active: ['lostupdate'], note: 'Two threads can interleave their read/add/write steps such that one thread\'s update is silently overwritten by the other\'s stale write — an update is lost with no exception, no warning.' },
      { active: ['flakylink'], note: 'Because the bad interleaving only happens on unlucky timing, the same buggy code produces a correct result most runs and a wrong result occasionally — the exact signature of a flaky test.' },
      { active: ['mutex'], note: 'synchronized gives mutual exclusion: only one thread executes the protected section (for a given lock) at a time, making the compound read-add-write indivisible from every other thread\'s perspective.' },
      { active: ['cost'], note: 'Correctness has a cost: contending threads serialize, and multiple locks acquired inconsistently across code paths can deadlock. Protect only what needs protecting, and keep the critical section small.' },
      { active: ['jmm'], note: 'The Java Memory Model deliberately allows a write in one thread to never become visible to another without synchronization — caches and reordering are invisible and harmless single-threaded, but a real hazard once a second thread reads the same field.' },
      { active: ['volatileflag'], note: 'volatile guarantees a write is immediately visible to subsequent readers and prevents reordering around it — correct for a simple flag one thread sets and others read, but it does NOT make a compound operation like count++ atomic.' },
      { active: ['cycle'], note: 'Deadlock is a cycle: thread A holds lock1 and waits for lock2 (held by B); thread B holds lock2 and waits for lock1 (held by A). Neither can proceed, ever, without external intervention.' },
      { active: ['ordering'], note: 'Establishing and following one consistent global order for acquiring multiple locks makes the cyclic-wait condition structurally impossible — the primary, first-line defense against deadlock.' }
    ]
  },
  tech: [
    {
      q: 'What exactly is a race condition, and why does it connect specifically to flaky tests rather than just "bugs"?',
      a: 'A race condition is a defect where the CORRECTNESS of a program\'s outcome depends on the unpredictable relative timing or interleaving of operations across multiple threads accessing shared mutable state. The canonical example is a compound operation like count++, which is actually three separate machine-level steps — read the current value, compute the incremented value, write it back — with no atomicity between them unless you explicitly provide it. When two threads execute count++ concurrently without synchronization, an unlucky interleaving (thread A reads, thread B reads the SAME stale value before A writes back, both compute the same "next" value, both write it, and one increment is silently lost) is possible but not guaranteed on any given run — it depends entirely on the exact timing of context switches, scheduler decisions, and cache visibility, none of which your code controls or can predict. This is precisely why race conditions manifest as FLAKY tests rather than reliably failing tests: the underlying defect — an unprotected read-modify-write on shared state — is present in the code on every single execution, but it only produces a visibly WRONG result on the runs where the timing happens to hit the narrow interleaving window that causes a lost update; most runs, the threads happen not to collide in that specific way, and the test passes. A test suite that passes locally on a quiet laptop nearly every time but fails intermittently on a busier, differently-scheduled CI runner is close to a diagnostic signature for exactly this class of bug — and it is genuinely one of the most well-documented, real-world root causes of flakiness in production test suites, distinct from (though sometimes compounding with) environmental causes like the datetime lesson\'s LocalDateTime timestamp mistake.'
    },
    {
      q: 'What does synchronized actually guarantee, and what are the real costs of using it?',
      a: 'synchronized provides mutual exclusion via an object\'s intrinsic monitor lock: for a given lock, at most one thread can be executing any code block synchronized on that SAME lock at any moment — a second thread attempting to enter is placed into the BLOCKED state (the thread-dump vocabulary from the jvm-tools-reflection lesson) and waits until the first thread exits the block, releasing the lock. A synchronized instance method locks on this; a synchronized static method locks on the class\'s Class object; a synchronized(someObject) { ... } block locks on whatever object you explicitly name, which is the more flexible and often better choice when a class has multiple independent pieces of state that shouldn\'t need to block each other unnecessarily. Beyond atomicity for the protected section, synchronized ALSO provides the same visibility guarantee volatile gives (this is specified by the JMM: releasing a lock happens-before a subsequent acquisition of that SAME lock by another thread), so synchronized fixes both the atomicity and visibility halves of the shared-mutable-state problem in one mechanism, which is why it\'s the tool of choice for compound operations. The real costs: first, PERFORMANCE — threads contending for the same lock serialize, meaning only one makes progress at a time through the protected section, which under heavy contention can become a genuine throughput bottleneck (this is exactly why you protect the smallest section of code that actually needs it, not entire methods when only one field access needs protecting); second, and more dangerous, DEADLOCK RISK — a program acquiring multiple different locks across different code paths, in inconsistent order, can produce the exact BLOCKED-on-BLOCKED cycle a thread dump names as a Java-level deadlock, hanging forever with no automatic recovery. The discipline that makes synchronized safe in practice: know precisely which state each lock protects, keep critical sections small, and never acquire multiple locks in an order that varies by code path.'
    },
    {
      q: 'Explain what the Java Memory Model allows that surprises people, and precisely what volatile fixes versus what it does NOT fix.',
      a: 'The Java Memory Model formally permits something that contradicts naive single-threaded intuition: in the absence of explicit synchronization (synchronized, volatile, or other JMM-aware constructs), a write one thread makes to a shared field is not GUARANTEED to ever become visible to another thread reading that same field — not "will show up eventually, just delayed," but potentially never, for the entire remaining lifetime of both threads. This is a deliberate specification choice, not an implementation bug: it exists precisely to allow legitimate, hugely valuable optimizations — a CPU core caching a value in a register or its local cache line rather than round-tripping to main memory on every access, and the compiler/CPU reordering independent instructions for pipeline efficiency — both of which are completely invisible and harmless within a single thread\'s own view of its own operations, and only become an observable correctness problem the moment a SECOND thread is reading the same memory location without a synchronization point connecting the two threads\' views. The textbook illustration: a worker thread spinning on while (!stop) { doWork(); }, with a separate thread setting stop = true and no synchronization anywhere, can in principle loop forever, never observing the write, on JVM/hardware combinations where that value gets cached and the write never becomes visible. volatile fixes EXACTLY this visibility (and instruction-reordering) problem for the specific field it\'s applied to: a write to a volatile field happens-before any subsequent read of that same field by any thread, guaranteeing the write becomes visible essentially immediately and that surrounding instructions aren\'t reordered across that access. What volatile explicitly does NOT fix is atomicity of COMPOUND operations: private volatile int count; ...count++; is still a genuine race condition, because volatile only makes each individual read and each individual write instantaneously visible and correctly ordered — it does nothing to make the read-modify-write SEQUENCE indivisible, so two threads can still interleave their three steps and lose an update exactly as in the unsynchronized case. The decision rule that follows directly: volatile for a single field where every operation on it is a PLAIN assignment (a boolean flag, a reference swap) that one thread writes and others merely read; synchronized (or an atomic class, next lesson) the instant the operation on that field is a compound read-then-write, however small or innocent it looks in source code.'
    },
    {
      q: 'Walk through exactly how a deadlock forms between two locks, and explain why consistent lock ordering is a structural fix rather than a workaround.',
      a: 'Deadlock requires a specific cyclic condition: at minimum two threads, each holding at least one lock the OTHER thread needs, and each unwilling (actually, unable) to release what it holds until it acquires what it\'s waiting for. Concretely: thread A executes synchronized (lockRope) { synchronized (lockWheel) { ... } } and thread B executes synchronized (lockWheel) { synchronized (lockRope) { ... } } — if the timing is such that A acquires lockRope and, before it can proceed, B acquires lockWheel, then A is now BLOCKED waiting for lockWheel (which B holds), and B is now BLOCKED waiting for lockRope (which A holds). Neither thread will ever release its held lock, because releasing only happens when the synchronized block\'s code finishes executing, and neither thread\'s code can finish executing until it acquires the OTHER lock — a genuine, permanent standstill with no timeout, no automatic recovery, and no progress possible for either thread ever again (this is precisely the "Found one Java-level deadlock" pattern jstack detects and names explicitly, per the jvm-tools-reflection lesson, by analyzing exactly this holds-and-waits-for cycle across all threads). The fix — establishing and enforcing a single, consistent GLOBAL ordering for acquiring any set of locks that might ever be needed together (e.g., "lockRope is always acquired before lockWheel, in every code path, everywhere in the codebase, no exceptions") — is structural rather than a patch, because it makes the CYCLE itself impossible to form: a cycle in a lock-acquisition graph requires at least one path acquiring the locks in a different order than another path; if literally every path in the program acquires shared locks in the same fixed order, there is no possible interleaving of any threads that produces a cyclic wait, regardless of timing, load, or scheduling — the deadlock isn\'t merely unlikely, it\'s provably unreachable. When a natural, obvious ordering doesn\'t exist (locking two arbitrary same-type objects, as in transferring between two accounts chosen at runtime), a common technique orders by some fixed, comparable identity of the objects themselves (e.g., an assigned account ID or System.identityHashCode()) so that ANY two threads locking the same pair of objects independently derive the SAME acquisition order, without needing global coordination beyond that one rule. Lock.tryLock(timeout) from java.util.concurrent.locks is a complementary, not competing, defense — it converts a potential permanent hang into a bounded, retriable failure — but consistent ordering remains the primary tool because it prevents the hazardous condition from ever arising in the first place.'
    }
  ],
  code: {
    title: 'A shared counter: broken, fixed with synchronized, and a volatile shutdown flag',
    intro: 'Two threads incrementing a shared int demonstrate a genuine race condition and its fix, plus a volatile flag showing the visibility-only guarantee, and a lock-ordering comment showing the deadlock fix from this lesson\'s story.',
    code: `import java.util.concurrent.atomic.AtomicInteger;

class UnsafeCounter {
    private int count = 0;
    void increment() { count++; }     // read-modify-write: NOT atomic — a race condition under concurrent calls
    int get() { return count; }
}

class SafeCounter {
    private int count = 0;
    synchronized void increment() { count++; }   // mutual exclusion: the whole read-modify-write is now indivisible
    synchronized int get() { return count; }      // must also synchronize the READ for a consistent, visible value
}

class ShutdownSignal {
    private volatile boolean stop = false;        // visibility only — a simple flag, one writer, many readers
    void requestStop() { stop = true; }
    boolean shouldStop() { return stop; }
}

public class ThreadsDemo {
    public static void main(String[] args) throws InterruptedException {
        // --- The race: two threads, 100,000 increments each, on an UNSAFE counter ---
        UnsafeCounter unsafe = new UnsafeCounter();
        Runnable incrementTask = () -> {
            for (int i = 0; i < 100_000; i++) unsafe.increment();
        };
        Thread t1 = new Thread(incrementTask);
        Thread t2 = new Thread(incrementTask);
        t1.start(); t2.start();
        t1.join(); t2.join();                      // wait for both threads to finish
        System.out.println("unsafe result (expect 200000, often LESS): " + unsafe.get());

        // --- The fix: same test, SAFE counter ---
        SafeCounter safe = new SafeCounter();
        Runnable safeIncrementTask = () -> {
            for (int i = 0; i < 100_000; i++) safe.increment();
        };
        Thread t3 = new Thread(safeIncrementTask);
        Thread t4 = new Thread(safeIncrementTask);
        t3.start(); t4.start();
        t3.join(); t4.join();
        System.out.println("safe result (always exactly 200000): " + safe.get());

        // --- volatile: visibility for a simple flag, correctly stopping a worker ---
        ShutdownSignal signal = new ShutdownSignal();
        Thread worker = new Thread(() -> {
            int iterations = 0;
            while (!signal.shouldStop()) { iterations++; }   // reads the volatile flag every loop
            System.out.println("worker stopped after observing the flag, iterations > 0: " + (iterations > 0));
        });
        worker.start();
        Thread.sleep(50);
        signal.requestStop();                       // visible to the worker thread almost immediately
        worker.join();

        // Deadlock prevention note (see lockRope/lockWheel in the concept section):
        // ALWAYS acquire locks in the SAME global order across every code path that needs more than one.
        // AtomicInteger (next lesson) is often a lighter-weight alternative to synchronized for simple counters:
        AtomicInteger atomicCount = new AtomicInteger(0);
        atomicCount.incrementAndGet();               // atomic, no explicit lock needed
        System.out.println("atomic count: " + atomicCount.get());
    }
}`,
    notes: [
      'unsafe.get() after 200,000 total increments across two threads frequently prints a number LESS than 200000 — the exact, reproducible-in-principle-but-nondeterministic-in-practice symptom of the lost-update race condition described in the concept section.',
      'SafeCounter synchronizes BOTH increment() and get() — synchronizing only the write and reading the field unsynchronized would still risk seeing a stale, non-visible value on some JVM/hardware combinations, since only synchronized access establishes the happens-before relationship on BOTH sides.',
      'ShutdownSignal\'s worker thread reliably observes the volatile stop flag becoming true — try changing volatile to a plain boolean and the loop can, on some environments, never terminate, silently hanging. Run: javac ThreadsDemo.java UnsafeCounter.java SafeCounter.java ShutdownSignal.java && java ThreadsDemo (or one file with all types).'
    ]
  },
  lab: {
    title: 'Fix a race condition with synchronized, correctly',
    prompt: 'Write a class <code>Tally</code> with a private <code>int total</code> field. Provide <code>synchronized void add(int amount)</code> that adds <code>amount</code> to <code>total</code>, and <code>synchronized int total()</code> that returns the current total (it must ALSO be synchronized — reading an unsynchronized field gives no visibility guarantee even if writes are synchronized). Then write a <code>main</code> method that starts TWO threads, each calling <code>add(1)</code> 50,000 times, joins both, and prints the result — it must always print exactly <code>100000</code>.',
    starter: `class Tally {
    private int total = 0;

    void add(int amount) {
        // must be synchronized
    }

    int total() {
        // must ALSO be synchronized
        return 0; // replace
    }

    public static void main(String[] args) throws InterruptedException {
        Tally tally = new Tally();
        Runnable task = () -> {
            for (int i = 0; i < 50_000; i++) tally.add(1);
        };
        Thread t1 = new Thread(task);
        Thread t2 = new Thread(task);
        // start both threads, join both, print tally.total() — must always be 100000
    }
}`,
    checks: [
      { re: 'synchronized\\s+void\\s+add\\s*\\(\\s*int\\s+amount\\s*\\)', must: true, hint: 'add(int amount) must be declared synchronized.', pass: 'add is synchronized ✓' },
      { re: 'synchronized\\s+int\\s+total\\s*\\(\\s*\\)', must: true, hint: 'total() must ALSO be declared synchronized.', pass: 'total() is synchronized ✓' },
      { re: 'total\\s*\\+=\\s*amount|total\\s*=\\s*total\\s*\\+\\s*amount', must: true, hint: 'add must do total += amount (or equivalent).', pass: 'add updates total ✓' },
      { re: 't1\\.start\\s*\\(\\s*\\)[\\s\\S]*?t2\\.start\\s*\\(\\s*\\)', must: true, hint: 'Start both t1 and t2.', pass: 'both threads started ✓' },
      { re: 't1\\.join\\s*\\(\\s*\\)[\\s\\S]*?t2\\.join\\s*\\(\\s*\\)', must: true, hint: 'Join both t1 and t2 BEFORE printing the result, so both threads have finished.', pass: 'both threads joined ✓' },
      { re: '\\.run\\s*\\(\\s*\\)', must: false, hint: 'Do not call .run() directly — that runs synchronously on the current thread, not concurrently. Use .start().', pass: 'no direct .run() call ✓' }
    ],
    run: 'javac Tally.java && java Tally — run it several times; the result must always print exactly 100000. Then, as an experiment, remove synchronized from add (leave total() synchronized) and run it several times to see an occasional wrong, LOWER number.',
    solution: `class Tally {
    private int total = 0;

    synchronized void add(int amount) {
        total += amount;
    }

    synchronized int total() {
        return total;
    }

    public static void main(String[] args) throws InterruptedException {
        Tally tally = new Tally();
        Runnable task = () -> {
            for (int i = 0; i < 50_000; i++) tally.add(1);
        };
        Thread t1 = new Thread(task);
        Thread t2 = new Thread(task);
        t1.start();
        t2.start();
        t1.join();
        t2.join();
        System.out.println(tally.total());   // always exactly 100000
    }
}`,
    notes: [
      'Both add and total() are synchronized on the same implicit lock (this) — that shared lock is what makes the write in one thread visible and the compound update indivisible from the other thread\'s perspective.',
      't1.join() and t2.join() are essential before reading the final total — without joining, main could print the result before either worker thread has finished all 50,000 increments, which is a different bug (reading too early) layered on top of the concurrency lesson.',
      'The suggested experiment (removing synchronized from add only) is worth actually running — it reliably demonstrates that the bug is REAL and reproducible, not just a theoretical concern, while also showing why it can take many runs before the wrong answer shows up.'
    ]
  },
  quiz: [
    {
      q: 'Why is `count++` on a field shared between threads not safe without synchronization, even though it looks like one operation?',
      options: ['It is actually three separate steps — read the current value, compute the incremented value, write it back — and two threads can interleave those steps such that one thread\'s update is silently lost', 'It IS safe; int fields are always atomic in Java regardless of concurrent access', 'It throws a compile error when used across multiple threads', 'It is only unsafe for long and double fields, not int'],
      correct: 0,
      explain: 'count++ compiles to a read, a computation, and a write — three distinct steps with no atomicity guarantee between them by default. Two threads racing through those steps can both read the same stale value and one increment gets silently overwritten, losing an update.'
    },
    {
      q: 'A developer calls `myThread.run()` instead of `myThread.start()`. What actually happens?',
      options: ['run() executes synchronously on the CURRENT thread, like any ordinary method call — no new thread is created and no concurrency occurs at all', 'It throws an IllegalStateException because run() cannot be called directly', 'It behaves identically to start() — both create a new thread', 'It silently does nothing and the method body never executes'],
      correct: 0,
      explain: 'run() is just a regular method; calling it directly invokes the method body on whichever thread made the call, synchronously — no new OS thread is spawned. Only start() actually creates a new thread and schedules run() to execute on it concurrently.'
    },
    {
      q: 'What does the `volatile` keyword guarantee, and what does it explicitly NOT guarantee?',
      options: ['It guarantees that a write to the field is immediately visible to subsequent reads by other threads and prevents instruction reordering around the access — but it does NOT make compound operations like count++ atomic', 'It guarantees full atomicity for any operation on the field, including count++', 'It guarantees the field can only be accessed by one thread at a time, like synchronized', 'It has no runtime effect in modern JVMs and exists only for documentation purposes'],
      correct: 0,
      explain: 'volatile solves visibility and ordering — a write becomes immediately visible to subsequent readers. It does NOT solve atomicity: a compound read-modify-write like count++ on a volatile field is still a genuine race condition, since volatile only protects individual reads and writes, not multi-step sequences.'
    },
    {
      q: 'Thread A does `synchronized(lock1) { synchronized(lock2) { ... } }` and thread B does `synchronized(lock2) { synchronized(lock1) { ... } }`. What risk does this create?',
      options: ['Deadlock — if A acquires lock1 and B acquires lock2 around the same time, each becomes BLOCKED waiting for the lock the other holds, and neither can ever proceed', 'No risk — synchronized blocks never interact with each other regardless of nesting order', 'A race condition, but not a deadlock, since both threads eventually finish', 'A compile error, since the same two locks cannot be nested in different orders'],
      correct: 0,
      explain: 'Acquiring the same two locks in OPPOSITE order across different threads/code paths is the textbook deadlock setup: each thread can end up holding one lock while waiting for the other, with neither able to release what it holds until it gets what it needs — a permanent, unrecoverable standstill without external intervention.'
    },
    {
      q: 'What is the primary, structural fix for the deadlock risk in the previous question?',
      options: ['Establish and consistently follow ONE global lock-acquisition order (e.g., always lock1 before lock2) across every code path in the codebase that needs both locks', 'Add more synchronized blocks around the existing ones to be extra safe', 'Switch from synchronized to volatile on both locks', 'Nothing can prevent this; deadlocks must simply be detected and the process restarted'],
      correct: 0,
      explain: 'A cycle in the lock-wait graph (the necessary condition for deadlock) requires at least one code path acquiring shared locks in a different order than another path. If every path in the program acquires the same set of locks in the SAME fixed order, that cyclic-wait condition becomes structurally impossible to create, regardless of timing or scheduling.'
    }
  ],
  testFlow: {
    title: 'Test yourself: threads, races, and deadlock under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A test suite has a method that spins up two threads to increment a shared, unsynchronized int counter, then asserts the final count equals the expected total. It passes on your laptop nearly every run but fails about 1 in 300 runs on the CI server. What\'s the most likely explanation?',
        choices: [
          { text: 'A genuine race condition — the unsynchronized count++ is a three-step read-modify-write, and CI\'s different scheduling/load characteristics occasionally trigger the unlucky interleaving that loses an update, exactly the flaky-test signature of this bug class', to: 'q1_right' },
          { text: 'The CI server\'s clock is out of sync, causing the count to be computed incorrectly', to: 'q1_wrong_clock' },
          { text: 'int fields have a small, environment-dependent chance of silent corruption unrelated to threading', to: 'q1_wrong_corruption' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct — this is close to a diagnostic fingerprint for an unsynchronized shared-counter race condition: correct on most runs (the unlucky interleaving is a narrow timing window), occasionally wrong on runs where two threads\' read-modify-write steps happen to interleave badly, and more likely to surface under CI\'s different (often busier, differently-scheduled) execution environment than a quiet local machine.', next: 'q2' },
      q1_wrong_clock: { end: true, correct: false, text: 'A wall-clock sync issue is a real category of flakiness (the datetime-io-nio lesson covers it), but it doesn\'t apply here — this scenario is a plain int counter with no timestamps involved at all. An unsynchronized shared-counter increment across two threads is the textbook race condition, independent of any clock.', retry: 'q1' },
      q1_wrong_corruption: { end: true, correct: false, text: 'There is no such thing as environment-dependent "silent int corruption" in Java — int arithmetic itself is completely reliable. The actual defect is the MISSING synchronization around a compound read-modify-write operation shared across two threads, which is a race condition, not a hardware/environment corruption issue.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'You fix the counter by making `increment()` synchronized, but leave the getter `total()` as plain, unsynchronized `return total;`. Is this fully fixed?',
        choices: [
          { text: 'Not necessarily — reading an unsynchronized field provides no visibility guarantee, even if all writes go through a synchronized method; the reader thread might still observe a stale, cached value. total() must also be synchronized', to: 'q2_right' },
          { text: 'Yes — synchronizing the write is sufficient; reads are always safe regardless of synchronization', to: 'q2_wrong_writeonly' },
          { text: 'No fix is needed at all — int reads are always atomic and always see the latest value in Java', to: 'q2_wrong_noneed' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct — the JMM\'s visibility guarantees require BOTH sides of an access to go through synchronization on the same lock (or both be volatile). Synchronizing only the writer doesn\'t establish a happens-before relationship for an unsynchronized reader, which can still observe a stale cached value on some JVM/hardware combinations. Synchronize the getter too.', next: 'q3' },
      q2_wrong_writeonly: { end: true, correct: false, text: 'This is a common and genuinely dangerous misconception — atomicity of the WRITE side alone doesn\'t guarantee the READ side sees the latest value. Visibility is a two-sided contract in the JMM: both the writer and the reader need to participate in synchronization (same lock, or both volatile) for the guarantee to hold.', retry: 'q2' },
      q2_wrong_noneed: { end: true, correct: false, text: 'int reads themselves don\'t tear (you won\'t see a corrupted half-written value), but that\'s a different property from VISIBILITY — without synchronization on the read side, the JMM permits a thread to keep observing a stale, cached value indefinitely, never seeing another thread\'s write at all.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'Two services each need to lock a "sender account" and a "receiver account" during a transfer. Sometimes transfer(A, B) and transfer(B, A) run concurrently on different threads. What\'s the safest locking strategy?',
        choices: [
          { text: 'Order the lock acquisition by a fixed, comparable property of the accounts themselves (e.g., account ID) rather than by sender/receiver role, so any two threads locking the same pair of accounts always agree on which to lock first', to: 'q3_right' },
          { text: 'Always lock the sender first, then the receiver, in every transfer call, regardless of which accounts are involved', to: 'q3_wrong_role' },
          { text: 'Use no locking at all for account balances, since int/long fields are always safe to update concurrently', to: 'q3_wrong_none' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct — "sender first, then receiver" is exactly the trap: transfer(A, B) locks A-then-B while transfer(B, A) locks B-then-A, the classic opposite-order deadlock setup. Ordering by a fixed identity of the accounts themselves (an ID, for instance) means both calls independently derive the SAME lock order regardless of which one is "sender" in that particular call, eliminating the cycle structurally.', next: null },
      q3_wrong_role: { end: true, correct: false, text: 'This is precisely the deadlock-prone pattern: transfer(A, B) locks A-then-B (sender-then-receiver), but transfer(B, A) locks B-then-A (B is now the sender) — opposite orders for the same pair of accounts, exactly the setup that produces a BLOCKED-on-BLOCKED cycle when both run concurrently. The fix must order by something fixed about the accounts, not by their role in a particular call.', retry: 'q3' },
      q3_wrong_none: { end: true, correct: false, text: 'Account balances are exactly the kind of shared mutable state that needs protection — updating a balance is a compound read-modify-write, a textbook race condition without synchronization, entirely independent of the deadlock question. Both problems (races AND deadlock) need addressing: synchronize the updates, AND order the lock acquisition consistently.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Calling thread.run() instead of thread.start() — run() executes synchronously on the current thread with no concurrency at all, a silent bug that produces no error and is easy to miss in review.',
    'Treating a compound operation like count++ (or "check then act," like if (list.isEmpty()) list.add(x)) as safe just because it\'s one line of source code — it is almost always multiple steps at the machine level and needs synchronized (or an atomic class) if shared across threads.',
    'Synchronizing the writer but not the reader of shared state — visibility is a two-sided contract; an unsynchronized read can observe a stale, cached value even if every write goes through a synchronized method. Synchronize (or use volatile for) both sides.',
    'Reaching for volatile to protect a compound update like a counter — volatile fixes visibility, not atomicity; count++ on a volatile field is still a genuine race condition. Use synchronized or an atomic class instead.',
    'Acquiring multiple locks in an order that varies by code path (sender-then-receiver in one method, receiver-then-sender in another) — this is the direct setup for deadlock. Order lock acquisition by a fixed, consistent rule (a stable identity of the locked objects), not by a role that can flip.',
    'Holding a lock for longer than necessary (synchronizing an entire large method when only a few lines touch shared state) — this increases contention needlessly and increases the surface area for deadlock if that lock is ever combined with another. Keep critical sections as small as correctness allows.'
  ],
  interview: [
    {
      q: 'Explain a race condition using a concrete example, and connect it directly to why it produces flaky rather than consistently-failing tests.',
      a: 'A race condition is a defect where a program\'s correctness depends on the unpredictable relative timing of operations across threads sharing mutable state, and the canonical example is a shared counter\'s increment: count++ decomposes at the machine level into three distinct steps — read the current value, compute the incremented value, write it back — with no atomicity between those steps unless explicitly provided. Two threads executing count++ concurrently without synchronization can interleave those steps badly: thread A reads count=5, then before A writes back, thread B ALSO reads count=5 (a stale value, since A hasn\'t written yet), both threads independently compute 6, and both write 6 — two logical increments occurred but the counter only advanced by one, silently losing an update with no exception, no warning, nothing visibly wrong at the point of failure. The reason this manifests specifically as FLAKINESS rather than a reliably-reproducing bug is that the defective code is identically present on every single execution — the missing synchronization never changes between runs — but it only produces an incorrect RESULT on the runs where the scheduler happens to interleave the two threads\' read/compute/write sequences in that specific unlucky window; on most runs, by sheer luck of timing, the operations don\'t collide destructively and the test passes. This is exactly why race-condition-rooted flaky tests are notoriously resistant to reproduction on demand (you can\'t just "run it again slower" and expect to see the bug, and you often can\'t reliably reproduce it faster either), why they tend to surface disproportionately on CI infrastructure with different core counts, load, and scheduling behavior than a developer\'s local machine, and why they\'re genuinely one of the most well-studied, real root causes of flaky test suites in the software engineering literature on the topic — as distinct from other flakiness causes like test-order dependencies, external service calls, or the datetime lesson\'s LocalDateTime/time-zone mistakes, which have entirely different mechanisms and entirely different fixes.'
    },
    {
      q: 'Compare synchronized and volatile in depth: what does each guarantee, what do neither guarantee alone, and how do you choose?',
      a: 'synchronized provides two guarantees bundled together: MUTUAL EXCLUSION (at most one thread executes code synchronized on a given lock at any time, achieved via the object\'s intrinsic monitor — a thread trying to enter while another holds the lock blocks, entering the BLOCKED thread-dump state, until the lock is released) and VISIBILITY (releasing a lock happens-before a subsequent acquisition of that same lock by another thread, per the JMM, so any writes made inside the synchronized block are guaranteed visible to the next thread that acquires the same lock). This combination — atomicity plus visibility — is exactly what\'s needed to safely perform a compound operation like a counter increment shared across threads: the whole read-modify-write becomes indivisible from every other synchronized-on-the-same-lock thread\'s perspective. volatile provides ONLY the visibility half, and only for a single field: a write to a volatile field happens-before any subsequent read of that same field by any thread, guaranteeing immediate visibility and preventing instruction reordering around that access — but it provides NO mutual exclusion and NO atomicity for anything beyond a single, plain read or write. Consequently, volatile int count; count++; remains a genuine race condition, identical in risk to a completely unsynchronized field, because the read-modify-write is still three separate steps with no protection between them; volatile only guarantees each of those three individual memory accesses is visible and ordered correctly, which does nothing to prevent two threads from interleaving the three-step sequence and losing an update. The decision I make in practice: volatile for a field where every access to it is a SINGLE plain assignment or read — a shutdown flag one thread sets and others poll, a reference that\'s swapped wholesale rather than mutated in place — because it\'s cheaper than acquiring a lock and correctly solves the actual problem in that narrow case; synchronized (or, often better for simple counters specifically, an AtomicInteger/AtomicLong from the next lesson, which gives lock-free atomicity) the moment the operation on shared state is a compound read-then-write, a check-then-act, or touches more than one field that must stay consistent together — situations volatile cannot make safe no matter how it\'s applied.'
    },
    {
      q: 'Explain exactly how a deadlock forms between two threads and two locks, and why consistent lock ordering is considered the primary defense rather than a partial mitigation.',
      a: 'Deadlock requires a specific structural condition: at least two threads, each holding at least one lock the other thread needs, forming a CYCLE in the "holds and waits for" relationship, with no thread able to make progress because progress requires releasing a currently-held lock, which only happens when its protected code finishes — code that can\'t finish until the missing lock is acquired. Concretely: thread A runs synchronized (lockX) { synchronized (lockY) { work(); } } while thread B runs synchronized (lockY) { synchronized (lockX) { work(); } }. If timing allows A to acquire lockX and, before A can proceed further, B acquires lockY, the state becomes: A is BLOCKED waiting for lockY (held by B), and B is BLOCKED waiting for lockX (held by A) — this is a permanent standstill; neither thread times out, neither retries, neither yields its held lock, and the JVM provides no automatic detection or recovery at runtime (this is exactly the state jstack surfaces explicitly as "Found one Java-level deadlock," because it can walk the holds-and-waits-for graph across all threads and identify the cycle after the fact, but it cannot prevent or break it while running). The reason consistent lock ordering is the PRIMARY, structural defense rather than a partial mitigation is that it eliminates the necessary PRECONDITION for the cycle to exist at all: a cyclic wait fundamentally requires at least two code paths acquiring the same set of locks in different orders relative to each other. If every code path across the entire codebase that ever needs both lockX and lockY acquires them in the SAME fixed order — say, always lockX before lockY, with zero exceptions — then it becomes mathematically impossible for any interleaving of any number of threads, under any timing or scheduling conditions, to produce a cyclic wait involving those two locks, because no thread\'s acquisition path ever goes lockY-then-lockX to begin with. This is stronger than probabilistic mitigation (like "acquire locks quickly to reduce the contention window," which merely narrows the unlucky timing window without eliminating it) — it removes the hazardous condition\'s possibility entirely, by construction. When a natural fixed order between two arbitrary objects of the same type isn\'t obvious (locking two accounts chosen dynamically at runtime, for instance), the standard technique orders by some inherent, stable, comparable property of the objects themselves (an account ID, or as a last resort System.identityHashCode()) so any two threads locking the same pair independently and deterministically agree on the order — preserving the "no exceptions, ever" property the whole guarantee depends on.'
    },
    {
      q: 'A colleague says "I made the counter field volatile, so it\'s thread-safe now." Walk through why this claim is wrong for a counter specifically, and what the correct fix is.',
      a: 'This is one of the most common and genuinely dangerous misconceptions in concurrent Java code, because it\'s partially right in a way that makes the mistake easy to miss: volatile DOES fix a real problem — without it, a reader thread might never observe another thread\'s write to that field at all, due to the JMM\'s permitted caching and reordering — so the field genuinely becomes "more correct" in one specific dimension. But for a counter specifically, the operation being performed — count++ — is a compound read-modify-write, not a single plain read or write, and volatile\'s guarantee only covers individual accesses: it guarantees that WHEN a thread reads the field, it sees the latest written value, and that WHEN a thread writes the field, that write becomes immediately visible — but it provides absolutely no protection against two threads independently performing the full read-then-compute-then-write sequence and interleaving those steps badly. Concretely: thread A reads count=5 (this read correctly sees the latest value, thanks to volatile); before A writes back 6, thread B ALSO reads count=5 (also correctly seeing the latest value at THAT moment — volatile is doing its job on both individual reads); both threads independently compute 6 and write it; the counter has now been incremented twice but only advanced by one — the exact same lost-update race condition as with a completely non-volatile field, because volatile never made the three-step sequence indivisible, it only made each of the three steps individually visible. The correct fix is either declaring increment() (and the getter) synchronized, so the entire read-modify-write happens as one indivisible unit that a concurrently-executing thread cannot interleave with, or, often the better choice specifically for a simple counter, using java.util.concurrent.atomic.AtomicInteger and its incrementAndGet() method, which provides lock-free atomicity for exactly this compound-update case via hardware compare-and-swap instructions — both genuinely fix the race, while volatile alone, despite feeling like it should, does not.'
    }
  ]
};
