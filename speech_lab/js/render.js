/* Speech Lab — the result display.
 *
 * Pure string-building, no DOM: everything here takes a deck item plus the
 * output of localize() and returns HTML. That separation is not tidiness for
 * its own sake — it is what lets the test suite render a real result card for
 * "think heard as tink" and assert that the red actually lands on the T and
 * the H, rather than checking the numbers and hoping the template agrees.
 *
 * Every colour drawn here comes from bandColor(), and every band is drawn with
 * its legend, because a red cell with no scale beside it is a scolding rather
 * than a measurement.
 */

import { TRAPS, spellSyllables } from '../data/deck.js';
import { bandColor, bandGradient, trapSpans, REASONS } from './localize.js';

export function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/* Group a per-index label map into runs, so consecutive letters belonging to
 * the same sound are wrapped once rather than boxed individually. */
export function runs(n, labelAt) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const k = labelAt(i);
    const last = out[out.length - 1];
    if (last && last.key === k) last.end = i + 1;
    else out.push({ key: k, start: i, end: i + 1 });
  }
  return out;
}

/* The target word with the letters carrying its traps underlined — shown before
 * you record, from the same table the result colouring uses, so "watch this"
 * and "this went wrong" can never point at different letters. */
export function focusMarkup(item) {
  if (item.stress < 0) return escapeHtml(item.w);
  const mark = new Map();
  for (const t of item.traps) {
    for (const [s, e] of trapSpans(item.w, t)) {
      for (let i = s; i < e; i++) if (!mark.has(i)) mark.set(i, t);
    }
  }
  if (!mark.size) return escapeHtml(item.w);
  return runs(item.w.length, (i) => mark.get(i) || null).map((r) => {
    const txt = escapeHtml(item.w.slice(r.start, r.end));
    if (!r.key) return txt;
    const t = TRAPS[r.key];
    return `<span class="tw" title="${t ? escapeHtml(t.label) : r.key}">${txt}</span>`;
  }).join('');
}

export function ipaHtml(item) {
  if (!item.ipa) return '';
  return '/' + item.ipa.split('.')
    .map((p, i) => (i === item.stress ? `<span class="stressed">${escapeHtml(p)}</span>` : escapeHtml(p)))
    .join('<span class="muted">·</span>') + '/';
}

export function legend(lo = 'wrong', hi = 'landed') {
  return `<div class="band-legend"><span>${lo}</span>` +
    `<i style="background:${bandGradient()}"></i><span>${hi}</span></div>`;
}

export function ring(score) {
  const r = 26, c = 2 * Math.PI * r;
  const col = bandColor(score / 100);
  return `<svg class="ring" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="score ${score} out of 100">` +
    `<circle cx="32" cy="32" r="${r}" fill="none" stroke="#2d3646" stroke-width="7"></circle>` +
    `<circle cx="32" cy="32" r="${r}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" ` +
      `stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - score / 100)).toFixed(1)}" ` +
      `transform="rotate(-90 32 32)"></circle>` +
    `<text x="32" y="38" text-anchor="middle" font-size="19" font-weight="700" fill="${col}">${score}</text></svg>`;
}

/* A row that cannot be computed says why, in the user's terms. This is the
 * honest alternative to a grey guess, and it is also the teaching: "the beat
 * count disagreed" tells you what to fix before the beat row means anything. */
function why(reason) {
  return `<div class="no-evidence">${REASONS[reason] || 'Not enough evidence to place this.'}</div>`;
}

/* ---- beats ---------------------------------------------------------------- */

const METER_SPAN = 0.7;   // the prominence range the meter draws, in analyze()'s units
const meterPos = (v) =>
  Math.round(((Math.max(-METER_SPAN, Math.min(METER_SPAN, v)) + METER_SPAN) / (2 * METER_SPAN)) * 100);

