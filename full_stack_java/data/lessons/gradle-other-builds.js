window.LESSONS = window.LESSONS || {};
window.LESSONS['gradle-other-builds'] = {
  id: 'gradle-other-builds',
  title: 'Gradle & Friends: Gradle Deep-Dive, plus Ant, Bazel & How to Choose',
  category: 'Part 15 — Beyond Maven & Interviews',
  timeMin: 50,
  summary: 'maven-fundamentals deliberately taught Maven first, specifically so this lesson could teach what a build system even IS before comparing alternatives. Gradle is the one you\'ll actually meet most often outside Maven (it\'s Android\'s mandated default) — build scripts as real CODE rather than declarative XML, a flexible task graph instead of Maven\'s fixed lifecycle, and a genuinely different performance story built on incremental builds, a build cache, and a long-running daemon. Ant gets a brief, honest retrospective as legacy-only. Bazel gets a real look at what genuine monorepo-scale, fully-reproducible builds actually require. Then a concrete decision framework — mirroring frontend-choices\' own team-fit/project-fit reasoning — for choosing correctly rather than defaulting to whichever tool is currently fashionable.',
  goals: [
    'Explain the core difference between Maven\'s declarative POM and Gradle\'s code-based build.gradle(.kts), and the real tradeoff (flexibility vs. predictability) this creates',
    'Explain Gradle\'s task graph model and how it differs from Maven\'s fixed, linear lifecycle phases',
    'Explain precisely how Gradle\'s incremental builds, build cache, and daemon combine to make repeated builds genuinely faster, not just theoretically faster',
    'Explain why Ant is essentially legacy-only for new projects, and what Bazel\'s hermetic-build model solves that Maven/Gradle don\'t attempt to solve at all',
    'Choose the right build tool for a concrete team/project scenario, using the same team-fit/project-fit reasoning frontend-choices applied to frontend strategy'
  ],
  concept: [
    {
      h: 'Gradle\'s core difference: build scripts are code, not declarative XML',
      p: [
        'maven-fundamentals\' <code>pom.xml</code> is DECLARATIVE — you state WHAT dependencies and plugins you want, and Maven\'s fixed lifecycle decides WHEN and HOW to use them; you cannot write an <code>if</code> statement or a loop directly inside a <code>pom.xml</code> at all, by design. Gradle\'s <code>build.gradle</code> (Groovy DSL) or <code>build.gradle.kts</code> (Kotlin DSL, increasingly the modern default) is GENUINE, EXECUTABLE CODE — the build file itself is interpreted and run, meaning it can contain real conditionals, loops, variables, and custom logic directly: "if this is a CI build, run extra verification steps," or "generate a dependency list from a shared version catalog file," expressed as actual Kotlin/Groovy code rather than a Maven plugin someone would need to write and publish separately.',
        'This is a genuine, double-edged tradeoff worth stating precisely, not just praising Gradle\'s flexibility: Maven\'s declarative rigidity is EXACTLY maven-fundamentals\' own convention-over-configuration argument — every Maven project\'s <code>pom.xml</code> looks recognizably similar, since the DECLARATIVE format itself limits how differently two people can express the same thing. Gradle\'s build-scripts-as-code model means two different teams\' <code>build.gradle.kts</code> files can look WILDLY different from each other, even for conceptually similar projects, since genuine code allows genuinely different styles, abstractions, and custom logic — real power, at the real cost of the same predictability Maven\'s rigidity was specifically designed to provide.'
      ]
    },
    {
      h: 'Tasks and the task graph, versus Maven\'s fixed lifecycle',
      p: [
        'maven-fundamentals\' lifecycle is a fixed, linear sequence — validate, compile, test, package, verify, install, deploy — and "run phase X" always means "run every phase before X too," in that exact order, no exceptions. Gradle\'s build model is a GRAPH of TASKS (<code>compileJava</code>, <code>test</code>, <code>jar</code>, and any CUSTOM task you define yourself) connected by explicit <code>dependsOn</code> relationships you can declare yourself — <code>tasks.named("jar") { dependsOn("generateVersionFile") }</code> — meaning the actual EXECUTION ORDER is whatever the declared dependency GRAPH requires, not a fixed, universal sequence every project follows identically. This is more FLEXIBLE (a genuinely custom task, doing something Maven has no lifecycle phase for at all, fits naturally into Gradle\'s graph) at the cost of being less UNIVERSALLY PREDICTABLE (a Maven developer moving between two unrelated Maven projects already knows the lifecycle; a Gradle developer moving between two Gradle projects may find genuinely different custom task graphs in each).',
        'Concretely: <code>./gradlew build</code> runs the <code>build</code> task, which depends on <code>check</code> (tests and verification) and <code>assemble</code> (produce the actual artifact), each of which themselves depend on further tasks — a genuine dependency GRAPH, not a fixed line — and <code>./gradlew tasks</code> lists every task actually available in THIS specific project, since (unlike Maven\'s universal lifecycle) the full set of tasks genuinely varies by project and by which plugins are applied.'
      ]
    },
    {
      h: 'Gradle\'s real performance story: incremental builds, the build cache, and the daemon',
      p: [
        'Gradle tracks, for every task, its declared INPUTS (source files, dependency versions) and OUTPUTS (compiled classes, a JAR) — on a REPEATED build, if a task\'s inputs genuinely haven\'t changed since last time, Gradle SKIPS re-running it entirely ("UP-TO-DATE"), reusing the previous output directly — an INCREMENTAL build, meaningfully faster than Maven\'s more straightforward "just re-run everything" default for anything beyond the smallest projects. The BUILD CACHE extends this further: task outputs can be cached and reused not just across your OWN repeated local builds, but across DIFFERENT machines entirely (a shared, remote build cache a whole team or CI pipeline points at) — if a colleague already compiled the exact same source with the exact same dependencies, YOUR build can reuse THEIR cached output rather than recompiling from scratch.',
        'The GRADLE DAEMON is a long-running background JVM PROCESS that stays alive BETWEEN separate build invocations, specifically to avoid paying JVM startup cost (class loading, and — directly connecting to jvm-architecture\'s own material — JIT warm-up) fresh on every single build command. This is precisely the same "a long-running process eventually gets faster and stays fast, while a short-lived process pays interpreter/warm-up cost every single time" tradeoff jvm-architecture named explicitly for JIT compilation, and gluon-mobile-graalvm named explicitly for the AOT-vs-JIT choice — a warm Gradle daemon, having already JIT-compiled its own hot code paths from previous builds, genuinely runs FASTER than a freshly-started JVM would, exactly the reasoning behind why the daemon exists at all rather than starting a brand-new JVM process for every single build invocation the way older tools (and Maven, without its own optional daemon feature) traditionally did.'
      ]
    },
    {
      h: 'Ant: a brief, honest retrospective',
      p: [
        'Ant predates BOTH Maven and Gradle, and understanding it today is almost entirely about recognizing and maintaining OLDER, legacy codebases, not choosing it for anything new. Ant\'s <code>build.xml</code> is genuinely IMPERATIVE — you write out the EXACT sequence of steps (compile these files, copy these resources, run these tests) yourself, by hand, with NO built-in dependency-management system at all (a separate tool, Ivy, was bolted on later specifically to add this, since Ant itself never had it), and NO convention-over-configuration whatsoever — every single directory, every single step, must be explicitly specified, since Ant makes no assumptions about project structure at all, unlike Maven\'s standard directory layout.',
        'The practical, honest takeaway: recognize <code>build.xml</code> on sight (you may well encounter it maintaining an older enterprise codebase), understand that its complete lack of dependency management and conventions is PRECISELY the pain Maven was built to solve, and do not reach for it on any new project today — this isn\'t a controversial opinion, it\'s the near-universal industry consensus, and this lesson names it plainly rather than pretending Ant remains a genuine contender.'
      ]
    },
    {
      h: 'Bazel: hermetic builds at genuine monorepo scale — and choosing the right tool overall',
      p: [
        'Bazel (originating from Google\'s own internal build system, later open-sourced) solves a problem Maven and Gradle don\'t even attempt to address: HERMETIC builds — every single input a build depends on (source files, dependency versions, even the specific compiler version) is EXPLICITLY DECLARED, with NOTHING implicitly assumed from the ambient environment (no reliance on "whatever JDK happens to be on this machine\'s PATH") — meaning the EXACT SAME build, run on two completely different machines, produces BIT-FOR-BIT IDENTICAL output, a genuinely stronger reproducibility guarantee than either Maven or Gradle promises by default. Bazel\'s <code>BUILD</code> files declare this explicitly, and its REMOTE EXECUTION/CACHING model lets a build\'s individual pieces run on ENTIRELY DIFFERENT MACHINES in a build farm, at genuine scale — the specific problem this solves is a MONOREPO containing potentially thousands of interdependent modules (exactly Google\'s own original motivation), where correctness and reproducibility at that scale become genuinely hard problems Maven/Gradle\'s per-project model was never designed to solve.',
        'The concrete decision framework, mirroring frontend-choices\' own team-fit/project-fit reasoning rather than "whichever is newest": MAVEN remains the right default for most projects (this whole course\'s own choice) — convention-over-configuration, predictability, and a vast, stable plugin ecosystem, at the cost of some flexibility. GRADLE is the right choice specifically when you need genuine build-script flexibility (custom, non-standard build logic) or genuine SPEED at a larger scale (incremental builds/caching meaningfully paying off once a build takes long enough to matter) — and it is Android\'s MANDATED default, making it an unavoidable choice for that specific platform regardless of general preference. BAZEL is the right choice specifically at genuine MONOREPO scale, where hermetic reproducibility across thousands of interdependent modules is a real, pressing problem — genuine overkill for a project LogPose\'s own size. ANT is essentially never the right choice for a NEW project today — maintain it where it already exists, never introduce it fresh.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky\'s standard shipyard, a flexible custom dock, an old-fashioned yard with no system, and the Navy\'s hermetic fleet protocol',
      text: 'Franky\'s OWN shipyard runs on one standard, well-known procedure every shipwright in the guild recognizes on sight — crates organized the same fixed way, every time, on every job (Maven\'s convention-over-configuration). A DIFFERENT dock across the bay works completely differently: the shipwright there writes out the ENTIRE build procedure as a genuinely flexible, rewritable set of instructions — real, adaptable logic, not just a fixed checklist — able to include conditional steps ("if this particular hull needs reinforcing, add an extra layer here") no fixed checklist could express (Gradle\'s code-based build scripts). That same dock also keeps a crew ALREADY WARMED UP and its tools ALREADY laid out between jobs, rather than assembling everything fresh each time — and when a new job comes in, they only rebuild the ONE section that actually changed since the last job, reusing everything else exactly as it was (the daemon plus incremental builds) — genuinely faster, once the crew\'s hit their stride, than starting completely cold every single time. An OLD, nearly-abandoned yard nearby has NO organized system at all — every single step must be spelled out by hand, with nobody tracking what depends on what, and a few old-timers still use it to patch ancient vessels, but nobody would start a BRAND NEW ship there today (Ant, legacy-only). And the World Government\'s own official naval shipyard, building THOUSANDS of standardized vessels across the entire navy at once, runs an entirely different, extremely rigid protocol: every single material, every single measurement, is explicitly declared and verified, with nothing left to a shipwright\'s ambient assumption — the SAME specification, built twice, on two completely different docks, produces two genuinely identical vessels, down to the rivet (Bazel\'s hermetic builds) — a genuinely necessary discipline at THAT scale, and genuine overkill for one independent crew building one ship.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Monica\'s standard recipe cards, a flexible custom kitchen, an old diner with no system, and a catering company\'s identical-plate protocol',
      text: 'Monica\'s OWN kitchen runs on one standard, well-known recipe-card system anyone trained in it recognizes on sight — ingredients organized the same fixed way, every time, for every dish (Maven\'s convention-over-configuration). A friend\'s kitchen works completely differently: they write out the ENTIRE cooking procedure as genuinely flexible, rewritable instructions — real, adaptable logic, not just a fixed recipe card — able to include conditional steps ("if we have fresh basil today, add it here") no fixed recipe card could express (Gradle\'s code-based build scripts). That same kitchen also keeps the stove ALREADY warmed up and ingredients ALREADY prepped between meals, rather than starting cold each time — and when the next order comes in, they only re-cook the ONE component that\'s actually different from last time, reusing everything else exactly as it was (the daemon plus incremental builds) — genuinely faster, once they\'ve hit their stride, than starting completely from scratch every single time. An OLD, nearly-forgotten diner nearby has NO organized system at all — every single step is done from memory, ad hoc, with nobody tracking what depends on what, and a couple of old regulars still eat there, but nobody would open a BRAND NEW restaurant that way today (Ant, legacy-only). And a big catering company preparing IDENTICAL meals for thousands of guests at one massive event runs an entirely different, extremely rigid protocol: every single ingredient, every single measurement, is explicitly specified and verified, with nothing left to any one cook\'s ambient assumption — the SAME order, prepared twice, by two completely different cooks, produces two genuinely identical plates (Bazel\'s hermetic builds) — a genuinely necessary discipline at THAT scale, and genuine overkill for one household\'s own dinner.',
    },
    why: 'Franky\'s / Monica\'s standard, fixed procedure everyone recognizes is Maven\'s declarative convention. The flexible dock/kitchen\'s rewritable, conditional instructions are Gradle\'s code-based build scripts; its already-warmed-up crew/stove rebuilding only what actually changed is the Gradle daemon plus incremental builds. The old, system-less yard/diner nobody would start fresh with today is Ant, legacy-only. And the Navy\'s / catering company\'s extremely rigid, fully-specified protocol producing bit-for-bit identical results across completely different builders, necessary at massive scale and overkill at small scale, is Bazel\'s hermetic build model.'
  },
  storyAnim: {
    title: 'A fixed standard procedure, a flexible rewritable one, an old system-less yard, and a rigid identical-output protocol',
    h: 340,
    props: [
      { id: 'standardyard', emoji: '⚓', label: 'ONE standard, fixed procedure everyone recognizes (Maven convention)', x: 6, y: 8 },
      { id: 'flexibledock', emoji: '📝', label: 'flexible, rewritable instructions with real conditional logic (Gradle build scripts)', x: 28, y: 8 },
      { id: 'warmcrew', emoji: '🔥', label: 'a crew already warmed up, rebuilding only what changed (daemon + incremental builds)', x: 50, y: 8 },
      { id: 'oldyard', emoji: '🏚️', label: 'an old yard, no system at all, nobody starts fresh here today (Ant, legacy-only)', x: 74, y: 8 },
      { id: 'navyprotocol', emoji: '⚓', label: 'the Navy\'s rigid protocol: bit-for-bit identical output, any dock (Bazel, hermetic)', x: 40, y: 50 }
    ],
    actors: [
      { id: 'franky', emoji: '🛠️', label: 'Franky', x: 20, y: 78 },
      { id: 'shipwright', emoji: '👷', label: 'another shipwright', x: 65, y: 78 }
    ],
    steps: [
      { c: 'Franky\'s own yard runs one standard, fixed procedure everyone in the guild recognizes.', p: { standardyard: 'lit' }, a: { franky: [20, 30] } },
      { c: 'A different dock writes the ENTIRE procedure as flexible, rewritable instructions with real conditional logic.', p: { flexibledock: 'lit' }, a: { shipwright: [28, 30] } },
      { c: 'That dock keeps its crew already warmed up, rebuilding only the one piece that actually changed since last time.', p: { warmcrew: 'good' } },
      { c: 'An old, nearly-abandoned yard has no organized system at all -- nobody starts a brand new ship there today.', p: { oldyard: 'bad' } },
      { c: 'The Navy\'s own shipyard runs an extremely rigid protocol: the same specification, built anywhere, produces bit-for-bit identical vessels.', p: { navyprotocol: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'From Gradle\'s code-based scripts to its task graph, its real speed story, Ant\'s retrospective, and Bazel',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Gradle\'s core difference',
        nodes: [
          { id: 'codebased', text: 'build.gradle(.kts): real code,\nnot declarative XML' },
          { id: 'flexibletradeoff', text: 'more power, less universal\npredictability than Maven' }
        ]
      },
      {
        label: 'Task graph',
        nodes: [
          { id: 'taskgraph', text: 'tasks + dependsOn:\na flexible graph, not a fixed line' }
        ]
      },
      {
        label: 'Real performance',
        nodes: [
          { id: 'incremental', text: 'incremental builds:\nskip tasks whose inputs are unchanged' },
          { id: 'daemon', text: 'the daemon: a warm, long-running\nJVM avoiding startup/JIT cost each build' }
        ]
      },
      {
        label: 'Ant & Bazel & choosing',
        nodes: [
          { id: 'antlegacy', text: 'Ant: imperative, no conventions,\nlegacy-only for new projects' },
          { id: 'bazelscale', text: 'Bazel: hermetic builds,\nmonorepo scale' },
          { id: 'choosing', text: 'Maven default; Gradle for flexibility/\nAndroid/speed; Bazel at monorepo scale' }
        ]
      }
    ],
    steps: [
      { active: ['codebased'], note: 'Gradle\'s build.gradle(.kts) is executable code -- real conditionals and custom logic, unlike Maven\'s declarative pom.xml.' },
      { active: ['flexibletradeoff'], note: 'This buys real flexibility at the cost of the universal predictability Maven\'s declarative rigidity was specifically designed to provide.' },
      { active: ['taskgraph'], note: 'Gradle\'s task graph, with explicit dependsOn relationships, replaces Maven\'s fixed linear lifecycle with a flexible, project-specific dependency graph.' },
      { active: ['incremental'], note: 'Gradle skips re-running a task entirely if its declared inputs haven\'t changed since the last build, reusing the previous output.' },
      { active: ['daemon'], note: 'A long-running daemon process avoids paying JVM startup and JIT warm-up cost fresh on every build -- the same tradeoff jvm-architecture named for long-running processes generally.' },
      { active: ['antlegacy'], note: 'Ant is fully imperative with no built-in dependency management or conventions -- essentially legacy-only; recognized, never chosen fresh.' },
      { active: ['bazelscale'], note: 'Bazel\'s hermetic builds guarantee bit-for-bit identical output across machines -- solving a genuine monorepo-scale problem Maven/Gradle don\'t attempt.' },
      { active: ['choosing'], note: 'Maven remains the right default for most projects; Gradle for genuine flexibility/speed needs or Android; Bazel only at genuine monorepo scale; Ant essentially never for new work.' }
    ]
  },
  tech: [
    {
      q: 'Explain precisely what "UP-TO-DATE" means when Gradle reports it for a task, and what specifically must be true for Gradle to safely skip re-running that task.',
      a: 'Gradle tracks, for every task, its declared INPUTS (source files, their content, dependency versions, relevant configuration values) and OUTPUTS (compiled classes, a JAR, generated files) from the LAST time that task actually ran, typically via content hashes rather than just file-modification timestamps (avoiding a false "unchanged" report from a file merely touched without genuine content changes). On a subsequent build, Gradle recomputes the CURRENT hash of every declared input and compares it against what was recorded last time — if EVERY input hash matches exactly, Gradle can PROVE that task would produce the identical output if re-run, and safely skips actually re-executing it, reporting "UP-TO-DATE" and reusing the existing output directly. This is only safe because Gradle requires tasks to DECLARE their inputs/outputs explicitly (via its API) — a task that reads something Gradle doesn\'t know about (an environment variable it never declared as an input, say) could produce a DIFFERENT result on a re-run despite Gradle believing nothing changed, a genuine correctness risk if inputs/outputs aren\'t declared completely and honestly.'
    },
    {
      q: 'A team notices their FIRST Gradle build of the day is noticeably slower than every subsequent build that day, even when they haven\'t changed any source code between them. Explain precisely why, connecting to jvm-architecture\'s own material.',
      a: 'The first build of the day starts a FRESH Gradle daemon process (assuming it wasn\'t already running, or was killed since the last session) — this fresh JVM process begins in HotSpot\'s INTERPRETED state, exactly jvm-architecture\'s own material: no method has run enough times yet to be flagged "hot" and JIT-compiled to optimized native code, so the daemon\'s own internal build-logic code runs at interpreter speed for at least its first several operations. Every SUBSEQUENT build that day reuses the SAME already-running daemon process — its JIT has, by now, had real opportunity to compile the daemon\'s own hot code paths (the specific internal logic Gradle repeatedly runs to evaluate build scripts, compute task graphs, and check UP-TO-DATE status) to optimized native code, exactly the "long-running process gets faster and stays fast" argument jvm-architecture made generally, now observed concretely in Gradle\'s own daemon architecture.'
    },
    {
      q: 'A developer argues "Gradle is strictly more powerful than Maven, so we should always prefer it." Evaluate this claim using this lesson\'s own tradeoff material.',
      a: 'The "more powerful" half is genuinely true — build-scripts-as-code can express things Maven\'s declarative XML structurally cannot. But "strictly more powerful, therefore always prefer it" ignores the real cost this lesson names explicitly: Maven\'s declarative rigidity IS a deliberate feature, not merely a limitation — it guarantees every Maven project looks recognizably similar, letting any developer familiar with Maven\'s conventions understand a NEW Maven project quickly, precisely because the format itself limits how differently two teams can express the same thing. Gradle\'s genuine code-based flexibility means two teams\' build.gradle.kts files CAN look wildly different even for similar projects — a real cost in cross-project familiarity and onboarding speed that "more powerful" doesn\'t capture at all. The correct evaluation, mirroring frontend-choices\' own reasoning: choose based on whether your SPECIFIC project genuinely needs that flexibility (custom build logic, Android, meaningful build-speed requirements at scale) — not because "more powerful" is an unconditional win regardless of what a project actually needs.'
    },
    {
      q: 'Explain precisely why Bazel\'s hermetic build guarantee would be genuine overkill for LogPose\'s own capstone build, connecting to capstone-design\'s own stated scope.',
      a: 'Bazel\'s hermetic-build guarantee (bit-for-bit identical output across any machine, with every input explicitly declared) solves a problem that scales with the NUMBER of interdependent modules and the NUMBER of people/machines building them — Google\'s own original motivation was a monorepo with genuinely thousands of modules, where subtle build-environment differences across many machines and many developers become a real, recurring correctness risk worth Bazel\'s real setup and discipline cost to eliminate. LogPose, per capstone-design\'s own explicitly-stated scope (a personal-use tool, three modules: logpose-core/logpose-search/logpose-backend, one developer), has neither the module COUNT nor the multi-developer/multi-machine build-environment risk Bazel exists to solve — Maven\'s (or Gradle\'s) simpler, per-project build model is entirely adequate at this scale, and adopting Bazel\'s real additional setup/discipline cost for a project this size would be paying a real, ongoing cost for a guarantee the project\'s own actual scope never needed in the first place.'
    }
  ],
  code: {
    title: 'The same module, two ways: logpose-core\'s pom.xml versus its build.gradle.kts equivalent',
    intro: 'maven-multi-module\'s logpose-core module, expressed in Gradle\'s Kotlin DSL — the SAME dependencies, the SAME module purpose, genuinely different syntax and underlying model.',
    code: `<!-- logpose-core/pom.xml (from maven-multi-module) -->
<project>
    <parent>
        <groupId>com.logpose</groupId>
        <artifactId>logpose-parent</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>
    <artifactId>logpose-core</artifactId>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>


// logpose-core/build.gradle.kts -- the SAME module, in Gradle's Kotlin DSL
plugins {
    id("java-library")   // Gradle's equivalent of Maven's default "jar" packaging
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")   // roughly Maven's "compile" scope
    runtimeOnly("org.postgresql:postgresql")                                    // exactly Maven's "runtime" scope
    testImplementation("org.junit.jupiter:junit-jupiter")                       // exactly Maven's "test" scope
}

// a genuinely CUSTOM task -- something no Maven lifecycle phase has an equivalent for at all
tasks.register("printDependencyCount") {
    doLast {
        println("logpose-core has \${configurations.runtimeClasspath.get().files.size} runtime dependencies")
    }
}

tasks.named("jar") {
    dependsOn("printDependencyCount")   // an explicit dependsOn -- part of Gradle's task GRAPH, not a fixed lifecycle phase
}`,
    notes: [
      'implementation/runtimeOnly/testImplementation are Gradle\'s own dependency-configuration names, roughly (not exactly) mirroring Maven\'s compile/runtime/test scopes -- close enough to translate directly, but genuinely Gradle\'s own vocabulary, not identical terminology.',
      'printDependencyCount has NO Maven lifecycle-phase equivalent at all -- it\'s a genuinely custom task, only possible because Gradle\'s build file is real, executable code rather than declarative configuration.',
      'tasks.named("jar") { dependsOn(...) } is Gradle\'s task-graph model directly -- an explicit, project-specific dependency relationship, not a universal, fixed sequence every Gradle project follows identically.',
      'Running this build a SECOND time with no source changes would report compileJava, test, and jar all as UP-TO-DATE -- Gradle\'s incremental-build tracking recognizing nothing actually needs to be redone.'
    ]
  },
  lab: {
    title: 'Translate a Maven dependency block to Gradle\'s Kotlin DSL',
    prompt: 'Given the following Maven <code>&lt;dependencies&gt;</code> block for <code>logpose-search</code>: <code>org.apache.lucene:lucene-core</code> (default/compile scope), <code>ai.djl:api</code> (default/compile scope), and <code>org.junit.jupiter:junit-jupiter</code> (test scope) — write the equivalent Gradle Kotlin DSL <code>dependencies { ... }</code> block, using <code>implementation(...)</code> for compile-scope dependencies and <code>testImplementation(...)</code> for the test-scope one.',
    starter: `dependencies {
    // TODO: implementation("org.apache.lucene:lucene-core")
    // TODO: implementation("ai.djl:api")
    // TODO: testImplementation("org.junit.jupiter:junit-jupiter")
}`,
    checks: [
      { re: 'implementation\\(\\s*"org\\.apache\\.lucene:lucene-core"\\s*\\)', must: true, hint: 'Add implementation("org.apache.lucene:lucene-core").', pass: 'lucene-core dependency correct ✓' },
      { re: 'implementation\\(\\s*"ai\\.djl:api"\\s*\\)', must: true, hint: 'Add implementation("ai.djl:api").', pass: 'ai.djl:api dependency correct ✓' },
      { re: 'testImplementation\\(\\s*"org\\.junit\\.jupiter:junit-jupiter"\\s*\\)', must: true, hint: 'Add testImplementation("org.junit.jupiter:junit-jupiter").', pass: 'junit-jupiter test dependency correct ✓' }
    ],
    run: 'gradle build — the resulting logpose-search module should have lucene-core and ai.djl:api available at compile and runtime, with junit-jupiter available only for tests, matching the equivalent pom.xml exactly.',
    solution: `dependencies {
    implementation("org.apache.lucene:lucene-core")
    implementation("ai.djl:api")
    testImplementation("org.junit.jupiter:junit-jupiter")
}`,
    notes: [
      'implementation is Gradle\'s rough equivalent of Maven\'s default (compile) scope -- available at compile time, runtime, and to consumers of this module.',
      'testImplementation exactly mirrors Maven\'s test scope -- available only when compiling and running this module\'s own tests, never packaged or exposed to consumers.',
      'This translation exercise is deliberately mechanical -- confirming that the underlying CONCEPTS (compile-time vs. test-only dependencies) transfer directly between build tools, even though the exact syntax and configuration names differ.'
    ]
  },
  quiz: [
    {
      q: 'What is the core structural difference between Maven\'s pom.xml and Gradle\'s build.gradle(.kts)?',
      options: ['pom.xml is declarative configuration with no executable logic; build.gradle(.kts) is genuine, executable code capable of conditionals, loops, and custom logic', 'They are functionally identical, differing only in file extension', 'build.gradle(.kts) cannot declare dependencies, only pom.xml can', 'pom.xml supports custom tasks while build.gradle(.kts) only supports a fixed lifecycle'],
      correct: 0,
      explain: 'Maven\'s POM is purely declarative XML with no executable logic. Gradle\'s build script is real, interpreted code, enabling genuine custom logic a declarative format structurally cannot express.'
    },
    {
      q: 'What does it mean when Gradle reports a task as "UP-TO-DATE"?',
      options: ['Gradle determined the task\'s declared inputs are unchanged since the last run and safely reused the previous output instead of re-executing the task', 'The task failed and needs to be manually re-run', 'The task ran successfully but its output was discarded', 'This status only applies to test tasks, never to compilation tasks'],
      correct: 0,
      explain: 'UP-TO-DATE means Gradle compared current input hashes against the last recorded run, found no changes, and safely skipped re-executing the task, reusing its existing output.'
    },
    {
      q: 'Why does the FIRST Gradle build of a session typically run slower than subsequent builds, even with no source code changes between them?',
      options: ['A fresh Gradle daemon JVM starts in an interpreted state; subsequent builds reuse the same already-running, now-JIT-warmed daemon -- the same long-running-process speedup jvm-architecture described generally', 'Gradle always deletes and rebuilds the entire project from scratch on the very first build of each session', 'The first build downloads the entire internet\'s worth of dependencies regardless of what is actually needed', 'This is a random performance fluctuation with no consistent underlying cause'],
      correct: 0,
      explain: 'The first build starts a fresh daemon JVM, running at interpreter speed initially. Subsequent builds reuse that same daemon, whose JIT has since warmed up its own internal build logic -- directly the same tradeoff jvm-architecture described for any long-running process.'
    },
    {
      q: 'Why is Ant considered essentially legacy-only for new projects today?',
      options: ['It is fully imperative (every step written out by hand) with no built-in dependency management and no directory-layout conventions -- exactly the pain Maven was specifically built to solve', 'Ant cannot be used with any version of Java newer than Java 8', 'Ant only supports building C++ projects, not Java ones', 'Ant requires a paid license unlike Maven and Gradle, making it commercially unviable'],
      correct: 0,
      explain: 'Ant\'s complete lack of dependency management and directory-layout conventions is precisely the gap Maven was created to close -- this is near-universal industry consensus, not a controversial lesson opinion.'
    },
    {
      q: 'What genuine problem does Bazel\'s hermetic-build model solve that Maven and Gradle do not attempt to address?',
      options: ['Guaranteeing bit-for-bit identical build output across completely different machines, by explicitly declaring every input with nothing left to ambient environment assumptions -- critical at genuine monorepo scale', 'Making builds run faster on a single developer\'s own laptop', 'Eliminating the need for any dependency declarations at all', 'Allowing Java and JavaScript code to be compiled by the exact same compiler'],
      correct: 0,
      explain: 'Bazel\'s hermetic builds guarantee reproducible, identical output across machines by explicitly declaring every input -- a genuine, monorepo-scale correctness problem Maven and Gradle\'s simpler per-project models were never designed to solve.'
    }
  ],
  testFlow: {
    title: 'Test yourself: Gradle\'s speed mechanisms, Ant\'s retrospective, and matching the tool to the project',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A Gradle task\'s declared inputs are its source files\' content hashes. A developer changes a file\'s timestamp (via touch) without changing its actual content, then rebuilds. What does Gradle report?',
        choices: [
          { text: 'UP-TO-DATE -- Gradle compares content hashes, not file-modification timestamps, so an unchanged-content file with only a changed timestamp is correctly recognized as unchanged', to: 'q1_right' },
          { text: 'The task re-runs unnecessarily, since Gradle only tracks file-modification timestamps, not content', to: 'q1_wrong_timestamps' },
          { text: 'Gradle throws an error, since it cannot determine whether the file has genuinely changed', to: 'q1_wrong_error' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- Gradle\'s incremental-build tracking is based on content hashes specifically to avoid exactly this false-positive scenario a naive timestamp-only comparison would produce.', next: 'q2' },
      q1_wrong_timestamps: { end: true, correct: false, text: 'Gradle\'s incremental-build tracking specifically uses content hashes rather than relying solely on timestamps, precisely to avoid unnecessary re-runs from a touched-but-unchanged file.', retry: 'q1' },
      q1_wrong_error: { end: true, correct: false, text: 'Gradle handles this scenario correctly and silently -- there is no error condition here at all; content-hash comparison cleanly determines the file is genuinely unchanged.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A team maintaining a 15-year-old enterprise codebase discovers it uses Ant with a separately-configured Ivy setup for dependency management. What should they conclude?',
        choices: [
          { text: 'This reflects Ant\'s own historical lack of built-in dependency management -- Ivy was a separate tool bolted on specifically to add it; maintaining this existing setup is reasonable, but it would not be chosen fresh for a new project today', to: 'q2_right' },
          { text: 'This indicates the codebase is broken and must be immediately migrated away from Ant before any further work can proceed', to: 'q2_wrong_broken' },
          { text: 'This is a sign the codebase actually uses Maven internally, since Ivy is simply an alternate name for Maven', to: 'q2_wrong_ivyismaven' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- Ant genuinely never had built-in dependency management, and Ivy was a separate, later addition specifically to provide it. This is exactly why Ant is understood as legacy-only today, not chosen for new work.', next: 'q3' },
      q2_wrong_broken: { end: true, correct: false, text: 'A working Ant+Ivy setup is not inherently "broken" -- it can continue functioning for existing maintenance. The lesson here is about NOT choosing this combination for anything NEW, not an urgent mandate to migrate immediately.', retry: 'q2' },
      q2_wrong_ivyismaven: { end: true, correct: false, text: 'Ivy and Maven are genuinely different, separate tools -- Ivy is specifically a dependency-management tool historically paired with Ant, not an alternate name for Maven at all.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A startup with 3 small, independent Java services (not a monorepo, no shared build infrastructure needs) is choosing a build tool "for maximum future scalability" and is considering Bazel. What does this lesson\'s decision framework suggest?',
        choices: [
          { text: 'Bazel is likely overkill here -- its hermetic-build guarantee solves a genuine monorepo-scale problem this startup does not currently have; Maven or Gradle would serve this scale with far less setup/discipline cost', to: 'q3_right' },
          { text: 'Bazel is always the right choice regardless of project size, since it is technically the most capable build tool available', to: 'q3_wrong_alwaysbest' },
          { text: 'Bazel cannot be used for anything other than a genuine monorepo, making this scenario technically impossible to configure', to: 'q3_wrong_cantuse' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- choosing a build tool for hypothetical future scale it may never reach, rather than actual current needs, is exactly the mismatch this lesson\'s decision framework (and frontend-choices\' own reasoning) argues against.', next: null },
      q3_wrong_alwaysbest: { end: true, correct: false, text: '"Most capable" does not mean "always the right choice" -- this is exactly the same overgeneralization this lesson\'s own tech section corrected for Gradle-vs-Maven; the right tool depends on actual project needs, not raw capability.', retry: 'q3' },
      q3_wrong_cantuse: { end: true, correct: false, text: 'Bazel can technically be configured for any project size -- the objection is about whether its real setup and discipline COST is worth paying for a benefit (monorepo-scale hermetic builds) this startup\'s actual scope does not need, not a technical impossibility.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Choosing Gradle purely because it is "more powerful" than Maven, without an actual need for that flexibility -- trades away real predictability and cross-project familiarity for capability a specific project may never use.',
    'Declaring a task\'s inputs/outputs incompletely (missing an environment variable or external file the task actually reads) -- Gradle can incorrectly report UP-TO-DATE for a task that would genuinely produce different output if re-run.',
    'Killing the Gradle daemon between every build (or running with --no-daemon by default) without understanding the real cost -- forfeits the JIT-warmed, already-running-process speedup this lesson explains in depth.',
    'Introducing Ant for a brand-new project today -- essentially universal industry consensus against this; recognize and maintain it in legacy codebases, never choose it fresh.',
    'Adopting Bazel\'s hermetic-build discipline for a project whose actual scale (a handful of modules, one team) doesn\'t need the monorepo-scale reproducibility problem it specifically solves.',
    'Assuming Gradle\'s dependency-configuration names (implementation, testImplementation) map EXACTLY one-to-one with Maven\'s scope names -- they are close translations, not identical concepts, and edge cases (api vs. implementation, for instance) genuinely differ.'
  ],
  interview: [
    {
      q: 'A hiring manager asks: "Our team is choosing between Maven and Gradle for a new mid-size Java service, not Android, no monorepo. Walk me through your recommendation." Answer as you would in the interview.',
      a: 'Given no Android requirement (which would make Gradle mandatory regardless of preference) and no genuine monorepo-scale need (which would point toward Bazel instead), the deciding question is whether this team specifically needs Gradle\'s real flexibility (custom, non-standard build logic) or its real speed advantage at a build size where incremental builds/caching genuinely matter. For a mid-size service with fairly standard build needs, I\'d lean Maven by default — convention-over-configuration means any new team member familiar with Maven can understand this project\'s build quickly, and the vast, stable plugin ecosystem covers the overwhelming majority of standard needs without custom logic. I\'d specifically ask about anticipated build times and whether truly custom build logic is expected — if either answer suggests real, concrete need (not hypothetical future scale), Gradle becomes the better fit; absent that concrete need, Maven\'s predictability is the safer, more broadly-understood default.'
    },
    {
      q: 'A colleague says "our builds keep getting slower as the codebase grows — let\'s just switch to Bazel, since it\'s built for scale." Evaluate this reasoning.',
      a: 'This conflates two genuinely different kinds of "scale." Bazel specifically solves MODULE-COUNT and MULTI-MACHINE-REPRODUCIBILITY scale (a monorepo with thousands of interdependent modules, many developers, many CI machines needing bit-for-bit identical results) — it does not, by itself, solve a build that\'s slow purely because of missing incremental-build discipline or an under-configured build cache in the CURRENT tool. Before concluding a wholesale tool migration (a real, significant cost) is warranted, I\'d first check whether the current tool\'s own speed mechanisms (Gradle\'s incremental builds, build cache, and daemon, if already using Gradle; Maven\'s own more limited but real incremental options if using Maven) are actually configured and being used correctly — a slow build is very often a configuration or discipline gap in the current tool, not proof a fundamentally different tool is required.'
    },
    {
      q: 'Defend, in a system design interview, why LogPose\'s own capstone build deliberately used Maven rather than Gradle or Bazel, given everything this lesson covers.',
      a: 'LogPose is a personal-use, three-module (logpose-core/logpose-search/logpose-backend) project with no Android target, no genuine monorepo scale, and no build-script logic complex enough to need real code-based flexibility — precisely the profile this lesson\'s decision framework identifies as Maven\'s sweet spot. Maven\'s convention-over-configuration kept every module\'s build structure predictable and immediately familiar (directly connecting to why this whole course taught Maven first, before any alternative), and neither Gradle\'s flexibility nor Bazel\'s hermetic-build guarantee address a problem LogPose\'s own actual, stated scope has — choosing either would have been paying real additional complexity for a benefit this specific project never needed.'
    },
    {
      q: 'A new engineer asks why understanding Ant is worth any time at all if nobody should choose it for new projects. How do you answer?',
      a: 'Understanding Ant isn\'t about ever choosing it — it\'s about being able to recognize and safely maintain the real, still-existing legacy codebases built on it, which genuinely exist in many established enterprises. Recognizing build.xml on sight, understanding why it has no built-in dependency management (and that Ivy was a separate, later addition to provide one), and knowing this is precisely the gap Maven was built to close, means you can competently maintain an inherited Ant-based system without being confused by its structure, and can make an informed case for eventually migrating it if that\'s ever warranted — genuinely useful, practical knowledge distinct from ever recommending it for something new.'
    }
  ]
};
