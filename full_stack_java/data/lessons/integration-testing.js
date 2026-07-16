window.LESSONS = window.LESSONS || {};
window.LESSONS['integration-testing'] = {
  id: 'integration-testing',
  title: 'Integration, E2E & the Test Pyramid: Testcontainers, Spring Tests, Contracts',
  category: 'Part 7 — Testing',
  timeMin: 55,
  summary: 'mockito-test-doubles ended on an uncomfortable cliffhanger: a mock-based unit test can pass while the real, non-mocked interaction is broken, because a stub\'s canned answer has no built-in connection to what a real collaborator actually does. This lesson closes that gap. It covers the TEST PYRAMID (why most tests should be fast unit tests, fewer should be integration tests, and fewest of all should be end-to-end), Testcontainers (spinning up a REAL, disposable Postgres in Docker so a test exercises real SQL against a real database instead of a mock), a preview of Spring\'s testing slices (@SpringBootTest/@WebMvcTest/@DataJpaTest — you\'ll use these for real in Part 9), and contract tests (verifying two independently-built components agree on an interface\'s shape without needing to run both together for every single test).',
  goals: [
    'Explain the test pyramid: why unit tests should be the most numerous, integration tests fewer, and end-to-end tests fewest, in terms of speed, isolation, and confidence',
    'Write a Testcontainers-based JUnit 5 integration test that runs real SQL against a real, ephemeral PostgreSQL container, and explain why the container is shared across a class while its DATA must be reset per test',
    'Explain, concretely, how an integration test wiring REAL collaborators together catches a class of bug that a mock-based unit test structurally cannot',
    'Describe what @SpringBootTest, @WebMvcTest, and @DataJpaTest each load and mock, at a preview level, ahead of Part 9\'s deeper Spring coverage',
    'Explain what a contract test verifies and why it exists as a middle ground between fast-but-mock-based unit tests and slow-but-fully-real end-to-end tests'
  ],
  concept: [
    {
      h: 'The test pyramid: why most tests should be small, fast, and isolated',
      p: [
        'unit-testing-junit5 and mockito-test-doubles both built tests that ran in milliseconds, with every collaborator either absent entirely or replaced by a double — no real database, no real network call, no real file system. The TEST PYRAMID is the standard shape a healthy test suite has, organized around exactly that tradeoff: a WIDE BASE of many fast, cheap, fully-isolated UNIT tests (hundreds or thousands, each running in milliseconds, pinpointing failures to one specific class or method), a NARROWER middle layer of fewer INTEGRATION tests (dozens to low hundreds, each running in tens of milliseconds to a few seconds, verifying that two or more REAL components work correctly together — a real repository against a real database, a real HTTP client against a real running server), and a SMALL TIP of very few END-TO-END (E2E) tests (a handful, each running in seconds, driving the entire real system exactly the way a real user or a real other service would, through its actual outermost interface).',
        'The shape matters because of a direct cost tradeoff: a unit test pinpoints a failure precisely (this one method, this one class) and runs fast enough to execute on every save; an E2E test proves the WHOLE system genuinely works together but is slow, often flaky for reasons that have nothing to do with the actual bug being hunted (a slow-starting container, network timing), and when it fails, tells you almost nothing about WHERE in the system the problem is. A team that inverts the pyramid — few unit tests, mostly E2E tests, sometimes called an "ice cream cone" anti-pattern — ends up with a test suite that\'s both slow to run AND unhelpful when it fails, since a failing E2E test could mean the bug is in literally any of the dozens of real components it exercised together. The right instinct, and the one this lesson\'s two new layers exist to support: push as much verification as possible down to fast unit tests, use integration tests specifically for the SEAMS where real components meet (a repository\'s actual SQL, a real notifier\'s actual behavior), and reserve E2E tests for the handful of critical, whole-system user journeys worth the slowness.'
      ]
    },
    {
      h: 'Testcontainers: a real, disposable Postgres for real integration tests',
      p: [
        'Testcontainers is a Java library that programmatically starts and stops REAL Docker containers — a real PostgreSQL server, a real Kafka broker, a real Redis instance — scoped to a test run, giving an integration test genuinely real infrastructure to run against instead of either a hand-maintained shared test database (which every team eventually discovers gets left in a weird state by a previous run) or a mocked/faked substitute that, as mockito-test-doubles established, can never prove the real thing actually behaves as assumed. @Testcontainers on the test class plus @Container on a static PostgreSQLContainer<?> field tells JUnit 5 to manage the container\'s lifecycle automatically — by default, ONE container instance starts before the class\'s tests run and stops after, shared across every test method in that class, precisely because starting a real Docker container is genuinely expensive (seconds, not milliseconds) and repeating that cost before every single test method would make the suite unbearably slow.',
        'This is exactly the @BeforeAll-shared-resource pattern unit-testing-junit5 flagged as a live flakiness risk: a container shared across a whole test class is safe ONLY if its DATA is reset before every test that might depend on a known starting state — typically by TRUNCATing the relevant tables (or rolling back a transaction) in @BeforeEach, the same discipline that lesson\'s concept section named as the fix for @BeforeAll-provided mutable resources. Get this wrong — share the container\'s data across tests without resetting it — and the exact same order-dependent flakiness signature from unit-testing-junit5 reappears, just one layer up: a test that reads data left behind by a PREVIOUS test\'s write, passing or failing depending on execution order. Testcontainers gives real infrastructure; it does not, by itself, give test isolation — that discipline is still the test author\'s job.'
      ]
    },
    {
      h: 'What an integration test catches that a mock-based unit test structurally cannot',
      p: [
        'This directly resolves mockito-test-doubles\' central cliffhanger. That lesson\'s ReviewBoardMockTest verified verify(notifier, times(1)).notify("flaky test taxonomy") — proving ReviewBoard CALLS its notifier correctly, and nothing whatsoever about whether a REAL ReviewerNotifier implementation actually delivers that notification correctly. An integration test for the same ReviewBoard wires in a REAL (or realistically-faked) ReviewerNotifier — not a mock — and asserts on OBSERABLE STATE afterward (did the real notifier\'s own record of sent notifications actually contain "flaky test taxonomy"?) rather than verifying an interaction happened. The difference is exactly the difference this lesson\'s two Franky/Friends stories dramatize: a rehearsal partner reciting a canned line proves nothing about how a REAL person would react; only putting the real collaborator into the scene for real closes that gap.',
        'This does NOT mean integration tests should re-verify every edge case the mock-based unit tests already covered — ReviewBoardMockTest\'s "submit rejects blank titles" and "submit never notifies when validation fails" tests are still the RIGHT place to check those specific behaviors, since they don\'t depend on the real notifier at all. Integration tests exist specifically for the SEAM itself: does the real collaborator, wired in for real, actually do what the unit tests\' mocks assumed it would? A well-designed suite has a small number of integration tests confirming the wiring and the real collaborators\' real contracts, sitting on top of a much larger number of unit tests confirming each individual class\'s own logic — exactly the pyramid shape, applied to this specific mock-versus-real gap.'
      ]
    },
    {
      h: 'A preview of Spring\'s testing slices (full depth arrives in Part 9)',
      p: [
        'Once Part 9 introduces Spring, most integration tests in a real Java project use Spring\'s own testing annotations rather than wiring components together entirely by hand — worth previewing now, at a shallow level, so the names aren\'t a surprise later. @SpringBootTest starts the ENTIRE application context (every bean, every real wiring, optionally a real embedded or Testcontainers-backed server) — the most realistic, and the slowest, Spring test annotation, appropriate for genuinely whole-application integration or E2E-style tests. @WebMvcTest loads ONLY the web layer (controllers, request mapping, JSON serialization) and automatically MOCKS the service layer beneath it — a narrower, faster test verifying "does this controller handle this HTTP request correctly," deliberately choosing not to re-verify business logic the corresponding unit tests already cover. @DataJpaTest loads ONLY the persistence layer (repositories, entity mappings) and is the natural home for exactly the kind of Testcontainers-backed real-database test this lesson\'s code demo builds by hand — Part 8\'s jpa-hibernate lesson gives it full treatment once Hibernate itself has been taught.',
        'The pattern across all three "slice" annotations is the test-pyramid idea applied inside Spring specifically: load ONLY the layer actually being tested, real, and replace everything else with either nothing (not needed for that layer\'s test) or an automatically-provided mock — narrower, faster tests for narrower concerns, with @SpringBootTest reserved for the smaller number of tests that genuinely need the whole real application wired together.'
      ]
    },
    {
      h: 'Contract tests: verifying an agreement without running both sides together every time',
      p: [
        'As a system grows into multiple independently-deployed services (or even independently-releasable modules within one codebase — Part 6\'s maven-multi-module logpose-core/logpose-search split is a mild version of this), a genuine E2E test that spins up EVERY service together for every single test run becomes progressively slower and more fragile, since a failure could now originate in any of the services being exercised, or in the environment wiring itself, not necessarily a real bug in either side\'s own logic. A CONTRACT TEST is a middle ground specifically for this shape of problem: it verifies that a CONSUMER (something that calls an interface) and a PROVIDER (something that implements it) agree on the exact shape of their interaction — request format, response format, required fields, status codes — WITHOUT requiring both sides to be running together at test time. The consumer\'s team writes and publishes an explicit CONTRACT (a recorded expectation: "when I send this request, I expect a response shaped like this"); the provider\'s own test suite then independently verifies its real implementation actually satisfies that published contract, on ITS OWN schedule, without ever needing the consumer\'s real service running at all.',
        'This is directly the interfaces-default-methods lesson\'s "program to an interface, not an implementation" idea, extended across a genuine deployment boundary rather than just a compile-time one: an interface in one JVM is enforced by the compiler; a contract between two independently-deployed services has no compiler to enforce it, so a contract TEST is the mechanism that plays that same enforcing role at the boundary where the compiler\'s guarantee stops applying. The tradeoff contract tests accept: they catch "does the provider still honor what the consumer expects" mismatches specifically, considerably faster and more reliably than a full E2E test would — but they do NOT prove the two services genuinely work together under real load, real network conditions, or a real multi-step user journey, which is exactly why a SMALL number of true E2E tests still sit at the pyramid\'s tip even in a system with solid contract-test coverage.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky\'s three-stage trial: deck drills, a barricaded bay, then the real Grand Line',
      text: 'Before the Sunny ever sails into a real fight, Franky runs the crew through three genuinely different kinds of trial, and he is precise about what each one actually proves. Stage one, the most frequent by far: individual DECK DRILLS — Zoro alone against a drill dummy, Sanji alone in the galley perfecting one dish, dozens of these every single day, each one fast, cheap, and pinpointing exactly one crew member\'s exact skill in complete isolation (unit tests — many, fast, isolated). Stage two, far rarer: a SHAKEDOWN CRUISE into a real, nearby bay that Franky has physically BARRICADED off for the occasion — real wind, real waves, the REAL ship and the REAL crew working together for real, but bounded, contained, safely disposable, and — crucially — reset and re-barricaded fresh before every single trial run so last week\'s storm damage never contaminates this week\'s (Testcontainers: a real, disposable, isolated instance of the real thing, spun up and torn down per test run, its state wiped between uses). Stage three, rarest and most expensive of all: the actual open Grand Line, real Marines, real currents, nothing contained or reset — the full voyage itself (end-to-end). Franky is emphatic about one thing: a crew that ONLY ever drills alone on deck, never once tests the WHOLE ship together in the barricaded bay, discovers on the actual Grand Line — far too late — that Zoro\'s footwork and the ship\'s real deck layout don\'t actually mesh the way each drill, tested alone, assumed they would. And before allying with another crew for a joint raid, the Straw Hats don\'t re-run a full joint battle rehearsal every single time trust needs confirming — they agree in advance, in writing, on the exact SIGNAL each side will send and expect (a contract), and each crew separately verifies IT can hold up its own end, without needing the other crew\'s ship anywhere nearby to check.',
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica and Chandler\'s wedding: solo toasts, the rehearsal dinner, then the real day',
      text: 'In the run-up to Monica and Chandler\'s wedding, the group runs through three genuinely different kinds of trial, and Monica — predictably — is precise about what each one proves. Stage one, happening constantly in the weeks before: everyone rehearsing their OWN toast ALONE, in the mirror, in the cab, wherever — fast, private, each person perfecting their own three minutes in complete isolation from everyone else\'s (unit tests — many, fast, isolated). Stage two, far rarer: the actual REHEARSAL DINNER — real friends, real family, a REAL (if smaller, lower-stakes) event, catered for real by a real caterer brought in specifically and only for this one dinner, the room reset and re-set fresh the next time anyone needs to rehearse anything in it (Testcontainers: a real, disposable instance of the real thing — a real caterer, a real room — spun up for one trial and not left in whatever state the last use left it in). Stage three, rarest and highest-stakes of all: the actual wedding day itself, nothing contained, nothing a rehearsal, no do-overs (end-to-end). Here\'s the exact trap Monica is terrified of: someone who ONLY ever rehearsed their toast ALONE, never once delivering it in front of REAL people at the rehearsal dinner, discovers on the actual wedding day — far too late — that the joke landing perfectly in their bedroom mirror lands completely differently in front of an actual crowd, which is precisely the gap a solo rehearsal (or, worse, mockito-test-doubles\' friend-reciting-a-canned-line stand-in) can never reveal, and only a REAL audience at the rehearsal dinner can. And rather than re-confirming with the caterer, in full, at every single planning meeting whether the actual food for 150 real people will arrive correctly, Monica gets the exact quantities, dishes, and delivery time down in a signed CONTRACT — and separately, on its own schedule, confirms the caterer\'s kitchen can actually fulfill it, without needing to stage a full rehearsal dinner with all 150 real guests just to check.',
    },
    why: 'Deck drills / solo toast rehearsals are unit tests — many, fast, fully isolated. The barricaded bay / rehearsal dinner is an integration test using something like Testcontainers — a REAL instance of the real thing (a real bay, a real caterer), contained and disposable, reset fresh before every use, closing exactly the gap a mock or a canned-line stand-in cannot: does the real thing actually behave the way the isolated drills assumed? The full Grand Line voyage / the actual wedding day is end-to-end — rare, high-stakes, nothing contained. And the signed alliance signal / the signed catering contract is a contract test — verifying both sides agree on the exact shape of what\'s expected, independently, without needing to run a full joint trial together every single time.'
  },
  storyAnim: {
    title: 'Deck drills, the barricaded bay reset before every trial, and the real Grand Line',
    h: 320,
    props: [
      { id: 'drills', emoji: '🥋', label: 'solo deck drills, dozens a day (unit tests: many, fast, isolated)', x: 8, y: 10 },
      { id: 'bay', emoji: '🌊', label: 'barricaded bay, real ship + real crew, RESET before every trial (integration / Testcontainers)', x: 32, y: 10 },
      { id: 'stale', emoji: '⚠️', label: 'a bay NOT reset: last week\'s storm damage contaminates this trial', x: 56, y: 10 },
      { id: 'grandline', emoji: '🏴‍☠️', label: 'the real Grand Line, nothing contained (end-to-end — rare, highest stakes)', x: 78, y: 10 },
      { id: 'contract', emoji: '📜', label: 'a signed alliance signal, verified separately by each side (contract test)', x: 32, y: 50 }
    ],
    actors: [
      { id: 'franky', emoji: '🛠️', label: 'Franky', x: 20, y: 74 },
      { id: 'crew', emoji: '⚓', label: 'crew', x: 60, y: 74 }
    ],
    steps: [
      { c: 'Every crew member drills alone, constantly — fast, cheap, pinpointing one skill in isolation. That\'s the wide base of the pyramid: unit tests.', p: { drills: 'good' }, a: { franky: [20, 26] } },
      { c: 'Far less often, the real ship and real crew run a trial in a bay Franky physically barricaded off for the occasion — real, but contained and disposable. That\'s an integration test, and the barricading/resetting is what Testcontainers automates.', p: { bay: 'lit' }, a: { crew: [40, 60] } },
      { c: 'If that bay is NOT reset before the next trial, last week\'s damage silently contaminates this week\'s results — the exact @BeforeAll-shared-resource risk from unit-testing-junit5, one layer up.', p: { stale: 'bad' } },
      { c: 'Rarest of all: the actual open Grand Line, nothing contained, nothing rehearsed. That\'s end-to-end — the small tip of the pyramid.', p: { grandline: 'bad' } },
      { c: 'Before a joint raid, allied crews agree in writing on the exact signal each side expects, and each verifies its own side separately — no need to stage a full joint battle every time. That\'s a contract test.', p: { contract: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'From the pyramid shape to Testcontainers to closing the mock-lies gap to contracts',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'The pyramid',
        nodes: [
          { id: 'unit', text: 'unit: most numerous,\nfastest, fully isolated' },
          { id: 'integration', text: 'integration: fewer,\nreal components wired together' },
          { id: 'e2e', text: 'e2e: fewest,\nwhole real system, slowest' }
        ]
      },
      {
        label: 'Testcontainers',
        nodes: [
          { id: 'container', text: 'a REAL, ephemeral Docker\ncontainer (e.g. Postgres) for the test' },
          { id: 'sharedreset', text: 'container shared per class (@BeforeAll),\ndata reset per test (@BeforeEach)' }
        ]
      },
      {
        label: 'Closing the mock-lies gap',
        nodes: [
          { id: 'realcollab', text: 'wire in the REAL collaborator,\nnot a mock' },
          { id: 'stateassert', text: 'assert on real observable state,\nnot a verified interaction' }
        ]
      },
      {
        label: 'Beyond one service',
        nodes: [
          { id: 'springslices', text: '@SpringBootTest / @WebMvcTest /\n@DataJpaTest (preview, Part 9)' },
          { id: 'contract', text: 'contract tests: verify an agreement\nwithout running both sides together' }
        ]
      }
    ],
    steps: [
      { active: ['unit'], note: 'The base of the pyramid: many fast, fully-isolated tests, each pinpointing one class or method\'s own logic.' },
      { active: ['integration'], note: 'A narrower middle layer: fewer tests, each verifying real components genuinely work together.' },
      { active: ['e2e'], note: 'A small tip: very few tests, each driving the whole real system through its actual outermost interface.' },
      { active: ['container'], note: 'Testcontainers starts a real Docker container (Postgres, Kafka, Redis) scoped to the test run, giving integration tests genuinely real infrastructure.' },
      { active: ['sharedreset'], note: 'Starting a container is expensive, so it\'s shared for a whole test class — but its DATA must be reset before every test, or the exact @BeforeAll-shared-mutable-resource risk from unit-testing-junit5 reappears.' },
      { active: ['realcollab'], note: 'An integration test wires in the REAL collaborator instead of a mock — closing mockito-test-doubles\' central gap.' },
      { active: ['stateassert'], note: 'It asserts on real observable state produced by that real collaborator, rather than verifying that an interaction merely occurred.' },
      { active: ['springslices'], note: '@SpringBootTest loads everything real; @WebMvcTest loads only the web layer and mocks the service layer; @DataJpaTest loads only persistence — full depth in Part 9.' },
      { active: ['contract'], note: 'A contract test verifies a consumer and provider agree on an interaction\'s shape without running both together for every test — a middle ground as a system grows past one service.' }
    ]
  },
  tech: [
    {
      q: 'Explain precisely why a Testcontainers-managed PostgreSQL container is typically started once per test CLASS (via @BeforeAll semantics) rather than once per test METHOD, and what specific discipline is required to keep that safe, referencing unit-testing-junit5\'s @BeforeAll warning.',
      a: 'Starting a real Docker container is genuinely expensive — realistically hundreds of milliseconds to a few seconds, dominated by the database engine\'s own startup sequence — which is orders of magnitude slower than the rest of a typical unit or integration test. Repeating that cost before every single @Test method in a class with, say, ten test methods would make the class alone take ten times longer than necessary for no benefit, since the container\'s STARTUP has nothing to do with any individual test\'s logic. So Testcontainers\' JUnit 5 integration (@Testcontainers plus a static @Container field) defaults to starting the container once, shared across the whole class, exactly the @BeforeAll pattern. This reintroduces precisely the risk unit-testing-junit5 named explicitly: a @BeforeAll-provided resource is only safe to share across tests if it stays read-only, or if each test explicitly restores it to a known state — for a shared database container, that means every test needing a clean starting point must reset the relevant tables (TRUNCATE, or a transaction rolled back in @AfterEach) in its OWN @BeforeEach, not rely on the CONTAINER\'s one-time startup to also mean "and the data is fresh." Skipping this reset produces the exact same order-dependent flakiness signature that lesson warned about: a test reading data left behind by a different test that happened to run first, passing or failing depending on execution order.'
    },
    {
      q: 'A team has a mock-based unit test verifying ReviewBoard calls notifier.notify(title) exactly once, and separately, a Testcontainers-based integration test verifying a real JdbcPaperRepository correctly saves and retrieves a Paper from a real Postgres. Explain why NEITHER test alone, nor both together, proves the full system works end-to-end when a real HTTP client submits a paper through a real running server.',
      a: 'Each test proves something real and useful, but each is scoped narrowly, and neither closes every gap between them. The mock-based ReviewBoard test proves ReviewBoard\'s OWN logic correctly calls its notifier collaborator — it says nothing about the real notifier\'s behavior (that gap is what integration testing exists to close), and nothing at all about how an HTTP request actually REACHES ReviewBoard in the first place (routing, request parsing, authentication — layers that don\'t exist in this test at all). The Testcontainers-based repository test proves JdbcPaperRepository correctly translates Paper objects to and from real SQL against a real database — a genuinely valuable, different seam — but says nothing about ReviewBoard\'s validation logic, nothing about the notifier, and again nothing about how an HTTP request reaches any of this code. Even having BOTH tests green together doesn\'t prove they\'re correctly WIRED TOGETHER inside the real running application — that ReviewBoard is actually configured to use THIS JdbcPaperRepository implementation, that the real web layer correctly translates an incoming HTTP request into the right method calls on the right beans, that the real server actually starts up with a valid configuration at all. Proving THAT requires a test one layer up — a genuine end-to-end test that starts the real application (or a realistic slice of it, per the Spring-testing-slices preview) and drives it through its actual outermost interface, exactly why the pyramid still needs a small number of E2E tests even when the unit and integration layers underneath it are both healthy and well-covered.'
    },
    {
      q: 'Compare @WebMvcTest and @DataJpaTest at the preview level this lesson covers: what does each load for real, what does each replace with a double, and why would using @SpringBootTest for both cases instead be a pyramid-shape mistake?',
      a: '@WebMvcTest loads only the web/controller layer for real — the actual controller classes, request mapping, JSON serialization — and automatically substitutes a mock (typically via Mockito, directly connecting back to this course\'s Part 7 sequence) for the service layer beneath it, so a @WebMvcTest can verify "does this controller parse this request and produce this response shape correctly" without needing any real business logic or real database underneath it at all. @DataJpaTest is the mirror image, scoped to the opposite end: it loads only the persistence layer for real (repositories, entity mappings, typically against a real or Testcontainers-backed database) and has no involvement with the web layer whatsoever. Using @SpringBootTest — which loads the ENTIRE real application context, every bean, every real wiring — for BOTH of these narrower concerns would be exactly the pyramid-shape mistake the test pyramid warns against: a test that only needs to check controller-level request/response shaping doesn\'t need a real database wired in at all, and a test that only needs to check repository SQL doesn\'t need the real web layer wired in at all, so using the heaviest, slowest annotation for both makes the whole suite slower for zero additional confidence about the SPECIFIC seam each test actually cares about — the same "push verification down to the narrowest test that can catch it" instinct that motivates unit tests over integration tests, and integration tests over E2E tests, applied one level deeper inside Spring\'s own testing tools.'
    },
    {
      q: 'A consumer service and a provider service pass their contract test suite, but when deployed together in production, a real request fails because the provider recently started requiring a new mandatory field the consumer never sends. Diagnose exactly what went wrong with the contract, not just the deployment.',
      a: 'This is the precise failure mode contract testing is designed to catch, and its occurrence here points at a specific process gap rather than a flaw in the idea of contract testing itself: a contract test passes when the PROVIDER\'s test suite verifies its real implementation satisfies the CONSUMER-published contract, and separately, the CONSUMER\'s own test suite verifies it correctly sends and handles requests/responses shaped like that same published contract — the whole mechanism depends on both sides testing against the SAME, CURRENT version of the contract. A provider that added a new mandatory field WITHOUT that change being reflected in the published contract the consumer\'s tests are actually verifying against would pass its own newly-changed implementation against an OUTDATED contract file, and the consumer would separately pass its own tests against that same outdated contract, with neither side\'s test suite ever exercising the ACTUAL current mismatch — both suites are genuinely green, and both are correctly verifying an agreement that no longer reflects reality. This is exactly the boundary the concept section names explicitly: contract tests verify SHAPE agreement, not real end-to-end behavior under real deployment — the actual fix here is procedural, not just technical: the provider\'s change to require a new mandatory field should have been a BREAKING CONTRACT CHANGE requiring the published contract itself to be updated (and the consumer\'s tests to be re-verified against the new version) BEFORE that provider change was deployed, not discovered after the fact in production. This is also precisely why a small number of true E2E tests running against actually-deployed real services remain valuable even with solid contract-test coverage — an E2E test exercising the real current deployment would have caught this specific staleness that both sides\' individually-passing contract tests missed.'
    }
  ],
  code: {
    title: 'A real, disposable Postgres via Testcontainers: shared container, reset data',
    intro: 'A JdbcPaperRepository tested against a REAL PostgreSQL container (not a mock, not an in-memory substitute) — the container is started once for the whole class, but its data is truncated fresh before every test, exactly the discipline unit-testing-junit5\'s @BeforeAll warning requires.',
    code: `import org.junit.jupiter.api.*;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.sql.*;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;

record Paper(String id, String title, String author) {}

interface PaperRepository {
    void save(Paper paper);
    Optional<Paper> findById(String id);
}

class JdbcPaperRepository implements PaperRepository {
    private final DataSource dataSource;

    JdbcPaperRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void save(Paper paper) {
        String sql = "INSERT INTO papers (id, title, author) VALUES (?, ?, ?)";
        try (Connection c = dataSource.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, paper.id());
            ps.setString(2, paper.title());
            ps.setString(3, paper.author());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public Optional<Paper> findById(String id) {
        String sql = "SELECT id, title, author FROM papers WHERE id = ?";
        try (Connection c = dataSource.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return Optional.empty();
                return Optional.of(new Paper(rs.getString("id"), rs.getString("title"), rs.getString("author")));
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}

@Testcontainers
class PaperRepositoryIntegrationTest {

    @Container   // one REAL Postgres container, started once, shared for the whole class
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine").withDatabaseName("logpose_test");

    static DataSource dataSource;
    PaperRepository repository;

    @BeforeAll
    static void createSchemaOnceOnTheSharedContainer() throws SQLException {
        dataSource = DataSourceFactory.forJdbcUrl(
            postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute("CREATE TABLE IF NOT EXISTS papers (id TEXT PRIMARY KEY, title TEXT, author TEXT)");
        }
    }

    @BeforeEach
    void resetDataBeforeEveryTest() throws SQLException {
        // the CONTAINER is shared, but the DATA is wiped before every single test --
        // otherwise one test's row is visible to the next, order-dependently
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute("TRUNCATE TABLE papers");
        }
        repository = new JdbcPaperRepository(dataSource);
    }

    @Test
    void saveThenFindByIdReturnsTheSameRealPaper() {
        repository.save(new Paper("p1", "flaky test taxonomy", "nami"));

        Optional<Paper> found = repository.findById("p1");

        assertTrue(found.isPresent());
        assertEquals("flaky test taxonomy", found.get().title());
    }

    @Test
    void findByIdReturnsEmptyForAnUnknownId() {
        assertTrue(repository.findById("does-not-exist").isEmpty());
    }
}`,
    notes: [
      'The @Container field starts a REAL PostgreSQL server in a Docker container -- the SQL in JdbcPaperRepository runs against a real database engine, not a mock and not an in-memory approximation.',
      '@BeforeAll starts the container and creates the schema ONCE for the whole class, since container startup is genuinely expensive -- exactly the "expensive, must be safe to share" case unit-testing-junit5 described.',
      '@BeforeEach TRUNCATEs the papers table before every single test -- the container is shared, but its DATA is not, closing exactly the risk unit-testing-junit5 warned a @BeforeAll-shared MUTABLE resource introduces.',
      'No part of this test mocks anything -- it is deliberately the opposite of mockito-test-doubles\' isolated unit tests, proving the real SQL, the real column types, and the real driver behavior all actually work together.'
    ]
  },
  lab: {
    title: 'Close the mock-lies gap: wire a REAL ReviewerNotifier into ReviewBoard',
    prompt: 'Given interface <code>ReviewerNotifier { void notify(String paperTitle); }</code>, class <code>ReviewBoard(ReviewerNotifier notifier)</code> with <code>void submit(String paperTitle)</code> and <code>int pendingCount()</code> (from mockito-test-doubles), and a class <code>InMemoryReviewerNotifier implements ReviewerNotifier</code> with a method <code>List&lt;String&gt; notifiedTitles()</code> returning every title notified so far in order, write an integration test class <code>ReviewBoardIntegrationTest</code> that: (1) creates a REAL <code>InMemoryReviewerNotifier</code> (no Mockito, no <code>@Mock</code>) and a real <code>ReviewBoard</code> wired to it, both fresh in <code>@BeforeEach</code>; (2) has a <code>@Test</code> that submits two papers and asserts, via a state-based assertion on <code>notifiedTitles()</code>, that the list equals both titles in submission order; (3) asserts <code>pendingCount()</code> equals 2 in that same test.',
    starter: `import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import java.util.List;

class ReviewBoardIntegrationTest {

    private InMemoryReviewerNotifier notifier;
    private ReviewBoard board;

    @BeforeEach
    void setUp() {
        // TODO: assign a fresh, REAL InMemoryReviewerNotifier to notifier
        // TODO: assign a fresh ReviewBoard wired to that real notifier
    }

    @Test
    void submittingTwoPapersNotifiesBothInOrderForReal() {
        // TODO: board.submit(...) twice with two different titles
        // TODO: assertEquals(List.of(title1, title2), notifier.notifiedTitles())
        // TODO: assertEquals(2, board.pendingCount())
    }
}`,
    checks: [
      { re: 'notifier\\s*=\\s*new\\s+InMemoryReviewerNotifier\\s*\\(', must: true, hint: 'setUp() must assign a fresh, real InMemoryReviewerNotifier -- no @Mock, no Mockito.', pass: 'real InMemoryReviewerNotifier created ✓' },
      { re: 'board\\s*=\\s*new\\s+ReviewBoard\\s*\\(\\s*notifier\\s*\\)', must: true, hint: 'setUp() must assign a fresh ReviewBoard wired to the real notifier.', pass: 'ReviewBoard wired to real notifier ✓' },
      { re: '@Mock|Mockito|mock\\(', must: false, hint: 'This is an integration test -- it must not use Mockito or @Mock at all; the notifier must be real.', pass: 'no Mockito used ✓' },
      { re: 'board\\.submit\\(', must: true, hint: 'The test must call board.submit(...) at least once.', pass: 'submit() called ✓' },
      { re: 'assertEquals\\(\\s*List\\.of\\(', must: true, hint: 'Use assertEquals(List.of(title1, title2), notifier.notifiedTitles()) as a state-based assertion.', pass: 'state-based List assertion ✓' },
      { re: 'notifier\\.notifiedTitles\\(\\)', must: true, hint: 'Assert against notifier.notifiedTitles() directly -- no verify() call, since this is a real object, not a mock.', pass: 'notifiedTitles() checked ✓' },
      { re: 'assertEquals\\(\\s*2\\s*,\\s*board\\.pendingCount\\(\\)\\s*\\)', must: true, hint: 'Assert board.pendingCount() equals 2 after submitting two papers.', pass: 'pendingCount check ✓' }
    ],
    run: 'mvn test — with InMemoryReviewerNotifier and ReviewBoard implementations matching their described contracts on the classpath, this test proves the REAL notifier actually records what ReviewBoard reports sending, closing the gap mockito-test-doubles\' mock-based test could not.',
    solution: `import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import java.util.List;

class ReviewBoardIntegrationTest {

    private InMemoryReviewerNotifier notifier;
    private ReviewBoard board;

    @BeforeEach
    void setUp() {
        notifier = new InMemoryReviewerNotifier();
        board = new ReviewBoard(notifier);
    }

    @Test
    void submittingTwoPapersNotifiesBothInOrderForReal() {
        board.submit("flaky test taxonomy");
        board.submit("mutation testing survey");

        assertEquals(List.of("flaky test taxonomy", "mutation testing survey"), notifier.notifiedTitles());
        assertEquals(2, board.pendingCount());
    }
}`,
    notes: [
      'InMemoryReviewerNotifier is a FAKE, not a mock or a stub -- it is genuinely working code (a real List backing notifiedTitles()) rather than a Mockito-generated object told what to return.',
      'The assertion on notifier.notifiedTitles() is state-based, checking what the real notifier actually recorded -- the direct integration-test counterpart to mockito-test-doubles\' verify(notifier, times(1)).notify(...) interaction check.',
      'This test would immediately catch a bug where ReviewBoard notified with the wrong title, or in the wrong order, or not at all for the second paper -- none of which mockito-test-doubles\' mock-based test could ever reveal, since that test\'s mock had no real logic behind it at all.'
    ]
  },
  quiz: [
    {
      q: 'What shape does a healthy test pyramid have, and why?',
      options: ['Many fast unit tests at the base, fewer integration tests in the middle, and very few end-to-end tests at the top -- because unit tests are cheapest and most precise, while E2E tests are slowest and least specific about where a failure lives', 'An equal number of unit, integration, and end-to-end tests, since each layer is equally important', 'Mostly end-to-end tests with a few unit tests, since E2E tests give the most realistic confidence', 'Mostly integration tests, since unit tests and E2E tests are both considered redundant once Testcontainers is available'],
      correct: 0,
      explain: 'The pyramid shape reflects a direct cost tradeoff: unit tests are fast and pinpoint failures precisely; integration tests verify real components work together at a real seam; E2E tests are slowest and, when they fail, give the least specific information about where the actual bug is.'
    },
    {
      q: 'A Testcontainers-managed PostgreSQL container is started once via @BeforeAll and shared across all @Test methods in a class. What must still happen for this to be safe, based on unit-testing-junit5\'s @BeforeAll warning?',
      options: ['The container\'s DATA (e.g. the relevant tables) must be reset before every test, typically in @BeforeEach, or one test\'s data can leak into another test order-dependently', 'Nothing further is needed -- Testcontainers automatically resets all data before every @Test method by default', 'The container must be restarted (stopped and started again) before every single @Test method', '@BeforeAll-shared containers should never be used for integration tests at all'],
      correct: 0,
      explain: 'Sharing an expensive-to-start container across a class is fine, but its mutable DATA is not automatically reset -- exactly the @BeforeAll-shared-mutable-resource risk unit-testing-junit5 described, requiring explicit per-test cleanup (e.g. TRUNCATE in @BeforeEach).'
    },
    {
      q: 'mockito-test-doubles built a test verifying verify(notifier, times(1)).notify("some title") on a MOCKED ReviewerNotifier. What does the corresponding integration test from this lesson do differently, and why does that matter?',
      options: ['It wires in a REAL (or realistically-faked) ReviewerNotifier and asserts on its actual recorded state, catching a mismatch between what the mock assumed and what the real notifier actually does -- something the mock-based test structurally cannot catch', 'It uses the exact same mocked notifier and the exact same verify() call, just running the test twice for extra confidence', 'It replaces assertions entirely with print statements for manual inspection', 'It removes the notifier dependency from ReviewBoard entirely so no collaborator needs testing'],
      correct: 0,
      explain: 'A mock\'s canned behavior has no connection to what a real collaborator actually does. Wiring in the real (or a genuinely working fake) collaborator and checking its real resulting state is exactly what closes the "mock lies" gap.'
    },
    {
      q: 'At the preview level this lesson covers, what is the key difference between @WebMvcTest and @DataJpaTest?',
      options: ['@WebMvcTest loads only the web/controller layer for real and mocks the service layer beneath it; @DataJpaTest loads only the persistence layer for real, with no involvement from the web layer at all', '@WebMvcTest and @DataJpaTest are two names for exactly the same Spring testing annotation', '@WebMvcTest loads the entire application context, while @DataJpaTest loads nothing at all', '@DataJpaTest is used exclusively for end-to-end tests, while @WebMvcTest is used exclusively for unit tests'],
      correct: 0,
      explain: 'Each Spring test "slice" loads only the layer it actually needs to test for real, and replaces or omits the rest -- @WebMvcTest for the web layer (mocking the service layer), @DataJpaTest for the persistence layer, narrower and faster than loading the whole application with @SpringBootTest.'
    },
    {
      q: 'What does a contract test verify, and what does it deliberately NOT prove, compared to a true end-to-end test?',
      options: ['It verifies a consumer and provider agree on the shape of their interaction, without running both together -- but it does not prove the two actually work correctly together under real load or a real multi-step journey, which is why a small number of true E2E tests still matter', 'It verifies the exact same thing an end-to-end test does, just implemented with a different library', 'It only checks that the provider\'s code compiles, without checking any request or response shape at all', 'It replaces the need for both integration tests and end-to-end tests entirely once adopted'],
      correct: 0,
      explain: 'Contract tests are a middle ground: faster and more reliable than full E2E for catching shape mismatches between independently-deployed components, but they don\'t prove real end-to-end behavior under real conditions -- E2E tests still have a role at the pyramid\'s tip.'
    }
  ],
  testFlow: {
    title: 'Test yourself: the pyramid, Testcontainers discipline, and closing the mock-lies gap',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A team has 500 unit tests, 40 integration tests, and 300 end-to-end tests. Based on the test pyramid, what\'s the most likely problem with this suite?',
        choices: [
          { text: 'The shape is inverted from the ideal -- far too many slow, hard-to-diagnose E2E tests relative to unit tests, likely making the whole suite slow and failures hard to localize', to: 'q1_right' },
          { text: 'There is no problem -- more end-to-end tests always means more confidence, regardless of the ratio to unit tests', to: 'q1_wrong_more' },
          { text: 'The problem is having any integration tests at all -- a healthy suite should have zero', to: 'q1_wrong_zero' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- 300 E2E tests against only 500 unit tests is close to an "ice cream cone" shape: slow to run, and when something fails, an E2E failure gives far less specific information about WHERE the bug is than a failing unit test would.', next: 'q2' },
      q1_wrong_more: { end: true, correct: false, text: 'More E2E tests do add confidence, but at a steep cost in speed and diagnostic precision -- a failing E2E test could mean the bug is in any of the many real components it exercises, unlike a failing unit test, which points at one specific class or method.', retry: 'q1' },
      q1_wrong_zero: { end: true, correct: false, text: 'Integration tests fill a genuinely necessary role: verifying real components (a real repository against a real database, a real collaborator wired in for real) work together at the seams unit tests, by design, never touch at all.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A Testcontainers-backed integration test class starts one shared PostgreSQL container via @BeforeAll but has NO data-reset logic in @BeforeEach. Tests pass individually but fail intermittently when run as a full class. What\'s the most likely cause?',
        choices: [
          { text: 'A row inserted by one test is still present in the database when a later test runs, and that later test\'s assertions implicitly depend on a clean starting state -- the exact @BeforeAll-shared-mutable-resource risk from unit-testing-junit5', to: 'q2_right' },
          { text: 'Testcontainers containers are inherently unreliable and randomly fail to start about 10% of the time', to: 'q2_wrong_unreliable' },
          { text: 'PostgreSQL cannot be used inside Docker containers for automated testing at all', to: 'q2_wrong_cantuse' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- sharing the container is fine and necessary for speed, but sharing its DATA without resetting it between tests reintroduces order-dependent flakiness one layer above where unit-testing-junit5 first described it.', next: 'q3' },
      q2_wrong_unreliable: { end: true, correct: false, text: 'Testcontainers-managed containers are not inherently flaky -- the far more likely and far more common cause of intermittent, order-dependent failures is unreset shared data between tests, exactly the scenario described.', retry: 'q2' },
      q2_wrong_cantuse: { end: true, correct: false, text: 'PostgreSQL running inside a Docker container for tests is precisely what Testcontainers is built for and is extremely common in real projects -- this isn\'t a technical limitation at all.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'mockito-test-doubles\' ReviewBoardMockTest and this lesson\'s ReviewBoardIntegrationTest both exist in the same suite. Should the integration test also re-verify that submit(null) throws IllegalArgumentException, which the mock-based unit test already covers?',
        choices: [
          { text: 'No -- that specific validation behavior doesn\'t depend on the real notifier at all, so the unit test is already the right, faster place to check it; the integration test should focus on the seam the unit test cannot reach (the real notifier\'s real behavior)', to: 'q3_right' },
          { text: 'Yes -- every behavior should be re-verified at every layer of the test pyramid for maximum safety', to: 'q3_wrong_everylayer' },
          { text: 'Yes, but only because integration tests are more trustworthy than unit tests in general', to: 'q3_wrong_moretrust' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- this is the pyramid\'s cost-tradeoff idea applied directly: push verification down to the fastest test that can actually catch it, and reserve integration tests for the seam (the real collaborator\'s real behavior) that only they can verify.', next: null },
      q3_wrong_everylayer: { end: true, correct: false, text: 'Re-verifying every behavior at every layer defeats the pyramid\'s entire purpose -- it makes the suite far slower for no additional confidence about behavior that doesn\'t depend on the seam the higher layer actually adds.', retry: 'q3' },
      q3_wrong_moretrust: { end: true, correct: false, text: 'Integration tests aren\'t "more trustworthy" in general -- they\'re better suited to a DIFFERENT kind of question (does the real collaborator behave as assumed) than unit tests are, not a strictly superior version of the same question.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Sharing a Testcontainers-managed container across a whole test class without resetting its DATA in @BeforeEach -- reintroduces the exact @BeforeAll-shared-mutable-resource flakiness risk from unit-testing-junit5, one layer up at the database level.',
    'Treating a mock-based unit test and a real-collaborator integration test as redundant with each other -- they verify genuinely different things (the class\'s own logic vs. the real collaborator\'s real behavior), and dropping either one leaves a real gap.',
    'Building an "ice cream cone" suite (many slow E2E tests, few fast unit tests) -- makes the whole suite slow to run and, when something fails, gives little specific information about where the actual bug lives.',
    'Using @SpringBootTest (the full, slowest application context) for a test that only needs to check one narrow layer -- @WebMvcTest or @DataJpaTest (Part 9) give the same confidence about that layer, faster.',
    'Letting a published contract go stale after a provider changes its real implementation, without updating the contract both sides test against -- both sides\' contract tests can stay green while the real, deployed interaction is actually broken.',
    'Assuming contract tests make end-to-end tests unnecessary -- contract tests verify shape agreement, not real behavior under real load or a real multi-step journey; a small number of true E2E tests still belong at the pyramid\'s tip.'
  ],
  interview: [
    {
      q: 'A team\'s CI pipeline takes 45 minutes to run, dominated by 400 end-to-end tests that each spin up the full application and a real database. Diagnose the likely root cause using the test pyramid, and propose a concrete plan to fix it without simply deleting test coverage.',
      a: 'The root cause, almost certainly, is an inverted pyramid: 400 E2E tests is a very large number for the tip of a healthy pyramid, and the fact that each one spins up the FULL application plus a real database suggests many of these tests are verifying behavior that doesn\'t actually require the whole system running together — logic that could be tested at the unit or integration layer, much faster, with equal or better diagnostic precision when it fails. The fix is not to delete coverage, but to RELOCATE it: for each E2E test, ask what specific behavior it\'s actually verifying, and whether that behavior depends on the FULL system being wired together for real, or only on one class\'s own logic (move to a unit test), or only on a real component correctly talking to ONE other real thing like a database (move to a narrower integration test, e.g. Testcontainers-backed and scoped to just that seam, per this lesson, or a Spring test slice like @DataJpaTest once Part 9 lands). A concrete plan: (1) audit the 400 E2E tests and bucket each one by what it\'s actually checking; (2) for buckets that turn out to be testing one class\'s internal logic with no real dependency on the whole system, write the equivalent fast unit test (with mocks/stubs, per mockito-test-doubles) and retire the E2E version; (3) for buckets checking a specific real-component seam (a repository against a real database, say) without needing the WHOLE application, replace with a narrower Testcontainers-backed integration test scoped to just that seam; (4) keep a genuinely small number of E2E tests — the handful of critical, whole-system user journeys that specifically need the full real system running together, which is the pyramid\'s intended tip, not its bulk. The end state trades "400 slow, low-diagnostic-precision E2E tests" for "many fast unit tests, a moderate number of scoped integration tests, and a small number of E2E tests for what genuinely needs them" — same or better coverage, a fraction of the runtime, and failures that point precisely at where the bug actually is.'
    },
    {
      q: 'Explain, step by step, exactly how the ReviewBoardIntegrationTest in this lesson\'s lab would catch a bug that mockito-test-doubles\' ReviewBoardMockTest could not: specifically, a bug where ReviewBoard accidentally calls notifier.notify() with the WRONG paper\'s title when two papers are submitted in quick succession (e.g. a shared mutable field bug reusing the last-seen title for both notifications).',
      a: 'Walk through both tests against this specific bug precisely. mockito-test-doubles\' ReviewBoardMockTest\'s relevant test, submitNotifiesExactlyOnceWithTheSubmittedTitle, only ever submits ONE paper and verifies verify(notifier, times(1)).notify("flaky test taxonomy") — a single-submission test structurally cannot exercise a bug that only manifests across TWO submissions in sequence, since the buggy "reuses the last-seen title" behavior has nothing incorrect to reveal when there\'s only ever been one title to begin with. Even if that mock-based suite added a SECOND mock-based test submitting two papers and verifying two separate notify() calls with the two correct titles, that test COULD in principle catch this specific bug — but the deeper structural point is that the mock is entirely a passive recorder of what it was CALLED with; it has zero real internal state or behavior of its own that could reveal an ordering-dependent implementation bug beyond exactly what verify() is explicitly told to check for. Now walk through the REAL InMemoryReviewerNotifier from this lesson\'s lab: submittingTwoPapersNotifiesBothInOrderForReal submits "flaky test taxonomy" then "mutation testing survey", and asserts assertEquals(List.of("flaky test taxonomy", "mutation testing survey"), notifier.notifiedTitles()) — a genuine state-based check against the REAL notifier\'s own accumulated record. If ReviewBoard\'s buggy implementation reuses a shared mutable field and calls notify() with the wrong (stale, or duplicated) title for the second submission, notifier.notifiedTitles() would ACTUALLY CONTAIN the wrong sequence — List.of("flaky test taxonomy", "flaky test taxonomy") instead of the two distinct expected titles, say — and the assertEquals would fail immediately, precisely because InMemoryReviewerNotifier is a real, working list-backed implementation actually recording what it was told, not a mock whose only opinion about correctness is whatever the test author explicitly programmed into a verify() call.'
    },
    {
      q: 'A junior engineer proposes replacing all of a team\'s Testcontainers-based integration tests with tests that run against an actual shared staging database, arguing "it\'s even more real." Evaluate this proposal.',
      a: 'The instinct — more realism is better — has some truth to it, but the specific proposal trades away something more valuable than what it gains, and it\'s worth being precise about the tradeoff. What a shared staging database genuinely adds over a Testcontainers-managed ephemeral one: it may have realistic DATA VOLUME, realistic configuration drift, and potentially catches environment-specific issues a fresh, minimal Testcontainers instance wouldn\'t reproduce — real considerations, not nothing. But what it loses is exactly what unit-testing-junit5 and this lesson have both spent real time establishing as essential to trustworthy testing: ISOLATION between test runs. A Testcontainers-managed container is disposable and private to one test run — no other test suite, no other developer\'s concurrent CI run, no leftover data from last week is anywhere near it, and the schema is created fresh from scratch by the test itself, so the test is guaranteed to know its own starting state exactly. A SHARED staging database is, by definition, shared — with other test runs happening concurrently (a classic source of the exact order/interleaving-dependent flakiness this whole course keeps returning to, just now across TEST RUNS rather than within one), with manual data changes other engineers make, with schema drift that hasn\'t been captured anywhere reproducible. A team adopting the junior engineer\'s proposal would very likely trade "occasionally missing an environment-specific edge case" for "a test suite that is now flaky for reasons entirely unrelated to the code under test, and impossible to run in parallel or in isolation" — a worse trade for almost every team, which is exactly why Testcontainers (disposable, isolated, reproducible from a known schema) is the standard approach rather than testing against shared real infrastructure. The realistic middle ground, if genuine staging-specific issues keep slipping through: a SMALL number of scheduled tests that DO run against staging specifically to catch environment drift, kept separate from and much smaller in number than the fast, isolated Testcontainers-based suite that runs on every commit.'
    },
    {
      q: 'Explain why a contract test is described in this lesson as "the interfaces-default-methods lesson\'s program-to-an-interface idea, extended across a deployment boundary." What specifically stops a compiler from providing the same guarantee across that boundary that it provides within one JVM?',
      a: 'Within a single JVM, program-to-an-interface works because the COMPILER enforces it: if class ReviewBoard depends on interface ReviewerNotifier, the compiler guarantees at COMPILE TIME that any class claiming to implement ReviewerNotifier actually provides every method the interface declares, with matching signatures — a provider that doesn\'t satisfy the interface simply fails to compile, full stop, before the program ever runs. This guarantee is possible specifically because both the interface DEFINITION and every implementation of it are compiled together, in the same build, checked by the same compiler, against the same bytecode-level contract. The moment two components are independently DEPLOYED — a consumer service and a provider service, built by different teams, on different release schedules, potentially in different languages entirely — that shared-compilation guarantee simply doesn\'t exist anymore: the consumer\'s build has no way to compile-time-check that the provider\'s CURRENTLY DEPLOYED version still honors the agreed-upon request/response shape, because the provider\'s code isn\'t even present in the consumer\'s build at all, and vice versa. A contract test is the mechanism that manually reconstructs that enforcement at runtime, across the deployment boundary, where the compiler\'s automatic guarantee stops applying: the published contract plays the role the interface DEFINITION plays at compile time, and each side\'s independently-run contract test plays the role the compiler\'s implements-check plays — verifying, on its own schedule, that its actual code still honors that shared, explicit agreement, since nothing else is going to catch a violation automatically the way a compile error would within one JVM.'
    }
  ]
};
