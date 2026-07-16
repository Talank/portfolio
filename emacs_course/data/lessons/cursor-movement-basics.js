window.LESSONS = window.LESSONS || {};
window.LESSONS['cursor-movement-basics'] = {
  id: 'cursor-movement-basics',
  title: 'Moving Without Arrow Keys: Char, Word, Line & Buffer Motion',
  category: 'Part 3 — Core Editing',
  timeMin: 30,
  summary: 'Arrow keys work fine in Emacs — but learning the keyboard-native motion commands pays off precisely because they never require moving your hand off the home row, and because they follow one consistent, learnable pattern: Control moves by a small unit, Meta moves by the next unit up. Once that pattern clicks, most of Emacs\'s motion keybindings become predictable rather than memorized one at a time.',
  goals: [
    'Explain what "point" means in Emacs, and why it is more than just a visual cursor',
    'Move by character and by line with C-f/C-b and C-n/C-p',
    'Move by word and by sentence with M-f/M-b and M-a/M-e',
    'Move to the start/end of a line (C-a/C-e), scroll by screen (C-v/M-v), and jump to buffer start/end (M-</M->)',
    'Recognize the Control-vs-Meta "small unit / bigger unit" pattern and use it to predict unfamiliar motion keybindings'
  ],
  concept: [
    {
      h: '"Point": Emacs\'s own precise term for where you are',
      p: [
        'What looks like a blinking cursor is, in Emacs\'s own vocabulary, called <b>point</b> — and this is not just a different word for the same thing purely for tradition\'s sake. Point is a genuine, precise NUMBER: a specific offset into the current buffer\'s text, counted in characters from the beginning. Every motion command in this lesson is really just changing that one number.',
        'This matters directly for lessons right after this one: the next lesson\'s "kill region" and "yank" operate specifically relative to point (and mark, a second remembered position, covered next lesson) — understanding point precisely now is not academic, it is the exact foundation those very next commands are built on.'
      ]
    },
    {
      h: 'Character and line motion: C-f/C-b, C-n/C-p',
      p: [
        '<code>C-f</code> (forward-char) and <code>C-b</code> (backward-char) move point one character at a time. <code>C-n</code> (next-line) and <code>C-p</code> (previous-line) move point one line at a time, vertically. Arrow keys do exactly the same thing and work perfectly fine in Emacs — the reason to actually learn C-f/C-b/C-n/C-p is ergonomic, not aesthetic: all four sit right on or near the home row, reachable without your hand ever leaving its normal typing position, while arrow keys require a genuine hand movement away from where your fingers already are.',
        'The letters themselves are a deliberate mnemonic: F for Forward, B for Backward, N for Next (line), P for Previous (line) — genuinely easier to internalize than it looks, specifically because the letters map directly onto the words they stand for.'
      ]
    },
    {
      h: 'Word and sentence motion: M-f/M-b, M-a/M-e — the same keys, one unit bigger',
      p: [
        '<code>M-f</code> (forward-word) and <code>M-b</code> (backward-word) move by a whole WORD instead of a single character — notice these are the EXACT SAME letters as C-f/C-b, just with Meta instead of Control. <code>M-a</code> (backward-sentence) and <code>M-e</code> (forward-sentence) move to the start/end of the current SENTENCE — again, the same letters as C-a/C-e (covered next), just one unit up, with Meta instead of Control.',
        'This is not a coincidence, and noticing it explicitly is genuinely worth the effort: across a huge portion of Emacs\'s motion keybindings, <b>Control moves by a small unit, and Meta moves by the corresponding NEXT unit up</b> — character becomes word, line-start/end becomes sentence-start/end. Once this pattern is internalized, an unfamiliar M- motion keybinding becomes something you can often correctly GUESS rather than something you have to separately memorize from scratch.'
      ]
    },
    {
      h: 'Line, screen, and whole-buffer motion',
      p: [
        '<code>C-a</code> (move to beginning of line) and <code>C-e</code> (move to end of line) — the "a" and "e" are not random either; think of them as the alphabetical start and end, a common (if slightly looser) mnemonic. <code>C-v</code> (scroll down roughly one screen — mnemonically, "view" the next screen) and <code>M-v</code> (scroll up roughly one screen) follow the same Control/Meta pairing pattern as everything else in this lesson, applied to whole-screen scrolling instead of character/word/line motion.',
        '<code>M-<</code> jumps point to the very beginning of the buffer, and <code>M-></code> jumps to the very end — genuinely worth remembering visually, since the <code><</code> and <code>></code> characters themselves suggest "leftmost/earliest" and "rightmost/latest" directly. Between these and the previous section\'s motions, you can now reach any specific point in a buffer, at any granularity, entirely without arrow keys or a mouse.'
      ]
    }
  ],
  conceptFlow: {
    title: 'The Control/Meta motion pattern, laid out as a grid',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Small unit (Control)',
        nodes: [
          { id: 'cf', text: 'C-f\ncharacter forward' },
          { id: 'ca', text: 'C-a\nline start' }
        ]
      },
      {
        label: 'Bigger unit (Meta — same letter)',
        nodes: [
          { id: 'mf', text: 'M-f\nWORD forward' },
          { id: 'ma', text: 'M-a\nSENTENCE start' }
        ]
      },
      {
        label: 'The pattern',
        nodes: [
          { id: 'pattern', text: 'Same letter, same DIRECTION —\nonly the unit size changes' }
        ]
      },
      {
        label: 'Predicting an unfamiliar key',
        nodes: [
          { id: 'predict', text: 'If C-X moves by unit A,\nM-X likely moves by the NEXT unit up' }
        ]
      }
    ],
    steps: [
      { active: ['cf'], note: 'C-f moves forward by the smallest unit: one character.' },
      { active: ['ca'], note: 'C-a moves to a small, local reference point: the start of the current line.' },
      { active: ['mf'], note: 'M-f uses the EXACT SAME letter, f, as C-f — but moves by the next unit up: a whole word.' },
      { active: ['ma'], note: 'M-a likewise reuses the letter a from C-a — but jumps to the next unit up: the start of the current sentence, not just the current line.' },
      { active: ['pattern'], note: 'In both pairs, the letter and the general DIRECTION stayed identical — only the size of the unit being moved by changed, and that size change was entirely driven by which modifier (Control vs Meta) was held.' },
      { active: ['predict'], note: 'This is genuinely predictive, not just a cute pattern: once you know C-f is "forward, small unit," you can correctly GUESS that M-f means "forward, one unit bigger" even before ever looking it up — a real, practical payoff for noticing the pattern explicitly.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Robin\'s Reading Speeds: Letter, Word, and Sentence, All Under Her Control',
      text: 'Robin, working through a genuinely difficult ancient text, does not read at one fixed speed the whole way through — she deliberately shifts GRANULARITY depending on exactly what the moment calls for, and it is worth watching how consistent her shifts actually are. For an especially tricky, ambiguous glyph, she drops all the way down to examining it stroke by stroke, one tiny mark at a time — the smallest possible unit of attention. For an ordinary, already-familiar passage, she reads at the next level up: whole words at a time, not individual letters, moving noticeably faster without losing any real accuracy. And for skimming an entire section to find roughly where a specific topic is discussed, she jumps a level higher still — whole sentences, sometimes whole passages, at a glance. What makes her method genuinely effective, rather than just "reading fast," is that these are not three unrelated skills she separately learned — they are the SAME underlying reading motion, deliberately dialed to a different scale depending on what she actually needs in that specific moment. Chopper, watching her shift speeds seamlessly mid-page without ever seeming to consciously decide to, asks how she does it so fluidly. Robin\'s answer: "It is the same motion at every scale. I am not switching between different skills — I am adjusting how BIG a step that same motion takes, depending on what I actually need right now."'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Recipe-Reading Speeds: Character-by-Character to Whole-Section Skims',
      text: 'Monica, double-checking a recipe card before a genuinely important dinner, does not read at one fixed speed either — and the way she shifts between speeds is oddly systematic once you actually watch for it. For a critical, easy-to-misread measurement (is that a "1" or a "7"?), she drops all the way down to examining it character by character, deliberately slow, the smallest possible unit of attention she has. For an ordinary instruction she has read a hundred times before, she reads at the next level up — whole words, sometimes whole phrases, at a natural pace, without losing anything important. And when she is simply trying to locate roughly WHERE in a long card a specific step is described, she jumps a level higher again — skimming whole sentences, sometimes whole paragraphs, at a glance, specifically to find her place fast rather than to absorb every detail. Rachel, watching her flip between these speeds seamlessly on the exact same card within the span of thirty seconds, asks if that is actually three separate skills or just one thing. Monica\'s answer, without looking up: "One thing. Same motion, different size step, depending on what I actually need to check right now. I am not doing three different things — I am doing one thing at three different scales."'
    },
    why: 'Robin\'s and Monica\'s deliberate shifts between letter-by-letter, word-by-word, and sentence-by-sentence reading are exactly the Control/Meta motion pattern this lesson is built around: the SAME underlying motion (forward, or to a reference point), dialed to a different unit size depending on what is actually needed — never three unrelated skills to separately memorize, just one pattern, applied at a scale you choose in the moment.'
  },
  tech: [
    {
      q: 'Why bother learning C-f/C-b/C-n/C-p at all when arrow keys already work perfectly fine in Emacs?',
      a: 'Arrow keys genuinely work, and using them is not "wrong" — but they require a real, repeated hand movement away from the home row (where your fingers already rest for typing) to a separate cluster of keys, every single time you want to move the cursor even one character. C-f/C-b/C-n/C-p, by contrast, are reachable without your hand ever leaving its normal typing position — a small difference per individual keypress, but one that compounds meaningfully across the literally thousands of cursor movements made in a typical editing session. The payoff is speed and reduced physical strain over sustained use, not some abstract purity about "using Emacs the real way."'
    },
    {
      q: 'Is the Control-vs-Meta "small unit vs bigger unit" pattern a deliberate design choice, or just a coincidence that happens to apply to a few keybindings?',
      a: 'It is a genuinely deliberate, consistently-applied design convention across a large portion of Emacs\'s built-in motion commands, not a coincidence limited to just the handful covered in this lesson — the same letter, reused with Meta instead of Control, tends to mean "the same kind of motion, one unit bigger" throughout Emacs\'s core keybindings (and this convention is often followed by well-designed third-party packages too, precisely because it is such an established, predictable pattern). Recognizing it explicitly is genuinely useful precision, not just a cute observation: it lets you correctly predict what an unfamiliar M- keybinding probably does, based on knowing its Control-based counterpart, rather than needing to look up or memorize every single motion command independently.'
    },
    {
      q: 'Why does it matter that "point" is technically a NUMBER (a buffer offset) rather than just "wherever the cursor visually appears to be"?',
      a: 'Because every motion command in this lesson is, underneath, doing nothing more than changing that one specific number — and because later commands (covered in the very next lesson) that operate on a REGION of text do so by referencing two such numbers: point, and a second remembered position called mark. Understanding point as a precise, numeric buffer position — not a vague visual notion of "where the blinking thing is" — is exactly the mental model needed to understand what "select from here to there" actually means mechanically in Emacs: it is quite literally the span between two specific numbers, point and mark, nothing more mysterious than that.'
    }
  ],
  code: {
    title: 'Motion commands, practiced together',
    intro: 'Open any text buffer with a few paragraphs and try these in sequence.',
    code: `;; Starting anywhere in the middle of a paragraph:

C-f C-f C-f      ; move forward three characters
C-b               ; move back one character

C-n C-n           ; move down two lines
C-p               ; move up one line

M-f               ; jump forward one whole WORD (not just one character)
M-b               ; jump backward one whole word

C-a               ; jump to the START of the current line
C-e               ; jump to the END of the current line

M-a               ; jump to the start of the current SENTENCE
M-e               ; jump to the end of the current sentence

C-v               ; scroll down roughly one screen ("view" the next page)
M-v               ; scroll up roughly one screen

M-<               ; jump all the way to the START of the buffer
M->               ; jump all the way to the END of the buffer

;; Notice: M-f/M-b reuse f/b from C-f/C-b (character -> word).
;; M-a/M-e reuse a/e from C-a/C-e (line -> sentence).
;; Same letters, same direction, one unit bigger each time Meta is held.`,
    notes: [
      'None of these commands modify any text — this whole lesson is purely about MOVING point around, safe to practice freely on any real file.',
      'C-v and M-v scroll by roughly (not exactly) one screen — the precise amount depends on your window\'s current height.'
    ]
  },
  lab: {
    title: 'Write the motion key sequence for each task',
    prompt: 'Write exactly the key sequence for each task below.',
    starter: `# Task: move point forward exactly one character


# Task: move point forward one whole word (not character)


# Task: move point to the very start of the current line


# Task: move point to the start of the current SENTENCE (not just the line)


# Task: jump point all the way to the end of the buffer

`,
    checks: [
      { re: 'C-f(?!\\s*C-f)|^C-f$', flags: 'i', must: true, hint: 'C-f moves forward one character.', pass: 'C-f ✓' },
      { re: 'M-f', flags: '', must: true, hint: 'M-f moves forward one whole word.', pass: 'M-f ✓' },
      { re: 'C-a', flags: '', must: true, hint: 'C-a moves to the start of the current line.', pass: 'C-a ✓' },
      { re: 'M-a', flags: '', must: true, hint: 'M-a moves to the start of the current sentence.', pass: 'M-a ✓' },
      { re: 'M-\\>|M->', flags: '', must: true, hint: 'M-> jumps to the very end of the buffer.', pass: 'M-> ✓' }
    ],
    run: 'Try it for real: open any text file and practice each motion, paying attention to how much further M- versions move compared to their C- counterparts.',
    solution: `# Task: move point forward exactly one character
C-f

# Task: move point forward one whole word (not character)
M-f

# Task: move point to the very start of the current line
C-a

# Task: move point to the start of the current SENTENCE (not just the line)
M-a

# Task: jump point all the way to the end of the buffer
M->`,
    notes: [
      'Notice the C-a/M-a pair and the general pattern this lesson emphasizes: same letter, one unit bigger with Meta.',
      'M-< and M-> use the actual less-than/greater-than characters, not letters — a visual mnemonic for "leftmost" and "rightmost" in the buffer.'
    ]
  },
  quiz: [
    {
      q: 'What is "point" in Emacs terminology?',
      options: ['A visual-only cursor with no underlying data behind it', 'A precise numeric offset into the current buffer\'s text — what later commands like killing a region operate relative to', 'A synonym for "mark" with no real distinction', 'A setting that controls font size'],
      correct: 1,
      explain: 'Point is a genuine number — a buffer offset — not just a vague visual notion of cursor position; later region/kill commands operate directly on this precise value.'
    },
    {
      q: 'Why learn C-f/C-b/C-n/C-p instead of just using arrow keys?',
      options: ['Arrow keys do not actually work in Emacs', 'They stay on or near the home row, avoiding the repeated hand movement arrow keys require', 'They move by larger units than arrow keys', 'There is no real reason; it is purely tradition'],
      correct: 1,
      explain: 'The payoff is ergonomic: these keys are reachable without moving your hand off its normal typing position, unlike arrow keys, which require a real hand movement every time.'
    },
    {
      q: 'What is the relationship between C-f and M-f?',
      options: ['They are unrelated, coincidentally similar-looking commands', 'Same letter, same direction — M-f moves by the next unit up (a word) instead of a single character', 'M-f is a faster version of C-f with no functional difference', 'C-f only works at the start of a line; M-f works anywhere'],
      correct: 1,
      explain: 'M-f reuses the same letter as C-f, moving forward by a WORD instead of a character — a deliberate, consistent Control/Meta "small unit / bigger unit" pattern.'
    },
    {
      q: 'What does M-a do, and how does it relate to C-a?',
      options: ['M-a has no relationship to C-a at all', 'M-a moves to the start of the current SENTENCE, following the same letter-reuse pattern as C-a (start of line)', 'M-a deletes the current line, unlike C-a which just moves', 'M-a and C-a are identical commands'],
      correct: 1,
      explain: 'M-a reuses the letter from C-a (line start) but bumps the unit up to sentence start — the same Control/Meta pattern seen throughout this lesson.'
    },
    {
      q: 'What does M-< do?',
      options: ['Moves point back one character', 'Jumps point to the very beginning of the entire buffer', 'Scrolls down one screen', 'Opens a new buffer'],
      correct: 1,
      explain: 'M-< jumps point all the way to the start of the buffer (M-> jumps to the end) — the < and > characters visually suggest "leftmost" and "rightmost."'
    }
  ],
  pitfalls: [
    'Sticking exclusively with arrow keys out of habit and never building the C-f/C-b/C-n/C-p muscle memory — a real, compounding speed cost across a typical editing session\'s thousands of cursor movements.',
    'Treating each motion keybinding as something to memorize independently, rather than noticing the Control/Meta "small unit, bigger unit" pattern that makes many of them predictable rather than rote.',
    'Confusing "point" (a precise numeric position) with a vague notion of "wherever the cursor looks like it is" — this distinction matters directly for understanding the next lesson\'s region and kill commands.'
  ],
  interview: [
    {
      q: 'Explain what "point" precisely means in Emacs, and why the distinction between point and "the visual cursor" matters for later editing commands.',
      a: 'Point is a specific, numeric offset into the current buffer\'s text — not merely a visual indicator, but real underlying data that Emacs tracks precisely. The visual cursor you see IS the on-screen representation of point\'s current value, but thinking of point specifically as a number matters because later commands operate directly on it: the next lesson\'s region-selection and kill/yank commands work by referencing point alongside a second remembered position (mark), and understanding "select from here to there" as literally "the span between two numeric buffer positions" is the precise mental model those commands are built on, not a looser, purely visual understanding of "where the cursor currently looks like it is."'
    },
    {
      q: 'Describe the Control/Meta motion pattern in Emacs and give an example beyond the two covered directly in this lesson\'s examples, reasoning from the pattern itself.',
      a: 'The pattern: for a large portion of Emacs\'s built-in motion commands, the same letter bound to Control for a SMALL unit of motion is also bound to Meta for the corresponding NEXT unit up — C-f (character forward) becomes M-f (word forward); C-a (line start) becomes M-a (sentence start). Reasoning from the pattern rather than direct memorization: C-e (line end) should, by the same logic, have a Meta counterpart moving by the next unit up from "line" — and indeed M-e (forward-sentence) exists, moving to the end of the current sentence, exactly following the established pattern. This predictive reasoning is precisely the practical value of recognizing the pattern explicitly rather than treating each keybinding as an independent fact to memorize.'
    },
    {
      q: 'Why might someone deliberately choose to learn Emacs\'s keyboard-native motion commands even in a modern context where arrow keys and a mouse are always available?',
      a: 'The ergonomic argument is the honest, practical one: arrow keys require a genuine hand movement away from the home row for every single cursor movement, while C-f/C-b/C-n/C-p (and their word/sentence-level Meta counterparts) stay on or near the keys your fingers already rest on while typing. Individually this difference is trivial; across the literally thousands of cursor movements in a typical extended editing session, it compounds into a real, measurable difference in both speed and physical strain. This is not a purity argument about "the correct way to use Emacs" — arrow keys work identically and there is no functional downside to using them — it is a genuine, evidence-based ergonomic tradeoff worth knowing about, particularly for anyone doing sustained, all-day editing work.'
    },
    {
      q: 'A new Emacs user asks how they are supposed to memorize dozens of seemingly arbitrary motion keybindings. How would you reframe the problem for them?',
      a: 'Reframe it around the Control/Meta pattern rather than rote memorization: a large portion of motion commands follow "same letter, Control for a small unit, Meta for the corresponding bigger unit" — learn the small handful of base letters (f/b for forward/backward, a/e for start/end, n/p for next/previous) and their Control-bound small-unit meanings, and a meaningful fraction of the Meta-bound bigger-unit versions become predictable rather than separately memorized facts. This will not cover literally every keybinding in Emacs, but it meaningfully reduces what needs to be memorized versus reasoned out from a pattern already internalized — turning "dozens of arbitrary facts" into "a handful of base concepts plus one consistent scaling rule."'
    }
  ]
};
