#!/usr/bin/env node
/* Boots every bedtime.html the way a browser would, and checks it survives.
 *
 * The other two checkers look at what was built: verify_bedtime_render.py
 * decodes the audio and reconciles the chapter offsets, verify_opus_coverage.py
 * counts the files. Both passed on a voyage whose player was dead on arrival —
 * ACLS_tool/bedtime.html opened with a call to buildHeader(), which is defined
 * in each course's js/app.js, and that page deliberately does not load app.js.
 * One ReferenceError on the first line of the IIFE and nothing after it ever
 * ran: no play button, no audio, and 84 MB of perfectly good opus on disk.
 *
 * Nothing that inspects files can catch that. So this runs the page instead —
 * every <script src> in order, then the inline player, in a vm context with a
 * DOM stubbed just far enough to be honest. The stub is deliberately not a
 * Proxy that answers everything: a missing element or a missing global has to
 * fail here, because that is the entire point.
 *
 * What it asserts, per page:
 *   1. every <script src> exists on disk
 *   2. no script throws, and the inline player runs to completion
 *   3. every getElementById() found its element — a renamed id shows up here
 *   4. the transport buttons ended up with click handlers
 *   5. pressing play sets a src that exists on disk, at the byte size the
 *      manifest claims
 *   6. the chapter list got built, one button per chapter the tier can reach
 *   7. the ambience bed's directory resolves, with every layer it names
 *   8. the localStorage keys are the course's own — two voyages sharing a key
 *      means each one clobbers where the other got to
 *
 *   node shared/check_bedtime_page.js                 # every course
 *   node shared/check_bedtime_page.js ACLS_tool
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = path.join(__dirname, '..');

let failures = 0;
function check(ok, what) {
  if (!ok) failures++;
  console.log((ok ? '  ok    ' : '  FAIL  ') + what);
}

/* ================== a DOM, stubbed honestly ==================
   Only what these pages touch. Anything they touch that is missing throws,
   which is the behaviour under test. */

/* innerHTML is assigned real markup here — chapter rows, the header nav — and
   then read back through querySelector and firstChild. So it has to parse,
   but only the subset actually used: tags, quoted attributes, text. */
