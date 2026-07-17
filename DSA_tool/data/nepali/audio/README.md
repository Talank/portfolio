# Nepali narration audio

Pre-rendered voice narration for the नेपाली Presentation tab. Each slide's
Nepali narration is synthesized once into an MP3 here, so playback uses a real
neural Nepali voice on every browser instead of the machine's (usually missing)
Nepali speech-synthesis voice.

- `*.mp3` — one file per slide, named `<deck-id>-<slide-index>.mp3`.
- `manifest.js` — `window.NEPALI_AUDIO`; maps each deck+slide to its MP3 and the
  per-sentence start times (media seconds) that drive the transcript highlight.
  Loaded by `js/presentation-engine.js`. **Generated — do not hand-edit.**
- `manifest.json` — same data, for tooling.

> The English track under `data/english/audio/` uses a **different** engine —
> Kokoro-82M (`af_heart`), a local neural TTS that sounds more natural. Its
> `generate_audio.py` is Kokoro-specific; see that dir's README. Both tracks feed
> the same page (`presentation.html`) via a narration-language toggle.

## Voice

`ne-NP-HemkalaNeural` (Microsoft Edge neural TTS via [`edge-tts`]) — a soft,
friendly female voice. A gentle `rate=-8%, pitch=-2Hz` is baked in for a soothing
pace; the in-player Speed slider adjusts `playbackRate` live on top of that
(media time stays in sync, so highlighting is unaffected).

## Rebuilding (after editing narration text in `data/nepali/<id>.js`)

Run from this directory:

```bash
node extract_narrations.js            # decks -> narrations.json
pip install --user edge-tts           # one-time
python3 generate_audio.py             # narrations.json -> *.mp3 + manifest.*
```

`generate_audio.py` re-synthesizes every slide (concurrency 4, with retries) and
rewrites both manifests. Note: `edge-tts` sends the narration text to Microsoft's
TTS servers to synthesize the audio; the generated MP3s are then served locally.
