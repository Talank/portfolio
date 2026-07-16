/*
Master ordered list of study modules for the Linux Course. Drives the
dashboard, nav order, prev/next links on lesson pages, and the interview
drill question pool.
type: 'lesson' — loads data/lessons/<id>.js into lesson.html?id=<id>
type: 'drill'  — special page (href used directly)

Scope is deliberately lean: exactly what you need to be genuinely comfortable
on a Linux box over SSH — the filesystem, permissions, processes, text
processing & regex, bash scripting, networking, package management — plus a
closing bridge lesson connecting "a container is just a Linux process" to
the next course (CI/CD, Docker & Kubernetes). Every lesson teaches essentials
first; lessons with real depth to spare also carry an optional `deepDive`
section, unlocked site-wide via the Essentials/Full Depth switch in the
header (see js/app.js).
*/
window.SCHEDULE = [
  // ── Part 0: Orientation & the Terminal ───────────────────────────────
  { id: 'why-linux-matters', title: 'Why Linux: the Landscape, the Philosophy, and Why SSH Lives Here', category: 'Part 0 — Orientation & Terminal', timeMin: 25, type: 'lesson' },
  { id: 'terminal-first-commands', title: 'The Terminal: Shell, Prompt, and Your First Commands', category: 'Part 0 — Orientation & Terminal', timeMin: 35, type: 'lesson' },

  // ── Part 1: Filesystem & Files ───────────────────────────────────────
  { id: 'filesystem-hierarchy', title: 'The Filesystem Hierarchy: /, /home, /etc, /var, /usr, /tmp — and Why', category: 'Part 1 — Filesystem & Files', timeMin: 35, type: 'lesson' },
  { id: 'navigating-files', title: 'Navigating & Manipulating Files: Paths, Globs, cp/mv/rm, cat/less/head/tail', category: 'Part 1 — Filesystem & Files', timeMin: 40, type: 'lesson' },
  { id: 'permissions-ownership', title: 'Permissions & Ownership: rwx, chmod, chown, umask, and the Special Bits', category: 'Part 1 — Filesystem & Files', timeMin: 45, type: 'lesson' },
  { id: 'links-and-editors', title: 'Symlinks vs Hard Links, and Just Enough vim/nano to Survive', category: 'Part 1 — Filesystem & Files', timeMin: 35, type: 'lesson' },

  // ── Part 2: Users, Processes & Services ──────────────────────────────
  { id: 'users-groups-sudo', title: 'Users, Groups & sudo: /etc/passwd, /etc/group, and Root Without Being Root', category: 'Part 2 — Users, Processes & Services', timeMin: 35, type: 'lesson' },
  { id: 'processes-job-control', title: 'Processes & Job Control: ps, top, kill, Signals, fg/bg, nohup', category: 'Part 2 — Users, Processes & Services', timeMin: 45, type: 'lesson' },
  { id: 'systemd-services', title: 'systemd: Services, Units, systemctl & journalctl', category: 'Part 2 — Users, Processes & Services', timeMin: 40, type: 'lesson' },

  // ── Part 3: I/O, Pipes, Regex & Text Processing ──────────────────────
  { id: 'redirection-pipes', title: 'stdin, stdout, stderr: Redirection & Pipes', category: 'Part 3 — Text, Pipes & Regex', timeMin: 35, type: 'lesson' },
  { id: 'grep-basics', title: 'grep: Searching Text (and Why It\'s Everywhere in CI Logs)', category: 'Part 3 — Text, Pipes & Regex', timeMin: 30, type: 'lesson' },
  { id: 'regex-fundamentals', title: 'Regex Fundamentals: Literals, ., *, +, ?, Anchors & Character Classes', category: 'Part 3 — Text, Pipes & Regex', timeMin: 50, type: 'lesson' },
  { id: 'regex-practical', title: 'Regex, Practically: Groups, Greedy vs Lazy, Extended Regex, Real Patterns', category: 'Part 3 — Text, Pipes & Regex', timeMin: 45, type: 'lesson' },
  { id: 'sed-awk', title: 'sed & awk: Stream Editing and Field Processing One-Liners', category: 'Part 3 — Text, Pipes & Regex', timeMin: 45, type: 'lesson' },

  // ── Part 4: Shell & Bash Scripting ───────────────────────────────────
  { id: 'shell-environment', title: 'The Shell Environment: bash vs zsh, .bashrc/.zshrc, PATH & Aliases', category: 'Part 4 — Shell & Bash Scripting', timeMin: 35, type: 'lesson' },
  { id: 'bash-scripting-basics', title: 'Bash Scripting Basics: Shebang, Variables, Quoting, Arguments, Exit Codes', category: 'Part 4 — Shell & Bash Scripting', timeMin: 45, type: 'lesson' },
  { id: 'bash-loops-functions', title: 'Bash Control Flow: if/test, Loops, Functions & Arrays', category: 'Part 4 — Shell & Bash Scripting', timeMin: 45, type: 'lesson' },
  { id: 'bash-scripting-advanced', title: 'Writing Bash Scripts That Don\'t Break: set -euo pipefail, trap, Debugging', category: 'Part 4 — Shell & Bash Scripting', timeMin: 40, type: 'lesson' },

  // ── Part 5: Networking & SSH ──────────────────────────────────────────
  { id: 'networking-basics', title: 'Networking Basics: IPs, Ports, DNS, curl & wget', category: 'Part 5 — Networking & SSH', timeMin: 35, type: 'lesson' },
  { id: 'ssh-fundamentals', title: 'SSH: Keys, Agents, ~/.ssh/config, and How the Handshake Actually Works', category: 'Part 5 — Networking & SSH', timeMin: 50, type: 'lesson' },
  { id: 'scp-rsync-remote-files', title: 'Moving Files Over SSH: scp, rsync & Why rsync Wins', category: 'Part 5 — Networking & SSH', timeMin: 35, type: 'lesson' },

  // ── Part 6: Package Management & Archives ────────────────────────────
  { id: 'package-managers', title: 'Package Managers: apt/dnf/brew, Installing, Updating & Why Containers Go Minimal', category: 'Part 6 — Packages & Archives', timeMin: 35, type: 'lesson' },
  { id: 'archives-compression', title: 'tar, gzip & zip: Why .tar.gz Is Everywhere', category: 'Part 6 — Packages & Archives', timeMin: 25, type: 'lesson' },

  // ── Part 7: Toward CI/CD ──────────────────────────────────────────────
  { id: 'cron-scheduled-tasks', title: 'Scheduling Work: cron, crontab & systemd Timers', category: 'Part 7 — Toward CI/CD', timeMin: 30, type: 'lesson' },
  { id: 'linux-in-containers-preview', title: 'What a Container Actually Is: Namespaces, cgroups & "Just a Process"', category: 'Part 7 — Toward CI/CD', timeMin: 40, type: 'lesson' },
  { id: 'capstone-toolkit', title: 'Capstone: Build a Real Ops Toolkit (grep + awk + regex + ssh + cron, together)', category: 'Part 7 — Toward CI/CD', timeMin: 60, type: 'lesson' },
];

/* Category → accent color, used for dashboard group headings, module-card
   left borders, and the lesson-page category pill. Eight distinct hues on
   the dark background, one per Part. */
window.CATEGORY_COLORS = {
  'Part 0 — Orientation & Terminal': '#4fd1c5',
  'Part 1 — Filesystem & Files': '#63b3ed',
  'Part 2 — Users, Processes & Services': '#9f7aea',
  'Part 3 — Text, Pipes & Regex': '#ecc94b',
  'Part 4 — Shell & Bash Scripting': '#68d391',
  'Part 5 — Networking & SSH': '#fc8181',
  'Part 6 — Packages & Archives': '#f6ad55',
  'Part 7 — Toward CI/CD': '#ed64a6',
};
