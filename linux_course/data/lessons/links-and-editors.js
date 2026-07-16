window.LESSONS = window.LESSONS || {};
window.LESSONS['links-and-editors'] = {
  id: 'links-and-editors',
  title: 'Symlinks vs Hard Links, and Just Enough vim/nano to Survive',
  category: 'Part 1 — Filesystem & Files',
  timeMin: 35,
  summary: 'Two ways for one file to have more than one name, and why they behave completely differently when you delete or move things — plus the two editors you\'ll actually meet on real servers: nano (friendly, forgettable) and vim (everywhere, terrifying the first time, and worth five real minutes of practice so it never blocks you again).',
  goals: [
    'Explain the difference between a hard link and a symbolic (soft) link, including what happens to each when the original file is deleted or moved',
    'Create both kinds of link with ln, and read ls -l output to tell them apart',
    'Explain why hard links can\'t cross filesystems/mount points and can\'t point to directories, while symlinks can do both',
    'Open, edit, save, and quit a file in nano without hesitation',
    'Open, make a small edit, save, and quit a file in vim — the specific four moves that get you unstuck when you\'re dropped into it unexpectedly'
  ],
  concept: [
    {
      h: 'A file is really just a name pointing at data — links exploit that directly',
      p: [
        'Underneath a filename, Linux stores file data in a structure called an <b>inode</b> — think of it as the actual file (its content, its permissions, its size) living at some anonymous internal address, with the filename you see in <code>ls</code> being just a LABEL that points at that inode. This indirection is the whole trick behind links: a <b>hard link</b> is a second filename pointing at the exact same inode as the original — not a copy, not a shortcut, a second, equally-real name for the identical underlying data. Delete the "original" name and the data is completely untouched, because the inode is still referenced by the other name; the data only actually disappears once EVERY hard link pointing to it is removed.',
        'A <b>symbolic link</b> (symlink, "soft link") is a fundamentally different, much simpler thing: it\'s its own small file whose content is just a PATH STRING pointing at another file by name. Following a symlink means reading that path and looking up whatever it currently points to — which means a symlink can go stale (point at something that no longer exists) in a way a hard link structurally cannot, since a hard link doesn\'t depend on any other name continuing to exist at all.',
        '<div class="math">Hard link:  filename_A ──┐\n            filename_B ──┴──> [inode: the actual data]\n            (delete A, B still works — same data, two equally-real names)\n\nSymlink:    filename_C ──> "path text: /some/other/file"  ──> [inode]\n            (delete the target, C still exists but is now BROKEN — points nowhere)<span class="mnote">A hard link IS the file, twice-named. A symlink POINTS AT the file, and can be left pointing at nothing.</span></div>'
      ]
    },
    {
      h: 'Creating links, and reading which kind you\'re looking at',
      p: [
        '<code>ln original hardlink_name</code> creates a hard link (no flag — this is the "plain" behavior of <code>ln</code>, which surprises people expecting the friendlier symlink to be the default). <code>ln -s original symlink_name</code> creates a symbolic link (<code>-s</code> for symbolic — the one you\'ll actually use most of the time in practice). In <code>ls -l</code> output, a symlink is unmistakable: the file type character is <code>l</code> instead of <code>-</code> or <code>d</code>, and the listing shows an arrow, like <code>lrwxr-xr-x 1 nami crew 11 Jul 16 10:00 latest -> app-v3.log</code>. A hard link, by contrast, is indistinguishable from an "ordinary" file in a plain listing — it just looks like a normal file, because as far as the filesystem is concerned, it genuinely IS one; the only tell is that its link COUNT (a number shown by <code>ls -l</code> right before the owner) will be greater than 1.'
      ]
    },
    {
      h: 'Why the difference actually matters: crossing filesystems, pointing at directories',
      p: [
        'Hard links have two structural limitations that aren\'t arbitrary — they follow directly from what a hard link actually is. First: a hard link cannot cross filesystem/mount-point boundaries, because an inode number is only meaningful WITHIN one specific filesystem — there\'s no way to point at "inode 4821" on a completely different disk. A symlink has no such restriction, since it\'s just a path string; it can point anywhere the filesystem tree reaches, including across mount points, and even at something that doesn\'t exist yet. Second: hard links to DIRECTORIES are disallowed on virtually every modern system (for structural reasons involving how directory trees are walked and how easily you could accidentally create an infinite loop) — symlinks to directories are common and fully supported.',
        'The practical upshot: symlinks are what you\'ll actually reach for constantly — a <code>latest</code> symlink pointing at whichever versioned log or release directory is current, a config file symlinked into place from a central dotfiles repo, a command in <code>/usr/bin</code> that\'s really a symlink into a version-specific install directory (this exact pattern is how tools like <code>python3</code> often resolve to a specific installed version). Hard links are a narrower, more specialized tool you\'ll use far less often — mostly for things like deduplicating identical file content without actually duplicating the data.'
      ]
    },
    {
      h: 'Editing a file over SSH: nano first, then just enough vim',
      p: [
        'Once you\'re on a remote server (Part 5), there\'s usually no GUI text editor available — you edit files with a terminal-based one, directly over the SSH connection. <b>nano</b> is the friendly option: run <code>nano filename</code>, type normally like any text editor, and the bottom of the screen constantly shows you the exact keyboard shortcuts available (<code>^O</code> means Ctrl+O to save/"WriteOut", <code>^X</code> means Ctrl+X to exit). You genuinely don\'t need to memorize anything — the shortcuts are always on screen. For quick edits, nano is entirely sufficient and there\'s no shame in using it forever.',
        '<b>vim</b> is the other option, and it matters for one specific reason: it is installed by default on nearly every Linux server you will ever SSH into, including minimal ones that don\'t have nano at all, and it will occasionally be the ONLY editor available. Vim also has a genuinely different design — it\'s <b>modal</b>: you\'re either in "normal mode" (keystrokes are commands, not text) or "insert mode" (keystrokes are literal text), and confusing the two is exactly what makes vim feel hostile the first time someone drops into it unprepared. You only need four moves to never be stuck again: press <code>i</code> to enter insert mode and start typing normally; press <code>Esc</code> to leave insert mode and go back to normal mode; type <code>:wq</code> then Enter (while in normal mode) to write (save) and quit; or, if you\'ve made a mess, type <code>:q!</code> then Enter to quit WITHOUT saving, discarding your changes entirely. Those four moves — insert, escape, save-and-quit, quit-without-saving — are 90% of what you need for years of occasional server-side edits.'
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The four vim moves above genuinely are enough to never be stuck. If you want real fluency (worth it if you\'ll be SSHing in often), here\'s more.',
    sections: [
      {
        h: 'A few more vim moves worth having',
        p: [
          'Beyond the survival four: <code>x</code> deletes the character under the cursor (in normal mode); <code>dd</code> deletes the whole current line; <code>u</code> undoes the last change, and it stacks — repeated <code>u</code> keeps undoing further back; <code>/searchterm</code> then Enter jumps to the next match of that text in the file, exactly like <code>less</code>\'s search; <code>:%s/old/new/g</code> is a find-and-replace across the ENTIRE file (this exact syntax is directly related to <code>sed</code>\'s substitution syntax, Part 3 — vim and sed share the same regex-substitution heritage, which is not a coincidence). Learning even this small additional set turns vim from "an emergency-only editor I tolerate" into a genuinely fast tool for quick server-side edits, without needing anywhere near its full depth.'
        ]
      },
      {
        h: 'Why does vim even work this way — what\'s "modal editing" actually for?',
        p: [
          'Modal editing looks like an obstacle at first, but it\'s a deliberate, defensible design: in normal mode, every single key on the keyboard is available as a COMMAND rather than being reserved for typing text, which lets vim pack an enormous vocabulary of precise, composable text operations (delete a word, change everything until the next comma, move to the third occurrence of a character) onto plain keystrokes with no modifier keys required at all. The cost is exactly the beginner confusion this lesson addresses head-on: you have to always know which mode you\'re in, and accidentally typing text while in normal mode does surprising, sometimes destructive things (since your "text" is being interpreted as a stream of commands instead). Once that mental model clicks — "I am either COMMANDING or TYPING, never both at once, and Esc always gets me back to commanding" — the apparent hostility mostly evaporates.'
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: 'Two Robins are one Robin; a Vivre Card that stops working is still a Vivre Card',
      text: 'Robin has, in effect, several separate archive rooms scattered across islands she\'s worked in over the years, but here\'s the trick her old mentor taught her about two of them specifically: they aren\'t copies of each other and never were — they\'re the SAME physical archive, simply accessible through two different doors on two different islands, both doors leading to the literal same shelves. If a fire ever destroyed the door on one island, the archive itself would be completely untouched, still fully reachable through the other door — because the archive was never "in" either door, both doors were just names for the one real thing. That\'s a hard link: two names, one underlying reality, and destroying one name changes nothing about whether the data survives, because the data was never tied to either specific name. A Vivre Card works completely differently, and Robin is careful never to confuse the two ideas: a card is a SEPARATE physical object, cut from a person\'s own being, that merely POINTS toward where that person currently is — and critically, if that person dies, the card doesn\'t vanish, it just goes cold and stops pointing anywhere useful, becoming a broken reference to something that no longer exists to find. That\'s exactly a symlink: its own separate small thing, whose entire purpose is pointing at something else by reference, capable of surviving as an object even after what it pointed to is gone — just uselessly, as a dead pointer.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Two names on one lease vs. the note taped to Ross\'s door',
      text: 'Monica and Rachel\'s apartment has, at one point, both of their names on a single lease — and here\'s the part worth noticing: that\'s not two separate agreements that happen to describe the same apartment, it\'s ONE lease, one real underlying legal reality, with two equally valid names attached to it. If Rachel moved out and her name came off, the apartment and Monica\'s claim to it are completely unaffected — the underlying reality never depended on either specific name surviving; it just needs AT LEAST one. Compare that to the sticky note Chandler once tapes to his own door reading "Joey\'s at Monica\'s" — that note isn\'t a second lease on anything, it\'s a completely separate little object whose only job is pointing at Joey\'s current location by reference. The day Joey actually moves out of Monica\'s for good, that note doesn\'t magically update or disappear — it just sits there, now flatly WRONG, a broken pointer to a Joey who isn\'t there anymore, and anyone trusting it walks into an empty room. Two names on one lease is a hard link. The sticky note is a symlink, and symlinks can absolutely go stale.'
    },
    why: 'A hard link is two equally-real names on the SAME underlying thing — remove one name, the thing survives fine on the other. A symlink is a separate little pointer object aimed at something else by reference — remove the target, and the pointer survives too, just uselessly, pointing at nothing.'
  },
  storyAnim: {
    title: 'Two doors, one archive vs. one card, no owner',
    h: 240,
    props: [
      { id: 'archive', emoji: '📚', label: 'The actual archive (one inode)', x: 50, y: 18 },
      { id: 'door1', emoji: '🚪', label: 'Door A (hard link name #1)', x: 20, y: 55 },
      { id: 'door2', emoji: '🚪', label: 'Door B (hard link name #2)', x: 50, y: 70 },
      { id: 'card', emoji: '🃏', label: 'Vivre Card (symlink)', x: 82, y: 55 }
    ],
    actors: [
      { id: 'robin', emoji: '📖', label: 'Robin', x: 50, y: 40 }
    ],
    steps: [
      { c: 'The real archive: one physical set of shelves, one underlying reality.', p: { archive: 'good' } },
      { c: 'Door A and Door B both open onto that exact same archive — not two archives, two equally-real entrances to the one thing.', p: { door1: 'lit', door2: 'lit' } },
      { c: 'Destroy Door A entirely. The archive itself is completely untouched — Door B still opens onto every shelf, because the archive was never "inside" either door.', a: { robin: [50, 55] }, p: { door1: 'bad', door2: 'good', archive: 'good' } },
      { c: 'The Vivre Card is a different kind of thing entirely: its own separate object, whose only job is pointing at a person elsewhere.', p: { card: 'lit' } },
      { c: 'As long as what it points to exists, the card is genuinely useful — a live reference to a real location.', p: { card: 'good' } },
      { c: 'But if the person it points to is gone, the card doesn\'t vanish — it just goes cold, a broken pointer to nothing. That is exactly how a symlink can outlive its target, uselessly.', p: { card: 'bad' } }
    ]
  },
  tech: [
    {
      q: 'Why can\'t a hard link cross filesystems, but a symlink can?',
      a: 'A hard link is literally a second directory entry pointing at the same inode NUMBER — and inode numbers are only assigned and meaningful within one specific filesystem\'s own bookkeeping. Asking a different filesystem (a different disk, a different mounted partition) to resolve "inode 4821" is meaningless — that number space belongs entirely to the original filesystem. A symlink sidesteps this completely because it doesn\'t reference an inode number at all — it just stores a PATH STRING, and path resolution naturally walks across mount points as part of ordinary directory traversal, the same way any absolute path can reach into a different mounted filesystem.'
    },
    {
      q: 'Why does /usr/bin/python3 often turn out to be a symlink rather than the actual program?',
      a: 'This is a deliberate, extremely common pattern for managing multiple installed versions cleanly: the actual Python interpreter binaries live in version-specific locations (something like /usr/bin/python3.11), and a symlink named simply python3 points at whichever version is currently the system default. Switching the active version becomes a single, atomic operation — repoint one symlink — instead of moving, renaming, or reinstalling anything. Tools like update-alternatives on Debian-family systems, and version managers you may already know from other languages, are built entirely around this exact symlink-indirection pattern.'
    },
    {
      q: 'What actually happens to disk space when you delete a file that has multiple hard links?',
      a: 'Nothing happens to the actual data until the LAST hard link pointing at that inode is removed — this is precisely why the link count shown in ls -l matters. Each inode keeps an internal reference count of how many names currently point at it; "deleting" a file really just removes one name and decrements that count by one. Only when the count reaches zero does the kernel actually reclaim the underlying disk blocks. This is also the exact mechanism (not a coincidence) behind why a program can keep writing to a file it has open even after another process has "deleted" that file\'s name — the open file handle itself effectively counts as a reference too, keeping the inode alive until the handle is closed.'
    }
  ],
  code: {
    title: 'Links in action — watch the difference for real',
    intro: 'Run every line of this in a scratch directory to see hard links and symlinks behave completely differently.',
    code: `$ echo "original content" > original.txt

$ ln original.txt hardlink.txt
$ ln -s original.txt symlink.txt

$ ls -l
-rw-r--r-- 2 nami crew 17 Jul 16 10:00 hardlink.txt
lrwxr-xr-x 1 nami crew 12 Jul 16 10:00 symlink.txt -> original.txt
-rw-r--r-- 2 nami crew 17 Jul 16 10:00 original.txt
# Notice: original.txt and hardlink.txt both show link count "2" (right after
# the permission string) — they are, literally, the same underlying data.
# symlink.txt shows type "l" and an explicit "-> original.txt" arrow.

$ rm original.txt
$ cat hardlink.txt
original content
# Still works fine! The data was never "inside" the name original.txt —
# hardlink.txt was an equally-real second name for it the whole time.

$ cat symlink.txt
cat: symlink.txt: No such file or directory
# Broken! symlink.txt only ever stored the PATH "original.txt" — and that
# path no longer resolves to anything. This is a "dangling" symlink.

$ ls -l symlink.txt
lrwxr-xr-x 1 nami crew 12 Jul 16 10:05 symlink.txt -> original.txt
# The symlink itself still exists as a file — it just points nowhere useful now.`,
    notes: [
      'This exact experiment — create both kinds, delete the original, see what survives — is the fastest way to make the difference permanently intuitive.',
      'A "latest" symlink pointing at a versioned directory (like latest -> release-v3/) is one of the single most common real-world uses you\'ll see on actual servers.'
    ]
  },
  lab: {
    title: 'Write the real commands',
    prompt: 'For each task, write the exact command. Task 1 is done for you.',
    starter: `# Task 1: Create a symlink named "current" pointing at "release-v2".
ln -s release-v2 current

# Task 2: Create a hard link named "backup.txt" pointing at the same data as "report.txt".


# Task 3: Open "config.yaml" in nano.


# Task 4 (vim, normal mode): Save and quit a file you just edited.


# Task 5 (vim, normal mode): Quit WITHOUT saving your changes.
`,
    checks: [
      { re: '^\\s*ln\\s+report\\.txt\\s+backup\\.txt\\s*$', flags: 'm', must: true, hint: 'Task 2: plain "ln" (no -s) creates a hard link — "ln report.txt backup.txt".', pass: 'Task 2: ln report.txt backup.txt ✓' },
      { re: '^\\s*nano\\s+config\\.yaml\\s*$', flags: 'm', must: true, hint: 'Task 3: "nano config.yaml" opens the file in nano.', pass: 'Task 3: nano config.yaml ✓' },
      { re: ':wq', must: true, hint: 'Task 4: ":wq" (then Enter) writes and quits in vim\'s normal mode.', pass: 'Task 4: :wq ✓' },
      { re: ':q!', must: true, hint: 'Task 5: ":q!" quits without saving, discarding changes.', pass: 'Task 5: :q! ✓' }
    ],
    run: 'For the vim tasks, actually open a scratch file with "vim scratch.txt", press i, type a few characters, press Esc, then try :wq — then reopen and try :q! after making another change.',
    solution: `# Task 1: Create a symlink named "current" pointing at "release-v2".
ln -s release-v2 current

# Task 2: Create a hard link named "backup.txt" pointing at the same data as "report.txt".
ln report.txt backup.txt

# Task 3: Open "config.yaml" in nano.
nano config.yaml

# Task 4 (vim, normal mode): Save and quit a file you just edited.
:wq

# Task 5 (vim, normal mode): Quit WITHOUT saving your changes.
:q!`,
    notes: [
      'The single most common real vim panic is being stuck in insert mode typing commands as if they were text — remember: Esc ALWAYS gets you back to normal mode, no matter how stuck you feel.',
      'Practicing :wq and :q! for real, right now, in a scratch file, is worth far more than reading about them — five minutes here saves genuine frustration the first time you\'re unexpectedly dropped into vim on a real server.'
    ]
  },
  quiz: [
    {
      q: 'You delete a file that has a hard link pointing to the same data. What happens to the hard link?',
      options: ['It breaks immediately, same as a symlink would', 'It still works fine — the underlying data isn\'t removed until every hard link to it is gone', 'It automatically becomes a symlink instead', 'The hard link is deleted too, automatically'],
      correct: 1,
      explain: 'A hard link is an equally-real second name for the same inode. Deleting one name just decrements a reference count; the data survives as long as at least one name still points to it.'
    },
    {
      q: 'Why can a symlink "go stale" or "dangling" but a hard link structurally cannot?',
      options: ['Symlinks are simply less reliable software', 'A symlink stores a path string that has to be re-resolved each time; if that path stops resolving to anything, the symlink still exists but points nowhere. A hard link never depends on any OTHER name continuing to exist.', 'Hard links are automatically repaired by the kernel', 'This is not actually true — both can go stale identically'],
      correct: 1,
      explain: 'A symlink is fundamentally a stored path reference, resolved at access time. A hard link is a direct second name on the same inode, with no dependency on any other name surviving.'
    },
    {
      q: 'Which of these can a symlink do that a hard link cannot?',
      options: ['Point at a file with a different name', 'Cross filesystem/mount-point boundaries and point at directories', 'Be created with the ln command', 'Be listed with ls -l'],
      correct: 1,
      explain: 'Hard links are restricted to the same filesystem (inode numbers are only meaningful within one filesystem) and cannot target directories on virtually all modern systems. Symlinks, being just path strings, have neither restriction.'
    },
    {
      q: 'In vim, you\'re in normal mode and want to actually start typing text into the file. What do you press?',
      options: [':wq', 'Esc', 'i', ':q!'],
      correct: 2,
      explain: '"i" enters insert mode, where keystrokes are typed as literal text instead of interpreted as commands.'
    },
    {
      q: 'You made a mess in vim and want to abandon all your changes since opening the file. What do you type (in normal mode)?',
      options: [':wq', ':q!', 'Esc', 'dd'],
      correct: 1,
      explain: '":q!" quits without saving, discarding any unsaved changes — the "!" is what forces the quit despite unsaved edits.'
    }
  ],
  pitfalls: [
    'Assuming a symlink is a copy of the file it points to — it isn\'t, it\'s a tiny separate object storing only a path; deleting or moving the TARGET breaks the symlink even though the symlink file itself is untouched.',
    'Getting stuck in vim typing what you think is text while still in normal mode, watching it execute as commands instead — the fix is always the same: press Esc to be certain you\'re in normal mode, then i if you actually meant to type.',
    'Trying to hard-link a directory or link across two different mounted disks and being confused by the error — both are structural limitations of what a hard link fundamentally is, not bugs, and the fix is almost always "use a symlink instead."'
  ],
  interview: [
    {
      q: 'Explain the difference between a hard link and a symbolic link, precisely.',
      a: 'A hard link is a second filename pointing directly at the same inode as another name — there is no "original" in any structural sense, just two (or more) equally valid names referencing identical underlying data; deleting one name leaves the data intact as long as at least one name still references it. A symbolic link is a separate, small file whose content is a path string pointing at another file by name; following it means resolving that stored path at access time, which means it can become "dangling" — pointing at nothing — if the target is deleted, moved, or never existed, something structurally impossible for a hard link.'
    },
    {
      q: 'Why can\'t you create a hard link across two different mounted filesystems?',
      a: 'A hard link works by pointing a second directory entry at an existing inode NUMBER, and inode numbers are only assigned meaning within the bookkeeping of one specific filesystem — the same number could refer to a completely different, unrelated piece of data on a different filesystem. There\'s no mechanism for one filesystem to reference an inode belonging to another. A symlink has no such limitation because it never references an inode number at all — it stores a path, and ordinary path resolution already walks across mount points as part of normal directory traversal.'
    },
    {
      q: 'What are the four vim commands you\'d use to survive an unexpected server-side edit, and what does each do?',
      a: '"i" enters insert mode from normal mode, so keystrokes become literal text instead of commands. "Esc" returns to normal mode from insert mode — the universal "get me back to a known state" key. ":wq" (typed in normal mode, followed by Enter) writes the file to disk and quits. ":q!" (also normal mode, then Enter) quits without saving, forcing past vim\'s refusal to discard unsaved changes. Together these cover the two outcomes anyone needs from an emergency edit: save my change and leave, or abandon my change and leave.'
    },
    {
      q: 'Give a real-world scenario where you\'d deliberately choose a symlink over a hard link.',
      a: 'A "latest" or "current" pointer used for deployments: releases live in versioned directories like /app/releases/v42, and a symlink named /app/current points at whichever release is presently active. Deploying a new version becomes a single atomic operation — repoint the symlink to the new release directory — rather than moving or copying files around. This specifically requires a symlink rather than a hard link because it needs to point at a DIRECTORY (hard links to directories are disallowed on modern systems) and because the target genuinely changes identity over time — v41 today, v42 tomorrow — which is exactly the flexible, re-pointable indirection a symlink provides and a hard link, being permanently bound to one specific inode, cannot.'
    }
  ]
};
