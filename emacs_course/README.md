# Emacs Course

A local, static, zero-dependency course covering exactly what you need to go from "never opened Emacs" to genuinely comfortable daily-driving it: buffers/windows/files, core editing (the kill ring, search & replace), your own `init.el`, packages via `use-package`, major/minor modes, Org mode, project navigation, Magit, and TRAMP (editing a remote SSH file as if it were local — the deliberate bridge back to the `linux_course`'s SSH lesson).

**Built specifically for a Mac.** Emacs's default keybindings assume a PC keyboard (a physical Meta key that doesn't exist on a Mac), and getting that mismatch sorted out is the single biggest reason people bounce off Emacs in the first hour. Part 1 is entirely dedicated to fixing this properly — Terminal.app/iTerm2 settings, `mac-option-modifier`/`mac-command-modifier` — before any real editing lesson assumes it's already working.

Same local-first, zero-licensing-risk design as `linux_course`, `DSA_tool`, `AI_course`, and `full_stack_java`: no video, no tracked media, procedurally generated audio, hand-drawn SVG character art (not traced from any show, not AI-generated). One Piece stories, Big Bang Theory and Friends scenes, mnemonics, and interactive animated diagrams throughout.

## What's different from the other courses: Depth toggle

This course is deliberately **lean by default** — each lesson teaches exactly what you need, nothing more. A site-wide **Essentials / Full Depth** switch lives in the header: flip it to **Full Depth** and any lesson with an optional `deepDive` section unlocks its deeper mechanism, edge cases, and "why it's actually built that way." Nothing is ever gated behind it — it only controls how far a lesson goes, and the setting persists across the whole site via `localStorage`.

## Run it

```
./start.sh
```

Then open **http://localhost:8000/emacs_course/**. (Serves the whole repo root with `python3 -m http.server`, from the parent directory, so `../shared/*` resolves the same way locally as on GitHub Pages — nothing else to install.)

To stop: `Ctrl+C` in the terminal.

You'll get the most out of this course with Emacs actually installed (`brew install emacs`, or the pre-installed `/usr/bin/emacs` that ships with macOS, though it's typically an old version) — every lab is meant to be tried for real, not just checked in the browser.

## How to use it

1. **Do Part 1 before anything else**, even if you're impatient to start editing. Every later lesson's keybindings assume Option is set up as Meta — skip it and half the muscle memory you build will be fighting macOS's own Option-key accent shortcuts instead of Emacs.
2. In each lesson: read the concept, open the **story + animation** the first time through, click through the **interactive walkthrough**, expand any **Technicality corner** question you can't already answer out loud, then do the **Practice Lab** — type the keybinding/elisp yourself, check it in the browser, then try it for real in your own Emacs.
3. Before marking a lesson complete, try the **interview questions** at the bottom out loud.
4. Keep the **Cheat Sheet** open in a second tab.
5. Finish with the **timed Interview Drill**.

## Course structure

| Part | Topic | Lessons |
|---|---|---|
| 0 | Orientation & Starting Emacs | 2 |
| 1 | The Mac Keybinding Model | 2 |
| 2 | Buffers, Windows & Files | 3 |
| 3 | Core Editing | 4 |
| 4 | Customization & Config | 3 |
| 5 | Modes: The Emacs Superpower | 2 |
| 6 | Working With Code | 3 |
| 7 | Terminal, Shell, Remote & Capstone | 3 |

22 lessons total, sequenced as one dependency chain rather than isolated topics.

## Project structure

```
index.html              dashboard: progress, schedule, links
cheat-sheet.html         every keybinding table, one page
interview.html           timed randomized interview drill (pulls interview[] from every lesson)
lesson.html              template — loads data/lessons/<id>.js via ?id=
css/style.css
js/app.js                 nav, localStorage progress + notes + depth mode, optional Supabase sync
js/lesson-loader.js       renders a lesson's concept/deepDive/story/lab/quiz/interview sections
js/story-anim-engine.js   step-through animation for each lesson's One Piece/sitcom story
js/concept-flow-engine.js interactive click-through pipeline diagrams
js/test-flow-engine.js    branching "test yourself" decision trees
js/episode-engine.js      SVG character portraits + dialogue for episode scenes
js/audio-engine.js        procedurally generated background music/SFX (Web Audio API)
js/voice-engine.js        browser TTS tuning per character (SpeechSynthesis)
js/code-lab-engine.js     in-browser practice lab: elisp-aware static checks + "try it for real" recipes
js/quiz-engine.js         renders per-lesson quizzes
data/schedule.js          ordered lesson list, by Part (drives nav + dashboard + interview drill pool),
                           plus CATEGORY_COLORS mapping each Part to its own accent color
data/characters.js        hand-drawn SVG character portraits (original, not traced or AI-generated)
data/lessons/*.js         one file per lesson (concept, deepDive, story, storyAnim, tech, code, lab, quiz, interview)
```

Progress and notes are saved in your browser's `localStorage`, scoped to `localhost:8000`. Signing in (via the header auth widget) additionally syncs progress and notes to Supabase (`emacs_progress` / `emacs_notes` tables, see `../supabase/schema.sql`) for cross-device access — entirely optional, and nothing gates access to any lesson content.

## Honest expectations

This is lean and focused, not a full "Emacs wizard" certification — it teaches the 20% of Emacs that does 80% of the work you'll actually do day to day: moving and editing text without arrow keys, configuring it to feel like yours, and using it for real code and real remote work. If a lab feels unfamiliar rather than just new, slow down and try it for real in Emacs, line by line, before moving on. Flip on **Full Depth** for any topic where you want to go further than "comfortable" — into "you could explain the internals in an interview."
