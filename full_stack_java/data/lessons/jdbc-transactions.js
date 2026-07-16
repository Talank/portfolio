window.LESSONS = window.LESSONS || {};
window.LESSONS['jdbc-transactions'] = {
  id: 'jdbc-transactions',
  title: 'JDBC: Drivers, PreparedStatement, Connection Pools & Transactions (ACID)',
  category: 'Part 8 — Databases',
  timeMin: 45,
  summary: 'sql-postgresql designed the schema; this lesson is how Java code actually TALKS to it. JDBC (Java Database Connectivity) is the standard interface every Java database library ultimately sits on top of — Connection, Statement, PreparedStatement, ResultSet — and maven-fundamentals\' JDBC-driver-at-runtime-scope example finally pays off here. Two things get real depth: PreparedStatement as both a performance win AND the concrete fix for SQL injection (a genuine OWASP Top 10 vulnerability, not a hypothetical one), and ACID transactions — atomicity, consistency, isolation, durability — with the classic dirty-read/non-repeatable-read/phantom-read anomalies, ending on a direct connection to tdd-coverage-flaky-tests: a test suite that doesn\'t properly isolate its database transactions reproduces the exact same shared-mutable-state flakiness this course has named repeatedly, now one layer deeper.',
  goals: [
    'Explain the JDBC architecture (DriverManager/Driver, Connection, Statement, ResultSet) and why the driver is a runtime-scope Maven dependency',
    'Write parameterized queries with PreparedStatement, and explain precisely why string-concatenated SQL is vulnerable to SQL injection while PreparedStatement is not',
    'Explain what a connection pool is, why establishing a raw database connection is expensive, and how a pool is structurally analogous to a thread pool',
    'Define atomicity, consistency, isolation, and durability with a concrete failure scenario each one prevents, and write a JDBC transaction using setAutoCommit(false)/commit()/rollback()',
    'Name the dirty-read, non-repeatable-read, and phantom-read anomalies, map them to isolation levels, and explain how improperly isolated test transactions cause the same flakiness this course has named in earlier lessons'
  ],
  concept: [
    {
      h: 'JDBC: the standard interface every Java database library sits on top of',
      p: [
        'JDBC (Java Database Connectivity) is a standard SET OF INTERFACES, defined in java.sql, that every relational database vendor provides an implementation of — a DRIVER. Application code is written entirely against the standard interfaces (Connection, Statement, ResultSet), never against a vendor-specific class, and the actual driver jar (the PostgreSQL driver, in LogPose\'s case) is what maven-fundamentals\' tech question named explicitly as a RUNTIME-scope Maven dependency: your code never imports a class BY NAME from that driver jar, it only references java.sql.Connection and friends, so the driver isn\'t needed to COMPILE — only to actually connect at runtime, when DriverManager.getConnection(url, user, password) locates and loads whichever driver matches the given JDBC URL\'s scheme (jdbc:postgresql://...).',
        'A <code>Connection</code> represents one open, authenticated session with the database — expensive to establish (the next section covers exactly why), and, like every resource this course has taught try-with-resources for, MUST be closed. A <code>Statement</code> sends a SQL string as-is; a <code>PreparedStatement</code> (the next section\'s focus) sends a PARAMETERIZED query, precompiled once by the database with placeholder <code>?</code> marks, then executed with actual values bound in separately. A <code>ResultSet</code> is a cursor over a query\'s returned rows — <code>rs.next()</code> advances it one row at a time, returning false once exhausted, and <code>rs.getString("column")</code>/<code>rs.getLong("column")</code> extract typed values from the current row — this is precisely the raw layer integration-testing\'s JdbcPaperRepository was built directly on top of, now given its own full explanation.'
      ]
    },
    {
      h: 'PreparedStatement: a performance win, and the concrete fix for SQL injection',
      p: [
        'A <code>PreparedStatement</code> is created with a SQL string containing <code>?</code> placeholders instead of literal values — <code>"SELECT * FROM authors WHERE name = ?"</code> — and the database PRECOMPILES this query\'s execution plan once, before any actual value is known; calling <code>ps.setString(1, value)</code> then binds an actual value into that first placeholder for one specific execution, and the SAME precompiled PreparedStatement can be re-executed with DIFFERENT bound values repeatedly, each time skipping the query-planning work a plain Statement would repeat from scratch every single call — a genuine, measurable performance win for any query run more than once.',
        'The security reason matters even more, and is worth stating with full precision: <code>PreparedStatement</code>\'s bound parameters are NEVER interpreted as SQL syntax, no matter what they contain — a value bound via <code>setString</code> is passed to the database as pure DATA, through a completely separate channel from the SQL text itself, so a malicious string like <code>\' OR \'1\'=\'1</code> bound as a parameter is compared literally, character for character, against the name column — it can never "break out" of being a value and start being interpreted as SQL. Building a query by STRING CONCATENATION instead — <code>"SELECT * FROM authors WHERE name = \'" + userInput + "\'"</code> — has no such separation: the user-supplied text becomes part of the ACTUAL SQL being parsed, so that same malicious string turns the query into <code>SELECT * FROM authors WHERE name = \'\' OR \'1\'=\'1\'</code>, a condition that\'s ALWAYS true, returning every row in the table regardless of what name was actually being searched for. This is SQL INJECTION — a well-documented, OWASP Top 10 vulnerability class, and the fix is not "sanitize the input more carefully" (a losing, incomplete-blocklist game), it\'s simply: never build a SQL string by concatenating untrusted input, full stop — use a PreparedStatement with bound parameters for every single value that ever originates outside your own code, with no exceptions carved out for "this one seems safe."'
      ]
    },
    {
      h: 'Connection pools: reusing expensive-to-establish connections, structurally like a thread pool',
      p: [
        'Opening a raw JDBC <code>Connection</code> is genuinely expensive — establishing a TCP connection to the database server, performing authentication, and the database allocating its own server-side session resources, realistically tens to hundreds of milliseconds. A web application handling many requests per second, each needing a database connection, cannot afford to open and close a brand-new raw connection for every single request — the connection-establishment overhead alone would dominate. A CONNECTION POOL (HikariCP is the current de facto standard in the Java ecosystem, often the default in Spring Boot) solves this exactly the way executors-futures\' thread pool solved the analogous problem for threads: maintain a bounded set of ALREADY-OPEN, already-authenticated connections ready to go, hand one out ("borrow") to whichever code needs it, and return it to the pool when done — reused for the NEXT request — rather than tearing it down and paying the establishment cost again.',
        'This is structurally the exact same shape of tradeoff as a thread pool: a bounded pool avoids both the cost of creating a resource from scratch on every use AND the danger of unbounded resource creation under load (opening thousands of simultaneous raw connections can itself overwhelm the database server) — and, just as an executors-futures thread pool needs sizing (too few threads under-utilizes available parallelism, too many creates contention), a connection pool needs a MAX size tuned to the database\'s actual capacity to handle concurrent connections, not simply set as large as possible "to be safe." A DataSource (java.sql or javax.sql, and the type integration-testing\'s JdbcPaperRepository was built against) is the standard abstraction a pooled connection provider implements — application code calls dataSource.getConnection() identically whether that DataSource is backed by a real pool or, as in a quick test, a single raw connection, exactly the same "program to the interface, not the implementation" discipline this course has returned to since Part 1.'
      ]
    },
    {
      h: 'ACID and transactions: atomicity, consistency, isolation, durability',
      p: [
        'A TRANSACTION groups multiple database operations so they succeed or fail TOGETHER, as one indivisible unit — JDBC defaults to AUTO-COMMIT mode (every individual statement commits immediately on its own), and calling <code>connection.setAutoCommit(false)</code> switches to manual control, where nothing is permanently applied until an explicit <code>connection.commit()</code>, or discarded entirely via <code>connection.rollback()</code>. ACID names the four guarantees a properly-used transaction provides. ATOMICITY: the transaction\'s operations happen ALL together or NOT AT ALL — inserting a new paper AND its initial reviewer assignments as one transaction means a failure partway through (say, the third reviewer insert fails) rolls back the paper insert too, rather than leaving an orphaned paper row with only two of three intended reviewers and no way to tell that was an accident rather than the real intent. CONSISTENCY: a transaction can only move the database from one VALID state to another — the CHECK/NOT NULL/foreign-key constraints sql-postgresql built are what actually enforce this; a transaction attempting to violate one is rejected, its partial effects rolled back automatically.',
        'ISOLATION: concurrently-running transactions should not see each other\'s uncommitted, in-progress changes — covered in full in the next section, since this is where the classic anomalies and the flaky-test connection live. DURABILITY: once a transaction commits, its effects survive — a server crash one microsecond after a successful commit must not lose that committed data, a guarantee the database\'s own write-ahead logging provides beneath the JDBC layer entirely; nothing in application code needs to do anything extra to get durability once commit() has genuinely returned successfully. The standard JDBC pattern combines all of this with try-with-resources and explicit rollback on failure: <code>try (Connection c = ds.getConnection()) { c.setAutoCommit(false); try { /* ...operations... */ c.commit(); } catch (SQLException e) { c.rollback(); throw e; } }</code> — note the connection itself is STILL closed via try-with-resources regardless of whether commit or rollback ran, exactly the exceptions lesson\'s discipline, now composed with transactional control.'
      ]
    },
    {
      h: 'Isolation levels, the three classic anomalies, and the flaky-test connection',
      p: [
        'Three named ANOMALIES describe specific ways concurrent transactions can interfere if isolation is too weak. A DIRTY READ: transaction A reads a value transaction B has written but NOT YET committed — if B then rolls back, A has now acted on data that, from the database\'s final, true history, never actually existed. A NON-REPEATABLE READ: transaction A reads the same row TWICE within one transaction and gets DIFFERENT values, because transaction B committed a change to that row in between A\'s two reads. A PHANTOM READ: transaction A runs the same WHERE-clause query twice and gets a DIFFERENT SET OF ROWS the second time, because transaction B inserted or deleted a row matching that condition in between. JDBC\'s isolation levels, from weakest to strongest, permit progressively fewer of these: <code>READ_UNCOMMITTED</code> (all three possible — rarely used, and NOT actually implemented as truly read-uncommitted by PostgreSQL, which treats it identically to READ_COMMITTED), <code>READ_COMMITTED</code> (PostgreSQL\'s default — no dirty reads, but non-repeatable and phantom reads remain possible), <code>REPEATABLE_READ</code> (no dirty or non-repeatable reads; PostgreSQL\'s specific implementation, via snapshot isolation, also prevents phantoms, though the SQL standard doesn\'t strictly require that), and <code>SERIALIZABLE</code> (the strictest — transactions behave as if run one at a time in some serial order, preventing all three anomalies, at the highest cost to concurrency).',
        'This closes a direct loop back to tdd-coverage-flaky-tests\' category-1 taxonomy entry (shared mutable state / test-order dependence): a test suite where multiple tests share ONE connection pool and don\'t properly wrap each test\'s database work in its OWN transaction, rolled back in @AfterEach (rather than integration-testing\'s TRUNCATE-based reset, an equally valid alternative), can produce EXACTLY the dirty-read/non-repeatable-read symptom pattern between tests running concurrently — a parallel test runner\'s Test A reading data Test B is mid-writing-and-about-to-roll-back is a dirty read by definition, producing a result that depends on execution timing rather than either test\'s own logic, the textbook flaky-test signature this course keeps returning to. The general principle, restated one more time at the database layer specifically: choose the WEAKEST isolation level that\'s still actually SAFE for the real concurrent access pattern in question (stronger isolation costs real throughput), but never accept an isolation gap as an acceptable source of test flakiness — a flaky test caused by transaction isolation gets the exact same "find the actual root cause, don\'t just retry" treatment as every other category in that lesson\'s taxonomy.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Nami\'s trade ledger: a fixed order template, a pool of trusted contacts, and an all-or-nothing exchange',
      text: 'Nami never personally hikes into a port\'s vault to negotiate a trade herself — she goes through that port\'s designated TRADE OFFICER, following the SAME standardized request form regardless of which port the crew happens to be docked at (JDBC\'s standard interfaces, implemented differently by each database\'s own driver underneath). When Nami actually RECORDS a trade, she never lets the other party hand her a filled-in ledger page to copy verbatim into the Sunny\'s official books — she uses a FIXED, pre-approved ledger TEMPLATE with blank slots for quantity and price, and whatever the trader tells her gets written strictly as a VALUE into that blank slot, never as a new instruction to the ledger itself (a PreparedStatement\'s bound parameter, treated purely as data). This is exactly why a devious trader once tried writing "500 barrels, also erase our debt to the Baratie" into what should have been a simple quantity field, and it did NOTHING — the fixed template has no mechanism for a blank VALUE to somehow become a new ledger COMMAND, unlike the one time a careless, overworked clerk on a DIFFERENT ship just literally copied whatever a trader dictated straight into that ship\'s raw, freeform ledger, and got robbed blind by exactly that trick (string-concatenated SQL, vulnerable to injection). Rather than formally re-establishing trust and credentials with a brand-new port contact from absolute zero every single time a trade is needed, the crew maintains a small, ready POOL of already-vetted trade contacts across the ports they visit often — instantly usable, handed back to the pool when the trade\'s done, never re-verified from scratch each time (a connection pool). And when the Sunny trades barrels of rum for payment, Nami is absolute about one rule: the WHOLE exchange happens together, or NONE of it does — never rum leaving the hold with no payment received, never payment taken with no rum handed over; if a storm interrupts the exchange halfway through, she rolls the ENTIRE trade back rather than leave the ledger and the cargo hold disagreeing about what actually happened (atomicity, commit, and rollback). And she is fanatical about one more thing: if Zoro glances at the treasure count WHILE a trade is still mid-exchange, not yet finalized, he might see a number that gets REVERSED entirely if that trade later falls through — a dirty read of data that, in the ledger\'s true final history, never actually happened — which is exactly why the crew never lets a training drill run against the SAME shared ledger another drill is still mid-updating, without properly closing out each drill\'s own books first.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s bank transfer: a fixed withdrawal slip, a pool of authenticated tellers, and an all-or-nothing transfer',
      text: 'Sheldon never personally walks into the bank\'s vault to move money himself — he goes through a designated TELLER, following the exact same standardized request form regardless of which specific branch he happens to be at (JDBC\'s standard interfaces, implemented differently by each bank\'s own systems underneath). When Sheldon actually REQUESTS a transfer, the teller never lets him hand over a blank check to fill in however he pleases and just copy it verbatim into the bank\'s official system — the teller uses a FIXED withdrawal-slip template with blank fields for amount and destination account, and whatever Sheldon writes gets treated strictly as a VALUE in that blank field, never as a new instruction to the banking system itself (a PreparedStatement\'s bound parameter, treated purely as data). This is exactly why, when a con artist once tried scrawling "500, also transfer all of Leonard\'s savings to me" into what should have been a simple amount field, it did NOTHING — the fixed slip has no mechanism for a blank VALUE to somehow become a new banking COMMAND, unlike the one infamous local bank branch that let a rogue teller just literally retype whatever a customer dictated straight into the bank\'s raw command system, and got exploited badly by exactly that trick (string-concatenated SQL, vulnerable to injection). Rather than re-verifying a brand-new teller\'s credentials and opening a fresh line from absolute zero for every single customer, the bank keeps a small pool of ALREADY-authenticated teller lines open and ready, handed out to whichever customer needs one and returned when done, never rebuilt from scratch each time (a connection pool). And when Sheldon reimburses Leonard for a shared physics-conference expense, he insists on one rule with characteristic fanaticism: the WHOLE transfer happens together, or NOT AT ALL — never money deducted from his account with nothing arriving in Leonard\'s, never the reverse; if the bank\'s system hiccups mid-transfer, the ENTIRE thing rolls back rather than leaving the two accounts disagreeing about what actually happened (atomicity, commit, and rollback). And Sheldon is adamant about one more thing: if Amy checks the joint account balance WHILE a transfer is still pending, not yet finalized, she might see a number that gets REVERSED entirely if that transfer later fails — a dirty read of a number that, in the account\'s true final history, never actually existed — which is precisely why he refuses to let two of his own meticulous "trial runs" of a new budgeting system share the SAME live ledger without each one properly closing its own books first.',
    },
    why: 'The fixed ledger/withdrawal-slip TEMPLATE, with a trader/customer\'s input only ever filling a blank VALUE slot, is exactly what PreparedStatement\'s parameter binding does — and the careless clerk/rogue teller who just copies raw dictated text into a command system is SQL injection via string concatenation. The pool of already-vetted trade contacts / already-authenticated teller lines is a connection pool, avoiding the real cost of re-establishing trust from scratch every time. The all-or-nothing rum-for-payment exchange / reimbursement transfer, rolled back entirely on failure, is atomicity plus commit/rollback. And Zoro\'s / Amy\'s glimpse of a number that later gets reversed because the underlying trade/transfer was never actually finalized is a dirty read — precisely the anomaly isolation levels exist to prevent, and precisely the same shared-ledger contamination this course has named as flaky-test-causing state leakage in every earlier lesson that touched it.'
  },
  storyAnim: {
    title: 'A fixed template, a pool of trusted contacts, and an exchange that\'s all-or-nothing',
    h: 340,
    props: [
      { id: 'template', emoji: '📋', label: 'a FIXED ledger template -- input fills a blank VALUE, never a new command (PreparedStatement)', x: 6, y: 8 },
      { id: 'injected', emoji: '💀', label: 'a careless clerk copies raw dictated text into the command system (SQL injection)', x: 30, y: 8 },
      { id: 'pool', emoji: '🤝', label: 'a POOL of already-vetted contacts, reused instantly (connection pool)', x: 54, y: 8 },
      { id: 'exchange', emoji: '⚖️', label: 'rum for payment: BOTH happen or NEITHER does (atomicity)', x: 78, y: 8 },
      { id: 'storm', emoji: '🌩️', label: 'a storm mid-exchange -- the WHOLE trade rolls back (rollback)', x: 30, y: 50 },
      { id: 'dirtyread', emoji: '👁️', label: 'Zoro glimpses a number mid-trade that later gets REVERSED (dirty read)', x: 60, y: 50 }
    ],
    actors: [
      { id: 'nami', emoji: '🧭', label: 'Nami', x: 20, y: 78 },
      { id: 'zoro', emoji: '⚔️', label: 'Zoro', x: 70, y: 78 }
    ],
    steps: [
      { c: 'Nami records every trade on a FIXED template -- whatever the trader says only ever fills a blank VALUE slot, never a new instruction.', p: { template: 'lit' }, a: { nami: [20, 30] } },
      { c: 'A careless clerk on another ship just copies raw dictated text straight into the command system -- a devious trader can rewrite the ledger\'s own instructions. That\'s SQL injection.', p: { injected: 'bad' } },
      { c: 'Rather than re-vetting a brand-new port contact from scratch every time, the crew reuses a POOL of already-trusted contacts.', p: { pool: 'lit' } },
      { c: 'Trading rum for payment: Nami insists BOTH happen together, or NEITHER does.', p: { exchange: 'lit' }, a: { nami: [78, 30] } },
      { c: 'A storm interrupts the exchange halfway through -- the WHOLE trade rolls back rather than leaving the books half-updated.', p: { storm: 'bad' } },
      { c: 'Zoro glances at the treasure count mid-trade and sees a number that later gets reversed when the trade falls through. That\'s a dirty read.', p: { dirtyread: 'bad' }, a: { zoro: [60, 60] } }
    ]
  },
  conceptFlow: {
    title: 'From JDBC\'s standard interface to PreparedStatement to pools to ACID and isolation',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'JDBC layer',
        nodes: [
          { id: 'driver', text: 'DriverManager + Driver:\nruntime-scope, vendor-specific' },
          { id: 'coretypes', text: 'Connection, Statement,\nPreparedStatement, ResultSet' }
        ]
      },
      {
        label: 'PreparedStatement & injection',
        nodes: [
          { id: 'bound', text: 'bound parameters = DATA,\nnever interpreted as SQL' },
          { id: 'injection', text: 'string concatenation lets input\nBECOME SQL syntax (injection)' }
        ]
      },
      {
        label: 'Connection pools',
        nodes: [
          { id: 'expensive', text: 'a raw Connection is\nexpensive to establish' },
          { id: 'poolreuse', text: 'a pool reuses open connections --\nstructurally like a thread pool' }
        ]
      },
      {
        label: 'ACID & isolation',
        nodes: [
          { id: 'acid', text: 'Atomicity, Consistency,\nIsolation, Durability' },
          { id: 'anomalies', text: 'dirty read, non-repeatable read,\nphantom read' },
          { id: 'flakylink', text: 'unisolated test transactions =\nthe same shared-state flakiness' }
        ]
      }
    ],
    steps: [
      { active: ['driver'], note: 'DriverManager loads the vendor-specific driver matching a JDBC URL at runtime -- application code never depends on it at compile time.' },
      { active: ['coretypes'], note: 'Connection is an open session; Statement/PreparedStatement send SQL; ResultSet is a cursor over returned rows.' },
      { active: ['bound'], note: 'A PreparedStatement\'s bound parameters travel to the database as pure data, through a channel entirely separate from the SQL text -- they can never be interpreted as new SQL syntax.' },
      { active: ['injection'], note: 'String-concatenated SQL has no such separation -- untrusted input becomes part of the actual SQL being parsed, letting a crafted value change the query\'s meaning entirely.' },
      { active: ['expensive'], note: 'Opening a raw connection means a TCP handshake, authentication, and server-side session setup -- tens to hundreds of milliseconds, too slow to repeat per request.' },
      { active: ['poolreuse'], note: 'A connection pool maintains already-open connections, borrowed and returned -- the same bounded-reusable-resource shape as a thread pool.' },
      { active: ['acid'], note: 'Atomicity (all-or-nothing), Consistency (valid states only), Isolation (concurrent transactions don\'t interfere), Durability (committed means permanent).' },
      { active: ['anomalies'], note: 'Dirty read (seeing uncommitted data), non-repeatable read (the same row changes value between two reads), phantom read (the same query returns a different row set).' },
      { active: ['flakylink'], note: 'A test suite sharing a connection pool without properly isolating each test\'s transaction reproduces the exact same shared-state flakiness signature this course has named repeatedly.' }
    ]
  },
  tech: [
    {
      q: 'Explain precisely why binding a value via PreparedStatement.setString(1, value) makes SQL injection structurally impossible for that parameter, in terms of HOW the value reaches the database — not just "it escapes special characters."',
      a: 'The precise mechanism is a separation of CHANNELS, not character escaping. When a PreparedStatement is created, the SQL text (with ? placeholders) is sent to the database and PARSED/COMPILED into an execution plan FIRST, before any bound value is even known — the placeholders mark exactly where a value will later be substituted, but the query\'s STRUCTURE is already fixed at that point. When setString(1, value) is later called and the statement executed, the bound value is transmitted to the database through a SEPARATE protocol-level channel specifically for parameter DATA, not by being spliced back into the SQL text and re-parsed. This means a value like `\\\' OR \\\'1\\\'=\\\'1` is never even seen by the SQL parser as characters that could form syntax at all — the parser already finished its work using the placeholder, and the bound value is handed directly to the already-fixed query plan as a literal value to compare against, with no parsing step left for it to influence. This is a fundamentally different (and structurally stronger) guarantee than character-escaping-based sanitization, which works by trying to neutralize DANGEROUS characters before they reach a string that WILL still be parsed as SQL — escaping can be incomplete, forgotten for some input path, or bypassed by an encoding trick the sanitization logic didn\'t anticipate; a bound PreparedStatement parameter has no parsing step to bypass in the first place, because the SQL structure was already finalized before the value was ever supplied.'
    },
    {
      q: 'A connection pool is configured with a maximum size of 10. Under a burst of 50 concurrent requests, what happens to requests 11 through 50, and why is simply setting the maximum size very high the wrong fix?',
      a: 'Requests 11 through 50 do not fail immediately — they BLOCK (wait) for a connection to become available, typically up to a configured timeout, and are served as soon as one of the first 10 requests finishes and RETURNS its borrowed connection to the pool; if the timeout elapses before a connection frees up, the pool throws a timeout exception rather than waiting forever. Simply raising the maximum pool size very high to avoid this waiting is the wrong fix for a reason directly analogous to over-sizing a thread pool: the database server ITSELF has a real, finite limit on how many concurrent connections (and the server-side resources — memory, lock tables, query-executor threads — each one consumes) it can handle efficiently; opening far more simultaneous connections than the database can actually service well doesn\'t remove the bottleneck, it just moves it from "waiting in the connection pool\'s queue" to "the database itself thrashing under more concurrent work than it can efficiently execute," often making actual throughput WORSE, not better, past a certain point. The right fix, when 50 concurrent requests genuinely need to be served promptly, addresses the real bottleneck directly: increase the pool size only up to what the database can genuinely handle well (a number the database\'s own configuration and hardware dictate, not an arbitrary large constant), and/or investigate why each connection is held so long that 10 aren\'t enough to keep up (a slow query, a connection held open longer than necessary) — the same "diagnose the real constraint, don\'t just throw more of the resource at the symptom" discipline this course has applied to thread pools and, in tdd-coverage-flaky-tests, to flaky-test fixes in general.'
    },
    {
      q: 'A method inserts a paper row, then inserts three review rows in a loop, all within one transaction. The second review insert fails due to a constraint violation. Walk through exactly what state the database is in immediately after the exception is caught but BEFORE rollback() is called, and immediately after rollback() completes.',
      a: 'Immediately after the exception is caught but BEFORE rollback() is called: the transaction is in a peculiar, important intermediate state — the paper row and the FIRST review row have genuinely been sent to and processed by the database as part of this open, uncommitted transaction, and if you were to (incorrectly) query the database from a COMPLETELY SEPARATE connection at this exact moment, under any isolation level stronger than the (effectively unused in Postgres) READ_UNCOMMITTED, you would NOT see the paper or the first review row yet at all — they exist only within this transaction\'s own, still-open, uncommitted view, invisible to any other transaction until and unless a commit happens. The failed second review insert itself was rejected outright by the constraint check and never applied. Immediately after rollback() completes: the ENTIRE transaction\'s effects are discarded — not just the failed second insert, but ALSO the paper row and the successfully-inserted first review row, which are now as if they had never been sent to the database at all; this is precisely atomicity in action, and precisely why the operation must be wrapped in one transaction rather than three independent auto-committed statements — without the transaction, the paper row and first review row would have been PERMANENTLY committed the instant each individual statement ran (JDBC\'s auto-commit default), leaving an orphaned paper with only one of its three intended reviews and no transactional way to undo that partial state after the fact.'
    },
    {
      q: 'Two tests in an integration test suite share one connection pool. Test A begins a transaction, inserts a paper, and is in the middle of inserting its reviews (not yet committed) when Test B, running concurrently under READ_COMMITTED isolation, queries the papers table for a count. What does Test B see, and how does this differ under SERIALIZABLE isolation?',
      a: 'Under READ_COMMITTED (PostgreSQL\'s default), Test B does NOT see Test A\'s uncommitted paper row at all — READ_COMMITTED specifically prevents dirty reads, meaning a transaction only ever sees data from OTHER transactions that has actually been COMMITTED, never a concurrently-running transaction\'s in-progress, uncommitted changes; Test B\'s count query reflects the database\'s state as of the last commit that happened before Test B\'s query started, with Test A\'s pending insert simply not factored in yet. This sounds safe, and for the DIRTY-READ anomaly specifically it is — but it doesn\'t fully solve the flakiness risk: if Test A\'s transaction SUBSEQUENTLY commits successfully a moment later, and Test B (or a THIRD test) runs the exact same count query again shortly after, it will now see a DIFFERENT result than it did a moment before, purely due to timing relative to Test A\'s commit — non-repeatable-read-shaped nondeterminism at the SUITE level, exactly the "passes sometimes, fails other times, no code change" flaky signature, caused here by two tests genuinely running concurrently against shared underlying data rather than being isolated from each other at the TEST level (via each test\'s own transaction, rolled back, or the schema being reset between runs). SERIALIZABLE isolation doesn\'t actually change Test B\'s IMMEDIATE dirty-read-avoidance behavior here (READ_COMMITTED already avoids the dirty read) — but it would detect and abort with a serialization-failure error any situation where the two transactions\' combined effects couldn\'t be made consistent with SOME valid one-at-a-time ordering, forcing an explicit retry rather than silently allowing inconsistent-looking results to slip through. The real fix for the test suite, though, is neither isolation level — it\'s test-level isolation: each test\'s database work should run in its OWN transaction, rolled back after that test finishes, so Test A\'s and Test B\'s data never coexist in a way either test could observe at all, regardless of which isolation level the underlying connections use.'
    }
  ],
  code: {
    title: 'PreparedStatement vs. string concatenation, and an atomic multi-insert transaction',
    intro: 'The SQL-injection contrast (shown as a commented-out anti-pattern, never actually executed), followed by a real transactional method: inserting a paper and its initial reviewer assignments as one atomic unit, rolling back entirely if any part fails.',
    code: `import java.sql.*;
import javax.sql.DataSource;
import java.util.List;

class PaperSubmissionService {
    private final DataSource dataSource;   // backed by a real connection pool in production

    PaperSubmissionService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    // --- DO NOT DO THIS: string concatenation lets user input become SQL syntax ---
    // String sql = "SELECT * FROM authors WHERE name = '" + userSuppliedName + "'";
    // If userSuppliedName is:  ' OR '1'='1
    // the query becomes:  SELECT * FROM authors WHERE name = '' OR '1'='1'  -- returns EVERY row

    // --- CORRECT: the bound parameter is DATA, never SQL syntax, no matter its content ---
    List<Long> findAuthorIdsByName(String name) throws SQLException {
        String sql = "SELECT id FROM authors WHERE name = ?";
        List<Long> ids = new java.util.ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, name);   // the exact same malicious string is now just a literal value
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ids.add(rs.getLong("id"));
                }
            }
        }
        return ids;
    }

    // an ATOMIC transaction: the paper insert and every review insert succeed together, or none do
    void submitWithReviewers(String title, long authorId, List<String> reviewers) throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);   // begin a manual transaction
            try {
                long paperId = insertPaper(conn, title, authorId);
                for (String reviewer : reviewers) {
                    insertPendingReview(conn, paperId, reviewer);
                }
                conn.commit();   // all inserts become permanent together
            } catch (SQLException e) {
                conn.rollback();   // undo the paper insert too if ANY review insert failed
                throw e;
            }
        }
    }

    private long insertPaper(Connection conn, String title, long authorId) throws SQLException {
        String sql = "INSERT INTO papers (title, author_id) VALUES (?, ?) RETURNING id";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, title);
            ps.setLong(2, authorId);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getLong("id");
            }
        }
    }

    private void insertPendingReview(Connection conn, long paperId, String reviewer) throws SQLException {
        String sql = "INSERT INTO reviews (paper_id, reviewer, score) VALUES (?, ?, NULL)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, paperId);
            ps.setString(2, reviewer);
            ps.executeUpdate();
        }
    }
}`,
    notes: [
      'findAuthorIdsByName uses setString to bind name -- the exact injection payload shown in the commented-out anti-pattern above it is completely neutralized, treated as a literal value to compare, never as SQL.',
      'score is inserted as NULL for a pending review -- sql-postgresql\'s CHECK (score BETWEEN 1 AND 5) constraint is NOT violated by NULL, since a CHECK only rejects values that evaluate the expression to FALSE, and comparing NULL to anything evaluates to NULL (neither true nor false), which PostgreSQL treats as passing.',
      'submitWithReviewers wraps the paper insert AND every review insert in one transaction -- if the second reviewer insert throws (a duplicate, a constraint violation), rollback() undoes the ALREADY-successful paper insert and first review insert too, leaving no orphaned partial state.',
      'The Connection itself is still closed via try-with-resources regardless of whether commit() or rollback() ran -- the resource-cleanup guarantee and the transactional-outcome guarantee are two separate, independently-handled concerns.'
    ]
  },
  lab: {
    title: 'Write an atomic, injection-safe method to record an editorial decision',
    prompt: 'LogPose adds a <code>decisions</code> table: <code>CREATE TABLE decisions (id BIGSERIAL PRIMARY KEY, paper_id BIGINT NOT NULL REFERENCES papers(id) ON DELETE CASCADE, editor TEXT NOT NULL, decision TEXT NOT NULL CHECK (decision IN (\'accept\',\'reject\')), decided_at TIMESTAMPTZ NOT NULL DEFAULT now())</code>. Write a Java method <code>void recordDecision(DataSource dataSource, long paperId, String editor, String decision)</code> that: (1) gets a <code>Connection</code> from the <code>DataSource</code> using try-with-resources; (2) calls <code>setAutoCommit(false)</code>; (3) inside a try/catch, uses a <code>PreparedStatement</code> with <code>?</code> placeholders (never string concatenation) to insert a row into <code>decisions</code> with the given <code>paperId</code>, <code>editor</code>, and <code>decision</code>; (4) calls <code>commit()</code> on success; (5) calls <code>rollback()</code> and rethrows the exception on failure.',
    starter: `import java.sql.*;
import javax.sql.DataSource;

class DecisionRecorder {

    void recordDecision(DataSource dataSource, long paperId, String editor, String decision) throws SQLException {
        // TODO: try-with-resources to get a Connection from dataSource
        // TODO: conn.setAutoCommit(false)
        // TODO: try { insert into decisions via PreparedStatement with ? placeholders; conn.commit(); }
        // TODO: catch (SQLException e) { conn.rollback(); throw e; }
    }
}`,
    checks: [
      { re: 'try\\s*\\(\\s*Connection\\s+conn\\s*=\\s*dataSource\\.getConnection\\(\\)\\s*\\)', must: true, hint: 'Get the Connection via try-with-resources: try (Connection conn = dataSource.getConnection()).', pass: 'try-with-resources Connection ✓' },
      { re: 'conn\\.setAutoCommit\\(\\s*false\\s*\\)', must: true, hint: 'Call conn.setAutoCommit(false) to begin a manual transaction.', pass: 'setAutoCommit(false) called ✓' },
      { re: 'INSERT\\s+INTO\\s+decisions', must: true, hint: 'The SQL must INSERT INTO decisions.', pass: 'INSERT INTO decisions ✓' },
      { re: 'PreparedStatement', must: true, hint: 'Use a PreparedStatement, not a plain Statement.', pass: 'PreparedStatement used ✓' },
      { re: '\\?\\s*,\\s*\\?\\s*,\\s*\\?', must: true, hint: 'The INSERT should use three ? placeholders (paper_id, editor, decision) rather than concatenated values.', pass: 'parameterized placeholders used ✓' },
      { re: 'conn\\.commit\\(\\)', must: true, hint: 'Call conn.commit() after a successful insert.', pass: 'commit() called ✓' },
      { re: 'conn\\.rollback\\(\\)', must: true, hint: 'Call conn.rollback() in the catch block before rethrowing.', pass: 'rollback() called ✓' }
    ],
    run: 'mvn test — against the decisions schema, a successful call commits exactly one new row; a call that fails (e.g. an invalid decision value violating the CHECK constraint) rolls back with no partial row left behind.',
    solution: `import java.sql.*;
import javax.sql.DataSource;

class DecisionRecorder {

    void recordDecision(DataSource dataSource, long paperId, String editor, String decision) throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try {
                String sql = "INSERT INTO decisions (paper_id, editor, decision) VALUES (?, ?, ?)";
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setLong(1, paperId);
                    ps.setString(2, editor);
                    ps.setString(3, decision);
                    ps.executeUpdate();
                }
                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        }
    }
}`,
    notes: [
      'editor and decision are bound via setString, never concatenated into the SQL text -- even a maliciously crafted editor name cannot alter the INSERT statement\'s structure.',
      'The decisions.decision CHECK constraint (\'accept\' or \'reject\' only) is enforced by the database regardless of what Java-side validation may or may not exist -- an invalid value throws a SQLException, caught here and turned into a clean rollback rather than a half-applied insert.',
      'The Connection is closed via try-with-resources in every case -- success, a caught-and-rethrown SQLException, or any other exception -- exactly the resource-cleanup guarantee independent of the transactional outcome.'
    ]
  },
  quiz: [
    {
      q: 'Why is a JDBC driver jar (e.g. the PostgreSQL driver) declared with RUNTIME scope in Maven rather than COMPILE scope?',
      options: ['Application code only ever references the standard java.sql interfaces (Connection, PreparedStatement) at compile time -- the vendor-specific driver class is located and loaded by DriverManager only when the program actually runs', 'Runtime scope makes the driver load faster than compile scope', 'PostgreSQL drivers cannot be compiled against at all due to licensing restrictions', 'Compile scope is reserved exclusively for test-only dependencies'],
      correct: 0,
      explain: 'Code compiles against java.sql\'s standard interfaces, never importing a driver class by name -- the driver is only needed when DriverManager actually connects at runtime, which is exactly what runtime scope means.'
    },
    {
      q: 'What makes PreparedStatement structurally immune to SQL injection for its bound parameters, as opposed to just harder to exploit?',
      options: ['Bound parameters are transmitted to the database as pure data through a channel separate from the SQL text, which was already parsed and compiled before any value was supplied -- there is no parsing step left for a malicious value to influence', 'PreparedStatement automatically deletes any special characters like quotes from bound values before sending them', 'PreparedStatement refuses to execute if a bound value contains the word SQL', 'PreparedStatement is immune because it only accepts numeric parameter values, never strings'],
      correct: 0,
      explain: 'The SQL structure is fixed at prepare time, before any value is bound. A bound value is handed to the already-fixed query plan as literal data, with no remaining parsing step for it to alter -- structurally different from (and stronger than) character-escaping-based sanitization.'
    },
    {
      q: 'A connection pool has a max size of 10, and 15 concurrent requests arrive. What happens to the 5 requests beyond the pool\'s capacity?',
      options: ['They block, waiting for a connection to be returned to the pool by one of the first 10 requests, up to a configured timeout', 'They are immediately rejected with a permanent error and must be resubmitted from scratch', 'The pool automatically and silently creates 5 additional connections beyond its configured maximum', 'They are served by falling back to a raw, unpooled connection instead'],
      correct: 0,
      explain: 'A connection pool with a fixed max size makes excess requests wait (block) for a connection to free up, rather than failing immediately or silently exceeding its configured limit -- the same bounded-resource behavior a thread pool exhibits under more work than its size allows.'
    },
    {
      q: 'A transaction inserts a paper row, then fails partway through inserting its review rows, and rollback() is called. What happens to the paper row that was already successfully inserted earlier in the SAME transaction?',
      options: ['It is also rolled back -- atomicity means the transaction\'s effects are all-or-nothing, so a failure anywhere in the transaction undoes everything the transaction did, not just the specific failed statement', 'It remains permanently in the database, since it was already successfully inserted before the failure occurred', 'It is left in an undefined, database-vendor-specific state', 'It is automatically retried until it succeeds independently of the failed review inserts'],
      correct: 0,
      explain: 'Atomicity guarantees all of a transaction\'s operations succeed together or are undone together. The earlier successful paper insert is rolled back along with the failed review insert, since both are part of the same uncommitted transaction.'
    },
    {
      q: 'Two integration tests share one connection pool but do NOT wrap each test\'s database work in its own rolled-back transaction. What flaky-test symptom, from this course\'s taxonomy, does this most directly risk?',
      options: ['Shared mutable state / test-order and timing dependence -- one test can observe another\'s in-progress or just-committed data depending on execution timing, producing results that vary run to run with no code change', 'Compile-time errors that prevent the test suite from building at all', 'A permanent, deterministic failure that happens identically on every single run, regardless of timing', 'Increased mutation testing scores, since more database interaction increases the number of mutants generated'],
      correct: 0,
      explain: 'Without per-test transactional isolation, concurrently-running tests can observe each other\'s uncommitted or recently-committed changes depending purely on timing -- the same shared-mutable-state, order/timing-dependent flakiness signature this course\'s taxonomy names repeatedly, now at the database transaction level.'
    }
  ],
  testFlow: {
    title: 'Test yourself: PreparedStatement safety, pooling, and ACID',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A developer argues: "We escape single quotes in user input before building our SQL string, so we don\'t strictly need PreparedStatement." Evaluate this reasoning.',
        choices: [
          { text: 'This is risky and incomplete -- manual escaping must anticipate every possible dangerous character/encoding for the specific database in use, and a single missed case reopens the vulnerability, whereas PreparedStatement has no parsing step left for a bound value to influence at all', to: 'q1_right' },
          { text: 'This is a completely safe, equivalent alternative to PreparedStatement, since both approaches ultimately produce injection-safe SQL', to: 'q1_wrong_equivalent' },
          { text: 'This is unnecessary in either case, since modern databases automatically detect and block SQL injection attempts', to: 'q1_wrong_automatic' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- manual escaping is a blocklist-style defense that must correctly anticipate every dangerous character and encoding; PreparedStatement is structurally different, since the SQL structure is already fixed before any value is bound, leaving no parsing step for an escaping gap to exploit.', next: 'q2' },
      q1_wrong_equivalent: { end: true, correct: false, text: 'These are not equivalent in robustness -- escaping depends on correctly anticipating every dangerous input pattern for a specific database, and historically, escaping implementations have had real, exploitable gaps. PreparedStatement removes the entire class of risk structurally, not by more careful escaping.', retry: 'q1' },
      q1_wrong_automatic: { end: true, correct: false, text: 'Databases do not automatically detect and block SQL injection -- a database has no way to distinguish "legitimate SQL built by careful application code" from "SQL injected via unescaped concatenated input," since by the time it reaches the database, both look like ordinary SQL text.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'Why does a connection pool make a DataSource, not a raw Connection, the right abstraction for application code to depend on?',
        choices: [
          { text: 'Application code calling dataSource.getConnection() works identically whether the DataSource is backed by a real pool or a single raw connection -- exactly the "program to an interface" discipline, letting the pooling implementation be swapped without changing calling code', to: 'q2_right' },
          { text: 'DataSource is required because raw Connection objects cannot execute PreparedStatement queries at all', to: 'q2_wrong_cantexecute' },
          { text: 'DataSource exists purely for historical reasons and has no functional advantage over directly using DriverManager', to: 'q2_wrong_historical' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- DataSource is the standard abstraction a pooled (or unpooled) connection provider implements, letting application code stay identical regardless of which implementation backs it, the same interface-based discipline this course has applied since Part 1.', next: 'q3' },
      q2_wrong_cantexecute: { end: true, correct: false, text: 'A raw Connection obtained directly (e.g. via DriverManager) can execute PreparedStatement queries just as well as one obtained from a pooled DataSource -- the difference is about connection REUSE and lifecycle management, not query execution capability.', retry: 'q2' },
      q2_wrong_historical: { end: true, correct: false, text: 'DataSource has a real, functional purpose: it lets application code depend on a stable interface while the actual connection-provisioning strategy (pooled, unpooled, or something else entirely) varies underneath, without any calling code changing.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A transaction under READ_COMMITTED isolation reads the same row twice, and gets a different value the second time because another transaction committed a change in between. Which anomaly is this, and would REPEATABLE_READ prevent it?',
        choices: [
          { text: 'A non-repeatable read -- REPEATABLE_READ isolation is specifically named for preventing exactly this: once a transaction reads a row, that same transaction will see the same value if it reads that row again, even if another transaction commits a change in between', to: 'q3_right' },
          { text: 'A dirty read -- and no isolation level can prevent it, since dirty reads are an unavoidable cost of any concurrent database access', to: 'q3_wrong_dirty' },
          { text: 'A phantom read -- and only SERIALIZABLE isolation, never REPEATABLE_READ, can prevent it', to: 'q3_wrong_phantom' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- reading the SAME row twice within one transaction and getting different values because another transaction committed in between is precisely the non-repeatable-read anomaly, and REPEATABLE_READ isolation is named for eliminating exactly it.', next: null },
      q3_wrong_dirty: { end: true, correct: false, text: 'A dirty read specifically involves seeing UNCOMMITTED data from another transaction. Here, the other transaction genuinely COMMITTED its change -- the issue is that a value changed between two reads within one transaction, which is the non-repeatable-read anomaly, and READ_COMMITTED (let alone REPEATABLE_READ) already prevents dirty reads.', retry: 'q3' },
      q3_wrong_phantom: { end: true, correct: false, text: 'A phantom read specifically involves a QUERY returning a different SET OF ROWS (due to inserts/deletes matching a WHERE condition) on a second run, not the same single row changing value -- that is the non-repeatable-read anomaly, which REPEATABLE_READ is specifically designed to prevent.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Building SQL by string concatenation with any value that originates outside your own code, even "just this one field that seems safe" -- use a PreparedStatement with bound parameters for every external value, with no exceptions.',
    'Sizing a connection pool as large as possible "to be safe" instead of matching it to what the database can actually handle concurrently -- an oversized pool can push contention onto the database server itself rather than eliminating it.',
    'Forgetting that JDBC defaults to auto-commit mode -- a sequence of statements meant to be atomic will each commit individually and immediately unless setAutoCommit(false) is called first.',
    'Calling commit() or rollback() without ensuring the Connection itself still gets closed afterward -- wrap the whole transaction in try-with-resources so the connection is returned to the pool regardless of outcome.',
    'Assuming a stronger isolation level (like SERIALIZABLE) is always the safe default -- stronger isolation has a real concurrency/throughput cost; choose the weakest level that\'s still actually safe for the real access pattern.',
    'Letting integration tests share a connection pool without giving each test its own transaction (rolled back after) or an equivalent reset -- reproduces the exact shared-mutable-state flakiness this course\'s taxonomy names, now at the database layer.'
  ],
  interview: [
    {
      q: 'A colleague says "We use an ORM, so we don\'t need to worry about SQL injection or PreparedStatement anymore." Evaluate this claim precisely.',
      a: 'The claim is largely true for the ORM\'s OWN generated queries, but dangerously incomplete as a blanket statement, and the precise boundary matters. Modern ORMs (Hibernate, arriving in jpa-hibernate) generate their actual SQL using PreparedStatement-style parameter binding under the hood for standard operations — find-by-id, save, and criteria-API-style queries all bind values as parameters, not as concatenated string literals, so injection risk for these standard, ORM-generated code paths is genuinely eliminated the same way hand-written PreparedStatement code eliminates it. Where the claim breaks down: most ORMs ALSO offer an escape hatch for writing raw or near-raw query strings for cases the standard API can\'t express cleanly (JPQL/HQL string queries with concatenated values, or native SQL query methods) — and if a developer builds one of THOSE query strings by concatenating user input directly, exactly the same injection vulnerability reappears, entirely unprotected by the ORM\'s general safety, because at that point the code has stepped outside the ORM\'s parameter-binding machinery and is doing exactly the unsafe string-concatenation thing PreparedStatement exists to prevent. The precise, correct version of the claim: an ORM used through its STANDARD, parameterized APIs is injection-safe by construction, the same way hand-written PreparedStatement code is — but "we use an ORM" is not itself a guarantee, since any raw/native query escape hatch reintroduces the exact same risk the moment untrusted input is concatenated into it rather than bound as a parameter, which is precisely why understanding PreparedStatement\'s actual mechanism (not just "the ORM handles it") remains genuinely necessary knowledge even in an ORM-based codebase.'
    },
    {
      q: 'Design (in words) a transactional method that transfers a paper\'s "ownership" from one author to another — updating the paper\'s author_id and inserting an audit-log row recording who changed it and when — and explain what could go wrong if this were implemented as two separate, individually-auto-committed statements instead of one transaction.',
      a: 'The correct design wraps both operations — UPDATE papers SET author_id = ? WHERE id = ?, and INSERT INTO ownership_audit_log (paper_id, old_author_id, new_author_id, changed_at) VALUES (?, ?, ?, now()) — inside a single transaction: get a Connection, setAutoCommit(false), execute both statements via PreparedStatement with bound parameters (never concatenating the author IDs or paper ID into the SQL text, even though they\'re just numbers — the discipline should be uniform, not case-by-case), then commit() if both succeed, or rollback() and rethrow if either fails, all inside a try-with-resources block guaranteeing the connection itself is returned regardless of outcome. If this were instead implemented as two separate, individually-auto-committed statements: a failure after the UPDATE succeeds but before the audit-log INSERT runs (a network blip, the application crashing, a constraint violation on the audit table) leaves the paper\'s ownership CHANGED with NO audit trail recording that it happened, who did it, or when — for an audit log, whose entire PURPOSE is to be a trustworthy record of what changed, silently losing entries exactly when something goes wrong (the precise moment an audit trail matters most) is a serious defect, not a cosmetic one. Wrapping both in one atomic transaction guarantees the two facts — "the ownership changed" and "here is a record that it changed" — can never become inconsistent with each other: either both happened together, durably, or neither did, with no possible in-between state for any other transaction (or any post-crash investigation) to ever observe.'
    },
    {
      q: 'Explain the difference between a dirty read and a non-repeatable read precisely enough that a colleague could tell, from a bug report alone, which one they\'re looking at — then explain why PostgreSQL essentially never exhibits true dirty reads even under READ_UNCOMMITTED.',
      a: 'The distinguishing question to ask of a bug report: was the value that was read later ROLLED BACK (never actually became permanent), or did it stay COMMITTED but simply differ from an earlier read within the same transaction? A dirty read means transaction A read a value that transaction B had written but NOT YET committed — if B subsequently ROLLS BACK, A acted on data that, in the database\'s final, true history, never actually existed at all; the tell-tale sign in a bug report is data that was read, acted on, and then turns out to correspond to nothing that ever became a real, permanent database state. A non-repeatable read means transaction A read a row, then read the SAME row again later in the same transaction, and got a genuinely DIFFERENT value — but that different value reflects a REAL, legitimately COMMITTED change made by another transaction in between; nothing here was ever rolled back or fictional, the row\'s value simply, legitimately changed partway through A\'s work. The tell in a bug report: two reads of the same row disagree, but both values, checked independently, correspond to real states the row genuinely held at real points in time. PostgreSQL essentially never exhibits a true dirty read even when READ_UNCOMMITTED is explicitly requested because PostgreSQL\'s implementation of READ_UNCOMMITTED is, per its own documentation, functionally IDENTICAL to READ_COMMITTED — PostgreSQL\'s underlying MVCC (multi-version concurrency control) architecture makes every transaction see a consistent snapshot of only committed data by design, at essentially every isolation level; the SQL standard permits (but doesn\'t require) a database to implement READ_UNCOMMITTED as strictly as READ_COMMITTED, and PostgreSQL specifically chooses to do so, meaning the weakest isolation level in the standard\'s own terminology still doesn\'t actually expose dirty reads on this particular database, even though other databases (and the standard itself) genuinely do permit it at that level.'
    },
    {
      q: 'A researcher studying flaky tests wants to build a tool that automatically detects test flakiness caused specifically by database transaction-isolation gaps (as opposed to the other categories from tdd-coverage-flaky-tests\' taxonomy). What would such a tool need to observe, and why is this category harder to reproduce on demand than, say, a missing awaitTermination bug?',
      a: 'Such a tool would need to observe, at minimum: (1) which tests run CONCURRENTLY (or with genuinely overlapping timing, even under a supposedly sequential test runner if connection-pool-level async behavior is involved) against the SAME underlying database/schema; (2) for each such pair, whether either test\'s database work is wrapped in its own explicitly-isolated transaction (rolled back or otherwise reset afterward) versus operating directly against shared, persistent state; and (3) ideally, instrumentation at the database or connection-pool level recording the actual COMMIT/ROLLBACK timing of each test\'s transaction relative to when other tests\' queries ran, to reconstruct after the fact whether a specific observed test failure genuinely correlates with one test observing another\'s in-flight or just-committed data. This category is genuinely harder to reproduce ON DEMAND than a missing-awaitTermination concurrency bug for a specific reason: an awaitTermination bug\'s flakiness is driven by THREAD SCHEDULING timing within a single process, which can be somewhat reliably perturbed and re-exposed by deliberately adding CPU contention or running the SAME test repeatedly under load (tdd-coverage-flaky-tests\' own diagnostic technique) — the randomness lives entirely within the JVM\'s own thread scheduler, a relatively "close" and directly influenceable source of nondeterminism. A transaction-isolation-driven flaky test\'s nondeterminism instead depends on the RELATIVE TIMING of two entirely separate database transactions — potentially from two different JVM processes or connection pool workers entirely — reaching specific points in their own execution close enough together to actually collide, a race whose window may be narrow enough that even genuinely re-running the same two tests concurrently many times might reproduce the bad interleaving only rarely, since it depends on OS-level thread scheduling, network round-trip timing to the database, and the database\'s own internal lock/MVCC bookkeeping timing all lining up unfavorably — several additional independent layers of timing variance stacked on top of the JVM\'s own thread scheduler, making the reproduction window measurably narrower and the bug correspondingly harder to catch reliably on demand, even with deliberate load injection.'
    }
  ]
};
