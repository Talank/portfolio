window.LESSONS = window.LESSONS || {};
window.LESSONS['animating-from-a-description'] = {
  id: 'animating-from-a-description',
  title: 'Animate by Description: Text-Guided Motion for a Single Image',
  category: 'Part 3 — Making Pictures Talk',
  timeMin: 40,
  summary: 'The creator types "she waves at the start, then leans in excitedly, hair blowing gently" — and the avatar does it. Two fundamentally different machines can grant that wish: a parameterized GESTURE LIBRARY driven through the coefficient system you already have (predictable, editable, composable — but only as expressive as the library), and generative image-to-video diffusion in the AnimateDiff/Stable-Video-Diffusion family (open-ended, gorgeous when it works — and unrepeatable, uneditable, expensive). DenDen Studio ships the hybrid: the LLM director decomposes descriptions into library gestures wherever possible and reserves generative motion for the ambient layer, composited on top. This lesson builds all three pieces of that judgment.',
  goals: [
    'Contrast the two routes from text to motion — parametric gesture instantiation vs generative video diffusion — by predictability, editability, cost, and expressive range',
    'Design a gesture library: named, parameterized motion templates over the coefficient channels from the talking-head lesson',
    'Explain at block level how AnimateDiff/SVD-class models generate motion, what text can and cannot steer, and their clip-length and identity limits',
    'Assemble the hybrid: LLM decomposition into gestures where possible, generative motion for the ambient layer, all composited by layering rules',
    'Route the decomposition through the structured-output machinery from Part 1 — the gesture schema is the tool-calling lesson\'s enum, grown up'
  ],
  concept: [
    {
      h: 'Route one: a library of named, parameterized moves',
      p: [
        'The talking-head lesson left you with coefficient streams — head pose, expression dimensions, per frame. A <b>gesture</b> is simply a reusable template over those channels: <code>wave</code> is a two-second curve set (arm/hand channels if the rig has them, wrist rotation, slight head tilt), <code>nod_emphatic</code> is a pitch-axis dip-and-return, <code>lean_in</code> eases the head-scale and pitch channels forward. Each template exposes <b>parameters</b> — amplitude (a "bigger" wave scales the curve), duration (stretch the timeline), handedness, easing — and instantiating one at time t means: scale the template\'s curves, shift them to t, and merge them into the timeline.',
        'The library route\'s virtues are exactly a product\'s virtues. <b>Predictable</b>: "wave" produces the same wave every render — creators build intuition, support can reproduce bugs. <b>Editable</b>: an instantiated gesture is data on the timeline — Part 4\'s click-drag mutates its parameters, and "make the wave bigger" is one amplitude write. <b>Composable</b>: gestures layer (a nod DURING a lean), subject to merge rules the lab implements. <b>Cheap</b>: instantiation is arithmetic; only re-rendering costs GPU. The honest limit: the library IS the vocabulary — ask for "does a cartwheel" and the answer is "not in the library" (and for a talking-portrait product, correctly so). Library design is therefore curation: 20–40 well-made, well-NAMED gestures covering what talking avatars actually do — greeting, emphasis, pointing, reacting, idling — beats 300 mediocre ones the LLM cannot choose between (the tool-count lesson from Part 1, recurring).'
      ]
    },
    {
      h: 'Route two: generative motion — diffusion learns to move pictures',
      p: [
        'The generative route asks a video diffusion model to do it all: condition on the source image (and a text prompt), and denoise a whole video clip into existence. Block-level mechanics: these models extend image diffusion with <b>temporal layers</b> — AnimateDiff\'s insight was a plug-in "motion module" trained on video that snaps into existing image-diffusion backbones; SVD-class models are trained image-to-video natively. The image conditions the output (first frame or reference), the text steers content and motion, and the model dreams a few seconds of coherent video.',
        'What text actually steers, in practice: global and ambient motion very well ("hair blowing", "gentle camera push-in", "leaves falling behind her", "flickering candlelight") — the model has seen oceans of such footage. Precise, body-part-specific action poorly ("waves with her left hand at exactly 2 seconds" produces A wave, MAYBE, some hand, sometime — or a physically creative reinterpretation). And the engineering costs are structural, not version-number problems: clips run short (a few seconds; longer needs stitching, and drift accumulates), identity is not guaranteed (the face can subtly wander off-model mid-clip — alarming for an avatar product whose entire premise is THIS face), every generation is a fresh sample (same prompt, different result — "again, but smaller" is a new lottery ticket), and the output is pixels: no handles, no Part 4 editing, ever. Diffusion motion is a paintbrush, not a puppeteer.'
      ]
    },
    {
      h: 'The hybrid: decompose, route, composite',
      p: [
        'Read the creator\'s sentence again: "she waves at the start, then leans in excitedly, hair blowing gently." It decomposes cleanly — and the decomposition IS the architecture. "Waves at the start" and "leans in excitedly" are <b>subject actions</b>: precise, timed, on-the-avatar — gesture library, instantiated as keyframes (wave at t≈0.5, amplitude up because "excitedly"; lean_in following). "Hair blowing gently" is <b>ambient motion</b>: imprecise, continuous, atmospheric — exactly what generative motion steers well, rendered as a background/overlay layer. Who decomposes? The LLM director, with the machinery you built in Part 1: a schema whose gesture names are an ENUM of the actual library (constrained decoding makes off-library gestures unpickable — the tool-registry allowlist, again), timestamps validated against clip duration (the same validate_plan bones), and ambient requests as free-text prompts for the generative layer, where imprecision is the accepted contract.',
        'Then <b>compositing</b> stacks the layers: the talking-head render (speech + aliveness, from last lesson) is the base; gesture coefficients merged into its timeline BEFORE rendering (they share the channel system — that is why the library lives on coefficients); generative ambient motion rendered as a separate pass and blended (background regions, hair/clothing edges) — with masks derived from, once more, the intake detector\'s geometry. The result honors the whole product promise: the described animation happens, the subject\'s motion stays editable (it is keyframes), the ambient magic stays cheap to disable when it misbehaves (it is a layer), and nothing about the face\'s identity was gambled on a diffusion sample.'
      ]
    },
    {
      h: 'When the library says no: extension, fallback, and honesty',
      p: [
        'A real creator will eventually type "she juggles three flaming torches." The router\'s options, in order of product sanity: (1) <b>Nearest-gesture with disclosure</b> — the LLM maps to the closest library concept and says so ("no juggling gesture — used \'animated hand movement\' instead; want it bigger?"). Silent substitution feels like a bug; disclosed substitution feels like a collaborator. (2) <b>Generative one-shot with expectations set</b> — offer the diffusion route for the special moment, marked as a take: "generated variants — pick one, but these cannot be click-edited later." True, honest, occasionally delightful. (3) <b>Library extension</b> — if the ask recurs (analytics on unmatched requests is a real signal), an animator or a motion-capture-to-coefficient tool adds a proper parameterized gesture; the vocabulary grows where demand proves out.',
        'What the router must never do: let the LLM freestyle coefficient values for unknown actions. It will happily emit plausible-looking numbers for "juggling" — arms flailing through un-designed curve space, clipping through the face, reading as seizure rather than performance. The gesture enum in the schema is not a limitation to apologize for; it is the same discipline as the tool registry and the stage allowlist — the LLM chooses from what exists, parameterizes within validated ranges, and everything beyond the vocabulary routes to explicit fallbacks. Constrained vocabulary plus honest fallback is how the feature stays magical INSTEAD of intermittently horrifying, which is the actual bar for shipping animation to non-experts.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Act II of the Portrait Theater: the Move-Scroll Book and the Painter of Winds',
      text: 'The talking portrait was such a success that the mayor commissions Act II: the founding captain must GESTURE — greet the crowd, point to the harbor, react to the fireworks. Usopp\'s solution grows straight out of his marionette scroll: a MOVE BOOK. Each page is one named move — "Harbor Wave," "Solemn Nod," "The Captain\'s Point" — written as rod-positions over time, with margins listing what can be tuned: bigger or smaller (the same wave, scaled), faster or slower, left hand or right. Any stagehand can perform any page identically, any night; when the mayor wants the greeting grander, Usopp writes "amplitude: doubled" in the margin and it is EXACTLY the same wave, grander — repeatable, adjustable, boring in the way that ships. The book\'s limit surfaces on day three: a merchant requests the captain "dance a jig," and there is no jig page. Usopp\'s three answers become house policy: offer the nearest page, disclosed ("no jig — \'Festive Sway\' is close; want it livelier?"); or commission the guest artist for a one-night special; or, if enough people keep asking, choreograph a proper jig page into the book next month. What he refuses to do is improvise rod positions live for a move he never designed — the one time a stagehand tried, the captain\'s arm passed through his own hat and a child screamed. The guest artist is the other machine entirely: the Painter of Winds, who animates ATMOSPHERE like no rod ever could — the harbor banners rippling, lantern-light flickering on the painted sea, the captain\'s coat stirring in a breeze. Given a one-line wish ("evening wind, gentle, from the west") she produces something beautiful — and never the same thing twice, and "the same but softer" gets a shrug: "the wind does not repeat, and neither do I." So the final staging is a composite that Usopp diagrams for the crew: the portrait\'s SUBJECT moves from the book, on the rods, editable to the inch; the Painter owns the backdrop and the coat-edges, gorgeous and unaccountable; and a masking frame keeps her brush off the captain\'s face, because the one thing Act II must never gamble is whether the founder still looks like the founder.'
    },
    sitcom: {
      show: 'Friends',
      title: 'The Routine Has Named Moves; Phoebe Is Weather',
      text: 'The gang produces a music video for Phoebe\'s single, and choreography splits the room into two philosophies. Ross and Monica ARE the gesture library: The Routine is literally a book of named moves — "the Sprinkler," "the Shopping Cart," "the Big Finish" — each one parameterized in Monica\'s notation (size: small for camera, big for stage; tempo: half or full; lead hand: left for Ross\'s bad shoulder). Named moves are why they can perform it identically at every family event since eighth grade, why Monica can shout "Big Finish, seventy percent, on FOUR" mid-take and get precisely that, and why the director\'s note "same take, smaller sprinkler" costs one word instead of a reshoot. The library\'s limit gets its scene too: the director asks for "something like flamenco," there is no flamenco in the Routine, and the compromise is pure product policy — Monica offers the nearest move, disclosed ("we have \'the Matador,\' it is flamenco-adjacent, want it?"), while Ross\'s attempt to improvise flamenco live — inventing arm positions no rehearsal ever designed — dislocates something and proves why you never freestyle values outside the book. Phoebe, meanwhile, is the diffusion model, and everyone knows better than to cast her as anything else. Given a one-line prompt — "dance like wind through a field" — she produces something genuinely mesmerizing that no notation could hold. Given the SAME prompt for take two, she produces something completely different ("the wind moved on, Monica"). Asked for "that again, but 20% smaller," she produces a third thing, offended. So the final video is the composite everyone signs off on: Ross and Monica execute named, sized, timed moves in the foreground — every frame reshootable, every note addressable — while Phoebe improvises the background ATMOSPHERE, out of focus and glorious; and the editor masks her out of the foreground plates entirely, "because the one thing we reshoot over my dead body," says Monica, "is the Routine."'
    },
    why: 'The move book and the Routine are the gesture library: named, parameterized templates (amplitude, tempo, handedness) over a channel system performers already share — repeatable across nights and takes, adjustable by a margin note ("seventy percent"), which is exactly the editability contract Part 4 will cash. Both stories price the library\'s limit identically to the lesson\'s router: nearest-move disclosed, special-commission one-shots, or grow the book if demand recurs — and both stage the catastrophe of freestyling outside the vocabulary (the arm through the hat, Ross\'s flamenco) that is precisely why the LLM\'s gesture schema is a constrained enum, never free coefficients. The Painter of Winds and Phoebe are generative motion: atmosphere from a one-line prompt, unrepeatable by nature ("the wind does not repeat"), immune to parameter tweaks ("a third thing, offended") — perfect for the ambient layer, masked away from the subject\'s face because identity is the one ungambleable thing. And the final staging in both — book-driven subject, improvised atmosphere, masks between them — is the hybrid compositing architecture, drawn as theater.'
  },
  tech: [
    {
      q: 'Why route the description through the LLM into a constrained gesture schema instead of letting the LLM emit raw coefficient curves directly? It knows the channel system, after all.',
      a: 'Because plausible-looking numbers are not designed motion. An LLM asked for raw curves will produce SOMETHING — values in range, correct shape of JSON — but motion design is a craft encoding constraints the model has never seen enforced: joint limits, natural easing, anticipation-action-settle structure, and interaction rules with concurrent speech motion. Freestyled curves read as flailing or clipping (the arm through the hat), and worse, they fail UNREPRODUCIBLY — each generation invents different bad curves, so bugs cannot be filed against anything. The library inverts every one of those properties: each template is designed once by someone watching the output, parameterized within tested ranges, and the LLM\'s job shrinks to what LLMs are genuinely reliable at — reading intent, choosing from an enum (constrained decoding makes off-library names unpickable), and setting bounded parameters (amplitude 0.3-2.0, validated like every other field since Part 1). It is the identical division of labor as tool calling: the model selects and parameterizes from a registry; it never authors the implementation. When the vocabulary genuinely fails the request, the router\'s explicit fallbacks (nearest-disclosed, generative one-shot, library growth) handle it — visibly, not by improvised numbers.'
    },
    {
      q: 'Generative video models produce a different result for the same prompt every run. Where does the nondeterminism come from, and why is "just fix the seed" only half an answer?',
      a: 'Diffusion generation starts from sampled noise and iteratively denoises it; the initial noise (plus sampler stochasticity) is the lottery ticket, so same-prompt-different-result is the default by construction. Fixing the seed does make a single configuration reproducible — same seed, same prompt, same model version, same resolution, same scheduler: same clip — and DenDen Studio should absolutely record seeds with every generation (the "pick one of these variants" UX depends on being able to re-render the chosen one). Why it is only half an answer: seeds pin an OUTPUT, not a BEHAVIOR. The creator\'s real request is "that take, but smaller/slower/warmer" — and under a fixed seed, changing the prompt even slightly perturbs the whole denoising trajectory, so the result is not "the same motion, adjusted" but a sibling sample that may differ arbitrarily. There is no continuous parameter space connecting takes, because the parameters ARE the noise. That is the structural difference from the gesture route — where amplitude 0.7→1.4 is the same curve, scaled — and it is the deep reason generative motion lives on the ambient layer, where "different but equally nice wind" is acceptable, and never on the subject\'s performance, where "different" means the take the creator approved no longer exists.'
    },
    {
      q: 'Two gestures overlap on the timeline — a nod during a lean-in — and both write to the head-pitch channel. Enumerate the merge policies, their failure modes, and what you would ship.',
      a: 'Policies, roughly in order of sophistication. LAST-WINS (the later gesture overwrites): simple, and wrong — the lean vanishes mid-motion when the nod starts and snaps back after: visible discontinuities at both boundaries. ADDITIVE (sum the deltas): usually right for this pair — a nod atop a lean is physically "lean + nod," and additive layering is how the aliveness layer already stacks on speech motion; failure mode is range blowout when several same-sign gestures stack (three emphatic gestures = the head hits its joint limit), so additive REQUIRES clamping to per-channel limits — and clamping must be smooth (soft-knee saturation), because a hard clamp creates a velocity kink exactly at the most energetic moment. WEIGHTED/PRIORITY BLEND (each gesture carries a weight; conflicting channels crossfade by priority): the general solution, worth it once gestures are dense; failure mode is tuning burden and surprising outcomes when priorities are wrong. What I would ship: additive with per-channel soft clamps and per-gesture blend-in/out envelopes (every template starts and ends at zero delta — which makes ANY merge policy boundary-continuous), plus a validation-layer rule flagging more than N concurrent gestures as a probable director error (the same all-errors-named reporting as every validator since Part 1). That combination handles the 95% case invisibly and turns the pathological case into a reviewable warning instead of a broken neck.'
    }
  ],
  code: {
    title: 'The description → motion router, on Part 1\'s machinery',
    intro: 'The whole hybrid in one flow: constrained decomposition, library instantiation, ambient hand-off, and the merge into the talking-head timeline. Every mechanism here was built in an earlier lesson — this is assembly.',
    code: `# The library: designed curves, not improvised ones (excerpt)
GESTURES = {
    'wave':          {'dur': 2.0, 'params': {'amplitude': (0.3, 2.0),
                                             'hand': ['left', 'right']}},
    'nod_emphatic':  {'dur': 0.8, 'params': {'amplitude': (0.3, 1.5)}},
    'lean_in':       {'dur': 1.5, 'params': {'amplitude': (0.3, 1.2)}},
    'point_screen':  {'dur': 1.8, 'params': {'amplitude': (0.5, 1.5),
                                             'hand': ['left', 'right']}},
    # 20-40 curated entries. The enum below IS this dict's keys.
}

DECOMPOSE_SCHEMA = {
  'type': 'object',
  'properties': {
    'subject_actions': {'type': 'array', 'items': {
      'type': 'object',
      'properties': {
        'gesture': {'enum': list(GESTURES)},     # off-library: unpickable
        't': {'type': 'number'},
        'amplitude': {'type': 'number'},
        'hand': {'enum': ['left', 'right', 'none']}},
      'required': ['gesture', 't', 'amplitude']}},
    'ambient': {'type': 'string'},        # free text - imprecision is the
    'unmatched': {'type': 'array',        # contract on the ambient layer
                  'items': {'type': 'string'}},   # honesty channel
  },
  'required': ['subject_actions', 'ambient', 'unmatched'],
}

def animate_from_description(description, clip_s, coeffs):
    # 1. LLM decomposes - constrained, deterministic, validated
    plan = llm_chat(
        system='Decompose the animation request. Map subject actions to '
               'library gestures; put atmosphere in ambient; anything '
               'unmappable goes in unmatched - never approximate silently.',
        user=description, format=DECOMPOSE_SCHEMA, temperature=0)
    errors = validate_actions(plan, clip_s, GESTURES)   # bounds, ranges
    if errors:
        plan = repair_loop(plan, errors)                # Part 1, verbatim

    # 2. instantiate gestures into the coefficient timeline (lab)
    for act in plan['subject_actions']:
        curves = instantiate(GESTURES[act['gesture']], act)
        coeffs = layer_motion(coeffs, curves, at=act['t'])

    # 3. ambient -> generative layer (seed recorded; masked composite)
    ambient_clip = None
    if plan['ambient']:
        ambient_clip = svd_generate(source_image=CURRENT_IMAGE,
                                    prompt=plan['ambient'],
                                    seed=record_seed())
    # 4. unmatched -> the creator, not the void
    return coeffs, ambient_clip, plan['unmatched']

# Compositing (Part 5 owns the mux): base talking-head render from
# merged coeffs; ambient blended via background/hair masks derived
# from the intake detector's geometry. The face is never the
# diffusion model's to repaint.`,
    notes: [
      'The schema\'s unmatched field is the honesty channel: the LLM is explicitly instructed that silent approximation is worse than admitting "no jig page" — and the UI turns unmatched items into the disclosed-nearest-gesture conversation.',
      'record_seed() on every generative call is what makes "pick one of these three winds" a real feature: the chosen variant can be re-rendered exactly, even though a NEW prompt could never reproduce it.'
    ]
  },
  lab: {
    title: 'Instantiate and layer: the gesture math under the magic',
    prompt: 'Two functions completing the router. (1) <code>instantiate(template, t0, amplitude, fps)</code>: a template is <code>{"channel": str, "keys": [[dt_seconds, value], ...]}</code> — convert it to absolute frames: each key becomes <code>[round((t0 + dt) * fps), value * amplitude]</code>, returned as <code>{"channel", "frames": [[frame, value], ...]}</code>. (2) <code>layer_motion(timeline, curve, lo, hi)</code>: <code>timeline</code> maps channel → dict of frame → value; ADD each of <code>curve["frames"]</code> values into the channel (creating the channel/frames as needed), clamping every resulting value into <code>[lo, hi]</code>. Return the timeline. Additive merge + clamping is the ship-it policy from the tech section — a nod during a lean sums; a triple-stack saturates instead of snapping the neck.',
    starter: `def instantiate(template, t0, amplitude, fps):
    # keys [[dt, value]] -> frames [[round((t0+dt)*fps), value*amplitude]]
    pass

def layer_motion(timeline, curve, lo, hi):
    # timeline: {channel: {frame: value}}; ADD curve values, clamp [lo, hi]
    pass`,
    checks: [
      { re: 'def\\s+instantiate\\s*\\(', flags: '', must: true, hint: 'Define instantiate(template, t0, amplitude, fps).', pass: 'instantiate defined ✓' },
      { re: 'def\\s+layer_motion\\s*\\(', flags: '', must: true, hint: 'Define layer_motion(timeline, curve, lo, hi).', pass: 'layer_motion defined ✓' },
      { re: 'round\\s*\\(', flags: '', must: true, hint: 'Frame indices come from round((t0 + dt) * fps).', pass: 'frame rounding ✓' },
      { re: 'amplitude', flags: '', must: true, hint: 'Values scale by amplitude — that is what "bigger wave" means.', pass: 'amplitude scaling ✓' },
      { re: 'min\\s*\\(|max\\s*\\(', flags: '', must: true, hint: 'Clamp merged values into [lo, hi] — additive stacking must saturate, not explode.', pass: 'clamping present ✓' }
    ],
    tests: `nod = {'channel': 'head_pitch',
       'keys': [[0.0, 0.0], [0.2, -0.6], [0.4, 0.0]]}
g = instantiate(nod, t0=2.0, amplitude=0.5, fps=25)
assert g['channel'] == 'head_pitch'
assert g['frames'] == [[50, 0.0], [55, -0.3], [60, 0.0]], \
    'shifted to t0, scaled by amplitude: got ' + str(g['frames'])

tl = {'head_pitch': {55: -0.5}}
tl = layer_motion(tl, g, lo=-1.0, hi=1.0)
assert tl['head_pitch'][55] == -0.8, 'overlap adds: -0.5 + -0.3'
assert tl['head_pitch'][50] == 0.0 and tl['head_pitch'][60] == 0.0
big = {'channel': 'head_pitch', 'frames': [[55, -0.9]]}
tl = layer_motion(tl, big, lo=-1.0, hi=1.0)
assert tl['head_pitch'][55] == -1.0, 'stacking saturates at the clamp'
tl = layer_motion(tl, {'channel': 'brow', 'frames': [[10, 0.4]]},
                  lo=-1.0, hi=1.0)
assert tl['brow'][10] == 0.4, 'new channels are created on demand'
print('gesture instantiation and layering correct')`,
    solution: `def instantiate(template, t0, amplitude, fps):
    frames = [[round((t0 + dt) * fps), value * amplitude]
              for dt, value in template['keys']]
    return {'channel': template['channel'], 'frames': frames}

def layer_motion(timeline, curve, lo, hi):
    ch = timeline.setdefault(curve['channel'], {})
    for frame, value in curve['frames']:
        merged = ch.get(frame, 0.0) + value
        ch[frame] = max(lo, min(hi, merged))
    return timeline`,
    notes: [
      'Every template\'s keys begin and end at value 0 (the nod: 0 → -0.6 → 0), which is what makes additive layering boundary-continuous — the blend-in/out envelope from the tech answer, encoded as a library convention rather than merge-time logic.',
      'These 15 lines are the entire "cost" of the parametric route\'s magic: instantiation is arithmetic. Compare with the generative route, where the equivalent operation is a GPU-minute and a lottery ticket — that asymmetry is the whole architecture argument.'
    ]
  },
  quiz: [
    {
      q: 'The gesture library beats freeform generation for the avatar\'s OWN actions primarily because:',
      options: ['Libraries render prettier motion', 'Designed templates are predictable, repeatable, parameterized, and editable data — the properties creators, support, and Part 4\'s editing all depend on', 'Diffusion models cannot move arms', 'Libraries need no GPU ever'],
      correct: 1,
      explain: 'The library trades expressive range for the product virtues: same wave every render, "bigger" = one parameter, and the instantiated result is timeline data that click-drag can mutate.'
    },
    {
      q: 'Text prompts steer generative video models well for ambient motion but poorly for "wave left hand at exactly 2s" because:',
      options: ['Prompts have length limits', 'The models learned motion statistics from footage — atmosphere is dense in the training distribution, while precise timed body actions are neither controllable nor guaranteed by the sampling process', 'Hands are hard to render', 'Text encoders ignore numbers'],
      correct: 1,
      explain: 'Diffusion dreams plausible motion; it does not execute instructions. Global/ambient dynamics it has seen endlessly; part-precise timed action is a lottery — hence the layer split.'
    },
    {
      q: '"Same take but 20% smaller" is trivially cheap on the gesture route and effectively impossible on the generative route because:',
      options: ['Diffusion is just slower', 'Gestures live in a continuous parameter space (scale the curve); a diffusion take is pinned to its noise seed, and any prompt change yields a sibling sample, not an adjusted one', 'Nobody has implemented it yet', 'Video files cannot be scaled'],
      correct: 1,
      explain: 'Amplitude 1.0→0.8 is the same designed motion, resized. A seed pins an output, not a behavior — there is no dial connecting neighboring takes.'
    },
    {
      q: 'When a creator requests a motion outside the library, the router must NOT:',
      options: ['Offer the nearest gesture with disclosure', 'Offer a generative one-shot marked as uneditable', 'Log the request as demand signal for library growth', 'Let the LLM improvise raw coefficient values for the unknown action'],
      correct: 3,
      explain: 'Freestyled curves are plausible numbers, not designed motion — flailing, clipping, unreproducible. The enum + explicit fallbacks (disclosed-nearest, one-shot, grow the book) is the whole discipline.'
    },
    {
      q: 'In the final composite, the generative layer is masked away from the avatar\'s face because:',
      options: ['Diffusion output is too colorful', 'Identity is the ungambleable property — generative models can drift a face off-model, and the product\'s premise is THIS face; ambient magic stays on background, hair, and clothing edges', 'Masks speed up rendering', 'The face layer is copyrighted'],
      correct: 1,
      explain: 'The subject\'s face comes from the identity-preserving talking-head path; the diffusion brush paints atmosphere only. The Painter of Winds never touches the captain\'s face.'
    }
  ],
  pitfalls: [
    'Growing the gesture library by quantity instead of curation. Three hundred overlapping, vaguely-named gestures make the LLM\'s enum choice a coin flip ("wave" vs "greeting_wave" vs "hand_wave_2") — the tool-count lesson applies verbatim: 20-40 distinct, well-described entries the model can actually discriminate, and analytics-driven growth only where unmatched requests recur.',
    'Letting "excitedly" and other adverbs die in translation. The decomposition schema needs the intensity dimension (amplitude, and possibly tempo) wired from the LLM\'s reading of the adverb into the gesture parameters — a router that maps "waves excitedly" and "waves wearily" to the identical wave has silently dropped half the creator\'s sentence.',
    'Skipping the seed record on generative calls because "it is just background." The moment a creator picks variant two of three winds, that clip is part of their project — and without the seed, prompt, model version, and settings recorded, the first re-render (new resolution, small trim) silently replaces their chosen wind with a stranger. Record the full recipe on every sample, always.'
  ],
  interview: [
    {
      q: 'Design a system where users animate a character portrait by typing a description. Walk through the architecture and its key decisions.',
      a: 'The core decision is recognizing two different problems wearing one sentence. Subject actions ("waves at the start, then leans in") need precision, timing, repeatability, and editability — served by a curated gesture library: 20-40 designed, parameterized motion templates (amplitude, duration, handedness) over the same coefficient channels the talking-head stage already animates, instantiated as timeline keyframes by pure arithmetic. Ambient motion ("hair blowing, candles flickering") tolerates imprecision and rewards open-endedness — served by image-to-video diffusion (AnimateDiff/SVD-class), rendered as a separate layer, masked off the subject\'s face because generative models cannot guarantee identity. The router between them is an LLM with a constrained schema: gesture names as an enum of the actual library (off-library outputs unpickable at decode time), bounded numeric parameters, timestamps validated against clip duration with a repair loop, ambient as free text, and an explicit unmatched field so unmappable requests surface to the user rather than being silently approximated. Compositing: gestures merge additively (with soft clamps and zero-delta template boundaries) into the talking-head coefficient timeline pre-render; the ambient layer blends via geometry-derived masks. The one-line summary I would defend: the LLM translates intent, the library executes the subject, diffusion paints the weather, and nothing improvises the face.'
    },
    {
      q: 'A stakeholder asks why you maintain a hand-built gesture library when video diffusion "can generate any motion from text." Make the engineering case.',
      a: 'Diffusion generates A motion, not THE motion — and the difference is the entire product. Four properties the library has that sampling cannot offer. Repeatability: "wave" is the same designed curve every render; a diffusion wave is a fresh sample per run, so approved takes are unstable under any change. Adjustability: creators iterate — "bigger," "slower," "later" — which on the library is one parameter write in a continuous space, and on diffusion is a new lottery ticket (a seed pins an output, not a behavior; neighboring prompts are not neighboring motions). Editability: instantiated gestures are timeline data our click-drag editor mutates directly; diffusion emits pixels with no handles, so the edit feature dies. Identity safety: the avatar\'s face must remain THIS face; diffusion demonstrably drifts identity mid-clip, which is disqualifying for the subject layer regardless of quality elsewhere. Costs favor it too: instantiation is arithmetic; generation is GPU-minutes. Where diffusion genuinely wins — open-ended atmosphere, one-shot special moments — we use it, on a masked ambient layer with recorded seeds, expectations set. The library is not a legacy workaround for weak models; it is where the product\'s promises (repeatable, adjustable, editable, safe) actually live, and better diffusion models change its boundary, not its existence.'
    },
    {
      q: 'How do you handle animation requests your system cannot fulfill, and why is this policy as important as the happy path?',
      a: 'Three-tier fallback, all explicit, none silent. Tier one, nearest-match with disclosure: the LLM maps the request to the closest library gesture AND says so in the response surface ("no juggling gesture — used animated hand movement; want it bigger?"). Disclosed substitution reads as collaboration; silent substitution reads as a bug the user cannot articulate. Tier two, generative one-shot with set expectations: offer a diffusion-generated take for the special moment, explicitly marked as pick-a-variant and not click-editable later, with the full recipe (seed, prompt, model, settings) recorded so the chosen variant is stable. Tier three, vocabulary growth: unmatched requests are logged and aggregated — recurring demand is the signal that pays for designing a proper new template; one-off requests are not. The forbidden path is letting the model improvise raw motion values for unknown actions: it produces plausible numbers rather than designed motion, fails unreproducibly, and converts user trust into user horror at random intervals. Why the policy ranks with the happy path: users judge generative features by their WORST output, not their median — one flailing-arms take does more damage than fifty good waves build — and an honest "cannot, here are options" preserves the collaboration frame that makes the whole feature feel magical. Fallback design IS the product\'s reliability story; the happy path is just the demo.'
    },
    {
      q: 'Your gesture compositing occasionally produces broken motion when multiple animations overlap. Diagnose the failure classes and describe the robust design.',
      a: 'Overlap failures come in three classes, each with a distinct signature. Discontinuity breaks: a gesture starts or ends mid-overlap and the shared channel jumps — signature is a visible snap at gesture boundaries. Root cause is either last-wins merging (later gesture overwrites, then releases) or templates whose curves do not start/end at zero delta. Fixes: additive merging as the base policy, plus a library CONVENTION that every template\'s curves begin and end at zero (making any merge boundary-continuous by construction) — conventions beat merge-time cleverness. Range blowouts: several same-sign gestures stack past joint limits — signature is hyperextension at the most energetic moment. Fix is per-channel clamping, and specifically SOFT clamping (saturation with a knee), because a hard min/max creates a velocity kink precisely where motion is largest. Semantic conflicts: individually-valid gestures that are jointly absurd (three emphatic nods scheduled within a second, a point during a wave on the same arm) — no merge math fixes intent, so this belongs in the validation layer: flag N-concurrent-gestures and same-limb overlaps as director errors, reported with names and timestamps like every validator in the pipeline, and bounce them through the repair loop. The robust design stacks all three: zero-boundary templates + additive merge + soft per-channel clamps handle the mechanical 95% invisibly, and validation converts the semantic 5% from broken renders into reviewable warnings. Then the test that keeps it true: property-based tests generating random gesture schedules and asserting continuity and range invariants on the merged timeline — motion bugs are much cheaper to catch as failed assertions than as user-shared videos of a broken neck.'
    }
  ]
};
