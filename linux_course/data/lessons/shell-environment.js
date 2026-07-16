window.LESSONS = window.LESSONS || {};
window.LESSONS['shell-environment'] = {
  id: 'shell-environment',
  title: 'The Shell Environment: bash vs zsh, .bashrc/.zshrc, PATH & Aliases',
  category: 'Part 4 — Shell & Bash Scripting',
  timeMin: 35,
  summary: 'Every command typed so far has been handled by a shell, without asking what a shell actually is or how it decides what "ls" or "grep" even refers to. This lesson opens that up — the difference between bash and zsh (genuinely relevant, since Mac defaults to zsh while most Linux servers still default to bash), how PATH decides which program actually runs, which config file loads when, and how to customize a shell with aliases. This is the last piece needed before writing real bash scripts, starting next lesson.',
  goals: [
    'Explain what a shell is, and the practical difference between bash and zsh',
    'Explain what PATH is, and how the shell resolves a typed command to an actual program',
    'Use which and type to see exactly where a command resolves to',
    'Explain the difference between a login and non-login, interactive and non-interactive shell, and which config file each reads',
    'Write and use a simple alias, and explain when a shell function is needed instead'
  ],
  concept: [
    {
      h: 'What a shell actually is: bash vs zsh',
      p: [
        'A <b>shell</b> is just a program — one whose whole job is reading what you type, figuring out what you mean, and running the right thing. <code>bash</code> (Bourne Again SHell) is the long-standing default on most Linux distributions and servers. <code>zsh</code> (Z shell) is a newer, more feature-rich shell that has been the DEFAULT on macOS since Catalina (2019) — which matters directly for anyone who works daily on a Mac but regularly SSHes into Linux machines: your local prompt, history, and config live in zsh-land, while the remote machine you land on almost certainly expects bash-land conventions.',
        'The two are similar enough that most everyday commands behave identically, and different enough that scripting syntax, some config file names, and certain built-in behaviors genuinely diverge — which is exactly why every bash script in this course starts with an explicit <code>#!/bin/bash</code> shebang (covered next lesson) rather than assuming whatever shell happens to be running it.'
      ]
    },
    {
      h: 'PATH: how the shell finds "ls" when you type "ls"',
      p: [
        'When you type a bare command name like <code>ls</code>, the shell does not magically know where that program lives — it searches a specific, ordered list of directories stored in the <code>PATH</code> environment variable, a colon-separated string like <code>/usr/local/bin:/usr/bin:/bin</code>. It checks each directory IN ORDER, left to right, and runs the FIRST executable file with that exact name that it finds — stopping immediately, without checking the remaining directories at all.',
        '<code>which command</code> (or the shell built-in <code>type command</code>, generally more informative) shows exactly which file PATH resolution actually landed on — genuinely useful the moment two different versions of the same tool are installed and you need to know which one actually runs. "command not found" specifically means the shell searched every directory in PATH and found nothing by that exact name in any of them — which is also exactly why running a script you just wrote with a bare <code>myscript.sh</code> fails unless its directory happens to be in PATH; <code>./myscript.sh</code> (an explicit relative path) sidesteps PATH search entirely by naming the file\'s location directly.'
      ]
    },
    {
      h: 'Login vs non-login, interactive vs non-interactive: which config file loads',
      p: [
        'A shell session has two independent properties that together determine which config files it reads on startup. <b>Login</b> vs non-login: a login shell is one starting a fresh session — a fresh SSH connection is the clearest everyday example — while a non-login shell is one started from within an already-running session, like opening a new terminal tab on a machine you are already logged into. <b>Interactive</b> vs non-interactive: interactive means a human is typing commands and expecting a prompt back; non-interactive means a script is running unattended, with no human waiting on a prompt.',
        'For bash specifically: a login shell reads <code>/etc/profile</code>, then the first of <code>~/.bash_profile</code>, <code>~/.bash_login</code>, or <code>~/.profile</code> it finds (only one, not all three). An interactive NON-login shell (like a new terminal tab) reads <code>~/.bashrc</code> instead. This is exactly why a fresh SSH session and a new local terminal tab can behave subtly differently even on the same machine — they are reading different config files by design, not by accident, and it is a genuinely common source of "why does my PATH change work over SSH but not in a new tab" confusion.'
      ]
    },
    {
      h: 'Aliases: quick shorthand, and when you actually need a function instead',
      p: [
        '<code>alias ll=\'ls -la\'</code> creates a simple text substitution — typing <code>ll</code> from then on runs exactly <code>ls -la</code>, nothing more. Aliases are genuinely useful for shortening frequently-typed commands, but they are DELIBERATELY limited: they cannot accept arguments in any position other than the end, cannot contain real logic (an if/else, a loop), and exist only in the CURRENT shell session unless defined in a config file that gets sourced on startup.',
        'A shell <b>function</b> is the real tool once an alias\'s limits are hit — it can accept arguments anywhere, run multiple commands, include conditionals, and generally behave like a small script defined directly in your shell config. <code>mkcd() { mkdir -p "$1" && cd "$1"; }</code> — a function taking one argument, creating that directory AND moving into it — is something no alias could express, since it genuinely needs to reference its argument mid-command, not just append it at the end.',
        'Changes to <code>.bashrc</code>/<code>.zshrc</code> do not take effect in ALREADY-OPEN shell sessions automatically — either open a new terminal/session, or explicitly reload the current one with <code>source ~/.bashrc</code> (or the shorthand <code>. ~/.bashrc</code>), a genuinely common step people forget immediately after editing their own config.'
      ]
    }
  ],
  conceptFlow: {
    title: 'You type "grep" — how PATH resolves it to an actual program',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'The typed command',
        nodes: [
          { id: 'typed', text: 'You type: grep' }
        ]
      },
      {
        label: 'Read PATH',
        nodes: [
          { id: 'readpath', text: 'PATH = /usr/local/bin:/usr/bin:/bin' }
        ]
      },
      {
        label: 'Check each directory, in order',
        nodes: [
          { id: 'check1', text: 'Check /usr/local/bin/grep\nnot found here' },
          { id: 'check2', text: 'Check /usr/bin/grep\nFOUND' },
          { id: 'check3', text: '(never checks /bin\nsearch already stopped)' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'run', text: 'Run /usr/bin/grep\nwith whatever arguments you typed' }
        ]
      }
    ],
    steps: [
      { active: ['typed'], note: 'Typing a bare command name gives the shell nothing but a name — it has to figure out an actual file location before it can run anything.' },
      { active: ['readpath'], note: 'The shell reads the PATH environment variable — an ordered, colon-separated list of directories to search, in this example three directories long.' },
      { active: ['check1'], note: 'It checks the FIRST directory in PATH for a file named exactly "grep" — not found here, so it moves to the next.' },
      { active: ['check2'], note: 'It checks the second directory and finds a file named "grep" — search stops immediately, right here.' },
      { active: ['check3'], note: 'The third directory is never even checked — once a match is found, the search does not continue looking for other possible matches further down PATH.' },
      { active: ['run'], note: 'The shell runs /usr/bin/grep specifically — if a DIFFERENT grep existed in /usr/local/bin, PATH order alone determined which one actually ran, silently.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Baratie\'s Supply Order: Check the Pantry First, Then the Cellar, Then the Dock Stalls',
      text: 'Sanji runs Baratie\'s kitchen with a strict, ordered lookup for every ingredient request, and every new hire learns it the same way: fast, or not at all. Someone calls out "we need lemons" mid-service, and Sanji does not personally think through every possible source from scratch each time — he checks an exact, memorized ORDER: the countertop stock first, then the walk-in pantry if the counter is empty, then the cellar storage if the pantry is also empty, then — only as an absolute last resort — sending someone running to the dock stalls outside. Whichever of those is checked FIRST and actually has lemons wins, immediately, and nobody continues checking the remaining sources afterward just to be thorough — the search stops the instant something is found. This is precisely why, the one time TWO different crates of lemons exist simultaneously (a fresher batch quietly restocked in the pantry, an older forgotten batch still sitting in the cellar), the kitchen automatically uses the pantry ones without anyone explicitly choosing them — pantry comes before cellar in the lookup order, so pantry simply wins, every time, with nobody needing to decide anything in the moment. And separately, there is a genuine difference in how the kitchen behaves depending on the OCCASION: a full, formal opening-service ritual runs a whole checklist of setup steps that only apply when the restaurant is truly opening fresh for the day — versus a cook stepping back into the kitchen mid-shift after briefly stepping out, which skips that entire formal ritual and just picks the existing session back up. Same kitchen, same cooks, genuinely different startup behavior depending on which kind of "start" it actually is.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Question-Routing Order, and the Two Kinds of "Visiting"',
      text: 'Sheldon, needing an answer to a science question, does not treat every friend as an equally likely source — he runs a fixed, ordered checklist, fast and automatic. Physics question: ask Leonard first; if Leonard genuinely does not know, THEN ask Raj if it edges into astrophysics; only after both of those fail does he consider walking to the department office as a last resort. Whichever source in that order actually has the answer is the one he uses, immediately, and he does not keep polling the remaining people afterward just for a second opinion — first match wins, full stop. This produces a specific, mildly comic consequence one week when BOTH Leonard and a physics textbook on Sheldon\'s own shelf happen to contain the same answer — Sheldon always asks Leonard first, so the textbook, despite being equally correct and arguably faster to check, never actually gets consulted, purely because it sits later in his mental lookup order, not because it is worse. Separately, Sheldon draws a genuinely sharp line between two different kinds of "showing up" at someone\'s apartment: a full, FORMAL visit invokes his whole roommate-agreement ritual — specific greetings, specific seating rules, specific procedures that only apply when a visit is properly beginning fresh. Briefly stepping back into his OWN apartment after five minutes in the hallway invokes none of that ceremony at all — same physical door, same person walking through it, but a completely different set of rules kicks in depending on which TYPE of arrival it actually is.'
    },
    why: 'PATH resolution is exactly Sanji\'s pantry-then-cellar-then-dock order and Sheldon\'s Leonard-then-Raj-then-office order: check each source in a fixed sequence, stop at the very first match, and never mind whatever else might also have satisfied the request further down the list. And login vs non-login shells are exactly the difference between a full opening ritual / formal visit and simply picking back up mid-session — same underlying system, genuinely different startup behavior depending on which kind of "start" it actually is.'
  },
  tech: [
    {
      q: 'Why does running a script you just wrote with a bare "myscript.sh" fail with "command not found," even though the file clearly exists in your current directory?',
      a: 'PATH search only checks the specific directories LISTED in the PATH variable — and, deliberately, the current directory ( . ) is NOT included in PATH by default on nearly every modern system, specifically as a security measure (historically, an attacker could otherwise plant a malicious file named like a common command in a directory you might cd into, and have it silently run instead of the real one). Running "./myscript.sh" sidesteps PATH search entirely by giving the shell an explicit relative path to the file, rather than a bare name it has to search for — which is exactly why the "./" prefix is required for scripts in your current directory, even when that directory obviously contains the file.'
    },
    {
      q: 'Why does the ORDER of directories in PATH matter, and what is the actual security risk of a writable directory appearing early in it?',
      a: 'Because PATH search stops at the FIRST match found, whichever directory appears earlier in the list effectively wins over any later directory containing a same-named file — this is exactly how a user-level tool installed in /usr/local/bin can intentionally "shadow" and override a system tool of the same name in /usr/bin, simply by virtue of coming first in PATH. The security risk shows up when a directory that OTHER, less-trusted users can write to appears early in PATH: someone could drop a maliciously-named file (like "ls" or "sudo") into that writable directory, and it would run INSTEAD of the real, trusted system command the next time you typed that name — silently, since nothing about typing a familiar command name looks suspicious. This is exactly why security guidance consistently warns against ever having "." (the current directory) or a world-writable directory anywhere early in PATH.'
    },
    {
      q: 'Why can an alias not accept an argument in the middle of the command it expands to, while a function can?',
      a: 'An alias is pure, dumb text substitution — the shell literally replaces the typed alias name with its defined text, then appends whatever else you typed afterward, unconditionally, at the END. There is no mechanism for an alias to say "put this argument HERE, in the middle" — arguments can only ever land after the substituted text. A function, by contrast, is a genuine small program with real parameter handling ($1, $2, and so on, referencing positional arguments), so it can use an argument anywhere within its body — building a path from it, checking it in a condition, passing it to multiple different commands inside the function — which is exactly the capability an alias structurally cannot offer.'
    }
  ],
  code: {
    title: 'Inspecting PATH, resolving commands, and defining aliases',
    intro: 'Try these in your actual shell — nothing here is destructive.',
    code: `$ echo $PATH
/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin

$ which grep
/usr/bin/grep

$ type grep
grep is /usr/bin/grep

$ type cd
cd is a shell builtin
# "type" also correctly reports built-ins, which "which" often cannot.

$ ./deploy.sh
bash: ./deploy.sh: Permission denied
$ chmod +x deploy.sh
$ ./deploy.sh
Deploying...
# Explicit "./" path — PATH search never even entered into it.

$ alias ll='ls -la'
$ ll
# Runs exactly "ls -la" — this alias only lasts for the current session.

$ echo "alias ll='ls -la'" >> ~/.bashrc
$ source ~/.bashrc
# Now it persists across future sessions too, and is active immediately in this one.

$ mkcd() { mkdir -p "$1" && cd "$1"; }
$ mkcd new-project
$ pwd
/home/nami/new-project
# A function — takes an argument and uses it in two different places.

$ echo $SHELL
/bin/zsh
# What your LOGIN shell is set to — not necessarily what's currently running interactively.`,
    notes: [
      '"echo $SHELL" shows your configured login shell, which can differ from what a script is actually executing under — use "echo $0" or "ps -p $$" inside a running shell to see what is genuinely active right now.',
      'On a Mac, "which bash" often still shows an OLD bash version (3.2) even with zsh as the default shell — a genuinely common surprise for anyone assuming a Mac ships a modern bash by default.'
    ]
  },
  lab: {
    title: 'PATH, aliases, and config — write the right answer for each task',
    prompt: 'Answer or write a command for each task below.',
    starter: `# Q: PATH is "/opt/tools:/usr/bin:/bin" and both /opt/tools and /usr/bin contain a file named "mytool".
# Which one actually runs when you type "mytool"?


# Task: add /opt/tools to the FRONT of PATH (so it's checked first), for the current session


# Task: create an alias "gs" that runs "git status"


# Task: reload your current shell's ~/.bashrc after editing it, without opening a new terminal

`,
    checks: [
      { re: '/opt/tools', flags: 'i', must: true, hint: '/opt/tools comes FIRST in the PATH list, so its "mytool" wins — PATH search stops at the first match.', pass: '/opt/tools identified as the one that runs ✓' },
      { re: 'export\\s+PATH\\s*=\\s*.?/opt/tools:\\$PATH', flags: 'i', must: true, hint: 'export PATH="/opt/tools:$PATH" prepends /opt/tools to the existing PATH.', pass: 'export PATH=/opt/tools:$PATH ✓' },
      { re: "alias\\s+gs\\s*=\\s*.git status.", flags: 'i', must: true, hint: "alias gs='git status'", pass: "alias gs='git status' ✓" },
      { re: 'source\\s+~?/?\\.?bashrc|\\.\\s+~?/?\\.?bashrc', flags: 'i', must: true, hint: 'source ~/.bashrc (or the shorthand ". ~/.bashrc") reloads it in the current session.', pass: 'source ~/.bashrc ✓' }
    ],
    run: 'Try it for real: echo $PATH, then temporarily prepend a directory and confirm with echo $PATH again.',
    solution: `# Q: PATH is "/opt/tools:/usr/bin:/bin" and both /opt/tools and /usr/bin contain a file named "mytool".
# Which one actually runs when you type "mytool"?
# The one in /opt/tools — it comes first in PATH, and search stops at the first match.

# Task: add /opt/tools to the FRONT of PATH (so it's checked first), for the current session
export PATH="/opt/tools:$PATH"

# Task: create an alias "gs" that runs "git status"
alias gs='git status'

# Task: reload your current shell's ~/.bashrc after editing it, without opening a new terminal
source ~/.bashrc`,
    notes: [
      'Prepending ($PATH at the END, new directory at the START) means the new directory is checked FIRST; appending would put it last, checked only if nothing earlier matched.',
      'An "export PATH=..." change made directly in the terminal only lasts for that session — putting it in ~/.bashrc (or ~/.zshrc) is what makes it permanent across future sessions.'
    ]
  },
  quiz: [
    {
      q: 'What is PATH, and what does the shell do with it when you type a bare command name?',
      options: ['A single directory where all commands must live', 'A colon-separated, ORDERED list of directories the shell searches, stopping at the first match found', 'A list of commands the shell has already run', 'A configuration file, not an environment variable'],
      correct: 1,
      explain: 'PATH is an ordered list of directories, checked left to right; the shell runs the first executable with the matching name it finds and stops searching immediately.'
    },
    {
      q: 'Why does "./myscript.sh" work when a bare "myscript.sh" (in the same directory) fails with "command not found"?',
      options: ['They are functionally identical; the failure must be a typo', 'The current directory is deliberately NOT included in PATH by default, so "./" is needed to reference it explicitly, bypassing PATH search', '"./" makes the script run faster', 'Bare script names only work for compiled programs, never shell scripts'],
      correct: 1,
      explain: 'PATH search does not include the current directory by default (a deliberate security measure) — "./" gives an explicit relative path instead, sidestepping PATH search entirely.'
    },
    {
      q: 'What is the main structural limitation of an alias compared to a shell function?',
      options: ['Aliases cannot be deleted once created', 'An alias is pure text substitution — any arguments are appended at the END only, with no way to place them mid-command or add real logic', 'Aliases only work in zsh, never bash', 'Functions cannot be used interactively, only in scripts'],
      correct: 1,
      explain: 'An alias literally substitutes text and appends whatever follows at the end — it cannot use an argument in the middle of a command or include conditionals/loops. A function can do both.'
    },
    {
      q: 'What is the key difference between a login shell and a non-login (but interactive) shell, in terms of when each occurs?',
      options: ['There is no real difference between them', 'A login shell starts a fresh session (like a new SSH connection); a non-login shell starts from within an already-running session (like a new local terminal tab)', 'A login shell always requires a password; a non-login shell never does', 'Login shells only exist on macOS'],
      correct: 1,
      explain: 'Login shells begin a fresh session (SSH connecting, or a fresh terminal login); non-login interactive shells start from inside an existing session (a new tab) — and each type reads different config files on startup.'
    },
    {
      q: 'Why is macOS defaulting to zsh (while most Linux servers default to bash) directly relevant to someone who develops on a Mac and SSHes into Linux machines?',
      options: ['It is not relevant; bash and zsh are 100% identical in every respect', 'Local shell customizations, scripting syntax quirks, and some config file names genuinely differ between the two, so assumptions that hold locally may not hold on the remote server, and vice versa', 'zsh cannot connect to Linux machines via SSH at all', 'Only bash supports SSH; zsh requires a separate SSH client'],
      correct: 1,
      explain: 'While most everyday commands behave the same, real differences in scripting syntax, some built-ins, and config file conventions exist between bash and zsh — worth being aware of specifically because local (zsh, Mac) and remote (bash, Linux server) environments may differ.'
    }
  ],
  pitfalls: [
    'Assuming a change to ~/.bashrc takes effect immediately in an ALREADY-OPEN terminal — it does not, until that session either restarts or explicitly runs "source ~/.bashrc."',
    'Trying to give an alias an argument in the middle of its expanded command, not realizing aliases can only ever append arguments at the end — a shell function is needed for anything beyond that.',
    'Editing PATH-related config on a Mac (zsh, ~/.zshrc) and expecting the exact same file/syntax to work identically after SSHing into a Linux server (bash, ~/.bashrc) — the config lives in a different file with occasionally different syntax on each side.'
  ],
  interview: [
    {
      q: 'Explain exactly how a shell resolves a bare command name like "python3" to an actual file it runs.',
      a: 'The shell reads the PATH environment variable — a colon-separated, ordered list of directories — and checks each one in sequence, left to right, for an executable file with exactly that name. The moment it finds one, it stops searching immediately and runs that file, without checking any remaining directories in PATH even if another matching file exists further down the list. If no directory in PATH contains a matching executable, the shell reports "command not found." This is also why the current directory is deliberately excluded from PATH by default — running something in your current directory requires an explicit path like "./script.sh" rather than a bare name.'
    },
    {
      q: 'Why is having a world-writable directory early in PATH considered a genuine security vulnerability, not just bad hygiene?',
      a: 'Because PATH search stops at the FIRST match, a directory appearing earlier in PATH effectively takes priority over the real system directories (like /usr/bin) that appear later. If that early directory is writable by other, less-trusted users, an attacker could place a maliciously-named file there — say, one literally named "ls" or "sudo" — and it would silently run INSTEAD of the legitimate command the next time an unsuspecting user typed that familiar name, with no visible warning that anything unusual happened. This is exactly why security guidance treats "." or any world-writable directory appearing early in PATH as a real, exploitable privilege-escalation vector, not merely a style concern.'
    },
    {
      q: 'What is the practical difference between a login shell and a non-login shell, and why does it matter which config file (.bash_profile vs .bashrc) a given environment variable ends up in?',
      a: 'A login shell starts a brand-new session (a fresh SSH connection is the clearest case) and reads /etc/profile then one of ~/.bash_profile / ~/.bash_login / ~/.profile. A non-login interactive shell (a new terminal tab on an already-logged-in machine) reads ~/.bashrc instead. It matters where you put something because a variable or alias defined only in ~/.bashrc will NOT automatically be present in a fresh login shell (like a brand-new SSH session) unless something explicitly sources .bashrc from within the login-shell config too — a genuinely common setup convention is having .bash_profile itself source .bashrc, specifically to avoid maintaining the same settings in two separate files that load under different circumstances.'
    },
    {
      q: 'When would you reach for a shell function instead of an alias, and what is the underlying reason an alias cannot do the same job?',
      a: 'Reach for a function the moment the desired behavior needs an argument used anywhere OTHER than the very end of the expanded command, needs actual logic (a condition, a loop, multiple sequential steps depending on input), or needs to do something more elaborate than a fixed, static text substitution. The underlying reason an alias cannot do this is structural: an alias is nothing more than the shell substituting one string of text for another before running it, with whatever you typed afterward simply tacked onto the end — there is no mechanism for the substituted text to reference or reposition an argument, because an alias has no concept of parameters at all. A function is a genuine small program with real positional parameters ($1, $2, ...) and full control-flow support, which is exactly the capability gap an alias cannot close.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover PATH, config files, and aliases well enough for daily use. This is what is underneath: the exact bash startup-file precedence, subshells vs exec, and how zsh\'s own startup order actually differs.',
    sections: [
      {
        h: 'bash\'s exact startup file precedence',
        p: [
          'For a LOGIN shell, bash reads <code>/etc/profile</code> first, then searches for <code>~/.bash_profile</code>, <code>~/.bash_login</code>, and <code>~/.profile</code> IN THAT ORDER — reading only the FIRST one found, not all three. A common, deliberate convention is making <code>~/.bash_profile</code> contain nothing but a line sourcing <code>~/.bashrc</code>, specifically so login and non-login shells end up with the same environment without duplicating config in two files. For a non-login INTERACTIVE shell, bash reads only <code>~/.bashrc</code> — full stop, no /etc/profile involved at all. Non-interactive shells (running a script) read neither by default, UNLESS the script explicitly sources one — which is exactly why a cron job or automated script often behaves as though PATH customizations "vanished," since it never read the interactive shell\'s config at all.'
        ]
      },
      {
        h: 'zsh\'s different (and arguably more sensible) startup order',
        p: [
          'zsh separates its startup files more granularly: <code>.zshenv</code> is read for EVERY zsh invocation, interactive or not, login or not — genuinely global settings belong here. <code>.zprofile</code> is read only for login shells (analogous to bash\'s .bash_profile). <code>.zshrc</code> is read only for interactive shells (analogous to .bashrc). <code>.zlogin</code> runs after .zshrc, for login shells specifically. The practical upshot: zsh users generally do not need the same "make .bash_profile source .bashrc" workaround bash users reach for, since zsh\'s files are already scoped clearly enough on their own — but the SPECIFIC file names differ from bash\'s entirely, which is exactly the trap when switching between a Mac (zsh) and a Linux server (bash) and expecting the same filename to matter on both.'
        ]
      },
      {
        h: 'exec: replacing the shell instead of spawning a subshell',
        p: [
          'Running a command normally starts it as a CHILD process of the current shell — the shell is still there afterward, waiting. <code>exec command</code> is different: it REPLACES the current shell process entirely with the new command, in place, using the same PID — the original shell does not continue existing alongside it at all. This matters in scripting for two genuine reasons: it avoids leaving an unnecessary extra process around (relevant in containers, where a common Dockerfile pattern ends with "exec" specifically so the main process becomes PID 1 directly, correctly receiving signals — tying directly into the processes-job-control lesson\'s PID 1 discussion), and it means anything AFTER an exec\'d command in the same script never runs at all, since the script\'s own process no longer exists to continue executing it.'
        ]
      }
    ]
  }
};
