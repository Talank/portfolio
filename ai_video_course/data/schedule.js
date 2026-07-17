/*
Master ordered list of study modules for the AI Video Course — how to BUILD
an LLM-powered content-creation app (talking-avatar video generation) end to
end, using OPEN-SOURCE models only: local LLMs via Ollama / Hugging Face,
Whisper for speech-to-text, XTTS/Piper for speech + voice cloning,
Wav2Lip/SadTalker/LivePortrait-style talking heads, AnimateDiff/SVD-style
motion — no paid model APIs anywhere in the course.

The capstone app is DenDen Studio (named for One Piece transponder snails,
which transmit voice — and, for visual Den Den Mushi, moving pictures):
upload a voice sample + a picture + a description, and the app generates an
animated talking video; swap voices; speak live and the picture speaks with
you; fix generated animation by describing the change or by click-dragging.
The course TEACHES the pieces — you build the app yourself as you go.

type: 'lesson' — loads data/lessons/<id>.js into lesson.html?id=<id>
type: 'drill'  — special page (href used directly)

Every lesson teaches essentials first; lessons with real depth to spare also
carry an optional `deepDive` section, unlocked site-wide via the Essentials/
Full Depth switch in the header (see js/app.js).
*/
window.SCHEDULE = [
  // ── Part 0: The Product & the Plan ───────────────────────────────────
  { id: 'what-we-are-building', title: 'DenDen Studio: A Voice, a Picture & a Description Walk Into an App', category: 'Part 0 — The Product & the Plan', timeMin: 30, type: 'lesson' },
  { id: 'anatomy-of-an-llm-app', title: 'Anatomy of an LLM App: Models, Orchestration & Why Open Source', category: 'Part 0 — The Product & the Plan', timeMin: 35, type: 'lesson' },

  // ── Part 1: Local LLM Core Skills ────────────────────────────────────
  { id: 'running-local-llms', title: 'Ollama & Hugging Face: Running a Real LLM on Your Own Machine', category: 'Part 1 — Local LLM Core Skills', timeMin: 40, type: 'lesson' },
  { id: 'structured-outputs-tool-use', title: 'Structured Output & Tool Calling: Making a Local LLM Drive Your Code', category: 'Part 1 — Local LLM Core Skills', timeMin: 40, type: 'lesson' },
  { id: 'multimodal-models', title: 'Open Vision-Language Models: Letting the App See the Uploaded Picture', category: 'Part 1 — Local LLM Core Skills', timeMin: 35, type: 'lesson' },

  // ── Part 2: Voice — TTS, Cloning & Swapping ──────────────────────────
  { id: 'text-to-speech-open-models', title: 'Open TTS: How Text Becomes a Human-Sounding Voice (Piper, XTTS, Bark)', category: 'Part 2 — Voice: TTS, Cloning & Swapping', timeMin: 35, type: 'lesson' },
  { id: 'voice-cloning-from-a-sample', title: 'Voice Cloning: From a 10-Second Sample to Any Sentence in That Voice', category: 'Part 2 — Voice: TTS, Cloning & Swapping', timeMin: 40, type: 'lesson' },
  { id: 'speech-to-text-and-voice-swap', title: 'Whisper & Voice Conversion: You Speak, the Cloned Voice Speaks', category: 'Part 2 — Voice: TTS, Cloning & Swapping', timeMin: 40, type: 'lesson' },

  // ── Part 3: Making Pictures Talk ─────────────────────────────────────
  { id: 'talking-head-fundamentals', title: 'Talking Heads: Audio → Lip Sync → a Still Picture That Speaks', category: 'Part 3 — Making Pictures Talk', timeMin: 40, type: 'lesson' },
  { id: 'animating-from-a-description', title: 'Animate by Description: Text-Guided Motion for a Single Image', category: 'Part 3 — Making Pictures Talk', timeMin: 40, type: 'lesson' },
  { id: 'realtime-avatar-pipeline', title: 'The Live Avatar: Mic In, Talking Picture Out, Under a Latency Budget', category: 'Part 3 — Making Pictures Talk', timeMin: 45, type: 'lesson' },

  // ── Part 4: The Editing UX ───────────────────────────────────────────
  { id: 'keyframes-timelines-motion-paths', title: 'Keyframes, Timelines & Motion Paths: The Data Model Behind Every Edit', category: 'Part 4 — The Editing UX', timeMin: 35, type: 'lesson' },
  { id: 'click-drag-correction', title: 'Click-Drag Fixing: Direct Manipulation of Generated Motion on a Canvas', category: 'Part 4 — The Editing UX', timeMin: 40, type: 'lesson' },
  { id: 'llm-assisted-editing', title: '"Make the Smile Bigger at 0:03": Natural-Language Edits via Tool Calls', category: 'Part 4 — The Editing UX', timeMin: 35, type: 'lesson' },

  // ── Part 5: Pipeline Engineering ─────────────────────────────────────
  { id: 'media-pipeline-orchestration', title: 'ffmpeg & Job Queues: Wiring Models Into One Reliable Media Pipeline', category: 'Part 5 — Pipeline Engineering', timeMin: 40, type: 'lesson' },
  { id: 'llm-as-director', title: 'The LLM as Director: One Description In, a Whole Pipeline Plan Out', category: 'Part 5 — Pipeline Engineering', timeMin: 40, type: 'lesson' },
  { id: 'hardware-quantization-caching', title: 'Fitting It All: VRAM Budgets, Quantization Tradeoffs & Caching Renders', category: 'Part 5 — Pipeline Engineering', timeMin: 35, type: 'lesson' },

  // ── Part 6: Shipping It ──────────────────────────────────────────────
  { id: 'backend-api-design', title: 'The Backend: Uploads, Long-Running Jobs & Live Progress', category: 'Part 6 — Shipping It', timeMin: 40, type: 'lesson' },
  { id: 'creator-frontend', title: 'The Creator Frontend: Upload, Preview, Edit — Without Fighting the User', category: 'Part 6 — Shipping It', timeMin: 35, type: 'lesson' },
  { id: 'safety-consent-ethics', title: 'Voices Are Identities: Consent, Provenance & Misuse Prevention', category: 'Part 6 — Shipping It', timeMin: 35, type: 'lesson' },

  // ── Part 7: Evaluation & Capstone ────────────────────────────────────
  { id: 'evaluating-generated-media', title: 'Is It Any Good? Evaluating Lip Sync, Voices & Video Quality', category: 'Part 7 — Evaluation & Capstone', timeMin: 35, type: 'lesson' },
  { id: 'capstone-denden-studio', title: 'Capstone: Assemble DenDen Studio From Every Piece You Built', category: 'Part 7 — Evaluation & Capstone', timeMin: 60, type: 'lesson' },
];

/* Category → accent color, used for dashboard group headings, module-card
   left borders, and the lesson-page category pill. Eight distinct hues on
   the dark background, one per Part. */
window.CATEGORY_COLORS = {
  'Part 0 — The Product & the Plan': '#4fd1c5',
  'Part 1 — Local LLM Core Skills': '#63b3ed',
  'Part 2 — Voice: TTS, Cloning & Swapping': '#9f7aea',
  'Part 3 — Making Pictures Talk': '#ecc94b',
  'Part 4 — The Editing UX': '#68d391',
  'Part 5 — Pipeline Engineering': '#fc8181',
  'Part 6 — Shipping It': '#f6ad55',
  'Part 7 — Evaluation & Capstone': '#ed64a6',
};
