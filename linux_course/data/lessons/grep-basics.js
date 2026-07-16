window.LESSONS = window.LESSONS || {};
window.LESSONS['grep-basics'] = {
  id: 'grep-basics',
  title: 'grep: Searching Text (and Why It\'s Everywhere in CI Logs)',
  category: 'Part 3 — Text, Pipes & Regex',
  timeMin: 30,
  summary: 'You now know how to pipe one command\'s output into another — grep is, by a wide margin, the tool you\'ll pipe INTO most often. It searches text for lines matching a pattern and prints just those lines, which sounds small but underlies an enormous amount of daily Linux/SSH work: "did this error happen," "which files mention this config key," "how many times did this show up in the log." This lesson covers grep\'s core flags thoroughly; the next two lessons build up the actual pattern language (regex) it uses underneath.',
  goals: [
    'Explain what grep does at a basic level: search text, print matching lines',
    'Use the core flags: -i (case-insensitive), -v (invert match), -n (line numbers), -c (count), -l (filenames only)',
    'Use grep -r to search recursively across every file in a directory tree',
    'Use -A/-B/-C to show lines of context around a match',
    'Combine grep with pipes to filter real command output and log files'
  ],
  concept: [
    {
      h: 'grep, at its core: print lines that match',
      p: [
        '<code>grep pattern file</code> reads a file (or stdin, if no file is given — exactly the "pipe into grep" pattern from the last lesson) and prints only the lines containing a match for <code>pattern</code>. That\'s the entire core idea — everything else in this lesson is flags that change WHAT counts as a match or HOW the results are presented. The name itself is a fossil from an old ed/ex editor command, "g/re/p" — globally search for a Regular Expression and Print — which is also your first hint that grep\'s patterns are regular expressions, not just plain literal text, even though a plain word like <code>grep ERROR file.log</code> happens to work as a literal-text search too.',
        'By default, grep is case-SENSITIVE ("Error" won\'t match a search for "error") and treats the pattern as a <b>basic</b> regular expression — enough for plain text and simple wildcards, but missing some regex features that the next two lessons cover in depth (and which grep can use too, with the right flag).'
      ]
    },
    {
      h: 'The flags you\'ll reach for constantly',
      p: [
        '<code>-i</code> makes the match case-insensitive — genuinely one of the most-used flags, since log messages and file contents are rarely consistently cased. <code>-v</code> INVERTS the match, printing every line that does NOT match — useful for "show me everything except the noisy lines I already know about," like <code>grep -v DEBUG app.log</code> to strip out debug-level noise. <code>-n</code> prefixes each matching line with its line number in the file — essential when you\'re about to go open that file in an editor and jump straight to the relevant spot.',
        '<code>-c</code> prints just a COUNT of matching lines, not the lines themselves — faster and cleaner than piping to <code>wc -l</code> when you only need the number. <code>-l</code> (lowercase L) prints just the FILENAMES that contain at least one match, not the matching lines themselves — the tool for "which of these 200 files mention this config key at all," when you don\'t yet care about the specific lines.'
      ]
    },
    {
      h: 'Searching a whole directory tree: -r',
      p: [
        '<code>grep -r pattern .</code> searches every file under the given directory, recursively, descending into every subdirectory — instead of hunting for the right file by hand first, you search everywhere at once and let grep tell you where matches actually live. This is exactly the tool for "which file in this codebase (or config directory, or log directory) mentions this specific string," and it\'s used constantly in CI/CD contexts covered in the next course — searching build output, config repos, or entire log directories for a specific error signature.',
        'Combine <code>-r</code> with <code>-l</code> for "which files, anywhere in this tree, mention X at all" without drowning in every individual matching line — often the very first move when starting to investigate an unfamiliar, large codebase or log archive.'
      ]
    },
    {
      h: 'Context flags: -A, -B, -C — seeing what surrounds a match',
      p: [
        'A matching line is often not enough context on its own — an error message frequently only makes sense alongside the lines immediately before or after it. <code>-A N</code> (after) shows N lines AFTER each match; <code>-B N</code> (before) shows N lines BEFORE each match; <code>-C N</code> (context) shows N lines on BOTH sides. <code>grep -C 3 "Exception" app.log</code> is a genuinely standard move when investigating an error in a log file — the exception line alone rarely tells the whole story, but three lines of surrounding context usually does.',
        'This becomes especially valuable in CI logs specifically, where the actual failure often appears several lines before or after the most obviously "loud" line — a build tool might print a summary failure banner well after the real root-cause error scrolled past, and <code>-B</code> is exactly how you\'d catch it without manually scrolling through hundreds of lines of build output.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Robin, the Ohara Archive, and Finding One Sentence in a Thousand Scrolls',
      text: 'Robin\'s years of archipelago-wide research trained her into something close to a living grep, and the crew genuinely relies on it more than they\'d probably admit. Handed some vast pile of documents — weathered scrolls, ship logs, government reports — she doesn\'t read every single one start to finish; she reads for the presence of one exact thing, scanning past everything irrelevant at speed and surfacing only the passages that actually matter. When Nami needs to know whether ANY of a hundred old weather logs mention a specific unusual current, Robin doesn\'t summarize every log — she skims for that one term specifically, case differences and all (an old sailor\'s handwritten "Current" and a printer\'s "CURRENT" both count, because insisting on exact-case-only would silently miss real matches), and hands back only the handful of pages that actually mention it. When the crew instead needs the OPPOSITE — "which of these reports are safe, meaning they DO NOT mention pirates in the area" — Robin flips the same skill around and surfaces everything that fails to match, just as fast. And when someone asks not for the passages themselves but just "how many separate documents even reference this island at all, across the entire library," she doesn\'t read them all aloud — she gives a number, extracted from the same scan, without the crew needing every source recited. Chopper, watching her work an entire room of scrolls in the time it\'d take him to read three, asks how she does it. Robin\'s answer is almost mundane: "I\'m not reading everything. I\'m reading for one thing, and skipping past everything that isn\'t it."'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Filing System and the Great Citation Hunt',
      text: 'Sheldon\'s office contains, by his own proud accounting, several hundred boxes of physics papers, meticulously organized in a system only he fully understands — which becomes a real problem the day he needs to find every single paper that ever cited a specific rival physicist, across every single box, by end of day. He doesn\'t open box one and read it cover to cover, then box two, then box three — that would take weeks. Instead he scans, box after box, for exactly one name, deliberately catching it whether a given paper wrote it in full, abbreviated, or (delightfully, to his visible annoyance) misspelled in a way that still obviously means the same person, because he\'s decided in advance the search should be case-insensitive to actual capitalization even if not to spelling. Amy, roped into helping, tries to speed things up by reading full paper titles aloud one at a time; Sheldon stops her almost immediately — he doesn\'t want the titles, he wants only the ones that ACTUALLY contain the reference, and reading everything defeats the entire point of narrowing it down first. When Leonard later asks not for the papers themselves but simply "how many, total, across every box" — Sheldon has the number instantly, because he\'d been keeping a running count the whole time rather than re-deriving it by counting stacks of paper after the fact. And when Penny, unhelpfully, asks him to instead find every box that DOES NOT mention the rival at all — Sheldon barely blinks; he\'d already built the search to run either direction. "It\'s the same skill," he says, mildly offended she\'d think otherwise. "I\'m just looking for the opposite thing now."'
    },
    why: 'grep\'s entire value is exactly this: don\'t read everything, scan for one specific thing and surface only what matches (or, with -v, only what doesn\'t) — case-insensitively when that matters, counted when you just need a number, filenames-only when you\'re still narrowing down where to even look. Robin and Sheldon are both doing the search a computer does mechanically and near-instantly.'
  },
  tech: [
    {
      q: 'Why is "grep -c pattern file" generally preferred over "grep pattern file | wc -l" when you just need a count?',
      a: 'Both produce the same final number in the common case, but "grep -c" is a single process doing the counting internally, versus two processes (grep, then wc) with a pipe between them — marginally more efficient, but the bigger practical difference shows up at the edges: "grep -c" counts MATCHING LINES specifically and handles edge cases (like a file with no trailing newline) consistently as part of its own counting logic, whereas "grep | wc -l" is counting whatever text happens to flow through the pipe, which is usually identical but conflates two separate tools\' behaviors. In practice, "grep -c" is simply the more direct, purpose-built way to ask the question you\'re actually asking.'
    },
    {
      q: 'What\'s the practical difference between "grep -r" and manually running grep on files you\'ve found with find or ls?',
      a: '"grep -r pattern ." handles the directory traversal AND the searching in one step, checking every file under the given path automatically, including ones in subdirectories you might not have thought to look in. Manually combining find and grep (like "find . -type f | xargs grep pattern") achieves something similar but requires you to already be thinking in terms of two separate tools — genuinely useful when you need FIND\'s filtering first (only files modified in the last day, or only files matching a specific name pattern, before searching their contents), but for the common case of "search everything under this directory," "grep -r" alone is simpler and does the same job in one command.'
    },
    {
      q: 'What does it mean that grep uses "basic" regular expressions by default, and why does that matter enough to have its own flag?',
      a: 'POSIX defines two regex dialects: Basic Regular Expressions (BRE, grep\'s default) and Extended Regular Expressions (ERE, enabled with grep -E, sometimes called egrep). BRE requires certain metacharacters — like the grouping parentheses ( ) or the alternation pipe | — to be backslash-escaped to have their special meaning, which is a genuinely common source of "why isn\'t my pattern working" confusion for anyone used to regex from another language. -E switches to the more familiar unescaped syntax most other tools (and the next lesson) use directly. It matters enough to flag because reaching for parentheses or alternation in a plain "grep pattern" without -E silently does something different than expected, rather than erroring out clearly.'
    }
  ],
  code: {
    title: 'grep flags on a real log file',
    intro: 'app.log below is a stand-in — try these same flags against any real log or text file you have handy.',
    code: `$ cat app.log
2026-07-16 09:01:03 INFO  Starting server on port 8080
2026-07-16 09:01:04 DEBUG Loaded config from /etc/app/config.yml
2026-07-16 09:02:15 ERROR Failed to connect to database: timeout
2026-07-16 09:02:16 ERROR Retrying connection (1/3)
2026-07-16 09:02:20 INFO  Database connection established

$ grep ERROR app.log
2026-07-16 09:02:15 ERROR Failed to connect to database: timeout
2026-07-16 09:02:16 ERROR Retrying connection (1/3)

$ grep -i error app.log
2026-07-16 09:02:15 ERROR Failed to connect to database: timeout
2026-07-16 09:02:16 ERROR Retrying connection (1/3)
# Case-insensitive — matches ERROR even though the search term was lowercase.

$ grep -v DEBUG app.log
2026-07-16 09:01:03 INFO  Starting server on port 8080
2026-07-16 09:02:15 ERROR Failed to connect to database: timeout
2026-07-16 09:02:16 ERROR Retrying connection (1/3)
2026-07-16 09:02:20 INFO  Database connection established
# Everything EXCEPT the DEBUG line.

$ grep -n ERROR app.log
3:2026-07-16 09:02:15 ERROR Failed to connect to database: timeout
4:2026-07-16 09:02:16 ERROR Retrying connection (1/3)
# Line numbers included — line 3 and 4 of the file.

$ grep -c ERROR app.log
2

$ grep -rl "database" /var/log/myapp/
/var/log/myapp/app.log
/var/log/myapp/db.log
# Just the FILENAMES that mention "database" anywhere under this directory.

$ grep -B 1 -A 1 "Failed to connect" app.log
2026-07-16 09:01:04 DEBUG Loaded config from /etc/app/config.yml
2026-07-16 09:02:15 ERROR Failed to connect to database: timeout
2026-07-16 09:02:16 ERROR Retrying connection (1/3)
# One line of context before AND after the match.`,
    notes: [
      'grep -i is worth reaching for by default when searching human-written logs — "Error," "ERROR," and "error" all showing up inconsistently in the same file is genuinely common.',
      '-B and -A can take different numbers (grep -B 2 -A 5 pattern file) — before and after context don\'t need to match.'
    ]
  },
  lab: {
    title: 'Write the right grep command for each task',
    prompt: 'Write exactly one grep command per task below, against a file called server.log.',
    starter: `# Task: find all lines mentioning "timeout", case-insensitively


# Task: show every line that does NOT mention "DEBUG"


# Task: count how many lines mention "WARN" (just the number, not the lines)


# Task: search recursively under /var/log for any file mentioning "OutOfMemory", printing filenames only


# Task: show the "CRITICAL" line plus 2 lines of context before and after it

`,
    checks: [
      { re: 'grep\\s+-i\\s+timeout\\s+server\\.log', flags: 'i', must: true, hint: '"grep -i timeout server.log" is case-insensitive.', pass: 'grep -i timeout server.log ✓' },
      { re: 'grep\\s+-v\\s+DEBUG\\s+server\\.log', flags: 'i', must: true, hint: '"grep -v DEBUG server.log" inverts the match, excluding DEBUG lines.', pass: 'grep -v DEBUG server.log ✓' },
      { re: 'grep\\s+-c\\s+WARN\\s+server\\.log', flags: 'i', must: true, hint: '"grep -c WARN server.log" prints just the count.', pass: 'grep -c WARN server.log ✓' },
      { re: 'grep\\s+-rl\\s+OutOfMemory\\s+/var/log', flags: 'i', must: true, hint: '"grep -rl OutOfMemory /var/log" searches recursively, printing filenames only.', pass: 'grep -rl OutOfMemory /var/log ✓' },
      { re: 'grep\\s+-C\\s*2\\s+CRITICAL\\s+server\\.log', flags: 'i', must: true, hint: '"grep -C 2 CRITICAL server.log" shows 2 lines of context on both sides.', pass: 'grep -C 2 CRITICAL server.log ✓' }
    ],
    run: 'Try it for real against any log or text file you have — even "grep -i error /var/log/syslog" on a real machine.',
    solution: `# Task: find all lines mentioning "timeout", case-insensitively
grep -i timeout server.log

# Task: show every line that does NOT mention "DEBUG"
grep -v DEBUG server.log

# Task: count how many lines mention "WARN" (just the number, not the lines)
grep -c WARN server.log

# Task: search recursively under /var/log for any file mentioning "OutOfMemory", printing filenames only
grep -rl OutOfMemory /var/log

# Task: show the "CRITICAL" line plus 2 lines of context before and after it
grep -C 2 CRITICAL server.log`,
    notes: [
      'grep -rl (lowercase L) can be combined with -i too: "grep -ril outofmemory /var/log" for a recursive, case-insensitive, filenames-only search.',
      'If a search term contains spaces or special characters, quote it: grep "connection refused" file.log.'
    ]
  },
  quiz: [
    {
      q: 'What does "grep -v ERROR app.log" print?',
      options: ['Only lines containing ERROR', 'Only lines NOT containing ERROR', 'The count of ERROR lines', 'Nothing; -v is not a valid grep flag'],
      correct: 1,
      explain: '-v inverts the match, printing every line that does NOT match the pattern — the opposite of grep\'s default behavior.'
    },
    {
      q: 'What\'s the difference between "grep -c" and "grep -l" (lowercase L)?',
      options: ['They are identical flags', '-c prints a count of matching LINES; -l prints the FILENAMES containing at least one match', '-c searches recursively; -l does not', '-l counts matches; -c lists filenames'],
      correct: 1,
      explain: '-c gives a numeric count of matching lines within the searched file(s). -l (lowercase L) gives just the names of files that contain at least one match, without printing the matching lines themselves.'
    },
    {
      q: 'What does "grep -r pattern ." do differently from "grep pattern somefile.txt"?',
      options: ['Nothing different; -r is ignored when a single file is given', 'It searches every file under the current directory, descending into subdirectories, instead of one specific file', 'It reverses the order lines are printed in', 'It makes the search case-insensitive'],
      correct: 1,
      explain: '-r makes grep search recursively through an entire directory tree rather than a single named file — the tool for "search everywhere under this path."'
    },
    {
      q: 'What do the -A, -B, and -C flags control?',
      options: ['Alphabetical, backwards, and case-sensitive sort order', 'How many lines of context to show after, before, and on both sides of a match', 'Whether grep searches Archives, Binaries, or Compressed files', 'The color used to highlight matches'],
      correct: 1,
      explain: '-A N shows N lines after each match, -B N shows N lines before, and -C N shows N lines on both sides — useful when a match alone lacks enough surrounding context to make sense of.'
    },
    {
      q: 'By default, is grep\'s search case-sensitive or case-insensitive, and which flag changes that?',
      options: ['Case-sensitive by default; -i makes it case-insensitive', 'Case-insensitive by default; -s makes it case-sensitive', 'grep ignores case entirely and there is no way to change it', 'It depends on the operating system, not on any flag'],
      correct: 0,
      explain: 'grep is case-sensitive by default ("Error" won\'t match a search for "error") — the -i flag switches to case-insensitive matching, which is genuinely one of the most commonly reached-for grep flags.'
    }
  ],
  pitfalls: [
    'Forgetting -i and assuming a search "found nothing" when the text actually exists with different capitalization — a very common false negative on human-written or inconsistently-formatted logs.',
    'Reaching for "grep pattern file | wc -l" out of habit when "grep -c pattern file" does the same thing more directly and in one process.',
    'Using parentheses or the | (pipe) character in a plain grep pattern expecting regex grouping/alternation, without realizing grep\'s DEFAULT (basic) regex mode requires those to be backslash-escaped — or reaching for -E to get the more familiar unescaped syntax.'
  ],
  interview: [
    {
      q: 'Explain what grep does and why it\'s considered one of the most fundamental tools in a Linux/SSH workflow.',
      a: 'grep searches text (from a file or stdin) for lines matching a pattern and prints just those lines. It\'s fundamental because an enormous amount of real operational work reduces to "find the specific thing in a large amount of text" — checking whether an error occurred in a log, finding which config file sets a particular value, counting occurrences of something across files. Combined with pipes, grep becomes a filtering stage that can sit between almost any two other commands, which is exactly why it shows up constantly in real command lines rather than as a standalone tool used in isolation.'
    },
    {
      q: 'When would you reach for "grep -l" versus a plain grep, and why does that distinction matter when investigating an unfamiliar codebase or log directory?',
      a: 'Plain grep (or grep -r for a whole directory) shows you every matching LINE, which is exactly what you want once you already know roughly where to look. "grep -l" instead shows just the FILENAMES containing at least one match, which is more useful earlier in an investigation, when you don\'t yet know which of potentially hundreds of files are even relevant — narrow down to the right files first with -l, then run a more detailed search (possibly with -n or -C for context) against just those specific files, rather than being overwhelmed by every matching line across an entire tree at once.'
    },
    {
      q: 'Why are -A/-B/-C context flags particularly useful when debugging a CI/CD build failure?',
      a: 'Build and CI logs often have the actual root-cause error appear several lines away from the most visually obvious "FAILED" or summary banner — a compiler error might scroll past well before a build tool prints its final failure summary, or a stack trace\'s most useful line might be several lines below the initial exception message. Grepping for just the obvious keyword and seeing one isolated line often isn\'t enough to diagnose the real problem; -B captures what led UP to the failure, -A captures what happened immediately after (sometimes including the actually useful part of a stack trace), and -C is the common default when you\'re not yet sure which direction the useful context is in.'
    },
    {
      q: 'What\'s the difference between grep\'s basic and extended regex modes, and when would that distinction actually bite you in practice?',
      a: 'grep defaults to POSIX Basic Regular Expressions (BRE), where certain metacharacters — notably grouping parentheses and the alternation pipe — must be backslash-escaped to be treated as special; unescaped, they\'re just literal characters. "grep -E" (or the egrep alias) switches to Extended Regular Expressions (ERE), where those same characters work unescaped, matching the syntax most people expect coming from other regex-using languages or tools. It bites in practice when someone writes "grep (foo|bar) file" expecting alternation, and grep\'s default BRE mode instead searches for the literal, useless string "(foo|bar)" — a genuinely common source of "my regex isn\'t matching anything" confusion, resolved by either escaping the metacharacters or switching to -E.'
    }
  ]
};
