window.LESSONS = window.LESSONS || {};
window.LESSONS['executors-futures'] = {
  id: 'executors-futures',
  title: 'Executors & CompletableFuture: Thread Pools & Async Pipelines',
  category: 'Part 5 — Concurrency',
  timeMin: 50,
  summary: 'The threads-basics lesson started raw Thread objects one at a time — fine for two threads in a teaching demo, but a thread costs real memory and OS scheduling overhead, and code that creates one per task doesn\'t scale. This lesson introduces ExecutorService and the Executors factory (a fixed, reusable crew of worker threads instead of hire-one-fire-one), Future and the checked-exception-wrapping trap of a Future nobody ever calls get() on, the shutdown() vs shutdownNow() discipline that prevents a leaked pool from keeping your JVM alive forever, and CompletableFuture — the tool for chaining async steps (supplyAsync, thenApply, thenCompose, thenCombine) and handling failure (exceptionally, handle) without ever blocking mid-pipeline.',
  goals: [
    'Explain why a bounded thread pool (ExecutorService) beats creating a raw Thread per task, and choose the right Executors factory method for a given workload',
    'Use submit() and Future correctly: retrieve a result with get(), understand ExecutionException wrapping, and avoid the silently-swallowed-exception trap of an unchecked Future',
    'Shut down an ExecutorService correctly with shutdown()/shutdownNow()/awaitTermination, and explain why a forgotten shutdown leaks non-daemon threads and keeps a program from exiting',
    'Build a non-blocking async pipeline with CompletableFuture using supplyAsync, thenApply, thenCompose, and thenCombine',
    'Handle failure in an async pipeline with exceptionally/handle, and wait for several independent futures together with CompletableFuture.allOf'
  ],
  concept: [
    {
      h: 'Why a thread pool: the real cost of raw threads, and the ExecutorService abstraction',
      p: [
        'Every OS-level thread costs real, non-trivial resources — a dedicated stack (often 512KB–1MB by default) and OS scheduler bookkeeping — and the threads-basics lesson\'s pattern of <code>new Thread(...).start()</code> for each task is fine for a teaching demo with two threads, but creating and destroying a fresh <code>Thread</code> for every unit of work in a real program (thousands of requests, thousands of file imports) will exhaust memory or OS thread limits, and the constant create/destroy churn burns CPU on thread-lifecycle bookkeeping instead of your actual work. <code>ExecutorService</code> fixes this by decoupling WHAT runs (a <code>Runnable</code> or <code>Callable</code>, per the lambdas lesson\'s programming-to-an-interface discipline) from HOW MANY workers run it and WHEN — a bounded, reusable pool of worker threads that get handed task after task, rather than being created once and discarded.',
        'The <code>Executors</code> factory class provides the common pool shapes: <code>Executors.newFixedThreadPool(n)</code> creates exactly <code>n</code> reusable worker threads — tasks beyond that queue up until a worker frees up, the shape you want whenever you know your concurrency ceiling (CPU-bound work, or work that hits a resource with a known capacity, like a connection pool); <code>Executors.newCachedThreadPool()</code> creates threads on demand and reuses idle ones, with no upper bound and an idle-timeout shrink — convenient, but genuinely dangerous under sustained high load since nothing caps how many threads it will spin up; <code>Executors.newSingleThreadExecutor()</code> gives exactly one worker, so tasks execute strictly in submission order — a way to get serialized execution without hand-writing your own <code>synchronized</code> discipline. This connects directly back to the jvm-tools-reflection lesson\'s thread-dump reading: "a thread pool exhausted with every thread BLOCKED on a downstream call" is exactly a fixed pool whose <code>n</code> workers are all stuck waiting on a slow dependency, its task queue backing up behind them — a real, diagnosable back-pressure signal, not a mystery.'
      ]
    },
    {
      h: 'submit() and Future: getting a result back, and the exception nobody ever sees',
      p: [
        '<code>Runnable.run()</code> returns <code>void</code> and can\'t throw a checked exception; <code>Callable&lt;V&gt;.call()</code> returns a value of type <code>V</code> and CAN throw checked exceptions, which is why <code>pool.submit(Callable&lt;V&gt;)</code> — unlike <code>submit(Runnable)</code> — returns a <code>Future&lt;V&gt;</code>, a handle to a result that may not exist yet. Calling <code>future.get()</code> BLOCKS the calling thread until the task finishes and then returns its result, but any exception the task threw does not propagate directly — it\'s wrapped in a checked <code>ExecutionException</code>, whose <code>getCause()</code> holds the original; <code>get()</code> itself also declares <code>InterruptedException</code>. The overload <code>get(long timeout, TimeUnit unit)</code> throws <code>TimeoutException</code> if the task isn\'t done in time — essential for not blocking forever on a hung task — and <code>isDone()</code>/<code>cancel(boolean mayInterruptIfRunning)</code> let you poll or abort without blocking at all.',
        'The trap worth internalizing: if you <code>submit()</code> a task and NEVER call <code>get()</code> (or otherwise inspect) its <code>Future</code>, and the task throws inside <code>call()</code>, that exception is silently swallowed — never printed, never logged, the task simply stops having done nothing or half of something, with zero trace anywhere. This is a genuinely common way async code hides real bugs: a background task\'s failed assertion or broken side effect vanishes because nothing ever inspected the <code>Future</code> it returned. The discipline: either call <code>get()</code> and handle/propagate whatever it throws, or — this lesson\'s <code>CompletableFuture</code> section — attach an explicit failure handler, rather than fire-and-forget submitting tasks whose outcome nobody ever checks.'
      ]
    },
    {
      h: 'Shutdown discipline: shutdown() vs shutdownNow() vs awaitTermination — and the leaked pool',
      p: [
        'An <code>ExecutorService</code>\'s worker threads are NOT daemon threads by default — they keep running, and keep the JVM alive, until explicitly told to stop. A program that creates a pool and never shuts it down will hang forever after <code>main()</code> returns, never actually exiting — the exact "why won\'t my program quit" mystery, traced back to a live, idle, non-daemon thread pool nobody closed. <code>shutdown()</code> is the graceful path: stop accepting NEW tasks, but let everything already submitted or queued finish normally. <code>shutdownNow()</code> is the aggressive path: attempt to stop everything immediately, interrupting running tasks, and return the list of tasks that were queued but never started — appropriate when you genuinely need to abort, not merely wind down. <code>awaitTermination(timeout, unit)</code> blocks the CALLING thread until either every task has finished or the timeout elapses, letting you confirm a graceful shutdown actually completed rather than firing the request and hoping.',
        'Correct discipline mirrors the exceptions lesson\'s try-with-resources/finally pattern (the <code>LogImporter</code> that closed its resource even when an exception was thrown mid-read): call <code>shutdown()</code> in a <code>finally</code> block so the pool is released even if a task submission throws partway through, or — Java 19+ — let <code>ExecutorService</code>\'s <code>AutoCloseable</code> support close it automatically via try-with-resources directly. This is not a purely theoretical concern: a test suite where individual tests each create their own executor and forget to shut it down is a real, cumulative source of test-suite slowdown and flakiness — leaked pools across hundreds of tests can exhaust OS thread limits or degrade the whole suite\'s timing as idle worker threads silently accumulate.'
      ]
    },
    {
      h: 'CompletableFuture: chaining async work without ever blocking mid-pipeline',
      p: [
        '<code>CompletableFuture&lt;T&gt;</code> is a richer <code>Future</code> that lets you describe a PIPELINE of async steps without calling the blocking <code>get()</code> anywhere in the middle. <code>CompletableFuture.supplyAsync(Supplier&lt;T&gt;, executor)</code> starts work asynchronously on the given pool (name the executor explicitly — omitting it silently falls back to the shared <code>ForkJoinPool.commonPool()</code>, which is easy to forget and can surprise you under load) and returns a <code>CompletableFuture&lt;T&gt;</code> immediately. <code>.thenApply(Function&lt;T,R&gt;)</code> transforms the result once it\'s ready, WITHOUT blocking — it registers a callback that runs when the upstream stage completes, returning a new <code>CompletableFuture&lt;R&gt;</code> you keep chaining onto. <code>.thenCompose(Function&lt;T, CompletableFuture&lt;R&gt;&gt;)</code> is for when the NEXT step itself returns a <code>CompletableFuture</code> — it flattens the result instead of leaving you with a <code>CompletableFuture&lt;CompletableFuture&lt;R&gt;&gt;</code>, exactly the same map-vs-flatMap shape of problem the streams lesson\'s <code>Optional.flatMap</code> solved. <code>.thenCombine(otherFuture, BiFunction)</code> merges two INDEPENDENT pipelines that ran concurrently into one result, once both are done.',
        'Only at the very END of a pipeline do you call <code>.join()</code> (behaves like <code>get()</code> but throws an UNCHECKED <code>CompletionException</code> instead of a checked <code>ExecutionException</code> — convenient inside lambda bodies, where checked exceptions are awkward to declare) or <code>.get()</code> to actually block and retrieve the final value; everything upstream of that call runs asynchronously, chained purely by callbacks. This is the concrete advantage over a plain <code>Future</code>: a plain <code>Future</code> gives you no way to say "when this finishes, automatically run the next step" — you\'re stuck calling the blocking <code>get()</code> and then manually kicking off whatever comes next yourself, which either ties up a thread waiting or forces you to hand-roll your own callback machinery from scratch.'
      ]
    },
    {
      h: 'Handling failure in a pipeline, and waiting on several futures together with allOf',
      p: [
        'A <code>CompletableFuture</code> pipeline needs its own way to react to a failure partway through, since there\'s no surrounding <code>try/catch</code> executing on whatever thread the async stage eventually runs on. <code>.exceptionally(Function&lt;Throwable,T&gt;)</code> supplies a fallback value if any UPSTREAM stage threw, and is skipped entirely if everything succeeded — the async equivalent of a catch block that only fires on failure. <code>.handle(BiFunction&lt;T,Throwable,R&gt;)</code> runs UNCONDITIONALLY, receiving either the successful result or the exception (exactly one of the two is always <code>null</code>), which is useful for logging an outcome regardless of success/failure, or for converting either path into one uniform result type. <code>.whenComplete((result, ex) -> ...)</code> is similar to <code>handle</code> but is a pure side-effecting peek — it observes without transforming, and passes the original outcome straight through, which is the right tool for logging without altering the pipeline\'s value.',
        '<code>CompletableFuture.allOf(cf1, cf2, cf3)</code> waits for ALL of several independent futures to finish, but — a genuine gotcha — it returns <code>CompletableFuture&lt;Void&gt;</code>, not the combined results; you retrieve each individual value by calling <code>.join()</code> on each ORIGINAL future afterward (each such <code>join()</code> then returns instantly, since <code>allOf</code> already confirmed every one is done). This is exactly the tool for "kick off N independent async operations concurrently, then proceed only once every single one has finished" — reviewing three papers at once and only printing a summary once all three reviews are in, which is precisely this lesson\'s lab.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Baratie\'s fixed kitchen crew, the order ticket nobody collects, closing time, and the tray that waits for every course',
      text: 'Sanji doesn\'t hire a brand-new cook off the dock for every single order and fire them the moment the plate goes out — the Baratie runs on a FIXED crew of sous-chefs who each take order tickets off the same queue, station after station, night after night (a fixed thread pool: reusable workers, not a new Thread per task, because standing up and tearing down a cook for every dish would sink the restaurant\'s pace entirely). The moment an order is placed, the customer is handed a ticket and free to go sit down and talk with the crew (a Future — the ticket represents work that may not be finished yet); they can come back and redeem it for the finished dish whenever they choose (future.get()) — but if a cook botches an order and the ticket-holder never comes back to collect it, the ruined plate just gets quietly scraped into the bin, and NOBODY on the crew, not even Sanji, ever finds out it happened (a task\'s exception, thrown inside a Future nobody ever calls get() on, vanishes with zero trace). At closing time, Sanji doesn\'t throw customers out mid-bite — he stops taking NEW orders but lets every pan already on the stove finish cooking (shutdown(): graceful, finish what\'s in flight, accept nothing new) — a world apart from a kitchen-fire evacuation where every pan gets yanked off the heat mid-sear, half-cooked, because there\'s no time to finish (shutdownNow(): stop everything now, return what never got started). And if Sanji ever simply forgot to lock up at all, the cooks would just keep standing at their stations forever, the Baratie\'s lights never going dark, the whole crew unable to ever set sail again (a forgotten shutdown() leaks a live, non-daemon thread pool that keeps the program running forever). For a table ordering three courses at once, Sanji fires all three orders to three different stations concurrently and only sends the tray out once EVERY course is ready (CompletableFuture.allOf) — and if the seared course threatens to arrive burnt, a fallback dish is already lined up to go out instead of a ruined plate (exceptionally).',
    },
    sitcom: {
      show: 'Friends',
      title: 'Central Perk\'s fixed baristas, the buzzer nobody redeems, closing the counter, and Monica\'s three-course tray',
      text: 'Gunther keeps a FIXED handful of baristas working the Central Perk counter — he does not hire a brand-new barista off the street for every single customer\'s order and let them go the second the cup is poured (a fixed thread pool: the same crew, reused order after order, because hiring and firing per-drink would be absurd and slow). The moment someone orders, Gunther hands them a buzzer and they go sit on the orange couch with Ross and Rachel — they can come back to the counter and redeem it for their drink whenever they like (a Future, redeemed via get()) — but if a drink gets messed up and the customer never comes back to check on it, the ruined cup just gets quietly dumped, and nobody — not even Gunther — ever notices it happened (a swallowed exception in an unchecked Future). At closing time, Gunther doesn\'t kick everyone out mid-sip — he stops taking NEW orders but lets the espresso machine finish every drink already being pulled (shutdown(): graceful wind-down) — very different from Chandler yelling "everybody out, NOW" and yanking cups mid-pour because there\'s a genuine emergency (shutdownNow(): stop immediately, abandon what never started). And if Gunther simply forgot to ever lock the doors, the baristas would just keep standing behind the counter forever, Central Perk\'s lights never going dark (a forgotten shutdown() leaks a live pool that keeps everything running indefinitely). For Monica\'s catering order, she has the espresso steamed on one station and a pastry warmed on a totally separate one, concurrently, and only plates them together once BOTH are ready (thenCombine) — and if the espresso machine jams mid-order, a fallback drip coffee is already the backup plan instead of serving nothing at all (exceptionally). For a full dinner-party order, Monica fires all three courses out to the kitchen at once and the tray doesn\'t leave until every single course reports back done (CompletableFuture.allOf).',
    },
    why: 'The fixed kitchen/counter crew is a fixed thread pool: a bounded, REUSED set of workers, not a fresh Thread hired and fired per task. The order ticket / buzzer is a Future — handed back immediately, redeemed later via get() — and a ticket nobody ever redeems is exactly a Future nobody ever calls get() on: any failure inside it vanishes completely, with no trace, which is the single most dangerous silent-failure trap in this lesson. Closing time versus a fire evacuation is shutdown() (graceful: finish what\'s queued, accept nothing new) versus shutdownNow() (abort immediately) — and forgetting to ever close up is a leaked non-daemon pool that keeps the whole program alive forever, unable to exit, exactly like a kitchen that never goes dark. The three-course tray that only leaves once every course reports ready is CompletableFuture.allOf, and the fallback dish lined up in case a course burns is exceptionally — the async pipeline\'s way of handling a mid-stream failure without a surrounding try/catch to catch it.'
  },
  storyAnim: {
    title: 'Fixed crew, the ticket, closing time, and the tray that waits for everyone',
    h: 320,
    props: [
      { id: 'pool', emoji: '👨‍🍳', label: 'a FIXED crew of cooks reused order after order (fixed thread pool)', x: 8, y: 10 },
      { id: 'ticket', emoji: '🎫', label: 'order ticket handed back immediately (Future)', x: 34, y: 10 },
      { id: 'lost', emoji: '🗑️', label: 'never collected → the failure vanishes, unseen (unchecked Future)', x: 34, y: 46 },
      { id: 'close', emoji: '🔒', label: 'closing time: finish what\'s cooking, take nothing new (shutdown)', x: 62, y: 10 },
      { id: 'evac', emoji: '🔥', label: 'kitchen fire: stop everything now, mid-pan (shutdownNow)', x: 62, y: 46 },
      { id: 'leak', emoji: '💡', label: 'forgot to lock up: lights never go dark, crew never leaves (leaked pool)', x: 88, y: 10 },
      { id: 'tray', emoji: '🍽️', label: 'tray waits for EVERY course before it leaves the kitchen (allOf)', x: 88, y: 46 }
    ],
    actors: [
      { id: 'sanji', emoji: '🚬', label: 'Sanji', x: 20, y: 66 },
      { id: 'customer', emoji: '🙂', label: 'customer', x: 45, y: 66 },
      { id: 'gunther', emoji: '☕', label: 'Gunther', x: 75, y: 66 }
    ],
    steps: [
      { c: 'A fixed crew of cooks works every order, night after night — nobody\'s hired fresh and fired per dish. That\'s a fixed thread pool: reusable workers, not a new Thread per task.', p: { pool: 'good' }, a: { sanji: [20, 66] } },
      { c: 'The moment an order goes in, the customer gets a ticket and walks off — they can redeem it for the finished dish whenever they come back. That\'s a Future, redeemed via get().', p: { ticket: 'lit' }, a: { customer: [34, 66] } },
      { c: 'But if a dish is ruined and the ticket is never redeemed, the plate just gets scraped into the bin — nobody ever finds out. An exception inside a Future nobody calls get() on vanishes with zero trace.', p: { lost: 'bad' } },
      { c: 'Closing time: stop taking new orders, but let every pan already on the stove finish. That\'s shutdown() — graceful, finishes what\'s queued.', p: { close: 'good' } },
      { c: 'A kitchen fire is different: every pan comes off the heat immediately, half-cooked, no time to finish. That\'s shutdownNow() — stop everything now.', p: { evac: 'bad' } },
      { c: 'If Sanji simply forgot to ever lock up, the crew would stand at their stations forever and the lights would never go dark. A forgotten shutdown() leaks a live pool that keeps the whole program running.', p: { leak: 'bad' } },
      { c: 'For a three-course order, every course fires at once — but the tray doesn\'t leave the kitchen until ALL three report back ready. That\'s CompletableFuture.allOf.', p: { tray: 'good' }, a: { sanji: [88, 46], customer: [88, 66] } }
    ]
  },
  conceptFlow: {
    title: 'From raw threads to a pooled, non-blocking async pipeline',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Why a pool',
        nodes: [
          { id: 'threadcost', text: 'a raw Thread costs a stack +\nOS scheduling — doesn\'t scale' },
          { id: 'factories', text: 'Executors: fixed / cached /\nsingle-thread pools' }
        ]
      },
      {
        label: 'submit() and Future',
        nodes: [
          { id: 'futureget', text: 'future.get() blocks;\nexceptions wrap in ExecutionException' },
          { id: 'swallowed', text: 'Future never get()\'d →\nexception silently vanishes' }
        ]
      },
      {
        label: 'Shutdown discipline',
        nodes: [
          { id: 'shutdowngraceful', text: 'shutdown(): finish queued work,\naccept nothing new' },
          { id: 'shutdownnow', text: 'shutdownNow(): stop everything,\ninterrupt running tasks' },
          { id: 'leakedpool', text: 'never shut down →\nnon-daemon threads block JVM exit' }
        ]
      },
      {
        label: 'CompletableFuture pipeline',
        nodes: [
          { id: 'supplyasync', text: 'supplyAsync(supplier, executor)\nstarts work, returns immediately' },
          { id: 'thenapplycompose', text: 'thenApply transforms;\nthenCompose flattens a nested future' },
          { id: 'thencombine', text: 'thenCombine merges TWO\nindependent pipelines' }
        ]
      },
      {
        label: 'Failure + waiting on many',
        nodes: [
          { id: 'exceptionally', text: 'exceptionally: fallback\nONLY on upstream failure' },
          { id: 'allof', text: 'allOf(cf1,cf2,cf3): wait for all,\nthen join() each for its value' }
        ]
      }
    ],
    steps: [
      { active: ['threadcost'], note: 'A raw Thread carries a real stack and OS scheduling cost — fine for two threads in a demo, not for a task-per-request workload.' },
      { active: ['factories'], note: 'Executors.newFixedThreadPool(n) bounds concurrency to n reusable workers; newCachedThreadPool grows unbounded (dangerous under load); newSingleThreadExecutor serializes tasks with no manual synchronized needed.' },
      { active: ['futureget'], note: 'submit(Callable<V>) returns a Future<V>; get() blocks until done, and any thrown exception arrives wrapped in a checked ExecutionException whose getCause() holds the original.' },
      { active: ['swallowed'], note: 'If nobody ever calls get() on a submitted task\'s Future, an exception thrown inside it is silently lost — no log, no trace, the task just quietly fails.' },
      { active: ['shutdowngraceful'], note: 'shutdown() stops accepting new tasks but lets everything already queued or running finish normally — the graceful path, call it in a finally block.' },
      { active: ['shutdownnow'], note: 'shutdownNow() interrupts running tasks immediately and returns the tasks that never started — the aggressive, abort-now path.' },
      { active: ['leakedpool'], note: 'Pool threads are non-daemon by default; forgetting to shut a pool down leaves it running forever, keeping the whole JVM alive and the program unable to exit.' },
      { active: ['supplyasync'], note: 'CompletableFuture.supplyAsync(supplier, executor) kicks off async work immediately and returns a handle you can keep chaining onto without blocking.' },
      { active: ['thenapplycompose'], note: 'thenApply transforms a ready result; thenCompose is for when the next step itself returns a CompletableFuture, flattening it instead of nesting — the same shape as Optional.flatMap.' },
      { active: ['thencombine'], note: 'thenCombine merges the results of two independently-running pipelines into one, once both are done.' },
      { active: ['exceptionally'], note: 'exceptionally supplies a fallback value only if an upstream stage threw, and is skipped entirely on the success path.' },
      { active: ['allof'], note: 'allOf(cf1, cf2, cf3) returns CompletableFuture<Void> that completes once all three are done — retrieve each individual result afterward with a join() on the original future, which returns instantly at that point.' }
    ]
  },
  tech: [
    {
      q: 'Why does creating a raw Thread per task not scale, and how do the different Executors factory methods address that?',
      a: 'Every OS-level thread carries real, non-trivial cost: a dedicated stack (commonly 512KB-1MB by default) that consumes memory whether or not the thread is doing meaningful work, plus ongoing OS scheduler bookkeeping to context-switch between it and every other runnable thread on the system. Creating a fresh Thread object, starting it, and letting it terminate for every single unit of work — fine for a handful of threads in a teaching example — becomes a genuine scalability problem the moment task volume grows into the thousands: you risk exhausting available memory or hitting OS-level thread-count limits, and even short of that hard limit, the constant overhead of spinning up and tearing down threads wastes CPU cycles on lifecycle bookkeeping rather than actual application work. ExecutorService solves this by introducing a bounded, REUSABLE pool of worker threads that persist across many tasks, decoupling what runs (a Runnable or Callable, following the same program-to-an-interface discipline the lambdas lesson establishes) from how many concurrent workers execute it. The Executors factory then offers the common shapes for that pool: newFixedThreadPool(n) caps concurrency at exactly n reusable workers, with excess tasks queuing until a worker frees up — the right choice whenever you know your concurrency ceiling, such as work bound by a fixed-size downstream resource like a database connection pool; newCachedThreadPool() creates threads on demand and reuses idle ones with no upper bound, convenient for short-lived bursty work but genuinely risky under sustained heavy load since nothing caps how many threads it will ultimately create; newSingleThreadExecutor() provides exactly one worker so submitted tasks execute strictly in submission order, giving you serialized execution without writing your own synchronized logic. This directly explains the jvm-tools-reflection lesson\'s thread-dump observation that "a thread pool exhausted with every thread BLOCKED on a downstream call" signals back-pressure from a slow dependency: it\'s a fixed pool whose n workers are all simultaneously stuck waiting on that dependency, with the task queue backing up behind them.'
    },
    {
      q: 'Walk through exactly what happens when you submit(Callable<V>), and explain the trap of a Future nobody ever calls get() on.',
      a: 'pool.submit(Callable<V> task) hands the task to the pool and returns immediately with a Future<V> — a handle representing a result that may not exist yet, since the task might still be queued or actively running on a worker thread. Calling future.get() BLOCKS the calling thread until that task finishes, then returns its value; critically, if the task\'s call() method threw ANY exception (checked or unchecked), that exception does not propagate to the caller of get() directly — it is wrapped inside a checked ExecutionException, and the original exception is retrievable via getCause(), which means code calling get() must handle or declare ExecutionException specifically, distinct from whatever the task itself actually threw; get() also declares InterruptedException, since the blocked calling thread can itself be interrupted while waiting. The trap, and the reason this matters far beyond a minor API quirk: if a task is submitted and its Future is simply discarded — never assigned to a variable that\'s later inspected, or assigned but get() is never called on it — and that task throws an exception internally, that exception is silently swallowed. Nothing is printed, nothing is logged, no thread crashes visibly; the task simply fails to complete its work and the failure leaves no trace anywhere in the running program\'s output. This is a real and common source of quietly broken async code: a background task performing a side effect (writing a file, updating a cache, sending a notification) that throws partway through will just silently not finish, and unless someone specifically checks its Future\'s outcome, the bug is invisible. The fix is a discipline, not a language feature: always either call get() on a submitted task\'s Future (propagating or explicitly handling whatever it throws) or, in a CompletableFuture pipeline, attach an explicit .exceptionally() or .handle() callback — never submit a task whose Future nobody is ever going to inspect.'
    },
    {
      q: 'Explain the difference between shutdown() and shutdownNow(), and why forgetting to call either one is a genuine resource leak.',
      a: 'An ExecutorService\'s worker threads are ordinary, non-daemon threads by default, which means the JVM will not exit while any of them are still alive — they are treated exactly like any other thread the program explicitly created and never explicitly stopped. shutdown() initiates a GRACEFUL wind-down: the pool immediately stops accepting any newly submitted tasks (further submit() calls throw RejectedExecutionException), but every task already queued or actively running is allowed to run to completion, after which the pool\'s worker threads terminate on their own. shutdownNow() is the aggressive alternative: it attempts to stop everything immediately, calling Thread.interrupt() on every actively running task\'s thread (which only has an effect if that task\'s code actually checks for interruption or performs an interruptible blocking operation), and returns a List<Runnable> of the tasks that were still queued and never even started, letting the caller decide what to do with the abandoned work. awaitTermination(long timeout, TimeUnit unit), typically called right after shutdown(), blocks the CALLING thread until either every task has actually finished or the timeout elapses, returning a boolean indicating which happened — this is what lets you confirm a graceful shutdown genuinely completed within an acceptable time budget rather than merely having been requested. The resource-leak concern is concrete and not hypothetical: a program (or, just as commonly, an individual unit test) that creates an ExecutorService and never calls shutdown() or shutdownNow() on it at all leaves that pool\'s worker threads alive indefinitely — for a whole standalone program, this means the JVM process never exits even after main() returns and every other thread has finished, since those non-daemon pool threads are still technically runnable; for a test suite where many individual tests each create their own executor and forget to close it, the leaked pools accumulate across the run, consuming OS thread-table entries and slowing or destabilizing later tests — exactly the kind of resource-leak-driven flakiness that compounds silently until the suite hits an OS-level thread limit.'
    },
    {
      q: 'Explain how a CompletableFuture pipeline built from supplyAsync, thenApply, thenCompose, and thenCombine avoids ever blocking mid-pipeline, and how failures are handled.',
      a: 'CompletableFuture.supplyAsync(Supplier<T> supplier, Executor executor) starts the supplier running asynchronously on the given executor and returns a CompletableFuture<T> immediately, without blocking the calling thread at all — naming the executor explicitly matters, since omitting it silently defaults to the shared ForkJoinPool.commonPool(), a detail that\'s easy to overlook and can cause surprising contention if that shared pool is also used elsewhere. From there, .thenApply(Function<T,R>) registers a transformation that the runtime automatically invokes once the upstream stage\'s result becomes available, itself returning a new CompletableFuture<R> immediately, without blocking — chaining .thenApply calls builds a pipeline of callbacks rather than a sequence of blocking get() calls. .thenCompose(Function<T, CompletableFuture<R>>) exists specifically for the case where the NEXT step is itself an asynchronous operation returning its own CompletableFuture: using thenApply there would produce an awkward, doubly-wrapped CompletableFuture<CompletableFuture<R>>, whereas thenCompose flattens the nesting automatically — precisely the same map-versus-flatMap distinction the streams lesson establishes for Optional and Stream. .thenCombine(CompletableFuture<U> other, BiFunction<T,U,R>) is for merging two pipelines that are running CONCURRENTLY and INDEPENDENTLY of each other (neither depends on the other\'s result) into a single combined result once both have completed. Only at the very end of the whole chain does calling .join() (an unchecked-exception variant of get(), convenient inside lambdas where declaring checked exceptions is awkward) or .get() actually block to retrieve the final value — every stage before that runs purely via callback, with no thread ever sitting idle waiting on an intermediate step. Failure handling is built into the same chain rather than requiring a surrounding try/catch: .exceptionally(Function<Throwable,T>) supplies a fallback value only if some upstream stage threw, and is skipped entirely on the success path; .handle(BiFunction<T,Throwable,R>) runs unconditionally on every outcome, receiving whichever of the result or the exception actually occurred (the other argument is null), useful for uniformly logging or converting both the success and failure paths; and CompletableFuture.allOf(cf1, cf2, ...) lets you wait for several independently-running pipelines to ALL finish before proceeding, though it returns CompletableFuture<Void> rather than the combined results, so each individual value still has to be retrieved with a join() on its own original future afterward.'
    }
  ],
  code: {
    title: 'A fixed pool, a swallowed exception, and a CompletableFuture pipeline',
    intro: 'A ReviewJob submitted to a fixed pool demonstrates ExecutionException wrapping, then a CompletableFuture pipeline shows supplyAsync, thenApply, thenCombine, exceptionally, and allOf — all shut down cleanly in a finally block.',
    code: `import java.util.List;
import java.util.concurrent.*;

class ReviewJob implements Callable<String> {
    private final String title;
    ReviewJob(String title) { this.title = title; }
    public String call() {
        if (title.isBlank()) throw new IllegalArgumentException("blank title, cannot review");
        return "score=8/10 for \\"" + title + "\\"";
    }
}

public class ExecutorsDemo {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(3);
        try {
            // submit + Future: a checked exception surfaces wrapped in ExecutionException
            Future<String> broken = pool.submit(new ReviewJob(""));
            try {
                broken.get();
            } catch (ExecutionException e) {
                System.out.println("caught wrapped cause: " + e.getCause());
            }
            // if broken.get() were never called at all, that IllegalArgumentException
            // would simply vanish -- no log, no trace, nobody the wiser.

            Future<String> ok = pool.submit(new ReviewJob("Flaky Test Root Causes"));
            System.out.println(ok.get(2, TimeUnit.SECONDS));

            // CompletableFuture pipeline: async -> transform -> combine -> handle failure
            CompletableFuture<String> sear = CompletableFuture.supplyAsync(() -> "seared: Paper A", pool);
            CompletableFuture<String> plated = sear.thenApply(s -> "plated(" + s + ")");

            CompletableFuture<String> side = CompletableFuture.supplyAsync(() -> "side notes: Paper B", pool);
            CompletableFuture<String> tray = plated.thenCombine(side, (main, sideDish) -> main + " + " + sideDish);
            System.out.println(tray.join());

            CompletableFuture<String> safe = CompletableFuture
                .supplyAsync(() -> { throw new RuntimeException("burned"); }, pool)
                .exceptionally(ex -> "fallback dish (was: " + ex.getMessage() + ")");
            System.out.println(safe.join());

            // allOf: fire three reviews concurrently, proceed only once ALL are done
            CompletableFuture<String> r1 = CompletableFuture.supplyAsync(() -> new ReviewJob("Paper A").call(), pool);
            CompletableFuture<String> r2 = CompletableFuture.supplyAsync(() -> new ReviewJob("Paper B").call(), pool);
            CompletableFuture<String> r3 = CompletableFuture.supplyAsync(() -> new ReviewJob("Paper C").call(), pool);
            CompletableFuture.allOf(r1, r2, r3).join();
            System.out.println(List.of(r1.join(), r2.join(), r3.join()));
        } finally {
            pool.shutdown();                          // graceful: finish queued work, accept nothing new
            pool.awaitTermination(5, TimeUnit.SECONDS);
        }
    }
}`,
    notes: [
      'broken.get() is what SURFACES the wrapped IllegalArgumentException as ExecutionException — comment out that call entirely and the exception disappears with zero output, demonstrating the swallowed-exception trap directly.',
      'sear and side run on the SAME fixed pool concurrently (up to 3 workers) — thenCombine only proceeds once both individually finish, regardless of which happens to finish first.',
      'pool.shutdown() is in the finally block specifically so the pool is released even if an earlier get() or join() threw — an ExecutorService left open (via a raw Executors.newFixedThreadPool call with no matching shutdown) is a leaked, non-daemon resource that keeps the JVM alive. Run: javac ExecutorsDemo.java ReviewJob.java && java ExecutorsDemo.'
    ]
  },
  lab: {
    title: 'Build a two-stage async review pipeline with a fixed pool',
    prompt: 'Write a class <code>ReviewPipeline</code> with a static method <code>CompletableFuture&lt;String&gt; reviewAsync(ExecutorService pool, String title)</code> that uses <code>CompletableFuture.supplyAsync(...)</code> (passing <code>pool</code> as the executor) to compute <code>"reviewed: " + title</code>, then chains <code>.thenApply(...)</code> to wrap that result as <code>"DONE: " + result</code>. Write a <code>main</code> method that creates a fixed thread pool of size 2 via <code>Executors.newFixedThreadPool(2)</code>, calls <code>reviewAsync</code> for two different titles, waits for BOTH using <code>CompletableFuture.allOf(...)</code> followed by <code>.join()</code>, prints each individual result (retrieved with <code>.join()</code> on each original future), and shuts the pool down in a <code>finally</code> block with <code>pool.shutdown()</code>.',
    starter: `import java.util.concurrent.*;

class ReviewPipeline {
    static CompletableFuture<String> reviewAsync(ExecutorService pool, String title) {
        // supplyAsync(..., pool) to compute "reviewed: " + title,
        // then thenApply to wrap it as "DONE: " + result
        return null; // replace
    }

    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            CompletableFuture<String> f1 = reviewAsync(pool, "Paper A");
            CompletableFuture<String> f2 = reviewAsync(pool, "Paper B");
            // wait for both with CompletableFuture.allOf(...).join(), then print each result
        } finally {
            // shut the pool down
        }
    }
}`,
    checks: [
      { re: 'Executors\\.newFixedThreadPool\\(\\s*2\\s*\\)', must: true, hint: 'main must create a fixed pool of size 2: Executors.newFixedThreadPool(2).', pass: 'fixed pool of size 2 ✓' },
      { re: 'CompletableFuture[\\s\\S]*?\\.supplyAsync\\([\\s\\S]*?,\\s*pool\\s*\\)', must: true, hint: 'reviewAsync must call CompletableFuture.supplyAsync(..., pool), passing pool as the executor.', pass: 'supplyAsync uses the given pool ✓' },
      { re: '\\.thenApply\\(', must: true, hint: 'Chain .thenApply(...) to wrap the result as "DONE: " + result.', pass: 'thenApply chained ✓' },
      { re: 'CompletableFuture\\.allOf\\(', must: true, hint: 'Wait for both futures together with CompletableFuture.allOf(f1, f2).', pass: 'allOf used to wait for both ✓' },
      { re: 'pool\\.shutdown\\s*\\(\\s*\\)', must: true, hint: 'Shut the pool down with pool.shutdown() in a finally block.', pass: 'pool.shutdown() called ✓' },
      { re: 'finally\\s*\\{[\\s\\S]*pool\\.shutdown', must: true, hint: 'shutdown() must be inside a finally block so the pool is released even if something above throws.', pass: 'shutdown is in a finally block ✓' }
    ],
    run: 'javac ReviewPipeline.java && java ReviewPipeline — should print two lines, "DONE: reviewed: Paper A" and "DONE: reviewed: Paper B" (order may vary), then exit cleanly (confirming the pool was actually shut down).',
    solution: `import java.util.concurrent.*;

class ReviewPipeline {
    static CompletableFuture<String> reviewAsync(ExecutorService pool, String title) {
        return CompletableFuture
            .supplyAsync(() -> "reviewed: " + title, pool)
            .thenApply(result -> "DONE: " + result);
    }

    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            CompletableFuture<String> f1 = reviewAsync(pool, "Paper A");
            CompletableFuture<String> f2 = reviewAsync(pool, "Paper B");
            CompletableFuture.allOf(f1, f2).join();
            System.out.println(f1.join());
            System.out.println(f2.join());
        } finally {
            pool.shutdown();
        }
    }
}`,
    notes: [
      'reviewAsync returns a CompletableFuture without ever blocking inside it — the pipeline is built purely from supplyAsync and thenApply callbacks; only main, at the very end, calls join().',
      'CompletableFuture.allOf(f1, f2).join() waits for BOTH to complete but returns Void — the actual results still have to be retrieved separately via f1.join() and f2.join(), each of which returns instantly at that point since allOf already confirmed completion.',
      'pool.shutdown() in the finally block matters even here: if allOf().join() or either join() threw (it can\'t in this exact solution, but would in code that reused this pattern with a task that fails), the pool would still be released rather than leaking non-daemon threads that keep the JVM alive.'
    ]
  },
  quiz: [
    {
      q: 'Why is Executors.newFixedThreadPool(n) generally preferred over creating a raw new Thread(...) for every task in a program handling many tasks?',
      options: ['A raw Thread carries real memory (a dedicated stack) and OS scheduling overhead per instance; a fixed pool reuses a bounded set of worker threads across many tasks instead of creating and destroying one per task', 'Raw threads are not allowed to call methods that throw exceptions', 'Executors.newFixedThreadPool(n) threads run faster per individual task than a raw Thread', 'There is no real difference; it is purely a style preference'],
      correct: 0,
      explain: 'Each OS thread costs real memory and scheduler overhead. Creating a fresh Thread per task doesn\'t scale past a small number of tasks; a fixed pool reuses a bounded, known number of worker threads, avoiding the cost of constant thread creation/destruction and capping concurrency.'
    },
    {
      q: 'A task submitted via pool.submit(someCallable) throws an exception inside call(). What happens if the returned Future\'s get() method is NEVER called?',
      options: ['The exception is silently swallowed — nothing is logged or printed, and there is no trace that the task failed', 'The exception is automatically printed to standard error by the ExecutorService', 'The pool automatically retries the task once', 'The JVM terminates immediately with an uncaught exception'],
      correct: 0,
      explain: 'A Future that is never inspected (via get() or a CompletableFuture handler) silently discards any exception the task threw — there is no automatic logging or propagation. This is why fire-and-forget submissions without ever checking the Future are a dangerous pattern.'
    },
    {
      q: 'What is the difference between ExecutorService.shutdown() and shutdownNow()?',
      options: ['shutdown() stops accepting new tasks but lets already-submitted/queued tasks finish normally; shutdownNow() interrupts running tasks immediately and returns the tasks that never started', 'They are identical; shutdownNow() is just a deprecated alias for shutdown()', 'shutdown() immediately kills all running tasks; shutdownNow() waits for them to finish', 'shutdown() only works on newSingleThreadExecutor pools'],
      correct: 0,
      explain: 'shutdown() is the graceful path — no new work accepted, but in-flight and queued work finishes. shutdownNow() is the aggressive path — it interrupts running tasks and returns the list of tasks that were queued but never started.'
    },
    {
      q: 'What does CompletableFuture.allOf(cf1, cf2, cf3) actually return, and how do you get the individual results afterward?',
      options: ['It returns CompletableFuture<Void>; you retrieve each individual result by calling .join() on each of the original futures (cf1, cf2, cf3) afterward, which returns instantly since allOf already confirmed completion', 'It returns a List<Object> containing the three results directly', 'It returns whichever of the three futures completes first', 'It automatically merges the three results into one combined String'],
      correct: 0,
      explain: 'allOf returns CompletableFuture<Void> — it signals only that all given futures have completed, not their values. You must call .join() (or .get()) on each original future separately to retrieve its individual result, which is immediate at that point.'
    },
    {
      q: 'In a CompletableFuture pipeline, when does .exceptionally(fallbackFn) actually run?',
      options: ['Only if some upstream stage in the pipeline threw an exception; it is skipped entirely if every upstream stage completed successfully', 'On every single call, regardless of success or failure, always overwriting the result', 'Only after .join() is called explicitly at the very end', 'Only if the pipeline was built without an explicit Executor'],
      correct: 0,
      explain: 'exceptionally is the async equivalent of a catch block: it supplies a fallback value only when something upstream failed, and is bypassed entirely on the success path — unlike .handle(), which runs unconditionally on both outcomes.'
    }
  ],
  testFlow: {
    title: 'Test yourself: pools, futures, and async pipelines under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A background task is submitted with pool.submit(someCallable) to log analytics data. The code never stores or inspects the returned Future. Weeks later, analytics data is mysteriously missing for some events, with no errors anywhere in the logs. What\'s the most likely explanation?',
        choices: [
          { text: 'The Callable is throwing an exception for those events, and because its Future is never get()\'d, that exception is silently swallowed with no trace at all', to: 'q1_right' },
          { text: 'ExecutorService automatically drops roughly 1% of submitted tasks under load as a built-in safety mechanism', to: 'q1_wrong_drop' },
          { text: 'Callable tasks are only guaranteed to run if the calling thread stays alive for at least one full second afterward', to: 'q1_wrong_timing' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct — an unchecked Future is exactly this trap: if the Callable throws for certain inputs, that failure never surfaces anywhere unless something calls get() on the resulting Future (or the code is rewritten to use CompletableFuture with an explicit .exceptionally()/.handle() handler). No log, no crash, no trace — just silently missing work.', next: 'q2' },
      q1_wrong_drop: { end: true, correct: false, text: 'ExecutorService has no such built-in "drop under load" behavior — a fixed pool queues excess tasks rather than discarding them (unless a bounded queue with a specific rejection policy is configured explicitly, which is a different, deliberate mechanism). The far more common real-world cause of silently missing async work is an unchecked Future swallowing a thrown exception.', retry: 'q1' },
      q1_wrong_timing: { end: true, correct: false, text: 'A submitted task runs on the pool\'s own worker thread independently of the calling thread\'s lifetime (as long as the pool itself is still alive and not shut down) — there\'s no such "calling thread must survive one second" requirement. The real risk here is an exception inside the task being silently lost because nobody ever inspected its Future.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A program creates an ExecutorService with Executors.newFixedThreadPool(4) to process a batch of tasks, then reaches the end of main() — but the process never actually exits; it just hangs indefinitely. What\'s the most likely cause?',
        choices: [
          { text: 'The pool was never shut down — its worker threads are non-daemon by default, so they stay alive and keep the JVM running even after main() finishes', to: 'q2_right' },
          { text: 'newFixedThreadPool(4) requires exactly 4 tasks to be submitted, and fewer than 4 were submitted, so it waits indefinitely for more', to: 'q2_wrong_count' },
          { text: 'main() itself must always call System.exit() explicitly, or the JVM never terminates under any circumstances', to: 'q2_wrong_exit' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct — ExecutorService worker threads are ordinary non-daemon threads. If shutdown() (or shutdownNow()) is never called, those threads simply sit alive indefinitely, waiting for more work that never comes, and the JVM cannot exit while any non-daemon thread is still alive.', next: 'q3' },
      q2_wrong_count: { end: true, correct: false, text: 'The number "4" in newFixedThreadPool(4) sets the MAXIMUM number of concurrent workers, not a required minimum number of tasks that must be submitted — a pool can process any number of tasks, including zero, without issue. The actual cause of a hang is a forgotten shutdown() leaving non-daemon worker threads alive.', retry: 'q2' },
      q2_wrong_exit: { end: true, correct: false, text: 'A normal Java program exits on its own once every non-daemon thread has finished — System.exit() is not required in ordinary cases. The reason THIS program hangs is specifically that its ExecutorService\'s worker threads were never told to stop via shutdown(), so they remain alive as non-daemon threads.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'You need to sear a dish (async step 1), plate it once seared (a transform of step 1\'s result), and separately warm a side dish (an independent async step 2) — then combine both onto one tray only once BOTH are ready. Which CompletableFuture method combines the two independent results together?',
        choices: [
          { text: 'thenCombine — it merges the results of two independently-running CompletableFutures into one, once both have completed', to: 'q3_right' },
          { text: 'thenApply — it transforms a single upstream result and cannot merge two independent futures', to: 'q3_wrong_apply' },
          { text: 'thenCompose — it flattens a future-returning step, but doesn\'t merge two independently-running futures together', to: 'q3_wrong_compose' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct — thenCombine(otherFuture, BiFunction) is specifically for merging two INDEPENDENT pipelines (the seared-and-plated dish, and the separately-warming side) into a single combined result once both individually finish, regardless of which completes first.', next: null },
      q3_wrong_apply: { end: true, correct: false, text: 'thenApply only transforms the result of the SAME upstream future it\'s chained onto — it has no way to reach into a second, separately-running CompletableFuture. Combining two independent pipelines\' results needs thenCombine.', retry: 'q3' },
      q3_wrong_compose: { end: true, correct: false, text: 'thenCompose is for flattening a step whose OWN result is itself a CompletableFuture (avoiding a nested CompletableFuture<CompletableFuture<R>>) — it doesn\'t merge two separately-started, independently-running futures. That\'s exactly what thenCombine is for.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Creating a new Thread per task in a loop instead of using a bounded ExecutorService — this doesn\'t scale past a small number of tasks and risks exhausting memory or OS thread limits under real load.',
    'Submitting a task and never calling get() (or attaching a CompletableFuture handler) on its Future — any exception the task throws is silently swallowed with zero trace, a genuinely dangerous way for async bugs to hide.',
    'Forgetting to call shutdown() on an ExecutorService — its worker threads are non-daemon by default and will keep the JVM (or an individual test) alive indefinitely, a real and cumulative resource leak, especially across many tests each creating their own pool.',
    'Calling get() with no timeout on a Future for work that might hang — this blocks the calling thread forever if the task never completes; prefer get(timeout, unit) when the task\'s completion isn\'t guaranteed.',
    'Chaining .thenApply(t -> someMethodReturningACompletableFuture(t)) instead of .thenCompose(...) — this produces an awkward, doubly-nested CompletableFuture<CompletableFuture<R>> instead of the flat CompletableFuture<R> you actually want.',
    'Relying on the default ForkJoinPool.commonPool() by omitting the executor argument to supplyAsync — this silently shares a single JVM-wide pool with anything else using it (including, in some environments, parallel streams), which can cause surprising contention under load; name your own executor explicitly for anything that matters.'
  ],
  interview: [
    {
      q: 'Explain why ExecutorService and the Executors factory exist — what specific problem do they solve compared to creating Thread objects directly, and how do you choose between newFixedThreadPool, newCachedThreadPool, and newSingleThreadExecutor?',
      a: 'Every OS-backed Thread carries genuine, non-trivial resource cost — a dedicated stack (often 512KB to 1MB by default per thread) that consumes memory regardless of how much actual work that thread performs, plus continuous OS scheduler overhead to context-switch it against every other runnable thread on the system. Creating and discarding a fresh Thread for every single task — perfectly reasonable for two or three threads in isolation — becomes a genuine scalability failure the moment task volume grows large: a program spinning up a new Thread per incoming request or per queued unit of work under real load can exhaust available memory or hit OS-imposed thread-count ceilings, and even well short of a hard limit, the constant overhead of thread creation and teardown wastes CPU cycles on lifecycle bookkeeping that produces zero actual application output. ExecutorService solves this by introducing a bounded, REUSABLE pool of worker threads that persist across many tasks — the pool is created once, and tasks are submitted to it one after another, each picked up by whichever worker thread becomes free, rather than a thread being created fresh per task. This also cleanly decouples WHAT runs (expressed as a Runnable or Callable, following the same program-to-an-interface discipline used throughout functional-interface-based Java code) from HOW MANY workers execute it concurrently and how they\'re scheduled — a decision made once, at pool-creation time, rather than scattered across every call site that happens to spawn a thread. The Executors factory then covers the common shapes needed in practice: newFixedThreadPool(n) is the right default whenever the concurrency ceiling is known or should be deliberately bounded — CPU-bound work sized to available cores, or work constrained by a downstream resource with a fixed capacity like a connection pool — because excess tasks simply queue rather than spawning unbounded additional threads; newCachedThreadPool() creates threads on demand and reuses idle ones, shrinking after an idle timeout, which is convenient for short-lived, bursty, low-and-variable-volume work but is a real hazard under sustained high load precisely because it has no upper bound on the number of threads it will create, risking the exact resource exhaustion a pool was meant to prevent; newSingleThreadExecutor() gives exactly one worker, guaranteeing tasks execute strictly in submission order, which is the right tool when you need serialized execution of a sequence of operations without hand-writing your own synchronized coordination.'
    },
    {
      q: 'Explain the exception-handling contract of Future.get() in detail, and describe a concrete, realistic scenario where forgetting to check a Future causes a production bug that\'s hard to diagnose.',
      a: 'When a Callable submitted via ExecutorService.submit() throws any exception during its call() method, that exception does not propagate directly out of Future.get() as-is — it is wrapped inside a checked ExecutionException, whose getCause() method returns the original throwable, meaning code calling get() must specifically catch (or declare) ExecutionException and then typically inspect or rethrow the wrapped cause to handle the original failure meaningfully; get() additionally declares InterruptedException, since the calling thread itself, while blocked waiting for the result, can be interrupted by another thread. A concrete, realistic production scenario: a service submits a background task via pool.submit(() -> auditLogger.recordEvent(event)) to avoid blocking the main request-handling thread on a slower audit-logging call, and — because the return value of submit() (the Future<Void>) is simply discarded, never assigned to a variable or inspected — if recordEvent() throws for some subset of malformed or edge-case events (say, an event whose payload fails a validation check inside the logging path), that exception vanishes completely: no stack trace in the logs, no metric incremented, no alert fired, nothing observable anywhere in the running system, because the ONLY place that exception could have surfaced was a Future.get() call that was never made. Weeks later, an investigation into missing audit records for certain event types finds nothing wrong in the primary request-handling logic (which is, in fact, working correctly) and instead discovers, often only through code review rather than any runtime signal, that the async logging call\'s Future was never checked. This exact pattern generalizes to any fire-and-forget submit() call whose purpose has any possibility of failure — the fix is either to explicitly call get() (accepting the blocking cost, or moving it off the hot path onto a dedicated result-checking mechanism), or, more idiomatically in modern code, to build the same async work as a CompletableFuture and attach an explicit .exceptionally() or .handle() callback so a failure is guaranteed to be observed and logged the moment it occurs, rather than depending on someone remembering to inspect a Future that has no forcing function requiring it be checked at all.'
    },
    {
      q: 'Explain the difference between a plain Future and a CompletableFuture in terms of composability, and walk through thenApply, thenCompose, and thenCombine with a concrete example of when each is the correct choice.',
      a: 'A plain Future, returned from ExecutorService.submit(), represents a single in-flight result with essentially one meaningful operation available on it beyond polling/cancellation: the blocking get() call — there is no built-in way to say "once this completes, automatically run the next step," which means composing a sequence of dependent async operations with plain Futures forces you into either blocking on get() partway through (tying up a thread purely to wait, defeating some of the point of going async in the first place) or hand-rolling your own callback/notification mechanism from scratch. CompletableFuture<T> solves exactly this by making the future itself composable: it exposes methods that register what should happen NEXT, as a callback, without blocking the thread that registers it. .thenApply(Function<T,R>) is the right choice when the next step is a pure, synchronous TRANSFORMATION of the upstream result that doesn\'t itself need to run asynchronously — for example, taking a raw computed score and formatting it into a display string; it returns a new CompletableFuture<R> immediately and the transformation runs automatically once the upstream value is ready. .thenCompose(Function<T, CompletableFuture<R>>) is the right choice specifically when the next step is ITSELF an asynchronous operation that returns its own CompletableFuture — for example, taking a fetched paper ID and asynchronously fetching that paper\'s full review history from a separate service call; using thenApply here would produce an unwieldy CompletableFuture<CompletableFuture<R>>, a future-of-a-future that has to be manually unwrapped, whereas thenCompose automatically flattens that nesting into a single CompletableFuture<R>, exactly mirroring the map-versus-flatMap distinction Optional and Stream already establish elsewhere in the language. .thenCombine(CompletableFuture<U> other, BiFunction<T,U,R>) is the right choice when you have two INDEPENDENT async operations that don\'t depend on each other\'s results and can genuinely run concurrently — for example, fetching a paper\'s citation count from one service while separately fetching its abstract from another, then combining both into one summary object only once BOTH have individually completed; used incorrectly for a case where the second operation actually depends on the first\'s result, thenCombine would be semantically wrong, since it assumes true independence between the two futures it merges. In every case, the actual blocking call — join() or get() — is deferred to the very end of however long a chain of thenApply/thenCompose/thenCombine calls is built, meaning the entire pipeline in between executes without ever occupying a thread purely to wait.'
    },
    {
      q: 'A colleague\'s code creates a new ExecutorService inside a frequently-called method and never shuts it down. Explain precisely why this is a bug, what its observable symptoms would be, and how you\'d fix it.',
      a: 'The core issue is a resource leak: every call to Executors.newFixedThreadPool(n) (or any Executors factory method) creates a genuinely new pool of worker threads, and those threads are ordinary, non-daemon Java threads by default — meaning each one stays alive, consuming a stack\'s worth of memory and remaining a live, schedulable OS thread, until something explicitly calls shutdown() or shutdownNow() on that specific pool instance. If the method creating the pool is called frequently — once per incoming request, once per test, once per loop iteration — and never shuts down what it creates, each call leaks an entirely new set of worker threads that are never reclaimed, since the pool itself typically becomes unreachable (no remaining reference to call shutdown() on later) while its threads remain alive regardless, since a thread\'s liveness is independent of whether anything still references the ExecutorService object that spawned it. The observable symptoms build up gradually rather than failing immediately, which makes this bug particularly nasty to diagnose: memory usage climbs slowly as more thread stacks accumulate, the OS thread count for the process climbs (visible via jstack or OS-level tools, tying back to the jvm-tools-reflection lesson\'s diagnostic toolkit — a `jstack` dump showing hundreds of near-identical idle pool-N-thread-M threads, all just parked waiting for work that will never come, is close to a diagnostic signature for exactly this bug), and eventually the process either hits an OS-level thread-creation limit and starts throwing OutOfMemoryError: unable to create new native thread on completely unrelated code paths, or, in a long-running server, degrades in overall responsiveness as scheduler overhead grows with thread count — and if it\'s a short-lived program or a test runner rather than a server, the process may simply never exit at all, hanging indefinitely after its apparent work is done, since those leaked non-daemon threads keep the JVM alive. The fix is straightforward once identified: either hoist the ExecutorService\'s creation OUT of the frequently-called method entirely, creating it once (e.g., as a field, created at startup and shut down once at shutdown), so it\'s genuinely reused across calls rather than recreated per call — which is usually the actually-intended design and the right fix here — or, if a fresh pool genuinely is needed per call for some specific isolation reason, wrap its use in a try/finally (or Java 19+ try-with-resources, since ExecutorService implements AutoCloseable) that guarantees shutdown() runs before the method returns, on every exit path, success or exception.'
    }
  ]
};
