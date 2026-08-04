/* Prove the Dojo's audio still belongs to the Dojo's writing.
 *
 * The clips are paired to the dialogue by POSITION — clip 3 is line 3 — which
 * is the cheapest correct thing as long as nobody edits a scene. The moment
 * someone inserts a line, every clip after it belongs to the wrong speaker, and
 * nothing anywhere throws: the fight plays, Robin's line comes out in Usopp's
 * voice, and the only way to find out is to sit through it.
 *
 * So this re-derives the pairing the same way the page does and checks it, plus
 * the two things that go wrong on the disk side: a manifest naming a clip that
 * was never built, and clips left behind by writing that has since changed.
 *
 *     node check_dojo_audio.js
 *
 * Run it after editing any scene, and after any build. If it complains that
 * lines and clips disagree, the fix is to re-run the two build steps:
 *     node extract_dojo_lines.js && python3 build_dojo_audio.py
 */
'use strict';
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const TOOL = path.resolve(HERE, '..', '..', '..');

global.window = global;
function load(rel) { require(path.join(TOOL, rel)); }

load('data/lc150.js');
load('data/grandline/index.js');
for (const f of fs.readdirSync(path.join(TOOL, 'data/grandline'))) {
  if (f.endsWith('.js') && f !== 'index.js') load('data/grandline/' + f);
}
load('data/dojo-scenes.js');
require(path.join(HERE, 'manifest.js'));

const LC = window.LC150 || [];
const EPISODES = window.EPISODES || {};
const SCENES = window.DOJO_SCENES || {};
const AUDIO = window.DOJO_AUDIO || null;

if (!AUDIO) {
  console.error('no manifest.js — run: python3 build_dojo_audio.py');
  process.exit(1);
}

/* The page's own lookup: an arc episode carrying this number, else the
   generated scene. Kept identical to dojo.html's sceneFor(). */
function sceneFor(n) {
  for (const k of Object.keys(EPISODES)) {
    const e = EPISODES[k];
    if (e.leetcode && e.leetcode.number === n) return e;
  }
  return SCENES[n] || null;
}

const problems = [];
let refs = 0;
for (const p of LC) {
  const s = sceneFor(p.n);
  if (!s) { problems.push(`#${p.n} ${p.t}: no scene at all`); continue; }

  const lines = (s.steps || []).filter(x => x && x.line);
  const clips = AUDIO.problems[String(p.n)] || [];
  refs += clips.length;
  const talk = clips.filter(c => c.r === 'talk');
  const brief = clips.find(c => c.r === 'brief');

  if (talk.length !== lines.length) {
    problems.push(`#${p.n} ${p.t}: ${lines.length} line(s) but ${talk.length} clip(s)`);
    continue;
  }
  const bad = talk.findIndex((c, i) => c.s !== lines[i].speaker);
  if (bad >= 0) {
    problems.push(`#${p.n} ${p.t}: clip ${bad} is ${talk[bad].s}, `
      + `line ${bad} is ${lines[bad].speaker}`);
  }
  if (s.problem && !brief) problems.push(`#${p.n} ${p.t}: no spoken brief`);
}

/* Every clip the manifest names, and every clip on disk. Content-addressed
   names mean the two drift apart in both directions: a rebuild after an edit
   leaves the old file behind, and a manifest copied without its audio names
   files that were never made. */
const named = new Set();
Object.values(AUDIO.problems).forEach(l => l.forEach(c => named.add(c.f)));
Object.values(AUDIO.announcer).forEach(c => named.add(c.f));

const onDisk = new Set(fs.readdirSync(HERE)
  .filter(f => f.endsWith('.opus')).map(f => f.slice(0, -5)));

const missing = [...named].filter(f => !onDisk.has(f));
const orphans = [...onDisk].filter(f => !named.has(f));

missing.slice(0, 8).forEach(f => problems.push(`manifest names ${f}.opus — not on disk`));
if (missing.length > 8) problems.push(`…and ${missing.length - 8} more missing clips`);

problems.forEach(p => console.log('  ✗ ' + p));

const orphanBytes = orphans.reduce(
  (a, f) => a + fs.statSync(path.join(HERE, f + '.opus')).size, 0);
if (orphans.length) {
  console.log(`  · ${orphans.length} orphan clip(s), ${(orphanBytes / 1e6).toFixed(1)} MB — `
    + 'left by writing that has since changed. Safe to delete.');
}

console.log(`${LC.length} problems, ${refs} clip references, `
  + `${named.size} distinct clips, ${onDisk.size} on disk`);
console.log(problems.length ? `${problems.length} PROBLEM(S)` : 'clean.');
process.exit(problems.length ? 1 : 0);
