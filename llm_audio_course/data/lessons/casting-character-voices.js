window.LESSONS = window.LESSONS || {};
window.LESSONS['casting-character-voices'] = {
  id: 'casting-character-voices',
  title: 'Casting a Crew: One Distinct Voice Per Character',
  category: 'Part 2 — Killing the Robot',
  timeMin: 35,
  summary: 'Prosody and emotion make one voice expressive; casting is what turns a script with speaker labels into a full cast where every character is instantly recognizable. This is the layer that made the episodes feel like a show instead of a monologue: Luffy, Nami, Zoro, and the narrator each get their own voice AND their own baseline prosody, so you know who\'s talking before you parse a word. This lesson builds the casting layer — a speaker→(voice, baseline) table, the rules for making voices distinct enough to tell apart, and how casting slots cleanly beneath emotion and above the pipeline. It\'s the "who is this" layer, and it\'s mostly a data-modeling problem with a couple of sharp craft rules.',
  goals: [
    'Model a cast as data: speaker label → (voice model, baseline prosody), one row per character',
    'Apply the distinctness rules that make characters tell-apart-able: vary the voice model first, then pitch/rate, avoid near-duplicates',
    'See how casting (baseline) and emotion (delta) stack: identity from the cast, feeling from the line',
    'Handle the practical cases: the narrator, unknown speakers, and a growing cast',
    'Understand casting as pure routing — speaker in, voice+baseline out — that plugs into the same pipeline seam'
  ],
  concept: [
    {
      h: 'A cast is a table',
      p: [
        'The episode scripts are just lines tagged with who says them: <code>{speaker: "luffy", text: "..."}</code>, <code>{speaker: "nami", text: "..."}</code>. Casting is the layer that answers, for each label, "what does this person sound like?" — and it is, at heart, a lookup table. One row per character, mapping the <b>speaker label</b> to two things: a <b>voice model</b> (which neural voice — a specific Piper/Kokoro voice, or a cloned embedding) and a <b>baseline prosody</b> (the rate/pitch/volume default from the prosody lesson). That pair — voice + baseline — is the character\'s sonic identity, and it is exactly the 4-tuple the real pipeline stores: <code>"luffy": ("guy-voice", "+13%", "+12Hz", "+0%")</code>.',
        'Framing casting as data, not code, is the whole design. Adding a character is adding a row. Recasting someone (a voice that isn\'t landing) is editing one row. There are no per-character branches anywhere in the pipeline — every line, regardless of speaker, flows through the same path; the only thing that differs is which row it looked up. This is the same "options as data behind one seam" discipline as engine routing, applied to voices: the cast is a registry, casting is a lookup, and the rest of the system never hard-codes a character. Get the table right and a 9-character show is no harder to run than a 2-character one.'
      ]
    },
    {
      h: 'Making voices actually distinct',
      p: [
        'The point of a cast is that the listener can tell who is speaking <i>without</i> the words — so the voices must be genuinely distinguishable, and that takes a couple of deliberate rules. Rule one: <b>vary the voice model first, prosody second.</b> Two different neural voices (different speaker identities) are far easier to tell apart than one voice pitched up vs. down, because they differ in timbre — the deep character of the voice — not just register. So give distinct characters distinct <i>models</i> where you can; reach for pitch/rate offsets on the <i>same</i> model only when you\'ve run out of models or want two related characters to feel like siblings.',
        'Rule two: <b>avoid near-duplicates.</b> Two male voices of similar age and pitch will blur together no matter how you tune them; spread the cast across the available range — different genders, ages, pitch centers, energy levels — so adjacent characters contrast. Rule three: <b>the baseline should match the personality</b>, because that\'s free characterization and an extra distinctness axis — Luffy fast and bright, a stoic swordsman slower and lower, the narrator measured and neutral. Done well, the baselines alone start to differentiate characters even before you notice the timbre. And one practical guard: <b>keep the mapping stable.</b> Once "luffy" means a specific voice, it must keep meaning that voice for the life of the project — recasting mid-way makes a character\'s earlier lines sound like a different person, and (as the caching lesson will show) silently invalidates every cached clip. Cast deliberately, then hold it.'
      ]
    },
    {
      h: 'Casting under emotion, over the pipeline',
      p: [
        'Casting occupies a precise spot in the stack, and seeing it makes the whole Part-2 architecture click. Casting provides the <b>baseline</b> (identity: who this is); emotion provides the <b>delta</b> (feeling: how this line lands); they compose via the exact <code>baseline + delta</code> math from the prosody lesson. So a single line resolves like this: look up the speaker → get (voice, baseline); classify the line → get an emotion delta; compose baseline + delta → final prosody; hand (voice, final prosody, text) to the engine. Luffy\'s carefree identity plus a given line\'s excitement; Nami\'s lively identity plus that line\'s fear. Identity is constant per character, feeling varies per line, and they stack cleanly because they live in different layers.',
        'Below casting, nothing changes: the resolved (voice, prosody, text) triple feeds the same normalization, chunking, caching, and batching pipeline as every other line — casting, like emotion, added no new code path, just a lookup that fills in the "who." A few real-world details round it out. The <b>narrator</b> is just another cast row (usually a neutral, measured baseline). An <b>unknown speaker</b> — a label with no row — should fall back to a sensible default voice rather than crash, and ideally log so you notice a typo\'d or new label. And a <b>growing cast</b> is trivial precisely because it\'s data: new character, new row, done. Casting is the "who is this" layer, and once it\'s a stable table feeding one seam, turning a labeled script into a believable ensemble is almost entirely a matter of choosing good, distinct rows.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Crew Does Radio Theater',
      text: [
        'Stuck below deck in a storm, the crew decides to perform a radio play — no visuals, just voices — and it flops immediately because everyone is doing the same flat "narrator voice," so the audience of one (Chopper) can\'t tell who\'s who. "Wait, was that the hero or the villain? You ALL sound like the same guy reading a menu." Robin, ever the director, reorganizes. "The whole point of radio is that your VOICE tells them who you are before you say your name. So we cast it. Luffy — you\'re fast and bright, you already sound like nobody else, be exactly that. Zoro — low, slow, few words, let every line land like a dropped anchor. Nami — quick and lively. Usopp — big range, swoop around. And me — I\'ll narrate, plain and even, so I never get confused with a character."',
        'The second performance works — Chopper calls out every character correctly with his eyes closed, purely from the voices. Robin points out why. "Notice I didn\'t make you all talk high or all talk fast. I SPREAD you out — loud and soft, high and low, fast and slow — so no two of you sit in the same spot. If Luffy and Usopp both did the excitable-young-guy voice, they\'d blur, so Usopp got the big swoops and Luffy got the speed. And once we picked, we KEPT it — Zoro doesn\'t suddenly get chirpy in act two, or nobody knows it\'s still Zoro." Chopper, amazed: "So the voices are like... a map of who\'s who." Robin: "Exactly. Cast them distinct, keep them stable, and the ears do the rest." Luffy: "Do the anchor line again, Zoro! It\'s so cool and gloomy!"'
    ],
    },
    sitcom: {
      show: 'Seinfeld',
      title: 'Kramer Casts the Answering-Machine Bit',
      text: 'Jerry, Kramer, and George are recording a goofy multi-part message and it\'s unlistenable because all three do the same flat delivery — you can\'t tell where one "character" ends and the next begins. Kramer, suddenly a director, takes charge. "No no NO. Each part needs its own VOICE, or it\'s just one guy talking to himself. Jerry — you\'re the smooth, even one, that\'s your lane, stay in it. George — you go higher, tighter, more panicked, that\'s YOU. And I\'ll go low and slow and weird, nobody else can touch that." They try again and it actually works — three clearly different characters — because they spread out instead of clustering. George: "Why can\'t we all just do the normal voice?" Kramer: "Because then it\'s NOBODY, George! Distinct! You gotta be distinct!" Jerry, nodding despite himself: "He\'s right. If we all sound the same, there\'s no bit." And crucially, they keep their lanes for the whole recording — George doesn\'t go smooth halfway through, or the whole thing collapses.'
    },
    why: 'Both stories are the casting layer exactly: with no visuals, the VOICE has to tell the listener who\'s speaking — so you give each character a distinct voice AND a baseline that fits them (Luffy/Jerry smooth-and-set, Zoro low-and-slow, George high-and-tight), you SPREAD the cast across the range so no two cluster and blur (Usopp\'s swoops vs Luffy\'s speed), and you KEEP the casting stable so a character never turns into someone else mid-story. That\'s speaker→(voice, baseline) as a table, the distinctness rules, and the stability guard — the whole "who is this" layer, with the ears doing the rest.'
  },
  tech: [
    {
      q: 'Why model a cast as a lookup table instead of writing per-character logic?',
      a: 'Because casting is pure routing — speaker label in, (voice, baseline) out — and modeling it as data instead of code gives you every property you want at scale for free. As a table, adding a character is adding a row, recasting is editing a row, and the pipeline itself contains zero per-character branches: every line, whoever says it, flows through one path, and the only per-character thing is which row got looked up. That means a 9-character show runs on exactly the same code as a 2-character one — the difference is entirely in the data. It also makes the cast inspectable and reviewable: the whole ensemble is one readable table you can eyeball for distinctness ("are these two too similar?") and reason about, rather than logic scattered across the codebase. And it composes: because casting only produces a (voice, baseline) pair that feeds the same baseline+delta prosody math and the same synth/cache/batch pipeline as everything else, it doesn\'t interact with or complicate any other layer — it just fills in the "who." This is the identical discipline to engine routing (options as data behind one seam) applied to voices: the cast is a registry, casting is a lookup. The anti-pattern — a function per character, or if/elif on speaker name deciding voices and special behavior — reintroduces branches that must each be maintained, makes adding a character a code change, and scatters the one thing (the cast) that should be centrally visible. Keep it a table.'
    },
    {
      q: 'What actually makes two character voices distinguishable, and in what priority?',
      a: 'Distinguishability comes primarily from timbre — the fundamental character of the voice, tied to the speaker identity the model represents — and only secondarily from register (pitch/rate). So the priority is: vary the voice MODEL first, prosody second. Two genuinely different neural voices differ in timbre and are easy to tell apart even at similar pitch; the same voice pitched up vs. down differs only in register and blurs far more easily, because the ear still hears "the same person, higher." So distinct characters should get distinct models wherever the voice inventory allows, and you reach for pitch/rate offsets on a shared model only when you\'ve exhausted models or deliberately want two characters to feel related (siblings, a duo). Layered on top are two more rules. Avoid near-duplicates: two voices of similar gender, age, and pitch center will cluster no matter how you tune them, so spread the cast across the available range — genders, ages, pitch centers, energy — so adjacent characters contrast rather than collide. And match the baseline to personality: an energetic character fast and bright, a stoic one slow and low, the narrator even and neutral — this is free characterization AND an extra distinctness axis, because differing baselines start to separate characters before timbre even registers. The practical test is the eyes-closed test: can a listener identify each speaker from voice alone, with no content cues? If two characters fail it, they\'re too close — change one\'s model (best), or push their baselines apart (second best), rather than hoping listeners disambiguate from context.'
    },
    {
      q: 'How does casting relate to emotion and to the rest of the pipeline?',
      a: 'Casting and emotion are two layers that stack cleanly because they answer different questions and live in different places. Casting answers "who is this?" and supplies the baseline — the character\'s constant voice and default prosody (identity). Emotion answers "how does this line feel?" and supplies the delta — a small per-line prosody offset (feeling). They compose via the exact baseline + delta math from the prosody lesson: for any line, look up the speaker to get (voice, baseline), classify the line to get an emotion delta, add them to get the final prosody, and hand (voice, final prosody, text) to the engine. Identity is constant per character; feeling varies per line; and because they\'re separate layers they don\'t interfere — you can recast a character (change the baseline) without touching emotion, or retune how fear sounds (change the delta rule) without touching the cast. Below casting, nothing is special: the resolved (voice, prosody, text) triple feeds the same normalization, chunking, caching, and batching as every other line — casting added a lookup, not a code path, exactly like emotion added a function, not a code path. That\'s the elegance of the Part-2 architecture: prosody defines the knobs, casting sets each character\'s baseline position, emotion nudges per line, and all of it collapses into three values (voice, prosody, text) that flow through one uniform pipeline. Each layer is small and independently testable, and they combine by composition rather than by tangling — which is why turning a labeled script into a full, emotionally-varied cast is achievable without the system becoming a mess.'
    }
  ],
  code: {
    title: 'The cast table and voice resolution',
    intro: 'Casting as a registry plus a resolver: speaker label → (voice, baseline), with a safe fallback for unknown labels, feeding the same baseline+delta composition as the prosody and emotion lessons.',
    code: `# The CAST: one row per character. (voice_model, rate, pitch, volume) baseline.
CAST = {
    "luffy":    ("guy",    +13, +12,  0),   # fast, bright, carefree
    "zoro":     ("davis",   -6,  -8,  0),   # slow, low: stoic, weighty
    "nami":     ("jenny",   +4,  +9,  0),   # quick, lively
    "usopp":    ("tony",    +6,  +6,  0),   # big range, animated
    "narrator": ("aria",    -3,  -4,  0),   # even, measured, neutral
}
DEFAULT_VOICE = ("aria", 0, 0, 0)           # safe fallback for unknown labels

def resolve_voice(speaker):
    row = CAST.get(speaker)
    if row is None:
        # unknown label: don't crash — fall back, and flag it so we notice
        print(f"[cast] unknown speaker {speaker!r}; using default voice")
        return DEFAULT_VOICE
    return row

def voice_and_prosody(line):
    # line: {"speaker": ..., "text": ...}
    voice, br, bp, bv = resolve_voice(line["speaker"])
    dr, dp, dv = emotion_delta(line["text"])       # from the emotion lesson
    prosody = (br + dr, bp + dp, bv + dv)           # baseline + delta
    return voice, prosody                           # -> engine, then pipeline

# "luffy" excited  -> guy voice, (13+13, 12+12, 0+12) = (26,24,12): bright & up
# "zoro"  neutral  -> davis voice, (-6,-8,0): low & slow, unmistakably him`,
    notes: [
      'The cast is a table and casting is a lookup — adding a character is one row, recasting is editing one row, and there are zero per-character branches in the pipeline.',
      'resolve_voice never crashes on an unknown label: it falls back to a default AND logs, so a typo\'d or brand-new speaker degrades gracefully instead of breaking the render, and you still find out.'
    ]
  },
  lab: {
    title: 'Resolve a speaker to a voice, with a safe fallback',
    prompt: 'Implement <code>resolve_voice(cast, speaker, default)</code>. <code>cast</code> is a dict of <code>speaker_label → voice_tuple</code>. If <code>speaker</code> is a key in <code>cast</code>, return its tuple. Otherwise return <code>default</code> (do not raise). Then implement <code>compose(baseline, delta)</code> that returns the per-axis sum of two 3-tuples <code>(rate, pitch, volume)</code> — this is the baseline+delta composition. Both functions are tiny; the point is graceful fallback plus composition.',
    starter: `def resolve_voice(cast, speaker, default):
    # return cast[speaker] if present, else default (never raise)
    pass

def compose(baseline, delta):
    # per-axis sum of two (rate, pitch, volume) tuples
    pass`,
    checks: [
      { re: 'def\\s+resolve_voice\\s*\\(', flags: '', must: true, hint: 'Define resolve_voice(cast, speaker, default).', pass: 'resolve_voice defined ✓' },
      { re: 'def\\s+compose\\s*\\(', flags: '', must: true, hint: 'Define compose(baseline, delta).', pass: 'compose defined ✓' },
      { re: '\\.get\\s*\\(|in\\s+cast', flags: '', must: true, hint: 'Look the speaker up safely (dict.get or "in").', pass: 'safe lookup present ✓' }
    ],
    tests: `CAST = {
  "luffy":    ("guy",   13, 12, 0),
  "zoro":     ("davis", -6, -8, 0),
  "narrator": ("aria",  -3, -4, 0),
}
DEF = ("aria", 0, 0, 0)
# known speaker
assert resolve_voice(CAST, "zoro", DEF) == ("davis", -6, -8, 0)
# unknown speaker -> default, no crash
assert resolve_voice(CAST, "buggy", DEF) == DEF
# composition: luffy baseline + excited delta
assert compose((13,12,0),(13,12,12)) == (26,24,12)
# zoro baseline + neutral delta = unchanged
assert compose((-6,-8,0),(0,0,0)) == (-6,-8,0)
print("casting + composition correct")`,
    solution: `def resolve_voice(cast, speaker, default):
    return cast.get(speaker, default)

def compose(baseline, delta):
    return tuple(b + d for b, d in zip(baseline, delta))`,
    notes: [
      'dict.get(speaker, default) is the whole fallback — an unknown label returns the default voice instead of raising KeyError, so one bad speaker label can never break a 600-line render.',
      'compose is the same zip-and-add as the prosody lesson: casting supplies the baseline, emotion supplies the delta, and this one line is where identity and feeling combine.'
    ]
  },
  deepDive: {
    timeMin: 10,
    intro: 'Two casting realities: a limited voice inventory, and keeping a large cast consistent as it grows.',
    sections: [
      {
        h: 'When you have fewer voices than characters',
        p: 'Local voice inventories are finite — a Piper voice pack might have a handful of distinct English speakers — and a big cast can outnumber them. You have three moves, in priority order. First, use every genuinely distinct model you have before reusing any, because model/timbre difference is the strongest distinctness lever. Second, when you must reuse a model, push the two characters sharing it far apart on prosody — a big pitch and rate gap turns "the same voice" into two clearly different registers (think an older and younger sibling from one base voice); this is weaker than separate models but works for secondary characters who don\'t share many scenes. Third, exploit scene context: two similar voices are far less confusable if they rarely speak back-to-back, so if you must double up, pair characters who don\'t co-occur. The one thing NOT to do is spread a cast thin by giving everyone tiny prosody tweaks on one model — that\'s the near-duplicate trap at scale, where nobody is distinct. If the inventory genuinely can\'t cover a large principal cast, that\'s the signal to bring in a cloning engine (next lesson) to mint new distinct voices, or to reconsider whether every minor character needs a unique voice at all — often a few well-cast principals plus a shared "everyone else" voice reads better than nine mushy near-duplicates. Distinctness is a budget; spend it on the characters who carry the show.'
      },
      {
        h: 'Casting consistency as the project grows',
        p: 'A cast is a promise you make to the listener\'s ear — "this timbre is Luffy" — and the moment you break it, comprehension breaks. Two disciplines keep a growing project consistent. First, the mapping must be STABLE and single-sourced: the cast table is the one place a character\'s voice is defined, every render reads from it, and you never recast a character mid-project, because their earlier lines would then sound like a different person and (per the caching lesson) every cached clip keyed on the old voice silently goes stale — a subtle, corrupting kind of bug where old and new renders of the same character disagree. If you truly must recast, treat it as a version bump and re-render ALL of that character\'s lines, not a quiet edit. Second, review distinctness whenever you add characters: a new row that happens to sit close to an existing character reintroduces confusion, so an added cast member should be checked against the current cast (eyes-closed test) before it ships, and adjusted if it collides. The deeper point is that the cast is shared, durable state — like a database schema or an API contract — and it deserves the same care: centralized, stable, versioned, reviewed on change. Casually tweaking a voice "to see if it sounds better" mid-project is the audio equivalent of an un-migrated schema change; it can invalidate work you\'ve already banked. Decide the cast deliberately, hold it, and change it only with intent and a re-render.'
      }
    ]
  },
  quiz: [
    {
      q: 'The best way to model a cast of characters is:',
      options: ['A function per character', 'A lookup table: speaker label → (voice model, baseline prosody), one row each', 'An if/elif chain on speaker name', 'One voice for everyone'],
      correct: 1,
      explain: 'Casting is pure routing — speaker in, (voice, baseline) out. As a table, adding a character is a row, recasting is an edit, and the pipeline has zero per-character branches.'
    },
    {
      q: 'To make two characters most easily distinguishable, you should first:',
      options: ['Pitch one up and one down on the same voice', 'Give them different voice MODELS (different timbre), reaching for pitch/rate only when out of models', 'Make one louder', 'Change the file format'],
      correct: 1,
      explain: 'Timbre (different speaker identity) is far more distinguishable than register. Vary the model first; use prosody offsets on a shared model only as a fallback.'
    },
    {
      q: 'Casting supplies the ______ and emotion supplies the ______, composed as baseline + delta.',
      options: ['delta / baseline', 'baseline (identity: who this is) / delta (feeling: how the line lands)', 'voice / nothing', 'text / voice'],
      correct: 1,
      explain: 'Identity is constant per character (baseline from casting); feeling varies per line (delta from emotion). They stack cleanly because they live in different layers.'
    },
    {
      q: 'An unknown speaker label (no cast row) should:',
      options: ['Crash the render', 'Fall back to a sensible default voice — and ideally log it so you catch typos/new labels', 'Use a random voice each time', 'Skip the line'],
      correct: 1,
      explain: 'Graceful degradation: return a default voice instead of raising, and flag it. One bad or new label should never break a whole render, but you should still find out.'
    },
    {
      q: 'Why must the speaker→voice mapping stay stable for the project\'s life?',
      options: ['It runs faster', 'Recasting mid-project makes a character\'s earlier lines sound like someone else and silently invalidates every cached clip keyed on the old voice', 'Stability is only aesthetic', 'It saves disk space'],
      correct: 1,
      explain: 'The cast is a promise to the ear. Changing it mid-way breaks recognition and staleness the cache. If you must recast, version it and re-render all that character\'s lines.'
    }
  ],
  pitfalls: [
    'Writing per-character logic (a function or if/elif per speaker) instead of a table. Reintroduces branches to maintain and scatters the cast. Model it as one readable registry; casting is a lookup.',
    'Near-duplicate voices: several similar-gender, similar-pitch characters tuned only slightly apart. They blur. Vary the MODEL first and spread the cast across the range so adjacent characters contrast.',
    'Crashing on an unknown speaker label. A typo or new character shouldn\'t break the render — fall back to a default voice and log it.',
    'Recasting a character mid-project as a quiet edit. Earlier lines now sound like a different person and cached clips go stale. Treat a recast as a version bump and re-render all their lines.',
    'Spreading a limited voice inventory too thin across a big cast. Better to cast a few principals distinctly and share one voice for minor characters than to ship nine mushy near-duplicates.'
  ],
  interview: [
    {
      q: 'Design the layer that turns a speaker-labeled script into a full, distinct-sounding cast. How does it fit with prosody and emotion?',
      a: 'I\'d build casting as a data-driven routing layer — a cast table plus a resolver — that slots between emotion above and the pipeline below. The table has one row per character mapping the speaker label to a (voice model, baseline prosody) pair: the voice is which neural speaker (a distinct Piper/Kokoro voice or a cloned embedding), and the baseline is the character\'s default rate/pitch/volume. Modeling it as data is the core decision: adding a character is a row, recasting is an edit, and the pipeline has zero per-character branches — every line flows through one path and only the looked-up row differs, so a 9-character show is no harder than a 2-character one. The resolver looks up the speaker and, critically, falls back to a default voice (and logs) on an unknown label so a typo can\'t break a render. For distinctness I follow a priority: vary the voice MODEL first because timbre difference is the strongest cue, spread the cast across the available range to avoid near-duplicates, and match each baseline to personality (energetic fast/bright, stoic slow/low, narrator even) as a free extra distinctness axis — validated by the eyes-closed test, can you name each speaker from voice alone. It fits with the other layers by composition: casting supplies the baseline (identity — who this is, constant per character), emotion supplies the delta (feeling — how this line lands, per line), they combine via baseline + delta from the prosody lesson, and the resolved (voice, prosody, text) triple feeds the same normalization/caching/batching pipeline as everything else. So the layers stack without tangling — prosody defines the knobs, casting positions each character, emotion nudges per line — and each is small and independently testable. I\'d also treat the cast as durable, single-sourced state: stable for the project\'s life, versioned if it ever must change, and re-rendered on a recast, because the cast is a promise to the listener\'s ear and to the cache.'
    },
    {
      q: 'You have five principal characters but your local voice pack only has three genuinely distinct voices. What do you do?',
      a: 'I\'d treat distinctness as a budget and spend it on the characters who carry the show, using a priority of moves rather than smearing three voices thinly across five roles. First, assign the three distinct models to the three most prominent principals, since separate models (separate timbres) are the strongest distinctness lever and the leads are where confusion costs the most. For the remaining two, I\'d avoid the near-duplicate trap — the failure mode of giving everyone tiny prosody tweaks on one shared voice, where nobody ends up distinct. Instead: if two characters can share a model, I\'d pick a pair that rarely speak back-to-back (scene context makes similar voices far less confusable when they don\'t co-occur) and push their baselines far apart in pitch and rate so the shared model reads as two clearly different registers — an older/younger-sibling effect. If the characters DO share many scenes and must both be distinct, that\'s the signal to bring in a local cloning engine to mint a genuinely new voice for one of them (next lesson\'s tool), which stays within the local/private constraint. And I\'d question the premise: often not every principal truly needs a unique voice — a few well-cast, clearly distinct leads plus a shared, slightly-tuned voice for the rest reads better and is less fatiguing than five mushy near-duplicates. The anti-goal is uniform mediocrity; I\'d rather have three unmistakable voices and two acceptable ones than five that all blur. Whatever I choose, I\'d lock it into the stable cast table and validate with the eyes-closed test before shipping, and if I add or clone a voice later I\'d check it against the existing cast for collisions.'
    }
  ]
};
