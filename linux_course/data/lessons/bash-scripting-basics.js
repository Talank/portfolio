window.LESSONS = window.LESSONS || {};
window.LESSONS['bash-scripting-basics'] = {
  id: 'bash-scripting-basics',
  title: 'Bash Scripting Basics: Shebang, Variables, Quoting, Arguments, Exit Codes',
  category: 'Part 4 — Shell & Bash Scripting',
  timeMin: 45,
  summary: 'Every command run so far has been typed one at a time. A script is just those same commands saved to a file and run as one unit — but writing one that actually behaves correctly requires four specific pieces: telling the system how to interpret it, storing and safely quoting values, reading in whatever arguments it was called with, and reporting back whether it succeeded. This lesson covers all four, the minimum needed to write a genuinely correct first real script.',
  goals: [
    'Explain what a shebang line is and why #!/usr/bin/env bash is often preferred over #!/bin/bash',
    'Declare and read shell variables correctly, with no spaces around =',
    'Explain why unquoted variables are dangerous, and quote them correctly',
    'Read command-line arguments using $1, $2, $@, and $#',
    'Explain exit codes, read $?, and set a script\'s own exit code deliberately'
  ],
  concept: [
    {
      h: 'The shebang: telling the system how to run this file',
      p: [
        'The very first line of a script — <code>#!/bin/bash</code> — is called a <b>shebang</b> (from "sharp" + "bang," the names of # and !). It is not a comment in the usual sense; the kernel specifically reads this exact line to know which interpreter should run the rest of the file. Without it, running <code>./script.sh</code> directly can fail or, worse, silently run under the WRONG shell if one happens to be assumed — <code>bash script.sh</code> would work regardless of the shebang (you are explicitly telling bash to run it), but <code>./script.sh</code> relies entirely on the shebang to know what to do.',
        '<code>#!/usr/bin/env bash</code> is often preferred over a hardcoded <code>#!/bin/bash</code> because it looks up "bash" via PATH (the previous lesson\'s entire subject) rather than assuming a fixed location — genuinely relevant across different systems, since bash lives at <code>/bin/bash</code> on most Linux distributions but a Homebrew-installed, more modern bash on a Mac often lives somewhere entirely different, like <code>/opt/homebrew/bin/bash</code>. <code>env</code>-style shebangs resolve correctly on both without modification; a hardcoded path silently breaks (or silently runs an old, different bash version) the moment the assumption does not hold.'
      ]
    },
    {
      h: 'Variables: no spaces around =, and quoting matters enormously',
      p: [
        'Declaring a variable is <code>name=value</code> — critically, with NO spaces around the equals sign; <code>name = value</code> is a genuinely common beginner error, and bash interprets it completely differently (as trying to run a command called "name" with arguments "=" and "value"). Reading a variable\'s value requires a <code>$</code> prefix: <code>echo $name</code>, or the more explicit <code>echo ${name}</code>, useful when the variable name needs to be clearly delimited from surrounding text (like <code>${name}_backup.txt</code>, where <code>$name_backup</code> without braces would incorrectly be read as one variable named "name_backup").',
        'Quoting an expanded variable — <code>"$name"</code> rather than a bare <code>$name</code> — matters far more than it looks. An UNQUOTED variable containing spaces gets <b>word-split</b> by the shell into multiple separate arguments, and can also be subject to glob expansion, before whatever command receives it ever sees it. A variable holding <code>"my file.txt"</code>, used unquoted, is silently handed to the next command as TWO separate arguments, "my" and "file.txt" — not the single filename that was actually intended. Quoting it as <code>"$name"</code> preserves it as exactly one value, spaces and all. The practical rule: quote variable expansions by default, always, unless there is a specific, understood reason not to.'
      ]
    },
    {
      h: 'Reading arguments: $1, $2, $@, $#, and $0',
      p: [
        'A script called as <code>./deploy.sh production 3</code> receives its arguments as numbered variables: <code>$1</code> is "production," <code>$2</code> is "3," and so on. <code>$0</code> is special — it holds the NAME OF THE SCRIPT ITSELF, not an argument (useful for error messages that reference the script\'s own name generically, without hardcoding it). <code>$#</code> holds the COUNT of arguments actually passed — checking <code>$#</code> at the top of a script is the standard way to validate "did the caller actually provide what this script requires" before proceeding.',
        '<code>$@</code> expands to ALL the arguments, and — quoted as <code>"$@"</code> specifically — expands to each argument as its OWN separate, correctly preserved item, even if individual arguments themselves contain spaces. This distinction (<code>"$@"</code> vs the subtly different <code>"$*"</code>, which joins everything into one single string) rarely matters for simple scripts but becomes a genuine correctness issue the moment a script forwards its own arguments on to another command.'
      ]
    },
    {
      h: 'Exit codes: how a script reports success or failure',
      p: [
        'Every command, and every script, returns a numeric <b>exit code</b> when it finishes — by strong convention, <code>0</code> means success, and any nonzero value (1 through 255) means some kind of failure, with the specific nonzero number often (though not always) indicating WHICH kind of failure occurred. <code>$?</code> holds the exit code of the MOST RECENTLY finished command — and it is overwritten by literally every subsequent command, including a plain <code>echo</code>, so it must be checked immediately after the command whose result you actually care about, not after any other command runs in between.',
        'Inside a script, <code>exit N</code> ends the script immediately and sets its own exit code to N — <code>exit 0</code> for a deliberate, explicit success, or <code>exit 1</code> (or any other nonzero value that fits your scheme) for a specific failure. This is precisely how the shell\'s <code>&&</code> (run the next command only if the previous one succeeded) and <code>||</code> (run the next command only if the previous one FAILED) actually work underneath — both are directly reading that same exit code convention, and a script that never bothers to set a meaningful exit code cannot be reliably chained with && or || by anything calling it.'
      ]
    }
  ],
  conceptFlow: {
    title: 'command1 && command2 || command3 — tracing exit codes',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Run the first command',
        nodes: [
          { id: 'cmd1', text: 'Run command1' }
        ]
      },
      {
        label: 'Check its exit code',
        nodes: [
          { id: 'success', text: 'Exit code 0 (success)' },
          { id: 'failure', text: 'Exit code nonzero (failure)' }
        ]
      },
      {
        label: 'What happens next',
        nodes: [
          { id: 'runcmd2', text: '&& triggers:\nrun command2' },
          { id: 'skipcmd2', text: '&& does NOT trigger:\ncommand2 is skipped entirely' },
          { id: 'runcmd3', text: '|| triggers:\nrun command3' },
          { id: 'skipcmd3', text: '|| does NOT trigger:\ncommand3 is skipped entirely' }
        ]
      }
    ],
    steps: [
      { active: ['cmd1'], note: 'The chain always starts by actually running command1 and letting it finish.' },
      { active: ['success'], note: 'If command1 exits with code 0 (success by convention), the chain treats it as having succeeded.' },
      { active: ['failure'], note: 'If command1 exits with any nonzero code, the chain treats it as having failed — regardless of what specific number it was.' },
      { active: ['runcmd2'], note: '&& means "AND, but only if the previous step succeeded" — since command1 succeeded, command2 now runs.' },
      { active: ['skipcmd3'], note: 'Because command2 was reached via &&, the || after it only fires if COMMAND2 fails — command2 succeeding means command3 is skipped entirely.' },
      { active: ['skipcmd2'], note: 'If command1 had failed instead, && would NOT trigger — command2 is skipped completely, never even attempted.' },
      { active: ['runcmd3'], note: 'With command2 skipped, the || immediately after it fires instead — || means "OR, run this only if the previous step failed," and here, command1 failing (with command2 never running at all) is exactly that condition.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Sanji\'s Recipe Cards: Method, Ingredients, Portions, and a Report Back',
      text: 'Sanji\'s kitchen runs on recipe cards with a structure so consistent that any cook, even a fill-in who has never worked Baratie before, can pick one up and execute it correctly on the first try. The very top line of every card states, unambiguously, exactly which cooking method applies to everything below it — open flame, oven, cold prep — so nobody downstream has to guess or assume based on whatever station they happen to be standing at; the card itself declares it, once, at the top, and that declaration is authoritative regardless of context. Below that, ingredient amounts are written as clearly bounded units — "one bundle of sea-salt, three fingers wide" is treated as ONE described item, never carelessly scattered across the card as separate loose words that a rushed cook might misread as three unrelated instructions instead of one precise quantity. The card also leaves specific customizable slots meant to be filled in by whoever places the actual order — table number, spice preference, portion count — read directly off the ticket rather than hardcoded into the recipe itself, so the same card correctly serves table three\'s mild order and table seven\'s extra-spicy order without needing two separate cards. And critically, every dish reports back a clear, specific result once finished: a plain, universally understood "ready" signal for success, or — if something went wrong — a SPECIFIC signal identifying exactly what failed (out of an ingredient, overcooked, wrong table), so Sanji, working the pass without personally tasting every single plate, can react correctly to a problem purely from that signal alone, without needing to walk over and inspect it himself first.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Recipe Cards, and the Note Joey Reads Wrong',
      text: 'Monica\'s recipe cards, developed over her career, follow a rigor Chandler once compares — not entirely as an exaggeration — to a legal contract. Every card states its cooking method at the very top, in the same fixed spot every time, specifically so that ANY of her sous chefs can pick it up mid-shift and know immediately how to proceed without asking her directly. The one time this discipline visibly breaks is not Monica\'s fault at all — it is the night she scribbles a quick grocery note for Joey, "get the good olive oil not the cheap one," on a single strip of paper, expecting him to treat it as ONE combined instruction. Joey, reading it at a glance and none too carefully, tears it along a natural crease and treats "get the good olive oil" and "not the cheap one" as two SEPARATE, unrelated errands — and comes back with both a bottle of good olive oil AND, bafflingly, a bottle of the cheap one too, technically satisfying each fragment individually while completely missing what the whole note actually meant together. Monica is speechless in the specific way that only comes from watching someone technically follow instructions while getting the actual intent completely backwards. Her cards, meanwhile, are far more careful: each one takes clearly labeled, fillable slots for things that legitimately vary — guest count, specific dietary substitutions — read directly off whatever event she is cooking for that day, rather than needing an entirely rewritten card each time. And at the end of each dish, there is always a specific, precise verdict recorded — not just "good" or "bad," but which exact thing succeeded or, if not, which exact thing went wrong — because a vague verdict tells nobody what to actually fix.'
    },
    why: 'A script\'s shebang is Sanji\'s method line, stated once and authoritative. Correct quoting is keeping "one bundle of sea-salt" (or Monica\'s whole grocery note) together as ONE item instead of letting it fracture into separate pieces the way Joey\'s torn note did. Arguments are the card\'s fillable slots, read fresh from each specific order rather than baked in. And an exit code is the specific, precise verdict reported back — not just vaguely "it worked" or "it didn\'t," but a number specific enough for whatever is calling the script to react correctly without inspecting it by hand.'
  },
  tech: [
    {
      q: 'Why is "#!/usr/bin/env bash" often considered more portable than a hardcoded "#!/bin/bash"?',
      a: '"#!/usr/bin/env bash" asks the "env" command to locate "bash" via a PATH search at run time, rather than assuming a fixed, hardcoded filesystem location. This matters concretely because bash does not live in the same place on every system — most Linux distributions have it at /bin/bash, but a Mac with a Homebrew-installed, modern version of bash typically has it somewhere else entirely (like /opt/homebrew/bin/bash), with the OLD, pre-installed /bin/bash left in place but several major versions behind. A script hardcoded to "#!/bin/bash" on such a Mac would silently run under that old bash rather than the intended modern one, or fail outright if /bin/bash does not exist at all on some minimal system — the env-based shebang sidesteps the assumption entirely by searching PATH, exactly like typing a bare command name would.'
    },
    {
      q: 'Give a concrete example of a script bug caused specifically by an unquoted variable, and explain the exact mechanism.',
      a: 'Suppose a variable holds a filename with a space: FILE="my notes.txt", then a script runs "rm $FILE" (unquoted). Before "rm" ever sees anything, the shell performs WORD SPLITTING on the unquoted expansion — treating the value as if it were typed directly on the command line, splitting on whitespace — so rm actually receives TWO separate arguments, "my" and "notes.txt", not the one file that was intended. If a file literally named "my" happens to exist, it gets deleted, entirely wrongly, and if "notes.txt" also exists as a separate file, IT gets deleted too — while the actually-intended "my notes.txt" is left completely untouched, since no argument named exactly that was ever passed. Quoting it as "rm \\"$FILE\\"" preserves the value as one single argument, exactly as intended, regardless of any spaces it contains.'
    },
    {
      q: 'Why must $? be checked immediately after the command it refers to, rather than at some later, more convenient point in a script?',
      a: '$? always holds the exit code of the MOST RECENTLY completed command — and it is overwritten by literally the next command that runs, with no exceptions, including something as innocuous as an echo statement used to print a status message. A script that runs a command, then does some unrelated logging or bookkeeping, and THEN checks $? is very likely checking the exit code of that unrelated logging step instead of the command it actually meant to check — a genuinely easy mistake to make, and the standard defensive habit is to capture $? into a named variable immediately ("result=$?") if it needs to be referenced again later in the script, since the named variable will not be silently overwritten by subsequent commands the way $? itself would be.'
    }
  ],
  code: {
    title: 'A small, complete, correctly-written script',
    intro: 'Save this as deploy.sh, chmod +x it, and try running it with different arguments.',
    code: `#!/usr/bin/env bash
# deploy.sh — a small example script demonstrating this lesson's four pieces

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <environment>" >&2
  exit 1
fi

ENVIRONMENT="$1"
LOG_FILE="/tmp/deploy_\${ENVIRONMENT}.log"

echo "Deploying to: $ENVIRONMENT"
echo "Log file: $LOG_FILE"

echo "Starting deploy..." > "$LOG_FILE"

if [ "$ENVIRONMENT" = "production" ]; then
  echo "Production deploy — extra safety checks would go here."
fi

echo "Deploy finished." >> "$LOG_FILE"
exit 0`,
    notes: [
      'Try running it with zero arguments ("./deploy.sh") and check "echo $?" right after — it should print 1, matching the explicit "exit 1" for the missing-argument case.',
      '"${ENVIRONMENT}" (with braces) is used in the log filename specifically because it is immediately followed by more text (".log") — without braces, "$ENVIRONMENT.log" would be read as one variable named "ENVIRONMENT.log", which does not exist.'
    ]
  },
  lab: {
    title: 'Fix and complete a small script',
    prompt: 'Fill in the four blanks below to make this script correct: a proper shebang, correct variable quoting, an argument-count check using $#, and a deliberate exit code.',
    starter: `___________________
# greet.sh

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <name>" >&2
  ___________________
fi

NAME=$1
echo "Hello, ___________________!"

___________________`,
    checks: [
      { re: '#!\\s*/usr/bin/env\\s+bash|#!\\s*/bin/bash', flags: '', must: true, hint: 'A shebang like #!/usr/bin/env bash (or #!/bin/bash) must be the first line.', pass: 'Shebang present ✓' },
      { re: 'exit\\s+1', flags: '', must: true, hint: 'exit 1 signals failure when the required argument is missing.', pass: 'exit 1 on missing argument ✓' },
      { re: '"\\$NAME"', flags: '', must: true, hint: '"$NAME" (quoted) prevents word-splitting if the name contains a space.', pass: '"$NAME" quoted correctly ✓' },
      { re: 'exit\\s+0', flags: '', must: true, hint: 'exit 0 signals success at the end of the script.', pass: 'exit 0 at the end ✓' }
    ],
    run: 'Try it for real: save it, chmod +x greet.sh, run ./greet.sh (no args, should fail) and ./greet.sh "Nami" (should succeed).',
    solution: `#!/usr/bin/env bash
# greet.sh

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <name>" >&2
  exit 1
fi

NAME=$1
echo "Hello, "$NAME"!"

exit 0`,
    notes: [
      'This lab checks the pieces independently — in the real solution, "$NAME" should appear quoted wherever it is used, exactly as shown.',
      'echo "$?" immediately after each run is the fastest way to confirm the exit code actually matches what was intended.'
    ]
  },
  quiz: [
    {
      q: 'What is the purpose of the shebang line at the top of a script?',
      options: ['It is just a comment describing the script', 'It tells the system which interpreter should run the rest of the file', 'It sets the script\'s exit code', 'It is required only for Python scripts, not bash'],
      correct: 1,
      explain: 'The shebang (#!/bin/bash or similar) tells the kernel exactly which interpreter to hand the rest of the file to — essential when running a script via ./script.sh rather than explicitly with "bash script.sh".'
    },
    {
      q: 'Why is "name = value" (with spaces around =) incorrect for a bash variable assignment?',
      options: ['It is actually correct and identical to "name=value"', 'bash interprets it as trying to run a command called "name" with arguments "=" and "value", not as an assignment', 'Spaces are only invalid in variable names, not around the equals sign', 'It causes a permission error'],
      correct: 1,
      explain: 'bash variable assignment requires exactly "name=value" with no spaces — spaces around = make bash parse it as a command invocation instead of an assignment.'
    },
    {
      q: 'A variable FILE holds "my notes.txt". What happens if you run "rm $FILE" WITHOUT quotes?',
      options: ['rm correctly deletes the single file "my notes.txt"', 'The shell word-splits the unquoted value into TWO separate arguments, "my" and "notes.txt", which rm then treats as two different files', 'bash refuses to run the command at all', 'The space in the filename is automatically escaped'],
      correct: 1,
      explain: 'Unquoted variable expansions undergo word-splitting — the value is split on whitespace into separate arguments before the command receives it, which is exactly why "$FILE" should be quoted.'
    },
    {
      q: 'What does $# represent inside a script?',
      options: ['The name of the script itself', 'The exit code of the last command', 'The number of arguments the script was called with', 'The process ID of the script'],
      correct: 2,
      explain: '$# holds the count of positional arguments passed to the script — commonly checked at the start of a script to validate that enough arguments were actually provided.'
    },
    {
      q: 'By strong convention, what does an exit code of 0 mean, and what does any nonzero exit code mean?',
      options: ['0 means failure, nonzero means success', '0 means success, nonzero means some kind of failure', 'Exit codes are purely decorative and have no agreed meaning', '0 means the script is still running'],
      correct: 1,
      explain: '0 conventionally means success; any nonzero value (1-255) means failure, often with the specific number indicating which kind of failure — this convention is exactly what && and || rely on.'
    }
  ],
  pitfalls: [
    'Writing "name = value" with spaces around the equals sign, causing bash to interpret it as a command invocation rather than a variable assignment.',
    'Forgetting to quote a variable expansion ("$var" vs bare $var), leading to word-splitting bugs that only surface once a value happens to contain a space — often working fine in casual testing and failing unpredictably later.',
    'Checking $? after running some unrelated command (like an echo for logging) in between, rather than immediately after the command whose exit code actually matters — $? is silently overwritten by every command that runs.'
  ],
  interview: [
    {
      q: 'Walk through what happens, step by step, when you run "./script.sh" versus "bash script.sh" — specifically regarding the shebang line.',
      a: 'Running "bash script.sh" explicitly invokes bash and tells it to interpret the named file — the shebang line inside the file is irrelevant here, since you have already specified the interpreter directly on the command line (bash will simply treat a "#!" line as a comment, since # starts comments in bash). Running "./script.sh" instead relies on the kernel\'s own executable-loading mechanism, which specifically reads the first line for a "#!" shebang to determine which interpreter to hand the file to; without a valid shebang (or with the file not marked executable via chmod +x), this form fails or behaves unexpectedly. This is exactly why a script intended to be run directly (./script.sh) needs both a correct shebang AND the executable bit set, while "bash script.sh" needs neither.'
    },
    {
      q: 'Explain the word-splitting problem with unquoted variables, including a realistic scenario where it causes actual damage, not just an error message.',
      a: 'An unquoted variable expansion is split by the shell on whitespace (and can also undergo glob expansion) BEFORE the receiving command ever sees it — so a variable holding "my file.txt" used unquoted is silently handed to the next command as two separate arguments, "my" and "file.txt", not the one value that was actually intended. The realistic damage case is something like "rm $FILE" where FILE holds a space-containing name: instead of deleting the one intended file (which likely does not even get deleted, since no argument matching its full name was ever passed), rm receives and potentially deletes two ENTIRELY DIFFERENT, unrelated files that happen to share those split names — a genuinely dangerous silent failure mode, not a loud error, which is exactly why unconditionally quoting variable expansions is treated as a near-mandatory scripting habit rather than an optional style preference.'
    },
    {
      q: 'What is the difference between $@ and $*, and when does that difference actually matter?',
      a: 'Unquoted, $@ and $* behave identically — both expand to all positional arguments, word-split the same way. The difference only shows up when QUOTED: "$@" expands to each argument as its own SEPARATE, correctly preserved item — so an argument containing a space stays as one item — while "$*" joins ALL arguments together into a SINGLE string (separated by the first character of IFS, a space by default). This matters concretely when a script needs to forward its own arguments on to another command exactly as it received them: "command "$@"" correctly preserves each original argument\'s boundaries, including any that contain spaces, while "command "$*"" would instead pass everything as one single combined argument — a subtle bug that only surfaces once an argument with a space is actually used.'
    },
    {
      q: 'Why does a script that never explicitly sets its own exit code cause problems for anything that tries to call it and check whether it succeeded?',
      a: 'A script without an explicit "exit N" simply exits with the code of whatever its LAST command happened to return — which may not correspond to whether the script, as a whole, actually accomplished its intended purpose. A script that does real work but ends on a trivial, always-succeeding command (like a final echo) would report success (exit 0) even if an earlier, more important step genuinely failed partway through. This breaks any caller relying on the standard && / || convention, or checking $? after invoking the script, since that convention only works correctly if the exit code actually, deliberately reflects real success-or-failure — which is exactly why well-written scripts set exit codes explicitly (exit 0 on success, a specific nonzero value on each distinct failure case) rather than leaving it to whatever the last line happens to return.'
    }
  ]
};
