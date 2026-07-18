# Local Voice Lab — the LLM Audio course

A local, static, zero-dependency course on **synthesizing natural, non-robotic speech entirely on your own machine** — free, offline, and with nothing about your text ever leaving the box. It's the "how did the DSA and One Piece episode narration actually get made" course, rebuilt around the constraint the cloud version quietly breaks: **privacy**.

The running product you assemble as you learn is **StrawHat Narrator**: feed it a script with speaker labels (the exact shape of the episodes) and it renders one clip per line in a distinct, personality-matched, emotion-tuned voice — Luffy's carefree "shishishi," Nami's fear on the problem and excitement on the solution — normalizes the text, caches by content, writes a manifest, and plays it back in the browser with music ducked under the voice. All offline.

**Open-source, local engines only.** Piper (MIT, CPU-fast), Kokoro (Apache, small + premium), Coqui XTTS (expressive, zero-shot cloning), Bark (real non-verbals), plain VITS/StyleTTS2, HiFi-GAN vocoders. The cloud path we started with (edge-tts and friends) sounds great and is free — and sends every line you synthesize to someone else's server. This course teaches the fully-local replacement, engine by engine and trick by trick, until you can reproduce that narration without a single network call.

**This course teaches — you build.** The site contains no app code and no model weights; it stays tiny. Every lab is either a small pure-Python exercise that runs right in the browser (via Pyodide) or comes with an exact "run it locally" recipe for the model-dependent parts. Models you choose to try live in your own cache, downloaded only when you decide to — and the course shows you how to pin them offline and prove nothing phones home.

## Running it

```bash
./start.sh
```

Then open **http://localhost:8000/llm_audio_course/**. (Serves the whole repo root with `python3 -m http.server`, from the parent directory, so `../shared/*` resolves the same way locally as on GitHub Pages — nothing else to install.)

## How to use it

1. In each lesson: read the concept, open the **story** (One Piece + a sitcom analogy) the first time through, work the **Technicality corner** questions you can't already answer out loud, then do the **Code Lab** (real Python, in the browser).
2. Before marking a lesson complete, try the **interview questions** at the bottom out loud.
3. Keep the [Cheat Sheet](cheat-sheet.html) open in a second tab — every engine, knob, and pipeline recipe in one place.
4. Finish with the timed [Interview Drill](interview.html) — randomized questions from everything you studied, on a countdown.

Every lesson teaches the essentials by default — flip **Essentials → Full Depth** in the header any time you want a topic's deeper mechanism, edge cases, and "why it's actually built that way." Nothing is gated behind it.

## Curriculum (20 lessons, ~12h)

| Part | Topic | Lessons |
|------|-------|---------|
| 0 | Why Local Voice | 2 |
| 1 | The Local Engine Menu | 5 |
| 2 | Killing the Robot (prosody, emotion, casting, laughs, normalization) | 5 |
| 3 | Pipeline Engineering (chunking, caching, batch, playback) | 4 |
| 4 | Privacy, Cloning & Ethics | 3 |
| 5 | Capstone: StrawHat Narrator | 1 |

## Progress & sync

Progress and notes are saved in your browser's `localStorage`, scoped to `localhost:8000` (keys `localvoice-progress-v1` / `localvoice-notes-v1` / `localvoice-depth-v1`). Signing in (via the header auth widget) additionally syncs progress and notes to Supabase (`localvoice_progress` / `localvoice_notes` tables, see `../supabase/schema.sql`) for cross-device access — entirely optional, and nothing gates access to any lesson content.

## Scope

This is lean and focused: the 20% of local-TTS engineering that does 80% of the work of shipping non-robotic, private narration — which engines exist and when to route to each, how prosody/emotion/casting kill the "robot," how chunking + content-addressed caching + batch rendering make a 600-line script render in minutes and re-render only what changed, and where privacy (airgap-provable) and consent (for cloning) are non-negotiable. It is not a model-training course; every engine is used, adapted, and orchestrated, never trained from scratch. Flip on **Full Depth** wherever you want to go from "can build it" to "could explain the internals in an interview."
