window.LESSONS = window.LESSONS || {};
window.LESSONS['mac-modifier-keys'] = {
  id: 'mac-modifier-keys',
  title: 'Control, Meta & Super: What Mac Actually Does to Emacs Keybindings',
  category: 'Part 1 — The Mac Keybinding Model',
  timeMin: 35,
  summary: 'Emacs\'s keybinding notation was designed decades before the modern Mac keyboard existed, and it shows: it assumes keys — Control, Meta, Super — that a Mac keyboard either does not have by default (Meta, Super) or that directly conflict with something macOS itself already uses that same key for (Option, doing double duty as both "Meta" and "type an accented character"). This lesson explains exactly what the conflict is and the real options for resolving it — the next lesson covers actually configuring the fix.',
  goals: [
    'Read Emacs\'s C-/M-/s- keybinding notation and know what each modifier prefix means',
    'Explain why Meta and Super have no dedicated physical key on a Mac keyboard by default',
    'Explain the specific conflict between Option-as-Meta and macOS\'s own Option-based accented-character input',
    'Describe the three practical resolutions to that conflict, including the one that requires zero configuration',
    'Explain why Command (Cmd) behaves differently in Terminal Emacs versus GUI Emacs'
  ],
  concept: [
    {
      h: 'C-, M-, s-: Emacs\'s notation, and the PC keyboard it assumes',
      p: [
        'Emacs documentation and keybindings are written using a compact notation: <code>C-x</code> means "hold Control, press x." <code>M-x</code> means "hold Meta, press x" (this is the M-x you have already been using — Meta-x, not some unrelated abbreviation). <code>C-M-f</code> means "hold both Control and Meta, press f." <code>s-x</code> means "hold Super, press x" — a modifier you will bind yourself, covered later in this lesson.',
        'This notation was standardized on old Lisp Machine and PC-era keyboards that genuinely HAD a physical key labeled Meta (or, on a standard PC keyboard, Alt was mapped to serve as Meta) and, later, a physical "Super"/"Windows" key. A Mac keyboard has neither — it has <b>Control</b> (which maps cleanly, no issue there), <b>Option</b>, and <b>Command</b>, and none of Apple\'s own defaults assume you want either of the latter two behaving like Emacs\'s Meta or Super. Every Mac Emacs setup needs SOME explicit decision about what Option and Command should actually do inside Emacs — there is no single universal default that just works out of the box.'
      ]
    },
    {
      h: 'The real conflict: Option is already doing a job for macOS',
      p: [
        'The natural instinct is "just make Option be Meta" — Option sits in the same physical position Alt occupies on a PC keyboard, and Emacs traditionally maps Alt to Meta. The problem: <b>Option is not idle on a Mac</b>. macOS itself uses Option as a modifier for typing special and accented characters — <code>Option-e</code> then <code>e</code> produces <code>é</code>, <code>Option-u</code> then <code>u</code> produces <code>ü</code>, and so on, a genuinely useful, actively-used system-wide feature, not some obscure edge case.',
        'If Option is bound entirely as Meta inside Emacs, that accented-character input stops working while you are in Emacs — every <code>Option-e</code> becomes <code>M-e</code> (a real, different Emacs command) instead of composing an é. If Option is left completely alone, you cannot use ANY of Emacs\'s extensive M- keybindings via Option at all, which is a genuinely large chunk of Emacs\'s everyday vocabulary to lose. This is the actual conflict this whole lesson exists to resolve — not a minor inconvenience, a genuine either/or with no default answer that is obviously correct for everyone.'
      ]
    },
    {
      h: 'Three real resolutions — pick based on how much you actually type accented characters',
      p: [
        '<b>Option 1 — full commit:</b> bind Option entirely to Meta, accept losing native macOS accent composition while inside Emacs. Reasonable if you write almost exclusively in English and rarely need é/ü/ñ-style characters. <b>Option 2 — Escape as Meta, zero configuration required:</b> Emacs has, since long before Macs existed, supported pressing and releasing <code>Escape</code> as an ALTERNATE way to send the next keystroke as if Meta were held — <code>Esc</code> then <code>x</code> works identically to <code>M-x</code>, in every Emacs, on every platform, with no setup whatsoever. This is genuinely the universal fallback worth knowing regardless of which other option you choose, since it always works.',
        '<b>Option 3 — split left and right Option (the commonly recommended middle ground):</b> bind ONLY the right-hand Option key to Meta, while leaving the left-hand Option key doing macOS\'s normal accent-composition job. This genuinely gets you both: right Option for fast, one-handed M- commands during real editing, left Option still available the moment you actually need to type an accented character. The next lesson covers exactly how to configure each of these three, in both Terminal Emacs and GUI Emacs specifically.'
      ]
    },
    {
      h: 'Command (Cmd), and why terminal vs GUI genuinely changes what is possible',
      p: [
        'Command has no traditional Emacs meaning at all — it maps to Emacs\'s <b>Super</b> modifier (<code>s-</code>) only if you explicitly configure it to, which is exactly what most Mac Emacs setups do, specifically BECAUSE <code>s-</code> keybindings are guaranteed not to collide with any of Emacs\'s own extensive built-in C-/M- conventions — a clean, empty namespace to bind your own custom commands into, covered properly in Part 4\'s keybinding-customization lesson.',
        'Here is where the previous lesson\'s terminal-vs-GUI distinction matters directly: in <b>GUI Emacs</b>, Command key events reach Emacs directly from macOS\'s windowing system, fully controllable via configuration. In <b>Terminal Emacs</b>, Command is essentially always intercepted by the TERMINAL EMULATOR ITSELF first — Cmd-T for a new tab, Cmd-C to copy, Cmd-V to paste — and almost never reaches Emacs at all, regardless of any Emacs-side configuration, because the terminal emulator claims it before Emacs ever sees it. This is a genuine, structural limitation of running Emacs inside a terminal rather than a solvable configuration gap — worth knowing plainly rather than spending time hunting for a terminal-Emacs fix that fundamentally cannot exist.'
      ]
    }
  ],
  conceptFlow: {
    title: 'You press Option-e — where does it actually go?',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'The keypress',
        nodes: [
          { id: 'press', text: 'You press Option-e' }
        ]
      },
      {
        label: 'Which configuration is active?',
        nodes: [
          { id: 'fullmeta', text: 'Option fully bound to Meta\n(Resolution 1)' },
          { id: 'splitoption', text: 'Only RIGHT Option bound to Meta\n(Resolution 3) — this was LEFT Option' },
          { id: 'unbound', text: 'Option left as macOS default\n(no Emacs binding at all)' }
        ]
      },
      {
        label: 'What actually happens',
        nodes: [
          { id: 'metae', text: 'Emacs receives it as M-e\n(runs whatever command M-e is bound to)' },
          { id: 'accent', text: 'macOS intercepts it for\naccent composition — waits for the next letter' },
          { id: 'produces', text: 'Option-e then e\nproduces: é' }
        ]
      }
    ],
    steps: [
      { active: ['press'], note: 'The physical keypress is identical every time — Option held, e pressed. What happens next depends entirely on how Option is currently configured.' },
      { active: ['fullmeta'], note: 'If Option is fully committed as Meta (Resolution 1), this keypress is sent straight to Emacs as M-e.' },
      { active: ['splitoption'], note: 'If only the RIGHT Option key is bound to Meta (Resolution 3) and this was the LEFT Option key specifically, Emacs never even sees this as a Meta press at all.' },
      { active: ['unbound'], note: 'If Option has not been touched in Emacs configuration at all, macOS\'s own default behavior applies — Emacs is not involved in this keypress.' },
      { active: ['metae'], note: 'Under full-commit Meta binding: Emacs runs whatever command is bound to M-e — capital-izing a word forward, in Emacs\'s actual default binding, entirely unrelated to typing a letter é.' },
      { active: ['accent'], note: 'Under left-Option-preserved or fully-unbound Option: macOS intercepts this specific key combination for its OWN accent-composition feature, and waits for you to type the next letter to combine with.' },
      { active: ['produces'], note: 'The next letter you type (another "e") combines with the held accent mark to actually produce "é" — Emacs never sees "Option-e" as a keybinding at all in this path; macOS resolved it before Emacs got involved.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Sanji\'s Kitchen Signal, and the Straw Hats\' Conflicting Meaning for the Same Gesture',
      text: 'Sanji trained for years at the Baratie under a strict kitchen signal system — a specific raised, flat-palm gesture that means, unambiguously to any Baratie-trained cook, "hold this order, something is wrong with the ingredients." It is second nature to him, drilled in until it required no thought at all. The Straw Hats, entirely independently, had already settled on their OWN meaning for that exact same physical gesture, long before Sanji joined — Nami uses it as a navigation signal meaning "hard turn coming, brace yourselves." The very first time Sanji, mid-crisis in the galley, throws up that exact gesture out of pure kitchen instinct, half the crew braces for a hard turn that is not coming, while nobody actually stops the ruined dish he was trying to flag. Same gesture, two completely different established meanings, colliding the instant both crews are operating in the same space. The fix the crew eventually settles on has three real parts, and Nami is characteristically precise about spelling out all three rather than picking one and hoping it covers everything. First: for anyone willing to fully commit, they COULD simply retrain the whole crew on ONE agreed meaning and drop the other — reasonable, but it means someone loses a signal they already relied on. Second, and crucially, they establish a completely separate, UNAMBIGUOUS backup shout — a specific two-word call that has never meant anything else to anyone, ever, and works identically no matter what gesture confusion might be happening in the moment. Third, the actual compromise they land on for the everyday case: Sanji\'s kitchen gesture stays exactly as it was, but ONLY inside the galley specifically — the SAME gesture means something different depending on a clearly bounded context, rather than trying to force one universal meaning everywhere on the ship.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Door Knock vs. Everyone Else\'s Actual Doorbell',
      text: 'Sheldon\'s specific three-knock-plus-name ritual is famous precisely because it hijacks an action — knocking on a door — that already has a perfectly well-established, universal meaning to literally everyone else on the planet: "someone is at the door." Sheldon layers his OWN very specific additional meaning onto that same physical action, and the show gets real, recurring comedic mileage out of the collision — Penny, or a guest unfamiliar with the ritual, treats an ordinary knock as an ordinary knock, while Sheldon is mid-ritual expecting a very specific three-part response. Same physical action, two genuinely different established conventions, actively colliding whenever someone who does not share Sheldon\'s specific convention is involved. The group\'s working resolution, hashed out (with visible exasperation) over time, has real structure to it, not just "everyone humor Sheldon." One option floated and mostly rejected: fully retrain everyone to always expect and perform Sheldon\'s full ritual — technically possible, genuinely annoying for anyone not already invested in it. The option that actually sticks for genuine emergencies: an entirely separate, unambiguous signal — someone simply calling out a person\'s name loudly through the door — that has never meant anything else and always gets a normal, immediate response regardless of whatever knock-ritual confusion might otherwise be in play. And for ordinary day-to-day visits, the practical compromise is scoping it: Sheldon\'s full ritual applies specifically at HIS OWN door, in that specific context, rather than being forced as a universal rule everywhere he goes.'
    },
    why: 'Sanji\'s kitchen gesture colliding with Nami\'s navigation signal, and Sheldon\'s knock colliding with an ordinary knock, are both exactly Option\'s conflict on a Mac: one physical action, two genuinely established, colliding meanings. The resolutions map directly too — fully retraining everyone onto one meaning is Resolution 1 (full-commit Meta); the separate, always-works backup shout/name-call is Resolution 2 (Escape as Meta, which always works no matter what); and scoping the gesture to a specific context (the galley, Sheldon\'s own door) is Resolution 3 (right Option only, left Option preserved) — same underlying action, deliberately different meaning depending on which specific key, or which specific door, is actually involved.'
  },
  tech: [
    {
      q: 'Why does pressing and releasing Escape, then a key, work identically to holding Meta and pressing that key — is this a special Mac accommodation Emacs added?',
      a: 'No — this is a genuinely old Emacs (and terminal) convention that predates the Mac entirely, rooted in how terminals historically encoded a Meta keypress: on hardware where Meta could not always be reliably sent as a genuine held-modifier signal, sending an ESC character immediately followed by the target key was established as an equivalent, unambiguous alternate encoding. Emacs has interpreted "ESC followed by a key" as equivalent to "Meta held plus that key" since long before Macs with an Option key existed, in every Emacs build, on every platform, terminal or GUI, with zero Mac-specific configuration required. This is exactly why it is the recommended universal fallback — it does not depend on whatever Option/Meta configuration choice you make elsewhere.'
    },
    {
      q: 'Why does binding only the RIGHT Option key to Meta (leaving left Option alone) actually work reliably, rather than being a fragile half-measure?',
      a: 'Modern Mac keyboards report the left and right Option keys as genuinely DIFFERENT, individually distinguishable key codes at the operating-system level — they are not treated as interchangeable "the Option key was pressed" events, they are two separate, identifiable keys that happen to share a label and a general function. Because macOS (and Emacs, once configured to look at this distinction specifically) can tell them apart, it is entirely possible to bind ONLY the right one to Meta while leaving the left one fully alone, running its normal macOS accent-composition behavior, with no ambiguity or fragility involved — the OS-level distinction is solid, not a workaround relying on timing or guesswork.'
    },
    {
      q: 'Why can Cmd (Command) essentially never be bound usefully inside Terminal Emacs, no matter how it is configured on the Emacs side?',
      a: 'A terminal emulator (Terminal.app, iTerm2) is itself a full macOS application with its own extensive set of Command-key shortcuts (new tab, copy, paste, and many more), and it claims and handles those Command-key combinations BEFORE the keypress is ever forwarded, as ordinary text/escape-sequence input, to whatever program (Emacs, in this case) happens to be running inside it. Emacs running inside a terminal only ever receives what the terminal emulator chooses to pass through as regular input — it has no mechanism to intercept a Command-key combination the terminal emulator has already claimed for itself at the OS/application level, upstream of Emacs entirely. This is exactly why Command-key customization (s- bindings) genuinely requires GUI Emacs, which receives key events directly from macOS with no terminal emulator sitting in between to claim them first.'
    }
  ],
  code: {
    title: 'Reading Emacs notation, and a first look at the elisp variables involved',
    intro: 'This is illustrative — the actual step-by-step configuration for each resolution is the very next lesson\'s subject.',
    code: `;; Reading Emacs's own keybinding notation:
C-x C-f     ; Control-x, then Control-f  (find a file)
M-x         ; Meta-x                     (run any command by name)
C-M-f       ; Control AND Meta held together, then f
s-c         ; Super-c — a binding YOU create, once Cmd->Super is configured

;; The escape-as-meta fallback ALWAYS works, no configuration needed:
;; Press and release Esc, then x  ==  M-x
;; Press and release Esc, then f  ==  M-f

;; In GUI Emacs, these variables (set in your init.el, next covered in
;; Part 4) are what actually control Option/Command behavior:

(setq mac-option-modifier 'meta)
;; Resolution 1: full commit — ALL Option key presses become Meta.

(setq mac-option-modifier nil
      mac-right-option-modifier 'meta)
;; Resolution 3: left Option stays as macOS default (accent composition),
;; ONLY right Option becomes Meta.

(setq mac-command-modifier 'super)
;; Command becomes Super (s-) — a clean namespace for YOUR OWN bindings,
;; guaranteed not to collide with any of Emacs's own C-/M- conventions.`,
    notes: [
      'Nothing here needs to be typed into Emacs yet — this lesson is diagnostic (understanding the conflict and the options); the next lesson walks through actually applying whichever resolution you choose.',
      'These specific variable names (mac-option-modifier, etc.) only exist in GUI Emacs (Emacs.app) — Terminal Emacs configuration works completely differently, through the terminal emulator\'s own settings, covered next lesson.'
    ]
  },
  lab: {
    title: 'Read Emacs notation and identify the right resolution',
    prompt: 'Answer each question in your own words.',
    starter: `# Q1: What does "C-M-f" mean in Emacs notation?


# Q2: Which resolution requires ZERO configuration and works identically on
# every Emacs, on every platform?


# Q3: Why does Cmd (Command) essentially never reach Terminal Emacs, regardless
# of how it's configured?


# Q4: If someone types in French regularly and needs frequent access to
# accented characters, which resolution (1, 2, or 3) would you recommend, and why?

`,
    checks: [
      { re: 'control.*meta|meta.*control', flags: 'i', must: true, hint: 'C-M-f means Control AND Meta held together, then f.', pass: 'C-M-f explained correctly ✓' },
      { re: 'esc(ape)?', flags: 'i', must: true, hint: 'Escape-as-Meta (Resolution 2) requires no configuration at all.', pass: 'Escape-as-Meta identified ✓' },
      { re: 'terminal', flags: 'i', must: true, hint: 'The terminal emulator itself claims Cmd-key combinations before Emacs ever sees them.', pass: 'Terminal claiming Cmd explained ✓' },
      { re: '(resolution\\s*3|right\\s*option|split)', flags: 'i', must: true, hint: 'Resolution 3 (right Option only) preserves left Option for accent typing while still getting Meta access.', pass: 'Resolution 3 recommended for frequent accent use ✓' }
    ],
    run: 'No terminal command for this one — this lab is about understanding the tradeoffs correctly before configuring anything in the next lesson.',
    solution: `# Q1: What does "C-M-f" mean in Emacs notation?
# Hold Control AND Meta together, then press f.

# Q2: Which resolution requires ZERO configuration and works identically on
# every Emacs, on every platform?
# Resolution 2 — Escape as Meta. Press and release Escape, then the key,
# and it works exactly like holding Meta, with no setup required at all.

# Q3: Why does Cmd (Command) essentially never reach Terminal Emacs, regardless
# of how it's configured?
# The terminal emulator (Terminal.app, iTerm2) itself claims Cmd-key
# combinations for its own shortcuts (new tab, copy, paste) before ever
# forwarding input to Emacs — Emacs never sees the keypress at all.

# Q4: If someone types in French regularly and needs frequent access to
# accented characters, which resolution (1, 2, or 3) would you recommend, and why?
# Resolution 3 (right Option only bound to Meta) — it preserves left Option's
# normal macOS accent-composition behavior for frequent accented-character
# typing, while still providing fast, one-handed access to Meta via the
# right Option key for everyday Emacs commands.`,
    notes: [
      'There is no single "correct" resolution for everyone — the right answer genuinely depends on how much you personally rely on macOS\'s native accent composition versus how much you want fast, natural Meta access.',
      'Escape-as-Meta (Resolution 2) is worth knowing as muscle memory regardless of which other resolution you configure — it is the one fallback that always works, even on someone else\'s unconfigured Emacs.'
    ]
  },
  quiz: [
    {
      q: 'What does "M-x" mean in Emacs notation?',
      options: ['Hold Command, press x', 'Hold Meta, press x', 'Press M, then press x separately', 'A menu shortcut unrelated to modifier keys'],
      correct: 1,
      explain: 'M- is Emacs\'s notation for the Meta modifier — M-x means "hold Meta, press x," which is exactly the command-execution keystroke used throughout this course.'
    },
    {
      q: 'Why is there no single, obvious default mapping for Option to Meta on a Mac?',
      options: ['Mac keyboards do not have an Option key at all', 'Option already has an established, actively-used macOS job (composing accented characters), which directly conflicts with fully dedicating it to Meta', 'Emacs cannot technically read Option key presses under any configuration', 'Meta does not exist as a concept in modern Emacs'],
      correct: 1,
      explain: 'Option is not idle on macOS — it is used system-wide for typing accented/special characters, which is exactly why fully committing it to Meta trades away that existing functionality.'
    },
    {
      q: 'What is the one resolution to the Option/Meta conflict that requires zero configuration?',
      options: ['Buying a PC keyboard for use with the Mac', 'Pressing and releasing Escape, then the key, as an alternate way to send Meta — a longstanding Emacs convention independent of any Mac setting', 'Disabling Option entirely at the macOS system level', 'There is no configuration-free resolution'],
      correct: 1,
      explain: 'Escape-as-Meta is a genuinely old Emacs convention, unrelated to Mac-specific settings, that always works — press Esc, release, then the key, equivalent to holding Meta.'
    },
    {
      q: 'Why can left and right Option be bound to different things (only right Option = Meta, left Option = normal macOS behavior)?',
      options: ['This is not actually possible on any Mac keyboard', 'Left and right Option report as distinguishable, separate key codes at the OS level, so each can be configured independently', 'It requires special third-party hardware to distinguish them', 'Only external keyboards support this, never a laptop\'s built-in keyboard'],
      correct: 1,
      explain: 'Modern Mac keyboards report left and right Option as genuinely distinct key codes, which is exactly what makes binding only one of them to Meta a reliable, non-fragile option.'
    },
    {
      q: 'Why does customizing Command (Cmd) key behavior require GUI Emacs rather than Terminal Emacs?',
      options: ['Command keybindings are disabled by default in all Emacs builds', 'The terminal emulator itself intercepts and handles Command-key combinations for its own shortcuts before Emacs ever receives them', 'GUI Emacs does not actually support Command key customization either', 'Command key behavior is identical in both, so it does not matter which is used'],
      correct: 1,
      explain: 'A terminal emulator claims Command-key combinations for its own use (new tab, copy, paste) upstream of Emacs — GUI Emacs, receiving events directly from macOS, has no such intermediary claiming them first.'
    }
  ],
  pitfalls: [
    'Fully committing Option to Meta without realizing it disables macOS\'s native accented-character composition while inside Emacs — a real loss for anyone who types in a language relying on those characters regularly.',
    'Trying to bind Command (Cmd) keys while running Terminal Emacs, not realizing the terminal emulator itself claims those key combinations before Emacs ever sees them — this is a structural limitation, not a misconfiguration to keep debugging.',
    'Forgetting that Escape-as-Meta always works as a fallback, and getting stuck when a specific Option/Meta configuration is not working as expected on an unfamiliar or freshly-installed Emacs.'
  ],
  interview: [
    {
      q: 'Explain the fundamental conflict between Emacs\'s Meta key convention and macOS\'s Option key, and why it has no single universal solution.',
      a: 'Emacs\'s keybinding conventions were established on keyboards with a dedicated Meta key (or Alt, mapped to serve as Meta), predating the modern Mac keyboard entirely. Mac keyboards have no dedicated Meta key — the natural candidate, Option, is already actively used by macOS itself for composing accented and special characters, a genuine, actively-used system feature, not an obscure edge case. Fully dedicating Option to Meta gains fast Emacs command access but loses that native accent-composition feature; leaving Option untouched preserves accent typing but loses convenient Meta access. There is no universal right answer because the correct tradeoff genuinely depends on how much a given user relies on typing accented characters versus how much they want frictionless Meta access — which is exactly why Emacs on Mac requires an explicit, personal configuration decision rather than shipping one default that works for everyone.'
    },
    {
      q: 'Why is Escape-as-Meta considered the "universal fallback," and where does that convention actually come from?',
      a: 'Escape-as-Meta long predates the Mac — it originates from how terminals historically had to encode a Meta keypress reliably: sending an ESC character immediately followed by the target key was established as an equivalent, unambiguous encoding for "Meta plus that key," usable even on hardware or terminal connections that could not reliably transmit Meta as a genuinely held modifier signal. Because Emacs has interpreted this ESC-then-key sequence as equivalent to M- since long before Macs existed, it works identically in every Emacs build, on every platform, terminal or GUI, with zero Mac-specific configuration required — making it the one option that is guaranteed to work regardless of whatever Option/Meta setup choice (or lack of one) is currently in place.'
    },
    {
      q: 'A colleague wants Cmd-C and Cmd-V to work as copy/paste inside their Terminal-based Emacs setup, matching every other Mac application. Is this achievable, and why or why not?',
      a: 'Not directly, and understanding why is more useful than just saying no: the terminal emulator itself (Terminal.app, iTerm2) is a full macOS application with its own established Command-key shortcuts, and it intercepts and handles Cmd-C/Cmd-V (among others) for ITS OWN purposes before that keypress is ever forwarded to whatever program — Emacs, in this case — happens to be running inside it. No amount of Emacs-side configuration can intercept a keypress the terminal emulator has already claimed and handled upstream. The genuine fix is switching to GUI Emacs (Emacs.app), which receives key events directly from macOS with no terminal emulator in between to claim them first, making Cmd-based customization actually achievable there.'
    },
    {
      q: 'Walk through how you would decide which of the three Option/Meta resolutions to actually adopt for yourself.',
      a: 'Start with how often accented or special characters are genuinely needed day to day — someone writing almost exclusively in English, rarely needing é/ü/ñ-style characters, loses little by fully committing Option to Meta (Resolution 1), gaining the most frictionless, natural Meta access in exchange. Someone who writes in a language relying on those characters regularly should strongly prefer Resolution 3 (right Option only bound to Meta), preserving left Option\'s native behavior while still getting convenient one-handed Meta access from the other side of the keyboard. Regardless of which is chosen, Escape-as-Meta (Resolution 2) is worth knowing as a permanent fallback — it costs nothing to learn, requires no configuration, and works even on an unfamiliar or freshly-installed Emacs where whatever Resolution 1 or 3 setup you are used to has not yet been applied.'
    }
  ]
};
