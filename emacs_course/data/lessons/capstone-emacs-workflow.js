window.LESSONS = window.LESSONS || {};
window.LESSONS['capstone-emacs-workflow'] = {
  id: 'capstone-emacs-workflow',
  title: 'Capstone: Build Your Real init.el (use-package, keys, org, Magit, TRAMP)',
  category: 'Part 7 — Terminal, Shell, Remote & Capstone',
  timeMin: 60,
  summary: 'Every previous lesson covered one piece in isolation: the init file\'s load order, use-package, keybindings, modes, Org, project.el, eglot, Magit, TRAMP. This capstone is where they stop being separate topics and become one real, working init.el -- the actual configuration file you would genuinely keep using after this course ends, built deliberately, piece by piece, in the correct order, with each piece explained in terms of exactly which earlier lesson it depends on.',
  goals: [
    'Assemble a real, working init.el from the individual pieces covered across the whole course',
    'Order the file correctly: package setup, before any use-package call that needs it',
    'Add a small, deliberate set of custom keybindings layered correctly over existing modes',
    'Wire in Org, Magit, and eglot with lazy-loading use-package declarations',
    'Explain, for any single line in the finished file, exactly which earlier lesson justifies it being there'
  ],
  concept: [
    {
      h: 'Why order is the single most important property of a real init.el',
      p: [
        'The init-file lesson established that Emacs evaluates init.el top to bottom, once, at startup -- nothing about that changes here, but a real, multi-feature init.el is where getting the order wrong actually starts to matter in visible ways. Package-archive setup (MELPA, GNU ELPA) must run BEFORE any <code>use-package</code> declaration that installs from those archives, because a use-package call has nothing to fetch from if the archive list has not been configured yet. Custom keybindings that OVERRIDE a mode\'s own bindings must run AFTER that mode is loaded (or be deferred via use-package\'s <code>:bind</code>, which handles the ordering correctly on its own) -- binding a key before the mode defining a conflicting default for it even exists means the mode\'s own binding wins when it loads later and silently overwrites yours.',
        'A real init.el, built across this whole course, therefore has a natural, non-arbitrary shape: package/archive setup first, foundational UI and editing preferences next, then one use-package block per feature (Org, Magit, eglot, and so on), each block self-contained and internally ordered (install/config/bind), or lazy-loaded so ordering relative to OTHER blocks stops mattering at all.'
      ]
    },
    {
      h: 'use-package as the organizing unit for everything else',
      p: [
        'The packages lesson introduced <code>use-package</code>\'s <code>:ensure</code> (install if missing), <code>:config</code> (run after load), <code>:bind</code> (set keys, deferring load until first use), and lazy loading generally. In a real init.el, use-package stops being one technique among several and becomes the DEFAULT organizing unit for essentially every feature beyond the bare built-ins -- each feature gets its own self-contained block, and the file as a whole reads as a list of "here is what I want, and here is exactly how it is configured," rather than a tangle of manually ordered require and setq calls scattered throughout.',
        'This has a genuinely practical payoff at real capstone scale: with five or six real features (Org, Magit, eglot, project.el tuning, a completion framework, custom keybindings) each in its own use-package block, removing or temporarily disabling any ONE of them is a matter of commenting out or deleting exactly one self-contained block, with no risk of silently breaking an unrelated feature whose configuration happened to be interleaved with it.'
      ]
    },
    {
      h: 'Wiring the capstone features together: Org, Magit, eglot',
      p: [
        'Org mode needs essentially no :ensure (it ships built into modern Emacs) but genuinely benefits from a :bind block for the global entry points (org-agenda, org-capture) established in the Org lesson, plus a :config block setting the actual agenda file list -- exactly the pieces that lesson introduced, now living in one place instead of scattered across the file. Magit needs :ensure (it is a real MELPA package) and typically just one global keybinding, <code>C-x g</code>, for magit-status -- the single entry point the whole hunk-staging and commit workflow from that lesson builds from.',
        'eglot, being built into modern Emacs since version 29, needs no :ensure either -- a realistic capstone wiring adds a hook so it starts automatically for the specific major modes you actually work in (rather than requiring a manual M-x eglot every single time), which is a genuinely reasonable thing to automate precisely because eglot connecting is safe and has no meaningful downside when a language server happens to already be available.'
      ]
    },
    {
      h: 'A finished init.el is never actually "finished"',
      p: [
        'The realistic end state of this capstone is not a permanent, unchanging file -- it is a genuine, working starting point that keeps evolving exactly the way the init-file lesson described: open it with <code>C-x C-f</code> pointed at <code>~/.emacs.d/init.el</code> (or wherever it actually lives), add a new use-package block when a new need shows up, remove one when a tool stops being useful, and reload with <code>M-x eval-buffer</code> to test a change without even restarting Emacs.',
        'This is the genuinely important habit the whole course has been building toward: a real Emacs configuration is not something to get "correct" once and then leave alone -- it is a living reflection of how you personally actually work, edited with the exact same tool it configures, using the exact same skills (buffers, keybindings, use-package, even Magit for tracking its own changes over time) this course spent its previous six parts teaching.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Assembling the Real Ship Log From Every Separate Notebook the Crew Has Kept',
      text: 'Across many separate islands, every member of the crew has been keeping their own small, separate notebook -- Nami her navigation notes, Usopp his weapon-maintenance log, Chopper his medical records, Robin her research on ancient text -- each genuinely useful on its own, but never actually consolidated into one real, working ship log anyone could rely on day to day. The capstone moment is when Nami finally sits down and builds that real log: not by throwing all the separate notebooks together unsorted, but deliberately, in a specific order -- first, the basic conventions everyone\'s entries need to follow so later entries can actually be found (the equivalent of package/archive setup); then each person\'s notes copied in as its own clearly labeled, self-contained section, Usopp\'s weapon log fully separate from Chopper\'s medical notes, so removing or updating any ONE section never risks garbling another. And critically, she does not treat this as a one-time task -- the real ship log stays open on the navigation table permanently, gaining a new section whenever the crew picks up a new genuine need, with old sections removed once they stop being useful. Robin, watching this finally come together, observes: "This is not a NEW notebook. This is every real notebook we already had, finally organized so any one of us can actually use all of it together, and it will keep changing exactly as long as we keep sailing."'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Real, Working Household Binder, Built From Everyone\'s Separate Sticky Notes',
      text: 'Across many separate weeks, everyone in the friend group has independently kept their own scattered system -- Chandler\'s sticky notes about bills, Joey\'s scrawled reminders about auditions, Rachel\'s fashion-related to-do list, Ross\'s meticulously organized but totally separate paleontology conference notes -- each genuinely useful to the person who made it, but never actually combined into one real household system anyone could rely on. The capstone moment is Monica finally building the real binder: not by stapling every sticky note together randomly, but deliberately, in a specific order -- first, the basic tab and labeling conventions everyone\'s section needs to follow so anything can actually be found later (the equivalent of package/archive setup); then each person\'s material added as its own clearly labeled, genuinely self-contained tab, Chandler\'s bill tab fully separate from Joey\'s audition tab, so updating or removing any ONE tab never risks disturbing another. And critically, Monica does not treat this as a one-time project -- the real binder stays on the kitchen counter permanently, gaining a new tab whenever a genuine new need shows up, with old tabs removed once they stop mattering. Chandler, watching it come together, says: "This is not a NEW binder. This is every real thing we were already separately tracking, finally organized so any of us can actually use it, and it is going to keep changing as long as we live here."'
    },
    why: 'The consolidated ship log, built deliberately in order with each contributor\'s notes as its own self-contained section, and Monica\'s real household binder with its own labeled, independent tabs, are exactly what a real capstone init.el is: not a brand-new thing invented from nothing, but every genuinely separate piece from this whole course -- keybindings, Org, Magit, eglot, TRAMP-aware workflows -- finally assembled, in the correct order, into one working file, each piece self-contained enough to change or remove without disturbing the others, and never actually "finished" so much as continuously kept alive.'
  },
  tech: [
    {
      q: 'Concretely, why must package-archive setup (MELPA, GNU ELPA) appear before any use-package :ensure call in a real init.el, and what specifically breaks if the order is reversed?',
      a: 'A use-package call with :ensure t needs to know WHERE to actually fetch the package from if it is not already installed -- that "where" is exactly the list of package archives configured via package-archives and initialized with package-initialize (or the equivalent modern setup). If a use-package :ensure call runs before that archive configuration has executed, the package-installation machinery has no archive list to consult yet, and the install genuinely fails or falls back to whatever default (often empty or incomplete) archive list existed beforehand -- not a subtle slowdown, but an outright failure to find the package at all, which is exactly why archive setup is always placed at the very top of a real init.el, before the first feature-specific use-package block.'
    },
    {
      q: 'Why does deferring eglot to start automatically via a mode hook, rather than requiring a manual M-x eglot every time, represent a reasonable use of automation specifically for eglot, when the course has generally emphasized understanding over blind automation?',
      a: 'The course\'s general caution about automation is really about not blindly automating things whose BEHAVIOR you do not yet understand -- but by the point eglot is being wired into a real init.el, its behavior has already been covered in full: it connects to an already-installed, separately managed language server, and connecting has no meaningful downside if a server happens to be available (it simply adds diagnostics and better completion) and fails safely with a clear error if one is not. Automating a genuinely well-understood, safe, no-downside action is different in kind from automating something whose consequences you have not yet reasoned through -- the hook is not a shortcut around understanding eglot, it is exactly what you do ONCE you understand it well enough to know automating it is safe.'
    },
    {
      q: 'Explain concretely why organizing a real init.el as one use-package block per feature makes removing or disabling a single feature safer than a file built from manually interleaved require and setq calls.',
      a: 'A use-package block is deliberately self-contained: its :ensure, :config, and :bind clauses for one feature live together, in one place, with no dependency on setq or require calls belonging to a DIFFERENT feature being interleaved nearby. Deleting or commenting out that one block therefore removes exactly that feature\'s configuration and nothing else. A file built instead from manually ordered, interleaved require and setq calls has no such natural boundary -- a setq intended for one feature might sit physically adjacent to, or even be accidentally load-order-dependent on, code belonging to an entirely different feature, so removing "one feature\'s" configuration risks silently breaking another that happened to be tangled up nearby, purely as an accident of how the file was originally written.'
    }
  ],
  code: {
    title: 'A real, working init.el, assembled from the whole course',
    intro: 'This is genuinely close to a real, usable init.el -- every block traces directly back to an earlier lesson in this course.',
    code: `;; ---- 1. Package archive setup (must come first -- see the-init-file lesson) ----
(require 'package)
(add-to-list 'package-archives '("melpa" . "https://melpa.org/packages/"))
(package-initialize)

;; ---- 2. Foundational editing preferences ----
(setq inhibit-startup-screen t)
(setq custom-file (expand-file-name "custom.el" user-emacs-directory))
(load custom-file 'noerror)
;; (custom-file kept separate -- see the-init-file lesson)

;; ---- 3. Custom global keybindings (layered over defaults -- see
;;         keybinding-customization lesson) ----
(global-set-key (kbd "C-c o") 'other-window)
(global-set-key (kbd "C-c g") 'magit-status)

;; ---- 4. Org mode (see org-mode-essentials lesson) ----
(use-package org
  :bind (("C-c a" . org-agenda)
         ("C-c c" . org-capture))
  :config
  (setq org-agenda-files '("~/org/work.org" "~/org/personal.org")))

;; ---- 5. Magit (see version-control-with-magit lesson) ----
(use-package magit
  :ensure t
  :bind ("C-x g" . magit-status))

;; ---- 6. eglot, auto-started for languages you actually use
;;         (see completion-and-lsp lesson) ----
(use-package eglot
  :hook ((python-mode . eglot-ensure)
         (go-mode . eglot-ensure)))

;; ---- 7. project.el tuning (see project-navigation-and-search lesson) ----
(global-set-key (kbd "C-x p f") 'project-find-file)
(global-set-key (kbd "C-x p g") 'project-find-regexp)

;; A remote workflow this whole init.el already supports with zero extra
;; code, purely because TRAMP is built into Emacs's core file handling
;; (see tramp-remote-editing lesson):
;;   C-x C-f /ssh:you@server:/path/to/file.py
;;   -> eglot-ensure still fires via the python-mode hook above,
;;      magit-status still works if that path is inside a git repo,
;;      Org and project.el both still work exactly as shown --
;;      nothing here is aware, or needs to be aware, that the file is remote.`,
    notes: [
      'Every single block above is traceable to one specific earlier lesson -- that traceability is the actual point of this capstone, not the specific keybindings chosen.',
      'The remote-workflow note at the bottom is deliberate: it demonstrates that nothing about this file needed to be written differently to support TRAMP -- that transparency is exactly what the TRAMP lesson explained.'
    ]
  },
  lab: {
    title: 'Assemble the missing pieces of a real init.el',
    prompt: 'Fill in each blank so the resulting init.el is correctly ordered and complete.',
    starter: `;; Task: the very first thing a real init.el needs, before any use-package
;; :ensure call, so packages can actually be found and installed


;; Task: a use-package block for Magit that installs it if missing and
;; binds C-x g to magit-status


;; Task: a use-package block for eglot that automatically starts it for
;; python-mode buffers, via a hook (no manual M-x eglot needed)


;; Q: In one or two sentences, explain why this init.el needs no special
;; code at all to make Magit and eglot work correctly on a TRAMP-opened
;; remote file.

`,
    checks: [
      { re: 'package-initialize', flags: '', must: true, hint: 'package-initialize (after configuring package-archives) must run before any use-package :ensure call.', pass: 'Package setup ✓' },
      { re: 'use-package\\s+magit[\\s\\S]*:ensure[\\s\\S]*:bind[\\s\\S]*magit-status', flags: '', must: true, hint: 'use-package magit needs :ensure t and a :bind for magit-status, typically on C-x g.', pass: 'Magit block ✓' },
      { re: 'use-package\\s+eglot[\\s\\S]*:hook[\\s\\S]*python-mode[\\s\\S]*eglot-ensure', flags: '', must: true, hint: 'use-package eglot with a :hook on python-mode calling eglot-ensure starts it automatically.', pass: 'eglot hook block ✓' },
      { re: 'core|file-handling|transparent|redirect|same\\s+function', flags: 'i', must: true, hint: 'TRAMP redirects Emacs\'s own core file-handling functions, which Magit and eglot already use -- no special-casing needed anywhere else.', pass: 'Explained TRAMP transparency ✓' }
    ],
    run: 'This is genuinely worth doing for real: open your own ~/.emacs.d/init.el and add at least one block from this lesson to it.',
    solution: `;; Task: the very first thing a real init.el needs, before any use-package
;; :ensure call, so packages can actually be found and installed
(require 'package)
(add-to-list 'package-archives '("melpa" . "https://melpa.org/packages/"))
(package-initialize)

;; Task: a use-package block for Magit that installs it if missing and
;; binds C-x g to magit-status
(use-package magit
  :ensure t
  :bind ("C-x g" . magit-status))

;; Task: a use-package block for eglot that automatically starts it for
;; python-mode buffers, via a hook (no manual M-x eglot needed)
(use-package eglot
  :hook (python-mode . eglot-ensure))

;; Q: In one or two sentences, explain why this init.el needs no special
;; code at all to make Magit and eglot work correctly on a TRAMP-opened
;; remote file.
;; TRAMP is a general redirection built into Emacs's own core file-handling
;; functions, which Magit, eglot, and everything else already go through --
;; so remote files are transparently supported with zero feature-specific code.`,
    notes: [
      'The order matters for grading here specifically because it matters for real: a real Emacs, evaluating this file top to bottom, would genuinely fail the Magit/eglot installs if the package-setup block were missing or placed after them.',
      'This lab is intentionally the closest thing in the whole course to "homework you should actually keep using" -- a real init.el is exactly this shape, just longer.'
    ]
  },
  quiz: [
    {
      q: 'Why must package-archive setup (package-initialize and friends) appear before any use-package :ensure call in a real init.el?',
      options: ['It does not actually matter what order they appear in', 'A use-package :ensure call needs the archive list already configured to know where to fetch an uninstalled package from', 'use-package automatically reorders the file at load time', 'Archive setup is only needed for Org mode specifically'],
      correct: 1,
      explain: 'Without archive setup already having run, a use-package :ensure call has no configured archive list to fetch the package from, and the install fails.'
    },
    {
      q: 'Why does organizing a real init.el as one use-package block per feature make it safer to remove a single feature later?',
      options: ['It does not provide any real safety benefit', 'Each block is self-contained, so deleting one does not risk disturbing configuration belonging to an unrelated feature interleaved nearby', 'use-package blocks cannot be deleted once written', 'It has nothing to do with safety, only with visual style'],
      correct: 1,
      explain: 'Self-contained use-package blocks mean removing one feature\'s configuration cannot accidentally break a different feature\'s unrelated setq or require calls.'
    },
    {
      q: 'Why is hooking eglot to start automatically for specific major modes considered a reasonable use of automation, given the course\'s general caution about automating things you do not understand?',
      options: ['Automation is always good regardless of understanding', 'By the time eglot is wired in, its behavior is already well understood, and connecting has no meaningful downside if a server is available and fails safely if not', 'eglot cannot actually be started manually, so a hook is required', 'The caution about automation does not apply to eglot specifically for no real reason'],
      correct: 1,
      explain: 'The course\'s caution is about not automating poorly-understood behavior -- eglot\'s behavior is well understood by this point, and it is safe to automate because it has no meaningful downside.'
    },
    {
      q: 'Why does a TRAMP-opened remote file work correctly with Magit and eglot without any special code in the capstone init.el?',
      options: ['It does not actually work correctly without extra code', 'TRAMP redirects Emacs\'s own core file-handling functions, which Magit and eglot are already built on top of, so remote support is inherited automatically', 'Magit and eglot have their own separate, manually written TRAMP integrations', 'Remote files require a completely different init.el to be loaded'],
      correct: 1,
      explain: 'Because Magit and eglot use Emacs\'s core file-handling machinery like everything else, TRAMP\'s redirection at that core level applies to them automatically, with no feature-specific TRAMP code needed.'
    },
    {
      q: 'What is the realistic, intended end state of this capstone init.el?',
      options: ['A permanently finished file that should never be edited again', 'A genuine, working starting point meant to keep evolving as your real needs change, using the same tools it configures', 'A file that only works during this course and should be discarded afterward', 'A file that must be rewritten from scratch for every new Emacs version'],
      correct: 1,
      explain: 'The lesson explicitly frames the finished init.el as a living document, meant to keep being edited with Emacs itself as real needs change over time.'
    }
  ],
  pitfalls: [
    'Placing a use-package :ensure block before package-archive setup has actually run, then being confused by an installation failure that has nothing to do with the package itself.',
    'Interleaving manual setq/require calls for different features throughout the file instead of keeping each feature in its own self-contained use-package block, making later removal or debugging of any single feature riskier than it needs to be.',
    'Assuming a brand-new feature (Org, Magit, eglot) needs special handling to work over TRAMP -- in the vast majority of cases it does not, precisely because TRAMP operates at the core file-handling level, below where individual features live.'
  ],
  interview: [
    {
      q: 'Walk through the correct top-to-bottom shape of a real, multi-feature init.el, and explain why each section must come where it does.',
      a: 'It begins with package-archive setup (package-archives configuration plus package-initialize), which must come first because every later use-package :ensure call depends on that archive list already being configured to know where to fetch an uninstalled package from. Next come foundational, non-package-dependent editing preferences (startup screen, custom-file separation) that have no ordering dependency on anything else. After that, each real feature -- Org, Magit, eglot, custom keybindings -- gets its own self-contained use-package block (or, for genuinely built-in features needing no installation, a plain global-set-key/config block); the relative order AMONG these later feature blocks generally does not matter, because use-package\'s own :bind and lazy-loading machinery correctly defers each feature\'s actual loading until it is needed, regardless of where its declaration physically sits in the file, as long as it comes after the initial archive setup.'
    },
    {
      q: 'A colleague\'s init.el has grown into a single, long, undifferentiated block of require and setq calls with no use-package structure at all -- what specifically goes wrong as that file continues to grow, and how does use-package structurally prevent it?',
      a: 'Without use-package\'s self-contained-block structure, nothing prevents configuration belonging to logically different features from becoming physically interleaved or, worse, accidentally load-order-dependent on each other purely as an artifact of the order they happened to be typed in -- removing "one feature" later requires manually tracing which specific lines actually belong to it, with real risk of missing some or accidentally deleting a line a different, unrelated feature happens to also depend on. use-package prevents this structurally, not just stylistically: each block\'s :ensure/:config/:bind clauses are scoped to exactly one feature by construction, so the file\'s own organization directly mirrors the actual feature boundaries, and removing one feature is mechanically just deleting its one block, with no manual tracing required.'
    },
    {
      q: 'Explain precisely why TRAMP requires zero additional configuration in this capstone init.el for Magit and eglot to work correctly on remote files, tying the explanation back to how TRAMP itself was described earlier in the course.',
      a: 'TRAMP was described as a general redirection built into Emacs\'s own core file-handling functions -- the same low-level functions essentially every file-touching feature in Emacs, including Magit and eglot, are built on top of, rather than each maintaining its own separate file-access implementation. Because of that shared foundation, TRAMP recognizing a /ssh: path and transparently routing file operations over SSH happens BELOW the level at which Magit or eglot themselves operate -- from either feature\'s own point of view, it is simply calling the same file functions it always calls, unaware (and not needing to be aware) that TRAMP is redirecting those calls underneath. This is precisely why the capstone init.el needed no Magit-specific or eglot-specific TRAMP handling at all: that handling already exists, once, at the shared core level, rather than needing to be separately reimplemented per feature.'
    },
    {
      q: 'Why does the lesson insist a finished capstone init.el is "never actually finished" -- what is the practical implication of treating it that way?',
      a: 'A real Emacs configuration reflects how a specific person actually works, and that genuinely keeps changing -- a new language needs a new eglot hook, a new project needs a new Org agenda file added, a keybinding that felt natural at first turns out to conflict with something else once used for real. Treating init.el as permanently "finished" would mean either living with an increasingly poor fit to actual, evolving needs, or being reluctant to touch a file perceived as complete and therefore risky to modify. Treating it instead as a living document -- editable with C-x C-f and testable with M-x eval-buffer without even restarting Emacs, exactly like any other file this course has covered editing -- keeps the real, practical cost of adding or removing a use-package block low enough that the configuration can actually keep pace with how the person using it is genuinely working, rather than calcifying into something increasingly disconnected from real use.'
    }
  ]
};
