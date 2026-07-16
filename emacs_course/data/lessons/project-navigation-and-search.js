window.LESSONS = window.LESSONS || {};
window.LESSONS['project-navigation-and-search'] = {
  id: 'project-navigation-and-search',
  title: 'Finding Things Fast: project.el, Fuzzy Files & Project-Wide Search',
  category: 'Part 6 — Working With Code',
  timeMin: 35,
  summary: 'Everything so far has treated one file, or one directory, at a time. Real code work happens across dozens or hundreds of files at once, and Emacs\'s built-in project.el (no package install required, since Emacs 28) is what scopes navigation and search to exactly the right boundary — the current PROJECT — automatically, without you ever manually telling it where that boundary is.',
  goals: [
    'Explain how project.el automatically identifies a project\'s root directory',
    'Fuzzy-find any file within the current project with C-x p f',
    'Search file contents across an entire project with C-x p g (or M-x rgrep)',
    'Switch between buffers scoped to only the current project with C-x p b',
    'Jump directly to a specific definition within the current file using imenu'
  ],
  concept: [
    {
      h: 'What "the current project" actually means to Emacs',
      p: [
        '<b>project.el</b> is built directly into Emacs (28 and later — no package installation needed at all) and provides a whole family of commands scoped specifically to "the current project" rather than the entire filesystem, or every buffer open across your whole session. The genuinely useful part: you never manually tell Emacs where a project\'s boundary is — project.el automatically identifies it by walking UPWARD from whatever file you currently have open, directory by directory, until it finds a recognizable marker, most commonly a <code>.git</code> directory.',
        'This means opening any file inside a git repository automatically puts you "in" that project as far as every command in this lesson is concerned — no setup, no manual project-registration step, the boundary is simply wherever the nearest enclosing <code>.git</code> (or equivalent marker) happens to be.'
      ]
    },
    {
      h: 'C-x p f: fuzzy-finding any file in the project, instantly',
      p: [
        '<code>C-x p f</code> (project-find-file) prompts, with completion, for ANY file anywhere within the current project — not just the current directory, the ENTIRE project tree — letting you type a fragment of a filename you roughly remember and jump straight to it, regardless of how deeply nested it actually is. This is genuinely faster than repeated C-x C-f navigation (Part 2\'s approach) through directory after directory the moment a project has any real depth to it, since you are searching by NAME across everything at once rather than navigating a tree structure step by step.'
      ]
    },
    {
      h: 'Searching file CONTENTS across the whole project',
      p: [
        '<code>C-x p g</code> (project-find-regexp) searches the CONTENTS of every file in the current project for a pattern, presenting matches in a dedicated, clickable results buffer — jump to any match directly from that list. The older, still widely-used <code>M-x rgrep</code> does essentially the same job (recursive grep across a directory tree), predating project.el and still genuinely useful, especially for searching outside a formally git-tracked project boundary.',
        'This is directly the Emacs-native equivalent of running <code>grep -r pattern .</code> from a terminal (exactly the linux_course\'s grep-basics lesson, if you have taken it) — the same underlying idea, but with results integrated directly into Emacs as a navigable list rather than plain terminal output, letting you jump from a match straight into editing that exact spot with a single keypress.'
      ]
    },
    {
      h: 'Scoped buffer switching, and jumping within one file',
      p: [
        '<code>C-x p b</code> (project-switch-to-buffer) works exactly like Part 2\'s <code>C-x b</code>, except the list it offers is filtered to ONLY buffers belonging to the CURRENT project — genuinely useful once a long session has accumulated open buffers from several unrelated projects, letting you switch quickly without wading through files that have nothing to do with what you are currently working on.',
        '<code>M-x imenu</code> is a different, complementary tool: it jumps to a specific DEFINITION (a function, a class, a section heading) WITHIN the current single file, built from that file\'s own major-mode-aware understanding of its structure — a Python buffer\'s imenu lists its functions and classes; an Org buffer\'s (previous lesson) imenu lists its headings. Where project-find-file and project-find-regexp search ACROSS files, imenu navigates WITHIN one — genuinely different scopes, both useful, neither a substitute for the other.'
      ]
    }
  ],
  conceptFlow: {
    title: 'How project.el finds the project root, walking upward',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Starting point',
        nodes: [
          { id: 'start', text: 'You open:\n~/code/myapp/src/utils/helpers.py' }
        ]
      },
      {
        label: 'Walking upward, checking each level',
        nodes: [
          { id: 'check1', text: 'Check ~/code/myapp/src/utils/\nfor a .git directory — not found' },
          { id: 'check2', text: 'Check ~/code/myapp/src/\nfor a .git directory — not found' },
          { id: 'check3', text: 'Check ~/code/myapp/\nfor a .git directory — FOUND' }
        ]
      },
      {
        label: 'Result',
        nodes: [
          { id: 'result', text: 'Project root = ~/code/myapp/\nEVERY command in this lesson now scopes to this exact boundary' }
        ]
      }
    ],
    steps: [
      { active: ['start'], note: 'You open a file several directories deep inside a real project — project.el has not been told anything explicitly about where this project\'s boundary is.' },
      { active: ['check1'], note: 'Starting from the file\'s own directory, project.el checks for a .git directory right there — none found, so it moves one level up.' },
      { active: ['check2'], note: 'Still no .git directory at this level either — continue walking upward.' },
      { active: ['check3'], note: 'At this level, a .git directory IS found — this is the signal project.el is looking for, and the walk stops here.' },
      { active: ['result'], note: 'The directory where that .git was found becomes the recognized project root — every subsequent project.el command (C-x p f, C-x p g, C-x p b) now scopes itself to exactly this boundary, automatically, with zero manual configuration ever required from you.' }
    ]
  },
  story: {
    onePiece: {
      title: 'Usopp\'s Scoped Search: Only the Crates for THIS Job',
      text: 'Usopp, deep into a specific repair job, does not search the Sunny\'s ENTIRE cargo hold at random every time he needs a part — the ship has a system where, the moment he starts working on a specific job, whatever crate zone is CLOSEST to that job\'s designated work area is automatically treated as the relevant search boundary, without anyone having to manually declare "search only this section" every single time. If the part he needs is not in the immediate zone, the system does not fall back to randomly searching the whole ship either — it checks the NEXT-nearest recognized zone boundary outward, and the next, until it finds a properly marked storage area, and THAT marked area becomes the scope for the rest of this job\'s search. Once that boundary is established, Usopp can call out a rough description of a part he vaguely remembers the shape of, and get pointed straight to it, anywhere within that scoped zone, without personally digging through crate after crate in sequence. He can also ask a completely different kind of question — not "where is a specific part," but "which crates in this zone even MENTION a specific material at all" — and get back a clickable, walkable list of exactly the right crates, rather than a vague "somewhere in the hold" answer. And separately, when he needs to check in on OTHER active jobs\' progress, he can ask specifically for "just the OTHER jobs currently active in this SAME zone," filtered to relevant work, rather than being shown every single job happening anywhere on the entire ship at once.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s Scoped Reference Search: Only This Project\'s Boundary',
      text: 'Sheldon, deep into a specific research project, does not search his ENTIRE office\'s reference collection at random every time he needs a specific paper — his filing system automatically treats whatever labeled project-box is closest to his current desk as the relevant search boundary the moment he starts working on that project, with no need to manually declare "search only this box" every single time. If a needed paper is not in that immediate box, the system does not fall back to randomly searching the entire office either — it checks the next-nearest properly labeled project boundary outward, and the next, until it finds a genuinely marked collection, and THAT collection becomes the scope for the rest of that search. Once established, Sheldon can name a rough, half-remembered title and get pointed straight to the specific paper, anywhere within that scoped collection, without personally flipping through every single folder in sequence. He can also ask a genuinely different kind of question — not "where is this specific paper," but "which papers in this collection even MENTION a specific physicist\'s name at all" — and get back a precise, walkable list rather than a vague "somewhere in my office" shrug. And when he wants to check on other work happening within that SAME specific project, he can filter specifically to "just the other materials actively part of THIS project," rather than being shown every reference across his entire, sprawling collection at once.'
    },
    why: 'Usopp\'s and Sheldon\'s search automatically scoping to the nearest recognized zone/project boundary, walking outward only as needed until it finds one, is exactly project.el finding the project root by walking up directories to the nearest .git. Their fast, rough-description part/paper lookup is project-find-file. Their "which crates/papers even mention X" question is project-find-regexp. And filtering to "just the other work in THIS same zone/project" is project-switch-to-buffer.'
  },
  tech: [
    {
      q: 'Why does project.el use an automatic marker-based detection (like finding the nearest .git directory) rather than requiring explicit, manual project registration?',
      a: 'Manual registration would require a real, repeated setup step every time you start working in a new project — genuinely tedious friction for something that should ideally just work the moment you open any file inside an existing repository. Because nearly every real software project is ALREADY version-controlled with git (or another recognized VCS), the presence of a .git directory is an extremely reliable, already-existing signal for "this is the boundary of a coherent project" — reusing a marker that already exists for an entirely different reason (version control) means project.el gets automatic, zero-configuration project detection essentially for free, without needing developers to maintain a separate, redundant "this is a project" declaration alongside their existing VCS setup.'
    },
    {
      q: 'Why is project-find-file (fuzzy, name-based, scoped to the whole project) generally faster than repeated C-x C-f navigation for a project with any real depth?',
      a: 'C-x C-f, used to navigate directory by directory, requires you to already know (or discover step by step) the exact PATH to a file — genuinely fine for a shallow project, genuinely tedious the moment a project has meaningfully nested directory structure, since each level requires its own navigation step and you need to correctly recall the whole path in order. project-find-file instead searches by NAME across the ENTIRE project tree simultaneously, with completion — you only need to recall (even partially, even out of order with fuzzy matching) some fragment of the filename itself, not its full path or how many directories deep it happens to live, which is almost always a dramatically easier thing to recall correctly than an exact, multi-level path.'
    },
    {
      q: 'What is the genuine difference in scope between project-find-regexp and imenu, given that both are, in some sense, "find something" commands?',
      a: 'project-find-regexp searches file CONTENTS across EVERY file in the current project, looking for a pattern that could appear anywhere, in any of potentially hundreds of files — appropriate when you know roughly WHAT text you are looking for but not WHICH file it lives in. imenu, by contrast, operates entirely WITHIN the single file you already have open, jumping to a specific structural definition (a function, a class) that Emacs\'s major-mode-aware parsing has already identified within that one file — appropriate when you already know which file you are in and just need to jump directly to one specific part of it, rather than searching across a whole project\'s worth of files you have not yet even opened.'
    }
  ],
  code: {
    title: 'project.el commands, in a real git-tracked project',
    intro: 'Try this inside any real git repository you have cloned or checked out — project.el needs a .git directory (or equivalent) to actually recognize a project boundary.',
    code: `;; Open any file inside a git repo — project.el silently identifies
;; the project root the moment you're inside it, no setup needed:
C-x C-f ~/code/myapp/src/utils/helpers.py <RET>

C-x p f
;; Prompts for a filename, searching EVERY file in the whole myapp/
;; project at once. Type a fragment:
config
;; Matches config.py, src/settings/config.yaml, tests/test_config.py —
;; anywhere in the project, regardless of depth.

C-x p g
database <RET>
;; Searches the CONTENTS of every file in the project for "database" —
;; opens a results buffer:
;;   src/models.py:12: class Database:
;;   src/config.py:5:  DATABASE_URL = ...
;; Press RET on any line to jump straight there.

C-x p b
;; Lists ONLY buffers belonging to myapp/ — not every buffer open across
;; your whole Emacs session, just this project's.

M-x imenu <RET>
;; Within the CURRENT file (helpers.py), lists its own functions/classes:
;;   format_date
;;   parse_config
;;   Database (class)
;; Selecting one jumps directly to that definition, within this one file.`,
    notes: [
      'M-x rgrep is the older, more manual equivalent of project-find-regexp — it prompts separately for a pattern, a file pattern (like *.py), and a starting directory, useful outside a formal project boundary or for finer control.',
      'imenu\'s available list depends entirely on the current buffer\'s major mode having a definition of what counts as a "definition" for that language — most programming-language modes support it well out of the box.'
    ]
  },
  lab: {
    title: 'Write the right project-navigation commands',
    prompt: 'Write exactly the key sequence for each task below.',
    starter: `# Task: fuzzy-find any file in the current project by name


# Task: search the CONTENTS of every file in the current project for the word "timeout"


# Task: switch to a buffer, but only see buffers belonging to the current project


# Task: jump directly to a specific function definition within the CURRENT file

`,
    checks: [
      { re: 'C-x\\s+p\\s+f', flags: '', must: true, hint: 'C-x p f fuzzy-finds any file in the current project.', pass: 'C-x p f ✓' },
      { re: 'C-x\\s+p\\s+g.*timeout|C-x\\s+p\\s+g', flags: 'i', must: true, hint: 'C-x p g, then type "timeout", searches file contents across the whole project.', pass: 'C-x p g ✓' },
      { re: 'C-x\\s+p\\s+b', flags: '', must: true, hint: 'C-x p b switches buffers, scoped to only the current project.', pass: 'C-x p b ✓' },
      { re: 'M-x\\s+imenu', flags: 'i', must: true, hint: 'M-x imenu jumps to a definition within the current file.', pass: 'M-x imenu ✓' }
    ],
    run: 'Try it for real: inside any real git repository, C-x p f and type a fragment of a filename you know exists somewhere in the project.',
    solution: `# Task: fuzzy-find any file in the current project by name
C-x p f

# Task: search the CONTENTS of every file in the current project for the word "timeout"
C-x p g timeout <RET>

# Task: switch to a buffer, but only see buffers belonging to the current project
C-x p b

# Task: jump directly to a specific function definition within the CURRENT file
M-x imenu`,
    notes: [
      'All three C-x p commands share the same "p" (project) prefix — a genuinely predictable pattern once you know C-x p exists as a dedicated project-scoped command family.',
      'imenu operates on ONE file only — it has no concept of "the project" at all, unlike the three C-x p commands, which are entirely defined by project scope.'
    ]
  },
  quiz: [
    {
      q: 'How does project.el determine the boundary of "the current project"?',
      options: ['It requires manually registering every project explicitly', 'It walks upward from the current file\'s directory until it finds a recognizable marker, most commonly a .git directory', 'It treats your entire home directory as one single project', 'It asks you to type the project boundary every time you open a file'],
      correct: 1,
      explain: 'project.el automatically walks up the directory tree looking for a marker like .git, requiring zero manual configuration for any already version-controlled project.'
    },
    {
      q: 'What does C-x p f search across, and by what?',
      options: ['Only the current directory, by file content', 'Every file in the current PROJECT, by filename (with completion)', 'Every buffer open in the entire Emacs session, by content', 'Only the current file, by line number'],
      correct: 1,
      explain: 'project-find-file (C-x p f) searches by NAME across the entire current project, letting you jump to any file regardless of how deeply nested it is.'
    },
    {
      q: 'What is the difference between C-x p g and imenu?',
      options: ['They are functionally identical commands', 'C-x p g searches CONTENTS across every file in the project; imenu jumps to a definition WITHIN the single current file', 'imenu searches across files; C-x p g only works within one file', 'Neither command actually searches anything'],
      correct: 1,
      explain: 'project-find-regexp (C-x p g) searches across ALL files in a project for a text pattern; imenu navigates within just the CURRENT file to a specific structural definition.'
    },
    {
      q: 'What does C-x p b show, compared to plain C-x b?',
      options: ['Exactly the same list as C-x b, with no difference', 'Only buffers belonging to the CURRENT project, rather than every buffer open in the whole session', 'Only buffers that have never been saved', 'A list of every project ever opened, regardless of which is currently active'],
      correct: 1,
      explain: 'C-x p b is scoped specifically to the current project\'s buffers — genuinely useful once a long session has accumulated buffers from several unrelated projects.'
    },
    {
      q: 'Why does project.el reuse .git specifically as its project-boundary marker?',
      options: ['.git is the only possible marker project.el can ever recognize', 'Because nearly every real project is already version-controlled, reusing that existing marker gives automatic project detection with no extra setup required', 'git and project.el are actually the same underlying tool', '.git directories are required by Emacs itself to open any file at all'],
      correct: 1,
      explain: 'Since most real projects are already git repositories, using .git as the boundary marker gives automatic, zero-configuration project detection by reusing a signal that already exists for version control.'
    }
  ],
  pitfalls: [
    'Reaching for repeated C-x C-f directory navigation in a deep project when project-find-file (C-x p f) would reach the same file far faster by name alone.',
    'Confusing project-find-regexp (searches file CONTENTS across many files) with imenu (jumps to a definition within just the current file) — genuinely different scopes, easy to conflate at first.',
    'Working in a directory with no .git (or other recognized marker) and being confused that project.el commands do not behave as scoped as expected — without a detectable boundary, project.el has nothing reliable to scope to.'
  ],
  interview: [
    {
      q: 'Explain how project.el identifies a project\'s boundary, and why this design requires no manual configuration for the common case.',
      a: 'project.el walks upward from the directory of whatever file is currently open, checking each successive parent directory for a recognizable marker — most commonly a .git directory, though other version-control markers or an explicit marker file are also recognized. The moment such a marker is found, that directory becomes the recognized project root, and every project-scoped command (project-find-file, project-find-regexp, project-switch-to-buffer) operates relative to that boundary from then on. This requires no manual configuration because nearly every real software project is already version-controlled — reusing an ALREADY-EXISTING marker (the .git directory, present for entirely separate version-control reasons) means project detection comes essentially for free the moment you open any file inside an existing repository, with no separate "register this as a project" step ever needed.'
    },
    {
      q: 'Walk through the difference in scope between project-find-file, project-find-regexp, and imenu, and explain when you would reach for each.',
      a: 'project-find-file searches by FILENAME across every file in the current project, appropriate when you roughly know a file\'s name (or a fragment of it) but not its exact path or nesting depth. project-find-regexp searches file CONTENTS across every file in the current project, appropriate when you know roughly what TEXT you are looking for but not which specific file contains it. imenu operates within just the SINGLE file you already have open, jumping to a specific structural definition (a function, class, or heading) that file\'s own major mode has identified — appropriate once you already know which file you need and just want to jump directly to one specific part of it, rather than searching across an entire project\'s worth of files. Each addresses a genuinely different "I know roughly X, help me find Y" scenario, and none substitutes for the others."'
    },
    {
      q: 'Why might project-find-file scale better than manual C-x C-f directory navigation as a codebase grows larger and more deeply nested?',
      a: 'C-x C-f navigation requires correctly recalling (or discovering step by step) an entire, exact PATH to a target file — every additional level of directory nesting adds another required navigation step and another piece of path information that must be correctly remembered or looked up. project-find-file instead searches by filename across the ENTIRE project simultaneously, with fuzzy/completion matching, meaning the cognitive load of finding a file scales with how memorable its NAME is, not with how deeply it happens to be nested or how precisely its full path is recalled — a genuinely more forgiving and consistently fast search experience as a codebase\'s directory structure grows larger and more complex over time.'
    },
    {
      q: 'A developer working across several unrelated cloned repositories in one long Emacs session complains that C-x b\'s buffer list has become unwieldy. What would you recommend, and why does it directly address the problem?',
      a: 'C-x p b (project-switch-to-buffer) directly addresses this: rather than listing every buffer open across the ENTIRE session (accumulated from every unrelated project touched that day), it filters to only buffers belonging to whichever project the CURRENT buffer\'s directory resolves to, via the same automatic .git-based boundary detection every other project.el command uses. This means switching between files WITHIN the project actually being worked on right now stays fast and uncluttered, regardless of how many other, entirely unrelated projects\' buffers have also accumulated in that same long-running session — the noise from unrelated work is filtered out automatically, without needing to manually close buffers from other projects just to keep the switching list manageable.'
    }
  ]
};
