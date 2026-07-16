window.LESSONS = window.LESSONS || {};
window.LESSONS['web-frontend-basics'] = {
  id: 'web-frontend-basics',
  title: 'Web Frontend Essentials: HTML/CSS/JS, fetch & Talking to Your API',
  category: 'Part 10 — Frontend',
  timeMin: 50,
  summary: 'Just enough frontend for a Java backend developer to build a working browser client against the PaperController API spring-boot-rest-api and spring-data-security built — not a deep JavaScript course. HTML structures a page, CSS styles it, and a small amount of JavaScript wires buttons to actions, but the load-bearing content here is fetch() — the browser API for making HTTP requests — including a genuinely easy-to-miss gotcha (fetch() does NOT reject on a 404 or 500 response, only on a real network failure) and CORS (why a browser blocks a request to a different origin unless the SERVER explicitly permits it), both of which trip up nearly every backend developer\'s first browser client.',
  goals: [
    'Structure a minimal HTML page with a form and a results container, and use JavaScript\'s DOM APIs (querySelector, addEventListener) to wire a button to a function',
    'Use fetch() to make GET and POST requests, sending and receiving JSON, against a real Spring Boot REST API',
    'Explain precisely why fetch() resolves successfully for a 404/500 response and does NOT throw, and write code that correctly checks response.ok before treating a request as successful',
    'Explain CORS: why a browser blocks a cross-origin request by default, and what a Spring Boot backend must configure to permit a specific frontend origin',
    'Map an API\'s specific error status codes (409, 400, 422 from spring-boot-rest-api) to distinct, useful messages shown to the user, rather than one generic error handler'
  ],
  concept: [
    {
      h: 'HTML and CSS: just enough structure and style to hold working JavaScript',
      p: [
        'HTML (HyperText Markup Language) structures a page as a TREE of nested ELEMENTS — a <code>&lt;form&gt;</code> containing <code>&lt;input&gt;</code> fields and a <code>&lt;button&gt;</code>, a <code>&lt;div&gt;</code> or <code>&lt;ul&gt;</code> acting as a container JavaScript will later fill with results. The browser parses this markup into the DOM (Document Object Model) — an in-memory tree of objects, one per element, that JavaScript can read and modify — every <code>document.querySelector(...)</code> call this lesson uses is navigating that tree to find a specific node. CSS (Cascading Style Sheets) then styles those elements — selectors matching elements by tag, class, or ID, and properties controlling layout, color, and spacing — genuinely important for a real product, but this lesson deliberately spends little time here: a Java backend developer\'s job is rarely to hand-craft CSS from scratch, and frontend-choices (next lesson) covers the higher-level strategic question of which frontend approach a Java team should actually adopt for real work.',
        'A <code>&lt;form&gt;</code> with an <code>onsubmit</code> handler is the traditional way a browser submits data — but a form\'s DEFAULT behavior is a full-page navigation/reload, submitting data as a raw HTTP request the browser constructs itself, not as JSON, and not to an endpoint under the developer\'s fine-grained control. This lesson\'s pattern instead calls <code>event.preventDefault()</code> inside the submit handler (stopping that default full-page-reload behavior) and manually constructs the request with <code>fetch()</code> instead — giving the developer complete control over the request\'s shape (JSON body, headers, method) exactly matching what a REST API like PaperController actually expects, rather than a browser-generated form submission format the API was never designed to receive.'
      ]
    },
    {
      h: 'JavaScript basics: variables, functions, and wiring the DOM to behavior',
      p: [
        'JavaScript needs only a small, practical subset for this purpose: <code>const</code> declares a variable that can\'t be reassigned (the default choice, exactly like Java\'s <code>final</code>); <code>let</code> declares one that can be; arrow functions (<code>(x) => x * 2</code>, or <code>() => { ... }</code> for a block body) are the common, terse function syntax; and template literals (<code>`Paper ${title} created`</code>, backtick-delimited strings with <code>${...}</code> interpolation) are JavaScript\'s equivalent of Java\'s text blocks/String.format. <code>document.querySelector(".some-class")</code> or <code>document.getElementById("some-id")</code> finds a specific DOM element (CSS-selector syntax for the former); <code>element.addEventListener("click", handlerFunction)</code> (or <code>"submit"</code> for a form) registers a function to run when that event fires — this is JavaScript\'s equivalent of Spring\'s <code>@GetMapping</code>: "when THIS specific event happens, run THIS specific code," rather than polling for changes.',
        'JavaScript is fundamentally SINGLE-THREADED with an EVENT LOOP — there is no direct equivalent of Java\'s Thread or ExecutorService running truly parallel code; instead, ASYNCHRONOUS operations (a network request being the central example this lesson cares about) return a PROMISE — an object representing a value that will become available LATER, without blocking the rest of the page from responding to other events in the meantime. <code>async function loadPapers() { const response = await fetch("/papers"); ... }</code> — the <code>async</code> keyword marks a function as one that can use <code>await</code>, which PAUSES that function\'s own execution until the awaited Promise resolves, without blocking the browser\'s single thread from handling OTHER events (a different button click, a timer) in the meantime — conceptually closer to executors-futures\' CompletableFuture chaining than to a blocking Java call, even though <code>await</code> reads almost exactly like ordinary sequential Java code.'
      ]
    },
    {
      h: 'fetch(): making real HTTP requests, and the gotcha that trips up nearly everyone',
      p: [
        '<code>fetch(url, options)</code> is the browser\'s standard API for making HTTP requests — <code>fetch("/papers")</code> makes a GET request; <code>fetch("/papers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, doi, authorId }) })</code> makes a POST request with a JSON body — directly, precisely matching http-rest-json\'s <code>Content-Type: application/json</code> header and spring-boot-rest-api\'s <code>@RequestBody CreatePaperRequest</code>, now issued from the browser instead of a Java client. <code>fetch()</code> returns a Promise resolving to a <code>Response</code> object; <code>await response.json()</code> parses the response body as JSON, returning a Promise resolving to the parsed JavaScript object/array — the browser-side mirror of Jackson\'s <code>readValue(...)</code>.',
        'Here is the genuinely easy-to-miss gotcha, worth stating with full precision: <code>fetch()</code>\'s returned Promise resolves successfully — it does NOT reject or throw — for EVERY response the server actually sends back, INCLUDING a 404 Not Found or a 500 Internal Server Error. fetch() only REJECTS for a genuine NETWORK-level failure (no connection could be established at all, DNS resolution failed, the request was blocked by CORS — the next section\'s topic). This means code that only wraps a fetch() call in try/catch, treating "no exception was thrown" as "the request succeeded," is SILENTLY WRONG — a 404 or 500 response flows through that try block with NO exception at all, and code that then blindly reads <code>response.json()</code> and treats it as the expected successful shape will either crash confusingly on malformed data, or, worse, silently treat an ERROR response\'s body as if it were legitimate success data. The correct pattern, checked EVERY time: <code>if (!response.ok) { /* handle the specific error status */ }</code> — <code>response.ok</code> is <code>true</code> exactly when the status is in the 200-299 range, and <code>response.status</code> gives the exact numeric code (404, 409, 422, ...) for precise, status-code-specific handling, directly mirroring http-rest-json\'s entire status-code-class argument, now checked explicitly in client code rather than assumed to be handled by exception-throwing the way a typical Java HTTP client library behaves.'
      ]
    },
    {
      h: 'CORS: why the browser blocks a request the server never even sees',
      p: [
        'A browser enforces the SAME-ORIGIN POLICY by default: JavaScript running on a page served from one ORIGIN (scheme + host + port — <code>http://localhost:3000</code>, say, for a frontend dev server) is BLOCKED from making a fetch() request to a DIFFERENT origin (<code>http://localhost:8080</code>, where Spring Boot\'s API actually runs) UNLESS that OTHER server explicitly opts in via CORS (Cross-Origin Resource Sharing) headers. This is a BROWSER-enforced security boundary, not a server-side limitation — the request may well be technically capable of reaching the server, and the server might process it and generate a perfectly valid response, but the BROWSER itself refuses to hand that response back to the requesting JavaScript code unless the response carries an <code>Access-Control-Allow-Origin</code> header explicitly naming (or wildcarding) the calling origin as permitted — this exists specifically to prevent a MALICIOUS page from silently making authenticated requests to an unrelated site on a victim\'s behalf, using the victim\'s own browser session, and reading back the response.',
        'A Spring Boot backend must explicitly permit the frontend\'s origin — either <code>@CrossOrigin(origins = "http://localhost:3000")</code> on a specific controller/method, or a global <code>WebMvcConfigurer</code> bean configuring allowed origins application-wide — with NO such configuration, a fetch() call from a different-origin frontend to PaperController FAILS entirely at the BROWSER level, before the response (even a perfectly successful one from the server\'s own perspective) is ever exposed to the calling JavaScript at all, typically surfacing as a vague "Failed to fetch" / network-error-looking message in the browser\'s console rather than any HTTP status code your fetch()-handling code could inspect — precisely because, from the fetch() API\'s perspective, THIS specific failure genuinely is treated as a network-level rejection (the Promise REJECTS, unlike a 404/500), not a resolved Response with an unfavorable status, exactly the distinction the previous section drew. This is a near-universal first stumbling block for any Java backend developer\'s first browser client, and recognizing it as "the browser blocking on purpose, not a bug in either side\'s code" is the single most useful thing to know walking in.'
      ]
    },
    {
      h: 'Mapping specific status codes to specific, useful user-facing messages',
      p: [
        'spring-boot-rest-api\'s <code>@ControllerAdvice</code> maps <code>DuplicateDoiException</code> to <code>409 Conflict</code> and a validation failure to <code>400 Bad Request</code> — specifically SO that a client can distinguish these cases and respond appropriately, exactly the payoff this lesson exists to realize on the browser side. Checking only <code>response.ok</code> and showing one generic "something went wrong" message for EVERY non-2xx response discards ALL of that carefully-designed status-code precision — <code>if (response.status === 409) { showMessage("A paper with this DOI already exists."); } else if (response.status === 400) { showMessage("Please check the form: " + await response.text()); } else { showMessage("Something went wrong. Please try again."); }</code> gives the USER the exact same actionable clarity http-rest-json\'s concept section argued the API itself should provide — a 409 tells them EXACTLY what to fix (choose a different DOI), while a generic catch-all message would leave them guessing.',
        'This is worth connecting explicitly to REST\'s own design philosophy: an API that carefully distinguishes 400 from 409 from 422 is doing real, valuable design work that a frontend discarding all of it behind one generic error handler completely wastes — the frontend and backend are, in effect, co-designed around the SAME status-code vocabulary, and treating that vocabulary as meaningful on BOTH ends is what actually delivers the end-to-end value of REST\'s carefully-considered status codes all the way to the person using the application, not just to a backend engineer reading server logs.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The dockside signal kiosk: anyone can press a button, but the call still has to be answered honestly, and only registered docks may ring in',
      text: 'At the dock, ordinary visitors — nobody with any crew training, no knowledge of Den Den Mushi protocol at all — can walk up to a SIGNAL KIOSK, press one of a small number of clearly LABELED buttons ("check today\'s wanted list," "submit a new sighting report"), and the kiosk itself handles the actual Den Den Mushi call on their behalf, then displays whatever comes back in plain, readable text (HTML structuring the buttons and display area; JavaScript wiring each button to actually place the call; fetch() being the mechanism that places it). Here is the exact mistake a new kiosk operator makes on their first day: they assume that if the KIOSK successfully PLACES the call and gets ANY answer back at all, the visitor\'s request must have SUCCEEDED — but the ANSWER itself might be an honest "no such wanted pirate on file" or "that sighting report conflicts with one already filed" croak, not a success croak at all; the call went through FINE (the kiosk\'s own machinery worked perfectly), but the ANSWER it received needs to be actually READ and checked before telling the visitor "all done" (fetch() resolving successfully even for an error status — response.ok must be checked explicitly). And the kiosk has one hard, unbendable limit built into it: it is only PERMITTED to place calls to ITS OWN dock\'s registered lines — if someone tried to reconfigure it to ring up a completely different, unrelated island\'s private line without THAT island explicitly granting permission first, the call is refused OUTRIGHT by the network itself, before it even properly connects, regardless of whether the receiving line would have happily answered if only the call had been allowed through at all (CORS: the browser blocking a cross-origin request unless the target server explicitly permits it — a network-level refusal, not a "the other end said no" response). And a well-trained kiosk operator doesn\'t just post one single, vague "something didn\'t work" sign for every possible unsuccessful outcome — a "no such record exists" answer gets its OWN clear sign, a "this conflicts with an existing filing" answer gets a DIFFERENT clear sign, each telling the visitor exactly what happened and, where it matters, exactly what to do about it — wasting none of the careful distinctions the Marines\' own answering protocol was designed to communicate in the first place.',
    },
    sitcom: {
      show: 'Friends',
      title: 'The restaurant\'s tabletop ordering pad: anyone can tap a button, but the reply still has to be read carefully, and only the restaurant\'s own kitchen may be dialed',
      text: 'At Monica\'s restaurant, a customer with zero knowledge of how the kitchen actually operates can sit down at a table, tap one of a small number of clearly LABELED buttons on a tabletop ordering pad ("view today\'s menu," "place an order"), and the pad itself handles the actual communication with the kitchen\'s system on the customer\'s behalf, then displays whatever comes back in plain, readable text on its screen (HTML structuring the buttons and display area; JavaScript wiring each button to actually send the request; fetch() being the mechanism that sends it). Here is the exact mistake a new hostess makes on her first shift training with the system: she assumes that if the PAD successfully SENDS the order and gets ANY reply back at all, the order must have gone through SUCCESSFULLY — but the reply might be an honest "we\'re out of that dish" or "you already have an identical order pending" message, not a confirmation at all; the pad\'s own communication worked perfectly fine, but the REPLY still needs to be actually READ and checked before telling the customer "you\'re all set" (fetch() resolving successfully even for an error status — response.ok must be checked explicitly). And the pad has one hard, unbendable limit built into it: it is only PERMITTED to send orders to ITS OWN restaurant\'s kitchen system — if someone tried to reconfigure it to send requests to a completely different, unrelated restaurant\'s system without THAT restaurant explicitly granting permission first, the request is refused OUTRIGHT by the network itself, before it even properly connects, regardless of whether the other kitchen would have happily answered if only the request had been allowed through at all (CORS: the browser blocking a cross-origin request unless the target server explicitly permits it — a network-level refusal, not "the other kitchen said no"). And a well-designed pad doesn\'t just flash one single, vague "something went wrong" message for every possible unsuccessful outcome — an "out of stock" reply gets its OWN clear message, an "already ordered" reply gets a DIFFERENT clear message, each telling the customer exactly what happened and exactly what to do about it — wasting none of the careful distinctions the kitchen\'s own ticketing system was designed to communicate in the first place.',
    },
    why: 'A labeled kiosk button / tablet button that anyone can press, which handles the actual call/request internally, is HTML+JS wiring an event listener to a fetch() call. The new operator\'s mistake — assuming "an answer came back at all" means success — is fetch() resolving successfully even for a 404/500/409 response, requiring response.ok (or response.status) to be checked explicitly, never assumed. The kiosk\'s/pad\'s hard limit on which lines/kitchens it may contact at all, refused outright by the network before even connecting, is CORS — a browser-enforced restriction, independent of whether the target server would have happily responded. And giving each specific unsuccessful outcome its own clear message, rather than one vague catch-all, is mapping specific status codes (409, 400, 422) to specific, useful user-facing messages — realizing http-rest-json\'s carefully-designed status-code vocabulary all the way through to the person actually using the page.'
  },
  storyAnim: {
    title: 'A labeled button, a call placed, an honest answer that must be read, and a line the kiosk may not dial',
    h: 340,
    props: [
      { id: 'button', emoji: '🔘', label: 'a clearly labeled button anyone can press (HTML + addEventListener)', x: 6, y: 8 },
      { id: 'placecall', emoji: '📞', label: 'the kiosk places the call on the visitor\'s behalf (fetch())', x: 28, y: 8 },
      { id: 'anyanswer', emoji: '📨', label: 'ANY answer comes back -- success OR an honest error croak (fetch() resolves either way)', x: 50, y: 8 },
      { id: 'checked', emoji: '✅', label: 'the answer is actually READ before declaring success (response.ok checked)', x: 74, y: 8 },
      { id: 'blocked', emoji: '🚫', label: 'a call to an UNREGISTERED line is refused outright, before it even connects (CORS)', x: 30, y: 50 },
      { id: 'specificsign', emoji: '📋', label: 'each outcome gets its OWN clear sign, never one vague catch-all (status-specific messages)', x: 62, y: 50 }
    ],
    actors: [
      { id: 'visitor', emoji: '🧍', label: 'visitor', x: 20, y: 78 },
      { id: 'operator', emoji: '🧑‍💼', label: 'kiosk operator', x: 65, y: 78 }
    ],
    steps: [
      { c: 'A visitor with no crew training presses one clearly labeled button.', p: { button: 'lit' }, a: { visitor: [20, 30] } },
      { c: 'The kiosk itself places the actual call on their behalf.', p: { placecall: 'lit' }, a: { operator: [50, 30] } },
      { c: 'SOME answer comes back -- but it might be an honest "no such record" or "conflicts with an existing one" croak, not success.', p: { anyanswer: 'bad' } },
      { c: 'A trained operator reads the actual answer before telling the visitor "all done" -- never assumes an answer at all means success.', p: { checked: 'good' } },
      { c: 'The kiosk is only permitted to call its OWN dock\'s registered lines -- a call to an unregistered one is refused outright by the network.', p: { blocked: 'bad' } },
      { c: 'Each specific unsuccessful outcome gets its own clear sign -- never one vague "something didn\'t work" for everything.', p: { specificsign: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'From HTML/CSS/JS basics to fetch(), the resolves-on-error gotcha, CORS, and status-specific messages',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'HTML/CSS/JS',
        nodes: [
          { id: 'dom', text: 'HTML -> the DOM tree;\nCSS styles it' },
          { id: 'jsbasics', text: 'const/let, arrow functions,\nquerySelector + addEventListener' }
        ]
      },
      {
        label: 'Async & fetch',
        nodes: [
          { id: 'asyncawait', text: 'Promises + async/await:\nnon-blocking, single-threaded' },
          { id: 'fetchcall', text: 'fetch(url, options):\nGET/POST with a JSON body' }
        ]
      },
      {
        label: 'The gotcha',
        nodes: [
          { id: 'resolveserror', text: 'fetch() resolves even for\n404/500 -- it does not throw' },
          { id: 'checkok', text: 'response.ok / response.status\nmust be checked explicitly' }
        ]
      },
      {
        label: 'CORS & precise messages',
        nodes: [
          { id: 'cors', text: 'CORS: the browser blocks a\ncross-origin request unless permitted' },
          { id: 'statusmessages', text: 'map 409/400/422 to specific,\nuseful user-facing messages' }
        ]
      }
    ],
    steps: [
      { active: ['dom'], note: 'HTML elements become a tree of DOM objects the browser builds and JavaScript can query and modify; CSS styles those elements.' },
      { active: ['jsbasics'], note: 'const/let for variables, arrow functions for behavior, querySelector to find an element, addEventListener to react to a click or submit.' },
      { active: ['asyncawait'], note: 'JavaScript is single-threaded with an event loop -- async/await lets code read sequentially while a network request happens without blocking other events.' },
      { active: ['fetchcall'], note: 'fetch(url, options) makes the actual HTTP request -- a JSON body and Content-Type header for POST, exactly matching the Spring Boot API\'s expectations.' },
      { active: ['resolveserror'], note: 'fetch()\'s Promise resolves successfully for EVERY response the server sends, including 404 and 500 -- it only rejects for a genuine network-level failure.' },
      { active: ['checkok'], note: 'response.ok (true for 200-299) or response.status must be checked explicitly -- treating "no exception thrown" as "success" is silently wrong.' },
      { active: ['cors'], note: 'A browser blocks a cross-origin fetch() unless the server\'s response carries an Access-Control-Allow-Origin header explicitly permitting the calling origin.' },
      { active: ['statusmessages'], note: 'Checking specific status codes (409, 400, 422) and showing distinct messages realizes the API\'s carefully-designed status-code vocabulary all the way to the user.' }
    ]
  },
  tech: [
    {
      q: 'Explain precisely why code that only wraps a fetch() call in try/catch, with no check on response.ok or response.status, can silently treat a 404 Not Found response as if it were successful data.',
      a: 'fetch()\'s returned Promise RESOLVES (does not reject, does not throw) for any response the server actually sends back, regardless of its HTTP status code — a 404, a 500, and a 200 are all, from fetch()\'s own perspective, equally "successful" outcomes of the NETWORK OPERATION itself (a response was received), which is a fundamentally different thing from the underlying OPERATION the request represented having succeeded. try/catch around a fetch() call only catches the Promise REJECTING, which happens exclusively for genuine network-level failures (DNS resolution failure, connection refused, a CORS block) — none of which occur for a normal 404 response, since the server DID respond, correctly, with a real, well-formed answer; it just happens to be an answer saying "no such resource exists." Code written as `try { const response = await fetch(url); const data = await response.json(); useData(data); } catch (e) { showError(); }` will, for a 404 response, execute the try block\'s ENTIRE body with no exception at all — response.json() will successfully parse WHATEVER JSON body the 404 response happens to carry (often an error-message object, NOT the shape useData() expects), and useData() will be called with that mismatched, error-shaped data, either crashing unpredictably deeper in useData()\'s own logic or, worse, silently misinterpreting error information as if it were legitimate success data — with the catch block never running at all, since nothing here ever rejected the Promise. The fix requires an EXPLICIT check, inside the try block, immediately after fetch() resolves: `if (!response.ok) { /* handle this specific error status here, separately from the catch block */ }` before ever treating the response as successful data.'
    },
    {
      q: 'A frontend served from http://localhost:3000 calls fetch("http://localhost:8080/papers") against a Spring Boot backend with no CORS configuration at all. Trace precisely what happens, including whether the Spring Boot application\'s own PaperController code ever executes.',
      a: 'This depends on exactly WHICH kind of request is being made, and it\'s worth being precise about a real subtlety: for a "simple" GET request with no custom headers, the browser typically DOES send the actual request to the server, and PaperController\'s getAll() method DOES execute normally, producing a completely valid response — the CORS check happens on the RESPONSE side: the browser examines whether the response carries an Access-Control-Allow-Origin header naming (or wildcarding) http://localhost:3000, and since no CORS configuration exists at all on the Spring Boot side, that header is absent — the browser then REFUSES to hand the (perfectly valid, already-computed) response back to the calling JavaScript code at all, and the fetch() call\'s Promise REJECTS (unlike a 404/500, which resolve) with a generic, unhelpful error, typically logged in the browser console as something like "blocked by CORS policy," with NO useful status code exposed to the calling code\'s own error-handling logic. For a "non-simple" request (a POST with a Content-Type: application/json header, exactly matching this lesson\'s own POST examples, or any request using PUT/DELETE/PATCH), the browser instead sends an OPTIONS "preflight" request FIRST, asking the server\'s permission BEFORE sending the real request at all — if the server\'s OPTIONS response doesn\'t grant permission (again, because no CORS configuration exists), the browser never even sends the actual POST request, meaning PaperController\'s create() method NEVER EXECUTES AT ALL for this case, unlike the simple-GET case above where the controller genuinely did run, its result simply discarded by the browser afterward. Either way, the end result the calling JavaScript observes is the same (a rejected Promise, a confusing console error, no usable response) — but whether the server-side controller code actually ran and did real work (and, for a POST creating a resource, whether a resource was actually created despite the browser discarding the response) differs meaningfully between the two cases, worth understanding precisely rather than assuming CORS uniformly prevents the server from ever being contacted at all.'
    },
    {
      q: 'A team\'s frontend shows the exact same generic "Something went wrong" message for a 400 Bad Request, a 409 Conflict, and a 500 Internal Server Error, all handled by one catch-all `else { showGenericError(); }` branch after checking `if (response.ok)`. Explain precisely what value this design discards, tracing back to http-rest-json\'s status-code design work.',
      a: 'http-rest-json spent real, deliberate effort establishing that 400, 409, and 500 mean fundamentally DIFFERENT things, specifically so a CLIENT receiving each one can respond appropriately rather than treating all failures identically: 400 means the request itself was malformed (a blank title, say) — the USER can fix this immediately by correcting the specific field that failed; 409 means the request conflicts with existing data (a duplicate DOI) — the user needs DIFFERENT, specific guidance (choose a different DOI, or recognize the paper may already exist); 500 means something broke on the SERVER\'s end, entirely outside anything the user did wrong or can fix by changing their input — retrying LATER might help, but there\'s nothing about THIS SPECIFIC request the user should change. A single generic "Something went wrong" message discards ALL of this carefully-designed distinction, presenting the user with the SAME unhelpful, non-actionable message regardless of which of these three genuinely different situations actually occurred — a user seeing this message for a 400 (a simple, fixable typo in their own form) has no way to know that\'s what happened, versus seeing it for a 409 (they need to pick a different DOI) or a 500 (nothing they can personally do, try again later) — three situations requiring three different USER ACTIONS, collapsed into one message that guides none of them correctly. The concrete fix is precisely this lesson\'s "map specific status codes to specific, useful user-facing messages" pattern — checking response.status (or a structured error body the backend returns) and branching to a message SPECIFIC to each meaningfully different case, restoring, on the browser side, the exact precision the backend\'s @ControllerAdvice was deliberately designed to communicate in the first place.'
    },
    {
      q: 'Explain why `async function loadPapers() { const response = await fetch("/papers"); ... }` does not block the browser from responding to a user clicking an unrelated button elsewhere on the page while the fetch() request is in flight, contrasting this with what a blocking network call would do in a traditional single-threaded context.',
      a: 'JavaScript in a browser runs on a SINGLE thread, driven by an EVENT LOOP — but `await` does NOT block that single thread the way a genuinely synchronous, blocking network call would in many other single-threaded contexts. When execution reaches `await fetch("/papers")`, the async function\'s OWN execution PAUSES at that exact point — but control returns immediately to the browser\'s event loop, which remains completely free to process OTHER pending work: rendering updates, other event listeners (a click on a completely different button), timers, anything else queued — none of it is blocked by the in-flight network request at all. The actual network I/O itself happens entirely outside the JavaScript thread (handled by the browser\'s own underlying networking machinery, analogous in spirit to how executors-futures\' CompletableFuture.supplyAsync offloads work to a separate thread pool rather than blocking the calling thread) — when the response eventually arrives, the event loop schedules the PAUSED async function to RESUME exactly where it left off, with the awaited Promise\'s resolved value now available. This is precisely why `await` can read almost exactly like ordinary sequential Java code (one line after another, in order) while still being fundamentally NON-BLOCKING at the level that actually matters for a responsive page — if a genuinely blocking (synchronous) network call were used instead (a legacy pattern, largely avoided in modern code specifically for this reason), the ENTIRE single-threaded page — every button, every animation, every other event handler — would freeze completely until that one network call finished, since JavaScript has no separate "background thread" the way executors-futures\' thread pool provides in Java; the event loop, combined with fetch()\'s Promise-based, non-blocking design, is JavaScript\'s own answer to keeping a single thread responsive during I/O, achieving a similar practical GOAL to Java\'s thread pools through a genuinely different underlying MECHANISM.'
    }
  ],
  code: {
    title: 'A minimal LogPose paper-submission page: fetch(), response.ok checked explicitly, and status-specific messages',
    intro: 'A self-contained HTML page listing papers (GET /papers) and submitting a new one (POST /papers) against PaperController — every fetch() call explicitly checks response.ok before treating the result as success, and branches on response.status for 409/400 specifically.',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LogPose — Papers</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 2rem auto; }
    .error { color: #b00020; }
    .success { color: #0a7c2f; }
    li { margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <h1>Papers</h1>
  <ul id="paper-list"></ul>

  <h2>Submit a new paper</h2>
  <form id="paper-form">
    <input name="title" placeholder="Title" required>
    <input name="doi" placeholder="DOI" required>
    <input name="authorId" placeholder="Author ID" type="number" required>
    <button type="submit">Submit</button>
  </form>
  <p id="message"></p>

  <script>
    const paperList = document.querySelector("#paper-list");
    const messageEl = document.querySelector("#message");

    async function loadPapers() {
      const response = await fetch("/papers");
      if (!response.ok) {
        messageEl.textContent = "Could not load papers.";
        messageEl.className = "error";
        return;
      }
      const papers = await response.json();
      paperList.innerHTML = "";
      for (const paper of papers) {
        const li = document.createElement("li");
        li.textContent = \`\${paper.title} (DOI: \${paper.doi})\`;
        paperList.appendChild(li);
      }
    }

    async function submitPaper(title, doi, authorId) {
      const response = await fetch("/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, doi, authorId })
      });

      // fetch() resolves here regardless of status -- 201, 400, and 409 all reach this line
      if (response.ok) {
        messageEl.textContent = "Paper submitted successfully.";
        messageEl.className = "success";
        await loadPapers();
        return;
      }

      // status-specific messages -- realizing spring-boot-rest-api's status-code design on the client
      if (response.status === 409) {
        messageEl.textContent = "A paper with this DOI already exists.";
      } else if (response.status === 400) {
        messageEl.textContent = "Please check the form: all fields are required.";
      } else {
        messageEl.textContent = "Something went wrong. Please try again.";
      }
      messageEl.className = "error";
    }

    document.querySelector("#paper-form").addEventListener("submit", async (event) => {
      event.preventDefault();   // stop the browser's default full-page-reload form submission
      const formData = new FormData(event.target);
      await submitPaper(
        formData.get("title"),
        formData.get("doi"),
        Number(formData.get("authorId"))
      );
    });

    loadPapers();   // load the initial list when the page opens
  </script>
</body>
</html>`,
    notes: [
      'loadPapers() and submitPaper() BOTH check response.ok explicitly before treating the response as successful data -- neither relies on fetch() throwing for an unsuccessful status, since it never does.',
      'submitPaper()\'s if/else if/else chain on response.status realizes 409 and 400 as DISTINCT, specific messages -- exactly the "don\'t discard the backend\'s carefully-designed status-code vocabulary" argument from this lesson\'s final concept section.',
      'event.preventDefault() stops the form\'s default full-page-reload submission -- without it, the browser would attempt its own, non-JSON form submission BEFORE (or instead of) this script\'s fetch()-based one ever running.',
      'This page assumes it is served from the SAME origin as the Spring Boot API (e.g. Spring Boot serving this HTML directly) -- calling a DIFFERENT-origin API from here would require the backend\'s CORS configuration this lesson\'s concept section covers.'
    ]
  },
  lab: {
    title: 'Write a deleteReview function with response.ok and status-specific handling',
    prompt: 'Given a REST endpoint <code>DELETE /papers/{paperId}/reviews/{reviewId}</code> (returning <code>204</code> on success, <code>404</code> if the review doesn\'t exist, and <code>403</code> if the caller isn\'t authorized), write an async JavaScript function <code>deleteReview(paperId, reviewId)</code> that: (1) calls <code>fetch</code> with <code>method: "DELETE"</code> against the correct URL (using a template literal); (2) checks <code>response.ok</code> and, on success, sets <code>messageEl.textContent</code> to <code>"Review deleted."</code> with <code>messageEl.className = "success"</code>; (3) on failure, branches on <code>response.status</code> — for <code>404</code> set the message to <code>"That review no longer exists."</code>, for <code>403</code> set it to <code>"You are not authorized to delete this review."</code>, otherwise <code>"Something went wrong. Please try again."</code> — with <code>messageEl.className = "error"</code> in every failure case.',
    starter: `const messageEl = document.querySelector("#message");

async function deleteReview(paperId, reviewId) {
    // TODO: fetch(\`/papers/\${paperId}/reviews/\${reviewId}\`, { method: "DELETE" })
    // TODO: if (response.ok) { success message }
    // TODO: else branch on response.status: 404, 403, otherwise -- set messageEl.className = "error" in all failure cases
}`,
    checks: [
      { re: 'await\\s+fetch\\(\\s*`/papers/\\$\\{paperId\\}/reviews/\\$\\{reviewId\\}`', must: true, hint: 'Use fetch(`/papers/${paperId}/reviews/${reviewId}`, ...) with the correct template literal URL.', pass: 'correct fetch URL template literal ✓' },
      { re: 'method\\s*:\\s*"DELETE"', must: true, hint: 'The fetch options must include method: "DELETE".', pass: 'method: "DELETE" used ✓' },
      { re: 'if\\s*\\(\\s*response\\.ok\\s*\\)', must: true, hint: 'Check if (response.ok) explicitly.', pass: 'response.ok checked ✓' },
      { re: 'messageEl\\.textContent\\s*=\\s*"Review deleted\\."', must: true, hint: 'Set messageEl.textContent to "Review deleted." on success.', pass: 'success message set ✓' },
      { re: 'response\\.status\\s*===\\s*404', must: true, hint: 'Branch on response.status === 404.', pass: '404 branch present ✓' },
      { re: 'response\\.status\\s*===\\s*403', must: true, hint: 'Branch on response.status === 403.', pass: '403 branch present ✓' },
      { re: 'messageEl\\.className\\s*=\\s*"error"', must: true, hint: 'Set messageEl.className = "error" in the failure branches.', pass: 'error className set ✓' }
    ],
    run: 'Open the page in a browser with the dev tools console visible — calling deleteReview correctly reports "Review deleted." for a 204, a specific message for 404/403, and a generic fallback for anything else, without ever assuming success just because fetch() didn\'t throw.',
    solution: `const messageEl = document.querySelector("#message");

async function deleteReview(paperId, reviewId) {
    const response = await fetch(\`/papers/\${paperId}/reviews/\${reviewId}\`, {
        method: "DELETE"
    });

    if (response.ok) {
        messageEl.textContent = "Review deleted.";
        messageEl.className = "success";
        return;
    }

    if (response.status === 404) {
        messageEl.textContent = "That review no longer exists.";
    } else if (response.status === 403) {
        messageEl.textContent = "You are not authorized to delete this review.";
    } else {
        messageEl.textContent = "Something went wrong. Please try again.";
    }
    messageEl.className = "error";
}`,
    notes: [
      'A 204 No Content response has response.ok === true (204 is in the 200-299 range) -- this function correctly treats it as success without attempting to parse a JSON body, since a 204 response has none.',
      'The 403 case here directly connects to spring-data-security\'s @PreAuthorize material -- an authenticated-but-unauthorized caller gets exactly this status, distinct from a 401 (not authenticated at all).',
      'Without the explicit response.ok / response.status checks, a 404 or 403 response would flow through as if the delete had succeeded, since fetch() never throws for either status.'
    ]
  },
  quiz: [
    {
      q: 'Does fetch("/papers") reject (throw an exception when awaited) if the server responds with 404 Not Found?',
      options: ['No -- fetch() resolves successfully for any response the server sends, including 404 and 500; it only rejects for a genuine network-level failure', 'Yes -- fetch() always rejects for any status code outside the 200-299 range', 'Yes, but only for 500-level server errors, not 400-level client errors', 'This depends on which browser is being used'],
      correct: 0,
      explain: 'fetch()\'s Promise resolves for every actual HTTP response, regardless of status code. It rejects only for network-level failures (no connection, DNS failure, a CORS block) -- response.ok or response.status must be checked explicitly to detect an unsuccessful HTTP status.'
    },
    {
      q: 'A frontend on http://localhost:3000 makes a fetch() call to http://localhost:8080/papers, and the Spring Boot backend has no CORS configuration. What happens?',
      options: ['The browser blocks the response from reaching the calling JavaScript code (the fetch() Promise rejects), since the response lacks the required Access-Control-Allow-Origin header permitting this origin', 'The request works normally, since CORS only applies to requests made from a different physical machine, not a different port on the same machine', 'The Spring Boot server itself detects the mismatched origin and refuses to accept the connection at the network level', 'CORS only applies to POST requests, so this GET request succeeds without any special configuration'],
      correct: 0,
      explain: 'Different ports count as different origins for CORS purposes. Without explicit CORS configuration on the backend, the browser blocks the cross-origin response from reaching the calling code, causing the fetch() Promise to reject.'
    },
    {
      q: 'Why does mapping response.status === 409 and response.status === 400 to distinct, specific error messages matter, rather than showing one generic "Something went wrong" message for both?',
      options: ['409 and 400 mean genuinely different things (a conflict with existing data vs. a malformed request) requiring different user actions -- collapsing them into one generic message discards the precise, actionable distinction the backend\'s status codes were specifically designed to communicate', '409 and 400 are functionally identical status codes with no meaningful difference', 'Browsers automatically display different built-in messages for 409 versus 400, making custom handling unnecessary', 'This distinction only matters for POST requests, never for GET requests'],
      correct: 0,
      explain: '400 means the request itself needs fixing; 409 means it conflicts with existing data -- two different situations calling for two different user actions. A generic message discards this useful, deliberately-designed distinction.'
    },
    {
      q: 'Why does `await fetch(url)` inside an async function NOT freeze the entire page while the network request is in flight?',
      options: ['await pauses only the current async function\'s own execution, returning control to the browser\'s event loop, which remains free to handle other events (clicks, timers) while the network request happens outside the JavaScript thread', 'JavaScript automatically creates a new background thread for every fetch() call, similar to Java\'s ExecutorService', 'fetch() calls are always instantaneous in modern browsers, so there is no actual waiting period to block anything', 'The page does freeze completely during any fetch() call, and this is an unavoidable limitation of JavaScript'],
      correct: 0,
      explain: 'JavaScript is single-threaded, but await does not block that thread -- it pauses just the current async function, letting the event loop continue processing other work while the actual network I/O happens outside the JavaScript thread entirely.'
    },
    {
      q: 'What does event.preventDefault() do inside a form\'s submit event handler, and why is it used in this lesson\'s code demo?',
      options: ['It stops the browser\'s default full-page-reload form submission behavior, allowing the handler\'s own fetch()-based JSON submission to run instead', 'It cancels the entire JavaScript event system for the rest of the page', 'It prevents the form\'s input fields from being read by JavaScript', 'It has no effect on forms and is only relevant for click events on buttons'],
      correct: 0,
      explain: 'A form\'s default behavior is a full-page navigation submitting data in a browser-generated format, not JSON, to whatever URL the form\'s action attribute specifies. preventDefault() stops that default behavior so the handler can construct and send its own fetch()-based JSON request instead.'
    }
  ],
  testFlow: {
    title: 'Test yourself: fetch() error handling, CORS, and status-code precision',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'Code calls `const response = await fetch("/papers/999");` inside a try block, with no check on response.ok, and paper 999 doesn\'t exist (a 404). Does the catch block run?',
        choices: [
          { text: 'No -- fetch() resolves successfully for a 404 response; the catch block only runs for a genuine network-level failure, which did not occur here', to: 'q1_right' },
          { text: 'Yes -- any non-200 status code causes fetch() to throw, triggering the catch block', to: 'q1_wrong_throws' },
          { text: 'This cannot be determined without knowing which browser is being used', to: 'q1_wrong_browser' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- fetch() only rejects for network-level failures. A 404 is a completely normal, successfully-received HTTP response as far as fetch() itself is concerned, so the Promise resolves and the catch block never runs.', next: 'q2' },
      q1_wrong_throws: { end: true, correct: false, text: 'This is exactly the misconception this lesson corrects -- fetch() does NOT throw for any HTTP status code, including 404 or 500. Only a genuine network-level failure (no connection, DNS failure, CORS block) causes it to reject.', retry: 'q1' },
      q1_wrong_browser: { end: true, correct: false, text: 'fetch()\'s behavior here is part of the standard Fetch API specification, consistent across modern browsers -- this is not browser-dependent behavior.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A frontend served from https://logpose.app makes a fetch() POST request to https://api.logpose.app/papers (a different subdomain, and therefore a different origin). What must the backend do for this request to succeed?',
        choices: [
          { text: 'The backend must explicitly configure CORS to permit https://logpose.app as an allowed origin -- without it, the browser blocks the response from reaching the calling JavaScript', to: 'q2_right' },
          { text: 'Nothing special is required, since both are technically part of the same "logpose.app" domain family', to: 'q2_wrong_samefamily' },
          { text: 'The frontend\'s JavaScript code must be rewritten to avoid using fetch() entirely, since fetch() cannot make cross-subdomain requests under any configuration', to: 'q2_wrong_avoid' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- different subdomains count as different origins for CORS purposes (scheme + host + port must all match exactly). The backend must explicitly permit this specific origin, or the browser will block the response.', next: 'q3' },
      q2_wrong_samefamily: { end: true, correct: false, text: 'CORS uses an exact match on scheme + host + port -- "logpose.app" and "api.logpose.app" are different HOSTS entirely, regardless of sharing a parent domain, and are treated as fully different origins.', retry: 'q2' },
      q2_wrong_avoid: { end: true, correct: false, text: 'fetch() can absolutely make cross-origin requests -- CORS is a browser-enforced permission system, not a hard technical limitation of fetch() itself. The correct fix is server-side CORS configuration, not avoiding fetch().', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A team\'s error handling shows the SAME "Something went wrong" message for a 400 (malformed request) and a 409 (duplicate DOI conflict). What specific value does this design lose?',
        choices: [
          { text: 'The user can no longer tell whether they need to fix a specific field in their own form (400) or choose a different DOI because one already exists (409) -- two genuinely different, actionable pieces of guidance collapsed into one unhelpful message', to: 'q3_right' },
          { text: 'No value is lost -- 400 and 409 are essentially interchangeable status codes representing the same underlying problem', to: 'q3_wrong_interchangeable' },
          { text: 'This only matters for developers debugging the API, never for actual end users of the application', to: 'q3_wrong_devsonly' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- 400 and 409 call for genuinely different user actions (fix the form vs. choose a different DOI). Collapsing both into one generic message discards exactly the actionable precision http-rest-json\'s status-code design was meant to provide.', next: null },
      q3_wrong_interchangeable: { end: true, correct: false, text: '400 and 409 mean fundamentally different things -- a malformed request versus a conflict with existing data -- and http-rest-json spent real effort establishing why that distinction matters, precisely so clients could act on it differently.', retry: 'q3' },
      q3_wrong_devsonly: { end: true, correct: false, text: 'This distinction matters directly to the END USER, not just developers -- a user seeing a specific, actionable message ("choose a different DOI") can resolve the problem themselves, while a generic message leaves them stuck with no idea what to try next.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Wrapping a fetch() call in try/catch and assuming "no exception thrown" means the request succeeded -- fetch() resolves for every HTTP response, including 404 and 500; response.ok or response.status must be checked explicitly.',
    'Forgetting event.preventDefault() in a form\'s submit handler -- the browser\'s default full-page-reload submission runs (or interferes) alongside the intended fetch()-based JSON submission.',
    'Assuming a CORS failure produces a usable HTTP status code your error-handling code can inspect -- it instead causes the fetch() Promise itself to reject with a vague network-error-style failure, with no status code available at all.',
    'Assuming two different ports on localhost, or two different subdomains of the same parent domain, count as the "same origin" for CORS purposes -- CORS requires an exact match on scheme, host, AND port.',
    'Showing one generic error message for every non-2xx response instead of branching on response.status -- discards the specific, actionable distinctions (400 vs. 409 vs. 500) the backend\'s status codes were deliberately designed to communicate.',
    'Using a genuinely blocking, synchronous network call pattern instead of fetch()\'s Promise-based, non-blocking design -- would freeze the entire single-threaded page for the duration of every request, unlike await, which pauses only the current async function.'
  ],
  interview: [
    {
      q: 'A junior developer says "fetch() and Java\'s HttpClient behave the same way — both throw an exception for a 404 response, since that\'s standard HTTP client behavior." Evaluate this claim.',
      a: 'This claim is specifically WRONG about fetch(), and evaluating it precisely requires distinguishing what "standard" actually means here — there is no universal rule that HTTP clients must throw for non-2xx responses; it is a design CHOICE each library makes independently, and different libraries genuinely choose differently. fetch(), by the Fetch API\'s own specification, deliberately treats "a response was received" and "the operation succeeded" as two SEPARATE questions — a 404 is a completely normal, successfully-received HTTP response from fetch()\'s perspective, and the Promise resolves; only a genuine network-level failure (no connection, DNS failure, a CORS block) causes rejection. Some Java HTTP client libraries (and some configurations of others) DO throw an exception for a non-2xx status by default — this is a real, common pattern in the Java ecosystem, and a developer\'s prior experience with such a library could easily create exactly this false expectation when moving to fetch() for the first time. The precise, correct statement: whether a non-2xx response throws/rejects or must be checked explicitly is LIBRARY-SPECIFIC behavior, not a universal HTTP-client standard, and a developer moving between ecosystems (or even between different libraries within the same ecosystem) must verify this specific behavior for whatever library they\'re actually using rather than assuming it carries over from one to another — fetch() specifically requires an explicit response.ok check, and assuming otherwise (based on experience with a DIFFERENT library that behaves differently) is exactly the mistake this lesson\'s concept section and lab both build around.'
    },
    {
      q: 'Design (in words) how you would test the deleteReview function from this lesson\'s lab without making real network requests against a real running Spring Boot server, connecting this to the test pyramid material from integration-testing.',
      a: 'Making a real network request against a real running server for every test run of deleteReview() would be slow, require real server infrastructure to be running, and risks exactly the kind of environment-dependent flakiness this course has warned about throughout (a server not yet started, a port conflict, a real database in an unexpected state) — precisely the shape of problem test doubles (mockito-test-doubles) and the test pyramid (integration-testing) exist to address, now applied to FRONTEND testing specifically. The standard approach: MOCK the global fetch function itself for a unit test of deleteReview()\'s own logic — most JavaScript testing frameworks provide a way to replace window.fetch with a test double that returns a CONTROLLED, fake Response object without making any real network call at all, exactly analogous to mockito-test-doubles\' @Mock ReviewerNotifier standing in for a real collaborator. A test verifying the 404 branch would mock fetch to return a fake Response with status 404 and ok: false, then call deleteReview(paperId, reviewId) and assert that messageEl.textContent was correctly set to "That review no longer exists." and messageEl.className to "error" — this is a genuine STUB (mockito-test-doubles\' terminology, applied here to a JavaScript mock rather than a Mockito one): fetch\'s return value is entirely controlled by the test, with zero real server involved, letting the test run in milliseconds and deterministically, regardless of whether any real backend exists at all. A SEPARATE, smaller number of true END-TO-END tests (using a real browser automation tool driving the actual page against an actual running Spring Boot instance, closer to integration-testing\'s Testcontainers-backed approach but for the whole stack) would sit at the pyramid\'s tip specifically to verify the REAL frontend and REAL backend are correctly wired together — exactly mirroring the pyramid shape this course has applied consistently: many fast, mocked unit tests of individual functions like deleteReview(), few genuinely slow, fully-real end-to-end tests confirming the whole system actually works together.'
    },
    {
      q: 'A production incident: users report that submitting a paper with a duplicate DOI shows "Paper submitted successfully" even though the backend correctly returned 409 Conflict and did NOT create a duplicate paper. Diagnose the likely bug in the frontend code, using this lesson\'s material precisely.',
      a: 'This is almost certainly the exact response.ok-not-checked bug this lesson\'s concept section and code demo build around, manifesting concretely: the frontend code likely has a structure like `const response = await fetch("/papers", {...}); const created = await response.json(); showSuccessMessage();` — calling response.json() and then UNCONDITIONALLY showing a success message, with NO if (response.ok) check anywhere in between. Precisely tracing through what happens for a 409 response: fetch()\'s Promise resolves normally (409 is a completely valid HTTP response, not a network failure — exactly this lesson\'s central gotcha), response.json() successfully parses WHATEVER JSON body the 409 response carries (likely spring-boot-rest-api\'s ApiExceptionHandler\'s error message string, or a similarly-shaped error object — NOT a created Paper object, but the code doesn\'t check this at all), and the unconditional showSuccessMessage() call then runs regardless, displaying "Paper submitted successfully" — completely incorrectly, since the actual HTTP status (409) and the actual server-side outcome (no paper created, DuplicateDoiException thrown and handled) were never consulted by this code at all. The fix is exactly this lesson\'s pattern: insert an explicit `if (!response.ok) { /* handle 409 specifically, per the status-specific-messages section */ return; }` check IMMEDIATELY after the fetch() call resolves, BEFORE ever calling response.json() and BEFORE ever showing any success indication — this both prevents the false "success" message AND, ideally, shows the user the ACTUAL, specific 409 message ("A paper with this DOI already exists") their real situation calls for. This incident is a strong, concrete illustration of exactly why this lesson treats the fetch()-resolves-on-error gotcha as genuinely load-bearing rather than a minor technicality — it is precisely the kind of bug that\'s invisible in casual manual testing (a developer testing the HAPPY path, submitting a genuinely new, non-duplicate paper, would never trigger this code path at all) and only surfaces in production when a real user hits the exact edge case (an actual duplicate) the missing check was supposed to handle.'
    },
    {
      q: 'A team debates whether CORS should be configured to allow ALL origins (`Access-Control-Allow-Origin: *`) for simplicity, versus explicitly listing only the specific, known frontend origins that legitimately need access. Evaluate this tradeoff.',
      a: 'Allowing all origins is genuinely simpler to configure and eliminates an entire category of "why isn\'t my frontend able to call the API" debugging sessions during development — a real, understandable appeal, especially for a small team moving fast. But it discards a genuine security boundary CORS exists to provide, and the risk is concrete, not merely theoretical: with a wildcard origin, ANY website on the internet — including one specifically designed to be malicious — can have its own JavaScript make requests to this API from a victim\'s browser, and (for requests that don\'t require special authentication headers a malicious site couldn\'t forge, or in combination with other vulnerabilities) potentially read back responses that were never intended to be accessible from an arbitrary, unrelated site. This risk is meaningfully HIGHER for any endpoint that relies on browser-managed credentials (cookies) being sent automatically with a request — a wildcard origin combined with credentialed requests is specifically disallowed by the CORS specification itself for exactly this reason (browsers refuse to combine Access-Control-Allow-Origin: * with credentialed requests), though this course\'s JWT-based approach (spring-data-security) sidesteps that specific combination since a JWT is sent as an explicit Authorization header the calling JavaScript controls directly, rather than an automatically-attached cookie — a real, meaningful difference in exposure, but not a reason to abandon origin-restriction discipline entirely. The precise, correct middle ground most real teams land on: explicitly list the SPECIFIC, KNOWN origins that legitimately need access (the production frontend\'s actual domain, a local development server\'s specific port during development, configured differently per environment) rather than either extreme — this requires slightly more configuration than a single wildcard, but preserves CORS\'s actual security value, restricting API access to genuinely intended callers rather than any arbitrary site on the internet, while still being straightforward to maintain for the realistically small, stable set of origins a typical application actually needs to support.'
    }
  ]
};
