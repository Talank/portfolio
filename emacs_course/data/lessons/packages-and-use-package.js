window.LESSONS = window.LESSONS || {};
window.LESSONS['packages-and-use-package'] = {
  id: 'packages-and-use-package',
  title: 'Packages, MELPA & use-package: Installing Things Properly',
  category: 'Part 4 — Customization & Config',
  timeMin: 35,
  summary: 'Part 0 promised that "extensibility" is the actual point of Emacs — this lesson is where that becomes concrete. Installing a package by hand is simple enough, but configuring a dozen of them with scattered require/setq/keybinding calls quickly becomes unreadable. use-package fixes that: one consistent, readable block per package, bundling "install it," "configure it," and "bind keys for it" together — and, as a genuine bonus, often delaying loading a package until it is actually first needed.',
  goals: [
    'Explain the difference between GNU ELPA (bundled) and MELPA (community, needs adding manually)',
    'Add MELPA to package-archives and install a package with M-x package-install',
    'Explain what use-package is, and why it is a macro rather than a separate package manager',
    'Write a use-package block using :ensure, :config, and :bind',
    'Explain how use-package\'s lazy loading keeps startup fast even with many packages configured'
  ],
  concept: [
    {
      h: 'Two repositories: GNU ELPA (bundled) and MELPA (community, added manually)',
      p: [
        '<b>GNU ELPA</b> (Emacs Lisp Package Archive) is bundled with Emacs by default — a relatively small, deliberately curated, conservative set of packages that meet the Free Software Foundation\'s specific licensing and copyright-assignment requirements. It is genuinely useful, but it is nowhere near the full breadth of what the Emacs community has actually built.',
        '<b>MELPA</b> (Milkypack Emacs Lisp Package Archive) is the large, community-run repository containing nearly everything else — thousands of packages, updated frequently, genuinely the default place most Emacs users actually get most of their packages from. It is NOT included by default — it needs to be explicitly added to the <code>package-archives</code> variable in your init.el before Emacs will know to look there at all, covered concretely below.'
      ]
    },
    {
      h: 'Installing a package manually, before use-package enters the picture',
      p: [
        'Once MELPA is added, <code>M-x package-refresh-contents</code> downloads the current list of available packages and their versions from every configured archive — genuinely worth running once after first adding a new archive, and periodically afterward to see updates. <code>M-x package-install <RET> package-name <RET></code> then installs a specific package interactively, with completion.',
        'This manual approach works, but it scales poorly: for each package, you would then ALSO need separate <code>require</code> calls to actually load it, separate <code>setq</code> calls to configure its specific variables, and separate <code>global-set-key</code> calls (Part 4\'s next lesson) to bind keys to its commands — three or four genuinely separate, scattered pieces of code per package, with no obvious single place to look to understand "everything related to this one package" at a glance.'
      ]
    },
    {
      h: 'use-package: one consistent, readable block per package',
      p: [
        '<code>use-package</code> is a MACRO (not a separate package manager — it works ON TOP of Emacs\'s built-in package.el) that bundles installation, configuration, and keybindings for one package into a SINGLE, consistently-structured block. It became so overwhelmingly popular across the Emacs community that it is now BUILT INTO Emacs itself as of version 29 — no separate installation step required at all on a current Emacs.',
        'A basic block: <code>(use-package some-package :ensure t :config (setq some-package-option t) :bind ("C-c s" . some-package-command))</code>. <code>:ensure t</code> tells use-package to automatically install the package via package.el if it is not already present — genuinely useful for a config that needs to work identically on a fresh machine with nothing yet installed. <code>:config</code> holds elisp to run AFTER the package has loaded — its own settings, typically. <code>:bind</code> is a declarative shorthand for binding a key directly to one of that package\'s commands, tying directly into the very next lesson\'s keybinding-customization topic.'
      ]
    },
    {
      h: 'Why this became close to universal: readability, and a genuine performance win',
      p: [
        'The readability payoff is straightforward: everything related to ONE package — its installation, its settings, its keybindings — lives in ONE self-contained block, making it trivial to understand what a given package is configured to do, or to cleanly remove a package entirely by deleting exactly one block, rather than hunting down three or four scattered references spread across a growing init.el.',
        'The genuinely important PERFORMANCE benefit: use-package, by default, often does not actually LOAD a package immediately at startup — it defers loading until the package is first genuinely needed, commonly triggered by one of its own <code>:bind</code> keybindings actually being pressed, or (Part 5\'s subject) a specific major mode that uses it being activated. This means a config declaring dozens of packages can still start FAST, since most of those packages are not actually doing any work — or consuming any startup time loading their own code — until the moment they are first genuinely used, directly connecting to Part 0\'s discussion of what actually makes Emacs startup slow in the first place.'
      ]
    }
  ],
  conceptFlow: {
    title: 'use-package\'s lazy loading: declared, but not loaded, until first needed',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Startup',
        nodes: [
          { id: 'startup', text: 'Emacs starts,\nreads a use-package block for "magit"' }
        ]
      },
      {
        label: 'What happens at startup',
        nodes: [
          { id: 'register', text: 'The :bind keybinding\nis registered immediately' },
          { id: 'noload', text: 'magit\'s actual CODE is\nNOT loaded yet — deferred' }
        ]
      },
      {
        label: 'Later, during the session',
        nodes: [
          { id: 'trigger', text: 'You press the bound key\nfor the first time' }
        ]
      },
      {
        label: 'What happens now',
        nodes: [
          { id: 'loadnow', text: 'magit\'s code loads NOW,\nfor the first time' },
          { id: 'run', text: 'THEN the command\nactually runs' }
        ]
      }
    ],
    steps: [
      { active: ['startup'], note: 'Emacs encounters the use-package block for magit during startup — but "encountering the declaration" and "loading the package" are two genuinely separate things.' },
      { active: ['register'], note: 'The :bind keybinding is registered right away — pressing that key will do SOMETHING — but registering a keybinding is cheap and fast, unrelated to the cost of loading magit\'s actual (potentially large) codebase.' },
      { active: ['noload'], note: 'magit\'s real code — everything it would actually need to DO its job — is deliberately NOT loaded at this point. Startup finishes without paying that cost at all.' },
      { active: ['trigger'], note: 'Sometime later in the session, you actually press the bound key for the first time.' },
      { active: ['loadnow'], note: 'ONLY NOW does magit\'s actual code get loaded — a one-time cost paid at first use, not at every single startup regardless of whether you end up using magit that session at all.' },
      { active: ['run'], note: 'With the code now loaded, the command actually runs. Every SUBSEQUENT use of magit during this same session is fast, since the loading cost was already paid once — but that cost was deferred until it was genuinely needed, rather than being paid unconditionally on every single startup.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Franky\'s Standardized Requisition Form, and Equipment That Waits to Be Uncrated',
      text: 'Franky, ordering specialized parts for the Sunny from Water 7\'s enormous supplier network, could technically place three separate, uncoordinated requests for every single part — one to actually ORDER it, a separate one to schedule its INSTALLATION, a third to configure its CONTROLS once mounted — but after doing this the messy way for one too many parts and losing track of which request belonged to which part, he switches to a single standardized requisition form instead. One form, per part: order this specific item, install/mount it this specific way, wire its controls this specific way — all captured together, on one document, instead of scattered across three separate uncoordinated pieces of paperwork nobody could easily cross-reference later. And there is a second, genuinely clever habit layered on top of the form itself: for parts that are not needed IMMEDIATELY on arrival, Franky does not bother uncrating and fully setting them up the moment they arrive at all — the crate sits there, ordered and accounted for, but not actually unpacked and wired in until the very first moment the crew genuinely needs to use that specific part. This keeps the dock from being cluttered with dozens of fully-assembled, mostly-idle pieces of equipment at any given time — only what is actually being used right now is actually fully set up and ready, everything else waits, cheaply, as an unopened crate until its moment actually comes.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Standardized Requisition Form for Lab Equipment',
      text: 'Sheldon, ordering specialized equipment for a project through the university\'s enormous supplier catalog, used to submit three separate, uncoordinated requests for every single item — one to actually ORDER it, a separate one to schedule its physical SETUP in the lab, a third to configure its specific operating settings — until losing track of which request belonged to which piece of equipment finally becomes too much even for him to tolerate. He switches the whole department to one standardized requisition form instead: order this item, set it up this specific way, configure it this specific way, all captured together on one document rather than scattered across three separate pieces of paperwork nobody could easily match up later. And there is a genuinely clever efficiency habit layered on top: for equipment not needed IMMEDIATELY, Sheldon does not insist on it being fully unboxed and calibrated the moment it physically arrives — it sits in storage, properly logged and accounted for on the requisition form, but not actually set up and ready to use until the very first moment someone genuinely needs to actually operate it. This keeps the lab from being cluttered with dozens of fully-calibrated, mostly-idle pieces of equipment at any given time — Leonard, needing a piece of gear Sheldon requisitioned weeks ago but nobody had used yet, finds it exactly where the form said it would be, unboxed and calibrated for the very first time right then, not sitting fully set up and taking up bench space the whole time it was not being used.'
    },
    why: 'Franky\'s and Sheldon\'s single standardized requisition form — order, setup, and configuration all captured together on one document, instead of three scattered pieces of paperwork — is exactly a use-package block: :ensure, :config, and :bind, all for one package, in one readable place. And their shared habit of not fully setting up equipment until it is genuinely first needed is exactly use-package\'s lazy loading — declared and accounted for immediately, but not actually paying the real loading cost until the moment it is actually used.'
  },
  tech: [
    {
      q: 'Why does Emacs need a separate, manually-added repository (MELPA) instead of everything simply being included in the default GNU ELPA?',
      a: 'GNU ELPA is maintained under the Free Software Foundation\'s specific requirements, including formal copyright assignment from package authors — a genuinely significant legal/administrative bar that many package authors, particularly smaller or more casual open-source contributors, are unwilling or unable to clear, regardless of their code\'s actual quality. MELPA imposes no such requirement, instead automatically building and publishing packages directly from their own public source repositories with much lighter administrative overhead — which is exactly why it ends up hosting the vast majority of the Emacs ecosystem\'s actual package count, at the cost of not having GNU ELPA\'s specific legal vetting process behind every single package.'
    },
    {
      q: 'What does it actually mean that use-package is a "macro" rather than a separate package manager, and why does that distinction matter?',
      a: 'A macro, in Lisp terminology, is code that TRANSFORMS other code at compile/load time — use-package takes your declarative block (:ensure, :config, :bind, and so on) and expands it into the equivalent lower-level elisp (calls to package.el\'s actual installation functions, require statements, setq calls, key-binding calls) that accomplishes the same thing the old, manually-scattered approach did, just generated automatically from your more concise, structured declaration. It matters because use-package does not replace or compete with package.el (Emacs\'s actual underlying package management system) at all — it is a convenience layer written ON TOP of it, meaning package.el is still doing the real work of downloading and installing packages; use-package is simply providing a much more pleasant, consistent way to DESCRIBE what you want package.el (and the rest of your configuration) to do.'
    },
    {
      q: 'Mechanically, how does use-package\'s lazy loading actually keep Emacs startup fast, and what specifically triggers a deferred package to finally load?',
      a: 'When use-package processes a block with deferred loading (its default behavior for many common patterns, particularly when :bind is used), it registers the lightweight PIECES that do not require the package\'s actual code to be loaded yet — most notably, the keybinding itself — while deliberately NOT running a require or otherwise loading the package\'s real, potentially large body of code at that point. The keybinding, once pressed, is specifically set up to trigger loading the actual package code at THAT moment, on first use, rather than unconditionally at every startup regardless of whether the package ends up being used in that session at all. This means the STARTUP-TIME cost is limited to registering a small number of lightweight triggers (fast, regardless of how many packages are declared), while the more expensive cost of actually loading each package\'s real code is deferred to (and only paid by) sessions where that specific package genuinely gets used.'
    }
  ],
  code: {
    title: 'Setting up MELPA, and writing your first use-package blocks',
    intro: 'This assumes a reasonably current Emacs (29+), where use-package is already built in.',
    code: `;; In init.el, near the top — add MELPA as a package source:
(require 'package)
(add-to-list 'package-archives '("melpa" . "https://melpa.org/packages/"))
(package-initialize)

;; M-x package-refresh-contents   <- run this once, interactively, after
;;                                    adding a new archive for the first time

;; ── The OLD, scattered way (for comparison — do not actually write this) ──
;; (unless (package-installed-p 'magit) (package-install 'magit))
;; (require 'magit)
;; (setq magit-diff-refine-hunk t)
;; (global-set-key (kbd "C-c g") 'magit-status)
;; Three or four separate, scattered pieces of code, for ONE package.

;; ── The use-package way — one block, everything together ──
(use-package magit
  :ensure t                              ; auto-install if not already present
  :bind ("C-c g" . magit-status)         ; keybinding, registered immediately
  :config
  (setq magit-diff-refine-hunk t))       ; magit's own settings, run AFTER it loads

;; A second package, same consistent shape:
(use-package company
  :ensure t
  :config
  (global-company-mode 1))

;; Notice: everything about magit — install, keybinding, settings — is
;; readable in ONE place. Deleting that whole block cleanly removes
;; everything related to magit from your configuration, in one step.`,
    notes: [
      'package-initialize needs to run BEFORE any use-package blocks that rely on package.el for installation — placement in init.el genuinely matters here, per the previous lesson\'s load-order lesson.',
      'On Emacs 29+, use-package itself needs no separate installation — it ships built in. On older Emacs versions, use-package itself would need to be installed as a package first, a genuine one-time exception to its own "no manual install needed" convenience.'
    ]
  },
  lab: {
    title: 'Write the package setup and use-package blocks',
    prompt: 'Write exactly what each task asks for.',
    starter: `# Task: add MELPA to package-archives


# Task: write a use-package block for a package called "flycheck" that:
#   - auto-installs if missing
#   - binds "C-c f" to the command flycheck-mode
#   - in its :config section, sets flycheck-check-syntax-automatically to '(save mode-enabled)


`,
    checks: [
      { re: 'add-to-list[\\s\\S]*package-archives[\\s\\S]*melpa\\.org/packages', flags: 'i', must: true, hint: '(add-to-list \'package-archives \'("melpa" . "https://melpa.org/packages/"))', pass: 'MELPA added to package-archives ✓' },
      { re: 'use-package\\s+flycheck', flags: 'i', must: true, hint: '(use-package flycheck ...)', pass: 'use-package flycheck ✓' },
      { re: ':ensure\\s+t', flags: '', must: true, hint: ':ensure t auto-installs if missing.', pass: ':ensure t ✓' },
      { re: ':bind\\s*\\(.C-c f.\\s*\\.\\s*flycheck-mode\\)', flags: 'i', must: true, hint: ':bind ("C-c f" . flycheck-mode)', pass: ':bind (C-c f . flycheck-mode) ✓' },
      { re: ':config[\\s\\S]*flycheck-check-syntax-automatically', flags: 'i', must: true, hint: ":config (setq flycheck-check-syntax-automatically '(save mode-enabled))", pass: ':config setting flycheck-check-syntax-automatically ✓' }
    ],
    run: 'Try it for real: add MELPA, M-x package-refresh-contents, then write and eval a use-package block for a real package you want to try.',
    solution: `# Task: add MELPA to package-archives
(add-to-list 'package-archives '("melpa" . "https://melpa.org/packages/"))

# Task: write a use-package block for a package called "flycheck" that:
#   - auto-installs if missing
#   - binds "C-c f" to the command flycheck-mode
#   - in its :config section, sets flycheck-check-syntax-automatically to '(save mode-enabled)
(use-package flycheck
  :ensure t
  :bind ("C-c f" . flycheck-mode)
  :config
  (setq flycheck-check-syntax-automatically '(save mode-enabled)))`,
    notes: [
      'The exact quoting inside :config (a quoted list, \'(save mode-enabled)) is genuinely just standard elisp syntax — nothing use-package-specific about it, since :config simply runs whatever elisp you write inside it.',
      'Order matters here too: package-archives needs to be configured before package-refresh-contents or any :ensure t installation attempt can actually see MELPA\'s packages.'
    ]
  },
  quiz: [
    {
      q: 'What is the key difference between GNU ELPA and MELPA?',
      options: ['They are the exact same repository under two different names', 'GNU ELPA is bundled by default with strict legal/copyright requirements; MELPA is a much larger community repository that must be manually added', 'MELPA is bundled by default; GNU ELPA must be manually added', 'GNU ELPA only contains themes, while MELPA contains actual functional packages'],
      correct: 1,
      explain: 'GNU ELPA ships with Emacs and has stricter legal requirements for included packages; MELPA is the much larger, community-run repository that needs to be explicitly added to package-archives.'
    },
    {
      q: 'What kind of thing is use-package, technically?',
      options: ['A completely separate package manager, replacing package.el entirely', 'A macro that expands into the equivalent lower-level elisp, working on top of package.el rather than replacing it', 'A GUI application unrelated to elisp', 'A file format for storing packages'],
      correct: 1,
      explain: 'use-package is a macro — it transforms your declarative block into the equivalent installation/require/setq/keybinding calls, using package.el underneath to do the actual installation work.'
    },
    {
      q: 'What does :ensure t do inside a use-package block?',
      options: ['Ensures the package is deleted if unused', 'Automatically installs the package via package.el if it is not already present', 'Forces the package to load immediately at every startup, disabling lazy loading', 'Verifies the package\'s digital signature only, without installing it'],
      correct: 1,
      explain: ':ensure t tells use-package to auto-install the package through package.el if it is missing — genuinely useful for a config meant to work on a fresh machine with nothing pre-installed.'
    },
    {
      q: 'What is the main readability advantage of use-package over the older, scattered require/setq/global-set-key approach?',
      options: ['use-package blocks run faster at the CPU instruction level', 'Everything related to ONE package — install, config, keybindings — lives together in one self-contained, consistently-structured block', 'use-package eliminates the need to write any elisp at all', 'There is no real readability difference; it is purely a performance optimization'],
      correct: 1,
      explain: 'The core readability win is consolidation: one block per package, containing everything about it, rather than three or four scattered references spread across a growing init.el.'
    },
    {
      q: 'How does use-package\'s lazy loading keep startup fast even with dozens of packages configured?',
      options: ['It deletes unused packages automatically at startup', 'Many packages\' actual code is not loaded at startup at all — only lightweight triggers (like a keybinding) are registered, deferring the real loading cost until first actual use', 'It compresses all package code into one faster-loading file', 'Lazy loading has no actual effect on startup speed'],
      correct: 1,
      explain: 'use-package often registers only a lightweight trigger (like a keybinding) at startup, deferring the more expensive cost of actually loading a package\'s code until that package is genuinely first used.'
    }
  ],
  pitfalls: [
    'Forgetting to add MELPA to package-archives before trying to install a package that only exists there — package-install would report it as simply not found.',
    'Running package-install before package-refresh-contents has ever been run (after adding a new archive) — Emacs does not yet know what is available there without that refresh.',
    'Writing a use-package block\'s :config section as if it runs BEFORE the package loads, rather than after — settings that genuinely need to exist before the package initializes belong in :init instead, a distinction worth knowing exists even if :config covers the common case.'
  ],
  interview: [
    {
      q: 'Explain the relationship between GNU ELPA, MELPA, package.el, and use-package — how do these four pieces actually fit together?',
      a: 'GNU ELPA and MELPA are both PACKAGE REPOSITORIES — sources you can download packages from, differing mainly in their legal/curation requirements and, consequently, their overall size. package.el is Emacs\'s built-in PACKAGE MANAGER — the actual mechanism that knows how to talk to configured repositories (listed in package-archives), download packages, and install them onto your system; both GNU ELPA and MELPA are consumed through package.el once configured. use-package is a MACRO built on top of package.el, providing a more readable, declarative way to describe "install this package, configure it this way, bind these keys to it" as one consistent block, which then expands into the equivalent lower-level package.el/require/setq/keybinding calls that actually do the work. None of these four pieces replaces another — they form a layered stack, each building on the one below it.'
    },
    {
      q: 'Why did use-package become popular enough to be merged directly into Emacs itself, rather than remaining a third-party package indefinitely?',
      a: 'Its adoption reflected a genuine, widely-felt pain point: as Emacs configurations grew to include dozens of packages, the older approach of scattering each package\'s installation, configuration, and keybindings across separate require/setq/global-set-key calls became genuinely difficult to read, maintain, and cleanly modify (removing a package meant hunting down every scattered reference to it). use-package\'s consolidated, one-block-per-package structure directly solved this, and its LAZY LOADING behavior additionally solved a real, measurable startup-performance problem for heavily-configured setups — combined, these made it valuable enough, to a large enough fraction of the Emacs user base, that folding it directly into Emacs\'s own core distribution (as of version 29) removed an unnecessary extra installation step for what had effectively become close to a universal convention rather than an optional add-on.'
    },
    {
      q: 'Walk through exactly what happens, step by step, from Emacs encountering a lazily-loaded use-package block at startup through to that package\'s code actually being loaded.',
      a: 'At startup, Emacs evaluates the use-package block for that package — but for a block using deferred loading (commonly triggered by the presence of :bind), this evaluation registers the LIGHTWEIGHT pieces immediately: specifically, the keybinding itself gets bound, but in a special way that, rather than directly calling the package\'s command, is set up to first trigger LOADING the package\'s actual code before then invoking the real command. Nothing about the package\'s substantial underlying codebase is loaded or executed at this point — startup finishes without paying that cost. Later, when the user actually presses that bound key for the first time in the session, the deferred trigger fires: the package\'s real code loads at that moment (a one-time cost for that session), and then the actual command runs, using that now-loaded code. Every subsequent invocation of that key during the same session is fast, since the loading cost was already paid once, but crucially, that cost was deferred until genuine first use rather than being unconditionally paid at every single startup.'
    },
    {
      q: 'A colleague\'s use-package-heavy init.el is still slow to start, despite everyone insisting use-package makes startup fast. What would you investigate?',
      a: 'First: whether their use-package blocks are actually configured to take advantage of lazy loading at all — use-package does not GUARANTEE deferred loading unconditionally; certain configurations (particularly ones relying heavily on :demand t, or blocks with no :bind/:mode/:hook trigger at all to defer against) can end up loading a package immediately at startup regardless, effectively opting out of the lazy-loading benefit without realizing it. Second: whether the slowness is even coming from package loading at all, versus something else entirely — a genuinely large, complex :config block\'s own elisp doing real, non-trivial computation at load time (independent of use-package\'s mechanics), or an unrelated startup cost like initializing a language-server client eagerly. Tools like M-x emacs-init-time (a rough overall figure) or more detailed profiling packages can help distinguish "this specific package\'s use-package block is genuinely loading eagerly" from "something else entirely is the actual bottleneck" before assuming the fix is necessarily about use-package\'s laziness at all.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover everyday package installation and use-package structure. This is what is underneath: :init vs :config precisely, pinning package versions, and straight.el as a genuinely different alternative approach worth knowing exists.',
    sections: [
      {
        h: ':init vs :config: before vs after loading, precisely',
        p: [
          '<code>:init</code> code runs BEFORE the package is loaded (even for a deferred/lazy package, :init still runs at the point use-package is evaluated during startup, since it is meant to configure things that should be in place ahead of time, like certain variables the package checks at its own load time). <code>:config</code> code runs AFTER the package has actually loaded — appropriate for the vast majority of ordinary settings, which typically depend on the package\'s own variables/functions already being defined. Getting this distinction backwards (putting something in :config that genuinely needed to run before loading, or vice versa) is a real, if relatively rare, source of subtle configuration bugs once a config grows complex enough to actually need :init for something specific.'
        ]
      },
      {
        h: 'Pinning packages to specific versions or sources',
        p: [
          'By default, package.el installs whatever the LATEST version currently available from a configured archive happens to be — genuinely fine most of the time, but occasionally a specific package update introduces a breaking change you are not ready to adopt yet. <code>:pin melpa-stable</code> (or a specific archive name) inside a use-package block constrains which archive that specific package should be installed from, useful when a package exists on both a fast-moving "unstable" feed and a more conservative "stable" one, and you want the more conservative choice specifically for that one package while still using the faster-moving feed for everything else.'
        ]
      },
      {
        h: 'straight.el: a genuinely different package-management philosophy',
        p: [
          '<code>straight.el</code> is a popular alternative to package.el (still usable together WITH use-package, via a :straight keyword instead of :ensure) that installs packages by cloning their actual GIT repositories directly, rather than downloading pre-built archive snapshots — giving genuinely reproducible, pinnable-to-an-exact-commit installations, and the ability to easily patch or locally modify a package\'s source before it loads. This is a meaningfully more involved setup than the built-in package.el this lesson covers, and is worth knowing EXISTS as an option — genuinely valuable for someone wanting maximally reproducible configuration across multiple machines — without needing to actually adopt it as a beginner; package.el plus use-package, as covered in the essentials above, is a completely sufficient, standard starting point.'
        ]
      }
    ]
  }
};
