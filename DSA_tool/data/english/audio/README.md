# English narration audio

Pre-rendered voice narration for the **English Presentation** tab. Each slide's
English narration is synthesized once into an MP3 here, so playback uses a warm
neural voice on every browser (no reliance on the browser's own speech engine).

- `*.mp3` — one file per slide, named `<deck-id>-<slide-index>.mp3`.
- `manifest.js` — `window.ENGLISH_AUDIO`; maps each deck+slide to its MP3 and the
  per-sentence start times (media seconds) that drive the transcript highlight.
  Loaded by `js/presentation-engine.js`. **Generated — do not hand-edit.**
- `manifest.json` — same data, for tooling.

## Voice

`en-US-AvaMultilingualNeural` (Microsoft Edge neural TTS via `edge-tts`) — an
expressive, conversational voice chosen to sound un-robotic, and multilingual so
it handles the Nepal place-names in the anecdotes gracefully. A gentle `rate=-6%`
is baked in; the in-player Speed slider adjusts `playbackRate` live on top (media
time stays in sync, so highlighting is unaffected).

## Rebuilding (after editing narration text in `data/english/<id>.js`)

Run from this directory:

```bash
node extract_narrations.js            # decks -> narrations.json
pip install --user edge-tts           # one-time
python3 generate_audio.py             # narrations.json -> *.mp3 + manifest.*
```

`generate_audio.py` is identical to the copy in `data/nepali/audio/` — it
auto-detects the language from its own path (`english` here) and selects the
voice and spoken-text normalization (e.g. `O(n)` → "big O of n") accordingly.
Note: `edge-tts` sends the narration text to Microsoft's TTS servers to
synthesize; the generated MP3s are then served locally.
