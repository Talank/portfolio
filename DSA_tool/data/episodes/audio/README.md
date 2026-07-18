# Episode narration audio (character-voiced, pre-rendered)

The One Piece episodes (`episode.html`) used to read each dialogue line with the
**browser speech synthesizer** — one flat, robotic voice for everyone. They now
play **pre-rendered neural audio**, with a **distinct voice cast per character**
so each Straw Hat sounds like themselves.

## Casting (edge-tts neural voices, tuned with rate/pitch)

| Character | Voice | Feel |
|-----------|-------|------|
| Luffy   | `en-US-GuyNeural` (+13% / +12Hz)        | bright, fast, excitable |
| Nami    | `en-US-JennyNeural` (+4% / +9Hz)        | warm, playful, confident |
| Usopp   | `en-US-BrianNeural` (+7% / +22Hz)       | high, jittery, nasal-ish braggart |
| Zoro    | `en-US-ChristopherNeural` (-5% / -12Hz) | deep, slow, gruff |
| Robin   | `en-GB-SoniaNeural` (-8% / -5Hz)        | calm, elegant, measured |
| Chopper | `en-US-AnaNeural` (+6% / +0Hz)          | small child voice, cute |
| Brook   | `en-GB-ThomasNeural` (-3% / -14Hz)      | deep, theatrical, old |

To re-cast, edit `VOICES` in `generate_audio.py` and rebuild.

## Rebuild

```bash
cd data/episodes/audio
node extract_narrations.js     # data/episodes.js -> narrations.json
pip install --user edge-tts
python3 generate_audio.py      # narrations.json -> <episode-id>-<step>.mp3 + manifest.js
```

- `manifest.js` defines `window.EPISODE_AUDIO = { voices, decks: { <episode-id>: [ {file, speaker, voice, dur}, … ] } }`, loaded by `episode.html`.
- `js/episode-engine.js` plays each step's clip through one `<audio>` element and advances when it ends; if a clip is missing it falls back to the old browser synthesizer.
- edge-tts sends text to Microsoft for synthesis (same engine as the Nepali presentation track). It's synthesis of our own writing — no recordings, no licensed voices.
- `narrations.json` is a rebuildable intermediate.
