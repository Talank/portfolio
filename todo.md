# TODO — Narrated presentations for all courses (handoff)

Autonomous task: port DSA_tool's **narrated slide-show ("presentation")** format to
7 courses. One deck per lesson, **5 slides each**, dual-language narration, dual-format
audio. This file is a self-contained handoff so another Claude Code session (possibly on
another machine) can resume. Read it top to bottom before touching anything.

## Hard constraints (do not violate)
- **LOCAL CHANGES ONLY. No git commits, no push.** Ever.
- Audio compressed maximally: **opus @ 16 kbps mono** (already set in every
  `generate_audio.py`). Target is mobile / low-memory / GitHub-hosted.
- Each deck = **exactly 5 slides**, both `narration_en` and `narration_ne`.
- Narration reuses each lesson's **One Piece hook** (`story.onePiece` in the source
  lesson `.js`) as the teaching spine; Nepali is idiomatic but keeps English technical
  terms inline (English is `af_heart` Kokoro; Nepali is `ne-NP-HemkalaNeural` edge-tts).

## Course order + status
| # | Course | Lessons | Status |
|---|--------|---------|--------|
| 1 | ai_video_course | 22 | ✅ COMPLETE & VERIFIED (22 decks, 110 mp3 + 110 opus each lang) |
| 2 | **AI_course** | 39 | **IN PROGRESS — 8/39 done.** Infra DONE. Resume here. |
| 3 | full_stack_java | 50 | not started (needs infra) |
| 4 | cicd_course | 22 | not started (needs infra) |
| 5 | linux_course | 26 | not started (needs infra) |
| 6 | emacs_course | 22 | not started (needs infra) |
| 7 | llm_audio_course | 20 | not started (needs infra) |

One Piece *episodes* per course = a heavier follow-on deliverable, **not started**,
do only after all presentations land.

---

## RESUME POINT: AI_course, batch 5

**Done (8):** how-ai-fits-together, vectors-cosine, matrices, eigen-svd,
calculus-gradients, probability, statistics-mle, information-theory (Part 0 + Part 1 Math).

**Remaining 31, in schedule.js order — do 2 per batch:**
```
ml-fundamentals        <- batch 5 (Part 2 Classical ML begins)
linear-regression      <- batch 5
logistic-regression
text-as-numbers
knn-trees-forests
clustering-pca
model-evaluation
neural-networks
backpropagation
training-neural-nets
pytorch-fundamentals
cnn-rnn-tour
tokenization
word-embeddings
seq2seq-attention
classic-nlp-tasks
self-attention
transformer-architecture
bert-vs-gpt
minigpt-code
llm-pretraining
finetuning-lora
rlhf-alignment
inference-sampling
using-models-apis
embeddings-rag
agents-from-scratch
langchain-langgraph
multi-framework-agents
agent-memory-eval-safety
ml-system-design
```
(interview-drill is NOT a lesson — skip it.)

### Batch recipe (proven — repeat per 2 lessons)
1. Read the 2 source lessons: `AI_course/data/lessons/<id>.js`. Grab each `story.onePiece`
   hook to use as the narration spine.
2. Author 2 bilingual module dicts (5 slides each) and **append** them to the `MODULES`
   list in `AI_course/data/pres_content.py`, before the closing `]`. Module dict shape:
   ```python
   {"id","title","subtitle_en","subtitle_ne","intro_en","intro_ne",
    "slides":[ {"heading","bullets":[html...], optional "code", optional "big",
                "narration_en","narration_ne"}, ... x5 ]}
   ```
   Bullets are HTML strings (`<b>`, `<code>`, `<i>`).
3. **GOTCHA — strip stray `narration_en_note`:** a `"narration_en_note": ""` field keeps
   sneaking into slide 1. Remove it, then verify:
   ```bash
   cd /home/tbaral/portfolio/AI_course/data
   python3 - <<'EOF'
   import re
   s=open('pres_content.py').read()
   s=re.sub(r'[ \t]*"narration_en_note": "",\n','',s)
   open('pres_content.py','w').write(s)
   EOF
   grep -c narration_en_note pres_content.py   # MUST print 0 before building
   ```
4. Build the deck `.js` + titles:
   ```bash
   cd /home/tbaral/portfolio/AI_course/data && python3 pres_content.py
   ```
5. Extract narration text in **both** audio dirs:
   ```bash
   cd /home/tbaral/portfolio/AI_course/data/english/audio && node extract_narrations.js
   cd /home/tbaral/portfolio/AI_course/data/nepali/audio  && node extract_narrations.js
   ```
