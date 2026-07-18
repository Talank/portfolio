window.LESSONS = window.LESSONS || {};
window.LESSONS['piper-fast-and-private'] = {
  id: 'piper-fast-and-private',
  title: 'Piper: Fast, CPU-Only, MIT — the Everyday Workhorse',
  category: 'Part 1 — The Local Engine Menu',
  timeMin: 35,
  summary: 'Your first real local engine, and the one you will reach for most. Piper is a small VITS-based neural TTS that runs faster than realtime on a plain CPU, ships hundreds of prebuilt voices across dozens of languages, weighs tens of megabytes per voice, and is MIT-licensed so you can ship it in anything. It is not the most expressive engine and it cannot clone a voice — but for "just say this line, reliably, now, offline, for free," nothing beats it. This lesson gets it installed, explains the two-file voice format, drives it from the CLI and from Python, and places it correctly on the menu: the dependable workhorse, never the diva.',
  goals: [
    'Install Piper and a voice, and synthesize a WAV entirely offline',
    'Explain the two-file voice format (.onnx model + .onnx.json config) and why the config must travel with the model',
    'Drive Piper from the CLI (streaming and to file) and from Python, and pick the right one for a job',
    'Read the length_scale / noise_scale / noise_w knobs and know which one changes speed vs expressiveness',
    'Place Piper on the engine menu — its real strengths (speed, license, footprint, reliability) and its real limits (fixed voice, modest expressiveness)'
  ],
  concept: [
    {
      h: 'What Piper is, and why it is the default',
      p: [
        'Piper is a neural text-to-speech engine built on <b>VITS</b> (an end-to-end model that folds the acoustic model and vocoder into one network) and exported to <b>ONNX</b> so it runs through the ONNX Runtime — a fast, dependency-light inference engine that works on plain CPUs. The result is a voice that runs <b>faster than realtime on a laptop with no GPU</b>, in tens of megabytes, generating natural neural speech (not the robotic concatenative kind). It was built for the Home Assistant project — voice on a Raspberry Pi in your house, no cloud — so privacy and low-resource operation are not afterthoughts, they are the design center.',
        'That pedigree is exactly why Piper is the workhorse. It is <b>MIT-licensed</b> (ship it in a commercial product, no strings), it has <b>hundreds of prebuilt voices</b> across dozens of languages at several quality tiers, and it is <b>dependable</b>: the same text makes the same audio, fast, every time, offline. What it does not do is clone voices or emote dramatically — the voice per model is fixed, and expressiveness is modest. So Piper is the tool for the live path, UI voices, long-form narration where consistency matters, and any "reliably say this now" job. The expressive, cloning-capable engines earn their heavier cost elsewhere; Piper earns its place by never being the problem.'
      ]
    },
    {
      h: 'Installing it and getting a voice',
      p: [
        'Two pieces: the engine and a voice. The engine installs with <code>pip install piper-tts</code> (it pulls in onnxruntime). A voice is a pair of files you download once: a <code>.onnx</code> model and a matching <code>.onnx.json</code> config. Voices are named by a clear convention — <code>&lt;language&gt;-&lt;name&gt;-&lt;quality&gt;</code>, e.g. <code>en_US-lessac-medium</code> — where quality is <code>x_low</code>, <code>low</code>, <code>medium</code>, or <code>high</code>, trading size and CPU time for fidelity. You can browse and audition every voice on the Piper "voices" samples page and fetch the two files from the Hugging Face <code>rhasspy/piper-voices</code> repository, or let the newer <code>piper</code> CLI download a voice by name on first use.',
        'The two-file format matters and trips people up: the <code>.onnx.json</code> is not optional metadata, it carries the <b>mel/audio configuration and the phoneme setup</b> the model was trained with — sample rate, phoneme-to-id map, inference defaults. The <code>.onnx</code> without its JSON is unusable, and pairing a model with the wrong JSON produces garbage. So when you vendor a voice into your project, the two files travel together, named as a pair, or your "why is it noise?" debugging session is really a config-mismatch you could have avoided. (This is the same "matched mel dialect" contract from the last lesson, made into two files on disk.)'
      ]
    },
    {
      h: 'Driving it: CLI and Python',
      p: [
        'From the shell, Piper reads text on stdin and writes audio — either to a file or streamed to a player. To a file: <code>echo "All hands on deck." | piper -m en_US-lessac-medium.onnx -f out.wav</code>. This is the shape you will script for batch rendering (Part 3): one process invocation per line, cache the output, move on. Piper can also stream raw audio to stdout for piping into <code>aplay</code>/<code>ffplay</code> for instant playback, which is how you get a live, no-file-on-disk voice on a device.',
        'From Python you load the voice once and reuse it, which matters because loading the model is the expensive part and synthesizing is cheap — so for anything past one line you pay the load cost a single time and then stream lines through it. The Python path also gives you the knobs as parameters (below) and lets you write directly into an open file handle or grab raw samples for your own mixing. The rule of thumb: <b>CLI for quick one-offs and shell pipelines; Python when you are rendering many lines, tuning knobs per line, or integrating into an app</b> — which is everything the capstone does.'
      ]
    },
    {
      h: 'The knobs: speed vs expressiveness',
      p: [
        'Piper exposes three inference knobs, and knowing which does what saves you from turning the wrong one. <b><code>length_scale</code></b> controls speaking rate by stretching or compressing duration: greater than 1 is slower, less than 1 is faster (it literally scales the predicted phoneme durations). This is your "make it slower/faster" dial. <b><code>noise_scale</code></b> and <b><code>noise_w</code></b> control the <i>variation</i> in the generated speech — how much the model deviates from its most-likely rendering in the acoustic detail and in the phoneme durations respectively. Turn them up and the voice is more varied and lively but less predictable; turn them down and it is flatter but more consistent take-to-take.',
        'The practical mapping to this course\'s craft: <code>length_scale</code> is how you pace narration (a touch slower for teaching, faster for an excited line), and the noise knobs are a crude expressiveness lever — but note they add <i>randomness</i>, not <i>emotion</i>. Piper cannot be told "sound afraid"; the way you get Nami\'s fear vs excitement out of a Piper-class engine is by scripting the prosody around it — rate via <code>length_scale</code>, and the phrasing/punctuation of the text itself — which is exactly the technique Part 2 builds. Piper gives you speed and reliability and a rate dial; the emotion craft is yours to script on top.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky Builds the Ship\'s Announcement Horn',
      text: [
        'The Sunny needs a voice — deck announcements, docking calls, the daily "lunch is ready" that Luffy will ignore. Franky, asked to build it, does not reach for anything exotic. "SUPER simple brief," he says, cracking his knuckles. "It has to work every single time, the instant you hit it. It cannot need the Log Pose signal" — no cloud — "because we announce lunch in the middle of the Grand Line with no port in range. It has to be light enough to bolt onto a snail-sized board and cheap enough that I can put one on every deck." So he builds a small, rugged horn: fixed voice, no drama, but it speaks the second you press it, never stutters, never phones the mainland, and sips power.',
        'Nami asks if he can make it sound <i>excited</i> for the treasure-sighted call. "Not the horn itself," Franky admits. "The horn says exactly what you feed it, at the speed you set the gearing. You want excited? Feed it a shorter, punchier line and spin the gearing faster. The DRAMA is in what you write and how fast you play it, not in the box." Usopp, predictably, wants the fancy imported model that can imitate any voice and weep on command. Franky shrugs. "Sure, for the once-a-year festival. But you do not put the diva on the lunch bell. The lunch bell has to ring ten thousand times and never once fail. THAT is this horn\'s whole job — and it is SUPER good at exactly that job."'
      ]
    },
    sitcom: {
      show: 'Friends',
      title: 'Chandler\'s Reliable Answering Machine',
      text: 'Joey wants to replace the apartment\'s plain answering-machine greeting with a dramatic, ever-changing performance. Chandler resists. "Could this greeting BE any more over-engineered? It has to do one thing: tell people we\'re not home, clearly, every time someone calls, without breaking." Joey protests that it\'s boring. "It\'s boring the way a light switch is boring," Chandler says. "You want boring on the thing that runs a thousand times. Save the performance for the outgoing message you record once for your audition tape — that\'s where drama earns its keep. The machine that answers at 3 a.m. when my mother calls needs to be the most reliable, least surprising object in this apartment." Joey considers this. "So... the fancy voice for the big moment, and the plain one for the everyday." "Now you understand infrastructure," says Chandler, "which is a sentence I never expected to say to you."'
    },
    why: 'Franky\'s announcement horn and Chandler\'s answering machine are Piper exactly: fixed voice, no drama, but instant, offline, light, cheap, and utterly reliable — the right tool for the job that runs ten thousand times and must never fail. Both stories also teach the two limits and how to work around them: the voice is fixed and unemotional (so you don\'t ask the box to emote — you script excitement by writing a punchier line and playing it faster, which is Piper\'s length_scale plus Part 2\'s prosody craft), and the diva/cloning engine is a legitimate but SEPARATE tool reserved for the once-a-year festival, never bolted onto the lunch bell.'
  },
  tech: [
    {
      q: 'Why is Piper fast enough to beat realtime on a CPU when the "big" TTS models need a GPU?',
      a: 'Three compounding reasons. First, architecture: Piper uses VITS, an end-to-end model that predicts the waveform in essentially one parallel pass (no slow autoregressive sample-by-sample generation, and no separate heavy vocoder network to run afterward), so there is far less sequential computation per second of audio. Second, model size: Piper voices are small — a "medium" voice is tens of MB, versus multi-gigabyte expressive models — because they target a single speaker and modest expressiveness rather than zero-shot cloning across every voice and language, so there are simply fewer numbers to multiply. Third, runtime: it runs through ONNX Runtime, a heavily optimized inference engine with efficient CPU kernels, rather than a research training framework. The combination means a laptop CPU can generate speech several times faster than it plays, which is what makes a live, local, no-GPU voice practical. The tradeoff you are buying that speed with is exactly the expressiveness and cloning you gave up — which is the whole point of having other engines on the menu.'
    },
    {
      q: 'What actually lives in the .onnx.json, and what goes wrong if it is missing or mismatched?',
      a: 'The JSON is the voice\'s configuration contract: the audio sample rate the model outputs, the phoneme set and the phoneme→id map the model was trained with (so text gets converted to exactly the integer sequence the model expects), inference defaults like length_scale/noise_scale, and dataset/quality metadata. Miss it and the CLI cannot even set up the input encoding correctly; mismatch it (say, pair a 22.05 kHz model with a JSON claiming a different rate or a different phoneme map) and you get audio played at the wrong speed/pitch or outright noise, because the text is being encoded to ids the model never learned. This is the two-file-format footgun: the .onnx is the weights, the .onnx.json is how to talk to them, and they are a matched pair by design. The operational rule is to treat the pair as one atomic artifact — vendor them together, name them identically, checksum both — so "the voice broke" can never be "someone updated the model but not its config."'
    },
    {
      q: 'Piper can\'t be told "sound excited." So how do you get expressive, varied narration out of it?',
      a: 'You move the expressiveness out of the model and into the pipeline, which is a skill that transfers to every fixed-voice engine. Three levers. (1) Rate: length_scale per line — a slower stretch for gravitas or teaching, a faster one for excitement or urgency — is a real, controllable prosodic cue the model honors. (2) The text itself: punctuation is prosody. Short sentences read punchy; a comma inserts a beat; an em-dash or ellipsis changes phrasing; question marks lift the intonation. Rewriting a flat line into a well-punctuated one changes the delivery without any model support. (3) Voice selection: cast different Piper voices for different characters or moods (Part 2\'s casting), since each voice has its own baseline timbre and energy. The noise_scale/noise_w knobs add variation but it is randomness, not directed emotion, so they are a garnish, not the mechanism. The honest limit: for a line that must genuinely emote — a real fearful tremble — you either script hard around it or reach for an expressive engine (XTTS, Bark) for that specific line. Knowing when to script vs when to switch engines is the craft.'
    }
  ],
  code: {
    title: 'Piper from the CLI and from Python',
    intro: 'The two shapes you will actually use. Both run entirely on your machine after the one-time voice download — pull your network cable and they still work.',
    code: `# ---- Install (one time) ---------------------------------------------
# pip install piper-tts
# Download a voice pair (model + its json) from rhasspy/piper-voices,
# or let the CLI fetch by name on first use.

# ---- CLI: to a file (the batch-render shape) ------------------------
#   echo "All hands on deck." | piper \\
#       -m en_US-lessac-medium.onnx -f out.wav
#
# ---- CLI: stream to the speakers (instant, no file) -----------------
#   echo "Lunch is ready." | piper -m en_US-lessac-medium.onnx \\
#       --output-raw | aplay -r 22050 -f S16_LE -t raw -

# ---- Python: load once, synthesize many (the app shape) -------------
import wave
from piper import PiperVoice

voice = PiperVoice.load("en_US-lessac-medium.onnx")   # pays load cost ONCE

def say(text, path, length_scale=1.0):
    # length_scale > 1 slower, < 1 faster. This is your pacing dial.
    with wave.open(path, "wb") as wav:
        voice.synthesize(text, wav, length_scale=length_scale)

say("Two pointers walk toward each other.", "line1.wav")
say("Wait... every single pair? That's too slow!", "fear.wav", length_scale=1.06)  # a hair slower = tense
say("There it is! One pass and done!",           "win.wav",  length_scale=0.94)  # a hair faster = excited`,
    notes: [
      'Load the voice once, synthesize many — loading the ONNX model is the costly step; per-line synthesis is cheap. Re-loading per line is the #1 reason a batch render is inexplicably slow.',
      'length_scale is the one knob that maps to a clean human intention ("slower"/"faster"). noise_scale/noise_w add variation but it is randomness, not emotion — leave them near defaults unless a voice sounds too flat or too jittery.'
    ]
  },
  lab: {
    title: 'A Piper voice-pair loader and knob validator',
    prompt: 'Piper voices are two files that must travel as a pair, and its knobs have valid ranges. Write two functions. (1) <code>voice_pair(model_path)</code>: given a path ending in <code>.onnx</code>, return the tuple <code>(model_path, config_path)</code> where config is the same path plus <code>.json</code> (so <code>"en_US-lessac-medium.onnx"</code> → <code>(".../...onnx", ".../...onnx.json")</code>). If <code>model_path</code> does not end in <code>.onnx</code>, raise <code>ValueError</code>. (2) <code>clamp_knobs(length_scale, noise_scale, noise_w)</code>: return a dict clamping each into its sane range — <code>length_scale</code> to [0.5, 2.0], <code>noise_scale</code> to [0.0, 1.0], <code>noise_w</code> to [0.0, 1.0] — rounding each to 3 decimals. Values inside range pass through (rounded); values outside are pulled to the nearest bound.',
    starter: `def voice_pair(model_path):
    # ".onnx" -> (model, model + ".json"); else ValueError
    pass

def clamp_knobs(length_scale, noise_scale, noise_w):
    # clamp to ranges, round to 3 decimals, return a dict
    pass`,
    checks: [
      { re: 'def\\s+voice_pair\\s*\\(', flags: '', must: true, hint: 'Define voice_pair(model_path).', pass: 'voice_pair defined ✓' },
      { re: 'def\\s+clamp_knobs\\s*\\(', flags: '', must: true, hint: 'Define clamp_knobs(length_scale, noise_scale, noise_w).', pass: 'clamp_knobs defined ✓' },
      { re: 'raise\\s+ValueError', flags: '', must: true, hint: 'Raise ValueError when the path does not end in .onnx.', pass: 'ValueError raised ✓' },
      { re: 'endswith', flags: '', must: true, hint: 'Use .endswith(".onnx") to validate the model path.', pass: 'suffix checked ✓' }
    ],
    tests: `m, c = voice_pair("voices/en_US-lessac-medium.onnx")
assert m == "voices/en_US-lessac-medium.onnx"
assert c == "voices/en_US-lessac-medium.onnx.json"
try:
    voice_pair("voices/en_US-lessac-medium.txt"); assert False, "should reject non-onnx"
except ValueError:
    pass
k = clamp_knobs(1.0, 0.667, 0.8)
assert k == {"length_scale": 1.0, "noise_scale": 0.667, "noise_w": 0.8}, k
assert clamp_knobs(5.0, -1.0, 2.0) == {"length_scale": 2.0, "noise_scale": 0.0, "noise_w": 1.0}
assert clamp_knobs(0.1, 0.5, 0.5)["length_scale"] == 0.5
print("piper pair + knobs correct")`,
    solution: `def voice_pair(model_path):
    if not model_path.endswith(".onnx"):
        raise ValueError("Piper model must be a .onnx file: " + model_path)
    return (model_path, model_path + ".json")

def clamp_knobs(length_scale, noise_scale, noise_w):
    def clamp(v, lo, hi):
        return round(min(hi, max(lo, v)), 3)
    return {
        "length_scale": clamp(length_scale, 0.5, 2.0),
        "noise_scale": clamp(noise_scale, 0.0, 1.0),
        "noise_w": clamp(noise_w, 0.0, 1.0),
    }`,
    notes: [
      'voice_pair encodes the two-file contract as code: you literally cannot ask for a model without also naming its config, which is how you avoid the "updated the .onnx, forgot the .json" mismatch.',
      'Clamping knobs before handing them to any engine is a good habit — a stray length_scale of 5.0 (from a slider bug or a bad config) produces bizarre output; a clamp turns a mystery into a bounded, predictable result.'
    ]
  },
  deepDive: {
    timeMin: 10,
    intro: 'One level down: what VITS folds together that older two-stage pipelines kept separate, and why "end-to-end" is what makes Piper both fast and simple to ship.',
    sections: [
      {
        h: 'VITS: one network where others used two',
        p: 'The last lesson framed TTS as acoustic-model → mel → vocoder, two networks with a mel interface. VITS (Variational Inference with adversarial learning for end-to-end TTS) collapses that into a single model trained end-to-end: it learns to go from phonemes to waveform directly, using a variational latent space in the middle instead of an explicit hand-designed mel hand-off, plus adversarial training (like a GAN vocoder) for waveform realism and a learned alignment so it figures out phoneme durations on its own. Practically, the two-stage mental model still holds for debugging — there is still a "planning" role and a "rendering" role inside the network — but at inference time it is one forward pass, which is a big part of why Piper is fast (no separate vocoder network to run, less sequential work) and why a voice is a single .onnx file rather than a matched model+vocoder pair. The mel-config contract from last lesson still exists, just baked into that one file\'s JSON instead of split across two checkpoints. End-to-end is not only a quality story; it is a deployment-simplicity story, and for a workhorse engine simplicity is a feature.'
      },
      {
        h: 'Quality tiers and the size/speed/fidelity triangle',
        p: 'Piper voices come in x_low, low, medium, and high tiers, and the tier is not just "how good" — it is a specific point on a triangle of model size, CPU time, and audio fidelity, and the right choice is workload-dependent. x_low/low run on the weakest hardware (a Raspberry Pi, an embedded board) and at the lowest latency, at the cost of some naturalness — correct for a device that must respond instantly and has no GPU and little RAM. medium is the sensible default for a laptop or server: clearly natural, still faster than realtime, modest footprint. high squeezes out the most fidelity per voice but costs more compute and disk, worth it for long-form narration a listener will sit through where quality compounds. The engineering point is that "which Piper voice" is really two orthogonal choices — which speaker (timbre/language) and which tier (the triangle) — and conflating them leads to shipping a high-tier voice on an embedded target that then stutters, or an x_low voice on a narration product that then sounds cheap. Decide the tier from the hardware and the listening context, then pick the speaker within it.'
      }
    ]
  },
  quiz: [
    {
      q: 'Piper\'s place on the engine menu is best described as:',
      options: ['The most expressive, dramatic voice for hero moments', 'The dependable workhorse — fast on CPU, tiny, MIT-licensed, offline, fixed voice, modest expressiveness', 'The voice-cloning engine', 'A cloud API with a local wrapper'],
      correct: 1,
      explain: 'Piper is the reliable everyday engine: faster-than-realtime on CPU, small, permissively licensed, offline — at the cost of a fixed voice and modest expressiveness.'
    },
    {
      q: 'A Piper voice consists of:',
      options: ['A single .onnx file', 'A .onnx model AND a matching .onnx.json config, which must travel together', 'A .wav sample and a text file', 'Only the .onnx.json'],
      correct: 1,
      explain: 'The .onnx holds the weights; the .onnx.json holds the sample rate, phoneme map, and inference defaults needed to use them. Mismatch or miss the JSON and you get garbage.'
    },
    {
      q: 'To make a Piper line slower for gravitas, you change:',
      options: ['noise_scale', 'length_scale (>1 slower, <1 faster)', 'the sample rate', 'noise_w'],
      correct: 1,
      explain: 'length_scale is the rate dial — it scales predicted phoneme durations. noise_scale/noise_w add variation (randomness), not pacing.'
    },
    {
      q: 'Loading the Piper voice once and synthesizing many lines matters because:',
      options: ['It changes the voice quality', 'Loading the ONNX model is the expensive step; per-line synthesis is cheap — reloading per line makes batch renders needlessly slow', 'It is required for offline use', 'It enables cloning'],
      correct: 1,
      explain: 'Model load dominates cost; synthesis is fast. Load once, stream many lines through it — reloading each line is the classic batch-render slowdown.'
    },
    {
      q: 'You need Nami to sound afraid, but Piper can\'t be told "sound afraid." The right move is:',
      options: ['Give up on emotion with Piper', 'Script the prosody: slightly slower/tenser rate via length_scale, punchier punctuation, voice choice — or switch to an expressive engine for that specific line', 'Turn noise_scale to maximum', 'Re-download the voice'],
      correct: 1,
      explain: 'Fixed-voice engines get emotion from the pipeline: rate, punctuation, and casting. noise knobs add randomness, not directed emotion. For a line that must truly emote, script hard or switch engines.'
    }
  ],
  pitfalls: [
    'Shipping the .onnx without its .onnx.json, or updating one and not the other. They are a matched pair (weights + how to use them); a mismatch produces wrong-speed audio or noise. Treat the pair as one atomic artifact.',
    'Reloading the voice model on every line in a batch render. Load once, reuse — model load is the expensive part; synthesis is cheap. This single mistake can make a render 10× slower.',
    'Expecting Piper to emote on command. It has a fixed voice and a rate knob; directed emotion comes from scripting prosody (rate, punctuation, casting) or from reaching for an expressive engine for the lines that truly need it.'
  ],
  interview: [
    {
      q: 'When would you choose Piper over a more expressive engine like XTTS, and when not?',
      a: 'I choose Piper whenever the job is "say this reliably" rather than "perform this." Concretely: the live/low-latency path (it beats realtime on CPU, no GPU needed), UI and notification voices, long-form narration where consistency across many lines matters more than per-line drama, embedded or offline devices where footprint and no-network operation are hard requirements, and anything shipping commercially where its MIT license removes legal friction. It is also the right default for high-volume batch work because it is free and fast per line. I do NOT choose Piper when the requirement is genuine expressiveness or voice cloning — a line that must convey a specific emotion the text can\'t carry, or that must sound like a particular person — because Piper has a fixed voice and only modest, undirected variation. The professional pattern is to make Piper the default engine behind a common interface and route only the lines that truly need expressiveness or cloning to a heavier engine, so you pay the cost of the diva only where it earns its keep, and everything else gets the fast, reliable, free workhorse.'
    },
    {
      q: 'Explain the two-file Piper voice format and the class of bug it causes.',
      a: 'A Piper voice is a .onnx model file plus a matching .onnx.json config. The .onnx is the trained weights; the .onnx.json is the contract for using them — output sample rate, the phoneme set and phoneme→id map so text is encoded to exactly the integer sequence the model expects, and inference defaults like length_scale. The two are a matched pair by construction. The bug class is config mismatch: ship or vendor the model without its JSON and the engine can\'t set up the input encoding at all; pair a model with the wrong or stale JSON — for instance after updating one file but not the other — and you get audio at the wrong speed or pitch, or outright noise, because the text is being turned into phoneme ids the model never learned, or the samples are being played at a rate the model didn\'t produce. The fix is operational: treat the pair as one atomic artifact — vendor them together, name them identically, checksum both, version them as a unit — so "the voice broke" can never decompose into "someone touched one file of the pair." It\'s the same matched-configuration principle as not mixing an acoustic model with a foreign vocoder, expressed as two files on disk.'
    },
    {
      q: 'Piper runs faster than realtime on a CPU while big expressive models need GPUs. What lets it, and what does that speed cost?',
      a: 'Three compounding factors. Architecture: Piper is VITS, an end-to-end model that produces the waveform in essentially one parallel forward pass — no slow autoregressive sample-by-sample decoding and no separate heavy vocoder network to run afterward — so there is far less sequential compute per second of audio. Size: the voices are small (tens of MB) because they target a single speaker and modest expressiveness rather than cloning every voice across every language, so there are simply fewer parameters to evaluate. Runtime: it executes through ONNX Runtime, a production inference engine with optimized CPU kernels, not a research training framework. Together those let a laptop generate speech several times faster than it plays, which is what makes a live, local, no-GPU voice practical. The cost is exactly the capability you removed to get there: a fixed voice and only mild, undirected expressiveness, with no cloning. That is not a flaw, it\'s the deliberate trade — and it is why an engine menu exists, so you can spend GPU and license complexity on expressiveness only where a job actually demands it.'
    }
  ]
};
