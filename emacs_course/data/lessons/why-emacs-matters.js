window.LESSONS = window.LESSONS || {};
window.LESSONS['why-emacs-matters'] = {
  id: 'why-emacs-matters',
  title: 'Why Emacs: Self-Documenting, Extensible, and Older Than You\'d Guess',
  category: 'Part 0 — Orientation & Starting Emacs',
  timeMin: 25,
  summary: 'Emacs is older than most software still in daily use, and it has survived not by staying the same but by being genuinely, structurally rebuildable by the person using it. Before touching a single keybinding, this lesson explains what Emacs actually IS underneath — a Lisp interpreter with a text-editing environment built on top of it, in that same Lisp — and why that one fact explains almost everything else about it: why it can answer any question about itself, why "extensible" means something deeper here than in most software, and why the learning curve is a genuinely honest tradeoff, not just a quirky reputation.',
  goals: [
    'Explain what Emacs fundamentally is: a Lisp interpreter with a text-editing environment built on top',
    'Use the C-h help system to describe what a keystroke does, and pull up documentation for any function',
    'Explain what "extensible" means in Emacs specifically, and why it goes deeper than a typical plugin system',
    'Describe the honest tradeoff between Emacs and a modern IDE, without overselling either',
    'Explain why Emacs config is a durable, portable investment rather than something to redo per-machine'
  ],
  concept: [
    {
      h: 'Not "a text editor with scripting" — a Lisp interpreter that happens to edit text',
      p: [
        'Most editors are written in some language and expose a LIMITED scripting API on top, bolted on for extensibility. Emacs is built the other way around: its core is a small, fast interpreter for a dialect of Lisp called <b>Emacs Lisp</b> (elisp), and the ENTIRE text-editing environment — buffers, windows, every built-in command, even the help system covered next — is itself written in that same elisp, running on top of that interpreter. There is no separate, restricted "plugin language" distinct from "how Emacs itself is built."',
        'This single architectural fact is the reason almost everything else about Emacs follows: because your own configuration and any package you install are written in the EXACT SAME language, with the EXACT SAME access to the editor\'s internals, as Emacs\'s own built-in commands, there is structurally no ceiling on what you can change. Redefining how a built-in command behaves is not a hack or an unsupported workaround — it is using Emacs exactly the way it was designed to be used.'
      ]
    },
    {
      h: 'Self-documenting: you are never actually stuck not knowing what something does',
      p: [
        '<code>C-h</code> (Control-h) is the prefix for Emacs\'s built-in help system, and it is worth internalizing as a reflex before anything else in this course. <code>C-h k</code>, followed by any keystroke or key sequence, tells you EXACTLY which function that key runs, along with that function\'s full documentation — no guessing, no needing to search the internet for "what does this key combo do in Emacs." <code>C-h f</code>, followed by a function name, pulls up complete documentation for ANY function, including Emacs\'s own built-in ones — the same documentation format whether it is a core command or something you wrote yourself an hour ago.',
        '<code>C-h t</code> launches Emacs\'s built-in interactive tutorial — genuinely worth running once, early, since it teaches the fundamental motions with your hands actually on the keyboard rather than just reading about them. The deeper point behind all of this: because Emacs can always tell you, precisely and immediately, what any given command actually does — pulling that answer directly from the running code, not a possibly-outdated external manual — there is no such thing as being permanently stuck not knowing what you just pressed.'
      ]
    },
    {
      h: 'Extensibility as the actual point, not a marketing bullet',
      p: [
        'In most editors, a "plugin" or "extension" is written against a deliberately LIMITED API — the extension can do whatever the editor\'s authors decided to expose, and nothing more, because the extension mechanism and the editor\'s own internals are genuinely separate things. In Emacs, because everything (as covered above) is elisp running on the same interpreter, a package has essentially the SAME level of access as Emacs\'s own core code. This is not a subtle distinction — it is why deeply personal, specific workflows that no mainstream editor\'s plugin marketplace happens to already offer are still genuinely buildable in Emacs, by you, without waiting for someone else to have built and published exactly that feature first.',
        'This is also why Emacs users\' configurations tend to look so different from each other — not because the software is inconsistent, but because the extensibility genuinely goes all the way down, and different people build genuinely different tools for themselves out of the same underlying primitives.'
      ]
    },
    {
      h: 'The honest tradeoff, and why the investment tends to pay off long-term',
      p: [
        'None of this is free. Emacs\'s default keybindings genuinely differ from nearly every other piece of software you have ever used — this course spends real time on exactly that friction, starting with Part 1\'s entire focus on getting the Mac-specific keyboard mapping right. A modern IDE gives you an enormous amount of useful behavior out of the box, with zero configuration — Emacs, by design, gives you comparatively less immediately and expects you to build the rest yourself, at your own pace, exactly to your own needs.',
        'The payoff shows up over the LONG run, not the first afternoon: a personal Emacs configuration is a small, portable, plain-text file (or a handful of them) that follows you to every new machine, keeps working largely unchanged for years, and — as Part 7\'s TRAMP lesson shows — can even edit files on a remote server as if they were local, using the exact same environment you have already spent time making genuinely yours. Emacs\'s core has been stable for decades while still being actively developed (recent versions added native support for tree-sitter-based syntax parsing and a built-in LSP client, both covered in Part 6) — a genuinely rare combination of long-term stability and real, ongoing relevance.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Zoro\'s Own Blades vs. Whatever Sword Is Lying Around',
      text: 'Any reasonably competent swordsman can pick up an unfamiliar blade off a fallen enemy and fight adequately with it — it cuts, it blocks, it does roughly what a sword does. That is genuinely fine for a single fight. But Zoro\'s actual mastery was never built on "whatever sword happens to be available" — it is built specifically on HIS OWN blades, carried and trained with for years, until the distinction between "Zoro" and "Zoro\'s swordsmanship" barely exists anymore. And crucially, his technique is not a fixed, memorized list of moves he executes identically every time — he genuinely CREATES new techniques, on the spot, adapted to whatever specific opponent or situation he is facing, because his mastery goes all the way down to the underlying principles, not just a catalog of pre-built moves someone else designed for him. A borrowed sword lets you fight. Years with your own blade, understood down to its exact weight and balance, lets you invent an entirely new technique mid-battle because the SITUATION calls for something that does not exist in any manual yet. Usopp, watching Zoro casually improvise something the crew has genuinely never seen him do before, asks when he learned that specific move. Zoro\'s answer is characteristically unbothered: "I did not learn it. I needed it, so I made it, just now — that is what actually understanding your own blade lets you do that using someone else\'s never will."'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Roommate Agreement: Fully Documented, Endlessly Amendable',
      text: 'Most people sharing an apartment operate on some unspoken, generic understanding of how things work — reasonable enough, but genuinely vague the moment an actual dispute arises, since nothing was ever written down precisely enough to settle it. Sheldon\'s Roommate Agreement is the opposite of that in every possible way, and — mockable as it is — it is structurally exactly the thing this lesson is describing. Every single rule is written down, in full, consultable at any time — there is no "I am not sure what the actual rule is here," because the entire system is, quite literally, self-documenting; you can go LOOK UP the precise clause covering any specific situation, argued over and settled by its own text, not by fuzzy memory of what someone once said. And it is not a fixed, unchangeable document either — it has an entire AMENDMENT PROCESS built directly into it, meaning Sheldon (and, in principle, anyone else party to it) can extend or modify its actual rules using the exact same mechanism the original rules were written with — no separate, more limited process for "new custom rules" versus "the real rules." Penny, encountering the Roommate Agreement for the first time and finding the entire concept absurd, eventually has to grudgingly admit something: when an actual dispute comes up between Sheldon and Leonard, it gets resolved by consulting an actual, precise, amendable document — while every OTHER apartment she has ever lived in just argues from memory and vague assumption. It takes real effort to build and maintain something like that. It also, undeniably, keeps working exactly as intended for years afterward, precisely because it was built to be looked into and changed by its own users in the first place.'
    },
    why: 'Zoro\'s own blade and Sheldon\'s Roommate Agreement share the same underlying shape: real, meaningful upfront investment, in exchange for something genuinely YOURS — fully understandable on demand (self-documenting), and extensible using the exact same mechanism it was originally built with, not some separate, more limited add-on process. That is precisely Emacs\'s bet: more effort than picking up whatever editor is already lying around, in exchange for a tool that becomes genuinely, deeply yours over time.'
  },
  tech: [
    {
      q: 'Concretely, what does it mean that "even Emacs\'s built-in commands are just elisp functions" — how is that different from a normal application\'s built-in features?',
      a: 'In most applications, a "built-in feature" is implemented in the application\'s own compiled, internal code — genuinely inaccessible and unmodifiable by an ordinary user or even most plugins, which only get to call a deliberately restricted, separate API surface. In Emacs, a huge portion of what looks like "built-in behavior" is actually elisp source code, loaded and interpreted at startup exactly like your own configuration is — meaning you can look at the ACTUAL SOURCE of a built-in command (C-h f on it often shows a direct link to the exact source file and line), and, if you genuinely wanted to, redefine that exact function yourself, in your own config, with no special permission or separate mechanism required. The boundary between "how Emacs works" and "how you\'ve customized Emacs" is far blurrier than in almost any other software, by design.'
    },
    {
      q: 'What actually happens, mechanically, when you press "C-h k" followed by another key?',
      a: 'Emacs waits for the next key sequence you type, looks up exactly which function is currently BOUND to that specific sequence (keybindings are just a lookup table mapping key sequences to function names, itself stored and modifiable like any other Emacs data), and then displays that function\'s full documentation string — the exact same documentation a package author would have written directly into their elisp source code as a comment attached to the function definition. This is why the help is always accurate and up to date: it is not a separately maintained manual that can drift out of sync with the actual code, it is being read directly from whatever code is genuinely running in your current session, including any customizations or third-party packages you have installed.'
    },
    {
      q: 'Why would someone choose the "more setup work now, more freedom later" tradeoff of Emacs over a modern IDE that works well immediately with no configuration?',
      a: 'A modern IDE\'s out-of-the-box behavior is decided by its authors, for a broad general audience — genuinely excellent for the common cases they designed for, and genuinely limited the moment your actual workflow needs something specific that was not anticipated, at which point you are waiting on the IDE\'s own plugin ecosystem (if one even exists for that need) rather than simply building it yourself. Emacs inverts that tradeoff: less immediate out-of-the-box value, but a genuinely open-ended ceiling on how specifically it can eventually be shaped to an individual\'s actual workflow, since the extension mechanism has no meaningfully lower ceiling than the editor\'s own built-in capabilities. Whether that tradeoff is worth it depends entirely on whether someone expects to be doing this kind of work, in this kind of tool, for years rather than weeks — the payoff is explicitly a long-run one.'
    }
  ],
  code: {
    title: 'A first look: the help system and a tiny piece of live elisp',
    intro: 'This is a transcript of what you would see in Emacs\'s *scratch* buffer and the help system — try it for real once Emacs is installed (next lesson covers that).',
    code: `;; Press C-h k, then press C-n (Control-n)
;; Emacs shows a *Help* buffer:
C-n runs the command next-line, which is an interactive
built-in function in ‘simple.el’.

It moves point (the cursor) down one line, vertically.

;; Press C-h f, then type: next-line <RET>
;; Same documentation, reached by function name instead of by keystroke —
;; useful once you know a function's NAME but not what it's bound to.

;; In the *scratch* buffer (a real Emacs Lisp REPL you already have open):
(+ 2 2)
;; Place cursor at the end of that line, press C-x C-e (eval-last-sexp):
;; => 4        (the result appears in the minibuffer at the bottom)

(message "Hello from elisp")
;; C-x C-e again:
;; => "Hello from elisp"   (also printed in the minibuffer)

;; This is not a toy — 'message' is the exact same function Emacs's own
;; built-in commands use to report status to you. You just called it
;; directly, the same way any package author would.`,
    notes: [
      'The *scratch* buffer is a genuine Lisp REPL that opens by default — C-x C-e evaluates whatever expression the cursor is at the end of, immediately, live, in your running Emacs session.',
      '"C-h k" then "C-h k" itself (asking what C-h k does) is a perfectly reasonable way to test this out — Emacs\'s help system can describe itself.'
    ]
  },
  lab: {
    title: 'Write the help commands and a tiny elisp expression',
    prompt: 'Write exactly what each task asks for, using standard Emacs notation (C-x means Control+x).',
    starter: `# Task: write the key sequence to find out what a specific keystroke (say, C-n) does


# Task: write the key sequence to look up documentation for a function by NAME (say, next-line)


# Task: write the key sequence to launch the built-in interactive tutorial


# Task: write a *scratch*-buffer elisp expression that adds 10 and 32

`,
    checks: [
      { re: 'C-h\\s+k', flags: 'i', must: true, hint: 'C-h k, then the key you want to ask about.', pass: 'C-h k ✓' },
      { re: 'C-h\\s+f', flags: 'i', must: true, hint: 'C-h f, then the function name.', pass: 'C-h f ✓' },
      { re: 'C-h\\s+t', flags: 'i', must: true, hint: 'C-h t launches the interactive tutorial.', pass: 'C-h t ✓' },
      { re: '\\(\\+\\s*10\\s*32\\)', flags: '', must: true, hint: '(+ 10 32) — Lisp prefix notation: operator first, then arguments.', pass: '(+ 10 32) ✓' }
    ],
    run: 'Try it for real: open Emacs, press C-h k then any key, and read the *Help* buffer that appears.',
    solution: `# Task: write the key sequence to find out what a specific keystroke (say, C-n) does
C-h k, then C-n

# Task: write the key sequence to look up documentation for a function by NAME (say, next-line)
C-h f, then type: next-line

# Task: write the key sequence to launch the built-in interactive tutorial
C-h t

# Task: write a *scratch*-buffer elisp expression that adds 10 and 32
(+ 10 32)`,
    notes: [
      'Lisp notation always puts the operator/function FIRST, inside the parentheses, followed by its arguments — "(+ 10 32)" not "10 + 32" — this shape shows up constantly in later lessons\' elisp examples.',
      'C-h k and C-h f both work on ANYTHING currently loaded, including third-party packages you have installed — not just Emacs\'s own built-ins.'
    ]
  },
  quiz: [
    {
      q: 'What is Emacs, fundamentally, underneath its text-editing features?',
      options: ['A text editor written in C with an optional scripting add-on', 'A Lisp interpreter, with the entire text-editing environment (including built-in commands) written in that same Lisp on top of it', 'A terminal emulator with syntax highlighting', 'A word processor adapted for programmers'],
      correct: 1,
      explain: 'Emacs\'s core is a Lisp (elisp) interpreter — the editing environment, including built-in commands, is itself elisp code running on that interpreter, not a separate compiled layer.'
    },
    {
      q: 'What does "C-h k" followed by a keystroke do?',
      options: ['Deletes that key\'s binding entirely', 'Shows exactly which function that key sequence runs, plus its full documentation', 'Kills (cuts) the current line', 'Opens the interactive tutorial'],
      correct: 1,
      explain: 'C-h k describes a key: it tells you the exact function bound to that keystroke and pulls up that function\'s documentation — reached live from the running code, not a separate manual.'
    },
    {
      q: 'Why is Emacs\'s extensibility described as going "deeper" than a typical plugin system?',
      options: ['Because Emacs has more plugins available than other editors', 'Because a package written in elisp has essentially the same access to Emacs\'s internals as Emacs\'s own built-in code — there is no separate, more limited plugin API', 'Because Emacs plugins are compiled into machine code for speed', 'There is no real difference; this is just a reputation, not a technical fact'],
      correct: 1,
      explain: 'Because the entire editor is elisp, a package is not restricted to a deliberately limited external API — it can use the exact same primitives Emacs\'s own core commands use.'
    },
    {
      q: 'What is the honest tradeoff Emacs makes compared to a modern IDE?',
      options: ['Emacs is strictly better in every way, with no real tradeoff', 'Emacs offers less useful behavior immediately out of the box, in exchange for a much higher ceiling on how deeply it can eventually be customized to one specific person\'s workflow', 'Modern IDEs cannot be customized at all', 'There is no meaningful difference between Emacs and a modern IDE'],
      correct: 1,
      explain: 'Emacs trades immediate, zero-configuration usefulness for a long-run payoff: a config that can be shaped arbitrarily deeply over time, rather than being capped by a plugin marketplace\'s existing offerings.'
    },
    {
      q: 'Why does Emacs\'s help documentation stay accurate even as packages and configurations change over time?',
      options: ['It does not; the documentation is a separately maintained manual that can go stale', 'Because it is read directly from the actual running code\'s documentation strings, not a separate, independently maintained manual', 'Emacs automatically rewrites its own manual every time you install a package', 'Documentation is disabled by default and must be manually enabled'],
      correct: 1,
      explain: 'C-h k/C-h f pull documentation directly from the function\'s own definition in the currently running code — it reflects whatever is actually loaded in your session, not a static external reference.'
    }
  ],
  pitfalls: [
    'Assuming Emacs\'s default keybindings will feel intuitive coming from another editor — they genuinely do not, by design, and fighting that expectation instead of accepting the real learning investment is a common reason people give up early.',
    'Treating extensibility as "Emacs already has a plugin for everything" — the deeper value is that you CAN build what you need yourself using the same primitives as the core, not that someone else has necessarily already built it.',
    'Skipping the built-in help system (C-h k / C-h f) and reaching for a web search first — the built-in help is faster, always accurate to your actual running configuration, and works even without an internet connection.'
  ],
  interview: [
    {
      q: 'Explain, precisely, what "Emacs is a Lisp interpreter with a text editor built on top of it" actually means, and why it matters.',
      a: 'It means Emacs\'s core is a small, fast interpreter for Emacs Lisp (elisp), and the ENTIRE editing environment — buffers, windows, every built-in command — is itself written in that same elisp, running on that interpreter, rather than being a separately compiled application with a limited scripting layer bolted on afterward. It matters because it collapses the usual distinction between "the application\'s own built-in code" and "code a user or plugin author writes" — both are the same language, with the same level of access to the editor\'s internals, which is the direct root cause of both Emacs\'s famous extensibility and its self-documenting nature (help text can be pulled directly from live, running function definitions rather than a separately maintained manual).'
    },
    {
      q: 'How would you explain Emacs\'s self-documenting nature to someone unfamiliar with it, using a concrete example?',
      a: '"Self-documenting" means the software can accurately describe its own current behavior, on demand, because that description is generated directly from the actual running code rather than a separate reference document that could drift out of sync. Concretely: press C-h k, then any keystroke, and Emacs tells you exactly which function that key currently runs and shows that function\'s own documentation string — reflecting whatever is ACTUALLY bound right now, including any customizations you have made, not some generic default behavior a static manual might describe. This is different from most software, where "what does this button do" often requires searching external documentation that may or may not match your actual installed version or configuration.'
    },
    {
      q: 'Why might a professional deliberately invest time learning Emacs today, given how much modern IDEs already offer with zero configuration?',
      a: 'The honest case is a long-run one, not an immediate-productivity one: a modern IDE\'s built-in behavior is fixed by its authors\' assumptions about a general audience, while Emacs\'s extensibility has no meaningfully lower ceiling than its own core functionality, meaning a sufficiently specific, personal workflow need can always be built rather than waited on. Combined with genuinely portable, plain-text configuration (the same init.el following someone across every machine for years, as this course\'s Part 4 covers) and the ability to edit remote files as if local via TRAMP (Part 7), the investment pays off specifically for someone expecting to do serious, sustained technical work over a long career — the tradeoff is real, and it is not obviously the right choice for someone who just needs to edit a file occasionally.'
    },
    {
      q: 'What is the practical difference between Emacs\'s extension model and a typical application\'s plugin API, and why does that difference actually matter for what kinds of workflows are achievable?',
      a: 'A typical plugin API is a deliberately bounded surface the application\'s authors decided to expose — a plugin can do whatever that surface allows, and nothing structurally more, since the plugin mechanism and the application\'s own internals are genuinely separate systems. Emacs\'s elisp-based extension model gives a package essentially the same access as Emacs\'s own built-in code, because there is no structurally separate "plugin layer" at all — it is the same language, the same interpreter, the same data structures. Practically, this means a workflow specific enough that no existing plugin happens to implement it is still achievable directly, by writing the elisp yourself, rather than being capped by whatever the plugin ecosystem has already chosen to build — a genuinely different ceiling on customization than most software offers.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover what Emacs fundamentally is and why that matters. This is what is underneath: the actual C-core-plus-elisp architecture, "everything is a buffer" taken further than it first appears, and a fair note on where the Lisp-all-the-way-down design has real costs.',
    sections: [
      {
        h: 'The real architecture: a small C core, and (nearly) everything else in elisp',
        p: [
          'Emacs is not ENTIRELY elisp — a genuinely small C core provides the performance-critical primitives (the actual text-buffer data structure, low-level I/O, the elisp interpreter/bytecode-runner itself, and — in modern Emacs versions — an optional native-compilation step that turns elisp into real machine code for speed). But the layer built on top of that small C core — nearly everything a user actually interacts with, including most of what LOOKS like "the editor itself" — is elisp, loaded from plain-text .el files at startup, exactly like a user\'s own configuration. The C core is deliberately kept small and stable specifically so that as much behavior as possible can live in the more easily inspected, modified, and redistributed elisp layer instead.'
        ]
      },
      {
        h: '"Everything is a buffer" — further than it first looks',
        p: [
          'The next lesson\'s "buffers, windows, frames" vocabulary introduces buffers as "where your file\'s text lives" — but the idea actually goes further: the minibuffer (where you type commands), the *Help* window from this lesson\'s C-h examples, a `*scratch*` Lisp REPL, even the list of currently-running buffers itself, are ALL buffers, using the exact same underlying data structure and many of the exact same editing commands. Killing and yanking text (a later lesson\'s subject) works identically whether you are editing a source file or typing into the minibuffer, because underneath, there is genuinely no difference in kind — just different CONTENTS and a different major mode attached (also a later lesson\'s subject) governing how that particular buffer behaves.'
        ]
      },
      {
        h: 'A fair cost: Lisp-all-the-way-down is not free',
        p: [
          'This architecture has real, honest costs worth naming rather than glossing over. Because so much of Emacs is interpreted elisp rather than compiled native code, certain operations can genuinely be slower than an equivalent operation in a purpose-built, natively-compiled application — modern Emacs\'s optional native-compilation feature narrows this gap significantly but does not eliminate it entirely. And because extensibility genuinely has almost no ceiling, a heavily customized Emacs configuration accumulated over years can become a genuinely complex, personal system that is harder for someone ELSE to pick up and understand than a more constrained, opinionated tool would be — the same flexibility that makes Emacs deeply personal also means two different users\' configurations can look almost unrecognizably different from each other, which is a real cost when troubleshooting someone else\'s setup or onboarding a new team member into a shared configuration.'
        ]
      }
    ]
  }
};
