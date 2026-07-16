window.LESSONS = window.LESSONS || {};
window.LESSONS['spring-boot-rest-api'] = {
  id: 'spring-boot-rest-api',
  title: 'Spring Boot: Build a Real REST API — Controllers, Services, Validation',
  category: 'Part 9 — Backend with Spring',
  timeMin: 60,
  summary: 'Everything so far pays off here. http-rest-json designed the URI/method/status-code contract; spring-core-di established constructor injection and beans; jpa-hibernate and jdbc-transactions built the persistence layer. This lesson wires all of it into a real, running Spring Boot REST API: @RestController turning http-rest-json\'s designed endpoints into actual code, a thin controller delegating to a constructor-injected @Service (spring-core-di, now used for real), Bean Validation (@Valid/@NotBlank) automatically rejecting malformed requests with 400 before the service layer is even reached, and a @ControllerAdvice exception handler mapping domain exceptions to the exact status codes http-rest-json argued for (409 for a duplicate DOI, 404 for a missing paper, 422 for a semantically invalid request) — closing every status-code design decision that lesson made into working code.',
  goals: [
    'Explain what Spring Boot adds on top of plain Spring (auto-configuration, starter dependencies, @SpringBootApplication) and why this is the same convention-over-configuration idea maven-fundamentals introduced',
    'Write a @RestController using @GetMapping/@PostMapping/@DeleteMapping, @PathVariable, @RequestBody, and ResponseEntity to implement http-rest-json\'s designed REST contract precisely, including status codes and the Location header',
    'Explain why a controller should stay thin and delegate to a constructor-injected @Service, connecting to spring-core-di\'s testability argument',
    'Use Bean Validation (@Valid, @NotBlank, @Min/@Max) on a request DTO to reject malformed requests automatically with 400, before any service-layer code runs',
    'Use @ExceptionHandler/@ControllerAdvice to map domain-specific exceptions to precise HTTP status codes, and explain when @WebMvcTest (web layer only, service mocked) is the right test versus a full @SpringBootTest'
  ],
  concept: [
    {
      h: 'Spring Boot: auto-configuration and starters, the same convention-over-configuration idea one layer up',
      p: [
        'Plain Spring requires explicitly configuring an embedded web server, Jackson\'s ObjectMapper, and dozens of other infrastructure beans by hand before a single request can be handled. SPRING BOOT adds AUTO-CONFIGURATION: given a STARTER dependency on the classpath (<code>spring-boot-starter-web</code>, a single Maven dependency bundling an embedded Tomcat server, Spring MVC, and Jackson together — exactly the kind of curated dependency bundle maven-multi-module\'s BOM material covered), Spring Boot automatically configures sensible default beans for everything that dependency implies — an embedded server ready to accept HTTP requests, an ObjectMapper ALREADY configured with JavaTimeModule registered (http-rest-json\'s exact manual-configuration gotcha, handled for you) — with NO explicit configuration code required for the common case, and every default fully overridable with your own <code>@Bean</code> or a configuration property when it isn\'t right for your situation.',
        'This is precisely maven-fundamentals\' convention-over-configuration idea, one layer up: Maven assumed a standard directory layout so you didn\'t have to declare where your source files live; Spring Boot assumes a standard set of infrastructure beans so you don\'t have to declare how to wire up a web server. <code>@SpringBootApplication</code>, placed on the application\'s entry-point class, is a single META-ANNOTATION that combines <code>@Configuration</code> (this class can define beans), <code>@ComponentScan</code> (automatically discover <code>@Component</code>/<code>@Service</code>/<code>@Repository</code>-annotated classes in this package and below — the mechanism spring-core-di\'s bean discovery actually relies on), and <code>@EnableAutoConfiguration</code> (turn on the starter-driven auto-configuration just described) — three separate concerns, one annotation, one line, starting a fully-wired application with <code>SpringApplication.run(LogPoseApplication.class, args)</code>.'
      ]
    },
    {
      h: '@RestController: turning http-rest-json\'s designed endpoints into real code',
      p: [
        '<code>@RestController</code> (itself a combination of <code>@Controller</code>, marking a class as a Spring MVC request handler, and <code>@ResponseBody</code>, telling Spring to serialize return values directly as the response body — typically JSON, via that auto-configured ObjectMapper — rather than treating them as a view template name) marks a class whose methods handle incoming HTTP requests. <code>@RequestMapping("/papers")</code> on the class establishes a base path; <code>@GetMapping</code>, <code>@PostMapping</code>, <code>@DeleteMapping</code> (and <code>@PutMapping</code>/<code>@PatchMapping</code>) on individual methods map http-rest-json\'s designed HTTP methods directly onto Java methods — <code>@GetMapping("/{id}")</code> combined with a method parameter annotated <code>@PathVariable Long id</code> extracts the <code>{id}</code> URI segment and converts it to the parameter\'s type automatically, and <code>@RequestBody CreatePaperRequest request</code> on a POST method\'s parameter tells Spring to DESERIALIZE the incoming JSON body into that type via Jackson — no manual <code>ObjectMapper.readValue(...)</code> call anywhere in your own code; Spring Boot\'s auto-configured infrastructure does it before your method body even runs.',
        '<code>ResponseEntity&lt;T&gt;</code> is how a controller method takes explicit control over the STATUS CODE and headers http-rest-json spent real time designing precisely: <code>ResponseEntity.created(locationUri).body(createdPaper)</code> returns exactly <code>201 Created</code> with a <code>Location</code> header pointing at the new resource\'s URI, and a JSON body — the precise shape http-rest-json\'s concept section argued a successful POST should produce. <code>ResponseEntity.noContent().build()</code> returns exactly <code>204 No Content</code> with no body — the precise shape argued for a successful DELETE. A method can also simply return the object directly (Spring defaults to <code>200 OK</code> with that object serialized as the body) when no special status/header control is needed, reserving <code>ResponseEntity</code> specifically for the cases where the exact status code or headers matter.'
      ]
    },
    {
      h: 'Thin controllers, real logic in a constructor-injected @Service',
      p: [
        'A well-designed controller method does almost NOTHING beyond translating an HTTP request into a call on a SERVICE-layer method, and translating that method\'s result (or thrown exception) back into an HTTP response — all genuine business logic (validating a DOI isn\'t already taken, deciding what "submitting a review" actually entails) lives in a separate <code>@Service</code> class, injected into the controller via CONSTRUCTOR injection, exactly spring-core-di\'s established pattern: <code>PaperController(PaperService service) { this.service = service; }</code>. This separation matters for the exact reason spring-core-di argued constructor injection matters generally: a <code>PaperService</code> with all its real logic can be constructed and unit-tested with a plain <code>new PaperService(fakeRepository)</code> call, with ZERO involvement from Spring MVC, an embedded server, or HTTP at all — the fast, isolated unit-testing workflow this course has used since Part 7, entirely undisturbed by adding a whole web layer on top.',
        'The controller\'s OWN, separate concern — does this class correctly parse path variables, correctly deserialize a request body, correctly map a thrown exception to the right status code — is a genuinely DIFFERENT question from whether the service\'s business logic is correct, and deserves its OWN, narrower test, which the final section covers. Keeping controllers thin isn\'t merely a style preference: a controller that embeds real business logic directly (checking DOI uniqueness inline in the @PostMapping method, say) makes that logic un-testable without spinning up the whole web layer, and duplicates logic the moment TWO different endpoints (an HTTP API and, hypothetically, a batch-import job) both need the same underlying rule enforced.'
      ]
    },
    {
      h: 'Bean Validation: rejecting malformed requests automatically, before the service layer runs',
      p: [
        'BEAN VALIDATION (the <code>jakarta.validation</code> annotations, standard across Java, not Spring-specific) lets a request DTO DECLARE its own validity rules directly as annotations: <code>record CreatePaperRequest(@NotBlank String title, @NotBlank String doi, @NotNull Long authorId) {}</code> — <code>@NotBlank</code> rejects null, empty, and whitespace-only strings (exactly the "null or blank" check exceptions\' Backlog.add() and mockito-test-doubles\' every domain class have hand-validated since Part 7, now expressed declaratively); <code>@Min</code>/<code>@Max</code> constrain numeric ranges (directly mirroring sql-postgresql\'s CHECK (score BETWEEN 1 AND 5)); <code>@NotNull</code> requires a non-null value without the blank-string check @NotBlank also performs. Adding <code>@Valid</code> to a controller method\'s <code>@RequestBody</code> parameter (<code>@Valid @RequestBody CreatePaperRequest request</code>) tells Spring to VALIDATE the deserialized object against its own annotations automatically, BEFORE the controller method\'s own body even executes — a request violating any constraint never reaches your code at all; Spring throws a <code>MethodArgumentNotValidException</code> internally, which (the next section covers) gets mapped to exactly <code>400 Bad Request</code>.',
        'This is a genuinely valuable division of labor worth being precise about: Bean Validation on a DTO checks the request\'s SHAPE and basic FIELD-LEVEL constraints (is this field present, is this number in range) — it is NOT a substitute for the DATABASE\'s own constraints (sql-postgresql\'s UNIQUE/CHECK/foreign-key rules) any more than jpa-hibernate\'s <code>@Column(nullable = false)</code> was; a request can pass EVERY Bean Validation check (a non-blank title, a non-blank DOI) and STILL violate a database-level rule the DTO has no way to know about in isolation (that EXACT doi value already belongs to a different paper — a check requiring an actual database LOOKUP, not just inspecting the request\'s own fields). The two layers of validation are complementary, not redundant: Bean Validation catches malformed requests CHEAPLY, before any database round-trip at all; the service layer (backed by the database\'s own constraints) catches everything Bean Validation structurally cannot, since it requires knowledge of EXISTING data the request alone doesn\'t carry.'
      ]
    },
    {
      h: '@ExceptionHandler and @ControllerAdvice: mapping domain exceptions to precise status codes',
      p: [
        'A service method that finds a DOI already taken should THROW a domain-specific exception (<code>throw new DuplicateDoiException(doi);</code>) rather than somehow trying to return an HTTP status code itself — the SERVICE layer has no business knowing anything about HTTP at all (spring-core-di\'s testability argument again: a service that returns HTTP-specific types couldn\'t be unit-tested independent of the web layer). <code>@ExceptionHandler(DuplicateDoiException.class)</code> on a method inside a class annotated <code>@ControllerAdvice</code> (a class Spring applies GLOBALLY, across every controller in the application, rather than needing to be repeated in each one) catches that specific exception type wherever it\'s thrown from ANY controller method, and maps it to a controlled HTTP response: <code>return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());</code> — exactly the <code>409 Conflict</code> http-rest-json\'s concept section argued a duplicate-DOI attempt should produce, now actually wired to happen automatically whenever that specific exception is thrown, from anywhere.',
        'This closes EVERY status-code decision http-rest-json designed conceptually into real, working code: a <code>PaperNotFoundException</code> maps to <code>404 Not Found</code>; a <code>MethodArgumentNotValidException</code> (Bean Validation\'s own failure, from the previous section) maps to <code>400 Bad Request</code>; a genuinely semantically-invalid-but-well-formed case (a score technically in range but violating some cross-field business rule Bean Validation alone can\'t express) can throw a custom exception mapped to <code>422 Unprocessable Entity</code>. And for the last question this lesson leaves open — testing a controller in isolation — <code>@WebMvcTest(PaperController.class)</code> is integration-testing\'s Spring-testing-slices preview, finally given full treatment: it loads ONLY the web layer (PaperController, the exception handler, Bean Validation infrastructure) and automatically provides a MOCK for PaperService (via <code>@MockBean</code>, Mockito\'s mocking, now integrated directly into a Spring test slice) — paired with <code>MockMvc</code> (simulating real HTTP requests against the controller without a real running server), this tests EXACTLY the controller\'s own concerns (does it parse this path variable correctly, does it map this exception to this status code) fast, in isolation, with the SAME "isolate the class under test from real collaborators" discipline mockito-test-doubles built — reserving a full, slower <code>@SpringBootTest</code> (the entire real application, real service, real database via Testcontainers) for the smaller number of tests that genuinely need the whole system wired together for real, exactly the test pyramid\'s shape, now applied specifically within a Spring application.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Chopper\'s clinic: one intake window per case, a form check before anyone bothers the doctor, and a clear outcome slip every time',
      text: 'Chopper\'s clinic runs on one strict, learnable rule: every kind of visit goes through its OWN clearly-labeled intake window, never a single all-purpose door where visitors have to explain in freeform what they want (a NEW-patient case goes through the "register a new patient" window; checking on an EXISTING patient\'s case goes through a window specifically numbered for THAT patient\'s file — the same predictable, per-resource pattern repeating for every case type, rather than a differently-shaped process for every visit). The clinic doesn\'t require Chopper to personally hand-assemble every instrument from raw metal the moment it opens each morning — it comes pre-stocked with sensible standard equipment ready to go the instant the doors unlock, with the option to swap in specialized gear for the rare case that actually needs it (auto-configuration: sensible defaults, fully overridable). Before ANY new case reaches Chopper himself, his intake assistant checks the form is properly filled out — a name field left blank, a vital sign scrawled as an obviously impossible number — and hands the form straight back with a clear, specific list of what\'s missing, WITHOUT ever pulling Chopper away from real patients over a garbage form (validation, rejected automatically, before the real specialist is even involved). The intake window itself never diagnoses or treats anyone — it only correctly reads a properly-formed case and routes it to Chopper, the actual specialist who does the real medical judgment (a thin intake process, real logic kept with the specialist). And every single visit — without exception — ends with ONE of a small, clearly-labeled set of outcome slips, never silence and never a vague "something happened": a "treated successfully" slip, a "you already have an OPEN case for this exact complaint, that\'s a duplicate, see the front desk" slip, a "no such patient or case number exists on file" slip, or a "the form itself made no sense" slip — each one telling the visitor EXACTLY what happened and, where relevant, exactly what to do next. And every so often, the clinic runs a drill testing whether the INTAKE WINDOW ITSELF correctly reads and routes forms — using a stand-in specialist for the drill, rather than pulling the real, busy Chopper away from actual patients just to verify the intake process alone.',
    },
    sitcom: {
      show: 'Friends',
      title: 'Chandler\'s IT helpdesk: one ticket window per case, a form check before any technician is bothered, and a clear resolution slip every time',
      text: 'Whatever exactly Chandler\'s office job involves, his department\'s helpdesk runs on one strict, learnable rule: every kind of request goes through its OWN clearly-labeled ticket window, never one all-purpose inbox where employees explain in freeform what they need (submitting a BRAND NEW support ticket goes through the "open a new ticket" line; checking on an EXISTING ticket goes through a line specifically numbered for THAT ticket — the same predictable pattern repeating for every request type, not a differently-shaped process for every complaint). The helpdesk doesn\'t require someone to personally build a ticket-routing system from scratch the day it opens — it comes with a pre-configured system ready to go immediately, fully overridable for the rare case that actually needs something custom (auto-configuration: sensible defaults, fully overridable). Before ANY ticket reaches an actual technician, the intake system checks it\'s properly filled out — a blank description field, a priority level that doesn\'t correspond to anything real — and bounces it back immediately with a clear, specific list of what\'s missing, WITHOUT ever pulling a real technician away from actual work over a garbage ticket (validation, rejected automatically, before the real specialist is even involved). The intake system itself never fixes anything — it only correctly reads a properly-formed ticket and routes it to the actual technician who does the real diagnostic work (a thin intake process, real logic kept with the specialist). And every single ticket — without exception — closes with ONE of a small, clearly-labeled set of resolution statuses, never silence and never a vague "it\'s handled": a "resolved" status, a "you already have an OPEN, identical ticket, that\'s a duplicate" status, a "no such ticket number exists" status, or a "the ticket form itself made no sense" status — each one telling the employee EXACTLY what happened and what to do next. And every so often, IT runs a drill testing whether the INTAKE SYSTEM ITSELF correctly reads and routes tickets — using a stand-in technician for the drill, rather than pulling a real, busy technician away from actual work just to verify the intake process alone.',
    },
    why: 'One clearly-labeled intake window per case type, following a consistent, predictable pattern, is @RestController\'s @GetMapping/@PostMapping/@PathVariable design turning http-rest-json\'s URI/method contract into real routes. The pre-stocked clinic/helpdesk, ready to go with no manual assembly, is Spring Boot\'s auto-configuration. The intake assistant bouncing back an incomplete form BEFORE the specialist is bothered is @Valid + Bean Validation rejecting malformed requests automatically. The intake window doing no real diagnosis itself, just correctly routing to the actual specialist, is the thin-controller/real-service-layer split. And the small set of clear, never-silent outcome slips/resolution statuses is @ExceptionHandler/@ControllerAdvice mapping domain exceptions to precise HTTP status codes — closing http-rest-json\'s entire status-code design into working code. The drill testing the intake window alone, with a stand-in specialist, is @WebMvcTest.'
  },
  storyAnim: {
    title: 'One window per case, a form check first, thin routing, and a clear outcome slip every time',
    h: 340,
    props: [
      { id: 'window', emoji: '🪟', label: 'ONE labeled intake window per case type (mapped routes)', x: 6, y: 8 },
      { id: 'prestocked', emoji: '🏥', label: 'pre-stocked, ready the moment it opens (auto-configuration)', x: 28, y: 8 },
      { id: 'formcheck', emoji: '📋', label: 'form checked BEFORE the specialist is bothered (@Valid validation)', x: 50, y: 8 },
      { id: 'bounced', emoji: '↩️', label: 'an incomplete form bounced back immediately, specialist untouched (400)', x: 72, y: 8 },
      { id: 'specialist', emoji: '🩺', label: 'the real diagnostic work happens with the specialist, not the window (service layer)', x: 28, y: 50 },
      { id: 'outcomeslip', emoji: '📄', label: 'a clear outcome slip every time -- never silence (status codes)', x: 60, y: 50 }
    ],
    actors: [
      { id: 'chopper', emoji: '🦌', label: 'Chopper', x: 20, y: 78 },
      { id: 'assistant', emoji: '🧑‍⚕️', label: 'intake assistant', x: 65, y: 78 }
    ],
    steps: [
      { c: 'Every case type has its own clearly-labeled intake window -- a consistent, learnable pattern, not a different shape for every visit.', p: { window: 'lit' } },
      { c: 'The clinic opens pre-stocked with sensible standard equipment -- no manual assembly required.', p: { prestocked: 'good' } },
      { c: 'Before Chopper sees anything, the intake assistant checks the form is properly filled out.', p: { formcheck: 'lit' }, a: { assistant: [50, 30] } },
      { c: 'An incomplete form is bounced back immediately -- Chopper never even sees it.', p: { bounced: 'bad' } },
      { c: 'A properly-formed case is routed to Chopper, the real specialist -- the window itself does no diagnosis.', p: { specialist: 'good' }, a: { chopper: [28, 60] } },
      { c: 'Every visit ends with a clear outcome slip -- treated, duplicate case, not found, or malformed form. Never silence.', p: { outcomeslip: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'From Spring Boot auto-configuration to routes, thin controllers, validation, and exception mapping',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Spring Boot',
        nodes: [
          { id: 'autoconfig', text: 'starter deps + auto-configuration:\nsensible defaults, overridable' },
          { id: 'springbootapp', text: '@SpringBootApplication =\n@Configuration + @ComponentScan + auto-config' }
        ]
      },
      {
        label: 'Routing',
        nodes: [
          { id: 'restcontroller', text: '@RestController + @GetMapping/\n@PostMapping/@DeleteMapping' },
          { id: 'responseentity', text: 'ResponseEntity: exact status\ncode + Location header control' }
        ]
      },
      {
        label: 'Thin controller, real service',
        nodes: [
          { id: 'thincontroller', text: 'controller: parse request,\ncall service, map response' },
          { id: 'service', text: '@Service: real logic,\nunit-testable with a plain new' }
        ]
      },
      {
        label: 'Validation & exceptions',
        nodes: [
          { id: 'beanvalidation', text: '@Valid + @NotBlank/@Min/@Max:\nreject malformed requests early' },
          { id: 'controlleradvice', text: '@ExceptionHandler/@ControllerAdvice:\nexception -> precise status code' },
          { id: 'webmvctest', text: '@WebMvcTest + MockMvc:\nweb layer alone, service mocked' }
        ]
      }
    ],
    steps: [
      { active: ['autoconfig'], note: 'A starter dependency on the classpath triggers auto-configuration of sensible default beans -- an embedded server, a pre-configured ObjectMapper -- fully overridable.' },
      { active: ['springbootapp'], note: '@SpringBootApplication combines @Configuration, @ComponentScan, and @EnableAutoConfiguration into one annotation on the entry-point class.' },
      { active: ['restcontroller'], note: '@RestController methods, mapped with @GetMapping/@PostMapping/@DeleteMapping, turn http-rest-json\'s designed URIs and methods into real request handlers.' },
      { active: ['responseentity'], note: 'ResponseEntity lets a method return an exact status code and headers -- 201 Created with Location, 204 No Content -- matching http-rest-json\'s designed contract precisely.' },
      { active: ['thincontroller'], note: 'A well-designed controller method does little beyond parsing the request and calling a service method -- real business logic lives elsewhere.' },
      { active: ['service'], note: 'A constructor-injected @Service holds the real logic, and can be unit-tested with a plain "new" call, entirely independent of the web layer.' },
      { active: ['beanvalidation'], note: '@Valid combined with @NotBlank/@Min/@Max on a request DTO rejects malformed requests automatically, before the controller\'s own code -- or the service layer -- ever runs.' },
      { active: ['controlleradvice'], note: 'A @ControllerAdvice class with @ExceptionHandler methods maps domain exceptions (a duplicate DOI, a missing paper) to the precise status codes http-rest-json designed.' },
      { active: ['webmvctest'], note: '@WebMvcTest loads only the web layer, with the service auto-mocked -- fast, isolated tests of the controller\'s own routing/validation/exception-mapping concerns.' }
    ]
  },
  tech: [
    {
      q: 'A @PostMapping method has parameter `@Valid @RequestBody CreatePaperRequest request` where CreatePaperRequest has `@NotBlank String title`. A request arrives with title as an empty string. Trace precisely what happens, in order, and where the controller method\'s own code fits into that sequence.',
      a: 'In order: (1) Spring MVC receives the HTTP request and determines it matches this @PostMapping method\'s route. (2) Before invoking the method, Spring DESERIALIZES the request body into a CreatePaperRequest object via the auto-configured Jackson ObjectMapper — this step succeeds, since an empty string is a perfectly valid JSON string value; deserialization has no opinion about business validity, only about JSON SHAPE. (3) Because the parameter is annotated @Valid, Spring then runs BEAN VALIDATION against the newly-deserialized object, checking every jakarta.validation annotation present on its fields — @NotBlank on title is checked here, and an empty string FAILS that specific check (@NotBlank explicitly rejects blank as well as null). (4) Because validation failed, Spring THROWS a MethodArgumentNotValidException internally — critically, this happens BEFORE the controller method\'s own body executes AT ALL; the method is never actually invoked, and none of its own code runs. (5) This exception propagates up to Spring\'s exception-handling machinery, which (per this lesson\'s @ExceptionHandler material) maps MethodArgumentNotValidException to a 400 Bad Request response, typically including details about which field(s) failed which constraint(s), sent back to the client — the whole sequence, from receiving the malformed request to sending back a clear 400 response, happens entirely within Spring\'s own infrastructure, with the actual business logic inside the controller method (and, further down, inside the injected @Service) never reached at all for this particular request.'
    },
    {
      q: 'A CreatePaperRequest passes every Bean Validation check (title and doi are both non-blank, authorId is non-null) but the doi value happens to already belong to a different, existing paper in the database. Explain precisely why Bean Validation alone cannot catch this, and where the actual check happens instead.',
      a: 'Bean Validation annotations operate ENTIRELY on the SHAPE and FIELD-LEVEL CONTENT of the object being validated, in complete isolation — @NotBlank on doi only asks "is this specific string non-null and non-blank," a question fully answerable by looking at the doi field\'s own value alone, with zero need to consult anything outside the object itself. Whether that specific, syntactically-valid DOI string ALREADY belongs to some OTHER paper is fundamentally a different KIND of question — it requires comparing this request\'s doi value against the CURRENT STATE of persisted data (every existing paper\'s doi), information that lives entirely outside the CreatePaperRequest object and can only be answered by an actual DATABASE LOOKUP. No Bean Validation annotation can express "check this value against the database," since Bean Validation, by design, validates an object\'s OWN internal consistency, not its relationship to external, mutable, database-resident state (and validating against a live database from inside an annotation would also raise real questions about performance, since Bean Validation runs on every single request regardless of whether that specific field even changed). This check genuinely belongs in the SERVICE layer instead: PaperService.create() calling repository.existsByDoi(doi) (jdbc-transactions\'/jpa-hibernate\'s territory) and throwing DuplicateDoiException if it returns true — exactly the concept section\'s "Bean Validation catches malformed requests cheaply; the service layer, backed by the database, catches everything requiring knowledge of existing data" division of labor, with sql-postgresql\'s own UNIQUE constraint on the doi column serving as the ultimate, unconditional backstop even if the service-layer check were somehow bypassed entirely.'
    },
    {
      q: 'Explain precisely why a PaperService method should throw a plain Java exception (e.g. `throw new DuplicateDoiException(doi)`) rather than directly constructing and returning a `ResponseEntity.status(HttpStatus.CONFLICT)...` itself, tracing the consequence back to spring-core-di\'s testability argument.',
      a: 'If PaperService.create() directly returned a ResponseEntity (or otherwise referenced any Spring-MVC/HTTP-specific type), it would immediately couple the SERVICE layer — meant to hold pure business logic — to the WEB layer\'s concerns, which breaks precisely the testability spring-core-di argued constructor injection and clean separation exist to preserve: a unit test for PaperService.create()\'s actual business rule ("reject a duplicate DOI") would now need to inspect a ResponseEntity\'s status code and body to determine whether the business rule fired correctly, rather than simply catching a thrown DuplicateDoiException and asserting on ITS fields directly — a needlessly HTTP-flavored way to test logic that has nothing conceptually to do with HTTP at all. Worse, it would make PaperService fundamentally unusable from any NON-HTTP context — a batch-import job, a CLI tool, a message-queue consumer processing papers submitted through some other channel entirely — since all of those callers would now be forced to somehow interpret a ResponseEntity meant for an HTTP response, even though none of them are actually handling an HTTP request at all. Throwing a plain, HTTP-agnostic DuplicateDoiException instead keeps PaperService\'s public contract expressed entirely in terms its own DOMAIN cares about ("this operation failed because the DOI conflicts with an existing paper" — a fact true regardless of HOW the operation was triggered), and pushes the HTTP-SPECIFIC translation of that fact into a status code to the @ControllerAdvice layer specifically, which is the ONLY layer that actually needs to know or care about HTTP at all — exactly the same separation-of-concerns instinct behind constructor injection\'s testability argument, applied to exception design instead of dependency wiring.'
    },
    {
      q: 'Explain precisely what @WebMvcTest(PaperController.class) loads and does NOT load, why PaperService needs a @MockBean in such a test, and why this test cannot, by itself, prove PaperService\'s actual business logic is correct.',
      a: '@WebMvcTest(PaperController.class) loads ONLY the web-layer infrastructure needed to test PaperController specifically — the controller itself, Spring MVC\'s request-mapping/dispatch machinery, Bean Validation, and any @ControllerAdvice exception handlers — deliberately WITHOUT loading the full application context: no real PaperService bean, no real database connection, no real repository. Since PaperController\'s constructor requires a PaperService to be injected (spring-core-di\'s constructor injection, now mandatory even inside this narrower test slice), and no real one is loaded, @MockBean provides a MOCKITO-GENERATED mock PaperService automatically, registered into this narrower test context specifically so PaperController can be constructed at all — this is integration-testing\'s Spring-testing-slices preview and mockito-test-doubles\' mocking material combining directly: the SAME kind of mock those earlier lessons built by hand with plain @Mock, now supplied automatically inside a Spring test slice. Because PaperService is entirely MOCKED in this test, whatever a test STUBS it to return (when(paperService.create(...)).thenReturn(...)) is EXACTLY what the test observes — nothing about this test exercises PaperService\'s REAL create() method, its real DOI-uniqueness check, or anything about the actual database at all; a @WebMvcTest can PERFECTLY verify that PaperController correctly parses a request, correctly calls paperService.create() with the right arguments, and correctly maps whatever paperService.create() is stubbed to return (or throw) into the right HTTP response — but it says NOTHING about whether the REAL PaperService, wired to a REAL repository and a REAL database, would actually behave the way the stub assumed, precisely the "mock lies" gap mockito-test-doubles and integration-testing built around. Proving PaperService\'s own logic is correct requires a SEPARATE, plain unit test constructing PaperService directly (per spring-core-di\'s testability argument), and proving the WHOLE system wired together correctly requires either an integration test or a full @SpringBootTest — @WebMvcTest deliberately answers a narrower, different question than either of those.'
    }
  ],
  code: {
    title: 'A complete PaperController: routes, a thin service call, Bean Validation, and exception mapping to precise status codes',
    intro: 'PaperController delegates entirely to a constructor-injected PaperService; a validated CreatePaperRequest DTO rejects malformed input automatically; a @ControllerAdvice maps DuplicateDoiException and PaperNotFoundException to exactly the status codes http-rest-json designed.',
    code: `import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Optional;

record Paper(Long id, String title, String doi, Long authorId) {}

record CreatePaperRequest(
    @NotBlank(message = "title must not be blank") String title,
    @NotBlank(message = "doi must not be blank") String doi,
    @NotNull(message = "authorId is required") Long authorId
) {}

class DuplicateDoiException extends RuntimeException {
    DuplicateDoiException(String doi) { super("A paper with DOI " + doi + " already exists"); }
}

class PaperNotFoundException extends RuntimeException {
    PaperNotFoundException(Long id) { super("No paper with id " + id); }
}

interface PaperRepository {
    Paper save(Paper paper);
    Optional<Paper> findById(Long id);
    List<Paper> findAll();
    void deleteById(Long id);
    boolean existsByDoi(String doi);
}

// --- SERVICE: all real logic, unit-testable with a plain "new" (spring-core-di) ---
@Service
class PaperService {
    private final PaperRepository repository;

    PaperService(PaperRepository repository) {
        this.repository = repository;
    }

    Paper create(String title, String doi, Long authorId) {
        if (repository.existsByDoi(doi)) {
            throw new DuplicateDoiException(doi);   // HTTP-agnostic -- the controller maps this, not the service
        }
        return repository.save(new Paper(null, title, doi, authorId));
    }

    Paper getById(Long id) {
        return repository.findById(id).orElseThrow(() -> new PaperNotFoundException(id));
    }

    List<Paper> getAll() {
        return repository.findAll();
    }

    void delete(Long id) {
        repository.deleteById(id);
    }
}

// --- CONTROLLER: thin -- parse the request, call the service, map the response ---
@RestController
@RequestMapping("/papers")
class PaperController {
    private final PaperService service;

    PaperController(PaperService service) {
        this.service = service;
    }

    @GetMapping
    List<Paper> getAll() {
        return service.getAll();   // 200 OK by default, serialized as JSON
    }

    @GetMapping("/{id}")
    Paper getOne(@PathVariable Long id) {
        return service.getById(id);   // throws PaperNotFoundException if missing -- mapped below
    }

    @PostMapping
    ResponseEntity<Paper> create(@Valid @RequestBody CreatePaperRequest request) {
        Paper created = service.create(request.title(), request.doi(), request.authorId());
        return ResponseEntity.created(URI.create("/papers/" + created.id())).body(created);   // 201 + Location
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();   // 204, no body
    }
}

// --- EXCEPTION MAPPING: applied globally, across every controller ---
@ControllerAdvice
class ApiExceptionHandler {

    @ExceptionHandler(DuplicateDoiException.class)
    ResponseEntity<String> handleDuplicateDoi(DuplicateDoiException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());   // 409
    }

    @ExceptionHandler(PaperNotFoundException.class)
    ResponseEntity<String> handleNotFound(PaperNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());   // 404
    }
}`,
    notes: [
      'PaperService never imports anything from org.springframework.http or org.springframework.web -- it is entirely HTTP-agnostic, throwing plain domain exceptions, exactly the separation this lesson\'s tech section argues for.',
      'CreatePaperRequest\'s @NotBlank/@NotNull annotations reject a malformed request with 400 automatically -- neither PaperController\'s nor PaperService\'s own code runs at all for a request that fails this check.',
      'ApiExceptionHandler is applied GLOBALLY via @ControllerAdvice -- any future controller throwing DuplicateDoiException or PaperNotFoundException gets the same correct status mapping with zero additional code.',
      'create() returns exactly the shape http-rest-json argued for: 201 Created, a Location header pointing at the new resource, and the created resource itself as the body.'
    ]
  },
  lab: {
    title: 'Add a ReviewController with validation and a 422 mapping for an invalid score',
    prompt: 'Given <code>ReviewService</code> with method <code>Review submit(Long paperId, String reviewer, Integer score)</code> that throws <code>InvalidScoreException</code> for a semantically-invalid score, and record <code>Review(Long id, Long paperId, String reviewer, Integer score)</code>: (1) write <code>record CreateReviewRequest(@NotBlank String reviewer, @NotNull @Min(1) @Max(5) Integer score)</code>; (2) write <code>@RestController @RequestMapping("/papers/{paperId}/reviews") class ReviewController</code>, constructor-injected with <code>ReviewService</code>, with a <code>@PostMapping</code> method taking <code>@PathVariable Long paperId</code> and <code>@Valid @RequestBody CreateReviewRequest request</code>, returning <code>ResponseEntity.created(...).body(...)</code> (201, with a <code>Location</code> of <code>/papers/{paperId}/reviews/{id}</code>); (3) add an <code>@ExceptionHandler(InvalidScoreException.class)</code> method to the given <code>ApiExceptionHandler</code> class returning <code>HttpStatus.UNPROCESSABLE_ENTITY</code> (422).',
    starter: `import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

// TODO 1: record CreateReviewRequest with @NotBlank reviewer, @NotNull @Min(1) @Max(5) score

// TODO 2: @RestController @RequestMapping("/papers/{paperId}/reviews") class ReviewController
class ReviewController {
    private final ReviewService service;

    ReviewController(ReviewService service) {
        this.service = service;
    }

    // TODO: @PostMapping method(s) -- @PathVariable Long paperId, @Valid @RequestBody CreateReviewRequest request
    // return ResponseEntity.created(URI.create("/papers/" + paperId + "/reviews/" + created.id())).body(created)
}

class ApiExceptionHandler {
    // TODO 3: add @ExceptionHandler(InvalidScoreException.class) mapping to HttpStatus.UNPROCESSABLE_ENTITY (422)
}`,
    checks: [
      { re: 'record\\s+CreateReviewRequest\\s*\\(', must: true, hint: 'Declare record CreateReviewRequest(...).', pass: 'CreateReviewRequest record declared ✓' },
      { re: '@NotBlank[^)]*reviewer', must: true, hint: 'reviewer must be annotated @NotBlank.', pass: '@NotBlank on reviewer ✓' },
      { re: '@Min\\(\\s*1\\s*\\)', must: true, hint: 'score must be annotated @Min(1).', pass: '@Min(1) on score ✓' },
      { re: '@Max\\(\\s*5\\s*\\)', must: true, hint: 'score must be annotated @Max(5).', pass: '@Max(5) on score ✓' },
      { re: '@RestController', must: true, hint: 'ReviewController must be annotated @RestController.', pass: '@RestController used ✓' },
      { re: '@RequestMapping\\(\\s*"/papers/\\{paperId\\}/reviews"\\s*\\)', must: true, hint: 'Use @RequestMapping("/papers/{paperId}/reviews") on the class.', pass: '@RequestMapping path correct ✓' },
      { re: '@PostMapping', must: true, hint: 'The submit method must be annotated @PostMapping.', pass: '@PostMapping used ✓' },
      { re: '@Valid\\s+@RequestBody\\s+CreateReviewRequest', must: true, hint: 'The request parameter must be @Valid @RequestBody CreateReviewRequest.', pass: '@Valid @RequestBody used ✓' },
      { re: 'ResponseEntity\\.created\\(', must: true, hint: 'Return ResponseEntity.created(...).body(...) for a successful submission.', pass: 'ResponseEntity.created(...) used ✓' },
      { re: '@ExceptionHandler\\(\\s*InvalidScoreException\\.class\\s*\\)', must: true, hint: 'Add @ExceptionHandler(InvalidScoreException.class) to ApiExceptionHandler.', pass: '@ExceptionHandler(InvalidScoreException.class) added ✓' },
      { re: 'HttpStatus\\.UNPROCESSABLE_ENTITY', must: true, hint: 'The InvalidScoreException handler must return HttpStatus.UNPROCESSABLE_ENTITY (422).', pass: 'HttpStatus.UNPROCESSABLE_ENTITY used ✓' }
    ],
    run: 'mvn spring-boot:run — POST /papers/1/reviews with a blank reviewer or a score outside 1-5 should return 400 automatically (never reaching ReviewController\'s code); a well-formed request that ReviewService rejects for a business reason should return 422 via the ExceptionHandler.',
    solution: `import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

record CreateReviewRequest(
    @NotBlank String reviewer,
    @NotNull @Min(1) @Max(5) Integer score
) {}

@RestController
@RequestMapping("/papers/{paperId}/reviews")
class ReviewController {
    private final ReviewService service;

    ReviewController(ReviewService service) {
        this.service = service;
    }

    @PostMapping
    ResponseEntity<Review> submit(@PathVariable Long paperId, @Valid @RequestBody CreateReviewRequest request) {
        Review created = service.submit(paperId, request.reviewer(), request.score());
        return ResponseEntity.created(URI.create("/papers/" + paperId + "/reviews/" + created.id())).body(created);
    }
}

class ApiExceptionHandler {

    @ExceptionHandler(InvalidScoreException.class)
    ResponseEntity<String> handleInvalidScore(InvalidScoreException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(ex.getMessage());
    }
}`,
    notes: [
      '@Min(1) @Max(5) on score rejects an out-of-range value with 400 automatically, before ReviewController\'s submit() method even runs -- this is a SHAPE-level check Bean Validation can express directly.',
      'InvalidScoreException, by contrast, represents a SEMANTIC business rule ReviewService itself enforces (something Bean Validation alone cannot express, since it requires logic beyond a single field\'s own value) -- correctly mapped to 422, not 400, per http-rest-json\'s precise distinction between the two codes.',
      '@PathVariable Long paperId comes from the URI itself (/papers/{paperId}/reviews), not from the request body -- ReviewController never needs paperId duplicated inside CreateReviewRequest.'
    ]
  },
  quiz: [
    {
      q: 'What does @SpringBootApplication combine into a single annotation?',
      options: ['@Configuration, @ComponentScan, and @EnableAutoConfiguration', '@RestController, @RequestMapping, and @ResponseBody', '@Entity, @Id, and @GeneratedValue', '@Service, @Repository, and @Component'],
      correct: 0,
      explain: '@SpringBootApplication combines the ability to define beans (@Configuration), automatic discovery of @Component/@Service/@Repository classes (@ComponentScan), and starter-driven auto-configuration (@EnableAutoConfiguration) into one annotation.'
    },
    {
      q: 'A @PostMapping method has a parameter `@Valid @RequestBody CreatePaperRequest request` where title is annotated @NotBlank, and a request arrives with an empty title. What happens?',
      options: ['Spring throws a validation exception and returns 400 Bad Request automatically -- the controller method\'s own body never executes for this request', 'The controller method runs normally, and it is the method\'s own responsibility to manually check whether title is blank', 'The request is silently accepted with title treated as null', 'Spring blocks the request at the network level before it even reaches the application'],
      correct: 0,
      explain: '@Valid triggers Bean Validation automatically before the controller method body runs. A failing constraint (like @NotBlank on an empty string) causes Spring to short-circuit with a 400 response, never invoking the method\'s own code.'
    },
    {
      q: 'Why should a @Service class like PaperService throw a plain domain exception (DuplicateDoiException) rather than directly constructing and returning a ResponseEntity itself?',
      options: ['Keeping the service HTTP-agnostic lets it be unit-tested independent of the web layer and reused from non-HTTP contexts (a batch job, a CLI tool) -- the HTTP-specific status-code mapping belongs in the @ControllerAdvice layer instead', 'ResponseEntity cannot be constructed inside a @Service class due to a Spring framework restriction', 'Domain exceptions are faster to throw than constructing a ResponseEntity object', 'There is no real reason -- both approaches are equally good style choices'],
      correct: 0,
      explain: 'A service returning HTTP-specific types couples business logic to the web layer, breaking unit-testability and reusability from non-HTTP callers. Throwing a plain domain exception keeps the service HTTP-agnostic, with @ControllerAdvice handling the HTTP-specific translation.'
    },
    {
      q: 'A request passes every Bean Validation check on a CreatePaperRequest, but its doi value already belongs to a different existing paper. Why can\'t Bean Validation alone catch this?',
      options: ['Bean Validation annotations only inspect the object\'s own field values in isolation -- checking against EXISTING persisted data requires an actual database lookup, which belongs in the service layer instead', 'Bean Validation does not support String fields, only numeric ones', '@NotBlank and @NotNull are the only Bean Validation annotations that exist', 'This scenario is impossible -- Bean Validation always checks against the database automatically'],
      correct: 0,
      explain: 'Bean Validation checks a request object\'s own internal shape and field values in isolation. Whether a value conflicts with existing database rows requires an actual query, something that belongs in the service layer, not in a field-level annotation.'
    },
    {
      q: 'What does @WebMvcTest(PaperController.class) load, and why does the test need a @MockBean for PaperService?',
      options: ['It loads only the web-layer infrastructure needed to test PaperController, without a real service or database -- since PaperController requires a PaperService constructor argument, @MockBean supplies a Mockito-generated mock so the controller can be constructed at all', 'It loads the entire application context, including a real database connection, exactly like @SpringBootTest', 'It does not require any service dependency at all, since @WebMvcTest disables constructor injection', '@MockBean is used to disable Bean Validation during the test'],
      correct: 0,
      explain: '@WebMvcTest loads a narrow slice -- just the web layer -- deliberately without a real PaperService or database. Since PaperController still requires a PaperService via constructor injection, @MockBean provides a mock so the narrower context can still construct it.'
    }
  ],
  testFlow: {
    title: 'Test yourself: routing, validation order, thin controllers, and test slices',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A @PostMapping method has `@Valid @RequestBody CreatePaperRequest request` with @NotBlank on doi. A request arrives with doi as an empty string AND that would also violate the database\'s UNIQUE constraint if it reached that far. Which check fires first, and does the service layer\'s DOI-uniqueness check ever run for this specific request?',
        choices: [
          { text: 'Bean Validation\'s @NotBlank check fires first and rejects the request with 400 -- the controller method, and therefore the service layer\'s uniqueness check, never runs at all for this request', to: 'q1_right' },
          { text: 'The service layer\'s uniqueness check runs first, and Bean Validation only runs afterward if that check passes', to: 'q1_wrong_order' },
          { text: 'Both checks run simultaneously and independently, with Spring reporting whichever one fails first', to: 'q1_wrong_simultaneous' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- @Valid triggers Bean Validation BEFORE the controller method body executes at all. An empty doi fails @NotBlank immediately, short-circuiting with 400 before the method (and therefore the service layer) ever runs.', next: 'q2' },
      q1_wrong_order: { end: true, correct: false, text: 'This is backwards -- Bean Validation runs automatically, driven by @Valid, before the controller method\'s own body (which is what eventually calls the service layer) ever executes.', retry: 'q1' },
      q1_wrong_simultaneous: { end: true, correct: false, text: 'These checks are not simultaneous or independent -- Bean Validation runs first, as a precondition for the controller method (and therefore the service layer) running at all. If it fails, nothing downstream ever executes.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A controller method directly contains business logic: it checks whether a DOI already exists by calling the repository itself, inline, inside the @PostMapping method body, rather than delegating to a @Service. What is the concrete cost of this design?',
        choices: [
          { text: 'This logic can no longer be unit-tested independent of the whole web layer, and it can\'t be reused by any other caller (a batch job, a different endpoint) without duplicating the same check', to: 'q2_right' },
          { text: 'There is no real cost -- this is functionally identical to delegating to a @Service, just written in a different location', to: 'q2_wrong_nocost' },
          { text: 'This design is actually preferred, since it avoids the overhead of an extra method call to a separate service class', to: 'q2_wrong_preferred' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- business logic embedded directly in a controller method inherits that method\'s dependency on the whole web layer for testing, and can\'t be reused from any non-HTTP caller without being duplicated elsewhere.', next: 'q3' },
      q2_wrong_nocost: { end: true, correct: false, text: 'The cost is real and specific: logic living inside a controller method can only be exercised through the web layer (or a @WebMvcTest with a mocked service, which wouldn\'t even reach this inline logic), unlike logic in a separate @Service that\'s directly, plainly unit-testable.', retry: 'q2' },
      q2_wrong_preferred: { end: true, correct: false, text: 'The performance cost of one extra method call to an injected service is negligible and not the actual concern here -- the real cost is testability and reusability, which this design genuinely sacrifices for no meaningful benefit.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A @WebMvcTest(PaperController.class) test stubs the mocked PaperService.create() to return a specific Paper, and asserts the controller returns 201 Created with the correct Location header. Does this test prove PaperService\'s real DOI-uniqueness check works correctly?',
        choices: [
          { text: 'No -- PaperService is entirely mocked in this test; the test only proves PaperController correctly handles whatever the mock is told to return, not that the REAL PaperService\'s logic is correct', to: 'q3_right' },
          { text: 'Yes -- @WebMvcTest always uses the real PaperService implementation internally, just with a faster startup', to: 'q3_wrong_real' },
          { text: 'Yes, because @Valid automatically also validates the service layer\'s internal logic', to: 'q3_wrong_valid' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- this is exactly the "mock lies" gap mockito-test-doubles and integration-testing built around. A @WebMvcTest with a mocked service proves the CONTROLLER\'s own behavior, not whether the real service\'s logic actually works -- that needs a separate, plain unit test of PaperService itself.', next: null },
      q3_wrong_real: { end: true, correct: false, text: '@WebMvcTest specifically does NOT load the real service -- @MockBean replaces it with a Mockito mock precisely so the narrower web-layer-only context can still construct the controller without needing the full application wired up.', retry: 'q3' },
      q3_wrong_valid: { end: true, correct: false, text: '@Valid triggers Bean Validation on the REQUEST DTO\'s own fields -- it has no relationship at all to whether a service\'s internal business logic (like a DOI-uniqueness check) is correct.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Embedding real business logic directly inside a @RestController method instead of delegating to a @Service -- makes that logic untestable without the whole web layer, and impossible to reuse from a non-HTTP caller without duplication.',
    'Having a @Service method return a Spring-MVC type (ResponseEntity, or throw an HTTP-specific exception) -- couples business logic to the web layer, breaking unit-testability and reuse from non-HTTP contexts.',
    'Assuming Bean Validation (@NotBlank, @Min/@Max on a DTO) can catch everything a database constraint can -- it only inspects the request\'s own field values in isolation, never data that requires an actual database lookup (like DOI uniqueness).',
    'Forgetting @Valid on a @RequestBody parameter -- without it, Bean Validation annotations on the DTO are simply never checked, silently letting malformed requests reach the controller method\'s own code.',
    'Using @SpringBootTest (the full, slow application context) to test a controller\'s own routing/validation/exception-mapping logic -- @WebMvcTest with a mocked service tests exactly that, faster and in isolation.',
    'Treating a green @WebMvcTest as proof the REAL service logic is correct -- the service is mocked in that test slice; a separate, plain unit test of the service itself is what actually verifies its logic.'
  ],
  interview: [
    {
      q: 'A team\'s PaperController has grown to include several inline business rules directly in its @PostMapping method, alongside calls to PaperService for other logic — a mix of "some rules live in the controller, some live in the service." A new engineer proposes moving ALL business logic into the service layer, with the controller doing nothing but request parsing and response mapping. Evaluate this proposal and its concrete benefits.',
      a: 'The proposal is correct, and the concrete benefits are specific, not just aesthetic. Testability: any business rule currently living inline in the controller can ONLY be exercised by actually invoking the controller through the web layer (real HTTP semantics, real Bean Validation, real exception mapping all in the way) or via a @WebMvcTest — and even THAT slice mocks the service, so an inline controller rule isn\'t reachable through a plain, fast unit test at all; moving it into PaperService makes it directly, trivially unit-testable with `new PaperService(fakeRepository)`, exactly this course\'s established fast-unit-test workflow since Part 7. Reusability: any business rule embedded in ONE specific controller method is, by construction, unavailable to any OTHER caller of the same underlying operation — a future batch-import job, a different API version, an internal admin tool — without literally copy-pasting the same logic into each new caller, immediately reintroducing the exact "duplicated logic drifts out of sync" risk this course has warned about since the streams/lambdas lessons\' repetition arguments and maven-multi-module\'s dependencyManagement material. Consistency of testing strategy: with business logic split across two different layers, a reviewer or new team member has to remember, for EVERY piece of logic, "is this one the kind that\'s in the controller (test via @WebMvcTest or full HTTP) or the kind that\'s in the service (test via a plain unit test)" — a genuinely confusing, error-prone split that consolidating into "the controller ALWAYS delegates, the service ALWAYS holds the logic" eliminates entirely, making the correct testing approach for ANY given piece of logic predictable and consistent across the whole codebase.'
    },
    {
      q: 'Design (in words) the exception-handling strategy for a scenario NOT covered by this lesson\'s code demo: a client sends a syntactically valid JSON request body that Jackson simply cannot deserialize into the target type at all (e.g. a string where an Integer field is expected). What status code should this produce, and how would you wire it, given this lesson\'s @ControllerAdvice pattern?',
      a: 'This scenario is distinct from BOTH cases this lesson\'s code demo already handles: it\'s not a Bean Validation failure (@Valid never even runs, since Jackson fails to produce an OBJECT to validate in the first place), and it\'s not a domain-specific business exception (DuplicateDoiException, PaperNotFoundException) thrown by application code. Jackson deserialization failures of this kind surface in Spring MVC as an HttpMessageNotReadableException — malformed or type-mismatched JSON that can\'t even be turned into the target Java object. The correct status code is still 400 Bad Request: the fault is entirely the CLIENT\'s (they sent a request body that doesn\'t match the expected shape), and retrying the IDENTICAL malformed request would fail identically every time, precisely http-rest-json\'s definition of when 400 is the right choice. The wiring follows the exact same @ControllerAdvice pattern this lesson\'s ApiExceptionHandler already establishes: add another `@ExceptionHandler(HttpMessageNotReadableException.class)` method returning `ResponseEntity.status(HttpStatus.BAD_REQUEST).body(...)`, ideally with a message clear enough for the client to understand WHICH field or WHAT shape mismatch caused the failure (Jackson\'s own exception typically carries some detail about the specific field/path involved, worth surfacing rather than a generic "bad request" with no further information) — the SAME centralized, applies-to-every-controller mechanism handling both Bean Validation failures and Jackson deserialization failures consistently, rather than needing separate, inconsistent handling logic scattered across each individual controller method for what is, from the CLIENT\'s perspective, the same basic category of problem: "the request I sent doesn\'t match what this endpoint expects."'
    },
    {
      q: 'A colleague argues that since @WebMvcTest tests are fast and isolated (per the test pyramid\'s preference for fast tests), a team should write @WebMvcTest tests for EVERY controller endpoint and skip writing full @SpringBootTest integration tests entirely, to keep the suite fast. Evaluate this reasoning using this lesson\'s and integration-testing\'s material together.',
      a: 'The instinct toward favoring fast tests is directionally correct (the test pyramid genuinely does prefer many fast tests over few slow ones), but skipping @SpringBootTest-level (or Testcontainers-backed integration) tests ENTIRELY reintroduces exactly the "mock lies" gap this lesson explicitly built its final tech question around. A @WebMvcTest proves PaperController correctly parses requests, correctly applies Bean Validation, and correctly maps whatever the MOCKED PaperService is told to return or throw into the right HTTP response — genuinely valuable, narrow, fast coverage of the controller\'s OWN concerns. But it says absolutely nothing about whether the REAL PaperService, wired to the REAL PaperRepository, wired to a REAL (or Testcontainers-backed) database, actually behaves the way every @WebMvcTest\'s stubs assumed it would — whether the ACTUAL wiring between @SpringBootApplication\'s component scan, the real @Service, the real @Repository implementation, and the real database schema (sql-postgresql\'s actual CREATE TABLE statements) is even correctly assembled at all is something NO number of @WebMvcTest tests, however many are written, could ever verify, since none of them ever construct the real application context. This is precisely the test-pyramid shape this course has argued for repeatedly: MANY fast @WebMvcTest and plain-unit-test-of-PaperService tests forming the wide base and narrower middle, plus a SMALL number of full @SpringBootTest (or Testcontainers-backed integration) tests specifically covering the handful of critical, whole-system-wired-together paths worth the added slowness — not zero of the latter in exchange for speed, since that specific tradeoff is exactly what leaves a team blind to real wiring mistakes that no amount of additional web-layer-only or service-layer-only testing could ever surface.'
    },
    {
      q: 'A production incident report shows an endpoint returning 500 Internal Server Error for what turns out to be a NullPointerException thrown deep inside PaperService when authorId refers to an author that was deleted after the request was validated but before the service processed it. Diagnose this using this lesson\'s status-code material, and propose the correct fix.',
      a: 'The immediate symptom (500) is technically accurate in one narrow sense — an unhandled NullPointerException genuinely IS an unexpected server-side failure, and Spring\'s default behavior for any exception with no registered @ExceptionHandler is exactly a generic 500 — but it is the WRONG status code for what actually HAPPENED here, and http-rest-json\'s own material explains precisely why: this specific failure is fundamentally about a RESOURCE REFERENCED BY THE REQUEST no longer existing (the author was deleted in the window between when the request was validated and when the service actually processed it) — conceptually much closer to "the referenced resource doesn\'t exist" (404-shaped) or, arguably, a conflict between the request\'s assumption and the current database state (409-shaped, similar in spirit to the duplicate-DOI case), NEITHER of which is what a bare, unhandled NullPointerException naturally communicates to a client as a generic 500. The concrete fix has two parts. First, and most directly actionable: PaperService.create() (or wherever authorId is used) should not silently assume the referenced author exists — it should explicitly look it up (or rely on the database\'s own foreign-key constraint, sql-postgresql\'s papers.author_id REFERENCES authors(id), to reject the insert) and throw a clear, specific domain exception — an AuthorNotFoundException, say — rather than letting a null reference propagate silently into a NullPointerException deep in unrelated code; this converts an opaque crash into a MEANINGFUL, precisely-typed exception the @ControllerAdvice layer can map correctly (most likely to 404, "the referenced author no longer exists," or 409 if framed as a request/state conflict). Second, more generally: any unhandled exception reaching a generic 500 handler is worth treating as a SIGNAL that some specific failure mode wasn\'t anticipated and given its own proper domain exception and status mapping — the fix isn\'t just patching THIS one NullPointerException, it\'s recognizing the broader pattern (a resource referenced by an earlier-validated request being deleted before the request finishes processing is a genuine, recurring risk category any multi-step operation touching foreign-key relationships should account for) and auditing for other similar unguarded assumptions elsewhere in the codebase.'
    }
  ]
};
