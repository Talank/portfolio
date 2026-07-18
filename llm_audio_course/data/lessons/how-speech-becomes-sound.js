window.LESSONS = window.LESSONS || {};
window.LESSONS['how-speech-becomes-sound'] = {
  id: 'how-speech-becomes-sound',
  title: 'How Text Becomes a Voice: Acoustic Model → Mel → Vocoder',
  category: 'Part 0 — Why Local Voice',
  timeMin: 35,
  summary: 'Before you can pick an engine or debug a bad render, you need the one mental model that explains almost every quality knob and failure in neural TTS: it is a two-stage pipeline. An acoustic model reads the text (usually as phonemes) and plans the sound as a mel spectrogram — a time-frequency image of timing, pitch, stress, and pauses. A vocoder then renders that plan into an actual waveform. Learn the split and "it sounds off" stops being a mystery and becomes a decision tree: performance bugs live in stage one, texture bugs in stage two. This same split is why local voice cloning is even possible, and why you can mix-and-match some parts but not others.',
  goals: [
    'Describe the two stages — text→mel (acoustic model) and mel→waveform (vocoder) — and what each is responsible for',
    'Use the split as a debugging decision tree: localize a bad render to the acoustic stage vs the vocoder stage before touching anything',
    'Explain what a mel spectrogram is and why it is the lingua franca every speech model in this course speaks',
    'Explain why grapheme-to-phoneme (G2P) front-ends exist and what breaks without them',
    'Predict which engine parts can be swapped (and which cannot) from the architecture alone'
  ],
  concept: [
    {
      h: 'Two stages: plan the sound, then render it',
      p: [
        'Modern neural TTS splits the job the way a musician does: first decide WHAT the sound should be, then make air actually move. Stage one, the <b>acoustic model</b>, reads the text — usually converted to <b>phonemes</b> (sound units) first — and emits a <b>mel spectrogram</b>: a time-frequency picture of the intended speech, roughly 80 frequency bands per ~12 ms frame, describing which frequencies carry energy moment to moment. Everything you would call the <i>performance</i> lives here: timing, pitch contour, stress, pauses, how long each vowel is held. Stage two, the <b>vocoder</b>, converts that spectrogram into a waveform — tens of thousands of audio samples per second. It contributes fidelity (crispness, naturalness of the signal), not interpretation.',
        'The split matters practically because problems localize by stage. Wrong pacing, flat emphasis, weird pauses, a mispronounced word — that is <b>acoustic-model territory</b>, often fixable with better input text or phoneme hints. Metallic buzz, hiss, a robotic timbre despite correct timing — that is <b>vocoder territory</b>. When a render is bad, your first move is not to turn a random knob; it is to ask which of the two stages failed, because that halves the search space instantly and points at completely different fixes.'
      ]
    },
    {
      h: 'The mel spectrogram: speech\'s common language',
      p: [
        'A <b>mel spectrogram</b> is what you get by slicing the waveform into short overlapping windows, measuring the frequency content of each, and pooling those frequencies into ~80 perceptually-spaced bands (fine resolution where human hearing is sharp — the low-mids where vowels and pitch live — coarse where it is dull). Stack the frames and you have an image: time on one axis, perceived pitch on the other, brightness = energy. It is deliberately <b>lossy</b> — it throws away phase and fine detail — and that is the point: it keeps what the ear keeps and discards what the ear ignores.',
        'This one representation is the lingua franca of the entire stack you are about to build on. TTS acoustic models <i>emit</i> mels; vocoders <i>consume</i> them; speech-to-text encoders (Whisper) <i>read</i> them; voice-conversion models <i>transform</i> them. That is why the two-stage split is not a quirk of one engine but the shared shape of the field — and why understanding the mel is the single highest-leverage concept in this whole course. Learn to picture one (bright horizontal bands = vowel resonances, vertical striations = consonant bursts, the wobble of the lowest band = pitch contour) and a whole class of audio bugs becomes visible before it is even audible.'
      ]
    },
    {
      h: 'Phonemes: why the model reads sounds, not letters',
      p: [
        'English spelling is a catastrophe as a pronunciation code. "Though / tough / through" share letters and share no sounds; "read" changes pronunciation by tense; "lead" the metal and "lead" the verb are spelled identically; names and loanwords follow no rules at all. So most engines put a <b>grapheme-to-phoneme (G2P)</b> front end first: it converts text into sound units, and the acoustic model learns the much cleaner mapping phonemes→spectrogram instead of memorizing spelling chaos. That is why so much of the pipeline is really a text pipeline: normalization (next Part) and G2P both happen before a single tensor of audio exists.',
        'You can train a model straight on characters — with enough data it internalizes G2P implicitly — but its failures concentrate exactly where explicit G2P has an escape hatch: rare words, names, brand terms, jargon. The practical consequence is a checklist question when choosing an engine: <b>can I hand it phonemes for the words it gets wrong?</b> Engines like Piper accept phoneme input directly, so a pronunciation override ("it is KAY-oss, not chaos") is a clean feature; purely character-based engines can only be nudged with creative respelling. When the crew\'s log needs a place name pronounced right, that hook is the difference between a fix and a workaround.'
      ]
    },
    {
      h: 'What the split lets you swap — and what it does not',
      p: [
        'The clean contract between stages (mel is the interface) suggests you could mix any acoustic model with any vocoder. In practice you can — <i>only if their mel configurations match exactly</i>: same sample rate, same number of mel bands, same frame hop, same frequency range, same normalization. A vocoder is trained to invert one specific mel dialect; feed it a spectrogram computed with different settings and you get garbage or artifacts, even though both components are individually excellent. So "swap the vocoder for a better one" is real but conditional: it works within an engine family that shares the config, and fails across families that do not.',
        'The same architecture explains why <b>voice identity lives in the acoustic stage</b>. Who is speaking — timbre, accent, personal prosody — is expressed in how the acoustic model shapes the spectrogram; the vocoder is voice-agnostic infrastructure that just renders whatever mel it is given. This is the deep reason local voice cloning (Part 4) works the way it does: you condition the acoustic stage on a short sample of the target speaker, and it shapes future mels to sound like them, without touching the vocoder at all. Understanding this now means the cloning lesson later is "oh, of course," not magic.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Brook\'s Two Halves of Music',
      text: [
        'A port town hires the crew to produce its harbor-festival announcements, and Brook — being both a musician and, technically, a skeleton with a great deal of time on his hands — turns teacher. "Music, and speech, which is music pretending to be practical, happens in two stages," he says, holding up a sheet dense with his own notation. "First, the arrangement: every note\'s pitch and length, where the phrase breathes, where the emphasis falls. This page decides EVERYTHING about the performance. And yet —" he waves it, silent, "— it makes no sound at all." Then he sets a violin to his shoulder. "The instrument renders the page into air. A brilliant arrangement through a cheap instrument sounds thin. A dull arrangement through a master\'s violin is a beautifully polished bore."',
        'Usopp, who has been fiddling with the town\'s malfunctioning announcement horn, complains that the voice coming out is scratchy and metallic. Brook doesn\'t even pause. "Then your arrangement is fine and your instrument is failing — do not rewrite the melody to fix a broken string. When something sounds wrong, FIRST ask which half failed." Later, when the horn plays a phrase with the pauses in absurd places — mid-word, mid-breath — Brook nods the other way: "THAT is the arrangement. The instrument is faithfully rendering a bad plan. No amount of polishing the horn will move the pause; you must fix the page." Two failures, two completely different fixes, and the only skill that told them apart was knowing there were two halves in the first place.'
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon Diagrams the Karaoke Disaster',
      text: 'The gang\'s karaoke night goes badly and Sheldon, uninvited, provides analysis. "Your performances failed in two distinct and diagnosable ways, which you would know if you thought about singing as a pipeline." He points at Howard: "You had the timing, the pitch, the phrasing — a competent PLAN — but the machine\'s cheap speaker turned it into a metallic buzz. That is a rendering failure. Buying singing lessons would not have helped you; a better speaker would." He rounds on Raj: "You had a lovely voice — flawless RENDERING — applied to a plan in which you paused for breath in the middle of the word \'California\' three times. No speaker on Earth fixes that. You needed to fix the plan." Penny asks if there\'s a version of this where he just says "one of you was flat and one of you was off-beat." "There is," Sheldon says, "but it would not have taught you that the fix depends entirely on WHICH stage broke, which is the only useful thing I have said tonight."'
    },
    why: 'Brook\'s arrangement-versus-instrument and Sheldon\'s plan-versus-rendering are exactly the acoustic-model / vocoder split: the mel spectrogram is the page (timing, pitch, emphasis — the plan that makes no sound yet), and the vocoder is the instrument that turns the page into air. Both stories drill the one diagnostic move the lesson exists to teach — locate the failure by stage before fixing anything — with the two canonical failure signatures spelled out: weird pauses = the plan (acoustic model), metallic buzz = the rendering (vocoder). Usopp "rewriting the melody to fix a broken string" is the classic mistake the mental model prevents.'
  },
  tech: [
    {
      q: 'One render has perfect timing and emphasis but sounds slightly metallic and hissy; another is crystal-clear but pauses in weird places. Which stage for each, and what are the usual fixes?',
      a: 'Metallic/hissy with correct performance is vocoder territory — the plan was fine, the waveform rendering is lossy. Usual fixes: a better vocoder variant if the engine offers one; check for a sample-rate mismatch (synthesizing at 22.05 kHz then resampling sloppily to 44.1 injects artifacts); and confirm nothing double-compresses the output (re-encoding the WAV to a low-bitrate MP3 and back). Weird pauses with clean audio is acoustic-model territory — the plan itself was wrong. Fixes in order of cheapness: input text (a stray comma IS a pause instruction; markdown or emoji leaking into the script reads as noise), then chunking (a mid-clause split forces an unnatural boundary — fix the chunker, not the model), then engine settings or a better acoustic model. The meta-skill: the two-stage architecture turns "it sounds off" into a 5-minute localization instead of random knob-turning.'
    },
    {
      q: 'Why can I usually NOT take one engine\'s acoustic model and another engine\'s vocoder and bolt them together, even though "mel is the interface"?',
      a: 'Because "mel" is a family of representations, not one fixed format, and a vocoder is trained to invert one specific member of that family. The mel depends on a bundle of settings — sample rate, FFT window size, hop length, number of mel bands, the min/max frequency range, and the amplitude normalization (log scaling, clipping). Two engines can both "emit a mel" and produce numerically incompatible tensors: 80 bands at 22.05 kHz with an 80-frame hop is a different dialect from 100 bands at 24 kHz. Feed vocoder B a spectrogram in acoustic model A\'s dialect and it renders artifacts or noise, because it has never seen that distribution. So swapping is possible strictly within a family that shares the exact config (many engines do document theirs), and impossible across families that do not — which is why in practice you ship a matched acoustic+vocoder pair per engine rather than a mix-and-match zoo.'
    },
    {
      q: 'If the mel throws away phase and fine detail, where does the vocoder get that information to make a natural waveform?',
      a: 'It hallucinates it — plausibly and learnedly, not arbitrarily. Reconstructing a waveform from a mel is inverting a lossy transform, so the missing phase and fine structure have to be invented, and the whole reason neural vocoders beat classical ones (Griffin-Lim, which guesses phase iteratively and sounds phasey/robotic) is that they learned, from mountains of real speech, what plausible phase and micro-texture look like for a given spectral shape. A GAN vocoder (HiFi-GAN class) is trained adversarially: discriminators punish any output that does not look and sound like real speech at multiple timescales, so the generator learns to fill the gaps convincingly. Two consequences worth internalizing: vocoder artifacts are TEXTURE errors from imperfect hallucination (distinct from acoustic PLAN errors), and "it is only an 80-band image" does not mean audio is low-information — expanding ~80 numbers per frame to 240+ samples per frame is real generative work, not decompression.'
    }
  ],
  code: {
    title: 'Seeing the two stages in a local engine',
    intro: 'You do not build these models — you use them — but it helps to see the split surfaced in code. Coqui\'s API exposes acoustic model and vocoder as separate, separately-swappable components. (Runs on your machine; shown for shape.)',
    code: `# The two stages are literally two model files you load and can swap
# (within a matched family), because mel is the interface between them.

from TTS.utils.synthesizer import Synthesizer

synth = Synthesizer(
    tts_checkpoint="tts_model.pth",       # ACOUSTIC MODEL: text -> mel
    tts_config_path="tts_config.json",    #   its mel config lives here...
    vocoder_checkpoint="vocoder.pth",     # VOCODER: mel -> waveform
    vocoder_config="vocoder_config.json", #   ...and MUST match this one
)
wav = synth.tts("The plan becomes air.")   # runs stage 1 then stage 2

# Debugging move made concrete:
#   * pauses/pacing/mispronunciation wrong  -> suspect tts_* (acoustic)
#       fixes: input text, phonemes, chunk boundaries, a better acoustic model
#   * clean timing but metallic/hissy       -> suspect vocoder_* (rendering)
#       fixes: matched configs, sample rate, a better vocoder in the SAME family
#
# The two config files are the "matched mel dialect" contract. Mismatch them
# and you get artifacts even with two individually excellent models.`,
    notes: [
      'Coqui exposes the split explicitly (separate checkpoints); Piper hides it (one .onnx bundles both). Either way the mental model is the same — text→mel→waveform — and the debugging tree is identical.',
      'The two config files are the mel-dialect handshake. When someone reports "I swapped in a fancier vocoder and now it buzzes," the config mismatch is the first thing to check.'
    ]
  },
  lab: {
    title: 'Localize the failure: a two-stage debugging classifier',
    prompt: 'Turn the mental model into code. Write <code>diagnose(symptoms)</code> where <code>symptoms</code> is a set (or list) of strings. Return <code>"acoustic"</code> if the symptoms are performance/plan problems, <code>"vocoder"</code> if they are texture/rendering problems, and <code>"unclear"</code> if there is a mix of both or nothing recognized. Classify each known symptom: acoustic = <code>{"weird_pauses", "wrong_emphasis", "mispronunciation", "bad_pacing", "monotone"}</code>; vocoder = <code>{"metallic", "hiss", "buzzy", "muffled", "robotic_timbre"}</code>. Unknown symptom strings are ignored. If (after ignoring unknowns) the symptoms point to <b>only</b> acoustic → "acoustic"; <b>only</b> vocoder → "vocoder"; both, or none recognized → "unclear". Also write <code>first_fix(stage)</code> returning the cheapest first fix: acoustic → <code>"check input text and chunk boundaries"</code>, vocoder → <code>"check sample rate and mel-config match"</code>, anything else → <code>"reproduce and isolate one symptom"</code>.',
    starter: `ACOUSTIC = {"weird_pauses", "wrong_emphasis", "mispronunciation", "bad_pacing", "monotone"}
VOCODER  = {"metallic", "hiss", "buzzy", "muffled", "robotic_timbre"}

def diagnose(symptoms):
    # keep only recognized symptoms; decide acoustic / vocoder / unclear
    pass

def first_fix(stage):
    pass`,
    checks: [
      { re: 'def\\s+diagnose\\s*\\(', flags: '', must: true, hint: 'Define diagnose(symptoms).', pass: 'diagnose defined ✓' },
      { re: 'def\\s+first_fix\\s*\\(', flags: '', must: true, hint: 'Define first_fix(stage).', pass: 'first_fix defined ✓' },
      { re: '[&]|intersection|\\bin\\b', flags: '', must: true, hint: 'Compare the input against the ACOUSTIC and VOCODER sets.', pass: 'set membership used ✓' }
    ],
    tests: `assert diagnose({"weird_pauses", "mispronunciation"}) == "acoustic"
assert diagnose({"metallic", "hiss"}) == "vocoder"
assert diagnose({"weird_pauses", "metallic"}) == "unclear", "mixed stages -> unclear"
assert diagnose({"potato"}) == "unclear", "unrecognized -> unclear"
assert diagnose({"weird_pauses", "potato"}) == "acoustic", "ignore unknowns"
assert diagnose(set()) == "unclear"
assert first_fix("acoustic") == "check input text and chunk boundaries"
assert first_fix("vocoder") == "check sample rate and mel-config match"
assert first_fix("unclear") == "reproduce and isolate one symptom"
print("two-stage diagnosis correct")`,
    solution: `ACOUSTIC = {"weird_pauses", "wrong_emphasis", "mispronunciation", "bad_pacing", "monotone"}
VOCODER  = {"metallic", "hiss", "buzzy", "muffled", "robotic_timbre"}

def diagnose(symptoms):
    s = set(symptoms)
    a = bool(s & ACOUSTIC)
    v = bool(s & VOCODER)
    if a and not v:
        return "acoustic"
    if v and not a:
        return "vocoder"
    return "unclear"

def first_fix(stage):
    if stage == "acoustic":
        return "check input text and chunk boundaries"
    if stage == "vocoder":
        return "check sample rate and mel-config match"
    return "reproduce and isolate one symptom"`,
    notes: [
      'The whole value of the two-stage model is compressed into that set intersection: "which stage do these symptoms belong to?" is the first question a professional asks, and it halves the search before any knob is touched.',
      '"Mixed → unclear" is deliberately honest: when both stages show symptoms you have not isolated the bug yet — reproduce with one symptom at a time. Real debugging rewards separating variables over guessing.'
    ]
  },
  deepDive: {
    timeMin: 12,
    intro: 'One level down: how neural vocoders got fast enough to run locally in realtime, and why that specific breakthrough is what makes Piper on a CPU possible at all.',
    sections: [
      {
        h: 'From one-sample-at-a-time to whole-clip-at-once',
        p: 'The first neural vocoders that sounded truly human (WaveNet, 2016) were autoregressive: they generated the waveform one sample at a time, each sample conditioned on all the previous ones. Quality was stunning and speed was hopeless — 24,000 sequential neural-network evaluations per second of audio, far slower than realtime even on strong hardware, which made local, interactive use a non-starter. The fix was architectural: parallel vocoders (HiFi-GAN and its family) that take the entire mel spectrogram and upsample it to a waveform in a single forward pass, no sequential dependency between samples. Trained adversarially — multiple discriminators judging the output at multiple timescales so nothing sounds fake up close or at a distance — they reach quality competitive with the autoregressive models while running many times faster than realtime, even on a CPU. That specific jump is the enabling technology for this entire course: it is why Piper can voice a line on a laptop with no GPU faster than you can say it, and therefore why a private, local, interactive voice pipeline is practical rather than a research demo.'
      },
      {
        h: 'Why the mel is lossy on purpose, and what that buys you',
        p: 'It is tempting to see the mel\'s discarded phase and pooled frequencies as a defect to be minimized, but the lossiness is a feature with three payoffs. First, <b>learnability</b>: the acoustic model only has to predict ~80 perceptually-meaningful numbers per frame instead of thousands of raw samples, a target small and smooth enough to model well with limited data — predicting raw waveforms directly from text is far harder. Second, <b>modularity</b>: because the mel keeps only what the ear keeps, one vocoder trained to render mels serves many acoustic models (within its config family), and the same mel feeds recognition and conversion models too — the lossy bottleneck is exactly what makes it a reusable interface. Third, <b>robustness</b>: throwing away phase (which is perceptually fragile and wildly variable) means the acoustic model is not forced to nail an almost-inaudible quantity, so its errors land in places the ear forgives. The engineering lesson generalizes past audio: a well-chosen lossy intermediate — one that keeps exactly what matters to the consumer and drops what does not — is often what makes a hard end-to-end problem into two tractable, swappable halves.'
      }
    ]
  },
  quiz: [
    {
      q: 'In two-stage neural TTS, the mel spectrogram is:',
      options: ['The final audio the speaker plays', 'The acoustic model\'s PLAN of the sound — timing, pitch, emphasis as a time-frequency image — which the vocoder renders to a waveform', 'A compressed audio file format', 'The list of phonemes'],
      correct: 1,
      explain: 'Stage one plans the performance (the mel), stage two renders it (the waveform). The split is also the debugging tree: plan bugs vs rendering bugs.'
    },
    {
      q: 'A render has clean, clear audio but pauses in the middle of words. Which stage, and the cheapest first fix?',
      options: ['Vocoder — buy a better speaker', 'Acoustic model — check the input text and chunk boundaries (a stray comma or mid-clause split is a pause instruction)', 'Neither — re-download the model', 'Both equally — retrain everything'],
      correct: 1,
      explain: 'Weird pauses with clean audio = the plan was wrong = acoustic stage. Input text and chunking are the cheapest fixes before touching the model.'
    },
    {
      q: 'Why do most engines convert text to phonemes before the acoustic model?',
      options: ['To compress the text', 'Because English spelling is a terrible pronunciation code; phonemes give the model a clean sound→mel mapping and an override hook for rare words/names', 'Because vocoders require phonemes', 'To make it run on CPU'],
      correct: 1,
      explain: 'G2P front-ends turn spelling chaos into clean sound units, concentrating remaining errors on rare words — which phoneme input can then override ("KAY-oss").'
    },
    {
      q: 'You bolt engine A\'s acoustic model to engine B\'s fancier vocoder and get artifacts. The most likely cause:',
      options: ['The vocoder is broken', 'Their mel configs (sample rate, band count, hop, range) don\'t match — the vocoder was trained to invert a different mel dialect', 'You need more RAM', 'Phonemes are missing'],
      correct: 1,
      explain: 'Mel is a family of formats. A vocoder inverts one specific config; feed it a differently-computed mel and it renders garbage, even though both models are individually good.'
    },
    {
      q: 'Voice identity (who is speaking) is primarily carried by:',
      options: ['The vocoder', 'The acoustic model — it shapes the mel to sound like a given speaker; the vocoder is voice-agnostic. This is why cloning conditions the acoustic stage', 'The audio file format', 'The sample rate'],
      correct: 1,
      explain: 'The vocoder just renders whatever mel it gets. Identity lives in how the acoustic model shapes that mel — which is exactly what voice cloning conditions on a speaker sample.'
    }
  ],
  pitfalls: [
    'Turning random knobs when a render sounds "off" instead of first asking WHICH stage failed. Weird pauses = acoustic (fix text/chunking); metallic buzz = vocoder (fix config/sample rate). The stage question halves the search every time.',
    'Assuming any acoustic model works with any vocoder because "mel is the interface." Mel is a family of formats; the vocoder only inverts the exact config it was trained on. Swap within a matched family, not across.',
    'Trying to fix a mispronounced name by re-recording or changing the vocoder. Pronunciation is an acoustic-stage/G2P problem — the fix is phoneme input or a pronunciation override, if the engine supports it.'
  ],
  interview: [
    {
      q: 'Walk me through modern neural TTS architecture and how it guides debugging.',
      a: 'Two stages with a clean contract. A front end normalizes text and usually converts it to phonemes. The acoustic model maps that to a mel spectrogram — a time-frequency plan carrying all the performance decisions: duration, pitch contour, stress, pauses. A neural vocoder, HiFi-GAN class in most open engines, renders the mel to a waveform, hallucinating the phase and fine texture the lossy mel discarded, and modern parallel vocoders do this faster than realtime even on CPU. The contract makes debugging a decision tree: mispronunciations and wrong pacing trace to the front end or acoustic model, where the cheap fixes are normalization, phoneme overrides, and chunk boundaries; metallic or hissy texture with correct performance traces to the vocoder or to a sample-rate/re-encoding problem downstream. The split also explains capability boundaries — voice identity lives in how the acoustic stage shapes the mel, which is why cloning conditions that stage on a speaker embedding while the vocoder stays voice-agnostic — and why you can only swap components within a matched mel configuration.'
    },
    {
      q: 'What is a mel spectrogram, why is it lossy, and why is that the right design?',
      a: 'It is a time-frequency image of speech: slice the waveform into short overlapping windows, take each window\'s frequency content, and pool it into ~80 bands spaced on the mel scale — perceptually even, fine where hearing is sharp, coarse where it is dull. Brightness is energy; the axes are time and perceived pitch. It is lossy by construction — it discards phase and pools fine detail — and that is deliberate for three reasons. It keeps only what the ear keeps, so the acoustic model predicts ~80 meaningful numbers per frame instead of thousands of raw samples, which is far more learnable. It is a reusable interface precisely because it is a compact, standardized bottleneck: the same mel feeds vocoders, recognizers, and conversion models. And discarding perceptually fragile phase means the model isn\'t penalized for missing a near-inaudible quantity, so its errors land where the ear forgives. The general principle is that a well-chosen lossy intermediate turns one hard end-to-end problem into two tractable, swappable halves.'
    },
    {
      q: 'Why were older local TTS systems robotic, and what changed — without the cloud being involved?',
      a: 'Robotic was a synthesis-technique problem, not a location problem. Older systems were concatenative (stitching recorded speech fragments, with audible seams and flat prosody) or formant/parametric (shaping vowels with filters, giving that buzzy artificial timbre). The change was neural generation: acoustic models like Tacotron and VITS that predict natural mel spectrograms — real prosody, natural pitch and timing — and neural vocoders like HiFi-GAN that render them with human-like texture and, crucially, run faster than realtime on modest hardware. None of that requires a server; the models are open files you download and run locally. So the entire "local means robotic" association is obsolete: local now means the same neural quality class as the cloud voices, because it is the same class of technology, just executed on your machine instead of someone else\'s.'
    }
  ]
};
