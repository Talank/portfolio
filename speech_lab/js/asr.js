/* Speech Lab — the recogniser and the reference voice.
 *
 * The recogniser is the intelligibility oracle. It is not a pronunciation
 * scorer and is not used as one: the only question asked of it is "did an
 * American English recogniser hear the word you were trying to say", which is
 * a fair proxy for whether a person would have. When it hears something else,
 * *what* it heard is the diagnosis — "sink" and "tink" are different failures
 * of /θ/ and want different instructions.
 *
 * Two honest caveats, both surfaced in the UI rather than buried here:
 *   1. Chrome's Web Speech API sends audio to Google. Nothing else in this app
 *      leaves the browser, but that does.
 *   2. Its language model will sometimes repair you — a near miss inside a
 *      sentence can be silently corrected into the word you meant. That is why
 *      single words are the default drill: less context, less repair.
 */

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

export const asrAvailable = !!SR;

/**
 * Listen once and resolve with { transcript, alternatives, confidence }.
 * Never rejects on a recognition error — an empty result is a legitimate
 * outcome ("nothing intelligible was heard") and the coach handles it.
 */
let active = null;

export function listenOnce({ lang = 'en-US', maxAlternatives = 5 } = {}) {
  return new Promise((resolve) => {
    if (!SR) { resolve({ unavailable: true, alternatives: [] }); return; }

    /* Only one recognition may exist at a time. A second start() while the
     * previous one is still winding down throws InvalidStateError, which the
     * old code caught and reported as "nothing was heard" — so the second take
     * in a row looked like a failed attempt rather than a busy microphone. */
    if (active) { try { active.abort(); } catch (e) {} active = null; }

    const rec = new SR();
    active = rec;
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = maxAlternatives;

    let settled = false;
    let guard = null;
    const done = (v) => {
      if (settled) return;
      settled = true;
      if (guard) clearTimeout(guard);
      if (active === rec) active = null;
      resolve(v);
    };

    rec.onresult = (e) => {
      const res = e.results[0];
      const alts = [];
      for (let i = 0; i < res.length; i++) {
        alts.push({ text: res[i].transcript.trim(), confidence: res[i].confidence });
      }
      done({
        transcript: alts[0] ? alts[0].text : '',
        confidence: alts[0] ? alts[0].confidence : 0,
        alternatives: alts,
      });
    };
    rec.onerror = (e) => done({ error: e.error, alternatives: [] });
    rec.onend = () => done({ transcript: '', alternatives: [] });

    const begin = (retry) => {
      try { rec.start(); } catch (err) {
        // The abort above is asynchronous, so the engine can still be busy for
        // a tick. One retry clears it in practice; if it still refuses, say so
        // rather than letting it be mistaken for silence.
        if (retry) setTimeout(() => begin(false), 250);
        else done({ error: 'busy', alternatives: [] });
      }
    };
    begin(true);

    // Chrome sometimes never fires onend if the mic is contended. A ceiling
    // keeps the drill loop from hanging on it.
    guard = setTimeout(() => { try { rec.stop(); } catch (e) {} }, 8000);
  });
}

/* ---- comparison ---------------------------------------------------------- */

export function normalise(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n];
}

export function similarity(a, b) {
  const A = normalise(a), B = normalise(b);
  if (!A && !B) return 1;
  const d = levenshtein(A, B);
  return 1 - d / Math.max(A.length, B.length, 1);
}

/**
 * Decide what the recogniser's answer means for this target.
 * Returns { verdict, matchedAlt, heard, confusion, wordDiff }.
 *   verdict: 'match' | 'near' | 'confused' | 'miss' | 'silent' | 'unavailable'
 */
export function judge(target, asr) {
  if (asr.unavailable) return { verdict: 'unavailable' };
  if (asr.error && asr.error !== 'no-speech') return { verdict: 'error', error: asr.error };

  const alts = asr.alternatives || [];
  if (!alts.length || !normalise(alts[0].text)) return { verdict: 'silent' };

  const T = normalise(target);

  // Any alternative that is an exact hit counts. The recogniser routinely
  // ranks the right word second when the vowel is slightly off, and calling
  // that a failure would be harsher than a listener would be.
  for (let i = 0; i < alts.length; i++) {
    if (normalise(alts[i].text) === T) {
      return { verdict: i === 0 ? 'match' : 'near', heard: alts[0].text, rank: i, matchedAlt: alts[i] };
    }
  }

  const heard = alts[0].text;
  const sim = similarity(T, heard);

  return {
    verdict: sim > 0.72 ? 'near' : 'confused',
    heard,
    similarity: sim,
    wordDiff: diffWords(T, normalise(heard)),
    all: alts.map((a) => a.text),
  };
}

/* Which words of a sentence came back wrong — the sentence-level equivalent of
 * "it heard sink". Positional rather than aligned, which is enough while the
 * lengths are close and is honest about it when they are not. */
function diffWords(target, heard) {
  const T = target.split(' '), H = heard.split(' ');
  const out = [];
  for (let i = 0; i < T.length; i++) {
    const h = H[i];
    if (h === undefined) out.push({ want: T[i], got: null });
    else if (h !== T[i] && similarity(T[i], h) < 0.8) out.push({ want: T[i], got: h });
  }
  return out;
}

/* ---- the reference voice -------------------------------------------------
 * speechSynthesis, not a recorded human. ELSA uses real native recordings and
 * is right to: a synthetic voice models the segments well and the rhythm only
 * approximately. It is used here because it costs nothing to ship and works
 * for any word the deck grows, and the UI labels it as synthetic. */

let voices = [];
function loadVoices() {
  voices = (window.speechSynthesis ? speechSynthesis.getVoices() : []) || [];
  return voices;
}
if (window.speechSynthesis) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

const PREFERRED = [
  'Google US English', 'Samantha', 'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Jenny Online (Natural) - English (United States)', 'Alex', 'Microsoft Zira',
];

export function americanVoices() {
  return loadVoices().filter((v) => /^en[-_]US/i.test(v.lang));
}

export function pickVoice(name) {
  const us = americanVoices();
  if (name) { const hit = us.find((v) => v.name === name); if (hit) return hit; }
  for (const p of PREFERRED) { const hit = us.find((v) => v.name === p); if (hit) return hit; }
  return us[0] || null;
}

export function speak(text, { rate = 1, voiceName = null } = {}) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(false); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = rate;
    const v = pickVoice(voiceName);
    if (v) u.voice = v;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    speechSynthesis.speak(u);
  });
}
