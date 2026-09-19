/* Speech Lab — locating the error inside the word.
 *
 * "It was wrong" is not a lesson. "The TH went red, and the recogniser heard a
 * T there" is. This file turns the three kinds of evidence the app actually
 * has into a position — a letter span or a syllable — plus a number from 0 to
 * 1 that a colour band can render.
 *
 * The three sources, and what each is allowed to claim:
 *
 *   1. The recogniser's transcript, aligned to the target letter by letter.
 *      A substituted or deleted letter is genuine evidence that the sound
 *      there did not survive. An inserted letter at position 0 in front of
 *      s + stop is the prothetic /ɪ/, visible as itself.
 *   2. The measured prominence of each syllable, compared against the profile
 *      English wants for this word's stress. That colours beats, not sounds.
 *   3. Where in the spelling this item's trap physically lives. This is a
 *      lookup, not a measurement, so it is only ever used to widen a span
 *      that evidence 1 already flagged — "h" becomes "th" because the digraph
 *      is one sound — and never to colour a letter on its own.
 *
 * The rule that keeps this honest: when a source is missing or cannot be
 * lined up, the answer is a stated reason, not a grey guess. A colour in the
 * wrong place is worse than no colour, because the user will move their
 * tongue to fix a sound that was already fine.
 */

/* ---- the colour band -----------------------------------------------------
 * One continuous ramp so that "bad" and "very bad" are visibly different
 * rather than both landing on the same red. Stops are interpolated in RGB,
 * which is crude but monotonic in lightness across this particular set, so
 * nothing goes muddy in the middle the way red-to-green usually does. */
const STOPS = [
  [0.00, [229,  72,  77]],   // red        — heard as something else
  [0.25, [247, 107,  21]],   // orange
  [0.50, [245, 197,  24]],   // amber      — recognisable but off
  [0.75, [168, 211, 107]],   // yellow-green
  [1.00, [ 75, 208, 127]],   // green      — landed
];

export const NO_EVIDENCE = '#5a6678';

/**
 * @param {number|null} v 0..1, or null for "not measured"
 * @param {number} a alpha — the tint used behind a cell is the same hue as its
 *                   edge, so the two can never disagree about severity.
 */
export function bandColor(v, a = 1) {
  if (v == null || Number.isNaN(v)) {
    return a === 1 ? NO_EVIDENCE : `rgba(90,102,120,${a})`;
  }
  const x = Math.max(0, Math.min(1, v));
  let i = 0;
  while (i < STOPS.length - 2 && x > STOPS[i + 1][0]) i++;
  const [x0, c0] = STOPS[i];
  const [x1, c1] = STOPS[i + 1];
  const t = (x - x0) / (x1 - x0);
  const c = c0.map((n, k) => Math.round(n + (c1[k] - n) * t));
  return a === 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

/* The same stops as a CSS gradient, so the legend the user reads can never
 * drift away from the colours the cells are actually painted with. */
export function bandGradient(dir = 'to right') {
  return `linear-gradient(${dir}, ` +
    STOPS.map(([x, c]) => `rgb(${c[0]},${c[1]},${c[2]}) ${Math.round(x * 100)}%`).join(', ') + ')';
}

export function bandLabel(v) {
  if (v == null || Number.isNaN(v)) return 'not measured';
  if (v >= 0.80) return 'good';
  if (v >= 0.60) return 'okay';
  if (v >= 0.35) return 'off';
  return 'wrong';
}

/* ---- alignment -----------------------------------------------------------
 * Plain Levenshtein with a backtrace. Used over characters for a word and
 * over words for a sentence, which is why it takes an equality function:
 * "want" and "wanted" are the same word half-right, but "a" and "b" are not
 * the same letter half-right. */
export function alignSeq(a, b, eq = (x, y) => x === y) {
  const m = a.length, n = b.length;
  const d = [];
  for (let i = 0; i <= m; i++) { d.push(new Int32Array(n + 1)); d[i][0] = i; }
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (eq(a[i - 1], b[j - 1]) ? 0 : 1),
      );
    }
  }
  const ops = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    const diag = i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (eq(a[i - 1], b[j - 1]) ? 0 : 1);
    if (diag) {
      ops.push({ op: eq(a[i - 1], b[j - 1]) ? 'eq' : 'sub', ai: i - 1, bi: j - 1 });
      i--; j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      ops.push({ op: 'del', ai: i - 1, bi: j });
      i--;
    } else {
      ops.push({ op: 'ins', ai: i, bi: j - 1 });
      j--;
    }
  }
  ops.reverse();
  return ops;
}

