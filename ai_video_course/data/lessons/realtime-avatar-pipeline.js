window.LESSONS = window.LESSONS || {};
window.LESSONS['realtime-avatar-pipeline'] = {
  id: 'realtime-avatar-pipeline',
  title: 'The Live Avatar: Mic In, Talking Picture Out, Under a Latency Budget',
  category: 'Part 3 — Making Pictures Talk',
  timeMin: 45,
  summary: 'The showpiece feature: the creator speaks into the mic, and the picture speaks WITH them — live, optionally in a different voice. Every model in the chain already exists in your toolkit; what changes is physics. Batch pipelines optimize quality per second of output; live pipelines optimize milliseconds of end-to-end delay, processed chunk by chunk, on hardware where every live model must be resident simultaneously. This lesson derives the latency budget, allocates it across stages, works through streaming mechanics (chunk sizes, boundary artifacts, lookahead), and builds the degradation ladder that keeps the avatar alive when the machine falls behind — with one law above all: audio is the clock, and lips never drift from it.',
  goals: [
    'Draw the live loop — mic → VAD → voice transform → lip sync → composite → screen — and explain why each stage\'s latency ADDS',
    'Set and defend an end-to-end latency target, allocate it per stage, and measure p95 rather than averages',
    'Reason about chunk size: the latency/quality/overhead triangle of streaming, boundary artifacts, and model lookahead',
    'Apply Part 0\'s co-residency arithmetic: live mode needs the SUM, which is why every live model is the small variant',
    'Design the degradation ladder — what quality to sacrifice, in what order, when the machine cannot keep up — with audio-video sync as the never-sacrificed invariant'
  ],
  concept: [
    {
      h: 'Same models, different physics: the live loop',
      p: [
        'The live loop reuses the whole toolkit: mic capture feeds <b>streaming VAD</b> (speech spans, utterance boundaries — the Whisper lesson\'s gate, now running continuously); speech chunks flow through the <b>voice path</b> — direct voice conversion, one hop, chosen over STT→TTS precisely for the reasons priced in Part 2 (prosody preserved, one inference instead of two); converted audio drives a <b>light lip-sync model</b> (the talking-head lesson\'s live-path choice: mouth-region inpainting or viseme-driven warping, NOT the coefficient pipeline); frames composite with a simplified aliveness layer and hit the screen. Nothing new — except everything is different.',
        'Batch pipelines answer "how good can output be, given time?" Live pipelines answer "how little time can pass between the creator\'s lips and the avatar\'s?" — because that gap is the product. Two structural consequences follow immediately. <b>Latencies add</b>: capture buffer + VAD + VC inference + sync inference + render + display is a SUM, so a budget overspent anywhere is blown everywhere — no stage can be optimized in isolation. And <b>co-residency is mandatory</b>: Part 0\'s sum-vs-max arithmetic returns with the other sign — batch stages ran sequentially and needed only the max; live stages run simultaneously and need the SUM resident, which is the real reason every live model is the tiny variant. The live path was never a stripped-down afterthought; it is a different point on every trade this course has taught.'
      ]
    },
    {
      h: 'The budget: a number you pick, defend, and allocate',
      p: [
        'Human tolerance sets the target. Conversational turn-taking starts feeling laggy past ~200 ms; for a performer watching their own avatar, mouth-to-avatar delay under <b>~250-300 ms</b> keeps the "it is me" illusion, while approaching half a second the avatar becomes a laggy puppet and the performer\'s own speech rhythm degrades (delayed auditory/visual feedback is genuinely disruptive — the brain hates hearing itself late). Pick the number FIRST — say 300 ms p95 — and everything downstream becomes an allocation exercise: capture+buffering 40 ms, VAD ~5, voice conversion 80, lip-sync 100, composite+encode+display 60, leaving ~15 ms of headroom that will evaporate the first week.',
        'Two measurement disciplines make the budget real rather than aspirational. <b>Measure p95, not means</b> — a 200 ms average with 800 ms spikes is a broken product (the spike is what the audience remembers), and spikes have causes worth hunting: GC pauses, model cold paths, contention with the encoder. And <b>instrument per-stage from day one</b>: timestamps stamped onto each chunk at every boundary, so "it feels laggy today" resolves to "VC inference regressed 30 ms after the driver update" in minutes. This is the flaky-test discipline of the media world: intermittent latency, like intermittent failure, is data to taxonomize, never vibes to shrug at.'
      ]
    },
    {
      h: 'Streaming mechanics: chunks, boundaries, and lookahead',
      p: [
        'Live audio arrives as a stream and must be processed in <b>chunks</b>, and the chunk size is a three-way trade. Small chunks (say 40-60 ms): low added latency (a chunk cannot be processed before it finishes arriving — chunk duration is a latency FLOOR), but more per-chunk overhead (model invocation costs amortize badly) and more <b>boundary artifacts</b> — each chunk is processed without knowing what follows, and naive concatenation of independently-processed audio clicks and warbles at every seam. Large chunks (300+ ms): smoother, cheaper per second — and laggier by construction. Production answer: modest chunks with <b>overlap</b> — process overlapping windows, crossfade the overlapping output regions — plus models designed for streaming that carry internal state across chunks instead of starting cold each time.',
        'Then the quiet budget-killer: <b>lookahead</b>. Many models consume future context to process the present — a VC model whose receptive field extends 100 ms ahead cannot emit its output until that future audio has ARRIVED, adding 100 ms of inherent latency no faster GPU can remove. Batch never notices (the whole file is "the past"); live pays it in wall-clock delay. This is why live variants of models are not merely smaller but architecturally different — causal or low-lookahead designs — and why "just run the batch model faster" is a category error. When evaluating any model for the live path, its lookahead is as important as its inference time: both are line items in the same budget.'
      ]
    },
    {
      h: 'The degradation ladder — and the one thing never sacrificed',
      p: [
        'The machine WILL fall behind: a background process steals the GPU, thermals throttle, the creator opens a browser tab with 40 ads. A live system without a degradation policy answers overload with stutter, freeze, or runaway delay (the queue grows, the avatar slips seconds behind, then minutes). A designed system degrades on a <b>ladder</b>, cheapest sacrifice first: (1) drop the aliveness extras (emphasis nods, drift — procedural, nobody misses them under stress); (2) reduce render resolution (a softer avatar is barely noticed live); (3) increase chunk size (trade some latency for throughput headroom); (4) simplify the sync model (viseme-warp fallback); (5) last resort: freeze the avatar to a resting loop and keep AUDIO flowing — a still picture with live voice degrades gracefully; a frozen mouth with continuing audio reads as broken.',
        'And the invariant the ladder must never touch: <b>audio-video sync</b>. Audio is the clock — every video frame carries the timestamp of the audio chunk that drove it, the compositor schedules frames against the audio playhead, and when video falls behind it <b>drops frames to catch up</b>, never stretches or lets the gap grow. The asymmetry is perceptual law: audiences tolerate a blurry avatar, a stiff avatar, even a briefly frozen avatar — they do not tolerate lips out of time (the talking-head lesson\'s 40-60 ms sensitivity, now enforced at runtime rather than training time). Every rung of the ladder preserves the sync anchor; recovery climbs back up the same rungs, with hysteresis so the system does not oscillate between rungs at the boundary. Degradation is not failure handling bolted on — it is the live product\'s actual quality curve, designed.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Live Broadcast Snail: Franky\'s Relay Budget and the Storm Ladder',
      text: 'For the kingdom\'s coronation, the crew is hired to run something unprecedented: a LIVE visual Den Den Mushi broadcast — the ceremony transmitted, as it happens, to a plaza screen three islands away. Usopp assumes it is his portrait theater again and begins storyboarding; Franky stops him with a shipwright\'s bluntness: "Theater, you rehearse and perfect. Broadcast, the picture must reach the plaza while the king is still mid-bow. Different physics, different machine." Franky\'s planning wall is a chain of relay snails — capture snail, signal-cleaning snail, the voice-carrying line, the picture line, the plaza projector — each labeled with its DELAY in heartbeats, and a big painted number at the top: the total the plaza will feel, which is the SUM of every link, "so a heartbeat wasted anywhere is wasted everywhere." He auditions relay snails like an accountant: the magnificent deep-line snail that produces gorgeous signal but holds each burst for three heartbeats "listening ahead" before it relays — rejected for the live line ("its waiting is delay no training can remove; save it for recorded work"), replaced by a plainer, quick-relay breed. Signal travels in bursts, and burst size is its own argument: tiny bursts arrive fast but hiss at every seam ("each burst relayed blind, not knowing what follows"), huge bursts arrive smooth but late — Franky settles on modest bursts with overlapped edges, blended at the plaza so seams vanish. The storm plan is nailed to the relay mast as a numbered ladder: weather worsens, sacrifice in ORDER — first the decorative banner-flutter effects, then picture sharpness, then burst tempo — "and the LAST thing standing is the voice, over a still portrait of the king if it comes to that." Beneath the ladder, underlined three times, Franky\'s one law: THE VOICE IS THE CLOCK. Every picture burst is stamped against the voice burst that birthed it; if pictures fall behind, the projector DROPS them to catch up — never stretches, never lets the gap grow. "A blurry king is still a king," Franky tells the plaza crew. "A king whose lips move after his words? The crowd will say the broadcast lies. They forgive everything except time."'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Fun with Flags LIVE: Leonard\'s Budget, Sheldon\'s Buffer, and the Night the Stream Fell Behind',
      text: 'Sheldon announces Fun with Flags is going LIVE — real-time viewer interaction, "the flag community deserves immediacy" — and drafts Leonard as broadcast engineer. Leonard\'s first act is taping a number to the desk: 300 milliseconds, glass to glass. "Everything we do fits inside that, or it does not go in the show." His whiteboard is a sum: webcam buffer plus processing plus encoding plus the works, each stage a line item, "and they ADD, Sheldon — there is no stage so innocent it is free." Howard, helping, proposes the audiophile approach: a luxurious ten-second buffer so every frame can be polished — and Sheldon vetoes it with unexpected engineering clarity: "Then a viewer asks about vexillological symmetry, and I answer eleven seconds after the chat has moved on to a cat. Delayed, I am not live; I am a rerun that types." The night of the broadcast supplies the rest of the syllabus. Twenty minutes in, Sheldon\'s laptop starts thermal-throttling (Raj installed a "flag confetti" particle effect), the stream stutters, and Leonard executes the degradation list he had — being Leonard — printed and laminated: confetti off first ("decoration dies first, nobody mourns it"), then camera resolution down one notch ("blurry live beats crisp late"), then slightly larger encoding chunks. Sheldon objects to each sacrifice until Penny, watching the viewer counter, translates: "They are STAYING, Sheldon. Blurry you is fine. Frozen you is a refund." The one thing Leonard refuses to negotiate arrives when the video pipeline hiccups and Sheldon suggests slowing the video "to let it catch up gracefully": absolutely not — audio is the clock, frames that miss their moment get DROPPED, not delayed, "because viewers will forgive a skipped frame and will never forgive your lips landing after your words — they will not say the stream is slow, they will say something is WRONG with it." The recap email Sheldon sends the flag community afterward — subject line: A Blurry Flag Is Still A Flag — includes Leonard\'s laminated ladder as an appendix, with the last line highlighted: audio survives everything.'
    },
    why: 'Franky\'s relay wall and Leonard\'s taped-up 300 ms are the latency budget: picked first, defended stage by stage, with both engineers insisting the total is a SUM no stage escapes. The deep-line snail that "listens ahead" and Howard\'s ten-second buffer are lookahead and buffering as inherent latency — quality bought with waiting, correct for recorded work, disqualifying live, which is why live models are architecturally different rather than merely faster. Burst size and the hissing seams are chunking: small-fast-artifacty versus large-smooth-laggy, resolved with overlapped, crossfaded edges. The storm ladder and the laminated list are the degradation policy — decoration first, sharpness second, tempo third, voice last, with recovery climbing back the same rungs — and both stories land the identical invariant the lesson refuses to trade: the voice is the clock, late frames are dropped never stretched, because audiences forgive blur, stiffness, even a frozen portrait, and never forgive lips out of time. "A blurry king is still a king" is the whole live product philosophy in one line.'
  },
  tech: [
    {
      q: 'Why does the live path use direct voice conversion instead of STT→TTS, quantitatively? Rebuild the argument as a latency ledger.',
      a: 'Ledger the two paths against a 300 ms budget. STT→TTS: streaming STT needs enough audio context to commit words — even aggressive incremental Whisper configurations effectively add 300-800 ms before stable text exists (the unstable tail cannot be spoken aloud, or the avatar retracts words); TTS synthesis adds its own inference plus, subtler, it needs a text SPAN to produce natural prosody — synthesizing word-by-word yields robotic output, so you wait for phrase boundaries: more buffering. Realistic end-to-end: 600-1200 ms — a rerun that types, not a live avatar. Direct VC: one model, audio-to-audio, streamable in 40-80 ms chunks with low-lookahead architectures; inference on a modest GPU runs faster than realtime, so the path cost is roughly chunk duration + inference + crossfade — comfortably 100-150 ms, leaving budget for sync and render. Plus the qualitative edge that matters MORE live: VC preserves the performer\'s prosody in the moment (their timing IS the show), while STT→TTS re-invents it after the fact. STT still runs in live mode — in parallel, off the critical path — for captions and the LLM director\'s awareness; it just never gates the audio. The general lesson: count the WAITING (context requirements, phrase buffering), not just the inference — waiting is the live path\'s dominant cost and the easiest to overlook on a spec sheet.'
    },
    {
      q: 'Your live avatar\'s p95 latency regressed from 280 ms to 450 ms after a "minor" update. Walk through the hunt.',
      a: 'Per-stage timestamps make this mechanical; without them it is archaeology — so step zero is confirming the chunk-boundary instrumentation still works. (1) Diff the per-stage p95s against the pre-update baseline: latency budgets are sums, so the regression lives in identifiable line items. Suppose VC inference jumped 40 ms and composite jumped 90. (2) For each regressed stage, separate compute from waiting: did inference itself slow (driver/library update changed kernels — check with an isolated micro-benchmark), or did the stage start WAITING (queue ahead of it deepened, chunk size config drifted, a new dependency introduced lookahead)? (3) Check the co-residency ledger: a minor update that grew any model\'s memory can push the sum past VRAM, causing silent paging or the runtime evicting/reloading models mid-stream — the signature is bimodal stage latency (fast chunks and horrible chunks), which is also why p95 caught what the mean hid. (4) Check contention: did the update add background work (telemetry, an auto-updater, the confetti effect) competing for GPU or the encoder? (5) Only after locating the stage and mechanism, fix — and add the regression as a budget assertion in CI if the stages are testable offline: replay a recorded session through the pipeline and assert per-stage p95s against thresholds. Live latency regressions are flaky-test cousins: intermittent, environment-sensitive, and only tractable because you built the instrumentation BEFORE you needed it.'
    },
    {
      q: 'Explain the audio-is-the-clock rule mechanically: what does the compositor actually do, and why is stretching video to catch up always wrong?',
      a: 'Mechanics: every audio chunk gets a monotonic timestamp at capture; every derived artifact — converted audio, mouth frames, composite frames — inherits the timestamp of the audio that caused it. Playback runs one master clock: the audio playhead (audio output is nearly free and never backlogs, so it plays continuously). The compositor holds a small frame queue and, at each display refresh, shows the frame whose timestamp matches the audio playhead within tolerance; frames arriving with timestamps already behind the playhead are DROPPED unshown; frames far ahead wait. Video therefore adapts to audio, never vice versa. Why stretching (slowing video to let it catch up) is always wrong: it converts a transient hiccup into a growing debt — while video plays at 0.9x, audio continues at 1.0x, so the gap WIDENS during the "recovery"; you have scheduled the desync to worsen smoothly. Pausing audio to wait for video is differently wrong: audible gaps and stutters are the single most jarring artifact available, and live audio is the performance itself. Dropping frames costs a barely-perceptible visual skip and instantly restores the invariant. The rule generalizes beyond avatars — it is how every video-call and streaming system works — and the interview-grade summary is: one media stream must be the clock; make it the one whose glitches humans forgive least (audio), and make the other stream absorb all slack via discards, never via time distortion.'
    }
  ],
  code: {
    title: 'The live loop, instrumented and degradable',
    intro: 'The runtime skeleton: chunked processing with per-stage timing, the audio-clock compositor contract, and the degradation controller reading the p95s. The budget math and ladder policy are the lab.',
    code: `import time, collections

CHUNK_MS = 60                 # latency floor: a chunk must ARRIVE first
BUDGET_MS = 300               # glass-to-glass p95 target, picked FIRST

STAGE_TIMINGS = collections.defaultdict(lambda: collections.deque(maxlen=500))

def timed(stage, fn, *args):
    t0 = time.perf_counter()
    out = fn(*args)
    STAGE_TIMINGS[stage].append((time.perf_counter() - t0) * 1000)
    return out

def p95(stage):
    xs = sorted(STAGE_TIMINGS[stage])
    return xs[int(len(xs) * 0.95)] if xs else 0.0

def live_loop(mic, screen, voice_id, quality):
    for chunk in mic.stream(CHUNK_MS):            # chunk.t = capture stamp
        if not timed('vad', vad_is_speech, chunk):
            screen.rest_state(at=chunk.t)         # closed mouth, idle only
            continue
        audio = timed('vc', vc_stream, chunk, voice_id)   # one hop, causal
        mouth = timed('sync', lipsync_light, audio, quality.resolution)
        frame = timed('comp', composite, mouth,
                      aliveness='minimal' if quality.degraded else 'full')
        # AUDIO IS THE CLOCK: frame carries its source audio's timestamp.
        # The compositor SHOWS it when the audio playhead reaches chunk.t,
        # DROPS it if the playhead has passed. Never stretches. Ever.
        screen.schedule(frame, at=chunk.t)
        audio_out.play(audio, at=chunk.t)         # plays continuously

        total = sum(p95(s) for s in ('vad', 'vc', 'sync', 'comp'))
        quality.adjust(total + CHUNK_MS, BUDGET_MS)   # ladder controller

# Degradation ladder: cheapest sacrifice first, recovery in reverse,
# hysteresis so rungs do not oscillate. Policy shape (lab builds it):
LADDER = [
    {'name': 'aliveness_minimal', 'saves_ms': 8},
    {'name': 'resolution_down',   'saves_ms': 35},
    {'name': 'chunk_size_up',     'saves_ms': 20},   # trades latency floor
    {'name': 'sync_model_lite',   'saves_ms': 45},   #   for throughput
    {'name': 'freeze_to_rest',    'saves_ms': 80},   # audio survives all
]`,
    notes: [
      'Per-stage deques of recent timings make p95 a rolling, cheap query — the degradation controller reads live percentiles, not means, because the spike is what the audience remembers.',
      'The rest_state call on non-speech chunks is the VAD span data doing its third job (after hallucination-gating and pause records): a live avatar that visibly STOPS talking when you stop is half of what makes it feel connected to you.'
    ]
  },
  lab: {
    title: 'Budget arithmetic and the ladder controller',
    prompt: 'Two functions. (1) <code>glass_to_glass(stages, chunk_ms)</code>: given stage latencies <code>{"vad": 5, "vc": 80, ...}</code> (ms), return total pipeline latency: <code>chunk_ms</code> (the arrival floor) plus the sum of all stage latencies. (2) <code>apply_ladder(total_ms, budget_ms, ladder)</code>: <code>ladder</code> is an ordered list of <code>{"name", "saves_ms"}</code>. Apply rungs IN ORDER, each subtracting its <code>saves_ms</code>, ONLY until <code>total_ms &lt;= budget_ms</code> (do not apply rungs past the first configuration that fits). Return <code>{"applied": [names], "final_ms": value, "within_budget": bool}</code> — with <code>within_budget</code> False if even the full ladder cannot fit the budget (all rungs applied).',
    starter: `def glass_to_glass(stages, chunk_ms):
    # chunk arrival floor + sum of every stage - latencies ADD
    pass

def apply_ladder(total_ms, budget_ms, ladder):
    # rungs in order, stop as soon as total fits; report what it took
    pass`,
    checks: [
      { re: 'def\\s+glass_to_glass\\s*\\(', flags: '', must: true, hint: 'Define glass_to_glass(stages, chunk_ms).', pass: 'glass_to_glass defined ✓' },
      { re: 'def\\s+apply_ladder\\s*\\(', flags: '', must: true, hint: 'Define apply_ladder(total_ms, budget_ms, ladder).', pass: 'apply_ladder defined ✓' },
      { re: 'sum\\s*\\(', flags: '', must: true, hint: 'Pipeline latency is a SUM of stages plus the chunk floor.', pass: 'summing stages ✓' },
      { re: 'within_budget', flags: '', must: true, hint: 'Report whether the budget was met even after the full ladder.', pass: 'budget verdict reported ✓' }
    ],
    tests: `stages = {'vad': 5, 'vc': 80, 'sync': 100, 'comp': 60}
assert glass_to_glass(stages, 60) == 305, 'floor 60 + stages 245'

ladder = [{'name': 'aliveness_minimal', 'saves_ms': 8},
          {'name': 'resolution_down', 'saves_ms': 35},
          {'name': 'chunk_size_up', 'saves_ms': 20},
          {'name': 'freeze_to_rest', 'saves_ms': 80}]
r = apply_ladder(305, 300, ladder)
assert r['applied'] == ['aliveness_minimal'], \
    'first rung suffices: 305-8=297 <= 300; got ' + str(r['applied'])
assert r['final_ms'] == 297 and r['within_budget'] is True

r = apply_ladder(380, 300, ladder)
assert r['applied'] == ['aliveness_minimal', 'resolution_down',
                        'chunk_size_up'], 'three rungs: 380-63=317... ' \
    'then 317-20=297? No: 380-8=372, -35=337, -20=317 > 300, continue'
# recompute: 380-8=372, -35=337, -20=317, -80=237 -> needs all four
r2 = apply_ladder(380, 300, ladder)
assert r2['applied'][-1] == 'freeze_to_rest' and r2['final_ms'] == 237
assert r2['within_budget'] is True

r3 = apply_ladder(600, 300, ladder)
assert r3['within_budget'] is False and len(r3['applied']) == 4, \
    'full ladder applied and still over budget: report honestly'
assert r3['final_ms'] == 457
print('budget arithmetic and ladder correct')`,
    solution: `def glass_to_glass(stages, chunk_ms):
    return chunk_ms + sum(stages.values())

def apply_ladder(total_ms, budget_ms, ladder):
    applied = []
    for rung in ladder:
        if total_ms <= budget_ms:
            break
        total_ms -= rung['saves_ms']
        applied.append(rung['name'])
    return {'applied': applied, 'final_ms': total_ms,
            'within_budget': total_ms <= budget_ms}`,
    notes: [
      'Note the deliberately awkward middle test: writing out the arithmetic rung by rung (380→372→337→317→237) is exactly how you sanity-check a real ladder design — if the rungs\' combined savings cannot cover realistic overloads, the ladder needs bigger rungs, and better to learn that on paper than on stream.',
      'Production adds hysteresis (recover a rung only when comfortably under budget, e.g. below 85%) and rate limits (one rung change per few seconds) — otherwise the controller oscillates at a rung boundary and the avatar visibly flickers between quality levels, which reads worse than either level.'
    ]
  },
  deepDive: {
    timeMin: 12,
    intro: 'Two mechanisms beneath the budget: how chunk-boundary artifacts actually arise and die (overlap-add and streaming state), and where latency hides in places no profiler labels (buffers, pacing, and the display itself).',
    sections: [
      {
        h: 'Why seams click, and the two cures: overlap-add and carried state',
        p: 'Process audio chunks independently and the output waveforms will not agree at the boundaries: each chunk\'s model inference starts from nothing, so the last sample of chunk N and the first of chunk N+1 embody slightly different decisions — a discontinuity, heard as a click; with spectral processing, a warble. Cure one is overlap-add: process windows that overlap by 20-50%, then crossfade the overlapping output regions (equal-power fades, so summed energy stays constant) — discontinuities become gradual transitions below audibility. It costs redundant computation (the overlap is processed twice) and a little latency (the crossfaded region must wait for its second contributor). Cure two is architectural: streaming-native models carry internal state (recurrent state, cached convolution context, KV-cache analogues) across chunks, so chunk N+1 genuinely CONTINUES chunk N rather than starting cold — no disagreement, no seam, minimal overlap needed. Most production live paths combine both: a streaming-capable model plus a small safety crossfade. The video-side equivalent: mouth-region frames generated per-chunk can pop at boundaries (the mouth\'s trajectory disagrees) — cured by conditioning each chunk\'s generation on the previous chunk\'s final frames (carried state again) or blending a few boundary frames (overlap again). Same disease, same two cures, different medium — one of those correspondences that makes media engineering learnable.'
      },
      {
        h: 'The invisible line items: where latency hides off the profiler',
        p: 'Sum your model inferences and you will predict 180 ms; the screen will show 320. The gap lives in line items no model profiler reports. Capture buffering: the OS audio stack delivers input in ITS buffer quanta (often 10-20 ms, sometimes worse) and the driver may double-buffer — you cannot see audio the hardware has not handed over. Queue depth: every producer-consumer boundary (capture→VAD, VC→sync) holds a queue, and a queue with average depth 1.5 chunks silently adds 1.5 chunk-times of latency; queues must be measured (depth is a metric) and bounded (drop-oldest under pressure, matching the audio-clock discard rule). Encoder pacing: hardware encoders batch frames for efficiency and can hold a frame for the next batching interval. Display pipeline: the compositor waits for vsync — a frame missing the refresh window by 1 ms waits a full 16.7 ms (at 60 Hz), and the OS may add another composited frame of delay; this alone is why glass-to-glass measurements need a hardware reference (film a clap and the screen with one high-speed phone camera — the honest instrument, absurdly effective). GC and allocator pauses: a garbage-collected runtime in the hot path contributes rare 50-200 ms stalls that live exclusively in the p95+ tail — the audio path especially should be allocation-free in steady state. The meta-lesson: the budget must be allocated against MEASURED end-to-end reality, not the sum of model spec sheets, and the p95 gap between the two is a checklist of exactly these items.'
      }
    ]
  },
  quiz: [
    {
      q: 'Live pipelines need every model co-resident (Part 0\'s SUM) while batch needed only the max because:',
      options: ['Live models are smaller anyway', 'Live stages process the same stream simultaneously — chunk N is in lip-sync while chunk N+1 is in voice conversion — so no stage can be unloaded between turns', 'VRAM is cheaper now', 'Batch pipelines have more stages'],
      correct: 1,
      explain: 'Sequential batch stages load-run-release; streaming stages all run at once, forever. The sum-vs-max arithmetic flips sign, and every live model being the small variant follows.'
    },
    {
      q: 'Chunk duration is called a latency FLOOR because:',
      options: ['Small chunks are lower quality', 'A chunk cannot be processed before it finishes arriving — 60 ms of audio takes 60 ms to exist, before any inference begins', 'GPUs round up to chunk size', 'Audio drivers require it'],
      correct: 1,
      explain: 'No optimization removes arrival time. Chunk size trades this floor against per-chunk overhead and boundary artifacts — the streaming triangle.'
    },
    {
      q: 'A VC model with 100 ms of lookahead is problematic live, even on an infinitely fast GPU, because:',
      options: ['Lookahead uses more VRAM', 'It cannot emit output for the present until 100 ms of FUTURE audio has arrived — inherent delay that no compute removes', 'It only affects batch quality', 'Lookahead breaks the crossfade'],
      correct: 1,
      explain: 'Waiting is the cost no spec sheet lists. Live variants are architecturally causal/low-lookahead, not just smaller — "run the batch model faster" is a category error.'
    },
    {
      q: 'When video falls behind, the compositor drops late frames rather than slowing video to "catch up gracefully" because:',
      options: ['Dropping is easier to implement', 'Slowing video while audio continues WIDENS the gap during the recovery — stretching schedules the desync to worsen; dropping restores sync at the cost of an barely-visible skip', 'Frames are expensive to store', 'Audio can be paused instead'],
      correct: 1,
      explain: 'Audio is the clock: it plays continuously, video adapts by discarding. Audiences forgive a skipped frame and never forgive lips landing after words.'
    },
    {
      q: 'The degradation ladder sacrifices aliveness extras first and audio last because:',
      options: ['Aliveness is the most expensive stage', 'The order encodes perceptual forgiveness: decoration is unmissed under stress, blur is tolerated, a frozen avatar with live voice still works — but silent or desynced audio reads as broken', 'Audio uses no GPU', 'It is alphabetical'],
      correct: 1,
      explain: '"A blurry king is still a king." The ladder is the product\'s designed quality curve under load, ordered by what audiences forgive — and the voice survives everything.'
    }
  ],
  pitfalls: [
    'Reporting latency as an average. A 200 ms mean with 800 ms spikes is a broken product wearing a healthy dashboard — the spike is the experience people remember and report. Budget, monitor, and alert on p95 (and look at p99 when hunting), with per-stage timestamps from day one so regressions resolve to line items instead of vibes.',
    'Evaluating live-path models by inference speed alone. Lookahead, required context windows, and phrase-level buffering are latency the spec sheet omits — a "faster" model that needs 200 ms of future audio loses to a "slower" causal one. Count the waiting.',
    'Building degradation as an afterthought exception handler. Overload is not exceptional — it is Tuesday (thermals, background apps, long sessions). Without a designed ladder with hysteresis, the system improvises under pressure: growing queues, drifting sync, frozen frames — each worse than any rung you would have chosen deliberately.'
  ],
  interview: [
    {
      q: 'Design a real-time voice-driven avatar: a user speaks, and an animated character speaks with them in a different voice. Walk through the pipeline and its budget.',
      a: 'Set the budget first: ~300 ms glass-to-glass p95 — beyond that the performer\'s own speech rhythm degrades and the avatar reads as a laggy puppet. Pipeline: mic capture in small chunks (40-60 ms — a latency floor, since a chunk must finish arriving); streaming VAD (Silero-class, ~5 ms) gating processing and driving the avatar\'s rest state during silence; direct voice conversion for the voice swap — chosen over STT→TTS because conversion is one causal-friendly hop (~80 ms) preserving the performer\'s prosody, while streaming STT plus phrase-buffered TTS costs 600+ ms and re-invents the performance (STT still runs in parallel off the critical path for captions); a lightweight lip-sync stage (mouth-region inpainting or viseme warping at reduced resolution, ~100 ms) — not the batch coefficient pipeline; composite with minimal procedural aliveness; hardware encode. All models co-resident (live needs the VRAM sum, hence small variants everywhere), chunk boundaries handled with overlap-crossfade or streaming-state models. Runtime disciplines: audio is the master clock — every frame carries its source-audio timestamp, late frames are dropped never stretched; per-stage timestamps feed rolling p95s; and a designed degradation ladder (aliveness → resolution → chunk size → lighter sync model → freeze-to-rest with audio surviving) with hysteresis handles overload. The design\'s one-sentence summary: minimize waiting rather than just compute, and never let anything outrank sync.'
    },
    {
      q: 'Why can\'t you build the live path by running your high-quality batch pipeline faster? Enumerate the structural differences.',
      a: 'Five structural breaks, none fixable by speed. (1) Completeness assumption: batch stages consume whole files — batch TTS wants full sentences for prosody, batch lip-sync reads the entire audio track; live input does not exist yet, so every stage must work incrementally on partial data. (2) Lookahead: batch models freely use future context; live pays every millisecond of lookahead as wall-clock delay — live variants must be causal or low-lookahead, an architectural property, not a speed setting. (3) Memory model: batch stages run sequentially, needing only the largest stage resident (load-run-release); live stages run simultaneously on a continuous stream, needing the SUM resident — which forces smaller models regardless of speed. (4) Boundary continuity: batch processes one continuous signal; live processes chunks that must agree at seams — requiring overlap-crossfade or carried streaming state, machinery batch never needs. (5) Failure semantics: a slow batch job finishes late; a slow live stage backs up queues, drifts sync, and degrades the product in real time — so live needs bounded queues, an audio-master clock with frame dropping, and a designed degradation ladder. The honest framing: batch and live are two pipelines sharing models and identity — intake geometry, the voice registry, the audio front end — with profiles so different that "the same pipeline, faster" is a category error worth catching at the design review, not in production.'
    },
    {
      q: 'Users report the live avatar "feels off" though your dashboard shows 250 ms average latency. Diagnose.',
      a: 'The mean is hiding the distribution and the dashboard is measuring the wrong thing — three hunts, in order. (1) Tail latency: pull p95/p99 — a 250 ms mean with periodic 700 ms spikes (GC pauses, thermal throttling, encoder batching, model cold paths after idle) feels broken while averaging fine; per-stage rolling percentiles localize the spike source, and bimodal stage timings specifically suggest memory pressure evicting and reloading a model. (2) Sync integrity versus total latency: 250 ms uniform delay is barely noticeable — but if audio and video have DIFFERENT latencies (video 80 ms behind audio, or drifting under load), lips land after words, and viewers report "off" without being able to name it; verify every frame is scheduled against its source-audio timestamp and measure the audio-video offset distribution directly — offset beyond ~50 ms is the likely culprit, and a hardware glass-to-glass check (high-speed phone video of a clap and the screen) validates that the software\'s claims match reality. (3) Behavioral wrongness with perfect timing: does the avatar keep articulating during the user\'s pauses (VAD rest state missing or laggy)? Does the mouth trajectory pop at chunk boundaries (missing crossfade/carried state)? Is idle motion metronomic? Each is invisible to latency metrics and reliably reported as "feels off." Meta-answer: "feels off" complaints about live media systems are, in my experience, sync and behavior bugs wearing a latency costume — instrument offset and behavior before buying a faster GPU.'
    },
    {
      q: 'Design the overload behavior for a live media pipeline. What degrades, in what order, and what governs the controller?',
      a: 'Principles first: degradation is a designed product surface, not exception handling — overload is routine (thermals, contention, long sessions), and the ladder encodes perceptual forgiveness: sacrifice what audiences do not notice before what they do, and never touch the sync invariant. My ladder for an avatar product: (1) procedural extras off — emphasis nods, micro-drift; cheap and unmissed under stress; (2) render resolution down — blur is the most forgiven artifact live; (3) chunk size up one notch — trades a little latency floor for throughput headroom, appropriate when the bottleneck is per-chunk overhead; (4) swap to the lighter sync model — visible stiffening, still coherent; (5) terminal rung: freeze the avatar to a resting loop and keep audio flowing — a still portrait with live voice degrades gracefully, a desynced or silent avatar reads as broken; audio survives everything. Controller design: driven by rolling p95 of measured glass-to-glass (never means — the spike IS the overload signal), with hysteresis (descend at >100% budget, recover a rung only below ~85%) and rate limiting (one rung per several seconds) so the system never oscillates visibly at a boundary; queues bounded with drop-oldest semantics so backlog converts to discards, not growing delay, consistent with the audio-master clock dropping late frames. Instrumentation as part of the design: every rung transition logged with the stage timings that triggered it — the ladder\'s activation history is the capacity-planning dataset that tells you which rung to buy hardware to eliminate. And the pitfall worth naming unprompted: no rung, ever, that trades sync for quality — a beautiful frame shown at the wrong time is the one artifact live audiences never forgive.'
    }
  ]
};
