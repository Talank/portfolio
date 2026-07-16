window.LESSONS = window.LESSONS || {};
window.LESSONS['bash-scripting-advanced'] = {
  id: 'bash-scripting-advanced',
  title: 'Writing Bash Scripts That Do Not Break: set -euo pipefail, trap, Debugging',
  category: 'Part 4 — Shell & Bash Scripting',
  timeMin: 40,
  summary: 'Every script so far has assumed things go right. This lesson is about what happens when they do not: bash\'s default behavior of silently continuing after a failed command, the three-flag habit (set -euo pipefail) that fixes the most dangerous version of that, cleanup code that runs even when a script dies unexpectedly (trap), and the handful of debugging moves that turn "this script is broken somehow" into "line 14 is the problem."',
  goals: [
    'Explain why bash continues running a script by default even after a command fails',
    'Use "set -e", "set -u", and "set -o pipefail" together, and explain what each one specifically fixes',
    'Use trap to run cleanup code when a script exits, including on an unexpected error',
    'Debug a script using "bash -x" and strategic echo statements',
    'Identify why "set -e" alone is not a complete safety net, and what it still misses'
  ],
  concept: [
    {
      h: 'bash\'s dangerous default: keep going after a failure',
      p: [
        'By default, if a command inside a script fails (returns a nonzero exit code), bash does NOT stop — it simply moves on to the next line, exactly as if nothing went wrong. This is a genuinely dangerous default for anything beyond a trivial script: a failed <code>cd /some/deploy/dir</code> followed by an <code>rm -rf ./*</code> intended to clean up that specific directory instead runs in whatever directory the script HAPPENED to still be in, since the failed cd did not stop execution — a real, well-known category of production incident, not a hypothetical.',
        'This default exists for historical/flexibility reasons (some scripts genuinely want to keep going after an expected, tolerable failure), but for the vast majority of scripts, "stop immediately on the first unexpected failure" is the far safer default to opt into explicitly.'
      ]
    },
    {
      h: 'set -euo pipefail: the three-flag habit',
      p: [
        '<code>set -e</code> ("errexit") makes the script EXIT IMMEDIATELY the moment any command returns a nonzero exit code, instead of silently continuing — directly fixing the dangerous default above. <code>set -u</code> ("nounset") makes referencing an UNDEFINED variable an immediate error instead of silently substituting an empty string — catching typos in variable names (<code>$FILENAME</code> vs an actual variable named <code>$FILENME</code>) that would otherwise fail silently and confusingly, often much later in the script, far from the actual typo.',
        '<code>set -o pipefail</code> fixes a specific, subtle gap in <code>-e</code> itself: normally, a PIPELINE\'s exit code is just the exit code of its LAST command — so <code>false | true</code> "succeeds" (exit code 0) even though the first command in the pipe genuinely failed, because bash only looks at the last one. <code>pipefail</code> makes a pipeline\'s exit code reflect FAILURE if ANY command in it failed, not just the last — without it, <code>curl bad-url | grep something</code> could silently report success even though the curl itself failed, since grep (finding nothing to match, but not erroring) is what bash was actually checking. The combined habit, placed near the top of nearly every serious bash script: <code>set -euo pipefail</code>.'
      ]
    },
    {
      h: 'trap: running cleanup code no matter how the script ends',
      p: [
        '<code>trap \'commands\' SIGNAL</code> registers code to run when a specified signal is received — including the special pseudo-signal <code>EXIT</code>, which fires whenever the script ends, for ANY reason: normal completion, an explicit <code>exit</code>, or (combined with <code>set -e</code>) an unexpected failure partway through. <code>trap \'rm -f "$TMPFILE"\' EXIT</code> is a genuinely common, valuable pattern — guaranteeing a temporary file gets cleaned up regardless of whether the script finished successfully or died halfway through from an error.',
        'This matters specifically BECAUSE of <code>set -e</code>: once a script can exit at literally any line the moment something fails, cleanup code placed at the END of the script (the "normal" place to put it) may simply never be reached. <code>trap ... EXIT</code> is the one place to put cleanup logic that is GUARANTEED to run, regardless of exactly where or why the script actually stopped.'
      ]
    },
    {
      h: 'Debugging: bash -x and knowing where to look',
      p: [
        '<code>bash -x script.sh</code> (or <code>set -x</code> placed inside the script itself, around the suspicious section) runs the script in TRACE mode — printing every command, WITH its variables already expanded, right before executing it, prefixed with a <code>+</code>. This is usually the fastest way to answer "what is this script actually doing," since it shows the REAL values being used, not just the literal source code, which is exactly what surfaces a typo\'d variable, an unexpectedly empty value, or a condition evaluating differently than assumed.',
        'For a more targeted look without tracing the entire script, strategic <code>echo "DEBUG: varname=$varname" >&2</code> statements (printed to stderr specifically, so they do not get mixed into the script\'s actual, intended stdout output) at a few suspicious points remain a completely legitimate, fast debugging technique — not a "beginner\'s tool" to graduate away from, just a different tool for a more targeted question than "trace absolutely everything."'
      ]
    }
  ],
  conceptFlow: {
    title: 'set -e catches a failing command — but does it ALWAYS?',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Scenario A',
        nodes: [
          { id: 'plain', text: 'false\n(a plain failing command)' }
        ]
      },
      {
        label: 'Scenario B',
        nodes: [
          { id: 'ifcond', text: 'if false; then ...; fi\n(failing command used AS a condition)' }
        ]
      },
      {
        label: 'What set -e does in each case',
        nodes: [
          { id: 'catchesA', text: 'set -e DOES trigger:\nscript exits immediately' },
          { id: 'skipsB', text: 'set -e does NOT trigger:\na failure used as a condition is\nan expected, checked outcome' }
        ]
      },
      {
        label: 'The lesson',
        nodes: [
          { id: 'lesson', text: 'set -e catches UNEXPECTED failures,\nnot failures you are deliberately checking for' }
        ]
      }
    ],
    steps: [
      { active: ['plain'], note: 'A command failing "out in the open," not being used as part of any conditional check — the ordinary case set -e is designed to catch.' },
      { active: ['ifcond'], note: 'The exact same failing command, but this time used AS the condition of an if statement — bash needs to know WHETHER it failed in order to decide which branch to take.' },
      { active: ['catchesA'], note: 'In scenario A, set -e sees an unchecked failure and immediately exits the script — exactly the safety net it is meant to provide.' },
      { active: ['skipsB'], note: 'In scenario B, set -e deliberately does NOT trigger — a command\'s exit code being used as a condition (in an if, while, or with && / ||) is considered an INTENTIONAL check, not an accidental unhandled failure, so bash lets the script continue and branch normally.' },
      { active: ['lesson'], note: 'set -e is not "stop on ANY nonzero exit code, ever" — it specifically stops on failures that are NOT already being explicitly checked by the script\'s own logic. Knowing this distinction is exactly what prevents the false assumption that set -e alone makes a script fully safe.' }
    ]
  },
  story: {
    onePiece: {
      title: 'The Sunny\'s "Stop Everything" Rule, and the Cleanup Crew That Always Runs',
      text: 'Before Franky instituted a specific standing rule, the Sunny had a bad habit that nearly sank a repair job: if one step of a multi-step hull procedure quietly went wrong, the crew working it would often just... continue on to the next step anyway, unaware anything had failed, compounding one small problem into several much bigger ones downstream. Franky\'s fix became crew law: the MOMENT any step of a procedure genuinely fails — not a check that was deliberately built into the plan, but a real, unexpected failure — everyone stops immediately, right there, rather than pressing on as if nothing happened. Separately, he also banned a specific bad habit of silently assuming an unlabeled crate held whatever was expected — if a crate is not clearly labeled, treat that as an error worth stopping for immediately, rather than guessing and possibly grabbing the wrong material entirely. And critically, no matter WHERE in a procedure something goes wrong — early, late, for a reason nobody anticipated — there is one crew member whose entire job is cleanup: collecting scattered tools, capping off any half-finished materials, making the work site safe again, GUARANTEED to happen regardless of which specific step the rest of the crew stopped at. That cleanup role does not care why the job stopped, only that it did, and its job runs every single time, without fail. Robin, watching Franky explain all this to a new hire, adds one clarifying note the newcomer initially misses: this "stop immediately on failure" rule does not apply to a step where the crew is DELIBERATELY testing whether something holds — checking if a weld is solid IS supposed to sometimes come back "no," and that expected, checked outcome should not halt the whole operation the way a genuinely unanticipated failure would.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Kitchen Rule: Stop the Moment Something Actually Goes Wrong',
      text: 'Monica, running a chaotic dinner service early in her career, learns a hard lesson the night a junior cook lets a small, unnoticed mistake (a slightly wrong ingredient substitution, unflagged) quietly cascade through four more dishes before anyone catches it — nobody stopped to check, so each subsequent step just built on an already-broken foundation without realizing it. Her rule afterward is absolute: the INSTANT something genuinely goes wrong and unnoticed — not a taste-test that is SUPPOSED to sometimes come back "needs more salt," but a real, unexpected problem — everyone stops immediately, right there, rather than continuing forward hoping it sorts itself out. She adds a second rule not long after: never assume an unlabeled container holds what you think it does — treat that specifically as a stop-and-check moment, not a guess-and-continue moment. And crucially, no matter what actually goes wrong during a given evening\'s service, and no matter at which specific point it happens, there is always someone assigned to close out cleanly — put dishes away, log what happened, reset the kitchen for tomorrow — and that assigned person\'s job runs every single night regardless of whether service ended smoothly or ended in the middle of a crisis. Chandler, hearing Monica explain all this once, asks the obvious follow-up: does "stop immediately" apply to every failed taste test too? Monica is quick to clarify — no, a taste test that comes back "needs work" is an EXPECTED, deliberately-checked outcome, not the kind of surprise failure the rule actually exists to catch.'
    },
    why: 'Franky\'s "stop immediately on an unexpected failure" and "unlabeled crate is an error" rules are exactly set -e and set -u. The guaranteed cleanup crew, running no matter where or why the work stopped, is trap ... EXIT. And Robin\'s and Monica\'s clarifications — that a DELIBERATE check (a weld test, a taste test) failing is an expected outcome, not a halt-everything emergency — are exactly the nuance from this lesson\'s conceptFlow: set -e stops unexpected failures, not failures a script is already, deliberately checking for.'
  },
  tech: [
    {
      q: 'Concretely, what real damage can happen from bash\'s default of continuing after a failed command, beyond just "the script does the wrong thing"?',
      a: 'The classic, genuinely damaging example is a script that does "cd /path/to/deploy/target" followed later by a cleanup step like "rm -rf ./*", intending to clear out ONLY that specific target directory before deploying fresh files. If the cd fails (the directory does not exist, a typo in the path, a permissions issue) and the script does not stop, the rm -rf still runs — but now in whatever directory the script happened to already be in, which could be the user\'s home directory, the script\'s own source directory, or worse. This is not a hypothetical scenario; it is a well-documented, recurring category of real production incident, and it is exactly the kind of damage "set -e" is specifically designed to prevent by stopping the script the instant the cd itself fails, before the dangerous rm -rf ever gets a chance to run in the wrong place.'
    },
    {
      q: 'Why does "set -o pipefail" matter specifically for a pipeline like "curl some-url | grep pattern", when set -e alone is already active?',
      a: 'Without pipefail, bash considers a PIPELINE\'s overall exit code to be just the exit code of its LAST command — so even with set -e active, "curl some-url | grep pattern" is considered to have "succeeded" as long as grep itself did not error, completely regardless of whether curl actually failed (a bad URL, a network timeout, a non-2xx response). set -e alone would not catch this, because from bash\'s perspective, the pipeline as a whole reported success. "set -o pipefail" changes this specifically: it makes the pipeline\'s exit code reflect a failure if ANY stage of it failed, not just the last one — closing exactly this gap, which is why pipefail is bundled alongside -e and -u as a standard triple, rather than being considered optional.'
    },
    {
      q: 'Why is "trap ... EXIT" specifically needed, rather than just putting cleanup code at the bottom of the script as usual?',
      a: 'Once a script uses set -e, it can legitimately exit from literally ANY line the moment a command fails — not just from reaching the natural end of the file. Cleanup code placed at the bottom of the script, in the traditional "do work, then clean up" order, is only ever reached if the script makes it all the way through without triggering an early exit — meaning an error partway through skips the cleanup code entirely, potentially leaving behind a temporary file, a lock, or a partially-applied change. "trap \'cleanup-code\' EXIT" instead registers the cleanup to run on the EXIT pseudo-signal specifically, which bash fires no matter how or where the script actually terminates — normal completion, an explicit exit call, or an error-triggered exit from set -e — making it the one place cleanup logic is actually guaranteed to run.'
    }
  ],
  code: {
    title: 'A properly defensive script',
    intro: 'This combines everything from the lesson — try deliberately breaking one piece (like removing set -e) to see the difference in behavior.',
    code: `#!/usr/bin/env bash
set -euo pipefail

TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"; echo "Cleaned up $TMPFILE" >&2' EXIT

echo "Working in $TMPFILE"
echo "some data" > "$TMPFILE"

# set -u in action: this would fail immediately if UNDEFINED_VAR
# was never set, instead of silently substituting an empty string.
: "\${REQUIRED_VAR:?REQUIRED_VAR must be set}"

# set -e in action: if this command fails, the script stops HERE,
# and the trap above still runs the cleanup before exiting.
grep "data" "$TMPFILE"

echo "Done — cleanup will run automatically now via trap."`,
    notes: [
      'Run this script both WITH and WITHOUT REQUIRED_VAR set in the environment (REQUIRED_VAR=x ./script.sh vs plain ./script.sh) to see set -u catch the missing variable immediately.',
      '":${VAR:?message}" is a genuinely common idiom: if VAR is unset or empty, print "message" and exit immediately — a clean, one-line way to validate a required input near the top of a script.'
    ]
  },
  lab: {
    title: 'Add the missing safety pieces to a script',
    prompt: 'Fill in the three blanks: the safety-flag line, a trap for cleanup, and a debug command to run this script in trace mode.',
    starter: `#!/usr/bin/env bash
___________________

TMPFILE=$(mktemp)
___________________

echo "processing..." > "$TMPFILE"
cat "$TMPFILE"

# Task (as a comment): write the command to run this script in trace mode from the terminal
`,
    checks: [
      { re: 'set\\s+-euo\\s+pipefail|set\\s+-e\\s+-u\\s+-o\\s+pipefail', flags: '', must: true, hint: 'set -euo pipefail is the standard combined safety-flag line.', pass: 'set -euo pipefail ✓' },
      { re: "trap\\s+.*rm\\s+-f\\s+.\\\\?\\\$TMPFILE.\\s*.*EXIT|trap\\s+.*EXIT", flags: '', must: true, hint: 'trap \'rm -f "$TMPFILE"\' EXIT registers cleanup for whenever the script ends.', pass: 'trap ... EXIT ✓' },
      { re: 'bash\\s+-x', flags: '', must: true, hint: 'bash -x script.sh runs the script in trace mode.', pass: 'bash -x ✓' }
    ],
    run: 'Try it for real: run the completed script normally, then run it with "bash -x" and compare what you see.',
    solution: `#!/usr/bin/env bash
set -euo pipefail

TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"' EXIT

echo "processing..." > "$TMPFILE"
cat "$TMPFILE"

# Task (as a comment): write the command to run this script in trace mode from the terminal
# bash -x script.sh`,
    notes: [
      'The trap line should run BEFORE anything that could fail, so that even an early failure is still covered by the cleanup.',
      '"bash -x script.sh" prints every command with its variables already expanded, prefixed with a "+" — the fastest way to see what a script is ACTUALLY doing versus what the source code merely says.'
    ]
  },
  quiz: [
    {
      q: 'By default, what does bash do when a command inside a script fails (returns nonzero)?',
      options: ['The script stops immediately', 'The script continues running the next line, as if nothing happened', 'bash automatically retries the failed command', 'The whole terminal session closes'],
      correct: 1,
      explain: 'bash\'s default is to keep going after a failed command — set -e is specifically what changes this to "stop immediately on failure" instead.'
    },
    {
      q: 'What specific problem does "set -o pipefail" solve that "set -e" alone does not?',
      options: ['It makes variable typos an error', 'It makes a PIPELINE\'s exit code reflect a failure in ANY stage, not just the last command in the pipe', 'It automatically retries failed pipelines', 'It has no effect when combined with set -e'],
      correct: 1,
      explain: 'Without pipefail, a pipeline\'s exit code is just its LAST command\'s exit code — an earlier failing command in the pipe can be silently masked. pipefail fixes exactly this gap.'
    },
    {
      q: 'What does "set -u" specifically catch?',
      options: ['A command that fails', 'A pipeline where an early stage fails', 'Referencing an undefined/unset variable, which would otherwise silently expand to an empty string', 'A syntax error in the script itself'],
      correct: 2,
      explain: '"set -u" (nounset) makes using an undefined variable an immediate error, instead of silently treating it as an empty string — catching typos in variable names early.'
    },
    {
      q: 'Why is "trap \'cleanup-code\' EXIT" more reliable than placing cleanup code at the very end of a script?',
      options: ['They are equally reliable in every case', 'A script using set -e can exit from ANY line on failure, potentially skipping cleanup code placed only at the bottom; trap ... EXIT runs no matter where the script actually stops', 'trap only works for scripts that never use set -e', '"EXIT" cleanup code runs before the script\'s main logic, not after'],
      correct: 1,
      explain: 'With set -e active, the script may exit early from any failing line, never reaching cleanup code placed at the bottom — trap ... EXIT is guaranteed to run regardless of where or why the script actually terminates.'
    },
    {
      q: 'Does "set -e" cause a script to stop on a command whose failure is being deliberately checked, like "if some_command; then ... fi"?',
      options: ['Yes, always, with no exceptions', 'No — a command used as a condition (in if/while, or with && / ||) is treated as an intentional check, not an unhandled failure, so the script continues normally', 'Only if the command is the very first line of the script', 'set -e disables all conditional logic entirely'],
      correct: 1,
      explain: 'set -e specifically targets UNCHECKED failures — a command\'s exit code being used deliberately as a condition is considered intentional and does not trigger an early exit.'
    }
  ],
  pitfalls: [
    'Writing a script of any real consequence without "set -euo pipefail" near the top, relying on bash\'s dangerous default of silently continuing after a failure.',
    'Assuming "set -e" alone makes a script fully safe against pipeline failures — without "pipefail" specifically, an early-stage failure in a pipe can be masked by a later stage that "succeeds."',
    'Placing cleanup code only at the bottom of a script instead of in a "trap ... EXIT" — an early, unexpected failure (which set -e is specifically designed to trigger) skips right past bottom-of-script cleanup entirely.'
  ],
  interview: [
    {
      q: 'Explain what each of "set -e", "set -u", and "set -o pipefail" does, and why they are conventionally used together rather than individually.',
      a: '"set -e" makes the script exit immediately on any unchecked command failure, instead of bash\'s dangerous default of silently continuing. "set -u" makes referencing an undefined variable an immediate error rather than silently substituting an empty string, catching variable-name typos early. "set -o pipefail" closes a specific gap that -e alone leaves open: normally a pipeline\'s exit code is just its last command\'s, so an early stage silently failing inside a pipe would not be caught by -e at all; pipefail makes the whole pipeline register as failed if ANY stage failed. They are used together because each one covers a genuinely different, non-overlapping failure mode — omitting any one of the three leaves a real, specific gap the others do not cover.'
    },
    {
      q: 'Give a concrete example of "set -e" NOT catching a failure, and explain why that gap exists.',
      a: 'A command used as the CONDITION of an if statement, while loop, or joined with && / || is deliberately exempt from set -e\'s "stop on failure" behavior — for example, "if grep pattern file.txt; then ... fi" does not trigger an exit even if grep fails to find a match (a nonzero exit), because the whole point of using it as a condition is to CHECK whether it succeeds or fails and branch accordingly; treating that as an unhandled error would make ordinary conditional logic impossible to write. The gap exists by design: set -e is meant to catch UNEXPECTED, unhandled failures — a command whose exit code the script is not already examining — not failures a script is deliberately, explicitly checking as part of its own control flow.'
    },
    {
      q: 'Why would you use "trap ... EXIT" instead of, or in addition to, trapping a specific signal like SIGINT or SIGTERM?',
      a: 'EXIT is a bash pseudo-signal that fires whenever the script terminates for ANY reason — reaching the end normally, calling exit explicitly, OR dying from an unhandled error under set -e — making it the single most comprehensive place to guarantee cleanup code actually runs. Trapping a SPECIFIC signal like SIGINT (Ctrl-C) or SIGTERM only covers that one particular way of being interrupted, and would miss a script that instead fails because of set -e catching a bad command, or one that simply finishes normally with nothing left needing explicit handling. In practice, both are often used together — a signal-specific trap for behavior unique to being interrupted (like printing a specific "cancelled by user" message), and an EXIT trap for cleanup that must happen regardless of exactly how the script ended.'
    },
    {
      q: 'Beyond "set -euo pipefail," what debugging techniques would you reach for to figure out why a script is behaving unexpectedly, and when would you choose one over the other?',
      a: '"bash -x script.sh" (or "set -x" around a specific section) runs in full trace mode, printing every command with its variables already expanded before execution — the fastest way to see exactly what the script is REALLY doing when the actual behavior diverges from what the source code seems to say, especially useful for catching an unexpectedly empty variable or a condition evaluating differently than assumed. Strategic "echo \\"DEBUG: var=$var\\" >&2" statements at a few specific, suspicious points are better when the problem is already narrowed down to roughly where it is happening and full tracing would produce too much irrelevant noise to sift through — printing to stderr specifically so debug output does not get mixed into the script\'s actual intended stdout. The practical choice is scope: trace everything when you genuinely do not know where the problem is; add targeted echo statements once you have a specific suspicion to confirm or rule out.'
    }
  ]
};
