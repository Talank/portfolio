window.LESSONS = window.LESSONS || {};
window.LESSONS['systemd-services'] = {
  id: 'systemd-services',
  title: 'systemd: Services, Units, systemctl & journalctl',
  category: 'Part 2 — Users, Processes & Services',
  timeMin: 40,
  summary: 'The last lesson ended on a gap: nohup keeps something running after logout, but doesn\'t restart it on crash, doesn\'t start it on boot, and doesn\'t manage its logs. systemd — PID 1 on nearly every modern Linux distro — is the real answer to "run this reliably, forever, as a proper service." This is how to start, stop, enable, and actually read the logs of anything running as a systemd service, which is most of what\'s alive on any real server you\'ll SSH into.',
  goals: [
    'Explain what systemd is and why it runs as PID 1 on most modern distros',
    'Explain what a unit file is, and where service unit files live',
    'Use systemctl to start, stop, restart, enable, disable, and check the status of a service',
    'Read logs for a specific service using journalctl, including following them live',
    'Explain the difference between a service being "active" and being "enabled"'
  ],
  concept: [
    {
      h: 'systemd is PID 1: the thing that starts everything else',
      p: [
        'When a Linux machine boots, the kernel starts exactly one process directly: PID 1. On nearly every modern distro (Ubuntu, Debian, Fedora, RHEL, Arch — notably NOT some minimal/embedded systems, which is worth knowing exists as an exception), that process is <b>systemd</b>. Everything else — your login shell, every background daemon, every service — either IS started by systemd directly, or descends from something systemd started, which is exactly the "every PPID chain eventually reaches PID 1" fact from the previous lesson made concrete.',
        'systemd\'s job goes well beyond "start some programs at boot": it manages the ORDER services start in (a database shouldn\'t start after the app that needs it), restarts services that crash, tracks their logs centrally, and lets you query and control all of it uniformly through one command-line tool: <code>systemctl</code>.'
      ]
    },
    {
      h: 'Unit files: the config that describes a service',
      p: [
        'A <b>unit</b> is systemd\'s generic term for something it manages — services, but also mount points, timers (a systemd-native alternative to cron, covered properly in Part 7), and more. A <b>service unit</b> is a plain text file, typically ending in <code>.service</code>, living in <code>/etc/systemd/system/</code> (for services an admin installed) or <code>/usr/lib/systemd/system/</code> (for ones a package installed). It has three key sections: <code>[Unit]</code> (description, and dependencies — what must start before or after this), <code>[Service]</code> (the actual command to run, restart policy, which user to run as), and <code>[Install]</code> (how this unit hooks into boot targets, relevant to "enabling" below).',
        '<div class="math">[Unit]<br>Description=My Web App<br>After=network.target<br><br>[Service]<br>ExecStart=/usr/bin/python3 /opt/myapp/app.py<br>Restart=on-failure<br>User=myapp<br><br>[Install]<br>WantedBy=multi-user.target<span class="mnote">ExecStart is the actual command. Restart=on-failure means systemd relaunches it automatically if it crashes — exactly the automatic-restart behavior nohup never gave you.</span></div>'
      ]
    },
    {
      h: 'systemctl: start, stop, status, enable',
      p: [
        '<code>systemctl start myapp</code> starts the service right now. <code>systemctl stop myapp</code> stops it. <code>systemctl restart myapp</code> does both in sequence — the standard move after deploying new code or changing config. <code>systemctl status myapp</code> shows whether it\'s currently running, its recent log lines, its PID, and how long it\'s been up — genuinely the single most useful command for "is this thing actually working right now."',
        'Critically, <b>starting</b> a service and <b>enabling</b> it are two separate, independent actions. <code>systemctl start</code> affects only the current boot session — reboot the machine and it won\'t come back unless something else starts it. <code>systemctl enable myapp</code> creates the symlinks that make it start automatically on the NEXT boot, but doesn\'t start it right now if it isn\'t already running. Deploying something new almost always means both: <code>systemctl enable --now myapp</code> does both in one line — enabled for future boots AND started immediately.'
      ]
    },
    {
      h: 'journalctl: where all the logs actually went',
      p: [
        'systemd captures the stdout/stderr of everything it manages into a centralized, structured log called the <b>journal</b>, queried with <code>journalctl</code>. <code>journalctl -u myapp</code> shows logs for just that one unit — far more useful than hunting through scattered log files across the filesystem, and it works uniformly for every service, regardless of whether that service\'s own code was written to log anywhere sensible at all. <code>journalctl -u myapp -f</code> follows the log live (like <code>tail -f</code>), the exact command to run in one terminal while triggering an action in another to watch what happens in real time.',
        '<code>journalctl -u myapp --since "1 hour ago"</code> filters by time — essential on a busy service where scrolling from the beginning isn\'t practical. <code>journalctl -u myapp -p err</code> filters to only error-priority-and-above lines, useful for a quick "did anything actually go wrong recently" check without wading through routine informational noise.'
      ]
    }
  ],
  conceptFlow: {
    title: 'systemctl enable --now myapp — what actually happens',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'The command',
        nodes: [
          { id: 'cmd', text: 'systemctl enable --now myapp' }
        ]
      },
      {
        label: 'Two separate actions',
        nodes: [
          { id: 'enable', text: 'ENABLE:\nsymlink into boot target' },
          { id: 'start', text: 'START:\nrun it right now' }
        ]
      },
      {
        label: 'What each one buys you',
        nodes: [
          { id: 'futureboot', text: 'Enabled effect:\nstarts automatically on next reboot' },
          { id: 'rightnow', text: 'Started effect:\nrunning immediately, this session' }
        ]
      },
      {
        label: 'If it crashes later',
        nodes: [
          { id: 'crash', text: 'Process crashes\nunexpectedly' },
          { id: 'restart', text: 'Restart=on-failure\nsystemd relaunches it automatically' }
        ]
      }
    ],
    steps: [
      { active: ['cmd'], note: '"enable --now" is really two independent systemd actions bundled into one command line — worth knowing they\'re separate, because you\'ll often want just one of them.' },
      { active: ['enable'], note: 'Enabling creates a symlink connecting this unit to a boot target (like multi-user.target) — it does NOT start anything right now.' },
      { active: ['start'], note: 'Starting actually launches the ExecStart command right now, for this boot session — it does NOT persist across a reboot on its own.' },
      { active: ['futureboot'], note: 'Because it\'s enabled, the NEXT time this machine boots, systemd will start this service automatically without anyone running a command.' },
      { active: ['rightnow'], note: 'Because it\'s started, the service is running THIS instant — check with systemctl status or journalctl -u.' },
      { active: ['crash'], note: 'Some time later, suppose the process crashes — maybe an unhandled exception, maybe it ran out of memory.' },
      { active: ['restart'], note: 'Because the unit file specifies Restart=on-failure, systemd notices the exit and relaunches it automatically — exactly the reliability nohup never provided.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Water 7\'s Dock Manager Doesn\'t Just Assign Jobs Once',
      text: 'Kokoro running the sea train dock isn\'t just handing out one-time tasks the way a foreman might for a single job — she\'s running something closer to a standing operations schedule, and the difference matters enormously the one time it\'s tested. Every essential dock function has a written assignment: who\'s responsible, in what order relative to the others (the bilge pumps have to be checked before a train\'s cleared to leave, not after), and — critically — what happens if that person doesn\'t show. It\'s that last part that separates her system from just "everyone knows their job." When one of the boiler-watch crew collapses from exhaustion mid-shift without warning, the dock doesn\'t grind to a halt waiting for someone to notice and improvise a fix. The standing assignment sheet already specifies a backup, already specifies the restart procedure, and within minutes someone else has picked the exact task back up, mid-schedule, without needing Kokoro herself to personally intervene and coordinate it from scratch. Compare that to how the crew handles a one-off personal favor — say, Usopp offering to keep an eye on someone\'s cargo for an afternoon. If Usopp wanders off distracted (which, generously, does happen), NOTHING catches that. No backup was ever specified, because it was never a standing assignment in the first place — it was a favor, done once, with no restart plan built in. Kokoro\'s dock survives a crew member collapsing without anyone even having to be told. Usopp\'s cargo-watching favor survives exactly as long as Usopp\'s attention does, and not one second longer.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s "Roommate Duties" Have a Restart Policy. Penny\'s Favor Doesn\'t.',
      text: 'Sheldon\'s household runs on something that would make a systems administrator nod along in recognition, even as everyone else finds it insufferable. Certain responsibilities aren\'t left to chance or memory — they\'re standing, documented, and self-enforcing: laundry happens on a specific day whether or not anyone feels like it, and if a roommate fails to perform an assigned duty, Sheldon has, in his own words, "contingency plans" — the equivalent of an automatic restart, kicking in without him personally having to notice the failure and manually intervene each time. It\'s rigid and it\'s a lot, but it means the household\'s core functions don\'t actually depend on any one person\'s memory or mood on a given day. Contrast that with the one time Penny asks Leonard, informally, off the cuff, to "just keep an eye on" her mail while she\'s traveling — a perfectly reasonable favor, agreed to once, in passing, over coffee. There\'s no written specification, no backup plan, no established recovery procedure if Leonard simply forgets by Wednesday (which, this being Leonard under Sheldon-household chaos, he does). Nobody notices the mail piling up until Penny\'s back and asking why there\'s two weeks of it jammed in the box. Sheldon\'s system, however exhausting to live under, never has that failure mode — because it was never a one-time favor to begin with, it was a standing, restart-on-failure commitment from day one.'
    },
    why: 'A nohup\'d process (or Usopp\'s favor, or Leonard\'s off-the-cuff mail promise) is a one-time, informal commitment — nothing notices or recovers if it silently stops. A systemd service (or Kokoro\'s dock schedule, or Sheldon\'s household duties) is a standing, written specification with an explicit restart policy — failure gets noticed and recovered from automatically, without anyone having to be watching in the first place.'
  },
  tech: [
    {
      q: 'What\'s the practical difference between "systemctl start" and "systemctl enable" — why would you ever want just one and not the other?',
      a: '"start" affects only the CURRENT boot session — it launches the service right now, but a reboot won\'t bring it back unless something else starts it again. "enable" affects only FUTURE boots — it wires the unit into a boot target so it launches automatically next time, but doesn\'t touch whether it\'s running right now. You might enable-without-starting when staging a service for a scheduled maintenance window (it\'ll come up clean on the next planned reboot, but you don\'t want it running mid-deployment right now); you might start-without-enabling for a genuinely temporary or experimental service you explicitly don\'t want surviving a reboot. Production deployments almost always want both, hence "enable --now" being the common combined form.'
    },
    {
      q: 'Why does journalctl exist instead of every service just writing its own log file somewhere under /var/log?',
      a: 'Individually-written log files still exist and are still used by plenty of software, but they have real problems at scale: every program picks its own location, format, and rotation policy, so finding "what happened with service X around 3pm" means knowing exactly where X logs to and how to parse its particular format. journalctl centralizes logs from everything systemd manages into one structured store queryable uniformly — by unit, by time range, by priority — regardless of whether the underlying program was ever written with good logging practices at all, since systemd captures stdout/stderr directly rather than relying on the program to write files correctly.'
    },
    {
      q: 'A service unit has "Restart=on-failure." What does that actually cover, and what does it NOT cover?',
      a: '"Restart=on-failure" tells systemd to automatically relaunch the service if the process exits with a non-zero (failure) exit code, or is killed by certain signals — covering crashes, unhandled exceptions that terminate the process, and similar abnormal exits. It deliberately does NOT restart the service if it was stopped intentionally via "systemctl stop" (that\'s a deliberate admin action, not a failure) or if the process exits cleanly with status 0 (success — nothing to recover from). Other Restart values exist for different needs: "always" restarts even on clean exit, "on-abnormal" is narrower than on-failure — the exact value chosen depends on whether the service is meant to run continuously (a web server) or run-once-and-exit-cleanly-is-fine (a one-shot migration script).'
    }
  ],
  code: {
    title: 'Managing a real systemd service',
    intro: 'These commands assume a service unit already exists — see the lab for writing one from scratch.',
    code: `$ sudo systemctl status nginx
● nginx.service - A high performance web server
     Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled)
     Active: active (running) since Thu 2026-07-16 09:00:12 UTC; 3h ago
   Main PID: 1204 (nginx)

$ sudo systemctl stop nginx
$ sudo systemctl status nginx
     Active: inactive (dead)

$ sudo systemctl start nginx
$ sudo systemctl restart nginx
# Common after a config change — stop then start in one command.

$ sudo systemctl enable nginx
Created symlink /etc/systemd/system/multi-user.target.wants/nginx.service ...
# Now it'll start automatically on the NEXT boot. Doesn't affect right now.

$ sudo systemctl enable --now nginx
# Enabled for future boots AND started immediately — the common combined form.

$ journalctl -u nginx -n 20
# Last 20 log lines for just this unit.

$ journalctl -u nginx -f
# Follow live — Ctrl-C to stop watching.

$ journalctl -u nginx --since "10 minutes ago" -p err
# Only error-level-and-above lines from the last 10 minutes.`,
    notes: [
      '"systemctl status" is almost always the right first command when investigating "is this service actually the problem" — it shows state, PID, uptime, and recent log lines all at once.',
      'Most systemctl subcommands that change state (start/stop/restart/enable/disable) need sudo; read-only ones (status, journalctl) generally don\'t.'
    ]
  },
  lab: {
    title: 'Write a minimal service unit and the commands to run it',
    prompt: 'A script at /opt/watcher/watch.py should run continuously as a service, restart automatically if it crashes, and start on boot. Fill in the unit file, then write the commands.',
    starter: `# unit file: /etc/systemd/system/watcher.service
[Unit]
Description=Log watcher


[Service]
ExecStart=
Restart=

[Install]
WantedBy=multi-user.target

# Task: reload systemd's config after creating/editing a unit file


# Task: enable AND start watcher.service in one command


# Task: follow watcher.service's logs live

`,
    checks: [
      { re: 'ExecStart\\s*=\\s*/usr/bin/python3\\s+/opt/watcher/watch\\.py', flags: 'i', must: true, hint: 'ExecStart needs the actual command: /usr/bin/python3 /opt/watcher/watch.py', pass: 'ExecStart set correctly ✓' },
      { re: 'Restart\\s*=\\s*on-failure', flags: 'i', must: true, hint: 'Restart=on-failure makes systemd relaunch it automatically if it crashes.', pass: 'Restart=on-failure ✓' },
      { re: 'systemctl\\s+daemon-reload', flags: 'i', must: true, hint: 'systemctl daemon-reload tells systemd to re-read unit files after they change.', pass: 'systemctl daemon-reload ✓' },
      { re: 'systemctl\\s+enable\\s+--now\\s+watcher(\\.service)?', flags: 'i', must: true, hint: 'systemctl enable --now watcher enables it for future boots AND starts it immediately.', pass: 'systemctl enable --now watcher ✓' },
      { re: 'journalctl\\s+-u\\s+watcher\\s+-f', flags: 'i', must: true, hint: 'journalctl -u watcher -f follows that unit\'s logs live.', pass: 'journalctl -u watcher -f ✓' }
    ],
    run: 'If you have a Linux box with sudo access, try creating a real trivial service (even just "ExecStart=/bin/sleep infinity") and running these commands against it.',
    solution: `# unit file: /etc/systemd/system/watcher.service
[Unit]
Description=Log watcher

[Service]
ExecStart=/usr/bin/python3 /opt/watcher/watch.py
Restart=on-failure

[Install]
WantedBy=multi-user.target

# Task: reload systemd's config after creating/editing a unit file
sudo systemctl daemon-reload

# Task: enable AND start watcher.service in one command
sudo systemctl enable --now watcher

# Task: follow watcher.service's logs live
journalctl -u watcher -f`,
    notes: [
      'Forgetting "systemctl daemon-reload" after creating or editing a unit file is one of the most common systemd mistakes — systemd caches unit definitions and won\'t notice your edit until told to re-read them.',
      'The ".service" suffix is optional in most systemctl commands (systemctl status nginx works the same as nginx.service) but it\'s good practice to know it\'s implied, not absent.'
    ]
  },
  quiz: [
    {
      q: 'What process is PID 1 on nearly every modern Linux distro?',
      options: ['bash', 'systemd', 'init.d', 'cron'],
      correct: 1,
      explain: 'systemd is PID 1 on nearly every modern distro — the first process the kernel starts, and the ancestor of every other process eventually.'
    },
    {
      q: 'A service is "enabled" but not currently "active." What does that mean?',
      options: ['The service is broken and needs to be reinstalled', 'It\'s configured to start automatically on the NEXT boot, but isn\'t running right now', 'It\'s running right now but won\'t survive a reboot', 'Enabled and active mean the same thing'],
      correct: 1,
      explain: 'Enabled = wired into a boot target for future boots. Active = running right now. They\'re independent — a service can be enabled-but-stopped, started-but-not-enabled, or any combination.'
    },
    {
      q: 'What command shows the last log lines for one specific systemd service?',
      options: ['tail /var/log/syslog', 'systemctl logs myapp', 'journalctl -u myapp', 'ps aux | grep myapp'],
      correct: 2,
      explain: '"journalctl -u <unit>" queries the centralized systemd journal filtered to just that one unit — the standard way to see a service\'s logs regardless of how it was written to log.'
    },
    {
      q: 'What must you run after creating or editing a unit file, before systemctl will see the change?',
      options: ['systemctl daemon-reload', 'A full system reboot', 'Nothing; systemd watches unit files automatically in real time', 'systemctl refresh-all'],
      correct: 0,
      explain: 'systemd caches unit definitions in memory; "systemctl daemon-reload" tells it to re-read unit files from disk. Skipping this is a very common cause of "I edited the file but nothing changed."'
    },
    {
      q: 'What does "Restart=on-failure" in a unit file do, and what does it NOT do?',
      options: ['Restarts the service on any exit, including a deliberate "systemctl stop"', 'Restarts the service automatically after a crash/non-zero exit, but not after a deliberate stop or clean success exit', 'Restarts the whole machine when the service fails', 'Has no effect unless combined with "enable"'],
      correct: 1,
      explain: 'on-failure covers crashes and abnormal/non-zero exits specifically — it deliberately does not fire when an admin runs "systemctl stop" (an intentional action, not a failure) or when the process exits cleanly with success.'
    }
  ],
  pitfalls: [
    'Editing a unit file and expecting the change to take effect immediately without "systemctl daemon-reload" — systemd caches the old definition until explicitly told to re-read it.',
    'Running "systemctl start" and assuming that\'s enough for production — without also "enable," the service silently won\'t come back after the next reboot, often discovered only during an actual incident.',
    'Chasing a problem through scattered log files under /var/log for something that\'s actually managed by systemd — "journalctl -u <service>" is almost always faster and more complete than guessing which file it might be writing to.'
  ],
  interview: [
    {
      q: 'What is systemd, and why does it matter that it runs as PID 1?',
      a: 'systemd is the init system and service manager on nearly every modern Linux distro — the first process the kernel starts at boot, making it PID 1. That position matters because every other process on the system is either started by systemd directly or descends from something it started, and PID 1 has special responsibilities in the kernel\'s process model (like adopting orphaned processes, as covered in the previous lesson). Beyond just "starting things," systemd manages start-up ordering and dependencies between services, restarts services that crash, and centralizes their logs — replacing what used to be a patchwork of separate init scripts, cron-based restart hacks, and scattered log files.'
    },
    {
      q: 'Explain the difference between "enabled" and "active" for a systemd service, with an example of when you\'d want one without the other.',
      a: '"Active" describes whether the service is running RIGHT NOW, in the current boot session. "Enabled" describes whether it\'s wired into a boot target to start automatically on the NEXT boot — an entirely separate, independent setting. You might want enabled-without-active when staging a service ahead of a planned maintenance window: it\'ll come up cleanly on the next scheduled reboot without needing to be running immediately. You might want active-without-enabled for a genuinely temporary or experimental process you deliberately don\'t want surviving a reboot. Standard production deployment typically wants both, hence "systemctl enable --now" as the common combined command.'
    },
    {
      q: 'How would you investigate why a systemd-managed service isn\'t working correctly on a server you\'ve just SSHed into?',
      a: 'Start with "systemctl status <service>" — it shows in one place whether it\'s active/inactive/failed, its PID if running, how long it\'s been up, and a handful of recent log lines, which is often enough to immediately spot the problem. If more detail is needed, "journalctl -u <service> -f" to watch logs live while reproducing the issue, or "journalctl -u <service> --since \'1 hour ago\' -p err" to scan recent errors specifically without wading through routine noise. If the unit file itself was recently changed, checking whether "systemctl daemon-reload" was run afterward is worth ruling out early, since a stale cached definition is a common, easy-to-miss cause of "I fixed it but nothing changed."'
    },
    {
      q: 'Why is "Restart=on-failure" in a unit file a meaningful reliability improvement over the nohup approach from the previous lesson?',
      a: 'nohup solves exactly one problem — surviving SIGHUP when the launching terminal closes — and does nothing at all if the process itself later crashes; recovering from that requires a human to notice and manually relaunch it. A systemd unit with "Restart=on-failure" is actively supervised: systemd itself detects a crash (non-zero exit or abnormal termination) and relaunches the process automatically, with no human intervention needed, and it does so consistently regardless of what else is happening on the system. That distinction — passive survival of one specific event vs. active supervision and recovery from failures in general — is exactly why systemd services are the real answer for anything a production system actually depends on staying up.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover running and reading a single service. This is what\'s underneath: how services chain together at boot, what unit TYPES exist beyond .service, and the systemd-native alternative to cron.',
    sections: [
      {
        h: 'Targets: systemd\'s replacement for old-style runlevels',
        p: [
          'A <b>target</b> is a unit that groups other units together as a synchronization point — the modern equivalent of old SysV "runlevels." <code>multi-user.target</code> (normal, non-graphical boot with networking) and <code>graphical.target</code> (multi-user PLUS a display manager) are the two you\'ll see referenced constantly; a unit\'s <code>[Install] WantedBy=multi-user.target</code> line is what "enable" actually wires up — it means "when the system reaches multi-user.target, start this too." <code>systemctl get-default</code> shows which target the machine boots into by default; <code>systemctl isolate rescue.target</code> switches to a minimal single-user recovery target, useful when something at normal boot is badly broken.'
        ]
      },
      {
        h: 'Beyond .service: other unit types',
        p: [
          'A <b>.timer</b> unit pairs with a same-named <b>.service</b> unit to trigger it on a schedule — systemd\'s own, more capable alternative to cron (covered properly in Part 7), with the advantage of unified logging via journalctl and the ability to express "5 minutes after boot" or "catch up on a missed run" more naturally than cron\'s fixed clock-time syntax. A <b>.mount</b> unit represents a filesystem mount point, letting systemd sequence "start this service only after that filesystem is actually mounted" as an ordinary dependency. A <b>.socket</b> unit lets systemd listen on a network port or file on a service\'s behalf and only actually start the service the first time a connection arrives — genuine lazy-startup, reducing idle resource usage for rarely-used services.'
        ]
      },
      {
        h: 'journalctl in more depth: persistence and structured queries',
        p: [
          'By default on many distros the journal is IN-MEMORY only and doesn\'t survive a reboot — <code>journalctl --list-boots</code> shows whether previous-boot logs exist at all; if persistent logging is configured (<code>/var/log/journal/</code> exists), <code>journalctl -b -1</code> shows logs from the PREVIOUS boot specifically, invaluable when investigating a crash that took the whole machine down. <code>journalctl -u myapp -o json-pretty</code> emits structured JSON instead of the human-readable default, useful for piping into another tool. <code>journalctl --disk-usage</code> and a configured <code>SystemMaxUse=</code> in <code>/etc/systemd/journald.conf</code> matter on long-lived servers, since an unbounded journal can genuinely fill a disk over months of uptime.'
        ]
      }
    ]
  }
};
