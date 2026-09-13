/* Speech Lab — the drill loop, the grammar pane, and what gets remembered.
 *
 * Everything here stays in the browser. The one exception is Chrome's Web
 * Speech API, which sends the utterance to Google; the UI says so, because a
 * tool that records your voice should not be quiet about where it goes.
 */

import { DECK, TRAPS, LEVELS, TRACKS, syllablesOf, spellSyllables } from '../data/deck.js';
import { analyze, decodeBlob } from './analyze.js';
import { listenOnce, judge, speak, americanVoices, asrAvailable } from './asr.js';
import { evaluate, verdictLine } from './coach.js';
import { check as grammarCheck, RULE_COUNT, RULE_CLASSES } from './grammar.js';
import { localize, bandColor, bandLabel, bandGradient } from './localize.js';
import { escapeHtml, focusMarkup, ipaHtml, whereHtml, stripHtml, ring, actionsHtml } from './render.js';

const STORE_KEY = 'speechlab-v1';
const $ = (id) => document.getElementById(id);

/* ---------------------------------------------------------------- state -- */

const state = {
  level: 1,
  track: 'gen',
  item: null,
  attempt: 0,
  lastResult: null,
  recording: false,
  voiceName: null,
  lastUrl: null,       // object URL of your own last take, for playback
};

function load() {
  try {
    return Object.assign(
      { attempts: 0, passes: 0, weakness: {}, cleared: {}, days: [] },
      JSON.parse(localStorage.getItem(STORE_KEY) || '{}'),
    );
  } catch (e) {
    return { attempts: 0, passes: 0, weakness: {}, cleared: {}, days: [] };
  }
}
let store = load();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {}
}

/* --------------------------------------------------------------- picking -- */

/* Candidates are level-matched; the track filter is a preference rather than a
 * wall, because a level with four items in it is not a drill. Level 1 is all
 * general on purpose — there is no medical way to fail /θ/ — and level 3 has no
 * general track, because the long words are the technical ones. When the
 * fallback is doing the work, renderTarget() says so rather than leaving the
 * selector claiming something the deck is not honouring. */
const MIN_POOL = 6;

function exactPool() {
  return DECK.filter((d) => d.lvl === state.level && d.track === state.track);
}

function candidates() {
  const exact = exactPool();
  return exact.length >= MIN_POOL ? exact : DECK.filter((d) => d.lvl === state.level);
}

/* The personalisation, such as it is: an item whose traps you keep failing is
 * worth more than one you have already cleared. Randomness keeps it from
 * turning into the same three words forever. */
function nextItem(pool = candidates()) {
  const avail = pool.filter((d) => d !== state.item);
  if (!avail.length) return state.item || pool[0];

  const weak = store.weakness;
  const scored = avail.map((d) => {
    let s = Math.random() * 0.9;
    for (const t of d.traps) s += Math.min(3, (weak[t] || 0)) * 0.55;
    const best = store.cleared[d.w];
    if (best >= 80) s -= 1.6;          // cleared: show it again, but rarely
    else if (best) s += 0.3;           // attempted and not cleared: worth returning to
    return { d, s };
  });
  scored.sort((a, b) => b.s - a.s);
  // Pick from the top few so it is biased, not deterministic.
  const top = scored.slice(0, Math.min(4, scored.length));
  return top[Math.floor(Math.random() * top.length)].d;
}

/* ------------------------------------------------------------- rendering -- */

function renderTarget() {
  const it = state.item;
  if (!it) return;
  const isSentence = it.stress < 0;
  const syl = syllablesOf(it);

  $('targetWord').innerHTML = focusMarkup(it);
  $('targetWord').className = 'word' + (isSentence ? ' sentence' : '');
  $('targetIpa').innerHTML = ipaHtml(it);

  const bits = [];
  if (syl) bits.push(`${syl} syllable${syl === 1 ? '' : 's'}`);
  if (!isSentence && it.stress >= 0 && syl > 1) bits.push(`stress on ${it.stress + 1}`);
  bits.push(TRACKS.find((t) => t.id === it.track).name);
  const best = store.cleared[it.w];
  if (best) bits.push(`best ${best}`);
  $('targetMeta').textContent = bits.join(' · ');

  const trap = TRAPS[it.traps[0]];
  $('trapHint').innerHTML = trap
    ? `<b>Watch: ${trap.label}</b><div class="small muted" style="margin-top:.25rem">${trap.why}</div>`
    : '';

  const lvl = LEVELS.find((l) => l.n === state.level);
  const n = exactPool().length;
  const trackName = TRACKS.find((t) => t.id === state.track).name;
  $('levelBlurb').textContent = n >= MIN_POOL
    ? lvl.blurb
    : `${lvl.blurb}  Level ${state.level} has ${n} ${trackName.toLowerCase()} item${n === 1 ? '' : 's'}, so this is drawing from every track at this level.`;

  $('result').innerHTML = '';
  $('btnAgain').hidden = true;
  setOwnAudio(null);
  state.attempt = 0;
}

