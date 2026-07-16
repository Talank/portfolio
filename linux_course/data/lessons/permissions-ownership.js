window.LESSONS = window.LESSONS || {};
window.LESSONS['permissions-ownership'] = {
  id: 'permissions-ownership',
  title: 'Permissions & Ownership: rwx, chmod, chown, umask, and the Special Bits',
  category: 'Part 1 — Filesystem & Files',
  timeMin: 45,
  summary: 'Every file and directory on Linux has an owner, a group, and a permission bitmask that decides who can read, write, or execute it. This is the mechanism behind "why can\'t I run this script," "why does this file say permission denied," and — much later — why a misconfigured SSH key file gets silently rejected. Decode it once, properly, and it never confuses you again.',
  goals: [
    'Read an "ls -l" permission string (like -rwxr-xr--) and state exactly who can do what to that file',
    'Use chmod in both symbolic (u+x) and numeric (755) form, and convert confidently between them',
    'Explain the difference between a file\'s owner, its group, and "everyone else," and use chown/chgrp to change them',
    'Explain what umask does and why newly created files aren\'t executable by default while new directories are',
    'Recognize the setuid, setgid, and sticky special permission bits by their symbol in ls -l output and state what each one does'
  ],
  concept: [
    {
      h: 'Three permissions, three groups of people — nine bits total',
      p: [
        'Every file has exactly three PERMISSIONS that can be granted or withheld: <b>r</b>ead (view contents, or list a directory\'s entries), <b>w</b>rite (modify contents, or add/remove entries in a directory), and e<b>x</b>ecute (run it as a program, or — for a directory specifically — enter it with cd and access things inside it by name). And those three permissions are granted separately to three CATEGORIES of people: the file\'s <b>owner</b> (usually whoever created it), the file\'s <b>group</b> (a set of users who share some access), and <b>other</b> (everyone else on the system). Three permissions × three categories = nine independent yes/no switches, and that\'s the entire permission model.',
        '<code>ls -l</code> shows all nine at once as a ten-character string, like <code>-rwxr-xr--</code>. Read it as: first character is the file TYPE (<code>-</code> for a regular file, <code>d</code> for a directory, <code>l</code> for a symlink — Part 1\'s next lesson), then three groups of three: owner\'s rwx, group\'s rwx, other\'s rwx, each position either the letter or <code>-</code> for "not granted." So <code>-rwxr-xr--</code> means: a regular file, the owner can read/write/execute it, the group can read/execute but not write, and everyone else can only read it.',
        '<div class="math">-rwxr-xr--<br>│└┬┘└┬┘└┬┘<br>│ │  │  └─ other: r-- (read only)<br>│ │  └──── group: r-x (read + execute, no write)<br>│ └─────── owner: rwx (read + write + execute)<br>└───────── type: - (regular file)<span class="mnote">Same nine bits, always in this exact order: owner, then group, then other. Memorize the order once and every ls -l line becomes instantly readable.</span></div>'
      ]
    },
    {
      h: 'chmod: changing permissions, two ways',
      p: [
        '<code>chmod</code> changes permissions, and it accepts two completely different but equally valid notations. <b>Symbolic</b> mode reads almost like English: <code>chmod u+x script.sh</code> means "for the (u)ser/owner, add the e(x)ecute permission" — <code>u</code>/<code>g</code>/<code>o</code>/<code>a</code> (user, group, other, all) combined with <code>+</code>/<code>-</code>/<code>=</code> (add, remove, set exactly) and the permission letters. <code>chmod g-w file</code> removes write from the group. <code>chmod a+r file</code> makes it readable by everyone.',
        '<b>Numeric (octal)</b> mode represents each category\'s three permissions as one digit, 0–7, by treating r/w/x as bit values 4/2/1 and summing whichever are granted: <code>rwx</code> = 4+2+1 = 7, <code>r-x</code> = 4+0+1 = 5, <code>r--</code> = 4+0+0 = 4, nothing = 0. Three digits, one per category, in the same owner-group-other order: <code>chmod 755 script.sh</code> sets owner=7 (rwx), group=5 (r-x), other=5 (r-x) — a very common pattern for a script you want to run yourself and let others read/execute but not modify. <code>chmod 644 file</code> (owner rw, group r, other r) is the equally common pattern for an ordinary non-executable file. Both notations do the exact same thing underneath; numeric is faster once it\'s memorized, symbolic is easier to reason about for a single specific change.'
      ]
    },
    {
      h: 'Ownership: owner, group, and chown/chgrp',
      p: [
        'Permissions decide WHAT a category can do; ownership decides WHO belongs to the owner and group categories for a given file. Every file has exactly one owning user and exactly one owning group, visible as the third and fourth columns of <code>ls -l</code>. <code>chown newowner file</code> changes the owner (usually requires root/sudo, Part 2, since you generally can\'t give away files you own to someone else without permission from the system); <code>chown newowner:newgroup file</code> changes both owner and group in one command; <code>chgrp newgroup file</code> changes just the group.',
        'A user can belong to MULTIPLE groups simultaneously (Part 2\'s users-groups-sudo lesson covers exactly how), but a given FILE has only one owning group at a time — the group category on that file checks membership against that one group specifically, not against every group the requesting user happens to belong to elsewhere.'
      ]
    },
    {
      h: 'umask and the special bits',
      p: [
        'You\'ve probably noticed new files you create are never executable by default, even though you didn\'t explicitly remove execute permission — that\'s <code>umask</code>, a per-session mask that subtracts permissions from a maximum default whenever something new is created. The typical default umask (022) results in new FILES getting 644 (rw-r--r--, no execute — deliberately, since making every new file automatically executable would be a genuine security liability) and new DIRECTORIES getting 755 (rwxr-xr-x — directories need execute permission just to be enterable at all, per the concept above).',
        'Three special bits go beyond the basic rwx model, visible as unusual characters replacing the normal x position in ls -l: <b>setuid</b> (<code>s</code> in the owner\'s x position) makes a program run with the FILE OWNER\'s privileges rather than the invoking user\'s — the classic legitimate use is <code>passwd</code>, which needs root privilege to edit the system password file even when an ordinary user runs it. <b>setgid</b> (<code>s</code> in the group\'s x position) on a directory makes new files created inside automatically inherit that directory\'s group, instead of the creating user\'s default group — genuinely useful for shared team directories. The <b>sticky bit</b> (<code>t</code> in other\'s x position), seen on <code>/tmp</code> itself, restricts deletion inside a world-writable directory so that only a file\'s OWNER (or root) can delete or rename it — without it, anyone could delete anyone else\'s files in a shared temp directory.'
      ]
    }
  ],
  conceptFlow: {
    title: 'Can this user actually open this file? The permission check, step by step',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'The attempt',
        nodes: [
          { id: 'attempt', text: 'nami tries to read\n/etc/shadow-ish-file.txt' }
        ]
      },
      {
        label: 'Who is nami, relative to this file?',
        nodes: [
          { id: 'isowner', text: 'Is nami the owner?\ncheck the file\'s owner field' },
          { id: 'isgroup', text: 'Is nami in the owning group?\ncheck group membership' },
          { id: 'isother', text: 'Neither\nfalls through to "other"' }
        ]
      },
      {
        label: 'Which permission bits apply',
        nodes: [
          { id: 'ownerbits', text: 'Use OWNER\'s r/w/x bits\nonly these three matter now' },
          { id: 'groupbits', text: 'Use GROUP\'s r/w/x bits\nonly these three matter now' },
          { id: 'otherbits', text: 'Use OTHER\'s r/w/x bits\nonly these three matter now' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'allowed', text: 'Read bit set?\nAllowed' },
          { id: 'denied', text: 'Read bit not set?\nPermission denied' }
        ]
      }
    ],
    steps: [
      { active: ['attempt'], note: 'nami runs a command that tries to read a file. The kernel has to decide: allowed, or not?' },
      { active: ['isowner'], note: 'First check: is nami literally the file\'s owner? This is a simple field comparison — the file records exactly one owning user.' },
      { active: ['isgroup'], note: 'If not the owner, next check: is nami a member of the file\'s owning group? Not "does nami belong to SOME group" — specifically THIS file\'s one owning group.' },
      { active: ['isother'], note: 'If neither the owner nor in the owning group, nami falls into the "other" category by elimination — no further checks needed.' },
      { active: ['ownerbits'], note: 'Whichever category matched, the kernel now looks at ONLY that category\'s three bits — if nami is the owner, group and other bits are completely irrelevant to this decision, even if they\'d be more permissive.' },
      { active: ['allowed'], note: 'Within the matched category, the kernel checks the specific permission being requested — read, in this case. If that bit is set, the operation proceeds.' },
      { active: ['denied'], note: 'If that bit isn\'t set, the kernel returns "Permission denied" — immediately, with no partial access, no matter how permissive the OTHER two categories might be.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Nami\'s treasury has three keys and one very specific rule',
      text: 'Nami\'s treasury room has exactly one rule, and it trips up every new crew member exactly once: your access depends on WHICH of three categories you fall into, and only that category\'s rules apply to you — no mixing, no "well I\'m close to the captain so surely." Category one: Nami herself, the room\'s owner — she can look inside, add treasure, AND rearrange the whole layout, all three freely. Category two: officers she\'s explicitly designated as trusted (the "group") — Zoro and Sanji, say — who can look inside and even take an approved withdrawal, but are flatly not allowed to rearrange her system, because write-to-structure and write-to-contents are treated as genuinely different permissions in her mind. Category three: everyone else on the crew, including Luffy — who gets a look-but-don\'t-touch allowance, read-only, full stop, no exceptions for being captain. Here\'s the part that actually confuses new recruits: Luffy tries reasoning "I\'m the captain, officer rules should obviously apply to me too" — and it doesn\'t work that way at all. The room doesn\'t ask "how important is this person overall" — it asks exactly one question, "which ONE of these three categories does this specific person fall into for THIS specific room," and then applies ONLY that category\'s three rules, completely ignoring how generous the other categories happen to be. Being captain doesn\'t stack with being in the "officer" category if you\'re not actually IN it for this particular room.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s spot has exactly one owner, and the couch has three tiers',
      text: 'Sheldon\'s living room runs on a permission system as rigid as anything on a Linux filesystem, and it maps disturbingly well. Sheldon\'s bedroom: he owns it outright, full read/write/execute — his stuff, his rules, no negotiation. "Sheldon\'s spot" on the couch: he\'s the sole owner of that exact cushion, and the enforcement is absolute, but notice it\'s scoped to exactly that spot — Sheldon doesn\'t own the WHOLE couch, just that one file within it. Leonard and the rest of the regular friend group form something very like a "group" — they get read access to the apartment freely (they can be there, use the (non-Sheldon) furniture, exist in the space) but conspicuously do NOT get write access to modify Sheldon\'s systems (his labeled shelves, his whiteboard, his temperature settings) without explicit, individually-granted permission. And then there\'s "other" — a stranger, a first-time guest, a delivery person — who gets essentially nothing: don\'t sit on the couch\'s good spots, don\'t touch anything, minimal read-only tolerance at best. The reveal that actually matters: when Penny, who\'s clearly IN the friend group (in the "group" category), once tries to physically rearrange Sheldon\'s bedroom shelving (attempting a WRITE where she only has READ, in a category — his bedroom — where she isn\'t even in his "group," she\'s "other"), his reaction isn\'t random pedantry. It\'s a permission-denied error, correctly enforced, exactly as designed.'
    },
    why: 'Owner, group, other — three categories, and a given person falls into exactly ONE of them for any specific file, no stacking, no "but I\'m important overall." The kernel doesn\'t ask how trusted you are in general; it asks which single category applies here, then enforces only that category\'s three switches.'
  },
  tech: [
    {
      q: 'Why does a directory need the execute bit just to be entered with cd — that seems unrelated to "executing" anything?',
      a: 'It\'s not unrelated once you know what execute actually means for a directory specifically: it grants permission to access entries INSIDE it by name — to resolve a path that continues through this directory, or to cd into it. Read permission on a directory, separately, only grants the ability to LIST what\'s inside (ls) — notice these are genuinely independent: a directory with read but no execute lets you see filenames exist inside it but not actually open or enter any of them; a directory with execute but no read lets you access a file inside it IF you already know its exact name, but you can\'t list what\'s there to discover names you don\'t already know. This read-vs-execute split on directories specifically (rather than read alone covering both) is a frequent source of "why can I see the filename in a listing from elsewhere but still get denied" confusion — now resolved.'
    },
    {
      q: 'If umask defaults to 022 and the maximum for a new file is 666, why do new files end up 644, not 666 minus 022 = 644... wait, is that subtraction or something else?',
      a: 'It looks like subtraction and gives the right answer here, but the real mechanism is bitwise: umask is APPLIED AS A MASK that clears (removes) whichever bits are set in it from the maximum default, not decimal subtraction — they happen to agree for 022 specifically because none of its bits overlap awkwardly, but don\'t rely on treating it as arithmetic in general. The real rule: files start from a maximum of 666 (rw-rw-rw-, deliberately never including execute by default — a new file being automatically runnable would be a real security footgun), directories start from a maximum of 777 (since they need execute to be usable at all, per the concept section), and umask\'s bits are cleared out of that maximum, category by category, bit by bit. A umask of 022 clears the "write" bit for group and other, landing files at 644 and directories at 755 — the extremely common defaults you\'ll see on almost every system.'
    },
    {
      q: 'Is setuid on an executable a security risk? Why does passwd get away with it?',
      a: 'Yes, genuinely — setuid is one of the more dangerous permission bits to hand out casually, because it means the program runs with the FILE OWNER\'s privileges (often root) regardless of who invoked it, which is exactly the kind of privilege escalation an attacker would love to find on a poorly-audited binary. passwd gets away with it because it\'s narrowly scoped and carefully audited: an ordinary user genuinely needs SOME way to update their own entry in the system-wide, root-owned password file, and passwd is a small, purpose-built, heavily-scrutinized program that only performs that one specific, validated operation — it doesn\'t hand the user a general-purpose root shell, just root-level access to do exactly one narrow, checked thing. Finding an UNEXPECTED setuid binary on a system (especially one you didn\'t put there) is a genuine, standard red flag in a security audit, not a curiosity.'
    }
  ],
  code: {
    title: 'Reading and changing real permissions',
    intro: 'Try every line of this in a scratch directory.',
    code: `$ touch script.sh notes.txt
$ ls -l
-rw-r--r-- 1 nami crew   0 Jul 16 10:02 notes.txt
-rw-r--r-- 1 nami crew   0 Jul 16 10:02 script.sh
# Both start at 644 (rw-r--r--) — the umask-default for a new file. Neither is executable yet.

$ chmod u+x script.sh
$ ls -l script.sh
-rwxr--r-- 1 nami crew   0 Jul 16 10:02 script.sh
# Symbolic mode: "for the owner, add execute." Only the owner's bits changed.

$ chmod 755 script.sh
$ ls -l script.sh
-rwxr-xr-x 1 nami crew   0 Jul 16 10:02 script.sh
# Numeric mode, same idea: 7=rwx (owner), 5=r-x (group), 5=r-x (other).

$ ./script.sh
zsh: permission denied: ./script.sh
# (if the file is actually empty/not a real script — but permission-wise it now CAN run)

$ chmod 600 notes.txt
$ ls -l notes.txt
-rw------- 1 nami crew   0 Jul 16 10:02 notes.txt
# Owner-only read/write. Neither group nor other can touch it — a common pattern
# for private keys and sensitive config, which Part 5's SSH lesson enforces strictly.

$ chown nami:crew notes.txt
# (already correct here — showing the syntax: chown owner:group file)

$ umask
0022
# The mask currently in effect for this shell session.`,
    notes: [
      'Try creating a file and a directory back to back — <code>touch f && mkdir d && ls -l</code> — and confirm f lands at 644 while d lands at 755, exactly as the umask math predicts.',
      'Part 5 (SSH) will make you set a private key to exactly 600 or the ssh client will flatly refuse to use it — this lesson is why that requirement exists and what it\'s protecting against.'
    ]
  },
  lab: {
    title: 'Decode and write permissions',
    prompt: 'Two parts. First, decode the permission strings on lines 2-4 into their numeric (octal) equivalent. Second, write the chmod command for each described task.',
    starter: `# Part 1 — decode to numeric (e.g. rwxr-xr-x = 755)
# rw-r--r--  ->
# rwx------  ->
# rw-rw-r--  ->

# Part 2 — write the command
# Task: make deploy.sh executable by the owner only (don't change group/other).


# Task: set private_key.pem to owner read+write only, nothing for group or other, using numeric mode.

`,
    checks: [
      { re: 'rw-r--r--\\s*->\\s*644', flags: 'i', must: true, hint: 'rw-r--r-- decodes to 644 (owner rw=6, group r=4, other r=4).', pass: 'rw-r--r-- → 644 ✓' },
      { re: 'rwx------\\s*->\\s*700', flags: 'i', must: true, hint: 'rwx------ decodes to 700 (owner rwx=7, group and other nothing=0).', pass: 'rwx------ → 700 ✓' },
      { re: 'rw-rw-r--\\s*->\\s*664', flags: 'i', must: true, hint: 'rw-rw-r-- decodes to 664 (owner rw=6, group rw=6, other r=4).', pass: 'rw-rw-r-- → 664 ✓' },
      { re: 'chmod\\s+u\\+x\\s+deploy\\.sh', flags: 'i', must: true, hint: '"chmod u+x deploy.sh" adds execute for the owner only, leaving group/other untouched.', pass: 'chmod u+x deploy.sh ✓' },
      { re: 'chmod\\s+600\\s+private_key\\.pem', flags: 'i', must: true, hint: '"chmod 600 private_key.pem" sets owner rw (6), group 0, other 0.', pass: 'chmod 600 private_key.pem ✓' }
    ],
    run: 'Try it for real: touch a file, chmod it a few different ways, and confirm each result with ls -l.',
    solution: `# Part 1 — decode to numeric (e.g. rwxr-xr-x = 755)
# rw-r--r--  -> 644
# rwx------  -> 700
# rw-rw-r--  -> 664

# Part 2 — write the command
# Task: make deploy.sh executable by the owner only (don't change group/other).
chmod u+x deploy.sh

# Task: set private_key.pem to owner read+write only, nothing for group or other, using numeric mode.
chmod 600 private_key.pem`,
    notes: [
      'chmod 600 for private keys isn\'t just convention — Part 5\'s SSH lesson shows the ssh client actively refusing to use a key file that\'s more permissive than this.',
      'If the octal decoding felt slow, remember the bit values: r=4, w=2, x=1, and each category is just those three summed.'
    ]
  },
  quiz: [
    {
      q: 'What does the permission string "-rwxr-x---" mean?',
      options: ['Owner: rwx, group: r-x, other: nothing at all', 'Everyone including other has full access', 'This describes a directory, not a file', 'Only the group has any access'],
      correct: 0,
      explain: 'Reading the nine bits in owner/group/other order: owner has rwx (full), group has r-x (read+execute, no write), other has --- (nothing).'
    },
    {
      q: 'chmod 640 sets which permissions?',
      options: ['Owner rwx, group rwx, other rwx', 'Owner rw-, group r--, other ---', 'Owner r--, group rw-, other r--', 'Owner ---, group rw-, other r--'],
      correct: 1,
      explain: '6 = rw- (4+2), 4 = r-- (4 alone), 0 = --- (nothing). So owner=rw-, group=r--, other=---.'
    },
    {
      q: 'Why do new files typically default to 644 while new directories default to 755, given the same umask?',
      options: ['It\'s arbitrary and could just as easily be reversed', 'Directories start from a higher maximum (777 vs 666) because they need execute permission to be usable at all', 'Files are always more restricted for security reasons unrelated to directories', 'umask only applies to files, never to directories'],
      correct: 1,
      explain: 'Files start from a maximum of 666 (deliberately never including execute by default); directories start from 777, since execute is required just to enter/traverse them. The same umask is then applied to each starting maximum.'
    },
    {
      q: 'A user is in the file\'s owning group but is NOT the file\'s owner. Which permission bits apply to them?',
      options: ['The owner\'s bits, since they\'re trusted', 'The group\'s bits only — owner and other bits are irrelevant to this check', 'The most permissive of all three categories', 'Access is always denied unless they\'re the owner'],
      correct: 1,
      explain: 'The kernel determines which ONE category applies (owner, then group, then other, in that order) and checks only that category\'s bits — no mixing or "most permissive wins."'
    },
    {
      q: 'What does the sticky bit on /tmp specifically prevent?',
      options: ['Anyone from creating new files in /tmp', 'A user from deleting or renaming another user\'s files in a shared, world-writable directory', 'Files in /tmp from ever being read by anyone', 'The directory from ever being listed with ls'],
      correct: 1,
      explain: 'The sticky bit restricts deletion/renaming inside a world-writable directory to each file\'s own owner (or root) — without it, /tmp being writable by everyone would let any user delete anyone else\'s temp files.'
    }
  ],
  pitfalls: [
    'Running "chmod 777" on something as a lazy fix for a permission error — it silently grants write access to literally everyone on the system, which is rarely actually what\'s needed and is a real, common security mistake.',
    'Forgetting that a directory needs BOTH read (to list contents) and execute (to enter/traverse) to be fully usable — granting only one produces confusing partial behavior that looks like a bug.',
    'Assuming file permissions alone control everything — root bypasses standard permission checks almost entirely (Part 2 covers exactly why and when), and network filesystems or containers (next course) can layer additional restrictions on top.'
  ],
  interview: [
    {
      q: 'Walk through how the kernel decides whether a specific user can read a specific file.',
      a: 'The kernel first determines which ONE of three categories the requesting user falls into for this file: owner (an exact match against the file\'s recorded owning user), group (membership in the file\'s one owning group, checked only if not the owner), or other (by elimination, if neither). It then examines ONLY that category\'s three permission bits — owner and group bits are completely irrelevant once "other" is determined to apply, even if they\'re more permissive. Within the matched category, it checks the specific bit for the requested operation (read, write, or execute) and allows or denies accordingly. Root, notably, bypasses nearly all of this — a detail Part 2 covers when introducing sudo.'
    },
    {
      q: 'What\'s the difference between chmod 700 and chmod 600 on a file, and when would you use each?',
      a: '700 grants the owner read, write, AND execute, with nothing for group or other — appropriate for something the owner needs to run as a program, like a personal script, while keeping it fully private. 600 grants the owner only read and write, no execute, and nothing for group or other — appropriate for data that should never be executed, like a private SSH key or a config file containing secrets; ssh itself actively enforces something at least this strict on private key files and refuses to use ones that are more permissive.'
    },
    {
      q: 'Explain umask: what problem does it solve, and what does a value of 022 actually do?',
      a: 'umask solves the problem of needing sensible DEFAULT permissions on newly created files and directories without every single program having to know and apply the "right" defaults itself. It works by starting from a maximum (666 for files, 777 for directories) and clearing out whichever permission bits are set in the umask value. A umask of 022 clears the write bit for group and other from that maximum, resulting in new files landing at 644 and new directories at 755 — new content is readable by everyone but only writable by its owner, a sensible default that avoids accidentally making things world-writable.'
    },
    {
      q: 'What is setuid, what legitimate purpose does it serve, and why is it also a security concern?',
      a: 'Setuid, when set on an executable, makes the program run with the privileges of the file\'s OWNER rather than the invoking user\'s own privileges. Its classic legitimate use is a narrowly-scoped tool like passwd, which needs root-level access to modify the system-wide password file even when an ordinary user runs it — without setuid, users would have no way to update their own password entry at all. It\'s a security concern because it\'s a genuine privilege-escalation mechanism: any setuid-root binary with a bug or an unintended capability effectively hands attackers root access through it, which is why unexpected or unaudited setuid binaries are a standard, serious finding in any security review.'
    }
  ]
};
