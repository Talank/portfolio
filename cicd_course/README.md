# CI/CD & Containers Course

A local, static, zero-dependency course covering exactly what you need to go from "I've heard of Docker" to "I can containerize an app, run it locally with Compose, deploy it to a real Kubernetes cluster, and wire a CI/CD pipeline that builds, tests, and ships it automatically on every push."

**The direct sequel to `linux_course`.** That course's closing lesson (`linux-in-containers-preview`) demystified a container as "just a process," restricted by namespaces (what it can see) and cgroups (what it can use). This course starts exactly there — Part 0's opening lesson picks that thread back up — and builds forward through Docker images and the Dockerfile, multi-container apps with Compose, real orchestration with Kubernetes, and a CI/CD pipeline with GitHub Actions.

Same local-first, zero-licensing-risk design as `linux_course`, `emacs_course`, `DSA_tool`, `AI_course`, and `full_stack_java`: no video, no tracked media, procedurally generated audio, hand-drawn SVG character art (not traced from any show, not AI-generated). One Piece stories, Big Bang Theory and Friends scenes, mnemonics, and interactive animated diagrams throughout.

## What's different from the other courses: Depth toggle

This course is deliberately **lean by default** — each lesson teaches exactly what you need, nothing more. A site-wide **Essentials / Full Depth** switch lives in the header: flip it to **Full Depth** and any lesson with an optional `deepDive` section unlocks its deeper mechanism, edge cases, and "why it's actually built that way." Nothing is ever gated behind it — it only controls how far a lesson goes, and the setting persists across the whole site via `localStorage`.

## Run it

```
./start.sh
```

Then open **http://localhost:8000/cicd_course/**. (Serves the whole repo root with `python3 -m http.server`, from the parent directory, so `../shared/*` resolves the same way locally as on GitHub Pages — nothing else to install.)

To stop: `Ctrl+C` in the terminal.

You'll get the most out of this course with Docker actually installed (Docker Desktop, or `docker` + `docker compose` on Linux) and, for Parts 4-5, a local cluster (`kind`, `minikube`, or Docker Desktop's built-in Kubernetes) — every lab is meant to be tried for real, not just checked in the browser.

## How to use it

1. **Docker (Parts 0-3) before Kubernetes (Parts 4-5) before CI/CD (Parts 6-7).** Each part assumes the previous one's vocabulary — Kubernetes Pods are built from the same images the Docker lessons teach you to write, and the pipeline lessons deploy exactly what the Kubernetes lessons teach you to write manifests for.
2. In each lesson: read the concept, open the **story + animation** the first time through, click through the **interactive walkthrough**, expand any **Technicality corner** question you can't already answer out loud, then do the **Manifest Lab** — write the Dockerfile/YAML yourself, check it in the browser, then try it for real against your own Docker daemon or cluster.
3. Before marking a lesson complete, try the **interview questions** at the bottom out loud.
4. Keep the **Cheat Sheet** open in a second tab.
5. Finish with the **timed Interview Drill**.

## Course structure

| Part | Topic | Lessons |
|---|---|---|
| 0 | From Process to Pipeline | 2 |
| 1 | Docker Fundamentals | 3 |
| 2 | Building Good Images | 3 |
| 3 | Multi-Container Apps | 3 |
| 4 | Kubernetes Fundamentals | 3 |
| 5 | Kubernetes in Practice | 3 |
| 6 | CI/CD Pipelines | 3 |
| 7 | Shipping It & Capstone | 2 |

22 lessons total, sequenced as one dependency chain rather than isolated topics.

## Project structure

```
index.html              dashboard: progress, schedule, links
cheat-sheet.html         every command/manifest pattern table, one page
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
js/code-lab-engine.js     in-browser manifest lab: YAML/Dockerfile-aware static checks + "try it for real" recipes
js/quiz-engine.js         renders per-lesson quizzes
data/schedule.js          ordered lesson list, by Part (drives nav + dashboard + interview drill pool),
                           plus CATEGORY_COLORS mapping each Part to its own accent color
data/characters.js        hand-drawn SVG character portraits (original, not traced or AI-generated)
data/lessons/*.js         one file per lesson (concept, deepDive, story, storyAnim, tech, code, lab, quiz, interview)
```

Progress and notes are saved in your browser's `localStorage`, scoped to `localhost:8000`. Signing in (via the header auth widget) additionally syncs progress and notes to Supabase (`cicd_progress` / `cicd_notes` tables, see `../supabase/schema.sql`) for cross-device access — entirely optional, and nothing gates access to any lesson content.

## Honest expectations

This is lean and focused, not a full "DevOps engineer" certification — it teaches the path from a Dockerfile to a real, automated deployment: building good images, running them together, orchestrating them for real with Kubernetes, and automating the whole thing with a CI/CD pipeline. If a lab feels unfamiliar rather than just new, slow down and try it for real against Docker or a cluster, line by line, before moving on. Flip on **Full Depth** for any topic where you want to go further than "comfortable" — into "you could explain the internals in an interview."
