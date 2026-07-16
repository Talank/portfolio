window.LESSONS = window.LESSONS || {};
window.LESSONS['mockito-test-doubles'] = {
  id: 'mockito-test-doubles',
  title: 'Test Doubles & Mockito: Mocks, Stubs, Spies, Fakes & When Each Lies to You',
  category: 'Part 7 — Testing',
  timeMin: 50,
  summary: 'unit-testing-junit5 tested classes entirely on their own, with no collaborators worth isolating from. Real classes usually depend on OTHER objects — a repository, a notifier, a clock — and testing the real class often means standing in a fake, controllable version of that collaborator instead of the real thing (a real database, a real email service, a real slow network call). This lesson covers the four kinds of TEST DOUBLE (stub, mock, spy, fake) with precise, non-interchangeable definitions, Mockito\'s @Mock/@ExtendWith(MockitoExtension.class)/when-thenReturn/verify API, ArgumentCaptor, and — the lesson\'s central, deliberately uncomfortable idea — exactly how and why a test built entirely on mocks can report a confident, all-green PASS while the real, non-mocked system is actually broken.',
  goals: [
    'Define stub, mock, spy, and fake precisely and distinguish them by what each one is FOR: canned answers vs. verified interactions vs. wrapping a real object vs. a lightweight real implementation',
    'Write a Mockito-based JUnit 5 test using @ExtendWith(MockitoExtension.class), @Mock, when(...).thenReturn(...), and verify(...) to isolate a class from its collaborators',
    'Use verify with times()/never() and ArgumentCaptor to check not just THAT a collaborator was called, but exactly HOW MANY times and with WHAT arguments',
    'Explain concretely how a mock-based test can pass while the corresponding real, non-mocked interaction is broken, and why this is not a Mockito bug but an inherent limit of interaction-based testing',
    'Identify over-mocking smells (mocking types you don\'t own, deep stub chains, verifying implementation details instead of behavior) and explain why each makes a test suite more brittle, not more thorough'
  ],
  concept: [
    {
      h: 'Why isolate a class from its collaborators at all',
      p: [
        'unit-testing-junit5\'s Backlog and ReviewBoard were self-contained — every method\'s entire behavior lived inside that one class, with no OTHER object it depended on to do its job. Most real classes aren\'t like that: a ReviewBoard that must actually email reviewers when a paper is submitted depends on some notification service; a class that must look up whether an author is already registered depends on some repository or directory. Testing that ReviewBoard class by calling its real submit() method, with a REAL notification service wired in, means every single test run genuinely sends an email (or fails because no real mail server is reachable in a test environment, or is slow, or is non-deterministic depending on network conditions) — none of which has anything to do with whether ReviewBoard\'s OWN logic (reject blank titles, track pending count, call the notifier exactly once) is correct.',
        'A TEST DOUBLE is a stand-in object, implementing the same interface as a real collaborator, substituted into the class under test specifically so the test can control and observe that collaborator\'s behavior without touching whatever the real one actually does. This is a direct application of the interfaces-default-methods lesson\'s core idea — LogPose\'s Searchable interface let a caller depend on "something searchable" without caring which concrete implementation it got — except now the whole POINT of that seam is to let a TEST swap in a controllable substitute where production code would use the real thing. "Test double" is deliberately a stunt-double metaphor: a stunt double stands in for the real actor for one dangerous, expensive, or hard-to-control scene, and nobody is confused about whether the stunt double IS the actor.'
      ]
    },
    {
      h: 'Four kinds of double, precisely distinguished: stub, mock, spy, fake',
      p: [
        'These four terms get used loosely (and often interchangeably as "mocking") in casual conversation, but they mean genuinely different things, and knowing which one a test actually needs avoids both under-testing and the over-mocking smells covered later. A STUB is a double that returns CANNED, pre-programmed answers to specific calls, and the test cares only about what the stub HANDS BACK to the class under test — Mockito\'s when(stub.someMethod(x)).thenReturn(y) is a stub in action: no matter what the class under test does internally, calling someMethod(x) on this double always returns y. A MOCK is a double the test uses to VERIFY THAT SPECIFIC INTERACTIONS HAPPENED — not what it returns, but whether (and how many times, and with what arguments) the class under test actually CALLED it; Mockito\'s verify(mock).someMethod(x) is checking an interaction occurred, not inspecting a return value at all.',
        'A SPY wraps a REAL object and lets its real methods actually run, while additionally recording which calls were made — Mockito\'s spy(realObject) is genuinely different from mock(SomeInterface.class): a spy\'s un-stubbed methods execute the REAL implementation, whereas a plain mock\'s un-stubbed methods return a harmless default (null, 0, false) and never touch real logic at all. A FAKE is a genuinely WORKING, simplified alternative implementation of the real interface — not canned answers, not a wrapper, an actual lightweight implementation, most commonly an in-memory version of something whose real form is slow or external (an in-memory FakePaperRepository backed by a HashMap standing in for a real PostgreSQL-backed one, arriving properly in Part 8). The distinction that matters most in practice: stubs and mocks are usually built automatically by a mocking FRAMEWORK like Mockito from an interface, on the fly, with no real logic behind them at all; a fake is hand-written CODE with real (if simplified) behavior.'
      ]
    },
    {
      h: 'Mockito: @Mock, when/thenReturn, verify, and ArgumentCaptor',
      p: [
        'Mockito is the dominant Java mocking framework, and its JUnit 5 integration centers on one annotation on the test class: @ExtendWith(MockitoExtension.class), which enables Mockito to recognize @Mock-annotated fields and automatically create (and, critically, automatically RESET) a fresh mock object for each one before every test method — the same fresh-per-test discipline unit-testing-junit5 established for JUnit\'s own test-class instances, now extended to the mock objects a test depends on. @Mock ReviewerNotifier notifier as a field, combined with that extension, gives every test method its own brand-new mock ReviewerNotifier with no memory of any previous test\'s interactions — mocks are not immune to the exact cross-test contamination risk unit-testing-junit5 spent real time on; a mock reused across tests WITHOUT being reset would reintroduce it.',
        'when(mock.someMethod(arg)).thenReturn(value) programs a stub-style canned answer — Mockito allows this on ANY mock object regardless of whether the test also uses verify on it; a single mock can serve as both a stub (its return values are used) and be verified as a mock (its calls are checked) in the same test. verify(mock).someMethod(arg) checks that someMethod(arg) was called EXACTLY ONCE with that exact argument (Mockito raises a clear failure listing the actual invocations if it wasn\'t) — verify(mock, times(2)).someMethod(arg) checks a specific count, and verify(mock, never()).someMethod(anyString()) checks a call did NOT happen, essential for testing that a validation failure short-circuits BEFORE a collaborator is ever touched. Mockito\'s ArgumentMatchers (anyString(), anyInt(), eq(x), any(SomeClass.class)) let verify or when match calls more loosely than one exact literal value. ArgumentCaptor<String> goes a step further than a matcher: it CAPTURES the actual argument a method was called with for the test to inspect afterward with ordinary assertions — necessary when the exact expected value isn\'t known ahead of time (a generated ID, a timestamped message) but its SHAPE still needs checking.'
      ]
    },
    {
      h: 'When a mock lies: interaction-based tests can pass while the real system is broken',
      p: [
        'This is the lesson\'s central, deliberately uncomfortable idea, and it follows directly and mechanically from what a stub actually is. when(notifier.notify(anyString())).thenReturn(...) — or, for a void method, simply mocking ReviewerNotifier at all — makes the test\'s ReviewerNotifier behave EXACTLY as the test author told it to behave, with zero connection whatsoever to how the REAL notification service actually behaves. If the real ReviewerNotifier implementation has a bug (throws on a null author field, silently drops notifications past a rate limit, requires a parameter the interface doesn\'t even capture), a test that mocks ReviewerNotifier and asserts verify(notifier).notify("some title") passes PERFECTLY — it only confirms that ReviewBoard CALLED notify with that argument, never that a real ReviewerNotifier would have handled that call correctly. The mock cannot lie about what it was told to do; it can only "lie" in the sense that its behavior was never required to match reality in the first place, and nothing about writing the mock-based test forces that match to be checked anywhere.',
        'This directly parallels assertThrows from unit-testing-junit5: assertThrows verifies an exception\'s TYPE and nothing else unless you inspect further; a mock-based test verifies that an INTERACTION happened in the SHAPE the test author expected, and nothing else about whether that shape reflects the real collaborator\'s actual contract. This is not a flaw in Mockito, or a sign the test was written carelessly — it is an INHERENT, structural limit of interaction-based unit testing with mocks: a mock-heavy test suite can be 100% green while two real classes, each individually well-tested against mocks of the other, would fail immediately the moment they\'re wired together for real, because each one\'s mock of the other quietly encoded an assumption about the other\'s behavior that was never actually verified against the real implementation. This is precisely the gap integration-testing (next in Part 7) exists to close — tests that wire REAL collaborators together, specifically to catch exactly this class of mock-hid-a-real-mismatch bug that no amount of additional mock-based unit testing could ever find.'
      ]
    },
    {
      h: 'Over-mocking: when reaching for a mock makes a test worse, not more thorough',
      p: [
        'Because Mockito can mock almost anything, it is tempting to mock EVERYTHING a class touches — but several specific patterns make a test suite more brittle without making it more correct. Mocking a type you don\'t OWN (a JDK class, a third-party library\'s class) means the mock encodes YOUR assumption about how that class behaves, which can silently drift out of sync with how the real class actually behaves across a library upgrade — mocking your OWN interfaces (ReviewerNotifier, AuthorDirectory — seams you designed specifically to be substitutable) is safe in a way mocking someone else\'s concrete class is not. DEEP STUBBING — mocking a call chain like when(repository.findAuthor(id).getAddress().getCity()).thenReturn("Water 7") — hides the real shape of a collaboration behind several layers of mock-returns-mock, and usually signals the code under test is reaching too far into an object it should be asking a more direct question of instead (a classic "tell, don\'t ask" violation, worth a mental flag independent of testing at all).',
        'VERIFYING IMPLEMENTATION DETAILS rather than observable behavior — asserting a private-feeling internal collaborator was called in some exact incidental sequence that has nothing to do with the class\'s actual contract — makes a test fail the moment someone refactors HOW the class does its job, even when WHAT it does for callers hasn\'t changed at all; this is the single most common reason teams learn to fear refactoring code that has "good" test coverage, when the actual problem is tests coupled to implementation rather than behavior. And using a mock for something a real, cheap, deterministic object could stand in for just as well — mocking a String, a List, a genuinely simple in-memory value class — adds Mockito ceremony with no benefit over just constructing the real thing, since the real thing is already fast, controllable, and side-effect-free. The general judgment call this lesson leaves the reader with: reach for a mock or stub specifically when the REAL collaborator is slow, external, non-deterministic, or expensive to set up (a network call, a database, a real email send) — reach for a plain real object, or a hand-written fake, whenever the real thing is already cheap and predictable.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky\'s proving ground: a target that lies about what a real enemy ship would do',
      text: 'Before Franky ever fires a new experimental cannon at an actual enemy ship, he tests it on a PROVING GROUND — a stand-in target, not the real ship, specifically because the real ship is expensive, dangerous, and impossible to control (a test double, standing in for a real collaborator that\'s slow, external, or risky to use directly). Franky builds several different kinds of target depending on exactly what he\'s checking. A plain post that ALWAYS reports "solid hit, target destroyed" no matter where the cannonball actually lands is a STUB — useful only for checking that the CANNON CREW\'S firing procedure runs correctly end to end, never for judging whether the shot itself was any good. A target rigged with pressure sensors that silently RECORD exactly where and how many times it was hit, checked afterward against the crew\'s intended firing pattern, is a MOCK — Franky isn\'t reading a canned response off it, he\'s verifying the crew actually fired the sequence they were supposed to. Bringing an actual retired warship out of dry dock, letting it react and take damage for REAL, but bolting extra sensors onto it to additionally log every impact, is a SPY — the real ship\'s real physics still happen, Franky just gets extra records on top. And building a smaller, cheaper, but genuinely SEAWORTHY practice vessel with real (if scaled-down) hull physics — not canned, not just instrumented, an actual lightweight working ship — is a FAKE. Here\'s the trap Franky drills into every apprentice gunner: the always-reports-a-hit stub target never once simulates a REAL enemy ship\'s evasive turns or reinforced hull plating — a crew that trains ONLY against that stub can pass every single proving-ground drill with a flawless record, and then get outmaneuvered by the first real enemy ship that doesn\'t sit still and doesn\'t behave like the target promised it would.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Rehearsing the big ask on a stand-in boss, the night before the real one',
      text: 'The night before Sheldon has to ask the department chair for something difficult, the guys run a REHEARSAL with someone standing in for the real chair — never the real chair themselves, since the real one is exactly the person you can\'t risk a bad first attempt on (a test double for a collaborator that\'s risky, unavailable, or expensive to use directly). Howard plays the stand-in chair by saying the exact same canned line — "Denied, next!" — no matter what Sheldon actually says, useful only for checking that Sheldon can get THROUGH his prepared speech without freezing up, never for judging whether his ARGUMENT is any good: a STUB. Leonard plays the stand-in chair AND secretly keeps a checklist, revealed afterward, of exactly which required points Sheldon actually hit and in what order — not reacting with canned lines at all, just silently VERIFYING Sheldon\'s speech covered "tenure record" and "grant history" in the right sequence: a MOCK. Raj, famously unable to fake a reaction convincingly, is asked to just react HOW HE ACTUALLY WOULD to Sheldon\'s pitch — genuinely real reactions — while Amy stands next to him with a clicker silently tallying how many times Sheldon interrupts: Raj\'s real reactions plus an added tally is a SPY. And Amy separately builds an actual simplified scoring rubric — not a person at all, a real, working (if simplified) checklist system that scores any argument against the department\'s actual stated criteria — a FAKE. Here\'s the exact trap the group falls into: Sheldon rehearses almost exclusively against Howard\'s always-says-"Denied"-anyway stub, walks in feeling perfectly prepared, and the REAL chair — who doesn\'t behave like the stub at all, and actually asks a specific follow-up question the stub never once posed — catches him completely flat-footed, because flawlessly passing every stub-based rehearsal never once proved he could handle the REAL chair\'s actual behavior.',
    },
    why: 'Franky\'s always-hits target and Howard\'s always-says-"Denied" stand-in are STUBS — canned answers, useful for testing the surrounding process, never a stand-in for real behavior. The pressure-sensor target and Leonard\'s silent checklist are MOCKS — verifying an interaction happened, not judging a return value. The instrumented retired warship and Raj-plus-tally-clicker are SPIES — real behavior still happens, just additionally recorded. The scaled seaworthy practice vessel and Amy\'s real scoring rubric are FAKES — genuine, simplified, working implementations. And in both stories, a crew or a person that trains ONLY against a stub that never behaves like the real thing can pass every rehearsal flawlessly and still get blindsided the moment the real target or the real chair doesn\'t behave the way the stub promised — precisely how a mock-based unit test suite can be 100% green while the real, wired-together system is broken.'
  },
  storyAnim: {
    title: 'Four targets, four purposes, and the one that never behaves like the real thing',
    h: 320,
    props: [
      { id: 'stub', emoji: '🎯', label: 'always reports "hit" no matter what (STUB — canned answer)', x: 8, y: 10 },
      { id: 'mock', emoji: '📡', label: 'sensors silently record which shots landed where (MOCK — verifies interaction)', x: 30, y: 10 },
      { id: 'spy', emoji: '🚢', label: 'a real retired ship, real physics, extra sensors bolted on (SPY — real + recorded)', x: 52, y: 10 },
      { id: 'fake', emoji: '⛵', label: 'a smaller but genuinely seaworthy practice vessel (FAKE — real, simplified)', x: 74, y: 10 },
      { id: 'realship', emoji: '🏴‍☠️', label: 'a real enemy ship: evasive turns, reinforced hull, never behaves like the stub', x: 30, y: 50 },
      { id: 'surprise', emoji: '⚠️', label: 'flawless stub drills, then blindsided by the real ship\'s actual behavior', x: 52, y: 50 }
    ],
    actors: [
      { id: 'franky', emoji: '🛠️', label: 'Franky', x: 20, y: 74 },
      { id: 'crew', emoji: '⚓', label: 'gun crew', x: 65, y: 74 }
    ],
    steps: [
      { c: 'Franky\'s stub target always reports "solid hit" no matter where the shot actually lands — good for checking the crew\'s FIRING PROCEDURE, not the shot itself.', p: { stub: 'lit' }, a: { franky: [20, 26] } },
      { c: 'The sensor-rigged target silently records exactly where and how many times it was hit, checked afterward against the intended pattern — a mock verifies interactions, it does not hand back a canned answer.', p: { mock: 'lit' } },
      { c: 'The instrumented retired warship reacts for real — real physics, real damage — with extra sensors just adding records on top. That\'s a spy.', p: { spy: 'lit' }, a: { crew: [65, 60] } },
      { c: 'The scaled practice vessel is smaller, but genuinely seaworthy — real, working, simplified behavior, not canned answers. That\'s a fake.', p: { fake: 'lit' } },
      { c: 'A REAL enemy ship turns, evades, and has reinforced plating the stub target never simulated even once.', p: { realship: 'bad' } },
      { c: 'A crew that trained only against the always-hits stub passes every drill flawlessly — and gets blindsided the first time a real ship doesn\'t behave the way the stub promised.', p: { surprise: 'bad' } }
    ]
  },
  conceptFlow: {
    title: 'From test doubles to Mockito syntax to the mock-lies limit',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Why doubles',
        nodes: [
          { id: 'seam', text: 'an interface collaborator = a seam\nfor swapping in a controllable double' },
          { id: 'why', text: 'real collaborator may be slow,\nexternal, non-deterministic, or risky' }
        ]
      },
      {
        label: 'Four kinds',
        nodes: [
          { id: 'stub', text: 'STUB: canned answers\n(when/thenReturn)' },
          { id: 'mock', text: 'MOCK: verifies interactions\n(verify(...))' },
          { id: 'spy', text: 'SPY: wraps a REAL object,\nrecords calls, real behavior runs' },
          { id: 'fake', text: 'FAKE: a real, simplified,\nworking implementation' }
        ]
      },
      {
        label: 'Mockito API',
        nodes: [
          { id: 'extension', text: '@ExtendWith(MockitoExtension.class)\n+ @Mock: fresh mock per test' },
          { id: 'verifytimes', text: 'verify(mock, times(n)/never())\n.method(args)' },
          { id: 'captor', text: 'ArgumentCaptor: inspect the\nactual argument passed' }
        ]
      },
      {
        label: 'The limit',
        nodes: [
          { id: 'lies', text: 'a stub\'s canned answer has no\nconnection to real behavior' },
          { id: 'integration', text: 'integration tests (next lesson)\nclose exactly this gap' }
        ]
      }
    ],
    steps: [
      { active: ['seam'], note: 'A class depending on an interface (not a concrete class) gives a test a place to substitute a controllable double for the real collaborator.' },
      { active: ['why'], note: 'Doubles matter most when the real collaborator is slow (a database), external (an email service), non-deterministic (a clock, a random ID), or risky to invoke repeatedly in a test.' },
      { active: ['stub'], note: 'A stub returns pre-programmed answers — the test cares what it hands back, never whether or how it was called.' },
      { active: ['mock'], note: 'A mock is used to verify a specific interaction occurred — the test cares whether (and how) a method was called, not what it returns.' },
      { active: ['spy'], note: 'A spy wraps a real object: un-stubbed calls run the REAL implementation, with calls additionally recorded.' },
      { active: ['fake'], note: 'A fake is genuine working code — usually a simplified in-memory stand-in for something whose real form is slow or external.' },
      { active: ['extension'], note: '@ExtendWith(MockitoExtension.class) with @Mock fields gives every test method a fresh mock, the same per-test isolation discipline as JUnit\'s own fresh test instances.' },
      { active: ['verifytimes'], note: 'verify(mock, times(n)) and verify(mock, never()) check an exact call count, essential for confirming a collaborator was (or was deliberately NOT) touched.' },
      { active: ['captor'], note: 'ArgumentCaptor captures the actual argument a mock was called with, for further assertions when the exact expected value isn\'t known ahead of time.' },
      { active: ['lies'], note: 'A stub\'s canned answer is only ever what the test author told it to return — it has no built-in connection to what the real collaborator actually does.' },
      { active: ['integration'], note: 'This is exactly the gap integration tests exist to close: wiring real collaborators together to catch mismatches no amount of mock-based unit testing alone can find.' }
    ]
  },
  tech: [
    {
      q: 'Precisely distinguish a Mockito mock from a Mockito spy, and give a concrete scenario where using a mock instead of a spy (or vice versa) would produce a misleading test.',
      a: 'mock(SomeInterface.class) (or an @Mock field) creates an object with NO real implementation behind it at all — every method, unless explicitly stubbed with when(...).thenReturn(...), returns a harmless default (null for objects, 0 for numeric primitives, false for boolean) and none of the real class\'s actual logic ever runs. spy(realObject) wraps an ACTUAL, already-constructed real object — calling an un-stubbed method on a spy runs the REAL method\'s real logic, with Mockito additionally recording that the call happened, and only methods explicitly stubbed with when(spy.someMethod()).thenReturn(...) get overridden away from their real behavior. A misleading-mock scenario: testing a Backlog-like class\'s mostRecent() method by mocking a List<String> collaborator entirely — mock(List.class) — and stubbing get(anyInt()) to return a fixed string; this passes regardless of whether the real ArrayList\'s actual index arithmetic is correct, since the mock never runs real List logic at all, making the test worthless for catching an off-by-one bug in how the index was computed. A misleading-spy scenario in the other direction: spying on a real, already-populated PaperRepository backed by a real (if in-memory) database connection specifically to verify one method was called, but the spy\'s un-stubbed methods still genuinely execute real queries against that real backing store — if the intent was actually to ISOLATE the test from the database entirely (the more common intent), a spy silently fails to provide that isolation, since real behavior underneath still runs unless every reachable method is explicitly stubbed.'
    },
    {
      q: 'A test stubs when(directory.isKnownAuthor("nami")).thenReturn(true) and asserts that SubmissionGate.submit("nami", "some title") succeeds without throwing. The REAL AuthorDirectory implementation has a bug where isKnownAuthor always returns false for any author name containing an apostrophe or accented character. Does this test catch that bug? Explain precisely why or why not.',
      a: 'No, this test cannot catch that bug, and the reason is structural, not a mistake in how the test was written: the stub\'s when(directory.isKnownAuthor("nami")).thenReturn(true) line tells the MOCK directory to return true for that exact call, completely independently of what the REAL AuthorDirectory implementation would actually do for that same input — the mock has no code path connecting it to the real implementation at all, so a bug living inside the real implementation\'s logic (the apostrophe/accent handling) simply cannot be exercised, because the real implementation\'s code never runs during this test. This test correctly verifies that SubmissionGate.submit() behaves correctly GIVEN that isKnownAuthor returns true — that is a genuinely useful, narrow claim — but it says absolutely nothing about whether isKnownAuthor WOULD actually return true for "nami" (or for "José" or "O\'Brien") when backed by the real implementation. Catching that specific bug requires a DIFFERENT test entirely: one that calls the real AuthorDirectory implementation directly (a unit test of AuthorDirectory itself, with no mocking at all) or an integration test wiring the real AuthorDirectory into a real SubmissionGate — either approach actually runs the buggy accent-handling code path, which the mock-based SubmissionGate test structurally cannot do.'
    },
    {
      q: 'Explain what "deep stubbing" is (e.g. when(repo.find(id).getAuthor().getName()).thenReturn("Nami")), and why it is generally considered a design smell independent of whether it makes tests harder to write.',
      a: 'Deep stubbing is chaining when(...) across a sequence of method calls on the RETURN VALUES of mocked methods — repo.find(id) returns a mock itself (Mockito auto-generates these nested mocks when configured for deep stubs), whose getAuthor() in turn returns ANOTHER mock, whose getName() is finally stubbed to return a real value. This works mechanically in Mockito but signals a design problem independent of the testing difficulty: repo.find(id).getAuthor().getName() is the code under test reaching THROUGH a Paper object, THROUGH an Author object, just to pull out a String — a violation of the "tell, don\'t ask" principle, since the calling code needs to know the internal shape of Paper (that it exposes an Author) and Author (that it exposes a name) rather than simply asking the Paper directly for what it needs (a paper.authorName() method, say). The design smell shows up as a TESTING symptom (a test needing three nested mock layers just to get one value back feels awkward to write) precisely because it\'s downstream of a real structural problem: code with long navigation chains through several intermediate objects is fragile to change in production too — if Author\'s internal shape changes, every caller reaching through Paper.getAuthor().getName() breaks, not just this one test\'s deep stub. The fix in both places is usually the same: give Paper a direct authorName() method, collapsing the chain, which both simplifies the real code\'s coupling AND removes the need for deep stubbing in the test entirely.'
    },
    {
      q: 'A code reviewer flags a test that uses verify(notifier, times(1)).notify(anyString()) as "testing an implementation detail" and suggests it should instead assert on ReviewBoard\'s observable state. Steelman the reviewer\'s objection, then explain when verifying a mock interaction like this one is actually the RIGHT call despite the objection.',
      a: 'The reviewer\'s objection, steelmanned: verify(notifier, times(1)).notify(anyString()) locks the test to the EXACT MECHANISM ReviewBoard currently uses to notify reviewers — specifically that it calls notifier.notify() exactly once, synchronously, during submit(). If ReviewBoard is later refactored to batch notifications and send them via a different method, or to queue them for asynchronous delivery through an entirely different collaborator, this test breaks even though ReviewBoard\'s OBSERVABLE BEHAVIOR from a caller\'s perspective (submitting a paper eventually notifies reviewers) hasn\'t meaningfully changed — this is exactly the "tests coupled to implementation, not behavior" brittleness the concept section warns makes teams afraid to refactor. However, this verify call is actually the RIGHT tool here specifically because notifying reviewers has NO OTHER OBSERABLE EFFECT that a state-based assertion could check — unlike pendingCount() or isEmpty(), which are real, inspectable state on ReviewBoard itself, "an email got sent" produces no return value and no state change on ReviewBoard that a test could assert on directly; the ONLY way to verify this behavior happened AT ALL is to check that the collaborator responsible for it was actually invoked. The general rule this resolves to: prefer state-based assertions (checking a return value, a getter) whenever the behavior under test produces inspectable state, and reach for interaction verification (verify) specifically for behaviors whose only observable effect IS an interaction with a collaborator — a side-effecting action a real object has no other way to reveal happened.'
    }
  ],
  code: {
    title: 'Mocking a ReviewerNotifier collaborator: stubbing, verifying, and never()',
    intro: 'ReviewBoard now depends on a ReviewerNotifier interface. The test isolates ReviewBoard from any real notification mechanism using @Mock, verifies notify() was called with the right argument, and verifies it was NEVER called when validation fails first.',
    code: `import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.List;

interface ReviewerNotifier {
    void notify(String paperTitle);
}

class ReviewBoard {
    private final List<String> pending = new ArrayList<>();
    private final ReviewerNotifier notifier;

    ReviewBoard(ReviewerNotifier notifier) {
        this.notifier = notifier;
    }

    void submit(String paperTitle) {
        if (paperTitle == null || paperTitle.isBlank()) {
            throw new IllegalArgumentException("paperTitle must not be blank");
        }
        pending.add(paperTitle);
        notifier.notify(paperTitle);   // the collaborator being isolated in tests
    }

    int pendingCount() { return pending.size(); }
}

@ExtendWith(MockitoExtension.class)
class ReviewBoardMockTest {

    @Mock
    ReviewerNotifier notifier;   // a fresh mock is created before EVERY test method

    ReviewBoard board;

    @BeforeEach
    void setUp() {
        board = new ReviewBoard(notifier);
    }

    @Test
    void submitNotifiesExactlyOnceWithTheSubmittedTitle() {
        board.submit("flaky test taxonomy");

        verify(notifier, times(1)).notify("flaky test taxonomy");
    }

    @Test
    void submitNeverNotifiesWhenValidationFailsFirst() {
        assertThrows(IllegalArgumentException.class, () -> board.submit(null));

        // the notifier must NEVER be touched if submit() rejected the input first
        verify(notifier, never()).notify(anyString());
    }

    @Test
    void submitStillUpdatesStateRegardlessOfWhatTheNotifierDoes() {
        board.submit("second paper");

        assertEquals(1, board.pendingCount());   // state-based assertion -- no mock needed here
    }
}`,
    notes: [
      '@ExtendWith(MockitoExtension.class) plus @Mock gives every test method its own fresh ReviewerNotifier mock -- one test\'s verify() history can never leak into another test, the same discipline unit-testing-junit5 established for JUnit\'s own fresh instances.',
      'submitNotifiesExactlyOnceWithTheSubmittedTitle verifies an INTERACTION (notify was called, once, with that exact string) -- there is nothing else observable about notification for a state-based assertion to check instead.',
      'submitNeverNotifiesWhenValidationFailsFirst uses verify(..., never()) to prove the notifier is untouched when submit() rejects its input -- catching a bug where validation might accidentally run AFTER the notification instead of before it.',
      'submitStillUpdatesStateRegardlessOfWhatTheNotifierDoes deliberately uses a plain state assertion instead of verify() -- pendingCount() is real, inspectable state, so there is no need to verify an interaction to check it.'
    ]
  },
  lab: {
    title: 'Mock an AuthorDirectory collaborator to test SubmissionGate in isolation',
    prompt: 'Given an interface <code>AuthorDirectory</code> with method <code>boolean isKnownAuthor(String author)</code>, and a class <code>SubmissionGate</code> with constructor <code>SubmissionGate(AuthorDirectory directory)</code> and method <code>void submit(String author, String title)</code> (throws <code>IllegalStateException</code> if <code>directory.isKnownAuthor(author)</code> is false, otherwise records the submission) and <code>int acceptedCount()</code>, write a Mockito-based JUnit 5 test class <code>SubmissionGateTest</code> that: (1) is annotated <code>@ExtendWith(MockitoExtension.class)</code>; (2) has an <code>@Mock AuthorDirectory directory</code> field and a <code>SubmissionGate gate</code> field assigned fresh in <code>@BeforeEach</code>; (3) has a <code>@Test</code> that stubs <code>directory.isKnownAuthor("nami")</code> to return <code>true</code>, calls <code>gate.submit("nami", "a title")</code>, and asserts <code>acceptedCount()</code> equals 1; (4) has a <code>@Test</code> that stubs <code>isKnownAuthor("unknown")</code> to return <code>false</code> and uses <code>assertThrows</code> to verify <code>submit("unknown", "a title")</code> throws <code>IllegalStateException</code>; (5) has a <code>@Test</code> that stubs a known author, submits, and uses <code>verify(directory, times(1))</code> to confirm <code>isKnownAuthor</code> was called exactly once with that author.',
    starter: `import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubmissionGateTest {

    @Mock
    AuthorDirectory directory;

    SubmissionGate gate;

    @BeforeEach
    void setUp() {
        // TODO: assign a fresh SubmissionGate(directory) to gate
    }

    @Test
    void knownAuthorSubmissionIsAccepted() {
        // TODO: when(directory.isKnownAuthor("nami")).thenReturn(true)
        // TODO: gate.submit("nami", "a title")
        // TODO: assertEquals(1, gate.acceptedCount())
    }

    @Test
    void unknownAuthorSubmissionThrows() {
        // TODO: when(directory.isKnownAuthor("unknown")).thenReturn(false)
        // TODO: assertThrows(IllegalStateException.class, () -> gate.submit("unknown", "a title"))
    }

    @Test
    void submitChecksTheDirectoryExactlyOnce() {
        // TODO: stub a known author, submit, then verify(directory, times(1)).isKnownAuthor("nami")
    }
}`,
    checks: [
      { re: '@ExtendWith\\(\\s*MockitoExtension\\.class\\s*\\)', must: true, hint: 'The class must be annotated @ExtendWith(MockitoExtension.class).', pass: '@ExtendWith(MockitoExtension.class) used ✓' },
      { re: '@Mock', must: true, hint: 'directory must be annotated @Mock.', pass: '@Mock used ✓' },
      { re: 'gate\\s*=\\s*new\\s+SubmissionGate\\s*\\(\\s*directory\\s*\\)', must: true, hint: 'setUp() must assign a fresh SubmissionGate(directory) to gate.', pass: 'fresh SubmissionGate created ✓' },
      { re: 'when\\(\\s*directory\\.isKnownAuthor\\(\\s*"nami"\\s*\\)\\s*\\)\\s*\\.thenReturn\\(\\s*true\\s*\\)', must: true, hint: 'Stub directory.isKnownAuthor("nami") to return true.', pass: 'stub for known author ✓' },
      { re: 'assertEquals\\(\\s*1\\s*,\\s*gate\\.acceptedCount\\(\\)\\s*\\)', must: true, hint: 'Assert acceptedCount() equals 1 after a known-author submission.', pass: 'acceptedCount check ✓' },
      { re: 'when\\(\\s*directory\\.isKnownAuthor\\(\\s*"unknown"\\s*\\)\\s*\\)\\s*\\.thenReturn\\(\\s*false\\s*\\)', must: true, hint: 'Stub directory.isKnownAuthor("unknown") to return false.', pass: 'stub for unknown author ✓' },
      { re: 'assertThrows\\(\\s*IllegalStateException\\.class', must: true, hint: 'Use assertThrows(IllegalStateException.class, ...) for the unknown-author case.', pass: 'assertThrows for unknown author ✓' },
      { re: 'verify\\(\\s*directory\\s*,\\s*times\\(\\s*1\\s*\\)\\s*\\)\\s*\\.isKnownAuthor\\(\\s*"nami"\\s*\\)', must: true, hint: 'Use verify(directory, times(1)).isKnownAuthor("nami") to confirm the interaction.', pass: 'verify times(1) used ✓' }
    ],
    run: 'mvn test — with a SubmissionGate implementation matching the described contract present on the classpath, all three tests should pass, isolated entirely from any real AuthorDirectory implementation.',
    solution: `import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubmissionGateTest {

    @Mock
    AuthorDirectory directory;

    SubmissionGate gate;

    @BeforeEach
    void setUp() {
        gate = new SubmissionGate(directory);
    }

    @Test
    void knownAuthorSubmissionIsAccepted() {
        when(directory.isKnownAuthor("nami")).thenReturn(true);

        gate.submit("nami", "a title");

        assertEquals(1, gate.acceptedCount());
    }

    @Test
    void unknownAuthorSubmissionThrows() {
        when(directory.isKnownAuthor("unknown")).thenReturn(false);

        assertThrows(IllegalStateException.class, () -> gate.submit("unknown", "a title"));
    }

    @Test
    void submitChecksTheDirectoryExactlyOnce() {
        when(directory.isKnownAuthor("nami")).thenReturn(true);

        gate.submit("nami", "a title");

        verify(directory, times(1)).isKnownAuthor("nami");
    }
}`,
    notes: [
      '@Mock AuthorDirectory directory is a pure stand-in with no real lookup logic behind it at all -- its behavior is entirely whatever each test\'s when(...) call tells it to be.',
      'knownAuthorSubmissionIsAccepted and unknownAuthorSubmissionThrows both use directory purely as a STUB (its return value drives the test), while submitChecksTheDirectoryExactlyOnce additionally uses it as a MOCK (verifying the interaction itself) -- the same mock object can serve both roles.',
      'None of these tests prove the REAL AuthorDirectory implementation correctly recognizes "nami" as known -- that would require a separate test exercising the real implementation directly, or an integration test wiring the real one into a real SubmissionGate.'
    ]
  },
  quiz: [
    {
      q: 'What is the precise difference between a stub and a mock in test-double terminology?',
      options: ['A stub returns pre-programmed canned answers and the test cares about what it hands back; a mock is used to verify that a specific interaction (a method call, how many times, with what arguments) actually occurred', 'A stub and a mock are two different names for exactly the same thing in Mockito', 'A stub wraps a real object and runs real logic; a mock never runs real logic at all', 'A mock can only be used with void methods, while a stub can only be used with methods that return a value'],
      correct: 0,
      explain: 'A stub is about controlling what a collaborator RETURNS; a mock is about VERIFYING that the class under test called that collaborator in the expected way. The same Mockito mock object can be used as both in the same test.'
    },
    {
      q: 'What is the key behavioral difference between Mockito\'s mock(SomeInterface.class) and spy(realObject)?',
      options: ['An un-stubbed method on a mock returns a harmless default (null/0/false) and never runs real logic; an un-stubbed method on a spy runs the REAL object\'s actual implementation', 'mock() and spy() behave identically -- spy() is just a deprecated alias for mock()', 'spy() can only wrap interfaces, while mock() can only wrap concrete classes', 'A mock automatically resets between test methods, while a spy never does'],
      correct: 0,
      explain: 'A mock has no real implementation behind any method unless explicitly stubbed. A spy wraps an actual real object, so its un-stubbed methods genuinely execute real logic, with calls additionally recorded on top.'
    },
    {
      q: 'A test stubs a mocked PaymentGateway to always return "SUCCESS" and asserts the checkout flow completes. The real PaymentGateway implementation has a bug where it silently fails for amounts over $10,000. Does this mock-based test catch that bug?',
      options: ['No -- the stub\'s canned "SUCCESS" answer has no connection to the real implementation\'s actual logic, so a bug living inside the real implementation cannot be exercised by a test that never runs the real implementation\'s code', 'Yes -- Mockito automatically cross-checks stubbed return values against the real implementation\'s actual behavior', 'Yes, but only if the test also calls verify() on the mock', 'It depends on whether the mock was created with mock() or spy() -- spy() would catch this bug automatically'],
      correct: 0,
      explain: 'A stub\'s return value is entirely whatever the test author told it to be. It has no mechanism connecting it to the real implementation\'s actual behavior, so bugs inside the real implementation are invisible to a test that mocks it away entirely.'
    },
    {
      q: 'Which of these is the clearest example of an "over-mocking" smell that makes a test more brittle without making it more correct?',
      options: ['Stubbing a call chain like when(repo.find(id).getAuthor().getName()).thenReturn(...) -- deep stubbing that hides the real shape of a collaboration behind several layers of mock-returns-mock', 'Using @Mock with @ExtendWith(MockitoExtension.class) to get a fresh mock before every test method', 'Using verify(mock, never()) to confirm a collaborator was correctly NOT called after a validation failure', 'Stubbing a collaborator interface that represents a slow, real, external service like an email sender'],
      correct: 0,
      explain: 'Deep stubbing signals the code under test is reaching through several intermediate objects rather than asking the first one directly for what it needs -- a design smell independent of the testing difficulty, and it makes the test fragile to changes in intermediate objects\' shapes.'
    },
    {
      q: 'Why does the mock-lies limit (a mock-based test passing while the real system is broken) motivate integration testing rather than simply writing MORE mock-based unit tests?',
      options: ['Because more mock-based unit tests still never run the real collaborator\'s actual code -- only a test that wires real collaborators together can exercise the real interaction and catch a mismatch between what a mock assumed and what the real thing actually does', 'Because mock-based unit tests are slower than integration tests, so replacing them saves time', 'Because Mockito has a hard limit on how many @Mock fields one test class can declare', 'Because integration tests do not require any assertions, only mock-based unit tests do'],
      correct: 0,
      explain: 'No number of additional mock-based unit tests can catch a mismatch between a mock\'s assumed behavior and the real collaborator\'s actual behavior, because none of them ever execute the real collaborator\'s code. Only a test wiring real collaborators together can.'
    }
  ],
  testFlow: {
    title: 'Test yourself: stub vs. mock vs. spy, and the mock-lies limit',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A test double is set up so that un-stubbed method calls run the REAL underlying object\'s actual logic, while a few specific calls are additionally recorded for later verification. Which kind of double is this?',
        choices: [
          { text: 'A spy -- it wraps a real object, so un-stubbed calls execute real behavior, with calls recorded on top', to: 'q1_right' },
          { text: 'A mock -- mocks always run real logic unless explicitly told not to', to: 'q1_wrong_mock' },
          { text: 'A stub -- stubs always wrap a real object underneath their canned answers', to: 'q1_wrong_stub' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- a spy wraps a REAL object; its un-stubbed methods genuinely execute real logic, and Mockito additionally records which calls were made. This is the opposite default from a plain mock.', next: 'q2' },
      q1_wrong_mock: { end: true, correct: false, text: 'Backwards -- a plain Mockito mock() has NO real implementation behind it at all. Un-stubbed methods return a harmless default (null/0/false); none of the real class\'s logic ever runs. That behavior belongs to a spy, not a mock.', retry: 'q1' },
      q1_wrong_stub: { end: true, correct: false, text: 'A stub is specifically about pre-programmed canned answers with no real implementation involved at all -- it is not "a real object with canned answers," it typically has no real object underneath it whatsoever.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A test mocks a PaperRepository and stubs findById(id) to return a specific Paper object, then asserts the class under test formats that paper\'s title correctly. A teammate says this test also proves PaperRepository.findById() correctly queries the real database. Are they right?',
        choices: [
          { text: 'No -- the stub\'s return value is entirely controlled by the test author and has no connection to whether the real PaperRepository\'s actual database query logic is correct', to: 'q2_right' },
          { text: 'Yes -- Mockito validates every stub against the real implementation\'s actual behavior before allowing the test to pass', to: 'q2_wrong_validates' },
          { text: 'Yes, but only because the stubbed method name matches the real method\'s name exactly', to: 'q2_wrong_namematch' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- this is the mock-lies limit in action: the stub\'s canned Paper object was handed to the test by the test author, not produced by any real database query, so this test says nothing about whether the real findById() implementation is correct.', next: 'q3' },
      q2_wrong_validates: { end: true, correct: false, text: 'Mockito performs no such validation -- a stub\'s return value is exactly and only what when(...).thenReturn(...) specifies, with zero automatic connection to any real implementation\'s actual behavior.', retry: 'q2' },
      q2_wrong_namematch: { end: true, correct: false, text: 'Method-name matching is just how Mockito knows WHICH method to stub -- it has nothing to do with whether the stubbed return value reflects what the real implementation would actually produce.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A team has 200 mock-based unit tests, all green, for two classes (OrderService and PaymentGateway) that are always tested against mocks of each other, never against each other\'s real implementation. What is the most likely gap in their test suite, and what closes it?',
        choices: [
          { text: 'An integration test wiring the REAL OrderService and REAL PaymentGateway together -- only that can catch a mismatch between what each side\'s mocks assumed and what the other side actually does when wired together for real', to: 'q3_right' },
          { text: 'Nothing -- 200 green mock-based tests already prove the real integration is correct', to: 'q3_wrong_nothing' },
          { text: 'More mock-based unit tests covering additional edge cases on each class individually', to: 'q3_wrong_more_mocks' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- this is precisely the gap mock-based unit testing cannot close by adding more of the same kind of test. Only wiring the real collaborators together (an integration test) exercises the actual interaction between them.', next: null },
      q3_wrong_nothing: { end: true, correct: false, text: 'This is exactly the false confidence the mock-lies limit warns about -- 200 green mock-based tests only prove each class behaves correctly GIVEN its assumptions about the other, never that those assumptions actually match the other class\'s real behavior.', retry: 'q3' },
      q3_wrong_more_mocks: { end: true, correct: false, text: 'More mock-based tests, no matter how many edge cases they cover, still never execute the OTHER class\'s real implementation -- the gap is structural to mock-based testing itself, not a matter of insufficient coverage within that style.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Mocking a type you don\'t own (a JDK class, a third-party library class) instead of your own interface -- the mock encodes an assumption about that class\'s behavior that can silently drift out of sync across a library upgrade, with nothing to catch the mismatch.',
    'Treating a mock-based test\'s all-green result as proof the real, non-mocked interaction is correct -- a stub\'s canned answer has no built-in connection to the real collaborator\'s actual behavior; only a test running the real implementation (or an integration test) can verify that.',
    'Deep stubbing a call chain (when(a.b().c().d()).thenReturn(...)) instead of noticing the code under test is reaching too far through intermediate objects -- usually signals a "tell, don\'t ask" design problem beyond just making the test awkward to write.',
    'Verifying incidental implementation details (an internal call order or an internal collaborator that has nothing to do with the class\'s actual observable contract) instead of behavior -- makes tests fail on harmless refactors, teaching a team to fear refactoring code that actually has good coverage.',
    'Reaching for a mock when a real object would do the job just as well -- mocking a String, a List, or a simple deterministic value class adds ceremony with no isolation benefit, since the real thing is already fast, predictable, and side-effect-free.',
    'Forgetting that @Mock fields need @ExtendWith(MockitoExtension.class) (or manual MockitoAnnotations.openMocks setup) to actually be initialized -- an un-initialized @Mock field is simply null, producing a confusing NullPointerException that has nothing to do with the test\'s actual logic.'
  ],
  interview: [
    {
      q: 'A colleague says "we should mock everything a class depends on, so every unit test is perfectly isolated." Evaluate this claim, using the over-mocking material from this lesson.',
      a: 'The instinct behind the claim is sound but the conclusion overshoots badly, and the precise line matters. Isolating a class under test from collaborators that are slow, external, non-deterministic, or risky (a database, a network call, a real email service) is exactly what test doubles are for, and genuinely makes tests faster and more reliable. But "mock EVERYTHING a class depends on" ignores that many dependencies are already cheap, fast, deterministic, and side-effect-free — a String, a List, a simple immutable value class like a LogPose EntryKey — and mocking those adds Mockito ceremony (when/thenReturn boilerplate, verify calls) with zero isolation benefit, since constructing the real thing is already just as fast and predictable as constructing a mock of it. Worse, over-applying "mock everything" tends to produce exactly the over-mocking smells this lesson names: mocking types the team doesn\'t own (whose real behavior the mock can silently drift out of sync with across a library upgrade), deep stub chains that paper over a design problem rather than exposing it, and tests that verify incidental implementation details rather than observable behavior — the last of which makes a codebase LESS safe to refactor, not more, since harmless internal restructuring now breaks tests that were never actually checking anything a caller could observe. The precise, correct version of the colleague\'s instinct: mock (or fake) collaborators specifically when the REAL one is slow, external, non-deterministic, or expensive to set up in a test; use the real, cheap object everywhere else — isolation should be applied where it earns its cost, not applied uniformly as a blanket rule.'
    },
    {
      q: 'Design a small Mockito-based test suite (describe the test methods, not full code) for a class that processes a purchase: it depends on an InventoryChecker (checks stock) and a PaymentProcessor (charges a card), and should only charge the card if stock is available, decrementing inventory only after a successful charge. Explain which collaborators you\'d mock, what you\'d verify vs. stub, and one thing this suite structurally CANNOT prove.',
      a: 'Both InventoryChecker and PaymentProcessor are exactly the kind of collaborator worth mocking here -- a real inventory check likely hits a database, and a real payment charge is an external, side-effecting, expensive-to-repeat call that a unit test absolutely should not trigger for real on every run. I\'d structure the suite around the three meaningfully different code paths: (1) a happy-path test stubbing inventoryChecker.hasStock(item) to return true and paymentProcessor.charge(...) to return a successful result, then verifying BOTH that charge() was called (an interaction, since a successful charge has no other directly observable effect on the purchase class itself) AND that inventory was decremented afterward via a state-based assertion if the class exposes that state, or via verify(inventoryChecker).decrement(item) if it doesn\'t; (2) an out-of-stock test stubbing hasStock() to return false, asserting the purchase is rejected (via assertThrows or a returned failure result, depending on the real contract), and critically using verify(paymentProcessor, never()).charge(any()) to prove the card is NEVER charged when stock is unavailable -- this is exactly the kind of "prove a side-effecting call did NOT happen" case verify(..., never()) exists for; (3) a payment-failure test stubbing hasStock() true but charge() to return a failure (or throw), asserting the purchase fails overall AND using verify(inventoryChecker, never()).decrement(item) to prove inventory is never decremented for a card that was never successfully charged -- directly testing the stated ordering requirement (charge succeeds BEFORE inventory decrements). What this suite structurally cannot prove: that the REAL InventoryChecker or REAL PaymentProcessor actually behave the way these stubs assume -- whether hasStock() genuinely reflects live stock levels under concurrent purchases (a race condition two simultaneous buyers could both pass the stock check for the last unit), or whether the real payment gateway\'s success/failure contract actually matches what was stubbed here, is entirely invisible to this mock-based suite and would require a genuine integration test wiring real (or realistically faked) versions of both collaborators together.'
    },
    {
      q: 'Explain why a fake (e.g. an in-memory FakePaperRepository backed by a HashMap) is sometimes preferred over a mock for the same collaborator interface, even though both avoid touching a real database in tests.',
      a: 'A mock of a PaperRepository interface only behaves however each individual test explicitly stubs it to behave via when(...).thenReturn(...) -- every test that needs the repository to return something specific has to set that up itself, call by call, and the mock has literally no internal state or consistency of its own between different method calls within the same test (stubbing findById(1) to return a Paper says nothing about what save() or a subsequent findById(1) would do unless each is ALSO separately stubbed). A fake, in contrast, is genuine working code -- an in-memory HashMap-backed FakePaperRepository actually implements save() by putting into the map and findById() by getting from it, so calling save(paper) and then findById(paper.getId()) in the same test genuinely returns the paper that was just saved, without the test author needing to manually stub that consistency into existence. This matters most for tests that exercise a SEQUENCE of interactions with the same collaborator, where wiring up a mock to behave consistently across that whole sequence would require stubbing every single call by hand (and keeping those stubs in sync as the sequence changes) -- a fake gets that consistency for free, because it is a real (if simplified) implementation rather than a set of independent canned answers. The tradeoff: a fake is more work to write once (real logic, however simple) and can itself contain bugs distinct from the real implementation\'s bugs, whereas a mock requires zero implementation work up front but only ever does exactly what each individual test explicitly told it to do, call by call, with no state connecting those calls together.'
    },
    {
      q: 'A test suite has 50 passing unit tests for a NotificationService class, all of which mock its EmailSender collaborator. A production incident later reveals that EmailSender silently swallows exceptions from the underlying SMTP library instead of propagating them, and NotificationService was quietly relying on exceptions propagating to trigger a retry. Diagnose why 50 green tests missed this, and what specific kind of test would have caught it.',
      a: 'This is the mock-lies limit playing out exactly as this lesson describes it, and the diagnosis is mechanical once the structure is named: every one of the 50 tests mocks EmailSender, meaning every single one of them controls EXACTLY how EmailSender behaves via when(...).thenReturn(...) or when(...).thenThrow(...) -- if any of those tests wanted to check NotificationService\'s retry logic, it almost certainly did so by stubbing emailSender.send(...) to THROW an exception directly and then asserting the retry happened, which correctly tests "does NotificationService retry when EmailSender throws" but says absolutely nothing about whether the REAL EmailSender actually throws under the real failure condition it\'s supposed to represent. The real EmailSender\'s bug -- silently swallowing the SMTP library\'s real exception instead of propagating it -- lives entirely inside EmailSender\'s own implementation, a piece of code that literally never executes during any of these 50 tests, since all 50 replace it with a mock before NotificationService ever touches it. No amount of additional mock-based tests of NotificationService could ever find this bug, no matter how many retry scenarios they cover, because the bug isn\'t in NotificationService\'s retry logic at all -- it\'s in EmailSender\'s exception-handling, which mocking EmailSender specifically prevents from ever running. Two tests would have caught it: a plain unit test of EmailSender ITSELF (with the real SMTP library mocked or faked instead, one layer deeper, verifying EmailSender actually propagates rather than swallows a simulated SMTP failure), or an integration test wiring the REAL NotificationService together with the REAL EmailSender and a simulated SMTP failure, which would have surfaced the swallowed exception the moment the two real classes were exercised together instead of through a mock boundary drawn exactly at the point where the bug lived.'
    }
  ]
};
