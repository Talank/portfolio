window.LESSONS = window.LESSONS || {};
window.LESSONS['http-rest-json'] = {
  id: 'http-rest-json',
  title: 'HTTP, REST & JSON: How the Web Actually Talks (plus Jackson)',
  category: 'Part 9 — Backend with Spring',
  timeMin: 45,
  summary: 'Before Spring (next lesson) wraps HTTP handling in convenient annotations, this lesson covers what\'s actually happening underneath: the HTTP request/response protocol, its methods and their precise idempotency/safety guarantees, status codes and what each CLASS of code actually promises, REST as an architectural style for organizing an API around resources, and JSON — the universal wire format LogPose\'s API will speak — including Jackson, the standard Java library for converting between Java objects and JSON, with real attention to the exact same Instant/LocalDate serialization care datetime-io-nio built earlier. Everything here is server-framework-agnostic; spring-boot-rest-api (Part 9\'s third lesson) is where Spring turns these same concepts into working @RestController code.',
  goals: [
    'Explain the HTTP request/response model and name the standard methods (GET/POST/PUT/PATCH/DELETE) with their precise meanings',
    'Distinguish idempotent from non-idempotent and safe from unsafe HTTP methods, and explain why this determines whether a client can safely retry a failed request',
    'Group HTTP status codes by class (2xx/3xx/4xx/5xx) and choose the correct specific code for common API outcomes (201, 204, 400, 404, 409, 422, 500)',
    'Design a REST API\'s URI structure around resources (collections and individual items) rather than actions',
    'Use Jackson\'s ObjectMapper to serialize and deserialize Java records to/from JSON, correctly configured for LocalDate/Instant fields via JavaTimeModule'
  ],
  concept: [
    {
      h: 'HTTP: a request/response protocol, and its standard methods',
      p: [
        'HTTP (HyperText Transfer Protocol) is a REQUEST/RESPONSE protocol: a CLIENT sends a request (a METHOD, a URI identifying a resource, HEADERS, and optionally a BODY) to a SERVER, and the server sends back exactly one RESPONSE (a STATUS CODE, headers, and optionally a body) — HTTP itself is STATELESS, meaning the server treats each request independently, with no memory of previous requests baked into the protocol itself (any "session" a real application maintains is built ON TOP of HTTP, typically via a token sent with every request, not something HTTP provides natively). The standard methods each carry a specific, well-understood MEANING that well-behaved APIs are expected to honor: <code>GET</code> retrieves a resource\'s current representation, <code>POST</code> creates a new resource (or triggers some other non-idempotent action), <code>PUT</code> replaces a resource\'s entire representation, <code>PATCH</code> applies a PARTIAL update to a resource, and <code>DELETE</code> removes a resource.',
        'A request typically includes a <code>Content-Type</code> header describing the BODY\'s format (<code>application/json</code> for LogPose\'s API) and, for authenticated requests, an <code>Authorization</code> header — headers this course will use directly once Spring Security arrives (Part 9\'s fourth lesson). Choosing the WRONG method for an operation isn\'t a cosmetic mistake — using GET to trigger a state-changing action (say, GET /papers/42/delete) breaks the safety guarantee the next section covers precisely, with real, concrete consequences: a web crawler or browser prefetcher that assumes GET requests are harmless to make speculatively could accidentally trigger real deletions just by following links.'
      ]
    },
    {
      h: 'Idempotency and safety: which methods a client can safely retry',
      p: [
        'Two precise, easily-confused properties matter enormously for how a client behaves under network failure. A method is SAFE if it has no side effects on the server — GET and HEAD are safe; calling them any number of times changes nothing. A method is IDEMPOTENT if making the SAME request MULTIPLE times has the exact same effect as making it ONCE — GET, PUT, and DELETE are idempotent (calling DELETE /papers/42 five times leaves paper 42 deleted, exactly the same end state as calling it once — the second through fifth calls simply find nothing left to delete); POST is explicitly NOT idempotent (calling POST /papers five times with the same body creates FIVE separate new papers, since each call is "create a new one" by definition, with no concept of "this is the same creation request as before").',
        'This precise distinction directly determines whether a network CLIENT can safely retry a request after a timeout or connection failure without knowing whether the original request actually reached the server: retrying an idempotent request (GET, PUT, DELETE) is always safe — worst case, it just repeats a no-op. Blindly retrying a non-idempotent POST after an ambiguous failure (the request timed out — did it actually create the paper before timing out, or not?) risks creating a DUPLICATE resource if the original request actually succeeded server-side despite the client never getting the response. This is directly the same "don\'t blindly retry without understanding what you\'re retrying" discipline tdd-coverage-flaky-tests built for flaky TESTS, now applied to network-level RETRIES: a retry policy that automatically retries any failed request without checking whether the method is idempotent is a genuine, common source of real bugs (duplicate charges, duplicate resource creation) — the standard mitigation for safely retrying POST specifically is an IDEMPOTENCY KEY (a client-generated unique ID sent with the request, letting the server recognize and ignore a duplicate retry of the SAME logical request, rather than creating a second resource).'
      ]
    },
    {
      h: 'Status codes: what each class actually promises',
      p: [
        'HTTP status codes are grouped into five classes by their first digit, and the CLASS itself carries meaning independent of the specific code: <code>2xx</code> means success — the request was received, understood, and accepted; <code>3xx</code> means redirection — further action is needed, typically following a different URI; <code>4xx</code> means CLIENT error — the request itself was malformed, unauthorized, or referenced something that doesn\'t exist, and retrying the IDENTICAL request will fail identically every time; <code>5xx</code> means SERVER error — something went wrong on the server\'s end, and the SAME request might well succeed if retried later (a real, meaningful distinction for a retry policy: 4xx errors should generally not be retried at all, since nothing about the request changed; 5xx errors, for idempotent methods, often SHOULD be retried).',
        'The specific codes worth knowing precisely for API design: <code>200 OK</code> (a successful GET or a successful action with a response body), <code>201 Created</code> (a successful POST that created a new resource — conventionally paired with a <code>Location</code> header pointing at the new resource\'s URI, e.g. <code>Location: /papers/42</code>), <code>204 No Content</code> (a successful action with nothing meaningful to return — a common choice for a successful DELETE), <code>400 Bad Request</code> (the request body/parameters are malformed or fail basic validation — a blank title, exactly the kind of check exceptions\' IllegalArgumentException validation was doing all along, now expressed as an HTTP-layer response instead of a thrown exception), <code>404 Not Found</code> (no resource exists at this URI — GET /papers/9999 when paper 9999 doesn\'t exist), <code>409 Conflict</code> (the request conflicts with the resource\'s current state — attempting to create a paper with a DOI that sql-postgresql\'s UNIQUE constraint already has on file should map to 409, not a generic 500, since the CLIENT can meaningfully act on that information by choosing a different DOI), <code>422 Unprocessable Entity</code> (the request is well-formed but semantically invalid — a score outside jdbc-transactions\' CHECK (score BETWEEN 1 AND 5) range), and <code>500 Internal Server Error</code> (something genuinely broke on the server — a bug, an unexpected exception, never something the client caused or can fix by changing its request).'
      ]
    },
    {
      h: 'REST: organizing an API around resources, not actions',
      p: [
        'REST (Representational State Transfer) is an architectural STYLE, not a protocol or a library — its central idea is organizing an API around RESOURCES (nouns: papers, reviews, authors) rather than ACTIONS (verbs baked into the URI itself, like an older-style RPC endpoint named /getPaperById or /deletePaperById). A RESTful URI names a resource; the HTTP METHOD, not the URI, expresses what to DO to it — <code>GET /papers</code> lists the collection of all papers, <code>POST /papers</code> creates a new paper within that collection, <code>GET /papers/42</code> retrieves ONE specific paper, <code>PUT /papers/42</code> replaces paper 42\'s entire representation, <code>DELETE /papers/42</code> removes it — the same URI pattern (a COLLECTION endpoint and an individual-RESOURCE endpoint nested under it) repeats consistently across every resource type the API exposes, exactly the kind of consistent, predictable convention that makes an API learnable without memorizing a separate, differently-shaped endpoint for every single operation.',
        'Nested resources express RELATIONSHIPS the same way sql-postgresql\'s foreign keys did: <code>GET /papers/42/reviews</code> retrieves the reviews belonging to paper 42 specifically, directly mirroring the reviews table\'s <code>paper_id</code> foreign key relationship at the URI level. A genuinely RESTful API also aims to be STATELESS in the same sense HTTP itself is — each request carries everything the server needs to understand it (including authentication, once Spring Security arrives), rather than depending on server-side memory of previous requests in the same "session," which is precisely what lets a RESTful API be served by ANY of several interchangeable server instances behind a load balancer, with no single instance needing to have "remembered" a particular client\'s prior requests.'
      ]
    },
    {
      h: 'JSON and Jackson: the wire format, and mapping it to Java records',
      p: [
        'JSON (JavaScript Object Notation) is the near-universal wire format for REST APIs — a compact, human-readable, language-agnostic text format built from objects (<code>{"key": value, ...}</code>), arrays (<code>[value, value, ...]</code>), strings, numbers, booleans, and <code>null</code> — precisely the datetime-io-nio lesson\'s "why LogPose stores/transmits data as JSON rather than Java\'s built-in Serializable" payoff, now given full treatment: JSON is readable outside the JVM by any language\'s HTTP client, versions gracefully as fields are added, and carries none of Serializable\'s security baggage. Jackson is the standard Java library for converting between Java objects and JSON — <code>ObjectMapper</code> is its central class: <code>mapper.writeValueAsString(paperDto)</code> serializes a Java object to a JSON string; <code>mapper.readValue(jsonString, PaperDto.class)</code> deserializes JSON back into a Java object. Jackson works naturally with RECORDS (records-sealed-pattern-matching\'s modern data-modeling tool) out of the box in current Jackson versions — a record\'s canonical constructor and accessor methods are exactly the shape Jackson needs to both construct one from JSON and read its fields back out to JSON, with no extra annotations required for the common case.',
        'One real, common gotcha needs explicit handling, directly connecting back to datetime-io-nio: Jackson does NOT know how to serialize <code>java.time</code> types (<code>LocalDate</code>, <code>Instant</code>, etc.) out of the box — attempting to serialize one without configuration either fails outright or, worse, silently serializes it as a raw numeric timestamp instead of a readable ISO-8601 string. The fix is registering the <code>jackson-datatype-jsr310</code> module\'s <code>JavaTimeModule</code> on the <code>ObjectMapper</code> (<code>mapper.registerModule(new JavaTimeModule())</code>), and typically also disabling <code>SerializationFeature.WRITE_DATES_AS_TIMESTAMPS</code> so dates serialize as the same unambiguous ISO-8601 text (<code>"2026-07-15"</code>) datetime-io-nio\'s DateTimeFormatter section argued for as the STORE-and-LOG format — configuring this correctly ONCE, on a shared ObjectMapper instance, rather than forgetting it and discovering the gap only when a date field silently serializes wrong in production.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Den Den Mushi network: a call type for every intent, and a croak that never lies about the outcome',
      text: 'Every call placed over the Den Den Mushi network follows a strict, universal protocol the whole world honors — you dial a specific snail number identifying exactly WHO or WHAT you\'re calling about (a URI naming a resource), and you make a specific KIND of call depending on your actual intent: a plain LISTEN-only call just to hear the current news with no effect on anything (GET), an URGENT call specifically to register something brand-new that\'s never existed before (POST), a full REPLACEMENT call updating an entire existing record from scratch (PUT), or a CANCELLATION call (DELETE). And here is the network\'s one absolute, load-bearing rule: the receiving snail ALWAYS croaks back a clear, honest STATUS — never silence, never ambiguity. A cheerful, short croak means the call went through exactly as intended (2xx). A "try a different snail, I\'ve relocated" croak redirects you (3xx). A "you\'ve dialed something that doesn\'t exist, or you\'re not authorized to reach this line" croak means the fault is on the CALLER\'s end, and dialing the identical number again will get the identical croak every time (4xx) — while a "something\'s genuinely broken on MY end right now" croak means the fault is the RECEIVING snail\'s, and might well succeed if you try again shortly (5xx). Here\'s the operator training every Den Den Mushi crew learns the hard way: dialing a CANCELLATION line five times in a row because the connection kept dropping leaves EXACTLY one thing cancelled — the fifth attempt just finds nothing left to cancel, no harm done (DELETE, idempotent, safe to retry blindly). But dialing an URGENT "register something brand new" line five times because you weren\'t sure the first call actually connected creates FIVE separate new registrations — a real, embarrassing, costly mistake that\'s happened to careless crews before (POST, NOT idempotent — never blindly retry it without a way to recognize "this is the SAME request as before," not a new one). And when Robin sends a written report over the network to a completely different office, she never assumes the receiving office uses the SAME internal filing conventions the Sunny does — she writes it in one universal, plain, standardized format any office anywhere can read and reconstruct correctly, being especially careful that DATES are written the exact same unambiguous way every single time (JSON as the universal wire format, and the same Instant-first discipline datetime-io-nio built).',
    },
    sitcom: {
      show: 'Friends',
      title: 'Central Perk\'s new phone-order line, and Joey\'s five-pizza mistake',
      text: 'When Central Perk adds a phone-order line, the gang quickly learns it follows a strict protocol every caller has to respect. Dialing in just to HEAR today\'s specials, with no effect on anything, is one kind of call (GET) — dialing in specifically to place a BRAND NEW order that\'s never existed before is a completely different kind (POST) — dialing in to COMPLETELY REPLACE an existing order with a new one from scratch is yet another (PUT) — and dialing in to CANCEL an order is its own distinct kind (DELETE). The one rule Gunther enforces without exception: every single call gets a clear, honest response, never dead silence — a cheerful "you\'re all set" means it went through exactly as asked (2xx); "sorry, we don\'t have an order under that name" means the CALLER got something wrong, and calling back with the identical request gets the identical answer every time (4xx); "the kitchen\'s system is down right now" means the fault is on CENTRAL PERK\'s end, and might well work if you call back in five minutes (5xx). And here\'s the exact mistake Joey makes, famously, more than once: he calls to CANCEL an order because he changed his mind, the line cuts out mid-call, and — anxious it didn\'t go through — he calls back and cancels again, and again, just to be safe; no harm done, the order\'s cancelled either way (DELETE, idempotent, safe to retry blindly). But the time Joey calls to place a BRAND NEW pizza order, the line cuts out, and, unsure if it went through, he just calls back and orders AGAIN to be safe — TWO full pizzas show up, and he has to awkwardly explain to Chandler why there\'s suddenly twice as much food as anyone ordered (POST, NOT idempotent — blindly re-calling a "place a new order" line without any way to say "this is the SAME order as before, not a second one" is exactly how you end up with duplicates). And when Ross texts the party details to friends visiting from out of town, he never assumes their phones use HIS exact contact-list format — he writes it out in plain, universally readable text anyone\'s phone can display correctly, being especially careful to write the DATE and TIME unambiguously so nobody shows up on the wrong day.',
    },
    why: 'A Den Den Mushi call type / a Central Perk order-line call type is an HTTP method — GET listens with no effect, POST registers something brand new, PUT replaces, DELETE removes. The honest, mandatory status croak / phone response is an HTTP status code, grouped by class: 2xx success, 4xx the caller\'s own fault (retrying identically fails identically), 5xx the receiving end\'s fault (worth retrying). Cancelling five times with no extra effect / Joey\'s repeated safe cancel calls is idempotency; registering something new five times by accident / Joey\'s duplicate pizza order is exactly why POST is NOT idempotent and should never be blindly retried. And Robin\'s / Ross\'s universal, plain-text report understandable by any receiving office or phone, with dates written unambiguously, is JSON as the universal wire format.'
  },
  storyAnim: {
    title: 'A call type for every intent, an honest status croak, and the five-pizza mistake',
    h: 340,
    props: [
      { id: 'listen', emoji: '👂', label: 'a listen-only call, no effect on anything (GET)', x: 6, y: 8 },
      { id: 'urgent', emoji: '📣', label: 'an urgent call to register something brand new (POST)', x: 28, y: 8 },
      { id: 'croak2xx', emoji: '✅', label: 'a cheerful "went through exactly as asked" croak (2xx)', x: 50, y: 8 },
      { id: 'croak4xx', emoji: '🙅', label: '"you dialed wrong" -- retry gets the SAME answer (4xx)', x: 72, y: 8 },
      { id: 'cancelretry', emoji: '🔁', label: 'cancelling five times: still just ONE thing cancelled (idempotent DELETE)', x: 20, y: 50 },
      { id: 'duplicate', emoji: '🍕🍕', label: 'ordering "new" five times by accident: FIVE pizzas show up (non-idempotent POST)', x: 55, y: 50 },
      { id: 'universal', emoji: '📜', label: 'one universal plain-text report any office can read (JSON)', x: 80, y: 50 }
    ],
    actors: [
      { id: 'robin', emoji: '📖', label: 'Robin', x: 20, y: 78 },
      { id: 'joey', emoji: '🍕', label: 'Joey', x: 65, y: 78 }
    ],
    steps: [
      { c: 'A listen-only call just asks for current info -- nothing changes on the other end.', p: { listen: 'good' } },
      { c: 'An urgent call registers something brand new that never existed before.', p: { urgent: 'lit' } },
      { c: 'Every call gets an honest status croak -- a cheerful one means it went through exactly as intended.', p: { croak2xx: 'good' } },
      { c: 'A "you dialed wrong" croak means the fault is the CALLER\'s -- dialing the identical number again gets the identical answer.', p: { croak4xx: 'bad' } },
      { c: 'Cancelling the same thing five times because the line kept dropping leaves exactly ONE thing cancelled -- safe to retry blindly.', p: { cancelretry: 'good' } },
      { c: 'But Joey re-ordering a "brand new" pizza five times because he wasn\'t sure it went through gets him FIVE pizzas -- retrying blindly was the mistake.', p: { duplicate: 'bad' }, a: { joey: [55, 60] } },
      { c: 'Robin writes reports in one universal format any receiving office can read, dates written unambiguously every time.', p: { universal: 'good' }, a: { robin: [80, 60] } }
    ]
  },
  conceptFlow: {
    title: 'From HTTP\'s request/response model to idempotency, status codes, REST, and JSON',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'HTTP basics',
        nodes: [
          { id: 'reqresp', text: 'request/response,\nstateless by default' },
          { id: 'methods', text: 'GET/POST/PUT/PATCH/DELETE:\neach with a specific meaning' }
        ]
      },
      {
        label: 'Idempotency & safety',
        nodes: [
          { id: 'safe', text: 'safe: GET/HEAD --\nno side effects' },
          { id: 'idempotent', text: 'idempotent: GET/PUT/DELETE --\nsame result no matter how many times' },
          { id: 'retrypolicy', text: 'only idempotent requests are\nsafe to blindly retry' }
        ]
      },
      {
        label: 'Status codes',
        nodes: [
          { id: 'classes', text: '2xx success, 4xx client\nfault, 5xx server fault' },
          { id: 'specific', text: '201 Created, 204 No Content,\n404, 409 Conflict, 422' }
        ]
      },
      {
        label: 'REST & JSON',
        nodes: [
          { id: 'resources', text: 'REST: URIs name resources,\nmethods express the action' },
          { id: 'jackson', text: 'Jackson + JavaTimeModule:\nrecords <-> JSON' }
        ]
      }
    ],
    steps: [
      { active: ['reqresp'], note: 'A client sends a request, a server sends back exactly one response -- HTTP itself carries no memory of prior requests.' },
      { active: ['methods'], note: 'GET retrieves, POST creates, PUT replaces, PATCH partially updates, DELETE removes -- each method carries a specific expected meaning.' },
      { active: ['safe'], note: 'A safe method has no side effects at all -- calling it changes nothing on the server, regardless of how many times.' },
      { active: ['idempotent'], note: 'An idempotent method produces the same end state no matter how many times it\'s called -- GET, PUT, and DELETE all qualify; POST does not.' },
      { active: ['retrypolicy'], note: 'Blindly retrying a non-idempotent POST after an ambiguous failure risks creating a duplicate resource -- only idempotent methods are safe to retry without extra care.' },
      { active: ['classes'], note: '2xx means success; 4xx means the client\'s request itself was wrong (retrying identically fails identically); 5xx means the server\'s fault (often worth retrying).' },
      { active: ['specific'], note: '201 Created for a successful POST, 204 No Content for a successful DELETE, 404 for a missing resource, 409 for a conflicting state, 422 for a semantically invalid but well-formed request.' },
      { active: ['resources'], note: 'REST organizes an API around resources named by URIs, with the HTTP method expressing the action -- not action names baked into the URI itself.' },
      { active: ['jackson'], note: 'Jackson\'s ObjectMapper converts records to and from JSON directly, but needs JavaTimeModule registered explicitly to handle LocalDate/Instant correctly.' }
    ]
  },
  tech: [
    {
      q: 'A client sends POST /papers to create a new paper, the connection times out before any response arrives, and the client doesn\'t know whether the server actually processed the request before the timeout. Explain precisely why simply retrying the identical POST is risky, and describe the standard fix.',
      a: 'POST is explicitly NOT idempotent — the server\'s contract for POST /papers is "create a new resource," with no built-in concept of "this is the same logical creation request as an earlier one." If the original request actually reached the server and was fully processed BEFORE the response was lost in transit (a very real possibility with a network timeout — the request can succeed server-side even if the client never sees confirmation), a naive retry sends a SECOND, textually identical POST /papers request, which the server has no way to distinguish from a genuinely new, separate creation request — it will create a SECOND paper, a real, duplicate resource, silently. The risk here isn\'t hypothetical or rare; it is the exact, well-documented reason payment APIs, in particular, are notorious for duplicate-charge bugs when clients retry failed requests naively. The standard fix is an IDEMPOTENCY KEY: the CLIENT generates a unique identifier (a UUID) for each logical creation attempt and sends it along with the POST request (commonly as a header, e.g. Idempotency-Key: abc-123); the server records which idempotency keys it has already successfully processed, and if a retry arrives carrying a key it has ALREADY seen, the server returns the SAME response as the original successful request (or a 409 Conflict, depending on the API\'s design) WITHOUT creating a second resource — this effectively makes POST safely retryable by layering an explicit, application-level idempotency guarantee on top of a method that doesn\'t provide one natively.'
    },
    {
      q: 'An API returns 500 Internal Server Error when a client attempts to create a paper with a DOI that already exists in the database (violating sql-postgresql\'s UNIQUE constraint on papers.doi). Explain precisely why this is the wrong status code, and what the API should return instead, including what the client can and cannot infer from each choice.',
      a: '500 is specifically reserved for the SERVER\'s own fault — something genuinely broken in the application\'s own logic, infrastructure, or an unexpected condition the server itself failed to handle correctly — and critically, a 500 response gives the CLIENT no actionable information about what to change, since by definition the problem isn\'t something the client did wrong. Here, though, the actual situation is entirely explicable and entirely the CLIENT\'s to fix: they attempted to create a resource whose desired state (a specific DOI) conflicts with the CURRENT state of the server\'s data (a paper with that DOI already exists) — this is precisely what 409 Conflict exists to communicate, a client-actionable signal meaning "your request is well-formed, but it conflicts with the resource\'s current state; choose a different DOI, or handle the fact that one already exists, and try again." A client receiving 500 has no principled way to know whether retrying with different data would help, whether this is a transient server problem worth retrying as-is, or whether their request was fundamentally flawed — they\'re left guessing. A client receiving 409 Conflict knows EXACTLY what happened (a conflict with existing data) and can act correctly on it (prompt for a different DOI, or treat this as "already exists" rather than an error to alarm the user about) — the difference between 500 and 409 here is the difference between an API that communicates precisely what went wrong and one that forces every non-success case into an opaque, unhelpful catch-all.'
    },
    {
      q: 'Explain precisely why a record like `record PaperDto(Long id, String title, Instant submittedAt)` fails to serialize correctly with a plain, unconfigured Jackson ObjectMapper, and exactly what registering JavaTimeModule changes about the resulting JSON.',
      a: 'Jackson\'s core ObjectMapper, out of the box, only knows how to serialize the types it has BUILT-IN support for — primitives, String, standard collections, and, for records specifically, the record\'s own declared component types recursively, AS LONG AS Jackson also knows how to serialize each of THOSE types. java.time.Instant is not one of Jackson\'s built-in-supported types by default; without jackson-datatype-jsr310\'s JavaTimeModule registered, Jackson falls back to REFLECTING on Instant\'s own internal structure (its private seconds/nanoseconds fields, or, depending on version and configuration, throws an exception outright reporting it doesn\'t know how to handle the type) — if it succeeds via reflection, the resulting JSON typically exposes Instant\'s RAW INTERNAL representation (a numeric epoch-seconds-and-nanos structure) rather than a readable value, which is both a genuinely ugly, implementation-detail-leaking JSON shape AND, worse, often not something Jackson can correctly DESERIALIZE back into an Instant later without the same module, since the raw reflected shape isn\'t necessarily the shape Jackson\'s own default deserialization logic expects either. Registering mapper.registerModule(new JavaTimeModule()) adds Jackson\'s OFFICIAL, purpose-built serializers/deserializers for every java.time type, Instant included — with WRITE_DATES_AS_TIMESTAMPS additionally disabled, this makes Instant serialize as a proper ISO-8601 string ("2026-07-15T14:30:00Z") rather than a raw numeric epoch value, both human-readable in the resulting JSON and correctly, symmetrically deserializable back into an Instant later using the exact same module — directly the same "store/transmit dates as unambiguous ISO-8601 text, not an opaque internal representation" discipline datetime-io-nio\'s DateTimeFormatter section built for exactly this reason.'
    },
    {
      q: 'An API design puts DELETE /papers/42/permanently-erase as an endpoint (a verb baked into the URI, called via DELETE). A colleague says this is "basically RESTful since it uses the DELETE method." Evaluate this claim.',
      a: 'This gets the method right but violates REST\'s central organizing principle in a way that matters concretely, not just stylistically. REST\'s core idea is that URIs name RESOURCES (nouns), and the HTTP METHOD is what expresses the ACTION to take on that resource — "permanently-erase" baked directly into the URI path is an ACTION VERB living where a resource name should be, which is exactly the RPC-style pattern (an endpoint per named operation) REST\'s resource-oriented style is a deliberate alternative to. The concrete problems this causes: it breaks the predictable, learnable URI convention this lesson\'s concept section built (GET /papers, GET /papers/{id}, DELETE /papers/{id} — a consistent shape repeating across every resource) by introducing a ONE-OFF, differently-shaped endpoint that has to be learned and documented separately rather than following the pattern a client could otherwise infer; and it raises a real design question the RESTful alternative avoids entirely — if "permanently erase" is meaningfully DIFFERENT from an ordinary DELETE /papers/42 (say, ordinary DELETE does a soft-delete/archive, while this endpoint does an irreversible hard-delete), then encoding that distinction as an ACTION VERB in the URI is exactly backwards; the RESTful fix would be to make ordinary DELETE /papers/42 the standard soft-delete, and if a genuinely different, rarer operation is needed, express it as a state or a QUERY PARAMETER on the same resource URI (DELETE /papers/42?hard=true) or, if it\'s conceptually a genuinely distinct sub-resource action, model it as its own clearly-named nested resource rather than a verb — the specific fix matters less than recognizing that "uses the right HTTP method" and "is resource-oriented" are two separate REST properties, and satisfying only the first does not make a URI-embedded-verb design RESTful.'
    }
  ],
  code: {
    title: 'Jackson: serializing records to JSON, with LocalDate handled correctly via JavaTimeModule',
    intro: 'A PaperDto record (nested AuthorDto, a List of tags, and a LocalDate) round-tripped through Jackson\'s ObjectMapper — configured once with JavaTimeModule so publishedOn serializes as readable ISO-8601 text, not a raw numeric timestamp.',
    code: `import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.time.LocalDate;
import java.util.List;

record AuthorDto(String name, String email) {}

record PaperDto(Long id, String title, AuthorDto author, LocalDate publishedOn, List<String> tags) {}

class JsonDemo {

    static ObjectMapper newConfiguredMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());   // teaches Jackson how to handle LocalDate/Instant/etc.
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);   // write "2026-07-15", not a raw epoch number
        return mapper;
    }

    public static void main(String[] args) throws Exception {
        ObjectMapper mapper = newConfiguredMapper();

        PaperDto paper = new PaperDto(
            1L,
            "flaky test taxonomy",
            new AuthorDto("Nami", "nami@logpose.dev"),
            LocalDate.of(2026, 7, 15),
            List.of("testing", "flaky-tests")
        );

        String json = mapper.writeValueAsString(paper);
        // {"id":1,"title":"flaky test taxonomy","author":{"name":"Nami","email":"nami@logpose.dev"},
        //  "publishedOn":"2026-07-15","tags":["testing","flaky-tests"]}
        System.out.println(json);

        PaperDto roundTripped = mapper.readValue(json, PaperDto.class);

        // records' generated equals() makes this comparison meaningful -- true field-by-field equality
        System.out.println(roundTripped.equals(paper));   // true
    }
}`,
    notes: [
      'AuthorDto and PaperDto need no special Jackson annotations at all -- a record\'s canonical constructor and accessor methods are exactly the shape Jackson needs to serialize and deserialize it in modern Jackson versions.',
      'Without registerModule(new JavaTimeModule()), serializing publishedOn would either fail outright or produce an unreadable raw internal representation instead of "2026-07-15" -- exactly the gotcha this lesson names explicitly.',
      'roundTripped.equals(paper) returning true relies directly on records-sealed-pattern-matching\'s auto-generated equals() -- confirming the JSON round-trip preserved every field exactly, nested AuthorDto and tags list included.',
      'newConfiguredMapper() is written once and reused for every serialization/deserialization call -- ObjectMapper is expensive to configure repeatedly and is thread-safe to share once built, the same "configure once, reuse" discipline as jdbc-transactions\' connection pool.'
    ]
  },
  lab: {
    title: 'Serialize a ReviewDto with a correctly-configured ObjectMapper',
    prompt: 'Given <code>record ReviewDto(Long paperId, String reviewer, Integer score, java.time.Instant decidedAt)</code>, write a method <code>ObjectMapper newConfiguredMapper()</code> that: (1) creates a new <code>ObjectMapper</code>; (2) registers <code>new JavaTimeModule()</code> on it; (3) disables <code>SerializationFeature.WRITE_DATES_AS_TIMESTAMPS</code>; (4) returns the configured mapper. Then write a method <code>boolean roundTripsCorrectly(ReviewDto review)</code> that uses <code>newConfiguredMapper()</code> to serialize <code>review</code> to a JSON string via <code>writeValueAsString</code>, deserialize it back into a <code>ReviewDto</code> via <code>readValue</code>, and return whether the result <code>equals</code> the original.',
    starter: `import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

class ReviewJsonSupport {

    ObjectMapper newConfiguredMapper() {
        // TODO: create a new ObjectMapper, register JavaTimeModule, disable WRITE_DATES_AS_TIMESTAMPS, return it
    }

    boolean roundTripsCorrectly(ReviewDto review) throws Exception {
        // TODO: serialize review with writeValueAsString, deserialize with readValue(..., ReviewDto.class), return .equals(review)
    }
}`,
    checks: [
      { re: 'new\\s+ObjectMapper\\(\\s*\\)', must: true, hint: 'newConfiguredMapper() must create a new ObjectMapper().', pass: 'new ObjectMapper() created ✓' },
      { re: '\\.registerModule\\(\\s*new\\s+JavaTimeModule\\(\\s*\\)\\s*\\)', must: true, hint: 'Call mapper.registerModule(new JavaTimeModule()).', pass: 'JavaTimeModule registered ✓' },
      { re: '\\.disable\\(\\s*SerializationFeature\\.WRITE_DATES_AS_TIMESTAMPS\\s*\\)', must: true, hint: 'Call mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS).', pass: 'WRITE_DATES_AS_TIMESTAMPS disabled ✓' },
      { re: 'writeValueAsString\\(\\s*review\\s*\\)', must: true, hint: 'roundTripsCorrectly must call writeValueAsString(review) to serialize it.', pass: 'writeValueAsString(review) called ✓' },
      { re: 'readValue\\([^,]+,\\s*ReviewDto\\.class\\s*\\)', must: true, hint: 'Deserialize with readValue(json, ReviewDto.class).', pass: 'readValue(..., ReviewDto.class) called ✓' },
      { re: '\\.equals\\(\\s*review\\s*\\)', must: true, hint: 'Return the result of comparing the round-tripped object to review with .equals(review).', pass: 'equals(review) comparison ✓' }
    ],
    run: 'mvn test — roundTripsCorrectly should return true for any valid ReviewDto, including its Instant field, confirming the mapper is correctly configured for java.time types.',
    solution: `import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

class ReviewJsonSupport {

    ObjectMapper newConfiguredMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    boolean roundTripsCorrectly(ReviewDto review) throws Exception {
        ObjectMapper mapper = newConfiguredMapper();
        String json = mapper.writeValueAsString(review);
        ReviewDto roundTripped = mapper.readValue(json, ReviewDto.class);
        return roundTripped.equals(review);
    }
}`,
    notes: [
      'Without registerModule(new JavaTimeModule()), serializing decidedAt (an Instant) would fail or produce an unreadable raw representation -- this is precisely why the lab requires it explicitly rather than assuming a plain ObjectMapper works.',
      'roundTripsCorrectly relies on ReviewDto being a record -- its auto-generated equals() checks every field, including decidedAt, so a subtly-wrong Instant serialization (losing nanosecond precision, say) would correctly cause this to return false.',
      'A real application would build newConfiguredMapper() once and reuse the same instance everywhere, rather than reconstructing it on every call as this lab\'s simplified version does for clarity.'
    ]
  },
  quiz: [
    {
      q: 'Which HTTP methods are idempotent (repeating the same request produces the same end state as making it once)?',
      options: ['GET, PUT, and DELETE', 'Only GET', 'POST, PUT, and DELETE', 'All HTTP methods are idempotent by definition'],
      correct: 0,
      explain: 'GET (no side effects at all), PUT (replaces with the same representation every time), and DELETE (repeating it finds nothing left to delete) are all idempotent. POST is explicitly NOT, since each call means "create a new one."'
    },
    {
      q: 'A client\'s POST /papers request times out with no response. Why is it risky for the client to simply retry the identical POST request without any additional safeguard?',
      options: ['The original request may have already succeeded server-side despite the timeout, and a naive retry would create a SECOND, duplicate paper, since POST has no built-in way to recognize "this is the same request as before"', 'POST requests cannot be retried at all under any circumstances, by protocol rule', 'Retrying is completely safe, since HTTP guarantees a request can never be processed twice', 'The retry will always fail immediately with a 400 Bad Request, so no duplicate can occur'],
      correct: 0,
      explain: 'POST is not idempotent. If the original request actually succeeded before the timeout, a naive retry with no idempotency mechanism creates a second, duplicate resource -- the well-documented cause of duplicate-creation and duplicate-charge bugs.'
    },
    {
      q: 'An API attempts to create a paper whose DOI already exists in the database, violating a UNIQUE constraint. What status code should the API return, and why?',
      options: ['409 Conflict -- the request is well-formed but conflicts with the resource\'s current state, giving the client actionable information (choose a different DOI) rather than an opaque server-fault signal', '500 Internal Server Error, since any database constraint violation should always be reported as a server fault', '200 OK, since the paper data itself was valid even though the DOI collided', '301 Moved Permanently, since the existing paper with that DOI has effectively "moved" the request'],
      correct: 0,
      explain: '409 Conflict precisely communicates that the well-formed request conflicts with existing data -- actionable information for the client. 500 would incorrectly suggest a server-side fault, giving the client no useful signal about what to change.'
    },
    {
      q: 'Why does an unconfigured Jackson ObjectMapper fail to correctly serialize a record field of type java.time.Instant?',
      options: ['Jackson\'s core module has no built-in support for java.time types -- registering JavaTimeModule (from jackson-datatype-jsr310) adds the official serializers/deserializers needed to handle Instant, LocalDate, and similar types correctly', 'Records cannot contain any field types other than String and primitives', 'Instant objects cannot be converted to text in Java under any circumstances', 'ObjectMapper requires every field to have an explicit @JsonProperty annotation before it will serialize anything at all'],
      correct: 0,
      explain: 'java.time types are not covered by Jackson\'s core built-in support. JavaTimeModule specifically adds correct, symmetric serialization/deserialization for them -- without it, serialization fails outright or produces an unreadable raw representation.'
    },
    {
      q: 'Why is DELETE /papers/42/permanently-erase (an action verb embedded in the URI) considered a weaker REST design than expressing the same distinction some other way?',
      options: ['REST\'s core idea is that URIs name resources while the HTTP method expresses the action -- embedding an action verb directly in the URI path breaks the predictable, learnable collection/resource URI pattern the rest of a RESTful API follows', 'DELETE cannot legally be used with any URI containing more than two path segments', 'This URI would cause the server to return a 500 Internal Server Error automatically', 'REST forbids using the DELETE method for any operation described as "permanent"'],
      correct: 0,
      explain: 'REST organizes APIs around resources (nouns) named by URIs, with the method expressing the action. An action verb baked into the URI path is exactly the RPC-style pattern REST is a deliberate alternative to, breaking the consistent, learnable URI convention.'
    }
  ],
  testFlow: {
    title: 'Test yourself: idempotency, status codes, and REST design',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A client calls DELETE /papers/42 three times in a row due to a flaky connection retrying automatically. What is the end state, and is this a problem?',
        choices: [
          { text: 'Paper 42 is deleted, exactly the same end state as if DELETE had been called once -- not a problem, since DELETE is idempotent', to: 'q1_right' },
          { text: 'Three separate deletion records are created, each representing one of the three calls', to: 'q1_wrong_three' },
          { text: 'This is a serious problem -- the server will reject the second and third calls with a fatal error', to: 'q1_wrong_fatal' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- DELETE is idempotent. The second and third calls simply find nothing left to delete (or the server treats them as no-ops), leaving the exact same end state as a single call.', next: 'q2' },
      q1_wrong_three: { end: true, correct: false, text: 'DELETE has no concept of "creating a record" at all -- it removes a resource, and repeating that removal on an already-deleted (or nonexistent) resource simply has no further effect, which is exactly what idempotency means here.', retry: 'q1' },
      q1_wrong_fatal: { end: true, correct: false, text: 'A well-designed idempotent DELETE endpoint does not treat a repeat call as a fatal error -- it either succeeds again with no effect, or returns a normal response (e.g. 204 or 404) indicating there was nothing left to delete, not a crash.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A GET request to a nonexistent resource returns 404 Not Found. Should a client automatically retry this exact same GET request a few seconds later, hoping it succeeds?',
        choices: [
          { text: 'No -- 404 is a 4xx client-class error, meaning the request itself is the problem (the resource genuinely doesn\'t exist at this URI); retrying the identical request will get the identical 404 every time unless something external changes', to: 'q2_right' },
          { text: 'Yes -- all failed requests, regardless of status code class, should always be retried automatically a few times before giving up', to: 'q2_wrong_alwaysretry' },
          { text: 'Yes, because GET requests always succeed on the second attempt due to server caching behavior', to: 'q2_wrong_caching' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- 4xx errors mean the request itself is at fault, and retrying an unchanged request against an unchanged server state will produce the identical result. Automatic retry logic should generally only target 5xx (server-fault) responses for idempotent methods.', next: 'q3' },
      q2_wrong_alwaysretry: { end: true, correct: false, text: 'Blindly retrying every failure regardless of status class wastes resources on 4xx errors that are guaranteed to fail identically again, since nothing about the client\'s request or the server\'s data changed between attempts.', retry: 'q2' },
      q2_wrong_caching: { end: true, correct: false, text: 'There is no such general guarantee -- a 404 for a resource that genuinely does not exist will continue returning 404 indefinitely, regardless of how many times the identical request is retried, unless the resource is actually created later.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'An API design has a single endpoint, POST /doEverything, accepting a "type" field in the request body to indicate whether it should create, update, or delete a resource. Is this a strong RESTful design?',
        choices: [
          { text: 'No -- REST organizes APIs around resource URIs with the HTTP method expressing the action; funneling every action through one URI and one method, distinguished only by a body field, is exactly the RPC-style pattern REST is an alternative to', to: 'q3_right' },
          { text: 'Yes -- using POST exclusively is the most RESTful choice, since POST is the most general-purpose HTTP method', to: 'q3_wrong_postbest' },
          { text: 'Yes, as long as the JSON body is well-formed, since REST only cares about the request body\'s format, not the URI or method structure', to: 'q3_wrong_bodyonly' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- this design pushes ALL the meaning that should live in the URI (which resource) and the method (which action) into an opaque body field instead, losing REST\'s predictable, learnable resource/method convention entirely.', next: null },
      q3_wrong_postbest: { end: true, correct: false, text: 'REST specifically distinguishes actions BY METHOD (GET/POST/PUT/DELETE each carrying distinct meaning) rather than treating one method as universally sufficient -- funneling everything through POST discards that distinction entirely.', retry: 'q3' },
      q3_wrong_bodyonly: { end: true, correct: false, text: 'REST cares about the URI structure and method choice specifically, not just body format -- a well-formed JSON body sent to a single, undifferentiated action endpoint is still an RPC-style design, not a resource-oriented one.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Using GET to trigger a state-changing action -- breaks GET\'s safety guarantee, and can cause real accidental side effects from crawlers or browser prefetching that assume GET requests are harmless.',
    'Blindly retrying a POST request after a timeout without an idempotency key -- risks creating a duplicate resource if the original request actually succeeded server-side before the response was lost.',
    'Returning 500 Internal Server Error for conditions that are actually the CLIENT\'s fault (bad input, a conflicting DOI) -- gives the client no actionable signal, when a specific 4xx code (400, 404, 409, 422) would tell them exactly what to fix.',
    'Retrying 4xx errors automatically, hoping a later attempt succeeds -- a 4xx means the request itself is the problem, and retrying it unchanged against unchanged server state will fail identically every time.',
    'Serializing java.time types with a plain, unconfigured Jackson ObjectMapper -- fails outright or produces an unreadable raw internal representation; always register JavaTimeModule (and typically disable WRITE_DATES_AS_TIMESTAMPS) first.',
    'Baking action verbs into a URI path (POST /papers/42/permanently-erase) instead of expressing the action through the HTTP method -- breaks REST\'s predictable resource/method convention and forces every operation to be learned and documented as its own one-off shape.'
  ],
  interview: [
    {
      q: 'A junior engineer proposes automatically retrying every failed HTTP request three times before giving up, regardless of the HTTP method or status code, to "make the client more resilient." Evaluate this proposal precisely.',
      a: 'The instinct toward resilience is reasonable, but a blanket retry-everything policy is actively dangerous, and the precise reasons matter. First, retrying based on STATUS CODE CLASS: a 4xx response means the request itself is at fault (malformed input, an unauthorized request, a genuinely missing resource) — retrying it unchanged against an unchanged server state is GUARANTEED to fail identically every time, wasting three round-trips for zero chance of success and adding needless latency to an already-failed operation the client should instead be reporting to the caller immediately. 5xx responses ARE reasonable retry candidates, since the fault may be transient on the server\'s end. Second, and more seriously: retrying based on METHOD. For GET, PUT, and DELETE (all idempotent), retrying is genuinely safe — worst case, a retry just repeats a no-op. For POST specifically, blindly retrying after ANY failure (not just a timeout, but any ambiguous failure where the client can\'t be certain whether the server processed the original request) risks creating a DUPLICATE resource, exactly this lesson\'s tech-question scenario — a real, well-documented class of bug (duplicate charges, duplicate account creation) that a blanket "retry three times" policy would introduce as a genuinely new source of production incidents, not fix. The correct, precise version of the proposal: retry automatically ONLY for 5xx responses, ONLY for idempotent methods (GET/PUT/DELETE) without any extra safeguard, and for POST specifically, only if the client generates and sends an idempotency key the server can use to recognize and deduplicate a retried request — resilience achieved through understanding exactly which failures and which methods are actually safe to retry, not blanket retry-everything logic.'
    },
    {
      q: 'Design (in words) the URI structure and HTTP methods for a REST API exposing LogPose\'s papers, their reviews, and their tags (from sql-postgresql\'s schema), including how you\'d handle listing a paper\'s reviews and adding/removing a tag from a paper. Explain your reasoning for each choice.',
      a: 'The top-level collection/resource pattern: GET /papers lists all papers, POST /papers creates a new one (returning 201 Created with a Location: /papers/{id} header), GET /papers/{id} retrieves one specific paper (404 if it doesn\'t exist), PUT /papers/{id} replaces a paper\'s full representation, DELETE /papers/{id} removes it (204 No Content on success) — this is the standard collection-then-individual-resource pattern repeating consistently, letting a client infer the shape of the API for any NEW resource type introduced later without needing separate documentation for each one. For a paper\'s reviews, which sql-postgresql modeled as a genuinely OWNED, one-to-many relationship (a review has no meaning independent of its paper, and paper_id is NOT NULL): nest reviews under their owning paper\'s URI — GET /papers/{id}/reviews lists that specific paper\'s reviews, POST /papers/{id}/reviews creates a new review FOR that paper (the paper\'s ID comes from the URI path itself, not duplicated in the request body), directly mirroring the foreign-key relationship at the URI level, the same way the concept section described. For tags, which sql-postgresql modeled as a genuine MANY-TO-MANY relationship via the paper_tags join table (a tag has independent meaning and its own lifecycle, not owned by any one paper): I\'d expose tags as their OWN top-level resource (GET /tags, POST /tags for creating brand-new tag definitions) AND expose the association itself as a nested sub-resource under papers — POST /papers/{id}/tags/{tagId} to associate an EXISTING tag with a paper (not creating a new tag, just creating the paper_tags row — hence PUT could arguably fit better here than POST, since re-associating the same tag repeatedly should be idempotent, matching the association\'s true nature) and DELETE /papers/{id}/tags/{tagId} to remove that specific association, directly exposing paper_tags\' composite-key structure (paper_id + tag_id together identify one association) at the URI level, without ever needing an action-verb endpoint like "addTagToPaper."'
    },
    {
      q: 'Explain precisely why HTTP\'s statelessness (no request depends on server-side memory of prior requests) matters for horizontal scaling, using a concrete scenario where a stateful design would break under a load balancer.',
      a: 'A genuinely stateless API means every single request carries EVERYTHING the server needs to understand and correctly respond to it — most importantly, authentication (a token identifying who the caller is, sent with every single request) rather than the server remembering "this connection already logged in earlier." This matters enormously for horizontal scaling because it means ANY server instance behind a load balancer can correctly handle ANY incoming request, with zero need for that specific instance to have seen this particular client\'s PREVIOUS requests. Concrete failure scenario for a STATEFUL design: imagine an API that authenticates a user on their FIRST request and then stores "this client is logged in" in that SPECIFIC server instance\'s own in-memory session store, expecting subsequent requests from the same client to skip re-authentication because the server instance "remembers" them. Behind a load balancer distributing requests across multiple server instances (the entire point of horizontal scaling — running several identical instances to handle more traffic than one machine could alone), the client\'s SECOND request has no guarantee of being routed to the SAME instance that handled their first — if it lands on a DIFFERENT instance, that instance has no memory of the earlier login at all, and either incorrectly rejects the client as unauthenticated, or (worse, if the system is poorly designed) the whole approach forces "sticky sessions" (the load balancer must pin a client\'s every request to the SAME server instance for the client\'s entire session), which defeats much of the actual PURPOSE of having multiple instances — it prevents the load balancer from freely distributing load evenly, makes it much harder to safely take one instance down for a deploy without disrupting clients pinned to it, and reintroduces exactly the kind of server-side, hard-to-reason-about shared state this course has repeatedly connected to flakiness and fragility elsewhere (tdd-coverage-flaky-tests\' shared-mutable-state category, now at the infrastructure level). A stateless design — every request carrying its own auth token, with no server instance needing to remember anything about any specific client between requests — sidesteps this entirely: any instance can serve any request at any time, letting the load balancer distribute traffic freely and letting instances be added, removed, or restarted without disrupting any client\'s ongoing work.'
    },
    {
      q: 'A team\'s API returns 200 OK for a successful DELETE request, with an empty response body. A colleague argues this should be 204 No Content instead. Evaluate whether this distinction actually matters, beyond stylistic preference.',
      a: 'This is a genuine, if subtle, semantic distinction worth getting right, not purely a style preference. 200 OK, by its own definition, signals "the request succeeded, AND here is a response body representing the result" — a client (or, more importantly, a GENERIC HTTP-aware intermediary like a caching proxy, a monitoring tool, or another team\'s automated client library that doesn\'t know this specific API\'s conventions) reading a 200 response has some reasonable basis to expect a MEANINGFUL body might be present, and code written generically against "handle a 200 response" might attempt to parse a body that, in this case, is deliberately empty — at best a wasted parse attempt, at worst a source of confusing edge-case bugs in generic client code that assumes 200 implies content worth reading. 204 No Content is a status code SPECIFICALLY reserved for exactly this situation — "the request succeeded, and there is deliberately, intentionally nothing further to return" — a generic client or intermediary reading 204 has a standards-based, unambiguous signal to NOT expect or attempt to parse any body at all, removing the ambiguity 200-with-an-empty-body leaves open. This distinction becomes MORE valuable, not less, the more the API is consumed by tooling that doesn\'t have special-cased knowledge of this specific team\'s conventions — an API gateway, an automated contract-testing tool (directly connecting back to integration-testing\'s contract-test material — a consumer\'s contract expecting "204, no body" versus "200, empty body" are genuinely different, checkable claims about the API\'s behavior), or a caching layer that treats 200 and 204 differently by specification. The precise, correct guidance: 200 OK for a successful action that DOES return a meaningful body (a successful GET, or a PUT that returns the updated resource\'s new representation); 204 No Content specifically for a successful action with deliberately nothing to return, DELETE being the most common example — not a matter of taste, but of using the status code whose actual defined semantics match what genuinely happened.'
    }
  ]
};
