/* Pull every line the Dojo will ever speak out of the data the Dojo actually
 * reads, and write it to dojo-lines.json for build_dojo_audio.py.
 *
 * The point of doing it in node rather than parsing the JS by hand is that the
 * scene a fight opens on is *resolved*, not stored: dojo.html looks for a Grand
 * Line episode carrying the problem's LeetCode number, and falls back to
 * data/dojo-scenes.js only when there is no arc. Reimplementing that lookup in
 * Python would be a second copy of a rule that is allowed to change, and the
 * failure mode is silent — audio that belongs to a scene nobody plays.
 *
 * So this file loads the same files in the same order the page does and asks
 * the same question. Run it whenever the scenes change:
 *
 *     node extract_dojo_lines.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');   // DSA_tool/data
const TOOL = path.resolve(ROOT, '..');              // DSA_tool

global.window = global;

require(path.join(TOOL, 'data/lc150.js'));
require(path.join(TOOL, 'data/grandline/index.js'));

/* Every arc, because we are building for all 150 at once. The page loads one
   arc at a time; nothing here is shipped to a browser. */
const arcDir = path.join(TOOL, 'data/grandline');
for (const f of fs.readdirSync(arcDir)) {
  if (f.endsWith('.js') && f !== 'index.js') require(path.join(arcDir, f));
}
require(path.join(TOOL, 'data/dojo-scenes.js'));

const LC = window.LC150;
const EPISODES = window.EPISODES || {};
const SCENES = window.DOJO_SCENES || {};

/* dojo.html's episodeFor(): the arc episode that carries this problem number. */
function episodeFor(n) {
  let found = null;
  for (const k of Object.keys(EPISODES)) {
    const e = EPISODES[k];
    if (!found && e.leetcode && e.leetcode.number === n) found = e;
  }
  return found;
}

/* dojo.html's sceneFor(), minus the display-only fields. */
function sceneFor(p) {
  const e = episodeFor(p.n);
  if (e) {
    return { epTitle: e.title, problem: e.problem, pitfall: e.pitfall,
             steps: e.steps || [], src: 'arc' };
  }
  const s = SCENES[p.n];
  if (!s) return null;
  return { epTitle: s.epTitle, problem: s.problem, pitfall: s.pitfall,
           steps: s.steps || [], src: 'scene' };
}

/* The pitfall is authored with markup — <b>, <code> — because it is printed on
   the debrief card. Spoken, the tags are noise. */
function plain(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&middot;/g, ',').replace(/&rsquo;/g, '’')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const out = {};
let lines = 0, missing = [];

for (const p of LC) {
  const s = sceneFor(p);
  if (!s) { missing.push(p.n); continue; }
  const clips = [];

  /* The narrator states the job before anyone argues about it. This is the one
     clip a fight cannot start without, which is why it is index 0. */
  if (s.problem) clips.push({ role: 'brief', speaker: '_narrator', line: plain(s.problem) });

  for (const st of s.steps) {
    if (!st || !st.line) continue;
    clips.push({ role: 'talk', speaker: st.speaker || '_narrator', line: st.line });
  }

  /* The trap, read over the debrief — the last thing you hear before the next
     fight, and the thing most worth remembering. */
  if (s.pitfall) clips.push({ role: 'pitfall', speaker: '_narrator', line: plain(s.pitfall) });

  out[p.n] = { title: p.t, epTitle: s.epTitle, src: s.src, clips: clips };
  lines += clips.length;
}

/* The announcer bank: fixed lines the game says in every fight, rendered once
   for all 150 rather than per problem. Keyed by name because fight-engine.js
   asks for them by name. */
const ANNOUNCER = {
  'round-1':  'Round one. Fight!',
  'fight':    'Fight!',
  'ambush':   'Ambush!',
  'guard':    'Guard up! Here they come!',
  'finish':   'Finish it!',
  'clash':    'Clash!',
  'combo-2':  'Double hit!',
  'combo-3':  'Triple! Keep it going!',
  'combo-4':  'Unstoppable!',
  'phase-1':  'They are not done yet!',
  'phase-2':  'Everything they have got — now!',
  'hit':      'Direct hit!',
  'miss':     'Blocked!',
  'timeup':   'Too slow!',
  'ko':       'K.O.!',
  'win':      'Victory! Lesson learned.',
  'lose':     'Defeat. Study the debrief, then run it back.',
  'grade-S':  'Perfect. Flawless victory.',
  'grade-A':  'Great fight.',
  'grade-B':  'Solid win.',
  'grade-C':  'You got through it.',
  'grade-D':  'Barely standing.',
  'next':     'Next challenger!'
};

fs.writeFileSync(
  path.join(__dirname, 'dojo-lines.json'),
  JSON.stringify({ problems: out, announcer: ANNOUNCER }, null, 1));

const chars = Object.values(out)
  .reduce((a, p) => a + p.clips.reduce((b, c) => b + c.line.length, 0), 0);
console.log(`${Object.keys(out).length} problems, ${lines} clips, ${chars} chars`);
console.log(`+ ${Object.keys(ANNOUNCER).length} announcer lines`);
if (missing.length) console.log(`NO SCENE for #${missing.join(', #')}`);
