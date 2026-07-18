window.LESSONS = window.LESSONS || {};
window.LESSONS['prosody-rate-pitch-volume'] = {
  id: 'prosody-rate-pitch-volume',
  title: 'Prosody: The Rate, Pitch & Volume Knobs That Kill the Robot',
  category: 'Part 2 — Killing the Robot',
  timeMin: 35,
  summary: 'A modern neural voice is already not robotic — so why does default output still sound flat and "read aloud"? Because a flat delivery is a prosody choice, not a technical limit: the model happily speaks every line at the same speed, the same pitch, the same loudness, and sameness is exactly what the ear hears as robotic. This lesson is the three knobs that fix it — rate (how fast), pitch (how high), volume (how loud) — what each one actually does to a waveform, how they map to the percentage/Hz settings you already saw in the episode pipeline, and the single rule that separates "alive" from "cartoon": small, consistent, purposeful adjustments per voice and per line, never big random ones. Get these three right and 80% of the robot is gone before you touch emotion or laughs.',
  goals: [
    'Explain why identical rate/pitch/volume on every line is what the ear labels "robotic," even from a good model',
    'Define what rate, pitch, and volume each change physically, and read the "+13%/+12Hz/+0%" style settings from the real pipeline',
    'Set a sensible per-voice baseline (a character\'s "default" prosody) as distinct from per-line adjustments',
    'Apply the small-and-purposeful rule: subtle offsets that add life vs large offsets that sound like a chipmunk or a drunk',
    'Recognize prosody as the foundation the next three lessons (emotion, casting, laughs) all build on'
  ],
  concept: [
    {
      h: 'Robotic is a prosody problem, not a model problem',
      p: [
        'It is tempting to think "robotic" means "low-quality synthesis" — buzzy, metallic, obviously fake. Modern neural voices cleared that bar years ago; a default Piper or Kokoro line is clean and human in <i>timbre</i>. And yet a whole script read start-to-finish still sounds like a machine. The reason is <b>prosody</b> — the melody and rhythm of speech: how fast you go, how your pitch rises and falls, how loud you get. Default TTS applies the <i>same</i> prosody to every line — same speed, same pitch center, same loudness — and that relentless sameness is precisely the cue the human ear has learned to call "robot." Real people never speak two sentences identically; a machine reading a list does.',
        'So the fix is not a better model — it is <b>varying the prosody on purpose</b>. This is the same discovery you already made in practice: the episode narration only came alive once Luffy talked faster and higher (carefree, energetic) while Nami\'s pitch and speed shifted with what she was describing. Those were prosody edits, expressed as the humble settings <code>rate</code>, <code>pitch</code>, and <code>volume</code>. This lesson unpacks exactly what those three do, so the edits stop being guesswork and become a controllable dial. Everything expressive in Part 2 — emotion, character casting, laughs — is built out of these three primitives; master them first.'
      ]
    },
    {
      h: 'The three knobs, physically',
      p: [
        '<b>Rate</b> is how fast the words come — speaking tempo. Turn it up and syllables get shorter and closer together; turn it down and speech stretches out with more time per word. It reads as energy and urgency: fast = excited, nervous, playful; slow = calm, sad, weighty, deliberate. In the pipeline it\'s a percentage offset from the voice\'s normal speed: <code>+13%</code> means 13% faster than default, <code>-7%</code> means 7% slower. Rate is the single most powerful knob for feel, because pace <i>is</i> emotion — the same words rushed vs. dragged are two different sentences.',
        '<b>Pitch</b> is how high or low the voice sits — the fundamental frequency of the vocal cords, measured in Hertz (Hz). Raise it and the voice brightens and lightens (excitement, youth, tension, a question); lower it and it darkens and steadies (calm, authority, sadness, dread). In the pipeline it\'s an offset in Hz: <code>+12Hz</code> nudges the whole voice up a bit, <code>-7Hz</code> down. A little goes a long way — a few Hz is a mood; a lot is a different person or a cartoon. <b>Volume</b> is loudness — amplitude of the waveform, as a percentage offset: <code>+0%</code> is default, positive is louder/more present (emphasis, confidence, alarm), negative is softer (intimacy, uncertainty, trailing off). Volume is the subtlest of the three and usually the finishing touch, not the main move. Three knobs, three physical properties — tempo, frequency, amplitude — and every "personality" you heard is a specific combination of them.'
      ]
    },
    {
      h: 'Baseline per voice, adjustment per line',
      p: [
        'There are really two layers of prosody, and keeping them separate is what makes a large script manageable. The first is a <b>per-voice baseline</b> — the character\'s default way of speaking, applied to <i>every</i> one of their lines. Luffy\'s baseline is faster and a touch higher than neutral because he is always energetic; a calm narrator\'s baseline might be a hair slower and lower. This is set once per character and is what makes them recognizable line to line — it\'s the constant that says "this is Luffy" before any single line\'s content is considered. In the real pipeline this is exactly the 4-tuple per voice: <code>("en-US-GuyNeural", "+13%", "+12Hz", "+0%")</code> — a name and a baseline rate/pitch/volume.',
        'The second layer is a <b>per-line adjustment</b> — a further nudge on top of the baseline for <i>this specific line\'s</i> content: a scary sentence gets a little faster and higher, a solemn one slower and lower. This is what the next lesson (emotion) automates. The mental model is <b>baseline + delta</b>: the character\'s constant personality, plus a small situational offset per line. Crucially both layers follow the same rule and it is the most important sentence in this lesson: <b>keep the numbers small, consistent, and purposeful.</b> A few percent and a few Hz add life; ±40% and ±40Hz make a chipmunk or a slurring drunk. The goal is a voice that varies like a person having a normal day, not one doing impressions. When in doubt, use less — subtlety is what sounds real.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Usopp Learns to Tell the Story, Not Just Say It',
      text: [
        'Usopp is practicing a tall tale on the deck, and the first run is a disaster — not because the words are wrong, but because he says every single one at the exact same speed, the same flat pitch, the same volume. "And then the giant goldfish appeared and we nearly died and it was terrifying and also I defeated it," all in one gray monotone. Nami winces. "Usopp, that\'s the most boring near-death experience I\'ve ever heard, and I was THERE." He tries again, and Robin coaches him with three simple dials. "The scary part — speed up and pitch up, let the fear leak into how fast you talk. The calm before it — slow down, drop your voice, make us lean in. And the big reveal — get LOUDER on the word that matters, softer on the throwaway bits."',
        'The second run is a different story entirely — same words, completely alive. Fast and high when the goldfish looms, a hush before it strikes, a booming shout on "I defeated it," a modest mutter on the parts he\'s exaggerating. Luffy is on the edge of the barrel, completely sold. Robin smiles. "You didn\'t change the tale. You changed the TELLING — how fast, how high, how loud. And notice you didn\'t go insane with it — you\'re not squeaking like a mouse or crawling at one word a minute. Small shifts, in the right places, on purpose. That\'s the whole trick." Usopp, delighted: "So I was always a great storyteller, I just needed... three knobs." Nami: "Don\'t push it."'
      ]
    },
    sitcom: {
      show: 'How I Met Your Mother',
      title: 'Barny Reads the Same Line Three Ways',
      text: 'Barney is coaching Ted, who just delivered a pickup line so flat it "sounded like a hostage reading a ransom note." "Ted. The words are FINE. The delivery is a robot. Watch." Barney says the exact same sentence three times. Once slow and low: it sounds bored, dead. Once fast and high and loud: it sounds unhinged, manic. And then — the third time — a normal pace with a little lift on the important word, a slight slow-down at the end, one word landed a touch louder. It sounds like an actual charming human being. "SAME WORDS, Ted. All I moved was speed, pitch, and volume. Too little, you\'re a robot. Too much, you\'re a cartoon. The magic is in the middle — small moves, on purpose." Ted: "So the secret is... not much?" Barney: "The secret is the RIGHT not-much." Marshall, from the couch: "He\'s not wrong, which is the worst part."'
    },
    why: 'Usopp and Barney both discover the exact thesis of this lesson: the WORDS were never the problem — the flat, identical delivery was. The fix is the three prosody knobs — rate (speed), pitch (high/low), volume (loud/soft) — moved deliberately: faster/higher for fear and excitement, slower/lower for calm and weight, louder on what matters. And both stories hammer the small-and-purposeful rule: too little is a robot, too MUCH is a cartoon (a squeaking mouse, a manic weirdo), and the craft lives in the middle — subtle, consistent, intentional offsets. That is precisely baseline-plus-delta prosody, the foundation every expressive trick in Part 2 is built on.'
  },
  tech: [
    {
      q: 'If the neural voice already sounds human, why does an unedited script still sound robotic?',
      a: 'Because timbre and prosody are different things, and modern models nail the first while defaulting to a dead version of the second. Timbre is the voice\'s tone quality — is it buzzy and metallic (old robotic TTS) or clean and human? Neural models solved that; a single default line sounds like a real person. Prosody is the melody and rhythm across the line and across the script — pace, pitch movement, loudness dynamics — and by default the model applies the SAME prosody to every line: same speed, same pitch center, same volume, sentence after sentence. Human speech never does that; we constantly vary pace and pitch with meaning and mood, even in ordinary conversation. So a full script read with identical prosody per line hits the ear as uncanny sameness, and "sameness that a person would never produce" is exactly what we label robotic. The tell is scale-dependent: one default sentence sounds fine, but a paragraph or a whole episode of them exposes the flatness, because the ear is comparing lines and finding them eerily identical. The fix therefore isn\'t a better model (timbre is already good) — it\'s reintroducing the variation a person naturally has, via the rate/pitch/volume knobs, per voice and per line. That\'s why "kill the robot" is a prosody project, not a model-shopping project.'
    },
    {
      q: 'What does each knob physically change, and how do the "+13%/+12Hz/+0%" settings map to it?',
      a: 'Rate changes speaking tempo — the duration of syllables and the gaps between them. Higher rate = shorter, more tightly packed syllables (reads as energy/urgency/excitement or nervousness); lower rate = stretched syllables with more space (reads as calm, sadness, weight, deliberation). It\'s expressed as a percentage offset from the voice\'s normal speed: +13% is 13% faster, -7% is 7% slower. Pitch changes the fundamental frequency — how fast the vocal folds vibrate, i.e. how high or low the voice sits — measured in Hz. Raising it brightens/lightens the voice (excitement, tension, youth, questioning); lowering it darkens/steadies it (calm, authority, sadness, dread). It\'s an absolute-ish offset in Hz: +12Hz nudges the whole voice up, -7Hz down; a few Hz is a mood, tens of Hz is a different person. Volume changes amplitude — loudness — as a percentage offset: +0% is default, positive is louder and more present (emphasis, alarm, confidence), negative is softer (intimacy, uncertainty, trailing off). So a setting like ("+13%", "+12Hz", "+0%") reads directly as "13% faster, 12Hz higher, normal loudness" — the recipe for an energetic, upbeat character (this is essentially Luffy\'s baseline). The mapping is deliberately human-legible: you can look at a tuple and predict how the character will sound, which is what makes prosody a controllable dial rather than a black box.'
    },
    {
      q: 'What is the practical difference between a per-voice baseline and a per-line adjustment, and why separate them?',
      a: 'A per-voice baseline is the character\'s default prosody, applied to every line they speak — it\'s their constant personality in sound. Luffy\'s baseline is faster and slightly higher than neutral (he\'s always energetic); a grave narrator\'s baseline might be slightly slower and lower. It\'s set once per character (the rate/pitch/volume in the voice tuple) and it\'s what makes a character recognizable from line to line regardless of content. A per-line adjustment is a further, smaller nudge for a specific line\'s content or emotion — a scary sentence gets a touch faster/higher, a solemn one slower/lower — computed per line (this is what the emotion lesson automates). Separating them matters for three reasons. First, composability: the effective prosody is baseline + delta, so you can reason about and tune each layer independently — change Luffy\'s overall energy in one place (baseline) without touching any per-line logic, or change how "fear" sounds everywhere (delta rule) without editing each character. Second, consistency: the baseline guarantees a character sounds like themselves across hundreds of lines, while the delta lets individual lines breathe — you get identity AND variation instead of choosing one. Third, maintainability at scale: a 600-line script is unmanageable if every line\'s prosody is hand-set from scratch, but very manageable as "per-character baseline (a handful of tuples) plus a per-line rule (one function)." The layered model is what lets prosody scale from a demo sentence to a full production without becoming a spreadsheet of magic numbers.'
    }
  ],
  code: {
    title: 'Baseline + delta: composing prosody',
    intro: 'The two-layer model as code — a per-voice baseline tuple plus a per-line delta, composed into the final rate/pitch/volume the engine receives. This is the exact shape the episode pipeline uses.',
    code: `# Per-VOICE baseline: the character's constant personality.
# (voice_name, rate%, pitch_Hz, volume%)
VOICES = {
    "luffy":    ("guy",   +13, +12, 0),   # fast, bright, energetic
    "narrator": ("aria",   -3,  -4, 0),   # a hair slow + low: calm, weighty
    "nami":     ("jenny",  +4,  +9, 0),   # lively default
}

# Per-LINE delta: a small, purposeful nudge for this line's mood.
DELTAS = {
    "excited": (+13, +12, +12),   # faster, higher, louder
    "fear":    ( +3, +10,  -7),   # a touch faster/higher, quieter (tense hush)
    "calm":    ( -6,  -6,  -4),   # slower, lower, softer
    None:      (  0,   0,   0),   # neutral: baseline only
}

def prosody_for(voice, mood=None):
    base = VOICES[voice]
    dr, dp, dv = DELTAS[mood]
    rate   = base[1] + dr        # baseline + delta, per axis
    pitch  = base[2] + dp
    volume = base[3] + dv
    # small-and-purposeful: clamp so no line ever goes cartoonish
    rate   = max(-30, min(30, rate))
    pitch  = max(-30, min(30, pitch))
    volume = max(-30, min(30, volume))
    return (fmt(rate), fmt(pitch), fmt(volume))

def fmt(n):                       # engine wants "+13%" / "+12Hz" style strings
    return f"{n:+d}"

# nami describing a scary problem -> baseline + fear delta:
#   rate +4+3=+7, pitch +9+10=+19, volume 0-7=-7  ->  ("+7","+19","-7")`,
    notes: [
      'The whole expressive system is baseline + delta, clamped. Baseline = who the character is; delta = how this line feels; the clamp is the small-and-purposeful rule made mechanical so no line can ever go chipmunk.',
      'Notice the "fear" delta is a quieter, tense hush (volume -7), not a loud scream — subtlety. And the same delta applied over any character\'s baseline produces "that character, afraid," which is why the layers compose.'
    ]
  },
  lab: {
    title: 'Compose baseline + delta into final prosody',
    prompt: 'Implement <code>prosody_for(baseline, delta)</code>. Both are <code>(rate, pitch, volume)</code> integer tuples. Return a new tuple where each axis is <code>baseline + delta</code>, but <b>clamped</b> to the range <code>-30..30</code> inclusive on every axis (the small-and-purposeful rule: no line may exceed ±30). So for axis value <code>v</code>, return <code>max(-30, min(30, v))</code>. Return the three clamped ints as a tuple <code>(rate, pitch, volume)</code>.',
    starter: `def prosody_for(baseline, delta):
    # per-axis: baseline + delta, then clamp to [-30, 30]
    pass`,
    checks: [
      { re: 'def\\s+prosody_for\\s*\\(', flags: '', must: true, hint: 'Define prosody_for(baseline, delta).', pass: 'prosody_for defined ✓' },
      { re: 'min\\s*\\(|max\\s*\\(', flags: '', must: true, hint: 'Clamp each axis with min/max to [-30, 30].', pass: 'clamping present ✓' },
      { re: '\\+', flags: '', must: true, hint: 'Add baseline + delta per axis.', pass: 'addition present ✓' }
    ],
    tests: `def clamp(v): return max(-30, min(30, v))
# neutral delta -> baseline unchanged
assert prosody_for((13,12,0),(0,0,0)) == (13,12,0)
# nami baseline + fear delta
assert prosody_for((4,9,0),(3,10,-7)) == (7,19,-7)
# excited pushes up but stays legal
assert prosody_for((13,12,0),(13,12,12)) == (26,24,12)
# clamp kicks in: 13+25=38 -> 30
assert prosody_for((13,12,0),(25,25,25)) == (30,30,25)
# negative clamp: -20 + -20 = -40 -> -30
assert prosody_for((-20,-20,-20),(-20,-20,-20)) == (-30,-30,-30)
print("prosody composition correct")`,
    solution: `def prosody_for(baseline, delta):
    def clamp(v):
        return max(-30, min(30, v))
    return tuple(clamp(b + d) for b, d in zip(baseline, delta))`,
    notes: [
      'zip over the two tuples applies baseline + delta per axis in one line; the clamp enforces the small-and-purposeful rule mechanically so the pipeline literally cannot produce a cartoon voice.',
      'This tiny function is the seam the emotion, casting, and laughs lessons all plug into — they only ever supply new baselines (casting) or new deltas (emotion); the composition stays exactly this.'
    ]
  },
  deepDive: {
    timeMin: 10,
    intro: 'Two things the three knobs can\'t do alone — intonation contour and pauses — and why they still matter here.',
    sections: [
      {
        h: 'Global knobs vs. the contour within a line',
        p: 'Rate, pitch, and volume as we\'ve used them are GLOBAL to a line — they shift the whole sentence up, faster, louder. Real prosody also has CONTOUR: pitch and pace move WITHIN a sentence — rising at the end of a question, falling at the end of a statement, stressing one key word and gliding over function words. A single per-line pitch offset can\'t express "rise on the last word"; it moves everything uniformly. Two things bridge the gap in practice. First, the model already supplies a lot of natural contour on its own — feed it a well-punctuated question and a good neural voice will do the terminal rise for you, because it learned intonation from data; your global offset just shifts that whole natural contour up or down. Second, where you need finer control, the lever is the TEXT and its punctuation, not the numeric knobs: a comma, a question mark, an em-dash, or splitting a run-on into two sentences changes where the model puts stress and breath. So the mental model is layered — the model handles intra-line contour from punctuation, and your three knobs set the overall register and energy on top. Reaching for markup like SSML pitch-contour tags is possible in some engines, but for local pipelines the high-leverage move is almost always "punctuate the text well and set sane global offsets," not hand-drawing a pitch curve.'
      },
      {
        h: 'The fourth knob nobody lists: silence',
        p: 'Pace is not only how fast the words are — it\'s also the PAUSES between and within them, and silence is a prosodic tool as powerful as the other three. A beat before a punchline, a breath between clauses, a longer gap between paragraphs: these are what make speech feel considered and human rather than a breathless wall. In a local pipeline you get pauses two ways. The gentle way is punctuation — commas, periods, ellipses, and paragraph breaks all cause the model to insert natural micro-pauses, so how you write and split the text directly shapes rhythm (another reason text normalization and sentence chunking, coming in Part 2 and 3, are prosody tools too). The deliberate way is at the audio layer — because you render one clip per line, you control the GAP between clips at playback, and you can insert a short silence before a dramatic line or after a reveal by padding the audio or timing the next clip. This is why "one clip per line" is quietly an expressive choice, not just an engineering one: it hands you the seams between lines as places to breathe. The lesson: when a delivery feels rushed or robotic even after tuning rate/pitch/volume, the missing ingredient is often not a knob value but a pause — add the silence and the same words suddenly land.'
      }
    ]
  },
  quiz: [
    {
      q: 'A default line from a good neural model sounds fine, but a whole script sounds robotic. Why?',
      options: ['The model timbre is bad', 'Every line gets identical prosody (same rate/pitch/volume), and that sameness is what the ear calls robotic', 'The sample rate is too low', 'It needs a bigger GPU'],
      correct: 1,
      explain: 'Timbre is already human; the flatness is prosodic sameness. People never speak identical lines, so a script of them sounds like a machine. The fix is varying prosody per line.'
    },
    {
      q: 'Rate, pitch, and volume respectively change:',
      options: ['Language, accent, and gender', 'Speaking tempo, fundamental frequency (high/low), and loudness (amplitude)', 'File format, bitrate, and channels', 'The engine, the model, and the vocoder'],
      correct: 1,
      explain: 'Rate = how fast (tempo), pitch = how high/low (frequency in Hz), volume = how loud (amplitude). Three physical properties you combine into personality.'
    },
    {
      q: 'The setting ("+13%", "+12Hz", "+0%") means:',
      options: ['A different voice model', '13% faster, 12Hz higher, normal loudness — an energetic, upbeat delivery', '13Hz, 12%, 0 seconds', 'Louder by 13, quieter by 12'],
      correct: 1,
      explain: 'Rate +13% (faster), pitch +12Hz (higher/brighter), volume +0% (default). That combination reads as energetic and upbeat — essentially Luffy\'s baseline.'
    },
    {
      q: 'The single most important rule for setting these knobs is:',
      options: ['Bigger numbers sound more expressive', 'Small, consistent, purposeful adjustments — too little is a robot, too much is a cartoon', 'Always maximize pitch for clarity', 'Randomize every line for variety'],
      correct: 1,
      explain: 'A few percent and a few Hz add life; ±40 makes a chipmunk or a drunk. Craft lives in small, deliberate offsets — subtlety is what sounds real.'
    },
    {
      q: 'The relationship between a per-voice baseline and a per-line adjustment is best described as:',
      options: ['They\'re the same thing', 'baseline + delta: the character\'s constant personality plus a small situational nudge for this line', 'The baseline overrides the delta always', 'The delta replaces the baseline'],
      correct: 1,
      explain: 'Effective prosody = baseline (who the character always is) + delta (how this specific line feels). Separating the layers gives you identity and variation, and it scales.'
    }
  ],
  pitfalls: [
    'Cranking the numbers for "more expression": ±40% rate or ±40Hz pitch produces a chipmunk or a slurring drunk, not emotion. Small offsets (single-digit to low-double-digit) are what read as human — clamp to enforce it.',
    'Setting per-line prosody from scratch on every line. Unmaintainable past a demo. Use baseline (per character, a few tuples) + delta (one per-mood rule), composed — identity and variation without a spreadsheet of magic numbers.',
    'Forgetting the fourth knob — silence. When a line still feels rushed after tuning rate/pitch/volume, the fix is usually a pause (punctuation or a gap between clips), not another knob value.',
    'Trying to force intra-line contour (a rising question, a stressed word) with a single global pitch offset. Global knobs shift the whole line uniformly; contour comes from good punctuation and the model\'s learned intonation — fix the text, not the number.'
  ],
  interview: [
    {
      q: 'A stakeholder says the generated narration "sounds robotic" even though you\'re using a modern neural voice. How do you diagnose and fix it?',
      a: 'First I\'d separate timbre from prosody, because "robotic" is ambiguous and the two have completely different fixes. If the timbre itself is buzzy or metallic, that\'s a model/vocoder problem and I\'d change engines. But with a modern neural voice the timbre is almost always fine — a single line sounds human — and the complaint is really about prosody: the delivery is flat because every line is being rendered with identical rate, pitch, and volume. I\'d confirm by listening to one line in isolation (sounds fine) versus a paragraph (sounds eerily same-y); that scale dependence is the signature of a prosody problem, not a model problem. The fix is to reintroduce the variation a real speaker has, in two layers. Per-voice baseline: give each character a default rate/pitch/volume that matches their personality, so an energetic character is consistently faster and brighter and a grave one slower and lower — this alone differentiates voices and kills a lot of the flatness. Per-line delta: nudge each line a little by its content or emotion — faster/higher for excitement or fear, slower/lower for solemnity — composed on top of the baseline. I\'d keep every offset small and purposeful (single digits to low double digits, clamped) because the failure mode on the other side is a cartoon, not more expression. And I\'d check for missing pauses — often "rushed and robotic" is solved by punctuation and small gaps between clips rather than any knob. Net: it\'s a prosody-tuning task — baseline plus delta plus breath — not an engine upgrade, and I\'d demo before/after on the same words to make that concrete.'
    },
    {
      q: 'How would you structure prosody control so it scales from a demo to a 600-line production script?',
      a: 'As two composable layers plus a hard safety clamp, so the whole system is a handful of tuples and one function rather than 600 hand-tuned lines. Layer one is a per-character baseline: a small table mapping each voice to its default (rate, pitch, volume) — the character\'s constant personality. Layer two is a per-line delta: a single rule (or small table) that maps a line\'s mood/content to a small offset — excited, fearful, calm, neutral each map to a (Δrate, Δpitch, Δvolume). The effective prosody for any line is baseline + delta, computed by one prosody_for() function, and I clamp each axis to a sane range (e.g. ±30) so no combination can ever produce a chipmunk — the small-and-purposeful rule enforced mechanically. This structure scales because the two axes of variation are factored: to change a character\'s overall energy I edit one baseline tuple and every one of their lines updates; to change how "fear" sounds across the whole cast I edit one delta and every fearful line updates; adding a character is one new baseline row. Nothing is duplicated, and there are no per-line magic numbers to maintain. It also composes cleanly with the rest of Part 2 — casting supplies baselines, emotion supplies deltas, and both plug into the same seam — and with the pipeline, because the computed prosody is just three values handed to the engine per line, which caches and batches like anything else. The key insight I\'d emphasize is that prosody at scale is a factoring problem: get the baseline/delta decomposition right and a 600-line script is as manageable as a 6-line demo.'
    }
  ]
};
