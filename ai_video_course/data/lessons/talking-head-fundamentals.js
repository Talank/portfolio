window.LESSONS = window.LESSONS || {};
window.LESSONS['talking-head-fundamentals'] = {
  id: 'talking-head-fundamentals',
  title: 'Talking Heads: Audio → Lip Sync → a Still Picture That Speaks',
  category: 'Part 3 — Making Pictures Talk',
  timeMin: 40,
  summary: 'The signature trick: one still picture plus one audio track becomes video of that face speaking. This lesson maps the open talking-head family — mouth-region inpainting (Wav2Lip-class), coefficient-driven animation (SadTalker-class), and motion-transfer/reenactment (LivePortrait-class) — by the one question that organizes everything: what does each approach GENERATE versus PRESERVE? Along the way: why lip-sync consumes audio features rather than text timings, why a perfectly synced mouth still looks dead without blinks and idle motion, and why DenDen Studio\'s editing features quietly dictate which approach the offline pipeline must use.',
  goals: [
    'Name the three open talking-head families — mouth inpainting, coefficient-driven, motion transfer — and what each generates vs preserves',
    'Explain why sync quality comes from audio features (energy, spectral shape) rather than word timestamps, closing the tolerance argument from the Whisper lesson',
    'List the aliveness layer — blinks, micro head motion, breathing, gaze — and why its absence reads as "dead" even with perfect lips',
    'Choose approaches for DenDen Studio\'s two paths: editable coefficients offline, cheapest-acceptable live',
    'Anchor the mouth region and landmarks from the intake detector\'s geometry — the payoff of the multimodal lesson\'s jurisdiction rule'
  ],
  concept: [
    {
      h: 'One problem, three strategies: what gets generated vs preserved',
      p: [
        'Every talking-head system answers one design question: of the output video\'s pixels, which are COPIED from the source image and which are GENERATED? <b>Mouth-region inpainting</b> (the Wav2Lip lineage) preserves almost everything — the frame IS the source image — and generates only the mouth area, painted per-frame to match the audio. Strengths: identity preservation is nearly perfect (it is literally the same pixels outside the mouth), it works on video sources too (re-dubbing), and it is fast. Weakness: NOTHING ELSE MOVES — no head motion, no expression change; on a still image the result is a portrait with a moving mouth, which reads as exactly that.',
        '<b>Coefficient-driven animation</b> (the SadTalker lineage) inserts an intermediate: audio is mapped to a sequence of compact <b>motion coefficients</b> — head pose angles, expression parameters, blink events, borrowed from 3D face-model conventions — and a renderer then warps/generates the image following those coefficients. The whole head lives: nods, tilts, brows, lids. And the representation in the middle is DATA — editable data, remember that. <b>Motion transfer / reenactment</b> (the LivePortrait lineage) drives the still image with motion extracted from a DRIVING PERFORMANCE (a real video — yours, or a generated one): the image adopts the driver\'s head motion and expressions. Highest naturalness available in open tooling — the motion is real human motion — and it tolerates stylized/illustrated faces well (the intake lesson\'s drawn-character route lands here). The organizing spectrum, one more time: pixels-preserved ↔ motion-generated, and every product decision in this Part is a position on it.'
      ]
    },
    {
      h: 'Audio in, articulation out: why the mouth listens to the waveform',
      p: [
        'How does the mouth know what shape to make? The tempting design — Whisper gives word timings, words map to phonemes, phonemes map to <b>visemes</b> (the ~15 visually distinct mouth shapes; many phonemes share one: /b/ /p/ /m/ all read as lips-pressed) — and you keyframe visemes at word times. It works, and cheap real-time avatars do exactly this. But it inherits every upstream tolerance: word timestamps carry tens-of-ms alignment error (the Whisper lesson\'s warning, now cashed in), phoneme durations WITHIN a word get guessed, and coarticulation — real mouths blur adjacent shapes into each other, already forming the next vowel mid-consonant — is lost entirely. The eye notices all of it: sync drift beyond ~40-60 ms reads as "dubbed."',
        'So quality systems skip the text layer: the sync model consumes <b>audio features directly</b> — mel-spectrogram windows (the same representation, fourth appearance) — and learns audio→mouth-shape as one mapping. Wav2Lip\'s core is exactly this, trained with a <b>sync discriminator</b>: a judge network pre-trained to detect audio/mouth mismatch, punishing the generator for every frame whose mouth does not plausibly match the sound (deep dive). Consequences worth internalizing: lip quality is bounded by AUDIO quality (a muffled TTS render begets mushy articulation — the voice column\'s output is this stage\'s input, and the pipeline is a chain of ceilings); and text/word timings retain exactly one sync-adjacent job — COARSE alignment for captions and editing, never articulation.'
      ]
    },
    {
      h: 'The aliveness layer: a synced mouth on a dead face',
      p: [
        'First-time builders ship perfect lip-sync and get feedback they do not expect: "creepy." The mouth is right; the face is DEAD. Humans blink every 2–6 seconds; heads perpetually micro-move (nod fractions of a degree with speech emphasis, drift and re-center); chests breathe; eyes shift in tiny saccades and, crucially, sometimes look AT the camera and sometimes away. A face with none of this triggers the uncanny response faster than a bad mouth does — stillness is what corpses do, and the audience\'s hindbrain knows it.',
        'The fix is the <b>aliveness layer</b>: procedural idle motion composited with the speech-driven motion. Blinks on a randomized 2–6 s clock (never metronomic — periodicity reads as mechanical), micro head-pose noise (low-amplitude, low-frequency drift), audio-energy-coupled emphasis nods (the head naturally punctuates stressed syllables — couple it loosely to the same energy signal driving the mouth), breathing-rate torso/shoulder motion where the crop includes any. Coefficient-driven systems make this almost free: idle motion is just ADDED to the coefficient streams before rendering (SadTalker does some internally; you will tune and extend it). Inpainting systems cannot do it at all — nothing outside the mouth is theirs to move — which is often the real reason a product graduates off Wav2Lip, not lip quality. The lab builds both halves: the audio→mouth curve and the idle layer on top.'
      ]
    },
    {
      h: 'Choosing for DenDen Studio: the editing feature decides, not the demo reel',
      p: [
        'Offline path: <b>coefficient-driven</b>, and the deciding argument is not render quality — it is Part 4. The product promises "fix the animation by describing the change or click-dragging it." A described edit ("less head movement, bigger smile at 0:03") must become a modification to SOMETHING; a drag must mutate SOMETHING. Coefficient streams are that something: interpretable time-series (pose angles, expression weights, blink events) that an LLM can edit via tool calls and a canvas can expose as draggable curves. A pixels-only pipeline (pure inpainting, or end-to-end diffusion video) produces beautiful frames and NO HANDLES — the click-drag feature dies at the architecture meeting, exactly the intermediate-representations argument from lesson one, now with a specific victim.',
        'Live path: cheapest acceptable — a light inpainting model or viseme-driven 2.5D warping at reduced resolution — because Part 3\'s closing lesson will show the latency budget affords no better, and a slightly stiffer live avatar is an accepted trade (live audiences forgive; recorded audiences do not). Both paths anchor on the SAME geometry: the intake detector\'s landmarks (mouth region for inpainting, face rig alignment for coefficients) — the multimodal lesson\'s jurisdiction rule paying off exactly as promised: the VLM never supplies coordinates; the detector\'s landmarks feed every stage that touches pixels. One honest note on the frontier: end-to-end diffusion talking-heads (EMO-class) produce the most natural results published and are landing in open weights; they trade away editability and speed — watch them, adopt when the EDITING story catches up, and notice that the spectrum question ("what is generated vs preserved, and where are the handles?") is precisely what tells you when that moment arrives.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Usopp\'s Portrait Theater: Three Ways to Make a Painting Talk, and the Apprentice Who Forgot Blinking',
      text: 'For the harbor festival\'s closing night, Usopp stages his masterpiece: a theater where a life-size painted portrait of the town\'s founding captain delivers a farewell speech, voiced by Brook from behind the curtain. Usopp prototypes three rigs. The first is his paper-strip mouth: he razors out the portrait\'s mouth region and puppets layered paper strips behind the hole, flapping them to Brook\'s voice. Cheap, fast, and the portrait is UNTOUCHED except the mouth — the likeness is perfect because it is literally the same painting. But in rehearsal the effect is exactly what it is: a painting with a hole that talks. "The captain was not a door knocker," mutters the mayor. The second rig is the marionette armature: behind a flexible canvas copy, Usopp builds a lattice of rods — one tilts the head, one lifts the brows, three shape the mouth, one droops the eyelids — and he writes Brook\'s speech as a SCROLL of dial positions over time, which any stagehand can perform, or better, ADJUST: when the mayor wants the third line more solemn, Usopp erases two marks on the scroll and lowers the brow-rod numbers. No repainting, no re-rehearsal — the scroll is the performance, and the scroll is editable. The third option, pitched by a traveling artist, is gorgeous madness: repaint the entire portrait sixty times per line of speech, each frame perfect. The samples are breathtaking — and one sentence costs the artist a week, and when the mayor asks for the solemn change, the answer is "I repaint the week." Usopp chooses the armature, and rehearsals expose the final secret. The rig is flawless, the sync is perfect, and the audience of stagehands is uneasy: "It looks... dead, Usopp-san." The portrait never blinks. Never sways. Stares fixed at one point for four minutes. Usopp adds what he calls the LIVING SCROLL — a background rhythm on top of the speech marks: eyelid-rod flick every few seconds, irregular; a whisper of head drift; a breathing sway in the shoulders rod, and on Brook\'s stressed notes, the faintest nod. Opening night, a child in the front row waves at the portrait — and bursts into tears when it seems to notice. "THAT," Usopp says, "is the difference between a mouth that moves and a captain who speaks."'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Howard\'s Animatronic Einstein: Three Prototypes and the Creepiness Review',
      text: 'The university wants an animatronic Einstein bust greeting open-house visitors, and Howard — thrilled to be needed — builds three prototypes for the committee. Prototype one is the jaw-servo special: a beautiful resin cast of the famous face with exactly one motor flapping the jaw to the audio track. Identity: perfect, it is the cast itself. Effect: "a nutcracker with tenure," per Kripke, and the committee agrees the flapping jaw on a frozen face is somehow worse than no motion at all. Prototype two is Howard\'s pride: a full facial armature — servo channels for head pan and tilt, brow raise, lid droop, five around the mouth — driven not by hand but by a CUE SHEET: a time-series file of channel values his software generates from the speech audio. The killer feature emerges in committee review: the president wants "less eyebrow, he looks alarmed" — and Howard edits three numbers in the cue sheet, re-runs, done. Leonard, watching: "You did not touch the robot. You edited a SPREADSHEET of the performance." Prototype three exists only as a vendor quote: a film-industry house offering frame-by-frame digital face replacement, photorealistic, at a price that makes the department head laugh in the vendor\'s face, with a three-week turnaround per script change. The armature wins — and then fails its first hallway test, where Raj refuses to be left alone with it: "It STARES, Howard. It has not blinked since Tuesday." The fix Howard ships that night he calls the IDLE CHANNELS: blinks on a randomized timer ("metronome blinking is somehow worse — I tried"), a low hum of head drift, breathing in the shoulder plate, and a subtle nod coupled to the audio\'s loud syllables. The next morning, a prospective student apologizes to the bust for interrupting it. Howard frames the incident report.'
    },
    why: 'The three rigs in both stories are the three families, organized by exactly the lesson\'s question — what is generated versus preserved. Paper-strip mouth and jaw-servo: Wav2Lip-class inpainting — everything preserved, only the mouth generated, identity perfect and everything else frozen. The marionette scroll and the cue sheet: coefficient-driven animation — the performance exists as an editable intermediate (erase two marks, edit three numbers) rather than as finished pixels, which is why the solemn-change and less-eyebrow requests cost seconds instead of a repainted week: that is Part 4\'s entire editing architecture, decided here. The artist\'s repainted frames and the vendor quote: end-to-end generation — the quality frontier, priced in time and re-work, with no handles. And both stories land on the same discovery, because every builder does: perfect sync on a motionless face reads as dead (the unblinking portrait, Raj\'s "it STARES") — and the fix is the same procedural aliveness layer, irregular blinks and drift and breath and emphasis-nods, layered ON TOP of the speech motion. The child who waves and the student who apologizes are the acceptance test.'
  },
  tech: [
    {
      q: 'Why does Wav2Lip-class inpainting preserve identity so much better than coefficient-driven approaches, and what is the precise cost of that advantage?',
      a: 'Because it barely generates anything. Outside the mouth region, output pixels ARE source pixels — copied, not reconstructed — so identity fidelity is near-perfect by construction: nothing to drift, nothing to hallucinate. The generator\'s entire job is a small patch, conditioned on audio features and the surrounding face context. The cost follows from the same fact: everything it does not generate, it cannot MOVE. Head pose, expressions, blinks, gaze — all frozen at the source image\'s values, which on a still-image input yields the talking-doorknocker effect, and no aliveness layer is possible because there are no motion controls to add idle motion TO. Coefficient-driven systems invert the trade: they re-render the head following motion parameters, gaining full-face life and editability, and paying in identity risk — warping/regeneration can subtly de-resemble the subject, especially at large pose deltas from the source (the reason those systems prefer near-frontal sources and modest motion — and the reason intake flags profile shots). The mature mental model: it is not better/worse, it is a pixels-preserved ↔ motion-generated dial, and you position each product path on it deliberately.'
    },
    {
      q: 'Trace the causal chain from "the TTS render was slightly muffled" to "the lips look mushy," and state the general law it instantiates.',
      a: 'The sync model consumes audio features — mel-spectrogram windows — and maps them to mouth shapes. Consonant articulation lives in the spectrogram\'s sharp, high-frequency, transient structure: plosive bursts, fricative noise edges. A muffled render (vocoder texture loss, over-aggressive denoising, low-bitrate re-encode in the pipeline) smears exactly that structure; the sync model, seeing softened transients, produces correspondingly soft, under-articulated mouth shapes — mushy lips faithfully rendering mushy audio. No component malfunctioned: each stage\'s output ceiling became the next stage\'s input ceiling. The general law: a media pipeline is a CHAIN OF CEILINGS — reference quality caps the clone (voice lesson), clone quality caps the articulation (here), and later, coefficient quality caps the edit. Two operational corollaries: debug sync complaints by inspecting the AUDIO first (a spectrogram glance — the deep-dive skill from the TTS lesson — distinguishes "sync model failed" from "audio arrived pre-mushed" in thirty seconds), and never insert lossy audio re-encodes between synthesis and sync — hand the sync stage the highest-fidelity audio the pipeline possesses, compress only at final mux.'
    },
    {
      q: 'Design the aliveness layer\'s parameters and defend them: which motions, what statistics, and what couples to the speech signal versus runs free?',
      a: 'Free-running (decoupled from speech): blinks — randomized inter-blink interval, roughly 2-6 s drawn from a skewed distribution, never fixed-period (periodicity is instantly read as mechanical), with occasional double-blinks; micro head drift — low-amplitude (fractions of a degree), low-frequency noise (smoothed random walk, not white noise jitter) across yaw/pitch/roll, with slow re-centering so the head never wanders off; breathing — a gentle 12-16 cycles/min oscillation in shoulders/chest if visible in crop. Speech-coupled: emphasis nods — small pitch-axis dips loosely triggered by audio-energy peaks (the SAME energy curve driving mouth openness — one signal, two consumers — with a deadband and refractory period so only genuine stresses fire, not every syllable); optional brow raises on sustained high energy; and a rest state — mouth fully closed, motion amplitude reduced — during VAD-reported pauses (the spans from the Whisper lesson, now consumed a third time). Interaction rule: speech-coupled motion MODULATES the free-running base rather than replacing it, so silence never means stillness. And one global knob — overall amplitude — exposed as a creator-facing "liveliness" slider, because appropriate energy differs between a eulogy avatar and a product-hype avatar, which is a content decision no default can make.'
    }
  ],
  code: {
    title: 'The offline talking-head stage: coefficients in the middle, on the detector\'s geometry',
    intro: 'The shape of the coefficient-driven path — audio and image in, editable motion in the middle, frames out — with the seams Part 4 (editing) and Part 5 (orchestration) will hook into. (Heavy models run locally; the curve logic is the lab.)',
    code: `# SadTalker-class pipeline, decomposed into its real stages:

def generate_talking_head(image_path, audio_path, out_dir):
    # 0. geometry from intake - the detector's landmarks, NEVER the VLM's
    face = load_intake_geometry(image_path)   # crop box + landmarks

    # 1. audio -> motion coefficients (the EDITABLE intermediate)
    audio_feats = mel_features(audio_path)          # same rep as TTS/Whisper
    coeffs = audio_to_coeffs(audio_feats, face)
    # coeffs: per-frame dict streams, e.g.
    #   {'frame': i, 'head_pose': [yaw, pitch, roll],
    #    'expression': [e0..e63], 'mouth_open': 0.42, 'blink': 0.0}

    # 2. the aliveness layer: ADDED to coefficients, pre-render
    energy = frame_energy(audio_feats)              # one signal, two uses
    coeffs = add_idle_motion(coeffs, energy,
                             blink_s=(2, 6),        # randomized, seeded
                             drift_deg=0.4,
                             nod_gain=0.15)

    # 3. PERSIST coefficients BEFORE rendering - Part 4 edits this file,
    #    and Part 5's cache means an edit re-renders without re-inferring
    save_json(out_dir + '/coeffs.json', coeffs)

    # 4. coefficients + source image -> frames (the expensive stage)
    frames = render_face(image_path, face, coeffs)
    write_video(out_dir + '/head.mp4', frames, fps=25)

# The editing contract this buys (Part 4 cashes it in):
#   "smaller head movements" -> scale coeffs['head_pose'] amplitudes
#   "smile more at 0:03"     -> raise expression dims near frame 75
#   click-drag on a curve    -> mutate values, re-run ONLY step 4
#
# A pixels-only pipeline (pure inpainting / end-to-end diffusion) has
# no step 3 - and therefore no edit cheaper than "generate again."`,
    notes: [
      'Persisting coefficients before rendering is the load-bearing line: it converts every future edit from "re-run the model" to "mutate data, re-render" — the difference between seconds and minutes per iteration.',
      'The same frame_energy output drives mouth articulation and emphasis nods — one measured signal, multiple consumers, no invented timing. The lab builds both consumers.'
    ]
  },
  lab: {
    title: 'Articulation and aliveness: the two motion signals',
    prompt: 'Two coefficient generators. (1) <code>mouth_curve(energy, attack, decay)</code>: convert per-frame audio energy (floats 0..1) into mouth-openness values — the mouth opens FAST (per-frame rise capped at <code>attack</code>) and closes SLOWLY (per-frame fall capped at <code>decay</code>), starting from 0. This asymmetric smoothing is what separates articulate lips from flapping ones. (2) <code>blink_track(n_frames, first, interval, blink_len)</code>: a deterministic idle-blink schedule — blinks start at frame <code>first</code> and every <code>interval</code> frames after; each blink sets <code>blink_len</code> consecutive frames to 1 (clipped at the end); all other frames 0. (Production randomizes the interval — the tests need determinism, so this is the seeded skeleton.)',
    starter: `def mouth_curve(energy, attack, decay):
    # rise limited by attack, fall limited by decay, start at 0
    pass

def blink_track(n_frames, first, interval, blink_len):
    # 1s for blink_len frames at first, first+interval, ... else 0s
    pass`,
    checks: [
      { re: 'def\\s+mouth_curve\\s*\\(', flags: '', must: true, hint: 'Define mouth_curve(energy, attack, decay).', pass: 'mouth_curve defined ✓' },
      { re: 'def\\s+blink_track\\s*\\(', flags: '', must: true, hint: 'Define blink_track(n_frames, first, interval, blink_len).', pass: 'blink_track defined ✓' },
      { re: 'attack', flags: '', must: true, hint: 'Rises are capped by attack per frame.', pass: 'attack cap used ✓' },
      { re: 'decay', flags: '', must: true, hint: 'Falls are capped by decay per frame — mouths close slower than they open.', pass: 'decay cap used ✓' }
    ],
    tests: `c = mouth_curve([0.0, 1.0, 1.0, 0.0, 0.0, 0.0], attack=0.5, decay=0.2)
assert abs(c[1] - 0.5) < 1e-9, 'rise capped at attack: 0 -> 0.5, not 1.0'
assert abs(c[2] - 1.0) < 1e-9, 'second frame completes the rise'
assert abs(c[3] - 0.8) < 1e-9 and abs(c[4] - 0.6) < 1e-9, \
    'fall capped at decay per frame: 1.0 -> 0.8 -> 0.6'
assert all(0.0 <= v <= 1.0 for v in c), 'openness stays in [0, 1]'
flat = mouth_curve([0.0, 0.0, 0.0], attack=0.5, decay=0.2)
assert flat == [0.0, 0.0, 0.0], 'silence keeps the mouth closed'

b = blink_track(12, first=3, interval=5, blink_len=2)
assert b == [0,0,0,1,1,0,0,0,1,1,0,0], 'blinks at 3-4 and 8-9: got ' + str(b)
tail = blink_track(5, first=4, interval=10, blink_len=3)
assert tail == [0,0,0,0,1], 'blink clipped at the final frame'
print('articulation and aliveness signals correct')`,
    solution: `def mouth_curve(energy, attack, decay):
    out = []
    cur = 0.0
    for e in energy:
        target = max(0.0, min(1.0, e))
        if target > cur:
            cur = min(target, cur + attack)
        else:
            cur = max(target, cur - decay)
        out.append(round(cur, 9))
    return out

def blink_track(n_frames, first, interval, blink_len):
    track = [0] * n_frames
    start = first
    while start < n_frames:
        for i in range(start, min(start + blink_len, n_frames)):
            track[i] = 1
        start += interval
    return track`,
    notes: [
      'The attack/decay asymmetry is stolen from audio engineering (envelope followers) and matches physiology: jaws snap open for plosives and ease closed after. Symmetric smoothing is the #1 reason naive energy-driven mouths look like flapping puppets.',
      'blink_track\'s fixed interval is the testable skeleton; production draws intervals from a skewed random distribution (seeded, so renders reproduce) — the metronome blink is somehow creepier than no blink, as every builder discovers once.'
    ]
  },
  deepDive: {
    timeMin: 14,
    intro: 'Two mechanisms under the hood: how Wav2Lip\'s sync discriminator turns "does the mouth match the sound" into a trainable objective, and what the coefficients in coefficient-driven systems actually are (3D morphable face models — the idea that makes faces into vectors).',
    sections: [
      {
        h: 'The sync discriminator: hiring a judge instead of writing a rulebook',
        p: 'Nobody can hand-write the loss function for "this mouth matches this sound." Wav2Lip\'s insight (inherited from SyncNet) is to LEARN the judge first: pre-train a discriminator on real video with two towers — one embedding a short window of mouth-region frames, one embedding the corresponding audio window — trained contrastively so in-sync pairs land close in the shared space and off-sync pairs (same video, audio shifted by a few hundred ms) land far. That network, frozen, becomes an instrument that scores audio-visual sync. Then the lip-sync generator trains against three pressures simultaneously: reconstruction loss (look like the ground-truth frames), a visual-quality GAN discriminator (look like real video, no smearing), and the frozen sync expert\'s score (MATCH the audio — the term that forbids the easy cheat of rendering a plausible-but-generic mouth). The pattern is worth generalizing: when a property is perceptual and easy to VERIFY but hard to SPECIFY, train a verifier and use it as a training signal — you will meet it again in evaluation (Part 7 uses sync-expert scores as a lip-sync metric) and it rhymes with LLM-as-judge techniques. One practical corollary: the sync expert operates on ~200ms windows, which is why lip-sync models tolerate no audio/video drift at mux time — a muxing bug that offsets audio by 3 frames destroys, at playback, exactly the property the whole training process fought for.'
      },
      {
        h: '3DMM coefficients: a face as a point in face-space',
        p: 'The coefficients in SadTalker-class systems come from 3D Morphable Models — the 1999 idea that keeps paying rent: scan/collect thousands of 3D faces, and represent any face as deviations from a mean face along learned axes. Identity axes (bone structure, proportions — fixed per person) and expression axes (the standard set runs to ~50-60 dimensions: jaw open, lip corner pull, brow raise…) — plus rigid head pose (yaw/pitch/roll). Any face, any moment: one identity vector + one expression vector + one pose = a compact, INTERPRETABLE description. A face-reconstruction network estimates the identity coefficients from the source image once; the audio-to-motion network then generates only the expression+pose streams over time; a renderer (neural, in modern systems) produces pixels from image + coefficients per frame. Now every promise this lesson made becomes mechanical: editability — "smile more at 0:03" is +delta on the lip-corner dimensions across those frames, a drag on a curve is a direct coefficient write; the aliveness layer — additive signals on lid/pose dimensions, which is why it was "almost free"; identity drift — rendering at pose angles far from the source image forces the renderer to hallucinate unseen regions (the far cheek, under-chin), where resemblance quietly erodes — hence intake\'s preference for near-frontal sources and the renderer\'s preference for modest motion. Expression and identity axes are not perfectly orthogonal either, so extreme expression edits can shade into "slightly different person" — the reason Part 4 will clamp edit magnitudes rather than trust every requested delta.'
      }
    ]
  },
  quiz: [
    {
      q: 'The organizing question that separates the three talking-head families is:',
      options: ['Which GAN architecture they use', 'What is generated versus preserved: inpainting generates only the mouth, coefficient systems generate whole-head motion from editable parameters, motion transfer borrows a real performance', 'Whether they run on GPU', 'Which audio format they accept'],
      correct: 1,
      explain: 'Pixels-preserved ↔ motion-generated is the spectrum; each family is a position on it, and each position buys identity fidelity, editability, or naturalness at the others\' expense.'
    },
    {
      q: 'Quality lip-sync consumes mel-spectrogram windows rather than Whisper word timings because:',
      options: ['Whisper is too slow for video', 'Word timings carry tens-of-ms alignment error and no coarticulation, while the eye flags sync drift beyond ~40-60ms — the audio itself is the precise signal', 'Spectrograms are smaller files', 'Text is unavailable at render time'],
      correct: 1,
      explain: 'The tolerance argument from the Whisper lesson, cashed in: captions tolerate ±100ms, lips do not. Articulation maps from audio features; text keeps only coarse-alignment jobs.'
    },
    {
      q: 'A perfectly lip-synced avatar gets "creepy" feedback. The most likely missing piece:',
      options: ['Higher resolution', 'The aliveness layer — randomized blinks, micro head drift, breathing, emphasis nods; a motionless face reads as dead faster than a bad mouth does', 'A better voice clone', 'Slower speech'],
      correct: 1,
      explain: 'Stillness is the uncanny trigger. Procedural idle motion layered onto speech motion — irregular by design — is what turns "a mouth that moves" into "a face that speaks."'
    },
    {
      q: 'DenDen Studio\'s offline path must be coefficient-driven because:',
      options: ['It renders fastest', 'The product\'s editing features need an editable intermediate — described edits and click-drags mutate coefficient streams; a pixels-only pipeline offers no handle cheaper than full regeneration', 'Coefficients look more realistic', 'Wav2Lip is closed source'],
      correct: 1,
      explain: 'The editing feature decides the architecture: "fix by describing or dragging" requires the performance to exist as data. Persist coefficients before rendering, and edits become data mutations plus a re-render.'
    },
    {
      q: 'The TTS stage ships a slightly muffled render and the avatar\'s articulation turns mushy. This illustrates:',
      options: ['A sync-model bug', 'The chain of ceilings: consonant articulation lives in sharp spectrogram transients, so smeared audio yields smeared mouth shapes — each stage\'s output ceiling is the next stage\'s input ceiling', 'GPU memory pressure', 'A codec mismatch'],
      correct: 1,
      explain: 'No component failed; the pipeline faithfully propagated degraded input. Debug sync complaints by inspecting the audio first, and never lossy-re-encode between synthesis and sync.'
    }
  ],
  pitfalls: [
    'Choosing the talking-head model from demo reels and discovering at Part 4 that your beautiful pixels have no edit handles. The editing feature is an ARCHITECTURE requirement, not a UI garnish — if the product promises fixable animation, the pipeline\'s middle must be interpretable motion data, decided on day one.',
    'Driving articulation from word/phoneme timings because the transcript is already there. It works, it demos fine at arm\'s length, and it reads as "dubbed" the moment anyone looks closely — the 40-60ms sensitivity of human sync perception is unforgiving, and audio-feature-driven articulation is how every quality system clears it.',
    'Shipping metronomic idle motion. A blink every exactly 4.0 seconds, a perfectly sinusoidal head sway — periodic aliveness reads as MORE mechanical than none, because the viewer\'s pattern detector locks onto it. Randomize intervals (seeded, for reproducible renders), smooth the noise, and keep amplitudes small enough that nobody consciously notices anything at all.'
  ],
  interview: [
    {
      q: 'Survey the main approaches to making a still portrait speak, and give the decision framework for choosing among them.',
      a: 'Organize by what is generated versus preserved. Mouth-region inpainting (Wav2Lip-class): output frames are the source pixels except a generated mouth patch conditioned on audio features — near-perfect identity by construction, fast, works on video sources for re-dubbing; but nothing outside the mouth can move, so still-image sources read as a portrait with a moving mouth, and no aliveness layer is possible. Coefficient-driven (SadTalker-class): audio maps to interpretable motion streams — 3DMM expression dimensions, head pose, blinks — and a neural renderer animates the image accordingly; whole-head life, an EDITABLE performance (the coefficients are data), moderate cost; identity can drift at large pose deltas from the source. Motion transfer (LivePortrait-class): motion extracted from a real driving video re-animates the still — the most natural motion available openly, tolerant of stylized/illustrated sources; requires or generates a driving performance. End-to-end diffusion (EMO-class frontier): best published naturalness, slowest, and no interpretable handles. Decision framework, in order: (1) does the product need EDITING of the result? — then an interpretable intermediate is mandatory and pixels-only options are out; (2) latency/hardware budget — live paths get inpainting or light warping, offline paths afford coefficients or diffusion; (3) source type — illustrations favor motion transfer; re-dubbing existing video favors inpainting; (4) identity sensitivity versus motion range — big requested motion from one frontal photo pushes toward approaches that manage hallucinated regions well. The meta-answer interviewers want: the editing requirement usually decides it before quality comparisons even begin.'
    },
    {
      q: 'Why do production lip-sync systems drive the mouth from audio features rather than from the transcript, given the transcript is usually available anyway?',
      a: 'Because the transcript path stacks three timing errors on a task with a ~40-60ms perceptual tolerance. Word timestamps from STT are alignment inferences with tens-of-ms error; distributing phonemes within each word\'s span is guesswork atop that; and mapping phonemes to discrete viseme keyframes discards coarticulation — real articulation blends adjacent shapes continuously, with the mouth pre-forming upcoming vowels during consonants. Each error is individually forgivable and their sum reads as "dubbed foreign film." Audio-feature-driven systems learn one direct mapping from mel-spectrogram windows to mouth shapes — the timing is inherently exact because the FEATURES ARE THE AUDIO, and coarticulation is learned implicitly from real video (Wav2Lip further enforces it with a pre-trained sync discriminator scoring audio-visual match during training). The transcript keeps the jobs its precision actually supports: captions, click-to-seek, edit anchoring — coarse alignment, ±100ms class. Two engineering corollaries: lip quality inherits audio quality (smeared transients yield smeared articulation — inspect audio before blaming the sync model), and audio/video offset introduced at mux destroys sync regardless of how well the model performed — the property is fragile end-to-end and deserves an automated check at final assembly.'
    },
    {
      q: 'Your avatar\'s lips are perfectly synced but user testing keeps returning "unsettling / robotic / something is off." Debug the perception, not the model.',
      a: 'The complaint pattern — sync verified correct, affect wrong — points at the aliveness layer and its statistics, so I audit motion BEYOND the mouth in order of perceptual weight. Blinking: present at all? At human rate (every 2-6s)? IRREGULAR? — a fixed-period blink reads as more mechanical than none; the interval needs a randomized distribution, plus occasional doubles. Head motion: a perfectly stationary head is corpse-still — there should be low-frequency micro-drift with slow re-centering, and small emphasis nods loosely coupled to speech energy peaks (with a refractory period, or every syllable nods and it becomes a bobblehead). Gaze: eyes locked dead-center for minutes triggers the stare response — micro-saccades and occasional brief gaze shifts break it. Silence behavior: during pauses the mouth should fully close and settle (VAD spans drive a rest state); a mouth that hovers half-open through silences is a classic "something is off" source. Motion quality: check for symmetric attack/decay on mouth openness (flappy-puppet signature), coefficient jitter needing smoothing, and amplitude — idle motion should be consciously INVISIBLE; if a viewer can name the head-sway, it is too loud. Process point: these are perceptual defects, so the test harness is A/B clips toggling one layer at a time in front of fresh viewers — the builder habituates within an hour and stops being able to see any of it, which is itself worth saying in an interview.'
    },
    {
      q: 'You must support both an offline "quality" render and a live avatar in one product. How do the talking-head choices differ, and what do the two paths share?',
      a: 'They differ because their binding constraints differ. Offline binds on OUTPUT quality and editability: coefficient-driven generation (SadTalker-class), full aliveness layer, rendering at native resolution, and — the architectural keystone — coefficients persisted before rendering, so creator edits (Part 4\'s described changes and click-drags) mutate data and re-render rather than re-infer, and caching can skip unchanged stages entirely. Live binds on LATENCY: every stage must process small chunks at frame rate on hardware that is simultaneously running capture, voice conversion, and encoding — so the head model drops to light mouth-region inpainting or viseme-driven 2.5D warping, resolution drops, the aliveness layer simplifies to its cheapest terms (blinks and small drift — procedural signals cost nothing), and quality is explicitly traded: a live audience forgives a stiffer avatar; a recorded one does not. What the paths share, deliberately: the intake stage and its detector geometry (one enrollment, both paths anchor on the same landmarks); the voice registry and consent gate (both paths speak in enrolled voices only); the audio-feature front end (mel windows and an energy curve — computed once, consumed by articulation and emphasis motion in both modes); and the product\'s visual identity — the live avatar should read as a lighter rendition of the SAME character, not a different puppet. Managing the two as one pipeline with two profiles — rather than two codebases — is the maintainability decision that pays for the rest of the product\'s life.'
    }
  ]
};
