window.LESSONS = window.LESSONS || {};
window.LESSONS['completion-and-lsp'] = {
  id: 'completion-and-lsp',
  title: 'Real Code Intelligence: Completion & eglot (Built-In LSP)',
  category: 'Part 6 — Working With Code',
  timeMin: 40,
  summary: 'Everything covered so far edits text — this lesson is where Emacs starts genuinely understanding code. LSP (Language Server Protocol) is the standardization that made real code intelligence — accurate go-to-definition, live error checking, type-aware completion — a solved, shared problem instead of something every single editor had to separately reinvent for every single language. eglot, built directly into modern Emacs, is Emacs\'s client for that same protocol.',
  goals: [
    'Explain the "M×N problem" LSP was specifically designed to solve',
    'Connect a buffer to a language server with M-x eglot',
    'Jump to a symbol\'s definition with M-. and back with M-,, with or without LSP connected',
    'Use completion-at-point, and explain why it becomes dramatically more accurate once eglot is connected',
    'Explain the difference between text-based ("dumb") completion and LSP-aware completion'
  ],
  concept: [
    {
      h: 'LSP: solving the M×N problem',
      p: [
        'Before the <b>Language Server Protocol</b> (LSP) existed, real code intelligence — accurate go-to-definition, live error checking, genuinely type-aware completion — required each EDITOR to write its own separate integration for each LANGUAGE it wanted to support well. With M editors and N languages, that meant, in the worst case, M×N separate, largely duplicated integration efforts, each editor author reimplementing similar language-understanding logic independently, for every language, over and over.',
        'LSP standardizes the actual PROTOCOL: any editor implementing the client side of LSP just once can talk to ANY language\'s server implementing the server side just once — collapsing M×N down to M+N. A language author writes ONE language server; an editor author writes ONE LSP client; every combination of editor and language that both speak the protocol correctly works together, without either side needing to know anything specific about the other. This is genuinely one of the most impactful cross-tool standardization efforts in recent programming-tooling history, and it is exactly why "does this editor support language X well" increasingly just means "does a language server exist for X," rather than depending on whether that specific editor\'s authors happened to build custom support for it.'
      ]
    },
    {
      h: 'eglot: Emacs\'s own built-in LSP client',
      p: [
        '<b>eglot</b> is Emacs\'s client-side implementation of LSP, built directly into Emacs since version 29 — no separate package installation required at all. <code>M-x eglot</code>, run in a buffer for a language with an installed language server (the SERVER itself is a separate install, specific to that language — <code>pyright</code> for Python, <code>gopls</code> for Go, and so on, each installed independently of Emacs), connects that buffer to the appropriate running server.',
        'Once connected, a meaningful set of capabilities unlocks essentially for free: live, real-time diagnostics (errors and warnings shown as you type, not just when you separately run a linter), genuinely accurate go-to-definition (covered next via xref), and — the rest of this lesson\'s focus — completion suggestions that actually understand your code\'s real structure, not just guess from nearby text.'
      ]
    },
    {
      h: 'xref: jumping to a definition, with or without LSP',
      p: [
        '<code>M-.</code> (xref-find-definitions) jumps point to wherever the symbol currently under the cursor is actually DEFINED. <code>M-,</code> jumps back to exactly where you were before that jump — a genuinely useful "go there, then return" pair for exploring unfamiliar code without losing your place.',
        'xref is a general Emacs mechanism that predates LSP and works independently of it — without eglot connected, xref falls back to a simpler, heuristic or tag-file-based method of guessing where a definition might be, which works reasonably for straightforward cases but can genuinely get it wrong for anything requiring real understanding of the code\'s types or scope. Once eglot IS connected, it plugs in as a dramatically more ACCURATE backend for those exact same M-./M-, keybindings — the keys you press do not change at all, but the quality and correctness of where they actually take you improves substantially, since the underlying answer now comes from genuine language-aware analysis rather than a heuristic guess.'
      ]
    },
    {
      h: 'Completion: guessing from nearby text vs genuinely understanding the code',
      p: [
        'Emacs\'s basic completion-at-point (and the older, related dabbrev-style completion) works by looking for words that have ALREADY APPEARED SOMEWHERE — in the current buffer, or other open buffers — and offering those as completion candidates. This is genuinely useful and fundamentally "dumb" in a specific sense: it has no real understanding of what is actually VALID at the current position, it is purely pattern-matching against text that happens to already exist nearby.',
        'Once eglot is connected, completion-at-point becomes LSP-AWARE instead — a fundamentally different KIND of completion, not merely a "better" version of the same idea: it genuinely knows what methods actually exist on a specific object\'s real type, what functions and variables are actually in scope at this exact position, and filters suggestions to what is ACTUALLY VALID Python (or whatever language) at that specific point — catching things dumb text-based completion structurally cannot, like correctly suggesting a method that has never literally appeared as text anywhere in the current buffer before, simply because the language server genuinely knows it exists on that object\'s type.'
      ]
    }
  ],
  conceptFlow: {
    title: 'The M×N problem, and how LSP collapses it to M+N',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Before LSP',
        nodes: [
          { id: 'before', text: '3 editors × 4 languages =\n12 separate, largely duplicated integrations' }
        ]
      },
      {
        label: 'The actual problem',
        nodes: [
          { id: 'problem', text: 'Every editor author reimplements\nsimilar language-understanding logic,\nfor EVERY language, separately' }
        ]
      },
      {
        label: 'What LSP standardizes',
        nodes: [
          { id: 'protocol', text: 'ONE shared protocol —\nboth sides just need to speak IT,\nnot know anything about each other directly' }
        ]
      },
      {
        label: 'After LSP',
        nodes: [
          { id: 'after', text: '3 editor CLIENTS + 4 language SERVERS =\n7 total implementations, not 12' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'result', text: 'Any editor + any language,\nas long as BOTH speak LSP —\nno per-combination work required' }
        ]
      }
    ],
    steps: [
      { active: ['before'], note: 'With 3 editors each wanting good support for 4 languages, the naive approach requires 3×4 = 12 separate, largely duplicated integration efforts.' },
      { active: ['problem'], note: 'Each of those 12 integrations is independently solving a very similar underlying problem — parsing code, understanding types, finding definitions — for its own specific editor/language pairing, with essentially no shared work between them.' },
      { active: ['protocol'], note: 'LSP defines one standard PROTOCOL — a shared language both an editor\'s "client" side and a language\'s "server" side can speak, without either needing to know anything specific about the OTHER side\'s implementation.' },
      { active: ['after'], note: 'Now each of the 3 editors implements the client side of the protocol ONCE (3 implementations total), and each of the 4 languages implements the server side ONCE (4 implementations total) — 3 + 4 = 7 total pieces of work, not 12.' },
      { active: ['result'], note: 'Any editor speaking the protocol can now work with any language\'s server also speaking the protocol — genuinely no per-COMBINATION work required at all, which is exactly why adding a new editor, or a new language, no longer multiplies the total integration effort the way it did before.' }
    ]
  },
  story: {
    onePiece: {
      title: 'The Old Way: A Separate Translator for Every Crew, Every Language',
      text: 'Before a certain innovation swept the Grand Line\'s trading posts, doing real business required something genuinely burdensome: every crew that wanted to trade well with several OTHER crews needed its own dedicated translator, separately trained, for EACH of those other crews\' specific languages and customs — a crew wanting to deal fluently with four different island cultures needed four entirely separate specialist translators, each one a significant, duplicated investment. Multiply that by every crew wanting to trade with every other crew, and the total number of separately-trained translators across the whole trading network became genuinely enormous — mostly redundant effort, since a huge fraction of what each translator actually knew (how negotiation itself generally works, how to phrase a fair offer) was fundamentally similar work, just being separately relearned and separately staffed, over and over, for every single pairing. The innovation that actually fixed this: a standardized trading protocol — one common set of signals and terms that ANY crew could learn ONCE, and that ANY island culture could ALSO adopt once, on their own side. A crew no longer needed a separate translator per island — they needed exactly ONE person fluent in the standard protocol, and any island that had ALSO adopted the same standard protocol could trade with them directly, with no dedicated per-pairing translator required at all. Nami, doing the actual math on how much this saved the crew, put it plainly to Usopp: "It used to be: every crew, times every island, needs its own separate translator. Now it is just: learn the ONE protocol, and every island that also knows it is instantly reachable. That is not a small difference — that is the whole problem going away."'
    },
    sitcom: {
      show: 'Friends',
      title: 'The Old Way: A Separate Personal Connection With Every Restaurant',
      text: 'Before the group discovers a certain city-wide reservation service, getting a table anywhere decent required something genuinely burdensome: each of the six friends who wanted reliable access to several favorite restaurants needed their OWN separate personal relationship with the host or owner at EACH of those restaurants — Monica knowing four restaurant owners personally, Joey knowing a different four, each relationship separately built and separately maintained, mostly duplicated effort across the group, since a huge fraction of what actually mattered (being a known, trusted regular) was fundamentally similar at every single restaurant, just separately re-established, over and over, friend by friend, restaurant by restaurant. What actually fixes this is a single, standardized reservation SERVICE that any restaurant can sign up for once, and any customer can use once — Chandler no longer needs his own personal relationship with each individual restaurant\'s host; he needs exactly ONE account with the standard service, and any restaurant that has ALSO signed up for that same service becomes instantly, directly bookable, with no separately-cultivated personal relationship required at all. Ross, working out how much simpler this actually is, explains it to Rachel plainly: "It used to be: every one of us, times every restaurant we liked, needed its own personal connection. Now it is: learn the ONE service, and every restaurant that also uses it is instantly reachable. That is not a small difference — that is the whole problem going away."'
    },
    why: 'The old separate-translator-per-crew-per-language system, and the old separate-personal-connection-per-friend-per-restaurant system, are both exactly the M×N problem LSP solves: without a shared standard, every EDITOR needing every LANGUAGE meant duplicated, per-combination effort. A single standard protocol — everyone learns it once — collapses that multiplication into simple addition: learn the protocol once, and everyone else who also knows it is instantly reachable, with no separate, per-pairing integration ever required again.'
  },
  tech: [
    {
      q: 'Concretely, why does framing LSP\'s value as "solving an M×N problem" matter for understanding why it was such a significant development, rather than just being one more incremental feature?',
      a: 'The M×N framing captures something genuinely structural, not just incremental: before LSP, adding support for ONE new programming language to an ecosystem of editors meant, in principle, EVERY editor author separately building their own integration for that one language — the WORK REQUIRED scaled multiplicatively with the number of editor/language combinations, not just additively with the number of languages or editors individually. LSP changes the actual shape of that scaling: adding a new language now requires building ONE server, which every LSP-speaking editor can immediately use; adding a new editor requires building ONE client, which can immediately use every existing LSP-speaking language server. The total effort required scales additively (M+N) rather than multiplicatively (M×N) — a genuinely different, more sustainable growth curve as both the number of languages and the number of editors in active use continues to increase over time.'
    },
    {
      q: 'Why does M-. (xref-find-definitions) still work, and still produce a real answer, even in a buffer with no eglot/LSP connection at all — what is actually different between the two cases?',
      a: 'xref is a general-purpose Emacs mechanism with a pluggable BACKEND — without eglot connected, it falls back to a simpler, heuristic method (often based on tag files like TAGS/etags, or straightforward text-matching heuristics for simpler cases), which can genuinely produce a correct answer for straightforward situations (a function defined once, in an obviously-named way, within a smallish codebase) but has no real understanding of the language\'s actual type system, scoping rules, or import structure. Once eglot IS connected, it registers itself as a much more capable xref BACKEND for that same buffer — the exact same M-./M-, keybindings are pressed, but the underlying answer now comes from the language server\'s genuine, structural understanding of the code (correctly distinguishing between two different methods with the same name on different types, for instance), which the simpler fallback backend has no reliable way to do correctly.'
    },
    {
      q: 'Why is LSP-aware completion described as fundamentally different in KIND from text-based completion, rather than simply "the same idea, done more thoroughly"?',
      a: 'Text-based completion is fundamentally PATTERN MATCHING against text that has already, literally, appeared somewhere nearby — it has no model of the language\'s actual semantics at all, so it can only ever suggest things it has physically seen as text before, and it cannot distinguish between a suggestion that happens to be textually similar versus one that is actually semantically VALID at the current position. LSP-aware completion is querying the language server\'s genuine, structural understanding of the code — it can correctly suggest a method that has NEVER appeared as literal text anywhere in the current buffer, simply because the server knows, from real type analysis, that this specific object\'s type genuinely has that method — and it can correctly EXCLUDE a textually-similar-looking suggestion that would not actually be valid at this specific position. This is a difference in the underlying MECHANISM producing the suggestions, not merely a difference in how many suggestions are offered or how well-ranked they happen to be.'
    }
  ],
  code: {
    title: 'Connecting eglot, jumping to definitions, and completion',
    intro: 'This assumes a language server is already installed for whatever language you are working in (e.g., "pip install pyright" for Python) — eglot connects to an existing server, it does not install one for you.',
    code: `;; Open a Python file with pyright installed on your system:
C-x C-f app.py <RET>

M-x eglot <RET>
;; Connects this buffer to the running pyright language server.
;; The mode-line now shows an indicator that eglot is active.

;; Real-time diagnostics now appear as you type — an unused import,
;; a type mismatch, or a syntax error is flagged immediately, not just
;; when you separately run a linter afterward.

;; Point on a function call, say "process_data(...)":
M-.
;; Jumps DIRECTLY to where process_data is actually defined — correctly,
;; even if there are multiple functions with similar names elsewhere.

M-,
;; Jumps back to exactly where you were before that M-. jump.

;; Completion, now LSP-aware:
;; Type "my_database_connection." and pause —
;; a completion popup shows the REAL methods that object's actual type
;; has, even ones that have never appeared as text anywhere in this file:
;;   .execute_query()
;;   .close()
;;   .transaction()

;; Compare to a plain text buffer (no eglot, no language server involved):
;; completion-at-point there can only suggest words that have literally
;; already appeared somewhere in your open buffers — no real understanding
;; of what is actually valid at this specific position.`,
    notes: [
      'eglot connects to a language server that must already be installed separately — M-x eglot with no server installed for that language will simply fail to connect, with an error explaining as much.',
      'The mode-line indicator eglot adds is worth glancing at to confirm a connection actually succeeded, exactly the same "check the mode-line" habit from the previous lesson\'s major/minor mode coverage.'
    ]
  },
  lab: {
    title: 'Write the right eglot/xref/completion commands',
    prompt: 'Write exactly what each task asks for.',
    starter: `# Task: connect the current buffer to an available language server


# Task: jump to the definition of the symbol currently under the cursor


# Task: jump BACK to where you were before that jump


# Q: Explain, in one or two sentences, why LSP-aware completion can suggest a
# method that has never appeared as literal text anywhere in the current buffer.

`,
    checks: [
      { re: 'M-x\\s+eglot', flags: 'i', must: true, hint: 'M-x eglot connects the current buffer to an available language server.', pass: 'M-x eglot ✓' },
      { re: 'M-\\.', flags: '', must: true, hint: 'M-. (xref-find-definitions) jumps to a symbol\'s definition.', pass: 'M-. ✓' },
      { re: 'M-,', flags: '', must: true, hint: 'M-, jumps back to where you were before the M-. jump.', pass: 'M-, ✓' },
      { re: 'type|structur|semantic|understand', flags: 'i', must: true, hint: 'LSP-aware completion queries the language server\'s genuine understanding of the code\'s types/structure, not just text that has appeared before.', pass: 'Explained LSP completion mechanism ✓' }
    ],
    run: 'Try it for real: if you have a language server installed for something you write in, M-x eglot in a real file and try M-. on a function call.',
    solution: `# Task: connect the current buffer to an available language server
M-x eglot

# Task: jump to the definition of the symbol currently under the cursor
M-.

# Task: jump BACK to where you were before that jump
M-,

# Q: Explain, in one or two sentences, why LSP-aware completion can suggest a
# method that has never appeared as literal text anywhere in the current buffer.
# LSP-aware completion queries the language server's genuine, structural
# understanding of the code's types — it knows what methods actually exist on
# a specific object's real type, regardless of whether that method has ever
# literally been typed as text anywhere in the current buffer before.`,
    notes: [
      'M-. and M-, work identically whether or not eglot is connected — the difference is entirely in the ACCURACY of the answer, not in which keys you press.',
      'This lab is genuinely worth trying with a real language server if you have one available — the difference between dumb and LSP-aware completion is much more obvious in practice than in description.'
    ]
  },
  quiz: [
    {
      q: 'What is the "M×N problem" LSP was specifically designed to solve?',
      options: ['Memory usage scaling with file size', 'Every editor needing a separate, custom integration for every language it wants to support well, scaling multiplicatively', 'The number of keybindings in a typical Emacs configuration', 'Network latency when connecting to a remote server'],
      correct: 1,
      explain: 'Before LSP, real language support required each editor to separately integrate with each language — M editors times N languages, a multiplicatively-scaling problem LSP collapses to additive (M+N).'
    },
    {
      q: 'What is eglot?',
      options: ['A separate programming language', 'Emacs\'s built-in client for the Language Server Protocol, requiring no separate package installation since Emacs 29', 'A third-party package that must always be manually installed', 'A file format for storing code'],
      correct: 1,
      explain: 'eglot is Emacs\'s own LSP client, built directly into Emacs 29 and later — it speaks the standard protocol to whatever language server is separately installed for a given language.'
    },
    {
      q: 'Does M-. (xref-find-definitions) work without eglot/LSP connected?',
      options: ['No, it requires LSP to function at all', 'Yes — it falls back to a simpler, heuristic backend, though eglot plugs in as a dramatically more accurate one once connected', 'It only works for Emacs Lisp files', 'It requires a separate keybinding entirely when LSP is not active'],
      correct: 1,
      explain: 'xref is a general mechanism with a pluggable backend — it works without LSP using simpler heuristics, and eglot provides a more accurate backend for the exact same keybinding once connected.'
    },
    {
      q: 'Why is LSP-aware completion considered fundamentally different in kind from text-based ("dumb") completion?',
      options: ['It is not actually different; LSP just has a longer suggestion list', 'Text-based completion pattern-matches against text already typed nearby; LSP-aware completion queries genuine structural/type understanding, correctly suggesting things that have never appeared as text before', 'LSP-aware completion only works for comments, not actual code', 'Dumb completion is always more accurate than LSP-aware completion'],
      correct: 1,
      explain: 'The mechanism itself differs: text-based completion can only suggest what has already appeared as literal text; LSP-aware completion can correctly suggest genuinely valid options based on real type/structural understanding, regardless of prior textual appearance.'
    },
    {
      q: 'Does M-x eglot install a language server for you?',
      options: ['Yes, it automatically downloads and installs any needed language server', 'No — it connects to a language server that must already be installed separately on your system', 'It only works if no language server is installed at all', 'eglot and language servers are the exact same thing'],
      correct: 1,
      explain: 'eglot is a CLIENT — it connects to an already-installed, separately-managed language server (like pyright or gopls); it does not install the server itself.'
    }
  ],
  pitfalls: [
    'Running M-x eglot without a language server actually installed for that language on the system, then being confused when it fails to connect — the server is a separate, language-specific installation, not something eglot provides on its own.',
    'Assuming M-. always gives a fully accurate answer regardless of whether eglot is connected — without LSP, it is a genuinely useful heuristic, not a guarantee of correctness the way an LSP-backed answer is.',
    'Expecting text-based completion (without eglot) to suggest something that genuinely exists on an object\'s type but has never been typed as literal text anywhere nearby — dumb completion structurally cannot do this; only LSP-aware completion can.'
  ],
  interview: [
    {
      q: 'Explain the Language Server Protocol\'s core value proposition, using the M×N framing precisely.',
      a: 'Before LSP, real code intelligence (accurate go-to-definition, live diagnostics, type-aware completion) required each of M editors to build its own separate integration with each of N languages it wanted to support well — a multiplicatively-scaling amount of largely duplicated work, M×N total integrations, most of them independently reimplementing very similar underlying logic. LSP defines a standard protocol that both sides can speak without knowing anything specific about each other: each editor implements the client side ONCE (M implementations total), each language implements the server side ONCE (N implementations total), and any editor/language pairing where both sides speak the protocol works together automatically. The total required effort becomes additive (M+N) rather than multiplicative (M×N) — a fundamentally different, far more sustainable scaling relationship as the number of both editors and languages continues to grow.'
    },
    {
      q: 'Walk through exactly what changes, mechanically, when eglot connects to a language server, using M-. as a concrete example.',
      a: 'M-. (xref-find-definitions) is implemented as a general Emacs mechanism with a pluggable backend — without eglot connected, it uses whatever simpler, heuristic backend is available by default (often tag-file or text-heuristic based), producing a reasonable but not necessarily fully accurate answer for anything beyond straightforward cases. When M-x eglot successfully connects a buffer to a running language server, eglot registers itself as an ADDITIONAL, more capable xref backend specifically for that buffer — the exact same M-. keybinding is pressed, dispatching to xref\'s general machinery exactly as before, but that machinery now queries eglot\'s connection to the language server for the actual answer, which reflects genuine structural/type analysis of the code rather than a heuristic guess. The user-facing keybinding never changes; the QUALITY of the underlying answer improves substantially, because the source of that answer has changed.'
    },
    {
      q: 'A colleague argues that eglot is essentially just "autocomplete, but Emacs-flavored" — how would you correct or refine that framing?',
      a: 'Completion is genuinely one visible piece of what eglot provides, but framing it as JUST autocomplete undersells the actual mechanism and its other capabilities. eglot is a full LSP CLIENT, providing real-time diagnostics (live error/warning flagging as you type, not just on demand), accurate go-to-definition via xref integration, and completion that is qualitatively different from ordinary autocomplete — it queries the language server\'s genuine understanding of types and scope, correctly suggesting things that have never appeared as literal text before, and correctly excluding textually-similar but semantically-invalid suggestions, something no pattern-matching-based autocomplete can do by design. "Autocomplete, Emacs-flavored" describes roughly one surface-level symptom of what eglot enables; the underlying mechanism — a standardized protocol connecting Emacs to genuine, external, language-specific code analysis — is the actually significant part.'
    },
    {
      q: 'Why might a team standardize on using language servers (via eglot, or an equivalent client in another editor) as part of their development workflow, beyond individual developer convenience?',
      a: 'Because the language server itself is the SAME underlying tool regardless of which editor a given developer happens to prefer — a Python team using pyright gets identical diagnostics, identical go-to-definition behavior, and identical completion accuracy whether a specific developer is using Emacs (via eglot), VS Code, or any other LSP-speaking editor, since all of them are querying the exact same server doing the exact same analysis. This means editor choice becomes genuinely a matter of individual developer preference rather than a source of inconsistent tooling behavior across the team — a real, practical benefit of LSP\'s standardization beyond just "each individual developer gets nice features," since it also removes editor choice as a source of team-wide tooling fragmentation.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover connecting eglot and using its core capabilities. This is what is underneath: why eglot is deliberately minimal compared to alternatives, and flymake, the diagnostics-display system eglot integrates with.',
    sections: [
      {
        h: 'eglot vs lsp-mode: deliberately minimal vs deliberately full-featured',
        p: [
          '<b>lsp-mode</b> is a popular third-party alternative to eglot, predating eglot\'s inclusion in Emacs core, and it takes a genuinely different design philosophy: rather than eglot\'s deliberately minimal, "just the standard protocol, cleanly" approach, lsp-mode implements a considerably larger surface of LSP\'s full specification (including many optional, less commonly needed protocol features) plus its own additional UI conveniences layered on top, at the cost of a meaningfully heavier, more complex codebase and typically a somewhat higher resource/startup overhead. Neither is objectively "better" in every case — eglot\'s minimalism (a deliberate design goal of its original author, who is also a longtime core Emacs maintainer) aligns closely with core Emacs\'s own general design philosophy and ships built in with zero extra setup; lsp-mode\'s richer feature set can be worth the extra weight for someone wanting every possible LSP capability exposed with polished UI, at the cost of a separate installation and generally more configuration surface.'
        ]
      },
      {
        h: 'flymake: the diagnostics-display minor mode eglot builds on',
        p: [
          '<b>flymake</b> is Emacs\'s own built-in framework for displaying live, in-buffer diagnostics (errors, warnings) as you edit — it existed before eglot and LSP entirely, originally designed to integrate with simpler, standalone syntax checkers. eglot deliberately builds ON TOP of flymake rather than inventing its own separate diagnostics-display mechanism: when eglot receives error/warning information from a connected language server, it feeds that information INTO flymake, which then handles the actual visual presentation (underlines, a summary in the mode-line, navigation between diagnostics with flymake\'s own next-error/previous-error commands). This is a deliberate, minimalist design choice consistent with eglot\'s overall philosophy — reuse an already-existing, well-established Emacs mechanism rather than building a redundant, competing one specifically for LSP diagnostics.'
        ]
      }
    ]
  }
};
