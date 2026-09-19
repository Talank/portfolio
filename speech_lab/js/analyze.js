/* Speech Lab — acoustic analysis.
 *
 * What this file will and will not claim.
 *
 * It will NOT score phonemes. ELSA does that with a custom DNN on their own
 * servers, and any per-phoneme percentage computed here would be decoration.
 * What it computes instead are four things that are genuinely measurable from
 * a waveform, and that happen to be the three failures the literature names as
 * costing Nepali speakers the most intelligibility, plus rate:
 *
 *   1. syllable count   — an extra syllable on "smart" is the inserted /ɪ/
 *   2. stress placement — which syllable actually won on length+volume+pitch
 *   3. nPVI             — syllable-timed vs stress-timed rhythm, numerically
 *   4. rate             — syllables per second over the voiced region
 *
 * The syllable detector follows the shape of de Jong & Wempe's intensity-peak
 * method: peaks in a smoothed energy envelope, each required to clear a dip
 * from its neighbour and to be voiced. Voicing is the part that matters — it
 * is what stops the hiss of an /s/ from being counted as a vowel, and without
 * it "street" reads as three syllables on every speaker.
 *
 * It is an estimate. A whispered word has no f0 and will under-count; a very
 * noisy room raises the floor and can merge two syllables into one. The app
 * says so rather than pretending otherwise, and treats a count that disagrees
 * with the dictionary as a question, not a verdict.
 */

const TARGET_SR = 16000;   // everything below assumes this; f0 lags depend on it
const WIN_MS = 25;
const HOP_MS = 10;
const F0_MIN = 70;
const F0_MAX = 350;

/* ---- resampling ---------------------------------------------------------
 * Linear interpolation is enough: we only ever look at energy envelopes and
 * an autocorrelation peak, neither of which cares about the imaging artefacts
 * a better resampler would remove. */
function resample(input, fromRate, toRate) {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const pos = i * ratio;
    const j = Math.floor(pos);
    const frac = pos - j;
    const a = input[j] || 0;
    const b = input[j + 1] !== undefined ? input[j + 1] : a;
    out[i] = a + (b - a) * frac;
  }
  return out;
}

function frameEnergyDb(x, sr) {
  const win = Math.round((WIN_MS / 1000) * sr);
  const hop = Math.round((HOP_MS / 1000) * sr);
  const n = Math.max(0, Math.floor((x.length - win) / hop) + 1);
  const db = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    const s = i * hop;
    for (let k = 0; k < win; k++) { const v = x[s + k]; sum += v * v; }
    const rms = Math.sqrt(sum / win);
    db[i] = 20 * Math.log10(rms + 1e-10);
  }
  return db;
}

function smooth(arr, radius) {
  const out = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    let sum = 0, n = 0;
    for (let k = -radius; k <= radius; k++) {
      const j = i + k;
      if (j >= 0 && j < arr.length) { sum += arr[j]; n++; }
    }
    out[i] = sum / n;
  }
  return out;
}

function percentile(arr, p) {
  const s = Array.from(arr).sort((a, b) => a - b);
  if (!s.length) return 0;
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}

/* ---- f0 by normalised autocorrelation -----------------------------------
 * Returns f0 per frame (0 = unvoiced). Computed on a 40 ms window so that the
 * lowest expected pitch still fits nearly three periods inside it. */
function pitchTrack(x, sr, nFrames) {
  const hop = Math.round((HOP_MS / 1000) * sr);
  const win = Math.round(0.040 * sr);
  const minLag = Math.floor(sr / F0_MAX);
  const maxLag = Math.floor(sr / F0_MIN);
  const f0 = new Float32Array(nFrames);

  for (let i = 0; i < nFrames; i++) {
    const s = i * hop;
    if (s + win >= x.length) break;

    let energy = 0;
    for (let k = 0; k < win; k++) energy += x[s + k] * x[s + k];
    if (energy < 1e-7) continue;                   // silence: leave unvoiced

    let bestLag = 0, bestVal = 0;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let num = 0, d1 = 0, d2 = 0;
      // step 2 samples: halves the cost, and the peak is broad enough to survive
      for (let k = 0; k + lag < win; k += 2) {
        const a = x[s + k], b = x[s + k + lag];
        num += a * b; d1 += a * a; d2 += b * b;
      }
      const denom = Math.sqrt(d1 * d2) + 1e-10;
      const r = num / denom;
      if (r > bestVal) { bestVal = r; bestLag = lag; }
    }
    // 0.35 is deliberately permissive. A missed voiced frame costs a syllable;
    // a spurious one only softens a boundary.
    if (bestVal > 0.35 && bestLag > 0) f0[i] = sr / bestLag;
  }
  return f0;
}

