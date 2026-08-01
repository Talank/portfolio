window.LESSONS = window.LESSONS || {};
window.LESSONS['jmh-benchmarking'] = {
  id: 'jmh-benchmarking',
  title: 'JMH: Microbenchmarking Without Lying to Yourself',
  category: 'Part 7 — Testing',
  timeMin: 45,
  summary: 'A benchmark is a test whose assertion is a number, and it is the easiest kind of test to get catastrophically, confidently wrong. Time a loop with System.nanoTime() and the JVM will cheerfully delete the code you were measuring, fold your arithmetic into a constant at compile time, or report the speed of the interpreter because the JIT had not warmed up yet — and you will get a plausible-looking number with no warning at all. This lesson covers why naive microbenchmarks lie, and JMH, the harness written by the people who build the JVM to make them stop: @Benchmark, warmup and measurement iterations, forks, Blackhole and the return-value rule, @State and scope, @Param for sweeps, the modes (throughput vs average time vs sample), and how to read the error bars instead of the mean. It closes with the most important skill of all — knowing when a microbenchmark is the wrong instrument entirely.',
  goals: [
    'Explain the four ways a naive timing loop lies: dead-code elimination, constant folding, no warmup, and run-to-run variance',
    'Write a correct JMH benchmark with @Benchmark, @State, warmup/measurement iterations and forks, and run it from Maven or Gradle',
    'Defeat dead-code elimination properly — return the result or consume it with a Blackhole — and know why a field assignment is not enough',
    'Read JMH output as a distribution: interpret the ± error, understand why forks matter, and refuse to call a 3% difference a win',
    'Recognise when a microbenchmark is the wrong tool and a profile or an end-to-end measurement is the right one'
  ],
  concept: [
    {
      h: 'Why your timing loop is lying to you',
      p: [
        'The obvious way to benchmark is to record <code>System.nanoTime()</code>, run the thing a million times, record it again, and divide. On a language with an ahead-of-time compiler and no runtime optimiser this is roughly honest. On the JVM it is not, and the failures are silent — you get a number, it looks reasonable, and it is wrong by orders of magnitude. There are four distinct mechanisms, and they are all consequences of things the JIT does correctly (Part 2). First, <b>dead-code elimination</b>: if you compute a value and never use it, the JIT is entitled to notice that and delete the computation entirely. Your loop measuring <code>hash(x)</code> a million times, discarding each result, can be optimised down to nothing at all, and you will report that hashing takes 0.3 nanoseconds — the cost of an empty loop. Second, <b>constant folding</b>: if the inputs to your benchmark are compile-time constants (a <code>static final int</code>, or a literal you passed in), the JIT can evaluate the whole expression once and reuse the answer, so you measure a field read.',
        'Third, and the one that catches everyone: <b>no warmup</b>. A JVM starts interpreting bytecode, profiles it, and only compiles a method after it has run enough times to be worth compiling — then possibly recompiles it at a higher tier, and possibly deoptimises it back when an assumption it speculated on turns out false. The first few thousand iterations of your loop measure the interpreter; somewhere in the middle you measure C1; eventually you measure C2. Averaging all of that together produces a number that describes no real execution state whatsoever. Fourth, <b>run-to-run variance</b>: a single JVM run bakes in particular profiling decisions, a particular heap layout, and a particular set of loaded classes, and a different run of the identical code can land 10% away for reasons that have nothing to do with your change. Any one of these is enough to invert a comparison and make the slower option look faster. Notice the shape of the problem: none of these produce an error, a warning, or an obviously silly number. They produce a plausible lie, which is why this needs a harness rather than discipline.'
      ]
    },
    {
      h: 'JMH: a harness written by the people who wrote the optimiser',
      p: [
        '<b>JMH</b> (Java Microbenchmark Harness) comes from the OpenJDK team — the same people who build the JIT that is defeating your loop — and it exists because they concluded that benchmarking the JVM correctly by hand is unreasonably hard. You add it as a dependency (the standard route is the <code>jmh-java-benchmark-archetype</code>, which generates a project already configured to build a self-contained <code>benchmarks.jar</code>), annotate a method with <code>@Benchmark</code>, and run it. What you get back is not one number but a distribution with error bars, produced under conditions designed to be actually measurable.',
        'The mechanics it handles for you. It runs <b>warmup iterations</b> whose results are discarded, so measurement begins after the JIT has reached steady state — <code>@Warmup(iterations = 5, time = 1)</code> then <code>@Measurement(iterations = 5, time = 1)</code> is a reasonable default, and JMH prints the per-iteration numbers so you can see whether they had actually stabilised. It runs the whole thing in <b>forks</b>: separate JVM processes, each freshly warmed, because profile pollution and layout luck are per-process — <code>@Fork(3)</code> means three independent JVMs, and the variance <i>between</i> forks is the honest measure of run-to-run noise that a single process structurally cannot show you. Never use <code>@Fork(0)</code> outside of debugging; it runs in JMH\'s own JVM, already polluted by the harness. It generates the benchmark loop itself rather than trusting yours, inserting the machinery that prevents the optimiser from removing your code. And it isolates state properly, so that the object you are operating on is not a constant the JIT can fold.'
      ]
    },
    {
      h: 'The return-value rule and the Blackhole',
      p: [
        'The single most important habit in JMH is trivial to state: <b>return the result of whatever you are measuring.</b> A <code>@Benchmark</code> method that returns a value has that value consumed by JMH\'s generated harness in a way the JIT cannot see through, so the computation cannot be eliminated. A <code>void</code> benchmark that computes something and drops it is the classic broken benchmark, and JMH cannot save you from it. If you produce several values, take a <code>Blackhole</code> parameter and call <code>bh.consume(...)</code> on each — <code>Blackhole</code> is a carefully constructed sink designed to be opaque to the optimiser while costing only a few nanoseconds itself.',
        'Two subtleties people get wrong. Assigning to a field is <i>not</i> a reliable substitute for returning, because the JIT can still prove the field is never read and eliminate the store; the harness-consumed return value is the supported mechanism. And <code>Blackhole.consumeCPU(tokens)</code> is a different thing entirely — it burns a controlled amount of CPU, useful for simulating a workload, and is not a way to consume a value. The mirror-image problem is <b>constant folding on the input side</b>: if your benchmark operates on a <code>static final</code> or a literal, the JIT evaluates it once and you measure nothing. The fix is <code>@State</code>: put your inputs in a state object as ordinary non-final fields, and JMH will make sure the optimiser treats them as genuinely unknown. <code>@State(Scope.Benchmark)</code> shares one instance across all threads (right for a read-only input, and the way to benchmark contention deliberately); <code>@State(Scope.Thread)</code> gives each thread its own copy (right when the state is mutated, and the default you should reach for when unsure). Set up expensive fixtures with <code>@Setup(Level.Trial)</code>, and use <code>@Setup(Level.Invocation)</code> only when you truly must — it runs before every single call and its own overhead can dominate a fast benchmark.'
      ]
    },
    {
      h: 'Modes, parameters, and reading the output honestly',
      p: [
        'JMH offers several <b>modes</b> and the choice changes what the number means. <code>Mode.Throughput</code> reports operations per unit time — the default, and the right one for "how much work can this do per second". <code>Mode.AverageTime</code> reports time per operation, which is more natural for small pure functions. <code>Mode.SampleTime</code> samples individual invocations and reports <b>percentiles</b>, which is what you want when tail latency matters, because a p99 of 40 ms hiding behind a 2 ms mean is exactly the kind of thing an average conceals. <code>Mode.SingleShotTime</code> measures one cold invocation, for deliberately measuring startup or first-call cost. Alongside this, <code>@Param</code> sweeps a benchmark across values — <code>@Param({"10", "1000", "100000"})</code> runs the whole thing once per value, which is how you discover that your clever data structure wins at ten elements and loses badly at a hundred thousand. A single-size benchmark is one of the commonest ways to draw a wrong conclusion from a technically correct measurement.',
        'Then read the output as a distribution, not as a number. JMH prints <code>score ± error (99.9%)</code>, and the error is the part that carries the information: if two options differ by 3% and their intervals overlap, <b>you have not measured a difference</b>, and reporting one as faster is exactly the sort of claim that gets propagated for years. Widen the gap or gather more data. Look at the per-iteration output too — if the numbers were still trending in the last warmup iterations, warmup was too short and everything downstream is suspect. And be relentlessly suspicious of results that are too good: a benchmark reporting sub-nanosecond times for real work has almost certainly been optimised away, and one reporting an implausible speedup usually means the two arms are not doing the same work. The healthiest instinct in benchmarking is to try to disprove your own favourable result before publishing it.'
      ]
    },
    {
      h: 'When a microbenchmark is the wrong instrument',
      p: [
        'This is the part that separates people who benchmark usefully from people who generate numbers. A microbenchmark measures one method in isolation, on warm code, with a hot cache, no contention, no GC pressure from the rest of the system, and no network. Real programs have all of those. A method that is 40% faster in JMH can make your service slower — because the faster version allocates more and shifts cost into GC, because it lost the cache locality it had in situ, because the original was never on the critical path at all, or because the win is 200 nanoseconds inside a request that spends 900 milliseconds waiting on a database. The previous lesson\'s discipline applies directly: <b>profile first to find out what matters, then benchmark the thing the profile named.</b> Benchmarking before profiling is how people spend a week optimising a method that accounts for 0.1% of runtime.',
        'So the honest tool selection looks like this. To find out where time goes in a real workload, use a <b>profiler</b> — a flame graph over the whole system. To compare two implementations of one small, hot, already-identified piece of code, use <b>JMH</b>. To decide whether a change actually helped the product, use an <b>end-to-end measurement under realistic load</b> — a load test, or production metrics behind a flag — because that is the only measurement that includes the effects a microbenchmark structurally excludes. There is one more link worth making explicit, to the flaky-test lesson: a benchmark whose result changes between runs is telling you the same thing a flaky test tells you, which is that your measurement has an uncontrolled input. Forks, sufficient warmup, a quiet machine and a fixed CPU governor are the benchmarking equivalents of removing shared mutable state from a test suite. A benchmark you cannot reproduce is not evidence, however much you like its conclusion.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Usopp times the crew, and every stopwatch lies',
      text: 'Usopp announces he will settle once and for all which crewmate is fastest at hauling rope, and being Usopp he builds an elaborate apparatus for it. His first attempt is a disaster nobody notices for a while. He asks each of them to haul a rope that is not attached to anything, and times it — and of course Zoro, who is neither stupid nor eager, works out within three pulls that the rope goes nowhere, and simply stops pulling while continuing to look busy. Usopp records the fastest time ever measured on the Sunny (dead-code elimination: compute a value nobody uses and the JIT deletes the computation, leaving you timing an empty loop). His second attempt uses the same crate every time, and Sanji, who has now lifted that identical crate forty times, has stopped lifting it at all — he knows exactly where it goes and simply puts it there (constant folding: if the input is a compile-time constant the optimiser evaluates it once and reuses the answer). His third attempt is fairer but he times everyone on their very first cold, sleepy attempt at dawn, before anyone has stretched, and declares Chopper the slowest member of the crew — which is true only of Chopper before breakfast (no warmup: the first thousands of iterations measure the interpreter, not the compiled code). And when Nami points out that he ran the whole contest exactly once, on one particular morning, with one particular wind, Usopp insists the result is final; they rerun it the next day and get a completely different ranking (run-to-run variance, which is why JMH forks separate JVMs and treats the spread between them as the real error bar). Franky finally takes the stopwatch away and rebuilds the whole thing properly: real rope attached to real cargo so nobody can skip the work, a different unpredictable load each round so nobody can memorise it, several warm rounds thrown away before anything counts, the contest repeated on three separate days, and — the part Usopp resents most — the results reported as a range rather than a champion. Because when the ranges overlap, Franky says, there is no champion; there is only a difference too small for this stopwatch to see, and announcing one anyway is how a rumour outlives the ship that started it.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon proves his route is faster, using a stopwatch and no controls',
      text: 'Sheldon has determined, empirically, that his new route to the comic book store is superior, and he has the data to prove it: one run, timed to the hundredth of a second, on a Sunday morning, downhill, with no traffic and no bag. Leonard\'s objection is not that the number is wrong but that the number is not evidence of anything, and each of Sheldon\'s protocol failures maps onto a way a JVM benchmark lies. He timed himself walking a route while carrying nothing and delivering nothing, so the errand — the actual work — was never performed at all, which is a very fast way to do a thing you are not doing (dead-code elimination). He used the same starting traffic light every time, and by the fourth trial he was simply timing his memory of the light rather than the light (constant folding). He measured his very first attempt on an unfamiliar path, when he was still reading street signs, and then again after twenty repetitions when he could do it without looking — and averaged the two, producing a figure describing neither (no warmup: mixing interpreted, C1 and C2 execution into one mean). And he ran it once, on one Sunday, and declared the matter closed, at which point Penny walked the old route on a Tuesday and beat him (run-to-run variance; you need forks). What eventually makes it rigorous is Amy, who is a working scientist and treats it as an experiment: identical loads carried on both routes so the work is genuinely done, randomised starting conditions so nothing can be memorised, several discarded practice runs before any measurement counts, repetition across separate days, and results reported with a confidence interval. Sheldon\'s route wins by four seconds. The interval is plus or minus eleven. Amy explains, with enormous patience, that this means he has not shown his route is faster — and Sheldon, who genuinely does respect the method more than he respects being right, accepts it. That is the whole lesson: a three percent difference with overlapping error bars is not a result, no matter how much you want it to be.',
    },
    why: 'Usopp\'s rope that is not attached to anything IS dead-code elimination: nobody uses the result, so the JIT deletes the work and you time an empty loop (fix: return the value, or Blackhole.consume it). The same crate every round is constant folding — a static final input the optimiser evaluates once (fix: @State with non-final fields). Timing Chopper before breakfast is missing warmup: the first thousands of iterations measure the interpreter, not C2. Running the contest once and declaring it final is run-to-run variance, which is exactly why JMH uses @Fork to run several fresh JVMs and treats the spread between them as the error. And Amy\'s verdict — four seconds ahead, plus or minus eleven — is how to read "score ± error (99.9%)": when the intervals overlap, you have not measured a difference.'
  },
  storyAnim: {
    title: 'Four ways a stopwatch lies, and what a harness does about it',
    h: 300,
    props: [
      { id: 'deadcode', emoji: '🪢', label: 'Rope tied to nothing: result unused → code deleted', x: 12, y: 12 },
      { id: 'fold', emoji: '📦', label: 'Same crate every round: constant input → folded away', x: 46, y: 12 },
      { id: 'warmup', emoji: '🥱', label: 'Timed before breakfast: interpreter, not C2', x: 80, y: 12 },
      { id: 'variance', emoji: '🎲', label: 'Ran it once: run-to-run variance', x: 20, y: 46 },
      { id: 'blackhole', emoji: '🕳️', label: 'return the value / bh.consume() — work cannot vanish', x: 56, y: 46 },
      { id: 'state', emoji: '🔀', label: '@State: inputs the optimiser cannot fold', x: 88, y: 46 },
      { id: 'fork', emoji: '🍴', label: '@Fork(3) + warmup thrown away', x: 30, y: 80 },
      { id: 'error', emoji: '📊', label: 'score ± error — overlapping means NO result', x: 74, y: 80 }
    ],
    actors: [
      { id: 'usopp', emoji: '🎯', label: 'Usopp', x: 12, y: 30 }
    ],
    steps: [
      { c: 'Usopp times the crew hauling a rope attached to nothing. Zoro works out the rope goes nowhere and stops pulling — fastest time ever recorded.', p: { deadcode: 'bad' }, a: { usopp: [12, 30] } },
      { c: 'That is dead-code elimination: compute a value nobody uses and the JIT is entitled to delete the computation. You timed an empty loop.', p: { deadcode: 'bad' } },
      { c: 'Attempt two uses the same crate every round. Sanji has memorised where it goes and stops lifting. Constant inputs get folded to a constant answer.', p: { fold: 'bad' } },
      { c: 'Attempt three times everyone cold at dawn and declares Chopper slowest — true only before breakfast. Without warmup you measure the interpreter, not the JIT.', p: { warmup: 'bad' } },
      { c: 'And he ran the whole contest exactly once. The next day the ranking is different: run-to-run variance, baked into a single process.', p: { variance: 'bad' } },
      { c: 'Franky rebuilds it. Real rope, real cargo — the work is consumed and cannot be skipped. In JMH: return the result, or take a Blackhole and consume it.', p: { blackhole: 'good' } },
      { c: 'A different unpredictable load each round, so nothing can be memorised. In JMH: @State holding non-final fields the optimiser must treat as unknown.', p: { state: 'good' } },
      { c: 'Warm rounds thrown away before anything counts, and the contest repeated on three separate days. @Warmup, @Measurement, @Fork(3).', p: { fork: 'good' } },
      { c: 'And the result reported as a range. Four seconds ahead, plus or minus eleven, is not a win — when the intervals overlap you have not measured a difference.', p: { error: 'lit' } }
    ]
  },
  conceptFlow: {
    title: 'From "I think this is faster" to a number you can defend',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Before you benchmark',
        nodes: [
          { id: 'profile', text: 'profile the real workload first\ndoes this code even matter?' },
          { id: 'scope', text: 'small, hot, isolated?\nelse benchmark end-to-end' }
        ]
      },
      {
        label: 'Write it correctly',
        nodes: [
          { id: 'ret', text: '@Benchmark returns the result\nor Blackhole.consume()' },
          { id: 'state', text: '@State(Scope.Thread)\ninputs the JIT cannot fold' }
        ]
      },
      {
        label: 'Run it honestly',
        nodes: [
          { id: 'warm', text: '@Warmup discarded\n@Measurement counts' },
          { id: 'fork', text: '@Fork(3): fresh JVMs\nvariance between them is the truth' }
        ]
      },
      {
        label: 'Read it honestly',
        nodes: [
          { id: 'err', text: 'score ± error (99.9%)\noverlap = no result' },
          { id: 'e2e', text: 'confirm end-to-end\nthe micro-win may not be real' }
        ]
      }
    ],
    steps: [
      { active: ['profile'], note: 'Before writing a benchmark at all: profile the real workload. Benchmarking before profiling is how a week disappears into a method responsible for 0.1% of runtime.' },
      { active: ['scope'], note: 'A microbenchmark is for a small, hot, already-identified piece of code. If the question is "is the service faster", that is a load test, not a @Benchmark — the micro measurement excludes GC pressure, contention and I/O by construction.' },
      { active: ['ret'], note: 'Return the result from the @Benchmark method so JMH\'s generated harness consumes it opaquely. A void benchmark that drops its result can be deleted entirely. For several values, take a Blackhole and consume each — and note a field assignment is NOT a reliable substitute.' },
      { active: ['state'], note: 'Put inputs in an @State object as non-final fields, so the JIT cannot constant-fold them. Scope.Thread when the state is mutated (the safe default); Scope.Benchmark to share one instance, which is also how you deliberately benchmark contention.' },
      { active: ['warm'], note: 'Warmup iterations run and are thrown away, so measurement starts after the JIT has reached steady state. Read the per-iteration numbers: if they were still trending during the last warmup rounds, warmup was too short and every number after it is suspect.' },
      { active: ['fork'], note: '@Fork(3) runs three separate JVMs, each freshly warmed. Profile pollution and heap layout are per-process, so the spread BETWEEN forks is the honest run-to-run error — something a single process structurally cannot show you. @Fork(0) is for debugging only.' },
      { active: ['err'], note: 'Read score ± error, not score. If two options differ by 3% and their 99.9% intervals overlap, you have not measured a difference and must not report one. Be most suspicious when the result flatters you.' },
      { active: ['e2e'], note: 'Finally, confirm the win end-to-end under realistic load. A 40% micro-win can make a service slower — more allocation, worse locality, or 200 ns saved inside a request that waits 900 ms on the database.' }
    ]
  },
  tech: [
    {
      q: 'Why can you not simply time a loop with System.nanoTime()? Name the specific mechanisms.',
      a: 'Because the JVM is an optimising runtime, and four separate mechanisms will silently invalidate the measurement — silently being the key word, since none of them produces an error or an obviously absurd number. First, dead-code elimination: if you compute a value and never use it, the JIT is entitled to prove the computation has no observable effect and remove it, so your million-iteration loop over hash(x) collapses to an empty loop and you report a few hundred picoseconds for a real hash. Second, constant folding: if the inputs are compile-time constants — a static final field, or a literal — the optimiser can evaluate the expression once and reuse the result, so you measure a field read rather than the work. Third, absence of warmup: HotSpot starts by interpreting bytecode, compiles a method with C1 after it becomes warm, recompiles with C2 when it becomes hot, and may deoptimise back if a speculative assumption fails; the first thousands of iterations therefore measure the interpreter, the middle measures C1, and only the tail measures steady-state C2. Averaging across all of that describes no real execution state at all. Fourth, run-to-run variance: a single JVM process bakes in particular profiling decisions, a particular heap layout and a particular class-loading order, so an identical binary can land 10% away on the next run for reasons unrelated to your change; measuring once and concluding is not valid. On top of these sit ordinary environmental problems — CPU frequency scaling, turbo, other processes, a laptop thermally throttling halfway through. Any one of these is enough to invert a comparison and make the slower implementation look faster, which is why the JVM needs a harness rather than merely a careful programmer.'
    },
    {
      q: 'What does JMH do for you, and what is the minimum correct benchmark?',
      a: 'JMH is the OpenJDK team\'s microbenchmark harness, written by the same people who build the JIT, on the premise that hand-benchmarking the JVM correctly is unreasonably difficult. It generates the measurement loop itself rather than trusting yours, inserting machinery that prevents the optimiser from eliminating the code under test; it runs warmup iterations whose results are discarded so that measurement begins at steady state; it runs the whole benchmark in several forked JVM processes so that per-process luck is visible as variance rather than hidden in a single number; it isolates inputs so they cannot be constant-folded; and it reports a distribution with a confidence interval rather than a bare figure. A minimum correct benchmark is roughly: annotate the class with @BenchmarkMode(Mode.AverageTime), @OutputTimeUnit(TimeUnit.NANOSECONDS), @Warmup(iterations = 5, time = 1), @Measurement(iterations = 5, time = 1), @Fork(3), and @State(Scope.Thread); hold the inputs as ordinary non-final fields initialised in an @Setup method; and write a @Benchmark method that performs the work and RETURNS the result. That return is not stylistic — it is the mechanism by which JMH consumes the value opaquely so the computation cannot be deleted. If you produce several values, take a Blackhole parameter and call bh.consume() on each. You build it as a self-contained benchmarks.jar (the jmh-java-benchmark-archetype generates a project already set up for this) and run it with java -jar target/benchmarks.jar, which keeps the benchmark out of your application classpath and away from your test runner.'
    },
    {
      q: 'Explain @State, its scopes, and why it exists.',
      a: '@State exists to solve the input half of the optimisation problem. If a benchmark operates on a constant — a literal, or a static final field — the JIT can evaluate the expression at compile time and hand back the answer, so you measure a field read instead of the work. A @State class holds your inputs as ordinary, non-final instance fields that JMH manages, which forces the optimiser to treat them as genuinely unknown values. It is also where fixtures live: expensive setup goes in a method annotated @Setup, and cleanup in @TearDown. The scopes control sharing. Scope.Thread gives every benchmark thread its own instance, which is what you want whenever the state is mutated during the benchmark, and is the sensible default when you are unsure, because it eliminates accidental contention that would otherwise silently become part of your measurement. Scope.Benchmark shares one instance across all threads — correct for a large read-only input you do not want to duplicate, and also the way you deliberately benchmark contention on a shared data structure, which is a legitimate and important thing to measure. Scope.Group is for @Group benchmarks where different threads run different methods against shared state, used for asymmetric workloads such as one producer and several consumers. The @Setup levels matter too: Level.Trial runs once per fork and is the default and usually right; Level.Iteration runs before each iteration; Level.Invocation runs before every single call, which sounds appealing for benchmarks needing fresh state each time but whose own overhead can easily dominate a benchmark measuring nanoseconds — the JMH documentation warns about it explicitly, and if you need it, that is often a sign the thing you are measuring is too small to microbenchmark meaningfully.'
    },
    {
      q: 'How do you read JMH output, and when is a difference real?',
      a: 'JMH reports each benchmark as score ± error, with the confidence level stated, typically 99.9%. The score alone is the least interesting part; the error carries the information about whether you have measured anything. The rule is straightforward and constantly violated: if two variants differ by less than their combined error — if the intervals overlap — you have not demonstrated a difference, and reporting one as faster is how a false performance claim gets repeated for years. A 3% difference with ±5% intervals is not a 3% win; it is noise. When that happens your options are to gather more data (more iterations, more forks), to reduce the noise (a quiet machine, a fixed CPU governor, disabled turbo), or to accept that the difference is too small for this instrument and probably too small to matter. You should also read the per-iteration output rather than only the summary: if the numbers were still trending upward or downward through the final warmup iterations, warmup was too short and steady state was never reached, which invalidates everything after it. Look at the variance between forks specifically, since that is the run-to-run component that a single process cannot reveal. For latency work, prefer Mode.SampleTime, which reports percentiles, because a mean is precisely the statistic that conceals a bad tail — a p99 of 40 ms can hide behind a 2 ms average. And apply a blanket suspicion to results that are too good: sub-nanosecond times for real work almost always mean the benchmark was optimised away, and an implausible speedup usually means the two arms are not doing the same amount of work. The discipline that matters most is trying hardest to disprove the results you like.'
    },
    {
      q: 'When is a microbenchmark the wrong tool?',
      a: 'Whenever the question you actually have is about a system rather than about a method. A microbenchmark measures one piece of code in isolation, on fully warmed JIT-compiled paths, with a hot cache, without contention from the rest of the application, without the GC pressure the rest of the system generates, and without any I/O. Real programs have all of those, so a result that is unambiguously true in JMH can be irrelevant or actively misleading in production. Concretely: an implementation 40% faster in a microbenchmark can make a service slower because it allocates more and pushes cost into GC; because it lost cache locality that it had in its real calling context; because it was never on the critical path, so a 40% improvement to 0.1% of runtime is nothing; or because it saves 200 nanoseconds inside a request that spends 900 milliseconds waiting on a database. This is why profiling comes first: profile the real workload to discover what actually consumes time, and only then microbenchmark the specific piece the profile named. The reverse order — benchmark first, discover later that it did not matter — is one of the most common ways engineering time is wasted. The right tool by question: a profiler and a flame graph for "where does the time go"; JMH for "which of these two implementations of this small hot method is faster"; a load test or production metrics behind a feature flag for "did this change make the product faster", since that is the only measurement that includes the effects a microbenchmark excludes by construction. And a link back to flaky tests: a benchmark whose result changes run to run is telling you exactly what a flaky test tells you, that there is an uncontrolled input in your measurement. Forks, adequate warmup, a quiet machine and a pinned CPU governor are the benchmarking equivalents of removing shared mutable state from a test suite.'
    }
  ],
  code: {
    title: 'The same benchmark, wrong and then right',
    intro: 'This is the whole lesson in one file: a hand-rolled timing loop, and the JMH version of the identical question. The point is not that the numbers differ slightly — it is that the naive one can report a result that is wrong by orders of magnitude while looking entirely reasonable, and gives you no signal at all that anything went wrong.',
    code: `// ---------- 1. The naive version. Every number it prints is untrustworthy. ----------
public class NaiveBenchmark {
    static final String INPUT = "flaky-test-triage";      // constant → foldable

    static int hash(String s) {
        int h = 0;
        for (int i = 0; i < s.length(); i++) h = 31 * h + s.charAt(i);
        return h;
    }

    public static void main(String[] args) {
        long t0 = System.nanoTime();
        for (int i = 0; i < 10_000_000; i++) {
            hash(INPUT);            // result discarded → the JIT may delete the call entirely
        }
        long ns = System.nanoTime() - t0;
        System.out.printf("%.3f ns/op%n", ns / 10_000_000.0);
        // Prints something like 0.3 ns/op. That is faster than a single memory access.
        // It is not a fast hash; it is no hash at all — plus no warmup, one run, folded input.
    }
}


// ---------- 2. The JMH version of the same question. ----------
import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.infra.Blackhole;
import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.AverageTime)                 // time per op; Throughput is the default
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@Warmup(iterations = 5, time = 1)                // discarded: lets the JIT reach steady state
@Measurement(iterations = 5, time = 1)           // these count
@Fork(3)                                         // three fresh JVMs — variance between them is the real error
@State(Scope.Thread)                             // per-thread state, so nothing is shared or folded
public class HashBenchmark {

    // NOT static final: a constant would be folded away and you would measure nothing.
    String input;

    @Param({"8", "64", "512"})                   // sweep the size — behaviour often flips with n
    int length;

    @Setup(Level.Trial)                          // once per fork, not per invocation
    public void setup() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) sb.append((char) ('a' + (i % 26)));
        input = sb.toString();
    }

    static int hash(String s) {
        int h = 0;
        for (int i = 0; i < s.length(); i++) h = 31 * h + s.charAt(i);
        return h;
    }

    @Benchmark
    public int handRolled() {
        return hash(input);          // RETURNED — JMH consumes it opaquely, so it cannot be deleted
    }

    @Benchmark
    public int builtIn() {
        return input.hashCode();     // String caches its hash, so this is a different question — see notes
    }

    @Benchmark
    public void several(Blackhole bh) {
        bh.consume(hash(input));     // when you produce more than one value, consume each
        bh.consume(input.hashCode());
    }
}

/* Build and run (the archetype sets this up for you):
     mvn archetype:generate -DinteractiveMode=false \\
       -DarchetypeGroupId=org.openjdk.jmh -DarchetypeArtifactId=jmh-java-benchmark-archetype
     mvn clean package
     java -jar target/benchmarks.jar HashBenchmark -rf json -rff results.json

   Read the output as a distribution, never as a single number:
     Benchmark                (length)  Mode  Cnt   Score   Error  Units
     HashBenchmark.handRolled        8  avgt   15   5.902 ± 0.211  ns/op
     HashBenchmark.handRolled       64  avgt   15  41.337 ± 1.904  ns/op
     HashBenchmark.handRolled      512  avgt   15 330.114 ± 9.556  ns/op

   Two numbers are only different if their ± intervals do NOT overlap. */`,
    notes: [
      'The naive version reports roughly 0.3 ns/op — faster than one memory access, which is the tell. The work was deleted because nothing consumed the result. A benchmark that is implausibly fast has usually not been optimised; it has been eliminated.',
      'Note what changed structurally in the JMH version: the input stopped being static final (so it cannot be constant-folded), the benchmark method RETURNS its result (so it cannot be dead-code eliminated), warmup happens and is discarded (so the JIT is at steady state), and it runs in three separate JVMs (so run-to-run variance is visible instead of hidden).',
      'builtIn() is deliberately a trap worth discussing: String caches its hash code after the first computation, so this benchmark measures a field read on every call after the first, not a hash. It is a perfect miniature of the real skill — making sure the two arms of a comparison are actually doing the same work.',
      '@Param sweeps the input size, and this matters more than it looks. Implementations regularly cross over: one wins at 8 characters and loses at 512. A benchmark at a single size is a technically correct measurement of a question nobody asked.',
      'Run the jar standalone rather than from your IDE or test runner. A benchmark sharing a JVM with a test framework inherits its class loading, its JIT profile and its GC state — the same category of contamination JMH forks exist to prevent.'
    ]
  },
  lab: {
    title: 'Fix a broken benchmark',
    prompt: 'Below is a benchmark with every classic defect. Repair it. (1) Give the class the annotations it needs so warmup is discarded, measurement is separate, and it runs in more than one forked JVM — <code>@Warmup</code>, <code>@Measurement</code>, <code>@Fork</code>, <code>@State</code>. (2) The input is <code>static final</code>, so it can be constant-folded — make it an ordinary instance field built in an <code>@Setup</code> method. (3) The benchmark method is <code>void</code> and discards its result, so it can be deleted entirely — return the value instead (or consume it with a <code>Blackhole</code>). (4) In the ANSWER comment, explain why <code>@Fork(1)</code> would still be weaker than <code>@Fork(3)</code>, and state the rule for deciding whether two JMH scores actually differ.',
    starter: `import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.infra.Blackhole;
import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
// TODO: add @Warmup, @Measurement, @Fork and @State here
public class SumBenchmark {

    // TODO: this is constant-foldable. Make it an instance field filled in @Setup.
    static final int[] DATA = { 1, 2, 3, 4, 5, 6, 7, 8 };

    // TODO: this discards its result, so the JIT may delete the whole loop.
    @Benchmark
    public void sum() {
        int total = 0;
        for (int v : DATA) total += v;
    }
}

// Q: @Fork(3) runs three separate JVMs. Why is that stronger than @Fork(1),
//    and how do you decide whether two JMH scores are actually different?
// ANSWER:`,
    checks: [
      { re: '@Warmup\\s*\\(', must: true, hint: 'Add @Warmup(iterations = 5, time = 1) so the JIT reaches steady state before anything is measured.', pass: 'warmup configured ✓' },
      { re: '@Measurement\\s*\\(', must: true, hint: 'Add @Measurement(iterations = 5, time = 1) — these are the iterations that count.', pass: 'measurement configured ✓' },
      { re: '@Fork\\s*\\(\\s*[2-9]', must: true, hint: 'Use @Fork(3): several fresh JVMs, so run-to-run variance becomes visible instead of hidden.', pass: 'multiple forks ✓' },
      { re: '@State\\s*\\(\\s*Scope\\.', must: true, hint: 'Add @State(Scope.Thread) so JMH manages the inputs and they cannot be folded.', pass: '@State declared ✓' },
      { re: '@Setup', must: true, hint: 'Build the array in an @Setup(Level.Trial) method rather than as a constant initialiser.', pass: '@Setup fixture ✓' },
      { re: 'static\\s+final\\s+int\\s*\\[\\]', must: false, hint: 'The static final array is still there — a compile-time constant can be folded away, so you would measure nothing.', pass: 'constant input removed ✓' },
      { re: 'public\\s+void\\s+sum\\s*\\(\\s*\\)', must: false, hint: 'sum() still returns void and drops its result, so the JIT can delete the loop. Return the total, or take a Blackhole.', pass: 'no result-dropping void benchmark ✓' },
      { re: 'return\\s+total|bh\\.consume\\s*\\(', must: true, hint: 'Return the total from the @Benchmark method (or consume it with a Blackhole) so the work cannot be eliminated.', pass: 'result is consumed ✓' },
      { re: 'ANSWER\\s*:\\s*\\S+', must: true, hint: 'Answer: one fork shows only within-process variance; the spread BETWEEN forks is the real run-to-run error. And two scores differ only if their ± intervals do not overlap.', pass: 'forks and error bars explained ✓' }
    ],
    run: 'Generate a JMH project with <code>mvn archetype:generate -DinteractiveMode=false -DarchetypeGroupId=org.openjdk.jmh -DarchetypeArtifactId=jmh-java-benchmark-archetype</code>, drop this class in, then <code>mvn clean package &amp;&amp; java -jar target/benchmarks.jar SumBenchmark</code>. Run the broken version first and keep the number: it will be implausibly small, because the loop was deleted. Then run your fixed version and watch the score become a believable few nanoseconds with a stated error. That gap between "implausibly fast" and "believable" is the entire point of the exercise.',
    solution: `import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.infra.Blackhole;
import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@Warmup(iterations = 5, time = 1)          // discarded — lets the JIT reach steady state
@Measurement(iterations = 5, time = 1)     // these count
@Fork(3)                                   // three fresh JVMs; the spread between them is the real error
@State(Scope.Thread)                       // per-thread state: no sharing, no folding
public class SumBenchmark {

    // An ordinary instance field, filled at setup: the optimiser must treat it as unknown.
    int[] data;

    @Param({"8", "1024"})                  // behaviour often flips with size, so sweep it
    int size;

    @Setup(Level.Trial)                    // once per fork, not once per invocation
    public void setup() {
        data = new int[size];
        for (int i = 0; i < size; i++) data[i] = i + 1;
    }

    @Benchmark
    public int sum() {
        int total = 0;
        for (int v : data) total += v;
        return total;                      // RETURNED, so JMH consumes it and the loop survives
    }

    @Benchmark
    public void sumAndMax(Blackhole bh) {  // more than one value? consume each
        int total = 0, max = Integer.MIN_VALUE;
        for (int v : data) { total += v; if (v > max) max = v; }
        bh.consume(total);
        bh.consume(max);
    }
}

// ANSWER: @Fork(1) can only ever show you variance WITHIN one JVM process, but the things that
// most often move a benchmark are per-process: which methods got compiled and at which tier, the
// profile HotSpot gathered and speculated on, heap layout, class-loading order. All of that is
// fixed for the life of a process, so a single fork reports its own luck with a small, confident
// error bar — precise and possibly wrong. Running three independent JVMs, each freshly warmed,
// makes that run-to-run component visible as spread BETWEEN forks, which is the honest error.
//
// Deciding whether two scores differ: compare the intervals, not the means. JMH prints
// score ± error at 99.9% confidence, and if the intervals of the two variants OVERLAP you have
// not demonstrated a difference — a 3% gap with ±5% intervals is noise, not a 3% win. If you need
// to resolve it, gather more data (more iterations and forks) or reduce noise (quiet machine,
// fixed CPU governor, no turbo); if it still will not separate, the difference is too small for
// this instrument and almost certainly too small to matter. And be most sceptical when the result
// is the one you were hoping for.`,
    notes: [
      'Every fix here removes one specific way the JVM invalidates a measurement: @Setup + an instance field defeats constant folding, returning the value defeats dead-code elimination, @Warmup defeats measuring the interpreter, and @Fork(3) exposes run-to-run variance instead of hiding it. They are four different failures, not one.',
      'Run the broken version first — that step matters pedagogically. Seeing a loop over eight integers report a fraction of a nanosecond is what makes dead-code elimination real rather than theoretical, and it teaches the most useful reflex in benchmarking: an implausibly good number is a bug report about your benchmark.',
      'The @Param sweep is worth keeping even though the exercise did not require it. Comparisons frequently cross over with input size, and a single-size benchmark is a technically correct measurement of a question nobody asked.'
    ]
  },
  quiz: [
    {
      q: 'Your hand-written benchmark reports that hashing a 16-character string takes 0.3 ns. What is the most likely explanation?',
      options: ['Dead-code elimination — nothing consumed the result, so the JIT deleted the computation and you timed an empty loop', 'The hash function is genuinely that fast because it is simple', 'The CPU cache made it fast', 'System.nanoTime() is not precise enough to measure it'],
      correct: 0,
      explain: '0.3 ns is faster than a single memory access — the tell that no work happened. Nothing used the result, so the JIT was entitled to remove it. Usopp timed the crew hauling a rope attached to nothing, and Zoro simply stopped pulling. Fix: return the value from the @Benchmark method, or consume it with a Blackhole.'
    },
    {
      q: 'Why does JMH run benchmarks in multiple forked JVMs (@Fork(3)) instead of just doing more iterations in one?',
      options: ['Because JIT compilation decisions, profile data and heap layout are fixed per process — a single JVM reports its own luck with a confident error bar, and only separate processes reveal run-to-run variance', 'Because one JVM cannot run enough iterations to be statistically valid', 'To use multiple CPU cores and finish faster', 'To test that the code works on different JVM versions'],
      correct: 0,
      explain: 'More iterations in one process reduce within-process noise but cannot reveal per-process variance, because that variance is baked in for the life of the process — you get a precise number that may still be wrong. Usopp ran the contest once and declared it final; the next day the ranking was different.'
    },
    {
      q: 'Two JMH benchmarks score 12.1 ± 0.9 ns/op and 11.7 ± 0.8 ns/op. What can you conclude?',
      options: ['Nothing — the intervals overlap, so no difference has been demonstrated; reporting one as faster would be a false claim', 'The second is 3.3% faster and you should adopt it', 'The first is broken because it has a larger error', 'You should average them'],
      correct: 0,
      explain: 'Overlapping intervals mean the measurement cannot separate them. Amy: four seconds ahead, plus or minus eleven, is not a win. Gather more data or reduce noise — and if it still will not separate, the difference is too small for this instrument and almost certainly too small to matter.'
    },
    {
      q: 'Why must benchmark inputs live in an @State object rather than a static final field?',
      options: ['A static final field is a compile-time constant, so the JIT can fold the whole expression to its answer and you measure a field read instead of the work', 'Static fields are not thread-safe', '@State makes the benchmark run faster', 'JMH cannot access static fields'],
      correct: 0,
      explain: 'Constant folding is the input-side mirror of dead-code elimination. Sanji had lifted the identical crate forty times and stopped lifting it — he knew where it went. @State holds non-final fields JMH manages, so the optimiser must treat them as genuinely unknown.'
    },
    {
      q: 'You have a hypothesis that a method is slow. What should you do BEFORE writing a JMH benchmark for it?',
      options: ['Profile the real workload to find out whether that method accounts for meaningful time at all — otherwise you may perfectly optimise 0.1% of runtime', 'Write the benchmark first; profiling is only for production incidents', 'Rewrite the method, then benchmark both versions', 'Increase the heap size and re-measure'],
      correct: 0,
      explain: 'Profile first, then benchmark what the profile named. A microbenchmark answers "which of these two implementations is faster", never "does this matter" — and benchmarking before profiling is one of the most reliable ways to spend a week on something with no effect.'
    }
  ],
  testFlow: {
    title: 'Test yourself: numbers you can actually defend',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A colleague shows you a benchmark proving their new parser is 5% faster. What is the first thing you ask?',
        choices: [
          { text: 'What the error bars are, and how many forks it ran — a 5% gap means nothing if the intervals overlap', to: 'q1_right' },
          { text: 'Whether they ran it on the fastest machine available', to: 'q1_wrong_machine' },
          { text: 'Nothing — 5% is a clear win, ship it', to: 'q1_wrong_ship' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Exactly. A mean without an interval is not a measurement, and 5% is well inside the noise of a badly configured benchmark. Ask for score ± error and the fork count: if the intervals overlap, no difference has been demonstrated, however much both of you want it to have been.' },
      q1_wrong_machine: { end: true, correct: false, text: 'A faster machine gives you faster absolute numbers, not more trustworthy ones — and turbo and frequency scaling on a powerful laptop are themselves a common source of variance. What determines whether the result means anything is the error interval and the number of forks.' },
      q1_wrong_ship: { end: true, correct: false, text: 'A 5% difference is exactly the range where a poorly configured benchmark routinely produces a confident wrong answer — insufficient warmup, one fork, folded inputs. Ask for the interval. If it overlaps, the honest answer is that nothing has been shown yet.' },
      q2: {
        qid: 'q2',
        q: 'Your @Benchmark method is void and computes a value it never uses. What happens?',
        choices: [
          { text: 'The JIT may prove the computation has no observable effect and delete it, so you measure an empty loop — return the value or consume it with a Blackhole', to: 'q2_right' },
          { text: 'JMH detects it and fails the benchmark with an error', to: 'q2_wrong_detect' },
          { text: 'Nothing — JMH prevents all optimisation inside @Benchmark methods', to: 'q2_wrong_prevent' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Right, and the danger is that it fails silently: you get a plausible-looking number rather than an error. Returning the result lets JMH consume it opaquely so the work cannot be removed; for several values take a Blackhole and consume each. Note that assigning to a field is not a reliable substitute, since the JIT can prove the field is never read.' },
      q2_wrong_detect: { end: true, correct: false, text: 'JMH cannot detect this — it has no way to know whether an implausibly fast result means your code is fast or absent. That is precisely why the return-value rule is a rule you must follow rather than a check the tool performs for you.' },
      q2_wrong_prevent: { end: true, correct: false, text: 'JMH does not and could not disable the optimiser — a benchmark of code the JIT was forbidden to optimise would tell you nothing about production, where it certainly will. What JMH does is give you the means (returned values, Blackhole, @State) to keep the optimiser from removing the specific work you are timing.' },
      q3: {
        qid: 'q3',
        q: 'A JMH benchmark shows your new cache lookup is 40% faster, but after deploying it the service is slightly slower. What most likely happened?',
        choices: [
          { text: 'The microbenchmark excluded real effects — extra allocation causing GC pressure, lost cache locality, contention, or the method simply not being on the critical path', to: 'q3_right' },
          { text: 'The JMH result was fabricated', to: 'q3_wrong_fake' },
          { text: 'The service needs a bigger heap', to: 'q3_wrong_heap' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Yes — and this is the most important limitation to internalise. A microbenchmark runs warm, uncontended, cache-hot, with no GC pressure from the rest of the system and no I/O. A version that is genuinely 40% faster in isolation can lose in situ by allocating more, by losing locality it had in context, or by improving something that was never on the critical path. Profile to find what matters, JMH to compare implementations, and an end-to-end load test to decide whether the product actually got faster.' },
      q3_wrong_fake: { end: true, correct: false, text: 'The benchmark can be entirely correct and the deployment still slower — there is no contradiction. The microbenchmark measured the method in isolation; production measured the method inside a system with GC, contention, cache pressure and I/O, which is a different question with a legitimately different answer.' },
      q3_wrong_heap: { end: true, correct: false, text: 'Possibly relevant if the change increased allocation, but that is a guess, and guessing is the habit this whole topic exists to break. Profile the deployed service and find out where the time actually went — the answer is often that the optimised method was never on the critical path.' }
    }
  },
  pitfalls: [
    'Timing a loop with System.nanoTime() and trusting the result. Dead-code elimination, constant folding, missing warmup and run-to-run variance each invalidate it silently, producing a plausible number rather than an error.',
    'Writing a void @Benchmark that computes a value and drops it — the JIT can delete the work. Return the result, or take a Blackhole and consume it. Assigning to a field is not a reliable substitute, since the store can be eliminated too.',
    'Holding benchmark inputs in static final fields or literals. They are compile-time constants and can be folded to an answer, so you measure a field read. Use @State with ordinary non-final fields filled in @Setup.',
    'Reporting a mean without its error interval, or calling a 3% difference a win when the intervals overlap. If they overlap, no difference has been demonstrated — and false performance claims outlive the benchmarks that produced them.',
    'Using @Fork(0) or @Fork(1) for a real comparison. One process bakes in its own JIT decisions and heap layout, so you get a precise number that may still be wrong. The spread between forks is the honest run-to-run error.',
    'Benchmarking before profiling. A microbenchmark tells you which implementation is faster, never whether the method matters — perfectly optimising 0.1% of runtime is a week you do not get back.',
    'Treating a microbenchmark win as a product win. Isolation excludes GC pressure, contention, cache effects and I/O by construction, so confirm end-to-end under realistic load before believing it.',
    'Comparing two arms that are not doing the same work — benchmarking String.hashCode() against a hand-rolled hash without noticing String caches its hash after the first call, so one arm is a field read. Check that both sides genuinely compute the thing.',
    'Benchmarking on a noisy machine: other processes, thermal throttling, CPU frequency scaling and turbo all move results by more than the effects people typically claim to measure. A quiet machine with a fixed governor is part of the instrument.'
  ],
  interview: [
    {
      q: 'Why is microbenchmarking on the JVM notoriously hard, and how does JMH address it?',
      a: 'Because the JVM is an adaptive optimising runtime, so the act of writing a naive benchmark tends to invalidate it, and the failures are silent. Four mechanisms in particular. Dead-code elimination: if the result is never consumed, the JIT can prove the computation has no observable effect and remove it, so you time an empty loop and report a few hundred picoseconds. Constant folding: if the inputs are compile-time constants such as static final fields, the optimiser evaluates the expression once and reuses the answer, so you measure a field read. Missing warmup: HotSpot interprets first, compiles with C1 when a method becomes warm, recompiles with C2 when it becomes hot, and may deoptimise if a speculative assumption fails, so an unwarmed loop averages three different execution modes into a figure describing none of them. And run-to-run variance: profiling decisions, heap layout and class-loading order are fixed per process, so an identical binary can land 10% away on the next run. None of these produce an error message, which is the crux — you get a plausible number that is wrong. JMH, from the OpenJDK team, addresses each: it generates the measurement loop itself and consumes returned values opaquely so work cannot be eliminated; it manages inputs through @State objects with non-final fields the optimiser must treat as unknown; it runs warmup iterations that are discarded so measurement starts at steady state; it runs multiple forked JVMs so per-process luck appears as variance between forks rather than hiding inside one number; and it reports score ± error at a stated confidence rather than a bare mean. The corresponding discipline for the human is to return every result, keep inputs in @State, use several forks, sweep sizes with @Param, and read the interval rather than the mean.'
    },
    {
      q: 'How do you decide whether a performance difference you measured is real?',
      a: 'By comparing intervals rather than means. JMH reports score ± error at a stated confidence level, usually 99.9%, and the rule is that if the two intervals overlap, no difference has been demonstrated — a 3% gap with ±5% intervals is noise, and reporting it as a 3% improvement is how false performance folklore gets started and repeated for years. If I need to resolve a genuinely small difference I have three options: gather more data through more iterations and more forks; reduce the noise by using a quiet machine, pinning the CPU governor and disabling turbo; or accept that the difference is below what this instrument can resolve, which usually also means it is too small to matter in production. Beyond the summary I want to see the per-iteration numbers, because if they were still trending during the final warmup iterations then steady state was never reached and everything after it is suspect, and I want to see the variance between forks specifically, since that is the run-to-run component a single process cannot expose. For latency questions I would use Mode.SampleTime and read percentiles rather than a mean, because a mean is exactly the statistic that conceals a bad tail — a p99 of 40 ms sits comfortably behind a 2 ms average. I also apply a deliberate asymmetry of scepticism: results that flatter the change I want to make get examined hardest, and an implausibly good number — sub-nanosecond times for real work, or a suspiciously large speedup — is treated as a bug report about the benchmark rather than a discovery, usually meaning the work was eliminated or the two arms are not doing the same thing. Finally, a microbenchmark difference is not a product difference, so anything that matters gets confirmed end-to-end under realistic load before I believe it.'
    },
    {
      q: 'When would you NOT reach for a microbenchmark?',
      a: 'Whenever the real question is about a system rather than a method, which is most of the time. A microbenchmark deliberately isolates one piece of code: fully warmed, cache-hot, uncontended, with no GC pressure from the rest of the application and no I/O. Those exclusions are the point — they are what make the measurement precise — but they also mean the result can be true and irrelevant simultaneously. A version 40% faster in JMH can make a service slower because it allocates more and shifts cost into GC, because it lost cache locality it had in its real calling context, because it was never on the critical path so a large improvement to 0.1% of runtime is nothing, or because it saves 200 nanoseconds inside a request that spends 900 milliseconds waiting on a database. So I would not start with a microbenchmark when I do not yet know where the time goes: that is a profiling question, and profiling first is what stops people optimising code that does not matter. I would not use one to answer "is the product faster", which needs an end-to-end load test or production metrics behind a feature flag, because only those include the effects a microbenchmark excludes by construction. And I would not use one for code dominated by I/O or lock contention, where the interesting behaviour only appears under concurrency and realistic latency. The tool selection I would state is: profiler and flame graph for "where does the time go"; JMH for "which of these two implementations of this specific hot method is faster"; load test or production metrics for "did this change help". There is also a link to test discipline worth drawing: a benchmark whose result changes run to run is telling you what a flaky test tells you — that there is an uncontrolled input in the measurement — and forks, adequate warmup, a quiet machine and a pinned governor are the benchmarking equivalents of removing shared mutable state from a test suite.'
    },
    {
      q: 'Explain Blackhole and the return-value rule in JMH.',
      a: 'Both exist to stop the JIT from removing the work you are trying to time. The return-value rule is the simple, primary mechanism: a @Benchmark method should return the result of whatever it computed, because JMH\'s generated harness consumes that returned value in a way the optimiser cannot see through, which means the computation has an observable effect and cannot be eliminated as dead code. A void benchmark that computes something and drops it is the classic broken benchmark, and JMH has no way to detect it — you simply get an implausibly fast number with no warning, which is why this is a discipline rather than a safety net. Blackhole handles the case where one return value is not enough: if your benchmark legitimately produces several values, you take a Blackhole parameter and call bh.consume() on each one. Blackhole is carefully engineered to be opaque to the optimiser while costing only a few nanoseconds itself, which matters because the sink must not dominate what you are measuring. Two things people get wrong. Assigning the result to a field is not a reliable substitute for returning it, because the JIT can prove the field is never read and eliminate the store as well; the harness-consumed return value is the supported mechanism. And Blackhole.consumeCPU(tokens) is an entirely different facility — it burns a controlled amount of CPU time, useful for simulating a workload of a known cost, and is not a way to consume a value. The mirror image of all this is on the input side: values that are compile-time constants can be folded away, so inputs belong in an @State object as ordinary non-final fields, filled in @Setup. Returned or consumed output, @State-managed input — those two habits together are most of what makes a JMH benchmark trustworthy.'
    }
  ]
};
