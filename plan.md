# Plan — Narrated Presentations (English + नेपाली) for All Courses

Port the DSA_tool narrated-slide-show feature into the remaining seven courses,
starting with `ai_video_course`, then `AI_course`, `full_stack_java`,
`cicd_course`, and finally the rest.

Decisions already made (2026-07-18):

- **Order**: ai_video_course → AI_course → full_stack_java → cicd_course →
  linux_course → emacs_course → llm_audio_course
- **Coverage**: one deck per lesson (full parity with DSA, which is 20/20)
- **Voices**: same split DSA uses — Kokoro for English, edge-tts for Nepali
- **Audio**: optimized dual-format (`.mp3` + `.opus`), per DSA convention

---

## 1. How the DSA presentation actually works

Reverse-engineered from `DSA_tool/`. Everything below is the contract any new
course has to satisfy.

### Files involved

| Path | Role |
| --- | --- |
| `presentation.html` | 53-line shell; preloads manifest + deck + slide-0 clip, then calls `initPresentation()` |
| `js/presentation-engine.js` | 591 lines; the whole player (render, audio, transcript, lang toggle) |
| `data/english/<deck>.js` | English deck: slides + English narration |
| `data/nepali/<deck>.js` | Nepali deck: same English slide bodies, Nepali narration |
| `data/<lang>/audio/*.mp3` + `*.opus` | One clip per slide, both formats |
| `data/<lang>/audio/manifest.js` | Maps deck+slide → file, duration, per-sentence start times |
| `data/<lang>/audio/extract_narrations.js` | Decks → `narrations.json` |
| `data/<lang>/audio/generate_audio.py` | `narrations.json` → clips + manifest |
| `css/style.css` lines 530–652 | The `np-*` style block |

### Deck data shape

```js
window.ENGLISH_DECKS['two-pointers'] = {
  id: 'two-pointers',
  title: 'Two Pointers',
  titleNe: 'Two friends walking in from opposite ends',
  intro: 'find a pair in a sorted array in O(n)…',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: ['…'],        // optional, HTML allowed
      code: 'def f(): …',    // optional, escaped
      big: '"Too small? Left steps up."',  // optional pull-quote
      narration: 'Right, our first pattern — …',
    },
    // …5 slides per deck
  ],
};
```

The Nepali file is identical but sets `window.NEPALI_DECKS` and swaps only
`narration` + `titleNe` to Nepali. **Slide bodies stay English in both.**

### Manifest shape

```js
window.ENGLISH_AUDIO = {
  voice: 'kokoro:af_heart',
  speed: 0.9,
  decks: {
    'two-pointers': [
      { file: 'two-pointers-0.mp3', dur: 45.445,
        sentences: [0.0, 2.669, 4.293, …] },  // media-seconds per sentence
      …
    ],
  },
};
```

`sentences[]` drives the read-along transcript highlight and click-to-seek.

### Engine behaviours worth preserving

- **Lazy loading** via `<script>` injection, so it works over `file://` too
- **Opus-first**: `clipUrl()` rewrites `.mp3`→`.opus` when
  `canPlayType('audio/ogg; codecs=opus')` passes; `onerror` retries as MP3
- **`warmDeckAudio()`**: after slide 0 renders, quietly `fetch()`es the whole
  deck one clip at a time (250 ms apart) so later slides never wait
- **`prefetch()`**: warms the next two slides
- **TTS fallback**: `speechSynthesis` covers any slide whose clip is missing
- **Persisted state**: `dsa-pres-lang`, `dsa-pres-rate`, `dsa-pres-auto`
- **Keyboard**: ←/→ change slide, Space plays/pauses

---

## 2. What has to be generalized

DSA's engine is not directly reusable — four things are hardcoded to DSA:

1. **`TITLES`** — a 20-entry ne/en map of poetic per-deck subtitles (engine
   lines 29–74), used on the index cards
2. **Storage keys** — `dsa-pres-*`
3. **Write-up links** — `pattern.html?id=` / `pythonic-idioms.html`, chosen by
   `mod.type === 'pattern'`. Other courses use `lesson.html?id=`
4. **Index copy** — `indexTitle`/`indexLede`/`indexCard` name the DSA course

**Proposal**: write one config-driven `shared/presentation-engine.js` that all
new courses load, leaving `DSA_tool/js/presentation-engine.js` untouched (no
regression risk to a finished, working feature). Config becomes:

