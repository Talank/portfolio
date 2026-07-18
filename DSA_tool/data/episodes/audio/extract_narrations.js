/* Extract episode dialogue into narrations.json for the audio generator.
   Loads data/episodes.js (window.EPISODES) in a bare VM context and writes,
   per episode, the ordered list of spoken steps: { speaker, line }.
   Run from this directory:  node extract_narrations.js  */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..', '..');   // DSA_tool/
const epFile = path.join(ROOT, 'data', 'episodes.js');

const win = {};
const ctx = { window: win, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(epFile, 'utf8'), ctx);

const EPISODES = win.EPISODES || {};
const out = {};
for (const [id, ep] of Object.entries(EPISODES)) {
  out[id] = (ep.steps || []).map(s => ({ speaker: s.speaker, line: s.line }));
}

fs.writeFileSync(
  path.join(__dirname, 'narrations.json'),
  JSON.stringify(out, null, 1)
);
const nEp = Object.keys(out).length;
const nLine = Object.values(out).reduce((a, s) => a + s.length, 0);
console.log(`Wrote narrations.json: ${nEp} episodes, ${nLine} lines.`);
