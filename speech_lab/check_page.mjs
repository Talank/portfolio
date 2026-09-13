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

/* ---- the colour band lands on the right letters --------------------------- */

const { localize } = await import('./js/localize.js');
const { whereHtml, segmentsHtml, focusMarkup, actionsHtml } = await import('./js/render.js');

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
  const good = whereHtml(thirty, localize(thirty, { ok: true, stressScores: [0.35, -0.35] }, jd), jd);
  const bad = whereHtml(thirty, localize(thirty, { ok: true, stressScores: [-0.35, 0.35] }, jd), jd);
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
  const m = whereHtml(thirty, localize(thirty, { ok: true, stressScores: [0.1, 0.1, 0.1] }, jd), jd);
  check(m.includes('no-evidence'), 'a beat-count mismatch produces a stated reason');
  check(!/class="beat /.test(m), 'and draws no beat cells at all');
}
{
  const sent = DECK.find((d) => d.stress < 0);
  const jd = { verdict: 'confused', heard: sent.w.toLowerCase().replace(/think|the/, 'sink') };
  const m = whereHtml(sent, localize(sent, { ok: true, stressScores: [] }, jd), jd);
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
  grab(whereHtml(think, localize(think, { ok: true, stressScores: [0] }, jdC), jdC));
  grab(whereHtml(thirty, localize(thirty, { ok: true, stressScores: [0.3, -0.3] }, jdC), jdC));
  grab(whereHtml(sent, localize(sent, { ok: true, stressScores: [] }, jdC), jdC));
  grab(focusMarkup(think));
  grab(actionsHtml(true));
  grab(el('levelChips').innerHTML);
  grab(el('wordGrid').innerHTML);

  const unstyled = [...emitted].filter((c) => !new RegExp(`\\.${c}\\b`).test(css));
  check(unstyled.length === 0, 'every class the renderer emits has a rule in app.css',
        unstyled.join(', '));
}

console.log(failures ? `\n${failures} FAILED` : '\nall page checks passed');
process.exit(failures ? 1 : 0);
