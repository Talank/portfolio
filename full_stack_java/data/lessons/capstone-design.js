window.LESSONS = window.LESSONS || {};
window.LESSONS['capstone-design'] = {
  id: 'capstone-design',
  title: 'LogPose, Designed: Requirements, Architecture, ERD, API Spec & Milestones',
  category: 'Part 14 — Capstone: LogPose',
  timeMin: 70,
  summary: 'This lesson builds nothing new. Every piece of LogPose — the schema, the REST API, the security model, three client technologies — was already designed and built, one decision at a time, across the last 40+ lessons. What this lesson does is stop and draw the WHOLE BLUEPRINT at once: the requirements LogPose actually serves, a complete ERD unifying the schema built in sql-postgresql/jdbc-transactions/jpa-hibernate, the full API surface built in spring-boot-rest-api/spring-data-security, the three-client architecture (web, JavaFX desktop, Gluon iOS) built in Parts 10-12, and — because LogPose is a research-log manager, not just a paper database — one genuinely NEW piece: unifying the Backlog/Idea concept from Part 1 with the persisted schema into a real ideas table. Then a concrete, ordered build plan for the next two lessons.',
  goals: [
    'Write a small set of concrete user stories that define what LogPose must actually do, distinguishing must-have capstone scope from nice-to-have future scope',
    'Draw (describe) a complete ERD unifying every table this course has built across Part 8, including a new ideas table connecting Part 1\'s Backlog/Idea concept to real persistence',
    'Produce a consolidated API surface listing every REST endpoint this course has built, organized by resource, with its method and status codes',
    'Explain why LogPose\'s three planned clients (web, JavaFX desktop, Gluon iOS) all depend on exactly one stateless REST API rather than three separate backends',
    'Sequence a concrete, dependency-ordered build plan for capstone-build-backend and capstone-build-clients, justifying why each step must come before the next'
  ],
  concept: [
    {
      h: 'Requirements: what LogPose must actually do',
      p: [
        'LogPose\'s premise, stated back in this course\'s very first lesson, is a RESEARCH-LOG MANAGER: a place to capture paper reviews, writing, ideas, experiments, mentoring notes, and ongoing projects, with search that understands MEANING ("what ideas did I have about flaky tests?"), not just literal keywords. Distilled into concrete user stories, the CAPSTONE-SCOPE requirements this course has actually built toward are: a researcher can (1) record a PAPER with its author, DOI, and tags; (2) submit REVIEWS and editorial DECISIONS against a paper; (3) capture a free-standing IDEA — a thought not yet attached to any specific paper, exactly Part 1\'s original Backlog concept; (4) search across papers and ideas by keyword AND by meaning, getting back results even when the query shares no literal words with a genuinely relevant entry; and (5) do all of this from a WEB browser, a MAC DESKTOP app, or an IPHONE, with the same underlying data, updated consistently regardless of which client is used.',
        'Explicitly OUT of capstone scope, worth naming so the next two lessons don\'t scope-creep: multi-tenant support (one researcher\'s LogPose, not a hosted service for many), a mobile ANDROID client (this course\'s stated scope has been Mac/iOS via Gluon from how-java-fits-together onward, deliberately not Android), and real-time collaborative editing (LogPose is a personal research log, not a shared document). A capstone with unlimited scope never ships — these two boundaries (personal-use only, Mac/iOS not Android) are what make the next two lessons\' build plan actually finishable.'
      ]
    },
    {
      h: 'The complete ERD: unifying every table this course has built, plus a new ideas table',
      p: [
        'sql-postgresql built <code>authors</code>, <code>papers</code> (FK to authors), <code>tags</code>, <code>paper_tags</code> (the many-to-many join table); jdbc-transactions added <code>decisions</code> (FK to papers); the reviews table (FK to papers, CHECK score BETWEEN 1 AND 5) appeared across integration-testing/jdbc-transactions. Every one of these already exists, unchanged, as the persisted foundation. What LogPose is still missing, precisely because Part 1\'s Backlog/Idea concept was always an IN-MEMORY sketch, never given real persistence: an <code>ideas</code> table. The design decision, made explicit here rather than left implicit: <code>ideas(id, author_id REFERENCES authors(id), title, body, related_paper_id REFERENCES papers(id) NULL, created_at TIMESTAMPTZ)</code> — <code>related_paper_id</code> is NULLABLE and deliberately so, since Part 1\'s whole premise was capturing an idea BEFORE it necessarily connects to any specific paper (a raw thought about flaky tests, with no paper written about it yet) — forcing a NOT NULL foreign key here would make LogPose unable to record exactly the kind of early-stage idea its own capstone premise is built around.',
        'The complete ERD, described: <code>authors</code> is the hub, referenced by BOTH <code>papers</code> and (the new) <code>ideas</code> — one author can write many papers AND record many ideas, independently. <code>papers</code> is referenced by <code>reviews</code>, <code>decisions</code>, <code>paper_tags</code> (which itself references <code>tags</code>), and now optionally by <code>ideas</code> (an idea that eventually becomes a paper). This is a genuinely satisfying convergence: every foreign-key relationship, every CHECK constraint, every ON DELETE behavior in this ERD was a DELIBERATE decision this course already made and justified in an earlier lesson — this lesson\'s job is presenting them as ONE coherent picture rather than re-deriving any of it.'
      ]
    },
    {
      h: 'The complete API surface: every endpoint this course has already built',
      p: [
        'Consolidated directly from spring-boot-rest-api and spring-data-security, organized by resource: <code>GET/POST /papers</code>, <code>GET/DELETE /papers/{id}</code> (PaperController); <code>POST /papers/{paperId}/reviews</code> (ReviewController, with <code>@Valid</code> score validation); <code>DELETE /authors/{id}</code> (<code>@PreAuthorize("hasRole(\'EDITOR\')")</code>, AuthorController); <code>POST /decisions</code> (<code>@PreAuthorize("hasRole(\'EDITOR\')")</code>, DecisionController). What LogPose\'s capstone build still needs, following the EXACT same pattern every existing controller already established: <code>GET/POST /ideas</code>, <code>GET/DELETE /ideas/{id}</code> (a straightforward IdeaController, thin, delegating to an IdeaService, exactly PaperController\'s shape) and a SEARCH endpoint — <code>GET /search?q=...</code> — backed by embeddings-semantic-search-java\'s HybridSearchIndex, returning matches across BOTH papers and ideas.',
        'Every endpoint, existing or new, follows the SAME status-code contract http-rest-json designed and spring-boot-rest-api implemented: 201+Location for a successful POST, 204 for a successful DELETE, 400 for a Bean-Validation failure, 409 for a conflict (a duplicate DOI), 404 for a missing resource, 403 for an authenticated-but-unauthorized caller. Naming this explicitly matters for the build plan: the new IdeaController and search endpoint are NOT new design work at all — they are the SAME pattern, applied to a new resource, which is precisely why the next lesson\'s build order (below) can move quickly through them.'
      ]
    },
    {
      h: 'Three clients, one API: why LogPose never builds three backends',
      p: [
        'LogPose\'s web client (web-frontend-basics\' fetch()-based page, or a Thymeleaf/React/Vaadin choice per frontend-choices), JavaFX desktop client (javafx-desktop\'s PapersController/PaperRow), and Gluon iOS client (gluon-mobile-graalvm\'s AOT-compiled reuse of that SAME JavaFX code) all call the EXACT SAME stateless REST API — this is not a coincidence, it is the DIRECT PAYOFF of building the backend API-FIRST from spring-boot-rest-api onward, precisely as frontend-choices argued explicitly: a genuine REST/JSON API is client-technology-agnostic, callable identically by a browser\'s fetch(), a JavaFX HTTP client, or the identical JavaFX code cross-compiled for iOS. Building three SEPARATE backends — one per client — would have meant triplicating every validation rule, every persistence decision, every security check, with three independent chances to drift out of sync; one shared API, three thin clients, is the ENTIRE architectural payoff of everything Parts 9-12 built.',
        'This also explains precisely why Vaadin (frontend-choices\' third option) was presented as a genuine ALTERNATIVE architecture rather than something layered on top of THIS particular design: Vaadin\'s stateful, browser-coupled model has no natural path for a JavaFX desktop client or a Gluon iOS client to consume it at all — LogPose\'s actual, chosen architecture (a stateless REST API, with web/desktop/mobile clients calling it) is specifically the one frontend-choices argued fits a genuinely MULTI-CLIENT capstone, and Vaadin was named specifically as the choice that would NOT have supported this.'
      ]
    },
    {
      h: 'The build plan: a dependency-ordered sequence for the next two lessons',
      p: [
        'capstone-build-backend (next lesson) must proceed in DEPENDENCY ORDER, each step requiring the previous: (1) a genuine multi-module Maven build (maven-multi-module\'s parent-POM pattern: a shared <code>logpose-core</code> module, plus module boundaries mirroring this course\'s own Part divisions); (2) Flyway migrations (jpa-hibernate\'s own argument against ddl-auto) creating EVERY table from this lesson\'s ERD, including the new <code>ideas</code> table, in one properly-ordered migration sequence; (3) JPA entities (jpa-hibernate\'s @Entity/@ManyToOne/@OneToMany pattern) mapping that schema, including a NEW <code>IdeaEntity</code>; (4) Spring Data repositories (spring-data-security\'s JpaRepository pattern) for the new entity; (5) the IdeaService/IdeaController pair (spring-boot-rest-api\'s thin-controller pattern), plus the search endpoint wrapping embeddings-semantic-search-java\'s HybridSearchIndex; (6) Spring Security wiring (spring-data-security\'s @PreAuthorize pattern) protecting exactly the endpoints that need it.',
        'capstone-build-clients (the lesson after) then depends ENTIRELY on step (5) already existing and working: the web client\'s fetch() calls, the JavaFX desktop client\'s PaperClient, and the Gluon iOS build all require a REAL, RUNNING API to call — building any client before the backend is functional would mean building against endpoints that don\'t exist yet, backwards from every dependency this course has actually established. This ordering — backend fully functional FIRST, then clients built and tested against it — is itself the single most important, and most easily gotten backwards, decision in the entire capstone build.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky unrolls the full ship blueprint: every deck named, every signal listed, before a single plank is cut',
      text: 'Before the Sunny\'s next major refit begins, Franky does something the crew has learned to respect completely: he stops all construction and unrolls ONE complete blueprint, showing EVERY deck, EVERY room, and EXACTLY how they connect — not because he doesn\'t already know each individual piece (he built every one of them himself, across dozens of separate jobs) but because the crew is about to build something bigger than any single piece, and everyone needs to see the WHOLE ship at once before a single new plank gets cut. The blueprint shows the crew quarters connected to the galley, the galley connected to the cargo hold, the cargo hold connected to the new wing Franky\'s adding for the crew\'s growing collection of logs and sketches — a complete map of what connects to what (the ERD, unifying every table this course has built). Alongside the blueprint, Franky posts ONE master signal board — every single Den Den Mushi call the ship can receive and correctly answer, organized by which part of the ship handles it, with the SAME response protocol for every single one (the API surface, following one consistent status-code contract across every endpoint). And here is the deepest reason Franky insists on ONE blueprint rather than three: the crew is about to reach this ship from THREE completely different directions — by boarding directly, by a small skiff, and eventually by an entirely different vessel docking alongside — and NONE of them should require Franky to have built three DIFFERENT ships with three different internal layouts; one ship, one blueprint, reachable identically from every direction (three clients, one API). Only once every deck is named, every signal listed, and the crew agrees on the exact ORDER construction must happen in — foundation first, then walls, then the signal system, only then the crew quarters people will actually live in — does Franky pick up the first tool.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon unrolls the complete apartment renovation plan: every room named, every request procedure listed, before a single wall comes down',
      text: 'Before Sheldon and Leonard\'s apartment undergoes its next major renovation, Sheldon does something the group has learned to expect completely: he stops all discussion of individual changes and unrolls ONE complete plan, showing EVERY room, EVERY piece of furniture, and EXACTLY how they relate — not because he doesn\'t already know each individual decision (he made every one of them himself, across dozens of separate conversations) but because the group is about to change something bigger than any single room, and everyone needs to see the WHOLE apartment at once before a single wall comes down. The plan shows the living room connected to the kitchen, the kitchen connected to the hallway, the hallway connected to the new home-office nook Sheldon\'s adding for his own growing collection of notes and research (the ERD, unifying every table this course has built). Alongside the plan, Sheldon posts ONE master house-rules addendum — every single request the apartment\'s systems (the thermostat, the shared calendar, the whiteboard) can receive and correctly respond to, organized by which system handles it, with the SAME response protocol for every single one (the API surface, following one consistent contract across every endpoint). And here is the deepest reason Sheldon insists on ONE plan rather than three: the group is about to access this apartment from THREE completely different situations — from the living room itself, from a laptop while away, and eventually from a phone on the go — and NONE of them should require Sheldon to have designed three DIFFERENT apartments with three different internal rules; one apartment, one plan, reachable identically from every situation (three clients, one API). Only once every room is named, every request procedure listed, and the group agrees on the exact ORDER changes must happen in — structural work first, then wiring, then the rules system, only then the furniture people will actually use — does Sheldon allow the first change to actually begin.',
    },
    why: 'Franky\'s / Sheldon\'s single, complete blueprint/plan — showing every room/deck and how they connect, drawn BEFORE construction begins despite every individual piece already being known — is exactly what an ERD is: not new design work, but ONE coherent picture of every relationship this course already built, one lesson at a time. The master signal board / house-rules addendum, one consistent response protocol for every single request, is the API surface\'s consistent status-code contract. And the insistence on reaching the SAME ship/apartment from three different directions/situations without three different internal designs is precisely why LogPose\'s three clients share exactly one stateless API rather than three separate backends. The agreed construction ORDER — foundation before walls, walls before signals, signals before anyone actually lives there — is this lesson\'s dependency-ordered build plan for the next two lessons.'
  },
  storyAnim: {
    title: 'One blueprint unrolled, one signal board posted, reachable from three directions, in one agreed order',
    h: 340,
    props: [
      { id: 'blueprint', emoji: '📐', label: 'ONE complete blueprint -- every deck named, every connection shown (the ERD)', x: 6, y: 8 },
      { id: 'signalboard', emoji: '📋', label: 'ONE master signal board -- every request, one consistent response protocol (the API surface)', x: 30, y: 8 },
      { id: 'threeways', emoji: '🚪', label: 'reachable from THREE directions -- boarding, skiff, another vessel -- same ship underneath (3 clients, 1 API)', x: 54, y: 8 },
      { id: 'wrongorder', emoji: '❌', label: 'building the crew quarters before the foundation exists (backwards build order)', x: 78, y: 8 },
      { id: 'rightorder', emoji: '✅', label: 'foundation, then walls, then signals, THEN the rooms people actually use (the agreed build plan)', x: 40, y: 50 }
    ],
    actors: [
      { id: 'franky', emoji: '🛠️', label: 'Franky', x: 20, y: 78 },
      { id: 'crew', emoji: '⚓', label: 'crew', x: 65, y: 78 }
    ],
    steps: [
      { c: 'Franky unrolls ONE complete blueprint -- every deck named, every connection shown at once.', p: { blueprint: 'lit' }, a: { franky: [20, 30] } },
      { c: 'Alongside it, one master signal board lists every request the ship can answer, all following the same protocol.', p: { signalboard: 'lit' } },
      { c: 'The crew needs to reach this SAME ship from three completely different directions -- with no need for three different internal designs.', p: { threeways: 'good' }, a: { crew: [54, 60] } },
      { c: 'Building the crew quarters before the foundation even exists would collapse the whole plan.', p: { wrongorder: 'bad' } },
      { c: 'The agreed order -- foundation, then walls, then signals, only then the rooms people actually live in -- is what the crew commits to before cutting a single plank.', p: { rightorder: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'From requirements to the ERD, the API surface, the three-client architecture, and the build order',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Requirements',
        nodes: [
          { id: 'instories', text: 'capstone-scope user stories:\npapers, reviews, ideas, hybrid search, 3 clients' },
          { id: 'outofscope', text: 'explicitly OUT of scope:\nmulti-tenant, Android, real-time collab' }
        ]
      },
      {
        label: 'The ERD',
        nodes: [
          { id: 'existingschema', text: 'existing schema: authors, papers,\ntags, paper_tags, reviews, decisions' },
          { id: 'newideas', text: 'NEW: ideas table --\nrelated_paper_id nullable, on purpose' }
        ]
      },
      {
        label: 'The API surface',
        nodes: [
          { id: 'existingapi', text: 'existing endpoints: PaperController,\nReviewController, AuthorController, DecisionController' },
          { id: 'newapi', text: 'NEW: IdeaController + /search --\nSAME status-code contract throughout' }
        ]
      },
      {
        label: 'Architecture & order',
        nodes: [
          { id: 'oneapi', text: 'one stateless API,\nthree thin clients' },
          { id: 'buildorder', text: 'backend fully functional FIRST,\nthen clients built against it' }
        ]
      }
    ],
    steps: [
      { active: ['instories'], note: 'LogPose\'s capstone-scope user stories: papers, reviews/decisions, free-standing ideas, hybrid keyword+semantic search, and three clients sharing one data store.' },
      { active: ['outofscope'], note: 'Deliberately excluded scope keeps the build finishable: no multi-tenancy, no Android client, no real-time collaboration.' },
      { active: ['existingschema'], note: 'authors, papers, tags, paper_tags, reviews, and decisions were all already designed and built across Part 8.' },
      { active: ['newideas'], note: 'The new ideas table unifies Part 1\'s in-memory Backlog concept with real persistence, with a nullable related_paper_id by deliberate design.' },
      { active: ['existingapi'], note: 'PaperController, ReviewController, AuthorController, and DecisionController were all already built across Part 9.' },
      { active: ['newapi'], note: 'A new IdeaController and a /search endpoint follow the exact same pattern and status-code contract every existing endpoint already established.' },
      { active: ['oneapi'], note: 'Web, JavaFX desktop, and Gluon iOS clients all call the same stateless API -- the direct payoff of building API-first since Part 9.' },
      { active: ['buildorder'], note: 'The backend must be fully functional before any client is built against it -- the single most important sequencing decision in the capstone build.' }
    ]
  },
  tech: [
    {
      q: 'Why is ideas.related_paper_id designed as a NULLABLE foreign key rather than NOT NULL, and what concrete LogPose use case would break if it were made required?',
      a: 'Making related_paper_id NOT NULL would mean every single idea MUST be attached to an already-existing paper at the moment it\'s recorded — but LogPose\'s own capstone premise, stated since Part 1, is capturing an idea BEFORE it necessarily has anything to do with a specific paper at all: a researcher jotting down "flaky tests might correlate with test execution order" as a raw thought, with no paper written about it yet, and possibly never becoming one. Making the foreign key required would make it structurally IMPOSSIBLE to record exactly this — the most basic, earliest-stage use case an idea-capture feature exists for — forcing a researcher to either invent a placeholder paper just to satisfy the constraint (a corrupting workaround, per sql-postgresql\'s own anomaly-avoidance argument) or abandon recording the idea until a paper exists, defeating the entire feature\'s purpose. NULL specifically, and correctly, represents "not yet connected to any paper" as a genuine, valid, expected state — the exact same nullable-foreign-key judgment call sql-postgresql\'s own design-question material walked through for a similar decisions-table scenario.'
    },
    {
      q: 'Explain precisely why capstone-build-clients cannot reasonably begin before capstone-build-backend is complete, tracing the dependency to a concrete example from javafx-desktop or web-frontend-basics.',
      a: 'Every client this course built — web-frontend-basics\' fetch() calls, javafx-desktop\'s PaperClient, gluon-mobile-graalvm\'s cross-compiled reuse of that same client — works by making REAL HTTP requests against REAL, RUNNING endpoints (GET /papers, POST /papers, and similar) and parsing REAL JSON responses shaped exactly like PaperDto/AuthorDto. If the IdeaController and /search endpoint this lesson\'s build plan calls for don\'t exist yet, a client attempting to build a "browse ideas" screen has NO real endpoint to call at all — it would need to either mock/stub a response shape that might not even match what the real backend eventually returns (risking exactly the kind of mismatch mockito-test-doubles\' "mock lies" material warned about), or simply be unable to build and test that screen at all until the real endpoint exists. Building the backend first, fully, and THEN building clients against it, means every client screen can be built and tested against genuine, real API responses from the very start — never guessing at a shape that hasn\'t been finalized yet.'
    },
    {
      q: 'A reviewer suggests LogPose should expose separate /web-api, /desktop-api, and /mobile-api endpoint groups, each tailored to its specific client\'s needs. Evaluate this against LogPose\'s actual, chosen architecture.',
      a: 'This proposal directly contradicts the entire architectural payoff this lesson\'s "three clients, one API" section names explicitly: LogPose\'s whole design was built, deliberately, API-FIRST and client-agnostic, precisely so ONE set of endpoints serves every client identically — introducing THREE parallel endpoint groups reintroduces exactly the triplicated-validation, triplicated-security-check, drift-prone-duplication risk building one shared API was specifically meant to avoid. If a genuine, PLATFORM-SPECIFIC need actually emerged (a mobile-optimized response shape returning less data over a slower connection, say), the correct fix is a query parameter or a content-negotiation mechanism on the SAME shared endpoints, not entirely separate endpoint groups — preserving one shared business-logic/security path while still accommodating a genuine platform difference.'
    },
    {
      q: 'Why does this lesson insist that the ERD, API surface, and build plan are presented here as a SYNTHESIS of prior decisions rather than new design work — what would be lost if a student skipped every prior lesson and read only this one?',
      a: 'Every decision in this lesson — why related_paper_id is nullable, why reviews has a CHECK constraint, why DecisionController requires the EDITOR role, why the API follows a specific status-code contract — was originally made with a full, reasoned JUSTIFICATION in an earlier lesson (sql-postgresql\'s anomaly-avoidance argument, jdbc-transactions\' ACID material, spring-data-security\'s authorization material, http-rest-json\'s status-code design). A student reading ONLY this lesson would see the FINAL shape of every decision but would completely miss WHY each one is shaped that way — precisely the same "understand the mechanism, not just the API surface" instinct this course has argued for throughout (Lucene\'s BM25 versus hand-derived TF-IDF, Spring\'s IoC container versus hand-wired dependencies). This lesson is a MAP of decisions already justified elsewhere, not a substitute for the reasoning behind them.'
    }
  ],
  code: {
    title: 'LogPose\'s complete, consolidated schema: every existing table, plus the new ideas table',
    intro: 'The full ERD, expressed as one consolidated set of CREATE TABLE statements — every table this course built across sql-postgresql/jdbc-transactions, unchanged, plus the new ideas table unifying Part 1\'s Backlog/Idea concept with real persistence.',
    code: `-- authors: the hub -- referenced by papers AND (new) ideas
CREATE TABLE authors (
    id    BIGSERIAL PRIMARY KEY,
    name  TEXT NOT NULL,
    email TEXT UNIQUE
);

-- papers: unchanged from sql-postgresql
CREATE TABLE papers (
    id            BIGSERIAL PRIMARY KEY,
    title         TEXT NOT NULL,
    author_id     BIGINT NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
    published_on  DATE,
    doi           TEXT UNIQUE,
    CONSTRAINT title_not_blank CHECK (length(trim(title)) > 0)
);

CREATE INDEX idx_papers_author_id ON papers(author_id);

-- tags + paper_tags: unchanged from sql-postgresql, the many-to-many join
CREATE TABLE tags (
    id   BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE paper_tags (
    paper_id BIGINT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    tag_id   BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (paper_id, tag_id)
);

-- reviews: unchanged from integration-testing/jdbc-transactions
CREATE TABLE reviews (
    id         BIGSERIAL PRIMARY KEY,
    paper_id   BIGINT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    reviewer   TEXT NOT NULL,
    score      INTEGER CHECK (score BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_paper_id ON reviews(paper_id);

-- decisions: unchanged from jdbc-transactions
CREATE TABLE decisions (
    id         BIGSERIAL PRIMARY KEY,
    paper_id   BIGINT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    editor     TEXT NOT NULL,
    decision   TEXT NOT NULL CHECK (decision IN ('accept','reject')),
    decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NEW: ideas -- unifying Part 1's in-memory Backlog/Idea concept with real persistence.
-- related_paper_id is NULLABLE, deliberately: an idea may exist long before any paper does.
CREATE TABLE ideas (
    id               BIGSERIAL PRIMARY KEY,
    author_id        BIGINT NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
    title            TEXT NOT NULL,
    body             TEXT NOT NULL,
    related_paper_id BIGINT REFERENCES papers(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT idea_title_not_blank CHECK (length(trim(title)) > 0)
);

CREATE INDEX idx_ideas_author_id ON ideas(author_id);

-- embeddings-semantic-search-java's pgvector column, added to BOTH searchable tables
ALTER TABLE papers ADD COLUMN embedding VECTOR(384);
ALTER TABLE ideas   ADD COLUMN embedding VECTOR(384);
CREATE INDEX ON papers USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON ideas   USING ivfflat (embedding vector_cosine_ops);`,
    notes: [
      'related_paper_id uses ON DELETE SET NULL, deliberately DIFFERENT from papers.author_id\'s ON DELETE RESTRICT -- deleting a paper that inspired an idea should not delete or block-deleting the idea itself; it should simply disconnect it, reverting to "not yet connected to any paper."',
      'Both papers and ideas get their own embedding column and their own ivfflat index -- HybridSearchIndex (embeddings-semantic-search-java) needs to search across BOTH resource types for a unified "what did I write or think about flaky tests" search.',
      'Every table above except ideas (and the two embedding columns/indexes) is copy-pasted, completely unchanged, from earlier lessons -- this file IS the consolidation this lesson\'s whole concept section describes, not new design work.'
    ]
  },
  lab: {
    title: 'Extend the ERD: add a projects table connecting ideas to ongoing work',
    prompt: 'LogPose\'s stated scope includes tracking "ongoing projects," not just papers and ideas. Write a <code>CREATE TABLE projects</code> statement: <code>id BIGSERIAL PRIMARY KEY</code>, <code>author_id BIGINT NOT NULL REFERENCES authors(id) ON DELETE RESTRICT</code>, <code>name TEXT NOT NULL</code>, <code>status TEXT NOT NULL CHECK (status IN (\'active\',\'paused\',\'completed\'))</code>, <code>created_at TIMESTAMPTZ NOT NULL DEFAULT now()</code>. Then write <code>ALTER TABLE ideas ADD COLUMN project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL;</code> — nullable, for the same reason <code>related_paper_id</code> is nullable: an idea may exist before it\'s attached to any specific project.',
    starter: `-- TODO 1: CREATE TABLE projects with the columns described above

-- TODO 2: ALTER TABLE ideas to add a nullable project_id foreign key
`,
    checks: [
      { re: 'CREATE TABLE\\s+projects', must: true, hint: 'Declare CREATE TABLE projects (...).', pass: 'projects table declared ✓' },
      { re: 'author_id\\s+BIGINT\\s+NOT\\s+NULL\\s+REFERENCES\\s+authors\\s*\\(\\s*id\\s*\\)\\s+ON\\s+DELETE\\s+RESTRICT', must: true, hint: 'author_id must be BIGINT NOT NULL REFERENCES authors(id) ON DELETE RESTRICT.', pass: 'author_id foreign key correct ✓' },
      { re: "CHECK\\s*\\(\\s*status\\s+IN\\s*\\(\\s*'active'\\s*,\\s*'paused'\\s*,\\s*'completed'\\s*\\)\\s*\\)", must: true, hint: "Add CHECK (status IN ('active','paused','completed')) on the status column.", pass: 'status CHECK constraint ✓' },
      { re: 'ALTER\\s+TABLE\\s+ideas\\s+ADD\\s+COLUMN\\s+project_id\\s+BIGINT\\s+REFERENCES\\s+projects\\s*\\(\\s*id\\s*\\)\\s+ON\\s+DELETE\\s+SET\\s+NULL', must: true, hint: 'Add ALTER TABLE ideas ADD COLUMN project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL.', pass: 'ideas.project_id column added ✓' }
    ],
    run: 'psql -f this_file.sql — against LogPose\'s consolidated schema, this creates the projects table and correctly, nullably connects existing ideas to a project without requiring every idea to already have one.',
    solution: `CREATE TABLE projects (
    id         BIGSERIAL PRIMARY KEY,
    author_id  BIGINT NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
    name       TEXT NOT NULL,
    status     TEXT NOT NULL CHECK (status IN ('active','paused','completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ideas ADD COLUMN project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL;`,
    notes: [
      'project_id is nullable for exactly the same reason related_paper_id is: an idea can exist, and often does, well before it\'s attached to any specific ongoing project.',
      'ON DELETE SET NULL (not CASCADE or RESTRICT) means completing or deleting a project never deletes or blocks-deleting the ideas that were once attached to it -- it simply disconnects them.',
      'This exercise is deliberately structured identically to how related_paper_id was added -- once the pattern is understood for one nullable, optional relationship, extending the ERD with another follows the same reasoning directly.'
    ]
  },
  quiz: [
    {
      q: 'Why is this lesson described as "synthesis" rather than new Java teaching?',
      options: ['Every architectural decision it presents (the schema, the API contract, the client architecture) was already designed and justified in an earlier lesson -- this lesson consolidates them into one coherent picture rather than introducing new concepts', 'It is not actually different from any other lesson in the course', 'It intentionally omits the schema and API details covered in earlier lessons', 'It replaces the need to have read any of the previous 40+ lessons'],
      correct: 0,
      explain: 'Every piece of LogPose\'s design shown here -- the ERD, the endpoints, the client architecture -- was individually designed and justified across many earlier lessons. This lesson\'s job is presenting them as one unified blueprint before the actual capstone build begins.'
    },
    {
      q: 'Why is ideas.related_paper_id designed as a nullable foreign key rather than NOT NULL?',
      options: ['LogPose\'s own premise is capturing an idea before it necessarily connects to any specific paper -- a NOT NULL constraint would make it structurally impossible to record exactly this common, expected case', 'Nullable foreign keys are always preferred over NOT NULL ones as a general PostgreSQL best practice', 'PostgreSQL does not support NOT NULL foreign keys referencing another table', 'It was a mistake that should be corrected in a future migration'],
      correct: 0,
      explain: 'An idea genuinely can and does exist before being connected to any specific paper -- making the foreign key required would prevent recording exactly this early-stage use case, which is central to LogPose\'s own stated purpose.'
    },
    {
      q: 'Why do LogPose\'s three planned clients (web, JavaFX desktop, Gluon iOS) all call exactly one shared REST API rather than three separate, client-specific backends?',
      options: ['Building the backend API-first, stateless, and client-agnostic means validation, security, and business logic are written and maintained exactly once -- three separate backends would triplicate that logic with three independent chances to drift out of sync', 'Building three separate backends is technically impossible in Java', 'A shared API is required by Spring Boot and cannot be avoided', 'The three clients actually use three different APIs already, contrary to how this lesson describes it'],
      correct: 0,
      explain: 'One shared, stateless API avoids triplicating validation, security, and business logic across three separate backends -- exactly the payoff of building API-first since spring-boot-rest-api, and precisely why frontend-choices flagged Vaadin as a poor fit for this specific multi-client architecture.'
    },
    {
      q: 'Why must capstone-build-backend be fully complete before capstone-build-clients reasonably begins?',
      options: ['Every planned client makes real HTTP requests against real endpoints and parses real response shapes -- building a client before the backend exists means guessing at shapes that might not match what\'s eventually built, risking the same "mock lies" gap mockito-test-doubles warned about', 'Client code and backend code must be written by the same person, so order does not actually matter', 'JavaFX and Gluon specifically require a backend to already exist before their build tools can even be installed', 'This ordering is a stylistic preference with no real technical justification'],
      correct: 0,
      explain: 'Clients depend on real, working endpoints to build and test against -- attempting to build a client before the backend exists means working against guessed, possibly-wrong response shapes, exactly the false-confidence risk mock-based testing without real integration testing creates.'
    },
    {
      q: 'What is explicitly OUT of LogPose\'s capstone scope, and why does defining this boundary matter?',
      options: ['Multi-tenant hosting, an Android client, and real-time collaborative editing -- naming these boundaries explicitly is what keeps the build plan for the next two lessons actually finishable, rather than open-ended', 'Nothing is out of scope -- LogPose\'s capstone is designed to eventually support every conceivable feature', 'Search functionality is out of scope and will not be included in the capstone at all', 'The web client is out of scope, since only the desktop and mobile clients are part of the actual capstone'],
      correct: 0,
      explain: 'A capstone with unlimited scope never ships. Explicitly excluding multi-tenancy, Android, and real-time collaboration (consistent with this course\'s stated scope since how-java-fits-together) keeps the next two lessons\' build plan concrete and achievable.'
    }
  ],
  testFlow: {
    title: 'Test yourself: the ERD, the API contract, and the build order',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A reviewer proposes making ideas.related_paper_id NOT NULL "to keep the data clean." What would break?',
        choices: [
          { text: 'A researcher could no longer record a raw, early-stage idea that has no associated paper yet -- exactly the core, earliest-stage use case LogPose\'s idea-capture feature exists for', to: 'q1_right' },
          { text: 'Nothing would break -- every idea in a well-run LogPose deployment should always have an associated paper from the moment it\'s created', to: 'q1_wrong_nothing' },
          { text: 'The papers table itself would need to be deleted and recreated', to: 'q1_wrong_papersdelete' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- this is precisely the anomaly this lesson\'s design decision avoids: an idea genuinely can and should be recordable before any paper exists to attach it to.', next: 'q2' },
      q1_wrong_nothing: { end: true, correct: false, text: 'This assumes every idea starts already connected to a paper, which contradicts LogPose\'s own stated premise -- capturing an idea BEFORE it becomes a paper is exactly the core use case this feature exists for.', retry: 'q1' },
      q1_wrong_papersdelete: { end: true, correct: false, text: 'Making a column NOT NULL has no bearing on the papers table\'s own structure at all -- it only affects whether an ideas row can be inserted without an associated paper.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A team proposes building separate /web-api and /mobile-api endpoint groups so each client gets endpoints "tailored to its needs." What does LogPose\'s actual architecture argue against this?',
        choices: [
          { text: 'It reintroduces exactly the triplicated-validation, triplicated-security-check risk building one shared, client-agnostic API was specifically designed to eliminate', to: 'q2_right' },
          { text: 'Separate endpoint groups per client is actually how LogPose\'s API is currently built, so this proposal changes nothing', to: 'q2_wrong_alreadydone' },
          { text: 'This is technically impossible to implement in Spring Boot regardless of the architectural merits', to: 'q2_wrong_impossible' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- one shared API was built specifically to avoid duplicating business logic, validation, and security checks across multiple parallel endpoint sets, each with its own chance to drift out of sync with the others.', next: 'q3' },
      q2_wrong_alreadydone: { end: true, correct: false, text: 'LogPose\'s actual, built architecture is the OPPOSITE -- one shared, stateless API called identically by every client, exactly what this proposal would abandon.', retry: 'q2' },
      q2_wrong_impossible: { end: true, correct: false, text: 'Building separate endpoint groups is technically POSSIBLE in Spring Boot -- the objection is architectural (duplicated logic, drift risk), not a technical limitation of the framework.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A developer wants to start building the JavaFX desktop client\'s "browse ideas" screen before the IdeaController endpoint exists on the backend. What is the concrete risk?',
        choices: [
          { text: 'The client would need to guess at a response shape that might not match what the real endpoint eventually returns, risking exactly the false-confidence gap mock-based testing without real integration testing creates', to: 'q3_right' },
          { text: 'There is no real risk -- JavaFX clients do not actually depend on the shape of backend API responses at all', to: 'q3_wrong_norisk' },
          { text: 'This would only be a problem for the web client, never for a JavaFX desktop client', to: 'q3_wrong_webonly' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- every client this course built parses real JSON response shapes from real endpoints; building against a shape that hasn\'t been finalized risks a mismatch discovered only once the real backend actually exists.', next: null },
      q3_wrong_norisk: { end: true, correct: false, text: 'JavaFX clients absolutely depend on the exact shape of API responses -- javafx-desktop\'s own PaperClient/PaperRow mapping exists specifically to consume a real, specific JSON shape from the backend.', retry: 'q3' },
      q3_wrong_webonly: { end: true, correct: false, text: 'This risk applies equally to any client making real HTTP requests against real endpoints -- the web client, the JavaFX desktop client, and the Gluon iOS client are all equally exposed to a mismatch between an assumed and an actual response shape.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Treating a capstone design lesson as an opportunity to introduce new, unjustified architectural decisions -- every choice here should trace back to a specific, already-taught reason from an earlier lesson, not a fresh, undefended judgment call.',
    'Leaving capstone scope open-ended ("we\'ll figure out multi-tenancy/Android/real-time collaboration later") instead of explicitly excluding it up front -- an unbounded capstone never actually finishes.',
    'Making a foreign key NOT NULL by default without asking whether the referenced relationship is genuinely always-required at creation time -- ideas.related_paper_id and ideas.project_id are both deliberately nullable for exactly this reason.',
    'Building per-client, tailored API endpoint groups instead of one shared, client-agnostic API -- reintroduces exactly the duplicated-logic, drift-prone-across-clients risk an API-first architecture exists to avoid.',
    'Starting client-side build work before the backend endpoints it depends on actually exist and work -- forces guessing at response shapes that may not match what\'s eventually built.',
    'Skipping the "why" behind a design decision because "it\'s just the capstone, we already decided this" -- a capstone building on unjustified decisions is exactly as fragile as production code built the same way.'
  ],
  interview: [
    {
      q: 'A hiring manager asks you to walk through LogPose\'s architecture as if defending it in a system design interview. Give a structured answer covering data model, API design, and client strategy.',
      a: 'Data model: a normalized relational schema (authors, papers, tags/paper_tags, reviews, decisions, and ideas) avoiding update/insert/delete anomalies by giving each real-world entity its own table, referenced by foreign key rather than duplicated — with ideas.related_paper_id and ideas.project_id deliberately nullable, reflecting that an idea genuinely can exist before it\'s connected to a paper or project. API design: a stateless REST/JSON API following one consistent status-code contract (201+Location, 204, 400/409/404/403 mapped precisely to distinct client-actionable meanings), with Bean Validation catching malformed requests before business logic runs and role-based authorization (@PreAuthorize) protecting editor-only actions. Client strategy: three genuinely independent clients (a web frontend, a JavaFX desktop app, and a Gluon-compiled iOS app reusing the SAME JavaFX Scene Graph code) all calling this one shared API, specifically because a stateless, client-agnostic backend is the only architecture that supports this many genuinely different client technologies without triplicating business logic.'
    },
    {
      q: 'A colleague on the interview panel pushes back: "Why not just use Firebase or a similar BaaS instead of building your own Spring Boot backend? Wouldn\'t that be faster for a personal project?" How do you respond?',
      a: 'For a genuinely simple personal project with no learning goal attached, a BaaS is a legitimate, faster option — that tradeoff is real. But LogPose\'s stated goal (from this whole course\'s premise) is specifically to TEACH full-stack Java development, and a Firebase-style BaaS would replace exactly the learning this project exists to provide: understanding relational schema design and normalization, writing real SQL and JDBC transaction handling, building a REST API with precise status-code semantics, and implementing role-based security from first principles — all deliberately hand-built here specifically because understanding the underlying mechanism (not just calling a managed service\'s API) is the actual point. There\'s also a genuine architectural fit argument, independent of learning goals: LogPose\'s three-client, self-hosted, single-user design doesn\'t need a BaaS\'s primary selling points (automatic multi-tenant scaling, real-time sync for many concurrent users) at all — those capabilities solve problems LogPose\'s own explicitly-scoped requirements don\'t actually have.'
    },
    {
      q: 'Defend the decision to exclude Android support from LogPose\'s capstone scope, given that Gluon Mobile can technically target it.',
      a: 'This traces directly to gluon-mobile-graalvm\'s own material: Android doesn\'t require the same MANDATORY ahead-of-time compilation iOS specifically forces (Apple\'s App Store policy against runtime code generation; Android\'s ART runtime historically permits JIT-style execution) — meaning the Gluon+GraalVM story that makes iOS genuinely instructive (a forced, non-optional AOT compilation, closing this course\'s own JIT-vs-AOT thread) doesn\'t apply to Android in the same forced way at all. Including Android would mean either building a second, differently-configured mobile pipeline (real, additional scope with a fundamentally different technical story) or building it in a way that doesn\'t actually exercise the specific AOT/closed-world material this course spent real depth on — neither serves the capstone\'s actual teaching goal. Scoping to Mac + iOS specifically keeps the capstone\'s cross-platform story focused on the ONE genuinely forced, instructive case, rather than diluting it across a second platform with a meaningfully different underlying story.'
    },
    {
      q: 'A stakeholder asks: "If we needed to add a fourth client — say, a command-line tool for scripting — how much of the existing architecture would need to change?" Answer precisely.',
      a: 'Essentially none of the BACKEND would need to change at all — this is the entire point of building a stateless, client-agnostic REST API from spring-boot-rest-api onward: a CLI tool making ordinary HTTP requests (via Java\'s own HttpClient, or any language\'s HTTP library at all, since the API is JSON-over-HTTP, not tied to Java specifically on the client side) against the exact same GET/POST /papers, /ideas, /search endpoints would work identically to the web, desktop, and mobile clients, with zero backend modification required. The ENTIRE cost of adding a fourth client is writing that fourth client itself — parsing the same JSON response shapes, handling the same status codes — precisely the payoff this lesson\'s "three clients, one API" section argues for, now demonstrated by extension to a client that wasn\'t even part of the original three-client plan at all.'
    }
  ]
};