function parseHTML(html, doc) {
  const out = [];
  const stack = [];
  const re = /<(\/?)([a-zA-Z][\w-]*)((?:\s+[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
  let at = 0, m;
  const push = (node) => {
    if (stack.length) stack[stack.length - 1].children.push(node);
    else out.push(node);
    node.parentNode = stack[stack.length - 1] || null;
  };
  const text = (s) => {
    if (!s) return;
    const t = s.replace(/\s+/g, ' ');
    if (!t.trim()) return;
    push({ nodeType: 3, tagName: null, children: [], _text: t });
  };
  while ((m = re.exec(html))) {
    text(html.slice(at, m.index));
    at = re.lastIndex;
    if (m[1]) { stack.pop(); continue; }
    const el = doc.createElement(m[2]);
    const ar = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let a;
    while ((a = ar.exec(m[3]))) el.setAttribute(a[1], a[2] !== undefined ? a[2] : a[3]);
    push(el);
    // Void elements and self-closing tags never take children.
    if (!m[4] && !/^(br|hr|img|input|meta|link)$/i.test(m[2])) stack.push(el);
  }
  text(html.slice(at));
  return out;
}

function makeDocument() {
  const doc = {};

  function textOf(node) {
    if (node.nodeType === 3) return node._text;
    return node.children.map(textOf).join('');
  }

  function matches(node, sel) {
    if (node.nodeType === 3) return false;
    if (sel[0] === '.') return node.classList.contains(sel.slice(1));
    if (sel[0] === '#') return node.id === sel.slice(1);
    return node.tagName === sel.toUpperCase();
  }

  function walk(node, sel, hits) {
    node.children.forEach((c) => {
      if (matches(c, sel)) hits.push(c);
      walk(c, sel, hits);
    });
    return hits;
  }

  doc.createElement = function (tag) {
    const el = {
      nodeType: 1,
      tagName: String(tag).toUpperCase(),
      children: [],
      parentNode: null,
      attrs: {},
      listeners: {},
      style: {},
      id: '',
      value: '',
      title: '',
      max: 0,
      className: '',
    };
    el.classList = {
      add: (c) => { if (!el.classList.contains(c)) el.className = (el.className + ' ' + c).trim(); },
      remove: (c) => {
        el.className = el.className.split(/\s+/).filter((x) => x && x !== c).join(' ');
      },
      contains: (c) => el.className.split(/\s+/).indexOf(c) >= 0,
      toggle: (c, on) => (on ? el.classList.add(c) : el.classList.remove(c)),
    };
    Object.defineProperty(el, 'textContent', {
      get: () => textOf(el),
      set: (v) => { el.children = [{ nodeType: 3, tagName: null, children: [], _text: String(v) }]; },
    });
    Object.defineProperty(el, 'innerHTML', {
      get: () => '',
      set: (v) => {
        el.children = [];
        parseHTML(String(v), doc).forEach((n) => { n.parentNode = el; el.children.push(n); });
      },
    });
    Object.defineProperty(el, 'firstChild', { get: () => el.children[0] || null });
    el.appendChild = (c) => { c.parentNode = el; el.children.push(c); return c; };
    el.setAttribute = (k, v) => {
      el.attrs[k] = String(v);
      if (k === 'class') el.className = String(v);
      // An id assigned here is findable by getElementById, exactly as in a
      // browser. It matters: buildHeader() builds the whole site header by
      // assigning innerHTML and then looks up #site-back inside it, so an id
      // that only ever exists in generated markup still has to resolve.
      if (k === 'id') { el.id = String(v); doc.byId[el.id] = el; }
    };
    el.getAttribute = (k) => (Object.prototype.hasOwnProperty.call(el.attrs, k) ? el.attrs[k] : null);
    el.removeAttribute = (k) => { delete el.attrs[k]; };
    el.querySelector = (sel) => walk(el, sel, [])[0] || null;
    el.querySelectorAll = (sel) => walk(el, sel, []);
    el.addEventListener = (ev, fn) => { (el.listeners[ev] = el.listeners[ev] || []).push(fn); };
    el.removeEventListener = (ev, fn) => {
      el.listeners[ev] = (el.listeners[ev] || []).filter((f) => f !== fn);
    };
    el.dispatch = (ev, arg) => (el.listeners[ev] || []).slice().forEach((f) => f.call(el, arg || { target: el }));
    el.focus = () => {};
    el.click = () => el.dispatch('click');
    el.scrollIntoView = () => {};
    el.getBoundingClientRect = () => ({ top: 0, left: 0, width: 0, height: 0 });
    return el;
  };

  doc.body = doc.createElement('body');
  doc.head = doc.createElement('head');
  doc.documentElement = doc.createElement('html');
  doc.readyState = 'complete';
  doc.title = '';
  doc.hidden = false;
  doc.visibilityState = 'visible';
  doc.listeners = {};
  doc.addEventListener = (ev, fn) => { (doc.listeners[ev] = doc.listeners[ev] || []).push(fn); };
  doc.removeEventListener = () => {};
  doc.dispatch = (ev, arg) => (doc.listeners[ev] || []).slice().forEach((f) => f.call(doc, arg || {}));
  doc.createDocumentFragment = () => doc.createElement('#fragment');
  doc.createTextNode = (t) => ({ nodeType: 3, tagName: null, children: [], _text: String(t) });

  doc.byId = Object.create(null);
  doc.missingIds = [];
  doc.getElementById = function (id) {
    if (Object.prototype.hasOwnProperty.call(doc.byId, id)) return doc.byId[id];
    doc.missingIds.push(id);
    return null;
  };
  doc.querySelector = (sel) => (sel[0] === '#' ? doc.getElementById(sel.slice(1)) : walk(doc.body, sel, [])[0] || null);
  doc.querySelectorAll = (sel) => walk(doc.body, sel, []);
  return doc;
}

/* An <audio> that remembers what it was asked to load. It never actually
   decodes anything — whether the bytes are playable is verify_bedtime_render's
   job, and it counts samples rather than trusting a header. */
function makeAudio(doc, requested) {
  const el = doc.createElement('audio');
  el.currentTime = 0;
  el.duration = NaN;
  el.volume = 1;
  el.playbackRate = 1;
  el.readyState = 0;
  el.ended = false;
  el.paused = true;
  el.preload = 'metadata';
  el.canPlayType = (t) => (/opus|ogg|mpeg/.test(t) ? 'probably' : '');
  el.load = () => {};
  el.play = () => { el.paused = false; return Promise.resolve(); };
  el.pause = () => { el.paused = true; };
  Object.defineProperty(el, 'src', {
    get: () => el.attrs.src || '',
    set: (v) => { el.setAttribute('src', String(v)); requested.push(String(v)); },
  });
  return el;
}

/* The bed is checked for real by check_bed_fallback.js, which fakes an
   AudioContext whose clock it can stop. Here it only has to exist and record
   the directory it was pointed at, so a bed path that climbs out of the course
   and lands nowhere is still caught. */
function makeBedEngine(seen) {
  return function BedEngine(opts) {
    seen.base = opts && opts.base;
    this.load = () => Promise.resolve();
    this.enable = () => {};
    this.resume = () => {};
    this.suspend = () => {};
    this.tick = () => {};
    this.setMode = () => {};
    this.setSegment = () => {};
    this.setVolume = () => {};
  };
}

/* ================== running one page ================== */

function scriptsOf(html) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const src = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(m[1]);
    out.push(src ? { src: src[1] !== undefined ? src[1] : src[2] } : { code: m[2] });
  }
  return out;
}

function idsOf(html) {
  const ids = [];
  const re = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(html))) ids.push(m[1] !== undefined ? m[1] : m[2]);
  return ids;
}

