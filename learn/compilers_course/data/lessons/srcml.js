window.LESSONS = window.LESSONS || {};
window.LESSONS['srcml'] = {
  id: 'srcml',
  title: "srcML: Source Code as XML, XPath Queries & Round-Tripping",
  category: "Part 1 — Working With ASTs",
  timeMin: 40,
  summary: "srcML wraps source code in XML elements without changing a single character of it: strip the tags and you get the original file back, byte for byte. That one property makes it a convenient pre-processing step for analysis: convert a whole repository into one srcML archive, query it with XPath (<code>--xpath \"//src:function/src:name\"</code>), transform it with XSLT or Python <code>lxml</code>, and convert back to source. This lesson is hands-on: every command and output below was run with srcML 1.2.0. You will learn the CLI in both directions, the <code>src</code> namespace, archives with many units, positions, XPath markup, and how to write analyses over srcML in Python, plus the main caveat: srcML is syntactic only, with no name resolution.",
  goals: [
    "Convert files, directories and strings to srcML and back with the <code>srcml</code> CLI, and verify a lossless round trip",
    "Read srcML markup for Java, C++ and Python (<code>function</code>, <code>decl_stmt</code>, <code>call</code>, <code>if_stmt</code>, <code>catch</code>...) and use the <code>src</code> namespace in XPath",
    "Query with <code>srcml --xpath</code>: element results, counts, strings, source output (<code>-S</code>), and in-place markup with <code>--element</code>/<code>--attribute</code>",
    "Work with srcML archives: <code>--list</code>, <code>--unit N</code>, <code>--to-dir</code>, <code>--position</code>",
    "Write analyses and transformations over srcML in Python with <code>lxml</code>, and explain what srcML cannot know"
  ],
  concept: [
    {
      h: "The idea: markup, not a separate tree",
      p: [
        "A normal AST is a new data structure; to get source back you need a pretty printer. srcML instead <b>marks up</b> the original text: every character of the file stays in the XML as text content, including whitespace, comments and preprocessor lines, and elements are wrapped around the syntactic units. Concatenating all text nodes (XPath <code>string(/)</code>, Python <code>''.join(el.itertext())</code>) gives the exact source. That is why srcML is described as lossless and why round-tripping is trivial.",
        "The default namespace is <code>http://www.srcML.org/srcML/src</code>, conventionally bound to the prefix <code>src</code> in queries. Other namespaces appear on demand: <code>pos</code> (<code>http://www.srcML.org/srcML/position</code>) for <code>--position</code> line/column attributes, and <code>cpp</code> for C/C++ preprocessor markup. Each file becomes a <code>&lt;unit&gt;</code> with <code>language</code>, <code>filename</code> and <code>revision</code> attributes; many files become an <b>archive</b>, an outer <code>&lt;unit&gt;</code> containing one inner unit per file.",
        "srcML parses with its own island-grammar-style parser, so it does not need the code to compile, does not need headers or dependencies, and tolerates incomplete code. Version 1.2.0 (tested here) lists markup for C, C++, C#, Java, Python, JavaScript, CMake and Objective-C (<code>srcml --version</code>); older 1.0.x releases supported fewer languages."
      ],
      code: String.raw`$ srcml Calc.java -o Calc.xml
$ head -c 600 Calc.xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<unit xmlns="http://www.srcML.org/srcML/src" revision="1.0.0" language="Java" filename="Calc.java"><package>package <name>demo</name>;</package>

<import>import <name><name>java</name><operator>.</operator><name>util</name><operator>.</operator><name>List</name></name>;</import>
...
    <function><type><specifier>public</specifier> <name>int</name></type> <name>add</name><parameter_list>(<parameter><decl><type><name>int</name></type> <name>a</name></decl></parameter>, <parameter><decl><type><name>int</name></type> <name>b</name></decl></parameter>)</parameter_list> <block>{<block_content>
        <expr_stmt><expr><call><name><name>log</name><operator>.</operator><name>add</name></name><argument_list>(<argument><expr><name>a</name> <operator>+</operator> <name>b</name></expr></argument>)</argument_list></call></expr>;</expr_stmt>
        <return>return <expr><name>a</name> <operator>+</operator> <name>b</name></expr>;</return>
    </block_content>}</block></function>`
    },
    {
      h: "The CLI in both directions",
      p: [
        "One executable does everything; the direction is inferred from the input. Source in (file, directory, archive such as <code>.tar.gz</code>/<code>.zip</code>, <code>--text</code> string, or stdin with <code>-l LANG</code>) produces srcML; srcML in produces source. The language comes from the extension; override with <code>-l Java</code> or <code>--register-ext h=C++</code>.",
        "<ul><li><code>srcml Calc.java -o Calc.xml</code>: one file to one unit.</li><li><code>srcml Calc.xml -o Calc.round.java</code>: back to source (or to stdout without <code>-o</code>).</li><li><code>srcml src/ -o project.xml</code>: a directory becomes an archive (<code>-r/--archive</code> forces archive form for a single file).</li><li><code>srcml --text 'int f(int x) { return x; }' -l C++</code>: quick experiments.</li><li><code>echo 'int g(){return 2;}' | srcml -l C++</code>: stdin.</li><li><code>srcml --list project.xml</code>, <code>--show-unit-count</code>, <code>--show-language</code>, <code>-i/--info</code>: inspect archives.</li><li><code>srcml --unit 2 project.xml</code>: source of the second unit; add <code>-X</code> (<code>--output-srcml</code>) to get its XML instead.</li><li><code>srcml --to-dir out project.xml</code>: extract every unit back to files under <code>out/</code>.</li><li><code>srcml --position file.java</code>: add <code>pos:start=\"line:col\"</code> and <code>pos:end</code> to every element.</li><li><code>--files-from list.txt</code>, <code>-j N</code> (parse threads), <code>--hash</code>/<code>--timestamp</code> (metadata attributes).</li></ul>"
      ],
      code: String.raw`$ srcml Calc.xml -o Calc.round.java && diff Calc.java Calc.round.java && echo ROUNDTRIP_IDENTICAL
ROUNDTRIP_IDENTICAL

$ srcml proj -o proj.xml          # proj/Calc.java and proj/a/util.py
$ srcml --list proj.xml
XML encoding: UTF-8
    1 Java    20 52e9517f3feca1034cc4d78a7ab5c901402a37b9 proj/Calc.java
    2Python     5 bd08c311ad27aedf7d7eaf5fbfe06326cc5322d2 proj/a/util.py
units: 2
LOC: 25

$ srcml --unit 2 proj.xml
def f(x):
    try:
        return 1/x
    except ZeroDivisionError:
        pass

$ srcml --to-dir out proj.xml && find out -type f
out/proj/Calc.java
out/proj/a/util.py

$ srcml --position --text 'int x = 1;' -l Java
<unit xmlns="http://www.srcML.org/srcML/src" xmlns:pos="http://www.srcML.org/srcML/position" revision="1.0.0" language="Java" pos:tabs="8"><decl_stmt pos:start="1:1" pos:end="1:10"><decl pos:start="1:1" pos:end="1:9"><type pos:start="1:1" pos:end="1:3"><name pos:start="1:1" pos:end="1:3">int</name></type> <name pos:start="1:5" pos:end="1:5">x</name> ...`
    },
    {
      h: "Reading the markup",
      p: [
        "Element names follow syntactic categories and are shared across languages where possible, which is what makes cross-language queries work: <code>function</code> (with body) vs <code>function_decl</code> (prototype), <code>class</code>, <code>decl_stmt</code> &gt; <code>decl</code> &gt; <code>type</code> + <code>name</code> + <code>init</code>, <code>expr_stmt</code> &gt; <code>expr</code>, <code>call</code> &gt; <code>name</code> + <code>argument_list</code>, <code>operator</code>, <code>literal type=\"number|string|char|boolean|null\"</code>, <code>block</code> &gt; <code>block_content</code>, <code>return</code>, <code>try</code>/<code>catch</code>/<code>finally</code>, <code>for</code>/<code>while</code>/<code>do</code>, <code>switch</code>/<code>case</code>/<code>default</code>, <code>comment type=\"line|block\"</code>.",
        "Conditionals are wrapped: <code>&lt;if_stmt&gt;&lt;if&gt;...&lt;/if&gt; &lt;if type=\"elseif\"&gt;else if ...&lt;/if&gt; &lt;else&gt;...&lt;/else&gt;&lt;/if_stmt&gt;</code>. An unbraced body is marked <code>&lt;block type=\"pseudo\"&gt;</code>. Qualified names are nested <code>name</code> elements with <code>operator</code> separators: <code>&lt;name&gt;&lt;name&gt;log&lt;/name&gt;&lt;operator&gt;.&lt;/operator&gt;&lt;name&gt;add&lt;/name&gt;&lt;/name&gt;</code>, so <code>//src:call/src:name</code> gives the full callee expression and <code>//src:call/src:name/src:name[last()]</code> the method name.",
        "Python looks the same where it can: a <code>def</code> is a <code>function</code>, <code>except</code> is a <code>catch</code>, <code>pass</code> is <code>&lt;pass&gt;</code>, and the block includes the colon."
      ],
      code: String.raw`$ srcml proj/a/util.py
<unit xmlns="http://www.srcML.org/srcML/src" revision="1.0.0" language="Python" filename="proj/a/util.py"><function>def <name>f</name><parameter_list>(<parameter><name>x</name></parameter>)</parameter_list><block>:<block_content>
    <try>try<block>:<block_content>
        <return>return <expr><literal type="number">1</literal><operator>/</operator><name>x</name></expr></return>
</block_content></block>    <catch>except <expr><name>ZeroDivisionError</name></expr><block>:<block_content>
        <pass>pass</pass>
</block_content></block></catch></try></block_content></block></function></unit>`
    },
    {
      h: "Querying with --xpath",
      p: [
        "<code>srcml --xpath EXPR file.xml</code> applies the XPath 1.0 expression to <b>each unit</b> and returns results as an archive whose inner units each hold one result (with <code>filename</code> and <code>item</code> attributes telling you where it came from). The <code>src</code> prefix is predeclared; every element step needs it (<code>//function</code> without the prefix matches nothing, because the elements are in the srcML namespace).",
        "Scalar expressions (<code>count()</code>, <code>string()</code>, <code>sum()</code>) print plain values per unit. Add <code>-S</code> (<code>--output-src</code>) to get the matched code as text. You can pass source files directly to <code>--xpath</code>; srcML converts them first.",
        "Instead of extracting results you can mark them in place: <code>--element PRE:NAME</code> wraps each result in a new element and <code>--attribute PRE:NAME=\"VALUE\"</code> adds an attribute, after declaring the prefix with <code>--xmlns:PRE=URI</code>. The output is the full srcML with your markers, which a later stage (XSLT, Python, or a second XPath) can use, a simple way to chain analyses. srcML 1.2 also has <code>--srcql</code>, a pattern language written like code with logical variables (<code>'FIND $T $V = $E;'</code>), and <code>--xslt</code>/<code>--relaxng</code> for transformation and validation."
      ],
      code: String.raw`$ srcml --xpath "//src:function/src:name" Calc.xml
<unit xmlns="http://www.srcML.org/srcML/src" revision="1.0.0">
<unit revision="1.0.0" language="Java" filename="Calc.java" item="1"><name>add</name></unit>
<unit revision="1.0.0" language="Java" filename="Calc.java" item="2"><name>reset</name></unit>
</unit>

$ srcml --xpath "//src:function/src:name" -S Calc.xml
add
reset

$ srcml --xpath "count(//src:function)" Calc.xml
2

$ srcml --xpath "string(//src:function[1]/src:name)" Calc.xml
add

$ srcml --xpath "//src:function[src:name='add']//src:return" -S Calc.xml
return a + b;

# empty catch blocks: a catch whose block_content has no child elements
$ srcml --xpath "//src:catch[src:block/src:block_content[not(*)]]" -S Calc.xml
catch (Exception e) {
        }

# callee expressions across a mixed Java + Python archive
$ srcml --xpath "//src:call/src:name" -S proj.xml
ArrayList<>
log.add
log.clear

# mark results in place instead of extracting them
$ srcml --xpath "//src:catch" --xmlns:smell=http://example.org/smell --element smell:hit Calc.xml | grep -o '<smell:hit><catch>catch'
<smell:hit><catch>catch`
    },
    {
      h: "srcML as a pre-processing step, and querying it from Python",
      p: [
        "The common research pattern: run <code>srcml</code> once over a repository or every revision of it (it is fast and needs no build), store the archive, then run many analyses against the XML with any XML toolchain. Because results carry <code>filename</code> and, with <code>--position</code>, line/column, they map straight back to source. Tools such as srcSlice (slicing), srcType and stereocode (method stereotypes) are built this way.",
        "From Python, <code>lxml</code> is the natural client: <code>etree.fromstring(subprocess.run(['srcml', '--position', path], capture_output=True, check=True).stdout)</code>, then <code>el.xpath('.//src:function', namespaces=NS)</code> with <code>NS = {'src': 'http://www.srcML.org/srcML/src', 'pos': 'http://www.srcML.org/srcML/position'}</code>. Python's <code>xml.etree.ElementTree</code> works for simple paths but supports only a small XPath subset (no <code>count()</code>, no <code>ancestor::</code>), so prefer lxml.",
        "To transform, edit the tree (change text, insert elements carrying text) and convert back with <code>srcml modified.xml</code>. Since output is just the concatenated text, any text you put into elements appears in the source; any element you delete takes its text with it. Keep the <code>&lt;unit&gt;</code> wrapper and namespace intact so srcML recognizes the file."
      ]
    },
    {
      h: "What srcML does not know",
      p: [
        "srcML is a syntactic, document-oriented representation. There is no symbol table: a <code>name</code> element is just text. Calls are not resolved to declarations, types are not computed, overloads are not distinguished, and C/C++ macros are marked up but not expanded (unless you preprocess first). The parser also makes heuristic choices for ambiguous constructs (in C++, whether <code>a * b;</code> is a declaration or an expression), which are usually right but not guaranteed.",
        "The rename experiment below shows the consequence: renaming the method <code>add</code> by matching names also renamed <code>log.add</code>, which is <code>java.util.List.add</code>. For anything that depends on what a name refers to, use a resolving front end (JDT, JavaParser with symbol solver, javac, Soot), or use srcML for candidate selection and confirm with a semantic tool."
      ],
      code: String.raw`# rename.py: naive rename over srcML, then round-trip back to source
import subprocess, sys
from lxml import etree
NS = {"src": "http://www.srcML.org/srcML/src"}
old, new, path = sys.argv[1], sys.argv[2], sys.argv[3]
root = etree.fromstring(subprocess.run(["srcml", path], check=True, capture_output=True).stdout)
for n in root.xpath(f"//src:function/src:name[.='{old}'] | //src:call/src:name[.='{old}']"
                    f" | //src:call/src:name/src:name[last()][.='{old}']", namespaces=NS):
    n.text = new
open("renamed.xml", "wb").write(etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True))
print(subprocess.run(["srcml", "renamed.xml"], check=True, capture_output=True, text=True).stdout)

$ python3 rename.py add plus Calc.java
...
    public int plus(int a, int b) {
        log.plus(a + b);          <- wrong: this was java.util.List.add
        return a + b;
    }`
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: "Using srcML at repository scale, and the details that bite when you go beyond single-file demos.",
    sections: [
      {
        h: "Whole-history pipelines",
        p: [
          "A typical mining pipeline converts selected revisions without checking them out: <code>git archive --format=tar.gz -o rev.tar.gz COMMIT</code> then <code>srcml rev.tar.gz -o rev.xml</code> (tar, cpio and zip input is read directly; units keep their paths inside the archive). Alternatively, check out a worktree and run <code>srcml worktree/ -o rev.xml -j 8</code>. For differences between versions, the srcML project also provides srcDiff, which produces one XML document for two versions with insert/delete markup.",
          "Store archives compressed: <code>srcml proj -o rev.xml.gz</code> writes gzip directly (checked with 1.2.0), and srcml reads <code>.xml.gz</code> back. Parse with lxml's iterparse over <code>unit</code> elements for multi-gigabyte archives so you do not hold the whole document in memory, clearing each unit after processing."
        ]
      },
      {
        h: "XPath patterns worth memorizing",
        p: [
          "<ul><li>Functions with more than 3 parameters: <code>//src:function[count(src:parameter_list/src:parameter) &gt; 3]/src:name</code></li><li>Methods of a specific class: <code>//src:class[src:name='Calc']//src:function/src:name</code></li><li>Calls to a method named <code>sleep</code> on anything: <code>//src:call[src:name/src:name[last()]='sleep']</code></li><li>Catch clauses that only print: <code>//src:catch[count(src:block/src:block_content/*)=1 and .//src:call/src:name/src:name[last()]='printStackTrace']</code></li><li>Test methods (JUnit): <code>//src:function[src:annotation/src:name='Test']</code></li><li>Enclosing unit of a result: <code>ancestor::src:unit[@filename][1]/@filename</code></li><li>Line of a result with <code>--position</code>: <code>substring-before(@pos:start, ':')</code></li></ul>",
          "Use <code>-S</code> to sanity-check that a query selects what you think before you build analysis on it."
        ]
      },
      {
        h: "XSLT and the srcML libraries",
        p: [
          "<code>srcml --xslt rewrite.xsl in.xml -o out.xml</code> applies a stylesheet per unit; with an identity transform plus a few templates, you can implement systematic edits (insert logging calls, rename a known API) and convert back. libsrcml is the C library behind the CLI (<code>srcml_archive_*</code>, <code>srcml_unit_*</code>, <code>srcml_append_transform_xpath</code>), available for embedding with bindings in some languages; the CLI plus lxml covers most research use."
        ]
      },
      {
        h: "srcML vs tree-sitter vs a compiler front end",
        p: [
          "srcML and tree-sitter are both tolerant, syntax-only and fast. srcML's advantages: one uniform, documented XML vocabulary across languages, lossless round trip without any printer, and the entire XML ecosystem (XPath, XSLT, XQuery, RelaxNG, any language's XML library) for free. tree-sitter's advantages: many more languages, incremental parsing, an embeddable library with a compact query language, and wide adoption in editors. Neither replaces a compiler front end when you need types; pick srcML when queries and transformations are naturally expressed over a document, especially in multi-language C/C++/Java/C# code bases."
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: "Robin Annotates the Poneglyph Instead of Copying It",
      text: [
        "Most scholars copy a Poneglyph into their own notation, and the copy never exactly matches the stone. Robin does something different: she lays transparent sheets over the stone and draws labeled boxes around the carved text, \"name\", \"place\", \"instruction\", without altering a single carving. Lift the sheets and the original stone is untouched (lossless round trip).",
        "Because the boxes are labeled the same way on every Poneglyph, she can ask questions across all of them at once: \"show me every box labeled place inside an instruction\" (an XPath query). She can even mark findings with a red sticker on the sheet instead of copying them out (<code>--element</code>). What her boxes cannot tell her is who a name refers to: two boxes both saying \"Joy Boy\" might be different people, and when she replaced one name everywhere, she accidentally changed a different person with the same name."
      ]
    },
    sitcom: {
      show: "The Big Bang Theory",
      title: "Sheldon's Color-Coded Highlighters",
      text: [
        "Sheldon refuses to rewrite Leonard's paper. Instead he highlights it: yellow for claims, blue for citations, pink for equations. The text is exactly the same; only the highlights are new. Then he can instantly answer \"how many citations are in section 3\" by counting blue. When Leonard asks him to replace every \"Smith\" with \"Smyth\" because one citation was misspelled, Sheldon does it by searching blue highlights for \"Smith\", and also changes Leonard's acknowledgement to his colleague Bob Smith, because highlights know the category of a word, not which person it refers to."
      ]
    },
    why: "srcML is highlighting, not rewriting: tags around unchanged text give a lossless round trip and uniform queries across files and languages. The category of each piece of text is known (function, call, name), but not what a name refers to, which is exactly why a name-based rename over srcML can change the wrong method."
  },
  storyAnim: {
    h: 240,
    props: [
      { id: "src", emoji: "📄", label: "Calc.java", x: 8, y: 30 },
      { id: "xml", emoji: "🏷️", label: "Calc.xml (srcML)", x: 30, y: 30, cls: "off" },
      { id: "q", emoji: "🔎", label: "//src:function/src:name", x: 54, y: 15, cls: "off" },
      { id: "res", emoji: "📋", label: "add, reset", x: 80, y: 15, cls: "off" },
      { id: "py", emoji: "🐍", label: "lxml script", x: 54, y: 60, cls: "off" },
      { id: "back", emoji: "📄", label: "round-trip source", x: 30, y: 82, cls: "off" },
      { id: "diff", emoji: "✅", label: "diff: identical", x: 8, y: 82, cls: "off" }
    ],
    actors: [
      { id: "robin", emoji: "📚", label: "Robin", x: 18, y: 55 }
    ],
    steps: [
      { c: "Start with plain source code.", p: { src: "lit" } },
      { c: "srcml Calc.java -o Calc.xml wraps every syntactic unit in tags. Not a single character of source text changes.", a: { robin: [30, 55] }, p: { xml: "lit" } },
      { c: "srcml --xpath with the src prefix queries every unit: function names, calls, catch blocks.", a: { robin: [54, 38] }, p: { q: "lit" } },
      { c: "Results come back as an archive of matches, each tagged with its filename; -S prints just the code.", p: { res: "good" } },
      { c: "For real analyses, load the XML with lxml and use XPath with a namespace map; --position gives line numbers.", a: { robin: [54, 80] }, p: { py: "lit" } },
      { c: "srcml Calc.xml converts back: concatenating the text content reproduces the file.", a: { robin: [30, 65] }, p: { back: "lit" } },
      { c: "diff confirms the round trip is byte-for-byte identical. Edits you make to the XML text appear in the regenerated source.", p: { diff: "good" } }
    ]
  },
  conceptFlow: {
    title: "srcML as a pre-processing stage",
    intro: "Convert once, query many times, convert back. Click any box.",
    stages: [
      { label: "Input", nodes: [ { id: "files", text: "files / dir /\ntar.gz / --text" } ] },
      { label: "Convert", nodes: [ { id: "srcml", text: "srcml -o repo.xml\n(-j N, --position)" }, { id: "archive", text: "archive:\none unit per file" } ] },
      { label: "Query / transform", nodes: [ { id: "xpath", text: "--xpath\n(src: prefix)" }, { id: "mark", text: "--element /\n--attribute" }, { id: "lxml", text: "Python lxml /\nXSLT" } ] },
      { label: "Output", nodes: [ { id: "report", text: "report:\nfile + line" }, { id: "back", text: "srcml x.xml\n-> source" } ] }
    ],
    steps: [
      { active: ["files"], note: "Input can be single files, a whole directory, a compressed archive, stdin or a string with -l." },
      { active: ["srcml"], note: "Conversion needs no build, headers or classpath. --position adds pos:start/pos:end; -j parallelizes parsing." },
      { active: ["archive"], note: "Multiple files produce an archive: an outer unit with one inner unit per file, each with filename and language." },
      { active: ["xpath"], note: "XPath runs per unit; element names live in the srcML namespace, so every step needs src:." },
      { active: ["mark"], note: "Instead of extracting, wrap results in your own namespaced elements and keep the full document for later stages." },
      { active: ["lxml"], note: "Python lxml with a namespace map supports full XPath 1.0; edit text or elements to transform code." },
      { active: ["report"], note: "Map results back via the unit's filename attribute and pos:start line numbers." },
      { active: ["back"], note: "Converting srcML to source is concatenating text, so the round trip is lossless and edits are applied verbatim." }
    ]
  },
  tech: [
    {
      q: "Why do my XPath queries return nothing when I write //function?",
      a: [
        "Because srcML elements are in the default namespace <code>http://www.srcML.org/srcML/src</code>, and in XPath 1.0 an unprefixed name step means \"no namespace\". The <code>srcml</code> CLI predeclares the <code>src</code> prefix, so write <code>//src:function</code>. In lxml you must supply the mapping yourself: <code>namespaces={'src': 'http://www.srcML.org/srcML/src'}</code>. A namespace-agnostic workaround is <code>//*[local-name()='function']</code>, but it is verbose and slower."
      ]
    },
    {
      q: "How can srcML parse code that does not compile?",
      a: [
        "It does not try to check the program, only to identify syntactic units, and it does not need declarations of anything outside the file. Its parser is designed to be robust: it recognizes constructs locally, marks what it can, and leaves the rest as plain text inside the nearest enclosing element. Preprocessor directives in C/C++ are marked up as <code>cpp:</code> elements rather than executed, so files with unbalanced <code>#if</code> regions still produce output. The price is that some ambiguous constructs are resolved heuristically."
      ]
    },
    {
      q: "Is converting srcML back to source just stripping tags? What about entities?",
      a: [
        "Yes, conceptually it is the document's text content. XML-special characters in code are escaped in the srcML (<code>&lt;</code> as <code>&amp;lt;</code>, <code>&amp;</code> as <code>&amp;amp;</code>) and unescaped on the way back, which any XML library also does. When you edit with lxml, assign plain text (<code>el.text = 'a &lt; b'</code>); lxml escapes it on serialization. Do not build srcML by string concatenation, or a stray <code>&lt;</code> in code will break the XML."
      ]
    },
    {
      q: "What does the item attribute in --xpath output mean?",
      a: [
        "When an XPath returns nodes, srcML puts each result in its own unit in a result archive, copying <code>filename</code> and <code>language</code> from the unit it came from and numbering results with <code>item</code> (1, 2, ... per run). It lets you trace a result back to its file even though the result has been cut out of context. If you need the surrounding context instead (for example the enclosing function), either query for the context element, or use <code>--element</code> to mark results in place and query the marked document."
      ]
    }
  ],
  code: {
    title: "A Python analysis over srcML: functions, calls and empty catch blocks across languages",
    intro: "Tested with srcML 1.2.0 and lxml on a directory with one Java and one Python file. Run <code>python3 srcml_query.py proj</code>.",
    code: String.raw`"""Query srcML output with lxml: functions, calls, empty catch blocks."""
import subprocess
import sys
from lxml import etree

NS = {"src": "http://www.srcML.org/srcML/src",
      "pos": "http://www.srcML.org/srcML/position"}


def to_srcml(path):
    xml = subprocess.run(["srcml", "--position", path],
                         check=True, capture_output=True).stdout
    return etree.fromstring(xml)


def text_of(el):
    # srcML keeps every character of the source as text, so this is the original code.
    return "".join(el.itertext())


def line_of(el):
    return el.get("{%s}start" % NS["pos"]).split(":")[0]


root = to_srcml(sys.argv[1])
for unit in root.iter("{%s}unit" % NS["src"]):
    if unit.get("filename") is None:
        continue  # the outer archive wrapper
    fname = unit.get("filename")
    for fn in unit.xpath(".//src:function", namespaces=NS):
        name = fn.xpath("string(src:name)", namespaces=NS)
        params = fn.xpath("count(src:parameter_list/src:parameter)", namespaces=NS)
        calls = [text_of(c) for c in fn.xpath(".//src:call/src:name", namespaces=NS)]
        print(f"{fname}:{line_of(fn)} function {name} params={int(params)} calls={calls}")
    for cat in unit.xpath(".//src:catch", namespaces=NS):
        body = cat.xpath("src:block/src:block_content", namespaces=NS)[0]
        stmts = [c for c in body if etree.QName(c).localname != "comment"]
        only_pass = len(stmts) == 1 and etree.QName(stmts[0]).localname == "pass"
        if not stmts or only_pass:
            print(f"{fname}:{line_of(cat)} SMELL empty catch: {text_of(cat).splitlines()[0].strip()}")

# $ python3 srcml_query.py proj
# proj/Calc.java:9 function add params=2 calls=['log.add']
# proj/Calc.java:14 function reset params=0 calls=['log.clear']
# proj/Calc.java:17 SMELL empty catch: catch (Exception e) {
# proj/a/util.py:1 function f params=1 calls=[]
# proj/a/util.py:4 SMELL empty catch: except ZeroDivisionError:`,
    notes: [
      "The same XPath finds empty handlers in Java (<code>catch</code> with an empty block) and Python (<code>except</code> with only <code>pass</code>), because srcML uses one vocabulary for both. That cross-language uniformity is srcML's main selling point.",
      "A single file produces a non-archive unit (the root itself has a <code>filename</code>); a directory produces an archive. Iterating <code>root.iter('{...}unit')</code> and skipping units without <code>filename</code> handles both.",
      "Comments are kept in srcML as <code>&lt;comment&gt;</code> elements. A catch containing only a comment (\"// ignore\") is filtered here as still empty; decide whether that is the policy you want.",
      "Install srcML from the release packages at github.com/srcML/srcML/releases (deb, rpm, tar.gz, macOS, Windows); the tar.gz contains <code>bin/srcml</code> and <code>lib/libsrcml.so.1</code>, so set <code>LD_LIBRARY_PATH</code> if you do not install system-wide."
    ]
  },
  lab: {
    title: "Cyclomatic complexity per function from srcML",
    prompt: "Write <code>cc.py ARCHIVE.xml</code> that loads a srcML file (single unit or archive) with <code>lxml.etree.parse</code> and, for every <code>src:function</code>, computes an approximate McCabe complexity: 1 + the number of decision elements below it (<code>if</code>, <code>while</code>, <code>for</code>, <code>do</code>, <code>case</code>, <code>catch</code>, <code>ternary</code>, using one XPath union) + the number of <code>operator</code> elements whose text is <code>&amp;&amp;</code>, <code>||</code>, <code>and</code> or <code>or</code>. Find each function's file with <code>ancestor::src:unit[@filename][1]</code>. Print <code>complexity  filename  name</code>, highest first. Use a namespace map; do not regex the XML.",
    starter: String.raw`import sys
from lxml import etree

NS = {"src": "TODO"}

def complexity(fn):
    # TODO: 1 + decisions + boolean operators
    return 1

def main(xml_path):
    root = etree.parse(xml_path).getroot()
    # TODO: loop over every function, find its unit filename and name, print sorted rows

if __name__ == "__main__":
    main(sys.argv[1])
`,
    checks: [
      { re: '"src"\\s*:\\s*"http://www\\.srcML\\.org/srcML/src"', flags: '', must: true, hint: "Map the prefix: NS = {\"src\": \"http://www.srcML.org/srcML/src\"}.", pass: "src namespace ✓" },
      { re: 'src:if[\\s\\S]*src:while[\\s\\S]*src:for[\\s\\S]*src:case', flags: '', must: true, hint: "Count decision elements: src:if, src:while, src:for, src:do, src:case, src:catch, src:ternary.", pass: "Decision elements ✓" },
      { re: 'src:operator\\[', flags: '', must: true, hint: "Count boolean operators with a predicate on src:operator, e.g. .//src:operator[.='&&' or .='||'].", pass: "Boolean operators ✓" },
      { re: 'ancestor::src:unit\\[@filename\\]', flags: '', must: true, hint: "Find the file with ancestor::src:unit[@filename][1].", pass: "Unit filename ✓" },
      { re: 'namespaces\\s*=\\s*NS', flags: '', must: true, hint: "Pass namespaces=NS to every xpath() call.", pass: "Namespace map used ✓" },
      { re: '//src:function', flags: '', must: true, hint: "Select functions with //src:function.", pass: "Functions selected ✓" },
      { re: 'import\\s+re\\b', flags: '', must: false, hint: "Work on the XML tree, not with regexes over the text.", pass: "No regex parsing ✓" }
    ],
    run: "Create <code>Branchy.java</code> with a method <code>classify(int x, int y)</code> containing <code>if (x &gt; 0 &amp;&amp; y &gt; 0) ... else if (x &lt; 0 || y &lt; 0) ...</code>, a <code>for</code> loop with a nested <code>while</code>, and a <code>switch</code> with <code>case 1</code>, <code>case 2</code> and <code>default</code>, plus a method <code>flat()</code> with no branches. Then <code>srcml Branchy.java -o branchy.xml && python3 cc.py branchy.xml</code>. Expected: <code>9  Branchy.java  classify</code> and <code>1  Branchy.java  flat</code> (1 + if + else-if + for + while + 2 cases + &amp;&amp; + ||). Then run it on a whole project: <code>srcml src/ -o project.xml && python3 cc.py project.xml | head</code>. It works unchanged for Python files in the archive.",
    solution: String.raw`import sys
from lxml import etree

NS = {"src": "http://www.srcML.org/srcML/src"}
DECISIONS = ".//src:if | .//src:while | .//src:for | .//src:do | .//src:case | .//src:catch | .//src:ternary"

def complexity(fn):
    decisions = len(fn.xpath(DECISIONS, namespaces=NS))
    bool_ops = len(fn.xpath(".//src:operator[.='&&' or .='||' or .='and' or .='or']", namespaces=NS))
    return 1 + decisions + bool_ops

def main(xml_path):
    root = etree.parse(xml_path).getroot()
    rows = []
    for fn in root.xpath("//src:function", namespaces=NS):
        unit = fn.xpath("ancestor::src:unit[@filename][1]", namespaces=NS)[0]
        name = fn.xpath("string(src:name)", namespaces=NS)
        rows.append((complexity(fn), unit.get("filename"), name))
    for cc, fname, name in sorted(rows, reverse=True):
        print(str(cc).rjust(3) + "  " + fname + "  " + name)

if __name__ == "__main__":
    main(sys.argv[1])
`,
    notes: [
      "In srcML an <code>else if</code> is a second <code>&lt;if type=\"elseif\"&gt;</code> inside the same <code>if_stmt</code>, so counting <code>src:if</code> elements counts each branch condition once, which is what McCabe wants. <code>default</code> is a separate element and correctly not counted.",
      "Nested functions (inner <code>def</code>s in Python, local classes in Java) are counted inside their parent too. To exclude them, keep only decisions whose nearest enclosing function is <code>fn</code>: filter in Python with <code>d.xpath('ancestor::src:function[1]', namespaces=NS)[0] is fn</code>.",
      "Compare with a dedicated tool (lizard, PMD's CyclomaticComplexity) on the same files; small differences come from how each counts <code>case</code> fall-through, <code>catch</code> and ternaries."
    ]
  },
  quiz: [
    {
      q: "What does it mean that srcML is lossless?",
      options: ["It compresses code without loss", "All original text, including whitespace and comments, remains as XML text, so removing tags gives the exact original file", "It keeps type information", "It stores the AST and a pretty printer"],
      correct: 1,
      explain: "srcML is markup over the original characters; <code>srcml file.xml</code> just emits the text content."
    },
    {
      q: "Which command lists function names as plain text?",
      options: ["srcml --xpath \"//function/name\" Calc.xml", "srcml --xpath \"//src:function/src:name\" -S Calc.xml", "srcml --list Calc.xml", "srcml --unit 1 Calc.xml"],
      correct: 1,
      explain: "Element steps need the src prefix, and -S outputs the matched source text instead of srcML."
    },
    {
      q: "A directory with 300 Java files is converted with <code>srcml src/ -o p.xml</code>. How do you get the 42nd file's source back?",
      options: ["srcml --unit 42 p.xml", "srcml --xpath \"/unit[42]\" p.xml", "grep the XML", "It is impossible once in an archive"],
      correct: 0,
      explain: "--unit N extracts one unit's source; --to-dir extracts all of them."
    },
    {
      q: "Your srcML-based rename of method <code>add</code> also renamed <code>list.add(x)</code> calls. Why?",
      options: ["A bug in lxml", "srcML has no name resolution; it only knows that both are names in calls", "You forgot --position", "XPath is case-insensitive"],
      correct: 1,
      explain: "srcML is syntactic. Distinguishing which <code>add</code> a call refers to requires a resolving front end."
    },
    {
      q: "In lxml, why must you pass <code>namespaces={'src': ...}</code> to <code>xpath()</code>?",
      options: ["lxml requires it for performance", "srcML elements are in a namespace, and XPath 1.0 has no default namespace for unprefixed steps", "Because srcML uses DTDs", "Only for attributes"],
      correct: 1,
      explain: "Unprefixed steps match elements in no namespace; you need a prefix bound to the srcML URI."
    }
  ],
  testFlow: {
    title: "Using srcML well",
    start: "q1",
    nodes: {
      q1: { q: "You need the line number of every result of an XPath query. What do you add?", choices: [ { text: "--position at conversion time, then read pos:start", to: "q1ok" }, { text: "Count newlines in the -S output", to: "q1bad" } ] },
      q1ok: { end: true, correct: true, text: "Right. --position adds pos:start=\"line:col\" and pos:end to every element (namespace http://www.srcML.org/srcML/position).", next: "q2" },
      q1bad: { end: true, correct: false, text: "-S output is cut out of context, so its newlines say nothing about where it was in the file.", retry: "q1" },
      q2: { q: "You want to flag results but keep the whole document for a second analysis stage. Option?", choices: [ { text: "--xpath with --element PRE:NAME (and --xmlns:PRE=URI)", to: "q2ok" }, { text: "--xpath alone", to: "q2bad" } ] },
      q2ok: { end: true, correct: true, text: "Yes. --element wraps each result in place; the output is the complete srcML with your markers.", next: "q3" },
      q2bad: { end: true, correct: false, text: "Plain --xpath extracts results into a new archive, losing their context.", retry: "q2" },
      q3: { q: "You must find calls to a specific overload of a Java library method. Is srcML enough?", choices: [ { text: "No: use srcML to find candidates, then confirm with a resolving tool (JDT, JavaParser solver, Soot)", to: "q3ok" }, { text: "Yes: match the argument count in XPath", to: "q3bad" } ] },
      q3ok: { end: true, correct: true, text: "Correct. Overload resolution needs argument types, which srcML does not compute." },
      q3bad: { end: true, correct: false, text: "Argument count does not determine the overload (types matter), and the receiver's type is unknown to srcML.", retry: "q3" }
    }
  },
  pitfalls: [
    "Writing XPath without the <code>src:</code> prefix (<code>//function</code>) and concluding there are no functions.",
    "Treating a single-file conversion and an archive the same way: a single file's root unit has the <code>filename</code>; in an archive the root does not and each inner unit does.",
    "Using srcML results as if names were resolved: same-named methods, fields and local variables are indistinguishable without a semantic tool.",
    "Building or editing srcML as strings: unescaped <code>&lt;</code> or <code>&amp;</code> from code breaks the XML. Edit through an XML library.",
    "Forgetting that nested lambdas and inner functions sit inside their parent <code>function</code> element, so descendant queries (<code>.//</code>) count their contents twice when you also process them separately."
  ],
  interview: [
    {
      q: "What is srcML and how does it differ from an AST?",
      a: "srcML is an XML format and toolkit that marks up source code with syntactic elements while preserving all original text, so it is lossless and round-trips exactly. An AST is a separate abstract structure that drops punctuation, whitespace and comments and needs a printer to regenerate code. srcML is closer to a CST with a uniform vocabulary across C, C++, C#, Java and, in recent versions, Python and others. It is tolerant (no build, no headers), but purely syntactic: no symbol tables or types."
    },
    {
      q: "Walk me through using srcML as a pre-processing step for an empirical study of exception handling across 1,000 Java projects.",
      a: "For each project (or each sampled commit), run <code>srcml repo/ -o project.xml --position -j 8</code>, keeping the archives. Analyses are XPath queries: catch blocks (<code>//src:catch</code>), empty handlers (<code>[src:block/src:block_content[not(*)]]</code>), caught types (<code>src:parameter_list//src:type/src:name</code>), handlers that only log, <code>throws</code> clauses, try-with-resources. Load results in Python with lxml, attach <code>filename</code> and <code>pos:start</code> lines, aggregate per project. Validate by sampling results and reading them via <code>-S</code>. For questions needing types (is the caught exception checked, which library threw it), resolve a subset with JDT on buildable projects and report the coverage."
    },
    {
      q: "Explain a tradeoff: srcML versus tree-sitter for multi-language mining.",
      a: "Both are fast, tolerant and syntax-only. srcML gives a single XML vocabulary shared across its languages, exact round-tripping with no printer, and the whole XML stack (XPath, XSLT, lxml, any language), which makes cross-language queries and batch transformations easy; but it supports fewer languages and XML is verbose on disk and in memory. tree-sitter supports far more languages, is an embeddable library with incremental parsing and a compact query language, but each grammar has its own node names, so cross-language queries need per-language mapping, and writing code back means editing byte ranges yourself."
    },
    {
      q: "How do you transform code with srcML?",
      a: "Convert to srcML, change the XML (lxml edits, XSLT templates, or <code>--element</code>/<code>--attribute</code> markers consumed by a later stage), then convert back with <code>srcml modified.xml</code>. Because conversion back is concatenation of text, inserting an element whose text is new code inserts that code; deleting an element deletes its code; changing a name element's text renames it there. Keep the unit wrapper and namespace, edit through an XML library to get escaping right, and remember the transformation is syntactic, so verify semantics by compiling and testing."
    },
    {
      q: "Write an XPath over srcML that finds Java methods with more than three parameters and prints their names.",
      a: "<code>srcml --xpath \"//src:function[count(src:parameter_list/src:parameter) &gt; 3]/src:name\" -S project.xml</code>. The predicate counts direct <code>parameter</code> children of the function's own <code>parameter_list</code> (not nested lambdas), and <code>-S</code> prints the names as text. To include constructors, also query <code>//src:constructor</code>, which srcML marks separately."
    },
    {
      q: "Whiteboard: you need to rename an API method across a large mixed C++/Java codebase. Would you use srcML?",
      a: "For candidate discovery, yes: one query over all languages finds every call and declaration with that name, with file and line. For the edit itself, only where names are unambiguous: srcML cannot tell <code>a.close()</code> on the target type from <code>close()</code> on anything else. My plan: srcML to enumerate candidates, a semantic check per language (clangd or a Clang tool for C++, JDT or javac-based for Java) to keep only calls resolving to the target declaration, then apply the edits (via srcML or text spans), then build and run tests."
    }
  ]
};
