window.LESSONS = window.LESSONS || {};
window.LESSONS['shell-and-eshell'] = {
  id: 'shell-and-eshell',
  title: 'Shells Inside Emacs: M-x shell vs M-x eshell',
  category: 'Part 7 — Terminal, Shell, Remote & Capstone',
  timeMin: 30,
  summary: 'Sometimes the fastest move is not to leave Emacs at all. Emacs ships with two genuinely different ways to run shell commands inside a buffer: M-x shell, which hands control to your actual system shell (bash, zsh) running as a real subprocess, and M-x eshell, which is not a wrapper around any external shell at all — it is a shell written entirely in Emacs Lisp, running inside Emacs itself, with no subprocess involved.',
  goals: [
    'Start a real system shell inside an Emacs buffer with M-x shell',
    'Start eshell, Emacs\'s own Lisp-native shell, with M-x eshell',
    'Explain the core architectural difference between the two: subprocess vs no subprocess at all',
    'Use eshell\'s ability to mix shell commands and Emacs Lisp expressions in the same command line',
    'Choose the right one deliberately for a given task, instead of defaulting to whichever is more familiar'
  ],
  concept: [
    {
      h: 'M-x shell: a real subprocess, with an Emacs buffer as the front end',
      p: [
        '<code>M-x shell</code> starts your actual system shell (whatever <code>$SHELL</code> is set to, typically bash or zsh) as a genuine child PROCESS of Emacs, and displays its input and output inside a normal Emacs buffer. Everything about the shell itself is completely real and unchanged: the same builtins, the same PATH, the same aliases and shell functions defined in your actual shell startup files, the exact same behavior it would have running in Terminal.app directly.',
        'What Emacs adds on top is the editing environment: the buffer is a real Emacs buffer, so Emacs Lisp text-manipulation commands, isearch, and the kill ring all work directly on the shell\'s scrollback exactly as they would on any other buffer of text. It is genuinely just your real shell, wrapped in Emacs\'s buffer machinery — not a reimplementation of anything.'
      ]
    },
    {
      h: 'M-x eshell: a shell with no subprocess at all',
      p: [
        '<code>M-x eshell</code> is architecturally a completely different thing: it is a shell whose IMPLEMENTATION is Emacs Lisp, running directly inside the Emacs process itself, with no external shell binary invoked at all for its own builtins. Commands like <code>cd</code>, <code>ls</code>, <code>pwd</code>, and <code>rm</code> are actual Emacs Lisp functions eshell provides, executing directly inside Emacs\'s own process — not sent out to <code>/bin/ls</code> or any other external binary.',
        'This has a genuinely useful, non-obvious consequence: because eshell is just Lisp running inside Emacs, it can trivially mix real shell-style commands with actual Emacs Lisp expressions on the very same command line, and it works identically on any platform Emacs runs on (including Windows, where a real POSIX shell may not even be present) — because it never actually depends on an external shell existing at all.'
      ]
    },
    {
      h: 'When each one is actually the right choice',
      p: [
        'M-x shell is the right choice whenever you specifically need the REAL shell\'s exact behavior — running a genuinely complex script that depends on real bash/zsh-specific syntax, using an interactive tool that expects a real terminal environment (though even this has real limits, covered in pitfalls), or simply wanting your actual, already-configured shell environment with all its aliases and functions present exactly as-is.',
        'M-x eshell is the right choice for quick, everyday file and directory operations mixed WITH Emacs itself — navigating directories, glancing at file contents, and especially anything that benefits from directly calling an Emacs Lisp function mid-command, since eshell has direct, zero-overhead access to the entire running Emacs environment (open buffers, loaded packages, arbitrary Lisp functions) in a way a real subprocess-based shell structurally cannot.'
      ]
    },
    {
      h: 'Mixing Lisp and shell syntax in eshell',
      p: [
        'Because eshell commands are Lisp underneath, a command line like <code>(+ 2 2)</code> genuinely evaluates as Emacs Lisp and prints <code>4</code> — no special mode switch required, just parentheses, exactly like anywhere else in Emacs. More practically useful: eshell command arguments can be actual Lisp expressions, so something like <code>echo (current-time-string)</code> calls the real Emacs Lisp function <code>current-time-string</code> directly and passes its result as an argument to <code>echo</code> — a real subprocess-based shell has no equivalent to this, since it has no access to Emacs\'s internal Lisp functions at all.',
        'This same property lets eshell directly manipulate Emacs itself from the command line — switching buffers, finding files, or calling any interactive command by name — because there genuinely is no boundary between "the shell" and "Emacs" the way there is a real, hard boundary between a subprocess-based shell and the Emacs process that launched it.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Real Harbor Office vs the Ship\'s Own Built-In Quartermaster',
      text: 'When the crew needs supplies handled on a specific island, there are genuinely two different options available, and they work in fundamentally different ways. The first is walking to the island\'s actual harbor office and dealing directly with the real harbor staff — real people, following the real, already-established local rules and procedures of that specific harbor, completely unchanged by the fact that a pirate crew happens to be the one making the request. The second is simply asking the ship\'s own quartermaster, who never leaves the ship at all, and who can often handle the exact same request without a trip to the harbor being necessary — except the quartermaster is not a local harbor employee following that island\'s specific rules; the quartermaster is a permanent member of the crew, and can therefore do things the harbor office structurally cannot, like directly consulting the ship\'s own manifest, or instantly checking in with any other crew member, mid-request, without leaving the deck at all. Nami explains the actual tradeoff to a new crew member who keeps defaulting to the harbor office out of habit: "If you genuinely need something only the real harbor can do — something specific to THIS island\'s actual rules — go to the real office, obviously. But for anything that touches the ship itself, the quartermaster is not just a shortcut. The quartermaster can do things the harbor office literally cannot, because the quartermaster is one of us."'
    },
    sitcom: {
      show: 'Friends',
      title: 'Calling the Actual Building Super vs Asking Chandler, Who Lives There',
      text: 'When something needs handling in the apartment building, Monica has genuinely two different options, and they are not interchangeable. The first is calling the actual building superintendent — a real employee of the building, following the real, already-established rules and procedures of that specific building, completely unchanged by which tenant happens to be calling. The second is just asking Chandler, who does not work for the building at all, but who lives there permanently, and who can often handle the exact same request without the super being involved — except Chandler is not a building employee following the building\'s official rules; Chandler is a resident, and can therefore do things the super structurally cannot, like walking directly into Joey\'s apartment across the hall to borrow something, mid-task, without any of it going through the building\'s official channels at all. Ross points out the actual tradeoff to Rachel, who keeps calling the super for things Chandler could clearly just do: "If you genuinely need something only the real super can do — something specific to the building\'s actual systems, the boiler, the wiring — call the real super, obviously. But for anything that touches the building socially, Chandler is not just a shortcut. Chandler can do things the super literally cannot, because Chandler actually lives here."'
    },
    why: 'The real harbor office and the real building super are M-x shell — a genuine, external system doing exactly what it always does, unchanged, with its own real rules. The ship\'s quartermaster and Chandler, both permanent members of their respective communities rather than outside staff, are eshell — able to directly reach into the surrounding system (the ship, the building\'s residents) in ways an outside process structurally cannot, precisely because they are not external at all.'
  },
  tech: [
    {
      q: 'What is the single most important architectural difference between M-x shell and M-x eshell, and what does it actually enable or prevent?',
      a: 'M-x shell runs your real system shell as a genuine external subprocess of Emacs — the shell itself is completely unaware that Emacs exists, and communication happens purely through the subprocess\'s normal stdin/stdout, exactly as it would if that same shell were running in any other terminal. M-x eshell has no subprocess at all for its own builtins — it is Emacs Lisp code running directly inside the same Emacs process, which means it has direct, in-process access to everything Emacs itself has access to: open buffers, loaded Lisp functions, running Emacs state. This is what enables eshell to do things like directly call arbitrary Emacs Lisp functions as part of a command line — a real subprocess-based shell has no mechanism to reach into Emacs\'s internals, because it is architecturally a completely separate process with no special access at all.'
    },
    {
      q: 'Why can eshell run on Windows without a real POSIX shell installed, while M-x shell generally cannot provide a full POSIX experience there?',
      a: 'M-x shell fundamentally depends on launching a REAL external shell binary as a subprocess — on Windows, without something like WSL or a separately installed POSIX shell present, there is no real bash/zsh binary for M-x shell to actually launch, so it falls back to whatever shell-like program Windows does provide (historically cmd.exe), which behaves quite differently from a real POSIX shell. eshell has no such dependency at all — its builtins are Emacs Lisp functions that Emacs itself provides directly, on every platform Emacs runs on, so a reasonably POSIX-like command experience (cd, ls, cat, and so on, all reimplemented in Lisp) is available even on a system with no real POSIX shell installed anywhere.'
    },
    {
      q: 'Give a concrete example of something eshell can do that M-x shell structurally cannot, and explain precisely why.',
      a: 'In eshell, a command like "echo (current-time-string)" calls the real Emacs Lisp function current-time-string DIRECTLY, in-process, and uses its actual return value as an argument to echo — no external program is invoked to get that value. M-x shell cannot do the equivalent, because the real subprocess-based shell it launches has genuinely no access to Emacs\'s internal Lisp functions at all — it is a fully separate process, and the only way information crosses that process boundary is through the shell\'s completely normal stdin/stdout, the same as it would for any terminal emulator. Reaching into "the currently running Emacs Lisp environment" from inside a subprocess-based shell is not a missing feature to be added later — it is structurally impossible given that architecture, whereas it is eshell\'s default, unremarkable behavior given ITS architecture.'
    }
  ],
  code: {
    title: 'Starting each shell and mixing Lisp into an eshell command',
    intro: 'Try both. The difference is much clearer in practice than in description.',
    code: `M-x shell <RET>
;; Starts your real system shell ($SHELL — bash, zsh, etc.) as a genuine
;; subprocess, in a new buffer. Behaves exactly like your normal terminal:
;; same aliases, same PATH, same shell functions from your real startup files.

M-x eshell <RET>
;; Starts Emacs's own Lisp-native shell. No external shell binary involved
;; for its builtins at all.

;; Inside eshell, ordinary-looking commands work as expected:
cd ~/projects
ls
pwd

;; But eshell command lines can also contain real Emacs Lisp, in parens:
echo (+ 2 2)
;; -> 4   (this genuinely evaluated as Emacs Lisp, not shell arithmetic)

echo (current-time-string)
;; -> calls the real Emacs Lisp function directly, in-process,
;;    and prints whatever it returns.

;; A real subprocess-based M-x shell has no equivalent to the line above —
;; it cannot reach into Emacs's own Lisp functions at all, because it is
;; a genuinely separate, external process.`,
    notes: [
      'Multiple shell or eshell buffers can run at once — M-x shell and M-x eshell each create a new one if the default-named buffer already exists and you use a prefix argument, or you can rename an existing shell buffer to keep it around while starting a fresh one.',
      'eshell keeps its own command history and completion, independent of your real shell\'s history file, since it never actually touches your real shell at all.'
    ]
  },
  lab: {
    title: 'Pick the right shell and the right command for the task',
    prompt: 'Fill in each blank with the correct command.',
    starter: `# Task: start a genuine subprocess running your real system shell


# Task: start Emacs's own Lisp-native shell (no subprocess involved)


# Inside eshell, write a command line that calls the real Emacs Lisp
# function (buffer-name) and echoes its result:


# Q: In one or two sentences, explain why the command above cannot be
# reproduced inside a real M-x shell subprocess.

`,
    checks: [
      { re: 'M-x\\s+shell', flags: 'i', must: true, hint: 'M-x shell starts a genuine subprocess running your real system shell.', pass: 'M-x shell ✓' },
      { re: 'M-x\\s+eshell', flags: 'i', must: true, hint: 'M-x eshell starts Emacs\'s own Lisp-native shell.', pass: 'M-x eshell ✓' },
      { re: 'echo\\s*\\(buffer-name\\)', flags: 'i', must: true, hint: 'eshell can call real Emacs Lisp functions directly inside parens, e.g. echo (buffer-name).', pass: 'Lisp-in-eshell command ✓' },
      { re: 'subprocess|process|separate|external', flags: 'i', must: true, hint: 'A real subprocess-based shell has no access to Emacs\'s internal Lisp functions because it is a genuinely separate process.', pass: 'Explained the subprocess boundary ✓' }
    ],
    run: 'Try it for real: M-x eshell, then type echo (current-time-string) and watch it call real Emacs Lisp directly.',
    solution: `# Task: start a genuine subprocess running your real system shell
M-x shell

# Task: start Emacs's own Lisp-native shell (no subprocess involved)
M-x eshell

# Inside eshell, write a command line that calls the real Emacs Lisp
# function (buffer-name) and echoes its result:
echo (buffer-name)

# Q: In one or two sentences, explain why the command above cannot be
# reproduced inside a real M-x shell subprocess.
# A real subprocess-based shell is a genuinely separate external process with
# no access to Emacs's internal Lisp functions at all; eshell has no
# subprocess boundary to cross because it runs directly inside Emacs itself.`,
    notes: [
      'There is no single "always correct" choice between shell and eshell — the right one depends entirely on whether the task needs the real external shell\'s exact behavior, or benefits from eshell\'s direct access to Emacs itself.',
      'Both buffers behave like normal Emacs buffers for editing and searching scrollback, regardless of which one you pick.'
    ]
  },
  quiz: [
    {
      q: 'What does M-x shell actually start?',
      options: ['A reimplementation of a shell in Emacs Lisp', 'A genuine external subprocess running your real system shell ($SHELL)', 'A remote SSH connection', 'A read-only view of your shell history'],
      correct: 1,
      explain: 'M-x shell launches your actual system shell (bash, zsh, etc.) as a real child process, displayed inside an Emacs buffer.'
    },
    {
      q: 'What is eshell, architecturally?',
      options: ['A faster reimplementation of bash written in C', 'A shell implemented entirely in Emacs Lisp, running inside the Emacs process with no subprocess involved', 'A remote terminal emulator', 'A wrapper that always launches zsh specifically'],
      correct: 1,
      explain: 'eshell\'s builtins are Emacs Lisp functions running directly inside Emacs — there is no external shell binary invoked for eshell\'s own commands.'
    },
    {
      q: 'Why can an eshell command line contain real Emacs Lisp expressions in parentheses, like (+ 2 2)?',
      options: ['It is a special quirky syntax with no real meaning', 'Because eshell runs inside the same process as Emacs, so parenthesized expressions are genuinely evaluated as Emacs Lisp', 'It only works if a special package is installed', 'M-x shell supports the exact same syntax'],
      correct: 1,
      explain: 'eshell has no process boundary separating it from Emacs — a parenthesized expression on its command line is real Emacs Lisp, evaluated directly.'
    },
    {
      q: 'Why does eshell work reasonably well on Windows, where a real POSIX shell may not be installed?',
      options: ['Emacs automatically installs bash on Windows', 'eshell\'s builtins are Emacs Lisp functions Emacs itself provides on every platform, with no dependency on an external shell binary', 'eshell refuses to run on Windows at all', 'Windows ships with eshell pre-installed outside of Emacs'],
      correct: 1,
      explain: 'Because eshell never launches an external shell binary for its own builtins, it works the same way on any platform Emacs runs on, POSIX shell or not.'
    },
    {
      q: 'When is M-x shell the clearly better choice over eshell?',
      options: ['Never — eshell is strictly better in every case', 'When a task genuinely needs the real external shell\'s exact behavior, aliases, functions, or environment', 'Only when working with Emacs Lisp code specifically', 'Only on Windows'],
      correct: 1,
      explain: 'M-x shell is the right tool whenever you need your actual, already-configured system shell\'s real, unmodified behavior.'
    }
  ],
  pitfalls: [
    'Expecting eshell to behave identically to a real bash/zsh in every respect — its builtins are Lisp reimplementations, and some real-shell-specific syntax or behavior genuinely does not carry over.',
    'Running a genuinely interactive, full-screen terminal program (like a text-based editor or a program expecting a real terminal) inside M-x shell or eshell and being confused when it misbehaves — neither one is a full terminal emulator by default; a separate package (like vterm) is generally needed for that.',
    'Forgetting that eshell keeps its own separate command history, independent of your real shell\'s history file, since it never actually touches your real shell at all.'
  ],
  interview: [
    {
      q: 'Explain the core architectural difference between M-x shell and M-x eshell, precisely.',
      a: 'M-x shell launches your real system shell as a genuine external subprocess of Emacs — a fully separate process, communicating with Emacs purely through normal stdin/stdout, completely unaware that Emacs exists at all beyond that. M-x eshell has no subprocess for its own builtins — it is a shell whose implementation IS Emacs Lisp, executing directly inside the same running Emacs process, with direct, in-process access to everything else Emacs has access to: open buffers, loaded functions, running state. The difference is not merely stylistic; it determines what each one can structurally do — eshell can reach directly into Emacs\'s own Lisp environment mid-command, and M-x shell fundamentally cannot, because it is a genuinely separate process with no special access.'
    },
    {
      q: 'A colleague says "eshell is basically just a slower version of a real shell" — how would you correct that framing?',
      a: 'That framing misses the actual point of eshell\'s design. eshell is not attempting to be a faster or slower REIMPLEMENTATION of the same thing a real shell does — it is a genuinely different tool with a genuinely different capability: direct, in-process access to Emacs itself, since it runs inside the same process rather than as an external subprocess. A real shell, however fast, structurally cannot call an arbitrary Emacs Lisp function mid-command, or reach into currently open buffers, because it is a separate process with no access to Emacs\'s internals at all. Speed is not really the axis eshell is optimizing for or against; the axis is "does this task benefit from direct access to the running Emacs environment," and that is a capability a real, however-fast external shell cannot provide by design.'
    },
    {
      q: 'Why might eshell be a genuinely better default for lightweight, everyday file navigation than M-x shell, even for someone who is comfortable in a real terminal?',
      a: 'For simple, everyday operations — moving between directories, listing files, glancing at contents — eshell provides all of that with the added benefit of zero-overhead access to the rest of Emacs: switching directly to an open buffer, calling an arbitrary Lisp function to inspect state, or navigating using Emacs\'s own completion machinery, all without ever leaving eshell or invoking any external process. M-x shell provides none of that extra access, since it is fundamentally just displaying a separate, external process\'s output — for tasks that do not specifically need the real shell\'s exact behavior, eshell\'s tighter integration with the rest of Emacs is a genuine, practical advantage, not merely a stylistic preference.'
    },
    {
      q: 'What is a concrete scenario where M-x shell is clearly the correct choice over eshell, and why does eshell genuinely fall short there?',
      a: 'Running a real, moderately complex shell script that depends on specific bash or zsh syntax, or that expects your actual, fully-configured shell environment — real aliases, real shell functions defined in .bashrc/.zshrc, the genuine PATH exactly as your real shell resolves it — is a case where M-x shell is clearly correct, because it IS that real shell, unmodified. eshell falls short there specifically because its builtins are Lisp reimplementations of common commands, not the genuine external programs or the real shell\'s own syntax and startup-file behavior — anything depending on real-shell-specific quirks or an already-configured real shell environment needs the real thing, which only M-x shell actually provides.'
    }
  ]
};