/* The language codes the page's LANGS registry declares, in its own order.
   The first is the one that boots with an empty localStorage. */
function langsOf(html) {
  const reg = /var\s+LANGS\s*=\s*\[([\s\S]*?)\]\s*\.filter/.exec(html);
  if (!reg) return [];
  const out = [];
  const re = /\bcode:\s*'([a-z-]+)'/g;
  let m;
  while ((m = re.exec(reg[1]))) out.push(m[1]);
  return out;
}

/* `lang` is null for the page's own default, or a code to seat in localStorage
   before booting. A second edition is reachable only through the toggle, so
   nothing above ever loads it: the first English voyage shipped with the
   toggle wired to a manifest global the page never scripted in, and every
   check here still passed because they all read the Nepali one. */
function run(course, lang) {
  const dir = path.join(REPO, course);
  const pagePath = path.join(dir, 'bedtime.html');
  console.log('\n' + course + '/bedtime.html' + (lang ? '  [' + lang + ']' : ''));
  const html = fs.readFileSync(pagePath, 'utf8');
  const manFile = lang ? 'manifest-' + lang + '.json' : 'manifest.json';

  const doc = makeDocument();
  // Every id the markup declares, so getElementById can only fail on an id
  // that genuinely is not there.
  idsOf(html).forEach((id) => {
    const el = doc.createElement('div');
    el.id = id;
    doc.byId[id] = el;
    doc.body.appendChild(el);
  });

  const requested = [];
  const bedSeen = {};
  // The two crossfading players. The page finds them by id like anything else,
  // but they need the media API on top.
  ['bt-a0', 'bt-a1'].forEach((id) => {
    const a = makeAudio(doc, requested);
    a.id = id;
    doc.byId[id] = a;
  });

  const store = new Map();
  if (lang) store.set(prefixFor(course) + 'lang', lang);
  const timers = [];
  const sandbox = {
    console,
    document: doc,
    navigator: { mediaSession: {}, userAgent: 'node', language: 'en' },
    MediaMetadata: function (o) { Object.assign(this, o); },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      key: (i) => Array.from(store.keys())[i],
      get length() { return store.size; },
    },
    // Collected rather than run: these pages set up 100 ms and 5 s intervals
    // that would keep the process alive forever, and nothing here needs them
    // to tick. clearInterval still has to work, because the crossfade and the
    // sleep timer both clear handles they stored.
    setInterval: (fn, ms) => { timers.push(fn); return timers.length; },
    clearInterval: () => {},
    setTimeout: (fn, ms) => { timers.push(fn); return timers.length; },
    clearTimeout: () => {},
    requestAnimationFrame: (fn) => { timers.push(fn); return timers.length; },
    cancelAnimationFrame: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }),
    fetch: () => Promise.reject(new Error('no network in the harness')),
    location: { href: 'http://localhost/' + course + '/bedtime.html', pathname: '/' + course + '/bedtime.html', search: '' },
    history: { length: 1, back: () => {} },
    AudioContext: function () { throw new Error('bed audio is check_bed_fallback.js\'s job'); },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  sandbox.window.BedEngine = makeBedEngine(bedSeen);
  sandbox.addEventListener = () => {};
  sandbox.removeEventListener = () => {};
  sandbox.alert = () => {};
  sandbox.Audio = function () { return makeAudio(doc, requested); };

  const ctx = vm.createContext(sandbox);

  // A browser runs each <script> in its own turn: one that throws does not
  // stop the next. Mirrored here, because that is exactly how a missing
  // dependency turns into a silent page rather than a blank one.
  const scripts = scriptsOf(html);
  let inlineRan = false;
  scripts.forEach((s, i) => {
    if (s.src) {
      const p = path.resolve(path.dirname(pagePath), s.src);
      if (!fs.existsSync(p)) { check(false, 'script ' + s.src + ' — not on disk'); return; }
      try {
        vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: s.src });
      } catch (e) {
        check(false, 'script ' + s.src + ' threw: ' + e.message);
      }
      return;
    }
    /* bed-engine.js has already run and installed the real engine. Swap ours in
       for the player's benefit: the real one wants an AudioContext and a
       network, and how it behaves is check_bed_fallback.js's subject. What is
       being checked here is only that the page constructs it, and with a
       directory that exists — the bed is shared between courses, so that path
       climbs out of the course and is easy to get wrong. */
    sandbox.window.BedEngine = makeBedEngine(bedSeen);
    try {
      vm.runInContext(s.code, ctx, { filename: 'bedtime.html inline#' + i });
      inlineRan = true;
    } catch (e) {
      check(false, 'the player threw ' + e.name + ': ' + e.message
                   + ' — nothing after that line ever ran');
    }
  });
  if (!inlineRan) return [];

  check(doc.missingIds.length === 0,
        'every element the player asks for exists'
        + (doc.missingIds.length ? ' — missing: ' + Array.from(new Set(doc.missingIds)).join(', ') : ''));

  const wired = ['bt-play', 'bt-prev', 'bt-next', 'bt-back', 'bt-fwd']
    .filter((id) => (doc.byId[id].listeners.click || []).length === 0);
  check(wired.length === 0,
        'transport buttons are wired' + (wired.length ? ' — dead: ' + wired.join(', ') : ''));

  // Startup seeks to the resume point, which loads a segment even before a
  // click. Pressing play must not change that; it must have something loaded.
  doc.byId['bt-play'].dispatch('click');
  const urls = Array.from(new Set(requested));
  check(urls.length > 0, 'pressing play loaded a segment');

  const manPath = path.join(dir, 'data', 'bedtime', manFile);
  if (!fs.existsSync(manPath)) {
    check(false, manFile + ' — the toggle offers this edition but it was never built');
    return urls;
  }
  const man = JSON.parse(fs.readFileSync(manPath, 'utf8'));
  const bad = urls.filter((u) => !fs.existsSync(path.resolve(dir, u)));
  check(bad.length === 0,
        urls.length + ' segment URL(s) resolve on disk' + (bad.length ? ' — missing: ' + bad.join(', ') : ''));

  // The manifest's byte count for a tier is what the player shows as the
  // download size, so a stale one misleads before anything plays.
  let byteProblems = [];
  Object.keys(man.modes || {}).forEach((mk) => {
    const mode = man.modes[mk];
    Object.keys(mode.tiers || {}).forEach((tk) => {
      const t = mode.tiers[tk];
      if (!t.bytes || !t.playlist) return;
      const seen = new Set();
      let sum = 0;
      t.playlist.forEach((p) => {
        // The audio root is the manifest's own, not a fixed 'audio/': the
        // second edition renders beside the first in audio-en/.
        const f = path.join(dir, man.dir || 'data/bedtime/audio/', mode.dir, p.f);
        if (seen.has(f) || !fs.existsSync(f)) return;
        seen.add(f);
        sum += fs.statSync(f).size;
      });
      // The tiers are cumulative, so a tier's bytes include the lighter tiers'
      // segments; only a gross mismatch is a defect worth reporting.
      if (sum && Math.abs(sum - t.bytes) / t.bytes > 0.25) {
        byteProblems.push(mk + '/' + tk + ' claims ' + Math.round(t.bytes / 1e6)
                          + ' MB, files are ' + Math.round(sum / 1e6) + ' MB');
      }
    });
  });
  check(byteProblems.length === 0,
        'tier download sizes match the files' + (byteProblems.length ? ' — ' + byteProblems.join('; ') : ''));

  const rows = doc.byId['bt-chlist'].children.length;
  const reachable = Object.keys(
    man.modes[man.defaultMode || Object.keys(man.modes)[0]].tiers.core.starts || {}).length;
  check(rows === reachable, 'chapter list has ' + rows + ' rows for ' + reachable + ' reachable chapters');

  if (man.bed) {
    check(!!bedSeen.base, 'the bed was constructed');
    const bedDir = path.resolve(dir, bedSeen.base || '.');
    const missing = (man.bed.layers || []).filter(
      (l) => !fs.existsSync(path.join(bedDir, l + '.opus')));
    check(fs.existsSync(bedDir) && missing.length === 0,
          'bed at ' + path.relative(REPO, bedDir) + ' has all '
          + (man.bed.layers || []).length + ' layers'
          + (missing.length ? ' — missing: ' + missing.join(', ') : ''));
  }

  // Two courses sharing a key means each one silently overwrites where the
  // other got to, and you find out by losing your place.
  const keys = Array.from(store.keys());
  const foreign = keys.filter((k) => !k.startsWith(prefixFor(course)));
  check(keys.length > 0 && foreign.length === 0,
        'localStorage keys are this course\'s own'
        + (foreign.length ? ' — borrowed: ' + foreign.join(', ') : ''));

  return urls;
}

