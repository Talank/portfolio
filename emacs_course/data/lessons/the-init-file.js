window.LESSONS = window.LESSONS || {};
window.LESSONS['the-init-file'] = {
  id: 'the-init-file',
  title: 'init.el: Where Emacs\'s Entire Personality Lives',
  category: 'Part 4 — Customization & Config',
  timeMin: 35,
  summary: 'Everything Part 0 said about Emacs being "genuinely yours" comes down, practically, to one file: init.el. It is loaded, top to bottom, every time Emacs starts, and it is where every setting, every custom keybinding (Part 4\'s next lesson), and every installed package (the lesson after that) actually lives. This lesson covers its basic structure, where it lives, and a genuinely common beginner trap: one broken line partway through can silently stop everything after it from loading at all.',
  goals: [
    'Explain where init.el lives, and when Emacs loads it',
    'Write basic init.el expressions using setq (set a variable) and plain function calls (run an action)',
    'Explain what the Customize UI is, and why custom-set-variables blocks are worth separating from hand-written config',
    'Explain why an error partway through init.el can prevent everything after it from loading',
    'Use the *Messages* buffer to find out exactly what went wrong and where, after a startup error'
  ],
  concept: [
    {
      h: 'Where init.el lives, and when it loads',
      p: [
        'Your personal configuration lives in a file called <code>init.el</code>, traditionally at <code>~/.emacs.d/init.el</code>. Modern Emacs (27 and later) also checks <code>~/.config/emacs/init.el</code> first, following the more general XDG configuration-directory convention most Linux/Mac command-line tools use — either location works, and this course will just say "init.el" going forward, since the content and behavior are identical regardless of which specific path you use.',
        'Emacs loads and EVALUATES init.el automatically, top to bottom, every single time it starts — this is not a one-time "install" step, it happens on every launch (or, per Part 0\'s daemon-mode coverage, once when the daemon starts). Every line is run exactly as if you had typed it into the <code>*scratch*</code> buffer yourself and pressed <code>C-x C-e</code> after each expression, in order, from the top of the file to the bottom.'
      ]
    },
    {
      h: 'The basic structure: setq, function calls, and comments',
      p: [
        '<code>(setq variable-name value)</code> sets a variable to a value — the most common single thing you will write in an init.el. Multiple variables can be set in one setq: <code>(setq indent-tabs-mode nil tab-width 2)</code> sets both at once. A bare function call, like <code>(global-display-line-numbers-mode 1)</code>, simply RUNS that function, typically to turn some behavior on (a nonzero/positive argument) or off (a zero or nil argument), following a common Emacs convention for toggleable minor modes (Part 5\'s subject).',
        'A semicolon <code>;</code> starts a comment running to the end of the line — by loose convention, <code>;;</code> (two semicolons) marks a full-line comment explaining the section below it, while a single <code>;</code> is more often used as a short trailing comment on the same line as actual code. Neither is enforced by Emacs itself; it is purely a widely-followed community style convention worth adopting for readability, especially once your own init.el grows past a handful of lines.'
      ]
    },
    {
      h: 'Customize: a GUI settings menu that writes its OWN code into your file',
      p: [
        'Emacs has an entire built-in graphical settings interface, <code>M-x customize</code>, letting you browse and change settings through menus and checkboxes rather than hand-writing elisp — genuinely useful for DISCOVERING what settings even exist for a given feature. The catch: when you change something through Customize, it does not modify your hand-written setq lines — it writes its OWN auto-generated <code>(custom-set-variables ...)</code> block, usually appended to the bottom of your init.el (or wherever <code>custom-file</code> currently points).',
        'Mixing hand-written setq lines with an auto-generated custom-set-variables block for the SAME variable can create genuinely confusing double-definitions, where it becomes unclear which one actually takes effect (whichever loads LAST, in practice — but relying on load order to resolve a conflict you did not intend to create is fragile). The common, recommended fix: set <code>custom-file</code> to point at a SEPARATE file entirely, keeping Customize\'s auto-generated code fully out of your hand-written init.el — covered concretely in this lesson\'s code example.'
      ]
    },
    {
      h: 'Load order matters: one error can silently block everything after it',
      p: [
        'This is a genuinely important, easy-to-hit trap: because init.el loads top to bottom, an ERROR partway through the file — a typo, a reference to a package that has not actually been installed yet, a genuinely broken expression — can stop EVERYTHING AFTER THAT POINT in the file from ever running, even though those later expressions are themselves completely correct on their own. Everything BEFORE the error already ran successfully; everything after it, in that specific load, simply never gets a chance to.',
        'The classic beginner confusion this causes: "I added this new setting at the bottom of my init.el and it just does not seem to work" — when the actual bug is an unrelated error occurring EARLIER in the file, silently preventing that perfectly correct new line from ever being reached at all. The fix is always the same: check the <code>*Messages*</code> buffer (or the dedicated <code>*Warnings*</code> buffer, which pops up automatically for many startup errors) — it shows exactly which expression failed and why, which is almost always enough to immediately identify and fix the actual problem.'
      ]
    }
  ],
  conceptFlow: {
    title: 'One broken line, and everything after it in init.el',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'init.el, top to bottom',
        nodes: [
          { id: 'line1', text: 'Line 1: (setq indent-tabs-mode nil)\nRUNS successfully' },
          { id: 'line2', text: 'Line 2: (some-typo-d-function)\nERRORS — function does not exist' },
          { id: 'line3', text: 'Line 3: (setq tab-width 2)\nPerfectly correct, on its own' }
        ]
      },
      {
        label: 'What actually happens',
        nodes: [
          { id: 'result1', text: 'Line 1\'s effect: applied' },
          { id: 'result2', text: 'Line 2: error logged\nto *Messages*/*Warnings*' },
          { id: 'result3', text: 'Line 3: NEVER RUNS\ntab-width stays at its default' }
        ]
      }
    ],
    steps: [
      { active: ['line1'], note: 'The first line runs fine — indent-tabs-mode is genuinely set to nil, no problems here.' },
      { active: ['line2'], note: 'The second line references a function that does not actually exist (a typo, or a package not yet installed) — this specific expression fails.' },
      { active: ['line3'], note: 'The third line, entirely on its own, is perfectly valid, correct code — but notice it comes AFTER the broken line.' },
      { active: ['result1'], note: 'Line 1\'s setting genuinely took effect — it ran before anything went wrong.' },
      { active: ['result2'], note: 'Line 2\'s error gets recorded in *Messages* (and often triggers a *Warnings* buffer popup) — this is where the actual diagnostic information lives.' },
      { active: ['result3'], note: 'Line 3 never runs AT ALL during this load, despite being completely correct code with no bugs of its own — the error on line 2 stopped Emacs from ever reaching it. Someone debugging only line 3, assuming it must be the broken one since "it just does not work," would be looking in entirely the wrong place.' }
    ]
  },
  story: {
    onePiece: {
      title: 'The Standing Orders Board, Read Top to Bottom Every Morning',
      text: 'The Sunny keeps a standing orders board, read start to finish by the crew every single morning without exception — check the rigging, inspect the hull, restock the galley, and so on, each instruction genuinely independent of the others in what it actually asks for. The morning it first goes wrong teaches everyone a lesson that sticks: someone had scrawled a genuinely garbled, half-finished instruction partway down the list — not maliciously, just an honest mistake — and the crew member reading it out loud that morning simply stalled there, confused, and never actually got to reading the REST of the list at all that day. Every instruction below that garbled one was perfectly fine on its own — check the sails, restock the medical kit — and none of it happened anyway, purely because nobody ever reached it. Nami\'s fix afterward has two parts. First: whenever something on the board does not get done, do not assume the instruction itself must be broken — check whether something EARLIER in the list actually stalled the reading before it ever got that far. Second, and separately: she starts keeping a completely SEPARATE scratch board for half-formed, experimental ideas she is still working out — never mixed in with the real, official standing orders board, specifically so a rough draft idea sitting there can never accidentally derail the crew\'s actual morning routine the way that garbled line once did.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Morning Prep Checklist, Read Top to Bottom by Whoever Is on Shift',
      text: 'Monica\'s kitchen runs its opening prep off a checklist read start to finish by whoever is on shift that morning — dough started, walk-in checked, produce prepped, each item genuinely independent of the others. The one morning it visibly breaks down teaches the staff something that sticks. An earlier revision of the checklist had one genuinely garbled, half-edited line partway down — an honest mistake during a rushed update — and whoever was reading it that morning simply got stuck there, confused about what it was even asking for, and never actually got to reading anything BELOW it on the list that day. Every item after that garbled line was perfectly fine on its own — restock the register, prep the specials board — and none of it happened anyway, purely because nobody ever reached it while stuck confused on the broken line above. Monica\'s fix afterward has two parts too. First: when something on the list clearly did not get done, her instinct is now to check whether something EARLIER on the list actually stalled the reading, rather than assuming that specific missed item is somehow the broken one. Second, she starts keeping a completely separate scratch pad for half-formed "maybe try this" prep ideas — deliberately never mixed into the REAL, official checklist, specifically so an unfinished rough idea sitting there can never accidentally derail the actual morning routine the way that garbled line once did.'
    },
    why: 'The Sunny\'s standing orders board and Monica\'s morning checklist, both read top to bottom with one broken line stalling everything after it, are exactly init.el\'s load-order gotcha — a perfectly correct LATER line simply never gets a chance to run if something EARLIER errors out first. And keeping experimental ideas on a genuinely separate board, never mixed into the official list, is exactly the recommendation to keep Customize\'s auto-generated code in a separate custom-file rather than tangled into your own hand-written init.el.'
  },
  tech: [
    {
      q: 'Why does an error partway through init.el stop everything AFTER it from loading, rather than Emacs just skipping the broken line and continuing?',
      a: 'Emacs evaluates init.el as a sequence of independent top-level expressions, one after another, and by default, an unhandled error signaled during evaluation of one expression aborts the CURRENT loading process at that point — it does not have a built-in "skip this one broken expression and keep going with the rest of the file" behavior for ordinary load errors. This is genuinely by design, not an oversight: many configuration expressions have real dependencies on earlier ones having succeeded (a package needing to have been loaded before a setting that configures it makes any sense), so silently skipping a failure and continuing could produce a config in a genuinely inconsistent, partially-applied state that is harder to reason about than simply stopping cleanly at the actual point of failure.'
    },
    {
      q: 'What is the actual difference between hand-writing (setq some-var value) and changing the same setting through M-x customize?',
      a: 'Functionally, once applied, the resulting VALUE of the variable is identical either way — Customize is not doing anything magical under the hood, it is ultimately still just setting a variable. The difference is entirely about HOW that value gets written into your configuration: a hand-written setq is exactly the plain elisp you typed yourself, living wherever you put it in your init.el; Customize instead auto-generates its own (custom-set-variables ...) block, typically appended to the bottom of whatever file custom-file currently points at, in a format optimized for Customize\'s own machine-editing (so it can cleanly update that block again later if you change the setting again through the GUI) rather than for human readability or intentional placement within your file.'
    },
    {
      q: 'Why is separating custom-file from init.el considered good practice, rather than just letting Customize append to the bottom of your hand-written config?',
      a: 'If Customize\'s auto-generated custom-set-variables block lives in the SAME file as your own hand-written setq lines, editing that file yourself risks accidentally corrupting Customize\'s auto-generated formatting (which it expects to be able to parse and rewrite cleanly later), and — more importantly — it becomes genuinely easy to end up with the SAME variable set in two different places (once by your own setq, once by Customize\'s block), with no clear indication of which one actually wins without carefully checking load order. Pointing custom-file at a completely separate file keeps these two genuinely different ways of configuring Emacs — deliberate, hand-written intent versus GUI-driven, auto-generated output — cleanly separated, each fully readable and manageable on its own terms without risk of silently conflicting with the other.'
    }
  ],
  code: {
    title: 'A minimal, real init.el',
    intro: 'This is genuinely close to a real, working starting init.el — try building your own from a file shaped like this.',
    code: `;; ~/.emacs.d/init.el

;; Keep Customize's auto-generated settings in their OWN file,
;; entirely separate from everything hand-written below:
(setq custom-file (locate-user-emacs-file "custom.el"))
(when (file-exists-p custom-file)
  (load custom-file))

;; Basic editing preferences
(setq indent-tabs-mode nil)     ; spaces, not tabs, for indentation
(setq tab-width 2)               ; how wide a tab character displays as

;; Turn on line numbers everywhere (a minor mode, covered in Part 5)
(global-display-line-numbers-mode 1)

;; Turn OFF the startup splash screen
(setq inhibit-startup-screen t)

;; A short-form comment on the same line as code:
(setq ring-bell-function 'ignore)  ; stop the audible bell

;; --- Deliberately broken example (for illustration only — do not keep this) ---
;; (some-function-that-does-not-exist)
;; If this line were left in, EVERYTHING below it would silently fail to load.

;; This line, on its own, is perfectly correct —
;; but if the broken line above it were actually present, this would never run:
(setq require-final-newline t)`,
    notes: [
      'The custom-file redirection block at the top is genuinely worth copying into your own init.el nearly verbatim — it is one of the most commonly recommended first additions to any new Emacs configuration.',
      'After editing init.el, either restart Emacs or select the whole buffer and run M-x eval-buffer to apply changes without a full restart — the exact same idea covered back in Part 0\'s daemon lesson.'
    ]
  },
  lab: {
    title: 'Write the init.el snippets for each task',
    prompt: 'Write exactly what each task asks for, as valid elisp.',
    starter: `# Task: set indent-tabs-mode to nil (spaces instead of tabs)


# Task: turn ON global-display-line-numbers-mode


# Task: point custom-file at a separate file, "custom.el", inside the user Emacs directory


# Q: Explain, in one or two sentences, why a broken line near the TOP of init.el is more
# dangerous than a broken line near the BOTTOM.

`,
    checks: [
      { re: '\\(setq\\s+indent-tabs-mode\\s+nil\\)', flags: '', must: true, hint: '(setq indent-tabs-mode nil)', pass: '(setq indent-tabs-mode nil) ✓' },
      { re: '\\(global-display-line-numbers-mode\\s+1\\)', flags: '', must: true, hint: '(global-display-line-numbers-mode 1)', pass: '(global-display-line-numbers-mode 1) ✓' },
      { re: "\\(setq\\s+custom-file\\s+\\(locate-user-emacs-file\\s+.custom\\.el.\\)\\)", flags: '', must: true, hint: "(setq custom-file (locate-user-emacs-file \"custom.el\"))", pass: 'custom-file redirected ✓' },
      { re: 'top[\\s\\S]*bottom|prevents[\\s\\S]*(after|below)|stops[\\s\\S]*(after|below)', flags: 'i', must: true, hint: 'A broken line near the top blocks a much larger portion of the file from ever loading, since everything after it never runs.', pass: 'Explained top-vs-bottom risk ✓' }
    ],
    run: 'Try it for real: add these lines to a scratch init.el, restart Emacs (or eval-buffer), and confirm the settings actually took effect.',
    solution: `# Task: set indent-tabs-mode to nil (spaces instead of tabs)
(setq indent-tabs-mode nil)

# Task: turn ON global-display-line-numbers-mode
(global-display-line-numbers-mode 1)

# Task: point custom-file at a separate file, "custom.el", inside the user Emacs directory
(setq custom-file (locate-user-emacs-file "custom.el"))

# Q: Explain, in one or two sentences, why a broken line near the TOP of init.el is more
# dangerous than a broken line near the BOTTOM.
# Because init.el loads top to bottom, a broken line near the top prevents everything
# BELOW it — potentially the vast majority of your configuration — from ever loading,
# while a broken line near the bottom only blocks whatever few lines come after it.`,
    notes: [
      'locate-user-emacs-file is the portable way to reference a file inside your Emacs config directory, regardless of whether it happens to be ~/.emacs.d or the newer ~/.config/emacs location.',
      'Genuinely broken elisp (unbalanced parens especially) is exactly the kind of mistake the earlier lessons\' Practice Lab lint checks for — worth double-checking parens balance before ever saving a real init.el change.'
    ]
  },
  quiz: [
    {
      q: 'When does Emacs load and evaluate init.el?',
      options: ['Only once, the very first time Emacs is ever installed', 'Every single time Emacs starts (or once when a daemon starts, per Part 0)', 'Only when explicitly requested via M-x load-init', 'Never automatically; it must always be manually evaluated'],
      correct: 1,
      explain: 'init.el is loaded and evaluated automatically on every Emacs startup (or once for a persistent daemon) — not a one-time installation step.'
    },
    {
      q: 'What does (setq indent-tabs-mode nil) do?',
      options: ['Deletes the indent-tabs-mode variable entirely', 'Sets the variable indent-tabs-mode to the value nil', 'Runs a function called indent-tabs-mode', 'Nothing; this is invalid syntax'],
      correct: 1,
      explain: 'setq sets a variable to a given value — here, setting indent-tabs-mode to nil (commonly used to mean "use spaces, not tabs, for indentation").'
    },
    {
      q: 'What is the key difference between a hand-written setq and a setting changed through M-x customize?',
      options: ['They produce genuinely different final variable values', 'The resulting value is the same either way, but Customize auto-generates its own (custom-set-variables ...) block rather than writing a plain setq you control the placement of', 'Customize cannot actually change any settings, only display them', 'setq only works for numbers, while Customize works for any type'],
      correct: 1,
      explain: 'Both ultimately set the same variable to the same value — the difference is entirely in HOW that setting gets written into your configuration (auto-generated block vs. your own hand-placed code).'
    },
    {
      q: 'Why might a perfectly correct setting near the bottom of init.el appear to "not work"?',
      options: ['Settings near the bottom of the file are always ignored by Emacs', 'An error occurring EARLIER in the file may have stopped evaluation before ever reaching that later, correct line', 'init.el has a maximum line limit that was exceeded', 'The setting needs to be duplicated at the top of the file too'],
      correct: 1,
      explain: 'Because init.el loads top to bottom and stops at the first unhandled error, a perfectly valid later line can simply never get a chance to run if something earlier in the file failed first.'
    },
    {
      q: 'Where would you look to find out exactly what went wrong after an init.el loading error?',
      options: ['There is no way to find this out', 'The *Messages* buffer (and often an automatically-popped-up *Warnings* buffer)', 'A separate error-log application outside of Emacs', 'The Dired file listing'],
      correct: 1,
      explain: '*Messages* records exactly what happened during startup, including error details — the *Warnings* buffer often pops up automatically for many startup errors specifically to surface this.'
    }
  ],
  pitfalls: [
    'Assuming a setting near the bottom of init.el that "does not work" must itself be broken, without checking whether an earlier error is actually preventing that line from ever being reached.',
    'Letting Customize\'s auto-generated custom-set-variables block live in the same file as hand-written config, risking confusing double-definitions of the same variable in two different places.',
    'Not checking the *Messages* buffer after a startup error, and instead guessing at the cause rather than reading the specific, actionable error information Emacs already recorded.'
  ],
  interview: [
    {
      q: 'Explain exactly how and when init.el is loaded, and why that load-order behavior explains a genuinely common beginner debugging confusion.',
      a: 'init.el is loaded and evaluated automatically every time Emacs starts, as a sequence of top-level expressions evaluated one after another, top to bottom, exactly as if each had been typed into a buffer and run individually. Because an unhandled error in one expression stops that load process at that point, everything AFTER the error in the file simply never runs during that load, regardless of how correct those later expressions are on their own. This directly explains a common confusion: someone adds a new, correct setting near the bottom of their file and it appears to silently "not work" — when the real cause is an unrelated error occurring earlier in the file, which nobody thought to check, since the newly-added line looked like the obvious suspect.'
    },
    {
      q: 'Why does Emacs offer both a hand-written configuration approach (setq in init.el) and a GUI-based Customize system, rather than just one?',
      a: 'They serve genuinely different needs: hand-written setq gives full, precise control over exactly what is set, in exactly what order, with comments and structure entirely under the user\'s own control — the natural approach once you know exactly what you want to configure. M-x customize instead provides a browsable, discoverable interface for finding out WHAT settings exist for a given feature in the first place, along with their documentation and valid value ranges, displayed through menus rather than requiring the user to already know the relevant variable names — genuinely valuable for exploration, especially for someone unfamiliar with a specific package\'s configuration surface. Both ultimately produce the same kind of effect (variables being set), just through interfaces suited to different stages of familiarity with what is actually being configured.'
    },
    {
      q: 'A user reports that after adding several new lines to the bottom of their init.el, none of them seem to have taken effect, and no error dialog appeared. How would you help them diagnose this?',
      a: 'First, check the *Messages* buffer (and look for an automatically-popped-up *Warnings* buffer) — an init.el loading error does not always present as an obvious, modal dialog; it is often recorded quietly in *Messages*, easy to miss if you are not specifically looking there. If an error is found, its location in *Messages* typically identifies which specific expression failed — and per this lesson\'s core lesson, that failing expression is very possibly located BEFORE the newly-added lines the user assumes are broken, meaning the actual fix is correcting that earlier error, not the newly-added, individually-correct lines at the bottom that never even got a chance to run.'
    },
    {
      q: 'Why is keeping custom-file separate from init.el considered a best practice worth setting up on essentially day one of any new Emacs configuration?',
      a: 'Because Customize writes and rewrites its own auto-generated (custom-set-variables ...) block in a specific format it expects to be able to parse and cleanly update again the next time a setting is changed through the GUI — if that block lives in the same file as hand-written setq lines, manually editing the file risks corrupting Customize\'s expected formatting, and it becomes genuinely easy to end up with the same variable set in two different places with no immediately obvious way to tell which one is actually winning. Redirecting custom-file to a completely separate location keeps these two different configuration styles — deliberate hand-written intent, and GUI-driven auto-generated output — fully independent and individually manageable, avoiding a whole category of confusing, hard-to-diagnose configuration conflicts before they ever have a chance to occur.'
    }
  ]
};
