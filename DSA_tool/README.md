# DSA Interview Crash Course

A local, static, zero-dependency crash course covering the ~19 patterns that generalize to almost all Google/Meta/Microsoft/Amazon-style coding interview questions — concept, an interactive animated walkthrough, real company-style variants, an idiomatic Python solution, a quiz, and a closing timed mock interview drill. Total size: a few MB (well under any storage concern). No node_modules, no build step, no video.

## Run it

```
./start.sh
```

Then open **http://localhost:8000**. (Uses `python3 -m http.server` — nothing else to install. Serving over `http://localhost` instead of double-clicking the HTML files is what makes saved progress and content loading work reliably across browsers.)

To stop: `Ctrl+C` in the terminal.

## How to use the ~4-5 hour session

1. **Start at the dashboard** (`index.html`) — it tracks your progress and shows time remaining.
2. **Big-O Refresher + Pythonic Idioms** (15 min) first — every pattern after it assumes this vocabulary.
3. Work through the patterns **top to bottom** in the order shown (they're sequenced foundational → advanced, and later patterns sometimes build on earlier ones, e.g. Graphs assumes Tree DFS/BFS). For each:
   - Read the concept and "how to recognize it" section.
   - Step through the animation (Play or Next-step) with a real traced example.
   - Read the **interview variants** — this is the highest-value section: it's specifically about how Google/Meta/Microsoft/Amazon reskin the canonical LeetCode problem rather than asking it verbatim.
   - Read the Python solution and idiom notes.
   - Take the quiz.
   - Check the module complete.
4. Keep the **Cheat Sheet** open in a second tab — a 30-second lookup table mapping problem phrasing to pattern, complexity, and go-to data structure.
5. Close with the **Mock Interview** drill — randomized variant prompts pulled from everything you studied, on a 3-minute countdown per question, forcing you to pattern-match under time pressure before revealing the approach.

## Honest expectations

Four to five hours is enough to build (or rebuild) sharp pattern recognition and close specific gaps — it is not enough to go from zero to interview-ready if you have no prior exposure to DSA at all. This course assumes some prior exposure and is deliberately dense: no filler, no basics of what an array or hash map is. If a pattern page feels unfamiliar rather than just rusty, slow down and actually write the Python solution yourself in your own editor before moving on — the site intentionally doesn't include a code runner, so real typing practice happens outside it.

## Project structure

```
index.html              dashboard: progress, schedule, links
cheat-sheet.html         one-page pattern-recognition lookup table
pythonic-idioms.html     Big-O refresher + Python idiom warm-up
pattern.html              template — loads data/patterns/<id>.js via ?id=
mock-interview.html      timed randomized variant drill
css/style.css
js/app.js                 nav + localStorage progress tracking
js/quiz-engine.js         renders quizzes
js/viz-engine.js          array/pointer step-through animator
js/graph-viz-engine.js    tree/graph step-through animator
data/schedule.js          ordered module list (drives nav + dashboard)
data/patterns/*.js        one file per pattern (content + animation data)
```

Progress is saved in your browser's `localStorage`, scoped to `localhost:8000` — it persists across sessions as long as you keep using the same port and don't clear site data.