/* Each voyage's own namespace. Derived from the page rather than guessed, so
   the check is "all of this page's keys agree with each other", not "they match
   a name this script made up". */
const PREFIX = {};
function prefixFor(course) {
  if (PREFIX[course]) return PREFIX[course];
  const html = fs.readFileSync(path.join(REPO, course, 'bedtime.html'), 'utf8');
  const m = /'([a-z0-9-]+)-bedtime-pos'/.exec(html);
  PREFIX[course] = m ? m[1] + '-bedtime-' : 'bedtime-';
  return PREFIX[course];
}

function main() {
  const courses = process.argv.slice(2).length
    ? process.argv.slice(2).map((c) => c.replace(/\/+$/, ''))
    : fs.readdirSync(REPO)
        .filter((d) => fs.existsSync(path.join(REPO, d, 'bedtime.html'))
                    && fs.existsSync(path.join(REPO, d, 'data', 'bedtime', 'manifest.json')))
        .sort();

  let boots = 0;
  courses.forEach((course) => {
    const first = run(course, null);
    boots++;
    // A page with a language toggle is really two players sharing one shell.
    // Boot it once per edition, and require each to reach audio the others
    // do not: a toggle that silently falls back to the default edition looks
    // identical from the outside, and sounds identical too.
    const codes = langsOf(fs.readFileSync(path.join(REPO, course, 'bedtime.html'), 'utf8'));
    codes.slice(1).forEach((code) => {
      const other = run(course, code);
      boots++;
      const shared = other.filter((u) => first.indexOf(u) !== -1);
      check(other.length > 0 && shared.length === 0,
            'the ' + code + ' toggle loads its own audio'
            + (shared.length ? ' — fell back to the default edition: ' + shared.join(', ') : ''));
    });
  });
  console.log('\n' + (failures
    ? failures + ' problem(s) — a page that fails here is silent in a browser.'
    : boots + ' page boot(s) across ' + courses.length
      + ' course(s) wire up and load their audio. clean.'));
  process.exit(failures ? 1 : 0);
}

main();
