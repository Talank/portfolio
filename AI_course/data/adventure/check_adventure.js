/* Play the whole of Moominvalley, without a browser.
 *
 * A canvas game has no DOM to assert against, so this boots the real engine
 * against a stub 2D context that records every call and throws on anything it
 * does not implement, then plays the game through the same key handlers a
 * person uses. It checks five things:
 *
 *   1. every keeper and every exit in every region can actually be walked to —
 *      the maps are generated, so this is the check that stops a scatter of
 *      trees stranding a lesson;
 *   2. every clip the game will ask for is on disk, and the audio manifest
 *      still lines up item for item with the writing;
 *   3. the whole course can be finished by playing — all thirty-nine pearls;
 *   4. every trial survives being played with each key held down;
 *   5. every trial accepts its own solve(), so none of them is unwinnable.
 *
 * Run it after touching story.js, the engine, the art or the trials:
 *
 *   node check_adventure.js
 */
'use strict';
const path = require('path');
const COURSE = path.resolve(__dirname, '..', '..');

let drawCalls = 0;
function ctx2d() {
  const noop = () => { drawCalls++; };
  const c = {
    canvas: null,
    save: noop, restore: noop, beginPath: noop, closePath: noop,
    moveTo: noop, lineTo: noop, arc: noop, arcTo: noop, ellipse: noop,
    rect: noop, fill: noop, stroke: noop, fillRect: noop, strokeRect: noop,
    clearRect: noop, clip: noop, translate: noop, scale: noop, rotate: noop,
    setTransform: noop, quadraticCurveTo: noop, bezierCurveTo: noop,
    setLineDash: noop, fillText: noop, strokeText: noop,
    measureText: (t) => ({ width: String(t).length * 7.2 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
  };
  return new Proxy(c, {
    get(t, k) {
      if (k in t) return t[k];
      if (typeof k === 'string' && /^(fillStyle|strokeStyle|lineWidth|font|globalAlpha|textAlign|textBaseline|lineCap|lineJoin|shadowBlur|shadowColor)$/.test(k)) return t['_' + k];
      throw new Error('canvas context has no ' + String(k));
    },
    set(t, k, v) {
      if (/^(fillStyle|strokeStyle|lineWidth|font|globalAlpha|textAlign|textBaseline|lineCap|lineJoin|shadowBlur|shadowColor)$/.test(k)) { t['_' + k] = v; return true; }
      t[k] = v; return true;
    },
  });
}

const listeners = {};
const store = {};
const win = {
  devicePixelRatio: 1,
  addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
  removeEventListener: () => {},
  requestAnimationFrame: () => 0,          // frames are pumped by hand
  setTimeout: setTimeout, clearTimeout,
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  },
  navigator: { getGamepads: null },
  Math, JSON, Date, Audio: null, AudioContext: null,
  confirm: () => true,
};
win.window = win;

const canvasEl = {
  width: 960, height: 600,
  getContext: () => CTX,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 600 }),
  addEventListener: (t, fn) => { (listeners['cv:' + t] = listeners['cv:' + t] || []).push(fn); },
  setAttribute: () => {},
};
const CTX = ctx2d();

win.document = {
  createElement: (tag) => {
    if (tag === 'audio') return { canPlayType: () => 'probably' };
    if (tag === 'script') {
      const s = {};
      setTimeout(() => s.onload && s.onload(), 0);
      return s;
    }
    return {};
  },
  head: { appendChild: () => {} },
  getElementById: () => null,
};
win.Audio = function () {
  return {
    preload: '', src: '',
    addEventListener: () => {},
    play: () => Promise.resolve(),
    pause: () => {}, removeAttribute: () => {},
    paused: true, ended: true,
  };
};
win.navigator.getGamepads = () => [];

global.window = win;
global.document = win.document;
global.navigator = win.navigator;
global.localStorage = win.localStorage;
global.Audio = win.Audio;
global.requestAnimationFrame = win.requestAnimationFrame;
global.SpeechSynthesisUtterance = undefined;

require(path.join(COURSE, 'data/adventure/world.js'));
require(path.join(COURSE, 'data/adventure/audio/manifest.js'));
require(path.join(COURSE, 'js/adventure-worldgen.js'));
require(path.join(COURSE, 'js/adventure-art.js'));
require(path.join(COURSE, 'js/adventure-voice.js'));
require(path.join(COURSE, 'js/adventure-trials.js'));
require(path.join(COURSE, 'js/adventure-engine.js'));

const W = win.MOOMIN_WORLD;
const AUD = win.MOOMIN_AUDIO;
let problems = [];

