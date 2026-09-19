/* Boots index.html the way a browser would, and checks it survives.
 *
 * Same reasoning as shared/check_bedtime_page.js: nothing that only inspects
 * files catches a page that is dead on line one. app.js runs its whole setup at
 * module scope, so a renamed id or a helper left behind by a refactor throws
 * before a single control is wired, and every static check still passes.
 *
 * The DOM stub is deliberately not a Proxy that answers everything. A missing
 * element returns null, exactly as a browser would, so that the failure surfaces
 * here instead of in the user's console.
 *
 * It then renders the result card for fixed cases whose right answer is known by
 * hand — "think" heard as "tink" must put red on the T and the H and leave the K
 * alone — because the point of the colour band is where it lands, and a test on
 * the numbers alone would not notice the template pointing one letter left.
 *
 *   node speech_lab/check_page.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let failures = 0;
function check(ok, what, extra = '') {
  if (!ok) failures++;
  console.log((ok ? '  ok    ' : '  FAIL  ') + what + (!ok && extra ? `  — ${extra}` : ''));
}

const html = fs.readFileSync(path.join(HERE, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(HERE, 'css/app.css'), 'utf8');
const IDS = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));

/* ---- the stub ------------------------------------------------------------- */

function parseChildren(markup) {
  // Top-level elements only, which is all `.children` is ever used for here.
  const VOID = /^(br|hr|img|input|meta|link|source)$/i;
  const re = /<(\/?)([a-z0-9]+)\b([^>]*?)(\/?)>/gi;
  const kids = [];
  let depth = 0, m;
  while ((m = re.exec(markup)) !== null) {
    const [, slash, name, attrs, selfSlash] = m;
    if (slash === '/') { depth = Math.max(0, depth - 1); continue; }
    if (depth === 0) {
      const el = new El(name);
      for (const a of attrs.matchAll(/([a-z-]+)="([^"]*)"/gi)) {
        if (a[1].startsWith('data-')) {
          el.dataset[a[1].slice(5).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = a[2];
        } else if (a[1] === 'class') el.className = a[2];
      }
      kids.push(el);
    }
    if (!selfSlash && !VOID.test(name)) depth++;
  }
  return kids;
}

class El {
  constructor(tagName = 'div', id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this._html = '';
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
    this.className = '';
    this.dataset = {};
    this.children = [];
    this.attrs = {};
    this.listeners = {};
    this.onclick = null;
    this.scrollIntoView = () => {};
    this.onchange = null;
    this.oninput = null;
    this.classList = {
      _s: new Set(),
      add: (c) => this.classList._s.add(c),
      remove: (c) => this.classList._s.delete(c),
      contains: (c) => this.classList._s.has(c),
      toggle: (c, on) => (on === undefined
        ? (this.classList._s.has(c) ? this.classList._s.delete(c) : this.classList._s.add(c))
        : (on ? this.classList._s.add(c) : this.classList._s.delete(c))),
    };
  }
  get innerHTML() { return this._html; }
  set innerHTML(v) { this._html = String(v); this.children = parseChildren(this._html); }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(t, fn) { (this.listeners[t] ||= []).push(fn); }
  closest(sel) {
    if (sel.startsWith('[')) {
      const k = sel.slice(1, -1);
      return k in this.attrs || k.replace(/^data-/, '') in this.dataset ? this : null;
    }
    return this.className.split(/\s+/).includes(sel.replace('.', '')) ? this : null;
  }
}

const store = new Map();
const missing = [];
const made = new Map();

globalThis.window = {
  innerWidth: 1280,
  scrollTo() {},
  addEventListener() {},
  AudioContext: class { createMediaStreamSource() { return { connect() {} }; }
                        createAnalyser() { return { connect() {}, getFloatTimeDomainData() {} }; }
                        close() {} },
  // Left undefined on purpose: this is the Firefox/Safari path, and the banner
  // that explains it is one of the things being checked.
  SpeechRecognition: undefined,
  webkitSpeechRecognition: undefined,
  speechSynthesis: undefined,
  MediaRecorder: undefined,
};
globalThis.document = {
  getElementById(id) {
    if (!IDS.has(id)) { missing.push(id); return null; }
    if (!made.has(id)) made.set(id, new El('div', id));
    return made.get(id);
  },
  addEventListener(t, fn) { (globalThis.__docListeners ||= {})[t] = fn; },
};
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
};
globalThis.navigator = { mediaDevices: undefined };
globalThis.URL.createObjectURL = () => 'blob:stub';
globalThis.URL.revokeObjectURL = () => {};
globalThis.confirm = () => false;
globalThis.Audio = class { play() { return Promise.resolve(); } };
globalThis.performance = globalThis.performance || { now: () => 0 };

