window.LESSONS = window.LESSONS || {};
window.LESSONS['llm-as-director'] = {
  id: 'llm-as-director',
  title: 'The LLM as Director: One Description In, a Whole Pipeline Plan Out',
  category: 'Part 5 — Pipeline Engineering',
  timeMin: 40,
  summary: 'The course\'s central promise, assembled: the creator writes one paragraph, and the local LLM produces the COMPLETE generation plan — stages, voice, gestures, ambient motion, parameters — as one validated document that last lesson\'s executor runs. Nothing in this lesson is new machinery; it is the constrained-output schema grown to full size, the tool loop grounding the plan in project facts, every validator unified into one gate, and the beautiful economics of planning boldly while content-keyed caching pays only for what changed. Plus the boundaries that keep a director a director: it proposes, estimates, and revises — it never executes, never spends without showing the bill, and never decides consent.',
  goals: [
    'Compose the full plan schema: stages + voice selection + gesture timeline + ambient prompt + per-stage parameters, as one constrained document',
    'Ground the director with read-tools (probe uploads, list voices, project state) so plans cite facts instead of guessing them',
    'Run the plan lifecycle: draft → unified validation → repair loop → creator-facing preview with cost estimate → approval → execution',
    'Explain the plan-boldly-pay-marginally economics: the director emits complete plans; content-keyed caching makes unchanged stages free',
    'Bound replanning after failures: alternative plans with error context, no repeated attempts, and a hard cap — plus the list of what the director may never do'
  ],
  concept: [
    {
      h: 'The plan, full size: one document the whole product speaks',
      p: [
        'Every schema this course has built merges into one: <code>{voice: {id, mode}, stages: [...], gestures: [{gesture, t, amplitude, hand}], ambient: str|null, params: {tts: {...}, render: {resolution, fps}}, unmatched: [...]}</code>. The director — your pinned, temperature-0 local LLM — reads the creator\'s paragraph plus the grounding block and emits this document under a JSON schema whose enums are the REAL registries: stage names from the executor\'s contracts, gestures from the library, voices resolved against the consent registry, channels from the editable set. Constrained decoding makes off-registry references unpickable; the validator (next section) makes off-reality references un-executable. Same two-wall defense as always, now guarding the whole production.',
        'What makes the plan more than a request format: it is the product\'s <b>lingua franca</b>. The editing UI\'s state IS a plan being mutated (a dragged gesture edits <code>gestures[2].amplitude</code>); the executor consumes plans; the cache keys derive from plan content; a project\'s history is a sequence of plans, diffable like the edit list. One document type flowing through every subsystem is what keeps a five-model pipeline from becoming five products — and it is why the director can be swapped, upgraded, or bypassed entirely (a power user editing the plan JSON directly is a legitimate client) without anything downstream noticing.'
      ]
    },
    {
      h: 'Grounding: plans cite facts, or they are fiction',
      p: [
        'A director that guesses clip durations, invents voice ids, or assumes an upload\'s properties produces plans that fail validation at best and burn GPU at worst. So the director works like the edit session did: compact always-relevant state INLINE (project duration, enrolled voices with ids, the gesture enum, current plan if revising), and read-tools for what must be probed fresh — <code>probe_media(upload)</code> (the ffprobe wrapper: duration, sample rate, resolution), <code>get_intake_report()</code> (the multimodal lesson\'s verdict: subject type, orientation, obstructions), <code>estimate_stage(stage, params)</code> (predicted seconds and VRAM from the hardware lesson\'s tables — the bill the creator will see), <code>check_cache(stage_key_inputs)</code> (whether a stage would hit — letting the director TELL the creator "audio unchanged, reusing it").',
        'The loop runs with Part 1\'s full discipline: iteration cap, registry-checked calls, validated arguments, results appended as tool messages. A well-grounded director\'s behavior is visibly different in logs: it probes the upload BEFORE choosing the talking-head path (profile shot → it plans the warning the intake lesson designed), lists voices before assigning one (never inventing an id), and checks cache before estimating (the preview says "~40 seconds — voice and coefficients reused" instead of scaring the creator with the full-render number). Grounding is not politeness; it is the difference between a plan that describes THIS project and a plausible plan about an imaginary one.'
      ]
    },
    {
      h: 'The lifecycle: draft, validate, repair, preview, approve, execute',
      p: [
        'The draft plan hits the <b>unified validator</b> — every check this course has written, run as one gate: stage list sanity (Part 1\'s allowlist and ordering), gesture bounds (times within duration, amplitudes in range, library membership), voice authorization (the id exists AND the consent registry authorizes this creator — the one check that is a hard stop, never repaired), parameter ranges (resolution/fps against hardware limits), and cross-field coherence (gestures present → motion stage present; live mode → no ambient layer). Failures return as the named-value error strings the repair loop was built for; one or two round trips fix the fixable, and what remains goes to the creator as honest questions, not silent guesses.',
        'Then the step naive designs skip: the <b>preview</b>. Before anything runs, the creator sees the plan in plain language — "5 stages; her voice (cloned); wave at 0:02, lean-in at 0:08; gentle hair motion; ~40 seconds (audio and coefficients reused from last render)" — with the cost estimate from the grounding tools. Approval is a click; the approved plan goes to last lesson\'s executor VERBATIM — the director cannot slip work past the preview because the executor runs the previewed document, not a re-generation of it. This is the same receipts discipline as the edit session (echo what will be DONE, derived from the artifact), applied before the fact instead of after: for edits, act-then-echo fits because edits are cheap and revertible; for renders that cost minutes of GPU, preview-then-approve fits because the expensive thing has not happened yet. One principle, two tempos.'
      ]
    },
    {
      h: 'Plan boldly, pay marginally — and the lines a director never crosses',
      p: [
        'Here is the elegance the last two lessons were building toward: the director <b>always emits the complete plan</b> — every stage, every parameter — and never reasons about incremental execution, because it does not have to. The executor computes each stage\'s content key; unchanged inputs hit cache; the render costs only the delta. Creator tweaks one gesture → the director re-plans the whole document (cheap: one LLM call) → execution re-runs frames and mux only (the cascade lab, in production). This division keeps the probabilistic component out of the incremental-correctness business entirely: the LLM never gets to be clever about what to skip — the hashes decide, deterministically. A director that TRIED to plan increments would reintroduce every stale-cache bug class as hallucinations; a director that plans wholes cannot cause them.',
        'And the standing boundaries, now as a complete list. The director <b>proposes</b>: plans, estimates, revisions with error context ("frames failed twice with VRAM exhaustion → propose 540p, or the lighter renderer — creator chooses"). It never <b>executes</b>: no shell, no file paths (artifact NAMES only — the executor owns the filesystem), no direct model invocation. It never <b>spends silently</b>: plans above a cost threshold, and all replans, route through the preview. It never <b>decides consent</b>: voice authorization is the registry\'s verdict; a plan referencing an unauthorized voice is rejected, not repaired, and the director\'s only move is telling the creator why. Replanning after failures is bounded like every loop: error context in, alternative plan out, no plan-hash repeats (retrying the identical plan is the definition of hoping), hard cap at two alternatives before the failure goes to the human with the full trail. The director is the most capable component in the system and the least trusted — that combination is not a paradox; it is the design.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Iceburg\'s Desk: One Sentence In, a Work Order Out — and No Hammer in His Hand',
      text: 'A merchant walks into Galley-La with one sentence: "I want a ship that feels fast but homey — my family sails with me." Iceburg listens, and what happens next is why Dock One\'s president is Dock One\'s president. He does not guess. He sends a runner to measure the merchant\'s current ship (probe), consults the registry of the family\'s berth licenses (what they are authorized to operate), checks the yard\'s ledger for reusable stamped parts, and only THEN writes the work order — the complete document: hull spec, rigging choice, cabin fittings, every station\'s parameters, in the yard\'s own vocabulary. Stations he names exist; parts he cites carry real stamps; nothing is invented. The merchant never sees the order\'s internals — he sees Iceburg\'s summary sheet: "Schooner hull, family cabins, the fast rig. Six days, forty thousand — two days saved because your keel dimensions match a stamped hull we hold." Only on the merchant\'s signature does the order go to the dock — and it goes VERBATIM: the foreman executes the signed document, not Iceburg\'s recollection of it. Watching all this, Franky asks the question the apprentices whisper: why does the president — plainly the best shipwright in the building — never pick up a hammer? Iceburg\'s answer is the yard\'s constitution. "The day I hammer, my mistakes stop being paper. A wrong line in a work order costs a revision; a wrong cut costs a hull. I write COMPLETE orders — every station, every time, even when only the rigging changed — because the ledger\'s stamps decide what actually needs doing, and the ledger does not make my kind of mistakes." When the rigging station fails the same order twice — a mast timber flaw — Iceburg does not shout at the station or resubmit the same order hoping. He writes an ALTERNATIVE: the failure report attached, a different rig proposed, the price difference on a fresh summary sheet for the merchant\'s signature. Two alternatives is his own hard limit — "a third failure is not a planning problem; it is a conversation with the customer." And one line he will not write under any pressure: an order naming a berth license the registry has not granted. A wealthy client once offered triple for a warship rig his license did not cover. Iceburg\'s refusal took four words: "The registry says no." The order never existed; there was nothing to revise.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Joey\'s Movie: The First AD Who Turns "Dawn, Rain, Melancholy" Into a Call Sheet',
      text: 'Joey finally lands a real film, and comes home baffled by the person who actually runs the set: the First Assistant Director. "The DIRECTOR says something like \'I want dawn, rain, melancholy, like the whole city is hungover\' — and this woman, Dana, turns it into a CALL SHEET. Every department, every time, every truck." The gang extracts the details over pizza, and Ross starts taking actual notes. Dana never plans from vibes alone: before the sheet exists she has the location scout\'s report (measurements, power, sunrise time), the actors\' contract clearances from legal ("she will NOT schedule you for a stunt your contract does not cover, Joey — I asked, it was embarrassing"), and the production\'s asset ledger — sets already built, footage already shot. Then the sheet: complete, every department, every day — "even the departments whose work has not changed, because the ledger, not Dana\'s memory, decides who actually works; the sets that stand from Tuesday just... stand, and their crews stay home at no cost." Before ANYTHING shoots, the producer gets the summary page: scenes, schedule, the day\'s cost, and the savings line ("courthouse set standing — reusing, saving a build day"). The producer signs THAT page, and the set executes THAT page — "if it is not on the sheet, it does not shoot; Dana does not get to remember it differently at 6 AM." The day the rain rig fails twice, the gang gets the masterclass: Dana does not run the same sheet a third time hoping for different weather-machine physics. She writes an alternative — failure report attached, the scene moved under the bridge where the rig\'s smaller cousin works, cost delta on a fresh summary — and the producer signs or doesn\'t. "Two alternatives, then it goes to the humans," Joey quotes. "She says a third try is not scheduling; it is denial." What impressed Joey most, though, is what Dana never does: she has never touched a camera, moved a light, or called action. "She is the smartest person on that set," Joey says, "and she is not ALLOWED to touch anything. I asked her why. She said: \'The sheet can be wrong on paper, where it costs a revision. The moment I start touching things, my wrongness costs film.\'"'
    },
    why: 'Iceburg and Dana are the director pattern with every boundary drawn. Both ground before planning — the runner\'s measurements and the scout\'s report are probe_media, the berth registry and contract clearances are the consent check (and both stories make it the one unrevisable refusal: "the registry says no" is voice authorization as a hard stop), the ledger of stamped parts and standing sets is check_cache. Both emit COMPLETE documents every time, even for small changes, and both give the same reason the lesson gives: the ledger\'s stamps — not the planner\'s memory — decide what actually runs, so planning boldly costs paper while the cache pays marginally; the planner never gets to be clever about increments, which is exactly what keeps the planner\'s mistakes cheap. Both route through preview-then-approve (the summary sheet, the producer\'s page — with the savings line as the cache-aware estimate), and both execute the SIGNED document verbatim, never a recollection of it. Both bound replanning identically: alternative with the failure report attached, fresh approval, hard cap at two, then "a conversation with the customer." And both incarnate the closing principle — the most capable person in the building is the least trusted with the tools, BY DESIGN, because paper mistakes cost revisions while hammer mistakes cost hulls: the director proposes, the deterministic dock disposes.'
  },
  tech: [
    {
      q: 'Why must the director always emit the COMPLETE plan rather than planning deltas ("just re-run frames and mux"), when it seems wasteful?',
      a: 'Because incremental correctness is exactly the job you never give a probabilistic component. For the LLM to plan deltas safely it would need to reason perfectly about the dependency graph — which stages consume which artifacts, transitively — and any error ships as a stale-output bug: "just re-run mux" when the gesture change actually altered coefficients produces a render silently missing the creator\'s edit, the least-debuggable failure class in the product, now generated by hallucination. The executor already solves incrementalism deterministically: content keys make unchanged stages free, so the complete plan COSTS the same as the perfect delta plan — the only waste is a few hundred tokens of plan text. Emitting wholes also keeps the plan document self-contained (any plan can render from scratch — no plan depends on which plan preceded it), which is what makes plans cacheable, diffable, shareable across sessions, and executable after the previous render\'s artifacts were garbage-collected. The division of labor is the course\'s oldest principle at its largest scale: the LLM translates intent into a declarative document; deterministic machinery decides everything about execution — including, crucially, what execution can be skipped.'
    },
    {
      q: 'The unified validator treats an unauthorized voice differently from an out-of-range timestamp — rejection versus repair. Why the asymmetry, and where else does it apply?',
      a: 'Repair is for errors the MODEL made and the model can fix: a keyframe at t=41 in a 30-second clip is a planning mistake — feed the named violation back and the model moves the keyframe; the creator\'s intent is preserved, only its encoding was wrong. Rejection is for constraints that no valid encoding can satisfy: an unauthorized voice is not a mis-planned detail — the creator asked for something the consent registry forbids, and "repairing" it (silently substituting an authorized voice, or worse, finding a way around the check) would either misrepresent the creator\'s intent or defeat the product\'s most important gate. The rule generalizes: repair encoding errors, surface policy violations. Other rejection-class checks: resolution/duration beyond hardware or plan limits when the creator explicitly requested them (the answer is a conversation about the limit, not a silent downgrade — though offering the downgrade AS the question is good UX), content-policy triggers in scripts (Part 6 territory — flagged to the human path, never quietly rewritten), and cost-threshold breaches (the plan is fine; it just needs a human yes). The implementation detail that keeps the asymmetry honest: rejection-class failures must short-circuit BEFORE the repair loop runs, or a creative model will occasionally find technically-valid encodings that route around policy — validators check policy first, syntax second, and the repair loop only ever sees the second kind.'
    },
    {
      q: 'Design the replan-after-failure protocol precisely: what context does the director get, what may it change, and why ban repeated plan hashes?',
      a: 'Context in: the failed stage\'s name, the error class (VRAM exhaustion, model crash, timeout — from the worker\'s structured failure record), the manifest state (which artifacts exist and are good — so the director knows the failure\'s blast radius), and the full attempt history (plans tried, hashed; failures hit). What it may change: anything within the plan schema that plausibly addresses the error class — resolution or fps down for VRAM exhaustion, the lighter renderer variant, chunked rendering parameters, a different (still-authorized) model choice per the stage\'s alternatives registry. What it may not: anything policy-gated (voice, consent, cost above threshold without re-approval — every replan routes through preview), and anything outside the schema (no new stage types, no execution hints — the executor\'s behavior is not the plan\'s business). The plan-hash ban: hash each attempted plan (canonicalized — the same discipline as stage keys) and reject any replan whose hash matches an attempt; without this, the most common failure mode of LLM replanning is emitting the same plan with cosmetic wording differences — "trying again" dressed as revision — which burns a full render to learn nothing. Retrying an IDENTICAL plan is occasionally legitimate (transient CUDA errors exist) but that is the EXECUTOR\'s retry policy at stage granularity (cheap, bounded, no LLM involved), not the director\'s. Hard cap: two alternative plans, then the failure goes to the creator with the whole trail — attempt list, errors, the director\'s last diagnosis — because three strikes means the problem is not one a planner can see: bad upload, genuine hardware ceiling, or a bug, all of which are human conversations. The cap is also the cost bound: replans are the one path where the system can spend GPU without fresh human intent, so it is the most tightly budgeted loop in the product.'
    }
  ],
  code: {
    title: 'The director assembled: grounding, plan, gate, preview, execute',
    intro: 'Every mechanism from Parts 1-5 in one flow. Nothing here is new — that is the point. The estimate and replan policies are the lab.',
    code: `DIRECTOR_TOOLS = [
  tool('probe_media', {'artifact': {'enum': ['upload_audio', 'upload_image']}},
       'READ: duration, sample rate, resolution of an uploaded artifact.'),
  tool('get_intake_report', {},
       'READ: the vision intake verdict for the current image.'),
  tool('list_voices', {},
       'READ: voices this creator is authorized to use (id, name, mode).'),
  tool('check_cache', {'stage': {'enum': STAGE_NAMES}},
       'READ: whether this stage would hit cache given current inputs.'),
  tool('estimate_stage', {'stage': {'enum': STAGE_NAMES}, 'params': {}},
       'READ: predicted seconds and peak VRAM for a stage configuration.'),
]

PLAN_SCHEMA = {  # every registry, one document (abridged)
  'type': 'object',
  'properties': {
    'voice':    {'properties': {'id': {'type': 'string'},
                                'mode': {'enum': ['tts', 'vc']}}},
    'stages':   {'items': {'enum': STAGE_NAMES}},
    'gestures': {'items': GESTURE_ITEM_SCHEMA},      # Part 3's, verbatim
    'ambient':  {'type': ['string', 'null']},
    'params':   {'properties': {'render': {'properties':
                   {'resolution': {'enum': [540, 720, 1080]},
                    'fps': {'enum': [25]}}}}},
    'unmatched': {'items': {'type': 'string'}},      # the honesty channel
  },
  'required': ['voice', 'stages', 'gestures', 'ambient', 'params', 'unmatched'],
}

def direct(request_text, project):
    session = ChatSession(DIRECTOR_SYSTEM + grounding_block(project))
    session.add_user(request_text)
    plan = tool_loop(session, DIRECTOR_TOOLS,       # Part 1's loop: capped,
                     format=PLAN_SCHEMA)            # registry-checked

    policy = policy_gate(plan, project)             # consent, cost, content:
    if policy.rejected:                             # REJECTED, never repaired
        return creator_message(policy.reasons)
    errors = unified_validator(plan, project)       # every check, one gate
    if errors:
        plan = repair_loop(session, plan, errors)   # named values, 2 rounds

    est = execution_estimate(plan_stages(plan),     # the bill, cache-aware
                             cache, EST_MS)         #   (lab)
    approval = preview_to_creator(plan, est)        # plain words + numbers
    if not approval:
        return None
    return enqueue_job(plan)                        # the APPROVED document,
                                                    #   verbatim, to L15's
                                                    #   worker - hashes decide
                                                    #   what actually runs

def on_job_failure(job, attempts):
    if not should_replan(attempts, max_attempts=3): # no repeats, hard cap
        return escalate_to_creator(job, attempts)   #   (lab)
    alt = direct_with_failure_context(job, attempts)
    return alt  # -> policy gate -> validator -> PREVIEW again -> execute`,
    notes: [
      'policy_gate running BEFORE the repair loop is the asymmetry made structural: policy violations short-circuit to the creator; the repair loop only ever sees encoding errors it is allowed to fix.',
      'enqueue_job(plan) shipping the approved document verbatim — not a re-generation — is the signed-summary-sheet rule: the executor runs what the creator saw, and the director cannot slip work past the preview.'
    ]
  },
  lab: {
    title: 'The bill and the bound: cache-aware estimates and the replan policy',
    prompt: 'Two policy functions. (1) <code>execution_estimate(stages, cache, est_ms)</code>: <code>stages</code> is an ordered list of <code>{"name", "key"}</code>; a stage hits if its <code>key</code> is in <code>cache</code> (a set). <code>est_ms</code> maps stage name → predicted milliseconds. Return <code>{"run": [names], "cached": [names], "eta_ms": sum of est_ms for run stages only}</code>. (2) <code>should_replan(attempts, new_plan_hash, max_attempts)</code>: <code>attempts</code> is the list of prior attempts <code>{"plan_hash", "failed_stage"}</code>. Return <code>False</code> if <code>new_plan_hash</code> equals ANY prior attempt\'s hash (no repeats — retrying identical plans is hoping, not revising), or if <code>len(attempts) >= max_attempts</code> (the hard cap — after that it is a conversation with the human). Otherwise <code>True</code>.',
    starter: `def execution_estimate(stages, cache, est_ms):
    # hit if stage['key'] in cache; eta counts ONLY stages that run
    pass

def should_replan(attempts, new_plan_hash, max_attempts):
    # False on any repeated plan hash, False at/after the cap
    pass`,
    checks: [
      { re: 'def\\s+execution_estimate\\s*\\(', flags: '', must: true, hint: 'Define execution_estimate(stages, cache, est_ms).', pass: 'execution_estimate defined ✓' },
      { re: 'def\\s+should_replan\\s*\\(', flags: '', must: true, hint: 'Define should_replan(attempts, new_plan_hash, max_attempts).', pass: 'should_replan defined ✓' },
      { re: 'eta_ms', flags: '', must: true, hint: 'The estimate reports eta_ms summed over stages that will actually run.', pass: 'eta computed ✓' },
      { re: 'plan_hash', flags: '', must: true, hint: 'Repeated plan hashes must be refused — revision, not repetition.', pass: 'repeat detection ✓' }
    ],
    tests: `stages = [{'name': 'tts', 'key': 'k1'}, {'name': 'coeffs', 'key': 'k2'},
          {'name': 'frames', 'key': 'k3'}, {'name': 'mux', 'key': 'k4'}]
est = {'tts': 8000, 'coeffs': 15000, 'frames': 90000, 'mux': 3000}

r = execution_estimate(stages, {'k1', 'k2'}, est)
assert r['cached'] == ['tts', 'coeffs'] and r['run'] == ['frames', 'mux']
assert r['eta_ms'] == 93000, 'the bill counts only what runs'

r2 = execution_estimate(stages, set(), est)
assert r2['eta_ms'] == 116000 and r2['cached'] == []
r3 = execution_estimate(stages, {'k1', 'k2', 'k3', 'k4'}, est)
assert r3['eta_ms'] == 0 and r3['run'] == [], 'full cache: free re-render'

hist = [{'plan_hash': 'pA', 'failed_stage': 'frames'},
        {'plan_hash': 'pB', 'failed_stage': 'frames'}]
assert should_replan(hist, 'pC', 3) is True, 'novel plan, under cap: go'
assert should_replan(hist, 'pA', 3) is False, \
    'identical plan again is hoping, not revising'
assert should_replan(hist, 'pC', 2) is False, 'at the cap: humans now'
assert should_replan([], 'pA', 3) is True, 'first attempt always allowed'
print('estimate and replan policy correct')`,
    solution: `def execution_estimate(stages, cache, est_ms):
    run, cached = [], []
    for st in stages:
        (cached if st['key'] in cache else run).append(st['name'])
    return {'run': run, 'cached': cached,
            'eta_ms': sum(est_ms[name] for name in run)}

def should_replan(attempts, new_plan_hash, max_attempts):
    if len(attempts) >= max_attempts:
        return False
    if any(a['plan_hash'] == new_plan_hash for a in attempts):
        return False
    return True`,
    notes: [
      'execution_estimate is the "savings line" on Iceburg\'s summary sheet: the preview tells the creator what is reused, which builds exactly the trust that makes preview-then-approve feel like collaboration instead of bureaucracy.',
      'should_replan is deliberately the dumbest possible code — a length check and a membership test — because the loop it bounds is the one place the system can spend GPU without fresh human intent. Policies that bound spending should be too simple to have bugs.'
    ]
  },
  quiz: [
    {
      q: 'The director emits a COMPLETE plan even when the creator changed one gesture because:',
      options: ['Partial plans are not valid JSON', 'Content-keyed execution makes unchanged stages free anyway, and delta-planning would hand incremental correctness — a deterministic job — to a probabilistic component, reintroducing stale-output bugs as hallucinations', 'The schema requires all fields', 'Replanning is cheaper than diffing'],
      correct: 1,
      explain: 'Plan boldly, pay marginally: the hashes decide what runs. The LLM never gets to be clever about skipping work — that is exactly the job it would eventually get wrong.'
    },
    {
      q: 'An unauthorized voice in a draft plan is REJECTED (surfaced to the creator) while an out-of-range keyframe is REPAIRED because:',
      options: ['Voices are harder to fix', 'Repair is for encoding errors the model made and can fix; policy violations have no valid encoding — "repairing" consent would misrepresent intent or defeat the product\'s most important gate', 'The validator runs out of attempts', 'Timestamps are lower stakes'],
      correct: 1,
      explain: 'Repair encoding, surface policy — and check policy FIRST, so the repair loop never sees a violation it might creatively route around.'
    },
    {
      q: 'The approved plan goes to the executor VERBATIM (not re-generated) because:',
      options: ['Regeneration is slow', 'The executor must run the document the creator saw and approved — otherwise the director could (through ordinary nondeterminism, never mind intent) slip differences past the preview', 'Plans cannot be serialized twice', 'The executor caches plan objects'],
      correct: 1,
      explain: 'The producer signs the page; the set shoots the page. Preview-then-approve is only a guarantee if the approved artifact is the executed artifact.'
    },
    {
      q: 'The replan protocol bans repeated plan hashes because:',
      options: ['Hashes are expensive to compare', 'An LLM\'s most common replanning failure is the same plan with cosmetic rewording — "trying again" dressed as revision — which burns a render to learn nothing; genuine transient-error retries belong to the executor at stage granularity', 'Plans must be unique in the database', 'It prevents cache collisions'],
      correct: 1,
      explain: 'Revision, not repetition: the hash check is a two-line policy bounding the one loop that can spend GPU without fresh human intent.'
    },
    {
      q: '"The most capable component and the least trusted" describes the director because:',
      options: ['Local LLMs are unreliable', 'Its intelligence is applied entirely to producing PAPER — declarative, validated, previewed documents — while everything that touches files, models, and money is deterministic; paper mistakes cost revisions, hammer mistakes cost hulls', 'It runs at temperature 0', 'It has the fewest tools'],
      correct: 1,
      explain: 'Iceburg never hammers; Dana never touches a camera. The design puts maximum capability behind minimum authority — proposal power, zero execution power.'
    }
  ],
  pitfalls: [
    'Letting the director\'s plan drift from the executor\'s reality — stage names, parameter enums, or gesture libraries updated in one place but not the schema. The constrained decoder will faithfully emit yesterday\'s vocabulary and every plan fails validation mysteriously. Registries are imported into the schema from the SAME source the executor reads, never copied.',
    'Skipping the preview for "small" renders because it adds a click. The preview is where cost surprises die, where cache savings build trust, and where the verbatim-execution guarantee is anchored — and "small" is a prediction the estimate exists to make, not a vibe. Auto-approve below a threshold if you must, but the threshold reads the estimate, and the plan still logs as previewed-by-policy.',
    'Giving the director execution conveniences "temporarily" — a run_stage tool for debugging, a file path in a prompt. Every boundary in this lesson is load-bearing precisely when something goes wrong (confused model, prompt injection through a script, a failure loop) — and boundaries removed for convenience are never re-added until the incident review that proves they were the product\'s actual safety story.'
  ],
  interview: [
    {
      q: 'Explain the architecture where an LLM "directs" a media pipeline. What does it control, what can it never do, and why does the split work?',
      a: 'The LLM owns exactly one transformation: creator intent (a paragraph, plus conversation) into a complete, declarative generation plan — stages, voice, gesture timeline, ambient prompt, parameters — emitted under a JSON schema whose enums are the live registries (stage contracts, gesture library, authorized voices), so off-registry references are unpickable at decode time. It grounds the plan through read-only tools (probe uploads, intake verdicts, cache checks, cost estimates) in a capped tool loop, so plans cite facts rather than guessing them. Everything after the plan is deterministic: a policy gate (consent, cost, content — violations rejected to the human, never repaired), a unified validator with a bounded repair loop for encoding errors, a creator-facing preview with a cache-aware cost estimate, and — on approval — verbatim handoff to a content-keyed executor where hashes, not the model, decide what actually runs. What it can never do: execute anything (no shell, no paths, no model invocation), spend silently (previews gate cost), decide consent (registry verdicts are final), or plan increments (it always emits wholes; caching makes unchanged stages free, keeping incremental correctness deterministic). Why the split works: it assigns each side its native strength — unbounded language understanding to the probabilistic component, correctness and money to deterministic code — and it prices mistakes asymmetrically: a wrong plan costs a validation round or a revision on paper; nothing the director can output costs a hull. Maximum capability, minimum authority, by construction.'
    },
    {
      q: 'A teammate argues the plan/preview/approve flow is over-engineered for a single-user local app — "just run what the model says." Where do you concede and where do you hold?',
      a: 'Concede the ceremony\'s WEIGHT, not its existence. For a single local user, I would auto-approve plans below a cost threshold (the estimate — which we compute anyway — reads a config value; sub-minute cache-heavy re-renders just run), collapse the preview into a dismissible toast for those cases, and tune the repair loop to be silent when it succeeds. That keeps iteration friction near zero, which is the legitimate core of the objection. Hold, immovably, on four things. The schema-constrained plan itself: it is not bureaucracy, it is the interface — the editing UI, the cache keys, and the executor all speak it; removing it does not simplify the system, it fragments it. The policy gate: consent checking on voices is exactly as necessary at n=1 (the user can still point the tool at someone else\'s voice), and content/cost gates are two if-statements. Verbatim execution of validated plans: "run what the model says" without validation means the first hallucinated parameter burns GPU-minutes or produces the silent stale-output class — and debugging those costs more than the entire gate infrastructure. And bounded replanning: the failure loop is where an unattended system can spend an afternoon of GPU re-trying a doomed plan; the hash-ban and cap are five lines. The framing I would offer: the flow\'s EXPENSIVE parts (estimates, validation, caching) all serve the happy path too — faster re-renders, honest progress, trustable receipts — so what looks like safety over-engineering is mostly the product\'s performance and trust architecture wearing a safety hat.'
    },
    {
      q: 'How do you evaluate whether the director is any good — and how do you keep it good across model upgrades?',
      a: 'Define "good" as three measurable layers and build the harness before you need it. Validity: fraction of plans passing the unified validator on first emission (repair-loop rounds as the soft metric) — should be very high with constrained decoding; regressions here mean schema/prompt drift. Fidelity: does the plan encode the request? Built from a golden set of real request paragraphs (accumulated from actual usage, anonymized) with expected-plan properties expressed as assertions — not byte-equality but semantic checks: "mentions waving twice → two wave gestures, first before t=3", "asks for her cloned voice → voice.mode=tts, correct id", "no motion requested → no motion stage". This is the tool-sequence golden-set pattern from Part 1, at plan scale. Judgment: the fuzzy layer — gesture placement quality, sensible amplitudes, good ambient prompts — sampled and human-reviewed periodically, plus regression-diffed: same golden request, old model vs new model, diff the plans and human-review only the diffs (plans being canonical documents makes this cheap — it is why plan-as-lingua-franca pays again here). Across upgrades: pin the model (full tag, the lockfile discipline), treat upgrades as releases — full golden run, diff review, canary period where the old model\'s plans are logged shadow-mode for comparison — and keep the calibration policies (magnitude words, defaults) in the system prompt under version control so prompt and model version updates are separately attributable. The meta-point: because the director\'s entire output surface is one schema\'d document, evaluation is tractable in a way "evaluate the chatbot" never is — which is itself an argument for the architecture.'
    },
    {
      q: 'The director occasionally produces plans that validate perfectly but encode the request badly — a wave scheduled during the speech\'s most important sentence, ambient motion that fights the mood. Where does "taste" live in this architecture?',
      a: 'First, name what is happening: these are fidelity and judgment failures INSIDE the valid-plan space — the validator polices possibility, not quality, and no schema expresses "do not gesture over the thesis sentence." Three places to install taste, in order of leverage. Grounding enrichment: most "bad taste" is missing information — the director schedules a wave blindly because it cannot see emphasis; feed it the script\'s structure (the Whisper lesson\'s timeline gives sentence boundaries and, via audio energy, emphasis peaks) and the system prompt can carry real placement heuristics ("schedule gestures at clause boundaries, never inside the highest-energy sentence"), turning vibes into checkable-ish rules. Policy-as-validation where taste hardens: some judgments are consistent enough to promote into soft validators — warnings, not rejections: "gesture overlaps peak-emphasis span", "ambient prompt sentiment conflicts with script sentiment (VLM-scored)" — surfaced in the preview as advisories the creator can accept or fix, which keeps the human the tastemaker while the system flags candidates. And the feedback loop: the edit session is a taste-labeling machine nobody has to run — when creators consistently move the director\'s waves later or shrink its amplitudes, those provenance-tagged corrections are training signal (for the prompt heuristics immediately; for fine-tuning eventually), and mining them is reading a log you already keep. What I would NOT do: chase taste with model scale first (a bigger director guesses better but the ceiling is still information it does not have), or let the system auto-apply learned preferences silently (creators must see defaults change, or authorship erodes — the same principle as the no-unsolicited-edits rule). Taste, architecturally, is: give the planner the evidence taste needs, promote stable judgments into advisory validation, and harvest the human\'s corrections — while the human stays the court of final appeal.'
    }
  ]
};
