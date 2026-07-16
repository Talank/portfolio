window.LESSONS = window.LESSONS || {};
window.LESSONS['processes-job-control'] = {
  id: 'processes-job-control',
  title: 'Processes & Job Control: ps, top, kill, Signals, fg/bg, nohup',
  category: 'Part 2 — Users, Processes & Services',
  timeMin: 45,
  summary: 'Every command you\'ve run so far has been a process, live and briefly visible, then gone. This lesson makes that visible and controllable: how to see what\'s actually running (ps, top), how to politely or forcibly stop it (signals, kill), how to juggle multiple things in one terminal (fg/bg), and how to make something survive after you log out (nohup) — the last of which sets up exactly why systemd exists, next lesson.',
  goals: [
    'Explain what a PID and PPID are, and read a process tree with ps',
    'Use ps and top to inspect what\'s currently running on a system',
    'Explain what a signal is, and the crucial difference between SIGTERM and SIGKILL',
    'Control jobs within a single shell session using &, jobs, fg, bg, and Ctrl-Z',
    'Use nohup to keep a process running after the terminal that launched it closes'
  ],
  concept: [
    {
      h: 'A process is a running program with a number: PID and PPID',
      p: [
        'Every time a program runs, the kernel gives it a unique <b>PID</b> (process ID) for as long as it\'s alive. Almost every process also has a <b>PPID</b> (parent PID) — the process that launched it, usually your shell. Run a command from bash, and that command\'s parent is bash itself; run bash from a terminal emulator, and bash\'s parent is the terminal. Chase the PPID chain far enough and you always land on PID 1, the very first process the kernel starts at boot (traditionally called <code>init</code>; on nearly every modern distro, that\'s <code>systemd</code> — next lesson\'s entire subject).',
        '<code>ps</code> lists processes, and its two most common invocations look different but both matter: <code>ps aux</code> (BSD-style flags, no dashes) shows every process on the system with CPU/memory usage; <code>ps -ef</code> (System V-style) shows every process with explicit parent-child PID columns. <code>top</code> (or the friendlier <code>htop</code>, if installed) shows the same kind of information LIVE, refreshing continuously — genuinely the first thing worth running on an unfamiliar server that "feels slow."'
      ]
    },
    {
      h: 'Signals: how you talk to a process that\'s already running',
      p: [
        'A <b>signal</b> is a small, standardized interrupt sent to a running process — not data, just a numbered notification like "please wrap up" or "stop right now." The two you\'ll use constantly: <b>SIGTERM</b> (signal 15, the default <code>kill</code> sends) politely asks a process to terminate, and a well-written program can CATCH that signal and use it as a cue to save state, close files, or finish an in-flight request before actually exiting. <b>SIGKILL</b> (signal 9) is fundamentally different: it\'s not a request, it\'s the kernel unconditionally ending the process immediately, and — deliberately — it cannot be caught, ignored, or handled by the process at all. That\'s exactly why "just use kill -9 for everything" is a bad habit: a process killed by SIGTERM gets a chance to clean up (close a database connection cleanly, flush a write to disk); one killed by SIGKILL doesn\'t get any chance at all.',
        '<code>SIGINT</code> (signal 2) is what your terminal sends when you press Ctrl-C — a request to interrupt, catchable just like SIGTERM. <code>SIGHUP</code> (signal 1, "hangup") is what a process traditionally receives when its controlling terminal closes — historically meaning "the phone line dropped," today meaning "the terminal window it was launched from just closed" — and it\'s the exact signal this lesson\'s last section exists to work around.'
      ]
    },
    {
      h: 'Job control: juggling multiple things in one shell',
      p: [
        'Appending <code>&</code> to a command launches it in the <b>background</b> — your shell prints a job number and PID, then immediately gives you the prompt back instead of waiting for it to finish. <code>jobs</code> lists everything currently running or suspended in that shell session. <code>fg</code> brings the most recent background job back to the <b>foreground</b> (or <code>fg %2</code> for a specific job number); <code>bg</code> resumes a suspended job in the background.',
        'Pressing <b>Ctrl-Z</b> while something\'s running in the foreground doesn\'t kill it — it sends SIGTSTP, which <i>suspends</i> the process (pauses it entirely, still in memory, doing nothing) and returns you to the prompt. From there, <code>bg</code> resumes it running in the background, or <code>fg</code> resumes it in the foreground again. This is the classic "oh, I meant to background that from the start" recovery move — Ctrl-Z, then <code>bg</code>, without ever having to kill and re-launch anything.'
      ]
    },
    {
      h: 'Surviving logout: nohup and why it\'s a stopgap, not the real answer',
      p: [
        'By default, when you close the terminal (or your SSH session drops), every process it launched receives SIGHUP and typically dies with it — even things you backgrounded with <code>&</code>. <code>nohup command &</code> launches a process that specifically ignores SIGHUP, so it keeps running after you log out; by default it also redirects output to a file called <code>nohup.out</code>, since there\'s no longer a terminal for it to print to. <code>disown</code> is a related but distinct tool: run after a job is already backgrounded, it removes that job from the shell\'s own job table, so the shell doesn\'t try to signal it at all when it exits.',
        'Both are genuinely useful for a quick, one-off long-running task over SSH. Neither is what you\'d actually reach for to run something important long-term: no automatic restart on crash, no clean startup-on-boot, no structured logging, no dependency ordering. That\'s the gap the very next lesson\'s subject — systemd services — exists to close properly.'
      ]
    }
  ],
  conceptFlow: {
    title: 'kill -15 vs kill -9: what actually happens inside the process',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'The request',
        nodes: [
          { id: 'term', text: 'kill -15 PID\n(SIGTERM, the default)' },
          { id: 'kill9', text: 'kill -9 PID\n(SIGKILL)' }
        ]
      },
      {
        label: 'Can the process respond?',
        nodes: [
          { id: 'catchable', text: 'SIGTERM is catchable\nprocess CAN run cleanup code' },
          { id: 'uncatchable', text: 'SIGKILL is NOT catchable\nkernel acts directly, no code runs' }
        ]
      },
      {
        label: 'What the process does',
        nodes: [
          { id: 'cleanup', text: 'Flush writes, close connections,\nthen exit voluntarily' },
          { id: 'ignoreterm', text: 'A misbehaving process\nCOULD ignore SIGTERM entirely' },
          { id: 'forced', text: 'Process is terminated\nimmediately, no say in the matter' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'cleanexit', text: 'Clean shutdown\nno corrupted state' },
          { id: 'stillrunning', text: 'Still running\n(need a stronger signal)' },
          { id: 'gone', text: 'Gone, instantly\nany unsaved state is lost' }
        ]
      }
    ],
    steps: [
      { active: ['term'], note: 'kill\'s default signal is SIGTERM (15) — a polite request, not a command the process is forced to obey.' },
      { active: ['kill9'], note: 'kill -9 sends SIGKILL — fundamentally different, handled by the kernel directly rather than delivered to the process\'s own code.' },
      { active: ['catchable'], note: 'A well-written process can install a handler for SIGTERM: on receiving it, run custom cleanup code, THEN exit.' },
      { active: ['uncatchable'], note: 'SIGKILL never reaches the process\'s own code at all — the kernel simply removes it from existence. There is no handler, no exception, no way to intercept it.' },
      { active: ['cleanup'], note: 'A well-behaved process receiving SIGTERM closes open files, flushes buffered writes, finishes an in-flight request, then exits on its own terms.' },
      { active: ['ignoreterm'], note: 'This is the catch: because SIGTERM is just a request, a stuck or badly-written process CAN ignore it and keep running — which is exactly when an admin reaches for SIGKILL next.' },
      { active: ['forced'], note: 'With SIGKILL there\'s no equivalent escape — the process cannot ignore it, delay it, or run any code in response. It is simply gone.' },
      { active: ['cleanexit'], note: 'SIGTERM done right: clean shutdown, no half-written files, no dropped-mid-transaction state.' },
      { active: ['stillrunning'], note: 'SIGTERM ignored: the process is still alive, and the operator now has to decide whether to escalate to SIGKILL.' },
      { active: ['gone'], note: 'SIGKILL always works, but at a cost: whatever the process hadn\'t yet saved or flushed is simply lost — which is exactly why it should be the last resort, not the default habit.' }
    ]
  },
  story: {
    onePiece: {
      title: '"Please Return to the Ship" vs. the Ship Is Actually Sinking',
      text: 'Nami runs the Sunny\'s away-missions like a well-designed signal system, and the crew (mostly) respects the distinction, because the one time it broke down taught everybody why it mattered. Ordinary recall: Nami calls out "return to the ship, we\'re leaving in ten minutes" — a request, not an override. Zoro, mid-nap in some back alley, hears it and can choose to finish tying his blade back on, backtrack to buy one more round of sake, wrap up whatever he was doing, ON HIS OWN TERMS, and still make it back in time. That\'s the polite signal: heard, acknowledged, handled gracefully, by the recipient\'s own code. But there was exactly one time Nami had to use the OTHER kind of call — the day the Sunny was actually taking on water and about to go under. That call wasn\'t "please return when convenient." It was immediate, unconditional, impossible to negotiate with or finish one more errand around: everyone aboard NOW, no cleanup time, no "let me just grab this one thing," full stop. Franky, who happened to be mid-repair on a totally unrelated system when that second kind of call went out, didn\'t get to finish bolting the panel back on first — he just went, because that signal doesn\'t ask, it acts. The crew has a name for the difference even if they\'ve never called it that out loud: there\'s "please wrap up and come back," which respects that you might be in the middle of something worth finishing — and there\'s "the ship is sinking," which doesn\'t respect that at all, because at that point, nothing is worth finishing instead.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Ross and the Couch: "PIVOT!" Is a Request. Someone Finally Just Letting Go Is Not.',
      text: 'Ross, Chandler, and Rachel wrestling a couch up a stairwell is, structurally, a lesson in the difference between a signal a process can ignore and one it genuinely can\'t. For an embarrassingly long stretch, Ross keeps issuing what amounts to polite requests to the situation itself — "PIVOT! PI-VOT!" — convinced that if he just repeats the instruction with enough conviction, physics will catch the signal, run its own graceful-shutdown handler, and the couch will politely reorient itself around the stairwell corner. It does not. The couch, stubbornly, keeps right on being wedged, because "PIVOT" was never actually a command anything was forced to obey — it\'s a request that something else has to voluntarily act on, and right now nothing is listening. What finally resolves the standoff isn\'t a fourth, more forceful "PIVOT" — it\'s somebody just letting go of their end entirely, unilaterally, without waiting for consensus or a clean handoff. The couch gets stuck, gets sawed in half, and the "graceful, everybody-agrees, nothing-gets-damaged" outcome Ross was hoping for never happens at all — which is exactly the tradeoff of forcing something rather than requesting it: it WILL resolve the standoff, but it does NOT promise anything survives that process intact.'
    },
    why: 'A signal a process can catch and act on gives it the chance for a graceful, self-directed shutdown — Zoro finishing his own business before returning, Ross hoping the couch will "pivot" on command. A signal that can\'t be caught or ignored — the sinking ship, someone just letting go of the couch — always works, but guarantees nothing about what survives the process. SIGTERM is the first kind. SIGKILL is the second.'
  },
  tech: [
    {
      q: 'Why can SIGTERM be caught and handled, but SIGKILL flatly cannot?',
      a: 'It\'s a deliberate kernel-level design choice, not a technical limitation that could be "fixed." SIGTERM is delivered to the target process, which may have registered its OWN handler function to run in response — meaning the process\'s own code decides what happens. SIGKILL, by contrast, is handled directly by the kernel: the process is torn down without the kernel ever handing control back to the process\'s own code at all. This guarantees SIGKILL always works, even against a hung, buggy, or actively malicious process that would otherwise ignore or indefinitely delay a catchable signal — the tradeoff being that nothing that process hadn\'t already saved gets a chance to be saved.'
    },
    {
      q: 'If a parent process dies, what happens to its still-running child processes?',
      a: 'They become "orphans" and get automatically re-parented — their PPID changes to point at PID 1 (systemd on most modern distros), which adopts orphaned processes specifically so every process always has SOME parent to be reaped by when it eventually exits. This is different from a process being killed outright: an orphaned child keeps running exactly as before, just with a new, distant parent, which is precisely why closing a terminal doesn\'t necessarily kill everything you launched from it (the SIGHUP behavior from this lesson\'s last section is a separate, additional mechanism working alongside this).'
    },
    {
      q: 'fg/bg and nohup both seem to be about "keeping something running" — what problem does each one actually solve, and how are they different?',
      a: 'fg/bg solve an IN-SESSION juggling problem: you have one open shell and want to move a single task between running-and-blocking-your-prompt (foreground) and running-quietly-alongside-your-prompt (background), without ending the session at all. nohup solves a completely different problem: surviving the shell SESSION ITSELF ending — specifically, ignoring the SIGHUP a process would otherwise receive when its terminal closes or an SSH connection drops. You can use both together (nohup a-long-task &), but fg/bg have no effect on what happens after logout, and nohup has no effect on whether a task blocks your prompt while the session is still open — they\'re solving genuinely different halves of the problem.'
    }
  ],
  code: {
    title: 'Watching, signaling, and backgrounding real processes',
    intro: 'Try this in a real terminal — sleep is a safe, harmless command for practicing job control.',
    code: `$ sleep 300 &
[1] 8842
# Backgrounded. [1] is the job number, 8842 is the PID.

$ jobs
[1]+  Running                 sleep 300 &

$ ps aux | grep sleep
nami      8842  0.0  0.0   2384   604 pts/0    S    10:15   0:00 sleep 300

$ kill 8842
# Sends SIGTERM (the default) — sleep has no special handler, so it just exits.

$ jobs
[1]+  Terminated              sleep 300

$ sleep 300
^Z
[1]+  Stopped                 sleep 300
# Ctrl-Z suspends it (SIGTSTP) rather than killing it.

$ bg
[1]+ sleep 300 &
# Resumes it running, but in the background — prompt is free again.

$ fg
sleep 300
# Brings it back to the foreground; now Ctrl-C (SIGINT) would actually stop it.

$ nohup sleep 600 &
[1] 9012
$ exit
# ...close the terminal, reconnect later...
$ ps aux | grep sleep
nami      9012  0.0  0.0   2384   604 ?        S    10:20   0:00 sleep 600
# Still running — nohup made it ignore SIGHUP when the terminal closed.`,
    notes: [
      'kill without a signal number always sends SIGTERM (15) — "kill -9 PID" is a completely different, much more forceful command, not just kill\'s "aggressive mode."',
      'The "?" in the TTY column of the nohup\'d process\'s ps output (instead of pts/0) shows it\'s no longer attached to any terminal at all — exactly what surviving the logout looks like.'
    ]
  },
  lab: {
    title: 'Read ps output and write the right signal commands',
    prompt: 'Given the ps output below, answer the question, then write the commands for each task.',
    starter: `# nami      4471  2.1  0.4  91200 41200 pts/1    S+   09:02   0:12 python3 slow_job.py

# Q1: What is the PID of slow_job.py?


# Task: politely ask slow_job.py (PID 4471) to terminate


# Task: slow_job.py ignored that — force-kill it immediately, no chance to clean up


# Task: launch "python3 backup.py" in the background so it survives the terminal closing

`,
    checks: [
      { re: '(^|\\D)4471(\\D|$)', flags: 'm', must: true, hint: 'The PID is the second column of ps output: 4471.', pass: 'PID identified as 4471 ✓' },
      { re: 'kill\\s+4471(?!.*-9)', flags: 'i', must: true, hint: '"kill 4471" (no flag) sends the default SIGTERM — a polite request.', pass: 'kill 4471 (SIGTERM) ✓' },
      { re: 'kill\\s+-9\\s+4471', flags: 'i', must: true, hint: '"kill -9 4471" sends SIGKILL — immediate, unconditional termination.', pass: 'kill -9 4471 (SIGKILL) ✓' },
      { re: 'nohup\\s+python3\\s+backup\\.py\\s*&', flags: 'i', must: true, hint: '"nohup python3 backup.py &" backgrounds it AND makes it ignore SIGHUP on logout.', pass: 'nohup python3 backup.py & ✓' }
    ],
    run: 'Try it for real: sleep 300 &, then jobs, then kill it, then try nohup with a real background task.',
    solution: `# nami      4471  2.1  0.4  91200 41200 pts/1    S+   09:02   0:12 python3 slow_job.py

# Q1: What is the PID of slow_job.py?
# 4471

# Task: politely ask slow_job.py (PID 4471) to terminate
kill 4471

# Task: slow_job.py ignored that — force-kill it immediately, no chance to clean up
kill -9 4471

# Task: launch "python3 backup.py" in the background so it survives the terminal closing
nohup python3 backup.py &`,
    notes: [
      'Reach for kill -9 only after a plain kill has genuinely failed to stop something — it skips every cleanup the process might have wanted to do, including flushing writes to disk.',
      'nohup redirects the process\'s output to nohup.out by default if you don\'t redirect it yourself — worth knowing before you go looking for where its output went.'
    ]
  },
  quiz: [
    {
      q: 'What is a PPID?',
      options: ['The PID of the process that launched this process', 'The priority of the process', 'A permanent process identifier that never changes across reboots', 'The number of child processes a process has'],
      correct: 0,
      explain: 'PPID = parent PID, the PID of whichever process launched this one — usually your shell, and ultimately, always traceable back to PID 1.'
    },
    {
      q: 'Why is "kill -9 everything" considered a bad habit rather than just a faster way to stop processes?',
      options: ['kill -9 is actually slower than a plain kill', 'SIGKILL cannot be caught, so the process gets no chance to clean up — flush writes, close connections, finish an in-flight operation', 'kill -9 only works on background jobs, never foreground ones', 'kill -9 requires root privileges but plain kill does not'],
      correct: 1,
      explain: 'SIGKILL is handled entirely by the kernel and never reaches the process\'s own code, so nothing the process might want to do on shutdown (flush a buffer, close a file cleanly) gets a chance to run.'
    },
    {
      q: 'You press Ctrl-Z on a running foreground process. What happens?',
      options: ['The process is killed immediately', 'The process is suspended (SIGTSTP) and can be resumed later with fg or bg', 'The terminal closes', 'Nothing; Ctrl-Z only works in text editors'],
      correct: 1,
      explain: 'Ctrl-Z sends SIGTSTP, which suspends the process — pauses it in place — and returns you to the prompt. "bg" resumes it running in the background, "fg" resumes it in the foreground.'
    },
    {
      q: 'What specifically does nohup protect a process from?',
      options: ['Running out of memory', 'Being killed by SIGKILL', 'Receiving SIGHUP and dying when its terminal/SSH session closes', 'Being visible in ps output'],
      correct: 2,
      explain: 'nohup makes a process ignore SIGHUP specifically — the signal traditionally sent when the controlling terminal hangs up/closes — so it keeps running after you log out.'
    },
    {
      q: 'What happens to a running process if its parent process dies first?',
      options: ['It is immediately killed too', 'It becomes an orphan and is re-parented to PID 1 (init/systemd), continuing to run', 'It freezes permanently until manually restarted', 'It automatically becomes the new parent of its own parent'],
      correct: 1,
      explain: 'An orphaned process is automatically re-parented to PID 1, which adopts it — it keeps running exactly as before, just under a different parent, ensuring every process always has one.'
    }
  ],
  pitfalls: [
    'Reaching for "kill -9" as the default first move instead of a last resort — it skips all cleanup, and a process killed this way mid-write can leave corrupted files or half-committed data behind.',
    'Assuming "&" alone is enough to survive closing the terminal — a plain backgrounded job still receives SIGHUP when the session ends; nohup (or disown) is what actually protects against that.',
    'Confusing "the process is suspended" (Ctrl-Z / SIGTSTP — still in memory, resumable) with "the process is terminated" (kill / SIGTERM or SIGKILL — gone) — checking "jobs" after Ctrl-Z and seeing "Stopped" rather than nothing is the tell.'
  ],
  interview: [
    {
      q: 'Explain the difference between SIGTERM and SIGKILL, including what determines which one you should use.',
      a: 'SIGTERM (15, kill\'s default) is a request the target process can catch, handle, and act on — a well-written program uses it as a cue to flush writes, close connections, and exit cleanly. SIGKILL (9) is handled directly by the kernel and cannot be caught, ignored, or handled by the process at all — it guarantees termination but gives the process zero chance to clean up. The right default is always SIGTERM first, escalating to SIGKILL only if the process fails to respond (commonly because it\'s hung or has a bug preventing it from honoring the request) — since SIGKILL trades away any chance of a graceful shutdown for absolute certainty of termination.'
    },
    {
      q: 'What is PID 1, and why does every orphaned process eventually get re-parented to it?',
      a: 'PID 1 is the very first process the kernel starts at boot — traditionally "init," on nearly every modern Linux distro now "systemd." It\'s the root of every process\'s ancestry: follow any process\'s PPID chain far enough and it always terminates at PID 1. When a process\'s actual parent dies before it does, the kernel re-parents the orphan to PID 1 specifically so every process always has SOME parent responsible for eventually "reaping" it (cleaning up its exit status) — without this, orphaned processes could accumulate as unreapable zombies indefinitely.'
    },
    {
      q: 'What\'s the practical limitation of using nohup to run something long-term in production, compared to a proper service manager?',
      a: 'nohup solves exactly one problem — surviving SIGHUP when the launching terminal closes — and nothing else. It provides no automatic restart if the process crashes, no structured logging beyond a flat nohup.out file, no clean startup-at-boot behavior, no dependency ordering relative to other services, and no standard way to check status or manage its lifecycle beyond manually finding its PID. For anything actually important and long-running, a proper service manager (systemd, covered next) is the real answer — nohup is fine for a one-off task over an SSH session, not for something a production system depends on.'
    },
    {
      q: 'What does "ps aux" show that a process\'s own logs might not, and why is that the first thing to check on a server that "feels slow"?',
      a: '"ps aux" (or "top" for a live view) shows system-wide, real-time resource usage per process — CPU%, memory%, process state, how long it\'s been running — independent of whatever that process chooses to log about itself. A process can be perfectly silent in its own logs while still consuming 100% of a CPU core or steadily leaking memory; ps/top is how you\'d actually discover that from the OUTSIDE, which is exactly why it\'s the standard first move when a server is sluggish and it isn\'t yet clear which process (if any) is responsible.'
    }
  ]
};