/* ---- where a trap lives in the spelling ----------------------------------
 * Deliberately conservative. Every pattern here is one I checked against the
 * words in the deck that carry that trap; where a spelling does not give the
 * sound away (the /z/ inside "repository", the /s/ of "sepsis") there is no
 * pattern and the answer is no span. A missing highlight costs nothing. A
 * highlight over the wrong letters teaches the wrong correction. */
const TRAP_ORTHO = {
  th_voiceless:  /th/g,
  th_voiced:     /th/g,
  v_f:           /[vf]|ph/g,
  w_v:           /w|qu/g,
  sh_s:          /sh|ssi(?=on)|ti(?=on)|si(?=on)|su(?=re$)|ch(?=e$)/g,
  zh:            /su(?=re)|si(?=on)|si(?=a)|ge$/g,
  j_z:           /dge|dg|j|g(?=e)/g,
  z_s:           /z|s$|s(?=m$)/g,
  s_cluster:     /s[ptkmn]|sc(?=[haeiou])/g,
  final_stop:    /[ptkbdg]e$|[ptkbdg]$/g,
  plosive_force: /^[ptk]/g,
  // stress, schwa, vowel_len, rhythm and intonation are not segments and get
  // no span on purpose — they are shown on the beat row instead.
};

/** All character spans in `word` where `trapId` physically lives. */
export function trapSpans(word, trapId) {
  const rx = TRAP_ORTHO[trapId];
  if (!rx) return [];
  const w = String(word).toLowerCase();
  const out = [];
  rx.lastIndex = 0;
  let m;
  while ((m = rx.exec(w)) !== null) {
    out.push([m.index, m.index + m[0].length]);
    if (m.index === rx.lastIndex) rx.lastIndex++;   // zero-width guard
  }
  return out;
}

/* ---- evidence 1: what the recogniser heard, letter by letter ------------- */

/**
 * @returns {{chars: Array<{ch:string, score:number|null, trap:string|null}>,
 *            inserts: Array<{at:number, text:string}>}}
 */
export function segmentEvidence(item, heard, closeness) {
  const target = String(item.w).toLowerCase();
  let h = String(heard || '').toLowerCase();
  /* On a single-word drill the recogniser's word boundaries are not evidence
   * about sounds: "ismart" and "is mart" are the same mouth doing the same
   * thing, and only one of them produces a sensible letter row. Sentences keep
   * their spaces, because there the boundaries are the point. */
  if (!/\s/.test(target)) h = h.replace(/\s+/g, '');
  const ops = alignSeq(Array.from(target), Array.from(h));

  const wrong = new Array(target.length).fill(false);
  // What each target letter actually came back as: the substituted letter, or
  // '' where it was dropped. This is the raw material for "/θ/ became /t/".
  const heardFor = new Array(target.length).fill('');
  const insMap = new Map();
  for (const o of ops) {
    if (o.op === 'eq' || o.op === 'sub') heardFor[o.ai] = h[o.bi];
    if (o.op === 'sub' || o.op === 'del') wrong[o.ai] = true;
    if (o.op === 'ins') {
      const at = Math.min(o.ai, target.length);
      insMap.set(at, (insMap.get(at) || '') + h[o.bi]);
    }
  }

  /* Widen every flagged letter to the whole trap it sits in. The recogniser
   * dropping the "h" of "think" is the /θ/ failing, and /θ/ is spelled "th";
   * colouring only the h would point at a letter that has no sound of its own. */
  const owner = new Array(target.length).fill(null);
  for (const trapId of item.traps || []) {
    for (const [s, e] of trapSpans(target, trapId)) {
      let touched = false;
      for (let i = s; i < e; i++) if (wrong[i]) touched = true;
      for (let i = s; i < e; i++) {
        if (touched) wrong[i] = true;
        if (touched || owner[i] === null) owner[i] = trapId;
      }
    }
  }

  // A near miss is orange, a different word is red. The severity is the
  // verdict the recogniser already gave, not a second opinion invented here.
  const badScore = closeness === 'near' ? 0.35 : 0.10;
  const chars = Array.from(target).map((ch, i) => ({
    ch,
    score: wrong[i] ? badScore : 0.9,
    trap: wrong[i] ? owner[i] : null,
  }));

  const inserts = [...insMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([at, text]) => ({ at, text }));

  return { chars, inserts, heardFor, target };
}

