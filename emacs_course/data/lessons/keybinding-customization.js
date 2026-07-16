window.LESSONS = window.LESSONS || {};
window.LESSONS['keybinding-customization'] = {
  id: 'keybinding-customization',
  title: 'Binding Your Own Keys: global-set-key, Keymaps & Mac-Friendly Bindings',
  category: 'Part 4 — Customization & Config',
  timeMin: 35,
  summary: 'Part 2 established that every keybinding is just an entry in a lookup table pointing at a function name — this lesson is where you actually add your own entries. Binding a key globally, binding it safely (without colliding with anything), and binding it only within one specific context, using the Super/Cmd namespace Part 1 already set up specifically for this purpose.',
  goals: [
    'Bind a key globally to a command using global-set-key and the kbd macro',
    'Explain why C-c followed by a letter is the reserved, safe prefix for custom bindings',
    'Bind a Super (Cmd) key, using the mac-command-modifier setup from Part 1',
    'Explain how a mode-specific keymap can override a global binding for buffers in that mode',
    'Use define-key to bind a key within one specific mode\'s keymap rather than globally'
  ],
  concept: [
    {
      h: 'global-set-key and the kbd macro',
      p: [
        '<code>(global-set-key (kbd "C-c a") \'some-command)</code> is the basic shape of binding your own key, globally, to a command — exactly the same underlying mechanism from Part 2\'s "every keybinding is a lookup table entry" explanation, now with you adding the entry yourself. <code>kbd</code> is a macro that translates the human-readable string <code>"C-c a"</code> into the internal representation Emacs actually stores and checks keybindings against — you almost never need to know or produce that internal representation directly, since kbd handles the translation for you.',
        '<code>C-c</code> followed by any single letter is specifically, deliberately RESERVED by longstanding Emacs convention for user and third-party-package-defined bindings — Emacs\'s own built-in commands never use this specific prefix. This makes it the single safest space to bind your own custom commands into: <code>C-c a</code>, <code>C-c b</code>, and so on are guaranteed not to collide with anything Emacs itself, or any well-behaved package, would ever try to claim.'
      ]
    },
    {
      h: 'Binding a Super (Cmd) key — the namespace Part 1 already set up for exactly this',
      p: [
        'With <code>mac-command-modifier</code> set to <code>\'super</code> (from Part 1\'s essential-mac-remaps lesson), <code>(kbd "s-s")</code> refers to Cmd-s — and binding something there is genuinely appealing for anyone wanting Emacs to feel a little more "Mac-native": <code>(global-set-key (kbd "s-s") \'save-buffer)</code> makes Cmd-S save, matching the exact muscle memory built into every other Mac application, rather than needing to remember C-x C-s specifically inside Emacs.',
        'This is exactly why Part 1 recommended routing Command through Super in the first place: the <code>s-</code> namespace is essentially GUARANTEED to be empty in a stock Emacs configuration — nothing in Emacs core, and very few packages, bind anything there by default — making it a clean, collision-free space specifically reserved, in practice, for your own personal shortcuts, entirely separate from the C-c convention above, which is more commonly used by packages\' own default bindings.'
      ]
    },
    {
      h: 'Keymaps are layered: a mode-specific binding overrides a global one',
      p: [
        '<code>global-set-key</code> affects the GLOBAL keymap — a binding placed there applies EVERYWHERE, in every buffer, regardless of what kind of content that buffer holds. But every major mode (Part 5\'s subject in full) has its OWN separate keymap, and when Emacs looks up what a keystroke should do, it checks the CURRENT buffer\'s mode-specific keymap FIRST, only falling back to the global keymap if that mode-specific map has no binding for that exact key.',
        'This is precisely why the same key can mean something genuinely different depending on which kind of buffer you are in — a language-specific major mode might bind <code>C-c C-c</code> to "compile this file," while that exact key sequence does something else entirely (or nothing at all) in an ordinary text buffer\'s global-only context. Neither binding is a bug or a conflict; the more SPECIFIC, mode-local binding simply takes priority over the more general, global one whenever both exist for the same key sequence.'
      ]
    },
    {
      h: 'define-key: binding within one specific mode, not globally',
      p: [
        '<code>(define-key some-mode-map (kbd "C-c x") \'some-command)</code> binds a key WITHIN one specific mode\'s own keymap — <code>some-mode-map</code> here would be the actual keymap variable a given major mode exposes (covered concretely once Part 5 introduces specific modes by name). This is the deliberate, targeted alternative to global-set-key: reach for it when a binding genuinely only makes sense in ONE specific context.',
        'A command that only does something useful in, say, a programming-language buffer (running that language\'s linter, for instance) genuinely should not be bound globally — binding it globally would mean the key does nothing useful (or something confusing) the moment you press it in a plain text file or the minibuffer, where that command was never meant to apply at all. define-key, aimed at the right mode\'s own keymap, keeps a binding scoped exactly to the context where it actually makes sense.'
      ]
    }
  ],
  conceptFlow: {
    title: 'Same key, two possible bindings — which one actually wins?',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'The setup',
        nodes: [
          { id: 'global', text: 'Global keymap:\nC-c c bound to some-global-command' },
          { id: 'modemap', text: 'python-mode-map:\nC-c c bound to run-python-linter' }
        ]
      },
      {
        label: 'Pressing C-c c in two different buffers',
        nodes: [
          { id: 'inpython', text: 'You press C-c c\nin a Python-mode buffer' },
          { id: 'intext', text: 'You press C-c c\nin a plain text buffer' }
        ]
      },
      {
        label: 'The lookup order',
        nodes: [
          { id: 'checklocal', text: 'Check the CURRENT buffer\'s\nmode-specific keymap FIRST' },
          { id: 'fallback', text: 'If no mode-specific binding exists,\nfall back to the global keymap' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'resultpython', text: 'In Python-mode: runs the LINTER\n(mode-specific binding wins)' },
          { id: 'resulttext', text: 'In plain text: runs the\nGLOBAL command instead\n(no mode-specific override exists here)' }
        ]
      }
    ],
    steps: [
      { active: ['global'], note: 'A global binding exists for C-c c, applying by default in every buffer that does not override it.' },
      { active: ['modemap'], note: 'Separately, python-mode has defined its OWN binding for that exact same key sequence, but only within its own mode-specific keymap.' },
      { active: ['inpython'], note: 'Pressing C-c c while in a buffer using python-mode...' },
      { active: ['checklocal'], note: '...Emacs checks python-mode\'s own keymap FIRST — and finds a binding there.' },
      { active: ['resultpython'], note: 'The mode-specific binding wins: the linter runs, NOT the global command — the more specific context takes priority.' },
      { active: ['intext'], note: 'Pressing that same C-c c in a plain text buffer instead...' },
      { active: ['fallback'], note: '...Emacs checks that buffer\'s mode-specific keymap first too, but plain text mode has no binding at all for C-c c — so it falls back to the global keymap.' },
      { active: ['resulttext'], note: 'The global command runs instead, since no more specific override exists for this particular buffer\'s mode. Same physical keystroke, genuinely different outcome, entirely determined by which mode the current buffer happens to be in.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Nami\'s Ship-Wide Signal, and the Crow\'s Nest\'s Own Local Override',
      text: 'Nami maintains a ship-wide "all hands" signal system — a specific whistle pattern that, by default, means the same thing no matter where on the Sunny you happen to be standing when you hear it: gather at the main deck. This works reliably everywhere on the ship, applying uniformly, with no exceptions anywhere by default. But the crow\'s nest specifically has ITS OWN separate, local override for that exact same whistle pattern — whoever is actually stationed up there, and only them, treats that identical signal as something different: a specific lookout-relay call instead, relevant only to that one specialized post\'s own job. Nami is careful about exactly how this is meant to work: the local override only applies to whoever is genuinely standing in the crow\'s nest right now — anyone anywhere else on the ship still hears the same whistle and still gathers at the main deck as usual, completely unaffected by the crow\'s nest\'s own private reinterpretation. There is no actual contradiction here, and no confusion once it is understood correctly: the SAME signal genuinely means different things depending on WHERE, specifically, you are standing when you hear it, and the more specific, local meaning simply takes priority over the general ship-wide one for whoever happens to be in that one specific post.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s All-Staff Signal, and the Pastry Station\'s Own Local Override',
      text: 'Monica maintains a restaurant-wide signal for her staff — a specific double-tap on the pass that, throughout the whole kitchen by default, means the same thing everywhere it is heard: an order is ready for pickup. This works reliably in every section of the kitchen, applying uniformly by default, no exceptions anywhere. But the pastry station specifically has ITS OWN separate, local override for that exact same double-tap — whoever is actually working that one station, and only them, treats that identical signal as something different: a specific "check the oven timer now" call instead, relevant only to that one specialized station\'s own workflow. Monica is precise about how this actually works: the local override applies ONLY to whoever is genuinely staffing the pastry station right now — everyone else in the kitchen still hears the same double-tap and still treats it as an order-ready signal as usual, completely unaffected by the pastry station\'s own private reinterpretation happening in its own corner. There is no real contradiction, and no confusion once it is understood correctly: the SAME signal genuinely means something different depending on WHICH station, specifically, you are working when you hear it, and the more specific, local meaning simply takes priority over the general kitchen-wide one for whoever happens to be at that one specific station.'
    },
    why: 'Nami\'s ship-wide whistle (with the crow\'s nest\'s own local override) and Monica\'s kitchen-wide double-tap (with the pastry station\'s own local override) are exactly global-set-key vs define-key on a mode-specific keymap: a general binding applying everywhere by default, and a more specific, local override that takes priority only within its own narrower context, without ever breaking or contradicting the general meaning everywhere else.'
  },
  tech: [
    {
      q: 'Why is C-c followed by a letter specifically reserved for user/package bindings, and what risk do you actually run by binding something OUTSIDE that reserved space instead?',
      a: 'The C-c-letter space was deliberately set aside, by longstanding Emacs convention, as a "safe zone" that Emacs\'s own core commands, and well-behaved third-party packages, agree never to claim for their own default bindings — meaning anything you bind there is essentially guaranteed collision-free against Emacs itself and any package following the convention. Binding something OUTSIDE that reserved space — overriding an existing, actively-used binding like C-x C-f, for instance — genuinely risks either quietly breaking a command you actually still want to use under its original binding, or creating confusion later when documentation, tutorials, or your own memory of "standard" Emacs behavior no longer matches what a given key actually does on your specific, customized setup.'
    },
    {
      q: 'Mechanically, why does a mode-specific keymap binding take priority over a global one for the exact same key, rather than the global binding always winning since it was arguably defined "first" (in Emacs\'s own core)?',
      a: 'Keybinding lookup in Emacs checks a specific PRIORITY ORDER of keymaps, not simply "whichever was defined earliest" — the current buffer\'s minor-mode keymaps (if any are active) and major-mode-specific keymap are checked BEFORE falling back to the global keymap, regardless of when each map\'s specific binding was actually established in the code. This ordering is a deliberate design choice, not an arbitrary rule: it lets a mode meaningfully specialize behavior for its own specific context (a key doing something genuinely useful and mode-appropriate) without needing to alter the GLOBAL meaning of that key for every other kind of buffer, which would be a far more invasive, blunt way to achieve the same specific-context customization.'
    },
    {
      q: 'Why is binding s- (Super/Cmd) keys considered an especially safe, clean choice compared to trying to find some unused C- or M- combination instead?',
      a: 'The C- and M- namespaces are extensively used by Emacs\'s own core commands and by the vast majority of third-party packages, meaning finding a genuinely unused combination within either space requires real, careful checking to avoid accidentally colliding with something already meaningfully bound — and even an apparently-unused combination today could get claimed by a future package update. The s- namespace, by contrast, sees essentially no use at all in Emacs core or the overwhelming majority of packages, specifically because it has no meaning on a traditional PC keyboard that most non-Mac-specific package authors are writing for — making it a genuinely, reliably empty space to claim for personal bindings, with essentially no risk of a future package update suddenly colliding with something you have already bound there.'
    }
  ],
  code: {
    title: 'Binding your own keys, three different ways',
    intro: 'Try these in your own init.el — each demonstrates a genuinely different scope.',
    code: `;; Global binding, in the reserved C-c-letter space:
(global-set-key (kbd "C-c a") 'org-agenda)
;; C-c a now runs org-agenda, EVERYWHERE, in every buffer.

;; Global binding using Super (Cmd), matching Mac muscle memory:
(global-set-key (kbd "s-s") 'save-buffer)
;; Cmd-S now saves the current buffer — matching every other Mac app.

(global-set-key (kbd "s-f") 'isearch-forward)
;; Cmd-F now starts an incremental search — Mac-familiar, Emacs-powered.

;; Mode-specific binding — ONLY takes effect in buffers using that mode:
;; (assumes some-mode-map is a real keymap a given mode exposes —
;; Part 5 covers exactly how to find a specific mode's own keymap name)
(define-key some-mode-map (kbd "C-c x") 'some-mode-specific-command)
;; C-c x does something HERE, in this mode's buffers specifically —
;; and, per this lesson's earlier example, C-c x might do something
;; ENTIRELY different (or nothing) in a buffer using a different mode.

;; Verifying which one actually won, in a specific buffer:
;; C-h k, then the key — reports exactly which binding is currently
;; active for THIS buffer, mode-specific or global, whichever applies.`,
    notes: [
      'C-h k (from Part 0) is genuinely the fastest way to confirm which binding is actually active in a specific buffer — especially useful once mode-specific overrides are in the mix, since the answer can differ buffer to buffer.',
      'Binding s-s to save-buffer does not remove C-x C-s — both keybindings now do the exact same thing, coexisting peacefully, since nothing about adding a new binding removes an existing one for a different key sequence.'
    ]
  },
  lab: {
    title: 'Write the right keybinding forms for each scenario',
    prompt: 'Write exactly what each task asks for, as valid elisp.',
    starter: `# Task: globally bind C-c q to the command "org-agenda", using the safe reserved prefix


# Task: globally bind Cmd-w (Super-w) to the command "kill-this-buffer"


# Q: Why is "C-c q" a safer choice than, say, rebinding "C-x C-f" to something else?


# Task: bind C-c t, but ONLY within a keymap called "text-mode-map" (not globally),
# to a command called "insert-timestamp"

`,
    checks: [
      { re: "global-set-key\\s*\\(kbd\\s+.C-c\\s+q.\\)\\s*'org-agenda", flags: 'i', must: true, hint: "(global-set-key (kbd \"C-c q\") 'org-agenda)", pass: 'C-c q bound globally ✓' },
      { re: "global-set-key\\s*\\(kbd\\s+.s-w.\\)\\s*'kill-this-buffer", flags: 'i', must: true, hint: "(global-set-key (kbd \"s-w\") 'kill-this-buffer)", pass: 's-w bound globally ✓' },
      { re: 'reserved|convention|safe\\s+zone|never\\s+use', flags: 'i', must: true, hint: 'C-c-letter is a reserved convention Emacs and packages never claim; C-x C-f is an actively-used built-in binding, risky to override.', pass: 'Explained the reserved-prefix reasoning ✓' },
      { re: "define-key\\s+text-mode-map\\s*\\(kbd\\s+.C-c\\s+t.\\)\\s*'insert-timestamp", flags: 'i', must: true, hint: "(define-key text-mode-map (kbd \"C-c t\") 'insert-timestamp)", pass: 'C-c t bound within text-mode-map ✓' }
    ],
    run: 'Try it for real: add one global binding to your init.el, restart (or eval-buffer), then C-h k to confirm it reports the right function.',
    solution: `# Task: globally bind C-c q to the command "org-agenda", using the safe reserved prefix
(global-set-key (kbd "C-c q") 'org-agenda)

# Task: globally bind Cmd-w (Super-w) to the command "kill-this-buffer"
(global-set-key (kbd "s-w") 'kill-this-buffer)

# Q: Why is "C-c q" a safer choice than, say, rebinding "C-x C-f" to something else?
# C-c followed by a letter is a reserved convention that Emacs's own built-in
# commands and well-behaved packages never claim, so it's essentially guaranteed
# collision-free. C-x C-f is an actively-used built-in binding (find-file) —
# overriding it risks losing access to that command under its expected key.

# Task: bind C-c t, but ONLY within a keymap called "text-mode-map" (not globally),
# to a command called "insert-timestamp"
(define-key text-mode-map (kbd "C-c t") 'insert-timestamp)`,
    notes: [
      'The distinction between global-set-key and define-key-on-a-specific-map is exactly the distinction this lesson is built around — same underlying mechanism, genuinely different scope.',
      'text-mode-map is a real keymap in Emacs — this example happens to use an actual one, though the general define-key pattern applies identically to any mode\'s own keymap variable.'
    ]
  },
  quiz: [
    {
      q: 'What does (global-set-key (kbd "C-c a") \'some-command) do?',
      options: ['Binds C-c a only within the current buffer', 'Binds C-c a globally, to run some-command, in every buffer by default', 'Removes any existing binding for C-c a without adding a new one', 'Only works if some-command is already bound to a different key'],
      correct: 1,
      explain: 'global-set-key adds a binding to the GLOBAL keymap, which applies everywhere by default unless a more specific mode-local binding overrides it.'
    },
    {
      q: 'Why is C-c followed by a single letter specifically recommended for custom bindings?',
      options: ['It is the only prefix Emacs technically allows for custom bindings', 'It is a longstanding, reserved convention that Emacs\'s own built-in commands and well-behaved packages never claim, making it collision-free', 'It runs faster than other key combinations', 'C-c bindings automatically apply only to the current mode'],
      correct: 1,
      explain: 'C-c-letter is set aside by convention specifically for user and package customization — Emacs core never uses it, making it the safest space for your own bindings.'
    },
    {
      q: 'Why is the s- (Super/Cmd) namespace considered an especially clean, safe space for personal bindings on a Mac?',
      options: ['s- bindings are technically impossible to remove once set, so they are extra secure', 'It sees essentially no use by Emacs core or the vast majority of packages, since it has no meaning on a traditional PC keyboard', 's- bindings automatically override every other keybinding', 'The s- namespace is identical to the C-c namespace'],
      correct: 1,
      explain: 'Since Super has no meaning on most non-Mac keyboards, essentially nothing in Emacs core or mainstream packages binds anything there by default — a genuinely empty namespace for personal use.'
    },
    {
      q: 'If a global binding and a mode-specific binding both exist for the same key, which one wins in a buffer using that specific mode?',
      options: ['The global binding always wins, regardless of mode', 'The mode-specific binding wins — Emacs checks the current buffer\'s mode-local keymap before falling back to the global one', 'Neither binding works; the key becomes unbound', 'Whichever was defined most recently in time wins'],
      correct: 1,
      explain: 'Emacs checks mode-specific keymaps before falling back to the global keymap — the more specific, local binding takes priority over the general global one.'
    },
    {
      q: 'When would you use define-key on a specific mode\'s keymap instead of global-set-key?',
      options: ['They are functionally identical; it never matters which you use', 'When a binding genuinely only makes sense in one specific context, rather than being useful (or meaningful) in every possible buffer', 'define-key only works for built-in Emacs commands, never custom ones', 'global-set-key is deprecated and define-key should always be used instead'],
      correct: 1,
      explain: 'define-key on a specific mode\'s keymap scopes a binding to only that context — appropriate when the bound command would not make sense or do anything useful outside that specific mode.'
    }
  ],
  pitfalls: [
    'Binding a custom command outside the reserved C-c-letter space (or the empty s- namespace), risking a collision with an existing, actively-used built-in or package binding.',
    'Expecting a global-set-key binding to be automatically overridden or ignored in a specific mode without realizing a mode-specific keymap binding needs to exist for that to actually happen.',
    'Binding a mode-specific command (something only meaningful in one kind of buffer) globally instead of scoping it with define-key, leading to confusing or useless behavior when that key is pressed in an unrelated context.'
  ],
  interview: [
    {
      q: 'Explain the difference between global-set-key and define-key on a specific mode\'s keymap, including when you would choose each.',
      a: 'global-set-key adds a binding to the GLOBAL keymap, which applies in every buffer by default unless overridden by something more specific — appropriate for a command that should behave the same way regardless of what kind of buffer you happen to be in (a personal shortcut for saving, searching, or navigating, for instance). define-key, aimed at a SPECIFIC mode\'s own keymap variable, scopes a binding to only buffers using that particular mode — appropriate for a command that only makes sense in that specific context (a language-specific linter command, for instance, which would do nothing useful in a plain text buffer). The choice comes down to whether the bound behavior is genuinely universal or genuinely context-specific.'
    },
    {
      q: 'Why is C-c followed by a letter specifically recommended as the "safe" prefix for custom keybindings, and what is the actual risk of ignoring that convention?',
      a: 'C-c-letter is a longstanding, widely-respected Emacs convention specifically reserved for user and third-party-package customization — Emacs\'s own core commands and well-behaved packages deliberately never claim bindings there, making anything bound in that space essentially guaranteed collision-free, both against Emacs itself and against any well-behaved package installed now or in the future. Binding a custom command OUTSIDE that reserved space instead — say, overriding an actively-used built-in binding like C-x C-s — risks either losing access to the original command under its expected key, or creating a config that behaves confusingly differently from what documentation, tutorials, and general community knowledge would lead anyone (including your future self) to expect from standard Emacs keybindings.'
    },
    {
      q: 'Walk through, mechanically, why a mode-specific keymap binding takes priority over an otherwise-identical global binding, and give a concrete real-world reason this matters.',
      a: 'Emacs\'s keybinding lookup checks a specific priority order: any active minor-mode keymaps, then the current buffer\'s major-mode keymap, are all checked BEFORE falling back to the global keymap — meaning a mode-specific binding for a given key sequence is found and used first, if one exists, regardless of the global keymap also having a binding for that same sequence. This matters concretely because it lets a specific mode meaningfully customize behavior for its own context — a programming-language mode binding C-c C-c to "compile/run this file," which is exactly the useful, context-appropriate behavior for THAT kind of buffer — without needing to change what C-c C-c means globally, everywhere else, where compiling would not make sense at all (an ordinary text file, the minibuffer, and so on).'
    },
    {
      q: 'A user asks why they should bother learning C-x C-s and Emacs\'s "real" keybindings at all if they can just bind Cmd-S to save-buffer and everything else Mac-familiar. How would you frame the tradeoff for them?',
      a: 'Binding Cmd-S (via the s- Super namespace Part 1 set up specifically for this) is a completely legitimate, low-risk personalization — it does not remove or interfere with C-x C-s at all, both simply coexist, doing the same thing under two different key sequences. The tradeoff worth being honest about: leaning entirely on personal Mac-style shortcuts means documentation, tutorials, and pair-programming with another Emacs user will still assume and reference the "standard" bindings (C-x C-s, C-x C-f, and so on), so genuinely never learning those leaves a real gap in following along with the broader Emacs community\'s shared vocabulary. The practical middle ground most experienced users land on: learn the standard bindings well enough to follow documentation and work on someone else\'s Emacs, while ALSO layering in personal Mac-familiar shortcuts (via Super) for genuinely frequent, muscle-memory-heavy actions — both fully available simultaneously, since nothing about adding one removes the other.'
    }
  ]
};
