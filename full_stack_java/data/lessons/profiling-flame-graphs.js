window.LESSONS = window.LESSONS || {};
window.LESSONS['profiling-flame-graphs'] = {
  id: 'profiling-flame-graphs',
  title: 'Profiling for Real: JFR, Mission Control, async-profiler, Flame Graphs & MAT',
  category: 'Part 2 — The JVM, Deeply',
  timeMin: 55,
  summary: 'The previous lesson gave you dumps — snapshots that answer "what is happening right now?". This one gives you profilers, which answer the harder question: "where is the time and the memory actually going, over minutes, under real load?" You will learn JFR (built into the JDK, cheap enough to leave running in production) and JDK Mission Control for reading it; async-profiler and the flame graph, which is the single most useful performance visualisation ever invented and which exists because JFR\'s method sampler has a known blind spot called safepoint bias; and Eclipse MAT with the dominator tree, which turns a heap dump from a list of objects into a direct answer to "what is holding all this memory?" The through-line is a discipline, not a tool: performance intuition is usually wrong, so you measure first, and you measure the thing you actually ship.',
  goals: [
    'Start, dump and stop a Java Flight Recording — with flags at launch and with jcmd on a already-running JVM — and explain why it is cheap enough for production',
    'Read a flame graph correctly: what the width means, what the x-axis does NOT mean, and how to spot a plateau worth fixing',
    'Explain safepoint bias — why a sampler that can only sample at safepoints systematically blames the wrong method, and why async-profiler avoids it',
    'Choose between CPU, wall-clock, allocation and lock profiling modes based on the symptom you are chasing',
    'Use Eclipse MAT\'s dominator tree and retained-vs-shallow heap to name the object that is actually keeping a leak alive'
  ],
  concept: [
    {
      h: 'Dumps answer "now"; profilers answer "over time"',
      p: [
        'A thread dump is a photograph: every thread\'s stack at one instant. That is exactly right for a HANG, where the interesting state is frozen and one photograph contains the answer. It is close to useless for "the service is 30% slower than last release", because a single instant tells you nothing about where the milliseconds go. For that you need many photographs, aggregated — and that is all a <b>sampling profiler</b> is. It interrupts the program hundreds of times a second, records the current stack, and counts. If a method appears in 60% of the samples, that method (or something it calls) is where 60% of your time goes. No instrumentation, no code changes, and the overhead is proportional to the sample rate rather than to how much work your program does.',
        'The alternative, <b>instrumenting profilers</b>, rewrite every method to record entry and exit. They give exact call counts — genuinely useful when you need to know "how many times was this called?" — but they change the thing being measured: the added bytecode blocks inlining, distorts the JIT\'s decisions, and can slow a program by 10x or more. Worse, the distortion is not uniform; small hot methods that would have been inlined suffer most, so an instrumenting profiler will confidently point you at a method that is only expensive <i>because you are profiling it</i>. This is the observer effect, and it is the reason production profiling is essentially all sampling. Rule of thumb: sample for "where does time go", instrument only for "how often is this called", and never trust a benchmark taken under an instrumenting profiler.'
      ]
    },
    {
      h: 'JFR: a flight recorder that ships in your JDK',
      p: [
        '<b>Java Flight Recorder</b> is a profiler and event recorder built into the JVM itself — no agent to install, no extra dependency, and since JDK 11 it is in every OpenJDK build and free for production use. It is not only a method sampler: it is an <i>event</i> stream. The JVM already knows when it collects garbage, when a thread blocks on a monitor, when a socket read takes 40 ms, when a class is loaded, when the heap grows, when a thread parks. JFR writes those events, which it already has, to a ring buffer with startup cost close to nothing — that is why the overhead of the default profile is around 1%, low enough that many teams leave a recording running continuously and dump the last hour when something goes wrong. That last capability is the one to internalise: <code>-XX:StartFlightRecording=maxage=1h,disk=true</code> means the evidence for an incident already exists at the moment you notice the incident.',
        'You start it three ways. At launch: <code>java -XX:StartFlightRecording=duration=60s,filename=app.jfr,settings=profile -jar app.jar</code>. On an already-running JVM, which is the one you will actually use in an incident: <code>jcmd &lt;pid&gt; JFR.start name=diag settings=profile</code>, then <code>jcmd &lt;pid&gt; JFR.dump name=diag filename=diag.jfr</code>, then <code>jcmd &lt;pid&gt; JFR.stop name=diag</code>. And programmatically via <code>jdk.jfr.Recording</code> when you want a recording tied to a specific operation. The <code>settings</code> parameter matters: <code>default</code> is the ~1% production profile, <code>profile</code> raises the sampling rate and enables more events for maybe 2–3% — use <code>profile</code> when you are actively diagnosing, <code>default</code> when you are leaving it on. Then open the file in <b>JDK Mission Control</b> (JMC), a free desktop app whose Automated Analysis page is genuinely worth reading first: it scores the recording against dozens of known problems — GC pressure, lock contention, excessive allocation, primitive-to-String conversion in a hot path — and tells you in English what it found before you look at a single graph.'
      ]
    },
    {
      h: 'Safepoint bias: why JFR is not the whole story',
      p: [
        'Here is the subtlety that explains why a second profiler exists at all. To walk a thread\'s stack safely, the JVM has traditionally needed that thread to be at a <b>safepoint</b> — a point in the compiled code where the thread\'s state is fully described and consistent, so the runtime can inspect it without racing the mutator. The JIT inserts safepoint polls at method returns and at the back edges of loops, but it deliberately <i>omits</i> them where it can prove they are unnecessary: a counted loop over an <code>int</code> range gets no poll inside it, because the compiler knows it terminates. So a thread spinning inside a tight, hot, JIT-optimised loop can be un-pollable for a long stretch — and a profiler that can only sample at safepoints cannot see it there. It must wait until the thread reaches the next poll, which is usually <i>after</i> the hot loop, in the caller.',
        'The consequence is not random noise; it is a systematic lie. The very code that is hottest — tight loops the JIT optimised hard — is the code most likely to be invisible, and the samples get attributed to whatever method happened to contain the next safepoint. This is <b>safepoint bias</b>, and it is why a safepoint-biased profiler can report a method that is genuinely not the problem while the real culprit never appears. It also explains a frustrating experience many people have had: two profilers disagreeing about the same program. <b>async-profiler</b> exists to solve exactly this. It uses <code>AsyncGetCallTrace</code>, an internal HotSpot API callable from a signal handler, so it can walk the stack of a thread wherever that thread happens to be — no safepoint required. Modern JFR has improved substantially here (JDK 21+ added a much better CPU-time sampler), but async-profiler remains the tool to reach for when you suspect the profile is lying to you, and it is the standard way to produce a flame graph.'
      ]
    },
    {
      h: 'The flame graph: read the width, ignore the x-axis',
      p: [
        'A <b>flame graph</b> (Brendan Gregg\'s invention) renders thousands of stack samples as one picture. Each box is a stack frame. A box sitting on top of another means "was called by" — so the y-axis is stack depth, ground floor at the bottom, and reading upward follows the call chain. The <b>width of a box is the fraction of samples in which that frame was on the stack</b>, which is to say the fraction of time spent in that method <i>including everything it called</i>. That is the whole reading protocol: <i>wide means expensive</i>. Scan the picture horizontally for the widest boxes; ignore tall thin towers, which are deep call chains that cost nothing.',
        'The mistake almost everyone makes on first contact: <b>the x-axis is not time.</b> It carries no chronology whatsoever. Frames are merged and sorted alphabetically so that identical stacks stack up into one wide box — a flame graph of a program that spent its first half in A and its second half in B looks identical to one that alternated between them thousandfold. If you want chronology, you want a timeline view (JMC has one) or a "flame chart", which is a different visualisation with the same colours. Two more practical notes. Colours are usually meaningless — random hues to help your eye separate adjacent boxes — unless the tool documents otherwise, though async-profiler can colour by frame type (green Java, yellow C++, red kernel), which instantly reveals a program spending its life in syscalls. And the highest-value variant is the <b>differential flame graph</b>: profile before and after, then render the delta so that only what changed is coloured. When a release got slower and you have no idea why, that picture usually just tells you.',
        'What you are hunting is a <b>plateau</b>: a wide box with relatively little on top of it. That shape means the method is spending time in <i>itself</i>, not in its callees — the actual work is happening right there, and that is where an optimisation lands. A wide box with a wide tower above it is merely a method whose children are expensive; fixing it means looking further up. Sanity-check what you find against the code before you act: the second most common profiling error, after trusting intuition instead of measuring, is optimising a method that is wide because it is <i>supposed</i> to be wide.'
      ]
    },
    {
      h: 'Profile the right dimension: CPU, wall, allocation, locks',
      p: [
        'A CPU profile answers "which code is burning processor". If your service is pegged at 100% CPU, that is the profile you want. But an enormous class of real performance problems involve threads that are not burning CPU at all — they are waiting on a database, a lock, a downstream HTTP call. A CPU profile of a request that spends 900 ms waiting on JDBC and 10 ms computing will barely mention the database, because waiting is not CPU. For that you want a <b>wall-clock profile</b> (<code>async-profiler -e wall</code>), which samples all threads regardless of whether they are running, and which will show that 900 ms plateau immediately. Choosing the wrong dimension here is the single most common reason a profile "shows nothing".',
        'Two more dimensions worth knowing. <b>Allocation profiling</b> (<code>-e alloc</code>, or JFR\'s allocation events) attributes bytes allocated to the stack that allocated them; since the direct cost of allocation in Java is small but the GC pressure it creates is not, an allocation flame graph is how you find the innocuous-looking method quietly producing two gigabytes of short-lived garbage per minute. This is usually a much better lever than tuning GC flags. And <b>lock profiling</b> (<code>-e lock</code>, or JFR\'s <code>JavaMonitorEnter</code> events) attributes contended-lock wait time to the stacks that waited, which finds the synchronised block that is serialising your throughput — the thing a thread dump only shows you if you happen to snapshot at the right instant. The habit: name the symptom first (pegged CPU / slow but idle / GC churn / does not scale with cores), and let that choose the mode. Typical invocation once you know: <code>./asprof -d 30 -e cpu -f flame.html &lt;pid&gt;</code> produces an interactive HTML flame graph you can open straight in a browser.'
      ]
    },
    {
      h: 'Eclipse MAT: shallow, retained, and the dominator tree',
      p: [
        'A heap dump (<code>jmap -dump:live,format=b,file=heap.hprof &lt;pid&gt;</code>, or better <code>-XX:+HeapDumpOnOutOfMemoryError</code> so it happens automatically at the moment of failure) is a complete snapshot of every object. Opened naively it is a list of millions of objects sorted by size, which tells you that you have a lot of <code>char[]</code> and <code>HashMap$Node</code> — true of every Java heap ever taken, and useless. <b>Eclipse MAT</b> (Memory Analyzer Tool) is the standard way to turn that into an answer, and the reason is two concepts. <b>Shallow heap</b> is the memory an object occupies by itself: a <code>HashMap</code> with a million entries has a shallow size of a few dozen bytes. <b>Retained heap</b> is the memory that would be freed if that object were garbage collected — everything reachable only through it. That million-entry map might retain 800 MB. Shallow size finds nothing; retained size finds leaks.',
        'The <b>dominator tree</b> is retained size made navigable. Object A <i>dominates</i> B if every path from a GC root to B goes through A — meaning if A dies, B necessarily dies too. Sorting the dominator tree by retained heap therefore ranks objects by "how much memory disappears if I get rid of this one thing", which is precisely the question you are asking during a leak investigation. Nine times out of ten the answer is at the top of that list and is something like a static <code>HashMap</code> used as a cache with no eviction, a <code>ThreadLocal</code> never removed on a pooled thread, or a listener list nobody unregisters from. MAT\'s <b>Leak Suspects</b> report runs this analysis automatically and usually names the culprit on the first screen. When it does not, the two tools to reach for are <b>Path to GC Roots</b> (select the object that should have been collected, exclude weak/soft references, and MAT shows you the exact chain of strong references keeping it alive — the answer to "why is this still here?") and the <b>histogram compared against a second dump</b> taken minutes later, where a class whose instance count only ever grows is your leak. That progression — dump on OOM, open in MAT, read Leak Suspects, confirm with Path to GC Roots — is a complete, repeatable procedure for a class of bug that otherwise eats days.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Sunny is slow, and everybody has a theory',
      text: 'The Thousand Sunny is running slower than she should, and the crew does what crews do: they guess. Usopp is certain it is the new sail. Nami blames the current. Zoro suspects, without evidence, the cook. Franky refuses to join in, because Franky has built this ship and knows that a shipwright who guesses is a shipwright who rebuilds the wrong thing. Instead he does something almost boring: two hundred times a minute, he glances up and writes down exactly what every single crew member is doing at that instant. Not what they say they are doing. What they are doing. After ten minutes he has thousands of these snapshots, and when he stacks them up the picture is not ambiguous at all — it is a wide, embarrassing plateau labelled GALLEY, and standing in the middle of it is Luffy, who has been eating in sixty percent of every observation taken. The new sail appears in one percent. The current does not appear at all. Nobody had to argue; the width of the bar settled it (a sampling profiler: interrupt often, record the stack, count — and the widest box is where the time went). And Franky is careful about one thing, because he learned it the hard way on an earlier voyage: he does not only take his observations at mealtimes. When he tried that, everyone he counted was conveniently sitting at the table, and the crewmate frantically bailing water in the hold — the one actually costing them speed — never appeared in a single snapshot, because that crewmate never came to a meal. Sampling only where it is convenient to sample does not give you a quieter picture; it gives you a confidently wrong one (safepoint bias: a thread spinning in a tight JIT-compiled loop never reaches a safepoint poll, so a safepoint-limited profiler blames whatever method it can see instead — which is why async-profiler walks the stack from a signal handler, wherever the thread happens to be). Then the second mystery: the ship sits low in the water and nobody knows what is aboard. The cargo manifest by item size is useless — of course there are a lot of planks. What Robin asks instead is the right question: if I throw this one crate overboard, how much goes with it? Most crates, nothing. But one small, unremarkable box turns out to be tied to a rope that is tied to everything, and cutting it free lightens the ship by half (retained heap and the dominator tree: shallow size finds nothing, but "what dies if this dies" names the leak on the first screen).',
    },
    sitcom: {
      show: 'Friends',
      title: 'Why does it take this group forty-five minutes to leave an apartment?',
      text: 'Getting the six of them out the door takes forty-five minutes, every single time, and everyone has a confident theory about whose fault it is. The theories all converge on Chandler, because Chandler is the loudest, and loud feels expensive. So Ross — who has at least this much of a scientist in him — does the only thing that settles it: every ten seconds, he writes down what each person is actually doing. Not the vibe. The activity. Two hundred and seventy observations later the answer is a plateau you could see from space: Rachel, at the mirror, in seventy percent of the samples. Chandler appears in four percent, all of them jokes made while already wearing his coat. The loud thing was never the slow thing, which is the entire reason you profile instead of arguing (the bottleneck is almost never where intuition puts it; width settles it). But Ross nearly got this wrong in a way worth remembering: his first attempt only counted people when they passed through the living room, because that was the convenient place to stand. That method produced a beautiful, useless dataset in which Rachel — who never left the bedroom — did not appear at all, and Joey, who wandered through constantly on his way to the fridge, looked like the bottleneck. Sampling only where sampling is easy does not give you a slightly blurrier answer; it gives you a different, wrong one (safepoint bias, exactly). And there is a memory beat too, in Monica\'s closet: by item size, nothing in that apartment is remarkable — a box here, a bag there. The question that actually explains why the place is full is Ross\'s: if this one thing goes, what goes with it? Almost everything is independent and costs nothing. But there is one door which, if you get rid of what is behind it, empties a third of the apartment — and Monica knows exactly which door that is, and will not let you open it (the dominator tree: rank objects by what dies with them, and the leak is at the top of the list).',
    },
    why: 'Franky counting what the crew is ACTUALLY doing, two hundred times a minute, is a sampling profiler: the widest bar — Luffy in the galley at 60% — is where the time goes, and no one has to argue about the sail. The x-axis of that picture is not time; the width is. Franky refusing to sample only at mealtimes IS safepoint bias: a thread spinning in a tight JIT-compiled loop never reaches a safepoint poll, so a safepoint-limited sampler blames whatever it can see instead, and async-profiler walks the stack from a signal handler to avoid it. Ross counting only the living room is the same mistake in an apartment. And the ship sitting low with an unreadable manifest is a heap dump: sorting by item size finds char[] and tells you nothing, but asking "what goes overboard with this?" — retained heap, the dominator tree — names the one small crate holding everything else.'
  },
  storyAnim: {
    title: 'From "everyone has a theory" to the one wide bar',
    h: 300,
    props: [
      { id: 'guess', emoji: '🗣️', label: 'Everyone guesses: the sail, the current, the cook', x: 12, y: 12 },
      { id: 'sample', emoji: '📸', label: 'Sample the stack hundreds of times a second', x: 46, y: 12 },
      { id: 'flame', emoji: '🔥', label: 'Stack the samples: width = share of time', x: 80, y: 12 },
      { id: 'plateau', emoji: '🍖', label: 'The plateau: 60% in the galley', x: 20, y: 46 },
      { id: 'safepoint', emoji: '🚪', label: 'Sampling only at mealtimes = safepoint bias', x: 54, y: 46 },
      { id: 'async', emoji: '⚡', label: 'async-profiler: sample wherever the thread is', x: 86, y: 46 },
      { id: 'wall', emoji: '⏳', label: 'Waiting on JDBC burns no CPU — profile wall-clock', x: 28, y: 80 },
      { id: 'dominator', emoji: '📦', label: 'Heap: what dies if THIS dies? (retained heap)', x: 74, y: 80 }
    ],
    actors: [
      { id: 'franky', emoji: '🤖', label: 'Franky', x: 12, y: 30 }
    ],
    steps: [
      { c: 'The Sunny is slow. Usopp blames the sail, Nami the current, Zoro the cook. Every theory is confident and none is evidence.', p: { guess: 'bad' }, a: { franky: [12, 30] } },
      { c: 'Franky does the boring thing instead: two hundred times a minute he records what every crewmate is ACTUALLY doing. That is a sampling profiler.', p: { sample: 'lit' }, a: { franky: [46, 30] } },
      { c: 'Stack thousands of those snapshots and identical ones merge into one wide box. Width = share of samples = share of time. The x-axis means nothing at all.', p: { flame: 'good' } },
      { c: 'The answer is a plateau, not an argument: GALLEY, 60%, Luffy. The sail is 1%. The current never appears.', p: { plateau: 'good' } },
      { c: 'But an earlier voyage taught Franky the trap: sample only at mealtimes and you only ever see people at the table. The crewmate bailing water in the hold never shows up.', p: { safepoint: 'bad' } },
      { c: 'That is safepoint bias — a thread in a tight JIT-compiled loop never reaches a safepoint poll, so the samples get blamed on the caller instead.', p: { safepoint: 'bad' } },
      { c: 'async-profiler walks the stack from a signal handler, wherever the thread happens to be. No safepoint needed, no systematic lie.', p: { async: 'good' } },
      { c: 'And pick the right dimension: a request waiting 900 ms on the database burns no CPU, so a CPU profile shows nothing. Use wall-clock.', p: { wall: 'lit' } },
      { c: 'For memory, sorting the manifest by item size finds planks. Ask instead what goes overboard WITH this crate — retained heap, the dominator tree — and the leak is the top row.', p: { dominator: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'A slow service, from symptom to fix, without guessing',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Name the symptom',
        nodes: [
          { id: 'symptom', text: 'p99 latency doubled\nCPU is only at 20%' },
          { id: 'dimension', text: 'idle but slow → wall-clock\nnot a CPU profile' }
        ]
      },
      {
        label: 'Record',
        nodes: [
          { id: 'jfr', text: 'jcmd <pid> JFR.start\nsettings=profile' },
          { id: 'async', text: 'or asprof -e wall -d 30\nno safepoint bias' }
        ]
      },
      {
        label: 'Read',
        nodes: [
          { id: 'width', text: 'widest box = most samples\nx-axis is NOT time' },
          { id: 'plateau', text: 'wide with little on top\n= the work is HERE' }
        ]
      },
      {
        label: 'Confirm and fix',
        nodes: [
          { id: 'code', text: 'read the code under the plateau\nis it wide because it should be?' },
          { id: 'diff', text: 're-profile after the fix\ndifferential flame graph' }
        ]
      }
    ],
    steps: [
      { active: ['symptom'], note: 'The symptom first, always. p99 latency doubled but CPU sits at 20% — that combination already rules things out. Something is WAITING, not computing.' },
      { active: ['dimension'], note: 'So a CPU profile would show almost nothing: waiting on a socket or a lock burns no processor. Choosing the wrong dimension is the commonest reason a profile "shows nothing". Wall-clock samples all threads whether they run or not.' },
      { active: ['jfr'], note: 'Record on the live process — jcmd <pid> JFR.start name=diag settings=profile, then JFR.dump. Nothing to install, ~2% overhead, and if maxage was set at launch the last hour already exists.' },
      { active: ['async'], note: 'Or attach async-profiler for a flame graph directly: asprof -d 30 -e wall -f flame.html <pid>. It samples from a signal handler rather than at safepoints, so tight JIT-compiled loops are not invisible to it.' },
      { active: ['width'], note: 'Read the picture by width only. A box\'s width is the fraction of samples containing that frame — its share of time, including callees. Tall thin towers are deep but cheap. The horizontal position carries no meaning: frames are sorted alphabetically, not chronologically.' },
      { active: ['plateau'], note: 'Hunt for a plateau: wide, with little stacked on top. That shape means the time is being spent IN that method rather than in what it calls — which is exactly where an optimisation would land.' },
      { active: ['code'], note: 'Now go read the code under the plateau before changing anything. Some methods are wide because they are supposed to be. Optimising one of those is the second commonest profiling mistake, right after not profiling at all.' },
      { active: ['diff'], note: 'Fix, then re-profile and compare. A differential flame graph colours only what changed, which both proves the fix worked and catches the case where you moved the cost somewhere else instead of removing it.' }
    ]
  },
  tech: [
    {
      q: 'What is Java Flight Recorder, how do you use it, and why is it safe in production?',
      a: 'JFR is an event recorder and profiler built into the HotSpot JVM itself — no agent, no dependency, included in every OpenJDK build since JDK 11 and free for production use. Its cheapness comes from what it records: the JVM already knows internally when it collects garbage, when a thread blocks on a monitor, when a class loads, when a socket read is slow, when the heap resizes. JFR writes those existing events into a fixed-size ring buffer, so the marginal cost is buffer writes rather than new instrumentation, which is why the default settings profile costs roughly 1% and the heavier "profile" settings roughly 2-3%. Three ways to start it. At launch: java -XX:StartFlightRecording=duration=60s,filename=app.jfr,settings=profile -jar app.jar. On a running JVM, which is what you use during an incident: jcmd <pid> JFR.start name=diag settings=profile, then jcmd <pid> JFR.dump name=diag filename=diag.jfr, then jcmd <pid> JFR.stop name=diag. Programmatically via the jdk.jfr.Recording API when you want a recording scoped to one operation. The single most valuable configuration is a continuous recording with a bounded age — -XX:StartFlightRecording=maxage=1h,disk=true — because it means that when an incident happens, the evidence for the hour leading up to it already exists and you only have to dump it. You then read the .jfr file in JDK Mission Control, whose Automated Analysis page scores the recording against dozens of known pathologies (GC pressure, lock contention, excessive allocation, long safepoint pauses) and describes what it found in plain English before you look at a single graph. Start there; it is right often enough to save you the graphs entirely.'
    },
    {
      q: 'Explain safepoint bias, and why async-profiler exists.',
      a: 'To walk a Java thread\'s stack, the JVM has traditionally needed the thread to be at a safepoint: a point in the generated code where the thread\'s state is fully described by metadata the runtime can read, so the stack can be inspected without racing the running code. The JIT inserts safepoint polls at method returns and loop back edges, but it deliberately omits them where it can prove they are not needed — most importantly inside counted int loops, whose termination it can prove. The result is that a thread executing a tight, hot, heavily optimised loop can go a long time without reaching any poll. A profiler restricted to safepoints therefore cannot observe that thread inside the loop; it observes it at the next poll, typically after the loop, in the caller. Crucially the error is not noise that averages out — it is systematic, and it is biased against exactly the code you care about, since the hottest loops are the ones the JIT optimises hardest and thus the ones least likely to carry a poll. You get a profile that confidently names a method which is not the problem, while the real hot loop never appears; and it explains the common experience of two profilers disagreeing about the same program. async-profiler solves this by using AsyncGetCallTrace, an internal HotSpot entry point that is safe to call from a POSIX signal handler. It arms a timer that delivers a signal (SIGPROF for CPU time, or a perf event), and in the handler it walks the stack of whichever thread was interrupted, wherever that thread happens to be — no safepoint required, so no bias. It also reaches below Java: with perf events it can attribute time to native and kernel frames, which is how you discover a program that is really spending its life in syscalls or in a JNI library. Modern JFR has closed much of this gap (JDK 21 added a substantially better CPU-time sampler), but async-profiler remains the tool to reach for when you suspect a profile is lying, and it is the standard way to produce a flame graph.'
    },
    {
      q: 'How do you read a flame graph? What do the axes mean?',
      a: 'A flame graph aggregates thousands of stack samples into a single picture. Each box is a frame; a box resting on another means it was called by the one beneath, so the vertical axis is stack depth with the entry point at the bottom, and reading upward follows the call chain. The horizontal axis is the important one, and it is the one people get wrong: the WIDTH of a box is the fraction of samples in which that frame was present on the stack — its share of time, inclusive of everything it called. The horizontal POSITION means nothing. Frames are merged and sorted alphabetically so identical stacks coalesce into single wide boxes; there is no chronology on the x-axis at all, and a program that ran A then B produces an identical graph to one that alternated between them a thousand times. If you need chronology you want a timeline view or a flame chart, which is a different visualisation. So the reading protocol is: scan horizontally for wide boxes, ignore tall thin towers (deep call chains that cost nothing), and specifically hunt for a plateau — a wide box with little stacked above it, meaning the time is spent in that frame itself rather than in its callees, which is where an optimisation actually lands. Colours are normally random, chosen only to help the eye separate neighbours, though async-profiler can colour by frame type (green Java, yellow C++, red kernel), which immediately reveals a program dominated by syscalls. The highest-value variant is the differential flame graph: profile before and after a change and render the delta, so only what got worse or better is coloured — the fastest way to answer "why did this release get slower?" Finally, always read the code under a plateau before optimising it; some methods are wide because they are supposed to be, and optimising one of those is the second most common profiling mistake after not profiling at all.'
    },
    {
      q: 'When would a CPU profile mislead you, and what do you use instead?',
      a: 'A CPU profile answers exactly one question: which code is burning processor time. That is the right question when a service is pegged at or near 100% CPU. It is the wrong question for a very large class of real problems, because most latency in a typical server application is not CPU at all — it is waiting: on a database round trip, on a downstream HTTP call, on a contended lock, on disk. A request that spends 900 ms blocked in JDBC and 10 ms computing contributes almost nothing to a CPU profile, so the profile will look flat and healthy while your p99 is terrible. This is the commonest reason people say "I profiled it and it showed nothing". The fix is to profile the dimension that matches the symptom. Wall-clock profiling (async-profiler -e wall) samples all threads regardless of whether they are on-CPU, so blocked time appears at full width and that 900 ms JDBC plateau is immediately visible; it is the right default for latency investigations in request-serving code. Allocation profiling (-e alloc, or JFR allocation events) attributes allocated bytes to the stacks that allocated them — valuable because the direct cost of a Java allocation is small but the GC pressure from a method quietly producing gigabytes of short-lived garbage is not, and fixing the allocation site is almost always a better lever than tuning GC flags. Lock profiling (-e lock, or JFR JavaMonitorEnter events) attributes contended monitor wait time to the stacks that waited, which finds the synchronized block serialising your throughput — something a thread dump only catches if you happen to snapshot at the right instant. The discipline is to name the symptom first — pegged CPU, slow but idle, GC churn, throughput that will not scale with cores — and let the symptom choose the mode, rather than reflexively taking a CPU profile and concluding there is nothing there.'
    },
    {
      q: 'Explain shallow heap, retained heap and the dominator tree, and how you actually find a leak with MAT.',
      a: 'Shallow heap is the memory an object occupies by itself: its header plus its fields, with references counted as references rather than as what they point to. A HashMap holding a million entries has a shallow size of a few dozen bytes, which is why sorting a heap dump by shallow size is useless — it tells you that you have a lot of char[] and HashMap$Node, which is true of every Java heap ever captured. Retained heap is the useful measure: the total memory that would be freed if this object were garbage collected, that is, the object plus everything reachable ONLY through it. That million-entry map might retain 800 MB. The dominator tree makes retained size navigable: object A dominates object B if every path from any GC root to B passes through A, which means that if A becomes unreachable, B necessarily does too. So sorting the dominator tree by retained heap ranks objects by exactly the question a leak investigation is asking — "how much memory disappears if I get rid of this one thing?" — and the answer is usually in the top few rows. The practical procedure: run with -XX:+HeapDumpOnOutOfMemoryError so a dump is captured automatically at the moment of failure (or take one deliberately with jmap -dump:live,format=b,file=heap.hprof <pid>, remembering that this pauses the JVM and produces a file the size of your heap); open it in Eclipse MAT; read the Leak Suspects report first, since MAT runs the dominator analysis itself and usually names the culprit on the first screen. When it does not, use Path to GC Roots on an object that should have been collected, excluding weak and soft references, and MAT shows the exact chain of strong references keeping it alive — the direct answer to "why is this still here?". For a slow leak rather than a sudden OOM, take two dumps some minutes apart and compare histograms: a class whose instance count only ever grows is your leak. The usual culprits are worth memorising because they recur endlessly: a static Map used as a cache with no eviction policy, a ThreadLocal never removed on a pooled thread (so it lives as long as the pool), a listener or callback registered and never unregistered, and an inner class holding an implicit reference to an outer object that should have died.'
    }
  ],
  code: {
    title: 'Make a bottleneck, then let the profile find it',
    intro: 'The fastest way to trust a profiler is to hide a bottleneck from yourself and watch the tool point at it. This program does two jobs. One is genuinely expensive but looks innocent; the other looks expensive but is not. Guess before you run it, then record and compare your guess to the plateau — that gap is the entire argument for profiling.',
    code: `import java.util.*;

public class Indexer {

    // Looks heavy: lots of maths, a big loop, a scary name.
    // It is actually fine — the JIT compiles this to a handful of instructions per iteration.
    static double scoreAll(int n) {
        double acc = 0;
        for (int i = 0; i < n; i++) acc += Math.sqrt(i) * 1.000001;
        return acc;
    }

    // Looks innocent: "just building a string". This is the bottleneck.
    // += on String in a loop is O(n^2) copying, and it allocates a new char[] every pass.
    static String buildIndex(List<String> words) {
        String out = "";
        for (String w : words) out += w + ";";   // <-- quadratic, and a garbage fountain
        return out;
    }

    public static void main(String[] args) {
        List<String> words = new ArrayList<>();
        for (int i = 0; i < 20_000; i++) words.add("entry" + i);

        long t0 = System.nanoTime();
        double s = scoreAll(20_000_000);
        long t1 = System.nanoTime();
        String idx = buildIndex(words);
        long t2 = System.nanoTime();

        System.out.printf("scoreAll   %6d ms  (result %.2f)%n", (t1 - t0) / 1_000_000, s);
        System.out.printf("buildIndex %6d ms  (length %d)%n", (t2 - t1) / 1_000_000, idx.length());
    }
}

/* Record it with JFR — no install needed:
     javac Indexer.java
     java -XX:StartFlightRecording=duration=30s,filename=indexer.jfr,settings=profile Indexer

   Then either open indexer.jfr in JDK Mission Control (read Automated Analysis first),
   or print the hot methods straight from the command line with the bundled jfr tool:
     jfr summary indexer.jfr
     jfr print --events jdk.ExecutionSample indexer.jfr | grep "at " | sort | uniq -c | sort -rn | head

   For a flame graph instead, with async-profiler attached to the running PID:
     ./asprof -d 20 -e cpu -f flame.html <pid>      # where CPU goes
     ./asprof -d 20 -e alloc -f alloc.html <pid>    # who is allocating (this is the revealing one)

   What you will see: scoreAll costs real time but is a narrow, flat box — the JIT did its job.
   buildIndex is the wide plateau, and in the ALLOCATION profile it is overwhelming, because every
   += copies the whole accumulated string again. Fix: StringBuilder, one buffer, appended in place. */`,
    notes: [
      'Guess first, then measure — the point of the exercise is the gap between the two. scoreAll has every surface feature of expensive code (big loop, floating-point maths) and is cheap; buildIndex reads like bookkeeping and is quadratic. Intuition reliably picks the wrong one, which is why the profile exists.',
      'Compare the CPU profile with the allocation profile on the same run. buildIndex is wide in both, but it is overwhelming in the allocation one, because each += allocates a fresh char[] holding a copy of everything so far. Allocation profiles find a whole class of problem that CPU profiles only hint at.',
      'You do not need any third-party tool to get started: jfr summary and jfr print ship with the JDK and will name the hot methods from the command line. Reach for async-profiler when you want a flame graph, when you need wall-clock or native frames, or when you suspect safepoint bias.',
      'Swap the += for a StringBuilder and re-record. The plateau should vanish rather than move — if it merely moves, you relocated the cost instead of removing it, which is exactly what a differential flame graph is for.'
    ]
  },
  lab: {
    title: 'Kill the plateau: profile, fix, and prove the fix',
    prompt: 'Take the quadratic index builder and do the full loop on it. (1) Write the exact JFR command that records the program with the profiling settings — it must contain <code>-XX:StartFlightRecording</code> and name a <code>filename=</code>. (2) Write the <code>jcmd</code> form too, for the case where the JVM is already running and you cannot restart it. (3) Rewrite <code>buildIndex</code> with a <code>StringBuilder</code> so it is linear and allocates one buffer instead of one per element. (4) Answer, in the ANSWER comment, why the horizontal position of a box in a flame graph tells you nothing, and what the width does tell you.',
    starter: `import java.util.*;

// 1) The launch-time recording command (must include -XX:StartFlightRecording and filename=):
//    java ...

// 2) The same thing on an already-running JVM, using jcmd (start, then dump):
//    jcmd ...

public class Indexer {

    static String buildIndex(List<String> words) {
        String out = "";
        for (String w : words) out += w + ";";   // quadratic — replace with StringBuilder
        return out;
    }

    public static void main(String[] args) {
        List<String> words = new ArrayList<>();
        for (int i = 0; i < 20_000; i++) words.add("entry" + i);
        long t0 = System.nanoTime();
        String idx = buildIndex(words);
        System.out.printf("buildIndex %d ms (length %d)%n",
                          (System.nanoTime() - t0) / 1_000_000, idx.length());
    }
}

// Q: In a flame graph, why does the horizontal POSITION of a box carry no meaning,
//    and what exactly does its WIDTH represent?
// ANSWER:`,
    checks: [
      { re: '-XX:StartFlightRecording', must: true, hint: 'The launch-time form is java -XX:StartFlightRecording=duration=30s,filename=app.jfr,settings=profile Indexer', pass: 'JFR launch flag ✓' },
      { re: 'filename\\s*=', must: true, hint: 'The recording needs somewhere to go: filename=indexer.jfr', pass: 'names an output file ✓' },
      { re: 'jcmd[\\s\\S]*JFR\\.start', must: true, hint: 'On a live JVM: jcmd <pid> JFR.start name=diag settings=profile', pass: 'jcmd JFR.start ✓' },
      { re: 'JFR\\.dump', must: true, hint: 'Starting a recording does not write it — you still need jcmd <pid> JFR.dump name=diag filename=diag.jfr', pass: 'remembers JFR.dump ✓' },
      { re: 'StringBuilder', must: true, hint: 'Replace the String += accumulation with a StringBuilder.', pass: 'uses StringBuilder ✓' },
      { re: '\\.append\\s*\\(', must: true, hint: 'Append into the builder inside the loop instead of concatenating.', pass: 'appends in the loop ✓' },
      { re: 'out\\s*\\+=', must: false, hint: 'The quadratic out += w + ";" is still there — that is the plateau you are removing.', pass: 'quadratic concat gone ✓' },
      { re: 'ANSWER\\s*:\\s*\\S+', must: true, hint: 'Answer: frames are merged and sorted alphabetically, so the x-axis carries no chronology at all — only the width is meaningful, and it is the fraction of samples containing that frame, i.e. its share of time including everything it called.', pass: 'flame graph axes explained ✓' }
    ],
    run: 'Save as <code>Indexer.java</code>, then <code>javac Indexer.java</code> and run it once before your change and once after — the wall-clock printout alone should drop by orders of magnitude. To see it as a profile rather than a number, record both runs with the JFR command you wrote and compare the hot methods with <code>jfr print --events jdk.ExecutionSample indexer.jfr | grep "at " | sort | uniq -c | sort -rn | head</code>. The goal is that <code>buildIndex</code> disappears from the top of that list rather than merely moving down it.',
    solution: `import java.util.*;

// 1) Launch-time recording:
//    java -XX:StartFlightRecording=duration=30s,filename=indexer.jfr,settings=profile Indexer
//
//    Leave one running continuously in production instead, so the evidence
//    already exists when an incident starts:
//    java -XX:StartFlightRecording=maxage=1h,disk=true,filename=rolling.jfr -jar app.jar

// 2) On an already-running JVM (the incident case — you cannot restart it):
//    jcmd <pid> JFR.start name=diag settings=profile
//    jcmd <pid> JFR.dump  name=diag filename=diag.jfr
//    jcmd <pid> JFR.stop  name=diag

public class Indexer {

    static String buildIndex(List<String> words) {
        // One buffer, appended in place: linear time, and a single allocation that
        // grows geometrically instead of one fresh char[] copy per element.
        StringBuilder sb = new StringBuilder(words.size() * 8);
        for (String w : words) sb.append(w).append(';');
        return sb.toString();
    }

    public static void main(String[] args) {
        List<String> words = new ArrayList<>();
        for (int i = 0; i < 20_000; i++) words.add("entry" + i);
        long t0 = System.nanoTime();
        String idx = buildIndex(words);
        System.out.printf("buildIndex %d ms (length %d)%n",
                          (System.nanoTime() - t0) / 1_000_000, idx.length());
    }
}

// ANSWER: The horizontal position carries no meaning because a flame graph is not a timeline.
// Identical stacks are merged so they coalesce into one box, and siblings are sorted
// alphabetically purely so the layout is stable between runs — a program that ran A then B
// produces exactly the same picture as one that alternated between them a thousand times.
// (If you want chronology you need a timeline view or a flame chart, which is a different
// visualisation.) The WIDTH is the only quantitative axis: it is the fraction of collected
// samples in which that frame was on the stack, i.e. that method's share of time INCLUDING
// everything it called. So you read a flame graph by scanning horizontally for wide boxes and
// ignoring tall thin towers, and what you are hunting is a plateau — a wide box with little on
// top of it — because that shape means the time is being spent in that frame itself rather than
// in its callees, which is where an optimisation actually lands.`,
    notes: [
      'Both recording forms matter for different days. The launch flag is what you configure once and forget — especially the maxage=1h rolling variant, which means an incident at 3am already has its own evidence. The jcmd form is what you type during the incident, on a process you must not restart because restarting destroys the state you are trying to explain.',
      'The StringBuilder fix is linear rather than quadratic AND allocates far less: String += builds a whole new character array containing everything accumulated so far, on every single iteration. That is why this shows up dramatically in an allocation profile, not just a CPU one.',
      'Re-profile after the fix rather than trusting the wall-clock number. The failure mode a differential flame graph catches is a "fix" that moves cost somewhere else instead of removing it — the total looks better on the machine you tested on, and the plateau reappears under production load.'
    ]
  },
  quiz: [
    {
      q: 'In a flame graph, what does the width of a box represent?',
      options: ['The fraction of collected samples in which that frame was on the stack — its share of time, including everything it called', 'How long the method ran, plotted left to right in chronological order', 'The number of times the method was called', 'The amount of memory the method allocated'],
      correct: 0,
      explain: 'Width is share of samples, inclusive of callees — wide means expensive. The x-axis has no chronology at all: frames are merged and sorted alphabetically, so a program that ran A then B looks identical to one that alternated. Franky\'s picture settled the argument by the width of the GALLEY bar, not by where it sat.'
    },
    {
      q: 'Your service has a p99 latency problem, but CPU sits at 15%. You take a CPU profile and it shows nothing interesting. What went wrong?',
      options: ['Wrong dimension — the time is spent WAITING (database, lock, downstream call), which burns no CPU and so barely appears in a CPU profile. Use wall-clock profiling instead', 'The profiler is broken and should be reinstalled', 'Nothing — if the CPU profile is flat then the service is actually fast and the latency metric is wrong', 'You need to profile for longer; a CPU profile always finds latency eventually'],
      correct: 0,
      explain: 'This is the commonest reason a profile "shows nothing". A request spending 900 ms blocked in JDBC and 10 ms computing contributes almost nothing to a CPU profile. Wall-clock sampling includes threads that are not running, so the blocked plateau appears at full width. Name the symptom first, and let it pick the mode.'
    },
    {
      q: 'What is safepoint bias?',
      options: ['A profiler that can only sample threads at safepoints cannot see a thread inside a tight JIT-compiled loop (which carries no safepoint poll), so it systematically attributes that time to whatever method it CAN see — a consistent lie, not random noise', 'The JVM pausing all threads too often, slowing the application down', 'A bias in the GC toward collecting young objects first', 'The tendency of profilers to under-report memory allocation'],
      correct: 0,
      explain: 'The JIT omits safepoint polls where it can prove they are unnecessary — notably inside counted int loops — so the hottest, best-optimised code is precisely the code a safepoint-limited sampler cannot observe. Franky sampling only at mealtimes never sees the crewmate bailing water in the hold. async-profiler samples from a signal handler instead, wherever the thread is.'
    },
    {
      q: 'A heap dump shows millions of char[] and HashMap$Node instances at the top when sorted by size. What should you look at instead?',
      options: ['The dominator tree sorted by RETAINED heap — "how much memory would be freed if this one object went away" — which ranks objects by the question a leak investigation is actually asking', 'The same list, but filtered to only your own classes', 'The thread dump, since memory problems are usually caused by too many threads', 'Nothing — char[] and HashMap$Node at the top means the JDK itself is leaking'],
      correct: 0,
      explain: 'Every Java heap ever captured is full of char[] and HashMap$Node; shallow size finds nothing. Retained heap — everything reachable only through this object — is what finds leaks, and the dominator tree makes it navigable. Robin does not ask how big the crate is; she asks what goes overboard with it.'
    },
    {
      q: 'Why is JFR considered safe to run in production, and what is the most valuable way to configure it?',
      options: ['It records events the JVM already generates internally into a ring buffer (~1% at default settings), and the best configuration is a continuous recording with maxage — so when an incident happens, the preceding hour of evidence already exists and you just dump it', 'It is not safe in production and should only be used on a developer machine', 'It is safe because it only records once per minute, so it misses almost everything', 'It is safe only if you disable garbage collection events, which are the expensive ones'],
      correct: 0,
      explain: 'JFR is cheap because the JVM already knows about GC, monitor blocking, class loading and I/O — writing those existing events to a ring buffer costs about 1%. -XX:StartFlightRecording=maxage=1h,disk=true is the configuration that changes incidents: the evidence is already there when you notice the problem.'
    }
  ],
  testFlow: {
    title: 'Test yourself: measuring instead of guessing',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A release went out and throughput dropped 20%. You have profiles from before and after. What is the fastest way to find the cause?',
        choices: [
          { text: 'Render a differential flame graph of after-minus-before, so only what changed is coloured', to: 'q1_right' },
          { text: 'Read the new profile carefully from the bottom up and look for anything suspicious', to: 'q1_wrong_read' },
          { text: 'Revert the release and move on', to: 'q1_wrong_revert' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Exactly. Both profiles are dominated by the same legitimately-wide frames, so reading either one in isolation buries the change in noise. The differential renders only the delta, and a 20% regression usually appears as one obvious coloured band. It also catches the case where a "fix" moved cost rather than removing it.' },
      q1_wrong_read: { end: true, correct: false, text: 'You can, but you are searching for a 20% change inside a picture where the normal, correct hot paths are already the widest things on screen. The delta is what you care about, so render the delta: a differential flame graph colours only what changed between the two runs.' },
      q1_wrong_revert: { end: true, correct: false, text: 'Reverting may be the right immediate action for the incident, but it does not tell you what happened, so the same regression comes back with the next attempt. You already have both profiles — the differential flame graph turns them into an answer in about a minute.' },
      q2: {
        qid: 'q2',
        q: 'Two profilers disagree about your program: one blames method A, the other blames a tight loop in method B. Which do you trust, and why?',
        choices: [
          { text: 'Lean toward the one that does not rely on safepoints (async-profiler), because a safepoint-limited sampler cannot see inside a tight JIT-compiled loop and will blame the caller instead', to: 'q2_right' },
          { text: 'Trust the one built into the JDK, since it has more access to the runtime', to: 'q2_wrong_jdk' },
          { text: 'Average the two results', to: 'q2_wrong_avg' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Right — and note the disagreement is itself the clue. Safepoint bias is systematic, not noisy: the JIT omits polls inside counted loops, so the hottest optimised code is exactly what a safepoint-limited sampler cannot observe, and those samples land on whatever method it CAN see. A tight loop in B being invisible to one tool and dominant in the other is the signature.' },
      q2_wrong_jdk: { end: true, correct: false, text: 'Being built in does not settle it — the historical limitation was architectural, not a matter of access: stack walking traditionally required the thread to be at a safepoint, and the JIT deliberately omits safepoint polls inside counted loops. (Modern JFR has improved a lot here, but the reasoning still has to be about HOW the tool samples, not who ships it.)' },
      q2_wrong_avg: { end: true, correct: false, text: 'Averaging a biased measurement with an unbiased one just gives you a smaller bias. The errors here are not independent noise around a true value — safepoint bias is systematic and points consistently away from tight loops. Work out which tool has the blind spot, and discount that one.' },
      q3: {
        qid: 'q3',
        q: 'A long-running service creeps upward in memory over days and eventually OOMs. What is your procedure?',
        choices: [
          { text: 'Run with -XX:+HeapDumpOnOutOfMemoryError, open the dump in MAT, read Leak Suspects, then confirm with Path to GC Roots on an object that should have died', to: 'q3_right' },
          { text: 'Increase -Xmx so it takes longer to fill up', to: 'q3_wrong_xmx' },
          { text: 'Take a thread dump when memory is high, since threads hold the memory', to: 'q3_wrong_thread' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'That is the whole procedure. The flag means the dump is captured automatically at the exact moment of failure rather than requiring you to guess when to take one. MAT runs the dominator analysis for you and usually names the culprit on the first screen; Path to GC Roots then shows the exact chain of strong references keeping the object alive. For a slow leak, comparing histograms from two dumps minutes apart finds the class whose instance count only ever grows.' },
      q3_wrong_xmx: { end: true, correct: false, text: 'That buys time and destroys nothing but your weekend — a genuine leak fills any heap you give it, and a bigger heap means a longer, more painful OOM and a larger dump when it finally happens. Raising -Xmx is a reasonable stopgap while you diagnose, but it is not a diagnosis. Capture the dump and find what is retaining the memory.' },
      q3_wrong_thread: { end: true, correct: false, text: 'A thread dump shows what threads are DOING, not what objects are retained — it is the tool for a hang, not a leak. You want a heap dump, and specifically retained size rather than shallow size: the question is "what would be freed if this object went away", which is what the dominator tree ranks.' }
    }
  },
  pitfalls: [
    'Optimising from intuition instead of a profile. The method that LOOKS expensive (big loop, heavy maths) is routinely fine because the JIT handles it, while the innocuous-looking string concatenation is quadratic. Measure first — the gap between your guess and the plateau is the entire reason profilers exist.',
    'Taking a CPU profile for a latency problem. Time spent waiting on a database, a lock or a downstream service burns no CPU and barely appears, so the profile looks flat and you conclude there is nothing there. Match the mode to the symptom: wall-clock for latency, alloc for GC pressure, lock for contention.',
    'Reading the x-axis of a flame graph as time. It carries no chronology whatsoever — frames are merged and sorted alphabetically. Only the width is quantitative, and it means share of samples including callees.',
    'Trusting a single safepoint-limited profile of a tight loop. The JIT omits safepoint polls inside counted loops, so the hottest code can be systematically invisible and the samples land on the caller. If two profilers disagree, suspect this before suspecting noise.',
    'Sorting a heap dump by shallow size and concluding the JDK is leaking char[]. Every heap looks like that. Retained heap and the dominator tree are what answer "what is holding this memory", and MAT\'s Leak Suspects report usually names it outright.',
    'Benchmarking under an instrumenting profiler. The added bytecode blocks inlining and distorts JIT decisions unevenly, so small hot methods look expensive precisely BECAUSE you are measuring them. Sample for "where does time go"; instrument only for call counts.',
    'Taking jmap heap dumps casually on a live production JVM — it pauses the process and writes a file the size of your heap. Prefer -XX:+HeapDumpOnOutOfMemoryError, or take the dump during a maintenance window, or use a replica.',
    'Profiling a JVM that has not warmed up and treating the result as steady-state. Early samples are dominated by interpretation and JIT compilation, which is a real cost at startup but tells you nothing about a long-running service. Let it reach steady state, or profile startup deliberately as its own question.'
  ],
  interview: [
    {
      q: 'Walk me through how you would diagnose a service whose p99 latency has doubled.',
      a: 'I would start by pinning down the symptom before touching a tool, because the symptom chooses the tool. The key question is whether the service is CPU-saturated or idle-but-slow, since those lead to completely different investigations. If CPU is high, a CPU profile is the right instrument. If CPU is low — which is the more common case for a latency regression — then the time is being spent waiting, on a database round trip, a lock, or a downstream call, and a CPU profile would show almost nothing; that is the single most common reason people say profiling "showed nothing". For that I want a wall-clock profile, async-profiler with -e wall, which samples every thread regardless of whether it is on-CPU, so blocked time appears at full width. Concretely: if the JVM is already running and I cannot restart it, I attach with jcmd <pid> JFR.start settings=profile and dump after a representative window, or run asprof -d 30 -e wall -f flame.html <pid> for a flame graph. Then I read the flame graph by width only, hunting for a plateau — a wide box with little on top, meaning time spent in that frame rather than its callees. If I have a profile from before the regression I go straight to a differential flame graph, because a 20% change is hard to see in an absolute profile dominated by legitimately hot frames but obvious as a delta. Before changing anything I read the code under the plateau, since some methods are wide because they are supposed to be. And I would want JFR running continuously in production with maxage=1h so that this whole conversation starts with evidence rather than with "can we reproduce it?".'
    },
    {
      q: 'What is a flame graph and how do you read one? What is the most common misreading?',
      a: 'A flame graph aggregates thousands of stack samples into one picture. Each box is a stack frame, and a box sitting on another means it was called by the one beneath, so the vertical axis is stack depth with the entry point at the bottom. The width of a box is the fraction of samples in which that frame was on the stack, which is its share of time inclusive of everything it called. So the reading protocol is: scan horizontally for wide boxes, ignore tall thin towers because those are deep call chains that cost nothing, and specifically look for a plateau — a wide box with little above it — because that means the work is happening in that frame itself, which is where an optimisation actually lands. The most common misreading, by a distance, is treating the x-axis as time. It has no chronology at all: identical stacks are merged and siblings are sorted alphabetically so the layout stays stable across runs, which means a program that ran A and then B produces exactly the same picture as one that alternated between them a thousand times. If you need chronology you want a timeline view or a flame chart, which is a different visualisation with similar colouring. Two things worth adding: colours are normally arbitrary, chosen to help the eye separate neighbours, although async-profiler can colour by frame type — green Java, yellow C++, red kernel — which instantly reveals a program dominated by syscalls; and the differential flame graph, rendering the delta between two profiles, is the highest-value variant for regression work because it colours only what changed.'
    },
    {
      q: 'Explain safepoint bias and its practical consequences.',
      a: 'Walking a Java thread\'s stack has traditionally required that thread to be at a safepoint — a point in the generated code where the thread\'s state is fully described by metadata the runtime can read, so it can be inspected without racing the running code. The JIT inserts safepoint polls at method returns and loop back edges, but omits them where it can prove they are unnecessary, most notably inside counted int loops whose termination it can prove. So a thread executing a tight, hot, heavily optimised loop may not reach a poll for a long time, and a profiler restricted to safepoints simply cannot observe it there. It observes it at the next poll, usually after the loop, in the caller. The practical consequence is what makes this worth knowing: the error is systematic rather than random, and it is biased against precisely the code you care about, because the hottest loops are the ones the JIT optimises hardest and therefore the ones least likely to carry a poll. You get a profile that confidently names a method that is not the problem while the genuine hot loop never appears at all, and no amount of sampling for longer fixes it, because it is not noise. It also explains the common and otherwise baffling experience of two profilers disagreeing about the same program — the disagreement is the signature. async-profiler addresses it by using AsyncGetCallTrace, a HotSpot entry point safe to call from a POSIX signal handler: it arms a timer, and in the handler walks the stack of whichever thread was interrupted, wherever that thread happens to be, so no safepoint is required. It can also attribute time to native and kernel frames via perf events, which is how you discover a program really spending its life in syscalls. Modern JFR has closed much of the gap — JDK 21 added a substantially better CPU-time sampler — but the reasoning still matters when you have to decide which of two disagreeing profiles to believe.'
    },
    {
      q: 'How do you find a memory leak in a long-running Java service?',
      a: 'First I establish that it is actually a leak rather than a heap that is merely large or a GC that is merely tuned oddly: the signature of a leak is live-set-after-full-GC growing monotonically over time, which you can watch with jstat, JFR, or GC logs. Once I believe it, the procedure is mechanical. I make sure the service runs with -XX:+HeapDumpOnOutOfMemoryError so that a dump is captured automatically at the exact moment of failure, which is far better than trying to guess when to take one manually; taking one deliberately is jmap -dump:live,format=b,file=heap.hprof <pid>, bearing in mind that it pauses the JVM and writes a file the size of the heap, so on production I would prefer a replica or a maintenance window. Then I open the dump in Eclipse MAT. The crucial concept is retained heap versus shallow heap: shallow is what an object occupies by itself, so sorting by it just tells me I have a lot of char[] and HashMap$Node, which is true of every Java heap ever taken. Retained heap is everything reachable only through that object — what would actually be freed if it were collected — and the dominator tree, where A dominates B if every path from a GC root to B goes through A, makes that navigable. Sorting the dominator tree by retained heap directly answers "how much memory disappears if I get rid of this one thing", which is the question a leak investigation is asking. MAT\'s Leak Suspects report runs that analysis automatically and usually names the culprit on the first screen; when it does not, I select an object that should have been collected and use Path to GC Roots with weak and soft references excluded, which shows the exact chain of strong references keeping it alive. For a slow leak I take two dumps some minutes apart and compare histograms, looking for a class whose instance count only ever grows. In practice the causes repeat: a static Map used as a cache with no eviction, a ThreadLocal never removed on a pooled thread so it lives as long as the pool, listeners or callbacks registered and never unregistered, and non-static inner classes holding an implicit reference to an outer object that should have died.'
    },
    {
      q: 'When would you use JFR versus async-profiler?',
      a: 'They overlap but their strengths differ, and I would usually reach for both. JFR is built into the JVM, needs no agent or install, is free for production use, and is not only a method sampler — it is an event stream covering GC, monitor blocking, class loading, I/O, thread parking, safepoint pauses and more, because the JVM already generates those events internally and JFR just writes them to a ring buffer. That is why it costs around 1% at default settings, which makes the killer configuration possible: a continuous recording with maxage=1h so the evidence for an incident already exists when you notice it. Combined with JDK Mission Control, whose Automated Analysis page scores a recording against dozens of known pathologies in plain English, it is the best default for "something is wrong with this service and I need the broad picture". async-profiler is the specialist. It samples from a signal handler using AsyncGetCallTrace rather than at safepoints, so it does not suffer safepoint bias and can see inside tight JIT-compiled loops; it produces flame graphs directly as self-contained interactive HTML; it offers wall-clock profiling, which is the right mode for latency problems where threads are blocked rather than burning CPU; and via perf events it can attribute time to native and kernel frames, which JFR does not do. So in practice: JFR continuously in production and as the first look, especially when I want GC and lock events alongside the method profile; async-profiler when I want a flame graph, when I need wall-clock or allocation or lock modes specifically, when I suspect the profile is lying to me about a hot loop, or when I need to see below the JVM into native code.'
    }
  ]
};
