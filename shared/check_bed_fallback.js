#!/usr/bin/env node
/* Proves the background bed takes over when the AudioContext dies.
 *
 * The bug this guards against cannot be seen on a desktop: a phone browser
 * suspends the AudioContext when the page stops being visible, the live bed
 * goes silent, and the narration — which is an <audio> element — carries on
 * alone. You only find out by locking your phone, and by then you are supposed
 * to be asleep.
 *
 * So the context is faked here, with a clock that can be stopped by hand. Stop
 * it and the engine should notice within a second or two and fade in the
 * pre-mixed loop through a real <audio> element; start it again and the loop
 * should go away. The other four checks are the ways that handover can go
 * wrong in a way you would only hear at three in the morning: ambience left
 * running after the story is paused from a lock screen, two beds playing at
 * once on the way back, and layers still being downloaded for a bed nobody can
 * hear.
 *
 *   node shared/check_bed_fallback.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const BED_DIR = path.join(__dirname, '..', 'DSA_tool', 'data', 'bedtime', 'bed');
const meta = JSON.parse(fs.readFileSync(path.join(BED_DIR, 'bed.json'), 'utf8'));

const problems = [];
function check(ok, what) {
  if (!ok) problems.push(what);
  console.log((ok ? '  ok    ' : '  FAIL  ') + what);
}

/* ---------- a context whose clock can be stopped ---------- */
let clockRunning = true;
let clockAt = 0;
let clockSince = Date.now();
function ctxNow() {
  if (clockRunning) clockAt += (Date.now() - clockSince) / 1000;
  clockSince = Date.now();
  return clockAt;
}
function freeze() { ctxNow(); clockRunning = false; }
function thaw() { clockSince = Date.now(); clockRunning = true; }

function param(v) {
  return {
    value: v,
    setValueAtTime(x) { this.value = x; },
    linearRampToValueAtTime(x) { this.value = x; },
    exponentialRampToValueAtTime(x) { this.value = x; },
    setTargetAtTime(x) { this.value = x; },
    cancelScheduledValues() {},
  };
}

let decodes = 0;
class FakeCtx {
  constructor() { this.state = 'running'; this.destination = {}; }
  get currentTime() { return ctxNow(); }
  createGain() { return { gain: param(1), connect() {}, disconnect() {} }; }
  createBufferSource() {
    return { buffer: null, loop: false, playbackRate: param(1),
             connect() {}, start() {}, stop() {} };
  }
  decodeAudioData(buf, res) { decodes++; res({ duration: 41 }); }
  suspend() { this.state = 'suspended'; freeze(); return Promise.resolve(); }
  resume() { this.state = 'running'; thaw(); return Promise.resolve(); }
  close() { return Promise.resolve(); }
}

/* ---------- an <audio> that records what was asked of it ---------- */
const audios = [];
class FakeAudio {
  constructor() {
    this.loop = false; this.preload = ''; this.src = ''; this.volume = 1;
    this.paused = true; this.plays = 0;
    audios.push(this);
  }
  play() { this.paused = false; this.plays++; return Promise.resolve(); }
  pause() { this.paused = true; }
  addEventListener() {}
  removeAttribute(k) { this[k] = ''; }
  load() {}
}

/* ---------- the page ---------- */
const listeners = {};
const root = {
  AudioContext: FakeCtx,
  Audio: FakeAudio,
  document: {
    hidden: false,
    addEventListener(name, fn) { (listeners[name] = listeners[name] || []).push(fn); },
  },
  setInterval, clearInterval, setTimeout, clearTimeout, Date, Math, Promise,
};
function setHidden(v) {
  root.document.hidden = v;
  (listeners.visibilitychange || []).forEach((fn) => fn());
}

let fetched = [];
global.fetch = (url) => {
  fetched.push(url);
  if (url.endsWith('bed.json')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve(meta) });
  }
  return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
};
global.window = root;
global.Audio = FakeAudio;

const src = fs.readFileSync(path.join(__dirname, 'bed-engine.js'), 'utf8');
new Function('window', src)(root);   // the file publishes itself onto `window`
const BedEngine = root.BedEngine;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async function main() {
  console.log('\nbackground bed\n');

  check(!!meta.fallback, 'bed.json names a fallback loop');
  if (meta.fallback) {
    const f = path.join(BED_DIR, meta.fallback.file + '.opus');
    check(fs.existsSync(f),
      'the loop is on disk (' + meta.fallback.file + '.opus, ' +
      (fs.existsSync(f) ? (fs.statSync(f).size / 1024).toFixed(0) + ' KB' : 'missing') + ')');
  }

  const bed = new BedEngine({ base: 'bed/' });
  await bed.load();

  /* Pressing play. */
  bed.enable();
  bed.resume();
  bed.setVolume(0.7);
  bed.setSegment('open_sea', [], 600);
  const fb = audios[0];
  check(!!fb && fb.loop === true, 'the loop element is armed from the play gesture');
  await sleep(20);      // the unlock stops it in a promise, not inline
  check(!!fb && fb.plays === 1 && fb.paused,
    'it is played once to unlock it on a phone, then stopped');

  /* The player's heartbeat. */
  const beat = setInterval(() => bed.tick(5), 100);
  await sleep(1200);
  check(!bed.fbOn, 'a running context is left alone');

  /* The screen goes off. */
  const before = decodes;
  setHidden(true);
  freeze();
  await sleep(2600);
  check(bed.fbOn, 'a stopped context is noticed and the loop takes over');
  check(!fb.paused && Math.abs(fb.volume - 0.7) < 0.01,
    'it comes up to the level the live bed was at (volume ' + fb.volume.toFixed(2) + ')');

  /* A chapter turns over while the phone is in a pocket. */
  bed.setSegment('forest', [], 600);
  await sleep(200);
  check(decodes === before,
    'no new layers are decoded for a bed nobody can hear');
  check(bed._pendingScene === 'forest', 'the scene change is remembered for later');

  /* Picking the phone back up. */
  thaw();
  setHidden(false);
  await sleep(1100);
  check(!bed.fbOn, 'coming back hands over to the live bed');
  check(fb.paused, 'the loop stops rather than playing under it');
  check(bed.scene === 'forest', 'the remembered scene is applied on return');

  /* Paused from the lock screen: the page's own pause() is never called, the
     narration simply stops. The heartbeat stopping is the only clue. */
  setHidden(true);
  freeze();
  await sleep(2600);
  check(bed.fbOn, 'the loop takes over again on the next backgrounding');
  clearInterval(beat);
  await sleep(4200);
  check(fb.paused, 'ambience stops when the story is paused from the lock screen');

  console.log('\n  clips fetched: ' + fetched.length + '  layer decodes: ' + decodes);
  console.log(problems.length
    ? '\n' + problems.length + ' problem(s)\n'
    : '\nno problems found\n');
  process.exit(problems.length ? 1 : 0);
}());
