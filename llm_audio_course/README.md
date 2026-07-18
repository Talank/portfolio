# AI Video Course

A local, static, zero-dependency course on **building an LLM-powered content-creation app** — a talking-avatar video generator — end to end. The running product you assemble as you learn is **DenDen Studio**: give it a voice sample, a picture, and a description, and it generates an animated talking video. Swap voices. Speak into the mic and the picture speaks with you, live. Fix any generated motion either by describing the change in plain words or by click-dragging it on a canvas.

**Open-source models only, running on your own machine.** Local LLMs via Ollama and Hugging Face (GGUF quantization, tool calling, open vision-language models), Whisper for speech-to-text, XTTS/Piper for TTS and voice cloning, Wav2Lip/SadTalker/LivePortrait-style talking heads, AnimateDiff-style text-guided motion. No paid model APIs anywhere in the course.

**This course teaches — you build.** The site contains no app code and no model weights; it stays tiny. Every lab is either a small pure-Python exercise that runs right in the browser (via Pyodide) or comes with an exact "run it locally" recipe for the model-dependent parts. Models you choose to try live in your own Ollama/Hugging Face cache, downloaded only when you decide to.

## Running it

```bash
./start.sh
```

Then open **http://localhost:8000/ai_video_course/**. (Serves the whole repo root with `python3 -m http.server`, from the parent directory, so `../shared/*` resolves the same way locally as on GitHub Pages — nothing else to install.)

## How to use it

1. In each lesson: read the concept, open the **story + animation** the first time through, click through the **interactive walkthrough**, expand any **Technicality corner** question you can't already answer out loud, then do the **Code Lab**.
2. Before marking a lesson complete, try the **interview questions** at the bottom out loud.
3. Keep the [Cheat Sheet](cheat-sheet.html) open in a second tab — every model, command, and pipeline recipe in one place.
4. Finish with the timed [Interview Drill](interview.html) — randomized questions from everything you studied, on a countdown.

Every lesson teaches the essentials by default — flip **Essentials → Full Depth** in the header any time you want a topic's deeper mechanism, edge cases, and "why it's actually built that way." Nothing is gated behind it.

## Curriculum (22 lessons, ~14h)

| Part | Topic | Lessons |
|------|-------|---------|
| 0 | The Product & the Plan | 2 |
| 1 | Local LLM Core Skills | 3 |
| 2 | Voice: TTS, Cloning & Swapping | 3 |
| 3 | Making Pictures Talk | 3 |
| 4 | The Editing UX | 3 |
| 5 | Pipeline Engineering | 3 |
| 6 | Shipping It | 3 |
| 7 | Evaluation & Capstone | 2 |

## Progress & sync

Progress and notes are saved in your browser's `localStorage`, scoped to `localhost:8000`. Signing in (via the header auth widget) additionally syncs progress and notes to Supabase (`localvoice_progress` / `localvoice_notes` tables, see `../supabase/schema.sql`) for cross-device access — entirely optional, and nothing gates access to any lesson content.

## Scope

This is lean and focused: the 20% of ML-app engineering that does 80% of the work of shipping a real content-creation product — which models exist, how they connect, where the latency and VRAM go, how the editing UX stays humane, and where consent and provenance are non-negotiable. It is not a model-training course; every model is used, adapted, and orchestrated, never trained from scratch. Flip on **Full Depth** wherever you want to go from "can build it" to "could explain the internals in an interview."
