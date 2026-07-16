window.LESSONS = window.LESSONS || {};
window.LESSONS['filesystem-hierarchy'] = {
  id: 'filesystem-hierarchy',
  title: 'The Filesystem Hierarchy: /, /home, /etc, /var, /usr, /tmp — and Why',
  category: 'Part 1 — Filesystem & Files',
  timeMin: 35,
  summary: 'Every Linux system, no matter the distro, organizes its files into one single tree starting at / — no drive letters, no separate volumes with their own roots. This lesson maps that tree: which top-level directory holds what, and — more importantly — WHY the split exists, so that when you SSH into an unfamiliar box you already know roughly where to look for anything.',
  goals: [
    'Explain that Linux has exactly one filesystem root (/), with everything else — including other physical disks — mounted somewhere inside that single tree',
    'State the purpose of /home (or /Users on macOS), /etc, /var, /usr, /bin, and /tmp from memory, and explain the organizing principle behind the split',
    'Explain why mixing purposes (like storing logs in a user\'s home directory) causes real, predictable problems',
    'Recognize /proc and /dev as special, non-ordinary directories that expose live kernel state and hardware through the filesystem interface',
    'Read an unfamiliar directory tree and make a confident guess about what belongs in it, based on the same conventions this lesson teaches'
  ],
  concept: [
    {
      h: 'One tree, one root, no drive letters',
      p: [
        'Windows organizes storage as separate lettered volumes — <code>C:\\</code>, <code>D:\\</code> — each with its own independent root. Linux (like all Unix systems) does something structurally different: there is exactly <b>one</b> root directory, written <code>/</code>, and absolutely everything else — every file, every directory, and even OTHER physical disks or network drives — gets attached ("mounted") somewhere <i>inside</i> that single tree. Plug in a USB drive on a typical Linux desktop and it doesn\'t become "E:\\" — it appears as a new directory somewhere like <code>/media/usbdrive</code>, and once mounted, walking into that directory feels completely seamless; you can\'t tell from the path alone that you crossed onto different physical hardware.',
        'This single-root design is why absolute paths (paths starting with <code>/</code>) work identically no matter which physical device actually stores the data — <code>/home/nami/logbook.txt</code> means the same thing conceptually whether that file lives on the boot disk or a mounted network share. It\'s also directly relevant to where this course is headed: a Docker container\'s filesystem (next course) is built on exactly this same mount mechanism — a container "mounting" a volume into its own tree is the identical idea you\'re about to learn here, just automated.'
      ]
    },
    {
      h: 'The top-level map: what\'s where, and why it\'s split that way',
      p: [
        'The organizing principle behind almost every top-level directory is <b>separating things by what kind of thing they are and how often they change</b> — not by which app happens to use them. Once that clicks, the whole layout stops looking arbitrary:',
        '<ul><li><code>/home</code> (macOS: <code>/Users</code>) — one subdirectory per human user, holding THEIR personal files, and nothing else. Your files here are yours; the system doesn\'t depend on anything inside <code>/home</code> to keep running.</li><li><code>/etc</code> — system-wide <b>configuration</b>. Text files that define how services and programs on this machine are set up (network settings, which users exist, how SSH behaves). Almost everything in <code>/etc</code> is meant to be hand-edited by an administrator, rarely by a running program.</li><li><code>/var</code> — <b>variable</b> data: files that change constantly while the system runs. Logs (<code>/var/log</code>, which Part 2 and Part 3 both use directly), mail queues, caches, databases-in-progress. If a directory\'s contents grow every single day just from normal operation, it almost certainly belongs under <code>/var</code>.</li><li><code>/usr</code> — the bulk of installed <b>programs and their supporting files</b>, shared by every user on the system (not "user" despite the name — it\'s a historical holdover). <code>/usr/bin</code> holds the vast majority of commands you\'ll ever run.</li><li><code>/bin</code>, <code>/sbin</code> — a small set of essential programs needed even in a minimal boot environment (historically kept separate from <code>/usr/bin</code> so the system could still function if <code>/usr</code> wasn\'t mounted yet — the tech corner below covers how that\'s changed).</li><li><code>/tmp</code> — genuinely temporary files. Anyone can usually write here, and on many systems everything in <code>/tmp</code> is wiped on reboot. Never store anything here you\'d be upset to lose.</li></ul>'
      ]
    },
    {
      h: 'Why the split actually matters (not just trivia)',
      p: [
        'This isn\'t just naming convention for its own sake — the split has real operational consequences you\'ll run into constantly once you\'re managing real machines. Backup strategy differs by directory: you back up <code>/home</code> and <code>/etc</code> religiously (irreplaceable personal data and hand-tuned configuration) but rarely bother backing up <code>/tmp</code> or most of <code>/var/cache</code> (regeneratable by definition). Disk space problems concentrate predictably in <code>/var</code> (runaway logs are a classic way to fill a server\'s disk — Part 2\'s process lesson and Part 7\'s systemd lesson both come back to this) rather than in <code>/etc</code>, which stays tiny forever. Permissions default differently too: <code>/etc</code> configuration is typically only writable by root (Part 1\'s permissions lesson, next), while <code>/tmp</code> is deliberately writable by everyone.',
        'The practical payoff, and the actual point of this lesson: once you know the CONVENTION, you can SSH into a Linux box you\'ve never touched before and immediately have a confident guess where to look — "where are this app\'s logs" → check <code>/var/log</code> first; "where\'s this service configured" → check <code>/etc</code> first — instead of hunting blind. That confident-guess instinct is worth more than memorizing every directory name; the next lesson builds the actual navigation skills to go find things once you know roughly where to look.'
      ]
    },
    {
      h: '/proc and /dev — the filesystem lying to you on purpose (in a good way)',
      p: [
        'Two directories break the "these are files on a disk" mental model entirely, on purpose, because of the "everything is a file" idea from the previous lesson. <code>/dev</code> contains entries representing hardware devices — <code>/dev/sda</code> for a disk, for instance — that you can often interact with using completely ordinary file tools, even though there\'s no actual disk block storing "the file <code>/dev/sda</code>." <code>/proc</code> is even stranger: it\'s a <b>virtual</b> filesystem generated live, on the fly, by the kernel — <code>cat /proc/cpuinfo</code> doesn\'t read a file that was sitting on disk; it asks the kernel to generate a fresh text description of your CPUs, right now, and hand it back through the exact same <code>cat</code> command you\'d use to read a shopping list.',
        'Part 2\'s processes lesson uses <code>/proc</code> directly (every running process gets a numbered directory, <code>/proc/1234</code>, describing it live) — this is your first look at a pattern that recurs constantly in Linux: reuse the same simple file interface for wildly different kinds of information, rather than inventing a new access method for every new kind of thing.'
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials above are enough to navigate confidently. Here\'s the fuller standard, plus a few more directories worth recognizing by sight.',
    sections: [
      {
        h: 'The FHS — this isn\'t informal convention, it\'s a written standard',
        p: [
          'This layout has a name: the <b>Filesystem Hierarchy Standard (FHS)</b>, maintained by the Linux Foundation, which is why it\'s so consistent across wildly different distros. A few more directories worth recognizing: <code>/root</code> — root the USER\'s home directory (deliberately NOT inside /home, so root\'s files stay accessible even if /home is a separate unmounted disk); <code>/opt</code> — "optional" self-contained third-party software that doesn\'t fit the /usr convention, often big commercial packages that ship their own complete directory tree; <code>/srv</code> — data served by this machine (a web server\'s files, for instance) — rarely used strictly in practice, but you\'ll see it; <code>/boot</code> — the kernel image and bootloader files needed before the rest of the system is even available; <code>/mnt</code> and <code>/media</code> — conventional (not enforced) mount points, /mnt for something an admin mounted temporarily by hand, /media for removable devices like USB drives, auto-mounted by the desktop environment.'
        ]
      },
      {
        h: 'The historical /bin-vs-/usr/bin split, and why it\'s fading',
        p: [
          'Decades ago, /usr was sometimes a genuinely SEPARATE disk from the root filesystem — occasionally not even mounted yet during early boot. /bin and /sbin held the minimal set of tools needed to boot and repair a system even if /usr never became available at all; /usr/bin held everything else. Modern systems have largely abandoned that constraint (disks are cheap, boot processes are more robust), and most current distros implement "usr-merge": /bin is now literally a symlink to /usr/bin, so the split is preserved for compatibility (both paths still work) but is no longer functionally meaningful. Knowing this history explains why you\'ll see near-identical content in both places on any modern box, and why old documentation sometimes insists on a distinction current systems don\'t enforce anymore.'
        ]
      },
      {
        h: 'Where macOS genuinely diverges',
        p: [
          'macOS follows a DIFFERENT, Apple-specific top-level layout that only partially overlaps the Linux FHS — you\'ll see /Users instead of /home, an /Applications directory that has no real Linux equivalent, and a much more locked-down /System since recent macOS versions add a read-only system volume for security. The practical upshot for this course: your Mac Terminal is a great place to practice shell mechanics (Part 0), but Part 1\'s directory-hierarchy assumptions specifically are about real Linux systems — the boxes you\'ll actually SSH into in Part 5 — not your Mac\'s own root filesystem.'
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: 'One hull, every hold has exactly one job',
      text: 'The Thousand Sunny isn\'t a loose flotilla of separate rafts lashed together — it\'s ONE hull, and every single space inside that hull answers to it. But Franky didn\'t just carve out random storage — every hold has exactly one declared purpose, and the crew enforces it ruthlessly, because mixing purposes has bitten them before. Personal lockers below deck (each crewmate\'s own space, their books, their private effects) is everyone\'s own business and nobody else\'s — that\'s /home, one subdirectory per person, and the ship doesn\'t depend on any of it to keep sailing. The captain\'s quarters holds the ship\'s STANDING ORDERS — the posted rules for who watches what, how the sails get rigged, what the sail-plan is today — hand-edited by whoever\'s in charge, rarely touched by anyone mid-voyage: that\'s /etc, configuration, not data. The galley\'s daily-use stores — the stuff that gets consumed and restocked constantly, that would be a genuine problem if it silently overflowed — that\'s /var, and Sanji watches it precisely because uncontrolled growth there is a real, recurring danger (a logbook nobody prunes fills the same way spoiled stores pile up). The armory holds standard-issue tools every crew member can grab and use, shared by the whole crew, not personal property — /usr/bin. And there\'s always ONE bucket by the mast for genuinely temporary junk — a torn sail scrap, a used bandage — that nobody expects to survive past the next port, gets tossed on arrival, no ceremony: /tmp. Robin once pointed out the real lesson to a new recruit staring in confusion at the layout: it\'s not random, and it\'s not really about the Sunny specifically — every properly run ship in the world organizes below-decks the same way, which is exactly why an experienced sailor can step onto ANY unfamiliar ship and already have a solid guess where the standing orders are kept.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s apartment has exactly one correct spot for everything',
      text: 'Sheldon\'s apartment is organized with a rigor that looks, to a first-time visitor, like pure obsession — but it isn\'t random at all, and once you understand the RULE, the whole system stops looking crazy and starts looking exactly like the filesystem hierarchy you just read about. His own bedroom, his own private effects — nobody else\'s business, and the shared living room doesn\'t depend on anything in there to function: that\'s /home. The whiteboard by the door, and the laminated Roommate Agreement — the posted, hand-maintained RULES for how the apartment runs, rarely changed, never touched by accident: that\'s /etc, configuration, not the stuff of daily living. The refrigerator and the pantry — contents that get consumed and restocked constantly, and which Sheldon monitors with genuine vigilance because unmanaged growth (three-week-old Chinese food) is a real, recurring problem, exactly like an unwatched log directory filling a disk: that\'s /var. The shared bookshelf of comics and games anyone in the friend group can use — not personal property, common tools available to everyone — that\'s /usr/bin. And there\'s always one designated junk drawer for genuinely temporary stuff nobody expects to matter next week — that\'s /tmp, and notably, it\'s the ONE drawer Sheldon doesn\'t obsessively police, because by definition nothing in there is supposed to be precious. When Penny once filed her spare key in the "wrong" drawer, Sheldon\'s reaction wasn\'t random pedantry — in his mind, she\'d put a config file in /tmp, and now nobody, including her, could reliably find it again.'
    },
    why: 'Personal stuff, posted rules, growing stuff, shared tools, disposable junk — five categories, five predictable homes, one single structure underneath it all. Learn the categories, not the specific names, and any unfamiliar Linux box (or apartment) stops being a maze.'
  },
  storyAnim: {
    title: 'One hull, five holds, each with exactly one job',
    h: 260,
    props: [
      { id: 'root', emoji: '🚢', label: 'The Thousand Sunny (the single root: /)', x: 50, y: 12 },
      { id: 'home', emoji: '🛏️', label: 'Personal lockers (/home)', x: 12, y: 55 },
      { id: 'etc', emoji: '📋', label: 'Standing orders (/etc)', x: 32, y: 78 },
      { id: 'var', emoji: '🍲', label: 'Daily-use stores (/var)', x: 55, y: 78 },
      { id: 'usr', emoji: '🧰', label: 'Shared armory (/usr, /bin)', x: 76, y: 55 },
      { id: 'tmp', emoji: '🗑️', label: 'The junk bucket (/tmp)', x: 90, y: 78 }
    ],
    actors: [
      { id: 'robin', emoji: '📖', label: 'Robin', x: 50, y: 34 }
    ],
    steps: [
      { c: 'One hull. Everything below decks answers to this single ship — no separate rafts with their own rules.', p: { root: 'good' } },
      { c: 'Personal lockers — everyone\'s own business, and the ship doesn\'t depend on any of it to keep sailing.', a: { robin: [12, 45] }, p: { home: 'lit' } },
      { c: 'The captain\'s standing orders — posted rules, hand-edited by whoever\'s in charge, rarely touched mid-voyage.', a: { robin: [32, 62] }, p: { etc: 'lit' } },
      { c: 'The galley\'s daily stores — consumed and restocked constantly. Sanji watches this hold precisely because unmanaged growth here is a real, recurring danger.', a: { robin: [55, 62] }, p: { var: 'lit' } },
      { c: 'The armory — standard tools any crew member can grab, shared by everyone, nobody\'s personal property.', a: { robin: [76, 45] }, p: { usr: 'lit' } },
      { c: 'And one bucket by the mast for genuinely temporary junk — tossed on arrival, no ceremony expected.', a: { robin: [90, 62] }, p: { tmp: 'lit' } },
      { c: 'Not random, and not really about THIS ship specifically — every well-run vessel organizes below-decks the same way, which is why a sailor can step onto any unfamiliar ship and already guess where the standing orders live.', p: { root: 'good', home: 'good', etc: 'good', var: 'good', usr: 'good', tmp: 'good' } }
    ]
  },
  tech: [
    {
      q: 'Why does macOS use /Users instead of Linux\'s /home?',
      a: 'Pure historical naming divergence, not a deep technical difference — macOS descends from NeXTSTEP\'s conventions rather than traditional Unix ones, and Apple simply chose /Users. The PURPOSE is identical: one subdirectory per human user, holding their personal files. This is a good example of the difference between "Unix-family conventions" (which macOS mostly follows) and "the exact Linux FHS" (which macOS does not fully follow) — a distinction worth being precise about, since this lesson\'s directory map describes real Linux systems specifically, the boxes you\'ll actually SSH into.'
    },
    {
      q: 'Is /bin actually different from /usr/bin on a modern system, or is that just history?',
      a: 'On most modern distros, mostly just history now. The original split existed because /usr was sometimes a separate disk that might not be mounted during very early boot, so /bin and /sbin held the bare minimum needed to boot and repair a system without /usr at all. Modern boot processes rarely have that constraint, and most current distros have done a "usr-merge": /bin is now literally a symbolic link to /usr/bin (same for /sbin → /usr/sbin), so both paths resolve to the same files. The distinction survives in documentation and muscle memory far more than in actual current behavior.'
    },
    {
      q: 'If /proc is generated live by the kernel, what happens if I try to write to a file in there?',
      a: 'Depends entirely on the specific file — this is one of /proc\'s more powerful and more dangerous properties. Many files under /proc are read-only windows into kernel state (like /proc/cpuinfo). But some ARE writable, and writing to them genuinely changes live kernel behavior in real time — for instance, some values under /proc/sys can tune networking or memory behavior on the spot, no reboot required. This is a preview of something worth real respect once you\'re operating real servers: /proc isn\'t just a read-only report, in specific documented spots it\'s a live control panel, and blind experimentation there is a legitimate way to destabilize a running system.'
    }
  ],
  code: {
    title: 'Walking the top of the tree for real',
    intro: 'Run this on an actual Linux machine if you have SSH access already (Part 5 sets one up if not) — macOS\'s root will look different, per the tech corner above.',
    code: `$ ls /
bin  boot  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  tmp  usr  var

$ ls /home
nami  robin  zoro
# One directory per user. This box has three human accounts.

$ ls /etc | head -5
apt          hostname     hosts        passwd       ssh
# Configuration files and directories — no user data in sight.

$ ls -la /var/log | head -3
drwxr-xr-x  12 root root  4096 Jul 16 08:00 .
-rw-r-----   1 root adm  48213 Jul 16 09:12 auth.log
-rw-r-----   1 root adm 102944 Jul 16 09:12 syslog
# /var/log — exactly where you'd guess system logs live, once you know the convention.

$ cat /proc/cpuinfo | head -5
processor   : 0
vendor_id   : GenuineIntel
model name  : Intel(R) Xeon(R) Platinum...
# No disk file was "read" here — the kernel generated this text on the spot.

$ df -h /
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        40G   12G   26G  32% /
# "Mounted on /" — proof that even the disk itself is just something attached
# into the one single tree, at the root.`,
    notes: [
      '<code>df -h /</code> is worth remembering on its own — it tells you disk usage for whichever mounted filesystem contains the path you give it, and running low on / is one of the most common real production incidents.',
      'Notice /etc had NO subdirectories that looked like user data, and /home had NOTHING that looked like configuration — the separation isn\'t just naming, it\'s enforced by convention everywhere you look.'
    ]
  },
  lab: {
    title: 'Match the directory to its job',
    prompt: 'For each top-level directory, write its ONE-WORD category on the line below it: <code>personal</code>, <code>config</code>, <code>variable</code>, <code>shared</code>, or <code>temporary</code>. The first is done for you.',
    starter: `# /home (or /Users on macOS)
personal

# /etc


# /var/log


# /usr/bin


# /tmp

`,
    checks: [
      { re: '#\\s*/etc\\s*\\n\\s*config', flags: 'i', must: true, hint: '/etc holds system-wide configuration — write "config".', pass: '/etc → config ✓' },
      { re: '#\\s*/var/log\\s*\\n\\s*variable', flags: 'i', must: true, hint: '/var/log grows constantly during normal operation — write "variable".', pass: '/var/log → variable ✓' },
      { re: '#\\s*/usr/bin\\s*\\n\\s*shared', flags: 'i', must: true, hint: '/usr/bin holds programs shared by every user on the system — write "shared".', pass: '/usr/bin → shared ✓' },
      { re: '#\\s*/tmp\\s*\\n\\s*temporary', flags: 'i', must: true, hint: '/tmp holds genuinely disposable files — write "temporary".', pass: '/tmp → temporary ✓' }
    ],
    run: 'Then, for real: SSH into any Linux box (or just run these locally if you have one) and try "ls /", "ls /etc | head", and "ls -la /var/log | head" to see the real thing.',
    solution: `# /home (or /Users on macOS)
personal

# /etc
config

# /var/log
variable

# /usr/bin
shared

# /tmp
temporary`,
    notes: [
      'If you hesitated on any of these, replay the Thousand Sunny animation — five holds, five jobs, one hull.',
      'This exact instinct — "logs are probably under /var, config is probably under /etc" — is what lets you navigate an unfamiliar production box confidently on day one of a new job.'
    ]
  },
  quiz: [
    {
      q: 'How many independent filesystem roots does a typical Linux system have?',
      options: ['One per disk, like Windows drive letters', 'Exactly one — / — with everything else mounted inside it', 'None; Linux has no concept of a root directory', 'It varies by distro, with no standard'],
      correct: 1,
      explain: 'Linux (and Unix generally) uses a single-rooted tree. Other disks, network shares, and removable media all get mounted somewhere inside that one tree rather than becoming separate roots.'
    },
    {
      q: 'A service is logging huge amounts of data and slowly filling up disk space. Which directory should you check first?',
      options: ['/etc', '/home', '/var/log', '/tmp'],
      correct: 2,
      explain: 'Logs live under /var/log by convention, and /var in general is exactly the part of the tree expected to grow during normal operation — the classic place disk space problems concentrate.'
    },
    {
      q: 'Which directory is the correct place for a program\'s hand-edited, system-wide configuration file?',
      options: ['/tmp', '/etc', '/var', '/home'],
      correct: 1,
      explain: '/etc is specifically for configuration — text files an administrator edits to control how a service or the system behaves.'
    },
    {
      q: 'What makes /proc different from an ordinary directory like /etc?',
      options: ['Nothing — it behaves identically to any other directory', 'Its contents are generated live by the kernel on demand, not stored as ordinary files on disk', 'It only exists on macOS', 'It is always empty unless you\'re root'],
      correct: 1,
      explain: '/proc is a virtual filesystem: reading a file like /proc/cpuinfo asks the kernel to generate current information on the spot, through the same familiar file interface tools like cat already know how to use.'
    },
    {
      q: 'Why does the /bin-vs-/usr/bin split matter much less on modern systems than it used to?',
      options: ['/bin was removed entirely from modern Linux', 'Most modern distros symlink /bin to /usr/bin ("usr-merge"), since the original reason for keeping them separate (booting without /usr mounted) rarely applies anymore', 'Only Windows ever had this split', 'The split never existed — this is a myth'],
      correct: 1,
      explain: 'Modern distros have largely merged the two via a symlink, preserving both paths for compatibility while removing the functional distinction that originally motivated the split.'
    }
  ],
  pitfalls: [
    'Storing application data or logs directly under a user\'s /home directory "because it was convenient" — it works until backup/restore, permissions, or disk-quota tooling built around the FHS convention silently doesn\'t account for it.',
    'Assuming macOS\'s root directory layout matches Linux\'s exactly — /Users vs /home is the visible tip of real, if usually small, differences.',
    'Writing to files under /proc or /sys out of curiosity on a system you care about — some of them are live, writable kernel controls, not passive read-only reports.'
  ],
  interview: [
    {
      q: 'Explain the difference between /etc, /var, and /home, and why the split exists.',
      a: '/etc holds system-wide configuration — text files an administrator edits to control how services and the OS behave, and which change rarely. /var holds variable data that changes constantly during normal operation: logs, caches, spool files. /home holds personal user data, one subdirectory per user. The split exists because these three categories have genuinely different operational properties — backup priority, expected growth rate, typical write permissions, and disaster-recovery importance all differ by category, and separating them lets tooling (backups, monitoring, disk quotas) treat each category appropriately instead of treating the whole disk as one undifferentiated blob.'
    },
    {
      q: 'A production server is running out of disk space. Where do you look first, and why?',
      a: '/var/log first, since runaway or unrotated logs are the single most common cause of a Linux server unexpectedly filling its disk — a service logging at debug verbosity, or a log rotation job that silently stopped working, can consume gigabytes over weeks without anyone noticing until the disk is full. "df -h" shows overall usage per mounted filesystem; "du -sh /var/log/*" (Part 1\'s navigating-files lesson covers du) narrows down which specific log is the culprit. Only after checking /var would I look at /tmp (accumulated temp files) and finally /home (unlikely on a server, more likely on a shared workstation).'
    },
    {
      q: 'What does "Linux has a single-rooted filesystem" actually mean, and how is it different from Windows?',
      a: 'It means there is exactly one top-level directory, /, and every other storage device — additional disks, network shares, USB drives — gets attached ("mounted") at some path inside that one tree, rather than becoming an independent root of its own. Windows instead assigns each storage volume its own letter and its own separate root (C:\\, D:\\), so a path\'s meaning depends on which drive letter it starts with. On Linux, an absolute path\'s meaning is unambiguous and doesn\'t reveal which physical device actually backs it — you genuinely cannot tell from /home/nami/file.txt alone whether that\'s on the boot disk or a mounted network share.'
    },
    {
      q: 'What is /proc, and why is "cat /proc/cpuinfo" possible even though there\'s no such file physically stored on disk?',
      a: '/proc is a virtual (pseudo-) filesystem, generated dynamically by the kernel rather than backed by real files on a disk. When you read a path under /proc, the kernel intercepts that read and generates the content on the spot — for /proc/cpuinfo, that means formatting current, live information about the CPUs into text. This works because Linux\'s "everything is a file" design exposes many kinds of live system state through the same read/write file interface every other tool already understands, which is why an ordinary command like cat can read it with zero special-casing. Part 2 extends this same idea to running processes, each exposed as a live directory under /proc/<pid>.'
    }
  ]
};
