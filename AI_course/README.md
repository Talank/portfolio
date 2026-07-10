# AI Engineer Course

A local, static, zero-dependency crash course taking you from "what even is a vector" through training, fine-tuning, and deploying LLMs, to building multi-framework agents — one ~34-hour path, zero filler. Every lesson: the real math, the real code, a One Piece story that acts the idea out (plus the occasional sitcom scene), an in-browser code lab that actually runs Python, a quiz, and the interview questions companies ask about that exact topic. Same local-first, zero-licensing-risk design as `DSA_tool`: no video, no tracked media, procedurally generated audio, hand-drawn SVG character art (not traced from any show, not AI-generated).

## Run it

```
./start.sh
```

Then open **http://localhost:8000/AI_course/**. (Serves the whole repo root with `python3 -m http.server`, from the parent directory, so `../shared/*` resolves the same way locally as it does on GitHub Pages — nothing else to install.)

To stop: `Ctrl+C` in the terminal.

## How to use the ~34-hour path

1. **Go strictly in order.** The course is one long dependency chain: cosine similarity (Part 1) is the same dot product that powers attention (Part 5) and RAG retrieval (Part 7). Skipping math makes everything after it feel like magic; doing the math makes everything after it feel obvious.
2. In each lesson: read the concept, open the **story + animation** the first time through, expand any **Technicality corner** question you can't already answer out loud, then do the **Code Lab** — type the code yourself, run the tests in the browser (real Python execution via Pyodide for most labs; a handful of PyTorch/Transformers-dependent labs are statically checked instead, since those libraries aren't available in-browser).
3. Before marking a lesson complete, try the **interview questions** at the bottom out loud. If you can't explain it to an interviewer, you don't own it yet.
4. Keep the **Cheat Sheet** open in a second tab — every formula and "which tool when" table from the whole course in one place.
5. Finish with the **timed Interview Drill** — randomized questions pulled from every lesson's interview section, on a countdown, like the real thing.

## Course structure

| Part | Topic | Lessons |
|---|---|---|
| 0–1 | Orientation + math prerequisites (vectors, matrices, calculus, probability, statistics, information theory) | 8 |
| 2 | Classical ML (regression, classification, evaluation, k-NN/trees/forests, clustering/PCA) | 7 |
| 3 | Deep learning (neural nets, backprop, training dynamics, PyTorch, CNN/RNN tour) | 5 |
| 4 | NLP (tokenization, embeddings, seq2seq + attention, classic NLP tasks) | 4 |
| 5 | Transformers (self-attention, architecture, BERT vs GPT, build a mini-GPT) | 4 |
| 6 | LLM engineering (pretraining, fine-tuning/LoRA/QLoRA, RLHF/DPO, inference & serving, using models) | 5 |
| 7 | RAG & agents (embeddings-RAG, agents from scratch, LangChain/LangGraph, multi-framework agents, memory/eval/safety) | 5 |
| 8 | Interviews & career (ML/LLM system design, timed interview drill) | 1 + drill |

39 lessons total, sequenced so every later lesson explicitly reuses concepts and even narrative motifs from earlier ones (the same dot product, the same One Piece crew, the same running story threads) rather than treating each topic in isolation.

## Honest expectations

~34 hours is enough to build genuine, interview-ready understanding of the full modern AI stack if you actually do the labs — it is not a substitute for the hundreds of hours of practice a research career eventually needs. This course assumes no prior ML background but does assume basic programming (Python syntax, functions, loops). If a lesson's lab feels unfamiliar rather than just new, slow down and work through the math by hand before moving on — every formula in this course is derived, never asserted.

## Project structure

```
index.html              dashboard: progress, schedule, links
cheat-sheet.html         every formula + "which tool when" table, one page
interview.html           timed randomized interview drill (pulls interview[] from every lesson)
lesson.html              template — loads data/lessons/<id>.js via ?id=
css/style.css
js/app.js                 nav, localStorage progress + notes, optional Supabase sync
js/lesson-loader.js       renders a lesson's concept/story/lab/quiz/interview sections
js/story-anim-engine.js   step-through animation for each lesson's One Piece/sitcom story
js/episode-engine.js      SVG character portraits + dialogue for episode scenes
js/audio-engine.js        procedurally generated background music/SFX (Web Audio API)
js/voice-engine.js        browser TTS tuning per character (SpeechSynthesis)
js/code-lab-engine.js     in-browser code editor: static checks + real Python execution (Pyodide)
js/quiz-engine.js         renders per-lesson quizzes
data/schedule.js          ordered lesson list, by Part (drives nav + dashboard + interview drill pool)
data/characters.js        hand-drawn SVG character portraits (original, not traced or AI-generated)
data/lessons/*.js         one file per lesson (concept, story, storyAnim, tech, code, lab, quiz, interview)
```

Progress and notes are saved in your browser's `localStorage`, scoped to `localhost:8000` — they persist across sessions as long as you keep using the same port and don't clear site data. Signing in (via the header auth widget) additionally syncs progress and notes to Supabase (`ai_progress` / `ai_notes` tables, see `../supabase/schema.sql`) for cross-device access — entirely optional, and nothing here gates access to any lesson content.
