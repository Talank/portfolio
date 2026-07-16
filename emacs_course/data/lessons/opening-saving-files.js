window.LESSONS = window.LESSONS || {};
window.LESSONS['opening-saving-files'] = {
  id: 'opening-saving-files',
  title: 'Opening, Saving & Dired: Files Without Leaving Emacs',
  category: 'Part 2 — Buffers, Windows & Files',
  timeMin: 30,
  summary: 'With buffers, windows, and frames now sorted out, this lesson covers the actual mechanics of getting a file INTO a buffer, saving it back out, and browsing a whole directory without ever leaving Emacs at all — via Dired, Emacs\'s built-in file manager, which turns out to just be another buffer using the exact same navigation ideas from the last lesson.',
  goals: [
    'Open a file into a buffer with C-x C-f, including path completion',
    'Save the current buffer with C-x C-s, and save it under a new name with C-x C-w',
    'Read the mode-line\'s "modified" indicator to know whether a buffer has unsaved changes',
    'Navigate a directory, and mark/rename/delete files, using Dired (C-x d)',
    'Explain what auto-save and backup files are for, and recognize them when you see them'
  ],
  concept: [
    {
      h: 'C-x C-f: opening a file into a buffer',
      p: [
        '<code>C-x C-f</code> (find-file) prompts, in the minibuffer, for a file path — type it, with <code>Tab</code> completing partial paths and filenames as you go, exactly like tab-completion in a shell. If the file exists, its contents load into a new buffer named after the file. If it does NOT exist yet, Emacs happily creates a new, empty buffer with that name anyway — worth knowing that this does NOT create anything on disk yet; the file only actually comes into existence the first time you save that buffer.',
        'This is genuinely the same command whether you are opening something for the first time or reopening something you already have open elsewhere — if a buffer visiting that exact file already exists, C-x C-f just switches to it rather than loading a redundant second copy.'
      ]
    },
    {
      h: 'C-x C-s to save, and reading the "modified" indicator',
      p: [
        '<code>C-x C-s</code> (save-buffer) writes the current buffer\'s content back to the file it is visiting, overwriting the previous contents on disk. <code>C-x C-w</code> (write-file) instead prompts for a NEW path, saving a copy there and switching the current buffer to visit THAT new file going forward — the save-as equivalent.',
        'Emacs\'s mode-line (the status bar at the bottom of each window) shows an asterisk <code>*</code> next to the buffer name whenever it has UNSAVED changes — genuinely worth glancing at as a habit, since it is the fastest way to know whether C-x C-s actually needs pressing right now. A buffer with no asterisk is fully in sync with what is on disk; saving an already-unmodified buffer is a harmless no-op.'
      ]
    },
    {
      h: 'Dired: a file manager built entirely from buffers you already know how to use',
      p: [
        '<code>C-x d</code> opens <b>Dired</b> (directory editor) — a navigable listing of a directory\'s contents, presented as an ordinary buffer, using the exact buffer/window mechanics from the previous lesson. Move between entries with <code>n</code>/<code>p</code> (next/previous line — the same motion keys covered properly in the next Part), open whatever is at point with <code>RET</code> (a file opens it for editing; a directory navigates into it).',
        'File operations work through a mark-then-act pattern: press <code>m</code> to MARK a file (a visible <code>D</code> or <code>*</code> appears next to it), mark as many as you need, then press <code>d</code> to flag marked files for deletion and <code>x</code> to actually EXECUTE that deletion (a genuinely deliberate two-step confirmation, not accidental). <code>R</code> renames (or moves) the file at point. There is no separate "file manager application" here at all — Dired is simply Emacs\'s own editing primitives, pointed at a directory listing instead of a text file.'
      ]
    },
    {
      h: 'Auto-save and backup files: two different safety nets, both just files sitting next to yours',
      p: [
        'Emacs periodically <b>auto-saves</b> a buffer with unsaved changes to a separate file named <code>#originalname#</code> — WITHOUT touching your real, actual file at all. This exists specifically for crash recovery: if Emacs (or your machine) crashes before you manually saved, reopening the original file and running <code>M-x recover-file</code> can restore your unsaved work from that auto-save file, which would otherwise have been lost entirely.',
        'Separately, when you SAVE a file that already existed, Emacs can create a <b>backup</b> of the PREVIOUS version, named <code>originalname~</code>, before overwriting it with your new save — a one-generation-back safety net against a save you immediately regret. Both of these are ordinary files sitting right next to the one you are editing, both are configurable (including fully disableable), and both exist for the same underlying reason: giving you a way back from a mistake that a plain, single, overwritten file would not otherwise allow.'
      ]
    }
  ],
  conceptFlow: {
    title: 'From first edit to a crash-safe save: the full lifecycle',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'You start editing',
        nodes: [
          { id: 'edit', text: 'You edit report.txt\nmode-line shows * (modified)' }
        ]
      },
      {
        label: 'Auto-save kicks in (unattended)',
        nodes: [
          { id: 'autosave', text: 'A few seconds of inactivity later,\nEmacs writes #report.txt#\n(your REAL file is untouched)' }
        ]
      },
      {
        label: 'You save manually',
        nodes: [
          { id: 'backup', text: 'C-x C-s:\nreport.txt~ created\n(a copy of the OLD content)' },
          { id: 'write', text: 'report.txt itself\nis overwritten with your NEW content' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'clean', text: 'mode-line * disappears\n(buffer now matches disk)' }
        ]
      }
    ],
    steps: [
      { active: ['edit'], note: 'The moment you make any change, the mode-line asterisk appears — the buffer and the on-disk file are now out of sync.' },
      { active: ['autosave'], note: 'Emacs periodically writes your CURRENT, unsaved content to a separate #report.txt# file — purely for crash recovery, your real report.txt file has not been touched at all yet.' },
      { active: ['backup'], note: 'When you actually press C-x C-s, Emacs first copies whatever was PREVIOUSLY on disk into report.txt~ — a snapshot of the version you are about to overwrite.' },
      { active: ['write'], note: 'THEN, and only then, your new buffer content actually gets written into report.txt itself, replacing what was there.' },
      { active: ['clean'], note: 'With the save complete, the mode-line asterisk disappears — the buffer and the file on disk are back in sync. If you had crashed anywhere before this step, #report.txt# would have been your recovery path; report.txt~ is now your one-step-back safety net for the save that just happened.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Nami\'s Chart Room: A Working Copy, a Draft, and a Full Directory',
      text: 'Nami never edits a ship\'s master chart directly and carelessly — she has a specific discipline built around exactly the risk of losing real work. When she pulls a chart to update it, she is working on it actively for a while before it is genuinely finished — and periodically, without her even having to think about it, a quick rough draft copy gets set aside on a nearby table, purely so that if something disastrous happens mid-session (a spilled inkwell, an emergency pulling her away suddenly), that draft can be recovered later, even though the REAL master chart on the wall has not been touched by any of this yet. Only once she is actually satisfied does she commit the update for real — and even then, she does not simply erase the old version outright: the previous version gets filed into a "just in case" folder first, ONE generation back, before the new version takes its place on the wall. Separately, the chart room itself is organized as a fully browsable index — walk in, and every chart is listed, navigable one at a time, openable, markable for removal, renameable, all directly from that one index rather than needing some separate cataloging system bolted on top. Usopp, once genuinely relieved a careless mistake did not cost the crew a week of navigation work, asks how she recovered it so cleanly. Nami\'s answer: "I never touch the real chart carelessly. There is always a recent draft, and there is always the previous version, sitting right there, before I ever fully commit to a change."'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Recipe Box: A Sticky-Note Draft, an Old-Card Backup, and a Full Index',
      text: 'Monica\'s recipe card collection runs on a discipline that took her years of trial and painful error to actually adopt, and it maps almost exactly onto this lesson. When she is actively reworking a recipe card, she does not commit changes to the real card carelessly mid-process — she jots evolving drafts on a sticky note stuck to the card first, purely so that if she gets pulled away mid-revision (Joey walking in hungry, a phone call), that sticky-note draft is still sitting right there to pick back up from, even though the ACTUAL recipe card underneath has not been touched by any of it yet. Only once she is genuinely satisfied does she commit the real change to the card itself — and even then, she keeps the PREVIOUS version of that card filed in a small "just in case" box first, one generation back, before writing over the original. Separately, her entire recipe box is organized as one fully browsable, navigable index — flip through it card by card, pull one out to read, mark several for retiring, rename a mislabeled one, all directly within that one physical system, no separate catalog needed on top of it. Chandler, watching her recover a recipe flawlessly after accidentally smudging half a card one evening, is genuinely impressed. Monica\'s explanation: "I never touch the real card carelessly mid-edit. There is always a draft note, and there is always the old version, sitting right there, before anything actually gets overwritten for good."'
    },
    why: 'Nami\'s recent draft and Monica\'s sticky-note draft are exactly Emacs\'s auto-save (#file#) — a periodic, automatic safety net that never touches your real file. The "previous version filed away first" habit both of them keep is exactly the file~ backup Emacs creates on save. And the fully browsable chart room / recipe box, navigable and actionable directly, is exactly Dired — a file manager built entirely out of the same buffer you already know how to use.'
  },
  tech: [
    {
      q: 'Why does typing a filename that does not exist yet into C-x C-f not actually create anything on disk right away?',
      a: 'C-x C-f\'s job is specifically to give you a BUFFER associated with that path — if the file exists, it loads the content; if it does not, it simply creates a new, empty buffer that KNOWS it is destined for that path once saved, without touching the filesystem at all yet. This mirrors the buffer/disk distinction from earlier: a buffer is in-memory content, only synchronized with disk on an explicit save. Nothing about opening a "new" file is any different from opening an existing one in this respect — the file genuinely only comes into existence on disk the first time C-x C-s (or C-x C-w) is actually pressed for that buffer.'
    },
    {
      q: 'What is the practical difference between recovering from an auto-save file (#file#) versus restoring from a backup file (file~), and when would you reach for each?',
      a: 'An auto-save file (#file#) is Emacs\'s own periodic snapshot of UNSAVED, in-progress buffer content — you would reach for it (via M-x recover-file) specifically after a crash or unexpected Emacs/system failure that happened BEFORE you got a chance to manually save, since that content would otherwise be entirely lost. A backup file (file~) is a snapshot of the PREVIOUSLY SAVED version of a file, created automatically the moment you overwrite it with a new save — you would reach for that instead when you realize, after having ALREADY saved successfully, that the save itself was a mistake you want to undo by reverting to the prior on-disk version. One recovers unsaved work after a crash; the other recovers a previously-saved state after an unwanted save.'
    },
    {
      q: 'Why is Dired implemented as an ordinary buffer using the same navigation commands, rather than as a completely separate, dedicated file-manager application within Emacs?',
      a: 'This follows the same design principle covered in Part 0 — because nearly everything in Emacs is built from the same underlying primitives (buffers, and elisp code operating on them), a directory listing is naturally represented as just another kind of buffer content, with its own MAJOR MODE (covered in Part 5) defining what specific keys like m/d/x/R do in that context. This means someone who already knows basic buffer navigation does not need to learn an entirely separate application\'s UI conventions to use Dired — it reuses the exact same mental model, just applied to directory entries instead of text lines, which is a genuinely direct, practical payoff of Emacs\'s "everything is a buffer" architecture from Part 0\'s deep dive.'
    }
  ],
  code: {
    title: 'Opening, saving, and browsing with Dired',
    intro: 'Try this against a real, disposable scratch directory.',
    code: `C-x C-f ~/notes/todo.txt <RET>
;; If todo.txt exists, its content loads. If not, an empty buffer opens —
;; nothing is written to disk yet.

;; Type some text, then check the mode-line:
;; --:**-  todo.txt   ...        <- the ** indicates unsaved changes

C-x C-s
;; NOW todo.txt is actually written to disk. Mode-line loses its asterisks:
;; --:---  todo.txt   ...

C-x C-w ~/notes/todo-v2.txt <RET>
;; Saves a COPY under a new name; this buffer now visits todo-v2.txt going forward.

C-x d ~/notes/ <RET>
;; Opens Dired on ~/notes/ — a navigable listing:
  drwxr-xr-x  nami  ..  .
  -rw-r--r--  nami  ..  todo.txt
  -rw-r--r--  nami  ..  todo-v2.txt

;; With point on todo.txt: press RET to open it, or:
m           ; mark it
d           ; flag it for deletion (shows D instead of the mark)
x           ; actually execute the deletion (asks to confirm)

R           ; rename/move the file at point — prompts for a new name

;; If Emacs crashed mid-edit on an unsaved file:
C-x C-f ~/notes/todo.txt <RET>
M-x recover-file <RET>
;; Offers to restore from the #todo.txt# auto-save file, if one exists.`,
    notes: [
      'The mark-then-execute pattern (m, then d, then x) for deletion is deliberately two separate steps — marking is easily undoable (press u to unmark), while x is the actual, harder-to-undo commit.',
      'Auto-save files (#name#) and backup files (name~) are ordinary files — "ls -la" in a terminal shows them sitting right next to your real file, and they are safe to manually delete once you no longer need them.'
    ]
  },
  lab: {
    title: 'Write the file and Dired commands for each task',
    prompt: 'Write exactly what each task asks for.',
    starter: `# Task: open ~/project/README.md into a buffer


# Task: save the current buffer back to disk


# Task: save the current buffer under a new name, ~/project/README-backup.md


# Task: open Dired on ~/project/


# Task: mark a file in Dired for deletion and then actually delete it (two key presses)

`,
    checks: [
      { re: 'C-x\\s+C-f\\s+~/project/README\\.md', flags: 'i', must: true, hint: 'C-x C-f ~/project/README.md <RET>', pass: 'C-x C-f ~/project/README.md ✓' },
      { re: 'C-x\\s+C-s', flags: '', must: true, hint: 'C-x C-s saves the current buffer.', pass: 'C-x C-s ✓' },
      { re: 'C-x\\s+C-w\\s+~/project/README-backup\\.md', flags: 'i', must: true, hint: 'C-x C-w ~/project/README-backup.md <RET>', pass: 'C-x C-w ~/project/README-backup.md ✓' },
      { re: 'C-x\\s+d\\s+~/project/', flags: 'i', must: true, hint: 'C-x d ~/project/ <RET>', pass: 'C-x d ~/project/ ✓' },
      { re: '\\bd\\b[\\s\\S]*\\bx\\b|\\bm\\b[\\s\\S]*\\bd\\b[\\s\\S]*\\bx\\b', flags: '', must: true, hint: 'd flags for deletion, x executes it.', pass: 'd then x ✓' }
    ],
    run: 'Try it for real: open a scratch file, edit it, save it, then C-x d on its directory and confirm you see it listed.',
    solution: `# Task: open ~/project/README.md into a buffer
C-x C-f ~/project/README.md <RET>

# Task: save the current buffer back to disk
C-x C-s

# Task: save the current buffer under a new name, ~/project/README-backup.md
C-x C-w ~/project/README-backup.md <RET>

# Task: open Dired on ~/project/
C-x d ~/project/ <RET>

# Task: mark a file in Dired for deletion and then actually delete it (two key presses)
d       ; flags the file at point for deletion
x       ; executes the deletion (confirms first)`,
    notes: [
      'The last task technically starts from wherever point is in the Dired listing — moving to the right entry first (n/p, covered next lesson) is assumed here.',
      '"m" (mark, generic) and "d" (flag specifically for deletion) look similar but are genuinely different — m alone does not schedule anything for deletion, it just marks for whatever bulk operation you invoke next.'
    ]
  },
  quiz: [
    {
      q: 'What happens on disk when you press C-x C-f and type the name of a file that does not exist yet?',
      options: ['The file is immediately created on disk, empty', 'Nothing on disk changes yet — an empty buffer is created, and the file is only actually written when you save', 'Emacs refuses and shows an error', 'A random placeholder file is created instead'],
      correct: 1,
      explain: 'C-x C-f only creates a buffer, associated with that path — the file itself does not exist on disk until you actually save the buffer with C-x C-s or C-x C-w.'
    },
    {
      q: 'What does an asterisk (*) next to a buffer name in the mode-line indicate?',
      options: ['The buffer is read-only', 'The buffer has unsaved changes not yet written to disk', 'The buffer is currently being auto-saved', 'The file has been deleted from disk'],
      correct: 1,
      explain: 'The mode-line asterisk marks a "modified" buffer — content that differs from what is currently saved on disk. It disappears once you save.'
    },
    {
      q: 'In Dired, what is the purpose of the two-step "m then d, then x" pattern for deleting files?',
      options: ['It is a redundant, unnecessary extra step', 'Marking/flagging is easily reversible (with u), while x is the actual, deliberate execution — a genuine confirmation step before an action that is harder to undo', 'm and d do the exact same thing for redundancy', 'x must always be pressed before m or d'],
      correct: 1,
      explain: 'Marking (m) or flagging for deletion (d) can be undone with u before anything actually happens — x is the deliberate final step that actually executes the deletion, giving you a real chance to review before committing.'
    },
    {
      q: 'What is an auto-save file (like #notes.txt#) actually for?',
      options: ['It is the permanent, real saved version of your file', 'It is a periodic snapshot of unsaved changes, used for crash recovery, that never touches the real file on disk', 'It is a compressed archive of old versions', 'It only exists for files opened in Dired'],
      correct: 1,
      explain: 'Auto-save files are periodic safety-net snapshots of in-progress, unsaved edits — recoverable via M-x recover-file after a crash — and they never modify your actual, real file.'
    },
    {
      q: 'What is the difference between a backup file (notes.txt~) and an auto-save file (#notes.txt#)?',
      options: ['They are the exact same thing with different names', 'A backup file is a copy of the PREVIOUSLY SAVED version, created when you overwrite it with a new save; an auto-save file is a periodic snapshot of UNSAVED, in-progress changes', 'Backup files are created automatically every few seconds; auto-save files only happen on manual save', 'Auto-save files replace the need for ever pressing C-x C-s'],
      correct: 1,
      explain: 'A backup (~) captures the state right before an actual save overwrites it — a one-step-back safety net for saves. An auto-save (#...#) captures unsaved, in-progress work — a crash-recovery safety net.'
    }
  ],
  pitfalls: [
    'Assuming a file exists on disk after typing its name into C-x C-f — nothing is written until an actual save (C-x C-s or C-x C-w).',
    'Deleting files in Dired without noticing the two-step mark-then-execute pattern, or panicking mid-way thinking a mark alone has already deleted something — marking is reversible with u, only x actually commits.',
    'Not knowing auto-save (#file#) and backup (file~) files exist, then being confused (or accidentally committing them to version control) when they show up in a directory listing.'
  ],
  interview: [
    {
      q: 'Explain what actually happens, step by step, from opening a nonexistent file with C-x C-f through to it genuinely existing on disk.',
      a: 'C-x C-f prompts for a path; if no file exists there, Emacs creates a new, empty buffer associated with that path, but does NOT write anything to disk at this point — the buffer exists purely in memory. As you type, the mode-line shows the buffer as modified. Only when you actually save — C-x C-s (save under the same path) or C-x C-w (save under a different path) — does Emacs write the buffer\'s content to disk for the first time, at which point the file genuinely comes into existence and the mode-line\'s modified indicator clears. This mirrors the general buffer/disk separation covered throughout this Part: a buffer is in-memory content, synchronized with disk only on an explicit save action.'
    },
    {
      q: 'Explain the difference between auto-save files and backup files, including a concrete scenario where each one specifically would save you.',
      a: 'Auto-save files (#filename#) are periodic snapshots of UNSAVED, in-progress content, written automatically by Emacs without ever touching the real file. Concrete scenario: you have been editing a file for twenty minutes without saving, and your machine crashes — reopening the file and running M-x recover-file can restore that unsaved work from the auto-save file, which would otherwise be entirely lost. Backup files (filename~) are a snapshot of the PREVIOUSLY SAVED version, created automatically at the moment a new save overwrites it. Concrete scenario: you save a file, then immediately realize the save itself was a mistake (accidentally saved a half-finished, broken edit) — the ~ backup lets you recover the version that existed just before that unwanted save, something the auto-save mechanism does not address at all, since it only concerns unsaved work, not prior saved states.'
    },
    {
      q: 'Why is Dired\'s file-deletion process deliberately two steps (mark/flag, then execute) rather than a single immediate action?',
      a: 'Deleting files is a genuinely consequential, hard-to-reverse action, and Dired\'s design deliberately separates SELECTING what to delete (marking or flagging, both trivially reversible with u before anything actually happens) from COMMITTING to the deletion (x, which executes the flagged operations, typically with an additional confirmation prompt). This gives a real opportunity to review the exact set of files about to be deleted — especially valuable when marking multiple files across a directory listing, where a single accidental keypress on the wrong entry could otherwise delete something unintended. It mirrors a broader theme from elsewhere in this curriculum\'s sibling course (previewing before committing to an irreversible action) applied here specifically to file deletion.'
    },
    {
      q: 'A teammate asks why they are seeing strange files named like "#draft.txt#" and "draft.txt~" in their project directory. What would you tell them, and would you recommend committing either to version control?',
      a: '"#draft.txt#" is Emacs\'s auto-save file — a periodic snapshot of unsaved, in-progress edits, meant purely for local crash recovery and regenerated/removed automatically in normal use. "draft.txt~" is a backup of the previously saved version, created automatically the moment a new save overwrites the file, meant as a local one-step-back safety net. Neither is meant to be committed to version control: they are purely local, ephemeral safety nets specific to a single machine\'s editing session, not meaningful project content, and committing them typically just adds noise to a repository\'s history. The standard fix is adding both patterns (#*# and *~) to the project\'s .gitignore (or equivalent) so they never get accidentally staged in the first place.'
    }
  ]
};
