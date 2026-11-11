window.LESSONS = window.LESSONS || {};
window.LESSONS['soot-and-jimple'] = {
  id: 'soot-and-jimple',
  title: "Soot & SootUp: Jimple, Bytecode IR & Call Graphs for Java",
  category: "Part 2 — Lowering to Intermediate Representations",
  timeMin: 50,
  summary: "Soot lifts Java bytecode (and Android Dalvik) into Jimple, a typed three-address IR with about fifteen statement kinds, and gives you control-flow graphs, SSA (Shimple), call graphs (CHA, RTA, Spark points-to) and a plugin pipeline of packs and phases. It underlies FlowDroid and much of the Java program-analysis research of the last two decades. SootUp is its redesign: no global singleton, immutable views over explicit input locations, lazy loading, and a cleaner call-graph API. This lesson is hands-on with both. All Jimple, Shimple and Grimp listings and all program outputs below were produced by actually running Soot 4.4.1 (Java 8) and SootUp 2.0.0 (Java 17).",
  goals: [
    "Run classic Soot from the command line (<code>-cp</code>, <code>-pp</code>, <code>-process-dir</code>, <code>-f J/S/G</code>, <code>-p phase opt:val</code>) and read real Jimple, Shimple and Grimp",
    "Navigate the classic Soot object model: <code>Scene</code>, <code>SootClass</code>, <code>SootMethod</code>, <code>Body</code>, <code>Unit</code>/<code>Stmt</code>, <code>Value</code>/<code>ValueBox</code>, <code>UnitGraph</code>",
    "Write a <code>BodyTransformer</code> registered in the <code>jtp</code> pack, and a whole-program driver that builds a Spark or CHA call graph",
    "Use SootUp: <code>JavaView</code>, <code>AnalysisInputLocation</code>, <code>JavaClassType</code> via <code>IdentifierFactory</code>, <code>getBody().getStmtGraph()</code>, and <code>CallGraphAlgorithm</code> with CHA and RTA",
    "Explain why CHA, RTA and Spark give different call graphs, and the precision and scalability tradeoffs"
  ],
  concept: [
    {
      h: "Why an IR for Java bytecode, and what Jimple looks like",
      p: [
        "JVM bytecode is stack based: about 200 opcodes, implicit operands on an operand stack, untyped local slots that may be reused for values of different types. That is awkward for analysis. Soot's <b>jb</b> (Jimple body) phase converts each method into Jimple: explicit typed locals, three-address statements, and only around fifteen statement kinds: <code>IdentityStmt</code> (<code>r0 := @this</code>, <code>i0 := @parameter0</code>, <code>r1 := @caughtexception</code>), <code>AssignStmt</code>, <code>InvokeStmt</code>, <code>IfStmt</code>, <code>GotoStmt</code>, <code>TableSwitchStmt</code>/<code>LookupSwitchStmt</code>, <code>ReturnStmt</code>/<code>ReturnVoidStmt</code>, <code>ThrowStmt</code>, <code>EnterMonitorStmt</code>/<code>ExitMonitorStmt</code>, <code>NopStmt</code>, <code>BreakpointStmt</code>, <code>RetStmt</code>.",
        "Invocations carry the fully resolved method signature in angle brackets and the dispatch kind: <code>staticinvoke</code>, <code>virtualinvoke</code>, <code>interfaceinvoke</code>, <code>specialinvoke</code> (constructors, private, super), <code>dynamicinvoke</code> (<code>invokedynamic</code>). Locals prefixed with <code>$</code> are stack-derived temporaries; others correspond to bytecode local slots. Type inference assigns each local a Java type.",
        "Below is real Jimple produced by <code>java -cp soot-4.4.1-jar-with-dependencies.jar soot.Main -cp . -pp -f J Demo</code> for a class compiled with <code>javac -g</code>. Compare it with the source: the loop condition is inverted into a jump out of the loop, the field read <code>System.out</code> gets its own statement, and <code>args[i].length()</code> becomes three statements."
      ],
      code: String.raw`// Demo.java
public class Demo {
    static int abs(int x) {
        if (x < 0) {
            x = -x;
        }
        return x;
    }
    public static void main(String[] args) {
        int s = 0;
        for (int i = 0; i < args.length; i++) {
            s += abs(args[i].length());
        }
        System.out.println(s);
    }
}

// sootOutput/Demo.jimple (Soot 4.4.1, -f J)
public class Demo extends java.lang.Object
{
    public void <init>()
    {
        Demo r0;
        r0 := @this: Demo;
        specialinvoke r0.<java.lang.Object: void <init>()>();
        return;
    }

    static int abs(int)
    {
        int i0;
        i0 := @parameter0: int;
        if i0 >= 0 goto label1;
        i0 = neg i0;
     label1:
        return i0;
    }

    public static void main(java.lang.String[])
    {
        java.io.PrintStream $r1;
        java.lang.String[] r0;
        int $i0, $i1, $i2, i3, i4;
        java.lang.String $r2;

        r0 := @parameter0: java.lang.String[];
        i3 = 0;
        i4 = 0;
     label1:
        $i0 = lengthof r0;
        if i4 >= $i0 goto label2;
        $r2 = r0[i4];
        $i1 = virtualinvoke $r2.<java.lang.String: int length()>();
        $i2 = staticinvoke <Demo: int abs(int)>($i1);
        i3 = i3 + $i2;
        i4 = i4 + 1;
        goto label1;
     label2:
        $r1 = <java.lang.System: java.io.PrintStream out>;
        virtualinvoke $r1.<java.io.PrintStream: void println(int)>(i3);
        return;
    }
}`
    },
    {
      h: "Running classic Soot: options and output formats",
      p: [
        "<ul><li><code>-cp PATH</code>: Soot's class path (where to find classes to analyze and their dependencies). <code>-pp</code> (<code>-prepend-classpath</code>) adds the running JVM's class path and runtime library, which you almost always want. On Java 8 that is <code>rt.jar</code>; Soot 4.x also supports Java 9+ module images.</li><li><code>-process-dir DIR</code> (repeatable): analyze every class in a directory or JAR as an application class. Without it, list class names as trailing arguments.</li><li><code>-w</code>: whole-program mode, which enables call-graph construction (<code>cg</code>) and the <code>wj*</code> packs. <code>-main-class C</code> sets the entry point.</li><li><code>-f J|S|G|B|c|n</code>: output Jimple, Shimple, Grimp, Baf, class files, or nothing. Output goes to <code>sootOutput/</code> (change with <code>-d</code>).</li><li><code>-p PHASE OPT:VAL</code>: phase options, e.g. <code>-p cg.spark on</code>, <code>-p jb use-original-names:true</code>, <code>-p cg.cha on</code>.</li><li><code>-allow-phantom-refs</code>: tolerate missing classes by creating phantom stubs instead of aborting. <code>-keep-line-number</code>: keep <code>LineNumberTag</code>s. <code>-src-prec c|only-class|J|java</code>: which input kind to prefer.</li><li><code>-O</code> enables the optimization packs; <code>-via-shimple</code> runs through SSA.</li></ul>",
        "With <code>-p jb use-original-names:true</code> and classes compiled with <code>-g</code>, Jimple uses source variable names; stack temporaries then show up as <code>$stackN</code>. Grimp (<code>-f G</code>) re-aggregates expressions into trees, which reads closer to source and is the starting point for decompilation (Dava)."
      ],
      code: String.raw`$ java -cp soot.jar soot.Main -cp . -pp -f J -p jb use-original-names:true Demo
    public static void main(java.lang.String[])
    {
        java.io.PrintStream $stack4;
        java.lang.String[] args;
        int $stack3, $stack6, $stack7, s, i;
        java.lang.String $stack5;

        args := @parameter0: java.lang.String[];
        s = 0;
        i = 0;
     label1:
        $stack3 = lengthof args;
        if i >= $stack3 goto label2;
        ...

$ java -cp soot.jar soot.Main -cp . -pp -f G Demo        # Grimp: expressions re-nested
    public static void main(java.lang.String[])
    {
        ...
     label1:
        if i4 >= lengthof r0 goto label2;
        $r2 = r0[i4];
        i3 = i3 + staticinvoke <Demo: int abs(int)>($r2.<java.lang.String: int length()>());
        i4 = i4 + 1;
        goto label1;
     label2:
        <java.lang.System: java.io.PrintStream out>.<java.io.PrintStream: void println(int)>(i3);
        return;
    }

$ java -cp soot.jar soot.Main -cp . -pp -f S Demo        # Shimple: SSA with Phi
    static int abs(int)
    {
        int i0, i0_1, i0_2;
        i0 := @parameter0: int;
(0)     if i0 >= 0 goto label1;
(1)     i0_1 = neg i0;
     label1:
        i0_2 = Phi(i0 #0, i0_1 #1);
        return i0_2;
    }`
    },
    {
      h: "The classic Soot object model and packs",
      p: [
        "<b>Scene</b> (<code>Scene.v()</code>) is a global singleton holding all loaded classes, the class hierarchy (<code>getActiveHierarchy()</code>, <code>getFastHierarchy()</code>), entry points, the call graph and the points-to analysis. <b>SootClass</b> has fields, methods, superclass, interfaces and a resolving level (DANGLING, HIERARCHY, SIGNATURES, BODIES); application vs library vs phantom classes matter for what gets analyzed. <b>SootMethod</b> has a signature like <code>&lt;Demo: int abs(int)&gt;</code> and an active <b>Body</b> (<code>retrieveActiveBody()</code> builds it on demand).",
        "A <b>JimpleBody</b> holds <code>getLocals()</code>, <code>getUnits()</code> (a <code>UnitPatchingChain</code> of statements that keeps jump targets consistent when you insert or remove) and <code>getTraps()</code> (exception handler ranges). Each <b>Unit</b> (for Jimple, a <b>Stmt</b>) exposes <code>getUseBoxes()</code>/<code>getDefBoxes()</code>, <code>ValueBox</code>es that hold <b>Value</b>s: <code>Local</code>, <code>Constant</code>, <code>Expr</code> (binop, invoke, cast, new...) and <code>Ref</code> (<code>InstanceFieldRef</code>, <code>StaticFieldRef</code>, <code>ArrayRef</code>, <code>ParameterRef</code>, <code>ThisRef</code>). The boxes are what make in-place rewriting possible. <code>stmt.containsInvokeExpr()</code>/<code>getInvokeExpr()</code> and <code>containsFieldRef()</code> are the common shortcuts.",
        "CFGs: <code>new ExceptionalUnitGraph(body)</code> (with exception edges) or <code>BriefUnitGraph</code> (without); intraprocedural dataflow extends <code>ForwardFlowAnalysis</code>/<code>BackwardFlowAnalysis</code> and implements <code>flowThrough</code>, <code>merge</code>, <code>copy</code>, <code>newInitialFlow</code>.",
        "<b>Packs</b> are ordered lists of phases. Intraprocedural, per body: <code>jb</code> (build Jimple), <code>jtp</code> (Jimple transformation pack: empty, for your <code>BodyTransformer</code>s), <code>jop</code> (optimizations, off unless <code>-O</code>), <code>jap</code> (annotations), then <code>bb</code>/<code>bop</code> (Baf) and <code>tag</code> for output. Whole-program with <code>-w</code>: <code>cg</code> (call graph: <code>cg.cha</code>, <code>cg.spark</code>, <code>cg.paddle</code>), <code>wjtp</code> (your <code>SceneTransformer</code>s), <code>wjop</code>, <code>wjap</code>. Shimple adds <code>stp</code>/<code>sop</code>. You add a phase with <code>PackManager.v().getPack(\"jtp\").add(new Transform(\"jtp.myphase\", new MyTransformer()))</code>; phase names must start with the pack name."
      ]
    },
    {
      h: "A BodyTransformer and a call-graph driver",
      p: [
        "The classic pattern is to keep <code>soot.Main</code> as the driver and register a transformer. A <code>BodyTransformer</code> is called once per method body in the pack it is registered in; a <code>SceneTransformer</code> once per run (use it in <code>wjtp</code>, where the call graph exists). The transformer below lists every call and every branch condition. Run with <code>-f n</code> to skip writing output.",
        "For whole-program analysis it is often simpler to configure <code>Options.v()</code> directly. Key steps: <code>G.reset()</code>, whole-program on, class path and process dir set, choose the call-graph algorithm by phase option, load classes, set entry points, <code>PackManager.v().runPacks()</code>, then read <code>Scene.v().getCallGraph()</code>. With <code>cg.spark</code> the call graph is built on the fly with Andersen-style points-to analysis, so only receivers that can actually point to a type yield edges."
      ],
      code: String.raw`// InvokeCounter.java: a BodyTransformer in the jtp pack
import java.util.Map;
import soot.*;
import soot.jimple.*;

public class InvokeCounter extends BodyTransformer {
    @Override
    protected void internalTransform(Body body, String phase, Map<String, String> opts) {
        SootMethod m = body.getMethod();
        for (Unit u : body.getUnits()) {
            Stmt s = (Stmt) u;
            if (s.containsInvokeExpr()) {
                InvokeExpr ie = s.getInvokeExpr();
                System.out.println(m.getSignature() + " -> " + ie.getMethod().getSignature());
            }
            if (s instanceof IfStmt) {
                System.out.println("  branch: " + ((IfStmt) s).getCondition());
            }
        }
    }

    public static void main(String[] args) {
        PackManager.v().getPack("jtp").add(new Transform("jtp.invokecounter", new InvokeCounter()));
        soot.Main.main(args);
    }
}

$ javac -cp soot.jar InvokeCounter.java
$ java -cp soot.jar:. InvokeCounter -cp . -pp -f n Demo
<Demo: void <init>()> -> <java.lang.Object: void <init>()>
  branch: i0 >= 0
  branch: i4 >= $i0
<Demo: void main(java.lang.String[])> -> <java.lang.String: int length()>
<Demo: void main(java.lang.String[])> -> <Demo: int abs(int)>
<Demo: void main(java.lang.String[])> -> <java.io.PrintStream: void println(int)>`
    },
    {
      h: "SootUp: the redesign",
      p: [
        "SootUp (Maven group <code>org.soot-oss</code>; modules <code>sootup.core</code>, <code>sootup.java.core</code>, <code>sootup.java.bytecode.frontend</code>, <code>sootup.callgraph</code>, plus analysis and points-to modules) keeps Jimple but drops the global state. You describe inputs with <b>AnalysisInputLocation</b>s (<code>JavaClassPathAnalysisInputLocation</code> for directories and JARs, <code>JrtFileSystemAnalysisInputLocation</code> for the Java 9+ runtime, <code>DefaultRTJarAnalysisInputLocation</code> for a Java 8 <code>rt.jar</code>) and create a <b>JavaView</b> over them. Classes and bodies load lazily when requested and are immutable; several views can coexist in one JVM, which classic Soot's <code>Scene</code> singleton could not do.",
        "Types and signatures come from the view's <b>IdentifierFactory</b>: <code>getClassType(\"Demo\")</code> returns a <code>ClassType</code> (a <code>JavaClassType</code> for Java), <code>getMethodSignature(type, \"abs\", \"int\", List.of(\"int\"))</code> a <code>MethodSignature</code>. <code>view.getClass(type)</code> and <code>view.getMethod(sig)</code> return <code>Optional</code>s. <code>method.getBody().getStmtGraph()</code> is the statement-level CFG with <code>getNodes()</code>, <code>successors(stmt)</code>, <code>predecessors(stmt)</code>, <code>getBlocks()</code>. Instead of the <code>jb</code> pack, bodies are shaped by <b>body interceptors</b> (local splitting, type assignment, copy propagation...) configured on the input location.",
        "Call graphs: construct a <code>CallGraphAlgorithm</code> such as <code>ClassHierarchyAnalysisAlgorithm</code> or <code>RapidTypeAnalysisAlgorithm</code> with the view, then <code>initialize(entryMethodSignatures)</code>. The code below was compiled and run against SootUp 2.0.0; in 2.x <code>callsFrom</code> returns <code>Call</code> objects (target signature plus invoking statement), in 1.x it returned method signatures, and 3.x reorganized some packages again, so pin a version and check its documentation."
      ],
      code: String.raw`import java.util.*;
import sootup.core.inputlocation.AnalysisInputLocation;
import sootup.core.graph.StmtGraph;
import sootup.core.jimple.common.stmt.Stmt;
import sootup.core.model.SootMethod;
import sootup.core.signatures.MethodSignature;
import sootup.core.types.ClassType;
import sootup.java.bytecode.frontend.inputlocation.JavaClassPathAnalysisInputLocation;
import sootup.java.core.JavaSootClass;
import sootup.java.core.views.JavaView;
import sootup.callgraph.*;

public class SootUpDemo {
    public static void main(String[] args) {
        AnalysisInputLocation input = new JavaClassPathAnalysisInputLocation(args[0]);
        JavaView view = new JavaView(input);

        ClassType demoType = view.getIdentifierFactory().getClassType("Demo");
        JavaSootClass demo = view.getClass(demoType).orElseThrow();
        for (SootMethod m : demo.getMethods()) System.out.println("== " + m.getSignature());

        MethodSignature absSig = view.getIdentifierFactory().getMethodSignature(
            demoType, "abs", "int", Collections.singletonList("int"));
        SootMethod abs = view.getMethod(absSig).orElseThrow();
        System.out.println(abs.getBody());
        StmtGraph<?> g = abs.getBody().getStmtGraph();
        for (Stmt s : g.getNodes()) System.out.println(s + "  -> succs " + g.successors(s));

        MethodSignature mainSig = view.getIdentifierFactory().getMethodSignature(
            demoType, "main", "void", Collections.singletonList("java.lang.String[]"));
        CallGraph cg = new ClassHierarchyAnalysisAlgorithm(view).initialize(Collections.singletonList(mainSig));
        cg.callsFrom(mainSig).forEach(c -> System.out.println("CHA: " + c.getTargetMethodSignature()));
    }
}

$ java -cp "lib/*:." SootUpDemo .        # JDK 17, SootUp 2.0.0, Demo.class compiled with -g
== <Demo: int abs(int)>
== <Demo: void main(java.lang.String[])>
== <Demo: void <init>()>
{
    int x;
    x := @parameter0: int;
    if x >= 0 goto label1;
    x = neg x;
  label1:
    return x;
}
x = neg x  -> succs [return x]
if x >= 0  -> succs [x = neg x, return x]
x := @parameter0: int  -> succs [if x >= 0]
return x  -> succs []
CHA: <java.lang.String: int length()>
CHA: <Demo: int abs(int)>
CHA: <java.io.PrintStream: void println(int)>`
    },
    {
      h: "CHA vs RTA vs Spark on one example",
      p: [
        "The program: interface <code>Shape</code> with implementations <code>Circle</code>, <code>Square</code> and <code>Tri</code>; <code>main</code> does <code>Shape s = args.length &gt; 0 ? new Circle() : new Square(); s.area();</code>. <code>Tri</code> is never instantiated.",
        "<b>CHA</b> (class hierarchy analysis) resolves <code>s.area()</code> to every implementation of <code>Shape.area</code> in the hierarchy: Circle, Square and Tri. <b>RTA</b> (rapid type analysis) additionally requires the class to be instantiated somewhere in reachable code, so Tri is dropped. <b>Spark</b> uses points-to sets for the receiver <code>s</code>, which here contains the Circle and Square allocation sites, so it also drops Tri, and in general it is more precise than RTA because instantiation must flow to this particular receiver, not just happen anywhere.",
        "Real outputs: SootUp 2.0.0, CHA targets from main: <code>Circle.&lt;init&gt;</code>, <code>Square.&lt;init&gt;</code>, <code>Circle.area</code>, <code>Tri.area</code>, <code>Square.area</code>, <code>println(double)</code>; RTA: the same without <code>Tri.area</code>. Classic Soot with <code>-process-dir</code> on the classes: <code>cg.cha</code> printed edges to Square, Circle and Tri <code>area()</code>; <code>cg.spark</code> printed only Circle and Square. The CHA graph over the whole JDK had over 300,000 edges, which illustrates why CHA does not scale well as a basis for further whole-program analysis.",
        "Gotcha observed while preparing this lesson: in classic Soot without <code>-process-dir</code>, <code>Tri</code> was never loaded into the Scene (nothing references it), so even CHA did not report it. Which classes are in the Scene is part of the result."
      ],
      code: String.raw`// CallGraphDump.java (classic Soot, whole program)
import java.util.*;
import soot.*;
import soot.jimple.toolkits.callgraph.*;
import soot.options.Options;

public class CallGraphDump {
    public static void main(String[] args) {
        G.reset();
        Options.v().set_whole_program(true);
        Options.v().set_prepend_classpath(true);
        Options.v().set_soot_classpath(args[0]);
        Options.v().set_process_dir(Collections.singletonList(args[0]));
        Options.v().set_output_format(Options.output_format_none);
        Options.v().set_allow_phantom_refs(true);
        Options.v().setPhaseOption("cg.spark", "on");     // or "cg.cha", "on"

        SootClass main = Scene.v().loadClassAndSupport(args[1]);
        main.setApplicationClass();
        Scene.v().loadNecessaryClasses();
        Scene.v().setEntryPoints(Collections.singletonList(main.getMethodByName("main")));
        PackManager.v().runPacks();

        CallGraph cg = Scene.v().getCallGraph();
        for (SootMethod m : main.getMethods()) {
            Iterator<Edge> it = cg.edgesOutOf(m);
            while (it.hasNext()) {
                Edge e = it.next();
                if (!e.tgt().isJavaLibraryMethod())
                    System.out.println(m.getName() + " -> " + e.tgt().getSignature() + " [" + e.kind() + "]");
            }
        }
    }
}

$ java -cp soot.jar:. CallGraphDump classes Shapes      # Spark
main -> <Circle: double area()> [INTERFACE]
main -> <Square: double area()> [INTERFACE]
main -> <Circle: void <init>()> [SPECIAL]
main -> <Square: void <init>()> [SPECIAL]
# same driver with cg.cha: adds  main -> <Tri: double area()> [INTERFACE]`
    }
  ],
  deepDive: {
    timeMin: 20,
    intro: "What interviewers ask after \"have you used Soot\": classic Soot vs SootUp design, phantom classes, entry points, and how FlowDroid sits on top.",
    sections: [
      {
        h: "Classic Soot vs SootUp, point by point",
        p: [
          "<table><tr><th></th><th>Classic Soot (soot-oss/soot 4.x)</th><th>SootUp</th></tr><tr><td>State</td><td>Global singletons: <code>Scene.v()</code>, <code>Options.v()</code>, <code>PackManager.v()</code>; <code>G.reset()</code> between runs</td><td>Explicit <code>View</code> objects; many per JVM</td></tr><tr><td>Loading</td><td>Eager resolving levels; must call <code>loadNecessaryClasses()</code></td><td>Lazy, on demand per class/body</td></tr><tr><td>Mutability</td><td>Bodies mutable in place via <code>UnitPatchingChain</code></td><td>Immutable model; builders produce modified copies</td></tr><tr><td>Pipeline</td><td>Packs and phases (<code>jb</code>, <code>jtp</code>, <code>cg</code>, <code>wjtp</code>...)</td><td>Body interceptors; you call analyses yourself</td></tr><tr><td>Inputs</td><td><code>-cp</code>, <code>-pp</code>, <code>-process-dir</code>, <code>-src-prec</code></td><td><code>AnalysisInputLocation</code>s (class path, JRT, Jimple files, APKs, source in some modules)</td></tr><tr><td>Call graphs</td><td><code>cg.cha</code>, <code>cg.spark</code> (on-the-fly with points-to)</td><td><code>CallGraphAlgorithm</code> (CHA, RTA), Spark/Qilin modules for points-to</td></tr><tr><td>Ecosystem</td><td>FlowDroid, Heros, Boomerang and many papers</td><td>Growing; FlowDroid migration in progress</td></tr></table>",
          "Practical advice: for new tools, prefer SootUp's API style and testability; for building on FlowDroid or reproducing older research artifacts, classic Soot is still the dependency they expect."
        ]
      },
      {
        h: "Phantom classes, library vs application, and soundness",
        p: [
          "If a referenced class is not on Soot's class path, classic Soot aborts unless <code>-allow-phantom-refs</code> is set, in which case it creates a phantom class with no bodies. Calls into phantom methods have no edges in the call graph and no effect in dataflow, which silently makes an analysis unsound. Always log phantom classes (<code>Scene.v().getPhantomClasses()</code>) and treat a high count as a configuration bug.",
          "Application classes are analyzed and transformed; library classes are loaded for hierarchy and signatures and, in whole-program mode, may have bodies analyzed for call-graph construction. <code>-no-bodies-for-excluded</code> plus <code>-exclude java.*</code> trades soundness for speed by not loading JDK bodies, a common setting for FlowDroid-style analyses where JDK behavior is modeled with summaries instead."
        ]
      },
      {
        h: "Entry points and the reflection problem",
        p: [
          "A call graph is only as good as its entry points. For an application with <code>main</code>, that is easy; for libraries, frameworks (Spring, servlets), tests and Android apps there is no single <code>main</code>. Android apps have lifecycle callbacks invoked by the framework, which is why FlowDroid generates a <b>dummy main</b> that models the component lifecycle and calls callbacks in all possible orders. For a library you typically treat every public method as an entry point. For JUnit tests, each test method (plus <code>@Before</code>/<code>@After</code>) is an entry point.",
          "Reflection (<code>Class.forName(name).newInstance()</code>, <code>Method.invoke</code>), dynamic proxies, <code>invokedynamic</code> and native code create edges static analysis cannot see. Soot can take a reflection log from a dynamic run (TamiFlex) to add the observed edges; otherwise results are unsound for those calls, which is acceptable for bug finding but must be stated in research."
        ]
      },
      {
        h: "How FlowDroid uses Soot",
        p: [
          "FlowDroid (Arzt et al., PLDI 2014) loads an APK through Soot's Dexpler front end (Dalvik to Jimple), parses the manifest and layout files to find components and callbacks, generates the dummy main, builds a call graph with Spark, and runs an IFDS-based taint analysis (on the Heros solver, later its own) from sources to sinks defined in a configuration file, with on-demand alias analysis for heap objects and taint-wrapper summaries for library methods. Each piece maps onto the Soot concepts in this lesson: Jimple as IR, Spark for call graphs and points-to, <code>ExceptionalUnitGraph</code>-based interprocedural CFGs (<code>JimpleBasedInterproceduralCFG</code>)."
        ]
      },
      {
        h: "Reading Jimple fluently: a short glossary",
        p: [
          "<ul><li><code>r0 := @this: Demo</code>, <code>i0 := @parameter0: int</code>: identity statements binding this and parameters at method entry.</li><li><code>$r1 := @caughtexception</code>: first statement of a handler.</li><li><code>&lt;java.lang.System: java.io.PrintStream out&gt;</code>: a static field reference, written as a field signature.</li><li><code>r0.&lt;Calc: java.util.List log&gt;</code>: an instance field reference.</li><li><code>lengthof r0</code>, <code>neg i0</code>, <code>(int) $d0</code>, <code>r1 instanceof Foo</code>, <code>new Foo</code>, <code>newarray (int)[n]</code>: unary and object expressions.</li><li><code>specialinvoke $r2.&lt;Foo: void &lt;init&gt;()&gt;()</code>: constructor call after <code>$r2 = new Foo</code>; object creation is always split into allocation and constructor.</li><li><code>cmp</code>, <code>cmpl</code>, <code>cmpg</code>: long and floating-point comparisons producing an int, as in bytecode.</li><li><code>dynamicinvoke \"makeConcatWithConstants\" ...</code>: invokedynamic, e.g. Java 9+ string concatenation and lambdas.</li></ul>"
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: "Franky Translates Every Ship's Blueprints Into One Shipwright Language",
      text: [
        "At Water 7, ships arrive from everywhere with engine logs written in a cramped, stack-based shorthand: \"push lever, push lever, add, pop into tank 3\". Nobody can reason about that. Franky's shipwrights translate every log into one clear language where every step names its inputs and output: \"pressure3 = lever1 + lever2\". That translation is Soot's <code>jb</code> phase turning bytecode into Jimple.",
        "Then the Galley-La foremen run inspections in a fixed order of stations (packs): one station builds the clean blueprints, the next is reserved for anyone's custom inspection (<code>jtp</code>), later ones annotate and repack. When the question is about the whole fleet (\"which ships can call for which repair crews?\"), Iceburg draws the call map. The cautious way lists every crew that could possibly handle that kind of call (CHA); the smarter way lists only crews that were actually hired (RTA); the precise way checks which crew this particular ship actually has on board (Spark).",
        "Years later, Franky redesigns the workshop (SootUp): no single master ledger everyone writes into, each project gets its own clean copy of the blueprints, loaded only when someone asks for that ship."
      ]
    },
    sitcom: {
      show: "The Big Bang Theory",
      title: "Who Could Answer Sheldon's Call?",
      text: [
        "Sheldon's phone tree says \"call a physicist\". Leonard (CHA) lists every physicist in the university directory, including one who retired years ago. Raj (RTA) lists only physicists currently employed somewhere on campus. Howard (Spark) checks the actual contact card in Sheldon's phone and finds it can only reach Leonard or Kripke. All three answers are \"correct\" in that none misses a real possibility, but Howard's list is the one you would want to act on, and it took him the longest to produce."
      ]
    },
    why: "Soot's job is the translation from a cramped stack notation (bytecode) to a clear three-address language (Jimple), followed by a fixed sequence of inspection stations (packs) where your BodyTransformer runs. Call-graph construction is the phone-tree problem: CHA lists every class in the hierarchy, RTA only instantiated ones, Spark only what this receiver can actually point to. Precision costs time."
  },
  storyAnim: {
    h: 250,
    props: [
      { id: "cls", emoji: "☕", label: "Demo.class (bytecode)", x: 8, y: 20 },
      { id: "jb", emoji: "🏭", label: "jb: build Jimple", x: 30, y: 20, cls: "off" },
      { id: "jimple", emoji: "📜", label: "Jimple body", x: 52, y: 20, cls: "off" },
      { id: "jtp", emoji: "🔍", label: "jtp: your BodyTransformer", x: 76, y: 20, cls: "off" },
      { id: "cha", emoji: "📖", label: "CHA: Circle, Square, Tri", x: 30, y: 78, cls: "off" },
      { id: "rta", emoji: "🧾", label: "RTA: Circle, Square", x: 56, y: 78, cls: "off" },
      { id: "spark", emoji: "🎯", label: "Spark: pts(s)={Circle, Square}", x: 84, y: 78, cls: "off" }
    ],
    actors: [
      { id: "franky", emoji: "🤖", label: "Franky (Soot)", x: 18, y: 50 }
    ],
    steps: [
      { c: "Input is stack-based bytecode in .class files, found via -cp and -process-dir.", p: { cls: "lit" } },
      { c: "The jb pack lifts each method to Jimple: typed locals, three-address statements, resolved method signatures.", a: { franky: [30, 45] }, p: { jb: "lit" } },
      { c: "The result is a JimpleBody: locals, a chain of Units, and traps for exception handlers.", p: { jimple: "lit" } },
      { c: "jtp runs your BodyTransformer once per body; here it prints each invoke and branch condition.", a: { franky: [72, 45] }, p: { jtp: "good" } },
      { c: "In whole-program mode the cg pack builds a call graph. CHA resolves s.area() to every implementor in the hierarchy.", a: { franky: [30, 60] }, p: { cha: "lit" } },
      { c: "RTA keeps only classes instantiated in reachable code: Tri is never created, so its area() is dropped.", a: { franky: [56, 60] }, p: { rta: "lit", cha: "dim" } },
      { c: "Spark asks what the receiver s can point to: the Circle and Square allocation sites. Most precise, most expensive.", a: { franky: [84, 60] }, p: { spark: "good" } }
    ]
  },
  conceptFlow: {
    title: "Classic Soot run vs SootUp run",
    intro: "The same analysis, two architectures. Click a node.",
    stages: [
      { label: "Input", nodes: [ { id: "cp", text: "-cp / -pp /\n-process-dir" }, { id: "ail", text: "AnalysisInputLocation" } ] },
      { label: "Model", nodes: [ { id: "scene", text: "Scene.v()\n(global)" }, { id: "view", text: "JavaView\n(lazy, immutable)" } ] },
      { label: "Bodies", nodes: [ { id: "jb", text: "jb pack ->\nJimpleBody" }, { id: "icpt", text: "body interceptors ->\nBody + StmtGraph" } ] },
      { label: "Analyses", nodes: [ { id: "jtp", text: "jtp BodyTransformer" }, { id: "cg", text: "cg pack:\nCHA / Spark" }, { id: "cga", text: "CallGraphAlgorithm:\nCHA / RTA" } ] }
    ],
    steps: [
      { active: ["cp"], note: "Classic Soot takes class path, prepend-classpath and process-dir options, set on the command line or via Options.v()." },
      { active: ["cp", "scene"], note: "Classes are loaded into the global Scene with resolving levels; loadNecessaryClasses() must run first." },
      { active: ["jb"], note: "The jb pack converts bytecode to JimpleBody for each method: locals, units, traps." },
      { active: ["jtp"], note: "Your BodyTransformer, registered in jtp, runs once per body in pack order." },
      { active: ["cg"], note: "With -w, the cg pack builds the call graph; Spark computes points-to sets on the fly." },
      { active: ["ail", "view"], note: "SootUp: wrap inputs in AnalysisInputLocations and create a JavaView; nothing global." },
      { active: ["icpt"], note: "Bodies load lazily on getBody(), shaped by interceptors; getStmtGraph() is the CFG." },
      { active: ["cga"], note: "Call graphs are explicit objects: new ClassHierarchyAnalysisAlgorithm(view).initialize(entryPoints)." }
    ]
  },
  tech: [
    {
      q: "Why does Jimple have both $-prefixed and plain locals?",
      a: [
        "Plain locals (<code>r0</code>, <code>i3</code>) come from bytecode local-variable slots; <code>$</code>-prefixed ones (<code>$i0</code>, <code>$r2</code>) come from operand-stack positions that the <code>jb</code> phase turned into variables. The letter encodes the type category (r reference, i int, l long, d double, f float, b byte, z boolean...). After <code>jb</code>'s local splitter and type assigner, one bytecode slot reused for two unrelated values becomes two locals. With <code>use-original-names:true</code> and <code>-g</code> class files, slot-derived locals get source names and stack temporaries become <code>$stackN</code>."
      ]
    },
    {
      q: "What exactly does -pp do, and why do analyses break without it?",
      a: [
        "<code>-pp</code> prepends the JVM's own class path and runtime library to Soot's class path. Without it, <code>java.lang.Object</code>, <code>String</code> and the rest of the JDK are missing, so Soot either fails to resolve the hierarchy or (with phantom refs allowed) treats the whole JDK as phantom. Note that Soot then analyzes against the JDK it is running on, which may differ from the one the application targets; for reproducible research, pin it explicitly with <code>-cp</code>."
      ]
    },
    {
      q: "How do I modify code with Soot, not just read it?",
      a: [
        "In a <code>BodyTransformer</code>, use the <code>Jimple.v()</code> factory to create statements (<code>Jimple.v().newInvokeStmt(Jimple.v().newStaticInvokeExpr(method.makeRef(), args))</code>), new locals (<code>Jimple.v().newLocal(name, type)</code> added to <code>body.getLocals()</code>) and insert them with <code>body.getUnits().insertBefore(newStmt, target)</code>, which, being a <code>UnitPatchingChain</code>, retargets branches that pointed at <code>target</code> when appropriate. Validate with <code>body.validate()</code> and write with <code>-f c</code> to get instrumented <code>.class</code> files. This is how many dynamic-analysis instrumenters are built."
      ]
    },
    {
      q: "In SootUp, why is everything Optional and immutable?",
      a: [
        "Because the view loads lazily from input locations: asking for a class that is not in any input location is a normal outcome (<code>Optional.empty()</code>), not an exception or a phantom stub. Immutability makes a view safe to share across threads and analyses, caches valid, and removes classic Soot's ordering bugs where one transformer's in-place edit changes another analysis's input. Modified bodies are created through builders, producing new objects."
      ]
    }
  ],
  code: {
    title: "SootUp: CHA vs RTA on the Shapes example",
    intro: "Tested with SootUp 2.0.0 on JDK 17. Classes compiled with <code>javac -g -d classes Shapes.java</code>, where <code>Shapes.java</code> defines <code>interface Shape { double area(); }</code>, <code>Circle</code>, <code>Square</code>, <code>Tri</code> implementing it, and <code>main</code> instantiating only Circle or Square.",
    code: String.raw`// pom.xml dependencies (version 2.0.0):
//   org.soot-oss:sootup.core, sootup.java.core, sootup.java.bytecode.frontend, sootup.callgraph

// Shapes.java (the program under analysis)
interface Shape { double area(); }
class Circle implements Shape { public double area() { return 3.14; } }
class Square implements Shape { public double area() { return 1.0; } }
class Tri implements Shape { public double area() { return 0.5; } }
public class Shapes {
    public static void main(String[] args) {
        Shape s = args.length > 0 ? new Circle() : new Square();
        System.out.println(s.area());
    }
}

// ShapesCG.java (the analysis)
import java.util.*;
import sootup.core.signatures.MethodSignature;
import sootup.core.types.ClassType;
import sootup.java.bytecode.frontend.inputlocation.JavaClassPathAnalysisInputLocation;
import sootup.java.core.views.JavaView;
import sootup.callgraph.*;

public class ShapesCG {
    public static void main(String[] args) {
        JavaView view = new JavaView(new JavaClassPathAnalysisInputLocation(args[0]));
        ClassType t = view.getIdentifierFactory().getClassType("Shapes");
        MethodSignature mainSig = view.getIdentifierFactory().getMethodSignature(
            t, "main", "void", Collections.singletonList("java.lang.String[]"));
        for (CallGraphAlgorithm algo : Arrays.asList(
                new ClassHierarchyAnalysisAlgorithm(view), new RapidTypeAnalysisAlgorithm(view))) {
            CallGraph cg = algo.initialize(Collections.singletonList(mainSig));
            System.out.println(algo.getClass().getSimpleName());
            cg.callsFrom(mainSig).forEach(c -> System.out.println("  " + c.getTargetMethodSignature()));
        }
    }
}

/*
$ mvn dependency:copy-dependencies -DoutputDirectory=lib
$ javac -cp "lib/*" ShapesCG.java && java -cp "lib/*:." ShapesCG classes
ClassHierarchyAnalysisAlgorithm
  <Circle: void <init>()>
  <Square: void <init>()>
  <Circle: double area()>
  <Tri: double area()>
  <Square: double area()>
  <java.io.PrintStream: void println(double)>
RapidTypeAnalysisAlgorithm
  <Circle: void <init>()>
  <Square: void <init>()>
  <Circle: double area()>
  <Square: double area()>
  <java.io.PrintStream: void println(double)>
*/`,
    notes: [
      "The only difference is <code>Tri.area()</code>: CHA includes every implementor in the hierarchy, RTA only classes instantiated in reachable methods.",
      "The input location here contains only the application classes. JDK targets such as <code>println</code> appear as signatures; to analyze JDK bodies too, add a <code>JrtFileSystemAnalysisInputLocation</code> (Java 9+) to the view.",
      "SootUp's own Jimple printout uses source names (<code>x</code> instead of <code>i0</code>) because its default interceptors use the local variable table from <code>-g</code>.",
      "A slf4j binding is not included; SootUp logs a harmless \"no providers\" warning unless you add one."
    ]
  },
  lab: {
    title: "A BodyTransformer that finds Thread.sleep calls (flaky-wait detector)",
    prompt: "Write <code>SleepFinder extends BodyTransformer</code> for classic Soot. In <code>internalTransform(Body body, String phaseName, Map&lt;String, String&gt; options)</code>, iterate <code>body.getUnits()</code>, cast each to <code>Stmt</code>, skip statements without an invoke (<code>containsInvokeExpr()</code>), and report calls whose target signature equals <code>&lt;java.lang.Thread: void sleep(long)&gt;</code>, printing the method signature, the source line from the statement's <code>LineNumberTag</code> (or -1), and the Jimple statement. In <code>main</code>, register it in the <code>jtp</code> pack as <code>jtp.sleepfinder</code> and delegate to <code>soot.Main.main(args)</code>.",
    starter: String.raw`import java.util.Map;
import soot.Body;
import soot.BodyTransformer;
import soot.PackManager;
import soot.SootMethod;
import soot.Transform;
import soot.Unit;
import soot.jimple.InvokeExpr;
import soot.jimple.Stmt;
import soot.tagkit.LineNumberTag;

public class SleepFinder extends BodyTransformer {
    static final String SLEEP = "TODO: the Soot signature of Thread.sleep(long)";

    @Override
    protected void internalTransform(Body body, String phaseName, Map<String, String> options) {
        // TODO: iterate units, find invokes of SLEEP, print method, line and statement
    }

    public static void main(String[] args) {
        // TODO: register in jtp, then run soot.Main
    }
}
`,
    checks: [
      { re: 'extends\\s+BodyTransformer', flags: '', must: true, hint: "Extend soot.BodyTransformer.", pass: "BodyTransformer ✓" },
      { re: 'protected\\s+void\\s+internalTransform\\s*\\(\\s*Body\\s+\\w+\\s*,\\s*String\\s+\\w+\\s*,\\s*Map\\s*<\\s*String\\s*,\\s*String\\s*>\\s*\\w+\\s*\\)', flags: '', must: true, hint: "Override protected void internalTransform(Body body, String phaseName, Map<String, String> options).", pass: "internalTransform signature ✓" },
      { re: '"<java\\.lang\\.Thread: void sleep\\(long\\)>"', flags: '', must: true, hint: "Soot signatures look like \"<java.lang.Thread: void sleep(long)>\".", pass: "Soot method signature ✓" },
      { re: 'getUnits\\(\\)', flags: '', must: true, hint: "Iterate body.getUnits().", pass: "Units iterated ✓" },
      { re: 'containsInvokeExpr\\(\\)', flags: '', must: true, hint: "Check stmt.containsInvokeExpr() before getInvokeExpr().", pass: "Invoke check ✓" },
      { re: 'getMethod\\(\\)\\.getSignature\\(\\)\\.equals\\(', flags: '', must: true, hint: "Compare call.getMethod().getSignature() with SLEEP.", pass: "Target signature compared ✓" },
      { re: 'getPack\\(\\s*"jtp"\\s*\\)\\.add\\(\\s*new\\s+Transform\\(\\s*"jtp\\.\\w+"', flags: '', must: true, hint: "PackManager.v().getPack(\"jtp\").add(new Transform(\"jtp.sleepfinder\", new SleepFinder())).", pass: "Registered in jtp ✓" },
      { re: 'soot\\.Main\\.main\\(\\s*args\\s*\\)', flags: '', must: true, hint: "Delegate to soot.Main.main(args).", pass: "Soot driver ✓" }
    ],
    run: "Download Soot: <code>curl -LO https://repo1.maven.org/maven2/org/soot-oss/soot/4.4.1/soot-4.4.1-jar-with-dependencies.jar</code> (runs on Java 8+). Create <code>Waits.java</code> with a method <code>pollServer()</code> whose loop calls <code>Thread.sleep(500L)</code> on line 4. Then:<pre><code>mkdir -p target && javac -g -d target Waits.java\njavac -cp soot-4.4.1-jar-with-dependencies.jar SleepFinder.java\njava -cp soot-4.4.1-jar-with-dependencies.jar:. SleepFinder -cp target -pp -process-dir target -keep-line-number -f n</code></pre>Expected (verified): <code>&lt;Waits: void pollServer()&gt; line 4: staticinvoke &lt;java.lang.Thread: void sleep(long)&gt;(500L)</code>. Without <code>-keep-line-number</code> the line prints as -1. Point <code>-process-dir</code> at a project's <code>target/test-classes</code> to scan a real test suite for sleep-based waits.",
    solution: String.raw`import java.util.Map;
import soot.Body;
import soot.BodyTransformer;
import soot.PackManager;
import soot.SootMethod;
import soot.Transform;
import soot.Unit;
import soot.jimple.InvokeExpr;
import soot.jimple.Stmt;
import soot.tagkit.LineNumberTag;

public class SleepFinder extends BodyTransformer {
    static final String SLEEP = "<java.lang.Thread: void sleep(long)>";

    @Override
    protected void internalTransform(Body body, String phaseName, Map<String, String> options) {
        SootMethod method = body.getMethod();
        for (Unit u : body.getUnits()) {
            Stmt stmt = (Stmt) u;
            if (!stmt.containsInvokeExpr()) {
                continue;
            }
            InvokeExpr call = stmt.getInvokeExpr();
            if (call.getMethod().getSignature().equals(SLEEP)) {
                LineNumberTag tag = (LineNumberTag) stmt.getTag("LineNumberTag");
                int line = tag == null ? -1 : tag.getLineNumber();
                System.out.println(method.getSignature() + " line " + line + ": " + stmt);
            }
        }
    }

    public static void main(String[] args) {
        PackManager.v().getPack("jtp").add(new Transform("jtp.sleepfinder", new SleepFinder()));
        soot.Main.main(args);
    }
}
`,
    notes: [
      "Working on Jimple rather than source means <code>Thread.sleep</code> is found regardless of static imports, aliases or wrapping expressions: the invoke carries the resolved signature.",
      "Overloads are distinct signatures: <code>sleep(long, int)</code> and <code>TimeUnit.SECONDS.sleep(...)</code> (<code>&lt;java.util.concurrent.TimeUnit: void sleep(long)&gt;</code>) need their own entries.",
      "To find sleeps reachable from tests through helper methods, switch to a <code>SceneTransformer</code> in <code>wjtp</code> with <code>-w</code>, use test methods as entry points, and walk the call graph from each test."
    ]
  },
  quiz: [
    {
      q: "Which Soot option adds the JVM's own runtime classes (e.g. java.lang.Object) to Soot's class path?",
      options: ["-process-dir", "-pp (prepend-classpath)", "-w", "-f J"],
      correct: 1,
      explain: "-pp prepends the running JVM's class path and runtime library. -process-dir selects application classes; -w enables whole-program mode."
    },
    {
      q: "In which pack should a custom per-method BodyTransformer normally be registered?",
      options: ["jb", "jtp", "cg", "wjop"],
      correct: 1,
      explain: "jtp (Jimple transformation pack) is empty by default and meant for user BodyTransformers. jb builds the bodies; cg builds the call graph; wj* packs take SceneTransformers."
    },
    {
      q: "For <code>Shape s = flag ? new Circle() : new Square(); s.area();</code> with a never-instantiated class Tri implementing Shape, which call graph includes Tri.area()?",
      options: ["RTA only", "CHA only (among CHA, RTA, Spark)", "Spark only", "All three"],
      correct: 1,
      explain: "CHA uses only the class hierarchy. RTA requires instantiation in reachable code; Spark requires the receiver to point to a Tri object."
    },
    {
      q: "What is the SootUp equivalent of classic Soot's Scene for getting a class?",
      options: ["Scene.v().getSootClass(name)", "view.getClass(view.getIdentifierFactory().getClassType(name)), returning an Optional", "new SootClass(name)", "PackManager.v().getClass(name)"],
      correct: 1,
      explain: "SootUp has no global Scene; a JavaView over AnalysisInputLocations loads classes lazily and returns Optionals."
    },
    {
      q: "What does <code>i0_2 = Phi(i0 #0, i0_1 #1)</code> mean in Shimple output?",
      options: ["A random choice", "i0_2 is i0 if control came from the statement labeled (0), i0_1 if from (1)", "A function call named Phi", "i0_2 is the sum"],
      correct: 1,
      explain: "Shimple is Soot's SSA form; the #n markers refer to the predecessor statements numbered in the listing."
    }
  ],
  testFlow: {
    title: "Configuring a Soot analysis",
    start: "q1",
    nodes: {
      q1: { q: "Your call graph has no edges into a dependency's methods and Soot printed many \"phantom class\" warnings. Diagnosis?", choices: [ { text: "The dependency JAR is missing from -cp; phantom methods have no bodies, so no edges", to: "q1ok" }, { text: "Spark is broken", to: "q1bad" } ] },
      q1ok: { end: true, correct: true, text: "Right. Add the JARs to Soot's class path and log getPhantomClasses() to verify.", next: "q2" },
      q1bad: { end: true, correct: false, text: "Spark cannot analyze bodies that were never loaded. Phantom classes are a configuration signal.", retry: "q1" },
      q2: { q: "You need precise virtual-call targets for a taint analysis over a large app. Algorithm?", choices: [ { text: "Spark (points-to based)", to: "q2ok" }, { text: "CHA", to: "q2bad" } ] },
      q2ok: { end: true, correct: true, text: "Yes. Fewer spurious edges means fewer false taint paths; CHA would connect every implementor.", next: "q3" },
      q2bad: { end: true, correct: false, text: "CHA is fast and sound but very imprecise; spurious edges multiply false positives in taint analysis.", retry: "q2" },
      q3: { q: "Two analyses in the same JVM need different class paths. Classic Soot or SootUp?", choices: [ { text: "SootUp: create two JavaViews", to: "q3ok" }, { text: "Classic Soot: use two Scenes", to: "q3bad" } ] },
      q3ok: { end: true, correct: true, text: "Correct. Classic Soot has one global Scene (G.reset() between runs); SootUp views are independent objects." },
      q3bad: { end: true, correct: false, text: "Scene.v() is a singleton; you can only reset it, not have two at once.", retry: "q3" }
    }
  },
  pitfalls: [
    "Forgetting <code>-pp</code> (or the JDK on the class path) and getting a phantom <code>java.lang.Object</code>, or allowing phantom refs and silently losing all library edges.",
    "Using CHA without <code>-process-dir</code> and assuming it saw the whole program: classes nobody references may not be loaded into the Scene at all.",
    "Running the same classic Soot JVM twice without <code>G.reset()</code>: the global Scene keeps the previous run's classes and options.",
    "Mixing SootUp versions and tutorials: module names (<code>sootup.java.bytecode</code> vs <code>sootup.java.bytecode.frontend</code>), <code>callsFrom</code> return types and package layout changed across 1.x, 2.x and 3.x.",
    "Reporting Jimple-level findings without line numbers: compile with <code>-g</code> and run with <code>-keep-line-number</code>, and filter synthetic methods (lambdas, bridges, accessors)."
  ],
  interview: [
    {
      q: "What is Jimple and why does Soot use it instead of bytecode?",
      a: "Jimple is Soot's typed, stackless three-address IR. Bytecode has about 200 opcodes and implicit stack operands with untyped slots; Jimple has around fifteen statement kinds, explicit typed locals, and resolved method and field signatures on every invoke and field access. That makes def-use, dataflow and call-graph analyses straightforward: an analysis handles <code>AssignStmt</code>, <code>IfStmt</code>, <code>InvokeStmt</code> and friends instead of simulating the operand stack. Soot also provides Shimple (SSA), Grimp (aggregated expressions) and Baf (stack based, for code generation)."
    },
    {
      q: "Walk me through a classic Soot run from the command line to your analysis code.",
      a: "<code>soot.Main</code> parses options (<code>-cp</code>, <code>-pp</code>, <code>-process-dir</code>, <code>-w</code>, <code>-p</code>, <code>-f</code>), loads classes into the global Scene, and runs packs. Per method: <code>jb</code> builds a JimpleBody from bytecode (local splitting, type assignment, aggregation, copy propagation, unused-local removal), then <code>jtp</code> runs user BodyTransformers, then optional <code>jop</code> optimizations and <code>jap</code> annotations, then output. In whole-program mode, <code>cg</code> builds the call graph first (CHA or Spark) and <code>wjtp</code> runs SceneTransformers with access to it. My code is a transformer registered with <code>PackManager.v().getPack(\"jtp\").add(new Transform(\"jtp.x\", ...))</code>, or a custom driver configuring <code>Options.v()</code> and calling <code>runPacks()</code>."
    },
    {
      q: "Explain a tradeoff: CHA, RTA and Spark (points-to) call graphs.",
      a: "CHA resolves a virtual call to every override in the receiver's declared type's subtree: cheap, needs only the hierarchy, but adds many spurious edges (especially through interfaces like <code>Runnable</code> or <code>Object.toString</code>). RTA keeps only classes instantiated in reachable code, which prunes a lot at nearly the same cost. Spark computes Andersen-style points-to sets and resolves each call by the receiver's possible allocation sites, giving far fewer edges and enabling precise downstream analyses, but costs much more time and memory and its precision depends on modeling of reflection, native code and the JDK. For a taint analysis I would use Spark or a field-sensitive pointer analysis; for quick reachability or API-usage studies, RTA."
    },
    {
      q: "How does SootUp differ from classic Soot, and when would you pick each?",
      a: "SootUp removes the global singletons: inputs are explicit AnalysisInputLocations, a JavaView loads classes lazily and immutably, several views can coexist, bodies are shaped by interceptors instead of the jb pack, and call graphs are objects created by CallGraphAlgorithm implementations. It is easier to test and embed. Classic Soot has the mature ecosystem (FlowDroid, Heros, Boomerang, Spark options) and decades of research artifacts. New tools: SootUp. Extending FlowDroid or reproducing a paper: classic Soot."
    },
    {
      q: "Whiteboard: build a tool that finds test methods that can reach Thread.sleep through any helper chain.",
      a: "Inputs: compiled main and test classes plus dependency JARs (from <code>mvn dependency:build-classpath</code>). Use SootUp (or classic Soot whole-program mode). Entry points: every method annotated <code>@Test</code> (and setup/teardown). Build an RTA call graph for speed (Spark if precision matters). For each test, BFS over <code>callsFrom</code> edges with a visited set, stopping at JDK methods except the targets (<code>Thread.sleep</code>, <code>TimeUnit.sleep</code>, <code>Object.wait</code> with timeout). Record the path for explanation and the line of the sleep via line-number tags. Report test, depth, path. Validate on known flaky-test datasets and measure precision manually on a sample."
    },
    {
      q: "What are phantom classes and why are they dangerous?",
      a: "Stubs Soot creates for referenced classes that are not on its class path, when <code>-allow-phantom-refs</code> is set. They have signatures but no bodies, so calls into them produce no call-graph edges and no dataflow effects. That keeps the tool running but silently makes any whole-program analysis unsound. Always log them, and fix the class path rather than accepting a high count."
    },
    {
      q: "How would you get Jimple for a specific method programmatically in both Soot and SootUp?",
      a: "Classic Soot: configure <code>Options.v()</code> (class path, prepend, phantom refs), <code>SootClass c = Scene.v().loadClassAndSupport(\"Demo\"); Scene.v().loadNecessaryClasses(); SootMethod m = c.getMethod(\"int abs(int)\"); Body b = m.retrieveActiveBody();</code> and print <code>b</code>. SootUp: <code>JavaView view = new JavaView(new JavaClassPathAnalysisInputLocation(dir)); ClassType t = view.getIdentifierFactory().getClassType(\"Demo\"); MethodSignature s = view.getIdentifierFactory().getMethodSignature(t, \"abs\", \"int\", List.of(\"int\")); view.getMethod(s).get().getBody()</code>, and <code>getStmtGraph()</code> for the CFG."
    }
  ]
};
