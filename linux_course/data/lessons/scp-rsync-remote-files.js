window.LESSONS = window.LESSONS || {};
window.LESSONS['scp-rsync-remote-files'] = {
  id: 'scp-rsync-remote-files',
  title: 'Moving Files Over SSH: scp, rsync & Why rsync Wins',
  category: 'Part 5 — Networking & SSH',
  timeMin: 35,
  summary: 'SSH gets you a remote shell — scp and rsync are the two standard tools for moving actual files to and from that remote machine, both riding on the same encrypted SSH connection from the last lesson. scp is simple and fine for a one-off. rsync is the tool that actually scales: it transfers only what changed, can resume, and is genuinely the right default for anything beyond copying a single small file exactly once.',
  goals: [
    'Use scp to copy a file or directory to and from a remote server',
    'Explain what makes rsync fundamentally different from scp: transferring only the delta',
    'Use rsync\'s common flags: -a (archive), -v, -z, -P',
    'Explain why a trailing slash on an rsync source path changes the result, and use it correctly',
    'Use --dry-run before a real rsync (especially with --delete) to preview what would happen'
  ],
  concept: [
    {
      h: 'scp: cp, but over SSH',
      p: [
        '<code>scp</code> (secure copy) does exactly what its name suggests — copies files, riding on an encrypted SSH connection, with syntax deliberately close to the local <code>cp</code> command. <code>scp localfile.txt user@host:/remote/path/</code> copies a local file TO a remote server; <code>scp user@host:/remote/file.txt ./</code> copies a remote file back down; <code>scp -r</code> copies an entire directory recursively, exactly like <code>cp -r</code> locally.',
        'scp is genuinely fine for a one-off — grab a single log file off a server, push one config file up. Its real limitation shows up the moment you need to sync something REPEATEDLY, or something LARGE with only a few changes since last time: scp has no concept of "what already matches" — it copies everything requested, in full, every single time, regardless of what might already exist at the destination.'
      ]
    },
    {
      h: 'rsync: transfer only what actually changed',
      p: [
        'rsync solves scp\'s exact limitation: it compares the source and destination FIRST, then transfers only the parts that genuinely differ — for a large directory where only a handful of files changed since the last sync, this can be dramatically faster than a full re-copy, since most of the data does not need to cross the network again at all. This makes rsync the natural tool for anything repeated: deploying updated code to a server, backing up a directory nightly, keeping a local and remote copy of something in sync as it evolves.',
        '<code>rsync -avz source/ user@host:/dest/</code> is the extremely common everyday form: <code>-a</code> (archive mode) recurses into subdirectories AND preserves permissions, timestamps, ownership, and symlinks — not just file content; <code>-v</code> (verbose) shows what is actually being transferred; <code>-z</code> compresses data during transfer, genuinely useful over a slow connection, less useful (even mildly counterproductive) over an already-fast local network.'
      ]
    },
    {
      h: 'Trailing slash: the single most common rsync gotcha',
      p: [
        'A trailing slash on the SOURCE path changes rsync\'s behavior in a way that trips up nearly everyone the first time. <code>rsync -a photos/ dest/</code> (trailing slash on "photos/") copies the CONTENTS of the photos directory directly into dest — dest ends up with the individual files/folders that were INSIDE photos, not a "photos" subfolder itself. <code>rsync -a photos dest/</code> (NO trailing slash) instead copies the photos directory ITSELF into dest — resulting in <code>dest/photos/</code> containing everything, one level of nesting deeper than the first version.',
        'Both are valid, useful in different situations, and produce genuinely different results from what looks like a nearly identical command — the ONLY difference being one trailing character. This is worth internalizing deliberately rather than discovering by accident on a real, consequential sync.'
      ]
    },
    {
      h: '--delete and --dry-run: mirroring exactly, and previewing before you commit',
      p: [
        'By default, rsync only ADDS/UPDATES files at the destination — it never removes anything, even if a file no longer exists at the source. <code>--delete</code> changes that: it makes the destination an exact MIRROR of the source, actively deleting anything at the destination that is not present at the source. This is exactly the right behavior for genuine mirroring (a backup that should reflect deletions too) and exactly the wrong behavior to run carelessly against a destination that might contain files you did not intend to be judged against the source at all.',
        '<code>--dry-run</code> (or the shorthand <code>-n</code>) shows EXACTLY what rsync WOULD do — every file it would transfer, every file it would delete (if <code>--delete</code> is also present) — WITHOUT actually doing any of it. Running <code>rsync -avz --delete --dry-run source/ dest/</code> FIRST, reading the output carefully, and only then re-running the exact same command without <code>--dry-run</code> once it looks correct, is the standard, disciplined habit for anything involving <code>--delete</code> — directly the same "preview before committing to an irreversible action" instinct from sed -i and kill -9 earlier in this course.'
      ]
    }
  ],
  conceptFlow: {
    title: 'Trailing slash: "photos/" vs "photos" as an rsync source',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Two nearly identical commands',
        nodes: [
          { id: 'withslash', text: 'rsync -a photos/ dest/' },
          { id: 'withoutslash', text: 'rsync -a photos dest/' }
        ]
      },
      {
        label: 'What each one means',
        nodes: [
          { id: 'slashmeans', text: 'Trailing slash:\n"copy the CONTENTS of photos"' },
          { id: 'noslashmeans', text: 'No trailing slash:\n"copy the photos DIRECTORY itself"' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'slashresult', text: 'dest/vacation.jpg\ndest/beach.jpg\n(contents landed directly in dest)' },
          { id: 'noslashresult', text: 'dest/photos/vacation.jpg\ndest/photos/beach.jpg\n(one extra level of nesting)' }
        ]
      }
    ],
    steps: [
      { active: ['withslash'], note: 'Same source directory, same destination — the only difference between these two commands is one trailing character.' },
      { active: ['withoutslash'], note: 'This second command looks almost identical, but that missing slash changes the outcome entirely.' },
      { active: ['slashmeans'], note: 'A trailing slash on the SOURCE tells rsync: treat what is INSIDE this directory as the thing being copied, not the directory itself.' },
      { active: ['noslashmeans'], note: 'No trailing slash tells rsync: treat the directory ITSELF as the thing being copied, so it gets created as a new entry inside the destination.' },
      { active: ['slashresult'], note: 'With the trailing slash, photos\' individual contents land directly inside dest — no "photos" folder appears in dest at all.' },
      { active: ['noslashresult'], note: 'Without it, an entire "photos" folder is created inside dest, containing everything — the same files end up one directory level deeper than the first version.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Sanji\'s Dockside Restocking: Full Haul Every Time, or Just the Difference?',
      text: 'Baratie used to restock its pantry the simple way, and it worked fine for an occasional single delivery: send someone to the dock, haul back a COMPLETE fresh load of everything the kitchen might need, every single trip, regardless of what was already sitting in the pantry from the last run. Fine once in a while. Genuinely wasteful as a routine habit — most of what got hauled back on any given restocking day was stuff the pantry already had plenty of, and hauling it all fresh anyway meant repeating the same heavy trip over and over for no real gain. Sanji eventually institutes a smarter method for ROUTINE restocking specifically: before loading anything, someone walks the pantry shelves and compares them against what is newly available at the dock, and the crew hauls back ONLY the actual difference — what is genuinely missing or has changed since the last trip — leaving everything that already matches untouched, back on the ship, without re-hauling it at all. Dramatically faster for the routine case, though the old full-haul method still gets used for the rare, one-off situation where it is simpler to just grab one specific thing once. And there is a genuinely important detail in HOW a haul gets stored once it is back aboard: dump a crate\'s CONTENTS straight onto the pantry shelf, or store the WHOLE CRATE, as one unit, inside the pantry — two completely different outcomes from what sounds like a nearly identical instruction. Chopper, filling in on restocking duty once, gets this backwards and ends up with an entire nested crate sitting inside the pantry rather than its contents actually being on the shelves — technically "restocked," but not remotely in the useful, immediately-accessible shape Sanji actually needed.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Apartment Inventory Sync, and the Box That Stayed a Box',
      text: 'Sheldon, moving a portion of his comic-book collection between his apartment and a storage unit, initially insists on the simplest possible method: haul a COMPLETE fresh copy of the entire relevant collection every single time anything changes, regardless of how much of it already sits correctly in the destination from the last trip. Leonard, tasked with helping on the third such trip, points out the obvious problem — most of what they are hauling this time is identical to what got hauled last time, and redoing the entire haul from scratch, every time, for a collection that barely changes, is an enormous and pointless amount of repeated effort. Amy proposes the smarter fix: before moving anything, compare what is currently at the storage unit against what is currently at the apartment, and move ONLY the actual difference — new items, or ones that changed — leaving everything already correctly in place completely untouched. Sheldon, after initially resisting purely on principle, adopts it once he sees how much faster routine trips become. Separately, there turns out to be a genuinely important, easy-to-miss detail in HOW a moving box gets unpacked at the destination: dump the box\'s CONTENTS directly onto the storage shelf, or place the WHOLE BOX, still packed, as a single unit onto the shelf — two very different outcomes from what looks like a nearly identical instruction. Penny, helping out once and not told which was intended, defaults to placing the whole box on the shelf rather than unpacking it — technically "moved," but leaving Sheldon\'s comics sealed inside a box on a shelf rather than actually organized and accessible the way he needed.'
    },
    why: 'The full-haul-every-time method is scp: simple, fine once, wasteful when repeated on something mostly unchanged. Comparing first and moving only the difference is rsync\'s entire reason for existing. And the crate-contents-vs-whole-crate, box-contents-vs-whole-box distinction is exactly rsync\'s trailing-slash behavior — the same near-identical instruction producing two structurally different results, worth getting deliberately right rather than discovering the difference by accident.'
  },
  tech: [
    {
      q: 'How does rsync actually determine what has "changed," without re-transferring an entire large file just to check?',
      a: 'rsync uses a delta-transfer algorithm: it breaks files into blocks and computes checksums for those blocks on both sides, then compares the checksums rather than the raw data itself — if a block\'s checksum matches on both source and destination, that block does not need to be re-sent at all, only genuinely differing blocks are transferred. This means even a LARGE file with only a small portion changed (like a huge log file with new lines appended, or a large binary with a small internal edit) can sync using vastly less network transfer than the file\'s full size, since most of its blocks checksum identically and are simply skipped.'
    },
    {
      q: 'Why is running rsync with --delete but WITHOUT first checking --dry-run considered a genuinely risky habit?',
      a: '--delete makes the destination an exact mirror of the source by actively DELETING anything present at the destination but absent from the source — which is exactly the intended, correct behavior for genuine mirroring/backup use cases, but becomes dangerous the moment the destination contains ANYTHING not meant to be judged against the source (a manually-added file, a slightly different intended scope, a typo in the source path pointing at the wrong directory entirely). Because deletion is immediate and not natively reversible through rsync itself, previewing exactly what WOULD be deleted via --dry-run first — before committing to the real run — is the standard, disciplined safeguard, directly analogous to previewing a sed substitution before adding -i, or checking a plan before sending kill -9.'
    },
    {
      q: 'What does rsync\'s -a (archive) flag actually bundle together, and why does that matter for something like a deployment or backup?',
      a: '-a is shorthand for several flags combined: recursive directory copying, PLUS preservation of symlinks, permissions, timestamps (modification times), group and owner (when running with sufficient privilege), and device files. This matters because a plain, naive copy that preserves only file CONTENT can silently lose information that matters — a deployment that resets every file\'s permissions to some default, or a backup that loses original timestamps needed to correctly determine what changed later, or symlinks that get resolved into full duplicate copies instead of staying as links. -a is specifically designed as "copy this in a way that is faithful enough to serve as a genuine backup or an accurate deployment," not just "copy the bytes."'
    }
  ],
  code: {
    title: 'scp and rsync, side by side',
    intro: 'Try the rsync --dry-run examples against a real (non-critical) test directory before ever adding --delete for real.',
    code: `$ scp report.pdf nami@203.0.113.42:/home/nami/docs/
report.pdf                    100%  842KB  2.1MB/s   00:00
# One file, one direction, full copy every time.

$ scp -r ./project nami@203.0.113.42:/home/nami/
# Recursive directory copy — but a FULL copy, regardless of what already exists remotely.

$ rsync -avz ./project/ nami@203.0.113.42:/home/nami/project/
sending incremental file list
src/main.py
src/utils.py
sent 4,213 bytes  received 128 bytes  1,447.33 bytes/sec
# Only the files that actually differ get listed and transferred.

$ rsync -avz --dry-run --delete ./project/ nami@203.0.113.42:/home/nami/project/
sending incremental file list
deleting old_config.yml
src/new_feature.py
# DRY RUN — shows exactly what WOULD happen, including what would be deleted. Nothing has actually run yet.

$ rsync -avz --delete ./project/ nami@203.0.113.42:/home/nami/project/
# Same command, --dry-run removed — NOW it actually runs, having already been previewed.

$ rsync -a photos/ backup/
# Trailing slash: photos' CONTENTS land directly in backup/.

$ rsync -a photos backup/
# No trailing slash: an entire "photos" folder is created inside backup/ — backup/photos/...

$ rsync -aP largefile.iso nami@203.0.113.42:/home/nami/
largefile.iso
  1,207,959,552 100%   45.2MB/s    0:00:26
# -P shows progress AND allows resuming if the transfer is interrupted partway through.`,
    notes: [
      'The very first rsync run of a brand-new destination transfers everything, same as scp would — the DELTA advantage only shows up on the SECOND and subsequent syncs, once something already exists to compare against.',
      '-z (compression) genuinely helps over a slow WAN connection but can slightly slow things down over an already-fast local network, since compressing/decompressing has its own CPU cost.'
    ]
  },
  lab: {
    title: 'Write the right scp/rsync command for each task',
    prompt: 'Write exactly one command per task below.',
    starter: `# Task: copy a local file "notes.txt" to a remote server 203.0.113.5, user "sanji", into /home/sanji/


# Task: sync a local directory "site/" so its CONTENTS land directly in /var/www/html/ on
# server 203.0.113.5 as user "sanji" (archive mode, verbose, compressed)


# Task: preview (without actually doing it) an rsync of "site/" to /var/www/html/ on that
# same server, WITH --delete, so you can check what would be removed before committing

`,
    checks: [
      { re: 'scp\\s+notes\\.txt\\s+sanji@203\\.0\\.113\\.5:/home/sanji/', flags: 'i', must: true, hint: 'scp notes.txt sanji@203.0.113.5:/home/sanji/', pass: 'scp notes.txt sanji@203.0.113.5:/home/sanji/ ✓' },
      { re: 'rsync\\s+-avz\\s+site/\\s+sanji@203\\.0\\.113\\.5:/var/www/html/', flags: 'i', must: true, hint: 'rsync -avz site/ sanji@203.0.113.5:/var/www/html/ — trailing slash on site/ so contents land directly.', pass: 'rsync -avz site/ ... ✓' },
      { re: 'rsync\\s+-avz\\s+--dry-run\\s+--delete\\s+site/\\s+sanji@203\\.0\\.113\\.5:/var/www/html/|rsync\\s+-avz\\s+--delete\\s+--dry-run\\s+site/', flags: 'i', must: true, hint: 'rsync -avz --dry-run --delete site/ sanji@203.0.113.5:/var/www/html/', pass: 'rsync --dry-run --delete site/ ... ✓' }
    ],
    run: 'Try it for real against a scratch directory and (if you have one) a test server — always run --dry-run before the real --delete command.',
    solution: `# Task: copy a local file "notes.txt" to a remote server 203.0.113.5, user "sanji", into /home/sanji/
scp notes.txt sanji@203.0.113.5:/home/sanji/

# Task: sync a local directory "site/" so its CONTENTS land directly in /var/www/html/ on
# server 203.0.113.5 as user "sanji" (archive mode, verbose, compressed)
rsync -avz site/ sanji@203.0.113.5:/var/www/html/

# Task: preview (without actually doing it) an rsync of "site/" to /var/www/html/ on that
# same server, WITH --delete, so you can check what would be removed before committing
rsync -avz --dry-run --delete site/ sanji@203.0.113.5:/var/www/html/`,
    notes: [
      'The trailing slash on "site/" in the second and third tasks is deliberate and required by the task description ("contents land directly") — dropping it would create a nested site/ folder inside /var/www/html/ instead.',
      'Once the --dry-run output in the third task looks correct, the real command is simply the same one with --dry-run removed.'
    ]
  },
  quiz: [
    {
      q: 'What is the core difference between how scp and rsync handle a file that already exists, unchanged, at the destination?',
      options: ['They behave identically — both always re-transfer everything', 'scp re-transfers it in full regardless; rsync detects it already matches and skips transferring it', 'rsync always re-transfers everything; scp is the one that skips unchanged files', 'Neither tool can detect whether a file already exists at the destination'],
      correct: 1,
      explain: 'rsync compares source and destination first and transfers only genuine differences; scp has no such comparison and copies everything requested, every time, regardless of what already exists.'
    },
    {
      q: 'What does the -a flag in "rsync -a source dest" actually do?',
      options: ['It only compresses the data being transferred', 'It bundles recursive copying with preservation of permissions, timestamps, ownership, and symlinks', 'It automatically deletes files at the destination not present at the source', 'It shows a live progress bar during transfer'],
      correct: 1,
      explain: '-a (archive mode) is shorthand for several flags: recursive, plus preserving symlinks, permissions, timestamps, and (with sufficient privilege) ownership — a faithful copy, not just file content.'
    },
    {
      q: 'What is the difference between "rsync -a photos/ dest/" and "rsync -a photos dest/"?',
      options: ['There is no difference; the trailing slash is purely cosmetic', 'The trailing slash version copies photos\' CONTENTS directly into dest; the non-slash version creates a "photos" folder inside dest', 'The trailing slash version is invalid syntax', 'The non-slash version copies faster'],
      correct: 1,
      explain: 'A trailing slash on the rsync SOURCE means "copy the contents of this directory"; no trailing slash means "copy the directory itself" — resulting in different destination structures from nearly identical commands.'
    },
    {
      q: 'What does the --delete flag do in rsync, and why does it warrant caution?',
      options: ['It deletes the SOURCE files after a successful transfer', 'It makes the destination an exact mirror by deleting destination files not present at the source — risky if the destination contains anything not meant to be judged against the source', 'It has no real effect unless combined with -a', '--delete only works on remote destinations, never local ones'],
      correct: 1,
      explain: '--delete actively removes files at the destination that do not exist at the source, making it a true mirror — genuinely useful for backups, but capable of unintended data loss if run against the wrong destination or without previewing first.'
    },
    {
      q: 'What does "--dry-run" let you do before committing to a real rsync?',
      options: ['It runs the sync twice for verification', 'It shows exactly what the command WOULD do (including deletions) without actually performing any of it', 'It automatically backs up the destination before syncing', 'It only works when --delete is NOT also specified'],
      correct: 1,
      explain: '--dry-run (or -n) previews the exact set of transfers and deletions rsync would perform, with nothing actually happening — the standard safeguard before running anything involving --delete.'
    }
  ],
  pitfalls: [
    'Reaching for scp on a large, mostly-unchanged directory that needs REPEATED syncing — rsync would transfer only the delta, dramatically faster, while scp re-copies everything every single time.',
    'Getting the trailing slash on an rsync source backwards, ending up with either an unwanted extra nested folder or contents dumped somewhere unintended — the single most common rsync mistake.',
    'Running rsync with --delete for the first time against a real, consequential destination without --dry-run first — an unintended deletion from a wrong path or unexpected destination content is not trivially reversible.'
  ],
  interview: [
    {
      q: 'Explain, at a mechanism level, why rsync can sync a large mostly-unchanged directory far faster than scp on repeated runs.',
      a: 'rsync\'s delta-transfer algorithm breaks files into blocks and computes checksums on both the source and destination sides, then compares those checksums rather than blindly re-sending data — blocks with matching checksums are assumed identical and skipped entirely, so only the genuinely differing blocks actually cross the network. scp has no such comparison step at all — it simply copies whatever is requested in full, every single invocation, regardless of what may already exist and already match at the destination. On a large directory where only a small fraction of files changed since the last sync, this difference in approach is the entire reason rsync can be dramatically faster: it is transferring a small delta instead of the whole dataset.'
    },
    {
      q: 'Explain the trailing-slash behavior on an rsync source path, and why it is worth understanding deliberately rather than learning through a mistake.',
      a: 'A trailing slash on the SOURCE path tells rsync to treat the CONTENTS of that directory as what is being copied — those contents land directly inside the destination, with no new subfolder created for the source directory itself. Omitting the trailing slash tells rsync to treat the source DIRECTORY ITSELF as the unit being copied, resulting in a new subfolder (matching the source directory\'s name) being created inside the destination, one level of nesting deeper. The two commands look nearly identical — differing by exactly one character — while producing genuinely different destination structures, which is exactly why understanding this deliberately (rather than discovering it via an unexpected nested-folder result on a real sync) is worth the small upfront effort.'
    },
    {
      q: 'Why does the combination "--dry-run" then "--delete" (in that order of operations, not as simultaneous flags) represent good operational discipline?',
      a: 'Running the FULL intended command — including --delete — with --dry-run added first shows exactly what rsync would transfer AND exactly what it would delete, without any of it actually happening, giving a chance to catch a wrong source/destination path, an unexpectedly large deletion list, or a scope mismatch before anything irreversible occurs. Only once that dry-run output has been reviewed and confirmed correct does removing --dry-run and re-running the identical command actually commit to the real operation. This mirrors a recurring theme across the course — sed without -i before adding it, checking a process before kill -9 — previewing a potentially destructive or hard-to-reverse action before committing to it, rather than trusting a command to be correct on the first real attempt.'
    },
    {
      q: 'When would scp genuinely still be the better choice over rsync, despite rsync\'s general advantages?',
      a: 'For a single, one-off transfer of one file (or a small set of files) where there is no meaningful "existing state" at the destination to compare against, and no expectation of ever repeating the transfer — scp\'s simpler syntax and lack of any delta-comparison overhead make it perfectly adequate, and rsync\'s comparison step provides no real benefit when there is nothing to compare against on a fresh destination anyway. rsync\'s advantages are specifically about REPEATED or LARGE transfers where a meaningful portion of the data already matches — for a quick, single, disposable file grab, reaching for the simpler, more universally-available tool (scp exists nearly everywhere SSH does) is a completely reasonable choice, not a mistake.'
    }
  ]
};
