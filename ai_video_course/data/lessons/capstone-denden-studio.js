window.LESSONS = window.LESSONS || {};
window.LESSONS['capstone-denden-studio'] = {
  id: 'capstone-denden-studio',
  title: 'Capstone: Assemble DenDen Studio From Every Piece You Built',
  category: 'Part 7 — Evaluation & Capstone',
  timeMin: 60,
  summary: 'Twenty-one lessons built twenty-one pieces: local models, structured output, vision intake, voice cloning, talking heads, gesture and diffusion animation, the realtime loop, keyframes and direct manipulation, natural-language editing, the job queue, the director, hardware budgeting, the API, the frontend, consent and provenance, and evaluation. None of it was ever separate — every lesson\'s "why" explicitly pointed at the others. This capstone does not add a new mechanism; it draws the map. One creator request, traced end to end, with every hop naming the lesson that built it — then the system map as one document, the invariants that kept showing up at every layer and why that repetition was load-bearing rather than redundant, and a realistic, honest build order for anyone actually building this.',
  goals: [
    'Trace one creator request — a paragraph and a photo in, a finished video out — through every system this course built, citing which lesson owns each hop',
    'Assemble the full DenDen Studio architecture as one map: frontend, API, director, executor, model pool, consent/provenance layer, evaluation harness',
    'Name the invariants that recur at every layer — jurisdiction, content-addressed caching, propose-never-execute, scoped consent, reject-vs-repair — and explain why repeating a pattern at each scale was a design choice, not duplication',
    'Define the minimum slice that proves the architecture end-to-end without implementing every model integration, and explain why that slice is the right first target',
    'Plan a build order sequenced by what unblocks the most downstream work, and identify where to cut scope first if time runs short'
  ],
  concept: [
    {
      h: 'One request, traced end to end',
      p: [
        'A creator uploads a photo and a voice sample, writes "make her wave and welcome viewers, warm and excited," and clicks go. Upload: the file streams in chunked and resumable, its bytes verified against a magic-number allowlist, its content hash computed at the door (backend-api-design) — that hash becomes the cache key every downstream stage will check against. Intake: a VLM reads the photo under the semantics-vs-geometry jurisdiction rule, a deterministic face detector measures the geometry neither should guess at, and the combined verdict decides the pipeline path (multimodal-models). Voice: the sample is validated for quality and duration, and — before anything else touches it — the consent registry checks this voice_id is enrolled, unrevoked, and in scope for this use (voice-cloning-from-a-sample, safety-consent-ethics).',
        'Direction: the creator\'s paragraph, plus a grounding block of real project facts pulled through read-only tools, becomes one schema\'d plan document — stages, voice, gesture timeline, ambient prompt, parameters (llm-as-director). The plan hits the unified validator; policy violations (an out-of-scope voice) reject outright, encoding mistakes (an out-of-bounds keyframe) repair in a bounded loop. The creator sees a plain-language preview with a cache-aware cost estimate and approves. Execution: the approved plan — verbatim, never re-generated — goes to the job queue; each stage computes a content key from its actual inputs, checks the cache, and only runs what changed (media-pipeline-orchestration, hardware-quantization-caching); TTS, coefficients or gesture instantiation, frame rendering, and mux run in dependency order, each hashed and cached the moment it completes. Delivery: progress streams to the browser over SSE with real stage names and percentages, the frontend renders one plan object across every panel (creator-frontend), and the finished video is tagged with a signed provenance manifest and an in-media watermark BEFORE it ever reaches export (safety-consent-ethics). Evaluation runs in the background the whole time: sync offset, audio and frame quality proxies on this exact render, feeding the golden-set trend line the team watches across every model version (evaluating-generated-media).'
      ]
    },
    {
      h: 'The system, as one map',
      p: [
        'Seven components, each with a narrow contract. The <b>frontend</b> holds one plan object and renders every view from slices of it; it talks to nothing but the API. The <b>backend API</b> accepts uploads and job submissions, returns 202 instantly, streams progress, and enforces idempotency — it holds no domain logic of its own, only contracts. The <b>director</b> (an LLM, grounded and constrained) is the only component that turns free text into a plan; it never touches a file, a model weight, or a queue directly. The <b>executor</b> (deterministic workers on the job queue) is the only component that runs models and writes artifacts; it takes plans, never prose. The <b>model pool</b> — Whisper, a TTS engine, a talking-head model, a VLM, sized against the hardware lesson\'s residency plan — does the actual generation, swappable behind each stage\'s contract without the executor caring which checkpoint is loaded. The <b>consent/provenance layer</b> gates every synthesis call and tags every output, sitting between the executor and the model pool where nothing can route around it. The <b>evaluation harness</b> watches everything downstream of the executor, on every render automatically and on a human-reviewed sample, feeding findings back into both the proxy-metric set and the golden set.',
        'Draw the arrows and a rule falls out: prose flows in one direction (creator → director → plan), and executable instructions flow in exactly one direction from there (plan → executor → model pool). Nothing downstream of the plan ever produces a NEW plan or a new prose interpretation — a failure replans by going back to the director with error context, never by improvising at the executor. That single-direction flow is what makes every other invariant in this course enforceable: you cannot police a boundary that data crosses back and forth across freely.'
      ]
    },
    {
      h: 'The repeated invariants: not duplication, the same defense at every scale',
      p: [
        'Five patterns appear, restated, in nearly every lesson from Part 1 onward, and that repetition was deliberate. <b>Jurisdiction</b> (semantic judgment to probabilistic components, geometric or deterministic facts to deterministic ones) appears in multimodal intake, in Whisper-plus-VAD, in the director-versus-executor split itself — because the same mistake (letting a model guess at something a formula should compute, or vice versa) is available at every layer, so the guardrail has to be re-asserted at every layer. <b>Content-addressed caching</b> (hash the real inputs, key the output, skip identical work) appears in stage execution, in the director\'s cost estimates, in the API\'s idempotency table, in the golden-set regression diff — one mechanism, reused because "have I already done this exact work" is a question every layer independently needs answered.',
        '<b>Propose, never execute</b> (the LLM emits documents; deterministic code runs them) is the director\'s entire boundary and also the frontend\'s relationship to the plan and the API\'s relationship to a client request — probabilistic judgment stays upstream of anything with real cost or consequence, everywhere it appears. <b>Reject versus repair</b> (fix encoding mistakes, refuse policy violations, and check policy FIRST) shows up in the director\'s validator and in the consent gate identically, because both need the same asymmetry for the same reason. And <b>scoped, revocable authorization</b> (a grant checked fresh, never assumed) shows up in consent AND in idempotency keys AND in review triggers — every gate in this system is a small, fast, always-fresh lookup, never a cached assumption. Seeing these five patterns once, in one lesson, would have looked like a clever trick; seeing them five times, in five different lessons, each time solving a DIFFERENT concrete problem, is what shows they are actual architecture — the load-bearing walls, not decoration repeated for effect.'
      ]
    },
    {
      h: 'Building it for real: the minimum slice, and the order that unblocks the most',
      p: [
        'A capstone build does not need every model integration to prove the architecture — it needs the FULL LOOP, narrow. The minimum viable slice: one path through intake (a single reference-photo category, skip the rest), one TTS engine (skip voice cloning\'s extra validation), one talking-head model (skip the gesture-library and diffusion families), the complete director → validate → preview → execute → cache chain with real content-hashing, one consent check (even a hardcoded single-voice registry), SSE progress end to end, and one proxy metric (sync offset) running automatically. That slice touches every ARCHITECTURAL boundary in this course while implementing only a fraction of the model surface — and it is the version worth building first, because it proves or disproves the plan-document-as-lingua-franca bet before a single hour goes into a second talking-head model or a third voice engine.',
        'Build order follows what UNBLOCKS the most, not what is most interesting or easiest. Content-addressed caching and the job queue come first — nearly every other component (the director\'s cost estimates, the API\'s status reads, the evaluation harness\'s regression diffs) assumes hashed, cached stages exist beneath it, so building it last means retrofitting that assumption into everything built before it. The plan schema comes next, before any UI, because the frontend, the director, and the executor all need to agree on its shape before any of the three can be usefully built in parallel. The director and a bare-bones executor come before the polished frontend, because a working backend reachable by curl proves the loop; a beautiful UI over a broken loop proves nothing. Consent and provenance are NOT an add-on-later phase (the safety-consent-ethics lesson\'s pitfall, restated at project scale) — the minimal versions belong in the first working slice, because retrofitting a gate into a system already shipping ungated media is a strictly harder problem than building the gate in from the start. If time runs short, cut model VARIETY (one voice, one talking-head family) long before cutting any of the five invariants — a narrow system with every guardrail intact is a real foundation; a broad system missing a guardrail is a liability wearing a feature list.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Thousand Sunny\'s Maiden Voyage: Every System, Built Separately, Sailing as One',
      text: 'The day the Thousand Sunny finally leaves Water 7 is the day every system this crew spent an arc building has to work TOGETHER for the first time, not separately. Galley-La\'s Dock One built her hull and rigging to the yard\'s stamped standards; Iceburg\'s desk turned the crew\'s vague wishes into the complete work order the dock actually built from; the Baratie-style ticket discipline Sanji insisted on for provisioning meant the galley knows exactly what stores are aboard and what needs restocking, no guessing; Nami\'s voyage plan sets the course and the crew\'s sea-trial instruments — Franky\'s gauges plus his own trained ear — stand watch the whole first day out, exactly the way they did in trials, because a maiden voyage is a sea trial that does not get to stop. None of these were ever meant to run alone. The hull rides true because Galley-La\'s stitched marks are the real ones, checked, not because anyone re-litigates the build mid-voyage. The stores hold up because the provisioning ticket system was trusted, not re-counted crate by crate every hour. And when a squall hits on the second day, the crew does not improvise a new plan from scratch — Nami calls the course correction, Franky reports what the hull can actually take, and the work happens through the same roles and the same checks that built the ship in the first place, just now running live, under real weather, with everyone aboard depending on all of it holding at once. Watching the coastline disappear, Usopp says what the whole crew is thinking: "We built each piece separately and argued about every detail — and somehow, today, it\'s just... one ship."'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica and Chandler\'s Wedding: Every System, Built Separately, Running as One Day',
      text: 'The day Monica and Chandler get married is the day every skill this group has separately built over the years has to work together, live, with no retakes. Monica\'s planning binder — the same single-source-of-truth instinct that turned her restaurant kitchen\'s chaos into an expo rail years earlier — becomes the day\'s master runsheet, and everyone, from caterer to DJ to Ross\'s toast timing, works off THAT one document, not their own private notion of the schedule. Joey, who spent a whole movie shoot learning what a real call sheet does, ends up being the one who keeps the day\'s actual timeline honest when Monica is too deep in her own nerves to check it herself — the skill transferred completely from a movie set to a wedding without anyone planning it that way. When the sky threatens rain over the outdoor ceremony, the group does not panic and improvise — they run the tent-fallback plan that was written into the binder from the start, the same disciplined instinct as a director who plans boldly and pays only for what changes. And at the door, when a stranger claiming to be "an old friend of Phoebe\'s" tries to slip into the tightly-guarted seating chart, it is Phoebe herself, unprompted, who deploys the tell she and the gang settled on years back — because the trust systems this group built for entirely different reasons never actually retired, they just kept quietly running underneath everything else. Chandler, watching all of it click into place around him, leans over to Ross: "None of this was ever ONE system. It just turns out we already built every piece of it, years apart, without knowing that\'s what we were doing."'
    },
    why: 'Both stories are the same argument at capstone scale: a system that WORKS on the big day is not one thing built at the end — it is every earlier, separately-motivated piece (a ticket discipline, a work-order habit, a sea-trial instrument, a consent tell, a fallback plan) still running, unretired, now discovered to have been the same architecture all along. The Sunny\'s hull marks and the wedding\'s master binder are the same single-source-of-truth instinct from two different lessons; Franky\'s live sea-trial watch and Joey\'s live call-sheet keeping are the same evaluation-in-production habit; the squall\'s course correction and the rain-tent fallback are the same plan-boldly-pay-marginally reflex, deployed live instead of rehearsed; and Phoebe\'s unprompted tell at the door is the exact same scoped-consent check from the safety lesson, still quietly guarding the door years after the scene that introduced it. Neither crew built a capstone system on the day it mattered — they built twenty-one separate systems earlier, for twenty-one separate reasons, and the capstone was just the first day all of them had to hold at once.'
  },
  tech: [
    {
      q: 'Why does the recommended build order put content-addressed caching and the job queue FIRST, before the director or the frontend even exist?',
      a: 'Because nearly every other component in the map is written assuming hashed, cached, dependency-ordered stages already exist beneath it — the director\'s cost estimates read cache-hit state, the API\'s idempotency table and status reads assume a job/stage model already exists, and the evaluation harness\'s regression diffs assume stage outputs are already keyed and comparable. Building the queue and caching layer last would mean every one of those components gets built against an assumption that does not exist yet, then has to be retrofitted once it does — which in practice means rewriting the interfaces those components were built against, not just adding a feature underneath them. Building the foundation layer first means everything built afterward is built against the REAL contract from day one, which is cheaper by exactly the amount of rework retrofitting would have cost, and is also why "boring infrastructure first" beats "exciting user-facing feature first" specifically for THIS kind of layered architecture, even though it delays anything demoable.'
    },
    {
      q: 'The minimum viable capstone slice deliberately implements only one model per stage (one TTS engine, one talking-head family) but insists on the FULL director-validate-execute-cache loop. Why is that split — narrow models, complete architecture — the right cut rather than the reverse?',
      a: 'Because the models are the part of this system with the least architectural risk and the most implementation labor: swapping Piper for XTTS, or one talking-head checkpoint for another, is real work but it is WORK WITHIN a contract that either does or does not already exist — it does not change whether the plan schema is the right shared language, whether caching correctly prevents duplicate work, or whether the consent gate is unbypassable. The architecture — the loop, the boundaries, the invariants — is exactly the part that is expensive to discover is WRONG late, because fixing a boundary violation after three model integrations were built against the flawed version means touching all three; fixing a boundary while only one model exists on each side means touching two things. Proving the full loop narrow, then widening model variety against a proven loop, derisks the expensive-to-fix layer first and defers the merely-labor-intensive layer, which is the correct order whenever risk and effort are not the same axis.'
    },
    {
      q: 'If a team is forced to cut scope under a deadline, this lesson argues for cutting model variety before cutting any of the five recurring invariants (jurisdiction, caching, propose-not-execute, reject-vs-repair, scoped consent). Make the case precisely.',
      a: 'Model variety is a BREADTH cut — losing it means the product does fewer things, visibly and honestly, and a creator missing a voice option knows exactly what they are missing. Cutting an invariant is a DEPTH cut disguised as a corner case — skipping the consent check "for the demo," or letting the director\'s output execute without the unified validator "just for now," does not visibly remove a feature; it silently removes a guarantee that nothing in the remaining system was built to detect the absence of. The failure mode is not smaller, it is invisible until it is a production incident — the safety-consent-ethics lesson\'s exact pitfall (provenance as an add-later feature) generalizes to every invariant here: a system missing a model is obviously incomplete; a system missing a guardrail looks complete right up until the specific input that needed the guardrail arrives. Given a fixed budget, a narrow-but-safe system can honestly ship and grow; a broad-but-unguarded one is a liability that happens to also have a lot of features.'
    }
  ],
  deepDive: {
    title: 'After the capstone: capacity math and the maintenance loop',
    sections: [
      {
        h: 'Back-of-envelope capacity for a real single-user deployment',
        p: 'Before writing a line of the executor, size the box it will run on using the hardware lesson\'s numbers: a live-mode session needs the co-resident VRAM sum of whatever models run simultaneously (STT + VC in the realtime loop, say) held for the session\'s duration; a batch-mode render needs only the PEAK of any single stage\'s footprint, since stages run sequentially and release VRAM between them (the hardware lesson\'s max-not-sum rule). Storage sizing follows the caching lesson\'s manifest model directly: expected renders per week times average artifact size per stage times the cache\'s configured retention window, with the eviction policy\'s cost-per-MB ranking as the release valve when that estimate is wrong (it usually is, in the direction of "creators render more than the spreadsheet assumed"). The one number worth computing before anything else: time-to-first-render for a cold cache, end to end — if that number is not acceptable on the target hardware, no amount of caching or UI polish fixes it later, because caching only ever helps the SECOND render of anything, never the first.'
      },
      {
        h: 'What changes after ship: the maintenance loop this course quietly built',
        p: 'Every lesson\'s evaluation habit becomes a standing job once the capstone actually ships: the golden set gets refreshed against real (anonymized) usage patterns on a schedule, not once at launch (the evaluation lesson\'s staleness pitfall); model upgrades run through the full regression harness before replacing a default, with the old model\'s plans logged shadow-mode during a canary period (the director lesson\'s evaluation-across-upgrades answer); consent grants expire and get re-confirmed on the registry\'s own schedule, not left to run forever on an initial yes; and the audit log\'s retention window gets enforced on a timer, not by manual cleanup someone forgets to run. None of this is new work invented for "maintenance" — it is the same golden-set, cache-key, and scoped-grant machinery built for day-one correctness, now running continuously instead of once. The honest way to think about a capstone build finishing is that it does not finish — it starts the loop that keeps every invariant this course built from quietly rotting the moment nobody is watching it anymore.'
      }
    ]
  },
  code: {
    title: 'The whole map, in the order a request actually flows',
    intro: 'Every function here names the lesson that built it. Nothing in this file is new — it is the table of contents, executable.',
    code: `def denden_studio_request(upload, script_text, voice_id, project):
    # 1. Upload — backend-api-design + multimodal-models
    artifact = accept_upload(upload)                       # hashed, verified,
    intake = get_intake_report(artifact)                    #   resumable
                                                             # VLM + detector,
                                                             #   jurisdiction rule
    # 2. Consent — voice-cloning-from-a-sample + safety-consent-ethics
    if not authorize(consent_registry, voice_id, project.use_case):
        return rejected('CONSENT_MISSING_OR_OUT_OF_SCOPE')  # fresh, scoped,
                                                             #   never cached
    # 3. Direction — llm-as-director
    plan = direct(script_text, project)                     # grounded, schema'd,
    errors = unified_validator(plan, project)               #   validate-or-repair
    if errors:
        plan = repair_loop(plan, errors)
    est = execution_estimate(plan_stages(plan), cache, EST_MS)  # hardware-
    if not preview_to_creator(plan, est):                       #   quantization-
        return None                                              #   caching
    # 4. Execution — media-pipeline-orchestration
    job_id = enqueue_job(plan)                              # verbatim, hashed,
                                                             #   cache-checked
    # 5. Delivery — backend-api-design + creator-frontend
    stream_progress(job_id)                                 # SSE, real stages
    result = await_completion(job_id)
    # 6. Provenance — safety-consent-ethics
    tagged = sign_and_watermark(result, grant_id=voice_id)  # before export,
                                                             #   not after
    # 7. Evaluation — evaluating-generated-media
    scores = score_render(tagged.audio, tagged.video)        # every render,
    route = review_route(scores, ...)                        #   automatically
    return delivered(tagged, evaluation=scores)`,
    notes: [
      'Every step names its owning lesson in the comment on purpose — the capstone\'s only new content is the ORDER and the seams, not the mechanisms themselves.',
      'The consent check runs before the director is ever invoked, not after — capability is gated before any generation planning happens, matching the reject-before-repair asymmetry at the earliest possible point.'
    ]
  },
  lab: {
    title: 'Build order and the full-lifecycle checkpoint audit',
    prompt: 'Two functions. (1) <code>build_order(deps)</code>: <code>deps</code> maps component name → list of prerequisite component names that must be built first. Return a valid build order (a topological sort) as a list, where every component appears after all its prerequisites. When multiple components are ready at the same time, break ties alphabetically for a deterministic result. (2) <code>checkpoints_passed(trace, required)</code>: <code>trace</code> is the ordered list of checkpoint names an actual request passed through; <code>required</code> is the ordered list of checkpoints that MUST all appear, in that relative order (other checkpoints may appear between them). Return <code>True</code> if <code>required</code> is a subsequence of <code>trace</code> in order, else <code>False</code>.',
    starter: `def build_order(deps):
    # topological sort; ties broken alphabetically
    pass

def checkpoints_passed(trace, required):
    # True if required appears as an in-order subsequence of trace
    pass`,
    checks: [
      { re: 'def\\s+build_order\\s*\\(', flags: '', must: true, hint: 'Define build_order(deps).', pass: 'build_order defined ✓' },
      { re: 'def\\s+checkpoints_passed\\s*\\(', flags: '', must: true, hint: 'Define checkpoints_passed(trace, required).', pass: 'checkpoints_passed defined ✓' },
      { re: 'sorted\\(', flags: '', must: true, hint: 'Break ties among simultaneously-ready components alphabetically for a deterministic order.', pass: 'deterministic tie-break ✓' }
    ],
    tests: `deps = {'A': [], 'B': ['A'], 'C': ['A'], 'D': ['B', 'C']}
order = build_order(deps)
assert order == ['A', 'B', 'C', 'D'], 'A first; B before C alphabetically; D last'
assert order.index('A') < order.index('B') < order.index('D')
assert order.index('A') < order.index('C') < order.index('D')

deps2 = {'X': [], 'Y': [], 'Z': ['X', 'Y']}
order2 = build_order(deps2)
assert order2 == ['X', 'Y', 'Z'], 'X and Y both ready first: alphabetical'

trace = ['upload', 'intake', 'consent', 'plan', 'validate', 'cache_check',
        'render', 'provenance', 'evaluate']
required = ['upload', 'consent', 'validate', 'render', 'provenance']
assert checkpoints_passed(trace, required) is True

bad_trace = ['upload', 'plan', 'render', 'consent', 'provenance']
assert checkpoints_passed(bad_trace, required) is False, \
    'consent must come before render, not after'

missing_trace = ['upload', 'plan', 'render', 'provenance']
assert checkpoints_passed(missing_trace, required) is False, 'consent never appears'
print('build order and checkpoint audit correct')`,
    solution: `def build_order(deps):
    remaining = {k: set(v) for k, v in deps.items()}
    order = []
    while remaining:
        ready = sorted(k for k, v in remaining.items() if not v)
        if not ready:
            raise ValueError('cyclic dependency')
        for k in ready:
            order.append(k)
            del remaining[k]
        for v in remaining.values():
            v -= set(ready)
    return order

def checkpoints_passed(trace, required):
    idx = 0
    for chk in required:
        while idx < len(trace) and trace[idx] != chk:
            idx += 1
        if idx == len(trace):
            return False
        idx += 1
    return True`,
    notes: [
      'build_order processing whole ready-batches per pass, sorted, is what makes the output deterministic across runs — exactly what a real team needs from a plan they intend to actually follow.',
      'checkpoints_passed treating required as a SUBSEQUENCE (not a strict prefix or exact match) mirrors reality: a real request trace has plenty of ordinary steps between the checkpoints that matter, and the audit should only care about their relative order.'
    ]
  },
  quiz: [
    {
      q: 'In the full request trace, the consent check runs before the director ever produces a plan because:',
      options: ['It is faster to check early', 'Capability should be gated before any generation planning happens — the earliest possible point matches the reject-before-repair asymmetry from the director lesson', 'The director cannot access the consent registry', 'Consent checks are cached during planning'],
      correct: 1,
      explain: 'Gate what is authorized before spending any effort planning what to do with it — the same ordering the director\'s policy gate uses internally, applied at the system\'s front door.'
    },
    {
      q: 'The recommended build order puts content-addressed caching and the job queue before the director or frontend because:',
      options: ['They are the easiest components to build', 'Nearly every other component\'s design assumes hashed, cached, dependency-ordered stages already exist beneath it, so building it last means retrofitting that assumption everywhere', 'Caching has no dependencies on other systems', 'It produces the most impressive demo first'],
      correct: 1,
      explain: 'Foundation layers that everything else assumes should be built first, even though they are the least demoable piece.'
    },
    {
      q: 'The minimum viable capstone slice implements only one model per stage but insists on the complete director-validate-execute-cache loop because:',
      options: ['Models are harder to build than the architecture', 'The architecture is the expensive-to-fix-if-wrong layer; model variety is labor-intensive but architecturally low-risk, so proving the loop narrow derisks the costly part first', 'One model per stage is a hard technical limit', 'The architecture cannot be tested with fewer models'],
      correct: 1,
      explain: 'Derisk what is expensive to discover wrong late; defer what is merely effortful to add later.'
    },
    {
      q: 'Under a scope cut, this lesson argues for cutting model variety before cutting any of the five recurring invariants because:',
      options: ['Invariants are harder to remove from the codebase', 'A missing model is visibly incomplete; a missing guardrail is invisible until the specific input that needed it arrives — a much more dangerous kind of gap', 'Model variety is not actually valuable to creators', 'Invariants take longer to implement than models'],
      correct: 1,
      explain: 'A narrow-but-safe system is a real foundation; a broad-but-unguarded one is a liability that happens to have a feature list.'
    },
    {
      q: 'The five recurring invariants (jurisdiction, caching, propose-not-execute, reject-vs-repair, scoped consent) appear in nearly every lesson because:',
      options: ['The course reuses content to save writing effort', 'The same category of mistake is available at every architectural layer, so the guardrail has to be re-asserted at every layer where it could otherwise be violated', 'There are only five possible patterns in software', 'They are unrelated coincidences'],
      correct: 1,
      explain: 'Seen once, it looks like a trick; seen five times solving five different concrete problems, it is architecture — the load-bearing walls, not decoration.'
    }
  ],
  pitfalls: [
    'Treating the capstone as "build every model integration this course covered" instead of "prove the full architectural loop, narrow." A team that spends its time on voice-engine variety before the director-validate-execute-cache loop is proven end-to-end has optimized the wrong axis — breadth is cheap to add later; a wrong architectural boundary is expensive to fix after three integrations were built against it.',
    'Deferring consent and provenance to "phase two" under deadline pressure, on the theory that they can be added once the core product works. This is the safety-consent-ethics lesson\'s pitfall recurring at project scale: retrofitting a gate into a system already shipping ungated media is strictly harder than building the gate into the first working slice, and "phase two" has a well-documented tendency to arrive after the incident that made it urgent, not before.',
    'Building the frontend or a polished demo before the backend loop is proven with curl or a script. A beautiful UI over a broken or unproven pipeline produces a convincing demo and a false sense of progress — the loop\'s correctness is completely independent of whether it has a UI yet, and proving it early is cheaper than discovering a boundary problem after the UI was built to assume it away.'
  ],
  interview: [
    {
      q: 'Walk through the complete architecture of DenDen Studio as if explaining it to a new engineer joining the project on day one.',
      a: 'Seven components with narrow contracts, one request flowing through all of them. A creator\'s upload and paragraph enter through the backend API, which validates and hashes the upload, then hands off to intake (a VLM plus a deterministic detector, strictly divided by the jurisdiction rule) and to the consent registry (a fresh, scoped, revocable check — never assumed from an earlier request). The director — a grounded, schema-constrained LLM — turns the paragraph into one complete plan document; a unified validator either repairs encoding mistakes or rejects policy violations outright, and the creator approves a cache-aware cost preview before anything expensive runs. The executor takes that approved plan VERBATIM and runs it on a job queue where every stage computes a content key from its real inputs and skips anything already cached. Progress streams back over SSE with real stage names; the frontend renders every panel from one shared plan object, optimistic on locally-verifiable edits and honest-and-waiting on anything it cannot verify itself. The finished artifact gets signed and watermarked before export, and every render — automatically, on every single one — gets scored by proxy metrics, with a sampled slice going to human review against a fixed rubric. The one sentence that ties it together: prose flows in one direction into a plan, and everything after the plan is deterministic — which is the property that makes every other guarantee in the system enforceable.'
    },
    {
      q: 'A new hire asks why so many parts of this system look similar — caching shows up in three places, validation shows up in two, a scoped-and-revocable check shows up in three more. Is this duplicated logic that should be refactored into one shared library?',
      a: 'Partially yes, mostly no, and the distinction matters. The IMPLEMENTATION of a hash function or a table lookup absolutely belongs in one shared utility — there is no reason to write content-hashing logic three times. But the PATTERN itself — "check freshness before trusting a cached fact," "reject policy violations before attempting repair," "gate on scope, not just existence" — is not duplicated logic, it is the same architectural DECISION independently applied at each layer because each layer faces its own version of the same risk: the API\'s idempotency table, the director\'s stage cache, and the consent registry are checking three DIFFERENT facts (a submission, a render output, an authorization) that happen to share a shape. Merging them into one "freshness checker" abstraction would either need to be so generic it loses the specific correctness properties each caller actually needs (the consent check\'s revocation semantics are not the idempotency table\'s TTL semantics, even though both are "check before trusting"), or it would become a leaky abstraction everyone works around. The right refactor target is shared UTILITIES (hashing, a generic key-value TTL store) with each CALLER keeping its own explicit policy — that gets the code-reuse win without smearing three distinct correctness guarantees into one component that understands none of them precisely.'
    },
    {
      q: 'If you had to demo a working prototype of this entire system in two weeks, what would you build, and what would you explicitly NOT build?',
      a: 'Build: the full loop, narrowest possible model surface — one hardcoded voice with a real (even if trivial) consent check, one TTS engine, one talking-head model on one reference-photo category, the complete director-validate-preview-execute chain with REAL content hashing (not stubbed — the caching behavior is exactly what needs to be proven), a job queue even if it is a single-process in-memory one rather than a distributed system, SSE progress even if crude, and sync-offset as the one proxy metric. This touches every architectural boundary in the map with a fraction of the model-integration labor. Explicitly not build: voice cloning\'s full validation pipeline (hardcode one pre-approved sample), the gesture library and diffusion-animation families (one talking-head path only), the frontend\'s optimistic-UI polish (a functional but unstyled panel is fine — it still proves the one-plan-one-source-of-truth model), horizontal scaling of the job queue (one worker, one machine), and the human-review UI for evaluation (log the proxy scores; a human reading a log is an acceptable stand-in for two weeks). The test for every cut: does removing this reduce which BOUNDARIES get proven, or only which MODELS get exercised? Cut model exercise freely; protect boundary proof at all costs, because the two-week demo\'s entire value is answering "does the plan-document architecture actually work," not "how many voices does it support."'
    },
    {
      q: 'Looking back across all twenty-two lessons, what is the single architectural decision that, if it had been made differently at the start, would have changed the most downstream?',
      a: 'The plan document as one shared schema crossing every component boundary — the director emits it, the validator checks it, the executor consumes it, the frontend edits it, the cache keys derive from it, and the evaluation harness\'s golden set is built from request-to-plan-to-output triples of it. If that decision had gone the other way — each component with its own internal representation, translated at each boundary — every subsequent lesson would have needed a translation layer instead of a shared contract: the frontend could not treat a drag as directly mutating the same object the executor runs, undo could not be "restore a snapshot" without knowing which representation to snapshot, the director\'s cost estimate and the API\'s idempotency key could not derive from the same canonical hash, and a power user editing plan JSON directly (a legitimate client this course notes explicitly) would need its own bespoke integration instead of just being another writer of the standard document. The plan-as-lingua-franca decision is why a five-model pipeline stayed one product instead of becoming five loosely-federated ones — nearly every "why" section across Parts 3 through 7 traces back to leaning on that one shared document existing, which is usually the sign of a foundational decision: not the flashiest thing built, but the thing everything else was quietly built on top of.'
    }
  ]
};
