window.LESSONS = window.LESSONS || {};
window.LESSONS['org-mode-essentials'] = {
  id: 'org-mode-essentials',
  title: 'Org Mode Essentials: Outlines, TODOs & the Agenda',
  category: 'Part 5 — Modes: The Emacs Superpower',
  timeMin: 45,
  summary: 'Org mode is, at its core, just a major mode for plain text files — the same idea as everything in Part 5 so far. What it does with that plain text is genuinely remarkable: nested outlines from nothing more than asterisks, real task tracking with TODO states, and an agenda that pulls scheduled work together across every Org file you have into one combined view. Widely considered Emacs\'s single most compelling reason to actually adopt it, even by people who use almost nothing else in Emacs.',
  goals: [
    'Explain Org mode\'s core idea: structure derived entirely from asterisks in plain text',
    'Create a nested outline, and use TAB to cycle a heading\'s visibility (collapsed/children/expanded)',
    'Mark a heading as a TODO item and cycle its state with C-c C-t',
    'Configure org-agenda-files and open the combined agenda view with C-c a',
    'Create a simple table using Org\'s built-in | syntax'
  ],
  concept: [
    {
      h: 'Org\'s core idea: structure from nothing more than asterisks',
      p: [
        'An Org file is, underneath everything else, just an ordinary plain text file — the "structure" Org mode displays and lets you navigate comes entirely from a genuinely simple convention: a line starting with one or more <code>*</code> characters is a HEADING, and the number of asterisks IS its nesting depth. <code>* Project</code> is a top-level heading; <code>** Research</code> right below it, with two asterisks, is nested one level deeper, a child of "Project"; <code>*** Read paper</code> with three asterisks nests one level deeper still.',
        'This matters beyond just being simple to learn: because the entire structure lives as literal, visible text characters (not some hidden formatting layer or proprietary file format), an Org file remains fully readable and editable in ANY plain text editor, on any machine, forever — genuinely portable, with none of the lock-in risk a proprietary note-taking or task-management app\'s own file format would carry. This is the exact same plain-text philosophy this whole course, and Emacs generally, has been built around from Part 0 onward.'
      ]
    },
    {
      h: 'TAB cycles visibility: fold away detail you do not currently need',
      p: [
        'Pressing <code>TAB</code> with point on a heading cycles that heading through visibility states — collapsed (showing just the heading itself, everything nested underneath hidden), children visible (one level of sub-headings shown, their own content still hidden), and fully expanded (everything shown). This is genuinely useful for a large document: you can see just the high-level OUTLINE first — every top-level heading, nothing else — and drill down into exactly the one section you actually need right now, rather than scrolling through everything at once.',
        'Nothing is ever actually DELETED by folding — collapsed content is simply hidden from view, still fully present in the buffer, instantly available again the moment you TAB that heading back open. This is purely a viewing convenience, not a destructive action of any kind.'
      ]
    },
    {
      h: 'TODO keywords: turning a heading into a genuine, trackable task',
      p: [
        'Any heading can become a task by prefixing it with a KEYWORD — typing <code>TODO</code> right after the asterisks (<code>** TODO Write the report</code>) marks that heading as an active task. <code>C-c C-t</code>, with point on that heading, CYCLES it through a configurable sequence of states — by default, <code>TODO</code> → <code>DONE</code> → (no keyword at all) → back to TODO — letting you mark progress without retyping anything.',
        'This is a genuinely lightweight mechanism — no separate task-tracking application, no special task "object" distinct from an ordinary heading — a TODO item is simply a heading with a specific keyword prefix, using the exact same outline structure, folding, and editing as every other heading in the document.'
      ]
    },
    {
      h: 'The agenda: pulling TODOs together across every Org file, by date',
      p: [
        'A single Org file\'s outline is genuinely useful on its own, but the real payoff for actual task management is the <b>agenda</b>: <code>org-agenda-files</code> (set in your init.el) lists every Org file you want included, and <code>C-c a</code> opens the agenda dispatcher, from which a simple agenda view pulls together every SCHEDULED or DEADLINE-tagged item across ALL of those files into one combined, date-organized view — genuinely useful the moment work is spread across multiple project files (a personal file, a work file, a specific project\'s own notes file) rather than one single monolithic document.',
        'This is precisely why Org is so often cited as the feature that converts people to using Emacs at all, even if they use very little else about it: the combination of "just plain text, fully under your own control" with "a genuinely capable, cross-file task/schedule view" is a real, distinctive capability most dedicated task-management apps do not offer in quite the same form — plain-text portability AND real agenda functionality, together, rather than having to choose one or the other.'
      ]
    }
  ],
  conceptFlow: {
    title: 'Three separate Org files, pulled into ONE agenda view',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Three separate files',
        nodes: [
          { id: 'file1', text: 'work.org\nTODO Finish report SCHEDULED: <2026-07-20>' },
          { id: 'file2', text: 'personal.org\nTODO Dentist DEADLINE: <2026-07-18>' },
          { id: 'file3', text: 'project.org\nTODO Review PR SCHEDULED: <2026-07-18>' }
        ]
      },
      {
        label: 'org-agenda-files knows about all three',
        nodes: [
          { id: 'config', text: 'org-agenda-files lists\nwork.org, personal.org, project.org' }
        ]
      },
      {
        label: 'C-c a pulls them together',
        nodes: [
          { id: 'pull', text: 'C-c a opens the agenda —\nchecks EVERY listed file for dated items' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'result', text: 'ONE combined view, organized by DATE,\nregardless of which file each item actually lives in' }
        ]
      }
    ],
    steps: [
      { active: ['file1'], note: 'work.org has one scheduled task, entirely separate from anything in the other two files.' },
      { active: ['file2'], note: 'personal.org, a completely different file, has its own separate deadline-tagged task.' },
      { active: ['file3'], note: 'project.org has yet another task, scheduled for the same date as personal.org\'s deadline — but living in a third, entirely separate file.' },
      { active: ['config'], note: 'org-agenda-files is the configuration that tells Org WHICH files to even consider when building an agenda — without a file listed here, its TODOs are invisible to the agenda entirely, even if perfectly well-formed.' },
      { active: ['pull'], note: 'Pressing C-c a triggers Org to scan every file listed in org-agenda-files for scheduled/deadline items — this happens live, not from some separately-maintained duplicate list.' },
      { active: ['result'], note: 'The result is ONE view, organized purely by DATE — July 18th shows both the dentist deadline from personal.org and the PR review from project.org side by side, even though those two tasks live in completely different files and have nothing else to do with each other. This cross-file, date-first view is exactly the payoff a single file\'s own outline alone could never provide.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Nami\'s Nested Logbook, and the Morning Board That Pulls Every Crew Member\'s List Together',
      text: 'Nami\'s personal logbook uses a nesting system so simple that any crew member could read and understand it cold, without her ever having to explain the system first: a single dash marks a main topic, two dashes marks a sub-point nested under it, three dashes nests deeper still — nothing more exotic than that, and genuinely just ordinary handwriting on an ordinary page, readable by anyone who happens to pick it up, with no special decoder needed. When she is scanning for the big picture, she does not read every nested sub-point in full — she deliberately looks at just the main topics first, folding her attention away from the details she does not currently need, and only actually reads into a specific section\'s full nested detail the moment she genuinely needs it. Separately, and this is the part that actually runs the ship\'s daily operations, Nami keeps a morning planning board that does something no single crew member\'s own personal list could do alone: it pulls together Usopp\'s own task list, Franky\'s own repair list, Sanji\'s own supply list — each maintained completely separately by its own owner — into ONE combined view, organized purely by WHEN each item is actually due, regardless of whose list it originally came from. Chopper, seeing a repair deadline and a supply deadline sitting right next to each other on the morning board despite belonging to completely different crew members\' completely separate lists, asks how Nami keeps track of everyone\'s stuff individually. Nami\'s answer: "I do not maintain their lists myself at all — I just know which lists to CHECK every morning, and I pull them together by date. Everyone still owns their own list."'
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s Nested Planning Binder, and the Master Calendar That Pulls Everyone\'s List Together',
      text: 'Monica\'s planning binder uses a nesting system simple enough that anyone flipping through it could understand it without her explaining anything first: one bullet marks a main category, an indented bullet marks a sub-item nested under it, a further-indented bullet nests deeper still — nothing more exotic than that, genuinely just ordinary handwritten notes on an ordinary page, readable by anyone, no special key needed to decode it. When she is trying to see the big picture of an event she is planning, she does not read every nested sub-item in full — she deliberately scans just the main categories first, mentally folding away detail she does not currently need, and only actually reads into a specific category\'s full nested detail the moment she genuinely needs to. Separately, and this is the part that actually keeps the group\'s plans running smoothly, Monica keeps a master calendar that does something no single person\'s own individual to-do list could do alone: it pulls together Rachel\'s own to-do list, Chandler\'s own errand list, Ross\'s own list of things he needs to do — each maintained completely separately by its own owner — into ONE combined view, organized purely by WHEN each item is due, regardless of whose list it originally came from. Joey, noticing one of Chandler\'s errands and one of Rachel\'s tasks sitting right next to each other on the master calendar despite the two of them keeping completely separate personal lists, asks how Monica tracks everyone\'s individual stuff so precisely. Monica\'s answer: "I do not maintain their lists for them at all — I just know which lists to check, and I pull them together by date. Everyone still keeps their own list."'
    },
    why: 'Nami\'s and Monica\'s simple nested-marker system, readable by anyone with no special explanation needed, is exactly Org\'s asterisk-based plain-text structure. Their habit of folding attention to just the main topics until a specific detail is actually needed is exactly TAB-based visibility cycling. And the morning board or master calendar pulling multiple SEPARATELY-maintained lists together into one combined, date-organized view — without absorbing or duplicating anyone\'s original list — is exactly the Org agenda, built from org-agenda-files.'
  },
  tech: [
    {
      q: 'Why does it matter, in a genuinely practical sense, that an Org file remains an ordinary plain text file rather than a specialized, proprietary format?',
      a: 'A proprietary note-taking or task-management app\'s own file format is only ever readable by that specific app (or a tool someone has separately built to parse it) — if that app is discontinued, changes its format incompatibly, or simply is not installed on a machine you happen to be using, your actual notes and tasks become genuinely inaccessible or require a conversion step to recover. An Org file, being ordinary plain text with structure conveyed entirely through visible asterisk characters, remains fully readable (even if not as beautifully RENDERED) in literally any text editor, on any machine, indefinitely — copyable, greppable (directly connecting to the linux_course\'s grep lesson, if you have taken it), version-controllable with an ordinary tool like git, with zero risk of the underlying data becoming inaccessible due to some application disappearing or changing formats.'
    },
    {
      q: 'Why is TAB-based visibility cycling genuinely useful for a large document, beyond just being a neat feature?',
      a: 'A sufficiently large Org file (a full project\'s notes, a personal knowledge base accumulated over months) can easily contain far more detail than is useful to see all at once — scrolling through everything, all the time, to find one specific section is genuinely tedious and makes it hard to hold the document\'s overall STRUCTURE in mind. Folding lets you view the document at exactly the level of detail currently relevant: a collapsed, headings-only view for getting oriented and finding the right section, then expanding just that one section for the actual detail you need — mirroring, in a text-based outline, the same "scan the table of contents, then read one specific chapter" workflow that makes any well-organized long document navigable in the first place.'
    },
    {
      q: 'Why is the agenda considered the genuine payoff of Org for real task management, rather than a single file\'s outline being sufficient on its own?',
      a: 'A single Org file\'s outline is excellent for organizing and folding through ONE body of related notes or tasks — but real work is rarely confined to one single file: a work project, personal errands, and a specific side project genuinely benefit from living in SEPARATE, independently-organized files rather than one enormous, mixed document. Without the agenda, checking "what actually needs my attention today" would require manually opening and scanning each of those separate files individually, in turn — genuinely tedious and error-prone (easy to simply forget to check one of them). The agenda solves exactly this by pulling scheduled/deadline items from EVERY configured file into one combined, date-organized view automatically — letting files stay separately organized for their own internal structure while still being reviewable together, by date, in one place, which is precisely the capability that makes Org genuinely competitive with dedicated task-management software rather than just being a nice outlining tool.'
    }
  ],
  code: {
    title: 'A small Org file: headings, TODOs, a table, and the agenda setup',
    intro: 'Try this in a real .org file — Org mode activates automatically via auto-mode-alist for the .org extension, per the previous lesson.',
    code: `* Project Alpha
** TODO Research competitors
   SCHEDULED: <2026-07-18>
** TODO Write first draft
   DEADLINE: <2026-07-25>
*** Outline the sections
*** Draft the introduction
** DONE Set up the repository

;; Pressing TAB on "* Project Alpha" cycles its visibility:
;; collapsed -> children shown -> fully expanded -> collapsed again.

;; Pressing C-c C-t on "** TODO Research competitors" cycles its state:
;; TODO -> DONE -> (no keyword) -> back to TODO

;; A simple table — just type the pipes, Org handles alignment automatically:
| Task              | Owner  | Status |
|--------------------+--------+--------|
| Research           | Nami   | TODO   |
| Draft               | Robin  | TODO   |
;; After typing a | and moving to the next cell (TAB), Org auto-aligns
;; the whole table's columns to line up cleanly.

;; ── In init.el: tell Org which files the agenda should actually check ──
(setq org-agenda-files '("~/org/work.org" "~/org/personal.org" "~/org/project.org"))

;; C-c a  opens the agenda dispatcher
;; then "a" for a simple day/week agenda view, pulling SCHEDULED/DEADLINE
;; items from ALL THREE files above into one combined, date-sorted view.`,
    notes: [
      'SCHEDULED and DEADLINE are both recognized specially by Org\'s agenda — a plain date mentioned in body text, without one of these two specific keywords, will NOT show up in the agenda automatically.',
      'Typing | at the start of a line and then more | characters to separate cells is genuinely all it takes to start a table — Org detects the pattern and begins auto-aligning immediately.'
    ]
  },
  lab: {
    title: 'Write the Org structure and agenda setup for each task',
    prompt: 'Write exactly what each task asks for.',
    starter: `# Task: write a top-level heading called "Groceries" with two TODO
# sub-items nested one level under it: "Buy milk" and "Buy eggs"


# Task: write the key sequence to cycle the visibility of a heading


# Task: write the key sequence to cycle a heading's TODO state


# Task: set org-agenda-files to include two files: "~/org/home.org" and "~/org/work.org"

`,
    checks: [
      { re: '\\*\\s*Groceries[\\s\\S]*\\*\\*\\s*TODO\\s*Buy milk[\\s\\S]*\\*\\*\\s*TODO\\s*Buy eggs', flags: 'i', must: true, hint: '* Groceries\\n** TODO Buy milk\\n** TODO Buy eggs', pass: 'Groceries heading with two TODO sub-items ✓' },
      { re: '^TAB$|\\bTAB\\b', flags: 'im', must: true, hint: 'TAB cycles a heading\'s visibility.', pass: 'TAB ✓' },
      { re: 'C-c\\s+C-t', flags: '', must: true, hint: 'C-c C-t cycles a heading\'s TODO state.', pass: 'C-c C-t ✓' },
      { re: "org-agenda-files[\\s\\S]*home\\.org[\\s\\S]*work\\.org", flags: 'i', must: true, hint: "(setq org-agenda-files '(\"~/org/home.org\" \"~/org/work.org\"))", pass: 'org-agenda-files set with both files ✓' }
    ],
    run: 'Try it for real: create a scratch .org file, add a few TODO headings with SCHEDULED dates, then set org-agenda-files and open C-c a.',
    solution: `# Task: write a top-level heading called "Groceries" with two TODO
# sub-items nested one level under it: "Buy milk" and "Buy eggs"
* Groceries
** TODO Buy milk
** TODO Buy eggs

# Task: write the key sequence to cycle the visibility of a heading
TAB

# Task: write the key sequence to cycle a heading's TODO state
C-c C-t

# Task: set org-agenda-files to include two files: "~/org/home.org" and "~/org/work.org"
(setq org-agenda-files '("~/org/home.org" "~/org/work.org"))`,
    notes: [
      'The number of asterisks is the ONLY thing determining nesting depth — two asterisks nested under one asterisk, three nested under two, and so on, with no other special syntax required.',
      'Without org-agenda-files correctly listing a file, that file\'s TODOs simply will not appear in C-c a\'s combined view, even if they are perfectly well-formed — a genuinely common early mistake.'
    ]
  },
  quiz: [
    {
      q: 'What determines a heading\'s nesting depth in Org mode?',
      options: ['The amount of indentation (spaces) before it', 'The number of asterisks (*) at the start of the line', 'A separate, hidden metadata field not visible in the text', 'The heading\'s font size, set through a menu'],
      correct: 1,
      explain: 'Nesting depth is determined purely by the count of literal asterisk characters at the start of the line — one asterisk for top-level, two for one level deeper, and so on.'
    },
    {
      q: 'Why does it matter that an Org file remains an ordinary plain text file?',
      options: ['It does not matter; Org files are actually a special binary format', 'It means the file stays readable and editable in any text editor, on any machine, with no risk of vendor lock-in', 'Plain text files load faster than any other format', 'Org mode requires a special binary format to function at all'],
      correct: 1,
      explain: 'Because structure is conveyed entirely through visible plain-text characters, an Org file remains fully accessible in any text editor indefinitely — no proprietary format, no lock-in risk.'
    },
    {
      q: 'What does TAB do when point is on a heading?',
      options: ['Deletes the heading and everything nested under it', 'Cycles that heading\'s visibility: collapsed, children shown, fully expanded', 'Converts the heading into a TODO item', 'Indents the heading one level deeper permanently'],
      correct: 1,
      explain: 'TAB cycles visibility — folding is purely a display convenience, not destructive; nothing folded away is actually deleted, just hidden until expanded again.'
    },
    {
      q: 'What does C-c C-t do on a heading?',
      options: ['Creates a new table', 'Cycles the heading through its TODO keyword states (e.g., TODO -> DONE -> none)', 'Toggles the heading\'s visibility', 'Deletes the current TODO keyword permanently with no way back'],
      correct: 1,
      explain: 'C-c C-t cycles a heading through a configurable sequence of task states — by default TODO, then DONE, then no keyword at all, then back to TODO.'
    },
    {
      q: 'What is the actual payoff of the Org agenda (C-c a) that a single file\'s outline alone cannot provide?',
      options: ['It makes text load faster within one file', 'It pulls SCHEDULED/DEADLINE items together from EVERY file listed in org-agenda-files into one combined, date-organized view', 'It automatically deletes completed TODO items', 'It converts Org files into a different file format'],
      correct: 1,
      explain: 'The agenda\'s real value is cross-file aggregation by date — combining scheduled work spread across multiple separately-organized files into one reviewable view, something no single file\'s own outline could do alone.'
    }
  ],
  pitfalls: [
    'Adding a date to a heading\'s body text without using SCHEDULED: or DEADLINE: specifically — the agenda only recognizes those two specific markers, not just any date mentioned somewhere in the text.',
    'Forgetting to add a file to org-agenda-files — its TODOs, however well-formed, simply will not appear in the combined agenda view until that file is actually listed.',
    'Treating a folded (collapsed) heading as though its content were deleted — folding is purely a display state; the content is still fully present and instantly recoverable by expanding it again.'
  ],
  interview: [
    {
      q: 'Explain how Org mode derives outline structure entirely from plain text, and why that design choice matters beyond simplicity.',
      a: 'A heading in Org is simply a line beginning with one or more asterisk characters, with the COUNT of asterisks directly determining nesting depth — one asterisk for a top-level heading, two for a child of that heading, and so on, with no hidden metadata, special binary encoding, or separate structural layer involved at all. This matters beyond just being easy to learn: because the entire structure lives as literal, visible text, an Org file remains a genuine, ordinary plain text file — readable, greppable, version-controllable, and editable in any text editor on any machine, indefinitely, with zero risk of the data becoming inaccessible due to a proprietary format or a discontinued application, which is a real, practical advantage over most dedicated note-taking or task-management software\'s own specialized file formats.'
    },
    {
      q: 'Walk through exactly what the Org agenda does when you press C-c a, and why that cross-file capability is often cited as Org\'s single most compelling feature.',
      a: 'C-c a opens the agenda dispatcher, and choosing a standard agenda view triggers Org to scan EVERY file listed in org-agenda-files for headings carrying a SCHEDULED or DEADLINE marker, pulling all of those matching items together into one single view, organized purely by date, regardless of which specific file each item actually lives in. This is cited as Org\'s most compelling feature because it solves a genuinely common real problem — work naturally spans multiple, separately-organized files (a work project, personal tasks, a specific side project), and without the agenda, staying on top of everything due today would require manually opening and checking each file individually. The agenda automates exactly that aggregation, letting files stay independently organized for their own internal structure while still being reviewable together by date in one place — a capability most competing task-management tools either lack entirely or only provide by giving up the plain-text portability Org otherwise offers.'
    },
    {
      q: 'A user has a heading marked with a date somewhere in its text, but that date never shows up in the agenda. What would you check?',
      a: 'First, whether the date is actually marked with SCHEDULED: or DEADLINE: specifically — the agenda only recognizes dates carrying one of these two specific keywords; a date simply mentioned in ordinary body text, with no such marker, is invisible to the agenda entirely, regardless of how clearly a human reader would understand it as a deadline. Second, whether the FILE containing that heading is actually listed in org-agenda-files — a perfectly well-formed SCHEDULED or DEADLINE item in a file the agenda does not know to check simply will not appear, since the agenda only scans files it has explicitly been told about, not every Org file that happens to exist on disk.'
    },
    {
      q: 'Why might someone recommend Org mode even to a user who has no interest in learning much else about Emacs?',
      a: 'Org offers a genuinely rare combination that is hard to find bundled together elsewhere: fully portable, lock-in-free plain text as the actual underlying data format, combined with real, capable outlining (nested structure, foldable visibility) and real task/schedule management (TODO states, and critically, a cross-file agenda pulling scheduled work together by date). Most dedicated task-management or note-taking applications offer strong task/schedule features but lock that data into their own proprietary format; plain-text-first alternatives often lack anything as capable as Org\'s agenda. For someone specifically drawn to that combination — genuine data portability plus genuine task-management capability — the value proposition can be strong enough to justify learning just enough Emacs to use Org effectively, even without adopting Emacs as a general-purpose editor for everything else.'
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: 'The essentials cover outlines, TODOs, and the agenda thoroughly. This is what is underneath: org-capture for frictionless quick notes from anywhere in Emacs, and org-babel — executable code blocks living directly inside a plain-text document.',
    sections: [
      {
        h: 'org-capture: getting a thought INTO Org with minimal friction',
        p: [
          '<code>org-capture</code> (bound, by convention, to <code>C-c c</code> once configured) is specifically designed to solve the "I just thought of something and need to jot it down RIGHT NOW, without breaking whatever I was already doing" problem — it pops up a small, dedicated capture buffer from WHEREVER you currently are in Emacs (regardless of what file you have open), lets you quickly type a note, and files it away into a pre-configured location (a specific heading in a specific file, commonly) once you finish — all without ever needing to manually navigate to that target file and heading yourself. <code>(setq org-capture-templates \'(("t" "Todo" entry (file+headline "~/org/personal.org" "Inbox") "* TODO %?")))</code> is a genuinely common starting template: pressing C-c c, then "t," drops you straight into typing a new TODO item, automatically filed under an "Inbox" heading in personal.org, ready to be properly organized later.'
        ]
      },
      {
        h: 'org-babel: executable code blocks, living inside your notes',
        p: [
          'Org supports embedding actual, EXECUTABLE code blocks directly inside an otherwise ordinary Org document — <code>#+BEGIN_SRC python ... #+END_SRC</code> marks a block of Python code that can be run directly, in place, with <code>C-c C-c</code>, its output inserted right back into the same document. This genuinely blurs the line between "notes about code" and "the actual code itself" — a document can contain real, working, runnable examples alongside the prose explaining them, kept perpetually in sync since they live in the exact same file rather than a separate script referenced from afar.',
          'This capability (sometimes called "literate programming" in the broader sense) is genuinely deep enough to support entire projects\' documentation-plus-implementation living in one Org file — worth knowing exists as a genuinely distinctive Org capability, even though using it well for real, substantial work is its own significant topic well beyond this course\'s essentials-focused scope.'
        ]
      }
    ]
  }
};
