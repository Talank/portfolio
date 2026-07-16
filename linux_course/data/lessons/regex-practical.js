window.LESSONS = window.LESSONS || {};
window.LESSONS['regex-practical'] = {
  id: 'regex-practical',
  title: 'Regex, Practically: Groups, Greedy vs Lazy, Extended Regex, Real Patterns',
  category: 'Part 3 — Text, Pipes & Regex',
  timeMin: 45,
  summary: 'The last lesson built the individual pieces. This one assembles them into the patterns you will actually reach for on a real system: grouping and alternation, the difference between greedy and lazy matching (and why it matters more than it looks), basic vs extended regex mode, and a handful of genuinely common real-world patterns worth recognizing on sight — an IP address, a log timestamp, an email-shaped string.',
  goals: [
    'Use parentheses to group parts of a pattern, and | (pipe) for alternation within a group',
    'Explain the difference between greedy and lazy (non-greedy) quantifiers, and when it matters',
    'Explain the difference between basic (BRE) and extended (ERE) regex, and when each escaping style applies',
    'Read and adapt common real-world patterns: IP addresses, log timestamps, simple email shapes',
    'Combine grouping, alternation, and quantifiers into one multi-part pattern and predict its matches'
  ],
  concept: [
    {
      h: 'Grouping and alternation: ( ) and |',
      p: [
        'Parentheses <b>group</b> part of a pattern so a quantifier or alternation can apply to the WHOLE group, not just the single character before it. <code>(ab)+</code> matches one or more repetitions of the literal pair "ab" — "ab," "abab," "ababab" — genuinely different from <code>ab+</code>, which only applies the <code>+</code> to the "b" alone, matching "a" followed by one-or-more b\'s ("ab," "abb," "abbb").',
        'The <code>|</code> (pipe) inside or around a group means <b>alternation</b> — "this OR that." <code>cat|dog</code> matches either "cat" or "dog"; <code>gr(a|e)y</code> matches "gray" or "grey" specifically at that one position, functionally similar to the character class <code>gr[ae]y</code> from the last lesson but generalizing to alternatives that are not single characters — <code>(Mr|Mrs|Ms)\\. Smith</code> could not be written as a character class at all, since each alternative is multiple characters long.'
      ]
    },
    {
      h: 'Greedy vs lazy: how much does a quantifier actually consume?',
      p: [
        'By default, quantifiers are <b>greedy</b> — they consume as MUCH as possible while still allowing the overall pattern to match, then backtrack only if forced to. This has a genuinely surprising consequence with a pattern like <code>".*"</code> (a quoted string) against the text <code>"first" and "second"</code>: greedy <code>.*</code> does not stop at the first closing quote — it consumes everything up to the LAST possible closing quote in the line, matching the entire <code>"first" and "second"</code> as one single match, not two separate quoted strings.',
        'A <b>lazy</b> (non-greedy) quantifier, written with a trailing <code>?</code> after the quantifier itself — <code>.*?</code> — consumes as LITTLE as possible instead, stopping at the first opportunity that still lets the rest of the pattern match. <code>".*?"</code> against that same text correctly matches "first" and "second" as two SEPARATE matches, stopping each time at the nearest closing quote rather than the furthest one. Support for lazy quantifiers varies by tool — grep\'s classic engine does not support <code>.*?</code> at all, while <code>grep -P</code> (Perl-compatible regex) and most programming languages do — worth knowing as a real, occasionally blocking limitation, not just a syntax detail.',
        '<div class="math">Text:    "first" and "second"<br>Greedy .*  →  matches the WHOLE span: "first" and "second"<br>Lazy   .*? →  matches "first" ...then separately... "second"<span class="mnote">Same quantifier symbol, opposite instinct: greedy grabs the most it can get away with; lazy grabs the least it can get away with.</span></div>'
      ]
    },
    {
      h: 'Basic vs extended regex: when do parentheses and pipes need a backslash?',
      p: [
        'The previous lesson touched on this briefly; here is the full picture. POSIX <b>Basic Regular Expressions</b> (BRE — grep\'s default, sed\'s default) require certain metacharacters to be ESCAPED to gain their special meaning: <code>\\(</code> <code>\\)</code> for grouping, <code>\\|</code> for alternation, <code>\\{</code> <code>\\}</code> for the <code>{n,m}</code> quantifier. Unescaped, those same characters are just literal text in BRE. POSIX <b>Extended Regular Expressions</b> (ERE — <code>grep -E</code>, <code>egrep</code>, <code>awk</code>) flip this entirely: <code>(</code> <code>)</code> <code>|</code> <code>{</code> <code>}</code> work unescaped, and escaping them instead makes them literal.',
        'This is not a small stylistic difference — the exact same-looking pattern behaves completely differently depending on which mode reads it, which is exactly why knowing which tool/flag you are using, and which mode it defaults to, matters as much as knowing the regex syntax itself. As a practical default: reach for <code>-E</code> (or the tool\'s extended-mode equivalent) unless there is a specific reason not to — it matches the unescaped syntax most people expect and avoids a whole category of "why did my grouping just not work" confusion.'
      ]
    },
    {
      h: 'Recognizing common real-world patterns',
      p: [
        'A handful of shapes come up constantly enough to be worth recognizing on sight, even if you never memorize them perfectly. A simple (imperfect but broadly useful) IPv4 pattern: <code>^([0-9]{1,3}\\.){3}[0-9]{1,3}$</code> — a group of "1-3 digits then a literal dot," repeated exactly 3 times, then one more "1-3 digits" without a trailing dot. It is deliberately imperfect (it would also accept "999.999.999.999," since it does not actually validate the 0-255 range) — genuinely correct IP validation needs a much longer pattern, and knowing when "good enough" is actually good enough is itself a practical skill.',
        'A common log timestamp shape: <code>^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}</code> — four digits, hyphen, two digits, hyphen, two digits, space, then hours:minutes:seconds. A simple email-shaped pattern (again, deliberately loose, not fully RFC-compliant): <code>^[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}$</code> — one or more "word-ish" characters, an @ sign, a domain name, a literal dot, then a top-level domain of at least 2 letters. None of these are production-grade validators on their own, but reading and adapting a pattern like this — rather than writing one entirely from scratch — is the far more common real-world skill.'
      ]
    }
  ],
  conceptFlow: {
    title: 'Greedy .* vs lazy .*? against the same text',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'The text and pattern',
        nodes: [
          { id: 'text', text: 'Text: "first" and "second"\nPattern: ".*"' }
        ]
      },
      {
        label: 'Greedy path',
        nodes: [
          { id: 'greedystart', text: 'Greedy .*\nconsume EVERYTHING first' },
          { id: 'greedyback', text: 'Then backtrack ONLY as needed\nto let the final " still match' }
        ]
      },
      {
        label: 'Greedy result',
        nodes: [
          { id: 'greedyresult', text: 'Matches the WHOLE span:\n"first" and "second"' }
        ]
      },
      {
        label: 'Lazy path',
        nodes: [
          { id: 'lazystart', text: 'Lazy .*?\nconsume NOTHING first' },
          { id: 'lazyforward', text: 'Then extend ONLY as needed\nto let the closing " match ASAP' }
        ]
      },
      {
        label: 'Lazy result',
        nodes: [
          { id: 'lazyresult', text: 'Matches just "first"\n(then separately, "second")' }
        ]
      }
    ],
    steps: [
      { active: ['text'], note: 'Same text, same pattern shape — the only difference will be whether the .* is greedy or lazy.' },
      { active: ['greedystart'], note: 'A greedy .* starts by trying to consume the ENTIRE rest of the line, all the way to the end.' },
      { active: ['greedyback'], note: 'It then backtracks — gives back characters one at a time — only until the final closing quote in the pattern has something to match against. It backtracks the MINIMUM needed, which lands it on the very LAST quote in the line.' },
      { active: ['greedyresult'], note: 'Result: the match spans from the first opening quote all the way to the last closing quote in the line — swallowing "and" in between, which was probably not the intent.' },
      { active: ['lazystart'], note: 'A lazy .*? starts by trying to consume NOTHING at all.' },
      { active: ['lazyforward'], note: 'It then extends forward, one character at a time, only until the closing quote has something to match — stopping at the very FIRST opportunity.' },
      { active: ['lazyresult'], note: 'Result: the match stops at the nearest closing quote, correctly isolating "first" as its own match — the regex engine would then continue and find "second" as a separate match afterward.' }
    ]
  },
  story: {
    onePiece: {
      title: 'The Grand Line Chart Room: "Whichever Route, As Long As It Reaches the Next Island"',
      text: 'Nami\'s chart room handles route planning with a discipline that only really shows itself the day a new navigator-in-training tries to shortcut it. Certain waypoints have MULTIPLE acceptable approaches, and Nami\'s planning explicitly allows any one of them, grouped as one decision rather than three separate rules — "approach from the north current, OR the east current, OR the calm channel, whichever is actually open that day" — a single grouped either-or, not three independent plans that happen to overlap. The trickier lesson is the one about greed. Given the instruction "chart the SHORTEST safe path between here and the next island," a careless planner defaults to a "grab everything, sort it out later" instinct — plot every possible waypoint the ENTIRE way to the FARTHEST visible landmark first, then trim back only as much as strictly necessary to still call it "safe." That gets a route, technically, but it is needlessly the longest one that barely still qualifies. Nami\'s actual method runs the opposite direction: start by claiming NOTHING beyond the bare minimum, and extend the route outward only one waypoint at a time, stopping the very FIRST moment a valid, safe path to the next island exists — rather than continuing on toward the farthest point and only reluctantly giving ground back afterward. Same map, same rules about what counts as "safe," but a genuinely different route depending on whether you grab everything first and trim back, or grab nothing first and extend only as needed. Usopp, watching both routes plotted side by side on the same chart, is startled they end up so different when the rules were, on paper, "the same."'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s "Any of These Days Works" vs. Booking the Absolute Latest Possible Slot',
      text: 'Sheldon, scheduling a lab session with Leonard, phrases the request in a way that is technically an alternation even if he would never call it that: "Tuesday, OR Wednesday, OR Thursday, whichever is open — treat it as one combined option, not three separate requests I need answered individually." That part goes smoothly. The part that causes an actual argument is a scheduling instinct Sheldon reveals a few weeks later, applied to a shared lab reservation system that lets you claim a block "up to" a certain end time. Left to his own devices, Sheldon\'s default is to claim the ENTIRE available window all the way to its absolute latest possible end time first, and only reluctantly release minutes back if someone else explicitly needs them and forces the issue — grab everything conceivable up front, give ground back only under direct pressure. Amy, scheduling the exact same kind of block for her own experiments, does the opposite entirely: she claims only the minimum time she actually expects to need, extending her reservation later, in small increments, ONLY if she genuinely runs over — never grabbing more up front than the moment currently requires. Same reservation system, same rule about "you may hold up to the maximum," but the two of them end up with wildly different blocks on the calendar, purely because one of them defaults to grabbing the most possible and shrinking only when forced, and the other defaults to grabbing the least possible and growing only when actually necessary. Leonard, looking at both calendars side by side, says what everyone is thinking: "You are both technically following the rule. You are just following it in completely opposite directions."'
    },
    why: 'Nami\'s "any of these routes" and Sheldon\'s "any of these days" are both alternation — one grouped either-or decision, not several separate rules. But the deeper lesson is greedy vs lazy: given the same permission ("up to this maximum" or "as long as it is still safe"), a GREEDY approach claims the most possible up front and gives ground back only when forced; a LAZY approach claims the least possible and extends only when actually necessary. Same rule, opposite instinct, genuinely different results — exactly the difference between .* and .*?.'
  },
  tech: [
    {
      q: 'Why does "(ab)+" behave completely differently from "ab+", even though they look almost identical?',
      a: 'The quantifier always applies to whatever comes IMMEDIATELY before it — in "ab+", that is just the single character "b," so the pattern requires a literal "a" followed by one-or-more b\'s ("ab", "abb", "abbb"...). In "(ab)+", the parentheses group "ab" together FIRST, so the "+" applies to the whole two-character group, requiring one-or-more repetitions of the entire "ab" pair ("ab", "abab", "ababab"...). This is exactly why grouping exists: without it, there would be no way to apply a quantifier to more than a single character or character class at a time.'
    },
    {
      q: 'Give a concrete, realistic scenario where greedy matching produces a genuinely wrong result, and explain why lazy matching fixes it.',
      a: 'Extracting the content of an HTML tag with a pattern like "<.*>" against the text "<b>bold</b> and <i>italic</i>" is a classic real case. Greedy ".*" consumes as much as possible, then backtracks only the minimum needed to still find a closing ">" — landing on the VERY LAST ">" in the line, so the match ends up spanning from the first "<" all the way to the last "</i>", incorrectly swallowing everything in between as one giant match instead of finding "<b>" and "</b>" and "<i>" and "</i>" as four separate matches. Switching to the lazy "<.*?>" fixes it by stopping at the FIRST ">" encountered each time, correctly isolating each individual tag one at a time instead of one enormous, incorrect span.'
    },
    {
      q: 'Why does knowing whether a tool defaults to BRE or ERE actually matter in practice, beyond just remembering to add a flag?',
      a: 'Because the exact same characters mean opposite things depending on the mode — in BRE, a bare "(" is a literal open-parenthesis character with no special meaning; in ERE, that same bare "(" starts a group. Write a pattern assuming ERE-style unescaped grouping, run it against a tool defaulting to BRE (plain grep, or sed without -E/-r), and it will not error out loudly — it will silently search for the literal parenthesis characters instead, matching nothing (or matching something unintended) without any clear signal that the mode assumption was wrong. Knowing which mode you are in is not a minor syntax footnote; it changes what the pattern actually means, silently.'
    }
  ],
  code: {
    title: 'Grouping, alternation, and greedy vs lazy in practice',
    intro: 'grep -E (ERE mode) is used throughout — reach for it as the default for anything beyond a trivial literal search.',
    code: `$ echo -e "cat\\ndog\\nbird" | grep -E "cat|dog"
cat
dog
# Alternation: matches lines containing "cat" OR "dog".

$ echo "ababab" | grep -E "^(ab)+$"
ababab
# Grouped repetition: one-or-more repeats of the WHOLE pair "ab".

$ echo "abbbb" | grep -E "^ab+$"
abbbb
# Different pattern, no grouping: "+" applies only to "b".

$ echo 'Mr. Smith and Mrs. Smith and Ms. Smith' | grep -oE "(Mr|Mrs|Ms)\\. Smith"
Mr. Smith
Mrs. Smith
Ms. Smith
# -o prints just the matched portion, not the whole line.

$ echo '"first" and "second"' | grep -oE '".*"'
"first" and "second"
# Greedy: one match, spanning the whole line.

$ echo '"first" and "second"' | grep -oPE '".*?"'
"first"
"second"
# Lazy (needs -P, Perl-compatible mode — plain grep -E does not support .*? at all).

$ echo "192.168.1.1" | grep -E "^([0-9]{1,3}\\.){3}[0-9]{1,3}$"
192.168.1.1
# A simple (not fully accurate) IPv4-shaped pattern.

$ echo "2026-07-16 13:45:02 ERROR disk full" | grep -oE "^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}"
2026-07-16 13:45:02
# Extracting just the timestamp portion from a log line.`,
    notes: [
      '-o prints only the MATCHED portion of each line, not the whole line — genuinely useful for extraction rather than just filtering.',
      'Plain "grep -E" does not support lazy quantifiers (.*?) at all — that specific example needs grep -P (Perl-compatible regex), which is not installed by default on every system.'
    ]
  },
  lab: {
    title: 'Write extended-regex patterns for real shapes',
    prompt: 'Write a regex (ERE / grep -E style) for each task below.',
    starter: `# Task: matches "red", "green", or "blue" (nothing else) as the WHOLE line


# Task: matches one or more repetitions of the pair "ha" (like "ha", "haha", "hahaha")


# Task: matches a log timestamp shaped like 2026-07-16 13:45:02, anchored to the start of the line

`,
    checks: [
      { re: '\\^\\(red\\|green\\|blue\\)\\$', flags: '', must: true, hint: 'Something like ^(red|green|blue)$ — alternation, anchored on both ends.', pass: '^(red|green|blue)$ ✓' },
      { re: '\\(ha\\)\\+', flags: '', must: true, hint: 'Something like (ha)+ — grouping so + applies to the whole pair.', pass: '(ha)+ ✓' },
      { re: '\\^(\\[0-9\\]|\\\\d)\\{4\\}-(\\[0-9\\]|\\\\d)\\{2\\}-(\\[0-9\\]|\\\\d)\\{2\\}', flags: '', must: true, hint: 'Something like ^[0-9]{4}-[0-9]{2}-[0-9]{2} — anchored, matching the date portion.', pass: '^[0-9]{4}-[0-9]{2}-[0-9]{2} ✓' }
    ],
    run: 'Try each pattern for real with grep -E, against lines that should match AND lines that should not.',
    solution: `# Task: matches "red", "green", or "blue" (nothing else) as the WHOLE line
^(red|green|blue)$

# Task: matches one or more repetitions of the pair "ha" (like "ha", "haha", "hahaha")
(ha)+

# Task: matches a log timestamp shaped like 2026-07-16 13:45:02, anchored to the start of the line
^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}`,
    notes: [
      'The third task only strictly required through the date portion per the check, but writing out the full timestamp (adding the time portion too) is equally correct and arguably more useful in practice.',
      'Without the anchors in the first task, "(red|green|blue)" would also match a line like "not red at all" — anchoring is what requires the WHOLE line to be exactly one of the three colors.'
    ]
  },
  quiz: [
    {
      q: 'What is the difference between the patterns "ab+" and "(ab)+"?',
      options: ['They are identical', '"ab+" requires one-or-more b\'s after a single "a"; "(ab)+" requires one-or-more repetitions of the whole pair "ab"', '"(ab)+" is invalid syntax', '"ab+" matches the pair "ab" repeated; "(ab)+" matches just b\'s'],
      correct: 1,
      explain: 'The quantifier always applies to whatever immediately precedes it — a bare character in "ab+", or the whole grouped unit in "(ab)+".'
    },
    {
      q: 'By default, are regex quantifiers greedy or lazy?',
      options: ['Lazy — they consume as little as possible', 'Greedy — they consume as much as possible, backtracking only if forced to', 'It depends on the operating system', 'Neither; quantifiers always match exactly once'],
      correct: 1,
      explain: 'Quantifiers default to greedy: consume the maximum possible while still letting the overall pattern match, backtracking only the minimum amount necessary.'
    },
    {
      q: 'Why would a greedy pattern like ".*" against \'"first" and "second"\' match the ENTIRE line as one match instead of two separate quoted strings?',
      options: ['Greedy matching is a bug in most regex engines', 'The .* consumes as much as possible, only backtracking to the LAST closing quote in the line rather than stopping at the nearest one', 'Greedy patterns cannot match quoted strings at all', 'The pattern is actually invalid'],
      correct: 1,
      explain: 'Greedy .* tries to consume everything, then backtracks only the minimum needed for the rest of the pattern to still match — landing on the last available closing quote rather than the first one.'
    },
    {
      q: 'In POSIX Basic Regular Expressions (BRE, grep\'s default), how do you make parentheses act as a GROUPING construct rather than literal characters?',
      options: ['Parentheses always group in BRE; no escaping needed', 'Escape them: \\( and \\) — unescaped, they are just literal parenthesis characters in BRE', 'Grouping is not possible in BRE under any circumstances', 'Use square brackets instead: [( and )]'],
      correct: 1,
      explain: 'BRE requires \\( \\) to be escaped to mean "group" — the opposite of ERE (grep -E), where unescaped ( ) group and escaped \\( \\) are literal.'
    },
    {
      q: 'What does the -o flag do when used with grep?',
      options: ['Only search files that are readable (Owner permission)', 'Print only the matched portion of each line, not the entire line', 'Order results alphabetically', 'Optimize the search for speed'],
      correct: 1,
      explain: '-o prints just the text that actually matched the pattern, rather than the whole line it was found on — useful for extracting a specific piece of data rather than just filtering lines.'
    }
  ],
  pitfalls: [
    'Reaching for ".*" when a narrower, non-greedy match was actually intended — greedy quantifiers can swallow far more of the line than expected, especially with repeated delimiters like quotes or HTML tags on the same line.',
    'Writing a pattern assuming ERE-style unescaped grouping/alternation, then running it against a BRE-default tool (plain grep, or sed without -E) — it fails silently, searching for literal parenthesis/pipe characters instead of erroring loudly.',
    'Assuming .*? (lazy quantifier) works everywhere — plain grep -E does not support it at all; it requires grep -P (Perl-compatible mode) or a different tool/language entirely.'
  ],
  interview: [
    {
      q: 'Explain greedy vs. lazy quantifiers with a concrete example of where the distinction produces a genuinely different, practically important result.',
      a: 'Greedy quantifiers (the default) consume as much input as possible while still allowing the overall pattern to match, backtracking only the minimum amount if forced. Lazy quantifiers (marked with a trailing ? after the quantifier, like .*?) consume as little as possible, extending only when forced. The classic concrete case: matching quoted strings with ".*" against a line containing multiple separate quoted substrings — greedy matching spans from the FIRST opening quote to the LAST closing quote in the entire line, incorrectly treating everything in between (including unrelated text and other quote pairs) as one single match. Lazy ".*?" instead stops at the nearest closing quote each time, correctly isolating each quoted substring as its own separate match — the practically important difference between "one wrong giant match" and "several correct small matches."'
    },
    {
      q: 'What is the difference between BRE and ERE, and why does it matter which one a specific tool defaults to?',
      a: 'POSIX Basic Regular Expressions (BRE) require certain metacharacters — grouping parentheses, alternation pipe, interval braces — to be backslash-escaped to carry their special meaning; unescaped, they are literal characters. Extended Regular Expressions (ERE) flip this: those same characters work unescaped, and escaping them makes them literal instead. It matters which a tool defaults to because the identical-looking pattern text means something different depending on the mode — plain grep and sed default to BRE, while grep -E, egrep, and awk use ERE. Writing an ERE-style pattern (unescaped parentheses for grouping) against a BRE tool does not error — it silently searches for literal parenthesis characters instead, which can produce a confusing "why does this match nothing" result with no obvious cause.'
    },
    {
      q: 'Why is a "good enough" regex like a loose IPv4 or email pattern often the practically correct choice over a fully rigorous one?',
      a: 'A fully correct IPv4 validator needs to constrain each octet to the 0-255 range specifically, and a fully RFC-compliant email pattern is notoriously long and still imperfect in edge cases — both are disproportionately complex relative to most real use cases, which are usually "does this look roughly like an IP/email for a quick filter or sanity check," not "reject every conceivable malformed edge case with zero false positives or negatives." Reaching for the simpler, looser pattern is often the right practical tradeoff, AS LONG AS you know and can state its actual limitation (like accepting "999.999.999.999") rather than believing it is fully correct — the skill is knowing what a pattern does NOT guarantee, not just what it matches.'
    },
    {
      q: 'Walk through what "(Mr|Mrs|Ms)\\. Smith" matches, piece by piece, and why the backslash before the period matters here.',
      a: 'The parentheses group three alternatives — "Mr", "Mrs", or "Ms" — as a single either-or choice via the pipe characters inside. Immediately after the group comes "\\.", an ESCAPED period, meaning a literal period character specifically (not the any-character wildcard) — followed by a literal space and "Smith". So the whole pattern matches "Mr. Smith", "Mrs. Smith", or "Ms. Smith" exactly, each with a genuine period after the title. Without escaping the period, an unescaped "." there would ALSO match "Mr! Smith" or "MrX Smith" — technically still "matching," but incorrectly accepting inputs that were never actually valid, which is exactly the kind of subtle over-matching bug the previous lesson\'s dot-escaping point warned about, now showing up in a compound, realistic pattern.'
    }
  ]
};
