window.LESSONS = window.LESSONS || {};
window.LESSONS['creator-frontend'] = {
  id: 'creator-frontend',
  title: 'The Creator Frontend: Upload, Preview, Edit — Without Fighting the User',
  category: 'Part 6 — Shipping It',
  timeMin: 35,
  summary: 'The backend now accepts uploads, plans renders, and streams progress. This lesson is the last mile: the screen a creator actually looks at. Not a component-library tour — a set of UI-state decisions that either make the pipeline underneath feel invisible or make every mechanism from Parts 1-6 leak through as confusion. Optimistic UI for edits that might still fail validation, a single source of truth so the timeline and the preview never disagree, loading states that tell the truth about what stage is running, and the discipline of disabling exactly one thing at a time instead of locking the whole screen every time a request is in flight.',
  goals: [
    'Design the frontend around one source of truth — the plan document — so every view (timeline, preview, cost estimate) renders from the same state instead of drifting out of sync',
    'Apply optimistic UI correctly: update the screen immediately on a drag or edit, then reconcile with the server\'s validated response instead of waiting on a round trip for every gesture',
    'Build loading and progress states that report the ACTUAL pipeline stage from the SSE stream, not a generic spinner that hides what is really happening',
    'Scope disabled/locked UI narrowly — block the one control whose precondition is not met, never freeze the whole screen for an unrelated in-flight request',
    'Recognize the three trust-building UI moments this course\'s backend was built to support: the upload verdict, the pre-render preview, and the post-edit echo'
  ],
  concept: [
    {
      h: 'One source of truth: the plan is the state, the screen is a view of it',
      p: [
        'The single biggest source of frontend bugs in an editor this shaped is two views of the same fact drifting apart — the timeline says a gesture is at t=3.2, the preview renders it at t=3.0, because each view kept its own copy and only one got updated. The fix, already implied by everything built so far: the frontend holds exactly ONE plan object in memory (the same document the director emits and the executor consumes), and every visible thing — the timeline\'s clip blocks, the preview canvas, the cost estimate, the gesture list — is a pure render of slices of that one object. A drag handler does not "move the clip on screen"; it mutates <code>plan.stages[i].start</code> and every view subscribed to that path re-renders. This is the same discipline as the pipeline\'s content-addressed caching and the director\'s single-document design, one more layer up: one canonical state, many disposable views of it.',
        'It also makes undo trivial and safe: since every edit is a mutation of one plan object, undo is "restore the previous plan snapshot," not "reverse this specific UI action and hope every dependent view noticed." The edit-list architecture from the direct-manipulation lesson already stores edits as an ordered, toggleable log for exactly this reason — the frontend\'s job is to keep pointing every view at the SAME current plan, never to let one panel get ahead of another.'
      ]
    },
    {
      h: 'Optimistic UI: move first, reconcile after — but know which edits earn that trust',
      p: [
        'A creator drags a gesture\'s timing and expects the block to move under their cursor at 60fps — waiting for a server round trip on every pixel of drag would feel broken regardless of how fast the backend is. So local, in-bounds edits (drag position, amplitude slider, delete) apply to the in-memory plan IMMEDIATELY and render instantly; the change is queued for a debounced sync to the backend (not on every pixel — on drag-release, matching the direct-manipulation lesson\'s one-commit-per-release rule) which runs it through the SAME unified validator the director\'s output goes through. If validation fails (a constraint the UI did not enforce locally — cross-field coherence, say), the screen reconciles: the plan snaps back to the last server-confirmed state and the creator sees why, not a silent revert.',
        'Not every edit deserves this optimism. A drag stays entirely local because its failure modes are boring and rare (bounds checks the UI already enforces). Submitting a natural-language edit request, or approving a render plan, is NOT optimistic — those go through the full request/response (or the director\'s preview) because their outcomes are uncertain enough that showing a guess and correcting it later would be worse than a brief, honest wait. The rule: optimistic for edits whose validation the UI can mostly replicate locally; pessimistic (wait, then show) for anything whose validity depends on server-side facts the UI cannot see. Getting this backwards — optimistic on the natural-language edit, pessimistic on the drag — produces exactly the sluggish, second-guessing interface creators complain about.'
      ]
    },
    {
      h: 'Loading states that tell the truth: render the SSE stage, not a spinner',
      p: [
        'The backend lesson built a progress stream carrying real stage names and percentages specifically so the frontend never has to show a generic spinner during a two-minute render. A spinner communicates "something is happening" and nothing else; a progress state built from the SAME events (<code>{"stage": "frames", "pct": 62, "eta_ms": 8000}</code>) can say "rendering frames — 62%, about 8 seconds left" — and when a stage is a cache hit, it can say so ("voice and coefficients reused — this will be fast"), which is the trust-building "savings line" the director lesson designed the preview around, now paying off a second time in the progress UI. This only works because the frontend subscribes to the SAME event stream the backend was built to deliver — it is not a separate progress-estimation heuristic living in the UI, guessing independently.',
        'The other loading-state discipline: distinguish "waiting for the network" from "waiting for the GPU" from "queued behind other jobs." A creator staring at "queued — 2 jobs ahead of you" understands their situation and can walk away; a creator staring at an undifferentiated spinner for the same two minutes assumes something is broken and reloads the page — which, if the frontend is not built on the SSE reconnect discipline from the backend lesson, can actually lose their place in the stream. The honest progress state is not politeness, it is what keeps a creator from fighting the tool during the exact moments the tool is working hardest.'
      ]
    },
    {
      h: 'Locking scoped narrowly: disable the one control, never the whole screen',
      p: [
        'The laziest way to handle an in-flight request is a full-screen loading overlay that blocks every interaction until it resolves. It is also the most damaging to a creator\'s sense of control: if adjusting a gesture\'s amplitude triggers a debounced sync, the correct scope of "disabled" is that one slider\'s immediate visual feedback (maybe a subtle pending indicator on it) — not the timeline, not the preview, not the unrelated voice-selection panel three tabs over. Locking should be scoped to the smallest control whose precondition is genuinely unmet: the "Approve & Render" button disables while a plan is invalid or a preview is loading (its precondition), but the gesture timeline underneath stays fully editable, because editing gestures has no dependency on the render button\'s state.',
        'This scoping discipline is what makes a complex multi-panel editor feel responsive even when parts of it are legitimately busy — a creator adjusting voice settings while a previous render\'s progress stream is still running in a corner widget should never notice the two are related, because architecturally they are not. The plan document\'s field-level granularity (the same structure the optimistic-UI section relies on) is what makes this possible: lock state can live at the same granularity as the fields it protects, instead of the coarse "the app is busy" boolean that a full-screen spinner implies.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Usopp\'s Workshop Table: One Sketch, Every Tool Pointed at the Same Line',
      text: 'Usopp\'s workshop has three stations that all need to agree on one design at once: the sketch pinned to the board, the half-built prop on the workbench, and Franky\'s materials ledger tracking what the build will cost. Early on, Usopp made the rookie mistake of letting each station keep its own notion of the design — he\'d adjust a measurement on the sketch, forget to update the workbench mock-up, and by the time Franky priced materials against the STALE mock-up, the whole afternoon\'s work disagreed with itself. Robin fixes it with one rule: there is exactly one master sketch, pinned centrally, and every station is a WINDOW onto it, never a copy. When Usopp drags a measurement line on the sketch, the workbench mock-up updates its shape immediately, right under his hand, because he is trusted to eyeball a length correctly — that adjustment does not wait on anyone\'s approval. But when he calls out an entirely new, untested mechanism ("what if it launches TWO things at once?"), the crew does not build it on a hunch — Franky checks it against what the ship\'s materials can actually support before a single plank is cut, because that kind of change can fail in ways Usopp\'s eyeball cannot catch. During a long, complicated brew-and-cure step Franky insists on watching, Usopp does not just sit there — the workshop board shows exactly what phase it is in ("curing — eleven minutes left, this batch reuses last week\'s resin mix so it\'s faster than usual") instead of a vague "working" sign, so nobody panics or interrupts. And crucially, while that cure is running, Usopp keeps sketching the NEXT prop entirely unbothered — nothing about one station being busy locks the other two.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'The Whiteboard, the Prototype, and the Grant Ledger — One System, Three Windows',
      text: 'Sheldon, Leonard, and Howard are building a physics demo rig for a grant review, and early attempts fail the same way every time: Sheldon updates a spec on the whiteboard, forgets to tell Howard, and Howard\'s prototype and the whiteboard disagree by the time the grant reviewer visits — three sources of truth, silently diverging. Amy, watching this happen twice, imposes a rule from her own lab\'s discipline: ONE master spec document, and the whiteboard, the physical prototype, and the budget ledger are all just views of it — nobody edits their own copy again. When Howard nudges a component\'s position on the prototype, the master spec updates immediately and the whiteboard reflects it before he even lets go — that\'s a small, locally-verifiable change, no committee needed. But when Sheldon wants to swap the entire measurement approach for something untested, Amy makes him check it against the grant\'s actual budget and timeline constraints FIRST, because that change can fail in ways a whiteboard sketch cannot reveal, and guessing would waste real grant money. During a long calibration run that has to sit untouched for twenty minutes, the lab\'s status board says exactly that — "calibrating, eighteen minutes, reusing yesterday\'s baseline so it\'s faster" — instead of Sheldon simply glaring at people who ask "is it done yet." And the whole time calibration runs, Leonard keeps drafting the NEXT section of the grant proposal completely unblocked, because the calibration run and the proposal draft were never actually coupled — only Sheldon\'s old habit of treating the whole lab as "busy" made it feel that way.'
    },
    why: 'Both workshops arrive at the same three frontend rules the hard way. One master sketch/spec with every station as a window onto it, never a copy, is the single-source-of-truth plan document — the bug it prevents (three views silently disagreeing) is exactly the timeline-versus-preview drift the concept section opens with. Usopp\'s hand trusted on a measurement, but Franky\'s check required for an untested new mechanism, is the optimistic-versus-pessimistic split: apply locally-verifiable edits instantly, gate uncertain ones on a real check. The board that names the actual phase and time remaining, and calls out when a step is reusing prior work to go faster, is the honest progress state built from real pipeline events instead of a spinner. And both scenes end on the same detail on purpose: work continuing unblocked elsewhere while one station is legitimately busy is locking scoped to the one true precondition, never the whole room.'
    },
  tech: [
    {
      q: 'Why must undo be "restore the previous plan snapshot" rather than "reverse this specific UI action"?',
      a: 'Because reversing a specific action requires the undo system to understand every action type\'s inverse — dragging a gesture, deleting a clip, toggling an edit, and adjusting a slider each need bespoke reverse logic, and any action added later needs a matching reverse implementation or undo silently breaks for it. Snapshot-based undo needs none of that: since every view already renders from one plan object, keeping a short history of that object\'s prior states makes undo "point every view at an earlier snapshot," which works identically for every edit type, including ones added after the undo system was written. It also composes correctly with the debounced server sync — undoing before a sync fires simply never sends the undone edit, and undoing after reconciles the same way a rejected edit does, restoring a known-good snapshot rather than computing a delta\'s inverse.'
    },
    {
      q: 'A creator drags a gesture and the local, optimistic move is later rejected by the server-side validator. What should the UI actually do, and why is a silent revert wrong?',
      a: 'The plan snaps back to the last server-confirmed value (the reconciliation the optimistic-UI section describes), but silently — with no explanation — the creator just watched their edit get undone by an invisible hand, which reads as the app being broken or laggy, not as the app protecting them. The correct behavior surfaces WHY, using the same named-value error discipline as the director\'s repair loop: "gesture time must stay within the clip\'s duration (0-8.2s)" attached to the snapped-back control, not a generic toast. This turns a rejection into the same kind of legible feedback the backend\'s error envelope was designed to carry end to end — the retryable/non-retryable distinction and the specific reason travel all the way from the unified validator to the exact control the creator was touching, instead of dying at the network boundary as an unexplained bounce.'
    },
    {
      q: 'Why should the frontend subscribe directly to the backend\'s SSE progress events rather than computing its own progress estimate from a timer?',
      a: 'A timer-based estimate ("assume renders take 90 seconds, animate a bar accordingly") is guessing at exactly the numbers the backend already knows precisely — cache hits, per-stage predicted duration from the hardware lesson\'s estimator, actual elapsed time — and it WILL disagree with reality on cache-heavy or unusually slow renders, which is worse than no progress bar at all because a progress bar that lies erodes trust faster than an honest "queued" label. Subscribing to the real event stream also means the frontend\'s progress UI automatically improves every time the backend\'s estimation gets better (a smarter estimator, a faster cache-hit detection) with zero frontend changes, because the UI is a pure view of numbers the backend computes — the same one-source-of-truth discipline as the plan document, applied to progress instead of edit state.'
    }
  ],
  code: {
    title: 'One plan, many views: the render loop a frontend actually needs',
    intro: 'The point is what is NOT here — no per-panel state, no separate progress estimator. Every view is a slice of one object.',
    code: `class EditorState:
    def __init__(self, initial_plan):
        self.plan = initial_plan          # THE single source of truth
        self.confirmed_plan = initial_plan  # last server-validated snapshot
        self.history = [initial_plan]       # snapshots, for undo
        self.locks = set()                  # names of controls awaiting a
                                            #   precondition, nothing more

    def apply_local_edit(self, path, value):
        self.plan = set_path(self.plan, path, value)   # instant, in-memory
        self.history.append(self.plan)
        render_all_views(self.plan)                     # timeline, preview,
        schedule_debounced_sync(self.plan)               #   cost estimate
                                                          # queued, not sent
                                                          #   on every pixel

    def on_sync_result(self, result):
        if result.ok:
            self.confirmed_plan = result.plan             # matches optimistic
        else:                                              #   guess: no-op
            self.plan = self.confirmed_plan                # snap back
            render_all_views(self.plan)
            show_field_error(result.error.message, result.error.field)

    def on_progress_event(self, evt):                     # from the SSE
        render_progress(evt['stage'], evt['pct'], evt.get('eta_ms'))
                                                           # never a spinner

    def lock(self, control_name, precondition_unmet):
        if precondition_unmet:
            self.locks.add(control_name)                  # ONE control
        else:
            self.locks.discard(control_name)              # never "the app"`,
    notes: [
      'apply_local_edit renders BEFORE scheduling the sync — the screen never waits on the network for a locally-verifiable change, matching the optimistic-UI rule.',
      'on_sync_result reverting to confirmed_plan rather than computing an inverse is the same snapshot discipline undo uses — one mechanism, two callers.'
    ]
  },
  lab: {
    title: 'Scoped locks and the reconciliation snap-back',
    prompt: 'Two functions. (1) <code>should_lock(control, pending)</code>: <code>pending</code> is a list of <code>{"control", "reason"}</code> dicts naming controls with an unmet precondition. Return <code>True</code> if <code>control</code> appears in <code>pending</code>, else <code>False</code> — a control locks only for ITS OWN unmet precondition, never because something else is pending. (2) <code>reconcile(local_plan, confirmed_plan, server_ok)</code>: if <code>server_ok</code> is <code>True</code>, return <code>local_plan</code> (the optimistic guess matched reality — keep it). If <code>False</code>, return <code>confirmed_plan</code> (snap back to the last known-good state).',
    starter: `def should_lock(control, pending):
    # True only if THIS control has an unmet precondition
    pass

def reconcile(local_plan, confirmed_plan, server_ok):
    # server_ok -> keep the optimistic local_plan
    # not server_ok -> snap back to confirmed_plan
    pass`,
    checks: [
      { re: 'def\\s+should_lock\\s*\\(', flags: '', must: true, hint: 'Define should_lock(control, pending).', pass: 'should_lock defined ✓' },
      { re: 'def\\s+reconcile\\s*\\(', flags: '', must: true, hint: 'Define reconcile(local_plan, confirmed_plan, server_ok).', pass: 'reconcile defined ✓' },
      { re: 'for\\s+\\w+\\s+in\\s+pending|any\\(', flags: '', must: true, hint: 'Check membership by scanning pending for this control, not a global busy flag.', pass: 'scoped check ✓' }
    ],
    tests: `pending = [{'control': 'render_button', 'reason': 'plan invalid'},
           {'control': 'voice_picker', 'reason': 'loading voices'}]

assert should_lock('render_button', pending) is True
assert should_lock('voice_picker', pending) is True
assert should_lock('gesture_timeline', pending) is False, \
    'an unrelated pending control must never lock this one'
assert should_lock('render_button', []) is False

local = {'gestures': [{'t': 3.5}]}
confirmed = {'gestures': [{'t': 3.0}]}
assert reconcile(local, confirmed, True) == local, 'server agreed: keep the guess'
assert reconcile(local, confirmed, False) == confirmed, 'server rejected: snap back'
print('scoped locking and reconciliation correct')`,
    solution: `def should_lock(control, pending):
    return any(p['control'] == control for p in pending)

def reconcile(local_plan, confirmed_plan, server_ok):
    return local_plan if server_ok else confirmed_plan`,
    notes: [
      'should_lock scanning by name rather than checking a single global "busy" boolean is the whole lesson: lock state lives at the same granularity as the thing it protects.',
      'reconcile is intentionally two lines — the snap-back discipline should be too simple to disagree with the undo history it shares a data model with.'
    ]
  },
  quiz: [
    {
      q: 'Every view in the editor (timeline, preview, cost estimate) renders from one plan object rather than keeping its own copy primarily because:',
      options: ['It uses less memory', 'It prevents views from silently drifting out of sync with each other — a bug class that independent per-view state makes almost guaranteed', 'It is required by the backend API', 'It makes the code shorter'],
      correct: 1,
      explain: 'One canonical state, many disposable views — the same discipline as the pipeline\'s content-addressed caching, one layer up.'
    },
    {
      q: 'A gesture drag applies to the screen instantly (optimistic) while a natural-language edit request waits for a full response (pessimistic) because:',
      options: ['Drags are more common', 'The drag\'s validity is mostly checkable locally by the UI; the NL edit\'s outcome depends on server-side interpretation the UI cannot predict', 'Natural language is slower to process client-side', 'Optimistic UI is only for numeric values'],
      correct: 1,
      explain: 'Optimism is earned by predictability: apply instantly what the UI can mostly verify itself, wait honestly on what it cannot.'
    },
    {
      q: 'Rendering progress from real SSE stage events ("frames — 62%, 8s left, voice reused") instead of a generic spinner matters because:',
      options: ['Spinners use more CPU', 'A progress bar built from real backend facts stays honest across cache hits and slow renders alike, while a timer-based guess will visibly lie on exactly those cases', 'SSE requires a progress bar to be shown', 'It reduces server load'],
      correct: 1,
      explain: 'A progress bar that lies erodes trust faster than an honest "queued" label — subscribe to the real numbers instead of guessing.'
    },
    {
      q: 'The "Approve & Render" button disables while the plan is invalid, but the gesture timeline underneath stays fully editable, because:',
      options: ['The timeline is a separate app', 'Locks scope to the smallest control whose precondition is unmet — editing gestures has no dependency on the render button\'s state', 'Editing during a lock is a bug that was not caught', 'The button and timeline use different frameworks'],
      correct: 1,
      explain: 'A full-screen lock for one control\'s precondition is the laziest and most damaging pattern — scope it to the control that actually needs it.'
    },
    {
      q: 'When a server-side validator rejects an optimistically-applied edit, the correct UI behavior is:',
      options: ['Leave the invalid edit on screen', 'Snap back to the last confirmed plan AND surface the specific reason on the affected control, not a silent revert', 'Reload the entire page', 'Retry the same edit automatically'],
      correct: 1,
      explain: 'A silent revert reads as the app being broken. The named reason, attached to the exact control, turns a rejection into legible feedback.'
    }
  ],
  pitfalls: [
    'Letting a "quick fix" panel maintain its own local copy of part of the plan (a voice-picker\'s cached selection, say) instead of reading and writing the single plan object. It works fine until another panel changes the same field and the quick-fix panel silently goes stale — the exact bug the one-source-of-truth rule exists to prevent, reintroduced by a shortcut.',
    'Building a generic full-screen "loading" overlay because scoping locks to individual controls feels like more work up front. It is more work up front, and it is also the difference between an editor that feels responsive under real backend latency and one that feels broken every time any single request is in flight.',
    'Computing progress client-side from an assumed duration instead of subscribing to the backend\'s real SSE stage events. It demos fine against a warm cache and then visibly lies the first time a creator hits a genuinely cold, slow render — trust lost in exactly the moment the tool most needs to look trustworthy.'
  ],
  interview: [
    {
      q: 'Explain the "one source of truth" pattern for a complex multi-panel editor and what specifically breaks when a codebase drifts away from it.',
      a: 'The pattern: exactly one canonical state object (here, the plan document already shared with the backend and the director) lives in memory, and every visible panel — timeline, preview canvas, cost estimate, gesture list — is a pure function of some slice of that object, re-rendered whenever the relevant slice changes. No panel owns a private copy of anything the plan already represents. What breaks when a codebase drifts from this, usually gradually: a panel added under deadline pressure keeps its own local state "just for this one field" because wiring it through the shared object felt like overhead; another panel later mutates that same logical field through the proper channel; the two now silently disagree, and the bug that surfaces is not "our state management is wrong," it is "the preview doesn\'t match the timeline sometimes," reported by a confused creator, reproduced inconsistently, and traced back — often hours later — to exactly one panel that took the shortcut. The fix is never a patch to that one panel; it is re-auditing for every OTHER place the same shortcut was taken, because the drift is rarely isolated once the discipline has lapsed once.'
    },
    {
      q: 'When should a frontend action be optimistic versus wait for the server, and how do you decide for a new feature?',
      a: 'Ask two questions about the specific action. Can the client mostly predict the outcome — does it have enough local information to know, with high confidence, whether the server would accept it? And is the cost of being wrong low and clearly recoverable — can a rejected guess be visibly and quickly corrected without the creator having done anything unrecoverable in the meantime? A gesture drag scores yes on both: the UI enforces the same bounds the server will, and a rejection just snaps a slider back with a reason attached. A natural-language edit scores no on the first (the UI cannot predict how the LLM will interpret ambiguous phrasing) so it waits and shows the real result. A "delete this clip" action is interesting: locally predictable, yes, but I\'d still make it optimistic WITH an undo affordance rather than a confirmation dialog, because instant-with-undo is both fast and safe, while a confirmation dialog is neither fast nor meaningfully safer than a good undo. The general rule I give a team building a new feature: default to pessimistic, and earn optimism specifically by demonstrating the local validation genuinely mirrors the server\'s — never optimistic by default "because it feels snappier."'
    },
    {
      q: 'A creator complains the editor "feels laggy" even though your metrics show the backend responds in under 200ms for every request. What do you investigate on the frontend side?',
      a: 'Backend latency being fine means the lag is either perceived (something LOOKS slow even though it is not) or is happening entirely client-side (rendering, layout thrash, or an overly broad lock) — I would not touch the backend first. Concretely: check whether ANY edit that should be optimistic is instead waiting on the 200ms round trip before updating the screen — a single misclassified action (treated as pessimistic when it should be optimistic) reads as system-wide lag even if every other interaction is instant, because it is usually the most frequent one (a slider or drag) that got miscategorized. Check lock scope next: a control disabling more broadly than its actual precondition — the classic full-screen-overlay-for-a-debounced-sync bug — makes unrelated parts of the UI feel gated on a request they have nothing to do with. Then check the render path itself: re-rendering the ENTIRE view tree on every plan mutation instead of only the views subscribed to the changed slice will visibly stutter on complex timelines regardless of backend speed — this is a classic case for memoizing view renders keyed on the specific plan paths they read. The diagnostic order matters: perception bugs (misclassified optimism, over-broad locks) are far more common than actual render performance bugs, and they are also cheaper to fix, so I would rule them out before profiling render performance at all.'
    },
    {
      q: 'How does this frontend architecture change, if at all, when the "creator" is not a human clicking a UI but another program calling the API directly?',
      a: 'Very little changes at the API layer, which is exactly the payoff of having built the plan document as the shared language across the director, the executor, AND the frontend — a programmatic client submits the same plan JSON through the same POST /jobs, idempotency key and all, and reads the same SSE stream or polls the same status endpoint. What genuinely does not apply to a programmatic client: optimistic UI (there is no screen to update instantly — a script simply waits for the real response, which is fine, since the pessimistic path was always correctness-first) and locking (a script has no controls to disable, only requests to sequence, which it is already responsible for doing correctly). What DOES still matter and is easy to under-build for this case: the error envelope\'s retryable field becomes MORE important, not less, because a programmatic client\'s retry logic has no human eyeballing a "this failed, try again?" dialog — it needs the explicit signal to implement correct backoff automatically. The broader point: because the human-facing UI and a programmatic client both ultimately speak the plan-document contract, building the UI as a thin, disposable view over that contract (rather than baking business logic into UI event handlers) is what keeps a CLI or automation client from being a second implementation of anything — it is the same one-source-of-truth discipline paying off at the API boundary instead of the render-tree boundary.'
    }
  ]
};
