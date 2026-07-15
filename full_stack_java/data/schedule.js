/*
Master ordered list of study modules for the Full-Stack Java Course. Drives the
dashboard, nav order, prev/next links on lesson pages, and the interview drill
question pool.
type: 'lesson' — loads data/lessons/<id>.js into lesson.html?id=<id>
type: 'drill'  — special page (href used directly)
Times sum to ~43 hours. Order matters: later lessons assume earlier ones, and
everything converges on the capstone: LogPose, a cross-platform research-log
manager with NLP-powered semantic search.
*/
window.SCHEDULE = [
  // ── Part 0: Orientation & Setup ──────────────────────────────────────
  { id: 'how-java-fits-together', title: 'The Map: JDK vs JRE vs JVM, the Java Ecosystem & Where This Course Ends Up', category: 'Part 0 — Orientation & Setup', timeMin: 35, type: 'lesson' },
  { id: 'setup-first-program', title: 'Setup: Install a JDK, Compile & Run, jshell, and What javac Actually Produces', category: 'Part 0 — Orientation & Setup', timeMin: 40, type: 'lesson' },

  // ── Part 1: Core Java Language ───────────────────────────────────────
  { id: 'syntax-types-operators', title: 'Types & Variables: Primitives vs References, Autoboxing, var', category: 'Part 1 — Core Java', timeMin: 45, type: 'lesson' },
  { id: 'control-flow-methods', title: 'Control Flow & Methods: Loops, Modern switch, Overloading', category: 'Part 1 — Core Java', timeMin: 40, type: 'lesson' },
  { id: 'oop-classes-objects', title: 'Classes & Objects: Constructors, this, static, Encapsulation', category: 'Part 1 — Core Java', timeMin: 50, type: 'lesson' },
  { id: 'inheritance-polymorphism', title: 'Inheritance & Polymorphism: extends, super, Dynamic Dispatch, abstract', category: 'Part 1 — Core Java', timeMin: 50, type: 'lesson' },
  { id: 'interfaces-default-methods', title: 'Interfaces: Contracts, default Methods & Program-to-Interface Design', category: 'Part 1 — Core Java', timeMin: 45, type: 'lesson' },
  { id: 'exceptions', title: 'Exceptions: Checked vs Unchecked, try-with-resources, Custom Exceptions', category: 'Part 1 — Core Java', timeMin: 45, type: 'lesson' },
  { id: 'strings-equals-hashcode', title: 'Strings, Immutability & the equals/hashCode Contract', category: 'Part 1 — Core Java', timeMin: 45, type: 'lesson' },

  // ── Part 2: The JVM, Deeply ──────────────────────────────────────────
  { id: 'jvm-architecture', title: 'JVM Architecture: Classloaders, Bytecode, the Interpreter & JIT', category: 'Part 2 — The JVM, Deeply', timeMin: 55, type: 'lesson' },
  { id: 'memory-model-gc', title: 'Memory & Garbage Collection: Heap, Stack, Generations, G1 & ZGC', category: 'Part 2 — The JVM, Deeply', timeMin: 55, type: 'lesson' },
  { id: 'jvm-tools-reflection', title: 'JVM Toolbox: javap, jconsole, Profilers, Flags — plus Reflection & Annotations', category: 'Part 2 — The JVM, Deeply', timeMin: 45, type: 'lesson' },

  // ── Part 3: Collections & Generics (Java-specific DS) ────────────────
  { id: 'generics', title: 'Generics: Type Erasure, Bounded Types & PECS Wildcards', category: 'Part 3 — Collections & Generics', timeMin: 50, type: 'lesson' },
  { id: 'collections-lists', title: 'The Collections Framework: ArrayList vs LinkedList, Iterators, fail-fast', category: 'Part 3 — Collections & Generics', timeMin: 45, type: 'lesson' },
  { id: 'maps-deep-dive', title: 'Maps Deep Dive: HashMap Internals, LinkedHashMap (& LRU), TreeMap, EnumMap', category: 'Part 3 — Collections & Generics', timeMin: 55, type: 'lesson' },
  { id: 'sets-queues-deques', title: 'Sets, Queues & Deques: HashSet Family, PriorityQueue, ArrayDeque', category: 'Part 3 — Collections & Generics', timeMin: 40, type: 'lesson' },

  // ── Part 4: Modern Java ──────────────────────────────────────────────
  { id: 'lambdas-functional', title: 'Lambdas & Functional Interfaces: Function, Predicate, Method References', category: 'Part 4 — Modern Java', timeMin: 45, type: 'lesson' },
  { id: 'streams', title: 'The Stream API: map/filter/reduce, Collectors & Optional', category: 'Part 4 — Modern Java', timeMin: 55, type: 'lesson' },
  { id: 'records-sealed-pattern-matching', title: 'Records, Sealed Classes & Pattern Matching: Modeling Data the Modern Way', category: 'Part 4 — Modern Java', timeMin: 45, type: 'lesson' },
  { id: 'datetime-io-nio', title: 'java.time, I/O & NIO: Dates Done Right, Files, Paths & Serialization', category: 'Part 4 — Modern Java', timeMin: 45, type: 'lesson' },

  // ── Part 5: Concurrency ──────────────────────────────────────────────
  { id: 'threads-basics', title: 'Threads: Runnable, synchronized, volatile & the Java Memory Model', category: 'Part 5 — Concurrency', timeMin: 55, type: 'lesson' },
  { id: 'executors-futures', title: 'Executors & CompletableFuture: Thread Pools & Async Pipelines', category: 'Part 5 — Concurrency', timeMin: 50, type: 'lesson' },
  { id: 'concurrent-collections-virtual-threads', title: 'ConcurrentHashMap, Atomics & Virtual Threads (Project Loom)', category: 'Part 5 — Concurrency', timeMin: 45, type: 'lesson' },

  // ── Part 6: Maven & the Build ────────────────────────────────────────
  { id: 'maven-fundamentals', title: 'Maven Fundamentals: POM, Coordinates, Dependencies, Scopes & the Lifecycle', category: 'Part 6 — Maven & the Build', timeMin: 55, type: 'lesson' },
  { id: 'maven-multi-module', title: 'Maven Advanced: Multi-Module Projects, BOMs, Profiles & Dependency Conflicts', category: 'Part 6 — Maven & the Build', timeMin: 50, type: 'lesson' },

  // ── Part 7: Testing (All of It) ──────────────────────────────────────
  { id: 'unit-testing-junit5', title: 'Unit Testing with JUnit 5: Assertions, Lifecycle, Parameterized Tests', category: 'Part 7 — Testing', timeMin: 55, type: 'lesson' },
  { id: 'mockito-test-doubles', title: 'Test Doubles & Mockito: Mocks, Stubs, Spies, Fakes & When Each Lies to You', category: 'Part 7 — Testing', timeMin: 50, type: 'lesson' },
  { id: 'integration-testing', title: 'Integration, E2E & the Test Pyramid: Testcontainers, Spring Tests, Contracts', category: 'Part 7 — Testing', timeMin: 55, type: 'lesson' },
  { id: 'tdd-coverage-flaky-tests', title: 'TDD, Coverage, Mutation Testing & Flaky Tests (Yes, Your Research Topic)', category: 'Part 7 — Testing', timeMin: 45, type: 'lesson' },

  // ── Part 8: Databases ────────────────────────────────────────────────
  { id: 'sql-postgresql', title: 'Relational Databases & SQL with PostgreSQL: Schema Design, Joins, Indexes', category: 'Part 8 — Databases', timeMin: 60, type: 'lesson' },
  { id: 'jdbc-transactions', title: 'JDBC: Drivers, PreparedStatement, Connection Pools & Transactions (ACID)', category: 'Part 8 — Databases', timeMin: 45, type: 'lesson' },
  { id: 'jpa-hibernate', title: 'JPA & Hibernate: Entities, Relationships, N+1, and Flyway Migrations', category: 'Part 8 — Databases', timeMin: 55, type: 'lesson' },

  // ── Part 9: Backend with Spring ──────────────────────────────────────
  { id: 'http-rest-json', title: 'HTTP, REST & JSON: How the Web Actually Talks (plus Jackson)', category: 'Part 9 — Backend with Spring', timeMin: 45, type: 'lesson' },
  { id: 'spring-core-di', title: 'Spring Core: Inversion of Control, Dependency Injection & Beans', category: 'Part 9 — Backend with Spring', timeMin: 50, type: 'lesson' },
  { id: 'spring-boot-rest-api', title: 'Spring Boot: Build a Real REST API — Controllers, Services, Validation', category: 'Part 9 — Backend with Spring', timeMin: 60, type: 'lesson' },
  { id: 'spring-data-security', title: 'Spring Data JPA & Spring Security: Repositories, Auth & JWT', category: 'Part 9 — Backend with Spring', timeMin: 55, type: 'lesson' },

  // ── Part 10: Frontend for Java Devs ──────────────────────────────────
  { id: 'web-frontend-basics', title: 'Web Frontend Essentials: HTML/CSS/JS, fetch & Talking to Your API', category: 'Part 10 — Frontend', timeMin: 50, type: 'lesson' },
  { id: 'frontend-choices', title: 'Frontend Strategies for Java Teams: Thymeleaf vs React vs Vaadin', category: 'Part 10 — Frontend', timeMin: 40, type: 'lesson' },

  // ── Part 11: Desktop & Games ─────────────────────────────────────────
  { id: 'javafx-desktop', title: 'JavaFX: Scene Graph, FXML, Properties & Bindings — Real Desktop Apps', category: 'Part 11 — Desktop & Games', timeMin: 55, type: 'lesson' },
  { id: 'game-loop-desktop-game', title: 'Game Programming I: The Game Loop, Canvas & a Complete Desktop Game', category: 'Part 11 — Desktop & Games', timeMin: 60, type: 'lesson' },
  { id: 'cross-platform-games-libgdx', title: 'Game Programming II: libGDX — One Codebase for Desktop, Web & Mobile Games', category: 'Part 11 — Desktop & Games', timeMin: 55, type: 'lesson' },

  // ── Part 12: Cross-Platform Apps (Mac & iPhone included) ─────────────
  { id: 'gluon-mobile-graalvm', title: 'One Codebase Everywhere: JavaFX + Gluon Mobile, GraalVM Native & iOS', category: 'Part 12 — Cross-Platform Apps', timeMin: 50, type: 'lesson' },
  { id: 'packaging-distribution', title: 'Shipping It: jlink, jpackage, Mac .app/.dmg, Signing & Notarization', category: 'Part 12 — Cross-Platform Apps', timeMin: 40, type: 'lesson' },

  // ── Part 13: NLP-Powered Search in Java ──────────────────────────────
  { id: 'nlp-search-lucene', title: 'Search in Java: Tokenization, TF-IDF & Apache Lucene (Keyword Search)', category: 'Part 13 — NLP Search in Java', timeMin: 50, type: 'lesson' },
  { id: 'embeddings-semantic-search-java', title: 'Semantic Search in Java: Embeddings via ONNX/DJL, pgvector & Transfer Learning', category: 'Part 13 — NLP Search in Java', timeMin: 60, type: 'lesson' },

  // ── Part 14: Capstone — LogPose ──────────────────────────────────────
  { id: 'capstone-design', title: 'LogPose, Designed: Requirements, Architecture, ERD, API Spec & Milestones', category: 'Part 14 — Capstone: LogPose', timeMin: 70, type: 'lesson' },
  { id: 'capstone-build-backend', title: 'Building LogPose I: Multi-Module Maven, Backend, DB & Semantic Search', category: 'Part 14 — Capstone: LogPose', timeMin: 70, type: 'lesson' },
  { id: 'capstone-build-clients', title: 'Building LogPose II: Web UI, JavaFX Desktop & Gluon iOS Clients', category: 'Part 14 — Capstone: LogPose', timeMin: 70, type: 'lesson' },

  // ── Part 15: Beyond Maven & Interview Prep ───────────────────────────
  { id: 'gradle-other-builds', title: 'Gradle & Friends: Gradle Deep-Dive, plus Ant, Bazel & How to Choose', category: 'Part 15 — Beyond Maven & Interviews', timeMin: 50, type: 'lesson' },
  { id: 'java-interview-prep', title: 'The Java Interview: What They Ask & How to Answer', category: 'Part 15 — Beyond Maven & Interviews', timeMin: 45, type: 'lesson' },
  { id: 'interview-drill', title: 'Timed Interview Drill (All Topics)', category: 'Part 15 — Beyond Maven & Interviews', timeMin: 60, type: 'drill', href: 'interview.html' },
];

window.SCHEDULE_TOTAL_MIN = window.SCHEDULE.reduce((s, m) => s + m.timeMin, 0);