/* ---- boot ----------------------------------------------------------------- */

console.log('speech_lab/index.html');
let booted = true;
try {
  await import('./js/app.js');
} catch (e) {
  booted = false;
  check(false, 'app.js runs to completion', `${e.name}: ${e.message}`);
}
if (booted) check(true, 'app.js runs to completion');
check(missing.length === 0, 'every getElementById() found its element', [...new Set(missing)].join(', '));

const el = (id) => made.get(id);

/* An id nothing reads is usually the leftover of a rename. Checked against the
 * source rather than against this run, because ids like `status` are only read
 * once a recording is in flight and would look dead from a cold boot. */
{
  const src = ['js/app.js', 'js/render.js']
    .map((f) => fs.readFileSync(path.join(HERE, f), 'utf8')).join('\n');
  const read = new Set([...src.matchAll(/\$\('([^']+)'\)/g)].map((m) => m[1]));
  for (const n of ['drill', 'grammar', 'progress']) { read.add(`panel-${n}`); read.add(`tab-${n}`); }
  const unused = [...IDS].filter((i) => !read.has(i));
  const absent = [...read].filter((i) => !IDS.has(i));
  check(unused.length === 0, 'no id defined in the HTML is left unread', unused.join(', '));
  check(absent.length === 0, 'no id the code reads is missing from the HTML', absent.join(', '));
}

/* ---- wiring --------------------------------------------------------------- */

for (const id of ['btnRec', 'btnListen', 'btnNext', 'btnSlow', 'btnAgain', 'btnHear', 'btnCompare',
                  'mRec', 'mListen', 'mNext', 'btnReset', 'btnDrillWeak',
                  'gCheck', 'gSpeak', 'gSample', 'gClear',
                  'tab-drill', 'tab-grammar', 'tab-progress']) {
  check(typeof el(id)?.onclick === 'function', `${id} got a click handler`);
}
check(typeof globalThis.__docListeners?.keydown === 'function', 'keyboard shortcuts are bound');

/* ---- what the first paint actually says ----------------------------------- */

const { DECK, TRAPS, LEVELS, TRACKS } = await import('./data/deck.js');

check((el('levelChips').innerHTML.match(/class="chip/g) || []).length === LEVELS.length,
      `level chips: one per level (${LEVELS.length})`);
check((el('trackChips').innerHTML.match(/class="chip/g) || []).length === TRACKS.length,
      `track chips: one per track (${TRACKS.length})`);
check(el('levelChips').innerHTML.includes('chip on'), 'a level chip starts selected');
check(el('levelChips').children.length === LEVELS.length, 'chip children are addressable for syncChips()');

const shown = el('targetWord').innerHTML.replace(/<[^>]+>/g, '');
check(DECK.some((d) => d.w === shown), 'the first word drawn is a real deck item', shown);
check(el('targetMeta').textContent.length > 0, 'the target carries its syllable/stress meta');
check(el('trapHint').innerHTML.includes('Watch:'), 'the trap hint names what to watch');
check(el('levelBlurb').textContent.length > 0, 'the level blurb is filled in');
check(el('asrBanner').hidden === false,
      'with no recogniser present, the banner that explains it is shown');
check(el('asrBanner').innerHTML.includes('letter-by-letter'),
      'that banner says the letter colouring is one of the things lost');
check(el('btnHear').disabled === true && el('btnCompare').disabled === true,
      'playback buttons start disabled — there is nothing of yours to play yet');
check(el('grammarMeta').textContent.includes('rules across'), 'the grammar pane declares its rule count');

/* Clicking a level chip must actually move the drill. */
const before = el('targetWord').innerHTML;
el('levelChips').onclick({ target: { closest: () => ({ dataset: { v: '4' } }) } });
check(el('targetWord').innerHTML !== before || DECK.filter((d) => d.lvl === 4).length === 1,
      'choosing a level redraws the target');
check(el('levelBlurb').textContent.includes(LEVELS[3].blurb.slice(0, 20)),
      'the blurb follows the level that was chosen');

/* ---- the paths a thumb actually takes ------------------------------------- *
 * Each of these crashed at least once while being written, and none of them is
 * reachable from a static check: they only exist once a handler fires. */
{
  el('tab-grammar').onclick();
  check(el('panel-grammar').hidden === false && el('panel-drill').hidden === true,
        'switching tabs shows one panel and hides the other');
  check(el('mobilebar').classList.contains('off'),
        'the phone action bar hides itself outside the drill tab');
  el('tab-drill').onclick();
  check(!el('mobilebar').classList.contains('off'), 'and comes back on the drill tab');

  el('gSample').onclick();
  check(el('gText').value && el('gResult').innerHTML.includes('g-finding'),
        'the grammar example fills the box and produces findings');
  el('gClear').onclick();
  check(el('gText').value === '' && el('gResult').innerHTML === '', 'clear empties both');

  // Nothing recorded yet: the weakest-sound button must no-op rather than throw.
  el('btnDrillWeak').onclick();
  check(true, 'drilling your weakest sound with no history does not throw');

  // Now with history, and via the progress grid too.
  localStorage.setItem('speechlab-v1', JSON.stringify({
    attempts: 4, passes: 1, weakness: { s_cluster: 3, th_voiceless: 1 },
    cleared: { smart: 41, think: 88 }, days: ['2026-09-12'],
  }));
  const app2 = await import(`./js/app.js?reload=${Date.now()}`);
  void app2;
  el('tab-progress').onclick();
  check(el('wordGrid').innerHTML.includes('smart') && el('wordGrid').innerHTML.includes('think'),
        'every word you have tried appears on the progress grid');
  check(el('wordGrid').innerHTML.indexOf('smart') < el('wordGrid').innerHTML.indexOf('think'),
        'and the worst score is listed first, since that is the one to work on');
  check(el('weakList').innerHTML.includes('no vowel before s-clusters'),
        'the weak list names the trap, not its id');
  check(el('weakNote').hidden === false && el('weakNote').innerHTML.includes(TRAPS.s_cluster.fix),
        'the top miss comes with that trap\'s physical fix, verbatim');
  el('btnDrillWeak').onclick();
  check(DECK.some((d) => d.w === el('targetWord').innerHTML.replace(/<[^>]+>/g, '')
                       && d.traps.includes('s_cluster')),
        'drilling the weakest sound lands on a word that contains it',
        el('targetWord').innerHTML.replace(/<[^>]+>/g, ''));
  check(el('panel-drill').hidden === false, 'and takes you to the drill tab');

  el('wordGrid').onclick({ target: { closest: () => ({ dataset: { word: 'think' } }) } });
  check(el('targetWord').innerHTML.replace(/<[^>]+>/g, '') === 'think',
        'tapping a word on the progress grid drills that word');

  // No mic in this environment: the failure must be a message, not an exception.
  el('btnRec').onclick();
  check(el('status').innerHTML.includes('Microphone'),
        'a refused microphone reports itself instead of throwing');
}

/* ---- the record loop, five takes in a row --------------------------------- *
 * The reported bug: recording worked once and then errored. The cause was that
 * every take built two AudioContexts and closed them, the browser caps the pool
 * at six and frees them lazily, and the constructor throw landed after
 * `state.recording = true` and outside any try — so the flag stuck and every
 * later press was swallowed. Nothing static catches that; it needs the loop run.
 *
 * The stubs below are deliberately strict. The AudioContext throws past six
 * exactly as Chrome does, and the recogniser refuses a second start while one
 * is live exactly as Chrome does, so a regression to either old shape fails
 * here rather than on the user's phone. */
{
  let ctxBuilt = 0, ctxOpen = 0;
  class StubAudioContext {
    constructor() {
      ctxBuilt++; ctxOpen++;
      if (ctxOpen > 6) {
        const e = new Error('number of hardware contexts reached maximum (6)');
        e.name = 'NotSupportedError';
        throw e;
      }
      this.state = 'running';
    }
    createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
    createAnalyser() { return { fftSize: 1024, connect() {}, getFloatTimeDomainData() {} }; }
    async decodeAudioData() { return { getChannelData: () => TONE, sampleRate: 16000 }; }
    resume() {}
    close() { this.state = 'closed'; ctxOpen--; }
  }

  // A two-syllable utterance, so analyze() returns a real reading rather than
  // refusing, and a genuine result card has to be built on every pass.
  const SR_HZ = 16000;
  const TONE = (() => {
    const parts = [{ ms: 240, amp: 1.3, f0: 145 }, { ms: 130, amp: 0.6, f0: 105 }];
    const gap = 70;
    const total = parts.reduce((n, p) => n + p.ms + gap, gap);
    const out = new Float32Array(Math.round((total / 1000) * SR_HZ));
    let t = Math.round((gap / 1000) * SR_HZ);
    for (const p of parts) {
      const n = Math.round((p.ms / 1000) * SR_HZ);
      for (let i = 0; i < n; i++) {
        const env = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
        let v = 0;
        for (let h = 1; h <= 12; h++) v += Math.sin((2 * Math.PI * p.f0 * h * i) / SR_HZ) / h;
        out[t + i] = v * env * p.amp * 0.12;
      }
      t += n + Math.round((gap / 1000) * SR_HZ);
    }
    return out;
  })();

  let lastRecorder = null;
  class StubMediaRecorder {
    static isTypeSupported() { return true; }
    constructor() { this.state = 'inactive'; lastRecorder = this; }
    start() { this.state = 'recording'; }
    stop() {
      if (this.state === 'inactive') return;
      this.state = 'inactive';
      if (this.ondataavailable) this.ondataavailable({ data: new Blob([new Uint8Array(4096)]) });
      if (this.onstop) this.onstop();
    }
  }

  window.AudioContext = StubAudioContext;
  window.MediaRecorder = StubMediaRecorder;
  globalThis.MediaRecorder = StubMediaRecorder;
  navigator.mediaDevices = {
    getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }),
  };

  const settle = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 2)); };

  let takes = 0, stuck = null, blanked = null;
  for (let i = 1; i <= 5; i++) {
    el('btnRec').onclick();
    await settle();
    if (!lastRecorder || lastRecorder.state !== 'recording') { stuck = stuck || `take ${i} never started`; break; }
    if (el('recCap').textContent !== 'Stop') { stuck = stuck || `take ${i} did not show Stop`; break; }
    lastRecorder.stop();
    await settle();
    if (el('recCap').textContent !== 'Record') { stuck = stuck || `take ${i} left the button on Stop`; break; }
    if (el('btnListen').disabled) { stuck = stuck || `take ${i} left the controls disabled`; break; }
    if (!el('result').innerHTML.includes('where-title')) { blanked = blanked || `take ${i} produced no result card`; break; }
    takes++;
  }

  check(takes === 5, 'five takes in a row each produce a result', stuck || blanked || `${takes} of 5`);
  check(ctxBuilt === 1, 'the whole loop uses exactly one AudioContext', `built ${ctxBuilt}`);
  check(el('btnHear').disabled === false, 'after a take, your own recording can be played back');
  check(JSON.parse(localStorage.getItem('speechlab-v1')).attempts >= 5,
        'every take was counted, so the loop really ran end to end');

  // Try again, from inside the result card, must start take six.
  el('result').onclick({ target: { closest: () => ({ dataset: { act: 'again' } }) } });
  await settle();
  check(lastRecorder.state === 'recording', 'Try again inside the result card starts a new take');
  lastRecorder.stop();
  await settle();
  check(el('recCap').textContent === 'Record', 'and that take finishes cleanly too');

  /* A recorder whose onstop never arrives: the watchdog has to free the loop
   * rather than leaving the button on "Stop" for the rest of the session. */
  class DeafRecorder extends StubMediaRecorder {
    stop() { this.state = 'inactive'; /* onstop deliberately never fires */ }
  }
  window.MediaRecorder = DeafRecorder;
  globalThis.MediaRecorder = DeafRecorder;
  el('btnRec').onclick();
  await settle();
  el('btnRec').onclick();                     // press Stop
  await new Promise((r) => setTimeout(r, 2700));
  check(el('recCap').textContent === 'Record' && !el('btnListen').disabled,
        'a recorder that never reports back is released by the watchdog');
  check(el('status').innerHTML.includes('did not stop cleanly'), 'and says so rather than failing silently');

  window.MediaRecorder = StubMediaRecorder;
  globalThis.MediaRecorder = StubMediaRecorder;
  el('btnRec').onclick();
  await settle();
  check(lastRecorder.state === 'recording', 'and the very next take still starts');
  lastRecorder.stop();
  await settle();

  /* A microphone that produces no audio must be a message, not a dead loop. */
  class SilentRecorder extends StubMediaRecorder {
    stop() { this.state = 'inactive'; if (this.onstop) this.onstop(); }   // no ondataavailable
  }
  window.MediaRecorder = SilentRecorder;
  globalThis.MediaRecorder = SilentRecorder;
  el('btnRec').onclick();
  await settle();
  lastRecorder.stop();
  await settle();
  check(el('result').innerHTML.includes('Nothing was captured'),
        'an empty recording is reported in words');
  check(el('recCap').textContent === 'Record', 'and still leaves the loop usable');
  window.MediaRecorder = StubMediaRecorder;
  globalThis.MediaRecorder = StubMediaRecorder;
}

/* ---- the recogniser survives back-to-back takes ---------------------------- */
{
  let live = 0, starts = 0;
  class StubRecognition {
    constructor() { this.running = false; }
    start() {
      starts++;
      if (live > 0) { const e = new Error('already started'); e.name = 'InvalidStateError'; throw e; }
      live++; this.running = true;
      setTimeout(() => {
        if (!this.running) return;
        const alts = [{ transcript: 'tink', confidence: 0.9 }];
        if (this.onresult) this.onresult({ results: [alts] });
        this.stop();
      }, 1);
    }
    stop() { if (this.running) { this.running = false; live--; } if (this.onend) this.onend(); }
    abort() { this.stop(); }
  }
  window.SpeechRecognition = StubRecognition;
  const asr = await import(`./js/asr.js?fresh=${Date.now()}`);

  const a = await asr.listenOnce();
  const b = await asr.listenOnce();          // immediately after, as the drill does
  check(a.transcript === 'tink' && b.transcript === 'tink',
        'two recognitions back to back both return a transcript',
        JSON.stringify([a, b]));
  check(!a.error && !b.error, 'neither is reported as busy or silent');

  // And overlapping: the second must abort the first rather than throw.
  const p1 = asr.listenOnce();
  const p2 = asr.listenOnce();
  const [r1, r2] = await Promise.all([p1, p2]);
  check(!r2.error, 'an overlapping start aborts the previous one instead of failing',
        JSON.stringify(r2));
  check(live === 0, 'no recognition is left running');
  void r1; void starts;
  window.SpeechRecognition = undefined;
}

/* ---- the colour band lands on the right letters --------------------------- */

const { localize } = await import('./js/localize.js');
const { whereHtml, segmentsHtml, focusMarkup, actionsHtml, findingsHtml, contrastHtml } = await import('./js/render.js');

{
  const armed = actionsHtml(true), cold = actionsHtml(false);
  check(['hear', 'compare', 'again'].every((a) => armed.includes(`data-act="${a}"`)),
        'the result card repeats hear / compare / try again under your thumb');
  check((cold.match(/disabled/g) || []).length === 2 && !/again"[^>]*disabled/.test(cold),
        'with no recording of yours yet, playback is disabled but Try again is not');
  check(typeof el('result').onclick === 'function', 'the result card delegates its own clicks');
}

const RED = /rgb\(2[0-4]\d,\s*\d+,\s*\d+\)|rgb\(23\d,/;   // the low end of the band
function segColours(markup) {
  return [...markup.matchAll(/<span class="seg"[^>]*--c:(rgb\([^)]*\))/g)].map((m) => m[1]);
}
function isRedish(c) { const [r, g] = c.match(/\d+/g).map(Number); return r > 200 && g < 160; }
function isGreenish(c) { const [r, g] = c.match(/\d+/g).map(Number); return g > r; }

{
  const think = DECK.find((d) => d.w === 'think');
  const jd = { verdict: 'confused', heard: 'tink' };
  const m = segmentsHtml(think, localize(think, { ok: true, stressScores: [0] }, jd), jd);
  const cols = segColours(m);
  check(cols.length === 5, 'think renders five letter cells', String(cols.length));
  check(isRedish(cols[0]) && isRedish(cols[1]), 'think/tink: T and H are both red');
  check(!isRedish(cols[2]) && !isRedish(cols[3]) && !isRedish(cols[4]),
        'think/tink: I, N and K are not blamed');
  check(m.includes('/θ/ as in think'), 'the caption names the trap the red letters belong to');
}
{
  const smart = DECK.find((d) => d.w === 'smart');
  const jd = { verdict: 'confused', heard: 'ismart' };
  const m = segmentsHtml(smart, localize(smart, { ok: true, stressScores: [0] }, jd), jd);
  check(m.includes('class="seg inserted"'), 'smart/ismart: the extra vowel gets its own boxed cell');
  check(/seg inserted[^>]*>i</.test(m), 'and the cell shows the vowel that was inserted');
  check(segColours(m).every((c) => !isRedish(c)),
        'smart/ismart: none of the real letters are marked wrong');
  check(m.includes('inserted /ɪ/'), 'the caption names it as the prothetic vowel');
}
{
  const think = DECK.find((d) => d.w === 'think');
  const jd = { verdict: 'match', heard: 'think' };
  const m = segmentsHtml(think, localize(think, { ok: true, stressScores: [0] }, jd), jd);
  check(segColours(m).every(isGreenish), 'an exact match paints the whole word green');
  check(m.includes('Every sound survived'), 'and says why it is green');
}
{
  const thirty = DECK.find((d) => d.w === 'thirty');
  const jd = { verdict: 'match', heard: 'thirty' };
  const good = whereHtml(thirty, localize(thirty, { ok: true, stressScores: [0.35, -0.35] }, jd), jd, { ok: true, stressScores: [0.35, -0.35] });
  const bad = whereHtml(thirty, localize(thirty, { ok: true, stressScores: [-0.35, 0.35] }, jd), jd, { ok: true, stressScores: [-0.35, 0.35] });
  check(good.includes('thir') && good.includes('ty'), 'the beat row shows the spelling, split by syllable');
  check(good.includes('carried the beat'), 'a correct stress says so in words as well as colour');
  check(/beat-note">needs to be longer/.test(bad), 'a misplaced stress says what to change');
  check((good.match(/class="beat /g) || []).length === 2, 'two syllables, two beat cells');
  check(good.includes('band-legend'), 'the band is always drawn with its scale');
}
{
  const thirty = DECK.find((d) => d.w === 'thirty');
  const jd = { verdict: 'match', heard: 'thirty' };
  // Three beats heard on a two-syllable word: the row must refuse, not guess.
  const m = whereHtml(thirty, localize(thirty, { ok: true, stressScores: [0.1, 0.1, 0.1] }, jd), jd, { ok: true, stressScores: [0.1, 0.1, 0.1] });
  check(m.includes('no-evidence'), 'a beat-count mismatch produces a stated reason');
  check(!/class="beat /.test(m), 'and draws no beat cells at all');
}
{
  const sent = DECK.find((d) => d.stress < 0);
  const jd = { verdict: 'confused', heard: sent.w.toLowerCase().replace(/think|the/, 'sink') };
  const m = whereHtml(sent, localize(sent, { ok: true, stressScores: [] }, jd), jd, { ok: true, stressScores: [] });
  check(m.includes('wordline'), 'a sentence renders the word row');
  check(!/class="beat /.test(m), 'a sentence never renders beat cells');
}
{
  const think = DECK.find((d) => d.w === 'think');
  check(focusMarkup(think) === '<span class="tw" title="/θ/ as in think">th</span>ink',
        'the target word underlines the letters it is testing', focusMarkup(think));
  const sent = DECK.find((d) => d.stress < 0);
  check(!focusMarkup(sent).includes('<span'), 'a sentence gets no letter underlining');
}

/* ---- the answer to "what is wrong", as rendered --------------------------- */
{
  const think = DECK.find((d) => d.w === 'think');
  const ac = { ok: true, syllables: 1, stressScores: [0], stressIndex: 0, stressMargin: 1 };
  const jd = { verdict: 'confused', heard: 'tink' };
  const m = whereHtml(think, localize(think, ac, jd), jd, ac);
  check(m.includes('The word, and your attempt'), 'the result opens with a straight comparison');
  check(m.includes('>The word<') && m.includes('>Your attempt<'), 'both columns are labelled');
  check(/cmodel">\/θ\/</.test(m) && /cyou">\/t\/</.test(m),
        'it prints the sound that belongs there against the one that came out');
  check(m.includes('the “th” in think'), 'and says which letters that sound lives in');

  const photo = DECK.find((d) => d.w === 'photography');
  const pac = { ok: true, syllables: 4, stressScores: [0.45, -0.15, -0.15, -0.15], stressIndex: 0, stressMargin: 0.6 };
  const pjd = { verdict: 'match', heard: 'photography' };
  const pm = whereHtml(photo, localize(photo, pac, pjd), pjd, pac);
  check(pm.includes('pho-TO-gra-phy') && pm.includes('PHO-to-gra-phy'),
        'a moved stress is rendered as two readable words side by side');
  check(pm.includes('moved 1 syllable left'), 'and names the direction it moved');

  const steps = findingsHtml([{
    trap: 's_cluster', label: TRAPS.s_cluster.label, severity: 3,
    headline: 'h', why: 'w', fix: TRAPS.s_cluster.fix,
  }]);
  check((steps.match(/<li>/g) || []).length === 3, 'each finding becomes a three-step plan');
  check(steps.includes(TRAPS.s_cluster.fix) && steps.includes(TRAPS.s_cluster.drill),
        'the plan carries both the in-word fix and the rehearsal, verbatim');
  check(steps.includes('sound by sound'), 'and points at the row where the fix will show up');
  const stressSteps = findingsHtml([{ trap: 'stress', label: 'x', severity: 3, headline: 'h', why: 'w', fix: 'f' }]);
  check(stressSteps.includes('beat by beat'), 'a stress finding points at the beat row instead');

  check(contrastHtml([]) === '', 'nothing to compare renders nothing, not an empty table');
}

/* ---- every class the JS emits is actually styled --------------------------- */
{
  const emitted = new Set();
  const grab = (markup) => {
    for (const m of markup.matchAll(/class="([^"]+)"/g)) {
      for (const c of m[1].split(/\s+/)) if (c) emitted.add(c);
    }
  };
  const think = DECK.find((d) => d.w === 'think');
  const thirty = DECK.find((d) => d.w === 'thirty');
  const sent = DECK.find((d) => d.stress < 0);
  const jdC = { verdict: 'confused', heard: 'tink' };
  grab(whereHtml(think, localize(think, { ok: true, stressScores: [0] }, jdC), jdC, { ok: true, stressScores: [0] }));
  grab(whereHtml(thirty, localize(thirty, { ok: true, stressScores: [0.3, -0.3] }, jdC), jdC, { ok: true, stressScores: [0.3, -0.3] }));
  grab(whereHtml(sent, localize(sent, { ok: true, stressScores: [] }, jdC), jdC, { ok: true, stressScores: [] }));
  grab(focusMarkup(think));
  grab(actionsHtml(true));
  grab(contrastHtml([{ label: 'Sound', model: '/θ/', you: '/t/', ok: false, note: 'n' },
                     { label: 'Syllables', model: '1', you: '1', ok: true }]));
  grab(findingsHtml([{ trap: 'stress', label: 'x', severity: 3, headline: 'h', why: 'w', fix: 'f' }]));
  grab(el('levelChips').innerHTML);
  grab(el('wordGrid').innerHTML);

  const unstyled = [...emitted].filter((c) => !new RegExp(`\\.${c}\\b`).test(css));
  check(unstyled.length === 0, 'every class the renderer emits has a rule in app.css',
        unstyled.join(', '));
}

console.log(failures ? `\n${failures} FAILED` : '\nall page checks passed');
process.exit(failures ? 1 : 0);
