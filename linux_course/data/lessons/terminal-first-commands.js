window.LESSONS = window.LESSONS || {};
window.LESSONS['terminal-first-commands'] = {
  id: 'terminal-first-commands',
  title: 'The Terminal: Shell, Prompt, and Your First Commands',
  category: 'Part 0 — Orientation & Terminal',
  timeMin: 35,
  summary: 'What actually happens between you pressing Enter and text appearing on screen — the read/parse/execute loop every shell runs — plus the small set of commands (pwd, ls, cd, man) you\'ll type hundreds of times a day for the rest of this course. Open a terminal and follow along; every command here is safe to run right now.',
  goals: [
    'Explain the shell\'s core loop: read a line, split it into words, resolve the first word to a command, run it, print a new prompt',
    'Use pwd, ls (with -l, -a, -h), and cd confidently, including cd ~, cd .., and cd -',
    'Get help without leaving the terminal: man, --help, and apropos',
    'Explain, at a preview level, how the shell decides whether a typed word is a built-in or a program it has to go find (full depth in Part 4)',
    'Read a terminal prompt and tell whether it belongs to a regular user or root'
  ],
  concept: [
    {
      h: 'The shell is a loop: read, parse, execute, repeat',
      p: [
        'A terminal window is just a text display; the program actually doing the work is the <b>shell</b> running inside it (usually <code>bash</code> or <code>zsh</code> — Part 4 covers the difference). The shell\'s entire job, forever, is one loop: show a <b>prompt</b>, read the line you type, split it into words, figure out what the first word means, run it, show whatever it prints, then show a new prompt and do it again. That\'s it. Every single thing you\'ll do in a terminal for the rest of this course is a variation on that one loop.',
        'The prompt itself carries real information once you know to read it. A line ending in <code>$</code> means you\'re a regular user; a line ending in <code>#</code> means you\'re <b>root</b> — the one account with no permission restrictions at all, capable of deleting or breaking anything on the system with a single typo. Seeing <code>#</code> unexpectedly should always make you pause; Part 2 covers exactly when you need that power (rarely, and usually through <code>sudo</code> for one command at a time, not by staying logged in as root).',
        '<div class="math">you type a line → Enter → shell splits it into words → first word = command, rest = arguments → shell runs it → output appears → new prompt<span class="mnote">This loop is sometimes called a REPL: Read, Evaluate, Print, Loop. Same shape as a Python or Node.js interactive prompt — a shell is a REPL whose "language" is command names and files.</span></div>'
      ]
    },
    {
      h: 'pwd, ls, cd — your primary sensory organs',
      p: [
        'Three commands answer the three questions you\'ll ask constantly: <b>where am I</b>, <b>what\'s here</b>, and <b>take me somewhere else</b>.',
        '<ul><li><code>pwd</code> ("print working directory") — prints the full path of the directory you\'re currently "in." There is always exactly one current directory; every relative path you type (Part 1) is interpreted starting from here.</li><li><code>ls</code> ("list") — shows what\'s in the current directory (or a directory you name: <code>ls /etc</code>). Bare <code>ls</code> is often not enough: <code>ls -l</code> gives the "long" format — permissions, owner, size, modified date, one entry per line (Part 1 decodes every column); <code>ls -a</code> shows hidden entries too (anything starting with <code>.</code>, normally hidden from a plain <code>ls</code>); <code>ls -h</code> makes sizes human-readable (<code>4.2K</code> instead of <code>4213</code>). These combine: <code>ls -la</code> or <code>ls -lah</code> is close to the single most-typed command on this entire course.</li><li><code>cd</code> ("change directory") — moves your current directory. <code>cd ..</code> goes up one level (to the parent); <code>cd ~</code> or bare <code>cd</code> goes straight home; <code>cd -</code> is a genuinely useful trick most beginners never learn — it jumps back to whichever directory you were in immediately before your last <code>cd</code>, letting you ping-pong between two places without retyping either path.</li></ul>'
      ]
    },
    {
      h: 'Getting help without leaving the terminal',
      p: [
        'You are never expected to memorize every flag of every command — professionals look them up constantly, in the terminal, without breaking flow. Three tools: <code>man &lt;command&gt;</code> opens the full manual page (arrow keys or <code>j</code>/<code>k</code> to scroll, <code>/</code> to search inside it, <code>q</code> to quit — the pager is called <code>less</code>, and you\'ll meet it properly in Part 1); <code>&lt;command&gt; --help</code> prints a much shorter usage summary straight to your terminal, faster than opening a full manual for a quick reminder; and <code>apropos &lt;keyword&gt;</code> searches every manual page\'s short description for a keyword, which is how you find a command\'s name when you know what you want but not what it\'s called (try <code>apropos copy</code> right now).',
        'One habit worth building immediately: when a command does something you don\'t fully understand, <code>man</code> it before running it again. Five seconds now regularly prevents the kind of "I didn\'t know that flag did THAT" mistake that Part 1\'s permissions lesson and Part 3\'s <code>sed</code> lesson both call out by name as genuinely destructive if run blind.'
      ]
    },
    {
      h: 'How the shell decides what to actually run (a preview)',
      p: [
        'When you type <code>ls</code> and press Enter, the shell has to decide what "ls" even means. First it checks: is this one of a small set of commands the shell itself implements internally (a <b>built-in</b> — <code>cd</code>, <code>pwd</code>, <code>echo</code>, and a few others)? If so, the shell just does it directly, no separate program involved. If not, the shell searches a specific ordered list of directories — the <b>PATH</b> — for an executable file with that exact name, and runs the first match it finds. <code>which ls</code> shows you exactly which file won that search (typically <code>/bin/ls</code>).',
        'This matters more than it looks like it should: it\'s why <code>cd</code> MUST be a built-in and can\'t be an ordinary program (the tech corner below explains exactly why), it\'s why installing a tool sometimes requires updating your PATH before the shell can find it, and it\'s the exact mechanism Part 4\'s shell-environment lesson builds on when it teaches you to customize your own PATH and write your own commands. Today: just recognize that "built-in vs. found-on-PATH" is a real fork in the road happening on every single command you type.'
      ]
    }
  ],
  conceptFlow: {
    title: 'From keystroke to prompt — what actually happens when you press Enter',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'You type',
        nodes: [
          { id: 'typed', text: 'ls -la ~\nyou press Enter' }
        ]
      },
      {
        label: 'Shell parses',
        nodes: [
          { id: 'tokenize', text: 'Tokenize\nsplit into words: ls, -la, ~' },
          { id: 'expand', text: 'Expand\n~ becomes /Users/you (Part 4)' }
        ]
      },
      {
        label: 'Shell resolves',
        nodes: [
          { id: 'builtin', text: 'Built-in?\ncd, pwd, echo — the shell just does it' },
          { id: 'pathsearch', text: 'PATH search\nfind a file named "ls" (full depth: Part 4)' }
        ]
      },
      {
        label: 'Kernel executes',
        nodes: [
          { id: 'fork', text: 'fork()\nshell clones itself' },
          { id: 'exec', text: 'exec()\nthe clone becomes /bin/ls' }
        ]
      },
      {
        label: 'You see it',
        nodes: [
          { id: 'stdout', text: 'Output prints\nto your screen' },
          { id: 'newprompt', text: 'New prompt\nthe loop repeats' }
        ]
      }
    ],
    steps: [
      { active: ['typed'], note: 'You type a full line and press Enter. Until Enter, the shell hasn\'t done anything yet — it\'s just letting you edit the line.' },
      { active: ['tokenize'], note: 'The shell splits the line into words by whitespace: "ls", "-la", "~". This is called tokenizing. Quoting (Part 4) exists specifically to control where these splits happen.' },
      { active: ['expand'], note: 'Before running anything, the shell expands special tokens — here, ~ becomes your actual home directory path. This happens before the command ever sees its arguments.' },
      { active: ['builtin'], note: 'First question: is "ls" one of the handful of commands the shell implements itself (cd, pwd, echo, export…)? If yes, the shell handles it directly — no new program involved. "ls" is NOT a built-in, so we keep going.' },
      { active: ['pathsearch'], note: 'The shell searches its PATH — an ordered list of directories — for an executable file literally named "ls", and stops at the first match (commonly /bin/ls). "which ls" shows you the winner.' },
      { active: ['fork', 'exec'], note: 'The shell asks the kernel to fork (clone itself) and then exec (replace that clone\'s program with /bin/ls). This two-step fork-then-exec dance is the actual mechanism behind every command you\'ll ever run — Part 2 explains it properly once you know what a process is.' },
      { active: ['stdout'], note: 'ls runs, writes its listing to standard output, and exits. Part 3 spends a whole lesson on stdout/stderr and where else that output can be redirected instead of your screen.' },
      { active: ['newprompt'], note: 'The shell notices its child process exited, prints a fresh prompt, and goes back to waiting for your next line. The loop never stops until you close the terminal or type "exit".' }
    ]
  },
  story: {
    onePiece: {
      title: 'Nami\'s standing orders to the crew',
      text: 'Nami runs a tight ship in exactly one specific way: she gives an order, and there\'s a fixed, predictable process for how that order gets carried out, every single time, no exceptions. She shouts a line — say, "furl the mainsail." First question answered instantly, by habit: is this something SHE handles herself with no one else involved (a few commands, like adjusting her own weather instruments, she just does directly — the crew equivalent of a shell built-in)? If not, she scans the deck for whoever\'s actually assigned to sails today — checking a known, ordered list of stations (bow watch, midship, rigging) until she finds the right hand for the job, the exact same way the shell walks its PATH directories in order looking for a match. Once found, that crew member breaks off from whatever they were doing, becomes "the sail-furler" for this one task, executes it, and the result becomes visible on deck for everyone to see. Nami, satisfied, immediately turns and gives the next order — the loop never stops as long as there\'s a ship to run. A green cabin boy watching this for the first time thinks Nami has some kind of chaotic, ad-lib management style. She doesn\'t. It\'s a strict, repeatable loop — shout, resolve who handles it, execute, observe the result, shout again — and once you see the loop, her whole command style stops looking mysterious and starts looking like exactly what it is: read, resolve, execute, repeat.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Gunther always knows exactly who to hand your order to',
      text: 'Central Perk runs on a loop nobody but Gunther ever consciously notices. A customer walks up and says a line — "can I get a latte." Gunther has a near-instant internal check: is this something he just does himself right at the counter, no one else involved (steaming milk himself — a barista built-in)? Or does it need someone else — checking, in a fixed mental order, who\'s on shift and free right now (Rachel first if she\'s at the register, otherwise whoever\'s nearest) — the exact same "search an ordered list for the first match" the shell runs on your PATH. Whoever gets picked drops what they were doing, becomes "the latte person" for the next ninety seconds, makes the drink, and it appears on the counter for the customer to see. Gunther, without missing a beat, is already looking at the next person in line. The gang finds this vaguely hypnotic to watch — Gunther never seems to think about it, he just runs the loop: hear the order, resolve who handles it, get it made, show the result, look for the next order. That "never seems to think about it" part is exactly the point: once a loop is genuinely automatic, it stops feeling like a process and starts feeling like magic — which is precisely the illusion your shell is pulling off every time you press Enter.'
    },
    why: 'Give an order, resolve who (or what) handles it — checking your own hands first, then an ordered list of the usual suspects — execute it, show the result, wait for the next order. That five-step loop, done so fast it feels instant, is a shell prompt, a ship\'s captain, and a barista counter, and once you\'ve seen it once you\'ll see it everywhere.'
  },
  tech: [
    {
      q: 'Why does cd have to be a shell built-in? Why can\'t it just be a normal program like ls?',
      a: 'This is a genuinely deep question with a precise answer, and it previews the fork/exec mechanism Part 2 covers fully. When the shell runs an ordinary program, it forks — clones itself into a completely separate child process with its OWN independent copy of "current directory." If "cd" were an ordinary program, it would run in that child, dutifully change ITS OWN current directory... and then exit, at which point the child (and its changed directory) simply vanishes, leaving the original shell\'s directory completely untouched. You\'d type cd, see no error, and never actually move. The only way for "your current directory" to actually change is for the change to happen INSIDE the process you\'re still typing into — which means it must be the shell itself doing it, directly, as a built-in, never handed off to a child process at all.'
    },
    {
      q: 'What\'s the actual difference between man and --help, and when should I reach for which?',
      a: '--help is written by the program\'s author, printed instantly, and usually just a compact usage summary — great for "remind me of the exact flag name" when you already roughly know the tool. man pages are a more complete, standardized reference format (NAME, SYNOPSIS, DESCRIPTION, every flag explained, often examples and related commands at the bottom) and open in a full-screen pager (less) rather than dumping text and returning you to the prompt. Reach for --help for a quick nudge; reach for man when you\'re actually learning a tool for the first time or need to understand a flag\'s exact behavior, not just its name.'
    },
    {
      q: 'What is PATH, concretely, and can I see mine right now?',
      a: 'PATH is an environment variable — a single string of directories separated by colons, e.g. /usr/local/bin:/usr/bin:/bin — that the shell searches, in that exact left-to-right order, whenever you type a command name that isn\'t a built-in. Run "echo $PATH" right now to see yours. This also explains a classic beginner confusion: if two directories on your PATH both contain a program with the same name, the one in the EARLIER directory wins, silently — which is exactly the mechanism Part 4\'s shell-environment lesson uses to explain why installing a new version of a tool sometimes appears to do nothing (an old copy earlier on PATH is still winning the search).'
    }
  ],
  code: {
    title: 'A real five-minute terminal session',
    intro: 'Every line below is safe to run right now, in order, in your Mac\'s Terminal. Read the comments; they explain what each line actually did.',
    code: `$ pwd
/Users/tbaral
# "Where am I?" — the current directory, as a full absolute path.

$ ls
Desktop Documents Downloads Movies Music Pictures Public research

$ ls -la
total 0
drwxr-xr-x+ 15 tbaral  staff   480 Jul 16 09:02 .
drwxr-xr-x   6 root    admin   192 Jan  3  2024 ..
-rw-r--r--@  1 tbaral  staff  6148 Jul 15 21:40 .DS_Store
drwx------+ 12 tbaral  staff   384 Jul 16 08:55 Desktop
...
# -l = long format (permissions/owner/size/date), -a = show hidden dotfiles too.
# Part 1 decodes every single column of this output in detail.

$ cd Desktop
$ pwd
/Users/tbaral/Desktop

$ cd ..
$ pwd
/Users/tbaral
# cd .. moved us back up one level — to the PARENT of Desktop.

$ cd -
/Users/tbaral/Desktop
# cd - jumped straight back to the LAST directory we were in. Ping-pong for free.

$ cd
$ pwd
/Users/tbaral
# bare "cd" always sends you home, no matter where you were.

$ which ls
/bin/ls
# Proof: "ls" is not a built-in — it's a real file, found by searching PATH.

$ man ls
# Opens the full manual. Press "q" to quit back to your prompt.`,
    notes: [
      'Notice <code>cd</code> never printed anything on success — silence means success for most Unix commands, a convention Part 3 explains ("no news is good news").',
      'Try <code>apropos copy</code> yourself right now — it\'s the fastest way to find a command\'s name when you know what you want but not what it\'s called.'
    ]
  },
  lab: {
    title: 'Write the real commands',
    prompt: 'For each numbered task below, write the exact command you\'d type, one command per line, directly beneath its comment (which is already provided). Task 1 is done for you.',
    starter: `# Task 1: Print the current working directory.
pwd

# Task 2: List every entry in the current directory, including hidden ones, in long format.


# Task 3: Open the manual page for the "ls" command.


# Task 4: Print the value of your PATH environment variable.


# Task 5: Show exactly which file on disk will run when you type "ls".
`,
    checks: [
      { re: '^\\s*ls\\s+.*-.*[la].*[la]', flags: 'm', must: true, hint: 'Task 2 needs both hidden files AND long format — combine -l and -a (order doesn\'t matter: -la, -al, or -l -a all work).', pass: 'Task 2: ls -la (or equivalent) ✓' },
      { re: '^\\s*man\\s+ls\\s*$', flags: 'm', must: true, hint: 'Task 3: "man ls" opens the manual page for ls.', pass: 'Task 3: man ls ✓' },
      { re: '^\\s*echo\\s+\\$PATH\\s*$', flags: 'm', must: true, hint: 'Task 4: "echo $PATH" prints the PATH variable\'s value.', pass: 'Task 4: echo $PATH ✓' },
      { re: '^\\s*which\\s+ls\\s*$', flags: 'm', must: true, hint: 'Task 5: "which ls" shows exactly which file wins the PATH search.', pass: 'Task 5: which ls ✓' }
    ],
    run: 'Paste each line into your Mac\'s Terminal (or an SSH session, once you have one — Part 5) and watch the real output.',
    solution: `# Task 1: Print the current working directory.
pwd

# Task 2: List every entry in the current directory, including hidden ones, in long format.
ls -la

# Task 3: Open the manual page for the "ls" command.
man ls

# Task 4: Print the value of your PATH environment variable.
echo $PATH

# Task 5: Show exactly which file on disk will run when you type "ls".
which ls`,
    notes: [
      'If Task 2 tripped you up: -l and -a are two separate flags that happily combine into one token, -la — a pattern you\'ll use constantly.',
      '"which ls" and "echo $PATH" together are the two commands that make PATH stop being an abstract idea and start being something you can actually see.'
    ]
  },
  quiz: [
    {
      q: 'What does a shell do, in one sentence?',
      options: ['It compiles programs before running them', 'It reads a line, splits it into words, resolves and runs the command, then repeats', 'It is the same thing as the terminal window itself', 'It only exists to display file icons'],
      correct: 1,
      explain: 'The shell is the program running inside the terminal window that implements the read → parse → resolve → execute → repeat loop.'
    },
    {
      q: 'A prompt ending in # instead of $ means:',
      options: ['Nothing different, purely cosmetic', 'You are logged in as root — no permission restrictions, extreme caution warranted', 'You are disconnected from the network', 'The previous command failed'],
      correct: 1,
      explain: '# is the traditional prompt for root, the unrestricted superuser account. Seeing it unexpectedly should make you stop and check what you\'re about to run.'
    },
    {
      q: 'Which command shows which file on disk will actually run when you type a given command name?',
      options: ['man', 'apropos', 'which', 'pwd'],
      correct: 2,
      explain: '"which <command>" searches PATH the same way the shell does and reports the winning file\'s location.'
    },
    {
      q: 'Why must cd be a shell built-in rather than a separate program?',
      options: ['For historical reasons only, it could be rewritten as a separate program today', 'Because a child process\'s directory change can\'t propagate back to the parent shell — only the shell itself changing its own directory works', 'Because "cd" is faster as a built-in', 'It doesn\'t actually need to be a built-in — that\'s a myth'],
      correct: 1,
      explain: 'A separate "cd" program would run as a child process with its own independent working directory; changing it would have zero effect on the parent shell once that child exits.'
    },
    {
      q: 'You want a quick reminder of a flag you\'ve used before, without leaving your flow. Best first move:',
      options: ['Open a full man page', 'Restart the terminal', '<command> --help', 'Ask apropos'],
      correct: 2,
      explain: '--help gives a fast, compact summary straight in your terminal — ideal for "remind me of the exact flag," reserving the fuller man page for actually learning a tool.'
    }
  ],
  pitfalls: [
    'Running a command you don\'t fully understand "to see what happens" while logged in as root (a # prompt) — the blast radius for a mistake there is the whole system, not just your files.',
    'Forgetting that ls output column order and flags differ slightly between macOS (BSD ls) and a Linux server (GNU ls) — the core -l/-a/-h behavior is the same, but a few less-common flags aren\'t, and man ls on the actual machine you\'re using is always the ground truth.',
    'Assuming a silent command failed. Most Unix tools print NOTHING on success and only speak up on error — silence after cd, mkdir, or cp is the expected, correct outcome.'
  ],
  interview: [
    {
      q: 'Walk through exactly what happens between typing "ls -la" and seeing output.',
      a: 'The shell reads the line and tokenizes it into words ("ls", "-la"). It checks whether "ls" is a shell built-in; it isn\'t, so the shell searches PATH — an ordered list of directories — for an executable file named "ls," stopping at the first match (commonly /bin/ls). The shell then asks the kernel to fork (clone itself into a new child process) and exec (replace that child\'s program with /bin/ls, passing "-la" as an argument). The child process runs, writes its listing to standard output, and exits; the shell notices the exit and prints a new prompt.'
    },
    {
      q: 'Why can\'t "cd" be implemented as a normal external program?',
      a: 'Running an external program always goes through fork+exec: the shell clones itself into a child process, and that child runs independently with its own copy of process state, including its current working directory. If "cd" ran as a child process, it would change ONLY that child\'s directory; the child would then exit, and the parent shell\'s directory — the one you actually care about — would be completely unaffected. The only way to change "the shell\'s own" current directory is for the shell itself to do it directly, which is exactly why cd (along with a small set of others like pwd, export, and alias) is implemented as a shell built-in rather than a separate executable.'
    },
    {
      q: 'What is the PATH environment variable, and what problem does it solve?',
      a: 'PATH is a colon-separated list of directories that the shell searches, in order, when resolving a typed command name to an actual executable file. It solves the problem of not having to type a full path (/usr/local/bin/ls) every time you want to run a common tool — you type "ls" and the shell finds it for you. It also explains a common gotcha: if the same command name exists in two PATH directories, whichever directory comes FIRST wins silently, which is a frequent root cause of "I installed a new version but the old one still runs" bugs.'
    },
    {
      q: 'What\'s the practical difference between "command --help" and "man command"?',
      a: '--help is implemented by the program itself and prints a short usage summary directly to the terminal — fast, but often terse, and format varies tool to tool. man opens a full, standardized reference page (NAME/SYNOPSIS/DESCRIPTION/every option explained, often with examples) in a full-screen pager. In practice: --help for a quick flag reminder when you already know the tool; man when you\'re learning a tool properly or need to understand a flag\'s exact, complete behavior.'
    }
  ]
};
