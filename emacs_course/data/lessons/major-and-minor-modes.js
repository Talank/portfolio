window.LESSONS = window.LESSONS || {};
window.LESSONS['major-and-minor-modes'] = {
  id: 'major-and-minor-modes',
  title: 'Major vs Minor Modes: One Personality Plus Any Number of Add-Ons',
  category: 'Part 5 — Modes: The Emacs Superpower',
  timeMin: 35,
  summary: 'The last lesson mentioned "mode-specific keymaps" without fully explaining what a mode actually is — this is where that gets explained properly. Every buffer has exactly ONE major mode, determining its fundamental behavior. On top of that, any NUMBER of minor modes can stack simultaneously, each adding one small, independent, focused feature. Together, this is the mechanism behind syntax highlighting, spell-check, line numbers, and most of what makes a given buffer feel specialized for its actual content.',
  goals: [
    'Explain what a major mode is, and why a buffer can only ever have exactly one at a time',
    'Explain what a minor mode is, and how any number can stack alongside the major mode',
    'Check which modes are currently active in a buffer using the mode-line and C-h m',
    'Toggle a minor mode on or off, both interactively and in elisp',
    'Explain auto-mode-alist: how Emacs automatically picks the right major mode when you open a file'
  ],
  concept: [
    {
      h: 'Major mode: exactly one per buffer, determining its fundamental behavior',
      p: [
        'Every single buffer has exactly ONE <b>major mode</b> active at all times — never zero, never more than one. A major mode determines the buffer\'s fundamental character: syntax highlighting rules, indentation behavior, and (per the previous lesson) its own mode-specific KEYMAP, which can override global bindings for anything specific to that mode\'s purpose. <code>fundamental-mode</code> is the generic, deliberately featureless default — no special syntax highlighting, no special indentation rules, essentially "plain text with none of the extras."',
        'Switching a buffer\'s major mode is entirely possible (<code>M-x python-mode</code> would switch the current buffer to Python-editing behavior, for instance), but the exclusivity always holds: whatever the buffer\'s major mode currently is, it is exactly one thing at any given moment, never a combination of two major modes simultaneously.'
      ]
    },
    {
      h: 'Minor mode: any number, stacking freely alongside the major mode',
      p: [
        'A <b>minor mode</b> is genuinely different in kind: any number of minor modes can be active SIMULTANEOUSLY, layered on top of whatever the buffer\'s one major mode happens to be, each contributing one small, focused, independent piece of behavior. <code>flyspell-mode</code> adds live spell-checking; <code>show-paren-mode</code> highlights matching parentheses; the earlier lesson\'s <code>global-display-line-numbers-mode</code> is a "global" variant of a minor mode, applying across every buffer at once rather than needing to be turned on individually per buffer.',
        'This is exactly the design that lets a Python-editing buffer simultaneously have syntax highlighting (from its ONE major mode, python-mode) AND spell-checking active in its comments (from a minor mode, flyspell-mode, layered on top) AND paren-matching highlighted (another minor mode, show-paren-mode) — three genuinely independent pieces of behavior, freely combinable, none of them needing to know or care about the others\' existence.'
      ]
    },
    {
      h: 'Checking what is currently active: the mode-line, and C-h m',
      p: [
        'The mode-line (the status bar at the bottom of each window) shows the current buffer\'s MAJOR mode name directly, plus a set of abbreviated indicators for whichever minor modes happen to be active — genuinely worth glancing at the moment a buffer is behaving unexpectedly, since it answers "what mode is this buffer even in right now" at a glance.',
        '<code>C-h m</code> (describe-mode) goes further, opening a full <code>*Help*</code> buffer describing EVERY currently active mode for the current buffer — major and minor both — including each one\'s own documentation and, critically, its own specific keybindings. This is genuinely the single most useful command for diagnosing "why does pressing this key do something unexpected in THIS particular buffer" — it directly answers exactly what modes are active and what each one is contributing.'
      ]
    },
    {
      h: 'auto-mode-alist: how the right major mode gets picked automatically',
      p: [
        'When you open a file with C-x C-f (Part 2\'s subject), Emacs does not leave you in generic fundamental-mode by default — it automatically activates whatever major mode is actually APPROPRIATE for that file, based on a lookup table called <code>auto-mode-alist</code>, matching filename patterns (almost always by file extension) to the major mode that should activate. Opening a <code>.py</code> file automatically activates python-mode; a <code>.el</code> file automatically activates emacs-lisp-mode; and so on, entirely automatically, with no manual mode-switching needed for any common, recognized file type.',
        'This is directly why file-opening in Part 2 "just worked" with appropriate syntax highlighting already active, without this course needing to explain any manual mode-switching step at that point — auto-mode-alist was quietly doing that work the whole time. Adding one entry to this table (shown in this lesson\'s code example) extends it for a custom or unusual file extension not already recognized, genuinely useful the moment you start working with a file type Emacs does not already know about.'
      ]
    }
  ],
  conceptFlow: {
    title: 'Opening a .py file: auto-mode-alist picks the right major mode',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'The action',
        nodes: [
          { id: 'open', text: 'C-x C-f script.py <RET>' }
        ]
      },
      {
        label: 'The lookup',
        nodes: [
          { id: 'check', text: 'Emacs checks auto-mode-alist:\nwhich pattern matches "script.py"?' }
        ]
      },
      {
        label: 'The match',
        nodes: [
          { id: 'match', text: '"\\\\.py\\\\\'" pattern matches ->\nassociated mode: python-mode' }
        ]
      },
      {
        label: 'What happens next',
        nodes: [
          { id: 'activate', text: 'python-mode is activated\nfor this new buffer' },
          { id: 'effects', text: 'Syntax highlighting, indentation rules,\nand python-mode\'s own keymap\nall become active, automatically' }
        ]
      }
    ],
    steps: [
      { active: ['open'], note: 'You open a file — nothing about this command explicitly mentions Python or any specific mode at all.' },
      { active: ['check'], note: 'Behind the scenes, before showing you the buffer, Emacs checks the filename against every pattern registered in auto-mode-alist, looking for a match.' },
      { active: ['match'], note: 'The pattern for ".py" files matches, and that pattern is associated with python-mode specifically — this association is exactly what auto-mode-alist stores, as a lookup table.' },
      { active: ['activate'], note: 'python-mode is activated for this buffer as its one major mode — this happens automatically, with no manual M-x python-mode ever needed.' },
      { active: ['effects'], note: 'Everything that comes with python-mode being active kicks in immediately: Python-aware syntax highlighting, Python-appropriate indentation behavior, and python-mode\'s own keymap (from the previous lesson) all become active for this buffer — which is exactly why opening a recognized file type in Emacs "just works" correctly, without ever needing to manually configure any of this per file.' }
    ]
  },
  story: {
    onePiece: {
      title: 'One Crew Role, Any Number of Personal Habits Layered On Top',
      text: 'Every Straw Hat has exactly ONE assigned ship role — Zoro is the swordsman, Sanji is the cook, Nami is the navigator — and that one role determines their core, fundamental responsibilities aboard the ship, genuinely exclusive: nobody carries two ship roles simultaneously, and nobody carries zero. But layered on TOP of that one core role, each crew member also carries any NUMBER of personal habits and quirks, entirely independent of each other and of the role itself — Zoro is the swordsman, PLUS he has an independent habit of napping at every opportunity, PLUS an entirely separate, genuinely persistent habit of getting lost even in small spaces, PLUS a habit of drinking constantly, none of these individual habits changing or interfering with his one core role as swordsman, and none of them requiring the others to even exist. Sanji is the cook, PLUS an independent habit of doting excessively on anyone he perceives as a lady, PLUS a separate habit of smoking constantly — again, freely stackable habits, layered on top of one fixed role, each genuinely independent of the others. And when a brand-new recruit joins the crew, Nami does not manually decide their role from scratch every single time out of nothing — she has a rough, informal system: someone who shows up already carrying navigational instruments and chart-reading habits gets slotted toward navigation-adjacent duties by default, someone who arrives with cooking gear gets slotted toward the galley, automatically, based on recognizable traits they already showed up with — not a rigid rule, but a genuine, working default that saves her from starting the assignment conversation fresh with every single new person.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'One Core Function in the Group, Any Number of Personal Quirks Layered On Top',
      text: 'Within the friend group\'s actual dynamic, each person genuinely occupies one PRIMARY function — Sheldon is the rules-enforcer and resident scientist, Monica (once she is properly folded into the group\'s orbit) is the organizer, Chandler is the one who defuses tension with a joke — and that one core function is, in practice, genuinely exclusive: nobody is simultaneously "the organizer" AND "the rules-enforcer" in the same breath, and nobody occupies zero function within the group\'s actual dynamic. But layered on TOP of that one core function, each person ALSO carries any number of entirely independent personal quirks — Sheldon is the rules-enforcer, PLUS an independent germophobia habit, PLUS a completely separate specific-seating-spot requirement, PLUS a habit of over-explaining physics to anyone nearby, none of these individual quirks changing or interfering with his one core function, and none of them needing each other to exist at all. Monica is the organizer, PLUS an independent competitive-streak habit, PLUS a separate compulsive-cleaning habit — again, freely stackable, independent quirks, layered on top of one fixed core function. And when someone entirely new joins a gathering for the first time, the group does not carefully deliberate their role from scratch — there is a rough, informal, working default: someone who shows up already organizing the snacks unprompted gets slotted, by default, toward "helps keep things running," someone who shows up cracking jokes immediately gets slotted toward "keeps things light," based on recognizable traits they already displayed on arrival, not a rigid formal process, but a genuine working shortcut that saves everyone from deliberating fresh with every single new person.'
    },
    why: 'Each Straw Hat\'s one exclusive ship role, with any number of independent personal habits freely layered on top, is exactly major mode (one, exclusive, determining the fundamental character) plus minor modes (any number, stacking freely, each independently focused). And Nami\'s and the group\'s rough "recognizable trait triggers a default assignment" habit is exactly auto-mode-alist — a filename pattern automatically triggering the right major mode, with no manual deliberation needed for the common, recognized cases.'
  },
  tech: [
    {
      q: 'Why can a buffer only ever have ONE major mode active, while it can have any number of minor modes simultaneously — what is the actual design reasoning behind this asymmetry?',
      a: 'A major mode determines the buffer\'s FUNDAMENTAL interpretation and behavior — what kind of content this buffer actually holds, and how it should be parsed, highlighted, and indented as a result — and it genuinely does not make sense for a buffer to be simultaneously interpreted as, say, both Python source code AND plain prose text at the same time; those are mutually exclusive fundamental characterizations of the same content. A minor mode, by contrast, adds one small, additive, genuinely independent FEATURE on top of whatever the content already fundamentally is — spell-checking, paren-highlighting, and line numbers do not conflict with each other or with the buffer\'s fundamental nature, and there is no coherent reason multiple such independent features could not all apply simultaneously to the same buffer. The asymmetry reflects a real, meaningful difference in what each kind of mode is actually FOR, not an arbitrary technical restriction.'
    },
    {
      q: 'Give a concrete scenario where C-h m (describe-mode) would genuinely be the fastest way to diagnose a problem, rather than guessing.',
      a: 'Suppose a specific key sequence you expect to work (perhaps because it works in most OTHER buffers) does nothing, or does something entirely unexpected, in one SPECIFIC buffer — per the previous lesson, this is very possibly because that buffer\'s major mode (or an active minor mode) has its own keymap binding that key differently, overriding the global behavior you were expecting. Rather than guessing which mode might be responsible, or manually checking C-h k for that one specific key and then separately trying to figure out WHICH active mode owns that override, C-h m directly lists every currently active mode for that buffer, major and minor both, along with each one\'s own bindings and documentation — giving you the complete picture in one place, rather than needing to separately investigate each individually active mode to piece together the explanation yourself.'
    },
    {
      q: 'Beyond convenience, why does auto-mode-alist matter enough to be worth understanding explicitly, rather than just being a minor nice-to-have?',
      a: 'Without it, EVERY file opened would default to fundamental-mode\'s deliberately generic, featureless behavior — no syntax highlighting, no language-appropriate indentation, none of the mode-specific keybindings a specialized mode provides — requiring a MANUAL mode-switch (M-x python-mode, and so on) after every single file open, for every single file, before any of that specialized behavior would kick in. This would make Emacs\'s file-editing experience genuinely tedious and error-prone (forgetting to switch modes after opening a file is an easy, real mistake to make) at a scale that would undermine a large fraction of what makes major modes actually useful in daily practice. auto-mode-alist automating this lookup, invisibly, on every file open, is precisely what makes "open a file and it already looks and behaves correctly for its content" feel effortless rather than something requiring a manual extra step every single time.'
    }
  ],
  code: {
    title: 'Checking, toggling, and extending mode behavior',
    intro: 'Try this against a few different kinds of real files to see the mode-line change.',
    code: `;; Open a Python file and check the mode-line:
C-x C-f script.py <RET>
;; Mode-line shows something like:  -:--- script.py   Python   (12,0)
;;                                                     ^^^^^^ the MAJOR mode

;; See everything active in this buffer, major AND minor:
C-h m
;; *Help* buffer lists: python-mode (with its full documentation and
;; keybindings), plus any active minor modes like flyspell-mode or
;; show-paren-mode, each with their own section.

;; Toggle a minor mode interactively:
M-x flyspell-mode <RET>
;; Turns flyspell-mode ON if it was off, or OFF if it was already on —
;; a toggle, when called interactively with no argument.

;; Explicit on/off in elisp (the convention seen in earlier use-package examples):
(flyspell-mode 1)     ; explicitly turn ON
(flyspell-mode -1)    ; explicitly turn OFF
;; A positive argument (or none, interactively) means "on"; -1 means "off" —
;; this is exactly the convention behind (global-company-mode 1) from the
;; previous lesson's use-package examples.

;; Extending auto-mode-alist for a custom file extension:
(add-to-list 'auto-mode-alist '("\\\\.myconfig\\\\'" . conf-mode))
;; Now opening any file ending in .myconfig automatically activates
;; conf-mode, without ever needing to manually switch to it.`,
    notes: [
      'The pattern in auto-mode-alist entries is itself a regular expression — "\\\\." matches a literal dot, "\\\\\'" anchors to the end of the filename, standard regex syntax applying here exactly as it would anywhere else.',
      'C-h m is genuinely worth running the first time you open an unfamiliar file type, purely to see what mode Emacs picked and what that mode actually offers.'
    ]
  },
  lab: {
    title: 'Identify modes and write the right commands',
    prompt: 'Answer and write commands as each task asks.',
    starter: `# Q: A buffer has python-mode active, plus flyspell-mode and show-paren-mode
# also active. Which ONE of these is the major mode, and why can you tell?


# Task: check every currently active mode (major and minor) for the current buffer


# Task: explicitly turn ON show-paren-mode via elisp (not a toggle)


# Task: add an auto-mode-alist entry so files ending in ".conf" automatically
# activate conf-mode

`,
    checks: [
      { re: 'python-mode.*major|major.*python-mode', flags: 'i', must: true, hint: 'python-mode is the major mode — a buffer can only have ONE, and the others (flyspell, show-paren) are minor modes that stack on top.', pass: 'python-mode identified as the major mode ✓' },
      { re: 'C-h\\s+m', flags: '', must: true, hint: 'C-h m (describe-mode) lists every active mode for the current buffer.', pass: 'C-h m ✓' },
      { re: '\\(show-paren-mode\\s+1\\)', flags: '', must: true, hint: '(show-paren-mode 1) explicitly turns it on.', pass: '(show-paren-mode 1) ✓' },
      { re: "add-to-list\\s+'auto-mode-alist[\\s\\S]*\\.conf[\\s\\S]*conf-mode", flags: 'i', must: true, hint: "(add-to-list 'auto-mode-alist '(\"\\\\.conf\\\\'\" . conf-mode))", pass: 'auto-mode-alist entry for .conf ✓' }
    ],
    run: 'Try it for real: open a few different file types and run C-h m on each to see how the active modes differ.',
    solution: `# Q: A buffer has python-mode active, plus flyspell-mode and show-paren-mode
# also active. Which ONE of these is the major mode, and why can you tell?
# python-mode is the major mode. A buffer can only ever have exactly one major
# mode, while any number of minor modes (flyspell-mode, show-paren-mode) can
# stack alongside it — python-mode determines the buffer's fundamental
# behavior, the other two are independent, focused add-on features.

# Task: check every currently active mode (major and minor) for the current buffer
C-h m

# Task: explicitly turn ON show-paren-mode via elisp (not a toggle)
(show-paren-mode 1)

# Task: add an auto-mode-alist entry so files ending in ".conf" automatically
# activate conf-mode
(add-to-list 'auto-mode-alist '("\\\\.conf\\\\'" . conf-mode))`,
    notes: [
      'The mode-line itself is often the fastest first check — the major mode name is shown directly and prominently, with minor modes as smaller abbreviated indicators nearby.',
      'The double-backslash in the auto-mode-alist regex pattern is because the pattern is written as an elisp STRING, where a literal backslash needs to be escaped as \\\\ within the string itself — standard elisp string-escaping, unrelated to the regex syntax itself.'
    ]
  },
  quiz: [
    {
      q: 'How many major modes can a single buffer have active at the same time?',
      options: ['Any number, freely stacking', 'Exactly one, always', 'Zero or one, but never more than one', 'It depends on how many minor modes are also active'],
      correct: 1,
      explain: 'A buffer always has exactly one major mode active — never zero, never more than one — determining its fundamental behavior.'
    },
    {
      q: 'How many minor modes can be active in a single buffer at the same time?',
      options: ['At most one, same as major modes', 'Any number, stacking freely alongside the one major mode', 'Exactly zero; minor modes cannot be combined with major modes', 'Minor modes replace the major mode when activated'],
      correct: 1,
      explain: 'Any number of minor modes can be active simultaneously, each contributing one independent, focused feature layered on top of the buffer\'s one major mode.'
    },
    {
      q: 'What does C-h m show?',
      options: ['Only the current buffer\'s major mode name, nothing else', 'Full documentation and keybindings for EVERY currently active mode in the buffer — major and minor', 'A list of all installed packages, active or not', 'The current buffer\'s file path'],
      correct: 1,
      explain: 'C-h m (describe-mode) gives a complete picture of every active mode for the current buffer, including each one\'s own documentation and keybindings — genuinely useful for diagnosing unexpected behavior.'
    },
    {
      q: 'What does auto-mode-alist do?',
      options: ['Automatically saves every buffer at regular intervals', 'Maps filename patterns (usually extensions) to the major mode that should activate automatically when such a file is opened', 'Lists every minor mode currently available', 'Automatically formats code according to a fixed style'],
      correct: 1,
      explain: 'auto-mode-alist is a lookup table matching filename patterns to major modes, letting Emacs automatically activate the right mode (syntax highlighting, indentation, keybindings) the moment a recognized file type is opened.'
    },
    {
      q: 'In elisp, what does "(flyspell-mode 1)" do, compared to just running M-x flyspell-mode interactively?',
      options: ['They behave identically in every case', '(flyspell-mode 1) explicitly turns it ON; running it interactively with no argument TOGGLES it (on if off, off if on)', '(flyspell-mode 1) turns it off; interactive M-x turns it on', 'Neither actually changes anything without also restarting Emacs'],
      correct: 1,
      explain: 'A positive numeric argument (like 1) explicitly turns a mode on (and -1 explicitly turns it off); calling it interactively with no argument toggles between the two states instead.'
    }
  ],
  pitfalls: [
    'Assuming a keybinding behaves identically everywhere without checking whether the current buffer\'s major mode (or an active minor mode) has its own overriding binding for that key.',
    'Manually switching major modes after opening every file out of habit, not realizing auto-mode-alist already handles this automatically for any recognized file type.',
    'Confusing a toggle call (M-x mode-name, interactively, with no argument) with an explicit on/off call (mode-name 1) or (mode-name -1) — a toggle can accidentally turn something OFF if it was already on, when the intent was to guarantee it is turned ON.'
  ],
  interview: [
    {
      q: 'Explain the distinction between major and minor modes, and why this distinction is fundamental to how Emacs adapts to different kinds of content.',
      a: 'A major mode is exactly one per buffer, determining the buffer\'s fundamental character — syntax highlighting rules, indentation behavior, and its own keymap, appropriate to the actual kind of content the buffer holds. A minor mode is a small, independent, ADDITIVE feature — any number can be active simultaneously, layered on top of whatever the buffer\'s one major mode happens to be, each contributing one focused capability (spell-check, paren-matching, line numbers) without needing to know about or interact with the others. This two-tier system is what lets Emacs specialize deeply for a specific kind of content (via the one exclusive major mode) while still letting a user freely mix in whatever additional independent capabilities they personally want (via any number of minor modes), rather than forcing every possible combination of features to be pre-packaged into one monolithic mode per file type.'
    },
    {
      q: 'Walk through exactly what happens, mechanically, from running C-x C-f on a recognized file type through to that buffer having the right syntax highlighting active.',
      a: 'C-x C-f prompts for and reads a file path, then, before finishing the process of creating and displaying the buffer, Emacs checks that filename against every pattern registered in auto-mode-alist, looking for a match — almost always based on the file\'s extension. If a match is found (say, ".py" mapping to python-mode), that major mode is automatically activated for the newly-created buffer, which in turn applies python-mode\'s own syntax-highlighting rules, indentation behavior, and keymap to that buffer — all of this happening automatically, without the user ever needing to manually invoke M-x python-mode themselves. If no pattern in auto-mode-alist matches the filename, the buffer instead defaults to fundamental-mode, Emacs\'s deliberately generic, featureless baseline.'
    },
    {
      q: 'A user reports that pressing a specific key does something different in one particular file than it does in every other file they normally work with. How would you help them diagnose this, using tools this course has covered?',
      a: 'Start with C-h m in the specific buffer where the behavior differs — it lists every currently active mode (major and minor) for that buffer, along with each one\'s own keybindings, which will very likely reveal that this particular buffer\'s major mode (or an active minor mode not active in their other files) has its own override binding for that specific key, taking priority over whatever global binding they were expecting, per the previous lesson\'s keymap-layering explanation. Cross-checking the mode-line first (a quick glance at which major mode is currently active) and then C-h m for the full picture is a fast, systematic way to go from "this key behaves unexpectedly here" to a specific, actionable explanation, rather than guessing.'
    },
    {
      q: 'Why might a well-designed package choose to implement its added functionality as a minor mode rather than requiring users to switch their buffer\'s major mode to use it?',
      a: 'Because the functionality is genuinely ADDITIVE and independent of what kind of content the buffer already holds — a spell-checker, for instance, is equally useful whether the underlying content is Python source code\'s comments, a plain text document, or an email draft, and none of those contexts should need to sacrifice their own appropriate major mode (with its own correct syntax highlighting and indentation) just to gain spell-checking. Implementing it as a minor mode lets it layer on top of ANY major mode the user is already using, coexisting freely, rather than forcing an exclusive, all-or-nothing choice between "get this feature" and "keep the major mode genuinely appropriate for my actual content" — exactly the flexibility the major/minor distinction is designed to provide.'
    }
  ]
};
