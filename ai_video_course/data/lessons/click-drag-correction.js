window.LESSONS = window.LESSONS || {};
window.LESSONS['click-drag-correction'] = {
  id: 'click-drag-correction',
  title: 'Click-Drag Fixing: Direct Manipulation of Generated Motion on a Canvas',
  category: 'Part 4 — The Editing UX',
  timeMin: 40,
  summary: 'The user\'s original demand, verbatim: animating should be easy — "animate based on description and fix with click-drag." The data model made fixes representable; this lesson makes them grabbable. Direct manipulation is a discipline, not a widget: the thing you see is the thing you grab, feedback lands within a perceptual deadline, constraints act DURING the drag rather than complaining after, and releasing the mouse commits exactly one clean edit record. Underneath the feel, the actual engineering: a stack of coordinate transforms (where almost every drag bug lives), hit-testing with honest tolerances, and the drag-loop state machine that turns pixel motion into the deltas the last lesson defined.',
  goals: [
    'State the direct-manipulation contract: visible = grabbable, feedback under ~100 ms, constraints live during the drag, release commits one undoable edit',
    'Build the coordinate transform stack — screen ↔ canvas ↔ video-frame ↔ channel value — and name the two classic bugs (inverted Y, unscaled devicePixelRatio)',
    'Implement hit-testing with humane tolerances: nearest-within-radius, priority when targets overlap, and hover affordances that advertise grabbability',
    'Run the drag loop as a state machine: press → provisional preview (throttled, affected-channels-only recomposite) → release → one edit record with provenance',
    'Apply constraints as part of the drag itself: clamps, axis locks, and snapping — felt as physics, not delivered as error messages'
  ],
  concept: [
    {
      h: 'The contract: what "direct" actually promises',
      p: [
        'Direct manipulation earns its name through four promises. <b>Visible = grabbable</b>: whatever the creator can see wrong — a keyframe dot on a curve, a motion-path anchor over the video, a gesture clip\'s edge on the timeline — must be the literal thing their pointer grabs; no "select the object, then find its dialog, then locate the numeric field" indirection. <b>Immediate feedback</b>: the dragged thing follows the pointer and the CONSEQUENCE previews live — the head actually tilts in the preview while the keyframe moves; past ~100 ms of lag the object stops feeling held and starts feeling remote-controlled. <b>Constraints act during</b>: joint limits, snap targets, and axis locks shape the drag as it happens — the handle stiffens at a clamp instead of letting you place an illegal value and scolding you after. <b>Release commits one thing</b>: mouse-up produces exactly one edit record; undo removes the whole gesture, not forty pixel-increments.',
        'What gets overlays, in DenDen Studio, follows straight from the data model: <b>curve view</b> — channel values over time, dense base drawn read-only (inspection, per the design review), sparse edits and clip curves drawn grabbable; <b>spatial view</b> — motion paths and landmark positions drawn OVER the video frame (drag the path\'s anchor, the pointing hand\'s arc bends); <b>timeline view</b> — gesture clips as blocks (drag to move, edge-drag to stretch — writing exactly the clip fields from last lesson). Three views, one data model underneath: a drag in any of them writes the same records the LLM will write next lesson. That convergence was the design test, and this lesson is where it pays.'
      ]
    },
    {
      h: 'Coordinates: the transform stack where drag bugs are born',
      p: [
        'A pointer event arrives in <b>screen/client pixels</b>. The canvas may be CSS-scaled and sits at an offset — transform one: subtract the canvas origin, scale by <code>devicePixelRatio</code> (retina displays render the canvas at 2-3x its CSS size; forget this and every hit lands half an inch off — the second-most classic bug). The video preview is drawn letterboxed inside the canvas at some zoom — transform two: into <b>video-frame coordinates</b>, the space where landmarks and motion paths live (and the space the intake detector\'s geometry already uses — the same pixels, deliberately). For curve view, transform three maps pixels to <b>domain values</b>: x → time (via the visible range and zoom), y → channel value — and here lives THE classic bug: screen Y grows DOWNWARD while every value axis grows upward, so the mapping must invert, and the smoke test is drag-up-value-up on day one, every view, no exceptions.',
        'The discipline that keeps the stack sane: write each transform as a pure function WITH its inverse (<code>screen_to_value</code> / <code>value_to_screen</code>), compose rather than inline them, and never let arithmetic hide raw inside an event handler — the handler calls the named transform, full stop. Round-trip tests (<code>inverse(forward(p)) ≈ p</code> for random points, at devicePixelRatio 1 and 2, zoomed and scrolled) cost ten lines and catch the entire bug class: when a fix "lands somewhere else," the answer is ALWAYS one of these functions, and named pure functions make it a five-minute bisect instead of an afternoon of console.log in handlers.'
      ]
    },
    {
      h: 'Hit-testing and affordances: honest tolerances, advertised grabbability',
      p: [
        'A keyframe dot renders at 4 px; nobody can click a 4 px target reliably — and on touch, a fingertip is ~40 css-px of ambiguity. Hit-testing is therefore <b>nearest-within-radius</b>: measure distance from the pointer to every candidate (in the candidate\'s own coordinate space, POST-transform — testing in screen space against untransformed positions is bug three), accept the nearest within a tolerance (8-12 px pointer, 20+ touch), and when candidates overlap, break ties by <b>priority</b>: the already-selected object wins (so a fine adjustment near a neighbor does not steal the grab), then smaller/harder targets over larger ones (a keyframe dot beats the curve segment under it; the curve beats the background pan). For paths and curves, distance is point-to-SEGMENT, not point-to-anchor — creators grab the line between keys expecting to bend it, and that grab should work (inserting a key or bending the segment, per design).',
        'Affordances close the loop before any click: hover swells the dot and changes the cursor (grabbable is ADVERTISED, not discovered by trial), the grabbed object visibly attaches (color, slight scale), a <b>ghost</b> of the original position stays faintly visible during the drag (before/after in one glance — the A/B instinct, live), and constraint proximity telegraphs (the snap target glows as you approach; the clamp boundary draws as a subtle wall). None of this is decoration: every affordance answers a question the creator would otherwise answer by clicking wrong — what can I grab, what am I holding, where was it, and what is about to happen if I release.'
      ]
    },
    {
      h: 'The drag loop: from pixels to one clean edit',
      p: [
        'The loop is a small state machine. <b>Press</b>: hit-test; on hit, record the anchor (pointer position, object\'s original value, timestamp) and capture the pointer (drags continue outside the canvas — losing the object at the window edge is amateur hour). <b>Move</b>: transform pointer → domain, apply constraints IN DOMAIN SPACE (clamp to channel limits — the same [lo, hi] the composite enforces, so the drag can never even propose what the renderer would reject; axis lock if shift is held; snap to frame boundaries or neighbor keys within a snap radius, with snapping applied AFTER clamping), update the <b>provisional</b> value, and request a preview recomposite — throttled to animation frames, and recomputing only the affected channels over only the affected time range (the data model\'s sparsity making the <100 ms promise affordable). <b>Release</b>: discard the provisional state and write ONE edit record — channel, delta keys (new minus original), easing default, <code>provenance: \'drag\'</code> — through the same API the LLM editor will use. <b>Escape</b> cancels: provisional state vanishes, nothing was ever written.',
        'Two commitments in that design deserve emphasis. Provisional-until-release means the edit list stays clean — no forty-records-per-drag pollution, no "undo undoes one pixel," and cancel is free because nothing was committed. And constraints-in-domain-space means the physics is real: the drag literally cannot exceed a joint limit because the transform clamps before the preview ever sees the value — the handle visibly stiffens at the wall, teaching the limit by feel. Compare the alternative everyone builds once: free drag, validate on release, error toast "value out of range." Same rule, delivered as rejection instead of physics — and the difference between a tool that feels like clay and a tool that feels like a form with a strict clerk is exactly this choice, repeated everywhere.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Act III: The Mayor\'s Hands, the Stiffening Rods, and the Mirrored Scroll',
      text: 'The portrait theater\'s third act begins with a communication breakdown. The mayor keeps requesting fixes in words — "the pointing should be... more toward the harbor, and prouder, but not so much" — and after four rounds of Usopp adjusting rod-numbers on the overlay scroll and the mayor squinting and saying "no, the OTHER prouder," Franky loses patience and rebuilds the interface overnight. His invention: guide-handles. Every adjustable rod now ends in a brass grip the mayor can simply TAKE — grab the arm-rod\'s grip, move the painted arm where you want it, and the rig writes the correction onto the overlay scroll automatically, in rod-numbers the mayor never sees. The mayor\'s first grab converts him instantly: the arm follows his hand, the portrait\'s pose changes as he moves it, and a faint chalk ghost holds the arm\'s ORIGINAL position beside the new one so he can compare with one glance. Franky\'s engineering hides everywhere in the feel. The grips are fat — "harbor hands miss thin handles" — and when two grips sit close, the rig favors the one the mayor grabbed last, so fine-tuning the wrist never accidentally steals the elbow. The rods stiffen at the joints\' safe limits: pull the arm past where a shoulder bends and the handle simply stops, firmly, wordlessly — "the rig argues with your hand, not with your ears," Franky says, having watched Usopp\'s rod-number sessions end in shouting. Rehearsal-proven poses are cut as shallow detents into the guide tracks: near a detent, the handle tugs gently toward it and clicks home — and holding the grip against a detent\'s pull glides past it for the times the mayor truly wants between. Release is sacred: only when the mayor lets GO does the rig ink one clean correction onto the overlay — his whole adjustment as a single mark, which Nami can peel off whole if he changes his mind ("one grab, one mark, one regret"). And the bug that nearly ruined opening week: Usopp\'s apprentice mounted the overlay scroll BEHIND the translucent master instead of in front, reading every correction mirrored — the mayor dragged the arm toward the harbor and the recorded fix moved it toward the tavern. One flipped mounting bracket later, Franky adds a ritual to every setup: grab a test-handle, drag it up, and confirm the mark goes up. "Every haunted rig I have ever fixed," he tells the apprentice, "was a mirror somewhere in the linkage."'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Howard\'s Robot Arm: Typed Coordinates, the Glove, and the Backwards Camera',
      text: 'Howard demos the university\'s salvage-grade robotic arm to the gang, controlling it the way the manual insists: typed joint coordinates. "Elbow to forty-one point five degrees," he narrates, typing. The arm lurches. "Wrist minus twelve." The arm knocks over Sheldon\'s tea. Sheldon\'s critique is, for once, everyone\'s: "Your interface requires translating spatial intent into numbers, executing blind, observing the error, and iterating. You have built the world\'s most expensive game of Battleship." Howard\'s redemption arc is the glove — a motion-capture glove that maps his hand\'s position straight onto the arm\'s grip point: move your hand, the arm follows, live. The demo transforms: Raj asks for the arm "a little left, and gentler," and instead of arithmetic, Howard just... moves it. The engineering conversation happens in the details, mostly via disasters narrowly avoided. The arm\'s safety envelope is mapped into the glove as resistance — approach a pose that would strike the table and the glove\'s haptics stiffen to a wall, so Howard\'s hand LEARNS the limits without a single beep ("the arm used to scream E-STOP after the mistake; the glove refuses the mistake while it is still a twitch"). Frequently-used poses live as magnetic detents — hover near "park position" and the glove tugs; push through deliberately and it yields. Bernadette, watching Howard fumble tiny adjustments near two close targets, points out the fix his own firmware needed: "It keeps grabbing the wrong target — make it prefer whatever he adjusted last." The commit rule comes from Leonard after reviewing the logs: the glove streams provisional motion, but the arm\'s controller records a maneuver only when Howard\'s hand OPENS — one grab, one logged maneuver, one thing to undo when Sheldon demands the tea incident be "stricken from the record." And the episode\'s running gag is the day the overhead camera feed came up MIRRORED: Howard drags left, the on-screen arm goes right, and he chases his own correction in circles for ten minutes — Raj finally flips the display and tapes a note to the monitor: DRAG UP. CONFIRM UP. EVERY SETUP. "Every haunted robot," Howard concedes, "has a mirror in it somewhere."'
    },
    why: 'The mayor\'s failed "more toward the harbor, but prouder" sessions and Howard\'s typed joint coordinates are the indirect interface this lesson replaces: translating spatial intent into words or numbers, executing blind, iterating on error — Battleship. The guide-handles and the glove are direct manipulation delivering the four-promise contract: the visible thing is the grabbed thing; the consequence previews live (the portrait poses, the arm follows); constraints act DURING the motion as physics (stiffening rods, haptic walls, magnetic detents that yield to deliberate push — clamps and snapping felt, not error-toasted); and release commits exactly one record (one grab, one mark, one maneuver, one regret) onto the non-destructive overlay from last lesson. The fat grips, last-adjusted-wins tie-breaking, and chalk ghost are hit-tolerances, grab priority, and the before/after affordance. And both stories enshrine the same haunted-rig diagnosis as the coordinate-stack section: the mirrored scroll and the backwards camera are the inverted-axis transform bug, with the identical smoke-test ritual — drag up, confirm up, every setup — because every haunted rig has a mirror somewhere in the linkage.'
  },
  tech: [
    {
      q: 'Why must constraints (clamps, snapping) run inside the drag loop in domain space, rather than validating the value on release?',
      a: 'Three compounding reasons. Feel: constraint-during-drag is physics — the handle stops at the joint limit, the snap target tugs — and the creator\'s hand learns the rules without reading anything; validate-on-release is a clerk rejecting a form after you filled it out, and every rejection is a round-trip of wasted intent. Preview honesty: the live preview renders the provisional value — if the drag can hold an illegal value, the preview shows the creator something the renderer will refuse or clamp differently at commit, so what they approved is not what they get; clamping in domain space before the preview means the preview IS the contract. Correctness of the commit itself: converting to domain space first and clamping there uses the same [lo, hi] the composite enforces (one source of truth for limits), whereas screen-space or post-hoc validation duplicates the rule and the duplicates drift. Order matters within the loop too: clamp first, THEN snap (snapping to a target outside the legal range would un-clamp), and axis locks apply before both. The uniform principle: by the time a value reaches preview or commit, it is already legal — illegality is unrepresentable in the drag\'s output, the same make-invalid-states-impossible instinct as constrained decoding in Part 1.'
    },
    {
      q: 'The preview must recomposite while the pointer moves. Budget it: what makes <100 ms affordable, and what do you do when a channel edit genuinely requires an expensive re-render?',
      a: 'Exploit the data model\'s sparsity three ways. Scope by channel: a drag touches ONE channel (or one clip\'s channels) — recomposite only those, leaving every other channel\'s cached composite untouched. Scope by time: the edit\'s delta keys span a known range (plus easing falloff) — recompute only frames inside it; a 0.5 s nod fix is ~12 frames of one channel, microseconds of arithmetic. Scope by fidelity: the preview during drag renders the CHEAP consequence — the coefficient curves and a lightweight proxy of the avatar (the 2.5D warp or a low-res render), not the full offline-quality render; full quality returns on release or idle. That covers coefficient edits, which is most drags. When the edit invalidates something genuinely expensive — dragging a gesture that overlaps the ambient generative layer, or editing on a machine where even proxy rendering is slow — degrade the preview honestly rather than lag: freeze the video frame and animate only the OVERLAY (curves, path, landmarks) during the drag, then re-render on release with a progress affordance; or render the proxy at reduced resolution (the live pipeline\'s ladder, reused verbatim). The one forbidden option is letting preview latency stretch past ~100-150 ms while claiming to be live — a laggy "direct" manipulation is worse than an honest indirect one, because the hand keeps correcting against stale feedback and oscillates.'
    },
    {
      q: 'Your hit-testing feels wrong to users: "it grabs the wrong thing." Enumerate the actual failure modes hiding under that complaint.',
      a: 'Five distinct bugs share that costume. (1) Transform mismatch: testing pointer position against object positions in different spaces — screen-space pointer vs unscaled canvas coords (devicePixelRatio), or pre-zoom vs post-zoom — so hits land offset; diagnose with a debug overlay drawing the hit radius around the pointer IN THE OBJECT SPACE. (2) Tolerance dishonesty: radius tuned on a mouse at 1x, unusable on touch or high-DPI — tolerances must be input-modality-aware (8-12 px pointer, 20+ touch) and specified in CSS pixels, then transformed. (3) Priority inversion: nearest-wins with no tie-breaking, so the big easy target (the curve, the clip body) steals from the small hard one (the keyframe dot, the clip edge) that is almost always the intent — priority ordering (selected object first, then smaller/rarer targets) fixes the felt accuracy without touching distances. (4) Missing segment testing: only anchors are hittable, so grabbing the line BETWEEN keys — the natural gesture for bending a curve — falls through to the background pan; point-to-segment distance belongs in the candidate set. (5) State leakage: the hit set not updating after an edit (a deleted key still grabs; a moved clip\'s old bounds still hit) — hit candidates must derive from the same data the renderer draws, never from a stale parallel list. The meta-fix for all five: a debug mode rendering every hit region and the transformed pointer live — hit bugs are invisible in code review and obvious on screen.'
    }
  ],
  code: {
    title: 'The drag loop and transform stack, as they actually get written',
    intro: 'Browser-flavored pseudocode for the curve-view editor: named pure transforms, nearest-within-radius hit-testing, and the press/move/release state machine committing one record into last lesson\'s edit list.',
    code: `// ---- transforms: pure, named, inverse-paired ------------------------
function screenToDomain(ev, view) {
  const r = view.canvas.getBoundingClientRect();
  const px = (ev.clientX - r.left) * devicePixelRatio;  // bug #2 lives here
  const py = (ev.clientY - r.top) * devicePixelRatio;
  return {
    t: view.t0 + (px / view.canvasW) * (view.t1 - view.t0),
    v: view.vTop - (py / view.canvasH) * (view.vTop - view.vBottom),
  };                       // NOTE the minus: screen Y down, value up (bug #1)
}
// domainToScreen(...) is the exact inverse; round-trip tested.

// ---- hit-testing: nearest within radius, priority-ordered ------------
function hitTest(pt, candidates, tolPx, view) {
  let best = null;
  for (const c of candidates) {              // keyframe dots, then segments
    const d = distPx(domainToScreen(c.pos, view), pt);
    const tol = c.kind === 'segment' ? tolPx : tolPx * 1.25;
    if (d <= tol && (!best || d < best.d - (c.selected ? 4 : 0)))
      best = { c, d };                       // selected wins near-ties
  }
  return best && best.c;
}

// ---- the drag state machine ------------------------------------------
let drag = null;                             // null | {obj, orig, prov}

canvas.onpointerdown = (ev) => {
  const obj = hitTest(pointerPx(ev), hitCandidates(), 10, view);
  if (!obj) return;
  canvas.setPointerCapture(ev.pointerId);    // drags survive leaving canvas
  drag = { obj, orig: obj.value, prov: obj.value };
};

canvas.onpointermove = (ev) => {
  if (!drag) return;
  let v = screenToDomain(ev, view).v;
  v = clamp(v, CHANNEL_LIMITS[drag.obj.channel]);   // physics: clamp FIRST,
  v = snap(v, snapTargets(drag.obj), SNAP_RADIUS);  //   then snap
  drag.prov = v;
  requestPreview(() =>                       // throttled to rAF; only the
    recompose(drag.obj.channel,              //   affected channel + range
              drag.obj.timeRange, drag.prov));
};

canvas.onpointerup = () => {
  if (!drag) return;
  if (drag.prov !== drag.orig)
    project.edits.push({                     // ONE record, same API the
      channel: drag.obj.channel,             //   LLM editor uses next lesson
      keys: deltaKeys(drag.obj, drag.prov - drag.orig),
      easing: 'ease_in_out', enabled: true,
      provenance: 'drag',
    });
  drag = null;                               // provisional state vanishes
};
// Escape key: drag = null; requestPreview(recomposeAll) - free cancel,
// because nothing was ever written until pointerup said so.`,
    notes: [
      'The two marked bug sites — devicePixelRatio and the Y-axis minus — are the transform stack\'s classics: tape Franky\'s ritual to the monitor (drag up, confirm up) and round-trip-test the transform pair at DPR 1 and 2.',
      'pointerup writing through project.edits.push is the convergence promise kept: the mouse and next lesson\'s LLM are two input devices emitting identical records — undo, A/B, provenance, and regeneration-survival come from the data model, not from either device.'
    ]
  },
  lab: {
    title: 'The transform pair and the hit test — the drag loop\'s load-bearing math',
    prompt: 'Three functions. (1) <code>screen_to_value(y_px, top_px, height_px, v_top, v_bottom)</code>: map a screen Y (pixels, growing DOWNWARD) inside a plot region (top edge <code>top_px</code>, height <code>height_px</code>) to a channel value, where the region\'s top edge means <code>v_top</code> and the bottom edge means <code>v_bottom</code> — and clamp results into the [v_bottom, v_top] range for pointers outside the region. (2) <code>value_to_screen(v, top_px, height_px, v_top, v_bottom)</code>: the exact inverse (unclamped). (3) <code>hit_test(points, x, y, radius, selected_id)</code>: <code>points</code> is a list of <code>{"id", "x", "y"}</code>; return the id of the nearest point within <code>radius</code> (Euclidean), with the tie-break that the point whose id equals <code>selected_id</code> wins any contest it is within 4 px of winning (its distance is reduced by 4 before comparison); return <code>None</code> on no hit.',
    starter: `def screen_to_value(y_px, top_px, height_px, v_top, v_bottom):
    # screen Y grows DOWN; value grows UP. Clamp into [v_bottom, v_top].
    pass

def value_to_screen(v, top_px, height_px, v_top, v_bottom):
    # exact inverse of the above (no clamping)
    pass

def hit_test(points, x, y, radius, selected_id=None):
    # nearest within radius; selected point gets a 4px advantage
    pass`,
    checks: [
      { re: 'def\\s+screen_to_value\\s*\\(', flags: '', must: true, hint: 'Define screen_to_value(y_px, top_px, height_px, v_top, v_bottom).', pass: 'screen_to_value defined ✓' },
      { re: 'def\\s+value_to_screen\\s*\\(', flags: '', must: true, hint: 'Define value_to_screen — every transform ships with its inverse.', pass: 'inverse transform defined ✓' },
      { re: 'def\\s+hit_test\\s*\\(', flags: '', must: true, hint: 'Define hit_test(points, x, y, radius, selected_id).', pass: 'hit_test defined ✓' },
      { re: 'selected_id', flags: '', must: true, hint: 'The selected point wins near-ties — fine adjustment must not steal the grab.', pass: 'selection priority ✓' },
      { re: '\\*\\*\\s*2|sqrt|hypot', flags: '', must: true, hint: 'Hit distance is Euclidean.', pass: 'euclidean distance ✓' }
    ],
    tests: `# plot region: top at 50px, 200px tall; values +1.0 (top) .. -1.0 (bottom)
assert screen_to_value(50, 50, 200, 1.0, -1.0) == 1.0, 'top edge = v_top'
assert screen_to_value(250, 50, 200, 1.0, -1.0) == -1.0, 'bottom = v_bottom'
assert abs(screen_to_value(150, 50, 200, 1.0, -1.0) - 0.0) < 1e-9, 'middle'
assert abs(screen_to_value(100, 50, 200, 1.0, -1.0) - 0.5) < 1e-9, \
    'UP the screen means UP in value - the mirrored-scroll bug, tested'
assert screen_to_value(10, 50, 200, 1.0, -1.0) == 1.0, 'outside: clamped'

for v in [-1.0, -0.25, 0.0, 0.7, 1.0]:
    y = value_to_screen(v, 50, 200, 1.0, -1.0)
    back = screen_to_value(y, 50, 200, 1.0, -1.0)
    assert abs(back - v) < 1e-9, 'round-trip must be exact: ' + str(v)

pts = [{'id': 'a', 'x': 100, 'y': 100}, {'id': 'b', 'x': 106, 'y': 100}]
assert hit_test(pts, 104, 100, 10) == 'b', 'nearest wins: b at d=2, a at d=4'
assert hit_test(pts, 104, 100, 10, selected_id='a') == 'a', \
    'selected a (d=4, advantage->0) beats b (d=2)? 4-4=0 < 2: yes'
assert hit_test(pts, 300, 300, 10) is None, 'nothing within radius'
assert hit_test(pts, 100, 109, 10) == 'a', 'vertical distance counts too'
print('transforms and hit test correct')`,
    solution: `def screen_to_value(y_px, top_px, height_px, v_top, v_bottom):
    frac = (y_px - top_px) / height_px
    v = v_top - frac * (v_top - v_bottom)
    return max(v_bottom, min(v_top, v))

def value_to_screen(v, top_px, height_px, v_top, v_bottom):
    frac = (v_top - v) / (v_top - v_bottom)
    return top_px + frac * height_px

def hit_test(points, x, y, radius, selected_id=None):
    best_id, best_d = None, None
    for p in points:
        d = ((p['x'] - x) ** 2 + (p['y'] - y) ** 2) ** 0.5
        if d > radius:
            continue
        eff = d - 4 if p['id'] == selected_id else d
        if best_d is None or eff < best_d:
            best_id, best_d = p['id'], eff
    return best_id`,
    notes: [
      'The round-trip test loop is the ten lines that catch the whole transform bug class — run it at devicePixelRatio 1 and 2 in the real editor, zoomed and scrolled, and haunted-rig season ends.',
      'The selected-point advantage is small (4 px) on purpose: it must win NEAR-ties so fine adjustment does not lose its grip, without becoming sticky enough to steal genuinely different grabs.'
    ]
  },
  quiz: [
    {
      q: 'The core contract of direct manipulation is:',
      options: ['Every object has a properties dialog', 'The visible thing is the grabbable thing, consequences preview live under ~100 ms, constraints act during the drag, and release commits one undoable record', 'All edits go through a command palette', 'The canvas is read-only until unlocked'],
      correct: 1,
      explain: 'Four promises: visible = grabbable, immediate feedback, constraints as physics, one grab = one edit. Miss any one and the tool stops feeling like clay.'
    },
    {
      q: 'A creator drags a keyframe up and the value goes DOWN. The bug is almost certainly:',
      options: ['A GPU driver issue', 'A missing Y-axis inversion in the screen→value transform — screen Y grows downward, values grow upward', 'The edit list is out of order', 'Snapping is too aggressive'],
      correct: 1,
      explain: 'The mirrored-scroll bug. Drag up, confirm up, every setup — and round-trip-test the transform pair so the mirror cannot creep back in.'
    },
    {
      q: 'Clamping runs inside the drag loop (before preview) rather than as validation on release because:',
      options: ['It is faster to compute', 'The constraint becomes physics the hand learns — and the preview only ever shows values the renderer would accept, so what the creator approves is what they get', 'Release events are unreliable', 'Clamping needs the GPU'],
      correct: 1,
      explain: 'The handle stiffens at the wall instead of an error toast after the fact — and illegality becomes unrepresentable in the drag\'s output, the make-invalid-states-impossible instinct again.'
    },
    {
      q: 'During a drag, the preview recomposite stays under budget mainly because:',
      options: ['The GPU is always free during drags', 'Sparsity scopes the work: one channel, one time range, proxy-fidelity rendering — everything else stays cached', 'Previews render at 1 fps', 'The base layer is skipped entirely'],
      correct: 1,
      explain: 'A 0.5s nod fix is a dozen frames of one channel plus a cheap proxy render. The data model\'s sparsity is what makes the <100 ms promise affordable.'
    },
    {
      q: 'Committing one edit record on pointer-up (rather than streaming records during the drag) matters because:',
      options: ['It reduces network traffic', 'Undo granularity matches intent — one grab, one record, one regret — and Escape-cancel is free because nothing was written until release', 'Edit lists have a size limit', 'Pointer events are batched by the OS'],
      correct: 1,
      explain: 'Provisional-until-release keeps the edit list clean: undo removes the gesture, not forty pixel increments, and cancel never has to clean anything up.'
    }
  ],
  pitfalls: [
    'Inlining coordinate arithmetic inside event handlers instead of named, inverse-paired, round-trip-tested transform functions. Every "the fix landed somewhere else" bug lives in that arithmetic, and handlers full of raw math turn a five-minute bisect into an afternoon of console.log.',
    'Tuning hit tolerances on your own mouse at devicePixelRatio 1 and shipping. Touch input, retina displays, and zoomed views each break a hardcoded radius differently — specify tolerances in CSS pixels, transform them with everything else, and widen for touch.',
    'Letting the preview lag past ~150 ms while still tracking the pointer. The hand corrects against stale feedback and oscillates — a laggy "direct" manipulation is worse than an honest indirect one. Degrade preview fidelity (freeze video, animate overlay only) before degrading responsiveness, exactly like the live pipeline\'s ladder.'
  ],
  interview: [
    {
      q: 'Design the click-drag editing surface for AI-generated animation. What are the components and where do bugs concentrate?',
      a: 'Three views over one data model: a curve view (channel values over time — dense base read-only, sparse edits and clip curves grabbable), a spatial view (motion paths and landmarks overlaid on the video frame), and a timeline view (gesture clips as draggable, stretchable blocks). All three write identical non-destructive records — the same structures a language-based editor writes — so undo, A/B, and provenance come from the data model, not the UI. Components per view: a transform stack (screen → canvas → video-frame/domain, each a named pure function shipped with its inverse and round-trip tests), hit-testing (nearest-within-radius in post-transform space, modality-aware tolerances, priority ordering with the selected object winning near-ties, point-to-segment distance for curves), the drag state machine (press captures pointer and anchors state; move transforms, clamps in domain space, snaps, and requests a throttled affected-scope-only preview; release commits ONE record with provenance; Escape cancels free), and affordances (hover advertising grabbability, ghost of the original, constraint telegraphing). Bugs concentrate in exactly two places: the transform stack — inverted Y and unscaled devicePixelRatio are the classics, caught by round-trip tests and the drag-up-confirm-up ritual — and hit-testing\'s space/priority mismatches, caught by a debug overlay rendering hit regions live. The design principle over all of it: constraints act during the drag as physics, so illegal values are unrepresentable in the editor\'s output.'
    },
    {
      q: 'Why is "validate on release with a clear error message" the wrong constraint model for a manipulation UI, when it is the RIGHT model for a form or an API?',
      a: 'Because the two interfaces make different promises about time. A form is batch: the user composes a complete intent, submits, and expects adjudication — validation-after matches the interaction\'s rhythm, and a good error message is the correct currency. Manipulation is continuous: the user is steering, sampling feedback dozens of times per second and correcting course mid-motion — an error delivered after release arrives AFTER the intent was fully formed and executed, wasting the entire steering session and teaching nothing during it. Constraint-during-drag converts the rule into terrain the hand explores: the handle stops at the clamp, the snap tugs, and the user learns the legal space by feel, often without ever knowing the rule\'s name. There is also a correctness argument beyond feel: the live preview renders provisional values, so an unconstrained drag shows the user states the system will later refuse — the preview lies, and approval of a lie is worse than rejection of an honest attempt. And a consistency argument: the drag\'s clamp must be THE SAME [lo, hi] the render composite enforces — one source of truth — whereas validate-on-release invites a second implementation that drifts. Where the form model still applies in an editor: destructive or non-continuous operations (delete a clip, change a project setting) — discrete intents, correctly adjudicated discretely. The skill is matching the constraint model to the interaction\'s tempo, not championing one model everywhere.'
    },
    {
      q: 'Your editor\'s preview must update live during drags, but a full-quality render takes 4 seconds. Architect the feedback loop.',
      a: 'Tiered fidelity against a hard responsiveness budget. Tier one, always under ~16 ms: the overlay itself — the dragged curve, path, or clip block moves with the pointer unconditionally; the manipulation layer NEVER lags, even if everything beneath it freezes. Tier two, target under ~100 ms: consequence preview at proxy fidelity — recomposite only the affected channels over the affected time range (sparsity makes this microseconds of arithmetic) and drive a cheap avatar proxy: the 2.5D warp, a low-resolution render, or for spatial paths just the path traversal dot; throttle to animation frames and coalesce pointer events (render the latest state, drop intermediate ones — steering needs currency, not completeness). Tier three, on release or idle: queue the real 4-second render, with the committed edit already written so the creator can continue working; show its progress unobtrusively and swap the preview when it lands — and cancel-and-restart it if a new drag begins (stale renders are worthless; the queue holds at most one pending full render per region). When even the proxy blows the budget (weak hardware, ambient-layer interactions), degrade honestly DOWN the same ladder: freeze the video frame and animate overlay-only during the drag, full stop — never let tier two\'s latency stretch while pretending to be live, because a hand correcting against stale feedback oscillates and the tool feels broken. The architecture is the live pipeline\'s degradation ladder transplanted into the editor: fixed responsiveness, negotiable fidelity, and every tier honest about which it is.'
    },
    {
      q: 'A QA report says: "dragging works on my machine but users report grabbing the wrong things and fixes landing in wrong places." What is your systematic investigation?',
      a: 'Both symptoms point at the transform/hit layer varying across environments, so I would instrument before guessing. (1) Reproduce the environment matrix: devicePixelRatio (retina vs 1x — unscaled DPR is the single most likely culprit for "wrong places"), browser zoom, touch vs mouse, and window scaling; the bug that "works on my machine" almost always lives in a factor that differs between machines, and DPR tops that list. (2) Turn on the debug overlay: render the transformed pointer position and every hit region live — transform bugs become instantly visible as an offset between where the cursor looks and where the system thinks it is; hit-priority bugs show as overlapping regions with the wrong winner. (3) Run the round-trip tests in the failing environment: inverse(forward(p)) ≈ p at that DPR and zoom — a failure isolates which named transform drifted; if the transforms pass but hits still miss, the bug is hit-testing in the wrong space (screen-space pointer against domain-space candidates). (4) Audit tolerance assumptions: hardcoded pixel radii shrink on high-DPI and are hopeless on touch — tolerances belong in CSS pixels, transformed alongside coordinates, widened per input modality. (5) Check for stale hit candidates: regions derived from a cached list rather than the currently-rendered data grab deleted or moved objects. Fix order: transforms first (everything depends on them), then hit space, then tolerances, then staleness — and the permanent fixture afterward is the transform round-trip suite running in CI across DPR 1/2 plus the drag-up-confirm-up smoke test in every release checklist, because this bug class regresses whenever anyone touches view code.'
    }
  ]
};
