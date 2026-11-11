window.LESSONS = window.LESSONS || {};
window.LESSONS['java-static-analyzers'] = {
  id: 'java-static-analyzers',
  title: 'Java Static Analyzers: SpotBugs, PMD, Error Prone, Checker Framework, Infer',
  category: 'Part 4 — Static Analyzers in the Wild',
  timeMin: 45,
  summary: `Java has the richest static-analysis ecosystem of any mainstream language, and the tools differ mostly in which representation they analyze. SpotBugs reads compiled bytecode. PMD walks its own source AST and lets you write rules as XPath. Error Prone and NullAway run inside javac on the compiler's typed AST. The Checker Framework extends Java's type system with annotations such as @Nullable and proves properties modulo those annotations. Infer uses separation logic and bi-abduction to compute per-method summaries, which lets it scale to millions of lines and analyze only what changed. CodeQL turns the program into a database you query, and SonarQube packages hundreds of rules behind quality gates. This lesson shows where each sits, how to write a custom rule in Error Prone and PMD (and what a SpotBugs detector looks like), and how to talk about the soundness and precision tradeoffs.`,
  goals: [
    `Say which representation each tool analyzes (bytecode, source AST, javac typed AST, annotated types, IR with summaries) and what that implies for what it can catch`,
    `Write an Error Prone BugChecker with a Matcher, @BugPattern and describeMatch, and wire Error Prone into a build`,
    `Write a PMD 7 XPath rule in a ruleset XML and run it with pmd check`,
    `Explain pluggable type checking (Checker Framework) vs NullAway vs Infer for null safety, with their soundness guarantees`,
    `Explain bi-abduction and compositional analysis and why that is what makes Infer usable on diffs`,
    `Choose and roll out analyzers in CI with a false-positive budget`
  ],
  concept: [
    {
      h: `The map: what each tool reads`,
      p: [
        `<table class="cmp"><tr><th>Tool</th><th>Representation</th><th>Typical strengths</th><th>Custom rules</th></tr>
<tr><td>SpotBugs (FindBugs successor)</td><td>.class bytecode (BCEL/ASM), CFG + dataflow per method</td><td>Null on some path, ignored return values, bad equals/hashCode, sync bugs; works without source</td><td>Detector classes in a plugin jar (findbugs.xml + messages.xml)</td></tr>
<tr><td>PMD</td><td>Its own Java source AST with symbol and type resolution</td><td>Style, design and error-prone patterns, copy-paste detector (CPD)</td><td>XPath rules in XML, or Java rule classes visiting AST nodes</td></tr>
<tr><td>Error Prone</td><td>javac's attributed AST (com.sun.source.tree + symbols and types)</td><td>Compile-time bugs with suggested fixes; Google runs it on every build</td><td>BugChecker subclasses implementing Tree matchers</td></tr>
<tr><td>NullAway</td><td>Error Prone plugin, javac AST</td><td>Fast null checking with few annotations</td><td>Configuration, library models</td></tr>
<tr><td>Checker Framework</td><td>javac annotation processor, type-checks annotated types</td><td>Sound (modulo annotations) nullness, taint, units, locks, resource leaks</td><td>Write a new type system: qualifiers + rules</td></tr>
<tr><td>Infer (Meta)</td><td>Its own IR (SIL) from javac/clang, separation logic</td><td>Null/resource bugs interprocedurally, RacerD data races, diff analysis</td><td>Limited (models, Topl, config)</td></tr>
<tr><td>CodeQL</td><td>Relational database extracted during the build</td><td>Security taint queries across the whole program</td><td>QL queries</td></tr>
<tr><td>SonarQube</td><td>Its own analyzers (AST + symbolic execution for some rules)</td><td>Dashboards, quality gates on new code, broad rule set</td><td>Java plugin API (less common)</td></tr></table>`,
        `The representation decides the reach. Bytecode has lost generics, comments, and most source structure, but it is exactly what runs and it is available for third-party jars. Source ASTs see formatting, names and annotations but need a build or classpath to resolve types. Running inside javac (Error Prone, Checker Framework, NullAway) gives you the compiler's own resolved types and symbols for free, at the price of being tied to a JDK's internal APIs.`
      ]
    },
    {
      h: `SpotBugs: bytecode detectors`,
      p: [
        `SpotBugs loads class files and runs <b>detectors</b> over each method. Simple detectors are visitors over the bytecode stream; <code>OpcodeStackDetector</code> additionally simulates the JVM operand stack so you know what is on the stack at each instruction (which constant, which field, which method return). Deeper detectors use SpotBugs' dataflow framework over the method CFG, for example the null-pointer analysis behind <code>NP_NULL_ON_SOME_PATH</code>, which tracks a may-be-null lattice value per stack slot and local.`,
        `Bug patterns have codes with a short prefix per family: <code>NP_</code> null pointer, <code>RCN_</code> redundant null check (<code>RCN_REDUNDANT_NULLCHECK_OF_NONNULL_VALUE</code>, often a hint that the earlier dereference is the real bug), <code>ES_COMPARING_STRINGS_WITH_EQ</code>, <code>DLS_DEAD_LOCAL_STORE</code>, <code>DE_MIGHT_IGNORE</code> for swallowed exceptions, <code>IS2_INCONSISTENT_SYNC</code>. A plugin is a jar with detector classes plus <code>findbugs.xml</code> (declares detectors and the bug patterns each reports) and <code>messages.xml</code> (human text). FindSecBugs is the well-known security plugin built this way.`
      ],
      code: `// A SpotBugs detector: report Thread.sleep in methods named test*
import edu.umd.cs.findbugs.BugInstance;
import edu.umd.cs.findbugs.BugReporter;
import edu.umd.cs.findbugs.bcel.OpcodeStackDetector;
import org.apache.bcel.Const;

public class SleepInTestDetector extends OpcodeStackDetector {
    private final BugReporter bugReporter;

    public SleepInTestDetector(BugReporter bugReporter) {
        this.bugReporter = bugReporter;
    }

    @Override
    public void sawOpcode(int seen) {
        if (seen == Const.INVOKESTATIC
                && "java/lang/Thread".equals(getClassConstantOperand())
                && "sleep".equals(getNameConstantOperand())
                && getMethodName().startsWith("test")) {
            bugReporter.reportBug(new BugInstance(this, "TEST_THREAD_SLEEP", NORMAL_PRIORITY)
                    .addClassAndMethod(this)
                    .addSourceLine(this));
        }
    }
}

<!-- findbugs.xml (inside the plugin jar) -->
<FindbugsPlugin pluginid="com.example.flaky" defaultenabled="true">
  <Detector class="com.example.SleepInTestDetector" reports="TEST_THREAD_SLEEP" speed="fast"/>
  <BugPattern type="TEST_THREAD_SLEEP" abbrev="TTS" category="STYLE"/>
</FindbugsPlugin>

# run (Maven): mvn com.github.spotbugs:spotbugs-maven-plugin:check
# run (CLI):   spotbugs -textui -effort:max -low target/classes`
    },
    {
      h: `PMD: AST rules and XPath rules`,
      p: [
        `PMD parses source into its own AST (node names in PMD 7 include <code>ClassDeclaration</code>, <code>MethodDeclaration</code>, <code>MethodCall</code>, <code>ClassType</code>, <code>CatchClause</code>, <code>Block</code>), resolves symbols and types when given an auxclasspath, and runs rules from a ruleset XML. A rule can be a Java class extending <code>AbstractJavaRule</code> with <code>visit(ASTMethodCall node, Object data)</code> methods, but the striking feature is that many rules are just an XPath 3.1 expression over the AST. Attributes are node properties exposed with <code>@</code>: <code>@Name</code>, <code>@MethodName</code>, <code>@SimpleName</code>. Every node the XPath selects becomes a violation.`,
        `PMD 7 renamed many nodes from PMD 6 (for example <code>MethodCall</code> replaced the old <code>PrimaryExpression/PrimarySuffix</code> chains, <code>ClassType</code> replaced <code>ClassOrInterfaceType</code>), so XPath rules written for PMD 6 need porting. The PMD designer GUI shows the AST for a snippet and evaluates XPath live, which is the practical way to write these rules. PMD 7 also provides Java-specific XPath functions such as <code>pmd-java:typeIs('java.util.List')</code>, <code>pmd-java:hasAnnotation('org.junit.jupiter.api.Test')</code> and <code>pmd-java:matchesSig('java.lang.Thread#sleep(long)')</code>, which use type resolution instead of names.`
      ],
      code: `<?xml version="1.0"?>
<ruleset name="flaky-tests"
    xmlns="http://pmd.sourceforge.net/ruleset/2.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://pmd.sourceforge.net/ruleset/2.0.0 https://pmd.sourceforge.io/ruleset_2_0_0.xsd">
  <description>Custom rules for test flakiness</description>

  <rule name="NoThreadSleepInTests"
        language="java"
        message="Thread.sleep() in a test method: wait on a condition instead"
        class="net.sourceforge.pmd.lang.rule.xpath.XPathRule">
    <description>Fixed sleeps make tests timing-dependent.</description>
    <priority>2</priority>
    <properties>
      <property name="xpath">
        <value><![CDATA[
//MethodDeclaration[starts-with(@Name, 'test')]
  //MethodCall[@MethodName = 'sleep']
    [TypeExpression/ClassType[@SimpleName = 'Thread']]
]]></value>
      </property>
    </properties>
  </rule>

  <!-- reuse built-in rules by reference -->
  <rule ref="category/java/errorprone.xml/EmptyCatchBlock"/>
  <rule ref="category/java/errorprone.xml/CompareObjectsWithEquals"/>
</ruleset>

$ pmd check -d src/test/java -R flaky-rules.xml -f text`
    },
    {
      h: `Error Prone: checks inside javac`,
      p: [
        `Error Prone is a javac plugin (<code>-Xplugin:ErrorProne</code>). After javac attributes the AST (every identifier resolved to a symbol, every expression typed), Error Prone scans each compilation unit and dispatches nodes to checkers that implement matcher interfaces: <code>MethodInvocationTreeMatcher</code>, <code>MethodTreeMatcher</code>, <code>BinaryTreeMatcher</code> and so on, one per tree kind. A checker returns <code>Description.NO_MATCH</code> or a description, optionally carrying a <code>SuggestedFix</code> that tools can apply automatically. Findings are reported as ordinary compiler warnings or errors, so they break the build like a type error.`,
        `The <code>Matchers</code> DSL builds reusable predicates: <code>staticMethod().onClass("java.lang.Thread").named("sleep")</code>, <code>instanceMethod().onDescendantOf("java.util.Collection").named("contains")</code>, <code>allOf</code>, <code>anyOf</code>, <code>hasAnnotation</code>. <code>VisitorState</code> gives you the current tree path, types and symbols, and <code>ASTHelpers</code> has utilities such as <code>getSymbol</code>, <code>findEnclosingNode</code> and <code>hasAnnotation</code>. Because matching is on resolved symbols, an alias, static import or fully qualified call all match the same way.`,
        `Setup in brief: add <code>error_prone_core</code> to javac's annotation processor path, pass <code>-XDcompilePolicy=simple</code> and <code>-Xplugin:ErrorProne</code> (plus check options like <code>-Xep:ThreadSleepInTest:ERROR</code>), and, because Error Prone uses internal javac APIs, open the <code>jdk.compiler</code> packages to it with <code>--add-exports</code>/<code>--add-opens</code> flags (in Maven usually via <code>.mvn/jvm.config</code>). Current releases require a recent JDK to run (JDK 17 or later), though they can still compile for older targets with <code>--release</code>.`
      ]
    },
    {
      h: `Null safety three ways: Checker Framework, NullAway, Infer`,
      p: [
        `The <b>Checker Framework</b> treats nullness as a pluggable type qualifier. Types become <code>@Nullable String</code> or <code>@NonNull String</code> (the default for most locations), and the checker runs as an annotation processor (<code>-processor org.checkerframework.checker.nullness.NullnessChecker</code>, or the short name <code>nullness</code>). Dataflow-based <b>type refinement</b> narrows <code>@Nullable</code> to <code>@NonNull</code> after a null check. It also checks initialization (fields must be assigned before the object escapes the constructor) and map keys (<code>@KeyFor</code>). The guarantee: if the checker passes, there are no null dereferences, <i>modulo</i> unannotated libraries, suppressions, and reflection. The price is annotation effort and false positives on patterns it cannot follow.`,
        `<b>NullAway</b> (Uber) is an Error Prone plugin that checks the same <code>@Nullable</code> annotations with a deliberately simpler, intraprocedural analysis. It treats unannotated third-party code optimistically (assumes non-null returns), so it is unsound by design but fast enough (single-digit percent build overhead was a design goal) and quiet enough to be on by default for every build. You tell it which packages are annotated: <code>-XepOpt:NullAway:AnnotatedPackages=com.example</code> (newer versions also understand JSpecify's <code>@NullMarked</code>).`,
        `<b>Infer</b> needs no annotations. It analyzes each method to a summary (a pre/post condition in separation logic) and composes summaries at call sites, so it finds nulls that come from a callee two files away. Its current engine for this, Pulse, reports issues it believes are real on some path (an under-approximate, "no false positives in theory" design), which trades recall for precision in the opposite direction from the Checker Framework.`
      ],
      code: `import org.checkerframework.checker.nullness.qual.Nullable;
import java.util.Map;

class Config {
    private final Map<String, String> env;
    Config(Map<String, String> env) { this.env = env; }

    String home() {
        @Nullable String h = env.get("HOME");   // Map.get returns @Nullable
        return h.trim();                          // error
    }

    String safeHome() {
        @Nullable String h = env.get("HOME");
        if (h == null) {
            return "/";
        }
        return h.trim();                          // refined to @NonNull: OK
    }
}

$ javac -processor org.checkerframework.checker.nullness.NullnessChecker \\
        -cp checker-qual.jar -processorpath checker.jar Config.java
Config.java:10: error: [dereference.of.nullable] dereference of possibly-null reference h
        return h.trim();
               ^

# the same bug under NullAway (Error Prone plugin):
#   -Xplugin:ErrorProne -XepOpt:NullAway:AnnotatedPackages=com.example
# warning: [NullAway] dereferenced expression h is @Nullable`
    },
    {
      h: `CodeQL and SonarQube: query the program, gate the pipeline`,
      p: [
        `<b>CodeQL</b> extracts a relational database during a real build (it watches the compiler), then runs queries written in QL, a Datalog-like object-oriented logic language. The standard library models the AST, CFG, call graph, and dataflow/taint (<code>DataFlow::Global</code>, <code>TaintTracking::Global</code>), so a structural rule is a few lines and a security rule is a source/sink configuration (covered in the taint-analysis lesson). The GitHub code-scanning queries are CodeQL.`,
        `<b>SonarQube</b> is a platform more than an analyzer: it runs its own Java analyzer (hundreds of rules, keyed like <code>java:S2925</code> for Thread.sleep in tests), imports external reports, and enforces a <b>quality gate</b>, typically on <i>new code</i> only (no new bugs, coverage above a threshold on changed lines). Gating on new code is the standard answer to "we have 40,000 legacy warnings".`
      ],
      code: `$ codeql database create java-db --language=java --command="mvn -B -DskipTests package"
$ codeql query run --database=java-db SleepInTest.ql
$ codeql database analyze java-db codeql/java-queries --format=sarif-latest --output=out.sarif

/** SleepInTest.ql */
import java

from MethodCall call, Method test
where
  call.getMethod().hasQualifiedName("java.lang", "Thread", "sleep") and
  test = call.getEnclosingCallable() and
  test.getAnAnnotation().getType().hasQualifiedName("org.junit.jupiter.api", "Test")
select call, "Thread.sleep() inside test " + test.getName()

$ mvn sonar:sonar -Dsonar.host.url=https://sonar.example.com -Dsonar.token=$SONAR_TOKEN`
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: `What interviewers probe: how Infer scales, what "sound modulo annotations" really means, how Error Prone gets fixes adopted at Google scale, and why bytecode analysis behaves differently from source analysis.`,
    sections: [
      {
        h: `Infer: separation logic, bi-abduction, and compositionality`,
        p: [
          `Separation logic describes heaps with the separating conjunction <code>P * Q</code>: P and Q hold on disjoint parts of memory. That locality is what makes per-procedure reasoning possible: a method's spec only mentions the cells it touches (the frame rule lets everything else pass through unchanged). <b>Bi-abduction</b> is the inference step at a call site: given the caller's current heap H and the callee's precondition P, solve <code>H * ?anti-frame |- P * ?frame</code>, where the anti-frame is the missing part the caller must have had (added to the caller's own inferred precondition) and the frame is what the call leaves untouched. Running this bottom-up over the call graph produces a summary for every method without needing the callers, which is what "compositional" means.`,
          `Compositionality is the operational win: when a diff changes three methods, Infer re-analyzes those and their dependents rather than the whole program, which is how it runs on every code review at Meta. The newer Pulse engine keeps the compositional design but is <i>under-approximate</i>: summaries describe behaviors that definitely can happen (in the spirit of incorrectness logic), so a reported null dereference comes with a real path, and false positives are rare in principle; the cost is missed bugs. <b>RacerD</b> is a separate compositional analysis that, for classes marked <code>@ThreadSafe</code> (or using locks), summarizes which accesses happen under which locks and reports unprotected read/write and write/write pairs as <code>THREAD_SAFETY_VIOLATION</code>.`
        ],
        code: `$ infer run -- javac Config.java            # or: infer run -- mvn package / ./gradlew build
$ infer explore                             # browse reports with traces
# infer-out/report.txt lists issue type, file:line and a trace, e.g. a
# null dereference whose value came from a call two methods away`
      },
      {
        h: `"Sound modulo annotations": where the Checker Framework's guarantee ends`,
        p: [
          `The Checker Framework is a type system, so its guarantee has the usual type-soundness shape: if every class is checked and nothing is suppressed, a well-typed program never dereferences null. The holes are explicit: <code>@SuppressWarnings("nullness")</code>, unchecked libraries (bytecode without annotations is treated per a configurable default, and stub files or annotated JDK fill some of the gap), reflection and JNI, and casts. In an interview, saying "sound with respect to the annotated code and its assumptions" is the precise phrase. The checker is conservative on patterns it cannot follow, such as a field checked for null and then read after an arbitrary method call (the call might have reset it; the checker invalidates refinements of fields on calls unless the method is annotated <code>@SideEffectFree</code> or <code>@Pure</code>).`
        ]
      },
      {
        h: `Why Error Prone checks get adopted: fixes, timing, and precision`,
        p: [
          `Google's published lessons from Tricorder and Error Prone: run checks at compile time where the developer is already looking, make most checks errors only when they are essentially never wrong, attach a suggested fix, and measure an "effective false positive" rate (findings developers do not act on), with a target around ten percent; checks above it are demoted or removed. Error Prone's <code>-XepPatchChecks:</code> and <code>-XepPatchLocation:</code> options apply SuggestedFixes as a patch across a codebase, which is how large-scale migrations are done. The general principle for any analyzer: a finding without an obvious, cheap action is noise.`
        ]
      },
      {
        h: `Bytecode vs source: what each loses`,
        p: [
          `javac desugars before bytecode: string switches become hashCode switches, try-with-resources becomes nested try/finally with suppressed-exception plumbing, lambdas become invokedynamic plus synthetic methods, generic types are erased. A bytecode analyzer like SpotBugs sees the desugared form, which is why it sometimes reports a redundant null check or dead store that exists only in compiler-generated code; SpotBugs carries heuristics to filter those. Conversely it sees exactly what runs, handles Kotlin/Scala output, and needs no build configuration beyond compiled classes. Source analyzers see intent (annotations, names, comments, generics) but must replicate the compiler's resolution, which is why PMD needs an auxclasspath for type-aware rules and why running inside javac (Error Prone) is so attractive.`
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: `Inspecting the Sunny: Before, During and After It Is Built`,
      text: [
        `Franky is building a new ship, and four inspectors show up. Usopp inspects the blueprints line by line with a checklist and a magnifying glass: "every railing drawn here needs a support beam". He can be told new rules in a sentence. Iceburg stands beside Franky while the hull is assembled, checking each joint the moment it is nailed, and when a joint is wrong he hands over the correct joint on the spot.`,
        `Robin insists every crate on the manifest is labeled "may be empty" or "never empty", and refuses to sign off until every crate opened is either labeled never empty or checked first. Slow, but when she signs, no one opens an empty crate by surprise, unless someone tore a label off.`,
        `Finally, Paulie walks the finished ship below deck, inspecting the actual timbers rather than the drawings. He finds things the drawings never showed, and sometimes mistakes a temporary scaffold for a real flaw.`
      ]
    },
    sitcom: {
      show: 'Friends',
      title: `Monica Checks Thanksgiving Dinner at Every Stage`,
      text: [
        `Monica reads the recipes the night before with a checklist (PMD). While cooking, she watches every step over Joey's shoulder and swaps his salt for sugar mistake before it hits the pot (Error Prone, with a suggested fix). Rachel's trifle gets tasted at the end, after it is fully assembled, which is how they discover the beef layer (SpotBugs on the finished product). Ross wants every dish labeled with allergens before anyone eats, and nobody may serve an unlabeled dish (Checker Framework). Chandler: "Could there BE more inspectors?"`
      ]
    },
    why: `Usopp with the blueprints is PMD on the source AST with XPath checklists. Iceburg is Error Prone inside javac, checking each joint as it is made and handing over a SuggestedFix. Robin's labels are the Checker Framework's @Nullable/@NonNull types, sound unless a label is torn off (suppressed or unannotated). Paulie below deck is SpotBugs on bytecode: he sees what was really built, scaffolding (compiler-generated code) included.`
  },
  storyAnim: {
    h: 250,
    props: [
      { id: 'src', emoji: '📜', label: 'Flaky.java (source)', x: 10, y: 50 },
      { id: 'javac', emoji: '⚙️', label: 'javac (typed AST)', x: 40, y: 50 },
      { id: 'cls', emoji: '📦', label: 'Flaky.class (bytecode)', x: 70, y: 50 },
      { id: 'gate', emoji: '🚦', label: 'CI quality gate', x: 92, y: 50 }
    ],
    actors: [
      { id: 'usopp', emoji: '🔍', label: 'Usopp (PMD)', x: 10, y: 14 },
      { id: 'iceburg', emoji: '🔨', label: 'Iceburg (Error Prone)', x: 40, y: 14 },
      { id: 'robin', emoji: '🏷️', label: 'Robin (Checker Fw)', x: 40, y: 86 },
      { id: 'paulie', emoji: '🪵', label: 'Paulie (SpotBugs)', x: 70, y: 14 }
    ],
    steps: [
      { c: `One test file goes down the slipway: source, then javac, then bytecode. Four inspectors wait at different points.` },
      { c: `Usopp reads the source with his XPath checklist: a MethodDeclaration named test* containing MethodCall sleep on Thread. Violation.`, a: { usopp: [12, 32] }, p: { src: 'bad' } },
      { c: `Inside javac, symbols are resolved. Iceburg's BugChecker matches staticMethod().onClass("java.lang.Thread").named("sleep") and reports it as a compiler warning.`, a: { iceburg: [40, 32] }, p: { javac: 'lit' } },
      { c: `Robin checks labels: xs is null and then xs.size() is called. A @Nullable value is dereferenced, a type error.`, a: { robin: [40, 68] }, p: { javac: 'bad' } },
      { c: `Paulie inspects the built bytecode: a == b on Strings (ES_COMPARING_STRINGS_WITH_EQ) and an exception swallowed in an empty catch.`, a: { paulie: [70, 32] }, p: { cls: 'bad' } },
      { c: `All findings go to the quality gate. Only new findings on changed lines block the merge.`, p: { gate: 'lit' } },
      { c: `Fix the sleep with a polling wait, add the null check, use equals. The gate goes green.`, p: { src: 'good', javac: 'good', cls: 'good', gate: 'good' }, l: { gate: 'gate passed' } }
    ]
  },
  conceptFlow: {
    title: `Where each Java analyzer hooks into the build`,
    intro: `The representation a tool analyzes decides what it can see. Click a box to jump to it.`,
    stages: [
      { label: 'Source', nodes: [ { id: 'java', text: '.java files' }, { id: 'pmd', text: 'PMD\nown AST + XPath' } ] },
      { label: 'Compile (javac)', nodes: [ { id: 'attr', text: 'parse + attribute\n(symbols, types)' }, { id: 'ep', text: 'Error Prone / NullAway\nBugChecker matchers' }, { id: 'cf', text: 'Checker Framework\npluggable type check' } ] },
      { label: 'Artifacts', nodes: [ { id: 'bc', text: '.class bytecode' }, { id: 'sb', text: 'SpotBugs\ndetectors + dataflow' }, { id: 'infer', text: 'Infer / CodeQL\ncapture build, own IR or DB' } ] },
      { label: 'Gate', nodes: [ { id: 'sarif', text: 'SARIF / reports' }, { id: 'qg', text: 'quality gate\non new code' } ] }
    ],
    steps: [
      { active: ['java', 'pmd'], note: `PMD parses source itself. It needs no compile, but type-aware rules want an auxclasspath. XPath rules match AST shapes.` },
      { active: ['attr'], note: `javac parses and attributes: every name now has a symbol, every expression a type. That is the richest representation available, and plugins can reuse it.` },
      { active: ['ep'], note: `Error Prone and NullAway run as a javac plugin after attribution. Findings are compiler diagnostics, often with a SuggestedFix.` },
      { active: ['cf'], note: `The Checker Framework runs as an annotation processor and type-checks qualifiers like @Nullable, refining types after null checks.` },
      { active: ['bc', 'sb'], note: `SpotBugs reads bytecode after compilation: no source needed, desugared code included.` },
      { active: ['infer'], note: `Infer and CodeQL wrap the build command, capture each compilation, and translate to their own IR or database for interprocedural analysis.` },
      { active: ['sarif', 'qg'], note: `Results converge as SARIF or tool reports; the quality gate blocks only on new findings so legacy debt does not stop every merge.` }
    ]
  },
  tech: [
    {
      q: `Why does Error Prone need --add-exports flags and a recent JDK?`,
      a: `Error Prone uses javac's internal APIs (com.sun.tools.javac.tree, code, util, and friends) to read attributed trees and symbols. Since the JDK module system, those packages are encapsulated in the jdk.compiler module and not exported, so the JVM running javac must be told to export and open them to unnamed modules. Error Prone tracks recent javac internals closely and drops old JDKs to keep that manageable, so current releases need a recent JDK to run on, while <code>--release</code> still lets you target older bytecode.`
    },
    {
      q: `What does OpcodeStackDetector give a SpotBugs detector that a plain visitor does not?`,
      a: `JVM bytecode is a stack machine: arguments are pushed before an invoke. A plain bytecode visitor sees <code>INVOKESTATIC java/lang/Thread.sleep</code> but not what is being passed. OpcodeStackDetector maintains a symbolic model of the operand stack as it walks the method (merging at branch targets), so at each opcode you can ask <code>stack.getStackItem(0)</code> for the top value and learn whether it is a constant, a field load, a method return or a parameter. That is how detectors like "return value of String.trim ignored" and "constant passed as timeout" are written.`
    },
    {
      q: `Why are PMD XPath rules so convenient, and where do they break down?`,
      a: `They need no compiled code: the rule is data in the ruleset, matched against PMD's AST, so a team can add a rule in minutes and test it in the designer. They break down when the property is not local to a tree shape: anything needing dataflow (was this variable null-checked on every path?), interprocedural reasoning, or precise types (XPath sees names unless you use type-aware functions such as pmd-java:typeIs with a correct auxclasspath). Then you write a Java rule, or move to Error Prone or CodeQL.`
    },
    {
      q: `NullAway and the Checker Framework read the same @Nullable annotation. Why can one be on by default and the other not?`,
      a: `The Checker Framework aims for soundness: it checks initialization, generics with nullness, map keys, invalidates field refinements on calls, and treats unannotated library code conservatively. That precision on hard cases costs build time and annotation effort and produces warnings on code that is actually fine. NullAway checks only within methods with simpler rules, trusts unannotated libraries to return non-null, and ignores some initialization corners. It misses some bugs, but it is fast enough for every build and rarely wrong, which is the property that lets you turn it on for an entire monorepo.`
    }
  ],
  code: {
    title: `An Error Prone BugChecker: Thread.sleep in @Test methods`,
    intro: `A complete custom check. It matches calls by resolved symbol (so static imports and qualified calls are caught), finds the enclosing method, and fires only if that method is a JUnit 4 or 5 test. Build it as a jar with error_prone_check_api on the classpath, put the jar on javac's annotation processor path next to error_prone_core, and it runs on every compile. (Error Prone could not be executed in this course's sandbox; the API calls below are from Error Prone's public check API.)`,
    code: `package com.example.checks;

import static com.google.errorprone.BugPattern.SeverityLevel.WARNING;
import static com.google.errorprone.matchers.Matchers.staticMethod;

import com.google.auto.service.AutoService;
import com.google.errorprone.BugPattern;
import com.google.errorprone.VisitorState;
import com.google.errorprone.bugpatterns.BugChecker;
import com.google.errorprone.bugpatterns.BugChecker.MethodInvocationTreeMatcher;
import com.google.errorprone.matchers.Description;
import com.google.errorprone.matchers.Matcher;
import com.google.errorprone.util.ASTHelpers;
import com.sun.source.tree.ExpressionTree;
import com.sun.source.tree.MethodInvocationTree;
import com.sun.source.tree.MethodTree;
import com.sun.tools.javac.code.Symbol.MethodSymbol;

@AutoService(BugChecker.class)
@BugPattern(
    summary = "Thread.sleep() in a test makes it timing-dependent; wait on a condition instead",
    severity = WARNING)
public final class ThreadSleepInTest extends BugChecker
    implements MethodInvocationTreeMatcher {

  private static final Matcher<ExpressionTree> THREAD_SLEEP =
      staticMethod().onClass("java.lang.Thread").named("sleep");

  @Override
  public Description matchMethodInvocation(MethodInvocationTree tree, VisitorState state) {
    if (!THREAD_SLEEP.matches(tree, state)) {
      return Description.NO_MATCH;
    }
    MethodTree enclosing = ASTHelpers.findEnclosingNode(state.getPath(), MethodTree.class);
    if (enclosing == null) {
      return Description.NO_MATCH;          // e.g. in a field initializer
    }
    MethodSymbol method = ASTHelpers.getSymbol(enclosing);
    boolean isTest =
        ASTHelpers.hasAnnotation(method, "org.junit.Test", state)
            || ASTHelpers.hasAnnotation(method, "org.junit.jupiter.api.Test", state);
    return isTest ? describeMatch(tree) : Description.NO_MATCH;
  }
}

// Enable and raise to an error in the consuming build:
//   -XDcompilePolicy=simple
//   -Xplugin:ErrorProne -Xep:ThreadSleepInTest:ERROR
// Output looks like any javac diagnostic:
//   FlakyTest.java:12: error: [ThreadSleepInTest] Thread.sleep() in a test makes it ...
//       Thread.sleep(500);
//                   ^`,
    notes: [
      `<code>@BugPattern</code> without an explicit <code>name</code> uses the class simple name as the check name, which is what <code>-Xep:ThreadSleepInTest:ERROR</code> refers to.`,
      `<code>@AutoService</code> generates the <code>META-INF/services</code> entry so Error Prone discovers the checker on the processor path.`,
      `To attach a fix, return <code>describeMatch(tree, SuggestedFix.builder()...build())</code>; Error Prone's patch mode can then apply it across a codebase.`,
      `Error Prone ships <code>CompilationTestHelper</code> for unit tests: you give it source lines annotated with <code>// BUG: Diagnostic contains:</code> comments and it asserts the diagnostics.`
    ]
  },
  lab: {
    title: `Write a PMD 7 XPath rule for sleeping JUnit 5 tests`,
    prompt: `Write a PMD ruleset XML containing one XPath rule named <code>NoThreadSleepInJUnitTests</code>. It must select every <code>MethodCall</code> named <code>sleep</code> whose qualifier is the class <code>Thread</code>, but only inside a <code>MethodDeclaration</code> annotated with JUnit 5's <code>@Test</code>. Use the XPathRule class, priority 2, and a message telling the developer to wait on a condition. For the annotation test you can use either <code>pmd-java:hasAnnotation('org.junit.jupiter.api.Test')</code> or a structural <code>Annotation[@SimpleName = 'Test']</code> step.`,
    starter: `<?xml version="1.0"?>
<ruleset name="flaky-tests"
    xmlns="http://pmd.sourceforge.net/ruleset/2.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://pmd.sourceforge.net/ruleset/2.0.0 https://pmd.sourceforge.io/ruleset_2_0_0.xsd">
  <description>Flaky test rules</description>
  <rule name="TODO"
        language="java"
        message="TODO"
        class="TODO">
    <description>TODO</description>
    <priority>TODO</priority>
    <properties>
      <property name="xpath">
        <value><![CDATA[
TODO
]]></value>
      </property>
    </properties>
  </rule>
</ruleset>
`,
    checks: [
      { re: 'name="NoThreadSleepInJUnitTests"', flags: '', must: true, hint: 'Name the rule NoThreadSleepInJUnitTests', pass: 'rule name ✓' },
      { re: 'class="net\\.sourceforge\\.pmd\\.lang\\.rule\\.xpath\\.XPathRule"', flags: '', must: true, hint: 'PMD 7 XPath rules use class net.sourceforge.pmd.lang.rule.xpath.XPathRule', pass: 'XPathRule class ✓' },
      { re: '<priority>\\s*2\\s*</priority>', flags: '', must: true, hint: 'Set <priority>2</priority>', pass: 'priority ✓' },
      { re: '//MethodDeclaration\\s*\\[', flags: '', must: true, hint: 'Start from //MethodDeclaration[...] with a predicate', pass: 'MethodDeclaration step ✓' },
      { re: "(pmd-java:hasAnnotation\\(\\s*'org\\.junit\\.jupiter\\.api\\.Test'\\s*\\)|Annotation\\s*\\[\\s*@SimpleName\\s*=\\s*'Test'\\s*\\])", flags: '', must: true, hint: 'Filter methods by the @Test annotation', pass: '@Test filter ✓' },
      { re: "//MethodCall\\s*\\[\\s*@MethodName\\s*=\\s*'sleep'\\s*\\]", flags: '', must: true, hint: "Select //MethodCall[@MethodName = 'sleep'] below the method", pass: 'MethodCall sleep ✓' },
      { re: "ClassType\\s*\\[\\s*@SimpleName\\s*=\\s*'Thread'\\s*\\]", flags: '', must: true, hint: "Require the qualifier ClassType[@SimpleName = 'Thread']", pass: 'Thread qualifier ✓' },
      { re: 'TODO', flags: '', must: false, hint: 'Replace every TODO', pass: 'no TODOs left ✓' }
    ],
    run: `Install PMD 7 (download the pmd-dist zip from the PMD GitHub releases page and put its <code>bin</code> on your PATH). Save the rule as <code>flaky-rules.xml</code> and a JUnit 5 test with a <code>Thread.sleep(500)</code> under <code>src/test/java</code>, plus a non-test helper that also sleeps. Then:<pre><code>pmd check -d src/test/java -R flaky-rules.xml -f text
# expect exactly one violation, on the sleep inside the @Test method
pmd designer        # paste the test class, inspect the AST, evaluate the XPath live</code></pre>`,
    solution: `<?xml version="1.0"?>
<ruleset name="flaky-tests"
    xmlns="http://pmd.sourceforge.net/ruleset/2.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://pmd.sourceforge.net/ruleset/2.0.0 https://pmd.sourceforge.io/ruleset_2_0_0.xsd">
  <description>Flaky test rules</description>
  <rule name="NoThreadSleepInJUnitTests"
        language="java"
        message="Thread.sleep() in a JUnit test: wait on a condition instead"
        class="net.sourceforge.pmd.lang.rule.xpath.XPathRule">
    <description>Fixed sleeps make tests timing-dependent and slow.</description>
    <priority>2</priority>
    <properties>
      <property name="xpath">
        <value><![CDATA[
//MethodDeclaration[pmd-java:hasAnnotation('org.junit.jupiter.api.Test')]
  //MethodCall[@MethodName = 'sleep']
    [TypeExpression/ClassType[@SimpleName = 'Thread']]
]]></value>
      </property>
    </properties>
  </rule>
</ruleset>
`,
    notes: [
      `This rule was written against PMD 7's documented AST and XPath functions but could not be executed in the course sandbox; run it in <code>pmd designer</code> first to confirm node names on your PMD version.`,
      `<code>pmd-java:hasAnnotation</code> uses type resolution, so it distinguishes JUnit 5's <code>@Test</code> from JUnit 4's or TestNG's. The structural <code>Annotation[@SimpleName = 'Test']</code> form matches any annotation named Test.`,
      `A static import (<code>import static java.lang.Thread.sleep;</code> then <code>sleep(500)</code>) has no <code>TypeExpression</code> qualifier and slips past this rule. <code>MethodCall[pmd-java:matchesSig('java.lang.Thread#sleep(long)')]</code> matches by resolved signature and closes that gap.`,
      `The <code>//</code> between the two steps means "any descendant", so sleeps inside loops, lambdas and anonymous classes within the test are reported too.`
    ]
  },
  quiz: [
    {
      q: `Which tool can analyze a third-party jar for which you have no source?`,
      options: [`PMD`, `Error Prone`, `SpotBugs`, `Checker Framework`],
      correct: 2,
      explain: `SpotBugs reads bytecode. PMD needs source, and Error Prone and the Checker Framework run inside javac while compiling source.`
    },
    {
      q: `An Error Prone matcher <code>staticMethod().onClass("java.lang.Thread").named("sleep")</code> also catches a statically imported <code>sleep(100)</code>. Why?`,
      options: [`It uses a regex over the source text`, `It matches javac's resolved method symbol, not the spelling at the call site`, `Error Prone rewrites static imports first`, `It does not catch it`],
      correct: 1,
      explain: `Error Prone runs after attribution, so every call has a resolved MethodSymbol. The matcher compares the symbol's owner and name.`
    },
    {
      q: `What does "sound modulo annotations" mean for the Checker Framework's nullness checker?`,
      options: [`It never reports false positives`, `If all code is checked and nothing suppressed, there are no null dereferences, but unchecked libraries, suppressions and reflection are trusted`, `It is unsound for all programs`, `It infers all annotations automatically`],
      correct: 1,
      explain: `It is a type system: the guarantee holds for checked code under its stated assumptions, and every escape hatch is an explicit trust boundary.`
    },
    {
      q: `What makes Infer practical to run on every code review in a huge codebase?`,
      options: [`It only checks style`, `It is compositional: per-method summaries via bi-abduction mean only changed methods and their dependents are re-analyzed`, `It samples 1% of files`, `It runs the tests`],
      correct: 1,
      explain: `Bi-abduction infers each method's pre/postcondition independently of callers, and summaries compose at call sites, which enables incremental, diff-time analysis.`
    },
    {
      q: `A PMD XPath rule is the wrong tool when the property is:`,
      options: [`A method named test* contains a call to sleep`, `An empty catch block`, `A variable might be null on some path before it is dereferenced`, `A class has more than 20 methods`],
      correct: 2,
      explain: `Path-sensitive null reasoning needs dataflow over the CFG. The other three are local tree shapes, exactly what XPath over an AST is good at.`
    }
  ],
  testFlow: {
    title: `Test yourself: picking the Java analyzer`,
    start: 'q1',
    nodes: {
      q1: {
        q: `Your team wants a new check that blocks the build, has an automatic fix, and must understand static imports and overloads. Which tool do you write it in?`,
        choices: [
          { text: `Error Prone BugChecker`, to: 'q1_right' },
          { text: `PMD XPath rule`, to: 'q1_wrong_pmd' },
          { text: `SpotBugs detector`, to: 'q1_wrong_sb' }
        ]
      },
      q1_right: { end: true, correct: true, text: `Yes. It runs in javac on resolved symbols, reports as a compile diagnostic, and SuggestedFix gives the automatic fix.`, next: 'q2' },
      q1_wrong_pmd: { end: true, correct: false, text: `XPath rules are quick, but they match syntax unless you use type-aware functions, and PMD does not apply fixes. Which tool runs on javac's resolved symbols?`, retry: 'q1' },
      q1_wrong_sb: { end: true, correct: false, text: `SpotBugs runs after compilation on bytecode and does not produce source fixes. Look earlier in the build.`, retry: 'q1' },
      q2: {
        q: `A security team wants a guarantee: no null dereference anywhere in the payments module, and will pay for annotations. Which tool?`,
        choices: [
          { text: `NullAway`, to: 'q2_wrong_na' },
          { text: `Checker Framework Nullness Checker`, to: 'q2_right' },
          { text: `Infer Pulse`, to: 'q2_wrong_infer' }
        ]
      },
      q2_right: { end: true, correct: true, text: `Right. It is the sound option (modulo annotations and suppressions), checking initialization and generics too. The annotations are the price.`, next: 'q3' },
      q2_wrong_na: { end: true, correct: false, text: `NullAway is fast and practical but intentionally unsound: it trusts unannotated code and skips hard cases. "Guarantee" points elsewhere.`, retry: 'q2' },
      q2_wrong_infer: { end: true, correct: false, text: `Pulse is under-approximate: what it reports is likely real, but it does not claim to find every null dereference.`, retry: 'q2' },
      q3: {
        q: `SpotBugs reports a redundant null check (RCN_) in a method using try-with-resources, but the source has no such check. What is the likely explanation?`,
        choices: [
          { text: `The check exists in compiler-generated bytecode for try-with-resources`, to: 'q3_right' },
          { text: `SpotBugs is reading a stale source file`, to: 'q3_wrong_src' },
          { text: `It is a real bug in the JDK`, to: 'q3_wrong_jdk' }
        ]
      },
      q3_right: { end: true, correct: true, text: `Correct. javac desugars try-with-resources into code that null-checks the resource; bytecode analyzers see that and need filters for it.`, next: null },
      q3_wrong_src: { end: true, correct: false, text: `SpotBugs does not analyze source at all. Think about what javac emits.`, retry: 'q3' },
      q3_wrong_jdk: { end: true, correct: false, text: `The code is generated by javac for your method, and it is correct. The analyzer is seeing desugared code.`, retry: 'q3' }
    }
  },
  pitfalls: [
    `Enabling every SpotBugs, PMD and Sonar rule on a legacy codebase and blocking the build. Gate on new code, baseline the rest, and turn up rules one at a time.`,
    `Writing PMD XPath rules against PMD 6 node names (PrimaryExpression, ClassOrInterfaceType) and then wondering why they silently match nothing on PMD 7.`,
    `Calling NullAway "sound". It is deliberately not: unannotated libraries are trusted, and it is the wrong tool to promise "no NPEs".`,
    `Forgetting that Error Prone and the Checker Framework need the javac internals opened (--add-exports/--add-opens) on modern JDKs, leading to IllegalAccessError at compile time.`,
    `Running Infer or CodeQL on the source tree without the real build command. Both capture compilation, so a build that skips modules produces an analysis that silently skips them too.`
  ],
  interview: [
    {
      q: `Compare SpotBugs, PMD and Error Prone. Which would you choose for a new team, and why?`,
      a: `They work on different representations. PMD parses source into its own AST, is excellent for style and simple error patterns, and allows XPath rules without compiling. SpotBugs analyzes bytecode with per-method dataflow, catches things like null on some path and bad equals, and works on jars without source, but it runs after compilation and reports on desugared code. Error Prone runs inside javac on fully attributed trees, so it sees resolved symbols and types, reports as compile errors at the moment the developer is looking, and many checks carry automatic fixes. For a new team I would start with Error Prone (plus NullAway) in the build, because compile-time, precise, fixable findings are the ones that actually get acted on, and add PMD or Sonar for style and design rules on new code only. SpotBugs is valuable when analyzing artifacts or non-Java JVM languages.`
    },
    {
      q: `Walk me through writing a custom Error Prone check.`,
      a: `Subclass BugChecker and implement the matcher interface for the tree kind you care about, for example MethodInvocationTreeMatcher. Annotate with @BugPattern giving summary and severity (the name defaults to the class name). Build matchers with the Matchers DSL, such as staticMethod().onClass("java.lang.Thread").named("sleep"). In matchMethodInvocation, return Description.NO_MATCH unless it matches, use VisitorState and ASTHelpers to inspect context (findEnclosingNode for the enclosing MethodTree, getSymbol, hasAnnotation for @Test), and return describeMatch(tree) or describeMatch(tree, fix) with a SuggestedFix. Register with @AutoService(BugChecker.class), test with CompilationTestHelper using "// BUG: Diagnostic contains:" comments, ship as a jar on the annotation processor path, and enable with -Xep:Name:ERROR after a warning-only period to measure false positives.`
    },
    {
      q: `Explain bi-abduction and why it matters for Infer.`,
      a: `Infer's specs are separation-logic pre/postconditions. At a call site the analyzer has the caller's symbolic heap H and the callee's precondition P. Bi-abduction solves H * M |- P * F for two unknowns: M, the anti-frame, is the heap the caller was missing and gets added to the caller's own inferred precondition; F, the frame, is the part of the heap the callee does not touch and that passes through unchanged. Because every method's spec is inferred this way without knowing its callers, analysis is compositional: summaries are computed bottom-up over the call graph and reused. That gives scalability to millions of lines and incrementality: on a diff, only changed methods and their dependents are re-analyzed, which is what makes running at code review time possible.`
    },
    {
      q: `Tradeoff question: Checker Framework vs NullAway vs Infer for null safety. Which goes on by default in a monorepo?`,
      a: `The Checker Framework is the sound option: annotated types with flow refinement, initialization checking, generics; it guarantees no NPEs modulo annotations, suppressions and unchecked code, at the price of annotation burden, slower builds and false positives on hard patterns. NullAway uses the same annotations with a simpler intraprocedural check, trusts unannotated libraries, and costs little build time, so it is unsound but quiet and fast. Infer needs no annotations and reasons interprocedurally with summaries; Pulse reports likely-real bugs and misses others. For an always-on default I would pick NullAway, because a check people never disable beats a stronger one they route around. I would reserve the Checker Framework for modules where a guarantee is worth the cost, and run Infer at diff time to catch interprocedural nulls NullAway cannot see.`
    },
    {
      q: `Design question: you inherit a 2-million-line Java codebase with no static analysis. Design the rollout.`,
      a: `Phase one, inventory and baseline: run Error Prone's default checks, SpotBugs and Sonar or PMD once, collect counts per rule, and sample findings per rule to estimate precision. Phase two, pick rules with high precision and cheap fixes; turn them on in the build as warnings, record a baseline of existing findings so only new ones are reported, and gate the PR on "no new findings" (Sonar quality gate on new code, or SARIF diffing against the merge base). Phase three, use automatic fixes to burn down legacy findings in bulk, for example Error Prone's patch mode, in small reviewable changes owned by each team. Phase four, add deeper analysis: NullAway on packages as they get annotated, Infer or CodeQL at diff time for interprocedural nulls and taint. Throughout, track the fraction of findings that get fixed versus suppressed per rule, and demote any rule whose effective false positive rate climbs above roughly ten percent.`
    },
    {
      q: `Why might SpotBugs and a source-level tool disagree about the same method?`,
      a: `They analyze different programs. javac desugars many constructs: try-with-resources becomes try/finally with null checks and suppressed-exception handling, string switch becomes hashCode/equals dispatch, lambdas become synthetic methods plus invokedynamic, generics are erased, and constant expressions are folded. SpotBugs sees the desugared bytecode, so it can report redundant null checks or dead stores in compiler-generated code (it ships heuristics to filter many), and it can miss things that are only visible in source, like annotations with source retention or generic type arguments. A source tool sees intent but must replicate javac's resolution and may disagree on overloads without a full classpath.`
    },
    {
      q: `How would you write the same "no Thread.sleep in tests" rule in CodeQL, and what does CodeQL add over PMD for it?`,
      a: `In QL: from MethodCall call, Method test where call.getMethod().hasQualifiedName("java.lang", "Thread", "sleep") and test = call.getEnclosingCallable() and test.getAnAnnotation().getType().hasQualifiedName("org.junit.jupiter.api", "Test") select call, a message. Because CodeQL resolves calls from the real build, static imports and overloads are handled. What it adds over PMD is the rest of the program: the same database has the call graph, so I can extend the query to tests that call any helper which transitively calls Thread.sleep (using a recursive predicate or the call graph's transitive closure), and dataflow libraries if the sleep duration comes from somewhere interesting. The costs are a build-capture step and a slower, heavier pipeline than PMD.`
    }
  ]
};
