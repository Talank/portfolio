window.LESSONS = window.LESSONS || {};
window.LESSONS['jvm-config-search-probo'] = {
  id: 'jvm-config-search-probo',
  title: 'Tuning Test Runs with JVM Flags: JFR Metrics, Honest Measurement & Configuration Search (Reading PROBO)',
  category: 'Part 2 — The JVM, Deeply',
  timeMin: 60,
  summary: 'The previous lesson taught what JVM flags control. This one teaches how to use them on a real test suite without fooling yourself, and how to read the research that does it at scale — in particular PROBO (Profiling-Guided Bayesian Optimization of JVM Configurations, ISSTA 2026), which cut testing time by 10.7% on average across 16 projects, and by up to 27.4%, without running a single test fewer. You will configure Java Flight Recorder as a measuring instrument rather than a debugger — including the thresholds and sampling periods that silently make a naive recording report zero compilations — and turn its events into the kind of runtime metrics PROBO uses: GC count and pauses, C1 and C2 compilation rates, CPU, class loading, TLAB efficiency, safepoints. Then you will measure a speed-up the way a paper must: repeated runs, a non-parametric test, an effect size, identical test outcomes. Finally you will see why random search is a hard baseline, how Bayesian optimization searches with a model, and what PROBO adds by predicting time through runtime behaviour: flags → metrics → testing time.',
  goals: [
    'Record a forked test JVM with JFR using a custom .jfc, and explain why event thresholds and periods can make a naive recording report zero compilations',
    'Compute runtime metrics from a recording — GC count and pause, C1/C2 compilation counts and rates, CPU, classes loaded, TLAB share, safepoints — with the jfr tool and with jdk.jfr.consumer.RecordingFile',
    'Measure a testing-time reduction honestly: repeated runs, Mann–Whitney U, Vargha–Delaney A12, identical test outcomes, a timeout',
    'Explain random search, Bayesian optimization (surrogate model plus expected improvement) and BOCA\'s flag-importance exploration',
    'Explain PROBO\'s decomposition (flags → metrics → testing time), its importance propagation, and its main results, and read a configuration-tuning paper critically'
  ],
  concept: [
    {
      h: 'The question: same tests, same outcomes, less time',
      p: [
        'Most ways of making regression testing cheaper run fewer tests: regression test selection picks the tests affected by a change, test-suite reduction deletes redundant ones. Both risk missing a fault that a skipped test would have caught. Tuning the JVM attacks the cost from the other side: every test still runs, unchanged, and only the virtual machine underneath is configured differently. In the authors\' earlier work, the right combination of flags reduced test-suite time by up to 43.9% with no change to code, tests, or the set of tests run. The catch, as the previous lesson showed, is the search: 72 relevant flags on Java 11, up to 2<sup>72</sup> combinations, dependencies and conflicts, non-linear interactions, and good configurations rare enough that random search is a hard baseline.',
        'PROBO\'s idea is to stop treating the test suite as a black box. A flag cannot change testing time directly — it changes what the JVM does: how much it compiles, how often it collects garbage, how much it allocates, how many threads it runs. Those behaviours are observable, cheaply, with JFR. So PROBO learns two smaller relationships instead of one opaque one: how flags change runtime metrics, and how runtime metrics change testing time. To read that paper — or to do the same thing on your own project — you need three skills: recording the right metrics, measuring time honestly, and searching with a model. This lesson takes them in that order.'
      ]
    },
    {
      h: 'JFR as a measuring instrument: thresholds, periods and a custom .jfc',
      p: [
        'JFR does not record everything that happens; it records what its configuration asks for. A <b>.jfc</b> file (the JDK ships <code>default.jfc</code>, about 1% overhead, and <code>profile.jfc</code>, about 2%, in <code>$JAVA_HOME/lib/jfr/</code>) enables events and gives each one a <b>threshold</b> or a <b>period</b>. A threshold means "record this only if it lasted longer than X": <code>jdk.Compilation</code> has a 100 ms threshold in <code>profile.jfc</code> and a full second in <code>default.jfc</code>, because the configuration was designed to catch pathologically slow compilations, not to count them. A period means "sample this every X": <code>jdk.CPULoad</code> and <code>jdk.ClassLoadingStatistics</code> are emitted once per second. So a short test JVM recorded with the stock settings can report zero compilations, no CPU samples and no class statistics — not because nothing happened, but because nothing qualified. We measured exactly that on a sorting workload: <code>settings=profile</code> recorded 0 compilation events; lowering the threshold to 0 ms recorded more than 250.',
        'The portable fix is your own settings file. Copy <code>profile.jfc</code>, set the <code>jdk.Compilation</code> threshold to <code>0 ms</code>, shorten the periods of the statistics you need to <code>100 ms</code>, and enable the allocation events you want (on JDK 16 and later <code>jdk.ObjectAllocationInNewTLAB</code> is off by default). Then point the recording at it: <code>-XX:StartFlightRecording=filename=tests.jfr,settings=/abs/path/tests.jfc</code>. JDK 17 and later also accept single overrides inline — <code>-XX:StartFlightRecording=settings=profile,jdk.Compilation#threshold=0ms</code> — and offer <code>jfr configure</code> to build a .jfc; JDK 11, the version PROBO targets, rejects the inline form and the JVM fails to start, so the copied .jfc is the version-independent route. With <code>filename=</code> set, the recording is written when the JVM exits, which is exactly what a forked test JVM needs. Put the whole option in Surefire\'s <code>argLine</code>, not in <code>MAVEN_OPTS</code>.'
      ]
    },
    {
      h: 'From events to metrics',
      p: [
        'A metric is a number you compute from events. Count <code>jdk.GarbageCollection</code> events for the GC count, and add their <code>sumOfPauses</code> for total pause time. Read <code>compileLevel</code> on each <code>jdk.Compilation</code>: levels 1 to 3 are C1 code and level 4 is C2, so counting each and dividing by the recording\'s length gives the C1, C2 and total compilation rates — the metrics PROBO found most predictive of testing time. Average <code>jvmUser</code> and <code>jvmSystem</code> over <code>jdk.CPULoad</code> samples for CPU; take the last <code>loadedClassCount</code> from <code>jdk.ClassLoadingStatistics</code>; compare allocations sampled inside new TLABs with those outside for TLAB efficiency; count <code>jdk.SafepointBegin</code> for safepoint frequency. PROBO extracts 44 such metrics in seven categories — memory, CPU, threading, compilation, GC, I/O, and other (TLAB efficiency, safepoints) — 18 of them derived from the explicitly reported ones.',
        'You can do this from the command line with <code>jfr summary tests.jfr</code> (event counts per type) and <code>jfr print --events jdk.GarbageCollection --json tests.jfr</code>, or in Java with <code>jdk.jfr.consumer.RecordingFile.readAllEvents(path)</code> and accessors such as <code>getInt("compileLevel")</code> and <code>getDuration("sumOfPauses")</code> — the program in this lesson does exactly that. One methodological detail from the paper is worth copying: PROBO times each configuration over five runs <i>without</i> the profiler, and makes one additional run <i>with</i> JFR to collect metrics. The recording is cheap, but cheap is not free, and it never contaminates the timings it is meant to explain.',
        'The example shows why metrics are worth having. On a small sorting workload, <code>-XX:TieredStopAtLevel=1 -XX:+UseSerialGC</code> cut C2 compilations from 70 to 0 and compile time from about 300 ms to under 30 ms — and also roughly tripled the number of garbage collections. A single timing would have told you only the net result; the metrics tell you which cost went down, which went up, and therefore which flag to keep.'
      ]
    },
    {
      h: 'Measuring a speed-up honestly',
      p: [
        'Test-suite time is noisy. JIT compilation runs on background threads and finishes in a different order each run; the operating system schedules other processes; disk caches are warm or cold; CPU frequency changes with temperature. A single faster run proves nothing. PROBO runs every configuration five times, in a Docker container limited to 2 CPUs and 8 GB of memory so that the environment does not drift, and compares the <i>distribution</i> of times against the default\'s. The reduction it reports is (mean default time − mean best time) / mean default time, and it is reported only if it is positive and statistically significant; otherwise the answer is 0, meaning "keep the default".',
        'The test is <b>Mann–Whitney U</b>, which asks whether one sample tends to be smaller than another without assuming the times are normally distributed — they often are not, with occasional slow outliers. It is worth knowing how demanding it is with small samples: with five runs per configuration there are 25 cross-pairs, and an exact two-sided p below 0.05 requires that at most two of those 25 pairs go the "wrong" way. Significance alone says nothing about size, so the paper adds the <b>Vargha–Delaney A12</b> effect size: the probability that a randomly chosen run of one configuration is slower than a randomly chosen run of the other, where 0.5 means no difference, and the conventional thresholds for small, medium and large effects are about 0.56, 0.64 and 0.71.',
        'Two more rules make a result trustworthy. <b>Outcome preservation</b>: every test must have the same outcome — pass, fail, error or skip — as under the default configuration, otherwise the configuration is discarded, however fast it is; flaky tests have to be excluded first, or this check becomes a coin toss. And a <b>timeout</b>: PROBO stops any run that takes more than twice the default testing time, so one pathological configuration cannot stall the search.'
      ]
    },
    {
      h: 'Searching the space: random search and Bayesian optimization',
      p: [
        '<b>Random search</b> samples valid configurations — respecting dependencies and conflicts — and keeps the best. It sounds naive, and it is a strong baseline here, because good configurations are rare and scattered and random search cannot be misled by a wrong model. <b>Bayesian optimization</b> (BO) is built for expensive black-box functions like "run this test suite five times": it keeps a <b>surrogate model</b> that predicts the objective from the inputs — Gaussian processes and random forests are common choices — and uses an <b>acquisition function</b> to pick the next configuration. <b>Expected improvement</b> (EI) scores a candidate by how much it is expected to beat the best result so far, taking the model\'s uncertainty into account, so it balances exploitation (candidates predicted to be good) with exploration (candidates the model is unsure about). Then the chosen configuration is measured, the model is retrained, and the loop repeats until the budget runs out.',
        '<b>BOCA</b>, a BO method from compiler autotuning and PROBO\'s main baseline, trains a random forest from flags directly to time, ranks flags by the forest\'s feature importance, enumerates all 2<sup>k</sup> combinations of the top-k flags as base configurations, and perturbs the remaining flags around each base, with a neighbourhood that shrinks as the search proceeds — wide exploration early, narrow exploitation late. Its weakness on JVM flags is the one PROBO targets: with only a few dozen measured configurations, a direct flags-to-time model struggles to tell flags that truly matter from flags that merely happened to correlate with fast runs.'
      ]
    },
    {
      h: 'PROBO: flags → metrics → testing time',
      p: [
        'PROBO splits the prediction in two. A <b>metrics model</b> is one random forest per selected metric, predicting that metric from the flag vector; a <b>performance model</b> is a single random forest predicting testing time from the (standardised) metrics. Metrics are first filtered by Kendall\'s τ: those with |τ| below 0.3 against testing time, or constant across configurations, are dropped. A candidate\'s time is predicted by running its flags through the metrics models and the results through the performance model. Flag importance is propagated through both: a flag matters to the degree that it moves metrics that matter, IF(f) = (1/Z) Σ<sub>j</sub> FI(f → m<sub>j</sub>) × IM(m<sub>j</sub>), normalised to sum to 1.',
        'Candidates come from three strategies driven by those importance scores — BOCA-style systematic exploration around the top-k flags (k = 8), weighted random sampling that favours important flags, and every non-empty combination of the top-k flags — all filtered for dependencies, conflicts and repeats, then ranked by expected improvement, with the top three measured per iteration. Under a budget of 20 configurations per project (5 random, 5 iterations of 3, plus the default), PROBO reduced testing time by 10.7% on average across 16 Maven projects, against 5.8% for random search and 4.3% for BOCA, and found a significant reduction for every project, up to 27.4%. With a one-hour search budget it still averaged 8.0%, and its configurations kept an 8.8% average reduction across about 88 later commits per project. The most consistently important metrics were the JIT\'s — total and C1 compilation rate made up 67.2% of them — which is the previous lesson\'s point about short-lived JVMs, confirmed by measurement.',
        'Reading such a paper critically means asking the questions this lesson has prepared: which JDK and which environment (Java 11, single-module Maven projects, 2 CPUs); how many runs and which statistics; whether outcomes were preserved and flaky projects excluded; whether the search cost is counted (the one-hour budget answers that); and whether the gains survive code changes (the later-commit experiment answers that). The paper names its own limits too — other Java versions and multi-module projects are open questions.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Nami\'s logbook and Robin\'s gauges',
      text: 'Franky\'s seventy-two levers are back, and the crew has a schedule of short hops to run every day, so the question is no longer what each lever does but which combination makes the hops fastest. Usopp tries a combination once, arrives four minutes early, and declares victory. Nami refuses to write it in the log. One crossing proves nothing at sea — a following wind, a calm current, a lucky tide — so she sails each combination five times and compares the whole set of times with the old ones, and she only writes "faster" when the two sets barely overlap (repeated runs and the Mann–Whitney test: with five runs each, at most two of the twenty-five cross-pairs may go the wrong way). She has one more rule: the ship must arrive at every island it used to reach; a setting that skips a port is not faster, it is a different voyage (outcome preservation — every test must keep its result). Even so, with seventy-two levers there are more combinations than grains of sand on every island they will ever visit, and sailing them at random finds a good one only by luck (random search: a strong baseline precisely because good configurations are rare). Robin\'s contribution is to stop staring at the arrival clock. A lever cannot make the ship arrive earlier by itself; it changes what the engine does — how hot it runs, how often the crew has to pump the bilge — and the engine\'s gauges are easy to read on every trip. So Robin learns two simple things instead of one impossible one: which levers move which gauges, and which gauges move the arrival time. A lever matters exactly as much as the gauges it moves matter (PROBO: flags → metrics → testing time, with flag importance propagated through both models). The gauge that turns out to matter most is the engine\'s tuning gauge — how much fine-tuning it does at the start of every hop (compilation rate). And before any of this works, Robin has to fix the gauges themselves: the old engine-room dial only registered tuning sessions longer than a minute, so on short hops it read zero every time (JFR thresholds: profile.jfc records only compilations over 100 ms, so a short test JVM can show none until you set the threshold to 0 ms).',
    },
    sitcom: {
      show: 'Friends',
      title: 'Rachel\'s trifle was faster, and it was not a trifle',
      text: 'Monica is trying to get Thanksgiving on the table sooner, and everyone has advice. Joey once turned the oven to its maximum and the turkey was "done really fast," which settles it for him (one run, no repetitions, no comparison — and the one time he did it, it was a small turkey). Monica, being Monica, cooks the same dish five times at each setting and compares the times, because her oven runs hot on some days and cold on others (variance; compare distributions, not a single number). Chandler\'s contribution is unexpectedly scientific: stop watching only the kitchen timer and start watching the thermometer and how often she has to open the oven door — the timer tells you how long it took, the gauges tell you why (runtime metrics as the middle layer between settings and time). Then Rachel arrives with a dessert she made "in half the usual time," and it is half traditional trifle and half shepherd\'s pie, because two pages of the cookbook were stuck together. It was faster. It was not the same dish. Nobody is allowed to count it (outcome preservation: a configuration that changes any test\'s result is rejected, however fast). And Ross, who wanted to try every combination of oven temperature, rack position, fan setting and timer, is gently informed that there are more combinations than Thanksgivings left in their lives (the search space; you need a model that learns from the dinners you have already cooked — Bayesian optimization).',
    },
    why: 'Usopp\'s single early arrival and Joey\'s one fast turkey are single runs; Nami\'s five crossings and Monica\'s repeated dishes are repeated measurements compared as distributions, which is what Mann–Whitney U and A12 formalise. The rule that the ship must reach every port, and that Rachel\'s half-shepherd\'s-pie trifle does not count, is outcome preservation: every test must keep its result. Seventy-two levers and Ross\'s combinations are the search space, too big to try. Robin reading the gauges and Chandler watching the thermometer are PROBO\'s idea: flags move runtime metrics, metrics move testing time, so learn both and let importance flow through them. And the dial that only registered long tuning sessions is a JFR threshold — fix the instrument before trusting the reading.'
  },
  storyAnim: {
    title: 'From one lucky crossing to a model of the engine',
    h: 300,
    props: [
      { id: 'once', emoji: '🎲', label: 'One fast run: luck, not evidence', x: 12, y: 12 },
      { id: 'five', emoji: '📒', label: 'Five runs each; compare the distributions', x: 46, y: 12 },
      { id: 'ports', emoji: '🏝️', label: 'Every port still reached = same test outcomes', x: 82, y: 12 },
      { id: 'space', emoji: '🌌', label: '2^72 lever combinations: too many to try', x: 20, y: 46 },
      { id: 'dial', emoji: '🧭', label: 'Fix the dial first: JFR threshold 100 ms → 0 ms', x: 54, y: 46 },
      { id: 'gauges', emoji: '📈', label: 'Levers move gauges; gauges move time', x: 86, y: 46 },
      { id: 'importance', emoji: '⚖️', label: 'A lever matters as much as the gauges it moves', x: 28, y: 80 },
      { id: 'result', emoji: '🏁', label: 'PROBO: 10.7% faster on average, up to 27.4%', x: 74, y: 80 }
    ],
    actors: [
      { id: 'nami', emoji: '🗺️', label: 'Nami', x: 12, y: 30 },
      { id: 'robin', emoji: '📚', label: 'Robin', x: 54, y: 62 }
    ],
    steps: [
      { c: 'Usopp tries a lever combination once, arrives early, and declares victory. One run is a lucky tide, not evidence.', p: { once: 'bad' }, a: { nami: [12, 30] } },
      { c: 'Nami sails each combination five times and compares the two sets of times — Mann–Whitney U, plus the A12 effect size.', p: { five: 'good' }, a: { nami: [46, 30] } },
      { c: 'And the ship must still reach every port: a configuration that changes any test outcome is rejected, however fast.', p: { ports: 'good' }, a: { nami: [82, 30] } },
      { c: 'But seventy-two levers make up to 2^72 combinations. Random search finds good ones only by luck — though it is a hard baseline, because good ones are rare.', p: { space: 'bad' } },
      { c: 'Robin wants to read the engine\'s gauges — but the old dial only registered tuning sessions over a minute, so short hops read zero. JFR thresholds: set jdk.Compilation to 0 ms.', p: { dial: 'lit' }, a: { robin: [54, 62] } },
      { c: 'With working gauges, Robin learns two easy things: which levers move which gauges, and which gauges move arrival time. Flags → metrics → testing time.', p: { gauges: 'good' }, a: { robin: [86, 62] } },
      { c: 'A lever matters exactly as much as the gauges it moves matter. That propagated importance steers where the search looks next.', p: { importance: 'good' }, a: { robin: [28, 62] } },
      { c: 'Ranked by expected improvement and measured honestly, it beat random search and BOCA: 10.7% average reduction, up to 27.4%, and compilation rate was the gauge that mattered most.', p: { result: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'One iteration of profiling-guided configuration search',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Measure',
        nodes: [
          { id: 'time', text: '5 timed runs per config\nno profiler attached' },
          { id: 'profile', text: '1 extra run with JFR\ncustom .jfc, threshold 0 ms' }
        ]
      },
      {
        label: 'Model',
        nodes: [
          { id: 'metrics', text: 'flags → each metric\none random forest per metric' },
          { id: 'perf', text: 'metrics → testing time\none random forest' }
        ]
      },
      {
        label: 'Generate',
        nodes: [
          { id: 'importance', text: 'IF(flag) = Σ FI(flag→m) × IM(m)\nnormalised' },
          { id: 'candidates', text: '3 strategies, then filter\ndependencies, conflicts, repeats' }
        ]
      },
      {
        label: 'Select and check',
        nodes: [
          { id: 'ei', text: 'rank by expected improvement\nmeasure the top 3' },
          { id: 'check', text: 'same outcomes? under 2× timeout?\nelse discard, take next' }
        ]
      }
    ],
    steps: [
      { active: ['time'], note: 'Every configuration is timed over five runs, without the profiler, so the timings are not disturbed by the instrument that explains them. The default configuration is measured the same way.' },
      { active: ['profile'], note: 'One more run records JFR with settings that actually capture compilations and samples often enough for a short JVM. 44 metrics come out of it: memory, CPU, threading, compilation, GC, I/O, other.' },
      { active: ['metrics'], note: 'Metrics weakly related to testing time (Kendall |τ| < 0.3) or constant are dropped. For each remaining metric a random forest learns how the flags move it.' },
      { active: ['perf'], note: 'A single random forest learns how the standardised metrics move testing time. Together the two models predict a candidate\'s time: flags → metrics → time.' },
      { active: ['importance'], note: 'A flag is important if it strongly moves metrics that strongly predict time. The weighted sum through both models gives each flag one score, normalised to 1.' },
      { active: ['candidates'], note: 'Candidates come from BOCA-style exploration around the top-8 flags, importance-weighted random sampling, and every combination of the top-8 flags — all checked against dependencies, conflicts and earlier evaluations.' },
      { active: ['ei'], note: 'Expected improvement ranks the candidates, balancing predicted speed with uncertainty, and the top three are measured this iteration.' },
      { active: ['check'], note: 'A measured configuration must give every test the same outcome as the default and must finish within twice the default time. Otherwise it is discarded and the next-ranked candidate takes its place. Then the models are retrained and the loop repeats.' }
    ]
  },
  tech: [
    {
      q: 'How do you record JFR metrics for a test suite run by Maven, and what can go wrong?',
      a: 'Surefire forks the test JVM, so the recording goes in argLine: <argLine>@{argLine} -XX:StartFlightRecording=filename=${project.build.directory}/tests.jfr,settings=/abs/path/tests.jfc</argLine>, or the equivalent -DargLine on the command line. With filename set, the recording is written when the JVM exits. Three things go wrong. First, MAVEN_OPTS records the wrong JVM — Maven itself. Second, the stock settings are designed for diagnosis, not counting: jdk.Compilation has a 100 ms threshold in profile.jfc and 1 s in default.jfc, and statistics such as jdk.CPULoad and jdk.ClassLoadingStatistics are sampled only once a second, so a short JVM can report zero compilations and no samples. Copy profile.jfc, set the compilation threshold to 0 ms, shorten the periods you need, enable the allocation events you want (jdk.ObjectAllocationInNewTLAB is off by default from JDK 16), and pass the file with settings=. JDK 17 and later also accept inline overrides like jdk.Compilation#threshold=0ms and offer jfr configure, but JDK 11 rejects the inline form and fails to start. Third, if forkCount is greater than one, several JVMs would write the same file, so give each its own name or run one fork for the profiled run. And keep the profiled run separate from the timed runs.'
    },
    {
      q: 'Which JFR events give you GC, JIT and CPU metrics, and how do you compute them?',
      a: 'jdk.GarbageCollection is emitted once per collection, so counting events gives the GC count, and summing the sumOfPauses field gives total pause time (longestPause gives the worst one). jdk.Compilation is emitted per compilation with a compileLevel field: levels 1–3 are C1 code and level 4 is C2, so counting by level and dividing by the recording length gives C1, C2 and total compilation rates; the event duration gives compile time, and the field succeded (spelled that way) says whether it worked. jdk.CPULoad samples jvmUser, jvmSystem and machineTotal, which you average. jdk.ClassLoadingStatistics carries loadedClassCount. jdk.JavaThreadStatistics gives active, daemon and peak thread counts. jdk.ObjectAllocationInNewTLAB and jdk.ObjectAllocationOutsideTLAB sample allocations, and their ratio approximates TLAB efficiency. jdk.SafepointBegin counts safepoints, and jdk.FileRead, jdk.FileWrite, jdk.SocketRead and jdk.SocketWrite cover I/O, subject to their own thresholds. From the command line: jfr summary for counts, jfr print --events <name> --json for the fields. In Java: RecordingFile.readAllEvents(path), then getInt, getLong, getFloat and getDuration on each RecordedEvent.'
    },
    {
      q: 'How do you decide whether a JVM configuration really makes the test suite faster?',
      a: 'Treat time as a distribution. Run the default and the candidate several times each under the same controlled environment — PROBO uses five runs per configuration in a container limited to 2 CPUs and 8 GB. Compare the samples with the Mann–Whitney U test, which does not assume normally distributed times; with five runs each, a two-sided p below 0.05 requires that at most two of the twenty-five cross-pairs go the wrong way, so only clear separations pass. Report an effect size as well, such as Vargha–Delaney A12, the probability that a random run of one configuration is slower than a random run of the other (0.5 means no difference; about 0.56, 0.64 and 0.71 mark small, medium and large effects). Report the reduction relative to the default mean, and report zero if it is not significant. Two preconditions come before any of this: every test must have the same outcome as under the default, with flaky tests excluded beforehand, and runs that exceed a timeout (PROBO uses twice the default time) are discarded.'
    },
    {
      q: 'What is Bayesian optimization, and why does it suit configuration tuning?',
      a: 'Bayesian optimization is a sequential method for expensive black-box objectives. It keeps a surrogate model — often a Gaussian process or a random forest — that predicts the objective from the inputs along with some measure of uncertainty. An acquisition function chooses what to evaluate next; expected improvement scores each candidate by how much it is expected to beat the best result so far, so a candidate scores well either because it is predicted to be fast or because the model is uncertain enough that it might be. The chosen configuration is measured, the model is retrained, and the loop repeats until the budget is spent. That suits configuration tuning because each evaluation is expensive — a whole test suite, several times — and the relationship between configuration and time is unknown and non-linear, so you want every measurement to inform the next choice. BOCA adapts it to flags by ranking them with random-forest feature importance and exploring combinations of the top-k flags with a shrinking neighbourhood.'
    },
    {
      q: 'What does PROBO do differently from BOCA, and what did it find?',
      a: 'BOCA models testing time directly from flags. PROBO inserts runtime behaviour in the middle: one random-forest metrics model per selected JFR metric predicts that metric from the flags, and one random-forest performance model predicts testing time from the metrics; metrics are kept only if they relate to time (Kendall |τ| ≥ 0.3) and vary. Flag importance is the importance-weighted sum of each flag\'s effect on each metric, normalised. Candidates come from three importance-driven strategies, are filtered for dependencies, conflicts and repeats, and are ranked by expected improvement, with the top three measured per iteration, and any configuration that changes a test outcome or exceeds twice the default time is discarded. On 16 single-module Maven projects on Java 11, with 20 configurations per project, PROBO reduced testing time by 10.7% on average versus 5.8% for random search and 4.3% for BOCA, found a significant reduction for every project (up to 27.4%), kept 8.0% under a one-hour budget, and its configurations still gave 8.8% across about 88 later commits. JIT compilation metrics — total and C1 compilation rate — were the most consistently predictive, accounting for 67.2% of the consistently important metrics.'
    }
  ],
  code: {
    title: 'Turn a JFR recording into PROBO-style metrics',
    intro: 'Two pieces: a settings file that makes JFR record what a short-lived test JVM actually does, and a small program that turns the recording into metrics. Both were run on JDK 11 and 17. With the stock profile settings the same program prints zero compilations — which is the whole point of the first piece.',
    code: `// ---- 1) A settings file that counts every compilation and samples often ----
//   cp "$JAVA_HOME/lib/jfr/profile.jfc" tests.jfc
//   sed -i -e '/<event name="jdk.Compilation">/,/<\\/event>/ s/>100 ms</>0 ms</' \\
//          -e '/<event name="jdk.CPULoad">/,/<\\/event>/ s/>1000 ms</>100 ms</' \\
//          -e '/<event name="jdk.ClassLoadingStatistics">/,/<\\/event>/ s/>1000 ms</>100 ms</' tests.jfc
//   (JDK 16+: also set "enabled" to true for jdk.ObjectAllocationInNewTLAB / OutsideTLAB)
//
// ---- 2) Record the forked test JVM (Surefire argLine, NOT MAVEN_OPTS) ----
//   mvn test -DargLine="-XX:StartFlightRecording=filename=target/tests.jfr,settings=$PWD/tests.jfc"
//   (JDK 17+ only: settings=profile,jdk.Compilation#threshold=0ms works inline; JDK 11 refuses it)

import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import jdk.jfr.consumer.RecordedEvent;
import jdk.jfr.consumer.RecordingFile;

/** ---- 3) Turn one recording into a handful of PROBO-style runtime metrics ---- */
public class JfrMetrics {

    public static void main(String[] args) throws Exception {
        long gcCount = 0, c1 = 0, c2 = 0, inTlab = 0, outsideTlab = 0, safepoints = 0;
        Duration gcPause = Duration.ZERO, compileTime = Duration.ZERO;
        double cpuUserSum = 0;
        int cpuSamples = 0;
        long classesLoaded = 0;
        Instant first = null, last = null;

        for (RecordedEvent e : RecordingFile.readAllEvents(Path.of(args[0]))) {
            if (first == null || e.getStartTime().isBefore(first)) first = e.getStartTime();
            if (last == null || e.getEndTime().isAfter(last)) last = e.getEndTime();
            switch (e.getEventType().getName()) {
                case "jdk.GarbageCollection":
                    gcCount++;
                    gcPause = gcPause.plus(e.getDuration("sumOfPauses"));
                    break;
                case "jdk.Compilation":
                    // Levels 1-3 are C1 code, level 4 is C2 (level 0 is the interpreter).
                    if (e.getInt("compileLevel") == 4) c2++; else c1++;
                    compileTime = compileTime.plus(e.getDuration());
                    break;
                case "jdk.CPULoad":
                    cpuUserSum += e.getFloat("jvmUser");
                    cpuSamples++;
                    break;
                case "jdk.ClassLoadingStatistics":
                    classesLoaded = Math.max(classesLoaded, e.getLong("loadedClassCount"));
                    break;
                case "jdk.ObjectAllocationInNewTLAB":   inTlab++;      break;
                case "jdk.ObjectAllocationOutsideTLAB": outsideTlab++; break;
                case "jdk.SafepointBegin":              safepoints++;  break;
                default: break;
            }
        }
        double seconds = Duration.between(first, last).toMillis() / 1000.0;
        System.out.printf("recording      %.1f s%n", seconds);
        System.out.printf("GC count       %d (total pause %d ms)%n", gcCount, gcPause.toMillis());
        System.out.printf("compilations   C1 %d, C2 %d, total %.1f per second (%d ms compiling)%n",
                c1, c2, (c1 + c2) / seconds, compileTime.toMillis());
        System.out.printf("C1 rate        %.1f per second%n", c1 / seconds);
        System.out.printf("CPU (user)     %.1f%%%n", cpuSamples == 0 ? 0 : 100 * cpuUserSum / cpuSamples);
        System.out.printf("classes loaded %d%n", classesLoaded);
        System.out.printf("TLAB share     %.2f of sampled allocations%n",
                inTlab + outsideTlab == 0 ? 0 : (double) inTlab / (inTlab + outsideTlab));
        System.out.printf("safepoints     %d%n", safepoints);
    }
}

/* What it printed on JDK 11 for a small sorting workload (your numbers will differ):

     default flags                          -XX:TieredStopAtLevel=1 -XX:+UseSerialGC
     GC count       10 (pause 20 ms)        GC count       31 (pause 56 ms)
     compilations   C1 188, C2 70           compilations   C1 171, C2 0
     compile time   302 ms                  compile time   27 ms

   One configuration moved cost from the JIT to the garbage collector. A single timing shows
   only the net effect; the metrics show which cost fell and which rose. */`,
    notes: [
      'Run it with the stock settings=profile first and look at the compilation line: on a short JVM it is often zero. That is not a bug in the program — the default threshold drops every compilation under 100 ms. Fix the instrument before trusting the reading.',
      'The sed commands only touch the setting inside each named event block, so the rest of profile.jfc stays as the JDK shipped it. Check the result with grep before recording, because a missed edit fails silently.',
      'Keep the profiled run separate from the timed runs, as PROBO does: time five runs without JFR, and record one extra run with it.',
      'getDuration("sumOfPauses") and getInt("compileLevel") are typed accessors. If a field name is wrong you get an exception, which is better than a silent zero; jfr print --events jdk.Compilation tests.jfr shows the real field names for your JDK.'
    ]
  },
  lab: {
    title: 'Profile a configuration properly',
    prompt: 'You want to know why <code>-XX:TieredStopAtLevel=1</code> changes your suite\'s run time. (1) Write the <code>argLine</code> (in the Surefire configuration) that records the forked test JVM with JFR into <code>target/tests.jfr</code> using your own settings file <code>tests.jfc</code>, keeping <code>@{argLine}</code>. (2) Write the <code>sed</code> line that sets the <code>jdk.Compilation</code> threshold in <code>tests.jfc</code> from <code>100 ms</code> to <code>0 ms</code>. (3) Complete <code>countC2</code> so that it counts only C2 compilations (compile level 4) from a recording. (4) In the ANSWER comment, explain why the recording should be made in a separate run from the five timed runs, and why a stock <code>settings=profile</code> recording can show zero compilations.',
    starter: `<!-- (1) pom.xml: record the FORKED test JVM with your own settings file -->
<configuration>
  <!-- argLine here -->
</configuration>

<!-- (2) In tests.jfc (a copy of $JAVA_HOME/lib/jfr/profile.jfc), set the jdk.Compilation threshold to 0 ms:
     sed ... -->

// (3) Count C2 compilations (compile level 4) in a recording.
import java.nio.file.Path;
import jdk.jfr.consumer.RecordedEvent;
import jdk.jfr.consumer.RecordingFile;

public class CountC2 {
    static long countC2(Path recording) throws Exception {
        long c2 = 0;
        for (RecordedEvent e : RecordingFile.readAllEvents(recording)) {
            // your code here
        }
        return c2;
    }
}

// Q: Why record JFR in a separate run from the timed runs, and why can a stock
//    settings=profile recording of a short test JVM show zero compilations?
// ANSWER:`,
    checks: [
      { re: '<argLine>\\s*@\\{argLine\\}', must: true, hint: 'Start the argLine with @{argLine} so existing agents such as JaCoCo are kept.', pass: 'keeps existing argLine ✓' },
      { re: '-XX:StartFlightRecording', must: true, hint: 'The recording is started with -XX:StartFlightRecording=...', pass: 'starts JFR ✓' },
      { re: 'filename=\\S*tests\\.jfr', must: true, hint: 'Write the recording to target/tests.jfr with filename=.', pass: 'names the recording ✓' },
      { re: 'settings=\\S*tests\\.jfc', must: true, hint: 'Point settings= at your own tests.jfc, not at the stock profile.', pass: 'uses the custom settings ✓' },
      { re: 'sed[\\s\\S]*jdk\\.Compilation[\\s\\S]*0 ms', must: true, hint: "sed -i '/<event name=\"jdk.Compilation\">/,/<\\/event>/ s/>100 ms</>0 ms</' tests.jfc", pass: 'lowers the compilation threshold ✓' },
      { re: '"jdk\\.Compilation"', must: true, hint: 'Filter on the event type name: e.getEventType().getName().equals("jdk.Compilation")', pass: 'filters compilation events ✓' },
      { re: 'compileLevel', must: true, hint: 'Read the level with e.getInt("compileLevel") and count it when it equals 4.', pass: 'reads the compile level ✓' },
      { re: 'ANSWER\\s*:\\s*\\S+', must: true, hint: 'Answer: the profiler adds overhead, so it must not touch the timings it explains; and the stock compilation threshold is 100 ms, so shorter compilations are never recorded.', pass: 'explains the method ✓' }
    ],
    run: 'Compile with <code>javac CountC2.java</code> (JDK 11 or later). Record two runs of your suite, one with the default flags and one with <code>-XX:TieredStopAtLevel=1</code> added to the argLine, and run <code>countC2</code> on both: the second should report 0. Then record once more with the stock <code>settings=profile</code> and compare <code>jfr summary target/tests.jfr | grep jdk.Compilation</code> — on a short suite it may show no compilation events at all.',
    solution: `<!-- (1) Record the forked test JVM with your own settings file; keep existing agents -->
<configuration>
  <argLine>@{argLine} -XX:StartFlightRecording=filename=target/tests.jfr,settings=/home/me/project/tests.jfc</argLine>
</configuration>

<!-- (2) Count every compilation, not just the ones slower than 100 ms:
     cp "$JAVA_HOME/lib/jfr/profile.jfc" tests.jfc
     sed -i '/<event name="jdk.Compilation">/,/<\\/event>/ s/>100 ms</>0 ms</' tests.jfc
     grep -A3 '<event name="jdk.Compilation">' tests.jfc     # check the edit landed -->

// (3) Count C2 compilations.
import java.nio.file.Path;
import jdk.jfr.consumer.RecordedEvent;
import jdk.jfr.consumer.RecordingFile;

public class CountC2 {
    static long countC2(Path recording) throws Exception {
        long c2 = 0;
        for (RecordedEvent e : RecordingFile.readAllEvents(recording)) {
            // Levels 1-3 are C1 code; level 4 is C2.
            if (e.getEventType().getName().equals("jdk.Compilation") && e.getInt("compileLevel") == 4) {
                c2++;
            }
        }
        return c2;
    }

    public static void main(String[] args) throws Exception {
        System.out.println("C2 compilations: " + countC2(Path.of(args[0])));
    }
}

// ANSWER: JFR is cheap but not free, so a recording made during a timed run would add its own
// overhead to the very times it is meant to explain; PROBO times five runs without the profiler
// and records one extra run with it. And the stock settings are built for diagnosis, not
// counting: profile.jfc records a jdk.Compilation event only when the compilation took longer
// than 100 ms (default.jfc: 1 s), and a short test JVM performs hundreds of compilations that
// are all far shorter than that, so none of them qualifies. Setting the threshold to 0 ms in your
// own .jfc records every one, which is what a compilation-rate metric needs.`,
    notes: [
      'Use an absolute path for settings=, because Surefire may run the forked JVM from a different working directory than your shell.',
      'With forkCount above one, several JVMs would write the same filename. Make the profiled run use a single fork, or give each fork its own file.',
      'Compare the C2 counts with and without -XX:TieredStopAtLevel=1. The flag should take C2 to zero; if it does not, the flag never reached the forked JVM.'
    ]
  },
  quiz: [
    {
      q: 'A JFR recording of a 30-second test JVM, made with settings=profile, shows no jdk.Compilation events. What is the most likely reason?',
      options: ['profile.jfc records a compilation only if it took longer than 100 ms, and almost all compilations are much shorter — set the threshold to 0 ms in your own .jfc', 'The test JVM never compiles anything; tests always run interpreted', 'JFR cannot record the JIT on JDK 11', 'The recording was written by Maven\'s JVM instead'],
      correct: 0,
      explain: 'Thresholds filter events by duration. The stock settings are tuned to catch slow compilations, not to count them. Robin had to fix the dial that only registered long tuning sessions before the gauge meant anything.'
    },
    {
      q: 'In a jdk.Compilation event, which compileLevel means the method was compiled by C2?',
      options: ['4', '1', '0', '3'],
      correct: 0,
      explain: 'Level 0 is the interpreter, levels 1 to 3 are C1 code with no, limited or full profiling, and level 4 is C2. Counting by level gives the C1 and C2 compilation rates PROBO found most predictive.'
    },
    {
      q: 'With five timed runs for the default and five for a candidate, when does a two-sided Mann–Whitney test give p < 0.05?',
      options: ['Only when at most two of the 25 cross-pairs go the "wrong" way — the two sets must be almost completely separated', 'Whenever the candidate\'s mean is lower', 'Whenever the candidate\'s fastest run beats the default\'s fastest run', 'Never — five runs are not enough for any test'],
      correct: 0,
      explain: 'Exact enumeration of the 252 equally likely rankings shows U ≤ 2 gives two-sided p ≈ 0.032, while U = 3 already gives about 0.056. Nami wrote "faster" only when the two sets of crossing times barely overlapped.'
    },
    {
      q: 'A configuration makes the suite 15% faster, but two tests that used to pass now fail. What does PROBO do with it?',
      options: ['Discards it — every test must keep the outcome it has under the default configuration', 'Keeps it, because testing time is what is being optimised', 'Keeps it and marks the two tests as flaky', 'Averages its time with the default\'s'],
      correct: 0,
      explain: 'Outcome preservation comes before speed: a configuration that changes test behaviour is a different program. Rachel\'s half-shepherd\'s-pie trifle was faster, and it did not count.'
    },
    {
      q: 'What is the key modelling difference between PROBO and BOCA?',
      options: ['BOCA predicts testing time directly from flags; PROBO predicts runtime metrics from flags and testing time from metrics, and propagates importance through both', 'PROBO uses no model and searches randomly', 'BOCA measures runtime metrics with JFR and PROBO does not', 'PROBO only tunes garbage-collection flags'],
      correct: 0,
      explain: 'Decomposing flags → metrics → time lets PROBO learn from observable behaviour, so a flag counts as important when it moves metrics that matter — Robin reading the gauges instead of only the arrival clock.'
    }
  ],
  testFlow: {
    title: 'Test yourself: measuring and searching configurations',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'You record JFR in the same runs you time, and the "best" configuration has the lowest profiling overhead rather than the fastest tests. What went wrong?',
        choices: [
          { text: 'The instrument was in the measurement — time without the profiler and record one separate run', to: 'q1_right' },
          { text: 'Nothing; JFR overhead is part of real test time', to: 'q1_wrong_part' },
          { text: 'Use settings=default instead of profile in the timed runs', to: 'q1_wrong_default' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Yes. JFR is cheap but not free, and its cost varies with what the JVM does, so it can bias exactly the comparison you care about. PROBO times five runs without it and profiles one extra run.' },
      q1_wrong_part: { end: true, correct: false, text: 'Developers run their tests without a profiler attached, so the overhead is not part of the time you want to reduce. Keep the instrument out of the timed runs.' },
      q1_wrong_default: { end: true, correct: false, text: 'A lighter configuration is still an instrument in the measurement — and its 1-second compilation threshold would record almost nothing useful. Separate timing from profiling instead.' },
      q2: {
        qid: 'q2',
        q: 'Random search found a configuration 3% faster from one run of each. Should you adopt it?',
        choices: [
          { text: 'Not yet: run each configuration several times, check every test keeps its outcome, test significance and effect size, and report 0 if it is not significant', to: 'q2_right' },
          { text: 'Yes, 3% is a measured improvement', to: 'q2_wrong_yes' },
          { text: 'Yes, but only if it uses fewer flags than the default', to: 'q2_wrong_fewer' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Right. Run-to-run noise in a test suite is easily a few percent. Repeat, compare distributions with Mann–Whitney U, look at A12, and confirm outcomes are unchanged — then decide.' },
      q2_wrong_yes: { end: true, correct: false, text: 'One run each cannot separate a 3% effect from noise: JIT timing, scheduling and caches vary that much between identical runs. Usopp\'s early arrival was a lucky tide.' },
      q2_wrong_fewer: { end: true, correct: false, text: 'The number of flags is irrelevant to whether the speed-up is real. What matters is repeated measurement, a significance test, an effect size and unchanged outcomes.' },
      q3: {
        qid: 'q3',
        q: 'A flag barely changes any runtime metric, but in the training data it often appears in fast configurations. How does PROBO treat it compared with BOCA?',
        choices: [
          { text: 'PROBO gives it low importance, because importance flows through the metrics it moves; a direct flags-to-time model like BOCA\'s can be fooled by the correlation', to: 'q3_right' },
          { text: 'Both give it high importance, because it correlates with fast runs', to: 'q3_wrong_both' },
          { text: 'PROBO removes the flag from the search space permanently', to: 'q3_wrong_remove' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Exactly. IF(flag) is a sum over metrics of how much the flag moves each metric times how much that metric predicts time. A flag that moves nothing important scores low, which is how PROBO avoids chasing spurious correlations in small samples.' },
      q3_wrong_both: { end: true, correct: false, text: 'That is the weakness PROBO targets. With few measured configurations, a direct model can credit a flag that merely co-occurred with fast runs; propagating importance through the metrics demotes it.' },
      q3_wrong_remove: { end: true, correct: false, text: 'Low importance only makes the flag less likely to be sampled and keeps it out of the top-k combinations; it is not banned. Random and neighbourhood exploration can still try it.' }
    }
  },
  pitfalls: [
    'Trusting a stock JFR recording to count things. Compilation events below the threshold (100 ms in profile.jfc, 1 s in default.jfc) are never written, and once-a-second statistics may never fire in a short JVM. Use your own .jfc.',
    'Using the inline jdk.Compilation#threshold=0ms syntax on JDK 11. It only exists on JDK 17 and later; on 11 the JVM fails to start. The copied .jfc works everywhere.',
    'Recording in the same runs you time. The profiler adds overhead that can differ between configurations; time without it and record one extra run.',
    'Comparing single runs. Test-suite time varies by a few percent between identical runs; use several runs per configuration, a Mann–Whitney test and an effect size.',
    'Accepting a configuration that changes any test outcome, or measuring on a suite with flaky tests. Both make "faster" meaningless; exclude flaky tests and require identical outcomes.',
    'Reporting a speed-up without the search cost. A configuration found after ten hours of search is a different proposition from one found in one hour; PROBO reports both.',
    'Assuming a tuned configuration lasts forever. Code changes; re-measure periodically, as PROBO\'s later-commit experiment does.',
    'Writing every forked JVM\'s recording to one file. With forkCount above one, give each fork its own file or profile with a single fork.'
  ],
  interview: [
    {
      q: 'How would you speed up a slow Maven test suite without running fewer tests?',
      a: 'I would tune the test JVM rather than the test set. First a baseline: run the suite several times with the default configuration in a stable environment, record the times, and record which test outcomes are expected; exclude or fix flaky tests first, because outcome checks need deterministic results. Then form hypotheses from what the JVM does: record one run with JFR, using a custom .jfc with the compilation threshold at 0 ms and shorter statistics periods, and look at compilation rates, GC count and pauses, allocation and CPU. Short-lived test JVMs often spend a lot on JIT compilation, so -XX:TieredStopAtLevel=1 and a lighter collector such as Serial or Parallel are natural first candidates, along with start-up features like class data sharing. Each candidate goes into Surefire\'s argLine, is validated (does the JVM start, does every test keep its outcome), and is timed over several runs, compared with Mann–Whitney U and an effect size. If hand-picked candidates are not enough, I would automate the search with random search as a baseline and a model-based method such as PROBO, which predicts time through the JFR metrics.'
    },
    {
      q: 'What is a JFR threshold, and why does it matter for measurement?',
      a: 'Many JFR events are duration events, and a threshold tells JFR to write one only if it lasted longer than a given time. The stock configurations are built for diagnosing problems with low overhead, so they set thresholds that catch slow outliers: jdk.Compilation is recorded only above 100 ms in profile.jfc and above 1 s in default.jfc, and I/O and monitor events have thresholds too. That is right for finding a pathological compilation and wrong for counting compilations: a short-lived test JVM performs hundreds of compilations that each take a few milliseconds, none of which qualifies, so the recording shows zero. Periodic events have a similar trap — statistics sampled once a second may never fire in a very short JVM. For measurement you copy profile.jfc, set the thresholds you count to 0 ms and shorten the periods, and pass that file with settings=. On JDK 17 and later single overrides can be given inline, but on JDK 11 the copied file is the only route.'
    },
    {
      q: 'Explain how PROBO computes flag importance and why that helps.',
      a: 'PROBO trains one random forest per selected runtime metric to predict that metric from the flag vector, and one random forest to predict testing time from the metrics. From the time model it takes each metric\'s feature importance, IM(m): how predictive that metric is of testing time. From each metric model it takes each flag\'s feature importance, FI(f → m): how much that flag moves that metric. A flag\'s overall importance is the sum over metrics of FI(f → m) × IM(m), normalised so all flags sum to one. The intuition is that a flag matters if it strongly moves metrics that strongly predict time. It helps because, with only tens of measured configurations, a direct flags-to-time model can credit flags that merely co-occurred with fast runs; requiring the effect to pass through observable behaviour filters out much of that noise. The scores then drive candidate generation — exploration around the top-k flags, importance-weighted random sampling, and all combinations of the top-k flags — before expected improvement picks what to measure.'
    },
    {
      q: 'You read a paper claiming a 10% test-time reduction from JVM tuning. What do you check before believing it applies to you?',
      a: 'The environment and versions: which JDK (PROBO used Java 11), which build tool and project shape (single-module Maven projects), and how many CPUs and how much memory (2 CPUs and 8 GB in a container), because ergonomics and JIT behaviour depend on all of them. The measurement: how many runs per configuration, which statistical test, whether an effect size is reported, and whether non-significant results count as zero. Correctness: whether every test outcome was preserved and flaky projects excluded. Cost: how long the search itself took and whether the gain survives a fixed time budget. Durability: whether the configuration still helps after the code changes — PROBO checked about 88 later commits per project. And whether the reported number is an average across projects or a best case, since PROBO\'s 10.7% average sits beside a maximum of 27.4% and wide variation. If those answers fit my setting, I would still re-measure on my own suite.'
    }
  ]
};
