window.LESSONS = window.LESSONS || {};
window.LESSONS['keyframes-timelines-motion-paths'] = {
  id: 'keyframes-timelines-motion-paths',
  title: 'Keyframes, Timelines & Motion Paths: The Data Model Behind Every Edit',
  category: 'Part 4 — The Editing UX',
  timeMin: 35,
  summary: 'Part 3 ended with generated motion; Part 4 makes it FIXABLE — and every fixing feature (click-drag next lesson, natural-language edits after) writes into one data model, designed here. Keyframes with interpolation make motion sparse and grabbable; a timeline of channels and clips organizes it; motion paths give spatial trajectories their own geometry (with one famous trap about speed); and the load-bearing decision — edits stored as a separate layer over the generated base, never baked into it — is what makes every edit reversible, toggleable, and re-render-safe. Get this lesson\'s data model right and the next two lessons are UI; get it wrong and they are impossible.',
  goals: [
    'Explain keyframes + interpolation: why sparse keys with computed in-betweens beat dense per-frame values for anything a human edits',
    'Distinguish the two motion layers: dense generated coefficient streams (the model\'s output) vs sparse editable keyframes (gestures and fixes) — and how they composite',
    'Use easing curves deliberately: linear vs ease-in/out, and why mechanical easing reads as mechanical motion',
    'Describe motion paths as parametric curves and explain the arc-length trap: evenly spaced parameters are not evenly timed motion',
    'Design the non-destructive edit architecture: edits as ordered, toggleable deltas over the base — with undo, A/B, and safe re-rendering as consequences rather than features'
  ],
  concept: [
    {
      h: 'Keyframes: motion a human can hold',
      p: [
        'A keyframe is a value pinned at a time: <code>head_pitch = -0.3 at t=2.0s</code>. Between keyframes, <b>interpolation</b> computes every in-between frame. This is the oldest idea in animation (senior artists drew the key poses; assistants drew the in-betweens — literally called inbetweening), and it survives because sparsity is exactly what editability means: a 2-second nod is THREE keyframes a human can see, grab, and move — not fifty per-frame numbers. Move the middle key later and the nod lands later; raise its value and the nod deepens. The representation is the interface.',
        'Interpolation choice is motion character. <b>Linear</b> gets you there with constant velocity and a visible corner at every key — fine for mechanical values, wrong for bodies. <b>Eased</b> curves (cubic/Bézier segments; ease-out of one key, ease-in to the next) accelerate and decelerate the way mass does, which is why every animation tool defaults to them. The practical rule for DenDen Studio: motion channels (head pose, gesture curves) interpolate eased; binary-ish channels (blink) use their own envelopes; and whatever the choice, it is a property SAVED ON THE SEGMENT — because the editor of the next two lessons must show a curve that is exactly what the renderer will compute, or drag-to-fix becomes drag-to-lie.'
      ]
    },
    {
      h: 'The timeline: two layers with different jobs',
      p: [
        'DenDen Studio\'s timeline holds two kinds of motion that must not be confused. The <b>dense base layer</b>: the talking-head model\'s output — per-frame coefficient streams (25 values per second per channel) for speech articulation and aliveness. Machine-made, machine-scaled: no human will ever hand-edit frame 1,847 of mouth_open, and that is fine — it regenerates from audio whenever speech changes. The <b>sparse editable layer</b>: gesture instances (a wave clip at t=2.0, amplitude 1.2 — from the description lesson) and manual fixes (keyframes a creator drags into place). Human-made, human-scaled: everything here is grabbable.',
        'The timeline\'s organizing structures: <b>channels</b> (one value over time: head_pitch, brow_raise) grouped into <b>tracks</b>, and <b>clips</b> — a gesture instance is a clip that OWNS its template keyframes, so dragging the clip moves the whole gesture, stretching it retimes it, and its parameters (amplitude) stay attached to the clip, not smeared across raw keys. Composition order at render time: dense base, plus instantiated gesture clips, plus manual edit keys — merged with the additive-clamped rules the gesture lab already built. The two-layer split is why an edited project survives regeneration: change the script, the dense layer re-renders from new audio, and every gesture and fix on the sparse layer re-applies on top — edits OUTLIVE the base they decorate.'
      ]
    },
    {
      h: 'Motion paths: when a value is a place',
      p: [
        'Some motion is spatial: a pointing hand travels an arc across the frame; a gaze target sweeps from viewer to product; in 2.5D rigs, the head\'s position traces a small path. A <b>motion path</b> represents the trajectory as a parametric curve — typically Bézier segments: anchor points the path passes through, with handles shaping the curve between them. The creator will SEE this as a literal draggable line over the video (next lesson); the data is just anchors + handles per segment, with each anchor optionally pinned to a time.',
        'The trap every implementer falls into once: <b>parameter is not distance</b>. Stepping a Bézier\'s parameter t evenly (0, 0.1, 0.2…) does NOT advance evenly along the curve — segments where handles stretch the curve pack more distance into the same parameter step, so "constant parameter speed" LOOKS like the hand rushing through some stretches and crawling through others, for no visible reason. The fix is <b>arc-length reparameterization</b>: measure the curve\'s actual length (numerically — sample and sum), then map "time" to "distance traveled" so motion covers equal DISTANCE per equal time unless an easing curve deliberately says otherwise. Every animation library does this internally; you need to know it exists because the bug — "why does the point speed up mid-path when I bend the curve?" — will otherwise cost an afternoon, and because timing (easing along the path) and geometry (the path\'s shape) become independently editable exactly when arc-length is the bridge between them.'
      ]
    },
    {
      h: 'Non-destructive editing: the decision everything else leans on',
      p: [
        'The tempting shortcut: when the creator fixes something, write the fix INTO the coefficient data — mutate the base, save, done. It works for exactly one edit. Then: undo requires remembering what was overwritten; two edits to the same region entangle; "show me before/after" is impossible; and the first script change REGENERATES the dense base, silently deleting every baked-in fix. The professional pattern — every serious editor, audio workstation, and compositor converges on it — is <b>non-destructive editing</b>: the generated base is immutable; every edit is a <b>delta record</b> in an ordered edit list (channel, time range, keyframes-of-deltas, enabled flag, and provenance — who made it: drag, LLM, template); rendering composites base + enabled edits, in order.',
        'Now count what falls out free. <b>Undo/redo</b>: pop and re-push the edit list — no state snapshots. <b>A/B</b>: toggle an edit\'s enabled flag and re-render the preview. <b>Survival</b>: regenerate the base (new script, better model) and re-apply the edit list on top — fixes persist across regeneration, the property that makes editing WORTH doing on generated content. <b>Attribution</b>: when a creator asks "why is the head tilted here?", the answer is a named edit in a list, not archaeology. <b>Sync</b>: the edit list is small, serializable, and diffable — it IS the project file, which Part 6\'s backend will store and version. The next two lessons are, honestly, just two input devices — a mouse and an LLM — writing records into the list this lesson designed. That is the correct amount of drama for a data model: all of it upfront, none of it later.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Nami\'s Master Chart, the Overlay Sheets, and the Current That Bent Time',
      text: 'Nami\'s navigation system, as she teaches it to a young chartist, is three disciplines stacked. First: waypoints, not wakes. A route is drawn as a handful of marked points — round THIS cape, sight THIS lighthouse, make THIS bearing by dusk — and the helmsman fills in the smooth sailing between them. "I could chart every ship-length of the journey," she says, "and then no one could change anything without redrawing a thousand marks. Five waypoints, and moving ONE reshapes the whole passage. The route you can grab is the route you can fix." Her curves between waypoints are eased, never angular — "ships have mass; a route with corners is a route drawn by someone who has never stood at a helm." Second: the overlay sheets. The master chart — depths, coasts, the base truth — is NEVER inked on. Corrections live on transparent sheets pinned over it: this week\'s storm detour on one, the fishing-fleet avoidance on another, each sheet labeled with who drew it and why, stacked in order. Remove a sheet and that correction vanishes cleanly; lift them all and the master is pristine underneath; and when the Log Pose resets and the base chart must be redrawn for a new island, every sheet pins straight onto the new master — the corrections OUTLIVE the chart. The apprentice\'s inevitable disaster supplies the third discipline: he inks a correction directly onto a master chart, the next correction tangles with it, undoing means scraping ink, and Nami\'s verdict is quiet and total: "You did not make an edit. You made a different chart. Now nobody can say what the sea told us versus what you guessed." And the current that bent time: the apprentice plots a curve through a strait and marks arrival times at even spacing ALONG HIS PEN STROKES — but the curve\'s middle section, bent wide by his flourish, holds twice the actual distance of its ends, so his evenly-marked times have the ship inexplicably sprinting mid-strait. Nami measures the curve with a knotted string — actual distance, not pen distance — and re-marks the times. "The pen\'s pace is not the ship\'s pace. Measure the string, then hang the hours on it."'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Laminated Master Plan and the Sticky-Note Layer',
      text: 'Monica plans Phoebe\'s wedding reception with a system the gang mocks until it saves them. The master timeline is laminated — cocktail hour keyed at 6:00, dinner keyed at 7:15, first dance at 8:30 — deliberately sparse: "I mark the moments that MATTER and the staff flows between them. If I scheduled every minute, changing anything would mean reprinting the night." Every stress-tested instinct shows up in the details: the transitions are eased ("guests do not teleport to their tables; the room takes twelve minutes to move, so the plan breathes in and out of every key moment"), and the one time Rachel drafts a segment with hard corners — band stops, INSTANTLY speeches — the room\'s awkward lurch proves the point. Changes never touch the laminate: they go on color-coded sticky notes layered over it — Phoebe\'s "swap the entrée" on pink, the band\'s late arrival slide on yellow — each initialed, each stacked in the order it arrived. Undo is peeling a note; comparing plans is lifting notes up and down while squinting; and when the venue floods and Monica reprints the ENTIRE master for the backup hall, the moment that converts every skeptic arrives: the sticky notes peel off the old laminate and pin onto the new one, every correction intact on a rebuilt base. Ross, who had inked his toast directly onto laminate at HIS rehearsal dinner and then watched a schedule change orphan it mid-ceremony, is heard telling Chandler: "The notes survive the reprint. Write on the plan, and you die with the plan." Chandler, holding the seating-chart path Monica drew for the couple\'s entrance walk — a swooping curve through the tables with times marked evenly along the ink — points at the middle: "Why do they power-walk through THIS part?" Monica re-measures the curve with a ribbon, redistributes the times by actual distance, and adds it to the training binder: the pen\'s inch is not the walker\'s inch.'
    },
    why: 'The waypoints and the laminated key moments are keyframes: sparse, grabbable pins with the passage flowing between them — move one and the whole route reshapes, which is the entire argument for sparse-over-dense; and both stories insist the in-betweens are EASED because rooms and ships have mass. The overlay sheets and sticky notes are the non-destructive edit layer, complete with every property the lesson derives: ordered, labeled with provenance, individually removable (undo), stackable for comparison (A/B), never inked into the base — and both stories stage the same two payoffs: the apprentice/Ross catastrophe of baking edits into the master (entangled, un-undoable, "a different chart"), and the triumphant survival scene where the base is regenerated (new island, flooded venue) and every edit re-pins onto the new base intact — the exact property that makes editing generated content worth building. The knotted string and the ribbon are arc-length reparameterization: times hung on pen-distance instead of true distance make the ship sprint mid-strait and the couple power-walk mid-room — measure the curve, then hang the hours on it.'
  },
  tech: [
    {
      q: 'Why keep the model\'s dense per-frame output and the human\'s sparse keyframes as separate layers instead of converting everything to one representation?',
      a: 'Because each representation is optimal for its producer and pathological for the other\'s. Convert the dense base to keyframes (curve simplification) and you get thousands of keys or a lossy approximation — speech articulation genuinely wiggles at frame rate, and "simplified" mouth curves audibly degrade sync; either way the result is un-editable in practice, so nothing was gained. Bake human edits into the dense stream and you inherit the non-destructive lesson\'s whole catastrophe list: no undo without snapshots, no A/B, no attribution, and — fatally for generated content — edits die whenever the base regenerates from a script change or a model upgrade. Keeping both layers means each lives at its natural granularity: the base is a machine artifact, regenerated freely, never hand-touched; the sparse layer is a human artifact, tiny, durable, and composited on top at render time by the same additive-clamped merge the gesture system already uses. The composition boundary is also the SEMANTIC boundary — "what the model said" versus "what the human meant" — which is exactly what the creator\'s "why does it look like this?" question needs answered, and what the LLM editor two lessons from now must read and write without ever touching the base.'
    },
    {
      q: 'A creator drags a gesture clip from t=2.0 to t=3.5, stretches it 1.5x, and bumps amplitude. Walk through what changes in the data — and why the clip owning its keyframes matters.',
      a: 'Three fields on the clip record change: start 2.0→3.5, duration_scale 1.0→1.5, amplitude (say) 1.0→1.3. Nothing else. The clip\'s template keyframes — the designed wave curves from the gesture library — are stored in LOCAL time (dt from clip start) and LOCAL value (pre-amplitude), so instantiation at render time computes absolute keys as (start + dt × duration_scale, value × amplitude): the same arithmetic as the gesture lab, now driven by clip fields. Why ownership matters: if instantiation had smeared absolute keyframes onto the channels at insert time, the drag would require finding which keys belonged to the wave (they are not labeled — they are just numbers among numbers), moving each, rescaling each, and hoping none had been merged with a neighbor\'s keys. Clip ownership keeps the gesture a single grabbable object with parameters — which is ALSO what makes it addressable by the other input device: "make the wave at 3.5 bigger" (LLM lesson) resolves to this clip\'s amplitude field, the same field the drag wrote. One data model, two hands: that convergence is the design test — if a mouse edit and a language edit would write different structures, the model is wrong.'
    },
    {
      q: 'Implement-level: how does arc-length reparameterization actually work, and when is skipping it acceptable?',
      a: 'The curve is defined as P(t) for parameter t∈[0,1], but equal t-steps yield unequal distances. Numerically: sample the curve finely (say 100-200 points), accumulate segment lengths into a table mapping t → cumulative arc length s(t), total length L; then invert — to be at distance d along the curve, binary-search the table for t where s(t)=d, interpolating between samples. Motion at constant speed over duration D places the point at P(t(d)) where d = L × (elapsed/D); deliberate easing composes on top by warping elapsed/D through the easing function BEFORE the distance mapping — timing and geometry now cleanly independent, which is the practical payoff: bending the path no longer changes the speed profile, and retiming no longer requires touching the path. Cost: the table is computed once per path edit (cheap) and lookup is O(log n) per frame (trivial). When skipping is fine: paths short or near-straight (parameter ≈ distance when curvature is low), values that are not spatial (easing a scalar channel needs no arc length — there is no "distance"), or motion so brief (a 4-frame flick) that no eye could register the speed variation. The honest heuristic: if the creator can SEE the point travel — a pointing hand, a gaze sweep, an entrance walk — reparameterize; if the curve is just interpolation shape between value keys, do not bother.'
    }
  ],
  code: {
    title: 'The project data model: base, clips, edits — and one render composite',
    intro: 'The structures the next two lessons write into, exactly as DenDen Studio stores them. Everything is plain data — serializable, diffable, versionable — which is the point.',
    code: `# ---- the two motion layers -------------------------------------------
project = {
  'base': {                       # DENSE: machine-made, regenerable,
    'source': 'sadtalker@2.1',    #   never hand-edited
    'fps': 25,
    'channels': {                 # per-frame arrays from Part 3
      'mouth_open': [...], 'head_pitch': [...], 'blink': [...],
    },
    'audio_hash': 'sha256:...',   # regenerate when the audio changes
  },

  'clips': [                      # SPARSE: gesture instances (clip owns
    { 'id': 'clip_01',            #   its template; drag moves the CLIP)
      'gesture': 'wave',          # library reference, local-time keys
      'start': 2.0,
      'duration_scale': 1.0,
      'amplitude': 1.2,
      'hand': 'right' },
  ],

  'edits': [                      # SPARSE: ordered, non-destructive deltas
    { 'id': 'edit_01',
      'channel': 'head_pitch',
      'keys': [[3.0, 0.0], [3.2, -0.15], [3.5, 0.0]],  # (t, DELTA value)
      'easing': 'ease_in_out',    # saved ON the segment - editor and
      'enabled': True,            #   renderer must agree
      'provenance': 'drag' },     # drag | llm | template - attribution
  ],
}

# ---- one composite, three sources ------------------------------------
def render_channels(project):
    out = deep_copy(project['base']['channels'])       # 1. immutable base
    for clip in project['clips']:                      # 2. gesture clips
        curves = instantiate_clip(GESTURES[clip['gesture']], clip)
        merge_additive_clamped(out, curves)            #   (Part 3's lab)
    for edit in project['edits']:                      # 3. edit deltas,
        if edit['enabled']:                            #    in order
            dense = interpolate_keys(edit['keys'], edit['easing'],
                                     project['base']['fps'])
            merge_additive_clamped(out, dense)
    return out                                         # -> renderer

# Undo:   project['edits'].pop()          (plus a redo stack)
# A/B:    edit['enabled'] = False; re-render preview
# Regen:  rebuild 'base' from new audio; clips and edits re-apply intact.
# The next two lessons are a mouse and an LLM writing into
# project['clips'] and project['edits']. Nothing else changes.`,
    notes: [
      'Edit keys store DELTAS (add -0.15 to whatever is there), not absolute values — absolute edit keys would fight the base\'s own motion and break the moment the base regenerates differently. Deltas compose; absolutes collide.',
      'provenance on every edit is cheap now and priceless later: the LLM lesson\'s edits, the drag edits, and template fixes all land in one list, and "who did this and why" is the first question every confused creator (and every support ticket) asks.'
    ]
  },
  lab: {
    title: 'Interpolation and the composite: the renderer\'s half of the contract',
    prompt: 'Two functions the render composite needs. (1) <code>interp_channel(keys, t)</code>: <code>keys</code> is a time-sorted list of <code>[t, value]</code> pairs. Return the linearly interpolated value at time <code>t</code> — clamped to the first value before the first key and the last value after the last key; exact key times return the key\'s value. (2) <code>apply_edits(base, edits, lo, hi)</code>: <code>base</code> maps channel → dict of frame → value. Each edit is <code>{"channel", "frames": {frame: delta}, "enabled"}</code>. Apply ENABLED edits in list order, ADDING deltas (missing base frames default 0.0), clamping results to <code>[lo, hi]</code>. Return a NEW dict — the base must remain unmodified (it is immutable; that is the whole doctrine).',
    starter: `def interp_channel(keys, t):
    # sorted [t, value] pairs -> linear interp, clamped at both ends
    pass

def apply_edits(base, edits, lo, hi):
    # NEW dict: base + enabled edits' deltas (in order), clamped
    pass`,
    checks: [
      { re: 'def\\s+interp_channel\\s*\\(', flags: '', must: true, hint: 'Define interp_channel(keys, t).', pass: 'interp_channel defined ✓' },
      { re: 'def\\s+apply_edits\\s*\\(', flags: '', must: true, hint: 'Define apply_edits(base, edits, lo, hi).', pass: 'apply_edits defined ✓' },
      { re: 'enabled', flags: '', must: true, hint: 'Disabled edits are skipped — that is the A/B toggle.', pass: 'enabled flag respected ✓' },
      { re: 'deepcopy|\\{\\s*ch|dict\\s*\\(|copy', flags: '', must: true, hint: 'Return a NEW structure — the immutable base must not be mutated.', pass: 'base not mutated ✓' }
    ],
    tests: `keys = [[1.0, 0.0], [2.0, 1.0], [4.0, 0.0]]
assert interp_channel(keys, 0.5) == 0.0, 'before first key: clamp'
assert interp_channel(keys, 1.0) == 0.0 and interp_channel(keys, 2.0) == 1.0
assert abs(interp_channel(keys, 1.5) - 0.5) < 1e-9, 'midpoint interpolates'
assert abs(interp_channel(keys, 3.0) - 0.5) < 1e-9, 'longer segment too'
assert interp_channel(keys, 9.0) == 0.0, 'after last key: clamp'

base = {'head_pitch': {10: 0.2, 11: 0.3}}
edits = [
  {'channel': 'head_pitch', 'frames': {10: -0.1, 12: 0.5}, 'enabled': True},
  {'channel': 'head_pitch', 'frames': {10: -0.2}, 'enabled': False},
  {'channel': 'head_pitch', 'frames': {11: 0.9}, 'enabled': True},
]
out = apply_edits(base, edits, lo=-1.0, hi=1.0)
assert abs(out['head_pitch'][10] - 0.1) < 1e-9, 'delta added: 0.2 - 0.1'
assert out['head_pitch'][11] == 1.0, 'second enabled edit clamps: 0.3+0.9'
assert out['head_pitch'][12] == 0.5, 'edit creates missing frames (base 0.0)'
assert base['head_pitch'][10] == 0.2 and 12 not in base['head_pitch'], \
    'THE BASE IS IMMUTABLE - a mutated base fails the whole doctrine'
print('interpolation and non-destructive composite correct')`,
    solution: `def interp_channel(keys, t):
    if t <= keys[0][0]:
        return keys[0][1]
    if t >= keys[-1][0]:
        return keys[-1][1]
    for i in range(len(keys) - 1):
        t0, v0 = keys[i]
        t1, v1 = keys[i + 1]
        if t0 <= t <= t1:
            f = (t - t0) / (t1 - t0)
            return v0 + (v1 - v0) * f

def apply_edits(base, edits, lo, hi):
    out = {ch: dict(frames) for ch, frames in base.items()}
    for edit in edits:
        if not edit['enabled']:
            continue
        ch = out.setdefault(edit['channel'], {})
        for frame, delta in edit['frames'].items():
            merged = ch.get(frame, 0.0) + delta
            ch[frame] = max(lo, min(hi, merged))
    return out`,
    notes: [
      'The immutability assertion in the tests is the doctrine made executable: every catastrophe in the non-destructive section starts with someone mutating the base "just this once." Make the type system or the tests refuse.',
      'interp_channel is linear for testability; production saves an easing type per segment and swaps the `f` line for the eased fraction — same structure, one substitution, which is why easing is stored on the segment rather than applied ad hoc.'
    ]
  },
  quiz: [
    {
      q: 'Sparse keyframes with interpolation beat dense per-frame values for human editing because:',
      options: ['They render faster', 'A motion is a handful of grabbable, movable keys — the representation IS the interface; dense data has nothing a human can hold', 'They use less disk', 'Interpolation is more accurate than models'],
      correct: 1,
      explain: 'Three keys make a nod editable: move one and the motion reshapes. Fifty per-frame numbers make it archaeology. Sparsity is what editability means.'
    },
    {
      q: 'The dense generated base and the sparse edit layer are kept separate because:',
      options: ['They use different file formats', 'Each is optimal at its own granularity, and the boundary is semantic — machine speech articulation regenerates freely underneath, while human edits survive on top', 'Dense data cannot be rendered', 'Sparse data is deprecated'],
      correct: 1,
      explain: '"What the model said" vs "what the human meant." Convert either into the other\'s representation and you lose regeneration or editability — the two-layer split keeps both.'
    },
    {
      q: 'Evenly spaced parameter steps along a Bézier motion path make the moving point:',
      options: ['Move at constant speed', 'Speed up and slow down with the curve\'s stretching — parameter is not distance; constant speed needs arc-length reparameterization', 'Jitter randomly', 'Reverse at handles'],
      correct: 1,
      explain: 'Where handles stretch the curve, one parameter step covers more distance. Measure the string, then hang the hours on it.'
    },
    {
      q: 'Edits are stored as DELTAS over the base rather than absolute replacement values because:',
      options: ['Deltas are smaller numbers', 'Deltas compose with the base\'s own motion and survive base regeneration; absolute values fight the base and break when it changes', 'Absolute values overflow', 'Renderers only accept deltas'],
      correct: 1,
      explain: '"Add -0.15 here" still means the right thing on a regenerated base; "the value is 0.05 here" bakes in assumptions about a base that no longer exists.'
    },
    {
      q: 'Undo, A/B comparison, and edits-surviving-regeneration are all listed as CONSEQUENCES of the data model rather than features because:',
      options: ['They are unimportant', 'With an ordered, toggleable, non-destructive edit list they are pop(), a flag flip, and a re-composite — no dedicated machinery; a baked-in-edits design must build each as a separate hard feature', 'Users rarely undo', 'They ship in a later version'],
      correct: 1,
      explain: 'Get the data model right and the features fall out free; get it wrong and each one is a project. That is the correct amount of drama for a data model: all of it upfront.'
    }
  ],
  pitfalls: [
    'Baking "just one quick fix" into the dense base during prototyping. It works, it ships, and three weeks later the first script change regenerates the base and silently deletes a creator\'s work — the worst possible bug class (silent data loss) born from the earliest possible shortcut. The base is immutable from commit one.',
    'Letting the editor\'s preview interpolation drift from the renderer\'s. If the curve the creator sees (and drags) is computed by different easing code than the final render, every careful fix is a lie by a few frames — store easing on the segment, share the interpolation code path, and add a test asserting editor and renderer agree frame-for-frame.',
    'Storing gesture instances as loose keyframes instead of clips that own their template. The moment instantiation smears absolute keys onto channels, gestures stop being objects: un-draggable, un-retimeable, unaddressable by name ("the wave at 3.5") — and both the mouse and the LLM lose their handle. Clips own keys; channels receive them only at render time.'
  ],
  interview: [
    {
      q: 'Design the data model for editing AI-generated animation. What are the layers, and what does each guarantee?',
      a: 'Three layers with strict roles. (1) The dense base: the generative model\'s per-frame coefficient output (speech articulation, aliveness), stored immutable, tagged with its recipe (model version, audio hash) — regenerable at will, never hand-edited; its guarantee is fidelity to the source audio and cheap regeneration. (2) Sparse clips: gesture/template instances as objects owning their local-time keyframes plus parameters (start, duration scale, amplitude) — draggable, retimeable, and addressable by name; their guarantee is that designed motion stays a single grabbable, parameterized thing rather than smearing into anonymous keys. (3) The edit list: ordered, non-destructive delta records (channel, delta keyframes, easing stored on the segment, enabled flag, provenance) composited over base + clips at render time; its guarantees are undo/redo (list operations), A/B (the enabled flag), attribution (provenance), and — decisive for generated content — edits surviving base regeneration, because deltas re-apply when a script change rebuilds the dense layer. Rendering is one composite: base, plus instantiated clips, plus enabled edits, merged additively with per-channel clamps. The design test I would state explicitly: every input device — mouse drag, natural-language edit, future API — must write into the SAME structures; if two input paths would produce different representations of the same intent, the model is wrong.'
    },
    {
      q: 'A colleague proposes simplifying: convert the model\'s dense output into keyframes so "everything is one editable representation." Argue the design review.',
      a: 'The proposal optimizes for conceptual neatness and pays in both directions. Dense-to-sparse is lossy or useless: speech articulation legitimately varies at frame rate — mouth curves carry sync information the eye checks at 40-60 ms — so either simplification keeps thousands of keys (nothing gained; still un-editable in practice) or it smooths away articulation (audible, visible sync degradation). And once converted, the base loses its regeneration story: the original model output is gone, so a script change cannot rebuild speech motion under the creator\'s edits — you either re-run the model and discard all keys (losing every edit, the exact catastrophe non-destructive design exists to prevent) or you diff two keyframe soups (heuristic, fragile). The two-layer model is not an accident of history; it encodes a real semantic boundary — machine-generated performance versus human intent — and every mature tool in adjacent domains (DAW automation over rendered audio, compositor layers over footage, CAD features over solids) converged on the same split. What I would concede to keep the review constructive: a CURVE VIEW of the dense base for inspection (read-only visualization of what the model did) is genuinely useful and cheap — the mistake is not viewing dense data as curves; it is making that view the storage format.'
    },
    {
      q: 'Users complain that a dragged fix "keeps disappearing." Trace the likely causes through the data model.',
      a: 'The symptom names its suspects in order of likelihood. (1) The edit was baked, not layered: if any code path writes fixes into the dense base "for simplicity," the next base regeneration (script tweak, model upgrade, even a cache miss rebuilding channels) silently discards them — check the write path first; the fix is architectural, not a patch. (2) Absolute values instead of deltas: an edit stored as absolute channel values may APPEAR to vanish when the regenerated base shifts underneath it — the edit still applies but no longer produces the visible correction the creator made; deltas survive base changes semantically, absolutes only accidentally. (3) Identity instability: if edits anchor to frame indices but the base\'s timing changed (audio re-rendered slightly longer, fps config differs between preview and render), the delta lands at the wrong frames — edits should anchor to TIME, converting to frames at composite, and audio-content hashes should invalidate obviously-stale anchors with a user-visible "this fix may have moved" flag rather than silent misplacement. (4) The A/B trap: an enabled flag toggled off for comparison and never restored — trivial, common, worth an indicator in the UI ("2 edits muted"). (5) Cross-device sync dropping list entries (Part 6 territory): the edit list is the project file; a sync conflict resolved by last-write-wins can eat edits — needs list-merge semantics, not blob overwrite. The debugging gift the data model gives you: every edit has provenance and identity, so "disappeared" is answerable from the project file alone — which of these five happened is visible in the data, no reproduction required.'
    },
    {
      q: 'Explain arc-length parameterization to a junior engineer implementing a motion-path editor, including when it matters and how to test it.',
      a: 'Start with the bug they are about to ship: a Bézier path\'s parameter t is not distance — the curve\'s speed through space, |dP/dt|, varies with how the handles stretch each segment, so animating with evenly-stepped t makes the moving point visibly rush where the curve is stretched and crawl where it is compressed, despite "constant" parameter speed. Users perceive it immediately (a pointing hand that inexplicably accelerates mid-arc) and cannot explain it, which makes it a support-ticket generator. The fix: build a lookup table by sampling the curve finely and accumulating segment lengths — a map from t to cumulative distance s(t) with total L; to place the point at fraction f of its travel time under constant speed, find t such that s(t) = f·L (binary search + linear interpolation in the table). Deliberate easing then composes cleanly: warp f through the easing curve BEFORE the distance lookup — timing and geometry become independent, so bending the path never changes the speed profile and retiming never touches the shape. Rebuild the table on path edits only; per-frame cost is a table lookup. When it matters: any path the eye watches traversed — gestures, gaze sweeps, object motion; skip it for near-straight or sub-quarter-second paths and for non-spatial value interpolation, where "distance" has no meaning. Testing: sample the animated point at fixed time steps and assert successive positions are equidistant within tolerance on a deliberately pathological curve (one tight segment, one stretched) — that single property test catches both the missing reparameterization and future regressions from anyone "optimizing" the table away.'
    }
  ]
};