/* ---- the result card ------------------------------------------------------- */

function renderResult(res, ac, jd) {
  const it = state.item;
  const loc = localize(it, ac, jd);

  const checks = res.checks.map((c) => `
    <li class="${c.ok ? 'ok' : 'bad'}">
      <span class="mark">${c.ok ? '✓' : '✗'}</span>
      <span class="lbl">${c.label}</span>
      <span class="det">${c.detail}</span>
    </li>`).join('');

  const findings = res.findings.map((f) => `
    <div class="finding ${f.severity === 2 ? 'sev2' : ''}">
      ${f.label ? `<div class="tag">${f.label}</div>` : ''}
      <div class="head">${f.headline}</div>
      <div class="why">${f.why}</div>
      <div class="fix"><b>Do this:</b> ${f.fix}</div>
    </div>`).join('');

  const info = res.info.length
    ? `<div class="tiny muted" style="margin-top:.6rem">${res.info.join(' ')}</div>` : '';

  $('result').innerHTML = `
    <div class="card">
      <div class="verdict ${res.verdict}">
        ${ring(res.score)}
        <div class="vtext">
          <div class="line">${verdictLine(res, state.attempt)}</div>
          <div class="small muted">attempt ${state.attempt} · ${bandLabel(res.score / 100)}</div>
        </div>
      </div>

      ${whereHtml(it, loc, jd)}

      <ul class="checks">${checks}</ul>
      ${stripHtml(ac, loc)}
      ${findings}
      ${info}
      ${actionsHtml(!!state.lastUrl)}
    </div>`;

  // On a narrow screen the card starts below the fold; on a wide one it does not,
  // and yanking the page would be worse than leaving it alone.
  if (window.innerWidth <= 640 && $('result').scrollIntoView) {
    $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('btnAgain').hidden = false;
  $('btnAgain').textContent = res.verdict === 'pass' ? '↻ Say it again' : '↻ Try again';
}

/* --------------------------------------------------------------- capture -- */

let media = { stream: null, recorder: null, chunks: [], ctx: null, stopTimer: null, silence: null };

/* Your own take, kept only as an object URL in this tab so "Hear yours" and
 * "Compare" can play it. Revoked as soon as it is replaced — it is never
 * written anywhere, and a reload loses it. */
function setOwnAudio(blob) {
  if (state.lastUrl) { URL.revokeObjectURL(state.lastUrl); state.lastUrl = null; }
  if (blob) state.lastUrl = URL.createObjectURL(blob);
  $('btnHear').disabled = !state.lastUrl;
  $('btnCompare').disabled = !state.lastUrl;
}

function playOwn() {
  return new Promise((resolve) => {
    if (!state.lastUrl) { resolve(false); return; }
    const a = new Audio(state.lastUrl);
    a.onended = () => resolve(true);
    a.onerror = () => resolve(false);
    a.play().catch(() => resolve(false));
  });
}

async function compare() {
  if (!state.lastUrl) return;
  setStatus('Model…');
  await speak(state.item.w, { rate: 0.85, voiceName: state.voiceName });
  setStatus('Yours…');
  await playOwn();
  setStatus('');
}

async function startRecording() {
  if (state.recording) return;
  $('result').innerHTML = '';

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
    });
  } catch (e) {
    setStatus(`Microphone blocked (${e.name}). Allow mic access for this page and try again.`);
    return;
  }

  state.recording = true;
  state.attempt += 1;
  media.stream = stream;
  media.chunks = [];

  const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
    .find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
  media.recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  media.recorder.ondataavailable = (e) => { if (e.data.size) media.chunks.push(e.data); };

  // The recogniser runs on the same utterance rather than a second take, so the
  // transcript and the acoustics are describing the same performance.
  const asrPromise = listenOnce();

  media.recorder.onstop = async () => {
    stream.getTracks().forEach((t) => t.stop());
    if (media.ctx) { media.ctx.close(); media.ctx = null; }
    state.recording = false;
    setRecUI(false);
    setStatus('Analysing…');

    const blob = new Blob(media.chunks, { type: mime || 'audio/webm' });
    setOwnAudio(blob);
    let ac;
    try {
      const { samples, sampleRate } = await decodeBlob(blob);
      ac = analyze(samples, sampleRate);
    } catch (e) {
      setStatus('Could not decode the recording. Try once more.');
      return;
    }

    const asr = await asrPromise;
    const jd = judge(state.item.w, asr);

    if (!ac.ok) {
      const msg = ac.reason === 'too-quiet'
        ? 'Too quiet to measure — move closer to the mic or turn the input up.'
        : 'That was too short to measure. Say the whole word once.';
      $('result').innerHTML = `<div class="card"><div class="notice"><b>No reading.</b> ${msg}</div></div>`;
      $('btnAgain').hidden = false;
      setStatus('');
      return;
    }

    const res = evaluate(state.item, ac, jd);
    state.lastResult = res;

    store.attempts += 1;
    if (res.verdict === 'pass') store.passes += 1;
    for (const t of res.trapsFired) store.weakness[t] = (store.weakness[t] || 0) + 1;
    const prev = store.cleared[state.item.w] || 0;
    if (res.score > prev) store.cleared[state.item.w] = res.score;
    const today = new Date().toISOString().slice(0, 10);
    if (!store.days.includes(today)) store.days.push(today);
    save();

    renderResult(res, ac, jd);
    setStatus('');
    renderProgress();
  };

  media.recorder.start();
  setRecUI(true);
  setStatus('<span class="dot"></span>Listening — say it once.');

  // Stop on ~900 ms of silence once speech has actually been heard, so the
  // loop keeps moving without a second click. Hard ceiling as a backstop.
  const Ctx = window.AudioContext || window.webkitAudioContext;
  media.ctx = new Ctx();
  const src = media.ctx.createMediaStreamSource(stream);
  const an = media.ctx.createAnalyser();
  an.fftSize = 1024;
  src.connect(an);
  const buf = new Float32Array(an.fftSize);
  let heard = false, quietSince = 0;
  media.silence = setInterval(() => {
    if (!state.recording) return;
    an.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    const now = performance.now();
    if (rms > 0.012) { heard = true; quietSince = 0; }
    else if (heard) {
      if (!quietSince) quietSince = now;
      else if (now - quietSince > 900) stopRecording();
    }
  }, 60);

  const ceiling = state.item.stress < 0 ? 12000 : 6000;
  media.stopTimer = setTimeout(stopRecording, ceiling);
}

