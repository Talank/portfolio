# Linux Course

A local, static, zero-dependency course covering exactly what you need to be genuinely comfortable on a Linux box: the filesystem, permissions, processes & services, text processing & regex, bash scripting, networking & SSH, and package management. Ends with a bridge lesson connecting "what is a container, really" (namespaces, cgroups — just a Linux process with walls around it) to the CI/CD & Docker/Kubernetes course that follows.

Same local-first, zero-licensing-risk design as `DSA_tool`, `AI_course`, and `full_stack_java`: no video, no tracked media, procedurally generated audio, hand-drawn SVG character art (not traced from any show, not AI-generated). One Piece stories, Big Bang Theory and Friends scenes, mnemonics, and interactive animated diagrams throughout.

## What's different from the other courses: Depth toggle

This course is deliberately **lean by default** — each lesson teaches exactly what you need, nothing more. A site-wide **Essentials / Full Depth** switch lives in the header: flip it to **Full Depth** and any lesson with an optional `deepDive` section unlocks its deeper mechanism, edge cases, and "why it's actually built that way." Nothing is ever gated behind it — it only controls how far a lesson goes, and the setting persists across the whole site via `localStorage`.

## Run it

```
./start.sh
```

Then open **http://localhost:8000/linux_course/**. (Serves the whole repo root with `python3 -m http.server`, from the parent directory, so `../shared/*` resolves the same way locally as on GitHub Pages — nothing else to install.)

To stop: `Ctrl+C` in the terminal.

You'll get the most out of this course with access to an actual terminal — macOS's built-in Terminal (which is Unix, close enough for everything through Part 4) or an SSH connection to a real Linux box (Part 5 covers exactly how to set that connection up, if you don't have one yet).

## How to use it

1. **Go strictly in order.** Permissions (Part 1) assume you know the filesystem tree (also Part 1); processes (Part 2) assume you can navigate and read files; regex (Part 3) is the single biggest lever for bash scripting (Part 4) and SSH/networking work (Part 5).
2. In each lesson: read the concept, open the **story + animation** the first time through, click through the **interactive walkthrough**, expand any **Technicality corner** question you can't already answer out loud, then do the **Terminal Lab** — type the command yourself, check it in the browser, then run it for real in a terminal.
3. Before marking a lesson complete, try the **interview questions** at the bottom out loud.
4. Keep the **Cheat Sheet** open in a second tab.
5. Finish with the **timed Interview Drill**.

## Course structure

| Part | Topic | Lessons |
|---|---|---|
| 0 | Orientation & Terminal | 2 |
| 1 | Filesystem & Files | 4 |
| 2 | Users, Processes & Services | 3 |
| 3 | Text, Pipes & Regex | 5 |
| 4 | Shell & Bash Scripting | 4 |
| 5 | Networking & SSH | 3 |
| 6 | Packages & Archives | 2 |
| 7 | Toward CI/CD (incl. capstone) | 3 |

26 lessons total, sequenced as one dependency chain rather than isolated topics.

## Project structure

```
index.html              dashboard: progress, schedule, links
cheat-sheet.html         every "which command/flag when" table, one page
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
js/code-lab-engine.js     in-browser terminal lab: shell-aware static checks + "run for real" recipes
js/quiz-engine.js         renders per-lesson quizzes
data/schedule.js          ordered lesson list, by Part (drives nav + dashboard + interview drill pool),
                           plus CATEGORY_COLORS mapping each Part to its own accent color
data/characters.js        hand-drawn SVG character portraits (original, not traced or AI-generated)
data/lessons/*.js         one file per lesson (concept, deepDive, story, storyAnim, tech, code, lab, quiz, interview)
```

Progress and notes are saved in your browser's `localStorage`, scoped to `localhost:8000`. Signing in (via the header auth widget) additionally syncs progress and notes to Supabase (`linux_progress` / `linux_notes` tables, see `../supabase/schema.sql`) for cross-device access — entirely optional, and nothing gates access to any lesson content.

## Honest expectations

This is lean and focused, not a full sysadmin certification — it teaches the 20% of Linux that does 80% of the work you'll actually do: navigating and reading a system, scripting real automation, and connecting to and working on remote machines safely. If a lab feels unfamiliar rather than just new, slow down and run it locally line by line before moving on. Flip on **Full Depth** for any topic where you want to go further than "comfortable" — into "you could explain the internals in an interview."
