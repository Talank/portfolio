window.LESSONS = window.LESSONS || {};
window.LESSONS['why-local-and-private'] = {
  id: 'why-local-and-private',
  title: 'Why Local: Free, Offline & Nothing Leaves the Box',
  category: 'Part 0 — Why Local Voice',
  timeMin: 30,
  summary: 'The narration you already heard — Luffy laughing, Nami dreading the brute-force trap, every crew member in their own voice — was made with a cloud service (edge-tts) that sounds wonderful and quietly ships every single line you synthesize to a company\'s servers. That is the whole reason this course exists. This lesson makes the case for the local rebuild along four axes you will feel in production: privacy (your script is data, and cloud TTS is a data-egress hole), cost (free forever vs per-character billing), availability (works on a plane, in a SCIF, during an outage), and reproducibility (the same input makes the same bytes, this year and next). Then the honest counter-case — what you give up going local — so the choice is engineering, not ideology.',
  goals: [
    'State the privacy threat model of cloud TTS precisely: what leaves your machine, to whom, and why "it\'s just text-to-speech" understates it',
    'Weigh local vs cloud on four axes — privacy, cost, availability, reproducibility — and name what local costs you in return',
    'Recognize when a script is sensitive data (names, medical, legal, unreleased, personal) and route it to a local engine by policy, not by mood',
    'Explain why "robotic" is a solved problem locally now — modern open models, not the cloud, are what ended the robot voice',
    'Frame the rest of the course: reproduce the exact character-voiced result offline'
  ],
  concept: [
    {
      h: 'The thing nobody says out loud: your script is data',
      p: [
        'When you call a cloud TTS API — edge-tts, ElevenLabs, Google, Azure, OpenAI — you send it <b>the exact words you want spoken</b>. That is the payload. It travels over the network, is processed on machines you do not control, and is subject to that provider\'s logging, retention, training, subpoena, and breach exposure. For a weather bot reading public forecasts, who cares. But the moment the text is a patient\'s discharge summary, an unreleased script, a kid\'s name in a bedtime app, a legal deposition, an internal all-hands, or a therapy journal, you have just handed a stranger a plaintext copy of your most sensitive content — not metadata, the actual words. "It\'s only text-to-speech" is how that ships to production unexamined.',
        'edge-tts is the sharpest version of the trap because it is <b>free and excellent</b>. It uses Microsoft\'s neural voices via the same endpoint Edge\'s Read Aloud uses, at no cost, with no API key. That is exactly why it is seductive and exactly why it is dangerous: nothing about the price or the quality warns you that every line is a POST request to <code>speech.platform.bing.com</code>. Free removed the billing friction that would have made you think; great removed the quality reason to look elsewhere. The only thing left to notice is the packet — and packets are invisible unless you go looking (you will, in Part 4).'
      ]
    },
    {
      h: 'Four axes where local wins',
      p: [
        '<b>Privacy.</b> Local synthesis is a function call, not a network request. The text goes from your Python process to a model in your RAM to a WAV on your disk. Nothing to log, retain, train on, subpoena, or leak, because nothing left. This is the axis that turns "nice to have" into "required" — regulated data (HIPAA, GDPR special categories, attorney-client, export-controlled) frequently <i>cannot</i> lawfully go to a third party without contracts and controls you don\'t have, and "we sent the words to a free voice API" is a finding, not a footnote.',
        '<b>Cost.</b> Cloud TTS bills per character or per second. A book, a course, a game with thousands of lines, or anything you re-render while iterating turns into a real invoice — and re-rendering is constant when you\'re tuning voices (you did it in this very project). Local is a one-time model download and then free forever, including the thousandth re-render. <b>Availability.</b> Local works with the Wi-Fi off — on a plane, in an airgapped lab, in a region the API doesn\'t serve, during the provider\'s outage, after they deprecate the model you depend on. Your pipeline\'s uptime stops being someone else\'s SLA. <b>Reproducibility.</b> A pinned local model + pinned settings makes the same bytes every run; a cloud voice can change under you silently (a "quality improvement" ships and your back catalog no longer matches new renders). For an archive, a test suite, or a cache, deterministic output is not a luxury — it is the difference between a cache that works and one that mysteriously drifts.'
      ]
    },
    {
      h: 'The honest counter-case: what local costs you',
      p: [
        'This is not a sermon; local has real downsides and pretending otherwise makes you choose badly. You trade a one-line API call for <b>setup</b>: installing engines, downloading model files (tens of MB for Piper, ~2 GB for XTTS), and occasionally fighting Python/CUDA/ONNX dependency knots. You trade someone else\'s datacenter GPUs for <b>your hardware</b>: the biggest, most expressive open models want a GPU to run at comfortable speed, and the very top of cloud quality (the best commercial cloning voices) can still edge out the best open models on a golden-ears A/B. You take on <b>maintenance</b>: you patch the engines, you manage the disk the models live on, you own the failures.',
        'So the decision is a routing decision, not a religion. Public, non-sensitive, low-volume, "I need one line right now on a machine with no GPU" — a cloud call is a legitimate, pragmatic choice. Sensitive, high-volume, offline-required, must-be-reproducible, or simply "this text is nobody else\'s business" — local, every time. The mature architecture (the whole back half of this course) keeps both behind one interface so the routing is a policy flag, not a rewrite. You are not learning local because cloud is evil; you are learning local because a professional can pick, and most people can only reach for the cloud.'
      ]
    },
    {
      h: '"Robotic" was solved by open models, not by the cloud',
      p: [
        'It is worth killing a myth up front: the reason old local TTS (eSpeak, Festival, the 2005 GPS voice) sounded robotic was not that it ran locally — it is that it used concatenative or formant synthesis, gluing recorded fragments or shaping vowels with filters. The neural revolution (Tacotron, VITS, and descendants) replaced that with models that <i>generate</i> natural prosody, and those models are open and run on your machine. Piper, XTTS, Kokoro, StyleTTS2, Bark — the engines this course is built on — are the same class of technology behind the cloud voices, distributed as files you can download. Local no longer means robotic. It means the identical neural quality, minus the network.',
        'That reframes the whole endeavor. The One Piece episodes did not sound good <i>because</i> they used a cloud service; they sounded good because they used a good neural voice and tuned its prosody and emotion per line. Every one of those techniques — the character casting, Nami\'s fear-vs-excitement, Luffy\'s laugh, the normalization, the caching — is engine-agnostic. Swap the cloud engine for a local one and the craft transfers wholesale. That swap, and that craft, is the rest of this course.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Den Den Mushi Hears Everything',
      text: [
        'Nami needs to send the crew\'s route to a contact in the next town, and reaches for the Den Den Mushi — the transponder snail that carries a voice across the sea. Robin stops her hand. "That snail does not carry your voice TO him," she says quietly. "It carries your voice through every relay snail between here and there. Baroque Works owns half of them. You would be reading our heading aloud into a room full of agents and trusting that none of them writes it down." She is describing the whole problem in one breath: the convenience of the snail is that someone else\'s network moves your words — which is also exactly why your words are now in someone else\'s network.',
        'So they split the traffic by sensitivity, the way the crew always should have. The harbor festival schedule, the public stuff nobody could exploit? Fine, shout it down the snail — speed and reach are worth it and there is nothing to protect. But the actual route, the map, the names of who is meeting whom? Nami writes those in the ship\'s own logbook, in her own hand, and it never leaves the Sunny. "The rule is not \'snails are evil,\'" Robin adds. "The Den Den Mushi is wonderful. The rule is: know which words can survive being overheard, and keep the rest on the ship." Luffy, who has understood exactly none of the technical part, nods sagely: "So the secret stuff stays where I can eat next to it. Got it."'
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon Will Not Dictate Into the Cloud',
      text: 'Leonard finds Sheldon hand-typing his research notes into a machine that is visibly not connected to anything. "There\'s a dictation app that\'s a hundred times faster," Leonard offers. "It sends your audio to a server, transcribes it, and — " "Stop," says Sheldon. "You have described handing my unpublished results to an unnamed corporation, its subcontractors, its lawyers, and whoever eventually breaches it, in exchange for saving me forty minutes." He is, obnoxiously, correct. Leonard tries the practical angle: "It\'s free." "The word \'free,\'" Sheldon replies, "is doing a spectacular amount of concealing there. It is free of dollars. It is extremely expensive in custody of my ideas — a currency you apparently spend without noticing." He turns back to his airgapped machine. "When the transcription runs on THIS box, the price is honest: some setup, and my secrets stay mine. I will take that trade every time it is offered, which is why I set it up so it is always offered."'
    },
    why: 'Robin\'s relay snails and Sheldon\'s airgap are the exact threat model of cloud TTS: the convenience is that someone else\'s network moves your words, which is identical to saying your words are now in someone else\'s network. Both stories land the two rules the lesson teaches — (1) route by sensitivity, not by habit (the festival schedule down the snail, the route in the logbook); and (2) "free" hides the real price, which is custody of your content, not dollars. And Luffy\'s cheerful "the secret stuff stays where I can eat next to it" is, stripped of the meat, the definition of local: the data stays on the box you control.'
  },
  tech: [
    {
      q: 'Concretely, what does edge-tts send over the network, and to where — and how is that different from a "real" local engine?',
      a: 'edge-tts opens a WebSocket to a Microsoft endpoint (historically <code>speech.platform.bing.com/consumer/speech/synthesize/…</code>), sends an SSML document containing your literal text plus the voice/rate/pitch settings, and streams back MP3 audio chunks. So the payload that leaves your machine is: the exact words, the chosen voice, and the prosody knobs — everything meaningful. A truly local engine (Piper, XTTS) does none of that: after the one-time model-file download, synthesis is a pure in-process computation — text in, tensor math, WAV out — with no socket opened at synthesis time. The tell is testable (Part 4): pull your network cable and try to synthesize. edge-tts fails instantly; Piper does not notice. That single experiment is the whole distinction made physical, and it is why "runs locally" has to mean "synthesizes with the network unplugged," not "I installed it locally but it still calls home."'
    },
    {
      q: 'If the audio output is the same either way, why does it matter that the TEXT was sent? The listener hears identical speech.',
      a: 'Because the sensitive asset is the input, not the output. The waveform is a thing you were going to publish or play anyway; the script is the private content — the patient name, the plot twist, the client\'s legal position — and cloud TTS requires you to transmit that private input to a third party as the price of synthesis. Retention makes it worse: many providers log requests for abuse-monitoring or model-improvement, so the text can persist on their side long after your job finishes, reachable by their staff, their process, their breaches, and sometimes their training pipeline. "The listener hears the same thing" conflates the published output with the confidential input. Security is about the input\'s journey. Local keeps that journey inside your process; cloud puts it on the wire.'
    },
    {
      q: 'Is a paid cloud provider with a "we don\'t train on your data / zero-retention" enterprise contract just as private as local?',
      a: 'It is much better than the free consumer endpoint, and for many organizations it is genuinely sufficient — a signed DPA, zero-retention, and a compliance certification can make cloud lawful and reasonable. But "as private as local" it is not, and pretending so is a category error. With local, the private property "the data never left our control" is enforced by physics — there is no packet to intercept, no counterparty to trust, no contract to be violated or renegotiated, no breach of theirs that can touch you. With cloud, that property is enforced by a promise and an audit, which are real but are trust, not proof. The honest framing: enterprise cloud reduces the risk to "trust this specific vendor\'s controls"; local reduces it to zero-by-construction. Which you need depends on the data — and knowing that difference exists is the point.'
    }
  ],
  code: {
    title: 'The same job, two custody models',
    intro: 'Sketch of the identical task — turn one line into a WAV — via a cloud call versus a local engine. Read it for the SHAPE: where the text goes. (Both are illustrative; you install the real engines in Part 1.)',
    code: `# ---- Cloud path: convenient, and your text goes on the wire ----------
import edge_tts, asyncio          # free, no key, excellent voices
async def cloud_say(text, out):
    # This opens a WebSocket to Microsoft and sends 'text' verbatim.
    c = edge_tts.Communicate(text, "en-US-JennyNeural")
    await c.save(out)             # <-- the words left your machine to get here
# asyncio.run(cloud_say("Patient Jane Doe, discharge summary...", "out.mp3"))

# ---- Local path: a function call, nothing leaves the box -------------
from piper import PiperVoice      # after a one-time model-file download
voice = PiperVoice.load("en_US-lessac-medium.onnx")
def local_say(text, out):
    with open(out, "wb") as f:
        voice.synthesize(text, f)  # text -> model in RAM -> WAV on disk
# local_say("Patient Jane Doe, discharge summary...", "out.wav")  # offline

# The two functions have the SAME signature and (nearly) the same audio.
# The only difference is the one that does not show up in the output:
# cloud_say transmits the input; local_say does not. That invisible
# difference is the entire subject of this course.`,
    notes: [
      'Same interface, same result, opposite custody. Designing your app so the two are swappable behind one function (Part 3) is what lets "cloud or local?" be a per-call policy decision instead of a rewrite.',
      'Notice there is no place in local_say for a "we won\'t log your text" promise to live — because there is no recipient to make one. Absence of a counterparty is the security property.'
    ]
  },
  lab: {
    title: 'A sensitivity router: decide local-vs-cloud by policy',
    prompt: 'Real pipelines route text to an engine by <b>data sensitivity</b>, not by mood. Write <code>route_engine(text, allow_cloud)</code> that returns <code>"local"</code> or <code>"cloud"</code>. Rules, in order: (1) if <code>allow_cloud</code> is False, always return <code>"local"</code> (an offline or locked-down environment). (2) If the text looks <b>sensitive</b>, return <code>"local"</code> even when cloud is allowed. Treat text as sensitive if it contains any of the case-insensitive markers <code>patient</code>, <code>ssn</code>, <code>password</code>, <code>confidential</code>, <code>diagnosis</code>, OR if it contains a 9-consecutive-digit run (a bare SSN-shaped number). (3) Otherwise return <code>"cloud"</code>. Also write <code>redact_preview(text)</code> that returns the text with every run of 4+ consecutive digits replaced by <code>"[redacted]"</code>, so you can log a request without logging the secret number.',
    starter: `import re

SENSITIVE_MARKERS = ["patient", "ssn", "password", "confidential", "diagnosis"]

def route_engine(text, allow_cloud):
    # 1) no cloud allowed -> local
    # 2) sensitive text -> local
    # 3) otherwise -> cloud
    pass

def redact_preview(text):
    # replace any run of 4+ digits with "[redacted]"
    pass`,
    checks: [
      { re: 'def\\s+route_engine\\s*\\(', flags: '', must: true, hint: 'Define route_engine(text, allow_cloud).', pass: 'route_engine defined ✓' },
      { re: 'def\\s+redact_preview\\s*\\(', flags: '', must: true, hint: 'Define redact_preview(text).', pass: 'redact_preview defined ✓' },
      { re: 'lower\\s*\\(', flags: '', must: true, hint: 'Marker matching must be case-insensitive — lowercase the text.', pass: 'case-insensitive check ✓' },
      { re: '\\\\d', flags: '', must: true, hint: 'Use a digit pattern (\\\\d) to catch SSN-shaped numbers.', pass: 'digit pattern used ✓' }
    ],
    tests: `assert route_engine("Read the public weather forecast", True) == "cloud"
assert route_engine("Read the public weather forecast", False) == "local"
assert route_engine("Patient Jane Doe follow-up", True) == "local"
assert route_engine("the PASSWORD is hunter2", True) == "local"
assert route_engine("call me at 123456789 today", True) == "local", "9-digit run is sensitive"
assert route_engine("meeting at 3pm in room 12", True) == "cloud", "short numbers are fine"
assert redact_preview("SSN 123456789 on file") == "SSN [redacted] on file"
assert redact_preview("room 12, floor 3") == "room 12, floor 3", "short numbers survive"
assert redact_preview("codes 1234 and 567890") == "codes [redacted] and [redacted]"
print("sensitivity router correct")`,
    solution: `import re

SENSITIVE_MARKERS = ["patient", "ssn", "password", "confidential", "diagnosis"]

def route_engine(text, allow_cloud):
    if not allow_cloud:
        return "local"
    low = text.lower()
    if any(m in low for m in SENSITIVE_MARKERS):
        return "local"
    if re.search(r"\\d{9,}", text):
        return "local"
    return "cloud"

def redact_preview(text):
    return re.sub(r"\\d{4,}", "[redacted]", text)`,
    notes: [
      'This is a teaching toy — real PII detection is much harder (formatted SSNs "123-45-6789", names, addresses) — but the ARCHITECTURE is exactly right: a deterministic gate that defaults sensitive traffic to local, and an offline flag that forces local unconditionally.',
      'The "4+ digit" redaction vs "9+ digit" routing threshold is deliberate: you route conservatively (only clearly SSN-shaped numbers force local) but redact aggressively (any longish number is hidden in logs). Logging policy and routing policy are allowed to differ.'
    ]
  },
  deepDive: {
    timeMin: 10,
    intro: 'One level down: why "free" cloud AI is a data-acquisition strategy, and how to think about the sensitivity of a script the way a security engineer does.',
    sections: [
      {
        h: 'Free is a business model, and the product is often you',
        p: 'When a capable service costs nothing, ask what the provider gets, because inference is not free to run — someone is paying for those GPUs. Sometimes the answer is benign (a loss-leader to pull you toward a paid tier, or a genuine public good). Often the answer is data and mindshare: your requests improve their models, your usage entrenches their platform, your content trains the next version, or the free tier is simply a funnel. None of this is necessarily sinister, but it means the incentives around your text point toward "retain and use it," not "discard it immediately," which is the opposite of what you want for sensitive input. The security discipline is to treat "free cloud AI" as "I am sending my data to an entity whose interests may include keeping it," and to only do that with data you would be comfortable seeing kept. Local sidesteps the entire question: there is no provider, so there is no provider\'s incentive to reason about. This is not paranoia; it is knowing which trades you are actually making.'
      },
      {
        h: 'Classifying a script: the four buckets',
        p: 'Security teams don\'t ask "is this secret?" as a yes/no; they bucket data by impact of exposure. A useful four-bucket scheme for TTS scripts: (1) <b>Public</b> — already published or intended to be (marketing copy, public docs, this course). Cloud is fine; there is nothing to protect. (2) <b>Internal</b> — not secret but not for outsiders (internal announcements, draft scripts). Cloud with a real contract, or local. (3) <b>Confidential</b> — harm on exposure (unreleased product, financials, legal strategy, personal data). Local by default; cloud only with strong contractual controls and a reason. (4) <b>Regulated/Restricted</b> — legal duty attaches (PHI under HIPAA, GDPR special categories, export-controlled, attorney-client). Local unless you have specifically engineered a compliant cloud path, because the default cloud call may itself be the violation. The engineering payoff of the bucket model is that it makes routing mechanical: attach a sensitivity label upstream (the author knows what they typed), and the router in the lab becomes a lookup — Public/Internal may go cloud, Confidential/Restricted stay local — instead of a fragile keyword guess. The keyword gate is the fallback for when no label exists, not the primary control.'
      }
    ]
  },
  quiz: [
    {
      q: 'The core privacy problem with cloud TTS is that:',
      options: ['The audio quality is worse', 'The INPUT text — your private content — is transmitted to and processed by a third party', 'It is always slower than local', 'The output audio is watermarked'],
      correct: 1,
      explain: 'The sensitive asset is the input script, not the output waveform. Cloud synthesis requires sending that private input over the network to someone else\'s machines.'
    },
    {
      q: 'edge-tts is the canonical "trap" example specifically because:',
      options: ['It is low quality', 'It is free AND excellent, so neither price nor quality prompts you to notice that every line is sent to Microsoft\'s servers', 'It requires a credit card', 'It only works offline'],
      correct: 1,
      explain: 'Free removed the billing friction that makes you think; great removed the quality reason to look elsewhere. The only remaining signal is the network packet — which is invisible unless you look.'
    },
    {
      q: 'Which is NOT one of the four axes where local synthesis wins?',
      options: ['Privacy — nothing leaves the box', 'Cost — free forever after download', 'Guaranteed to beat the best cloud voice on quality', 'Reproducibility — pinned model makes the same bytes every run'],
      correct: 2,
      explain: 'Local wins on privacy, cost, availability, and reproducibility. Top-end quality is the honest counter-case: the very best commercial voices can still edge out open models.'
    },
    {
      q: '"Robotic" old local voices (eSpeak, the 2005 GPS) sounded that way because:',
      options: ['They ran locally instead of in the cloud', 'They used concatenative/formant synthesis, not neural generation — and modern open neural models fixed it, still locally', 'They had no internet', 'They were too expensive'],
      correct: 1,
      explain: 'Robotic was a synthesis-technique problem, not a location problem. Neural models (VITS, XTTS, Piper…) are open and run locally — same quality class as cloud, minus the network.'
    },
    {
      q: 'The mature way to treat local-vs-cloud is:',
      options: ['Always local, cloud is evil', 'Always cloud, local is a hassle', 'A routing decision by data sensitivity and constraints, ideally behind one swappable interface', 'Pick one at the start and never revisit'],
      correct: 2,
      explain: 'Route by sensitivity, volume, offline needs, and reproducibility — and keep both paths behind one interface so the choice is a policy flag, not a rewrite.'
    }
  ],
  pitfalls: [
    'Assuming "text-to-speech" is too trivial to be a data-privacy question. The output is trivial; the INPUT is your private script, and cloud synthesis transmits it. Sensitivity lives in what you send, not what you hear.',
    'Reading "free" as "no cost." It is free of dollars and potentially expensive in custody of your content — retention, training, breach exposure. Price silence is not privacy assurance.',
    'Conflating "I installed it locally" with "it runs locally." A wrapper around a cloud API installed on your laptop still sends your text out. The real test is synthesis with the network physically unplugged (Part 4).'
  ],
  interview: [
    {
      q: 'A product manager asks why the team should self-host TTS instead of just calling a cloud API. Make the case in a way that respects the tradeoffs.',
      a: 'I\'d frame it as routing, not religion, and lead with the axis that actually forces the decision: privacy. Cloud TTS transmits the input script — the private content — to a third party, which for regulated or confidential data can be a compliance violation or an unacceptable exposure regardless of the vendor\'s promises; local synthesis keeps that data in-process by construction, so the risk goes to zero rather than to "trust this vendor." Then the supporting axes: cost (free after a one-time model download, which matters enormously for high-volume or iterative re-rendering), availability (works offline, no dependence on someone\'s SLA or model-deprecation schedule), and reproducibility (a pinned model yields identical bytes, which cloud voices don\'t guarantee across silent updates). I\'d be equally clear about what we pay for it: setup and dependency management, our own hardware for the big expressive models, and that the absolute top of cloud quality can still edge us out. So the recommendation is a hybrid behind one interface — sensitive/high-volume/offline traffic goes local, public/low-volume/GPU-less traffic can go cloud — which makes it a per-request policy flag instead of an architecture we can\'t change later.'
    },
    {
      q: 'Someone says: "The audio is the same whether we use cloud or local, so privacy is a non-issue." Where\'s the flaw?',
      a: 'It confuses the published output with the confidential input. The waveform is the thing we intended to play or ship anyway — its exposure is by design. The sensitive asset is the script we fed in: the names, the diagnosis, the unreleased plot, the legal position. Cloud synthesis requires transmitting that private input to a third party as the price of producing the output, and many providers log or retain requests, so the text can persist on their side, reachable by their staff, process, and breaches. So "the listener hears the same thing" is true and irrelevant; security is about the input\'s journey, not the output\'s. Local keeps the input inside our process — there is no packet, no counterparty, no retention. That\'s the difference, and it\'s entirely on the input side where the person is only looking at the output.'
    },
    {
      q: 'How would you decide, in a real codebase, which requests go to a local engine and which may go to cloud?',
      a: 'I\'d make it a deterministic, auditable gate driven primarily by an explicit sensitivity label attached upstream, because the author knows what they typed better than any classifier. Bucket content into Public / Internal / Confidential / Regulated; Public and maybe Internal may go cloud, Confidential and Regulated stay local by policy. Where no label exists, fall back to a conservative keyword/pattern gate (PHI markers, credential words, SSN-shaped numbers) that defaults to local on any hit — false positives just send safe text to the local engine, which costs nothing but compute. Two hard overrides sit above all of it: an offline/locked-down flag forces local unconditionally, and any regulated-data path is local unless a specifically engineered compliant cloud route exists. I\'d also make request logging redact numeric/PII-shaped content so observability doesn\'t re-introduce the leak I just prevented. And I\'d put both engines behind one synth() interface so the router returns a choice, not a code path — which keeps the decision in one testable place instead of scattered through the app.'
    }
  ]
};