function stopRecording() {
  if (!state.recording) return;
  clearTimeout(media.stopTimer);
  clearInterval(media.silence);
  try { media.recorder.stop(); } catch (e) {}
}

function setRecUI(on) {
  $('recCap').textContent = on ? 'Stop' : 'Record';
  $('btnRec').classList.toggle('rec', on);
  $('mRec').classList.toggle('rec', on);
  for (const id of ['btnListen', 'btnSlow', 'btnNext', 'mListen', 'mNext']) $(id).disabled = on;
}
function setStatus(html) { $('status').innerHTML = html; }

/* -------------------------------------------------------------- progress -- */

function renderProgress() {
  $('statAttempts').textContent = store.attempts;
  $('statPasses').textContent = store.passes;
  $('statWords').textContent = Object.keys(store.cleared).filter((w) => store.cleared[w] >= 80).length;
  $('statDays').textContent = store.days.length;

  // Worst first: the list is there to be worked down, not admired.
  const tried = Object.entries(store.cleared).sort((a, b) => a[1] - b[1]);
  $('wordGrid').innerHTML = tried.length
    ? tried.map(([w, s]) =>
        `<button class="wtile" style="--c:${bandColor(s / 100)};--cbg:${bandColor(s / 100, 0.14)}" data-word="${escapeHtml(w)}">
           <span>${escapeHtml(w)}</span><i>${s}</i></button>`).join('')
    : '<p class="muted small" style="margin:0">Nothing tried yet. Each word you attempt lands here, coloured by your best score, worst first — tap one to drill it again.</p>';
  $('legendWords').innerHTML = tried.length
    ? `<span>0</span><i style="background:${bandGradient()}"></i><span>100</span>` : '';

  const rows = Object.entries(store.weakness)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const max = rows.length ? rows[0][1] : 1;

  $('weakList').innerHTML = rows.length
    ? rows.map(([id, n]) => {
        const t = TRAPS[id];
        return `<div class="weak-row">
          <span>${t ? t.label : id}</span>
          <span class="weak-bar"><i style="width:${Math.round((n / max) * 100)}%;background:${bandColor(1 - n / max)}"></i></span>
          <span class="muted">${n}</span>
        </div>`;
      }).join('')
    : '<p class="muted small">Nothing recorded yet. The list fills in as the drill finds things.</p>';

  $('weakNote').hidden = rows.length === 0;
  $('btnDrillWeak').hidden = rows.length === 0;
  if (rows.length) {
    const t = TRAPS[rows[0][0]];
    $('weakNote').innerHTML = t
      ? `<b>Your top miss is ${t.label}.</b> ${t.fix} The drill is already weighting words that contain it.`
      : '';
  }
}

