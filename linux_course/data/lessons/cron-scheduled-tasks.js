window.LESSONS = window.LESSONS || {};
window.LESSONS['cron-scheduled-tasks'] = {
  id: 'cron-scheduled-tasks',
  title: 'Scheduling Work: cron, crontab & systemd Timers',
  category: 'Part 7 — Toward CI/CD',
  timeMin: 30,
  summary: 'Nightly backups, log rotation, periodic health checks — a huge amount of real server work happens on a schedule, unattended, with nobody watching. cron is the classic tool for this, and it comes with one genuinely important trap: it runs your commands in a much more minimal environment than your interactive shell, which is exactly why a script that "works fine when I run it myself" can silently misbehave the moment cron runs it instead.',
  goals: [
    'Read and write a basic 5-field crontab line',
    'Use crontab -e, -l, and -r to manage your own scheduled jobs',
    'Explain why cron\'s environment differs from an interactive shell\'s, and why that causes silent failures',
    'Redirect a cron job\'s output to a log file so its results are actually visible later',
    'Explain when a systemd timer is a better fit than cron'
  ],
  concept: [
    {
      h: 'The 5-field crontab syntax',
      p: [
        'A crontab line has five time fields, in a fixed order, followed by the command to run: <code>minute hour day-of-month month day-of-week command</code>. Each field accepts a specific number, a <code>*</code> (meaning "every" value), a range (<code>1-5</code>), a list (<code>1,3,5</code>), or a step (<code>*/15</code> meaning "every 15 units"). <code>0 9 * * 1-5 /path/to/script.sh</code> reads as: minute 0, hour 9, any day-of-month, any month, weekdays only (1-5, Monday-Friday) — run at 9:00am, Monday through Friday.',
        '<code>* * * * * command</code> (all five fields as <code>*</code>) means "every minute, every day" — genuinely useful for testing that cron is actually running your command at all, before dialing in the real intended schedule. <code>crontab -e</code> opens your OWN user\'s crontab for editing (in your configured editor); <code>crontab -l</code> lists your current crontab without opening an editor; <code>crontab -r</code> REMOVES your entire crontab — worth being careful with, since it deletes everything at once, not just one line.'
      ]
    },
    {
      h: 'Per-user crontabs vs system-wide scheduling',
      p: [
        'What <code>crontab -e</code> edits is specifically YOUR OWN user\'s crontab — jobs defined there run as that user, with that user\'s own permissions. System-wide scheduled jobs additionally exist in <code>/etc/crontab</code> and <code>/etc/cron.d/</code> (each entry there includes an EXTRA field specifying which user to run as, since these are not tied to one specific user\'s own crontab), and simplified drop-in directories like <code>/etc/cron.daily/</code>, <code>/etc/cron.weekly/</code> let you just drop an executable script in, with the timing already handled by the system.',
        'For anything you personally need scheduled and are not administering the whole system for, your own user crontab (<code>crontab -e</code>) is almost always the right, simplest place to start.'
      ]
    },
    {
      h: 'cron\'s environment is NOT your interactive shell\'s',
      p: [
        'This is the single most common source of "it works when I run it myself, but silently fails under cron" confusion: cron runs your commands with a deliberately MINIMAL environment — typically a bare-bones <code>PATH</code> (often just <code>/usr/bin:/bin</code>, missing directories your interactive shell\'s PATH includes), no <code>.bashrc</code> or <code>.bash_profile</code> ever sourced, and NOT necessarily the same working directory you would expect. A script that calls a tool by its bare name (relying on YOUR interactive PATH to find it) can fail under cron simply because that tool\'s directory is not in cron\'s much narrower default PATH — with no obvious error message pointing at the actual cause.',
        'The reliable fix: use ABSOLUTE paths for everything inside a cron job — the script itself (<code>/home/nami/scripts/backup.sh</code>, not a bare <code>backup.sh</code>) and any commands or files it references internally — or explicitly set <code>PATH=</code> at the top of the crontab file itself. Do not assume anything about cron\'s environment matching your everyday interactive shell\'s.'
      ]
    },
    {
      h: 'Redirecting output: cron jobs are silent by default',
      p: [
        'When you run a command in your terminal, you SEE its output immediately. A cron job has no terminal at all — by default, any output it produces is either mailed to the crontab owner (if the system has local mail configured, which is genuinely rare on most modern setups) or simply discarded entirely, silently, with no record left anywhere. This means a cron job that starts failing can fail COMPLETELY INVISIBLY, for a long time, unless output is explicitly captured somewhere.',
        'The standard fix, directly building on the redirection-pipes lesson: <code>0 3 * * * /home/nami/scripts/backup.sh >> /home/nami/logs/backup.log 2>&1</code> — appending both stdout and stderr to a log file, so a failure actually leaves a visible trail to check later, instead of vanishing without a trace. As covered in the earlier systemd-services lesson, a <b>systemd timer</b> paired with a service unit is often a better-suited modern alternative specifically because its output is automatically captured in the systemd journal (queryable with journalctl) with no manual redirection needed at all — genuinely worth reaching for on a systemd-managed server, with cron remaining common for simpler cases, cross-platform scripts, or systems without systemd.'
      ]
    }
  ],
  conceptFlow: {
    title: 'Reading "0 9 * * 1-5" field by field',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'The five fields',
        nodes: [
          { id: 'minute', text: 'minute: 0' },
          { id: 'hour', text: 'hour: 9' },
          { id: 'dom', text: 'day-of-month: *' },
          { id: 'month', text: 'month: *' },
          { id: 'dow', text: 'day-of-week: 1-5' }
        ]
      },
      {
        label: 'Combined meaning',
        nodes: [
          { id: 'combined', text: 'At minute 0 of hour 9,\non any day-of-month, any month,\nbut ONLY on days 1-5 (Mon-Fri)' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'result', text: 'Runs at 9:00 AM,\nMonday through Friday only' }
        ]
      }
    ],
    steps: [
      { active: ['minute'], note: 'Minute field: exactly 0 — this rules out every minute except the top of the hour.' },
      { active: ['hour'], note: 'Hour field: exactly 9 — combined with minute 0, this narrows it to exactly 9:00.' },
      { active: ['dom'], note: 'Day-of-month field: * means "no restriction" — every day of the month qualifies on this field alone.' },
      { active: ['month'], note: 'Month field: * means "no restriction" — every month qualifies on this field alone.' },
      { active: ['dow'], note: 'Day-of-week field: 1-5, a range meaning Monday through Friday (0 and 7 both mean Sunday, 1 is Monday) — this is the field that actually excludes weekends.' },
      { active: ['combined'], note: 'All five fields must independently be satisfied simultaneously for cron to fire — this is not "any of these," it is "all of these, at once."' },
      { active: ['result'], note: 'Put together: exactly 9:00 AM, and only on Monday through Friday — a classic "weekday morning" schedule, the shape you will see constantly in real crontabs.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Nami\'s Duty Board, and the Night Watch That Silently Failed',
      text: 'Nami runs the Sunny\'s recurring duty schedule with a posted board specifying exactly when each standing task happens — sail-check every morning at a fixed hour, supply inventory every Monday, storm-shutter inspection the first of each month — precise, recurring, and running on its own schedule without her personally reminding anyone each time. It works reliably for months, until one particular overnight watch quietly stops happening correctly, and nobody notices for over a week. The actual cause turns out to be almost embarrassingly specific: the crew member covering that particular overnight slot was a FILL-IN, unfamiliar with the ship\'s normal daytime routines, and simply did not have the same tools and reference materials the REGULAR daytime watch always has close at hand — the fill-in was technically present and technically "on duty" at the scheduled time, but working with a much more bare-bones setup than anyone assumed, and several steps of the normal check silently failed to happen at all because the needed materials simply were not there. Worse, nobody had told the fill-in to actually WRITE DOWN what happened each night — so the watch\'s incomplete results vanished into nothing, with no record for anyone to notice something had gone wrong until an entirely separate problem surfaced a week later. Nami\'s fix afterward is exactly two changes: give the fill-in watch an explicit, complete checklist of exactly which tools and materials it needs, spelled out fully rather than assumed — and require a written log entry, every single night, regardless of whether anything unusual happened, specifically so a silent failure can never again go a full week unnoticed.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s 3 AM Prep Duty, and the Sub Who Did Not Have Her Setup',
      text: 'Monica, running a restaurant kitchen with certain prep tasks scheduled to happen automatically overnight regardless of who is on shift, posts a rigid, recurring schedule — dough prep at a fixed early hour, inventory count every Sunday, deep-clean the first of each month — precise, standing, unattended by her personally each time. It runs smoothly for a long stretch, until one specific overnight prep task quietly starts coming out wrong, for several days running, before anyone catches it. The cause, once Monica finally digs into it: the overnight SUBSTITUTE covering that shift is a perfectly competent cook, but simply does not have Monica\'s own personal setup — her specific labeled ingredient shelf arrangement, her particular go-to tools kept in her own reserved spot — that the REGULAR daytime staff always has immediate, assumed access to. The substitute was genuinely present and working at exactly the scheduled time, just operating with a much more generic, stripped-down kitchen setup than anyone had accounted for, and several steps silently came out different as a direct result. Worse, nobody had ever told the substitute to log what actually happened each night in the shift notebook — so the flawed results went completely unrecorded, with nobody able to notice a pattern until a regular customer finally complains days later. Monica\'s fix: an explicit, fully-spelled-out setup checklist for anyone covering that overnight slot, assuming NOTHING is already in place the way it usually is for her — plus a mandatory written log entry every single night, specifically so a quiet, ongoing problem can never again go unnoticed for that long.'
    },
    why: 'The unfamiliar fill-in watch, working from a stripped-down setup rather than the regular daytime environment, is exactly cron\'s minimal PATH and missing .bashrc — a script assuming its NORMAL, interactive environment fails silently the moment it actually runs somewhere leaner. And the missing written log, letting a real problem go unnoticed for a week, is exactly a cron job with no output redirection — silently discarding results nobody ever thought to explicitly capture.'
  },
  tech: [
    {
      q: 'Concretely, why would a script that runs correctly when you type it yourself in a terminal fail (often silently) when the exact same script is run by cron?',
      a: 'Your interactive shell has a rich environment — a PATH assembled from your shell config, .bashrc sourced with any custom aliases/functions/exports, and a working directory you are consciously aware of. cron deliberately runs jobs with a far more minimal environment: a bare-bones PATH (often just /usr/bin:/bin), no shell startup files sourced at all, and a working directory that may not match what you assume. A script that calls a tool by a bare name (relying on YOUR interactive PATH to locate it, per the earlier shell-environment lesson) or references a relative file path (assuming a particular working directory) can fail under cron specifically because those assumptions, true in your interactive shell, simply do not hold in cron\'s much leaner default environment — and because output is not visible by default either, this often fails with no obvious error surfaced anywhere.'
    },
    {
      q: 'Why is explicitly redirecting a cron job\'s output (>> logfile 2>&1) considered essential rather than optional?',
      a: 'By default, a cron job\'s output either gets mailed to the crontab owner — genuinely uncommon to have configured and checked on most modern systems — or is simply discarded entirely, with absolutely no record left anywhere that anything even ran, let alone whether it succeeded or failed. Without explicit redirection, a cron job that starts silently failing (due to the environment differences above, a changed file path, a since-broken dependency) can continue failing indefinitely with nobody aware, since there is nothing anywhere to check. Redirecting stdout AND stderr (2>&1) to an actual log file turns that invisible failure mode into something checkable — the difference between a problem that gets noticed in hours versus one that goes unnoticed for weeks.'
    },
    {
      q: 'Given that systemd timers exist and integrate cleanly with journalctl, why does cron remain common rather than being fully replaced?',
      a: 'cron is simpler to reach for on a single line, with genuinely universal availability across nearly every Unix-like system, including many where systemd is not present at all (older systems, some minimal/embedded distributions, macOS, which uses launchd instead of either) — a cron-based script is broadly portable in a way a systemd timer unit is not. systemd timers, by contrast, require writing two separate unit files (a .timer and its paired .service) rather than one crontab line, more setup for a genuinely simple, one-off scheduled task. The practical tradeoff: systemd timers are the better choice on a systemd-managed server where integrated logging, dependency ordering, and richer scheduling semantics (like catching up on a missed run after downtime) genuinely matter; cron remains reasonable for simple, portable, low-stakes scheduling where that extra setup is not worth it.'
    }
  ],
  code: {
    title: 'crontab in practice',
    intro: 'Try "crontab -l" on any machine you have access to — it is read-only and will not modify anything.',
    code: `$ crontab -l
no crontab for nami

$ crontab -e
# Opens your crontab in your configured editor. Add a line like:
# 0 3 * * * /home/nami/scripts/backup.sh >> /home/nami/logs/backup.log 2>&1

$ crontab -l
0 3 * * * /home/nami/scripts/backup.sh >> /home/nami/logs/backup.log 2>&1
# Runs at 3:00 AM every day, output captured to a log file.

# A quick sanity-check schedule while testing (every minute):
* * * * * /home/nami/scripts/healthcheck.sh >> /home/nami/logs/health.log 2>&1

# Weekdays at 8:30 AM:
30 8 * * 1-5 /home/nami/scripts/morning-report.sh >> /home/nami/logs/report.log 2>&1

# The 1st of every month at midnight:
0 0 1 * * /home/nami/scripts/monthly-cleanup.sh >> /home/nami/logs/cleanup.log 2>&1

$ crontab -r
# Removes your ENTIRE crontab — all lines at once, not just one.

# Inside backup.sh itself, defend against cron's minimal PATH:
#!/usr/bin/env bash
export PATH="/usr/local/bin:/usr/bin:/bin"
/usr/bin/tar -czvf /home/nami/backups/backup-$(date +%F).tar.gz /home/nami/data/`,
    notes: [
      'Always test a new cron schedule with "* * * * *" first (every minute) to confirm the JOB ITSELF actually works under cron\'s environment, before dialing in the real, less-frequent intended schedule.',
      'The "2>&1" ordering rule from the redirection-pipes lesson applies here too — it must come AFTER the ">> logfile" for both streams to actually land in the file.'
    ]
  },
  lab: {
    title: 'Write the right crontab lines',
    prompt: 'Write exactly one crontab line per task, including output redirection to a log file for each.',
    starter: `# Task: run /home/nami/scripts/sync.sh every day at 2:15 AM, logging to /home/nami/logs/sync.log


# Task: run /home/nami/scripts/report.sh every weekday (Mon-Fri) at 6:00 PM, logging to /home/nami/logs/report.log


# Task: run /home/nami/scripts/healthcheck.sh every 15 minutes, logging to /home/nami/logs/health.log

`,
    checks: [
      { re: '15\\s+2\\s+\\*\\s+\\*\\s+\\*\\s+/home/nami/scripts/sync\\.sh\\s*>>\\s*/home/nami/logs/sync\\.log\\s*2>&1', flags: 'i', must: true, hint: '15 2 * * * /home/nami/scripts/sync.sh >> /home/nami/logs/sync.log 2>&1', pass: '2:15 AM daily sync ✓' },
      { re: '0\\s+18\\s+\\*\\s+\\*\\s+1-5\\s+/home/nami/scripts/report\\.sh\\s*>>\\s*/home/nami/logs/report\\.log\\s*2>&1', flags: 'i', must: true, hint: '0 18 * * 1-5 /home/nami/scripts/report.sh >> /home/nami/logs/report.log 2>&1', pass: '6:00 PM weekdays report ✓' },
      { re: '\\*/15\\s+\\*\\s+\\*\\s+\\*\\s+\\*\\s+/home/nami/scripts/healthcheck\\.sh\\s*>>\\s*/home/nami/logs/health\\.log\\s*2>&1', flags: 'i', must: true, hint: '*/15 * * * * /home/nami/scripts/healthcheck.sh >> /home/nami/logs/health.log 2>&1', pass: 'every 15 minutes healthcheck ✓' }
    ],
    run: 'Try it for real: crontab -e, add a "* * * * *" test line writing to a log file, wait a couple minutes, then check the log actually grew.',
    solution: `# Task: run /home/nami/scripts/sync.sh every day at 2:15 AM, logging to /home/nami/logs/sync.log
15 2 * * * /home/nami/scripts/sync.sh >> /home/nami/logs/sync.log 2>&1

# Task: run /home/nami/scripts/report.sh every weekday (Mon-Fri) at 6:00 PM, logging to /home/nami/logs/report.log
0 18 * * 1-5 /home/nami/scripts/report.sh >> /home/nami/logs/report.log 2>&1

# Task: run /home/nami/scripts/healthcheck.sh every 15 minutes, logging to /home/nami/logs/health.log
*/15 * * * * /home/nami/scripts/healthcheck.sh >> /home/nami/logs/health.log 2>&1`,
    notes: [
      '18:00 in 24-hour time is how cron expects the hour field for "6:00 PM" — there is no AM/PM notation in crontab syntax.',
      '"*/15" in the minute field is a step value meaning "every 15 units starting from 0" — equivalent to listing 0,15,30,45 explicitly.'
    ]
  },
  quiz: [
    {
      q: 'What does the crontab line "0 9 * * 1-5 /path/script.sh" mean?',
      options: ['Run every 9 minutes, every day', 'Run at 9:00 AM, Monday through Friday only', 'Run once, on January 9th', 'Run every hour, on the 9th of each month'],
      correct: 1,
      explain: 'minute=0, hour=9, day-of-month=*, month=*, day-of-week=1-5 (Mon-Fri) — together, exactly 9:00 AM on weekdays only.'
    },
    {
      q: 'Why can a script that works fine when run manually fail silently when run by cron?',
      options: ['cron always corrupts scripts it runs', 'cron runs with a much more minimal environment (bare PATH, no .bashrc sourced) than an interactive shell, so assumptions that hold interactively may not hold under cron', 'cron cannot run bash scripts at all, only binaries', 'Scripts must be rewritten in a special cron-specific language'],
      correct: 1,
      explain: 'cron\'s default environment lacks the PATH entries, shell config, and often the working directory assumptions an interactive shell provides — a script relying on any of those can fail under cron specifically.'
    },
    {
      q: 'By default, what happens to a cron job\'s output if it is not explicitly redirected?',
      options: ['It is automatically saved to /var/log/cron.log', 'It is printed to whichever terminal is currently open', 'It is mailed (if configured, which is often not the case) or simply discarded, with no record left', 'cron refuses to run any command that produces output'],
      correct: 2,
      explain: 'Without explicit redirection, cron job output either goes to local mail (rarely configured/checked on modern systems) or is discarded entirely — leaving no visible trace of success or failure.'
    },
    {
      q: 'What does "crontab -r" do?',
      options: ['Restarts the cron service', 'Removes your ENTIRE crontab, all lines at once', 'Reloads your crontab without changing it', 'Runs your crontab\'s jobs immediately, once, for testing'],
      correct: 1,
      explain: '"-r" removes the whole crontab in one action — not a single line — worth being deliberate about before running it.'
    },
    {
      q: 'When would a systemd timer genuinely be preferable to cron?',
      options: ['Never; cron is strictly superior in every case', 'On a systemd-managed server where integrated journalctl logging, dependency ordering, or catch-up-after-downtime behavior are genuinely useful', 'Only on systems that do not have systemd installed', 'systemd timers cannot run scripts, only binaries, unlike cron'],
      correct: 1,
      explain: 'systemd timers integrate with journalctl for logging automatically (no manual redirection needed), support richer scheduling semantics, and fit naturally alongside other systemd-managed services — genuine advantages on a systemd-based system, at the cost of more setup than one crontab line.'
    }
  ],
  pitfalls: [
    'Writing a cron job that calls a tool by its bare name (relying on an interactive PATH), which then fails under cron\'s much narrower default PATH — using absolute paths for everything avoids this entirely.',
    'Never redirecting a cron job\'s output, leaving no way to discover a silent failure until its downstream effects surface, potentially much later.',
    'Running "crontab -r" thinking it removes one specific job, when it actually deletes the entire crontab at once — "crontab -e" and manually deleting the one relevant line is the safer way to remove a single job.'
  ],
  interview: [
    {
      q: 'Walk through the 5-field crontab syntax and explain how "*/15 * * * *" differs from "0,15,30,45 * * * *" — or does it?',
      a: 'The five fields are minute, hour, day-of-month, month, day-of-week, each independently specifying WHEN a job fires — all must be satisfied simultaneously. "*/15" in the minute field is a STEP value meaning "every 15 units, starting from the field\'s minimum (0)" — for the minute field specifically, that produces exactly 0, 15, 30, and 45. So "*/15 * * * *" and "0,15,30,45 * * * *" are, in this specific case, functionally equivalent — both fire every 15 minutes, on the hour and each quarter-hour mark. The step syntax is simply more concise and scales better to evenly-spaced intervals without listing every value explicitly.'
    },
    {
      q: 'Explain, mechanistically, why cron jobs are a notorious source of "works on my machine, fails in production" style bugs, and how to systematically avoid it.',
      a: 'The core mechanism: cron executes jobs with a deliberately minimal environment, NOT the rich interactive shell environment a developer typically tests in manually — a bare PATH (often missing directories an interactive PATH includes), no .bashrc/.bash_profile sourced (so any custom exports, aliases, or environment setup defined there is simply absent), and a working directory that may not match assumptions. A script tested by running it manually inherits the developer\'s full interactive environment and appears to work correctly; the identical script run by cron inherits none of that, and can fail in ways that look mysterious without knowing this specific mechanism. Systematic avoidance: use absolute paths everywhere within the script (never rely on PATH resolution for anything critical), explicitly set any required environment variables INSIDE the script itself (or at the top of the crontab file) rather than assuming they will be inherited, and always redirect output to a log file so any failure that does occur is actually visible rather than silent.'
    },
    {
      q: 'Why does explicit output redirection matter so much more for a cron job than for a command you run interactively?',
      a: 'Running a command interactively gives you IMMEDIATE, automatic visibility into its output — you see it printed to your terminal in real time, with no extra effort required. A cron job has no such automatic visibility at all: it runs unattended, with no terminal watching it, and its output by default either goes to a mail system that is often not configured or checked, or is discarded entirely. This means a cron job\'s success or failure is completely invisible unless output is DELIBERATELY captured somewhere durable and checkable — a log file via ">> file 2>&1" being the standard approach — which is exactly why this single habit is the difference between a scheduled job\'s failure being discovered within minutes versus going unnoticed for days or weeks.'
    },
    {
      q: 'A teammate proposes replacing all of a team\'s cron jobs with systemd timers. What tradeoffs would you want to discuss before agreeing?',
      a: 'In favor: systemd timers integrate natively with journalctl, so job output and status are automatically captured and queryable with no manual redirection needed, and they support richer scheduling semantics (like automatically catching up on a run missed due to the machine being down, which cron does not do at all). Against, or at least worth discussing: systemd timers require writing two separate unit files (a .timer and its paired .service) per scheduled job rather than one crontab line, meaningfully more setup for simple cases; they only work on systemd-managed systems, so anything needing to run identically across systemd and non-systemd environments (or macOS, which uses launchd) would need cron (or a portable equivalent) regardless. The right call genuinely depends on the team\'s actual infrastructure — heavily systemd-based production servers benefit real from the switch; simpler, more portable, or mixed-OS setups may reasonably keep cron.'
    }
  ]
};
