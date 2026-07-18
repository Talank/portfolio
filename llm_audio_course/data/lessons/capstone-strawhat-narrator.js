window.LESSONS = window.LESSONS || {};
window.LESSONS['capstone-strawhat-narrator'] = {
  id: 'capstone-strawhat-narrator',
  title: 'Capstone: Build StrawHat Narrator, Fully Offline',
  category: 'Part 5 — Capstone',
  timeMin: 60,
  summary: 'Everything the course taught, assembled into one app. StrawHat Narrator takes a script of speaker-labeled lines — the exact shape of the One Piece episodes — and renders each line in a distinct, personality-matched, emotion-tuned voice, entirely on your machine, with nothing ever leaving the box. This capstone walks the full pipeline end to end: script → normalize → chunk → cast → prosody+emotion → laugh/non-verbal rewrite → route to a local engine → content-addressed cache → batch render → manifest → browser playback with ducked music — and shows how every stage is a small piece you already built, composed in order. This is you reproducing, by yourself and privately, the character-voiced narration you heard in the episodes.',
  goals: [
    'Assemble the complete offline pipeline from the stages built across all five parts',
    'Trace one line from raw script text to a played clip, naming which lesson owns each transformation',
    'See the architecture as composition: small, ordered, testable stages behind clean seams',
    'Build the top-level render() and the browser player that turn a script into a produced, private show',
    'Prove the whole thing is local (airgap test) and responsible (consent-gated cast) — end to end'
  ],
  concept: [
    {
      h: 'The app, and the shape of its input',
      p: [
        '<b>StrawHat Narrator</b> is the payoff: feed it a script and it produces a fully-voiced, emotion-tuned, music-under narration — a whole episode — rendered offline and played in the browser, with the privacy guarantee you can prove. Its input is exactly the episode shape you started from: an ordered list of lines, each tagged with a speaker and text — <code>[{speaker: "nami", text: "This brute-force scan is painfully slow."}, {speaker: "luffy", text: "Shishishi, let\'s just try everything!"}, ...]</code>. That\'s the same structure as the DSA/One Piece episodes, which is the point: the app reproduces, locally and privately, the narration you originally heard from a cloud pipeline.',
        'The whole design is <b>composition</b>: the app is not one big function but a sequence of the small stages you built, each owning one transformation, wired in a deliberate order behind clean seams. Nothing in the capstone is new — it is the assembly. So this lesson\'s real content is seeing how the pieces fit: which stage runs when, what it hands to the next, and why the order is what it is. If you understand the pipeline as "a script flows through these stages and comes out as played audio," you understand the app. The rest is plumbing you\'ve already written.'
      ]
    },
    {
      h: 'The pipeline, stage by stage',
      p: [
        'Here is the full path a line travels, each step naming the lesson that owns it. <b>(1) Normalize</b> (Part 2 — text normalization): the raw text becomes a spoken form — "O(n^2)" → "big oh of n squared", numbers and acronyms said right — on a spoken copy, leaving the display text for captions. <b>(2) Rewrite non-verbals</b> (Part 2 — laughs): "Shishishi" → "Shi hi hi hi ha ha ha!" surgically, so the laugh performs instead of spelling. <b>(3) Chunk</b> (Part 3 — chunking): split the normalized text into sentences, the atomic unit for everything downstream. <b>(4) Cast</b> (Part 2 — casting): look up the speaker → (voice/embedding, baseline prosody); a cloned voice here carries a required consent record (Part 4). <b>(5) Emotion</b> (Part 2 — emotion): classify the line (Nami fears the problem, loves the solution) → an emotion delta; compose baseline + delta → final prosody (Part 2 — prosody).',
        'Then the rendering half. <b>(6) Route</b> (Part 1 — choosing your engine): pick the local engine for this line — Piper/Kokoro for the cast bulk, XTTS for a cloned/expressive line, a frozen Bark clip for a hero laugh — behind the synth() seam. <b>(7) Cache key</b> (Part 3 — caching): hash the sound-affecting inputs (spoken text, voice, prosody, engine/version) into a content-addressed filename. <b>(8) Render if missing</b> (Part 3 — batch rendering): a bounded, retrying worker pool synthesizes only the cache-misses, resumable and observable. <b>(9) Manifest</b> (Part 3 — caching/manifests): record each line → clip + metadata (speaker, display text, prosody, emotion, gap). <b>(10) Playback</b> (Part 3 — playback): the browser player sequences the clips on "ended", shows synced captions, paces the gaps, and ducks background music. And wrapping all of it, <b>(0) Privacy</b> (Part 4): the models are pinned offline and the whole render runs under the airgap, so nothing leaves the box — provably.'
      ]
    },
    {
      h: 'Why it composes so cleanly',
      p: [
        'Step back and notice the architecture. Each stage is <b>small</b> (one transformation), <b>ordered</b> (its input is the previous stage\'s output, and the order is load-bearing — normalize before chunk before cache, casting before emotion compose), and <b>behind a seam</b> (engines plug into synth(); the cache is content-addressed; the manifest is the render↔playback contract). That means every stage is independently testable, replaceable, and reasoned-about locally — you can swap Piper for Kokoro without touching normalization, retune emotion without touching caching, change the player without re-rendering. The complexity is <i>factored</i>, not tangled, which is why a genuinely sophisticated system (private, multi-engine, emotion-tuned, cached, streamed, music-mixed) fits in your head: it\'s ten small things in a row, not one big thing.',
        'And notice how one early decision paid off everywhere: <b>the sentence as the atomic unit</b> (chunking) is what made caching granular, prosody/emotion per-line, batch rendering parallel, and browser playback trivial sequencing. Get the unit right and the whole pipeline stays simple to the end. The same for the seams: the synth() interface made engines swappable, the content hash made rendering incremental and resumable, the manifest made playback a thin sequencer, and the airgap made privacy provable. StrawHat Narrator is the demonstration that these aren\'t separate tricks — they\'re one coherent design, and once you\'ve built it you can reproduce the entire character-voiced narration experience yourself, offline and private, which was the whole promise of the course. The robot is dead, the data stays home, and the crew has their voices back — on your machine, by your hand.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Whole Crew, One Show, Their Own Ship',
      text: [
        'It comes together on the deck at dusk. Everything the crew learned on the voyage — Usopp\'s syllable-rewritten laughs, Robin\'s careful voice-copying with its consent log, Franky\'s station-based rendering crew, Sanji\'s right-sized cuts, Brook\'s one-player-advance-on-ended radio show with the violin ducking underneath — all of it, running at once, to tell a story in every crewmate\'s own voice. And not a single word of it leaves the ship. "Remember when we USED to send our stories to that island service?" Nami says. "Every secret we narrated, sitting in a stranger\'s vault." Now the sealed hold hums with local work: the text normalized, cut into sentences, cast to each voice, tuned to each feeling, laughed where Luffy laughs, and played back with the music swelling in the pauses.',
        'Robin watches the pieces click and names what she sees. "Look how it fits. Nobody built one enormous machine. Each of us built one small, honest part — and because each part hands cleanly to the next, in the right order, the whole thing just... works. Change the engine, the rest doesn\'t care. Retune a feeling, nothing else moves. And it\'s ALL ours — sealed in, provable, nothing whispering off the ship." Luffy, hearing his own laugh come back perfect from the speakers — "Shishishi!" bouncing exactly right — throws his arms up. "That\'s ME! That\'s really me!" Usopp wipes a tear. "We used to borrow our own voices from strangers. Now we MAKE them. Ourselves. Here." Brook draws the violin down as Nami\'s narration begins, fearful on the problem, bright on the solution, and the whole crew leans in to hear their own show, told in their own voices, that belongs to no one but them. Robin, softly: "Free, offline, and entirely ours. That was always the point."'
      ]
    },
    sitcom: {
      show: 'Community',
      title: 'The Study Group Produces the Whole Thing In-House',
      text: 'Abed has assembled the study group\'s in-house audio production and walks everyone through it, delighted that it\'s entirely their own. "Every piece is something one of us already knew how to do. Annie normalizes the script so it reads right. Troy cuts it into sentences. Britta casts each character a voice. Shirley tunes the feeling. Jeff rewrites the laughs so they don\'t sound like a fax machine. And it all plays back with Vaughn\'s guitar ducking under the dialogue." Jeff, arms crossed but impressed: "And nobody\'s uploading our weird little show to some server?" Abed: "That\'s the best part. It never leaves the room. Pull the plug—" he does "—still works. Which means it\'s ours, and only ours." Annie beams: "I love that we made a REAL thing out of a bunch of small things we each understood." Abed nods, satisfied. "That\'s all any system is. Small honest pieces, in the right order, behind clean seams. Cool cool cool." Troy: "Cool cool cool cool."',
    },
    why: 'Both stories are the capstone thesis: the finished app is not one giant machine but the COMPOSITION of small parts everyone already built — normalize, chunk, cast, tune emotion, rewrite laughs, render, play back with music ducking — each handing cleanly to the next, in the right order, behind clean seams, so the whole thing "just works" and any one part can change without disturbing the rest. And it lands the course\'s emotional payoff and privacy promise together: the crew/group reproduce the character-voiced show THEMSELVES, and it never leaves the ship/room — provable by pulling the plug (the airgap test). Free, offline, and entirely theirs — small honest pieces in the right order — which is exactly what StrawHat Narrator is.'
  },
  tech: [
    {
      q: 'Trace one line — Nami saying "This O(n^2) scan is painfully slow." — through the entire StrawHat Narrator pipeline. What happens at each stage?',
      a: 'Start with the raw line {speaker: "nami", text: "This O(n^2) scan is painfully slow."}. (1) Normalize (Part 2): on a SPOKEN copy, "O(n^2)" becomes "big oh of n squared" and any other written forms are said right, while the display text keeps "O(n²)" for the caption — spoken and displayed diverge here. (2) Non-verbal rewrite (Part 2): there\'s no laugh in this line, so it passes through; a Luffy "Shishishi" would become "Shi hi hi hi ha ha ha!" at this step. (3) Chunk (Part 3): the normalized text is split into sentences — here one sentence, "This big oh of n squared scan is painfully slow." — the atomic unit for everything downstream. (4) Cast (Part 2): look up "nami" → her voice and baseline prosody (lively default); if she were a cloned voice, this entry carries a required consent record (Part 4), and an un-sourced voice would hard-error. (5) Emotion (Part 2): classify the sentence — it contains "slow" (a fear/problem word) and no solution words → "fear" → the fear delta (a touch faster/higher but quieter, tense); compose baseline + delta → her final prosody for THIS line. (6) Route (Part 1): pick the local engine behind synth() — Nami\'s cast bulk goes to Piper/Kokoro (CPU-fast, deterministic, cacheable). (7) Cache key (Part 3): hash the sound-affecting inputs — the spoken text, her voice, the composed prosody, the engine/version — into a content-addressed filename. (8) Render if missing (Part 3): if that key.wav isn\'t on disk, the bounded retrying worker pool synthesizes it; if it exists (unchanged from a prior build), it\'s an instant cache hit and skipped. (9) Manifest (Part 3): record this line → its clip filename plus metadata (speaker "nami", display text "This O(n²) scan is painfully slow.", prosody, emotion "fear", gap). (10) Playback (Part 3): the browser player, sequencing on "ended", loads this clip when its turn comes, shows the caption "Nami: This O(n²) scan is painfully slow." (pretty display form), ducks the background music while she speaks, and paces the gap after. Wrapping all of it (Part 4): the models are pinned offline and the whole render ran under the airgap, so none of Nami\'s text ever left the machine — provably. That single line touched nine transformations plus the privacy wrapper, and every one is a stage you built in an earlier lesson; the app is just those stages composed in order.'
    },
    {
      q: 'Why does this fairly sophisticated system stay simple enough to build and reason about?',
      a: 'Because the complexity is FACTORED into small, ordered, seam-separated stages rather than tangled into one monolith — the system is ten small things in a row, not one big thing. Three properties make it tractable. First, each stage is SMALL and owns exactly one transformation: normalization says text right, chunking splits into sentences, casting maps speaker to voice, emotion picks a delta, caching hashes, rendering synthesizes, playback sequences. A stage you can describe in one sentence is a stage you can build and test in isolation. Second, the stages are ORDERED, and the order is load-bearing and sensible: normalize before chunk (so you split clean text), chunk before cache (so the atomic unit is what you key on), cast before emotion-compose (baseline before delta), render before playback. Because each stage\'s input is precisely the previous stage\'s output, you reason about the pipeline locally — what does this stage receive, what does it emit — instead of holding the whole thing in your head at once. Third, the stages sit behind clean SEAMS: engines plug into a common synth() interface (so they\'re swappable), the cache is content-addressed (so reuse/invalidation are automatic), and the manifest is the render↔playback contract (so playback is a thin sequencer that doesn\'t know how rendering works). Seams mean you can change one stage without disturbing others — swap Piper for Kokoro without touching normalization, retune emotion without touching caching, rewrite the player without re-rendering. The payoff of all three is that a genuinely capable system — private, multi-engine, per-line emotion, content-cached, batch-rendered, streamed, music-mixed — fits in your head, because at no point are you dealing with more than one small stage and its two neighbors. This is the general lesson of good pipeline architecture: factor the problem into small units with clear contracts in a deliberate order, and sophistication becomes composition. StrawHat Narrator isn\'t simple because it does little; it does a lot. It\'s simple because the doing is decomposed correctly.'
    },
    {
      q: 'How did the single decision to make the sentence the atomic unit pay off across the whole app?',
      a: 'Choosing the sentence as the atomic unit back in chunking was the highest-leverage decision in the pipeline, because nearly every downstream capability depends on it and inherits its benefits. Caching (Part 3) is granular because the unit is the sentence: one cache entry per sentence means editing one line re-renders only that line and everything else is a hit — if the unit were a paragraph, one word-change would re-render the whole paragraph. Prosody and emotion (Part 2) are per-line because the sentence is the unit: each sentence gets its speaker\'s baseline plus its own emotion delta, which is exactly the grain at which emotion operates (a line is fearful or excited) — a larger unit would force multiple emotions into one clip, a smaller one would apply emotion to fragments. Batch rendering (Part 3) is parallel because there are many independent sentence-units: hundreds render concurrently through the worker pool instead of blocking on one giant clip, and each is independently cacheable and resumable. Streaming (Part 3) works because sentences are small and independent: you can play sentence one while sentence fifty renders, collapsing time-to-first-audio. And browser playback (Part 3) is trivial sequencing because the audio arrives as an ordered list of small files: "play the narration" is "advance an index on ended," "insert a pause" is "wait between files," "duck music" is a second element\'s volume, "show captions" is a text swap — no waveform splicing or in-code mixing, which is what a single big clip would force. So one decision — the sentence is the atom — simultaneously produced granular caching, per-line expressiveness, parallel rendering, streaming, and dependency-free playback. That\'s the compounding nature of a good architectural choice: it doesn\'t help one stage, it helps every stage that operates on the unit, because they all inherit the grain. The general principle the capstone demonstrates is that getting the unit of work right early keeps the ENTIRE system simple to the end, including the user-facing part — the difficulty is front-loaded into the right abstraction (the sentence-sized clip), and everything downstream is a clean operation over a stream of those units.'
    }
  ],
  code: {
    title: 'StrawHat Narrator: the whole pipeline in one render()',
    intro: 'Every stage from every part, composed in order behind the seams you built. This is the top-level app: script in, manifest of played-back clips out, entirely offline. Each call is a lesson you already implemented.',
    code: `def render_episode(script, out_dir, engines, cast, synth, encoder=None):
    enforce_airgap()                 # Part 4: nothing leaves the box. Proven.
    os.makedirs(out_dir, exist_ok=True)
    manifest = []

    todo = []
    for line in script:              # script: [{speaker, text}, ...]  (episode shape)
        spoken = normalize_spoken(line["text"], ACRONYMS)     # Part 2: say it right
        spoken = voice_the_laugh(spoken, LAUGH_RE, LAUGH_TEXT) # Part 2: real laughs
        for sent in split_sentences(spoken, ABBR):            # Part 3: sentence atoms
            voice, base = resolve_voice(cast, line["speaker"], DEFAULT_VOICE)  # Part 2: cast
            prov = cast.get(line["speaker"], {}).get("consent")               # Part 4
            delta = emotion_delta(sent)                        # Part 2: fear/excited
            prosody = compose(base, delta)                     # Part 2: baseline+delta
            engine = route(engines, req_for(line, voice))      # Part 1: pick local engine
            key = content_key({"spoken": sent, "voice": voice, # Part 3: cache key
                               "prosody": prosody, "engine": engine})
            todo.append({"key": key, "spoken": sent, "voice": voice,
                         "prosody": prosody, "engine": engine, "prov": prov,
                         "speaker": line["speaker"], "display": line["text"]})

    render_batch(todo, out_dir, synth)          # Part 3: bounded, retrying, resumable
    for c in todo:
        manifest.append({                        # Part 3: the render<->playback contract
            "clip": c["key"] + ".wav", "speaker": c["speaker"],
            "text": c["display"], "prosody": c["prosody"],
            "emotion": classify_emotion(c["spoken"], FEAR_WORDS, EXCITED_WORDS),
            "gapMs": 250,
        })
    json.dump({"lines": manifest}, open(out_dir + "/manifest.json", "w"))
    return manifest      # -> createPlayer(manifest, out_dir) in the browser (Part 3)

# script -> normalize -> laugh -> chunk -> cast -> emotion -> prosody -> route
#        -> key -> batch render -> manifest -> browser playback (music ducked).
# Ten stages you already built, composed in order, entirely offline.`,
    notes: [
      'Nothing here is new — every call (normalize_spoken, voice_the_laugh, split_sentences, resolve_voice, emotion_delta, compose, route, content_key, render_batch) is a function you implemented in an earlier lesson. The app IS the composition.',
      'enforce_airgap() wraps the whole render (Part 4), and cloned cast voices carry a consent record — privacy and ethics are built into the pipeline, not bolted on. The output manifest feeds the browser player from the playback lesson.'
    ]
  },
  lab: {
    title: 'Wire the per-line pipeline end to end',
    prompt: 'Implement <code>process_line(text, speaker, cast, default_voice)</code> that runs the core per-line pipeline and returns a dict. Steps: (1) set <code>spoken = text.lower()</code> (a stand-in for normalization). (2) Look up the voice: <code>voice = cast.get(speaker, default_voice)</code> — each cast value is a tuple <code>(voice_name, baseline_delta)</code> where <code>baseline_delta</code> is an int; <code>default_voice</code> has the same shape. (3) Compute an emotion score: <code>score = spoken.count("slow") - spoken.count("fast")</code> (positive → fearful problem, negative → excited solution). (4) Compute <code>prosody = voice[1] + score</code> (baseline + emotion delta). (5) Return <code>{"spoken": spoken, "voice": voice[0], "prosody": prosody}</code>. This is the whole per-line path — normalize, cast, emotion, compose — in miniature.',
    starter: `def process_line(text, speaker, cast, default_voice):
    # normalize -> cast -> emotion score -> compose baseline+delta -> dict
    pass`,
    checks: [
      { re: 'def\\s+process_line\\s*\\(', flags: '', must: true, hint: 'Define process_line(text, speaker, cast, default_voice).', pass: 'process_line defined ✓' },
      { re: '\\.lower\\s*\\(', flags: '', must: true, hint: 'Normalize with text.lower() as the stand-in.', pass: 'normalization step present ✓' },
      { re: '\\.get\\s*\\(', flags: '', must: true, hint: 'Cast with cast.get(speaker, default_voice).', pass: 'casting lookup present ✓' },
      { re: 'count', flags: '', must: true, hint: 'Score emotion with .count("slow") - .count("fast").', pass: 'emotion score present ✓' }
    ],
    tests: `CAST = {"nami": ("jenny", 4), "luffy": ("guy", 13)}
DEF = ("aria", 0)
# nami, problem line (slow) -> fearful, prosody = 4 + 1
r = process_line("This is SLOW", "nami", CAST, DEF)
assert r == {"spoken": "this is slow", "voice": "jenny", "prosody": 5}, r
# nami, solution line (fast) -> excited, prosody = 4 - 1
r = process_line("Now it is FAST", "nami", CAST, DEF)
assert r["prosody"] == 3 and r["voice"] == "jenny"
# luffy baseline carries through
r = process_line("let's go", "luffy", CAST, DEF)
assert r["voice"] == "guy" and r["prosody"] == 13
# unknown speaker -> default voice, no crash
r = process_line("who am i", "buggy", CAST, DEF)
assert r["voice"] == "aria" and r["prosody"] == 0
# neutral line -> baseline unchanged
r = process_line("we open the file", "nami", CAST, DEF)
assert r["prosody"] == 4
print("end-to-end line pipeline correct")`,
    solution: `def process_line(text, speaker, cast, default_voice):
    spoken = text.lower()
    voice = cast.get(speaker, default_voice)
    score = spoken.count("slow") - spoken.count("fast")
    prosody = voice[1] + score
    return {"spoken": spoken, "voice": voice[0], "prosody": prosody}`,
    notes: [
      'This tiny function is the whole per-line pipeline in miniature: normalize (lower), cast (get with a safe default), emotion (score), compose (baseline + delta) — the same four Part-2 stages, composed in order, that the real render_episode runs before caching and rendering.',
      'The unknown-speaker test (falls back to default, no crash) and the neutral-line test (baseline unchanged) are the same robustness properties the real casting and emotion stages guarantee — composition preserves each stage\'s guarantees.'
    ]
  },
  deepDive: {
    timeMin: 12,
    intro: 'Where to take StrawHat Narrator next, and the one architectural habit that made all of it possible.',
    sections: [
      {
        h: 'Extending the app: every addition is a stage or a seam',
        p: 'Because the app is factored into stages behind seams, every plausible extension is either a new stage slotted at the right position or a new plugin behind an existing seam — never a rewrite. Want a new engine (a better local model ships next quarter)? Write one plugin conforming to the synth() contract and add a registry row; the router picks it up, callers are untouched (Part 1). Want a new emotion (anger, sadness) beyond fear/excited? Add words to the classifier and a delta to the emotion table; nothing else moves (Part 2). Want a new language? Normalization gets language-aware rules and you route to a multilingual engine like XTTS behind the same seam. Want streaming playback that starts before the full render finishes? The player already sequences on "ended" and the clips are independent, so you add a producer/consumer queue between render and playback (Part 3) — the small-chunk decision already made this possible. Want per-character cloned voices? Each becomes a cast entry with a consent record and an encoded embedding (Part 4), dropped into the same casting slot. Want subtitles exported, or chapter markers, or a waveform view? All read from the manifest, which already holds the per-line metadata. The pattern is the reward for good factoring: the system has clean insertion points, so growth is additive and local rather than invasive and global. This is the difference between a codebase that gets harder to change as it grows and one that stays malleable — and it comes entirely from having decided the stages and seams up front. When someone asks "can it also do X," the answer is almost always "yes, X is a new stage here / a plugin there," and you can say where without fear, because the contracts tell you exactly what X would receive and must emit.'
      },
      {
        h: 'The one habit: small pieces, clean seams, deliberate order',
        p: 'If you take one thing from the whole course, make it the architectural habit this capstone embodies, because it generalizes far beyond TTS. Every hard problem here got solved the same way: break it into the smallest pieces that each do one thing, give each piece a clean contract (what it receives, what it emits), and compose them in a deliberate order. That habit is what turned "build a private, expressive, multi-engine, cached, streamed narration system" — which sounds enormous — into ten small functions in a row. It\'s why you could learn the system one lesson at a time (each lesson was one stage), why you can test it one stage at a time, why you can change it one stage at a time, and why it fits in your head at all. The seams did specific heavy lifting: the synth() interface made engines swappable so no engine choice was permanent; the content hash made rendering incremental and resumable so no work was ever wasted or lost; the manifest made playback a thin sequencer so the front-end stayed trivial; the airgap made privacy provable so the core promise was verifiable, not asserted. And the ordering was load-bearing: normalize before chunk before cache, cast before compose, render before play — each stage assuming its predecessor ran. None of these are TTS-specific insights; they\'re how you build any system that has to stay understandable and changeable as it grows. The character voices and the ducked music are the delightful surface, but the durable lesson underneath is the method: factor into small pieces, define clean seams, order them deliberately, and sophistication becomes composition. That is what lets you now go reproduce this — or something entirely different — by yourself, which was the whole point: not to have watched a system get built, but to be able to build one.'
      }
    ]
  },
  quiz: [
    {
      q: 'StrawHat Narrator\'s input is:',
      options: ['A single block of text', 'An ordered list of speaker-labeled lines — the same shape as the One Piece episodes', 'An audio file to transform', 'A cloud API request'],
      correct: 1,
      explain: 'It takes [{speaker, text}, ...] — the episode structure — and reproduces, locally and privately, the character-voiced narration you originally heard from a cloud pipeline.'
    },
    {
      q: 'The correct order for the core per-line stages is:',
      options: ['cache → render → normalize → chunk', 'normalize → rewrite laughs → chunk → cast → emotion(compose prosody) → route → cache key → render', 'render → normalize → cast', 'chunk → normalize → play → cast'],
      correct: 1,
      explain: 'The order is load-bearing: normalize clean text before chunking, chunk into the atomic unit before caching, cast (baseline) before composing the emotion delta, then route/key/render. Each stage consumes the previous one\'s output.'
    },
    {
      q: 'The app stays simple to build and reason about because:',
      options: ['It does very little', 'Complexity is factored into small, ordered stages behind clean seams — ten small things in a row, each testable and swappable, not one big tangle', 'It uses a huge framework', 'It runs in the cloud'],
      correct: 1,
      explain: 'Small (one transformation each), ordered (input = previous output), seam-separated (synth()/cache/manifest). You never deal with more than one stage and its neighbors, so a sophisticated system fits in your head.'
    },
    {
      q: 'The single decision that paid off across caching, prosody, batch rendering, and playback was:',
      options: ['Choosing a GPU', 'Making the sentence the atomic unit (chunking) — granular caching, per-line emotion, parallel rendering, and trivial sequenced playback all inherit that grain', 'Using JSON', 'Picking XTTS'],
      correct: 1,
      explain: 'Get the unit right and every stage that operates on it inherits the benefit. One chunking decision made the whole downstream pipeline simple — the compounding value of a good architectural choice.'
    },
    {
      q: 'How is privacy guaranteed in the finished app?',
      options: ['By trusting a provider\'s policy', 'Models are pinned offline and the whole render runs under the airgap — nothing leaves the box, provable by the airgap test', 'By encrypting uploads', 'It isn\'t — it uses the cloud'],
      correct: 1,
      explain: 'Local synthesis with offline-pinned models under enforce_airgap() means no text or audio ever transmits. The airgap test proves it empirically, and cloned voices carry required consent records.'
    }
  ],
  pitfalls: [
    'Reordering the stages. The order is load-bearing: normalize before chunk (split clean text), chunk before cache (key on the atomic unit), cast before compose (baseline before emotion delta). Wrong order breaks correctness silently.',
    'Trying to build it as one big function. It\'s ten small stages composed in order — each independently testable and swappable. Monolithic assembly loses every benefit of the factoring.',
    'Skipping the privacy/ethics wrapper because "the app works." enforce_airgap() and required consent records on cloned voices are part of the pipeline, not optional extras — the whole point was local AND responsible.',
    'Forgetting the display/spoken split at the seams: captions show "O(n²)"/"Shishishi!" while audio plays the normalized/rewritten forms. Losing it corrupts either your captions or your audio.',
    'Treating extensions as rewrites. Every addition (new engine, new emotion, cloning, streaming) is a new stage or a plugin behind an existing seam. If an extension feels like a rewrite, the seams weren\'t respected.'
  ],
  interview: [
    {
      q: 'Give an architectural overview of StrawHat Narrator: what it does, how it\'s structured, and why that structure is good.',
      a: 'StrawHat Narrator takes a script of speaker-labeled lines — the same [{speaker, text}] shape as the source episodes — and renders each line in a distinct, personality-matched, emotion-tuned voice entirely offline, then plays it back in the browser with captions and ducked background music, with a provable privacy guarantee. Structurally it\'s a pipeline of small ordered stages behind clean seams, and every stage is a component built earlier in the course. Per line: normalize the text to a spoken form (say "O(n²)" and numbers/acronyms right, on a spoken copy, keeping display text for captions); rewrite non-verbals (turn "Shishishi" into pronounceable laugh syllables); chunk into sentences (the atomic unit); cast the speaker to a voice and baseline prosody (a cloned voice carries a required consent record); classify emotion (fear on problems, excitement on solutions) into a delta and compose baseline+delta into the final prosody. Then the rendering half: route to a local engine behind a synth() seam (Piper/Kokoro for the bulk, XTTS for cloning/expressive, a frozen Bark clip for a hero laugh); compute a content-addressed cache key from the sound-affecting inputs; batch-render only the cache-misses through a bounded, retrying, resumable worker pool; write a manifest mapping each line to its clip and metadata; and play back in the browser by sequencing clips on the "ended" event with synced captions, paced gaps, and music that ducks under the voice. Wrapping everything, the models are pinned offline and the whole render runs under the airgap, so nothing leaves the machine — provable, not asserted. Why the structure is good: each stage is small (one transformation), ordered (its input is the previous output, and the order is load-bearing), and behind a seam (engines plug into synth(), the cache is content-addressed, the manifest is the render↔playback contract), which makes every stage independently testable, swappable, and locally reasoned-about. The complexity is factored, not tangled, so a genuinely capable system fits in your head as ten small things in a row. And one early decision — the sentence as the atomic unit — paid off everywhere: it made caching granular, emotion per-line, rendering parallel, and playback trivial sequencing. The structure is good because sophistication became composition: I can change any one part without disturbing the rest, extend it by adding a stage or a plugin rather than rewriting, and prove its core promise (local, private) empirically.'
    },
    {
      q: 'This capstone reproduces, privately, what a cloud pipeline did. What did going local cost, what did it buy, and was it worth it?',
      a: 'Going local traded some convenience for privacy, control, and understanding, and for the stated goal — reproducing character-voiced narration without data leakage — it was clearly worth it. What it cost: more engineering than calling a cloud API (I had to assemble normalization, chunking, casting, emotion, routing, caching, batch rendering, and playback myself rather than getting synthesis as a one-line service call); hardware considerations (local models need CPU and sometimes GPU/VRAM, where the cloud offloaded that); and per-engine trade-offs (a fixed-voice workhorse like Piper for speed, a heavier engine like XTTS for cloning, Bark reserved and frozen for non-verbals — I had to route among them rather than hit one endpoint). It also handed me responsibilities the cloud nominally shared — there\'s no provider terms-of-use gatekeeping cloning, so consent and provenance guardrails are mine to build and enforce. What it bought: first and foremost, provable privacy — nothing about the text ever leaves the machine, verifiable with the airgap test, which the cloud path structurally cannot offer because remote synthesis means the text must travel; this closes the exact data-leakage hole that motivated the course. It also bought control and reproducibility — pinned offline models mean a known exact version that works forever behind any firewall, no dependency on a service\'s uptime or pricing or policy changes. It bought unlimited, ownable voices via local cloning (with consent), rather than a fixed cloud voice menu. And, less tangibly but importantly, it bought UNDERSTANDING: because I built each stage, I can now reproduce this myself, extend it, or build something different — the whole point was to be able to do it by myself, not to have watched it happen. Was it worth it? For sensitive or private content, unambiguously yes — the privacy guarantee is categorical (eliminates trust rather than placing it) and the extra engineering is a one-time cost that also yields a maintainable, extensible system. For casual, non-sensitive throwaway work, a cloud API is a perfectly reasonable simpler choice, and I\'d say so honestly. But this course\'s premise — non-robotic audio, locally, free, without data leakage — is exactly the case where local wins decisively, and the capstone is the proof that you can have the cloud pipeline\'s quality and expressiveness AND keep everything on your own machine. The cost was effort; the purchase was privacy, control, and the ability to do it yourself — and that was the goal.'
    }
  ]
};
