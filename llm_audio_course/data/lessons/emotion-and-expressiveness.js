window.LESSONS = window.LESSONS || {};
window.LESSONS['emotion-and-expressiveness'] = {
  id: 'emotion-and-expressiveness',
  title: 'Emotion Per Line: Nami Fears the Problem, Loves the Answer',
  category: 'Part 2 — Killing the Robot',
  timeMin: 40,
  summary: 'Prosody gave you the knobs; emotion is deciding, automatically and per line, which way to turn them. This is the exact problem the episode pipeline solved for Nami: one character, but the wrong feeling on every line — she was reading a terrifying problem and a triumphant solution in the same flat tone. The fix is per-line emotion classification: look at what each line is actually saying, label it (fear on the problem, excitement on the solution, neutral otherwise), and map that label to a prosody delta. This lesson builds the whole small machine — a keyword-based classifier, an emotion→delta table, and the "mixed is wrong" insight that makes it work — so a single voice can carry a genuine emotional arc without a human hand-tagging 600 lines.',
  goals: [
    'Explain why "one emotion setting for a character" is wrong, and emotion must be decided per line from content',
    'Build a simple, inspectable keyword classifier that labels a line fear / excited / neutral',
    'Map each emotion label to a prosody delta and compose it with the character baseline (from the prosody lesson)',
    'Understand the Nami case precisely: fear on problems, excitement on solutions — opposite deltas, same voice',
    'Know when keyword classification is enough and when to reach for something better (and its risks)'
  ],
  concept: [
    {
      h: 'Emotion is per line, not per character',
      p: [
        'A natural first instinct is to assign each character one emotional setting — "Nami is anxious," so make her voice tense everywhere. That is exactly what went wrong in the episodes and it is worth stating as a rule: <b>a character is not one emotion.</b> Nami describing a broken, dangerous algorithm should sound afraid; Nami revealing the elegant fix should sound thrilled. Same voice, opposite feelings, back to back, because emotion tracks <i>what the line is about</i>, not <i>who is speaking</i>. Bake in one setting and you get the original bug: triumph read like dread, or dread read like a shrug — every line wearing the wrong face.',
        'Worse is the "mixed" trap — trying to make her voice sound "anxious-but-excited" on <i>every</i> line as a compromise. That was the literal note that started this: "fear and excitement mixed" pleases no one, because a blend of both is a clear signal of neither. Real emotion is <b>decisive per moment</b>: afraid <i>here</i>, delighted <i>there</i>, plain in between. So the unit of emotion is the line, and the job is to decide, for each line, which single feeling it carries — then turn the prosody knobs that way. That decision, made automatically across a whole script, is what this lesson builds.'
      ]
    },
    {
      h: 'Classify the line, then map to a delta',
      p: [
        'The machine has two stages, and keeping them separate is the whole design. Stage one is a <b>classifier</b>: text in, an emotion <i>label</i> out — <code>"fear"</code>, <code>"excited"</code>, or <code>None</code> (neutral). Stage two is a <b>mapping</b>: label in, a prosody <i>delta</i> out — the small (Δrate, Δpitch, Δvolume) offset from the last lesson. The two are decoupled on purpose: the classifier decides <i>what</i> the line feels, the mapping decides <i>how</i> that feeling sounds, and you can tune each without disturbing the other. Swap in a smarter classifier later and the deltas still apply; retune how "fear" sounds and every classifier stays valid.',
        'For the classifier, start with the simplest thing that works: <b>keyword counting</b>. Keep a list of fear words (<i>problem, slow, crash, fails, danger, stuck, wrong</i>…) and excitement words (<i>solution, fast, elegant, finally, brilliant, solved, optimal</i>…). Count how many of each appear in the line. More excitement words than fear words → <code>"excited"</code>; more fear than excitement → <code>"fear"</code>; a tie or none → <code>None</code>. It is crude, transparent, deterministic, needs no model or network, and it is <i>exactly</i> what the real pipeline uses — and it works because narration is on-the-nose: a line describing a problem literally contains problem-words, a line describing a solution literally contains solution-words. The mapping then encodes the physical truth from the prosody lesson: fear is a tense, quieter, slightly-faster hush (pitch up from tension, volume down); excitement is faster, higher, louder and open. Opposite deltas, dispatched by content.'
      ]
    },
    {
      h: 'The Nami case, wired end to end',
      p: [
        'Put it together on the actual problem. Nami\'s baseline (from casting) is a lively default. For each of her lines: run the classifier. "This approach re-scans the whole array every step — it\'s painfully <i>slow</i> and <i>crashes</i> on big inputs" → fear words win → label <code>fear</code> → delta (slightly faster, higher, <i>quieter</i>) → a tense, worried delivery. "But with a hash map we get it in one pass — <i>fast</i>, <i>elegant</i>, <i>solved</i>!" → excitement words win → label <code>excited</code> → delta (faster, higher, louder) → a delighted, energized delivery. Same Nami voice, and now the fear lives on the problems and the excitement on the solutions — precisely the note. Lines with no strong signal stay neutral (baseline only), which is correct: not every line is an emotional peak, and forcing emotion onto flat connective tissue is its own kind of robotic.',
        'Two things make this trustworthy at scale. It\'s <b>inspectable</b> — because the classifier is just keyword counts, you can print why any line got its label ("3 fear words, 1 excited → fear") and fix a miss by adding a word to a list, no retraining. And it\'s <b>composable</b> with everything else — the emotion stage only produces a delta, which feeds the exact <code>baseline + delta</code> composition from the prosody lesson, which feeds the same synth/cache/batch pipeline as every other line. Emotion didn\'t add a new code path; it added a small function that decides which delta to use. That is why one modest classifier plus one delta table was enough to give a single voice a real emotional arc across an entire episode.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Nami\'s Weather Report Finally Has Feelings',
      text: [
        'Nami is giving the crew the forecast, and Robin notices something is off — not the facts, the FEELING. "A cyclone is forming to the north, the current is dragging us toward the rocks, we could lose the mast," Nami says, in the exact same bright, chipper tone she then uses for "and there\'s a clear channel to the east that\'ll get us to the island by sundown!" The crew is confused — the deadly part and the good-news part sound identical, so nobody knows when to panic and when to relax. Usopp: "Wait, were we supposed to be scared just now? You sounded THRILLED about the rocks."',
        'Robin fixes it with one idea. "Nami, you don\'t have one voice for the whole report. Listen to each SENTENCE. When you\'re describing a danger — the cyclone, the rocks, the mast — let the fear in: tighter, a little faster, drop your voice like you\'re bracing. When you\'re describing the way OUT — the clear channel, the safe harbor — let the relief and excitement out: faster, brighter, up. And the boring bits in between? Just say them plain." Nami tries again and the whole crew tracks it perfectly — they flinch at the rocks and grin at the channel, because her voice told them which was which. Nami blinks. "So I was fighting to sound one way the whole time, and the trick was to sound DIFFERENT depending on what I\'m actually saying." Robin: "You fear the problem. You love the solution. Let your voice admit it, one sentence at a time." Luffy, who understood none of the weather but all of the feelings: "That was way better! I was scared AND happy!"'
      ]
    },
    sitcom: {
      show: 'The Office',
      title: 'Michael Reads the Announcement Two Ways',
      text: 'Michael has to deliver an all-hands with two halves — "corporate is cutting the budget" and "but nobody is getting laid off" — and his first attempt says both in the same manic, upbeat game-show voice, so the office hears "BUDGET CUTS!" as good news and "no layoffs" as a threat. Pam gently intervenes. "Michael, the two parts are opposite feelings. The budget cut — that\'s the scary part, so slow down, get quieter, sound like you mean it. The no-layoffs part — THAT\'S the good news, so let yourself be relieved and happy there." He tries again: grave and hushed on the cut, genuinely warm and up on the reassurance. For once the room reacts correctly — worried, then relieved — instead of just confused. Michael, amazed at himself: "So I don\'t pick ONE way to say the whole thing. I let each part... feel like what it is." Pam: "Yes. Exactly that." Jim, to camera: "He\'ll forget by Thursday. But for eleven seconds, he got it."'
    },
    why: 'Both stories are the Nami fix exactly: the mistake is giving a whole report ONE emotional setting (or a confusing mix), and the fix is deciding emotion per SENTENCE from what that sentence is about — fear/gravity on the danger or the budget cut, excitement/relief on the way out or the reassurance, plain in between. "You fear the problem, you love the solution — let your voice admit it, one sentence at a time" is the literal thesis: a per-line classifier (is this a danger-sentence or a good-news-sentence?) driving opposite prosody deltas on a single voice, with neutral lines left alone.'
  },
  tech: [
    {
      q: 'Why not just set one emotion per character? What breaks?',
      a: 'Because emotion tracks what a line is ABOUT, not who is speaking, so a single per-character setting is wrong on most lines by construction. A character says frightening things and reassuring things and neutral things in the same scene; one setting can only match one of those, so the other two come out with the wrong face — triumph read as dread, dread read as a shrug. That is literally the bug the Nami work fixed: her problem-lines and solution-lines were getting the same delivery, so the emotional information was destroyed — the listener couldn\'t hear which was the danger and which was the escape. The even worse "fix" is to average — make the voice sound anxious-AND-excited on every line as a compromise — because a blend of two emotions signals neither; the listener just hears "vaguely off." Real emotion is decisive per moment: afraid here, delighted there, plain in between, and the transitions between them are exactly what carries meaning. So the unit of emotion has to be the line, not the character. The character supplies a constant baseline (their personality — that part IS per character, from casting), but the emotional delta on top has to be recomputed per line from the line\'s content. Set it once per character and you\'ve frozen the one thing that must vary, guaranteeing most lines wear the wrong emotion.'
    },
    {
      q: 'How does the keyword classifier actually work, and why is something this crude good enough?',
      a: 'It maintains two small word lists — fear words (problem, slow, crash, fails, danger, stuck, wrong, expensive…) and excitement words (solution, fast, elegant, finally, brilliant, solved, optimal, clean…) — lowercases the line, counts how many words from each list appear, and decides by comparison: more excited than fear → "excited", more fear than excited → "fear", tie or zero → None (neutral). That\'s the entire algorithm: two lists, two counts, a comparison. It\'s good enough for this domain for a specific reason — narration is on-the-nose. A sentence whose JOB is to describe a problem almost always literally contains problem-vocabulary, and a sentence selling a solution literally contains solution-vocabulary, because that\'s what the sentence is saying. The signal you need is sitting right there in the words. And the crudeness buys real advantages: it\'s deterministic (same line, same label, every run — which matters for reproducible renders and caching), fully transparent (you can print the exact counts and explain every decision), needs no model, no GPU, and no network (staying true to the whole course\'s local/private constraint), and it\'s trivially tunable — a misclassified line is fixed by adding one word to a list, instantly, no retraining. It will miss sarcasm, negation ("this is NOT slow"), and subtle emotion — but for narration that names its problems and solutions plainly, those cases are rare, and when they matter you can special-case them or escalate. Starting with the simplest thing that works, and only reaching for complexity when the simple thing demonstrably fails, is the right engineering order — and here the simple thing genuinely works.'
    },
    {
      q: 'Why keep the classifier and the delta mapping as two separate stages?',
      a: 'Because they answer two different questions — WHAT does this line feel, and HOW should that feeling sound — and decoupling them makes each independently tunable, testable, and swappable. Stage one (classifier) is text → label; stage two (mapping) is label → prosody delta. Keeping them separate means: you can improve the classifier (add words, or later swap in a smarter model) without touching how emotions sound, and you can retune how "fear" sounds — maybe it needs to be quieter, or less fast — by editing one delta, and every fearful line updates regardless of how it was classified. It also makes the system testable in two clean halves: unit-test the classifier on labeled example lines (does "it crashes on big inputs" get "fear"?), and separately verify the deltas produce sensible prosody. And it composes with the prosody lesson\'s baseline+delta model without modification — the classifier just chooses WHICH delta, and the same composition math applies. If you fused them (text straight to prosody numbers), you\'d lose all of that: you couldn\'t reason about "what emotion did it detect" separately from "was the prosody right," a misclassification and a bad delta would be indistinguishable, and swapping the classifier would mean rewriting the prosody logic too. The label is a clean, human-readable intermediate representation — "fear," "excited," neutral — and having that named middle layer is what keeps the emotion system inspectable and maintainable. It\'s the same discipline as the engine router: a small, legible decision in the middle, with the heavy/variable parts on either side.'
    }
  ],
  code: {
    title: 'Per-line emotion: classify, then map to a delta',
    intro: 'The exact two-stage machine from the episode pipeline: a keyword classifier that labels each line, and a table mapping the label to a prosody delta that composes with the character baseline. Pure Python, deterministic, no model.',
    code: `FEAR_WORDS = {"problem","slow","crash","crashes","fails","fail","danger",
              "stuck","wrong","expensive","broken","risky","worst","bug"}
EXCITED_WORDS = {"solution","fast","faster","elegant","finally","brilliant",
                 "solved","optimal","clean","simple","beautiful","instant","best"}

def classify_emotion(text):
    words = set(text.lower().replace(",", " ").replace(".", " ").split())
    fear = len(words & FEAR_WORDS)
    exc  = len(words & EXCITED_WORDS)
    if exc > fear:  return "excited"     # solution-lines
    if fear > exc:  return "fear"        # problem-lines
    return None                          # neutral: tie or no signal

# Stage two: label -> prosody delta (Δrate, Δpitch, Δvolume)
EMOTION_DELTA = {
    "fear":    ( +3, +10,  -7),   # tense hush: a little faster/higher, QUIETER
    "excited": (+13, +12, +12),   # open & up: faster, higher, LOUDER
    None:      (  0,   0,   0),   # neutral: baseline only
}

def emotion_delta(text):
    return EMOTION_DELTA[classify_emotion(text)]

# Nami, same voice, opposite feelings:
#   "it's painfully slow and crashes on big inputs"  -> fear    -> quiet & tense
#   "with a hash map it's fast and elegant, solved!" -> excited -> loud & bright
# The delta then composes with her baseline via prosody_for() (prev lesson).`,
    notes: [
      'Two lists, two counts, a comparison — the whole classifier. It\'s deterministic and inspectable: you can print (fear, exc) counts to explain any label, and fix a miss by adding one word.',
      'Fear is deliberately QUIETER (volume -7), not louder — dread is a tense hush, not a shout. Excitement is louder and open. Opposite deltas, dispatched purely by what the line says.'
    ]
  },
  lab: {
    title: 'Classify a line\'s emotion by keyword counts',
    prompt: 'Implement <code>classify_emotion(text, fear_words, excited_words)</code>. Lowercase the text and split it into words (split on whitespace is fine; the tests use space-separated words). Count how many distinct words appear in <code>fear_words</code> and how many in <code>excited_words</code> (both are sets). Return <code>"excited"</code> if the excited count is strictly greater, <code>"fear"</code> if the fear count is strictly greater, and <code>None</code> on a tie or when both are zero. Count distinct matching words (use a set of the line\'s words), so a word repeated twice counts once.',
    starter: `def classify_emotion(text, fear_words, excited_words):
    # count distinct fear vs excited words; strictly-greater wins; else None
    pass`,
    checks: [
      { re: 'def\\s+classify_emotion\\s*\\(', flags: '', must: true, hint: 'Define classify_emotion(text, fear_words, excited_words).', pass: 'classify_emotion defined ✓' },
      { re: '\\.lower\\s*\\(', flags: '', must: true, hint: 'Lowercase the text before matching.', pass: 'lowercasing present ✓' },
      { re: 'None', flags: '', must: true, hint: 'Return None on a tie or no signal.', pass: 'neutral case present ✓' }
    ],
    tests: `F = {"slow","crash","problem","fails","danger"}
E = {"fast","elegant","solved","solution","optimal"}
# solution-line
assert classify_emotion("with a hash map it is fast and elegant and solved", F, E) == "excited"
# problem-line
assert classify_emotion("this is painfully slow and it fails on a big problem", F, E) == "fear"
# neutral: no signal
assert classify_emotion("next we open the file and read a line", F, E) is None
# tie -> None
assert classify_emotion("it is slow but the fix is fast", F, E) is None
# distinct-count: repeated word counts once (still fear: slow,crash vs fast)
assert classify_emotion("slow slow crash but fast", F, E) == "fear"
# case-insensitive
assert classify_emotion("SLOW and it CRASHES here", F, E) == "fear"
print("emotion classifier correct")`,
    solution: `def classify_emotion(text, fear_words, excited_words):
    words = set(text.lower().split())
    fear = len(words & fear_words)
    exc = len(words & excited_words)
    if exc > fear:
        return "excited"
    if fear > exc:
        return "fear"
    return None`,
    notes: [
      'Set intersection (words & fear_words) counts distinct matches in one expression, and set(text.lower().split()) makes repeats count once — exactly the "distinct words" rule.',
      'Strictly-greater comparisons with a None tie-break is what makes "it is slow but the fix is fast" correctly neutral: one signal each cancels, and forcing an emotion on a genuinely mixed line is the very bug we\'re avoiding.'
    ]
  },
  deepDive: {
    timeMin: 12,
    intro: 'When keywords aren\'t enough — negation and sarcasm — and what it costs to go beyond them.',
    sections: [
      {
        h: 'The failure modes: negation, sarcasm, and mixed lines',
        p: 'Keyword counting is bag-of-words: it sees which emotional words are present, not how they\'re used, so three cases fool it. Negation — "this is NOT slow, it never crashes" — is full of fear words but means the opposite; the classifier counts "slow" and "crashes" and mislabels it fear. Sarcasm — "oh GREAT, another brilliant solution that fails instantly" — mixes excited and fear vocabulary with an ironic meaning the words don\'t carry literally. And genuinely mixed lines — "the slow version is a problem but the fast fix is elegant" — contain both, and the classifier will pick whichever list has more hits or fall to neutral on a tie. For narration these are rare because expository writing is direct: it says "this is slow" not "this is not fast," and it separates problem-sentences from solution-sentences rather than cramming both into one clause. But when they do occur, the cheap mitigations are worth knowing: a small negation check (if "not"/"never"/"no" precedes an emotion word within a couple of tokens, flip or drop that word\'s contribution) catches the most common negations; splitting a compound line at "but"/"however" and classifying each half separately handles many mixed lines (and matches how you\'d actually deliver them — dread then relief). The honest framing is that these are the known limits of the simplest tool, you can see them coming, and you patch the specific ones that matter rather than pretending the tool is more than it is.'
      },
      {
        h: 'Going beyond keywords, and why you usually shouldn\'t (yet)',
        p: 'The next rung up is a small local text-classification model — a lightweight sentiment/emotion classifier that runs on CPU and reads meaning rather than counting words, so it handles negation and context that keywords miss. That\'s a legitimate upgrade AND it stays within the course\'s local/private constraint if you pick a model that runs offline. But weigh the costs honestly before reaching for it. You lose determinism unless you pin the model and seed it — the same line could get a different label across versions, which complicates caching and reproducible renders. You lose transparency — "the model said fear" is far harder to debug than "3 fear words vs 1 excited word," and when it\'s wrong you can\'t just add a word to a list, you\'re into fine-tuning or prompt-wrangling. You add a dependency, memory, and latency to what was a microsecond of set math. And crucially, you often don\'t gain much on THIS task, because narration\'s emotion signal really is mostly lexical — the words say what the line feels. So the disciplined path is: ship the keyword classifier, measure where it actually fails on your real scripts, and escalate to a model only if the failures are frequent and costly enough to justify the loss of determinism and transparency. This is the same "simplest thing that works, escalate on evidence" principle from engine routing — the emotion classifier is a place where the simple thing is genuinely enough far more often than engineers expect, and reaching for a model first is a common, avoidable over-engineering.'
      }
    ]
  },
  quiz: [
    {
      q: 'Why is "set one emotion per character" the wrong approach?',
      options: ['It\'s too slow', 'Emotion tracks what a line is ABOUT, not who speaks — so most lines end up with the wrong feeling', 'Characters can\'t have emotions', 'It uses too much memory'],
      correct: 1,
      explain: 'A character says scary, reassuring, and neutral things in one scene. One setting matches one of them and mislabels the rest — exactly the Nami bug where problems and solutions sounded identical.'
    },
    {
      q: 'The "fear and excitement mixed" note was a problem because:',
      options: ['Mixing is technically impossible', 'A blend of two emotions signals neither — real emotion is decisive per line (afraid here, thrilled there)', 'It used the wrong voice model', 'Mixing requires a GPU'],
      correct: 1,
      explain: 'Averaging two emotions produces "vaguely off," not both. The fix is deciding one emotion per line from its content — fear on problems, excitement on solutions.'
    },
    {
      q: 'The keyword classifier decides a line is "fear" when:',
      options: ['The line is long', 'It contains more fear words than excitement words', 'The character is Nami', 'It ends in a period'],
      correct: 1,
      explain: 'Count fear vs excitement words; strictly more fear → "fear", strictly more excited → "excited", tie/none → neutral. Crude, deterministic, transparent — and enough for on-the-nose narration.'
    },
    {
      q: 'Keeping the classifier and the delta mapping as two separate stages lets you:',
      options: ['Run faster only', 'Tune what a line feels (classifier) independently of how that feeling sounds (delta), and swap either without touching the other', 'Avoid using Python', 'Skip the baseline'],
      correct: 1,
      explain: 'text→label and label→delta answer different questions. The named label is a clean, inspectable middle layer, so each half is independently testable and swappable.'
    },
    {
      q: 'A known weakness of the keyword classifier is:',
      options: ['It needs the internet', 'Negation and sarcasm — "this is NOT slow" is full of fear words but means the opposite', 'It only works in Japanese', 'It can\'t be tuned'],
      correct: 1,
      explain: 'Bag-of-words sees words, not usage. Negation/sarcasm/mixed lines fool it — rare in direct narration, patchable with a negation check or splitting on "but," and only worth a model if failures are frequent.'
    }
  ],
  pitfalls: [
    'Assigning one emotion per character (or an "anxious-but-excited" mix on every line). Both destroy the emotional information — decide emotion per line from content, and leave genuinely neutral lines neutral.',
    'Fusing classification and prosody into one step (text straight to numbers). You lose the inspectable label; a misclassification and a bad delta become indistinguishable. Keep the two stages separate.',
    'Making "fear" louder. Dread is a tense, quieter hush (volume down); excitement is the loud, open one (volume up). Getting the volume sign backwards makes fear sound like anger.',
    'Reaching for an ML sentiment model first. You lose determinism and transparency for little gain on on-the-nose narration. Ship the keyword classifier, measure real failures, escalate only on evidence.',
    'Forcing emotion onto every line. Not every sentence is a peak; flat connective tissue should stay neutral. Over-emoting is as robotic as under-emoting.'
  ],
  interview: [
    {
      q: 'A single narrator voice needs to sound afraid when describing problems and excited when describing solutions, across a 600-line script. Design the system.',
      a: 'The key realization is that emotion is per line, not per character — the narrator is one voice but each line carries its own feeling based on what it\'s saying — so I\'d build a small two-stage per-line machine on top of the character\'s baseline prosody. Stage one is a classifier: text in, an emotion label out — "fear", "excited", or neutral. I\'d start with the simplest thing that works, keyword counting: a fear-word list (problem, slow, crash, fails, danger…) and an excitement-word list (solution, fast, elegant, solved, optimal…), count distinct matches of each in the line, and label by strict majority — more excited → excited, more fear → fear, tie or none → neutral. This works because narration is on-the-nose: problem-sentences literally contain problem-words and solution-sentences literally contain solution-words, so the signal is right there in the text. It\'s also deterministic (crucial for reproducible renders and caching), fully inspectable (I can print the counts and explain any label), needs no model or network (honoring the local/private constraint), and is fixed by adding a word to a list. Stage two is a mapping from label to a prosody delta: fear → a tense, slightly faster/higher but QUIETER hush; excited → faster, higher, LOUDER and open; neutral → no change. That delta composes with the character\'s baseline via the same baseline+delta math from prosody, and feeds the same synth/cache/batch pipeline as every other line — emotion adds a function, not a new code path. I\'d keep the two stages decoupled so I can retune how fear sounds without touching classification and vice versa. I\'d be upfront about the limits — negation, sarcasm, and mixed lines fool bag-of-words — and handle them by measuring real failures on the actual script, adding a cheap negation check or splitting compound lines on "but," and only escalating to a small local classifier model if failures prove frequent and costly, accepting that I\'d then trade away determinism and transparency. Net: one keyword classifier plus one delta table gives a single voice a genuine emotional arc across the whole script, cheaply and inspectably.'
    },
    {
      q: 'When would you replace the keyword classifier with an ML model, and what do you give up?',
      a: 'Only when I have evidence the keyword classifier fails often enough, on real scripts, to justify the costs — not preemptively, because on on-the-nose narration the lexical signal is usually sufficient and a model is over-engineering. The trigger would be measured: I\'d run the keyword classifier over actual scripts, review its labels, and if a meaningful fraction are wrong in ways that matter — lots of negation ("not slow"), sarcasm, or genuinely mixed clauses that the word-counts get backwards — and cheap patches (a negation check, splitting on "but") don\'t cover them, then a small local text-classification model that reads meaning rather than counting words becomes worth it, provided it runs offline to keep the pipeline private. What I give up is significant and worth stating plainly. Determinism: unless I pin and seed the model, the same line might get a different label across versions, which undermines reproducible renders and content-addressed caching (the cache key would have to include the model version). Transparency and debuggability: "the model said fear" is far harder to reason about than "3 fear words vs 1 excited word," and a wrong label can\'t be fixed by editing a list — I\'m into fine-tuning or prompt engineering. Operational cost: a dependency, memory footprint, and latency added to what was microseconds of set math, multiplied across every line of a large script. And often a small real gain, because the thing the model is better at (context, negation) is exactly the rare case for this domain. So my rule is the same as everywhere else in the system: ship the simplest thing that works, instrument it, and let evidence — not the appeal of using ML — decide the escalation. If I do escalate, I\'d keep the keyword classifier as a fast, deterministic first pass and only invoke the model on ambiguous lines, preserving determinism and speed on the easy majority.'
    }
  ]
};