/* Jump straight to a word that contains the trap you fail most. */
function drillWeakest() {
  const rows = Object.entries(store.weakness).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return;
  const trap = rows[0][0];
  const pool = DECK.filter((d) => d.traps.includes(trap));
  if (!pool.length) return;
  state.item = nextItem(pool);
  state.level = state.item.lvl;
  state.track = state.item.track;
  syncChips();
  tab('drill');
  renderTarget();
}

function drillWord(word) {
  const hit = DECK.find((d) => d.w === word);
  if (!hit) return;
  state.item = hit;
  state.level = hit.lvl;
  state.track = hit.track;
  syncChips();
  tab('drill');
  renderTarget();
}

/* --------------------------------------------------------------- grammar -- */

const G_SAMPLE = 'I am having a car since three years. He go to office in morning and discuss about the informations with his team. Kindly do the needful.';

function renderGrammar(text) {
  const out = $('gResult');
  if (!text.trim()) { out.innerHTML = ''; return; }
  const findings = grammarCheck(text);

  if (!findings.length) {
    out.innerHTML = `<div class="g-clean"><b>Nothing flagged.</b>
      <div class="small muted" style="margin-top:.3rem">That means none of the ${RULE_COUNT} rules fired — not that the sentence is perfect. These rules only look for the error classes that come from a Nepali first language.</div></div>`;
    return;
  }

  out.innerHTML = findings.map((f) => `
    <div class="g-finding">
      <div class="cls">${f.cls}</div>
      <div><code>${escapeHtml(f.text)}</code> — ${f.msg}</div>
      ${f.suggestion ? `<div class="sugg small" style="margin-top:.3rem">→ ${escapeHtml(String(f.suggestion))}</div>` : ''}
      <div class="small muted" style="margin-top:.3rem">${f.why}</div>
    </div>`).join('');
}

async function speakSentence() {
  $('gStatus').innerHTML = '<span class="dot"></span>Listening…';
  $('gSpeak').disabled = true;
  const asr = await listenOnce();
  $('gSpeak').disabled = false;
  $('gStatus').textContent = '';
  if (asr.unavailable) { $('gStatus').textContent = 'No recogniser in this browser.'; return; }
  const text = asr.transcript || '';
  if (!text) { $('gStatus').textContent = 'Nothing was heard.'; return; }
  $('gText').value = text;
  $('gStatus').innerHTML = `<span class="muted small">Transcribed. Note the recogniser adds no punctuation and silently fixes some grammar, so this is a weaker check than typing.</span>`;
  renderGrammar(text);
}

/* ------------------------------------------------------------------ init -- */

function chip(label, value, on, sub) {
  return `<button class="chip${on ? ' on' : ''}" data-v="${value}">${label}${sub ? `<i>${sub}</i>` : ''}</button>`;
}