/* ---- naming the sound, on both sides -------------------------------------
 * What a letter group says, in the words this deck contains. This is not a
 * general grapheme-to-phoneme model and is not trying to be: it is a lookup
 * over a fixed 92-item deck, and anything it does not know produces no claim
 * at all rather than a guess. "/θ/ became something" is useless; "/θ/ became
 * /t/" is the whole lesson, so it is only ever printed when both halves are
 * actually known. */
const SOUND = {
  t: 't', d: 'd', s: 's', z: 'z', f: 'f', v: 'v', b: 'b', p: 'p', k: 'k',
  g: 'ɡ', w: 'w', r: 'ɹ', l: 'l', m: 'm', n: 'n', h: 'h', y: 'j', c: 'k',
  x: 'ks', j: 'dʒ',
  ph: 'f', sh: 'ʃ', ch: 'tʃ', ck: 'k', qu: 'kw', dg: 'dʒ', dge: 'dʒ',
  ts: 'ts', dz: 'dz', ss: 's',
  ssi: 'ʃ', ti: 'ʃ', si: 'ʃ', su: 'ʃ', ge: 'dʒ',
  te: 't', de: 'd', pe: 'p', ke: 'k', be: 'b',
};

/* Where the spelling is ambiguous, the trap decides — "th" is /θ/ in *think*
 * and /ð/ in *father*, and only the trap knows which word this is. Traps not
 * listed here read their letters out of SOUND instead, because for those the
 * spelling is what settles it: "van" is /v/ and "anaphylaxis" is /f/, and both
 * are the same trap. */
const TRAP_SOUND = {
  th_voiceless: 'θ', th_voiced: 'ð', sh_s: 'ʃ', zh: 'ʒ',
  j_z: 'dʒ', z_s: 'z', w_v: 'w',
};

const soundOf = (letters, trapId) =>
  (trapId && TRAP_SOUND[trapId]) || SOUND[String(letters).toLowerCase()] || null;

/* The substitutions the paper actually documents for each trap, as the letters
 * a recogniser returns when one fires. Needed because a letter-level alignment
 * drifts: "language" against "languez" lines the g up with an e, so reading the
 * heard letter straight off the alignment gives nothing. Looking instead for a
 * substitution this trap is *known* to make, inside the run that went wrong, is
 * both more robust and better grounded — it is the paper's list, not a guess. */
const TRAP_SUBS = {
  th_voiceless:  { t: 't', d: 'd', s: 's', f: 'f' },
  th_voiced:     { d: 'd', z: 'z', v: 'v', t: 't' },
  v_f:           { b: 'b', w: 'w', p: 'p' },
  w_v:           { v: 'v', b: 'b' },
  sh_s:          { s: 's', ch: 'tʃ' },
  zh:            { z: 'z', j: 'dʒ', s: 's' },
  j_z:           { dz: 'dz', z: 'z', g: 'ɡ' },
  z_s:           { s: 's' },
  plosive_force: { b: 'b', d: 'd', g: 'ɡ' },
};

/* Longest documented substitution appearing in the run that went wrong. */
function substituteIn(region, trapId) {
  const subs = TRAP_SUBS[trapId];
  if (!subs || !region) return null;
  const keys = Object.keys(subs).sort((a, b) => b.length - a.length);
  for (const k of keys) if (region.includes(k)) return subs[k];
  return null;
}

/* The contiguous run of wrong letters that a span sits inside. The alignment
 * diverges from the first bad letter to the end of the mismatch, so the sound
 * that actually replaced this one is somewhere in that run, not necessarily at
 * the exact index. */
