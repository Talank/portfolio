/*
Master ordered list of study modules for the Emacs Course. Drives the
dashboard, nav order, prev/next links on lesson pages, and the interview
drill question pool.
type: 'lesson' — loads data/lessons/<id>.js into lesson.html?id=<id>
type: 'drill'  — special page (href used directly)

Scope is deliberately lean: exactly what you need to go from "never opened
Emacs" to "genuinely comfortable daily-driving it," on a Mac specifically —
the Mac modifier-key setup gets its own dedicated Part (1) right up front,
because getting Meta/Super wrong on day one is the single most common reason
people bounce off Emacs before ever seeing what it's actually good at.
Every lesson teaches essentials first; lessons with real depth to spare also
carry an optional `deepDive` section, unlocked site-wide via the Essentials/
Full Depth switch in the header (see js/app.js).
*/
window.SCHEDULE = [
  // ── Part 0: Orientation & Starting Emacs ─────────────────────────────
  { id: 'why-emacs-matters', title: 'Why Emacs: Self-Documenting, Extensible, and Older Than You\'d Guess', category: 'Part 0 — Orientation & Starting Emacs', timeMin: 25, type: 'lesson' },
  { id: 'starting-emacs-on-mac', title: 'Installing & Starting Emacs on a Mac: Terminal vs GUI', category: 'Part 0 — Orientation & Starting Emacs', timeMin: 30, type: 'lesson' },

  // ── Part 1: The Mac Keybinding Model ─────────────────────────────────
  { id: 'mac-modifier-keys', title: 'Control, Meta & Super: What Mac Actually Does to Emacs Keybindings', category: 'Part 1 — The Mac Keybinding Model', timeMin: 35, type: 'lesson' },
  { id: 'essential-mac-remaps', title: 'Fixing It Properly: Terminal.app, iTerm2 & GUI Emacs Settings', category: 'Part 1 — The Mac Keybinding Model', timeMin: 30, type: 'lesson' },

  // ── Part 2: Buffers, Windows & Files ─────────────────────────────────
  { id: 'buffers-windows-frames', title: 'Buffers, Windows & Frames: Emacs\'s Own Vocabulary', category: 'Part 2 — Buffers, Windows & Files', timeMin: 35, type: 'lesson' },
  { id: 'opening-saving-files', title: 'Opening, Saving & Dired: Files Without Leaving Emacs', category: 'Part 2 — Buffers, Windows & Files', timeMin: 30, type: 'lesson' },
  { id: 'the-minibuffer-and-mx', title: 'The Minibuffer & M-x: How Every Command Actually Runs', category: 'Part 2 — Buffers, Windows & Files', timeMin: 30, type: 'lesson' },

  // ── Part 3: Core Editing ──────────────────────────────────────────────
  { id: 'cursor-movement-basics', title: 'Moving Without Arrow Keys: Char, Word, Line & Buffer Motion', category: 'Part 3 — Core Editing', timeMin: 30, type: 'lesson' },
  { id: 'killing-and-yanking', title: 'The Kill Ring: Why Emacs \"Cut/Paste\" Isn\'t What You Think', category: 'Part 3 — Core Editing', timeMin: 35, type: 'lesson' },
  { id: 'marking-regions-and-undo', title: 'Marking a Region & Undo: Point, Mark, and a Tree You Can\'t Lose', category: 'Part 3 — Core Editing', timeMin: 30, type: 'lesson' },
  { id: 'search-and-replace', title: 'Incremental Search & Query-Replace: isearch, M-%, and Regex Search', category: 'Part 3 — Core Editing', timeMin: 40, type: 'lesson' },

  // ── Part 4: Customization & Config ───────────────────────────────────
  { id: 'the-init-file', title: 'init.el: Where Emacs\'s Entire Personality Lives', category: 'Part 4 — Customization & Config', timeMin: 35, type: 'lesson' },
  { id: 'packages-and-use-package', title: 'Packages, MELPA & use-package: Installing Things Properly', category: 'Part 4 — Customization & Config', timeMin: 35, type: 'lesson' },
  { id: 'keybinding-customization', title: 'Binding Your Own Keys: global-set-key, Keymaps & Mac-Friendly Bindings', category: 'Part 4 — Customization & Config', timeMin: 35, type: 'lesson' },

  // ── Part 5: Modes — The Emacs Superpower ─────────────────────────────
  { id: 'major-and-minor-modes', title: 'Major vs Minor Modes: One Personality Plus Any Number of Add-Ons', category: 'Part 5 — Modes: The Emacs Superpower', timeMin: 35, type: 'lesson' },
  { id: 'org-mode-essentials', title: 'Org Mode Essentials: Outlines, TODOs & the Agenda', category: 'Part 5 — Modes: The Emacs Superpower', timeMin: 45, type: 'lesson' },

  // ── Part 6: Working With Code ─────────────────────────────────────────
  { id: 'project-navigation-and-search', title: 'Finding Things Fast: project.el, Fuzzy Files & Project-Wide Search', category: 'Part 6 — Working With Code', timeMin: 35, type: 'lesson' },
  { id: 'completion-and-lsp', title: 'Real Code Intelligence: Completion & eglot (Built-In LSP)', category: 'Part 6 — Working With Code', timeMin: 40, type: 'lesson' },
  { id: 'version-control-with-magit', title: 'Magit: The Git Interface That Converts People to Emacs', category: 'Part 6 — Working With Code', timeMin: 45, type: 'lesson' },

  // ── Part 7: Terminal, Shell, Remote & Capstone ───────────────────────
  { id: 'shell-and-eshell', title: 'Shells Inside Emacs: M-x shell vs M-x eshell', category: 'Part 7 — Terminal, Shell, Remote & Capstone', timeMin: 30, type: 'lesson' },
  { id: 'tramp-remote-editing', title: 'TRAMP: Editing a File on a Remote SSH Server as if It Were Local', category: 'Part 7 — Terminal, Shell, Remote & Capstone', timeMin: 40, type: 'lesson' },
  { id: 'capstone-emacs-workflow', title: 'Capstone: Build Your Real init.el (use-package, keys, org, Magit, TRAMP)', category: 'Part 7 — Terminal, Shell, Remote & Capstone', timeMin: 60, type: 'lesson' },
];

/* Category → accent color, used for dashboard group headings, module-card
   left borders, and the lesson-page category pill. Eight distinct hues on
   the dark background, one per Part. */
window.CATEGORY_COLORS = {
  'Part 0 — Orientation & Starting Emacs': '#4fd1c5',
  'Part 1 — The Mac Keybinding Model': '#63b3ed',
  'Part 2 — Buffers, Windows & Files': '#9f7aea',
  'Part 3 — Core Editing': '#ecc94b',
  'Part 4 — Customization & Config': '#68d391',
  'Part 5 — Modes: The Emacs Superpower': '#fc8181',
  'Part 6 — Working With Code': '#f6ad55',
  'Part 7 — Terminal, Shell, Remote & Capstone': '#ed64a6',
};
