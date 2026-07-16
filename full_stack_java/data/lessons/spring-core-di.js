window.LESSONS = window.LESSONS || {};
window.LESSONS['spring-core-di'] = {
  id: 'spring-core-di',
  title: 'Spring Core: Inversion of Control, Dependency Injection & Beans',
  category: 'Part 9 — Backend with Spring',
  timeMin: 50,
  summary: 'Every constructor this course has written since mockito-test-doubles\' ReviewBoard(ReviewerNotifier notifier) has been practicing DEPENDENCY INJECTION by hand — a class receiving its collaborators from OUTSIDE rather than constructing them itself, specifically because that\'s what made substituting a mock or a fake in tests possible at all. Spring automates exactly this wiring at the scale of a whole application: instead of manually constructing every object and threading dependencies through by hand (as every "new SomeService(new SomeDependency())" in this course\'s code demos has done), Spring\'s IoC (Inversion of Control) container constructs your objects (BEANS) and wires their dependencies together FOR you, based on annotations. This lesson covers @Component/@Service/@Repository, constructor vs. field injection (and precisely why this course\'s constructor-injection habit has been the right one all along), bean scopes — including a genuine flaky-test-adjacent danger in the default singleton scope — and @Bean/@Configuration for wiring classes you don\'t own, like jdbc-transactions\' DataSource.',
  goals: [
    'Explain Inversion of Control precisely: what "control" is being inverted, and why Spring constructing and wiring your objects is a different model than your code constructing its own dependencies',
    'Explain why constructor injection is preferred over field injection, connecting directly to this course\'s existing constructor-injected test doubles from mockito-test-doubles',
    'Use @Component/@Service/@Repository to register beans and understand how Spring resolves constructor dependencies automatically',
    'Explain Spring\'s default singleton bean scope precisely, and identify the concrete flaky/shared-state risk of mutable instance fields on a singleton bean',
    'Use @Configuration and @Bean to register a bean for a class you don\'t own the source of, such as a DataSource'
  ],
  concept: [
    {
      h: 'Inversion of Control: who constructs and wires your objects',
      p: [
        'Every class this course has written that depends on a collaborator has taken that collaborator as a CONSTRUCTOR PARAMETER — mockito-test-doubles\' <code>ReviewBoard(ReviewerNotifier notifier)</code>, jdbc-transactions\' <code>PaperSubmissionService(DataSource dataSource)</code> — rather than constructing its own dependency internally (<code>new EmailReviewerNotifier()</code> buried inside ReviewBoard itself). This is DEPENDENCY INJECTION: a class receives ("is injected with") what it depends on from OUTSIDE, rather than reaching out and constructing or looking up its own dependencies. Every test in this course has relied on exactly this pattern — mockito-test-doubles\' <code>@Mock ReviewerNotifier notifier; board = new ReviewBoard(notifier);</code> is ONLY possible because ReviewBoard accepts its dependency as a parameter rather than hard-coding it internally.',
        'What Spring adds on top of a pattern this course has already been practicing by hand: INVERSION OF CONTROL — instead of YOUR code calling <code>new ReviewBoard(new EmailReviewerNotifier())</code> somewhere (deciding both WHAT to construct and HOW to wire it together, in your own code), a Spring IoC CONTAINER reads a set of ANNOTATIONS describing what objects should exist and what each one depends on, and the CONTAINER does the constructing and wiring — your code declares WHAT it needs (a constructor parameter of type ReviewerNotifier); the container decides and supplies WHICH concrete implementation to actually hand it, and in what order to build everything, without your code ever calling <code>new</code> on its own dependencies at all. "Inversion" names exactly this flip: control over object CREATION and WIRING moves from your application code TO the framework — the same "don\'t call us, we\'ll call you" inversion behind most frameworks (Hibernate deciding when to run your entity\'s lifecycle callbacks; JUnit deciding when to run your @Test methods — you write the code, the framework decides when and how it runs).'
      ]
    },
    {
      h: 'Beans, @Component, and constructor vs. field injection',
      p: [
        'A BEAN, in Spring terminology, is simply an object whose entire lifecycle (construction, dependency wiring, and eventually destruction) is managed by the Spring CONTAINER (an <code>ApplicationContext</code>) rather than by your own code calling <code>new</code>. <code>@Component</code> marks a class as something Spring should automatically discover (via CLASSPATH SCANNING) and manage as a bean; <code>@Service</code> and <code>@Repository</code> are semantically-named specializations of <code>@Component</code> (identical mechanically, but signaling INTENT — a service-layer class, a data-access class — both to human readers and, for <code>@Repository</code> specifically, enabling Spring to translate certain low-level database exceptions into a consistent Spring-specific exception hierarchy). Spring automatically detects a bean\'s CONSTRUCTOR PARAMETERS and looks for OTHER beans matching each parameter\'s TYPE, injecting them automatically — <code>@Service class ReviewBoard { ReviewBoard(ReviewerNotifier notifier) { ... } }</code> requires no further annotation at all (since Spring 4.3, <code>@Autowired</code> is optional on a class\'s SOLE constructor) for Spring to find whatever bean implements ReviewerNotifier and hand it in automatically.',
        'CONSTRUCTOR injection (what this course\'s code has already been doing by hand) is the preferred style, and the reason is directly testability, not merely convention: a class whose dependencies are constructor parameters can be constructed and tested with <code>new ReviewBoard(mockNotifier)</code> in a plain unit test with ZERO Spring container involved at all — exactly every test mockito-test-doubles wrote. FIELD injection (<code>@Autowired private ReviewerNotifier notifier;</code>, with no constructor parameter at all) is the alternative Spring also supports, and it is a genuine anti-pattern worth naming precisely: a field-injected dependency is HIDDEN (not visible in the constructor signature, so nothing about the class\'s public API reveals what it actually needs), the object can exist in a HALF-CONSTRUCTED, invalid state before Spring gets around to setting the field (a genuinely constructed-but-not-yet-usable window that constructor injection makes structurally impossible, since a required parameter can\'t be skipped), and — the sharpest, most concrete cost — a field-injected class CANNOT be constructed and unit-tested with a plain <code>new SomeService()</code> at all without reflection tricks or a full Spring test context, directly breaking mockito-test-doubles\' entire fast, isolated-unit-test workflow. The rule this course has effectively been following since Part 7, made explicit: prefer constructor injection for every REQUIRED dependency, always.'
      ]
    },
    {
      h: 'Bean scope: singleton by default, and a genuine flaky-state risk',
      p: [
        'Spring beans default to SINGLETON scope: the container creates exactly ONE instance of a given bean class and hands out that SAME shared instance to every single place it\'s injected, for the entire application\'s lifetime — a ReviewBoard bean injected into three different controllers is the SAME object in all three, not three separate instances. This is efficient and, for STATELESS services (a class with no mutable instance fields at all — everything it needs comes in as method parameters, nothing persists between calls), completely safe: there\'s no state to share incorrectly in the first place. But it creates a real, concrete danger this course\'s flaky-test material has built directly toward recognizing: a SINGLETON bean with a MUTABLE INSTANCE FIELD is, for all practical purposes, structurally identical to a STATIC field — shared across EVERY caller, EVERY request, EVERY thread handling that request concurrently, for the entire life of the application.',
        'Concretely: a <code>@Service class ReviewCounter { private int count = 0; void increment() { count++; } }</code> has exactly the SAME concurrent-mutation risk unit-testing-junit5 and tdd-coverage-flaky-tests both named for a raw static field — multiple concurrent HTTP requests (each potentially on a DIFFERENT thread, per executors-futures/concurrent-collections-virtual-threads\' concurrency model) calling <code>increment()</code> on the SAME shared singleton instance is a genuine RACE CONDITION, the exact plain-int-not-thread-safe hazard threads-basics built around, now hiding behind Spring\'s dependency-injection convenience rather than an obviously-shared <code>static</code> keyword. The fix is the same one this course has taught throughout: either make the bean genuinely STATELESS (no mutable instance fields at all — the strongly preferred default for most application services), or, if genuinely shared mutable state is required, protect it with the SAME tools threads-basics and concurrent-collections-virtual-threads taught (synchronized, AtomicInteger, a properly concurrent collection) — Spring\'s <code>@Scope("prototype")</code> annotation (a NEW instance per injection point, rather than one shared instance) is available for the rare case a genuinely stateful, per-use bean is actually the right design, though it\'s used far less often than singleton in practice.'
      ]
    },
    {
      h: '@Configuration and @Bean: wiring a class you don\'t own',
      p: [
        '<code>@Component</code> only works for classes you actually WROTE and can add an annotation to — it cannot be added to a third-party library class like jdbc-transactions\' <code>HikariDataSource</code>, since you can\'t edit that library\'s source. <code>@Configuration</code> marks a class as a source of bean definitions written as PLAIN JAVA METHODS annotated <code>@Bean</code> — each such method\'s RETURN VALUE becomes a Spring-managed bean, letting you construct and configure an object of ANY type, including one you don\'t own, by writing ordinary imperative Java code inside the method body: <code>@Bean DataSource dataSource() { HikariDataSource ds = new HikariDataSource(); ds.setJdbcUrl(...); return ds; }</code> — Spring calls this method once (for a singleton-scoped bean, the default), and the RETURNED HikariDataSource instance becomes the DataSource bean every other component can now have injected, exactly the way jdbc-transactions\' PaperSubmissionService took a DataSource constructor parameter, now supplied automatically by the container instead of manually constructed and passed in by hand.',
        'This is the general pattern for any dependency that either isn\'t your own code, or genuinely needs IMPERATIVE construction logic beyond what a bare <code>@Component</code>-annotated no-args constructor could express (reading configuration values, conditionally choosing between implementations, calling a builder API). Spring Boot (arriving fully in spring-boot-rest-api) auto-configures a great many common beans this way ALREADY, behind the scenes — a DataSource, Jackson\'s ObjectMapper (correctly pre-configured with JavaTimeModule, this lesson\'s predecessor\'s exact manual-configuration gotcha handled automatically), and Hibernate\'s EntityManager all become simply INJECTABLE, with Spring Boot supplying sensible <code>@Bean</code>-style default configuration for each, only requiring your OWN <code>@Bean</code> methods when you need to override or customize that default — the point at which manually-written JDBC/JPA setup code from Part 8 gets replaced by declarative configuration properties and automatic wiring, without the underlying JDBC/transaction/entity concepts those lessons taught changing at all.'
      ]
    },
    {
      h: 'Autowiring ambiguity: @Qualifier and @Primary',
      p: [
        'Spring resolves constructor dependencies BY TYPE — if exactly ONE bean implements the required type, injection is unambiguous. If TWO OR MORE beans implement the SAME interface (say, both an EmailReviewerNotifier and a SlackReviewerNotifier both implementing ReviewerNotifier), Spring cannot determine which one a class wanting a plain <code>ReviewerNotifier</code> parameter actually means, and throws a <code>NoUniqueBeanDefinitionException</code> at STARTUP — a fail-fast, loud error rather than silently guessing, deliberately, since guessing wrong here would be a genuinely dangerous silent misconfiguration. Two ways to resolve the ambiguity: <code>@Qualifier("emailNotifier")</code> on the injection point, naming exactly WHICH bean (by its registered name) should be used at this specific injection site — the precise, explicit fix when a class genuinely needs a SPECIFIC one of several implementations; or <code>@Primary</code> on ONE of the candidate beans\' own class/method, declaring it the DEFAULT choice whenever an injection point doesn\'t otherwise specify — appropriate when one implementation genuinely should be the ordinary default and only occasional call sites need to override it.',
        'This ambiguity-resolution mechanism directly mirrors maven-multi-module\'s nearest-wins-then-explicit-exclusion dependency-conflict story, and mockito-test-doubles\' whole reason for constructor injection existing in the first place: Spring\'s failure to guess is a FEATURE, not friction — an application that could silently wire the WRONG collaborator into a class, with no error at all, would be a substantially worse failure mode than a loud startup exception demanding the developer explicitly resolve the ambiguity with @Qualifier or @Primary, exactly the same "fail loudly and immediately, not silently and later" instinct this course\'s validation and constraint material (sql-postgresql\'s CHECK constraints, jdbc-transactions\' PreparedStatement) has argued for throughout.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Nami\'s pre-equipped recruits, one shared ledger, and the acquisition order for gear she doesn\'t make herself',
      text: 'When a new recruit joins the crew, Nami never leaves them to scrounge up their OWN tools and partners as they figure out what they need — she has their exact required gear PREPARED and hands it to them the moment they\'re recruited, based on their role (Inversion of Control: Nami\'s central roster CONSTRUCTS and WIRES each recruit\'s equipment, rather than each recruit fending for themselves). And she is absolute about HOW that gear gets handed over: it happens VISIBLY, right at the moment of recruitment — you cannot even be considered "signed on" without your assigned gear already in hand (constructor injection: required, visible, impossible to be in a half-equipped state). Contrast the one time a temporary hand was brought aboard with NO gear assigned at all, and Nami, weeks later, quietly slipped a spare compass into their bag without telling anyone — nobody else on the crew even knew that hand now HAD a compass, or when it happened, and it caused real confusion during the next storm (field injection: hidden, easy to forget, and impossible to verify from the outside whether it happened at all). The crew keeps exactly ONE shared treasure ledger (a singleton — one instance, shared by everyone) — perfectly fine, since most of what\'s written in it is basically reference information everyone just READS. But the one time Usopp ALSO started using that SAME shared ledger to track his own personal "shots fired today" tally, with no separation per crew member, his count got hopelessly mixed up with Chopper\'s SEPARATE, unrelated tally attempt on the exact same page — the exact shared-mutable-state hazard a static field causes, now hiding inside a "convenient" central resource nobody thought twice about sharing. And when the crew needs a piece of Government-manufactured equipment Nami didn\'t personally build — she can\'t just walk up and declare it "official crew gear" by fiat — she writes up an explicit ACQUISITION ORDER describing exactly how to obtain and configure one for the crew\'s specific use, and whoever\'s handling supply runs follows THAT written recipe to produce an actual usable, properly-configured device (a @Bean method in a @Configuration class, for a piece of equipment the crew doesn\'t own the blueprint for).',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s pre-equipped new roommate, one shared whiteboard, and the requisition form for gear he didn\'t build',
      text: 'When a new roommate or labmate moves in, Sheldon never lets them scrounge up their OWN desk chair and equipment as they figure out what they need — he has their exact required gear PREPARED and physically hands it to them the moment they\'re recruited, based on their role in the apartment (Inversion of Control: Sheldon\'s onboarding process CONSTRUCTS and WIRES each new arrival\'s equipment, rather than each person fending for themselves). And he is fanatical about HOW that gear gets handed over: it happens VISIBLY, right at the front door, at the moment of moving in — you cannot even be considered "moved in" without your assigned desk chair already in hand (constructor injection: required, visible, impossible to be in a half-equipped state). Contrast the one time a subletter moved in "temporarily" with no gear assigned at all, and Sheldon, weeks later, quietly slipped a desk chair into their room without telling anyone — nobody else in the apartment even knew that subletter now HAD a chair, or when it happened, and it caused real confusion during the next apartment inventory (field injection: hidden, easy to forget, and impossible to verify from the outside whether it happened at all). The apartment has exactly ONE shared whiteboard (a singleton — one instance, shared by everyone) — perfectly fine, since most of what\'s on it is basically reference material (physics formulas) everyone just READS. But the one time Sheldon ALSO started using that SAME shared whiteboard to track his own personal "days since Leonard annoyed me" tally, with no separation per person, his count got hopelessly mixed up with Amy\'s SEPARATE, unrelated tally attempt on the exact same corner — the exact shared-mutable-state hazard a static field causes, now hiding inside a "convenient" central resource nobody thought twice about sharing. And when Sheldon needs a piece of Caltech-owned lab equipment he didn\'t personally build — he can\'t just walk up and declare it "his apartment\'s gear" by fiat — he writes up an explicit REQUISITION FORM describing exactly how it should be obtained and configured for HIS specific use, and the department\'s supply office follows THAT written recipe to produce an actual usable, properly-configured unit (a @Bean method in a @Configuration class, for equipment he doesn\'t own the design of).',
    },
    why: 'Nami\'s / Sheldon\'s central pre-equipping of every recruit, rather than each one fending for themselves, is Inversion of Control — the container decides what to construct and wire, not each object individually. Handing gear over visibly at the moment of recruitment is constructor injection; secretly slipping it in later, invisibly, is the field-injection anti-pattern. The one shared ledger/whiteboard is a singleton bean — safe for read-only reference material, a genuine flaky-state hazard the moment mutable per-user tallies get mixed onto it with no separation. And the acquisition order / requisition form for equipment neither of them personally built is exactly @Configuration + @Bean: an explicit recipe for constructing and configuring a bean of a type you don\'t own the source of.'
  },
  storyAnim: {
    title: 'Pre-equipped at recruitment, one shared ledger, and the requisition for gear she didn\'t build',
    h: 340,
    props: [
      { id: 'preequip', emoji: '🎒', label: 'gear prepared and handed over AT recruitment, visibly (constructor injection)', x: 6, y: 8 },
      { id: 'secret', emoji: '🕵️', label: 'gear secretly slipped in LATER, nobody else knows (field injection anti-pattern)', x: 30, y: 8 },
      { id: 'ledger', emoji: '📒', label: 'ONE shared ledger, everyone reads it (singleton bean, safe when stateless)', x: 54, y: 8 },
      { id: 'mixedtally', emoji: '⚠️', label: 'two personal tallies mixed on the SAME shared ledger (mutable singleton state, a race)', x: 78, y: 8 },
      { id: 'requisition', emoji: '📝', label: 'an explicit acquisition order for gear she didn\'t build (@Bean in @Configuration)', x: 40, y: 50 }
    ],
    actors: [
      { id: 'nami', emoji: '🧭', label: 'Nami', x: 20, y: 78 },
      { id: 'usopp', emoji: '🎯', label: 'Usopp', x: 70, y: 78 }
    ],
    steps: [
      { c: 'A new recruit\'s gear is prepared and handed over the moment they join -- visible, required, nothing hidden.', p: { preequip: 'good' }, a: { nami: [20, 30] } },
      { c: 'Contrast: gear secretly added LATER, with no one else on the crew even aware it happened. That\'s the field-injection anti-pattern.', p: { secret: 'bad' } },
      { c: 'The crew keeps ONE shared ledger everyone reads -- fine, since it\'s read-only reference material. A singleton bean.', p: { ledger: 'lit' } },
      { c: 'Usopp starts tracking his own personal tally on that SAME shared ledger, with no separation -- his count mixes with someone else\'s. A mutable singleton bean is exactly this risk.', p: { mixedtally: 'bad' }, a: { usopp: [78, 30] } },
      { c: 'For gear the crew doesn\'t build themselves, Nami writes an explicit acquisition order describing exactly how to obtain and configure it. That\'s @Bean in @Configuration.', p: { requisition: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'From Inversion of Control to beans, injection style, scope, and @Configuration',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Inversion of Control',
        nodes: [
          { id: 'ioc', text: 'the CONTAINER constructs\nand wires objects, not your code' },
          { id: 'existingdi', text: 'this course\'s constructor params\nwere already doing DI by hand' }
        ]
      },
      {
        label: 'Beans & injection style',
        nodes: [
          { id: 'component', text: '@Component/@Service/@Repository:\nclasses Spring manages' },
          { id: 'constructorinj', text: 'constructor injection: required,\nvisible, testable with plain new' },
          { id: 'fieldinj', text: 'field injection: hidden,\nbreaks plain-new testability' }
        ]
      },
      {
        label: 'Scope',
        nodes: [
          { id: 'singleton', text: 'singleton (default): ONE shared\ninstance for the whole app' },
          { id: 'mutabledanger', text: 'a mutable field on a singleton =\nthe same risk as a static field' }
        ]
      },
      {
        label: 'Configuring what you don\'t own',
        nodes: [
          { id: 'configbean', text: '@Configuration + @Bean: construct\n& configure a third-party type' },
          { id: 'qualifier', text: '@Qualifier/@Primary: resolve\nambiguity, never silently guess' }
        ]
      }
    ],
    steps: [
      { active: ['ioc'], note: 'Instead of your code calling new on its own dependencies, a container reads annotations and constructs/wires objects for you.' },
      { active: ['existingdi'], note: 'Every constructor-parameter dependency this course has written (ReviewBoard(ReviewerNotifier notifier)) has already been dependency injection, done by hand.' },
      { active: ['component'], note: '@Component (and its semantic specializations @Service/@Repository) mark a class for Spring to discover and manage as a bean.' },
      { active: ['constructorinj'], note: 'Constructor injection makes dependencies required and visible, and lets the class be constructed with a plain new(...) in a unit test with no Spring container at all.' },
      { active: ['fieldinj'], note: 'Field injection hides the dependency, allows a half-constructed state, and breaks plain-new unit testing entirely -- a genuine anti-pattern, not just a style choice.' },
      { active: ['singleton'], note: 'Spring beans default to singleton scope: one shared instance handed to every injection point across the whole application.' },
      { active: ['mutabledanger'], note: 'A mutable instance field on a singleton bean is shared across every concurrent request exactly like a static field -- the same race-condition risk this course has named repeatedly.' },
      { active: ['configbean'], note: '@Bean methods inside an @Configuration class let you construct and configure a bean of any type, including third-party classes you can\'t annotate directly.' },
      { active: ['qualifier'], note: 'When multiple beans satisfy the same type, Spring fails loudly at startup rather than guessing -- @Qualifier names a specific bean; @Primary sets a default.' }
    ]
  },
  tech: [
    {
      q: 'A @Service class has a field `@Autowired private ReviewerNotifier notifier;` and no constructor at all referencing it. Explain precisely why a plain unit test cannot construct and test this class the way mockito-test-doubles\' tests constructed ReviewBoard, and what would need to change to fix this.',
      a: 'mockito-test-doubles\' tests relied on `board = new ReviewBoard(notifier);` — calling the class\'s OWN constructor directly, in plain Java, with a mock notifier passed as an ordinary argument, entirely independent of Spring. A field-injected dependency has NO corresponding constructor parameter at all — the class\'s only constructor (whether an explicit no-args one or the implicit default) takes NO arguments, meaning `new SomeService()` constructs an object whose `notifier` field is simply `null`, since nothing in plain Java\'s object-construction process ever touches that field; only Spring\'s container, AFTER construction, reflectively reaches into the field and assigns it — a step a plain unit test calling `new SomeService()` never triggers at all. Calling any method that uses `notifier` on this plain-constructed object would immediately throw a NullPointerException, not because the test did anything wrong, but because field injection fundamentally requires the SPRING CONTAINER\'s post-construction wiring step to produce a genuinely usable object — there is no way to supply a mock notifier to a field-injected class via ordinary constructor arguments, since there\'s no constructor parameter to supply it through. The fix is switching to constructor injection: add a constructor accepting `ReviewerNotifier notifier` as a parameter and assigning it to the field inside the constructor body — this immediately restores the ability to test with `new SomeService(mockNotifier)` exactly like every other test in this course, while ALSO still working correctly inside a real Spring application, since Spring auto-detects and injects constructor parameters just as readily as annotated fields.'
    },
    {
      q: 'A @Service ReviewCounter has `private int totalReviews = 0;` and a method `void recordReview() { totalReviews++; }`, called from multiple concurrent HTTP request-handling threads. Explain precisely why Spring\'s default singleton scope makes this a genuine concurrency bug, tracing the mechanism back to threads-basics.',
      a: 'Spring\'s default singleton scope means the container creates exactly ONE ReviewCounter instance and hands that SAME object to every single place it\'s injected across the entire application — critically, this includes every concurrent HTTP request being handled at the same moment, each typically on its OWN thread (a common web-server threading model, directly connecting to executors-futures\' thread-per-task or pooled-worker-thread patterns). This means `totalReviews++` is being executed by MULTIPLE DIFFERENT THREADS against the exact SAME shared int field, concurrently — and threads-basics established precisely why this is unsafe: the `++` operator is NOT atomic; it decomposes into a read of the current value, an increment, and a write back, and if two threads interleave these three steps (both READ the same value 5, both compute 6, both WRITE 6 back), one of the two increments is silently LOST — the final count ends up lower than the true number of recordReview() calls, a genuine, real race condition, invisible in any single-threaded test and reproducing only under real concurrent load, exactly the "passes in isolation, fails intermittently under real traffic" flaky-symptom signature this course has named repeatedly. This is structurally IDENTICAL to a `static int` field shared across every caller — the ONLY difference is that Spring\'s dependency-injection convenience makes the sharing far less visually obvious than an explicit `static` keyword would, which is exactly why this lesson calls it out explicitly as a danger rather than assuming the danger is self-evident. The fix is the same toolkit threads-basics and concurrent-collections-virtual-threads already taught: replace `private int totalReviews` with `private final AtomicInteger totalReviews = new AtomicInteger();` and use `totalReviews.incrementAndGet()`, or wrap the increment in a `synchronized` block — either restores the thread-safety this shared, mutable, singleton-scoped field currently lacks.'
    },
    {
      q: 'Two beans, EmailReviewerNotifier and SlackReviewerNotifier, both implement ReviewerNotifier. A ReviewBoard constructor takes a plain `ReviewerNotifier notifier` parameter with no @Qualifier. What happens when the Spring application starts, and why is this the correct behavior rather than a design flaw?',
      a: 'The application FAILS TO START, throwing a NoUniqueBeanDefinitionException at startup, reporting that TWO candidate beans satisfy the ReviewerNotifier type and Spring cannot determine which one to inject into ReviewBoard\'s constructor. This is deliberate, correct behavior, not a limitation Spring should ideally overcome by guessing — the alternative (Spring silently picking ONE of the two, based on some arbitrary internal rule like declaration order or bean name alphabetization) would be a far WORSE failure mode: a genuinely ambiguous configuration that happens to "work" by accident, with the actual behavior (does ReviewBoard send emails or Slack messages?) depending on an implementation detail of Spring\'s internal bean resolution that the developer never explicitly specified anywhere in their own code — exactly the kind of silent, hard-to-debug misconfiguration this course has argued against repeatedly (sql-postgresql\'s CHECK constraints rejecting invalid data outright rather than silently accepting it; jdbc-transactions\' PreparedStatement structurally preventing injection rather than attempting best-effort sanitization). A LOUD startup failure forces the developer to make the choice EXPLICIT — either add `@Qualifier("emailReviewerNotifier")` to ReviewBoard\'s constructor parameter, naming exactly which of the two beans should be used at this injection site, or mark ONE of the two implementations `@Primary`, declaring it the sensible default whenever an injection point doesn\'t otherwise specify — either fix makes the actual wiring decision visible and intentional in the codebase, rather than left to chance.'
    },
    {
      q: 'Explain why @Configuration + @Bean is necessary for registering a HikariDataSource as a Spring bean, when @Component would be sufficient for a class like ReviewBoard that this course wrote itself.',
      a: '@Component is an ANNOTATION applied directly to a class\'s own source code, which Spring\'s classpath scanning then discovers — this works perfectly for ReviewBoard specifically because this course WROTE that class and can freely add @Component to its declaration. HikariDataSource is a class from a THIRD-PARTY library (HikariCP) — its source code is not something this course\'s codebase owns or can edit, so there is no way to add an @Component annotation to HikariDataSource\'s own class declaration at all; the annotation-on-the-class-itself mechanism @Component relies on simply has no applicable target here. @Bean sidesteps this entirely by moving the "how to construct this" logic OUT of the target class\'s own declaration and INTO a separate METHOD, written in code this course\'s codebase DOES own (inside an @Configuration class) — `@Bean DataSource dataSource() { HikariDataSource ds = new HikariDataSource(); ds.setJdbcUrl(...); return ds; }` constructs and configures a HikariDataSource using perfectly ordinary Java code the developer fully controls, and Spring registers whatever that method RETURNS as a bean, entirely independent of whether the RETURNED object\'s own class was annotatable or not. This is the general pattern for the entire category of dependencies this course has needed but never authored — a JDBC driver\'s connection pool implementation, Jackson\'s ObjectMapper, any third-party library\'s class at all — @Bean methods are the escape hatch that makes ANY object constructible-and-configurable as a Spring bean, regardless of whether its source code is something you can annotate directly.'
    }
  ],
  code: {
    title: 'Constructor injection vs. the field-injection anti-pattern, singleton risk, and @Bean for a DataSource',
    intro: 'ReviewBoard wired via constructor injection (testable with a plain "new", exactly like mockito-test-doubles), contrasted with a field-injected anti-pattern version — plus a singleton bean\'s mutable-state danger, and a @Configuration class wiring jdbc-transactions\' DataSource, a type this codebase doesn\'t own.',
    code: `import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.concurrent.atomic.AtomicInteger;

interface ReviewerNotifier {
    void notify(String paperTitle);
}

@Component
@Primary   // the sensible default whenever an injection point doesn't specify @Qualifier
class EmailReviewerNotifier implements ReviewerNotifier {
    @Override
    public void notify(String paperTitle) {
        // send an email in real life
    }
}

@Component("slackNotifier")
class SlackReviewerNotifier implements ReviewerNotifier {
    @Override
    public void notify(String paperTitle) {
        // post to Slack in real life
    }
}

// --- GOOD: constructor injection -- testable with a plain "new", exactly like mockito-test-doubles ---
@Service
class ReviewBoard {
    private final ReviewerNotifier notifier;

    // @Autowired is optional here since Spring 4.3 (a single constructor is auto-detected),
    // shown explicitly for clarity
    @Autowired
    ReviewBoard(@Qualifier("slackNotifier") ReviewerNotifier notifier) {
        this.notifier = notifier;
    }

    void submit(String paperTitle) {
        notifier.notify(paperTitle);
    }
}

// --- BAD: field injection -- cannot be constructed with a plain "new" for a unit test ---
@Service
class ReviewBoardFieldInjectedAntiPattern {
    @Autowired
    private ReviewerNotifier notifier;   // hidden dependency; new ReviewBoardFieldInjectedAntiPattern() leaves this null

    void submit(String paperTitle) {
        notifier.notify(paperTitle);   // NullPointerException if constructed outside a Spring container
    }
}

// --- DANGER: a singleton bean's mutable field is shared across every concurrent request ---
@Service
class UnsafeReviewCounter {
    private int totalReviews = 0;   // NOT thread-safe -- structurally identical to a shared static field

    void recordReview() {
        totalReviews++;   // a real race condition under concurrent requests (threads-basics' exact hazard)
    }
}

@Service
class SafeReviewCounter {
    private final AtomicInteger totalReviews = new AtomicInteger();   // thread-safe, from concurrent-collections-virtual-threads

    void recordReview() {
        totalReviews.incrementAndGet();
    }
}

// --- @Configuration + @Bean: wiring a type this codebase doesn't own ---
@Configuration
class DataSourceConfig {

    @Bean
    DataSource dataSource() {
        com.zaxxer.hikari.HikariDataSource ds = new com.zaxxer.hikari.HikariDataSource();
        ds.setJdbcUrl("jdbc:postgresql://localhost:5432/logpose");
        ds.setUsername("logpose");
        ds.setPassword(System.getenv("DB_PASSWORD"));
        return ds;   // this RETURNED object becomes the DataSource bean every other component can have injected
    }
}`,
    notes: [
      'ReviewBoard\'s constructor is IDENTICAL in shape to mockito-test-doubles\' ReviewBoard(ReviewerNotifier notifier) -- new ReviewBoard(mockNotifier) still works perfectly in a plain unit test, entirely outside Spring.',
      'ReviewBoardFieldInjectedAntiPattern cannot be constructed the same way -- new ReviewBoardFieldInjectedAntiPattern() leaves notifier as null, since only Spring\'s post-construction wiring step (never triggered outside a real container) sets that field.',
      '@Qualifier("slackNotifier") on ReviewBoard\'s constructor parameter overrides EmailReviewerNotifier\'s @Primary default for this ONE specific injection site -- both mechanisms exist together precisely to make ambiguous cases explicit rather than guessed.',
      'UnsafeReviewCounter and SafeReviewCounter are otherwise IDENTICAL in what they do -- the only difference is thread-safety, dramatizing exactly how invisible a singleton\'s shared-mutable-state risk can be from the code\'s surface shape alone.',
      'DataSourceConfig\'s dataSource() method is ordinary, imperative Java -- @Bean does not require any special syntax inside the method body, only the annotation marking its return value as a managed bean.'
    ]
  },
  lab: {
    title: 'Fix a field-injected anti-pattern and register a @Bean for a type you don\'t own',
    prompt: 'Given interface <code>AuthorDirectory</code> (from mockito-test-doubles) with method <code>boolean isKnownAuthor(String author)</code>, and a class <code>LdapAuthorDirectory implements AuthorDirectory</code>: (1) annotate <code>LdapAuthorDirectory</code> with <code>@Component</code>; (2) rewrite the broken, field-injected <code>SubmissionGate</code> class below to use CONSTRUCTOR injection instead (annotate the class <code>@Service</code>, add a constructor accepting an <code>AuthorDirectory</code> parameter, assign it to the field inside the constructor body, and remove <code>@Autowired</code> from the field); (3) write a <code>@Configuration</code> class <code>ClockConfig</code> with a <code>@Bean</code> method <code>clock()</code> returning <code>java.time.Clock.systemUTC()</code> (a type this codebase doesn\'t own).',
    starter: `import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.time.Clock;

// TODO 1: add @Component to this class
class LdapAuthorDirectory implements AuthorDirectory {
    @Override
    public boolean isKnownAuthor(String author) { return true; }
}

// TODO 2: fix this class -- switch from field injection to constructor injection
@Service
class SubmissionGate {
    @Autowired
    private AuthorDirectory directory;   // BAD: field injection -- rewrite this

    void submit(String author, String title) {
        if (!directory.isKnownAuthor(author)) {
            throw new IllegalStateException("unknown author");
        }
    }
}

// TODO 3: write a @Configuration class ClockConfig with a @Bean method clock() returning Clock.systemUTC()
`,
    checks: [
      { re: '@Component\\s*\\nclass\\s+LdapAuthorDirectory', must: true, hint: 'Add @Component directly above class LdapAuthorDirectory.', pass: '@Component on LdapAuthorDirectory ✓' },
      { re: 'class\\s+SubmissionGate\\s*\\{[^}]*private\\s+final\\s+AuthorDirectory\\s+directory', must: true, hint: 'SubmissionGate\'s directory field should be private final AuthorDirectory directory (no @Autowired on the field).', pass: 'directory is a final instance field ✓' },
      { re: 'SubmissionGate\\s*\\(\\s*AuthorDirectory\\s+directory\\s*\\)\\s*\\{\\s*this\\.directory\\s*=\\s*directory\\s*;', must: true, hint: 'Add a constructor SubmissionGate(AuthorDirectory directory) { this.directory = directory; }.', pass: 'constructor injection added ✓' },
      { re: '@Autowired\\s*\\n\\s*private\\s+AuthorDirectory', must: false, hint: 'Remove @Autowired from the directory field -- constructor injection needs no field-level annotation.', pass: '@Autowired removed from the field ✓' },
      { re: '@Configuration\\s*\\nclass\\s+ClockConfig', must: true, hint: 'Add @Configuration directly above class ClockConfig.', pass: '@Configuration on ClockConfig ✓' },
      { re: '@Bean\\s*\\n\\s*Clock\\s+clock\\s*\\(', must: true, hint: 'Add a @Bean method: Clock clock() { ... }.', pass: '@Bean Clock clock() method ✓' },
      { re: 'return\\s+Clock\\.systemUTC\\(\\s*\\)', must: true, hint: 'The clock() method must return Clock.systemUTC().', pass: 'returns Clock.systemUTC() ✓' }
    ],
    run: 'mvn spring-boot:run — the application context should start with no NoUniqueBeanDefinitionException or NullPointerException; a plain "new SubmissionGate(mockDirectory)" should also now work correctly in a unit test, exactly like mockito-test-doubles\' original SubmissionGate.',
    solution: `import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.time.Clock;

@Component
class LdapAuthorDirectory implements AuthorDirectory {
    @Override
    public boolean isKnownAuthor(String author) { return true; }
}

@Service
class SubmissionGate {
    private final AuthorDirectory directory;

    SubmissionGate(AuthorDirectory directory) {
        this.directory = directory;
    }

    void submit(String author, String title) {
        if (!directory.isKnownAuthor(author)) {
            throw new IllegalStateException("unknown author");
        }
    }
}

@Configuration
class ClockConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}`,
    notes: [
      'SubmissionGate\'s fixed constructor is now identical in shape to mockito-test-doubles\' original -- new SubmissionGate(mockDirectory) works perfectly in a plain unit test again, with zero Spring container required.',
      '@Autowired is not needed anywhere in the fixed SubmissionGate -- Spring auto-detects the sole constructor and injects its parameter automatically, exactly as this lesson\'s concept section described.',
      'Clock is a JDK type, not something this codebase\'s own classes -- exactly why it needs a @Bean method rather than an @Component annotation, which could never be added to java.time.Clock\'s own source.'
    ]
  },
  quiz: [
    {
      q: 'What does "Inversion of Control" actually refer to in the context of Spring\'s IoC container?',
      options: ['Control over constructing and wiring objects together moves from your own application code to the Spring container, which reads annotations and does the wiring for you', 'It refers to inverting the order in which HTTP requests are processed', 'It means Spring inverts the results of boolean expressions in your business logic automatically', 'It refers to reversing the order of method calls within a single class'],
      correct: 0,
      explain: 'Instead of your own code calling new on its dependencies and deciding how to wire them together, the Spring container reads annotations describing what beans exist and what they need, and does the constructing/wiring itself.'
    },
    {
      q: 'Why is constructor injection preferred over field injection?',
      options: ['Constructor injection makes dependencies required and visible in the class\'s public API, and allows the class to be constructed and unit-tested with a plain "new(...)" call with no Spring container involved -- field injection breaks both of these', 'Field injection is not actually supported by Spring at all', 'Constructor injection is faster at runtime because it avoids reflection entirely', 'There is no real difference -- the choice is purely a matter of personal style'],
      correct: 0,
      explain: 'A field-injected dependency has no corresponding constructor parameter, so a plain "new SomeService()" leaves it null -- only Spring\'s post-construction wiring step sets it, breaking the ability to unit-test the class with an ordinary constructor call.'
    },
    {
      q: 'A @Service bean has a mutable instance field incremented by a method called from multiple concurrent HTTP requests. Why is Spring\'s default singleton scope relevant to whether this is a bug?',
      options: ['Singleton scope means exactly ONE shared instance is handed to every injection point across the whole application, so concurrent requests on different threads are all mutating the SAME field -- structurally identical to the race-condition risk of a shared static field', 'Singleton scope automatically makes all of a bean\'s fields thread-safe, so this cannot be a bug', 'Singleton scope has no relevance here -- the bug would exist regardless of bean scope', 'Singleton scope means a new instance is created for every request, so concurrent access is impossible'],
      correct: 0,
      explain: 'Singleton scope means one shared instance serves every caller, including every concurrent request thread -- a mutable field on that shared instance is exactly as exposed to race conditions as a static field would be, just less visually obvious.'
    },
    {
      q: 'Why can\'t @Component be used to register a third-party class like HikariDataSource as a Spring bean?',
      options: ['@Component must be applied directly to a class\'s own source code, which is not possible for a class from a library you don\'t own -- @Bean methods inside an @Configuration class construct and configure it in code you DO own instead', '@Component only works for classes with a no-argument constructor, and HikariDataSource lacks one', 'Third-party classes can never become Spring beans under any circumstances', '@Component requires the target class to implement a specific Spring-provided interface first'],
      correct: 0,
      explain: '@Component is an annotation on the class\'s own declaration, which you can\'t add to code you don\'t own. @Bean methods sidestep this by constructing and configuring the object in a method you DO control, registering whatever it returns as the bean.'
    },
    {
      q: 'Two beans implement the same interface, and a constructor parameter of that interface type has no @Qualifier. What happens at application startup, and why is this the correct behavior?',
      options: ['The application fails to start with a NoUniqueBeanDefinitionException -- this is correct, since silently guessing which bean to use would be a far worse, harder-to-debug failure mode than a loud, explicit error demanding the ambiguity be resolved', 'Spring silently injects the first bean it discovers during classpath scanning, with no error at all', 'Spring automatically creates a third, merged bean combining both implementations', 'The application starts normally, and the ambiguity is only detected the first time the dependent bean is actually used at runtime'],
      correct: 0,
      explain: 'Spring fails loudly and immediately at startup rather than silently guessing which of two ambiguous beans to use -- forcing the developer to resolve the ambiguity explicitly with @Qualifier or @Primary, rather than leaving the actual wiring decision to an undocumented implementation detail.'
    }
  ],
  testFlow: {
    title: 'Test yourself: injection style, singleton risk, and bean ambiguity',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A class has `@Autowired private SomeDependency dep;` and no constructor referencing it. A unit test calls `new ThisClass()` and then invokes a method that uses dep. What happens?',
        choices: [
          { text: 'A NullPointerException -- dep is never assigned by plain object construction; only Spring\'s post-construction wiring step would set it, and that step never runs outside a real Spring container', to: 'q1_right' },
          { text: 'Spring automatically detects the plain "new" call and retroactively injects the dependency', to: 'q1_wrong_retro' },
          { text: 'The code compiles and runs correctly, since @Autowired works identically regardless of how the object was constructed', to: 'q1_wrong_works' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- field injection requires Spring\'s container to reflectively set the field AFTER construction. A plain "new" call never triggers that step, leaving the field null and any use of it throwing a NullPointerException.', next: 'q2' },
      q1_wrong_retro: { end: true, correct: false, text: 'Spring has no way to detect or intercept a plain "new SomeClass()" call made outside its own container -- that construction happens entirely in ordinary Java, invisible to Spring, so no injection occurs.', retry: 'q1' },
      q1_wrong_works: { end: true, correct: false, text: '@Autowired on a field only works when Spring itself constructs the object AND performs its post-construction wiring step -- a plain "new" call bypasses the container entirely, so the field is never actually set.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A singleton-scoped @Service has a mutable `Map<String, Integer> cache = new HashMap<>();` field, written to by multiple concurrent request threads. Is this safe?',
        choices: [
          { text: 'No -- a plain HashMap is not thread-safe, and singleton scope means every concurrent request shares this SAME map instance, risking corruption exactly like concurrent-collections-virtual-threads warned about for shared mutable collections', to: 'q2_right' },
          { text: 'Yes -- Spring automatically makes every field on a singleton bean thread-safe', to: 'q2_wrong_autosafe' },
          { text: 'Yes, because HashMap internally handles concurrent writes correctly as long as the keys are Strings', to: 'q2_wrong_stringkeys' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- singleton scope means this exact HashMap instance is shared across every concurrent request. A plain HashMap under concurrent writes is exactly the unsafe scenario concurrent-collections-virtual-threads warned about -- ConcurrentHashMap or proper synchronization is needed.', next: 'q3' },
      q2_wrong_autosafe: { end: true, correct: false, text: 'Spring does nothing to make a bean\'s own fields thread-safe -- dependency injection and bean lifecycle management are entirely separate concerns from concurrency safety, which remains the developer\'s responsibility.', retry: 'q2' },
      q2_wrong_stringkeys: { end: true, correct: false, text: 'HashMap\'s thread-safety has nothing to do with the key type -- a plain HashMap is unsafe for concurrent writes regardless of whether the keys are Strings, Integers, or any other type.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A team wants to register a third-party PaymentGatewayClient (from a library they don\'t control) as a Spring bean, with custom API-key configuration read from an environment variable. Which mechanism fits?',
        choices: [
          { text: 'A @Bean method inside an @Configuration class, constructing and configuring a PaymentGatewayClient in ordinary Java code and returning it', to: 'q3_right' },
          { text: '@Component added directly to PaymentGatewayClient\'s own class declaration', to: 'q3_wrong_component' },
          { text: 'This cannot be done -- only classes originally written with Spring in mind can become Spring beans', to: 'q3_wrong_impossible' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- @Bean methods let you construct and configure any type, including a third-party class you can\'t annotate, entirely in code you own, with whatever imperative logic (reading an environment variable) is needed.', next: null },
      q3_wrong_component: { end: true, correct: false, text: '@Component requires adding an annotation directly to the target class\'s own source -- not possible for a class from a library whose source code this team doesn\'t own or control.', retry: 'q3' },
      q3_wrong_impossible: { end: true, correct: false, text: 'This is exactly what @Configuration + @Bean exists to make possible -- any type at all can become a Spring-managed bean this way, regardless of whether its own source was written with Spring in mind.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Using field injection (@Autowired on a field with no constructor) instead of constructor injection -- hides the dependency, allows a half-constructed invalid state, and breaks the ability to unit-test the class with a plain "new(...)" call.',
    'Adding mutable instance fields to a singleton-scoped bean without considering concurrency -- every concurrent request shares the exact same instance, making an unsynchronized mutable field exactly as dangerous as a shared static field.',
    'Trying to add @Component to a class you don\'t own the source of -- use a @Bean method inside an @Configuration class instead, constructing and configuring the object in code you control.',
    'Leaving two beans satisfying the same interface with no @Qualifier or @Primary to disambiguate -- Spring fails loudly at startup rather than guessing, and this failure is the correct, intended behavior, not a bug to work around by adding a third redundant bean.',
    'Assuming @Primary on a bean means it\'s the ONLY option -- @Qualifier at a specific injection point always overrides @Primary\'s default for that one site, letting most call sites use the sensible default while specific ones opt into a different implementation.',
    'Forgetting that Spring\'s dependency-injection convenience can make a shared-mutable-state bug (a singleton\'s mutable field) far less visually obvious than an explicit static keyword would be -- the underlying risk and fix are identical, only the visibility differs.'
  ],
  interview: [
    {
      q: 'A colleague says "dependency injection is a Spring-specific concept — plain Java code doesn\'t really use it." Evaluate this claim using this course\'s own code as evidence.',
      a: 'This significantly understates what dependency injection actually is, and this course\'s own code across several earlier lessons is direct counter-evidence. Dependency injection, as a PATTERN, is simply "a class receives its collaborators from outside rather than constructing them itself" — nothing about that definition requires a framework, a container, or any annotations at all. mockito-test-doubles\' `ReviewBoard(ReviewerNotifier notifier)` constructor, jdbc-transactions\' `PaperSubmissionService(DataSource dataSource)` constructor, and integration-testing\'s `JdbcPaperRepository(DataSource dataSource)` constructor were ALL practicing dependency injection, in plain Java, with zero Spring involvement whatsoever — each class received what it depended on as a constructor parameter, supplied by WHOEVER constructed it (a test, in those lessons\' cases, calling `new ReviewBoard(mockNotifier)` or `new ReviewBoard(new InMemoryReviewerNotifier())` directly). What Spring specifically ADDS is not dependency injection itself, but AUTOMATING the "who constructs everything and figures out what to pass to each constructor" part — in this course\'s earlier lessons, a human (or test code) manually wrote `new ReviewBoard(new EmailReviewerNotifier())` somewhere; Spring\'s IoC container does that wiring automatically, at the scale of an entire application\'s worth of interdependent objects, based on annotations describing what exists and what each thing needs, rather than requiring a human to hand-write every single wiring call. The precise, correct framing: dependency injection is a general OO design pattern usable in any Java code with no framework at all (and this course has been doing exactly that since Part 7); Spring\'s IoC container is a specific, powerful AUTOMATION of that pattern at application scale — the pattern predates Spring and doesn\'t require it, even though Spring is probably the most common REASON Java developers encounter the term.'
    },
    {
      q: 'Design (in words) how you would refactor a @Service class that currently has `@Autowired private EntityManager em;` and several other `@Autowired`-annotated fields into proper constructor injection, and explain one additional benefit of doing so beyond plain-new testability.',
      a: 'The refactor is mechanical but worth doing carefully: for each `@Autowired`-annotated field, remove the `@Autowired` annotation and the field\'s access modifier stays private, but add `final` to signal it\'s only ever assigned once; add a single constructor to the class accepting ONE PARAMETER PER FIELD, in any order, and inside the constructor body assign each parameter to its corresponding field (`this.em = em;` for each); remove any explicit `@Autowired` on the constructor itself if it\'s the class\'s SOLE constructor, since Spring auto-detects that case since version 4.3 (though many teams keep it for explicitness/readability, a legitimate style choice either way). The immediate, expected benefit is exactly this lesson\'s central point: the class becomes constructible and unit-testable with a plain `new ThisService(mockEm, mockOtherDep, ...)` call, no Spring context required. A second, genuinely distinct benefit worth naming explicitly: making every dependency a REQUIRED constructor parameter surfaces a class with TOO MANY dependencies immediately and uncomfortably, in a way field injection can quietly hide — a constructor with eight parameters is visually, immediately alarming in a way eight scattered `@Autowired` fields simply aren\'t (each field injection looks individually harmless, and the count of them can creep up unnoticed over time as a class accumulates responsibilities); this makes constructor injection a genuine, low-cost DESIGN SMELL DETECTOR — a class that becomes awkward to construct because it needs too many collaborators is very often a class that\'s taken on too many RESPONSIBILITIES and should be split into several smaller, more focused classes, a signal field injection tends to suppress rather than surface, since Spring quietly wires an arbitrary number of hidden fields with equal ease regardless of how many there are.'
    },
    {
      q: 'A production incident report says: "Under high traffic, our review submission counter reported a count about 15% lower than the actual number of successful submissions logged elsewhere, only under heavy concurrent load — never in staging, where traffic is low." Diagnose this precisely using this lesson\'s and threads-basics\' material, and propose a fix with a brief note on WHY the discrepancy specifically appeared as a percentage-style undercounting rather than a crash.',
      a: 'This is very likely the exact singleton-mutable-field race condition this lesson built around, and the specific symptom shape (an undercounted total, worse under heavier concurrent load, invisible in low-traffic staging) is the precise signature to expect from it, not a coincidental resemblance. If the counter bean is a singleton-scoped @Service with a plain `private int totalReviews` field incremented via `totalReviews++`, every concurrent HTTP request thread calling `recordReview()` mutates the exact SAME shared int — and `++` is not atomic (read-increment-write, as threads-basics established), so two threads interleaving those three steps around the same moment can both read the SAME starting value, both compute the SAME next value, and both write it back, causing ONE of the two genuine increments to be silently lost. Under LOW traffic (staging), concurrent calls to `recordReview()` happening close enough together in time to actually interleave and collide are RARE — most calls complete before the next one even starts, so the race window is rarely hit, matching "never in staging." Under HIGH traffic, many more requests are genuinely concurrent, dramatically increasing how often two threads\' read-increment-write sequences actually overlap in time, producing a real, statistically consistent UNDERCOUNT roughly proportional to how much concurrent contention exists — which is exactly why it shows up as a percentage-style discrepancy that scales with load, rather than a crash: nothing here throws an exception at all, since reading and writing a plain int is never itself an illegal operation, it simply sometimes produces a numerically WRONG result when two threads\' operations interleave badly, a silent data-corruption bug rather than a loud failure. The fix is precisely the one this lesson\'s code demo shows: replace the plain `int` field with `private final AtomicInteger totalReviews = new AtomicInteger();` and use `totalReviews.incrementAndGet()`, which performs the read-increment-write as one indivisible, hardware-level atomic operation, making the race structurally impossible regardless of how many threads call it concurrently or how much load the application is under.'
    },
    {
      q: 'A team debates whether a new PaperExportService, which has no mutable state and only orchestrates calls to other already-injected beans, should be @Scope("prototype") or left as the default singleton. Walk through the reasoning and give a recommendation.',
      a: 'The deciding question is exactly the one this lesson\'s scope material centers on: does this bean hold any MUTABLE STATE specific to one particular USE of it, or is it purely a stateless orchestrator whose behavior depends entirely on its method PARAMETERS, not on anything remembered between calls? The description given — "no mutable state, only orchestrates calls to other already-injected beans" — is precisely the profile of a class that is completely SAFE, and in fact the MORE EFFICIENT choice, as a singleton: since it holds no state that could ever be corrupted by concurrent sharing, there is zero downside to every caller sharing the exact same instance, and Spring only needs to construct it ONCE for the entire application\'s lifetime rather than repeatedly, saving real (if usually small) construction overhead. Prototype scope exists specifically for the OPPOSITE case — a bean that genuinely needs its OWN independent, isolated instance-level state PER USE, where sharing a single instance across multiple unrelated uses would be actively wrong (not just a performance concern, but a correctness one) — a bean representing one specific, stateful IN-PROGRESS WORKFLOW that accumulates state across several method calls before completing, say, where two different callers using the SAME shared instance concurrently would corrupt each other\'s in-progress work. Since PaperExportService as described holds no such per-use state at all, prototype scope here would add real cost (a brand-new instance constructed on every single injection, for a class with nothing instance-specific to actually isolate) with zero corresponding safety benefit — my recommendation is to leave it as the default singleton, and, as a matter of discipline worth stating explicitly in code review, to treat "does this bean need mutable per-use state" as the deciding question for scope choice generally, rather than defaulting to prototype out of an abundance of caution that, for a genuinely stateless class, buys nothing.'
    }
  ]
};
