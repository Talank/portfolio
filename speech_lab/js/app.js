/* Speech Lab — the drill loop, the grammar pane, and what gets remembered.
 *
 * Everything here stays in the browser. The one exception is Chrome's Web
 * Speech API, which sends the utterance to Google; the UI says so, because a
 * tool that records your voice should not be quiet about where it goes.
 */

import { DECK, TRAPS, LEVELS, TRACKS, syllablesOf } from '../data/deck.js';
import { analyze, decodeBlob } from './analyze.js';
import { listenOnce, judge, speak, americanVoices, asrAvailable } from './asr.js';
import { evaluate, verdictLine } from './coach.js';
import { check as grammarCheck, RULE_COUNT, RULE_CLASSES } from './grammar.js';

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
function nextItem() {
  const pool = candidates().filter((d) => d !== state.item);
  if (!pool.length) return state.item;

  const weak = store.weakness;
  const scored = pool.map((d) => {
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

function ipaHtml(item) {
  if (!item.ipa) return '';
  const parts = item.ipa.split('.');
  return '/' + parts
    .map((p, i) => (i === item.stress ? `<span class="stressed">${p}</span>` : p))
    .join('<span class="muted">·</span>') + '/';
}

function renderTarget() {
  const it = state.item;
  if (!it) return;
  const isSentence = it.stress < 0;
  const syl = syllablesOf(it);

  $('targetWord').textContent = it.w;
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
  state.attempt = 0;
}

function strip(ac, stressIdx) {
  const env = ac.envelope || [];
  if (!env.length) return '';
  const lo = ac.envFloor, hi = ac.envPeak;
  const N = Math.min(64, env.length);
  const step = env.length / N;
  const nucleusFrames = new Set((ac.nucleiMs || []).map((ms) => Math.round(ms / 10)));
  const stressFrame = stressIdx >= 0 && ac.nucleiMs && ac.nucleiMs[stressIdx] != null
    ? Math.round(ac.nucleiMs[stressIdx] / 10) : -1;

  let html = '<div class="strip">';
  for (let i = 0; i < N; i++) {
    const a = Math.floor(i * step), b = Math.floor((i + 1) * step);
    let v = -Infinity, isNuc = false, isStress = false;
    for (let j = a; j < Math.max(a + 1, b); j++) {
      if (env[j] > v) v = env[j];
      if (nucleusFrames.has(j)) isNuc = true;
      if (j === stressFrame) isStress = true;
    }
    const h = Math.max(2, Math.round(((v - lo) / Math.max(1, hi - lo)) * 46));
    const cls = isStress ? 'bar stress' : isNuc ? 'bar nucleus' : 'bar';
    html += `<div class="${cls}" style="height:${h}px"></div>`;
  }
  return html + '</div><div class="tiny muted">Energy over time. Teal = a syllable beat the detector found; orange = the one it judged stressed.</div>';
}

function renderResult(res, ac, jd) {
  const it = state.item;
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

  const expected = syllablesOf(it);
  let sylRow = '';
  if (expected && it.ipa) {
    const parts = it.ipa.split('.');
    sylRow = '<div class="syls">' + parts.map((p, i) => {
      const want = i === it.stress;
      const got = i === ac.stressIndex && ac.syllables === expected;
      const cls = want && got ? 'both' : want ? 'want' : got ? 'got' : '';
      return `<span class="syl ${cls}">${p}</span>`;
    }).join('') + '</div>'
    + '<div class="tiny muted">Orange = where the stress belongs. Teal = where it landed. Green = both.</div>';
  }

  const info = res.info.length
    ? `<div class="tiny muted" style="margin-top:.6rem">${res.info.join(' ')}</div>` : '';

  $('result').innerHTML = `
    <div class="card">
      <div class="verdict ${res.verdict}">
        <span class="score">${res.score}</span>
        <span class="line">${verdictLine(res, state.attempt)}</span>
        <span class="muted small" style="margin-left:auto">attempt ${state.attempt}</span>
      </div>
      <ul class="checks">${checks}</ul>
      ${strip(ac, ac.stressIndex)}
      ${sylRow}
      ${findings}
      ${info}
    </div>`;

  $('btnAgain').hidden = false;
  $('btnAgain').textContent = res.verdict === 'pass' ? 'Say it again' : 'Try again';
}

/* --------------------------------------------------------------- capture -- */

let media = { stream: null, recorder: null, chunks: [], ctx: null, stopTimer: null, silence: null };

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
  $('btnRec').textContent = on ? 'Stop' : 'Record';
  $('btnRec').classList.toggle('rec', on);
  $('btnListen').disabled = on;
  $('btnSlow').disabled = on;
  $('btnNext').disabled = on;
}
function setStatus(html) { $('status').innerHTML = html; }

/* -------------------------------------------------------------- progress -- */

function renderProgress() {
  $('statAttempts').textContent = store.attempts;
  $('statPasses').textContent = store.passes;
  $('statWords').textContent = Object.keys(store.cleared).filter((w) => store.cleared[w] >= 80).length;
  $('statDays').textContent = store.days.length;

  const rows = Object.entries(store.weakness)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const max = rows.length ? rows[0][1] : 1;

  $('weakList').innerHTML = rows.length
    ? rows.map(([id, n]) => {
        const t = TRAPS[id];
        return `<div class="weak-row">
          <span>${t ? t.label : id}</span>
          <span class="weak-bar"><i style="width:${Math.round((n / max) * 100)}%"></i></span>
          <span class="muted">${n}</span>
        </div>`;
      }).join('')
    : '<p class="muted small">Nothing recorded yet. The list fills in as the drill finds things.</p>';

  $('weakNote').hidden = rows.length === 0;
  if (rows.length) {
    const t = TRAPS[rows[0][0]];
    $('weakNote').innerHTML = t
      ? `<b>Your top miss is ${t.label}.</b> ${t.fix} The drill is already weighting words that contain it.`
      : '';
  }
}

/* --------------------------------------------------------------- grammar -- */

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

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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

function buildSelects() {
  $('levelSel').innerHTML = LEVELS.map((l) =>
    `<option value="${l.n}">${l.n} · ${l.name}</option>`).join('');
  $('trackSel').innerHTML = TRACKS.map((t) =>
    `<option value="${t.id}">${t.name}</option>`).join('');

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
  if (name === 'progress') renderProgress();
}

function wire() {
  $('tab-drill').onclick = () => tab('drill');
  $('tab-grammar').onclick = () => tab('grammar');
  $('tab-progress').onclick = () => tab('progress');

  $('levelSel').onchange = (e) => {
    state.level = +e.target.value;
    state.item = nextItem(); renderTarget();
  };
  $('trackSel').onchange = (e) => {
    state.track = e.target.value; state.item = nextItem(); renderTarget();
  };
  $('voiceSel').onchange = (e) => { state.voiceName = e.target.value || null; };

  $('btnListen').onclick = () => speak(state.item.w, { rate: 1, voiceName: state.voiceName });
  $('btnSlow').onclick = () => speak(state.item.w, { rate: 0.6, voiceName: state.voiceName });
  $('btnRec').onclick = () => (state.recording ? stopRecording() : startRecording());
  $('btnNext').onclick = () => { state.item = nextItem(); renderTarget(); };
  $('btnAgain').onclick = () => startRecording();

  $('gCheck').onclick = () => renderGrammar($('gText').value);
  $('gSpeak').onclick = speakSentence;
  $('gText').oninput = () => { if ($('gText').value.length > 12) renderGrammar($('gText').value); };

  $('btnReset').onclick = () => {
    if (!confirm('Erase every recorded attempt and weak-point count on this device?')) return;
    store = { attempts: 0, passes: 0, weakness: {}, cleared: {}, days: [] };
    save(); renderProgress();
  };

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); $('btnRec').click(); }
    if (e.key === 'l') $('btnListen').click();
    if (e.key === 'n') $('btnNext').click();
  });
}

function banners() {
  if (!asrAvailable) {
    $('asrBanner').innerHTML =
      '<b>No speech recogniser in this browser.</b> The acoustic checks — syllable count, stress placement, rhythm — still work, but the "was it recognised" check is skipped. Chrome or Edge has it.';
    $('asrBanner').hidden = false;
  }
  $('grammarMeta').textContent =
    `${RULE_COUNT} rules across ${RULE_CLASSES.length} classes: ${RULE_CLASSES.join(', ')}.`;
}

buildSelects();
wire();
banners();
state.item = nextItem();
renderTarget();
renderProgress();
