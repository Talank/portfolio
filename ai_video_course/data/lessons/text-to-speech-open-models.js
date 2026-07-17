window.LESSONS = window.LESSONS || {};
window.LESSONS['text-to-speech-open-models'] = {
  id: 'text-to-speech-open-models',
  title: 'Open TTS: How Text Becomes a Human-Sounding Voice (Piper, XTTS, Bark)',
  category: 'Part 2 — Voice: TTS, Cloning & Swapping',
  timeMin: 35,
  summary: 'The voice column of DenDen Studio starts here. Neural text-to-speech is a two-stage pipeline — an acoustic model plans the sound (a mel spectrogram: which frequencies, when, for how long), and a vocoder renders that plan into an actual waveform — and knowing the split explains almost every quality knob and failure you will meet. Then the open-model menu: Piper for fast, CPU-friendly, dependable speech; XTTS for expressive multilingual synthesis (and next lesson, cloning) — with a license you must actually read; Bark for wild expressiveness you cannot fully steer. Plus the unglamorous 20% that makes or breaks real products: text normalization, sentence chunking, and caching.',
  goals: [
    'Explain the two-stage TTS architecture — text → mel spectrogram (acoustic model) → waveform (vocoder) — and what each stage is responsible for',
    'Choose between Piper, XTTS, and Bark by use case, latency budget, and license — not by demo videos',
    'Normalize text before synthesis: numbers, abbreviations, and symbols that models read wrong out loud',
    'Chunk long scripts on sentence boundaries so synthesis streams, parallelizes, and caches',
    'Cache synthesized audio by content key so an unchanged line never renders twice'
  ],
  concept: [
    {
      h: 'Two stages: plan the sound, then render it',
      p: [
        'Modern neural TTS splits the job the way a musician splits it: first decide WHAT the sound should be, then make air actually move. Stage one, the <b>acoustic model</b>, reads the text (usually converted to phonemes first — sound units, not letters) and emits a <b>mel spectrogram</b>: a time-frequency image of the intended speech — which frequencies carry energy, moment by moment, at roughly 80 frequency bands per ~12 ms frame. Everything you would call the PERFORMANCE lives here: timing, pitch contour, stress, pauses, how long each vowel is held. Stage two, the <b>vocoder</b>, converts that spectrogram into an actual waveform — tens of thousands of samples per second of audio. It contributes fidelity (crispness, naturalness of the signal), not interpretation.',
        'The split matters practically because problems localize by stage. Wrong pacing, flat emphasis, weird pauses, a mispronounced word — acoustic model territory (often fixable with better input text or phoneme hints). Metallic buzz, hiss, robotic timbre with correct timing — vocoder territory. And the split is why voice cloning (next lesson) is even possible: the voice identity is carried in how the acoustic model shapes the spectrogram, so conditioning THAT stage on a speaker sample changes who is speaking without touching the renderer.'
      ]
    },
    {
      h: 'The open menu: Piper, XTTS, Bark — three tools, three jobs',
      p: [
        '<b>Piper</b> is the workhorse: small single-speaker models (tens of MB), runs comfortably on CPU faster than realtime, ships hundreds of prebuilt voices, MIT-licensed. The voice is fixed per model — no cloning — and expressiveness is modest. This is the tool for the live path (Part 3 needs faster-than-realtime on modest hardware), for UI voices, and for any "just say this reliably, now" job. <b>XTTS</b> (Coqui\'s flagship) is the expressive multilingual model that also does zero-shot voice cloning from a few seconds of reference audio — the natural centerpiece of DenDen Studio\'s offline path. It wants a GPU for comfortable speed and — the license lesson from anatomy-of-an-llm-app, now with teeth — ships under the Coqui Public Model License: <b>non-commercial</b>. Prototype freely; shipping a paid product on it requires either a license arrangement or choosing an Apache/MIT-licensed cloning alternative, and this course treats that as a first-class architecture input, not a footnote.',
        '<b>Bark</b> is the wildcard: a generative model that produces not just speech but laughter, sighs, hesitation, even background sound, from text with inline cues like <code>[laughs]</code>. The price of that expressiveness is control: it is slow, occasionally ignores or misplaces cues, and does not reliably reproduce a specific target voice. Use it where surprise is acceptable and delight is the goal — never on the critical path where a creator expects the same line to render the same way twice. The menu discipline: pick per JOB, not per fashion — DenDen Studio will legitimately ship with two or three TTS engines behind one interface, exactly like its two LLM paths.'
      ]
    },
    {
      h: 'Text normalization: the model reads exactly what you send',
      p: [
        'TTS models are trained mostly on clean read-aloud text, and they take your string literally. Send <code>"Dr. Smith lives at 221B Baker St."</code> and cheap models may say "der Smith lives at two-two-one-bee baker ess-tee." Send <code>"$3.50"</code>, <code>"2026-07-17"</code>, <code>"3:05 AM"</code>, or <code>"v2.1"</code> and you get a lottery. <b>Text normalization</b> — expanding numbers, dates, currency, units, abbreviations into words BEFORE synthesis ("three dollars and fifty cents") — is the single highest-leverage quality fix in practical TTS, and it is plain string engineering, no models involved.',
        'For DenDen Studio the normalization pass has a second client: the script the creator typed is also what the lip-sync stage will time against and what captions will display — so normalization must be a <b>recorded transformation</b> (keep both the display text and the spoken text), not an in-place mutation. Good engines do some normalization internally (better ones more), but relying on it silently is how "twenty twenty-six dash zero seven" ships to production. Normalize explicitly, log the expansion, and let the creator override pronunciation when they care ("it is pronounced KAY-oss, not chaos").'
      ]
    },
    {
      h: 'Chunking and caching: the difference between a demo and a product',
      p: [
        'Naively synthesizing a 500-word script as one call means: nothing plays until everything renders, one glitch re-renders everything, and no parallelism. Chunking on <b>sentence boundaries</b> fixes all three — sentences are natural prosodic units (splitting mid-clause produces audible seams), each chunk synthesizes independently, playback can begin after chunk one, and a fixed typo re-renders one sentence, not the speech. The chunker must be boring and correct: split on sentence-ending punctuation, keep every character, respect a max length by splitting long sentences at clause punctuation — and it must be deterministic, because chunk boundaries define cache keys.',
        'Which is the last piece: synthesized audio is expensive to make and cheap to store, and creators re-render constantly while editing everything EXCEPT most of the script. Cache each chunk\'s audio under a key derived from exactly the inputs that change the output: the normalized chunk text, the voice identity, the engine and its version, and the speed/expressiveness settings. Hash them together; before synthesizing, look up. An edit to sentence 14 of 40 then costs one sentence of GPU time, not forty. This pattern — content-addressed caching of expensive model output — returns at full scale in Part 5, where the LLM director\'s plan diffing decides which stages can skip entirely.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Brook Explains the Two Halves of Music — and the Crew Hires Three Very Different Performers',
      text: 'A port town hires the Straw Hats to produce the announcements for its harbor festival, and Brook turns teacher. "Music — and speech, which is music that thinks it is being practical — happens in two stages. First, the arrangement." He holds up a sheet covered in his own notation: every note\'s pitch, length, attack, where the phrase breathes. "This page decides EVERYTHING about the performance — the feeling, the pauses, the emphasis. And yet it makes no sound at all. Then the instrument renders it: strings actually moving air. A brilliant arrangement through a cheap instrument sounds thin. A dull arrangement through a master\'s violin is a beautifully polished bore. When something sounds wrong, FIRST ask which half failed — fixing the violin will not repair a bad arrangement." For the festival itself, the crew ends up engaging three performers, and Brook defends each choice by job. The town\'s music box mechanism plays announcements all day, instantly, never tiring, always the same dependable voice — nobody\'s heart flutters, nothing ever fails. For the mayor\'s eulogy of the old harbormaster, Brook himself performs — after listening to one short recording of the harbormaster humming, he plays the melody the way the OLD MAN would have, a resemblance that makes the widow weep — though he notes, primly, that his conservatory\'s rules forbid selling such imitations without the estate\'s blessing. And for the closing night they bring a legendary street performer whose sets are transcendent and unrepeatable — he laughs mid-phrase, weeps, improvises — and who absolutely cannot be booked for the safety announcements, because nobody, including him, knows what he will play.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Phoebe\'s Demo Tape Rules: The Session Singer, Phoebe, and Live Smelly Cat',
      text: 'Phoebe gets a commercial jingle contract and, to everyone\'s surprise, runs it like a producer. First she explains her process to Rachel, tapping her notebook: "The song exists twice. Once here — every note, every pause, where I breathe, where the emphasis goes. That page IS the performance; it just cannot be heard yet. Then someone sings it into the microphone, which is a completely different skill — Chandler could sing my page and ruin it, a great singer could sing a boring page and it stays boring, just... shinier. When a take sounds wrong, you first figure out WHICH of the two broke." Then the casting, by job. For the thirty daily radio spots, she books a session singer — utterly dependable, sounds the same at take one and take ninety, cheap, available, admittedly nobody\'s favorite voice. For the client\'s anniversary surprise — the founder\'s late wife used to sing the original 1970s jingle — Phoebe listens to one scratchy answering-machine clip of the wife and then sings it AS her, close enough that the founder has to leave the room; she is very clear that her old busker\'s code forbids charging money for singing in a dead woman\'s voice without the family\'s written yes. And for the launch party, they want Phoebe LIVE — which Monica opposes on operational grounds, because live Phoebe is glorious and unrepeatable: she might laugh mid-verse, add a new verse about the sound guy, or decide mid-song that the jingle is now about cats. "Exactly," Phoebe beams. "That is why you do not put me on the safety announcements."'
    },
    why: 'Brook\'s arrangement-versus-instrument and Phoebe\'s page-versus-singer are the acoustic-model/vocoder split — the plan of the sound (timing, pitch, emphasis: the mel spectrogram) versus the rendering of it (the waveform), with both teachers insisting on the same diagnostic rule the lesson teaches: locate the failure by stage before fixing anything. The three performers are the menu, one per job: the music box / session singer is Piper (fast, dependable, fixed voice, never the star); Brook and Phoebe imitating a voice from one short sample are XTTS — zero-shot cloning — each carrying an explicit license clause (the conservatory\'s rules, the busker\'s code) that forbids commercial use without permission, which is literally XTTS\'s CPML situation; the transcendent-unrepeatable street performer and live Smelly Cat are Bark — maximum expressiveness, minimum control, never on the critical path. Even the caching shows up: the session singer\'s take ninety sounding identical to take one is what makes reuse possible at all.'
  },
  tech: [
    {
      q: 'Why do most TTS systems convert text to phonemes before the acoustic model, and what breaks when a system skips it?',
      a: 'English spelling is a catastrophe as a pronunciation code: "though/tough/through" share letters and share no sounds, "read" changes pronunciation by tense, and names/loanwords follow no rules at all. A grapheme-to-phoneme (G2P) front end converts text into sound units first, so the acoustic model learns the much cleaner mapping phonemes→spectrogram instead of memorizing spelling chaos. Systems trained straight on characters can work — with enough data they internalize G2P implicitly — but their failures concentrate exactly where explicit G2P has an escape hatch: rare words, names, brand terms, technical jargon. The practical consequence for DenDen Studio: a pronunciation-override feature ("KAY-oss") is only cleanly buildable when there is a phoneme layer to inject into — engines like Piper accept phoneme input directly — whereas character-based engines can only be nudged with creative respelling. When choosing an engine, "can I hand it phonemes for the words it gets wrong?" is a checklist question.'
    },
    {
      q: 'A rendered line has perfect timing and emphasis but sounds slightly metallic and hissy. Another has crystal-clear audio but pauses in weird places. Which stage do you investigate for each, and what are the usual fixes?',
      a: 'Metallic/hissy with correct performance: vocoder territory — the spectrogram plan was fine, the waveform rendering is lossy. Usual fixes: a better vocoder variant if the engine offers one, checking sample-rate mismatches (synthesizing at 22.05 kHz and resampling badly to 44.1 adds artifacts), and confirming no double-compression in the pipeline (re-encoding the output). Weird pauses with clean audio: acoustic-model territory — the plan itself was wrong. Usual fixes, in order of cheapness: input text (normalization gaps, stray punctuation — a misplaced comma IS a pause instruction; markdown or emoji leaking into the script reads as noise), chunking (a mid-clause split forces an unnatural boundary — fix the chunker, not the model), then engine settings or a better acoustic model. The meta-skill this question drills: the two-stage architecture gives you a decision tree, so "it sounds off" becomes a 5-minute localization instead of random knob-turning.'
    },
    {
      q: 'Design the cache key for synthesized audio chunks. What goes in, what deliberately stays out, and what silently breaks the cache if forgotten?',
      a: 'In: everything that changes the waveform — the NORMALIZED chunk text (post-expansion, so display-text edits that normalize identically still hit), voice identity (preset name, or next lesson a hash of the reference-sample embedding), engine name AND version/model checksum (a Piper voice update changes output for identical text — forgetting this serves stale audio that mysteriously mismatches new renders), and every synthesis setting that alters sound: speed, expressiveness, sample rate, seed for engines with sampling variance. Out, deliberately: project ID, creator ID, timestamps, chunk position — none affect the waveform, and including them shreds hit rates (the same sentence in two projects should hit). The classic silent breakers: normalizing AFTER keying (two texts that normalize identically miss), floating-point settings keyed without rounding (speed 1.0 vs 1.0000001), and engine upgrades without version in the key — that one is nastiest because everything works until the first re-render sits next to a cached neighbor and the voice subtly shifts mid-paragraph. Hash the canonicalized tuple; store alongside it the metadata you excluded, for debugging.'
    }
  ],
  code: {
    title: 'Driving Piper and XTTS locally, behind one interface',
    intro: 'The shape that survives to Part 5: one synth interface, engines as plugins, normalization and caching wrapped around whichever engine runs. (Model downloads happen on your machine — run locally, not in the browser.)',
    code: `# pip install piper-tts          (MIT license, CPU, fast)
# pip install TTS                  (Coqui XTTS - CPML: non-commercial!)

from pathlib import Path
import hashlib, json, subprocess

# ---- Piper: fixed voice, faster than realtime, CPU ------------------
def piper_say(text, voice_model, out_path):
    # piper ships as a CLI; one process call per chunk
    subprocess.run(
        ['piper', '--model', voice_model,        # e.g. en_US-lessac-medium
         '--output_file', out_path],
        input=text.encode(), check=True)

# ---- XTTS: expressive, multilingual, GPU-preferred -------------------
def xtts_say(text, out_path, speaker_wav=None, language='en'):
    from TTS.api import TTS                      # heavy import: do it once
    tts = TTS('tts_models/multilingual/multi-dataset/xtts_v2')
    tts.tts_to_file(text=text, file_path=out_path,
                    speaker_wav=speaker_wav,     # None today; the cloning
                    language=language)           # hook for next lesson

# ---- The wrapper the app actually calls ------------------------------
CACHE_DIR = Path('tts_cache')

def synth(text, engine, voice, settings):
    normalized = normalize_text(text)            # your pass, logged
    key = hashlib.sha256(json.dumps(
        [normalized, engine['name'], engine['version'],
         voice, settings], sort_keys=True).encode()).hexdigest()
    hit = CACHE_DIR / (key + '.wav')
    if hit.exists():
        return hit                               # 0 ms of GPU spent
    if engine['name'] == 'piper':
        piper_say(normalized, voice, str(hit))
    elif engine['name'] == 'xtts':
        xtts_say(normalized, str(hit), speaker_wav=voice.get('sample'))
    return hit

# DenDen Studio ships BOTH: piper on the live path (speed),
# xtts on the offline path (expressiveness + cloning) -- one interface,
# chosen per job, exactly like the 8B/70B routing argument in Part 1.`,
    notes: [
      'The engine dict carries name AND version into the cache key — the tech questions explain the subtle staleness bug that prevents.',
      'XTTS\'s CPML license makes it a prototyping tool for a commercial product; the architecture keeps it swappable behind synth() so a permissively-licensed cloning engine can replace it without touching callers. License-driven swappability is a real design force in open-model apps.'
    ]
  },
  lab: {
    title: 'The unglamorous 20%: sentence chunking and cache keys',
    prompt: 'Two functions. (1) <code>chunk_script(script, max_chars)</code>: split a script into chunks on sentence boundaries (sentences end with <code>.</code>, <code>!</code>, or <code>?</code> followed by a space or end-of-string). Pack consecutive sentences into chunks up to <code>max_chars</code>; a sentence that alone exceeds <code>max_chars</code> becomes its own chunk (never split mid-sentence here). No characters may be lost — <code>" ".join</code> of the pieces must reconstruct the script\'s words in order. (2) <code>tts_cache_key(text, engine, version, voice, speed)</code>: canonicalize (collapse all whitespace runs in <code>text</code> to single spaces and strip; round <code>speed</code> to 2 decimals) and return the SHA-256 hex digest of the five fields joined with <code>"|"</code>. Same inputs, same key — across runs, machines, and dict orderings.',
    starter: `import hashlib, re

def chunk_script(script, max_chars):
    # split into sentences on . ! ? boundaries, then pack greedily
    pass

def tts_cache_key(text, engine, version, voice, speed):
    # canonicalize -> 'text|engine|version|voice|speed' -> sha256 hex
    pass`,
    checks: [
      { re: 'def\\s+chunk_script\\s*\\(', flags: '', must: true, hint: 'Define chunk_script(script, max_chars).', pass: 'chunk_script defined ✓' },
      { re: 'def\\s+tts_cache_key\\s*\\(', flags: '', must: true, hint: 'Define tts_cache_key(text, engine, version, voice, speed).', pass: 'tts_cache_key defined ✓' },
      { re: 'sha256', flags: '', must: true, hint: 'Use hashlib.sha256 for the cache key.', pass: 'sha256 used ✓' },
      { re: 'round\\s*\\(', flags: '', must: true, hint: 'Round speed to 2 decimals before keying — 1.0 and 1.0000001 must collide.', pass: 'speed rounded ✓' },
      { re: '[.!?]', flags: '', must: true, hint: 'Sentences end with . ! or ? — split on those boundaries.', pass: 'sentence boundaries used ✓' }
    ],
    tests: `s = 'Hello there. This is a test! Short. A somewhat longer sentence follows here?'
chunks = chunk_script(s, 40)
assert all(len(c) <= 40 or ' ' not in c or c.count('.') + c.count('!') + c.count('?') <= 1
           for c in chunks), 'only single overlong sentences may exceed max_chars'
assert ' '.join(' '.join(chunks).split()) == ' '.join(s.split()), 'no words lost or reordered'
assert chunks[0].startswith('Hello there.'), 'first sentence leads the first chunk'
one = chunk_script('Tiny. Also tiny.', 100)
assert len(one) == 1, 'short sentences pack together into one chunk'
big = chunk_script('A' * 90 + '. Next.', 40)
assert any(len(c) > 40 for c in big), 'an overlong single sentence stays whole'

k1 = tts_cache_key('Hello   world', 'piper', '1.2', 'lessac', 1.0)
k2 = tts_cache_key('Hello world', 'piper', '1.2', 'lessac', 1.0000001)
assert k1 == k2, 'whitespace collapse + speed rounding: same waveform, same key'
k3 = tts_cache_key('Hello world', 'piper', '1.3', 'lessac', 1.0)
assert k1 != k3, 'engine version change MUST change the key'
assert len(k1) == 64 and all(c in '0123456789abcdef' for c in k1), 'sha256 hex digest'
print('chunking and cache keys correct')`,
    solution: `import hashlib, re

def chunk_script(script, max_chars):
    sentences = [s.strip() for s in
                 re.split(r'(?<=[.!?])\\s+', script.strip()) if s.strip()]
    chunks, current = [], ''
    for s in sentences:
        if not current:
            current = s
        elif len(current) + 1 + len(s) <= max_chars:
            current = current + ' ' + s
        else:
            chunks.append(current)
            current = s
    if current:
        chunks.append(current)
    return chunks

def tts_cache_key(text, engine, version, voice, speed):
    canon_text = ' '.join(text.split())
    canon = '|'.join([canon_text, engine, version, voice,
                      str(round(speed, 2))])
    return hashlib.sha256(canon.encode()).hexdigest()`,
    notes: [
      'The regex splits AFTER end punctuation (lookbehind), so the punctuation stays attached to its sentence — chunk boundaries are also prosody boundaries, which is the whole audio-quality argument for sentence chunking.',
      'Determinism is the quiet requirement: the same script must chunk identically forever, because chunk text feeds the cache key. A "smarter" chunker that changes boundaries between versions silently invalidates every cached render.'
    ]
  },
  deepDive: {
    timeMin: 12,
    intro: 'One level down: what a mel spectrogram actually is (and why every speech model in this course speaks that dialect), and how neural vocoders render it fast enough to matter.',
    sections: [
      {
        h: 'The mel spectrogram: speech\'s common intermediate language',
        p: 'Take the waveform, slice it into overlapping ~25 ms windows, Fourier-transform each window to get its frequency content, then pool those frequencies into ~80 bands spaced on the MEL scale — perceptually even steps of pitch, wide resolution where human hearing is sharp (low-mid frequencies, where vowels and pitch live) and coarse where it is dull (high frequencies). Stack the frames and you get an image: time along one axis, perceived pitch along the other, brightness = energy. It is a LOSSY summary — phase is discarded, fine detail pooled away — and that is precisely the point: it keeps what the ear keeps. This one representation is the lingua franca of the whole speech stack you are about to build on: TTS acoustic models EMIT it, vocoders CONSUME it, Whisper\'s encoder (two lessons from now) READS it as its input image, and voice-conversion models transform it. Learn to glance at one (bright horizontal bands = vowel resonances, vertical striations = consonant bursts, the lowest band\'s wobble = pitch contour) and audio bugs become visible before they are audible.'
      },
      {
        h: 'Vocoders: from image back to air, ten thousand times a second',
        p: 'The vocoder\'s job is mel-to-waveform — inverting a lossy transform, which means HALLUCINATING plausible phase and fine structure the spectrogram never stored. Classical signal-processing inversion (Griffin-Lim) produces the robotic, phasey voice of older systems. Neural vocoders changed everything: autoregressive models (WaveNet-class) generated one sample at a time — stunning quality, hopeless speed (24,000 sequential steps per second of audio). The modern default is GAN-based parallel vocoders (HiFi-GAN class): a generator upsamples the whole spectrogram to waveform in one shot, trained adversarially so discriminators punish anything that does not look and sound like real speech at multiple timescales. Result: realtime-or-faster synthesis on CPU, which is exactly what makes Piper\'s speed possible. Engineering intuitions that fall out: vocoder artifacts (metallic edge, breathiness) are TEXTURE errors from the hallucinated detail, distinct from acoustic-model PLAN errors; vocoders are trained for a specific sample rate and mel configuration, so mixing engine A\'s acoustic model with engine B\'s vocoder fails unless configs match exactly; and the vocoder is why "it is just an 80-band image" does not mean audio is low-bandwidth — the expansion from ~80 numbers per frame to 240+ samples per frame is real generative work, not decompression.'
      }
    ]
  },
  quiz: [
    {
      q: 'In two-stage TTS, the mel spectrogram is:',
      options: ['The final audio output', 'The acoustic model\'s plan of the sound — timing, pitch, emphasis as a time-frequency image — which the vocoder then renders to waveform', 'A compression format for shipping audio', 'The phoneme dictionary'],
      correct: 1,
      explain: 'Stage one plans the performance (spectrogram), stage two renders it (waveform). The split is also the diagnostic tree: performance bugs vs fidelity bugs.'
    },
    {
      q: 'For DenDen Studio\'s LIVE path on modest hardware, the menu answer is:',
      options: ['Bark, for expressiveness', 'XTTS, for cloning', 'Piper — faster-than-realtime on CPU, dependable, fixed voices — with cloning reserved for the offline path', 'All three simultaneously'],
      correct: 2,
      explain: 'The live path is a latency budget with a product attached. Piper\'s speed and reliability win there; XTTS\'s expressiveness and cloning earn their GPU time offline.'
    },
    {
      q: '"Meet Dr. Ray at 3:05 PM, $20 entry" renders badly. The highest-leverage fix is:',
      options: ['A bigger TTS model', 'Text normalization — expand numbers, times, currency, and abbreviations to words before synthesis, and record the transformation', 'Higher sample rate', 'Switching vocoders'],
      correct: 1,
      explain: 'Models read literally what you send. Normalization is plain string engineering and fixes more real-world quality complaints than any model swap.'
    },
    {
      q: 'Chunking scripts on sentence boundaries (rather than fixed character counts) matters because:',
      options: ['Models reject long strings', 'Sentence boundaries are prosody boundaries — mid-clause splits produce audible seams — and chunks are the units of streaming, parallelism, re-rendering, and caching', 'It compresses better', 'Vocoders require it'],
      correct: 1,
      explain: 'Chunks are simultaneously an audio-quality decision (natural pause points) and an engineering decision (cache and re-render granularity).'
    },
    {
      q: 'You upgrade the Piper voice model but forget to bump the version in the cache key. The symptom will be:',
      options: ['Cache misses on everything', 'An immediate crash', 'Old cached chunks in the OLD voice playing next to newly rendered chunks in the NEW voice — a subtle mid-paragraph voice shift', 'Nothing; versions do not affect audio'],
      correct: 2,
      explain: 'Stale-cache bugs are the quiet kind: everything "works," but identical text renders differently depending on when it was first cached. Engine version belongs in the key.'
    }
  ],
  pitfalls: [
    'Choosing the TTS engine from demo clips instead of licenses and latency. XTTS\'s CPML (non-commercial) is the canonical trap: it is the best open cloning demo AND unshippable in a paid product without an arrangement — architecture must keep engines swappable behind one interface precisely because license reality can force the swap.',
    'Mutating the script in place during normalization. The displayed text, the spoken text, the caption text, and the lip-sync timing text must stay linked — normalize into a SEPARATE recorded field, or captions will read "2026-07-17" while the voice says "July seventeenth" and the sync stage times against the wrong string.',
    'Building the cache after quality stabilizes "to keep things simple." Backwards: creators iterate from day one, and every full-script re-render during development is minutes of avoidable GPU time that also trains YOU to dread iteration. The 15-line content-key cache pays for itself the first afternoon.'
  ],
  interview: [
    {
      q: 'Walk me through modern neural TTS architecture and how it guides debugging.',
      a: 'Two stages with a clean contract between them. The front end normalizes text and usually converts it to phonemes. The acoustic model maps that sequence to a mel spectrogram — a time-frequency plan of the speech carrying all performance decisions: duration, pitch contour, stress, pauses. A neural vocoder (HiFi-GAN class in most open engines) renders the spectrogram to waveform, hallucinating the phase and fine texture the lossy mel representation discarded — modern parallel vocoders do this realtime-plus on CPU. The contract makes debugging a decision tree: mispronunciations and wrong pacing trace to the front end or acoustic model (fix normalization, inject phonemes, adjust chunk boundaries — cheap fixes first); metallic or hissy texture with correct performance traces to the vocoder or to sample-rate/re-encoding mishandling downstream. The split also explains capability boundaries: voice identity lives in how the acoustic stage shapes the spectrogram — which is why cloning conditions that stage on a speaker embedding — while the vocoder is voice-agnostic infrastructure.'
    },
    {
      q: 'Your product needs reliable narration, voice cloning, and expressive character voices. One TTS engine or several? Defend the architecture.',
      a: 'Several, behind one interface — because the three requirements optimize different corners and the open-model menu splits along exactly those lines. Reliable narration wants Piper-class engines: CPU-fast, deterministic, MIT-licensed, fixed voices — boring in the best way, and cheap enough to run anywhere including a live path. Cloning wants an XTTS-class zero-shot model — with the immediate caveat that XTTS itself is CPML/non-commercial, so the architecture must treat the cloning engine as a swappable plugin: license reality, not just technical merit, can force replacement, and a paid product needs either an arrangement or a permissively-licensed alternative in that slot. Expressive character work is where Bark-class generative engines shine, off the critical path, where their unpredictability is a feature. The unifying layer is a synth() interface keyed by (engine, voice, settings) with normalization and content-addressed caching wrapped around all engines uniformly — callers pick a capability, not an implementation. This is the same routing philosophy as small-vs-large LLM selection: match the expensive resource to the job, and keep the seam clean enough to re-decide later.'
    },
    {
      q: 'A creator edits one sentence in a 40-sentence script. What happens in a well-built TTS pipeline, and what design decisions made that possible?',
      a: 'One sentence re-renders; 39 hit cache; the final audio reassembles from chunk files. Three decisions upstream made it possible. Deterministic sentence chunking: the script splits on prosodic boundaries the same way every run, so an edit perturbs only its own chunk — a chunker whose boundaries drift between versions would invalidate everything. Content-addressed caching: each chunk\'s audio is stored under a hash of exactly the inputs that determine the waveform — normalized text, voice, engine name AND version, rounded settings — so identity of content, not recency or position, decides reuse. Normalization as a recorded pre-keying step: two raw texts that normalize identically share a key, and the display/spoken text linkage survives for captions and sync. The same edit in a naive pipeline re-renders the full script — minutes of GPU versus seconds. And the pattern generalizes: in Part 5 the pipeline director diffs whole PLANS the same way, skipping every stage whose inputs are content-identical to a previous run — TTS chunk caching is that idea at its smallest, most concrete scale.'
    },
    {
      q: 'Why is text normalization a bigger quality lever in production TTS than model choice, and how would you build the normalization layer?',
      a: 'Because model quality differences are marginal on clean input, while normalization failures are catastrophic on real input — and real input is never clean. Scripts contain dates, currency, times, version numbers, abbreviations, URLs; a model reading "3:05" as "three colon zero five" is a worse user experience than any timbre difference between engines, and it happens on the BEST engine if the string arrives raw. Building it: a deterministic, rule-based pass (regex + lookup tables) covering the high-frequency classes — numbers to words, dates, times, currency, units, known abbreviations — applied BEFORE chunking and caching, producing a recorded spoken-text field alongside the display text rather than mutating in place (captions and lip-sync timing depend on the linkage). Order rules carefully (currency before plain numbers), keep the rules unit-tested with a corpus of real user scripts, and log every expansion so mispronunciation reports map to a rule, not a mystery. Add a per-word creator override (ideally injected at the phoneme layer where the engine supports it) for names and jargon. Rule-based beats an LLM pass here: normalization must be deterministic for cache stability, cheap enough to run on every keystroke preview, and debuggable to a specific rule when it goes wrong.'
    }
  ]
};
