window.LESSONS = window.LESSONS || {};
window.LESSONS['version-control-with-magit'] = {
  id: 'version-control-with-magit',
  title: 'Magit: The Git Interface That Converts People to Emacs',
  category: 'Part 6 — Working With Code',
  timeMin: 45,
  summary: 'Magit is not "a thin wrapper that types git commands for you" — it is a genuinely reimagined interface to git, structured and foldable exactly like Org mode\'s outlines from the previous Part, letting you stage a single specific chunk of a file\'s changes, review every consequential action before it actually happens, and see your repository\'s entire state at a glance. It is regularly cited, well outside the Emacs community, as one of the best version-control interfaces built for any tool — and it is genuinely why some developers adopt Emacs at all.',
  goals: [
    'Open the Magit status buffer with C-x g, and read its structured, foldable layout',
    'Stage a single hunk (not just a whole file) with s, and unstage with u',
    'Commit staged changes with c c, including the deliberate two-step confirm',
    'Push and fetch using Magit\'s transient (popup) menus',
    'Explain why staging by hunk, and reviewing before pushing, are genuinely different from git\'s raw command-line workflow'
  ],
  concept: [
    {
      h: 'Magit is not a wrapper — it is a genuinely different interface to git',
      p: [
        'It is tempting to describe Magit as "a way to type git commands without leaving Emacs," but that undersells it considerably. Magit is a structured, VISUAL, interactive interface built directly on top of git\'s actual functionality — showing you your repository\'s real state (staged changes, unstaged changes, recent commit history, current branch) as a genuinely navigable, foldable document, rather than requiring you to separately run and mentally reconstruct the results of several individual git commands (git status, git diff, git log) to build that same picture yourself.',
        'This is precisely why Magit is regularly cited — including well outside the Emacs community specifically — as one of the best version-control interfaces built for ANY editor or tool, and why some developers genuinely adopt Emacs specifically to use Magit, using very little else about Emacs day to day, in exactly the same way the previous lesson described Org mode converting people to Emacs on its own merits.'
      ]
    },
    {
      h: 'C-x g: the status buffer, foldable exactly like an Org outline',
      p: [
        '<code>C-x g</code> (magit-status) opens the status buffer — a live, structured view of your current repository\'s state, organized into distinct SECTIONS: unstaged changes, staged changes, recent commits, and more. Each section can be expanded or collapsed with <code>TAB</code> — the exact same folding mechanism from the previous Part\'s Org mode lesson, applied here to git status information instead of an outline\'s headings, letting you see the high-level shape of what has changed before drilling into any one specific file or hunk\'s actual detail.',
        'This structured overview is the direct foundation everything else in this lesson builds on — rather than staging or committing "blindly," you are always looking at a live, current, navigable picture of exactly what is about to happen before you actually commit to any action.'
      ]
    },
    {
      h: 'Staging by HUNK, not just by whole file',
      p: [
        'Pressing <code>s</code> with point on a specific change stages it — and this is where Magit genuinely distinguishes itself: point can be on an entire FILE (staging every change in it), or on just ONE HUNK — a single, specific, contiguous chunk of changed lines within a file — letting you stage PART of a file\'s changes while leaving the rest unstaged, to be committed separately, later, as a genuinely distinct, focused commit. <code>u</code> unstages, the same way, at whatever granularity point currently is (whole file or single hunk).',
        'This matters practically: real editing sessions often produce a mix of genuinely unrelated changes within the same file (a small unrelated typo fix alongside a substantive feature change) — hunk-level staging lets you commit those as two separate, individually coherent commits, rather than being forced to either bundle unrelated changes together in one commit, or manually undo and redo edits just to separate them, which raw git\'s file-level (or manually-patch-edited) staging makes considerably more awkward.'
      ]
    },
    {
      h: 'Committing: a deliberate, two-step confirm',
      p: [
        '<code>c c</code> (commit, then the "create" sub-action) opens a dedicated buffer for writing your commit message. Critically, typing the message alone does not commit anything — you then press <code>C-c C-c</code> WITHIN that message buffer to actually finalize the commit. This is a genuinely deliberate two-step design, not an extra hoop to jump through for its own sake: write the message, review it, and explicitly confirm — directly mirroring the "preview before committing to something consequential" pattern this whole course has emphasized elsewhere (a sed substitution before adding -i, a query-replace match reviewed before confirming).',
        'Pressing <code>P</code> (push) or <code>F</code> (fetch/pull) does not immediately push or pull either — it opens a TRANSIENT menu, a temporary popup listing every relevant option for that action (which remote, whether to force-push, and more), letting you review and choose precisely before anything with real, sometimes hard-to-reverse consequences (like a push to a shared remote) actually happens. Magit consistently favors "show me exactly what is about to happen, then let me confirm it deliberately" over a single blind keypress immediately executing something consequential.'
      ]
    }
  ],
  conceptFlow: {
    title: 'Staging just ONE hunk out of a file with two separate changes',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'One file, two unrelated changes',
        nodes: [
          { id: 'file', text: 'app.py has TWO separate hunks:\nhunk 1: fixed a typo in a comment\nhunk 2: added a real new feature' }
        ]
      },
      {
        label: 'Magit shows both, separately, foldable',
        nodes: [
          { id: 'status', text: 'C-x g shows app.py under\n"Unstaged changes" — expand it\nto see BOTH hunks, individually' }
        ]
      },
      {
        label: 'Stage only ONE of them',
        nodes: [
          { id: 'stage', text: 'Point on hunk 2 (the real feature) —\npress s — ONLY that hunk moves\nto "Staged changes"' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'result', text: 'hunk 1 (typo fix) is STILL unstaged.\nhunk 2 (feature) is staged, ready\nto be committed on its own' }
        ]
      }
    ],
    steps: [
      { active: ['file'], note: 'One file, app.py, contains two genuinely unrelated changes — a small typo fix and a real new feature — that happen to have been made in the same editing session.' },
      { active: ['status'], note: 'C-x g shows app.py under "Unstaged changes," and expanding it (via TAB, same as an Org heading) reveals both hunks individually, each independently visible and independently actionable.' },
      { active: ['stage'], note: 'With point specifically on hunk 2 (the feature change), pressing s stages ONLY that hunk — not the whole file, not hunk 1 too — moving just that one contiguous chunk into "Staged changes."' },
      { active: ['result'], note: 'The result: hunk 1 (the typo fix) remains completely unstaged, untouched, available to be committed separately later, while hunk 2 is now staged and ready to be committed on its own, as a clean, focused commit containing only the actual feature change — exactly the kind of separation raw file-level staging could not achieve nearly as easily.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Franky\'s Structured Modification Review, One Change at a Time',
      text: 'Before ANY modification to the Sunny becomes officially logged as done, Franky runs it through a structured review process, and the structure itself is exactly what makes it manageable even during a busy repair day with a dozen proposed changes pending at once. He does not review changes as one undifferentiated pile — he keeps them organized into clear, foldable categories: proposed-but-not-yet-approved changes in one section, already-approved-and-logged changes in another, recent completed work in a third, letting him collapse whichever section he does not currently need and expand exactly the one he does. Here is the part that genuinely separates his process from a cruder "approve the whole batch or reject the whole batch" system: when a single proposed modification actually bundles two genuinely UNRELATED changes together — say, someone fixed a loose bolt while ALSO, separately, adding a whole new compartment — Franky does not have to approve or reject both together. He can approve and officially log just the bolt fix specifically, leaving the new compartment addition sitting as a separate, still-pending item to be reviewed and logged on its own, later. And officially logging any approved change is deliberately a TWO-STEP process — write down exactly what changed and why, then a completely separate, explicit confirmation step before it is genuinely finalized in the ship\'s record — never a single quick mark that instantly makes something official. Before anything actually gets reported OUTWARD to the wider crew or another ship (the equivalent of pushing to a shared remote), Franky insists on one more review step specifically for that: a full rundown of exactly what is about to be sent out, with room to reconsider, before it actually goes.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Structured Apartment-Change Review, One Change at a Time',
      text: 'Before any change to the shared apartment becomes officially recognized as part of the Roommate Agreement\'s current state, Sheldon runs it through a structured review, and the structure is exactly what keeps it manageable even when several proposed changes are pending simultaneously. He does not review proposals as one undifferentiated pile — he keeps them organized into clear, foldable categories: proposed-but-not-yet-approved changes in one section, already-approved changes in another, recently finalized changes in a third, collapsing whichever section he does not currently need and expanding exactly the one he does. The part that genuinely separates his process from a crude "approve everything proposed today, or reject everything" system: when a single proposal actually bundles two genuinely UNRELATED changes together — say, Leonard suggests moving a shelf WHILE ALSO, separately, proposing a change to the thermostat schedule — Sheldon does not have to approve or reject both together. He can approve and officially finalize just the shelf move specifically, leaving the thermostat proposal sitting as a separate, still-pending item to be reconsidered on its own, later. And finalizing any approved change is deliberately a TWO-STEP process — write down precisely what is changing and why, then a completely separate, explicit confirmation before it is genuinely locked in — never a single quick mark that instantly makes something official. And before anything actually gets reported OUTWARD to the building\'s landlord (the equivalent of pushing to a shared remote), Sheldon insists on one more dedicated review specifically for that step: a full rundown of exactly what is about to be sent, with room to reconsider, before it actually goes out.'
    },
    why: 'Franky\'s and Sheldon\'s structured, foldable review categories are exactly Magit\'s status buffer sections. Their ability to approve just ONE bundled change while leaving a related-but-separate one pending is exactly hunk-level staging. Their deliberate two-step "write it down, then explicitly confirm" finalization is exactly c c followed by C-c C-c. And their extra review step specifically before anything goes to the landlord/another ship is exactly Magit\'s transient push menu — one more deliberate checkpoint before a consequential, outward-facing action actually happens.'
  },
  tech: [
    {
      q: 'Give a concrete, realistic scenario where hunk-level staging produces a genuinely better commit history than file-level staging would.',
      a: 'A developer is implementing a real feature in app.py, and partway through, notices and fixes an unrelated typo in a comment a few lines above their actual work. With file-level staging (git add app.py, or Magit staging the whole file at once), both changes would end up bundled into ONE commit, even though they are conceptually unrelated — making that commit\'s history less clean, and making it harder later to, say, revert just the feature (if it turns out to have a bug) without ALSO reverting the unrelated typo fix that happened to share the same commit. Hunk-level staging lets the developer stage and commit just the typo fix as its own small, focused commit, and separately stage and commit the actual feature — producing a commit history where each commit genuinely represents ONE coherent change, meaningfully easier to review, revert, or reason about individually later.'
    },
    {
      q: 'Why does Magit require an explicit C-c C-c inside the commit-message buffer, rather than committing the moment you finish typing a message and, say, press RET?',
      a: 'A commit message often genuinely benefits from being MULTI-LINE (a short summary line, a blank line, then a longer explanatory body) — if a plain RET press committed immediately, there would be no way to write a message spanning more than one line without accidentally finalizing the commit prematurely partway through typing it. Requiring an explicit, separate confirmation key (C-c C-c) decouples "I am done typing text" from "I am done typing text AND I genuinely want to commit now" — letting you freely write, review, and revise a multi-line message within that buffer, using ordinary editing commands from earlier lessons, before deliberately confirming you are actually satisfied with it and ready to finalize.'
    },
    {
      q: 'Why does Magit use a transient (popup) menu for push/fetch rather than immediately executing the action on a single keypress, the way staging a hunk with "s" does?',
      a: 'Staging a hunk is a genuinely LOCAL, easily-reversible action — it only affects your own local staging area, and unstaging it back (with u) is trivial and has no consequences beyond your own machine. Pushing, by contrast, is an action with real, potentially hard-to-reverse, OUTWARD-FACING consequences — it affects a SHARED remote repository, potentially visible to and affecting other people\'s work immediately, and options like force-pushing can genuinely destroy others\' work if used carelessly. The transient menu exists specifically to surface every relevant option (which remote, force or not, and more) for review BEFORE any of it actually executes, matching the level of deliberate caution appropriate to an action whose consequences reach beyond your own local machine — exactly the kind of "preview before committing to something consequential" instinct this course has emphasized in several other, unrelated contexts.'
    }
  ],
  code: {
    title: 'A real Magit workflow: status, hunk-staging, committing, pushing',
    intro: 'Try this in any real git repository — Magit ships built into most modern Emacs configurations once installed via use-package.',
    code: `C-x g
;; Opens the Magit status buffer:
;; Head:     main
;; Unstaged changes (1)
;;   app.py
;; Untracked files (1)
;;   notes.txt

;; TAB on "app.py" expands it to show the actual diff, hunk by hunk:
;; @@ -10,3 +10,3 @@ def greet():
;; -    print("hi")
;; +    print("hello")
;; @@ -25,0 +26,4 @@ def new_feature():
;; +    ...(a genuinely separate, unrelated block of new code)...

;; Point on JUST the first hunk (the print change):
s
;; Only that hunk moves to "Staged changes" — the second hunk (new_feature)
;; remains unstaged, untouched.

c c
;; Opens a commit message buffer. Type:
Fix greeting capitalization

;; Then, to actually finalize:
C-c C-c
;; NOW the commit is created — containing ONLY the staged hunk.

;; Back in the status buffer, the second hunk is still sitting there,
;; unstaged — stage and commit it separately, whenever ready:
s
c c
Add new_feature function
C-c C-c

;; Pushing — opens a transient menu rather than pushing immediately:
P
;; A popup shows options: p (push to configured upstream), -f (force), etc.
p
;; NOW it actually pushes, having reviewed the options first.`,
    notes: [
      'TAB on any section in the status buffer (Unstaged changes, a specific file, a specific hunk) works exactly like Org\'s heading folding — the same underlying mechanism, applied to git status information.',
      'Magit\'s transient menus (like the one P opens) are themselves a general-purpose Emacs mechanism, also used elsewhere in Magit for many other multi-option actions, not something invented uniquely for push.'
    ]
  },
  lab: {
    title: 'Write the right Magit key sequences for each scenario',
    prompt: 'Write exactly the key sequence for each task below.',
    starter: `# Task: open the Magit status buffer for the current repository


# Task: stage whatever change (file or hunk) point is currently on


# Task: unstage it again


# Task: commit whatever is currently staged, writing "Fix typo" as the message
# (write this as TWO separate steps: opening the commit buffer, and confirming it)


# Task: open the push menu (without yet actually pushing)

`,
    checks: [
      { re: 'C-x\\s+g', flags: '', must: true, hint: 'C-x g opens the Magit status buffer.', pass: 'C-x g ✓' },
      { re: '^s$|\\bs\\b', flags: 'im', must: true, hint: 's stages whatever point is currently on.', pass: 's ✓' },
      { re: '^u$|\\bu\\b', flags: 'im', must: true, hint: 'u unstages.', pass: 'u ✓' },
      { re: 'c\\s+c[\\s\\S]*Fix typo[\\s\\S]*C-c\\s+C-c', flags: 'i', must: true, hint: 'c c opens the commit buffer, type the message, then C-c C-c confirms it.', pass: 'c c, message, C-c C-c ✓' },
      { re: '^P$|\\bP\\b', flags: 'm', must: true, hint: 'P (capital) opens the push transient menu.', pass: 'P ✓' }
    ],
    run: 'Try it for real: make a small change to a scratch git repo, C-x g, stage just one hunk if the file has multiple changes, and commit it.',
    solution: `# Task: open the Magit status buffer for the current repository
C-x g

# Task: stage whatever change (file or hunk) point is currently on
s

# Task: unstage it again
u

# Task: commit whatever is currently staged, writing "Fix typo" as the message
# (write this as TWO separate steps: opening the commit buffer, and confirming it)
c c
Fix typo
C-c C-c

# Task: open the push menu (without yet actually pushing)
P`,
    notes: [
      'Note the task deliberately stopped at "open the push menu" — actually pushing requires a further keypress (like p) from within that transient menu, a genuinely separate, deliberate second step.',
      's and u are context-sensitive — they act on whatever point is currently positioned on (a whole file section, or one specific hunk within it), exactly matching this lesson\'s core distinction.'
    ]
  },
  quiz: [
    {
      q: 'Why is Magit described as more than "a wrapper for typing git commands"?',
      options: ['It does not actually use git at all underneath', 'It provides a structured, visual, foldable interface to git\'s actual state, rather than requiring you to mentally reconstruct that picture from separate command outputs', 'It replaces git entirely with its own incompatible version-control system', 'Magit and git are unrelated tools that happen to share similar names'],
      correct: 1,
      explain: 'Magit builds a genuine, structured, navigable view of your repository state — closer to a real interface than a thin command-typing convenience layered over raw git output.'
    },
    {
      q: 'What can be staged with "s" at the hunk level that file-level staging cannot achieve as easily?',
      options: ['Staging an entire file at once', 'Staging just ONE specific, contiguous chunk of changes within a file, leaving other unrelated changes in that same file unstaged', 'Staging changes across multiple repositories simultaneously', 'Staging a file that has not been modified at all'],
      correct: 1,
      explain: 'Hunk-level staging lets genuinely unrelated changes within the same file be committed as separate, focused commits — something file-level staging bundles together indiscriminately.'
    },
    {
      q: 'What does "c c" followed by typing a message alone actually accomplish, without also pressing C-c C-c?',
      options: ['It immediately creates the commit', 'It opens a commit-message buffer and lets you write the message, but does NOT finalize the commit until C-c C-c is explicitly pressed', 'It does nothing at all until you restart Emacs', 'It permanently deletes any unstaged changes'],
      correct: 1,
      explain: 'c c opens the message-writing buffer; the commit is only actually finalized with the separate, explicit C-c C-c confirmation — a deliberate two-step process, not committed prematurely by RET or finishing typing.'
    },
    {
      q: 'Why does pressing P (push) open a transient menu instead of immediately pushing?',
      options: ['Because push is a purely local, harmless action needing no review', 'Because push has real, potentially hard-to-reverse consequences affecting a shared remote, so Magit surfaces the relevant options for deliberate review before anything actually executes', 'P is simply a typo-prevention measure unrelated to the action\'s consequences', 'Transient menus are used for every single Magit action with no exceptions'],
      correct: 1,
      explain: 'Push affects a shared remote repository with real, sometimes hard-to-reverse consequences — the transient menu lets you review options (like which remote, or force-push) before committing to the action.'
    },
    {
      q: 'What does TAB do on a section in the Magit status buffer, like "Unstaged changes" or a specific file?',
      options: ['Deletes that section permanently', 'Expands or collapses that section — the same folding mechanism as Org mode headings from the previous lesson', 'Stages every change in that section immediately', 'Opens a completely separate application'],
      correct: 1,
      explain: 'TAB folds/unfolds sections in the status buffer exactly like Org mode\'s heading visibility cycling — letting you see the big picture and drill into specifics as needed.'
    }
  ],
  pitfalls: [
    'Staging (or committing) an entire file out of habit when the file actually contains two genuinely unrelated changes — hunk-level staging with "s" on just the relevant hunk keeps commits focused and coherent.',
    'Assuming typing a commit message and pressing RET commits it — the message buffer requires the separate, explicit C-c C-c to actually finalize the commit.',
    'Pressing P and being surprised nothing was actually pushed yet — P opens the transient menu; an additional keypress from within that menu (like p) is what actually executes the push.'
  ],
  interview: [
    {
      q: 'Explain why hunk-level staging is considered a genuine, meaningful improvement over file-level staging, not just a minor convenience.',
      a: 'Real editing sessions frequently produce a mix of genuinely unrelated changes within the same file — a substantive feature alongside an incidental typo fix, or two separate bug fixes touched while working on one broader task. File-level staging forces a binary choice: bundle all of a file\'s changes into one commit (producing a commit history where individual commits do not represent one coherent change, making later review or reverting harder), or manually, awkwardly separate the changes through some other means before committing. Hunk-level staging solves this directly — a specific contiguous chunk of changed lines can be staged and committed independently of other unrelated changes in the SAME file, producing a commit history where each commit genuinely represents one focused, coherent change, which is meaningfully easier to review, understand, and selectively revert later than a history full of commits bundling unrelated changes together purely because they happened to touch the same file.'
    },
    {
      q: 'Walk through why Magit\'s commit process is deliberately two steps (c c, then C-c C-c) rather than one, and connect this design choice to a broader pattern.',
      a: 'The two-step design decouples "writing a commit message" from "finalizing the commit" — necessary because a genuinely good commit message often spans multiple lines (a short summary, then an explanatory body), and a single-key-commits-immediately design would make writing anything beyond a one-line message genuinely awkward or risky. This mirrors a broader "preview and deliberately confirm before committing to something consequential" pattern seen elsewhere in good tooling design — reviewing a sed substitution before adding -i to make it permanent, reviewing each match in a query-replace before confirming it, reviewing a dry-run rsync before actually running the real sync. Magit\'s commit process applies that same underlying principle specifically to the moment of creating a permanent entry in a project\'s history, which is exactly the kind of action worth a genuine, deliberate confirmation step rather than a single, easily-mistaken keypress.'
    },
    {
      q: 'A team member argues that Magit\'s transient menus (for push, and other multi-option actions) add unnecessary friction compared to git\'s single-command CLI equivalents. How would you respond?',
      a: 'For a LOCAL-only, low-consequence action, that friction argument has some merit — but push specifically is not a local action; it affects a SHARED remote repository, with options like force-push carrying real potential to destroy other people\'s work if chosen carelessly. The transient menu\'s "friction" is really just surfacing exactly which options are available (which remote, force or not, and more) for deliberate review before an action with real, outward-facing, potentially destructive consequences actually executes — arguably the RIGHT amount of friction for an action at that risk level, rather than unnecessary overhead. It is also worth noting the friction is genuinely minimal in practice for the common case: pressing P then p (push to the default configured upstream) is barely more typing than git push directly, while still providing the review opportunity when something more consequential (like a force-push) is actually being considered.'
    },
    {
      q: 'Why might Magit specifically, rather than Emacs generally, be the reason a developer who otherwise prefers a different editor still keeps Emacs installed and uses it regularly?',
      a: 'Magit\'s combination of a genuinely structured, foldable overview of repository state, hunk-level staging granularity, and deliberate confirmation steps before consequential actions represents a meaningfully different (and, by wide community consensus across and beyond the Emacs ecosystem, often preferred) approach to version-control interaction compared to most other editors\' git integrations or the raw command line. For a developer who spends substantial daily time interacting with git — reviewing diffs, staging changes carefully, committing focused history — that difference in quality of interaction can be significant enough, on its own, to justify keeping Emacs open specifically for Magit, using it alongside (or occasionally instead of) a preferred primary editor for the actual code-writing work, similar to how the previous lesson described Org mode\'s standalone appeal independent of adopting Emacs as a full, general-purpose editor for everything.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover the everyday stage/commit/push workflow thoroughly. This is what is underneath: interactive rebasing through Magit\'s structured interface, resolving merge conflicts, and magit-blame.',
    sections: [
      {
        h: 'Interactive rebase, made considerably more approachable',
        p: [
          'Git\'s interactive rebase (<code>git rebase -i</code>) is a genuinely powerful but notoriously fiddly feature for editing commit history — reordering, squashing, or rewording past commits — normally requiring careful, error-prone manual editing of a plain-text instruction list in an external editor. Magit exposes the exact same underlying git capability through its own structured, foldable interface instead: a rebase menu lets you visually reorder commits (moving them up/down directly in the buffer), mark commits for squashing or rewording with single keypresses, and see the resulting plan clearly laid out before actually executing it — genuinely the same operation git always supported, made considerably less error-prone by Magit\'s structured, reviewable presentation of it.'
        ]
      },
      {
        h: 'Resolving merge conflicts within Magit\'s own interface',
        p: [
          'When a merge or rebase produces conflicts, Magit\'s status buffer shows conflicted files clearly flagged as their own distinct section, and Magit integrates with Emacs\'s built-in <code>smerge-mode</code> (or an external merge-conflict-resolution tool of your choosing) to navigate directly to each conflict marker and choose which version to keep — all without ever leaving Emacs, and with the same structured, foldable overview showing exactly which files still have unresolved conflicts remaining at any point during the process.'
        ]
      },
      {
        h: 'magit-blame: who changed this line, and why',
        p: [
          '<code>magit-blame</code>, run on a buffer visiting a version-controlled file, annotates each line directly in the buffer with information about which commit last changed it — genuinely useful for understanding WHY a specific piece of code looks the way it does, since you can jump directly from a blamed line to that commit\'s full message and diff for more context, without needing to separately run and cross-reference git blame\'s raw command-line output against git log by hand.'
        ]
      }
    ]
  }
};
