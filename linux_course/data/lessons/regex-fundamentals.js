window.LESSONS = window.LESSONS || {};
window.LESSONS['regex-fundamentals'] = {
  id: 'regex-fundamentals',
  title: 'Regex Fundamentals: Literals, ., *, +, ?, Anchors & Character Classes',
  category: 'Part 3 — Text, Pipes & Regex',
  timeMin: 50,
  summary: 'grep\'s pattern argument has been treated as "just some text" so far — this lesson opens up what it actually is: a regular expression, a small, precise language for describing SHAPES of text rather than exact text. Once these building blocks click, they apply everywhere — grep, sed, awk (both next), your editor\'s find/replace, and most programming languages\' own regex support.',
  goals: [
    'Explain what a regular expression is, and how it differs from a shell glob pattern',
    'Use literal characters and the . wildcard, including escaping a literal dot',
    'Use character classes: [abc], [^abc], [a-z], and the \\d/\\w/\\s shorthand classes',
    'Use the quantifiers *, +, ?, and {n,m} to control how many times something repeats',
    'Use ^ and $ anchors to require a match at the start and/or end of a line'
  ],
  concept: [
    {
      h: 'A regex describes a SHAPE of text, not a literal string — and it is not a glob',
      p: [
        'A regular expression (regex) is a pattern language for describing what text should LOOK LIKE — not one exact string, but a whole family of strings that share a shape. This is genuinely different from the wildcard patterns the shell itself uses for filenames (globs), and mixing the two up is one of the most common early confusions: in a shell glob, <code>*</code> means "any characters, any number of them" (as in <code>rm *.txt</code>); in a regex, <code>*</code> means something narrower and easier to misread — "zero or more of whatever came immediately before it." A glob\'s <code>*</code> stands alone; a regex\'s <code>*</code> always modifies the thing right before it.',
        'That single difference is worth internalizing before anything else in this lesson: regex quantifiers (covered below) always apply to the PRECEDING element, never floating free the way a glob wildcard does.'
      ]
    },
    {
      h: 'Literal characters and the . wildcard',
      p: [
        'Most characters in a regex are <b>literal</b> — they match exactly themselves. The pattern <code>cat</code> matches the three characters c, a, t, in that exact sequence, appearing anywhere in the line (unless anchored — see below). The <code>.</code> (dot) is the first special character worth knowing: it matches ANY single character except a newline. <code>c.t</code> matches "cat," "cot," "c9t," "c t" — anything with exactly one character, of any kind, between a literal c and a literal t.',
        'Because dot is special, matching a LITERAL dot (like in a version number, "3.11") requires escaping it with a backslash: <code>3\\.11</code>. Forgetting this escape is a classic, genuinely common regex bug — an unescaped dot in a pattern like <code>192.168.1.1</code> would technically also match "192X168Y1Z1," since every dot is silently acting as "any character" instead of a literal period.'
      ]
    },
    {
      h: 'Character classes: matching one of several possibilities',
      p: [
        'Square brackets define a <b>character class</b> — match exactly ONE character, but any one FROM the listed set. <code>[abc]</code> matches a single a, b, or c. <code>[a-z]</code> uses a range shorthand for every lowercase letter; <code>[0-9]</code> for every digit; ranges can combine, like <code>[a-zA-Z0-9]</code> for any single letter or digit. A caret as the FIRST character inside the brackets negates it: <code>[^0-9]</code> matches any single character that is NOT a digit.',
        'A handful of shorthand classes cover the most common cases without spelling out ranges by hand (widely supported, though technically GNU extensions rather than pure POSIX): <code>\\d</code> for a digit (same as <code>[0-9]</code>), <code>\\w</code> for a "word character" (letters, digits, underscore), <code>\\s</code> for whitespace (space, tab, newline). Their uppercase counterparts negate: <code>\\D</code>, <code>\\W</code>, <code>\\S</code>.'
      ]
    },
    {
      h: 'Quantifiers and anchors: how many, and where',
      p: [
        'Quantifiers control how many times the preceding element may repeat. <code>*</code> means zero or more; <code>+</code> means one or more (at least one — the key difference from <code>*</code>); <code>?</code> means zero or one (optional, at most once); <code>{n,m}</code> means an exact range, n to m repetitions (<code>{3}</code> alone means exactly 3; <code>{2,}</code> means 2 or more, no upper bound). <code>colou?r</code> matches both "color" and "colour" — the <code>u</code> is optional. <code>\\d{3}-\\d{4}</code> matches exactly three digits, a literal hyphen, then exactly four digits — a phone-number-shaped pattern.',
        '<b>Anchors</b> do not match a character at all — they match a POSITION. <code>^</code> matches the start of a line; <code>$</code> matches the end of a line. <code>^ERROR</code> only matches a line that STARTS WITH "ERROR" (not one that merely contains it somewhere in the middle); <code>ERROR$</code> only matches a line ending in "ERROR"; <code>^ERROR$</code> matches a line that is EXACTLY "ERROR" and nothing else. Anchors are exactly how you turn "contains this somewhere" into "is shaped exactly like this," a distinction that matters constantly in log-filtering and validation patterns alike.'
      ]
    }
  ],
  conceptFlow: {
    title: 'Does "ab*c" match "abbbc"? Tracing the regex engine',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'The pattern and the text',
        nodes: [
          { id: 'pattern', text: 'Pattern: ab*c\ntext: "abbbc"' }
        ]
      },
      {
        label: 'Match the fixed parts',
        nodes: [
          { id: 'matcha', text: 'Match literal "a"\nagainst position 0: "a" — OK' }
        ]
      },
      {
        label: 'The repeating part',
        nodes: [
          { id: 'starb', text: 'b* means "zero or more b"\nconsume every "b" it can: "bbb"' }
        ]
      },
      {
        label: 'Match the rest',
        nodes: [
          { id: 'matchc', text: 'Match literal "c"\nagainst whatever is left: "c" — OK' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'success', text: 'Full match: "abbbc"\nevery part of the pattern was satisfied' }
        ]
      }
    ],
    steps: [
      { active: ['pattern'], note: 'Three pieces to this pattern: a literal "a", then "b*" (zero or more b), then a literal "c".' },
      { active: ['matcha'], note: 'The engine starts at the beginning of the text and matches the literal "a" against the first character — a direct match.' },
      { active: ['starb'], note: 'Next comes "b*" — the engine greedily consumes as many consecutive "b" characters as it can find, which here is all three of them.' },
      { active: ['matchc'], note: 'With the b\'s consumed, the engine checks the very next character against the literal "c" in the pattern — and finds exactly that.' },
      { active: ['success'], note: 'Every piece of the pattern found something to match, in order, with nothing left unaccounted for — "ab*c" matches "abbbc" successfully. Note "ac" (zero b\'s) and "abc" (one b) would BOTH also match this same pattern — that is exactly what "zero or more" means.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Sanji\'s Pantry Labels, Smudges, and the Optional "Sea-"',
      text: 'Sanji runs the Sunny\'s pantry with a labeling discipline nobody else on the crew fully appreciates until the one storm that smudges half the ink. Every jar SHOULD be labeled starting with the exact word "SPICE:" — no exceptions, that is simply how the system works, and any jar whose label does not begin that way is not spice at all, full stop; a scan for "starts with SPICE:" is meant to find spice jars and only spice jars. Some jars carry an optional regional prefix before the ingredient name — "sea-salt" versus plain "salt" — and Sanji\'s mental search treats that "sea-" as entirely optional: present zero times or exactly once, never assumed, never required. After the storm, a good third of the labels have one letter smudged into an unreadable blot, though always exactly one character, never zero and never several — so his search for "salt" has to tolerate any single unknown character sitting in for the smudge, matching "s?lt" or "sa?t" equally well as long as the rest lines up. And the spice-heat marker at the end of certain labels is a string of exclamation points, anywhere from one to an unbounded number depending on how enthusiastic whoever labeled it that week happened to be — a search for "at least one" mark, not "exactly one," correctly catches a jar marked "!" as readily as one marked "!!!!!." Zoro, watching Sanji rifle through the shelves at speed during the recovery, is baffled that he never seems to grab a decoy jar by mistake despite half the labels being damaged. Sanji\'s answer, mid-search, without looking up: "I am not looking for exact spelling. I am looking for the SHAPE the label is supposed to have."'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Tupperware Labels Have a Format, and the Format Is the Whole Point',
      text: 'Monica\'s kitchen storage system runs on a labeling scheme precise enough that Chandler once compares it, not entirely as a joke, to a legal filing system. Every container label MUST begin with a category word in all capitals — "SOUP," "SAUCE," "LEFTOVERS" — and nothing else is allowed to start that way; if it does not begin with an all-caps category word, as far as Monica\'s system is concerned, it simply is not properly labeled, no matter what is actually inside. After the category comes a literal hyphen, then a date in an exact, non-negotiable digit format — always two digits for the month, always two digits for the day, never one digit with a space padded in, never four digits crammed together without separators. And at the very end, some labels carry a string of exclamation points denoting "eat this soon or else," anywhere from a single mark up to as many as Monica felt the situation warranted that day — never zero if it is present at all, but no fixed upper limit either. When Rachel, attempting to help and clearly out of her depth, labels a container just "leftover stuff, i think from tuesday???" in lowercase with no hyphen and no proper date format, Monica does not merely find the label imperfect — she treats it as not really being a label in her system AT ALL, because it fails the shape the format requires from the very first character onward. "It is not about whether I can figure out what is in here," Monica says, already re-labeling it. "It is about the label actually matching the format, from the start."'
    },
    why: 'Both Sanji and Monica are matching against a SHAPE, not memorizing exact strings: a required literal start (SPICE:, or an all-caps category), an optional piece that may or may not appear (sea-, or nothing), a wildcard tolerant of exactly one damaged character, and an open-ended repeat of urgency marks. That is precisely what a regex made of anchors, literals, ?, ., and + expresses — a shape a huge family of specific strings can satisfy, not one fixed string.'
  },
  tech: [
    {
      q: 'Why does confusing shell glob syntax with regex syntax cause real bugs, given that both use * and both look similar?',
      a: 'A shell glob\'s * is a standalone wildcard meaning "any characters, any number, right here" — it never depends on anything before it. A regex\'s * is a QUANTIFIER, always modifying whatever character or group immediately precedes it, meaning "zero or more of THAT specific thing." Someone reaching for "match anything" in a regex and writing a bare * (rather than .* — dot, then star, meaning "zero or more of ANY character") will get a confusing error or an unexpectedly narrow match, because a lone * with nothing meaningful before it is either invalid or matches zero-or-more of whatever the immediately preceding token happens to be, not "anything" in the glob sense at all.'
    },
    {
      q: 'What is the actual difference between + and *, and why does that distinction matter in a real pattern?',
      a: '* allows zero occurrences — the thing it modifies is fully optional, and can be entirely absent. + requires AT LEAST ONE occurrence — the thing it modifies must appear, just with no fixed upper limit on how many times. The difference matters concretely: a pattern like \\d* would successfully match an EMPTY string (zero digits), while \\d+ requires at least one actual digit to be present to match at all. Using * where + was intended is a common source of a pattern "matching" something it should have rejected — like accidentally treating an empty field as valid input because the quantifier allowed for zero characters.'
    },
    {
      q: 'Why is escaping a literal dot with a backslash so important in patterns like matching version numbers or IP addresses?',
      a: 'Because an unescaped dot means "any single character," not literally a period — a pattern like 192.168.1.1, written without escaping, would ALSO match strings like "192X168Y1Z1," since each dot is silently standing in for any character rather than requiring an actual period. This is a genuinely common, easy-to-miss bug precisely because the incorrect pattern still matches the intended string correctly — it just ALSO matches a much wider, unintended set of strings, which usually only surfaces as a real problem later, when some unrelated text happens to have the right shape apart from the periods.'
    }
  ],
  code: {
    title: 'Regex building blocks with grep -E',
    intro: 'grep -E enables extended regex, avoiding the backslash-escaping quirks of grep\'s default basic mode from the last lesson.',
    code: `$ echo -e "cat\\ncot\\ncut\\ncart" | grep -E "c.t"
cat
cot
cut
# "." matches any single character — cart doesn't match (two chars between c and t).

$ echo -e "3.11\\n3X11\\n3211" | grep -E "3\\.11"
3.11
# Escaped dot — only matches an actual literal period, not "any character."

$ echo -e "color\\ncolour\\ncolouur" | grep -E "colou?r"
color
colour
# "u?" means zero or one "u" — colouur (two u's) does not match.

$ echo -e "123-4567\\n12-4567\\nabc-4567" | grep -E "^[0-9]{3}-[0-9]{4}$"
123-4567
# Anchored, exact digit counts — the only line matching the full phone-number shape.

$ echo -e "ERROR: disk full\\nsome ERROR here\\nERROR" | grep -E "^ERROR"
ERROR: disk full
ERROR
# ^ requires the line to START WITH ERROR — "some ERROR here" doesn't qualify.

$ echo -e "!!!\\n!\\n(none)" | grep -E "^!+$"
!!!
!
# "+" requires at least one "!" — the whole line must be nothing but exclamation marks.`,
    notes: [
      'grep -E avoids needing to backslash-escape ( ) and | for grouping/alternation — worth defaulting to -E unless there is a specific reason to use grep\'s basic mode.',
      'echo -e with \\n is just a convenient way to feed grep multiple test lines at once in these examples — in real use, these patterns would run against an actual file or piped command output.'
    ]
  },
  lab: {
    title: 'Write the regex pattern for each described shape',
    prompt: 'Write a regex (as you would pass to grep -E) matching exactly what each task describes. Type just the pattern.',
    starter: `# Task: matches a line that is exactly three digits, nothing else (anchored both ends)


# Task: matches "gray" or "grey" (the only difference is a/e in that one position)


# Task: matches any line starting with the word "WARNING"


# Task: matches one or more consecutive digits anywhere in the line

`,
    checks: [
      { re: '\\^(\\[0-9\\]|\\\\d)\\{3\\}\\$', flags: '', must: true, hint: 'Something like ^[0-9]{3}$ — anchored on both ends, exactly 3 digits.', pass: '^[0-9]{3}$ ✓' },
      { re: 'gr\\[ae\\]y|gr\\(a\\|e\\)y', flags: '', must: true, hint: 'Something like gr[ae]y — a character class with a or e.', pass: 'gr[ae]y ✓' },
      { re: '\\^WARNING', flags: '', must: true, hint: 'Something like ^WARNING — anchored to the start of the line.', pass: '^WARNING ✓' },
      { re: '(\\[0-9\\]|\\\\d)\\+', flags: '', must: true, hint: 'Something like [0-9]+ or \\d+ — one or more digits.', pass: '[0-9]+ or \\d+ ✓' }
    ],
    run: 'Try each pattern for real: echo "text" | grep -E "your-pattern-here" against a few example lines, including ones that should NOT match.',
    solution: `# Task: matches a line that is exactly three digits, nothing else (anchored both ends)
^[0-9]{3}$

# Task: matches "gray" or "grey" (the only difference is a/e in that one position)
gr[ae]y

# Task: matches any line starting with the word "WARNING"
^WARNING

# Task: matches one or more consecutive digits anywhere in the line
[0-9]+`,
    notes: [
      '\\d+ is an equally correct answer to [0-9]+ on tools supporting the GNU shorthand — both describe the same shape.',
      'gr(a|e)y using grouping and alternation also correctly matches "gray"/"grey" — character classes and alternation often overlap for single-character choices like this.'
    ]
  },
  quiz: [
    {
      q: 'In a shell glob (like rm *.txt), * means "any characters." What does * mean in a regex?',
      options: ['The exact same thing as a glob — any characters, any number', 'Zero or more of whatever character or group came immediately before it', 'Exactly one of any character', 'One or more of whatever came before it'],
      correct: 1,
      explain: 'A regex\'s * is a quantifier applying to the preceding element specifically — "zero or more of THAT" — never a standalone "match anything" wildcard the way a glob\'s * is.'
    },
    {
      q: 'What does the pattern "c.t" match?',
      options: ['Only the literal string "c.t"', 'Any string starting with c and ending with t, any length in between', '"c" followed by any ONE character followed by "t" (like cat, cot, c9t)', 'Only "cat" and "cot," nothing else'],
      correct: 2,
      explain: '"." matches exactly one character of any kind (except newline) — "c.t" is a literal c, then any single character, then a literal t.'
    },
    {
      q: 'What is the key difference between the quantifiers * and +?',
      options: ['They are identical', '* requires at least 2 occurrences; + requires at least 3', '* allows zero occurrences (fully optional); + requires at least one', '* only works with digits; + only works with letters'],
      correct: 2,
      explain: '* means "zero or more" (can be entirely absent); + means "one or more" (must appear at least once). This is exactly why \\d* can match an empty string but \\d+ cannot.'
    },
    {
      q: 'What does the pattern "^ERROR$" match, that "ERROR" alone (unanchored) would NOT correctly distinguish?',
      options: ['They match exactly the same set of lines', '"^ERROR$" matches ONLY a line that is exactly "ERROR" and nothing else; unanchored "ERROR" matches any line merely containing it anywhere', '"^ERROR$" is invalid syntax', '"^ERROR$" matches more lines than unanchored "ERROR"'],
      correct: 1,
      explain: 'Anchors match POSITIONS, not characters. ^ requires the start of the line, $ requires the end — together they require the ENTIRE line to be exactly "ERROR," while unanchored "ERROR" matches it appearing anywhere within a longer line too.'
    },
    {
      q: 'Why must a literal period (like in an IP address or version number) be escaped as \\. in a regex?',
      options: ['It does not need escaping; a plain "." always means a literal period', 'Because unescaped "." matches ANY single character, not specifically a period, so escaping is required to mean a literal dot', 'Escaping a period makes the pattern run faster', 'Periods cannot appear in regex patterns at all'],
      correct: 1,
      explain: 'Unescaped, "." is the any-character wildcard. Writing "\\." tells the regex engine to match a literal period specifically — otherwise a pattern intended for "192.168.1.1" would also match strings with any other character in place of each period.'
    }
  ],
  pitfalls: [
    'Treating regex\'s * like shell glob\'s * ("match anything") instead of what it actually is — a quantifier on the preceding element specifically ("zero or more of THAT").',
    'Forgetting to escape a literal dot (as in an IP address or version number), silently allowing the pattern to match strings that have any OTHER character in that position too — a bug that often goes unnoticed because the intended string still matches correctly.',
    'Using * where + was actually meant, allowing a pattern to match on zero occurrences (like an empty field) when the intent was "this must appear at least once."'
  ],
  interview: [
    {
      q: 'Explain what a regular expression is, and why it is fundamentally different from a shell glob pattern, even though both are used for "matching."',
      a: 'A regular expression describes a SHAPE that a family of strings can satisfy — literal characters, wildcards, repeatable and optional pieces, and positional anchors, combined into a pattern. A shell glob is a much narrower, filename-specific matching syntax where wildcards like * stand alone, meaning "any characters, any number, right here," with no concept of quantifiers modifying a preceding element. The confusion between the two is real and common precisely because they share some symbols (like *) while assigning them structurally different meanings — a regex\'s * always modifies whatever came immediately before it; a glob\'s does not modify anything, it simply IS the wildcard.'
    },
    {
      q: 'Walk through how you would build a regex to match a US-style phone number written as 123-456-7890, and explain each piece.',
      a: 'Something like ^[0-9]{3}-[0-9]{3}-[0-9]{4}$. Piece by piece: ^ anchors to the start of the line, so nothing can precede the number for a match; [0-9]{3} requires exactly three digits (a character class combined with an exact-count quantifier); a literal hyphen follows; [0-9]{3} again for the next three digits; another literal hyphen; [0-9]{4} for the final four digits; $ anchors to the end of the line, so nothing can follow either. Anchoring both ends specifically prevents a longer string that merely CONTAINS a phone-number-shaped substring from incorrectly matching — without ^ and $, "123-456-78901" (one digit too many) would still match, since the required shape appears within it even though the whole line does not conform.'
    },
    {
      q: 'What is the practical difference between [0-9] and \\d, and between [^0-9] and \\D?',
      a: '[0-9] and \\d are functionally equivalent in tools that support the \\d shorthand — both match any single digit character; \\d is simply more concise. The bracket form [0-9] is the more universally portable choice, since \\d is technically a GNU/PCRE-style extension rather than pure POSIX and is not guaranteed to be supported in every regex-consuming tool. [^0-9] and \\D are likewise equivalent to each other — both match any single character that is NOT a digit, with the caret as the first character inside brackets acting as negation for the whole class.'
    },
    {
      q: 'Why does an unanchored pattern like "ERROR" behave so differently from "^ERROR$" when filtering log lines, and when would you deliberately want the unanchored version?',
      a: 'Unanchored "ERROR" matches any line that CONTAINS "ERROR" anywhere within it, regardless of what else is on that line — appropriate when you genuinely just want to know whether the word appears at all, anywhere, such as scanning a log for any mention of an error condition. "^ERROR$" requires the entire line to consist of EXACTLY "ERROR" and nothing else, appropriate when validating that a value or field conforms to a very specific, complete shape rather than merely containing a recognizable substring — like validating that an entire input field is nothing but digits, rather than merely contains some digits somewhere within a longer string that might include invalid characters elsewhere.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover the building blocks well enough to write and read most everyday patterns. This is what is underneath: POSIX character classes, word boundaries, and a first honest look at why regex matching is not always as cheap as it looks.',
    sections: [
      {
        h: 'POSIX character classes: [[:alpha:]] and friends',
        p: [
          'Alongside \\d/\\w/\\s, POSIX defines bracket-expression classes with a distinctive double-bracket syntax: <code>[[:digit:]]</code>, <code>[[:alpha:]]</code>, <code>[[:alnum:]]</code>, <code>[[:space:]]</code>, <code>[[:upper:]]</code>, <code>[[:lower:]]</code>, <code>[[:punct:]]</code>. They look unusual but solve a real portability problem: they work correctly even in strict POSIX tools and locales where \\d/\\w are not supported at all, and — more subtly — they respect the current locale\'s definition of "a letter," which matters for text containing accented characters that a naive [a-zA-Z] range would silently exclude.'
        ]
      },
      {
        h: 'Word boundaries: \\b',
        p: [
          '<code>\\b</code> matches a POSITION (like ^ and $), specifically the boundary between a "word character" (\\w) and a non-word character, without consuming any character itself. <code>\\bcat\\b</code> matches "cat" as a whole word — matching in "a cat sat" but NOT inside "category," since there is no boundary between the "t" of "cat" and the following "e" (both are word characters, so no boundary exists there). Without \\b, a plain "cat" pattern would incorrectly match the "cat" hiding inside "category," "concatenate," and similar longer words — a genuinely common source of over-broad matches in real search-and-replace work.'
        ]
      },
      {
        h: 'Backtracking and why a "simple-looking" pattern can be slow',
        p: [
          'Most regex engines (including grep\'s) work by trying a match, and when it fails partway through, BACKTRACKING — undoing some of what a greedy quantifier consumed and retrying with less. For most everyday patterns this is invisible and instantaneous. But certain pattern shapes — particularly NESTED or ADJACENT quantifiers over the same characters, like <code>(a+)+b</code> matched against a long string of a\'s with no trailing b — can force the engine through an explosively large number of backtracking attempts, a well-known phenomenon called "catastrophic backtracking" that can make an innocent-looking pattern take seconds or minutes instead of microseconds. It is worth knowing this exists as a category of problem, even if writing everyday grep/sed patterns rarely triggers it in practice — mostly relevant when a pattern is applied to untrusted or adversarial input, where it becomes an actual denial-of-service vector.'
        ]
      }
    ]
  }
};
