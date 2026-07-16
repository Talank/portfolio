window.LESSONS = window.LESSONS || {};
window.LESSONS['starting-emacs-on-mac'] = {
  id: 'starting-emacs-on-mac',
  title: 'Installing & Starting Emacs on a Mac: Terminal vs GUI',
  category: 'Part 0 — Orientation & Starting Emacs',
  timeMin: 30,
  summary: 'Before any real editing lesson, three practical Mac-specific decisions need making: which Emacs to actually install (the one that ships with macOS is genuinely too old to use), whether to run it inside a terminal or as its own GUI application (a decision that directly affects the keybinding lessons right after this one), and how to start it fast enough that you actually want to reach for it throughout the day.',
  goals: [
    'Explain why the pre-installed /usr/bin/emacs on macOS should not be used, and install a modern version via Homebrew',
    'Explain the practical difference between running Emacs inside a terminal and running the standalone GUI app (Emacs.app)',
    'Launch Emacs, open a file, and quit cleanly with C-x C-c',
    'Use C-g to cancel out of anything that feels stuck',
    'Start Emacs in daemon/client mode for near-instant startup on repeated launches'
  ],
  concept: [
    {
      h: 'Do not use the Emacs that came with macOS',
      p: [
        'Every Mac ships with an <code>emacs</code> binary already present at <code>/usr/bin/emacs</code> — and it is worth knowing about specifically so you can avoid it. Apple stopped updating the bundled version years ago for licensing reasons (Emacs is GPL-licensed, and Apple\'s toolchain policies do not play well with GPL updates), leaving most Macs with something like Emacs 22, missing decades of features covered later in this course — including things as fundamental as good built-in package management.',
        'The fix is a single command: <code>brew install emacs</code> (a terminal-only build) or <code>brew install --cask emacs</code> (the full GUI application, installed to <code>/Applications</code>) via Homebrew, macOS\'s de facto package manager. Either gets you a genuinely current version (29 or later as of this writing) with native compilation, a built-in LSP client, and tree-sitter support — all covered in Part 6. This lesson assumes you have run one of these before continuing.'
      ]
    },
    {
      h: 'Terminal Emacs vs GUI Emacs: the same program, two different keyboard realities',
      p: [
        'You can run Emacs two genuinely different ways on a Mac, and it matters which one you pick before diving into keybindings. Typing <code>emacs</code> inside a terminal (Terminal.app, iTerm2, or any other terminal emulator) runs Emacs AS A TERMINAL PROGRAM — meaning it only ever sees whatever key events the terminal emulator itself decides to forward to it, filtered through that terminal\'s own settings. Launching Emacs.app (the GUI cask install) instead runs it as a genuine, standalone macOS application, with its own windows, its own menu bar, and — critically — direct access to the FULL set of modifier keys macOS itself provides, unfiltered by any terminal emulator sitting in between.',
        'This distinction is not academic — it is the exact reason Part 1 of this course needs its own dedicated Parts for terminal versus GUI configuration. A terminal emulator cannot always cleanly distinguish certain key combinations (some Option-key combinations are a notorious example, since macOS itself uses Option for typing accented characters), while GUI Emacs can. Knowing which one you are actually running, right now, is the first fact you need before any of the Mac modifier-key fixes in the next Part make sense.'
      ]
    },
    {
      h: 'First launch: the tutorial, and never feeling trapped',
      p: [
        'Launch Emacs (<code>emacs</code> in a terminal, or open Emacs.app from Applications/Spotlight), and the very first thing worth doing — before opening any real file — is the built-in tutorial from the last lesson: <code>C-h t</code>. It walks through the fundamental motions hands-on, in a genuinely disposable practice buffer.',
        'Two keys matter more than any others for a beginner\'s sense of not being trapped: <code>C-g</code> cancels essentially ANYTHING currently in progress — a half-typed command, an unwanted prompt, a command that started running something you did not intend — the universal "get me out of this" key, safe to press liberally and often. <code>C-x C-c</code> quits Emacs entirely, prompting you to save any unsaved buffers first rather than silently discarding work. Between these two, you are never genuinely stuck: C-g escapes whatever is happening right now, C-x C-c exits the whole program cleanly when you are done.'
      ]
    },
    {
      h: 'Starting fast, every time: daemon and client mode',
      p: [
        'A fully-loaded personal Emacs configuration (Part 4\'s subject) can take a genuinely noticeable moment to start — every time you launch it, Emacs has to re-read and re-evaluate your entire init file from scratch. <b>Daemon mode</b> solves this by separating "start Emacs and load everything" from "open a window" into two independent steps: <code>emacs --daemon</code> starts Emacs ONCE, fully loaded, running invisibly in the background, persisting even after you close every visible window.',
        '<code>emacsclient -c</code> then opens a new window CONNECTED to that already-running, already-loaded daemon — appearing almost instantly, since none of the actual startup cost (loading your config, initializing packages) needs to happen again. Close that window and the daemon keeps running underneath, ready for the next <code>emacsclient -c</code> to open another window just as fast. This is a genuinely practical daily-use tip once your configuration grows past a trivial size — the difference between Emacs feeling instant to reach for versus feeling like a small tax every time you want to open one file.'
      ]
    }
  ],
  conceptFlow: {
    title: 'Cold start vs daemon/client — where the startup time actually goes',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Cold start (plain "emacs")',
        nodes: [
          { id: 'cold', text: 'Run "emacs"\nfrom scratch, every time' },
          { id: 'coldload', text: 'Load and evaluate\nthe ENTIRE init.el, every launch' },
          { id: 'coldwindow', text: 'THEN a window\nfinally appears' }
        ]
      },
      {
        label: 'Daemon/client',
        nodes: [
          { id: 'daemononce', text: 'emacs --daemon\n(run ONCE)' },
          { id: 'daemonload', text: 'Load and evaluate\ninit.el ONCE, stays in memory' },
          { id: 'clientfast', text: 'emacsclient -c\nconnects to what is already loaded' },
          { id: 'clientwindow', text: 'Window appears\nnearly instantly' }
        ]
      }
    ],
    steps: [
      { active: ['cold'], note: 'Plain "emacs" bundles two genuinely separate things into one command: starting the whole program AND opening a window.' },
      { active: ['coldload'], note: 'Every single time, it has to load and evaluate your entire configuration from scratch — this is where most of the noticeable startup delay actually comes from, not from Emacs itself being slow.' },
      { active: ['coldwindow'], note: 'Only after all of that finishes does a window actually appear — you pay this full cost on every single launch, even to just glance at one file.' },
      { active: ['daemononce'], note: 'The daemon approach separates these two steps. "emacs --daemon" is run once — often just once per login session, or even auto-started at boot.' },
      { active: ['daemonload'], note: 'The full configuration loads exactly once, and then stays resident in memory as long as the daemon keeps running — the expensive part happens a single time, not per-window.' },
      { active: ['clientfast'], note: '"emacsclient -c" asks the ALREADY-RUNNING daemon to open a new window — it is not starting Emacs over again, just connecting to what is already loaded and ready.' },
      { active: ['clientwindow'], note: 'Because none of the loading work needs to happen again, the window appears close to instantly — this is the entire practical benefit of daemon/client mode.' }
    ]
  },
  story: {
    onePiece: {
      title: 'The Old Emergency Dinghy vs. the Sunny — and the Boat Already Lowered at the Dock',
      text: 'Every proper ship comes stocked with some kind of ancient emergency dinghy, tucked away and technically still floating, and the Sunny is no exception — a small, barely-maintained backup boat that came with the vessel and has not been meaningfully updated or cared for since. It works, in the loosest sense. Nobody competent actually chooses to sail anywhere serious in it when the genuinely capable option — the Sunny itself, actively maintained, genuinely equipped for real voyages — sits right there instead. Franky is characteristically blunt about it: "That old dinghy will float, technically. It will not get you anywhere you actually need to go." Separately, Franky maintains a completely different piece of practical wisdom that has nothing to do with WHICH boat and everything to do with HOW you launch one: whenever the crew is likely to need a small boat repeatedly throughout a busy day at port — quick trips to shore and back, again and again — he does not rebuild and relaunch a fresh rowboat from scratch every single time. He keeps ONE already lowered into the water, tied and ready at the dock, the moment the day\'s first trip is anticipated. Every subsequent trip that day, the crew just steps into the ALREADY-WAITING boat and goes — no re-launching, no re-checking, no rebuilding, just immediate use of something that already did its setup work once, hours ago. Building a fresh boat from scratch for every single short trip would technically work. It would also make everyone quietly dread the tenth trip of the day, purely from the repeated setup cost alone.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Backup Stove vs. the Real Range — and the Ovens She Never Lets Go Cold',
      text: 'Monica\'s restaurant kitchen has, tucked in a back corner, an old backup stove that came with the building — technically functional, deeply outdated, and something no competent cook would actually choose to work on during real service when the kitchen\'s genuinely modern range sits fifteen feet away. It heats food, in the loosest possible sense. Monica\'s standing rule for any new hire who wanders toward it out of unfamiliarity: "That one still turns on. That does not mean anyone should be cooking on it." Separately, and for an entirely different reason, Monica has a hard rule about the REAL ovens during a busy dinner service: they never go fully cold between orders. Bringing a cold oven back up to proper temperature from scratch takes real, meaningful time — time a busy kitchen genuinely cannot afford to pay on every single ticket. So the ovens stay pre-heated and ready THE ENTIRE SHIFT, the real setup cost paid once at the start of service rather than separately, repeatedly, for every single dish that comes through. A new server, watching how fast dishes come out one after another, assumes each one is being cooked from a cold start each time — Monica corrects her immediately: "The oven has been ready and waiting this whole time. That is the entire reason it looks instant."'
    },
    why: 'The old dinghy and Monica\'s ancient backup stove are the pre-installed macOS emacs — technically works, genuinely not what you should actually use. And the boat kept ready at the dock, the ovens never allowed to go cold, are exactly daemon/client mode: pay the real startup cost ONCE, then every subsequent use is close to instant, instead of repeating that full cost from scratch every single time.'
  },
  tech: [
    {
      q: 'Why specifically does Apple ship such an old version of Emacs with macOS, rather than keeping it current like most other pre-installed tools?',
      a: 'Emacs is licensed under the GPL (GNU General Public License), and — for reasons rooted in Apple\'s broader legal/licensing policies around GPL-licensed software in their toolchain — Apple stopped updating their bundled Emacs (and several other GNU tools) at the last version released under an earlier, more permissive GPL variant, rather than shipping newer versions released under GPLv3. This is specifically a licensing decision, not a technical limitation or a sign Emacs itself has stagnated — Emacs upstream has continued active development for years past whatever version macOS happens to still bundle, which is exactly why installing a current version via Homebrew (unaffected by Apple\'s own bundling policy) is the standard, necessary first move.'
    },
    {
      q: 'Mechanically, why can a terminal emulator sometimes fail to distinguish certain key combinations that GUI Emacs handles cleanly?',
      a: 'A terminal emulator (Terminal.app, iTerm2) communicates with the program running inside it (Emacs, in this case) through a genuinely old, constrained communication channel originally designed around physical hardware terminals — it has to encode every keypress as a stream of characters, and some modifier-key combinations simply do not have a clean, unambiguous character encoding in that scheme, forcing the terminal to make a choice about how (or whether) to represent them at all. GUI Emacs, running as a normal macOS application, instead receives key events directly from macOS\'s own windowing system, with full, unambiguous access to every modifier key macOS itself distinguishes — no intermediate encoding step, and no terminal emulator\'s own settings involved at all. This is exactly why some of Part 1\'s Mac keybinding fixes apply specifically to terminal Emacs and are unnecessary (or configured differently) in GUI Emacs.'
    },
    {
      q: 'What is actually happening in memory that makes emacsclient connect so much faster than a fresh "emacs" launch?',
      a: 'A fresh "emacs" launch has to read your init.el (and any files it in turn loads — packages, custom configuration) from disk, PARSE that elisp code, and EVALUATE it — running every top-level expression in order, which is genuinely where nearly all of a heavily-configured Emacs\'s startup time goes, not from Emacs\'s own baseline startup being slow. "emacs --daemon" pays that exact cost once, and then keeps the resulting fully-initialized Lisp environment resident in memory, alive, for as long as the daemon process keeps running. "emacsclient -c" does not trigger any of that loading again — it simply opens a new WINDOW (a "frame," in Emacs\'s own terminology, covered next lesson) connected to that already-warm, already-loaded environment, which is why it can appear almost instantly regardless of how large your configuration has grown.'
    }
  ],
  code: {
    title: 'Installing, launching, and daemon/client mode',
    intro: 'Try this in your own Terminal — none of it is destructive.',
    code: `$ /usr/bin/emacs --version
GNU Emacs 22.1.1
# The pre-installed version — genuinely too old for this course's later lessons.

$ brew install emacs
# Installs a modern terminal-capable Emacs via Homebrew.

$ brew install --cask emacs
# Installs the full GUI application (Emacs.app) into /Applications.

$ emacs --version
GNU Emacs 29.4
# Confirm the Homebrew version is now what "emacs" actually resolves to.

$ emacs
# Launches Emacs in your terminal. Once inside:
#   C-h t     — open the interactive tutorial
#   C-g       — cancel whatever is currently happening
#   C-x C-f   — open (find) a file
#   C-x C-s   — save the current buffer
#   C-x C-c   — quit Emacs (prompts to save first if needed)

$ emacs --daemon
Starting Emacs daemon.

$ emacsclient -c
# Opens a new GUI frame connected to the already-running daemon — fast.

$ emacsclient -c
# Open ANOTHER frame — same daemon, same speed, no reloading.

$ emacsclient -e '(kill-emacs)'
# Cleanly stops the daemon itself when you're genuinely done for the day.`,
    notes: [
      '"emacs -nw" forces Emacs to run in "no window" (terminal) mode even from a context that might otherwise try to open a GUI frame — occasionally useful over SSH, tying directly into the linux_course\'s SSH lesson.',
      'The very first "emacsclient -c" against a daemon that has not started yet will fail with a connection error — the daemon has to already be running for a client to connect to it.'
    ]
  },
  lab: {
    title: 'Write the install, launch, and daemon/client commands',
    prompt: 'Write exactly one command per task below.',
    starter: `# Task: install the full GUI Emacs application via Homebrew


# Task: check which version of emacs is currently resolved on your PATH


# Task: start Emacs as a background daemon


# Task: open a new window connected to that already-running daemon

`,
    checks: [
      { re: 'brew\\s+install\\s+--cask\\s+emacs', flags: 'i', must: true, hint: 'brew install --cask emacs', pass: 'brew install --cask emacs ✓' },
      { re: 'emacs\\s+--version', flags: 'i', must: true, hint: 'emacs --version', pass: 'emacs --version ✓' },
      { re: 'emacs\\s+--daemon', flags: 'i', must: true, hint: 'emacs --daemon', pass: 'emacs --daemon ✓' },
      { re: 'emacsclient\\s+-c', flags: 'i', must: true, hint: 'emacsclient -c', pass: 'emacsclient -c ✓' }
    ],
    run: 'Try it for real: brew install --cask emacs, then emacs --daemon, then emacsclient -c twice to see the second window open noticeably faster than the first.',
    solution: `# Task: install the full GUI Emacs application via Homebrew
brew install --cask emacs

# Task: check which version of emacs is currently resolved on your PATH
emacs --version

# Task: start Emacs as a background daemon
emacs --daemon

# Task: open a new window connected to that already-running daemon
emacsclient -c`,
    notes: [
      '"brew install emacs" (without --cask) installs a terminal-only build — reasonable if you plan to always run Emacs inside a terminal, but the GUI cask is generally the more flexible default for a beginner still deciding.',
      'If "emacsclient -c" fails with a connection error, the daemon likely is not running yet — "emacs --daemon" needs to succeed first.'
    ]
  },
  quiz: [
    {
      q: 'Why should the Emacs pre-installed at /usr/bin/emacs on macOS generally not be used?',
      options: ['It does not actually work at all', 'It is a genuinely old version (licensing-related), missing many features this course covers', 'It only works for reading files, not editing them', 'macOS actively blocks it from running'],
      correct: 1,
      explain: 'Apple stopped updating the bundled Emacs years ago for GPL-licensing reasons, leaving most Macs with a version missing decades of subsequent features — installing a current version via Homebrew is the standard fix.'
    },
    {
      q: 'What is the practical difference between running "emacs" in a terminal versus opening Emacs.app?',
      options: ['They are functionally identical in every respect', 'Terminal Emacs only receives whatever key events the terminal emulator forwards to it; GUI Emacs receives key events directly from macOS with full modifier-key access', 'Emacs.app cannot edit files, only terminal Emacs can', 'Terminal Emacs is always faster than the GUI version'],
      correct: 1,
      explain: 'Terminal Emacs is filtered through the terminal emulator\'s own key-handling; GUI Emacs talks directly to macOS\'s windowing system, with full access to every modifier key — a real difference relevant to Part 1\'s keybinding fixes.'
    },
    {
      q: 'What does C-g do?',
      options: ['Saves the current file', 'Cancels/aborts whatever is currently in progress — the universal "get out of this" key', 'Quits Emacs entirely', 'Opens the built-in tutorial'],
      correct: 1,
      explain: 'C-g is the universal cancel key — safe to press whenever something feels stuck or unintended, escaping the current in-progress command or prompt without quitting Emacs itself.'
    },
    {
      q: 'What does "emacs --daemon" followed by "emacsclient -c" accomplish that a plain "emacs" launch does not?',
      options: ['It opens Emacs in a special read-only mode', 'It separates loading the full configuration (paid once) from opening a window (fast, every time after), avoiding repeated startup cost', 'It disables all keybindings for safety', 'There is no real difference; it is purely a stylistic preference'],
      correct: 1,
      explain: 'The daemon loads the configuration once and stays resident in memory; emacsclient -c then opens new windows connected to that already-loaded environment, avoiding the full startup cost on every single launch.'
    },
    {
      q: 'What does C-x C-c do?',
      options: ['Copies the current selection', 'Cancels the current command without quitting', 'Quits Emacs, prompting to save any unsaved buffers first', 'Closes the current window but keeps Emacs running'],
      correct: 2,
      explain: 'C-x C-c quits Emacs entirely — it checks for unsaved buffers and prompts before discarding any unsaved work, rather than exiting silently.'
    }
  ],
  pitfalls: [
    'Using the pre-installed /usr/bin/emacs without realizing how old it is, then being confused when this course\'s later features (built-in LSP, tree-sitter, modern package management) do not seem to exist.',
    'Not knowing whether you are currently running terminal Emacs or GUI Emacs, then being confused when a Part 1 keybinding fix intended for one does not apply to the other.',
    'Cold-starting a heavily-configured Emacs from scratch dozens of times a day instead of using daemon/client mode, paying the full startup cost repeatedly for no reason.'
  ],
  interview: [
    {
      q: 'Why does macOS ship such an outdated version of Emacs, and what is the correct fix?',
      a: 'Emacs is GPL-licensed, and Apple\'s broader legal policy around GPL-licensed tools in their own toolchain led them to stop updating their bundled Emacs (and several other GNU tools) years ago, freezing it at an old version rather than adopting newer GPLv3-licensed releases. This is a licensing decision, not evidence Emacs itself has stagnated — active upstream development has continued for years past whatever version ships with macOS. The fix is installing a current version via Homebrew (brew install emacs for a terminal build, or brew install --cask emacs for the full GUI application), entirely unaffected by Apple\'s own bundling policy.'
    },
    {
      q: 'Explain the mechanical difference between terminal Emacs and GUI Emacs regarding how they receive keyboard input, and why that matters practically.',
      a: 'Terminal Emacs runs as a program INSIDE a terminal emulator (Terminal.app, iTerm2), and only ever receives whatever key events that terminal emulator itself decides to forward — encoded through a genuinely old character-stream protocol that cannot always cleanly represent every modifier-key combination a modern keyboard can produce. GUI Emacs runs as a standalone macOS application, receiving key events directly from macOS\'s own windowing system, with full, unambiguous access to every modifier key macOS distinguishes. It matters practically because certain keybinding fixes (particularly around the Option key, covered in Part 1) apply differently, or are configured through different settings entirely, depending on which of the two you are actually running — knowing which one you have open is a genuine prerequisite for troubleshooting a keybinding that is not working as expected.'
    },
    {
      q: 'Walk through what daemon/client mode actually does at a mechanical level, and why it produces such a noticeable speed difference.',
      a: 'A normal "emacs" launch reads your init.el (and everything it in turn loads) from disk, parses it as elisp, and evaluates it top to bottom — actually running that configuration code, which is where the bulk of a heavily-customized Emacs\'s startup time genuinely comes from, not from Emacs\'s own baseline overhead. "emacs --daemon" performs that exact loading process ONCE, then keeps the resulting live, fully-initialized Lisp environment resident in memory for as long as the daemon process continues running. "emacsclient -c" does not repeat any of that loading — it simply asks the already-running daemon to open a new window (frame) connected to that already-warm environment, which is why it can appear in a small fraction of the time a full cold "emacs" launch takes, regardless of how large the underlying configuration has grown.'
    },
    {
      q: 'A new Emacs user says C-g "does not seem to do anything" when they are stuck mid-command. What would you check?',
      a: 'First, confirm which Emacs they are actually running — terminal Emacs inside a terminal emulator that has NOT been configured per Part 1\'s Mac-specific fixes can sometimes fail to send the correct signal for Control-key combinations, or the terminal itself may be intercepting the key combination before Emacs ever sees it (some terminal emulators bind Ctrl-based shortcuts for their own tab/window management by default). Second, confirm they are actually pressing Control (not Command) — a very common early mix-up for someone coming from typical Mac application shortcuts, where Cmd is the usual modifier and Control is comparatively rare. Third, if genuinely nothing responds at all, checking whether the terminal itself has become unresponsive (unrelated to Emacs) versus Emacs specifically not receiving the C-g signal is worth distinguishing, since the fix is completely different depending on which is actually true.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover install, launch, and daemon/client basics. This is what is underneath: auto-starting the daemon at login via launchd (macOS\'s systemd-ish counterpart), and a closer look at what native compilation actually buys you.',
    sections: [
      {
        h: 'Auto-starting the daemon at login with launchd',
        p: [
          'macOS uses <code>launchd</code> as its service-management system — conceptually similar to the linux_course\'s systemd (a process manager that starts, stops, and supervises background services), though with its own distinct configuration format and tooling. A <b>launch agent</b> — an XML property list file under <code>~/Library/LaunchAgents/</code> — can be configured to automatically run <code>emacs --daemon</code> every time you log in, so the daemon is already warm and waiting by the time you actually want to reach for Emacs, without needing to remember to start it manually each session.',
          'A minimal launch agent plist specifies the program to run (<code>/opt/homebrew/bin/emacs</code> with the <code>--daemon</code> argument), sets <code>RunAtLoad</code> to true, and is loaded with <code>launchctl load ~/Library/LaunchAgents/your-plist-file.plist</code>. This is genuinely the same underlying idea as a systemd service being "enabled" to start at boot — a different specific tool, on a different OS, solving the identical practical problem.'
        ]
      },
      {
        h: 'What native compilation actually changes',
        p: [
          'Modern Emacs (28+) supports <b>native compilation</b>: elisp code can be compiled ahead-of-time into genuine machine code (via GCC\'s libgccjit), rather than being run through the slower bytecode interpreter that older Emacs versions relied on exclusively. The practical effect is meaningfully faster execution of elisp-heavy operations — noticeable especially in packages doing substantial computation, like the completion and LSP-client packages covered in Part 6. Homebrew\'s emacs formula includes native-compilation support by default on current versions; the first time a given piece of elisp runs, there can be a brief one-time compilation pause (cached afterward), which is a normal, expected part of how this feature works rather than a sign of a problem.'
        ]
      }
    ]
  }
};
