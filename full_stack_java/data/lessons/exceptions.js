window.LESSONS = window.LESSONS || {};
window.LESSONS['exceptions'] = {
  id: 'exceptions',
  title: 'Exceptions: try/catch/finally, Checked vs Unchecked, try-with-resources',
  category: 'Part 1 — Core Java',
  timeMin: 50,
  summary: 'How Java handles the moment something goes wrong: an exception is a thrown object that unwinds the call stack until a matching catch handles it — separating the error-handling path from the happy path instead of threading return-code checks through every line. Plus the divide interviews probe hardest (checked exceptions the compiler forces you to handle vs unchecked runtime failures it doesn\'t), the finally block and its resource-cleanup successor try-with-resources, custom exception design, and the discipline of failing fast, catching narrowly, and never swallowing.',
  goals: [
    'Trace how a thrown exception unwinds the stack frame by frame until a matching catch, and what happens if none matches',
    'Draw the Throwable hierarchy and place Error, Exception, RuntimeException — and explain the checked/unchecked line and why it exists',
    'Use try / multi-catch / finally correctly, and know exactly when finally runs and when it is skipped',
    'Replace manual finally cleanup with try-with-resources and AutoCloseable, and explain suppressed exceptions',
    'Design and throw meaningful exceptions, wrap-and-rethrow without losing the cause, and avoid the swallow-and-log anti-pattern'
  ],
  concept: [
    {
      h: 'An exception is a thrown object that unwinds the stack',
      p: [
        'When a method hits a condition it cannot handle, it <code>throw</code>s an object — an instance of <code>Throwable</code> — and normal execution stops immediately. The JVM then walks BACK down the call stack, frame by frame, looking for a <code>try</code> whose <code>catch</code> matches the thrown type. Each unmatched frame is discarded (its local variables gone), until a matching handler is found and control jumps there; if none is found in the entire stack, the thread dies and the JVM prints the stack trace — that snapshot of every frame between the <code>throw</code> and where it escaped. The stack trace is not noise: it is the exact path the failure travelled, top frame = where it was thrown, and reading it top-down is the single most useful debugging skill in Java.',
        'The design intent is <b>separation of concerns</b>: the happy path reads cleanly — <code>parse, validate, save</code> — while the error path lives in <code>catch</code> blocks off to the side, instead of every call being wrapped in <code>if (returnCode != OK)</code> the way C forces. An exception also carries information a return code can\'t: a type (what KIND of failure), a message (human detail), and a <b>cause</b> (the lower-level exception that triggered this one), so a failure can be diagnosed, not just detected.'
      ]
    },
    {
      h: 'The Throwable hierarchy and the checked/unchecked line',
      p: [
        'Everything throwable descends from <code>Throwable</code>, which forks into two branches. <b>Error</b> — <code>OutOfMemoryError</code>, <code>StackOverflowError</code> — signals JVM-level catastrophe you are not expected to catch or recover from; let it kill the thread. <b>Exception</b> is the branch for conditions programs can reasonably handle, and it splits again: <code>RuntimeException</code> and its subclasses are <b>unchecked</b>; everything else under <code>Exception</code> is <b>checked</b>.',
        'The line between them is a compiler rule with a design philosophy. A <b>checked</b> exception (<code>IOException</code>, <code>SQLException</code>) is one the compiler FORCES you to deal with — either <code>catch</code> it or declare <code>throws</code> it in your signature — because it represents an expected, recoverable external failure (the file wasn\'t there, the network dropped) that a caller should consciously plan for. An <b>unchecked</b> exception (<code>NullPointerException</code>, <code>IllegalArgumentException</code>, <code>IndexOutOfBoundsException</code>) is one the compiler does NOT force you to handle, because it typically signals a PROGRAMMING BUG — a contract you violated — that you should fix in code, not catch at runtime. The mnemonic: checked = "the world might fail, plan for it"; unchecked = "you made a mistake, fix it." This divide is genuinely contentious — many modern JVM languages (Kotlin, Scala) dropped checked exceptions entirely, and even in Java the pendulum has swung toward unchecked for most application-level failures — but understanding WHY the line was drawn is a reliable interview separator.'
      ]
    },
    {
      h: 'finally, and its successor try-with-resources',
      p: [
        'A <code>finally</code> block runs no matter how the <code>try</code> exits — normal completion, a caught exception, an uncaught one propagating through, even a <code>return</code> inside the try — which makes it the classic home for cleanup: close the file, release the lock, restore state. The only things that skip it are the drastic ones: <code>System.exit()</code>, a JVM crash, an infinite loop, or the thread being killed. The trap: a <code>return</code> or <code>throw</code> inside <code>finally</code> overrides whatever the try was doing — silently swallowing an exception mid-propagation — so <code>finally</code> should clean up and nothing else.',
        'Manual <code>try/finally</code> cleanup is verbose and error-prone (nested resources produce a pyramid of nested finallys, and a close() that itself throws can mask the original failure). <b>try-with-resources</b> fixes it: <code>try (var reader = Files.newBufferedReader(path)) { ... }</code> automatically calls <code>close()</code> on any resource declared in the parentheses when the block exits, in reverse order of opening, whether normally or via exception. Any class implementing <code>AutoCloseable</code> works. And it solves the masking problem elegantly with <b>suppressed exceptions</b>: if the body throws AND a close() throws, the body\'s exception propagates as primary and the close() exception is attached to it as "suppressed" (retrievable via <code>getSuppressed()</code>) rather than lost — you see both, the real cause foremost. This is the modern default; hand-written finally-to-close is a code smell in new code.'
      ]
    },
    {
      h: 'The discipline: fail fast, catch narrow, never swallow',
      p: [
        'Good exception hygiene is mostly a few hard rules. <b>Fail fast:</b> validate inputs at the boundary and <code>throw new IllegalArgumentException(...)</code> the instant a contract is violated, so the failure surfaces AT the mistake, not five layers deeper where the corrupted value finally causes an NPE with no trace of its origin (this is why last lessons\' constructors validated eagerly). <b>Catch narrow:</b> catch the most specific type you can actually handle — <code>catch (IOException e)</code>, not <code>catch (Exception e)</code> and never <code>catch (Throwable e)</code>, which also swallows the Errors and bugs you never meant to touch. <b>Never swallow:</b> an empty catch block — <code>catch (IOException e) { }</code> — is the cardinal sin; the failure vanishes and the bug detonates later, sourceless. If you truly can\'t handle it here, don\'t catch it; if you catch to add context, rethrow.',
        'When you cross an abstraction boundary, <b>wrap and rethrow, preserving the cause</b>: <code>catch (SQLException e) { throw new StorageException("saving log failed", e); }</code> — the caller sees a clean, layer-appropriate exception, but the original SQLException is chained as the cause and the full trace survives (that <code>e</code> second argument is not optional detail; dropping it destroys the diagnosis). Custom exceptions earn their keep when a distinct failure needs distinct handling or a distinct type in an API contract — but don\'t manufacture a bespoke class for every error; the JDK\'s <code>IllegalArgumentException</code>, <code>IllegalStateException</code>, <code>UnsupportedOperationException</code>, and <code>NoSuchElementException</code> already name most of what goes wrong. LogPose will define a small handful (a <code>ParseException</code> for malformed log imports, a <code>StorageException</code> wrapping the database layer) and lean on the JDK\'s for the rest.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Sanji\'s kitchen catches fire — and the stack unwinds',
      text: 'A dinner service on the Thousand Sunny is a call stack: Sanji calls prepareCourse(), which calls sear(steak), which calls lightBurner(). Deep in lightBurner(), the gas line ruptures — a condition that method absolutely cannot handle from where it stands. So it doesn\'t limp on returning a quiet "-1 error code" that sear() might forget to check (the C way, and the way half of Baratie once burned down). It THROWS: "GAS LEAK!" — and everything stops. Now watch the unwind: sear() has no plan for a gas leak, so its frame is abandoned mid-steak; prepareCourse() has no plan either, abandoned; the shout propagates DOWN the stack, frame after frame discarded, until it reaches a method that wrapped its work in a try — Zeff, who long ago learned to cook with a catch(KitchenFire) around the whole galley. Zeff HANDLES it: extinguisher, gas off, service continues. And notice what the propagating shout carried that a return code never could — its TYPE (a fire, specifically, not a spill), a message, and a CAUSE (the ruptured line), so Zeff knows exactly what he\'s fighting. Some failures, though, aren\'t the world going wrong — they\'re the cook going wrong: Luffy reaching a grubby hand toward the finished plate is an IllegalArgumentException Sanji throws INSTANTLY, at the boundary, the moment the contract "don\'t touch my food" is violated — fail fast, right at the mistake, not after Luffy\'s three tables away and someone else gets blamed. There\'s a checked-vs-unchecked line in Sanji\'s world too: a delivery that might not arrive (the world failing — plan for it, keep a backup) versus Luffy\'s hand (a known troublemaker\'s bug — you don\'t "handle" it every dinner, you fix the behaviour). And the finally block is the one Sanji never skips: however the service ends — triumph, fire, or Luffy banned from the galley — the kitchen gets cleaned and the burners get shut OFF. That cleanup runs no matter what, which is exactly why try-with-resources exists: declare the burner as a resource, and it turns itself off when the block ends, fire or no fire, in reverse order it was lit.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon throws a checked exception for everything',
      text: 'Sheldon Cooper is a man who has converted every possible failure into a typed, declared exception — and his roommate agreement is one enormous throws clause. Consider his world through the checked/unchecked lens. A checked exception is one the compiler forces you to handle in advance: Sheldon\'s "Bathroom Schedule" declares throws in its signature — the possibility of a plumbing failure is KNOWN, external, recoverable, and there is a documented, mandatory contingency clause (the roommate agreement literally has provisions for a "skin-melting plague" and a "zombie apocalypse" — the world might fail, so PLAN for it). An unchecked exception is the other kind: when Penny sits in his spot, that is not a foreseeable act of the universe, it is a CONTRACT VIOLATION — a bug in someone\'s behaviour — and Sheldon throws instantly, at the boundary, without ceremony: "You\'re in my spot." Fail fast, precisely at the mistake. Watch his catch discipline, which is better than most engineers\': Sheldon never catches Throwable — he catches the NARROWEST possible type, because he needs to know EXACTLY what went wrong to apply the exactly-correct remedy (a knock-knock-knock-Penny for one condition, a strongly-worded email for another). And he would rather DIE than swallow an exception — an empty catch block, a problem silently ignored, is physically impossible for him; every failure is logged, escalated, and addressed, which is annoying in a roommate and correct in code. His finally block is the nightly routine that runs no matter how the day went — triumph, humiliation, or a fight with Wolowitz: teeth brushed, blanket at the exact angle, "Soft Kitty" if he\'s sick. It executes regardless of how the try exited. And the wrap-and-rethrow-preserving-the-cause? That\'s Sheldon relaying a problem to Leonard: he never just says "something broke" — he wraps the low-level failure ("the comic book store was out of stock") in a higher-level exception ("my entire week is ruined") while meticulously preserving the original cause, so the full diagnostic chain survives all the way up.',
    },
    why: 'A thrown exception stops everything and unwinds the stack frame by frame — Sanji\'s "GAS LEAK!" abandons sear() and prepareCourse() until Zeff\'s catch handles it — carrying a type, message, and cause a return code never could. Checked = the world might fail, the compiler makes you plan (Sheldon\'s plumbing clause, the zombie-apocalypse provision); unchecked = a contract violation, a bug to fix fast at the boundary (Penny in the spot, Luffy\'s hand). Catch the narrowest type, never swallow, and let finally / try-with-resources run cleanup no matter how the block exits.'
  },
  storyAnim: {
    title: '"GAS LEAK!" — a throw unwinds the stack to a waiting catch',
    h: 300,
    props: [
      { id: 'light', emoji: '🔥', label: 'lightBurner(): gas ruptures → THROW', x: 12, y: 12 },
      { id: 'sear', emoji: '🥩', label: 'sear(): no catch → frame abandoned', x: 40, y: 12 },
      { id: 'prep', emoji: '🍽️', label: 'prepareCourse(): no catch → abandoned', x: 68, y: 12 },
      { id: 'zeff', emoji: '🧑‍🍳', label: 'Zeff: try { … } catch(KitchenFire) — HANDLES', x: 30, y: 48 },
      { id: 'cause', emoji: '🏷️', label: 'carried: type + message + cause', x: 72, y: 48 },
      { id: 'finally', emoji: '🧹', label: 'finally: burners OFF, no matter what', x: 22, y: 82 },
      { id: 'twr', emoji: '🔧', label: 'try-with-resources: auto-close, reverse order', x: 66, y: 82 }
    ],
    actors: [
      { id: 'flame', emoji: '💥', label: 'the throw', x: 12, y: 30 }
    ],
    steps: [
      { c: 'Deep in the call stack, lightBurner() hits a gas rupture it cannot handle. It doesn\'t return a quiet error code — it THROWS. Execution stops dead.', p: { light: 'bad' } },
      { c: 'The JVM walks back down the stack. sear() has no catch for a fire — its frame is abandoned, its locals discarded.', p: { sear: 'bad' }, a: { flame: [40, 30] } },
      { c: 'prepareCourse() has no catch either — abandoned. The exception keeps propagating down, frame after frame.', p: { prep: 'bad' }, a: { flame: [68, 30] } },
      { c: 'It reaches Zeff, who wrapped the galley in try { … } catch(KitchenFire). Match! Control jumps here and the fire is HANDLED — service continues.', p: { zeff: 'good' }, a: { flame: [30, 44] } },
      { c: 'What made the fix possible: the thrown object carried its TYPE (a fire, not a spill), a message, and the CAUSE (the ruptured line). A return code carries none of that.', p: { cause: 'lit' } },
      { c: 'However the try exited — triumph or fire — finally runs the cleanup: burners OFF. Only System.exit or a crash could skip it.', p: { finally: 'good' } },
      { c: 'Modern form: declare the burner as a resource and try-with-resources closes it automatically when the block ends, in reverse order of opening — no hand-written finally, and close() failures become suppressed, not lost.', p: { twr: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'A failure\'s life: from throw, up the stack, to a handler',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'The throw',
        nodes: [
          { id: 'detect', text: 'method hits a condition\nit cannot handle' },
          { id: 'throw', text: 'throw new IOException(msg)\nnormal execution stops' }
        ]
      },
      {
        label: 'The unwind',
        nodes: [
          { id: 'frame1', text: 'caller frame\nno matching catch → discarded' },
          { id: 'search', text: 'JVM walks the stack\nlooking for a matching catch' }
        ]
      },
      {
        label: 'Resolution',
        nodes: [
          { id: 'match', text: 'matching catch found\ncontrol jumps to handler' },
          { id: 'nomatch', text: 'no handler anywhere\nthread dies, trace printed' }
        ]
      },
      {
        label: 'Cleanup',
        nodes: [
          { id: 'finally', text: 'finally / close()\nruns however the try exited' },
          { id: 'wrap', text: 'wrap + rethrow\ncause preserved for the trace' }
        ]
      }
    ],
    steps: [
      { active: ['detect'], note: 'A method reaches a state it genuinely can\'t resolve locally — the file is absent, an argument breaks the contract. It refuses to limp on with a bad value or an easily-ignored error code.' },
      { active: ['throw'], note: 'It throws a Throwable object carrying type, message, and optionally a cause. Normal execution halts at this exact point — nothing after the throw in this method runs.' },
      { active: ['frame1'], note: 'The immediate caller has no catch for this type, so its frame is torn down — its local variables vanish — and the search continues downward. This unwinding is the whole mechanism.' },
      { active: ['search'], note: 'The JVM inspects each enclosing frame in turn for a try whose catch matches the thrown type (by assignability, so catch(Exception) matches an IOException). First match wins.' },
      { active: ['match'], note: 'A handler is found; control jumps into its catch block and normal flow resumes from there. The frames between throw and catch are gone — their partial work abandoned.' },
      { active: ['nomatch'], note: 'If NO frame handles it, the exception exits main (or the thread\'s run()), the thread terminates, and the JVM prints the stack trace — the full path from throw to top, your primary diagnostic.' },
      { active: ['finally'], note: 'Any finally block, or a try-with-resources close(), runs regardless of how its try exited — normal, caught, or propagating through. This is where locks release and files close, guaranteed (short of System.exit or a crash).' },
      { active: ['wrap'], note: 'At an abstraction boundary you often catch a low-level exception and rethrow a layer-appropriate one — passing the original as the CAUSE so the complete chain, and its trace, survives up to whoever finally handles it.' }
    ]
  },
  tech: [
    {
      q: 'Checked vs unchecked — the real rule, the rationale, and the modern critique.',
      a: 'Mechanically: an unchecked exception is RuntimeException or any subclass (plus Error); a checked exception is any other subclass of Exception. The compiler rule follows: for a checked exception, a method must either catch it or declare it with throws — the "handle or declare" mandate — and this is verified at compile time; unchecked exceptions carry no such obligation and may propagate silently. The intended rationale is a philosophy about WHO is at fault and whether recovery is reasonable. Checked = an expected, external, recoverable failure the caller should consciously plan for: the file might genuinely not exist (IOException), the query might genuinely fail (SQLException) — the world can go wrong through no bug of yours, so the compiler insists you acknowledge the possibility. Unchecked = a programming error, a violated contract you should fix in code rather than handle at runtime: dereferencing null (NPE), passing an out-of-range index (IndexOutOfBounds), breaking a method\'s documented precondition (IllegalArgument/IllegalState). The mnemonic that sticks: checked = "the world might fail"; unchecked = "you have a bug." The modern critique — and you should voice it, because interviewers respect the nuance — is that checked exceptions scale badly: they leak implementation details up through signatures, tempt developers into the catch-and-swallow anti-pattern just to satisfy the compiler, and interact awkwardly with lambdas and streams (which can\'t propagate checked exceptions through standard functional interfaces). That\'s why Kotlin and Scala abolished them, why Spring wraps checked SQLExceptions into an unchecked DataAccessException hierarchy, and why much modern Java code favours unchecked exceptions for application-level failures. The balanced position: checked for a genuinely recoverable, expected external condition a caller must confront; unchecked for programming errors and for failures no reasonable caller can recover from.'
    },
    {
      q: 'Exactly when does finally run, when is it skipped, and what\'s the return-in-finally trap?',
      a: 'finally runs whenever control leaves the try block by ANY path: normal fall-through, a caught exception (the catch runs, then finally), an uncaught exception propagating through (finally runs as the stack unwinds past this frame, THEN propagation continues), and even a return, break, or continue inside the try (the value/target is computed, held, finally runs, then the transfer completes). The only things that skip it are the ones that stop the JVM or thread from continuing normally at all: System.exit() (terminates the JVM outright — finally never gets its turn), a hard JVM crash or power loss, an infinite loop or blocking call that never returns inside the try, and the thread being killed. That guarantee is why finally is the correct home for releasing resources acquired in the try. The trap is putting a RETURN or a THROW inside finally: because finally runs last and its control transfer wins, a return in finally silently discards whatever the try was returning, and — far worse — a return or throw in finally ABANDONS an exception that was propagating through, swallowing it without trace. Example of the disaster: try { throw new IOException("real problem"); } finally { return -1; } — the IOException simply vanishes and the caller sees a bland -1, with no hint anything failed. So the rule is absolute: finally is for cleanup and cleanup ONLY — never return, throw, or otherwise transfer control out of a finally block. If your cleanup itself can fail, either handle that failure inside the finally locally, or better, use try-with-resources, which manages close() failures correctly via suppression instead of letting them clobber the primary exception.'
    },
    {
      q: 'How does try-with-resources work under the hood, and what are suppressed exceptions?',
      a: 'try-with-resources is syntactic sugar the compiler expands into a try/finally that closes each declared resource. Any object whose type implements AutoCloseable (a single method, void close() throws Exception; Closeable is the IO-specific sub-interface) can be declared in the parentheses: try (var a = open(); var b = open2()) { ... }. The compiler generates code that, on exiting the block by ANY path, calls close() on each resource in REVERSE order of declaration (last opened, first closed — matching acquisition nesting), guaranteeing cleanup without a hand-written finally. The subtle part is what happens when BOTH the body and a close() throw. In old manual try/finally, the finally\'s close() exception would REPLACE the body\'s exception mid-propagation — you\'d lose the real cause and see only the cleanup failure, a genuinely nasty debugging trap. try-with-resources fixes this: the body\'s exception is the PRIMARY one that propagates, and any exception thrown by close() during unwinding is attached to it as a SUPPRESSED exception rather than discarded — retrievable via primary.getSuppressed() and printed in the stack trace under a "Suppressed:" heading. So you see both failures, with the real cause foremost. (If the body completes normally and only close() throws, that close() exception propagates as primary — there\'s nothing to suppress it under.) You can also use effectively-final resource variables declared before the try in modern Java (try (resource) { } without redeclaring). The practical upshot: try-with-resources is strictly better than manual finally-close for anything AutoCloseable — shorter, correct for multiple resources, and honest about cleanup failures — so it\'s the default, and hand-rolled close-in-finally is a smell in new code.'
    },
    {
      q: 'When should I write a custom exception, and how do I rethrow across a layer without destroying the diagnosis?',
      a: 'Write a custom exception when a distinct failure needs distinct HANDLING or a distinct TYPE in an API you own — callers of your storage layer should be able to catch StorageException specifically without knowing (or coupling to) whether it came from SQL, a file, or a remote call; a parser that can fail in a domain-meaningful way benefits from a ParseException carrying the line number. Do NOT manufacture a bespoke class for every error site: the JDK already names most failures precisely — IllegalArgumentException (bad argument), IllegalStateException (object in the wrong state for this call), UnsupportedOperationException (this operation isn\'t provided), NoSuchElementException, NumberFormatException — and reaching for these communicates more than a novel one-off class. When you do define one, extend RuntimeException for application-level failures (don\'t inflict a checked exception on every caller unless recovery is genuinely expected of them), give it constructors that accept a message AND a cause (super(message, cause)), and add fields only for data a handler will actually use. Crossing an abstraction boundary is where the cause matters most: catch the low-level exception and rethrow a layer-appropriate one WITH the original chained — catch (SQLException e) { throw new StorageException("saving log " + id + " failed", e); }. That second argument is the cause; it preserves the entire underlying stack trace under a "Caused by:" section, so the diagnosis survives from the SQL driver all the way up to your log. Dropping it — throw new StorageException("save failed") with no cause — is a real bug: you\'ve told the reader something broke while destroying the evidence of what. Two related sins to avoid: catching an exception only to log-and-swallow it (the failure vanishes; if you can\'t handle it, don\'t catch it), and catching an exception only to rethrow a new one WITHOUT the cause (same evidence destruction). Wrap to change the abstraction level; always carry the cause.'
    }
  ],
  code: {
    title: 'Importing a log file — where LogPose meets the messy world',
    intro: 'Reading external files is exactly where checked exceptions, try-with-resources, fail-fast validation, and wrap-and-rethrow all show up at once. This importer reads log lines, validates each, and reports failures without ever losing the cause.',
    code: `import java.io.*;
import java.nio.file.*;
import java.util.*;

// A domain exception: callers catch THIS, not the raw IOException/parse guts underneath.
class ImportException extends RuntimeException {
    ImportException(String message, Throwable cause) {
        super(message, cause);              // carry the cause — never drop it
    }
}

// Thrown for a malformed line — an unchecked contract violation in the input.
class LineFormatException extends RuntimeException {
    LineFormatException(String message) { super(message); }
}

public class LogImporter {

    // Parse one "title|minutes" line, failing fast on anything malformed.
    static String parseLine(String line, int lineNo) {
        String[] parts = line.split("\\\\|");
        if (parts.length != 2)              // validate at the boundary
            throw new LineFormatException("line " + lineNo + ": expected 'title|minutes'");
        String title = parts[0].strip();
        if (title.isBlank())
            throw new LineFormatException("line " + lineNo + ": blank title");
        try {
            int minutes = Integer.parseInt(parts[1].strip());
            if (minutes < 0)
                throw new LineFormatException("line " + lineNo + ": negative minutes");
            return title + " (" + minutes + "m)";
        } catch (NumberFormatException e) {
            // wrap the low-level cause in a domain-meaningful failure
            throw new LineFormatException("line " + lineNo + ": minutes not a number");
        }
    }

    static List<String> importFrom(Path path) {
        List<String> entries = new ArrayList<>();
        // try-with-resources: reader.close() is called automatically, in reverse order,
        // however this block exits — normal or exceptional.
        try (BufferedReader reader = Files.newBufferedReader(path)) {
            String line;
            int lineNo = 0;
            while ((line = reader.readLine()) != null) {
                lineNo++;
                if (line.isBlank()) continue;
                entries.add(parseLine(line, lineNo));   // may throw LineFormatException
            }
        } catch (IOException e) {
            // checked exception from the file layer — wrap into our domain type,
            // PRESERVING the cause so the full trace survives.
            throw new ImportException("could not read log file " + path, e);
        }
        return entries;
    }

    public static void main(String[] args) throws IOException {
        Path tmp = Files.createTempFile("logpose", ".txt");
        Files.writeString(tmp, "Flaky-test triage|90\\n\\nEmbedding cache|45\\n");
        try {
            List<String> imported = importFrom(tmp);
            imported.forEach(System.out::println);
        } catch (LineFormatException e) {
            System.err.println("bad input: " + e.getMessage());   // narrow catch, handled
        } finally {
            Files.deleteIfExists(tmp);   // cleanup runs no matter what
        }
    }
}`,
    notes: [
      'try-with-resources closes the BufferedReader automatically — no finally needed for it, and if both the loop body and close() threw, the body\'s exception would win with close()\'s attached as suppressed.',
      'importFrom catches the CHECKED IOException and rethrows an unchecked ImportException WITH the cause (e), so callers get a clean domain type while the underlying stack trace survives under "Caused by:".',
      'parseLine fails fast at the boundary with specific, line-numbered messages — the failure names itself instead of surfacing later as an untraceable NPE deep in the app. The main\'s catch is narrow (LineFormatException), and the finally deletes the temp file whether import succeeded or blew up.'
    ]
  },
  lab: {
    title: 'A safe divide, done three ways wrong and one way right',
    prompt: 'Practise the whole discipline on a tiny function. Write a method <code>static int safeParseRatio(String a, String b)</code> that parses two strings to ints and returns <code>a/b</code>, but: (1) throw <code>IllegalArgumentException</code> with a clear message if either string is null or blank (fail fast at the boundary); (2) wrap a <code>NumberFormatException</code> from parsing into an <code>IllegalArgumentException</code> that PRESERVES the cause (pass it as the second constructor arg); (3) let a divide-by-zero <code>ArithmeticException</code> propagate — do NOT catch it (it\'s the caller\'s contract to avoid). Do NOT write an empty catch anywhere. In a comment, state why catching <code>Exception</code> broadly here would be wrong.',
    starter: `class Ratios {
    static int safeParseRatio(String a, String b) {
        // 1) fail fast: null/blank a or b -> IllegalArgumentException with a message

        // 2) parse both; wrap NumberFormatException into IllegalArgumentException WITH the cause

        // 3) return the division; let ArithmeticException (divide by zero) propagate uncaught
        return 0; // replace
    }
}

// Q: why would catch (Exception e) around the whole body be the wrong choice here?
// ANSWER:`,
    checks: [
      { re: 'static\\s+int\\s+safeParseRatio', must: true, hint: 'Declare static int safeParseRatio(String a, String b).', pass: 'signature ✓' },
      { re: '(isBlank|isEmpty|==\\s*null|null\\s*==)', must: true, hint: 'Fail fast: check for null or blank inputs at the top.', pass: 'boundary validation ✓' },
      { re: 'throw\\s+new\\s+IllegalArgumentException', must: true, hint: 'Throw IllegalArgumentException for the bad-input cases.', pass: 'IllegalArgumentException thrown ✓' },
      { re: 'catch\\s*\\(\\s*NumberFormatException', must: true, hint: 'Catch the NumberFormatException from parsing specifically.', pass: 'narrow catch of NumberFormatException ✓' },
      { re: 'new\\s+IllegalArgumentException\\s*\\([^)]*,\\s*\\w+\\s*\\)', must: true, hint: 'Wrap it preserving the cause: new IllegalArgumentException(message, e) — two arguments.', pass: 'cause preserved ✓' },
      { re: 'catch\\s*\\(\\s*(Exception|Throwable)\\b', must: false, hint: 'Do NOT catch Exception or Throwable broadly — catch only the specific type you handle.', pass: 'no over-broad catch ✓' },
      { re: 'catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}', must: false, hint: 'No empty catch blocks — never swallow a failure silently.', pass: 'no swallowed exceptions ✓' },
      { re: 'ANSWER\\s*:\\s*\\S+', must: true, hint: 'Answer the comment: catching Exception broadly would also swallow the ArithmeticException you meant to let propagate, and hide bugs.', pass: 'rationale given ✓' }
    ],
    run: 'put Ratios and a main into <code>Ratios.java</code>; <code>javac Ratios.java &amp;&amp; java Ratios</code>. Call it with good input, a non-number, a blank, and a zero denominator — watch the divide-by-zero trace propagate uncaught (that\'s correct) while the bad inputs throw clean, specific messages.',
    solution: `class Ratios {
    static int safeParseRatio(String a, String b) {
        if (a == null || a.isBlank() || b == null || b.isBlank())
            throw new IllegalArgumentException("inputs must be non-blank: a=" + a + ", b=" + b);
        int x, y;
        try {
            x = Integer.parseInt(a.strip());
            y = Integer.parseInt(b.strip());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("both inputs must be integers", e); // cause preserved
        }
        return x / y;   // divide-by-zero ArithmeticException propagates uncaught, by design
    }
}

// ANSWER: catch (Exception e) would also swallow the ArithmeticException we deliberately let
// propagate AND any unforeseen bug (NPE, etc.), collapsing distinct failures into one blind
// handler and destroying the caller's ability to react to them differently. Catch only what
// you can actually handle.`,
    notes: [
      'The divide-by-zero is left uncaught on purpose: it\'s an unchecked ArithmeticException signalling the caller broke the precondition (b != 0). Catching it here would hide a caller bug — fail fast, let it surface.',
      'The NumberFormatException is wrapped into an IllegalArgumentException with the cause, so the caller sees one coherent "bad input" abstraction while the original parse failure stays chained under "Caused by:".',
      'Every catch is narrow and none is empty — the two rules that separate exception hygiene from exception theatre. If you can\'t handle it, don\'t catch it.'
    ]
  },
  quiz: [
    {
      q: 'A method throws an exception no enclosing frame catches. What happens?',
      options: ['It propagates down the entire call stack, discarding each unhandled frame; if it reaches the bottom uncaught, the thread terminates and the JVM prints the stack trace', 'The method silently returns null and execution continues', 'The JVM automatically retries the method', 'It is stored and thrown again on the next method call'],
      correct: 0,
      explain: 'Sanji\'s "GAS LEAK!" abandons sear() and prepareCourse() frame by frame until a catch matches — or, if none does anywhere, the thread dies and the trace (the path from throw to top) is printed. Reading that trace top-down is your primary diagnostic.'
    },
    {
      q: 'Which is a CHECKED exception, and what does that mean for the compiler?',
      options: ['IOException — the compiler forces you to either catch it or declare throws IOException, because it represents an expected, recoverable external failure', 'NullPointerException — the compiler forces you to catch it', 'ArithmeticException — you must declare it in your signature', 'IllegalArgumentException — the compiler requires a try/catch around it'],
      correct: 0,
      explain: 'Checked = "the world might fail, plan for it" — IOException, SQLException — handle-or-declare enforced at compile time. The three distractors are all RuntimeExceptions (unchecked): programming bugs the compiler does NOT force you to handle.'
    },
    {
      q: 'When does a finally block NOT run?',
      options: ['Only in drastic cases: System.exit(), a JVM crash, an infinite loop or thread kill inside the try — otherwise it runs on every exit path including return and propagating exceptions', 'Whenever the try block throws an exception', 'Whenever the try block returns a value', 'Whenever a catch block handles the exception'],
      correct: 0,
      explain: 'finally is the cleanup guarantee — it runs on normal completion, caught exceptions, propagating exceptions, and even a return inside try. Only System.exit or a crash skips it. Sheldon\'s nightly routine runs no matter how the day went.'
    },
    {
      q: 'The body of a try-with-resources throws, AND the resource\'s close() also throws. What does the caller see?',
      options: ['The body\'s exception propagates as primary, with the close() exception attached to it as a "suppressed" exception (via getSuppressed) — both are visible, the real cause foremost', 'Only the close() exception — it replaces the body\'s', 'Only the body\'s exception — the close() one is silently discarded', 'Both are thrown simultaneously as a combined exception'],
      correct: 0,
      explain: 'This is exactly the masking bug that plagued manual try/finally, and why try-with-resources exists: the primary failure wins, the cleanup failure is preserved as suppressed rather than lost. You see both, real cause first.'
    },
    {
      q: 'You catch a SQLException at your storage layer and want callers to see a clean StorageException. The correct rethrow?',
      options: ['throw new StorageException("save failed", e) — passing the original as the cause, so the full underlying trace survives under "Caused by:"', 'throw new StorageException("save failed") — the cause is noise the caller doesn\'t need', 'catch (SQLException e) { } — swallow it and return a default', 'Log the SQLException and return null'],
      correct: 0,
      explain: 'Wrap to change abstraction level; ALWAYS carry the cause. Dropping e destroys the evidence of what actually failed — the same evidence-destruction sin as swallowing. Sheldon relays "my week is ruined" but preserves the original "store was out of stock" underneath.'
    }
  ],
  testFlow: {
    title: 'Test yourself: failures under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'Your method receives a null argument that its contract forbids. Throw a checked or unchecked exception, and which?',
        choices: [
          { text: 'Unchecked — an IllegalArgumentException (or NullPointerException), thrown fast at the boundary: a violated precondition is a caller BUG to fix, not an external condition to plan handling for', to: 'q1_right' },
          { text: 'Checked — declare throws on the method so every caller must handle the null case', to: 'q1_wrong_checked' },
          { text: 'Neither — return null and let the caller notice later', to: 'q1_wrong_null' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Unchecked, fast, at the boundary: a broken precondition is "you have a bug", and the fix is in the caller\'s code, not a runtime handler. Penny in the spot — thrown instantly, no ceremony. IllegalArgumentException / NullPointerException are exactly for this.', next: 'q2' },
      q1_wrong_checked: { end: true, correct: false, text: 'Forcing every caller to handle a programming error via a checked exception is the checked/unchecked line drawn backwards — you\'d push catch-boilerplate everywhere for a bug that should simply be fixed. Programming errors are unchecked, thrown fast.', retry: 'q1' },
      q1_wrong_null: { end: true, correct: false, text: 'Returning null on a contract violation is the opposite of fail-fast: the bad state travels far from its origin and detonates later as a sourceless NPE. Throw at the boundary, where the mistake actually is.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'You need to close a file whether or not the read succeeds. Hand-written try/finally with close(), or try-with-resources?',
        choices: [
          { text: 'try-with-resources — it closes automatically in reverse order, handles multiple resources cleanly, and turns a close() failure into a suppressed exception instead of one that masks the real cause', to: 'q2_right' },
          { text: 'Hand-written try/finally — more explicit and therefore safer', to: 'q2_wrong_finally' },
          { text: 'Neither — files close themselves when they go out of scope', to: 'q2_wrong_gc' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'try-with-resources is strictly better for anything AutoCloseable: shorter, correct for nested resources, and honest about cleanup failures via suppression. Hand-rolled close-in-finally is a smell in new code precisely because it can mask the primary exception.', next: 'q3' },
      q2_wrong_finally: { end: true, correct: false, text: '"More explicit" here means more error-prone: a close() that throws in your finally can REPLACE the real exception mid-propagation, hiding the actual cause. try-with-resources solves exactly this with suppressed exceptions. Prefer it.', retry: 'q2' },
      q2_wrong_gc: { end: true, correct: false, text: 'Java has no destructors and finalization is unreliable and deprecated — a file is NOT closed just because its variable goes out of scope. You must close explicitly; try-with-resources does it for you, guaranteed, on every exit path.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'Reviewing a teammate\'s code you find: catch (IOException e) { }. What\'s the problem and the fix?',
        choices: [
          { text: 'It swallows the failure silently — the IOException vanishes with no log, no rethrow, no handling, so the bug detonates later with no trace. Either handle it meaningfully, or don\'t catch it and let it propagate', to: 'q3_right' },
          { text: 'Nothing — an empty catch is a clean way to ignore errors you don\'t care about', to: 'q3_wrong_fine' },
          { text: 'The only fix is to add a System.out.println inside the catch', to: 'q3_wrong_print' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'The empty catch is the cardinal sin: a failure happened and the code pretended it didn\'t, destroying the evidence and deferring the crash to somewhere sourceless. If you can genuinely handle it, do; if you can\'t, don\'t catch it — let it propagate to someone who can.', next: null },
      q3_wrong_fine: { end: true, correct: false, text: 'Ignoring an error is exactly how a small, diagnosable failure becomes a large, untraceable one later. Sheldon would never swallow an exception, and neither should this code. Handle it, or let it propagate — never silence it.', retry: 'q3' },
      q3_wrong_print: { end: true, correct: false, text: 'A bare println is barely better than swallowing — it loses the stack trace, clutters stdout, and still doesn\'t HANDLE anything. Either recover meaningfully (with the exception logged properly, including its trace) or rethrow/propagate. Don\'t just whisper about it.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Swallowing exceptions in an empty catch block — the failure vanishes and the bug detonates later, sourceless. If you can\'t handle it, don\'t catch it; if you catch it, handle or rethrow (with the cause).',
    'Catching Exception or Throwable broadly — you also catch the Errors, bugs, and control-flow exceptions you never meant to touch, collapsing distinct failures into one blind handler. Catch the narrowest type you can actually handle.',
    'return or throw inside a finally block — it overrides whatever the try was doing, silently discarding a return value or, far worse, swallowing an exception mid-propagation. finally is for cleanup only.',
    'Dropping the cause when wrapping — throw new StorageException("failed") without the original exception destroys the diagnostic chain. Always pass the cause: new StorageException("failed", e).',
    'Using exceptions for ordinary control flow — throwing to break out of a loop or signal a normal "not found" is slow (stack-trace capture is costly) and obscures intent. Reserve exceptions for exceptional conditions; return an Optional or a sentinel for expected absence.',
    'Hand-written finally to close resources in new code — verbose, and a throwing close() can mask the real exception. Use try-with-resources for anything AutoCloseable; it closes in reverse order and preserves the primary failure via suppression.'
  ],
  interview: [
    {
      q: 'Explain checked versus unchecked exceptions — the rule, the reasoning, and your own view.',
      a: 'The mechanical rule: unchecked exceptions are RuntimeException and its subclasses (plus the Error branch); checked exceptions are all other subclasses of Exception. The compiler enforces "handle or declare" for checked exceptions — a method that might throw one must either catch it or list it in a throws clause — and imposes no such requirement on unchecked ones. The reasoning behind the line is about fault and recoverability: checked signals an EXPECTED, EXTERNAL, RECOVERABLE failure the caller should consciously plan for (the file may not exist, the network may drop — IOException, SQLException), so the compiler makes you acknowledge it; unchecked signals a PROGRAMMING ERROR — a violated contract you should fix in code, not handle at runtime (NullPointerException, IllegalArgumentException, IndexOutOfBoundsException). My mnemonic: checked = "the world might fail"; unchecked = "you have a bug". My own view, which I\'d offer because the topic is genuinely debated: checked exceptions were a well-intentioned experiment that scales poorly — they leak implementation details up through signatures, push developers toward catch-and-swallow just to satisfy the compiler, and don\'t compose with lambdas and streams. That\'s why Kotlin and Scala dropped them, why Spring translates checked SQLExceptions into an unchecked DataAccessException hierarchy, and why modern Java tends to favour unchecked for application-level failures. The balanced practice: use checked only for a genuinely recoverable, expected external condition a caller must confront and can act on; use unchecked for programming errors and for failures no reasonable caller can recover from — and never catch a checked exception just to silence it.'
    },
    {
      q: 'Walk me through what happens, step by step, when an exception is thrown and not caught locally.',
      a: 'The moment throw executes, normal execution in that method stops — nothing after the throw runs. The JVM begins stack unwinding: it looks at the current frame for an enclosing try whose catch clause matches the thrown type by assignability (catch (IOException) matches an IOException or any subclass; catch (Exception) matches almost anything under Exception). If a match exists, control transfers into that catch block, any associated finally runs, and normal execution resumes after the try/catch. If NO match exists in the current frame, that frame is torn down — its local variables and partially-completed work discarded — but not before any finally block in that frame executes as the exception passes through (finally runs on the propagation path too). Then the search continues in the CALLER\'s frame, and its caller, and so on down the stack. If the exception reaches the bottom of the stack — escaping main, or the run() of a thread — without any frame handling it, the thread terminates and the default uncaught-exception handler prints the stack trace to stderr: the ordered list of frames from where it was thrown (top) down to where it escaped, plus any "Caused by:" chains from wrapped causes and "Suppressed:" entries from try-with-resources. That trace is the single most valuable diagnostic in Java — read top-down, the first line is the actual failure and the frames beneath show the path that led there. Two refinements worth mentioning: finally blocks and try-with-resources close() calls fire during this unwinding, guaranteeing cleanup even on the way out; and an uncaught exception in one thread kills only that thread (unless it\'s the main thread and no non-daemon threads remain), not the whole JVM.'
    },
    {
      q: 'How does try-with-resources improve on try/finally, and what are suppressed exceptions?',
      a: 'try/finally for resource cleanup has two chronic problems that try-with-resources solves. First, verbosity and error-proneness: closing multiple resources correctly requires nested try/finally blocks (a pyramid), each with its own null check, and it\'s easy to get the order or the null handling wrong. try-with-resources lets you declare resources in the parentheses — try (var a = open(); var b = open2()) { ... } — and the compiler generates code that calls close() on each, in REVERSE order of declaration, on every exit path, with no hand-written finally. Any type implementing AutoCloseable qualifies. Second, and more subtle, is the masking problem: in a manual try/finally, if the body throws exception A and then the finally\'s close() throws exception B, exception B REPLACES A as it propagates — you lose the real cause (A) and see only the cleanup failure (B), a genuinely nasty debugging trap. try-with-resources fixes this with SUPPRESSED exceptions: the body\'s exception A propagates as the PRIMARY, and B (from close() during unwinding) is attached to A via addSuppressed() rather than discarded — retrievable through A.getSuppressed() and printed in the stack trace under a "Suppressed:" heading. So both failures are visible, with the real cause foremost. (If the body completes normally and only close() throws, that exception propagates as primary — nothing to suppress it.) The net result: for anything AutoCloseable, try-with-resources is shorter, correct for multiple resources, and honest about cleanup failures — so it\'s the default in modern Java, and a hand-written close() in a finally is a code smell.'
    },
    {
      q: 'Give me your rules for good exception design — throwing, catching, and defining custom exceptions.',
      a: 'A handful of disciplines. THROWING — fail fast: validate at the boundary and throw the instant a contract is violated (IllegalArgumentException for a bad argument, IllegalStateException for a wrong-state call), so the failure surfaces AT the mistake rather than deep downstream as a sourceless NPE; throw exceptions carrying a specific, actionable message. CATCHING — catch narrow: catch the most specific type you can genuinely handle, never Exception or Throwable broadly (which swallows Errors, bugs, and control-flow exceptions you didn\'t mean to touch); never swallow — an empty catch is the cardinal sin, because it destroys the failure evidence and defers the crash to somewhere untraceable, so if you can\'t handle it, don\'t catch it and let it propagate to someone who can. WRAPPING — when you cross an abstraction boundary, catch the low-level exception and rethrow a layer-appropriate one, ALWAYS passing the original as the cause (new StorageException(msg, e)) so the full trace survives under "Caused by:"; wrapping without the cause is evidence-destruction just like swallowing. DEFINING custom exceptions — do it when a distinct failure needs distinct handling or a distinct type in an API you own (StorageException so callers catch storage failures without coupling to SQL); don\'t manufacture one per error site, since the JDK already names most failures precisely (IllegalArgument/IllegalState/UnsupportedOperation/NoSuchElement); when you do, extend RuntimeException for application-level failures unless recovery is genuinely expected of callers, and provide constructors taking both a message and a cause. Two more: don\'t use exceptions for ordinary control flow (they\'re costly and obscure intent — return Optional or a sentinel for expected absence), and prefer try-with-resources over manual finally for cleanup. The through-line is that exceptions are a diagnostic and control mechanism — every rule serves keeping the diagnosis intact and the control flow honest.'
    }
  ]
};
