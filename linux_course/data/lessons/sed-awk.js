window.LESSONS = window.LESSONS || {};
window.LESSONS['sed-awk'] = {
  id: 'sed-awk',
  title: 'sed & awk: Stream Editing and Field Processing One-Liners',
  category: 'Part 3 — Text, Pipes & Regex',
  timeMin: 45,
  summary: 'grep finds lines. Regex describes shapes. sed and awk are what actually TRANSFORM text — sed for find-and-replace and simple line-editing, awk for anything organized into columns/fields. Together with grep and pipes, this closes out the text-processing toolkit that most real Linux/CI-log work is built from.',
  goals: [
    'Use sed for basic find-and-replace with s/pattern/replacement/, including global replace',
    'Explain why sed by default does not modify a file, and how -i changes that',
    'Use awk to print specific fields ($1, $2, ...) from column-shaped text',
    'Use awk\'s built-in variables (NF, NR) and a simple condition to filter rows',
    'Read a real sed or awk one-liner and predict its output on given input'
  ],
  concept: [
    {
      h: 'sed: stream editor — find, replace, and simple line edits',
      p: [
        'sed reads input line by line and applies editing COMMANDS to it, streaming the result out — the name literally stands for "stream editor." Its single most common use by a wide margin is substitution: <code>sed \'s/old/new/\'</code> replaces the FIRST occurrence of "old" with "new" on EACH line. Add a trailing <code>g</code> (global) flag — <code>sed \'s/old/new/g\'</code> — to replace EVERY occurrence on each line, not just the first.',
        'Critically, by default sed does not touch the original file at all — it reads input and writes the MODIFIED version to stdout, leaving the source file completely unchanged. This is actually the safer default: <code>sed \'s/foo/bar/\' file.txt</code> lets you preview a change before committing to it, redirecting to a new file (<code>sed \'s/foo/bar/\' file.txt > newfile.txt</code>) or piping it onward if it looks right. <code>sed -i \'s/foo/bar/\' file.txt</code> edits the file IN PLACE — genuinely irreversible without a backup, which is exactly why previewing first (no -i) before committing (-i) is the safer habit.'
      ]
    },
    {
      h: 'sed patterns are regex, and can target specific lines',
      p: [
        'The pattern half of a sed substitution is a regular expression (BRE by default, matching everything from the last two lessons), which means anchors, character classes, and quantifiers all apply exactly as before: <code>sed \'s/^ERROR/FATAL/\'</code> only replaces "ERROR" when it appears at the very start of a line. sed can also target specific line NUMBERS or PATTERNS before applying a command: <code>sed \'3d\'</code> deletes line 3; <code>sed \'/DEBUG/d\'</code> deletes every line matching the pattern "DEBUG" entirely (a genuinely common log-cleanup one-liner); <code>sed -n \'/ERROR/p\'</code> prints ONLY lines matching "ERROR" (the <code>-n</code> suppresses sed\'s normal "print every line" default, and <code>p</code> explicitly prints matching ones — functionally similar to grep, though grep remains the more natural tool for pure filtering).'
      ]
    },
    {
      h: 'awk: built for column/field-shaped data',
      p: [
        'awk treats each input line as a row split into <b>fields</b>, by default on any run of whitespace — genuinely the right tool the moment data has a column shape (like <code>ps aux</code> output, or a CSV, or <code>/etc/passwd</code> with a different delimiter). <code>$1</code>, <code>$2</code>, <code>$3</code> refer to the 1st, 2nd, 3rd field of the CURRENT line; <code>$0</code> refers to the ENTIRE line, unmodified. <code>awk \'{print $1}\'</code> prints just the first field of every line — for <code>ps aux</code> output, that is the username column.',
        'The field delimiter is configurable with <code>-F</code>: <code>awk -F: \'{print $1}\' /etc/passwd</code> splits on a literal colon instead of whitespace, printing just the username field from each passwd line — directly building on the /etc/passwd structure from the users-groups-sudo lesson. This delimiter flexibility is exactly what makes awk the natural tool for CSV-like or custom-delimited data that sed and grep handle far more awkwardly.'
      ]
    },
    {
      h: 'awk built-ins and conditions: NF, NR, and filtering rows',
      p: [
        '<code>NF</code> (Number of Fields) holds how many fields the CURRENT line was split into — <code>awk \'{print NF}\'</code> prints the field count of every line, useful for spotting malformed rows that have an unexpected number of columns. <code>NR</code> (Number of Records/lines) holds the current line number, similar to grep\'s <code>-n</code> but usable inside arbitrary logic. <code>$NF</code> (dollar-sign NF, combining both) refers to the LAST field of the line, regardless of how many fields it has — genuinely useful when the number of fields varies but you always want the final one.',
        'awk supports a <code>condition { action }</code> pattern: <code>awk \'$3 > 1000 {print $1}\'</code> prints the first field, but ONLY for lines where the third field, treated as a number, is greater than 1000 — combining filtering and extraction in one command, something that would otherwise need grep AND cut chained together. <code>awk -F, \'NR > 1 {print $2}\' data.csv</code> — skip the header row (NR > 1) and print the second CSV column from every subsequent row — is a genuinely common, practical one-liner for quick CSV inspection without reaching for a spreadsheet tool at all.'
      ]
    }
  ],
  conceptFlow: {
    title: 'awk -F: \'{print $1}\' /etc/passwd — tracing one line through awk',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'One input line',
        nodes: [
          { id: 'line', text: 'nami:x:1001:1001:Nami,,,:/home/nami:/bin/bash' }
        ]
      },
      {
        label: 'Split on the delimiter',
        nodes: [
          { id: 'split', text: 'Split on ":" (from -F:)\ninto 7 fields' }
        ]
      },
      {
        label: 'Fields, numbered',
        nodes: [
          { id: 'f1', text: '$1 = "nami"' },
          { id: 'f2', text: '$2 = "x"' },
          { id: 'f3', text: '$3 = "1001"  (and so on through $7)' }
        ]
      },
      {
        label: 'The action',
        nodes: [
          { id: 'action', text: '{print $1}\nprint just the first field' }
        ]
      },
      {
        label: 'Output for this line',
        nodes: [
          { id: 'out', text: 'nami' }
        ]
      }
    ],
    steps: [
      { active: ['line'], note: 'awk processes one line at a time — here, a real line from /etc/passwd, colon-separated as covered in the users-groups-sudo lesson.' },
      { active: ['split'], note: '"-F:" tells awk to split on a literal colon instead of the default whitespace — this line splits into exactly 7 fields.' },
      { active: ['f1'], note: '$1 is the first field: the username, "nami".' },
      { active: ['f2'], note: '$2 is the second field: "x", the password placeholder (the real hash lives in /etc/shadow, as covered earlier).' },
      { active: ['f3'], note: '$3 onward continues through the UID, GID, comment, home directory, and shell — each one individually addressable as $3, $4, $5, $6, $7.' },
      { active: ['action'], note: 'The action block {print $1} runs once per line — here it simply prints the first field and discards the rest.' },
      { active: ['out'], note: 'Final output for this one line: just "nami" — awk repeats this same split-then-print process independently for every line in the file.' }
    ]
  },
  story: {
    onePiece: {
      title: 'The Ship\'s Log: Franky\'s Find-and-Replace, Nami\'s Column Reader',
      text: 'The Sunny keeps two very different kinds of records, and Franky and Nami each own the tool suited to their own record. Franky maintains the maintenance log as flowing prose — sentences, not columns — and when an old part gets renamed across the whole ship (a supplier changes a component\'s official name and every existing log entry now uses the outdated one), he does not rewrite every sentence by hand. He runs a single pass down the entire log: find every occurrence of the old name, replace it with the new one, leave everything else in each sentence completely untouched. Crucially, before committing to that pass across the ENTIRE historical log, he always runs it once as a preview first — see what the replaced version would look like without actually overwriting the original record — and only commits the in-place change once he has confirmed it looks right, because an in-place edit across months of maintenance history is not something he wants to redo if the replacement pattern was even slightly wrong. Nami\'s weather log is the opposite shape entirely: strict columns, always in the same order — date, location, pressure, wind speed, notes. When she needs "just the wind speed column, from every single entry, ignoring everything else," she is not doing find-and-replace on sentences at all — she is reading straight down one specific COLUMN across the whole log, field by field, and she can just as easily ask for "only the entries where wind speed exceeded a threshold" in the same pass, filtering and extracting together rather than as two separate steps. Robin, watching both of them work the same evening, observes it plainly: "You are both processing records. You are just processing completely different SHAPES of records."'
    },
    sitcom: {
      show: 'Friends',
      title: 'Chandler\'s Find-and-Replace Memo, Monica\'s Spreadsheet Columns',
      text: 'Chandler, drafting an office-wide memo, discovers partway through that he has been calling a project by its OLD codename throughout the entire document, and the actual name changed weeks ago. He does not proofread line by line hunting for it manually — he runs one clean substitution across the whole memo: every occurrence of the old name becomes the new name, nothing else in any sentence touched. And, being Chandler, he previews the result before actually sending it out company-wide, because irreversibly blasting a find-and-replace across a document that is about to go to the entire office, without checking it first, is exactly the kind of thing that goes wrong in a sitcom-appropriately mortifying way. Monica, separately, is working through a catering spreadsheet that is entirely column-shaped — client name, event date, headcount, total cost, one row per booking — and her task has nothing to do with replacing text inside sentences at all. She needs just the "headcount" column, across every single row, and specifically only for the rows where the total cost exceeds a certain number — filtering by one column\'s value while extracting a completely different column, in one pass, not two separate manual steps. When Chandler glances over and asks if he can help "find and replace" something in her spreadsheet, Monica does not even look up: "This is not a find-and-replace problem. This is a columns problem. Completely different tool for this."'
    },
    why: 'Franky and Chandler are doing sed\'s job: find text matching a pattern anywhere in flowing prose, replace it, preview before committing irreversibly. Nami and Monica are doing awk\'s job: data with a genuine column shape, where you address a specific field directly and can filter by one column\'s value while extracting another, in one pass. Recognizing WHICH shape your data actually has is the real skill — it is what tells you whether to reach for sed or awk in the first place.'
  },
  tech: [
    {
      q: 'Why does sed default to NOT modifying the original file, and why is that considered good design rather than an inconvenience?',
      a: 'sed streams input to output — reading from a source (a file or stdin) and writing the transformed result to stdout — without in-place modification unless explicitly told to via -i. This is good design because it makes the DEFAULT behavior safe and reversible: you can preview exactly what a substitution would produce, pipe it into another command, or redirect it to a new file, all without any risk to the original data. -i exists for when in-place editing is genuinely wanted, but making it opt-in (rather than the default) means a typo in a sed pattern cannot silently and irreversibly corrupt a file you did not mean to modify — you would see the wrong output on screen first, before ever committing to overwriting anything.'
    },
    {
      q: 'Why is awk generally a better fit than sed for "print the 3rd column of this CSV" — could sed do this at all?',
      a: 'sed operates on PATTERNS within a line as an undifferentiated string — it has no native concept of "fields" or "columns" at all. Extracting a specific column with sed alone requires writing a genuinely awkward regex to skip over N-1 delimiter-separated groups and capture the next one, fragile and hard to read. awk, by contrast, splits every line into fields automatically as its core operating model — $3 is simply "the third field," directly addressable, with the delimiter itself configurable via -F. For anything with a real column shape, awk is not just more convenient than sed, it is solving the actual problem directly rather than working around a tool that was not designed for it.'
    },
    {
      q: 'What does "NR > 1" accomplish in an awk one-liner processing a CSV file, and why is it needed so often?',
      a: 'NR (Number of Records) is awk\'s running count of which line is currently being processed, starting at 1. A CSV file conventionally has a HEADER row as its first line — column names, not actual data — and most processing wants to operate only on the real data rows, skipping that header. "NR > 1 {action}" means "only run this action for lines after the first one," which is exactly the common, simple way to skip a header row in awk without needing a separate tool step (like tail -n +2) beforehand. It shows up constantly in real CSV-processing one-liners for exactly this reason.'
    }
  ],
  code: {
    title: 'sed and awk, hands-on',
    intro: 'Try these against a scratch file — nothing here modifies anything unless -i is explicitly used.',
    code: `$ echo "the cat sat on the cat mat" | sed 's/cat/dog/'
the dog sat on the cat mat
# Only the FIRST occurrence on the line replaced.

$ echo "the cat sat on the cat mat" | sed 's/cat/dog/g'
the dog sat on the dog mat
# "g" flag: every occurrence replaced.

$ sed 's/foo/bar/' config.txt
# Prints the modified version to stdout — config.txt itself is UNCHANGED.

$ sed -i 's/foo/bar/' config.txt
# NOW config.txt is actually modified, in place, irreversibly (without a backup).

$ sed '/DEBUG/d' app.log
# Prints app.log with every line containing "DEBUG" removed — app.log itself unchanged.

$ ps aux | awk '{print $1, $11}'
USER     COMMAND
nami     nginx
root     systemd

$ awk -F: '{print $1}' /etc/passwd
nami
zoro
sanji
# Split on ":" instead of whitespace — the username field of each passwd line.

$ awk -F, 'NR > 1 {print $2}' bookings.csv
Alice
Bob
Carol
# Skip the header row (NR > 1), print just the second CSV column.

$ awk '{print NF, $0}' access.log
12 2026-07-16 09:01:03 GET /api/users 200 ...
# Prefixes each line with its own field count — useful for spotting malformed rows.`,
    notes: [
      'A trailing "s/// " with no "g" only replaces the FIRST match per line — a very common surprise for anyone expecting it to behave like a global find-and-replace by default.',
      'awk\'s default field separator is any run of whitespace (one or more spaces/tabs treated as one delimiter) — genuinely convenient for command output like ps aux, which does not use consistent single-space columns.'
    ]
  },
  lab: {
    title: 'Write the sed/awk command for each task',
    prompt: 'Write exactly one command per task below.',
    starter: `# Task: replace every occurrence of "staging" with "production" in deploy.conf, printing the result (do NOT modify the file)


# Task: same replacement, but this time actually edit deploy.conf in place


# Task: print just the 3rd whitespace-separated field of every line in data.txt


# Task: from a colon-delimited file called users.txt, print only the first field (like awk on /etc/passwd)

`,
    checks: [
      { re: 'sed\\s+.s/staging/production/g?.\\s+deploy\\.conf', flags: 'i', must: true, hint: 'sed \'s/staging/production/\' deploy.conf — no -i, so the file is unchanged.', pass: 'sed s/staging/production/ deploy.conf ✓' },
      { re: 'sed\\s+-i\\s+.s/staging/production/g?.\\s+deploy\\.conf', flags: 'i', must: true, hint: 'sed -i \'s/staging/production/\' deploy.conf — -i edits in place.', pass: 'sed -i s/staging/production/ deploy.conf ✓' },
      { re: "awk\\s+.\\{print\\s*\\$3\\}.\\s+data\\.txt", flags: 'i', must: true, hint: "awk '{print $3}' data.txt", pass: 'awk {print $3} data.txt ✓' },
      { re: 'awk\\s+-F:\\s+.\\{print\\s*\\$1\\}.\\s+users\\.txt', flags: 'i', must: true, hint: "awk -F: '{print $1}' users.txt", pass: 'awk -F: {print $1} users.txt ✓' }
    ],
    run: 'Try it for real: create a small scratch file, run the non -i sed command first to confirm it looks right, THEN try -i.',
    solution: `# Task: replace every occurrence of "staging" with "production" in deploy.conf, printing the result (do NOT modify the file)
sed 's/staging/production/g' deploy.conf

# Task: same replacement, but this time actually edit deploy.conf in place
sed -i 's/staging/production/g' deploy.conf

# Task: print just the 3rd whitespace-separated field of every line in data.txt
awk '{print $3}' data.txt

# Task: from a colon-delimited file called users.txt, print only the first field (like awk on /etc/passwd)
awk -F: '{print $1}' users.txt`,
    notes: [
      'The "g" flag matters for the staging/production replacement if any line could plausibly contain the word more than once — worth including as a default habit even when a single occurrence is expected.',
      'Always preview a sed substitution WITHOUT -i first when working against a file you cannot easily reconstruct — the previous lesson\'s discipline (least privilege, careful irreversible actions) applies here too.'
    ]
  },
  quiz: [
    {
      q: 'What does "sed \'s/foo/bar/\' file.txt" do to file.txt itself, without the -i flag?',
      options: ['Nothing at all — file.txt is left completely unchanged; the modified version prints to stdout only', 'It permanently replaces every "foo" with "bar" in file.txt', 'It creates a backup file automatically', 'It deletes file.txt and creates a new one'],
      correct: 0,
      explain: 'Without -i, sed streams the transformed output to stdout and never touches the source file — -i is required to actually edit in place.'
    },
    {
      q: 'What is the difference between "sed \'s/cat/dog/\'" and "sed \'s/cat/dog/g\'"?',
      options: ['No difference; g is ignored by sed', 'Without g, only the FIRST match per line is replaced; with g, EVERY match per line is replaced', 'g makes the search case-insensitive', 'g reverses which is search and which is replacement'],
      correct: 1,
      explain: 'The trailing "g" flag stands for "global" — without it, sed replaces only the first occurrence found on each line; with it, every occurrence on the line is replaced.'
    },
    {
      q: 'In awk, what does $1 refer to, and what does $0 refer to?',
      options: ['$1 is the first CHARACTER of the line; $0 is the last character', '$1 is the first FIELD of the current line; $0 is the ENTIRE current line, unmodified', '$1 and $0 are interchangeable', '$1 is the line number; $0 is the field count'],
      correct: 1,
      explain: '$1, $2, $3... refer to individual fields, split on the delimiter (whitespace by default, or set via -F). $0 refers to the whole unmodified line.'
    },
    {
      q: 'What does "awk -F: \'{print $1}\' /etc/passwd" print?',
      options: ['Every field of every line, comma-separated', 'Just the usernames — the first colon-delimited field of each line', 'The entire file, unchanged', 'Only lines that contain a colon'],
      correct: 1,
      explain: '-F: sets the field delimiter to a literal colon, splitting each /etc/passwd line on ":" — $1 is then the first such field, the username.'
    },
    {
      q: 'What does the awk condition "NR > 1" typically accomplish in a one-liner processing a CSV file?',
      options: ['It skips every row EXCEPT the first one', 'It skips the header row, since NR counts lines starting at 1 and the header is line 1', 'It filters to only numeric fields', 'It has no practical use in awk'],
      correct: 1,
      explain: 'NR is the current line number, starting at 1. "NR > 1" excludes line 1 specifically — the conventional header row in a CSV — so the action only runs on actual data rows.'
    }
  ],
  pitfalls: [
    'Reaching for -i immediately instead of previewing the substitution first — an in-place sed edit with a subtly wrong pattern is often irreversible without a separate backup, unlike the default (safe, preview-only) behavior.',
    'Forgetting the trailing "g" flag on a substitution and being surprised only the first match per line was replaced, not every one.',
    'Trying to extract a specific column from column-shaped data using sed\'s pattern matching instead of reaching for awk\'s native field splitting ($1, $2, -F) — technically possible with sed, but fragile and far harder to read than the tool actually built for the job.'
  ],
  interview: [
    {
      q: 'Explain what sed\'s "s/pattern/replacement/g" does, piece by piece, and why the trailing slash structure matters.',
      a: '"s" indicates a substitution command. The text between the first and second slash is the PATTERN to search for (a regular expression, in sed\'s default BRE mode). The text between the second and third slash is the REPLACEMENT text. An optional trailing flag after the final slash modifies the behavior — "g" (global) makes it replace every match on the line instead of just the first. The slash-delimited structure is what lets sed unambiguously separate "what to search for" from "what to replace it with" from "any modifying flags," all within one compact command — and the delimiter itself is actually configurable (s|pattern|replacement|g works identically), useful when the pattern or replacement itself needs to contain a literal forward slash, like a file path.'
    },
    {
      q: 'When would you choose awk over sed for a text-processing task, and when would sed be the better fit instead?',
      a: 'Reach for awk when the data has a genuine COLUMN or FIELD shape — command output like ps aux, CSVs, colon- or tab-delimited files — and the task involves addressing specific fields, filtering rows by a field\'s value, or computing something across fields (like a sum or count). Reach for sed when the task is fundamentally about PATTERN-BASED text transformation within flowing text — find-and-replace, deleting lines matching a pattern, simple line-based edits — where the data does not have a meaningful column structure to exploit. Using the wrong tool for the shape of data at hand usually still works, technically, but ends up notably more awkward — extracting a column with sed\'s regex, or doing complex prose find-and-replace with awk\'s field-oriented model, both fight the tool\'s natural design.'
    },
    {
      q: 'Walk through what "awk -F, \'$3 > 100 {print $1, $3}\' data.csv" computes.',
      a: '"-F," sets the field delimiter to a comma, splitting each line of data.csv into comma-separated fields. The expression "$3 > 100" is a CONDITION, evaluated for every line — treating the third comma-separated field as a number and comparing it to 100. For every line where that condition is true, the action block "{print $1, $3}" runs, printing the first and third fields (comma inside print here just separates the two printed values with a space, awk\'s default output separator). End to end: this scans a CSV, and for every row whose third column exceeds 100, prints that row\'s first and third columns — filtering and selective extraction combined into a single pass, rather than needing a separate filtering step and a separate extraction step chained together.'
    },
    {
      q: 'Why is sed\'s default of NOT modifying the source file (requiring an explicit -i to do so) considered a meaningful safety property, not just a quirk of the tool?',
      a: 'It means the DEFAULT invocation of sed is fully safe and non-destructive — you can run a substitution, inspect the output, pipe it somewhere else, or redirect it to a brand-new file, all without any risk to the original data, and only commit to modifying the actual source file once you have confirmed the transformation is correct. This mirrors a broader theme from earlier in the course — least privilege, previewing before committing to an irreversible action (the same instinct behind checking a plan before "kill -9," or reviewing a sudoers change with visudo before saving) — and it is precisely why the recommended habit is to run the plain, non -i version first as a preview, and only add -i once the output has actually been checked.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover single substitutions and simple field extraction. This is what is underneath: capture groups in sed replacements, awk\'s BEGIN/END blocks, and a genuinely common real pattern — computing a sum across a column.',
    sections: [
      {
        h: 'Capture groups in sed: \\1, \\2 in the replacement',
        p: [
          'Parentheses in a sed pattern (escaped as \\( \\) in default BRE mode, or unescaped with sed -E) create a CAPTURE GROUP — a portion of the match that can be reused in the replacement, referenced as \\1, \\2, and so on, in the order the groups appear. <code>sed -E \'s/([0-9]+)-([0-9]+)/\\2-\\1/\'</code> against "07-16" produces "16-07" — swapping two captured pieces around, rather than just deleting or replacing text outright. This is the mechanism behind reformatting dates, swapping name orders, or restructuring any text with a recognizable, capturable shape, without needing to know the exact literal text being transformed ahead of time.'
        ]
      },
      {
        h: 'awk\'s BEGIN and END blocks',
        p: [
          'A <code>BEGIN { }</code> block runs exactly once, before any input line is processed — useful for initializing variables or printing a header. An <code>END { }</code> block runs exactly once, after every input line has been processed — useful for printing a final summary. <code>awk \'BEGIN{print "Name,Total"} {print $1, $2} END{print "done"}\'</code> demonstrates all three parts of an awk program together: a one-time setup, a per-line action, and a one-time wrap-up — the general shape nearly every non-trivial awk program follows.'
        ]
      },
      {
        h: 'A genuinely common real pattern: summing a column',
        p: [
          '<code>awk -F, \'{sum += $3} END {print sum}\' data.csv</code> is one of the most practically useful one-liners in this entire lesson: for every line, add the third comma-separated field (as a number) to a running total variable "sum" — awk variables do not need to be declared in advance, and are automatically treated as numbers when used in numeric context — then, once every line has been processed, the END block prints the final total. This single line replaces what would otherwise require opening the file in a spreadsheet tool just to sum one column, and the same pattern generalizes readily to averages (divide by NR at the end), counts matching a condition, and similar row-by-row aggregations.'
        ]
      }
    ]
  }
};
