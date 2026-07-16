window.LESSONS = window.LESSONS || {};
window.LESSONS['sql-postgresql'] = {
  id: 'sql-postgresql',
  title: 'Relational Databases & SQL with PostgreSQL: Schema Design, Joins, Indexes',
  category: 'Part 8 — Databases',
  timeMin: 60,
  summary: 'Every LogPose lesson so far has stored data in memory — a List, a HashMap, an object graph that vanishes the moment the JVM exits. Part 8 gives LogPose a REAL, durable backing store, starting with the relational model itself: tables, rows, primary and foreign keys, and why splitting data across normalized tables avoids the update-anomaly bugs a single giant table invites. This lesson covers PostgreSQL schema design (CREATE TABLE, data types, constraints, referential integrity), the join operations that recombine normalized data back together (INNER vs LEFT/RIGHT/FULL OUTER, with precise NULL semantics), indexes (what a B-tree index actually buys you, EXPLAIN ANALYZE to see whether Postgres is using one, and when it silently won\'t), and GROUP BY aggregation — the foundation jdbc-transactions and jpa-hibernate build directly on top of.',
  goals: [
    'Design a normalized relational schema with primary keys, foreign keys, and appropriate constraints, and explain what update/insert/delete anomaly a single giant table would risk that normalization avoids',
    'Write CREATE TABLE statements using PostgreSQL data types and constraints (NOT NULL, UNIQUE, CHECK, REFERENCES with ON DELETE behavior)',
    'Write INNER and LEFT JOIN queries and explain precisely how their results differ when rows on one side have no match, in terms of NULL',
    'Explain what a B-tree index actually does, read a basic EXPLAIN ANALYZE plan to tell an Index Scan from a Seq Scan, and identify a case where an index silently won\'t be used',
    'Write GROUP BY queries with aggregate functions, and explain the difference between filtering with WHERE and filtering with HAVING'
  ],
  concept: [
    {
      h: 'The relational model: tables, keys, and why normalization avoids anomalies',
      p: [
        'Every LogPose class this course has built — Backlog, ReviewBoard, Paper — has stored its data in memory, gone the instant the JVM process exits. A RELATIONAL DATABASE stores data durably, on disk, organized into TABLES: a table is a named collection of ROWS, each row having the same fixed set of COLUMNS. Every table should have a PRIMARY KEY — one column (or a small combination of columns) whose value uniquely identifies each row, enforced by the database itself, never by application-level discipline alone. This is the same "give every entity a stable, unique identity" idea the strings-equals-hashcode lesson\'s EntryKey value class embodied in memory — a primary key is that same idea, enforced durably, by the database engine, across every process that ever touches the table.',
        'NORMALIZATION is the discipline of splitting data across MULTIPLE related tables rather than cramming everything into one wide table with repeated information. Imagine one giant papers table with an author_name and author_email column repeated on every single row for every paper that author wrote: renaming that author (an UPDATE ANOMALY) means updating potentially hundreds of rows and risking some being missed and left inconsistent; deleting the LAST paper by an author who hasn\'t published anything else would accidentally delete all record that author exists at all (a DELETE ANOMALY); and you cannot record a brand-new author who hasn\'t written any papers YET, since there\'s no paper row to attach their name to (an INSERT ANOMALY). Splitting authors into their OWN table, referenced from papers by a stable ID rather than duplicated text, eliminates all three anomalies at once — updating an author\'s name touches exactly one row, deleting all their papers leaves the author record intact, and a new author can be inserted with zero papers. This is the relational-database version of the same "avoid duplicated, drift-prone copies of the same fact" instinct the maven-multi-module lesson\'s dependencyManagement embodied for dependency versions, and streams\' immutable-value-type discipline embodied for data in memory.'
      ]
    },
    {
      h: 'Schema design: CREATE TABLE, data types, and constraints',
      p: [
        'A PostgreSQL table is declared with CREATE TABLE, naming each column and its TYPE. Common types: <code>BIGSERIAL</code> (an auto-incrementing 64-bit integer, the idiomatic primary-key type — PostgreSQL generates the next value automatically on insert, you never assign it by hand), <code>TEXT</code> (variable-length text with no arbitrary length cap, generally preferred over the older, fixed-length <code>VARCHAR(n)</code> unless a real length limit is a genuine business rule), <code>INTEGER</code>/<code>NUMERIC(precision, scale)</code> (NUMERIC for money or anything needing exact decimal arithmetic — never a floating-point type for currency, for the same "exact bits matter" reason the JUnit 5 lesson warned about comparing doubles with assertEquals), <code>DATE</code>/<code>TIMESTAMP</code>/<code>TIMESTAMPTZ</code> (TIMESTAMPTZ stores an instant with time-zone awareness — directly the database-column counterpart of datetime-io-nio\'s Instant-vs-LocalDateTime lesson: use TIMESTAMPTZ for any moment you\'ll compare or sort across machines, plain TIMESTAMP only for genuinely zone-agnostic local values), and <code>BOOLEAN</code>.',
        'CONSTRAINTS are rules the database itself enforces on every write, rejecting any INSERT or UPDATE that would violate them — this is durable, engine-level validation, a stronger guarantee than the exceptions lesson\'s constructor-level validation, since it holds even against a completely different application, a manual psql session, or a buggy script that bypasses your Java code entirely. <code>NOT NULL</code> requires a value; <code>UNIQUE</code> forbids duplicate values in that column across the whole table; <code>CHECK (expression)</code> enforces an arbitrary boolean condition (<code>CHECK (score BETWEEN 1 AND 5)</code>); and <code>REFERENCES other_table(id)</code> declares a FOREIGN KEY — a column whose value must match an existing primary key value in the referenced table, or be NULL if the column allows it — this is REFERENTIAL INTEGRITY: the database physically refuses to insert a paper referencing an author_id that doesn\'t exist. Foreign keys also control what happens on delete: <code>ON DELETE CASCADE</code> (deleting the author automatically deletes their papers too), <code>ON DELETE RESTRICT</code> (the default-adjacent behavior — refuses to delete an author who still has papers, forcing an explicit decision), or <code>ON DELETE SET NULL</code> (deleting the author leaves their papers in place with author_id set to NULL) — the right choice is a genuine domain decision, not a technical default to accept blindly.'
      ]
    },
    {
      h: 'Joins: recombining normalized data, and precise NULL semantics',
      p: [
        'Normalization splits related data across tables specifically so a JOIN can recombine it on demand. An <code>INNER JOIN</code> (usually written just <code>JOIN</code>) returns only rows where BOTH sides have a match: <code>SELECT p.title, a.name FROM papers p JOIN authors a ON p.author_id = a.id</code> returns one row per paper, each with its author\'s name — but an author with ZERO papers is completely absent from this result, since there\'s no papers-side row to pair them with. A <code>LEFT JOIN</code> (equivalently <code>LEFT OUTER JOIN</code>) keeps EVERY row from the left-hand table regardless of whether a match exists on the right, filling every right-hand column with NULL when no match is found: <code>SELECT a.name, p.title FROM authors a LEFT JOIN papers p ON p.author_id = a.id</code> returns every author at least once — an author with zero papers still appears, with p.title as NULL — precisely the query needed to answer "which authors have never submitted anything," a question an INNER JOIN can never answer since it excludes exactly the rows that would prove it.',
        '<code>RIGHT JOIN</code> is the mirror image (keep every row from the right table), and <code>FULL OUTER JOIN</code> keeps rows from BOTH sides regardless of match — in practice, RIGHT JOIN is rare in real code, since any RIGHT JOIN can be rewritten as an equivalent LEFT JOIN by swapping which table is written first, and most teams standardize on always writing LEFT for consistency. For a genuine MANY-TO-MANY relationship — LogPose papers can each have several tags, and each tag can apply to many papers — neither table can hold the foreign key directly (a paper can\'t have ONE tag_id column if it needs several tags); the standard pattern is a JOIN TABLE (paper_tags, holding paper_id and tag_id together, each referencing its respective table, with the PAIR as the composite primary key) sitting between the two, requiring TWO joins to walk from a paper to its tags\' names: papers JOIN paper_tags JOIN tags. This many-to-many-via-join-table pattern is exactly what jpa-hibernate will show an ORM generating automatically from a <code>@ManyToMany</code> annotation — worth recognizing the raw SQL shape now, before a framework does it for you.'
      ]
    },
    {
      h: 'Indexes: how lookups get fast, and EXPLAIN ANALYZE to check',
      p: [
        'Without an index, finding rows matching a WHERE condition requires PostgreSQL to examine EVERY row in the table in turn — a SEQUENTIAL SCAN (often abbreviated Seq Scan in query plans), whose cost grows directly with table size: fine for a table with a hundred rows, genuinely slow for one with a hundred million. An INDEX (PostgreSQL\'s default is a B-TREE, a sorted, balanced tree structure) is a separate, auxiliary data structure the database maintains alongside the table, mapping a column\'s VALUES to the physical ROWS that have them — conceptually the same "give up some space and write cost, get direct-lookup speed" tradeoff a real-world card catalog trades against physically flipping through every book on every shelf in order, or, in Java terms, the exact tradeoff maps-deep-dive described HashMap making over a plain unsorted List for lookups by key. <code>CREATE INDEX idx_papers_author_id ON papers(author_id)</code> adds one on the author_id column specifically, dramatically speeding up both direct WHERE author_id = ? lookups and the JOIN condition p.author_id = a.id from the previous section, since PostgreSQL can now navigate directly to matching rows instead of scanning every one.',
        'Indexes are not free: every INSERT, UPDATE, or DELETE that touches an indexed column must also update the index structure itself, so indexing every column "just in case" measurably slows down writes for speed-ups that may never be used — the right indexes are the ones that actually match your real WHERE clauses and JOIN conditions, not a blanket policy. <code>EXPLAIN ANALYZE</code> prefixed on any query actually RUNS it and reports the real execution plan PostgreSQL chose, including whether it used an Index Scan (fast, targeted) or fell back to a Seq Scan (examined every row) — the honest way to confirm an index is actually being used rather than assuming it from the CREATE INDEX statement alone. A composite index (spanning multiple columns, e.g. <code>CREATE INDEX ON reviews(paper_id, created_at)</code>) is usable for queries filtering on the FIRST column alone, or on the first AND second together, but generally NOT for a query filtering on the second column alone — column ORDER in a composite index is a real design decision, not an arbitrary listing. And an index on a column can silently go UNUSED even when it exists: wrapping the indexed column in a function (<code>WHERE UPPER(title) = \'FOO\'</code> against a plain index on title) or using a LEADING wildcard in LIKE (<code>WHERE title LIKE \'%flaky%\'</code>) both prevent a standard B-tree index from helping at all, since neither can be answered by a sorted-value lookup — exactly the kind of assumption EXPLAIN ANALYZE exists to check rather than trust blindly.'
      ]
    },
    {
      h: 'Aggregation: GROUP BY, aggregate functions, and WHERE vs HAVING',
      p: [
        'Aggregate functions compute one summary value across multiple rows: <code>COUNT(*)</code> (row count), <code>SUM(column)</code>, <code>AVG(column)</code>, <code>MIN(column)</code>/<code>MAX(column)</code>. Used alone, an aggregate collapses the ENTIRE result into one row: <code>SELECT COUNT(*) FROM papers</code> returns a single number. <code>GROUP BY</code> changes this: <code>SELECT author_id, COUNT(*) FROM papers GROUP BY author_id</code> computes one row PER DISTINCT value of author_id, each with its own count — directly the SQL equivalent of the streams lesson\'s <code>Collectors.groupingBy</code>, now running inside the database instead of in a Java Stream pipeline, and often far more efficient for large datasets since the database can use an index to help group rather than pulling every row into JVM memory first.',
        'A precise, commonly-confused distinction: <code>WHERE</code> filters INDIVIDUAL ROWS before any grouping happens; <code>HAVING</code> filters GROUPS after aggregation, based on the aggregate result itself — <code>SELECT author_id, COUNT(*) FROM papers WHERE published_on > \'2020-01-01\' GROUP BY author_id HAVING COUNT(*) > 5</code> first keeps only papers published after 2020 (WHERE, row-level), THEN groups the survivors by author, THEN keeps only authors with more than 5 such papers (HAVING, group-level) — trying to write <code>WHERE COUNT(*) > 5</code> is a compile-time error in PostgreSQL, since COUNT(*) doesn\'t exist yet at the point WHERE is evaluated; the aggregate is only computed once grouping has happened, which is precisely why HAVING exists as a separate clause evaluated after GROUP BY rather than folded into WHERE.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The World Government registry: one dossier per pirate, bounty posters that reference it, never repeat it',
      text: 'The World Government does not write a pirate\'s full physical description fresh onto every single document that ever mentions them — it keeps ONE registry of PIRATES, each with a unique Government identification number (a primary key), and every OTHER document — a bounty poster, a sighting report, a crew roster — references that ID rather than re-describing the pirate from scratch (a foreign key, avoiding duplication). This is deliberate: when Luffy\'s bounty is raised, exactly ONE row in the bounty table changes; if his physical description were instead copied onto every sighting report ever filed, updating it would mean hunting down and correcting every single one, with genuine risk of missing some and leaving the records silently inconsistent (the update anomaly normalization exists to prevent). The registry clerks physically REFUSE to file a bounty poster referencing a Government ID that doesn\'t exist in the pirate registry — no bounty can be issued for a pirate nobody has properly registered (referential integrity, enforced by the filing system itself, not by clerks remembering to double-check). Printing an actual WANTED poster requires pulling together the pirate\'s face AND their current bounty amount from two separate registries — a JOIN — and here\'s the operational distinction the Marines drill into every new recruit: a report listing "every registered pirate, with their bounty IF one has been issued" must still list pirates who have NO bounty yet, blank amount and all (a LEFT JOIN, keeping every pirate regardless of match) — a report that only shows pirates WITH an active bounty (an INNER JOIN) would silently omit every not-yet-bountied pirate entirely, a very different, much narrower report despite looking superficially similar. Robin, doing real archival research, never flips through the ENTIRE unsorted archive shelf by shelf hunting for one name — she uses the archive\'s cross-reference card catalog, sorted by name, to jump directly to the right shelf-and-slot (an index, trading a bit of upkeep effort maintaining the catalog for dramatically faster lookups than a full shelf-by-shelf scan). And when the Marines tally total bounty value ISSUED PER SEA to report up the chain of command, they\'re computing one sum per group of pirates sharing a sea — grouping and aggregating, exactly the way GROUP BY collapses many rows into one summary row per distinct value.',
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s restaurant: one customer file, orders that reference it, never retype it',
      text: 'At Monica\'s restaurant, the host stand doesn\'t re-write a regular customer\'s full name, phone number, and allergy notes onto every single receipt that customer ever generates — there\'s ONE customers record per person, each with a unique customer ID (a primary key), and every ORDER references that ID rather than re-entering the customer\'s details from scratch on every ticket (a foreign key, avoiding duplication). This matters concretely: when a regular updates their phone number, exactly ONE record changes; if that phone number were instead copied onto every past receipt, updating it would mean correcting every single one and risking some being missed, leaving records silently inconsistent (the exact update anomaly Monica, a perfectionist about her systems, would never tolerate). The system flatly refuses to file an order against a customer ID that doesn\'t exist in the customer file — no order can be attached to a customer nobody has actually registered (referential integrity). Printing an itemized RECEIPT requires pulling together the order AND the menu item\'s current price from two separate tables — a JOIN — and here\'s the exact distinction Monica is fanatical about in her monthly reports: a "loyalty members" report listing every enrolled customer, WITH their total spend if they\'ve ordered anything, must still list members who\'ve never placed a single order, blank total and all (a LEFT JOIN, keeping every member regardless of match) — a report that only shows customers WITH at least one order (an INNER JOIN) would silently omit every non-ordering member entirely, a materially different report despite looking similar at a glance. Gunther, famously, never scans every regular\'s face from memory one by one to place an order — he keeps an efficient, sorted mental index of exactly who orders what, letting him jump straight to the right answer instead of a slow linear scan of everyone he\'s ever served (an index, trading a bit of upkeep effort for dramatically faster lookups). And when Monica tallies total revenue PER MONTH for her own bookkeeping, she\'s computing one sum per group of orders sharing a month — grouping and aggregating, exactly what GROUP BY does over rows sharing a column value.',
    },
    why: 'The pirate registry / customer file, referenced rather than duplicated, is normalization avoiding update anomalies — one row to change, not hundreds. The Government ID / customer ID is a primary key; the bounty poster\'s / order\'s reference to it is a foreign key, and the filing system\'s refusal to accept an unregistered reference is referential integrity. Printing a wanted poster / receipt by combining two registries is a JOIN — and the Marines\' / Monica\'s report that still lists EVERY pirate/member even with no bounty/order is a LEFT JOIN, sharply distinct from an INNER JOIN which would silently drop them. The card catalog / Gunther\'s mental index is exactly what a database index is: a maintained, sorted lookup structure trading upkeep cost for lookup speed. And totaling bounty-per-sea / revenue-per-month is GROUP BY with an aggregate function.'
  },
  storyAnim: {
    title: 'One registry, referenced not copied, joined for the poster, indexed for speed, grouped for the totals',
    h: 340,
    props: [
      { id: 'registry', emoji: '📇', label: 'ONE pirate registry, unique ID per pirate (primary key)', x: 6, y: 8 },
      { id: 'poster', emoji: '📜', label: 'a bounty poster REFERENCES the ID, never re-describes the pirate (foreign key)', x: 28, y: 8 },
      { id: 'reject', emoji: '🚫', label: 'a poster for an UNREGISTERED ID is refused outright (referential integrity)', x: 50, y: 8 },
      { id: 'innerjoin', emoji: '🎯', label: 'INNER JOIN: only pirates WITH a bounty appear', x: 20, y: 46 },
      { id: 'leftjoin', emoji: '📋', label: 'LEFT JOIN: EVERY pirate appears, blank bounty if none', x: 44, y: 46 },
      { id: 'catalog', emoji: '🗂️', label: 'a sorted card catalog: jump straight to the shelf (index)', x: 68, y: 46 },
      { id: 'scan', emoji: '🐌', label: 'no catalog: check every single shelf in order (sequential scan)', x: 68, y: 8 },
      { id: 'grouptotal', emoji: '💰', label: 'total bounty PER SEA (GROUP BY + aggregate)', x: 44, y: 78 }
    ],
    actors: [
      { id: 'robin', emoji: '📖', label: 'Robin', x: 20, y: 78 },
      { id: 'clerk', emoji: '🖋️', label: 'registry clerk', x: 82, y: 78 }
    ],
    steps: [
      { c: 'One registry holds every pirate once, each with a unique Government ID. That\'s a primary key.', p: { registry: 'lit' } },
      { c: 'A bounty poster references that ID rather than re-describing the pirate from scratch. That\'s a foreign key.', p: { poster: 'lit' }, a: { clerk: [50, 30] } },
      { c: 'The filing system refuses a poster referencing an ID that isn\'t in the registry. That\'s referential integrity.', p: { reject: 'bad' } },
      { c: 'A report joining pirates to bounties with INNER JOIN shows only pirates who HAVE a bounty -- anyone without one is silently absent.', p: { innerjoin: 'bad' } },
      { c: 'The same report with LEFT JOIN keeps EVERY pirate, blank bounty and all -- the only way to see who has none.', p: { leftjoin: 'good' }, a: { robin: [44, 60] } },
      { c: 'Without an index, finding one pirate means checking every shelf in order -- a sequential scan, slow as the archive grows.', p: { scan: 'bad' } },
      { c: 'Robin\'s sorted card catalog jumps straight to the right shelf. That\'s what a database index does.', p: { catalog: 'good' } },
      { c: 'Totaling bounty value per sea collapses many pirates into one summary row per sea. That\'s GROUP BY with an aggregate.', p: { grouptotal: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'From tables and keys to joins, indexes, and aggregation',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'The relational model',
        nodes: [
          { id: 'tables', text: 'tables, rows, columns;\nprimary key = unique row identity' },
          { id: 'normalize', text: 'normalization: split data to avoid\nupdate/insert/delete anomalies' }
        ]
      },
      {
        label: 'Schema & constraints',
        nodes: [
          { id: 'types', text: 'BIGSERIAL, TEXT, NUMERIC,\nTIMESTAMPTZ' },
          { id: 'constraints', text: 'NOT NULL, UNIQUE, CHECK,\nREFERENCES + ON DELETE behavior' }
        ]
      },
      {
        label: 'Joins',
        nodes: [
          { id: 'innerjoin', text: 'INNER JOIN: only\nmatching rows on both sides' },
          { id: 'leftjoin', text: 'LEFT JOIN: every left row,\nNULL on the right if no match' },
          { id: 'manytomany', text: 'many-to-many needs\na join table' }
        ]
      },
      {
        label: 'Indexes & aggregation',
        nodes: [
          { id: 'index', text: 'B-tree index: sorted lookup\nstructure, not a full scan' },
          { id: 'explain', text: 'EXPLAIN ANALYZE:\nIndex Scan vs Seq Scan' },
          { id: 'groupby', text: 'GROUP BY + aggregates;\nWHERE filters rows, HAVING filters groups' }
        ]
      }
    ],
    steps: [
      { active: ['tables'], note: 'A table is rows of the same shape; a primary key uniquely identifies each row, enforced by the database itself.' },
      { active: ['normalize'], note: 'Splitting data across related tables (rather than one wide table with repeated text) avoids update, insert, and delete anomalies.' },
      { active: ['types'], note: 'PostgreSQL data types: BIGSERIAL for auto-incrementing keys, TEXT for strings, NUMERIC for exact decimals, TIMESTAMPTZ for zone-aware instants.' },
      { active: ['constraints'], note: 'Constraints are enforced by the database on every write -- NOT NULL, UNIQUE, CHECK, and REFERENCES (with ON DELETE CASCADE/RESTRICT/SET NULL) for referential integrity.' },
      { active: ['innerjoin'], note: 'INNER JOIN returns only rows where both sides have a match -- an unmatched row on either side is excluded entirely.' },
      { active: ['leftjoin'], note: 'LEFT JOIN keeps every row from the left table, filling right-side columns with NULL when no match exists -- the only way to see "which rows have nothing on the other side."' },
      { active: ['manytomany'], note: 'A true many-to-many relationship needs a join table holding both foreign keys, requiring two joins to walk across it.' },
      { active: ['index'], note: 'An index is a maintained, sorted lookup structure the database consults instead of scanning every row -- fast reads, at some write-time upkeep cost.' },
      { active: ['explain'], note: 'EXPLAIN ANALYZE actually runs a query and reports whether PostgreSQL used an Index Scan or fell back to a Seq Scan -- the honest way to confirm an index helped.' },
      { active: ['groupby'], note: 'GROUP BY computes one row per distinct value with aggregate functions; WHERE filters rows before grouping, HAVING filters groups after aggregation.' }
    ]
  },
  tech: [
    {
      q: 'A junior developer proposes a single wide table: papers(id, title, author_name, author_email, author_institution, ...). Explain, with a concrete scenario for each, the three specific anomalies this design risks that a normalized authors + papers design avoids.',
      a: 'INSERT ANOMALY: a newly-hired researcher who hasn\'t published a paper YET cannot be recorded at all in the single-table design, since author_name/author_email only exist as columns on a PAPERS row — there\'s no papers row to attach them to, so the system has no place to put a person who exists but hasn\'t authored anything. A normalized authors table has no such restriction: inserting a new author row requires no paper at all. UPDATE ANOMALY: if that researcher publishes ten papers and then changes their institutional email, the single-table design requires updating author_email on all ten rows — miss even one during that update, and the table now silently disagrees with itself about the same person\'s email depending on which row you happen to read. A normalized design requires updating exactly one row, in the authors table, with zero risk of partial, inconsistent updates. DELETE ANOMALY: if that researcher\'s only paper is later retracted and its row deleted, the single-table design deletes the only record that this author exists at all — all their contact information vanishes along with the one paper, even though the actual intent was just to remove a paper, not to erase a person. A normalized design keeps the author row intact regardless of how many (including zero) papers currently reference it. All three anomalies share the same root cause — data about ONE real-world entity (the author) is duplicated across MULTIPLE rows describing a DIFFERENT entity (papers) — and normalization\'s fix is the same in each case: give the author their own table, referenced by ID, so exactly one row represents exactly one author regardless of how many papers do or don\'t reference them.'
    },
    {
      q: 'Write (in words, precisely) the difference in result between SELECT a.name, COUNT(p.id) FROM authors a JOIN papers p ON p.author_id = a.id GROUP BY a.name and the same query with LEFT JOIN instead of JOIN, for an author with zero papers.',
      a: 'With plain JOIN (INNER JOIN), an author with zero papers is excluded from the result ENTIRELY — there is no papers row for that author to pair with, so the JOIN produces zero rows for them, and since GROUP BY only groups rows that actually exist in the joined result, that author never appears in the output at all, not even with a count of zero; they are simply, silently absent, indistinguishable in the output from an author who was never in the authors table in the first place. With LEFT JOIN, that same author DOES appear in the joined result — exactly once, with every papers-side column (including p.id) set to NULL, since no match was found. Critically, COUNT(p.id) specifically counts NON-NULL values of the given expression — COUNT(*) would incorrectly count this NULL-filled row as 1, but COUNT(p.id) correctly evaluates to 0 for this author, since the single row it sees has p.id = NULL, which COUNT(column) does not count. This is precisely why COUNT(p.id) (a specific column) rather than COUNT(*) is the correct choice when combined with LEFT JOIN specifically to get an honest zero for authors with no matching rows, rather than either silently omitting them (INNER JOIN) or incorrectly reporting a count of 1 for an author with zero real papers (LEFT JOIN combined with the wrong COUNT variant).'
    },
    {
      q: 'A table reviews(id, paper_id, reviewer, score, created_at) has an index on paper_id alone. A query filters WHERE paper_id = 42 AND created_at > \'2026-01-01\'. Would a composite index on (paper_id, created_at) help this query more than the existing single-column index on paper_id, and why does column ORDER in that composite index matter?',
      a: 'Yes, a composite index on (paper_id, created_at) would generally help more than a single-column index on paper_id alone, for a query filtering on BOTH columns together — with only the paper_id index, PostgreSQL can narrow down to the rows for paper_id = 42 efficiently via the index, but then must check the created_at condition against EACH of those rows individually (still fast if paper_id = 42 matches few rows, but not as fast as it could be). A composite index on (paper_id, created_at) is physically ordered first by paper_id, then by created_at WITHIN each paper_id group — meaning PostgreSQL can navigate directly to the paper_id = 42 section of the index AND, within that section, directly to rows with created_at > \'2026-01-01\', without needing to individually re-check every paper_id = 42 row\'s created_at value one at a time. Column ORDER matters specifically because of this physical layout: a composite index on (paper_id, created_at) is fully usable for a query filtering on paper_id ALONE (that\'s the outer sort key, directly navigable), and usable for paper_id AND created_at together (as shown), but is generally NOT usable at all for a query filtering on created_at ALONE, without paper_id — since created_at values are only sorted WITHIN each paper_id group, not globally across the whole index, so there\'s no single sorted sequence of created_at values to navigate directly to without first knowing which paper_id group to look inside. The general rule: put the column most often used ALONE, or used in equality (=) comparisons, first in a composite index; the design must match the actual shape of your real queries, not an arbitrary column listing.'
    },
    {
      q: 'A query WHERE LOWER(email) = \'nami@logpose.dev\' runs a full sequential scan even though there is a plain index CREATE INDEX ON authors(email). Explain precisely why the index isn\'t being used, and the two ways to fix it.',
      a: 'A standard B-tree index on authors(email) stores entries sorted by the RAW value of the email column exactly as stored — it has no knowledge of what LOWER(email) would evaluate to for any given row, since that\'s a computed expression, not the column\'s actual stored value. Querying WHERE LOWER(email) = \'...\' asks PostgreSQL to find rows where a FUNCTION APPLIED TO the column equals something — the plain index simply cannot answer that question directly, since it was never built to represent lowercased values at all, forcing PostgreSQL to fall back to checking LOWER(email) against every single row individually (a sequential scan), exactly the same structural reason WHERE UPPER(title) = \'FOO\' this lesson\'s concept section describes can\'t use a plain index on title. Two legitimate fixes: (1) if the actual REQUIREMENT is case-insensitive comparison, store email in a normalized (e.g. always-lowercase) form at write time instead of applying a function at read time, and index the plain column directly — the cleanest fix when it\'s compatible with the actual data requirements; (2) create a FUNCTIONAL INDEX matching the exact expression used in the query — CREATE INDEX ON authors(LOWER(email)) — which builds the index on the COMPUTED lowercased values themselves, making WHERE LOWER(email) = \'...\' directly index-usable again, at the cost of PostgreSQL needing to maintain that computed index on every write, same as any other index.'
    }
  ],
  code: {
    title: 'A normalized LogPose schema: authors, papers, tags, and a many-to-many join table',
    intro: 'CREATE TABLE statements for LogPose\'s core schema, with primary keys, foreign keys, constraints, and referential integrity — followed by the join and grouping queries that recombine the normalized data.',
    code: `-- authors: one row per real-world author, referenced (not duplicated) from papers
CREATE TABLE authors (
    id    BIGSERIAL PRIMARY KEY,
    name  TEXT NOT NULL,
    email TEXT UNIQUE
);

-- papers: references authors by ID -- never repeats the author's name/email
CREATE TABLE papers (
    id            BIGSERIAL PRIMARY KEY,
    title         TEXT NOT NULL,
    author_id     BIGINT NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
    published_on  DATE,
    doi           TEXT UNIQUE,
    CONSTRAINT title_not_blank CHECK (length(trim(title)) > 0)
);

-- an index on the foreign key, since papers is looked up and joined by author_id constantly
CREATE INDEX idx_papers_author_id ON papers(author_id);

-- tags: independent of papers, since one tag can apply to many papers
CREATE TABLE tags (
    id   BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- paper_tags: the join table for the many-to-many papers <-> tags relationship
CREATE TABLE paper_tags (
    paper_id BIGINT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    tag_id   BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (paper_id, tag_id)   -- composite key: a paper can't have the same tag twice
);

-- INNER JOIN: only papers that HAVE an author appear (every paper always does, here)
SELECT p.title, a.name AS author_name
FROM papers p
JOIN authors a ON p.author_id = a.id;

-- LEFT JOIN: every author appears, even those with zero papers (title/count show as NULL/0)
SELECT a.name, COUNT(p.id) AS paper_count
FROM authors a
LEFT JOIN papers p ON p.author_id = a.id
GROUP BY a.name
HAVING COUNT(p.id) > 0;   -- HAVING filters GROUPS, after aggregation -- keeps only published authors

-- walking the many-to-many relationship: two joins to get from a paper to its tag names
SELECT p.title, t.name AS tag_name
FROM papers p
JOIN paper_tags pt ON pt.paper_id = p.id
JOIN tags t ON t.id = pt.tag_id
WHERE p.id = 1;

-- confirm the index is actually used, not just declared
EXPLAIN ANALYZE
SELECT * FROM papers WHERE author_id = 7;`,
    notes: [
      'authors.email and papers.doi are UNIQUE, not PRIMARY KEY -- a table can have exactly one primary key but any number of additional UNIQUE constraints on other columns.',
      'papers.author_id uses ON DELETE RESTRICT (refuse to delete an author with existing papers); paper_tags uses ON DELETE CASCADE (deleting a paper cleanly removes its tag associations) -- two genuinely different domain decisions, not an arbitrary technical default.',
      'The LEFT JOIN query would show every author, including ones with zero papers, as COUNT(p.id) = 0 -- but the HAVING COUNT(p.id) > 0 clause then filters those zero-paper authors back OUT, a deliberate demonstration that LEFT JOIN and HAVING can be combined precisely.',
      'EXPLAIN ANALYZE on the last query should report "Index Scan using idx_papers_author_id" if the index is being used -- "Seq Scan on papers" would mean it is not, worth checking rather than assuming.'
    ]
  },
  lab: {
    title: 'Add a reviews table with constraints, an index, and an aggregation query',
    prompt: 'Given the papers/authors schema from the code demo, write SQL that: (1) creates a table <code>reviews</code> with columns <code>id BIGSERIAL PRIMARY KEY</code>, <code>paper_id BIGINT NOT NULL REFERENCES papers(id) ON DELETE CASCADE</code>, <code>reviewer TEXT NOT NULL</code>, <code>score INTEGER</code> with a <code>CHECK</code> constraint requiring <code>score BETWEEN 1 AND 5</code>, and <code>created_at TIMESTAMPTZ NOT NULL DEFAULT now()</code>; (2) creates an index on <code>reviews(paper_id)</code>; (3) writes a query selecting each paper\'s <code>title</code> and the <code>AVG(score)</code> of its reviews, using a <code>LEFT JOIN</code> from <code>papers</code> to <code>reviews</code> so papers with zero reviews still appear (with a NULL average), grouped by <code>p.title</code>.',
    starter: `-- TODO 1: CREATE TABLE reviews with the columns and constraints described above

-- TODO 2: CREATE INDEX on reviews(paper_id)

-- TODO 3: SELECT p.title and AVG(r.score), LEFT JOIN papers to reviews, GROUP BY p.title
`,
    checks: [
      { re: 'CREATE TABLE\\s+reviews', must: true, hint: 'Declare CREATE TABLE reviews (...).', pass: 'reviews table declared ✓' },
      { re: 'paper_id\\s+BIGINT\\s+NOT\\s+NULL\\s+REFERENCES\\s+papers\\s*\\(\\s*id\\s*\\)', must: true, hint: 'paper_id must be BIGINT NOT NULL REFERENCES papers(id).', pass: 'paper_id foreign key ✓' },
      { re: 'ON\\s+DELETE\\s+CASCADE', must: true, hint: 'The paper_id foreign key must specify ON DELETE CASCADE.', pass: 'ON DELETE CASCADE ✓' },
      { re: 'CHECK\\s*\\(\\s*score\\s+BETWEEN\\s+1\\s+AND\\s+5\\s*\\)', must: true, hint: 'Add CHECK (score BETWEEN 1 AND 5) on the score column.', pass: 'score CHECK constraint ✓' },
      { re: 'CREATE\\s+INDEX\\s+\\S+\\s+ON\\s+reviews\\s*\\(\\s*paper_id\\s*\\)', must: true, hint: 'Add CREATE INDEX idx_name ON reviews(paper_id).', pass: 'index on reviews(paper_id) ✓' },
      { re: 'LEFT\\s+JOIN\\s+reviews', must: true, hint: 'The final query must LEFT JOIN reviews (not a plain JOIN), so zero-review papers still appear.', pass: 'LEFT JOIN used ✓' },
      { re: 'AVG\\s*\\(\\s*r\\.score\\s*\\)', must: true, hint: 'Select AVG(r.score) as the average review score.', pass: 'AVG(r.score) used ✓' },
      { re: 'GROUP\\s+BY\\s+p\\.title', must: true, hint: 'Group by p.title.', pass: 'GROUP BY p.title ✓' }
    ],
    run: 'psql -f this_file.sql — against the code demo\'s schema, this creates the reviews table with a working foreign key and CHECK constraint, an index, and returns every paper (even ones with no reviews yet) alongside its average score.',
    solution: `CREATE TABLE reviews (
    id         BIGSERIAL PRIMARY KEY,
    paper_id   BIGINT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    reviewer   TEXT NOT NULL,
    score      INTEGER CHECK (score BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_paper_id ON reviews(paper_id);

SELECT p.title, AVG(r.score) AS average_score
FROM papers p
LEFT JOIN reviews r ON r.paper_id = p.id
GROUP BY p.title;`,
    notes: [
      'ON DELETE CASCADE on paper_id means deleting a paper automatically removes its reviews too -- a deliberate choice, since a review with no paper to attach to is meaningless, unlike papers.author_id\'s ON DELETE RESTRICT in the code demo, where an author should NOT be deletable while papers still reference them.',
      'The CHECK constraint runs on every INSERT and UPDATE -- attempting to insert score = 7 fails at the database level regardless of what Java-side validation may or may not have run first.',
      'The LEFT JOIN, not a plain JOIN, is what makes papers with zero reviews still appear in the result (with average_score as NULL) -- exactly the distinction the concept section drew between the two.'
    ]
  },
  quiz: [
    {
      q: 'A single wide table stores author_name and author_email directly on every papers row, instead of a separate authors table. What specific problem does this risk if an author changes their email after publishing ten papers?',
      options: ['An update anomaly -- all ten rows must be updated, and missing even one leaves the table silently inconsistent about the same author\'s email', 'A primary key violation, since BIGSERIAL columns cannot be updated', 'No problem -- this is the correct, most efficient design for this scenario', 'A foreign key constraint violation'],
      correct: 0,
      explain: 'Duplicating the same real-world fact (an author\'s email) across many rows means every copy must be updated in lockstep — missing one creates a silent inconsistency. A separate authors table requires updating exactly one row.'
    },
    {
      q: 'What is the key difference between INNER JOIN and LEFT JOIN when a row on the left table has no matching row on the right?',
      options: ['INNER JOIN excludes that row entirely from the result; LEFT JOIN keeps it, filling the right-side columns with NULL', 'INNER JOIN and LEFT JOIN always produce identical results regardless of matches', 'LEFT JOIN excludes unmatched rows; INNER JOIN keeps them with NULL', 'INNER JOIN throws an error when no match exists; LEFT JOIN does not'],
      correct: 0,
      explain: 'INNER JOIN only returns rows where both sides match, silently dropping unmatched left-side rows. LEFT JOIN keeps every left-side row regardless, using NULL for any right-side columns with no match.'
    },
    {
      q: 'A composite index is created as CREATE INDEX ON reviews(paper_id, created_at). Which of these queries can NOT make good use of this index?',
      options: ['A query filtering WHERE created_at > \'2026-01-01\' alone, with no condition on paper_id', 'A query filtering WHERE paper_id = 42 alone', 'A query filtering WHERE paper_id = 42 AND created_at > \'2026-01-01\' together', 'All three queries can equally use this index'],
      correct: 0,
      explain: 'A composite index is sorted first by paper_id, then by created_at within each paper_id group. Filtering on created_at ALONE, without paper_id, cannot use this index efficiently, since created_at values aren\'t globally sorted across the whole index.'
    },
    {
      q: 'Why does WHERE LOWER(email) = \'nami@logpose.dev\' fail to use a plain index CREATE INDEX ON authors(email)?',
      options: ['The index stores the raw, unmodified column values, sorted as stored -- it has no representation of what LOWER(email) computes for each row, so PostgreSQL cannot use it to answer a query filtering on that computed expression', 'PostgreSQL indexes only work with numeric columns, never text columns', 'The query is syntactically invalid and will not run at all', 'UNIQUE constraints are required before any index can be used in a WHERE clause'],
      correct: 0,
      explain: 'A standard index is built on the column\'s actual stored value. Wrapping the column in a function at query time asks a question the plain index was never built to answer -- a functional index (CREATE INDEX ON authors(LOWER(email))) is the fix.'
    },
    {
      q: 'What is the difference between filtering with WHERE and filtering with HAVING in a query using GROUP BY?',
      options: ['WHERE filters individual rows before grouping happens; HAVING filters entire groups after aggregation, based on an aggregate result', 'WHERE and HAVING are interchangeable and can always be used in place of each other', 'HAVING filters individual rows before grouping; WHERE filters groups after aggregation', 'WHERE can only be used with GROUP BY, and HAVING can only be used without it'],
      correct: 0,
      explain: 'WHERE operates on raw rows before GROUP BY runs. HAVING operates on the resulting groups, evaluated after aggregation — which is why HAVING can reference an aggregate like COUNT(*) directly, while WHERE cannot.'
    }
  ],
  testFlow: {
    title: 'Test yourself: normalization, joins, and reading an index',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A team wants to record a brand-new researcher who hasn\'t published any papers yet. Their current schema only stores author_name/author_email directly on the papers table, with no separate authors table. Can they record this researcher?',
        choices: [
          { text: 'No -- there is no papers row for this researcher yet, and author_name/author_email only exist as columns ON a papers row, so there is nowhere to put a person who exists but has authored nothing (an insert anomaly)', to: 'q1_right' },
          { text: 'Yes -- they can simply insert a papers row with title set to NULL and the author\'s details filled in', to: 'q1_wrong_nulltitle' },
          { text: 'Yes -- PostgreSQL automatically creates an implicit authors table behind the scenes for any repeated author_name value', to: 'q1_wrong_implicit' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- this is the insert anomaly precisely: without a separate authors table, there is no way to represent an author who exists but has zero papers, since author data only exists attached to a papers row.', next: 'q2' },
      q1_wrong_nulltitle: { end: true, correct: false, text: 'The schema has a CHECK constraint requiring a non-blank title, and even without one, inserting a fake placeholder paper to work around a missing author record is exactly the kind of anomaly normalization exists to avoid, not a legitimate fix.', retry: 'q1' },
      q1_wrong_implicit: { end: true, correct: false, text: 'PostgreSQL does not create implicit tables from repeated column values -- normalization is a deliberate schema design choice the developer makes explicitly with CREATE TABLE, not something the database infers automatically.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'SELECT a.name, COUNT(p.id) FROM authors a LEFT JOIN papers p ON p.author_id = a.id GROUP BY a.name is run. An author with zero papers appears in the authors table. What does this query report for them?',
        choices: [
          { text: 'The author appears in the result with COUNT(p.id) equal to 0, since LEFT JOIN keeps them with NULL papers-side columns, and COUNT(p.id) does not count NULL values', to: 'q2_right' },
          { text: 'The author is silently excluded from the result entirely', to: 'q2_wrong_excluded' },
          { text: 'The author appears with COUNT(p.id) equal to 1, since LEFT JOIN produces exactly one row per author regardless of matches', to: 'q2_wrong_countone' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- LEFT JOIN keeps every author, with p.id as NULL when no papers match. COUNT(p.id) specifically counts non-NULL values, so it correctly reports 0 rather than miscounting the NULL-filled row as 1.', next: 'q3' },
      q2_wrong_excluded: { end: true, correct: false, text: 'That would be the result with a plain INNER JOIN, not LEFT JOIN. LEFT JOIN is specifically chosen here to keep authors with zero papers in the result, not exclude them.', retry: 'q2' },
      q2_wrong_countone: { end: true, correct: false, text: 'This is the classic COUNT(*) vs COUNT(column) trap -- COUNT(*) would indeed report 1 for the single NULL-filled row LEFT JOIN produces, but COUNT(p.id) specifically counts non-NULL values of p.id, correctly reporting 0.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'EXPLAIN ANALYZE on a query filtering WHERE author_id = 7 reports "Seq Scan on papers" even though CREATE INDEX ON papers(author_id) exists. The table has only 12 rows total. Is this necessarily a sign of a problem?',
        choices: [
          { text: 'Not necessarily -- for a very small table, PostgreSQL\'s query planner may correctly determine that scanning all 12 rows directly is actually faster than the overhead of consulting an index, and choosing not to use an index isn\'t always a mistake', to: 'q3_right' },
          { text: 'Yes -- any query not using an available index always indicates a misconfigured or corrupted index that must be rebuilt', to: 'q3_wrong_corrupted' },
          { text: 'Yes -- this means the CREATE INDEX statement must have failed silently and the index does not actually exist', to: 'q3_wrong_failed' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- for very small tables, a sequential scan can genuinely be faster than an index lookup, since the index lookup itself has overhead. PostgreSQL\'s planner makes a real cost-based decision, not a blind "always use an index if one exists" rule.', next: null },
      q3_wrong_corrupted: { end: true, correct: false, text: 'PostgreSQL\'s query planner choosing a sequential scan over an available index is a normal, cost-based decision, especially for small tables -- it is not evidence of corruption, and does not by itself indicate a problem worth investigating.', retry: 'q3' },
      q3_wrong_failed: { end: true, correct: false, text: 'An index existing and an index being CHOSEN for a specific query are different things -- the planner can correctly decide not to use a perfectly valid index when a sequential scan is actually cheaper, which is common for small tables.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Cramming related data into one wide table with repeated text columns instead of normalizing -- invites insert, update, and delete anomalies as soon as the same real-world fact needs to be duplicated across many rows.',
    'Using COUNT(*) instead of COUNT(column) after a LEFT JOIN when you need an honest zero for unmatched rows -- COUNT(*) counts the NULL-filled row itself as 1, while COUNT(column) correctly ignores NULL values.',
    'Reaching for INNER JOIN by habit when the actual question requires seeing rows with NO match on the other side (e.g. "which authors have never published") -- INNER JOIN silently excludes exactly the rows that would answer that question.',
    'Assuming an index is being used just because CREATE INDEX was run, without confirming via EXPLAIN ANALYZE -- a query that wraps an indexed column in a function, or filters on the non-leading column of a composite index, can silently fall back to a sequential scan.',
    'Writing WHERE COUNT(*) > 5 instead of using HAVING -- aggregate functions are not yet computed at the point WHERE is evaluated, since WHERE filters rows BEFORE grouping happens.',
    'Storing money or any value needing exact decimal arithmetic as a floating-point type instead of NUMERIC(precision, scale) -- the same "exact bits matter" issue unit-testing-junit5 warned about comparing doubles with assertEquals, now at the database-column level.'
  ],
  interview: [
    {
      q: 'A team is debating whether to denormalize a frequently-joined authors/papers relationship into one wide table for read performance. Walk through the tradeoff precisely, and describe a middle-ground option that captures some of the performance benefit without fully reintroducing the anomalies normalization avoids.',
      a: 'The performance argument for denormalization is real: a single wide table avoids the JOIN entirely, and for a read-heavy workload where authors/papers together are queried far more often than authors are updated, the JOIN\'s cost (even with a proper index on author_id, there\'s still real work matching rows across two tables) can be a genuine, measurable cost worth avoiding. But the tradeoff is precise, not free: denormalizing reintroduces exactly the update/insert/delete anomalies the concept section walked through — an author\'s email now needs updating across every one of their papers\' rows again, with the same risk of partial, inconsistent updates if even one row is missed, and a not-yet-published author again has nowhere to be recorded. A middle-ground option that captures much of the read-performance benefit without fully reintroducing the anomalies: keep the NORMALIZED authors/papers tables as the SOURCE OF TRUTH for all writes (so updates, inserts, and deletes all go through the anomaly-free normalized schema), and additionally maintain a DENORMALIZED read-optimized table or materialized view (a precomputed join result, refreshed periodically or via a trigger on the normalized tables) specifically for the hot read path — Postgres\'s MATERIALIZED VIEW feature is built exactly for this. This way, writes stay correct and anomaly-free against the normalized schema, and the expensive JOIN cost is paid once, at refresh time, rather than on every single read — a real complexity cost (now two representations of the same data to keep in sync, and a staleness window between refreshes) that\'s only worth taking on once the actual read-performance problem is measured and confirmed, not adopted preemptively.'
    },
    {
      q: 'Explain, precisely, why ON DELETE RESTRICT was chosen for papers.author_id but ON DELETE CASCADE was chosen for paper_tags\' foreign keys in this lesson\'s schema, and what would go wrong with each if the choices were swapped.',
      a: 'ON DELETE RESTRICT on papers.author_id means PostgreSQL physically refuses to delete an author row while any papers still reference it — this is the right choice specifically because a paper without an author is a broken, meaningless record in LogPose\'s domain (every paper genuinely has exactly one author, and deleting the author out from under existing papers would either force those papers into an invalid state or silently orphan them), so the database is being asked to ENFORCE that a deletion touching a still-referenced author simply cannot happen by accident — the person deleting must explicitly deal with the author\'s existing papers first (reassign them, or delete them deliberately) rather than the database quietly cascading that decision for them. ON DELETE CASCADE on paper_tags\' foreign keys means deleting a PAPER automatically removes its rows in the join table too — this is the right choice because a paper_tags row has NO independent meaning once the paper it describes is gone; there is no legitimate reason to keep a "paper 42 is tagged X" record around after paper 42 itself no longer exists, so automatically cleaning it up is the correct, safe behavior with no meaningful data loss risk. If the choices were swapped: RESTRICT on paper_tags would mean you could never delete a paper that has any tags at all without first manually deleting each paper_tags row yourself — annoying friction with no real safety benefit, since a paper_tags row genuinely has no value independent of its paper. And CASCADE on papers.author_id would mean deleting an author SILENTLY deletes every paper they ever wrote, with no explicit confirmation step — a potentially catastrophic, hard-to-reverse mistake for data as significant as an entire body of academic work, exactly the kind of decision that should require an explicit, deliberate action rather than happening automatically as a side effect of deleting a person record.'
    },
    {
      q: 'A slow-query report flags SELECT * FROM papers WHERE title LIKE \'%flaky test%\' as consistently doing a sequential scan despite an index on title. Explain precisely why, and propose a real PostgreSQL-appropriate fix.',
      a: 'A standard B-tree index on title is organized as a SORTED structure of title values, letting PostgreSQL navigate directly to a range of values matching a PREFIX (WHERE title LIKE \'flaky%\' — "starts with flaky" CAN use a B-tree index, since matching values are contiguous in sorted order). A LEADING wildcard (\'%flaky test%\' — "contains flaky test anywhere") breaks this entirely: there is no way to know, from a value\'s position in SORTED order, whether it CONTAINS a given substring somewhere in the middle — "aflaky test result" and "zflaky test example" could both match despite sorting nowhere near each other, so a B-tree\'s sorted-navigation structure simply cannot help answer this kind of query at all, forcing PostgreSQL to check every row\'s title individually via a sequential scan, exactly as observed. The real, PostgreSQL-appropriate fix for genuine substring/full-text search is NOT a plain B-tree index at all — it\'s either a TRIGRAM index (PostgreSQL\'s pg_trgm extension, which indexes overlapping 3-character sequences within each value, genuinely enabling fast LIKE \'%...%\' and even fuzzy-similarity queries) via CREATE INDEX ON papers USING GIN (title gin_trgm_ops), or, for genuine natural-language search with ranking (closer to what LogPose\'s own semantic-search capstone material in Part 13 will build toward), PostgreSQL\'s built-in FULL-TEXT SEARCH using tsvector/tsquery and a GIN index specifically designed for that. The general lesson: recognizing that a query PATTERN (leading-wildcard LIKE) is fundamentally incompatible with a plain B-tree index, rather than assuming any index on the right column will always help any query touching that column, is precisely the judgment EXPLAIN ANALYZE exists to make you check rather than assume.'
    },
    {
      q: 'Design (in words) a normalized schema extension to support LogPose reviewers being able to co-review a paper alongside other reviewers, where each reviewer\'s individual score and comment must be tracked separately, but a paper\'s FINAL decision (accept/reject) is a single value computed by an editor after seeing all reviews. Where would you store the final decision, and why is that a genuinely different design question from where you store individual review scores?',
      a: 'Individual review scores are naturally a one-to-many relationship FROM papers (this lesson\'s reviews table already models this correctly: many reviews, each with its own reviewer/score/comment, all referencing one paper_id) — nothing changes there; each reviewer\'s individual assessment is its own row, appropriately, since there can be several per paper and each is independently meaningful (who said what, and when). The paper\'s FINAL decision is a genuinely different kind of fact, though, and deserves real thought about where it lives, precisely because it is NOT one-to-many the way reviews are — a paper has exactly ONE current decision at a time (accept/reject/pending), not several. Two legitimate designs, with a real tradeoff: (1) add a decision column DIRECTLY on the papers table itself (decision TEXT, or better, a Postgres ENUM type restricting it to a fixed set of valid values) — simple, and correctly reflects that a paper has exactly one current decision, but loses HISTORY: if an editor changes their mind, the previous decision is simply overwritten with no record it ever existed. (2) a separate decisions table (id, paper_id REFERENCES papers, editor, decision, decided_at), inserting a NEW row every time a decision is made or changed, with "the current decision" defined as the most recent row for that paper_id (e.g. via MAX(decided_at) or a boolean is_current flag) — more complex, but preserves full decision history, which real editorial/review workflows often genuinely need (who decided what, and when, and whether it changed). The key design judgment: individual review scores are inherently plural-per-paper (many reviewers, many independent opinions, naturally a one-to-many table) — the DECISION is singular-per-paper AT ANY GIVEN MOMENT but potentially plural OVER TIME if history matters, which is a fundamentally different shape of question than "how many reviewers does a paper have," and deserves being asked explicitly rather than defaulting to whichever pattern the reviews table already used.'
    }
  ]
};