export function beatsHtml(item, loc) {
  const parts = loc.beats && loc.beats.parts;
  if (!parts) return why(loc.beats ? loc.beats.reason : 'count-mismatch');

  const spell = spellSyllables(item);
  const ipa = item.ipa ? item.ipa.split('.') : [];

  const cells = parts.map((p, i) => {
    const col = bandColor(p.score);
    const text = spell ? spell[i] : (ipa[i] || String(i + 1));
    return `<div class="beat ${p.role}" style="--c:${col};--cbg:${bandColor(p.score, 0.14)}">` +
      `<div class="beat-role">${p.role === 'strong' ? 'STRONG' : 'weak'}</div>` +
      `<div class="beat-text">${escapeHtml(text)}</div>` +
      (spell && ipa[i] ? `<div class="beat-ipa">${escapeHtml(ipa[i])}</div>` : '') +
      `<div class="beat-meter" title="your weight against the weight this syllable wants">` +
        `<span class="want" style="left:${meterPos(p.ideal)}%"></span>` +
        `<span class="got" style="left:${meterPos(p.actual)}%"></span></div>` +
      `<div class="beat-note">${p.note}</div></div>`;
  }).join('');

  return `<div class="beats">${cells}</div>` +
    `<div class="tiny muted">The dot is the weight you gave that syllable — loudness, length and pitch ` +
    `together. The notch is the weight English wants there. ${legend('far off', 'on target')}</div>`;
}

/* ---- segments ------------------------------------------------------------- */

export function segmentsHtml(item, loc, jd) {
  if (!loc.segments) return why(loc.segReason);
  const s = loc.segments;

  let html = '<div class="segline">';
  for (let i = 0; i <= s.chars.length; i++) {
    const ins = s.inserts.find((x) => x.at === i);
    if (ins) {
      html += `<span class="seg inserted" title="the recogniser heard this extra sound here">${escapeHtml(ins.text)}</span>`;
    }
    if (i < s.chars.length) {
      const c = s.chars[i];
      html += `<span class="seg" style="--c:${bandColor(c.score)};--cbg:${bandColor(c.score, 0.16)}">${escapeHtml(c.ch)}</span>`;
    }
  }
  html += '</div>';

  const caps = [];
  if (s.exact) {
    caps.push('Every sound survived: the recogniser returned exactly this word.');
  } else {
    caps.push(`It came back as <b>“${escapeHtml((jd && jd.heard) || '')}”</b>.`);

    /* Name the red letters, then say which of them the trap actually accounts
     * for. Those are usually not the same set — the alignment diverges from the
     * first bad letter to the end of the mismatch, while the trap is one sound
     * inside that run — and claiming the whole run is the trap would be putting
     * a cause on letters that only came along for the ride. */
    const red = s.chars.filter((c) => c.score < 0.5);
    if (red.length) {
      const redText = escapeHtml(red.map((c) => c.ch).join(''));
      const byTrap = new Map();
      for (const c of red) if (c.trap) byTrap.set(c.trap, (byTrap.get(c.trap) || '') + c.ch);
      const name = (t) => (TRAPS[t] ? TRAPS[t].label : t);
      const only = byTrap.size === 1 ? [...byTrap][0] : null;

      if (only && only[1] === red.map((c) => c.ch).join('')) {
        caps.push(`The red letters <b>${redText}</b> spell ${name(only[0])} — that is the sound that did not survive.`);
      } else {
        caps.push(`The red run is <b>${redText}</b>, where the transcript stopped matching.`);
        caps.push(byTrap.size
          ? 'Inside it, ' + [...byTrap].map(([t, l]) => `<b>${escapeHtml(l)}</b> spells ${name(t)}`).join(' and ') + ' — the likely cause.'
          : 'This word lists no trap that explains it, so no cause is being claimed.');
      }
    }
    if (s.inserts.length) {
      caps.push(s.inserts.some((x) => x.at === 0)
        ? 'The boxed letter at the front is a sound that was not in the word — an opening vowel is exactly the inserted /ɪ/.'
        : 'The boxed letters are sounds the recogniser heard that are not in the word.');
    }
  }

  return html + `<div class="tiny muted">${caps.join(' ')} ${legend('lost', 'heard')}</div>`;
}

