window.LESSONS = window.LESSONS || {};
window.LESSONS['search-and-replace'] = {
  id: 'search-and-replace',
  title: 'Incremental Search & Query-Replace: isearch, M-%, and Regex Search',
  category: 'Part 3 — Core Editing',
  timeMin: 40,
  summary: 'Emacs\'s search is "incremental" — it starts jumping to matches the instant you type each character, not after you press Enter — and its replace is "query" — it asks about each match individually by default, rather than blindly replacing everything at once. Both are genuinely different defaults from most other editors, and both exist for good, deliberate reasons this lesson makes explicit.',
  goals: [
    'Use C-s and C-r for forward and backward incremental search',
    'Repeat a search to the next/previous match, and cancel with C-g back to where the search started',
    'Use M-% (query-replace) to interactively replace matches one at a time with y/n/!/q',
    'Use C-M-s / C-M-r and M-x query-replace-regexp for regex-based search and replace',
    'Explain why Emacs defaults to asking about each match individually rather than replacing everything blindly'
  ],
  concept: [
    {
      h: 'Incremental search: matches jump live, as you type — not after you press Enter',
      p: [
        '<code>C-s</code> starts a forward <b>incremental search</b> (isearch) — and "incremental" is the key word: as you type EACH character, Emacs immediately jumps point to the first match found so far, live, without ever waiting for you to press Enter. Type "fun" and point has already jumped to the first "f", then adjusted as you complete "fu", then "fun" — often landing exactly where you wanted after typing just a few characters, sometimes before you have even finished typing the whole word.',
        '<code>C-r</code> does the identical thing, searching BACKWARD instead of forward. This live, immediate feedback loop is genuinely different from "type your full search term, then press Enter to actually search" — the kind of search most other software defaults to — and once it becomes familiar, it is usually noticeably faster for finding something you can already picture in your head, since you often do not need to finish typing it at all.'
      ]
    },
    {
      h: 'Repeating and cancelling a search',
      p: [
        'While a search is active, pressing <code>C-s</code> AGAIN jumps to the NEXT occurrence forward (repeating the same search term further along) — genuinely useful for stepping through every instance of something one at a time. <code>C-r</code> again, while searching backward, does the equivalent moving further back.',
        '<code>C-g</code> cancels the search — and specifically, it returns point to WHEREVER THE SEARCH STARTED, not just wherever you happened to land mid-search. This is a deliberate design choice: a search is meant to be a safe, freely reversible LOOK around the buffer, not a commitment to actually moving point there — C-g treats the whole search as if it never happened, restoring your original position exactly.'
      ]
    },
    {
      h: 'M-%: query-replace, which asks about each match individually',
      p: [
        '<code>M-%</code> (query-replace) prompts first for a search string, then a replacement string, then walks through every match ONE AT A TIME, pausing at each and asking what to do: <code>y</code> replaces this specific occurrence and moves to the next, <code>n</code> skips this one (leaving it unchanged) and moves to the next, <code>!</code> replaces this AND every remaining match with no further prompting, and <code>q</code> stops entirely, right here, leaving anything not yet reached untouched.',
        'This per-match interactivity is deliberate, not a missing "just replace everything" shortcut (which <code>!</code> provides anyway, the moment you actually want it) — it exists specifically because a blind, unreviewed global replace can silently change something you did not actually intend to change, especially when a search term happens to appear in a context you were not thinking about. Query-replace lets you catch that mid-process, on a match-by-match basis, rather than discovering it only after the fact.'
      ]
    },
    {
      h: 'Regex search and replace: the same commands, one level more powerful',
      p: [
        '<code>C-M-s</code> (isearch-forward-regexp) and <code>C-M-r</code> work exactly like C-s/C-r, except the text you type is interpreted as a REGULAR EXPRESSION rather than a literal string — genuinely the same live, incremental jumping behavior, just matching a pattern instead of exact text. <code>M-x query-replace-regexp</code> is query-replace\'s regex-powered sibling, walking through matches the same y/n/!/q way, but matching (and even replacing using) regex patterns.',
        'The replacement side of query-replace-regexp can reference CAPTURED GROUPS from the search pattern using <code>\\1</code>, <code>\\2</code>, and so on — genuinely powerful for structural transformations, like swapping the order of two captured pieces of text across every match at once, not just substituting one literal string for another. If you have already learned regex elsewhere (character classes, anchors, quantifiers, groups), all of that knowledge applies directly here — Emacs is simply another consumer of the same regex concepts.'
      ]
    }
  ],
  conceptFlow: {
    title: 'query-replace, one match at a time: the actual decision flow',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Setup',
        nodes: [
          { id: 'setup', text: 'M-% old-name <RET> new-name <RET>' }
        ]
      },
      {
        label: 'First match found',
        nodes: [
          { id: 'match1', text: 'Point jumps to match #1,\nprompts: y / n / ! / q ?' }
        ]
      },
      {
        label: 'Your decision, per match',
        nodes: [
          { id: 'yes', text: 'y: replace THIS one,\nmove to next match' },
          { id: 'no', text: 'n: skip THIS one unchanged,\nmove to next match' },
          { id: 'bang', text: '!: replace this AND\nevery remaining match, no more asking' },
          { id: 'quit', text: 'q: stop entirely,\nright here' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'done', text: 'Every reviewed match handled\nexactly as YOU decided, one at a time' }
        ]
      }
    ],
    steps: [
      { active: ['setup'], note: 'query-replace first collects both the search term and the replacement — nothing is touched in the buffer yet at this point.' },
      { active: ['match1'], note: 'Point jumps to the FIRST match, and Emacs pauses right there, waiting for your decision before doing anything to it.' },
      { active: ['yes'], note: 'Pressing y replaces just this specific occurrence, then immediately moves on to search for the next match and pauses there too.' },
      { active: ['no'], note: 'Pressing n leaves this specific occurrence completely untouched, then moves on to the next match — useful when this particular instance turns out to be something you did not actually want changed.' },
      { active: ['bang'], note: 'Pressing ! switches modes entirely: replace this match AND every remaining match from here on, with no further individual prompting — the "I have reviewed enough, just finish it" escape hatch.' },
      { active: ['quit'], note: 'Pressing q stops the whole operation immediately, right where you are — anything already replaced stays replaced, anything not yet reached is left completely untouched.' },
      { active: ['done'], note: 'Whichever combination of y/n/!/q you used, the end result reflects a decision made about EACH match you actually reviewed — not a single, blind, all-or-nothing operation applied without any chance to catch an unintended match along the way.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Robin\'s Live-Narrowing Reading, and Franky\'s Tag-by-Tag Part Rename',
      text: 'Robin, hunting for a specific phrase buried somewhere in an enormous, unindexed archive, does not read the whole document first and only THEN start checking for matches — her eyes narrow in live, letter by letter, as she scans, often recognizing the exact spot she needs after seeing just the first few characters of the phrase, well before the whole thing has even fully registered. If a scan turns out to be leading nowhere useful, she does not carefully retrace her steps back — she simply abandons that particular scan entirely and returns to precisely where she started looking, as though the detour never happened at all. Franky, separately, runs into a genuinely different but related problem: an old part number needs updating across dozens of repair tags scattered through the ship\'s records, but a few of those tags — he already knows, from experience — reference a completely UNRELATED part that just happens to share a similar-looking number, and blindly relabeling every match at once would quietly corrupt those unrelated tags without anyone noticing until much later. So he goes tag by tag instead: for each one, he genuinely LOOKS at it before deciding — update this one, leave that one alone, it is clearly something else — and once he has reviewed enough of them to trust the pattern holds for the rest, he simply commits to updating everything remaining in one motion, no longer needing to individually check each one after that point. Usopp, watching him work through it so methodically instead of just blasting a single global correction across every tag at once, asks why he does not just fix them all in one pass. Franky\'s answer: "Because some of those tags are not actually what they look like at a glance. Checking each one, at least until I trust the pattern, is what keeps me from quietly wrecking something I never meant to touch."'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Live-Narrowing Comic Search, and His Card-by-Card Relabeling',
      text: 'Sheldon, hunting through an enormous, meticulously organized comic-book collection for one specific issue whose exact placement he has half-forgotten, does not check every single box start to finish before narrowing anything down — his search narrows LIVE as he scans shelf labels, often recognizing the right section after reading just the first couple of characters of a label, well before he would have needed to read the whole thing. If a particular shelf turns out to be the wrong lead entirely, he does not painstakingly retrace his path back through everything he just checked — he simply abandons that specific search attempt and returns to exactly where he started looking, as if that detour never happened at all. Separately, and for a genuinely related reason, Sheldon needs to relabel a specific term across dozens of individually catalogued cards — but a handful of those cards, he already knows, reference a DIFFERENT specific edition that merely shares a similar-looking label, and blindly relabeling every match in one blind pass would quietly corrupt those specific cards without him noticing until some later, more painful discovery. So he reviews them one at a time instead: genuinely looking at each card before deciding — relabel this one, leave that one alone, it is clearly a different edition — and once he has reviewed enough of them to trust that the remaining cards all follow the expected pattern, he confidently commits to relabeling everything left in one motion, no longer needing to individually verify each remaining card after that point. Leonard, watching him work through the stack so deliberately instead of just correcting the whole collection in one blind pass, asks why he bothers checking each card individually at first. Sheldon\'s answer, without looking up: "Because some of these cards are not actually what the label alone would suggest. Checking, at least until I trust the pattern holds, is exactly what keeps me from quietly ruining something I never meant to touch."'
    },
    why: 'Robin\'s and Sheldon\'s live, letter-by-letter narrowing (with a clean, no-retracing return to the start if it leads nowhere) is exactly incremental search — jumping as you type, and C-g returning you precisely to where you began. And Franky\'s and Sheldon\'s tag-by-tag, card-by-card review — checking each match individually until confident enough to commit to the rest in one motion — is exactly query-replace\'s y/n/!/q workflow: individual review by default, with a deliberate escape hatch once you have earned the confidence to stop checking.'
  },
  tech: [
    {
      q: 'Why is incremental (live, as-you-type) search generally considered faster than "type your full term, then press Enter" search, beyond just feeling more modern?',
      a: 'Because it eliminates an entire round trip: in a "type then press Enter" search, you have to fully know and correctly type the ENTIRE search term before getting any feedback at all about whether it actually matches what you are looking for, then wait for the search to execute. Incremental search gives feedback after literally every keystroke — meaning you very often reach the exact match you wanted after typing only a FEW characters, well before finishing the whole word, at which point you can simply stop typing and move on, having never needed to type (or even fully recall) the entire term in the first place. The cumulative time saved across many searches in a session, particularly for anything you can only partially remember the exact spelling of, is genuinely significant, not just a stylistic preference.'
    },
    {
      q: 'Why does C-g during an active search return point to where the search STARTED, rather than simply stopping the search at wherever point currently is?',
      a: 'This reflects a deliberate design philosophy: a search is meant to be treated as a safe, freely reversible LOOK around the buffer, not a commitment to having actually moved anywhere. If C-g merely stopped the search wherever it currently was, every search — even ones that turned out to be leading nowhere useful, or were mistyped — would leave you stranded at some arbitrary, unintended position, forcing you to manually navigate back to where you actually meant to be working. By restoring the exact original position on cancel, Emacs lets you explore freely and abandon any unproductive search attempt with zero cost or cleanup required — a genuinely different, more forgiving relationship between "looking around" and "actually committing to move" than software where every search action is treated as a real navigation event.'
    },
    {
      q: 'What is the actual, concrete risk that query-replace\'s default per-match confirmation is protecting against, that a blind "replace all" would not catch?',
      a: 'A search term can legitimately match text in a context you were not actually thinking about when you initiated the replace — renaming a variable called "count" to "total" with a blind global replace-all could also silently corrupt an unrelated word like "discount" or "recount" if those happen to contain the exact same substring, or a comment mentioning "count" in an entirely different sense than the code you actually meant to rename. Query-replace\'s default of pausing at each match and asking specifically surfaces these edge cases for a human decision, one at a time, WHILE they are still individually reviewable — rather than only discovering the unintended corruption afterward, potentially buried among dozens or hundreds of otherwise-correct replacements, at which point finding and fixing just the wrongly-changed ones is considerably harder than catching them during the original pass.'
    }
  ],
  code: {
    title: 'Incremental search, query-replace, and their regex counterparts',
    intro: 'Try each of these against a real buffer with a few repeated words to search and replace.',
    code: `;; Incremental search — try typing this live and watch point jump early:
C-s fun
;; Point jumps to the first "f", then adjusts as "fu" then "fun" completes —
;; often landing on the right match before you finish typing.

C-s               ; (pressed again, mid-search) jumps to the NEXT occurrence
C-s               ; and again — steps forward through every match

C-g               ; cancels — point returns to EXACTLY where the search started

;; Query-replace — interactive, one match at a time:
M-% oldname <RET> newname <RET>
;; At each match, Emacs pauses and shows: Query replacing oldname with
;; newname: (y, n, !, q, ...)?
y     ; replace this one, move to next match
n     ; skip this one, move to next match
!     ; replace this AND all remaining matches, no more asking
q     ; stop right here, leave the rest untouched

;; Regex incremental search:
C-M-s [0-9]+
;; Jumps live to the next run of one-or-more digits, wherever it appears.

;; Regex query-replace, using a captured group in the replacement:
M-x query-replace-regexp <RET>
\\(\\w+\\)@example\\.com <RET>
\\1@newdomain.com <RET>
;; Matches "someone@example.com", replaces with "someone@newdomain.com" —
;; \\1 refers back to whatever the (\\w+) group actually captured, per match.`,
    notes: [
      'While inside an active isearch, pressing M-% switches directly into query-replace using whatever you had already typed as the search term — a genuinely fast shortcut once you already have a search going.',
      'Emacs\'s regex syntax inside isearch/query-replace-regexp follows the same BRE-style escaping conventions as grep\'s default mode — parentheses for grouping need to be escaped as \\( \\), matching what a regex course would call "basic" regex syntax.'
    ]
  },
  lab: {
    title: 'Write the right search/replace commands',
    prompt: 'Write exactly the key sequence for each task below.',
    starter: `# Task: start an incremental search FORWARD for the word "error"


# Task: cancel an in-progress search and return to where it started


# Task: interactively replace "foo" with "bar", asked about one match at a time


# Task: within an active query-replace, skip the current match and move to the next


# Task: within an active query-replace, replace this AND every remaining match with no more asking

`,
    checks: [
      { re: 'C-s\\s+error', flags: 'i', must: true, hint: 'C-s error starts an incremental forward search for "error".', pass: 'C-s error ✓' },
      { re: 'C-g', flags: '', must: true, hint: 'C-g cancels the search, returning to the starting position.', pass: 'C-g ✓' },
      { re: 'M-%\\s+foo.*bar', flags: 'i', must: true, hint: 'M-% foo <RET> bar <RET> starts an interactive query-replace.', pass: 'M-% foo ... bar ✓' },
      { re: '\\bn\\b', flags: '', must: true, hint: 'n skips the current match without changing it.', pass: 'n ✓' },
      { re: '!', flags: '', must: true, hint: '! replaces this and every remaining match without further prompting.', pass: '! ✓' }
    ],
    run: 'Try it for real: query-replace a common word in a scratch buffer and practice y/n/! on different matches to see the difference.',
    solution: `# Task: start an incremental search FORWARD for the word "error"
C-s error

# Task: cancel an in-progress search and return to where it started
C-g

# Task: interactively replace "foo" with "bar", asked about one match at a time
M-% foo <RET> bar <RET>

# Task: within an active query-replace, skip the current match and move to the next
n

# Task: within an active query-replace, replace this AND every remaining match with no more asking
!`,
    notes: [
      'These y/n/!/q keys are only meaningful WHILE query-replace is actively running and paused at a match — they are not general-purpose keybindings outside that context.',
      'Practicing the difference between n (skip just this one) and q (stop entirely, right here) is worth doing deliberately — they are easy to conflate at first.'
    ]
  },
  quiz: [
    {
      q: 'What makes Emacs\'s C-s search "incremental"?',
      options: ['It only searches forward, never backward', 'It jumps to matches live, as you type each character, rather than waiting for you to press Enter', 'It searches multiple files at once incrementally', 'It requires typing the entire search term before doing anything at all'],
      correct: 1,
      explain: 'Incremental search updates and jumps to the current match after every single keystroke, rather than waiting for a completed search term and an Enter press.'
    },
    {
      q: 'What happens when you press C-g during an active search?',
      options: ['It repeats the search one more time', 'It cancels the search and returns point to exactly where the search started', 'It permanently disables searching for the rest of the session', 'It replaces the current match with nothing'],
      correct: 1,
      explain: 'C-g treats the search as a safe, reversible look — cancelling it restores your original position exactly, as if the search never happened.'
    },
    {
      q: 'In query-replace, what is the difference between pressing "n" and pressing "q" at a given match?',
      options: ['They do the exact same thing', '"n" skips just this one match and continues to the next; "q" stops the entire operation right here, leaving remaining matches untouched', '"n" stops everything; "q" skips just one match', 'Both permanently disable query-replace for the session'],
      correct: 1,
      explain: '"n" skips only the current match and keeps going to the next one; "q" halts the whole replace operation immediately, leaving anything not yet reached completely unchanged.'
    },
    {
      q: 'Why does query-replace default to asking about each match individually instead of just replacing everything at once?',
      options: ['Performance reasons — replacing everything at once would be too slow', 'To catch matches occurring in a context you did not actually intend to change, before they get silently corrupted by a blind replacement', 'Because the "!" (replace all) option does not actually exist', 'It is a legacy limitation with no real benefit today'],
      correct: 1,
      explain: 'Per-match confirmation surfaces unintended matches (like a search term appearing inside an unrelated word) for review WHILE they are still individually catchable, rather than only discovering the mistake after a blind global replace.'
    },
    {
      q: 'What do C-M-s and C-M-r do differently from plain C-s and C-r?',
      options: ['They search backward twice as fast', 'They treat the typed search text as a REGULAR EXPRESSION rather than literal text, with the same live/incremental behavior otherwise', 'They only work within the current line', 'They automatically replace matches instead of just finding them'],
      correct: 1,
      explain: 'C-M-s/C-M-r are the regex-powered siblings of C-s/C-r — same incremental, live-jumping behavior, but matching against a regex pattern instead of literal text.'
    }
  ],
  pitfalls: [
    'Expecting to have to type a full search term and press Enter, missing the point that incremental search often finds the right match after just a few characters — no Enter needed at all to actually land on it.',
    'Pressing "!" in query-replace out of impatience without having reviewed enough matches first to actually trust the remaining ones follow the same safe pattern — defeating the whole purpose of per-match review.',
    'Confusing "n" (skip this one, keep going) with "q" (stop entirely, right here) in query-replace — easy to mix up under time pressure, with genuinely different consequences for how much of the buffer ends up reviewed.'
  ],
  interview: [
    {
      q: 'Explain what makes Emacs\'s search "incremental," and why that design is generally faster than a traditional "type then press Enter" search.',
      a: 'Incremental search updates and jumps to the current best match after EVERY keystroke, rather than requiring the full search term to be typed and confirmed with Enter before any searching happens at all. This matters practically because it eliminates the need to fully know or fully type an exact search term before getting useful feedback — very often, especially for something you can only partially recall, the correct match is reached after just a handful of characters, at which point you simply stop typing and move on rather than needing to complete the whole term. The cumulative speed benefit across many searches in a real editing session is genuine, not merely a stylistic preference — it directly reduces both typing and the "type, wait, check if that was right" round trip most other search UIs impose.'
    },
    {
      q: 'Walk through exactly what happens, and why, when you press C-g in the middle of an active isearch.',
      a: 'C-g cancels the search entirely and returns point to the EXACT position it was at before the search began — not wherever the search happened to have landed at the moment of cancellation. This reflects a deliberate design choice: a search is meant to function as a safe, freely reversible way to LOOK around a buffer, not a commitment to actually having moved point somewhere. If cancelling simply stopped the search wherever it currently was, every abandoned or mistyped search would leave you stranded at an arbitrary, unintended position requiring manual correction — restoring the original position on cancel instead means searches can be explored and abandoned completely freely, with zero cost, which is genuinely different from treating every search interaction as an actual navigation commitment.'
    },
    {
      q: 'Why does query-replace default to asking about each match individually, and under what circumstances would you actually choose to override that with "!"?',
      a: 'The default per-match confirmation exists specifically to catch matches occurring in a context that was not actually intended to be changed — a search term can legitimately appear as a substring of an unrelated word, or in a comment discussing something different from the code being renamed, and a blind global replacement would corrupt those instances silently, discoverable only after the fact, often mixed in among many correct replacements and genuinely harder to isolate at that point. "!" is the appropriate override once you have reviewed enough of the matches to be genuinely confident the remaining ones all follow the same safe pattern — at that point, continuing to individually confirm each one provides no additional real safety, just repeated, low-value confirmation, and "!" lets you correctly skip that redundant step for the rest.'
    },
    {
      q: 'A colleague wants to swap the order of first and last names across a large file formatted as "Last, First" into "First Last". How would you approach this using what this lesson covers?',
      a: 'This is exactly the kind of structural transformation regex-based query-replace, using captured groups, is built for: M-x query-replace-regexp with a search pattern capturing both parts — something like "\\\\(\\\\w+\\\\), \\\\(\\\\w+\\\\)" capturing the last name as group 1 and the first name as group 2 — and a replacement of "\\\\2 \\\\1", referencing those captured groups in the swapped order. Running this interactively (the default, non-"!" behavior) would let you review each match individually first — genuinely worthwhile here, since a name-formatted file can easily contain edge cases (a name with a suffix, an unexpected extra comma) that a blind pattern match might mishandle — before committing to "!" once confident the pattern correctly handles the remaining, unreviewed entries.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover everyday search and replace thoroughly. This is what is underneath: jumping straight from a search into a replace, search history, and how case-sensitivity is actually decided by default.',
    sections: [
      {
        h: 'M-% from inside an active search: seamlessly switching to replace',
        p: [
          'Pressing <code>M-%</code> WHILE already in the middle of an active isearch (rather than starting query-replace fresh) immediately switches into query-replace mode, using whatever you had already typed as the isearch term as the starting search string for the replace — a genuinely fast shortcut the moment a search you are already running turns into "actually, let me replace all of these" without needing to retype the search term from scratch into a fresh M-% prompt.'
        ]
      },
      {
        h: 'Search history: M-p and M-n work here too',
        p: [
          'Exactly like the minibuffer history covered in Part 2, an active isearch or query-replace prompt tracks a history of RECENTLY used search (and replacement) terms — <code>M-p</code>/<code>M-n</code> cycle backward/forward through that history while typing into the search prompt, letting you quickly re-run a search you performed a few minutes ago without retyping it. This is the exact same general minibuffer-history mechanism from Part 2, simply applying here too, since search prompts are themselves minibuffer prompts underneath.'
        ]
      },
      {
        h: 'Case sensitivity: "smart case" by default',
        p: [
          'By default (controlled by the variable <code>case-fold-search</code>), Emacs search is CASE-INSENSITIVE if your search term is entirely lowercase — searching for "error" matches "error," "Error," and "ERROR" alike — but becomes CASE-SENSITIVE the moment your search term contains ANY uppercase letter, matching only that exact casing. This "smart case" behavior is a deliberate convenience: typing a lowercase search term (the common case, since most people default to lowercase while typing quickly) gets the broadest, most forgiving match; deliberately including a capital letter signals you actually care about exact casing this time, and Emacs respects that signal automatically, without needing a separate toggle to switch between the two modes explicitly.'
        ]
      }
    ]
  }
};
