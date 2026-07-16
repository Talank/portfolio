window.LESSONS = window.LESSONS || {};
window.LESSONS['bash-loops-functions'] = {
  id: 'bash-loops-functions',
  title: 'Bash Control Flow: if/test, Loops, Functions & Arrays',
  category: 'Part 4 — Shell & Bash Scripting',
  timeMin: 45,
  summary: 'The last lesson\'s script ran top to bottom, once, no decisions. Real scripts branch, repeat, and reuse logic — this lesson covers all three: conditionals ([[ ]]), the two loop shapes you actually need (for and while), and functions, including the genuinely surprising fact that a bash function cannot "return" an arbitrary value the way a function in most other languages can.',
  goals: [
    'Write if/elif/else conditionals using [[ ]], including string and numeric comparisons',
    'Write a for loop over a list of items, and the C-style numeric for loop',
    'Write a while loop, including the "while read line" pattern for processing a file line by line',
    'Define and call a bash function, passing arguments via $1/$2 and getting a real value back via echo + command substitution',
    'Declare, index, and iterate over a bash array'
  ],
  concept: [
    {
      h: 'Conditionals: [[ ]] over [ ], and the comparisons that matter',
      p: [
        '<code>[ ]</code> (the historical <code>test</code> command) and <code>[[ ]]</code> (a bash-specific, more capable extension) both evaluate conditions, but <code>[[ ]]</code> is the one worth defaulting to in bash scripts: it handles unquoted variables inside it more safely (less prone to the word-splitting issues from the last lesson), supports <code>&&</code>/<code>||</code> directly inside the brackets, and adds pattern matching (<code>=~</code> for actual regex matching, straight from Part 3). <code>if [[ condition ]]; then ... elif [[ other ]]; then ... else ... fi</code> is the full shape.',
        'String comparison uses <code>=</code> (or <code>==</code>, equivalent inside <code>[[ ]]</code>) and <code>!=</code>. Numeric comparison uses distinct operators — <code>-eq</code>, <code>-ne</code>, <code>-lt</code>, <code>-le</code>, <code>-gt</code>, <code>-ge</code> — deliberately different from <code>=</code>/<code>!=</code>, because bash does not automatically know whether two strings should be compared alphabetically or numerically; using <code>=</code> to compare "9" and "10" would compare them as TEXT (where "10" sorts before "9"), while <code>-lt</code> correctly compares them as the NUMBERS 9 and 10.'
      ]
    },
    {
      h: 'for loops: iterating over a list, or counting with C-style syntax',
      p: [
        'The everyday form, <code>for item in list; do ... done</code>, iterates over each word in a space-separated list — <code>for f in *.txt; do echo "$f"; done</code> iterates over every matching file (the shell expands the glob <code>*.txt</code> into a list FIRST, then the loop runs once per match). <code>for i in {1..5}; do ... done</code> iterates over a brace-expanded numeric range, genuinely common for "do this N times."',
        'The C-style form, <code>for ((i=0; i<10; i++)); do ... done</code>, is closer to for-loops in other languages — an initializer, a condition, and an increment, explicit and precise, generally reached for when the loop variable itself needs arithmetic done on it beyond simple counting.'
      ]
    },
    {
      h: 'while loops, and the pattern that actually reads a file correctly',
      p: [
        '<code>while [[ condition ]]; do ... done</code> repeats as long as the condition remains true — used for "keep going until something changes" logic rather than a fixed, known number of iterations. The single most important while-loop pattern in practical scripting is reading a file line by line: <code>while read -r line; do ... done < file.txt</code> — NOT <code>for line in $(cat file.txt)</code>, which silently breaks on any line containing spaces (word-splitting, exactly as covered in the previous lesson) and also collapses genuinely separate lines together if IFS/newline handling is not exactly right.',
        'The <code>-r</code> flag on <code>read</code> (raw) prevents backslashes in the input from being interpreted as escape sequences — worth including essentially always, since its absence is a genuinely common source of subtly mangled data when a file happens to contain a literal backslash.'
      ]
    },
    {
      h: 'Functions: defining reusable logic, and how "returning a value" actually works',
      p: [
        'A function is defined as <code>name() { commands; }</code> and called just like any other command: <code>name arg1 arg2</code>. Inside the function, <code>$1</code>, <code>$2</code>, etc. refer to the function\'s OWN arguments (not the script\'s), exactly like a script\'s own positional parameters. <code>local varname=value</code> declares a variable SCOPED to the function — without <code>local</code>, a variable assigned inside a function leaks out and overwrites any same-named variable in the calling scope, a genuinely common and confusing bug in anything beyond a trivial script.',
        'Here is the surprising part: bash\'s <code>return</code> keyword does NOT return an arbitrary value the way a function return does in most other languages — it can only set the function\'s EXIT CODE, a number from 0 to 255, exactly like a script\'s own exit code from the last lesson. To actually get a computed VALUE back out of a function (a string, a number outside 0-255, anything more than pass/fail), the standard pattern is: the function <code>echo</code>s the value instead of returning it, and the caller captures that output with <b>command substitution</b>: <code>result=$(myfunction arg1)</code>. <code>return</code> is for signaling success/failure (checked with <code>$?</code> or directly in an if-condition); <code>echo</code> + <code>$( )</code> is for getting actual data back.'
      ]
    }
  ],
  conceptFlow: {
    title: 'How a bash function actually "returns" a computed value',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'The function',
        nodes: [
          { id: 'func', text: 'double() {\n  echo $(( $1 * 2 ))\n}' }
        ]
      },
      {
        label: 'Calling it two different ways',
        nodes: [
          { id: 'plaincall', text: 'double 5\n(called plainly)' },
          { id: 'substcall', text: 'result=$(double 5)\n(called via command substitution)' }
        ]
      },
      {
        label: 'What actually happens',
        nodes: [
          { id: 'plainout', text: 'echo runs, prints "10"\nstraight to the terminal' },
          { id: 'substcapture', text: 'echo runs, prints "10"\nbut command substitution CAPTURES it instead of printing' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'gone', text: 'The "10" is gone —\nnothing captured it' },
          { id: 'stored', text: 'result now holds "10"\nas a normal variable' }
        ]
      }
    ],
    steps: [
      { active: ['func'], note: 'This function does not use "return" at all for its actual output — it uses echo, which is the standard way to produce a real, usable value.' },
      { active: ['plaincall'], note: 'Called plainly, like any command, with no capturing mechanism around it.' },
      { active: ['substcall'], note: 'Called instead wrapped in $( ) — this is command substitution, which captures whatever the command WOULD have printed to stdout.' },
      { active: ['plainout'], note: 'The echo inside the function runs exactly the same either way — it prints "10" to stdout.' },
      { active: ['substcapture'], note: 'Because $( ) is wrapping the call this time, that same stdout output is intercepted and captured rather than being printed to the terminal directly.' },
      { active: ['gone'], note: 'In the plain call, "10" was printed and is now simply gone — nothing saved it for later use in the script.' },
      { active: ['stored'], note: 'In the substitution call, "10" is now sitting in the "result" variable, exactly like any other assignment — ready to be used later in the script. This — not "return" — is how bash functions hand back real computed values.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Franky\'s Post-Battle Repair Routine',
      text: 'Franky\'s post-battle hull inspection runs through the same four-part structure every single time, and it is worth watching closely because each part maps to something genuinely different. First, for each damaged panel he finds, he runs a quick triage decision: IF it is a hairline crack, patch it on the spot; ELSE IF it is a full breach, mark it for major repair; ELSE (nothing visibly wrong), move on without touching it at all — one condition checked, then the next, only as needed, never redundantly re-checking something already resolved. Second, once he has his list of confirmed damaged panels, he goes through them ONE AT A TIME, in order, applying the same repair procedure to each — a fixed list, worked through fully, not an open-ended process. Third, and separately, when the hull is actively taking on water faster than it is being patched, he does not work through a fixed list at all — he just keeps bailing, continuously, for as long as the water level condition remains true, with no predetermined number of buckets decided in advance; the moment the condition changes (water under control), he stops, whenever that happens to be. Fourth: his actual reinforcement technique — the specific hammering-and-welding sequence he applies to any single given panel — is something he has turned into one repeatable, callable procedure, taking WHICH panel as its input each time, so he never has to re-explain the technique itself, only what to apply it to. And here is the subtlety Usopp trips over the first time he tries to help: when Franky calls out "reinforced!" after finishing a panel, that shout is only ever a yes/no signal — solid or not solid, nothing more nuanced. If Usopp actually needs a specific MEASUREMENT back — exactly how many millimeters of plating got added — a plain "reinforced!" shout cannot carry that; Franky has to explicitly call the number back to him separately, out loud, as its own distinct piece of information, precisely because the yes/no shout was never built to carry more than pass or fail.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Whiteboard Triage, and the Number Amy Has to Shout Back Separately',
      text: 'Sheldon\'s approach to a stuck physics problem session runs the same four-part shape every time. First, he triages: IF the issue is a sign error, fix it immediately in place; ELSE IF it is a fundamentally wrong approach, erase the whole board section and restart; ELSE (nothing actually wrong, just incomplete), continue as-is — checked in that specific order, stopping at whichever condition actually applies, never re-checking ones already ruled out. Second, given a fixed list of open problems on the board that evening, he works through them ONE AT A TIME in sequence, applying the same review process to each, a definite, known set, start to finish. Third, separately, when he is stress-testing a single equation by repeatedly substituting different values, he does not have a fixed count decided in advance — he just keeps going, for as long as the results keep failing to converge, stopping only once the condition (convergence) is actually met, whenever that happens to occur. Fourth: his actual "check this derivation" review procedure is something he has turned into one reusable, nameable routine, taking WHICH derivation as its input each time — he does not re-explain his review method from scratch every single time, just points it at a new target. And the part that genuinely trips up Amy the first time she assists him: when Sheldon calls out "verified!" after reviewing a derivation, that word only ever means pass or fail — nothing more. If she actually needs the SPECIFIC corrected value back out of his review, "verified!" alone carries no such thing; he has to separately, explicitly say the number out loud as its own distinct statement, because a plain pass/fail verdict was never built to carry an actual value alongside it.'
    },
    why: 'Franky\'s triage and Sheldon\'s triage are if/elif/else. The fixed panel list and the fixed problem list are for loops. The open-ended bailing and open-ended value-testing are while loops. And the reusable, callable "reinforce this panel" / "check this derivation" procedures are functions — with the crucial, easy-to-miss lesson that a plain pass/fail shout (like bash\'s return/exit code) cannot carry an actual computed value; getting a real value back requires explicitly saying it out loud as its own separate thing, exactly like echo plus command substitution.'
  },
  tech: [
    {
      q: 'Why is [[ ]] generally preferred over [ ] in a bash script specifically (not a portable POSIX sh script)?',
      a: '[[ ]] is a bash keyword with looser, safer parsing rules than the [ ] test command: unquoted variables inside [[ ]] are far less prone to word-splitting or glob-expansion surprises, it supports && and || directly inside the brackets (rather than requiring separate [ ] expressions joined by shell-level && / ||), and it adds pattern/regex matching via =~. The tradeoff is portability — [[ ]] is a bash (and a few other modern shells\') extension, not POSIX sh, so a script that genuinely needs to run under a strict POSIX-only shell cannot rely on it. Since this course\'s scripts are explicitly bash (per the shebang), defaulting to [[ ]] is the right call.'
    },
    {
      q: 'Why does bash\'s "return" keyword only work with numbers 0-255, and how do you actually get a real computed value (like a string, or a large number) out of a function?',
      a: '"return" in bash sets the function\'s EXIT CODE — the exact same mechanism a script itself uses when it exits, and exit codes are, by OS-level convention, restricted to the range 0-255 (a single byte). This is structurally different from a "return value" in most other languages, which can be any type entirely. To actually get a real value out of a bash function — a string, a number outside that range, anything beyond pass/fail — the function should echo the value to stdout instead of (or in addition to) using return, and the CALLER captures that output using command substitution: result=$(myfunction). return/$?  is for signaling success-or-failure; echo + $() is for genuinely returning data.'
    },
    {
      q: 'Why does "for line in $(cat file.txt); do ... done" break on a file with multi-word lines, while "while read -r line; do ... done < file.txt" works correctly?',
      a: '"$(cat file.txt)" performs command substitution, and when used UNQUOTED in the for loop, its output is word-split on whitespace — meaning the loop iterates once per WORD in the file, not once per LINE, silently breaking any line containing more than one word into multiple separate loop iterations. "while read -r line; do ... done < file.txt" instead reads the file directly, one full LINE at a time, via input redirection — "read" is specifically designed to consume exactly one line per call (up to the newline), correctly preserving spaces within that line as part of a single "line" variable, which is exactly the file-processing pattern the for-loop version silently fails to achieve.'
    }
  ],
  code: {
    title: 'Conditionals, loops, and functions together',
    intro: 'Try each block separately in a real bash shell or script file.',
    code: `# Conditionals
COUNT=9
if [[ "$COUNT" -lt 10 ]]; then
  echo "single digit"
elif [[ "$COUNT" -eq 10 ]]; then
  echo "exactly ten"
else
  echo "double digit or more"
fi
# -> single digit (numeric comparison, not string comparison)

# for loop: list-style
for f in *.log; do
  echo "found log: $f"
done

# for loop: C-style
for ((i=0; i<3; i++)); do
  echo "iteration $i"
done

# while loop: the CORRECT file-reading pattern
while read -r line; do
  echo "line: $line"
done < server.log

# Function with a real argument and a real returned value
double() {
  echo $(( $1 * 2 ))
}
result=$(double 21)
echo "doubled: $result"
# -> doubled: 42

# Function using return for pass/fail, checked with $?
file_exists() {
  if [[ -f "$1" ]]; then
    return 0
  else
    return 1
  fi
}
if file_exists "server.log"; then
  echo "found it"
else
  echo "missing"
fi

# Arrays
FRUITS=("apple" "banana" "cherry")
echo "first: \${FRUITS[0]}"
echo "all: \${FRUITS[@]}"
echo "count: \${#FRUITS[@]}"
for fruit in "\${FRUITS[@]}"; do
  echo "- $fruit"
done`,
    notes: [
      'Note the numeric comparison used $COUNT -lt 10 (not $COUNT < 10) — inside [[ ]], < and > actually do STRING comparison, not numeric, another genuinely common source of confusion.',
      '"${FRUITS[@]}" (quoted, with @) correctly preserves each array element as its own item even if one contains a space — the array equivalent of "$@" from the previous lesson.'
    ]
  },
  lab: {
    title: 'Write the conditional, loop, and function pieces',
    prompt: 'Write exactly what each task asks for.',
    starter: `# Task: write an if/elif/else checking a variable STATUS: "ok" -> print "healthy", "warn" -> print "degraded", anything else -> print "unknown"


# Task: write a for loop printing "processing: X" for each file matching *.txt


# Task: write a function named "square" that takes one number and returns its square via echo (not "return")


# Task: capture the result of calling "square 6" into a variable named OUT

`,
    checks: [
      { re: 'if\\s*\\[\\[\\s*"?\\$STATUS"?\\s*=\\s*.?ok.?\\s*\\]\\]', flags: 'i', must: true, hint: 'if [[ "$STATUS" = "ok" ]]; then ...', pass: 'if [[ $STATUS = ok ]] ✓' },
      { re: 'for\\s+\\w+\\s+in\\s+\\*\\.txt', flags: 'i', must: true, hint: 'for f in *.txt; do ... done', pass: 'for f in *.txt ✓' },
      { re: 'square\\s*\\(\\)\\s*\\{[^}]*echo\\s+\\$\\(\\(\\s*\\$1\\s*\\*\\s*\\$1\\s*\\)\\)', flags: 's', must: true, hint: 'square() { echo $(( $1 * $1 )); }', pass: 'square() function using echo ✓' },
      { re: 'OUT\\s*=\\s*\\$\\(\\s*square\\s+6\\s*\\)', flags: 'i', must: true, hint: 'OUT=$(square 6)', pass: 'OUT=$(square 6) ✓' }
    ],
    run: 'Try it for real: define the function, call it plainly first (watch it print), then call it via $() and echo the captured variable.',
    solution: `# Task: write an if/elif/else checking a variable STATUS: "ok" -> print "healthy", "warn" -> print "degraded", anything else -> print "unknown"
if [[ "$STATUS" = "ok" ]]; then
  echo "healthy"
elif [[ "$STATUS" = "warn" ]]; then
  echo "degraded"
else
  echo "unknown"
fi

# Task: write a for loop printing "processing: X" for each file matching *.txt
for f in *.txt; do
  echo "processing: $f"
done

# Task: write a function named "square" that takes one number and returns its square via echo (not "return")
square() {
  echo $(( $1 * $1 ))
}

# Task: capture the result of calling "square 6" into a variable named OUT
OUT=$(square 6)`,
    notes: [
      'The elif chain checks "ok" first, then "warn" — order matters here only in that the first TRUE branch wins, same as any if/elif/else in any language.',
      'echo "$OUT" after the last task should print exactly 36 — confirming the function\'s echo\'d value was correctly captured, not printed to the terminal directly.'
    ]
  },
  quiz: [
    {
      q: 'Why is [[ "$COUNT" -lt 10 ]] correct for numeric comparison, while [[ "$COUNT" < 10 ]] is not?',
      options: ['They are exactly equivalent inside [[ ]]', 'Inside [[ ]], < and > perform STRING comparison, not numeric — -lt/-gt are the actual numeric comparison operators', '< and > are not valid inside [[ ]] at all', '-lt only works inside [ ], never [[ ]]'],
      correct: 1,
      explain: '< and > inside [[ ]] compare strings alphabetically, not numbers — -eq/-ne/-lt/-le/-gt/-ge are bash\'s dedicated numeric comparison operators, deliberately distinct from string comparison.'
    },
    {
      q: 'Why does "for line in $(cat file.txt)" iterate incorrectly over a file with multi-word lines?',
      options: ['It does not iterate at all; the syntax is invalid', 'The unquoted command substitution gets word-split on whitespace, so the loop runs once per WORD, not once per LINE', 'for loops cannot read files under any circumstances', 'cat automatically merges all lines into one before the loop starts'],
      correct: 1,
      explain: 'Unquoted "$(cat file.txt)" is word-split by the shell before the for loop ever sees it, breaking each line into separate words/iterations rather than preserving one iteration per actual line.'
    },
    {
      q: 'What does bash\'s "return" keyword inside a function actually set?',
      options: ['An arbitrary value of any type, just like in most other languages', 'The function\'s exit code, a number from 0 to 255 — the same mechanism a script itself uses when it exits', 'The value of the next echo statement', 'return has no effect inside bash functions'],
      correct: 1,
      explain: 'bash functions can only "return" a numeric exit code (0-255) via the return keyword — the same convention as a script\'s own exit code — not an arbitrary value.'
    },
    {
      q: 'A function computes a string value and needs to hand it back to the caller. What is the standard bash pattern for this?',
      options: ['Use "return" with the string directly', 'The function echoes the value, and the caller captures it with command substitution: result=$(myfunction)', 'bash functions cannot return string values under any circumstances', 'Store it in a globally-scoped array automatically'],
      correct: 1,
      explain: 'Since return is limited to 0-255 exit codes, the standard way to get a real value (string or otherwise) out of a function is to echo it and capture that output via $() in the caller.'
    },
    {
      q: 'What does "local varname=value" do inside a bash function, and why does it matter?',
      options: ['It has no effect; all variables are automatically local to functions', 'It scopes the variable to the function only — without it, the assignment leaks out and overwrites any same-named variable in the calling scope', 'It makes the variable read-only', 'It converts the variable into an array'],
      correct: 1,
      explain: 'Without "local," a variable assigned inside a bash function is NOT automatically scoped to it — it modifies (or creates) a variable in the caller\'s scope too, a common and confusing source of bugs in non-trivial scripts.'
    }
  ],
  pitfalls: [
    'Using = or == for what should be a numeric comparison (like comparing "9" and "10"), silently getting alphabetical string comparison instead of the intended numeric one.',
    'Writing "for x in $(cat file)" instead of "while read -r line; do ... done < file" — the for-loop version silently mis-iterates on any line containing more than one word.',
    'Expecting a bash function to "return" a computed value the way functions in other languages do, rather than realizing return is capped at 0-255 and only meant for exit-code-style pass/fail — echo + command substitution is required for actual data.'
  ],
  interview: [
    {
      q: 'Explain the difference between [ ] and [[ ]] in bash, and why [[ ]] is usually the safer default in a bash-specific script.',
      a: '[ ] is the historical, POSIX-portable "test" command, available in essentially every shell, but with stricter and more error-prone parsing — unquoted variables inside it are genuinely vulnerable to word-splitting and glob-expansion issues, similar to unquoted variables anywhere else. [[ ]] is a bash-specific (and a few other modern shells\') keyword that parses more safely by default, supports && / || directly inside the brackets, and adds pattern/regex matching via =~. The tradeoff is portability: [[ ]] does not exist in strict POSIX sh, so a script that genuinely needs to run under dash or another minimal shell must use [ ] instead — but for a script explicitly written for bash (per its shebang), [[ ]] is the safer, more capable default.'
    },
    {
      q: 'Walk through exactly why "return" cannot be used to get a computed string value out of a bash function, and what the correct alternative is.',
      a: 'bash\'s "return" keyword sets the function\'s exit code — a single numeric value constrained to the range 0-255, the same mechanism used by a script\'s own "exit" and checked via $?. This convention exists for signaling SUCCESS OR FAILURE, not for carrying arbitrary data, and it structurally cannot hold a string, a number outside that range, or anything more complex. To actually get a real computed value back, the function should print it to stdout via echo (rather than, or in addition to, using return for a separate pass/fail signal), and the caller captures that printed output using command substitution: result=$(myfunction args). This is why well-designed bash functions often use echo for their actual "return value" and reserve return/exit-code purely for signaling whether the function succeeded, letting a caller check both independently if needed.'
    },
    {
      q: 'Why is "while read -r line; do ... done < file.txt" specifically preferred over "for line in $(cat file.txt)" for processing a file line by line?',
      a: '"while read -r line" reads the input source one LINE at a time directly, correctly treating each full line (including any internal spaces) as a single unit, and the -r flag additionally prevents backslashes within the line from being misinterpreted as escape sequences. "for line in $(cat file.txt)" instead relies on unquoted command substitution, which the shell word-splits on whitespace before the for loop ever runs — meaning the loop actually iterates once per WORD in the file, not once per line, silently corrupting the intended line-by-line processing on any file containing multi-word lines, which in practice is nearly every real text file.'
    },
    {
      q: 'Why does forgetting "local" inside a bash function matter more in a larger script than a small one, and what specific failure mode does it cause?',
      a: 'Without "local," a variable assigned inside a function is created (or modified, if a same-named variable already exists) directly in the CALLING scope, not scoped to the function — bash functions do not have implicit local scoping the way functions in most other languages do. In a small, short script this rarely causes visible problems, since there is little else competing for variable names. In a larger script with multiple functions and a broader set of script-level variables, this becomes a genuine bug source: a function using a common variable name internally (like "i" for a loop counter, or "result" for a temporary value) can silently clobber an identically-named variable the calling code was relying on, producing incorrect behavior that has nothing obviously to do with the function that actually caused it — exactly the kind of bug that is hard to trace back to its source without knowing to suspect missing "local" declarations specifically.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover everyday loops, conditionals, and functions. This is what is underneath: associative arrays, the case statement as a cleaner alternative to long elif chains, and how bash arithmetic actually differs from string comparison.',
    sections: [
      {
        h: 'Associative arrays: declare -A',
        p: [
          'A regular bash array is indexed by number (0, 1, 2...). An <b>associative array</b>, declared explicitly with <code>declare -A</code>, is indexed by arbitrary STRING keys instead — genuinely useful for anything shaped like a lookup table. <code>declare -A COLORS; COLORS[apple]="red"; COLORS[banana]="yellow"; echo "\\${COLORS[apple]}"</code> prints "red". Iterating requires <code>\\${!COLORS[@]}</code> (the <code>!</code> here means "the KEYS of," not negation) to get the list of keys, then indexing into the array with each one — a two-step pattern that trips up nearly everyone the first time, since <code>\\${COLORS[@]}</code> alone gives only the VALUES, with no way to know which key each one belonged to.'
        ]
      },
      {
        h: 'case: a cleaner alternative to a long if/elif chain',
        p: [
          'When a script has many branches all checking the SAME variable against different fixed values, a <code>case</code> statement is both more readable and slightly more idiomatic than a long elif chain: <code>case "$1" in\\n  start) echo "starting" ;;\\n  stop) echo "stopping" ;;\\n  restart) echo "restarting" ;;\\n  *) echo "unknown command" ;;\\nesac</code>. Each pattern also supports basic glob-style matching (not full regex) — <code>*.txt)</code> as a case pattern matches any value ending in ".txt", genuinely useful for dispatching on a file extension or a small fixed set of known commands, exactly the shape a simple CLI-style script argument handler usually needs.'
        ]
      },
      {
        h: 'Arithmetic contexts: $(( )) vs string comparison, and why bash has no real floating point',
        p: [
          '<code>$(( expression ))</code> is bash\'s ARITHMETIC evaluation context — inside it, variables do not need a <code>$</code> prefix (<code>$(( count + 1 ))</code> works even though <code>count</code> alone would be undefined outside this context), and the result is always an INTEGER; bash has no native floating-point arithmetic at all. <code>echo $(( 7 / 2 ))</code> prints 3, not 3.5 — integer division, silently truncating, which is a genuine and common surprise. Anything requiring real decimal precision needs an external tool, most commonly <code>bc</code> (<code>echo "7 / 2" | bc -l</code>) or <code>awk</code>, since awk DOES support floating-point arithmetic natively — worth remembering as the practical escape hatch the moment a script\'s math needs to go beyond whole numbers.'
        ]
      }
    ]
  }
};
