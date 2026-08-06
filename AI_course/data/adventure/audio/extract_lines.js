#!/usr/bin/env node
/* Every line Moominvalley speaks, pulled out of world.js for the synthesizer.
 *
 * Runs in node rather than being re-read in Python for the same reason the
 * Dojo's extractor does: world.js is generated JavaScript, and a second parser
 * for it would drift silently the first time the shape changed.
 *
 * What gets a voice, and what deliberately does not:
 *
 *   spoken   region intros, every keeper's hook / teaching / farewell, the
 *            question itself, the explanation after you answer, and the short
 *            reactions — the reactions in each character's own voice.
 *   silent   the four options. They are four short phrases already on screen,
 *            and reading "A... B... C... D..." out loud before every question
 *            adds about twenty seconds of waiting to each one and roughly nine
 *            hundred clips to the build. Reading is fine when it is four words.
 *
 *   node extract_lines.js            # -> adventure-lines.json
 */
'use strict';

const fs = require('fs');
const path = require('path');

const HERE = __dirname;
global.window = {};
require(path.join(HERE, '..', 'world.js'));
const W = global.window.MOOMIN_WORLD;

/* Who is standing where — the scenes do not carry their own speaker. */
const speakerOf = {};
W.regions.forEach(r => r.npcs.forEach(n => { speakerOf[n.lesson] = n.who; }));

const out = { intro: {}, scene: {}, react: {} };

W.regions.forEach(r => {
  out.intro[r.id] = r.intro.map(line => ({ speaker: 'narrator', line: line }));
});

Object.keys(W.scenes).forEach(id => {
  const s = W.scenes[id];
  const who = speakerOf[id];
  if (!who) { console.error('nobody speaks scene ' + id); process.exit(1); }
  out.scene[id] = {
    speaker: who,
    hook: s.hook,
    teach: s.teach,
    done: s.done,
    q: s.q.map(q => ({ q: q.q, e: q.e })),
  };
});

/* One copy of the reaction bank per character who actually appears. A generic
   narrator saying "not quite" would be cheaper and would also break the spell
   every single time somebody answers. */
const cast = {};
Object.keys(speakerOf).forEach(id => { cast[speakerOf[id]] = true; });
Object.keys(cast).forEach(who => {
  out.react[who] = { right: W.reactions.right, wrong: W.reactions.wrong };
});

const dest = path.join(HERE, 'adventure-lines.json');
fs.writeFileSync(dest, JSON.stringify(out), 'utf8');

let n = 0;
Object.keys(out.intro).forEach(k => { n += out.intro[k].length; });
Object.keys(out.scene).forEach(k => {
  const s = out.scene[k];
  n += 2 + s.teach.length + s.q.length * 2;
});
Object.keys(out.react).forEach(k => {
  n += out.react[k].right.length + out.react[k].wrong.length;
});
console.log(`${n} spoken lines from ${Object.keys(out.scene).length} scenes, ` +
            `${Object.keys(out.react).length} voices in the reaction bank`);
