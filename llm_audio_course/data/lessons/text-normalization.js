window.LESSONS = window.LESSONS || {};
window.LESSONS['text-normalization'] = {
  id: 'text-normalization',
  title: 'Say It Right: Normalizing Numbers, Big-O & Acronyms',
  category: 'Part 2 — Killing the Robot',
  timeMin: 35,
  summary: 'The last robot-killer in Part 2 is the least glamorous and the most quietly ruinous: getting the engine to SAY things correctly. A neural voice reading "O(n^2)" as "oh open paren en caret two" or "the API returns 200" as "two hundred" (when you meant "two-oh-oh") shatters the illusion instantly, no matter how good the prosody. Text normalization is the pre-synthesis stage that rewrites written forms into how they should be SPOKEN — numbers, Big-O, symbols, acronyms, units, abbreviations — so the engine voices what you meant. This lesson builds that stage as an ordered pipeline of small, testable rules, and teaches the one principle that keeps it sane: normalization edits the SPOKEN text, never the displayed text, so the caption stays "O(n²)" while the audio says "big oh of n squared."',
  goals: [
    'Explain why normalization is a required stage, not a nicety: engines pronounce written forms literally and often wrong',
    'Identify the high-value categories for technical narration: numbers, Big-O, math symbols, acronyms, units, abbreviations',
    'Build normalization as an ORDERED pipeline of small rules, and know why order matters',
    'Keep display and speech separate: normalize the spoken string only, so captions stay written and audio stays spoken',
    'Decide acronym-by-acronym: spell it out (A-P-I) vs. say it as a word (NASA), and encode that as data'
  ],
  concept: [
    {
      h: 'Normalization is the difference between "said" and "said right"',
      p: [
        'You can nail timbre, prosody, emotion, casting, and laughs, and still have the whole thing collapse on a single mispronounced token — because nothing breaks immersion faster than a confident voice saying the wrong thing. Feed a raw engine technical text and it reads written forms <i>literally</i>: "O(n^2)" becomes "oh open-paren en caret two close-paren," "HTTP 404" might become "four hundred four," "e.g." becomes "ee-jee," "km" becomes "kum," "Dr." becomes "doctor" or "drive" depending on context it can\'t see. Each of these is a record-scratch. <b>Text normalization</b> is the stage that prevents them: it rewrites written text into a form that, when pronounced literally, comes out as what you actually meant.',
        'The key reframe is that normalization is <b>not optional polish</b> — it is a required translation step between "text as written for the eye" and "text as it should sound in the ear," and those two are genuinely different languages. Written text uses symbols, abbreviations, and compressions that readers silently expand ("Big-O of n squared," "status two-oh-oh," "for example," "kilometers"); the engine can\'t silently expand them because it doesn\'t know your intent, so you expand them explicitly, before synthesis. In a technical narration pipeline — exactly the DSA/algorithms content the episodes cover — this stage carries enormous weight, because technical text is <i>dense</i> with the very forms engines get wrong: math, complexity notation, code identifiers, acronyms, numbers.'
      ]
    },
    {
      h: 'The high-value categories, and an ordered pipeline',
      p: [
        'You don\'t normalize everything — you target the categories that (a) appear often in your content and (b) the engine reliably gets wrong. For technical narration the big ones are: <b>numbers</b> (context decides — "200" as "two hundred" vs. "two-oh-oh"; "1990" as a year not a count), <b>Big-O / complexity</b> ("O(n log n)" → "big oh of n log n"), <b>math symbols</b> ("n^2" → "n squared," "≤" → "less than or equal to," "*" → "times" or nothing), <b>acronyms</b> ("API" → "A-P-I," "SQL" → "sequel" or "S-Q-L" — your choice), <b>units</b> ("5km" → "five kilometers," "10ms" → "ten milliseconds"), and <b>abbreviations</b> ("e.g." → "for example," "vs." → "versus," "Dr." → "doctor"). Each category is a small set of rules.',
        'Structure them as an <b>ordered pipeline</b>: the raw string flows through rule after rule, each transforming its piece, output of one feeding the next. Order is not incidental — it\'s load-bearing. You must expand "O(n^2)" into "big oh of n squared" <i>before</i> a generic symbol rule turns "^" into "caret," or you\'ll get "big oh of n caret two." You handle "e.g." before a sentence-splitter treats its periods as sentence ends. You normalize units before a bare-number rule grabs the digits. Getting the sequence right is most of the craft, and the payoff of the pipeline shape is that each rule stays small, single-purpose, and independently testable — you can unit-test "does the Big-O rule turn O(n^2) into big oh of n squared?" in isolation, and compose them with confidence. It\'s the same "small pieces, composed in order" discipline as the rest of the course, applied to text.'
      ]
    },
    {
      h: 'Two rules that keep normalization safe',
      p: [
        'First and most important: <b>normalize the SPOKEN string, never the displayed string.</b> This is the same principle as the laugh rewrite. The reader should still see "O(n²)" and "the API returns 200" on screen — that\'s correct, precise, and how technical writing looks — while the AUDIO says "big oh of n squared" and "the A-P-I returns two hundred." Display and speech are different channels with different correct forms, and normalization operates only on the copy headed for the engine. Mangle the displayed text and you\'ve corrupted your captions to fix your audio; keep them separate and each is right. So the pipeline takes the written line, makes a spoken copy, normalizes that copy, and synthesizes it — the original is untouched.',
        'Second: <b>encode judgment calls as data, decided per item.</b> The classic case is acronyms — some are spelled ("API" → "A-P-I," "SQL" → "S-Q-L," "URL" → "U-R-L") and some are said as words ("NASA," "RAM," "laser"), and there\'s no rule that predicts which; it\'s per-acronym knowledge. So you keep a small dictionary — <code>{"API": "A P I", "NASA": "NASA", "SQL": "sequel"}</code> — and look each up, rather than trying to derive it. Same for context-dependent numbers and ambiguous abbreviations: where a general rule can\'t decide correctly, fall back to a lookup table you curate. This mirrors the whole course\'s "options as data, not clever code" theme: the normalizer is mostly small deterministic rules plus a few curated dictionaries for the judgment calls, and that combination is inspectable, testable, and fixable one entry at a time — a mispronunciation is a one-line dictionary edit, not a code change.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Robin Translates the Ancient Text Aloud',
      text: [
        'The crew finds a stone covered in a script that Robin can read but nobody else can, and Luffy demands she read it OUT LOUD. The problem: the stone is written in the dense, symbol-heavy shorthand of ancient scholars — abbreviations, number-glyphs, special marks — and if Robin just voiced each symbol literally, it\'d be gibberish. "This mark here," she explains, "isn\'t said \'squiggle\' — it MEANS \'ten thousand,\' so I say \'ten thousand.\' This cluster isn\'t three separate letters, it\'s the name of a place, so I say the name. And this little dot-dot means \'that is to say,\' so I say THAT, not \'dot dot.\'" She\'s not reading the symbols; she\'s translating written-shorthand into spoken-meaning as she goes.',
        'Nami notices something clever. "You\'re not changing the STONE, though. The carving still says exactly what it says — you\'re just speaking it differently than it\'s written." Robin nods. "Of course. The writing is for the eye and it\'s perfect as it is; the SPEAKING is a translation of it for the ear. Two different forms of the same meaning." And when she hits a symbol that could mean two things, she doesn\'t guess wildly — she checks it against what she knows: "This glyph is a name here, but a number over there; I have to know which, per symbol, there\'s no single rule." Usopp, impressed: "So reading it aloud is a whole SKILL, not just... saying the shapes." Robin: "Every symbol that\'s written differently than it\'s spoken has to be translated, in the right order, or the whole passage turns to nonsense. The stone stays the stone. The voice does the work."'
      ]
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon Corrects How Penny Reads the Equation',
      text: 'Penny is helping Sheldon rehearse a talk by reading his slides aloud, and she reads "O(n²)" as "oh, open parenthesis, n, little two" and "the CPU has 16GB" as "the see-pee-you has sixteen gee-bee." Sheldon is aghast. "That is not what it SAYS, that is what it LOOKS like. You say \'big O of n squared.\' You say \'sixteen gigabytes.\' And CPU is spelled out — C-P-U — but you\'d say \'NASA,\' not \'en-ay-ess-ay,\' because some acronyms are words and some are letters and there is no rule, you simply must KNOW." Penny: "So the slide is wrong?" "The slide is PERFECT. The slide is for reading. You are speaking. Speaking is a different, correct form of the same thing — and you have to translate it, in the right order, or you\'ll say \'n caret two\' and I will have to leave." Penny, deadpan: "Promise?" Leonard, quietly: "Just say \'n squared,\' it\'s easier for everyone."'
    },
    why: 'Robin and Sheldon are both describing text normalization exactly: written text is a form for the EYE (the stone, the slide — "perfect as it is"), and speaking it is a TRANSLATION into a form for the EAR — you don\'t voice the symbols literally ("caret," "open parenthesis," "gee-bee"), you say what they MEAN ("n squared," "big O of...," "gigabytes"). Crucially the source is never changed ("the stone stays the stone," "the slide is perfect") — only the spoken copy is translated. And the judgment calls (a glyph that\'s a name here and a number there; "CPU" spelled but "NASA" said as a word) have no single rule and must be known per-item — the curated-dictionary insight. Translate written→spoken, in the right order, on the spoken copy only.'
  },
  tech: [
    {
      q: 'Why is normalization a required stage rather than optional polish?',
      a: 'Because written text and spoken text are genuinely different forms of the same meaning, and a TTS engine only does the last step — pronouncing what it\'s given literally — with no ability to silently expand written shorthand the way a human reader does. When you read "O(n²)" you effortlessly translate it to "big O of n squared"; when you read "the API returns 200" you know from context it\'s "two hundred" (a count) or "two-oh-oh" (a status code). The engine can\'t do that translation because it doesn\'t know your intent — it just voices the characters, producing "oh open-paren en caret two" or guessing the wrong number reading. And a single such error is catastrophic to immersion in a way that\'s disproportionate to its size: you can have flawless prosody, emotion, casting, and laughs, and one "en caret two" shatters the illusion completely, because a confident voice saying the wrong thing is jarring precisely because everything else is right. So normalization isn\'t polish you add if there\'s time — it\'s the mandatory translation layer between "text written for the eye" and "text as it should sound," and skipping it means shipping guaranteed record-scratches. It matters even more for technical narration (the algorithms/DSA content here) because technical writing is DENSE with exactly the forms engines mishandle: math notation, complexity, code identifiers, acronyms, units, numbers. In casual prose you might get away with light normalization; in technical prose the normalizer is doing heavy lifting on nearly every sentence. The reframe that makes engineers take it seriously: it\'s not "clean up the text," it\'s "translate written-form to spoken-form," a real translation task the engine cannot do for you.'
    },
    {
      q: 'Why structure normalization as an ORDERED pipeline, and what breaks if the order is wrong?',
      a: 'Because normalization rules interact — the output of one rule is the input to the next, and many rules would corrupt each other\'s work if run in the wrong sequence — so the pipeline order is part of the correctness, not just an implementation detail. Concrete failures: if a generic symbol rule ("^" → "caret") runs before the Big-O rule, then "O(n^2)" first becomes "O(n caret 2)" and the Big-O rule (looking for "n^2") no longer matches, yielding "big O of n caret 2." If a sentence-splitter runs before abbreviation expansion, the periods in "e.g." get treated as sentence boundaries and the line fragments wrongly. If a bare-number rule ("digits → words") runs before the unit rule, "5km" loses its "5" to "five" before "km" can be attached, and you get "five k m." The pattern is that SPECIFIC, structured rules must run before GENERAL, greedy ones, so the specific rule can claim its structured token (O(...), 5km, e.g.) before a general rule shreds it into pieces the specific rule can no longer recognize. Getting this sequence right is most of the craft of a normalizer. The pipeline shape pays off beyond correctness, though: because each rule is a small, single-purpose transform in a defined order, each is independently unit-testable (does the Big-O rule alone turn "O(n^2)" into "big oh of n squared"?), you can add a new category as a new rule slotted at the right position, and you can reason about interactions locally (what runs just before and after this rule) rather than globally. It\'s the same compose-small-pieces-in-order discipline as chunking or the emotion/casting layers — the difference here is that order carries semantic weight, so the sequence itself is something you design and test, not an afterthought.'
    },
    {
      q: 'How do you handle judgment calls like acronyms and context-dependent numbers?',
      a: 'By encoding the judgment as curated DATA looked up per item, rather than trying to derive it with a general rule, because for these categories no correct general rule exists. Acronyms are the clearest case: some are spelled letter-by-letter ("API" → "A-P-I", "SQL" → "S-Q-L", "URL" → "U-R-L", "CPU" → "C-P-U") and some are pronounced as words ("NASA", "RAM", "laser", "scuba"), and there is genuinely no feature of the string that predicts which — it\'s per-acronym cultural knowledge. So you keep a small dictionary mapping each known acronym to its spoken form and look each up; unknown acronyms fall to a default (usually spell-out, which is the safer guess for technical terms). Context-dependent numbers are similar: "200" is "two hundred" as a quantity but "two-oh-oh" as an HTTP status, "1990" is a year not a count, a phone number or version string reads digit-by-digit — where a general "number to words" rule can\'t infer intent, you either use surrounding cues you CAN detect (the word "status" or "HTTP" nearby → status-code reading) or fall back to a lookup/annotation. The design principle is: use deterministic rules where a rule is actually correct (units, math symbols, most abbreviations), and fall back to curated dictionaries exactly where judgment is required and a rule would be wrong. This keeps the normalizer inspectable and fixable at the finest grain — a mispronounced acronym is a one-line dictionary entry, not a code change or a retrain — and it\'s honest about the limits of automation: it doesn\'t pretend a clever regex can know that NASA is a word and API isn\'t. It\'s the same "options as data, not clever code" theme as engine and voice routing: the hard-to-automate decisions live in small readable tables you curate, and the code around them stays simple and general.'
    }
  ],
  code: {
    title: 'An ordered normalization pipeline',
    intro: 'Normalization as a sequence of small rules run in a deliberate order, operating on a SPOKEN copy of the text, with a curated acronym dictionary for the judgment calls. Specific/structured rules run before general ones.',
    code: `import re

ACRONYMS = {              # judgment calls as DATA: spell vs. say-as-word
    "API": "A P I", "SQL": "sequel", "URL": "U R L",
    "CPU": "C P U", "NASA": "NASA", "RAM": "ram",
}
ABBREV = {"e.g.": "for example", "i.e.": "that is",
          "vs.": "versus", "Dr.": "doctor"}

def normalize_spoken(text):
    # ORDER MATTERS: structured/specific rules first, general rules last.
    # 1) Big-O BEFORE the generic caret rule, or "^" becomes "caret".
    text = re.sub(r"O\\(([^)]*)\\)", r"big oh of \\1", text)
    # 2) math powers: n^2 -> n squared, x^3 -> x cubed, else "to the Nth"
    text = re.sub(r"\\^2\\b", " squared", text)
    text = re.sub(r"\\^3\\b", " cubed", text)
    # 3) units BEFORE bare-number handling
    text = re.sub(r"(\\d+)\\s*km\\b", r"\\1 kilometers", text)
    text = re.sub(r"(\\d+)\\s*ms\\b", r"\\1 milliseconds", text)
    # 4) abbreviations (before any sentence splitting on '.')
    for k, v in ABBREV.items():
        text = text.replace(k, v)
    # 5) acronyms via the curated dictionary (word-boundary matched)
    for k, v in ACRONYMS.items():
        text = re.sub(rf"\\b{k}\\b", v, text)
    return text

# displayed stays written; only the SPOKEN copy is normalized:
displayed = "O(n^2) is slow; the API returns 200 in 5km, e.g. a scan."
spoken    = normalize_spoken(displayed)
# spoken -> "big oh of n squared is slow; the A P I returns 200 in
#            5 kilometers, for example a scan."`,
    notes: [
      'The Big-O rule runs BEFORE the caret/power rules on purpose — reorder them and "O(n^2)" degrades to "big oh of n caret 2". Order is correctness here, not style.',
      'Acronyms and abbreviations are curated dictionaries, not derived — because no rule predicts "API"→spell vs "NASA"→word. A mispronunciation is a one-line data edit.'
    ]
  },
  lab: {
    title: 'Build a small ordered normalizer',
    prompt: 'Implement <code>normalize_spoken(text, acronyms)</code> applying these rules IN THIS ORDER: (1) replace <code>O(...)</code> — the letter O followed by parentheses — with <code>"big oh of " + inside</code> (use regex <code>O\\(([^)]*)\\)</code> → <code>"big oh of \\1"</code>); (2) replace <code>^2</code> (at a word boundary) with <code>" squared"</code> and <code>^3</code> with <code>" cubed"</code>; (3) replace <code>e.g.</code> with <code>"for example"</code> and <code>vs.</code> with <code>"versus"</code>; (4) for each <code>key,val</code> in the <code>acronyms</code> dict, replace the whole-word acronym with its value. Return the normalized string. The order guarantees Big-O is expanded before the caret would otherwise be read literally.',
    starter: `import re

def normalize_spoken(text, acronyms):
    # 1) O(...) -> big oh of ...   2) ^2/^3 -> squared/cubed
    # 3) e.g./vs. abbreviations    4) acronyms from the dict (word-boundary)
    pass`,
    checks: [
      { re: 'def\\s+normalize_spoken\\s*\\(', flags: '', must: true, hint: 'Define normalize_spoken(text, acronyms).', pass: 'normalize_spoken defined ✓' },
      { re: 'big oh of', flags: '', must: true, hint: 'Expand O(...) to "big oh of ...".', pass: 'Big-O rule present ✓' },
      { re: 'squared', flags: '', must: true, hint: 'Turn ^2 into " squared".', pass: 'power rule present ✓' },
      { re: '\\\\b|acronyms', flags: '', must: true, hint: 'Use the acronyms dict with word boundaries.', pass: 'acronym lookup present ✓' }
    ],
    tests: `AC = {"API": "A P I", "NASA": "NASA"}
# Big-O + power, in order
assert normalize_spoken("O(n^2) is slow", AC) == "big oh of n squared is slow"
# nested-ish content preserved
assert normalize_spoken("O(n log n) sort", AC) == "big oh of n log n sort"
# abbreviation
assert normalize_spoken("fast vs. slow", AC) == "fast versus slow"
# acronym spelled vs word, from data
assert normalize_spoken("the API called NASA", AC) == "the A P I called NASA"
# cubed
assert normalize_spoken("x^3 grows", AC) == "x cubed grows"
# no partial-word acronym clobber
assert normalize_spoken("APIs everywhere", AC) == "APIs everywhere"
print("normalizer correct")`,
    solution: `import re

def normalize_spoken(text, acronyms):
    text = re.sub(r"O\\(([^)]*)\\)", r"big oh of \\1", text)
    text = re.sub(r"\\^2\\b", " squared", text)
    text = re.sub(r"\\^3\\b", " cubed", text)
    text = text.replace("e.g.", "for example").replace("vs.", "versus")
    for k, v in acronyms.items():
        text = re.sub(rf"\\b{re.escape(k)}\\b", v, text)
    return text`,
    notes: [
      'The Big-O substitution runs first so "O(n^2)" is captured as a unit before the caret rule touches it — reordering these two lines breaks the "n squared" result. Order is the lesson.',
      'The \\b word boundaries on the acronym pass are what keep "APIs" from becoming "A P Is" — whole-word matching, so plurals and substrings survive. Acronyms come from the dict, so spell-vs-word is a data decision.'
    ]
  },
  deepDive: {
    timeMin: 10,
    intro: 'Two deeper issues: numbers really need context, and where normalization sits relative to chunking and caching.',
    sections: [
      {
        h: 'Numbers are the hardest category, because they need intent',
        p: 'Every other category has a fairly stable mapping, but numbers are genuinely ambiguous and the right reading depends on intent the text doesn\'t always encode. "200" is "two hundred" as a quantity, "two-oh-oh" as an HTTP status, "two hundred" or "two zero zero" as a room number depending on convention. "1990" is "nineteen ninety" as a year but "one thousand nine hundred ninety" as a count. "3.14" is "three point one four", "v2.0" is "version two point oh", "1/2" is "one half" or "January second" or "one over two". "007" is "double-oh seven". A phone number, a version, an IP address, a year, a count, a decimal, a fraction, an ordinal — all written with the same digits, all spoken differently, and no universal rule disambiguates them. The practical strategy is layered: use detectable context cues where they exist (the word "status" or "HTTP" near a 3-digit number → status-code reading; a "v" prefix → version; a "%" → percent; a "$" → currency), fall back to the most common reading for the domain (in technical narration, standalone integers are usually counts), and provide an escape hatch for the author to annotate the rare case the rules can\'t infer (e.g. a markup or a per-script overrides dictionary that says "here, 200 means two-oh-oh"). The lesson is intellectual honesty about the limit: unlike Big-O or units, numbers can\'t be fully automated because the information needed (what the number MEANS) sometimes simply isn\'t in the text, and a good normalizer combines rules, domain defaults, and a manual override for the residue rather than pretending one regex handles all numbers.'
      },
      {
        h: 'Where normalization sits: before chunking, before caching',
        p: 'Normalization\'s position in the overall pipeline is deliberate and has consequences for the stages after it. It must run BEFORE sentence chunking (Part 3), because chunking splits on punctuation and normalization changes punctuation — expanding "e.g." removes periods that would otherwise be misread as sentence ends, and expanding "Dr. Smith" prevents a spurious split after "Dr". Normalize first, then chunk the clean spoken text. It must also run BEFORE caching (Part 3), and this is subtle but important: the cache key is a hash of the exact SPOKEN text handed to the engine, so normalization has to be settled before the key is computed, or you\'ll cache under the raw form and get inconsistent hits. A consequence is that changing a normalization rule changes the spoken text, which changes the hash, which correctly invalidates the cache for affected lines — so a normalizer fix automatically triggers re-rendering exactly the lines it touched, which is the behavior you want (the caching lesson makes this precise). The clean mental model for the whole front-end is a fixed order: raw written line → normalize to spoken form → chunk into sentences → hash each chunk for the cache → synthesize misses. Normalization is the first real transformation, and everything downstream assumes it\'s already happened, which is why it lives at the front and why display/spoken separation matters — the displayed original is preserved for captions while the normalized spoken form is what flows through chunking, caching, and synthesis.'
      }
    ]
  },
  quiz: [
    {
      q: 'Text normalization is best described as:',
      options: ['Optional polish applied if there\'s time', 'A required translation from written-for-the-eye forms to how they should be SPOKEN, before synthesis', 'A way to compress audio', 'Fixing the model\'s pronunciation weights'],
      correct: 1,
      explain: 'Written and spoken are different forms of the same meaning; the engine only pronounces literally. Normalization does the translation the engine can\'t, and one missed token shatters immersion.'
    },
    {
      q: 'Why must the normalization rules run in a specific order?',
      options: ['It runs faster sorted', 'Rules interact — a general rule (^ → "caret") run before a specific one (O(n^2) → "big oh of n squared") corrupts it', 'Order is arbitrary', 'Alphabetical order is required'],
      correct: 1,
      explain: 'Specific/structured rules must claim their token before general/greedy rules shred it. Run "^"→"caret" first and the Big-O rule no longer matches "n^2". Order is correctness.'
    },
    {
      q: 'The single most important safety rule for normalization is:',
      options: ['Always use regex', 'Normalize the SPOKEN string only — leave the displayed text (captions) as written', 'Delete all punctuation', 'Normalize the displayed text too'],
      correct: 1,
      explain: 'Display and speech are different channels. The reader still sees "O(n²)"; the audio says "big oh of n squared." Mangling the display to fix the audio corrupts your captions.'
    },
    {
      q: 'Acronyms like "API" (spelled) vs "NASA" (said as a word) are handled by:',
      options: ['A clever regex that predicts which', 'A curated dictionary looked up per acronym, because no rule predicts spell-vs-word', 'Always spelling them out', 'Always saying them as words'],
      correct: 1,
      explain: 'There\'s no string feature that predicts it — it\'s per-acronym knowledge. Encode it as data (a lookup table); a mispronunciation becomes a one-line dictionary edit.'
    },
    {
      q: 'Which category genuinely can\'t be fully automated, because it needs intent the text may not encode?',
      options: ['Units (5km → five kilometers)', 'Numbers ("200" = two hundred? two-oh-oh? a year?)', 'Big-O notation', 'Math powers (n^2 → n squared)'],
      correct: 1,
      explain: 'Same digits, many spoken forms (count, status, year, version, phone). Use context cues + domain defaults + a manual override for the residue — one regex can\'t know what a number MEANS.'
    }
  ],
  pitfalls: [
    'Skipping normalization as "polish." One "en caret two" or wrong number reading shatters otherwise-perfect narration. It\'s a required translation step, especially for technical text.',
    'Getting the rule order wrong: running a general symbol rule before a specific structured rule, so "O(n^2)" degrades to "big oh of n caret 2". Specific rules first, general rules last.',
    'Normalizing the DISPLAYED text, corrupting your captions to fix your audio. Normalize the spoken copy only; keep the written original for display.',
    'Trying to derive acronym pronunciation with a rule. Spell-vs-word is per-acronym knowledge — use a curated dictionary, and default unknown ones to spell-out.',
    'Pretending one regex handles all numbers. Numbers need intent (count vs status vs year vs version); combine context cues, domain defaults, and a manual override for the ambiguous residue.'
  ],
  interview: [
    {
      q: 'Your technical narration voice reads "O(n²)" as "oh open paren en caret two." Design the fix as a system, not a one-off.',
      a: 'That symptom means there\'s no normalization stage, so I\'d build one — a required pre-synthesis translation layer from written-for-the-eye forms to how they should be spoken. First the framing: the engine only pronounces literally and can\'t silently expand shorthand the way a reader does, so I have to do that expansion explicitly before synthesis; it\'s a translation task, not cleanup. I\'d structure it as an ordered pipeline of small, single-purpose rules operating on a SPOKEN copy of each line, targeting the categories that are frequent in technical content and reliably mispronounced: Big-O/complexity, math symbols and powers, units, abbreviations, acronyms, and numbers. Order is load-bearing and part of correctness: structured/specific rules run before general/greedy ones — expand "O(n^2)" to "big oh of n squared" BEFORE any generic "^ → caret" rule, expand abbreviations before sentence-splitting touches their periods, handle "5km" before a bare-number rule grabs the digits. Each rule stays independently unit-testable, so I can assert "Big-O rule turns O(n^2) into big oh of n squared" in isolation. For the judgment calls I encode data, not clever code: a curated acronym dictionary (API→spell, NASA→word, since no rule predicts which), and for numbers a layered strategy of context cues plus domain defaults plus a manual override for the ambiguous residue, because a number\'s spoken form depends on intent the text may not encode. Two safety rules throughout: normalize the spoken string only so captions stay "O(n²)" while audio says "big oh of n squared," and position the stage at the front of the pipeline — before chunking (which splits on punctuation normalization changes) and before caching (whose key is the hash of the final spoken text). The result is a small, ordered, testable normalizer where a new mispronunciation is fixed by adding a rule at the right position or a one-line dictionary entry — not a code rewrite — and where fixing a rule automatically re-renders exactly the lines it changes.'
    },
    {
      q: 'How does normalization interact with the caching and chunking stages, and why does order across stages matter?',
      a: 'Normalization has to run first, before both chunking and caching, and getting that cross-stage order right is what keeps the whole front-end consistent. Before chunking, because chunking splits text on sentence punctuation and normalization CHANGES that punctuation: expanding "e.g." or "i.e." removes periods that would otherwise be misread as sentence boundaries, and expanding "Dr. Smith" prevents a bogus split after "Dr". If you chunked first, you\'d split on punctuation that normalization was about to remove, fragmenting sentences wrongly — so you normalize to a clean spoken form, then chunk that. Before caching, because the cache key is a hash of the exact spoken text sent to the engine, and that text must be fully settled — normalized — before you compute the key; otherwise you\'d key on the raw written form and get inconsistent or missed hits between runs. There\'s an elegant consequence: because the key derives from the normalized spoken text, changing a normalization rule changes the spoken output, which changes the hash, which correctly invalidates the cache for exactly the affected lines — so a normalizer fix automatically triggers re-rendering just the lines it touched, no manual cache-busting. So the fixed pipeline order is: raw written line → normalize (spoken copy) → chunk into sentences → hash each chunk → synthesize the misses → cache by key. Order across stages matters for the same reason order WITHIN normalization matters — each stage consumes the output of the previous one and assumes prior transformations are already applied. Everything downstream of normalization assumes it\'s already happened, which is also why the display/spoken separation lives here: the written original is preserved for captions, while the normalized spoken form is the single source of truth that flows through chunking, caching, and synthesis, keeping keys stable and captions correct simultaneously.'
    }
  ]
};