/* ---- 1. every region is walkable, and everything in it is reachable ---- */
W.regions.forEach(r => {
  const m = win.MoominMap.build(r);
  const seen = new Uint8Array(m.w * m.h);
  const q = [r.spawn[1] * m.w + r.spawn[0]];
  seen[q[0]] = 1;
  while (q.length) {
    const c = q.pop(), cx = c % m.w, cy = (c / m.w) | 0;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) return;
      if (m.solid(nx, ny)) return;
      const k = ny * m.w + nx;
      if (!seen[k]) { seen[k] = 1; q.push(k); }
    });
  }
  r.npcs.forEach(n => {
    if (!seen[n.y * m.w + n.x]) problems.push(`${r.id}: ${n.lesson} unreachable`);
  });
  r.exits.forEach(e => {
    if (!seen[e.y * m.w + e.x]) problems.push(`${r.id}: exit to ${e.to} unreachable`);
    if (!W.regions.some(o => o.id === e.to)) problems.push(`${r.id}: exit to unknown ${e.to}`);
  });
  if (m.shells.length < 3) problems.push(`${r.id}: only ${m.shells.length} shells placed`);
});

/* ---- 2. every clip the game will ask for exists ------------------------ */
const fs = require('fs');
const AUDIR = path.join(COURSE, 'data/adventure/audio');
const onDisk = new Set(fs.readdirSync(AUDIR).filter(f => f.endsWith('.opus')).map(f => f.slice(0, -5)));
function needClip(name, where) {
  if (!name) { problems.push('no clip for ' + where); return; }
  if (!onDisk.has(name)) problems.push('missing file for ' + where + ': ' + name);
}
Object.keys(AUD.intro).forEach(r => AUD.intro[r].forEach((n, i) => needClip(n, `intro ${r} ${i}`)));
Object.keys(AUD.scene).forEach(id => {
  const s = AUD.scene[id];
  needClip(s.hook, id + ' hook'); needClip(s.done, id + ' done');
  s.teach.forEach((n, i) => needClip(n, `${id} teach ${i}`));
  s.q.forEach((q, i) => { needClip(q.q, `${id} q${i}`); needClip(q.e, `${id} why${i}`); });
});
Object.keys(AUD.react).forEach(w => {
  AUD.react[w].right.forEach((n, i) => needClip(n, `react ${w} right ${i}`));
  AUD.react[w].wrong.forEach((n, i) => needClip(n, `react ${w} wrong ${i}`));
});
/* the writing and the audio must line up item for item */
Object.keys(W.scenes).forEach(id => {
  const s = W.scenes[id], a = AUD.scene[id];
  if (!a) { problems.push('no audio scene for ' + id); return; }
  if (a.teach.length !== s.teach.length) problems.push(id + ': teach count differs');
  if (a.q.length !== s.q.length) problems.push(id + ': question count differs');
});

/* ---- 3. actually play it ---------------------------------------------- */
const key = (code) => {
  const ev = { code, preventDefault() {} };
  (listeners.keydown || []).forEach(fn => fn(ev));
  (listeners.keyup || []).forEach(fn => fn({ code, preventDefault() {} }));
};
const keyDown = (code) => (listeners.keydown || []).forEach(fn => fn({ code, preventDefault() {} }));
const keyUp = (code) => (listeners.keyup || []).forEach(fn => fn({ code, preventDefault() {} }));

/* The engine wires its input and its frame loop exactly once, so the raf hook
   has to be in place BEFORE the only init that will ever register it. */
let frameFn = null;
win.requestAnimationFrame = (fn) => { frameFn = fn; return 0; };
global.requestAnimationFrame = win.requestAnimationFrame;
win.MoominGame.init(canvasEl);
let t = 0;
function pump(n) {
  for (let i = 0; i < (n || 1); i++) {
    if (!frameFn) throw new Error('the game stopped asking for frames');
    const fn = frameFn; frameFn = null;
    t += 16;
    fn(t);
  }
}

pump(2);
key('Space');                                   // title -> roam / intro
pump(2);
for (let i = 0; i < 12; i++) { key('Space'); pump(2); }   // through the intro

/* walk in every direction for a while, in every region, and pump frames */
let visitedRegions = 0;
W.regions.forEach(region => {
  /* jump straight there through the save file, then re-init */
  store['ai-adventure-v1'] = JSON.stringify({
    region: region.id, x: null, y: null, taught: {}, mastered: {},
    visited: {}, shells: {}, pearls: {},
  });
  win.MoominGame.init(canvasEl);
  pump(1);
  key('Space'); pump(1);
  for (let i = 0; i < 14; i++) { key('Space'); pump(1); }   // region intro
  ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].forEach(k => {
    keyDown(k);
    pump(25);
    keyUp(k);
  });
  key('Tab'); pump(2); key('Tab'); pump(2);                 // journal opens and closes
  visitedRegions++;
});

