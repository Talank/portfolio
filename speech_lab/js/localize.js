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
  const insMap = new Map();
  for (const o of ops) {
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

  return { chars, inserts };
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
      wordsReason: ev ? null : (jd && jd.verdict === 'unavailable' ? 'no-recogniser' : 'nothing-heard'),
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
    segReason = jd && jd.verdict === 'unavailable' ? 'no-recogniser' : 'nothing-heard';
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
};