function redRun(ev, a, b) {
  let lo = a, hi = b;
  while (lo > 0 && ev.chars[lo - 1] && ev.chars[lo - 1].score < 0.5) lo--;
  while (hi < ev.chars.length && ev.chars[hi] && ev.chars[hi].score < 0.5) hi++;
  return ev.heardFor.slice(lo, hi).join('');
}

/**
 * The sound-level difference between the word and the attempt.
 * Returns [] rather than a vague claim whenever either side is unknown.
 * @returns {Array<{trap:string, letters:string, heardLetters:string, was:string, got:string}>}
 */
export function soundDiff(item, ev) {
  if (!ev || !ev.heardFor) return [];
  const word = String(item.w).toLowerCase();
  const out = [];
  const seen = new Set();

  for (const trapId of item.traps || []) {
    for (const [a, b] of trapSpans(word, trapId)) {
      let anyWrong = false;
      for (let i = a; i < b; i++) if (ev.chars[i] && ev.chars[i].score < 0.5) anyWrong = true;
      if (!anyWrong) continue;

      const letters = word.slice(a, b);
      const heardLetters = ev.heardFor.slice(a, b).join('');
      const was = soundOf(letters, trapId);
      // Exact alignment first; the trap's documented substitutions as the
      // fallback; and if neither knows, no row at all.
      const got = soundOf(heardLetters, null) || substituteIn(redRun(ev, a, b), trapId);
      if (!was || !got || was === got) continue;      // no honest pair, no row
      const key = `${was}>${got}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ trap: trapId, letters, heardLetters, was, got });
    }
  }

  /* An inserted vowel is not a damaged consonant, it is an extra sound, and it
   * belongs at the top because it is the one Nepali speakers are most often
   * unaware of. */
  if ((item.traps || []).includes('s_cluster') && ev.inserts.some((i) => i.at === 0)) {
    const cluster = (trapSpans(word, 's_cluster')[0] || []).length
      ? word.slice(...trapSpans(word, 's_cluster')[0]) : word.slice(0, 2);
    const onset = Array.from(cluster).map((c) => SOUND[c] || c).join('');
    out.unshift({
      trap: 's_cluster', letters: cluster, heardLetters: '',
      was: onset, got: 'ɪ' + onset, inserted: true,
    });
  }
  return out;
}

/* ---- naming the stress, on both sides ------------------------------------
 * pho-TO-gra-phy against PHO-to-gra-phy. Reading two of these side by side is
 * the fastest way anybody has found to see that a stress moved, which is why
 * it is spelled out rather than left to the colour of a cell. */
export function stressNotation(parts, index) {
  if (!parts || !parts.length) return null;
  return parts.map((p, i) => (i === index ? p.toUpperCase() : p)).join('-');
}

/* ---- evidence 2: the beat profile ----------------------------------------
 * English wants one syllable clearly above the others. `stressScores` are
 * already deviations from this utterance's own mean in fixed perceptual units
 * (see analyze.js), so an ideal profile is just a contrast of CONTRAST spread
 * around zero, and the error is the distance from it — counted in one
 * direction only, because a stressed syllable cannot be too strong and an
 * unstressed one cannot be too small. */
const CONTRAST = 0.6;
const TOLERANCE = 0.45;

export function beatScores(item, ac) {
  const n = item.ipa ? item.ipa.split('.').length : 0;
  if (item.stress < 0 || !n) return { parts: null, reason: 'sentence' };
  if (n < 2) return { parts: null, reason: 'single' };
  if (!ac || !ac.ok || !Array.isArray(ac.stressScores) || ac.stressScores.length !== n) {
    return { parts: null, reason: 'count-mismatch' };
  }

  return {
    parts: ac.stressScores.map((actual, i) => {
      const isStrong = i === item.stress;
      const ideal = isStrong ? (CONTRAST * (n - 1)) / n : -CONTRAST / n;
      const slack = isStrong ? actual - ideal : ideal - actual;
      const err = slack >= 0 ? 0 : -slack;
      const score = Math.max(0, 1 - err / TOLERANCE);
      let note;
      if (score >= 0.8) note = isStrong ? 'carried the beat' : 'stayed light';
      else if (isStrong) note = score >= 0.5 ? 'not quite strong enough' : 'needs to be longer, louder, higher';
      else note = score >= 0.5 ? 'a shade heavy' : 'too heavy — let it collapse';
      return { index: i, role: isStrong ? 'strong' : 'weak', actual, ideal, score, note };
    }),
    reason: null,
  };
}

/* ---- evidence 1, sentence-sized ------------------------------------------ */

function wordSim(a, b) {
  if (a === b) return 1;
  const ops = alignSeq(Array.from(a), Array.from(b));
  const edits = ops.filter((o) => o.op !== 'eq').length;
  return 1 - edits / Math.max(a.length, b.length, 1);
}

export function wordEvidence(target, heard) {
  const clean = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim();
  const T = clean(target).split(' ').filter(Boolean);
  const H = clean(heard).split(' ').filter(Boolean);
  if (!H.length) return null;

  const ops = alignSeq(T, H, (a, b) => a === b);
  const out = T.map((w) => ({ text: w, score: null, heard: null }));
  for (const o of ops) {
    if (o.op === 'eq') { out[o.ai].score = 1; out[o.ai].heard = H[o.bi]; }
    else if (o.op === 'sub') {
      const s = wordSim(T[o.ai], H[o.bi]);
      // Aligned but not identical: score it by how close, so "fifth"/"fifty"
      // reads differently from "fifth"/"dog".
      out[o.ai].score = Math.max(0, Math.min(0.7, s));
      out[o.ai].heard = H[o.bi];
    } else if (o.op === 'del') { out[o.ai].score = 0; out[o.ai].heard = null; }
  }
  const dropped = ops.filter((o) => o.op === 'ins').map((o) => H[o.bi]);
  return { words: out, dropped };
}

/* ---- model against attempt ------------------------------------------------
 * The single thing the app was missing: a straight side-by-side of what the
 * word is and what came out. Every row is a pair plus a verdict, and a row only
 * exists when both halves are actually known — a comparison with a blank on one
 * side is not a comparison.
 *
 * @param {Array<string>|null} spell orthographic syllables, from the deck
 */
export function contrast(item, ac, jd, loc, spell) {
  const rows = [];
  const isSentence = item.stress < 0;
  const n = item.ipa ? item.ipa.split('.').length : 0;

  /* 1. sounds — the specific segment that moved */
  if (loc.segments && !loc.segments.exact) {
    for (const d of soundDiff(item, loc.segments)) {
      rows.push({
        label: 'Sound',
        model: `/${d.was}/`,
        you: `/${d.got}/`,
        ok: false,
        trap: d.trap,
        note: d.inserted
          ? `nothing belongs in front of the /${d.was.slice(0, 1)}/ — a vowel opened the word`
          : `the “${d.letters}” in ${item.w}`,
      });
    }
  }

  /* A mismatch we could not localise still deserves a pair, because "it heard
   * something else" is itself the difference — it just has no address. */
  if (!isSentence && !rows.length && jd && jd.heard && jd.verdict !== 'match' && jd.verdict !== 'unavailable') {
    rows.push({
      label: 'Heard', model: item.w, you: jd.heard, ok: false,
      note: 'no single sound in this word explains it',
    });
  }

  if (!ac || !ac.ok) return rows;

  /* 2. syllable count — an extra beat is the inserted vowel, visible as a number */
  if (!isSentence && n) {
    const got = ac.syllables;
    rows.push({
      label: 'Syllables', model: String(n), you: String(got), ok: got === n,
      note: got > n ? `${got - n} more than the word has`
          : got < n ? 'syllables ran together'
          : '',
    });
  }

  /* 3. stress — spelled out on both sides, because two of these read side by
   *    side is the fastest way to see that a stress moved */
  if (!isSentence && n > 1 && item.stress >= 0 && spell) {
    const model = stressNotation(spell, item.stress);
    if (ac.syllables !== n) {
      rows.push({
        label: 'Stress', model, you: '—', ok: false,
        note: 'cannot be placed until the beat count matches',
      });
    } else {
      const flat = ac.stressMargin < 0.15;
      const landed = ac.stressIndex === item.stress;
      /* A level word has no winner, so showing one capitalised syllable would
       * be drawing a stress that was not there. All lower case is the honest
       * picture, and it also makes the difference visible at a glance. */
      rows.push({
        label: 'Stress', model, you: stressNotation(spell, flat ? -1 : ac.stressIndex),
        ok: landed && !flat, trap: 'stress',
        note: !landed ? `it moved ${Math.abs(ac.stressIndex - item.stress)} syllable${Math.abs(ac.stressIndex - item.stress) === 1 ? '' : 's'} ${ac.stressIndex < item.stress ? 'left' : 'right'}`
            : flat ? 'no syllable clearly won — the word came out level'
            : '',
      });
    }
  }

  /* 3b. for a sentence, how much of it arrived */
  if (isSentence && loc.words) {
    const total = loc.words.words.length;
    const kept = loc.words.words.filter((w) => w.score === 1).length;
    rows.push({
      label: 'Words', model: `${total} words`, you: `${kept} came through`, ok: kept === total,
      note: kept === total ? '' : 'the coloured row below shows which',
    });
  }

  /* 4. rhythm — the sentence equivalent of stress */
  if (isSentence && ac.npvi != null) {
    rows.push({
      label: 'Rhythm', model: 'nPVI 50–80', you: `nPVI ${Math.round(ac.npvi)}`,
      ok: ac.npvi >= 50, trap: 'rhythm',
      note: ac.npvi >= 50 ? '' : 'your syllables came out close to equal in length',
    });
  }

  return rows;
}

/* ---- the render model ----------------------------------------------------- */

/**
 * @param {object} item  deck entry
 * @param {object} ac    analyze() result
 * @param {object} jd    judge() result
 * @returns {{mode:string, beats:object, segments:object, words:object}}
 */
export function localize(item, ac, jd) {
  const isSentence = item.stress < 0;
  const heardSomething = jd && ['match', 'near', 'confused'].includes(jd.verdict);

  if (isSentence) {
    const ev = heardSomething ? wordEvidence(item.w, jd.verdict === 'match' ? item.w : jd.heard) : null;
    return {
      mode: 'sentence',
      beats: { parts: null, reason: 'sentence' },
      segments: null,
      words: ev,
      wordsReason: ev ? null
        : jd && jd.verdict === 'unavailable' ? 'no-recogniser'
        : jd && jd.verdict === 'error' ? 'recogniser-busy'
        : 'nothing-heard',
    };
  }

  let segments = null;
  let segReason = null;
  if (jd && jd.verdict === 'match') {
    segments = {
      chars: Array.from(String(item.w)).map((ch) => ({ ch, score: 1, trap: null })),
      inserts: [],
      exact: true,
    };
  } else if (heardSomething && jd.heard) {
    segments = segmentEvidence(item, jd.heard, jd.verdict === 'near' ? 'near' : 'confused');
    segments.exact = false;
  } else {
    segReason = jd && jd.verdict === 'unavailable' ? 'no-recogniser'
      : jd && jd.verdict === 'error' ? 'recogniser-busy'
      : 'nothing-heard';
  }

  return {
    mode: 'word',
    beats: beatScores(item, ac),
    segments,
    segReason,
    words: null,
  };
}

/* Why a row is empty, in the user's terms rather than the code's. */
export const REASONS = {
  sentence: 'Beat-by-beat weighting is measured on single words. For a sentence the rhythm number below is the equivalent.',
  single: 'One syllable, so there is no stress pattern to place.',
  'count-mismatch': 'The number of beats heard did not match the number the word has, so the beats cannot be lined up with the syllables — fix the count first and this row comes back.',
  'no-recogniser': 'This browser has no speech recogniser, so there is nothing to compare your sounds against letter by letter. Chrome or Edge has one.',
  'nothing-heard': 'Nothing intelligible came back, so there is no transcript to line the letters up against.',
  'recogniser-busy': 'The recogniser was still busy with the previous take, so this one has acoustic measurements but no transcript. Leave half a second between attempts.',
};
