window.LESSONS = window.LESSONS || {};
window.LESSONS['navigating-files'] = {
  id: 'navigating-files',
  title: 'Navigating & Manipulating Files: Paths, Globs, cp/mv/rm, cat/less/head/tail',
  category: 'Part 1 — Filesystem & Files',
  timeMin: 40,
  summary: 'Now that you know the map (Part 1\'s previous lesson), learn to actually move around it and act on what you find: absolute vs relative paths, wildcards that let you operate on many files at once, copying/moving/deleting safely, and the four ways to look inside a file without opening an editor.',
  goals: [
    'Explain the difference between an absolute path and a relative path, and predict where a relative path resolves to given a current directory',
    'Use wildcards (*, ?, and character classes) to select groups of files without listing them individually',
    'Use cp, mv, rm, and mkdir correctly, including the recursive flags that make them work on directories',
    'Choose correctly between cat, less, head, and tail depending on the size of a file and what you actually need to see',
    'Explain why rm has no undo, and what habits prevent the classic "deleted the wrong thing" disaster'
  ],
  concept: [
    {
      h: 'Absolute vs relative paths',
      p: [
        'A path starting with <code>/</code> is <b>absolute</b> — it describes a location starting from the root, unambiguous no matter where you currently are. A path that doesn\'t start with <code>/</code> is <b>relative</b> — it\'s interpreted starting from your current directory (<code>pwd</code>), which means the exact same relative path can point to completely different files depending on where you type it from. Two special relative shorthand tokens matter constantly: <code>.</code> means "this directory," and <code>..</code> means "the parent directory" — so <code>../logs</code> means "go up one level, then into logs."',
        'Neither is universally "better" — they\'re tools for different situations. Absolute paths are unambiguous and safe to put in scripts that might run from anywhere (Part 4 makes this a hard rule). Relative paths are shorter and often clearer for referring to something near where you already are — <code>cd ../sibling-project</code> reads naturally; <code>cd /home/nami/work/sibling-project</code> says the same thing with a lot more typing.',
        '<div class="math">absolute: /home/nami/logs/today.txt   (starts from /, means the same thing from anywhere)<br>relative: ../logs/today.txt        (starts from HERE — meaning depends on your current directory)<span class="mnote">Rule of thumb used throughout this course: relative paths for interactive typing, absolute paths inside scripts.</span></div>'
      ]
    },
    {
      h: 'Wildcards (globbing) — operate on many files at once',
      p: [
        'Typing every filename individually gets old fast, so the shell offers <b>globbing</b> — pattern characters that expand to a list of matching filenames BEFORE the command ever runs. <code>*</code> matches any sequence of characters (including none) — <code>*.log</code> matches every file ending in <code>.log</code> in the current directory. <code>?</code> matches exactly one character — <code>report?.csv</code> matches <code>report1.csv</code> but not <code>report10.csv</code>. Square brackets match one character from a set — <code>file[123].txt</code> matches <code>file1.txt</code>, <code>file2.txt</code>, or <code>file3.txt</code> only.',
        'The crucial mental model: globbing is NOT done by the command you\'re running (<code>ls</code>, <code>rm</code>, whatever) — it\'s done by the SHELL, before the command even sees its arguments. Run <code>echo *.log</code> and you\'ll see this directly: <code>echo</code> just prints whatever it\'s handed, and what it\'s handed is already a list of real filenames, expanded by the shell. This matters for a real, common gotcha: if NO file matches a glob pattern, most shells pass the literal, unexpanded pattern text through instead of an empty list — a command expecting real filenames can get confused by literally receiving the text <code>*.log</code> as an argument when no logs exist.'
      ]
    },
    {
      h: 'Copying, moving, deleting — and why rm deserves real respect',
      p: [
        '<code>cp source dest</code> copies a file; add <code>-r</code> (recursive) to copy an entire directory and everything inside it — plain <code>cp</code> refuses to copy a directory without it. <code>mv source dest</code> moves (or renames — same operation, Linux doesn\'t distinguish) a file or directory; no <code>-r</code> needed, since moving doesn\'t require reading and rewriting every byte the way copying does. <code>mkdir name</code> creates a directory; <code>mkdir -p a/b/c</code> creates every missing directory in that path at once instead of failing because <code>a</code> or <code>a/b</code> don\'t exist yet.',
        '<code>rm file</code> deletes a file. <code>rm -r directory</code> deletes a directory and everything inside it. Here is the single most important fact in this lesson: <b>there is no trash can, no undo, and no confirmation by default.</b> <code>rm</code> does exactly what you told it, immediately, permanently. The combination <code>rm -rf</code> (recursive + force, meaning "don\'t even ask, don\'t even complain if something\'s missing") deletes an entire directory tree with zero interaction — genuinely useful, and genuinely the single most-feared typo in this entire course. The pitfalls section below covers the specific habits that prevent disaster; internalize them before you ever type <code>-rf</code> on a real system.'
      ]
    },
    {
      h: 'Looking inside a file: cat, less, head, tail',
      p: [
        'Four tools, four different jobs, and picking the right one matters once files get large. <code>cat file</code> dumps the ENTIRE file straight to your screen — perfect for a short file, actively bad for a 500MB log (your terminal will scroll for a very long time). <code>less file</code> opens a pager — loads the file a screen at a time, lets you scroll with arrow keys or <code>j</code>/<code>k</code>, search with <code>/pattern</code>, and quit with <code>q</code>, all WITHOUT reading the whole file into memory first, which is why it stays fast even on huge files.',
        '<code>head file</code> shows just the first 10 lines (change with <code>-n</code>, e.g. <code>head -n 20</code>); <code>tail file</code> shows just the last 10 lines the same way. <code>tail -f file</code> deserves special attention: the <code>-f</code> ("follow") flag keeps the file open and prints new lines AS THEY\'RE WRITTEN — this is how you watch a log file live while a program runs, and it\'s a command you will use constantly once Part 2\'s processes lesson and beyond have you debugging real running services.'
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials above cover daily use. Here are two more tools worth having, plus the safety habits that separate people who\'ve had an rm disaster from people who haven\'t (yet).',
    sections: [
      {
        h: 'find and du — locating files and measuring space',
        p: [
          '<code>find</code> searches a directory tree for files matching criteria — <code>find . -name "*.log"</code> searches recursively from the current directory for anything named like a log file, which is a genuinely different tool from globbing (globbing only ever looks in one directory; find walks the whole tree). <code>find . -mtime -1</code> finds files modified in the last day — a real, frequently-used debugging move ("what changed recently?"). <code>du -sh directory</code> ("disk usage, summarize, human-readable") reports how much space a directory tree actually consumes — the direct follow-up to filesystem-hierarchy\'s "df says /var is full, but WHICH directory inside /var is the culprit" question; <code>du -sh /var/log/* | sort -rh | head</code> is a genuinely useful real-world one-liner worth memorizing once Part 3 covers <code>sort</code> and pipes properly.'
        ]
      },
      {
        h: 'The specific habits that prevent an rm disaster',
        p: [
          'Professionals who\'ve been burned once develop a small, specific set of habits, all worth adopting before you need them rather than after: run the equivalent <code>ls</code> on your glob pattern FIRST to see exactly what it matches, before running <code>rm</code> on that same pattern — <code>ls *.tmp</code> then, only if the list looks right, <code>rm *.tmp</code>. Never type <code>rm -rf /</code> or anything close to it near a variable that might be empty — <code>rm -rf "$DIR/"*</code> is catastrophic the instant <code>$DIR</code> happens to be unset or empty, because it silently becomes <code>rm -rf /*</code> (Part 4\'s bash-scripting-advanced lesson covers exactly this class of bug and how <code>set -u</code> catches it automatically). And on systems where it\'s available, consider aliasing <code>rm</code> to <code>rm -i</code> (interactive — asks for confirmation per file) in your personal dotfiles while you\'re still building instincts, understanding that real production scripts should never rely on that alias being present.'
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: 'Usopp\'s treasure map has two kinds of directions',
      text: 'Usopp is drawing directions to a cache of supplies he buried, and he catches himself writing two completely different STYLES of instruction without noticing at first. Half his notes read like "from the Grand Line\'s central marker, head twelve degrees north, then east past the second reef" — that\'s an ABSOLUTE path: it means the exact same thing no matter where the reader currently is standing, because it always starts from one fixed, universal reference point. The other half reads like "from here, walk past the tall rock, then turn left at the dead tree" — a RELATIVE path, and Usopp realizes with growing horror that this half of the map is completely useless to anyone not standing in the exact spot he was standing when he wrote it. Worse, Chopper later tries to use the "walk past the tall rock" directions from a totally different starting point on the island and ends up somewhere completely wrong — not because the directions were false, but because relative directions silently mean something different depending on where you start. Nami\'s fix, once she sees the map, is exactly the rule this lesson teaches: for anything meant to be followed reliably by someone else, from an unknown starting point (a script, in our world), write ABSOLUTE directions from the one fixed reference point everyone shares. For quick in-the-moment directions between people already standing together, relative is fine, and honestly faster. Same map-reading skill, two different jobs.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Joey\'s "the store next to the place with the awning" directions',
      text: 'Joey tries to give Ross directions to a sandwich shop: "it\'s next to the place with the blue awning, across from where the newsstand used to be." Ross, standing in a completely different part of the city at the time, has no idea what any of that means — it\'s a RELATIVE description, entirely dependent on where you\'re currently standing, and Joey never once considered that Ross wasn\'t standing next to him when he memorized it. Chandler, mildly exasperated, just looks it up and reads out the full street address instead — an ABSOLUTE reference that means the same thing to literally anyone, anywhere in the city, with zero shared context required. Both work. Joey\'s style is genuinely faster and more natural when you\'re already standing together and just need to get to the next block. Chandler\'s style is the only one that survives being written down and handed to a stranger, or texted to someone across town — which is exactly why this course insists on absolute paths inside scripts (Part 4) even though relative paths feel more natural typing interactively at your own prompt.'
    },
    why: 'Absolute paths are a street address: unambiguous to anyone, anywhere, no shared context needed — use them in anything that has to work reliably away from you (scripts). Relative paths are "next to the place with the awning": faster in the moment, but silently means something different depending on where the reader is currently standing.'
  },
  tech: [
    {
      q: 'Why does the shell expand a glob like *.log BEFORE the command runs, instead of the command doing its own pattern matching?',
      a: 'This is a deliberate, load-bearing design choice, not an accident: it means EVERY command automatically gets wildcard support for free, without each individual program\'s author having to implement pattern matching themselves. The shell does the expansion once, uniformly, and hands the resulting list of real filenames to whatever command you ran — cp, rm, grep, a script you wrote yourself — all identically. The cost of this design is the exact gotcha mentioned in the concept section: if a glob matches nothing, most shells pass the literal unexpanded text through rather than an empty argument list, which can surprise a program expecting real filenames. (Some shells, including bash with "shopt -s nullglob" set, can be configured to change this — worth knowing exists, rarely the default.)'
    },
    {
      q: 'Why does cp need -r for directories but mv doesn\'t?',
      a: 'Because the two operations are fundamentally different underneath, even though they look similar at the command line. Copying a directory genuinely means reading every file inside it and writing new copies — an operation that has to recurse into subdirectories, hence the explicit -r flag as a safety acknowledgment ("yes, I understand this touches everything inside"). Moving, when source and destination are on the SAME filesystem, is almost always just a metadata update — the actual data doesn\'t move at all, only the directory entry pointing to it changes — so there\'s no recursion happening and no flag needed. (The exception: moving ACROSS filesystems, e.g. to a different mounted disk, secretly becomes a copy-then-delete under the hood, which is part of why mv can occasionally be surprisingly slow for a "just a rename" operation.)'
    },
    {
      q: 'Why is tail -f specifically useful, versus just running tail again and again?',
      a: 'tail -f keeps the file descriptor open and blocks, waiting for new data, printing each new line the instant it\'s written — genuinely real-time, event-driven behavior, not polling. Re-running plain tail repeatedly would work in a crude sense but wastes effort re-reading and re-printing the same lines every time, introduces a visible delay between when a line is written and when you\'d next happen to check, and is simply more typing. tail -f is the standard way to "watch a log live" while debugging a running service — you\'ll use it constantly from Part 2 onward, and it directly foreshadows how log-tailing works inside a running Docker container in the next course.'
    }
  ],
  code: {
    title: 'A realistic file-wrangling session',
    intro: 'Every line is safe to try in a scratch directory — make one first so there\'s nothing important to lose while you experiment: mkdir ~/scratch && cd ~/scratch.',
    code: `$ mkdir -p project/logs project/src
$ touch project/logs/app.log project/logs/error.log project/src/main.py

$ ls project/logs
app.log  error.log

$ echo *.log
*.log
# No match in the CURRENT directory (we're not inside logs/) — the shell passed
# the literal pattern through unchanged, since nothing matched.

$ cd project/logs
$ echo *.log
app.log error.log
# Now it matches — globbing depends entirely on your current directory.

$ cp app.log app.log.bak
$ ls
app.log  app.log.bak  error.log

$ mv error.log error.log.old
$ ls
app.log  app.log.bak  error.log.old

$ cat app.log
(short file — prints entirely, instantly)

$ tail -n 5 error.log.old
(last 5 lines only — perfect for "what just happened")

$ tail -f app.log
# Blocks here, waiting. Open a SECOND terminal, run:
#   echo "new line" >> app.log
# ...and watch it appear instantly in the first terminal. Ctrl+C to stop following.

$ ls project/logs/*.bak project/logs/*.old
# ALWAYS run the ls version of a glob before trusting it in an rm command
project/logs/app.log.bak  project/logs/error.log.old

$ rm project/logs/*.bak project/logs/*.old
# Only run this AFTER the ls above confirmed exactly what would be deleted.`,
    notes: [
      'The <code>echo *.log</code> before and after <code>cd</code> is the single clearest demonstration in this lesson — same pattern, two completely different results, purely because the current directory changed.',
      'This "ls the glob first, rm it second" habit is the cheapest insurance against the single most common Linux beginner disaster.'
    ]
  },
  lab: {
    title: 'Write the real commands',
    prompt: 'For each task, write the exact command on the blank line beneath its comment. Task 1 is done for you.',
    starter: `# Task 1: Create a directory named "backups", including any missing parent directories, in one command: a/b/backups
mkdir -p a/b/backups

# Task 2: Copy the entire directory "src" (and everything inside it) to a new directory "src-copy".


# Task 3: Show only the LAST 20 lines of a file named deploy.log.


# Task 4: List every file in the current directory ending in ".csv" using a wildcard (don't list them by name).


# Task 5: Watch server.log live, printing new lines as they're written.
`,
    checks: [
      { re: '^\\s*cp\\s+-r\\s+src\\s+src-copy\\s*$', flags: 'm', must: true, hint: 'Task 2 needs -r since src is a directory — "cp -r src src-copy".', pass: 'Task 2: cp -r src src-copy ✓' },
      { re: '^\\s*tail\\s+-n\\s*20\\s+deploy\\.log\\s*$', flags: 'm', must: true, hint: 'Task 3: "tail -n 20 deploy.log" shows just the last 20 lines.', pass: 'Task 3: tail -n 20 deploy.log ✓' },
      { re: '^\\s*ls\\s+\\*\\.csv\\s*$', flags: 'm', must: true, hint: 'Task 4: "ls *.csv" uses a wildcard to match every .csv file.', pass: 'Task 4: ls *.csv ✓' },
      { re: '^\\s*tail\\s+-f\\s+server\\.log\\s*$', flags: 'm', must: true, hint: 'Task 5: "tail -f server.log" follows the file live.', pass: 'Task 5: tail -f server.log ✓' }
    ],
    run: 'Try all five in a scratch directory (mkdir ~/scratch && cd ~/scratch) so there\'s nothing real to lose while practicing.',
    solution: `# Task 1: Create a directory named "backups", including any missing parent directories, in one command: a/b/backups
mkdir -p a/b/backups

# Task 2: Copy the entire directory "src" (and everything inside it) to a new directory "src-copy".
cp -r src src-copy

# Task 3: Show only the LAST 20 lines of a file named deploy.log.
tail -n 20 deploy.log

# Task 4: List every file in the current directory ending in ".csv" using a wildcard (don't list them by name).
ls *.csv

# Task 5: Watch server.log live, printing new lines as they're written.
tail -f server.log`,
    notes: [
      'Task 2\'s -r is easy to forget until the moment cp flatly refuses to copy a directory without it — that error message is actually a helpful safety check, not a bug.',
      'tail -f (Task 5) is worth practicing for real: open two terminals, tail -f a file in one, append to it with echo "text" >> file in the other, and watch it appear live.'
    ]
  },
  quiz: [
    {
      q: 'Which of these is an absolute path?',
      options: ['../logs/today.txt', './scripts/deploy.sh', '/var/log/syslog', 'logs/today.txt'],
      correct: 2,
      explain: 'Only /var/log/syslog starts with /, meaning it\'s interpreted from the filesystem root regardless of your current directory. The others are all relative.'
    },
    {
      q: 'You run "echo *.txt" in an empty directory with no .txt files. What happens?',
      options: ['An error is printed', 'It prints nothing at all', 'It prints the literal text "*.txt" unchanged', 'It creates an empty file called *.txt'],
      correct: 2,
      explain: 'When a glob matches nothing, most shells (by default) pass the unexpanded pattern text through as a literal argument rather than an empty list — a real, common source of confusion.'
    },
    {
      q: 'Why does "cp -r somedir dest" need the -r flag but "mv somedir dest" doesn\'t?',
      options: ['mv is simply a newer, smarter command', 'Copying a directory requires recursing into and duplicating every file inside; moving within the same filesystem is usually just a metadata update, no recursion needed', 'rm requires -r too, so this is inconsistent and a known bug', '-r is only cosmetic and has no real effect'],
      correct: 1,
      explain: 'cp genuinely has to read and duplicate every file in the tree, hence the explicit recursive flag. mv on the same filesystem just repoints a directory entry — no recursion, no flag required.'
    },
    {
      q: 'Which tool would you use to watch a log file live while a service is running and writing to it?',
      options: ['cat file', 'head file', 'tail -f file', 'less file (with no special flags)'],
      correct: 2,
      explain: 'tail -f keeps the file open and prints new lines as they\'re written — the standard way to watch a live log.'
    },
    {
      q: 'What is the single biggest safety habit for avoiding an rm disaster with a wildcard?',
      options: ['Always use rm -rf to be thorough', 'Run the equivalent ls on the same pattern first, and only rm it once the listed files look correct', 'Never use wildcards with rm, ever, under any circumstances', 'Rename files to avoid needing wildcards at all'],
      correct: 1,
      explain: 'Previewing exactly what a glob matches with ls before handing that same pattern to rm is the cheapest, most effective habit against deleting the wrong thing.'
    }
  ],
  pitfalls: [
    'Running rm -rf with a variable path that could be empty or unset — "rm -rf \\"$DIR/\\"*" silently becomes "rm -rf /*" if $DIR is empty. Part 4\'s bash-scripting-advanced lesson covers set -u, which turns this into an immediate error instead of a catastrophe.',
    'Trusting a relative path inside a script without checking what directory the script actually runs from — the exact same script can behave completely differently depending on the caller\'s current directory. Prefer absolute paths in scripts (Part 4 makes this explicit).',
    'Using cat on a file you don\'t know the size of. A multi-gigabyte log dumped straight to your terminal is, at best, an annoying wait — use less or head first to check what you\'re dealing with.'
  ],
  interview: [
    {
      q: 'What\'s the difference between an absolute and a relative path, and when would you deliberately choose each?',
      a: 'An absolute path starts from the filesystem root (/) and means the same location regardless of where it\'s referenced from. A relative path is interpreted starting from the current working directory, so the identical text can resolve to different files depending on context. I\'d choose absolute paths inside scripts and any automation, since the script\'s working directory at execution time often isn\'t guaranteed or known in advance — a relative path there is a latent bug. I\'d choose relative paths for everyday interactive typing, where they\'re shorter and the current directory is exactly what I have in mind anyway.'
    },
    {
      q: 'Explain what happens, step by step, when you run "rm *.log" in a directory.',
      a: 'Before rm ever runs, the SHELL expands the *.log glob into a literal list of matching filenames in the current directory — this expansion happens entirely client-side, before the command sees anything. rm then receives that expanded list of real filenames as ordinary arguments and deletes each one — it has no special wildcard-handling logic of its own; as far as rm is concerned, it was just handed several exact filenames. One important edge case: if no file matches *.log, most shells pass the literal unexpanded text "*.log" through instead, and rm would then report that no file literally named *.log exists.'
    },
    {
      q: 'Why is tail -f described as event-driven rather than polling, and why does that distinction matter?',
      a: 'tail -f keeps a file descriptor open on the target file and relies on the OS to notify it (or efficiently checks for growth) as new data is appended, printing new lines essentially the instant they\'re written — it doesn\'t sit in a loop repeatedly re-reading the whole file on a timer. The distinction matters practically: polling wastes CPU re-reading unchanged data and introduces a visible lag between when a line is written and when you\'d notice it, while tail -f gives near-real-time visibility with minimal overhead — the reason it\'s the standard tool for watching a live log during debugging.'
    },
    {
      q: 'What real-world habits prevent the classic "accidentally deleted the wrong files" disaster?',
      a: 'Three concrete habits: run the equivalent ls on any glob pattern before running rm on that same pattern, so you see exactly what would be affected before it\'s irreversible; never build rm -rf paths from variables without validating they\'re non-empty first (or using set -u in scripts, Part 4, so an unset variable is a hard error rather than silently expanding to nothing and turning a scoped delete into a root-level one); and treat -rf specifically as a flag that demands you slow down and re-read the full command before pressing Enter, every single time, no matter how routine the task feels.'
    }
  ]
};
