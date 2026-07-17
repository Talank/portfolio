# English narration audio

Pre-rendered voice narration for the English track of the presentation
(`presentation.html`, narration toggle → English). Each slide's English
narration is synthesized once into an MP3 here, so playback uses a warm neural
voice on every browser (no reliance on the browser's own speech engine).

- `*.mp3` — one file per slide, named `<deck-id>-<slide-index>.mp3`.
- `manifest.js` — `window.ENGLISH_AUDIO`; maps each deck+slide to its MP3 and the
  per-sentence start times (media seconds) that drive the transcript highlight.
  Loaded by `js/presentation-engine.js`. **Generated — do not hand-edit.**
- `manifest.json` — same data, for tooling.

## Voice

**Kokoro-82M** voice `af_heart` (a local neural TTS via `kokoro-onnx`) — chosen
for being notably more natural / less robotic than edge-tts, and it runs
**entirely offline** (nothing is sent to any server). A calm `speed=0.9` is baked
in; the in-player Speed slider adjusts `playbackRate` live on top (media time
stays in sync, so highlighting is unaffected).

Because Kokoro emits no sentence-boundary timestamps, `generate_audio.py`
synthesizes each sentence separately, measures its exact duration, and stitches
the clips together with a short pause — giving precise per-sentence start times.

## Rebuilding (after editing narration text in `data/english/<id>.js`)

Run from this directory:

```bash
node extract_narrations.js                       # decks -> narrations.json
pip install --user kokoro-onnx soundfile misaki  # one-time
python3 generate_audio.py                        # narrations.json -> *.mp3 + manifest.*
```

Model files (~350 MB: `kokoro-v1.0.onnx` + `voices-v1.0.bin`) are cached in
`~/.local/share/kokoro/` and auto-downloaded on first run. Full render of all
100 slides takes ~15 min on CPU.

> The **Nepali** track (`data/nepali/audio/`) uses a different engine —
> edge-tts `ne-NP-HemkalaNeural`, a genuine Nepali voice — because Kokoro has no
> Nepali voice (only Hindi). See that dir's README.