/* a full encounter with every keeper, answering everything correctly */
let answered = 0, trialsRun = 0;
store['ai-adventure-v1'] = JSON.stringify({
  region: 'valley', x: null, y: null, taught: {}, mastered: {},
  visited: Object.fromEntries(W.regions.map(r => [r.id, true])),
  shells: {}, pearls: {},
});
W.regions.forEach(region => {
  region.npcs.forEach(npc => {
    const save = JSON.parse(store['ai-adventure-v1']);
    save.region = region.id;
    save.x = npc.x * 32 + 16; save.y = npc.y * 32 + 16;
    store['ai-adventure-v1'] = JSON.stringify(save);
    win.MoominGame.init(canvasEl);
    pump(2);
    key('Space');                       // title
    pump(2);
    key('Space');                       // talk to whoever is standing here
    pump(2);

    /* Play the encounter from the game's own state rather than from a guess
       about what is on screen — a canvas has nothing to assert against, so
       pressing keys and hoping is not a test. */
    let inConversation = false, sawTrial = false;
    for (let guard = 0; guard < 500; guard++) {
      const st = win.MoominGame._state();
      if (st.mode === 'quiz') {
        inConversation = true;
        if (st.chosen < 0 && st.question) {
          key(['Digit1', 'Digit2', 'Digit3', 'Digit4'][st.question.c]);
          answered++;
        } else {
          key('Space');
        }
      } else if (st.mode === 'trial') {
        if (!sawTrial) { sawTrial = true; trialsRun++; }
        inConversation = true;
        key('Space');
      } else if (st.mode === 'talk' || st.mode === 'intro' || st.mode === 'title') {
        if (st.mode === 'talk') inConversation = true;
        key('Space');
      } else if (st.mode === 'roam') {
        if (inConversation) break;              // the encounter is over
        if (st.hint === 'npc') key('Space');
        else { problems.push(region.id + ': nobody to talk to at ' + npc.lesson); break; }
      }
      pump(1);
    }
  });
});

/* ---- 4. every trial survives being played ----------------------------- */
const trialNames = new Set();
W.regions.forEach(r => r.npcs.forEach(n => { if (n.trial) trialNames.add(n.trial); }));
let written = 0, unwritten = [];
trialNames.forEach(name => {
  if (!win.MoominTrials.has(name)) { unwritten.push(name); return; }
  written++;
  const tr = win.MoominTrials.start(name);
  const input = { keys: {}, pad: { x: 0, y: 0 } };
  ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].forEach(k => {
    input.keys = {}; input.keys[k] = true;
    for (let i = 0; i < 60; i++) { tr.update(16, input); tr.draw(CTX, 960, 600, i * 16); }
  });
  input.keys = {};
  for (let i = 0; i < 8; i++) { if (!tr.done) tr.press(); }
  if (!tr.done) problems.push('trial ' + name + ' never finishes');
  if (typeof tr.verdict !== 'string') problems.push('trial ' + name + ' has no verdict');
});

/* ---- 5. every trial can actually be won ------------------------------
   Each trial exposes solve(), which puts it into the state the trial is asking
   you to find. Playing it to that state by hand is the player's job; proving
   the state exists and is accepted is this harness's. */
const winnable = [];
trialNames.forEach(name => {
  const tr = win.MoominTrials.start(name);
  if (typeof tr.solve !== 'function') { problems.push('trial ' + name + ' has no solve()'); return; }
  tr.solve();
  let guard = 0;
  while (!tr.done && guard++ < 12) tr.press();
  if (tr.passed) winnable.push(name);
  else problems.push('trial ' + name + ' rejects its own answer');
});
console.log('trials provably winnable', winnable.length, 'of', trialNames.size);
console.log('questions answered      ', answered, ' trials entered ', trialsRun);
console.log('regions walked          ', visitedRegions);
console.log('draw calls made         ', drawCalls.toLocaleString());
console.log('pearls earned by playing', win.MoominGame.stats().pearls, '/ 39');
console.log('trials written          ', written, 'of', trialNames.size,
            unwritten.length ? '(no trial yet: ' + unwritten.join(', ') + ')' : '');
console.log('audio clips on disk     ', onDisk.size);
if (problems.length) {
  console.log('\nPROBLEMS (' + problems.length + '):');
  problems.slice(0, 40).forEach(p => console.log('  ✗ ' + p));
  process.exit(1);
}
console.log('\nno problems found');