/* ---- syllable nuclei ---------------------------------------------------- */
function findNuclei(env, f0, peakFloorDb) {
  const MIN_DIP_DB = 4;      // a dip shallower than this is one syllable, not two
  const MIN_SEP_FRAMES = 9;  // 90 ms — faster than any real syllable rate
  const cands = [];

  for (let i = 1; i < env.length - 1; i++) {
    if (env[i] > env[i - 1] && env[i] >= env[i + 1] && env[i] > peakFloorDb) {
      cands.push(i);
    }
  }

  const kept = [];
  for (const c of cands) {
    if (!f0[c]) continue;                                   // unvoiced: not a vowel
    const last = kept[kept.length - 1];
    if (last === undefined) { kept.push(c); continue; }
    if (c - last < MIN_SEP_FRAMES) {
      if (env[c] > env[last]) kept[kept.length - 1] = c;     // keep the louder one
      continue;
    }
    let dip = Infinity;
    for (let j = last; j <= c; j++) dip = Math.min(dip, env[j]);
    if (Math.min(env[last], env[c]) - dip >= MIN_DIP_DB) kept.push(c);
    else if (env[c] > env[last]) kept[kept.length - 1] = c;
  }
  return kept;
}

/* Boundaries are the energy minima between neighbouring nuclei. Rough, but the
 * only thing they feed is nPVI, which is a ratio of adjacent durations and so
 * tolerates a boundary being a frame or two out. */
function boundariesFor(nuclei, env, startF, endF) {
  if (!nuclei.length) return [];
  const bounds = [startF];
  for (let i = 0; i + 1 < nuclei.length; i++) {
    let lo = nuclei[i], best = nuclei[i], bestV = Infinity;
    for (let j = lo; j <= nuclei[i + 1]; j++) {
      if (env[j] < bestV) { bestV = env[j]; best = j; }
    }
    bounds.push(best);
  }
  bounds.push(endF);
  return bounds;
}

/* normalised Pairwise Variability Index — the standard number for telling a
 * stress-timed rhythm from a syllable-timed one. English lands roughly in the
 * 55-70 band; syllable-timed languages sit near 40. */
function nPVI(durations) {
  if (durations.length < 2) return null;
  let sum = 0, n = 0;
  for (let i = 0; i + 1 < durations.length; i++) {
    const a = durations[i], b = durations[i + 1];
    const mean = (a + b) / 2;
    if (mean <= 0) continue;
    sum += Math.abs(a - b) / mean;
    n++;
  }
  return n ? (100 * sum) / n : null;
}

/**
 * @param {Float32Array} samples mono PCM
 * @param {number} sampleRate
 */