6. Generate audio — launch each as a **harness-tracked background** Bash job
   (`run_in_background: true`), each with an explicit `cd`:
   ```bash
   cd /home/tbaral/portfolio/AI_course/data/english/audio && python3 generate_audio.py   # Kokoro, ~1 min/slide
   cd /home/tbaral/portfolio/AI_course/data/nepali/audio  && python3 generate_audio.py   # edge-tts (network)
   ```
   - `generate_audio.py` regenerates ALL slides every run (no skip). Kokoro workers share
     argv `generate_audio`, so `pkill -f generate_audio` catches transient workers and
     looks like a respawn loop — to stop it, kill the PPID-1/harness parent, not workers.
   - **Never nohup. Never trust persisted cwd — always `cd` explicitly in the command.**
   - Verify a job's cwd with `readlink /proc/<pid>/cwd` if unsure.
7. When both jobs finish (auto-notify), verify at data level:
   ```bash
   cd /home/tbaral/portfolio/AI_course/data
   for L in english nepali; do
     echo "== $L =="; ls $L/*.js | grep -v manifest | wc -l   # deck count == modules
     ls $L/audio/*.mp3 | wc -l; ls $L/audio/*.opus | wc -l    # each == 5 * decks
   done
   ```
   Confirm new deck ids appear in `data/<lang>/audio/manifest.js` and there are no
   zero-duration entries.
8. Update PROGRESS.md (scratchpad) with the batch's job ids and the new N/39 count.

---

## Per-NEW-course infra (courses 3–7 — build ONCE before authoring)
Replicate what AI_course already has (model on ai_video_course / AI_course):
1. `mkdir -p data/{english,nepali}/audio`; copy `extract_narrations.js` +
   `generate_audio.py` from ai_video_course (english/audio = **Kokoro** variant,
   nepali/audio = **edge-tts** variant). Opus is already 16k in those copies — confirm
   with `grep b:a generate_audio.py`.
2. Copy `presentation.html` from ai_video_course; change `<title>`, `keyPrefix`,
   `courseName`, and the `localStorage.getItem('<keyPrefix>-lang')` key. Script tags:
   `data/schedule.js`, `../shared/supabase-client.js`, `../shared/auth-ui.js`,
   `js/app.js`, `data/pres-titles.js`, `../shared/presentation-engine.js`.
3. Add `['presentation.html','Presentation']` to `js/app.js` `buildHeader` `links[]`
   (between Dashboard and the next item).
4. Ensure the `np-` presentation CSS block is appended to `css/style.css` (copy the
   `/* नेपाली Presentation */` `.np-stage`…`.np-visual svg` block from
   ai_video_course/css/style.css). Confirm all referenced CSS vars exist.
5. Create `data/pres_content.py` importing the shared build:
   ```python
   import os, sys
   HERE = os.path.dirname(os.path.abspath(__file__))
   sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..", "..", "shared")))
   import pres_build
   MODULES = [ ... ]
   if __name__ == "__main__":
       course_dir = os.path.abspath(os.path.join(HERE, ".."))
       pres_build.build(course_dir, MODULES)
   ```
   Get the lesson id order from that course's `data/schedule.js` (type==='lesson').
6. Then author in 2-lesson batches using the batch recipe above.

## Shared infra (already built — do NOT rebuild, do NOT touch DSA's own engine)
- `shared/presentation-engine.js` — config-driven engine; pages call
  `initPresentation({page, keyPrefix, courseName, writeupHref, titles})`.
- `shared/pres_build.py` — `build(course_dir, MODULES)` → `data/english/<id>.js`
  (window.ENGLISH_DECKS), `data/nepali/<id>.js` (window.NEPALI_DECKS),
  merged `data/pres-titles.js`.
- `~/.local/bin/ffmpeg` — static ffmpeg 7.0.2 (no system ffmpeg / no sudo).
- `~/.local/share/kokoro` — Kokoro-82M onnx + voices (English TTS, local).
- edge-tts = network (Nepali TTS). Both confirmed working.

## Verification in a browser (optional, stronger)
```bash
cd /home/tbaral/portfolio && python3 -m http.server 8913 &
node scratchpad/test-aivideo.js   # edit id/course as needed
```

## Progress tracker
Live status lives in the session scratchpad `PROGRESS.md`
(`/tmp/claude-1005/-home-tbaral-portfolio/<session>/scratchpad/PROGRESS.md`) — but that
path is session-specific. **This todo.md is the portable source of truth** across machines;
update the status table and the AI_course "Done/Remaining" lists as batches complete.
