/*
Master ordered list of study modules for the Local Voice Lab — how to
synthesize natural, NON-ROBOTIC speech entirely on your OWN machine: free,
offline, and with nothing about your text ever leaving the box. This is the
"how did the DSA and One Piece episode narration actually get made" course,
rebuilt around the constraint the cloud version quietly breaks: privacy.

The running thread: the cloud path we started with (edge-tts and friends) sends
every line you synthesize to someone else's server. It is free and it sounds
great — and it is a data-leakage hole. This course teaches the fully-local
replacement, engine by engine and trick by trick, until you can reproduce the
character-voiced, emotion-tuned narration you heard in the episodes without a
single network call.

The capstone app is StrawHat Narrator: feed it a script with speaker labels
(exactly the shape of episodes.js), and it renders one clip per line in a
distinct, personality-matched voice — Luffy's carefree laugh, Nami's fear on
the problem and excitement on the solution — normalizes the text, caches by
content, writes a manifest, and plays back in the browser. All offline.

type: 'lesson' — loads data/lessons/<id>.js into lesson.html?id=<id>
type: 'drill'  — special page (href used directly)

Every lesson teaches essentials first; lessons with real depth to spare also
carry an optional `deepDive`, unlocked site-wide via the Essentials/Full Depth
switch in the header (see js/app.js).
*/
window.SCHEDULE = [
  // ── Part 0: Why Local Voice ──────────────────────────────────────────
  { id: 'why-local-and-private', title: 'Why Local: Free, Offline & Nothing Leaves the Box', category: 'Part 0 — Why Local Voice', timeMin: 30, type: 'lesson' },
  { id: 'how-speech-becomes-sound', title: 'How Text Becomes a Voice: Acoustic Model → Mel → Vocoder', category: 'Part 0 — Why Local Voice', timeMin: 35, type: 'lesson' },

  // ── Part 1: The Local Engine Menu ────────────────────────────────────
  { id: 'piper-fast-and-private', title: 'Piper: Fast, CPU-Only, MIT — the Everyday Workhorse', category: 'Part 1 — The Local Engine Menu', timeMin: 35, type: 'lesson' },
  { id: 'coqui-xtts-and-vits', title: 'Coqui XTTS & VITS: Expressive, Multilingual, Clone-Capable', category: 'Part 1 — The Local Engine Menu', timeMin: 40, type: 'lesson' },
  { id: 'kokoro-and-styletts2', title: 'Kokoro & StyleTTS2: Small Models That Sound Expensive', category: 'Part 1 — The Local Engine Menu', timeMin: 35, type: 'lesson' },
  { id: 'bark-and-nonverbal', title: 'Bark: Laughter, Sighs & the Voice That Improvises', category: 'Part 1 — The Local Engine Menu', timeMin: 35, type: 'lesson' },
  { id: 'choosing-your-engine', title: 'The Menu, Decided: Latency, License, VRAM & Quality', category: 'Part 1 — The Local Engine Menu', timeMin: 35, type: 'lesson' },

  // ── Part 2: Killing the Robot ────────────────────────────────────────
  { id: 'prosody-rate-pitch-volume', title: 'Prosody: The Rate, Pitch & Volume Knobs That Kill the Robot', category: 'Part 2 — Killing the Robot', timeMin: 35, type: 'lesson' },
  { id: 'emotion-and-expressiveness', title: 'Emotion Per Line: Nami Fears the Problem, Loves the Answer', category: 'Part 2 — Killing the Robot', timeMin: 40, type: 'lesson' },
  { id: 'casting-character-voices', title: 'Casting a Crew: One Distinct Voice Per Character', category: 'Part 2 — Killing the Robot', timeMin: 35, type: 'lesson' },
  { id: 'laughs-and-nonverbals', title: '"Shishishi": Making Laughs, Sighs & Gasps Sound Real', category: 'Part 2 — Killing the Robot', timeMin: 35, type: 'lesson' },
  { id: 'text-normalization', title: 'Say It Right: Normalizing Numbers, Big-O & Acronyms', category: 'Part 2 — Killing the Robot', timeMin: 35, type: 'lesson' },

  // ── Part 3: Pipeline Engineering ─────────────────────────────────────
  { id: 'chunking-long-scripts', title: 'Chunking: Splitting Scripts on Sentences for Speed & Reuse', category: 'Part 3 — Pipeline Engineering', timeMin: 35, type: 'lesson' },
  { id: 'caching-and-manifests', title: 'Caching & the Manifest: Never Render the Same Line Twice', category: 'Part 3 — Pipeline Engineering', timeMin: 40, type: 'lesson' },
  { id: 'batch-rendering-async', title: 'Batch Rendering: Async, Concurrency & Retries at Scale', category: 'Part 3 — Pipeline Engineering', timeMin: 35, type: 'lesson' },
  { id: 'playback-in-the-browser', title: 'Playback: One <audio> Element, Advance on Ended, Duck the Music', category: 'Part 3 — Pipeline Engineering', timeMin: 35, type: 'lesson' },

  // ── Part 4: Privacy, Cloning & Ethics ────────────────────────────────
  { id: 'keeping-it-private', title: 'Prove It Never Phones Home: Airgap & Network Checks', category: 'Part 4 — Privacy, Cloning & Ethics', timeMin: 35, type: 'lesson' },
  { id: 'voice-cloning-locally', title: 'Voice Cloning, Locally: From a 10-Second Sample, Privately', category: 'Part 4 — Privacy, Cloning & Ethics', timeMin: 40, type: 'lesson' },
  { id: 'consent-and-provenance', title: 'A Voice Is an Identity: Consent, Provenance & Misuse', category: 'Part 4 — Privacy, Cloning & Ethics', timeMin: 35, type: 'lesson' },

  // ── Part 5: Capstone ─────────────────────────────────────────────────
  { id: 'capstone-strawhat-narrator', title: 'Capstone: Build StrawHat Narrator, Fully Offline', category: 'Part 5 — Capstone', timeMin: 60, type: 'lesson' },
];

/* Category → accent color, used for dashboard group headings, module-card
   left borders, and the lesson-page category pill. One hue per Part. */
window.CATEGORY_COLORS = {
  'Part 0 — Why Local Voice': '#4fd1c5',
  'Part 1 — The Local Engine Menu': '#63b3ed',
  'Part 2 — Killing the Robot': '#9f7aea',
  'Part 3 — Pipeline Engineering': '#f6ad55',
  'Part 4 — Privacy, Cloning & Ethics': '#fc8181',
  'Part 5 — Capstone': '#ed64a6',
};