```js
initPresentation({
  page: 'presentation.html',
  keyPrefix: 'aivideo-pres',
  courseName: 'AI Video Course',
  writeupHref: id => `lesson.html?id=${id}`,
  titles: window.PRES_TITLES,   // from data/pres-titles.js
  lede: { ne: '…', en: '…' },
});
```

Per-deck subtitles move out of the engine into a generated
`data/pres-titles.js` (`window.PRES_TITLES = { ne: {...}, en: {...} }`).

Index must also filter `window.SCHEDULE` to `type === 'lesson'`, since these
courses carry `type: 'drill'` entries that have no deck.

---

## 3. Per-course work (repeat 7×)

1. Append CSS block 530–652 from `DSA_tool/css/style.css`
2. Add `presentation.html` (copy of DSA's shell, adjusted paths/keys)
3. Add `presentation.html` to the `links[]` array in `js/app.js`'s
   `buildHeader()`; link from `index.html`
4. Author `data/english/<id>.js` — one deck per lesson, 5 slides
5. Author `data/nepali/<id>.js` — mirrored, Nepali narration
6. Write `data/pres-titles.js`
7. Copy `extract_narrations.js` + both `generate_audio.py` variants into
   `data/{english,nepali}/audio/`
8. Run `node extract_narrations.js` then `python3 generate_audio.py` per language
9. Verify: index renders, both languages play, transcript highlight tracks,
   click-to-seek works, prev/next + keyboard work

---

## 4. Scale — the honest numbers

| Course | Lessons | Slides (×5) | Clips (×2 langs) |
| --- | ---: | ---: | ---: |
| ai_video_course | 22 | 110 | 220 |
| AI_course | 39 | 195 | 390 |
| full_stack_java | 50 | 250 | 500 |
| cicd_course | 22 | 110 | 220 |
| linux_course | 26 | 130 | 260 |
| emacs_course | 22 | 110 | 220 |
| llm_audio_course | 20 | 100 | 200 |
| **Total** | **201** | **1,005** | **2,010** |

With `.opus` siblings that is **~4,020 audio files**.

The expensive part is not the code or the synthesis — it is **2,010 original
narration scripts** (1,005 English + 1,005 Nepali). DSA's narration is genuinely
authored prose with Nepal-flavoured anecdotes (sacks on a shop shelf, Dashain
tika, the temple queue), not a reading of the lesson text. Matching that
quality is the real cost, and it is why this runs course-by-course rather than
in one pass.

---

## 5. Blockers & open items

### `ffmpeg` is not installed — blocks the "optimized" format

`build_opus_siblings()` in `generate_audio.py` shells out to
`ffmpeg -c:a libopus -b:a 24k -ac 1`. Verified absent:

```
which ffmpeg ffprobe   → nothing
/usr/bin, /usr/local/bin, /snap/bin, ~/.local/bin → not present
```

Without it, only MP3s get built and the engine silently falls back (its
`onerror` handler already handles a missing `.opus`) — but the ~55% size win is
lost, which is the whole point of the optimization.

**Fix**: `sudo apt install ffmpeg`

### Verified as working

- `node` v20.20.2
- `edge-tts` 7.2.8
- `kokoro_onnx`, with models already cached in `~/.local/share/kokoro`
  (`kokoro-v1.0.onnx`, `voices-v1.0.bin`)

### Open questions

- **Visuals**: DSA slides can carry an animated SVG via
  `window.getSlideVisual(deckId, slideIdx)` in `js/visuals.js`. Not yet decided
  whether new courses get these or ship text-only slides (engine already
  guards for absence, so text-only is safe).
- **Nepali narration quality**: DSA's Nepali is idiomatic, not translated.
  Confirm the same bar applies here.
- **`to_speakable()`**: DSA's normalizer is DSA-specific (Big-O, XOR, 3Sum).
  Each course needs its own token list — e.g. ai_video_course will need
  TTS-safe spellings for XTTS, Wav2Lip, AnimateDiff, ffmpeg, LoRA.

---

## 6. Change already made

One edit landed before this plan was written:

- **`ai_video_course/css/style.css`** — appended the 123-line `np-*` block
  (lines 530–652 of `DSA_tool/css/style.css`), preceded by a blank line.
  Purely additive; no existing rule touched. The course's `:root` variables
  (`--accent`, `--accent-2`, `--text-dim`, `--bg-panel-2`, `--radius`, …) and
  shared classes (`.pill`, `.lede`, `.card`, `.grid`, `.module-card`,
  `footer.pagenav`) are identical to DSA's, so it ports with zero adjustment.

Revert with `git checkout ai_video_course/css/style.css` if you'd rather start
clean.

Nothing else was created or modified. No commits made.
