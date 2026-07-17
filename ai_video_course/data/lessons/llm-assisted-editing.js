window.LESSONS = window.LESSONS || {};
window.LESSONS['llm-assisted-editing'] = {
  id: 'llm-assisted-editing',
  title: '"Make the Smile Bigger at 0:03": Natural-Language Edits via Tool Calls',
  category: 'Part 4 — The Editing UX',
  timeMin: 35,
  summary: 'The second hand on the editing surface: the creator TYPES (or says) the fix, and the LLM translates it into the same edit records the mouse writes. Everything hard about this feature is precision at the boundary: grounding the model in the project\'s actual state, resolving "it" and "the wave" to real objects (or asking one sharp question instead of guessing), calibrating "a bit bigger" into a bounded delta, and echoing back what was done in plain words with a one-click revert. The mechanism is Part 1\'s tool calling; the discipline is everything this course has practiced since: small registry, validated arguments, provenance on every record, and the base never touched.',
  goals: [
    'Frame NL editing as translation-with-grounding: intent → addressable target + operation + bounded magnitude, against the live project state',
    'Design the edit-tool registry: few, specific, schema-tight tools that write ONLY into clips and the edit list — the same structures the drag path writes',
    'Resolve ambiguous references ("it", "the wave", "that part") via selection state, recency, and time hints — and ask one clarifying question when resolution genuinely fails',
    'Calibrate relative language ("a bit", "much bigger") into consistent, clamped deltas the creator can learn and predict',
    'Close the trust loop: echo each applied edit in plain language, preview immediately, and make revert one click — because the record is one record'
  ],
  concept: [
    {
      h: 'Translation with grounding: what the model must know, and how it learns it',
      p: [
        '"Make the smile bigger at 0:03" only becomes an edit if the model knows what exists: which clips sit on the timeline (a smile gesture at 2.8s? or is the smile part of the base expression?), which channels are editable, the clip duration, the gesture library, what is currently SELECTED in the editor, and what was edited last. That is <b>grounding</b>, and the inline-vs-tools heuristic from Part 1 splits it cleanly: the compact, always-relevant state — clips with ids/times/parameters, recent edits, selection, duration — inlines into the system prompt as a small JSON block (it is rarely more than a screenful, and the model needs ALL of it every request); anything bulky or dynamic — searching a 400-item asset library, probing rendered output — stays behind read-tools.',
        'One non-obvious inclusion: the <b>edit session history</b>. "No, bigger" is a complete, meaningful instruction — but only to a model that saw its own previous edit in the conversation (the ChatSession discipline from Part 1, now doing product work). And one non-obvious exclusion: the dense base NEVER inlines — not because of size alone, but because the model has no business reasoning about frame 1,847 of mouth_open; its editing vocabulary is the sparse layer\'s vocabulary (clips, deltas, channels, times), which is exactly the vocabulary the data model was designed to make sufficient.'
      ]
    },
    {
      h: 'The edit tools: a small registry that can only say sane things',
      p: [
        'The registry stays small and specific — the tool-count lesson, applied: <code>adjust_clip(clip_id, field, value)</code> (amplitude, start, duration_scale, hand — the clip fields from the keyframe lesson), <code>add_gesture(gesture, t, amplitude, hand)</code> (the description lesson\'s enum, verbatim), <code>add_delta_edit(channel, keys, reason)</code> (free-form fixes on expression channels — the LLM\'s equivalent of a drag), <code>toggle_edit(edit_id, enabled)</code> and <code>remove_edit(edit_id)</code> (managing existing records), and read-tools like <code>get_frame_snapshot(t)</code> (a low-res render for the multimodal model to LOOK at, when the creator says "her eyes look wrong here" — the intake VLM, moonlighting). Every argument schema is tight: channels and gestures are enums, times are numbers the validator checks against duration, values carry min/max in the schema itself.',
        'And every write lands where the mouse\'s writes land: clip field updates and <code>provenance: \'llm\'</code> records in the SAME edit list, subject to the SAME clamps (one source of truth for limits — the drag lesson\'s argument, now enforced across input devices), followed by the SAME preview recomposite. The convergence is the whole architecture: undo interleaves mouse and LLM edits in one history; A/B toggles either kind; a regenerated base re-applies both. The model gets no other write path — no raw channel arrays, no project settings, no file system. It is a hand, not an administrator.'
      ]
    },
    {
      h: 'Ambiguity: resolve confidently, or ask one sharp question',
      p: [
        '"Make it bigger." Which it? The resolution ladder, in order: <b>explicit reference</b> ("the wave at 2 seconds" — gesture name + time hint → nearest matching clip); <b>selection state</b> (the creator has a clip selected in the UI — selection IS context, inline it); <b>recency</b> ("no, bigger" right after an edit → the just-edited object; this is why session history inlines); and only then <b>uniqueness</b> (one wave on the whole timeline → "the wave" is unambiguous). When the ladder fails — two waves, nothing selected, no time hint — the correct move is a single, concrete clarifying question: "There are two waves — the one at 2.1s or 14.5s?" listing REAL candidates with REAL times. Guessing wrong costs more than asking: the creator loses trust the first time "the wave" edits the wrong wave, and every subsequent request gets over-specified by a user now compensating for the tool.',
        'Magnitude language needs the same discipline. "A bit," "more," "much bigger," "way less" — the model should not freestyle numbers per request, because inconsistency is unlearnable: "a bit" meaning +10% on Monday and +40% on Tuesday trains the creator to distrust the dial. Fix the calibration in the system prompt as policy: a bit = ±15%, (no qualifier) = ±30%, much/way = ±60%, all multiplicative on the current value, all clamped by the schema\'s bounds, absolute values used verbatim when given ("amplitude 1.5", "at exactly 3.2 seconds"). Consistent calibration turns the LLM from a negotiator into an instrument — the same phrase always moves the same amount, and the creator\'s hand learns it like a volume knob.'
      ]
    },
    {
      h: 'The trust loop: echo, preview, revert',
      p: [
        'Every applied edit gets three receipts. The <b>echo</b>: a plain-language, specific confirmation — "Increased the wave\'s amplitude 1.2 → 1.6" — generated from the ACTUAL tool call\'s arguments, not from the model\'s intentions (echo what was done, not what was meant; the two diverge exactly when it matters). The <b>preview</b>: the recomposite runs immediately, scoped by the same sparsity as the drag path — the creator SEES the change before deciding anything. The <b>revert</b>: one click, because the edit is one record with provenance \'llm\' — and the UI shows it in the same edit list as everything else, named and attributable ("why is the head tilted? — oh, the llm edit from \'less stiff please\'").',
        'Guardrails that keep the loop trustworthy under pressure: per-request delta caps (a single instruction cannot move any value more than one "much" step — runaway compounding requires repeated, visible requests); the validate-repair loop from Part 1 on every tool call (out-of-range time → the error goes back to the model, which usually self-corrects in one round); refusal to bulk-edit ambiguously ("fix everything" → the model proposes a LIST of specific edits and asks which to apply, rather than shotgunning the timeline); and the standing invariant — the model cannot touch the dense base, cannot delete clips it did not create in this session without confirmation, cannot write outside the edit list. None of this limits a well-behaved model; all of it bounds a confused one. The feature\'s promise is symmetry: language and mouse are two hands on one data model — and trust comes from both hands being equally incapable of catastrophe.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Act IV: Nami Takes the Speaking Tube — the Interpreter Who Writes in Rod-Marks',
      text: 'The guide-handles transformed the portrait theater, but a limit emerged: the mayor could grab an arm, yet some wishes were not grabbable — "the whole farewell should feel... wearier," or fixes at rods buried deep in the rig. So for Act IV, Nami takes a new station: interpreter at the speaking tube. The mayor speaks in mayor ("prouder at the harbor line, but gentle"); Nami writes in rod-marks on the overlay scroll — the SAME overlay the guide-handles write, in the same notation, so Usopp\'s undo peels her corrections and the mayor\'s hand-made ones off the same stack, interleaved. Her discipline makes the station work, and the crew studies it like doctrine. She keeps the rig\'s current state pinned in front of her — every clip of choreography with its timing, what was last touched, what the mayor is currently pointing at — because "prouder THAN WHAT is the whole question." When the reference is clear (one wave in the whole act, or the mayor\'s finger resting on the arm-grip), she writes without a word. When it is not — two waves, no gesture, no glance — she asks exactly one question, naming real things: "The wave when the ship enters, or the small one at the farewell?" — never guessing, because the one afternoon she guessed, the wrong wave grew grand, the mayor stopped trusting the tube, and for a week he over-explained every request like a man dictating to an enemy. Her magnitude convention is posted ON the tube: "a touch = one mark. (plain) = two marks. much = four. Numbers spoken are numbers written." — because early on, her "a touch" drifted between one mark and three depending on her mood, and the mayor could never learn the dial. And every correction gets the echo ritual: she reads back what she WROTE, not what he said — "arm-rod up two marks at the harbor line" — while the stagehands run the segment so he sees it move; if he frowns, the mark peels off whole. The rig itself holds her final honesty: her marks obey the same joint-stops as the brass grips — Nami cannot write past a limit any more than a hand can drag past one — and she has no key to the master chart. "The tube and the grips are two hands," Franky says, approving the design. "Same scroll, same stops, same peel. A wish that arrives as words should be exactly as safe as a wish that arrives as a grab."'
    },
    sitcom: {
      show: 'Friends',
      title: 'Rachel at the Fitting: Client Words In, Pinned Chalk Marks Out',
      text: 'Rachel\'s job during Ralph Lauren fitting weeks, as she explains it to an unimpressed Monica, is translator: the client speaks in vibes ("it should feel less... interview, more... me, but at a gala") and Rachel converts it into the only language the master tailor accepts — chalk marks and numbered pins on the muslin, never a cut. The pins ARE the system, and Monica comes around the day she watches it work. Every pin goes onto the garment\'s alteration tags — the same tags the tailor\'s own hands-on adjustments use — so any change, whoever made it, peels off identically, and "put it back how it was" is pulling one tag, not reconstructing a memory. Rachel works with the fit sheet in front of her: every current measurement, every previous alteration, what the client is touching RIGHT NOW — because "looser" from a client holding the sleeve means the sleeve, and the same word from a client staring at the mirror\'s waistline means something else entirely. When reference genuinely fails — "can you fix the bunching?" with bunching in two places — she asks precisely one question, pointing at real cloth: "Here at the shoulder, or here at the hip?" Her early weeks taught her why: she once guessed shoulder, the client had meant hip, and for the rest of the season that client dictated alterations in inches like a contractor, the collaborative magic dead. Her magnitude card is taped to her clipboard, and the whole atelier uses it: "a bit = quarter inch. (plain) = half. much = a full inch. A number spoken is the number pinned." The tailor\'s single rule for her is structural: her pins carry her initials (the tailor\'s carry his), they obey the same seam allowances his hands do — the pin PHYSICALLY cannot take a seam past the fabric\'s edge — and she does not own scissors. Every session ends with the echo: Rachel reads back the pins, not the poetry — "half inch off each sleeve, quarter in at the waist" — while the client turns in the mirror; a frown pulls a tag. "The clients think I speak fluent client," Rachel tells Monica. "What I actually speak is fluent PIN. Anyone can nod at the vibes. The job is writing them down in a language the scissors can follow — and never being the one holding the scissors."'
    },
    why: 'Nami at the tube and Rachel at the fitting are the LLM editor: an interpreter converting vibe-language into the rig\'s precise notation — and every discipline they practice is a section of this lesson. The pinned state sheet and fit sheet are grounding (current clips, measurements, selection — inlined, because "prouder than WHAT" and "looser WHERE" are unanswerable without it); the what-is-the-client-touching awareness is selection-as-context; the one-question rule with real named candidates is the ambiguity ladder\'s honest floor, and both stories price wrong guessing identically — the client who stops trusting and starts dictating in inches is exactly the user over-specifying to compensate for a tool that guessed. The posted magnitude conventions are calibrated relative language (a touch = one mark, learnable like a volume knob); the read-back-what-was-WRITTEN ritual is the echo (what was done, not what was meant); the peelable tags shared with the hands-on adjustments are the single edit list with provenance — two hands, one data model, interleaved undo. And both stories end on the guardrail architecture: Nami\'s marks obey the same joint-stops as the grips, Rachel\'s pins respect the same seam allowances as the tailor\'s and she owns no scissors — the language hand is bounded by the same physics as the manual hand, and neither can touch the master.'
  },
  tech: [
    {
      q: 'Why does the LLM write through the same tool registry and edit list as the drag path, rather than getting its own more expressive editing API?',
      a: 'Because every divergence between the two paths becomes a product lie or a safety hole. Consistency of limits: the drag path clamps in domain space with the renderer\'s own [lo, hi]; give the LLM a separate API and its limits WILL drift from the drag\'s (two implementations of one rule always drift), so the same request lands differently depending on which hand made it. Unified history: creators interleave modalities constantly — drag, then "a bit more", then drag again — and undo must walk one ordered list; separate stores make undo modality-scoped, which no user model survives. Shared invariants: the edit list\'s guarantees (non-destructive, base-immutable, provenance, regeneration-survival) were designed and tested once; a second write path re-litigates each guarantee, and the first bug will be the LLM path silently violating one. Bounded blast radius: the registry defines the model\'s ENTIRE capability surface — small, schema-tight tools mean a confused or prompt-injected model can, at worst, write a clamped, attributable, one-click-revertible record; an "expressive" API is expressive for the failure modes too. The general principle, third appearance in this course: when two producers feed one system, they share one validated channel — the LLM is an input device, exactly as trusted as the mouse, which is to say: not trusted at all, and equally safe.'
    },
    {
      q: 'Design the clarifying-question policy precisely: when does the model ask versus act, and why is the wrong threshold in either direction expensive?',
      a: 'The resolution ladder acts when exactly one candidate survives: explicit reference (name + time hint → nearest match within a window), else current selection, else the most recent edit target for continuation phrases ("no, bigger", "a little less"), else uniqueness (one wave in the project). If more than one candidate survives — or zero — ask, and the question must name real objects with real times ("the wave at 2.1s or the one at 14.5s?"), because a concrete question costs the creator two seconds while teaching them the system sees their timeline. Threshold errors both ways are expensive but asymmetrically: guess-when-ambiguous breaks trust catastrophically — the first wrong-wave edit converts a collaborator into a dictator of over-specified commands (the exact failure both stories stage), and trust does not rebuild from apologies; ask-when-obvious is friction that compounds — a model that asks "which wave?" when one wave exists, or asks about the clip the user has literally selected, trains the user that language is slower than dragging, and the feature dies of neglect. Implementation detail that keeps the ladder honest: resolution happens in YOUR code from the tool call\'s arguments where possible (the model names a gesture + approximate time; deterministic code finds the clip), so the ask/act decision is auditable policy, not model whim — the model\'s job is extracting the reference; the resolver\'s job is deciding whether it suffices.'
    },
    {
      q: 'The creator says "her eyes look dead in the middle part." Walk the full path from that sentence to applied edits, naming every course mechanism it touches.',
      a: 'A tour of the whole stack. (1) Grounding: the inlined project state gives clip layout and duration; "the middle part" is fuzzy, so the model either maps it to a time range (duration/3..2×duration/3 as a defensible default) or asks — policy per the ladder, and a range this soft usually merits acting with a soft echo ("in the middle section, 8-16s"). (2) Seeing: "eyes look dead" is a VISUAL claim — the model calls get_frame_snapshot(t) for a few frames in the range (read-tool; the multimodal lesson\'s VLM consuming low-res renders), and reads back what the intake vocabulary can say: blink track present? gaze static? aliveness amplitude low? (3) Diagnosis to operation: "dead eyes" maps to the aliveness layer\'s parameters — likely add_delta_edit on blink density or a clip-level liveliness parameter adjustment, the talking-head lesson\'s taxonomy giving the model its menu. (4) Validation: proposed keys checked against duration and channel bounds; the repair loop returns violations verbatim if any. (5) Application: one or two provenance:\'llm\' records, additive deltas, clamped — never base mutation, even though the "problem" lives in base-generated aliveness (the edit layer MODULATES the base; regeneration survival intact). (6) Receipts: echo derived from actual calls ("Added blinks and slight gaze drift between 8-16s"), scoped preview, revert visible. The instructive part is step 2-3: the feature quietly composed the VLM, the aliveness taxonomy, and the edit registry — which is what "the capstone is assembly" means in practice.'
    }
  ],
  code: {
    title: 'The edit session: grounding block, tool registry, and the loop with receipts',
    intro: 'The session assembly — Part 1\'s ChatSession and tool loop, Part 4\'s data model, and the calibration/echo policies, wired. The resolver and calibrator are the lab.',
    code: `EDIT_TOOLS = [
  tool('adjust_clip',
       {'clip_id': {'type': 'string'},
        'field': {'enum': ['amplitude', 'start', 'duration_scale', 'hand']},
        'value': {}},                        # bounds enforced by validator
       'Change one field of an existing gesture clip.'),
  tool('add_gesture',
       {'gesture': {'enum': list(GESTURES)}, 't': {'type': 'number'},
        'amplitude': {'type': 'number'}, 'hand': {'enum': ['left','right','none']}},
       'Add a gesture from the library at time t.'),
  tool('add_delta_edit',
       {'channel': {'enum': EDITABLE_CHANNELS},
        'keys': {'type': 'array'},          # [[t, delta], ...]
        'reason': {'type': 'string'}},      # lands in the echo + edit list
       'Layer a delta correction on an expression/pose channel.'),
  tool('toggle_edit', {'edit_id': {'type': 'string'},
                       'enabled': {'type': 'boolean'}},
       'Mute or unmute an existing edit (A/B).'),
  tool('get_frame_snapshot', {'t': {'type': 'number'}},
       'READ: low-res render at time t, for visual questions.'),
]

SYSTEM = '''You edit a talking-avatar project. Ground every action in the
PROJECT STATE below. Resolution: explicit reference > current selection >
most recent edit > uniqueness. If more than one candidate survives, ask ONE
question naming real candidates with times - never guess.
Magnitude policy: "a bit"=15%, unqualified=30%, "much"/"way"=60%,
multiplicative, clamped; spoken numbers are used verbatim.
You cannot modify the dense base, delete clips, or exceed one "much" step
per request.'''

def edit_turn(session, user_text, project):
    state = json.dumps({                    # grounding: small, always fresh
        'duration': project_duration(project),
        'clips': project['clips'],
        'recent_edits': project['edits'][-5:],
        'selection': editor_selection(),
    })
    session.set_system(SYSTEM + '\\nPROJECT STATE:\\n' + state)
    session.add_user(user_text)

    for _ in range(6):                      # tool loop, capped (Part 1)
        msg = ollama_chat(session.request_body(MODEL), tools=EDIT_TOOLS)
        session.add(msg)
        if not msg.get('tool_calls'):
            return msg['content']           # answer or clarifying question
        for call in msg['tool_calls']:
            errors = validate_edit_call(call, project)   # bounds, ids,
            if errors:                                   # delta caps
                result = {'errors': errors}              # repair loop
            else:
                result = apply_to_project(call, project) # provenance:'llm',
                preview_recomposite(result['scope'])     # same list, same
                push_receipt(echo_from_call(call))       # clamps as drag
            session.add_tool_result(result)

# echo_from_call builds the receipt from ARGUMENTS, never from the
# model's prose: "wave amplitude 1.2 -> 1.6" is derived from the call.`,
    notes: [
      'set_system re-inlines fresh project state every turn — grounding goes stale the moment an edit lands, and a model editing against last turn\'s state produces off-by-one-edit bugs that look like hallucination.',
      'The delta-cap validator ("one much-step per request") is the guardrail that makes compounding runaway impossible: "much much much bigger" applies one step and echoes that it capped — visible, bounded, and repeatable if the creator really means it.'
    ]
  },
  lab: {
    title: 'The resolver and the calibrator: the two policies under the magic',
    prompt: 'Two policy functions, deterministic and testable. (1) <code>resolve_clip(clips, gesture=None, t=None, selected_id=None, last_edited_id=None)</code>: clips are <code>{"id", "gesture", "start"}</code>. Ladder: if <code>gesture</code> given, candidates are clips with that gesture — one candidate → return <code>{"clip": id}</code>; several + <code>t</code> given → the one with start nearest <code>t</code>; several, no t → <code>{"ask": [ids...]}</code> (candidate ids, in start order); zero → <code>{"ask": []}</code>. If NO gesture: <code>selected_id</code> (if it exists in clips) wins; else <code>last_edited_id</code> (if it exists) wins; else if exactly one clip exists, that; else <code>{"ask": [all ids in start order]}</code>. (2) <code>calibrated(current, phrase, direction)</code>: phrase ∈ <code>"a bit" | "plain" | "much"</code> → factors 0.15/0.30/0.60; direction ∈ <code>"up" | "down"</code>; multiplicative: up → current×(1+f), down → current×(1−f); clamp result into [0.3, 2.0]; round to 2 decimals.',
    starter: `def resolve_clip(clips, gesture=None, t=None,
                 selected_id=None, last_edited_id=None):
    # the resolution ladder; {'clip': id} or {'ask': [ids]}
    pass

def calibrated(current, phrase, direction):
    # 'a bit'=0.15, 'plain'=0.30, 'much'=0.60; clamp [0.3, 2.0]; round 2
    pass`,
    checks: [
      { re: 'def\\s+resolve_clip\\s*\\(', flags: '', must: true, hint: 'Define resolve_clip with the ladder parameters.', pass: 'resolve_clip defined ✓' },
      { re: 'def\\s+calibrated\\s*\\(', flags: '', must: true, hint: 'Define calibrated(current, phrase, direction).', pass: 'calibrated defined ✓' },
      { re: "'ask'", flags: '', must: true, hint: 'Ambiguity returns an ask with real candidate ids — never a guess.', pass: 'ask path present ✓' },
      { re: 'abs\\s*\\(', flags: '', must: true, hint: 'Nearest-to-t uses absolute distance between t and clip start.', pass: 'nearest-t logic ✓' },
      { re: 'round\\s*\\(', flags: '', must: true, hint: 'Calibrated values round to 2 decimals — predictable receipts.', pass: 'rounding present ✓' }
    ],
    tests: `clips = [{'id': 'c1', 'gesture': 'wave', 'start': 2.1},
         {'id': 'c2', 'gesture': 'wave', 'start': 14.5},
         {'id': 'c3', 'gesture': 'nod_emphatic', 'start': 8.0}]

assert resolve_clip(clips, gesture='nod_emphatic') == {'clip': 'c3'}, \
    'unique gesture resolves without a question'
assert resolve_clip(clips, gesture='wave', t=3.0) == {'clip': 'c1'}, \
    'time hint picks the nearest wave'
assert resolve_clip(clips, gesture='wave') == {'ask': ['c1', 'c2']}, \
    'two waves, no hint: ask, candidates in start order'
assert resolve_clip(clips, gesture='bow') == {'ask': []}, 'no such gesture'
assert resolve_clip(clips, selected_id='c2') == {'clip': 'c2'}, \
    'selection wins when no gesture named'
assert resolve_clip(clips, last_edited_id='c3') == {'clip': 'c3'}, \
    '"no, bigger" continues the last edit'
assert resolve_clip(clips) == {'ask': ['c1', 'c3', 'c2']}, \
    'nothing to go on, several clips: ask with all, by start'
assert resolve_clip([clips[0]]) == {'clip': 'c1'}, 'only clip: unambiguous'

assert calibrated(1.0, 'plain', 'up') == 1.3, '30% up'
assert calibrated(1.2, 'a bit', 'up') == 1.38, '15% of current, not of 1.0'
assert calibrated(1.0, 'much', 'down') == 0.4, '60% down'
assert calibrated(0.5, 'much', 'down') == 0.3, 'clamped at floor'
assert calibrated(1.9, 'much', 'up') == 2.0, 'clamped at ceiling'
print('resolver and calibrator correct')`,
    solution: `def resolve_clip(clips, gesture=None, t=None,
                 selected_id=None, last_edited_id=None):
    if gesture is not None:
        cands = sorted([c for c in clips if c['gesture'] == gesture],
                       key=lambda c: c['start'])
        if len(cands) == 1:
            return {'clip': cands[0]['id']}
        if len(cands) > 1 and t is not None:
            best = min(cands, key=lambda c: abs(c['start'] - t))
            return {'clip': best['id']}
        return {'ask': [c['id'] for c in cands]}
    ids = {c['id'] for c in clips}
    if selected_id in ids:
        return {'clip': selected_id}
    if last_edited_id in ids:
        return {'clip': last_edited_id}
    if len(clips) == 1:
        return {'clip': clips[0]['id']}
    ordered = sorted(clips, key=lambda c: c['start'])
    return {'ask': [c['id'] for c in ordered]}

def calibrated(current, phrase, direction):
    factor = {'a bit': 0.15, 'plain': 0.30, 'much': 0.60}[phrase]
    value = current * (1 + factor if direction == 'up' else 1 - factor)
    return round(max(0.3, min(2.0, value)), 2)`,
    notes: [
      'The resolver is deliberately deterministic code, not model judgment: the LLM extracts the reference (gesture, time, continuation), and THIS function decides whether it suffices — making the ask/act threshold auditable policy instead of per-request whim.',
      'calibrated being multiplicative on CURRENT (test two: 15% of 1.2, not of 1.0) is what makes repeated "a bit more" converge smoothly instead of stepping linearly past the target — the volume-knob feel, in one design choice.'
    ]
  },
  quiz: [
    {
      q: 'The LLM editor writes through the same tool registry and edit list as the mouse because:',
      options: ['It saves development time', 'Shared limits cannot drift, undo walks one interleaved history, the edit list\'s guarantees apply to both hands, and the registry bounds a confused model\'s blast radius', 'LLMs cannot use other APIs', 'The mouse path is deprecated'],
      correct: 1,
      explain: 'Two producers, one validated channel: language and mouse are two input devices on one data model, equally capable and equally incapable of catastrophe.'
    },
    {
      q: '"Make it bigger" arrives with two waves on the timeline, nothing selected, no recent edits. The model should:',
      options: ['Pick the first wave', 'Enlarge both waves', 'Ask one concrete question naming both candidates with their times', 'Refuse the request'],
      correct: 2,
      explain: 'The ladder failed, so ask — with real objects and real times. One wrong-wave guess converts a collaborator into a distrustful over-specifier; the question costs two seconds.'
    },
    {
      q: 'Magnitude words ("a bit", "much") are calibrated as fixed policy in the system prompt because:',
      options: ['LLMs cannot do arithmetic', 'Consistency is learnability: the same phrase always moves the same amount, so the creator\'s hand learns the dial like a volume knob — per-request improvisation is untrustable', 'It shortens the prompt', 'Regulations require it'],
      correct: 1,
      explain: '"A bit" meaning +10% Monday and +40% Tuesday trains distrust. Fixed multiplicative steps, clamped, with spoken numbers verbatim — an instrument, not a negotiator.'
    },
    {
      q: 'The echo ("Increased wave amplitude 1.2 → 1.6") is generated from the tool call\'s arguments rather than the model\'s own prose because:',
      options: ['Prose is too long', 'The receipt must state what was DONE, not what was meant — the two diverge exactly in the failure cases where the receipt matters most', 'Arguments are already strings', 'Users prefer numbers'],
      correct: 1,
      explain: 'A model that misfired will also mis-describe the misfire. Deriving receipts from the actual applied arguments makes the echo an audit line, not a hope.'
    },
    {
      q: 'When the creator reports a VISUAL problem ("her eyes look dead here"), the edit session can:',
      options: ['Only ask the creator to drag it themselves', 'Call a read-tool for frame snapshots and let the multimodal model look, then map the diagnosis onto aliveness-layer parameters — composing the VLM, the taxonomy, and the edit registry', 'Regenerate the entire video', 'Edit the dense base directly'],
      correct: 1,
      explain: 'The intake VLM moonlights as the editor\'s eyes; "dead eyes" maps to blink density and gaze drift on the sparse layer. Features at this stage are compositions of earlier machinery.'
    }
  ],
  pitfalls: [
    'Letting grounding go stale across the session. The project state inlined at turn one is wrong by turn three — the model edits against a timeline that no longer exists, producing off-by-one-edit bugs that look like hallucination. Re-inline fresh state every turn; it is a screenful, and prefill is cheaper than confusion.',
    'Shipping guess-when-ambiguous because clarifying questions "add friction." The friction ledger runs the other way: one wrong-object edit costs the feature its trust permanently, while a concrete question costs two seconds and ADVERTISES that the system sees the timeline. Ask when the ladder fails; act when it resolves.',
    'Echoing the model\'s intention instead of the applied call. "I made the wave more energetic!" tells the creator nothing checkable and lies precisely when validation clamped, capped, or repaired the request. Receipts derive from arguments post-validation — what landed in the edit list, in numbers.'
  ],
  interview: [
    {
      q: 'Design a natural-language editing feature for a timeline-based creative tool. What does the LLM actually do, and what stays deterministic?',
      a: 'The LLM does exactly one job: translate intent into references and operations — "which thing, what change, how much" extracted from language. Everything around that is deterministic machinery. Grounding: compact live project state (clips with ids/times/parameters, recent edits, current selection, duration) re-inlined into the system prompt every turn, because "it" and "no, bigger" are only resolvable against fresh state; bulky context stays behind read-tools. Writing: a small, schema-tight tool registry (adjust_clip, add_gesture from the library enum, add_delta_edit on allowlisted channels, toggle/remove) that lands provenance-tagged records in the SAME non-destructive edit list the direct-manipulation path writes — one set of clamps, one interleaved undo history, one blast radius. Resolution: deterministic code walks the ladder (explicit reference → selection → recency → uniqueness) over the model\'s extracted reference and decides act-versus-ask; ambiguity yields one concrete question naming real candidates. Calibration: fixed policy maps relative language to multiplicative, clamped steps — consistency is learnability. Receipts: echo derived from validated applied arguments (not model prose), immediate scoped preview, one-click revert. Guardrails: per-request delta caps, validate-repair on every call, no access to the dense base or destructive operations. Summary sentence: the model is an input device — a second hand on the same data model as the mouse — and every guarantee the product makes is enforced outside it.'
    },
    {
      q: 'What failure modes are unique to language-driven editing versus direct manipulation, and how does the architecture absorb each?',
      a: 'Four, each with a structural absorber. Referential failure — language points at objects indirectly, and "the wave" can miss: absorbed by the resolution ladder in deterministic code plus the ask-one-concrete-question floor; the mouse never has this problem (pointing IS resolution), which is why the language path needs machinery the drag path does not. Magnitude vagueness — "bigger" has no inherent quantity: absorbed by posted calibration policy (fixed multiplicative steps, spoken numbers verbatim, clamps), turning vagueness into a learnable dial. Semantic overreach — language can request what no single edit means ("make it feel more premium", "fix everything"): absorbed by scope rules — the model proposes a LIST of specific candidate edits and asks which to apply, rather than shotgunning; plus per-request delta caps so even accepted requests move boundedly. Silent divergence — the model believes it did X while validation clamped or repaired it into Y: absorbed by deriving receipts from post-validation applied arguments, so the echo is an audit line and the creator always sees Y. Note what is NOT unique: out-of-bounds values, stale-state edits, and destructive mistakes threaten both hands — which is precisely the argument for both hands writing through one validated channel with one set of limits, rather than hardening two parallel paths.'
    },
    {
      q: 'Your NL editor works in demos but real users stopped using it after two weeks. The logs show requests still succeed technically. Diagnose.',
      a: 'Technically-succeeding-but-abandoned means the failures live in trust and predictability, not correctness — I would hunt four patterns in the session logs. (1) Wrong-object edits that users silently reverted: count revert-within-30-seconds after LLM edits, segmented by whether resolution used a guess path — if guess-then-revert clusters exist, the ask threshold is too aggressive toward acting, and each incident taught a user to over-specify or quit (the trust death spiral: language becomes slower than dragging once you must dictate coordinates). (2) Calibration drift or surprise: histogram the applied deltas per magnitude phrase — if "a bit" spans a wide range (model improvising instead of policy applying), users could never learn the dial; also check clamp/cap frequency: silent capping without a visible receipt reads as "it ignored me." (3) Latency versus the alternative: time from enter-key to preview — if the tool loop plus render exceeds a few seconds, dragging wins every race and the feature only gets used for the undraggable cases, which may be fine but should be deliberate. (4) Echo quality: sample sessions where users typed a correction of the correction ("no not that, the OTHER one") — these mark receipts that failed to communicate what happened. The fixes map one-to-one: tighten the ladder toward asking, enforce calibration in code not prompt, budget the loop like the live pipeline budgets latency, and derive echoes from arguments. The meta-answer: for creative-tool AI, adoption is a trust metric, and trust instruments (revert rates, correction chains, over-specification trends) belong on the dashboard next to success rates from day one.'
    },
    {
      q: 'How would you extend the edit session so the model can diagnose visual problems ("her eyes look dead"), not just execute stated changes — and where do you draw the autonomy line?',
      a: 'Extension: give the session eyes and a diagnostic vocabulary, keep the hands identical. Eyes: a read-tool serving frame snapshots (low-res renders at requested times) consumed by the multimodal model — the same VLM the intake stage uses — so "eyes look dead" triggers LOOKING at frames in the referenced range. Vocabulary: the diagnosis must land in the system\'s parameter taxonomy — blink density, gaze drift, aliveness amplitude, idle-motion settings — which the model knows from its tool schemas; "dead eyes" becomes "blink track sparse + gaze static between 8-16s", checkable claims about editable parameters. Hands: the resulting changes are ordinary registry calls — delta edits on aliveness channels, provenance-tagged, clamped, echoed, revertible; diagnosis expands what the model can SEE and SAY, never what it can TOUCH. The autonomy line I would draw: propose-and-preview by default — the model applies edits immediately (they are cheap to revert) but never chains more than one diagnostic-fix cycle without the creator responding; no background editing (the model never edits frames the creator has not asked about); no taste ownership (the model fixes named problems and suggests, but "I also noticed and fixed three other things" is forbidden — unsolicited edits, even good ones, erode the creator\'s sense of authorship, and authorship is the product). And the honest technical limit stated upfront: VLM aesthetic judgment is coarse — reliable for "blinks absent, gaze static", unreliable for "emotionally flat" — so the feature\'s scope is mechanical diagnosis with human taste kept in the loop, which is also exactly where the current models\' reliability boundary runs.'
    }
  ]
};
