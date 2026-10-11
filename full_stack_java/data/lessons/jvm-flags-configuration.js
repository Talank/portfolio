window.LESSONS = window.LESSONS || {};
window.LESSONS['jvm-flags-configuration'] = {
  id: 'jvm-flags-configuration',
  title: 'JVM Flags: What Configuration Controls — JIT, GC, Memory, Runtime — and How to Set It for Test Runs',
  category: 'Part 2 — The JVM, Deeply',
  timeMin: 55,
  summary: 'Every time a JVM starts, it makes hundreds of decisions for you: which garbage collector to run, how big the heap may grow, how hard the JIT compiler should try, whether to share pre-parsed classes between processes. Flags are how you take those decisions back. This lesson is the map you need before reading any paper that tunes the JVM — including the ISSTA 2026 paper PROBO, which speeds up test suites by up to 27% using nothing but flags. You will learn the flag families and their syntax, how to see the configuration a JVM ACTUALLY chose (which is often not the one you think), what the JIT, GC, memory and runtime flags each control and why short-lived test JVMs respond to them so differently from long-running servers, how to get flags into the JVM that runs your tests (the one Maven forks, not the one you typed), and why the space of combinations is so large and so full of conflicts that searching it needs a method rather than a hunch.',
  goals: [
    'Read and write all three flag syntaxes — standard options, -X non-standard flags, and -XX: advanced flags in their boolean (-XX:+Name / -XX:-Name) and valued (-XX:Name=value) forms',
    'Show the configuration a JVM actually ended up with, using -XX:+PrintFlagsFinal, -XX:+PrintCommandLineFlags and jcmd <pid> VM.flags, and explain what ergonomics changed',
    'Explain tiered compilation (levels 0–4, C1 vs C2) and predict why -XX:TieredStopAtLevel=1 often speeds up short test runs while slowing down long-running services',
    'Choose between Serial, Parallel and G1 collectors and the heap flags (-Xms, -Xmx, compressed oops, TLABs) by what each one costs and buys',
    'Put flags into the JVM that actually runs your tests with Maven Surefire\'s argLine, without dropping existing agents, and explain why MAVEN_OPTS does not reach it',
    'Recognise flag dependencies and conflicts, and explain why the combination space is too large to search by hand'
  ],
  concept: [
    {
      h: 'A flag is a decision the JVM would otherwise make for you',
      p: [
        'When you type <code>java -jar app.jar</code> you have not left the JVM unconfigured — you have delegated the configuration to <b>ergonomics</b>, HotSpot\'s rules for choosing defaults from the machine it wakes up on. It counts CPUs and memory (and, since JDK 10, the limits of the container it runs in), and from those picks a garbage collector, an initial and maximum heap size, the number of GC and compiler threads, and more. On JDK 11 a "server-class" machine — at least two CPUs and about 1.8 GB of memory — gets the G1 collector and a maximum heap of a quarter of physical memory; a smaller box quietly gets the Serial collector instead. That is the first lesson about flags: <i>the same command line produces different JVMs on your laptop and in CI</i>, so any claim about performance has to name the configuration that actually ran.',
        'Flags come in three families, and the syntax tells you which one you are looking at. <b>Standard options</b> are stable across every JVM: <code>-cp</code>, <code>-D</code>name=value for system properties, <code>-version</code>, <code>-ea</code>. <b>Non-standard options</b> begin with <code>-X</code> and are HotSpot-specific but long-lived: <code>-Xmx2g</code> (maximum heap), <code>-Xms512m</code> (initial heap), <code>-Xss1m</code> (thread stack), <code>-Xshare:off</code> (class data sharing). <b>Advanced options</b> begin with <code>-XX:</code> and come in two shapes: booleans, switched on with a plus and off with a minus — <code>-XX:+UseParallelGC</code>, <code>-XX:-UsePerfData</code> — and valued flags written with an equals sign — <code>-XX:TieredStopAtLevel=1</code>, <code>-XX:ParallelGCThreads=2</code>. A further layer of <i>diagnostic</i> and <i>experimental</i> flags exists behind <code>-XX:+UnlockDiagnosticVMOptions</code> and <code>-XX:+UnlockExperimentalVMOptions</code>; they are useful for investigation and dangerous to ship.',
        'Never trust your memory of a default — ask the JVM. <code>java -XX:+PrintFlagsFinal -version</code> prints every flag with its final value, and the last column says who chose it: <code>{default}</code> for the built-in value, <code>{ergonomic}</code> for a value the JVM picked from the machine, <code>{command line}</code> for one you set. (JDK 8 had no such column and marked changed values with <code>:=</code> instead.) <code>java -XX:+PrintCommandLineFlags -version</code> prints the short list a JVM considers its effective command line, which conveniently includes the collector and heap sizes ergonomics chose. And on a JVM that is already running, <code>jcmd &lt;pid&gt; VM.flags</code> shows its non-default flags (add <code>-all</code> for everything) — the only way to be certain what a forked test JVM really received.'
      ]
    },
    {
      h: 'JIT flags: how hard should the compiler try?',
      p: [
        'Java bytecode starts life in the <b>interpreter</b>, which is slow but needs no preparation. Methods that run often are compiled to machine code by two just-in-time compilers. <b>C1</b> compiles quickly and produces decent code; <b>C2</b> compiles slowly and produces excellent code, using the profile gathered while the method ran. <b>Tiered compilation</b> (on by default since JDK 8) moves a method through levels: level 0 is the interpreter; level 3 is C1 with full profiling; level 4 is C2. Levels 1 and 2 are C1 variants with no profiling and limited profiling. The usual path for a hot method is 0 → 3 → 4: interpret, compile quickly with instrumentation to learn how the method behaves, then compile it again, properly, with C2.',
        'That path is a bet that the program will live long enough for C2\'s slow, careful work to pay for itself. For a server that runs for weeks it always does. For a test JVM that lives for twenty seconds it often does not: the JVM spends CPU profiling methods and running C2 compilations whose payoff arrives after the tests have finished. <code>-XX:TieredStopAtLevel=1</code> stops at level 1 — C1 only, with no profiling at all — so methods get fast, cheap, unprofiled machine code and C2 never runs. Start-up gets faster and peak speed gets worse, which is precisely the right trade for short runs and precisely the wrong one for long ones. <code>-XX:-TieredCompilation</code> does the opposite: interpreter then straight to C2, which warms up slowly. Finer knobs exist — <code>-XX:CICompilerCount</code> sets the number of compiler threads, <code>-XX:-DoEscapeAnalysis</code> turns off one of C2\'s major optimisations, <code>-XX:-C1ProfileCalls</code> reduces profiling inside C1 code, and <code>-XX:ReservedCodeCacheSize</code> bounds the memory that compiled code lives in.',
        'This is the single most important idea for understanding PROBO. Across 16 projects, the runtime metrics that best predicted testing time were the JIT\'s: the total compilation rate and the C1 compilation rate made up two thirds of the consistently important metrics. Test suites are short-lived, start-up-heavy programs, and for them "how much compiling did we do?" is often the question that decides the run time.'
      ]
    },
    {
      h: 'Garbage collection and memory flags',
      p: [
        'You choose exactly one collector. <code>-XX:+UseSerialGC</code> collects with a single thread and stops the application while it works; it has almost no bookkeeping overhead, which makes it surprisingly good for small heaps and short runs. <code>-XX:+UseParallelGC</code> also stops the application, but collects with many threads, so it maximises throughput on multi-core machines. <code>-XX:+UseG1GC</code>, the default on server-class machines since JDK 9, divides the heap into regions and collects incrementally to keep pauses near a target (<code>-XX:MaxGCPauseMillis</code>, 200 ms by default); it trades some throughput and extra bookkeeping for predictable pauses. ZGC and Shenandoah go further toward very short pauses (ZGC is production-ready from JDK 15; on JDK 11 it was experimental). Asking for two collectors at once is a conflict, and the JVM refuses to start.',
        'The heap flags decide how much memory that collector manages. <code>-Xmx</code> caps the heap; <code>-Xms</code> sets where it starts. A JVM that starts small and grows has to resize along the way, so setting <code>-Xms</code> equal to <code>-Xmx</code> removes the resizing at the cost of committing all the memory at once. Thread counts follow the collector: <code>-XX:ParallelGCThreads</code> for stop-the-world work and <code>-XX:ConcGCThreads</code> for concurrent work, both chosen by ergonomics from the CPU count. Two more mechanisms appear in every JFR recording, so know them by name. <b>TLABs</b> (thread-local allocation buffers) give each thread a private slice of the young generation, so most allocations are a pointer bump with no locking. <b>Compressed oops</b> (<code>-XX:+UseCompressedOops</code>) store object references as 32-bit offsets, saving memory and cache; it is already on by default for heaps under about 32 GB — which means "turning it on" usually changes nothing, a perfect example of why <code>PrintFlagsFinal</code> matters before you credit a flag with a speed-up.',
        'Be careful with flags that move work to start-up. <code>-XX:+AlwaysPreTouch</code> touches every page of the heap when the JVM starts, which smooths a long-running server and is pure cost for a twenty-second test run.'
      ]
    },
    {
      h: 'Runtime flags: start-up, class data sharing and bookkeeping',
      p: [
        'A test JVM\'s life is mostly start-up, so the flags that shorten start-up matter more than their reputation suggests. <b>Class Data Sharing</b> (CDS) maps a pre-parsed archive of core classes into memory instead of loading and verifying them one by one; <code>-Xshare:auto</code> uses it if available, <code>-Xshare:off</code> disables it, and <code>-Xshare:on</code> insists on it and fails if the archive is missing. JDK 12 and later ship a default archive; on JDK 11 you create it once with <code>java -Xshare:dump</code>. Application CDS (<code>-XX:SharedArchiveFile</code>) extends the same idea to your own classes.',
        'Some flags turn off bookkeeping. <code>-XX:-UsePerfData</code> stops the JVM from maintaining the shared-memory performance counters it writes for monitoring tools — a small saving per launch, paid for by making the JVM invisible to <code>jps</code> and <code>jstat</code>. That trade is typical of the whole area: almost every flag is a cost moved from one place to another, and whether it helps depends entirely on which cost your program was paying.'
      ]
    },
    {
      h: 'Getting the flags into the JVM that runs your tests',
      p: [
        'When you run <code>mvn test</code>, two JVMs are involved. The first is Maven itself. The second is the one Maven <b>Surefire forks</b> to run your tests — by default one fresh JVM per module (<code>forkCount=1</code>, <code>reuseForks=true</code>). <code>MAVEN_OPTS</code> configures the first one only. Setting <code>MAVEN_OPTS="-XX:TieredStopAtLevel=1"</code> makes Maven start a little faster and leaves your tests completely unchanged, which is the most common way to "try a flag" and measure nothing. The test JVM\'s flags come from Surefire\'s <code>argLine</code>: set it in the POM\'s <code>maven-surefire-plugin</code> configuration, or on the command line with <code>mvn test -DargLine="-XX:TieredStopAtLevel=1 -XX:+UseSerialGC"</code>. Gradle\'s equivalent is <code>jvmArgs</code> in the <code>test</code> block.',
        'Two traps follow. First, many projects already use <code>argLine</code> — the JaCoCo coverage agent, for example, injects itself there — so replacing it can silently remove the agent. Surefire\'s late-replacement syntax keeps both: <code>&lt;argLine&gt;@{argLine} -XX:TieredStopAtLevel=1&lt;/argLine&gt;</code>. It needs an <code>argLine</code> property to exist, though: if no plugin defines one, the text <code>@{argLine}</code> reaches the JVM literally and the fork fails to start, so projects without a coverage agent declare an empty <code>&lt;argLine&gt;&lt;/argLine&gt;</code> in <code>&lt;properties&gt;</code>. Second, the environment variable <code>JAVA_TOOL_OPTIONS</code> reaches every JVM, test or not, and prints "Picked up JAVA_TOOL_OPTIONS" to stderr when it does; it is a blunt instrument, but sometimes the only way into a JVM you do not control. Whatever you use, verify inside the forked JVM — print the input arguments from a test, or run <code>jcmd &lt;pid&gt; VM.flags</code> against it.'
      ]
    },
    {
      h: 'Dependencies, conflicts, and why the space is enormous',
      p: [
        'Flags are not independent switches. Some <b>depend</b> on others: <code>-XX:ParallelGCThreads</code> only matters with a collector that uses parallel threads, and <code>-XX:MaxGCPauseMillis</code> is a goal for G1, not for Serial. Some <b>conflict</b>: two collectors cannot both be selected, and the JVM refuses to start. Some exist in one JDK and not another — CMS (<code>-XX:+UseConcMarkSweepGC</code>) was removed in JDK 14, and an unrecognised flag stops the JVM, unless someone added <code>-XX:+IgnoreUnrecognizedVMOptions</code>, which makes typos silently do nothing. So the first test of any candidate configuration is cheap and essential: does <code>java &lt;flags&gt; -version</code> even start?',
        'Now count. PROBO restricted itself to flags whose documentation suggested they could affect execution time, adapted them to Java 11, and still ended with 72 flags — up to 2<sup>72</sup>, about 4.7 × 10<sup>21</sup>, combinations, constrained by 6 dependencies and 59 conflicts. The effects are non-linear and interact: a flag that saves time with one collector can cost time with another. And good combinations are rare enough that, in the authors\' earlier work, random search was a surprisingly strong baseline. That is the problem the next lesson solves: measure honestly, then search with a model instead of a hunch. Everything in this lesson is the vocabulary you need for it.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky\'s control panel, and the Mini Merry nobody adjusted',
      text: 'The Thousand Sunny has a control panel with more levers than anyone but Franky understands, and on the first morning he leaves them exactly where he set them when he built her: a long-voyage configuration, chosen for the open sea, sized for the ship she is (ergonomics: the JVM picks a collector, a heap and thread counts from the machine it wakes up on — and a smaller ship would have got different settings from the same shipwright). The crew\'s new job is not a long voyage, though. It is two hundred short hops between tiny islands, and on every hop the Sunny does what a long-voyage ship should do: she spends the first minutes carefully tuning her great engine for peak speed — and the island arrives before the tuning pays off (tiered compilation: profiling and C2 compiles are an investment that a twenty-second test JVM never lives long enough to collect). So Franky pulls one lever, labelled "first gear, no fine-tuning," and the short hops get faster even though the Sunny\'s top speed gets worse (-XX:TieredStopAtLevel=1: C1 only, no profiling). Usopp, delighted, pulls a second lever for the other engine, and nothing happens at all — the ship refuses to sail with both engines engaged (two garbage collectors is a conflict; the JVM will not start). Then the funniest mistake of the day. Zoro is told to set the levers for the scouting runs, and he very carefully sets them — on the Sunny. But the scouting runs are flown by the Mini Merry, launched from the Soldier Dock, and the Mini Merry has her own panel. Every scouting run is exactly as slow as before (MAVEN_OPTS configures Maven\'s own JVM; your tests run in the JVM that Surefire forks, and only argLine reaches it). Franky ends the day by doing what he should have done first: he climbs into the Mini Merry and reads her panel out loud, lever by lever, before believing anything (verify inside the forked JVM: jcmd <pid> VM.flags, or print the input arguments from a test).',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Leonard adjusts the thermostat in the wrong apartment',
      text: 'Sheldon\'s apartment has a configuration for everything — thermostat at seventy-one, the lamp angle, the precise spot on the couch — and he did not choose it fresh this morning; he chose it once, for the life he expected to live there (ergonomics: defaults picked once, for the typical case). The trouble starts when Penny\'s apartment across the hall is too warm for game night. Leonard, trying to help, goes into 4A and carefully lowers Sheldon\'s thermostat, then returns to the party in 4B, where it is exactly as hot as it was (MAVEN_OPTS: you configured the JVM that launches the tests, not the one that runs them — the tests live across the hall, and only Surefire\'s argLine reaches them). Meanwhile Sheldon discovers his apartment is now two degrees colder, which is the other half of the trap: the change was not useless, it went somewhere you did not intend. Then Howard suggests running both the heater and the air conditioner "to get the temperature exactly right," and the building\'s ancient breaker simply refuses (two collectors selected at once: the JVM will not start). And when Raj announces that he has already turned on the "energy saver" mode, everyone is impressed until Sheldon points out that energy saver has been on since 2007 (UseCompressedOops: already on by default under 32 GB, so "enabling" it changes nothing — always read PrintFlagsFinal before crediting a flag with a result).',
    },
    why: 'Franky\'s long-voyage settings are ergonomics: sensible defaults the JVM picks from the machine, tuned for programs that run a long time. Short hops between islands are short-lived test JVMs, where the careful engine tuning (profiling plus C2) is paid for and never collected, so "first gear, no fine-tuning" (TieredStopAtLevel=1) wins the short races while losing the long ones. Two engines at once is a collector conflict — the JVM refuses to start. Zoro setting the Sunny\'s levers for the Mini Merry\'s runs, and Leonard cooling 4A for a party in 4B, are the MAVEN_OPTS trap: the tests run in a forked JVM, and only argLine reaches it. Raj\'s energy-saver mode that was already on is compressed oops — a flag can "change" nothing, which is why you read PrintFlagsFinal first.'
  },
  storyAnim: {
    title: 'From default settings to the right lever on the right ship',
    h: 300,
    props: [
      { id: 'ergo', emoji: '⚙️', label: 'Ergonomics: defaults chosen from the machine', x: 12, y: 12 },
      { id: 'hops', emoji: '🏝️', label: 'Short hops = short-lived test JVMs', x: 46, y: 12 },
      { id: 'tier', emoji: '🐢', label: 'Profiling + C2 never pays off on a short hop', x: 82, y: 12 },
      { id: 'lever', emoji: '🎚️', label: 'TieredStopAtLevel=1: C1 only, no profiling', x: 20, y: 46 },
      { id: 'conflict', emoji: '⛔', label: 'Two collectors = the JVM refuses to start', x: 56, y: 46 },
      { id: 'mini', emoji: '🚤', label: 'Tests run in the FORKED JVM (Mini Merry)', x: 86, y: 46 },
      { id: 'argline', emoji: '🧷', label: 'argLine reaches it; MAVEN_OPTS does not', x: 28, y: 80 },
      { id: 'verify', emoji: '🔎', label: 'Verify: PrintFlagsFinal / jcmd VM.flags', x: 74, y: 80 }
    ],
    actors: [
      { id: 'franky', emoji: '🤖', label: 'Franky', x: 12, y: 30 }
    ],
    steps: [
      { c: 'Franky leaves the Sunny on her long-voyage settings — the JVM\'s ergonomics: collector, heap and thread counts picked from the machine it wakes up on.', p: { ergo: 'lit' }, a: { franky: [12, 30] } },
      { c: 'But today is two hundred short hops. A test suite is exactly that: short-lived JVMs that are mostly start-up.', p: { hops: 'lit' }, a: { franky: [46, 30] } },
      { c: 'On every hop the engine spends minutes tuning for peak speed: profiling, then slow C2 compiles. The island arrives before the tuning pays off.', p: { tier: 'bad' } },
      { c: 'One lever: "first gear, no fine-tuning." -XX:TieredStopAtLevel=1 means C1 only, no profiling. Short hops get faster; top speed gets worse.', p: { lever: 'good' }, a: { franky: [20, 30] } },
      { c: 'Usopp engages the second engine too. The ship refuses to sail: two garbage collectors is a conflict, and the JVM will not start.', p: { conflict: 'bad' } },
      { c: 'Zoro sets the levers for the scouting runs — on the Sunny. The scouting is flown by the Mini Merry, which has her own panel.', p: { mini: 'bad' } },
      { c: 'That is MAVEN_OPTS: it configures Maven\'s JVM. The tests run in the JVM Surefire forks, and only argLine (keep @{argLine} for agents) reaches it.', p: { argline: 'good' } },
      { c: 'Franky climbs into the Mini Merry and reads her panel aloud before believing anything: PrintFlagsFinal, PrintCommandLineFlags, jcmd <pid> VM.flags.', p: { verify: 'good' }, a: { franky: [74, 62] } }
    ]
  },
  conceptFlow: {
    title: 'Trying one flag on a test suite, correctly',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Know the baseline',
        nodes: [
          { id: 'final', text: 'java -XX:+PrintFlagsFinal -version\nwhat did ergonomics pick?' },
          { id: 'jdk', text: 'same JDK as CI?\nflags differ by version' }
        ]
      },
      {
        label: 'Pick and validate',
        nodes: [
          { id: 'pick', text: '-XX:TieredStopAtLevel=1\n-XX:+UseSerialGC' },
          { id: 'starts', text: 'java <flags> -version\nconflict? unknown flag?' }
        ]
      },
      {
        label: 'Reach the test JVM',
        nodes: [
          { id: 'argline', text: '-DargLine="@{argLine} ..."\nnot MAVEN_OPTS' },
          { id: 'verify', text: 'jcmd <pid> VM.flags\non the FORKED JVM' }
        ]
      },
      {
        label: 'Judge it',
        nodes: [
          { id: 'outcomes', text: 'same tests pass/fail?\nfaster but different = rejected' },
          { id: 'repeat', text: 'repeat runs, compare\ndistributions (next lesson)' }
        ]
      }
    ],
    steps: [
      { active: ['final'], note: 'Start by asking the JVM what it chose without you. PrintFlagsFinal lists every flag with its final value and origin; PrintCommandLineFlags gives the short list, including the collector and heap ergonomics picked.' },
      { active: ['jdk'], note: 'Make sure you are asking the same JDK the tests run on. Defaults, available collectors and even flag names change between versions — CMS was removed in JDK 14, ZGC was experimental on 11.' },
      { active: ['pick'], note: 'Pick candidates with a reason. For a short-lived test JVM, the JIT and collector choices are the usual suspects: C1-only compilation, and a collector with less bookkeeping.' },
      { active: ['starts'], note: 'Validate before you spend a test run: java <flags> -version. Two collectors, a removed flag, or a missing unlock flag all stop the JVM immediately, and that costs one second instead of one test run.' },
      { active: ['argline'], note: 'Put the flags where the tests live. Surefire forks the test JVM; argLine configures it. MAVEN_OPTS only configures Maven itself. Keep @{argLine} so you do not drop agents such as JaCoCo.' },
      { active: ['verify'], note: 'Then prove they arrived: jcmd <pid> VM.flags against the forked JVM, or print ManagementFactory.getRuntimeMXBean().getInputArguments() from a test.' },
      { active: ['outcomes'], note: 'A configuration only counts if every test produces the same outcome as before. A flag that makes tests faster by making them behave differently is not an optimisation; PROBO discards such configurations outright.' },
      { active: ['repeat'], note: 'Finally, one run proves nothing: JIT timing, disk caches and other processes add noise. Repeat runs and compare distributions — the subject of the next lesson.' }
    ]
  },
  tech: [
    {
      q: 'What are the JVM flag families, and how do you find out what configuration a JVM is actually running with?',
      a: 'There are three families. Standard options are stable across JVM implementations: -cp, -D for system properties, -version, -ea and so on. Non-standard options start with -X and are HotSpot-specific but long-lived: -Xmx (maximum heap), -Xms (initial heap), -Xss (thread stack size), -Xshare (class data sharing). Advanced options start with -XX: and come as booleans, -XX:+Name to enable and -XX:-Name to disable, or as valued flags, -XX:Name=value. Behind them sit diagnostic and experimental flags that need -XX:+UnlockDiagnosticVMOptions or -XX:+UnlockExperimentalVMOptions. Because ergonomics chooses many defaults from the machine — CPU count, physical memory, container limits — you should never assume a configuration; you ask for it. java -XX:+PrintFlagsFinal -version prints every flag with its final value and, in its last column, its origin: {default}, {ergonomic} (chosen by the JVM from the machine) or {command line}. JDK 8 lacked that column and marked changed values with := instead. java -XX:+PrintCommandLineFlags -version prints the short effective command line, including the collector and heap sizes ergonomics picked. On a running process, jcmd <pid> VM.flags shows the non-default flags and jcmd <pid> VM.flags -all shows everything; jinfo -flag Name <pid> reads one. For tests in particular you check the forked JVM, not the one you launched.'
    },
    {
      q: 'Explain tiered compilation, and why -XX:TieredStopAtLevel=1 can make a test suite faster.',
      a: 'HotSpot starts every method in the interpreter (level 0). Methods that become hot are compiled by C1, a fast compiler producing reasonable code, and the hottest are recompiled by C2, a slow compiler producing excellent code. Tiered compilation, on by default since JDK 8, moves methods through levels: level 3 is C1 code instrumented with full profiling, level 4 is C2 code built from that profile, and levels 1 and 2 are C1 code with no profiling and with limited profiling. The usual path 0 → 3 → 4 is a bet that the program will run long enough for C2\'s work — and the profiling overhead along the way — to pay off. Servers win that bet. A test JVM that lives for seconds often loses it: it pays for profiling and for C2 compiles whose benefit arrives after the last test. -XX:TieredStopAtLevel=1 stops at level 1, meaning C1 code with no profiling and no C2 at all, so compile work drops and start-up improves at the cost of peak performance. The same flag would make a long-running service slower. That asymmetry is why the PROBO study found JIT metrics — total and C1 compilation rate — to be the strongest predictors of testing time across projects.'
    },
    {
      q: 'Compare the Serial, Parallel and G1 collectors. Which might suit a short test run, and why?',
      a: 'All three are generational. Serial collects with a single thread and stops the application while it does; it has the least bookkeeping of any collector. Parallel also stops the application but uses many threads, so it maximises throughput — total work per second — on multi-core machines. G1, the default on server-class machines since JDK 9, splits the heap into regions, collects incrementally, and works to keep pauses near a target set by -XX:MaxGCPauseMillis (200 ms by default); it pays for that predictability with extra bookkeeping such as remembered sets and write barriers. A short test run with a modest heap often does not need G1\'s pause control at all, so Serial or Parallel can be faster: less overhead, and few enough collections that pause length hardly matters. Which one wins depends on how much the suite allocates and how many cores it has, which is exactly why you measure rather than assume. You choose one collector only; selecting two is a conflict and the JVM refuses to start.'
    },
    {
      q: 'Why does setting MAVEN_OPTS not change how your tests run, and how do you set flags for them correctly?',
      a: 'mvn test involves at least two JVMs. MAVEN_OPTS configures the JVM running Maven itself. Surefire, the plugin that runs tests, forks a separate JVM for them (forkCount=1 by default), and that JVM\'s flags come from Surefire\'s argLine parameter. So -XX:TieredStopAtLevel=1 in MAVEN_OPTS speeds up Maven slightly and leaves the tests untouched. Set argLine instead, in the maven-surefire-plugin configuration or as mvn test -DargLine="...". Because projects often already use argLine — coverage agents such as JaCoCo inject themselves there — write <argLine>@{argLine} -XX:TieredStopAtLevel=1</argLine>, which uses Surefire\'s late property replacement to append instead of replace. Gradle uses jvmArgs inside the test block. JAVA_TOOL_OPTIONS reaches every JVM, including forked ones, and announces itself on stderr; it is useful when you cannot edit the build, but it affects everything. In every case, verify inside the forked JVM, with jcmd <pid> VM.flags or by printing the runtime input arguments from a test.'
    },
    {
      q: 'What makes searching for a good JVM configuration hard?',
      a: 'Three things. Size: even after restricting to flags plausibly related to execution time, PROBO\'s Java 11 flag space has 72 flags, up to 2^72 ≈ 4.7 × 10^21 combinations, and each evaluation means running a whole test suite several times. Structure: flags have dependencies (ParallelGCThreads only matters with a parallel collector; MaxGCPauseMillis is a G1 goal) and conflicts (two collectors), and the flag set itself differs between JDK versions, so many combinations are invalid or meaningless. Interaction: effects are non-linear — a flag that helps with one collector can hurt with another — and genuinely better configurations are rare, which is why random search was a strong baseline in the authors\' earlier work. Practical consequences: validate candidates cheaply first (does java <flags> -version start?), require identical test outcomes, and use a search method that learns from the configurations already measured.'
    }
  ],
  code: {
    title: 'Make a test JVM tell you how it was configured',
    intro: 'The only trustworthy answer to "did my flag arrive?" comes from inside the JVM that ran the tests. This small program reads its own configuration through the management API: the raw input arguments, the collector actually in use, and the final value of individual flags. Paste it into a test (or run it under the same argLine) and you can never again be fooled by MAVEN_OPTS.',
    code: `import com.sun.management.HotSpotDiagnosticMXBean;
import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;

public class FlagReport {

    public static void main(String[] args) {
        // 1) Exactly what this JVM was started with (what argLine delivered).
        System.out.println("input args : " + ManagementFactory.getRuntimeMXBean().getInputArguments());
        System.out.println("java       : " + System.getProperty("java.version"));

        // 2) Which collector is really running. The bean names give it away:
        //    Serial   -> "Copy", "MarkSweepCompact"
        //    Parallel -> "PS Scavenge", "PS MarkSweep"
        //    G1       -> "G1 Young Generation", "G1 Old Generation"
        for (GarbageCollectorMXBean gc : ManagementFactory.getGarbageCollectorMXBeans()) {
            System.out.println("collector  : " + gc.getName());
        }

        // 3) The FINAL value of individual flags, after ergonomics and the command line.
        HotSpotDiagnosticMXBean hs = ManagementFactory.getPlatformMXBean(HotSpotDiagnosticMXBean.class);
        for (String flag : new String[] {
                "TieredStopAtLevel", "UseSerialGC", "UseParallelGC", "UseG1GC",
                "UseCompressedOops", "MaxHeapSize", "ParallelGCThreads", "UsePerfData" }) {
            var opt = hs.getVMOption(flag);
            System.out.printf("%-18s = %-12s (origin %s)%n", flag, opt.getValue(), opt.getOrigin());
        }
    }
}

/* Try it three ways and compare the output:
     javac FlagReport.java
     java FlagReport
     java -XX:TieredStopAtLevel=1 -XX:+UseSerialGC FlagReport
     java -XX:+UseSerialGC -XX:+UseParallelGC FlagReport     # conflict: the JVM refuses to start

   The same facts from the outside:
     java -XX:+PrintCommandLineFlags -version
     java -XX:+PrintFlagsFinal -version | grep -E "TieredStopAtLevel|UseCompressedOops|MaxHeapSize"
     jcmd <pid> VM.flags            # on any running JVM, e.g. a forked Surefire JVM */`,
    notes: [
      'Origin is the column that settles arguments. DEFAULT means nobody touched it, ERGONOMIC means the JVM chose it from the machine, VM_CREATION means it came from the command line. A flag you "set" that still reports DEFAULT never arrived.',
      'The collector bean names are the quickest way to see which collector ergonomics picked. Run the program on a one-CPU container and on your laptop, and you may see two different answers from the same command line.',
      'UseCompressedOops will very likely print true with origin ERGONOMIC before you set anything: it is already on for heaps under about 32 GB. Setting it explicitly is then a no-op, which is why a search that "finds" it should be read with care.',
      'To check a real test run, put the body of main into a @BeforeAll method, or attach jcmd to the forked Surefire JVM while the tests run.'
    ]
  },
  lab: {
    title: 'Configure the test JVM, not the build JVM',
    prompt: 'A teammate tried to speed up the test suite with <code>export MAVEN_OPTS="-XX:TieredStopAtLevel=1"</code> and reported "no effect". Fix it properly. (1) In the POM fragment, configure <code>maven-surefire-plugin</code> so the forked test JVM runs with <code>-XX:TieredStopAtLevel=1</code> and <code>-XX:+UseSerialGC</code>, keeping any existing argLine (the project uses JaCoCo) by starting with <code>@{argLine}</code>. (2) Write the one-line command that shows the final value of <code>TieredStopAtLevel</code> for a JVM started with those flags, using <code>-XX:+PrintFlagsFinal</code>. (3) Write the command that lists the flags of an already-running JVM by PID. (4) In the ANSWER comment, explain why MAVEN_OPTS had no effect.',
    starter: `<!-- (1) pom.xml fragment: configure the FORKED test JVM -->
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-surefire-plugin</artifactId>
  <version>3.2.5</version>
  <configuration>
    <!-- argLine goes here -->
  </configuration>
</plugin>

<!-- (2) Show the final value of TieredStopAtLevel with PrintFlagsFinal:
     java ...                                                            -->

<!-- (3) List the flags of a running JVM by PID:
     ...                                                                 -->

<!-- Q: Why did export MAVEN_OPTS="-XX:TieredStopAtLevel=1" change nothing about the tests?
     ANSWER: -->`,
    checks: [
      { re: '<argLine>', must: true, hint: 'Surefire reads the test JVM\'s flags from <argLine>...</argLine> inside <configuration>.', pass: 'uses argLine ✓' },
      { re: '@\\{argLine\\}', must: true, hint: 'Start the value with @{argLine} so JaCoCo\'s agent (and anything else already there) is kept.', pass: 'keeps existing argLine ✓' },
      { re: '-XX:TieredStopAtLevel=1', must: true, hint: 'Add -XX:TieredStopAtLevel=1 (C1 only, no profiling).', pass: 'C1-only compilation ✓' },
      { re: '-XX:\\+UseSerialGC', must: true, hint: 'Add -XX:+UseSerialGC (note the plus: it is a boolean flag).', pass: 'Serial collector ✓' },
      { re: 'PrintFlagsFinal', must: true, hint: 'java -XX:TieredStopAtLevel=1 -XX:+PrintFlagsFinal -version | grep TieredStopAtLevel', pass: 'reads the final flag value ✓' },
      { re: 'jcmd\\s+\\S+\\s+VM\\.flags', must: true, hint: 'jcmd <pid> VM.flags lists a running JVM\'s non-default flags.', pass: 'inspects a running JVM ✓' },
      { re: 'UseParallelGC|UseG1GC', must: false, hint: 'Do not select a second collector next to UseSerialGC: two collectors is a conflict and the JVM will not start.', pass: 'one collector only ✓' },
      { re: 'ANSWER\\s*:\\s*\\S+', must: true, hint: 'Answer: MAVEN_OPTS configures the JVM running Maven itself; Surefire forks a separate JVM for the tests, whose flags come only from argLine.', pass: 'explains the forked JVM ✓' }
    ],
    run: 'Run <code>mvn test</code> once without and once with the new argLine, and confirm the flags arrived by attaching <code>jcmd &lt;pid&gt; VM.flags</code> to the forked JVM while it runs (find the PID with <code>jcmd</code> alone, which lists Java processes — the Surefire one runs <code>surefirebooter</code>). Then try adding <code>-XX:+UseParallelGC</code> next to <code>-XX:+UseSerialGC</code> and watch the JVM refuse to start. Do not judge the speed from one run each; the next lesson is about doing that properly.',
    solution: `<!-- (1) The forked test JVM gets its flags from argLine. @{argLine} keeps JaCoCo's agent. -->
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-surefire-plugin</artifactId>
  <version>3.2.5</version>
  <configuration>
    <argLine>@{argLine} -XX:TieredStopAtLevel=1 -XX:+UseSerialGC</argLine>
  </configuration>
</plugin>
<!-- One-off alternative without editing the POM (note: this REPLACES argLine,
     so it would drop the JaCoCo agent in this project):
     mvn test -DargLine="-XX:TieredStopAtLevel=1 -XX:+UseSerialGC" -->

<!-- (2) Final value after ergonomics and the command line:
     java -XX:TieredStopAtLevel=1 -XX:+UseSerialGC -XX:+PrintFlagsFinal -version | grep -E "TieredStopAtLevel|UseSerialGC" -->

<!-- (3) Flags of a running JVM (e.g. the forked Surefire JVM, found with plain "jcmd"):
     jcmd 12345 VM.flags
     jcmd 12345 VM.flags -all     # every flag, not only the non-default ones -->

<!-- ANSWER: mvn test runs two JVMs. MAVEN_OPTS configures the one running Maven itself.
     Surefire forks a separate JVM to run the tests (forkCount=1 by default), and that JVM
     takes its flags only from argLine. So the flag made Maven's own JVM compile with C1 only,
     and the tests ran exactly as before. Always verify inside the forked JVM - jcmd <pid>
     VM.flags, or print ManagementFactory.getRuntimeMXBean().getInputArguments() in a test. -->`,
    notes: [
      'Prefer the POM over -DargLine on the command line when the project already has an argLine: the command-line property replaces it, and coverage quietly stops working.',
      'PrintFlagsFinal answers for the JDK you run it with. Run it with the same JDK the tests use, or you are reading another JVM\'s defaults.',
      'Before you measure anything, make sure every test still produces the same outcome under the new flags. A faster run with a different set of failures is a different program.'
    ]
  },
  quiz: [
    {
      q: 'Which command shows the final value of every JVM flag, including the ones ergonomics chose?',
      options: ['java -XX:+PrintFlagsFinal -version', 'java -Xmx -version', 'javac -verbose', 'mvn help:effective-pom'],
      correct: 0,
      explain: 'PrintFlagsFinal lists every flag with its final value and its origin. The last column names the origin: {default}, {ergonomic} (the JVM chose it from the machine it woke up on) or {command line} (you set it).'
    },
    {
      q: 'What does -XX:TieredStopAtLevel=1 do?',
      options: ['Compiles hot methods with C1 only, without profiling, and never uses C2 — faster start-up, lower peak speed', 'Disables the JIT completely so everything runs in the interpreter', 'Uses only C2, skipping C1', 'Limits the heap to one gigabyte'],
      correct: 0,
      explain: 'Level 1 is C1 code with no profiling. Methods get cheap, quick machine code and C2 never runs — the right trade for a short-lived test JVM, the wrong one for a long-running server. Franky\'s "first gear, no fine-tuning" lever.'
    },
    {
      q: 'You export MAVEN_OPTS="-XX:+UseSerialGC" and run mvn test. Which JVM uses the Serial collector?',
      options: ['Only the JVM running Maven itself; the forked test JVM is configured by Surefire\'s argLine', 'Both Maven\'s JVM and the forked test JVM', 'Only the forked test JVM', 'Neither, because MAVEN_OPTS only accepts -X flags'],
      correct: 0,
      explain: 'Surefire forks a separate JVM for the tests, and its flags come from argLine. MAVEN_OPTS configures the build JVM — Zoro setting the Sunny\'s levers for the Mini Merry\'s runs.'
    },
    {
      q: 'What happens if you start a JVM with both -XX:+UseSerialGC and -XX:+UseParallelGC?',
      options: ['The JVM refuses to start — selecting two collectors is a conflict', 'It uses whichever flag came last', 'It alternates between the two collectors', 'It silently falls back to G1'],
      correct: 0,
      explain: 'You choose exactly one collector. Conflicts like this are why any configuration search validates candidates first: java <flags> -version costs a second, a wasted test run costs minutes.'
    },
    {
      q: 'A configuration search reports that -XX:+UseCompressedOops helps. Why should you check PrintFlagsFinal before believing it?',
      options: ['Compressed oops is already on by default for heaps under about 32 GB, so "enabling" it may change nothing — any measured difference could be noise', 'Compressed oops only works on Windows', 'The flag disables garbage collection', 'PrintFlagsFinal turns the flag off'],
      correct: 0,
      explain: 'A flag that is already at the value you set is a no-op. Raj\'s energy-saver mode had been on since 2007. Read the final configuration, then attribute effects only to flags that actually changed something.'
    }
  ],
  testFlow: {
    title: 'Test yourself: which lever, on which JVM?',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'Your test suite runs in about 30 seconds per module. Which change is most likely to reduce JIT overhead there?',
        choices: [
          { text: '-XX:TieredStopAtLevel=1, because the profiling and C2 compiles never pay off in such a short run', to: 'q1_right' },
          { text: '-XX:-TieredCompilation, so methods go straight to the best compiler', to: 'q1_wrong_c2' },
          { text: '-XX:+AlwaysPreTouch, so memory is ready in advance', to: 'q1_wrong_touch' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Right. Stopping at level 1 gives fast, unprofiled C1 code and skips C2 entirely. Start-up-heavy, short-lived JVMs are exactly where that trade wins — and why compilation rates were the strongest predictors of testing time in PROBO.' },
      q1_wrong_c2: { end: true, correct: false, text: 'Turning tiered compilation off sends hot methods from the interpreter straight to C2, which is slow to compile and needs profiling first. It warms up more slowly — the opposite of what a short run needs.' },
      q1_wrong_touch: { end: true, correct: false, text: 'AlwaysPreTouch touches every page of the heap at start-up. That smooths a long-running server and is pure extra start-up cost for a 30-second test JVM.' },
      q2: {
        qid: 'q2',
        q: 'The project already sets argLine for the JaCoCo agent. How do you add -XX:+UseSerialGC for the tests?',
        choices: [
          { text: '<argLine>@{argLine} -XX:+UseSerialGC</argLine> in the Surefire configuration', to: 'q2_right' },
          { text: 'mvn test -DargLine="-XX:+UseSerialGC"', to: 'q2_wrong_replace' },
          { text: 'export MAVEN_OPTS="-XX:+UseSerialGC"', to: 'q2_wrong_opts' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Exactly. @{argLine} is Surefire\'s late replacement, so the JaCoCo agent stays and your flag is appended. Then confirm with jcmd <pid> VM.flags on the forked JVM.' },
      q2_wrong_replace: { end: true, correct: false, text: 'That reaches the test JVM, but it REPLACES the existing argLine, so the JaCoCo agent disappears and coverage silently stops. Append with @{argLine} instead.' },
      q2_wrong_opts: { end: true, correct: false, text: 'MAVEN_OPTS configures the JVM running Maven. The tests run in the JVM Surefire forks, which never sees it.' },
      q3: {
        qid: 'q3',
        q: 'A colleague claims their search found a 6% speed-up from -XX:+UseCompressedOops on an 8 GB heap. What do you check first?',
        choices: [
          { text: 'PrintFlagsFinal without the flag: compressed oops is already on by default under about 32 GB, so the flag probably changed nothing and the 6% is noise or another flag', to: 'q3_right' },
          { text: 'Nothing — a measured speed-up is a measured speed-up', to: 'q3_wrong_trust' },
          { text: 'Whether the heap should be raised to 64 GB to get more benefit', to: 'q3_wrong_heap' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Yes. If the final value is the same with and without the flag, the flag cannot be the cause. That points to noise, to another flag in the same configuration, or to a flaw in the measurement — the subject of the next lesson.' },
      q3_wrong_trust: { end: true, correct: false, text: 'A single measured difference can be noise, and a flag that does not change the final configuration cannot cause anything. Check the final configuration first, then measure with repeated runs.' },
      q3_wrong_heap: { end: true, correct: false, text: 'Above about 32 GB compressed oops cannot be used at all, so that would turn the feature OFF. The first question is whether the flag changed anything in the first place.' }
    }
  },
  pitfalls: [
    'Setting flags in MAVEN_OPTS and concluding they "do nothing". MAVEN_OPTS configures Maven\'s own JVM; the tests run in the JVM Surefire forks, configured by argLine (or jvmArgs in Gradle).',
    'Replacing argLine with -DargLine="..." in a project that already uses it, and silently dropping the JaCoCo coverage agent. Append with @{argLine} in the POM — and if nothing defines an argLine property, declare an empty one in <properties>, or the literal text @{argLine} reaches the JVM and the fork fails.',
    'Assuming defaults are the same everywhere. Ergonomics picks the collector, heap size and thread counts from the CPUs and memory it sees — including container limits — so a laptop and a CI runner can run different JVMs from the same command line.',
    'Crediting a flag that changed nothing. UseCompressedOops is already on under about 32 GB; many flags are already at the value you set. Compare PrintFlagsFinal with and without the flag before attributing a speed-up to it.',
    'Selecting two collectors, or using a flag that does not exist in this JDK (CMS was removed in JDK 14). The JVM refuses to start — so validate every candidate with java <flags> -version before spending a test run on it.',
    'Using -XX:+IgnoreUnrecognizedVMOptions to make errors go away. It makes typos and removed flags silently do nothing, so you measure a configuration that is not the one you think.',
    'Copying server tuning advice into test runs. AlwaysPreTouch, full tiered compilation and pause-oriented collectors help long-running services and can make a twenty-second test JVM slower.',
    'Accepting a faster configuration without checking test outcomes. If any test now passes, fails, errors or skips differently, the configuration changed behaviour and must be rejected.'
  ],
  interview: [
    {
      q: 'How would you find out what JVM configuration your CI test runs actually use?',
      a: 'I would not trust the build file alone, because the effective configuration combines the command line with ergonomics, and ergonomics depends on the machine — CPU count, memory and container limits. First I would find where flags reach the test JVM: Maven Surefire\'s argLine, or jvmArgs in Gradle, plus anything in JAVA_TOOL_OPTIONS, which reaches every JVM. MAVEN_OPTS only affects Maven\'s own JVM. Then I would verify from inside the forked JVM. On the CI runner, jcmd lists Java processes and jcmd <pid> VM.flags shows the non-default flags of the Surefire JVM; alternatively a tiny test prints ManagementFactory.getRuntimeMXBean().getInputArguments(), the collector bean names, and selected flag values with their origin via HotSpotDiagnosticMXBean. For a complete picture, java -XX:+PrintFlagsFinal -version with the same JDK and the same flags shows every value and marks the ones ergonomics changed. Only after that would I compare performance between environments, because two machines can run genuinely different JVMs from the same command.'
    },
    {
      q: 'Why might the same JVM flag speed up a test suite but slow down a production service?',
      a: 'Because most flags move cost rather than remove it, and the two workloads pay different costs. A test JVM usually lives for seconds to a few minutes: its time goes on start-up, class loading, interpretation and JIT compilation, and it may finish before compiled code has paid for itself. A service lives for days, so steady-state speed dominates and start-up is noise. -XX:TieredStopAtLevel=1 is the clearest example: it stops after C1 with no profiling, so compile work drops and short runs get faster, but C2\'s optimisations never arrive, so a long-running service ends up slower. Collector choice is similar: Serial or Parallel can beat G1 on a short run with a modest heap because they carry less bookkeeping, while a latency-sensitive service needs G1\'s pause control. AlwaysPreTouch improves a service\'s steady state and only adds start-up cost to a test. So flags should be tuned per workload and validated by measuring the workload you care about.'
    },
    {
      q: 'What constraints would you put on an automated search for faster JVM configurations?',
      a: 'Four. Validity first: every candidate must start — java <flags> -version — and must respect known dependencies and conflicts, such as exactly one collector and only flags that exist in this JDK version. That check costs a second and saves a test run. Correctness second: the configuration must produce the same outcome for every test as the default — pass, fail, error or skip — because a faster run that behaves differently is not an optimisation; flaky tests must be excluded, or they will make this check meaningless. Bounded cost third: a timeout, for example twice the default testing time, so a pathological configuration cannot hang the search. And honest measurement: repeated runs per configuration and a statistical comparison against the default rather than a single timing. Those are the constraints PROBO applies, and they matter more than the cleverness of the search itself.'
    },
    {
      q: 'Explain compressed oops and TLABs, and why they show up in performance discussions.',
      a: 'An oop is an ordinary object pointer — a reference from one Java object to another. On a 64-bit JVM a raw reference is 64 bits. Compressed oops store references as 32-bit offsets from the heap base, scaled by object alignment, which lets a heap of up to about 32 GB be addressed with half-size references. That shrinks objects, improves cache behaviour and reduces GC work, so it is enabled by default whenever the heap is small enough; setting -XX:+UseCompressedOops explicitly therefore usually changes nothing. TLABs are thread-local allocation buffers: each thread gets a private chunk of the young generation and allocates by bumping a pointer, with no lock and no contention, falling back to a slower shared path only when the buffer runs out or the object is large. They are why allocation in Java is so cheap, and why a profiler reports "allocations inside TLABs" versus "outside" — the share served from TLABs is one of the runtime metrics a tool like PROBO extracts from JFR.'
    }
  ]
};
