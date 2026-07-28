// Extract narration text from every deck in ../<id>.js into narrations.json
// (consumed by generate_audio.py). Run from anywhere: `node extract_narrations.js`.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DECK_DIR = path.resolve(__dirname, '..');          // data/nepali
const OUT = path.join(__dirname, 'narrations.json');

const sandbox = { window: {} };
vm.createContext(sandbox);

for (const f of fs.readdirSync(DECK_DIR).filter(f => f.endsWith('.js'))) {
  vm.runInContext(fs.readFileSync(path.join(DECK_DIR, f), 'utf8'), sandbox, { filename: f });
}

const decks = sandbox.window.NEPALI_DECKS || sandbox.window.ENGLISH_DECKS || {};
const out = {};
for (const [id, deck] of Object.entries(decks)) {
  out[id] = deck.slides.map(s => s.narration);
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
const n = Object.values(out).reduce((a, s) => a + s.length, 0);
console.log(`Extracted ${Object.keys(out).length} decks, ${n} slides -> ${OUT}`);
