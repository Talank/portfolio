window.LESSONS = window.LESSONS || {};
window.LESSONS['speech-to-text-and-voice-swap'] = {
  id: 'speech-to-text-and-voice-swap',
  title: 'Whisper & Voice Conversion: You Speak, the Cloned Voice Speaks',
  category: 'Part 2 — Voice: TTS, Cloning & Swapping',
  timeMin: 40,
  summary: 'The voice column\'s final piece: hearing. Whisper — the open speech-to-text model — turns the creator\'s speech into text WITH word-level timestamps, which downstream stages (captions, lip-sync, the LLM director) all feed on. Then the other direction of voice swapping: voice conversion transforms audio to audio directly, keeping the creator\'s performance — timing, emphasis, melody — while swapping whose voice carries it. Between them, DenDen Studio\'s "you speak, the avatar speaks as anyone" feature exists in two flavors with genuinely different tradeoffs, and this lesson makes you fluent in both.',
  goals: [
    'Run Whisper locally (faster-whisper), pick a model size deliberately, and get word-level timestamps — not just text',
    'Gate transcription with voice-activity detection, and explain why Whisper hallucinates fluent text on silence and music',
    'Explain voice conversion mechanically: content and identity disentangled, timbre swapped, prosody preserved',
    'Choose between the STT→TTS path and direct voice conversion for a given voice-swap feature, by what each preserves and discards',
    'Design the swap feature with the consent registry from last lesson enforced on BOTH paths'
  ],
  concept: [
    {
      h: 'Whisper: open STT that actually works, sized like everything else',
      p: [
        '<b>Whisper</b> is the open speech-to-text workhorse: MIT-ish licensed (genuinely open), multilingual, robust to accents and imperfect audio, and sized in the familiar ladder — tiny/base/small/medium/large — trading the same triangle as every model in this course: tiny transcribes faster than realtime on CPU with occasional word errors; large is excellent and wants a GPU. The implementation to reach for is <b>faster-whisper</b> (a CTranslate2 re-engineering of the same weights: several times faster, fraction of the memory), and the interface is one call: audio in, segments out.',
        'The output detail that matters most to DenDen Studio is not the text — it is the <b>timestamps</b>. Whisper (via faster-whisper\'s <code>word_timestamps=True</code>) reports when each WORD starts and ends. Captions need them (the lab builds that), the lip-sync stage in Part 3 aligns mouth shapes against them, and the editing UX in Part 4 lets a creator click a word to seek the video. A transcript without timestamps is a summary; a transcript with them is a <b>timeline</b> — the difference between knowing what was said and knowing where everything lives.'
      ]
    },
    {
      h: 'The silence trap: gate the ears with VAD',
      p: [
        'Whisper has a famous failure mode: fed silence, music, or noise, it does not output nothing — it <b>hallucinates fluent text</b>. Long pauses become "Thanks for watching!" (a scar from its training data\'s subtitle corpora), background music becomes invented lyrics, hiss becomes plausible sentences. The cause is architectural: Whisper\'s decoder is a language model conditioned on audio, and when the audio evidence is weak, the language-model prior takes over and writes SOMETHING likely. It is the same "probabilistic component confidently filling gaps" behavior as every LLM failure in Part 1 — and the same discipline applies: do not ask the model a question whose answer you should have gated first.',
        'The gate is <b>voice-activity detection</b>: a tiny, fast, deterministic-ish classifier (Silero VAD is the open standard — a few MB, CPU, milliseconds) that labels which frames contain speech at all. Pipeline order: VAD finds speech spans → only those spans go to Whisper → gaps are recorded as pauses, not transcribed. faster-whisper ships this built in (<code>vad_filter=True</code>), but you should understand it as a pipeline stage because DenDen Studio uses the spans themselves: pause structure feeds the lip-sync stage (a closed, resting mouth during silence — obvious, and yet the number of talking-head demos with a mouth chewing through silence says otherwise), and in live mode VAD decides when an utterance has ENDED and processing should fire. Familiar shape, third appearance: cheap deterministic instrument in front of an expensive probabilistic model — detector before VLM, validator before executor, VAD before Whisper.'
      ]
    },
    {
      h: 'Voice conversion: change the singer, keep the song',
      p: [
        '<b>Voice conversion</b> (VC) transforms speech to speech directly: your recorded audio in, the same performance in a different voice out. Mechanically, VC models (the RVC family is the open ecosystem\'s workhorse) <b>disentangle</b> what the acoustic signal mixes together: content (the phoneme sequence — extracted by a pretrained speech encoder), pitch contour (tracked explicitly, then shifted to the target\'s range), and <b>timbre</b> (the target speaker\'s identity — swapped in from an embedding or a trained per-voice model). Re-synthesize with content and contour kept but timbre replaced, and you get YOUR timing, YOUR emphasis, YOUR hesitations — in another voice.',
        'Contrast the two swap paths precisely, because the product offers both. <b>STT→TTS</b> (Whisper transcribes you, the cloned voice re-synthesizes the text): discards your performance entirely — the TTS engine re-invents pacing and melody from punctuation — but yields a transcript for free, allows EDITING between the steps (fix a stumble in text before re-synthesis: the offline creator workflow), and only needs the text-side machinery you already built. <b>Direct VC</b>: preserves the performance — which is the entire point when the creator is ACTING a line (comedic timing, dramatic pauses, a sung phrase survive) — runs as one hop (the latency argument that matters in Part 3\'s live mode), but gives no transcript (run Whisper in parallel off the critical path if you need one) and no text-stage editing. Rule of thumb DenDen Studio ships with: <b>reading a script → STT→TTS; performing a take → VC.</b>'
      ]
    },
    {
      h: 'The swap feature, assembled — with the consent gate on every path',
      p: [
        'The feature creators see: record or upload speech, then a voice menu — "my voice" (their enrolled clone), preset voices (licensed or synthetic — a product decision from the TTS lesson\'s menu), and any OTHER enrolled voice they have consent-verified access to. Under the menu, the two paths from the previous section, chosen by the rule of thumb (with a "preserve my performance" toggle for creators who know what they want). Both paths converge on the same downstream: audio → lip-sync stage → video.',
        'And both paths route through last lesson\'s <b>voice registry</b> — this is the part to get right the first time. VC does not bypass consent because "it is just a filter": the OUTPUT is the target\'s voice saying words the target never said, which is exactly the harm the consent gate exists for. So the VC target, like the TTS voice, resolves strictly through <code>VOICES[voice_id]</code> — enrolled, consent-verified, audited. One more governance seam appears here: the creator\'s INPUT speech is also biometric data (it is a voice sample of them), so live-mode audio is processed and discarded by default, not silently retained — a Part 6 topic planted now, while the architecture is still cheap to shape.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Robin\'s Timestamped Minutes, the Silence She Once Invented, and the Karaoke Snail',
      text: 'Two inventions run the port\'s famous music hall. The first is Robin\'s, from her stint recording treaty negotiations: marginal minutes — every word written down WITH a tick mark against the water-clock, so a dispute over "who promised what" becomes "who promised what AND when, to the drip." Once, early on, she embarrassed herself: during a long, strategic silence between two captains, her pen kept moving — years of habit filling the page with the polite pleasantries such meetings USUALLY contain. The silence, it turned out, WAS the message, and her invented pleasantries nearly restarted a war. Her fix became procedure: before transcribing anything, mark WHERE anyone is actually speaking — she runs a strip of paper alongside the water-clock, shading the speaking spans — and only then transcribe inside the shaded parts. Unshaded time is recorded as exactly what it is: a pause, with its length. "The dangerous transcriber," she tells her apprentice, "is not the one who mishears. It is the one who cannot bear an empty page." The hall\'s second invention is the karaoke snail: a rare Den Den Mushi that re-voices a singer in the timbre of the retired diva who once ran the hall — consented, contracted, her voice enrolled with ceremony. A nervous fisherman sings his anniversary song into it: every hesitation, the wobble on the high note, the pause where he almost cries — all preserved, but carried by the diva\'s velvet timbre. Usopp asks why not simply write the lyrics down and have a singer re-record them properly. The hall\'s owner shakes her head: "Then it becomes the SINGER\'S song. The snail keeps HIS song. His timing, his breaks, his almost-crying. That pause is the whole gift. Write it down and the pause dies on the page."'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica Transcribes Smelly Cat — and the Music Video That Swapped the Wrong Thing',
      text: 'Phoebe decides Smelly Cat needs copyright protection, and Monica volunteers to transcribe a live performance — Monica-style, which means a stopwatch and a grid: every word logged with when it starts and ends ("otherwise how do the backup singers know where to come in?"). Her one disaster becomes group legend: during Phoebe\'s long guitar interlude, Monica\'s pen kept going — she wrote "la la la, smelly, smelly" across sixteen bars of PURE INSTRUMENTAL, because, as Chandler diagnosed, "Monica cannot leave a box unfilled." Phoebe was furious at the invented lyrics ("the interlude is where the cat\'s feelings LIVE"), and Monica\'s corrected system is the one she defends forever after: first pass with the stopwatch marking only WHERE Phoebe is singing versus playing; second pass transcribing only inside the singing spans; the interlude entered as what it is — a sixteen-bar pause, duration noted. The voice-swap half of the story is canon and still a sore subject: the Smelly Cat MUSIC VIDEO, where the producers kept Phoebe\'s on-camera performance — her face, her timing, her phrasing, every quirk of her delivery intact — and replaced the voice with a professional singer\'s. Two lessons, the gang agrees, and they are different ones. What the producers got RIGHT, technically: they swapped only the timbre and kept the performance — which is why the video still feels like Phoebe, in a way it would not have if they had handed the lyrics to the session singer to re-perform from the page. What they got WRONG, completely: Phoebe never agreed. The performance was hers, the voice was someone else\'s, and nobody asked either of them properly. "So the recipe was right," Ross summarizes, ducking Phoebe\'s glare, "and the permission was missing, which means everything was wrong."'
    },
    why: 'Robin\'s tick-marked minutes and Monica\'s stopwatch grid are Whisper with word timestamps: a transcript as a TIMELINE, which is what captions, lip-sync, and click-a-word editing consume. Both transcribers commit the model\'s signature sin — filling silence with plausible content (invented pleasantries, "la la la" across the interlude) — and both fixes are exactly VAD-gating: mark the speech spans first, transcribe only inside them, record gaps as pauses with durations (which the lip-sync stage needs as much as the words). The karaoke snail and the Smelly Cat video are voice conversion: performance preserved, timbre swapped — with both stories landing the STT→TTS contrast precisely (write it down and re-sing it, and the pause "dies on the page": the performance is what the text path discards). And the video\'s scandal is the consent architecture from last lesson enforced on the VC path too: the recipe being technically right while the permission is missing means everything is wrong — VC is not "just a filter," and the target voice resolves through the enrolled, consent-verified registry or not at all.'
  },
  tech: [
    {
      q: 'Why does Whisper invent fluent text on silence or music instead of outputting nothing, and what does the fix look like architecturally?',
      a: 'Whisper\'s decoder is a language model that generates the transcript token by token, conditioned on the audio encoder\'s reading of the input. When the audio contains strong speech evidence, that conditioning dominates and the output tracks what was said. When the audio is silence, music, or noise, the conditioning is weak — and the decoder\'s language-model prior fills the vacuum with text that is LIKELY given its training data, which included vast subtitled content (hence the notorious "Thanks for watching!" on trailing silence: that is literally what subtitle tracks say there). It cannot abstain by temperament, only by instruction. The architectural fix is to stop asking it about non-speech: a voice-activity detector (Silero-class — tiny, fast, runs on CPU in milliseconds) classifies frames as speech/non-speech first; only speech spans are transcribed; gaps enter the pipeline as pauses with durations. faster-whisper bundles this (vad_filter=True), but treating VAD as a first-class stage pays twice more: the spans drive lip-sync rest states, and in live mode the speech→silence transition is the utterance-end trigger. Pattern echo, deliberately: cheap deterministic gate in front of an expensive probabilistic model — third time in the course, and not the last.'
    },
    {
      q: 'The STT→TTS path and direct voice conversion both produce "the creator\'s speech in another voice." Enumerate precisely what each preserves, discards, and costs.',
      a: 'STT→TTS preserves the WORDS and discards the performance: Whisper reduces audio to text (punctuation is the only prosody that survives), then TTS re-invents pacing, melody, and emphasis from that text in the target voice. What you gain: a transcript for free (captions, moderation, LLM-director input), an EDITABLE intermediate (fix a stumble, rewrite a phrase — impossible in pure audio), and reuse of machinery you already run. Costs: two model inferences in series, and the loss is not subtle — comedic timing, dramatic pauses, sung phrases, sarcasm carried by delivery: all flattened to whatever the TTS engine guesses from a comma. Direct VC preserves the performance — content, timing, pitch CONTOUR (shifted to the target\'s range) — and swaps only timbre: the creator\'s acting survives, one inference, lower latency (the live-mode argument). Costs: no transcript (run Whisper in parallel, off the critical path, if needed), no text-stage editing (a stumble must be re-performed), per-target-voice model quality varies more than TTS cloning, and pitch tracking can wobble on expressive extremes. The product mapping falls straight out: scripted narration → STT→TTS; performed takes and live mode → VC; and the toggle is worth exposing because creators can hear the difference immediately.'
    },
    {
      q: 'Word-level timestamps from Whisper are approximations, not ground truth. Where does the imprecision come from, and which consumers in the pipeline care?',
      a: 'Whisper natively produces SEGMENT-level timing; word timestamps are derived by aligning the decoder\'s tokens against the audio (cross-attention-based alignment in faster-whisper) — an inference on top of an inference. Typical error is tens of milliseconds, worse at speech-rate extremes, across disfluencies ("um, well—"), and at span edges where VAD trimmed aggressively. Consumers triage by tolerance. Captions: tolerant — ±100 ms is invisible in subtitle display; consume freely. The click-a-word editor (Part 4): tolerant — seeking a video to roughly the right frame is the job. Lip-sync (Part 3): SENSITIVE — the eye notices mouth/audio misalignment beyond ~40-60 ms, so lip-sync stages do not naively keyframe off Whisper words; they either work from the audio directly (the Wav2Lip family consumes waveform features, sidestepping text timing entirely) or refine alignment with a dedicated forced aligner where phoneme-level precision is needed. The design rule: publish timestamps with their tolerance in mind, and never let a precision-sensitive consumer inherit a precision-casual producer\'s numbers without an explicit refinement step in between.'
    }
  ],
  code: {
    title: 'faster-whisper with VAD and word timestamps, plus the VC seam',
    intro: 'The hearing stack as DenDen Studio runs it: gated transcription producing a timeline, and the voice-conversion call sitting behind the same consent registry as TTS cloning. (Models run locally; the timeline logic is the lab.)',
    code: `# pip install faster-whisper       (MIT; models download on first use)

from faster_whisper import WhisperModel

# size ladder: tiny / base / small / medium / large-v3
# small = the sweet spot for creator dictation on modest hardware
stt = WhisperModel('small', device='auto', compute_type='int8')

def transcribe_timeline(wav_path):
    segments, info = stt.transcribe(
        wav_path,
        vad_filter=True,              # Silero VAD gates the ears:
        word_timestamps=True,         # silence -> pauses, not hallucinations
    )
    words = []
    for seg in segments:
        for w in seg.words:
            words.append({'w': w.word.strip(),
                          'start': round(w.start, 2),
                          'end': round(w.end, 2)})
    return words                      # a TIMELINE, not just a transcript

# words feed three consumers with different precision needs:
#   captions(words)         -> lab, +-100ms is fine
#   editor click-to-seek    -> Part 4, same tolerance
#   lip-sync                -> Part 3: does NOT keyframe off these -
#                              consumes audio features directly

# ---- voice conversion: the other swap path ---------------------------
def convert_voice(input_wav, voice_id, out_path):
    """RVC-class conversion: creator's performance, target's timbre."""
    v = VOICES[voice_id]              # SAME registry as TTS cloning:
                                      # no enrollment+consent, no target
    # rvc = load_rvc_model(v['vc_weights'])       # per-voice VC model
    # audio = rvc.convert(input_wav,
    #                     pitch_shift=v['pitch_offset'])
    # -> content + pitch contour preserved, timbre swapped
    # save(audio, out_path)
    return out_path

# The product rule of thumb, as routing:
def swap_voice(input_wav, voice_id, mode):
    if mode == 'script':      # reading: transcript + editability win
        words = transcribe_timeline(input_wav)
        text = ' '.join(w['w'] for w in words)
        return say_as(voice_id, text, 'out.wav')      # last lesson's TTS
    else:                     # 'performance': timing is the content
        return convert_voice(input_wav, voice_id, 'out.wav')`,
    notes: [
      'compute_type=int8 is the same quantization trade as GGUF LLMs — faster, smaller, negligible accuracy cost at this size. The triangle follows you everywhere.',
      'convert_voice resolving through VOICES is the whole consent story for VC: "it is just a filter" is exactly how the Smelly Cat video happened. Same registry, same gate, both paths.'
    ]
  },
  lab: {
    title: 'From VAD frames and word timings to spans and captions',
    prompt: 'Two timeline builders. (1) <code>speech_spans(frames, frame_ms, min_gap_ms)</code>: <code>frames</code> is a list of booleans (True = speech) each covering <code>frame_ms</code> milliseconds. Return merged spans as <code>[start_ms, end_ms]</code> pairs, where gaps of silence SHORTER than <code>min_gap_ms</code> are bridged (a breath is not a pause), and separate spans otherwise. (2) <code>captions(words, max_chars)</code>: group word dicts <code>{"w", "start", "end"}</code> into caption lines — words joined by spaces, each line at most <code>max_chars</code> (a single overlong word gets its own line). Return <code>{"text", "start", "end"}</code> per line, where <code>start</code> is the first word\'s start and <code>end</code> the last word\'s end. Both functions must be deterministic and lose nothing.',
    starter: `def speech_spans(frames, frame_ms, min_gap_ms):
    # merge True-runs; bridge False-gaps shorter than min_gap_ms
    pass

def captions(words, max_chars):
    # pack words into lines <= max_chars; line timing from first/last word
    pass`,
    checks: [
      { re: 'def\\s+speech_spans\\s*\\(', flags: '', must: true, hint: 'Define speech_spans(frames, frame_ms, min_gap_ms).', pass: 'speech_spans defined ✓' },
      { re: 'def\\s+captions\\s*\\(', flags: '', must: true, hint: 'Define captions(words, max_chars).', pass: 'captions defined ✓' },
      { re: 'min_gap_ms', flags: '', must: true, hint: 'Short silence gaps (a breath) must be bridged into the surrounding span.', pass: 'gap bridging present ✓' },
      { re: 'max_chars', flags: '', must: true, hint: 'Caption lines respect the max_chars budget.', pass: 'line budget respected ✓' }
    ],
    tests: `# 100ms frames: speech(3), gap(2=200ms), speech(2), gap(5=500ms), speech(1)
frames = [True]*3 + [False]*2 + [True]*2 + [False]*5 + [True]
spans = speech_spans(frames, 100, 300)
assert spans == [[0, 700], [1000, 1100]], \
    'the 200ms breath is bridged; the 500ms pause splits: got ' + str(spans)
assert speech_spans([False]*4, 100, 300) == [], 'pure silence: no spans'
assert speech_spans([True]*3, 100, 300) == [[0, 300]], 'pure speech: one span'

words = [{'w': 'Hello', 'start': 0.0, 'end': 0.4},
         {'w': 'there,', 'start': 0.45, 'end': 0.8},
         {'w': 'welcome', 'start': 1.0, 'end': 1.5},
         {'w': 'aboard', 'start': 1.55, 'end': 2.0}]
lines = captions(words, 14)
assert len(lines) == 2, 'two lines under a 14-char budget'
assert lines[0]['text'] == 'Hello there,' and lines[0]['start'] == 0.0 \
    and lines[0]['end'] == 0.8, 'line timing spans its words'
assert lines[1]['text'] == 'welcome aboard'
total_words = ' '.join(l['text'] for l in lines).split()
assert total_words == [w['w'] for w in words], 'nothing lost, order kept'
print('spans and captions correct')`,
    solution: `def speech_spans(frames, frame_ms, min_gap_ms):
    spans = []
    start = None
    for i, is_speech in enumerate(frames):
        if is_speech and start is None:
            start = i * frame_ms
        elif not is_speech and start is not None:
            spans.append([start, i * frame_ms])
            start = None
    if start is not None:
        spans.append([start, len(frames) * frame_ms])
    merged = []
    for s in spans:
        if merged and s[0] - merged[-1][1] < min_gap_ms:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return merged

def captions(words, max_chars):
    lines = []
    cur = []
    for w in words:
        candidate = ' '.join(x['w'] for x in cur + [w])
        if cur and len(candidate) > max_chars:
            lines.append({'text': ' '.join(x['w'] for x in cur),
                          'start': cur[0]['start'], 'end': cur[-1]['end']})
            cur = [w]
        else:
            cur.append(w)
    if cur:
        lines.append({'text': ' '.join(x['w'] for x in cur),
                      'start': cur[0]['start'], 'end': cur[-1]['end']})
    return lines`,
    notes: [
      'The two-pass shape of speech_spans (raw runs, then gap-merge) mirrors how VAD post-processing actually ships: the classifier is frame-level and jittery; the smoothing policy — how long a silence counts as a pause — is a product decision, not a model output.',
      'captions is deliberately the same greedy-pack algorithm as the TTS chunker two lessons ago, packing by display width instead of synthesis length. Noticing "this is the same function wearing different units" is a real engineering skill; by Part 5 you will have written it four times and should extract it once.'
    ]
  },
  deepDive: {
    timeMin: 12,
    intro: 'Two mechanisms beneath today\'s working knowledge: what Whisper actually is (and why its failure modes look like LLM failure modes), and how voice conversion pulls one voice apart into swappable pieces.',
    sections: [
      {
        h: 'Whisper is a sequence-to-sequence LLM whose prompt is a spectrogram',
        p: 'Architecturally, Whisper is an encoder-decoder transformer: the encoder reads 30-second windows of audio as — full circle from the TTS deep dive — a log-mel spectrogram, and the decoder is a text language model that generates the transcript token by token while cross-attending to the encoder\'s audio representation. Special tokens steer it: language ID, task (transcribe vs translate), timestamp tokens interleaved with text (that is where segment timing comes from — the model literally GENERATES time markers as tokens). Once you see the decoder-is-an-LLM shape, every quirk becomes familiar: hallucination on weak audio is prior-takes-over (same as an LLM confabulating on a question it half-knows); repetition loops on degraded audio are classic LM decoding pathologies (mitigated by the temperature-fallback and compression-ratio checks faster-whisper runs); prompt injection exists (initial_prompt biases vocabulary — feed it your app\'s domain terms, and proper nouns start spelling correctly); and the 30-second window explains long-form drift plus why implementations chunk-and-carry context between windows. Word timestamps, one refinement deeper: derived from cross-attention alignment between text tokens and audio frames — an inference about an inference, which is exactly why the tech section priced their tolerance in tens of milliseconds.'
      },
      {
        h: 'How voice conversion disentangles a voice — and where it leaks',
        p: 'The RVC-class recipe: (1) a pretrained self-supervised speech encoder (HuBERT-family) maps input audio to content representations — features trained to capture WHAT is being articulated while being relatively indifferent to WHO is speaking; (2) pitch is tracked explicitly as an F0 contour, then shifted/scaled toward the target\'s range (this is why VC survives singing: the melody is measured and transposed, not re-imagined); (3) a decoder/vocoder trained on the TARGET voice re-synthesizes audio from content features + shifted F0 — timbre comes from the decoder\'s weights, performance comes from the input\'s features. The leaks live in step 1\'s "relatively": content features are not perfectly speaker-free — accent, articulation habits, and some vocal texture ride along — so conversions between very different voices (deep male ↔ light female) can carry a ghost of the source or artifact on extremes; expressive outliers (shouts, whispers, laughter) stress both the F0 tracker and the content encoder, which is why VC demos love clean conversational speech. Per-voice quality also depends on the target decoder\'s training data — the same reference-is-the-ceiling law as cloning, now applied to the minutes-of-audio that trained the target model. The comparison worth carrying forward: TTS cloning disentangles at the TEXT bottleneck (maximum information discard, maximum re-invention freedom); VC disentangles at the CONTENT-FEATURE bottleneck (minimum discard, minimum freedom) — and Part 3\'s talking heads sit on the same spectrum, choosing what to preserve from the source image versus re-generate.'
      }
    ]
  },
  quiz: [
    {
      q: 'For DenDen Studio, the most valuable thing Whisper produces beyond the text itself is:',
      options: ['A confidence score', 'Word-level timestamps — turning the transcript into a timeline that captions, editing, and downstream stages consume', 'Speaker names', 'Punctuation'],
      correct: 1,
      explain: 'A transcript says what was said; the timestamps say where everything lives. Captions, click-to-seek editing, and pause structure all feed on the timeline.'
    },
    {
      q: 'Whisper transcribes a long silent stretch as "Thanks for watching!" because:',
      options: ['The audio file is corrupted', 'Its decoder is a language model — on weak audio evidence, the training-data prior (subtitle corpora) fills the vacuum with likely text', 'VAD inserted the phrase', 'It detected a video ending'],
      correct: 1,
      explain: 'Weak conditioning lets the LM prior take over — the same confident-gap-filling as every probabilistic component in this course. The fix is gating, not scolding: VAD first.'
    },
    {
      q: 'A creator performs a line with elaborate comedic timing and wants it in their cloned voice. The right path and why:',
      options: ['STT→TTS — it is the path already built', 'Direct voice conversion — content, timing, and pitch contour are preserved; only timbre swaps. The text path would flatten the performance to punctuation', 'Either; they are equivalent', 'Neither preserves timing'],
      correct: 1,
      explain: 'Reading a script → STT→TTS (transcript, editability). Performing a take → VC (the delivery IS the content). The pause dies on the page.'
    },
    {
      q: 'Lip-sync stages do not keyframe mouth motion directly off Whisper\'s word timestamps because:',
      options: ['Whisper is too slow', 'Word timings are alignment inferences with tens-of-ms error — visible at lip-sync\'s ~40-60ms tolerance — so sync stages consume audio features directly or refine with forced alignment', 'Timestamps are in the wrong units', 'Lip-sync does not need timing'],
      correct: 1,
      explain: 'Captions tolerate ±100ms; lips do not. Precision-sensitive consumers never inherit precision-casual numbers without a refinement step.'
    },
    {
      q: 'Voice conversion requests must resolve the target through the consent-verified voice registry because:',
      options: ['VC models load faster that way', 'The output is the target\'s voice saying words they never said — precisely the harm the consent gate exists for; "it is just a filter" is how the Smelly Cat video happened', 'Registries improve audio quality', 'Only TTS is legally sensitive'],
      correct: 1,
      explain: 'Same output risk, same gate, both paths. The recipe being right with the permission missing means everything is wrong.'
    }
  ],
  pitfalls: [
    'Running Whisper ungated and shipping transcripts of silence, music, and background chatter. VAD-first is one flag in faster-whisper and a few milliseconds of CPU — and the spans it produces are pipeline data (pauses, rest states, utterance ends), not just a hallucination guard.',
    'Treating word timestamps as ground truth for anything the eye can check. Captions survive ±100ms; a mouth does not — route lip-sync through audio features or forced alignment, and record the tolerance assumption next to every timestamp consumer.',
    'Building the VC path outside the voice registry because it "transforms the creator\'s own audio." The input is theirs; the OUTPUT is the target\'s voice — enrollment, consent verification, and audit apply identically, and retrofitting governance onto a shipped bypass is far more expensive than routing through it on day one.'
  ],
  interview: [
    {
      q: 'Design the speech-understanding stage of a voice-driven media app: what runs, in what order, and why?',
      a: 'Three layers, cheapest first. (1) Voice-activity detection (Silero-class): milliseconds of CPU, labels speech vs non-speech frames, then a smoothing policy merges jittery frame decisions into spans — bridging sub-pause gaps (a breath) and splitting on real silences. The spans are product data: pauses feed rest states downstream, and in live mode the speech→silence edge is the utterance-end trigger. (2) Transcription (faster-whisper, int8, size chosen by hardware and accuracy need): runs ONLY on speech spans — which kills the hallucination-on-silence class architecturally rather than hoping the model abstains — with word_timestamps on, producing a timeline: each word with start/end. (3) Consumers, triaged by timing tolerance: captions and click-to-seek take Whisper words as-is (±100ms invisible); lip-sync does not — it consumes audio features directly or refines via forced alignment, because the eye flags mouth/audio drift beyond ~40-60ms and word timestamps are alignment inferences, not measurements. The recurring principle: a cheap deterministic gate in front of an expensive probabilistic model, and precision published with its tolerance so no sensitive consumer inherits casual numbers.'
    },
    {
      q: 'Compare speech-to-text-then-synthesis against direct voice conversion for a voice-swap product. When is each correct, and what does a mature product ship?',
      a: 'They differ in WHERE the voice is disentangled, which determines what survives. STT→TTS bottlenecks through TEXT: maximal discard — pacing, melody, emphasis reduced to punctuation — then the target voice re-invents a performance. That discard is a feature for scripted content: you get a free transcript (captions, moderation, LLM input) and an editable intermediate (fix stumbles in text, re-synthesize), and the output prosody is consistently professional even if the input was mumbled. VC bottlenecks through CONTENT FEATURES: minimal discard — the phoneme stream and pitch contour survive, timbre swaps — so acting, comedic timing, and song come through; it is also one inference, which is why live paths choose it. Its costs: no transcript (run Whisper in parallel off the hot path), no text-editing, per-target-model quality variance, and stress on expressive extremes. A mature product ships both behind one voice menu, routed by intent — "read a script" versus "perform a take," with the toggle exposed because creators hear the difference — plus one non-negotiable invariant: both paths resolve the target voice through the same consent-verified registry, because the output harm (someone\'s voice saying words they never said) is identical regardless of which math produced it.'
    },
    {
      q: 'Whisper works flawlessly in your tests but production users report garbage transcripts, phantom sentences, and repeated phrases. Walk through your diagnosis.',
      a: 'Triage by symptom, because these are three distinct failure classes. Phantom sentences ("Thanks for watching," invented pleasantries): non-speech audio reaching the decoder — check whether VAD is actually enabled in the production path (a config drift between test and prod is the usual culprit), and whether users\' audio has music beds or long silences your clean test set lacked; fix is gating plus recording spans as pauses. Repeated phrases / loops: degraded or unusual audio driving the decoder into LM pathologies — verify faster-whisper\'s quality fallbacks are on (temperature ladder, compression-ratio and log-prob thresholds trigger re-decode), and inspect the audio segments that looped: heavy compression artifacts, far-field mics, and crosstalk are typical. Garbage transcripts overall: channel mismatch — production audio at 8kHz telephone quality, clipped gain, or a language/accent mix your model size handles poorly; fixes in order of cheapness: input validation at upload (the same DSP gate as voice enrollment — reuse it), initial_prompt seeded with domain vocabulary for jargon-heavy users, then a model-size bump only once the cheap fixes are measured insufficient. Meta-point I would emphasize: build the failure taxonomy INTO the product — log VAD spans, decode fallback triggers, and audio-quality metrics per request — so the next report arrives pre-classified instead of as "transcription is bad."'
    },
    {
      q: 'Your PM wants live transcription displayed while the creator speaks. What changes versus batch transcription, and what do you warn about?',
      a: 'Batch Whisper transcribes completed audio; live means transcribing audio that is still happening, which restructures everything. Chunking: audio arrives in small buffers; you either run incremental decoding over a sliding window or transcribe rolling chunks and stitch — either way, the last words of every partial result are UNSTABLE (the model revises them once more context arrives), so the UI must render a committed region plus a visibly-tentative tail, or users watch words flicker and rewrite. Latency budget: model size drops (small/base, int8) because each update must land in a few hundred milliseconds; VAD runs streaming and its speech→silence edge becomes the utterance-commit trigger. Resource competition: in DenDen Studio live mode, Whisper now shares the machine with voice conversion and lip-sync — the co-residency arithmetic from Part 0 applies, pushing toward the smallest model that meets accuracy. Warnings for the PM, concretely: live word timestamps are rougher than batch (alignment needs context that has not arrived), so nothing precision-sensitive should consume them; accuracy is measurably below batch on the same audio (less context per decision) — if the transcript is destined for captions on the FINAL video, re-run batch Whisper over the full recording afterward and reconcile, so live text is a preview, not the artifact; and the flicker-vs-lag tradeoff (commit aggressively and correct visibly, or lag and feel slow) is a UX decision to prototype early, because it dominates perceived quality more than word error rate does.'
    }
  ]
};
