window.LESSONS = window.LESSONS || {};
window.LESSONS['spring-data-security'] = {
  id: 'spring-data-security',
  title: 'Spring Data JPA & Spring Security: Repositories, Auth & JWT',
  category: 'Part 9 — Backend with Spring',
  timeMin: 55,
  summary: 'Part 9\'s final lesson closes two remaining gaps. Spring Data JPA takes jpa-hibernate\'s EntityManager one level further: extend an interface, write ZERO implementation code, and get full CRUD plus custom query methods GENERATED from the method\'s own NAME — spring-boot-rest-api\'s hand-written PaperRepository interface gets replaced by a one-line JpaRepository extension. Spring Security adds authentication (who are you) and authorization (what can you do) to the API http-rest-json and spring-boot-rest-api built, via a request-intercepting filter chain, password hashing, and stateless JWT tokens — a direct payoff of http-rest-json\'s own statelessness-enables-horizontal-scaling argument, now solved concretely without server-side sessions.',
  goals: [
    'Extend Spring Data JPA\'s JpaRepository to get full CRUD with zero implementation code, and write derived query methods from method names alone',
    'Use @Query (including JOIN FETCH) for queries the naming convention can\'t express cleanly, connecting back to jpa-hibernate\'s N+1 material',
    'Precisely distinguish authentication from authorization, and explain what Spring Security\'s filter chain does before a request ever reaches a controller',
    'Explain why passwords must be hashed (never stored in plaintext) and what BCrypt provides that a plain hash function does not',
    'Explain a JWT\'s structure and stateless design precisely, including the critical distinction between the payload being readable (base64, not encrypted) and the signature proving it wasn\'t tampered with'
  ],
  concept: [
    {
      h: 'Spring Data JPA: zero implementation code, methods generated from their own names',
      p: [
        'jpa-hibernate\'s EntityManager still required writing JPQL by hand for every query beyond a simple find-by-id — <code>em.createQuery("SELECT p FROM PaperEntity p JOIN FETCH p.author", ...)</code>. SPRING DATA JPA automates this one level further: <code>interface PaperRepository extends JpaRepository&lt;PaperEntity, Long&gt; {}</code> — an INTERFACE with NO METHOD BODIES at all, and no implementing CLASS anywhere in your own code — already provides <code>save()</code>, <code>findById()</code>, <code>findAll()</code>, <code>deleteById()</code>, and more, fully working, the instant the application starts. Spring generates an actual IMPLEMENTATION at runtime (a dynamic proxy class implementing your interface) that delegates to Hibernate/JPA underneath — this directly REPLACES spring-boot-rest-api\'s hand-written <code>PaperRepository</code> interface (which needed a real class implementing <code>save</code>/<code>findById</code>/<code>findAll</code>/<code>deleteById</code>/<code>existsByDoi</code> by hand, backed by either raw JDBC or a manually-written JPQL query) with a single-line interface declaration providing the exact same CRUD operations for free.',
        'The genuinely remarkable part is QUERY DERIVATION: adding <code>List&lt;PaperEntity&gt; findByAuthorId(Long authorId);</code> to the interface — again, NO body — causes Spring to PARSE the method NAME itself ("find by author id") and generate the correct JPQL automatically, equivalent to <code>SELECT p FROM PaperEntity p WHERE p.author.id = :authorId</code>. This scales to genuinely rich queries expressed purely through naming convention: <code>findByTitleContainingIgnoreCase(String keyword)</code> (a case-insensitive LIKE search), <code>findByPublishedOnAfter(LocalDate date)</code>, <code>findByAuthorIdAndPublishedOnBefore(Long authorId, LocalDate date)</code> (combining two conditions with AND, parsed directly from the method name\'s own structure) — the naming convention itself IS the query specification, with no separate query string to keep in sync with the method signature at all.'
      ]
    },
    {
      h: '@Query: for anything the naming convention can\'t express cleanly, including avoiding N+1',
      p: [
        'Method-name-derived queries have real limits — a sufficiently complex condition produces an unreadably long method name, and some queries (an explicit JOIN FETCH, an aggregate with GROUP BY) simply can\'t be expressed by naming convention at all. <code>@Query</code> on a repository method lets you write the JPQL EXPLICITLY, with the naming convention no longer in play: <code>@Query("SELECT p FROM PaperEntity p JOIN FETCH p.reviews WHERE p.id = :id") Optional&lt;PaperEntity&gt; findByIdWithReviews(@Param("id") Long id);</code> — directly, deliberately reusing jpa-hibernate\'s exact JOIN FETCH fix for the N+1 problem, now expressed as a Spring Data repository method rather than raw <code>EntityManager.createQuery</code> calls. This is worth being precise about: Spring Data JPA\'s convenience does NOT remove the N+1 risk jpa-hibernate built real depth around — a naively derived <code>findAll()</code> followed by accessing each result\'s LAZY relationship in a loop is EXACTLY as vulnerable to N+1 through Spring Data as through raw EntityManager code; the fix (JOIN FETCH) is still the developer\'s responsibility to apply explicitly via <code>@Query</code>, Spring Data just makes writing that fixed query slightly more convenient syntactically.',
        '<code>@Query(nativeQuery = true)</code> allows dropping to actual, raw SQL (sql-postgresql\'s own dialect) rather than JPQL, for the rare case a database-specific feature or a genuinely complex query is easier to express directly — the same "drop to a lower layer when the higher-level abstraction doesn\'t fit" escape hatch this course has used throughout (hand-written JDBC when JPA\'s abstraction gets in the way, a @Bean method when @Component can\'t apply). Repository methods returning <code>Page&lt;T&gt;</code> (paired with a <code>Pageable</code> parameter) get PAGINATION for free too — a genuinely common, easy-to-get-wrong-by-hand requirement (correctly computing LIMIT/OFFSET, a total count query) that Spring Data JPA handles entirely automatically once a method\'s return type and parameters signal that pagination is wanted.'
      ]
    },
    {
      h: 'Authentication vs. authorization: two genuinely different questions',
      p: [
        'These two terms are frequently conflated in casual conversation, and the precise distinction matters enough to state carefully. AUTHENTICATION answers "WHO are you" — verifying an identity claim is genuine (a correct username/password pair, a valid token) — the outcome is binary: either the identity claim checks out, or it doesn\'t. AUTHORIZATION answers a completely different question, asked AFTER authentication has already succeeded: "given that you ARE who you say you are, what are you ALLOWED to do" — a genuinely authenticated user can still be authorized for SOME actions and NOT others (an ordinary logged-in reviewer authenticated correctly, but NOT authorized to call jdbc-transactions\' recordDecision — that\'s an editor-only action). Spring Security\'s FILTER CHAIN intercepts EVERY incoming HTTP request BEFORE it reaches any @RestController at all — a chain of filters checking authentication (does this request carry valid credentials/a valid token) and, separately, authorization (does the AUTHENTICATED identity have permission for the specific endpoint/method being called) — a request failing authentication never reaches a controller method (typically 401 Unauthorized); a request that authenticates successfully but fails authorization for the SPECIFIC action requested also never reaches the intended logic (typically 403 Forbidden, a genuinely different status code from 401, precisely because it\'s a genuinely different failure — the identity IS known, it\'s simply not PERMITTED).',
        'This maps directly onto Spring MVC method-level security: <code>@PreAuthorize("hasRole(\'EDITOR\')")</code> on a controller method (jdbc-transactions\' recordDecision, exposed as an HTTP endpoint, is the natural example) checks AUTHORIZATION specifically — it runs AFTER authentication has already established WHO the caller is, and simply checks whether that established identity\'s ROLE includes EDITOR before letting the method body execute at all; an authenticated but non-editor caller gets 403 Forbidden without the method\'s own code ever running, the exact same "reject before the real logic runs" discipline Bean Validation applied to malformed REQUEST SHAPES, now applied to caller PERMISSIONS instead.'
      ]
    },
    {
      h: 'Password hashing: BCrypt, and why a plain hash isn\'t enough',
      p: [
        'Storing a user\'s password directly (plaintext) is an unconditional security failure — a database breach (or even an internal actor with database access) immediately exposes every user\'s actual password, and since password reuse across sites is common, that breach cascades to accounts on OTHER, unrelated services too. The standard fix is HASHING: storing a one-way, irreversible transformation of the password rather than the password itself, and verifying a login attempt by hashing the SUBMITTED password with the same algorithm and comparing it to the STORED hash — the actual password is never stored or even reconstructible from what IS stored. A plain, fast cryptographic hash (SHA-256, say) is NOT adequate for passwords specifically, for a precise reason: it\'s deliberately FAST, which is exactly the wrong property for a password hash — an attacker who obtains a database of SHA-256 password hashes can attempt BILLIONS of guesses per second against them (a "brute-force" or "dictionary" attack), since each guess\'s hash computation is cheap.',
        '<code>BCrypt</code> (Spring Security\'s standard default, via <code>BCryptPasswordEncoder</code>) is specifically designed to be SLOW, deliberately and tunably so (a configurable "work factor" or "cost" parameter, increasable over time as hardware gets faster) — computing one BCrypt hash takes a meaningful fraction of a second rather than a fraction of a microsecond, which is IRRELEVANT for a legitimate login (one hash computation per real login attempt, imperceptible to a real user) but DEVASTATING for an attacker attempting billions of guesses, since the SAME slowness multiplies across every single guess attempted. BCrypt also automatically incorporates a random SALT (extra random data mixed into each password before hashing, unique per user) — this defeats a RAINBOW TABLE attack (a precomputed table of hash-to-password mappings for common passwords), since even two users with the IDENTICAL password get completely DIFFERENT stored hashes, due to each having a different random salt — <code>passwordEncoder.encode(rawPassword)</code> to hash at signup/password-change, <code>passwordEncoder.matches(rawPassword, storedHash)</code> to verify at login, with the salt and work factor both embedded directly in the stored hash string itself, requiring no separate storage or bookkeeping.'
      ]
    },
    {
      h: 'JWT: a stateless, signed token — readable, not secret',
      p: [
        'A traditional, SERVER-SIDE session (the server remembers "this session ID is logged in as user X" in its own memory or a shared session store) directly reintroduces the exact stateful-server problem http-rest-json\'s own interview material argued against — it breaks horizontal scaling by requiring either sticky sessions or a shared session store every server instance must consult. A JWT (JSON Web Token) solves this by moving the "who is this" information OUT of server-side memory and INTO the token itself, held by the CLIENT and sent with every request (an <code>Authorization: Bearer &lt;token&gt;</code> header) — the server verifies the token\'s SIGNATURE on each request (a fast, purely computational check, no database or session-store lookup required) and, if valid, trusts the CLAIMS embedded directly inside the token (user ID, roles, an expiration timestamp) without needing to remember anything about that specific login between requests — genuinely stateless, exactly what horizontal scaling behind a load balancer requires.',
        'A JWT has three dot-separated parts: <code>header.payload.signature</code> — the HEADER and PAYLOAD are each just BASE64-ENCODED JSON (NOT encrypted — base64 is a reversible ENCODING, not encryption; anyone holding a JWT can trivially decode its payload and read every claim inside it in plain text, a genuinely important, easy-to-get-wrong point: NEVER put a secret — a password, a raw credit-card number — inside a JWT\'s payload, since it is NOT hidden from anyone who obtains the token). The SIGNATURE is what actually provides security here, and it proves something narrower and different than "the contents are secret": it proves the token was signed by someone holding the SERVER\'s own secret signing key, and that the header+payload have NOT been tampered with since signing — an attacker who intercepts a valid JWT and tries to EDIT its payload (changing their own role claim from "REVIEWER" to "EDITOR," say) invalidates the signature, since the signature is a cryptographic function of the EXACT original header+payload bytes; the server recomputes the expected signature on every request and rejects any token whose signature doesn\'t match. The <code>exp</code> (expiration) claim, checked on every request, limits how long a stolen or leaked token remains usable — and, worth a direct callback to this course\'s flaky-test material, a token issued with <code>Instant.now().plus(...)</code> for its expiration and checked in a test using the REAL system clock is exactly the kind of time-dependent behavior datetime-io-nio and tdd-coverage-flaky-tests both warned about — a test asserting a token is still valid, run right at (or just past) its expiration boundary, is a genuinely realistic source of environment/timing-dependent flakiness, best avoided by injecting a controllable <code>Clock</code> (jvm-tools-reflection\'s dependency-injection-for-testability instinct, spring-core-di\'s constructor injection, and datetime-io-nio\'s Instant discipline, all converging on the same fix) rather than relying on the real wall clock inside a test.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Labeled request slips the archive reads automatically, and the Vivre Card that proves identity without a phone call home',
      text: 'Nami no longer has to write out detailed instructions for the ship\'s archive assistant every single time she needs a lookup — she just labels a request slip following one strict, learnable naming convention ("find every paper BY this author\'s ID"), and the assistant automatically KNOWS exactly which search to run and hands back the right results, with zero custom instructions written by Nami at all (Spring Data JPA: a repository method\'s NAME alone generates the query). For anything that strict convention genuinely can\'t express — a request needing several pieces of information pulled together in one specific combination — she writes out a full, explicit custom search order instead (@Query), including one where she EXPLICITLY tells the assistant "bring back the pirate\'s file AND their known associates\' files together, in one trip" (JOIN FETCH, still the developer\'s job to specify even with this convenience — the assistant doesn\'t magically know to avoid a slow ten-trip lookup unless told). At the gangplank, the ship\'s sentry checks two genuinely SEPARATE things before letting anyone act. First: is this VIVRE CARD (or ID) actually genuine, matching who this person claims to be — WHO are you (authentication). Second, and only once the first is settled: is this specific, verified person actually CLEARED to do the specific thing they\'re now asking to do — issue orders, access the treasure hold — WHAT are you allowed to do (authorization); a genuinely verified crew member can still be turned away from the treasure hold if their rank doesn\'t clear them for it. The crew never writes a recruit\'s actual PASSWORD phrase down anywhere at all — they store a scrambled, one-way transformation of it instead, one deliberately SLOW and unique-per-person to compute, specifically so a spy who steals the ship\'s entire logbook still can\'t feasibly guess anyone\'s real password by brute force, and so two crew members who happened to pick the identical phrase still end up with completely different-looking scrambled entries (BCrypt hashing with a per-user salt). And the Vivre Card itself is the key insight worth getting exactly right: ANYONE who picks it up can read the name written on it plainly — it is NOT a sealed secret (a JWT\'s payload is readable, not encrypted) — what makes it trustworthy is a special, hard-to-forge SEAL pressed into it, proving it genuinely came from a legitimate source and hasn\'t been altered since (the signature), not that its contents are hidden from anyone who finds it.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Auto-generated lab-request labels, and the badge that proves identity without a phone call to HR',
      text: 'Amy no longer has to write out detailed instructions for the lab\'s sample-tracking system every single time she needs a lookup — she just labels a request following one strict, learnable naming convention ("find every sample BY this researcher\'s ID"), and the system automatically KNOWS exactly which search to run and hands back the right results, with zero custom instructions written by Amy at all (Spring Data JPA: a repository method\'s NAME alone generates the query). For anything that strict convention genuinely can\'t express, she writes out a full, explicit custom request instead (@Query), including one where she EXPLICITLY specifies "bring back the specimen record AND its full assistant history together, in one trip" (JOIN FETCH — still her job to specify, the system doesn\'t automatically know to avoid a slow, repeated lookup unless told). At the department\'s secure entrance, the badge reader checks two genuinely SEPARATE things before letting anyone through. First: is this BADGE actually genuine, matching who this person claims to be — WHO are you (authentication). Second, and only once the first is settled: is this specific, verified person actually CLEARED to enter THIS particular lab — WHAT are you allowed to do (authorization); a genuinely verified Caltech employee can still be denied entry to a restricted lab their clearance level doesn\'t cover. The university never stores anyone\'s actual PASSWORD anywhere at all — it stores a scrambled, one-way transformation instead, one deliberately SLOW and unique-per-person to compute, specifically so a breach of the entire employee database still doesn\'t let an attacker feasibly guess real passwords by brute force, and so two employees who happened to pick the identical password still end up with completely different-looking scrambled entries (BCrypt hashing with a per-user salt). And the badge itself is the key insight worth getting exactly right: ANYONE glancing at it can read the name and department printed on it plainly — it is NOT a sealed secret (a JWT\'s payload is readable, not encrypted) — what makes it trustworthy is a special, hard-to-forge HOLOGRAM seal on it, proving it genuinely came from the university and hasn\'t been tampered with (the signature), not that its printed contents are hidden from anyone who sees it.',
    },
    why: 'Labeled request slips the archive assistant / lab system reads automatically, generating the exact right search from the label alone, is Spring Data JPA\'s method-name query derivation — and an explicit custom order for a combined lookup is @Query, including an explicit "bring both together in one trip" order that is JOIN FETCH, still the developer\'s own job to specify. The gangplank sentry\'s / badge reader\'s two SEPARATE checks — is this identity genuine, then is this genuine identity CLEARED for this specific action — is authentication followed by authorization. The scrambled, deliberately slow, uniquely-salted password entry is BCrypt hashing. And the Vivre Card / badge that\'s openly readable by anyone but carries a hard-to-forge seal proving it\'s genuine and untampered is exactly a JWT: the payload is NOT secret, the signature is what proves authenticity.'
  },
  storyAnim: {
    title: 'A labeled slip the archive reads automatically, and a card readable by anyone but provably genuine',
    h: 340,
    props: [
      { id: 'labeled', emoji: '🏷️', label: 'a strictly-labeled request slip -- the archive reads it and knows exactly what to fetch (query derivation)', x: 6, y: 8 },
      { id: 'customorder', emoji: '📝', label: 'an explicit custom order for what the label can\'t express, e.g. "both together, one trip" (@Query + JOIN FETCH)', x: 30, y: 8 },
      { id: 'sentry1', emoji: '🪪', label: 'FIRST check: is this card genuine? (authentication)', x: 54, y: 8 },
      { id: 'sentry2', emoji: '🔒', label: 'SECOND check: is this genuine person cleared for THIS? (authorization)', x: 78, y: 8 },
      { id: 'hash', emoji: '🌀', label: 'the real password is never stored -- a slow, salted scramble instead (BCrypt)', x: 20, y: 50 },
      { id: 'readable', emoji: '👁️', label: 'anyone can read the name on the card -- it is NOT a sealed secret (JWT payload)', x: 50, y: 50 },
      { id: 'seal', emoji: '🔏', label: 'a hard-to-forge seal proves it genuinely came from the source, untampered (JWT signature)', x: 78, y: 50 }
    ],
    actors: [
      { id: 'nami', emoji: '🧭', label: 'Nami', x: 20, y: 78 },
      { id: 'sentry', emoji: '🛡️', label: 'sentry', x: 65, y: 78 }
    ],
    steps: [
      { c: 'A request slip labeled by strict convention lets the archive assistant know exactly what to fetch, with zero custom instructions written.', p: { labeled: 'lit' }, a: { nami: [20, 30] } },
      { c: 'For anything the label can\'t express -- like fetching two related things together in one trip -- an explicit custom order is written instead.', p: { customorder: 'lit' } },
      { c: 'At the gangplank, the FIRST check is whether the card itself is genuine.', p: { sentry1: 'lit' }, a: { sentry: [54, 30] } },
      { c: 'Only once identity is verified does the SECOND, separate check happen: is this genuine person cleared for this specific action?', p: { sentry2: 'lit' } },
      { c: 'The crew never stores anyone\'s real password -- a deliberately slow, uniquely-salted scramble instead.', p: { hash: 'good' } },
      { c: 'Anyone who picks up the card can read the name on it plainly -- it was never meant to be secret.', p: { readable: 'lit' } },
      { c: 'What makes it trustworthy is a hard-to-forge seal, proving it genuinely came from the source and wasn\'t altered.', p: { seal: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'From Spring Data query derivation to authentication, authorization, hashing, and JWTs',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Spring Data JPA',
        nodes: [
          { id: 'jparepo', text: 'JpaRepository<T, ID>:\nfull CRUD, zero implementation' },
          { id: 'derived', text: 'method NAME alone generates\nthe query (findByAuthorId)' },
          { id: 'queryannotation', text: '@Query (+ JOIN FETCH):\nfor what naming can\'t express' }
        ]
      },
      {
        label: 'Auth basics',
        nodes: [
          { id: 'authn', text: 'authentication:\nWHO are you' },
          { id: 'authz', text: 'authorization:\nWHAT can you do' },
          { id: 'filterchain', text: 'the filter chain intercepts\nbefore any controller runs' }
        ]
      },
      {
        label: 'Password hashing',
        nodes: [
          { id: 'bcrypt', text: 'BCrypt: deliberately slow,\nsalted, one-way' }
        ]
      },
      {
        label: 'JWT',
        nodes: [
          { id: 'stateless', text: 'stateless: claims live in the\ntoken, not server memory' },
          { id: 'structure', text: 'header.payload.signature --\npayload is readable, not secret' },
          { id: 'signature', text: 'the signature proves authenticity\n& no tampering, not secrecy' }
        ]
      }
    ],
    steps: [
      { active: ['jparepo'], note: 'Extending JpaRepository<T, ID> with no method bodies provides working save/findById/findAll/deleteById immediately.' },
      { active: ['derived'], note: 'A method\'s own name (findByAuthorId, findByTitleContainingIgnoreCase) is parsed to generate the correct query automatically.' },
      { active: ['queryannotation'], note: '@Query lets you write JPQL explicitly for anything naming can\'t express, including JOIN FETCH -- still your job to apply it to avoid N+1.' },
      { active: ['authn'], note: 'Authentication verifies an identity claim is genuine -- a binary yes/no on "are you who you say you are."' },
      { active: ['authz'], note: 'Authorization, checked only after authentication succeeds, asks whether that verified identity is permitted to do the specific thing being requested.' },
      { active: ['filterchain'], note: 'Spring Security\'s filter chain checks both before any controller method runs -- a failure here means the controller\'s own code never executes at all.' },
      { active: ['bcrypt'], note: 'BCrypt is deliberately slow and automatically salted, defeating both brute-force guessing and precomputed rainbow-table attacks.' },
      { active: ['stateless'], note: 'A JWT moves "who is this" out of server memory and into a token the client holds, verified by signature on every request -- no session store needed.' },
      { active: ['structure'], note: 'A JWT\'s header and payload are base64-encoded, not encrypted -- readable by anyone who has the token.' },
      { active: ['signature'], note: 'The signature proves the token came from the server and wasn\'t tampered with -- it does not hide the payload\'s contents.' }
    ]
  },
  tech: [
    {
      q: 'Explain precisely what Spring does when the application starts and encounters `interface PaperRepository extends JpaRepository<PaperEntity, Long> { List<PaperEntity> findByAuthorId(Long authorId); }`, including what actually implements this interface at runtime.',
      a: 'At startup, Spring Data JPA scans for interfaces extending its repository marker interfaces (JpaRepository, in this case) and, for EACH one found, generates an actual, concrete implementing CLASS at RUNTIME — not through compile-time code generation the developer would ever see in source form, but via a DYNAMIC PROXY (a class created on the fly, in memory, implementing the target interface) whose method implementations Spring wires up based on two things: for methods JpaRepository itself declares (save, findById, findAll, deleteById, etc.), the proxy delegates to Spring Data\'s own generic, already-written implementation, parameterized by the entity type and ID type declared in the extends clause. For the CUSTOM method findByAuthorId(Long authorId), which has no body and isn\'t part of JpaRepository\'s own interface, Spring Data\'s QUERY DERIVATION mechanism PARSES the method\'s NAME at startup — recognizing "findBy" as the query-method prefix, "AuthorId" as the property path to filter on (author.id, since author is itself a relationship on PaperEntity) — and constructs the equivalent JPQL (SELECT p FROM PaperEntity p WHERE p.author.id = :authorId) automatically, compiling and validating that generated query against the actual entity mapping ONCE, at application startup (meaning a MISSPELLED property name in a derived method\'s NAME, like findByAuhorId, fails LOUDLY at startup with a clear error, rather than compiling successfully and failing mysteriously at first use). The developer never writes, and never sees, any implementing class for PaperRepository at all — the interface declaration alone is sufficient for Spring to produce a fully working implementation.'
    },
    {
      q: 'A repository has `List<PaperEntity> findAll();` (inherited from JpaRepository, no customization) and a controller loops over the result calling paper.getReviews().size() where reviews is a LAZY @OneToMany. Does replacing hand-written JDBC with Spring Data JPA fix or avoid the N+1 problem jpa-hibernate built around? Explain precisely.',
      a: 'It does NEITHER — Spring Data JPA\'s convenience operates entirely at the level of "how much boilerplate code you have to write to issue A query," not "how many queries your code issues in total," and the N+1 pattern is fundamentally about the LATTER. findAll() (whether inherited automatically from JpaRepository or hand-written against a raw EntityManager, as in jpa-hibernate\'s own code) issues exactly ONE query returning the list of papers, with reviews still LAZY and therefore still NOT loaded as part of that query — calling paper.getReviews().size() in a loop afterward triggers the exact SAME one-additional-query-per-paper behavior jpa-hibernate demonstrated explicitly, entirely independent of which repository mechanism (raw EntityManager vs. Spring Data JpaRepository) produced the original list. Spring Data JPA reducing the AMOUNT OF CODE needed to issue a query has zero bearing on how many ACTUAL SQL queries get issued when lazily-loaded relationships are subsequently accessed in a loop — this is precisely why this lesson\'s concept section states explicitly that the fix (JOIN FETCH) remains entirely the developer\'s own responsibility, now expressed via a custom @Query method (@Query("SELECT p FROM PaperEntity p JOIN FETCH p.reviews") List<PaperEntity> findAllWithReviews();) rather than raw EntityManager.createQuery, but requiring the EXACT SAME conscious decision to apply it. A developer who assumes "Spring Data JPA is more convenient, so it must also avoid N+1 automatically" has drawn precisely the wrong conclusion from a real but narrowly-scoped convenience improvement.'
    },
    {
      q: 'An endpoint is annotated `@PreAuthorize("hasRole(\'EDITOR\')")`. A request arrives with an EXPIRED JWT. Walk through, in order, what happens and at what point (if any) @PreAuthorize\'s check is even evaluated.',
      a: 'In order: (1) Spring Security\'s filter chain intercepts the request BEFORE it reaches any controller method at all. (2) A JWT-processing filter extracts the token from the Authorization header and attempts to validate it — this includes checking the signature (proving it wasn\'t tampered with and genuinely came from this server) AND checking the exp (expiration) claim against the current time. (3) Because the token is EXPIRED, this validation step FAILS — critically, this failure happens entirely at the AUTHENTICATION layer, before any notion of "which role does this caller have" is even considered, since an expired token means the caller\'s identity can no longer be trusted as currently valid at all, regardless of what role claim the token might otherwise contain. (4) The filter chain rejects the request immediately with 401 Unauthorized (an AUTHENTICATION failure — "I don\'t know who you are right now," not "I know who you are and you\'re not allowed") — the request never reaches the controller method, and @PreAuthorize\'s "hasRole(\'EDITOR\')" check is NEVER EVALUATED at all, since authorization checks only make sense to run AFTER authentication has already succeeded; there is no verified identity yet to check a role against. This precisely illustrates the concept section\'s ordering: authentication is a PRECONDITION for authorization, not a parallel, independent check — a request failing authentication is rejected before authorization logic ever runs, regardless of what role the (unverifiable) token claims to have.'
    },
    {
      q: 'A developer stores JWTs\' payload claims including a user\'s email address and role, reasoning "it\'s fine, the token is signed so it\'s secure." A colleague objects that storing the user\'s actual password hash in the JWT payload as a convenience (to avoid a database lookup on every request) would be a serious mistake. Explain precisely why the colleague is right, distinguishing what signing actually protects from what it does not.',
      a: 'The colleague is precisely correct, and the distinction hinges on exactly what a JWT\'s signature does and doesn\'t guarantee, which this lesson\'s concept section states explicitly: signing proves the token\'s contents haven\'t been TAMPERED WITH and genuinely came from the legitimate signer — it says NOTHING about whether those contents are HIDDEN from anyone who possesses the token. A JWT\'s header and payload are base64-ENCODED, a purely reversible, non-secret ENCODING scheme (not encryption) — ANY party holding the raw token string, including a browser\'s dev tools, a network proxy that observes the Authorization header, or a malicious script with access to wherever the token is stored client-side, can trivially decode the payload and read every claim inside it in plain text, with ZERO need to know the server\'s signing secret at all (decoding base64 requires no cryptographic secret whatsoever). This makes the user\'s email address a genuinely low-risk claim to include (mildly sensitive, but not catastrophic if exposed, and often needed by client-side code anyway) — but a PASSWORD HASH is categorically different: even though BCrypt hashes are specifically designed to resist being reversed back into the original password, EXPOSING that hash to anyone holding the JWT hands an attacker a value they can now attempt OFFLINE brute-force/dictionary attacks against at their own leisure, with no rate-limiting or lockout protection the server\'s own login endpoint might otherwise enforce — precisely the kind of exposure storing the hash server-side ONLY, never transmitted anywhere, is specifically designed to prevent. The general, precise rule the colleague is applying correctly: a JWT\'s signature protects INTEGRITY and AUTHENTICITY (this token is genuine and unmodified); it provides ZERO confidentiality for the payload\'s CONTENTS — anything genuinely sensitive belongs server-side only, never inside a JWT\'s payload, signed or not.'
    }
  ],
  code: {
    title: 'PaperRepository as a one-line JpaRepository extension, and @PreAuthorize protecting an editor-only endpoint',
    intro: 'spring-boot-rest-api\'s hand-written PaperRepository interface, replaced entirely by a Spring Data JpaRepository extension with derived and @Query methods — plus a BCrypt-backed SecurityConfig and an @PreAuthorize-protected decision endpoint.',
    code: `import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

// --- REPLACES spring-boot-rest-api's hand-written PaperRepository entirely ---
// No implementing class anywhere -- Spring Data generates one at startup
interface PaperRepository extends JpaRepository<PaperEntity, Long> {

    boolean existsByDoi(String doi);   // query derived from the method name alone

    List<PaperEntity> findByAuthorId(Long authorId);   // "find by author id" -- parsed directly

    List<PaperEntity> findByTitleContainingIgnoreCase(String keyword);   // a case-insensitive LIKE search

    // for what the naming convention can't express: JOIN FETCH, jpa-hibernate's exact N+1 fix,
    // now written as a Spring Data repository method
    @Query("SELECT p FROM PaperEntity p JOIN FETCH p.reviews WHERE p.id = :id")
    Optional<PaperEntity> findByIdWithReviews(@Param("id") Long id);
}

@Configuration
@EnableWebSecurity
class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();   // deliberately slow, automatically salted
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/papers/**").permitAll()          // reading papers: no auth required
                .requestMatchers("/decisions/**").authenticated()   // recording a decision: must be logged in
                .anyRequest().authenticated())
            .httpBasic(basic -> {});   // a real app would configure JWT-based auth here instead
        return http.build();
    }
}

@RestController
@RequestMapping("/decisions")
class DecisionController {
    private final DecisionRecorder recorder;   // from jdbc-transactions

    DecisionController(DecisionRecorder recorder) {
        this.recorder = recorder;
    }

    @PostMapping
    @PreAuthorize("hasRole('EDITOR')")   // authorization: authenticated is not enough -- must specifically be an editor
    ResponseEntity<Void> recordDecision(@RequestParam Long paperId, @RequestParam String decision) {
        recorder.recordDecision(paperId, decision);
        return ResponseEntity.noContent().build();
    }
}`,
    notes: [
      'PaperRepository has NO implementing class in this codebase at all -- Spring generates one at startup, exactly replacing the hand-written version spring-boot-rest-api needed.',
      'findByAuthorId and findByTitleContainingIgnoreCase both require zero JPQL to be written by hand -- the method NAME itself is the complete query specification.',
      'findByIdWithReviews\'s JOIN FETCH is doing the exact same job as jpa-hibernate\'s raw EntityManager JOIN FETCH query -- Spring Data JPA\'s convenience does not remove the need to apply this fix explicitly.',
      '@PreAuthorize("hasRole(\'EDITOR\')") runs AFTER authentication has already succeeded -- an authenticated but non-editor caller gets 403 Forbidden without recordDecision\'s own code ever executing, while an unauthenticated caller never even reaches this check at all, failing earlier with 401.'
    ]
  },
  lab: {
    title: 'Add derived queries, a JOIN FETCH query, and an editor-only endpoint',
    prompt: 'Given <code>AuthorEntity</code> (from jpa-hibernate) with a <code>name</code> field and a <code>@OneToMany(mappedBy = "author") List&lt;PaperEntity&gt; papers</code> field: (1) write <code>interface AuthorRepository extends JpaRepository&lt;AuthorEntity, Long&gt;</code> with a derived query method <code>findByNameContainingIgnoreCase(String keyword)</code> returning <code>List&lt;AuthorEntity&gt;</code>; (2) add an <code>@Query</code> method <code>findByIdWithPapers(Long id)</code> returning <code>Optional&lt;AuthorEntity&gt;</code>, using <code>JOIN FETCH a.papers</code> to avoid N+1; (3) write a <code>@DeleteMapping("/{id}")</code> method in a given <code>AuthorController</code>, annotated <code>@PreAuthorize("hasRole(\'EDITOR\')")</code>, that calls <code>authorRepository.deleteById(id)</code> and returns <code>ResponseEntity.noContent().build()</code>.',
    starter: `import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

// TODO 1 & 2: interface AuthorRepository extends JpaRepository<AuthorEntity, Long>
//   - findByNameContainingIgnoreCase(String keyword) -- derived, no @Query needed
//   - findByIdWithPapers(Long id) -- @Query with JOIN FETCH a.papers

@RestController
@RequestMapping("/authors")
class AuthorController {
    private final AuthorRepository authorRepository;

    AuthorController(AuthorRepository authorRepository) {
        this.authorRepository = authorRepository;
    }

    // TODO 3: @DeleteMapping("/{id}"), @PreAuthorize("hasRole('EDITOR')")
    // call authorRepository.deleteById(id), return ResponseEntity.noContent().build()
}`,
    checks: [
      { re: 'interface\\s+AuthorRepository\\s+extends\\s+JpaRepository\\s*<\\s*AuthorEntity\\s*,\\s*Long\\s*>', must: true, hint: 'Declare interface AuthorRepository extends JpaRepository<AuthorEntity, Long>.', pass: 'AuthorRepository extends JpaRepository ✓' },
      { re: 'List\\s*<\\s*AuthorEntity\\s*>\\s+findByNameContainingIgnoreCase\\s*\\(\\s*String\\s+keyword\\s*\\)', must: true, hint: 'Add List<AuthorEntity> findByNameContainingIgnoreCase(String keyword); with no method body.', pass: 'findByNameContainingIgnoreCase declared ✓' },
      { re: '@Query\\(\\s*"SELECT\\s+a\\s+FROM\\s+AuthorEntity\\s+a\\s+JOIN\\s+FETCH\\s+a\\.papers', must: true, hint: 'Use @Query("SELECT a FROM AuthorEntity a JOIN FETCH a.papers WHERE a.id = :id") on findByIdWithPapers.', pass: '@Query with JOIN FETCH a.papers ✓' },
      { re: 'Optional\\s*<\\s*AuthorEntity\\s*>\\s+findByIdWithPapers\\s*\\(', must: true, hint: 'Declare Optional<AuthorEntity> findByIdWithPapers(@Param("id") Long id);', pass: 'findByIdWithPapers declared ✓' },
      { re: '@DeleteMapping\\(\\s*"/\\{id\\}"\\s*\\)', must: true, hint: 'Annotate the delete method @DeleteMapping("/{id}").', pass: '@DeleteMapping("/{id}") used ✓' },
      { re: '@PreAuthorize\\(\\s*"hasRole\\(\\s*\'EDITOR\'\\s*\\)"\\s*\\)', must: true, hint: 'Annotate the delete method @PreAuthorize("hasRole(\'EDITOR\')").', pass: '@PreAuthorize(hasRole(EDITOR)) used ✓' },
      { re: 'authorRepository\\.deleteById\\(\\s*id\\s*\\)', must: true, hint: 'Call authorRepository.deleteById(id).', pass: 'deleteById(id) called ✓' },
      { re: 'ResponseEntity\\.noContent\\(\\)\\.build\\(\\)', must: true, hint: 'Return ResponseEntity.noContent().build() (204).', pass: 'noContent().build() returned ✓' }
    ],
    run: 'mvn spring-boot:run — an authenticated non-editor calling DELETE /authors/1 should get 403 Forbidden without deleteById ever running; an authenticated editor should get 204 No Content and the author actually removed.',
    solution: `import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

interface AuthorRepository extends JpaRepository<AuthorEntity, Long> {

    List<AuthorEntity> findByNameContainingIgnoreCase(String keyword);

    @Query("SELECT a FROM AuthorEntity a JOIN FETCH a.papers WHERE a.id = :id")
    Optional<AuthorEntity> findByIdWithPapers(@Param("id") Long id);
}

@RestController
@RequestMapping("/authors")
class AuthorController {
    private final AuthorRepository authorRepository;

    AuthorController(AuthorRepository authorRepository) {
        this.authorRepository = authorRepository;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('EDITOR')")
    ResponseEntity<Void> delete(@PathVariable Long id) {
        authorRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}`,
    notes: [
      'findByNameContainingIgnoreCase needs no @Query at all -- the method name alone tells Spring Data exactly which case-insensitive LIKE query to generate.',
      'findByIdWithPapers\'s JOIN FETCH a.papers is required specifically because AuthorEntity.papers is a LAZY @OneToMany -- without it, accessing author.getPapers() later would trigger jpa-hibernate\'s exact N+1 pattern.',
      '@PreAuthorize runs before delete()\'s own body -- an authenticated caller without the EDITOR role never reaches authorRepository.deleteById(id) at all, receiving 403 instead.'
    ]
  },
  quiz: [
    {
      q: 'What implements a Spring Data JPA repository interface like `interface PaperRepository extends JpaRepository<PaperEntity, Long> {}` at runtime?',
      options: ['Spring generates a dynamic proxy class implementing the interface at application startup -- no implementing class is written by the developer at all', 'Hibernate requires the developer to write a class named PaperRepositoryImpl manually', 'The interface remains unimplemented, and calling any of its methods throws an UnsupportedOperationException', 'JpaRepository itself is a concrete class, not an interface, so no further implementation is needed'],
      correct: 0,
      explain: 'Spring Data JPA generates an actual implementing class (a dynamic proxy) at runtime, wiring CRUD methods to its own generic implementation and derived-query methods to automatically-generated JPQL parsed from the method name.'
    },
    {
      q: 'Does using Spring Data JPA\'s findAll() instead of a hand-written EntityManager query change whether accessing a LAZY relationship in a loop afterward causes the N+1 problem?',
      options: ['No -- N+1 depends on how many queries get issued when lazy relationships are accessed, which is unaffected by whether findAll() was hand-written or inherited from JpaRepository; JOIN FETCH is still required to avoid it', 'Yes -- Spring Data JPA automatically detects and prevents N+1 patterns for any inherited method', 'Yes -- findAll() always eagerly loads every relationship on every returned entity', 'N+1 can only occur with hand-written JDBC, never with any form of JPA or Spring Data JPA'],
      correct: 0,
      explain: 'Spring Data JPA reduces how much code you write to issue a query, not how many queries get issued when lazy relationships are subsequently accessed in a loop -- the JOIN FETCH fix remains entirely the developer\'s responsibility.'
    },
    {
      q: 'A request arrives with a completely missing Authorization header at an endpoint requiring authentication. Does @PreAuthorize("hasRole(\'EDITOR\')") on that endpoint\'s method get evaluated?',
      options: ['No -- the request fails authentication first (401 Unauthorized), before the controller method or its @PreAuthorize check are ever reached; authorization only runs after authentication has already succeeded', 'Yes -- @PreAuthorize always runs first, independent of whether authentication succeeded', 'Yes, and it evaluates to true by default for missing credentials', 'This scenario is impossible -- Spring Security always provides a default authenticated identity'],
      correct: 0,
      explain: 'Authentication is a precondition for authorization. A request with no valid credentials fails authentication (401) before ever reaching the controller method, so the @PreAuthorize role check is never evaluated at all.'
    },
    {
      q: 'Why is BCrypt preferred over a plain, fast cryptographic hash function (like SHA-256) for storing passwords?',
      options: ['BCrypt is deliberately slow and automatically salted, making brute-force guessing against a stolen password database computationally expensive and defeating precomputed rainbow-table attacks', 'BCrypt is faster to compute than SHA-256, improving login performance', 'SHA-256 cannot be used with Java at all', 'BCrypt encrypts the password reversibly, letting the original be recovered if needed'],
      correct: 0,
      explain: 'A fast hash lets an attacker attempt billions of guesses per second against a stolen hash database. BCrypt\'s deliberate slowness makes each guess expensive, and its automatic per-user salt defeats precomputed rainbow-table attacks -- both irrelevant for a real login\'s single hash computation.'
    },
    {
      q: 'A JWT\'s payload contains a user\'s role claim. Can anyone who intercepts the token read that role, even without knowing the server\'s signing secret?',
      options: ['Yes -- the payload is base64-encoded, not encrypted, so it is trivially readable by anyone holding the token; the signature only proves the contents weren\'t tampered with, it does not hide them', 'No -- the payload is encrypted using the server\'s signing secret and cannot be read without it', 'No -- JWTs cannot be intercepted at all, since they are only ever transmitted over encrypted connections', 'Yes, but only if the token has expired'],
      correct: 0,
      explain: 'A JWT\'s header and payload are base64-encoded (a reversible encoding, not encryption) -- readable by anyone with the raw token, with no need for the signing secret. The signature protects authenticity and integrity, not confidentiality.'
    }
  ],
  testFlow: {
    title: 'Test yourself: query derivation, N+1 with Spring Data, and JWT payload readability',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A repository method is named findByAuthorIdAndPublishedOnBefore(Long authorId, LocalDate date), with no method body and no @Query annotation. What does Spring Data JPA do with this?',
        choices: [
          { text: 'It parses the method name, recognizing "AuthorId" and "PublishedOnBefore" as two conditions combined with AND, and generates the equivalent JPQL automatically -- no query string needs to be written', to: 'q1_right' },
          { text: 'This method will fail to compile, since Spring Data JPA requires every custom method to have an explicit @Query annotation', to: 'q1_wrong_requiresquery' },
          { text: 'Spring Data JPA ignores the method name entirely and returns all papers regardless of the parameters', to: 'q1_wrong_ignores' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- Spring Data JPA\'s query derivation mechanism parses method names following its naming convention, generating the correct JPQL automatically, including combining multiple conditions with And/Or as expressed in the method name itself.', next: 'q2' },
      q1_wrong_requiresquery: { end: true, correct: false, text: 'Method-name query derivation is exactly the alternative to writing @Query explicitly -- a correctly-named method requires no @Query annotation at all; Spring generates the query from the name.', retry: 'q1' },
      q1_wrong_ignores: { end: true, correct: false, text: 'Spring Data JPA does the opposite -- it specifically parses and relies on the method name to determine the query, rather than ignoring it.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A team switches their PaperRepository from hand-written JDBC to Spring Data JpaRepository, expecting this to also fix an existing N+1 performance problem in their code. Is this expectation correct?',
        choices: [
          { text: 'No -- Spring Data JPA reduces the amount of code needed to issue a query, but does not change how many queries get issued when a lazily-loaded relationship is accessed in a loop; JOIN FETCH is still required explicitly', to: 'q2_right' },
          { text: 'Yes -- Spring Data JPA automatically detects and eliminates N+1 patterns for any repository it generates', to: 'q2_wrong_auto' },
          { text: 'Yes, because Spring Data JPA always loads every relationship eagerly by default, regardless of @OneToMany/@ManyToOne annotations', to: 'q2_wrong_eager' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- N+1 is about how many queries get issued when lazy relationships are accessed, a concern entirely orthogonal to how much boilerplate code was needed to issue the original query. JOIN FETCH remains the developer\'s responsibility.', next: 'q3' },
      q2_wrong_auto: { end: true, correct: false, text: 'Spring Data JPA has no automatic N+1 detection or prevention mechanism -- a naive findAll() followed by accessing a lazy relationship in a loop is exactly as N+1-prone through Spring Data as through raw EntityManager code.', retry: 'q2' },
      q2_wrong_eager: { end: true, correct: false, text: 'Fetch type (EAGER vs LAZY) is still determined by the @OneToMany/@ManyToOne annotations themselves, exactly as jpa-hibernate described -- Spring Data JPA does not override or ignore these defaults.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A developer argues it\'s safe to put a user\'s current account balance directly in a JWT\'s payload, reasoning "the token is signed, so nobody can tamper with it." Is storing sensitive data in a signed JWT\'s payload safe?',
        choices: [
          { text: 'No -- signing only proves the payload wasn\'t tampered with; it does not hide the payload\'s contents, which are base64-encoded (not encrypted) and readable by anyone holding the token', to: 'q3_right' },
          { text: 'Yes -- a valid signature guarantees both authenticity and confidentiality of everything in the payload', to: 'q3_wrong_confidential' },
          { text: 'Yes, as long as the token has a short expiration time', to: 'q3_wrong_expiration' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- the signature protects against tampering, not against reading. Anyone who obtains the token (a network observer, browser dev tools, client-side storage access) can trivially decode and read every claim in the payload, sensitive or not.', next: null },
      q3_wrong_confidential: { end: true, correct: false, text: 'A signature and encryption are different things -- signing proves authenticity and integrity (unmodified, genuinely from the signer); it provides zero confidentiality, since the payload itself is only base64-encoded, not encrypted.', retry: 'q3' },
      q3_wrong_expiration: { end: true, correct: false, text: 'A shorter expiration limits how LONG a stolen token remains usable for authentication -- it does nothing to prevent the payload\'s contents from being read at any point before (or even after) expiration, since decoding base64 requires no validity check at all.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Assuming Spring Data JPA\'s convenience automatically prevents N+1 query problems -- it only reduces the code needed to issue a query; JOIN FETCH is still required explicitly for any query whose results will have lazy relationships accessed afterward.',
    'Misspelling a property name in a derived query method (findByAuhorId instead of findByAuthorId) -- this fails loudly at application STARTUP with a clear error, not silently at first use, since Spring Data JPA validates derived queries against the entity mapping when the application starts.',
    'Confusing authentication with authorization -- a genuinely authenticated user can still be correctly denied a specific action; checking only "is this user logged in" without also checking "is this user PERMITTED to do this specific thing" is a real, common security gap.',
    'Using a fast, general-purpose hash function (SHA-256, MD5) for passwords instead of a deliberately slow, salted algorithm like BCrypt -- fast hashes make brute-force attacks against a stolen password database computationally cheap.',
    'Putting sensitive data (a password hash, a credit card number, anything genuinely secret) inside a JWT\'s payload -- the payload is base64-encoded, not encrypted, and readable by anyone holding the token regardless of the signature\'s validity.',
    'Testing JWT expiration logic against the real system clock (Instant.now()) instead of an injectable Clock -- a test run right at or near a token\'s expiration boundary is exactly the kind of environment/timing-dependent flakiness datetime-io-nio and tdd-coverage-flaky-tests both warned about.'
  ],
  interview: [
    {
      q: 'A colleague proposes storing session state (which user is logged in) in a traditional server-side session instead of using JWTs, arguing "it\'s simpler and we don\'t need to worry about JWT signing/expiration complexity." Evaluate this tradeoff using http-rest-json\'s statelessness material.',
      a: 'The colleague is right that server-side sessions are genuinely simpler in one specific, real sense: no signing keys to manage, no token-expiration edge cases, no risk of a leaked token remaining valid until it expires (a server-side session can be invalidated instantly, server-side, the moment a logout or security concern is detected — a JWT, once issued, remains valid until its own expiration unless additional infrastructure like a token-revocation list is built specifically to allow early invalidation, undermining some of JWT\'s statelessness benefit). But this simplicity comes at a real, architecturally significant cost this course has built directly toward recognizing: a server-side session reintroduces exactly the STATEFUL-server problem http-rest-json\'s own interview material argued against — the server must remember "session ID X is logged in as user Y" SOMEWHERE, either in one specific server instance\'s own memory (requiring sticky sessions, pinning each client to the same instance for their whole session, undermining a load balancer\'s ability to distribute traffic freely and complicating rolling deploys) or in a SHARED session store every instance must consult on every request (introducing a new, potentially-bottlenecking piece of shared infrastructure, and a new single point of failure). The precise tradeoff: server-side sessions trade AWAY the statelessness that makes horizontal scaling clean and simple, in exchange for simpler invalidation semantics and one less piece of cryptographic infrastructure to manage; JWTs trade away instant server-side invalidation (a real, sometimes serious cost — a compromised JWT can\'t simply be "logged out" the way a server-side session can) in exchange for genuine, simple statelessness. Neither is unconditionally "simpler" — the right choice depends on which cost a given system can more comfortably absorb, and a system with strict horizontal-scaling requirements or serving many independent client types (a web app, a mobile app, a CLI tool) tends to favor JWTs specifically for the statelessness, while a system with a single, tightly-controlled client and strong "must be able to instantly revoke access" requirements might reasonably prefer server-side sessions despite the scaling cost.'
    },
    {
      q: 'Design (in words) a system for revoking a specific JWT before its natural expiration (e.g. a user reports their token was stolen), given that JWTs are, by design, self-contained and stateless. Explain the fundamental tension this requirement creates with JWT\'s core design goal.',
      a: 'This requirement is in direct, fundamental tension with JWT\'s entire design premise: the whole POINT of a JWT is that the server can verify it\'s valid purely by checking its signature and expiration claim, with NO server-side lookup required at all — genuine statelessness. "Revoke this specific token before its natural expiration" is inherently a request for the server to REMEMBER something ADDITIONAL about this one specific token (namely, "this one has been explicitly invalidated, despite its signature and expiration both still checking out") — which necessarily requires reintroducing SOME form of server-side state, exactly what JWTs were adopted to avoid, at least for this one narrow purpose. The standard, practical compromise: maintain a DENYLIST (or "revocation list") — a small, server-side store (commonly a fast in-memory cache like Redis, chosen specifically because it needs to be checked on every single request and must stay fast) recording the unique IDENTIFIERS (a jti — "JWT ID" — claim, a unique value embedded in the token specifically for this purpose) of tokens that have been explicitly revoked before their natural expiration. On every request, AFTER the signature and expiration checks pass (the normal, stateless JWT validation), the server performs ONE additional, fast lookup: "is this token\'s jti in the denylist?" — if yes, reject despite an otherwise-valid signature and unexpired timestamp. This is a genuine, deliberate compromise, not a clean solution: it reintroduces EXACTLY the shared, server-side lookup JWTs exist to avoid, though in a much smaller, narrower form than a full session store (only EXPLICITLY revoked tokens need an entry, not every currently-valid session, and entries can be automatically expired from the denylist once the token\'s own natural expiration passes anyway, keeping the store small) — a pragmatic middle ground that keeps the vast majority of requests (for non-revoked tokens) purely stateless and fast, while still allowing the rare, genuinely necessary "revoke this compromised token right now" capability server-side sessions provide naturally but JWTs, by design, do not.'
    },
    {
      q: 'A production incident: two users with the SAME password ("Summer2026!") are discovered, upon a database breach investigation, to have completely different stored password hash values. A junior engineer flags this as a bug — "shouldn\'t identical passwords produce identical hashes for consistency?" Evaluate this concern.',
      a: 'This is not a bug at all — it is BCrypt\'s salting mechanism working exactly as intended, and the junior engineer\'s instinct (identical inputs should produce identical outputs "for consistency") is precisely the property a GOOD password hashing scheme deliberately AVOIDS, for a specific, serious security reason. If BCrypt (or any password hash) produced IDENTICAL hashes for identical passwords, an attacker who breaches the database and successfully reverses (or brute-forces) even ONE user\'s hash back to its original password would immediately know EVERY OTHER user sharing that same hash value also has that SAME password — turning one successful crack into a mass compromise instantly, and, worse, letting an attacker precompute a RAINBOW TABLE (a table mapping common passwords to their hash values, computed once, reused against any breached database) that would work identically against every user\'s account using a common password, essentially for free after the one-time table-building cost. BCrypt\'s automatic per-user SALT (random data mixed into the hash computation, unique per password-set event, stored alongside the resulting hash) specifically defeats both of these — two users with the password "Summer2026!" get given two DIFFERENT random salts, producing two COMPLETELY DIFFERENT stored hash values, meaning cracking one user\'s hash reveals NOTHING about whether any other user shares the same password, and a precomputed rainbow table (built against unsalted or fixed-salt hashes) is useless against a properly-salted hash scheme, since the attacker would need a SEPARATE table per possible salt value, an astronomically larger computation. The correct response to this "incident": there is no bug to fix here at all — this IS the security property working correctly; if anything, discovering two users\' hashes to be DIFFERENT despite (unknown to the investigators at the time) sharing the same underlying password is exactly the outcome that should be reassuring, not alarming.'
    },
    {
      q: 'A test suite has a test asserting that a JWT issued with a 1-hour expiration is still valid immediately after issuance, and a separate test asserting an expired token (issued with a -1 hour expiration, i.e. already expired) is correctly rejected. Both tests use `Instant.now()` directly, calling the real system clock. Diagnose the flaky-test risk here using datetime-io-nio and tdd-coverage-flaky-tests\' material, and propose the fix.',
      a: 'The "still valid immediately" test is at LOW but non-zero risk: it constructs a token with expiration Instant.now().plus(Duration.ofHours(1)) and immediately checks validity — since an hour of margin is enormous relative to any realistic test execution delay, this test is very unlikely to flake in practice, but it is still, strictly, coupling the test\'s correctness to the ACTUAL WALL-CLOCK TIME elapsing between token construction and validation, exactly the kind of real-clock dependency datetime-io-nio\'s Instant-vs-LocalDateTime material and tdd-coverage-flaky-tests\' taxonomy both flagged as a real, if sometimes low-probability, root cause — a CI environment under heavy load, or a debugger pause during a test run, is a genuinely realistic (if rare) way to introduce enough delay to matter, especially if a future code change shortens the margin (someone "simplifying" the test to a 1-SECOND expiration instead of 1 hour, not realizing the timing margin was load-bearing). The "already expired" test is at REAL, meaningfully higher risk in the OPPOSITE direction depending on implementation details: constructing a token with expiration Instant.now().minus(Duration.ofHours(1)) and asserting it\'s rejected is generally safe (an hour in the past stays safely in the past regardless of test timing), but a test author who instead used a much SMALLER negative margin (Instant.now().minus(Duration.ofMillis(10)), say, trying to test "just barely expired") would create a genuine race between the token\'s claimed expiration and the ACTUAL current time at the moment the validation check runs — exactly the kind of tight timing-dependent assertion this course has repeatedly warned produces real, intermittent flakiness. The fix, directly following the pattern this lesson\'s own concept section previewed: inject a CONTROLLABLE java.time.Clock into whatever component issues and validates tokens (spring-core-di\'s constructor injection, applied to a Clock dependency exactly the way it\'s applied to any other collaborator), rather than calling Instant.now() directly inside that component\'s own code — a test can then supply a FIXED, entirely deterministic Clock (Clock.fixed(someInstant, ZoneOffset.UTC)) for both token issuance AND validation within the same test, making "issue a token, then advance the fixed clock by exactly 61 minutes, then check it\'s expired" a completely deterministic assertion with zero dependency on real wall-clock timing at all, eliminating this entire category of flakiness risk regardless of how tight the tested time margins are.'
    }
  ]
};