function buildChips() {
  $('levelChips').innerHTML = LEVELS.map((l) =>
    chip(String(l.n), l.n, l.n === state.level, l.name)).join('');
  $('trackChips').innerHTML = TRACKS.map((t) =>
    chip(t.name, t.id, t.id === state.track)).join('');
}
function syncChips() {
  for (const el of $('levelChips').children) el.classList.toggle('on', +el.dataset.v === state.level);
  for (const el of $('trackChips').children) el.classList.toggle('on', el.dataset.v === state.track);
}

function buildVoices() {
  const vs = americanVoices();
  $('voiceSel').innerHTML = vs.length
    ? vs.map((v) => `<option value="${v.name}">${v.name}</option>`).join('')
    : '<option value="">(no en-US voice found)</option>';
}

function tab(name) {
  for (const n of ['drill', 'grammar', 'progress']) {
    $(`panel-${n}`).hidden = n !== name;
    $(`tab-${n}`).setAttribute('aria-selected', String(n === name));
  }
  $('mobilebar').classList.toggle('off', name !== 'drill');
  if (name === 'progress') renderProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function wire() {
  $('tab-drill').onclick = () => tab('drill');
  $('tab-grammar').onclick = () => tab('grammar');
  $('tab-progress').onclick = () => tab('progress');

  $('levelChips').onclick = (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    state.level = +b.dataset.v; syncChips();
    state.item = nextItem(); renderTarget();
  };
  $('trackChips').onclick = (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    state.track = b.dataset.v; syncChips();
    state.item = nextItem(); renderTarget();
  };
  $('wordGrid').onclick = (e) => {
    const b = e.target.closest('.wtile'); if (b) drillWord(b.dataset.word);
  };
  $('btnDrillWeak').onclick = drillWeakest;
  $('voiceSel').onchange = (e) => { state.voiceName = e.target.value || null; };

  const listen = () => speak(state.item.w, { rate: 1, voiceName: state.voiceName });
  const next = () => { state.item = nextItem(); renderTarget(); };
  const record = () => (state.recording ? stopRecording() : startRecording());

  $('btnListen').onclick = listen;
  $('mListen').onclick = listen;
  $('btnSlow').onclick = () => speak(state.item.w, { rate: 0.6, voiceName: state.voiceName });
  $('btnRec').onclick = record;
  $('mRec').onclick = record;
  $('btnNext').onclick = next;
  $('mNext').onclick = next;
  $('btnAgain').onclick = () => startRecording();
  $('btnHear').onclick = playOwn;
  $('btnCompare').onclick = compare;
  $('result').onclick = (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    ({ hear: playOwn, compare, again: startRecording }[b.dataset.act] || (() => {}))();
  };

  $('gCheck').onclick = () => renderGrammar($('gText').value);
  $('gSpeak').onclick = speakSentence;
  $('gSample').onclick = () => { $('gText').value = G_SAMPLE; renderGrammar(G_SAMPLE); };
  $('gClear').onclick = () => { $('gText').value = ''; renderGrammar(''); $('gStatus').textContent = ''; };
  $('gText').oninput = () => { if ($('gText').value.length > 12) renderGrammar($('gText').value); };

  $('btnReset').onclick = () => {
    if (!confirm('Erase every recorded attempt and weak-point count on this device?')) return;
    store = { attempts: 0, passes: 0, weakness: {}, cleared: {}, days: [] };
    save(); renderProgress();
  };

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); record(); }
    if (e.key === 'l') listen();
    if (e.key === 'n') next();
    if (e.key === 'y' && !$('btnHear').disabled) playOwn();
  });
}

function banners() {
  if (!asrAvailable) {
    $('asrBanner').innerHTML =
      '<b>No speech recogniser in this browser.</b> The acoustic checks — syllable count, stress placement, rhythm — still work, but the “was it recognised” check and the letter-by-letter colouring are skipped, because both read off the transcript. Chrome or Edge has one.';
    $('asrBanner').hidden = false;
  }
  $('grammarMeta').textContent =
    `${RULE_COUNT} rules across ${RULE_CLASSES.length} classes: ${RULE_CLASSES.join(', ')}.`;
}

buildChips();
buildVoices();
if (window.speechSynthesis) speechSynthesis.addEventListener('voiceschanged', buildVoices);
wire();
banners();
state.item = nextItem();
renderTarget();
renderProgress();
