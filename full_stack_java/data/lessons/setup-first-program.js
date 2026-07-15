window.LESSONS = window.LESSONS || {};
window.LESSONS['setup-first-program'] = {
  id: 'setup-first-program',
  title: 'Setup: Install a JDK, Compile & Run, jshell, and What javac Actually Produces',
  category: 'Part 0 — Orientation & Setup',
  timeMin: 40,
  summary: 'Time to build the workshop. Install a real JDK (Temurin 21), prove it works, compile and run your first program from a bare terminal — no IDE magic hiding the mechanics — then meet jshell, the interactive playground where you\'ll test every idea in Parts 1–5 in seconds. Along the way: what JAVA_HOME and the classpath actually are, why the class name must match the file name, and a peek at your first real bytecode with javap.',
  goals: [
    'Install Temurin 21 (Mac and Linux), verify with java -version / javac -version, and explain what JAVA_HOME and PATH each do',
    'Compile with javac and run with java from a plain terminal, and explain every token of both commands',
    'Use jshell as a fast experiment loop: expressions, variables, methods, /vars, /list, /exit',
    'Explain what the classpath is and diagnose the two beginner-killing errors: "cannot find symbol" vs "ClassNotFoundException / NoClassDefFoundError"',
    'Disassemble a class with javap -c and recognize that bytecode is real, inspectable, and unmysterious'
  ],
  concept: [
    {
      h: 'Choosing and installing a JDK (there are many vendors, one upstream)',
      p: [
        'OpenJDK is the single open-source upstream where Java is actually developed; "vendors" (Eclipse Temurin, Amazon Corretto, Oracle, Microsoft…) build and support distributions of it. They are functionally interchangeable for this course. We\'ll use <b>Eclipse Temurin 21</b> — a free, no-strings LTS (long-term support) release. LTS matters: Java ships a new version every 6 months, but only LTS versions (17, 21, 25…) get years of patches, so production teams overwhelmingly sit on LTS.',
        '<b>Mac:</b> <code>brew install --cask temurin@21</code>. <b>Linux:</b> the cleanest route is SDKMAN (<code>curl -s "https://get.sdkman.io" | bash</code>, then <code>sdk install java 21-tem</code>) — SDKMAN also lets you install and switch between multiple JDKs, and later installs Maven and Gradle with one command each. <b>Verify:</b> <code>java -version</code> AND <code>javac -version</code> must both print 21.x — if <code>java</code> works but <code>javac</code> doesn\'t, you\'ve got a bare runtime on your PATH, not a JDK (last lesson\'s distinction, biting in real life within the first ten minutes).',
        '<b>JAVA_HOME</b> is just an environment variable holding the JDK\'s install directory. You never need it for <code>java</code>/<code>javac</code> themselves (PATH handles those) — but Maven, Gradle, and IDEs read JAVA_HOME to decide WHICH JDK to use, so setting it now (SDKMAN and brew both print how) prevents the classic "my terminal uses 21 but Maven uses 8" schizophrenia later.'
      ]
    },
    {
      h: 'The ceremony, decoded: your first compile and run',
      p: [
        'Create <code>Hello.java</code> containing the class from last lesson, then:',
        '<div class="math">$ javac Hello.java&nbsp;&nbsp;→&nbsp;&nbsp;produces Hello.class&nbsp;&nbsp;&nbsp;&nbsp;$ java Hello&nbsp;&nbsp;→&nbsp;&nbsp;runs it<span class="mnote">javac takes a FILE name (Hello.java); java takes a CLASS name (Hello — no .class extension!). Mixing these up is everyone\'s first error message.</span></div>',
        'Three rules that look arbitrary until you know why: (1) <b>The public class name must match the file name</b> — <code>public class Hello</code> must live in <code>Hello.java</code> — because the classloader locates classes by turning names into file paths; if they disagreed, nothing could be found. (2) <b>main must have exactly the signature</b> <code>public static void main(String[] args)</code> — the JVM looks up this precise method as the entry point; <code>static</code> because at launch no objects exist yet to call methods on. (3) <b>Run with <code>java Hello</code>, not <code>java Hello.class</code></b> — you\'re naming a class for the classloader to find, not a file for the shell to open.',
        'Two conveniences to know exist: <code>java Hello.java</code> (single-file mode: compiles in memory and runs, leaving no .class behind — great for tiny scripts, useless for real multi-file projects), and IDEs (IntelliJ IDEA is the Java standard; install the free Community Edition whenever you like — but in Parts 0–2 prefer the terminal, so the mechanics stay visible while they\'re still new).'
      ]
    },
    {
      h: 'jshell: the tightest feedback loop in Java',
      p: [
        'The JDK ships a REPL — <code>jshell</code> — and it will be your laboratory for the whole first half of this course. Type an expression, get the result, no class, no main, no compile step visible:',
        '<div class="math">jshell&gt; 3 * 7&nbsp;&nbsp;→&nbsp;&nbsp;$1 ==&gt; 21&nbsp;&nbsp;&nbsp;&nbsp;jshell&gt; "log".repeat(3)&nbsp;&nbsp;→&nbsp;&nbsp;"logloglog"<span class="mnote">jshell wraps your snippets in a hidden class and compiles them for real behind the scenes — same javac, same JVM, zero ceremony.</span></div>',
        'The commands worth knowing on day one: <code>/vars</code> (list your variables), <code>/methods</code>, <code>/list</code> (everything you\'ve typed), <code>/reset</code> (clean slate), <code>/exit</code>. Every "what happens if…?" moment in Parts 1–5 — does integer division truncate? what does <code>"a" + 1 + 2</code> print? is <code>Integer == Integer</code> true at 127 but false at 128? (spoiler: yes, and the reason is a Part 1 highlight) — deserves ten seconds in jshell rather than a web search. Building that reflex now is the single highest-value habit this lesson can give you.'
      ]
    },
    {
      h: 'The classpath: where the JVM (and javac) look for classes',
      p: [
        'When your code mentions a class, two different tools need to find it at two different times: <b>javac</b> at compile time (to check the class exists and what methods it has) and <b>the JVM</b> at run time (to load its bytecode). Both search the same thing: the <b>classpath</b> — an ordered list of directories and .jar files, defaulting to just the current directory (<code>.</code>).',
        'That default is why today\'s workflow "just works": Hello.class lands in the current directory, and <code>java Hello</code> finds it there. The moment code spans multiple directories or uses a library jar, you pass the list explicitly: <code>java -cp out:lib/gson.jar Hello</code> (colons separate entries on Mac/Linux). A <b>.jar</b> file, demystified: a plain zip archive of .class files plus a manifest — libraries are just zips of other people\'s bytecode.',
        'Learn to read the two failure smells now, because they look similar and are opposites: <b>"cannot find symbol" from javac</b> = compile-time, the COMPILER can\'t find a name (typo, missing import, class not on the compile classpath). <b>ClassNotFoundException / NoClassDefFoundError from the JVM</b> = run-time, the class compiled fine but its bytecode isn\'t on the runtime classpath (you moved a file, forgot a jar, or ran from the wrong directory). Compile-time vs run-time is THE recurring axis in Java — it started in last lesson\'s pipeline and it will still be paying rent in Part 8 when Hibernate generates classes at runtime. From Part 6 onward, Maven assembles the classpath for you — which is a convenience for people who understand what it\'s assembling, and pure witchcraft for people who don\'t. You\'re becoming the first kind.',
        'One more habit while everything is fresh: run <code>javap -c Hello</code> once. It prints the actual bytecode instructions inside your .class file — <code>getstatic</code>, <code>invokevirtual</code>, a constant pool. You don\'t need to read it fluently (Part 2 returns properly); you need the demystification: bytecode is not magic vapor, it\'s a short list of instructions sitting in a file you just made, one command away from inspection.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Mise en place on the Going Merry: Sanji won\'t cook in a broken kitchen',
      text: 'Before Sanji cooks a single meal on a new ship, he does something the crew finds obsessive: he sets up the entire kitchen and TESTS it empty. He installs his knife roll (the JDK — the full toolkit, not just the eating utensils a guest would need), then runs his verification ritual: does the stove light? does EVERY burner light? (java -version AND javac -version — because a galley where the oven works but the stove doesn\'t is a trap that ruins you mid-recipe, exactly like a runtime without a compiler). He nails a sign over the counter telling every other cook where THE kitchen is — one authoritative location — so no assistant ever grabs a knife from some other half-stocked galley by mistake (JAVA_HOME: not needed when Sanji cooks alone, essential the moment Maven and the IDE start cooking in his kitchen too). Then, before any real meal, the ritual first dish: the simplest possible fried rice, start to finish (Hello, world — not because the dish matters, but because it proves the whole pipeline: pantry to pan to plate). He knows exactly where ingredients get found: the pantry shelf list posted on the door, checked twice — once when the recipe is WRITTEN against the pantry (javac consulting the compile classpath: "does this pantry even stock saffron?") and once when the dish is actually COOKED (the JVM consulting the runtime classpath: "the recipe says saffron — where IS it right now?"). Two different failures, and Sanji never confuses them: a recipe that names an ingredient the pantry list doesn\'t have gets rejected at writing time ("cannot find symbol"), while a recipe that was fine yesterday but explodes today because someone MOVED the saffron jar is a stocking failure at cooking time (ClassNotFoundException) — you fix the first by fixing the recipe, the second by fixing the pantry. And for experiments? Sanji keeps a tasting counter with single-bite portions: try a pinch of this with a drop of that, taste, adjust, ten seconds per iteration, no full dinner service required (jshell — where every "I wonder if…" gets answered before it\'s worth a real recipe). Luffy, naturally, wants to skip all of it and cook a banquet immediately. Sanji\'s answer is this whole lesson: the crew that verifies its kitchen once never debugs its kitchen during a storm.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s kitchen vs Joey\'s "kitchen"',
      text: 'Monica\'s kitchen is mise en place as a way of life: every knife sharpened and in its slot, every ingredient labeled, and — crucially — she can tell you WHERE anything is without opening a single drawer, because there is one system and everything obeys it (a clean PATH and JAVA_HOME: one authoritative answer to "which tools am I using?"). When Monica tries a new recipe, she doesn\'t cater a wedding with it first — she makes one test portion, tastes, adjusts, repeats (jshell: single-bite iterations before committing to dinner service). Now visit Joey\'s apartment. Joey owns... some utensils? Somewhere? There\'s a fork in the couch, a pan he borrowed from Monica two years ago, possibly a spatula at Ross\'s place. When Joey "cooks", the failure mode is never the recipe — it\'s that the TOOLS can\'t be found: he gets halfway through and discovers the pan is at a different apartment (ClassNotFoundException: the recipe compiled fine against Monica\'s kitchen, but at cooking time, in JOEY\'s kitchen, the pan just isn\'t on the shelf list). Monica\'s rule when she catches these disasters: read the error like a chef, not like Joey. "This recipe calls for a zester and you don\'t own one" said while WRITING the shopping list is a planning error — fix the list (compile-time: cannot find symbol). "The zester was right here and now it\'s gone" said mid-recipe is a kitchen error — fix the kitchen (run-time: the classpath). Joey\'s response — "but it worked at your place!" — is every developer\'s first classpath bug: same recipe, different kitchen, and the kitchen is part of the program whether you acknowledge it or not.'
    },
    why: 'Setup is mise en place: install the FULL toolkit (JDK, not just a runtime), verify every burner (java -version and javac -version), post one authoritative kitchen location (JAVA_HOME), cook the ritual first dish end-to-end (Hello, world), and keep a tasting counter for ten-second experiments (jshell). Then remember Sanji\'s two failures forever: a recipe naming an ingredient the pantry list lacks is rejected when written (compile-time, "cannot find symbol"); the saffron jar that moved overnight explodes when cooked (run-time, ClassNotFoundException). Same pantry list, checked at two different moments — that\'s the classpath.'
  },
  storyAnim: {
    title: 'Sanji sets up the galley, from empty room to first dish',
    h: 280,
    props: [
      { id: 'knives', emoji: '🔪', label: 'knife roll installed (JDK 21)', x: 10, y: 12 },
      { id: 'stove', emoji: '🔥', label: 'every burner tested (java + javac -version)', x: 36, y: 12 },
      { id: 'sign', emoji: '📍', label: 'THE kitchen sign (JAVA_HOME)', x: 62, y: 12 },
      { id: 'recipe', emoji: '📝', label: 'first recipe (Hello.java)', x: 86, y: 12 },
      { id: 'written', emoji: '✅', label: 'recipe checked against pantry (javac)', x: 16, y: 50 },
      { id: 'dish', emoji: '🍚', label: 'ritual first dish served (java Hello)', x: 44, y: 50 },
      { id: 'tasting', emoji: '🥄', label: 'tasting counter (jshell)', x: 72, y: 50 },
      { id: 'pantry', emoji: '🗄️', label: 'pantry shelf list (classpath)', x: 28, y: 84 },
      { id: 'moved', emoji: '💥', label: 'saffron moved! (ClassNotFoundException)', x: 66, y: 84 }
    ],
    actors: [
      { id: 'sanji', emoji: '🚬', label: 'Sanji', x: 50, y: 30 }
    ],
    steps: [
      { c: 'Sanji installs the full knife roll — the JDK, every tool, not just what a dinner guest would need.', p: { knives: 'good' } },
      { c: 'Verification ritual: EVERY burner must light. java -version AND javac -version — a stove without an oven is a runtime without a compiler, and it fails you mid-recipe.', p: { stove: 'good' } },
      { c: 'One sign says where THE kitchen is, so every future cook — Maven, Gradle, the IDE — uses the same one. That\'s JAVA_HOME.', p: { sign: 'good' } },
      { c: 'The ritual first dish is written: the simplest recipe that exercises the whole kitchen. Hello.java.', p: { recipe: 'lit' } },
      { c: 'First check, at WRITING time: does the pantry list contain everything the recipe names? That\'s javac consulting the compile classpath — "cannot find symbol" means fix the recipe.', p: { written: 'good', pantry: 'lit' }, a: { sanji: [30, 40] } },
      { c: 'The dish is cooked and served: java Hello. Pantry consulted again — this time for real ingredients, at run time.', p: { dish: 'good' } },
      { c: 'The tasting counter opens: single-bite experiments, ten seconds each. jshell — where every "what if" of Parts 1–5 gets answered.', p: { tasting: 'good' }, a: { sanji: [72, 38] } },
      { c: 'And the failure to remember forever: recipe fine, but the saffron jar MOVED overnight. Compiles yesterday, ClassNotFoundException today — fix the pantry (classpath), not the recipe.', p: { moved: 'bad' } }
    ]
  },
  conceptFlow: {
    title: 'The setup pipeline: install → verify → write → compile → run → explore',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Install',
        nodes: [
          { id: 'install', text: 'Temurin 21 LTS\nMac: brew install --cask temurin@21\nLinux: sdk install java 21-tem' },
          { id: 'home', text: 'JAVA_HOME set\nso Maven/Gradle/IDE pick the SAME JDK' }
        ]
      },
      {
        label: 'Verify',
        nodes: [
          { id: 'verify', text: 'java -version && javac -version\nBOTH must print 21.x' }
        ]
      },
      {
        label: 'Compile',
        nodes: [
          { id: 'write', text: 'Hello.java\npublic class Hello == file name' },
          { id: 'compile', text: 'javac Hello.java\ntakes a FILE name → emits Hello.class' }
        ]
      },
      {
        label: 'Run',
        nodes: [
          { id: 'run', text: 'java Hello\ntakes a CLASS name — no .class!' },
          { id: 'cp', text: 'classpath\nwhere classes are searched (default: .)' }
        ]
      },
      {
        label: 'Explore',
        nodes: [
          { id: 'jshell', text: 'jshell\nten-second experiments, no ceremony' },
          { id: 'javap', text: 'javap -c Hello\nsee your actual bytecode' }
        ]
      }
    ],
    steps: [
      { active: ['install'], note: 'One upstream (OpenJDK), many vendors — Temurin 21 is the free LTS default. SDKMAN on Linux additionally manages multiple JDKs, and installs Maven/Gradle later with one command.' },
      { active: ['home'], note: 'JAVA_HOME is just an environment variable pointing at the JDK directory. java/javac don\'t need it — but Maven, Gradle, and IDEs read it, and setting it now prevents the "terminal uses 21, build uses 8" mess.' },
      { active: ['verify'], note: 'Both commands must work. java without javac means a bare runtime is shadowing your JDK on the PATH — last lesson\'s JRE/JDK distinction, arriving in real life ten minutes in.' },
      { active: ['write'], note: 'The public class name must equal the file name, because the classloader turns class names into file paths to find them. main\'s exact signature — public static void main(String[] args) — is what the JVM looks up as the entry point.' },
      { active: ['compile'], note: 'javac Hello.java: file in, bytecode out. Compile-time is where type errors, typos, and missing classes die — cheaply.' },
      { active: ['run', 'cp'], note: 'java Hello names a CLASS; the JVM finds its bytecode by searching the classpath — an ordered list of directories and jars, defaulting to the current directory. ClassNotFoundException means this search failed at run time.' },
      { active: ['jshell'], note: 'jshell compiles your snippets for real behind the scenes — same javac, same JVM, zero ceremony. Every "what happens if" in Parts 1–5 costs ten seconds here. Build the reflex now.' },
      { active: ['javap'], note: 'javap -c prints the bytecode inside your .class file. You don\'t need to read it fluently yet — you need to know it\'s a short, inspectable list of instructions, not magic vapor. Part 2 returns with a guided tour.' }
    ]
  },
  tech: [
    {
      q: 'What exactly do PATH and JAVA_HOME each control, and why do both exist?',
      a: 'PATH is the shell\'s concern: an ordered list of directories the shell searches when you type a bare command name, so "javac" resolves to /some/jdk/bin/javac. JAVA_HOME is the ecosystem\'s convention: a single variable naming the JDK\'s ROOT directory, which tools that need more than one executable (Maven, Gradle, IDEs, application servers) read to locate the whole JDK coherently — its bin/, its lib/, its bundled modules. Both exist because they answer different questions: PATH answers "what runs when I type javac?" per-command; JAVA_HOME answers "which complete JDK should this tool build my project with?" per-toolchain. The classic failure they prevent together: PATH pointing at one JDK while Maven silently uses another via a stale JAVA_HOME — producing "compiles in my terminal, fails in the build" bugs. Setting both consistently (SDKMAN does it automatically on Linux; on Mac, export JAVA_HOME=$(/usr/libexec/java_home -v 21) in your shell profile) closes that gap permanently.'
    },
    {
      q: 'Why does java take a class name while javac takes a file name?',
      a: 'Because they live on opposite sides of the compile/run divide and consume different things. javac is a file-processing tool: it reads source FILES from disk (you could pass it any path — src/foo/Bar.java) and emits .class files. java is a class-launching tool: you tell it the fully-qualified NAME of a class ("Hello", or later "com.logpose.Main"), and the JVM\'s classloader translates that name into a search across the classpath — checking each directory and jar for a matching path like com/logpose/Main.class. That\'s also exactly why "java Hello.class" fails with a bewildering "Could not find or load main class Hello.class": the JVM dutifully searched for a class NAMED "Hello.class" — i.e. a file called Hello/class.class — and of course found nothing. Once you see the classloader\'s name→path translation, both the rule and the weird error message become obvious rather than arbitrary.'
    },
    {
      q: 'What is a .jar file, really, and what\'s in the manifest?',
      a: 'A jar is literally a zip archive (unzip works on it) containing .class files laid out in their package directory structure, plus optional resources (config files, images) and a manifest: META-INF/MANIFEST.MF, a small text file of key-value metadata. The manifest\'s most famous key is Main-Class — set it, and "java -jar app.jar" knows which class\'s main() to launch, no classpath gymnastics needed. Libraries are just jars without a Main-Class: zips of someone else\'s bytecode that you put on your classpath. This demystification pays off repeatedly later: Maven\'s entire output (Part 6) is jars; Spring Boot\'s "fat jar" (Part 9) is a jar containing your classes plus every dependency jar nested inside it plus a clever launcher manifest; and an Android APK or a war file are the same idea wearing different extensions.'
    },
    {
      q: 'jshell says $1 ==> 21 — what is it actually doing with my snippet under the hood?',
      a: 'jshell wraps each snippet into a synthetic class behind the scenes, compiles it with the real compiler API (the same javac front-end, so you get real type checking and real error messages), loads the result into a JVM it keeps running, and executes it — then prints the value and, for bare expressions, auto-assigns it to a generated variable ($1, $2…) so you can reuse results. Because the backing JVM stays alive across snippets, your variables and methods persist and later snippets can reference earlier ones; /reset throws that JVM state away. Two practical consequences: first, jshell behavior IS Java behavior — anything you learn there transfers exactly (it\'s not a lenient dialect); second, jshell relaxes only ceremony, not semantics — it allows statements outside a class and swallows checked exceptions at the prompt (Part 1\'s exceptions lesson explains what that means), which is precisely the boilerplate you\'re there to avoid while experimenting.'
    }
  ],
  code: {
    title: 'The complete first session, end to end',
    intro: 'Every command from a fresh machine to inspected bytecode. Type these yourself — this is the lesson where copy-paste teaches the least.',
    code: `# ---- 1. Install (pick your OS) ----
# Mac:
brew install --cask temurin@21
# Linux:
curl -s "https://get.sdkman.io" | bash     # then reopen the terminal
sdk install java 21-tem

# ---- 2. Verify BOTH tools ----
java -version     # openjdk 21.x  ← the runtime
javac -version    # javac 21.x    ← the compiler; if this fails you have a JRE, not a JDK

# ---- 3. First program ----
mkdir -p ~/code/java-course && cd ~/code/java-course
cat > Hello.java << 'EOF'
public class Hello {
    public static void main(String[] args) {
        String who = (args.length > 0) ? args[0] : "world";
        System.out.println("Hello, " + who + "!");
    }
}
EOF

javac Hello.java          # file name in...
ls                        # Hello.java  Hello.class   ...bytecode out
java Hello                # class name — prints: Hello, world!
java Hello Nami           # prints: Hello, Nami!
java Hello.java           # single-file mode: compile-in-memory + run, no .class left

# ---- 4. Ten seconds in the laboratory ----
jshell
#  jshell> 7 / 2
#  $1 ==> 3            ← integer division truncates. First surprise captured!
#  jshell> 7.0 / 2
#  $2 ==> 3.5
#  jshell> "log".repeat(3) + "pose"
#  $3 ==> "logloglogpose"
#  jshell> /exit

# ---- 5. Look your bytecode in the eye ----
javap -c Hello            # disassembles Hello.class: getstatic, invokevirtual...
                          # not magic vapor — a short list of instructions in a file you made`,
    notes: [
      'Step 2 is Sanji\'s every-burner check. The single most common day-one support question in Java history is a runtime shadowing the JDK on PATH — thirty seconds of verification buys weeks of not having that problem.',
      'Notice step 3 runs the same class three ways: compiled-then-run (the real workflow), with an argument (args[0] exists!), and single-file mode (a convenience for scripts, not projects).',
      'The jshell transcript already banked a real Part 1 fact — integer division truncates — before its lesson. That\'s the tasting-counter habit working.'
    ]
  },
  lab: {
    title: 'Your first real program: GreetLab',
    prompt: 'Write a complete Java program, from scratch, in a file that would be named <code>GreetLab.java</code>: a public class <code>GreetLab</code> with a correct <code>main</code> method that (1) declares a <code>String</code> variable <code>name</code> set to <code>args[0]</code> if an argument was passed, otherwise <code>"researcher"</code>; (2) declares an <code>int</code> variable <code>count</code> set to <code>3</code>; (3) prints the greeting line <code>Hello, &lt;name&gt;!</code> and then prints the name <code>count</code> times using any loop. Then run it for real locally, both with and without an argument.',
    starter: `// File: GreetLab.java
// Write the whole thing yourself — class declaration, main, and all.
`,
    checks: [
      { re: 'public\\s+class\\s+GreetLab', must: true, hint: 'Declare "public class GreetLab" — and remember why the name matters: the classloader finds classes by name→file path.', pass: 'public class GreetLab ✓' },
      { re: 'public\\s+static\\s+void\\s+main\\s*\\(\\s*String\\s*\\[\\]\\s*\\w+\\s*\\)', must: true, hint: 'main must have the exact entry-point signature: public static void main(String[] args).', pass: 'main(String[] args) signature ✓' },
      { re: 'args\\s*\\.\\s*length', must: true, hint: 'Check args.length to decide between args[0] and the default "researcher".', pass: 'args.length checked ✓' },
      { re: '"researcher"', must: true, hint: 'Default the name to "researcher" when no argument is given.', pass: 'default name present ✓' },
      { re: 'int\\s+count\\s*=\\s*3', must: true, hint: 'Declare an int variable: int count = 3;', pass: 'int count = 3 ✓' },
      { re: '(for|while)\\s*\\(', must: true, hint: 'Print the name count times using a for or while loop.', pass: 'loop present ✓' },
      { re: 'System\\s*\\.\\s*out\\s*\\.\\s*println', must: true, hint: 'Print with System.out.println(...).', pass: 'println used ✓' }
    ],
    run: 'save as <code>GreetLab.java</code>, then <code>javac GreetLab.java && java GreetLab</code> — and again as <code>java GreetLab Robin</code>. Also try the failure on purpose: run <code>java greetlab</code> (wrong case) and read the ClassNotFoundException like Sanji reads a moved saffron jar.',
    solution: `// File: GreetLab.java
public class GreetLab {
    public static void main(String[] args) {
        String name = (args.length > 0) ? args[0] : "researcher";
        int count = 3;
        System.out.println("Hello, " + name + "!");
        for (int i = 0; i < count; i++) {
            System.out.println(name);
        }
    }
}`,
    notes: [
      'The ternary (condition ? a : b) is optional — an if/else assigning name works identically; Part 1 covers both properly.',
      'Deliberately triggering the wrong-case ClassNotFoundException while the concept is fresh is the fastest vaccination against hours of future confusion — the error names a CLASS the loader searched for, not a file.',
      'If javac complained about the class/file name mismatch when you experimented — good. That error message is the classloader rule from this lesson, enforced.'
    ]
  },
  quiz: [
    {
      q: 'java -version prints 21, but javac says "command not found". What\'s the situation?',
      options: ['A bare runtime (JRE layer) is on the PATH, but no JDK — you can run Java but not compile it; install/point PATH at a full JDK', 'Java is broken and must be reinstalled from scratch', 'This is normal — javac only works inside an IDE', 'The JVM needs JAVA_HOME set before javac will appear'],
      correct: 0,
      explain: 'java (run) without javac (compile) is exactly the JRE-vs-JDK boundary from the previous lesson showing up on a real machine — Sanji\'s stove lighting while the oven doesn\'t.'
    },
    {
      q: 'Why must "public class Hello" live in a file named exactly Hello.java?',
      options: ['The classloader locates classes by translating names into file paths — if names and files disagreed, nothing could ever be found', 'It\'s a pure style convention with no technical basis', 'Because the JVM reads .java files directly at runtime', 'Only IDEs require this; the command line doesn\'t care'],
      correct: 0,
      explain: 'Name→path translation is the classloader\'s whole strategy (and javac enforces it for public classes so the scheme works). The same rule scales up: class com.logpose.Main must sit at com/logpose/Main.class on the classpath.'
    },
    {
      q: 'You run "java Hello.class" and get "Could not find or load main class Hello.class". Why?',
      options: ['java expects a CLASS name — it searched the classpath for a class literally named "Hello.class" (path Hello/class.class) and found nothing; the fix is "java Hello"', 'The file is corrupted and must be recompiled', 'You must always pass -cp when running any class', 'Hello.class must be renamed Hello.jvm first'],
      correct: 0,
      explain: 'javac takes file names; java takes class names. The weird error message becomes perfectly logical once you know the classloader translated your "class name" into a path and searched for it.'
    },
    {
      q: '"cannot find symbol" from javac versus ClassNotFoundException from the JVM — what\'s the essential difference?',
      options: ['The first is compile-time (the compiler can\'t resolve a name — typo, missing import, or missing compile classpath entry); the second is run-time (the bytecode compiled fine but can\'t be FOUND on the runtime classpath now)', 'They\'re interchangeable names for the same error', 'The first is always a JVM bug; the second is always your bug', 'The second only happens with jar files, never directories'],
      correct: 0,
      explain: 'Sanji\'s two failures: an ingredient the pantry list never had (fix the recipe/compile setup) versus the saffron jar that moved after the recipe was approved (fix the runtime classpath). Same list, checked at two different moments.'
    },
    {
      q: 'What is jshell for, and what\'s the right habit to build with it?',
      options: ['A REPL that compiles snippets with the real compiler and keeps state between them — the ten-second answer to every "what happens if…?" question, replacing web searches with direct experiments', 'A lightweight Java dialect that behaves differently from real Java', 'A tool for running .jar files in production', 'A code formatter bundled with the JDK'],
      correct: 0,
      explain: 'Same javac, same JVM, zero ceremony — anything jshell teaches you is real Java behavior. The reflex "wonder → jshell → answer in ten seconds" is the highest-value habit of Part 0.'
    }
  ],
  testFlow: {
    title: 'Test yourself: setup and the compile/run divide',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'Your terminal compiles fine with javac 21, but Maven (later) builds the project with Java 8 and fails. What\'s the most likely culprit?',
        choices: [
          { text: 'JAVA_HOME points at an old JDK — Maven reads JAVA_HOME, not the PATH your terminal resolved javac from', to: 'q1_right' },
          { text: 'Maven ships its own secret Java version that can\'t be changed', to: 'q1_wrong_secret' },
          { text: 'The .class files were corrupted by the old JDK', to: 'q1_wrong_corrupt' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Exactly — PATH answers "what runs when I type javac"; JAVA_HOME answers "which JDK should toolchains use". They can disagree, and that disagreement is the classic "works in my terminal, fails in the build" bug. Set both consistently, once.', next: 'q2' },
      q1_wrong_secret: { end: true, correct: false, text: 'Maven is a Java program that runs ON a JDK — and it picks that JDK via JAVA_HOME. No secrets, just a variable pointing at the wrong directory.', retry: 'q1' },
      q1_wrong_corrupt: { end: true, correct: false, text: 'Nothing is corrupted — two different tools are simply using two different JDKs. Check where JAVA_HOME points before suspecting anything exotic.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A program compiles cleanly. You move Hello.class into a subfolder called build/ and run "java Hello" from the project root. Result?',
        choices: [
          { text: 'ClassNotFoundException-style failure: the classpath defaults to the current directory, which no longer contains Hello.class — fix with java -cp build Hello', to: 'q2_right' },
          { text: 'It works — the JVM remembers where javac put the file', to: 'q2_wrong_memory' },
          { text: 'It recompiles automatically from Hello.java', to: 'q2_wrong_recompile' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Right — the saffron jar moved. The recipe (bytecode) is fine; the pantry search (classpath, defaulting to ".") fails. Naming the classpath explicitly (-cp build) is the fix, and from Part 6 Maven assembles this for you — comprehensibly, now that you know what it\'s assembling.', next: 'q3' },
      q2_wrong_memory: { end: true, correct: false, text: 'The JVM has no memory of past runs — every launch is a fresh classpath search. If the class\'s bytecode isn\'t reachable from the classpath NOW, the search fails now.', retry: 'q2' },
      q2_wrong_recompile: { end: true, correct: false, text: 'java never recompiles source (single-file mode aside, which you\'d invoke as "java Hello.java"). It searches the classpath for bytecode — and the bytecode isn\'t where it\'s looking.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'You want to know whether Java\'s % operator can return negative numbers. Fastest reliable answer?',
        choices: [
          { text: 'jshell: type -7 % 3 and read the result — ten seconds, real compiler, real JVM, no ceremony', to: 'q3_right' },
          { text: 'Search a forum and trust the top answer', to: 'q3_wrong_forum' },
          { text: 'Create ModTest.java with a main method, compile, and run it', to: 'q3_wrong_ceremony' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Exactly the habit this lesson exists to install. (And yes: -7 % 3 is -1 in Java — the result takes the dividend\'s sign. You just learned a Part 1 fact the fast way.)', next: null },
      q3_wrong_forum: { end: true, correct: false, text: 'Slower, and you\'re trusting someone else\'s possibly-wrong, possibly-different-language answer when a real JVM is one command away. The tasting counter beats the rumor mill.', retry: 'q3' },
      q3_wrong_ceremony: { end: true, correct: false, text: 'It works, but it\'s a full dinner service for a single-bite question — file, class, main, compile, run. jshell exists precisely to make these experiments ten seconds instead of five minutes.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Installing "Java" from a random download page and getting a bare runtime or an ancient version — install Temurin 21 via brew/SDKMAN and verify BOTH java -version and javac -version before anything else.',
    'Skipping JAVA_HOME because everything works today — the bill arrives in Part 6 as "Maven uses a different Java than my terminal". Two minutes now, hours saved later.',
    'Typing "java Hello.class" — java takes class names, javac takes file names. Related: running from the wrong directory, since the default classpath is "." and nothing else.',
    'Learning Java by reading instead of running — every property of the language in Parts 1–5 is a ten-second jshell experiment. If you haven\'t opened jshell by the end of this lesson, the course\'s single best habit hasn\'t started yet.',
    'Reaching for an IDE on day one and letting it hide javac, classpaths, and error messages — IntelliJ is wonderful and you should adopt it around Part 3; adopt it as a convenience on top of mechanics you\'ve touched, not as a substitute for them.',
    'Ignoring the compile-time vs run-time axis of error messages — "cannot find symbol" and ClassNotFoundException look cosmetically similar and mean opposite things. Reading which TOOL emitted an error is the first diagnostic skill of a Java developer.'
  ],
  interview: [
    {
      q: 'Walk me through exactly what happens when you type "java Hello" in a terminal.',
      a: 'The shell resolves "java" via PATH to the JDK\'s launcher binary and executes it — a native program that creates a JVM inside the process. The JVM takes "Hello" as a fully-qualified class name and asks its classloader to find it: the classloader translates the name into the path Hello.class and searches the classpath — an ordered list of directories and jars, defaulting to the current directory — for that file. Found bytecode is then verified (well-formed, type-safe, no stack abuse) before anything executes. The JVM then looks up the exact entry-point signature public static void main(String[] args), static because no objects exist yet to receive a call. Execution begins in the interpreter for instant startup, while profiling runs; methods that get hot are JIT-compiled to native code as the program runs. Failure modes map cleanly onto the steps: "command not found" is PATH; "Could not find or load main class" is the classpath search; a verifier error means corrupt/incompatible bytecode; "main method not found" means the signature is wrong (e.g., missing static).'
    },
    {
      q: 'What is the classpath, and how do the compile-time and runtime classpaths differ in practice?',
      a: 'The classpath is the ordered list of locations — directories and jar files — where Java tooling searches for classes by translating fully-qualified names into file paths. It\'s consulted twice by two different tools, and keeping the two straight is the practical skill. At compile time, javac uses it to resolve every name your source mentions — a miss is a "cannot find symbol" error, fixed by adding the right source or jar to the COMPILE classpath. At run time, the JVM\'s classloader uses it to locate bytecode the moment each class is first needed — a miss is ClassNotFoundException or NoClassDefFoundError, fixed by correcting the RUNTIME classpath. The two can legitimately differ: an artifact compiled against an API jar might expect a different implementation jar at runtime (JDBC drivers work exactly this way — compile against java.sql, provide the PostgreSQL driver jar at runtime); and a class can be present at compile time but missing at deployment, which is precisely what NoClassDefFoundError reports. Build tools like Maven formalize this with dependency scopes — compile, runtime, test, provided — which are literally named after which classpath a dependency lands on.'
    },
    {
      q: 'Why does main have the signature "public static void main(String[] args)" — justify every word.',
      a: 'public: the JVM launcher, which lives outside your class and package, must be able to invoke it — any weaker visibility would hide the entry point from the very thing that needs to call it. static: at launch, no instances exist and the JVM has no constructor arguments to build one with — a static method is callable on the class itself, requiring no object, which cleanly sidesteps the chicken-and-egg of "who constructs the first object?" (your code does, inside main). void: the method returns nothing because process exit status is communicated differently — the process returns 0 when main completes normally, and code can call System.exit(n) for explicit statuses; a return value would be redundant with that mechanism. main: simply the conventional name the JVM specification mandates looking up — a fixed, well-known rendezvous point. String[] args: the command-line arguments, delivered as an array of strings with the program name NOT included (unlike C\'s argv[0]) — parsing them into ints or flags is the program\'s job. Get any element wrong and the class still compiles fine — but the launcher reports "main method not found", a run-time discovery, because the signature is a lookup contract, not a language rule.'
    },
    {
      q: 'A teammate says "Java is too ceremonial for quick experiments — I use Python for those." What\'s the modern Java answer?',
      a: 'Two tools closed most of that gap. jshell (since Java 9) is a full REPL shipping with every JDK: type expressions and statements with no class or main ceremony, get instant evaluation with real javac semantics and persistent session state — it\'s the right tool for "what does this API return", "does this behave how I think", and API exploration, exactly the niche of a Python interpreter session. Single-file source launch (since Java 11) runs "java Script.java" directly — compiling in memory, leaving no artifacts — which covers the small-script use case; recent Java versions have pushed further with simplified main declarations for beginners (implicitly declared classes, instance main — finalized in Java 21+ previews/releases depending on version). The honest part of the answer: for genuine one-off text-munging scripts, Python remains excellent and there\'s no shame in it — but "I can\'t experiment quickly in Java" has been false for years, and a Java developer who doesn\'t use jshell for API exploration is leaving their fastest feedback loop unused. In interviews, mentioning jshell for exploration signals current, hands-on Java rather than 2010-era folklore.'
    }
  ]
};
