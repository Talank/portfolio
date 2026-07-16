window.LESSONS = window.LESSONS || {};
window.LESSONS['unit-testing-junit5'] = {
  id: 'unit-testing-junit5',
  title: 'Unit Testing with JUnit 5: Assertions, Lifecycle, Parameterized Tests',
  category: 'Part 7 — Testing',
  timeMin: 55,
  summary: 'Every lab in this course so far has been checked by hand, or by the site\'s own regex-based lab checker — a stand-in for what a real Java project actually uses: JUnit 5 (the "Jupiter" API), the standard framework for writing automated tests that run in milliseconds and can be re-run thousands of times without a human watching. This lesson covers @Test and JUnit 5\'s assertion library, the test lifecycle (@BeforeEach/@AfterEach/@BeforeAll/@AfterAll and the crucial "fresh instance per test method" default), parameterized tests for running one test body against many inputs, and — because this course is specifically preparing you for work adjacent to your own flaky-test research — an explicit, sustained thread connecting JUnit\'s lifecycle guarantees to WHY tests go flaky in the first place: shared mutable state leaking between tests that are supposed to be independent.',
  goals: [
    'Write a JUnit 5 test class using @Test and the core Assertions methods (assertEquals, assertTrue, assertThrows, assertAll), and explain the arrange-act-assert structure',
    'Explain JUnit 5\'s default test lifecycle: a fresh test-class instance per @Test method, and what @BeforeEach/@AfterEach/@BeforeAll/@AfterAll each guarantee about ordering',
    'Write parameterized tests using @ParameterizedTest with @ValueSource, @CsvSource, and @MethodSource to run one test body against many inputs without duplicating code',
    'Explain assertThrows precisely (what it captures, what it does NOT check) and use assertAll to report every failing assertion in a group instead of stopping at the first',
    'Explain, concretely, how JUnit\'s default per-method fresh-instance lifecycle prevents a specific, common class of flaky test caused by state leaking between tests'
  ],
  concept: [
    {
      h: 'What a unit test is, and the arrange-act-assert shape almost all of them share',
      p: [
        'Every lab in this course has been "tested" by a human reading output, or by this site\'s regex-based checker looking at your submitted source text — useful for a browser-based tutorial, but not how real Java projects verify correctness. A UNIT TEST is a small, automated piece of code that exercises one focused piece of behavior (a "unit" — typically one method, or one small cluster of closely related methods on one class) and automatically reports pass or fail, with no human needing to read output and judge it. The overwhelming majority of unit tests share one structural shape, often called ARRANGE-ACT-ASSERT: ARRANGE sets up whatever the test needs (create an object, prepare some input data), ACT invokes the one specific behavior actually being tested (call a method), and ASSERT checks the actual outcome against the expected one, failing the test loudly and specifically if they don\'t match.',
        'JUnit 5 (also called "JUnit Jupiter," the current generation of the JUnit framework, replacing JUnit 4) provides the machinery for this: a @Test annotation marking a method as a test case, a library of Assertions static methods for the assert step, and — the part this lesson spends real time on — a well-defined LIFECYCLE governing exactly when and how many times setup and teardown code runs relative to each test. The jvm-tools-reflection lesson\'s MiniRunner class showed roughly thirty lines of reflection-based code that finds @Include-annotated methods and runs them, catching and reporting failures — that WAS, deliberately, a miniature reimplementation of exactly what JUnit does at its core, minus the twenty-plus years of assertion libraries, lifecycle guarantees, parameterization, and tooling integration a real framework adds on top.'
      ]
    },
    {
      h: 'Assertions: assertEquals, assertTrue, assertThrows, and assertAll',
      p: [
        'JUnit 5\'s core assertion library lives in org.junit.jupiter.api.Assertions, imported as static methods so tests read as plain calls like assertEquals(expected, actual) rather than needing an Assertions. prefix. The most common ones: assertEquals(expected, actual) (fails with a message showing BOTH values if they differ — note the argument order matters for the failure message\'s readability, expected first), assertTrue(condition)/assertFalse(condition) for boolean checks, assertNull(value)/assertNotNull(value), and — a genuinely easy trap for anyone coming from other languages — assertEquals on two double or float values should almost always use the three-argument overload assertEquals(expected, actual, delta), since floating-point values that are mathematically "equal" in intent frequently differ by a tiny representable rounding error, and a plain two-argument assertEquals on doubles compares for EXACT bitwise equality, producing a test that fails unpredictably depending on the exact arithmetic path that produced the actual value.',
        'assertThrows(ExceptionClass.class, executable) is how JUnit 5 verifies that code THROWS an expected exception — it takes a lambda (or method reference) representing the code under test, runs it, and either the expected exception type was thrown (the test passes, and assertThrows itself returns the caught exception instance, letting you make FURTHER assertions on its message or cause) or it wasn\'t (a wrong exception type, or no exception at all — either way, the test fails with a clear message explaining which). This directly builds on the exceptions lesson\'s discipline: a test verifying that LogImporter throws an IOException wrapping a specific cause can call assertThrows, then assert on the returned exception\'s getCause() to confirm the wrap-preserve-cause pattern was actually followed, not just that SOME exception was thrown. assertAll(executables...) solves a specific, common annoyance: normally, the FIRST failing assertion in a test method immediately stops that method (via a thrown AssertionError), so if a test has five separate assertions and the first one fails, you only ever see that one failure — fix it, re-run, discover the SECOND one also fails, fix it, re-run again. assertAll groups several assertions together and runs ALL of them regardless of earlier failures, then reports every failure that occurred at once — a much faster feedback loop when checking multiple properties of one result object.'
      ]
    },
    {
      h: 'The test lifecycle: a FRESH instance per test method by default',
      p: [
        'This is the single most consequential JUnit 5 default to understand precisely, and it has a direct line to the user\'s own flaky-test research: by default, JUnit creates a BRAND NEW instance of the test class for EVERY single @Test method — not one shared instance reused across all the test methods in a class. This means any non-static instance field in a test class starts completely fresh for each test, with no possibility of one test\'s mutations to that field being visible to a DIFFERENT test method, even though they\'re both "in the same test class." @BeforeEach marks a method that runs before EVERY @Test method, on that test\'s own fresh instance — the idiomatic place to do ARRANGE-step setup that would otherwise be duplicated at the top of every single test method (creating a fresh Backlog, say, so each test starts from a known, empty state). @AfterEach runs after every @Test method, used for cleanup (closing a resource opened in @BeforeEach) and running even if the test method itself threw an exception or failed an assertion.',
        '@BeforeAll and @AfterAll are different in an important, sharp way: they run ONCE for the whole test class, not once per test method — and because a single static context is shared across every instance JUnit creates for that class, methods annotated @BeforeAll/@AfterAll MUST be static (by default; JUnit 5 has a per-class lifecycle mode that relaxes this, but the per-method default forces it) — the framework literally cannot associate a "runs once before ANY instance exists yet" method with any one particular instance. @BeforeAll is the right (and only really correct) place for GENUINELY expensive, GENUINELY read-only setup shared safely across every test in a class — starting a Testcontainers database container is the canonical example, arriving fully in Part 7\'s integration-testing lesson — precisely BECAUSE it is read-only: if a @BeforeAll-created resource were ever MUTATED by one test, every other test sharing that same resource would see that mutation too, silently reintroducing the exact cross-test contamination the per-method fresh-instance default exists to prevent.'
      ]
    },
    {
      h: 'Why this lifecycle default is a flaky-test defense mechanism, not just a convenience',
      p: [
        'The how-java-fits-together and jvm-architecture lessons both planted a specific flaky-test root cause early in this course: a static field mutated by one test silently affecting the OUTCOME of a different test, with the failure depending on which order the tests happened to run in — pass in isolation, fail (or pass) differently when run as part of a full suite, exactly the signature of a genuinely flaky test that a research-focused reader would recognize immediately. JUnit 5\'s fresh-instance-per-test default is a direct, structural defense against HALF of this problem: any INSTANCE field on a test class is automatically, unconditionally reset for every test, by construction, with no discipline required from the test author to make that true — you cannot accidentally forget to reset an instance field between tests, because there IS no "between tests" for an instance field; each test gets its own object entirely.',
        'What this default does NOT protect against, and what remains a real, common source of order-dependent flakiness in real Java test suites: STATIC fields (shared across every instance, and therefore across every test, exactly like the how-java-fits-together lesson\'s static counter example), and MUTABLE STATE OUTSIDE THE TEST CLASS ENTIRELY — a shared database row, a file on disk, a singleton service holding cached state, a system property set by one test and never reset. A test suite that passes reliably when a JUnit test class relies purely on fresh instance fields and genuinely stateless collaborators, but goes flaky the moment two tests touch a SHARED static cache or a SHARED database table without properly isolating or resetting it between runs, is demonstrating exactly this boundary in practice — the framework\'s default protects the part of the state graph it actually owns (instance fields on the test object itself) and cannot protect state that lives anywhere else, which is precisely why test isolation discipline (careful @BeforeEach/@AfterEach cleanup of shared external resources, or avoiding shared mutable statics in the code under test altogether) remains a real skill test authors need, not something JUnit\'s defaults make automatic everywhere.'
      ]
    },
    {
      h: 'Parameterized tests: one test body, many inputs, without duplicating code',
      p: [
        'A plain @Test method runs exactly once, with any input values hardcoded directly in the ARRANGE step. Often the actual behavior being verified genuinely needs checking against SEVERAL different inputs — boundary values, a few representative "normal" cases, a known-tricky edge case — and writing a separate, nearly-identical @Test method for each one is exactly the kind of repetition the streams and lambdas lessons\' "don\'t repeat structurally identical code" instinct should object to. @ParameterizedTest replaces @Test on a method that accepts one or more PARAMETERS, and is paired with a SOURCE annotation supplying the actual argument values the method will be invoked with, once per value (or tuple of values) — the framework runs the exact same test BODY multiple times, once per supplied input, reporting each run as its own separate pass/fail result.',
        'The most common sources: @ValueSource(strings = {...}) (or ints/longs/doubles/booleans — a flat list of single values, each becoming one invocation of a method with one matching parameter), @CsvSource({"a,1", "b,2"}) (comma-separated rows, each row unpacked into multiple parameters — useful when a test needs an INPUT and its matching EXPECTED OUTPUT together, e.g. "ideaTitle,expectedWordCount" pairs), @MethodSource("someMethodName") (points at a separate method in the test class, returning a Stream/List of arguments, for cases too complex or too dynamically generated to express as a flat literal list — e.g. supplying actual LogEntry or Idea domain objects rather than primitive values), and @EnumSource(SomeEnum.class) (runs the test once per constant of a given enum, directly connecting to the records-sealed-pattern-matching lesson\'s enum/sealed-type material — e.g. running an identical assertion for every value of a ReviewStatus enum without listing them by hand).'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Galley-La\'s one-plank stress rig, tested fresh — never against yesterday\'s dents',
      text: 'Before Galley-La ever bolts a single plank onto a hull, Paulie runs it through a stress-testing rig — ONE plank at a time, in complete isolation from the rest of the ship, deliberately BEFORE it\'s ever combined with anything else (a unit test: one small piece of behavior, checked alone). The routine never varies: clamp the plank in (arrange), apply the rated load (act), read the gauge against the spec sheet and mark pass or fail (assert). Here\'s Paulie\'s one absolute rule, drilled into every apprentice: the rig gets WIPED CLEAN and RESET before every single plank, with zero exceptions — no plank is ever tested against a rig still bearing yesterday\'s stress-fractures or another plank\'s leftover strain, because a rig quietly carrying damage from a PREVIOUS test would make a perfectly good plank fail (or a genuinely cracked one pass) depending purely on which order the planks happened to go through that day — exactly the kind of result nobody in the yard trusts. Some checks genuinely ARE safe to share across the whole day\'s batch — the crane that lifts each plank into the rig gets calibrated ONCE each morning, not re-calibrated before every single plank, precisely because calibrating it is read-only and doesn\'t change from one plank\'s test to the next. And for a batch of a hundred similar dock-bolts that all need the identical stress check, Paulie doesn\'t write a hundred separate inspection sheets by hand — he runs the SAME rig, the SAME procedure, once per bolt from a supply crate, logging each bolt\'s own pass/fail individually without duplicating the inspection routine itself for every single one.',
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s cooking-competition tasting stations, reset between every single dish',
      text: 'When Monica judges a cooking competition, she never tastes a contestant\'s dish on the same palate she just used for the LAST dish — every single tasting happens at its own clean station, with a fresh water rinse and a completely blank palate before the next dish even arrives (a fresh test-class instance per @Test — no leftover flavor carried from one test into the next). The routine is identical every time: plate the dish (arrange), take the bite (act), score it against the rubric and write the verdict (assert). Monica is fanatical about one specific rule: if a contestant\'s dish scores differently depending on whether it happened to be tasted RIGHT AFTER a heavily garlic-spiced dish versus tasted first thing in the morning, that\'s not a real result — that\'s contamination leaking from one test into another, and she throws that score out and re-tastes on a genuinely clean palate, because a fair verdict can never depend on tasting ORDER. Some setup genuinely doesn\'t need repeating per dish, though — she calibrates the room\'s lighting and checks the scoring rubric itself is legible ONCE, before the whole competition starts, not before every single plate, because that setup is read-only and identical for every contestant regardless of order. And when the competition has twelve contestants all making the SAME assigned dish, Monica doesn\'t reinvent her tasting checklist twelve separate times from scratch — she runs the exact same scoring procedure once per contestant\'s plate, recording each verdict separately without duplicating the rubric itself for every single one.',
    },
    why: 'The one-plank rig, wiped clean before every test, is JUnit 5\'s default fresh-instance-per-@Test-method lifecycle — no state leaks from one test into the next by construction. Clamp-load-read is arrange-act-assert. The once-a-morning crane calibration is @BeforeAll (runs once, must stay read-only, or it silently reintroduces the exact cross-test contamination fresh instances exist to prevent). A result that depends on which order planks/dishes were tested is precisely the order-dependent flakiness a fresh-per-test default is designed to make structurally impossible for instance-level state — while both stories\' "the crane/rubric is shared and read-only" line is a deliberate reminder that SHARED state (a static field, a shared resource) is exactly what the default does NOT protect, and still needs real care. And running one identical procedure across a whole batch of bolts/contestants without rewriting it each time is a parameterized test.'
  },
  storyAnim: {
    title: 'The wiped-clean rig, the once-a-morning calibration, and the shared-procedure batch',
    h: 320,
    props: [
      { id: 'rig', emoji: '🔧', label: 'stress rig, wiped clean before EVERY plank (fresh instance per @Test)', x: 8, y: 10 },
      { id: 'clamp', emoji: '🪝', label: 'clamp → load → read gauge (arrange-act-assert)', x: 30, y: 10 },
      { id: 'crane', emoji: '🏗️', label: 'crane calibrated ONCE each morning, read-only (@BeforeAll)', x: 52, y: 10 },
      { id: 'contaminated', emoji: '⚠️', label: 'a rig carrying yesterday\'s damage: pass/fail now depends on ORDER (flaky)', x: 74, y: 10 },
      { id: 'batch', emoji: '📦', label: 'same rig, same procedure, run once per bolt in a crate (parameterized test)', x: 30, y: 50 },
      { id: 'log', emoji: '📋', label: 'each bolt\'s own pass/fail logged individually, no shared verdict', x: 52, y: 50 }
    ],
    actors: [
      { id: 'paulie', emoji: '🛠️', label: 'Paulie', x: 20, y: 74 },
      { id: 'monica', emoji: '🍽️', label: 'Monica', x: 55, y: 74 }
    ],
    steps: [
      { c: 'Paulie wipes the rig clean before EVERY single plank — no leftover strain carried from the last one. That\'s a fresh test-class instance per @Test method.', p: { rig: 'good' }, a: { paulie: [20, 26] } },
      { c: 'Every plank goes through the same steps: clamp it in, apply the rated load, read the gauge against spec. That\'s arrange-act-assert.', p: { clamp: 'lit' } },
      { c: 'The crane gets calibrated ONCE each morning, not before every plank — because calibration is read-only and safe to share. That\'s @BeforeAll.', p: { crane: 'lit' }, a: { monica: [55, 60] } },
      { c: 'A rig quietly still bearing yesterday\'s damage makes results depend on which order planks go through — exactly what a flaky test looks like. Fresh-per-test exists to prevent this.', p: { contaminated: 'bad' } },
      { c: 'For a hundred identical dock-bolts, Paulie doesn\'t rewrite the inspection procedure each time — he runs the SAME rig once per bolt from the crate. That\'s a parameterized test.', p: { batch: 'good' } },
      { c: 'Each bolt gets its own pass/fail result logged separately — one shared batch verdict would hide which specific bolt actually failed.', p: { log: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'From @Test and assertions to lifecycle guarantees and parameterization',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Assertions',
        nodes: [
          { id: 'aaa', text: 'arrange-act-assert:\nthe shape of almost every unit test' },
          { id: 'assertions', text: 'assertEquals/assertTrue/assertThrows/\nassertAll — Assertions static methods' }
        ]
      },
      {
        label: 'Lifecycle',
        nodes: [
          { id: 'freshinstance', text: 'fresh test-class instance\nper @Test method, by default' },
          { id: 'beforeeach', text: '@BeforeEach/@AfterEach:\nrun once per test method' },
          { id: 'beforeall', text: '@BeforeAll/@AfterAll: run ONCE\nfor the class, must be static, must stay read-only' }
        ]
      },
      {
        label: 'Flakiness connection',
        nodes: [
          { id: 'instanceprotected', text: 'instance fields: automatically\nreset — cannot leak between tests' },
          { id: 'stillatrisk', text: 'static fields / external shared state:\nNOT protected by the default at all' }
        ]
      },
      {
        label: 'Parameterized tests',
        nodes: [
          { id: 'paramtest', text: '@ParameterizedTest: one body,\nrun once per supplied input' },
          { id: 'sources', text: '@ValueSource / @CsvSource /\n@MethodSource / @EnumSource' }
        ]
      }
    ],
    steps: [
      { active: ['aaa'], note: 'A unit test sets up its inputs, invokes the one behavior under test, then checks the outcome — arrange, act, assert.' },
      { active: ['assertions'], note: 'assertEquals, assertTrue, assertThrows, and assertAll are the core building blocks of the assert step, imported statically from org.junit.jupiter.api.Assertions.' },
      { active: ['freshinstance'], note: 'JUnit 5 creates a brand-new instance of the test class for every @Test method by default — instance fields cannot carry state from one test into another.' },
      { active: ['beforeeach'], note: '@BeforeEach runs before every test method, on that test\'s own fresh instance — the idiomatic place for arrange-step setup.' },
      { active: ['beforeall'], note: '@BeforeAll/@AfterAll run exactly once for the whole class and must be static — appropriate only for genuinely expensive, genuinely read-only shared setup.' },
      { active: ['instanceprotected'], note: 'Because every test gets its own instance, instance-field state literally cannot leak between tests — this is structural, not a matter of test-author discipline.' },
      { active: ['stillatrisk'], note: 'Static fields and external shared state (a database row, a singleton cache, a file) are NOT reset by this default — they remain a real, common source of order-dependent flaky tests.' },
      { active: ['paramtest'], note: '@ParameterizedTest runs one test body multiple times, once per supplied argument, avoiding near-duplicate @Test methods that differ only in their input values.' },
      { active: ['sources'], note: 'Different source annotations fit different shapes of input data — flat single values, input/output pairs, dynamically generated arguments, or every constant of an enum.' }
    ]
  },
  tech: [
    {
      q: 'Explain precisely what assertThrows(SomeException.class, executable) verifies, and what it does NOT verify — including a scenario where a test using it passes even though the code has a real bug.',
      a: 'assertThrows runs the supplied executable (typically a lambda wrapping the code under test) and checks exactly one thing: that executing it throws an exception whose type IS-A the specified exception class (the thrown exception can be the exact class or a subclass of it) — if that happens, the test passes and assertThrows returns the actual caught exception instance for further inspection; if a DIFFERENT exception type is thrown, or no exception is thrown at all, the test fails with a message explaining which. Critically, assertThrows says NOTHING by itself about the exception\'s MESSAGE, its CAUSE (the wrapped underlying exception, central to the exceptions lesson\'s wrap-preserve-cause discipline), or any other property beyond its type — a test that only calls assertThrows(IOException.class, () -> importer.load(badFile)) and stops there would pass identically whether the IOException correctly wraps the real underlying cause via initCause/the exception-chaining constructor, or whether it was constructed with a completely unrelated, unhelpful message and no cause at all. The concrete bug scenario: imagine a LogImporter refactor accidentally drops the wrapped cause (constructs `new IOException("import failed")` instead of `new IOException("import failed", originalCause)`) — a test that only asserts the exception TYPE continues passing even though a real debugging session using that exception later would lose the actual root cause entirely. The fix is straightforward: capture assertThrows\'s return value and make FURTHER assertions on it — assertEquals(expectedCause.getClass(), thrown.getCause().getClass()), or assertTrue(thrown.getMessage().contains("expected detail")) — verifying the exception\'s substance, not just its type.'
    },
    {
      q: 'A test class has five @Test methods and one non-static int field used as a counter, incremented inside one specific test method. Explain exactly what value that field holds at the start of each of the other four test methods, and why.',
      a: 'That field holds its default initial value (0 for an int) at the start of every single one of the five test methods, including the ones that run AFTER the test that increments it — because JUnit 5\'s default lifecycle creates a completely NEW instance of the test class for each @Test method, meaning the "increment inside one test method" mutation happens on an instance that is discarded immediately after that one test method finishes, and every other test method — before it, after it, doesn\'t matter — receives its OWN separate instance where that field has never been touched at all. This is precisely why JUnit 5\'s default lifecycle is structurally, not just conventionally, safe against one specific class of test interdependence: there is no mechanism by which one test method\'s mutation of a non-static instance field could ever be observed by a different test method, regardless of what order the test runner happens to execute them in, because "the same instance" is never shared between two different @Test method invocations in the first place. This is a genuinely different guarantee from "well-behaved tests happen to reset their own state" — it holds even for a poorly-written test that never resets anything, purely because of how JUnit constructs test instances, and it\'s the direct, mechanical reason instance fields are safe from this specific flakiness pattern while STATIC fields (shared across every instance of the class, and therefore genuinely shared across all five test methods) are not protected by this default at all.'
    },
    {
      q: 'A @BeforeAll method starts an expensive shared resource (e.g. a database connection) once for a whole test class, and one of the five tests in that class mutates a row in that shared database as part of its ACT step. Explain the flakiness risk this introduces, and why it exists despite JUnit 5\'s per-method fresh-instance default.',
      a: 'The risk is real and directly contradicts what a reader might assume the fresh-instance default protects: @BeforeAll-created resources are explicitly created ONCE for the entire class and shared across every test method\'s fresh instance — the fresh-instance guarantee applies to the TEST CLASS\'S OWN instance fields, not to any external resource a @BeforeAll method happens to set up and store a reference to (often in a static field, since @BeforeAll methods are themselves static). If one test mutates a row in that shared database — updates a value, deletes a record, inserts data another test\'s assertions implicitly depend on already being absent — every OTHER test in that class sharing the same @BeforeAll-provided connection now potentially sees a DIFFERENT starting state than it would if it ran first, alone, or in a different order relative to the mutating test. This produces exactly the order-dependent flakiness signature: the full test suite passes or fails differently depending on which order JUnit (or a parallel test runner) happens to execute the five tests in, even though every individual test method appears, read in isolation, to be a completely ordinary, well-formed unit test. The reason this exists despite the fresh-instance default is precisely the boundary the concept section draws explicitly: fresh instances protect INSTANCE FIELDS on the test class itself, full stop — they say nothing whatsoever about state living in an externally-shared resource a @BeforeAll method happens to hand out to every test, which is exactly why @BeforeAll is only safe for resources that stay genuinely READ-ONLY across the whole class, or why each test needs its own explicit setup/teardown (e.g. wrapping each test\'s database interaction in a transaction that\'s rolled back in @AfterEach) to restore isolation the fresh-instance default cannot provide for external state.'
    },
    {
      q: 'Compare @ValueSource, @CsvSource, and @MethodSource: what shape of test data does each fit best, and give a concrete LogPose-relevant example where using the wrong one would be awkward or impossible.',
      a: '@ValueSource supplies a flat list of single primitive/String values, each becoming the ONE parameter of a single test-method invocation — it fits a test that checks one property against several individual inputs, like verifying that Backlog.add() rejects several different invalid title strings (empty string, a string of only whitespace, null handled separately since @ValueSource doesn\'t support null directly) with one assertThrows-based test body reused across each. It would be awkward for a test needing BOTH an input AND its expected, DIFFERENT-typed output together, since @ValueSource only supplies one value per invocation, matching one parameter. @CsvSource fits exactly that next case: rows of comma-separated values unpacked into MULTIPLE parameters per invocation, ideal for input/expected-output pairs like `@CsvSource({"flaky test triage, 3", "a, 1", "", "0"})` feeding a wordCount(String title) method both the title AND the expected count in one row — it would be awkward (though not impossible, via escaping) for values that themselves contain commas or need to be actual objects rather than primitives/Strings. @MethodSource is the right tool once the data is too complex, too large, or too genuinely DYNAMIC to write as literal annotation values — supplying a Stream<Arguments> or List of actual constructed LogEntry or Idea domain objects (which @ValueSource and @CsvSource simply cannot express at all, since annotation values must be compile-time constants of primitive/String/enum/Class type, never arbitrary constructed objects), or generating a large range of test inputs programmatically rather than typing each one by hand. Using @ValueSource or @CsvSource for a case that genuinely needs full domain objects isn\'t just awkward, it\'s IMPOSSIBLE — Java annotations cannot take arbitrary object references as arguments — making @MethodSource the only correct choice the moment test data needs to be anything beyond primitives, Strings, or enum constants.'
    }
  ],
  code: {
    title: 'Testing a Backlog: lifecycle, assertions, assertThrows, and a parameterized test',
    intro: 'A JUnit 5 test class for a LogPose Backlog, showing @BeforeEach giving every test a fresh Backlog, assertEquals/assertTrue/assertAll, assertThrows verifying a validation rule, and @ParameterizedTest running one test body against several inputs.',
    code: `import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

class Backlog {
    private final List<String> ideas = new java.util.ArrayList<>();

    void add(String idea) {
        if (idea == null || idea.isBlank()) {
            throw new IllegalArgumentException("idea must not be blank");
        }
        ideas.add(idea);
    }

    int size() { return ideas.size(); }
    boolean isEmpty() { return ideas.isEmpty(); }
    String mostRecent() { return ideas.get(ideas.size() - 1); }
}

class BacklogTest {

    private Backlog backlog;   // a fresh instance is created for THIS field on EVERY @Test method

    @BeforeEach
    void setUp() {
        backlog = new Backlog();   // runs before every single test -- always starts empty
    }

    @Test
    @DisplayName("a new backlog is empty")
    void newBacklogIsEmpty() {
        assertTrue(backlog.isEmpty());
        assertEquals(0, backlog.size());
    }

    @Test
    void addingAnIdeaUpdatesSizeAndMostRecent() {
        backlog.add("investigate flaky test root causes");

        // assertAll runs every assertion even if an earlier one fails, reporting all failures at once
        assertAll(
            () -> assertEquals(1, backlog.size()),
            () -> assertFalse(backlog.isEmpty()),
            () -> assertEquals("investigate flaky test root causes", backlog.mostRecent())
        );
    }

    @Test
    void addingABlankIdeaThrows() {
        IllegalArgumentException thrown = assertThrows(
            IllegalArgumentException.class,
            () -> backlog.add("   ")
        );
        assertTrue(thrown.getMessage().contains("blank"));   // check the message, not just the type
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   ", "\\t"})
    void everyBlankVariantIsRejected(String blankInput) {
        assertThrows(IllegalArgumentException.class, () -> backlog.add(blankInput));
    }
}`,
    notes: [
      'backlog is a non-static instance field, so @BeforeEach\'s setUp() runs on a fresh Backlog before EVERY test method — no test can ever see an idea another test added, regardless of run order.',
      'assertAll in addingAnIdeaUpdatesSizeAndMostRecent reports all three checks even if the first one fails, rather than stopping at the first failing assertEquals the way three separate plain assertions would.',
      'addingABlankIdeaThrows captures assertThrows\'s return value and asserts on the message too -- confirming Backlog actually explains WHY it rejected the input, not just that it threw something.',
      'everyBlankVariantIsRejected runs the identical test body three times, once per @ValueSource string, instead of three near-duplicate @Test methods differing only in which blank string they pass.'
    ]
  },
  lab: {
    title: 'Write JUnit 5 tests for a ReviewBoard class with lifecycle, assertThrows, and a parameterized test',
    prompt: 'Given a class <code>ReviewBoard</code> with methods <code>void submit(String paperTitle)</code> (throws <code>IllegalArgumentException</code> if <code>paperTitle</code> is null or blank), <code>int pendingCount()</code>, and <code>boolean isEmpty()</code>, write a JUnit 5 test class <code>ReviewBoardTest</code> that: (1) uses <code>@BeforeEach</code> to create a fresh <code>ReviewBoard board</code> field before every test; (2) has a <code>@Test</code> method asserting a new board <code>isEmpty()</code>; (3) has a <code>@Test</code> method that submits one paper and uses <code>assertAll</code> to check both <code>pendingCount()</code> equals 1 and <code>isEmpty()</code> is false; (4) has a <code>@Test</code> method using <code>assertThrows</code> to verify submitting <code>null</code> throws <code>IllegalArgumentException</code>; (5) has a <code>@ParameterizedTest</code> with <code>@ValueSource</code> over at least two blank strings, asserting each throws <code>IllegalArgumentException</code>.',
    starter: `import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;

class ReviewBoardTest {

    private ReviewBoard board;

    @BeforeEach
    void setUp() {
        // TODO: assign a fresh ReviewBoard to board
    }

    @Test
    void newBoardIsEmpty() {
        // TODO: assertTrue board.isEmpty()
    }

    @Test
    void submittingAPaperUpdatesState() {
        // TODO: board.submit("a paper title"), then assertAll checking pendingCount() == 1 and !isEmpty()
    }

    @Test
    void submittingNullThrows() {
        // TODO: assertThrows(IllegalArgumentException.class, () -> board.submit(null))
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    void submittingBlankThrows(String blank) {
        // TODO: assertThrows(IllegalArgumentException.class, () -> board.submit(blank))
    }
}`,
    checks: [
      { re: '@BeforeEach', must: true, hint: 'setUp() must be annotated @BeforeEach.', pass: '@BeforeEach used ✓' },
      { re: 'board\\s*=\\s*new\\s+ReviewBoard\\s*\\(', must: true, hint: 'setUp() must assign a fresh ReviewBoard to the board field.', pass: 'fresh ReviewBoard created in setUp ✓' },
      { re: 'assertTrue\\(\\s*board\\.isEmpty\\(\\)\\s*\\)', must: true, hint: 'newBoardIsEmpty must call assertTrue(board.isEmpty()).', pass: 'newBoardIsEmpty check ✓' },
      { re: 'assertAll\\(', must: true, hint: 'submittingAPaperUpdatesState must use assertAll to group its checks.', pass: 'assertAll used ✓' },
      { re: 'assertEquals\\(\\s*1\\s*,\\s*board\\.pendingCount\\(\\)\\s*\\)', must: true, hint: 'Inside assertAll, assert pendingCount() equals 1.', pass: 'pendingCount check ✓' },
      { re: 'assertThrows\\(\\s*IllegalArgumentException\\.class\\s*,\\s*\\(\\)\\s*->\\s*board\\.submit\\(\\s*null\\s*\\)\\s*\\)', must: true, hint: 'submittingNullThrows must call assertThrows(IllegalArgumentException.class, () -> board.submit(null)).', pass: 'null-submission assertThrows ✓' },
      { re: '@ParameterizedTest', must: true, hint: 'submittingBlankThrows must be annotated @ParameterizedTest, not @Test.', pass: '@ParameterizedTest used ✓' },
      { re: '@ValueSource\\(\\s*strings\\s*=', must: true, hint: 'Use @ValueSource(strings = {...}) supplying at least two blank strings.', pass: '@ValueSource strings used ✓' }
    ],
    run: 'mvn test — with a ReviewBoard implementation matching the described contract present on the classpath, all tests in ReviewBoardTest should pass, and the parameterized test should report as multiple separate invocations, one per @ValueSource string.',
    solution: `import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;

class ReviewBoardTest {

    private ReviewBoard board;

    @BeforeEach
    void setUp() {
        board = new ReviewBoard();
    }

    @Test
    void newBoardIsEmpty() {
        assertTrue(board.isEmpty());
    }

    @Test
    void submittingAPaperUpdatesState() {
        board.submit("a paper title");
        assertAll(
            () -> assertEquals(1, board.pendingCount()),
            () -> assertFalse(board.isEmpty())
        );
    }

    @Test
    void submittingNullThrows() {
        assertThrows(IllegalArgumentException.class, () -> board.submit(null));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    void submittingBlankThrows(String blank) {
        assertThrows(IllegalArgumentException.class, () -> board.submit(blank));
    }
}`,
    notes: [
      'board is reassigned fresh in @BeforeEach on every test -- submittingAPaperUpdatesState\'s board.submit() call has no way to leak a pending paper into newBoardIsEmpty, regardless of which order JUnit happens to run them in.',
      'assertAll reports both the pendingCount and isEmpty checks even if one of them fails, rather than stopping at the first failure the way two separate plain assertions in sequence would.',
      'The @ParameterizedTest runs submittingBlankThrows twice -- once with "" and once with "   " -- as two separate, individually-reported test results, without writing two near-duplicate @Test methods.'
    ]
  },
  quiz: [
    {
      q: 'What is the arrange-act-assert structure, and which JUnit 5 annotation is most idiomatically used for the "arrange" step when it would otherwise be duplicated at the top of every test method?',
      options: ['Arrange sets up test input/state, act invokes the behavior under test, assert checks the outcome; @BeforeEach is the idiomatic place for shared arrange-step setup that runs fresh before every test', '@AfterAll is used for the arrange step, since it prepares the class for testing', 'Arrange, act, and assert are three separate required annotations JUnit checks for at compile time', 'Arrange-act-assert only applies to parameterized tests, not plain @Test methods'],
      correct: 0,
      explain: '@BeforeEach runs before every test method on that test\'s own fresh instance, making it the natural place to put arrange-step setup (like creating a fresh object under test) that would otherwise be copy-pasted into every @Test method.'
    },
    {
      q: 'By default, how many instances of a JUnit 5 test class are created when that class has five @Test methods?',
      options: ['Five -- a fresh instance is created for every single @Test method by default', 'One -- a single shared instance runs all five test methods in sequence', 'Zero -- JUnit 5 test methods are static by default and require no instance', 'It depends on whether @BeforeEach is present; without it, one instance is shared'],
      correct: 0,
      explain: 'JUnit 5\'s default lifecycle creates a brand-new instance of the test class for every @Test method, which is exactly why non-static instance fields cannot leak state between test methods.'
    },
    {
      q: 'A test uses assertThrows(IOException.class, () -> importer.load(badFile)) and nothing else. What has this test actually verified?',
      options: ['Only that calling importer.load(badFile) throws an IOException (or a subclass) -- it says nothing about the exception\'s message or whether its cause correctly wraps the original underlying error', 'That importer.load(badFile) throws an IOException with the exact message "load failed"', 'That importer.load(badFile) throws an IOException whose cause is set correctly', 'That importer.load(badFile) never throws any exception other than IOException anywhere in the codebase'],
      correct: 0,
      explain: 'assertThrows only checks the thrown exception\'s TYPE. Verifying the message or the wrapped cause requires capturing assertThrows\'s return value and making further assertions on it directly.'
    },
    {
      q: 'A @BeforeAll method starts a shared database connection once for a whole test class, and one test in that class mutates a row in that database. Why can this cause order-dependent flakiness despite JUnit 5\'s fresh-instance-per-test default?',
      options: ['The fresh-instance default only protects the test class\'s OWN instance fields -- it says nothing about state living in an externally shared resource that a @BeforeAll method hands out to every test in the class', 'JUnit 5 does not actually support @BeforeAll for database connections at all', '@BeforeAll methods automatically roll back any database changes made during the test class', 'This scenario cannot cause flakiness because @BeforeAll methods are always read-only by JUnit\'s enforcement'],
      correct: 0,
      explain: 'Fresh instances protect instance fields on the test class itself, not external resources a @BeforeAll method sets up and shares. A test mutating that shared resource can change what other tests observe, depending on execution order -- the classic order-dependent flakiness signature.'
    },
    {
      q: 'A test needs to supply both an input string AND its correctly matching, differently-typed expected integer output, several times, without writing a separate @Test method for each pair. Which source annotation fits best?',
      options: ['@CsvSource, since it supplies rows of comma-separated values that get unpacked into multiple differently-purposed parameters per invocation', '@ValueSource, since it supplies a flat list of values for a single parameter', '@EnumSource, since it iterates over the constants of an enum type', 'None of these support supplying an input and an expected output together -- a separate @Test method is required for each pair'],
      correct: 0,
      explain: '@CsvSource is specifically suited to input/expected-output pairs (or larger tuples), since each comma-separated row unpacks into multiple test-method parameters -- exactly the "one value plus its matching different-typed expected result" shape.'
    }
  ],
  testFlow: {
    title: 'Test yourself: assertions, lifecycle, and flakiness under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A test class has a non-static List<String> field populated inside one @Test method. A teammate worries this could leak into a different @Test method in the same class if the suite runs them in a different order. Are they right to worry?',
        choices: [
          { text: 'No -- JUnit 5 creates a fresh instance of the test class for every @Test method by default, so that List field is always freshly re-initialized (or null/unset per the field\'s own initializer) for every other test method, regardless of execution order', to: 'q1_right' },
          { text: 'Yes -- all @Test methods in the same class always share one instance, so any instance field mutation is visible to every other test', to: 'q1_wrong_shared' },
          { text: 'It depends entirely on whether @BeforeEach is present -- without it, state always leaks between tests', to: 'q1_wrong_dependson' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- the fresh-instance-per-@Test default means a NEW test class instance exists for every test method, so a non-static field populated in one test method\'s instance is simply unreachable from any other test method\'s completely separate instance.', next: 'q2' },
      q1_wrong_shared: { end: true, correct: false, text: 'This is exactly backwards from JUnit 5\'s actual default: instances are NOT shared across @Test methods by default -- a brand-new instance is created for every single test method, which is precisely why instance-field state cannot leak between tests.', retry: 'q1' },
      q1_wrong_dependson: { end: true, correct: false, text: '@BeforeEach controls what SETUP code runs before each test, but the fresh-instance guarantee itself is unconditional and applies regardless of whether @BeforeEach is used at all -- even with no @BeforeEach present, each test method still gets its own separate instance.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'The same teammate now points at a `private static final Map<String, Integer> cache = new HashMap<>();` field in that same test class, populated by one test method. Should they worry about THIS one leaking between tests run in different orders?',
        choices: [
          { text: 'Yes -- static fields are shared across every instance of the class, so this cache is genuinely the SAME object across all test methods regardless of JUnit\'s fresh-instance-per-test default, which only protects instance fields', to: 'q2_right' },
          { text: 'No -- JUnit automatically resets static fields to their initial value before every @Test method, just like it does for instance fields', to: 'q2_wrong_reset' },
          { text: 'No -- static fields marked final can never be mutated after class initialization, so this cache cannot change between tests', to: 'q2_wrong_final' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- static fields are shared across every instance of a class, so JUnit\'s per-test fresh-instance default does nothing to protect them. This is exactly the boundary between what the default protects (instance fields) and what it doesn\'t (static/external shared state) -- a real, common source of order-dependent flaky tests.', next: 'q3' },
      q2_wrong_reset: { end: true, correct: false, text: 'JUnit 5\'s fresh-instance default only creates a new INSTANCE of the test class per test method -- it has no mechanism that resets static fields, which belong to the class itself, not to any one instance. A static field\'s value persists across every test method in the class.', retry: 'q2' },
      q2_wrong_final: { end: true, correct: false, text: 'final on a field reference only prevents the cache VARIABLE from being reassigned to point at a different Map -- it does nothing to prevent MUTATING the Map object itself (calling cache.put(...)), which is exactly what would leak state between tests here.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A test suite of 40 tests passes reliably when run alone, one class at a time, but fails intermittently -- always the SAME two specific tests -- only when the full suite runs together and JUnit happens to interleave test classes in a different order (e.g. with parallel execution enabled). What\'s the most likely root cause to investigate first, given everything in this lesson?',
        choices: [
          { text: 'Shared mutable state OUTSIDE the fresh-instance protection -- a static field, a shared external resource (database row, file, singleton cache) that one of the two tests mutates and the other implicitly depends on being in a particular state', to: 'q3_right' },
          { text: 'JUnit 5\'s fresh-instance-per-test default must be broken or misconfigured, since instance-field state is leaking between tests', to: 'q3_wrong_broken' },
          { text: 'Parameterized tests are inherently unreliable under parallel execution and should be avoided entirely', to: 'q3_wrong_param' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- this is precisely the signature the concept section describes: order/interleaving-dependent failures point straight at state the fresh-instance default does NOT protect (static fields or external shared resources), not at a broken JUnit default. Investigate what those two specific tests both touch outside their own instance fields.', next: null },
      q3_wrong_broken: { end: true, correct: false, text: 'JUnit 5\'s fresh-instance default is a reliable, structural guarantee about instance fields on the test class itself -- it is not something that becomes "broken" under parallel execution or reordering. The far more likely explanation is state living OUTSIDE what that default protects.', retry: 'q3' },
      q3_wrong_param: { end: true, correct: false, text: 'Nothing in the scenario mentions parameterized tests at all, and there\'s no general reason @ParameterizedTest would be inherently less reliable under parallel execution than @Test -- the described symptom (order/interleaving-dependent failure between two specific tests) points at shared external state, not at parameterization.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Comparing two double or float values with the two-argument assertEquals(expected, actual) -- floating-point rounding makes exact equality unreliable; use the three-argument overload with an explicit delta instead.',
    'Calling assertThrows and never inspecting its return value -- this only verifies the exception TYPE, not its message or wrapped cause, and can let a real regression (a dropped cause, a wrong message) pass silently.',
    'Putting a MUTATING operation inside a @BeforeAll method (or in a resource it hands out) -- @BeforeAll runs once and is shared across every test in the class, so any test that mutates that shared resource can silently change what every other test in the class observes.',
    'Relying on shared static fields or external resources (a database row, a file, a singleton cache) without explicit per-test isolation (transaction rollback in @AfterEach, resetting state in @BeforeEach) -- JUnit\'s fresh-instance default does nothing to protect state that lives outside the test class\'s own instance fields.',
    'Writing several near-identical @Test methods that differ only in their input values -- this is exactly what @ParameterizedTest with @ValueSource/@CsvSource/@MethodSource exists to replace, and duplicated test methods drift out of sync with each other over time just like duplicated production code does.',
    'Writing several separate plain assertions in one @Test method when checking multiple properties of the SAME result, instead of grouping them with assertAll -- the first failing assertion stops the method immediately, hiding whether the other properties are also wrong until the first one is fixed and the test is re-run.'
  ],
  interview: [
    {
      q: 'A colleague says "JUnit 5 automatically prevents flaky tests caused by shared state, since every test gets a fresh instance." Evaluate this claim precisely, distinguishing what is and isn\'t actually true.',
      a: 'The claim is partially true and partially a dangerous overstatement, and the precise boundary matters a great deal in practice. What IS true: JUnit 5\'s default lifecycle creates a brand-new instance of the test class for every single @Test method, which means any NON-STATIC INSTANCE FIELD on that test class is structurally, unconditionally incapable of carrying state from one test method to another -- this isn\'t a matter of good test-authoring discipline that could be violated by a careless test writer, it is a mechanical guarantee that holds regardless of what the test methods themselves do, purely because "the same instance" is never reused across two different @Test invocations. What is NOT true, and where the claim overstates the guarantee dangerously: this protection applies ONLY to the test class\'s own instance fields. It provides zero protection for STATIC fields (shared across every instance of a class, test or otherwise, and therefore genuinely shared across every test method regardless of the fresh-instance default), and zero protection for state living OUTSIDE the JVM\'s object graph entirely -- a row in a shared database, a file on disk, an environment variable, a singleton service holding cached state that outlives any individual test instance. A team that internalizes the colleague\'s claim as blanket truth is likely to be genuinely surprised when a test suite using a shared @BeforeAll-provided database connection, or code under test that relies on a static cache, starts failing intermittently and order-dependently despite "using JUnit 5 correctly" -- the framework did exactly what it promises (protect instance fields), and the flakiness is coming from state the framework never claimed to protect in the first place. The correct, precise version of the claim: JUnit 5\'s default lifecycle eliminates ONE entire category of test interdependence (instance-field leakage) as a structural non-issue, but static state and external shared resources remain a real, live concern requiring deliberate test-author discipline (careful setup/teardown, avoiding shared mutable statics in the code under test, or transactional rollback for database tests) that JUnit\'s defaults do not provide automatically.'
    },
    {
      q: 'Design a small JUnit 5 test suite (describe the test methods, not full code) for a Backlog class whose add(String) method should reject null and blank strings, and whose size()/mostRecent() methods should reflect additions correctly. Explain your choice of plain @Test versus @ParameterizedTest for each case, and how you would verify no cross-test contamination is possible.',
      a: 'I would structure this around the arrange-act-assert shape with a @BeforeEach creating a fresh Backlog before every test, ensuring every test starts from an identical, known-empty baseline regardless of what other tests do or what order they run in. For the "happy path" behavior (adding valid ideas and checking size()/mostRecent()), I\'d use plain @Test methods -- one confirming a brand-new backlog reports size 0 and isEmpty() true, one confirming that after a single add() call, size() is 1 and mostRecent() returns exactly what was added, and one confirming that after several sequential add() calls, size() tracks the count correctly and mostRecent() always reflects the LAST one added -- each of these is checking a genuinely distinct behavioral property, not the same property against different input shapes, so a plain @Test per property (rather than parameterizing) keeps each test\'s failure message specifically pointing at which property broke. For the REJECTION behavior (null and blank inputs), I would use TWO separate mechanisms rather than lumping them together: a single plain @Test for the null case specifically (assertThrows(IllegalArgumentException.class, () -> backlog.add(null))), since null is a categorically distinct kind of invalid input worth calling out by name in a test method\'s own descriptive name, and a @ParameterizedTest with @ValueSource(strings = {"", " ", "\\t", "\\n"}) covering several DIFFERENT blank-but-non-null variants with one shared test body, since these all exercise the exact same code path (the isBlank() check) and differ only in which specific blank string is passed -- exactly the "same behavior, many inputs" shape @ParameterizedTest exists for, avoiding four near-identical @Test methods that would drift out of sync if the validation logic changed later. To verify no cross-test contamination is possible, beyond simply trusting JUnit 5\'s documented fresh-instance default, I would deliberately run the full test class with JUnit\'s method-order randomization enabled (or, more directly, physically reorder the @Test methods in the source file and re-run) and confirm every test still passes identically -- since Backlog here has no static state and no external resources at all, and every test\'s only shared touchpoint is the @BeforeEach-created fresh instance field, this suite should be provably immune to order-dependent flakiness by construction, which is itself worth demonstrating rather than assuming.'
    },
    {
      q: 'Explain why @BeforeAll methods are required to be static under JUnit 5\'s default (per-method) lifecycle, and what changes if a test class opts into TestInstance.Lifecycle.PER_CLASS instead. What new risk does PER_CLASS introduce that the default lifecycle didn\'t have?',
      a: 'Under JUnit 5\'s default PER_METHOD lifecycle, a brand-new instance of the test class is constructed for EVERY @Test method -- which means at the moment @BeforeAll needs to run (once, before ANY test method in the class executes, and therefore before any instance of the class has been created yet at all), there is structurally no particular instance for that method to be associated with. A non-static method requires SOME instance to be invoked on; since no instance exists yet when @BeforeAll must run, the method has no choice but to be static, operating at the class level rather than on any particular object -- this isn\'t an arbitrary rule, it\'s a direct consequence of the PER_METHOD lifecycle\'s own timing. Opting a test class into @TestInstance(TestInstance.Lifecycle.PER_CLASS) changes this timing fundamentally: JUnit now creates exactly ONE instance of the test class for the ENTIRE class, reusing that SAME instance across every @Test method rather than creating a fresh one per method -- and because an instance now genuinely exists before @BeforeAll needs to run (JUnit creates it first, specifically to support this mode), @BeforeAll (and @AfterAll) are permitted to be NON-static instance methods under PER_CLASS, which is occasionally convenient (they can now access instance fields and participate in dependency injection the same way regular test methods can). The new risk PER_CLASS introduces is precisely the one this lesson has been building toward: switching to PER_CLASS reintroduces the exact instance-field contamination risk the PER_METHOD default was specifically designed to eliminate -- because all test methods now share ONE instance, a non-static instance field mutated by one test method IS visible to every subsequent test method in that class, the same order-dependent flakiness risk previously confined to static fields and external resources now applies to ordinary instance fields too. This is precisely why PER_CLASS is a deliberate, narrow opt-in (useful for specific cases like wanting non-static @BeforeAll for expensive setup that genuinely needs instance-level configuration) rather than a preferable default -- the PER_METHOD default\'s fresh-instance-per-test guarantee is valuable enough as a structural flakiness defense that giving it up should be a conscious, justified choice, not an accidental one.'
    },
    {
      q: 'A test suite has a test that intermittently fails with an assertion like assertEquals(3, results.size()) sometimes seeing 2 or 4 instead of 3, but only when run as part of the full suite (never when run alone). The code under test spawns a fixed thread pool of 3 worker threads via ExecutorService to populate a shared, plain (non-concurrent) ArrayList, and the test does NOT call awaitTermination or otherwise wait for the pool to finish before asserting. Diagnose this using material from this lesson plus the earlier concurrency lessons.',
      a: 'This diagnosis combines two separate, independently-established root causes rather than either one alone being the full story, and it\'s worth naming both precisely. First, the missing synchronization: the executors-futures lesson established that submitting tasks to an ExecutorService and never calling awaitTermination (or collecting each task\'s Future and calling get()) means the main test thread has no guarantee whatsoever that the worker threads have finished their work before the test proceeds to its assertEquals check -- the test is racing its own worker threads, and results.size() at assertion time reflects however many of the 3 tasks HAPPENED to complete before the JVM scheduler got around to running the assertion, which can vary from run to run purely based on OS thread-scheduling timing, entirely independent of test execution ORDER. Second, and compounding it: the concurrent-collections-virtual-threads lesson established that a PLAIN ArrayList is not safe for concurrent modification at all -- even setting aside the missing-synchronization timing issue, 3 worker threads calling add() concurrently on one plain ArrayList can structurally corrupt its internal state (lost updates, or worse), which independently could produce a wrong final size even in the (unlikely) case all 3 threads happened to finish before the assertion ran. The "only fails as part of the full suite, never alone" detail is the important diagnostic clue this lesson adds on top of the concurrency material: it strongly suggests the full suite\'s additional CPU/scheduling contention (other tests\' threads competing for the same cores) is what actually surfaces the race -- running alone, the 3 worker threads might reliably finish fast enough, by sheer luck of scheduling, before the assertion runs, masking the underlying bug; running as part of a busier suite shifts that timing just enough to expose it. The fix has two independent parts, both needed: (1) actually wait for the pool\'s work to complete before asserting -- shutdown() the pool and awaitTermination(...), or collect and .get() every submitted Future -- fixing the timing race; and (2) replace the plain ArrayList with a properly concurrent collection (a synchronized wrapper, or more idiomatically here, having each worker return its own result via Future and collecting them on the single test thread afterward, avoiding shared mutable concurrent writes to a collection at all) -- fixing the underlying thread-safety bug the timing race was partially masking. Fixing only the first without the second could still leave a latent, harder-to-reproduce corruption bug; fixing only the second without the first leaves the assertion racing the pool\'s completion regardless of the collection\'s thread-safety.'
    }
  ]
};
