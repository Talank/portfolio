window.LESSONS = window.LESSONS || {};
window.LESSONS['what-we-are-building'] = {
  id: 'what-we-are-building',
  title: 'DenDen Studio: A Voice, a Picture & a Description Walk Into an App',
  category: 'Part 0 — The Product & the Plan',
  timeMin: 30,
  summary: 'Before writing a single line of code, a builder needs the product spec and the decomposition. This lesson pins down exactly what DenDen Studio does — voice sample in, picture in, description in; animated talking video out, with live voice-driven mode and easy fixing of the animation — and then does the single most important act of LLM-app engineering: breaking that magic-sounding demo into five ordinary, well-studied, open-source model problems that you can download and run on your own machine today.',
  goals: [
    'State the full DenDen Studio product spec precisely: inputs, outputs, the live mode, and the two editing modes (describe the fix, or click-drag the fix)',
    'Decompose the product into its five model-shaped subproblems: speech-to-text, voice cloning / TTS, talking-head lip sync, text-guided motion, and an LLM orchestrating all of it',
    'Explain why every one of those pieces has a strong open-source answer (Whisper, XTTS/Piper, Wav2Lip/SadTalker-style models, AnimateDiff-style models, Llama-family LLMs via Ollama)',
    'Argue the open-source-first case for THIS app specifically: the user uploads their own face and voice — privacy is not a preference here, it is a product requirement',
    'Sketch the end-to-end pipeline on paper: which piece feeds which, and where the LLM sits in the middle as the director'
  ],
  concept: [
    {
      h: 'The product, precisely — because vague specs make unbuildable apps',
      p: [
        'DenDen Studio takes three inputs from a creator: a short <b>voice sample</b> (a few seconds of them talking), one or more <b>pictures</b> (a face, a drawn character, a mascot), and a <b>description</b> of what should happen ("she introduces the video excitedly, waves at 0:02, then points at the title"). It produces an <b>animated video</b> in which the picture speaks — lips synced to speech rendered in the cloned voice — and moves according to the description. Two more requirements make it a real product instead of a demo: a <b>live mode</b>, where whatever the creator speaks into the mic is spoken by the picture in near-real-time (optionally in a different voice), and an <b>editing loop</b>, where a wrong or awkward generated motion can be fixed either by describing the change in plain words or by directly click-dragging the offending part on a canvas.',
        'Read that spec again and notice what it is NOT: it is not "train a giant model that does all of this." No such single model exists, open or paid — and this is the first big lesson of LLM-app building. Products that look like one seamless capability are almost always <b>pipelines of narrow models</b>, each doing one well-studied thing, glued together by ordinary engineering and, increasingly, directed by an LLM. The app is the architecture, not the model.'
      ]
    },
    {
      h: 'Decomposition: five ordinary problems wearing a trench coat',
      p: [
        'Walk through the demo and name each piece of magic. The picture speaks with your voice? That is two solved problems chained: <b>voice cloning / text-to-speech</b> (a few seconds of reference audio conditions a TTS model to speak any text in that voice — XTTS, OpenVoice, Piper for the non-cloned case) feeding <b>talking-head lip sync</b> (a model that takes one still image plus an audio track and generates video frames whose mouth movements match the audio — the Wav2Lip / SadTalker / LivePortrait family). Live mode adds a third: <b>speech-to-text or direct voice conversion</b> (Whisper transcribes what you say; a voice-conversion model can alternatively transform your audio directly into the target voice, skipping text entirely).',
        'Animate-by-description adds the fourth: <b>text-guided motion</b> — either a video-diffusion model in the AnimateDiff / Stable-Video-Diffusion family, or, often better for editability, a model that outputs <b>motion parameters</b> (head pose, expression coefficients, gesture keyframes) that a renderer applies to the image. And coordinating all of it is the fifth piece, the one that makes this an LLM app: a <b>local LLM as the director</b>, reading the creator\'s free-form description and emitting a structured plan — which models to call, with which parameters, in which order — via the tool-calling techniques you will learn in Part 1.'
      ]
    },
    {
      h: 'Why open source, and why especially for THIS app',
      p: [
        'Every stage above has a genuinely strong open-source answer you can run locally: Llama-family and Qwen-family LLMs via <b>Ollama</b> or Hugging Face <code>transformers</code>, <b>Whisper</b> for speech-to-text, <b>XTTS / Piper / Bark</b> for speech synthesis and cloning, the <b>Wav2Lip / SadTalker / LivePortrait</b> lineage for talking heads, and <b>AnimateDiff</b>-style motion models. The generic arguments for open source apply — no per-request bill while you iterate, no rate limits, no API breaking under you, full control over versions — but this app has a sharper argument.',
        'The inputs are a person\'s <b>face and voice</b>. Sending those to a third-party API means shipping your users\' biometric identity to someone else\'s servers, with all the consent, retention, and jurisdiction questions that follow. Running the models locally (or on servers you control) makes the privacy story a one-sentence answer: the face and the voice never leave the machine. For a content-creator tool, that is not ideology — it is a feature competitors charging per API call cannot match. Part 6 returns to the consent and provenance obligations that still remain even with local models.'
      ]
    },
    {
      h: 'The pipeline map — and how this course walks it',
      p: [
        'On paper, the offline path is: description → <b>LLM director</b> → plan; text (from the plan or from Whisper) → <b>voice clone TTS</b> → audio; audio + picture → <b>talking head</b> → base video; plan\'s motion directives → <b>motion model</b> → gestures and expression layered on; everything → <b>ffmpeg</b> → the final file. The live path shortens it: mic → (voice conversion or Whisper→TTS) → streaming lip sync → screen, with every stage forced to run in small chunks under a latency budget — Part 3\'s realtime lesson is entirely about what "forced to run in chunks" does to each model choice.',
        'The course builds skills in the same order the pipeline runs: Part 1 makes you fluent with local LLMs (running them, constraining their output, letting them see images); Part 2 is the voice column; Part 3 makes pictures talk, including live; Part 4 builds the editing UX (keyframes, click-drag correction, natural-language edits); Part 5 turns loose scripts into one reliable pipeline with the LLM directing; Part 6 ships it behind a real backend and frontend, with the safety obligations treated as part of shipping; Part 7 teaches you to measure whether any of it is actually good, then assembles the capstone. Every lesson leaves you with a piece; the capstone is assembly, not new construction.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Usopp Wants a Visual Den Den Mushi — Franky Refuses to Buy One',
      text: 'The crew has seen the Marines\' visual Den Den Mushi: a transponder snail that transmits not just a caller\'s voice but a moving picture of them, projected for a whole plaza to watch. Usopp wants one desperately, and his first instinct is to buy one at the next island — until Franky stops him at the workbench. "Buying one means whoever sold it decides what it can do, listens to everything you send through it, and can take it back whenever they feel like it. We are shipwrights. We build it." Usopp protests that nobody on the crew knows how to build a magic snail that turns a voice into a talking picture. Franky grins and starts sketching: "There is no magic snail. Watch." He draws five ordinary boxes. One snail that only writes down what it hears — they already have one. One voice-mimic snail that can speak any written words in a sampled voice — the shady broker at the last port sells the mimic breed openly. One picture-puppet rig that moves a portrait\'s mouth in time with any sound played behind it — carnival tinkerers build those. One rigging of strings that moves the portrait\'s arms the way a written stage direction says. And in the middle, a clever little navigator snail whose only job is reading the stage direction and telling the other four what to do, in what order. "Five dumb parts," Franky says, "one smart plan. Every part is buyable, buildable, and OURS. The thing that looks like magic is just the wiring."'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'The Guys Assemble a "One-Man Show Machine" From Parts Sheldon Insisted They Rent',
      text: 'Howard announces he can build a rig that lets a cardboard cutout of Sheldon deliver Sheldon\'s lecture while the real Sheldon stays home. Sheldon insists they simply rent professional equipment from the university\'s media lab; Howard refuses on principle: "The media lab keeps every recording that passes through their gear, Sheldon. Your face. Your voice. On THEIR server. Forever." That lands — Sheldon has strong opinions about who is allowed to retain his likeness. So Howard whiteboards the decomposition like a mission plan. A dictation recorder that turns anything Sheldon says into text: already owned. A speech synthesizer that can be tuned, from a short sample, to sound uncannily like Sheldon: Raj has one from a linguistics collaboration. A projector rig that makes the cutout\'s mouth flap in sync with whatever audio plays: Howard builds servo rigs like that for fun. A set of stage directions — "gesture condescendingly at minute two" — executed by two servos and some fishing line. And Leonard in the middle with the run sheet, reading Sheldon\'s written instructions and cueing each machine at the right moment. Nothing on the table is exotic; the whole trick is Leonard\'s run sheet. When it works, Penny asks what the machine is called. Howard: "It is not a machine. It is five machines and a stage manager."'
    },
    why: 'Both stories make the same two moves this lesson makes. First, decomposition: the impossible-sounding product ("a picture that talks") falls apart into five unremarkable components — capture speech, synthesize a voice, sync a mouth, move the body as directed, and a coordinator in the middle reading the plan. That coordinator — Franky\'s navigator snail, Leonard with the run sheet — is exactly the LLM-as-director role in DenDen Studio. Second, the ownership argument: Franky refuses the bought snail and Howard refuses the media lab for the same reason the course refuses paid model APIs — when the payload is someone\'s face and voice, keeping the machinery yours is a product feature, not a preference.'
  },
  tech: [
    {
      q: 'Why decompose into five narrow models instead of fine-tuning one big multimodal model to do the whole job end to end?',
      a: 'Three engineering reasons and one practical one. Engineering: (1) each narrow stage is independently swappable — when a better open lip-sync model ships, you replace one box, not the product; (2) each stage is independently debuggable and testable — if the mouth is out of sync you know which component owns the bug, whereas an end-to-end model gives you one inseparable failure; (3) the editing loop REQUIRES intermediate representations — click-drag correction needs motion parameters to exist as data you can modify, and an end-to-end pixels-out model has no such handle to grab. Practical: no open (or closed) model of that scope exists, and training one is a research-lab project, not an app project. The pipeline is not a compromise while waiting for the real thing; for an editable product it is the better architecture outright.'
    },
    {
      q: 'For live mode, the pipeline can either go mic → Whisper (text) → cloned TTS → lip sync, or mic → voice conversion (audio to audio) → lip sync. What is the real tradeoff?',
      a: 'The Whisper→TTS path gives you the text as a byproduct (useful for captions, moderation, and letting the LLM react to content) but pays two model inferences and loses the speaker\'s original prosody — the timing, emphasis, and melody of the performance get re-invented by the TTS model rather than preserved. Direct voice conversion transforms the audio waveform toward the target voice while keeping the original prosody and roughly the original timing, which usually feels far more "live" and is one hop instead of two — but you get no transcript for free and less opportunity to intervene on content. Real products often run voice conversion for the audio path and Whisper in parallel, off the critical path, purely to have the text. The deeper lesson: latency budgets are architectural forces — Part 3 makes this concrete.'
    },
    {
      q: 'What precisely does the LLM contribute here that ordinary glue code could not? The pipeline order looks fixed.',
      a: 'The happy-path order is fixed, and for a single canned demo you could hard-code it. The LLM earns its place at the boundary between the creator\'s free-form intent and the pipeline\'s structured parameters. "She introduces the video excitedly, waves at 0:02, then points at the title" has to become: emotion tags for the TTS stage, a gesture keyframe at t=2.0s referencing a "wave" motion, a second keyframe pointing at a screen coordinate, and possibly a decision that no motion model is needed beyond the parametric gesture layer. That mapping — unbounded natural language to a bounded, validated, structured plan — is exactly what LLMs are uniquely good at and what regex-and-templates glue is hopeless at. Same story for edits: "make the smile bigger at 0:03" must resolve to which keyframe, which parameter, what delta. Part 1\'s structured-output lesson teaches the mechanism (JSON-schema-constrained generation and tool calling), and Part 5\'s llm-as-director lesson gives the LLM the whole plan.'
    }
  ],
  code: {
    title: 'The product spec as data: DenDen Studio\'s request and plan shapes',
    intro: 'No models yet — just the shapes everything else in the course will fill in. Writing the spec as data structures is the first real act of building: every later Part implements one field of this plan.',
    code: `from dataclasses import dataclass, field

# ---- What the creator gives us -------------------------------------
@dataclass
class GenerationRequest:
    voice_sample_path: str | None   # a few seconds of reference audio
    image_path: str                 # the picture that will do the talking
    description: str                # free-form: what should happen
    script_text: str | None = None  # what gets said (None = live mic mode)
    target_voice: str = 'cloned'    # 'cloned' | a preset voice name

# ---- What the LLM director must produce ----------------------------
# One entry per pipeline stage, in execution order. The LLM does NOT
# run anything — it emits this plan; our code validates and executes it.
@dataclass
class PipelineStep:
    stage: str                      # 'stt' | 'tts' | 'lipsync' | 'motion' | 'mux'
    model: str                      # e.g. 'whisper-small', 'xtts-v2', 'sadtalker'
    params: dict = field(default_factory=dict)

@dataclass
class GenerationPlan:
    steps: list[PipelineStep]
    # Motion directives the editor can later modify — THIS is why the
    # pipeline beats an end-to-end video model: edits need data to edit.
    gesture_keyframes: list[dict] = field(default_factory=list)
    # e.g. {'t': 2.0, 'gesture': 'wave', 'hand': 'right'}

# The five model-shaped subproblems, and where the course covers each:
STAGES = {
    'stt':     'speech to text (Whisper)               — Part 2',
    'tts':     'voice cloning + synthesis (XTTS/Piper) — Part 2',
    'lipsync': 'talking head (Wav2Lip/SadTalker-style) — Part 3',
    'motion':  'text-guided gesture/motion             — Part 3 & 4',
    'mux':     'assemble audio+frames (ffmpeg)         — Part 5',
}`,
    notes: [
      'The plan being ordinary data (not code, not free text) is the load-bearing decision: it is what the LLM is constrained to emit in Part 1, what click-drag editing mutates in Part 4, and what the job queue executes in Part 5.',
      'Every model name in STAGES is open-source and runs locally — nothing in this course calls a paid API.'
    ]
  },
  lab: {
    title: 'Plan the pipeline: from a request to an ordered list of stages',
    prompt: 'Write <code>plan_stages(request)</code>: given a dict with keys <code>script_text</code> (a string, or <code>None</code> for live mic mode), <code>voice_sample_path</code> (a string, or <code>None</code>), and <code>animate</code> (bool — did the description ask for body motion beyond lip sync), return the ordered list of stage names. Rules: live mode (no script) starts with <code>"stt"</code>; every request includes <code>"tts"</code> then <code>"lipsync"</code>; include <code>"motion"</code> only if <code>animate</code> is true; always end with <code>"mux"</code>. A voice sample means the TTS stage clones it, but the STAGE LIST is the same either way — planning what runs is separate from parameterizing it.',
    starter: `def plan_stages(request):
    # request: {'script_text': str|None, 'voice_sample_path': str|None,
    #           'animate': bool}
    stages = []
    # 1. live mic mode (script_text is None) needs speech-to-text first
    # 2. everyone needs tts, then lipsync
    # 3. body motion only if request['animate']
    # 4. always finish with mux
    return stages`,
    checks: [
      { re: 'def\\s+plan_stages\\s*\\(', flags: '', must: true, hint: 'Define the function exactly as plan_stages(request).', pass: 'plan_stages defined ✓' },
      { re: "script_text", flags: '', must: true, hint: 'Live mode is detected by script_text being None.', pass: 'checks script_text ✓' },
      { re: "'stt'|\"stt\"", flags: '', must: true, hint: 'Live mode must add the stt stage.', pass: 'stt stage present ✓' },
      { re: "'motion'|\"motion\"", flags: '', must: true, hint: 'The motion stage should be added only when animate is true.', pass: 'motion stage present ✓' },
      { re: "'mux'|\"mux\"", flags: '', must: true, hint: 'Every plan ends with mux.', pass: 'mux stage present ✓' }
    ],
    tests: `r1 = plan_stages({'script_text': 'hello', 'voice_sample_path': 'v.wav', 'animate': False})
assert r1 == ['tts', 'lipsync', 'mux'], f"scripted, no motion: got {r1}"
r2 = plan_stages({'script_text': None, 'voice_sample_path': 'v.wav', 'animate': False})
assert r2 == ['stt', 'tts', 'lipsync', 'mux'], f"live mode must start with stt: got {r2}"
r3 = plan_stages({'script_text': 'hi', 'voice_sample_path': None, 'animate': True})
assert r3 == ['tts', 'lipsync', 'motion', 'mux'], f"animate adds motion before mux: got {r3}"
r4 = plan_stages({'script_text': None, 'voice_sample_path': None, 'animate': True})
assert r4 == ['stt', 'tts', 'lipsync', 'motion', 'mux'], f"live + animate: got {r4}"
print('all pipeline plans correct')`,
    solution: `def plan_stages(request):
    stages = []
    if request['script_text'] is None:
        stages.append('stt')          # live mic mode: transcribe first
    stages.append('tts')              # cloned or preset voice — same stage
    stages.append('lipsync')
    if request['animate']:
        stages.append('motion')
    stages.append('mux')
    return stages`,
    notes: [
      'Notice the voice sample changed nothing here: WHICH stages run and HOW a stage is parameterized are different decisions. The LLM director in Part 5 makes both, but the plan data keeps them separate — that separation is what makes plans checkable before anything expensive runs.',
      'This tiny function is the skeleton the whole course fleshes out: by Part 5 the string "tts" becomes a real local XTTS invocation with a validated parameter set.'
    ]
  },
  quiz: [
    {
      q: 'DenDen Studio\'s "a picture that speaks in your voice" capability is, architecturally:',
      options: ['One end-to-end multimodal model trained on faces and voices', 'A pipeline: voice-cloning TTS produces audio, then a talking-head model syncs the picture\'s lips to that audio', 'A video-editing filter applied to the still image', 'Impossible without paid APIs'],
      correct: 1,
      explain: 'It is two chained, individually well-studied open-source problems: clone-and-synthesize the voice (XTTS-style), then lip-sync the image to the audio (Wav2Lip/SadTalker-style).'
    },
    {
      q: 'Why is the pipeline-of-narrow-models design actually REQUIRED (not just convenient) for the click-drag editing feature?',
      options: ['It is faster to run', 'Click-drag editing needs intermediate motion data to exist and be modifiable — an end-to-end pixels-out model has no such handle', 'Users prefer pipelines', 'Diffusion models cannot make videos'],
      correct: 1,
      explain: 'Direct-manipulation editing mutates motion parameters (keyframes, pose coefficients). If the system only ever produced finished pixels, there would be nothing to grab and drag.'
    },
    {
      q: 'What is the LLM\'s actual job in DenDen Studio?',
      options: ['Generating the video frames', 'Synthesizing the voice audio', 'Translating free-form creator intent into a structured, validated pipeline plan (and structured edits later)', 'Compressing the final file'],
      correct: 2,
      explain: 'Every media model in the pipeline is a narrow specialist. The LLM owns the boundary between unbounded natural language and the bounded, structured plan those specialists need.'
    },
    {
      q: 'The strongest open-source-specific argument for THIS app (beyond cost and control) is:',
      options: ['Open models are always higher quality', 'The inputs are users\' faces and voices — local models mean biometric identity never leaves the machine', 'Paid APIs are too slow for video', 'Hugging Face requires it'],
      correct: 1,
      explain: 'For a product whose raw material is biometric identity, "your face and voice never leave your machine" is a product feature paid-API architectures structurally cannot offer.'
    },
    {
      q: 'In live mode, direct voice conversion (audio→audio) beats the Whisper→TTS path on:',
      options: ['Getting a text transcript for free', 'Preserving the speaker\'s original prosody and cutting one model inference from the latency path', 'Content moderation opportunities', 'Working without a voice sample'],
      correct: 1,
      explain: 'Voice conversion keeps the performance — timing, emphasis, melody — and is one hop instead of two. The cost is no free transcript, which products often recover by running Whisper in parallel off the critical path.'
    }
  ],
  pitfalls: [
    'Treating the demo as one model problem and searching for "the talking avatar model" — you will find impressive research demos and no product. The decomposition into narrow stages IS the design; skipping it means rebuilding from scratch the first time any one capability needs upgrading.',
    'Letting the LLM execute the pipeline instead of PLAN it. The LLM emits a structured plan; your code validates it and runs the stages. An LLM improvising shell commands over your GPU queue is a debugging nightmare and a security hole — Part 5 builds the safe version.',
    'Deferring the privacy/consent question to "later, once it works." The voice-sample upload is the very first feature you build, and it is biometric data from day one — Part 6\'s consent and provenance lesson applies to your first prototype, not just the shipped product.'
  ],
  interview: [
    {
      q: 'Walk me through how you would architect an app where a user uploads a photo and a voice sample, and the photo delivers any script in their voice.',
      a: 'It is a pipeline of narrow models, not one model. Offline path: a voice-cloning TTS model (XTTS-class) conditions on the few-second voice sample and synthesizes the script as audio; a talking-head model (Wav2Lip/SadTalker/LivePortrait-class) takes the still image plus that audio and generates lip-synced video frames; ffmpeg muxes frames and audio into the deliverable. If the product includes "animate as described," an LLM translates the free-form description into structured motion directives — gesture keyframes, expression parameters — applied by the motion/rendering stage, and more generally the LLM owns converting user intent into a validated plan over these stages. Each stage is independently swappable, testable, and — critically for an editing product — exposes intermediate data (audio, motion parameters) that editing features can mutate. I would run open models locally or on controlled servers because the payload is biometric.'
    },
    {
      q: 'Your PM asks: "Why are we wiring five models together instead of waiting for one model that does it all?" Defend the pipeline.',
      a: 'First, product control: editing features need intermediate representations. Click-drag correction mutates motion keyframes; a "change the voice" option re-runs one stage; neither is possible if the system\'s only artifact is finished pixels from a black box. Second, engineering velocity: stages are independently upgradeable — when a better open lip-sync model ships, we swap one component and A/B it, rather than re-validating an entire monolith. Third, debuggability: audio drift, sync error, and gesture mistakes each have an owning component. Fourth, feasibility: no end-to-end model of this scope exists to wait for, and training one is a research program. The pipeline is not the interim plan; for an editable creator tool it is the better end-state architecture.'
    },
    {
      q: 'Where exactly does the LLM add value in a media pipeline whose stage order is basically fixed, and where would using it be a mistake?',
      a: 'Value: at every boundary where unbounded natural language must become bounded structure. Turning "she introduces the video excitedly and waves at 0:02" into TTS emotion parameters plus a validated gesture keyframe list; turning "make the smile bigger at 0:03" into a delta on a specific keyframe; deciding which optional stages a request actually needs. That translation task has no regex-and-templates solution, and it is exactly what constrained generation and tool calling are for. Mistake: using the LLM as the executor — having it emit shell commands, file paths, or raw API calls that run unchecked. The robust design has the LLM emit a plan in a schema, code validate it (stage names from an allowlist, timestamps within clip bounds, parameters typed), and a deterministic executor run it. The LLM is the translator and planner, never the hands.'
    },
    {
      q: 'What changes about your architecture when the requirement "generate a video" becomes "the avatar mirrors my speech live"?',
      a: 'Everything becomes a streaming problem under a latency budget. Batch stages that were free to take seconds must now process small chunks incrementally: capture audio in short frames, choose between direct voice conversion (one hop, preserves prosody — usually the right call live) versus Whisper-plus-TTS (two hops, but yields text), and use a lip-sync approach fast enough for frame-rate generation, which may mean a lighter model than the offline path uses — accepting a quality/latency trade the offline pipeline never faces. You also need jitter buffering, chunk-boundary artifacts handling in both audio and video, and a latency budget allocated per stage so regressions are attributable. Same conceptual pipeline, different physics; it is why the realtime path is designed as its own mode rather than "the normal pipeline, faster."'
    }
  ]
};
