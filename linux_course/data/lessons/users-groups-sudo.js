window.LESSONS = window.LESSONS || {};
window.LESSONS['users-groups-sudo'] = {
  id: 'users-groups-sudo',
  title: 'Users, Groups & sudo: /etc/passwd, /etc/group, and Root Without Being Root',
  category: 'Part 2 — Users, Processes & Services',
  timeMin: 35,
  summary: 'Every process on Linux runs as some user, and that user\'s identity — not just a name, but a number — is exactly what the permission checks from the last lesson were comparing against. This lesson opens up where that identity actually lives (/etc/passwd, /etc/group), what root really is, and how sudo lets you borrow root\'s power for one command at a time without ever actually becoming root.',
  goals: [
    'Explain what a UID and GID are, and locate a user\'s record in /etc/passwd',
    'Use whoami, id, and groups to inspect your own identity and group memberships',
    'Explain the difference between a primary group and supplementary groups',
    'Use sudo correctly for a single privileged command, and explain why that\'s safer than logging in as root',
    'Explain the principle of least privilege and how sudoers/visudo apply it in practice'
  ],
  concept: [
    {
      h: 'Every user is actually a number: UID, GID, and /etc/passwd',
      p: [
        'The username you type is a convenience label for humans — internally, the kernel identifies every user by a plain integer: the <b>UID</b> (user ID). The mapping from name to number lives in <code>/etc/passwd</code>, one line per user, colon-separated: <code>username:x:UID:GID:comment:home_dir:shell</code>. The <code>x</code> in the second field is a placeholder — the actual (hashed) password lives in the separate, far-more-restricted <code>/etc/shadow</code> file, specifically so that a file every program needs to read (to resolve names to UIDs) doesn\'t also have to expose password hashes to everyone.',
        'Root — the one user permissions checks always let through — is nothing mystical: it\'s simply <b>UID 0</b>. Any account with UID 0 has root\'s powers, which is exactly why "some other account secretly has UID 0" is a real privilege-escalation attack, and why <code>id</code> (not just the username you\'re logged in as) is what you check when you genuinely need to know who you are.',
        '<div class="math">nami:x:1001:1001:Nami,,,:/home/nami:/bin/bash<br>│    │ │    │    │        │            └─ login shell<br>│    │ │    │    │        └────────────── home directory<br>│    │ │    │    └─────────────────────── comment/full name (GECOS field)<br>│    │ │    └──────────────────────────── primary GID<br>│    │ └───────────────────────────────── UID<br>│    └─────────────────────────────────── password placeholder (real hash in /etc/shadow)<br>└──────────────────────────────────────── username<span class="mnote">Seven colon-separated fields, always in this order. The kernel only ever really cares about the UID and GID — everything else is bookkeeping for humans and shells.</span></div>'
      ]
    },
    {
      h: 'Groups: one primary, any number of supplementary',
      p: [
        'Just like users, groups are numbers (<b>GID</b>s) with name mappings in <code>/etc/group</code>. Every user has exactly one <b>primary group</b> — recorded right there in their <code>/etc/passwd</code> line, the GID field — which becomes the owning group on any new file they create (this is what the previous lesson\'s umask math was building on top of). But a user can ALSO belong to any number of <b>supplementary groups</b>, listed as membership entries inside <code>/etc/group</code> itself, which grant that user group-level access to OTHER files and resources without changing their primary group at all.',
        'Run <code>id</code> and you\'ll see both at once: one primary GID plus a list of every supplementary group. This is exactly how a later course (CI/CD, Docker) grants a regular user permission to run Docker commands — by adding them to the <code>docker</code> supplementary group — without making them root and without touching their primary group identity.'
      ]
    },
    {
      h: 'Root, and why nobody should live there full-time',
      p: [
        'The last lesson showed permission checks always ask "which category does this user fall into: owner, group, or other?" Root is the deliberate exception: the kernel lets UID 0 skip that check almost entirely, on almost everything. That\'s enormously useful for system administration and enormously dangerous as a daily-driver identity — a single typo in a root shell (a wrong path in an <code>rm -rf</code>, say) has no permission system left to catch it.',
        '<code>su</code> ("switch user," historically "substitute user") lets you fully log in as another user, including root, given that user\'s password — you stay root for the whole session until you exit. That\'s exactly the "living in root" problem. It\'s still around, but for day-to-day admin work it has been largely superseded by something narrower.'
      ]
    },
    {
      h: 'sudo: borrow root for one command, and leave a trail',
      p: [
        '<code>sudo command</code> runs just that one command as root (or another configured user), then you\'re immediately back to being yourself. Crucially, it asks for <b>your own</b> password, not root\'s — because it\'s not proving "you know root\'s secret," it\'s re-confirming "you are still genuinely you," and your right to use sudo at all was already granted separately, in advance, by an administrator.',
        'That grant lives in <code>/etc/sudoers</code>, which you\'re never supposed to edit directly — always through <code>visudo</code>, which validates the syntax before saving so a broken sudoers file can\'t lock every admin out of privilege escalation at once. Every sudo invocation is also logged (typically to the system journal or <code>/var/log/auth.log</code>), which is the other half of the design: not just "borrow power briefly," but "leave an audit trail of exactly who used it, when, and for what." This is the <b>principle of least privilege</b> in practice — most of the time you run as an unprivileged user who can do relatively little damage, and you reach for elevated power explicitly, narrowly, and traceably, only for the specific command that actually needs it.'
      ]
    }
  ],
  conceptFlow: {
    title: 'You type "sudo apt install nano" — what actually happens?',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'The request',
        nodes: [
          { id: 'request', text: 'nami runs\nsudo apt install nano' }
        ]
      },
      {
        label: 'Is nami even allowed to sudo?',
        nodes: [
          { id: 'checksudoers', text: 'Check /etc/sudoers\n(and sudo group membership)' },
          { id: 'notallowed', text: 'Not listed\n"nami is not in the sudoers file"' }
        ]
      },
      {
        label: 'Prove it\'s really nami',
        nodes: [
          { id: 'askpass', text: 'Prompt for NAMI\'s password\n(not root\'s)' },
          { id: 'wrongpass', text: 'Wrong password\ndenied, logged' }
        ]
      },
      {
        label: 'Run and log',
        nodes: [
          { id: 'runasroot', text: 'Run apt install nano\nas root, just this once' },
          { id: 'logit', text: 'Log the event\nwho, when, what command' }
        ]
      }
    ],
    steps: [
      { active: ['request'], note: 'nami wants to install a package, which requires writing to system directories only root can touch.' },
      { active: ['checksudoers'], note: 'sudo\'s first question isn\'t "who is root" — it\'s "does /etc/sudoers say nami is allowed to do this at all." No entry, no sudo, full stop.' },
      { active: ['notallowed'], note: 'If nami genuinely isn\'t listed (directly or via a group like %sudo), the request is refused immediately — sudo access is opt-in, granted deliberately by an admin, never assumed.' },
      { active: ['askpass'], note: 'Assuming nami IS allowed, sudo asks for nami\'s OWN password — re-confirming identity, not asking for a secret only root would know.' },
      { active: ['wrongpass'], note: 'A wrong password is denied and logged, same as any failed login attempt — sudo doesn\'t quietly retry forever.' },
      { active: ['runasroot'], note: 'With identity confirmed and permission already on file, the single command runs with root privileges — just this one invocation, not a whole logged-in root session.' },
      { active: ['logit'], note: 'The event is recorded: who ran it, exactly what command, and when. This audit trail is half the point of sudo existing at all instead of everyone just knowing the root password.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Iceburg\'s Blueprint Vault and the One-Time Chit',
      text: 'Every shipwright at Galley-La has an employee number stitched into their uniform — nobody at Water 7 is just "a guy," everybody is a specific, numbered worker assigned to a specific dock crew. Most jobs never need anything more than that: your number and your crew tell the foremen everything required to let you into the ordinary work areas. But the Pole Plans — the restricted blueprints locked in Iceburg\'s vault — are a different matter entirely. Iceburg, as mayor, is the one person whose authority the vault always accepts without question; nobody else\'s employee number, no matter how senior, opens it on its own. When a trusted foreman genuinely needs something from that vault for a specific job, Iceburg doesn\'t hand over his own master key and let them wander in unsupervised, and he doesn\'t make them become mayor for the day either. He issues a single, narrowly-scoped chit: valid for this one retrieval, requires the foreman to re-confirm their OWN identity to the vault guard (not recite some secret mayoral password they were never given), and gets logged in the vault\'s access book the instant it\'s used — name, time, exactly what was taken. The chit expires the moment the job is done. Nobody walks around Water 7 carrying permanent mayoral authority in their pocket, because Iceburg understood something every good system administrator eventually learns: the danger isn\'t trusting your foremen, it\'s leaving the vault permanently open to anyone who was ever trusted once.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Howard\'s JPL Badge Needs a Supervisor\'s Sign-Off Every Single Time',
      text: 'Howard\'s day job at a NASA contractor runs on a system that would make a sysadmin proud, though it takes the group a while to actually respect it. Howard has a perfectly normal employee badge — his own "UID," so to speak — that gets him into the building, the cafeteria, his own desk, the ordinary stuff. But certain restricted areas and certain pieces of hardware require sign-off from his supervisor every single time, no exceptions, no "well I signed off yesterday so it should still count." Howard doesn\'t get handed his supervisor\'s badge to keep in his wallet for convenience — that would defeat the entire point. Instead, each time, he has to be the one standing there, prove it\'s actually him (not someone borrowing his badge), and the supervisor grants access for that one specific task, which gets logged. Raj, unfamiliar with how any of this works, assumes Howard is exaggerating the bureaucracy for effect — until Howard walks him through what happens when someone tries to skip the process: the system doesn\'t care how trusted you generally are or how many times you\'ve done this exact task before, it re-checks, every time, and it writes down that it did. Leonard\'s eventual, grudging take: "So you are saying you cannot just BE your supervisor for the day." "Correct," Howard says. "And that is the whole point — if I could, one bad afternoon and I have got permanent access to things I only ever needed for ten minutes."'
    },
    why: 'sudo isn\'t "temporarily become root" in the sense of taking on a new identity — it\'s "prove you\'re still you, and borrow one specific privileged action, with the whole thing logged." The chit and the badge both expire immediately after use; nobody walks around carrying standing root-level authority just because they needed it once.'
  },
  tech: [
    {
      q: 'Why does sudo prompt for YOUR password rather than root\'s password?',
      a: 'Because sudo isn\'t verifying "do you know a shared secret that root knows" — it\'s re-confirming "are you genuinely the account that /etc/sudoers already granted this privilege to." The permission to use sudo at all was decided in advance by an administrator editing sudoers; the password prompt at run-time is just re-authenticating that you\'re still that same, already-trusted user, not a new grant of trust. If sudo asked for root\'s password instead, every sudo user would effectively need to know root\'s actual password, which is precisely the shared-secret, no-audit-trail problem sudo exists to avoid.'
    },
    {
      q: 'What\'s the practical difference between su and sudo, and why do most teams prefer sudo for day-to-day work?',
      a: '"su" (without a target user, defaulting to root) requires knowing root\'s actual password and drops you into a full, ongoing root shell — every subsequent command runs as root until you explicitly exit, with no per-command logging distinguishing one action from the next. "sudo" requires only your own password, elevates for a single command at a time, and logs each invocation individually. Teams prefer sudo because it minimizes how long anyone spends with root power active, keeps a clear per-command audit trail, and never requires distributing the actual root password to every admin — access can be granted or revoked per-user in sudoers without ever changing root\'s password itself.'
    },
    {
      q: 'Why would an admin add NOPASSWD for a specific command in sudoers instead of always requiring a password?',
      a: 'Usually for a narrowly-scoped automated task — a deploy script or monitoring agent that needs to run one specific privileged command unattended, where there\'s no human present to type a password at all. The tradeoff is real: NOPASSWD removes the "prove you\'re still you" re-check, so it should be scoped as tightly as possible (one exact command, not a blanket "no password ever needed for anything"), and it\'s exactly the kind of sudoers line a security review checks first, since a broadly-scoped NOPASSWD entry is close to a standing root shell with extra steps.'
    }
  ],
  code: {
    title: 'Inspecting identity and using sudo',
    intro: 'Run these on any Linux box you have access to (a cloud VM, WSL, a container — anything real).',
    code: `$ whoami
nami

$ id
uid=1001(nami) gid=1001(nami) groups=1001(nami),27(sudo),999(docker)
# One primary group (nami, 1001) plus two supplementary groups (sudo, docker).

$ groups
nami sudo docker

$ tail -3 /etc/passwd
nami:x:1001:1001:Nami,,,:/home/nami:/bin/bash
zoro:x:1002:1002:Zoro,,,:/home/zoro:/bin/bash
sanji:x:1003:1003:Sanji,,,:/home/sanji:/bin/bash

$ cat /etc/group | grep sudo
sudo:x:27:nami,zoro
# nami and zoro are BOTH supplementary members of the "sudo" group.

$ sudo apt update
[sudo] password for nami:
# Prompts for NAMI's password, not root's.

$ sudo whoami
root
# Just this one command ran as root. The next command is back to being nami.

$ whoami
nami`,
    notes: [
      'The "sudo" group membership in /etc/group is exactly what typically GRANTS sudo access in the first place — check /etc/sudoers and you\'ll usually find a line like "%sudo ALL=(ALL:ALL) ALL" delegating to that group.',
      '"sudo -l" lists exactly what the current user is allowed to run with sudo — genuinely useful the first time you\'re handed access to an unfamiliar server.'
    ]
  },
  lab: {
    title: 'Decode a passwd line and write the right commands',
    prompt: 'Given the /etc/passwd line below, answer the two questions, then write the two requested commands.',
    starter: `# zoro:x:1002:1002:Zoro,,,:/home/zoro:/bin/bash

# Q1: What is zoro's UID?


# Q2: What is zoro's primary GID?


# Task: check which groups the CURRENT user belongs to (one command)


# Task: run "systemctl restart nginx" with root privileges via sudo

`,
    checks: [
      { re: '(^|\\D)1002(\\D|$)', flags: 'm', must: true, hint: 'zoro\'s UID is the third colon-separated field: 1002.', pass: 'UID identified as 1002 ✓' },
      { re: 'groups', flags: 'i', must: true, hint: 'The "groups" command (or "id") lists the current user\'s group memberships.', pass: 'groups/id command present ✓' },
      { re: 'sudo\\s+systemctl\\s+restart\\s+nginx', flags: 'i', must: true, hint: '"sudo systemctl restart nginx" runs the restart with root privileges for just that command.', pass: 'sudo systemctl restart nginx ✓' }
    ],
    run: 'Try it for real on any Linux machine you have: id, groups, and (if you have sudo access) a real sudo command.',
    solution: `# zoro:x:1002:1002:Zoro,,,:/home/zoro:/bin/bash

# Q1: What is zoro's UID?
# 1002

# Q2: What is zoro's primary GID?
# 1002 (same number here, but it's a separate field with a separate meaning)

# Task: check which groups the CURRENT user belongs to (one command)
groups

# Task: run "systemctl restart nginx" with root privileges via sudo
sudo systemctl restart nginx`,
    notes: [
      'UID and primary GID are often the same number for a personal Linux account (many distros create a matching one-user group per account) — but they\'re still two conceptually separate fields, and on shared/server systems they frequently differ.',
      'If "sudo systemctl restart nginx" ever fails with "command not found," check whether you meant "sudo service nginx restart" — the right command depends on whether the system uses systemd (next lesson).'
    ]
  },
  quiz: [
    {
      q: 'What number does the kernel actually use to identify a user, underneath the username?',
      options: ['The UID, an integer', 'The full name in the GECOS field', 'The home directory path', 'The login shell'],
      correct: 0,
      explain: 'Usernames are a human convenience; internally the kernel identifies users purely by UID, an integer, with root always being UID 0.'
    },
    {
      q: 'Where are actual password hashes stored, and why not directly in /etc/passwd?',
      options: ['In /etc/shadow, which has much stricter read permissions than /etc/passwd', 'In /etc/group, alongside group memberships', 'They aren\'t stored anywhere; Linux doesn\'t hash passwords', 'Directly in /etc/passwd, in the second field'],
      correct: 0,
      explain: '/etc/passwd must be world-readable so ordinary programs can resolve UIDs to names; password hashes were split out into the much more restricted /etc/shadow specifically so that requirement doesn\'t also expose hashes to everyone.'
    },
    {
      q: 'A user\'s primary group vs. supplementary groups — what\'s the key difference?',
      options: ['There is no real difference; both work identically in every context', 'The primary group is recorded in /etc/passwd and becomes the owning group on new files; supplementary groups (listed in /etc/group) grant extra group-level access without changing that', 'Supplementary groups override the primary group entirely', 'Only the primary group can ever grant sudo access'],
      correct: 1,
      explain: 'Primary group = the one GID in /etc/passwd, used as the default owning group for new files. Supplementary groups are additional memberships listed in /etc/group that grant access to other resources (like the "docker" or "sudo" groups) without touching the primary group.'
    },
    {
      q: 'Why does sudo ask for the invoking user\'s own password instead of root\'s?',
      options: ['It\'s re-confirming identity, since the actual permission to use sudo was already granted in advance via /etc/sudoers', 'It\'s a bug that most distros haven\'t fixed yet', 'Root doesn\'t actually have a password on any modern system', 'sudo doesn\'t require any authentication at all'],
      correct: 0,
      explain: 'sudo access is pre-granted per-user in /etc/sudoers by an admin; the password prompt just re-verifies you\'re genuinely that already-trusted user, not a fresh grant of root\'s own secret.'
    },
    {
      q: 'Why is running as root full-time (rather than using sudo per-command) considered risky?',
      options: ['It isn\'t risky at all; sudo is purely a matter of style', 'Root bypasses almost all permission checks, so a single mistake (like a wrong path in rm -rf) has no safety net left to catch it', 'Root accounts are always slower than regular accounts', 'Root sessions cannot run any commands that regular users can run'],
      correct: 1,
      explain: 'Root skips nearly all of the owner/group/other permission checking that would otherwise stop a mistaken or malicious command — living there full-time removes the safety net for every single command, not just the ones that actually need elevated privilege.'
    }
  ],
  pitfalls: [
    'Editing /etc/sudoers directly with a regular text editor instead of visudo — a syntax error saved directly can lock every admin out of using sudo simultaneously; visudo validates before saving specifically to prevent this.',
    'Treating "I have sudo access" as "I should just prefix everything with sudo out of habit" — running ordinary, non-privileged commands with sudo unnecessarily creates root-owned files in places a regular user should own, causing confusing permission errors later.',
    'Confusing "su" (which requires root\'s own password and opens a full ongoing root session) with "sudo" (which uses your own password for one command) — assuming they\'re interchangeable leads to either being unable to su without a password you were never given, or leaving a root session open far longer than intended.'
  ],
  interview: [
    {
      q: 'Explain what a UID is and why root is UID 0 specifically.',
      a: 'A UID is the integer the kernel actually uses to identify a user; usernames in /etc/passwd are just a human-readable label mapped to that number. Root is UID 0 by convention and by kernel logic — the kernel checks specifically for UID 0 to decide whether to bypass standard permission checks, which is also why any account that somehow acquires UID 0 (even under a different username) effectively has full root power, making that a serious, checked-for privilege-escalation red flag.'
    },
    {
      q: 'Walk through what sudo actually does when a properly-authorized user runs "sudo somecommand."',
      a: 'sudo first checks /etc/sudoers to confirm the invoking user (or a group they belong to) is actually authorized to run this command as the target user — if not, it\'s refused immediately. If authorized, it prompts for the INVOKING user\'s own password to re-confirm identity (not root\'s password). Once verified, it runs exactly that one command with elevated (typically root) privileges, then returns control — the user\'s own shell session never itself becomes root. The whole event, including the specific command run, is logged for audit purposes.'
    },
    {
      q: 'What\'s the difference between a primary group and a supplementary group, and why does that distinction matter in practice?',
      a: 'A primary group is the single GID recorded in a user\'s /etc/passwd entry, and it\'s what becomes the owning group on files that user creates. Supplementary groups are additional memberships recorded in /etc/group that grant access to OTHER resources (like being added to a "docker" or "sudo" group) without altering the user\'s default file-ownership behavior. The distinction matters because granting someone new access (say, to run Docker) should usually be a supplementary-group addition, not a primary-group change — changing the primary group would also silently change what group newly created files default to, which is rarely the actual intent.'
    },
    {
      q: 'Why is "principle of least privilege" the underlying idea behind sudo\'s design, rather than just "make root access easier"?',
      a: 'Least privilege means an account should have only the access it needs for the task at hand, for only as long as it needs it — not standing, permanent, maximal access "just in case." sudo embodies this by keeping users in an unprivileged account by default, requiring explicit, pre-granted authorization per command (via sudoers), elevating only for the single invocation that actually needs it, and logging each use. The alternative — everyone routinely logged in as root — maximizes the blast radius of any mistake or compromised account, which is exactly what least privilege is designed to minimize.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover reading identity and using sudo safely. This is what\'s underneath: how sudoers is actually structured, how accounts get created in the first place, and the authentication layer sudo actually calls into.',
    sections: [
      {
        h: 'Reading a real /etc/sudoers line',
        p: [
          'A sudoers entry has the shape <code>who  where=(as_whom) what</code>. The extremely common <code>%sudo ALL=(ALL:ALL) ALL</code> reads as: for anyone in the <code>%sudo</code> group ("%" prefixes a group name), on ANY host, running as ANY user and ANY group, ALL commands are permitted. A far narrower, more production-realistic line like <code>deploy ALL=(www-data) NOPASSWD: /usr/bin/systemctl restart myapp</code> grants the "deploy" user permission to run exactly one command, as exactly one target user (www-data, not root), with no password prompt — a tightly-scoped automation grant instead of a blanket one.',
          '<code>visudo</code> opens sudoers (or a file under <code>/etc/sudoers.d/</code>, the preferred place to add custom rules without editing the main file) in your configured editor, then syntax-checks it before allowing a save — a malformed sudoers file, saved directly, can leave a system with NO way to escalate to fix it without physical/console access.'
        ]
      },
      {
        h: 'Creating accounts: useradd, usermod, groupadd',
        p: [
          '<code>useradd -m -s /bin/bash newuser</code> creates a new user (<code>-m</code> creates their home directory, <code>-s</code> sets their login shell) — but leaves the account locked with no usable password until <code>passwd newuser</code> sets one. <code>usermod -aG docker newuser</code> adds an EXISTING user to a supplementary group — the <code>-a</code> (append) flag matters enormously here: leaving it off replaces the user\'s ENTIRE supplementary group list with just the one named group, silently removing every other group membership they had, a genuinely common and painful mistake. <code>groupadd</code> creates a new group outright, for cases where the group itself doesn\'t exist yet.'
        ]
      },
      {
        h: 'PAM: the layer sudo actually authenticates through',
        p: [
          'sudo doesn\'t implement its own password-checking logic — it calls into <b>PAM</b> (Pluggable Authentication Modules), the same general-purpose authentication framework behind login, su, and SSH password auth. PAM is configured per-service under <code>/etc/pam.d/</code> (there\'s a <code>/etc/pam.d/sudo</code> file specifically), as a stack of modules that can each contribute a pass/fail/skip decision — which is how a system can layer in things like "also require a hardware key" or "lock out after N failed attempts" for sudo specifically, without sudo\'s own code knowing anything about hardware keys or lockout policies at all. Knowing PAM exists is usually enough for day-to-day admin work; actually writing PAM configs is a deeper specialty most engineers never need to touch directly.'
        ]
      }
    ]
  }
};
