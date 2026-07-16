window.LESSONS = window.LESSONS || {};
window.LESSONS['redirection-pipes'] = {
  id: 'redirection-pipes',
  title: 'stdin, stdout, stderr: Redirection & Pipes',
  category: 'Part 3 — Text, Pipes & Regex',
  timeMin: 35,
  summary: 'Almost every command you\'ve run so far has quietly printed to your terminal — but "the terminal" is just the default destination, not a special one. This lesson opens up the three data streams every process has (stdin, stdout, stderr), how to redirect them to files, and how to pipe one command\'s output directly into another\'s input — the single idea that makes the Unix command line as composable as it is, and the direct foundation for the next four lessons (grep, regex, sed/awk) all being chained together in real pipelines.',
  goals: [
    'Explain what stdin, stdout, and stderr are, and their conventional file descriptor numbers (0, 1, 2)',
    'Redirect stdout to a file with > and append with >>',
    'Redirect stderr separately from stdout, and explain why that separation is useful',
    'Chain commands together with | (pipe), and explain what a pipe actually connects',
    'Read a multi-stage pipeline and predict what data flows through each stage'
  ],
  concept: [
    {
      h: 'Every process has three streams: stdin, stdout, stderr',
      p: [
        'By convention, every process starts with three open data streams, numbered as <b>file descriptors</b>: <b>0 = stdin</b> (standard input — where a command reads input FROM, by default your keyboard), <b>1 = stdout</b> (standard output — where normal results get printed, by default your terminal), and <b>2 = stderr</b> (standard error — where error/diagnostic messages get printed, ALSO by default your terminal, which is exactly why the next section matters). When a command just "prints something," that\'s writing to stdout; when it prints a warning or error, a well-behaved program writes that to stderr specifically, deliberately kept SEPARATE from stdout even though both land in the same terminal window by default.',
        'This three-stream model is what makes a command genuinely reusable in different contexts — the same <code>grep</code> that reads your keyboard input interactively can, with zero code changes, read from a file, or from another command\'s output, because "stdin" is an abstract concept the program doesn\'t need to know the concrete source of.'
      ]
    },
    {
      h: 'Redirection: sending a stream somewhere other than the terminal',
      p: [
        '<code>command > file</code> redirects stdout to a file, OVERWRITING it if it already exists — a genuinely common accidental-data-loss mistake worth internalizing early. <code>command >> file</code> redirects stdout and APPENDS instead, preserving whatever was already there. Both work purely on stdout by default — errors still print to your terminal even with a plain <code>></code>, which surprises people the first time a "silent" redirected command still spits out an error message on screen.',
        'To redirect stderr specifically, use its file descriptor number explicitly: <code>command 2> errors.txt</code> sends ONLY stderr to that file, leaving stdout alone. <code>command > out.txt 2>&1</code> redirects stdout to a file, then redirects stderr to wherever stdout is NOW pointing (the file) — the <code>2>&1</code> syntax means "descriptor 2, same target as descriptor 1," and it matters that it comes AFTER the stdout redirect, since order determines what "wherever stdout is now" actually resolves to. <code>command < file</code> redirects stdin, making a command read from a file instead of the keyboard.',
        '<div class="math">command > out.txt 2>&1<br>│       │        └─── stderr → same place stdout now points (out.txt)<br>│       └──────────── stdout → out.txt<br>└──────────────────── the command itself<span class="mnote">Read left to right, in order: stdout is redirected to out.txt FIRST, then stderr is pointed at wherever stdout currently goes. Reverse the order (2>&1 > out.txt) and stderr would still go to the terminal.</span></div>'
      ]
    },
    {
      h: 'Pipes: wiring one command\'s stdout to the next command\'s stdin',
      p: [
        'The <code>|</code> (pipe) operator connects two commands directly: <code>command1 | command2</code> takes command1\'s STDOUT and feeds it in as command2\'s STDIN, without ever touching a file on disk in between. This is the single idea behind the entire "small tools, combined" Unix philosophy — <code>ps aux | grep nginx</code> doesn\'t require <code>grep</code> to know anything about processes, and doesn\'t require <code>ps</code> to know anything about filtering; each tool does one thing, and the pipe is the universal connector between any two of them.',
        'Pipes chain arbitrarily long: <code>cat access.log | grep ERROR | wc -l</code> reads a file, filters to only lines containing "ERROR," then counts how many lines remain — three genuinely independent, reusable tools, composed into a specific answer none of them individually provides. Each stage in the chain starts running as soon as data is available, not waiting for the previous stage to fully finish — which is why a pipeline can process a live, ongoing stream of data, not just static files.'
      ]
    },
    {
      h: 'Reading a pipeline: trace the data, stage by stage',
      p: [
        'The skill this whole lesson is building toward is reading an unfamiliar multi-stage pipeline and predicting what flows through each stage — exactly the skill the next four lessons (grep, regex, sed/awk) depend on constantly. The trick is mechanical: start from the leftmost command, note what its stdout looks like, then treat that as the NEXT command\'s stdin, one stage at a time, never trying to hold the whole pipeline in your head at once.',
        'Common building blocks worth recognizing on sight: <code>cat file</code> (dump a file\'s contents to stdout — often the first stage of a pipeline reading from a file), <code>wc -l</code> (count lines from stdin), <code>sort</code> (sort lines from stdin), <code>uniq</code> (collapse ADJACENT duplicate lines — usually paired with sort first, since uniq only catches duplicates that are next to each other), <code>head</code>/<code>tail</code> (first/last N lines). <code>sort file.txt | uniq -c | sort -rn</code> — sort the file, collapse adjacent duplicates while counting them, then sort by that count descending — is a genuinely common one-liner for "what are the most frequent lines in this file," and it reads perfectly cleanly once you trace it stage by stage instead of trying to parse it all at once.'
      ]
    }
  ],
  conceptFlow: {
    title: 'cat log.txt | grep ERROR | wc -l — tracing the pipeline',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Stage 1',
        nodes: [
          { id: 'cat', text: 'cat log.txt\nreads the file' }
        ]
      },
      {
        label: 'What flows to stage 2',
        nodes: [
          { id: 'catstdout', text: 'stdout: ALL lines\nof log.txt, in order' }
        ]
      },
      {
        label: 'Stage 2',
        nodes: [
          { id: 'grep', text: 'grep ERROR\nfilters stdin' }
        ]
      },
      {
        label: 'What flows to stage 3',
        nodes: [
          { id: 'grepstdout', text: 'stdout: ONLY the lines\ncontaining "ERROR"' }
        ]
      },
      {
        label: 'Stage 3',
        nodes: [
          { id: 'wc', text: 'wc -l\ncounts lines from stdin' }
        ]
      },
      {
        label: 'Final result',
        nodes: [
          { id: 'result', text: 'A single number:\nhow many ERROR lines' }
        ]
      }
    ],
    steps: [
      { active: ['cat'], note: 'cat\'s job is simple: read the file and write every line to its own stdout, unmodified.' },
      { active: ['catstdout'], note: 'cat\'s stdout — the ENTIRE file, every line — becomes grep\'s stdin. Nothing is filtered yet at this point.' },
      { active: ['grep'], note: 'grep reads that full stream from its stdin and writes out only the lines matching "ERROR" — everything else is simply not passed through.' },
      { active: ['grepstdout'], note: 'grep\'s stdout — now just the ERROR lines, a strict subset of the original file — becomes wc\'s stdin.' },
      { active: ['wc'], note: 'wc -l counts how many lines arrive on its stdin — it has no idea those lines came from a file, then a filter; it just counts whatever stream it\'s handed.' },
      { active: ['result'], note: 'The final output is one number: the count of ERROR lines. Each tool did exactly one simple thing; the pipe is what combined them into an answer none of the three provides alone.' }
    ]
  },
  story: {
    onePiece: {
      title: 'The Sunny\'s Galley Line: One Cook\'s Output Is the Next One\'s Input',
      text: 'Sanji runs the Sunny\'s kitchen during a big feast like an assembly line, and it only works because every station\'s output is exactly the next station\'s input, with nothing lost or renamed in between. Station one preps the fish — nothing fancy, just clean and portion it, and whatever comes off that station goes DIRECTLY to station two, no detour through a side table, no re-explaining what it is. Station two seasons and sears exactly what arrived, without needing to know or care how the fish got prepped, only that it arrived ready for searing. Station three plates it, again taking exactly what arrived from searing and nothing else. The genius of the line, which a distracted new hand named Chopper-filling-in-for-a-day nearly wrecks, is that each cook is a completely independent expert doing ONE job — nobody at station two needs to know how to fillet a fish, nobody at station three needs to know a thing about seasoning — and the connections between stations are exactly as simple and uniform as "whatever came out of the last one goes into the next one, unchanged, immediately." When Chopper tries to "help" by taking the prepped fish, writing a little note about it, setting it aside, and letting Sanji come collect it personally later, the whole line grinds to a halt — not because Chopper did anything wrong exactly, just because he broke the one rule that made it a LINE instead of three separate, disconnected jobs: the output of one station has to flow straight into the next, or there\'s no line at all, just three cooks working in isolation.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Restaurant Kitchen Line, and the One Time the Chain Broke',
      text: 'When Monica finally makes it as a head chef, the kitchen she runs is a direct, unglamorous lesson in exactly this idea, and the one time it breaks down is instructive. Line cooks each own one job — the grill station, the sauté station, the plating station — and a ticket flows through them in strict sequence: whatever the grill station finishes gets handed DIRECTLY to sauté, which hands DIRECTLY to plating, no stops in between, no cook needing to understand the station before or after their own beyond "here\'s what arrives, here\'s what I send onward." It runs beautifully, ticket after ticket, precisely because nobody\'s trying to be a generalist — each cook is narrowly excellent at exactly one transformation. The one dinner service it visibly breaks is the night an inexperienced fill-in insists on personally walking each half-finished plate back to Monica for a full inspection between every single station "just to be safe," instead of passing it straight to the next station the way the line is designed to work. Tickets back up immediately, the pass goes cold, and Monica — mid-service, genuinely alarmed — has to explain, fast: the whole point of the line is that each station\'s output goes STRAIGHT to the next station\'s input, with nobody in between re-checking or re-routing it. The instant you insert an extra manual stop into that chain, it stops being a line and starts being a bottleneck.'
    },
    why: 'A pipe doesn\'t just "connect two commands loosely" — it wires one command\'s stdout DIRECTLY into the next command\'s stdin, streaming, with nothing manually collected and re-delivered in between. Break that direct connection (route through an intermediate file you have to remember to clean up, or a manual step) and you don\'t have a pipeline anymore, you have several disconnected jobs that happen to run near each other.'
  },
  tech: [
    {
      q: 'Why does "command > out.txt" still print error messages to the terminal, even though the command\'s normal output goes silently to the file?',
      a: 'Because a plain ">" redirects ONLY file descriptor 1 (stdout) — stderr (descriptor 2) is a completely separate stream that isn\'t touched at all unless you redirect it explicitly. This is deliberate, not an oversight: it means you can capture a command\'s actual output to a file while still seeing any errors immediately on screen, without having to go open the file to discover something went wrong. If you genuinely want errors captured too, that requires an explicit "2>" or "2>&1" — the separation exists specifically so silencing normal output doesn\'t accidentally silence problems along with it.'
    },
    {
      q: 'Why does "command 2>&1 > out.txt" (stderr redirect BEFORE stdout redirect) behave differently from "command > out.txt 2>&1"?',
      a: 'Redirection operators are applied left to right, and "2>&1" means "point descriptor 2 at wherever descriptor 1 CURRENTLY points" — a snapshot at that moment, not an ongoing link. In "2>&1 > out.txt": at the time "2>&1" runs, descriptor 1 is still the terminal, so stderr gets pointed at the terminal too — THEN descriptor 1 itself gets redirected to out.txt, but stderr\'s already-resolved target doesn\'t follow along. In "> out.txt 2>&1": descriptor 1 is redirected to out.txt FIRST, so when "2>&1" runs, "wherever descriptor 1 currently points" correctly resolves to out.txt, and both streams end up there. Order genuinely changes the outcome — this is one of the most common redirection mistakes.'
    },
    {
      q: 'Why can a pipeline like "tail -f log.txt | grep ERROR" process a live, continuously-growing file, rather than needing the file to be complete first?',
      a: 'Because a pipe is a streaming connection, not a batch hand-off — each stage starts consuming and producing data as soon as it\'s available, rather than the whole pipeline waiting for the first command to fully finish before the next one starts. "tail -f" specifically keeps running and emitting new lines as they\'re appended to the file (instead of exiting after printing the existing tail); grep, reading from a pipe rather than a finite file, likewise just keeps processing whatever new lines arrive on its stdin, checking each one as it comes rather than waiting to see the whole input first. This is exactly how a live log-monitoring one-liner works, and it only works because pipes are streams, not one-shot file transfers.'
    }
  ],
  code: {
    title: 'Redirection and pipes, hands-on',
    intro: 'Try each of these in a scratch directory — nothing here touches anything important.',
    code: `$ echo "hello" > greeting.txt
$ cat greeting.txt
hello

$ echo "world" > greeting.txt
$ cat greeting.txt
world
# ">" OVERWROTE the file — "hello" is gone.

$ echo "again" >> greeting.txt
$ cat greeting.txt
world
again
# ">>" APPENDED instead.

$ ls /nonexistent-dir 2> errors.txt
$ cat errors.txt
ls: cannot access '/nonexistent-dir': No such file or directory
# stderr captured to a file; nothing printed to the terminal.

$ ls /nonexistent-dir > out.txt 2>&1
$ cat out.txt
ls: cannot access '/nonexistent-dir': No such file or directory
# Both stdout (empty, since ls failed) and stderr landed in out.txt.

$ ps aux | grep nginx
nami     2201  0.0  0.1  ...  nginx: master process
nami     2202  0.0  0.1  ...  nginx: worker process
# ps's stdout became grep's stdin.

$ cat access.log | grep ERROR | wc -l
47
# Three independent tools, chained: read, filter, count.

$ sort names.txt | uniq -c | sort -rn | head -3
   5 zoro
   3 nami
   2 sanji
# Most frequent lines in names.txt, top 3.`,
    notes: [
      'A very common gotcha: "grep ERROR log.txt > log.txt" (redirecting a file to a filter reading FROM the same file) can truncate the file to empty before grep ever reads it — the shell opens the output file for writing before the command even runs.',
      '"cat file | grep pattern" works but is sometimes called a "useless use of cat" — "grep pattern file" does the same thing with one fewer process, since grep can read a file directly.'
    ]
  },
  lab: {
    title: 'Write the redirection and pipeline commands',
    prompt: 'Write the exact command for each task below.',
    starter: `# Task: run "build.sh" and send its normal output to build.log, OVERWRITING any previous contents


# Task: run "build.sh" and send its normal output to build.log, APPENDING to previous contents


# Task: run "deploy.sh", sending stdout AND stderr both into one file called deploy.log


# Task: count how many lines in access.log contain the word "ERROR" (one pipeline)

`,
    checks: [
      { re: 'build\\.sh\\s*>\\s*build\\.log(?!\\s*2>)', flags: 'i', must: true, hint: '"build.sh > build.log" redirects stdout, overwriting.', pass: 'build.sh > build.log ✓' },
      { re: 'build\\.sh\\s*>>\\s*build\\.log', flags: 'i', must: true, hint: '"build.sh >> build.log" redirects stdout, appending.', pass: 'build.sh >> build.log ✓' },
      { re: 'deploy\\.sh\\s*>\\s*deploy\\.log\\s*2>&1', flags: 'i', must: true, hint: '"deploy.sh > deploy.log 2>&1" sends stdout to the file, then points stderr at the same place.', pass: 'deploy.sh > deploy.log 2>&1 ✓' },
      { re: 'grep\\s+.?ERROR.?\\s+access\\.log\\s*\\|\\s*wc\\s+-l', flags: 'i', must: true, hint: '"grep ERROR access.log | wc -l" filters then counts.', pass: 'grep ERROR access.log | wc -l ✓' }
    ],
    run: 'Try it for real: run "echo test > f.txt", then "echo more >> f.txt", then "cat f.txt" to see both redirection modes in action.',
    solution: `# Task: run "build.sh" and send its normal output to build.log, OVERWRITING any previous contents
build.sh > build.log

# Task: run "build.sh" and send its normal output to build.log, APPENDING to previous contents
build.sh >> build.log

# Task: run "deploy.sh", sending stdout AND stderr both into one file called deploy.log
deploy.sh > deploy.log 2>&1

# Task: count how many lines in access.log contain the word "ERROR" (one pipeline)
grep ERROR access.log | wc -l`,
    notes: [
      'Note the last task doesn\'t strictly need "cat access.log | grep ERROR" — grep can read a file directly, avoiding an unnecessary extra process.',
      'The order in "deploy.sh > deploy.log 2>&1" matters — see this lesson\'s tech Q&A for exactly why reversing it changes the outcome.'
    ]
  },
  quiz: [
    {
      q: 'What are the conventional file descriptor numbers for stdin, stdout, and stderr?',
      options: ['1, 2, 3', '0, 1, 2', '0, 1, -1', 'stdin and stdout share 0; stderr is 1'],
      correct: 1,
      explain: 'stdin = 0, stdout = 1, stderr = 2 — this numbering is why "2>" specifically means "redirect stderr."'
    },
    {
      q: 'What\'s the difference between > and >> when redirecting stdout to a file?',
      options: ['No difference; they\'re interchangeable', '> overwrites the file; >> appends to it', '> appends; >> overwrites', '> is for stdout, >> is for stderr'],
      correct: 1,
      explain: '> truncates and overwrites the target file if it exists; >> appends to whatever is already there, preserving it.'
    },
    {
      q: 'What does the pipe operator ( | ) connect?',
      options: ['One command\'s stderr to the next command\'s stdin', 'One command\'s stdout to the next command\'s stdin', 'Two files together', 'One command\'s exit code to the next command\'s input'],
      correct: 1,
      explain: 'A pipe takes the LEFT command\'s stdout and feeds it directly in as the RIGHT command\'s stdin — no file on disk involved.'
    },
    {
      q: 'Why does "command 2>&1 > out.txt" NOT capture stderr into out.txt, while "command > out.txt 2>&1" does?',
      options: ['Redirection order is irrelevant; both should behave identically', '"2>&1" points stderr at wherever stdout points AT THAT MOMENT — order determines what that resolves to', 'The first form is simply invalid syntax', '"2>&1" always refers to the terminal specifically, regardless of position'],
      correct: 1,
      explain: '"2>&1" is resolved left-to-right at the moment it runs. If it comes before ">out.txt", stdout is still the terminal at that point, so stderr gets pointed at the terminal too — then stdout alone gets redirected afterward.'
    },
    {
      q: 'In "cat log.txt | grep ERROR | wc -l", what does wc -l actually count?',
      options: ['The total number of lines in log.txt, regardless of content', 'The number of lines from log.txt that contain "ERROR"', 'The number of times grep was run', 'The number of characters in log.txt'],
      correct: 1,
      explain: 'wc -l counts whatever lines arrive on ITS stdin — which, after passing through grep ERROR, is only the subset of log.txt\'s lines that actually contain "ERROR."'
    }
  ],
  pitfalls: [
    'Redirecting a command\'s output to the SAME file it\'s reading from (like "grep x file.txt > file.txt") — the shell truncates the output file before the command even runs, often destroying the input before it can be read.',
    'Assuming a plain "> file.txt" silences ALL output — it only redirects stdout; error messages on stderr still print to the terminal unless redirected separately.',
    'Writing "2>&1 > file" and expecting stderr captured — redirection order matters; stderr only follows stdout\'s NEW destination if the stdout redirect happens first.'
  ],
  interview: [
    {
      q: 'Explain stdin, stdout, and stderr, and why keeping stdout and stderr separate (even though both default to the terminal) is useful.',
      a: 'stdin (0), stdout (1), and stderr (2) are the three standard data streams every process starts with — stdin for input, stdout for normal output, stderr for errors/diagnostics. Keeping stdout and stderr separate, even though both print to the terminal by default, matters because it lets you redirect ONE without affecting the other — capture a command\'s real output to a file for later processing while still seeing errors immediately on screen, or vice versa. If they were a single combined stream, you\'d lose the ability to treat "the actual result" and "problems that occurred while producing it" as independently redirectable.'
    },
    {
      q: 'What does a pipe actually do at the OS level, and why does that make streaming pipelines (like tail -f | grep) possible?',
      a: 'A pipe connects one process\'s stdout file descriptor directly to another process\'s stdin file descriptor, as a kernel-managed buffer — data written by the first process becomes readable by the second essentially immediately, without ever being written to a file on disk. Because it\'s a live, streaming connection rather than a one-shot batch hand-off, each stage can start processing data as soon as any is available, rather than waiting for the previous stage to fully finish. That\'s exactly why "tail -f log.txt | grep ERROR" works on a live, continuously-growing file: tail keeps emitting new lines as they arrive, and grep keeps checking each one as it comes, neither one ever needing the input to be "done."'
    },
    {
      q: 'Walk through how you\'d read an unfamiliar pipeline like "sort access.log | uniq -c | sort -rn | head -5" and explain what it computes.',
      a: 'Read stage by stage, left to right, tracking what flows out of each into the next. "sort access.log" outputs every line of the file, sorted alphabetically — this groups identical lines adjacent to each other. "uniq -c" then collapses adjacent duplicate lines into one, prefixed with a count of how many times each occurred (which only works correctly because the input is already sorted — uniq only catches ADJACENT duplicates). "sort -rn" then re-sorts those counted lines numerically, descending, by that count. "head -5" takes just the first five. End to end: this computes the 5 most frequent lines in access.log, each shown with its occurrence count — a genuinely common one-liner for finding the most common log entries, IP addresses, or error messages in a file.'
    },
    {
      q: 'Why is "each program does one thing and pipes connect them" considered a foundational Unix design philosophy, rather than just a convenient trick?',
      a: 'It means individual tools can stay small, focused, and independently reliable — grep only needs to be excellent at pattern matching, wc only needs to be excellent at counting, neither needs to know anything about the other\'s existence or the broader task they\'re jointly accomplishing. New capability emerges from COMBINING existing tools in a pipeline rather than writing a new bespoke program for every specific task — "count how many log lines mention a specific error" doesn\'t require a purpose-built tool, it requires knowing how to combine grep and wc, which you already have. This composability is also why the stream-based stdin/stdout/stderr model matters so much: it\'s the uniform interface that lets genuinely unrelated programs, written by different people for different purposes, be wired together interchangeably.'
    }
  ]
};
