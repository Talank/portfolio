window.LESSONS = window.LESSONS || {};
window.LESSONS['capstone-build-backend'] = {
  id: 'capstone-build-backend',
  title: 'Building LogPose I: Multi-Module Maven, Backend, DB & Semantic Search',
  category: 'Part 14 — Capstone: LogPose',
  timeMin: 70,
  summary: 'capstone-design drew the blueprint. This lesson actually builds it, in the exact dependency order that lesson specified: a real multi-module Maven project, Flyway migrations creating the FULL consolidated schema (including the new ideas/projects tables and pgvector columns), JPA entities and Spring Data repositories for the new Idea/Project domain, thin controllers and services following the identical pattern every existing controller already established, Spring Security wiring, and a working /search endpoint backed by HybridSearchIndex. Nothing here is a new CONCEPT — every technique was taught in full elsewhere. This lesson is the assembly.',
  goals: [
    'Set up a real multi-module Maven project (logpose-core, logpose-search, logpose-backend) mirroring maven-multi-module\'s parent/child pattern',
    'Write ordered Flyway migrations creating the complete schema, and explain why migration order matters for foreign-key dependencies',
    'Build IdeaEntity/IdeaRepository/IdeaService/IdeaController following the exact pattern PaperEntity/PaperRepository/PaperService/PaperController already established',
    'Wire a /search endpoint backed by a HybridSearchIndex bean composed from LuceneIndex and EmbeddingSearchIndex, using @Configuration + @Bean',
    'Verify the assembled backend actually works end to end before starting client development — the specific things to check before moving on'
  ],
  concept: [
    {
      h: 'Step 1: the multi-module Maven skeleton',
      p: [
        'Following maven-multi-module\'s exact pattern: a parent POM (<code>logpose-parent</code>, packaging <code>pom</code>, <code>&lt;modules&gt;</code> listing the three children) with <code>dependencyManagement</code> pinning shared dependency versions once. <code>logpose-core</code> holds the JPA entities and repositories — genuinely shared, platform-independent domain code any module might need. <code>logpose-search</code> holds LuceneIndex/EmbeddingSearchIndex/HybridSearchIndex — search is a self-contained concern with its own dependencies (Lucene, DJL) that most of the backend never needs to see directly. <code>logpose-backend</code> is the actual Spring Boot application — controllers, services, security config — depending on BOTH <code>logpose-core</code> and <code>logpose-search</code>, never the reverse.',
        'This module boundary is not arbitrary: <code>logpose-search</code> depending on <code>logpose-core</code> (to know what a <code>PaperEntity</code> looks like) makes sense; <code>logpose-core</code> depending on <code>logpose-search</code> would not, since the core domain model has no reason to know anything about HOW it gets searched. Getting the dependency DIRECTION right here is exactly maven-multi-module\'s own reactor-build-order lesson, now applied to a real project rather than a two-module example.'
      ]
    },
    {
      h: 'Step 2: Flyway migrations, in dependency order',
      p: [
        'jpa-hibernate\'s own argument against <code>ddl-auto=update</code> applies here directly: every table from capstone-design\'s consolidated schema gets created by an explicit, versioned migration script, in <code>logpose-backend/src/main/resources/db/migration/</code>. Migration ORDER matters for a concrete, mechanical reason: <code>papers.author_id REFERENCES authors(id)</code> means the <code>authors</code> table MUST already exist before <code>papers</code> is created, or the foreign-key constraint itself fails — <code>V1__create_authors_and_papers.sql</code> creates both, in that order within the same file; <code>V2__create_tags_and_reviews.sql</code> adds <code>tags</code>/<code>paper_tags</code>/<code>reviews</code> (all referencing <code>papers</code>, which V1 already created); <code>V3__create_decisions.sql</code>; <code>V4__create_ideas_and_projects.sql</code> creates <code>ideas</code> and <code>projects</code> together, since <code>ideas.project_id</code> references <code>projects</code>; <code>V5__add_embeddings.sql</code> runs LAST, adding the <code>pgvector</code> extension and embedding columns to the now-already-existing <code>papers</code> and <code>ideas</code> tables.',
        'Flyway tracks exactly which of these have run in its own <code>flyway_schema_history</code> table — running <code>mvn flyway:migrate</code> (or letting Spring Boot run it automatically on startup, the more common real setup) against a FRESH database applies all five, in order; running it again against the SAME database applies nothing further, since Flyway already knows V1 through V5 are done.'
      ]
    },
    {
      h: 'Step 3: IdeaEntity and IdeaRepository, following the existing pattern exactly',
      p: [
        'jpa-hibernate\'s exact pattern, applied to the one genuinely new entity: <code>@Entity @Table(name = "ideas") class IdeaEntity</code> with <code>@ManyToOne @JoinColumn(name = "author_id") private AuthorEntity author;</code> (EAGER by default, matching PaperEntity\'s own author relationship) and <code>@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "related_paper_id") private PaperEntity relatedPaper;</code> — LAZY specifically because, unlike an author (always needed alongside an idea), the related paper is OFTEN null and rarely needed just to display an idea in a list. spring-data-security\'s exact pattern for the repository: <code>interface IdeaRepository extends JpaRepository&lt;IdeaEntity, Long&gt; { List&lt;IdeaEntity&gt; findByAuthorId(Long authorId); }</code> — zero implementation code, exactly like PaperRepository.',
        'One genuinely new consideration relatedPaper introduces: a <code>@Query</code> with <code>JOIN FETCH i.relatedPaper</code> is needed for any endpoint displaying an idea ALONGSIDE its related paper\'s title, exactly jpa-hibernate\'s own N+1 warning — <code>findByAuthorId</code> alone, followed by accessing <code>idea.getRelatedPaper().getTitle()</code> in a loop, would reproduce that exact N+1 pattern for any idea that DOES have a related paper.'
      ]
    },
    {
      h: 'Step 4: thin controllers, and the /search endpoint composing two Searchable beans',
      p: [
        'spring-boot-rest-api\'s exact thin-controller pattern: <code>IdeaService</code> holds the real logic (constructor-injected <code>IdeaRepository</code>); <code>IdeaController</code> maps <code>GET/POST /ideas</code>, <code>GET/DELETE /ideas/{id}</code> to it, returning the SAME status codes (201+Location, 204, 404) every existing controller already returns. The <code>/search</code> endpoint is new in KIND, not in PATTERN: a <code>@Configuration</code> class provides <code>@Bean Searchable luceneIndex()</code>, <code>@Bean Searchable embeddingIndex(...)</code>, and <code>@Bean @Primary Searchable hybridIndex(@Qualifier(...) Searchable lucene, @Qualifier(...) Searchable embedding) { return new HybridSearchIndex(lucene, embedding); }</code> — spring-core-di\'s exact @Qualifier/@Primary disambiguation pattern, now needed precisely because THREE beans all implement the same Searchable interface.',
        '<code>SearchController</code> constructor-injects the <code>@Primary</code> <code>hybridIndex</code> bean and exposes <code>GET /search?q=...</code>, calling <code>hybridIndex.search(q)</code> — a genuinely tiny controller, since ALL the actual complexity (keyword matching, embedding similarity, deduplication) lives inside the already-built HybridSearchIndex; the controller\'s only job is HTTP plumbing around a call that already works. Spring Security\'s configuration (spring-data-security\'s own pattern) marks <code>/papers/**</code> and <code>/ideas/**</code> and <code>/search</code> as publicly readable, while <code>/decisions/**</code> and any DELETE endpoint stay <code>@PreAuthorize("hasRole(\'EDITOR\')")</code>-protected, exactly the roles already established.'
      ]
    },
    {
      h: 'Step 5: verifying the assembled backend before touching any client',
      p: [
        'Before capstone-build-clients (next lesson) begins, capstone-design\'s own build-order argument demands checking, concretely: (1) <code>mvn -pl logpose-backend spring-boot:run</code> starts cleanly, with Flyway\'s startup log showing all five migrations applied; (2) <code>curl -X POST localhost:8080/papers -d \'{"title":"...", "doi":"...", "authorId":1}\'</code> returns <code>201</code> with a <code>Location</code> header, exactly http-rest-json\'s designed contract; (3) <code>curl -X POST localhost:8080/ideas -d \'{"title":"...", "body":"...", "authorId":1}\'</code> (with no <code>relatedPaperId</code> at all) succeeds — proving the nullable-foreign-key design decision genuinely works, not just compiles; (4) <code>curl localhost:8080/search?q=flaky+tests</code> returns results from BOTH a keyword-matching paper AND a semantically-related idea sharing no literal words with the query, proving HybridSearchIndex is genuinely wired correctly, not just present in the codebase.',
        'This verification step is not optional polish — it is the concrete, checkable definition of "the backend is actually done," and skipping it is precisely how capstone-build-clients could end up built against endpoints that compile but don\'t actually behave correctly, exactly the mockito-test-doubles "mock lies" risk this course has warned about repeatedly, now at the level of an entire assembled system rather than one mocked collaborator.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky lays the keel, then the hull, then the decks, then the rigging — checking the ship actually floats before anyone boards',
      text: 'With the blueprint fully unrolled, Franky and the crew finally start cutting. He is strict about ORDER, for a reason that has nothing to do with tradition: the KEEL goes down first, since nothing else can be attached to a hull that doesn\'t exist yet (the multi-module skeleton) — then the HULL PLANKS, laid in the exact sequence the blueprint specifies, since a plank meant to attach to a neighboring plank that isn\'t there yet simply can\'t be fastened at all (Flyway migrations, in foreign-key dependency order). Only once the hull is sound do the DECKS go in — the crew quarters, the new wing for logs and sketches, each built to fit the specific space the hull already provides (the entities and repositories). Then the RIGGING and the signal equipment, wired last, since there\'s nothing to attach signal lines to before the deck they run across actually exists (the controllers, security, and the search signal tower combining two separate detection methods into one). And before ANY crew member is allowed to board and start actually living aboard, Franky insists on one more thing: an actual SHAKEDOWN — cast off, sail a short distance, confirm the ship genuinely floats, steers, and holds together under real strain, not just that every plank was technically nailed on correctly (verification: does it actually run, does it actually save data, does search actually find things). Only after the ship genuinely sails does anyone start moving their belongings aboard.',
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s renovation: structural work, then wiring, then the house rules, then the furniture — checking everything actually works before anyone moves back in',
      text: 'With the full plan agreed on, Monica and the group finally start the actual renovation. She is strict about ORDER, for a reason that has nothing to do with being controlling: the STRUCTURAL work goes first, since nothing else can be attached to walls that aren\'t up yet (the multi-module skeleton) — then the specific ROOMS get built out, in the exact sequence the plan specifies, since a room meant to connect to a hallway that isn\'t finished yet simply can\'t be properly attached at all (Flyway migrations, in dependency order). Only once the structure is sound does the WIRING go in — the new home-office nook\'s outlets, built to fit the specific space the structure already provides (the entities and repositories). Then the HOUSE RULES SYSTEM gets set up last, since there\'s nothing to attach a shared calendar or a thermostat schedule to before the rooms they govern actually exist (the controllers, security, and the search feature combining two separate lookup methods into one). And before ANYONE is allowed to actually move back in and start living there, Monica insists on one more thing: an actual WALKTHROUGH — turn on every light, run the water, confirm everything genuinely works together, not just that every piece was technically installed correctly (verification: does it actually run, does it actually save data, does search actually find things). Only after the walkthrough passes does anyone start bringing their things back in.',
    },
    why: 'Franky\'s / Monica\'s strict construction order — keel/structure, then hull/rooms in dependency order, then decks/wiring, then rigging/rules — is exactly capstone-build-backend\'s own build sequence: multi-module skeleton, then Flyway migrations in foreign-key order, then entities/repositories, then controllers/security/search. And the insistence on an actual shakedown/walkthrough — proving the ship genuinely floats or the renovation genuinely works, not just that every piece was technically installed — is this lesson\'s own final verification step, the concrete, checkable definition of "the backend is actually done" before anyone starts building a client against it.'
  },
  storyAnim: {
    title: 'Keel, then hull in order, then decks, then rigging -- and a real shakedown before anyone boards',
    h: 340,
    props: [
      { id: 'keel', emoji: '🪵', label: 'the keel goes down FIRST -- nothing attaches to a hull that doesn\'t exist (module skeleton)', x: 6, y: 8 },
      { id: 'hullorder', emoji: '🔨', label: 'hull planks laid in dependency order (Flyway migrations, FK order)', x: 30, y: 8 },
      { id: 'decks', emoji: '🚪', label: 'decks built to fit the space the hull already provides (entities & repos)', x: 54, y: 8 },
      { id: 'rigging', emoji: '📡', label: 'rigging and the signal tower wired LAST (controllers, security, search)', x: 78, y: 8 },
      { id: 'shakedown', emoji: '⛵', label: 'a real shakedown -- does it actually float and steer, before anyone boards (verification)', x: 40, y: 50 }
    ],
    actors: [
      { id: 'franky', emoji: '🛠️', label: 'Franky', x: 20, y: 78 },
      { id: 'crew', emoji: '⚓', label: 'crew', x: 65, y: 78 }
    ],
    steps: [
      { c: 'The keel goes down first -- nothing else can attach to a hull that doesn\'t exist yet.', p: { keel: 'lit' }, a: { franky: [20, 30] } },
      { c: 'Hull planks are laid in the exact order the blueprint specifies, matching what each plank depends on.', p: { hullorder: 'lit' } },
      { c: 'Only once the hull is sound do the decks go in, fitted to the space already provided.', p: { decks: 'good' } },
      { c: 'Rigging and signal equipment are wired last, since they attach to decks that must already exist.', p: { rigging: 'good' } },
      { c: 'Before anyone boards, Franky insists on a real shakedown -- proving the ship genuinely works, not just that it was built correctly.', p: { shakedown: 'good' }, a: { crew: [40, 60] } }
    ]
  },
  conceptFlow: {
    title: 'From the module skeleton to migrations, entities, controllers, and final verification',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Skeleton',
        nodes: [
          { id: 'modules', text: 'logpose-core / logpose-search /\nlogpose-backend, correct dependency direction' }
        ]
      },
      {
        label: 'Migrations',
        nodes: [
          { id: 'migrationorder', text: 'V1-V5, ordered by\nforeign-key dependency' }
        ]
      },
      {
        label: 'Entities & repos',
        nodes: [
          { id: 'ideaentity', text: 'IdeaEntity + IdeaRepository,\nexact pattern as PaperEntity' }
        ]
      },
      {
        label: 'Controllers & search',
        nodes: [
          { id: 'thincontrollers', text: 'IdeaController: thin,\nsame status-code contract' },
          { id: 'hybridbean', text: '@Bean @Primary HybridSearchIndex,\ncomposed from 2 @Qualifier beans' }
        ]
      },
      {
        label: 'Verification',
        nodes: [
          { id: 'verify', text: 'starts cleanly, migrations applied,\nendpoints work, search actually finds things' }
        ]
      }
    ],
    steps: [
      { active: ['modules'], note: 'logpose-search and logpose-backend depend on logpose-core; core never depends on either, mirroring maven-multi-module\'s reactor-order argument.' },
      { active: ['migrationorder'], note: 'Each migration creates tables only after whatever they reference by foreign key already exists -- authors before papers, papers before reviews/decisions, projects alongside ideas.' },
      { active: ['ideaentity'], note: 'IdeaEntity and IdeaRepository follow jpa-hibernate/spring-data-security\'s exact established pattern -- no new JPA concepts, just applied to a new entity.' },
      { active: ['thincontrollers'], note: 'IdeaController delegates to IdeaService and returns the same 201/204/404 contract every existing controller already uses.' },
      { active: ['hybridbean'], note: '@Qualifier disambiguates two Searchable beans (Lucene, embedding); @Primary marks the composed HybridSearchIndex as the default for /search.' },
      { active: ['verify'], note: 'A clean startup, successful migrations, working endpoints, and a search actually returning semantically-related results are the concrete definition of "backend done."' }
    ]
  },
  tech: [
    {
      q: 'A developer writes V1__create_ideas_and_projects.sql BEFORE V1__create_authors_and_papers.sql (alphabetically or by mistake), both intended to run as early migrations. What happens when Flyway runs them, and why?',
      a: 'Flyway applies migrations strictly in VERSION-NUMBER order (V1, V2, V3...), not alphabetical or creation-time order — but if ideas/projects is genuinely assigned version V1 and authors/papers is assigned a LATER version, Flyway would attempt to run the ideas/projects migration FIRST, which would immediately FAIL at the database level: ideas.author_id REFERENCES authors(id) requires the authors table to already exist, and it does not yet, since that migration hasn\'t run. This is not a Flyway-specific gotcha at all — it is ordinary PostgreSQL foreign-key enforcement (sql-postgresql\'s own referential-integrity material) refusing to create a table whose FK constraint references a table that doesn\'t exist. The fix is entirely about VERSION NUMBERING: authors/papers must be assigned a numerically EARLIER version than anything referencing them, matching this lesson\'s own V1 through V5 sequence exactly.'
    },
    {
      q: 'A @Configuration class defines two @Bean methods both returning Searchable (luceneIndex() and embeddingIndex()), and a third HybridSearchIndex constructor needs BOTH injected. Without @Qualifier, what happens at startup, and why is this the correct behavior?',
      a: 'Spring throws a NoUniqueBeanDefinitionException at startup — exactly spring-core-di\'s own material: two beans satisfying the same Searchable type with no disambiguation is genuinely ambiguous, and Spring fails loudly rather than guessing which one to inject into HybridSearchIndex\'s constructor parameters. This is correct, not a limitation to work around by removing one of the beans — HybridSearchIndex genuinely needs BOTH, by name, which is exactly what @Qualifier("luceneIndex")/@Qualifier("embeddingIndex") on each constructor parameter provides: an explicit, unambiguous mapping from each parameter to the specific bean it should receive, rather than leaving Spring to guess.'
    },
    {
      q: 'A test calls POST /ideas with no relatedPaperId field in the request body at all, and the endpoint returns 201 Created successfully. Trace precisely why this succeeds, connecting IdeaEntity\'s mapping, the database column, and the original design decision.',
      a: 'This succeeds because every layer in the chain was deliberately designed to allow it: capstone-design\'s schema declares related_paper_id as a NULLABLE foreign key (no NOT NULL constraint) specifically so an idea can exist before any paper does; IdeaEntity\'s @ManyToOne relatedPaper field has no @Column(nullable = false) or equivalent requiring it; and the request DTO\'s Bean Validation (spring-boot-rest-api\'s pattern) has no @NotNull on the corresponding field. A request omitting relatedPaperId entirely results in a null value flowing all the way through — the JPA entity is persisted with related_paper_id genuinely NULL in the database, exactly the CHECK-free, NOT-NULL-free column capstone-design specified, and the whole chain succeeds because every layer was consistently designed around the SAME "this is optional" decision, made once, at the schema level, and never contradicted by a stricter constraint added later at the entity or DTO layer.'
    },
    {
      q: 'A developer calls GET /ideas, then loops over the results calling idea.getRelatedPaper().getTitle() for every idea that has one. Diagnose the performance risk here precisely, and identify the specific fix.',
      a: 'This is jpa-hibernate\'s exact N+1 pattern, now manifesting on the new IdeaEntity: relatedPaper is mapped LAZY, so findAll() (or findByAuthorId) issues ONE query for the ideas themselves, and the FIRST access to getRelatedPaper() for EACH idea that has one triggers a SEPARATE query to fetch that specific paper — N ideas with a related paper produces up to N+1 total queries. The fix is exactly jpa-hibernate\'s JOIN FETCH pattern, applied to this specific repository method: @Query("SELECT i FROM IdeaEntity i LEFT JOIN FETCH i.relatedPaper WHERE i.author.id = :authorId") — LEFT JOIN FETCH specifically (not a plain JOIN FETCH) because relatedPaper is genuinely nullable, and a plain JOIN would silently EXCLUDE any idea with no related paper at all, exactly the INNER-vs-LEFT-JOIN distinction sql-postgresql built around.'
    }
  ],
  code: {
    title: 'Assembling LogPose\'s backend: migrations, IdeaEntity, and a hybrid-search bean wiring',
    intro: 'The genuinely new pieces this capstone build adds — everything else (PaperEntity, PaperController, LuceneIndex, EmbeddingSearchIndex) already exists unchanged from earlier lessons and is simply depended upon here.',
    code: `-- V4__create_ideas_and_projects.sql -- run AFTER V1 (authors/papers) and BEFORE V5 (embeddings)
CREATE TABLE projects (
    id         BIGSERIAL PRIMARY KEY,
    author_id  BIGINT NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
    name       TEXT NOT NULL,
    status     TEXT NOT NULL CHECK (status IN ('active','paused','completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ideas (
    id               BIGSERIAL PRIMARY KEY,
    author_id        BIGINT NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
    title            TEXT NOT NULL,
    body             TEXT NOT NULL,
    related_paper_id BIGINT REFERENCES papers(id) ON DELETE SET NULL,
    project_id       BIGINT REFERENCES projects(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT idea_title_not_blank CHECK (length(trim(title)) > 0)
);

CREATE INDEX idx_ideas_author_id ON ideas(author_id);


// IdeaEntity.java -- jpa-hibernate's exact pattern, applied to the new entity
@Entity
@Table(name = "ideas")
class IdeaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)   // EAGER default for @ManyToOne, matching PaperEntity.author
    @JoinColumn(name = "author_id")
    private AuthorEntity author;

    private String title;
    private String body;

    @ManyToOne(fetch = FetchType.LAZY)    // LAZY -- often null, rarely needed just to list ideas
    @JoinColumn(name = "related_paper_id")
    private PaperEntity relatedPaper;

    private Instant createdAt;
}

// IdeaRepository.java -- spring-data-security's exact pattern, zero implementation code
interface IdeaRepository extends JpaRepository<IdeaEntity, Long> {
    List<IdeaEntity> findByAuthorId(Long authorId);

    // JOIN FETCH avoids jpa-hibernate's N+1 pattern for the (often-null) relatedPaper relationship
    @Query("SELECT i FROM IdeaEntity i LEFT JOIN FETCH i.relatedPaper WHERE i.author.id = :authorId")
    List<IdeaEntity> findByAuthorIdWithRelatedPaper(@Param("authorId") Long authorId);
}


// SearchConfig.java -- composing LuceneIndex + EmbeddingSearchIndex behind one @Primary bean
@Configuration
class SearchConfig {

    @Bean
    @Qualifier("luceneIndex")
    Searchable luceneIndex() {
        return new LuceneIndex();
    }

    @Bean
    @Qualifier("embeddingIndex")
    Searchable embeddingIndex(DataSource dataSource, EmbeddingClient embeddingClient) {
        return new EmbeddingSearchIndex(dataSource, embeddingClient);
    }

    @Bean
    @Primary   // the default Searchable wherever no @Qualifier is specified
    Searchable hybridIndex(@Qualifier("luceneIndex") Searchable lucene,
                            @Qualifier("embeddingIndex") Searchable embedding) {
        return new HybridSearchIndex(lucene, embedding);
    }
}

// SearchController.java -- genuinely tiny, since all the real work already exists in HybridSearchIndex
@RestController
class SearchController {
    private final Searchable hybridIndex;   // the @Primary bean, injected automatically

    SearchController(Searchable hybridIndex) {
        this.hybridIndex = hybridIndex;
    }

    @GetMapping("/search")
    List<String> search(@RequestParam String q) {
        return hybridIndex.search(q);
    }
}`,
    notes: [
      'V4 runs after V1 (authors/papers already exist) and before V5 (embeddings) -- projects and ideas are created TOGETHER in one migration since ideas.project_id references projects within the same file.',
      'IdeaEntity.relatedPaper being LAZY, combined with findByAuthorIdWithRelatedPaper\'s LEFT JOIN FETCH, is the exact fix for the N+1 risk this lesson\'s own tech section walks through.',
      '@Qualifier on luceneIndex()/embeddingIndex() and @Primary on hybridIndex() together resolve exactly the three-Searchable-beans ambiguity spring-core-di\'s own material warned would otherwise fail loudly at startup.',
      'SearchController depends only on the Searchable INTERFACE, injected as whichever bean is @Primary -- it has no idea, and no need to know, that it\'s actually talking to a composed HybridSearchIndex underneath.'
    ]
  },
  lab: {
    title: 'Write ProjectController following IdeaController\'s exact pattern',
    prompt: 'Given <code>ProjectService</code> with methods <code>Project create(String name, String status, Long authorId)</code>, <code>Project getById(Long id)</code> (throwing <code>ProjectNotFoundException</code> if missing), and <code>List&lt;Project&gt; getAll()</code>, write <code>@RestController @RequestMapping("/projects") class ProjectController</code>, constructor-injected with <code>ProjectService</code>, with: (1) <code>@GetMapping</code> returning all projects; (2) <code>@GetMapping("/{id}")</code> returning one project by id; (3) <code>@PostMapping</code> taking <code>@Valid @RequestBody CreateProjectRequest request</code> (already defined, with <code>@NotBlank name</code> and <code>@NotBlank status</code>), returning <code>ResponseEntity.created(...)</code> with a <code>Location</code> of <code>/projects/{id}</code>.',
    starter: `import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.net.URI;
import java.util.List;

// TODO: @RestController @RequestMapping("/projects")
class ProjectController {
    private final ProjectService service;

    ProjectController(ProjectService service) {
        this.service = service;
    }

    // TODO: @GetMapping -- return service.getAll()

    // TODO: @GetMapping("/{id}") -- return service.getById(id)

    // TODO: @PostMapping -- create via service.create(...), return ResponseEntity.created(...).body(...)
}`,
    checks: [
      { re: '@RestController\\s*\\n@RequestMapping\\(\\s*"/projects"\\s*\\)', must: true, hint: 'Annotate the class @RestController @RequestMapping("/projects").', pass: '@RestController @RequestMapping("/projects") ✓' },
      { re: '@GetMapping\\s*\\n\\s*List<Project>\\s+getAll\\s*\\(\\s*\\)\\s*\\{\\s*return\\s+service\\.getAll\\(\\)', must: true, hint: 'Add a @GetMapping method returning service.getAll().', pass: 'getAll() endpoint correct ✓' },
      { re: '@GetMapping\\(\\s*"/\\{id\\}"\\s*\\)', must: true, hint: 'Add @GetMapping("/{id}") for a single project.', pass: '@GetMapping("/{id}") present ✓' },
      { re: '@PostMapping', must: true, hint: 'Add @PostMapping for creating a project.', pass: '@PostMapping present ✓' },
      { re: '@Valid\\s+@RequestBody\\s+CreateProjectRequest', must: true, hint: 'The create method\'s parameter must be @Valid @RequestBody CreateProjectRequest request.', pass: '@Valid @RequestBody used ✓' },
      { re: 'ResponseEntity\\.created\\(\\s*URI\\.create\\(\\s*"/projects/"\\s*\\+', must: true, hint: 'Return ResponseEntity.created(URI.create("/projects/" + created.id())).body(created).', pass: 'ResponseEntity.created(...) with correct Location ✓' }
    ],
    run: 'mvn spring-boot:run — GET /projects, GET /projects/{id}, and POST /projects should all behave identically in shape and status codes to PaperController\'s own endpoints.',
    solution: `import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/projects")
class ProjectController {
    private final ProjectService service;

    ProjectController(ProjectService service) {
        this.service = service;
    }

    @GetMapping
    List<Project> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    Project getOne(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    ResponseEntity<Project> create(@Valid @RequestBody CreateProjectRequest request) {
        Project created = service.create(request.name(), request.status(), request.authorId());
        return ResponseEntity.created(URI.create("/projects/" + created.id())).body(created);
    }
}`,
    notes: [
      'ProjectController is structurally identical to PaperController and IdeaController -- the whole point of this lab is confirming the pattern generalizes cleanly to a third resource with zero new design decisions needed.',
      'ProjectNotFoundException (thrown by getById) would need its own @ExceptionHandler in the shared ApiExceptionHandler, mapping to 404 -- following spring-boot-rest-api\'s exact @ControllerAdvice pattern, not shown here since it requires no new reasoning beyond what that lesson already established.'
    ]
  },
  quiz: [
    {
      q: 'Why must V1 (authors/papers) run before V4 (ideas/projects) in Flyway\'s migration order?',
      options: ['ideas.author_id and projects.author_id both reference authors(id) via foreign key -- the referenced table must already exist before a migration creating a table that references it can succeed', 'Flyway requires migrations to be numbered in alphabetical order of table name', 'This ordering is a stylistic convention with no actual technical requirement behind it', 'V4 could run before V1 with no issue, since foreign keys are only checked when data is inserted, never at table-creation time'],
      correct: 0,
      explain: 'A foreign key constraint requires the referenced table to already exist -- creating ideas/projects (which reference authors) before authors exists would fail immediately at the database level.'
    },
    {
      q: 'Without @Qualifier, what happens when SearchConfig defines two @Bean methods both returning Searchable, and HybridSearchIndex\'s constructor needs both?',
      options: ['Spring throws NoUniqueBeanDefinitionException at startup -- an intentional, correct failure rather than a silent guess about which bean to inject where', 'Spring silently injects the first-declared bean into both constructor parameters', 'Spring automatically merges both beans into a single combined implementation', 'The application starts normally with no issue, since HybridSearchIndex handles the ambiguity internally'],
      correct: 0,
      explain: 'Two beans satisfying the same type with no disambiguation is genuinely ambiguous -- Spring fails loudly at startup rather than guessing, exactly spring-core-di\'s own established behavior.'
    },
    {
      q: 'Why does IdeaEntity map relatedPaper as LAZY while author is mapped EAGER?',
      options: ['relatedPaper is often null and rarely needed just to display an idea in a list, while author is needed alongside virtually every idea -- matching the same size/necessity reasoning jpa-hibernate established for fetch-type defaults', 'LAZY and EAGER are chosen arbitrarily and have no real effect on behavior', 'JPA requires exactly one relationship per entity to be marked LAZY', 'relatedPaper must be LAZY because it is a nullable foreign key, and author must be EAGER because it is NOT NULL'],
      correct: 0,
      explain: 'The choice reflects genuine usage: author is virtually always needed alongside an idea (EAGER is cheap and convenient); relatedPaper is often absent and rarely needed for basic display (LAZY avoids unnecessary loading).'
    },
    {
      q: 'A repository method fetches ideas and then accesses idea.getRelatedPaper().getTitle() for each one in a loop. What is the risk, and what fixes it?',
      options: ['The classic N+1 problem -- one query for the ideas, plus one additional query per idea with a non-null related paper; a JOIN FETCH query (using LEFT JOIN FETCH specifically, since relatedPaper is nullable) fixes it', 'There is no risk at all, since relatedPaper is a simple foreign key rather than a collection', 'The fix is to make relatedPaper EAGER instead of LAZY, which has no other consequences', 'This can only be fixed by switching from JPA to raw JDBC entirely'],
      correct: 0,
      explain: 'This is exactly jpa-hibernate\'s N+1 pattern applied to a single (not collection) LAZY relationship -- accessing it in a loop triggers one query per non-null related paper. LEFT JOIN FETCH (not a plain JOIN FETCH, since the relationship is nullable) is the correct fix.'
    },
    {
      q: 'What is the concrete, checkable definition of "the backend is actually done" this lesson argues for, before starting client development?',
      options: ['A clean startup with all migrations applied, successful requests against every new and existing endpoint, and a /search query returning results including a semantically-related item sharing no literal words with the query', 'The code compiles successfully with no errors', 'Every class has at least one unit test written against it', 'The Maven build produces a JAR file without any warnings'],
      correct: 0,
      explain: 'Compiling and passing unit tests alone does not prove the ASSEMBLED system actually works end to end -- this lesson argues for concrete, running verification (real requests, real search results) as the actual bar for "done," avoiding the mock-lies-style false confidence this course has warned about throughout.'
    }
  ],
  testFlow: {
    title: 'Test yourself: migration order, bean disambiguation, and N+1 on the new entity',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A developer accidentally numbers the ideas/projects migration V1 and the authors/papers migration V2. What happens when Flyway runs against a fresh database?',
        choices: [
          { text: 'V1 (ideas/projects) runs first and fails immediately -- its foreign keys reference authors and papers, which do not exist yet since V2 hasn\'t run', to: 'q1_right' },
          { text: 'Flyway automatically detects the foreign-key dependency and reorders the migrations to run correctly regardless of their assigned version numbers', to: 'q1_wrong_autoreorder' },
          { text: 'Both migrations run successfully, since foreign keys are only validated when the first row is actually inserted, not at table-creation time', to: 'q1_wrong_delayed' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- Flyway runs strictly in version-number order, and a table\'s foreign key requires the referenced table to already exist. Assigning ideas/projects an earlier version number than authors/papers causes an immediate, real failure.', next: 'q2' },
      q1_wrong_autoreorder: { end: true, correct: false, text: 'Flyway has no such automatic reordering mechanism -- it strictly follows assigned version numbers, which is precisely why getting those numbers right, in genuine dependency order, is the developer\'s own responsibility.', retry: 'q1' },
      q1_wrong_delayed: { end: true, correct: false, text: 'PostgreSQL validates that a REFERENCES target table exists at the moment the CREATE TABLE statement itself runs, not deferred until data insertion -- this migration would fail immediately, before any row is ever inserted.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'HybridSearchIndex\'s constructor needs both a LuceneIndex-backed bean and an EmbeddingSearchIndex-backed bean, both typed as Searchable. What correctly resolves this without an ambiguity error?',
        choices: [
          { text: '@Qualifier on each @Bean method (or each constructor parameter) naming exactly which bean goes where', to: 'q2_right' },
          { text: 'Renaming one of the two implementing classes so they no longer share the same interface', to: 'q2_wrong_rename' },
          { text: 'Removing the Searchable interface entirely and having HybridSearchIndex depend on the concrete classes directly', to: 'q2_wrong_concrete' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- @Qualifier explicitly names which bean satisfies which injection point, resolving the ambiguity while keeping both beans genuinely typed as Searchable.', next: 'q3' },
      q2_wrong_rename: { end: true, correct: false, text: 'Renaming the classes has no bearing on Spring\'s bean resolution -- the ambiguity exists because both beans satisfy the SAME interface TYPE (Searchable), regardless of what their concrete classes happen to be named.', retry: 'q2' },
      q2_wrong_concrete: { end: true, correct: false, text: 'This would technically resolve the ambiguity but defeats the entire point of this course\'s interface-based design -- HybridSearchIndex depending on concrete types instead of Searchable would break the "swap implementations freely" promise this whole capstone relies on.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'Why does the fix for IdeaEntity\'s N+1 risk use LEFT JOIN FETCH rather than a plain JOIN FETCH?',
        choices: [
          { text: 'relatedPaper is nullable -- a plain JOIN FETCH would silently exclude any idea with no related paper at all, exactly the INNER-vs-LEFT-JOIN distinction sql-postgresql established', to: 'q3_right' },
          { text: 'LEFT JOIN FETCH is simply a stylistic preference with no functional difference from a plain JOIN FETCH in JPQL', to: 'q3_wrong_stylistic' },
          { text: 'JPQL does not support plain JOIN FETCH at all, only LEFT JOIN FETCH', to: 'q3_wrong_unsupported' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- since relatedPaper can genuinely be null, a plain (inner) JOIN FETCH would incorrectly drop every idea without one from the results entirely, exactly the same INNER-vs-LEFT distinction this course built around SQL joins.', next: null },
      q3_wrong_stylistic: { end: true, correct: false, text: 'This is a genuine functional difference, not a style choice -- a plain JOIN FETCH would silently exclude ideas with a null relatedPaper, which LEFT JOIN FETCH correctly includes.', retry: 'q3' },
      q3_wrong_unsupported: { end: true, correct: false, text: 'JPQL fully supports plain JOIN FETCH -- it is a valid, common construct, just the wrong choice specifically here because relatedPaper is nullable.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Assigning migration version numbers that don\'t match genuine foreign-key dependency order -- Flyway runs strictly by version number, and a table created before its FK target exists fails immediately.',
    'Letting logpose-core depend on logpose-search (or vice versa, incorrectly) -- the domain module should never need to know how it gets searched; get the module dependency direction backwards and the whole multi-module structure loses its point.',
    'Defining multiple beans of the same interface type with no @Qualifier/@Primary disambiguation -- produces a loud, correct startup failure, not a bug to silently work around by removing one of the beans.',
    'Mapping a genuinely optional relationship (relatedPaper, projectId) as EAGER or with a plain JOIN FETCH -- wastes effort loading something usually absent, or, worse, silently drops rows where it\'s legitimately null.',
    'Skipping end-to-end verification (real startup, real requests, a real search actually returning semantically-related results) and treating "it compiles" as equivalent to "the backend works" -- exactly the false-confidence risk this course has warned about since mockito-test-doubles.',
    'Starting client development before confirming the backend\'s new endpoints (ideas, projects, search) actually work as designed -- risks building against a response shape that doesn\'t match what the real, finished backend returns.'
  ],
  interview: [
    {
      q: 'Walk through, in order, exactly what would break if you deployed capstone-build-backend\'s migrations against a database that already had an OLDER version of the schema (missing the ideas/projects tables) applied.',
      a: 'Flyway checks its own flyway_schema_history table, sees which versions have already been applied, and runs ONLY the missing ones — if the older database already has V1 through V3 applied, Flyway correctly runs ONLY V4 (ideas/projects) and V5 (embeddings), skipping V1-V3 entirely since they\'re already done, bringing this specific database up to the same final state as a fresh one, deterministically. Nothing breaks here BECAUSE this is precisely the scenario Flyway\'s versioned-migration-history design exists to handle correctly — this is the exact "different starting points converge to the same final schema" guarantee jpa-hibernate\'s own Flyway material established.'
    },
    {
      q: 'A colleague suggests skipping the multi-module Maven structure entirely for the capstone, putting everything in one module "since it\'s just a personal project." Evaluate this against the capstone\'s own stated goals.',
      a: 'For a genuinely tiny, throwaway project, this simplification would be reasonable. But LogPose\'s explicit purpose is TEACHING full-stack Java patterns a real production codebase actually uses — and the module boundary (core has no dependency on search) is itself demonstrating a genuine architectural principle (domain code shouldn\'t know how it gets searched) that a single-module structure would hide entirely. Collapsing to one module trades away exactly the lesson this structure exists to teach, for a convenience that matters more at genuinely larger scale than LogPose\'s own capstone size actually needs — the multi-module structure here is deliberately instructive, not merely defensive engineering.'
    },
    {
      q: 'A reviewer asks why SearchController is so small compared to PaperController, given that search seems like the more complex feature. Explain precisely why this size difference is expected and correct.',
      a: 'PaperController still has some real logic worth naming in its own layer (validation flowing through to PaperService, exception mapping for duplicate DOIs) — but SearchController is smaller specifically because ALL of search\'s genuine complexity (tokenization, inverted indexes, embedding inference, vector similarity, merging and deduplicating two result sets) was already built, fully, in logpose-search\'s LuceneIndex/EmbeddingSearchIndex/HybridSearchIndex classes across two entire earlier lessons. SearchController\'s only remaining job is HTTP plumbing — extracting a query parameter, calling one interface method, returning the result — precisely because the actual hard work was correctly pushed down into a properly-designed service layer rather than living in the controller at all, exactly spring-boot-rest-api\'s own thin-controller argument, now demonstrated at its most extreme.'
    },
    {
      q: 'Design (in words) how you would add integration tests specifically verifying that Flyway\'s migrations apply correctly and in order, using this course\'s own Testcontainers material.',
      a: 'Following integration-testing\'s own pattern directly: a @Testcontainers-annotated test class with a @Container static PostgreSQLContainer, configured with Flyway pointed at the SAME migration directory the real application uses. A @Test would run Flyway.configure().dataSource(...).load().migrate() against the fresh container and assert the migration succeeds with no exception, then query information_schema.tables to confirm every expected table (authors, papers, tags, paper_tags, reviews, decisions, ideas, projects) actually exists, and separately assert that ideas.related_paper_id and ideas.project_id are genuinely nullable (querying information_schema.columns\' is_nullable) — directly verifying the schema DESIGN, not just that migrations ran without error. This is exactly the kind of test that would have caught session-32\'s own hypothetical V1/V4-ordering mistake immediately, in CI, before it ever reached a real environment.'
    }
  ]
};
