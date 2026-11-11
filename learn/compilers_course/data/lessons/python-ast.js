window.LESSONS = window.LESSONS || {};
window.LESSONS['python-ast'] = {
  id: 'python-ast',
  title: "Python's ast Module: Parse, Visit, Transform & Unparse",
  category: "Part 1 — Working With ASTs",
  timeMin: 45,
  summary: "Python ships its own compiler front end as a library. <code>ast.parse</code> gives you the exact tree CPython compiles, <code>ast.NodeVisitor</code> lets you write analyses (a lint rule is about 15 lines), <code>ast.NodeTransformer</code> lets you rewrite code, <code>ast.fix_missing_locations</code> repairs positions after rewriting, and <code>ast.unparse</code> (3.9+) turns a tree back into source. This lesson builds a real linter with four rules (mutable defaults, bare except, <code>== None</code>, unused imports) plus an auto-fixer, and explains what the AST cannot tell you: comments, formatting and types are all gone.",
  goals: [
    "Parse code with <code>ast.parse</code> and read the tree with <code>ast.dump(tree, indent=2)</code>, including <code>ctx</code>, <code>lineno</code>/<code>col_offset</code> and <code>end_lineno</code>",
    "Write lint rules as <code>ast.NodeVisitor</code> subclasses, remembering to call <code>generic_visit</code>",
    "Rewrite code with <code>ast.NodeTransformer</code>, then repair positions with <code>copy_location</code>/<code>fix_missing_locations</code> and compile or unparse the result",
    "Explain the limits of the AST: lost comments and formatting, no types, no name resolution across modules, version-specific node shapes",
    "Choose between <code>ast</code>, <code>libcst</code>, <code>symtable</code> and a type checker for a given tooling task"
  ],
  concept: [
    {
      h: "Parsing and reading the tree",
      p: [
        "<code>ast.parse(source, filename='&lt;unknown&gt;', mode='exec')</code> returns an <code>ast.Module</code> (mode <code>'eval'</code> gives <code>ast.Expression</code> for one expression, <code>'single'</code> is for the REPL). Each node is an instance of a class in <code>ast</code> (<code>FunctionDef</code>, <code>Assign</code>, <code>Call</code>, <code>Name</code>...), with fields listed in <code>Node._fields</code> and positions in <code>lineno</code>, <code>col_offset</code>, <code>end_lineno</code>, <code>end_col_offset</code> (1-based lines, 0-based UTF-8 byte columns).",
        "<code>ast.dump(node, indent=2)</code> pretty-prints the tree (3.9+); add <code>include_attributes=True</code> to see positions. Notice the expression context: <code>Name(id='x', ctx=Store())</code> on the left of <code>=</code>, <code>ctx=Load()</code> when read, <code>Del()</code> in <code>del x</code>. Literals are all <code>ast.Constant</code> since 3.8 (the old <code>Num</code>, <code>Str</code>, <code>NameConstant</code> are deprecated aliases).",
        "<code>ast.get_source_segment(source, node)</code> recovers the exact original text of a node, which is how you quote code in a warning without reformatting it."
      ],
      code: String.raw`>>> import ast
>>> tree = ast.parse("def load(path, cache={}):\n    return cache.get(path)")
>>> print(ast.dump(tree.body[0].args, indent=2))
arguments(
  posonlyargs=[],
  args=[
    arg(arg='path'),
    arg(arg='cache')],
  kwonlyargs=[],
  kw_defaults=[],
  defaults=[
    Dict(keys=[], values=[])])
>>> ret = tree.body[0].body[0]
>>> ret.lineno, ret.col_offset, ret.end_col_offset
(2, 4, 26)
>>> ast.unparse(ret.value)
'cache.get(path)'`
    },
    {
      h: "Walking the tree: ast.walk vs NodeVisitor",
      p: [
        "<code>ast.walk(tree)</code> yields every node in breadth-first order with no context. It is ideal for quick queries: <code>[n for n in ast.walk(tree) if isinstance(n, ast.Call)]</code>.",
        "<code>ast.NodeVisitor</code> dispatches on node class: <code>visit(node)</code> calls <code>visit_&lt;ClassName&gt;</code> if defined, otherwise <code>generic_visit</code>, which visits all children. The single most common bug: defining <code>visit_FunctionDef</code> and forgetting <code>self.generic_visit(node)</code>, so nested functions and everything inside the body are silently skipped. Visitors are the right tool when you need context such as \"am I inside a test function\" or \"which class am I in\": keep a stack in the visitor and push/pop around <code>generic_visit</code>.",
        "Remember the async and other twins: <code>AsyncFunctionDef</code>, <code>AsyncFor</code>, <code>AsyncWith</code> are separate classes, so a rule for <code>FunctionDef</code> should usually alias <code>visit_AsyncFunctionDef = visit_FunctionDef</code>. Lambdas are <code>ast.Lambda</code> and have <code>args</code> too."
      ]
    },
    {
      h: "A real lint rule: mutable default arguments",
      p: [
        "Default values are evaluated once, when <code>def</code> runs, so <code>def f(x, acc=[])</code> shares one list across calls. Flake8-bugbear calls it B006, Ruff implements the same code. The AST rule: for every function, look at <code>node.args.defaults</code> (positional defaults, aligned to the last parameters) and <code>node.args.kw_defaults</code> (one entry per keyword-only arg, <code>None</code> when it has no default) and flag <code>List</code>, <code>Dict</code>, <code>Set</code> literals, or calls such as <code>list()</code>/<code>dict()</code>.",
        "That is the shape of almost every syntactic rule: match a node type, inspect its fields, report <code>(lineno, col_offset, code, message)</code>. The full linter in the worked example adds bare <code>except:</code> (E722), <code>== None</code> (E711) and unused imports (F401)."
      ],
      code: String.raw`class MutableDefaults(ast.NodeVisitor):
    def __init__(self):
        self.problems = []
    def visit_FunctionDef(self, node):
        for d in node.args.defaults + [d for d in node.args.kw_defaults if d is not None]:
            if isinstance(d, (ast.List, ast.Dict, ast.Set)) or (
                isinstance(d, ast.Call) and isinstance(d.func, ast.Name) and d.func.id in {"list", "dict", "set"}):
                self.problems.append((d.lineno, d.col_offset, "B006", f"mutable default in {node.name}()"))
        self.generic_visit(node)
    visit_AsyncFunctionDef = visit_FunctionDef`
    },
    {
      h: "Rewriting: NodeTransformer, locations, unparse",
      p: [
        "<code>ast.NodeTransformer</code> is a visitor whose <code>visit_X</code> return value replaces the node: return the node (possibly modified) to keep it, a new node to replace it, <code>None</code> to delete it (in a statement list), or a list of nodes to splice several statements in. Call <code>self.generic_visit(node)</code> first if you want children transformed before the parent (post-order), which is what constant folding needs.",
        "New nodes have no positions, and <code>compile()</code> refuses trees with missing <code>lineno</code>. Use <code>ast.copy_location(new, old)</code> for one node and <code>ast.fix_missing_locations(tree)</code> to fill in everything else from parents. <code>ast.increment_lineno</code> shifts a subtree.",
        "<code>ast.unparse(tree)</code> (3.9+) generates equivalent source. It is <b>not</b> a round trip of the original text: comments vanish, quotes and parentheses are normalized, formatting is regenerated. For codemods that must preserve formatting use <b>LibCST</b> (a concrete syntax tree for Python that keeps every whitespace and comment) or apply edits as text replacements at the node's <code>(lineno, col_offset)</code>–<code>(end_lineno, end_col_offset)</code> span."
      ],
      code: String.raw`class NoneCompare(ast.NodeTransformer):
    def visit_Compare(self, node):
        self.generic_visit(node)
        node.ops = [ast.Is() if isinstance(op, ast.Eq) and isinstance(r, ast.Constant) and r.value is None else op
                    for op, r in zip(node.ops, node.comparators)]
        return node

tree = NoneCompare().visit(ast.parse("if x == None:\n    pass  # keep?"))
tree = ast.fix_missing_locations(tree)
print(ast.unparse(tree))      # if x is None:\n    pass     <- the comment is gone
exec(compile(tree, "<rewritten>", "exec"), {"x": None})`
    },
    {
      h: "What the AST does not know",
      p: [
        "<ul><li><b>Comments and formatting</b>: dropped by the tokenizer. Use <code>tokenize</code> to get comments (with positions), or LibCST.</li><li><b>Scopes</b>: the AST says <code>Name('x')</code>, not which binding. The standard <code>symtable</code> module exposes CPython's own scope analysis (local, global, free, cell). For cross-module resolution use Jedi, pyright, or mypy's semantic analyzer.</li><li><b>Types</b>: <code>a.append(1)</code> could be a list or anything with <code>append</code>. A pure AST rule is a heuristic; type-aware rules need mypy/pyright plugins.</li><li><b>Version stability</b>: node shapes change (3.8 <code>Constant</code>, 3.10 <code>Match</code>, 3.12 <code>TypeAlias</code> and type params). <code>ast.parse(..., feature_version=(3, 8))</code> restricts grammar features but you still parse with the running interpreter's AST classes.</li><li><b>Dynamic code</b>: <code>getattr(obj, name)()</code>, <code>exec</code>, monkey-patching and decorators make any static Python analysis an approximation.</li></ul>"
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: "How real tools use this module, and the corner cases that break naive rules.",
    sections: [
      {
        h: "pytest's assertion rewriting",
        p: [
          "pytest installs an import hook (a PEP 302 meta path finder) for test modules. Before compiling a test file it parses it, and a <code>NodeTransformer</code> replaces each <code>assert</code> with statements that save intermediate values into temporaries and, on failure, build the detailed message (\"assert 3 == 4, where 3 = len(items)\"). The modified AST is compiled and cached as a <code>.pyc</code> under <code>__pycache__</code> with a pytest-specific tag. That is the best known production example of AST transformation in Python, and it explains why helper modules need <code>pytest.register_assert_rewrite</code> to get the same messages."
        ]
      },
      {
        h: "Ruff, Pylint and where they differ from ast",
        p: [
          "Pylint is built on <b>astroid</b>, which extends the standard AST with inference: <code>node.infer()</code> yields possible values or classes, which powers checks such as calling a non-callable. Flake8 plugins receive the standard <code>ast</code> tree plus tokens. Ruff reimplements the parser in Rust with its own AST (with full ranges and comment tokens) and is orders of magnitude faster, which is why it can replace flake8, isort and many pylint checks in CI. Bandit walks the standard AST with security-focused visitors (e.g. <code>subprocess</code> with <code>shell=True</code>, <code>yaml.load</code> without a safe loader)."
        ]
      },
      {
        h: "Corner cases that break naive rules",
        p: [
          "<ul><li>Chained comparisons: <code>a == b == None</code> is one <code>Compare</code> with two ops; iterate <code>zip(node.ops, node.comparators)</code>, and note the first left operand is <code>node.left</code>.</li><li><code>defaults</code> aligns to the last N positional parameters, including <code>posonlyargs</code>: parameters = <code>posonlyargs + args</code>, defaults apply to the tail.</li><li>Decorators live in <code>decorator_list</code> and are evaluated before the function; <code>lineno</code> of a decorated function is the <code>def</code> line (3.8+), not the decorator.</li><li><code>import a.b.c</code> binds name <code>a</code>; <code>import a.b as c</code> binds <code>c</code>. An unused-import rule must use <code>(alias.asname or alias.name).split('.')[0]</code>.</li><li>Names used only in string annotations (<code>x: \"Foo\"</code>) or in <code>__all__</code> look unused to a naive visitor.</li><li>Folding constants with <code>eval</code> can explode: <code>2 ** 10**10</code>. CPython's own optimizer has size limits for this reason.</li></ul>"
        ]
      },
      {
        h: "From AST to bytecode and back",
        p: [
          "<code>compile(tree, filename, 'exec')</code> runs the same symbol-table and code-generation phases as importing a file, so a transformed tree executes at full speed. The reverse direction (decompiling bytecode back to an AST) is not supported by the standard library, and third-party decompilers lag new Python versions because bytecode changes every release. For dynamic analysis of Python, instrument the AST (insert calls to a tracer at each statement, as coverage-style tools can) or use <code>sys.settrace</code>/<code>sys.monitoring</code> (3.12+) rather than bytecode rewriting."
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: "Chopper's Ship Inspection",
      text: [
        "Franky asks Chopper to inspect the whole Sunny for problems. Chopper does not wander randomly: he has a checklist per kind of room. In the kitchen he checks the stove, in the medical bay the medicine cabinet, in the cannon room the powder kegs. For any room without a checklist, he just walks through and opens every door to the rooms inside (generic_visit). The one time he forgot to keep walking after checking the main deck, he missed the entire Soldier Dock System underneath it.",
        "Some problems he fixes on the spot: a sign saying \"water == none\" gets repainted as \"water is none\" (a NodeTransformer). Each repaired item gets a tag with the room and shelf where it was found, copied from the item it replaced (copy_location). When Franky asks for the inspection report, Chopper redraws the ship blueprint from his notes (unparse): accurate, but Usopp's doodles in the margins are gone, because Chopper never recorded doodles."
      ]
    },
    sitcom: {
      show: "The Big Bang Theory",
      title: "Sheldon Proofreads Leonard's Paper",
      text: [
        "Sheldon has a rule for each kind of sentence: every sentence with \"always\" gets checked for overgeneralization, every citation gets its year verified. Paragraphs with no special rule he still reads, sentence by sentence, because the problem might be nested inside. He returns the paper with fixes applied, retyped from scratch, and Leonard is furious that his margin notes and careful formatting have vanished. Amy points out he should have used tracked changes on the original document (LibCST, or span-based text edits) instead of retyping it."
      ]
    },
    why: "A NodeVisitor is a checklist per node type plus a default walk into children, and forgetting the walk silently skips whole subtrees. A NodeTransformer repairs nodes in place and must carry location tags over. Regenerating source from the tree (unparse, Sheldon's retyping) is correct but loses everything the tree never stored: comments and formatting."
  },
  storyAnim: {
    h: 240,
    props: [
      { id: "deck", emoji: "🟫", label: "Module", x: 10, y: 25 },
      { id: "func", emoji: "🚪", label: "FunctionDef load()", x: 32, y: 25 },
      { id: "dflt", emoji: "📦", label: "cache={}", x: 32, y: 70, cls: "" },
      { id: "exc", emoji: "🕳️", label: "except:", x: 56, y: 70 },
      { id: "cmp", emoji: "🪧", label: "data == None", x: 76, y: 70 },
      { id: "report", emoji: "📋", label: "report", x: 90, y: 25, cls: "off" },
      { id: "src", emoji: "🗺️", label: "unparsed source", x: 60, y: 25, cls: "off" }
    ],
    actors: [
      { id: "chopper", emoji: "🦌", label: "Chopper (visitor)", x: 10, y: 60 }
    ],
    steps: [
      { c: "visit(Module): no visit_Module rule, so generic_visit walks into each child.", p: { deck: "lit" } },
      { c: "visit_FunctionDef fires for load(). It inspects args.defaults and finds a Dict literal: B006 mutable default.", a: { chopper: [32, 48] }, p: { func: "lit", dflt: "bad" } },
      { c: "It then calls generic_visit, so the walk continues into the function body. Without that call, everything below would be missed.", a: { chopper: [46, 55] } },
      { c: "visit_ExceptHandler: node.type is None, so this is a bare except. E722.", a: { chopper: [56, 50] }, p: { exc: "bad" } },
      { c: "visit_Compare: Eq against Constant(None). E711. The transformer swaps the Eq op for Is.", a: { chopper: [76, 50] }, p: { cmp: "good" }, l: { cmp: "data is None" } },
      { c: "fix_missing_locations fills positions for new nodes; ast.unparse regenerates source, without the original comments.", p: { src: "lit" } },
      { c: "Findings are sorted by (line, column) and printed in the familiar file:line:col: CODE message format.", a: { chopper: [88, 55] }, p: { report: "good" } }
    ]
  },
  conceptFlow: {
    title: "Analysis vs rewrite with the ast module",
    intro: "Both paths start from ast.parse; one ends in a report, the other in new code.",
    stages: [
      { label: "Input", nodes: [ { id: "src", text: "source text" }, { id: "parse", text: "ast.parse\n(positions kept)" } ] },
      { label: "Analyze", nodes: [ { id: "visit", text: "NodeVisitor\nvisit_X + generic_visit" }, { id: "report", text: "(line, col, code, msg)" } ] },
      { label: "Rewrite", nodes: [ { id: "xform", text: "NodeTransformer\nreturn new node" }, { id: "fix", text: "copy_location /\nfix_missing_locations" } ] },
      { label: "Output", nodes: [ { id: "unparse", text: "ast.unparse\n(no comments)" }, { id: "compile", text: "compile + exec" } ] }
    ],
    steps: [
      { active: ["src", "parse"], note: "ast.parse runs CPython's real tokenizer and PEG parser and returns an ast.Module with positions on every node." },
      { active: ["visit"], note: "A NodeVisitor dispatches visit_ClassName per node type. generic_visit recurses into children; forgetting it truncates the walk." },
      { active: ["report"], note: "Findings carry lineno and col_offset from the node; get_source_segment quotes the original text." },
      { active: ["xform"], note: "A NodeTransformer replaces nodes by return value: same node, new node, None (delete) or a list (splice)." },
      { active: ["fix"], note: "New nodes lack positions; compile() rejects them until copy_location or fix_missing_locations fills them in." },
      { active: ["unparse"], note: "ast.unparse regenerates equivalent source. Comments and formatting are lost; use LibCST when they matter." },
      { active: ["compile"], note: "Or skip source entirely: compile the tree to a code object and run it, as pytest does for rewritten asserts." }
    ]
  },
  tech: [
    {
      q: "Why is ctx (Load/Store/Del) stored on Name nodes at all?",
      a: [
        "Because the code generator needs it: the same <code>Name('x')</code> compiles to <code>LOAD_NAME</code>/<code>LOAD_FAST</code> when read and <code>STORE_*</code> when assigned, and the symbol table uses stores to decide that a name is local to a function. For analyses it is the cheapest def/use signal you get: a <code>Store</code> is a definition, a <code>Load</code> is a use. It is also what makes <code>x += 1</code> in a function without <code>global x</code> raise <code>UnboundLocalError</code>: the store makes <code>x</code> local for the whole function."
      ]
    },
    {
      q: "Why are col_offset values sometimes wrong for non-ASCII code?",
      a: [
        "<code>col_offset</code> and <code>end_col_offset</code> are UTF-8 byte offsets into the line, not character indices. A line with <code>s = \"héllo\"; x</code> places <code>x</code> one byte further right than its character index. Convert with <code>len(line.encode()[:col].decode())</code> when reporting columns to an editor, or use <code>ast.get_source_segment</code>, which handles it for you."
      ]
    },
    {
      q: "What does fix_missing_locations actually do?",
      a: [
        "It walks the tree recursively and, for each node that should have position attributes but lacks them, copies <code>lineno</code>, <code>col_offset</code>, <code>end_lineno</code> and <code>end_col_offset</code> from the parent (starting at line 1, column 0). It does not compute real positions for generated code; it just makes the tree valid for <code>compile()</code>. Tracebacks from generated nodes will therefore point at the parent's line, which is usually what you want."
      ]
    },
    {
      q: "When should I use symtable instead of tracking scopes myself?",
      a: [
        "Whenever you need Python's real scoping rules: comprehensions have their own scope, class bodies do not enclose methods, <code>nonlocal</code> and <code>global</code> change binding, and closures create cell and free variables. <code>symtable.symtable(src, 'file.py', 'exec')</code> returns a tree of tables; <code>sym.is_local()</code>, <code>is_global()</code>, <code>is_free()</code>, <code>is_parameter()</code>, <code>is_referenced()</code> and <code>is_assigned()</code> answer the questions an unused-variable or shadowing rule needs, computed by the same code the compiler uses."
      ]
    }
  ],
  code: {
    title: "A four-rule linter plus an auto-fixer",
    intro: "Runs on Python 3.9+. The linter reports B006, E722, E711 and F401; the fixer rewrites <code>== None</code> to <code>is None</code> and folds constant arithmetic, then the rewritten tree is unparsed and executed.",
    code: String.raw`"""A small linter + auto-fixer built on Python's ast module (Python 3.9+)."""
import ast

SOURCE = '''
import os, json

def load(path, cache={}):
    try:
        data = json.load(open(path))
    except:
        data = None
    if data == None:
        return cache
    return {**cache, **data}

SIZE = 60 * 60 * 24
'''

class Linter(ast.NodeVisitor):
    def __init__(self):
        self.problems = []
        self.imported = {}            # name -> import node
        self.used = set()

    def report(self, node, code, msg):
        self.problems.append((node.lineno, node.col_offset, code, msg))

    def visit_FunctionDef(self, node):
        for default in node.args.defaults + node.args.kw_defaults:
            if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                self.report(default, "B006", f"mutable default argument in {node.name}()")
        self.generic_visit(node)       # keep walking into the body!

    visit_AsyncFunctionDef = visit_FunctionDef

    def visit_ExceptHandler(self, node):
        if node.type is None:
            self.report(node, "E722", "bare except: also catches KeyboardInterrupt/SystemExit")
        self.generic_visit(node)

    def visit_Compare(self, node):
        for op, right in zip(node.ops, node.comparators):
            if isinstance(op, (ast.Eq, ast.NotEq)) and isinstance(right, ast.Constant) and right.value is None:
                self.report(node, "E711", "comparison to None should use 'is' / 'is not'")
        self.generic_visit(node)

    def visit_Import(self, node):
        for alias in node.names:
            self.imported[(alias.asname or alias.name).split(".")[0]] = node
        self.generic_visit(node)

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Load):
            self.used.add(node.id)

    def finish(self):
        for name, node in self.imported.items():
            if name not in self.used:
                self.report(node, "F401", f"'{name}' imported but unused")
        return sorted(self.problems)


class Fixer(ast.NodeTransformer):
    """Rewrites x == None -> x is None and folds constant arithmetic."""

    def visit_Compare(self, node):
        self.generic_visit(node)
        node.ops = [ast.Is() if isinstance(op, ast.Eq) and isinstance(r, ast.Constant) and r.value is None
                    else ast.IsNot() if isinstance(op, ast.NotEq) and isinstance(r, ast.Constant) and r.value is None
                    else op
                    for op, r in zip(node.ops, node.comparators)]
        return node

    def visit_BinOp(self, node):
        self.generic_visit(node)       # fold children first (post-order)
        if isinstance(node.left, ast.Constant) and isinstance(node.right, ast.Constant):
            try:
                value = eval(compile(ast.Expression(node), "<fold>", "eval"))
            except Exception:
                return node
            return ast.copy_location(ast.Constant(value), node)
        return node


tree = ast.parse(SOURCE)
linter = Linter()
linter.visit(tree)
for line, col, code, msg in linter.finish():
    print(f"<src>:{line}:{col}: {code} {msg}")

fixed = ast.fix_missing_locations(Fixer().visit(tree))
print(ast.unparse(fixed))
ns = {}
exec(compile(fixed, "<fixed>", "exec"), ns)
print("SIZE =", ns["SIZE"])

# Output:
# <src>:2:0: F401 'os' imported but unused
# <src>:4:21: B006 mutable default argument in load()
# <src>:7:4: E722 bare except: also catches KeyboardInterrupt/SystemExit
# <src>:9:7: E711 comparison to None should use 'is' / 'is not'
# import os, json
#
# def load(path, cache={}):
#     ...
#     if data is None:
#         return cache
#     return {**cache, **data}
# SIZE = 86400
# SIZE = 86400`,
    notes: [
      "<code>kw_defaults</code> contains <code>None</code> for keyword-only parameters without defaults; <code>isinstance(None, ...)</code> is simply False, so the loop is safe.",
      "The F401 rule is deliberately naive: it ignores <code>__all__</code>, string annotations and re-exports in <code>__init__.py</code>. Real tools (Pyflakes, Ruff) handle these and use proper scope analysis.",
      "Folding with <code>eval</code> is fine for a demo. A production folder must bound result sizes (<code>2 ** 10**9</code>) and must not fold operations that raise, such as <code>1 / 0</code> (the <code>except</code> keeps those unfolded).",
      "Compare with <code>ruff check --select B006,E722,E711,F401 file.py</code>: same codes, same positions."
    ]
  },
  lab: {
    title: "A test-smell linter for pytest files",
    prompt: "Write <code>TestSmellVisitor(ast.NodeVisitor)</code> that reports three smells common in flaky or useless tests: (1) <code>assert (cond, \"msg\")</code>, an assert on a non-empty tuple that is always true (<code>visit_Assert</code>, check <code>isinstance(node.test, ast.Tuple)</code>); (2) a bare <code>except:</code> (<code>visit_ExceptHandler</code>, <code>node.type is None</code>); (3) a call to <code>time.sleep</code> (<code>visit_Call</code>, an <code>ast.Attribute</code> with <code>attr == \"sleep\"</code> on <code>Name(\"time\")</code>). Each visit method must call <code>generic_visit</code>. Add a <code>lint(path)</code> function using <code>ast.parse(..., filename=path)</code> that prints <code>path:line: message</code>, and exit with status 1 if anything was found.",
    starter: String.raw`import ast
import sys

class TestSmellVisitor(ast.NodeVisitor):
    def __init__(self, filename):
        self.filename = filename
        self.findings = []

    # TODO: visit_Assert, visit_ExceptHandler, visit_Call

def lint(path):
    # TODO: parse the file, run the visitor, print findings, return how many
    return 0

if __name__ == "__main__":
    sys.exit(1 if sum(lint(p) for p in sys.argv[1:]) else 0)
`,
    checks: [
      { re: 'class\\s+\\w+\\s*\\(\\s*ast\\.NodeVisitor\\s*\\)', flags: '', must: true, hint: "Subclass ast.NodeVisitor.", pass: "NodeVisitor subclass ✓" },
      { re: 'def\\s+visit_Assert\\s*\\(', flags: '', must: true, hint: "Add visit_Assert(self, node).", pass: "visit_Assert ✓" },
      { re: 'isinstance\\(\\s*node\\.test\\s*,\\s*ast\\.Tuple\\s*\\)', flags: '', must: true, hint: "Check isinstance(node.test, ast.Tuple).", pass: "Tuple-assert check ✓" },
      { re: 'def\\s+visit_ExceptHandler[\\s\\S]*node\\.type\\s+is\\s+None', flags: '', must: true, hint: "In visit_ExceptHandler, a bare except has node.type is None.", pass: "Bare-except check ✓" },
      { re: 'def\\s+visit_Call[\\s\\S]*attr\\s*==\\s*"sleep"', flags: '', must: true, hint: "In visit_Call, match an ast.Attribute whose attr == \"sleep\".", pass: "time.sleep check ✓" },
      { re: '(self\\.generic_visit\\(node\\)[\\s\\S]*){3}', flags: '', must: true, hint: "Call self.generic_visit(node) in each of the three visit methods so nested code is still checked.", pass: "generic_visit in every rule ✓" },
      { re: 'ast\\.parse\\([\\s\\S]*filename\\s*=\\s*path', flags: '', must: true, hint: "Pass filename=path to ast.parse so syntax errors name the file.", pass: "ast.parse with filename ✓" },
      { re: 'import\\s+re\\b', flags: '', must: false, hint: "No regex matching on source text; work on the tree.", pass: "Tree-based, not regex-based ✓" }
    ],
    run: "Create <code>sample_test.py</code>:<pre><code>import time\n\ndef test_upload():\n    time.sleep(2)\n    assert (1 == 2, \"should never pass\")\n    try:\n        int(\"x\")\n    except:\n        pass</code></pre>Run <code>python3 smells.py sample_test.py; echo $?</code>. Expected: <code>sample_test.py:4: time.sleep in test (flaky wait)</code>, <code>sample_test.py:5: always-true assert on a tuple</code>, <code>sample_test.py:8: bare except hides failures</code>, exit status <code>1</code>. Then point it at a real test suite: <code>python3 smells.py $(git ls-files 'tests/*.py')</code>.",
    solution: String.raw`import ast
import sys

class TestSmellVisitor(ast.NodeVisitor):
    def __init__(self, filename):
        self.filename = filename
        self.findings = []

    def visit_Assert(self, node):
        # assert (cond, "msg") tests a non-empty tuple, which is always true
        if isinstance(node.test, ast.Tuple) and node.test.elts:
            self.findings.append((node.lineno, "always-true assert on a tuple"))
        self.generic_visit(node)

    def visit_ExceptHandler(self, node):
        if node.type is None:
            self.findings.append((node.lineno, "bare except hides failures"))
        self.generic_visit(node)

    def visit_Call(self, node):
        # time.sleep inside a test is a classic flakiness smell
        f = node.func
        if isinstance(f, ast.Attribute) and f.attr == "sleep" and isinstance(f.value, ast.Name) and f.value.id == "time":
            self.findings.append((node.lineno, "time.sleep in test (flaky wait)"))
        self.generic_visit(node)

def lint(path):
    with open(path) as fh:
        tree = ast.parse(fh.read(), filename=path)
    v = TestSmellVisitor(path)
    v.visit(tree)
    for line, msg in sorted(v.findings):
        print(path + ":" + str(line) + ": " + msg)
    return len(v.findings)

if __name__ == "__main__":
    sys.exit(1 if sum(lint(p) for p in sys.argv[1:]) else 0)
`,
    notes: [
      "The sleep rule misses <code>from time import sleep; sleep(2)</code> and <code>import time as t</code>. Fixing that needs a small import table (map local names to qualified names from <code>Import</code>/<code>ImportFrom</code> nodes), which is the first step toward name resolution.",
      "CPython itself emits <code>SyntaxWarning: assertion is always true</code> for tuple asserts when compiling, but only if warnings are shown; <code>ast.parse</code> alone does not compile and does not warn.",
      "This is the same structure as research test-smell detectors (e.g. tsDetect for Java): one visitor, a handful of node-type rules, and reports keyed by file and line."
    ]
  },
  quiz: [
    {
      q: "You wrote <code>visit_FunctionDef</code> to check every function, but nested functions are never reported. Why?",
      options: ["NodeVisitor does not support nested functions", "visit_FunctionDef does not call self.generic_visit(node), so the walk stops at the outer function", "ast.parse drops nested functions", "You need visit_Lambda"],
      correct: 1,
      explain: "Defining visit_X replaces the default recursion for that node type. Call generic_visit to keep descending."
    },
    {
      q: "What does <code>ast.unparse(ast.parse(src))</code> lose compared to <code>src</code>?",
      options: ["Nothing; it is an exact round trip", "Comments and original formatting (quotes, spacing, redundant parentheses)", "All string literals", "Function names"],
      correct: 1,
      explain: "Comments never reach the AST and formatting is regenerated. Use LibCST or span-based text edits to preserve them."
    },
    {
      q: "After a NodeTransformer inserts a new <code>ast.Call</code>, <code>compile()</code> raises <code>TypeError: required field \"lineno\" missing</code>. The fix?",
      options: ["Use exec instead of compile", "Call ast.fix_missing_locations(tree) or ast.copy_location(new, old)", "Set mode='eval'", "Call ast.literal_eval"],
      correct: 1,
      explain: "New nodes have no positions; these helpers fill them from the replaced node or parent."
    },
    {
      q: "In <code>x = y</code>, which ctx values do the two Name nodes have?",
      options: ["Both Load", "x is Store, y is Load", "x is Load, y is Store", "Both Store"],
      correct: 1,
      explain: "Assignment targets are Store; read operands are Load. This is a cheap def/use signal for analyses."
    },
    {
      q: "Your rule should flag <code>.append</code> on lists only. Why can a pure ast rule not do this reliably?",
      options: ["ast does not have Attribute nodes", "The AST carries no type information; any object with an append method looks the same", "append is a keyword", "ast.walk skips method calls"],
      correct: 1,
      explain: "Types require inference (astroid in Pylint) or a type checker (mypy/pyright plugins)."
    }
  ],
  testFlow: {
    title: "Choose the right Python tool",
    start: "q1",
    nodes: {
      q1: { q: "You must rename a function across 500 files and keep every comment and blank line. Tool?", choices: [ { text: "ast.NodeTransformer + ast.unparse", to: "q1bad" }, { text: "LibCST (or span-based edits from ast positions)", to: "q1ok" } ] },
      q1bad: { end: true, correct: false, text: "ast.unparse regenerates the whole file and drops every comment. Reviewers will reject the diff.", retry: "q1" },
      q1ok: { end: true, correct: true, text: "Right. LibCST is a lossless concrete syntax tree; span edits keep untouched text byte for byte.", next: "q2" },
      q2: { q: "You want to know whether a name inside a nested function refers to a local, an enclosing variable or a global. Tool?", choices: [ { text: "symtable", to: "q2ok" }, { text: "Count Name nodes with ast.walk", to: "q2bad" } ] },
      q2ok: { end: true, correct: true, text: "Correct. symtable exposes CPython's own scope analysis (is_local, is_free, is_global).", next: "q3" },
      q2bad: { end: true, correct: false, text: "ast.walk has no scope context; you would be reimplementing (and likely getting wrong) Python's scoping rules.", retry: "q2" },
      q3: { q: "You want to add timing instrumentation to every function at import time, no source changes. Approach?", choices: [ { text: "An import hook that parses, transforms the AST (wrap bodies), and compiles the tree", to: "q3ok" }, { text: "Regex replacement of 'def ' in the source", to: "q3bad" } ] },
      q3ok: { end: true, correct: true, text: "That is exactly pytest's assertion-rewriting architecture." },
      q3bad: { end: true, correct: false, text: "Regexes break on strings, decorators, nested defs and multi-line signatures. Transform the tree.", retry: "q3" }
    }
  },
  pitfalls: [
    "Forgetting <code>self.generic_visit(node)</code> in a <code>visit_X</code> method: whole subtrees are silently skipped and the rule looks like it works on small tests.",
    "Using <code>ast.unparse</code> for codemods on real repositories: every comment disappears and formatting churns. Use LibCST or edit text at node spans.",
    "Treating <code>col_offset</code> as a character index; it is a UTF-8 byte offset.",
    "Handling only <code>FunctionDef</code> and missing <code>AsyncFunctionDef</code> and <code>Lambda</code>, or only <code>Import</code> and missing <code>ImportFrom</code>.",
    "Assuming node shapes are stable across Python versions: pin the interpreter for your tool or test it on every supported version."
  ],
  interview: [
    {
      q: "Write a lint rule that flags mutable default arguments. What are the edge cases?",
      a: "Subclass <code>ast.NodeVisitor</code>, implement <code>visit_FunctionDef</code> (and alias <code>visit_AsyncFunctionDef</code>, plus <code>visit_Lambda</code>), iterate <code>node.args.defaults</code> and the non-None entries of <code>node.args.kw_defaults</code>, flag <code>List/Dict/Set</code> literals and calls to <code>list/dict/set</code> (and comprehensions), report the default's <code>lineno/col_offset</code>, then <code>generic_visit</code>. Edge cases: defaults align to the last positional params across <code>posonlyargs + args</code>; <code>None</code> placeholders in <code>kw_defaults</code>; calls to user functions returning mutable objects cannot be judged syntactically; frozen types such as <code>tuple()</code> or <code>frozenset()</code> are fine."
    },
    {
      q: "How does pytest show you the values inside a failing assert?",
      a: "An import hook intercepts test modules, parses them, and a NodeTransformer rewrites every <code>assert</code> into code that evaluates subexpressions into temporaries and formats them into the failure message. The rewritten AST is compiled and cached as a tagged <code>.pyc</code>. It only applies to modules the hook handles (test files, conftest, registered plugins), which is why plain helper modules give bare <code>AssertionError</code>s unless registered with <code>pytest.register_assert_rewrite</code>."
    },
    {
      q: "Explain a tradeoff: ast versus LibCST versus a type checker plugin for building a Python code-quality tool.",
      a: "<code>ast</code> is in the standard library, fast, and exactly what CPython compiles, but it drops comments and formatting and has no types: perfect for read-only syntactic rules. LibCST is lossless and has scope and qualified-name metadata providers, so it is the choice for codemods that produce reviewable diffs, at the cost of a heavier tree and slower parsing. A mypy or pyright plugin sees inferred types and can implement semantic rules (\"this argument is a str, not bytes\") but ties you to that checker's internals and requires annotated code to be precise. I pick the cheapest layer that can express the rule."
    },
    {
      q: "Whiteboard: design a tool that finds flaky-test smells across 10,000 Python repositories.",
      a: "Pipeline: clone shallow, list test files by convention (<code>test_*.py</code>, <code>*_test.py</code>, <code>tests/</code>), parse each with <code>ast.parse</code> in a process pool with a timeout, catching <code>SyntaxError</code> (old Python 2 files) and recording parse failures as data, not crashes. Visitors for smells: <code>time.sleep</code>, network calls without mocks, reliance on dict/set ordering, unseeded <code>random</code>, <code>datetime.now()</code>, shared mutable module state, tuple asserts, bare except. Resolve imports per file to qualified names so aliases are caught. Output rows (repo, commit, file, line, rule) to Parquet; validate precision by sampling and manual labeling; correlate with rerun-based flakiness labels where available."
    },
    {
      q: "What is the difference between ast.walk and NodeVisitor, and when do you need NodeTransformer?",
      a: "<code>ast.walk</code> is a context-free BFS iterator: fine for counting or finding nodes. <code>NodeVisitor</code> gives type-dispatched methods and control over recursion, so you can keep context stacks (current class, current function, inside a <code>with</code>) and skip subtrees. <code>NodeTransformer</code> is a visitor whose return values replace nodes, used for rewriting; remember to fix locations and to transform children first if parents depend on them."
    },
    {
      q: "Why can static analysis of Python never be both sound and precise?",
      a: "Because of dynamic features: <code>getattr</code>/<code>setattr</code> with computed names, <code>exec</code>/<code>eval</code>, monkey-patching, metaclasses, decorators that replace functions, <code>__getattr__</code>, and imports that depend on runtime state. A sound analysis must assume almost anything can happen at those points and drowns in false positives; practical tools (Pyright, mypy, Pyre, Pysa for taint) choose to be unsound in documented ways and rely on type annotations and stubs to recover precision."
    }
  ]
};