/* ---- sentences ------------------------------------------------------------ */

export function wordsHtml(loc) {
  if (!loc.words) return why(loc.wordsReason);
  const chips = loc.words.words.map((w) => {
    const alt = w.heard && w.heard !== w.text
      ? `<i>heard “${escapeHtml(w.heard)}”</i>`
      : (w.score === 0 ? '<i>not heard</i>' : '');
    return `<span class="wchip" style="--c:${bandColor(w.score)};--cbg:${bandColor(w.score, 0.14)}">` +
      `${escapeHtml(w.text)}${alt}</span>`;
  }).join('');

  const extra = loc.words.dropped.length
    ? ` It also heard ${loc.words.dropped.map((d) => `“${escapeHtml(d)}”`).join(', ')}, which is not in the line.`
    : '';
  return `<div class="wordline">${chips}</div>` +
    `<div class="tiny muted">Word by word against the transcript.${extra} A sentence recogniser ` +
    `repairs some near misses from context, so a green word here is weaker evidence than a green ` +
    `word in a single-word drill. ${legend('lost', 'heard')}</div>`;
}

/* ---- the energy strip ----------------------------------------------------- */

export function stripHtml(ac, loc) {
  const env = ac.envelope || [];
  if (!env.length) return '';
  const lo = ac.envFloor, hi = ac.envPeak;
  const N = Math.min(64, env.length);
  const step = env.length / N;
  const beats = loc && loc.beats && loc.beats.parts;

  const nucleusAt = new Map();
  (ac.nucleiMs || []).forEach((ms, i) => nucleusAt.set(Math.round(ms / 10), i));

  let html = '<div class="strip">';
  for (let i = 0; i < N; i++) {
    const a = Math.floor(i * step), b = Math.floor((i + 1) * step);
    let v = -Infinity, syl = -1;
    for (let j = a; j < Math.max(a + 1, b); j++) {
      if (env[j] > v) v = env[j];
      if (nucleusAt.has(j)) syl = nucleusAt.get(j);
    }
    const h = Math.max(2, Math.round(((v - lo) / Math.max(1, hi - lo)) * 46));
    if (syl < 0) { html += `<div class="bar" style="height:${h}px"></div>`; continue; }
    // A nucleus takes the colour its beat scored, so the waveform and the beat
    // row tell the same story rather than two unrelated ones.
    const col = beats && beats[syl] ? bandColor(beats[syl].score) : 'var(--accent)';
    html += `<div class="bar nucleus" style="height:${h}px;background:${col}"></div>`;
  }
  return html + '</div><div class="tiny muted">Energy over time. The coloured bars are the syllable beats the detector found.</div>';
}

/* ---- the whole "where it went wrong" block -------------------------------- */

export function whereHtml(item, loc, jd) {
  const inner = loc.mode === 'sentence'
    ? `<div class="where-block"><h4>Word by word</h4>${wordsHtml(loc)}</div>`
    : `<div class="where-block"><h4>Sound by sound</h4>${segmentsHtml(item, loc, jd)}</div>` +
      `<div class="where-block"><h4>Beat by beat</h4>${beatsHtml(item, loc)}</div>`;
  return `<div class="where"><div class="where-title">Where it went wrong</div>${inner}</div>`;
}

/* The three things worth doing straight after a result, repeated at the bottom
 * of the card. On a phone the controls at the top of the page are a scroll away
 * by the time you have read the findings, and the loop this app is built around
 * — listen, compare, try again — dies if each turn of it costs a scroll. */
export function actionsHtml(hasOwnAudio) {
  const d = hasOwnAudio ? '' : ' disabled';
  return '<div class="controls sub result-actions">' +
    `<button class="btn sm" data-act="hear"${d}>🔊 Hear yours</button>` +
    `<button class="btn sm" data-act="compare"${d}>⇄ Compare with the model</button>` +
    '<button class="btn sm primary" data-act="again">↻ Try again</button></div>';
}
