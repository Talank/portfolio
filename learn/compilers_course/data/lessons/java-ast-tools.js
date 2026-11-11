window.LESSONS = window.LESSONS || {};
window.LESSONS['java-ast-tools'] = {
  id: 'java-ast-tools',
  title: "ASTs for Java: JavaParser, Eclipse JDT, Spoon & tree-sitter",
  category: "Part 1 — Working With ASTs",
  timeMin: 45,
  summary: "Java has no <code>ast</code> module in the standard library you would want to use (the javac tree API, <code>com.sun.source.tree</code>, exists but is tied to a compilation task), so research and industry tools pick from four libraries. <b>JavaParser</b> is a lightweight AST with visitors and an optional symbol solver. <b>Eclipse JDT</b> is the IDE-grade parser with bindings and error recovery. <b>Spoon</b> is a metamodel built for analysis and source-to-source transformation with processors. <b>tree-sitter</b> is a fast, error-tolerant concrete syntax tree with a query language and bindings for Python and many other languages. This lesson shows real, tested code for each, explains CST vs AST, and when to pick which.",
  goals: [
    "Parse Java with JavaParser, write a <code>VoidVisitorAdapter</code>, and resolve method calls with the symbol solver",
    "Parse with Eclipse JDT's <code>ASTParser</code>, enable bindings, and use <code>ASTVisitor</code>",
    "Write a Spoon <code>AbstractProcessor</code> that finds and rewrites code, and pretty-print the result",
    "Parse Java with tree-sitter from Python, navigate nodes by field name, and run S-expression queries",
    "Explain CST vs AST, and choose a tool by requirements: types, error tolerance, transformation, speed, language coverage"
  ],
  concept: [
    {
      h: "CST vs AST, concretely for Java",
      p: [
        "A <b>concrete syntax tree</b> keeps every token: keywords, braces, semicolons, parentheses, often comments. A tree-sitter tree for <code>log.add(a + b);</code> contains an <code>expression_statement</code> node with a <code>method_invocation</code> child and a <code>;</code> child; anonymous nodes for <code>(</code>, <code>)</code> and <code>.</code> are present too. An <b>AST</b> keeps semantic structure only: JavaParser gives <code>ExpressionStmt(MethodCallExpr(scope=NameExpr(log), name=add, args=[BinaryExpr(PLUS)]))</code>.",
        "CSTs are lossless (you can print the file back exactly) and are what editors and formatters need. ASTs are smaller and nicer to analyze. Most Java AST libraries keep enough position and comment information to print source back reasonably (JavaParser's <code>LexicalPreservingPrinter</code>, JDT's <code>ASTRewrite</code>, Spoon's sniper printer) because refactoring tools need minimal diffs.",
        "The bigger distinction for analysis is <b>resolved vs unresolved</b>: does the tree know that <code>log.add</code> is <code>java.util.List.add(E)</code>? tree-sitter never does; JavaParser does with the symbol solver configured; JDT does with bindings enabled and a classpath; Spoon does with a classpath and degrades gracefully in no-classpath mode."
      ]
    },
    {
      h: "JavaParser: visitors and the symbol solver",
      p: [
        "Maven: <code>com.github.javaparser:javaparser-core</code> (parsing only) or <code>javaparser-symbol-solver-core</code> (adds resolution). <code>StaticJavaParser.parse(File|Path|String)</code> returns a <code>CompilationUnit</code>. Two ways to query: <code>cu.findAll(MethodCallExpr.class)</code> for simple searches, or a visitor. <code>VoidVisitorAdapter&lt;A&gt;</code> has a <code>visit</code> overload per node type and recurses by default; you override the ones you need and call <code>super.visit(n, arg)</code> to keep recursing. <code>GenericVisitorAdapter&lt;R, A&gt;</code> returns values; <code>ModifierVisitor</code> rewrites.",
        "The symbol solver needs to know where types come from: a <code>CombinedTypeSolver</code> of <code>ReflectionTypeSolver</code> (JDK classes on the running JVM), <code>JavaParserTypeSolver</code> (a source root) and <code>JarTypeSolver</code> (dependencies). Then <code>call.resolve()</code> returns a <code>ResolvedMethodDeclaration</code>, and <code>expr.calculateResolvedType()</code> gives an expression's type. Unresolvable symbols throw <code>UnsolvedSymbolException</code>; catch it per node rather than letting it kill a whole run."
      ],
      code: String.raw`CombinedTypeSolver ts = new CombinedTypeSolver(
    new ReflectionTypeSolver(),
    new JavaParserTypeSolver(Paths.get("src")));
StaticJavaParser.getParserConfiguration().setSymbolResolver(new JavaSymbolSolver(ts));
CompilationUnit cu = StaticJavaParser.parse(Paths.get("src/demo/Calc.java"));

cu.findAll(MethodCallExpr.class).forEach(call ->
    System.out.println(call + " -> " + call.resolve().getQualifiedSignature()));
// log.add(a + b) -> java.util.List.add(E)
// log.clear() -> java.util.List.clear()`
    },
    {
      h: "Eclipse JDT: the IDE's parser",
      p: [
        "Maven: <code>org.eclipse.jdt:org.eclipse.jdt.core</code> (works standalone, outside Eclipse). <code>ASTParser.newParser(AST.getJLSLatest())</code>, set kind <code>K_COMPILATION_UNIT</code>, source as <code>char[]</code>, compiler options for the Java version, and for bindings: <code>setResolveBindings(true)</code>, <code>setEnvironment(classpath, sourcepath, encodings, includeRunningVMBootclasspath)</code> and <code>setUnitName</code>. <code>createAST(null)</code> returns a <code>CompilationUnit</code>; visit with <code>ASTVisitor</code>, whose <code>visit</code> methods return <code>true</code> to descend into children.",
        "JDT's strengths: excellent error recovery (it is the parser behind Eclipse and the jdtls language server, so it handles broken code), precise bindings (<code>IMethodBinding</code>, <code>ITypeBinding</code>), <code>cu.getLineNumber(pos)</code>, and <code>ASTRewrite</code> for minimal-diff edits. Many program-repair tools (and Spoon itself) build on JDT."
      ],
      code: String.raw`ASTParser parser = ASTParser.newParser(AST.getJLSLatest());
parser.setKind(ASTParser.K_COMPILATION_UNIT);
parser.setSource(src.toCharArray());
Map<String, String> opts = JavaCore.getOptions();
JavaCore.setComplianceOptions(JavaCore.VERSION_17, opts);
parser.setCompilerOptions(opts);
parser.setResolveBindings(true);
parser.setBindingsRecovery(true);
parser.setEnvironment(new String[0], new String[] {"src"}, null, true);
parser.setUnitName("Calc.java");
CompilationUnit cu = (CompilationUnit) parser.createAST(null);
cu.accept(new ASTVisitor() {
    @Override public boolean visit(MethodInvocation mi) {
        IMethodBinding b = mi.resolveMethodBinding();
        System.out.println("line " + cu.getLineNumber(mi.getStartPosition()) + ": " + mi + " -> "
            + (b == null ? "?" : b.getDeclaringClass().getQualifiedName() + "." + b.getName()));
        return true;    // keep visiting children
    }
});
// line 10: log.add(a + b) -> java.util.List<java.lang.Integer>.add
// line 16: log.clear() -> java.util.List<java.lang.Integer>.clear`
    },
    {
      h: "Spoon: analysis and transformation with processors",
      p: [
        "Maven: <code>fr.inria.gforge.spoon:spoon-core</code> (Spoon 10+ needs Java 11, 11.x needs Java 17). Spoon builds a typed metamodel (<code>CtClass</code>, <code>CtMethod</code>, <code>CtInvocation</code>, <code>CtCatch</code>...) on top of JDT. A <code>Launcher</code> takes input resources, an <code>Environment</code> (set <code>setNoClasspath(true)</code> to tolerate missing dependencies), optional <b>processors</b>, and an output directory for the transformed sources.",
        "An <code>AbstractProcessor&lt;CtCatch&gt;</code> is called on every element of that type; <code>isToBeProcessed</code> filters, <code>process</code> acts, and <code>getFactory()</code> creates new code (from typed builders or <code>createCodeSnippetStatement</code>). Queries use <code>model.getElements(new TypeFilter&lt;&gt;(CtMethod.class))</code>. Spoon is the common choice in automated program repair research (Astor, Nopol) and for mutation-style transformations because the write side is first class."
      ],
      code: String.raw`static class EmptyCatchProcessor extends AbstractProcessor<CtCatch> {
    @Override public boolean isToBeProcessed(CtCatch c) {
        return c.getBody().getStatements().isEmpty();
    }
    @Override public void process(CtCatch c) {
        System.out.println("empty catch at " + c.getPosition());
        c.getBody().addStatement(getFactory().createCodeSnippetStatement("e.printStackTrace()"));
    }
}

Launcher launcher = new Launcher();
launcher.addInputResource("src");
launcher.getEnvironment().setNoClasspath(true);
launcher.getEnvironment().setAutoImports(true);
launcher.addProcessor(new EmptyCatchProcessor());
launcher.setSourceOutputDirectory("spooned");
launcher.run();                         // spooned/demo/Calc.java now has e.printStackTrace();
for (CtMethod<?> m : launcher.getModel().getElements(new TypeFilter<>(CtMethod.class)))
    System.out.println(m.getSignature());   // add(int,int)  reset()`
    },
    {
      h: "tree-sitter: fast, tolerant CST with queries (from Python)",
      p: [
        "<code>pip install tree-sitter tree-sitter-java</code>. Create <code>Language(tree_sitter_java.language())</code> and <code>Parser(JAVA)</code>; <code>parser.parse(bytes)</code> returns a <code>Tree</code>. Nodes have <code>type</code>, <code>start_point</code>/<code>end_point</code> (0-based row, column), <code>text</code> (bytes), <code>children</code>, <code>named_children</code> (skipping punctuation) and <code>child_by_field_name('name')</code>. <code>str(node)</code> prints the S-expression.",
        "Queries are S-expression patterns with captures: <code>(method_invocation object: (identifier) @recv name: (identifier) @meth)</code>. In py-tree-sitter 0.25+, run them with <code>QueryCursor(query).captures(node)</code> (a dict from capture name to nodes) or <code>.matches(node)</code> (grouped per match). Older tutorials call <code>query.captures(node)</code> directly and return a list of tuples; that API was removed, so check your installed version.",
        "Broken input still yields a tree: <code>tree.root_node.has_error</code> is True and the damage is localized in <code>ERROR</code> or <code>is_missing</code> nodes. No types, no name resolution, but it parses thousands of files per second and the same code works for Python, JavaScript, Go, Rust and C with a different grammar package."
      ],
      code: String.raw`import tree_sitter_java as tsjava
from tree_sitter import Language, Parser, Query, QueryCursor

JAVA = Language(tsjava.language())
parser = Parser(JAVA)
root = parser.parse(open("src/demo/Calc.java", "rb").read()).root_node

q = Query(JAVA, """
(method_declaration name: (identifier) @name)
(catch_clause body: (block) @body)
(method_invocation object: (identifier) @recv name: (identifier) @meth)
""")
caps = QueryCursor(q).captures(root)
for n in caps.get("name", []):
    print("method:", n.text.decode(), "line", n.start_point[0] + 1)
for b in caps.get("body", []):
    if b.named_child_count == 0:
        print("empty catch at line", b.start_point[0] + 1)
for _, m in QueryCursor(q).matches(root):
    if "meth" in m:
        print("call:", m["recv"][0].text.decode() + "." + m["meth"][0].text.decode())

broken = parser.parse(b"class A { void f() { int x = ; } }")
print(broken.root_node.has_error)          # True, but you still get a tree
# method: add line 9 / method: reset line 14 / empty catch at line 17
# call: log.add / call: log.clear / True`
    },
    {
      h: "Choosing a tool",
      p: [
        "<table><tr><th></th><th>JavaParser</th><th>Eclipse JDT</th><th>Spoon</th><th>tree-sitter</th></tr><tr><td>Tree</td><td>AST (+comments)</td><td>AST (DOM)</td><td>typed metamodel</td><td>CST</td></tr><tr><td>Types / bindings</td><td>symbol solver (opt-in)</td><td>bindings with classpath</td><td>yes; degrades in noclasspath</td><td>none</td></tr><tr><td>Broken code</td><td>fails or partial (<code>ParseResult</code> problems)</td><td>strong recovery</td><td>via JDT, noclasspath</td><td>always returns a tree</td></tr><tr><td>Rewriting</td><td>ModifierVisitor, LexicalPreservingPrinter</td><td>ASTRewrite (minimal diffs)</td><td>processors + printers (sniper mode)</td><td>you edit bytes by ranges</td></tr><tr><td>Weight</td><td>light, Java 8+</td><td>heavier, recent versions need Java 17</td><td>heavy, Java 11/17+</td><td>tiny native lib, many bindings</td></tr><tr><td>Typical use</td><td>quick analyzers, test-smell tools, metrics</td><td>IDE features, repair, precise refactoring</td><td>program repair, transformation research</td><td>MSR at scale, multi-language, editors</td></tr></table>",
        "Two more options to know: the <b>javac Tree API</b> (<code>com.sun.source.tree</code>, via <code>JavacTask</code> or a javac plugin, which is how Error Prone works) gives exactly the compiler's view with full attribution; and <b>srcML</b> (next lesson) gives an XML CST queried with XPath."
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: "Details that matter when you run these tools over real projects rather than a single file.",
    sections: [
      {
        h: "Symbol resolution at project scale",
        p: [
          "Resolution quality depends entirely on the type solver configuration. For a Maven project you need every source root (main, test, generated sources) as <code>JavaParserTypeSolver</code>s and every dependency JAR as a <code>JarTypeSolver</code>; get the JAR list from <code>mvn dependency:build-classpath -Dmdep.outputFile=cp.txt</code>. JavaParser's <code>ProjectRoot</code>/<code>SymbolSolverCollectionStrategy</code> can discover source roots automatically. Expect some unresolved symbols (annotation processors such as Lombok generate code that is not on disk) and count them as a metric of how trustworthy the results are.",
          "JDT needs the same thing through <code>setEnvironment</code>. With <code>setBindingsRecovery(true)</code> it fabricates recovered bindings for missing types, so <code>getName()</code> still works even when the declaring JAR is absent."
        ]
      },
      {
        h: "Preserving formatting when you rewrite",
        p: [
          "Pretty-printing the whole compilation unit after a change produces diffs that touch every line, which is unacceptable for pull requests or patch-based research (program repair benchmarks compare patches). JavaParser: call <code>LexicalPreservingPrinter.setup(cu)</code> before modifying and <code>LexicalPreservingPrinter.print(cu)</code> after. JDT: record changes with <code>ASTRewrite.create(ast)</code> and apply the resulting <code>TextEdit</code> to a <code>Document</code>. Spoon: <code>environment.setPrettyPrinterCreator(...)</code> with <code>SniperJavaPrettyPrinter</code>, which reprints only modified elements. tree-sitter: compute byte-range replacements yourself and apply them back to front so earlier offsets stay valid."
        ]
      },
      {
        h: "tree-sitter details worth knowing",
        p: [
          "Named vs anonymous nodes: grammar rules give named nodes (<code>method_declaration</code>); literal strings in the grammar give anonymous ones (<code>\"(\"</code>, <code>\"public\"</code>). Fields (<code>name:</code>, <code>body:</code>) are labels on edges, not nodes. Queries support predicates such as <code>(#eq? @name \"main\")</code> and <code>(#match? @name \"^test\")</code>, quantifiers (<code>+</code>, <code>*</code>, <code>?</code>), anchors (<code>.</code>) and alternations (<code>[ ... ]</code>). For a single-file edit, <code>tree.edit(...)</code> followed by <code>parser.parse(new_bytes, old_tree)</code> reparses incrementally; <code>tree.changed_ranges(new_tree)</code> tells you what changed.",
          "Positions are byte-based (<code>start_byte</code>) and rows/columns are 0-based, unlike javac and JDT which use 1-based lines. Off-by-one line numbers are the classic integration bug."
        ]
      },
      {
        h: "The javac Tree API and Error Prone",
        p: [
          "<code>JavacTool.create().getTask(...)</code> returns a <code>JavacTask</code>; <code>task.parse()</code> gives <code>CompilationUnitTree</code>s and <code>task.analyze()</code> attributes them, after which <code>Trees.instance(task).getElement(path)</code> and <code>TreePathScanner</code> give fully resolved symbols. This is the most faithful view of Java semantics (it is the compiler) but requires the code to compile. Error Prone packages this as a javac plugin: each <code>BugChecker</code> implements matchers like <code>MethodInvocationTreeMatcher</code> and returns a <code>Description</code> with an optional <code>SuggestedFix</code>."
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: "Four Ways to Map an Island",
      text: [
        "The crew lands on an unknown island and four people map it differently. Usopp (tree-sitter) sketches incredibly fast, every rock and puddle included, and even if half the island is fogged in he still hands back a map with the foggy parts marked \"unclear\". But his map does not say who owns which house.",
        "Nami (JavaParser) draws a clean map of roads and buildings, skipping the pebbles. If you hand her the island registry (the symbol solver), she labels every house with its owner. Robin (Eclipse JDT) works like the island's own surveyor: she can map even ruined, half-collapsed districts, and with the registry she resolves every name precisely. Franky (Spoon) maps in order to rebuild: his blueprint is designed for adding a new bridge and printing a fresh plan of the changed district only."
      ]
    },
    sitcom: {
      show: "Friends",
      title: "Four Friends Describe the Same Apartment",
      text: [
        "Asked to describe Monica's apartment for an insurance claim, Phoebe lists literally everything, including the fridge magnets (a CST). Ross gives a structured floor plan without the magnets (an AST). Monica's version also says who owns each item and where she bought it (a resolved AST with bindings). Chandler hands over the plan with a proposed change: knock down the wall to Joey's place, and redraws only that wall (a transformation tool with minimal-diff printing)."
      ]
    },
    why: "The four mappers are the four tools: tree-sitter is fast, lossless and tolerant but knows nothing about ownership (types); JavaParser is a clean AST that resolves names when given a registry; JDT is the robust surveyor of broken ground; Spoon is built for changing the map and reprinting only what changed."
  },
  storyAnim: {
    h: 240,
    props: [
      { id: "island", emoji: "🏝️", label: "Calc.java", x: 8, y: 45 },
      { id: "fog", emoji: "🌫️", label: "syntax error", x: 8, y: 85, cls: "off" },
      { id: "cst", emoji: "🗺️", label: "CST (every token)", x: 36, y: 15, cls: "off" },
      { id: "ast", emoji: "📐", label: "AST", x: 36, y: 50, cls: "off" },
      { id: "registry", emoji: "📚", label: "type solver", x: 60, y: 50, cls: "off" },
      { id: "resolved", emoji: "🏷️", label: "List.add(E)", x: 84, y: 50, cls: "off" },
      { id: "patch", emoji: "🔧", label: "spooned/ output", x: 84, y: 85, cls: "off" }
    ],
    actors: [
      { id: "usopp", emoji: "🎯", label: "Usopp (tree-sitter)", x: 20, y: 25 },
      { id: "nami", emoji: "🧭", label: "Nami (JavaParser)", x: 20, y: 60 },
      { id: "franky", emoji: "🤖", label: "Franky (Spoon)", x: 60, y: 85 }
    ],
    steps: [
      { c: "One source file, four tools.", p: { island: "lit" } },
      { c: "tree-sitter produces a concrete syntax tree in milliseconds: every brace and semicolon is a node.", a: { usopp: [36, 30] }, p: { cst: "lit" } },
      { c: "Even with a syntax error, tree-sitter returns a tree with a localized ERROR node instead of failing.", p: { fog: "bad", cst: "good" } },
      { c: "JavaParser builds an AST: punctuation is gone, structure remains. log.add(a+b) is a MethodCallExpr.", a: { nami: [36, 68] }, p: { ast: "lit" } },
      { c: "With a CombinedTypeSolver configured, call.resolve() connects the call to a declaration.", a: { nami: [60, 68] }, p: { registry: "lit" } },
      { c: "Result: java.util.List.add(E). Name resolution is what separates a syntax tool from a semantic one.", p: { resolved: "good" } },
      { c: "Spoon's processor finds the empty catch, inserts a statement, and prints transformed sources to spooned/.", a: { franky: [80, 70] }, p: { patch: "good" } }
    ]
  },
  conceptFlow: {
    title: "From a Java file to answers",
    intro: "Which steps each tool performs. Click a node to jump to it.",
    stages: [
      { label: "Parse", nodes: [ { id: "ts", text: "tree-sitter\nCST" }, { id: "jp", text: "JavaParser\nAST" }, { id: "jdt", text: "JDT ASTParser\nDOM AST" } ] },
      { label: "Resolve", nodes: [ { id: "solver", text: "Symbol solver\n(type solvers)" }, { id: "bind", text: "JDT bindings\n(classpath)" } ] },
      { label: "Query", nodes: [ { id: "tsq", text: "S-expression\nqueries" }, { id: "visit", text: "Visitors /\nfindAll" } ] },
      { label: "Rewrite", nodes: [ { id: "spoon", text: "Spoon processor" }, { id: "lpp", text: "Lexical-preserving\nprint" } ] }
    ],
    steps: [
      { active: ["ts"], note: "tree-sitter parses bytes into a lossless CST, tolerating errors. No resolution step exists." },
      { active: ["ts", "tsq"], note: "Query it with S-expression patterns and captures, e.g. method_invocation object/name pairs." },
      { active: ["jp"], note: "JavaParser parses to an AST with comments attached and positions on every node." },
      { active: ["jp", "solver"], note: "Configure a CombinedTypeSolver (reflection, source roots, JARs) to resolve calls and types." },
      { active: ["jdt", "bind"], note: "JDT resolves bindings when given setResolveBindings(true), an environment and a unit name." },
      { active: ["visit"], note: "VoidVisitorAdapter (JavaParser) and ASTVisitor (JDT) dispatch per node type." },
      { active: ["spoon"], note: "Spoon processors match a metamodel type, filter with isToBeProcessed, and change code with the factory." },
      { active: ["lpp"], note: "For reviewable diffs, print with LexicalPreservingPrinter, ASTRewrite or Spoon's sniper printer." }
    ]
  },
  tech: [
    {
      q: "Why does JavaParser report List.add(E) and not List.add(Integer)?",
      a: [
        "<code>resolve()</code> returns the <b>declaration</b> of the method, and the declaration in <code>java.util.List</code> is <code>add(E)</code>. The substituted signature for this call site is a property of the call's resolved type: use <code>JavaParserFacade.get(typeSolver).solve(call)</code> to get a <code>SymbolReference</code> plus <code>MethodUsage</code>, whose parameter types are substituted. JDT shows the same distinction: <code>resolveMethodBinding()</code> on the call returns a parameterized binding (<code>List&lt;Integer&gt;.add</code>), and <code>getMethodDeclaration()</code> gives the generic one."
      ]
    },
    {
      q: "Why does ASTVisitor.visit return a boolean while JavaParser's visit returns void?",
      a: [
        "Different recursion designs. JDT's <code>ASTVisitor</code> has the traversal driven by the nodes: <code>accept</code> calls <code>visit</code>, and if it returns <code>true</code> the node visits its children, then calls <code>endVisit</code>. Returning <code>false</code> prunes the subtree. JavaParser's <code>VoidVisitorAdapter</code> implements recursion inside each default <code>visit</code> method, so you keep recursing by calling <code>super.visit(n, arg)</code> and prune by not calling it. Same effect, different place to forget it."
      ]
    },
    {
      q: "Is tree-sitter's grammar for Java a full Java grammar?",
      a: [
        "It aims to parse valid Java correctly, but its goal is a useful tree for editors, not a conformance checker: it accepts some invalid programs, and its node types follow its own naming (<code>method_declaration</code>, <code>local_variable_declaration</code>), not the JLS. It knows nothing about types, so <code>a.b.c</code> is ambiguous between package, field and class access and it just gives you <code>field_access</code>/<code>scoped_identifier</code> shapes. Pin the grammar package version in research pipelines, because node types change between releases."
      ]
    },
    {
      q: "What does Spoon's noclasspath mode actually give up?",
      a: [
        "Without dependencies, references to external types cannot be fully resolved: Spoon still builds <code>CtTypeReference</code>s by name, but they may lack a declaration (<code>getTypeDeclaration()</code> returns null), overload resolution can be ambiguous, and inherited members of external supertypes are unknown. Analyses keep working on the source you have; analyses that need library semantics (\"is this a subtype of Collection\") become heuristic."
      ]
    }
  ],
  code: {
    title: "JavaParser with the symbol solver: methods, resolved calls and empty catch blocks",
    intro: "Tested with <code>javaparser-symbol-solver-core:3.26.2</code> on <code>src/demo/Calc.java</code> (a class with <code>List&lt;Integer&gt; log</code>, methods <code>add</code> and <code>reset</code>, and an empty catch).",
    code: String.raw`// Calc.java (input)
package demo;
import java.util.List;
import java.util.ArrayList;
public class Calc {
    private List<Integer> log = new ArrayList<>();
    public int add(int a, int b) {
        log.add(a + b);
        return a + b;
    }
    public void reset() {
        try {
            log.clear();
        } catch (Exception e) {
        }
    }
}

// JP.java
import java.nio.file.*;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.stmt.CatchClause;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import com.github.javaparser.symbolsolver.JavaSymbolSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.*;

public class JP {
    public static void main(String[] args) throws Exception {
        CombinedTypeSolver ts = new CombinedTypeSolver(
            new ReflectionTypeSolver(),
            new JavaParserTypeSolver(Paths.get("src")));
        StaticJavaParser.getParserConfiguration().setSymbolResolver(new JavaSymbolSolver(ts));

        CompilationUnit cu = StaticJavaParser.parse(Paths.get("src/demo/Calc.java"));
        cu.accept(new VoidVisitorAdapter<Void>() {
            @Override public void visit(MethodDeclaration md, Void arg) {
                System.out.println("method " + md.getNameAsString() + " at line " + md.getBegin().get().line);
                super.visit(md, arg);
            }
            @Override public void visit(MethodCallExpr call, Void arg) {
                System.out.println("  call " + call + " -> " + call.resolve().getQualifiedSignature());
                super.visit(call, arg);
            }
            @Override public void visit(CatchClause cc, Void arg) {
                if (cc.getBody().getStatements().isEmpty())
                    System.out.println("  EMPTY CATCH at line " + cc.getBegin().get().line);
                super.visit(cc, arg);
            }
        }, null);
        cu.findAll(MethodDeclaration.class).forEach(m -> System.out.println(m.getDeclarationAsString()));
    }
}

/* Build and run (Maven pulls the jars):
   mvn dependency:copy-dependencies -DoutputDirectory=lib   # pom with javaparser-symbol-solver-core
   javac -cp "lib/*" JP.java && java -cp "lib/*:." JP

Output:
method add at line 9
  call log.add(a + b) -> java.util.List.add(E)
method reset at line 14
  EMPTY CATCH at line 17
  call log.clear() -> java.util.List.clear()
public int add(int a, int b)
public void reset()
*/`,
    notes: [
      "Visit order is not source order: in <code>reset</code> the empty catch is printed before <code>log.clear()</code> because JavaParser's generated <code>VoidVisitorAdapter</code> visits a <code>TryStmt</code>'s fields in its own metamodel order (catch clauses before the try block). Sort findings by position before reporting.",
      "<code>md.getBegin()</code> returns <code>Optional&lt;Position&gt;</code> because nodes created programmatically have no position. Use <code>.map(p -&gt; p.line).orElse(-1)</code> in production code.",
      "Without the <code>setSymbolResolver</code> line, parsing still works but <code>call.resolve()</code> throws <code>IllegalStateException</code> (no symbol resolver configured)."
    ]
  },
  lab: {
    title: "Find assertion-free JUnit tests with JavaParser",
    prompt: "Write <code>AssertionFreeTests</code>: for each Java file given on the command line, parse it with <code>StaticJavaParser.parse(new File(path))</code> and use a <code>VoidVisitorAdapter&lt;String&gt;</code> (the argument carries the file name) that, for every <code>MethodDeclaration</code> annotated with <code>@Test</code> (<code>isAnnotationPresent(\"Test\")</code>), counts the <code>MethodCallExpr</code>s inside it whose name starts with <code>assert</code> or equals <code>fail</code> or <code>verify</code>. Print <code>file:line: test NAME has no assertions</code> when the count is zero. Call <code>super.visit</code> so nested classes are still visited.",
    starter: String.raw`import java.io.File;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;

public class AssertionFreeTests {

    static class TestVisitor extends VoidVisitorAdapter<String> {
        // TODO: override visit(MethodDeclaration md, String file)
    }

    public static void main(String[] args) throws Exception {
        for (String path : args) {
            // TODO: parse the file and accept the visitor with the path as argument
        }
    }
}
`,
    checks: [
      { re: 'extends\\s+VoidVisitorAdapter\\s*<\\s*String\\s*>', flags: '', must: true, hint: "Extend VoidVisitorAdapter<String> so the visitor argument is the file name.", pass: "Visitor type ✓" },
      { re: 'public\\s+void\\s+visit\\s*\\(\\s*MethodDeclaration\\s+\\w+\\s*,\\s*String\\s+\\w+\\s*\\)', flags: '', must: true, hint: "Override public void visit(MethodDeclaration md, String file).", pass: "visit(MethodDeclaration, String) ✓" },
      { re: 'super\\.visit\\(', flags: '', must: true, hint: "Call super.visit(md, file) to keep traversing nested classes.", pass: "Recursion kept ✓" },
      { re: 'isAnnotationPresent\\(\\s*"Test"\\s*\\)', flags: '', must: true, hint: "Filter with md.isAnnotationPresent(\"Test\").", pass: "@Test filter ✓" },
      { re: 'findAll\\(\\s*MethodCallExpr\\.class\\s*\\)', flags: '', must: true, hint: "Collect calls with md.findAll(MethodCallExpr.class).", pass: "Calls collected ✓" },
      { re: 'startsWith\\(\\s*"assert"\\s*\\)', flags: '', must: true, hint: "Match assertion methods with getNameAsString().startsWith(\"assert\").", pass: "assert* matched ✓" },
      { re: 'StaticJavaParser\\.parse\\(', flags: '', must: true, hint: "Parse each file with StaticJavaParser.parse(new File(path)).", pass: "Parsing ✓" },
      { re: 'accept\\(\\s*new\\s+TestVisitor\\(\\)\\s*,\\s*\\w+\\s*\\)', flags: '', must: true, hint: "Run it with cu.accept(new TestVisitor(), path).", pass: "Visitor applied ✓" }
    ],
    run: "Get the jar: <code>curl -LO https://repo1.maven.org/maven2/com/github/javaparser/javaparser-core/3.25.10/javaparser-core-3.25.10.jar</code> (Java 8+ is enough). Create <code>CartTest.java</code> with one test that calls <code>assertEquals</code> and one (<code>removesItem</code>, starting at line 12) that only calls <code>c.add</code> and <code>c.remove</code>. Then <code>javac -cp javaparser-core-3.25.10.jar AssertionFreeTests.java && java -cp javaparser-core-3.25.10.jar:. AssertionFreeTests CartTest.java</code>. Expected: <code>CartTest.java:12: test removesItem has no assertions</code>. You do not need JUnit on the classpath: parsing does not resolve imports. Then run it over a real project: <code>java -cp ... AssertionFreeTests $(find src/test -name '*.java')</code>.",
    solution: String.raw`import java.io.File;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;

public class AssertionFreeTests {

    static class TestVisitor extends VoidVisitorAdapter<String> {
        @Override
        public void visit(MethodDeclaration md, String file) {
            super.visit(md, file);
            if (!md.isAnnotationPresent("Test")) {
                return;
            }
            long asserts = md.findAll(MethodCallExpr.class).stream()
                .filter(c -> c.getNameAsString().startsWith("assert")
                          || c.getNameAsString().equals("fail")
                          || c.getNameAsString().equals("verify"))
                .count();
            if (asserts == 0) {
                int line = md.getBegin().map(p -> p.line).orElse(-1);
                System.out.println(file + ":" + line + ": test " + md.getNameAsString() + " has no assertions");
            }
        }
    }

    public static void main(String[] args) throws Exception {
        for (String path : args) {
            CompilationUnit cu = StaticJavaParser.parse(new File(path));
            cu.accept(new TestVisitor(), path);
        }
    }
}
`,
    notes: [
      "This is a syntactic heuristic. It misses assertions hidden in helper methods (<code>checkCart(c)</code> that asserts internally) and AssertJ chains are fine only because they start with <code>assertThat</code>. A semantic version would resolve calls with the symbol solver and follow helpers one or two levels deep.",
      "<code>isAnnotationPresent(\"Test\")</code> matches by simple name, so it catches JUnit 4 and 5 and TestNG alike, but also any unrelated annotation named <code>Test</code>. Resolving the annotation type removes that ambiguity.",
      "Assertion-free tests (the \"Unknown Test\" smell in tsDetect) are a known factor in test-suite effectiveness studies; this exact visitor is a reasonable first pass over thousands of repositories."
    ]
  },
  quiz: [
    {
      q: "Which tool would still give you a usable tree for a Java file with a missing closing brace, at the lowest setup cost?",
      options: ["javac Tree API", "Soot", "tree-sitter", "JavaParser symbol solver"],
      correct: 2,
      explain: "tree-sitter always returns a tree, marking damage with ERROR/MISSING nodes. JDT would also recover, with more setup."
    },
    {
      q: "Your JavaParser tool calls <code>call.resolve()</code> and gets <code>IllegalStateException: Symbol resolution not configured</code>. Fix?",
      options: ["Use findAll instead", "Set a JavaSymbolSolver with a CombinedTypeSolver on the parser configuration before parsing", "Add -g to javac", "Switch to tree-sitter"],
      correct: 1,
      explain: "Resolution is opt-in: <code>getParserConfiguration().setSymbolResolver(new JavaSymbolSolver(typeSolver))</code>."
    },
    {
      q: "In JDT, returning <code>false</code> from <code>ASTVisitor.visit(MethodDeclaration)</code> means:",
      options: ["The method is deleted", "The visitor stops entirely", "The children of that method are not visited", "Bindings are disabled"],
      correct: 2,
      explain: "The boolean controls descent into the node's children; traversal continues with siblings."
    },
    {
      q: "What is the main reason to choose Spoon over JavaParser for a program-repair tool?",
      options: ["Spoon is faster", "Spoon's typed metamodel, processors and factories make generating and printing transformed code first class", "Spoon does not need a JVM", "Spoon supports Python too"],
      correct: 1,
      explain: "Spoon is designed for analysis plus transformation, with factories for building code and printers (including sniper mode) for output."
    },
    {
      q: "A tree-sitter query <code>(method_invocation object: (identifier) @recv name: (identifier) @meth)</code> matches <code>log.add(x)</code>. What does it not tell you?",
      options: ["The receiver name", "The method name", "That log is a java.util.List and which add overload is called", "The line number"],
      correct: 2,
      explain: "tree-sitter has no type or name resolution; it only knows the syntactic shape."
    }
  ],
  testFlow: {
    title: "Pick the Java tool",
    start: "q1",
    nodes: {
      q1: { q: "You need to count method declarations in every commit of 2,000 Java repositories, many of which do not build. Tool?", choices: [ { text: "tree-sitter (or srcML)", to: "q1ok" }, { text: "JDT with full bindings for each commit", to: "q1bad" } ] },
      q1ok: { end: true, correct: true, text: "Right. A purely syntactic count needs no types, and tolerant parsing plus speed matter most.", next: "q2" },
      q1bad: { end: true, correct: false, text: "Bindings need a classpath per commit, which you mostly cannot reconstruct, and you do not need types for counting.", retry: "q1" },
      q2: { q: "You need to know whether each call targets a method in the project or in a library. Tool?", choices: [ { text: "tree-sitter query on method_invocation", to: "q2bad" }, { text: "JavaParser with symbol solver, or JDT bindings", to: "q2ok" } ] },
      q2bad: { end: true, correct: false, text: "That question needs name and type resolution. tree-sitter only sees names.", retry: "q2" },
      q2ok: { end: true, correct: true, text: "Correct. Resolve the call and look at the declaring type's origin (source solver vs JAR solver).", next: "q3" },
      q3: { q: "You will generate thousands of candidate patches and must emit minimal diffs. Tool?", choices: [ { text: "Spoon with the sniper printer (or JDT ASTRewrite)", to: "q3ok" }, { text: "JavaParser default pretty printer", to: "q3bad" } ] },
      q3ok: { end: true, correct: true, text: "Yes. These reprint only changed elements, giving reviewable, comparable patches." },
      q3bad: { end: true, correct: false, text: "The default printer reformats the whole file. Use LexicalPreservingPrinter at least, or a tool built for transformation.", retry: "q3" }
    }
  },
  pitfalls: [
    "Forgetting <code>super.visit(n, arg)</code> in a JavaParser visitor, or returning <code>false</code> in a JDT visitor, and silently skipping nested and anonymous classes.",
    "Mixing 0-based (tree-sitter rows) and 1-based (JavaParser, JDT, javac) line numbers when joining results from different tools.",
    "Assuming resolution worked: count <code>UnsolvedSymbolException</code>s and null bindings and report them; on real projects a configuration mistake can leave most calls unresolved without crashing.",
    "Following an old tree-sitter tutorial: <code>Language(path, 'java')</code> and <code>query.captures()</code> returning tuples are from removed APIs. Current bindings use per-language wheels and <code>QueryCursor</code>.",
    "Pretty-printing whole files after a transformation, producing diffs that touch every line."
  ],
  interview: [
    {
      q: "Compare JavaParser, Eclipse JDT, Spoon and tree-sitter. When do you use each?",
      a: "tree-sitter: fastest, error tolerant, multi-language CST with queries, no types; I use it for mining at scale and for anything that must survive broken code. JavaParser: lightweight Java AST with visitors and an opt-in symbol solver; good for quick analyzers and metrics on Java 8+ code with modest semantic needs. JDT: IDE-grade parser with robust recovery, precise bindings and minimal-diff rewriting; good when precision and broken-code handling both matter. Spoon: typed metamodel on JDT with processors, factories and sniper printing; my default for transformation-heavy research such as program repair or mutation. The deciding questions are: do I need types, must I handle broken code, will I write code back, and how many files."
    },
    {
      q: "What is the difference between a CST and an AST, and why do refactoring tools care?",
      a: "A CST records every token and grammar production, so it is lossless; an AST keeps only semantically meaningful structure. Refactoring tools must produce minimal diffs that preserve comments, formatting and the author's choices, so they either work on a CST or keep enough token and trivia information alongside the AST (JavaParser's LexicalPreservingPrinter, JDT ASTRewrite, Roslyn's red-green trees) to print untouched regions exactly."
    },
    {
      q: "How does the JavaParser symbol solver resolve a call like <code>log.add(x)</code>?",
      a: "It resolves <code>log</code> by walking enclosing scopes (block, method parameters, fields, inherited fields, imports) to the field declaration, computes its type <code>List&lt;Integer&gt;</code> via the type solvers (ReflectionTypeSolver finds <code>java.util.List</code>), collects candidate <code>add</code> methods from that type and its supertypes, and applies Java overload resolution using the argument types (computed recursively) to pick <code>add(E)</code> with E = Integer. Each step depends on the type solvers covering every type involved; a missing JAR breaks the chain."
    },
    {
      q: "Whiteboard: build a tool that detects test smells across 5,000 Java projects and links each to production code under test.",
      a: "Two tiers. Tier 1, syntactic, for all projects and all commits: tree-sitter or JavaParser without resolution, find test classes by convention and annotations, compute smells (assertion-free, sleepy test via <code>Thread.sleep</code>, empty test, ignored test, eager test with many production calls, magic numbers). Tier 2, semantic, for projects that build: run <code>mvn dependency:build-classpath</code>, configure the symbol solver (or JDT) with source roots and JARs, resolve calls from tests into production classes to link test to focal method, and track resolution rate as a quality metric. Store results per (project, commit, file, method, smell). Validate precision on a labeled sample and report how many projects reached tier 2 to make the selection bias explicit."
    },
    {
      q: "Explain a tradeoff: resolving types versus staying syntactic in a large-scale empirical study.",
      a: "Resolution gives precise answers (is this call a JDK method, which overload, is this a subtype of Collection) but requires a correct classpath per project and per commit, which fails for a sizable fraction of real projects and is slow. Staying syntactic covers every project and every revision quickly but introduces name-based ambiguity (two different <code>add</code> methods look the same). I usually report syntactic results on the full population, semantic results on the buildable subset, and measure how often they disagree on the overlap to bound the error."
    },
    {
      q: "How would you rewrite all <code>assertTrue(a.equals(b))</code> into <code>assertEquals(b, a)</code> across a codebase?",
      a: "Spoon processor on <code>CtInvocation</code> (or JavaParser <code>ModifierVisitor</code>, or a JDT ASTRewrite) matching calls named <code>assertTrue</code> whose single argument is an invocation of <code>equals</code> with one argument; resolve the method to confirm it is JUnit's <code>Assert.assertTrue</code> and the receiver's <code>equals</code> is <code>Object.equals</code> or an override; build the replacement <code>assertEquals(expected, actual)</code>, add the import if needed, and print with a minimal-diff printer. Then compile and run the tests to confirm behavior is unchanged; skip cases with side effects in arguments where evaluation order would change."
    },
    {
      q: "What is the javac Tree API and why would you use it instead of JavaParser?",
      a: "<code>com.sun.source.tree</code> plus <code>JavacTask</code> exposes the compiler's own trees; after <code>analyze()</code>, every node is attributed exactly as javac does it, including inference, lambdas and annotation processing results. It is the ground truth for Java semantics and what Error Prone and the Checker Framework build on. The cost: code must compile with that javac, the API is JDK-internal in places (module exports needed), and it is harder to use outside a build."
    }
  ]
};