export function analyze(samples, sampleRate) {
  const x = resample(samples, sampleRate, TARGET_SR);
  const sr = TARGET_SR;
  const db = frameEnergyDb(x, sr);

  if (db.length < 5) {
    return { ok: false, reason: 'too-short' };
  }

  const env = smooth(db, 2);                       // ~50 ms window
  const floor = percentile(env, 0.10);             // noise floor estimate
  const peak = percentile(env, 0.98);
  const snr = peak - floor;

  // Below ~12 dB of range there is no usable speech: either the mic is muted
  // or the room is louder than the speaker. Saying so beats scoring noise.
  if (snr < 12) return { ok: false, reason: 'too-quiet', snr };

  const speechThresh = floor + Math.max(8, snr * 0.35);
  let startF = 0, endF = env.length - 1;
  while (startF < env.length && env[startF] < speechThresh) startF++;
  while (endF > startF && env[endF] < speechThresh) endF--;
  if (endF - startF < 4) return { ok: false, reason: 'too-short' };

  const f0 = pitchTrack(x, sr, env.length);
  const nucleiAll = findNuclei(env, f0, speechThresh);
  const nuclei = nucleiAll.filter((i) => i >= startF && i <= endF);

  const bounds = boundariesFor(nuclei, env, startF, endF);
  const durations = [];
  for (let i = 0; i + 1 < bounds.length; i++) {
    durations.push((bounds[i + 1] - bounds[i]) * HOP_MS);
  }

  // Prominence: the three cues the phonetics literature actually lists for
  // English stress — length, loudness, pitch. Each normalised to 0..1 across
  // this utterance so that a quiet speaker is compared only against himself.
  const prom = nuclei.map((idx, i) => {
    const loud = env[idx];
    const dur = durations[i] || 0;
    let pitchSum = 0, pitchN = 0;
    for (let j = Math.max(0, idx - 2); j <= Math.min(f0.length - 1, idx + 2); j++) {
      if (f0[j]) { pitchSum += f0[j]; pitchN++; }
    }
    return { loud, dur, pitch: pitchN ? pitchSum / pitchN : 0 };
  });

  /* Each cue is a deviation from this utterance's own mean, divided by a fixed
   * perceptual reference — 6 dB, one mean syllable length, three semitones.
   *
   * Not min-max normalised, and that is the whole point. Stretching the cues
   * to fill 0..1 makes three identical syllables look as though one of them
   * won by a mile, so a speaker who level-stresses every syllable — the exact
   * Nepali pattern this app exists to catch — would be told confidently which
   * syllable he stressed. Against a fixed scale, a flat word scores flat, and
   * `stressMargin` stays comparable from one attempt to the next.        */
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  const mean = (a) => a.reduce((n, v) => n + v, 0) / Math.max(1, a.length);

  let stressIndex = -1, stressScores = [];
  if (prom.length) {
    const mDb = mean(prom.map((p) => p.loud));
    const mDur = mean(prom.map((p) => p.dur)) || 1;
    const voicedF0 = prom.map((p) => p.pitch).filter((f) => f > 0);
    const mF0 = voicedF0.length ? mean(voicedF0) : 0;

    stressScores = prom.map((p) => {
      const L = clamp((p.loud - mDb) / 6);
      const D = clamp((p.dur - mDur) / mDur);
      const P = mF0 && p.pitch ? clamp((12 * Math.log2(p.pitch / mF0)) / 3) : 0;
      return 0.40 * L + 0.35 * D + 0.25 * P;
    });
    stressIndex = stressScores.indexOf(Math.max(...stressScores));
  }

  // How decided the winner is, now in those same real units. A flat profile is
  // the level-stress pattern the paper describes, and is worth reporting even
  // when the argmax happens to land on the right syllable.
  const sorted = [...stressScores].sort((a, b) => b - a);
  const stressMargin = sorted.length > 1 ? sorted[0] - sorted[1] : 1;

  let voiced = 0;
  for (let i = startF; i <= endF; i++) if (f0[i]) voiced++;
  const voicedRatio = voiced / Math.max(1, endF - startF + 1);

  // A released final stop shows as a short burst after the last nucleus.
  const tailStart = nuclei.length ? nuclei[nuclei.length - 1] : startF;
  let tailMax = -Infinity;
  for (let i = tailStart; i <= endF; i++) tailMax = Math.max(tailMax, env[i]);
  const tailFrames = endF - tailStart;
  const finalReleased = tailFrames >= 4 && tailMax > floor + 6;

  const durationMs = (endF - startF + 1) * HOP_MS;

  return {
    ok: true,
    durationMs,
    syllables: nuclei.length,
    nucleiMs: nuclei.map((i) => (i - startF) * HOP_MS),
    syllableDurations: durations,
    stressIndex,
    stressScores,
    stressMargin,
    npvi: nPVI(durations),
    rate: nuclei.length / (durationMs / 1000),
    voicedRatio,
    finalReleased,
    snr,
    // kept for the waveform strip in the UI
    envelope: Array.from(env.slice(startF, endF + 1)),
    envFloor: floor,
    envPeak: peak,
  };
}

/* Pull mono Float32 out of a recorded Blob without assuming a sample rate.
 *
 * Takes a context rather than making one. It used to make its own and close it
 * per call, which is the textbook shape and is wrong here: browsers cap the
 * number of hardware AudioContexts (six, in Chrome) and release closed ones
 * lazily, so a few takes in a row exhaust the pool and the constructor throws.
 * The caller owns one context for the life of the page and passes it in. */
export async function decodeBlob(blob, ctx) {
  const buf = await blob.arrayBuffer();
  if (!buf.byteLength) throw new Error('empty recording');
  if (ctx) {
    const audio = await ctx.decodeAudioData(buf);
    return { samples: new Float32Array(audio.getChannelData(0)), sampleRate: audio.sampleRate };
  }
  // Standalone fallback, so the module still works without a caller-owned one.
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const own = new Ctx();
  try {
    const audio = await own.decodeAudioData(buf);
    return { samples: new Float32Array(audio.getChannelData(0)), sampleRate: audio.sampleRate };
  } finally {
    own.close();
  }
}
