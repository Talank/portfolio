window.LESSONS = window.LESSONS || {};
window.LESSONS['backend-api-design'] = {
  id: 'backend-api-design',
  title: 'The Backend: Uploads, Long-Running Jobs & Live Progress',
  category: 'Part 6 — Shipping It',
  timeMin: 40,
  summary: 'Every mechanism from Parts 1-5 has been living inside one process. This lesson draws the line between "creator\'s browser" and "the machine doing the work," and designs the four contracts that line depends on: how a large upload arrives safely, how a request for a two-minute render returns in milliseconds anyway, how progress reaches the browser without the browser having to ask every second, and how a client that retried after a timeout does not accidentally pay for the same render twice. None of it is new theory — it is REST\'s oldest patterns (202 Accepted, idempotency keys, server-sent events) applied to the specific shape of a media pipeline: long jobs, big files, and a creator who wants to watch it happen.',
  goals: [
    'Design the upload contract: content-hashed, type-verified, and resumable so a dropped connection does not mean starting a 400MB upload over',
    'Explain the 202-Accepted pattern for job creation: why the API returns instantly with a job id instead of blocking until the render finishes',
    'Compare polling, WebSockets, and Server-Sent Events for progress delivery, and justify SSE as the fit for this one-directional stream',
    'Design an idempotency-key contract that makes retried submissions safe — a network timeout never produces a duplicate render or double the GPU bill',
    'Write a consistent error envelope that tells a client whether a failure is retryable, and use Last-Event-ID to resume a progress stream without gaps or repeats'
  ],
  concept: [
    {
      h: 'The upload contract: verify what arrives, not what the filename claims',
      p: [
        'A creator drags in <code>vacation_photo.jpg</code>; the backend must not trust the extension, the declared content-type header, or even the file size the browser reports before treating it as safe input to a vision model. The contract: read the first bytes and check the actual magic number against an allowlist (JPEG/PNG/WAV/MP3, matching the multimodal and TTS lessons\' supported formats — never "whatever ffmpeg happens to parse," which is an attack surface, not a feature); stream the upload to disk while computing its content hash incrementally (the SAME hash the caching lesson keys stages on — computing it once, at the door, means every downstream stage inherits a verified key for free); reject anything past a size ceiling before the bytes finish arriving, not after.',
        'Large uploads (a two-minute reference video for voice cloning is easily hundreds of megabytes) need one more property: resumability. A flat <code>POST</code> that dies at 90% forces a full restart on flaky connections. The fix is the same idea as the pipeline\'s content-addressed caching, one layer up: the client uploads in fixed-size chunks, each tagged with an offset; the server acks each chunk by offset; on reconnect the client asks "what do you have?" and resumes from the acked offset instead of byte zero. This is the same shape as the tus protocol and S3 multipart upload — nothing bespoke, just the resumable-transfer pattern applied to creator media instead of generic files.'
      ]
    },
    {
      h: '202 Accepted: the response returns before the work does',
      p: [
        'A render can take from seconds (full cache hit) to minutes (cold everything). A synchronous <code>POST /jobs</code> that blocks until completion either times out the HTTP connection on slow renders or wastes a held-open socket on fast ones — and it gives the browser nothing to show while it waits. The fix is the oldest async-API pattern there is: <code>POST /jobs</code> validates the plan (last lesson\'s unified validator), enqueues it, and returns <b>202 Accepted</b> with a <code>job_id</code> and a <code>status_url</code> — typically in under 50ms, regardless of how long the render will take. The actual work happens on the queue this course already built (media-pipeline-orchestration\'s workers); the API layer\'s only job at this point is bookkeeping: a row exists, its state is <code>queued</code>, and the creator has something to hold onto.',
        'This turns every long operation into the same shape: create (202 + id) → poll or subscribe (next section) → fetch result when done. It is why the director\'s preview-then-approve flow and the executor\'s job queue compose so cleanly with HTTP — approval calls <code>POST /jobs</code> once, and everything after that is status, not a held connection. The corollary: a <code>GET /jobs/{id}</code> must ALWAYS answer instantly regardless of job state, because it is reading a row, never touching the render itself — the one architectural rule that keeps the API responsive under load no matter how backed up the GPU queue gets.'
      ]
    },
    {
      h: 'Delivering progress: pick the transport that matches the traffic shape',
      p: [
        'Three ways a browser learns a job moved from 40% to 65%. <b>Polling</b> (<code>GET /jobs/{id}</code> every N seconds) is the simplest and needs no special infrastructure, but every poll is a full request/response round trip, progress is only ever as fresh as the interval, and N has no good value — too short wastes requests on jobs sitting in queue, too long makes a fast render feel laggy. <b>WebSockets</b> give a true bidirectional channel, but a media pipeline\'s progress stream is not bidirectional — the client never needs to send anything after subscribing — so a WebSocket buys duplex capability the app pays connection-management complexity for and never uses (reconnect logic, ping/pong keepalives, a stateful server-side registry of open sockets) and never spends.',
        '<b>Server-Sent Events</b> fit the actual traffic: one-directional, server-to-client, over plain HTTP. The browser\'s built-in <code>EventSource</code> handles reconnection automatically, the server just writes <code>data: {...}\\n\\n</code> lines onto a kept-open response, and it degrades gracefully through the exact same infrastructure (load balancers, proxies) that already handles regular HTTP — no protocol upgrade dance. Each event carries the job\'s progress (stage name, percent, ETA from last lesson\'s cache-aware estimate) and a monotonic event id. That id is not decoration: it is what makes reconnection loss-free, which is the next section\'s subject and the reason SSE was chosen over polling in the first place — polling has no equivalent recovery story, it just asks again and hopes nothing was missed in between.'
      ]
    },
    {
      h: 'Idempotency and the error envelope: retries must be safe, and failures must be legible',
      p: [
        'A creator\'s browser tab loses network for three seconds mid-submit. The client, following ordinary retry logic, resends <code>POST /jobs</code> with the identical plan. Without protection, this enqueues a SECOND render — duplicate GPU minutes for work already started. The fix is an <code>Idempotency-Key</code> header the client generates once per logical submission (a UUID minted at click time, resent unchanged on every retry of THAT click). The server keeps a short-lived table of key → job_id; a repeated key with a matching plan hash returns the EXISTING job_id with no new work enqueued; a repeated key with a DIFFERENT plan hash is a client bug (same key reused for a different submission) and gets rejected as a conflict, never silently guessed at. This is the API-layer sibling of the pipeline\'s content-addressed caching: there, identical STAGE inputs are free; here, identical SUBMISSIONS are free — same principle, one HTTP hop earlier.',
        'And every error the API can return uses one envelope: <code>{"error": {"code": "PLAN_INVALID", "message": "...", "retryable": false}}</code>. The <code>retryable</code> field is the whole point — it is the one piece of information a client needs to decide "retry with backoff" versus "show the creator and stop": a 5xx from a worker crash is retryable (nothing about the request was wrong); a 4xx from a validator rejection is not (retrying an invalid plan just fails again, identically, forever). Baking this into the envelope rather than leaving clients to infer it from HTTP status codes alone is what keeps retry logic simple and correct on every client this API ever gets — the web app today, a CLI or mobile client later, all reading the same explicit signal instead of re-deriving retry policy from status-code folklore.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Baratie\'s Spike: One Ticket, No Doubles, and a Board Everyone Can Read',
      text: 'Before the Baratie had its ticket spike, ordering food was chaos: a waiter took an order, walked it to the kitchen, and then — because nothing told anyone anything — walked BACK every few minutes to ask Zeff "is table six ready yet?", over and over, while actual cooking waited on his attention. Sanji fixed it with a spike by the pass and a board bolted to the wall. A waiter writes the order, spikes it, and tells the customer a number and a wait — instantly, before a single fish is touched, because the ticket existing IS the promise that it will be cooked. Zeff\'s line cooks do not get asked "are you done" — they move the ticket themselves, spearing it onto a "FIRE" nail, then "UP," then "AWAY," and anyone in the room, waiter or customer craning their neck at the board, reads the state without saying a word to a cook mid-plate. One night, a table of impatient marines gets restless, and a rattled new waiter — thinking the first order got lost — writes a SECOND ticket for the same table and spikes it too. Sanji catches it before it fires: he checks the table number and the exact order against the ticket already moving through "FIRE," sees they match, and pulls the duplicate off the spike without a word to the kitchen — the table\'s food gets cooked exactly once, and the flustered waiter gets a look, not a scolding. Later, a dockside storm rips two tickets clean off the spike mid-rush. Instead of guessing what was lost, Zeff has the waiters check the board\'s written sequence — ticket forty-one, forty-two, forty-four spiked, forty-three missing — and only forty-three gets rewritten and re-spiked, at its correct spot in line, nothing re-fired that had already gone out, nothing skipped either.',
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Rail: The Board That Ended the Yelling',
      text: 'At Allesandro\'s, Monica inherits a kitchen running on pure noise — waiters shouting orders through the pass, then shouting AGAIN every ninety seconds to ask if table nine is up yet, over the clatter of the actual cooking. Monica installs an expo rail with numbered ticket slots and three zones — "fire," "plating," "away" — and one rule: nobody asks the line a status question again; you look at the rail. A ticket goes up the moment an order is taken, before a pan is even hot, so a waiter can tell a table "eleven minutes" with total confidence — the ticket\'s existence is the promise. The chaos mostly dies overnight, until the night Ross, covering as a favor and hopelessly out of his depth, take-away a phone order for table four AND writes it up again by hand when the phone printout jams, certain the first one never came through. Monica catches it doing exactly what Sanji does — she checks the order number stamped on the phone ticket against the rail, sees table four is already moving through "plating," and pulls Ross\'s hand-written duplicate before it ever reaches a pan. "Same number, same order — I already have it, Ross." Weeks later the kitchen printer jams mid-rush and eats two tickets. Monica does not re-fire the whole rail from panic; she reads the printer\'s own sequence log — 88, 89, 91 printed, 90 missing — reprints only ticket 90, and slots it exactly where it belongs. Everything else on the rail, still correctly mid-flight, is left completely alone.',
    },
    why: 'Both kitchens solve backend-API design with paper and nails, one ticket-hop before any code exists. The ticket handed over WITH a number, before cooking starts, is 202 Accepted — the promise returned instantly, the work happening after. The rail everyone reads instead of asking the line is Server-Sent Events versus polling: state pushed to a board once, glanced at freely, instead of every waiter interrupting the kitchen on a timer. Sanji and Monica catching the duplicate ticket by matching table-and-order against what is ALREADY on the spike, before it fires twice, is the idempotency key exactly — same logical order, same key, no duplicate work, no argument, just a quiet pull off the spike. And both storms — the torn spike, the jammed printer — are resolved the identical way: read the sequence numbers already assigned, reprint only what is actually missing, touch nothing already correctly in flight. That is Last-Event-ID recovery with a different kind of ink.'
  },
  tech: [
    {
      q: 'Why does GET /jobs/{id} need to be guaranteed fast regardless of the job\'s actual state, and what would break if it were not?',
      a: 'The status endpoint is the one piece of API surface every client hits repeatedly — polling clients on an interval, SSE-less fallbacks, dashboards, health checks — so its latency sets the floor for how responsive the WHOLE product feels, independent of GPU load. It stays fast by construction: it reads one row from the job table (state, progress, current stage), never touches the render pipeline, the model, or the file system. If it were implemented as "check whether the worker process is still alive" or "peek at partial output on disk," its latency would inherit the pipeline\'s variance — slow under GPU contention exactly when creators are most anxiously checking. Keeping status reads and job execution on completely separate data paths (the job table is written by the worker, read by the API, and the two never share a lock) is what keeps a backed-up render queue from ALSO looking like a broken API.'
    },
    {
      q: 'A creator submits a job, the response never arrives (timeout), and the client retries with the same Idempotency-Key. Walk through both possible outcomes on the server.',
      a: 'Outcome one: the original request never actually reached the server (true network failure, nothing enqueued). The retry looks up the idempotency key, finds nothing, proceeds as a normal fresh submission — enqueues once, returns 202. Outcome two: the original request DID reach the server and enqueue a job, but the RESPONSE was lost on the way back (the client never learned the job_id) — the classic dangerous case. The retry looks up the key, finds the earlier record with a matching plan hash, and returns the SAME job_id with no new enqueue — the client ends up in the same state (knowing its job_id) whether it took one round trip or two. The key\'s TTL matters here: too short and a slow legitimate retry (client backoff, page reload) misses the window and double-enqueues; too long and storage grows unboundedly. A TTL matched to the client\'s realistic retry window — minutes, not the job\'s lifetime — covers the real race without keeping the table forever.'
    },
    {
      q: 'How does a browser reconnect to an SSE progress stream after a dropped connection without missing or duplicating progress events?',
      a: 'Every event the server writes carries a strictly increasing id (<code>id: 42\\ndata: {...}\\n\\n</code>). The browser\'s EventSource remembers the last id it successfully processed and, on automatic reconnect, sends it back as a <code>Last-Event-ID</code> header — this part is built into the browser, not application code. The server\'s job is to honor that header: instead of resuming the live stream from whatever is happening NOW, it first replays every buffered event with an id greater than the given Last-Event-ID (from a short server-side ring buffer per job, not the full history), THEN continues live. This is exactly why events need monotonic ids in the first place — without them, "replay what you missed" has no well-defined starting point, and the only fallback is "replay everything" (duplicates) or "start from now" (gaps). The buffer only needs to cover a job\'s realistic disconnect window, not its whole lifetime, since a client that misses a large enough gap can always fall back to a plain <code>GET /jobs/{id}</code> for the current snapshot and resubscribe fresh.'
    }
  ],
  code: {
    title: 'The four contracts, assembled: accept, subscribe, retry safely',
    intro: 'None of this is new machinery — it is HTTP\'s own async patterns, wired to the job queue and cache keys already built.',
    code: `def post_jobs(request):
    key = request.headers.get('Idempotency-Key')      # required
    plan_hash = canonical_hash(request.json['plan'])

    existing = idempotency_table.get(key)
    if existing:
        if existing['plan_hash'] == plan_hash:
            return accepted(existing['job_id'])         # safe retry: no new work
        return conflict('Idempotency-Key reused for a different plan')

    errors = unified_validator(request.json['plan'])     # last lesson's gate
    if errors:
        return error_response('PLAN_INVALID', errors, retryable=False)

    job_id = enqueue_job(request.json['plan'])            # L15's queue
    idempotency_table.set(key, {'job_id': job_id, 'plan_hash': plan_hash},
                          ttl_s=600)
    return accepted(job_id)                                # 202, <50ms

def get_job(job_id):
    row = job_table.read(job_id)          # ONE row read, never touches
    return status_json(row)               #   the render pipeline itself

def get_job_events(request, job_id):
    last_id = request.headers.get('Last-Event-ID')        # browser sets this
    stream = sse_response()
    for evt in event_buffer.since(job_id, last_id):        # replay the gap
        stream.write(evt)
    for evt in event_buffer.subscribe_live(job_id):        # then live
        stream.write(evt)
    return stream

def error_response(code, message, retryable):
    return json_response(
        {'error': {'code': code, 'message': message, 'retryable': retryable}},
        status=400 if not retryable else 503)`,
    notes: [
      'idempotency_table.set happening AFTER validation, not before, means an invalid plan never occupies the idempotency slot — a client that fixes the plan and resubmits with the SAME key gets a fresh attempt, not a stale conflict.',
      'event_buffer.since() before subscribe_live() is the gap-then-live pattern: a client reconnecting mid-job sees the exact events it missed, in order, with nothing replayed twice and nothing skipped.'
    ]
  },
  lab: {
    title: 'The spike and the rail: idempotent submission and gapless resume',
    prompt: 'Two functions. (1) <code>submit_job(existing, key, plan_hash, new_job_id)</code>: <code>existing</code> is a dict mapping idempotency key → <code>{"job_id", "plan_hash"}</code>. If <code>key</code> is already in <code>existing</code>: return its stored <code>job_id</code> if <code>plan_hash</code> matches (safe retry), or <code>{"conflict": True}</code> if it does not (key reused for a different submission). Otherwise record <code>{"job_id": new_job_id, "plan_hash": plan_hash}</code> under <code>key</code> in <code>existing</code> and return <code>new_job_id</code>. (2) <code>events_since(events, last_event_id)</code>: <code>events</code> is a list of <code>{"id", ...}</code> dicts sorted by id. Return only the events with <code>id > last_event_id</code>, in order. If <code>last_event_id</code> is <code>None</code>, return every event (a fresh subscriber with nothing to resume from).',
    starter: `def submit_job(existing, key, plan_hash, new_job_id):
    # matching key+hash -> existing job_id (safe retry)
    # matching key, different hash -> {"conflict": True}
    # new key -> record it, return new_job_id
    pass

def events_since(events, last_event_id):
    # None -> everything; otherwise only id > last_event_id
    pass`,
    checks: [
      { re: 'def\\s+submit_job\\s*\\(', flags: '', must: true, hint: 'Define submit_job(existing, key, plan_hash, new_job_id).', pass: 'submit_job defined ✓' },
      { re: 'def\\s+events_since\\s*\\(', flags: '', must: true, hint: 'Define events_since(events, last_event_id).', pass: 'events_since defined ✓' },
      { re: 'conflict', flags: '', must: true, hint: 'A reused key with a different plan_hash must return a conflict marker, not a guess.', pass: 'conflict handling ✓' },
      { re: 'plan_hash', flags: '', must: true, hint: 'The stored plan_hash is what distinguishes a safe retry from a reused key.', pass: 'plan_hash checked ✓' }
    ],
    tests: `existing = {}
r1 = submit_job(existing, 'key-A', 'hashX', 'job-1')
assert r1 == 'job-1' and existing['key-A']['job_id'] == 'job-1'

r2 = submit_job(existing, 'key-A', 'hashX', 'job-2')
assert r2 == 'job-1', 'same key, same plan: return the EXISTING job, no new work'

r3 = submit_job(existing, 'key-A', 'hashY', 'job-3')
assert r3 == {'conflict': True}, 'same key, different plan: conflict, never guess'

r4 = submit_job(existing, 'key-B', 'hashZ', 'job-4')
assert r4 == 'job-4' and len(existing) == 2

events = [{'id': 1, 'pct': 10}, {'id': 2, 'pct': 30}, {'id': 3, 'pct': 60}]
assert events_since(events, None) == events, 'fresh subscriber gets everything'
assert events_since(events, 1) == [{'id': 2, 'pct': 30}, {'id': 3, 'pct': 60}]
assert events_since(events, 3) == [], 'fully caught up: nothing to replay'
print('idempotent submission and gapless resume correct')`,
    solution: `def submit_job(existing, key, plan_hash, new_job_id):
    prior = existing.get(key)
    if prior is not None:
        if prior['plan_hash'] == plan_hash:
            return prior['job_id']
        return {'conflict': True}
    existing[key] = {'job_id': new_job_id, 'plan_hash': plan_hash}
    return new_job_id

def events_since(events, last_event_id):
    if last_event_id is None:
        return list(events)
    return [e for e in events if e['id'] > last_event_id]`,
    notes: [
      'submit_job is Sanji\'s spike check in six lines: same table-and-order (key+hash) returns the ticket already cooking; a mismatched hash under a reused key is the one case that must never be silently guessed at.',
      'events_since is the storm-recovery rule — replay exactly what was missed, using the sequence numbers already assigned, and leave everything already delivered alone.'
    ]
  },
  quiz: [
    {
      q: 'POST /jobs returns 202 Accepted with a job_id in under 50ms even though the render may take minutes because:',
      options: ['The render actually happens synchronously in the background thread', 'The endpoint only validates and enqueues; execution happens on the job queue, and the response is a receipt, not a result', 'The API caches a fake response', 'Renders are always fast'],
      correct: 1,
      explain: 'Create returns a receipt instantly; status and results are separate reads that never block on the pipeline.'
    },
    {
      q: 'Server-Sent Events fit the progress-delivery use case better than WebSockets primarily because:',
      options: ['SSE is a newer protocol', 'The traffic is purely one-directional (server to client), so SSE gets built-in reconnection over plain HTTP without paying for duplex capability the app never uses', 'WebSockets cannot carry JSON', 'SSE uses less bandwidth per message'],
      correct: 1,
      explain: 'Match the transport to the traffic shape: no client-to-server messages are needed mid-stream, so the simpler, self-reconnecting protocol wins.'
    },
    {
      q: 'A client retries POST /jobs with the same Idempotency-Key after a timeout. If the original request DID reach the server and enqueue a job, the retry:',
      options: ['Enqueues a second, duplicate job', 'Returns the existing job_id with no new work enqueued, because the key+plan-hash match a prior record', 'Fails with an error requiring a new key', 'Cancels the original job and starts over'],
      correct: 1,
      explain: 'The idempotency table turns a dangerous retry into a safe one: same logical submission, same result, no duplicate GPU spend.'
    },
    {
      q: 'The error envelope includes a "retryable" boolean because:',
      options: ['It is required by the HTTP spec', 'It gives every client an explicit, unambiguous signal for retry-with-backoff versus show-and-stop, instead of inferring policy from status codes alone', 'It simplifies logging', 'It replaces the need for status codes entirely'],
      correct: 1,
      explain: 'A 5xx from a worker crash is retryable; a 4xx from a rejected plan is not. Baking that into the payload keeps every future client\'s retry logic simple and correct.'
    },
    {
      q: 'On SSE reconnect, the server replays buffered events with id greater than the client\'s Last-Event-ID, then continues live, because:',
      options: ['It is simpler to implement than tracking state', 'This closes the exact gap the disconnect created — nothing missed, nothing re-delivered — which polling has no equivalent mechanism for', 'SSE requires replaying at least one event', 'It reduces server memory usage'],
      correct: 1,
      explain: 'Monotonic ids turn "what did I miss?" into a well-defined query. Without them, recovery degrades to replay-everything or start-from-now.'
    }
  ],
  pitfalls: [
    'Trusting a file\'s declared content-type or extension instead of its actual bytes. A renamed file sailing past a naive extension check into a vision or audio model is a security hole, not an edge case — verify magic bytes at the upload boundary, before the file touches any pipeline stage.',
    'Implementing "async" job creation as a background thread inside the same request-response cycle instead of a real queue handoff. It looks identical in a demo and falls apart the moment the process restarts mid-render or two requests race on the same worker — the job must be durable (in the queue, in the job table) the instant 202 is returned, not held in process memory.',
    'Skipping the Idempotency-Key contract because "our users don\'t usually double-click." The dangerous case is never the double-click — it is the client\'s OWN retry logic (a mobile app\'s exponential backoff, a flaky wifi reconnect) faithfully resending a request the developer never tested against, and it costs real render minutes the one time it happens in production.'
  ],
  interview: [
    {
      q: 'Design the API for submitting a media-generation job and tracking it to completion. What are the endpoints, and why this shape?',
      a: 'Four endpoints, each doing exactly one thing. POST /jobs takes a validated plan plus a required Idempotency-Key header, checks the key against a short-lived table (matching plan hash → return the existing job_id, no new work; mismatched hash → conflict), otherwise enqueues and returns 202 with a job_id in well under a second regardless of predicted render time — the response is a receipt, not a result. GET /jobs/{id} reads one row from a job table the worker writes to (state, current stage, progress percent) and never touches the pipeline itself, so it stays fast under any GPU load. GET /jobs/{id}/events opens a Server-Sent-Events stream, replaying buffered events past the client\'s Last-Event-ID on reconnect before continuing live — chosen over WebSockets because the traffic is one-directional and over polling because it needs no arbitrary interval and delivers a gapless recovery story. GET /jobs/{id}/result returns the finished artifact reference once state is terminal. The shape follows from one constraint: render time varies from milliseconds (full cache hit) to minutes (cold), and no single request/response cycle can be sized to fit both — so creation, status, and result are split into separate concerns that each answer in constant time.'
    },
    {
      q: 'A teammate wants to skip idempotency keys — "we\'ll just tell users not to double-click submit." What do you say?',
      a: 'That the double-click is the least likely trigger and the least important one to defend against. The real threat is every retry mechanism the client stack already has running without a human anywhere near it: a mobile client\'s exponential-backoff retry on a timeout, a service worker replaying a queued request after the browser tab was backgrounded, a proxy or load balancer that retries a request it believes failed cleanly. None of those ask the user\'s permission, and all of them resend the identical POST body. Without a key, the server has no way to distinguish "this is the same logical submission arriving twice" from "this is a genuinely new request that happens to look similar," so it does the only safe-looking thing and enqueues both — which for this product means paying GPU-minutes twice for one creator intent. The fix costs one client-generated UUID per submission and a short-lived server-side table; the alternative costs debugging a support ticket about a mysteriously double-billed render months after ship, at which point the fix is the same one line of code plus an incident writeup. I\'d ship the key from day one — it is cheap exactly because it is boring, and the day it is needed it is needed silently, in production, with no user in the loop to blame.'
    },
    {
      q: 'How would you load-test and monitor this API, given that job creation is fast but job COMPLETION can take minutes?',
      a: 'Split the metrics the same way the endpoints are split, because a single "API latency" number would hide the interesting failures. POST /jobs and GET /jobs/{id} get standard request-latency percentiles (p50/p99) with a tight SLO — both should answer in milliseconds regardless of system load, since neither touches the pipeline; a regression here means someone accidentally coupled a fast endpoint to a slow resource (the classic bug: status reads that accidentally query the GPU worker instead of the job table). Job THROUGHPUT and DURATION are a separate metric family — jobs enqueued per minute versus jobs completed per minute (queue depth is the derivative), p50/p99 time-to-completion by stage mix (a cache-heavy render and a cold one should be tracked separately, or the average is meaningless), and worker utilization against the hardware lesson\'s VRAM budget. SSE-specific: concurrent open streams, reconnect rate (a spike means something upstream — a proxy timeout, a flaky network segment — is dropping long-lived connections), and replay-buffer hit rate on reconnect (near 100% means recovery is working; a client falling back to full GET refetches means the buffer window is too short for real-world disconnect durations). Load testing has to simulate the ACTUAL shape: a burst of job creations (cheap, should scale trivially) against a fixed worker pool (the real bottleneck, GPU-bound, does not scale with more API instances) — the useful load test proves the API layer stays responsive while the queue backs up, not that the whole pipeline is infinitely fast.'
    },
    {
      q: 'Everything in this course\'s pipeline runs locally — no cloud, no paid APIs. Does that change anything about this API design, or is it identical to a cloud-hosted equivalent?',
      a: 'The contracts are identical — 202-and-poll, idempotency keys, SSE with resume are shapes that come from the PROBLEM (long jobs, unreliable connections, retry-happy clients), not from being multi-tenant or cloud-hosted, so a local-first app gets zero discount on needing them. What changes is capacity planning and a few defaults. There is exactly one GPU worker pool, usually exactly one machine, so the queue depth metric IS the whole system\'s health signal in a way it would not be behind an auto-scaling cloud fleet — and the API should expose that queue depth to the client honestly ("3 jobs ahead of you") rather than pretending infinite capacity. Idempotency-key TTLs can be more generous since storage is cheap and local, not billed per-GB. And the security posture shifts, not relaxes: single-user-per-machine means no cross-tenant data leakage to worry about, but the upload-validation and content-hash discipline stay non-negotiable regardless, because a locally-run vision model fed a malformed file is just as exploitable as a cloud one — "local" changes the deployment topology, never the correctness obligations.'
    }
  ]
};
